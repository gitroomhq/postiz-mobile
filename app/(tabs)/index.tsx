import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage, type ImageProps } from "expo-image";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { FC } from "react";
import { useCallback, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AddPostSheet } from "@/components/calendar/add-post-sheet";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { DatePill } from "@/components/calendar/date-pill";
import { DateTimePickerSheet } from "@/components/calendar/datetime-picker-sheet";
import { DragOverlay } from "@/components/calendar/drag-overlay";
import { MonthSelector } from "@/components/calendar/month-selector";
import { PostDetailSheet } from "@/components/calendar/post-detail-sheet";
import { TimelineView } from "@/components/calendar/timeline-view";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MainTabNavbar } from "@/components/ui/main-tab-navbar";
import { showToast } from "@/components/ui/toast";
import { TimelineDragProvider } from "@/contexts/timeline-drag-context";

const Image = ExpoImage as unknown as FC<ImageProps>;

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
  const [deleteTarget, setDeleteTarget] = useState<ScheduledPost | null>(null);
  const [dateTimeTarget, setDateTimeTarget] = useState<Date | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);

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
      if (editingPostId) {
        storeReschedulePost(editingPostId, newDate.toISOString());
        showToast("Date & time updated", "success");
      }
      setDateTimeVisible(false);
      setEditingPostId(null);
    },
    [editingPostId, storeReschedulePost],
  );

  const handleCreatePost = useCallback(
    (dateTime: Date) => {
      setAddPostVisible(false);
      router.push({
        pathname: "/(tabs)/create-post",
        params: { dateTime: dateTime.toISOString() },
      } as any);
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
        <Pressable onPress={() => router.push("/(tabs)/notifications")}>
          <Image
            source={require("@/assets/icons/notification-bell.svg")}
            style={{ width: 24, height: 24 }}
            contentFit="contain"
          />
        </Pressable>
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
          router.push({
            pathname: "/(tabs)/create-post",
            params: {
              postId: post.id,
              mode: "edit",
              dateTime: post.scheduledAt,
              content: post.content,
              imageUri: post.imageUri ?? "",
              network: post.network,
            },
          } as any);
        }}
        onDuplicate={(post) => {
          setPostDetailVisible(false);
          router.push({
            pathname: "/(tabs)/create-post",
            params: {
              postId: post.id,
              mode: "duplicate",
              dateTime: post.scheduledAt,
              content: post.content,
              imageUri: post.imageUri ?? "",
              network: post.network,
            },
          } as any);
        }}
        onDelete={(post) => setDeleteTarget(post)}
        onChangeDateTime={(post) => {
          setEditingPostId(post.id);
          setDateTimeTarget(new Date(post.scheduledAt));
          setPostDetailVisible(false);
          setTimeout(() => setDateTimeVisible(true), 350);
        }}
      />

      <AddPostSheet
        isVisible={addPostVisible}
        selectedDate={selectedDate}
        selectedHour={selectedHour}
        onClose={() => setAddPostVisible(false)}
        onCreatePost={handleCreatePost}
        onChangeDateTime={() => {
          setDateTimeTarget(
            set(selectedDate, {
              hours: selectedHour,
              minutes: 0,
              seconds: 0,
            }),
          );
          setAddPostVisible(false);
          setTimeout(() => setDateTimeVisible(true), 350);
        }}
      />

      {dateTimeTarget && (
        <DateTimePickerSheet
          isVisible={dateTimeVisible}
          initialDate={dateTimeTarget}
          onSave={handleDateTimeSave}
          onClose={() => {
            setDateTimeVisible(false);
            setEditingPostId(null);
            setTimeout(() => setDateTimeTarget(null), 350);
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
        onCancel={() => setDeleteTarget(null)}
      />

      <DragOverlay />
      </TimelineDragProvider>
    </SafeAreaView>
  );
}
