import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AuthInput } from "@/components/ui/auth-input";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState<"email" | null>(null);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const isEmailValid = email.includes("@");

  const handleSendResetLink = () => {
    const newErrors: { email?: string } = {};
    if (!email || !email.includes("@")) newErrors.email = "Please enter a valid email";
    setErrors(newErrors);
    if (!newErrors.email) {
      router.push("/(auth)/verify-otp" as any);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background-primary"
      edges={["top", "bottom"]}
    >
      <StatusBar style="light" />
      <ScrollView
        className="flex-1 bg-background-primary px-5 pb-[20px] pt-12"
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
                <Ionicons name="chevron-back" size={20} className="text-icon-primary" />
              </Pressable>
            </View>

            <View className="gap-8">
              <Text className="font-jakarta text-h1 font-semibold text-text-primary">
                Forgot password
              </Text>

              <AuthInput
                label="Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                focused={focusedField === "email"}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                error={!!errors.email}
                hint={errors.email}
              />

              <AppButton
                label="Send Password Reset Email"
                onPress={handleSendResetLink}
                variant={isEmailValid ? "primary" : "disabled"}
                disabled={!isEmailValid}
              />

              <View className="flex-row items-baseline gap-2">
                <Text className="font-jakarta text-body-1 text-text-primary">
                  Don&apos;t have an account?
                </Text>
                <Pressable onPress={() => router.replace("/(auth)/signup")}>
                  <Text className="font-jakarta text-button font-semibold text-main-accent-pink">
                    Sign Up
                  </Text>
                </Pressable>
              </View>
            </View>
      </ScrollView>
    </SafeAreaView>
  );
}
