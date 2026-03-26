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

const channels: ChannelItem[] = [
  { id: "x", title: "X", subtitle: "Profile", bgColor: "#000000", iconName: "logo-twitter" },
  { id: "linkedin", title: "LinkedIn", subtitle: "Profile", bgColor: "#0A66C2", iconName: "logo-linkedin" },
  { id: "linkedin-page", title: "LinkedIn Page", subtitle: "Page", bgColor: "#0A66C2", iconName: "logo-linkedin" },
  { id: "reddit", title: "Reddit", subtitle: "Profile", bgColor: "#FF4500", iconName: "logo-reddit" },
  { id: "instagram-business", title: "Instagram", subtitle: "Facebook Business", bgColor: "#D62976", iconName: "logo-instagram" },
  { id: "instagram", title: "Instagram", subtitle: "Standalone", bgColor: "#D62976", iconName: "logo-instagram" },
  { id: "facebook", title: "Facebook Page", subtitle: "Page", bgColor: "#1877F2", iconName: "logo-facebook" },
  { id: "threads", title: "Threads", subtitle: "Profile", bgColor: "#303030", iconName: "at-outline" },
  { id: "youtube", title: "YouTube", subtitle: "Channel", bgColor: "#FF0000", iconName: "logo-youtube" },
  { id: "google-business", title: "Google My Business", subtitle: "Profile", bgColor: "#4285F4", iconName: "business-outline" },
  { id: "tiktok", title: "TikTok", subtitle: "Profile", bgColor: "#000000", iconName: "logo-tiktok" },
  { id: "pinterest", title: "Pinterest", subtitle: "Profile", bgColor: "#BD081C", iconName: "logo-pinterest" },
  { id: "dribbble", title: "Dribbble", subtitle: "Profile", bgColor: "#EA4C89", iconName: "logo-dribbble" },
  { id: "discord", title: "Discord", subtitle: "Server", bgColor: "#5865F2", iconName: "logo-discord" },
  { id: "slack", title: "Slack", subtitle: "Workspace", bgColor: "#611f69", iconName: "chatbox-outline" },
  { id: "kick", title: "Kick", subtitle: "Channel", bgColor: "#53FC18", iconName: "play-outline" },
  { id: "twitch", title: "Twitch", subtitle: "Channel", bgColor: "#9146FF", iconName: "logo-twitch" },
  { id: "mastodon", title: "Mastodon", subtitle: "Profile", bgColor: "#6364FF", iconName: "globe-outline" },
  { id: "bluesky", title: "Bluesky", subtitle: "Profile", bgColor: "#0080FF", iconName: "paper-plane-outline" },
  { id: "lemmy", title: "Lemmy", subtitle: "Profile", bgColor: "#00BC8C", iconName: "chatbubbles-outline" },
  { id: "farcaster", title: "Farcaster", subtitle: "Profile", bgColor: "#8A63D2", iconName: "radio-outline" },
  { id: "telegram", title: "Telegram", subtitle: "Channel", bgColor: "#0088CC", iconName: "send-outline" },
  { id: "nostr", title: "Nostr", subtitle: "Profile", bgColor: "#8B5CF6", iconName: "key-outline" },
  { id: "vk", title: "VK", subtitle: "Profile", bgColor: "#0077FF", iconName: "globe-outline" },
  { id: "medium", title: "Medium", subtitle: "Profile", bgColor: "#000000", iconName: "reader-outline" },
  { id: "devto", title: "Dev.to", subtitle: "Profile", bgColor: "#0A0A0A", iconName: "code-slash-outline" },
  { id: "hashnode", title: "Hashnode", subtitle: "Blog", bgColor: "#2962FF", iconName: "newspaper-outline" },
  { id: "wordpress", title: "WordPress", subtitle: "Blog", bgColor: "#21759B", iconName: "globe-outline" },
  { id: "listmonk", title: "ListMonk", subtitle: "Newsletter", bgColor: "#0055D4", iconName: "mail-outline" },
  { id: "moltbook", title: "Moltbook", subtitle: "Profile", bgColor: "#8B0000", iconName: "book-outline" },
  { id: "whop", title: "Whop", subtitle: "Store", bgColor: "#FF6B6B", iconName: "storefront-outline" },
  { id: "skool", title: "Skool", subtitle: "Community", bgColor: "#0066FF", iconName: "school-outline" },
  { id: "mewe", title: "MeWe", subtitle: "Profile", bgColor: "#00B0FF", iconName: "people-outline" },
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
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top", "bottom"]}>
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
        contentContainerClassName="gap-2 pb-5"
        showsVerticalScrollIndicator={false}
      >
        {channels.map((channel) => (
          <ChannelRow key={channel.id} channel={channel} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
