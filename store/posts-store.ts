import { create } from "zustand";

import { SCHEDULED_POSTS } from "@/data/mock-posts";
import type { ScheduledPost } from "@/types";

type PostsState = {
  posts: ScheduledPost[];

  addPost: (post: ScheduledPost) => void;
  updatePost: (id: string, updates: Partial<ScheduledPost>) => void;
  deletePost: (id: string) => void;
  reschedulePost: (id: string, newScheduledAt: string) => void;
};

export const usePostsStore = create<PostsState>((set) => ({
  posts: SCHEDULED_POSTS,

  addPost: (post) =>
    set((state) => ({ posts: [...state.posts, post] })),

  updatePost: (id, updates) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    })),

  deletePost: (id) =>
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
    })),

  reschedulePost: (id, newScheduledAt) =>
    set((state) => ({
      posts: state.posts.map((p) =>
        p.id === id ? { ...p, scheduledAt: newScheduledAt } : p,
      ),
    })),
}));
