import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  Text,
  View,
} from "react-native";

import { ChannelAvatar } from "@/components/ui/channel-avatar";
import { useChannelsStore } from "@/store/channels-store";
import type { Channel } from "@/types";

const ITEM_HEIGHT = 56;
const MAX_VISIBLE = 3;

export function ChannelSelector({
  selected,
  onSelect,
  onOpenChange,
}: {
  selected: Channel;
  onSelect: (channel: Channel) => void;
  onOpenChange?: (open: boolean) => void;
}) {
  const channels = useChannelsStore((state) => state.channels);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0 });

  const dropdownHeight = Math.min(channels.length, MAX_VISIBLE) * ITEM_HEIGHT + 16;

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      const statusBarOffset = Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;
      setPos({ x, y: y + height + 4 + statusBarOffset, w: width });
      setOpen(true);
      onOpenChange?.(true);
    });
  };

  const handleClose = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  return (
    <View>
      <View ref={triggerRef}>
        <Pressable
          className="h-[52px] w-full flex-row items-center justify-between rounded-[10px] border border-input-stroke-default bg-input-bg px-3"
          onPress={() => (open ? handleClose() : handleOpen())}
        >
          <View className="flex-row items-center gap-3">
            <ChannelAvatar avatar={selected.avatar} network={selected.network} size={32} allowBadgeOverflow />
            <Text className="font-jakarta text-body-1 text-text-primary">
              {selected.name}
            </Text>
          </View>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={16}
            className="text-icon-primary"
          />
        </Pressable>
      </View>

      <Modal
        visible={open}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <Pressable className="flex-1" onPress={handleClose}>
          <View
            className="rounded-[12px] bg-main-sections p-2"
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              width: pos.w,
              height: dropdownHeight,
              elevation: 2,
            }}
          >
            <FlatList
              data={channels}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: channel }) => (
                <Pressable
                  className={`flex-row items-center gap-3 rounded-[8px] px-3 ${
                    channel.id === selected.id ? "bg-channel-active-bg" : ""
                  }`}
                  style={{ height: ITEM_HEIGHT }}
                  onPress={() => {
                    onSelect(channel);
                    handleClose();
                  }}
                >
                  <ChannelAvatar avatar={channel.avatar} network={channel.network} size={32} allowBadgeOverflow />
                  <Text className="flex-1 font-jakarta text-body-1 text-text-primary">
                    {channel.name}
                  </Text>
                  {channel.id === selected.id ? (
                    <Ionicons name="checkmark" size={18} className="text-main-accent-purple" />
                  ) : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
