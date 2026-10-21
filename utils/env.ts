const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const RAW_BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

export const BACKEND_URL = stripTrailingSlash(RAW_BACKEND_URL);

export const FRONTEND_URL = stripTrailingSlash(
  process.env.EXPO_PUBLIC_FRONTEND_URL ?? "http://localhost:4200",
);

export const OAUTH_APP_SCHEME =
  process.env.EXPO_PUBLIC_OAUTH_APP_SCHEME ?? "postiz://auth/callback";

export const OAUTH_BACKEND_REDIRECT = `${BACKEND_URL}/auth/oauth-mobile-callback`;
