import { Image } from "expo-image";
import { View } from "react-native";

type OnboardingIconsProps = {
  /** When true, renders a smaller version suitable for inline empty states */
  compact?: boolean;
};

export function OnboardingIcons({ compact = false }: OnboardingIconsProps) {
  if (compact) {
    return (
      <View className="h-[220px] w-full">
        <View className="absolute left-[27px] top-[20px] w-[288px] h-[180px]">
          <Image
            source={require("@/assets/icons/onboarding/highlight.svg")}
            className="absolute left-[78px] top-[0px] w-[150px] h-[150px]"
            contentFit="contain"
          />
          <View className="absolute left-[30px] top-[50px] items-center justify-center">
            <View className="h-[56px] w-[56px] items-center justify-center overflow-hidden rounded-[14px] bg-channel-active-bg rotate-[-16.27deg]">
              <Image source={require("@/assets/icons/onboarding/reddit-icon.svg")} className="w-[36px] h-[32px]" contentFit="contain" />
            </View>
          </View>
          <View className="absolute left-[150px] top-[55px] items-center justify-center">
            <View className="h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-[10px] bg-channel-active-bg rotate-[15deg]">
              <Image source={require("@/assets/icons/onboarding/facebook-icon.svg")} className="w-[16px] h-[30px]" contentFit="contain" />
            </View>
          </View>
          <View className="absolute left-[80px] top-[70px]">
            <View className="h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-[20px] bg-input-stroke-default">
              <Image source={require("@/assets/icons/onboarding/instagram-icon.svg")} className="w-[50px] h-[50px]" contentFit="contain" />
            </View>
          </View>
        </View>
        <View className="absolute top-[0px] left-[-50px] items-center justify-center">
          <View className="h-[110px] w-[110px] items-center justify-center overflow-hidden rounded-[18px] bg-surface-deep rotate-[12.52deg]">
            <Image source={require("@/assets/icons/onboarding/youtube-icon.svg")} className="w-[66px] h-[46px]" contentFit="contain" />
          </View>
        </View>
        <View className="absolute left-[230px] top-[150px] items-center justify-center">
          <View className="h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-[12px] bg-channel-active-bg -rotate-[15deg]">
            <Image source={require("@/assets/icons/onboarding/tiktok-icon.svg")} className="w-[38px] h-[40px]" contentFit="contain" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="h-[380px] w-full">
      <View className="absolute left-[27px] top-[78px] w-[288px] h-[226px]">
        <Image
          source={require("@/assets/icons/onboarding/highlight.svg")}
          className="absolute left-[78px] top-[7px] w-[202px] h-[203px]"
          contentFit="contain"
        />
        <View className="absolute left-[30px] top-[75px] w-[92px] h-[92px] items-center justify-center">
          <View className="h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-[19px] bg-channel-active-bg rotate-[-16.27deg]">
            <Image source={require("@/assets/icons/onboarding/reddit-icon.svg")} className="w-[49px] h-[44px]" contentFit="contain" />
          </View>
        </View>
        <View className="absolute left-[178px] top-[80px] w-[64px] h-[64px] items-center justify-center">
          <View className="h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[14px] bg-channel-active-bg rotate-[15deg]">
            <Image source={require("@/assets/icons/onboarding/facebook-icon.svg")} className="w-[22px] h-[41px]" contentFit="contain" />
          </View>
        </View>
        <View className="absolute left-[93px] top-[107px]">
          <View className="h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-[27px] bg-input-stroke-default">
            <Image source={require("@/assets/icons/onboarding/instagram-icon.svg")} className="w-[66px] h-[66px]" contentFit="contain" />
          </View>
        </View>
      </View>
      <View className="absolute top-[6px] left-[-65px] w-[180px] h-[180px] items-center justify-center">
        <View className="h-[151px] w-[151px] items-center justify-center overflow-hidden rounded-[24px] bg-surface-deep rotate-[12.52deg]">
          <Image source={require("@/assets/icons/onboarding/youtube-icon.svg")} className="w-[91px] h-[63px]" contentFit="contain" />
        </View>
      </View>
      <View className="absolute left-[278px] top-[233px] w-[107px] h-[107px] items-center justify-center">
        <View className="h-[87px] w-[87px] items-center justify-center overflow-hidden rounded-[16px] bg-channel-active-bg -rotate-[15deg]">
          <Image source={require("@/assets/icons/onboarding/tiktok-icon.svg")} className="w-[52px] h-[54px]" contentFit="contain" />
        </View>
      </View>
    </View>
  );
}
