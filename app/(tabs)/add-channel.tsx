import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ChannelItem = {
  id: string;
  title: string;
  subtitle: string;
  bgColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
};

const channelData: ChannelItem[] = [
  {
    id: "instagram",
    title: "Instagram",
    subtitle: "Profile",
    bgColor: "#D62976",
    iconName: "logo-instagram",
  },
  {
    id: "linkedin",
    title: "LinkedIn",
    subtitle: "Page or Profile",
    bgColor: "#0A66C2",
    iconName: "logo-linkedin",
  },
  {
    id: "facebook",
    title: "Facebook",
    subtitle: "Page or Group",
    bgColor: "#1877F2",
    iconName: "logo-facebook",
  },
  {
    id: "pinterest",
    title: "Pinterest",
    subtitle: "Profile",
    bgColor: "#BD081C",
    iconName: "logo-pinterest",
  },
  {
    id: "reddit",
    title: "Reddit",
    subtitle: "Profile",
    bgColor: "#FF4500",
    iconName: "logo-reddit",
  },
  {
    id: "threads",
    title: "Threads",
    subtitle: "Profile",
    bgColor: "#303030",
    iconName: "at-outline",
  },
  {
    id: "youtube",
    title: "Youtube",
    subtitle: "Channel",
    bgColor: "#FF0000",
    iconName: "logo-youtube",
  },
];

// Repeat channels to demonstrate scrolling
const channels: ChannelItem[] = [
  ...channelData,
  ...channelData.map((c) => ({ ...c, id: `${c.id}-2` })),
  ...channelData.map((c) => ({ ...c, id: `${c.id}-3` })),
  ...channelData.map((c) => ({ ...c, id: `${c.id}-4` })),
];

function ChannelRow({ channel }: { channel: ChannelItem }) {
  return (
    <Pressable className="w-full flex-row items-center justify-between rounded-[8px] border border-channel-active-bg bg-channel-active-bg p-4">
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

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top"]}>
      <StatusBar style="light" />

      <View className="h-[60px] flex-row items-center justify-between px-4">
        <Pressable
          className="h-6 w-6 items-center justify-center"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
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
        contentContainerStyle={{ gap: 8, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {channels.map((channel) => (
          <ChannelRow key={channel.id} channel={channel} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
