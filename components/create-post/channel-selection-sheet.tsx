import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { ChannelAvatar } from "@/components/ui/channel-avatar";
import type { Channel } from "@/types";

export function ChannelSelectionSheet({
  isVisible,
  channels,
  selectedChannelIds,
  onSave,
  onClose,
  onAddChannel,
  bottomInset,
}: {
  isVisible: boolean;
  channels: Channel[];
  selectedChannelIds: string[];
  onSave: (channelIds: string[]) => void;
  onClose: () => void;
  onAddChannel?: () => void;
  bottomInset: number;
}) {
  const { height: windowHeight } = useWindowDimensions();
  const [localSelection, setLocalSelection] = useState<string[]>(selectedChannelIds);

  useEffect(() => {
    if (isVisible) {
      setLocalSelection(selectedChannelIds);
    }
  }, [isVisible, selectedChannelIds]);

  const toggleChannel = (channelId: string) => {
    setLocalSelection((prev) =>
      prev.includes(channelId)
        ? prev.filter((id) => id !== channelId)
        : [...prev, channelId],
    );
  };

  const handleDone = () => {
    onSave(localSelection);
    onClose();
  };

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      showHandle={false}
      containerStyle={{
        backgroundColor: "#1A1919",
        paddingHorizontal: 0,
        paddingTop: 0,
        height: windowHeight * 0.93,
      }}
    >
      <View className="flex-1 bg-background-primary">
        <View className="flex-row items-center justify-between px-4 py-5">
          <Text className="font-jakarta text-h2 font-semibold text-text-primary">
            Select Channels
          </Text>
          <Pressable
            className="h-8 w-8 items-center justify-center"
            onPress={onClose}
          >
            <Ionicons name="close" size={20} className="text-icon-primary" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-4"
        >
          {channels.map((channel) => {
            const selected = localSelection.includes(channel.id);

            return (
              <Pressable
                key={channel.id}
                className="flex-row items-center justify-between py-2"
                onPress={() => toggleChannel(channel.id)}
              >
                <View className="flex-row items-center gap-3">
                  <ChannelAvatar
                    avatar={channel.avatar}
                    network={channel.network}
                    size={40}
                  />
                  <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
                    {channel.name}
                  </Text>
                </View>

                <View
                  className={`h-5 w-5 items-center justify-center rounded-[6px] border ${
                    selected
                      ? "border-main-accent-purple bg-main-accent-purple"
                      : "border-[#3F3E3E] bg-main-sections"
                  }`}
                >
                  {selected ? (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      className="text-white"
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="gap-3 bg-background-primary px-5 pb-3 pt-3">
          <Pressable
            className="h-11 flex-row items-center justify-center gap-2 rounded-[8px] bg-buttons-tertiary-bg"
            onPress={() => onAddChannel?.()}
          >
            <Ionicons name="add" size={18} className="text-white" />
            <Text className="font-jakarta text-button font-semibold text-text-primary">
              Add Channel
            </Text>
          </Pressable>

          <Pressable
            className={`h-11 items-center justify-center rounded-[8px] ${
              localSelection.length > 0
                ? "bg-buttons-primary-bg"
                : "bg-buttons-disabled-bg"
            }`}
            disabled={localSelection.length === 0}
            onPress={handleDone}
          >
            <Text
              className={`font-jakarta text-button font-semibold ${
                localSelection.length > 0
                  ? "text-white"
                  : "text-buttons-disabled-text"
              }`}
            >
              Done
            </Text>
          </Pressable>
        </View>
      </View>
    </BottomSheetWrapper>
  );
}
