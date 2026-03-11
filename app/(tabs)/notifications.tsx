import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Social = "x" | "tiktok" | "instagram" | "pinterest";

type NotificationItem = {
  id: string;
  social: Social;
  avatar: string;
  networkLabel: string;
  link: string;
  date: string;
  time: string;
  unread?: boolean;
};

const notificationsByDay: { title: string; items: NotificationItem[] }[] = [
  {
    title: "Today",
    items: [
      {
        id: "today-1",
        social: "x",
        avatar: "https://i.pravatar.cc/64?img=11",
        networkLabel: "X",
        link: "https://twitter.com/wichedguro/st...",
        date: "25 February, 2026",
        time: "10:30 am",
        unread: true,
      },
      {
        id: "today-2",
        social: "instagram",
        avatar: "https://i.pravatar.cc/64?img=16",
        networkLabel: "Instagram",
        link: "https://instagram.com/p/abc...",
        date: "25 February, 2026",
        time: "9:15 am",
        unread: true,
      },
      {
        id: "today-3",
        social: "tiktok",
        avatar: "https://i.pravatar.cc/64?img=17",
        networkLabel: "Tiktok",
        link: "https://tiktok.com/tiktok...",
        date: "25 February, 2026",
        time: "8:00 am",
        unread: true,
      },
    ],
  },
  {
    title: "February 24",
    items: [
      {
        id: "feb24-1",
        social: "tiktok",
        avatar: "https://i.pravatar.cc/64?img=12",
        networkLabel: "Tiktok",
        link: "https://tiktok.com/tiktok...",
        date: "24 February, 2026",
        time: "10:30 am",
        unread: false,
      },
      {
        id: "feb24-2",
        social: "instagram",
        avatar: "https://i.pravatar.cc/64?img=13",
        networkLabel: "Instagram",
        link: "https://instagram.com...",
        date: "24 February, 2026",
        time: "10:30 am",
        unread: false,
      },
      {
        id: "feb24-3",
        social: "x",
        avatar: "https://i.pravatar.cc/64?img=18",
        networkLabel: "X",
        link: "https://twitter.com/wichedguro/po...",
        date: "24 February, 2026",
        time: "3:45 pm",
        unread: false,
      },
    ],
  },
  {
    title: "February 22",
    items: [
      {
        id: "feb22-1",
        social: "pinterest",
        avatar: "https://i.pravatar.cc/64?img=14",
        networkLabel: "Pinterest",
        link: "https://pinterest.com/...",
        date: "22 February, 2026",
        time: "10:30 am",
        unread: false,
      },
      {
        id: "feb22-2",
        social: "tiktok",
        avatar: "https://i.pravatar.cc/64?img=15",
        networkLabel: "Tiktok",
        link: "https://tiktok.com/tiktok...",
        date: "22 February, 2026",
        time: "10:30 am",
        unread: false,
      },
    ],
  },
  {
    title: "February 20",
    items: [
      {
        id: "feb20-1",
        social: "x",
        avatar: "https://i.pravatar.cc/64?img=19",
        networkLabel: "X",
        link: "https://twitter.com/wichedguro/st...",
        date: "20 February, 2026",
        time: "2:00 pm",
        unread: false,
      },
      {
        id: "feb20-2",
        social: "instagram",
        avatar: "https://i.pravatar.cc/64?img=20",
        networkLabel: "Instagram",
        link: "https://instagram.com/p/xyz...",
        date: "20 February, 2026",
        time: "11:30 am",
        unread: false,
      },
      {
        id: "feb20-3",
        social: "pinterest",
        avatar: "https://i.pravatar.cc/64?img=21",
        networkLabel: "Pinterest",
        link: "https://pinterest.com/pin/...",
        date: "20 February, 2026",
        time: "9:00 am",
        unread: false,
      },
    ],
  },
];

function SocialBadge({ social }: { social: Social }) {
  const map: Record<Social, { bg: string; icon: keyof typeof Ionicons.glyphMap }> = {
    x: { bg: "#000000", icon: "logo-twitter" },
    tiktok: { bg: "#000000", icon: "logo-tiktok" },
    instagram: { bg: "#D62976", icon: "logo-instagram" },
    pinterest: { bg: "#BD081C", icon: "logo-pinterest" },
  };

  return (
    <View
      className="absolute h-4 w-4 items-center justify-center rounded-[4px]"
      style={{ bottom: -3, right: -3, backgroundColor: map[social].bg }}
    >
      <Ionicons name={map[social].icon} size={10} color="#FFFFFF" />
    </View>
  );
}

function NotificationCard({ item }: { item: NotificationItem }) {
  return (
    <View className="w-full flex-row items-center gap-2 rounded-[10px] bg-channel-active-bg p-3">
      <View className="flex-1 flex-row items-start gap-4">
        <View className="relative">
          <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40, borderRadius: 8 }} resizeMode="cover" />
          <SocialBadge social={item.social} />
        </View>

        <View className="flex-1 gap-2">
          <Text numberOfLines={2} className="font-jakarta text-[13px] font-medium text-text-primary">
            <Text>Your post has been published on </Text>
            <Text className="font-jakarta font-bold">{item.networkLabel}</Text>
            <Text> at </Text>
            <Text className="text-main-accent-blue">{item.link}</Text>
          </Text>

          <View className="flex-row items-center gap-1">
            <Text className="font-jakarta text-[10px] font-medium leading-[15px] text-text-secondary">
              {item.date}
            </Text>
            <Text className="font-jakarta text-[10px] font-medium leading-[15px] text-text-secondary">
              •
            </Text>
            <Text className="font-jakarta text-[10px] font-medium leading-[15px] text-text-secondary">
              {item.time}
            </Text>
          </View>
        </View>
      </View>

      <View className="w-6 items-center justify-center">
        {item.unread ? <View className="h-2 w-2 rounded-full bg-main-accent-pink" /> : null}
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-main-sections" edges={["top"]}>
      <StatusBar style="light" />

      <View className="h-[60px] flex-row items-center justify-between px-4">
        <Pressable className="h-6 w-6 items-center justify-center" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#A3A3A3" />
        </Pressable>
        <Text className="font-jakarta text-h2 font-semibold text-text-primary">Notifications</Text>
        <View className="h-6 w-6" />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {notificationsByDay.map((section, index) => (
          <View key={section.title} style={index > 0 ? { marginTop: 20 } : undefined}>
            <Text className="font-jakarta text-[14px] font-semibold text-text-primary">{section.title}</Text>
            <View style={{ marginTop: 8, gap: 8 }}>
              {section.items.map((item) => (
                <NotificationCard key={item.id} item={item} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
