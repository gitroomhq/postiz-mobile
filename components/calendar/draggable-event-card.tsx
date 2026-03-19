import * as Haptics from "expo-haptics";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  measure,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { TimelineEventCard } from "@/components/calendar/timeline-event-card";
import { useTimelineDragContext } from "@/contexts/timeline-drag-context";
import type { ScheduledPost } from "@/types";
import { getPostHour } from "@/utils/calendar";

const HOUR_HEIGHT = 120;
const CARD_HALF_HEIGHT = 36; // half of 72px card
const SPRING_CONFIG = { damping: 20, stiffness: 200 };

type DraggableEventCardProps = {
  post: ScheduledPost;
  isSelected: boolean;
  onPress: () => void;
};

export function DraggableEventCard({ post, isSelected, onPress }: DraggableEventCardProps) {
  const dragCtx = useTimelineDragContext();
  const cardRef = useAnimatedRef<Animated.View>();
  const isLongPressActive = useSharedValue(false);

  // Pre-compute on the JS thread (date-fns can't run in UI-thread worklets)
  const originalHour = getPostHour(post);

  function triggerHaptic() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  function startDrag(p: ScheduledPost) {
    dragCtx.setScrollEnabled(false);
    dragCtx.setDraggedPost(p);
  }

  function completeDrop(postId: string, newHour: number) {
    dragCtx.onDrop(postId, newHour);
    dragCtx.setScrollEnabled(true);
    dragCtx.setDraggedPost(null);
  }

  function cancelDrag() {
    dragCtx.setScrollEnabled(true);
    dragCtx.setDraggedPost(null);
  }

  const longPressGesture = Gesture.LongPress()
    .minDuration(300)
    .onStart(() => {
      isLongPressActive.value = true;
      dragCtx.isDragging.value = true;
      dragCtx.dragTranslateX.value = 0;
      dragCtx.dragTranslateY.value = 0;
      dragCtx.draggedPostId.value = post.id;

      const measurement = measure(cardRef);
      if (measurement) {
        dragCtx.dragOriginX.value = measurement.pageX;
        dragCtx.dragOriginY.value = measurement.pageY;
        dragCtx.draggedCardWidth.value = measurement.width;
      }

      runOnJS(triggerHaptic)();
      runOnJS(startDrag)(post);
    });

  const panGesture = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_event, stateManager) => {
      if (isLongPressActive.value) {
        stateManager.activate();
      } else {
        stateManager.fail();
      }
    })
    .onUpdate((event) => {
      dragCtx.dragTranslateX.value = event.translationX;
      dragCtx.dragTranslateY.value = event.translationY;

      // Calculate target hour from absolute Y position
      const cardCenterY =
        dragCtx.dragOriginY.value + event.translationY + CARD_HALF_HEIGHT;
      const adjustedY =
        cardCenterY - dragCtx.timelineOriginY.value + dragCtx.scrollOffset.value;
      const hour = Math.floor(adjustedY / HOUR_HEIGHT);
      dragCtx.targetHour.value = Math.max(0, Math.min(23, hour));
    })
    .onEnd(() => {
      const finalHour = dragCtx.targetHour.value;
      isLongPressActive.value = false;

      if (finalHour >= 0 && finalHour <= 23 && finalHour !== originalHour) {
        // Successful drop — immediately hide ghost, then update data
        dragCtx.isDragging.value = false;
        dragCtx.draggedPostId.value = "";
        dragCtx.targetHour.value = -1;
        dragCtx.dragTranslateX.value = 0;
        dragCtx.dragTranslateY.value = 0;
        runOnJS(completeDrop)(post.id, finalHour);
      } else {
        // Same slot or invalid — spring back to original position
        dragCtx.dragTranslateX.value = withSpring(0, SPRING_CONFIG);
        dragCtx.dragTranslateY.value = withSpring(0, SPRING_CONFIG, () => {
          dragCtx.isDragging.value = false;
          dragCtx.draggedPostId.value = "";
          dragCtx.targetHour.value = -1;
        });
        runOnJS(cancelDrag)();
      }
    })
    .onFinalize(() => {
      // Safety cleanup if gesture cancelled unexpectedly
      if (isLongPressActive.value) {
        isLongPressActive.value = false;
        dragCtx.isDragging.value = false;
        dragCtx.draggedPostId.value = "";
        dragCtx.targetHour.value = -1;
        dragCtx.dragTranslateX.value = 0;
        dragCtx.dragTranslateY.value = 0;
        runOnJS(cancelDrag)();
      }
    });

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  // Fade out the original card when it is being dragged
  const cardOpacityStyle = useAnimatedStyle(() => ({
    opacity:
      dragCtx.isDragging.value && dragCtx.draggedPostId.value === post.id
        ? 0.3
        : 1,
  }));

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View ref={cardRef} style={cardOpacityStyle}>
        <TimelineEventCard post={post} isSelected={isSelected} onPress={onPress} />
      </Animated.View>
    </GestureDetector>
  );
}
