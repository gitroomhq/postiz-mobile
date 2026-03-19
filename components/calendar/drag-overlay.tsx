import { useCallback, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { TimelineEventCard } from "@/components/calendar/timeline-event-card";
import { useTimelineDragContext } from "@/contexts/timeline-drag-context";

export function DragOverlay() {
  const {
    isDragging,
    dragOriginX,
    dragOriginY,
    dragTranslateX,
    dragTranslateY,
    draggedCardWidth,
    draggedPost,
  } = useTimelineDragContext();

  const containerRef = useRef<View>(null);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const handleLayout = useCallback(() => {
    containerRef.current?.measureInWindow((x, y) => {
      offsetX.value = x;
      offsetY.value = y;
    });
  }, [offsetX, offsetY]);

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute" as const,
    left: dragOriginX.value - offsetX.value,
    top: dragOriginY.value - offsetY.value,
    width: draggedCardWidth.value || 200,
    transform: [
      { translateX: dragTranslateX.value },
      { translateY: dragTranslateY.value },
      { scale: isDragging.value ? 1.05 : 1.0 },
    ],
    opacity: isDragging.value ? 0.9 : 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  }));

  return (
    <View
      ref={containerRef}
      onLayout={handleLayout}
      style={StyleSheet.absoluteFill}
      pointerEvents="box-none"
    >
      {draggedPost && (
        <Animated.View style={animatedStyle} pointerEvents="none">
          <TimelineEventCard post={draggedPost} isSelected={false} onPress={() => {}} />
        </Animated.View>
      )}
    </View>
  );
}
