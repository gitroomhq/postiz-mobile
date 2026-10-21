import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { View } from "react-native";

import { showToast } from "@/components/ui/toast";
import { useChannelsStore } from "@/store/channels-store";

export default function IntegrationsRoute() {
  const router = useRouter();
  const fetchChannels = useChannelsStore((s) => s.fetchChannels);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Deep-linked in from the OAuth callback while the add-channel
    // bottom sheet was still on the stack. Pop every pushed screen
    // (this route + add-channel) so the user lands back on the tabs,
    // then refresh the channel list and announce the success.
    try {
      router.dismissAll();
    } catch {
      // dismissAll is a no-op if there are no modal routes in the stack.
    }
    router.replace("/(tabs)/explore");
    void fetchChannels();
    showToast("Channel added", "success");
  }, [router, fetchChannels]);

  return <View />;
}
