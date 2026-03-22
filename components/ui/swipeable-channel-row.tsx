import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const DELETE_BUTTON_SIZE = 34;
const GAP = 8;
const CARD_PADDING = 8;
const SLIDE_DISTANCE = DELETE_BUTTON_SIZE + GAP + CARD_PADDING;
const SNAP_THRESHOLD = SLIDE_DISTANCE / 2;
const SCREEN_WIDTH = Dimensions.get("window").width;

const SPRING_CONFIG = { damping: 20, stiffness: 200 };

type SwipeableChannelRowProps = {
  id: string;
  isOpen: boolean;
  onSwipeOpen: (id: string) => void;
  onDelete: (id: string) => void;
  children: React.ReactNode;
};

export function SwipeableChannelRow({
  id,
  isOpen,
  onSwipeOpen,
  onDelete,
  children,
}: SwipeableChannelRowProps) {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const [rowWidth, setRowWidth] = useState(0);

  useEffect(() => {
    translateX.value = withSpring(isOpen ? -SLIDE_DISTANCE : 0, SPRING_CONFIG);
  }, [isOpen, translateX]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationX;
      translateX.value = Math.max(-SLIDE_DISTANCE - 10, Math.min(0, newX));
    })
    .onEnd(() => {
      if (translateX.value < -SNAP_THRESHOLD) {
        translateX.value = withSpring(-SLIDE_DISTANCE, SPRING_CONFIG);
        runOnJS(onSwipeOpen)(id);
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const cardBgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      translateX.value,
      [0, -SLIDE_DISTANCE],
      ["#1A1919", "#232222"]
    ),
    borderRadius: 8,
  }));

  const deleteOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, -SLIDE_DISTANCE], [0, 1]),
  }));

  const handleDelete = () => {
    translateX.value = withTiming(-SCREEN_WIDTH, { duration: 250 }, () => {
      runOnJS(onDelete)(id);
    });
  };

  return (
    <View onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)} style={{ overflow: 'visible' }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={slideStyle} className="flex-row items-center">
          <Animated.View style={[cardBgStyle, { width: rowWidth || "100%", flexShrink: 0 }]}>
            {children}
          </Animated.View>

          <Animated.View style={[deleteOpacityStyle, { width: DELETE_BUTTON_SIZE, marginLeft: GAP, flexShrink: 0 }]}>
            <Pressable
              className="h-[34px] w-[34px] items-center justify-center rounded-[6px] bg-text-critical"
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} className="text-white" />
            </Pressable>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
