import { create } from "zustand";

import { NOTIFICATIONS_BY_DAY } from "@/data/mock-notifications";
import type { NotificationItem } from "@/types";

type NotificationSection = {
  title: string;
  items: NotificationItem[];
};

type NotificationsState = {
  sections: NotificationSection[];

  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  sections: NOTIFICATIONS_BY_DAY,

  markAsRead: (id) =>
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.id === id ? { ...item, unread: false } : item,
        ),
      })),
    })),

  markAllAsRead: () =>
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        items: section.items.map((item) => ({ ...item, unread: false })),
      })),
    })),
}));

export const useUnreadCount = () =>
  useNotificationsStore((state) =>
    state.sections.reduce(
      (count, section) =>
        count + section.items.filter((item) => item.unread).length,
      0,
    ),
  );
