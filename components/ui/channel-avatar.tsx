import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { Image } from "@/components/ui/image";
import { NETWORK_CONFIG } from "@/constants/networks";
import type { ChannelNetwork } from "@/types";

export function ChannelAvatar({
  avatar,
  network,
  size = 32,
  allowBadgeOverflow = false,
}: {
  avatar: string;
  network: ChannelNetwork;
  size?: number;
  allowBadgeOverflow?: boolean;
}) {
  const networkConfig = NETWORK_CONFIG[network];
  const badgeSize = Math.max(12, Math.round(size * 0.42));
  const badgeOffset = allowBadgeOverflow ? Math.round(badgeSize * -0.22) : 0;

  return (
    <View
      className={`relative items-center justify-center rounded-full ${
        allowBadgeOverflow ? "overflow-visible" : "overflow-hidden"
      }`}
      style={{ width: size, height: size }}
    >
      <Image
        source={{ uri: avatar }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
      <View
        className="absolute items-center justify-center rounded-[4px]"
        style={{
          width: badgeSize,
          height: badgeSize,
          backgroundColor: networkConfig.bg,
          bottom: badgeOffset,
          right: badgeOffset,
        }}
      >
        <Ionicons
          name={networkConfig.icon}
          size={Math.max(8, Math.round(badgeSize * 0.58))}
          className="text-white"
        />
      </View>
    </View>
  );
}
