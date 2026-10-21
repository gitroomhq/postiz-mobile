import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";

import { showToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth-store";

// Landing target for the postiz://auth/callback OAuth deep link on Android.
// Completes the code exchange itself — the openAuthSessionAsync promise in
// auth-store can resolve as "dismissed" before this link arrives, so this
// route is the reliable completion path. completeOAuth deduplicates if the
// promise path got there first.
export default function AuthCallback() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const completeOAuth = useAuthStore((state) => state.completeOAuth);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      if (!code) {
        router.replace("/(auth)");
        return;
      }
      const result = await completeOAuth(code);
      if (!result.ok) {
        showToast(result.error, "error");
        router.replace("/(auth)");
        return;
      }
      if (result.needsRegistration) {
        router.replace({
          pathname: "/(auth)/signup",
          params: { provider: "GOOGLE", providerToken: result.providerToken },
        } as any);
      }
      // On success AuthGate routes to (tabs) / subscribe-required.
    };
    void run();
  }, [code, completeOAuth, router]);

  return (
    <View className="flex-1 items-center justify-center bg-[#1A1919]">
      <ActivityIndicator size="large" color="#612BD3" />
    </View>
  );
}
