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
