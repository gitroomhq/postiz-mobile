import { BACKEND_URL } from "@/utils/env";
import { tokenStorage } from "@/utils/token-storage";

export type FetchOptions = RequestInit & {
  skipAuth?: boolean;
};

const getSetCookieStrings = (headers: Headers): string[] => {
  const withGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
  };
  if (typeof withGetSetCookie.getSetCookie === "function") {
    return withGetSetCookie.getSetCookie();
  }
  const raw = headers.get("set-cookie");
  if (!raw) return [];
  return raw.split(/,(?=\s*[A-Za-z0-9!#$%&'*+.^_`|~-]+=)/);
};

const extractCookieValue = (headers: Headers, name: string) => {
  const prefix = `${name}=`;
  for (const entry of getSetCookieStrings(headers)) {
    const trimmed = entry.trim();
    if (!trimmed.startsWith(prefix)) continue;
    const raw = trimmed.slice(prefix.length).split(";")[0];
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
};

export const extractAuthFromResponse = (response: Response) => {
  return response.headers.get("auth") ?? extractCookieValue(response.headers, "auth");
};

export const extractShowOrgFromResponse = (response: Response) => {
  return (
    response.headers.get("showorg") ?? extractCookieValue(response.headers, "showorg")
  );
};

export const apiFetch = async (path: string, options: FetchOptions = {}) => {
  const { skipAuth, headers: explicitHeaders, body, ...rest } = options;

  const [auth, showorg] = skipAuth
    ? [null, null]
    : await Promise.all([
        tokenStorage.getAuth(),
        tokenStorage.getShowOrg(),
      ]);

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    // Bypass NSURLCache on iOS / OkHttp cache on Android. Postiz is an
    // authenticated, frequently-changing API — stale GET responses
    // cause the mobile app to display posts/integrations as they were
    // at the time of the cached fetch (e.g. a draft edited on web
    // shows up on mobile with its OLD channel until the cache expires).
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(auth ? { auth } : {}),
    ...(showorg ? { showorg } : {}),
    ...((explicitHeaders as Record<string, string>) ?? {}),
  };

  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;

  return fetch(url, {
    ...rest,
    body,
    headers,
    // Belt-and-suspenders with the headers above — iOS honors `cache`
    // via NSURLSession, Android via OkHttp's CacheControl.
    cache: "no-store",
  });
};
