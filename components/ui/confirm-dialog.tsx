import { BlurView } from "expo-blur";
import { Dimensions, Pressable, Text, View } from "react-native";
import Modal from "react-native-modal";

function CloseLargeIcon() {
  return (
    <View className="h-5 w-5 items-center justify-center">
      <View className="absolute h-[1.5px] w-3 rounded-full bg-[#A3A3A3] rotate-45" />
      <View className="absolute h-[1.5px] w-3 rounded-full bg-[#A3A3A3] -rotate-45" />
    </View>
  );
}

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
      isVisible={visible}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      animationIn="fadeIn"
      animationOut="fadeOut"
      animationInTiming={200}
      animationOutTiming={200}
      useNativeDriver
      useNativeDriverForBackdrop
      backdropOpacity={0}
      backdropTransitionOutTiming={200}
      statusBarTranslucent
      deviceHeight={Dimensions.get("screen").height}
      style={{ margin: 0 }}
    >
      <View className="flex-1 bg-[rgba(65,64,66,0.3)]">
        <BlurView
          intensity={20}
          tint="dark"
          blurMethod="dimezisBlurView"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <Pressable className="flex-1 items-center justify-center" onPress={onCancel}>
          <Pressable
            className="mx-5 w-full max-w-[335px] rounded-[24px] bg-main-sections px-6 pb-6 pt-12"
            style={{ shadowColor: "#000000", shadowOffset: { width: 0, height: 13 }, shadowOpacity: 0.1, shadowRadius: 28, elevation: 24 }}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              className="absolute right-5 top-5 h-5 w-5 items-center justify-center"
              onPress={onCancel}
            >
              <CloseLargeIcon />
            </Pressable>

            <Text className="mb-2 text-center font-jakarta text-h1 font-semibold text-text-primary">
              {title}
            </Text>
            <Text className="mb-8 text-center font-jakarta text-body-1 text-text-secondary">
              {message}
            </Text>
            <View className="gap-3">
              <Pressable
                className="h-11 items-center justify-center rounded-[8px] border border-buttons-stroke-stroke"
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
