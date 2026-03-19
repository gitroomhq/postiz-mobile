import type { ScheduledPost } from "@/types";

export const SCHEDULED_POSTS: ScheduledPost[] = [
  // ── Today (Mar 18) 09:00 — 1 post ──────────────────────────────────────────
  {
    id: "post-1",
    title: "Hi, I want to share an event I have coming up this weekend.",
    content: "Hi, I want to share an event I have coming up this weekend.",
    category: "Personal",
    scheduledAt: "2026-03-18T09:00:00.000Z",
    channelId: "1",
    network: "instagram",
    authorName: "Hamilton Dan",
    authorAvatar: "https://i.pravatar.cc/80?img=11",
    status: "scheduled",
    imageUri: "https://picsum.photos/seed/post1/400/300",
  },

  // ── Today (Mar 18) 14:00 — 1 post ──────────────────────────────────────────
  {
    id: "post-2",
    title: "Weekly marketing update and engagement report for all channels",
    content: "This week's numbers are looking great across all platforms...",
    category: "Marketing",
    scheduledAt: "2026-03-18T14:00:00.000Z",
    channelId: "2",
    network: "facebook",
    authorName: "Hamilton Dan",
    authorAvatar: "https://i.pravatar.cc/80?img=11",
    status: "scheduled",
  },

  // ── Today (Mar 18) 17:00 — 1 post ──────────────────────────────────────────
  {
    id: "post-3",
    title: "Behind the scenes of our latest photoshoot with the team",
    content: "Take a look at what goes on behind the camera...",
    category: "Social",
    scheduledAt: "2026-03-18T17:00:00.000Z",
    channelId: "1",
    network: "linkedin",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=12",
    status: "scheduled",
  },

  // ── Tomorrow (Mar 19) 10:00 — 1 post ───────────────────────────────────────
  {
    id: "post-4",
    title: "Product launch teaser - something big is coming next month",
    content: "Stay tuned for our biggest announcement yet...",
    category: "Business",
    scheduledAt: "2026-03-19T10:00:00.000Z",
    channelId: "3",
    network: "youtube",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=13",
    status: "scheduled",
  },

  // ── Tomorrow (Mar 19) 15:00 — 1 post ───────────────────────────────────────
  {
    id: "post-5",
    title: "Tips for growing your social media presence in 2026",
    content: "Here are our top tips for social media growth...",
    category: "Personal",
    scheduledAt: "2026-03-19T15:00:00.000Z",
    channelId: "1",
    network: "tiktok",
    authorName: "Hamilton Dan",
    authorAvatar: "https://i.pravatar.cc/80?img=11",
    status: "draft",
  },

  // ── Mar 20 11:00 — 1 post ──────────────────────────────────────────────────
  {
    id: "post-6",
    title: "New feature announcement — check out what we built",
    content: "We are excited to share our latest feature...",
    category: "Business",
    scheduledAt: "2026-03-20T11:00:00.000Z",
    channelId: "2",
    network: "x",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=13",
    status: "scheduled",
  },
];
