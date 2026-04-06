import type { ScheduledPost } from "@/types";

/** Build an ISO-8601 date string relative to today. */
function relativeDate(daysOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const SCHEDULED_POSTS: ScheduledPost[] = [
  // ── 3 days ago 09:00 — published, with image ─────────────────────────────
  {
    id: "post-1",
    title: "Our Q1 marketing campaign recap and key takeaways",
    content:
      "Our Q1 marketing campaign recap: 40% more reach on Instagram, LinkedIn newsletter grew by 1,200 subscribers, and our Facebook ad spend dropped 15% while conversions held steady.",
    category: "Marketing",
    scheduledAt: relativeDate(-3, 9),
    channelId: "1",
    network: "facebook",
    authorName: "Hamilton Dan",
    authorAvatar: "https://i.pravatar.cc/80?img=11",
    status: "published",
    imageUri: "https://picsum.photos/seed/postiz-media-1/720/720",
    tagLabel: "Important",
    tagColor: "#E323E0",
  },

  // ── 3 days ago 14:00 — published, with image ─────────────────────────────
  {
    id: "post-2",
    title: "Golden hour at the rooftop — perfect light for product shots",
    content:
      "Golden hour at the rooftop — perfect light for product shots. We spent the afternoon capturing the new spring collection and the results are stunning.",
    category: "Personal",
    scheduledAt: relativeDate(-3, 14),
    channelId: "2",
    network: "instagram",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=12",
    status: "published",
    imageUri: "https://picsum.photos/seed/postiz-media-2/720/720",
    tagLabel: "Personal",
    tagColor: "#5D5FFF",
  },

  // ── 2 days ago 10:00 — published, no image ───────────────────────────────
  {
    id: "post-3",
    title: "3 lessons I learned from scaling a remote team to 50 people",
    content:
      "3 lessons I learned from scaling a remote team to 50 people: 1) Over-communicate in writing 2) Hire for autonomy, not just skill 3) Make async the default, sync the exception.",
    category: "Business",
    scheduledAt: relativeDate(-2, 10),
    channelId: "3",
    network: "linkedin",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=13",
    status: "published",
    tagLabel: "General",
    tagColor: "#3023E3",
  },

  // ── 2 days ago 16:00 — published, with image ─────────────────────────────
  {
    id: "post-4",
    title: "New tutorial dropped — building smooth page transitions in React Native",
    content:
      "New tutorial dropped! This one covers building smooth page transitions in React Native with shared element animations. Full walkthrough from setup to production-ready code.",
    category: "Personal",
    scheduledAt: relativeDate(-2, 16),
    channelId: "1",
    network: "facebook",
    authorName: "Hamilton Dan",
    authorAvatar: "https://i.pravatar.cc/80?img=11",
    status: "published",
    imageUri: "https://picsum.photos/seed/postiz-media-4/720/720",
    tagLabel: "Personal",
    tagColor: "#5D5FFF",
  },

  // ── Yesterday 08:30 — published, with image ──────────────────────────────
  {
    id: "post-5",
    title: "Friday mood: wrapping up the week with a team coffee chat",
    content:
      "Friday mood: wrapping up the week with a team coffee chat. We reviewed this week's wins, talked about blockers, and planned next week's sprint. Small rituals make a big difference.",
    category: "Social",
    scheduledAt: relativeDate(-1, 8, 30),
    channelId: "2",
    network: "instagram",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=12",
    status: "published",
    imageUri: "https://picsum.photos/seed/postiz-media-3/720/720",
    tagLabel: "Personal",
    tagColor: "#5D5FFF",
  },

  // ── Yesterday 13:00 — published, no image ─────────────────────────────────
  {
    id: "post-6",
    title: "What's your unpopular opinion about frontend frameworks?",
    content:
      "What's your unpopular opinion about frontend frameworks? I'll go first: most apps don't need SSR and a well-optimized SPA with proper caching is simpler and fast enough for 90% of use cases.",
    category: "Personal",
    scheduledAt: relativeDate(-1, 13),
    channelId: "3",
    network: "linkedin",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=13",
    status: "published",
    tagLabel: "Personal",
    tagColor: "#5D5FFF",
  },

  // ── Today 08:00 — published, with image ───────────────────────────────────
  {
    id: "post-7",
    title: "Morning run along the river — best way to start the weekend",
    content:
      "Morning run along the river — best way to start the weekend. 5K done before 9am. Clear skies, fresh air, and a good playlist make all the difference.",
    category: "Personal",
    scheduledAt: relativeDate(0, 8),
    channelId: "2",
    network: "instagram",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=12",
    status: "published",
    imageUri: "https://picsum.photos/seed/postiz-media-5/720/720",
    tagLabel: "Personal",
    tagColor: "#5D5FFF",
  },

  // ── Today 14:00 — scheduled, with image ───────────────────────────────────
  {
    id: "post-8",
    title: "Weekly marketing update and engagement report for all channels",
    content:
      "This week's numbers are looking great across all platforms. Instagram engagement is up 23% and LinkedIn impressions doubled compared to last month. Full breakdown below.",
    category: "Marketing",
    scheduledAt: relativeDate(0, 14),
    channelId: "1",
    network: "facebook",
    authorName: "Hamilton Dan",
    authorAvatar: "https://i.pravatar.cc/80?img=11",
    status: "scheduled",
    imageUri: "https://picsum.photos/seed/postiz-media-6/720/720",
    tagLabel: "Important",
    tagColor: "#E323E0",
  },

  // ── Today 18:00 — draft, no image ─────────────────────────────────────────
  {
    id: "post-9",
    title: "Working on a blog post about our Q1 results",
    content:
      "Working on a blog post about our Q1 results. Still need to finalize the revenue numbers and add charts. Will publish once the team reviews it.",
    category: "Business",
    scheduledAt: relativeDate(0, 18),
    channelId: "3",
    network: "linkedin",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=13",
    status: "draft",
    tagLabel: "General",
    tagColor: "#3023E3",
  },

  // ── Tomorrow 09:00 — scheduled, no image ──────────────────────────────────
  {
    id: "post-10",
    title: "Quick thread on 5 design patterns every developer should know",
    content:
      "Quick thread on 5 design patterns every developer should know. From observer to strategy, these patterns will level up your code architecture.",
    category: "Personal",
    scheduledAt: relativeDate(1, 9),
    channelId: "2",
    network: "instagram",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=12",
    status: "scheduled",
    tagLabel: "Personal",
    tagColor: "#5D5FFF",
  },

  // ── Tomorrow 12:00 — draft, with image ────────────────────────────────────
  {
    id: "post-11",
    title: "Tips for growing your social media presence in 2026",
    content:
      "Tips for growing your social media presence in 2026: 1) Be consistent with posting 2) Engage with your community 3) Use analytics to understand what works 4) Experiment with new formats.",
    category: "Marketing",
    scheduledAt: relativeDate(1, 12),
    channelId: "1",
    network: "facebook",
    authorName: "Hamilton Dan",
    authorAvatar: "https://i.pravatar.cc/80?img=11",
    status: "draft",
    imageUri: "https://picsum.photos/seed/postiz-media-1/720/720",
    tagLabel: "Important",
    tagColor: "#E323E0",
  },

  // ── Tomorrow 17:00 — scheduled, with image ────────────────────────────────
  {
    id: "post-12",
    title: "Product launch teaser — something big is coming next month",
    content:
      "Stay tuned for our biggest announcement yet. We've been working on this for 6 months and we're finally ready to show it to the world. Sign up for early access at the link in bio.",
    category: "Business",
    scheduledAt: relativeDate(1, 17),
    channelId: "3",
    network: "linkedin",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=13",
    status: "scheduled",
    imageUri: "https://picsum.photos/seed/postiz-media-2/720/720",
    tagLabel: "General",
    tagColor: "#3023E3",
  },

  // ── 2 days from now 10:00 — scheduled, with image ────────────────────────
  {
    id: "post-13",
    title: "New video is live! How to build a design system from scratch",
    content:
      "New video is live! In this one I walk through building a complete design system from scratch — tokens, components, documentation, and versioning. Link in bio.",
    category: "Personal",
    scheduledAt: relativeDate(2, 10),
    channelId: "2",
    network: "instagram",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=12",
    status: "scheduled",
    imageUri: "https://picsum.photos/seed/postiz-media-4/720/720",
    tagLabel: "Personal",
    tagColor: "#5D5FFF",
  },

  // ── 2 days from now 15:00 — draft, no image ──────────────────────────────
  {
    id: "post-14",
    title: "Here's what most people get wrong about remote work",
    content:
      "Here's what most people get wrong about remote work: it's not about working from home, it's about async communication, trust, and clear documentation. The location is irrelevant.",
    category: "Social",
    scheduledAt: relativeDate(2, 15),
    channelId: "3",
    network: "linkedin",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=13",
    status: "draft",
    tagLabel: "Personal",
    tagColor: "#5D5FFF",
  },

  // ── 3 days from now 11:00 — scheduled, with image ────────────────────────
  {
    id: "post-15",
    title: "Sneak peek at our new brand identity and visual refresh",
    content:
      "Sneak peek at our new brand identity! We've been working with an amazing design agency to refresh our look. New logo, color palette, and typography coming soon.",
    category: "Business",
    scheduledAt: relativeDate(3, 11),
    channelId: "2",
    network: "instagram",
    authorName: "Daniel Hamilton",
    authorAvatar: "https://i.pravatar.cc/80?img=12",
    status: "scheduled",
    imageUri: "https://picsum.photos/seed/postiz-media-3/720/720",
    tagLabel: "General",
    tagColor: "#3023E3",
  },
];
