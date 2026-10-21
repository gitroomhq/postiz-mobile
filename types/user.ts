export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  picture?: string | null;
  orgId?: string;
  totalChannels?: number;
  publicApi?: string;
  role?: "SUPERADMIN" | "ADMIN" | "USER";
  [key: string]: unknown;
};
