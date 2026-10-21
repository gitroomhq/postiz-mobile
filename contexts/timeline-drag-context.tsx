import { createContext, useCallback, useContext, useState } from "react";
import { useSharedValue, type SharedValue } from "react-native-reanimated";

import type { ScheduledPost } from "@/types";

type TimelineDragContextValue = {
  // Shared values (UI thread) for 60fps animation
  isDragging: SharedValue<boolean>;
  dragTranslateX: SharedValue<number>;
  dragTranslateY: SharedValue<number>;
  dragOriginX: SharedValue<number>;
  dragOriginY: SharedValue<number>;
  draggedCardWidth: SharedValue<number>;
  targetHour: SharedValue<number>; // -1 = no target
  scrollOffset: SharedValue<number>;
  draggedPostId: SharedValue<string>;
  timelineOriginY: SharedValue<number>;

  // React state (JS thread)
  draggedPost: ScheduledPost | null;
  setDraggedPost: (post: ScheduledPost | null) => void;
  scrollEnabled: boolean;
  setScrollEnabled: (enabled: boolean) => void;

  // Drop callback
  onDrop: (postId: string, newHour: number) => void;
};

const TimelineDragContext = createContext<TimelineDragContextValue | null>(null);

type TimelineDragProviderProps = {
  onDrop: (postId: string, newHour: number) => void;
  children: React.ReactNode;
};

export function TimelineDragProvider({ onDrop, children }: TimelineDragProviderProps) {
  const isDragging = useSharedValue(false);
  const dragTranslateX = useSharedValue(0);
  const dragTranslateY = useSharedValue(0);
  const dragOriginX = useSharedValue(0);
  const dragOriginY = useSharedValue(0);
  const draggedCardWidth = useSharedValue(0);
  const targetHour = useSharedValue(-1);
  const scrollOffset = useSharedValue(0);
  const draggedPostId = useSharedValue("");

  const timelineOriginY = useSharedValue(0);

  const [draggedPost, setDraggedPost] = useState<ScheduledPost | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const handleDrop = useCallback(
    (postId: string, newHour: number) => {
      onDrop(postId, newHour);
    },
    [onDrop],
  );

  return (
    <TimelineDragContext.Provider
      value={{
        isDragging,
        dragTranslateX,
        dragTranslateY,
        dragOriginX,
        dragOriginY,
        draggedCardWidth,
        targetHour,
        scrollOffset,
        draggedPostId,
        draggedPost,
        setDraggedPost,
        scrollEnabled,
        setScrollEnabled,
        timelineOriginY,
        onDrop: handleDrop,
      }}
    >
      {children}
    </TimelineDragContext.Provider>
  );
}

export function useTimelineDragContext() {
  const ctx = useContext(TimelineDragContext);
  if (!ctx) {
    throw new Error("useTimelineDragContext must be used within a TimelineDragProvider");
  }
  return ctx;
}
