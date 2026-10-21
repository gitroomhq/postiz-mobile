import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddPostSheet } from "@/components/calendar/add-post-sheet";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import {
  RepublishChoiceDialog,
  type RepublishChoice,
} from "@/components/create-post/republish-choice-dialog";
import { DatePill } from "@/components/calendar/date-pill";
import { DaySwiper, type DaySwiperHandle } from "@/components/calendar/day-swiper";
import { DateTimePickerSheet } from "@/components/calendar/datetime-picker-sheet";
import { DragOverlay } from "@/components/calendar/drag-overlay";
import { MonthSelector } from "@/components/calendar/month-selector";
import { PostDetailSheet } from "@/components/calendar/post-detail-sheet";
import { TimelineView, type TimelineViewHandle } from "@/components/calendar/timeline-view";
import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { NotificationBellButton } from "@/components/ui/notification-bell-button";
import { showToast } from "@/components/ui/toast";
import { TimelineDragProvider } from "@/contexts/timeline-drag-context";
import { useChannelsStore } from "@/store/channels-store";
import { usePostsStore } from "@/store/posts-store";
import type { ScheduledPost } from "@/types";
import {
  addMonths,
  subMonths,
  formatMonthName,
  generateTimeSlots,
  getCalendarDays,
  groupPostsByDate,
  set,
} from "@/utils/calendar";
import { format } from "date-fns";

/**
 * Frozen empty array reused as the day-bucket fallback so every empty
 * day passes the same reference into TimelineView. Without this, each
 * miss would create a new `[]` per render and bust child memoization.
 */
const EMPTY_POSTS: ScheduledPost[] = [];

export default function CalendarScreen() {

  const router = useRouter();

  // --- Global state ---
  const posts = usePostsStore((state) => state.posts);
  const fetchPosts = usePostsStore((state) => state.fetchPosts);
  const storeUpsertPost = usePostsStore((state) => state.upsertLocalPost);
  const storeDeletePost = usePostsStore((state) => state.deletePost);
  const storeReschedulePost = usePostsStore((state) => state.reschedulePost);
  const fetchChannels = useChannelsStore((state) => state.fetchChannels);

  // Fixed reference date — each carousel page computes its date from this
  const initialDate = useRef(new Date(new Date().setHours(0, 0, 0, 0))).current;

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [monthSelectorOpen, setMonthSelectorOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ScheduledPost | null>(null);
  const [dateTimeTarget, setDateTimeTarget] = useState<Date | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

  // --- Refs ---
  const timelineRef = useRef<TimelineViewHandle>(null);
  const daySwiperRef = useRef<DaySwiperHandle>(null);

  /**
   * Convert a calendar date into the DaySwiper's day-offset (relative to
   * `initialDate`, the day the screen mounted on). Used whenever we
   * change the selectedDate from outside the swiper (calendar grid tap,
   * post-save navigateToDate) so the carousel actually scrolls instead
   * of staying on its previous page.
   */
  const dayOffsetFromInitial = useCallback(
    (date: Date) => {
      const dayMs = 24 * 60 * 60 * 1000;
      const start = new Date(initialDate);
      start.setHours(0, 0, 0, 0);
      const target = new Date(date);
      target.setHours(0, 0, 0, 0);
      return Math.round((target.getTime() - start.getTime()) / dayMs);
    },
    [initialDate],
  );

  // --- Initial + month-scoped fetch ---
  useEffect(() => {
    void fetchChannels();
  }, [fetchChannels]);

  useEffect(() => {
    // Fetch posts for the visible month ± 1 week buffer so adjacent days are
    // already populated when the user swipes.
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    start.setDate(start.getDate() - 7);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    end.setDate(end.getDate() + 7);
    void fetchPosts(start, end);
  }, [currentMonth, fetchPosts]);

  // --- Navigate to date/time after create/edit ---
  const navigateToDate = usePostsStore((state) => state.navigateToDate);
  const setNavigateToDate = usePostsStore((state) => state.setNavigateToDate);

  useEffect(() => {
    if (!navigateToDate) return;
    const date = new Date(navigateToDate);
    setNavigateToDate(null);

    // Update calendar to that date
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    setSelectedDate(dayStart);
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setMonthSelectorOpen(false);
    daySwiperRef.current?.goToOffset(dayOffsetFromInitial(dayStart), false);

    const hour = date.getHours();
    setTimeout(() => {
      timelineRef.current?.scrollToHour(hour);
    }, 400);
  }, [navigateToDate, setNavigateToDate, dayOffsetFromInitial]);

  // --- Sheet visibility ---
  const [postDetailVisible, setPostDetailVisible] = useState(false);
  const [addPostVisible, setAddPostVisible] = useState(false);
  const [dateTimeVisible, setDateTimeVisible] = useState(false);
  /**
   * Holds the resolver while the timeline-drop republish-vs-update modal
   * is open, mirroring the web `await new Promise(...)` pattern from
   * calendar.tsx:672-714. Resolves with `null` on cancel.
   */
  const republishResolverRef = useRef<
    ((choice: RepublishChoice | null) => void) | null
  >(null);
  const [republishVisible, setRepublishVisible] = useState(false);

  // --- Derived ---
  // Stable reference — only refreshes when selectedDate changes, not every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const referenceNow = useMemo(() => new Date(), [selectedDate]);

  const postsMap = useMemo(() => groupPostsByDate(posts), [posts]);
  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth, selectedDate, postsMap),
    [currentMonth, selectedDate, postsMap],
  );
  const timeSlots = useMemo(() => generateTimeSlots(0, 23), []);

  const handleDayPress = useCallback(
    (date: Date) => {
      setSelectedDate(date);
      // Same no-op-skip as changeDate: don't replace currentMonth when the
      // tapped date is in the already-loaded month.
      setCurrentMonth((prevMonth) => {
        if (
          prevMonth.getFullYear() === date.getFullYear() &&
          prevMonth.getMonth() === date.getMonth()
        ) {
          return prevMonth;
        }
        return new Date(date.getFullYear(), date.getMonth(), 1);
      });
      setMonthSelectorOpen(false);
      // Drive the carousel to the picked date — without this, selectedDate
      // updates but the visible page stays put.
      daySwiperRef.current?.goToOffset(dayOffsetFromInitial(date), false);
    },
    [dayOffsetFromInitial],
  );

  const changeDate = useCallback((direction: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + direction);
      next.setHours(0, 0, 0, 0);
      // Only bump currentMonth when the swipe actually crosses a month
      // boundary. Without this, every swipe creates a fresh `new Date()`
      // for currentMonth — React's Object.is treats it as a change and
      // refires the month-fetch useEffect, hammering /posts on each
      // horizontal swipe.
      setCurrentMonth((prevMonth) => {
        if (
          prevMonth.getFullYear() === next.getFullYear() &&
          prevMonth.getMonth() === next.getMonth()
        ) {
          return prevMonth;
        }
        return new Date(next.getFullYear(), next.getMonth(), 1);
      });
      return next;
    });
    timelineRef.current?.scrollToTop();
  }, []);

  // Day swiping is handled by DaySwiper component

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  }, []);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  }, []);

  const handlePostPress = useCallback((post: ScheduledPost) => {
    setSelectedPost(post);
    setPostDetailVisible(true);
  }, []);

  const handleSlotPress = useCallback((hour: number) => {
    setSelectedHour(hour);
    setSelectedMinute(0);
    setAddPostVisible(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    start.setDate(start.getDate() - 7);
    const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    end.setDate(end.getDate() + 7);
    await Promise.all([fetchPosts(start, end, true), fetchChannels()]);
  }, [currentMonth, fetchPosts, fetchChannels]);

  // Refresh when the app returns to the foreground. Track the previous
  // state so we only fire on background/inactive → active, not on every
  // change event.
  const appStateRef = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if ((prev === "background" || prev === "inactive") && next === "active") {
        void handleRefresh();
      }
    });
    return () => sub.remove();
  }, [handleRefresh]);

  // Stable render function — only changes when the inputs that actually
  // affect a page change. Each page computes its own date from
  // initialDate + dayOffset (absolute, not relative).
  const renderDayPage = useCallback(
    (dayOffset: number) => {
      const date = new Date(initialDate);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(0, 0, 0, 0);
      // O(1) day lookup against the pre-grouped, pre-sorted map (built
      // once per posts change in `postsMap` above) instead of the
      // previous O(n log n) filter+sort that re-ran for every mounted
      // page on every parent render.
      const dateKey = format(date, "yyyy-MM-dd");
      const pagePosts = postsMap.get(dateKey) ?? EMPTY_POSTS;

      // Check if this page is the currently selected date
      const isCurrentPage =
        date.getDate() === selectedDate.getDate() &&
        date.getMonth() === selectedDate.getMonth() &&
        date.getFullYear() === selectedDate.getFullYear();

      return (
        <View className="flex-1 bg-background-primary">
          <DatePill selectedDate={date} />
          <View className="flex-1 px-4">
            <TimelineView
              timeSlots={timeSlots}
              posts={pagePosts}
              selectedDate={date}
              referenceNow={referenceNow}
              selectedPostId={isCurrentPage ? selectedPost?.id ?? null : null}
              selectedSlotHour={isCurrentPage && addPostVisible ? selectedHour : null}
              onSlotPress={handleSlotPress}
              onPostPress={handlePostPress}
              onRefresh={handleRefresh}
            />
          </View>
        </View>
      );
    },
    [
      postsMap,
      initialDate,
      timeSlots,
      referenceNow,
      handleSlotPress,
      handlePostPress,
      selectedDate,
      selectedPost,
      addPostVisible,
      selectedHour,
      handleRefresh,
    ],
  );


  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    const result = await storeDeletePost(deleteTarget);
    if (result.ok) {
      showToast("Post deleted", "success");
    } else {
      showToast(result.error ?? "Delete failed", "error");
    }
    setDeleteTarget(null);
    setPostDetailVisible(false);
  }, [deleteTarget, storeDeletePost]);

  const handleDateTimeSave = useCallback(
    async (newDate: Date) => {
      const fromPostDetail = !!editingPostId;
      if (editingPostId) {
        const result = await storeReschedulePost(
          editingPostId,
          newDate.toISOString(),
        );
        if (result.ok) {
          showToast("Date & time updated", "success");
        } else {
          showToast(result.error ?? "Reschedule failed", "error");
        }
      } else {
        // Opened from Add Post sheet — update date/hour so the sheet below reflects it
        setSelectedDate(new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate()));
        setSelectedHour(newDate.getHours());
        setSelectedMinute(newDate.getMinutes());
      }
      setDateTimeVisible(false);
      setEditingPostId(null);
      // Reopen the parent sheet after date picker closes
      setTimeout(() => {
        if (fromPostDetail) {
          setPostDetailVisible(true);
        } else {
          setAddPostVisible(true);
        }
      }, 350);
    },
    [editingPostId, storeReschedulePost],
  );

  const handleCreatePost = useCallback(
    (dateTime: Date) => {
      setAddPostVisible(false);
      // Delay navigation so the AddPostSheet modal fully dismisses before
      // the create-post screen (containedTransparentModal) presents on iOS.
      setTimeout(() => {
        router.push({
          pathname: "/create-post",
          params: { dateTime: dateTime.toISOString() },
        } as any);
      }, 350);
    },
    [router],
  );

  const handlePostDrop = useCallback(
    async (postId: string, newHour: number) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const newDate = set(new Date(post.scheduledAt), {
        hours: newHour,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });

      // Mirror calendar.tsx:666-721 — when dropping a post that's already
      // PUBLISHED, or scheduled in the past (overdue QUEUE), ask whether
      // to actually re-publish at the new time or just move the date in
      // place. Default action ('schedule') re-runs startWorkflow.
      let action: "schedule" | "update" = "schedule";
      const wasPublishedOrPastQueue =
        post.status === "published" ||
        (post.status === "scheduled" &&
          new Date().getTime() > new Date(post.scheduledAt).getTime());
      if (wasPublishedOrPastQueue) {
        if (republishResolverRef.current) return; // modal already open
        setRepublishVisible(true);
        const choice = await new Promise<RepublishChoice | null>((resolve) => {
          republishResolverRef.current = resolve;
        });
        republishResolverRef.current = null;
        setRepublishVisible(false);
        if (!choice) return; // user cancelled — leave the post where it was
        action = choice === "update" ? "update" : "schedule";
      }

      const result = await storeReschedulePost(
        postId,
        newDate.toISOString(),
        action,
      );
      if (result.ok) {
        showToast("Post rescheduled", "success");
      } else {
        showToast(result.error ?? "Reschedule failed", "error");
      }
    },
    [posts, storeReschedulePost],
  );

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top"]}>
      <TimelineDragProvider onDrop={handlePostDrop}>
      <StatusBar style="light" />

      <View className="h-[60px] flex-row items-center justify-between px-4">
        <MonthSelector
          currentMonth={currentMonth}
          isOpen={monthSelectorOpen}
          onToggle={() => setMonthSelectorOpen((o) => !o)}
        />
        <NotificationBellButton />
      </View>

      <DaySwiper
        ref={daySwiperRef}
        onChangeDate={changeDate}
        enabled={!monthSelectorOpen}
        renderPage={renderDayPage}
      />

      <MainTabNavbar activeTab="calendar" />

      {/* Bottom Sheets */}
      <PostDetailSheet
        isVisible={postDetailVisible}
        post={selectedPost}
        onClose={() => {
          setPostDetailVisible(false);
          setSelectedPost(null);
        }}
        onEdit={(post) => {
          setPostDetailVisible(false);
          setTimeout(() => {
            router.push({
              pathname: "/create-post",
              params: {
                postId: post.id,
                mode: "edit",
                dateTime: post.scheduledAt,
                content: post.content,
                imageUri: post.imageUri ?? "",
                network: post.network,
                channelId: post.channelId,
              },
            } as any);
          }, 350);
        }}
        onDuplicate={(post) => {
          setPostDetailVisible(false);
          setTimeout(() => {
            router.push({
              pathname: "/create-post",
              params: {
                mode: "duplicate",
                dateTime: post.scheduledAt,
                content: post.content,
                imageUri: post.imageUri ?? "",
                network: post.network,
                channelId: post.channelId,
              },
            } as any);
          }, 350);
        }}
        onDelete={(post) => {
          setPostDetailVisible(false);
          setTimeout(() => setDeleteTarget(post), 350);
        }}
        onChangeDateTime={(post) => {
          setPostDetailVisible(false);
          setEditingPostId(post.id);
          setDateTimeTarget(new Date(post.scheduledAt));
          setTimeout(() => setDateTimeVisible(true), 500);
        }}
      />

      <AddPostSheet
        isVisible={addPostVisible}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        selectedMinute={selectedMinute}
        onClose={() => setAddPostVisible(false)}
        onCreatePost={handleCreatePost}
        onChangeDateTime={() => {
          setAddPostVisible(false);
          setDateTimeTarget(
            set(selectedDate, {
              hours: selectedHour,
              minutes: selectedMinute,
              seconds: 0,
            }),
          );
          setTimeout(() => setDateTimeVisible(true), 500);
        }}
      />

      {dateTimeTarget && (
        <DateTimePickerSheet
          isVisible={dateTimeVisible}
          initialDate={dateTimeTarget}
          onSave={handleDateTimeSave}
          onClose={() => {
            const fromPostDetail = !!editingPostId;
            setDateTimeVisible(false);
            setEditingPostId(null);
            setTimeout(() => {
              setDateTimeTarget(null);
              // Reopen the parent sheet
              if (fromPostDetail) {
                setPostDetailVisible(true);
              } else {
                setAddPostVisible(true);
              }
            }, 350);
          }}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Are you sure?"
        message="Are you sure you want to delete this post?"
        confirmLabel="Yes, Delete It"
        cancelLabel="No, Cancel"
        confirmDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteTarget(null);
          setTimeout(() => setPostDetailVisible(true), 350);
        }}
      />

      <RepublishChoiceDialog
        visible={republishVisible}
        republishLabel="Reschedule the post"
        onChoose={(choice) => {
          republishResolverRef.current?.(choice);
          republishResolverRef.current = null;
          setRepublishVisible(false);
        }}
        onCancel={() => {
          republishResolverRef.current?.(null);
          republishResolverRef.current = null;
          setRepublishVisible(false);
        }}
      />

      <DragOverlay />
      </TimelineDragProvider>

      {/* Calendar overlay — rendered last so it's on top on iOS without z-index */}
      <AnimatedDropdown
        visible={monthSelectorOpen}
        onClose={() => setMonthSelectorOpen(false)}
        anchor="top-left"
        style={{ position: "absolute", left: 16, right: 16, top: Platform.OS === "ios" ? 115 : 70, elevation: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 }}
      >
        <View className="rounded-[8px] bg-main-sections-2 p-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-jakarta text-h4 font-semibold text-text-primary">
              {formatMonthName(currentMonth)}, {currentMonth.getFullYear()}
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={handlePrevMonth}
                className="h-8 w-8 items-center justify-center"
              >
                <Ionicons name="chevron-back" size={18} className="text-icon-primary" />
              </Pressable>
              <Pressable
                onPress={handleNextMonth}
                className="h-8 w-8 items-center justify-center"
              >
                <Ionicons name="chevron-forward" size={18} className="text-icon-primary" />
              </Pressable>
            </View>
          </View>

          <CalendarGrid days={calendarDays} onDayPress={handleDayPress} />
        </View>
      </AnimatedDropdown>
    </SafeAreaView>
  );
}
