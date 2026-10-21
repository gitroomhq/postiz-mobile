import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  WebView,
  type WebViewMessageEvent,
  type WebViewNavigation,
} from "react-native-webview";

import { FRONTEND_URL } from "@/utils/env";
import { tokenStorage } from "@/utils/token-storage";

export default function AddChannelScreen() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    tokenStorage.getAuth().then((t) => {
      if (!cancelled) setAuthToken(t);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const doBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      doBack();
      return true;
    });
    return () => sub.remove();
  }, [doBack]);

  const uri = useMemo(() => {
    const params = authToken
      ? `?loggedAuth=${encodeURIComponent(authToken)}`
      : "";
    return `${FRONTEND_URL}/provider/add${params}`;
  }, [authToken]);

  // Primary hand-off: the web-side `AddProviderComponent` posts
  // `{type: 'open-external', url}` via `window.ReactNativeWebView
  // .postMessage` when `isMobile` is true. That's more reliable than
  // relying on a navigation intercept (RN WebView doesn't always
  // route `window.open` / top-frame `location` changes through
  // `onShouldStartLoadWithRequest`).
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      let parsed: { type?: string; url?: string } | null = null;
      try {
        parsed = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      if (!parsed || typeof parsed !== "object") return;
      if (parsed.type === "open-external" && parsed.url) {
        Linking.openURL(parsed.url).catch(() => {});
      }
    },
    [],
  );

  // Fallback intercept. Covers the `postiz://` deep link bouncing
  // back from the OAuth callback and any stray navigations that
  // escape the postMessage path.
  const handleShouldStartLoad = useCallback(
    (request: WebViewNavigation) => {
      const target = request.url;
      if (!target) return true;
      if (target.startsWith("about:") || target.startsWith("data:")) {
        return true;
      }
      if (target.startsWith("postiz://")) {
        Linking.openURL(target).catch(() => {});
        doBack();
        return false;
      }
      if (target.startsWith(FRONTEND_URL)) {
        return true;
      }
      Linking.openURL(target).catch(() => {});
      return false;
    },
    [doBack],
  );

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={doBack} />
      <View style={styles.sheet}>
        <SafeAreaView edges={["top"]} style={styles.sheetSafe}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <View style={styles.header}>
            <Pressable onPress={doBack} hitSlop={10}>
              <Ionicons
                name="close"
                size={24}
                className="text-icon-primary"
              />
            </Pressable>
            <Text style={styles.title}>Add Channel</Text>
            <View style={{ width: 24 }} />
          </View>
        </SafeAreaView>

        {authToken === undefined ? (
          <View style={styles.loading}>
            <ActivityIndicator color="#ffffff" />
          </View>
        ) : (
          <WebView
            source={{ uri }}
            javaScriptEnabled
            domStorageEnabled
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            setSupportMultipleWindows={false}
            style={styles.webview}
            startInLoadingState
            renderLoading={() => (
              <View style={[StyleSheet.absoluteFill, styles.loading]}>
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
          />
        )}
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(14, 14, 14, 0.55)",
  },
  sheet: {
    height: "92%",
    backgroundColor: "#0C0B0B",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  sheetSafe: {
    backgroundColor: "transparent",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    height: 4,
    width: 36,
    borderRadius: 2,
    backgroundColor: "#454444",
  },
  header: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0C0B0B",
  },
});
