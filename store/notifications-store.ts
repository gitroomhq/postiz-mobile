import { create } from "zustand";

import { NOTIFICATIONS_BY_DAY } from "@/data/mock-notifications";
import type { NotificationItem } from "@/types";

type NotificationSection = {
  title: string;
  items: NotificationItem[];
};

type NotificationsState = {
  sections: NotificationSection[];
  error: string | null;

  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearError: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  sections: NOTIFICATIONS_BY_DAY,
  error: null,

  markAsRead: (id) => {
    const exists = get().sections.some((s) => s.items.some((i) => i.id === id));
    if (!exists) {
      set({ error: `Notification "${id}" not found.` });
      return;
    }
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === id ? { ...item, unread: false } : item,
        ),
      })),
      error: null,
    }));
  },

  markAllAsRead: () =>
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({ ...item, unread: false })),
      })),
      error: null,
    })),

  clearError: () => set({ error: null }),
}));

export const useUnreadCount = () =>
  useNotificationsStore((state) =>
    state.sections.reduce(
      (count, section) =>
        count + section.items.filter((item) => item.unread).length,
      0,
    ),
  );
