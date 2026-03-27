import type { StyleProp, ViewStyle } from "react-native";
import { Dimensions, useWindowDimensions, View } from "react-native";
import Modal from "react-native-modal";

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
  hasBackdrop?: boolean;
  backdropColor?: string;
  backdropOpacity?: number;
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
  hasBackdrop = true,
  backdropColor,
  backdropOpacity,
}: BottomSheetWrapperProps) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.max(0, windowHeight - topOffset);

  return (
    <Modal
      isVisible={isVisible}
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
      hasBackdrop
      backdropOpacity={backdropOpacity ?? (hasBackdrop ? 0.7 : 1)}
      backdropColor={backdropColor ?? (hasBackdrop ? "#0E0E0E" : "transparent")}
      backdropTransitionOutTiming={0}
      statusBarTranslucent
      deviceHeight={Dimensions.get("screen").height}
    >
      <View
        className="bg-[#1A1919] rounded-t-3xl px-4 pt-[10px] overflow-hidden"
        style={[
          {
            paddingBottom: useBottomInsetPadding ? 44 : 0,
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
