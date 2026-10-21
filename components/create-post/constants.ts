import type { ChannelNetwork } from "@/types";

export type ComposerPost = {
  id: string;
  content: string;
  imageUris: string[];
};

export type SettingsSheet = "main" | "network" | "tags" | "new-tag" | "repeat" | null;

export type ComposerTag = {
  id: string;
  label: string;
  color: string;
  selected: boolean;
};

export const MEDIA_TOOLS = [
  { id: "insert", icon: require("@/assets/icons/create-post/toolbar-image-plus.svg") },
  { id: "design", icon: require("@/assets/icons/create-post/toolbar-image.svg") },
  { id: "ai-image", icon: require("@/assets/icons/create-post/toolbar-sparkles.svg") },
  { id: "ai-video", icon: require("@/assets/icons/create-post/toolbar-film.svg") },
];

export const FORMAT_TOOLS = [
  { id: "underline", icon: require("@/assets/icons/create-post/toolbar-underline.svg") },
  { id: "bold", icon: require("@/assets/icons/create-post/toolbar-bold.svg") },
];

export const POST_ACTIONS = [
  { id: "calendar", label: "Add to Calendar", tone: "primary" as const },
  { id: "now", label: "Post Now", tone: "secondary" as const },
  { id: "draft", label: "Save as Draft", tone: "tertiary" as const },
];

export const REPEAT_OPTIONS = [
  "Do Not Repeat",
  "Every Day",
  "Every Three Days",
  "Every Week",
  "Every Month",
] as const;

/**
 * Maps the user-facing repeat label to the backend `inter` value (number
 * of days between repeats). The web exposes a richer dropdown
 * (repeat.component.tsx:10-51 — Day / Two Days / Three Days / .../ Two
 * Weeks / Month); mobile uses a coarser preset list so we map only the
 * ones it surfaces. `null` means "no repeat" — caller should omit `inter`
 * from the payload when null.
 */
export const REPEAT_OPTION_TO_DAYS: Record<
  (typeof REPEAT_OPTIONS)[number],
  number | null
> = {
  "Do Not Repeat": null,
  "Every Day": 1,
  "Every Three Days": 3,
  "Every Week": 7,
  "Every Month": 30,
};

/**
 * Reverse of `REPEAT_OPTION_TO_DAYS` — used in edit mode to restore the
 * picker selection from the backend's `intervalInDays` value. Days that
 * don't map to a preset (e.g. 2, 14) collapse to "Do Not Repeat" since
 * the mobile picker can't represent them; the web composer is richer.
 */
export function daysToRepeatOption(
  days: number | null | undefined,
): (typeof REPEAT_OPTIONS)[number] {
  if (!days) return "Do Not Repeat";
  switch (days) {
    case 1:
      return "Every Day";
    case 3:
      return "Every Three Days";
    case 7:
      return "Every Week";
    case 30:
      return "Every Month";
    default:
      return "Do Not Repeat";
  }
}

export const TAG_COLOR_OPTIONS = ["#5D5FFF", "#E323E0", "#3023E3", "#E89623"] as const;

export const DELAY_OPTIONS = ["Immediately", "After 5 minutes", "After 15 minutes"] as const;

/**
 * Empty seed for the composer's tags state. Real tags are pulled from
 * `/posts/tags` via useTagsStore on mount and merged in. The previous
 * mock list ("Personal", "Important", "General") was being silently
 * dropped server-side (posts.repository.ts:563-571 looks up by name; mock
 * names didn't exist on the user's account).
 */
export const INITIAL_TAGS: ComposerTag[] = [];

export function makePost(id: string, content: string, imageUris: string[] = []): ComposerPost {
  return { id, content, imageUris };
}

export function formatNetworkLabel(network: ChannelNetwork) {
  if (network === "x") return "X";
  if (network === "linkedin" || network === "linkedin-page") return "LinkedIn";
  if (
    network === "instagram" ||
    network === "instagram-standalone" ||
    network === "instagram-business"
  )
    return "Instagram";
  if (network === "gmb" || network === "google-business") return "Google Business";
  if (network === "devto") return "DEV";

  return network
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
