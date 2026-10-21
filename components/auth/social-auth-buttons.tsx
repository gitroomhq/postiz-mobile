import * as AppleAuthentication from "expo-apple-authentication";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";

import { showToast } from "@/components/ui/toast";
import { useAuthStore, type AuthProvider, type OAuthResult } from "@/store/auth-store";

type Props = {
  onNeedsRegistration?: (provider: AuthProvider, providerToken: string) => void;
};

export function SocialAuthButtons({ onNeedsRegistration }: Props) {
  const oauthLogin = useAuthStore((state) => state.oauthLogin);
  const appleLogin = useAuthStore((state) => state.appleLogin);
  const [pending, setPending] = useState<AuthProvider | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const handleResult = (provider: AuthProvider, result: OAuthResult) => {
    if (!result.ok) {
      if (!result.cancelled) showToast(result.error, "error");
      return;
    }
    if (result.needsRegistration) {
      onNeedsRegistration?.(provider, result.providerToken);
      return;
    }
    showToast("Signed in", "success");
  };

  const handleGoogle = async () => {
    if (pending) return;
    setPending("GOOGLE");
    const result = await oauthLogin("GOOGLE");
    setPending(null);
    handleResult("GOOGLE", result);
  };

  const handleApple = async () => {
    if (pending) return;
    setPending("APPLE");
    const result = await appleLogin();
    setPending(null);
    handleResult("APPLE", result);
  };

  return (
    <View className="w-full gap-3">
      {appleAvailable ? (
        <Pressable
          onPress={handleApple}
          disabled={!!pending}
          className={`h-[52px] w-full flex-row items-center justify-center gap-3 rounded-[10px] bg-white ${
            pending ? "opacity-70" : ""
          }`}
        >
          {pending === "APPLE" ? (
            <ActivityIndicator color="#0E0E0E" />
          ) : (
            <>
              <Image
                source={require("@/assets/icons/login/apple.svg")}
                className="w-6 h-6"
                contentFit="contain"
              />
              <Text className="w-[160px] font-jakarta text-[15px] font-semibold text-[#0E0E0E]">
                Continue with Apple
              </Text>
            </>
          )}
        </Pressable>
      ) : null}

      <Pressable
        onPress={handleGoogle}
        disabled={!!pending}
        className={`h-[52px] w-full flex-row items-center justify-center gap-3 rounded-[10px] bg-white ${
          pending ? "opacity-70" : ""
        }`}
      >
        {pending === "GOOGLE" ? (
          <ActivityIndicator color="#0E0E0E" />
        ) : (
          <>
            <Image
              source={require("@/assets/icons/login/google.svg")}
              className="w-6 h-6"
              contentFit="contain"
            />
            <Text className="w-[160px] font-jakarta text-[15px] font-semibold text-[#0E0E0E]">
              Continue with Google
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
