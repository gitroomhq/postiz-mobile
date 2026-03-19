import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AuthInput } from "@/components/ui/auth-input";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [focusedField, setFocusedField] = useState<"email" | null>(null);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const handleSendResetLink = () => {
    const newErrors: { email?: string } = {};
    if (!email || !email.includes("@")) newErrors.email = "Please enter a valid email";
    setErrors(newErrors);
    if (!newErrors.email) {
      router.push("/(auth)/reset-password" as any);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background-primary"
      edges={["top", "bottom"]}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          className="flex-1 bg-background-primary px-5 pt-12 pb-[42px]"
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6 h-[27.359px] w-[84px]">
            <View style={{ position: "absolute", inset: 0, right: "70.6%" }}>
              <Image
                source={require("@/assets/icons/login/postiz-mark.svg")}
                style={{ width: 24.7, height: 27.359 }}
                contentFit="contain"
              />
            </View>
            <View
              style={{
                position: "absolute",
                top: "1.61%",
                bottom: "10.76%",
                left: "37.32%",
                right: 0,
              }}
            >
              <Image
                source={require("@/assets/icons/login/postiz-wordmark.svg")}
                style={{ width: 52.65, height: 23.976 }}
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

          <View className="flex-1 justify-between">
            <View className="gap-8">
              <View className="gap-3">
                <Text className="font-jakarta text-2xl font-semibold leading-8 text-text-primary">
                  Forgot Password
                </Text>
                <Text className="font-jakarta text-sm text-text-secondary">
                  Enter your email and we&apos;ll send you a reset link.
                </Text>
              </View>

              <AuthInput
                label="Email"
                value={email}
                onChangeText={(text) => { setEmail(text); if (errors.email) setErrors((prev) => ({ ...prev, email: undefined })); }}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
                focused={focusedField === "email"}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                error={!!errors.email}
                hint={errors.email}
              />
            </View>

            <View className="gap-8">
              <AppButton label="Send Reset Link" onPress={handleSendResetLink} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
