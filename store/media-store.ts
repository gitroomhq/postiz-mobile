import { create } from "zustand";

import { apiFetch } from "@/utils/custom-fetch";

/**
 * Mirror of the backend Media row returned by `/media`. The web composer
 * carries the same shape and forwards it into the post payload as
 * `image: [{ id, path, alt, thumbnail, thumbnailTimestamp }]`.
 */
export type MediaAsset = {
  id: string;
  /** Full URL on R2 / object storage. Use as the `<Image>` source uri. */
  path: string;
  /** Original filename, when known. Surfaced as a chip on hover/long-press. */
  originalName?: string | null;
  /** Set for video assets — used as the still preview in the grid. */
  thumbnail?: string | null;
  /** Per-item alt text (optional). */
  alt?: string | null;
  thumbnailTimestamp?: number | null;
  /** Convenience flag derived from `path` ending in mp4. */
  isVideo: boolean;
};

type MediaListResponse = {
  pages: number;
  results: Array<{
    id: string;
    name?: string | null;
    originalName?: string | null;
    path: string;
    thumbnail?: string | null;
    alt?: string | null;
    thumbnailTimestamp?: number | null;
  }>;
};

const isVideoPath = (path: string) => path.toLowerCase().includes("mp4");

const toAsset = (raw: MediaListResponse["results"][number]): MediaAsset => ({
  id: raw.id,
  path: raw.path,
  originalName: raw.originalName ?? null,
  thumbnail: raw.thumbnail ?? null,
  alt: raw.alt ?? null,
  thumbnailTimestamp: raw.thumbnailTimestamp ?? null,
  isVideo: isVideoPath(raw.path),
});

const guessMimeType = (uri: string, fallback = "application/octet-stream") => {
  const lower = uri.split("?")[0].toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".heic") || lower.endsWith(".heif")) return "image/heic";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return fallback;
};

const filenameFromUri = (uri: string, fallback = "upload") => {
  const stripped = uri.split("?")[0].split("#")[0];
  const last = stripped.split("/").pop();
  if (last && last.includes(".")) return last;
  const guessed = guessMimeType(stripped, "");
  const ext = guessed.split("/")[1];
  return ext ? `${fallback}.${ext}` : fallback;
};

export type UploadInput = {
  uri: string;
  name?: string;
  mimeType?: string;
};

type MediaState = {
  assets: MediaAsset[];
  /** 1-based count of total pages reported by the backend. 0 while idle. */
  pages: number;
  /** 0-based current page (matches the web's MediaBox internal counter). */
  currentPage: number;
  search: string;
  loading: boolean;
  uploading: boolean;
  deletingIds: string[];
  error: string | null;

  /** Replace assets with the given page (resets `assets` on success). */
  fetchAssets: (page?: number, search?: string) => Promise<void>;
  setPage: (page: number) => Promise<void>;
  setSearch: (search: string) => void;
  /**
   * Upload a batch of local files to `/media/upload-simple` (one request per
   * file, mirroring the web's per-file Uppy behavior). Refreshes page 0 on
   * success so newest uploads appear at the top.
   */
  uploadFiles: (files: UploadInput[]) => Promise<MediaAsset[]>;
  /** Delete a single asset and drop it from local state on success. */
  deleteAsset: (id: string) => Promise<void>;
  /** Delete a batch in parallel; refreshes the current page when done. */
  deleteAssets: (ids: string[]) => Promise<void>;
  reset: () => void;
};

let pendingFetch: Promise<void> | null = null;

export const useMediaStore = create<MediaState>((set, get) => ({
  assets: [],
  pages: 0,
  currentPage: 0,
  search: "",
  loading: false,
  uploading: false,
  deletingIds: [],
  error: null,

  fetchAssets: async (page, search) => {
    const targetPage = page ?? get().currentPage ?? 0;
    const targetSearch = search ?? get().search ?? "";
    set({ loading: true, error: null, currentPage: targetPage });
    const run = (async () => {
      try {
        const params = new URLSearchParams({ page: String(targetPage + 1) });
        if (targetSearch.trim()) params.set("search", targetSearch.trim());
        const response = await apiFetch(`/media?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Failed to load media (${response.status})`);
        }
        const data = (await response.json()) as MediaListResponse;
        set({
          assets: (data.results ?? []).map(toAsset),
          pages: data.pages ?? 0,
          loading: false,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Network error";
        set({ loading: false, error: msg });
      }
    })();
    pendingFetch = run;
    await run;
    if (pendingFetch === run) pendingFetch = null;
  },

  setPage: async (page) => {
    await get().fetchAssets(page, get().search);
  },

  setSearch: (search) => {
    // Resetting to page 0 mirrors MediaBox's useEffect on debouncedSearch.
    set({ search, currentPage: 0 });
  },

  uploadFiles: async (files) => {
    if (files.length === 0) return [];
    set({ uploading: true, error: null });
    const uploaded: MediaAsset[] = [];
    try {
      for (const file of files) {
        const form = new FormData();
        const name = file.name ?? filenameFromUri(file.uri);
        const mimeType = file.mimeType ?? guessMimeType(file.uri);
        // RN's FormData accepts the {uri, name, type} shape; cast keeps TS
        // happy across web/native FormData typings.
        form.append("file", {
          uri: file.uri,
          name,
          type: mimeType,
        } as unknown as Blob);

        const response = await apiFetch(`/media/upload-simple`, {
          method: "POST",
          body: form,
        });
        if (!response.ok) {
          throw new Error(`Upload failed (${response.status})`);
        }
        const saved = (await response.json()) as MediaListResponse["results"][number];
        uploaded.push(toAsset(saved));
      }

      // Pull the freshest first page so server-side ordering wins (matches
      // MediaBox's `await mutate()` after onUploadSuccess).
      await get().fetchAssets(0, get().search);
      set({ uploading: false });
      return uploaded;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      set({ uploading: false, error: msg });
      return uploaded;
    }
  },

  deleteAsset: async (id) => {
    set((state) => ({ deletingIds: [...state.deletingIds, id], error: null }));
    try {
      const response = await apiFetch(`/media/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(`Delete failed (${response.status})`);
      }
      set((state) => ({
        assets: state.assets.filter((asset) => asset.id !== id),
        deletingIds: state.deletingIds.filter((x) => x !== id),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      set((state) => ({
        deletingIds: state.deletingIds.filter((x) => x !== id),
        error: msg,
      }));
    }
  },

  deleteAssets: async (ids) => {
    if (ids.length === 0) return;
    set((state) => ({
      deletingIds: [...state.deletingIds, ...ids],
      error: null,
    }));
    try {
      await Promise.all(
        ids.map((id) =>
          apiFetch(`/media/${id}`, { method: "DELETE" }).then((r) => {
            if (!r.ok) throw new Error(`Delete failed (${r.status})`);
          }),
        ),
      );
      // Refresh the current page so pagination stays consistent (deleting
      // the last item on a page should not leave us stranded).
      await get().fetchAssets(get().currentPage, get().search);
      set((state) => ({
        deletingIds: state.deletingIds.filter((x) => !ids.includes(x)),
      }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      set((state) => ({
        deletingIds: state.deletingIds.filter((x) => !ids.includes(x)),
        error: msg,
      }));
    }
  },

  reset: () =>
    set({
      assets: [],
      pages: 0,
      currentPage: 0,
      search: "",
      loading: false,
      uploading: false,
      deletingIds: [],
      error: null,
    }),
}));
