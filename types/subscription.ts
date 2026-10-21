export type SubscriptionTier = "STANDARD" | "TEAM" | "PRO" | "ULTIMATE";
export type SubscriptionPeriod = "MONTHLY" | "YEARLY";

export type Subscription = {
  id: string;
  organizationId: string;
  subscriptionTier: SubscriptionTier;
  provider: "stripe" | "revenuecat";
  platform: "web" | "mobile";
  identifier: string | null;
  cancelAt: string | null;
  period: SubscriptionPeriod;
  totalChannels: number;
  isLifetime: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};
