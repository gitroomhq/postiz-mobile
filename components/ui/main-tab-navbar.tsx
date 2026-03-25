import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Image } from "@/components/ui/image";

type TabName = "calendar" | "channels" | "analytics" | "settings";

type MainTabNavbarProps = {
  activeTab: TabName;
};

type MenuButtonProps = {
  activeIconSource: any;
  inactiveIconSource: any;
  active?: boolean;
  onPress?: () => void;
  positionClassName?: string;
};

function MenuButton({
  activeIconSource,
  inactiveIconSource,
  active = false,
  onPress,
  positionClassName,
}: MenuButtonProps) {
  return (
    <Pressable
      className={`h-11 w-11 items-center justify-center ${active ? "rounded-[8px] bg-buttons-menu-bg-active" : "rounded-[12px]"} ${positionClassName ?? ""}`}
      onPress={onPress}
    >
      <Image
        source={active ? activeIconSource : inactiveIconSource}
        className="w-6 h-6"
        contentFit="contain"
      />
    </Pressable>
  );
}

export function MainTabNavbar({ activeTab }: MainTabNavbarProps) {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      className="w-full items-center overflow-hidden bg-main-sections-2"
      style={{ paddingBottom: bottom }}
    >
      <View className="relative h-[90px] w-[375px]">
        <MenuButton
          activeIconSource={require("@/assets/icons/navbar/calendar-active.svg")}
          inactiveIconSource={require("@/assets/icons/navbar/calendar.svg")}
          active={activeTab === "calendar"}
          onPress={() => {
            if (activeTab !== "calendar") {
              router.replace("/(tabs)");
            }
          }}
          positionClassName="absolute left-[24.76px] top-3"
        />

        <MenuButton
          activeIconSource={require("@/assets/icons/navbar/channels-active.svg")}
          inactiveIconSource={require("@/assets/icons/navbar/channels.svg")}
          active={activeTab === "channels"}
          onPress={() => {
            if (activeTab !== "channels") {
              router.replace("/(tabs)/explore");
            }
          }}
          positionClassName="absolute left-[95.51px] top-3"
        />

        <Pressable
          className="absolute left-[165.76px] top-3 h-11 w-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
          onPress={() => router.push("/add-channel")}
        >
          <Image source={require("@/assets/icons/navbar/plus.svg")} className="w-5 h-5" contentFit="contain" />
        </Pressable>

        <MenuButton
          activeIconSource={require("@/assets/icons/navbar/analytics-active.svg")}
          inactiveIconSource={require("@/assets/icons/navbar/analytics.svg")}
          active={activeTab === "analytics"}
          onPress={() => {
            if (activeTab !== "analytics") {
              router.replace("/(tabs)/analytics");
            }
          }}
          positionClassName="absolute left-[236.5px] top-3"
        />

        <MenuButton
          activeIconSource={require("@/assets/icons/navbar/settings-active.svg")}
          inactiveIconSource={require("@/assets/icons/navbar/settings.svg")}
          active={activeTab === "settings"}
          onPress={() => {
            if (activeTab !== "settings") {
              router.replace("/(tabs)/settings");
            }
          }}
          positionClassName="absolute left-[307.76px] top-3"
        />

      </View>
    </View>
  );
}
