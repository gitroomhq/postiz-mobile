import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AuthInput } from "@/components/ui/auth-input";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<"password" | "confirmPassword" | null>(null);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const handleResetPassword = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (!password || password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background-primary"
      edges={["top", "bottom"]}
    >
      <StatusBar style="light" />
      <KeyboardAvoidingView
        className="flex-1"
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
            <View className="absolute inset-0 right-[70.6%]">
              <Image
                source={require("@/assets/icons/login/postiz-mark.svg")}
                className="w-[24.7px] h-[27.359px]"
                contentFit="contain"
              />
            </View>
            <View className="absolute top-[1.61%] bottom-[10.76%] left-[37.32%] right-0">
              <Image
                source={require("@/assets/icons/login/postiz-wordmark.svg")}
                className="w-[52.65px] h-[23.976px]"
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
                  Create New Password
                </Text>
                <Text className="font-jakarta text-sm text-text-secondary">
                  Set a strong password to secure access.
                </Text>
              </View>

              <View className="gap-5">
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
                          className="w-5 h-5"
                          contentFit="contain"
                        />
                      )}
                    </Pressable>
                  }
                />

                <AuthInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(text) => { setConfirmPassword(text); if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined })); }}
                  placeholder="Confirm password"
                  secureTextEntry={!confirmPasswordVisible}
                  autoCapitalize="none"
                  focused={focusedField === "confirmPassword"}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  error={!!errors.confirmPassword}
                  hint={errors.confirmPassword}
                  rightSlot={
                    <Pressable onPress={() => setConfirmPasswordVisible((prev) => !prev)}>
                      {confirmPasswordVisible ? (
                        <Ionicons name="eye-outline" size={20} className="text-icon-secondary" />
                      ) : (
                        <Image
                          source={require("@/assets/icons/login/eye-slash.svg")}
                          className="w-5 h-5"
                          contentFit="contain"
                        />
                      )}
                    </Pressable>
                  }
                />
              </View>
            </View>

            <View className="gap-8">
              <AppButton label="Reset Password" onPress={handleResetPassword} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
