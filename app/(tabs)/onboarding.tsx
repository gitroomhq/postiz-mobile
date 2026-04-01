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
            <View className="absolute left-[27px] top-[78px] w-[288px] h-[226px]">
              <Image
                source={require("@/assets/icons/onboarding/highlight.svg")}
                className="absolute left-[78px] top-[7px] w-[202px] h-[203px]"
                contentFit="contain"
              />

              <View className="absolute left-[30px] top-[75px] w-[92px] h-[92px] items-center justify-center">
                <View className="h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-[19px] bg-channel-active-bg rotate-[-16.27deg]">
                  <Image
                    source={require("@/assets/icons/onboarding/reddit-icon.svg")}
                    className="w-[49px] h-[44px]"
                    contentFit="contain"
                  />
                </View>
              </View>

              <View className="absolute left-[178px] top-[80px] w-[64px] h-[64px] items-center justify-center">
                <View className="h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[14px] bg-channel-active-bg rotate-[15deg]">
                  <Image
                    source={require("@/assets/icons/onboarding/facebook-icon.svg")}
                    className="w-[22px] h-[41px]"
                    contentFit="contain"
                  />
                </View>
              </View>

              <View className="absolute left-[93px] top-[107px]">
                <View className="h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-[27px] bg-input-stroke-default">
                  <Image
                    source={require("@/assets/icons/onboarding/instagram-icon.svg")}
                    className="w-[66px] h-[66px]"
                    contentFit="contain"
                  />
                </View>
              </View>
            </View>

            <View className="absolute top-[6px] left-[-65px] w-[180px] h-[180px] items-center justify-center">
              <View className="h-[151px] w-[151px] items-center justify-center overflow-hidden rounded-[24px] bg-surface-deep rotate-[12.52deg]">
                <Image
                  source={require("@/assets/icons/onboarding/youtube-icon.svg")}
                  className="w-[91px] h-[63px]"
                  contentFit="contain"
                />
              </View>
            </View>

            <View className="absolute left-[278px] top-[233px] w-[107px] h-[107px] items-center justify-center">
              <View className="h-[87px] w-[87px] items-center justify-center overflow-hidden rounded-[16px] bg-channel-active-bg -rotate-[15deg]">
                <Image
                  source={require("@/assets/icons/onboarding/tiktok-icon.svg")}
                  className="w-[52px] h-[54px]"
                  contentFit="contain"
                />
              </View>
            </View>
          </View>

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
              onPress={() => router.replace("/(tabs)")}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
