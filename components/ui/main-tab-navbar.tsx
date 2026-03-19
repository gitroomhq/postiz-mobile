import { Image as ExpoImage, type ImageProps } from "expo-image";
import { useRouter } from "expo-router";
import type { FC } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// expo-image Image is a class component — cast to FC so React 19 JSX types accept it
const Image = ExpoImage as unknown as FC<ImageProps>;

type TabName = "calendar" | "channels" | "analytics" | "settings";

type MainTabNavbarProps = {
  activeTab: TabName;
};

type MenuButtonProps = {
  activeIconSource: any;
  inactiveIconSource: any;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function MenuButton({
  activeIconSource,
  inactiveIconSource,
  active = false,
  onPress,
  style,
}: MenuButtonProps) {
  return (
    <Pressable
      className={`h-11 w-11 items-center justify-center ${active ? "rounded-[8px] bg-buttons-menu-bg-active" : "rounded-[12px]"}`}
      onPress={onPress}
      style={style}
    >
      <Image
        source={active ? activeIconSource : inactiveIconSource}
        style={{ width: 24, height: 24 }}
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
          style={{ position: "absolute", left: 24.76, top: 12 }}
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
          style={{ position: "absolute", left: 95.51, top: 12 }}
        />

        <Pressable
          className="absolute h-11 w-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
          style={{ left: 165.76, top: 12 }}
          onPress={() => router.push("/(tabs)/add-channel")}
        >
          <Image source={require("@/assets/icons/navbar/plus.svg")} style={{ width: 20, height: 20 }} contentFit="contain" />
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
          style={{ position: "absolute", left: 236.5, top: 12 }}
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
          style={{ position: "absolute", left: 307.76, top: 12 }}
        />

      </View>
    </View>
  );
}
