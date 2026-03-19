import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage, type ImageProps } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { FC } from "react";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { NetworkBadge } from "@/components/ui/network-badge";
import { SwipeableChannelRow } from "@/components/ui/swipeable-channel-row";
import { useChannelsStore } from "@/store/channels-store";
import type { Channel } from "@/types";

const Image = ExpoImage as unknown as FC<ImageProps>;

function ChannelRow({ channel }: { channel: Channel }) {
  return (
    <View className="w-full flex-row items-center gap-2 py-2">
      <View className="min-h-px min-w-px flex-1 flex-row items-center gap-3">
        <View className="relative">
          <Image
            source={{ uri: channel.avatar }}
            style={{ width: 40, height: 40, borderRadius: 8 }}
            contentFit="cover"
          />
          <NetworkBadge network={channel.network} />
        </View>

        <Text className="font-jakarta text-[14px] font-semibold text-text-primary">
          {channel.name}
        </Text>
      </View>

      <Pressable className="h-[34px] w-[34px] items-center justify-center rounded-[6px] bg-buttons-primary-bg">
        <Ionicons name="add" size={20} className="text-white" />
      </Pressable>
    </View>
  );
}

export default function ChannelsAddedScreen() {
  const router = useRouter();
  const channels = useChannelsStore((state) => state.channels);
  const storeDeleteChannel = useChannelsStore((state) => state.deleteChannel);
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const handleSwipeOpen = useCallback((id: string) => {
    setOpenRowId(id);
  }, []);

  const handleDelete = useCallback((id: string) => {
    storeDeleteChannel(id);
    setOpenRowId(null);
  }, [storeDeleteChannel]);

  return (
    <SafeAreaView
      className="flex-1 bg-background-primary"
      edges={["top"]}
    >
      <StatusBar style="light" />

      <View className="h-[60px] flex-row items-center justify-between px-4">
        <Text className="font-jakarta text-[20px] font-semibold text-text-primary">
          Channels
        </Text>

        <View className="flex-row items-center gap-5">
          <Pressable
            className="h-[34px] flex-row items-center justify-center gap-2 rounded-[6px] bg-buttons-tertiary-bg px-4"
            onPress={() => router.push("/(tabs)/add-channel")}
          >
            <Ionicons name="add" size={16} className="text-white" />
            <Text className="font-jakarta text-[13px] font-semibold text-text-primary">
              Add Channel
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push("/(tabs)/notifications")}>
            <Image
              source={require("@/assets/icons/notification-bell.svg")}
              style={{ width: 24, height: 24 }}
              contentFit="contain"
            />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ gap: 4, paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {channels.map((channel) => (
          <SwipeableChannelRow
            key={channel.id}
            id={channel.id}
            isOpen={openRowId === channel.id}
            onSwipeOpen={handleSwipeOpen}
            onDelete={handleDelete}
          >
            <ChannelRow channel={channel} />
          </SwipeableChannelRow>
        ))}
      </ScrollView>

      <MainTabNavbar activeTab="channels" />
    </SafeAreaView>
  );
}
