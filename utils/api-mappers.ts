import type { Channel, PostStatus, ScheduledPost } from "@/types";

// Mirrors /Users/nevodavid/Projects/gitroom/libraries/helpers/src/utils/posts.list.minify.ts
// so we don't need a cross-package import at runtime.
const POST_LIST_KEYS: Record<string, string> = {
  p: "posts",
  t: "total",
  pg: "page",
  l: "limit",
  hm: "hasMore",
};
const POST_CALENDAR_KEYS: Record<string, string> = { p: "posts" };
const POST_ITEM_KEYS: Record<string, string> = {
  i: "id",
  c: "content",
  d: "publishDate",
  u: "releaseURL",
  ri: "releaseId",
  s: "state",
  g: "group",
  tg: "tags",
  n: "integration",
  iv: "intervalInDays",
  ad: "actualDate",
};
const INTEGRATION_KEYS: Record<string, string> = {
  i: "id",
  pi: "providerIdentifier",
  n: "name",
  p: "picture",
};
const TAG_KEYS: Record<string, string> = { t: "tag" };
const TAG_INNER_KEYS: Record<string, string> = {
  i: "id",
  n: "name",
  c: "color",
  o: "orgId",
  ca: "createdAt",
  ua: "updatedAt",
  da: "deletedAt",
};

const mapKeys = (obj: Record<string, unknown>, keyMap: Record<string, string>) => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[keyMap[key] ?? key] = value;
  }
  return result;
};

const expandPostItem = (post: Record<string, unknown>): Record<string, unknown> => {
  const expanded = mapKeys(post, POST_ITEM_KEYS);
  if (expanded.integration && typeof expanded.integration === "object") {
    expanded.integration = mapKeys(
      expanded.integration as Record<string, unknown>,
      INTEGRATION_KEYS,
    );
  }
  if (Array.isArray(expanded.tags)) {
    expanded.tags = expanded.tags.map((wrapper: Record<string, unknown>) => {
      const expandedWrapper = mapKeys(wrapper, TAG_KEYS);
      if (expandedWrapper.tag && typeof expandedWrapper.tag === "object") {
        expandedWrapper.tag = mapKeys(
          expandedWrapper.tag as Record<string, unknown>,
          TAG_INNER_KEYS,
        );
      }
      return expandedWrapper;
    });
  }
  return expanded;
};

export const expandPosts = (data: Record<string, unknown>) => {
  const expanded = mapKeys(data, POST_CALENDAR_KEYS) as { posts?: unknown[] };
  const posts = Array.isArray(expanded.posts) ? expanded.posts : [];
  return { posts: posts.map((p) => expandPostItem(p as Record<string, unknown>)) };
};

export const expandPostsList = (data: Record<string, unknown>) => {
  const expanded = mapKeys(data, POST_LIST_KEYS) as {
    posts?: unknown[];
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
  const posts = Array.isArray(expanded.posts) ? expanded.posts : [];
  return {
    posts: posts.map((p) => expandPostItem(p as Record<string, unknown>)),
    total: expanded.total ?? 0,
    page: expanded.page ?? 0,
    limit: expanded.limit ?? 0,
    hasMore: expanded.hasMore ?? false,
  };
};

// --- Backend → mobile shape ---

const stateToStatus = (state: string | undefined): PostStatus => {
  switch (state) {
    case "PUBLISHED":
      return "published";
    case "DRAFT":
      return "draft";
    case "QUEUE":
    case "ERROR":
    default:
      return "scheduled";
  }
};

const stripHtml = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

type BackendIntegration = {
  id: string;
  providerIdentifier?: string;
  identifier?: string;
  name?: string;
  picture?: string | null;
  disabled?: boolean;
  refreshNeeded?: boolean;
  /**
   * Stored as a JSON string on the backend (e.g.
   * '[{"title":"Verified","value":true}]'). Drives per-account behavior in
   * provider rules (X premium chars/video duration, etc.).
   */
  additionalSettings?: string | null;
};

export type BackendPostImage = {
  id: string;
  path: string;
  alt?: string | null;
  thumbnail?: string | null;
  thumbnailTimestamp?: number | null;
};

type BackendPost = {
  id: string;
  content?: string;
  publishDate?: string;
  state?: string;
  group?: string;
  /**
   * Repeat interval in days set on the post (`null` when not repeating).
   * Sent server-side as `body.inter` and persisted as
   * `intervalInDays` (posts.repository.ts:518). Surfaced on read via the
   * minified calendar payload's `iv` key.
   */
  intervalInDays?: number | null;
  integration?: BackendIntegration;
  tags?: { tag?: { name?: string; color?: string } }[];
  /**
   * Provider-specific settings. Backend may serialize this as a JSON string
   * (raw column) or as a parsed object depending on the route — handle both.
   */
  settings?: Record<string, unknown> | string | null;
  /**
   * Attached media. The calendar/list endpoints omit this (minified
   * payload), but `/posts/group/:group` returns it expanded as an array of
   * Media rows. Stored as a JSON string in the DB column, but the API
   * decodes it before returning.
   */
  image?: BackendPostImage[] | string | null;
};

/**
 * Best-effort parse for the `image` field on a backend post. The DB column
 * is JSON serialized but most read paths decode it server-side. Tolerates
 * missing/null/empty/string-encoded values without throwing.
 */
export const parseBackendPostImages = (
  raw: BackendPost["image"],
): BackendPostImage[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (item): item is BackendPostImage =>
        !!item && typeof item === "object" && typeof item.path === "string",
    );
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parseBackendPostImages(parsed) : [];
    } catch {
      return [];
    }
  }
  return [];
};

const parseSettings = (
  raw: BackendPost["settings"],
): Record<string, unknown> | undefined => {
  if (!raw) return undefined;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : undefined;
    } catch {
      return undefined;
    }
  }
  return raw;
};

export const postToScheduled = (post: BackendPost): ScheduledPost => {
  const rawContent = post.content ?? "";
  const contentText = stripHtml(rawContent);
  const integration = post.integration;
  const providerId = integration?.providerIdentifier ?? integration?.identifier;
  const title = contentText.split("\n")[0]?.slice(0, 120) || "Untitled post";
  // Mirror the web calendar (calendar.tsx:1052,1061): join every tag name
  // with `, ` and color the bar with the first tag's color. No tags → no
  // label and no color (the renderer falls back to the brand primary).
  const tagNames = (post.tags ?? [])
    .map((t) => t.tag?.name)
    .filter((name): name is string => !!name);
  const firstTagColor = post.tags?.[0]?.tag?.color;

  return {
    id: post.id,
    title,
    content: contentText,
    contentHtml: rawContent,
    category: "Social",
    scheduledAt: post.publishDate ?? new Date().toISOString(),
    channelId: integration?.id ?? "",
    network: providerId ?? "",
    authorName: integration?.name ?? "Unknown",
    authorAvatar: integration?.picture ?? "",
    status: stateToStatus(post.state),
    tagLabel: tagNames.length > 0 ? tagNames.join(", ") : undefined,
    tagColor: firstTagColor ?? undefined,
    group: post.group,
    intervalInDays: post.intervalInDays ?? null,
    settings: parseSettings(post.settings),
  };
};

export const integrationToChannel = (integration: BackendIntegration): Channel => ({
  id: integration.id,
  name: integration.name ?? "Channel",
  network: integration.providerIdentifier ?? integration.identifier ?? "",
  avatar: integration.picture ?? "",
  additionalSettings: integration.additionalSettings ?? undefined,
});

export type { BackendIntegration, BackendPost };
