import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { DateTimePickerSheet } from "@/components/calendar/datetime-picker-sheet";
import { SvgIcon } from "@/components/ui/svg-icon";
import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { showToast } from "@/components/ui/toast";
import { NETWORK_CONFIG } from "@/constants/networks";
import { useChannelsStore, getChannelLimit } from "@/store/channels-store";
import { usePostsStore } from "@/store/posts-store";
import type { ChannelNetwork } from "@/types";

type ComposerPost = {
  id: string;
  content: string;
  imageUri: string | null;
};

const MEDIA_TOOLS = [
  { id: "insert", icon: require("@/assets/icons/create-post/toolbar-image-plus.svg") },
  { id: "design", icon: require("@/assets/icons/create-post/toolbar-image.svg") },
  { id: "ai-image", icon: require("@/assets/icons/create-post/toolbar-sparkles.svg") },
  { id: "ai-video", icon: require("@/assets/icons/create-post/toolbar-film.svg") },
];

const FORMAT_TOOLS = [
  { id: "heading", icon: require("@/assets/icons/create-post/toolbar-heading.svg") },
  { id: "underline", icon: require("@/assets/icons/create-post/toolbar-underline.svg") },
];

const POST_ACTIONS = [
  { id: "calendar", label: "Add to Calendar", tone: "primary" as const },
  { id: "now", label: "Post Now", tone: "secondary" as const },
  { id: "draft", label: "Save as Draft", tone: "tertiary" as const },
];

function makePost(id: string, content: string, imageUri: string | null): ComposerPost {
  return { id, content, imageUri };
}

function ChannelAvatar({
  avatar,
  network,
  size = 32,
}: {
  avatar: string;
  network: ChannelNetwork;
  size?: number;
}) {
  const networkConfig = NETWORK_CONFIG[network];
  const badgeSize = Math.max(12, Math.round(size * 0.42));

  return (
    <View
      className="relative items-center justify-center overflow-hidden rounded-full"
      style={{ width: size, height: size }}
    >
      <Image
        source={{ uri: avatar }}
        style={{ width: size, height: size }}
        contentFit="cover"
      />
      <View
        className="absolute bottom-0 right-0 items-center justify-center rounded-[4px]"
        style={{
          width: badgeSize,
          height: badgeSize,
          backgroundColor: networkConfig.bg,
        }}
      >
        <Ionicons
          name={networkConfig.icon}
          size={Math.max(8, Math.round(badgeSize * 0.58))}
          color="#FFFFFF"
        />
      </View>
    </View>
  );
}

function IconButton({
  children,
  active = false,
  onPress,
}: {
  children: ReactNode;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className={`h-10 w-10 items-center justify-center rounded-[8px] ${
        active ? "bg-buttons-tertiary-bg" : "bg-main-sections-2"
      }`}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

function ChannelTab({
  active = false,
  children,
  onPress,
}: {
  active?: boolean;
  children: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      className={`h-11 w-11 items-center justify-center rounded-[8px] ${
        active
          ? "border-[1.5px] border-main-accent-pink bg-main-sections-2"
          : "bg-buttons-tertiary-bg"
      }`}
      onPress={onPress}
    >
      {children}
    </Pressable>
  );
}

export default function CreatePostScreen() {
  const router = useRouter();
  const { bottom } = useSafeAreaInsets();
  const channels = useChannelsStore((state) => state.channels);
  const addPostToStore = usePostsStore((state) => state.addPost);
  const updatePostInStore = usePostsStore((state) => state.updatePost);
  const params = useLocalSearchParams<{
    dateTime?: string;
    postId?: string;
    mode?: string;
    content?: string;
    imageUri?: string;
    network?: string;
  }>();

  const mode = params.mode === "duplicate"
    ? "duplicate"
    : params.mode === "edit" || !!params.postId
      ? "edit"
      : "create";
  const initialDate = params.dateTime ? parseISO(params.dateTime) : new Date();
  const initialContent =
    typeof params.content === "string" ? params.content : "";
  const initialImageUri =
    typeof params.imageUri === "string" && params.imageUri.length > 0
      ? params.imageUri
      : null;

  const [posts, setPosts] = useState<ComposerPost[]>([
    makePost("post-1", initialContent, initialImageUri),
  ]);
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [activeMediaTool, setActiveMediaTool] = useState("insert");
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(
    mode === "create" && initialContent.length === 0 && !initialImageUri
      ? []
      : channels.slice(0, 3).map((channel) => channel.id),
  );

  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [channelSheetVisible, setChannelSheetVisible] = useState(false);
  const [postActionMenuVisible, setPostActionMenuVisible] = useState(false);
  const [expandedLimitPostId, setExpandedLimitPostId] = useState<string | null>(null);

  const dateLabel = format(scheduledDate, "MMM d, h:mm a")
    .replace(/ AM$/, " am")
    .replace(/ PM$/, " pm");

  const selectedChannels = useMemo(
    () => channels.filter((channel) => selectedChannelIds.includes(channel.id)),
    [channels, selectedChannelIds],
  );

  const canSubmit = selectedChannels.length > 0 && posts.some((post) => post.content.trim().length > 0);
  const isEmptyState =
    mode === "create" &&
    posts.length === 1 &&
    !posts[0]?.content.trim() &&
    !posts[0]?.imageUri &&
    selectedChannels.length === 0;

  const updatePost = (postId: string, updater: (post: ComposerPost) => ComposerPost) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? updater(post) : post)),
    );
  };

  const addAnotherPost = () => {
    setPosts((current) => [...current, makePost(`post-${current.length + 1}`, "", null)]);
  };

  const deletePost = (postId: string) => {
    setPosts((current) => (current.length === 1 ? current : current.filter((post) => post.id !== postId)));
    if (expandedLimitPostId === postId) {
      setExpandedLimitPostId(null);
    }
  };

  const toggleChannel = (channelId: string) => {
    setSelectedChannelIds((current) =>
      current.includes(channelId)
        ? current.filter((id) => id !== channelId)
        : [...current, channelId],
    );
  };

  const handleSave = (action: string = "calendar") => {
    setPostActionMenuVisible(false);

    for (const post of posts) {
      if (!post.content.trim()) continue;

      for (const channel of selectedChannels) {
        if (mode === "edit" && params.postId) {
          updatePostInStore(params.postId, {
            content: post.content,
            imageUri: post.imageUri ?? undefined,
            scheduledAt: scheduledDate.toISOString(),
            network: channel.network,
          });
        } else {
          addPostToStore({
            id: `${Date.now()}-${channel.id}-${post.id}`,
            title: post.content.slice(0, 40),
            content: post.content,
            category: "Social",
            imageUri: post.imageUri ?? undefined,
            scheduledAt: scheduledDate.toISOString(),
            network: channel.network,
            channelId: channel.id,
            authorName: channel.name,
            authorAvatar: channel.avatar,
            status: action === "draft" ? "draft" : action === "now" ? "published" : "scheduled",
          });
        }
      }
    }

    showToast(
      action === "draft"
        ? "Post saved as draft"
        : action === "now"
          ? "Post published"
          : mode === "duplicate"
            ? "Post duplicated"
            : mode === "edit"
              ? "Post updated"
              : "Post created",
      "success",
    );
    router.back();
  };

  const handleDateTimeSave = useCallback((newDate: Date) => {
    setScheduledDate(newDate);
    setDateTimePickerVisible(false);
    showToast("Date & time updated", "success");
  }, []);

  useEffect(() => {
    if (!canSubmit && postActionMenuVisible) {
      setPostActionMenuVisible(false);
    }
  }, [canSubmit, postActionMenuVisible]);

  const getPostLimits = (content: string) => {
    return selectedChannels.map((channel) => {
      const limit = getChannelLimit(channel);
      return {
        id: channel.id,
        label: `${channel.name} (${channel.network[0].toUpperCase()}${channel.network.slice(1)})`,
        network: channel.network,
        current: content.length,
        limit,
        exceeded: content.length > limit,
      };
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top"]}>
      <StatusBar style="light" />

      <View className="flex-row items-center gap-2 px-4 pb-2 pt-4">
        <Pressable
          className="h-6 w-6 items-center justify-center"
          onPress={() => router.back()}
          hitSlop={10}
        >
          <SvgIcon source={require("@/assets/icons/create-post/back.svg")} size={24} />
        </Pressable>

        <Pressable
          className="min-h-[40px] flex-1 flex-row items-center justify-center gap-2 rounded-[6px] border border-buttons-stroke-stroke px-4 pb-[10px] pt-2"
          onPress={() => setDateTimePickerVisible(true)}
        >
          <SvgIcon source={require("@/assets/icons/create-post/calendar.svg")} size={16} />
          <Text className="font-jakarta text-button-2 font-semibold text-text-primary">
            {dateLabel}
          </Text>
        </Pressable>

        <View>
          <Pressable
            className={`min-h-[40px] min-w-[92px] flex-row items-center justify-center gap-2 rounded-[6px] pb-[10px] pl-6 pr-3 pt-2 ${
              canSubmit ? "bg-buttons-primary-bg" : "bg-buttons-disabled-bg"
            }`}
            disabled={!canSubmit}
            onPress={() => {
              if (canSubmit) {
                setPostActionMenuVisible((current) => !current);
              }
            }}
          >
            <Text
              className={`font-jakarta text-button-2 font-semibold ${
                canSubmit ? "text-text-primary" : "text-buttons-disabled-text"
              }`}
            >
              Post
            </Text>
            <SvgIcon
              source={require("@/assets/icons/create-post/chevron-down.svg")}
              size={16}
              tintColor={canSubmit ? "#FFFFFF" : "#9E9E9E"}
              opacity={postActionMenuVisible ? 0.8 : 1}
              rotation={postActionMenuVisible ? "180deg" : "0deg"}
            />
          </Pressable>

          {postActionMenuVisible ? (
            <View className="absolute right-0 top-12 z-20 w-[208px] rounded-[12px] bg-main-menu-bg p-3 shadow-[0px_8px_30px_rgba(0,0,0,0.5)]">
              {POST_ACTIONS.map((action) => (
                <Pressable
                  key={action.id}
                  className={`mb-3 h-11 items-center justify-center rounded-[8px] ${
                    action.tone === "primary"
                      ? "bg-buttons-primary-bg"
                      : action.tone === "secondary"
                        ? "bg-buttons-secondary-bg"
                        : "bg-buttons-tertiary-bg"
                  } ${action.id === "draft" ? "mb-0" : ""}`}
                  onPress={() => handleSave(action.id)}
                >
                  <Text className="font-jakarta text-button font-semibold text-white">
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 92 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <ChannelTab active>
                <SvgIcon source={require("@/assets/icons/create-post/globe-active.svg")} size={24} />
              </ChannelTab>

              {selectedChannels.slice(0, 3).map((channel) => (
                <ChannelTab key={channel.id}>
                  <ChannelAvatar avatar={channel.avatar} network={channel.network} size={26} />
                </ChannelTab>
              ))}

              <ChannelTab onPress={() => setChannelSheetVisible(true)}>
                <SvgIcon source={require("@/assets/icons/create-post/channel-plus.svg")} size={20} />
              </ChannelTab>
            </View>

            <Pressable className="h-11 w-11 items-center justify-center rounded-[8px]">
              <SvgIcon source={require("@/assets/icons/create-post/settings.svg")} size={20} opacity={0.92} />
            </Pressable>
          </View>

          {posts.map((post, index) => {
            const limits = getPostLimits(post.content);
            const hasExceededLimits = limits.some((limit) => limit.exceeded);
            const showLimitDetails = expandedLimitPostId === post.id;
            const hasContent = post.content.trim().length > 0 || !!post.imageUri;

            return (
              <View key={post.id} className={index > 0 ? "mt-5" : ""}>
                {index > 0 ? (
                  <View className="mb-4 border-t border-input-stroke-default pt-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-jakarta text-h4 text-text-tertiary">
                        Add another post
                      </Text>
                      <Pressable onPress={() => deletePost(post.id)}>
                        <Ionicons name="trash-outline" size={18} color="#FF3F3F" />
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                <TextInput
                  className={`mb-4 font-jakarta text-[15px] leading-[24px] text-text-primary ${
                    isEmptyState ? "min-h-[320px]" : "min-h-[120px]"
                  }`}
                  placeholder="What would you like to share?"
                  placeholderTextColor="#656464"
                  multiline
                  autoFocus={index === 0}
                  keyboardAppearance="dark"
                  textAlignVertical="top"
                  value={post.content}
                  onChangeText={(value) =>
                    updatePost(post.id, (current) => ({ ...current, content: value }))
                  }
                />

                {post.imageUri ? (
                  <View className="mb-4">
                    <Image
                      source={{ uri: post.imageUri }}
                      style={{ width: 60, height: 60, borderRadius: 8 }}
                      contentFit="cover"
                    />
                    <Pressable
                      className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-text-critical"
                      onPress={() =>
                        updatePost(post.id, (current) => ({ ...current, imageUri: null }))
                      }
                    >
                      <Ionicons name="close" size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                ) : null}

                {hasContent && selectedChannels.length > 0 ? (
                  <View className="mb-3 items-end">
                    <Pressable
                      className="flex-row items-center gap-2"
                      onPress={() =>
                        setExpandedLimitPostId((current) => (current === post.id ? null : post.id))
                      }
                    >
                      <Ionicons
                        name={hasExceededLimits ? "warning-outline" : "checkmark-circle-outline"}
                        size={16}
                        color={hasExceededLimits ? "#FF3F3F" : "#00C566"}
                      />
                      <Text
                        className={`font-jakarta text-body-3 ${
                          hasExceededLimits ? "text-text-critical" : "text-text-tertiary"
                        }`}
                      >
                        Character Limit
                      </Text>
                      <Ionicons
                        name={showLimitDetails ? "chevron-up" : "chevron-down"}
                        size={12}
                        color={hasExceededLimits ? "#FF3F3F" : "#656464"}
                      />
                    </Pressable>
                  </View>
                ) : null}

                {showLimitDetails && limits.length > 0 ? (
                  <View className="mb-3 rounded-[10px] border border-text-critical bg-transparent px-4 py-3">
                    {limits.map((limit) => (
                      <View
                        key={`${post.id}-${limit.id}`}
                        className="mb-2 flex-row items-center justify-between last:mb-0"
                      >
                        <View className="flex-row items-center gap-2">
                          <ChannelAvatar
                            avatar={channels.find((channel) => channel.id === limit.id)?.avatar ?? channels[0]?.avatar ?? ""}
                            network={limit.network}
                            size={16}
                          />
                          <Text
                            className={`font-jakarta text-body-3 ${
                              limit.exceeded ? "text-text-critical" : "text-text-primary"
                            }`}
                          >
                            {limit.label}:
                          </Text>
                        </View>
                        <Text
                          className={`font-jakarta text-body-3 ${
                            limit.exceeded ? "text-text-critical" : "text-text-primary"
                          }`}
                        >
                          {limit.current}/{limit.limit}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {index === posts.length - 1 && !showLimitDetails ? null : null}
              </View>
            );
          })}

          {posts.length < 2 ? (
            <View className="mt-1">
              <Pressable
                className="flex-row items-center justify-between border-t border-input-stroke-default pt-4"
                onPress={addAnotherPost}
              >
                <Text className="font-jakarta text-h4 text-text-tertiary">
                  Add another post
                </Text>
                <Ionicons name="add" size={18} color="#656464" />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <View className="bg-background-primary" style={{ paddingBottom: Math.max(bottom, 8) }}>
          <View className="flex-row items-center gap-3 px-4 py-3">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ alignItems: "center", gap: 4, paddingRight: 56 }}
              style={{ flex: 1 }}
            >
              {MEDIA_TOOLS.map((tool) => (
                <IconButton
                  key={tool.id}
                  active={activeMediaTool === tool.id}
                  onPress={() => setActiveMediaTool(tool.id)}
                >
                  <SvgIcon source={tool.icon} size={20} />
                </IconButton>
              ))}

              <View className="mx-2 h-4 w-px bg-separator-primary" />

              {FORMAT_TOOLS.map((tool) => (
                <IconButton key={tool.id}>
                  <SvgIcon source={tool.icon} size={20} />
                </IconButton>
              ))}
            </ScrollView>

            <LinearGradient
              colors={["rgba(26,25,25,0)", "#1A1919"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              pointerEvents="none"
              style={{
                position: "absolute",
                right: 68,
                top: 12,
                bottom: 12,
                width: 56,
              }}
            />

            <Pressable
              className="h-10 w-10 items-center justify-center rounded-[8px] bg-buttons-secondary-bg"
              onPress={() => setPosts((current) => {
                const [first, ...rest] = current;
                if (!first) {
                  return current;
                }
                if (first.imageUri) {
                  return current;
                }
                return [{ ...first, imageUri: "https://picsum.photos/seed/newpost/400/300" }, ...rest];
              })}
            >
              <SvgIcon source={require("@/assets/icons/create-post/plus.svg")} size={20} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <DateTimePickerSheet
        isVisible={dateTimePickerVisible}
        initialDate={scheduledDate}
        onSave={handleDateTimeSave}
        onClose={() => setDateTimePickerVisible(false)}
      />

      <BottomSheetWrapper
        isVisible={channelSheetVisible}
        onClose={() => setChannelSheetVisible(false)}
        showHandle={false}
        backdropColor="#0E0E0E"
        backdropOpacity={0.2}
        fullHeight
        topOffset={12}
        useBottomInsetPadding={false}
        containerStyle={{
          backgroundColor: "#1A1919",
          paddingHorizontal: 0,
          paddingTop: 0,
        }}
      >
        <View className="flex-1 bg-background-primary">
          <View className="flex-row items-center justify-between px-4 py-5">
            <Text className="font-jakarta text-h2 font-semibold text-text-primary">
              Select Channels
            </Text>
            <Pressable
              className="h-8 w-8 items-center justify-center"
              onPress={() => setChannelSheetVisible(false)}
            >
              <Ionicons name="close" size={20} className="text-icon-primary" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {channels.map((channel) => {
              const selected = selectedChannelIds.includes(channel.id);

              return (
                <Pressable
                  key={channel.id}
                  className="flex-row items-center justify-between py-2"
                  onPress={() => toggleChannel(channel.id)}
                >
                  <View className="flex-row items-center gap-3">
                    <ChannelAvatar
                      avatar={channel.avatar}
                      network={channel.network}
                      size={40}
                    />
                    <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
                      {channel.name}
                    </Text>
                  </View>

                  <View
                    className={`h-5 w-5 items-center justify-center rounded-[6px] border ${
                      selected
                        ? "border-main-accent-purple bg-main-accent-purple"
                        : "border-[#3F3E3E] bg-main-sections"
                    }`}
                  >
                    {selected ? (
                      <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View
            className="gap-3 bg-background-primary px-5 pt-3"
            style={{ paddingBottom: Math.max(bottom, 34) }}
          >
            <Pressable
              className="h-11 flex-row items-center justify-center gap-2 rounded-[8px] bg-buttons-tertiary-bg"
              onPress={() => showToast("Add channel flow not implemented yet", "success")}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text className="font-jakarta text-button font-semibold text-text-primary">
                Add Channel
              </Text>
            </Pressable>

            <Pressable
              className={`h-11 items-center justify-center rounded-[8px] ${
                selectedChannelIds.length > 0
                  ? "bg-buttons-primary-bg"
                  : "bg-buttons-disabled-bg"
              }`}
              disabled={selectedChannelIds.length === 0}
              onPress={() => setChannelSheetVisible(false)}
            >
              <Text
                className={`font-jakarta text-button font-semibold ${
                  selectedChannelIds.length > 0
                    ? "text-white"
                    : "text-buttons-disabled-text"
                }`}
              >
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      </BottomSheetWrapper>
    </SafeAreaView>
  );
}
