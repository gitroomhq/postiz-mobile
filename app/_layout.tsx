import "@/global.css";
import "@/utils/suppress-warnings";

import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, type Theme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Image } from "expo-image";
import { Stack } from "expo-router";
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

export default function RootLayout() {
  const [loaded] = useFonts({
    PlusJakartaSans: require("@/assets/fonts/PlusJakartaSans.ttf"),
    "PlusJakartaSans-Italic": require("@/assets/fonts/PlusJakartaSans-Italic.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      void SplashScreen.hideAsync();
    }
  }, [loaded]);

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
                      animation: "slide_from_right",
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
