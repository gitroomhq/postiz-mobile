import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { NoChannelsEmptyState } from "@/components/ui/no-channels-empty-state";

function NotificationBell() {
  return (
    <View className="h-6 w-6 items-center justify-center">
      <Ionicons name="notifications-outline" size={22} className="text-icon-primary" />
      <View className="absolute right-[2px] top-[2px] h-[6px] w-[6px] rounded-full bg-main-accent-pink" />
    </View>
  );
}

export default function CalendarTabEmptyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top"]}>
      <StatusBar style="light" />

      <View className="flex-1">
        <View className="h-[60px] flex-row items-center justify-end px-4">
          <Pressable onPress={() => router.push("/(tabs)/notifications")}>
            <NotificationBell />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center pb-6">
          <NoChannelsEmptyState onAddChannel={() => router.push("/(tabs)/add-channel")} />
        </View>
      </View>

      <MainTabNavbar activeTab="calendar" />
    </SafeAreaView>
  );
}
