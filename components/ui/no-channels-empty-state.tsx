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
        <View style={{ position: "absolute", left: 57.46, top: 5.09, width: 148.556, height: 149.252 }}>
          <Image
            source={require("@/assets/images/onboarding/highlight.svg")}
            style={{ width: 148.556, height: 149.252 }}
            contentFit="contain"
          />
        </View>

        <View style={{ position: "absolute", left: 21.99, top: 54.82, width: 67.383, height: 67.383, alignItems: "center", justifyContent: "center" }}>
          <View className="h-[54.334px] w-[54.334px] items-center justify-center overflow-hidden rounded-[14px] bg-channel-active-bg" style={{ transform: [{ rotate: "-16.27deg" }] }}>
            <Image
              source={require("@/assets/images/onboarding/reddit-icon.svg")}
              style={{ width: 36.07, height: 32.36 }}
              contentFit="contain"
            />
          </View>
        </View>

        <View style={{ position: "absolute", left: 130.66, top: 59.02, width: 46.795, height: 46.795, alignItems: "center", justifyContent: "center" }}>
          <View className="h-[38.208px] w-[38.208px] items-center justify-center overflow-hidden rounded-[10px] bg-channel-active-bg" style={{ transform: [{ rotate: "15deg" }] }}>
            <Image
              source={require("@/assets/images/onboarding/facebook-icon.svg")}
              style={{ width: 16.39, height: 30.5 }}
              contentFit="contain"
            />
          </View>
        </View>

        <View style={{ position: "absolute", left: 68.56, top: 78.96 }}>
          <View className="h-[73.27px] w-[73.27px] items-center justify-center overflow-hidden rounded-[20px] bg-input-stroke-default">
            <Image
              source={require("@/assets/images/onboarding/instagram-icon.svg")}
              style={{ width: 48.326, height: 48.328 }}
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
