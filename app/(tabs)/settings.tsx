import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import type { StyleProp, TextStyle } from "react-native";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { NotificationBellButton } from "@/components/ui/notification-bell-button";
import { showToast } from "@/components/ui/toast";

const API_KEY =
  "b02b31841331e2f56f683189c6f05bd6e096fe17ff616fc42e61de8f2e9c8300";

const VISIBLE_CHARS = 5;
const BLUR_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

function ApiKeyText({
  text,
  suffix,
  revealed,
  style,
}: {
  text: string;
  suffix?: string;
  revealed: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const fullText = suffix ? text + suffix : text;

  if (revealed) {
    return (
      <View style={{ position: "relative" }}>
        <Text style={[style, { color: "#EFEFEF" }]}>{fullText}</Text>
      </View>
    );
  }

  return (
    <View style={{ position: "relative" }}>
      {BLUR_OFFSETS.flatMap((dx) =>
        BLUR_OFFSETS.map((dy) => (
          <Text
            key={`${dx},${dy}`}
            style={[
              style,
              {
                position: "absolute",
                left: dx,
                top: dy,
                color: "#8A8A8A",
                opacity: 0.04,
              },
            ]}
          >
            {text}
            {suffix ? (
              <Text style={{ color: "transparent" }}>{suffix}</Text>
            ) : null}
          </Text>
        )),
      )}
      <Text style={[style, { color: "rgba(138,138,138,0.12)" }]}>
        {text}
        {suffix ? (
          <Text style={{ color: "#EFEFEF", backgroundColor: "#0E0E0E" }}>
            {suffix}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

function ApiKeyCard() {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => setRevealed(true);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(API_KEY);
    showToast("API Key copied to clipboard");
  };

  return (
    <View className="w-full overflow-hidden rounded-[12px] bg-main-bg p-3">
      <View className="gap-3">
        <ApiKeyText
          text={API_KEY.slice(0, -VISIBLE_CHARS)}
          suffix={API_KEY.slice(-VISIBLE_CHARS)}
          revealed={revealed}
          style={{ fontFamily: "Jakarta", fontSize: 14 }}
        />
        <Pressable
          className="w-[120px] items-center justify-center rounded-[6px] bg-buttons-tertiary-bg py-2"
          onPress={revealed ? handleCopy : handleReveal}
        >
          <Text className="font-jakarta text-button-2 font-semibold text-buttons-tertiary-text">
            {revealed ? "Copy Key" : "Reveal"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-main-sections" edges={["top"]}>
      <StatusBar style="light" />

      <View className="h-[60px] flex-row items-center justify-between px-4">
        <Text className="font-jakarta text-h2 font-semibold text-text-primary">
          Settings
        </Text>
        <NotificationBellButton />
      </View>

      <View className="flex-1 px-5 pt-4">
        <View className="w-full gap-5">
          <View className="gap-3">
            <Text className="font-jakarta text-h4 font-semibold text-text-primary">
              Public API
            </Text>
            <Text className="font-jakarta text-body-1 text-text-secondary">
              Use Postiz API to integrate with your tools.{"\n"}
              Read how to use it over the documentation,{"\n"}
              Check out our NSN custom node for Postiz.
            </Text>
          </View>

          <ApiKeyCard />

          <Pressable className="h-[52px] w-full items-center justify-center rounded-[8px] bg-buttons-primary-bg">
            <Text className="font-jakarta text-[16px] font-semibold text-buttons-primary-text">
              Rotate Key
            </Text>
          </Pressable>
        </View>
      </View>

      <MainTabNavbar activeTab="settings" />
    </SafeAreaView>
  );
}
