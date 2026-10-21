import { FRONTEND_URL } from "@/utils/env";

/**
 * Absolute URL of the platform icon hosted by the Postiz frontend.
 * The slug is the raw `providerIdentifier` from the backend — same
 * convention as the web frontend (`/icons/platforms/${identifier}.png`),
 * so a new backend provider works without an app release as long as
 * the frontend ships a matching icon file.
 */
export function getNetworkIconUrl(network: string): string {
  return `${FRONTEND_URL}/icons/platforms/${network}.png`;
}
