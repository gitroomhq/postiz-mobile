import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { format, parseISO } from "date-fns";
import * as ImagePicker from "expo-image-picker";
import { Video as VideoCompressor } from "react-native-compressor";
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
  POST_ACTIONS,
  REPEAT_OPTIONS,
  REPEAT_OPTION_TO_DAYS,
  TAG_COLOR_OPTIONS,
  daysToRepeatOption,
  formatNetworkLabel,
  makePost,
  type ComposerPost,
  type ComposerTag,
  type SettingsSheet,
} from "@/components/create-post/constants";
import { MediaLibrarySheet } from "@/components/create-post/media-library-sheet";
import { MediaSettingsModal } from "@/components/create-post/media-settings-modal";
import {
  RepublishChoiceDialog,
  type RepublishChoice,
} from "@/components/create-post/republish-choice-dialog";
import {
  PostEditor,
  type EditorBridge,
} from "@/components/create-post/post-editor";
import { SettingsSheetContent } from "@/components/create-post/settings-sheet";
import {
  SettingsWebViewFleet,
  type SettingsWebViewFleetHandle,
} from "@/components/create-post/settings-webview-fleet";
import { AnimatedDropdown } from "@/components/ui/animated-dropdown";
import { BottomSheetWrapper } from "@/components/ui/bottom-sheet-wrapper";
import { ChannelAvatar } from "@/components/ui/channel-avatar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Image } from "@/components/ui/image";
import { SvgIcon } from "@/components/ui/svg-icon";
import { showToast, ToastProvider } from "@/components/ui/toast";
import { getNetworkCharacterLimit } from "@/constants/networks";
import { getNetworkIconUrl } from "@/utils/network-icon";
import { useChannelsStore } from "@/store/channels-store";
import { useMediaStore } from "@/store/media-store";
import { usePostsStore, type ComposerImage } from "@/store/posts-store";
import { useTagsStore } from "@/store/tags-store";
import type { Channel } from "@/types";
import {
  parseBackendPostImages,
  type BackendPostImage,
} from "@/utils/api-mappers";
import { apiFetch } from "@/utils/custom-fetch";

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
  /**
   * True when the user has customized content for this channel (a channel
   * override exists). Maps to the web's `internal` store flag and surfaces
   * as "Internal Edit" in the per-channel grid inside the pill tooltip.
   */
  isInternal: boolean;
  /**
   * False while the channel's WebView bridge hasn't returned a character
   * limit yet. CharacterLimitPill collapses to count-only + green when any
   * displayed status is unresolved, so the user never sees the constants
   * fallback flash before the real limit arrives.
   */
  limitResolved: boolean;
};

function buildNetworkLimitStatuses(
  channels: Channel[],
  defaultTextLength: number,
  channelOverrides: Record<string, ComposerPost[]>,
  postId: string,
  resolveLimit: (channel: Channel) => number,
  isLimitResolved: (channel: Channel) => boolean,
): NetworkLimitStatus[] {
  return channels.map((channel) => {
    const limit = resolveLimit(channel);
    const limitResolved = isLimitResolved(channel);

    let currentLength = defaultTextLength;
    const overridePosts = channelOverrides[channel.id];
    const isInternal = !!overridePosts;
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
      isInternal,
      limitResolved,
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

/**
 * Character-limit pill — mirrors the web's information.component.tsx.
 *
 * Branches on `isGlobal`, NOT on statuses.length, matching the web's
 * `state.current === 'global'` check:
 * - isGlobal: shows smallest-unexceeded limit, chevron + per-channel grid
 *   in the tooltip (even with a single selected channel).
 * - !isGlobal: shows the single channel's limit, no chevron unless invalid,
 *   tooltip only surfaces the empty-post error.
 *
 * Valid when (totalChars > 0 OR has picture) AND no displayed channel is
 * over its limit.
 */
function CharacterLimitPill({
  statuses,
  totalChars,
  isGlobal,
  isPicture = false,
}: {
  statuses: NetworkLimitStatus[];
  totalChars: number;
  isGlobal: boolean;
  isPicture?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasChannels = statuses.length > 0;

  useEffect(() => {
    if (!hasChannels) setMenuOpen(false);
  }, [hasChannels]);

  if (!hasChannels) return null;

  const emptyPost = !isPicture && totalChars === 0;
  // While any displayed channel's limit is still resolving through the
  // WebView bridge, suppress the limit math entirely and show count-only
  // in the green/valid state — otherwise we'd flash a constants-fallback
  // "X/280" that may immediately jump to "X/4000".
  const allLimitsResolved = statuses.every((s) => s.limitResolved);
  // Internal (channel-override) channels are excluded from validity/display
  // math in global mode, mirroring information.component.tsx — they run
  // their own pills in per-channel view.
  const anyOver =
    allLimitsResolved &&
    statuses.some(
      (s) => !(isGlobal && s.isInternal) && totalChars > s.limit,
    );
  const isValid = !emptyPost && !anyOver;
  const limitsLoading = !allLimitsResolved;

  let displayLimit: number = 0;
  if (allLimitsResolved) {
    if (isGlobal) {
      const limits = statuses
        .filter((s) => !s.isInternal && s.limit > 0)
        .map((s) => s.limit)
        .sort((a, b) => a - b);
      const validLimit = limits.find((l) => totalChars <= l);
      displayLimit = validLimit ?? limits[0] ?? 0;
    } else {
      displayLimit = statuses[0].limit;
    }
  }

  // No chevron while loading: the per-channel rows in the dropdown would
  // also be incomplete, so the affordance to open it shouldn't appear.
  const showChevron =
    allLimitsResolved && ((isGlobal && statuses.length > 0) || !isValid);
  const iconSource = isValid
    ? require("@/assets/icons/create-post/limit-ok-figma.svg")
    : require("@/assets/icons/create-post/limit-error-figma.svg");

  const pillClass = limitsLoading
    ? "border border-main-accent-blue"
    : isValid
    ? "border border-[#00EB75]"
    : "bg-[#FF3F3F]";
  const numberClass = isValid || limitsLoading ? "text-text-primary" : "text-white";

  return (
    <View className="relative mb-3 items-end overflow-visible">
      <Pressable
        hitSlop={10}
        onPress={() => {
          if (!showChevron) return;
          setMenuOpen((current) => !current);
        }}
        className={`flex-row items-center gap-[4px] h-[30px] px-[6px] rounded-[6px] ${pillClass}`}
      >
        {limitsLoading ? (
          <ActivityIndicator size="small" color="#618DFF" />
        ) : (
          <SvgIcon source={iconSource} size={16} />
        )}
        <Text
          className={`font-jakarta text-[10px] font-semibold ${numberClass}`}
        >
          {limitsLoading ? "Loading" : `${totalChars}/${displayLimit}`}
        </Text>
        {showChevron ? (
          <Ionicons
            name="chevron-down"
            size={14}
            color="#FFFFFF"
            style={{
              transform: [{ rotate: menuOpen ? "180deg" : "0deg" }],
            }}
          />
        ) : null}
      </Pressable>

      {showChevron ? (
        <AnimatedDropdown
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          anchor="top-right"
          style={{ position: "absolute", right: 0, top: 34, zIndex: 30 }}
        >
          <View
            className={`min-w-[260px] rounded-[12px] border bg-main-menu-bg p-3 shadow-2xl ${
              isValid ? "border-[#00EB75]" : "border-[#FF3F3F]"
            }`}
            style={{ elevation: 6 }}
          >
            {emptyPost ? (
              <Text
                className={`font-jakarta text-[12px] text-[#FF3F3F] ${
                  isGlobal ? "mb-3" : ""
                }`}
              >
                Your post should have at least one character or one image.
              </Text>
            ) : null}
            {isGlobal
              ? statuses.map((status, index) => {
                  const over = !status.isInternal && totalChars > status.limit;
                  const rowColor = over
                    ? "text-[#FF3F3F]"
                    : "text-text-primary";
                  return (
                    <View
                      key={status.channelId}
                      className={`flex-row items-center justify-between ${index > 0 ? "mt-2" : ""}`}
                    >
                      <View className="mr-3 flex-1 flex-row items-center gap-2">
                        <View className="h-4 w-4 overflow-hidden rounded-[4px]">
                          <Image
                            source={{ uri: getNetworkIconUrl(status.network) }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                          />
                        </View>
                        <Text
                          className={`flex-1 font-jakarta text-[12px] font-medium ${rowColor}`}
                          numberOfLines={1}
                        >
                          <Text className="font-jakarta text-[12px] font-bold">
                            {status.channelName}
                          </Text>{" "}
                          ({status.networkLabel}):
                        </Text>
                      </View>
                      <Text
                        className={`font-jakarta text-[12px] font-medium ${rowColor}`}
                      >
                        {status.isInternal
                          ? "Internal Edit"
                          : `${totalChars}/${status.limit}`}
                      </Text>
                    </View>
                  );
                })
              : null}
          </View>
        </AnimatedDropdown>
      ) : null}
    </View>
  );
}

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const channels = useChannelsStore((state) => state.channels);
  const createPostAction = usePostsStore((state) => state.createPost);
  const deletePostAction = usePostsStore((state) => state.deletePost);
  const allStorePosts = usePostsStore((state) => state.posts);
  const params = useLocalSearchParams<{
    dateTime?: string;
    postId?: string;
    mode?: string;
    content?: string;
    imageUri?: string;
    network?: string;
    channelId?: string;
    /**
     * "1" when the composer was opened from a context that isn't already
     * the calendar (e.g. the main-tab "+" button). Calendar slot taps,
     * edit, and duplicate omit it — the user is already on the calendar
     * and doesn't need to be jumped to the post's date on save.
     */
    navigateOnSave?: string;
  }>();

  const mode =
    params.mode === "duplicate"
      ? "duplicate"
      : params.mode === "edit" || !!params.postId
        ? "edit"
        : "create";
  // Default to 5 minutes in the future so a fresh composer isn't already in
  // the past by the time the user has typed something.
  const initialDate = params.dateTime
    ? parseISO(params.dateTime)
    : new Date(Date.now() + 5 * 60 * 1000);
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
    // Edit mode: prefer the raw HTML the backend stores so the rich editor
    // can render formatting (bold, lists, line breaks). Fall back to the
    // navigation param, then to the plain-text preview.
    const editInitialHtml =
      editingPost?.contentHtml && editingPost.contentHtml.length > 0
        ? editingPost.contentHtml
        : editingPost?.content
          ? editingPost.content
          : initialContent;
    return [
      makePost(
        "post-1",
        editInitialHtml,
        initialImageUri ? [initialImageUri] : [],
      ),
    ];
  };

  const [posts, setPosts] = useState<ComposerPost[]>(initialPosts);
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);
  // Media library is now backed by the /media endpoint via useMediaStore.
  // Local state is reduced to which asset ids the user has multi-selected
  // for "Add Selected Media" — everything else (assets, paging, search,
  // upload/delete progress) lives in the store.
  const mediaAssets = useMediaStore((state) => state.assets);
  const mediaPages = useMediaStore((state) => state.pages);
  const mediaCurrentPage = useMediaStore((state) => state.currentPage);
  const mediaSearch = useMediaStore((state) => state.search);
  const mediaLoading = useMediaStore((state) => state.loading);
  const mediaUploading = useMediaStore((state) => state.uploading);
  const fetchMediaAssets = useMediaStore((state) => state.fetchAssets);
  const setMediaSearch = useMediaStore((state) => state.setSearch);
  const setMediaPage = useMediaStore((state) => state.setPage);
  const uploadMediaFiles = useMediaStore((state) => state.uploadFiles);
  const deleteMediaAssets = useMediaStore((state) => state.deleteAssets);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  /**
   * Backend metadata for every media URI that's ever been attached to a
   * post in this composer session, keyed by the asset's R2 path. Lets us
   * round-trip the Media row id (and alt/thumbnail) into the create-post
   * payload without changing the per-post `imageUris: string[]` shape.
   * Populated when a library asset is added; the entry survives even if
   * the user removes and re-adds the same asset.
   */
  const [imageMetaByPath, setImageMetaByPath] = useState<
    Record<string, ComposerImage>
  >({});
  const [selectedChannelIds, setSelectedChannelIds] = useState<string[]>(() => {
    if (params.channelId) {
      return [params.channelId];
    }
    if (mode === "create" && initialContent.length === 0 && !initialImageUri) {
      return [];
    }
    return channels.slice(0, 3).map((channel) => channel.id);
  });

  // Per-provider settings per channel (keyed by channel id), populated by the
  // hidden SettingsWebViewFleet during pre-submit validation or by explicit
  // user edit when we surface the WebView after a validation failure.
  const [channelSettings, setChannelSettings] = useState<
    Record<string, Record<string, unknown>>
  >(() => {
    if (!editingPost) return {};
    const seed: Record<string, Record<string, unknown>> = {};
    if (editingPost.settings && editingPost.channelId) {
      seed[editingPost.channelId] = editingPost.settings;
    }
    return seed;
  });
  const [settingsErrorsByChannel, setSettingsErrorsByChannel] = useState<
    Record<string, string[]>
  >({});
  const [settingsChannelId, setSettingsChannelId] = useState<string | null>(null);

  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [channelSheetVisible, setChannelSheetVisible] = useState(false);
  const [postActionMenuVisible, setPostActionMenuVisible] = useState(false);
  /**
   * Which submit action (calendar / now / draft) is currently in flight.
   * Drives the per-button spinner in the action dropdown and disables the
   * top-right Post button while the request is pending.
   */
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  /**
   * Promise resolver held while the republish-vs-update modal is open.
   * Mirrors the web's `await new Promise(...)` pattern in
   * manage.modal.tsx:209-240. `null` is resolved on cancel, abort the
   * submit; `'update'` switches the action to update-only; `'republish'`
   * keeps the literal action.
   */
  const republishResolverRef = useRef<
    ((choice: RepublishChoice | null) => void) | null
  >(null);
  const [republishVisible, setRepublishVisible] = useState(false);
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
  // Default to "Do Not Repeat" — the previous "Every Day" default would
  // silently set every post on a daily repeat schedule (sent as `inter: 1`)
  // even when the user never opened the repeat picker. Mirrors the web's
  // null-when-untouched behavior in repeat.component.tsx. In edit mode
  // we restore from the loaded post's `intervalInDays` so the picker
  // shows the saved selection instead of resetting to "Do Not Repeat"
  // and looking like the value didn't persist.
  const [repeatPostValue, setRepeatPostValue] = useState<
    (typeof REPEAT_OPTIONS)[number]
  >(() => daysToRepeatOption(editingPost?.intervalInDays));
  const [tags, setTags] = useState<ComposerTag[]>(INITIAL_TAGS);
  const fetchedTags = useTagsStore((state) => state.tags);
  const fetchTags = useTagsStore((state) => state.fetchTags);
  const createTagAction = useTagsStore((state) => state.createTag);

  // Pull the user's real tags from /posts/tags on mount. The previous
  // INITIAL_TAGS mock list was being silently dropped server-side because
  // posts.repository.ts:563-571 attaches by name match, and "Personal" /
  // "Important" / "General" don't exist on the user's account.
  useEffect(() => {
    void fetchTags();
  }, [fetchTags]);

  // Merge fetched tags into the picker state. New tags coming from the
  // backend are added with `selected: false`; tags the user already
  // toggled keep their selection through refetches.
  useEffect(() => {
    if (fetchedTags.length === 0) return;
    setTags((prev) => {
      const prevById = new Map(prev.map((t) => [t.id, t]));
      return fetchedTags.map((t) => ({
        id: t.id,
        label: t.name,
        color: t.color,
        selected: prevById.get(t.id)?.selected ?? false,
      }));
    });
  }, [fetchedTags]);
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
  const fleetRef = useRef<SettingsWebViewFleetHandle>(null);
  const postIdCounter = useRef(posts.length);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [editorsLoading, setEditorsLoading] = useState(mode === "edit");
  /**
   * In edit mode the composer can't render until /posts/group/:group has
   * returned — otherwise the editor mounts with stale calendar data, then
   * the fetch resolves and we mutate `posts` (text/imageUris), causing the
   * RichEditor to flicker (text → blank → reload). Gate posts rendering
   * AND the loading overlay on this flag so the editor only mounts once.
   */
  const [editFetchHydrated, setEditFetchHydrated] = useState(mode !== "edit");

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

  /**
   * Provider character limits resolved through the SettingsWebViewFleet's
   * bridge. Each entry is the result of running the web provider's
   * `maximumCharacters(additionalSettings)` against the integration row, so
   * X bumps to 4000 on Verified accounts, etc. Filled lazily when a channel's
   * WebView signals ready; until then `getChannelLimit` falls back to
   * `getNetworkCharacterLimit` so the editor counter never shows blank.
   */
  const [channelLimits, setChannelLimits] = useState<Record<string, number>>(
    {},
  );

  const getChannelLimit = useCallback(
    (channel: Channel): number => {
      const cached = channelLimits[channel.id];
      return typeof cached === "number"
        ? cached
        : getNetworkCharacterLimit(channel.network);
    },
    [channelLimits],
  );

  /**
   * True once the channel's character limit has been resolved through the
   * WebView bridge. Until then, the pill renders count-only + green so we
   * don't briefly flash a constants-based "X/280" that may immediately jump
   * to "X/4000" once the Verified status arrives.
   */
  const isChannelLimitResolved = useCallback(
    (channel: Channel): boolean =>
      typeof channelLimits[channel.id] === "number",
    [channelLimits],
  );

  const handleChannelReady = useCallback(async (channelId: string) => {
    const resolved = await fleetRef.current?.getMaximumCharacters(channelId);
    const fallback = channels.find((channel) => channel.id === channelId);
    const limit =
      typeof resolved === "number"
        ? resolved
        : fallback
          ? getNetworkCharacterLimit(fallback.network)
          : null;
    if (typeof limit === "number") {
      setChannelLimits((prev) =>
        prev[channelId] === limit ? prev : { ...prev, [channelId]: limit },
      );
    }
  }, [channels]);

  const integrationsByChannel = useMemo(
    () =>
      Object.fromEntries(
        selectedChannels.map((c) => [
          c.id,
          {
            id: c.id,
            name: c.name,
            identifier: c.network,
            picture: c.avatar,
            display: c.name,
            additionalSettings: c.additionalSettings ?? "[]",
          },
        ]),
      ),
    [selectedChannels],
  );

  const MAX_CHANNEL_SCROLL_WIDTH = 180;
  const estimatedChannelsWidth =
    selectedChannels.length > 0
      ? selectedChannels.length * 44 + (selectedChannels.length - 1) * 4
      : 0;
  const channelsOverflow = estimatedChannelsWidth > MAX_CHANNEL_SCROLL_WIDTH;

  // Mirror the web's notEnoughChars check (manage.modal.tsx:250-259):
  // EVERY selected channel's resolved posts (override > global) must have
  // content or media on EVERY entry. A channel running on empty global
  // content blocks submission; a sibling channel with internal content
  // doesn't rescue it.
  const canSubmit =
    selectedChannels.length > 0 &&
    selectedChannels.every((channel) => {
      const effectivePosts = channelOverrides[channel.id] ?? posts;
      if (effectivePosts.length === 0) return false;
      return effectivePosts.every(
        (post) =>
          stripEditorHtml(post.content).length > 0 ||
          post.imageUris.length > 0,
      );
    });
  const focusedChannel =
    selectedChannels.find((channel) => channel.id === focusedChannelId) ??
    selectedChannels[0] ??
    null;
  const networkSettingsTitle =
    focusedChannelId && focusedChannel
      ? `${formatNetworkLabel(focusedChannel.network)} Settings`
      : "Channel Settings";

  // Tags are a top-level concept on the backend payload (manage.modal.tsx
  // sends `tags` at the root, not per-channel). Previously this wrapper
  // forced a per-channel override view onto the picker, but the override
  // was never read in handleSave — selections made inside a focused
  // channel would silently disappear at submit time. Picker now mirrors
  // the underlying `tags` state directly.
  const effectiveTags = tags;

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

  const handleSave = async (action: string = "calendar") => {
    if (submittingAction) return;
    if (republishResolverRef.current) return; // republish modal already open

    // Pre-compute the backend action up front so the republish prompt can
    // override it before we enter the submit flow.
    let backendAction: "schedule" | "draft" | "now" | "update" =
      action === "draft"
        ? "draft"
        : action === "now"
          ? "now"
          : "schedule";

    // Republish-vs-update gate (manage.modal.tsx:201-244): when editing a
    // post that was already PUBLISHED, or one that's QUEUE'd in the past
    // (its scheduled time has elapsed), tapping Schedule/Now ambiguously
    // could mean "fix the details and re-publish" or "fix the details
    // without re-firing the publish workflow". Ask first; cancel aborts.
    const wasPublishedOrPastQueue =
      mode === "edit" &&
      (editingPost?.status === "published" ||
        (editingPost?.status === "scheduled" &&
          new Date().getTime() > scheduledDate.getTime()));
    if (
      wasPublishedOrPastQueue &&
      (backendAction === "now" || backendAction === "schedule")
    ) {
      setPostActionMenuVisible(false);
      setRepublishVisible(true);
      const choice = await new Promise<RepublishChoice | null>((resolve) => {
        republishResolverRef.current = resolve;
      });
      republishResolverRef.current = null;
      setRepublishVisible(false);
      if (!choice) return; // user cancelled — abort the submit
      if (choice === "update") backendAction = "update";
      // 'republish' keeps the literal action so the backend re-queues +
      // triggers startWorkflow.
    }

    setSubmittingAction(action);
    setPostActionMenuVisible(false);
    try {
    const selectedTags = tags.filter((tag) => tag.selected);

    const channelsPayload: {
      integrationId: string;
      values: { id?: string; content: string; images?: ComposerImage[] }[];
      settings?: Record<string, unknown>;
    }[] = [];
    const payloadChannels: Channel[] = []; // parallel to channelsPayload for error routing
    for (const channel of selectedChannels) {
      const channelPosts = channelOverrides[channel.id] ?? posts;
      if (channelPosts.length === 0) continue;
      // Mirror the web's notEnoughChars gate: every entry in the thread
      // must have content OR media — otherwise drop the whole channel
      // rather than silently posting a partial thread.
      const allEntriesValid = channelPosts.every(
        (p) =>
          stripEditorHtml(p.content).length > 0 || p.imageUris.length > 0,
      );
      if (!allEntriesValid) continue;
      // Send every entry in the thread, not just the first. Resolve
      // attached URIs back to their Media rows (id+path+alt+thumbnail);
      // URIs without a registered meta entry (e.g. legacy deep-link
      // image) are dropped to avoid sending malformed entries.
      // Backend post ids are uuid-shaped; locally added thread entries
      // carry a `post-N` placeholder id and must NOT be forwarded so the
      // backend creates a fresh row.
      const values = channelPosts.map((p) => ({
        ...(p.id.startsWith("post-") ? {} : { id: p.id }),
        content: p.content,
        images: p.imageUris
          .map((uri) => imageMetaByPath[uri])
          .filter((meta): meta is ComposerImage => !!meta),
      }));
      channelsPayload.push({
        integrationId: channel.id,
        values,
        settings: channelSettings[channel.id],
      });
      payloadChannels.push(channel);
    }

    if (channelsPayload.length === 0) {
      showToast("Write something before saving", "error");
      return;
    }

    // Pre-submit: ask every selected channel's hidden provider WebView for
    // its current settings. This captures provider defaults even if the user
    // never opened the settings sheet. Drafts still collect these values, but
    // only schedule/now/update actions enforce DTO/checkValidity failures.
    if (fleetRef.current) {
      const validations = await fleetRef.current.validateAll();
      const newErrors: Record<string, string[]> = {};
      let firstOffender:
        | {
            channel: Channel;
            messages: string[];
            /** True when only checkValidity failed (DTO still passes). */
            checkValidityOnly: boolean;
          }
        | null = null;
      for (const channel of payloadChannels) {
        const result = validations[channel.id];
        if (!result) continue;
        const idx = channelsPayload.findIndex(
          (p) => p.integrationId === channel.id,
        );
        if (idx >= 0) {
          // Only use the WebView form's values when we don't already
          // have settings in local state. If `channelSettings[id]` is
          // populated (from /posts/group/:group on edit, or from the
          // user explicitly saving the WebView panel) it's the source
          // of truth — trusting `result.value` here would clobber it
          // with the form's DTO defaults if the user hits Save before
          // the seeded remount of the hidden WebView completes.
          const existing = channelSettings[channel.id];
          const hasExisting = !!existing && Object.keys(existing).length > 0;
          if (!hasExisting) {
            channelsPayload[idx].settings = result.value;
          }
        }

        if (backendAction !== "draft" && !result.isValid) {
          newErrors[channel.id] = result.errors;
          if (!firstOffender) {
            const checkValidityOnly =
              result.formValid === true && !!result.checkValidityError;
            firstOffender = {
              channel,
              messages: result.errors,
              checkValidityOnly,
            };
          }
        }
      }
      if (firstOffender) {
        setSettingsErrorsByChannel(newErrors);
        showToast(
          `${firstOffender.channel.name}: ${firstOffender.messages[0] ?? "Settings invalid"}`,
          "error",
        );
        // Only open the settings modal for DTO failures — checkValidity issues
        // (media constraints etc.) can't be fixed from the provider settings
        // form, so just surface the toast and let the user adjust the composer.
        if (!firstOffender.checkValidityOnly) {
          setSettingsChannelId(firstOffender.channel.id);
          fleetRef.current.setVisibleChannel(firstOffender.channel.id);
        }
        return;
      }
    }

    // Backend matches by `tag.label` (the tag NAME) and only attaches
    // tags that already exist (posts.repository.ts:563-571). Send all
    // selected tags as `{value: name, label: name}` mirroring the web
    // (tags.component.tsx:209-217).
    const tagsPayload = selectedTags.map((tag) => ({
      value: tag.label,
      label: tag.label,
    }));

    const interDays = REPEAT_OPTION_TO_DAYS[repeatPostValue] ?? null;

    const existingGroup =
      mode === "edit" && params.postId
        ? allStorePosts.find((p) => p.id === params.postId)?.group
        : undefined;

    if (mode === "edit" && params.postId && !existingGroup) {
      showToast("Can't edit: post not found in the loaded range", "error");
      return;
    }

    const result = await createPostAction({
      action: backendAction,
      scheduledAt: scheduledDate,
      existingGroup,
      channels: channelsPayload,
      tags: tagsPayload,
      inter: interDays,
    });

    if (!result.ok) {
      // Attribute validator errors back to specific channels and open the
      // settings WebView for the first offender, mirroring the web composer.
      const { channelErrors, generalMessage } = result.parsed;
      if (channelErrors.length > 0) {
        const newErrors: Record<string, string[]> = {};
        for (const ce of channelErrors) {
          if (ce.channelIndex == null) continue;
          const channel = payloadChannels[ce.channelIndex];
          if (!channel) continue;
          newErrors[channel.id] = ce.messages;
        }
        setSettingsErrorsByChannel(newErrors);

        const firstOffender = channelErrors.find(
          (ce) =>
            ce.section === "settings" &&
            ce.channelIndex != null &&
            payloadChannels[ce.channelIndex],
        );
        if (firstOffender && firstOffender.channelIndex != null) {
          const channel = payloadChannels[firstOffender.channelIndex];
          setSettingsChannelId(channel.id);
          fleetRef.current?.setVisibleChannel(channel.id);
          showToast(
            `${channel.name}: ${firstOffender.messages[0]}`,
            "error",
          );
          return;
        }
      }
      showToast(generalMessage ?? result.error ?? "Save failed", "error");
      return;
    }

    // Clear any lingering settings errors on success.
    setSettingsErrorsByChannel({});

    // Tell the calendar to navigate to this post's date & time — only
    // when the composer was opened from a non-calendar context (the
    // main-tab "+" button). See the param doc above.
    if (params.navigateOnSave === "1") {
      usePostsStore.getState().setNavigateToDate(scheduledDate.toISOString());
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
    router.replace("/(tabs)");
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleDateTimeSave = useCallback((newDate: Date) => {
    setScheduledDate(newDate);
    setDateTimePickerVisible(false);
    showToast("Date & time updated", "success");
  }, []);

  const openMediaLibrary = () => {
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

    // Pre-select any already-attached assets so the multi-select state
    // round-trips when the user re-opens the sheet on the same post.
    setSelectedMediaIds(
      mediaAssets
        .filter((asset) => currentUris.includes(asset.path))
        .map((asset) => asset.id),
    );
    setMediaLibraryVisible(true);
    // Always refetch on open — keeps the grid in sync with deletes/uploads
    // that may have happened from another screen.
    void fetchMediaAssets(0, mediaSearch);
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
    const ids = [...selectedMediaIds];
    if (ids.length === 0) return;
    setPendingDelete({
      title: "Delete Media",
      message: `Are you sure you want to delete ${ids.length === 1 ? "this media item" : `these ${ids.length} media items`}?`,
      confirmLabel: "Yes, Delete",
      onConfirm: async () => {
        setSelectedMediaIds([]);
        await deleteMediaAssets(ids);
        showToast("Selected media deleted", "success");
      },
    });
  };

  const handleAddSelectedMedia = () => {
    const chosen = mediaAssets.filter((asset) =>
      selectedMediaIds.includes(asset.id),
    );
    const selectedUris = chosen.map((asset) => asset.path);

    if (selectedUris.length === 0) return;

    // Stash the backend metadata for each selected asset so handleSave can
    // emit `image: [{ id, path, alt, thumbnail, ... }]` instead of dropping
    // attachments because we only kept the URI in the per-post state.
    setImageMetaByPath((prev) => {
      const next = { ...prev };
      for (const asset of chosen) {
        next[asset.path] = {
          id: asset.id,
          path: asset.path,
          alt: asset.alt ?? null,
          thumbnail: asset.thumbnail ?? null,
          thumbnailTimestamp: asset.thumbnailTimestamp ?? null,
        };
      }
      return next;
    });

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

  const confirmDeleteComposerPost = async () => {
    setDeleteDialogVisible(false);
    if (mode === "edit" && params.postId) {
      const target = allStorePosts.find((p) => p.id === params.postId);
      if (target) {
        const result = await deletePostAction(target);
        if (!result.ok) {
          showToast(result.error ?? "Delete failed", "error");
          return;
        }
      }
    }
    showToast("Post deleted", "success");
    setTimeout(() => router.back(), 250);
  };

  const toggleTag = (tagId: string) => {
    // Multi-select: flip the tapped tag's selection in place. Mirrors the
    // web's tags.component.tsx:200-217 behavior where each click adds /
    // removes a tag from the value array. The previous implementation was
    // single-select (radio) and also wrote to `channelTagOverrides` when a
    // channel was focused — that override never reached the create-post
    // payload (handleSave only reads `tags`), so per-channel taps were
    // silently dropped. Tags are now a top-level concept, matching the
    // web payload in manage.modal.tsx:372 (`tags` at the root).
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

  const handleSaveNewTag = async () => {
    const normalizedName = newTagName.trim() || "New";
    // Persist the tag on the backend first so the next save can attach it
    // — posts.repository.ts:563-571 only attaches tags whose `name`
    // already exists. Skipping this would silently drop the new tag.
    const created = await createTagAction({
      name: normalizedName,
      color: newTagColor,
    });
    if (!created) {
      showToast("Couldn't create tag", "error");
      return;
    }
    const nextTag: ComposerTag = {
      id: created.id,
      label: created.name,
      color: created.color,
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

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (result.canceled || result.assets.length === 0) return;

    // Mirror the web's Transloadit pipeline:
    //   - Images: passed through untouched (export-images stores as-is).
    //   - Videos: re-encoded to a 720p H.264 MP4 (~2.5 Mbps). The template
    //     uses ffmpeg's `web/mp4/720p` preset with `min_fit` (downscale
    //     only, never upscale). `react-native-compressor` runs the native
    //     hardware encoder (VideoToolbox / MediaCodec) on a background
    //     thread — same shape, no UI freeze.
    const videoCount = result.assets.filter((a) => a.type === "video").length;
    if (videoCount > 0) {
      showToast(
        videoCount === 1
          ? "Compressing video..."
          : `Compressing ${videoCount} videos...`,
        "info",
      );
    }

    const prepared: { uri: string; name?: string; mimeType?: string }[] = [];
    for (const asset of result.assets) {
      try {
        if (asset.type === "video") {
          const compressedUri = await VideoCompressor.compress(asset.uri, {
            compressionMethod: "manual",
            maxSize: 1280, // long edge → ≤720p box (matches min_fit)
            bitrate: 2_500_000, // ~web/mp4/720p target bitrate
          });
          prepared.push({
            uri: compressedUri,
            name: asset.fileName ?? undefined,
            mimeType: "video/mp4",
          });
        } else {
          prepared.push({
            uri: asset.uri,
            name: asset.fileName ?? undefined,
            mimeType: asset.mimeType ?? undefined,
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Compression failed";
        showToast(`Couldn't process ${asset.fileName ?? "asset"}: ${msg}`, "error");
      }
    }

    if (prepared.length === 0) return;

    const uploaded = await uploadMediaFiles(prepared);
    if (uploaded.length > 0) {
      showToast(
        uploaded.length === 1
          ? "Media uploaded"
          : `${uploaded.length} media items uploaded`,
        "success",
      );
    } else {
      showToast("Upload failed", "error");
    }
  };

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

  // In edit mode, pull the full group payload to hydrate state the
  // calendar/list endpoint can't give us:
  //   - `settings` (per-provider DTO values) — only on /posts/group/:group.
  //   - `posts[].image` (Media row metadata) — also stripped from the
  //     minified calendar payload, so without this fetch the composer would
  //     render with no attachments and the next save would drop them.
  // Posts are arranged parent → children by the backend, so we can rebuild
  // the local thread directly from the response array.
  useEffect(() => {
    if (mode !== "edit") return;
    const group = editingPost?.group;
    const channelId = editingPost?.channelId;
    if (!group || !channelId) {
      // Edit mode with no fetchable group → nothing to hydrate, drop the
      // gate immediately so the composer doesn't render a forever-spinner.
      setEditFetchHydrated(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await apiFetch(
          `/posts/group/${encodeURIComponent(group)}`,
          { method: "GET" },
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          settings?: Record<string, unknown> | string | null;
          posts?: Array<{
            id: string;
            content?: string;
            image?: BackendPostImage[] | string | null;
          }>;
        };
        if (cancelled) return;

        let parsed: Record<string, unknown> | null = null;
        if (typeof data.settings === "string") {
          try {
            parsed = JSON.parse(data.settings);
          } catch {
            parsed = null;
          }
        } else if (data.settings && typeof data.settings === "object") {
          parsed = data.settings as Record<string, unknown>;
        }
        if (parsed) {
          setChannelSettings((prev) => ({ ...prev, [channelId]: parsed! }));
        }

        const backendPosts = Array.isArray(data.posts) ? data.posts : [];
        if (backendPosts.length === 0) return;

        // Pre-populate the meta lookup so a subsequent save round-trips
        // the original Media row ids instead of dropping the attachments.
        setImageMetaByPath((prev) => {
          const next = { ...prev };
          for (const bp of backendPosts) {
            for (const img of parseBackendPostImages(bp.image)) {
              next[img.path] = {
                id: img.id,
                path: img.path,
                alt: img.alt ?? null,
                thumbnail: img.thumbnail ?? null,
                thumbnailTimestamp: img.thumbnailTimestamp ?? null,
              };
            }
          }
          return next;
        });

        // Merge by id rather than replacing the array. The initial render
        // already mounted a PostEditor for the tapped post (keyed on
        // `post.id`); replacing the array creates new object references
        // that — if the id changes (e.g. user tapped a child in a thread)
        // or even if it matches but reordering occurs — flickers the
        // editor (text → blank → reload). Preserving the same id+ref
        // keeps the editor mounted; we only mutate `imageUris` so the
        // attachments strip appears without disturbing the text.
        setPosts((prev) => {
          let changed = prev.length !== backendPosts.length;
          const merged = backendPosts.map((bp) => {
            const imagePaths = parseBackendPostImages(bp.image).map(
              (img) => img.path,
            );
            const existing = prev.find((p) => p.id === bp.id);
            if (existing) {
              const sameImages =
                existing.imageUris.length === imagePaths.length &&
                existing.imageUris.every((u, i) => u === imagePaths[i]);
              if (sameImages) return existing;
              changed = true;
              return { ...existing, imageUris: imagePaths };
            }
            changed = true;
            return makePost(bp.id, bp.content ?? "", imagePaths);
          });
          return changed ? merged : prev;
        });
      } catch {
        // swallow — validation will still surface missing values at submit.
      } finally {
        // Drop the gate even on error so the user isn't stuck on a spinner;
        // they can still type/save, just without the hydrated settings/images.
        if (!cancelled) setEditFetchHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, editingPost?.group, editingPost?.channelId]);

  return (
    <BottomSheetModalProvider>
      <ToastProvider>
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
                } ${submittingAction ? "opacity-80" : ""}`}
                disabled={!canSubmit || submittingAction !== null}
                onPress={() => {
                  if (canSubmit && !submittingAction)
                    setPostActionMenuVisible((current) => !current);
                }}
              >
                {submittingAction ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
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
                  </>
                )}
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
                  {POST_ACTIONS.map((action) => {
                    const isLoading = submittingAction === action.id;
                    const disabled = submittingAction !== null;
                    return (
                      <Pressable
                        key={action.id}
                        className={`mb-3 h-11 items-center justify-center rounded-[8px] ${
                          action.tone === "primary"
                            ? "bg-buttons-primary-bg"
                            : action.tone === "secondary"
                              ? "bg-buttons-secondary-bg"
                              : "bg-buttons-tertiary-bg"
                        } ${action.id === "draft" ? "mb-0" : ""} ${
                          disabled && !isLoading ? "opacity-60" : ""
                        }`}
                        disabled={disabled}
                        onPress={() => handleSave(action.id)}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text className="font-jakarta text-button-2 font-semibold text-white">
                            {action.label}
                          </Text>
                        )}
                      </Pressable>
                    );
                  })}
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
                              {channelForLimit ? (() => {
                                const limit = getChannelLimit(channelForLimit);
                                const limitResolved =
                                  isChannelLimitResolved(channelForLimit);
                                return (
                                  <CharacterLimitPill
                                    totalChars={chPlainText.length}
                                    isPicture={chPost.imageUris.length > 0}
                                    isGlobal={false}
                                    statuses={[
                                      {
                                        channelId: channelForLimit.id,
                                        channelName: channelForLimit.name,
                                        networkLabel: formatNetworkLabel(
                                          channelForLimit.network,
                                        ),
                                        network: channelForLimit.network,
                                        currentLength: chPlainText.length,
                                        limit,
                                        isOverLimit: chPlainText.length > limit,
                                        isInternal: true,
                                        limitResolved,
                                      },
                                    ]}
                                  />
                                );
                              })() : null}
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
                {/*
                  In edit mode, hold the entire posts list back until the
                  group fetch finishes. Mounting PostEditor with the
                  calendar's stale content and then mutating `posts` once
                  the fetch resolves caused the RichEditor WebView to
                  reload and flicker (text → blank → text + images). The
                  loading overlay above stays up until both this gate and
                  the editor's own onReady fire.
                */}
                {editFetchHydrated && posts.map((post, index) => {
                  const plainText = stripEditorHtml(post.content);
                  const plainTextLength = plainText.length;
                  const limitStatuses = buildNetworkLimitStatuses(
                    selectedChannels,
                    plainTextLength,
                    channelOverrides,
                    post.id,
                    getChannelLimit,
                    isChannelLimitResolved,
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
                        {mode === "edit" && selectedChannels[0] ? (() => {
                          const channel = selectedChannels[0];
                          const limit = getChannelLimit(channel);
                          const limitResolved = isChannelLimitResolved(channel);
                          return (
                            <CharacterLimitPill
                              totalChars={plainTextLength}
                              isPicture={post.imageUris.length > 0}
                              isGlobal={false}
                              statuses={[
                                {
                                  channelId: channel.id,
                                  channelName: channel.name,
                                  networkLabel: formatNetworkLabel(
                                    channel.network,
                                  ),
                                  network: channel.network,
                                  currentLength: plainTextLength,
                                  limit,
                                  isOverLimit: plainTextLength > limit,
                                  isInternal: false,
                                  limitResolved,
                                },
                              ]}
                            />
                          );
                        })() : (
                          <CharacterLimitPill
                            totalChars={plainTextLength}
                            isPicture={post.imageUris.length > 0}
                            isGlobal={!focusedChannelId}
                            statuses={limitStatuses}
                          />
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

            {editorsLoading || !editFetchHydrated ? (
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
              onOpenChannelSettings={() => {
                if (selectedChannels.length === 0) {
                  showToast("Select a channel first", "info");
                  return;
                }
                setSettingsSheet(null);
                if (focusedChannelId) {
                  setSettingsChannelId(focusedChannelId);
                  fleetRef.current?.setVisibleChannel(focusedChannelId);
                } else {
                  setSettingsChannelId(null);
                  fleetRef.current?.setVisibleChannels(
                    selectedChannels.map((c) => c.id),
                  );
                }
              }}
              bottomInset={insets.bottom}
            />
          </BottomSheetWrapper>

          <MediaLibrarySheet
            isVisible={mediaLibraryVisible}
            assets={mediaAssets}
            selectedIds={selectedMediaIds}
            loading={mediaLoading}
            uploading={mediaUploading}
            pages={mediaPages}
            currentPage={mediaCurrentPage}
            search={mediaSearch}
            onSearchChange={(next) => {
              setMediaSearch(next);
              void fetchMediaAssets(0, next);
            }}
            onPageChange={(page) => {
              void setMediaPage(page);
            }}
            onClose={() => {
              setMediaLibraryVisible(false);
              setSelectedMediaIds([]);
            }}
            onUpload={handlePickImages}
            onToggleSelect={handleToggleMediaSelection}
            onDeleteSelected={handleDeleteSelectedMedia}
            onAddSelected={handleAddSelectedMedia}
          />

          <RepublishChoiceDialog
            visible={republishVisible}
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

          <MediaSettingsModal
            isVisible={mediaSettingsTarget !== null}
            onClose={() => setMediaSettingsTarget(null)}
            initialAltText={mediaSettingsTarget?.altText ?? ""}
            onSave={(value) => {
              setMediaSettingsTarget((current) =>
                current ? { ...current, altText: value } : current,
              );
              // Persist the alt text into the meta lookup so handleSave
              // emits it on the create-post payload (matches the web's
              // value.media[].alt field).
              const uri = mediaSettingsTarget?.uri;
              if (!uri) return;
              setImageMetaByPath((prev) => {
                const existing = prev[uri];
                if (!existing) return prev;
                return { ...prev, [uri]: { ...existing, alt: value } };
              });
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

          <SettingsWebViewFleet
            ref={fleetRef}
            channels={selectedChannels.map((c) => ({
              id: c.id,
              network: c.network,
              name: c.name,
              avatar: c.avatar,
            }))}
            initialValuesByChannel={channelSettings}
            integrationsByChannel={integrationsByChannel}
            // In edit mode, hold panel mounts until the group fetch has
            // populated channelSettings — otherwise WebViews mount with
            // an empty seed and react-hook-form's `register('field', {
            // value })` calls (e.g. ThreadFinisher) freeze the wrong
            // default in place even after the seeded re-mount.
            ready={editFetchHydrated}
            editMode={mode === "edit"}
            onChannelReady={handleChannelReady}
            postsByChannel={Object.fromEntries(
              selectedChannels.map((c) => {
                const channelPosts = channelOverrides[c.id] ?? posts;
                return [
                  c.id,
                  channelPosts.map((p) =>
                    p.imageUris.map((uri) => ({ path: uri })),
                  ),
                ];
              }),
            )}
            onSave={(channelId, value) => {
              setChannelSettings((prev) => ({ ...prev, [channelId]: value }));
              setSettingsErrorsByChannel((prev) => {
                const next = { ...prev };
                delete next[channelId];
                return next;
              });
              setSettingsChannelId(null);
              showToast("Settings saved.", "success");
            }}
            onClose={() => setSettingsChannelId(null)}
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
      </ToastProvider>
    </BottomSheetModalProvider>
  );
}
