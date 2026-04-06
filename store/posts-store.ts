import { create } from "zustand";

import { SCHEDULED_POSTS } from "@/data/mock-posts";
import type { ScheduledPost } from "@/types";

type PostsState = {
  posts: ScheduledPost[];
  error: string | null;
  /** Set by create-post screen so the calendar navigates to this date/time on return. */
  navigateToDate: string | null;

  addPost: (post: ScheduledPost) => void;
  updatePost: (id: string, updates: Partial<ScheduledPost>) => void;
  deletePost: (id: string) => void;
  deletePostsByChannelId: (channelId: string) => void;
  reschedulePost: (id: string, newScheduledAt: string) => void;
  clearError: () => void;
  setNavigateToDate: (iso: string | null) => void;
};

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: SCHEDULED_POSTS,
  error: null,
  navigateToDate: null,

  addPost: (post) => {
    if (!post.id || !post.content) {
      set({ error: "Post must have an id and content." });
      return;
    }
    if (get().posts.some((p) => p.id === post.id)) {
      set({ error: `Post with id "${post.id}" already exists.` });
      return;
    }
    set((state) => ({ posts: [...state.posts, post], error: null }));
  },

  updatePost: (id, updates) => {
    if (!get().posts.some((p) => p.id === id)) {
      set({ error: `Post "${id}" not found.` });
      return;
    }
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      error: null,
    }));
  },

  deletePost: (id) => {
    if (!get().posts.some((p) => p.id === id)) {
      set({ error: `Post "${id}" not found.` });
      return;
    }
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
      error: null,
    }));
  },

  deletePostsByChannelId: (channelId) => {
    set((state) => ({
      posts: state.posts.filter((p) => p.channelId !== channelId),
      error: null,
    }));
  },

  reschedulePost: (id, newScheduledAt) => {
    if (!get().posts.some((p) => p.id === id)) {
      set({ error: `Post "${id}" not found.` });
      return;
    }
    if (!newScheduledAt) {
      set({ error: "A valid date is required to reschedule." });
      return;
    }
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id ? { ...p, scheduledAt: newScheduledAt } : p,
      ),
      error: null,
    }));
  },

  clearError: () => set({ error: null }),
  setNavigateToDate: (iso) => set({ navigateToDate: iso }),
}));
