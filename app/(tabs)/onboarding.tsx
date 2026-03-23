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
            <View className="absolute left-[27.4px] top-[78.16px] w-[288.209px] h-[225.673px]">
              <Image
                source={require("@/assets/icons/onboarding/highlight.svg")}
                className="absolute left-[78.12px] top-[6.92px] w-[201.958px] h-[202.905px]"
                contentFit="contain"
              />

              <View className="absolute left-[29.89px] top-[74.53px] w-[91.606px] h-[91.606px] items-center justify-center">
                <View className="h-[73.865px] w-[73.865px] items-center justify-center overflow-hidden rounded-[19.033px] bg-channel-active-bg rotate-[-16.27deg]">
                  <Image
                    source={require("@/assets/icons/onboarding/reddit-icon.svg")}
                    className="w-[48.99px] h-[43.94px]"
                    contentFit="contain"
                  />
                </View>
              </View>

              <View className="absolute left-[177.63px] top-[80.24px] w-[63.616px] h-[63.616px] items-center justify-center">
                <View className="h-[51.942px] w-[51.942px] items-center justify-center overflow-hidden rounded-[13.595px] bg-channel-active-bg rotate-[15deg]">
                  <Image
                    source={require("@/assets/icons/onboarding/facebook-icon.svg")}
                    className="w-[22.27px] h-[41.45px]"
                    contentFit="contain"
                  />
                </View>
              </View>

              <View className="absolute left-[93.21px] top-[107.35px]">
                <View className="h-[99.609px] w-[99.609px] items-center justify-center overflow-hidden rounded-[27.19px] bg-input-stroke-default">
                  <Image
                    source={require("@/assets/icons/onboarding/instagram-icon.svg")}
                    className="w-[65.698px] h-[65.7px]"
                    contentFit="contain"
                  />
                </View>
              </View>
            </View>

            <View className="absolute top-[5.81px] w-[180.336px] h-[180.336px] items-center justify-center" style={{ left: -64.85 }}>
              <View className="h-[151.159px] w-[151.159px] items-center justify-center overflow-hidden rounded-[24px] bg-surface-deep rotate-[12.52deg]">
                <Image
                  source={require("@/assets/icons/onboarding/youtube-icon.svg")}
                  className="w-[90.52px] h-[63.02px]"
                  contentFit="contain"
                />
              </View>
            </View>

            <View className="absolute left-[277.6px] top-[232.76px] w-[107.147px] h-[107.147px] items-center justify-center">
              <View className="h-[87.485px] w-[87.485px] items-center justify-center overflow-hidden rounded-[16px] bg-channel-active-bg -rotate-[15deg]">
                <Image
                  source={require("@/assets/icons/onboarding/tiktok-icon.svg")}
                  className="w-[51.93px] h-[54.38px]"
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
            onPress={() => router.push("/add-channel")}
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
