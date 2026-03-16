import { View } from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BottomSheetWrapperProps = {
  isVisible: boolean;
  children: React.ReactNode;
  onClose?: () => void;
};

export function BottomSheetWrapper({
  isVisible,
  children,
  onClose,
}: BottomSheetWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      isVisible={isVisible}
      hasBackdrop
      backdropOpacity={0.6}
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
    >
      <View
        style={{
          backgroundColor: "#242323",
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: Math.max(insets.bottom, 34),
        }}
      >
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
        {children}
      </View>
    </Modal>
  );
}
