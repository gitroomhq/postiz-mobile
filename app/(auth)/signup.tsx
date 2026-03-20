import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { AuthInput } from "@/components/ui/auth-input";

export default function SignUpScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "email" | "password" | "company" | null
  >(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    company?: string;
  }>({});

  const handleCreateAccount = () => {
    const newErrors: { email?: string; password?: string; company?: string } =
      {};
    if (!email || !email.includes("@")) newErrors.email = "Incorrect email";
    if (!password || password.length < 6)
      newErrors.password = "Incorrect password";
    if (!company) newErrors.company = "Company name is required";
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
          className="flex-1 bg-background-primary"
          contentContainerClassName="px-5 pt-12 pb-[42px]"
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

          <View className="gap-5">
            <View className="relative gap-6">
              <Text className="font-jakarta text-2xl font-semibold leading-8 text-text-primary">
                Sign Up
              </Text>
              <View
                pointerEvents="none"
                className="absolute -left-[8.25px] top-7 z-20"
              >
                <Image
                  source={require("@/assets/icons/login/signup-doodle.svg")}
                  className="w-[153.375px] h-[12.614px]"
                  contentFit="contain"
                />
              </View>

              <View className="gap-5 pt-[7px]">
                <View className="gap-3">
                  <Text className="font-jakarta text-sm text-text-secondary">
                    Continue with
                  </Text>
                  <View className="flex-row gap-2">
                    <Pressable className="h-[52px] flex-1 items-center justify-center rounded-[10px] bg-white">
                      <Image
                        source={require("@/assets/icons/login/google.svg")}
                        className="w-6 h-6"
                        contentFit="contain"
                      />
                    </Pressable>
                    <Pressable className="h-[52px] flex-1 items-center justify-center rounded-[10px] bg-white">
                      <Image
                        source={require("@/assets/icons/login/apple.svg")}
                        className="w-6 h-6"
                        contentFit="contain"
                      />
                    </Pressable>
                    <Pressable className="h-[52px] flex-1 items-center justify-center rounded-[10px] bg-white">
                      <Image
                        source={require("@/assets/icons/login/wallet.svg")}
                        className="w-6 h-6"
                        contentFit="contain"
                      />
                    </Pressable>
                  </View>
                </View>

                <View className="flex-row items-center justify-center gap-5">
                  <Image
                    source={require("@/assets/icons/login/divider.svg")}
                    className="w-[100px] h-px"
                    contentFit="contain"
                  />
                  <Text className="font-jakarta text-sm text-text-secondary">
                    or
                  </Text>
                  <Image
                    source={require("@/assets/icons/login/divider.svg")}
                    className="w-[100px] h-px"
                    contentFit="contain"
                  />
                </View>

                <AuthInput
                  label="Email"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
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

                <AuthInput
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Enter password"
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  focused={focusedField === "password"}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  error={!!errors.password}
                  hint={errors.password}
                  rightSlot={
                    <Pressable
                      onPress={() => setPasswordVisible((prev) => !prev)}
                    >
                      {passwordVisible ? (
                        <Ionicons
                          name="eye-outline"
                          size={20}
                          className="text-icon-secondary"
                        />
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
                  label="Company"
                  value={company}
                  onChangeText={(text) => {
                    setCompany(text);
                    if (errors.company)
                      setErrors((prev) => ({ ...prev, company: undefined }));
                  }}
                  placeholder="Enter company name"
                  autoCapitalize="words"
                  focused={focusedField === "company"}
                  onFocus={() => setFocusedField("company")}
                  onBlur={() => setFocusedField(null)}
                  error={!!errors.company}
                  hint={errors.company}
                />

                <View className="items-center pb-1">
                  <Text className="w-full font-jakarta text-sm text-text-primary">
                    By registering you agree to our{" "}
                    <Text className="underline">Terms of Service</Text> and{" "}
                    <Text className="underline">Privacy Policy</Text>
                  </Text>
                </View>

                <AppButton label="Create Account" onPress={handleCreateAccount} />
              </View>
            </View>

            <View className="w-full flex-row items-baseline gap-2">
              <Text className="font-jakarta text-sm text-text-primary">
                Already have an account?
              </Text>
              <Pressable onPress={() => router.replace("/(auth)")}>
                <Text className="font-jakarta text-[15px] font-semibold text-main-accent-pink">
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
