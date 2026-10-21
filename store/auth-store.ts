import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import { create } from "zustand";

import type { Subscription } from "@/types/subscription";
import type { AuthUser } from "@/types/user";
import {
  apiFetch,
  extractAuthFromResponse,
  extractShowOrgFromResponse,
} from "@/utils/custom-fetch";
import { OAUTH_APP_SCHEME, OAUTH_BACKEND_REDIRECT } from "@/utils/env";
import { identifyPurchases, resetPurchases } from "@/utils/purchases";
import { tokenStorage } from "@/utils/token-storage";

export type AuthProvider =
  | "LOCAL"
  | "GOOGLE"
  | "GITHUB"
  | "APPLE"
  | "FARCASTER"
  | "WALLET"
  | "OAUTH";

type AuthStatus = "idle" | "authenticated" | "unauthenticated";

export type OAuthResult =
  | { ok: true; needsRegistration: false }
  | { ok: true; needsRegistration: true; providerToken: string }
  | { ok: false; error: string; cancelled?: boolean };

// The Android OAuth deep link (postiz://auth/callback) can complete the
// login through the auth/callback route while openAuthSessionAsync still
// has a pending promise (its dismiss event races the deep link). Both
// paths funnel into completeOAuth; these module-level guards make sure a
// code is exchanged exactly once and let the losing path pick up the
// winner's result.
let pendingOAuthProvider: AuthProvider = "GOOGLE";
let inFlightExchange: { code: string; promise: Promise<OAuthResult> } | null =
  null;
// Read through a function so TypeScript doesn't narrow the variable across
// awaits (it is mutated concurrently by the deep-link path).
const getInFlightExchange = () => inFlightExchange;

type AuthState = {
  status: AuthStatus;
  initializing: boolean;
  user: AuthUser | null;
  subscription: Subscription | null;
  subscriptionLoaded: boolean;
  needsActivation: boolean;

  initialize: () => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<
    { ok: true } | { ok: false; error: string; notActivated?: boolean }
  >;
  register: (input: {
    email: string;
    password: string;
    company: string;
    provider?: AuthProvider;
    providerToken?: string;
  }) => Promise<
    { ok: true; needsActivation: boolean } | { ok: false; error: string }
  >;
  forgotPassword: (email: string) => Promise<{ ok: boolean }>;
  resetPassword: (input: {
    token: string;
    password: string;
    repeatPassword: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  activate: (code: string) => Promise<{ ok: boolean }>;
  resendActivation: (email: string) => Promise<
    { ok: true; alreadyActivated?: boolean } | { ok: false; error: string }
  >;
  oauthLogin: (provider: AuthProvider) => Promise<OAuthResult>;
  appleLogin: () => Promise<OAuthResult>;
  completeOAuth: (code: string, provider?: AuthProvider) => Promise<OAuthResult>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
};

const persistAuthFromResponse = async (response: Response) => {
  const token = extractAuthFromResponse(response);
  if (token) await tokenStorage.setAuth(token);
  const org = extractShowOrgFromResponse(response);
  if (org) await tokenStorage.setShowOrg(org);
  return token;
};

const fetchSelf = async (): Promise<AuthUser | null> => {
  try {
    const response = await apiFetch("/user/self", { method: "GET" });
    if (!response.ok) return null;
    const user = (await response.json()) as AuthUser;
    await identifyPurchases(user.orgId);
    return user;
  } catch {
    return null;
  }
};

const fetchSubscription = async (): Promise<Subscription | null> => {
  try {
    const response = await apiFetch("/billing/", { method: "GET" });
    if (!response.ok) return null;
    const text = await response.text();
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      return parsed && typeof parsed === "object" ? (parsed as Subscription) : null;
    } catch {
      return null;
    }
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  initializing: true,
  user: null,
  subscription: null,
  subscriptionLoaded: false,
  needsActivation: false,

  initialize: async () => {
    set({ initializing: true });
    const token = await tokenStorage.getAuth();
    if (!token) {
      set({
        status: "unauthenticated",
        user: null,
        subscription: null,
        subscriptionLoaded: false,
        initializing: false,
      });
      return;
    }
    const user = await fetchSelf();
    if (user) {
      const subscription = await fetchSubscription();
      set({
        status: "authenticated",
        user,
        subscription,
        subscriptionLoaded: true,
        initializing: false,
      });
    } else {
      await tokenStorage.clearAll();
      set({
        status: "unauthenticated",
        user: null,
        subscription: null,
        subscriptionLoaded: false,
        initializing: false,
      });
    }
  },

  login: async ({ email, password }) => {
    try {
      const response = await apiFetch("/auth/login", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          email,
          password,
          provider: "LOCAL",
          providerToken: "",
        }),
      });

      if (response.status !== 200) {
        const message = await response.text().catch(() => "Unable to sign in");
        const notActivated = message === "User is not activated";
        return { ok: false, error: message || "Unable to sign in", notActivated };
      }

      await persistAuthFromResponse(response);
      const user = await fetchSelf();
      if (!user) {
        await tokenStorage.clearAll();
        return { ok: false, error: "Session could not be verified" };
      }
      const subscription = await fetchSubscription();
      set({
        status: "authenticated",
        user,
        subscription,
        subscriptionLoaded: true,
        needsActivation: false,
      });
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      return { ok: false, error: msg };
    }
  },

  register: async ({ email, password, company, provider = "LOCAL", providerToken = "" }) => {
    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({
          email,
          password,
          company,
          provider,
          providerToken,
        }),
      });

      if (response.status !== 200) {
        const message = await response.text().catch(() => "Unable to register");
        return { ok: false, error: message || "Unable to register" };
      }

      const activateHeader = response.headers.get("activate");
      const data = await response.json().catch(() => ({}));
      const needsActivation =
        activateHeader === "true" || (data as { activate?: boolean }).activate === true;

      if (needsActivation) {
        set({ needsActivation: true });
        return { ok: true, needsActivation: true };
      }

      await persistAuthFromResponse(response);
      const user = await fetchSelf();
      if (user) {
        const subscription = await fetchSubscription();
        set({
          status: "authenticated",
          user,
          subscription,
          subscriptionLoaded: true,
          needsActivation: false,
        });
      }
      return { ok: true, needsActivation: false };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      return { ok: false, error: msg };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await apiFetch("/auth/forgot", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email, provider: "LOCAL" }),
      });
      if (!response.ok) return { ok: false };
      const data = (await response.json().catch(() => ({}))) as { forgot?: boolean };
      return { ok: data.forgot !== false };
    } catch {
      return { ok: false };
    }
  },

  resetPassword: async ({ token, password, repeatPassword }) => {
    try {
      const response = await apiFetch("/auth/forgot-return", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ token, password, repeatPassword }),
      });
      if (!response.ok) {
        const message = await response.text().catch(() => "Unable to reset password");
        return { ok: false, error: message || "Unable to reset password" };
      }
      const data = (await response.json().catch(() => ({}))) as { reset?: boolean };
      if (!data.reset) {
        return { ok: false, error: "Your password reset link has expired" };
      }
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      return { ok: false, error: msg };
    }
  },

  activate: async (code) => {
    try {
      const response = await apiFetch("/auth/activate", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ code, datafast_visitor_id: "" }),
      });
      if (!response.ok) return { ok: false };
      const data = (await response.json().catch(() => ({}))) as { can?: boolean };
      if (!data.can) return { ok: false };

      await persistAuthFromResponse(response);
      const user = await fetchSelf();
      if (user) {
        const subscription = await fetchSubscription();
        set({
          status: "authenticated",
          user,
          subscription,
          subscriptionLoaded: true,
          needsActivation: false,
        });
      }
      return { ok: true };
    } catch {
      return { ok: false };
    }
  },

  resendActivation: async (email) => {
    try {
      const response = await apiFetch("/auth/resend-activation", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        return { ok: false, error: "Failed to resend activation email" };
      }
      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };
      if (data.success) return { ok: true };
      if (data.message === "Account is already activated") {
        return { ok: true, alreadyActivated: true };
      }
      return { ok: false, error: data.message || "Failed to resend activation email" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      return { ok: false, error: msg };
    }
  },

  oauthLogin: async (provider) => {
    try {
      pendingOAuthProvider = provider;
      inFlightExchange = null;

      const linkResponse = await apiFetch(
        `/auth/oauth/${provider}?redirect_uri=${encodeURIComponent(OAUTH_BACKEND_REDIRECT)}`,
        { method: "GET", skipAuth: true },
      );
      if (!linkResponse.ok) {
        return { ok: false, error: "Unable to start sign in" };
      }
      const authUrl = (await linkResponse.text()).trim().replace(/^"|"$/g, "");
      if (!authUrl) {
        return { ok: false, error: "Provider did not return a sign-in URL" };
      }

      const session = await WebBrowser.openAuthSessionAsync(
        authUrl,
        OAUTH_APP_SCHEME,
      );

      if (session.type === "success" && session.url) {
        const code = new URL(session.url).searchParams.get("code");
        if (!code) {
          return { ok: false, error: "Authorization code missing from callback" };
        }
        return await get().completeOAuth(code, provider);
      }

      // Android: the browser dismiss can arrive before (or instead of) the
      // success event while the deep link is completing the login through
      // the auth/callback route. Give that path a moment before reporting
      // a cancel.
      if (session.type === "cancel" || session.type === "dismiss") {
        await new Promise((resolve) => setTimeout(resolve, 2500));
        const raced = getInFlightExchange();
        if (raced) return await raced.promise;
        if (get().status === "authenticated") {
          return { ok: true, needsRegistration: false };
        }
        return { ok: false, error: "Sign in cancelled", cancelled: true };
      }

      return { ok: false, error: "Sign in was interrupted" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      return { ok: false, error: msg };
    }
  },

  appleLogin: async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        return { ok: false, error: "Apple did not return an identity token" };
      }
      pendingOAuthProvider = "APPLE";
      inFlightExchange = null;
      return await get().completeOAuth(credential.identityToken, "APPLE");
    } catch (e) {
      const code = (e as { code?: string })?.code;
      // ERR_REQUEST_UNKNOWN (ASAuthorizationError 1000) is what iOS reports
      // when the user dismisses the iCloud/Apple ID system prompt instead of
      // the auth sheet itself — treat it as a cancel, not a failure.
      if (
        code === "ERR_REQUEST_CANCELED" ||
        code === "ERR_CANCELED" ||
        code === "ERR_REQUEST_UNKNOWN"
      ) {
        return { ok: false, error: "Sign in cancelled", cancelled: true };
      }
      const msg = e instanceof Error ? e.message : "Apple sign in failed";
      return { ok: false, error: msg };
    }
  },

  completeOAuth: async (code, provider) => {
    if (inFlightExchange?.code === code) return inFlightExchange.promise;

    const exchange = async (): Promise<OAuthResult> => {
      try {
        const resolvedProvider = provider ?? pendingOAuthProvider;
        const existsResponse = await apiFetch(
          `/auth/oauth/${resolvedProvider}/exists`,
          {
            method: "POST",
            skipAuth: true,
            body: JSON.stringify({ code, redirect_uri: OAUTH_BACKEND_REDIRECT }),
          },
        );
        if (!existsResponse.ok) {
          const message = await existsResponse.text().catch(() => "OAuth failed");
          return { ok: false, error: message || "OAuth failed" };
        }

        const data = (await existsResponse.json().catch(() => ({}))) as {
          token?: string;
          login?: boolean;
        };

        if (data.token) {
          return { ok: true, needsRegistration: true, providerToken: data.token };
        }

        await persistAuthFromResponse(existsResponse);
        const user = await fetchSelf();
        if (!user) {
          await tokenStorage.clearAll();
          return { ok: false, error: "Session could not be verified" };
        }
        const subscription = await fetchSubscription();
        set({
          status: "authenticated",
          user,
          subscription,
          subscriptionLoaded: true,
          needsActivation: false,
        });
        return { ok: true, needsRegistration: false };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        return { ok: false, error: msg };
      }
    };

    const promise = exchange();
    inFlightExchange = { code, promise };
    return promise;
  },

  logout: async () => {
    await tokenStorage.clearAll();
    await resetPurchases();
    set({
      status: "unauthenticated",
      user: null,
      subscription: null,
      subscriptionLoaded: false,
      needsActivation: false,
    });
  },

  refreshUser: async () => {
    const user = await fetchSelf();
    if (user) set({ user, status: "authenticated" });
  },

  refreshSubscription: async () => {
    const subscription = await fetchSubscription();
    set({ subscription, subscriptionLoaded: true });
  },
}));
