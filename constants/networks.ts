import type { ChannelNetwork, NetworkConfig } from "@/types";

export const NETWORK_CONFIG: Record<ChannelNetwork, NetworkConfig> = {
  facebook: { bg: "#1877F2", icon: "logo-facebook" },
  instagram: { bg: "#D62976", icon: "logo-instagram" },
  linkedin: { bg: "#0A66C2", icon: "logo-linkedin" },
  reddit: { bg: "#FF4500", icon: "logo-reddit" },
  youtube: { bg: "#FF0000", icon: "logo-youtube" },
  threads: { bg: "#303030", icon: "at-outline" },
  bluesky: { bg: "#0080FF", icon: "paper-plane-outline" },
  tiktok: { bg: "#000000", icon: "logo-tiktok" },
  x: { bg: "#000000", icon: "logo-twitter" },
  pinterest: { bg: "#BD081C", icon: "logo-pinterest" },
};
