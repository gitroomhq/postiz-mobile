import { Ionicons } from "@expo/vector-icons";
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
  onToggleChannel,
  onClose,
  onAddChannel,
  bottomInset,
}: {
  isVisible: boolean;
  channels: Channel[];
  selectedChannelIds: string[];
  onToggleChannel: (channelId: string) => void;
  onClose: () => void;
  onAddChannel?: () => void;
  bottomInset: number;
}) {
  const { height: windowHeight } = useWindowDimensions();

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      showHandle={false}
      containerStyle={{
        backgroundColor: "#1A1919",
        paddingHorizontal: 0,
        paddingTop: 0,
        height: windowHeight * 0.95,
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
            const selected = selectedChannelIds.includes(channel.id);

            return (
              <Pressable
                key={channel.id}
                className="flex-row items-center justify-between py-2"
                onPress={() => onToggleChannel(channel.id)}
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
              selectedChannelIds.length > 0
                ? "bg-buttons-primary-bg"
                : "bg-buttons-disabled-bg"
            }`}
            disabled={selectedChannelIds.length === 0}
            onPress={onClose}
          >
            <Text
              className={`font-jakarta text-button font-semibold ${
                selectedChannelIds.length > 0
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
