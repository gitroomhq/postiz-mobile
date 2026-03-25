import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ChannelAvatar } from "@/components/ui/channel-avatar";
import { CheckBox } from "@/components/ui/check-box";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { Channel } from "@/types";

import {
  DELAY_OPTIONS,
  REPEAT_OPTIONS,
  TAG_COLOR_OPTIONS,
  type ComposerTag,
  type SettingsSheet,
} from "./constants";
import { DropUpSelect } from "./drop-up-select";

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function SettingsRow({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      className="flex-row items-center gap-3 py-2"
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        className={destructive ? "text-text-critical" : "text-icon-muted"}
      />
      <View className="flex-1 flex-row items-center justify-between">
        <Text
          className={`font-jakarta text-h4 font-semibold ${
            destructive ? "text-text-critical" : "text-text-primary"
          }`}
        >
          {label}
        </Text>
        {!destructive ? (
          <Ionicons name="chevron-forward" size={18} className="text-icon-muted" />
        ) : null}
      </View>
    </Pressable>
  );
}

function TagBadge({ label, color }: { label: string; color: string }) {
  return (
    <View
      className="self-start rounded-[6px] px-3 pb-[6px] pt-1"
      style={{ backgroundColor: color }}
    >
      <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
        {label}
      </Text>
    </View>
  );
}

function RadioButton({ selected }: { selected: boolean }) {
  return (
    <View
      className={`h-6 w-6 items-center justify-center rounded-full border ${
        selected ? "border-[#FC69FF]" : "border-white/[0.18]"
      }`}
      style={{ borderWidth: 1.5 }}
    >
      {selected ? <View className="h-3 w-3 rounded-full bg-[#FC69FF]" /> : null}
    </View>
  );
}

export type SettingsSheetContentProps = {
  activeSheet: SettingsSheet;
  onNavigate: (sheet: SettingsSheet) => void;

  networkTitle: string;
  carousel: boolean;
  onToggleCarousel: () => void;
  reposters: boolean;
  onToggleReposters: () => void;
  delay: string;
  onDelayChange: (value: string) => void;
  focusedChannel: Channel | null;

  repeatValue: string;
  onRepeatChange: (value: string) => void;

  tags: ComposerTag[];
  onToggleTag: (id: string) => void;
  newTagName: string;
  onNewTagNameChange: (name: string) => void;
  newTagColor: string;
  onNewTagColorChange: (color: string) => void;
  onSaveNewTag: () => void;
  onOpenNewTag: () => void;

  onDeletePost: () => void;
  bottomInset: number;
};

export function SettingsSheetContent({
  activeSheet,
  onNavigate,
  networkTitle,
  carousel,
  onToggleCarousel,
  reposters,
  onToggleReposters,
  delay,
  onDelayChange,
  focusedChannel,
  repeatValue,
  onRepeatChange,
  tags,
  onToggleTag,
  newTagName,
  onNewTagNameChange,
  newTagColor,
  onNewTagColorChange,
  onSaveNewTag,
  onOpenNewTag,
  onDeletePost,
  bottomInset,
}: SettingsSheetContentProps) {
  const [hueBarWidth, setHueBarWidth] = useState(0);
  const [gradientSize, setGradientSize] = useState({ width: 0, height: 0 });

  const hsv = hexToHsv(newTagColor);
  const pureHueColor = hsvToHex(hsv.h, 1, 1);

  const handleHueTouch = useCallback(
    (e: GestureResponderEvent) => {
      if (hueBarWidth === 0) return;
      const x = Math.max(0, Math.min(e.nativeEvent.locationX, hueBarWidth));
      const hue = (x / hueBarWidth) * 360;
      onNewTagColorChange(hsvToHex(hue, 1, 1));
    },
    [hueBarWidth, onNewTagColorChange],
  );

  const handleGradientTouch = useCallback(
    (e: GestureResponderEvent) => {
      if (gradientSize.width === 0 || gradientSize.height === 0) return;
      const x = Math.max(0, Math.min(e.nativeEvent.locationX, gradientSize.width));
      const y = Math.max(0, Math.min(e.nativeEvent.locationY, gradientSize.height));
      const s = x / gradientSize.width;
      const v = 1 - y / gradientSize.height;
      onNewTagColorChange(hsvToHex(hsv.h, s, v));
    },
    [gradientSize, hsv.h, onNewTagColorChange],
  );

  const onHueBarLayout = useCallback((e: LayoutChangeEvent) => {
    setHueBarWidth(e.nativeEvent.layout.width);
  }, []);

  const onGradientLayout = useCallback((e: LayoutChangeEvent) => {
    setGradientSize({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    });
  }, []);

  if (!activeSheet) return null;

  if (activeSheet === "main") {
    return (
      <View>
        <View className="px-4 pb-3 pt-1">
          <Text className="font-jakarta text-h2 font-semibold text-text-primary">
            Settings
          </Text>
        </View>

        <View className="gap-5 px-4 pb-6 pt-4">
          <SettingsRow
            icon="settings-outline"
            label={networkTitle}
            onPress={() => onNavigate("network")}
          />
          <SettingsRow
            icon="pricetag-outline"
            label="Add Tag"
            onPress={() => onNavigate("tags")}
          />
          <SettingsRow
            icon="repeat-outline"
            label="Repeat Post"
            onPress={() => onNavigate("repeat")}
          />

          <SettingsRow
            icon="trash-outline"
            label="Delete Post"
            destructive
            onPress={onDeletePost}
          />
        </View>
      </View>
    );
  }

  if (activeSheet === "repeat") {
    return (
      <View>
        <View className="px-4 pb-3 pt-1">
          <Text className="font-jakarta text-h2 font-semibold text-text-primary">
            Repeat Post
          </Text>
        </View>

        <View
          className="gap-2 px-4"
          style={{ paddingTop: 20, paddingBottom: Math.max(bottomInset, 34) + 30 }}
        >
          {REPEAT_OPTIONS.map((option) => {
            const selected = option === repeatValue;

            return (
              <Pressable
                key={option}
                className="min-h-12 flex-row items-center justify-between rounded-[8px] px-3 py-3"
                onPress={() => onRepeatChange(option)}
              >
                <Text className="font-jakarta text-body-1 text-text-primary">{option}</Text>
                <RadioButton selected={selected} />
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  if (activeSheet === "network") {
    return (
      <View>
        <View className="px-4 pb-3 pt-1">
          <Text className="font-jakarta text-h2 font-semibold text-text-primary">
            {networkTitle}
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-4 pb-5 pt-4"
        >
          <View className="gap-3">
            <View className="flex-row items-center gap-2 py-2">
              <CheckBox checked={carousel} onPress={onToggleCarousel} />
              <Text className="font-jakarta text-[14px] text-text-primary">
                Post as image carousel
              </Text>
            </View>

            <View
              className="pt-4"
              style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" }}
            >
              <View className="flex-row items-start justify-between py-2">
                <Text className="font-jakarta text-[14px] text-text-primary">
                  Add Re-posters
                </Text>
                <ToggleSwitch value={reposters} onPress={onToggleReposters} />
              </View>

              {reposters ? (
                <View className="mt-4 gap-4">
                  <View className="gap-2">
                    <Text className="font-jakarta text-[14px] font-semibold text-text-primary">
                      Delay
                    </Text>
                    <DropUpSelect
                      value={delay}
                      options={DELAY_OPTIONS}
                      onSelect={onDelayChange}
                    />
                  </View>

                  <View className="gap-3">
                    <Text className="font-jakarta text-[14px] font-semibold text-text-primary">
                      Account that will engage
                    </Text>
                    {focusedChannel ? (
                      <View
                        className="items-center justify-center rounded-full border-[1.5px] border-main-accent-purple p-[3px] self-start"
                      >
                        <ChannelAvatar
                          avatar={focusedChannel.avatar}
                          network={focusedChannel.network}
                          size={36}
                          allowBadgeOverflow
                        />
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>

        <View
          className="justify-center px-4"
          style={{ paddingBottom: Math.max(bottomInset, 34) + 10, paddingTop: 6 }}
        >
          <Pressable
            className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
            onPress={() => onNavigate("main")}
          >
            <Text className="font-jakarta text-button font-semibold text-white">
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (activeSheet === "tags") {
    return (
      <View>
        <View className="px-4 pb-3 pt-1">
          <Text className="font-jakarta text-h2 font-semibold text-text-primary">
            Add Tag
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-6 px-4 pb-4 pt-4"
          className="max-h-[300px]"
        >
          {tags.map((tag) => (
            <View key={tag.id} className="flex-row items-center justify-between">
              <TagBadge label={tag.label} color={tag.color} />
              <CheckBox checked={tag.selected} onPress={() => onToggleTag(tag.id)} />
            </View>
          ))}
        </ScrollView>

        <View className="gap-3 px-4 pt-1" style={{ paddingBottom: Math.max(bottomInset, 34) + 10 }}>
          <Pressable
            className="h-11 flex-row items-center justify-center gap-2 rounded-[8px] bg-buttons-secondary-bg"
            onPress={onOpenNewTag}
          >
            <Ionicons name="add" size={18} className="text-white" />
            <Text className="font-jakarta text-button font-semibold text-white">
              Add New Tag
            </Text>
          </Pressable>

          <Pressable
            className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
            onPress={() => onNavigate("main")}
          >
            <Text className="font-jakarta text-button font-semibold text-white">
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // new-tag sheet
  return (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-4 py-5">
        <Text className="font-jakarta text-h2 font-semibold text-text-primary">
          New Tag
        </Text>
        <Pressable
          className="h-8 w-8 items-center justify-center"
          onPress={() => onNavigate("tags")}
        >
          <Ionicons name="close" size={20} className="text-icon-muted" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="px-4 pb-4"
      >
        <View className="gap-5">
          <View className="gap-2">
            <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
              Name
            </Text>
            <TextInput
              className="h-[52px] rounded-[10px] border border-input-stroke-default bg-background-primary px-4 font-jakarta text-body-1 text-text-primary"
              placeholder="New"
              placeholderTextColor="#8D8B8B"
              value={newTagName}
              onChangeText={onNewTagNameChange}
            />
          </View>

          <View className="gap-3">
            <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
              Color
            </Text>

            <View className="gap-5">
              <View
                className="overflow-hidden rounded-[10px] border border-white/[0.08]"
                onLayout={onGradientLayout}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleGradientTouch}
                onResponderMove={handleGradientTouch}
              >
                <LinearGradient
                  colors={["#FFFFFF", pureHueColor]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-[255px]"
                >
                  <LinearGradient
                    colors={["transparent", "#000000"]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    className="flex-1"
                  />
                </LinearGradient>
                <View
                  className="absolute h-[34px] w-[34px] rounded-full border-4 border-white"
                  pointerEvents="none"
                  style={{
                    backgroundColor: newTagColor,
                    left: hsv.s * gradientSize.width - 17,
                    top: (1 - hsv.v) * gradientSize.height - 17,
                  }}
                />
              </View>

              <View
                onLayout={onHueBarLayout}
                onStartShouldSetResponder={() => true}
                onMoveShouldSetResponder={() => true}
                onResponderGrant={handleHueTouch}
                onResponderMove={handleHueTouch}
              >
                <LinearGradient
                  colors={["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF", "#FF0000"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  className="h-[14px] rounded-full"
                />
                <View
                  className="absolute h-7 w-7 rounded-full border-[6px] border-white"
                  pointerEvents="none"
                  style={{
                    top: -6,
                    left: (hsv.h / 360) * hueBarWidth - 14,
                    backgroundColor: pureHueColor,
                  }}
                />
              </View>

              <View className="flex-row items-center gap-3">
                <View
                  className="h-6 w-6 rounded-[5px]"
                  style={{ backgroundColor: newTagColor }}
                />
                <Text className="font-jakarta text-h4 font-semibold text-text-primary">
                  {newTagColor}
                </Text>
              </View>

              <View className="flex-row items-center gap-3">
                {TAG_COLOR_OPTIONS.map((color) => (
                  <Pressable
                    key={color}
                    className={`h-9 w-9 rounded-full border-2 ${
                      newTagColor === color ? "border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onPress={() => onNewTagColorChange(color)}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View className="px-5 pt-3" style={{ paddingBottom: Math.max(bottomInset, 34) + 10 }}>
        <Pressable
          className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
          onPress={onSaveNewTag}
        >
          <Text className="font-jakarta text-button font-semibold text-white">
            Save Tag
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
