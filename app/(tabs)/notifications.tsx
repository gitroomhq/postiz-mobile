import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage, type ImageProps } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { FC } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const Image = ExpoImage as unknown as FC<ImageProps>;
import { SafeAreaView } from "react-native-safe-area-context";

import { NetworkBadge } from "@/components/ui/network-badge";
import { NOTIFICATIONS_BY_DAY } from "@/data/mock-notifications";
import type { NotificationItem } from "@/types";

function NotificationCard({ item }: { item: NotificationItem }) {
  return (
    <View className="w-full flex-row items-center gap-2 rounded-[10px] bg-channel-active-bg p-3">
      <View className="flex-1 flex-row items-start gap-4">
        <View className="relative">
          <Image source={{ uri: item.avatar }} style={{ width: 40, height: 40, borderRadius: 8 }} contentFit="cover" />
          <NetworkBadge network={item.social} />
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
          <Ionicons name="chevron-back" size={20} className="text-icon-primary" />
        </Pressable>
        <Text className="font-jakarta text-h2 font-semibold text-text-primary">Notifications</Text>
        <View className="h-6 w-6" />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {NOTIFICATIONS_BY_DAY.map((section, index) => (
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
