import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { showToast } from "@/components/ui/toast";
import { useAuthStore } from "@/store/auth-store";

const COOLDOWN_SECONDS = 60;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; flow?: string }>();
  const resendActivation = useAuthStore((state) => state.resendActivation);
  const email = params.email ?? "";
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email) {
      showToast("Missing email", "error");
      return;
    }
    setResending(true);
    const result = await resendActivation(email);
    setResending(false);
    if (result.ok) {
      if (result.alreadyActivated) {
        showToast("Account already activated", "success");
        router.replace("/(auth)");
        return;
      }
      showToast("Activation email sent", "success");
      setCooldown(COOLDOWN_SECONDS);
    } else {
      showToast(result.error, "error");
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background-primary"
      edges={["top", "bottom"]}
    >
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background-primary px-5 pt-12 pb-[20px]"
        contentContainerClassName="flex-grow"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View className="mb-6 h-[27px] w-[84px]">
          <View className="absolute inset-0 right-[70.6%]">
            <Image
              source={require("@/assets/icons/login/postiz-mark.svg")}
              className="w-[25px] h-[27px]"
              contentFit="contain"
            />
          </View>
          <View className="absolute top-[1.61%] bottom-[10.76%] left-[37.32%] right-0">
            <Image
              source={require("@/assets/icons/login/postiz-wordmark.svg")}
              className="w-[53px] h-[24px]"
              contentFit="contain"
            />
          </View>
        </View>

        <View className="mb-6 w-full">
          <Pressable
            className="h-6 w-6 items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              className="text-icon-primary"
            />
          </Pressable>
        </View>

        <View className="gap-8">
          <View className="gap-3">
            <Text className="font-jakarta text-2xl font-semibold leading-8 text-text-primary">
              Activate your account
            </Text>
            <Text className="font-jakarta text-sm text-text-secondary">
              {email
                ? `We sent an activation link to ${email}. Please check your inbox to complete signup.`
                : "Please check your inbox for the activation link."}
            </Text>
          </View>

          <AppButton
            label={
              resending
                ? "Sending..."
                : cooldown > 0
                  ? `You can resend in ${cooldown}s`
                  : "Resend Activation Email"
            }
            variant={cooldown > 0 || resending ? "disabled" : "primary"}
            disabled={cooldown > 0 || resending}
            onPress={handleResend}
          />

          <View className="flex-row items-center gap-2">
            <Text className="font-jakarta text-sm text-text-primary">
              Already activated?
            </Text>
            <Pressable onPress={() => router.replace("/(auth)")}>
              <Text className="font-jakarta text-[15px] font-semibold text-main-accent-pink">
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
