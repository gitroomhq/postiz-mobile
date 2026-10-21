import { useRouter } from "expo-router";
import { Pressable } from "react-native";

import { Image } from "@/components/ui/image";
import { useUnreadCount } from "@/store/notifications-store";

export const NOTIFICATION_BELL_ICON_SIZE = 24;

type NotificationBellButtonProps = {
  hasUnread?: boolean;
  onPress?: () => void;
};

export function NotificationBellButton({ hasUnread, onPress }: NotificationBellButtonProps) {
  const router = useRouter();
  const unreadCount = useUnreadCount();
  const showUnreadState = hasUnread ?? unreadCount > 0;

  return (
    <Pressable
      className="h-6 w-6 items-center justify-center"
      hitSlop={8}
      onPress={onPress ?? (() => router.push("/notifications"))}
    >
      <Image
        source={
          showUnreadState
            ? require("@/assets/icons/notification-bell.svg")
            : require("@/assets/icons/notification-bell-empty.svg")
        }
        style={{
          width: NOTIFICATION_BELL_ICON_SIZE,
          height: NOTIFICATION_BELL_ICON_SIZE,
        }}
        contentFit="contain"
      />
    </Pressable>
  );
}
