import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { showToast } from "@/components/ui/toast";
import { ADD_CHANNEL_LIST, RANDOM_AVATARS, type AddChannelItem } from "@/data/mock-add-channels";
import { useChannelsStore } from "@/store/channels-store";
import type { ChannelNetwork } from "@/types";

function ChannelRow({ channel, onAdd }: { channel: AddChannelItem; onAdd: () => void }) {
  return (
    <Pressable
      className="w-full flex-row items-center justify-between rounded-[8px] border border-channel-active-bg bg-channel-active-bg p-4"
      onPress={onAdd}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-[6px]"
          style={{ backgroundColor: channel.bgColor }}
        >
          <Ionicons name={channel.iconName} size={22} className="text-white" />
        </View>

        <View className="gap-0.5">
          <Text className="font-jakarta text-[16px] font-semibold text-text-primary">
            {channel.title}
          </Text>
          <Text className="font-jakarta text-[13px] text-text-secondary">
            {channel.subtitle}
          </Text>
        </View>
      </View>

      <Ionicons name="add" size={26} className="text-main-accent-pink" />
    </Pressable>
  );
}

export default function AddChannelScreen() {
  const router = useRouter();
  const addChannel = useChannelsStore((state) => state.addChannel);
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);

  const doBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  // Animate out to the right, then actually pop the screen
  const animatedClose = useCallback(() => {
    translateX.value = withTiming(
      screenWidth,
      { duration: 280, easing: Easing.out(Easing.cubic) },
      () => {
        runOnJS(doBack)();
      },
    );
  }, [translateX, screenWidth, doBack]);

  // Intercept Android hardware back button to use our animated close
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      animatedClose();
      return true;
    });
    return () => sub.remove();
  }, [animatedClose]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleAddChannel = useCallback(
    (channel: AddChannelItem) => {
      const avatar = RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)];
      addChannel({
        id: `${channel.id}-${Date.now()}`,
        name: channel.title,
        network: channel.id as ChannelNetwork,
        avatar,
      });
      showToast(`${channel.title} channel added`, "success");
    },
    [addChannel],
  );

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <SafeAreaView className="flex-1 bg-background-primary" edges={["top", "bottom"]}>
        <StatusBar style="light" />

        <View className="h-[60px] flex-row items-center justify-between px-4">
          <Pressable
            className="h-6 w-6 items-center justify-center"
            onPress={animatedClose}
          >
            <Ionicons name="chevron-back" size={20} className="text-icon-primary" />
          </Pressable>

          <Text className="font-jakarta text-[20px] font-semibold text-text-primary">
            Add Channel
          </Text>

          <View className="h-6 w-6" />
        </View>

        <ScrollView
          className="flex-1 px-4"
          contentContainerClassName="gap-2 pb-5"
          showsVerticalScrollIndicator={false}
        >
          {ADD_CHANNEL_LIST.map((channel) => (
            <ChannelRow key={channel.id} channel={channel} onAdd={() => handleAddChannel(channel)} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}
