import * as Clipboard from "expo-clipboard";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DeleteAccountDialog,
  useDeleteAccount,
} from "@/components/auth/delete-account";
import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { NotificationBellButton } from "@/components/ui/notification-bell-button";
import { showToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth-store";
import { apiFetch } from "@/utils/custom-fetch";

const VISIBLE_CHARS = 5;
const BLUR_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];

function ApiKeyText({
  text,
  suffix,
  revealed,
  textClassName,
}: {
  text: string;
  suffix?: string;
  revealed: boolean;
  textClassName?: string;
}) {
  const fullText = suffix ? text + suffix : text;

  if (revealed) {
    return (
      <View className="relative">
        <Text className={`${textClassName} text-[#EFEFEF]`}>{fullText}</Text>
      </View>
    );
  }

  return (
    <View className="relative">
      {BLUR_OFFSETS.flatMap((dx) =>
        BLUR_OFFSETS.map((dy) => (
          <Text
            key={`${dx},${dy}`}
            className={`${textClassName} absolute text-[#8A8A8A] opacity-[0.04]`}
            style={{ left: dx, top: dy }}
          >
            {text}
            {suffix ? (
              <Text className="text-transparent">{suffix}</Text>
            ) : null}
          </Text>
        )),
      )}
      <Text className={`${textClassName} text-[rgba(138,138,138,0.12)]`}>
        {text}
        {suffix ? (
          <Text className="text-[#EFEFEF] bg-main-bg">
            {suffix}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

function ApiKeyCard({ apiKey }: { apiKey: string }) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => setRevealed(true);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(apiKey);
    showToast("API Key copied to clipboard");
  };

  return (
    <View className="w-full overflow-hidden rounded-[12px] bg-main-bg p-3">
      <View className="gap-3">
        <ApiKeyText
          text={apiKey.slice(0, -VISIBLE_CHARS)}
          suffix={apiKey.slice(-VISIBLE_CHARS)}
          revealed={revealed}
          textClassName="font-jakarta text-body-1"
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
  const logout = useAuthStore((state) => state.logout);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const user = useAuthStore((state) => state.user);
  const [rotating, setRotating] = useState(false);
  const deleteAccount = useDeleteAccount();

  const apiKey = typeof user?.publicApi === "string" ? user.publicApi : "";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const handleRotate = async () => {
    if (rotating) return;
    setRotating(true);
    try {
      const response = await apiFetch("/user/api-key/rotate", { method: "POST" });
      if (!response.ok) {
        showToast("Couldn't rotate API key", "error");
        return;
      }
      await refreshUser();
      showToast("API key rotated", "success");
    } finally {
      setRotating(false);
    }
  };

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

          {isAdmin && apiKey ? (
            <>
              <ApiKeyCard apiKey={apiKey} />

              <Pressable
                disabled={rotating}
                onPress={handleRotate}
                className={`h-[52px] w-full items-center justify-center rounded-[8px] bg-buttons-primary-bg ${
                  rotating ? "opacity-70" : ""
                }`}
              >
                <Text className="font-jakarta text-[16px] font-semibold text-buttons-primary-text">
                  {rotating ? "Rotating..." : "Rotate Key"}
                </Text>
              </Pressable>
            </>
          ) : (
            <View className="w-full overflow-hidden rounded-[12px] bg-main-bg p-3">
              <Text className="font-jakarta text-body-1 text-text-secondary">
                {isAdmin
                  ? "No API key issued yet. Tap Rotate to generate one."
                  : "API access is available to organisation admins."}
              </Text>
            </View>
          )}

          {user?.email ? (
            <Text className="font-jakarta text-body-2 text-text-secondary">
              Signed in as {user.email}
            </Text>
          ) : null}

          <Pressable
            className="h-[52px] w-full items-center justify-center rounded-[8px] border border-separator-primary bg-transparent"
            onPress={async () => {
              await logout();
              showToast("Signed out", "success");
            }}
          >
            <Text className="font-jakarta text-[16px] font-semibold text-text-primary">
              Sign Out
            </Text>
          </Pressable>

          <Pressable
            className="h-[52px] w-full items-center justify-center rounded-[8px] border border-text-critical bg-transparent"
            onPress={deleteAccount.openDialog}
          >
            <Text className="font-jakarta text-[16px] font-semibold text-text-critical">
              Delete Account
            </Text>
          </Pressable>

        </View>
      </View>

      <DeleteAccountDialog
        visible={deleteAccount.dialogVisible}
        deleting={deleteAccount.deleting}
        onConfirm={deleteAccount.confirmDelete}
        onCancel={deleteAccount.closeDialog}
      />

      <MainTabNavbar activeTab="settings" />
    </SafeAreaView>
  );
}
