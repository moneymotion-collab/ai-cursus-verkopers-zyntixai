# SMM-B1.1-R A2-FIX — Existing Credential Refresh + Connected-State Reauthorization Finalization — Evidence

**Phase:** `SMM-B1.1-R A2-FIX`  
**Date:** 2026-08-20  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw`

```text
SMM-B1.1-R A2-FIX CLOSED WITH EVIDENCE — A2 RETRY READY
```

```text
NO LIVE META AUTHORIZATION EXECUTED
NO PRODUCTION INSTAGRAM CONNECTION ROW MUTATED
NO DISCONNECT EXECUTED
SOCIAL_PUBLISHING_ENABLED REMAINS OFF
SMM-B1.7-R2 NOT STARTED
```

The blocked A2 preflight remains authoritative in:

`docs/phases/SMM-B1.1-R-A2-controlled-production-reauthorization-evidence.md`

That document still records `SMM-B1.1-R A2 BLOCKED`. This file does not rewrite that verdict.

---

## A. Baseline

| Check | Result |
| --- | --- |
| Path | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `cb9cd0bdf745014609c582f24286ca2f93c0931f` |
| A2 blocked evidence commit | `f91d93001a06df13ba94e793a19dfa606c85211b` |
| Implementation HEAD | `150257344f0c2d3e065d6156a808f2f8a809fbe1` |
| Evidence commit | `2b8ea40a744a5093960a46b4297b42d185cae243` |
| Upstream at start | `origin/core/platform-readiness-20260707` |
| Divergence at start | `0 0` |
| Worktree at start | clean except expected uncommitted A2 blocked evidence |
| Blocked A2 verdict | `SMM-B1.1-R A2 BLOCKED` — no live OAuth |

---

## B. Root cause

### A2-D1 — credential first-insert semantics on reauthorize

The OAuth callback always called `upsert_social_provider_credential` with `expectedCredentialVersion: 0` and a new credential UUID. Production already has `credential_version = 1` for connection `24420652-d0b4-4237-9a75-51d89be50c65`. The RPC returns `stale_version` after the reauthorize intent is consumed.

### A2-D2 — `finalize_social_connection` rejects `connected`

Ordinary finalize still only accepts `authorization_pending` or `reauthorization_required`. A healthy Reconnect must not mark the live row `reauthorization_required` just because the owner clicked Reconnect. Adding `connected` to that global list would also let ordinary connect finalize rewrite an established row.

---

## C. Implementation

| File | Reason |
| --- | --- |
| `src/features/social-media/server/credential-repository.ts` | `resolveSocialCredentialUpsertTarget`: connect remains version 0; reauthorize loads existing envelope id/version only |
| `src/features/social-media/server/handle-instagram-oauth-callback.ts` | Identity fail-closed first; then resolve target; then upsert; then kind-specific finalize |
| `src/features/social-media/server/oauth-intent-repository.ts` | Adapter for `finalize_social_reauthorization` |
| `src/features/social-media/domain/status.ts` | `REAUTHORIZATION_FINALIZABLE_SOCIAL_CONNECTION_STATUSES` = reconnectable set |
| `src/features/social-media/domain/index.ts` | Export the new helper |
| `supabase/migrations/20260820120000_add_social_reauthorization_connected_finalize.sql` | New RPC; does **not** replace `finalize_social_connection` |
| `tests/features/social-media/handle-instagram-oauth-reauthorization.test.ts` | Production-shaped connected + v1/vN, stale, identity, replay, connect regression |
| `tests/features/social-media/resolve-social-credential-upsert-target.test.ts` | Version 0 vs loaded version; ciphertext not returned |
| `tests/features/social-media/handle-instagram-oauth-callback.test.ts` | Connect does not load/reauth-finalize; identity mismatch skips load |
| `tests/domain/social-connection-lifecycle.test.ts` | Reconnect/finalize status table |
| `tests/security/social-a2-fix-reauthorization-finalize-security.test.ts` | RPC contract: intent bind, no `p_connection_id`, grants |
| Inventory tests | Additive social migration filename lists / latest-file pointers |

---

## D. Credential lifecycle

| Path | Identity | Expected version | Resulting version |
| --- | --- | --- | --- |
| First-time `connect` | new UUID | `0` | insert at `1` |
| Reauthorize | existing `credential_id` | loaded `N` | `N + 1` via existing CAS |

Reauthorize never assumes Production's current `1`. Ciphertext from `load_social_provider_credential_envelope` is not reused; a new envelope is encrypted server-side and written with the existing id + expected version. `stale_version` remains fail-closed. One authoritative credential row per connection.

---

## E. Finalization lifecycle

`finalize_social_connection` is **unchanged**. Generic finalize of a `connected` row remains `conflict`.

New `finalize_social_reauthorization(p_intent_id, ...)` loads the connection **from the consumed intent**, not from a client-supplied connection UUID.

Required:

- `auth.uid()` = intent initiating actor
- Owner/Admin `can_manage_social_connections`
- active organization
- `intent_kind = reauthorize`
- `status = consumed` and `consumed_at` within 30 minutes
- provider Instagram
- connection status in `connected` / `reauthorization_required` / `permission_missing`
- expected identity = returned identity = existing `external_account_id`
- `last_refreshed_at >= consumed_at` (credential refresh in this lifecycle)
- no `social_connection_reauthorized` event already recorded at/after this consume

Then: same UUID stays `connected` / `healthy`, identity unchanged, event `social_connection_reauthorized`.

| Existing state | Manual reconnect (UI) | Reauth finalize (new RPC) | Ordinary `finalize_social_connection` |
| --- | ---: | ---: | ---: |
| `connected` | YES | YES | NO |
| `reauthorization_required` | YES | YES | YES (unchanged) |
| `permission_missing` | YES | YES | NO |
| `authorization_pending` | NO | NO | YES (connect only) |
| `initiated` | NO | NO | NO |
| `disconnected` | NO | NO | NO |
| `revoked` | NO | NO | NO |

---

## F. Identity safety

Callback still compares `consumed.expectedExternalAccountId` to `/me` **before** envelope load, upsert, or finalize. Mismatch → opaque `connection_failed` / `professional_identity_fetch`. SQL repeats identity equality and refuses to `UPDATE` a different `external_account_id`.

---

## G. Transaction / partial-failure analysis

Consume, upsert, and finalize remain separate RPCs (encryption is application-side). Combined consume+encrypt+finalize was not required to close D1/D2 and would have mixed crypto into SQL.

| Case | Behavior |
| --- | --- |
| Success | consume → identity match → load version N → upsert N→N+1 → finalize reauth → `social_connection_reauthorized` |
| Wrong identity | consume already done; **no** load/upsert/finalize; identity unchanged |
| Stale credential | consume done; upsert `stale_version`; **no** finalize; existing ciphertext remains |
| Upsert succeeds, finalize fails | token refreshed on the same UUID; no reauth event; status unchanged; recovery is a new Reconnect (new intent). For a previously `connected` row the account remains usable. Finalize also refuses unless `last_refreshed_at >= consumed_at`, so skipping upsert cannot finalize. |

Intent consume-before-exchange is unchanged (replay protection). Automatic retry of a consumed intent remains denied.

---

## H. Database migration

| Item | Result |
| --- | --- |
| Required | **YES** — new RPC only |
| Local file | `supabase/migrations/20260820120000_add_social_reauthorization_connected_finalize.sql` |
| Overwrite of applied migration | **NO** |
| Production apply | MCP `apply_migration` name `add_social_reauthorization_connected_finalize` on `dmctinrcjvsgmoxwwodw` |
| Remote tip before apply | `20260819101032_harden_b18_start_controlled_publish_window_binding` |
| `finalize_social_connection` | still present, unchanged |
| `finalize_social_reauthorization` | present after apply |

---

## I. Tests

### Targeted A2-FIX

```text
npx vitest run tests/features/social-media/handle-instagram-oauth-reauthorization.test.ts tests/features/social-media/handle-instagram-oauth-callback.test.ts tests/features/social-media/resolve-social-credential-upsert-target.test.ts tests/features/social-media/initiate-instagram-reauthorization.test.ts tests/features/social-media/oauth-client-safety.test.ts tests/domain/social-connection-lifecycle.test.ts tests/security/social-a2-fix-reauthorization-finalize-security.test.ts tests/security/social-connection-migration-security.test.ts tests/security/social-closed-beta-operator-r1b-migration-security.test.ts tests/security/social-closed-beta-enrollment-migration-security.test.ts tests/security/social-closed-beta-entitlement-defense-r1ar1.test.ts
```

**11 files, 68 passed / 0 failed**

### Social feature regression

```text
npx vitest run tests/features/social-media
```

**31 files, 182 passed / 0 failed**

### Domain + security (includes all Social domain/security files)

```text
npx vitest run tests/domain tests/security
```

**75 files, 525 passed / 0 failed**

### Full Vitest

```text
npx vitest run
```

| Result | Count |
| --- | --- |
| Files | 356 passed / **2 failed** |
| Tests | 2488 passed / **2 failed** |

A0 baseline was 353 passed / 2 failed files and 2472 passed / 2 failed tests. Delta is the new A2-FIX coverage (+3 files, +16 tests). The two failures are the **same pre-existing non-Social** tests; not repaired in this phase:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

---

## J. Static / build

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS — no ESLint warnings or errors |
| `npx next build` | PASS |
| Pre-existing warning | `platform-closed-beta-operator-list.module.css` autoprefixer `flex-end` (unchanged file) |

---

## K. Production mutation statement

| Item | Result |
| --- | --- |
| Live OAuth | **NO** |
| Production Reconnect | **NO** |
| Production connection row mutated | **NO** — still `connected` / `healthy`, fingerprint `eefce660bad5c0ad`, credential version `1`, `updated_at` `2026-08-18 12:37:28+00` |
| New active connection | **NO** |
| Pending shells | **6**, unchanged |
| Publishing enabled | **NO** |
| Provider content write | **NO** |
| Instagram post | **NO** |
| Disconnect | **NO** |
| Schema | additive RPC `finalize_social_reauthorization` applied |

Application TypeScript is not live until Production is redeployed from the published HEAD. Do not click Reconnect until that deploy is complete.

---

## L. Remaining action

```text
SMM-B1.1-R A2 — CONTROLLED PRODUCTION REAUTHORIZATION RETRY
```

Only after the Production app deploy that includes this HEAD. Do **not** start SMM-B1.7-R2.

---

## M. Verdict

```text
SMM-B1.1-R A2-FIX CLOSED WITH EVIDENCE — A2 RETRY READY
```
