# App Review — reply and resubmission checklist (v1.0.0, submission a432a1cf)

## Reply text (paste into App Store Connect, Reply to App Review)

> Thank you for the review. We have addressed all three issues in the new build:
>
> **Guideline 4.8 — Login Services**
> We added Sign in with Apple as an equivalent login option. It appears
> alongside Sign in with Google on both the Sign In and Create Account
> screens, using the native ASAuthorizationController flow.
>
> **Guideline 5.1.1(v) — Account Deletion**
> The app now supports full account deletion in-app: Settings tab →
> "Delete Account" → confirmation dialog. The same option is also offered on
> the screen shown to signed-in users without an active subscription, so
> deletion is always reachable. Deleting permanently removes the user's
> account record, their organizations, connected social channels and scheduled
> posts from our servers — it is not a deactivation, and no customer-service
> contact is required. A screen recording of the complete flow (sign-in →
> Settings → Delete Account → confirmation) captured on a physical device has
> been added to the App Review Information notes.
>
> **Guideline 2.1(b) — Business model**
>
> 1. *Who are the users that will use the paid content, subscriptions,
>    features, and services in the app?*
>    Postiz is a social-media scheduling tool for businesses, marketing teams
>    and content creators. The app's users are existing Postiz customers —
>    companies and professionals who already manage their social-media
>    publishing through our web platform (postiz.com) and use the mobile app
>    as a companion to view their calendar and schedule posts on the go.
>
> 2. *Where can users purchase the content, subscriptions, features, and
>    services that can be accessed in the app?*
>    Subscriptions are purchased on our website, postiz.com, as part of our
>    multiplatform web service. The iOS app does not sell anything, does not
>    link to any external purchase page, and does not prompt users to
>    purchase — in line with Guideline 3.1.3(b) (Multiplatform Services), the
>    app simply lets customers access a subscription they already own.
>
> 3. *What specific types of previously purchased subscriptions, features,
>    and services can a user access in the app?*
>    A user with an active Postiz subscription (purchased on the web) can
>    connect their social-media channels, create and schedule posts, and view
>    their publishing calendar. Users without an active subscription can sign
>    in but only see an informational screen (with sign-out and account-
>    deletion options); no purchase flow is shown.
>
> 4. *What paid content, subscriptions, or features are unlocked within the
>    app that do not use In-App Purchase?*
>    None are unlocked within the app. The app contains no purchase or
>    unlocking mechanism of any kind — access is determined solely by the
>    subscription status of the account, established outside the app on our
>    website, consistent with Guideline 3.1.3(b).

## Resubmission checklist (audited 2026-08-19)

Backend (see `backend-spec.md`):
- [x] `APPLE` auth provider deployed — Apple login confirmed working
      end-to-end against api.postiz.com
- [x] Account deletion endpoint — deployed as `POST /user/delete-account`
      (hard delete, cancels Stripe first); mobile calls it

Apple developer portal / signing:
- [x] **Sign In with Apple** capability enabled on App ID `com.postiz.mob`
      (verified via asc: `APPLE_ID_AUTH` present)
- [x] Provisioning profile regenerated 2026-08-19 — new "Postiz AppStore"
      (`LBWS36X2N4`, ACTIVE, includes `com.apple.developer.applesignin`);
      old invalid profile deleted remotely and locally

Build:
- [x] Build 4 (1.0.0) built 2026-08-19 from current code, signed binary
      verified to contain `com.apple.developer.applesignin`, uploaded,
      processed (VALID), and attached to the 1.0.0 version
      (build id cc0e9dd2-7922-47a5-8f91-ccb56edf2932)
- [ ] Smoke-test build 4 via TestFlight on a device: Apple sign-in
      end-to-end (this is the distribution-signed binary — the thing that
      was broken in build 3)

App Store Connect:
- [ ] Record the account-deletion flow on a **physical device**: sign in →
      Settings → Delete Account → confirm → signed out. Put the recording
      link in App Review Information → Notes
- [ ] Verify the demo account credentials in App Review Information still
      work and the demo account has an active subscription
- [ ] Paste the reply text above into the App Review conversation and
      resubmit

Manual test pass before upload:
- [ ] Apple sign-in with a brand-new Apple ID (goes to signup, asks only for
      company, creates account) — test both "Share My Email" and
      "Hide My Email"
- [ ] Apple sign-in with an existing Apple-linked account (straight to app)
- [ ] Google sign-in still works (iOS + Android)
- [ ] Delete account, then confirm the same credentials can register again
