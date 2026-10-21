# In-app purchases via RevenueCat — backend contract

Backend (`gitroom`) has a generic payment-provider layer
(`libraries/nestjs-libraries/src/services/payment/`). Stripe and RevenueCat are
both `@PaymentProvider({ provider })` implementations; every provider receives
its webhook at `POST /payment/:provider` (`/payment/stripe`,
`/payment/revenuecat`). `Subscription.provider` (`"stripe" | "revenuecat"`)
records who owns the subscription. Each provider declares a `platform`
(`stripe` → `web`, `revenuecat` → `mobile`); an org subscribed on one platform
is blocked from checkout / sync / portal / cancel / finish-trial on the other:
`400 Your subscription is managed on web, please use web to manage it` (and
vice versa). Stripe webhooks never delete a RevenueCat row and vice versa.

RevenueCat is the source of truth: the backend never parses receipts. Both the
app and the RevenueCat webhook only tell the backend *which* subscriber to
re-check, and it loads `GET /v1/subscribers/{app_user_id}` from RevenueCat.

## RevenueCat setup

- **App User ID = Postiz organization id** (`user.orgId` from `/user/self`).
  Call `Purchases.logIn(orgId)` right after login and `Purchases.logOut()` on
  sign out. Anonymous RevenueCat users (`$RCAnonymousID:…`) are ignored.
- Product identifiers must end in `<tier>.<period>` or `<tier>_<period>`
  (Google Play product ids can't use dots freely):
  - App Store: `com.postiz.mob.standard.monthly`, `com.postiz.mob.pro.yearly`, …
  - Google Play: `postiz_standard_monthly`, `postiz_pro_yearly`, …
  Tiers: `STANDARD | TEAM | PRO | ULTIMATE`, periods: `MONTHLY | YEARLY`.
- Webhook (Project → Integrations → Webhooks):
  URL `https://api.postiz.com/payment/revenuecat`, set an
  **Authorization header value** and put the same value in the backend env
  `REVENUECAT_WEBHOOK_SECRET`. Send all event types.
- Backend env: `REVENUECAT_SECRET_KEY` (secret API key, sent as `Bearer`),
  `REVENUECAT_WEBHOOK_SECRET`. Leave `IN_APP_PURCHASE_REJECT_SANDBOX` empty —
  App Review and Play testers purchase in sandbox.

## Mobile → backend

After `Purchases.purchasePackage(...)` or `Purchases.restorePurchases()`
resolves, ping the backend so it syncs immediately (the webhook also arrives,
but this avoids the wait):

```http
POST /billing/sync            (authenticated, like every /billing route)
{ "provider": "revenuecat" }
```

Responses:
- `{ active: true }` — subscription synced; call `refreshSubscription()` and
  the app unlocks.
- `{ active: false }` — RevenueCat has no active subscription for this org
  (expired / refunded / nothing bought). A previous RevenueCat subscription is
  removed and the org drops to FREE limits.
- `{ blocked: true }` — another Postiz account with the same email already has
  a subscription (same rule as Stripe).
- `400 Your subscription is managed on web, please use web to manage it` —
  the org already pays through Stripe; tell the user to manage it on the web.

`GET /user/subscription` / `GET /billing` include `provider` and `platform`.
When `platform` is `"web"` the app must not offer a purchase; show
"Your subscription is managed by {provider}, please go to web to manage it"
(the web billing page shows the mirror message for `"mobile"`). When it is
`"mobile"`, deep-link to the store's subscription management
(`Purchases.getCustomerInfo().managementURL`).

## Webhook → backend

`POST /payment/revenuecat` with RevenueCat's event body. Every event carrying
an `app_user_id` (plus `original_app_user_id`, and both sides of `TRANSFER`)
triggers a re-sync of that org from the subscriber API: renewals,
cancellations (`unsubscribe_detected_at` → `cancelAt = expires_date`),
expirations / refunds (subscription removed, org drops to FREE), product
changes. `TEST` events return 200 without changes. Wrong `Authorization`
header → 401.
