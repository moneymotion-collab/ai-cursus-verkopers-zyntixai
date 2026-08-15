# SMM-B1.1-C — Instagram OAuth Authorization, Callback & Encrypted Credential Storage — Evidence

| Field | Value |
| --- | --- |
| Phase slice | **SMM-B1.1-C — Instagram OAuth Authorization, Callback & Encrypted Credential Storage** |
| Product track | **ZyntixAI Social Media Management Beta 1** |
| Document type | Closure evidence |
| Date | 2026-08-15 |
| Formal status | `SMM-B1.1-C CLOSED WITH EVIDENCE — INSTAGRAM OAUTH AUTHORIZATION, CALLBACK AND ENCRYPTED CREDENTIAL FLOW IMPLEMENTED` |
| Live OAuth status | `CONTROLLED PRODUCTION OAUTH VERIFICATION NOT EXECUTED` |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Starting HEAD | `c7f022cc60386b58e0d39648c2695ea8ffca7e63` |
| Implementation HEAD | `e7db47371422d775f7172998568481fa46bb1945` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Database migration | **NONE** — B1.1-B schema sufficient |

This slice implements the first complete server-controlled Instagram Login OAuth connection flow on top of B1.1-A/B. It does **not** authorize publishing, Stories, webhooks, connection UI, enabling Production feature gates, or creating Production secrets.

```text
SMM-B1.1-D NOT YET AUTHORIZED
```

---

## 1. Executive verdict

```text
SMM-B1.1-C CLOSED WITH EVIDENCE — INSTAGRAM OAUTH AUTHORIZATION, CALLBACK AND ENCRYPTED CREDENTIAL FLOW IMPLEMENTED
```

```text
CONTROLLED PRODUCTION OAUTH VERIFICATION NOT EXECUTED
```

Implementation and automated (mocked-network) verification are complete. No real Instagram OAuth authorization, no real provider token, and no Production credential row were created in this slice.

---

## 2. Verified Git baseline

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `c7f022cc60386b58e0d39648c2695ea8ffca7e63` |
| Subject | `docs(smm): close B1.1-B credential foundation` |
| Upstream / origin | same SHA |
| Divergence | `0 0` |
| Worktree | clean |

No reset/checkout/pull/stash/rebase/amend/force-push at start.

---

## 3. Binding A/B contracts

Preserved from:

- `docs/phases/SMM-B1.1-A-typed-connection-provider-security-contracts-evidence.md`
- `docs/phases/SMM-B1.1-B-database-aes256gcm-credential-foundation-evidence.md`

| Contract | C behavior |
| --- | --- |
| Provider | `instagram` only |
| Login product | `instagram_login` |
| Account types | `business` / `creator`; personal rejected |
| Encryption purpose | `zyntixai.smm.credential.aes-v1` |
| Key env | `SOCIAL_CREDENTIAL_ENCRYPTION_KEY` (32-byte standard base64) |
| Intent fingerprint | SHA-256 hex (`^[0-9a-f]{64}$`); raw state never persisted |
| RPCs | Existing B create/consume/finalize/upsert |
| Feature gates | Fail-closed; remain OFF in Production |
| No service-role client | Session client + SECURITY DEFINER only |

---

## 4. Preflight repository findings

| Finding | Decision |
| --- | --- |
| B schema already has intent + credential RPCs | **No new migration** |
| No OAuth routes existed | Add `/api/social/instagram/callback` |
| Invitation exchange / auth callback patterns | Reused: feature gate, no-store, allowlisted redirect, session client |
| `resolveOrganizationContext` | Reused for org membership re-read |
| Workspace FK deferred to B1.2 | Store typed `workspace_id`; no invented FK |
| Generated types lag | Not regenerated (same convention as invitations) |
| Instagram Login endpoints | Official Business Login: authorize / token / long-lived / me |

---

## 5. Scope implemented

1. Cryptographic raw OAuth state generation + SHA-256 fingerprint
2. HttpOnly intent-id cookie for callback binding
3. Server-only Instagram OAuth config (client id/secret/redirect/scopes)
4. Authorization URL builder (locked endpoint/scopes/redirect)
5. Connect initiation (Owner/Admin, gates, rate limit via RPC)
6. Reauthorization initiation foundation
7. Callback route + orchestration
8. Single-use intent consumption **before** provider exchange (after config/key prechecks)
9. Authorization-code → short-lived → long-lived token exchange
10. Minimal identity read (`user_id`, `username`, `account_type`)
11. Personal account rejection
12. AES-256-GCM encrypt + private credential upsert (CAS expected version 0)
13. Connection finalization via existing RPC
14. Token-free allowlisted continuation redirects
15. Tests + security/static review + evidence

Not implemented: publishing, Stories, webhooks, sync workers, refresh scheduler, connection UI, Production gate enablement, live OAuth.

---

## 6. Files changed

### Application

| Path | Role |
| --- | --- |
| `src/app/api/social/instagram/callback/route.ts` | OAuth callback GET |
| `src/features/social-media/actions/initiate-instagram-connection-action.ts` | Server action: connect |
| `src/features/social-media/actions/initiate-instagram-reauthorization-action.ts` | Server action: reauth |
| `src/features/social-media/server/oauth-state.ts` | Raw state + fingerprint |
| `src/features/social-media/server/oauth-intent-cookie.ts` | HttpOnly intent cookie |
| `src/features/social-media/server/instagram-oauth-config.ts` | Fail-closed provider config |
| `src/features/social-media/server/instagram-authorization-url.ts` | Auth URL builder |
| `src/features/social-media/server/instagram-provider-client.ts` | Narrow HTTPS adapter |
| `src/features/social-media/server/oauth-intent-repository.ts` | create/consume/finalize RPC adapters |
| `src/features/social-media/server/initiate-instagram-connection.ts` | Connect orchestration |
| `src/features/social-media/server/initiate-instagram-reauthorization.ts` | Reauth orchestration |
| `src/features/social-media/server/handle-instagram-oauth-callback.ts` | Callback orchestration |
| `src/features/social-media/server/oauth-callback-redirect.ts` | Safe outcome redirects |
| `src/features/social-media/domain/feature-gate.ts` | Instagram env name constants |
| `src/features/social-media/domain/index.ts` | Export env name constants |

### Tests

| Path | Role |
| --- | --- |
| `tests/features/social-media/oauth-state.test.ts` | State entropy/fingerprint |
| `tests/features/social-media/instagram-authorization-url.test.ts` | Config + URL contract |
| `tests/features/social-media/instagram-provider-client.test.ts` | Provider adapter |
| `tests/features/social-media/initiate-instagram-connection.test.ts` | Initiation auth matrix |
| `tests/features/social-media/handle-instagram-oauth-callback.test.ts` | Callback flow |
| `tests/features/social-media/oauth-callback-redirect.test.ts` | Redirect + server-only |
| `tests/features/social-media/oauth-client-safety.test.ts` | Secret scan / no migration |
| `tests/features/social-media/read-model-safety.test.ts` | Updated for callback route presence |

---

## 7. Route / API architecture

| Route / action | Method | Purpose |
| --- | --- | --- |
| `initiateInstagramConnectionAction` | Server Action | Create intent + return authorization URL |
| `initiateInstagramReauthorizationAction` | Server Action | Reauth intent + authorization URL |
| `/api/social/instagram/callback` | GET | Provider redirect target; consume → exchange → encrypt → finalize → redirect |

No JSON browser API returns tokens. Callback responds with `303` + `Cache-Control: no-store`.

---

## 8. OAuth state generation

- 32 cryptographically random bytes → 64 hex chars
- Opaque; no org/user/account/token material
- Fingerprint = SHA-256(utf8 raw state) as lowercase hex
- Raw state exists only for the provider redirect URL and incoming callback query
- Never logged, never audited, never DB-persisted

Intent id is bound via HttpOnly `SameSite=Lax` cookie `zyntix_social_oauth_intent` (UUID only).

---

## 9. Intent persistence

Uses existing B RPCs:

- `create_social_connection_intent`
- `create_social_reauthorization_intent`
- `consume_social_oauth_intent`

Fingerprint only. Actor/org/workspace/provider/login-product/expiry/single-use preserved.

---

## 10. Authorization URL

Endpoint: `https://www.instagram.com/oauth/authorize`

Locked params:

- `client_id` from server config
- `redirect_uri` exact callback URI
- `response_type=code`
- `scope=instagram_business_basic` (least privilege for B1.1 connect)
- `state=<raw state>`

Browser cannot inject scopes, redirect URI, client id, or endpoints.

---

## 11. Provider configuration

Env (server-only, never `NEXT_PUBLIC_`):

| Env | Purpose |
| --- | --- |
| `SOCIAL_INSTAGRAM_CLIENT_ID` | Instagram App ID |
| `SOCIAL_INSTAGRAM_CLIENT_SECRET` | Instagram App Secret |
| `SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI` | Optional exact override |
| `SOCIAL_CREDENTIAL_ENCRYPTION_KEY` | AES-256 key (B1.1-B) |
| `SOCIAL_CONNECTIONS_ENABLED` | Gate |
| `SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED` | Gate |

Default redirect derivation: `{resolveSiteOrigin()}/api/social/instagram/callback`.

Missing/malformed config → fail closed.

---

## 12. Callback validation

Handles:

- provider denial (`error` / `error_reason`)
- missing/malformed state
- missing code
- missing intent cookie
- fingerprint mismatch / invalid state (RPC)
- expired / replayed / wrong actor
- rate limited
- feature disabled
- missing encryption key / Instagram config
- provider non-2xx / timeout / invalid JSON / empty token
- unsupported account type
- identity mismatch / duplicate connection
- encrypt / finalize failures

All map to controlled `social_oauth` outcome codes on allowlisted `/`.

---

## 13. Single-use / replay protection

`consume_social_oauth_intent` runs after authentication + config/key prechecks and **before** provider code exchange.

Consumed intents are not reusable even if later exchange/encrypt/finalize fails. Retry requires a new authorization intent.

---

## 14. Authorization-code handling

Code stays server-side only. Not logged, not persisted, not audited, not returned to the client. Meta `#_` suffix stripped before exchange.

---

## 15. Provider HTTP adapter

`instagram-provider-client.ts`:

- HTTPS only to fixed Instagram endpoints
- Explicit POST/GET
- 15s abort timeout
- `redirect: "error"` (no SSRF / open follow)
- Strict runtime validation of token + identity payloads
- Failure reasons only — no secret material in errors

Endpoints:

1. `POST https://api.instagram.com/oauth/access_token`
2. `GET https://graph.instagram.com/access_token?grant_type=ig_exchange_token`
3. `GET https://graph.instagram.com/v22.0/me?fields=user_id,username,account_type`

---

## 16. Provider-response validation

Accepts only fields required for ZyntixAI credential + identity contracts.

Encrypted plaintext payload:

```ts
{ payloadVersion: 1, accessToken, refreshToken: null }
```

No arbitrary provider JSON blob stored. Safe expiry metadata stored on public connection via upsert `token_expires_at`.

---

## 17. Professional account / identity handling

Minimum identity verification via `/me`:

- `user_id` → `external_account_id`
- `username` → optional display name
- `account_type` → normalized `business` | `creator`

`PERSONAL` / unknown → `unsupported_account`. Never silently promoted.

Capabilities finalized as empty `[]` (discovery remains later). Publish scopes intentionally not requested in C.

---

## 18. Credential normalization

Long-lived access token only. Instagram Login long-lived tokens refresh in place later; no separate refresh token in this flow → `refreshToken: null`.

---

## 19. AES-256-GCM integration

Reuses B1.1-B:

- `encryptSocialCredentialPayload`
- purpose `zyntixai.smm.credential.aes-v1`
- 12-byte IV, 16-byte auth tag
- canonical AAD
- `upsertEncryptedSocialProviderCredential` with expected version `0`

No new crypto.

---

## 20. AAD binding

Unchanged from B: alphabetical canonical JSON binding org/connection/credential/provider/purpose/versions.

---

## 21. Credential repository / CAS

First write uses `expectedCredentialVersion = 0` → version 1. Stale CAS mapped to connection failure. No direct SQL INSERT of plaintext.

---

## 22. Connection finalization

`finalize_social_connection` after successful encrypt/upsert. Preserves uniqueness of non-disconnected `(organization_id, provider, external_account_id)`. Reauth preserves expected external account id.

---

## 23. Tenant / role authorization

- Active authenticated user required
- `resolveOrganizationContext` re-reads membership
- Domain `canManageSocialConnections`: Owner/Admin only
- Staff/Viewer/suspended/invited/removed denied
- RPC layer re-enforces Owner/Admin + active org
- Callback actor must match intent initiating user

---

## 24. Feature-gate behavior

Both `SOCIAL_CONNECTIONS_ENABLED` and `SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED` must be exact `"true"`.

Tests prove OFF / malformed deny initiation and callback. Production gates remain OFF.

---

## 25. Rate limiting

Unchanged B limits applied by existing RPCs:

- connect 10 / org+actor / 3600s
- reauth 10 / org+actor / 3600s
- oauth_callback 20 / org+persisted-actor+provider / 3600s
- credential_refresh 6 / connection / 3600s

Limiter fail-closed preserved.

---

## 26. Client-safe boundary

- Domain barrel does not re-export crypto/provider/callback modules
- Connect result exposes only `authorizationUrl` on success
- Callback never returns tokens/code/state
- No `NEXT_PUBLIC_` Instagram secret envs
- Server modules marked `server-only` (route uses App Router server boundary)

---

## 27. Logging / error safety

No `console.log/info/debug` in OAuth modules. Failures use reason/outcome codes only. Provider adapter errors do not include tokens, code, state, client secret, or encryption key.

---

## 28. Audit behavior

Existing append-only events via B RPCs:

- `social_connection_initiated` on create intent
- `social_connection_established` / `social_connection_reauthorized` on finalize

No tokens/state/code/ciphertext in payloads.

---

## 29. Redirect safety

Continuation uses closed return-path id `social_workspace` → `/` via `resolveSafeReturnPath`, plus controlled `social_oauth=<outcome>` query.

Open redirects rejected. Provider error descriptions are not echoed into the URL.

---

## 30. Tests added

New/updated C-focused files listed in §6. Coverage includes state, auth URL, initiation auth matrix, callback validation, provider adapter, credential encrypt path (mocked RPC), unsupported account, duplicate connection, feature gates, client-safe/static secret scan, no-migration proof.

---

## 31. Targeted test results

SMM A+B+C targeted:

```text
Test Files  22 passed (22)
     Tests  121 passed (121)
```

B1.1-A and B1.1-B suites remained green within this run.

---

## 32. Full Vitest result

```text
Test Files  317 passed (317)
     Tests  2230 passed (2230)
```

Previous baseline: `310 files / 2192 tests PASS`.

---

## 33. Typecheck / lint / build

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — includes `ƒ /api/social/instagram/callback` |

---

## 34. Database / migration review

```text
NO DATABASE MIGRATION REQUIRED FOR SMM-B1.1-C
```

Existing B migration `20260815130220_add_social_connection_credential_foundation.sql` already provides all required tables/RPCs. Local/remote Production history unchanged by C. No Production schema apply in this slice.

---

## 35. Production configuration status

Feature gates: expected OFF / absent (equivalent OFF). Not enabled by this slice.

Instagram client id/secret: not provisioned by this slice.

Redirect URI registration in Meta App Dashboard remains an owner prerequisite before live OAuth.

---

## 36. Production encryption-key status

`SOCIAL_CREDENTIAL_ENCRYPTION_KEY`: **not configured** (unchanged from B1.1-B).

Automated tests use ephemeral injected keys only.

Before first real Production token:

```text
OWNER ACTION REQUIRED — PRODUCTION SOCIAL CREDENTIAL ENCRYPTION KEY MUST BE PROVISIONED BEFORE FIRST REAL TOKEN
```

Also required before live OAuth: Instagram client id/secret + registered redirect URI + feature gates explicitly enabled by owner.

---

## 37. Meta / Instagram secret status

| Secret | Status |
| --- | --- |
| Instagram client id | not configured in this slice |
| Instagram client secret | not configured in this slice |
| Encryption key | not configured |
| Real OAuth | not executed |

No secret values printed, committed, or requested.

---

## 38. Controlled live verification status

```text
CONTROLLED PRODUCTION OAUTH VERIFICATION NOT EXECUTED
```

Blocked pending owner-controlled:

1. Provision `SOCIAL_CREDENTIAL_ENCRYPTION_KEY` (32-byte standard base64)
2. Provision `SOCIAL_INSTAGRAM_CLIENT_ID` / `SOCIAL_INSTAGRAM_CLIENT_SECRET`
3. Register exact redirect URI in Meta App Dashboard
4. Explicitly enable social feature gates in the approved environment
5. Separate owner authorization for a controlled live OAuth test

---

## 39. Production data state

Not mutated by C application deployment in this slice. Expected remains:

| Object | Expected |
| --- | --- |
| Social connections | 0 (unless later owner live test) |
| OAuth intents | 0 |
| Provider credentials | 0 |
| Social connection events | 0 (beyond prior baseline) |

No Production DB write performed for C.

---

## 40. External-effect statement

```text
0 OAUTH AUTHORIZATIONS
0 INSTAGRAM ACCOUNTS CONNECTED
0 REAL PROVIDER TOKENS RECEIVED
0 INSTAGRAM HTTP REQUESTS (production/live)
0 PROVIDER API CALLS (production/live)
0 PROVIDER API MUTATIONS
0 SOCIAL POSTS
0 SOCIAL STORIES
0 WEBHOOK SUBSCRIPTIONS
0 REAL SOCIAL CREDENTIAL ROWS
0 SOCIAL CONNECTIONS CREATED IN PRODUCTION
0 SMM CONNECTION FEATURE GATES ENABLED
```

Automated tests used mocked `fetch` only.

---

## 41. Security review

| Area | Result |
| --- | --- |
| CSRF / state protection | **PASS** — random state + fingerprint + intent cookie |
| State entropy | **PASS** — 32 random bytes |
| State / intent replay | **PASS** — single-use consume |
| Callback actor binding | **PASS** — auth.uid must match initiator |
| Tenant isolation | **PASS** — org re-read + RPC tenant binding |
| Privilege escalation | **PASS** — Owner/Admin only |
| Open redirects | **PASS** — allowlisted continuation |
| SSRF | **PASS** — fixed HTTPS endpoints; no user URLs |
| Scope / redirect injection | **PASS** — server-owned |
| Secret / client-bundle leakage | **PASS** |
| Log leakage | **PASS** — no console secret logging |
| Encryption / AAD / CAS | **PASS** — reused B foundation |
| Feature-gate fail-closed | **PASS** |
| Abuse limiter fail-closed | **PASS** — existing RPC |
| Personal account rejection | **PASS** |

No unexplained FAIL.

---

## 42. Static secret scan

Targeted searches over SMM OAuth modules/tests for realistic token/secret patterns: **no matches**.

Field/type names exist; secret values do not.

---

## 43. Residual risks

1. **Owner/Admin JWT can still load ciphertext envelopes** via B RPC (documented in B). Decryption still requires server key.
2. **Failed post-consume flows leave `authorization_pending` shells** until reconnect/disconnect UX (later). Intent is burned correctly.
3. **Live Production OAuth not verified** — depends on owner secrets + gate enablement.
4. **Workspace physical FK still deferred** to B1.2; typed UUID accepted and stored.
5. **Capability snapshot empty at connect** — intentional; discovery/publish scopes are later slices.

None are unexplained security FAILs for C closure.

---

## 44. Closure criteria (implementation)

| Criterion | Result |
| --- | --- |
| Git baseline verified | PASS |
| A/B contracts preserved | PASS |
| State generation + fingerprint | PASS |
| Intent persistence reused | PASS |
| Authorization URL locked | PASS |
| Callback route | PASS |
| Single-use consume | PASS |
| Code exchange + validation | PASS |
| Identity / professional type | PASS |
| AES-256-GCM reuse | PASS |
| Private credential upsert | PASS |
| Finalize connection | PASS |
| Token-free redirect | PASS |
| Feature gates fail-closed | PASS |
| No service-role expansion | PASS |
| No new migration | PASS |
| Targeted tests PASS | PASS (121) |
| Full Vitest PASS | PASS (2230) |
| Typecheck/lint/build PASS | PASS |
| No real OAuth / tokens | PASS |
| Evidence complete | PASS |
| Commit/push / `0 0` clean | PASS after publication |

---

## 45. Commits / push

| Full hash | Subject |
| --- | --- |
| `e7db47371422d775f7172998568481fa46bb1945` | `feat(smm): add secure instagram oauth connection flow` |
| *(this evidence commit)* | `docs(smm): close B1.1-C instagram oauth flow` |

Pushed to `origin/core/platform-readiness-20260707`.

---

## 46. Final Git state

Recorded after push verification in the closing report. Expected: HEAD = evidence commit; upstream/origin same; divergence `0 0`; worktree clean.

---

## 47. Next boundary

```text
SMM-B1.1-D NOT YET AUTHORIZED
```

Do not start capability discovery expansion, publishing adapters, connection UI, or Production gate enablement without separate owner authorization.
