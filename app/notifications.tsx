import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Image } from "@/components/ui/image";
import { NetworkBadge } from "@/components/ui/network-badge";
import { useNotificationsStore } from "@/store/notifications-store";
import type { NotificationItem } from "@/types";

function NotificationCard({ item }: { item: NotificationItem }) {
  return (
    <View className="w-full flex-row items-center rounded-[10px] bg-channel-active-bg p-3">
      <View className="flex-1 flex-row items-start gap-3">
        <View className="relative">
          <Image
            source={{ uri: item.avatar }}
            className="h-8 w-8 rounded-[6px]"
            contentFit="cover"
          />
          <NetworkBadge network={item.social} />
        </View>

        <View className="flex-1 gap-[6px] pr-2">
          <Text
            numberOfLines={2}
            className="font-jakarta text-[13px] font-medium leading-[18px] text-text-primary"
          >
            <Text>Your post has been published on </Text>
            <Text className="font-jakarta font-bold">{item.networkLabel}</Text>
            <Text> at </Text>
            <Text className="text-main-accent-blue">{item.link}</Text>
          </Text>

          <View className="flex-row items-center gap-[5px]">
            <Text className="font-jakarta text-[10px] font-medium leading-[15px] text-text-secondary">
              {item.date}
            </Text>
            <Text className="font-jakarta text-[10px] font-medium leading-[15px] text-text-secondary">
              {"\u2022"}
            </Text>
            <Text className="font-jakarta text-[10px] font-medium leading-[15px] text-text-secondary">
              {item.time}
            </Text>
          </View>
        </View>
      </View>

      <View className="w-6 items-center justify-center self-stretch">
        {item.unread ? <View className="h-[9px] w-[9px] rounded-full bg-main-accent-pink" /> : null}
      </View>
    </View>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const sections = useNotificationsStore((state) => state.sections);

  return (
    <SafeAreaView className="flex-1 bg-main-sections" edges={["top"]}>
      <StatusBar style="light" />

      <View className="h-[60px] flex-row items-center justify-between px-4">
        <Pressable className="h-6 w-6 items-center justify-center" onPress={() => router.back()}>
          <Image
            source={require("@/assets/icons/create-post/back.svg")}
            className="h-[13.5px] w-[7.5px]"
            contentFit="contain"
          />
        </Pressable>

        <Text className="font-jakarta text-[20px] font-semibold leading-7 text-text-primary">
          Notifications
        </Text>

        <View className="h-6 w-6" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, index) => (
          <View key={section.title} className={index > 0 ? "mt-5" : undefined}>
            <Text className="font-jakarta text-[14px] font-semibold leading-5 text-text-primary">
              {section.title}
            </Text>

            <View className="mt-2 gap-2">
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
