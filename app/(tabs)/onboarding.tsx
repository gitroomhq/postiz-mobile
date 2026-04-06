import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { OnboardingIcons } from "@/components/ui/onboarding-icons";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View className="flex-1 overflow-hidden bg-background-primary">
        <View className="flex-1 px-4 pt-6 pb-[140px]">
          <OnboardingIcons />

          <View className="mt-6 w-full items-center justify-center gap-3">
            <Text className="w-[245px] text-center font-jakarta text-2xl font-semibold leading-8 text-text-primary">
              Let&apos;s Connect Your First Channel
            </Text>
            <Text className="w-[275px] text-center font-jakarta text-sm text-[rgba(255,255,255,0.6)]">
              You&apos;ll need at least one connected account to create and publish posts.
            </Text>
          </View>
        </View>

        <View className="absolute bottom-0 left-0 right-0 px-5 pb-5">
          <AppButton
            label="Connect Channels"
            onPress={() => router.push("/add-channel")}
          />
          <View className="mt-3">
            <AppButton
              label="I'll Do It Later"
              variant="text"
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)");
                }
              }}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
