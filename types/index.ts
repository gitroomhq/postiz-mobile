import type { Ionicons } from "@expo/vector-icons";

export type ChannelNetwork =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "reddit"
  | "youtube"
  | "threads"
  | "bluesky"
  | "tiktok"
  | "x"
  | "pinterest";

export type Channel = {
  id: string;
  name: string;
  network: ChannelNetwork;
  avatar: string;
};

export type NotificationItem = {
  id: string;
  social: ChannelNetwork;
  avatar: string;
  networkLabel: string;
  link: string;
  date: string;
  time: string;
  unread?: boolean;
};

export type NetworkConfig = {
  bg: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export type ChartSpec = {
  data: { value: number }[];
  color: string;
};

// --- Calendar / Scheduled Post types ---

export type PostStatus = "scheduled" | "published" | "draft";

export type PostCategory = "Personal" | "Business" | "Marketing" | "Social";

export type ScheduledPost = {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  scheduledAt: string; // ISO 8601
  channelId: string;
  network: ChannelNetwork;
  authorName: string;
  authorAvatar: string;
  status: PostStatus;
  imageUri?: string;
};

export type TimeSlot = {
  hour: number; // 0-23
  label: string; // "9:00 am"
};

export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
};
