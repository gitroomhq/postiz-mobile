import { create } from "zustand";

import { NETWORK_CHARACTER_LIMITS } from "@/constants/networks";
import { CHANNELS_LIST } from "@/data/mock-channels";
import type { Channel } from "@/types";

type ChannelsState = {
  channels: Channel[];
  error: string | null;

  addChannel: (channel: Channel) => void;
  deleteChannel: (id: string) => void;
  clearError: () => void;
};

export const useChannelsStore = create<ChannelsState>((set, get) => ({
  channels: CHANNELS_LIST,
  error: null,

  addChannel: (channel) => {
    if (!channel.id || !channel.network) {
      set({ error: "Channel must have an id and network." });
      return;
    }
    if (get().channels.some((c) => c.id === channel.id)) {
      set({ error: `Channel with id "${channel.id}" already exists.` });
      return;
    }
    set((state) => ({ channels: [...state.channels, channel], error: null }));
  },

  deleteChannel: (id) => {
    if (!get().channels.some((c) => c.id === id)) {
      set({ error: `Channel "${id}" not found.` });
      return;
    }
    set((state) => ({
      channels: state.channels.filter((c) => c.id !== id),
      error: null,
    }));
  },

  clearError: () => set({ error: null }),
}));

export function getChannelLimit(channel: Channel): number {
  return NETWORK_CHARACTER_LIMITS[channel.network];
}
