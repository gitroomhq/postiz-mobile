import { memo, useCallback, useRef, useState } from "react";
import {
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import Svg, { Rect } from "react-native-svg";

import { DraggableEventCard } from "@/components/calendar/draggable-event-card";
import { useTimelineDragContext } from "@/contexts/timeline-drag-context";
import type { ScheduledPost, TimeSlot } from "@/types";
import { getPostHour, set } from "@/utils/calendar";

export const HOUR_HEIGHT = 120;
const MAX_VISIBLE_POSTS = 3;
const PAST_SLOT_PATTERN_COUNT = 40;
const PAST_SLOT_START_X = 143.379;
const PAST_SLOT_START_Y = -162.739;
const PAST_SLOT_STEP = 5.657;

type TimelineViewProps = {
  timeSlots: TimeSlot[];
  posts: ScheduledPost[];
  selectedDate: Date;
  referenceNow: Date;
  selectedPostId: string | null;
  selectedSlotHour: number | null;
  onSlotPress: (hour: number) => void;
  onPostPress: (post: ScheduledPost) => void;
};

function PastSlotPatternSvg() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 291 120" preserveAspectRatio="none">
      {Array.from({ length: PAST_SLOT_PATTERN_COUNT }).map((_, index) => {
        const originX = PAST_SLOT_START_X + index * PAST_SLOT_STEP;
        const originY = PAST_SLOT_START_Y + index * PAST_SLOT_STEP;

        return (
          <Rect
            key={index}
            x={originX}
            y={originY}
            width={6}
            height={312}
            fill="#000000"
            fillOpacity={0.16}
            rotation={45}
            originX={originX}
            originY={originY}
          />
        );
      })}
    </Svg>
  );
}

function PassedSlotPattern() {
  return (
    <View className="h-full overflow-hidden rounded-[8px] bg-slot-bg-default">
      <PastSlotPatternSvg />
    </View>
  );
}

function SlotBlock({
  height,
  isSelected,
  onPress,
}: {
  height: number | "flex";
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={height === "flex" ? { flex: 1 } : undefined}>
      <View
        className={`rounded-[8px] border bg-slot-bg-default ${isSelected ? "border-slot-stroke-active" : "border-slot-stroke-default"}`}
        style={height === "flex" ? { flex: 1 } : { height }}
      />
    </Pressable>
  );
}

function DropTargetHighlight({ hour }: { hour: number }) {
  const { isDragging, targetHour } = useTimelineDragContext();

  const highlightStyle = useAnimatedStyle(() => {
    const isTarget = isDragging.value && targetHour.value === hour;
    return {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 8,
      borderWidth: isTarget ? 2 : 0,
      borderColor: "#612BD3",
      backgroundColor: isTarget ? "rgba(97, 43, 211, 0.1)" : "transparent",
      opacity: isTarget ? 1 : 0,
    };
  });

  return <Animated.View style={highlightStyle} pointerEvents="none" />;
}

type TimelineSlotRowProps = {
  slot: TimeSlot;
  slotPosts: ScheduledPost[];
  selectedDate: Date;
  referenceNow: Date;
  selectedPostId: string | null;
  isSlotSelected: boolean;
  hasDraggedPost: boolean;
  expandedSlots: Set<number>;
  onToggleSlot: (hour: number) => void;
  onSlotPress: (hour: number) => void;
  onPostPress: (post: ScheduledPost) => void;
};

const TimelineSlotRow = memo(function TimelineSlotRow({
  slot,
  slotPosts,
  selectedDate,
  referenceNow,
  selectedPostId,
  isSlotSelected,
  hasDraggedPost,
  expandedSlots,
  onToggleSlot,
  onSlotPress,
  onPostPress,
}: TimelineSlotRowProps) {
  const hasPosts = slotPosts.length > 0;
  const slotTime = set(selectedDate, {
    hours: slot.hour,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
  const isSlotPast = slotTime < referenceNow;
  const isPastSlot = isSlotPast && !hasPosts;
  const [hourLabel, meridiemLabel] = slot.label.split(" ");

  const isExpanded = expandedSlots.has(slot.hour);
  const hasMore = slotPosts.length > MAX_VISIBLE_POSTS;
  const visiblePosts = hasMore && !isExpanded
    ? slotPosts.slice(0, MAX_VISIBLE_POSTS)
    : slotPosts;
  const hiddenCount = slotPosts.length - MAX_VISIBLE_POSTS;

  return (
    <View
      style={hasPosts ? undefined : { height: HOUR_HEIGHT }}
      className="mb-[4px] flex-row"
    >
      <View className="w-12 pl-1 pt-1">
        <Text className="font-jakarta text-body-4 font-medium leading-[17px] text-[#B3B3B3]">
          {hourLabel}
        </Text>
        <Text className="font-jakarta text-body-4 font-medium leading-[17px] text-[#B3B3B3]">
          {meridiemLabel}
        </Text>
      </View>

      <View className="flex-1 gap-1 pr-px">
        {hasPosts ? (
          <>
            {visiblePosts.map((p) => (
              <DraggableEventCard
                key={p.id}
                post={p}
                isSelected={selectedPostId === p.id}
                onPress={() => onPostPress(p)}
              />
            ))}
            {hasMore && (
              <Pressable
                onPress={() => onToggleSlot(slot.hour)}
                className="items-center justify-center rounded-[8px] bg-slot-bg-default py-[10px]"
              >
                <Text className="font-jakarta text-body-4 font-semibold text-buttons-primary-bg">
                  {isExpanded
                    ? "Show less"
                    : `+ Show more (${hiddenCount})`}
                </Text>
              </Pressable>
            )}
            {!isSlotPast ? (
              <View className="relative">
                <SlotBlock
                  height={44}
                  isSelected={isSlotSelected}
                  onPress={() => onSlotPress(slot.hour)}
                />
                {hasDraggedPost && <DropTargetHighlight hour={slot.hour} />}
              </View>
            ) : hasDraggedPost ? (
              <View className="relative h-[44px]">
                <DropTargetHighlight hour={slot.hour} />
              </View>
            ) : null}
          </>
        ) : isPastSlot ? (
          <Pressable
            onPress={() => onSlotPress(slot.hour)}
            className="flex-1 relative"
          >
            <PassedSlotPattern />
            {isSlotSelected && (
              <View
                pointerEvents="none"
                className="absolute inset-0 rounded-[8px] border border-slot-stroke-active"
              />
            )}
            {hasDraggedPost && <DropTargetHighlight hour={slot.hour} />}
          </Pressable>
        ) : (
          <View className="flex-1 relative">
            <SlotBlock
              height="flex"
              isSelected={isSlotSelected}
              onPress={() => onSlotPress(slot.hour)}
            />
            {hasDraggedPost && <DropTargetHighlight hour={slot.hour} />}
          </View>
        )}
      </View>
    </View>
  );
});

export function TimelineView({
  timeSlots,
  posts,
  selectedDate,
  referenceNow,
  selectedPostId,
  selectedSlotHour,
  onSlotPress,
  onPostPress,
}: TimelineViewProps) {
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set());
  const dragCtx = useTimelineDragContext();
  const timelineContentRef = useRef<View>(null);

  const toggleSlot = useCallback((hour: number) => {
    setExpandedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(hour)) {
        next.delete(hour);
      } else {
        next.add(hour);
      }
      return next;
    });
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragCtx.scrollOffset.value = e.nativeEvent.contentOffset.y;
    },
    [dragCtx.scrollOffset],
  );

  const measureTimelineOrigin = useCallback(() => {
    timelineContentRef.current?.measureInWindow((_x, y) => {
      dragCtx.timelineOriginY.value = y;
    });
  }, [dragCtx.timelineOriginY]);

  const hasDraggedPost = dragCtx.draggedPost !== null;

  const keyExtractor = useCallback((item: TimeSlot) => String(item.hour), []);

  const renderItem = useCallback(
    ({ item: slot }: { item: TimeSlot }) => {
      const slotPosts = posts.filter((p) => getPostHour(p) === slot.hour);

      return (
        <TimelineSlotRow
          slot={slot}
          slotPosts={slotPosts}
          selectedDate={selectedDate}
          referenceNow={referenceNow}
          selectedPostId={selectedPostId}
          isSlotSelected={selectedSlotHour === slot.hour}
          hasDraggedPost={hasDraggedPost}
          expandedSlots={expandedSlots}
          onToggleSlot={toggleSlot}
          onSlotPress={onSlotPress}
          onPostPress={onPostPress}
        />
      );
    },
    [
      posts,
      selectedDate,
      referenceNow,
      selectedPostId,
      selectedSlotHour,
      hasDraggedPost,
      expandedSlots,
      toggleSlot,
      onSlotPress,
      onPostPress,
    ],
  );

  return (
    <View ref={timelineContentRef} onLayout={measureTimelineOrigin} className="flex-1">
      <FlatList
        data={timeSlots}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-4"
        scrollEnabled={dragCtx.scrollEnabled}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialNumToRender={10}
        maxToRenderPerBatch={6}
        windowSize={5}
      />
    </View>
  );
}
