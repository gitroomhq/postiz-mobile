import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  WebView,
  type WebViewMessageEvent,
} from "react-native-webview";

import { useAuthStore } from "@/store/auth-store";
import { FRONTEND_URL } from "@/utils/env";

export type SettingsWebViewProps = {
  visible: boolean;
  provider: string;
  /** Current provider-specific settings value (forwarded to the web form). */
  value: Record<string, unknown> | null;
  /** Validator messages (strings) that failed for this provider on the last save attempt. */
  errors?: string[];
  onSave: (newValue: Record<string, unknown>) => void;
  onCancel: () => void;
};

type IncomingMessage =
  | { type: "ready" }
  | { type: "save"; value: Record<string, unknown> }
  | { type: "cancel" };

const PROTOCOL_VERSION = 1;

export function SettingsWebViewModal({
  visible,
  provider,
  value,
  errors,
  onSave,
  onCancel,
}: SettingsWebViewProps) {
  const webRef = useRef<WebView>(null);
  const token = useAuthStore((state) => state.user?.id);

  const sourceUri = useMemo(() => {
    const params = new URLSearchParams({
      protocol: String(PROTOCOL_VERSION),
      theme: "dark",
      value: encodeURIComponent(JSON.stringify(value ?? {})),
    });
    if (errors && errors.length > 0) {
      params.set("errors", encodeURIComponent(JSON.stringify(errors)));
    }
    if (token) params.set("authHint", token);
    return `${FRONTEND_URL}/mobile/post-settings/${encodeURIComponent(
      provider,
    )}?${params.toString()}`;
  }, [provider, value, errors, token]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let parsed: IncomingMessage | null = null;
      try {
        parsed = JSON.parse(event.nativeEvent.data) as IncomingMessage;
      } catch {
        return;
      }
      if (!parsed || typeof parsed !== "object") return;
      switch (parsed.type) {
        case "save":
          onSave(parsed.value);
          return;
        case "cancel":
          onCancel();
          return;
        case "ready":
        default:
          return;
      }
    },
    [onSave, onCancel],
  );

  return (
    <Modal
      visible={visible}
      onRequestClose={onCancel}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-background-primary" edges={["top"]}>
        <View className="h-12 flex-row items-center justify-between px-4">
          <Pressable onPress={onCancel} hitSlop={10}>
            <Ionicons name="close" size={24} className="text-icon-primary" />
          </Pressable>
          <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
            {provider} settings
          </Text>
          <View className="w-6" />
        </View>
        <View className="flex-1 bg-background-primary">
          <WebView
            ref={webRef}
            source={{ uri: sourceUri }}
            onMessage={handleMessage}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View className="absolute inset-0 items-center justify-center bg-background-primary">
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
