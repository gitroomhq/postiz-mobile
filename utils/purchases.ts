import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

import type { SubscriptionPeriod, SubscriptionTier } from "@/types/subscription";
import { apiFetch } from "@/utils/custom-fetch";

// RevenueCat public SDK keys (Project → API keys). Safe to ship in the binary.
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? "";
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? "";

const apiKey = Platform.select({ ios: IOS_KEY, android: ANDROID_KEY }) ?? "";

let configured = false;

export const isPurchasesAvailable = () => !!apiKey;

// Idempotent; called once from the root layout. Without a key the whole
// purchases layer is a no-op so dev builds without RevenueCat still boot.
export const configurePurchases = () => {
  if (configured || !apiKey) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  configured = true;
};

// RevenueCat app_user_id === Postiz organization id; the backend loads
// /v1/subscribers/{orgId} to decide who is subscribed.
export const identifyPurchases = async (orgId: string | undefined) => {
  if (!configured || !orgId) return;
  try {
    await Purchases.logIn(orgId);
  } catch (e) {
    if (__DEV__) console.warn("[purchases] logIn failed", e);
  }
};

export const resetPurchases = async () => {
  if (!configured) return;
  try {
    if (!(await Purchases.isAnonymous())) await Purchases.logOut();
  } catch (e) {
    if (__DEV__) console.warn("[purchases] logOut failed", e);
  }
};

export type PaywallPlan = {
  tier: SubscriptionTier;
  period: SubscriptionPeriod;
  pkg: PurchasesPackage;
  priceString: string;
  productId: string;
};

// Product ids end with <tier>.<period> or <tier>_<period>
// (com.postiz.mob.pro.yearly / postiz_pro_yearly) — same rule as the backend.
export const parseProductId = (
  productId: string,
): { tier: SubscriptionTier; period: SubscriptionPeriod } | null => {
  const parts = productId.split(/[._]/);
  const period = (parts.pop() ?? "").toUpperCase();
  const tier = (parts.pop() ?? "").toUpperCase();
  if (period !== "MONTHLY" && period !== "YEARLY") return null;
  if (!["STANDARD", "TEAM", "PRO", "ULTIMATE"].includes(tier)) return null;
  return { tier: tier as SubscriptionTier, period: period as SubscriptionPeriod };
};

const packagesToPlans = (offering: PurchasesOffering | null): PaywallPlan[] =>
  (offering?.availablePackages ?? [])
    .map((pkg) => {
      const parsed = parseProductId(pkg.product.identifier);
      if (!parsed) return null;
      return {
        ...parsed,
        pkg,
        priceString: pkg.product.priceString,
        productId: pkg.product.identifier,
      } satisfies PaywallPlan;
    })
    .filter((p): p is PaywallPlan => !!p);

export const fetchPaywallPlans = async (): Promise<PaywallPlan[]> => {
  if (!configured) return [];
  const offerings = await Purchases.getOfferings();
  return packagesToPlans(offerings.current);
};

export type SyncResult =
  | { ok: true; active: boolean }
  | { ok: false; error: string; blocked?: boolean };

// Tell the backend to re-check this org against RevenueCat right away
// (the webhook arrives too, this just avoids the wait).
export const syncPurchasesWithBackend = async (): Promise<SyncResult> => {
  try {
    const response = await apiFetch("/billing/sync", {
      method: "POST",
      body: JSON.stringify({ provider: "revenuecat" }),
    });
    const text = await response.text();
    if (!response.ok) {
      let message = text || "Sync failed";
      try {
        const parsed = JSON.parse(text);
        message = parsed?.message ?? message;
      } catch {}
      return { ok: false, error: message };
    }
    const data = text ? JSON.parse(text) : {};
    if (data?.blocked) {
      return {
        ok: false,
        blocked: true,
        error:
          "Another Postiz account with this email already has a subscription.",
      };
    }
    return { ok: true, active: !!data?.active };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
};

export type PurchaseResult =
  | { ok: true; active: boolean }
  | { ok: false; cancelled?: boolean; error: string };

export const purchasePlan = async (plan: PaywallPlan): Promise<PurchaseResult> => {
  try {
    await Purchases.purchasePackage(plan.pkg);
  } catch (e: any) {
    if (e?.userCancelled) return { ok: false, cancelled: true, error: "Cancelled" };
    return { ok: false, error: e?.message ?? "Purchase failed" };
  }
  const sync = await syncPurchasesWithBackend();
  return sync.ok ? sync : { ok: false, error: sync.error };
};

export const restorePlans = async (): Promise<PurchaseResult> => {
  try {
    await Purchases.restorePurchases();
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Restore failed" };
  }
  const sync = await syncPurchasesWithBackend();
  return sync.ok ? sync : { ok: false, error: sync.error };
};

export const getManagementUrl = async (): Promise<string | null> => {
  if (!configured) return null;
  try {
    const info: CustomerInfo = await Purchases.getCustomerInfo();
    return info.managementURL ?? null;
  } catch {
    return null;
  }
};
