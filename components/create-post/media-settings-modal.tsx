import { BlurView } from "expo-blur";
import { useEffect, useState } from "react";
import Modal from "react-native-modal";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

function CloseLargeIcon() {
  return (
    <View className="h-5 w-5 items-center justify-center">
      <View className="absolute w-3 h-[1.5px] rounded-full bg-[#A3A3A3] rotate-45" />
      <View className="absolute w-3 h-[1.5px] rounded-full bg-[#A3A3A3] -rotate-45" />
    </View>
  );
}

export function MediaSettingsModal({
  isVisible,
  onClose,
  initialAltText = "",
  onSave,
}: {
  isVisible: boolean;
  onClose: () => void;
  initialAltText?: string;
  onSave?: (value: string) => void;
}) {
  const [altText, setAltText] = useState(initialAltText);

  useEffect(() => {
    if (isVisible) {
      setAltText(initialAltText);
    }
  }, [initialAltText, isVisible]);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      customBackdrop={
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(65, 64, 66, 0.3)" }]}
          onPress={onClose}
        >
          <BlurView
            intensity={20}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFillObject}
          />
        </Pressable>
      }
      animationIn="fadeIn"
      animationOut="fadeOut"
      style={{ marginHorizontal: 20, justifyContent: "center" }}
    >
      <View
        className="rounded-[24px] bg-main-sections p-6"
        style={{
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 13 },
          shadowOpacity: 0.1,
          shadowRadius: 28,
          elevation: 24,
        }}
      >
        <View className="mb-8 flex-row items-center justify-between">
          <Text className="font-jakarta text-h1 font-semibold text-text-primary">
            Media Settings
          </Text>
          <Pressable
            className="h-8 w-8 items-center justify-center"
            onPress={onClose}
            hitSlop={8}
          >
            <CloseLargeIcon />
          </Pressable>
        </View>

        <View className="mb-8 gap-2">
          <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
            Alt Text (for accessibility)
          </Text>
          <TextInput
            value={altText}
            onChangeText={setAltText}
            placeholder="Describe the image/video content..."
            placeholderTextColor="#A3A3A3"
            className="h-[52px] rounded-[10px] border border-input-stroke-default bg-input-bg font-jakarta text-body-1 text-text-primary pl-4 pr-3 py-1"
            selectionColor="#612BD3"
          />
        </View>

        <View className="gap-3">
          <Pressable
            className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
            onPress={() => {
              onSave?.(altText);
              onClose();
            }}
          >
            <Text className="font-jakarta text-button font-semibold text-white">
              Save Changes
            </Text>
          </Pressable>

          <Pressable
            className="h-11 items-center justify-center rounded-[8px] border border-buttons-stroke-stroke"
            onPress={onClose}
          >
            <Text className="font-jakarta text-button font-semibold text-text-primary">
              Cancel
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
