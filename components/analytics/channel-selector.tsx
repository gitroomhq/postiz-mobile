import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { ChannelAvatar } from "@/components/ui/channel-avatar";
import { useChannelsStore } from "@/store/channels-store";
import type { Channel } from "@/types";

export function ChannelSelector({
  selected,
  onSelect,
}: {
  selected: Channel;
  onSelect: (channel: Channel) => void;
}) {
  const channels = useChannelsStore((state) => state.channels);
  const [open, setOpen] = useState(false);

  return (
    <View className="relative z-10">
      <Pressable
        className="h-[52px] w-full flex-row items-center justify-between rounded-[10px] border border-input-stroke-default bg-input-bg px-3"
        onPress={() => setOpen(!open)}
      >
        <View className="flex-row items-center gap-3">
          <ChannelAvatar avatar={selected.avatar} network={selected.network} size={32} />
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

      {open ? (
        <View
          className="absolute top-[56px] left-0 right-0 z-20 rounded-[12px] bg-main-sections p-2"
          style={{
            elevation: 10,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          {channels.map((channel) => (
            <Pressable
              key={channel.id}
              className={`flex-row items-center gap-3 rounded-[8px] px-3 py-3 ${
                channel.id === selected.id ? "bg-channel-active-bg" : ""
              }`}
              onPress={() => {
                onSelect(channel);
                setOpen(false);
              }}
            >
              <ChannelAvatar avatar={channel.avatar} network={channel.network} size={32} />
              <Text className="flex-1 font-jakarta text-body-1 text-text-primary">
                {channel.name}
              </Text>
              {channel.id === selected.id ? (
                <Ionicons name="checkmark" size={18} className="text-main-accent-purple" />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}
