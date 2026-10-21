import { View } from "react-native";

import { Image } from "@/components/ui/image";
import type { ChannelNetwork } from "@/types";
import { getNetworkIconUrl } from "@/utils/network-icon";

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
  const badgeSize = Math.max(12, Math.round(size * 0.42));
  const badgeOffset = allowBadgeOverflow ? Math.round(badgeSize * -0.22) : -1;
  // When badge doesn't overflow, expand the container so the badge fits inside
  const containerSize = allowBadgeOverflow
    ? size
    : size + Math.round(badgeSize * 0.35);

  return (
    <View
      className={`relative items-center justify-center ${
        allowBadgeOverflow ? "overflow-visible" : ""
      }`}
      style={{ width: containerSize, height: containerSize }}
    >
      <Image
        source={{ uri: avatar }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
      <View
        className="absolute overflow-hidden rounded-[4px]"
        style={{
          width: badgeSize,
          height: badgeSize,
          bottom: badgeOffset,
          right: badgeOffset,
        }}
      >
        <Image
          source={{ uri: getNetworkIconUrl(network) }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      </View>
    </View>
  );
}
