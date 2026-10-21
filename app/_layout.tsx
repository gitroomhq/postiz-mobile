import "@/global.css";
import "@/utils/suppress-warnings";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, type Theme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { cssInterop } from "nativewind";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";

import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth-store";
import { configurePurchases } from "@/utils/purchases";

const PostizDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#1A1919",
    card: "#1A1919",
    border: "#1A1919",
  },
};

cssInterop(Image, { className: "style" });
cssInterop(Ionicons, {
  className: {
    target: "style",
    nativeStyleToProp: { color: true },
  },
});

export const unstable_settings = {
  initialRouteName: "(auth)",
};

void SplashScreen.preventAutoHideAsync();
void SystemUI.setBackgroundColorAsync("#0E0E0E");

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const status = useAuthStore((state) => state.status);
  const initializing = useAuthStore((state) => state.initializing);
  const subscription = useAuthStore((state) => state.subscription);
  const subscriptionLoaded = useAuthStore((state) => state.subscriptionLoaded);

  useEffect(() => {
    if (initializing) return;
    // `as string` because generated route types lag behind new routes.
    const segment = segments[0] as string;
    const inAuthGroup = segment === "(auth)";
    const onSubscribeScreen = segment === "subscribe-required";
    // OAuth deep-link landing spots (postiz://auth/callback). The callback
    // route runs the code exchange and handles its own failure navigation,
    // so it is exempt from the unauthenticated redirect below.
    const onOAuthCallbackRoute = segment === "auth";
    const onAuthCallback = onOAuthCallbackRoute || segment === "+not-found";

    if (status === "unauthenticated" && !inAuthGroup && !onOAuthCallbackRoute) {
      router.replace("/(auth)");
      return;
    }

    if (status !== "authenticated") return;
    if (!subscriptionLoaded) return;

    const hasAccess = !!subscription;

    if (!hasAccess && !onSubscribeScreen) {
      router.replace("/subscribe-required");
      return;
    }
    if (hasAccess && (inAuthGroup || onSubscribeScreen || onAuthCallback)) {
      router.replace("/(tabs)");
    }
  }, [status, initializing, segments, router, subscription, subscriptionLoaded]);

  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    PlusJakartaSans: require("@/assets/fonts/PlusJakartaSans.ttf"),
    "PlusJakartaSans-Italic": require("@/assets/fonts/PlusJakartaSans-Italic.ttf"),
  });

  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializing = useAuthStore((state) => state.initializing);
  const status = useAuthStore((state) => state.status);
  const subscription = useAuthStore((state) => state.subscription);
  const subscriptionLoaded = useAuthStore((state) => state.subscriptionLoaded);
  const segments = useSegments();

  useEffect(() => {
    // Must run before initialize(): fetchSelf() calls Purchases.logIn(orgId).
    configurePurchases();
    void initializeAuth();
  }, [initializeAuth]);

  // The group AuthGate is about to land on. `null` while we're still
  // resolving — splash stays up until we know.
  const desiredGroup = initializing
    ? null
    : status === "unauthenticated"
      ? "(auth)"
      : !subscriptionLoaded
        ? null
        : !subscription
          ? "subscribe-required"
          : "(tabs)";

  // Hold the splash until we're not just ready, but already rendered on
  // the correct screen — otherwise the (auth) initialRoute paints for
  // one frame before AuthGate's effect redirects, flashing the login.
  const onCorrectScreen =
    desiredGroup !== null && segments[0] === desiredGroup;
  const ready = loaded && onCorrectScreen;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1 bg-[#1A1919]">
      <SafeAreaProvider>
        <ThemeProvider value={PostizDarkTheme}>
          <ErrorBoundary>
            <BottomSheetModalProvider>
              <ToastProvider>
                <AuthGate />
                <Stack
                  initialRouteName="(auth)"
                  screenOptions={{
                    contentStyle: { backgroundColor: "#0E0E0E" },
                    freezeOnBlur: false,
                  }}
                >
                  <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="subscribe-required"
                    options={{ headerShown: false, gestureEnabled: false }}
                  />
                  <Stack.Screen
                    name="notifications"
                    options={{
                      headerShown: false,
                      presentation: "transparentModal",
                      animation: "slide_from_right",
                      contentStyle: { backgroundColor: "transparent" },
                    }}
                  />
                  <Stack.Screen
                    name="add-channel"
                    options={{
                      headerShown: false,
                      presentation: "transparentModal",
                      animation: "slide_from_bottom",
                      contentStyle: { backgroundColor: "transparent" },
                    }}
                  />
                  <Stack.Screen
                    name="create-post"
                    options={{
                      headerShown: false,
                      presentation: "transparentModal",
                      animation: "slide_from_bottom",
                      contentStyle: { backgroundColor: "transparent" },
                    }}
                  />
                  <Stack.Screen
                    name="integrations"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", title: "Modal" }}
                  />
                </Stack>
                <StatusBar style="auto" />
              </ToastProvider>
            </BottomSheetModalProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
