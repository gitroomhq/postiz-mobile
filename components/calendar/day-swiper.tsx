import { memo, useCallback, useMemo, type ReactNode } from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SWIPE_THRESHOLD = 0.25;
const SWIPE_VELOCITY = 500;

type DaySwiperProps = {
  onChangeDate: (direction: number) => void;
  enabled?: boolean;
  children: (offset: -1 | 0 | 1) => ReactNode;
};

/**
 * Horizontally swipeable container that renders three pages (prev, current, next).
 * Swipe left → next day, swipe right → previous day.
 */
export const DaySwiper = memo(function DaySwiper({
  onChangeDate,
  enabled = true,
  children,
}: DaySwiperProps) {
  const { width: screenWidth } = useWindowDimensions();
  const translateX = useSharedValue(0);

  const handleSwipeComplete = useCallback(
    (direction: number) => {
      onChangeDate(direction);
      // Delay reset by one frame so React processes the state update first.
      // Without this, translateX resets to 0 while the old content is still rendered.
      requestAnimationFrame(() => {
        translateX.value = 0;
      });
    },
    [onChangeDate, translateX],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-15, 15])
        .failOffsetY([-10, 10])
        .enabled(enabled)
        .onUpdate((e) => {
          translateX.value = e.translationX;
        })
        .onEnd((e) => {
          const threshold = screenWidth * SWIPE_THRESHOLD;

          if (e.translationX < -threshold || (e.translationX < -50 && e.velocityX < -SWIPE_VELOCITY)) {
            // Swipe left → next day
            translateX.value = withTiming(-screenWidth, { duration: 200 }, () => {
              runOnJS(handleSwipeComplete)(1);
            });
          } else if (e.translationX > threshold || (e.translationX > 50 && e.velocityX > SWIPE_VELOCITY)) {
            // Swipe right → previous day
            translateX.value = withTiming(screenWidth, { duration: 200 }, () => {
              runOnJS(handleSwipeComplete)(-1);
            });
          } else {
            // Snap back
            translateX.value = withTiming(0, { duration: 150 });
          }
        }),
    [enabled, screenWidth, translateX, handleSwipeComplete],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const prevStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value - screenWidth }],
  }));

  const nextStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value + screenWidth }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <View style={{ flex: 1, overflow: "hidden" }}>
        {/* Previous day */}
        <Animated.View
          style={[{ position: "absolute", top: 0, bottom: 0, width: screenWidth }, prevStyle]}
        >
          {children(-1)}
        </Animated.View>

        {/* Current day */}
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {children(0)}
        </Animated.View>

        {/* Next day */}
        <Animated.View
          style={[{ position: "absolute", top: 0, bottom: 0, width: screenWidth }, nextStyle]}
        >
          {children(1)}
        </Animated.View>
      </View>
    </GestureDetector>
  );
});
