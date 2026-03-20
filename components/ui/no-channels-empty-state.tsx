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
        <View className="absolute left-[57.46px] top-[5.09px] w-[148.556px] h-[149.252px]">
          <Image
            source={require("@/assets/icons/onboarding/highlight.svg")}
            className="w-[148.556px] h-[149.252px]"
            contentFit="contain"
          />
        </View>

        <View className="absolute left-[21.99px] top-[54.82px] w-[67.383px] h-[67.383px] items-center justify-center">
          <View className="h-[54.334px] w-[54.334px] items-center justify-center overflow-hidden rounded-[14px] bg-channel-active-bg rotate-[-16.27deg]">
            <Image
              source={require("@/assets/icons/onboarding/reddit-icon.svg")}
              className="w-[36.07px] h-[32.36px]"
              contentFit="contain"
            />
          </View>
        </View>

        <View className="absolute left-[130.66px] top-[59.02px] w-[46.795px] h-[46.795px] items-center justify-center">
          <View className="h-[38.208px] w-[38.208px] items-center justify-center overflow-hidden rounded-[10px] bg-channel-active-bg rotate-[15deg]">
            <Image
              source={require("@/assets/icons/onboarding/facebook-icon.svg")}
              className="w-[16.39px] h-[30.5px]"
              contentFit="contain"
            />
          </View>
        </View>

        <View className="absolute left-[68.56px] top-[78.96px]">
          <View className="h-[73.27px] w-[73.27px] items-center justify-center overflow-hidden rounded-[20px] bg-input-stroke-default">
            <Image
              source={require("@/assets/icons/onboarding/instagram-icon.svg")}
              className="w-[48.326px] h-[48.328px]"
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
