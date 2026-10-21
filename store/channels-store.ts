import { create } from "zustand";

import { getNetworkCharacterLimit } from "@/constants/networks";
import { fetchIntegrations, integrationToChannel } from "@/store/posts-store";
import type { Channel } from "@/types";

type ChannelsState = {
  channels: Channel[];
  loading: boolean;
  error: string | null;

  fetchChannels: () => Promise<void>;
  /** Local-only insert; real channel add goes through the backend OAuth flow. */
  addChannel: (channel: Channel) => void;
  /** Local-only remove; call the backend integrations endpoint to actually disconnect. */
  deleteChannel: (id: string) => void;
  clearError: () => void;
  reset: () => void;
};

export const useChannelsStore = create<ChannelsState>((set, get) => ({
  channels: [],
  loading: false,
  error: null,

  fetchChannels: async () => {
    set({ loading: true, error: null });
    try {
      const integrations = await fetchIntegrations();
      const channels = integrations
        .filter((i) => !i.disabled)
        .map(integrationToChannel);
      set({ channels, loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      set({ loading: false, error: msg });
    }
  },

  addChannel: (channel) => {
    if (get().channels.some((c) => c.id === channel.id)) return;
    set((state) => ({ channels: [...state.channels, channel] }));
  },

  deleteChannel: (id) => {
    set((state) => ({ channels: state.channels.filter((c) => c.id !== id) }));
  },

  clearError: () => set({ error: null }),
  reset: () => set({ channels: [], loading: false, error: null }),
}));

export function getChannelLimit(channel: Channel): number {
  return getNetworkCharacterLimit(channel.network);
}
