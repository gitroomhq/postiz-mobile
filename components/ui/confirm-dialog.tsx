import { BlurView } from "expo-blur";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "No, Cancel",
  confirmDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlayRoot}>
        <BlurView
          intensity={20}
          tint="dark"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFillObject}
        />
        <Pressable
          style={styles.overlayPressable}
          onPress={onCancel}
        >
          <Pressable
            className="mx-6 w-[327px] rounded-[16px] bg-main-sections-2 p-6"
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              className="absolute right-4 top-4 h-8 w-8 items-center justify-center"
              onPress={onCancel}
            >
              <Ionicons name="close" size={20} className="text-icon-primary" />
            </Pressable>

            <Text className="mb-2 text-center font-jakarta text-h3 font-semibold text-text-primary">
              {title}
            </Text>
            <Text className="mb-6 text-center font-jakarta text-body-1 text-text-secondary">
              {message}
            </Text>
            <View className="gap-3">
              <Pressable
                className="h-11 items-center justify-center rounded-[8px] bg-buttons-tertiary-bg"
                onPress={onCancel}
              >
                <Text className="font-jakarta text-button font-semibold text-text-primary">
                  {cancelLabel}
                </Text>
              </Pressable>
              <Pressable
                className={`h-11 items-center justify-center rounded-[8px] ${
                  confirmDestructive
                    ? "bg-text-critical"
                    : "bg-buttons-primary-bg"
                }`}
                onPress={onConfirm}
              >
                <Text className="font-jakarta text-button font-semibold text-white">
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: "rgba(65, 64, 66, 0.3)",
  },
  overlayPressable: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
