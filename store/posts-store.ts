import { create } from "zustand";

import type { ScheduledPost } from "@/types";
import {
  expandPosts,
  integrationToChannel,
  postToScheduled,
  type BackendIntegration,
  type BackendPost,
} from "@/utils/api-mappers";
import { apiFetch } from "@/utils/custom-fetch";
import { parsePostError, type ParsedPostError } from "@/utils/parse-post-errors";

type DateRange = { startDate: Date; endDate: Date } | null;

type PostsState = {
  posts: ScheduledPost[];
  error: string | null;
  loading: boolean;
  /** Set by create-post screen so the calendar navigates to this date/time on return. */
  navigateToDate: string | null;
  /** Range currently cached in `posts`. */
  loadedRange: DateRange;

  fetchPosts: (
    startDate: Date,
    endDate: Date,
    /**
     * Bypass the loadedRange dedupe. Use when the caller wants a fresh
     * network read even though the requested range is already cached
     * (e.g. pull-to-refresh).
     */
    force?: boolean,
  ) => Promise<void>;
  deletePost: (post: ScheduledPost) => Promise<{ ok: boolean; error?: string }>;
  reschedulePost: (
    postId: string,
    newScheduledAt: string,
    /**
     * Mirrors the web calendar drop's `action` field
     * (calendar.tsx:726-732). 'schedule' (default) sets state to QUEUE and
     * re-runs `startWorkflow`; 'update' just changes the date in place
     * without re-triggering the publish pipeline. Caller picks based on
     * the post's current state — see RepublishChoiceDialog.
     */
    action?: "schedule" | "update",
  ) => Promise<{ ok: boolean; error?: string }>;
  createPost: (input: CreatePostInput) => Promise<CreatePostResult>;
  /** Insert or update a post locally (used after create-post save). */
  upsertLocalPost: (post: ScheduledPost) => void;
  deletePostsByChannelId: (channelId: string) => void;
  clearError: () => void;
  setNavigateToDate: (iso: string | null) => void;
  reset: () => void;
};

export type CreatePostAction = "schedule" | "draft" | "now" | "update";

/**
 * One attached media item, in the shape the backend expects on
 * `posts[].value[].image[]`. Mirrors the web payload built in
 * manage.modal.tsx:385-394 and the Media row columns the providers read.
 */
export type ComposerImage = {
  id: string;
  path: string;
  alt?: string | null;
  thumbnail?: string | null;
  thumbnailTimestamp?: number | null;
};

/** One entry in a thread of posts for a given channel. */
export type CreatePostValue = {
  /**
   * Backend Post row id, if the entry already exists (edit mode). Omitted
   * for new entries — the backend creates a fresh row. Mirrors the web's
   * `...(value.id ? { id: value.id } : {})` pattern.
   */
  id?: string;
  content: string;
  /** Optional intra-thread delay in seconds. Defaults to 0 server-side. */
  delay?: number;
  /**
   * Attachments resolved against the media library. Each entry must
   * carry a Media row id — providers (X/Bluesky/Instagram/etc.) re-fetch
   * the row server-side before publishing.
   */
  images?: ComposerImage[];
};

export type CreatePostInput = {
  action: CreatePostAction;
  scheduledAt: Date;
  /** Backend `group` id of the post being edited. Required for updates. */
  existingGroup?: string;
  /**
   * Repeat interval in days, sent as `body.inter`. The backend re-queues
   * the post every `inter` days after publish (manage.modal.tsx:371,
   * `...(repeater ? { inter: repeater } : {})`). Omit / `null` for no
   * repeat.
   */
  inter?: number | null;
  channels: {
    integrationId: string;
    /**
     * The thread, in order. Single-post composer = `values.length === 1`;
     * threaded posts (e.g. X reply chain) carry one entry per post.
     */
    values: CreatePostValue[];
    /** Per-provider settings (`__type` is injected by the backend). */
    settings?: Record<string, unknown>;
  }[];
  /**
   * Tag selection sent in the body. Backend matches by `label` (the tag
   * NAME) — `value` is also sent for shape parity with the web composer.
   * Mismatched names are dropped server-side, so the picker should only
   * surface tags returned by /posts/tags (see useTagsStore).
   */
  tags?: { value: string; label: string }[];
};

export type CreatePostResult =
  | { ok: true }
  | { ok: false; error: string; parsed: ParsedPostError };

const toIsoDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const buildCalendarQuery = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  return new URLSearchParams({
    display: "month",
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    customer: "",
  }).toString();
};

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  error: null,
  loading: false,
  navigateToDate: null,
  loadedRange: null,

  fetchPosts: async (startDate, endDate, force = false) => {
    // Dedupe: if the requested range matches what's already loaded, skip
    // the network call. The calendar screen drives this from a useEffect
    // on currentMonth — adjacent renders / strict-mode double-mounts /
    // benign state updates would otherwise refire identical requests.
    // Pull-to-refresh passes force=true to bypass this.
    const existing = get().loadedRange;
    if (
      !force &&
      existing &&
      existing.startDate.getTime() === startDate.getTime() &&
      existing.endDate.getTime() === endDate.getTime()
    ) {
      return;
    }
    set({ loading: true, error: null });
    try {
      const query = buildCalendarQuery(startDate, endDate);
      const response = await apiFetch(`/posts?${query}`, { method: "GET" });
      if (!response.ok) {
        set({
          loading: false,
          error: `Unable to load posts (${response.status})`,
        });
        return;
      }
      const raw = (await response.json()) as Record<string, unknown>;
      const expanded = expandPosts(raw);
      const mapped = expanded.posts.map((p) =>
        postToScheduled(p as unknown as BackendPost),
      );
      set({
        posts: mapped,
        loading: false,
        error: null,
        loadedRange: { startDate, endDate },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      set({ loading: false, error: msg });
    }
  },

  deletePost: async (post) => {
    const group = post.group;
    if (!group) {
      set({ error: "Post is missing a group id; cannot delete." });
      return { ok: false, error: "Missing group id" };
    }
    try {
      const response = await apiFetch(`/posts/${group}`, { method: "DELETE" });
      if (!response.ok) {
        const msg = await response.text().catch(() => "Delete failed");
        return { ok: false, error: msg || "Delete failed" };
      }
      set((state) => ({
        posts: state.posts.filter((p) => p.group !== group),
        error: null,
      }));
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      return { ok: false, error: msg };
    }
  },

  reschedulePost: async (postId, newScheduledAt, action = "schedule") => {
    const current = get().posts.find((p) => p.id === postId);
    if (!current) {
      return { ok: false, error: "Post not found" };
    }
    // Optimistic update
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, scheduledAt: newScheduledAt } : p,
      ),
    }));
    try {
      const response = await apiFetch(`/posts/${postId}/date`, {
        method: "PUT",
        body: JSON.stringify({
          date: new Date(newScheduledAt).toISOString(),
          action,
        }),
      });
      if (!response.ok) {
        // Roll back optimistic update
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, scheduledAt: current.scheduledAt } : p,
          ),
          error: "Reschedule failed",
        }));
        const msg = await response.text().catch(() => "Reschedule failed");
        return { ok: false, error: msg || "Reschedule failed" };
      }
      return { ok: true };
    } catch (e) {
      set((state) => ({
        posts: state.posts.map((p) =>
          p.id === postId ? { ...p, scheduledAt: current.scheduledAt } : p,
        ),
      }));
      const msg = e instanceof Error ? e.message : "Network error";
      return { ok: false, error: msg };
    }
  },

  createPost: async (input) => {
    const { action, scheduledAt, channels, tags, existingGroup, inter } = input;
    if (channels.length === 0) {
      return {
        ok: false,
        error: "At least one channel required",
        parsed: {
          channelErrors: [],
          generalMessage: "At least one channel required",
        },
      };
    }
    try {
      // Always send the user's literal action, even when editing — matches
      // the web composer (manage.modal.tsx:201-244, line `type` in payload).
      // Backend uses `posts[].group` to find the existing post and updates
      // it in place; `type` only controls the new state:
      //   draft → DRAFT, now/schedule → QUEUE (+ startWorkflow), update → no
      //   state change & no workflow trigger.
      // Forcing `update` when editing was breaking edit-mode "Save as Draft"
      // (state stayed QUEUE) and "Post Now" (no immediate publish).
      const body = {
        type: action,
        date: scheduledAt.toISOString(),
        shortLink: false,
        ...(inter ? { inter } : {}),
        posts: channels.map((c) => ({
          integration: { id: c.integrationId },
          // PostContent in CreatePostDto requires `image` (array) and
          // `settings` (object; backend fills `__type` via mapTypeToPost).
          // One value entry per thread post — matches the web's
          // `value: post.values.map(...)` in manage.modal.tsx:381-394.
          value: c.values.map((v) => ({
            ...(v.id ? { id: v.id } : {}),
            content: v.content,
            delay: v.delay ?? 0,
            image: (v.images ?? []).map(
              ({ id, path, alt, thumbnail, thumbnailTimestamp }) => ({
                id,
                path,
                alt,
                thumbnail,
                thumbnailTimestamp,
              }),
            ),
          })),
          // `group` is the update key — backend matches this against the
          // existing post group and replaces its value in-place.
          ...(existingGroup ? { group: existingGroup } : {}),
          settings: c.settings ?? {},
        })),
        tags: (tags ?? []).map((t) => ({ value: t.value, label: t.label })),
      };
      const response = await apiFetch(`/posts`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const raw = await response.text().catch(() => "");
        const parsed = parsePostError(response.status, raw);
        const firstError =
          parsed.channelErrors[0]?.messages[0] ??
          parsed.generalMessage ??
          "Create failed";
        return { ok: false, error: firstError, parsed };
      }
      // Refetch the current range so the new post appears. Capture the
      // range FIRST, then clear loadedRange so fetchPosts' dedupe
      // doesn't short-circuit (which was leaving the in-memory posts
      // stale — `editingPost` was the pre-save object on re-open).
      const range = get().loadedRange;
      set({ loadedRange: null });
      if (range) await get().fetchPosts(range.startDate, range.endDate);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      return {
        ok: false,
        error: msg,
        parsed: { channelErrors: [], generalMessage: msg },
      };
    }
  },

  upsertLocalPost: (post) => {
    set((state) => {
      const idx = state.posts.findIndex((p) => p.id === post.id);
      if (idx === -1) return { posts: [...state.posts, post], error: null };
      const next = state.posts.slice();
      next[idx] = post;
      return { posts: next, error: null };
    });
  },

  deletePostsByChannelId: (channelId) => {
    set((state) => ({
      posts: state.posts.filter((p) => p.channelId !== channelId),
    }));
  },

  clearError: () => set({ error: null }),
  setNavigateToDate: (iso) => set({ navigateToDate: iso }),
  reset: () =>
    set({
      posts: [],
      error: null,
      loading: false,
      navigateToDate: null,
      loadedRange: null,
    }),
}));

// Channels fetch (kept here for convenience so both screens can reuse the
// raw integrations response without re-fetching; channels-store also calls it).
export const fetchIntegrations = async (): Promise<BackendIntegration[]> => {
  const response = await apiFetch("/integrations/list", { method: "GET" });
  if (!response.ok) return [];
  const data = (await response.json().catch(() => ({}))) as {
    integrations?: BackendIntegration[];
  };
  return data.integrations ?? [];
};

export { integrationToChannel };
