import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import EmojiPicker, { type EmojiType } from "rn-emoji-keyboard";

import { DateTimePickerSheet } from "@/components/calendar/datetime-picker-sheet";
import { ChannelSelectionSheet } from "@/components/create-post/channel-selection-sheet";
import { ComposerToolbar } from "@/components/create-post/composer-toolbar";
import {
  INITIAL_TAGS,
  MEDIA_LIBRARY_ASSETS,
  POST_ACTIONS,
  REPEAT_OPTIONS,
  TAG_COLOR_OPTIONS,
  formatNetworkLabel,
  makePost,
  type ComposerPost,
  type ComposerTag,
  type MediaSheetState,
  type SettingsSheet,
} from "@/components/create-post/constants";
import { MediaLibrarySheet } from "@/components/create-post/media-library-sheet";
import { MediaSettingsModal } from "@/components/create-post/media-settings-modal";
import { PostEditor, type EditorBridge } from "@/components/create-post/post-editor";
import { SettingsSheetContent } from "@/components/create-post/settings-sheet";
import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { ChannelAvatar } from "@/components/ui/channel-avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Image } from "@/components/ui/image";
import { SvgIcon } from "@/components/ui/svg-icon";
import { showToast } from "@/components/ui/toast";
import { useChannelsStore, getChannelLimit } from "@/store/channels-store";
import { usePostsStore } from "@/store/posts-store";

function BackChevronButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      className="h-6 w-6 items-center justify-center"
      onPress={onPress}
      hitSlop={10}
    >
      <Image
        source={require("@/assets/icons/create-post/back.svg")}
        className="w-[7.5px] h-[13.5px]"
        contentFit="contain"
      />
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

  // --- State ---
  const [posts, setPosts] = useState<ComposerPost[]>([
    makePost("post-1", initialContent, initialImageUri ? [initialImageUri] : []),
  ]);
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);
  const [mediaSheetState, setMediaSheetState] = useState<MediaSheetState>("library");
  const [mediaAssets, setMediaAssets] = useState<{ id: string; uri: string }[]>(
    MEDIA_LIBRARY_ASSETS.map((asset) => ({ ...asset })),
  );
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(
    mode === "create" && initialContent.length === 0 && !initialImageUri
      ? []
      : channels.slice(0, 3).map((channel) => channel.id),
  );

  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [channelSheetVisible, setChannelSheetVisible] = useState(false);
  const [postActionMenuVisible, setPostActionMenuVisible] = useState(false);
  const [settingsSheet, setSettingsSheet] = useState<SettingsSheet>(null);
  const [expandedLimitPostId, setExpandedLimitPostId] = useState<string | null>(null);
  const [focusedChannelId, setFocusedChannelId] = useState<string | null>(null);
  const [networkCarouselEnabled, setNetworkCarouselEnabled] = useState(false);
  const [networkRepostersEnabled, setNetworkRepostersEnabled] = useState(true);
  const [networkDelay, setNetworkDelay] = useState("Immediately");
  const [repeatPostValue, setRepeatPostValue] =
    useState<(typeof REPEAT_OPTIONS)[number]>("Every Day");
  const [tags, setTags] = useState<ComposerTag[]>(INITIAL_TAGS);
  const [newTagName, setNewTagName] = useState("New");
  const [newTagColor, setNewTagColor] = useState<(typeof TAG_COLOR_OPTIONS)[number]>("#E89623");
  const [activePostId, setActivePostId] = useState(posts[0]?.id ?? "post-1");
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [mediaSettingsTarget, setMediaSettingsTarget] = useState<{
    postId: string;
    uri: string;
    altText?: string;
  } | null>(null);
  const editorRefs = useRef<Record<string, EditorBridge>>({});

  // --- Derived values ---
  const dateLabel = format(scheduledDate, "MMM d, h:mm a")
    .replace(/ AM$/, " am")
    .replace(/ PM$/, " pm");

  const selectedChannels = useMemo(
    () => channels.filter((channel) => selectedChannelIds.includes(channel.id)),
    [channels, selectedChannelIds],
  );

  // Each ChannelTab is w-11 (44px) + gap-1 (4px). Cap at ~3.8 channels visible.
  const MAX_CHANNEL_SCROLL_WIDTH = 180;
  const estimatedChannelsWidth = selectedChannels.length > 0
    ? selectedChannels.length * 44 + (selectedChannels.length - 1) * 4
    : 0;
  const channelsOverflow = estimatedChannelsWidth > MAX_CHANNEL_SCROLL_WIDTH;

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "").trim();
  const canSubmit = selectedChannels.length > 0 && posts.some((post) => stripHtml(post.content).length > 0);
  const focusedChannel =
    selectedChannels.find((channel) => channel.id === focusedChannelId) ??
    selectedChannels[0] ??
    null;
  const networkSettingsTitle = focusedChannel
    ? `${formatNetworkLabel(focusedChannel.network)} Settings`
    : "Channel Settings";
  // --- Handlers ---
  const updatePost = (postId: string, updater: (post: ComposerPost) => ComposerPost) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? updater(post) : post)),
    );
  };

  const addAnotherPost = () => {
    setPosts((current) => [...current, makePost(`post-${current.length + 1}`, "")]);
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
      if (!stripHtml(post.content)) continue;

      for (const channel of selectedChannels) {
        if (mode === "edit" && params.postId) {
          updatePostInStore(params.postId, {
            content: post.content,
            imageUri: post.imageUris[0] ?? undefined,
            scheduledAt: scheduledDate.toISOString(),
            network: channel.network,
          });
        } else {
          addPostToStore({
            id: `${Date.now()}-${channel.id}-${post.id}`,
            title: post.content.slice(0, 40),
            content: post.content,
            category: "Social",
            imageUri: post.imageUris[0] ?? undefined,
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

  const getPostLimits = (content: string) => {
    const textLength = stripHtml(content).length;
    return selectedChannels.map((channel) => {
      const limit = getChannelLimit(channel);
      return {
        id: channel.id,
        label: `${channel.name} (${channel.network[0].toUpperCase()}${channel.network.slice(1)})`,
        network: channel.network,
        current: textLength,
        limit,
        exceeded: textLength > limit,
      };
    });
  };

  const openMediaLibrary = () => {
    setMediaLibraryVisible(true);
    setSelectedMediaIds([]);
    setMediaSheetState(mediaAssets.length > 0 ? "library" : "empty");
  };

  const handleMediaToolPress = (_toolId: string) => {
    setPostActionMenuVisible(false);
    setSettingsSheet(null);
    openMediaLibrary();
  };

  const handleFormatPress = (toolId: string) => {
    if (toolId === "emoji") {
      setEmojiPickerVisible(true);
      return;
    }

    const editor = editorRefs.current[activePostId];
    if (!editor) return;

    if (toolId === "bold") {
      editor.toggleBold();
    } else if (toolId === "underline") {
      editor.toggleUnderline();
    }
  };

  const handleInsertEmoji = (emojiObject: EmojiType) => {
    const editor = editorRefs.current[activePostId];
    if (!editor) return;
    const emoji = emojiObject.emoji;
    editor.injectJS(
      `var pm = document.querySelector('.ProseMirror'); if (pm) { pm.focus(); document.execCommand('insertText', false, '${emoji}'); }`
    );
  };

  const handleToggleMediaSelection = (mediaId: string) => {
    setSelectedMediaIds((current) => {
      if (current.includes(mediaId)) {
        return current.filter((id) => id !== mediaId);
      }

      if (current.length >= 5) {
        showToast("You can select up to 5 items", "info");
        return current;
      }

      return [...current, mediaId];
    });
  };

  const handleDeleteSelectedMedia = () => {
    setMediaAssets((current) => current.filter((asset) => !selectedMediaIds.includes(asset.id)));
    const remaining = mediaAssets.length - selectedMediaIds.length;
    setSelectedMediaIds([]);
    setMediaSheetState(remaining > 0 ? "library" : "empty");
    showToast("Selected media deleted", "success");
  };

  const handleAddSelectedMedia = () => {
    const selectedUris = mediaAssets
      .filter((asset) => selectedMediaIds.includes(asset.id))
      .map((asset) => asset.uri);

    if (selectedUris.length === 0) return;

    setPosts((current) =>
      current.map((post, index) =>
        index === 0 ? { ...post, imageUris: selectedUris } : post,
      ),
    );
    setMediaLibraryVisible(false);
    setSelectedMediaIds([]);
    showToast(
      selectedUris.length === 1 ? "1 media item added" : `${selectedUris.length} media items added`,
      "success",
    );
  };

  const openSettingsSheet = () => {
    setPostActionMenuVisible(false);
    setSettingsSheet("main");
  };

  const handleDeleteComposerPost = () => {
    setSettingsSheet(null);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteComposerPost = () => {
    setPosts((current) => {
      if (current.length > 1) return current.slice(0, -1);
      const [first] = current;
      if (!first) return current;
      return [{ ...first, content: "", imageUris: [] }];
    });
    setExpandedLimitPostId(null);
    setDeleteDialogVisible(false);
    showToast("Post deleted", "success");
  };

  const toggleTag = (tagId: string) => {
    setTags((current) =>
      current.map((tag) =>
        tag.id === tagId ? { ...tag, selected: !tag.selected } : tag,
      ),
    );
  };

  const openNewTagSheet = () => {
    setNewTagName("New");
    setNewTagColor("#E89623");
    setSettingsSheet("new-tag");
  };

  const handleSaveNewTag = () => {
    const normalizedName = newTagName.trim() || "New";
    const nextTag: ComposerTag = {
      id: `${normalizedName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      label: normalizedName,
      color: newTagColor,
      selected: true,
    };

    setTags((current) => [
      ...current.map((tag) => ({ ...tag, selected: false })),
      nextTag,
    ]);
    setSettingsSheet("tags");
    showToast("Tag created", "success");
  };

  // --- Effects ---
  useEffect(() => {
    if (!canSubmit && postActionMenuVisible) {
      setPostActionMenuVisible(false);
    }
  }, [canSubmit, postActionMenuVisible]);

  const pendingPickedAssets = useRef<{ id: string; uri: string }[]>([]);

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    pendingPickedAssets.current = result.assets.map((asset, index) => ({
      id: `media-${Date.now()}-${index}`,
      uri: asset.uri,
    }));
    setMediaSheetState("loading");
  };

  useEffect(() => {
    if (mediaSheetState !== "loading") return;

    const timeout = setTimeout(() => {
      setMediaAssets((current) => [...current, ...pendingPickedAssets.current]);
      pendingPickedAssets.current = [];
      setMediaSheetState("library");
      showToast("Media uploaded", "success");
    }, 1400);

    return () => clearTimeout(timeout);
  }, [mediaSheetState]);

  useEffect(() => {
    if (
      !focusedChannelId ||
      selectedChannels.some((channel) => channel.id === focusedChannelId)
    ) {
      return;
    }
    setFocusedChannelId(null);
  }, [focusedChannelId, selectedChannels]);

  // --- Render ---
  return (
    <SafeAreaView className="flex-1 bg-background-primary" edges={["top"]}>
      <StatusBar style="light" />

      {/* Header */}
      <View className="h-[60px] flex-row items-center gap-2 px-4">
        <BackChevronButton onPress={() => router.back()} />

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
              if (canSubmit) setPostActionMenuVisible((current) => !current);
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
        {/* Content */}
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-3 pb-[92px]"
          keyboardShouldPersistTaps="handled"
        >
          {/* Channel tabs */}
          <View className="mb-4 flex-row items-center gap-1">
            <ChannelTab active={!focusedChannelId} onPress={() => setFocusedChannelId(null)}>
              <SvgIcon source={require("@/assets/icons/create-post/globe-active.svg")} size={24} />
            </ChannelTab>

            <View
              className="relative shrink"
              style={{ maxWidth: MAX_CHANNEL_SCROLL_WIDTH }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="items-center gap-1"
              >
                {selectedChannels.map((channel) => (
                  <ChannelTab
                    key={channel.id}
                    active={channel.id === focusedChannelId}
                    onPress={() => setFocusedChannelId(channel.id)}
                  >
                    <ChannelAvatar avatar={channel.avatar} network={channel.network} size={26} />
                  </ChannelTab>
                ))}
              </ScrollView>

              {channelsOverflow ? (
                <LinearGradient
                  colors={["rgba(26,25,25,0)", "#1A1919"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  pointerEvents="none"
                  className="absolute right-0 top-0 h-11 w-12"
                />
              ) : null}
            </View>

            <ChannelTab onPress={() => setChannelSheetVisible(true)}>
              <SvgIcon source={require("@/assets/icons/create-post/channel-plus.svg")} size={20} />
            </ChannelTab>

            <View className="flex-1" />

            <Pressable
              className="h-11 w-11 items-center justify-center rounded-[8px]"
              hitSlop={12}
              onPress={openSettingsSheet}
            >
              <SvgIcon source={require("@/assets/icons/create-post/settings.svg")} size={20} opacity={0.92} />
            </Pressable>
          </View>

          {/* Post editors */}
          <View>
          {posts.map((post, index) => {
            const limits = getPostLimits(post.content);
            const hasExceededLimits = limits.some((limit) => limit.exceeded);
            const showLimitDetails = expandedLimitPostId === post.id;
            const plainText = post.content.replace(/<[^>]*>/g, "").trim();
            const hasContent = plainText.length > 0 || post.imageUris.length > 0;

            return (
              <View key={post.id} className={index > 0 ? "mt-5" : ""}>
                {index > 0 ? (
                  <View className="mb-4 border-t border-input-stroke-default pt-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-jakarta text-h4 text-text-tertiary">
                        Add another post
                      </Text>
                      <Pressable onPress={() => deletePost(post.id)}>
                        <Ionicons name="trash-outline" size={18} className="text-text-critical" />
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                <PostEditor
                  initialContent={post.content}
                  onChange={(html) =>
                    updatePost(post.id, (current) => ({ ...current, content: html }))
                  }
                  onFocus={() => setActivePostId(post.id)}
                  autoFocus={index === 0}
                  minHeight={120}
                  editorRef={(editor) => {
                    editorRefs.current[post.id] = editor;
                  }}
                />

                {post.imageUris.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="mt-4 mb-4 gap-3 px-4"
                  >
                    {post.imageUris.map((uri, mediaIndex) => (
                      <View key={`${post.id}-${uri}`} className="relative">
                        <Pressable
                          onPress={() => setMediaSettingsTarget({ postId: post.id, uri })}
                        >
                          <Image
                            source={{ uri }}
                            className="h-[60px] w-[60px] rounded-lg"
                            contentFit="cover"
                          />
                        </Pressable>
                        <Pressable
                          className="absolute -right-2 -top-2 h-7 w-7 items-center justify-center rounded-full bg-text-critical"
                          onPress={() =>
                            updatePost(post.id, (current) => ({
                              ...current,
                              imageUris: current.imageUris.filter((_, currentIndex) => currentIndex !== mediaIndex),
                            }))
                          }
                        >
                          <Ionicons name="close" size={16} className="text-white" />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
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
                        className={hasExceededLimits ? "text-text-critical" : "text-[#00C566]"}
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
                        className={hasExceededLimits ? "text-text-critical" : "text-icon-secondary"}
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
              </View>
            );
          })}
          </View>

        </ScrollView>

        {/* Bottom toolbar */}
        <ComposerToolbar
          onMediaToolPress={handleMediaToolPress}
          onFormatPress={handleFormatPress}
          onAddPost={addAnotherPost}
          bottomInset={bottom}
        />
      </KeyboardAvoidingView>

      {/* Bottom sheets */}
      <DateTimePickerSheet
        isVisible={dateTimePickerVisible}
        initialDate={scheduledDate}
        onSave={handleDateTimeSave}
        onClose={() => setDateTimePickerVisible(false)}
      />

      <BottomSheetWrapper
        isVisible={settingsSheet !== null}
        onClose={() => setSettingsSheet(settingsSheet === "main" ? null : "main")}
        showHandle={settingsSheet !== "new-tag"}
        backdropColor="#414042"
        backdropOpacity={0.3}
        fullHeight={settingsSheet === "new-tag"}
        topOffset={settingsSheet === "new-tag" ? 12 : 0}
        useBottomInsetPadding={false}
        avoidKeyboard={settingsSheet === "new-tag"}
        containerStyle={{
          backgroundColor: "#1A1919",
          paddingHorizontal: 0,
          paddingTop: settingsSheet === "new-tag" ? 0 : 10,
        }}
      >
        <SettingsSheetContent
          activeSheet={settingsSheet}
          onNavigate={setSettingsSheet}
          networkTitle={networkSettingsTitle}
          carousel={networkCarouselEnabled}
          onToggleCarousel={() => setNetworkCarouselEnabled((current) => !current)}
          reposters={networkRepostersEnabled}
          onToggleReposters={() => setNetworkRepostersEnabled((current) => !current)}
          delay={networkDelay}
          onDelayChange={setNetworkDelay}
          focusedChannel={focusedChannel}
          repeatValue={repeatPostValue}
          onRepeatChange={(v) => setRepeatPostValue(v as (typeof REPEAT_OPTIONS)[number])}
          tags={tags}
          onToggleTag={toggleTag}
          newTagName={newTagName}
          onNewTagNameChange={setNewTagName}
          newTagColor={newTagColor}
          onNewTagColorChange={(c) => setNewTagColor(c as (typeof TAG_COLOR_OPTIONS)[number])}
          onSaveNewTag={handleSaveNewTag}
          onOpenNewTag={openNewTagSheet}
          onDeletePost={handleDeleteComposerPost}
          bottomInset={bottom}
        />
      </BottomSheetWrapper>

      <MediaLibrarySheet
        isVisible={mediaLibraryVisible}
        state={mediaSheetState}
        assets={mediaAssets}
        selectedIds={selectedMediaIds}
        onClose={() => {
          setMediaLibraryVisible(false);
          setSelectedMediaIds([]);
        }}
        onUpload={handlePickImages}
        onToggleSelect={handleToggleMediaSelection}
        onDeleteSelected={handleDeleteSelectedMedia}
        onAddSelected={handleAddSelectedMedia}
      />

      <MediaSettingsModal
        isVisible={mediaSettingsTarget !== null}
        onClose={() => setMediaSettingsTarget(null)}
        initialAltText={mediaSettingsTarget?.altText ?? ""}
        onSave={(value) => {
          setMediaSettingsTarget((current) =>
            current ? { ...current, altText: value } : current,
          );
        }}
      />

      <ConfirmDialog
        visible={deleteDialogVisible}
        title="Are you sure?"
        message="Are you sure you want to delete this post?"
        confirmLabel="Yes, Delete It"
        cancelLabel="No, Cancel"
        confirmDestructive
        onConfirm={confirmDeleteComposerPost}
        onCancel={() => setDeleteDialogVisible(false)}
      />

      <ChannelSelectionSheet
        isVisible={channelSheetVisible}
        channels={channels}
        selectedChannelIds={selectedChannelIds}
        onToggleChannel={toggleChannel}
        onClose={() => setChannelSheetVisible(false)}
        bottomInset={bottom}
      />

      <EmojiPicker
        open={emojiPickerVisible}
        onClose={() => setEmojiPickerVisible(false)}
        onEmojiSelected={handleInsertEmoji}
        enableSearchBar
        enableRecentlyUsed
        categoryPosition="top"
        theme={{
          backdrop: "#00000080",
          knob: "#444444",
          container: "#1A1919",
          header: "#ffffff99",
          skinTonesContainer: "#2A2A2A",
          category: {
            icon: "#888888",
            iconActive: "#A855F7",
            container: "#1A1919",
            containerActive: "#2A2A2A",
          },
          search: {
            text: "#ffffffcc",
            placeholder: "#ffffff55",
            icon: "#ffffff55",
            background: "#2A2A2A",
          },
          emoji: {
            selected: "#2A2A2A",
          },
        }}
      />
    </SafeAreaView>
  );
}
