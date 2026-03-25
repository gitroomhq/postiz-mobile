import { useCallback } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Dimensions, Platform, useWindowDimensions, View } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
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

  const setNavBarColor = useCallback(() => {
    if (Platform.OS === "android") {
      void NavigationBar.setBackgroundColorAsync("#1A1919");
    }
  }, []);

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
      statusBarTranslucent
      deviceHeight={Dimensions.get("screen").height}
      onModalShow={setNavBarColor}
      onModalWillShow={setNavBarColor}
      onModalHide={setNavBarColor}
    >
      <View
        className="bg-[#1A1919] rounded-t-3xl px-4 pt-[10px] overflow-hidden"
        style={[
          {
            paddingBottom: useBottomInsetPadding
              ? Math.max(insets.bottom, 34) + 10
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
