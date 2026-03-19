import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AuthInput } from "@/components/ui/auth-input";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSignIn = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email || !email.includes("@")) newErrors.email = "Incorrect email";
    if (!password || password.length < 6) newErrors.password = "Incorrect password";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      router.replace("/(tabs)/onboarding");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top", "bottom"]}>
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

          <View className="gap-8">
            <View className="relative self-start">
              <View pointerEvents="none" style={{ position: "absolute", left: -12, top: -2 }}>
                <Image
                  source={require("@/assets/icons/login/title-scribble.svg")}
                  style={{ width: 125.533, height: 37.9 }}
                  contentFit="contain"
                />
              </View>
              <Text className="font-jakarta text-2xl font-semibold leading-8 text-text-primary">
                Sign In
              </Text>
            </View>

            <View className="gap-5">
              <View className="gap-3">
                <Text className="font-jakarta text-sm text-text-secondary">Continue with</Text>
                <View className="flex-row gap-2">
                  <Pressable className="h-[52px] flex-1 items-center justify-center rounded-[10px] bg-white">
                    <Image
                      source={require("@/assets/icons/login/google.svg")}
                      style={{ width: 24, height: 24 }}
                      contentFit="contain"
                    />
                  </Pressable>
                  <Pressable className="h-[52px] flex-1 items-center justify-center rounded-[10px] bg-white">
                    <Image
                      source={require("@/assets/icons/login/apple.svg")}
                      style={{ width: 24, height: 24 }}
                      contentFit="contain"
                    />
                  </Pressable>
                  <Pressable className="h-[52px] flex-1 items-center justify-center rounded-[10px] bg-white">
                    <Image
                      source={require("@/assets/icons/login/wallet.svg")}
                      style={{ width: 24, height: 24 }}
                      contentFit="contain"
                    />
                  </Pressable>
                </View>
              </View>

              <View className="flex-row items-center justify-center gap-5">
                <Image
                  source={require("@/assets/icons/login/divider.svg")}
                  style={{ width: 100, height: 1 }}
                  contentFit="contain"
                />
                <Text className="font-jakarta text-sm text-text-secondary">or</Text>
                <Image
                  source={require("@/assets/icons/login/divider.svg")}
                  style={{ width: 100, height: 1 }}
                  contentFit="contain"
                />
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

              <AuthInput
                label="Password"
                value={password}
                onChangeText={(text) => { setPassword(text); if (errors.password) setErrors((prev) => ({ ...prev, password: undefined })); }}
                placeholder="Enter password"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                focused={focusedField === "password"}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                error={!!errors.password}
                hint={errors.password}
                rightSlot={
                  <Pressable onPress={() => setPasswordVisible((prev) => !prev)}>
                    {passwordVisible ? (
                      <Ionicons name="eye-outline" size={20} className="text-icon-secondary" />
                    ) : (
                      <Image
                        source={require("@/assets/icons/login/eye-slash.svg")}
                        style={{ width: 20, height: 20 }}
                        contentFit="contain"
                      />
                    )}
                  </Pressable>
                }
              />

              <Pressable className="items-end py-2" onPress={() => router.push("/(auth)/forgot-password" as any)}>
                <Text className="font-jakarta text-sm text-text-primary underline">
                  Forgot password?
                </Text>
              </Pressable>
            </View>
          </View>

          <View className="mt-auto gap-6">
            <AppButton label="Sign In" onPress={handleSignIn} />

            <View className="flex-row items-baseline gap-2">
              <Text className="font-jakarta text-sm text-text-primary">
                Don&apos;t have an account?
              </Text>
              <Pressable onPress={() => router.replace("/(auth)/signup")}>
                <Text className="font-jakarta text-[15px] font-semibold text-main-accent-pink">
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
