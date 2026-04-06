import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, type StyleProp, type ViewStyle } from "react-native";

type AnimatedDropdownProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Corner the dropdown grows from (matches where the trigger button sits) */
  anchor?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  style?: StyleProp<ViewStyle>;
};

/**
 * iOS-style context menu / popover animation.
 *
 * - Open:  scale 0.01→1 from the anchor corner, opacity 0→1, 220ms ease-out
 * - Close: scale 1→0.01, opacity 1→0, 180ms ease-in
 *
 * React Native doesn't support `transformOrigin`, so we fake it:
 * the parent positions the dropdown (via `style`) so its anchor corner
 * is at the trigger, and we apply a translate that shifts the scaling
 * center toward that corner.
 */
export function AnimatedDropdown({
  visible,
  onClose,
  children,
  anchor = "top-right",
  style,
}: AnimatedDropdownProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else if (rendered) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
      });
    }
  }, [visible, progress, rendered]);

  if (!rendered) return null;

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, 1],
  });

  // Fake transform-origin: shift toward the anchor corner while scaling
  // so the menu appears to grow out of the trigger button.
  const isRight = anchor.includes("right");
  const isBottom = anchor.includes("bottom");

  // When scale is 0 the view collapses to center; these translations
  // push the visual center toward the anchor corner so the collapsed
  // point matches the trigger position.
  const compensateX = progress.interpolate({
    inputRange: [0, 1],
    // Half the menu width isn't known, so we use a generous value;
    // the menu is absolutely positioned at the anchor anyway, so the
    // visual result is correct even if the value isn't pixel-perfect.
    outputRange: [isRight ? 80 : -80, 0],
  });
  const compensateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [isBottom ? 40 : -40, 0],
  });

  return (
    <>
      <Pressable
        className="absolute -top-[2000px] -bottom-[2000px] -left-[2000px] -right-[2000px] z-10"
        onPress={onClose}
      />
      <Animated.View
        style={[
          {
            opacity: progress,
            transform: [
              { translateX: compensateX },
              { translateY: compensateY },
              { scale },
            ],
            zIndex: 20,
          },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </>
  );
}
