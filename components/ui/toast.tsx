import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

type ToastType = "success" | "error" | "info";

type ToastState = {
  message: string;
  type: ToastType;
  visible: boolean;
};

const ICON_MAP: Record<
  ToastType,
  { name: keyof typeof Ionicons.glyphMap; color: string }
> = {
  success: { name: "checkmark-circle", color: "#00EB75" },
  error: { name: "close-circle", color: "#FF3F3F" },
  info: { name: "information-circle", color: "#618DFF" },
};

const TOAST_DURATION = 2500;

let globalShowToast: ((message: string, type?: ToastType) => void) | null =
  null;

export function showToast(message: string, type: ToastType = "success") {
  globalShowToast?.(message, type);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "success",
    visible: false,
  });
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  const hide = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type, visible: true });

      translateY.value = 20;
      translateY.value = withSequence(
        withTiming(0, { duration: 250 }),
        withDelay(TOAST_DURATION, withTiming(20, { duration: 250 })),
      );

      opacity.value = 0;
      opacity.value = withSequence(
        withTiming(1, { duration: 250 }),
        withDelay(
          TOAST_DURATION,
          withTiming(0, { duration: 250 }, (finished) => {
            if (finished) runOnJS(hide)();
          }),
        ),
      );
    },
    [hide, opacity, translateY],
  );

  useEffect(() => {
    globalShowToast = show;
    return () => {
      globalShowToast = null;
    };
  }, [show]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const icon = ICON_MAP[toast.type];

  return (
    <View className="flex-1">
      {children}
      {toast.visible && (
        <Animated.View
          className="absolute bottom-[100px] self-center z-[9999] bg-[#242323] rounded-lg px-4 py-3 flex-row items-center gap-2"
          style={[{ elevation: 10 }, animatedStyle]}
        >
          <Ionicons name={icon.name} size={20} color={icon.color} />
          <Text className="text-white font-jakarta text-sm">
            {toast.message}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
