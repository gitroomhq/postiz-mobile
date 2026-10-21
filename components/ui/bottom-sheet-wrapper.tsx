import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  Keyboard,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Pressable as GHPressable } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";

type BottomSheetWrapperProps = {
  isVisible: boolean;
  children: ReactNode;
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

/**
 * Invisible backdrop that always receives touches via gesture handler.
 * Used when hasBackdrop={false} — BottomSheetBackdrop won't render at opacity 0.
 */
function InvisibleBackdrop({
  animatedIndex,
  onPress,
}: {
  animatedIndex: SharedValue<number>;
  onPress: () => void;
}) {
  // Only show when sheet is open (index >= 0)
  const style = useAnimatedStyle(() => ({
    opacity: animatedIndex.value >= 0 ? 1 : 0,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <GHPressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
      >
        <Animated.View style={StyleSheet.absoluteFill} />
      </GHPressable>
    </Animated.View>
  );
}

export function BottomSheetWrapper({
  isVisible,
  children,
  onClose,
  showHandle = true,
  containerStyle,
  fullHeight = false,
  topOffset = 0,
  useBottomInsetPadding = true,
  swipeEnabled = true,
  hasBackdrop = true,
  backdropColor,
  backdropOpacity,
}: BottomSheetWrapperProps) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = Math.max(0, windowHeight - topOffset);
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (isVisible) {
      Keyboard.dismiss();
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [isVisible]);

  const handleDismiss = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const flatStyle = containerStyle
    ? StyleSheet.flatten(containerStyle)
    : undefined;
  const sheetBgColor = flatStyle?.backgroundColor ?? "#1A1919";

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => {
      if (!hasBackdrop) {
        // No visible backdrop, but still dismissable on tap
        return (
          <InvisibleBackdrop
            animatedIndex={props.animatedIndex}
            onPress={() => sheetRef.current?.dismiss()}
          />
        );
      }
      return (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={backdropOpacity ?? 0.7}
          pressBehavior="close"
          style={[props.style, { backgroundColor: backdropColor ?? "#0E0E0E" }]}
        />
      );
    },
    [hasBackdrop, backdropOpacity, backdropColor],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose={swipeEnabled}
      onDismiss={handleDismiss}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: "#454444",
        width: 33,
        height: 4,
        borderRadius: 2,
      }}
      handleStyle={
        showHandle
          ? { paddingTop: 10, paddingBottom: 18 }
          : { display: "none" }
      }
      backgroundStyle={{
        backgroundColor: sheetBgColor as string,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <BottomSheetView
        style={[
          {
            paddingHorizontal: 16,
            paddingBottom: useBottomInsetPadding ? 44 : 0,
            height: fullHeight ? sheetHeight : undefined,
            overflow: "hidden",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          containerStyle,
          { backgroundColor: "transparent" },
        ]}
      >
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
