import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type NoChannelsEmptyStateProps = {
  onAddChannel: () => void;
};

export function NoChannelsEmptyState({ onAddChannel }: NoChannelsEmptyStateProps) {
  return (
    <View className="w-full items-center gap-8 px-4">
      <View className="h-[166px] w-[212px]">
        <View className="absolute left-[57px] top-[5px] w-[149px] h-[149px]">
          <Image
            source={require("@/assets/icons/onboarding/highlight.svg")}
            className="w-[149px] h-[149px]"
            contentFit="contain"
          />
        </View>

        <View className="absolute left-[22px] top-[55px] w-[67px] h-[67px] items-center justify-center">
          <View className="h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-[14px] bg-channel-active-bg rotate-[-16.27deg]">
            <Image
              source={require("@/assets/icons/onboarding/reddit-icon.svg")}
              className="w-[36px] h-[32px]"
              contentFit="contain"
            />
          </View>
        </View>

        <View className="absolute left-[131px] top-[59px] w-[47px] h-[47px] items-center justify-center">
          <View className="h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-[10px] bg-channel-active-bg rotate-[15deg]">
            <Image
              source={require("@/assets/icons/onboarding/facebook-icon.svg")}
              className="w-[16px] h-[30.5px]"
              contentFit="contain"
            />
          </View>
        </View>

        <View className="absolute left-[69px] top-[79px]">
          <View className="h-[73px] w-[73px] items-center justify-center overflow-hidden rounded-[20px] bg-input-stroke-default">
            <Image
              source={require("@/assets/icons/onboarding/instagram-icon.svg")}
              className="w-[48px] h-[48px]"
              contentFit="contain"
            />
          </View>
        </View>
      </View>

      <View className="w-[343px] items-center gap-3">
        <Text className="w-[271px] text-center font-jakarta text-2xl font-semibold text-text-primary">
          No channels connected yet
        </Text>
        <Text className="w-full text-center font-jakarta text-sm text-[rgba(255,255,255,0.6)]">
          Connect your social accounts to start scheduling, publishing, and analyzing - all in one place.
        </Text>
      </View>

      <Pressable
        className="h-11 w-[300px] flex-row items-center justify-center gap-2 rounded-[8px] bg-buttons-primary-bg px-4"
        onPress={onAddChannel}
      >
        <Ionicons name="add" size={20} className="text-white" />
        <Text className="font-jakarta text-[15px] font-semibold text-buttons-primary-text">
          Add Channel
        </Text>
      </Pressable>
    </View>
  );
}
