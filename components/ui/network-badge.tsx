import { View } from "react-native";

import { Image } from "@/components/ui/image";
import type { ChannelNetwork } from "@/types";
import { getNetworkIconUrl } from "@/utils/network-icon";

export function NetworkBadge({ network }: { network: ChannelNetwork }) {
  return (
    <View
      className="absolute h-4 w-4 overflow-hidden rounded-[4px]"
      style={{ bottom: -4, right: -4 }}
    >
      <Image
        source={{ uri: getNetworkIconUrl(network) }}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      />
    </View>
  );
}
