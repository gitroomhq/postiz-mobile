# Backend changes required in `gitroom` (App Review fixes)

> **STATUS 2026-08-19:** Everything below is implemented and deployed.
> `POST /user/delete-account` is live (hard delete, cancels Stripe first).
> Apple login is confirmed working end-to-end against api.postiz.com.
>
> One caveat for future deploys: the local `gitroom` checkout
> (main, in sync with origin/main, commit 14c3a2f8) has an
> `apple.provider.ts` whose `getToken()` exchanges the `code` as an
> authorization code and whose `getUser()` verifies audience against
> `APPLE_CLIENT_ID` (com.postiz.web) — that version would reject the mobile
> identity token (audience com.postiz.mob). Since prod works, prod runs
> different code; make sure whatever branch/repo prod deploys from keeps the
> identity-token handling, or sync it back into origin/main.

The mobile app (v1.0.0 build 2) was rejected on Guideline 4.8 (needs Sign in with
Apple) and 5.1.1(v) (needs account deletion). The mobile side is already
implemented in this repo and calls two backend capabilities that do not exist
yet. This document is the exact spec for the `gitroom` repo.

Mobile → backend contract:

1. `POST /auth/oauth/APPLE/exists` with `{ code: <apple identity token> }`
   — same endpoint Google uses; only a new `APPLE` auth provider is needed.
2. `POST /user/delete-account` — permanently deletes the authenticated user's
   account. **Implemented in gitroom** (`users.controller.ts`,
   `@Post('/delete-account')`) — note the route differs from the
   `DELETE /user/self` originally proposed below; the mobile app calls
   `POST /user/delete-account`.

---

## 1. Apple auth provider

### 1a. Prisma enum — `libraries/nestjs-libraries/src/database/prisma/schema.prisma`

```prisma
enum Provider {
  LOCAL
  GITHUB
  GOOGLE
  APPLE      // add
  FARCASTER
  WALLET
  GENERIC
}
```

Then `prisma generate` + a migration (`prisma migrate dev` / `db push` per your
workflow). Adding an enum value is non-breaking.

### 1b. New file — `apps/backend/src/services/auth/providers/apple.provider.ts`

The mobile app performs **native** Sign in with Apple (`expo-apple-authentication`)
and sends the resulting identity token (a JWT) as the `code`. So `getToken` is a
pass-through and `getUser` verifies the JWT against Apple's public JWKS. Uses
only `jsonwebtoken` (already a dependency) + Node's built-in JWK support — no
new packages.

```ts
import { createPublicKey } from 'crypto';
import { decode, verify } from 'jsonwebtoken';
import {
  AuthProvider,
  AuthProviderAbstract,
} from '@gitroom/backend/services/auth/providers.interface';

@AuthProvider({ provider: 'APPLE' })
export class AppleProvider extends AuthProviderAbstract {
  generateLink() {
    // Mobile-only provider: the app runs native Sign in with Apple and posts
    // the identity token straight to /auth/oauth/APPLE/exists.
    return '';
  }

  async getToken(code: string) {
    return code;
  }

  async getUser(providerToken: string) {
    const decoded = decode(providerToken, { complete: true });
    if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
      throw new Error('Invalid Apple identity token');
    }

    const jwks = await (
      await fetch('https://appleid.apple.com/auth/keys')
    ).json();
    const jwk = jwks.keys.find((k: any) => k.kid === decoded.header.kid);
    if (!jwk) {
      throw new Error('Apple signing key not found');
    }

    const publicKey = createPublicKey({ key: jwk, format: 'jwk' })
      .export({ type: 'spki', format: 'pem' })
      .toString();

    const payload = verify(providerToken, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
      audience: process.env.APPLE_BUNDLE_ID || 'com.postiz.mob',
    }) as { sub: string; email?: string };

    return {
      id: payload.sub,
      // Apple includes the email claim (real or private-relay) on essentially
      // every sign-in; the placeholder keeps registration working if it is
      // ever absent (User has @@unique([email, providerName])).
      email: payload.email || `apple_${payload.sub}@placeholder.postiz.com`,
    };
  }
}
```

Notes:
- `audience` must be the iOS bundle id `com.postiz.mob` (set `APPLE_BUNDLE_ID`
  env or rely on the default above).
- Identity tokens expire after ~10 minutes. The existing flow re-verifies the
  token during `/auth/register` (new users), which happens seconds after
  `/exists`, so this is fine.
- Users who chose "Hide My Email" arrive with a `@privaterelay.appleid.com`
  address — this is expected and satisfies guideline 4.8.
- Optional hardening: also verify the `nonce` claim (mobile would need to pass
  one); not required for approval.

### 1c. Register the provider — `apps/backend/src/api/api.module.ts`

```ts
import { AppleProvider } from '@gitroom/backend/services/auth/providers/apple.provider';
// ...
providers: [
  // ...
  GoogleProvider,
  FarcasterProvider,
  AppleProvider,   // add
],
```

No controller or auth.service changes: `checkExists('APPLE', code)` →
`getToken` → `getUser` → `getUserByProvider(sub, 'APPLE')` → JWT or
registration token, exactly like Google.

---

## 2. Account deletion endpoint

> **Status: DONE in gitroom, with a different route.** The backend shipped
> `@Post('/delete-account')` on `users.controller.ts` (i.e.
> `POST /user/delete-account`), which also refuses deletion while
> impersonating and cancels billing before scrubbing the account. The web
> frontend (`delete-account.component.tsx`) and the mobile Settings screen
> both call `POST /user/delete-account`. The original proposal below is kept
> for history only.

### 2a. Controller — `apps/backend/src/api/routes/users.controller.ts` (superseded)

Add `Delete` to the `@nestjs/common` import, then:

```ts
@Delete('/self')
async deleteSelf(
  @GetUserFromRequest() user: User,
  @Res({ passthrough: false }) response: Response
) {
  await this._userService.deleteSelf(user.id);

  response.cookie('auth', '', {
    domain: getCookieUrlFromDomain(process.env.FRONTEND_URL!),
    ...(!process.env.NOT_SECURED
      ? { secure: true, httpOnly: true, sameSite: 'none' }
      : {}),
    maxAge: -1,
  });

  response.status(200).json({ deleted: true });
}
```

The mobile app calls `POST /user/delete-account` and locally signs out on
200/201.

### 2b. Service — `UsersService.deleteSelf(userId)` (nestjs-libraries)

Apple requires the account **record** to be deleted (deactivation is not
enough). Policy:

- For every organization where this user is the **only** member: cancel any
  active Stripe subscription (`organization.paymentId`), then hard-delete the
  organization and everything under it.
- For organizations with other members: just remove this user's membership
  (`UserOrganization` row).
- Finally delete the `User` row itself.

The schema has **no `onDelete: Cascade`** on the org/user children, so the org
graph must be deleted explicitly inside one transaction, children first.
Sketch (verify FK order compiles against the live schema — Prisma will throw
on any missed dependency):

```ts
async deleteSelf(userId: string) {
  const memberships = await this._prisma.userOrganization.findMany({
    where: { userId },
  });

  for (const m of memberships) {
    const members = await this._prisma.userOrganization.count({
      where: { organizationId: m.organizationId },
    });
    if (members === 1) {
      await this.deleteOrganizationGraph(m.organizationId); // below
    } else {
      await this._prisma.userOrganization.delete({ where: { id: m.id } });
    }
  }

  // User-scoped leftovers, then the user record itself.
  await this._prisma.$transaction([
    this._prisma.oAuthAuthorization.deleteMany({ where: { userId } }),
    this._prisma.comments.deleteMany({ where: { userId } }),
    this._prisma.itemUser.deleteMany({ where: { userId } }),
    this._prisma.user.delete({ where: { id: userId } }),
  ]);
}
```

`deleteOrganizationGraph(orgId)` — cancel Stripe first if `paymentId` is set
(use the existing StripeService/SubscriptionService cancel path), then delete
in roughly this order (leaf tables first):

`TagsPosts` → `Comments` → `Post` (delete children/parent posts:
`deleteMany({ where: { organizationId } })` twice or order by `parentPostId`)
→ `ExisingPlugData` → `Plugs` → `IntegrationsWebhooks` → `Webhooks` →
`AutoPost` → `Sets` → `Signatures` → `Tags` → `Errors` → `Notifications` →
`Credits` → `UsedCodes` → `GitHub` → `ThirdParty` → `Customer` →
`Integration` → `Media` (note: `User.pictureId` may reference org media —
null it first) → `OAuthAuthorization` → `OAuthApp` → `Subscription` →
`UserOrganization` → `Organization`.

Alternative (cleaner long-term): add `onDelete: Cascade` to the org-child
relations in the schema and let `organization.delete()` cascade — bigger
migration, your call.

### 2c. Apple token revocation (required by Apple for SIWA apps)

Since 2022 Apple requires apps offering Sign in with Apple to revoke the
user's Apple tokens when the account is deleted
(`POST https://appleid.apple.com/auth/revoke`, authenticated with a
client secret JWT signed by an App Store Connect key). This needs an Apple
private key (.p8) configured server-side. Recommendation: ship the deletion
endpoint now (it satisfies 5.1.1(v) review), and add revocation as a
follow-up — reviewers test the deletion flow, not revocation.

---

## 3. Env / ops

- `APPLE_BUNDLE_ID=com.postiz.mob` (backend env, optional given the default).
- No Apple developer-portal secret is needed for **verifying** identity tokens
  (public JWKS). Secrets are only needed for the optional revocation call and
  for web-based "Sign in with Apple" (not used here).
