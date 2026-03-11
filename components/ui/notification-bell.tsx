import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

export function NotificationBell() {
  return (
    <View className="h-6 w-6 items-center justify-center">
      <Ionicons name="notifications-outline" size={22} className="text-icon-primary" />
      <View className="absolute right-[2px] top-[2px] h-[6px] w-[6px] rounded-full bg-main-accent-pink" />
    </View>
  );
}
