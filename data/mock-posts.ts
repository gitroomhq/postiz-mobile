import type { ScheduledPost } from "@/types";

/** Build an ISO-8601 date string relative to today. */
function relativeDate(daysOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const SCHEDULED_POSTS: ScheduledPost[] = [
  // ── Yesterday 2:00 AM — 1 channel (Facebook) ─────────────────────────────
  {
    id: "post-1",
    title: "Our Q1 marketing campaign recap and key takeaways",
    content:
      "Our Q1 marketing campaign recap: 40% more reach on Instagram, LinkedIn newsletter grew by 1,200 subscribers, and our Facebook ad spend dropped 15% while conversions held steady.",
    category: "Marketing",
    scheduledAt: relativeDate(-1, 2),
    channelId: "1",
    network: "facebook",
    authorName: "Hamilton Dan",
    authorAvatar: "https://i.pravatar.cc/80?img=11",
    status: "published",
    tagLabel: "Important",
    tagColor: "#E323E0",
  },

  // ── Today 3:00 AM — 1 channel (Instagram) ────────────────────────────────
  {
    id: "post-2",
    title: "Quick thread on 5 design patterns every developer should know",
    content:
      "Quick thread on 5 design patterns every developer should know. From observer to strategy, these patterns will level up your code architecture.",
    category: "Personal",
    scheduledAt: relativeDate(0, 3),
    channelId: "2",
    network: "instagram",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=12",
    status: "scheduled",
    tagLabel: "Personal",
    tagColor: "#5D5FFF",
  },

  // ── Tomorrow 12:00 AM — 1 channel (LinkedIn) ─────────────────────────────
  {
    id: "post-3",
    title: "New video is live! In this one I walk through building a complete design system",
    content:
      "New video is live! In this one I walk through building a complete design system from scratch — tokens, components, documentation, and versioning.",
    category: "Business",
    scheduledAt: relativeDate(1, 0),
    channelId: "3",
    network: "linkedin",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=13",
    status: "scheduled",
    tagLabel: "General",
    tagColor: "#3023E3",
  },

  // ── Day after tomorrow 4:00 AM — channel 1 (Facebook) ────────────────────
  {
    id: "post-4a",
    title: "Tips for growing your social media presence in 2026",
    content:
      "Tips for growing your social media presence in 2026: 1) Be consistent with posting 2) Engage with your community 3) Use analytics to understand what works.",
    category: "Marketing",
    scheduledAt: relativeDate(2, 4),
    channelId: "1",
    network: "facebook",
    authorName: "Hamilton Dan",
    authorAvatar: "https://i.pravatar.cc/80?img=11",
    status: "scheduled",
    tagLabel: "Important",
    tagColor: "#E323E0",
  },

  // ── Day after tomorrow 4:00 AM — channel 2 (Instagram) ───────────────────
  {
    id: "post-4b",
    title: "Tips for growing your social media presence in 2026",
    content:
      "Tips for growing your social media presence in 2026: 1) Be consistent with posting 2) Engage with your community 3) Use analytics to understand what works.",
    category: "Marketing",
    scheduledAt: relativeDate(2, 4),
    channelId: "2",
    network: "instagram",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=12",
    status: "scheduled",
    tagLabel: "Important",
    tagColor: "#E323E0",
  },
];
