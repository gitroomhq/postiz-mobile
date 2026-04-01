import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddPostSheet } from "@/components/calendar/add-post-sheet";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { DatePill } from "@/components/calendar/date-pill";
import { DateTimePickerSheet } from "@/components/calendar/datetime-picker-sheet";
import { DragOverlay } from "@/components/calendar/drag-overlay";
import { MonthSelector } from "@/components/calendar/month-selector";
import { PostDetailSheet } from "@/components/calendar/post-detail-sheet";
import { TimelineView, type TimelineViewHandle } from "@/components/calendar/timeline-view";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { NotificationBellButton } from "@/components/ui/notification-bell-button";
import { showToast } from "@/components/ui/toast";
import { TimelineDragProvider } from "@/contexts/timeline-drag-context";
import { usePostsStore } from "@/store/posts-store";
import type { ScheduledPost } from "@/types";
import {
  addMonths,
  subMonths,
  formatMonthName,
  generateTimeSlots,
  getCalendarDays,
  getPostsForDate,
  groupPostsByDate,
  set,
} from "@/utils/calendar";


export default function CalendarScreen() {
  const router = useRouter();

  // --- Global state ---
  const posts = usePostsStore((state) => state.posts);
  const storeAddPost = usePostsStore((state) => state.addPost);
  const storeDeletePost = usePostsStore((state) => state.deletePost);
  const storeReschedulePost = usePostsStore((state) => state.reschedulePost);
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

    // Scroll timeline to the post's hour after a short delay to let the list update
    const hour = date.getHours();
    setTimeout(() => {
      timelineRef.current?.scrollToHour(hour);
    }, 400);
  }, [navigateToDate, setNavigateToDate]);

  // --- Sheet visibility ---
  const [postDetailVisible, setPostDetailVisible] = useState(false);
  const [addPostVisible, setAddPostVisible] = useState(false);
  const [dateTimeVisible, setDateTimeVisible] = useState(false);

  // --- Derived ---
  const postsMap = useMemo(() => groupPostsByDate(posts), [posts]);
  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth, selectedDate, postsMap),
    [currentMonth, selectedDate, postsMap],
  );
  const dayPosts = useMemo(
    () => getPostsForDate(posts, selectedDate),
    [posts, selectedDate],
  );
  const timeSlots = useMemo(() => generateTimeSlots(0, 23), []);

  const handleDayPress = useCallback((date: Date) => {
    setSelectedDate(date);
    setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setMonthSelectorOpen(false);
  }, []);

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

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      storeDeletePost(deleteTarget.id);
      showToast("Post deleted", "success");
      setDeleteTarget(null);
      setPostDetailVisible(false);
    }
  }, [deleteTarget, storeDeletePost]);

  const handleDateTimeSave = useCallback(
    (newDate: Date) => {
      const fromPostDetail = !!editingPostId;
      if (editingPostId) {
        storeReschedulePost(editingPostId, newDate.toISOString());
        showToast("Date & time updated", "success");
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
    (postId: string, newHour: number) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const newDate = set(new Date(post.scheduledAt), {
        hours: newHour,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      });
      storeReschedulePost(postId, newDate.toISOString());
      showToast("Post rescheduled", "success");
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

      {/* Calendar dropdown — in normal flow so it pushes content down */}
      {monthSelectorOpen && (
        <View className="mx-4 mb-2 rounded-[8px] bg-main-sections-2 p-4">
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
      )}

      <DatePill selectedDate={selectedDate} hasPosts={dayPosts.length > 0} />

      <View className="flex-1 px-4">
        <TimelineView
          ref={timelineRef}
          timeSlots={timeSlots}
          posts={dayPosts}
          selectedDate={selectedDate}
          referenceNow={new Date()}
          selectedPostId={selectedPost?.id ?? null}
          selectedSlotHour={addPostVisible ? selectedHour : null}
          onSlotPress={handleSlotPress}
          onPostPress={handlePostPress}
        />
      </View>

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
          const newId = `dup-${post.id}-${Date.now()}`;
          storeAddPost({
            ...post,
            id: newId,
            title: post.title,
          });
          setPostDetailVisible(false);
          setTimeout(() => {
            router.push({
              pathname: "/create-post",
              params: {
                postId: newId,
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

      <DragOverlay />
      </TimelineDragProvider>
    </SafeAreaView>
  );
}
