import { BlurView } from "expo-blur";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomSheetWrapperProps = {
  isVisible: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  showHandle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  fullHeight?: boolean;
  topOffset?: number;
  useBottomInsetPadding?: boolean;
  avoidKeyboard?: boolean;
  swipeEnabled?: boolean;
};

export function BottomSheetWrapper({
  isVisible,
  children,
  onClose,
  showHandle = true,
  containerStyle,
  fullHeight = false,
  topOffset = 0,
  useBottomInsetPadding = true,
  avoidKeyboard = false,
  swipeEnabled = true,
}: BottomSheetWrapperProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.max(0, windowHeight - insets.top - topOffset);

  return (
    <Modal
      isVisible={isVisible}
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
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      hideModalContentWhileAnimating
      swipeDirection="down"
      onSwipeComplete={onClose}
      propagateSwipe
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={300}
      style={{ justifyContent: "flex-end", margin: 0 }}
      avoidKeyboard={avoidKeyboard}
      statusBarTranslucent
    >
      <View
        className="bg-[#242323] rounded-t-3xl px-4 pt-[10px] overflow-hidden"
        style={[
          {
            paddingBottom: useBottomInsetPadding
              ? Math.max(insets.bottom, 34)
              : 0,
            height: fullHeight ? sheetHeight : undefined,
          },
          containerStyle,
        ]}
      >
        {showHandle ? (
          <View className="w-[33px] h-1 rounded-sm bg-[#454444] self-center mb-[18px]" />
        ) : null}
        {children}
      </View>
    </Modal>
  );
}
