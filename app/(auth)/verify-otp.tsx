import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";

const CODE_LENGTH = 5;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const fullCode = code.join("");
  const isCodeComplete = fullCode.length === CODE_LENGTH;
  const canVerify = isCodeComplete && !error;

  const handleChange = (text: string, index: number) => {
    if (error) setError(null);

    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newCode = [...code];
      newCode[index - 1] = "";
      setCode(newCode);
    }
  };

  const handleVerify = () => {
    if (!isCodeComplete) {
      return;
    }
    if (fullCode !== "11111") {
      setError("Incorrect code");
      return;
    }
    router.push("/(auth)/reset-password" as any);
  };

  const handleResend = () => {
    setCode(Array(CODE_LENGTH).fill(""));
    setError(null);
    inputRefs.current[0]?.focus();
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
              <Ionicons name="chevron-back" size={20} className="text-icon-primary" />
            </Pressable>
          </View>

          <View className="gap-8">
            <View className="gap-3">
              <Text className="font-jakarta text-2xl font-semibold leading-8 text-text-primary">
                Verify your account
              </Text>
              <Text className="font-jakarta text-sm text-text-secondary">
                Enter the 5-digit code sent to your email
              </Text>
            </View>

            <View className="gap-1">
              <View className="w-full flex-row justify-between">
                {code.map((digit, index) => (
                  <View
                    key={index}
                    className={`h-[52px] w-[56px] items-center justify-center overflow-hidden rounded-[10px] border ${
                      error
                        ? "border-text-critical"
                        : focusedIndex === index
                          ? "border-main-accent-purple"
                          : "border-input-stroke-default"
                    } bg-input-bg px-3 py-1`}
                  >
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      className={`h-full w-full text-center font-jakarta text-body-1 font-normal ${error ? "text-text-critical" : "text-text-primary"}`}
                      value={digit}
                      onChangeText={(text) => handleChange(text, index)}
                      onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      selectionColor="#8A62FD"
                      showSoftInputOnFocus
                    />
                  </View>
                ))}
              </View>

              {error ? (
                <Text className="font-jakarta text-xs leading-3 text-text-critical">{error}</Text>
              ) : null}
            </View>

            <AppButton
              label="Verify"
              variant={canVerify ? "primary" : "disabled"}
              disabled={!canVerify}
              onPress={handleVerify}
            />

            <View className="flex-row items-center gap-2">
              <Text className="font-jakarta text-sm text-text-primary">
                Don&apos;t received code?
              </Text>
              <Pressable onPress={handleResend}>
                <Text className="font-jakarta text-[15px] font-semibold text-main-accent-pink">
                  Resend
                </Text>
              </Pressable>
            </View>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}
