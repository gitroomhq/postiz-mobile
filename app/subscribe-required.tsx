import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DeleteAccountDialog,
  useDeleteAccount,
} from "@/components/auth/delete-account";
import { AppButton } from "@/components/ui/app-button";
import { showToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth-store";
import type { SubscriptionPeriod, SubscriptionTier } from "@/types/subscription";
import { FRONTEND_URL } from "@/utils/env";
import {
  fetchPaywallPlans,
  isPurchasesAvailable,
  type PaywallPlan,
  purchasePlan,
  restorePlans,
} from "@/utils/purchases";

const TIER_ORDER: SubscriptionTier[] = ["STANDARD", "TEAM", "PRO", "ULTIMATE"];

const TIER_COPY: Record<SubscriptionTier, { name: string; blurb: string }> = {
  STANDARD: { name: "Standard", blurb: "5 channels · AI assistant · public API" },
  TEAM: { name: "Team", blurb: "10 channels · team members · auto post" },
  PRO: { name: "Pro", blurb: "30 channels · more AI & video generation" },
  ULTIMATE: { name: "Ultimate", blurb: "100 channels · everything unlocked" },
};

export default function SubscribeRequiredScreen() {
  const logout = useAuthStore((state) => state.logout);
  const refreshSubscription = useAuthStore((state) => state.refreshSubscription);
  const user = useAuthStore((state) => state.user);
  const deleteAccount = useDeleteAccount();

  const [plans, setPlans] = useState<PaywallPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(isPurchasesAvailable());
  const [plansError, setPlansError] = useState<string | null>(null);
  const [period, setPeriod] = useState<SubscriptionPeriod>("YEARLY");
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [busy, setBusy] = useState<"purchase" | "restore" | "refresh" | null>(null);

  const loadPlans = useCallback(async () => {
    if (!isPurchasesAvailable()) return;
    setLoadingPlans(true);
    setPlansError(null);
    try {
      const loaded = await fetchPaywallPlans();
      setPlans(loaded);
      if (!loaded.length) setPlansError("No plans available right now.");
    } catch (e) {
      setPlansError(e instanceof Error ? e.message : "Could not load plans");
    } finally {
      setLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const visiblePlans = useMemo(
    () =>
      TIER_ORDER.map((tier) =>
        plans.find((p) => p.tier === tier && p.period === period),
      ).filter((p): p is PaywallPlan => !!p),
    [plans, period],
  );

  // Fall back to a period that actually has products, and keep a tier selected.
  useEffect(() => {
    if (!plans.length) return;
    if (!plans.some((p) => p.period === period)) {
      setPeriod(plans[0].period);
      return;
    }
    if (!visiblePlans.some((p) => p.tier === selectedTier)) {
      setSelectedTier(visiblePlans[0]?.tier ?? null);
    }
  }, [plans, period, visiblePlans, selectedTier]);

  const selectedPlan = visiblePlans.find((p) => p.tier === selectedTier) ?? null;
  const hasBothPeriods =
    plans.some((p) => p.period === "MONTHLY") &&
    plans.some((p) => p.period === "YEARLY");

  const finishSync = async (
    result: Awaited<ReturnType<typeof purchasePlan>>,
    successMessage: string,
  ) => {
    if (!result.ok) {
      if (!result.cancelled) showToast(result.error, "error");
      return;
    }
    if (result.active) {
      await refreshSubscription();
      showToast(successMessage, "success");
    } else {
      showToast("No active subscription found for this account", "info");
    }
  };

  const handlePurchase = async () => {
    if (!selectedPlan || busy) return;
    setBusy("purchase");
    try {
      await finishSync(await purchasePlan(selectedPlan), "Subscription activated");
    } finally {
      setBusy(null);
    }
  };

  const handleRestore = async () => {
    if (busy) return;
    setBusy("restore");
    try {
      await finishSync(await restorePlans(), "Purchases restored");
    } finally {
      setBusy(null);
    }
  };

  const handleRefresh = async () => {
    if (busy) return;
    setBusy("refresh");
    await refreshSubscription();
    setBusy(null);
    showToast("Checked for subscription", "info");
  };

  const openWebBilling = () => {
    void WebBrowser.openBrowserAsync(`${FRONTEND_URL}/billing`);
  };

  const purchasesAvailable = isPurchasesAvailable();

  return (
    <SafeAreaView
      className="flex-1 bg-background-primary"
      edges={["top", "bottom"]}
    >
      <StatusBar style="light" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-12 pb-5 flex-grow"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8 h-[27px] w-[84px]">
          <View className="absolute inset-0 right-[70.6%]">
            <Image
              source={require("@/assets/icons/login/postiz-mark.svg")}
              className="w-[25px] h-[27px]"
              contentFit="contain"
            />
          </View>
          <View className="absolute top-[1.61%] bottom-[10.76%] left-[37.32%] right-0">
            <Image
              source={require("@/assets/icons/login/postiz-wordmark.svg")}
              className="w-[53px] h-[24px]"
              contentFit="contain"
            />
          </View>
        </View>

        <View className="gap-2 mb-6">
          <Text className="font-jakarta text-2xl font-semibold leading-8 text-text-primary">
            Choose your plan
          </Text>
          <Text className="font-jakarta text-sm leading-6 text-text-secondary">
            Your Postiz account does not have an active subscription yet.
            Pick a plan to start scheduling.
          </Text>
          {user?.email ? (
            <Text className="font-jakarta text-xs text-text-secondary">
              Signed in as {user.email}
            </Text>
          ) : null}
        </View>

        {purchasesAvailable ? (
          <View className="flex-1 gap-4">
            {hasBothPeriods ? (
              <View className="flex-row rounded-[8px] bg-main-sections-2 p-1">
                {(["MONTHLY", "YEARLY"] as SubscriptionPeriod[]).map((p) => {
                  const active = period === p;
                  return (
                    <Pressable
                      key={p}
                      onPress={() => setPeriod(p)}
                      className={`flex-1 items-center rounded-[6px] py-2 ${
                        active ? "bg-buttons-primary-bg" : ""
                      }`}
                    >
                      <Text
                        className={`font-jakarta text-sm font-semibold ${
                          active ? "text-white" : "text-text-secondary"
                        }`}
                      >
                        {p === "MONTHLY" ? "Monthly" : "Yearly"}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {loadingPlans ? (
              <View className="items-center py-10">
                <ActivityIndicator color="#612BD3" />
              </View>
            ) : plansError ? (
              <View className="items-center gap-3 py-6">
                <Text className="font-jakarta text-sm text-text-secondary text-center">
                  {plansError}
                </Text>
                <Pressable onPress={loadPlans}>
                  <Text className="font-jakarta text-sm text-text-primary underline">
                    Try again
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3">
                {visiblePlans.map((plan) => {
                  const active = plan.tier === selectedTier;
                  const copy = TIER_COPY[plan.tier];
                  return (
                    <Pressable
                      key={plan.productId}
                      onPress={() => setSelectedTier(plan.tier)}
                      disabled={!!busy}
                      className={`flex-row items-center justify-between rounded-[8px] border px-4 py-4 ${
                        active
                          ? "border-main-accent-purple bg-main-sections-2"
                          : "border-input-stroke-default bg-main-sections"
                      }`}
                    >
                      <View className="flex-1 pr-3 gap-1">
                        <Text className="font-jakarta text-base font-semibold text-text-primary">
                          {copy.name}
                        </Text>
                        <Text className="font-jakarta text-xs leading-4 text-text-secondary">
                          {copy.blurb}
                        </Text>
                      </View>
                      <View className="items-end gap-1">
                        <Text className="font-jakarta text-base font-semibold text-text-primary">
                          {plan.priceString}
                        </Text>
                        <Text className="font-jakarta text-xs text-text-secondary">
                          / {plan.period === "MONTHLY" ? "month" : "year"}
                        </Text>
                      </View>
                      {active ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#612BD3"
                          style={{ marginLeft: 10 }}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1 gap-4">
            <Text className="font-jakarta text-sm leading-6 text-text-secondary">
              In-app purchases are not available in this build. Subscribe on
              the web and tap &quot;Refresh&quot; below to continue.
            </Text>
            <AppButton label="Subscribe on the web" onPress={openWebBilling} />
          </View>
        )}

        <View className="gap-3 pt-6">
          {purchasesAvailable ? (
            <AppButton
              label={
                busy === "purchase"
                  ? "Processing..."
                  : selectedPlan
                    ? `Subscribe · ${selectedPlan.priceString}/${
                        selectedPlan.period === "MONTHLY" ? "mo" : "yr"
                      }`
                    : "Subscribe"
              }
              variant={busy || !selectedPlan ? "disabled" : "primary"}
              onPress={handlePurchase}
              disabled={!!busy || !selectedPlan}
            />
          ) : null}
          <AppButton
            label={busy === "refresh" ? "Checking..." : "Refresh"}
            variant="text"
            onPress={handleRefresh}
            disabled={!!busy}
          />
          <View className="flex-row items-center justify-center gap-6">
            {purchasesAvailable ? (
              <Pressable
                onPress={handleRestore}
                disabled={!!busy}
                className="py-2"
              >
                <Text className="font-jakarta text-sm text-text-primary underline">
                  {busy === "restore" ? "Restoring..." : "Restore purchases"}
                </Text>
              </Pressable>
            ) : null}
            <Pressable onPress={logout} className="py-2">
              <Text className="font-jakarta text-sm text-text-primary underline">
                Sign out
              </Text>
            </Pressable>
            <Pressable onPress={deleteAccount.openDialog} className="py-2">
              <Text className="font-jakarta text-sm text-text-critical underline">
                Delete account
              </Text>
            </Pressable>
          </View>
          <Text className="font-jakarta text-[11px] leading-4 text-text-tertiary text-center">
            Subscriptions renew automatically and can be managed or cancelled
            in your App Store / Google Play account settings.
          </Text>
        </View>
      </ScrollView>

      <DeleteAccountDialog
        visible={deleteAccount.dialogVisible}
        deleting={deleteAccount.deleting}
        onConfirm={deleteAccount.confirmDelete}
        onCancel={deleteAccount.closeDialog}
      />
    </SafeAreaView>
  );
}
