import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    company?: string;
  }>({});
  const passwordInputRef = useRef<TextInput>(null);

  const handleTogglePassword = () => {
    const wasFocused = passwordInputRef.current?.isFocused() ?? false;
    setPasswordVisible((prev) => !prev);
    if (wasFocused) {
      requestAnimationFrame(() => {
        passwordInputRef.current?.focus();
      });
    }
  };

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
      <ScrollView
        className="flex-1 bg-background-primary"
        contentContainerClassName="flex-grow px-5 pt-12 pb-[20px]"
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

          <View className="gap-5">
            <View className="relative gap-6">
              <Text className="font-jakarta text-2xl font-semibold leading-8 text-text-primary">
                Sign Up
              </Text>
              <View
                pointerEvents="none"
                className="absolute top-7 z-20"
                style={{ left: -8.25 }}
              >
                <Image
                  source={require("@/assets/icons/login/signup-doodle.svg")}
                  className="w-[153px] h-[13px]"
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
                  error={!!errors.email}
                  hint={errors.email}
                />

                <AuthInput
                  ref={passwordInputRef}
                  label="Password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  placeholder="Enter password"
                  secureTextEntry={!passwordVisible}
                  textContentType="none"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  smartInsertDelete={false}
                  keyboardType={Platform.OS === "ios" ? "ascii-capable" : "default"}
                  error={!!errors.password}
                  hint={errors.password}
                  rightSlot={
                    <Pressable
                      onPress={handleTogglePassword}
                      hitSlop={10}
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
                  error={!!errors.company}
                  hint={errors.company}
                />

              </View>
            </View>
          </View>

          <View className="mt-auto gap-6 pt-5">
            <View className="items-center pb-1">
              <Text className="w-full font-jakarta text-sm text-text-primary">
                By registering you agree to our{" "}
                <Text className="underline">Terms of Service</Text> and{" "}
                <Text className="underline">Privacy Policy</Text>
              </Text>
            </View>

            <AppButton label="Create Account" onPress={handleCreateAccount} />

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
    </SafeAreaView>
  );
}
