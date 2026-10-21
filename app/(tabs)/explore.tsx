import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Image } from "@/components/ui/image";
import { OnboardingIcons } from "@/components/ui/onboarding-icons";
import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { NetworkBadge } from "@/components/ui/network-badge";
import { NotificationBellButton } from "@/components/ui/notification-bell-button";
import { SwipeableChannelRow } from "@/components/ui/swipeable-channel-row";
import { useChannelsStore } from "@/store/channels-store";
import { usePostsStore } from "@/store/posts-store";
import type { Channel } from "@/types";

function ChannelRow({ channel, onCreatePost }: { channel: Channel; onCreatePost: () => void }) {
  return (
    <View className="w-full flex-row items-center gap-2 px-2 py-2">
      <View className="min-h-px min-w-px flex-1 flex-row items-center gap-3">
        <View className="relative">
          <Image
            source={{ uri: channel.avatar }}
            className="w-10 h-10 rounded-lg"
            contentFit="cover"
          />
          <NetworkBadge network={channel.network} />
        </View>

        <Text className="font-jakarta text-[14px] font-semibold text-text-primary">
          {channel.name}
        </Text>
      </View>

      <Pressable
        className="h-[34px] w-[34px] items-center justify-center rounded-[6px] bg-buttons-primary-bg"
        onPress={onCreatePost}
      >
        <Ionicons name="add" size={20} className="text-white" />
      </Pressable>
    </View>
  );
}

export default function ChannelsAddedScreen() {
  const router = useRouter();
  const channels = useChannelsStore((state) => state.channels);
  const storeDeleteChannel = useChannelsStore((state) => state.deleteChannel);
  const deletePostsByChannelId = usePostsStore((state) => state.deletePostsByChannelId);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleSwipeOpen = useCallback((id: string) => {
    setOpenRowId(id);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setDeleteTargetId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteTargetId) {
      deletePostsByChannelId(deleteTargetId);
      storeDeleteChannel(deleteTargetId);
      setOpenRowId(null);
    }
    setDeleteTargetId(null);
  }, [deleteTargetId, storeDeleteChannel, deletePostsByChannelId]);

  const cancelDelete = useCallback(() => {
    setDeleteTargetId(null);
    setOpenRowId(null);
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-background-primary"
      edges={["top"]}
    >
      <StatusBar style="light" />

      <View className="h-[60px] flex-row items-center justify-between px-4">
        <Text className="font-jakarta text-h2 font-semibold text-text-primary">
          Channels
        </Text>

        <View className="flex-row items-center gap-5">
          <Pressable
            className="h-[34px] flex-row items-center justify-center gap-2 rounded-[6px] bg-buttons-tertiary-bg px-4"
            onPress={() => router.push("/add-channel")}
          >
            <Ionicons name="add" size={16} className="text-white" />
            <Text className="font-jakarta text-[13px] font-semibold text-text-primary">
              Add Channel
            </Text>
          </Pressable>
          <NotificationBellButton />
        </View>
      </View>

      {channels.length === 0 ? (
        <View className="flex-1 overflow-hidden">
          <View className="flex-1 items-center px-5" style={{ paddingTop: 20 }}>
            <OnboardingIcons compact />
            <View className="mt-8 w-full items-center gap-2">
              <Text className="w-[245px] text-center font-jakarta text-2xl font-semibold leading-8 text-text-primary">
                Let&apos;s Connect Your First Channel
              </Text>
              <Text className="w-[275px] text-center font-jakarta text-sm text-[rgba(255,255,255,0.6)]">
                You&apos;ll need at least one connected account to create and publish posts.
              </Text>
            </View>
          </View>
          <View className="px-5" style={{ paddingBottom: 16 }}>
            <AppButton
              label="Connect Channels"
              onPress={() => router.push("/add-channel")}
            />
          </View>
        </View>
      ) : (
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
              <ChannelRow channel={channel} onCreatePost={() => router.push({ pathname: "/create-post", params: { channelId: channel.id } } as any)} />
            </SwipeableChannelRow>
          ))}
        </ScrollView>
      )}

      <MainTabNavbar activeTab="channels" />

      <ConfirmDialog
        visible={deleteTargetId !== null}
        title="Delete Channel"
        message="Are you sure you want to delete this channel?"
        confirmLabel="Yes, Delete"
        cancelLabel="No, Cancel"
        confirmDestructive
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </SafeAreaView>
  );
}
