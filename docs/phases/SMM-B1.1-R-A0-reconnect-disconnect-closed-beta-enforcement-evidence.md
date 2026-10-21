# SMM-B1.1-R A0 — Safe Reconnect / Disconnect Wiring + Closed-Beta Enforcement — Evidence

**Phase:** `SMM-B1.1-R A0 — SAFE RECONNECT / DISCONNECT PRODUCT WIRING + CLOSED-BETA ENFORCEMENT`  
**Date:** 2026-08-20  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw`

```text
SMM-B1.1-R A0 CLOSED WITH EVIDENCE — OWNER ACTION A1 REQUIRED
```

```text
NO LIVE META AUTHORIZATION EXECUTED
NO PRODUCTION SOCIAL CONNECTION MUTATED
SOCIAL_PUBLISHING_ENABLED REMAINS OUT OF SCOPE / MUST REMAIN OFF
```

---

## 1. Executive verdict

Canonical `/social` Accounts now distinguishes **Connect**, **Reconnect**, and **Disconnect**.

- Connect uses the existing OAuth initiate path and refuses to mint another pending shell when an established Instagram connection already exists (`already_connected`).
- Reconnect uses the existing identity-preserving reauthorization RPC/action and does not call `create_social_connection_intent`.
- Disconnect is a thin Owner/Admin server action over `public.disconnect_social_connection`.
- Every application connect/reconnect entrypoint now asserts closed-beta enrollment, including the previously bypassable generic `initiateInstagramConnectionAction` via the shared initiate service.
- Browser-facing reauthorize results no longer include `expectedExternalAccountId`. Identity remains in the private OAuth intent and is still enforced at callback.

This slice is **implementation + automated verification only**. It does not claim `INSTAGRAM PRODUCTION OAUTH PASS`.

---

## 2. Authoritative baseline

| Check | Result |
| --- | --- |
| Path | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `15258a0ff86ec63725a43f1780ee449d8e7c72bd` |
| Upstream / origin | `origin/core/platform-readiness-20260707` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Implementation HEAD | `8c47ae395743d6dee1c587d43a776139e0de2ac7` |
| Evidence commit | `a8a46375fdcca60bb4696ed56edbf8d35ad252c0` |
| SHA recording commit | `abf600438a2943d067e1f8e868d474e984ef7606` |
| Database migration | **NONE** |

---

## 3. Security findings closure

| ID | Finding | Status | Evidence |
| --- | --- | --- | --- |
| A1 | Reconnect UI started a new connect intent | **CLOSED** | Accounts Reconnect calls `initiateInstagramReauthorizationAction`. Connect is disabled when a reconnectable Instagram row exists. |
| A2 | Generic connect action skipped closed-beta | **CLOSED** | `initiateInstagramConnection` calls `assertClosedBetaConnectAllowed`. The generic server action only wraps that service. |
| A3 | `already_connected` never returned | **CLOSED** | Initiate lists org connections and returns `already_connected` for `connected` / `reauthorization_required` / `permission_missing`. Historical `authorization_pending` shells are ignored. |
| A4 | Disconnect RPC had no product action/UI | **CLOSED** | `disconnect-social-connection.ts` + action + Accounts two-step Confirm disconnect. |
| A5 | Reauthorize action returned external account id | **CLOSED** | `SocialReauthorizeResult` success is authorization URL only. Expected identity stays on the server intent. |

---

## 4. Files changed

### Implementation

| File | Purpose |
| --- | --- |
| `src/features/social-media/domain/status.ts` | Reconnectable status helper; pending shells excluded |
| `src/features/social-media/domain/results.ts` | Strip browser `expectedExternalAccountId`; add disconnect `rate_limited` |
| `src/features/social-media/server/social-closed-beta-enrollment.ts` | Shared closed-beta failure mapper |
| `src/features/social-media/server/initiate-instagram-connection.ts` | Closed-beta + already-connected before create-intent |
| `src/features/social-media/server/initiate-instagram-reauthorization.ts` | Closed-beta + org-owned connection bind |
| `src/features/social-media/server/disconnect-social-connection.ts` | Thin disconnect service over existing RPC |
| `src/features/social-media/actions/disconnect-social-connection-action.ts` | Server action; revalidates `/social` |
| `src/features/social-media/actions/initiate-instagram-reauthorization-action.ts` | Stop returning provider account id |
| `src/features/social-media/actions/start-r1-instagram-connect-action.ts` | Reuse shared closed-beta mapper |
| `src/features/social-media/ui/r1-instagram-connect-panel.tsx` | Distinct Connect / Reconnect / Disconnect |
| `src/features/social-media/ui/social-workspace-panel.tsx` | Pass reconnectable connection id |

### Tests

| File | Purpose |
| --- | --- |
| `tests/features/social-media/initiate-instagram-connection.test.ts` | Closed-beta, already-connected, foreign org, pending-shell exception |
| `tests/features/social-media/initiate-instagram-reauthorization.test.ts` | Reauthorize path, roles, closed-beta, org bind, no browser identity |
| `tests/features/social-media/disconnect-social-connection.test.ts` | Owner/Admin, Staff/Viewer, foreign org, already disconnected, RPC contract |
| `tests/features/social-media/handle-instagram-oauth-callback.test.ts` | Reconnect identity mismatch fail-closed |
| `tests/features/social-media/r1-instagram-connect-surface.test.ts` | Distinct UI actions |
| `tests/features/social-media/r1c-closed-beta-customer-access.test.ts` | Generic initiate closed-beta source lock |
| `tests/features/social-media/oauth-client-safety.test.ts` | Reauthorize result has no external account id |
| `tests/domain/social-connection-lifecycle.test.ts` | Reconnectable vs pending classification |

---

## 5. Test evidence

### Targeted A0 suite

```text
npx vitest run tests/features/social-media/initiate-instagram-connection.test.ts tests/features/social-media/initiate-instagram-reauthorization.test.ts tests/features/social-media/disconnect-social-connection.test.ts tests/features/social-media/handle-instagram-oauth-callback.test.ts tests/features/social-media/r1-instagram-connect-surface.test.ts tests/features/social-media/r1c-closed-beta-customer-access.test.ts tests/features/social-media/oauth-client-safety.test.ts tests/domain/social-connection-lifecycle.test.ts
```

| Result | Count |
| --- | --- |
| Files | 8 passed |
| Tests | **56 passed / 0 failed** |

### Social regression (features + domain + security)

```text
npx vitest run tests/features/social-media tests/domain/social-*.test.ts tests/security/social-*.test.ts
```

(Exact invocation used the listed Social files.)

| Result | Count |
| --- | --- |
| Files | **54 passed** |
| Tests | **326 passed / 0 failed** |

### Full application Vitest

```text
npx vitest run
```

| Result | Count |
| --- | --- |
| Files | 353 passed / **2 failed** (pre-existing, non-Social) |
| Tests | 2472 passed / **2 failed** |

Pre-existing failures, **not introduced by A0**:

1. `tests/features/invitations/load-member-administration-page.test.ts` — foreign org spy expectation after `f559001` org fallback denial.
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — enrollment Progress copy string drift.

---

## 6. Static / build evidence

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS (exit 0) |
| `npx next lint` | PASS — no ESLint warnings or errors |
| `npx next build` | PASS — compiled successfully |
| New A0 lint/type errors | none |
| Pre-existing build warning | `platform-closed-beta-operator-list.module.css` autoprefixer `flex-end` (unchanged file) |

---

## 7. Database status

**No migration.** Existing RPCs used:

- `create_social_reauthorization_intent`
- `disconnect_social_connection`
- `get_social_closed_beta_enrollment_status`
- existing consume/finalize identity mismatch contract

---

## 8. Production mutation status

| Action | Performed? |
| --- | --- |
| Live Meta OAuth authorization | **NO** |
| Production Instagram connection mutated | **NO** |
| Disconnect RPC executed against Production | **NO** |
| Historical pending shells deleted | **NO** |
| `SOCIAL_PUBLISHING_ENABLED` enabled | **NO** |
| Instagram provider write | **NO** |

---

## 9. Remaining Phase A actions

Do **not** execute without explicit owner approval.

### A1 — Owner Meta / Vercel redirect confirmation

Confirm Production `SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI`, `NEXT_PUBLIC_SITE_URL`, and Meta Valid OAuth Redirect URIs are the **same** HTTPS origin. Canonical alias: `https://www.zyntixai.com`. Expected callback path: `/api/social/instagram/callback`. Keep `SOCIAL_PUBLISHING_ENABLED=false`.

### A2 — Controlled Production reauthorization

Only after A1. One Owner/Admin Reconnect of the existing healthy connection. Do not mint a new connect shell. Do not disconnect the live QA connection unless separately authorized.

---

## 10. Closure verdict

```text
SMM-B1.1-R A0 CLOSED WITH EVIDENCE — OWNER ACTION A1 REQUIRED
```
