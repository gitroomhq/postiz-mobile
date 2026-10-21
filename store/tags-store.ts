import { create } from "zustand";

import { apiFetch } from "@/utils/custom-fetch";

/**
 * Mirrors the backend `Tags` row shape returned by `GET /posts/tags`.
 * The composer's tag picker reads from this store so the user picks from
 * tags that actually exist on the backend — sending a label that has no
 * matching row is silently dropped server-side
 * (posts.repository.ts:563-571 looks up by `name` and only attaches
 * existing rows; mismatched names produce zero attached tags).
 */
export type Tag = {
  id: string;
  name: string;
  color: string;
};

type TagsState = {
  tags: Tag[];
  loading: boolean;
  error: string | null;

  fetchTags: () => Promise<void>;
  createTag: (input: { name: string; color: string }) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<void>;
  reset: () => void;
};

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  loading: false,
  error: null,

  fetchTags: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiFetch(`/posts/tags`);
      if (!response.ok) {
        throw new Error(`Failed to load tags (${response.status})`);
      }
      const data = (await response.json()) as { tags?: Tag[] };
      const tags = Array.isArray(data.tags) ? data.tags : [];
      set({ tags, loading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      set({ loading: false, error: msg });
    }
  },

  createTag: async ({ name, color }) => {
    set({ error: null });
    try {
      const response = await apiFetch(`/posts/tags`, {
        method: "POST",
        body: JSON.stringify({ name, color }),
      });
      if (!response.ok) {
        throw new Error(`Failed to create tag (${response.status})`);
      }
      const created = (await response.json()) as Tag;
      set((state) => ({ tags: [...state.tags, created] }));
      return created;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      set({ error: msg });
      return null;
    }
  },

  deleteTag: async (id) => {
    set({ error: null });
    try {
      const response = await apiFetch(`/posts/tags/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete tag (${response.status})`);
      }
      set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      set({ error: msg });
    }
  },

  reset: () => set({ tags: [], loading: false, error: null }),
}));
