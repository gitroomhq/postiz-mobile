import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { format, parseISO } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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
import {
  PostEditor,
  type EditorBridge,
} from "@/components/create-post/post-editor";
import { SettingsSheetContent } from "@/components/create-post/settings-sheet";
import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { ChannelAvatar } from "@/components/ui/channel-avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Image } from "@/components/ui/image";
import { SvgIcon } from "@/components/ui/svg-icon";
import { showToast } from "@/components/ui/toast";
import { NETWORK_CHARACTER_LIMITS, NETWORK_CONFIG } from "@/constants/networks";
import { useChannelsStore } from "@/store/channels-store";
import { usePostsStore } from "@/store/posts-store";
import type { Channel } from "@/types";

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
      className={`h-11 w-11 items-center justify-center overflow-visible rounded-[8px] ${
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

function LockedTemplateCard({ onPress }: { onPress: () => void }) {
  return (
    <View className="w-full items-center justify-center gap-4 rounded-[8px] bg-white/[0.02] py-6">
      <SvgIcon
        source={require("@/assets/icons/create-post/lock.svg")}
        size={24}
        tintColor="#FFFFFF"
        opacity={0.7}
      />
      <Text className="w-[309px] text-center font-jakarta text-[14px] leading-[14px] text-text-primary">
        Click this button to stop using the current template and customize the
        post
      </Text>
      <Pressable
        className="h-11 items-center justify-center rounded-[8px] bg-buttons-secondary-bg px-8 pb-[14px] pt-3"
        onPress={onPress}
      >
        <Text className="font-jakarta text-[15px] font-semibold leading-[15px] text-buttons-secondary-text">
          Edit Content
        </Text>
      </Pressable>
    </View>
  );
}

type NetworkLimitStatus = {
  channelId: string;
  channelName: string;
  networkLabel: string;
  network: Channel["network"];
  currentLength: number;
  limit: number;
  isOverLimit: boolean;
};

function buildNetworkLimitStatuses(
  channels: Channel[],
  defaultTextLength: number,
  channelOverrides: Record<string, ComposerPost[]>,
  postId: string,
): NetworkLimitStatus[] {
  return channels.map((channel) => {
    const limit = NETWORK_CHARACTER_LIMITS[channel.network];

    let currentLength = defaultTextLength;
    const overridePosts = channelOverrides[channel.id];
    if (overridePosts) {
      const overridePost = overridePosts.find((p) => p.id === postId);
      if (overridePost) {
        currentLength = stripEditorHtml(overridePost.content).length;
      }
    }

    return {
      channelId: channel.id,
      channelName: channel.name,
      networkLabel: formatNetworkLabel(channel.network),
      network: channel.network,
      currentLength,
      limit,
      isOverLimit: currentLength > limit,
    };
  });
}

function stripEditorHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function PostConnector() {
  return <View className="ml-[10px] h-4 w-px bg-input-stroke-default" />;
}

function CharacterLimitStatus({
  statuses,
}: {
  statuses: NetworkLimitStatus[];
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasErrors = statuses.some((status) => status.isOverLimit);
  const hasChannels = statuses.length > 0;

  useEffect(() => {
    if (!hasChannels) {
      setMenuOpen(false);
    }
  }, [hasChannels]);

  if (!hasChannels) return null;

  return (
    <View className="relative mb-3 items-end overflow-visible">
      <Pressable
        className="flex-row items-center gap-[6px]"
        hitSlop={10}
        onPress={() => setMenuOpen((current) => !current)}
      >
        {hasErrors ? (
          <SvgIcon
            source={require("@/assets/icons/create-post/limit-error-figma.svg")}
            size={16}
          />
        ) : (
          <SvgIcon
            source={require("@/assets/icons/create-post/limit-ok-figma.svg")}
            size={16}
          />
        )}
        <Text
          className={`font-jakarta text-[12px] font-medium ${hasErrors ? "text-text-critical" : "text-icon-secondary"}`}
        >
          Character Limit
        </Text>
        {hasErrors ? (
          <SvgIcon
            source={require("@/assets/icons/create-post/limit-error-chevron-figma.svg")}
            size={16}
            rotation={menuOpen ? "180deg" : "0deg"}
          />
        ) : (
          <SvgIcon
            source={require("@/assets/icons/create-post/limit-chevron-figma.svg")}
            size={16}
            rotation={menuOpen ? "180deg" : "0deg"}
          />
        )}
      </Pressable>

      <AnimatedDropdown
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchor="top-right"
        style={{ position: "absolute", right: 0, top: 28, zIndex: 30 }}
      >
        <View
          className={`w-[343px] rounded-[8px] border bg-main-menu-bg p-3 shadow-2xl ${
            hasErrors ? "border-text-critical" : "border-input-stroke-default"
          }`}
          style={{ elevation: 6 }}
        >
          {statuses.map((status, index) => {
            const networkConfig = NETWORK_CONFIG[status.network];
            const rowColorClass = status.isOverLimit
              ? "text-text-critical"
              : "text-text-primary";
            const isInstagram =
              status.network === "instagram" ||
              status.network === "instagram-business";
            const isLinkedIn =
              status.network === "linkedin" ||
              status.network === "linkedin-page";
            const socialIconSource = isInstagram
              ? require("@/assets/icons/create-post/social-instagram-figma.svg")
              : isLinkedIn
                ? require("@/assets/icons/create-post/social-linkedin-figma.svg")
                : status.network === "facebook"
                  ? require("@/assets/icons/create-post/social-facebook-figma.svg")
                  : null;

            return (
              <View
                key={status.channelId}
                className={`flex-row items-center justify-between ${index > 0 ? "mt-2" : ""}`}
              >
                <View className="mr-3 flex-1 flex-row items-center gap-2">
                  {socialIconSource ? (
                    isInstagram ? (
                      <LinearGradient
                        colors={["#FA8F21", "#E14667", "#D82D7E"]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                          height: 16,
                          width: 16,
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 4,
                        }}
                      >
                        <SvgIcon source={socialIconSource} size={10.6} />
                      </LinearGradient>
                    ) : (
                      <View
                        className={`h-4 w-4 items-center justify-center ${
                          isLinkedIn ? "rounded-[3px]" : "rounded-[4px]"
                        }`}
                        style={{ backgroundColor: networkConfig.bg }}
                      >
                        <SvgIcon
                          source={socialIconSource}
                          size={isLinkedIn ? 9.33 : 6.85}
                        />
                      </View>
                    )
                  ) : (
                    <View
                      className="h-4 w-4 items-center justify-center rounded-[4px]"
                      style={{ backgroundColor: networkConfig.bg }}
                    >
                      <Ionicons
                        name={networkConfig.icon}
                        size={10}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                  <Text
                    className={`flex-1 font-jakarta text-[12px] font-medium ${rowColorClass}`}
                    numberOfLines={1}
                  >
                    <Text className="font-jakarta text-[12px] font-bold">
                      {status.channelName} (
                    </Text>
                    {status.networkLabel}):
                  </Text>
                </View>
                <Text
                  className={`font-jakarta text-[12px] font-medium ${rowColorClass}`}
                >
                  {status.currentLength}/{status.limit}
                </Text>
              </View>
            );
          })}
        </View>
      </AnimatedDropdown>
    </View>
  );
}

function SimpleCharacterLimit({
  currentLength,
  limit,
}: {
  currentLength: number;
  limit: number;
}) {
  const isOverLimit = currentLength > limit;

  return (
    <View className="mb-3 items-end">
      <Text
        className={`font-jakarta text-[12px] font-medium ${
          isOverLimit ? "text-text-critical" : "text-icon-secondary"
        }`}
      >
        {currentLength}/{limit}
      </Text>
    </View>
  );
}

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const channels = useChannelsStore((state) => state.channels);
  const addPostToStore = usePostsStore((state) => state.addPost);
  const updatePostInStore = usePostsStore((state) => state.updatePost);
  const allStorePosts = usePostsStore((state) => state.posts);
  const params = useLocalSearchParams<{
    dateTime?: string;
    postId?: string;
    mode?: string;
    content?: string;
    imageUri?: string;
    network?: string;
    channelId?: string;
  }>();

  const mode =
    params.mode === "duplicate"
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

  const editingPost = params.postId
    ? allStorePosts.find((p) => p.id === params.postId)
    : undefined;
  const initialPosts = (): ComposerPost[] => {
    if (editingPost?.composerPosts && editingPost.composerPosts.length > 0) {
      return editingPost.composerPosts.map((cp) =>
        makePost(cp.id, cp.content, [...cp.imageUris]),
      );
    }
    return [
      makePost(
        "post-1",
        initialContent,
        initialImageUri ? [initialImageUri] : [],
      ),
    ];
  };

  const [posts, setPosts] = useState<ComposerPost[]>(initialPosts);
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);
  const [mediaSheetState, setMediaSheetState] =
    useState<MediaSheetState>("library");
  const mediaOpenCount = useRef(0);
  const [mediaAssets, setMediaAssets] = useState<{ id: string; uri: string }[]>(
    MEDIA_LIBRARY_ASSETS.map((asset) => ({ ...asset })),
  );
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(() => {
    if (params.channelId) {
      return [params.channelId];
    }
    if (mode === "create" && initialContent.length === 0 && !initialImageUri) {
      return [];
    }
    return channels.slice(0, 3).map((channel) => channel.id);
  });

  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [channelSheetVisible, setChannelSheetVisible] = useState(false);
  const [postActionMenuVisible, setPostActionMenuVisible] = useState(false);
  const [settingsSheet, setSettingsSheet] = useState<SettingsSheet>(null);
  const [focusedChannelId, setFocusedChannelId] = useState<string | null>(
    mode === "edit" && params.channelId ? params.channelId : null,
  );
  const [networkCarouselEnabled, setNetworkCarouselEnabled] = useState(false);
  const [networkRepostersEnabled, setNetworkRepostersEnabled] = useState(true);
  const [networkDelay, setNetworkDelay] = useState("Immediately");
  const [engagedChannelIds, setEngagedChannelIds] = useState<string[]>(() =>
    channels.filter((c) => selectedChannelIds.includes(c.id)).map((c) => c.id),
  );
  const [repeatPostValue, setRepeatPostValue] =
    useState<(typeof REPEAT_OPTIONS)[number]>("Every Day");
  const [tags, setTags] = useState<ComposerTag[]>(INITIAL_TAGS);
  const [channelTagOverrides, setChannelTagOverrides] = useState<
    Record<string, string>
  >({});
  const [newTagName, setNewTagName] = useState("New");
  const [newTagColor, setNewTagColor] =
    useState<(typeof TAG_COLOR_OPTIONS)[number]>("#E89623");
  const [activePostId, setActivePostId] = useState(posts[0]?.id ?? "post-1");
  const [pendingAutoFocusPostId, setPendingAutoFocusPostId] = useState<
    string | null
  >(null);
  const [channelOverrides, setChannelOverrides] = useState<
    Record<string, ComposerPost[]>
  >({});
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);

  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const [mediaSettingsTarget, setMediaSettingsTarget] = useState<{
    postId: string;
    uri: string;
    altText?: string;
  } | null>(null);
  const editorRefs = useRef<Record<string, EditorBridge>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const channelScrollRef = useRef<ScrollView>(null);
  const postViewRefs = useRef<Record<string, View | null>>({});
  const postIdCounter = useRef(posts.length);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [editorsLoading, setEditorsLoading] = useState(mode === "edit");

  const scrollToFocusedPost = useCallback((refId: string) => {
    setTimeout(() => {
      const postView = postViewRefs.current[refId];
      const sv = scrollViewRef.current;
      if (!postView || !sv) return;
      // Use measureInWindow on both the post and the scroll view to get their
      // absolute Y positions, then compute the relative offset to scroll to.
      // This avoids getInnerViewNode / measureLayout which crash on iOS new arch.
      postView.measureInWindow((_px, postY) => {
        (sv as any).measureInWindow?.((_sx: number, svY: number) => {
          sv.scrollTo({ y: Math.max(0, postY - svY - 20), animated: true });
        });
      });
    }, 300);
  }, []);

  const dateLabel = format(scheduledDate, "MMM d, h:mm a")
    .replace(/ AM$/, " am")
    .replace(/ PM$/, " pm");

  const selectedChannels = useMemo(
    () => channels.filter((channel) => selectedChannelIds.includes(channel.id)),
    [channels, selectedChannelIds],
  );

  const MAX_CHANNEL_SCROLL_WIDTH = 180;
  const estimatedChannelsWidth =
    selectedChannels.length > 0
      ? selectedChannels.length * 44 + (selectedChannels.length - 1) * 4
      : 0;
  const channelsOverflow = estimatedChannelsWidth > MAX_CHANNEL_SCROLL_WIDTH;

  const isScheduledInPast = scheduledDate < new Date();
  const canSubmit =
    selectedChannels.length > 0 &&
    posts.some((post) => stripEditorHtml(post.content).length > 0) &&
    !isScheduledInPast;
  const focusedChannel =
    selectedChannels.find((channel) => channel.id === focusedChannelId) ??
    selectedChannels[0] ??
    null;
  const networkSettingsTitle =
    focusedChannelId && focusedChannel
      ? `${formatNetworkLabel(focusedChannel.network)} Settings`
      : "Channel Settings";

  const effectiveTags = useMemo(() => {
    if (focusedChannelId && channelTagOverrides[focusedChannelId]) {
      const overrideId = channelTagOverrides[focusedChannelId];
      return tags.map((t) => ({ ...t, selected: t.id === overrideId }));
    }
    return tags;
  }, [tags, focusedChannelId, channelTagOverrides]);

  const updatePost = (
    postId: string,
    updater: (post: ComposerPost) => ComposerPost,
  ) => {
    setPosts((current) =>
      current.map((post) => (post.id === postId ? updater(post) : post)),
    );
  };

  const addAnotherPost = () => {
    postIdCounter.current += 1;
    const nextPostId = `post-${postIdCounter.current}`;

    if (focusedChannelId && channelOverrides[focusedChannelId]) {
      const chRefId = `channel-${focusedChannelId}-${nextPostId}`;
      setChannelOverrides((current) => ({
        ...current,
        [focusedChannelId]: [
          ...current[focusedChannelId],
          makePost(nextPostId, ""),
        ],
      }));
      setActivePostId(chRefId);
      setPendingAutoFocusPostId(chRefId);
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        200,
      );
      return;
    }

    setPosts((current) => [...current, makePost(nextPostId, "")]);
    setActivePostId(nextPostId);
    setPendingAutoFocusPostId(nextPostId);
    setTimeout(
      () => scrollViewRef.current?.scrollToEnd({ animated: true }),
      200,
    );
  };

  const executeDeletePost = (postId: string) => {
    setPosts((current) => {
      if (current.length === 1) return current;

      const index = current.findIndex((post) => post.id === postId);
      const nextPosts = current.filter((post) => post.id !== postId);

      if (activePostId === postId) {
        const fallbackPost = nextPosts[Math.max(0, index - 1)] ?? nextPosts[0];
        if (fallbackPost) {
          setActivePostId(fallbackPost.id);
        }
      }

      return nextPosts;
    });
  };

  const deletePost = (postId: string) => {
    setPendingDelete({
      title: "Delete Post",
      message: "Are you sure you want to delete this post from the thread?",
      confirmLabel: "Yes, Delete",
      onConfirm: () => executeDeletePost(postId),
    });
  };

  const handleChannelsSave = (channelIds: string[]) => {
    setSelectedChannelIds(channelIds);
  };

  const handleSave = (action: string = "calendar") => {
    setPostActionMenuVisible(false);
    const defaultTag = tags.find((tag) => tag.selected);

    for (const channel of selectedChannels) {
      const channelPosts = channelOverrides[channel.id] ?? posts;

      const validPosts = channelPosts.filter(
        (p) => stripEditorHtml(p.content).length > 0,
      );
      if (validPosts.length === 0) continue;

      const overrideTagId = channelTagOverrides[channel.id];
      const effectiveTag = overrideTagId
        ? tags.find((t) => t.id === overrideTagId)
        : defaultTag;

      const displayContent = validPosts[0].content;
      const firstImage = validPosts.find((p) => p.imageUris.length > 0)
        ?.imageUris[0];
      const composerPosts = validPosts.map((p) => ({
        id: p.id,
        content: p.content,
        imageUris: p.imageUris,
      }));

      if (mode === "edit" && params.postId) {
        updatePostInStore(params.postId, {
          content: displayContent,
          imageUri: firstImage,
          composerPosts,
          scheduledAt: scheduledDate.toISOString(),
          network: channel.network,
          status:
            action === "draft"
              ? "draft"
              : action === "now"
                ? "published"
                : "scheduled",
          tagLabel: effectiveTag?.label,
          tagColor: effectiveTag?.color,
        });
      } else {
        addPostToStore({
          id: `${Date.now()}-${channel.id}`,
          title: displayContent
            .replace(/<[^>]*>/g, "")
            .trim()
            .slice(0, 40),
          content: displayContent,
          category: "Social",
          imageUri: firstImage,
          composerPosts,
          scheduledAt: scheduledDate.toISOString(),
          network: channel.network,
          channelId: channel.id,
          authorName: channel.name,
          authorAvatar: channel.avatar,
          status:
            action === "draft"
              ? "draft"
              : action === "now"
                ? "published"
                : "scheduled",
          tagLabel: effectiveTag?.label,
          tagColor: effectiveTag?.color,
        });
      }
    }

    // Tell the calendar to navigate to this post's date & time
    usePostsStore.getState().setNavigateToDate(scheduledDate.toISOString());

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
    if (newDate < new Date()) {
      showToast("Selected date is in the past", "info");
    } else {
      showToast("Date & time updated", "success");
    }
  }, []);

  const openMediaLibrary = () => {
    mediaOpenCount.current += 1;
    // Odd opens show assets, even opens show empty screen
    const showEmpty = mediaOpenCount.current % 2 === 0;

    let currentUris: string[] = [];
    if (focusedChannelId && channelOverrides[focusedChannelId]) {
      const prefix = `channel-${focusedChannelId}-`;
      const postId = activePostId.startsWith(prefix)
        ? activePostId.slice(prefix.length)
        : channelOverrides[focusedChannelId][0]?.id;
      const chPost = channelOverrides[focusedChannelId].find(
        (p) => p.id === postId,
      );
      if (chPost) currentUris = chPost.imageUris;
    } else {
      const activePost = posts.find((p) => p.id === activePostId);
      if (activePost) currentUris = activePost.imageUris;
    }

    const preSelected = showEmpty
      ? []
      : mediaAssets
          .filter((asset) => currentUris.includes(asset.uri))
          .map((asset) => asset.id);

    setSelectedMediaIds(preSelected);
    setMediaLibraryVisible(true);
    setMediaSheetState(
      showEmpty ? "empty" : mediaAssets.length > 0 ? "library" : "empty",
    );
  };

  const handleMediaToolPress = (_toolId: string) => {
    blurActiveEditor();
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
    editor.focus();
  };

  const handleInsertEmoji = (emojiObject: EmojiType) => {
    const editor = editorRefs.current[activePostId];
    if (!editor) return;
    editor.insertText(emojiObject.emoji);
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
    setPendingDelete({
      title: "Delete Media",
      message: `Are you sure you want to delete ${selectedMediaIds.length === 1 ? "this media item" : `these ${selectedMediaIds.length} media items`}?`,
      confirmLabel: "Yes, Delete",
      onConfirm: () => {
        setMediaAssets((current) =>
          current.filter((asset) => !selectedMediaIds.includes(asset.id)),
        );
        const remaining = mediaAssets.length - selectedMediaIds.length;
        setSelectedMediaIds([]);
        setMediaSheetState(remaining > 0 ? "library" : "empty");
        showToast("Selected media deleted", "success");
      },
    });
  };

  const handleAddSelectedMedia = () => {
    const selectedUris = mediaAssets
      .filter((asset) => selectedMediaIds.includes(asset.id))
      .map((asset) => asset.uri);

    if (selectedUris.length === 0) return;

    if (focusedChannelId && channelOverrides[focusedChannelId]) {
      const prefix = `channel-${focusedChannelId}-`;
      const postId = activePostId.startsWith(prefix)
        ? activePostId.slice(prefix.length)
        : channelOverrides[focusedChannelId][0]?.id;
      if (postId) {
        updateChannelOverridePost(focusedChannelId, postId, (prev) => ({
          ...prev,
          imageUris: [...prev.imageUris, ...selectedUris],
        }));
      }
    } else {
      setPosts((current) =>
        current.map((post) =>
          post.id === activePostId
            ? { ...post, imageUris: [...post.imageUris, ...selectedUris] }
            : post,
        ),
      );
    }

    setMediaLibraryVisible(false);
    setSelectedMediaIds([]);
    showToast(
      selectedUris.length === 1
        ? "1 media item added"
        : `${selectedUris.length} media items added`,
      "success",
    );
  };

  const blurActiveEditor = () => {
    const editor = editorRefs.current[activePostId];
    if (editor) editor.blur();
    // Also dismiss via RN API — catches native keyboard from non-WebView inputs
    Keyboard.dismiss();
  };

  const openSettingsSheet = () => {
    blurActiveEditor();
    setPostActionMenuVisible(false);
    setSettingsSheet("main");
  };

  const handleUnlockChannel = (channelId: string) => {
    if (posts.length === 0) return;
    setChannelOverrides((current) => ({
      ...current,
      [channelId]: posts.map((p) =>
        makePost(p.id, p.content, [...p.imageUris]),
      ),
    }));
    setActivePostId(`channel-${channelId}-${posts[0].id}`);
  };

  const handleResetChannelOverride = () => {
    if (!focusedChannelId) return;
    setPendingDelete({
      title: "Revert to Global",
      message:
        "This will discard the custom content for this channel and revert to the global post. Continue?",
      confirmLabel: "Yes, Revert",
      onConfirm: () => {
        const chId = focusedChannelId;
        setChannelOverrides((current) => {
          const next = { ...current };
          delete next[chId];
          return next;
        });
        setFocusedChannelId(null);
        setActivePostId(posts[0]?.id ?? "post-1");
        showToast("Reverted to global mode", "success");
      },
    });
  };

  const updateChannelOverridePost = (
    channelId: string,
    postId: string,
    updater: (prev: ComposerPost) => ComposerPost,
  ) => {
    setChannelOverrides((current) => {
      const channelPosts = current[channelId];
      if (!channelPosts) return current;
      return {
        ...current,
        [channelId]: channelPosts.map((p) =>
          p.id === postId ? updater(p) : p,
        ),
      };
    });
  };

  const handleDeleteComposerPost = () => {
    setSettingsSheet(null);
    setTimeout(() => setDeleteDialogVisible(true), 350);
  };

  const confirmDeleteComposerPost = () => {
    setDeleteDialogVisible(false);
    if (mode === "edit" && params.postId) {
      usePostsStore.getState().deletePost(params.postId);
    }
    showToast("Post deleted", "success");
    setTimeout(() => router.back(), 250);
  };

  const toggleTag = (tagId: string) => {
    if (focusedChannelId) {
      setChannelTagOverrides((current) => ({
        ...current,
        [focusedChannelId]: tagId,
      }));
    } else {
      setTags((current) =>
        current.map((tag) =>
          tag.id === tagId
            ? { ...tag, selected: true }
            : { ...tag, selected: false },
        ),
      );
    }
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
      selected: !focusedChannelId,
    };

    if (focusedChannelId) {
      setTags((current) => [...current, nextTag]);
      setChannelTagOverrides((current) => ({
        ...current,
        [focusedChannelId]: nextTag.id,
      }));
    } else {
      setTags((current) => [
        ...current.map((t) => ({ ...t, selected: false })),
        nextTag,
      ]);
    }
    setSettingsSheet("tags");
    showToast("Tag created", "success");
  };

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
    setActivePostId(posts[0]?.id ?? "post-1");
  }, [focusedChannelId, selectedChannels, posts]);

  // Reset channel scroll position when channels change to avoid stale offset
  useEffect(() => {
    channelScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [selectedChannels.length]);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!editorsLoading) return;
    const timeout = setTimeout(() => setEditorsLoading(false), 2000);
    return () => clearTimeout(timeout);
  }, [editorsLoading]);

  return (
    <BottomSheetModalProvider>
      <View
        className="flex-1 bg-background-primary"
        style={{ paddingTop: insets.top }}
      >
        <SafeAreaView
          className="flex-1 rounded-t-3xl bg-background-primary overflow-hidden"
          edges={[]}
        >
          <StatusBar style="light" />

          <View className="w-[33px] h-1 rounded-sm bg-[#454444] self-center mt-[10px] mb-[8px]" />

          <View className="h-[60px] flex-row items-center gap-2 px-4">
            <BackChevronButton onPress={() => router.back()} />

            <Pressable
              className="min-h-[40px] flex-1 flex-row items-center justify-center gap-2 rounded-[6px] border border-buttons-stroke-stroke px-4 pb-[10px] pt-2"
              onPress={() => {
                blurActiveEditor();
                setDateTimePickerVisible(true);
              }}
            >
              <SvgIcon
                source={require("@/assets/icons/create-post/calendar.svg")}
                size={16}
              />
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
                  if (canSubmit)
                    setPostActionMenuVisible((current) => !current);
                }}
              >
                <Text
                  className={`font-jakarta text-button-2 font-semibold ${
                    canSubmit
                      ? "text-text-primary"
                      : "text-buttons-disabled-text"
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

              <AnimatedDropdown
                visible={postActionMenuVisible}
                onClose={() => setPostActionMenuVisible(false)}
                anchor="top-right"
                style={{ position: "absolute", right: 0, top: 48 }}
              >
                <View
                  className="w-[208px] rounded-[12px] bg-main-menu-bg p-3"
                  style={{ elevation: 2 }}
                >
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
                      <Text className="font-jakarta text-button-2 font-semibold text-white">
                        {action.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </AnimatedDropdown>
            </View>
          </View>

          <KeyboardAvoidingView
            className="flex-1 bg-background-primary"
            behavior="padding"
            keyboardVerticalOffset={insets.top}
          >
            <ScrollView
              ref={scrollViewRef}
              className="flex-1 bg-background-primary"
              contentContainerClassName="px-4 pt-3 pb-[92px]"
              keyboardShouldPersistTaps="always"
            >
              {mode === "edit" ? (
                <View className="mb-4 flex-row items-center gap-1">
                  {selectedChannels
                    .filter((ch) => ch.id === params.channelId)
                    .map((channel) => (
                      <ChannelTab key={channel.id} active>
                        <ChannelAvatar
                          avatar={channel.avatar}
                          network={channel.network}
                          size={26}
                          allowBadgeOverflow
                        />
                      </ChannelTab>
                    ))}

                  <View className="flex-1" />

                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-[8px]"
                    hitSlop={12}
                    onPress={openSettingsSheet}
                  >
                    <SvgIcon
                      source={require("@/assets/icons/create-post/settings.svg")}
                      size={20}
                      opacity={0.92}
                    />
                  </Pressable>
                </View>
              ) : (
                <View className="mb-4 flex-row items-center gap-1">
                  <ChannelTab
                    active={!focusedChannelId}
                    onPress={() => {
                      setFocusedChannelId(null);
                      setActivePostId(posts[0]?.id ?? "post-1");
                    }}
                  >
                    <SvgIcon
                      source={require("@/assets/icons/create-post/globe-active.svg")}
                      size={24}
                      tintColor={focusedChannelId ? "#A3A3A3" : undefined}
                    />
                  </ChannelTab>

                  <View
                    className="shrink"
                    style={{
                      maxWidth: MAX_CHANNEL_SCROLL_WIDTH,
                      overflow: "visible",
                    }}
                  >
                    <ScrollView
                      ref={channelScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{
                        alignItems: "center",
                        gap: 4,
                        paddingTop: 3,
                        paddingRight: 3,
                      }}
                    >
                      {selectedChannels.map((channel) => (
                        <View
                          key={channel.id}
                          className="relative overflow-visible"
                        >
                          <ChannelTab
                            active={channel.id === focusedChannelId}
                            onPress={() => setFocusedChannelId(channel.id)}
                          >
                            <ChannelAvatar
                              avatar={channel.avatar}
                              network={channel.network}
                              size={26}
                            />
                          </ChannelTab>
                          {channelOverrides[channel.id] ? (
                            <View
                              pointerEvents="none"
                              className="absolute h-[10px] w-[10px] rounded-full border-[1.5px] border-buttons-tertiary-bg"
                              style={{
                                backgroundColor: "#FC69FF",
                                top: -3,
                                right: -3,
                              }}
                            />
                          ) : null}
                        </View>
                      ))}
                    </ScrollView>

                    {channelsOverflow ? (
                      <View
                        pointerEvents="none"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: 48,
                        }}
                      >
                        <LinearGradient
                          colors={["rgba(26,25,25,0)", "#1A1919"]}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 1, y: 0.5 }}
                          style={{ flex: 1 }}
                        />
                      </View>
                    ) : null}
                  </View>

                  <ChannelTab
                    onPress={() => {
                      blurActiveEditor();
                      setChannelSheetVisible(true);
                    }}
                  >
                    <SvgIcon
                      source={require("@/assets/icons/create-post/channel-plus.svg")}
                      size={20}
                    />
                  </ChannelTab>

                  <View className="flex-1" />

                  <Pressable
                    className="h-11 w-11 items-center justify-center rounded-[8px]"
                    hitSlop={12}
                    onPress={openSettingsSheet}
                  >
                    <SvgIcon
                      source={require("@/assets/icons/create-post/settings.svg")}
                      size={20}
                      opacity={0.92}
                    />
                  </Pressable>
                </View>
              )}

              {mode !== "edit" &&
              focusedChannelId &&
              !channelOverrides[focusedChannelId] ? (
                <View className="flex-1 justify-center py-16">
                  <LockedTemplateCard
                    onPress={() => handleUnlockChannel(focusedChannelId)}
                  />
                </View>
              ) : null}

              {mode !== "edit" &&
                Object.entries(channelOverrides).map(([channelId, chPosts]) => {
                  const isThisChannelVisible = focusedChannelId === channelId;
                  const channelForLimit = selectedChannels.find(
                    (ch) => ch.id === channelId,
                  );

                  return (
                    <View
                      key={`override-${channelId}`}
                      pointerEvents={isThisChannelVisible ? "auto" : "none"}
                      style={
                        isThisChannelVisible
                          ? undefined
                          : {
                              position: "absolute",
                              transform: [{ translateX: -9999 }],
                              zIndex: -1,
                            }
                      }
                    >
                      {chPosts.map((chPost, chIndex) => {
                        const chPlainText = stripEditorHtml(chPost.content);
                        const chRefId = `channel-${channelId}-${chPost.id}`;

                        const deleteChPost = () => {
                          setPendingDelete({
                            title: "Delete Post",
                            message:
                              "Are you sure you want to delete this post from the thread?",
                            confirmLabel: "Yes, Delete",
                            onConfirm: () => {
                              setChannelOverrides((current) => {
                                const arr = current[channelId];
                                if (!arr || arr.length <= 1) return current;
                                const nextArr = arr.filter(
                                  (p) => p.id !== chPost.id,
                                );

                                if (activePostId === chRefId) {
                                  const idx = arr.findIndex(
                                    (p) => p.id === chPost.id,
                                  );
                                  const fallback =
                                    nextArr[Math.max(0, idx - 1)] ?? nextArr[0];
                                  if (fallback) {
                                    setActivePostId(
                                      `channel-${channelId}-${fallback.id}`,
                                    );
                                  }
                                }

                                return { ...current, [channelId]: nextArr };
                              });
                            },
                          });
                        };

                        return (
                          <View
                            key={chPost.id}
                            className={chIndex > 0 ? "mt-5" : ""}
                            ref={(el) => {
                              postViewRefs.current[chRefId] = el;
                            }}
                          >
                            {chIndex > 0 ? <PostConnector /> : null}

                            <View className="flex-row items-start gap-4 py-2">
                              <View className="flex-1">
                                <PostEditor
                                  key={chRefId}
                                  initialContent={chPost.content}
                                  onChange={(html) =>
                                    updateChannelOverridePost(
                                      channelId,
                                      chPost.id,
                                      (prev) => ({ ...prev, content: html }),
                                    )
                                  }
                                  onFocus={() => {
                                    setActivePostId(chRefId);
                                    scrollToFocusedPost(chRefId);
                                  }}
                                  autoFocus={
                                    chIndex === 0 ||
                                    pendingAutoFocusPostId === chRefId
                                  }
                                  placeholder={
                                    chIndex > 0 ? "Add another post" : undefined
                                  }
                                  editorRef={(editor) => {
                                    editorRefs.current[chRefId] = editor;
                                    if (pendingAutoFocusPostId === chRefId) {
                                      setTimeout(() => {
                                        editor.focus();
                                      }, 100);
                                      setPendingAutoFocusPostId(null);
                                    }
                                  }}
                                />
                              </View>
                              {chIndex > 0 ? (
                                <Pressable
                                  className="h-5 w-5 items-center justify-center mt-[2px]"
                                  hitSlop={8}
                                  onPress={deleteChPost}
                                >
                                  <SvgIcon
                                    source={require("@/assets/icons/create-post/trash-figma.svg")}
                                    size={16}
                                  />
                                </Pressable>
                              ) : null}
                            </View>

                            {chPost.imageUris.length > 0 ? (
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerClassName="mb-4 mt-4 gap-4"
                              >
                                {chPost.imageUris.map((uri, mediaIndex) => (
                                  <View
                                    key={`${chRefId}-${uri}`}
                                    className="relative overflow-visible"
                                  >
                                    <Pressable
                                      onPress={() =>
                                        setMediaSettingsTarget({
                                          postId: chRefId,
                                          uri,
                                        })
                                      }
                                    >
                                      <Image
                                        source={{ uri }}
                                        className="h-[60px] w-[60px] rounded-lg"
                                        contentFit="cover"
                                      />
                                    </Pressable>
                                    <Pressable
                                      className="absolute -right-2 -top-2 h-[24px] w-[24px] items-center justify-center"
                                      onPress={() =>
                                        setPendingDelete({
                                          title: "Remove Media",
                                          message:
                                            "Are you sure you want to remove this media?",
                                          confirmLabel: "Yes, Remove",
                                          onConfirm: () =>
                                            updateChannelOverridePost(
                                              channelId,
                                              chPost.id,
                                              (prev) => ({
                                                ...prev,
                                                imageUris:
                                                  prev.imageUris.filter(
                                                    (_, i) => i !== mediaIndex,
                                                  ),
                                              }),
                                            ),
                                        })
                                      }
                                    >
                                      <SvgIcon
                                        source={require("@/assets/icons/create-post/media-remove.svg")}
                                        size={24}
                                      />
                                    </Pressable>
                                  </View>
                                ))}
                              </ScrollView>
                            ) : null}

                            <Pressable
                              onPress={() => {
                                setActivePostId(chRefId);
                                editorRefs.current[chRefId]?.focus();
                              }}
                            >
                              {channelForLimit ? (
                                <SimpleCharacterLimit
                                  currentLength={chPlainText.length}
                                  limit={
                                    NETWORK_CHARACTER_LIMITS[
                                      channelForLimit.network
                                    ]
                                  }
                                />
                              ) : null}
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}

              <View
                pointerEvents={
                  mode !== "edit" && focusedChannelId ? "none" : "auto"
                }
                style={
                  mode !== "edit" && focusedChannelId
                    ? {
                        position: "absolute",
                        transform: [{ translateX: -9999 }],
                        zIndex: -1,
                      }
                    : undefined
                }
              >
                {posts.map((post, index) => {
                  const plainText = stripEditorHtml(post.content);
                  const plainTextLength = plainText.length;
                  const limitStatuses = buildNetworkLimitStatuses(
                    selectedChannels,
                    plainTextLength,
                    channelOverrides,
                    post.id,
                  );

                  return (
                    <View
                      key={post.id}
                      className={index > 0 ? "mt-5" : ""}
                      ref={(el) => {
                        postViewRefs.current[post.id] = el;
                      }}
                    >
                      {index > 0 ? <PostConnector /> : null}

                      <View className="flex-row items-start gap-4 py-2">
                        <View className="flex-1">
                          <PostEditor
                            key={post.id}
                            initialContent={post.content}
                            onChange={(html) =>
                              updatePost(post.id, (current) => ({
                                ...current,
                                content: html,
                              }))
                            }
                            onFocus={() => {
                              setActivePostId(post.id);
                              scrollToFocusedPost(post.id);
                            }}
                            onReady={
                              index === 0
                                ? () => setEditorsLoading(false)
                                : undefined
                            }
                            autoFocus={
                              index === 0 || pendingAutoFocusPostId === post.id
                            }
                            placeholder={
                              index > 0 ? "Add another post" : undefined
                            }
                            editorRef={(editor) => {
                              editorRefs.current[post.id] = editor;
                              if (pendingAutoFocusPostId === post.id) {
                                setTimeout(() => {
                                  editor.focus();
                                }, 100);
                                setPendingAutoFocusPostId(null);
                              }
                            }}
                          />
                        </View>
                        {index > 0 ? (
                          <Pressable
                            className="h-5 w-5 items-center justify-center mt-[2px]"
                            hitSlop={8}
                            onPress={() => deletePost(post.id)}
                          >
                            <SvgIcon
                              source={require("@/assets/icons/create-post/trash-figma.svg")}
                              size={16}
                            />
                          </Pressable>
                        ) : null}
                      </View>

                      {post.imageUris.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerClassName="mb-4 mt-4 gap-4"
                        >
                          {post.imageUris.map((uri, mediaIndex) => (
                            <View
                              key={`${post.id}-${uri}`}
                              className="relative overflow-visible"
                            >
                              <Pressable
                                onPress={() =>
                                  setMediaSettingsTarget({
                                    postId: post.id,
                                    uri,
                                  })
                                }
                              >
                                <Image
                                  source={{ uri }}
                                  className="h-[60px] w-[60px] rounded-lg"
                                  contentFit="cover"
                                />
                              </Pressable>
                              <Pressable
                                className="absolute -right-2 -top-2 h-[24px] w-[24px] items-center justify-center"
                                onPress={() =>
                                  setPendingDelete({
                                    title: "Remove Media",
                                    message:
                                      "Are you sure you want to remove this media?",
                                    confirmLabel: "Yes, Remove",
                                    onConfirm: () =>
                                      updatePost(post.id, (current) => ({
                                        ...current,
                                        imageUris: current.imageUris.filter(
                                          (_, currentIndex) =>
                                            currentIndex !== mediaIndex,
                                        ),
                                      })),
                                  })
                                }
                              >
                                <SvgIcon
                                  source={require("@/assets/icons/create-post/media-remove.svg")}
                                  size={24}
                                />
                              </Pressable>
                            </View>
                          ))}
                        </ScrollView>
                      ) : null}

                      <Pressable
                        onPress={() => {
                          setActivePostId(post.id);
                          editorRefs.current[post.id]?.focus();
                        }}
                      >
                        {mode === "edit" && selectedChannels[0] ? (
                          <SimpleCharacterLimit
                            currentLength={plainTextLength}
                            limit={
                              NETWORK_CHARACTER_LIMITS[
                                selectedChannels[0].network
                              ]
                            }
                          />
                        ) : (
                          <CharacterLimitStatus statuses={limitStatuses} />
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>

              {/* Tapping the empty gap below posts focuses the last editor */}
              <Pressable
                style={{ minHeight: 80 }}
                onPress={() => {
                  let targetId: string | undefined;
                  if (focusedChannelId && channelOverrides[focusedChannelId]) {
                    const chPosts = channelOverrides[focusedChannelId];
                    const lastPost = chPosts[chPosts.length - 1];
                    if (lastPost)
                      targetId = `channel-${focusedChannelId}-${lastPost.id}`;
                  } else {
                    const lastPost = posts[posts.length - 1];
                    if (lastPost) targetId = lastPost.id;
                  }
                  if (targetId) {
                    setActivePostId(targetId);
                    editorRefs.current[targetId]?.focus();
                  }
                }}
              />
            </ScrollView>

            {editorsLoading ? (
              <View
                pointerEvents="none"
                className="absolute inset-0 z-50 items-center justify-center bg-background-primary"
              >
                <ActivityIndicator size="small" color="#A3A3A3" />
              </View>
            ) : null}

            {keyboardVisible ? (
              <ComposerToolbar
                onMediaToolPress={handleMediaToolPress}
                onFormatPress={handleFormatPress}
                onAddPost={addAnotherPost}
                onReset={handleResetChannelOverride}
                bottomInset={0}
                disabled={
                  mode !== "edit" &&
                  focusedChannelId !== null &&
                  !channelOverrides[focusedChannelId]
                }
                showReset={
                  mode !== "edit" &&
                  focusedChannelId !== null &&
                  !!channelOverrides[focusedChannelId]
                }
              />
            ) : null}
          </KeyboardAvoidingView>

          <DateTimePickerSheet
            isVisible={dateTimePickerVisible}
            initialDate={scheduledDate}
            onSave={handleDateTimeSave}
            onClose={() => setDateTimePickerVisible(false)}
          />

          <BottomSheetWrapper
            isVisible={settingsSheet !== null}
            onClose={() => setSettingsSheet(null)}
            showHandle={settingsSheet !== "new-tag"}
            fullHeight={settingsSheet === "new-tag"}
            topOffset={settingsSheet === "new-tag" ? insets.top + 12 : 0}
            useBottomInsetPadding={false}
            avoidKeyboard={false}
            backdropColor="#414042"
            backdropOpacity={0.3}
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
              onToggleCarousel={() =>
                setNetworkCarouselEnabled((current) => !current)
              }
              reposters={networkRepostersEnabled}
              onToggleReposters={() =>
                setNetworkRepostersEnabled((current) => !current)
              }
              delay={networkDelay}
              onDelayChange={setNetworkDelay}
              focusedChannel={focusedChannelId ? focusedChannel : null}
              selectedChannels={selectedChannels}
              engagedChannelIds={engagedChannelIds}
              onToggleEngagedChannel={(id) =>
                setEngagedChannelIds((current) =>
                  current.includes(id)
                    ? current.filter((c) => c !== id)
                    : [...current, id],
                )
              }
              repeatValue={repeatPostValue}
              onRepeatChange={(v) =>
                setRepeatPostValue(v as (typeof REPEAT_OPTIONS)[number])
              }
              tags={effectiveTags}
              onToggleTag={toggleTag}
              newTagName={newTagName}
              onNewTagNameChange={setNewTagName}
              newTagColor={newTagColor}
              onNewTagColorChange={(c) =>
                setNewTagColor(c as (typeof TAG_COLOR_OPTIONS)[number])
              }
              onSaveNewTag={handleSaveNewTag}
              onOpenNewTag={openNewTagSheet}
              onDeletePost={handleDeleteComposerPost}
              bottomInset={insets.bottom}
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
            onCancel={() => {
              setDeleteDialogVisible(false);
              setTimeout(() => setSettingsSheet("main"), 350);
            }}
          />

          <ConfirmDialog
            visible={pendingDelete !== null}
            title={pendingDelete?.title ?? ""}
            message={pendingDelete?.message ?? ""}
            confirmLabel={pendingDelete?.confirmLabel ?? "Delete"}
            cancelLabel="No, Cancel"
            confirmDestructive
            onConfirm={() => {
              pendingDelete?.onConfirm();
              setPendingDelete(null);
            }}
            onCancel={() => setPendingDelete(null)}
          />

          <ChannelSelectionSheet
            isVisible={channelSheetVisible}
            channels={channels}
            selectedChannelIds={selectedChannelIds}
            onSave={handleChannelsSave}
            onClose={() => setChannelSheetVisible(false)}
            onAddChannel={() => {
              router.push("/add-channel");
            }}
            bottomInset={0}
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
      </View>
    </BottomSheetModalProvider>
  );
}
