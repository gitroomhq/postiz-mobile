import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";

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
      className="h-8 w-8 items-center justify-center rounded-[6px] bg-channel-active-bg"
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
  onReset,
  bottomInset,
  disabled = false,
  showReset = false,
}: {
  onMediaToolPress: (toolId: string) => void;
  onFormatPress: (toolId: string) => void;
  onAddPost: () => void;
  onReset?: () => void;
  bottomInset: number;
  disabled?: boolean;
  showReset?: boolean;
}) {
  const dim = 0.35;

  return (
    <View className="bg-background-primary" style={{ paddingBottom: bottomInset > 0 ? bottomInset : 0 }}>
      <View className="flex-row items-center gap-3 px-3 pt-1 pb-1">
        <View className="flex-1 flex-row items-center gap-[2px]">
          {MEDIA_TOOLS.map((tool, index) => (
            index === 0 ? (
              <IconButton key={tool.id} onPress={disabled ? undefined : () => onMediaToolPress(tool.id)}>
                <SvgIcon source={tool.icon} size={20} opacity={disabled ? dim : 1} />
              </IconButton>
            ) : (
              <IconButton key={tool.id}>
                <SvgIcon source={tool.icon} size={20} opacity={dim} />
              </IconButton>
            )
          ))}

          <View className="mx-2 h-[15px] w-px bg-separator-primary" />

          <IconButton>
            <SvgIcon source={require("@/assets/icons/create-post/toolbar-signature.svg")} size={20} opacity={dim} />
          </IconButton>

          {FORMAT_TOOLS.map((tool) => (
            <IconButton key={tool.id} onPress={disabled ? undefined : () => onFormatPress(tool.id)}>
              <SvgIcon source={tool.icon} size={16} opacity={disabled ? dim : 1} />
            </IconButton>
          ))}

          <IconButton onPress={disabled ? undefined : () => onFormatPress("emoji")}>
            <Ionicons name="happy-outline" size={20} className="text-icon-primary" style={{ opacity: disabled ? dim : 1 }} />
          </IconButton>
        </View>

        {showReset ? (
          <Pressable
            className="h-8 w-8 items-center justify-center rounded-[6px] bg-buttons-tertiary-bg"
            onPress={onReset}
          >
            <SvgIcon
              source={require("@/assets/icons/create-post/toolbar-refresh-ccw.svg")}
              size={20}
            />
          </Pressable>
        ) : null}

        <Pressable
          className={`h-8 w-8 items-center justify-center rounded-[6px] ${
            disabled ? "bg-[#3C3C3C]" : "bg-buttons-secondary-bg"
          }`}
          onPress={onAddPost}
          disabled={disabled}
        >
          <SvgIcon
            source={require("@/assets/icons/create-post/plus.svg")}
            size={20}
            tintColor={disabled ? "#9E9E9E" : undefined}
          />
        </Pressable>
      </View>
    </View>
  );
}
