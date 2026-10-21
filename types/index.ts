/**
 * The raw `providerIdentifier` value from the backend (e.g. "x",
 * "linkedin", "gmb", "wordpress"). Intentionally typed as `string` —
 * the mobile app does not maintain its own enum of supported networks
 * so a new backend provider works without redeploying the app. The
 * matching icon is fetched from `${FRONTEND_URL}/icons/platforms/${id}.png`
 * (same convention as the web frontend).
 */
export type ChannelNetwork = string;

export type Channel = {
  id: string;
  name: string;
  network: ChannelNetwork;
  avatar: string;
  /**
   * Raw `additionalSettings` JSON string from the backend integration row.
   * Forwarded to provider WebViews so per-account character limits and
   * checkValidity rules (e.g. X "Verified") resolve to the right value.
   */
  additionalSettings?: string;
};

export type NotificationItem = {
  id: string;
  social: ChannelNetwork;
  avatar: string;
  networkLabel: string;
  link: string;
  url?: string;
  date: string;
  time: string;
  unread?: boolean;
};

export type ChartSpec = {
  data: { value: number }[];
  color: string;
};

// --- Calendar / Scheduled Post types ---

export type PostStatus = "scheduled" | "published" | "draft";

export type PostCategory = "Personal" | "Business" | "Marketing" | "Social";

export type ScheduledPost = {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  scheduledAt: string; // ISO 8601
  channelId: string;
  network: ChannelNetwork;
  authorName: string;
  authorAvatar: string;
  status: PostStatus;
  imageUri?: string;
  tagLabel?: string;
  tagColor?: string;
  /** Backend `group` id — required when deleting via DELETE /posts/:group. */
  group?: string;
  /**
   * Repeat interval in days, persisted as the backend `intervalInDays`
   * column. Null when the post doesn't repeat. Used in edit mode to
   * pre-select the right entry in the Repeat Post picker.
   */
  intervalInDays?: number | null;
  composerPosts?: {
    id: string;
    content: string;
    imageUris: string[];
    /**
     * Backend metadata for each attachment (Media row id, alt text, etc.).
     * Parallel to `imageUris` — the mobile composer keeps URI strings
     * locally but needs the full row to round-trip back to the server.
     */
    images?: {
      id: string;
      path: string;
      alt?: string | null;
      thumbnail?: string | null;
      thumbnailTimestamp?: number | null;
    }[];
  }[];
  /**
   * Raw HTML from the backend. `content` is the stripped plain-text preview
   * used by the calendar/list; `contentHtml` is what the tiptap/rich editor
   * needs to round-trip formatting when editing an existing post.
   */
  contentHtml?: string;
  /** Per-provider settings saved on the backend (shape = provider DTO). */
  settings?: Record<string, unknown>;
};

export type TimeSlot = {
  hour: number; // 0-23
  label: string; // "9:00 am"
};

export type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasEvents: boolean;
};
