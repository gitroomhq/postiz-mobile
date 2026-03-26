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
    <View
      className="w-full items-center justify-center gap-4 rounded-[8px] bg-white/[0.02] py-6"
    >
      <SvgIcon
        source={require("@/assets/icons/create-post/lock.svg")}
        size={24}
        tintColor="#FFFFFF"
        opacity={0.7}
      />
      <Text className="w-[309px] text-center font-jakarta text-[14px] leading-[14px] text-text-primary">
        Click this button to stop using the current template and customize the post
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

function buildNetworkLimitStatuses(channels: Channel[], textLength: number): NetworkLimitStatus[] {
  return channels.map((channel) => {
    const limit = NETWORK_CHARACTER_LIMITS[channel.network];

    return {
      channelId: channel.id,
      channelName: channel.name,
      networkLabel: formatNetworkLabel(channel.network),
      network: channel.network,
      currentLength: textLength,
      limit,
      isOverLimit: textLength > limit,
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

function buildCompactPreviewText(text: string, placeholder = "What would you like to share?") {
  if (text.length === 0) return placeholder;
  return text;
}

function PostConnector() {
  return <View className="ml-[10px] h-6 w-px bg-input-stroke-default" />;
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

      {menuOpen ? (
        <View
          className={`absolute right-0 top-7 z-30 w-[343px] rounded-[8px] border bg-main-menu-bg p-3 shadow-2xl ${
            hasErrors ? "border-text-critical" : "border-input-stroke-default"
          }`}
          style={{ elevation: 6 }}
        >
          {statuses.map((status, index) => {
            const networkConfig = NETWORK_CONFIG[status.network];
            const rowColorClass = status.isOverLimit ? "text-text-critical" : "text-text-primary";
            const isInstagram = status.network === "instagram" || status.network === "instagram-business";
            const isLinkedIn = status.network === "linkedin" || status.network === "linkedin-page";
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
                        className="h-4 w-4 items-center justify-center rounded-[4px]"
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
                        <SvgIcon source={socialIconSource} size={isLinkedIn ? 9.33 : 6.85} />
                      </View>
                    )
                  ) : (
                    <View
                      className="h-4 w-4 items-center justify-center rounded-[4px]"
                      style={{ backgroundColor: networkConfig.bg }}
                    >
                      <Ionicons name={networkConfig.icon} size={10} color="#FFFFFF" />
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
                <Text className={`font-jakarta text-[12px] font-medium ${rowColorClass}`}>
                  {status.currentLength}/{status.limit}
                </Text>
              </View>
            );
          })}
        </View>
      ) : null}
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

function CompactPostRow({
  text,
  placeholder,
  onPress,
  onDelete,
}: {
  text: string;
  placeholder?: string;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View className="flex-row items-start gap-4">
        <Text className="flex-1 font-jakarta text-body-1 leading-[20px] text-text-secondary">
          {buildCompactPreviewText(text, placeholder)}
        </Text>
        <Pressable
          className="h-5 w-5 items-center justify-center"
          hitSlop={8}
          onPress={onDelete}
        >
          <SvgIcon
            source={require("@/assets/icons/create-post/trash-figma.svg")}
            size={16}
          />
        </Pressable>
      </View>
    </Pressable>
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

  // When editing, restore the multi-post structure from the stored composerPosts
  const editingPost = params.postId ? allStorePosts.find((p) => p.id === params.postId) : undefined;
  const initialPosts = (): ComposerPost[] => {
    if (editingPost?.composerPosts && editingPost.composerPosts.length > 0) {
      return editingPost.composerPosts.map((cp) => makePost(cp.id, cp.content, [...cp.imageUris]));
    }
    return [makePost("post-1", initialContent, initialImageUri ? [initialImageUri] : [])];
  };

  // --- State ---
  const [posts, setPosts] = useState<ComposerPost[]>(initialPosts);
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);
  const [mediaSheetState, setMediaSheetState] = useState<MediaSheetState>("library");
  const [mediaAssets, setMediaAssets] = useState<{ id: string; uri: string }[]>(
    MEDIA_LIBRARY_ASSETS.map((asset) => ({ ...asset })),
  );
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(() => {
    if (mode === "edit" && params.channelId) {
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
  const [repeatPostValue, setRepeatPostValue] =
    useState<(typeof REPEAT_OPTIONS)[number]>("Every Day");
  const [tags, setTags] = useState<ComposerTag[]>(INITIAL_TAGS);
  const [newTagName, setNewTagName] = useState("New");
  const [newTagColor, setNewTagColor] = useState<(typeof TAG_COLOR_OPTIONS)[number]>("#E89623");
  const [activePostId, setActivePostId] = useState(posts[0]?.id ?? "post-1");
  const [pendingAutoFocusPostId, setPendingAutoFocusPostId] = useState<string | null>(null);
  const [channelOverrides, setChannelOverrides] = useState<
    Record<string, ComposerPost[]>
  >({});
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [mediaSettingsTarget, setMediaSettingsTarget] = useState<{
    postId: string;
    uri: string;
    altText?: string;
  } | null>(null);
  const editorRefs = useRef<Record<string, EditorBridge>>({});
  const postIdCounter = useRef(posts.length);

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

  const canSubmit = selectedChannels.length > 0 && posts.some((post) => stripEditorHtml(post.content).length > 0);
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
    postIdCounter.current += 1;
    const nextPostId = `post-${postIdCounter.current}`;

    if (focusedChannelId && channelOverrides[focusedChannelId]) {
      const chRefId = `channel-${focusedChannelId}-${nextPostId}`;
      setChannelOverrides((current) => ({
        ...current,
        [focusedChannelId]: [...current[focusedChannelId], makePost(nextPostId, "")],
      }));
      setActivePostId(chRefId);
      setPendingAutoFocusPostId(chRefId);
      return;
    }

    setPosts((current) => [...current, makePost(nextPostId, "")]);
    setActivePostId(nextPostId);
    setPendingAutoFocusPostId(nextPostId);
  };

  const deletePost = (postId: string) => {
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

  const handleChannelsSave = (channelIds: string[]) => {
    setSelectedChannelIds(channelIds);
  };

  const handleSave = (action: string = "calendar") => {
    setPostActionMenuVisible(false);
    const selectedTag = tags.find((tag) => tag.selected);

    for (const channel of selectedChannels) {
      // Use per-channel override posts if they exist, otherwise use the default posts
      const channelPosts = channelOverrides[channel.id] ?? posts;

      // Combine all posts into a single entry per channel
      const validPosts = channelPosts.filter((p) => stripEditorHtml(p.content).length > 0);
      if (validPosts.length === 0) continue;

      const displayContent = validPosts[0].content;
      const firstImage = validPosts.find((p) => p.imageUris.length > 0)?.imageUris[0];
      const composerPosts = validPosts.map((p) => ({ id: p.id, content: p.content, imageUris: p.imageUris }));

      if (mode === "edit" && params.postId) {
        updatePostInStore(params.postId, {
          content: displayContent,
          imageUri: firstImage,
          composerPosts,
          scheduledAt: scheduledDate.toISOString(),
          network: channel.network,
          status: action === "draft" ? "draft" : action === "now" ? "published" : "scheduled",
          tagLabel: selectedTag?.label,
          tagColor: selectedTag?.color,
        });
      } else {
        addPostToStore({
          id: `${Date.now()}-${channel.id}`,
          title: displayContent.replace(/<[^>]*>/g, "").trim().slice(0, 40),
          content: displayContent,
          category: "Social",
          imageUri: firstImage,
          composerPosts,
          scheduledAt: scheduledDate.toISOString(),
          network: channel.network,
          channelId: channel.id,
          authorName: channel.name,
          authorAvatar: channel.avatar,
          status: action === "draft" ? "draft" : action === "now" ? "published" : "scheduled",
          tagLabel: selectedTag?.label,
          tagColor: selectedTag?.color,
        });
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

    // If the active post is a per-channel override, update that override
    if (focusedChannelId && channelOverrides[focusedChannelId]) {
      const prefix = `channel-${focusedChannelId}-`;
      const postId = activePostId.startsWith(prefix)
        ? activePostId.slice(prefix.length)
        : channelOverrides[focusedChannelId][0]?.id;
      if (postId) {
        updateChannelOverridePost(focusedChannelId, postId, (prev) => ({
          ...prev,
          imageUris: selectedUris,
        }));
      }
    } else {
      // Add media to the currently active post, not always the first one
      setPosts((current) =>
        current.map((post) =>
          post.id === activePostId ? { ...post, imageUris: selectedUris } : post,
        ),
      );
    }

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

  const handleUnlockChannel = (channelId: string) => {
    if (posts.length === 0) return;
    setChannelOverrides((current) => ({
      ...current,
      [channelId]: posts.map((p) => makePost(p.id, p.content, [...p.imageUris])),
    }));
    setActivePostId(`channel-${channelId}-${posts[0].id}`);
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
        [channelId]: channelPosts.map((p) => (p.id === postId ? updater(p) : p)),
      };
    });
  };

  const handleDeleteComposerPost = () => {
    setSettingsSheet(null);
    setDeleteDialogVisible(true);
  };

  const confirmDeleteComposerPost = () => {
    setPosts((current) => {
      if (current.length <= 1) {
        const [first] = current;
        if (!first) return current;
        return [{ ...first, content: "", imageUris: [] }];
      }

      const index = current.findIndex((p) => p.id === activePostId);
      const nextPosts = current.filter((p) => p.id !== activePostId);
      const fallback = nextPosts[Math.max(0, index - 1)] ?? nextPosts[0];
      if (fallback) {
        setActivePostId(fallback.id);
      }
      return nextPosts;
    });
    setDeleteDialogVisible(false);
    showToast("Post deleted", "success");
  };

  const toggleTag = (tagId: string) => {
    setTags((current) =>
      current.map((tag) =>
        tag.id === tagId ? { ...tag, selected: true } : { ...tag, selected: false },
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

    setTags((current) => [...current.map((t) => ({ ...t, selected: false })), nextTag]);
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
    setActivePostId(posts[0]?.id ?? "post-1");
  }, [focusedChannelId, selectedChannels, posts]);

  // --- Render ---
  return (
    <View className="flex-1" style={{ paddingTop: 40 }}>
      <SafeAreaView className="flex-1 rounded-t-3xl bg-background-primary overflow-hidden" edges={["bottom"]}>
        <StatusBar style="light" />

        {/* Handle */}
        <View className="w-[33px] h-1 rounded-sm bg-[#454444] self-center mt-[10px] mb-[8px]" />

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
            <View className="absolute right-0 top-12 z-20 w-[208px] rounded-[12px] bg-main-menu-bg p-3" style={{ elevation: 2 }}>
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
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1 bg-background-primary"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 122 : 0}
      >
        {/* Content */}
        <ScrollView
          className="flex-1 bg-background-primary"
          contentContainerClassName="px-4 pt-3 pb-[92px]"
          keyboardShouldPersistTaps="handled"
        >
          {/* Channel tabs */}
          {mode === "edit" ? (
            /* Edit mode — show only the specific channel being edited */
            <View className="mb-4 flex-row items-center gap-1">
              {selectedChannels
                .filter((ch) => ch.id === params.channelId)
                .map((channel) => (
                  <ChannelTab key={channel.id} active>
                    <ChannelAvatar avatar={channel.avatar} network={channel.network} size={26} allowBadgeOverflow />
                  </ChannelTab>
                ))}

              <View className="flex-1" />

              <Pressable
                className="h-11 w-11 items-center justify-center rounded-[8px]"
                hitSlop={12}
                onPress={openSettingsSheet}
              >
                <SvgIcon source={require("@/assets/icons/create-post/settings.svg")} size={20} opacity={0.92} />
              </Pressable>
            </View>
          ) : (
            /* Create / duplicate mode — full channel bar */
            <View className="mb-4 flex-row items-center gap-1">
              <ChannelTab active={!focusedChannelId} onPress={() => setFocusedChannelId(null)}>
                <SvgIcon
                  source={require("@/assets/icons/create-post/globe-active.svg")}
                  size={24}
                  tintColor={focusedChannelId ? "#A3A3A3" : undefined}
                />
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
                      <ChannelAvatar avatar={channel.avatar} network={channel.network} size={26} allowBadgeOverflow />
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
          )}

          {/* Post editors */}
          {mode !== "edit" && focusedChannelId && !channelOverrides[focusedChannelId] ? (
            /* Locked template state — channel is using the default post (create mode only) */
            <View className="flex-1 justify-center py-16">
              <LockedTemplateCard onPress={() => handleUnlockChannel(focusedChannelId)} />
            </View>
          ) : mode !== "edit" && focusedChannelId && channelOverrides[focusedChannelId] ? (
            /* Unlocked per-channel editors (multi-post) */
            <View>
              {channelOverrides[focusedChannelId].map((chPost, chIndex) => {
                const chPlainText = stripEditorHtml(chPost.content);
                const chRefId = `channel-${focusedChannelId}-${chPost.id}`;
                const isChActive = activePostId === chRefId ||
                  (channelOverrides[focusedChannelId].length === 1 && chIndex === 0);

                const deleteChPost = () => {
                  setChannelOverrides((current) => {
                    const arr = current[focusedChannelId];
                    if (!arr || arr.length <= 1) return current;
                    const nextArr = arr.filter((p) => p.id !== chPost.id);

                    if (activePostId === chRefId) {
                      const idx = arr.findIndex((p) => p.id === chPost.id);
                      const fallback = nextArr[Math.max(0, idx - 1)] ?? nextArr[0];
                      if (fallback) {
                        setActivePostId(`channel-${focusedChannelId}-${fallback.id}`);
                      }
                    }

                    return { ...current, [focusedChannelId]: nextArr };
                  });
                };

                return (
                  <View key={chPost.id} className={chIndex > 0 ? "mt-5" : ""}>
                    {chIndex > 0 ? <PostConnector /> : null}

                    {!isChActive ? (
                      <>
                        <CompactPostRow
                          text={chPlainText}
                          placeholder={chIndex > 0 ? "Add another post" : undefined}
                          onPress={() => setActivePostId(chRefId)}
                          onDelete={deleteChPost}
                        />

                        {chPost.imageUris.length > 0 ? (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerClassName="mb-4 mt-4 gap-4"
                          >
                            {chPost.imageUris.map((uri, mediaIndex) => (
                              <View key={`${chRefId}-${uri}`} className="relative overflow-visible">
                                <Pressable onPress={() => setMediaSettingsTarget({ postId: chRefId, uri })}>
                                  <Image source={{ uri }} className="h-[60px] w-[60px] rounded-lg" contentFit="cover" />
                                </Pressable>
                                <Pressable
                                  className="absolute h-[24px] w-[24px] items-center justify-center"
                                  style={{ right: -8, top: -8 }}
                                  onPress={() =>
                                    updateChannelOverridePost(focusedChannelId, chPost.id, (prev) => ({
                                      ...prev,
                                      imageUris: prev.imageUris.filter((_, i) => i !== mediaIndex),
                                    }))
                                  }
                                >
                                  <SvgIcon source={require("@/assets/icons/create-post/media-remove.svg")} size={24} />
                                </Pressable>
                              </View>
                            ))}
                          </ScrollView>
                        ) : null}

                        {focusedChannel ? (
                          <SimpleCharacterLimit
                            currentLength={chPlainText.length}
                            limit={NETWORK_CHARACTER_LIMITS[focusedChannel.network]}
                          />
                        ) : null}
                      </>
                    ) : (
                      <>
                        {chIndex > 0 ? (
                          <View className="mb-2 items-end">
                            <Pressable
                              className="h-5 w-5 items-center justify-center"
                              hitSlop={8}
                              onPress={deleteChPost}
                            >
                              <SvgIcon source={require("@/assets/icons/create-post/trash-figma.svg")} size={16} />
                            </Pressable>
                          </View>
                        ) : null}

                        <PostEditor
                          key={chRefId}
                          initialContent={chPost.content}
                          onChange={(html) =>
                            updateChannelOverridePost(focusedChannelId, chPost.id, (prev) => ({ ...prev, content: html }))
                          }
                          onFocus={() => setActivePostId(chRefId)}
                          autoFocus={isChActive && chIndex === 0}
                          placeholder={chIndex > 0 ? "Add another post" : undefined}
                          editorRef={(editor) => {
                            editorRefs.current[chRefId] = editor;
                          }}
                        />

                        {chPost.imageUris.length > 0 ? (
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerClassName="mb-4 mt-4 gap-4"
                          >
                            {chPost.imageUris.map((uri, mediaIndex) => (
                              <View key={`${chRefId}-${uri}`} className="relative overflow-visible">
                                <Pressable onPress={() => setMediaSettingsTarget({ postId: chRefId, uri })}>
                                  <Image source={{ uri }} className="h-[60px] w-[60px] rounded-lg" contentFit="cover" />
                                </Pressable>
                                <Pressable
                                  className="absolute h-[24px] w-[24px] items-center justify-center"
                                  style={{ right: -8, top: -8 }}
                                  onPress={() =>
                                    updateChannelOverridePost(focusedChannelId, chPost.id, (prev) => ({
                                      ...prev,
                                      imageUris: prev.imageUris.filter((_, i) => i !== mediaIndex),
                                    }))
                                  }
                                >
                                  <SvgIcon source={require("@/assets/icons/create-post/media-remove.svg")} size={24} />
                                </Pressable>
                              </View>
                            ))}
                          </ScrollView>
                        ) : null}

                        {focusedChannel ? (
                          <SimpleCharacterLimit
                            currentLength={chPlainText.length}
                            limit={NETWORK_CHARACTER_LIMITS[focusedChannel.network]}
                          />
                        ) : null}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            /* Default post editors (globe tab) */
            <View>
            {posts.map((post, index) => {
              const plainText = stripEditorHtml(post.content);
              const plainTextLength = plainText.length;
              const limitStatuses = buildNetworkLimitStatuses(selectedChannels, plainTextLength);
              const isActivePost = activePostId === post.id || (posts.length === 1 && index === 0);

              return (
                <View key={post.id} className={index > 0 ? "mt-5" : ""}>
                  {index > 0 ? <PostConnector /> : null}

                  {!isActivePost ? (
                    <>
                      <CompactPostRow
                        text={plainText}
                        placeholder={index > 0 ? "Add another post" : undefined}
                        onPress={() => setActivePostId(post.id)}
                        onDelete={() => deletePost(post.id)}
                      />

                      {post.imageUris.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerClassName="mb-4 mt-4 gap-4"
                        >
                          {post.imageUris.map((uri, mediaIndex) => (
                            <View key={`${post.id}-${uri}`} className="relative overflow-visible">
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
                                className="absolute h-[24px] w-[24px] items-center justify-center"
                                style={{ right: -8, top: -8 }}
                                onPress={() =>
                                  updatePost(post.id, (current) => ({
                                    ...current,
                                    imageUris: current.imageUris.filter((_, currentIndex) => currentIndex !== mediaIndex),
                                  }))
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

                      {mode === "edit" && selectedChannels[0] ? (
                        <SimpleCharacterLimit
                          currentLength={plainTextLength}
                          limit={NETWORK_CHARACTER_LIMITS[selectedChannels[0].network]}
                        />
                      ) : (
                        <CharacterLimitStatus statuses={limitStatuses} />
                      )}
                    </>
                  ) : (
                    <>
                      {index > 0 ? (
                        <View className="mb-2 items-end">
                          <Pressable
                            className="h-5 w-5 items-center justify-center"
                            hitSlop={8}
                            onPress={() => deletePost(post.id)}
                          >
                            <SvgIcon
                              source={require("@/assets/icons/create-post/trash-figma.svg")}
                              size={16}
                            />
                          </Pressable>
                        </View>
                      ) : null}

                      <PostEditor
                        key={post.id}
                        initialContent={post.content}
                        onChange={(html) =>
                          updatePost(post.id, (current) => ({ ...current, content: html }))
                        }
                        onFocus={() => setActivePostId(post.id)}
                        autoFocus={isActivePost && (index === 0 || pendingAutoFocusPostId === post.id)}
                        placeholder={index > 0 ? "Add another post" : undefined}
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

                      {post.imageUris.length > 0 ? (
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerClassName="mb-4 mt-4 gap-4"
                        >
                          {post.imageUris.map((uri, mediaIndex) => (
                            <View key={`${post.id}-${uri}`} className="relative overflow-visible">
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
                                className="absolute h-[24px] w-[24px] items-center justify-center"
                                style={{ right: -8, top: -8 }}
                                onPress={() =>
                                  updatePost(post.id, (current) => ({
                                    ...current,
                                    imageUris: current.imageUris.filter((_, currentIndex) => currentIndex !== mediaIndex),
                                  }))
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

                      {mode === "edit" && selectedChannels[0] ? (
                        <SimpleCharacterLimit
                          currentLength={plainTextLength}
                          limit={NETWORK_CHARACTER_LIMITS[selectedChannels[0].network]}
                        />
                      ) : (
                        <CharacterLimitStatus statuses={limitStatuses} />
                      )}
                    </>
                  )}
                </View>
              );
            })}
            </View>
          )}

        </ScrollView>

        {/* Bottom toolbar */}
        <ComposerToolbar
          onMediaToolPress={handleMediaToolPress}
          onFormatPress={handleFormatPress}
          onAddPost={addAnotherPost}
          bottomInset={0}
          addPostDisabled={mode !== "edit" && focusedChannelId !== null && !channelOverrides[focusedChannelId]}
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
        fullHeight={settingsSheet === "new-tag"}
        topOffset={settingsSheet === "new-tag" ? insets.top + 12 : 0}
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
        onCancel={() => setDeleteDialogVisible(false)}
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
  );
}
