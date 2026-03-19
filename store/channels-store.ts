import { create } from "zustand";

import { NETWORK_CHARACTER_LIMITS } from "@/constants/networks";
import { CHANNELS_LIST } from "@/data/mock-channels";
import type { Channel } from "@/types";

type ChannelsState = {
  channels: Channel[];

  addChannel: (channel: Channel) => void;
  deleteChannel: (id: string) => void;
};

export const useChannelsStore = create<ChannelsState>((set) => ({
  channels: CHANNELS_LIST,

  addChannel: (channel) =>
    set((state) => ({ channels: [...state.channels, channel] })),

  deleteChannel: (id) =>
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== id),
    })),
}));

export function getChannelLimit(channel: Channel): number {
  return NETWORK_CHARACTER_LIMITS[channel.network];
}
