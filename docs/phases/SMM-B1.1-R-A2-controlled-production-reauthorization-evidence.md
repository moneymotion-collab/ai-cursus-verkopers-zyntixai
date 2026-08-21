# SMM-B1.1-R A2 — Controlled Production Reauthorization — Evidence

**Phase:** `SMM-B1.1-R A2 — CONTROLLED PRODUCTION REAUTHORIZATION ONLY`  
**Date:** 2026-08-20  
**Latest POST verification:** 2026-08-21  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw`  
**Canonical origin:** `https://www.zyntixai.com`

**Latest status (2026-08-21):**

```text
INSTAGRAM PRODUCTION OAUTH PASS
SMM-B1.1-R A2 CLOSED WITH EVIDENCE
SMM-B1.7-R2 NOT STARTED
```

Historical blocked attempts below are preserved and are not rewritten.

---

```text
SMM-B1.1-R A2 BLOCKED — reconnect callback cannot complete on the existing healthy Production Instagram connection
```

```text
NO LIVE META AUTHORIZATION EXECUTED
NO PRODUCTION SOCIAL CONNECTION MUTATED
NO DISCONNECT EXECUTED
SOCIAL_PUBLISHING_ENABLED MUST REMAIN OFF
SMM-B1.7-R2 NOT STARTED
```

Live Reconnect was **not** started. Cursor cannot authenticate as Owner on Production, and the reconnect callback path would fail closed against the PRE-A2 `connected` row. Sending the owner through Meta OAuth in this state would consume a reauthorize intent and return `connection_failed` without completing reauthorization.

---

## N. Verdict

`SMM-B1.1-R A2 BLOCKED — reconnect callback cannot complete on the existing healthy Production Instagram connection`

Target `INSTAGRAM PRODUCTION OAUTH PASS` is **not** claimed.

Classification of the blocking defects:

| ID | Severity | Defect |
| --- | --- | --- |
| A2-D1 | **BLOCKER** | OAuth callback always upserts credentials with `expectedCredentialVersion: 0` and a new credential UUID. Production already has `credential_version = 1`. `upsert_social_provider_credential` returns `stale_version`. Callback maps that to `connection_failed` / `credential_encrypt_or_upsert`. Intent is already consumed. Existing ciphertext is not overwritten. |
| A2-D2 | **BLOCKER** | `create_social_reauthorization_intent` does not change connection status. `finalize_social_connection` only accepts `authorization_pending` or `reauthorization_required`. The Production row is `connected`. Even after A2-D1, finalize would return `conflict` and would not emit `social_connection_reauthorized`. |

Smallest corrective phase required (do **not** implement in A2):

`SMM-B1.1-R A2-FIX` — Reconnect credential refresh + connected-status finalize.

Out of scope until that phase is approved and closed:

- Clicking Production **Reconnect Instagram**
- Ordinary Connect
- Disconnect of the live Instagram account
- Enabling publishing
- Any Instagram publish
- SMM-B1.7-R2

---

## A. Authoritative repository state

Recorded before any Production mutation attempt.

| Check | Result |
| --- | --- |
| Path | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `cb9cd0bdf745014609c582f24286ca2f93c0931f` |
| HEAD subject | `docs(smm): pin SMM-B1.1-R A0 evidence SHA fields` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` (in sync) |
| Worktree | clean |
| Implementation included | `8c47ae395743d6dee1c587d43a776139e0de2ac7` (A0 reconnect/disconnect wiring) |
| Database migration this phase | **NONE** |

---

## B. A1 owner configuration confirmation

Owner attestation accepted as authoritative for A2. Cursor did not pull Production secret values.

| Item | Owner result |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | correct for `https://www.zyntixai.com` |
| `SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI` | exactly matches the canonical Production callback |
| Meta Valid OAuth Redirect URI | matches |
| Instagram account | intended Professional/Business account |
| Social connection gates/configuration | correct |
| `SOCIAL_PUBLISHING_ENABLED` | remains **false** |
| Production redeploy | completed with the saved environment configuration |

A2 did not change environment configuration.

---

## C. PRE-A2 Production Social baseline

Queried on Production project `dmctinrcjvsgmoxwwodw`. No access tokens, ciphertext, client secrets, or encryption keys are recorded.

### Active Instagram connection

| Field | PRE-A2 value |
| --- | --- |
| Connection UUID | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Organization UUID | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Workspace UUID | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` |
| Provider | `instagram` |
| Login product | `instagram_login` |
| Status | `connected` |
| Health | `healthy` |
| Professional account type | `business` |
| External identity fingerprint | SHA-256 prefix `eefce660bad5c0ad` (16 hex) |
| Display name | present (value not recorded) |
| Credential ref | present |
| Private credential rows | `1` |
| Ciphertext / IV / auth tag | present (values not recorded) |
| Encryption version | `1` |
| Credential version | `1` |
| Credential created/updated | `2026-08-18 12:37:28.333391+00` |
| Token expiry flag | present and not expired (`~1390.6` hours remaining at query) |
| `reauthorization_required_at` | null |
| Connected at | `2026-08-18 12:37:28.746184+00` |
| Last refreshed | `2026-08-18 12:37:28.333391+00` |

### Counts

| Metric | PRE-A2 |
| --- | --- |
| Active Instagram connections (`connected` / `reauthorization_required` / `permission_missing`) | **1** |
| `authorization_pending` Instagram shells | **6** |
| Instagram rows by status | `authorization_pending=6`, `connected=1` |
| OAuth intents | `connect/consumed=7`; **0** in-flight; **0** `reauthorize` intents |
| Intent bound to the active connection | 1 consumed `connect` intent (`2026-08-18 12:37:14` → consumed `12:37:26`) |
| `social_connection_events` total | **8** |
| Events on the active connection | `social_connection_initiated=1`, `social_connection_established=1` |
| Org-wide event types | `initiated=7`, `established=1` |
| Closed-beta enrollment | `publishing_allowed` (`publishing_allowed_at` set `2026-08-18 23:34:31+00`) |
| `social_publications` | 11 total (`queued=6`, `succeeded=3`, `manual_intervention=2`); latest create `2026-08-19 11:01:56+00` |

Enrollment `publishing_allowed` is **organization entitlement**, not the application kill switch. Owner A1 still holds `SOCIAL_PUBLISHING_ENABLED=false`. A2 did not execute any publication.

### Historical pending shells (must remain untouched)

| UUID | Created |
| --- | --- |
| `2e95f4df-f757-48ec-bb67-ad38b63f029c` | `2026-08-18 10:12:34+00` |
| `26cf7ed0-cd9b-444a-9abf-7d0752a83c32` | `2026-08-18 10:12:56+00` |
| `8e844090-d54a-4b0d-a92e-c79c26f944b5` | `2026-08-18 11:43:31+00` |
| `327c1115-5d06-482b-a416-f7009b4d5560` | `2026-08-18 11:58:03+00` |
| `7dd435ba-9bfd-4eee-9696-8f558ce969cd` | `2026-08-18 12:11:05+00` |
| `60ecf884-fc9f-49d1-b803-6608ea216aeb` | `2026-08-18 12:26:38+00` |

---

## D. Exact controlled browser flow executed

**Not executed.** Cursor reached Production unauthenticated and stopped.

Observed only:

1. Open `https://www.zyntixai.com`
2. Redirected to `https://www.zyntixai.com/login?next=%2Fhome%3Forg%3D2fc07699-ece5-44b9-bbb3-abbc23e9fffb`
3. Sign-in form present (Email, Password, Sign in)
4. No Owner session in the Cursor browser
5. `/social` Accounts was not opened
6. **Reconnect Instagram was not clicked**
7. Meta/Instagram authorization was not started
8. `/api/social/instagram/callback` was not hit in this phase

Would-be Owner flow (do **not** run until A2-FIX is closed):

`https://www.zyntixai.com` → Owner/Admin sign-in → `/social` → Accounts → existing connected Instagram → **Reconnect Instagram** → Meta authorize the **same** Professional/Business account → `/api/social/instagram/callback` → `/social?social_oauth=connected`

That path must use `create_social_reauthorization_intent` / `initiateInstagramReauthorizationAction`, not `create_social_connection_intent`.

Do **not** click Connect Instagram. Do **not** click Disconnect Instagram.

---

## E. OAuth callback outcome

**Not observed.** Live OAuth was not started.

Predicted fail-closed outcome if Reconnect were executed against the PRE-A2 row, in callback order:

1. Intent consume succeeds (`reauthorize`, expected identity bound).
2. Provider token exchange and `/me` identity fetch may succeed.
3. TypeScript identity binding still fail-closes if the returned Instagram account ≠ intent `expected_external_account_id` (no credential write, no finalize). That part is already covered by tests.
4. On identity match, credential upsert uses version `0` + new UUID → Production `stale_version` (A2-D1) → redirect `connection_failed` with opaque stage `credential_encrypt_or_upsert`.
5. Finalize is not reached. If it were, A2-D2 would return `conflict` because status is `connected`.

---

## F. Pre/post connection comparison

| Check | PRE | POST | Expected for PASS |
| --- | --- | --- | --- |
| Active Instagram count | 1 | **unchanged** (no live OAuth) | UNCHANGED |
| Connection UUID | `24420652-d0b4-4237-9a75-51d89be50c65` | **unchanged** | UNCHANGED |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` | **unchanged** | UNCHANGED |
| Provider | `instagram` | **unchanged** | UNCHANGED |
| Status | `connected` | **unchanged** | connected / healthy |
| External identity fingerprint | `eefce660bad5c0ad` | **unchanged** | UNCHANGED |
| Pending shells | 6 | **unchanged** | UNCHANGED |
| Credential | present, version 1 | **unchanged** | present / refreshed |
| Credential updated_at | `2026-08-18 12:37:28.333391+00` | **unchanged** | may advance on successful refresh |
| Publications latest create | `2026-08-19 11:01:56+00` | **unchanged** | UNCHANGED |

---

## G. Tenant / identity safety result

Live identity binding was not exercised.

Repository/callback already fail-closes before credential write when `consumed.expectedExternalAccountId !== /me` professional id (`provider_mismatch` / `professional_identity_fetch`). SQL `identity_mismatch` currently applies only when status is already `reauthorization_required`, so A2-FIX must also fail-close identity on a `connected` reauthorize finalize.

No account takeover was possible in this phase because Reconnect was not started.

---

## H. Credential / client-safety result

Browser observation on the login URL:

- URL contained only `next=/home?org=…`
- No access token in the URL
- No provider credential rendered
- `/social` action results were not reachable (unauthenticated)

Repository (A0, still at HEAD):

- Reauthorize action returns `{ authorizationUrl }` only
- Callback continuation uses allowlisted `social_oauth` outcome codes
- Tokens are never added to the redirect query

Production credential material was not printed. Ciphertext remains server-side.

---

## I. Audit / event evidence

PRE: 8 `social_connection_events` total; 2 on the active connection (`initiated`, `established`).

POST: **no delta** (no live OAuth).

Expected after a successful A2 reauthorization (future): append `social_connection_reauthorized` on the same connection UUID, without deleting historical events.

---

## J. Pending-shell delta

PRE `authorization_pending` count: **6** (IDs frozen in section C).

POST: **UNCHANGED**. A2 did not create an ordinary connect shell and did not delete historical pending rows.

---

## K. Publishing gate confirmation

| Gate | Result |
| --- | --- |
| Owner A1 `SOCIAL_PUBLISHING_ENABLED` | false |
| A2 code/env change | none |
| Provider content write this phase | **NONE** |
| Instagram post created this phase | **NO** |
| Publication row count / latest create | unchanged vs PRE |

Closed-beta enrollment remains `publishing_allowed`. That does not enable the application publishing kill switch.

---

## L. Tests / regression evidence

No application code was changed in A2.

Targeted reconnect/OAuth regression at HEAD `cb9cd0b` (2026-08-20): **46 passed / 6 files** (`initiate-instagram-reauthorization`, `handle-instagram-oauth-callback`, `oauth-client-safety`, `initiate-instagram-connection`, `oauth-callback-redirect`, `social-connection-lifecycle`). These mocks still stub credential upsert as version `0` and do not exercise Production `connected` finalize, so they do not contradict A2-D1/A2-D2.

Preserved A0 coverage that remains necessary after A2-FIX:

| Area | Tests |
| --- | --- |
| Initiate reauthorization | `tests/features/social-media/initiate-instagram-reauthorization.test.ts` |
| Callback identity binding | `tests/features/social-media/handle-instagram-oauth-callback.test.ts` (`fail-closes reconnect when returned Instagram identity does not match`) |
| Replay / consume | callback + `oauth-intent` tests |
| Client safety | `oauth-client-safety.test.ts`, reauthorize action result shape |
| Tenant/authorization | closed-beta on initiate/reauthorize; org-owned connection bind |

Gap exposed by A2 (not covered by current mocks, which stub RPC success and always upsert version `0`):

- Reauthorize against an existing `credential_version >= 1` envelope
- `finalize_social_connection` against status `connected` with matching identity

Those tests belong in A2-FIX, not as speculative A2 edits.

---

## M. Production mutation summary

| Item | Result |
| --- | --- |
| Live OAuth | **NO** |
| Existing Instagram connection reauthorized | **NO** |
| Existing connection UUID changed | **NO** |
| New active connection created | **NO** |
| New ordinary pending connection shell | **NO** |
| Instagram identity changed | **NO** |
| Production credential refreshed | **NO** |
| Publishing enabled | **NO** |
| Provider content write | **NO** |
| Instagram post created | **NO** |
| Disconnect executed | **NO** |
| Historical `authorization_pending` rows deleted | **NO** |

---

## Smallest corrective phase (A2-FIX)

Do not implement during A2. Do not click Production Reconnect until this phase is closed.

1. **Credential refresh for `reauthorize`:** after identity match, load the existing private envelope for the consumed connection. Upsert with the existing `credential_id` and current `credential_version`. Keep `expectedCredentialVersion: 0` only for first-time `connect`. Never print token or ciphertext.
2. **Finalize a healthy reconnect:** allow `finalize_social_connection` to succeed on status `connected` when the returned Instagram id equals the existing `external_account_id` (same UUID, same org, same provider). Emit `social_connection_reauthorized`. Do **not** insert a new connection row. Do **not** mark the live row `reauthorization_required` merely because Reconnect was clicked (abandoning Meta would otherwise degrade a healthy Production account).
3. **Defense in depth:** SQL identity fail-closed for `connected` reauthorize, matching the TypeScript check. If identity mismatches: stop, do not overwrite, do not bind, do not retry automatically.
4. **Tests:** reconnect + existing credential version; identity mismatch skips upsert/finalize; finalize `connected` + matching id; finalize `connected` + mismatched id does not update identity.

After A2-FIX is deployed, repeat this A2 procedure from a fresh PRE baseline.

---

## Owner action now

1. Do **not** click **Reconnect Instagram** on Production.
2. Do **not** click **Disconnect Instagram**.
3. Do **not** start ordinary Connect.
4. Do **not** enable `SOCIAL_PUBLISHING_ENABLED`.
5. Do **not** start SMM-B1.7-R2.
6. Approve `SMM-B1.1-R A2-FIX` explicitly before any reconnect implementation or live OAuth retry.

---

## RETRY — 2026-08-20 — Production app not on A2-FIX HEAD

A2-FIX was later closed (`1502573` / evidence HEAD `5eb86a2`) and the Production SQL RPC `finalize_social_reauthorization` is live. This retry **did not** execute live OAuth.

Original A2 result above remains:

```text
SMM-B1.1-R A2 BLOCKED — reconnect callback cannot complete on the existing healthy Production Instagram connection
```

Retry result:

```text
SMM-B1.1-R A2 RETRY BLOCKED — PRODUCTION APP NOT ON APPROVED A2-FIX HEAD
```

### Approved Git HEAD

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `5eb86a200ecaaf51fafdda50cee32302e4e7254c` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |
| A2-FIX implementation | `150257344f0c2d3e065d6156a808f2f8a809fbe1` (ancestor of HEAD) |

### Production application deployment

Inspected via Vercel CLI against aliases `www.zyntixai.com` and `zyntixai.vercel.app` (scope `guus-projects-ai`, project `zyntixai`). Not inferred from GitHub.

| Field | Observed |
| --- | --- |
| Deployment id | `dpl_5fMUxiVsmt1sniak56htDWSS44mq` |
| Deployment URL | `https://zyntixai-nj3xnqme1-guus-projects-ai.vercel.app` |
| Target | production |
| State | Ready |
| Created | 2026-08-20 13:31:14 GMT+0200 |
| Aliases | `https://www.zyntixai.com`, `https://zyntixai.vercel.app`, `https://zyntixai.com` |
| `gitCommitSha` | `f559001dafc4656f173df7ffa478d32c4791afe5` |
| `gitCommitMessage` | `fix(org): deny silent single-org fallback for foreign org query params` |
| `gitCommitRef` | `core/platform-readiness-20260707` |
| Action | `redeploy` of `dpl_89FSF8D5pKuJYuCuQnGvsw1PRscd` |

`f559001` **is** an ancestor of `5eb86a2`, but it does **not** contain A2-FIX (`1502573`). No Production deployment in the current prod list carries `5eb86a2`, `1502573`, or later A2-FIX evidence SHAs.

`www.zyntixai.com` currently points at this older Ready deployment.

### Production SQL (safe read, no mutation)

RPC `public.finalize_social_reauthorization` **is** present. Database is ahead of the application.

### PRE baseline at retry (no OAuth)

| Field | Value |
| --- | --- |
| Active Instagram connections | 1 |
| Connection UUID | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Provider | `instagram` |
| Status | `connected` |
| Health | `healthy` |
| Account type | `business` |
| Identity fingerprint | `eefce660bad5c0ad` |
| Credential present | yes |
| Credential version | 1 |
| Ordinary `authorization_pending` shells | 6 |
| In-flight reauthorize intents | 0 |
| OAuth intents | `connect/consumed=7` only |
| `social_connection_events` | 8; latest `social_connection_established` at `2026-08-18 12:37:28+00` |
| Events on this connection | initiated 1, established 1 |
| Live OAuth this retry | **NO** |

### Owner browser steps

**Not issued.** Reconnect was not started because the Production app is not on the approved A2-FIX HEAD.

### Production mutation summary (this retry)

| Item | Result |
| --- | --- |
| Live OAuth | **NO** |
| Existing Instagram connection reauthorized | **NO** |
| Existing connection UUID changed | **NO** |
| Instagram identity changed | **NO** |
| Credential refreshed | **NO** |
| New active connection | **NO** |
| New ordinary pending shell | **NO** |
| Disconnect | **NO** |
| Publishing enabled | **NO** |
| Provider content write | **NO** |
| Instagram post created | **NO** |
| Historical pending shells deleted | **NO** |

### Required owner action

1. Deploy approved HEAD `5eb86a200ecaaf51fafdda50cee32302e4e7254c` (or a later commit that contains A2-FIX) to Vercel **Production**.
2. Confirm `www.zyntixai.com` aliases that Ready deployment and `gitCommitSha` matches.
3. Re-authorize **SMM-B1.1-R A2** retry only after that confirmation.
4. Do **not** click Reconnect Instagram until then.
5. Do **not** start SMM-B1.7-R2.

---

## RETRY — 2026-08-21 — Controlled Production Reauthorization POST verification

Owner completed Production **Reconnect Instagram** using the intended existing Instagram Business account. This section is a **read-only** POST verification. No second OAuth flow was started. No Connect / Reconnect / Disconnect was clicked by the verifier. Publishing was not enabled. SMM-B1.7-R2 was not started.

A2-FIX reference: implementation `150257344f0c2d3e065d6156a808f2f8a809fbe1`; prior retry blocked because Production still served `f559001`.

### Owner flow (reported completed)

1. Open `https://www.zyntixai.com/social`
2. Existing Instagram account shown as connected
3. Click **Reconnect Instagram** (not Connect, not Disconnect)
4. Authorize the same Instagram Business account
5. OAuth callback returned to ZyntixAI

Verifier did not emulate Meta login and did not start another Reconnect.

### POST connection

| Field | POST |
| --- | --- |
| Active Instagram connections | **1** |
| Connection UUID | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Workspace | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` |
| Provider | `instagram` |
| Account type | `business` |
| Status | `connected` |
| Health | `healthy` |
| Identity fingerprint | `eefce660bad5c0ad` |
| `connected_at` | `2026-08-18 12:37:28.746184+00` (unchanged from original connect) |
| `updated_at` | `2026-08-21 10:30:16.759794+00` |
| `reauthorization_required_at` | null |

### POST credential (metadata only)

| Field | POST |
| --- | --- |
| Credential present | yes |
| Credential id | `5c259900-6d60-4fdb-875c-60097daff514` |
| Envelope count for this connection | **1** |
| Credential version | **2** |
| Encryption version | 1 (metadata only) |
| Envelope `created_at` | `2026-08-18 12:37:28.333391+00` (same envelope as PRE) |
| Envelope `updated_at` / `last_refreshed_at` | `2026-08-21 10:30:16.624813+00` |

No access token, ciphertext, encryption key, or client secret was retrieved.

### POST reauthorization intents

Non-expired in-flight `reauthorize` intents: **0**

Successful retry intent:

| Field | Value |
| --- | --- |
| Intent UUID | `20013068-f582-4aff-afa6-d71c3dd84800` |
| Kind | `reauthorize` |
| Status | `consumed` |
| Created | `2026-08-21 10:29:49.632657+00` |
| Expires | `2026-08-21 10:44:49.576+00` |
| Consumed | `2026-08-21 10:30:14.662448+00` (exactly once) |
| Bound connection | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Bound organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Expected external identity bound | yes (value not recorded) |

Historical leftover from the failed 2026-08-20 launch attempt — **preserved, not deleted, not consumed**:

| Field | Value |
| --- | --- |
| Intent UUID | `3b342e31-6d6a-4f64-a29f-14c3de8f0d1c` |
| Kind | `reauthorize` |
| Status | `pending` |
| Created | `2026-08-20 12:22:55.638134+00` |
| Expires | `2026-08-20 12:37:55.383+00` |
| Consumed | null |
| Expired | yes |
| Bound connection | `24420652-d0b4-4237-9a75-51d89be50c65` |

OAuth status totals: `connect/consumed=7`; `reauthorize/consumed=1`; `reauthorize/pending=1` (expired leftover only). Raw OAuth state was not recorded.

Ordinary `finalize_social_connection` still rejects status `connected`. The connection remained `connected` with original `connected_at`. The new `social_connection_reauthorized` event is the established A2-FIX audit from `finalize_social_reauthorization`. Postgres statement logs for the RPC name were not available in the queried window; the event + consumed reauthorize intent + same-envelope version increment is the Production evidence.

### POST ordinary pending shells

Count: **6** (unchanged). Same historical UUIDs:

- `2e95f4df-f757-48ec-bb67-ad38b63f029c`
- `26cf7ed0-cd9b-444a-9abf-7d0752a83c32`
- `8e844090-d54a-4b0d-a92e-c79c26f944b5`
- `327c1115-5d06-482b-a416-f7009b4d5560`
- `7dd435ba-9bfd-4eee-9696-8f558ce969cd`
- `60ecf884-fc9f-49d1-b803-6608ea216aeb`

No seventh ordinary pending shell. Historical shells were not deleted.

### POST audit / events

| Field | POST |
| --- | --- |
| `social_connection_events` total | **9** (was 8) |
| `social_connection_reauthorized` on this connection | **1** (was 0) |
| New `social_connection_established` after original connect | **0** |
| Disconnect / revoked events | **0** |

New event:

| Field | Value |
| --- | --- |
| Event UUID | `b584a80c-9017-4acc-b394-52afeb3c7016` |
| Type | `social_connection_reauthorized` |
| Connection | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Actor source | `member` |
| Actor member present | yes (id not recorded) |
| Timestamp | `2026-08-21 10:30:16.759794+00` |

Events on this connection remain: initiated 1, established 1, reauthorized 1. Org-wide types: initiated 7, established 1, reauthorized 1.

### Publishing safety

| Check | Result |
| --- | --- |
| `social_publications` total | 11 (unchanged vs PRE A2: queued 6, succeeded 3, manual_intervention 2) |
| Latest publication create | `2026-08-19 11:01:56.801808+00` |
| Latest publication update/complete | `2026-08-19 11:44:32.7778+00` |
| Publications created since 2026-08-20 | **0** |
| Publications updated/completed at or after reconnect (`2026-08-21 10:29+00`) | **0** |
| Publication attempts started at or after reconnect | **0** |
| Publication events at or after reconnect | **0** |
| Disconnect events | **0** |
| `SOCIAL_PUBLISHING_ENABLED` | not re-read from Vercel in this POST check; A1 remains `false`; no publication execution occurred |

### PRE / POST comparison

| Field | PRE | POST | Verdict |
| --- | --- | --- | --- |
| Active Instagram connections | 1 | 1 | pass |
| Connection UUID | `24420652-d0b4-4237-9a75-51d89be50c65` | `24420652-d0b4-4237-9a75-51d89be50c65` | unchanged |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` | unchanged |
| Workspace | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` | unchanged |
| Provider | Instagram | Instagram | unchanged |
| Identity fingerprint | `eefce660bad5c0ad` | `eefce660bad5c0ad` | unchanged |
| Status | connected | connected | connected |
| Health | healthy | healthy | healthy |
| Credential version | 1 | 2 | increment |
| Ordinary pending shells | 6 | 6 | unchanged |
| Reauthorized events | 0 | 1 | increment |
| In-flight reauth intents | 0 | 0 | consumed |
| Provider content write | 0 | 0 | unchanged |

### Identity and tenant safety

- Same connection UUID
- Same organization
- Same workspace
- Same provider
- Same identity fingerprint
- No duplicate active Instagram connection
- Historical expired reauthorize leftover preserved

### Regression (no code change)

Narrow A2-FIX suite rerun after POST verification (repository only; Production not mutated):

```text
npx vitest run tests/features/social-media/handle-instagram-oauth-reauthorization.test.ts tests/features/social-media/handle-instagram-oauth-callback.test.ts tests/features/social-media/resolve-social-credential-upsert-target.test.ts tests/features/social-media/initiate-instagram-reauthorization.test.ts tests/features/social-media/oauth-client-safety.test.ts tests/domain/social-connection-lifecycle.test.ts tests/security/social-a2-fix-reauthorization-finalize-security.test.ts tests/security/social-connection-migration-security.test.ts tests/security/social-closed-beta-operator-r1b-migration-security.test.ts tests/security/social-closed-beta-enrollment-migration-security.test.ts tests/security/social-closed-beta-entitlement-defense-r1ar1.test.ts
```

**11 files, 68 passed / 0 failed**

Full Vitest was **not** rerun: no implementation change in this POST verification; last full-suite evidence remains the A2-FIX close (2488 pass / 2 pre-existing non-Social fails).

### Production mutation summary

| Item | Result |
| --- | --- |
| Live OAuth | **YES** |
| Existing Instagram connection reauthorized | **YES** |
| Existing connection UUID changed | **NO** |
| Instagram identity changed | **NO** |
| Credential refreshed | **YES** |
| Credential version | `1 → 2` |
| New active Instagram connection | **NO** |
| New ordinary pending shell | **NO** |
| `social_connection_reauthorized` event | **YES** |
| Disconnect | **NO** |
| Publishing enabled | **NO** |
| Provider content write | **NO** |
| Instagram post created | **NO** |
| Historical pending shells deleted | **NO** |
| Historical expired reauthorize leftover deleted | **NO** |
| SMM-B1.7-R2 started | **NO** |

### Retry verdict

```text
INSTAGRAM PRODUCTION OAUTH PASS
SMM-B1.1-R A2 CLOSED WITH EVIDENCE
```

Do **not** start SMM-B1.7-R2. Do **not** enable publishing. Do **not** publish a test post. The controlled Production publish phase requires a separate explicit owner authorization.
