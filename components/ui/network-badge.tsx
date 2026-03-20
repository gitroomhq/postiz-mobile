import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

import { NETWORK_CONFIG } from "@/constants/networks";
import type { ChannelNetwork } from "@/types";

export function NetworkBadge({ network }: { network: ChannelNetwork }) {
  const config = NETWORK_CONFIG[network];

  return (
    <View
      className="absolute -bottom-[3px] -right-[3px] h-4 w-4 items-center justify-center rounded-[4px]"
      style={{ backgroundColor: config.bg }}
    >
      <Ionicons name={config.icon} size={11} color="#FFFFFF" />
    </View>
  );
}
