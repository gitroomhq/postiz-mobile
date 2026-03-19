import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format, parseISO } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { DateTimePickerSheet } from "@/components/calendar/datetime-picker-sheet";
import { Image } from "@/components/ui/image";
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
  imageUris: string[];
};

type MediaSheetState = "empty" | "loading" | "library";

type SettingsSheet = "main" | "network" | "tags" | "new-tag" | null;

type ComposerTag = {
  id: string;
  label: string;
  color: string;
  selected: boolean;
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

const REPEAT_OPTIONS = [
  "Day",
  "Two Days",
  "Three Days",
  "Four Days",
  "Five Days",
  "Six Days",
  "Week",
  "Two Weeks",
  "Month",
] as const;

const TAG_COLOR_OPTIONS = ["#5D5FFF", "#E323E0", "#3023E3", "#E89623"] as const;

const DELAY_OPTIONS = ["Immediately", "After 5 minutes", "After 15 minutes"] as const;

const MEDIA_LIBRARY_ASSETS = [
  { id: "media-1", uri: "https://picsum.photos/seed/postiz-media-1/720/720" },
  { id: "media-2", uri: "https://picsum.photos/seed/postiz-media-2/720/720" },
  { id: "media-3", uri: "https://picsum.photos/seed/postiz-media-3/720/720" },
  { id: "media-4", uri: "https://picsum.photos/seed/postiz-media-4/720/720" },
  { id: "media-5", uri: "https://picsum.photos/seed/postiz-media-5/720/720" },
  { id: "media-6", uri: "https://picsum.photos/seed/postiz-media-6/720/720" },
] as const;

const INITIAL_TAGS: ComposerTag[] = [
  { id: "personal", label: "Personal", color: "#5D5FFF", selected: false },
  { id: "important", label: "Important", color: "#E323E0", selected: false },
  { id: "general", label: "General", color: "#3023E3", selected: false },
];

function makePost(id: string, content: string, imageUris: string[] = []): ComposerPost {
  return { id, content, imageUris };
}

function formatNetworkLabel(network: ChannelNetwork) {
  if (network === "x") return "X";
  if (network === "linkedin" || network === "linkedin-page") return "LinkedIn";
  if (network === "instagram" || network === "instagram-business") return "Instagram";
  if (network === "google-business") return "Google Business";

  return network
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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
          className="text-white"
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

function ToggleSwitch({
  value,
  onPress,
}: {
  value: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`h-5 w-9 rounded-full px-[2px] ${value ? "bg-main-accent-purple" : "bg-[#3C3C3C]"}`}
      onPress={onPress}
    >
      <View
        className={`mt-[2px] h-4 w-4 rounded-full bg-white ${value ? "ml-4" : "ml-0"}`}
      />
    </Pressable>
  );
}

function CheckBox({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      className={`h-5 w-5 items-center justify-center rounded-[6px] border ${
        checked
          ? "border-main-accent-purple bg-main-accent-purple"
          : "border-[#3F3E3E] bg-background-primary"
      }`}
      onPress={onPress}
    >
      {checked ? <Ionicons name="checkmark" size={14} className="text-white" /> : null}
    </Pressable>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  destructive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      className="flex-row items-center gap-3 py-2"
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        className={destructive ? "text-text-critical" : "text-icon-muted"}
      />
      <View className="flex-1 flex-row items-center justify-between">
        <Text
          className={`font-jakarta text-h4 font-semibold ${
            destructive ? "text-text-critical" : "text-text-primary"
          }`}
        >
          {label}
        </Text>
        {!destructive ? (
          <Ionicons name="chevron-forward" size={18} className="text-icon-muted" />
        ) : null}
      </View>
    </Pressable>
  );
}

function DropUpSelect({
  value,
  options,
  onSelect,
}: {
  value: string;
  options: readonly string[];
  onSelect: (option: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<View>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, w: 0 });

  const handleOpen = () => {
    triggerRef.current?.measureInWindow((x, y, width) => {
      setPos({ x, y, w: width });
      setOpen(true);
    });
  };

  return (
    <View>
      <View ref={triggerRef}>
        <Pressable
          className="h-[52px] flex-row items-center justify-between rounded-[10px] border border-input-stroke-default bg-background-primary px-4"
          onPress={() => (open ? setOpen(false) : handleOpen())}
        >
          <Text className="font-jakarta text-body-1 text-text-primary">
            {value}
          </Text>
          <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} className="text-icon-muted" />
        </Pressable>
      </View>

      <RNModal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setOpen(false)}
        >
          <View
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y - 128 - 8,
              width: pos.w,
              maxHeight: 128,
              borderRadius: 12,
              backgroundColor: "#242323",
              padding: 8,
              elevation: 10,
            }}
            onStartShouldSetResponder={() => true}
          >
            <ScrollView bounces={false} nestedScrollEnabled showsVerticalScrollIndicator>
              {options.map((option) => (
                <Pressable
                  key={option}
                  className={`rounded-[8px] px-3 py-[10px] ${option === value ? "bg-channel-active-bg" : ""}`}
                  onPress={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                >
                  <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
                    {option}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </RNModal>
    </View>
  );
}

function TagBadge({ label, color }: { label: string; color: string }) {
  return (
    <View
      className="self-start rounded-[6px] px-3 pb-[6px] pt-1"
      style={{ backgroundColor: color }}
    >
      <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
        {label}
      </Text>
    </View>
  );
}

function MediaMenu({
  onSelect,
}: {
  onSelect: (toolId: string) => void;
}) {
  return (
    <View className="absolute bottom-[68px] left-4 z-30 w-[206px] rounded-[12px] bg-main-menu-bg p-3 shadow-[0px_8px_30px_rgba(0,0,0,0.5)]">
      {MEDIA_TOOLS.map((tool) => (
        <Pressable
          key={tool.id}
          className="mb-2 flex-row items-center gap-3 rounded-[10px] px-3 py-3 last:mb-0"
          onPress={() => onSelect(tool.id)}
        >
          <SvgIcon source={tool.icon} size={20} />
          <Text className="font-jakarta text-body-1 text-text-primary">
            {tool.id === "insert"
              ? "Insert Media"
              : tool.id === "design"
                ? "Design Media"
                : tool.id === "ai-image"
                  ? "AI Image"
                  : "AI Video"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function MediaTile({
  uri,
  selectedIndex,
  onPress,
}: {
  uri: string;
  selectedIndex: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="mb-3"
      style={{ width: "48.2%", aspectRatio: 1 }}
      onPress={onPress}
    >
      <View className={`h-full w-full overflow-hidden rounded-[8px] ${selectedIndex >= 0 ? "border-[3px] border-buttons-primary-bg" : ""}`}>
        <Image source={{ uri }} className="h-full w-full" contentFit="cover" />
      </View>
      {selectedIndex >= 0 ? (
        <View className="absolute -bottom-2 -right-2 h-7 w-7 items-center justify-center rounded-full bg-buttons-primary-bg">
          <Text className="font-jakarta text-[13px] font-semibold text-white">
            {selectedIndex + 1}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function MediaLibrarySheet({
  isVisible,
  state,
  assets,
  selectedIds,
  onClose,
  onUpload,
  onToggleSelect,
  onDeleteSelected,
  onAddSelected,
}: {
  isVisible: boolean;
  state: MediaSheetState;
  assets: readonly { id: string; uri: string }[];
  selectedIds: string[];
  onClose: () => void;
  onUpload: () => void;
  onToggleSelect: (id: string) => void;
  onDeleteSelected: () => void;
  onAddSelected: () => void;
}) {
  const selectedCount = selectedIds.length;

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      showHandle={false}
      containerStyle={{
        backgroundColor: "#1A1919",
        paddingHorizontal: 0,
        paddingTop: 0,
      }}
    >
      <View className="bg-main-sections">
        <View className="flex-row items-center justify-between px-4 py-5">
          <Text className="font-jakarta text-h2 font-semibold text-text-primary">
            Media Library
          </Text>
          <Pressable className="h-8 w-8 items-center justify-center" onPress={onClose}>
            <Ionicons name="close" size={20} className="text-icon-primary" />
          </Pressable>
        </View>

        {state === "empty" ? (
          <View className="flex-1 items-center justify-center px-9 pb-10">
            <View className="mb-8 h-[140px] w-[180px] items-center justify-center">
              <View className="absolute h-[92px] w-[92px] rounded-[24px] border-2 border-main-accent-pink" />
              <View className="absolute left-6 top-[42px] h-14 w-14 rotate-[-16deg] items-center justify-center rounded-[18px] bg-main-sections-2">
                <Ionicons name="images-outline" size={26} className="text-icon-secondary" />
              </View>
              <View className="absolute top-[58px] h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-[#2C2B2B]">
                <Ionicons name="image-outline" size={34} className="text-[#8D8B8B]" />
              </View>
            </View>

            <Text className="text-center font-jakarta text-h1 font-semibold text-text-primary">
              You don&apos;t have any assets yet
            </Text>
            <Text className="mt-2 text-center font-jakarta text-body-1 text-text-secondary">
              Click the button below to upload one.
            </Text>

            <Pressable
              className="mt-8 h-11 w-full items-center justify-center rounded-[8px] bg-buttons-primary-bg"
              onPress={onUpload}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="add" size={18} className="text-white" />
                <Text className="font-jakarta text-button font-semibold text-white">
                  Upload
                </Text>
              </View>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="px-4 pb-4">
              <Text className="font-jakarta text-body-1 font-semibold text-text-primary">
                Select or upload pictures (maximum 5 at a time).
              </Text>
            </View>

            {state === "loading" ? (
              <View className="flex-row items-center justify-center gap-3 pb-6">
                <ActivityIndicator size="large" color="#F6C744" />
                <Text className="font-jakarta text-h4 font-semibold text-text-primary">
                  Encoding...
                </Text>
              </View>
            ) : selectedCount > 0 ? (
              <View className="flex-row items-center justify-center gap-2 pb-6">
                <Ionicons name="trash-outline" size={18} className="text-text-critical" />
                <Pressable onPress={onDeleteSelected}>
                  <Text className="font-jakarta text-h4 font-semibold text-text-critical">
                    Delete Selected
                  </Text>
                </Pressable>
              </View>
            ) : null}

            <ScrollView
              style={{ maxHeight: 360 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            >
              <View className="flex-row flex-wrap justify-between">
                {assets.map((asset) => (
                  <MediaTile
                    key={asset.id}
                    uri={asset.uri}
                    selectedIndex={selectedIds.indexOf(asset.id)}
                    onPress={() => onToggleSelect(asset.id)}
                  />
                ))}
              </View>
            </ScrollView>

            <View className="gap-3 px-4 pb-3 pt-3">
              <Pressable
                className={`h-11 items-center justify-center rounded-[8px] ${
                  state === "loading" ? "bg-buttons-disabled-bg" : "bg-buttons-tertiary-bg"
                }`}
                disabled={state === "loading"}
                onPress={onUpload}
              >
                <View className="flex-row items-center gap-2">
                  <Ionicons
                    name="add"
                    size={18}
                    className={state === "loading" ? "text-buttons-disabled-text" : "text-white"}
                  />
                  <Text
                    className={`font-jakarta text-button font-semibold ${
                      state === "loading" ? "text-buttons-disabled-text" : "text-white"
                    }`}
                  >
                    Upload
                  </Text>
                </View>
              </Pressable>

              <Pressable
                className={`h-11 items-center justify-center rounded-[8px] ${
                  selectedCount > 0 ? "bg-buttons-primary-bg" : "bg-buttons-disabled-bg"
                }`}
                disabled={selectedCount === 0}
                onPress={onAddSelected}
              >
                <Text
                  className={`font-jakarta text-button font-semibold ${
                    selectedCount > 0 ? "text-white" : "text-buttons-disabled-text"
                  }`}
                >
                  Add Selected Media
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </BottomSheetWrapper>
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
    makePost("post-1", initialContent, initialImageUri ? [initialImageUri] : []),
  ]);
  const [scheduledDate, setScheduledDate] = useState(initialDate);
  const [activeMediaTool, setActiveMediaTool] = useState("insert");
  const [mediaMenuVisible, setMediaMenuVisible] = useState(false);
  const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false);
  const [mediaSheetState, setMediaSheetState] = useState<MediaSheetState>("empty");
  const [mediaAssets, setMediaAssets] = useState<{ id: string; uri: string }[]>([]);
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
  const [focusedChannelId, setFocusedChannelId] = useState<string | null>(selectedChannelIds[0] ?? null);
  const [networkCarouselEnabled, setNetworkCarouselEnabled] = useState(false);
  const [networkRepostersEnabled, setNetworkRepostersEnabled] = useState(true);
  const [networkDelay, setNetworkDelay] = useState("Immediately");
  const [repeatPostValue, setRepeatPostValue] =
    useState<(typeof REPEAT_OPTIONS)[number]>("Day");
  const [tags, setTags] = useState<ComposerTag[]>(INITIAL_TAGS);
  const [newTagName, setNewTagName] = useState("New");
  const [newTagColor, setNewTagColor] = useState<(typeof TAG_COLOR_OPTIONS)[number]>("#E89623");

  const dateLabel = format(scheduledDate, "MMM d, h:mm a")
    .replace(/ AM$/, " am")
    .replace(/ PM$/, " pm");

  const selectedChannels = useMemo(
    () => channels.filter((channel) => selectedChannelIds.includes(channel.id)),
    [channels, selectedChannelIds],
  );

  const canSubmit = selectedChannels.length > 0 && posts.some((post) => post.content.trim().length > 0);
  const focusedChannel =
    selectedChannels.find((channel) => channel.id === focusedChannelId) ??
    selectedChannels[0] ??
    null;
  const selectedTagCount = tags.filter((tag) => tag.selected).length;
  const networkSettingsTitle = focusedChannel
    ? `${formatNetworkLabel(focusedChannel.network)} Settings`
    : "Channel Settings";
  const isEmptyState =
    mode === "create" &&
    posts.length === 1 &&
    !posts[0]?.content.trim() &&
    !posts[0]?.imageUris.length &&
    selectedChannels.length === 0;

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
      if (!post.content.trim()) continue;

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

  useEffect(() => {
    if (!canSubmit && postActionMenuVisible) {
      setPostActionMenuVisible(false);
    }
  }, [canSubmit, postActionMenuVisible]);

  useEffect(() => {
    if (mediaSheetState !== "loading") {
      return;
    }

    const timeout = setTimeout(() => {
      setMediaAssets(MEDIA_LIBRARY_ASSETS.map((asset) => ({ ...asset })));
      setMediaSheetState("library");
      showToast("Media uploaded", "success");
    }, 1400);

    return () => clearTimeout(timeout);
  }, [mediaSheetState]);

  useEffect(() => {
    if (
      focusedChannelId &&
      selectedChannels.some((channel) => channel.id === focusedChannelId)
    ) {
      return;
    }

    setFocusedChannelId(selectedChannels[0]?.id ?? null);
  }, [focusedChannelId, selectedChannels]);

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

  const closeSettingsFlow = () => {
    setSettingsSheet(null);
  };

  const openMediaLibrary = () => {
    setMediaMenuVisible(false);
    setMediaLibraryVisible(true);
    setSelectedMediaIds([]);
    setMediaSheetState(mediaAssets.length > 0 ? "library" : "empty");
  };

  const triggerMediaUpload = () => {
    setMediaSheetState("loading");
  };

  const handleMediaToolPress = (toolId: string) => {
    if (toolId === "insert") {
      setActiveMediaTool(toolId);
      setMediaMenuVisible(false);
      openMediaLibrary();
    }
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

    if (selectedUris.length === 0) {
      return;
    }

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
    setPosts((current) => {
      if (current.length > 1) {
        return current.slice(0, -1);
      }

      const [first] = current;
      if (!first) {
      return current;
    }

      return [{ ...first, content: "", imageUris: [] }];
    });
    setExpandedLimitPostId(null);
    setSettingsSheet(null);
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

  const activeColorIndex = Math.max(TAG_COLOR_OPTIONS.indexOf(newTagColor), 0);

  const renderSettingsSheet = () => {
    if (!settingsSheet) {
      return null;
    }

    if (settingsSheet === "main") {
      return (
        <View>
          <View className="px-4 pb-3 pt-1">
            <Text className="font-jakarta text-h2 font-semibold text-text-primary">
              Settings
            </Text>
          </View>

          <View className="gap-5 px-4 pb-6 pt-4">
            <SettingsRow
              icon="settings-outline"
              label={networkSettingsTitle}
              onPress={() => setSettingsSheet("network")}
            />
            <SettingsRow
              icon="pricetag-outline"
              label="Add Tag"
              onPress={() => setSettingsSheet("tags")}
            />

            <View className="gap-2">
              <View className="flex-row items-center gap-3 py-2">
                <Ionicons name="repeat-outline" size={22} className="text-icon-muted" />
                <Text className="font-jakarta text-h4 font-semibold text-text-primary">
                  Repeat Post Every...
                </Text>
              </View>
              <DropUpSelect
                value={repeatPostValue}
                options={REPEAT_OPTIONS}
                onSelect={(option) => setRepeatPostValue(option as (typeof REPEAT_OPTIONS)[number])}
              />
            </View>

            <SettingsRow
              icon="trash-outline"
              label="Delete Post"
              destructive
              onPress={handleDeleteComposerPost}
            />
          </View>
        </View>
      );
    }

    if (settingsSheet === "network") {
      return (
        <View>
          <View className="px-4 pb-3 pt-1">
            <Text className="font-jakarta text-h2 font-semibold text-text-primary">
              {networkSettingsTitle}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="px-4 pt-4 pb-5"
          >
            <View className="gap-5">
              <View className="flex-row items-center gap-2 py-2">
                <CheckBox checked={networkCarouselEnabled} onPress={() => setNetworkCarouselEnabled((current) => !current)} />
                <Text className="font-jakarta text-body-1 text-text-primary">
                  Post as image carousel
                </Text>
              </View>

              <View className="border-t border-input-stroke-default pt-4">
                <View className="flex-row items-start justify-between">
                  <Text className="font-jakarta text-body-1 text-text-primary">
                    Add Re-posters
                  </Text>
                  <ToggleSwitch
                    value={networkRepostersEnabled}
                    onPress={() => setNetworkRepostersEnabled((current) => !current)}
                  />
                </View>

                {networkRepostersEnabled ? (
                  <View className="mt-4 gap-4">
                    <View className="gap-2">
                      <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
                        Delay
                      </Text>
                      <DropUpSelect
                        value={networkDelay}
                        options={DELAY_OPTIONS}
                        onSelect={setNetworkDelay}
                      />
                    </View>

                    <View className="gap-3">
                      <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
                        Account that will engage
                      </Text>
                      {focusedChannel ? (
                        <ChannelAvatar
                          avatar={focusedChannel.avatar}
                          network={focusedChannel.network}
                          size={42}
                        />
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          <View className="px-4 pt-3" style={{ paddingBottom: Math.max(bottom, 34) }}>
            <Pressable
              className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
              onPress={() => setSettingsSheet("main")}
            >
              <Text className="font-jakarta text-button font-semibold text-white">
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    if (settingsSheet === "tags") {
      return (
        <View>
          <View className="px-4 pb-3 pt-1">
            <Text className="font-jakarta text-h2 font-semibold text-text-primary">
              Add Tag
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerClassName="gap-6 px-4 pb-4 pt-4"
            style={{ maxHeight: 300 }}
          >
            {tags.map((tag) => (
              <View key={tag.id} className="flex-row items-center justify-between">
                <TagBadge label={tag.label} color={tag.color} />
                <CheckBox checked={tag.selected} onPress={() => toggleTag(tag.id)} />
              </View>
            ))}
          </ScrollView>

          <View className="gap-3 px-4 pt-1" style={{ paddingBottom: Math.max(bottom, 34) }}>
            <Pressable
              className="h-11 flex-row items-center justify-center gap-2 rounded-[8px] bg-buttons-secondary-bg"
              onPress={openNewTagSheet}
            >
              <Ionicons name="add" size={18} className="text-white" />
              <Text className="font-jakarta text-button font-semibold text-white">
                Add New Tag
              </Text>
            </Pressable>

            <Pressable
              className={`h-11 items-center justify-center rounded-[8px] ${
                selectedTagCount > 0 ? "bg-buttons-primary-bg" : "bg-buttons-disabled-bg"
              }`}
              disabled={selectedTagCount === 0}
              onPress={() => setSettingsSheet("main")}
            >
              <Text
                className={`font-jakarta text-button font-semibold ${
                  selectedTagCount > 0 ? "text-white" : "text-buttons-disabled-text"
                }`}
              >
                Done
              </Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-4 py-5">
          <Text className="font-jakarta text-h2 font-semibold text-text-primary">
            New Tag
          </Text>
          <Pressable
            className="h-8 w-8 items-center justify-center"
            onPress={() => setSettingsSheet("tags")}
          >
            <Ionicons name="close" size={20} className="text-icon-muted" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-4 pb-4"
        >
          <View className="gap-5">
            <View className="gap-2">
              <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
                Name
              </Text>
              <TextInput
                className="h-[52px] rounded-[10px] border border-input-stroke-default bg-background-primary px-4 font-jakarta text-body-1 text-text-primary"
                placeholder="New"
                placeholderTextColor="#8D8B8B"
                value={newTagName}
                onChangeText={setNewTagName}
              />
            </View>

            <View className="gap-3">
              <Text className="font-jakarta text-body-2 font-semibold text-text-primary">
                Color
              </Text>

              <View className="gap-5">
                <View className="overflow-hidden rounded-[10px] border border-white/[0.08]">
                  <LinearGradient
                    colors={["#FFFFFF", newTagColor]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-[255px]"
                  >
                    <LinearGradient
                      colors={["transparent", "#000000"]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                      className="flex-1"
                    />
                    <View
                      className="absolute right-[22px] top-4 h-[34px] w-[34px] rounded-full border-4 border-white"
                      style={{ backgroundColor: newTagColor }}
                    />
                  </LinearGradient>
                </View>

                <View>
                  <LinearGradient
                    colors={["#FF3B30", "#FFCC00", "#34C759", "#00C7FF", "#345BFF", "#D100FF", "#FF2D55"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    className="h-[14px] rounded-full"
                  />
                  <View
                    className="absolute -top-[6px] h-7 w-7 rounded-full border-[6px] border-white"
                    style={{
                      left: `${(activeColorIndex / Math.max(TAG_COLOR_OPTIONS.length - 1, 1)) * 100}%`,
                      marginLeft: -14,
                      backgroundColor: newTagColor,
                    }}
                  />
                </View>

                <View className="flex-row items-center gap-3">
                  <View
                    className="h-6 w-6 rounded-[5px]"
                    style={{ backgroundColor: newTagColor }}
                  />
                  <Text className="font-jakarta text-h4 font-semibold text-text-primary">
                    {newTagColor}
                  </Text>
                </View>

                <View className="flex-row items-center gap-3">
                  {TAG_COLOR_OPTIONS.map((color) => (
                    <Pressable
                      key={color}
                      className={`h-9 w-9 rounded-full border-2 ${
                        newTagColor === color ? "border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onPress={() => setNewTagColor(color)}
                    />
                  ))}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View className="px-5 pt-3" style={{ paddingBottom: Math.max(bottom, 34) }}>
          <Pressable
            className="h-11 items-center justify-center rounded-[8px] bg-buttons-primary-bg"
            onPress={handleSaveNewTag}
          >
            <Text className="font-jakarta text-button font-semibold text-white">
              Save Tag
            </Text>
          </Pressable>
        </View>
      </View>
    );
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
          contentContainerClassName="px-4 pt-3 pb-[92px]"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-4 flex-row items-center gap-5">
            <View className="relative flex-1">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="items-center gap-1 pr-[58px]"
              >
                <ChannelTab active={!focusedChannelId} onPress={() => setFocusedChannelId(null)}>
                  <SvgIcon source={require("@/assets/icons/create-post/globe-active.svg")} size={24} />
                </ChannelTab>

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

              <LinearGradient
                colors={["#1A1919", "rgba(26,25,25,0)"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                pointerEvents="none"
                className="absolute right-11 top-0 h-11"
                style={{ width: 66 }}
              />

              <View className="absolute right-0 top-0">
                <ChannelTab onPress={() => setChannelSheetVisible(true)}>
                  <SvgIcon source={require("@/assets/icons/create-post/channel-plus.svg")} size={20} />
                </ChannelTab>
              </View>
            </View>

            <Pressable
              className="z-10 h-11 w-11 items-center justify-center rounded-[8px]"
              hitSlop={12}
              onPress={openSettingsSheet}
            >
              <SvgIcon source={require("@/assets/icons/create-post/settings.svg")} size={20} opacity={0.92} />
            </Pressable>
          </View>

          {posts.map((post, index) => {
            const limits = getPostLimits(post.content);
            const hasExceededLimits = limits.some((limit) => limit.exceeded);
            const showLimitDetails = expandedLimitPostId === post.id;
            const hasContent = post.content.trim().length > 0 || post.imageUris.length > 0;

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

                {post.imageUris.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="mb-4 gap-3 pr-4"
                  >
                    {post.imageUris.map((uri, mediaIndex) => (
                      <View key={`${post.id}-${uri}`} className="relative">
                        <Image
                          source={{ uri }}
                          className="h-[60px] w-[60px] rounded-lg"
                          contentFit="cover"
                        />
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
                <Ionicons name="add" size={18} className="text-icon-secondary" />
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <View className="bg-background-primary" style={{ paddingBottom: Math.max(bottom, 8) }}>
          <View className="relative flex-row items-center gap-3 px-4 py-3">
            {mediaMenuVisible ? <MediaMenu onSelect={handleMediaToolPress} /> : null}

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="items-center gap-1 pr-[56px]"
              className="flex-1"
            >
              {MEDIA_TOOLS.map((tool) => {
                const disabled = tool.id !== "insert";
                return (
                  <IconButton
                    key={tool.id}
                    active={!disabled && activeMediaTool === tool.id}
                    onPress={
                      disabled
                        ? undefined
                        : () => {
                            setActiveMediaTool(tool.id);
                            setPostActionMenuVisible(false);
                            setSettingsSheet(null);
                            openMediaLibrary();
                          }
                    }
                  >
                    <View style={disabled ? { opacity: 0.35 } : undefined}>
                      <SvgIcon source={tool.icon} size={20} />
                    </View>
                  </IconButton>
                );
              })}

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
              className="absolute bottom-3 right-[68px] top-3 w-[56px]"
            />

            <Pressable
              className="h-10 w-10 items-center justify-center rounded-[8px] bg-buttons-secondary-bg"
              onPress={addAnotherPost}
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
        isVisible={settingsSheet !== null}
        onClose={closeSettingsFlow}
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
        {renderSettingsSheet()}
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
        onUpload={triggerMediaUpload}
        onToggleSelect={handleToggleMediaSelection}
        onDeleteSelected={handleDeleteSelectedMedia}
        onAddSelected={handleAddSelectedMedia}
      />


      <BottomSheetWrapper
        isVisible={channelSheetVisible}
        onClose={() => setChannelSheetVisible(false)}
        showHandle={false}
        containerStyle={{
          backgroundColor: "#1A1919",
          paddingHorizontal: 0,
          paddingTop: 0,
        }}
      >
        <View className="bg-background-primary">
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
            className="px-4"
            style={{ maxHeight: 360 }}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-4"
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
                      <Ionicons name="checkmark" size={14} className="text-white" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="gap-3 bg-background-primary px-5 pb-3 pt-3">
            <Pressable
              className="h-11 flex-row items-center justify-center gap-2 rounded-[8px] bg-buttons-tertiary-bg"
              onPress={() => showToast("Add channel flow not implemented yet", "success")}
            >
              <Ionicons name="add" size={18} className="text-white" />
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
