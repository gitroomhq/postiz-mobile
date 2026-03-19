import type { StyleProp, ViewStyle } from "react-native";
import { useWindowDimensions, View } from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomSheetWrapperProps = {
  isVisible: boolean;
  children: React.ReactNode;
  onClose?: () => void;
  showHandle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  backdropColor?: string;
  backdropOpacity?: number;
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
  backdropColor = "#000000",
  backdropOpacity = 0.6,
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
      hasBackdrop
      backdropColor={backdropColor}
      backdropOpacity={backdropOpacity}
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
      useNativeDriverForBackdrop
      avoidKeyboard={avoidKeyboard}
    >
      <View
        style={[
          {
            backgroundColor: "#242323",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: useBottomInsetPadding
              ? Math.max(insets.bottom, 34)
              : 0,
            overflow: "hidden",
            height: fullHeight ? sheetHeight : undefined,
          },
          containerStyle,
        ]}
      >
        {showHandle ? (
          <View
            style={{
              width: 33,
              height: 4,
              borderRadius: 2,
              backgroundColor: "#454444",
              alignSelf: "center",
              marginBottom: 18,
            }}
          />
        ) : null}
        {children}
      </View>
    </Modal>
  );
}
