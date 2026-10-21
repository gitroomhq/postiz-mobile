/**
 * Per-network character limits. Kept as a fallback table for the editor
 * counter — the source of truth lives in each backend provider, but
 * the mobile composer needs a number to render BEFORE the per-channel
 * WebView reports its real limit.
 *
 * Unknown networks (e.g. a brand-new backend provider not in this table)
 * fall through to `DEFAULT_CHARACTER_LIMIT` so the counter still works
 * without an app update.
 */
const KNOWN_LIMITS: Record<string, number> = {
  x: 280,
  linkedin: 1300,
  "linkedin-page": 1300,
  reddit: 10000,
  instagram: 2200,
  "instagram-standalone": 2200,
  facebook: 6000,
  threads: 500,
  youtube: 5000,
  gmb: 1500,
  tiktok: 2200,
  pinterest: 500,
  dribbble: 10000,
  discord: 2000,
  slack: 40000,
  kick: 5000,
  twitch: 500,
  mastodon: 500,
  bluesky: 300,
  lemmy: 10000,
  farcaster: 320,
  telegram: 4096,
  nostr: 10000,
  vk: 15000,
  medium: 100000,
  devto: 100000,
  hashnode: 100000,
  wordpress: 100000,
  listmonk: 100000,
  moltbook: 5000,
  whop: 5000,
  skool: 10000,
  mewe: 10000,
};

const DEFAULT_CHARACTER_LIMIT = 10000;

export function getNetworkCharacterLimit(network: string): number {
  return KNOWN_LIMITS[network] ?? DEFAULT_CHARACTER_LIMIT;
}
