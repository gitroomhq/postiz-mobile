import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Pressable, ScrollView, View } from "react-native";

import { SvgIcon } from "@/components/ui/svg-icon";

import { FORMAT_TOOLS, MEDIA_TOOLS } from "./constants";

function IconButton({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className="h-10 w-10 items-center justify-center rounded-[8px] bg-channel-active-bg"
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

export function ComposerToolbar({
  onMediaToolPress,
  onFormatPress,
  onAddPost,
  bottomInset,
}: {
  onMediaToolPress: (toolId: string) => void;
  onFormatPress: (toolId: string) => void;
  onAddPost: () => void;
  bottomInset: number;
}) {
  return (
    <View className="bg-background-primary" style={{ paddingBottom: Math.max(bottomInset, 8) }}>
      <View className="flex-row items-center gap-5 px-4 py-3">
        <View className="relative flex-1 overflow-hidden">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="items-center gap-1 pr-[66px]"
          >
            {MEDIA_TOOLS.map((tool) => (
              <IconButton key={tool.id} onPress={() => onMediaToolPress(tool.id)}>
                <SvgIcon source={tool.icon} size={20} />
              </IconButton>
            ))}

            <View className="mx-2 h-[15px] w-px bg-separator-primary" />

            <IconButton>
              <SvgIcon source={require("@/assets/icons/create-post/toolbar-signature.svg")} size={20} />
            </IconButton>

            {FORMAT_TOOLS.map((tool) => (
              <IconButton key={tool.id} onPress={() => onFormatPress(tool.id)}>
                <SvgIcon source={tool.icon} size={16} />
              </IconButton>
            ))}

            <IconButton onPress={() => onFormatPress("emoji")}>
              <Ionicons name="happy-outline" size={20} className="text-icon-primary" />
            </IconButton>
          </ScrollView>

          <LinearGradient
            colors={["rgba(26,25,25,0)", "#1A1919"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            pointerEvents="none"
            className="absolute right-0 top-0 h-10 w-[66px]"
          />
        </View>

        <Pressable
          className="h-10 w-10 items-center justify-center rounded-[8px] bg-buttons-secondary-bg"
          onPress={onAddPost}
        >
          <SvgIcon source={require("@/assets/icons/create-post/plus.svg")} size={20} />
        </Pressable>
      </View>
    </View>
  );
}
