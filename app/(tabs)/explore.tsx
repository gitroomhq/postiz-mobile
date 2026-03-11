import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { SwipeableChannelRow } from "@/components/ui/swipeable-channel-row";

type ChannelNetwork =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "reddit"
  | "youtube"
  | "threads"
  | "bluesky";

type ChannelItem = {
  id: string;
  name: string;
  network: ChannelNetwork;
  avatar: string;
};

const initialChannels: ChannelItem[] = [
  {
    id: "1",
    name: "Hamilton Dan",
    network: "facebook",
    avatar: "https://i.pravatar.cc/80?img=11",
  },
  {
    id: "2",
    name: "Daniel Hamilton",
    network: "instagram",
    avatar: "https://i.pravatar.cc/80?img=12",
  },
  {
    id: "3",
    name: "Daniel Hamilton",
    network: "linkedin",
    avatar: "https://i.pravatar.cc/80?img=13",
  },
  {
    id: "4",
    name: "Daniel Hamilton",
    network: "reddit",
    avatar: "https://i.pravatar.cc/80?img=14",
  },
  {
    id: "5",
    name: "Hamilton Dan",
    network: "youtube",
    avatar: "https://i.pravatar.cc/80?img=15",
  },
  {
    id: "6",
    name: "Daniel Hamilton",
    network: "threads",
    avatar: "https://i.pravatar.cc/80?img=16",
  },
  {
    id: "7",
    name: "Hamilton Dan",
    network: "bluesky",
    avatar: "https://i.pravatar.cc/80?img=17",
  },
  {
    id: "8",
    name: "Daniel Hamilton",
    network: "instagram",
    avatar: "https://i.pravatar.cc/80?img=18",
  },
];

function NotificationBell() {
  return (
    <View className="h-6 w-6 items-center justify-center">
      <Ionicons name="notifications-outline" size={22} className="text-icon-primary" />
      <View className="absolute right-[2px] top-[2px] h-[6px] w-[6px] rounded-full bg-main-accent-pink" />
    </View>
  );
}

function NetworkBadge({ network }: { network: ChannelNetwork }) {
  const bgMap: Record<ChannelNetwork, string> = {
    facebook: "#1877F2",
    instagram: "#D62976",
    linkedin: "#0A66C2",
    reddit: "#FF4500",
    youtube: "#FF0000",
    threads: "#303030",
    bluesky: "#0080FF",
  };

  const iconMap: Record<ChannelNetwork, keyof typeof Ionicons.glyphMap> = {
    facebook: "logo-facebook",
    instagram: "logo-instagram",
    linkedin: "logo-linkedin",
    reddit: "logo-reddit",
    youtube: "logo-youtube",
    threads: "at-outline",
    bluesky: "paper-plane-outline",
  };

  return (
    <View
      className="absolute h-4 w-4 items-center justify-center rounded-[4px]"
      style={{ bottom: -3, right: -3, backgroundColor: bgMap[network] }}
    >
      <Ionicons name={iconMap[network]} size={11} className="text-white" />
    </View>
  );
}

function ChannelRow({ channel }: { channel: ChannelItem }) {
  return (
    <View className="w-full flex-row items-center gap-2 p-2">
      <View className="min-h-px min-w-px flex-1 flex-row items-center gap-3">
        <View className="relative">
          <Image
            source={{ uri: channel.avatar }}
            style={{ width: 40, height: 40, borderRadius: 8 }}
            resizeMode="cover"
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
  const [channels, setChannels] = useState(initialChannels);
  const [openRowId, setOpenRowId] = useState<string | null>(null);

  const handleSwipeOpen = useCallback((id: string) => {
    setOpenRowId(id);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setChannels((prev) => prev.filter((c) => c.id !== id));
    setOpenRowId(null);
  }, []);

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
            <NotificationBell />
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
