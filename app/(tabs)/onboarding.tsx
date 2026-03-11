import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View className="flex-1 overflow-hidden bg-background-primary">
        <View className="flex-1 px-4 pt-6 pb-[140px]">
          <View className="h-[380px] w-full rounded-[8px]">
            <View style={{ position: "absolute", left: 27.4, top: 78.16, width: 288.209, height: 225.673 }}>
              <Image
                source={require("@/assets/images/onboarding/highlight.svg")}
                style={{ position: "absolute", left: 78.12, top: 6.92, width: 201.958, height: 202.905 }}
                contentFit="contain"
              />

              <View style={{ position: "absolute", left: 29.89, top: 74.53, width: 91.606, height: 91.606, alignItems: "center", justifyContent: "center" }}>
                <View className="h-[73.865px] w-[73.865px] items-center justify-center overflow-hidden rounded-[19.033px] bg-channel-active-bg" style={{ transform: [{ rotate: "-16.27deg" }] }}>
                  <Image
                    source={require("@/assets/images/onboarding/reddit-icon.svg")}
                    style={{ width: 48.99, height: 43.94 }}
                    contentFit="contain"
                  />
                </View>
              </View>

              <View style={{ position: "absolute", left: 177.63, top: 80.24, width: 63.616, height: 63.616, alignItems: "center", justifyContent: "center" }}>
                <View className="h-[51.942px] w-[51.942px] items-center justify-center overflow-hidden rounded-[13.595px] bg-channel-active-bg" style={{ transform: [{ rotate: "15deg" }] }}>
                  <Image
                    source={require("@/assets/images/onboarding/facebook-icon.svg")}
                    style={{ width: 22.27, height: 41.45 }}
                    contentFit="contain"
                  />
                </View>
              </View>

              <View style={{ position: "absolute", left: 93.21, top: 107.35 }}>
                <View className="h-[99.609px] w-[99.609px] items-center justify-center overflow-hidden rounded-[27.19px] bg-input-stroke-default">
                  <Image
                    source={require("@/assets/images/onboarding/instagram-icon.svg")}
                    style={{ width: 65.698, height: 65.7 }}
                    contentFit="contain"
                  />
                </View>
              </View>
            </View>

            <View style={{ position: "absolute", left: -64.85, top: 5.81, width: 180.336, height: 180.336, alignItems: "center", justifyContent: "center" }}>
              <View className="h-[151.159px] w-[151.159px] items-center justify-center overflow-hidden rounded-[24px] bg-surface-deep" style={{ transform: [{ rotate: "12.52deg" }] }}>
                <Image
                  source={require("@/assets/images/onboarding/youtube-icon.svg")}
                  style={{ width: 90.52, height: 63.02 }}
                  contentFit="contain"
                />
              </View>
            </View>

            <View style={{ position: "absolute", left: 277.6, top: 232.76, width: 107.147, height: 107.147, alignItems: "center", justifyContent: "center" }}>
              <View className="h-[87.485px] w-[87.485px] items-center justify-center overflow-hidden rounded-[16px] bg-channel-active-bg" style={{ transform: [{ rotate: "-15deg" }] }}>
                <Image
                  source={require("@/assets/images/onboarding/tiktok-icon.svg")}
                  style={{ width: 51.93, height: 54.38 }}
                  contentFit="contain"
                />
              </View>
            </View>
          </View>

          <View className="mt-6 w-full items-center justify-center gap-3">
            <Text className="w-[244.879px] text-center font-jakarta text-2xl font-semibold leading-8 text-text-primary">
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
            onPress={() => router.push("/(tabs)/add-channel")}
          />
          <View className="mt-3">
            <AppButton
              label="I'll Do It Later"
              variant="text"
              onPress={() => router.replace("/(tabs)")}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
