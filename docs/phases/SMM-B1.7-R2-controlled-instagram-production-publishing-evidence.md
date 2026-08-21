# SMM-B1.7-R2 — Controlled Instagram Production Publishing — Evidence

**Phase:** `SMM-B1.7-R2 — Controlled Instagram Production Publishing Verification`  
**Date opened:** 2026-08-21  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw`  
**Canonical origin:** `https://www.zyntixai.com`

Prerequisite closed:

```text
INSTAGRAM PRODUCTION OAUTH PASS
SMM-B1.1-R A2 CLOSED WITH EVIDENCE
```

A2 evidence commit: `93996ce0572861743c0a3a022aeb52cb9b688a1f`

```text
SMM-B1.7-R2 PRE-PUBLISH READY — OWNER ACTION REQUIRED
LIVE PROVIDER WRITE NOT EXECUTED
SOCIAL_PUBLISHING_ENABLED REMAINS OFF
SMM-B1.7-R2 NOT CLOSED
```

This document is PRE-PUBLISH only. Sections M–Q (controlled Execute, provider stages, POST, owner visual confirmation, gate restore) are **not** filled until after explicit owner approval.

---

## A. Repository state

| Check | Result |
| --- | --- |
| Top-level | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `93996ce0572861743c0a3a022aeb52cb9b688a1f` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Divergence | `0 0` |
| Worktree | clean |

HEAD is the A2 close commit. No implementation changes in this PRE-PUBLISH stop.

---

## B. Production deployment state

Inspected via Vercel CLI against alias `https://www.zyntixai.com` (scope `guus-projects-ai`, project `zyntixai`). Not inferred from GitHub.

| Field | Observed |
| --- | --- |
| Deployment id | `dpl_3sN9418cBkcifu8YxHaMsobHXZ3n` |
| Deployment URL | `https://zyntixai-7in1j73oa-guus-projects-ai.vercel.app` |
| Target | production |
| State | Ready |
| Created | 2026-08-21 12:21:30 GMT+0200 |
| Aliases | `https://www.zyntixai.com`, `https://zyntixai.vercel.app`, `https://zyntixai.com` |
| `gitCommitSha` | `db0a837c3c4435436a1736f657de2ea9365eadc9` |
| Message | `docs(smm): record SMM-B1.1-R A2 retry blocked on stale Production app HEAD` |

`db0a837` is the parent of current Git HEAD `93996ce` (A2 POST evidence docs only). Publishing adapter, B1.8 Prepare/Execute, B1.9 lifecycle, R1-E-R2 window binding, and P4 `FINISHED` wait are all present in `db0a837`.

Build on this worktree includes `/social`, `/social/b18-instagram-publish` (legacy redirect), and `/api/social/media-delivery/[token]`.

**Deployment verdict:** Production app is compatible with the current publishing implementation. Not `PRODUCTION APP STALE`.

---

## C. Instagram connection baseline

Read-only on `dmctinrcjvsgmoxwwodw`. No tokens, ciphertext, keys, or client secrets.

| Field | Value |
| --- | --- |
| Connection UUID | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Workspace | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` |
| Provider | `instagram` |
| Account type | `business` |
| Status | `connected` |
| Health | `healthy` |
| Identity fingerprint | `eefce660bad5c0ad` |
| Credential envelopes | 1 |
| Credential version | **2** |
| `publish_image` capability | yes |
| `reauthorization_required_at` | null |
| Token expired | no (~1439.7 hours remaining at query) |
| Last refreshed | `2026-08-21 10:30:16.624813+00` |
| Active Instagram connections | 1 |
| Ordinary pending shells | 6 |
| Closed-beta enrollment | `publishing_allowed` since `2026-08-18 23:34:31.902692+00` |

---

## D. Publishing architecture map

### Surfaces

| Route | Role |
| --- | --- |
| `/social?section=publish` | **Authoritative** Owner/Admin controlled IMAGE publish |
| `/social/b18-instagram-publish` | Legacy redirect to `/social?section=publish` |
| `/operator/social-beta` | Closed-beta enrollment operator UI (does **not** open publish windows) |

Buttons: **Prepare IMAGE publication** / **Execute image publish**. Execute is hidden unless `publishingEnabled && executeTargetId`.

Caption stored on prepared rows: `ZYNTIXAI B1.8 controlled publish verification — safe to delete`.

### Actions / services / RPCs

| Step | Implementation |
| --- | --- |
| Prepare action | `prepareB18InstagramImagePublicationAction` |
| Prepare service | `prepareB18ImagePublication` |
| Execute action | `executeB18InstagramImagePublicationAction({ organizationId, publicationId })` |
| Execute service | `executeB18ImagePublication` |
| Start/complete | `b18_start_controlled_publication_attempt` / `b18_complete_controlled_publication_attempt` |
| Window open/close | `operator_open_social_controlled_publish_window` / `operator_close_social_controlled_publish_window` (platform-operator / service_role; `mutateControlledPublishWindowAction`) |

Prepare does **not** require `SOCIAL_PUBLISHING_ENABLED`. Execute requires exact `"true"` at the action, the executor, and SQL GUC `zyntix.social_publishing_enabled` inside `b18_start`.

Execute is server-bound: connection, version, media, caption, and token come from the publication row. Browser may send only `organizationId` + `publicationId`.

### Instagram adapter

| Item | Value |
| --- | --- |
| Host | `https://graph.instagram.com` |
| Version | `v26.0` |
| Create | `POST /{igUserId}/media` |
| Status | `GET /{containerId}?fields=status_code` |
| Publish | `POST /{igUserId}/media_publish` |
| Readiness | `waitForInstagramContainerFinished` — only `FINISHED` or `PUBLISHED`; poll 60s, max 5 |
| Signed media | HMAC URL `/api/social/media-delivery/[token]`, TTL 3600s, org-prefixed storage key |

---

## E. Security / tenancy checks

| Path | Contract |
| --- | --- |
| Owner / Admin | Prepare and Execute allowed when membership is `active` |
| Staff / Viewer | Page load forbidden for manage; actions `forbidden` |
| Foreign organization | `resolveOrganizationContext` fail-closed |
| Foreign publication | Execute loads `.eq("organization_id", organizationId)` then RPC org-scoped claim |
| Foreign connection | Execute uses `social_publications.connection_id`; Prepare validates workspace/org |
| Unapproved content | Prepare requires workflow readiness + approval RPC before `create_social_publication` |
| Signed media | Claims include org + asset + key hash; other-tenant key prefix rejected |

---

## F. Approval / version binding

Create chain: JPEG upload → `register_social_media_asset` → content/variant/version → `submit_social_approval_decision` (`approved`) → workflow readiness → `create_social_publication` (`immediate`).

Execute reloads `variant_version_id` from the publication row and uses that version’s `caption` + `media_snapshot`. Browser cannot substitute version/media/connection.

---

## G. Media readiness

No JPEG is committed in the repository. Production already has six unused queued IMAGE publications with ready private JPEG assets (see J). Signed delivery is minted at Execute; storage keys are org-prefixed; credentials are not placed in media URLs.

---

## H. Idempotency / duplicate protection

| Scenario | Protection |
| --- | --- |
| Double click | UI `pendingRef`; DB `SELECT … FOR UPDATE` + `claim_generation` |
| Browser retry | Same claim / terminal status → `conflict` / `stale_claim` |
| Already published | Terminal `succeeded` / `unknown_external_outcome` / `manual_intervention` → `conflict` |
| Concurrent workers | In-flight `processing` → `conflict` |
| Controlled window | One-shot consume inside `b18_start` (`max_execute_count=1`) |
| UI leftovers | Unattempted queued rows are historical leftovers and are not auto-selected |

Without an active window, a crafted Execute with another queued UUID would still be allowed at the app-binding layer (`ok_no_window`). That is why the owner flow **must** open a one-shot window **before** enabling the global gate.

---

## I. Partial-failure / reconciliation safety

| Stage | Persistence |
| --- | --- |
| Before `media_publish` | Attempt row claimed; container create/status failures are definitive (no final publish) |
| After dispatched `media_publish` timeout/network/invalid JSON | `unknown_external_outcome`; further Execute blocked |
| Success | `external_publication_id` on publication + attempt |
| Container ID | Presence flag only; raw provider IDs not logged in evidence |

This is **not** classified as a BLOCKER. Uncertain outcome must **not** be retried blindly.

---

## J. Target publication candidate

No dedicated 2026-08-21 R2 row exists. Historical queued leftovers are valid IMAGE publications and should be reused rather than duplicated.

**Preferred unused candidate:**

| Field | Value |
| --- | --- |
| Publication UUID | `0ffb466f-b477-4d7e-87c4-fbb60d330012` |
| Status | `queued` |
| Attempts | **0** |
| Created | `2026-08-19 10:43:12.916033+00` |
| Connection | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Workspace | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` |
| Version | `67551ecd-ee87-4907-bae5-b34e000163ff` |
| Approval | 1 `approved` |
| Format | `image` |
| Caption prefix | `ZYNTIXAI B1.8 controlled publish verification — safe to delete` |
| Asset | `46080b38-068a-45db-91b9-90cbc329721a` |
| MIME | `image/jpeg` |
| Dimensions | 1254×1254 |
| Bytes | 293906 |
| Processing | `ready` |
| External publication id | absent |

Do **not** Execute succeeded rows `640009e7-…`, `1f1fa14e-…`, `23821fb0-…`.

Active controlled windows: **0**. Historical windows: 1 closed + 2 consumed.

---

## K. Pre-publish test evidence

### Targeted publishing

```text
npx vitest run tests/features/social-media/r1a-closed-beta-entitlement-surface.test.ts tests/features/social-media/b18-instagram-publish-surface.test.ts tests/features/social-media/instagram-publishing-adapter.test.ts tests/features/social-media/instagram-provider-4xx-diagnostics.test.ts tests/features/social-media/instagram-provider-client.test.ts tests/features/social-media/r2-p2-controlled-publish-window-binding.test.ts tests/features/social-media/r2-prepare-durability-contract.test.ts tests/features/social-media/media-delivery-route.test.ts tests/domain/social-publishing.test.ts tests/domain/social-lifecycle-b19.test.ts tests/security/social-publishing-migration-security.test.ts tests/security/social-lifecycle-b19-migration-security.test.ts tests/security/social-closed-beta-entitlement-defense-r1ar1.test.ts
```

**13 files, 88 passed / 0 failed**

Coverage includes: gate OFF (adapter not invoked), window binding, FINISHED-before-publish, 4xx diagnostics, signed media tenant prefix, prepare durability, closed-beta entitlement.

### Social features

```text
npx vitest run tests/features/social-media
```

**31 files, 182 passed / 0 failed**

### Domain + security

```text
npx vitest run tests/domain tests/security
```

**75 files, 525 passed / 0 failed**

### Static / build

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS — no ESLint warnings or errors |
| `npx next build` | PASS |

Pre-existing warning: `platform-closed-beta-operator-list.module.css` autoprefixer `flex-end` (unchanged).

### Full Vitest

```text
npx vitest run
```

| Result | Count |
| --- | --- |
| Files | 356 passed / **2 failed** |
| Tests | 2488 passed / **2 failed** |

Exact same two pre-existing **non-Social** failures as A2-FIX; not repaired in R2:

1. `tests/features/invitations/load-member-administration-page.test.ts` — foreign org query
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — Progress copy

---

## L. Owner authorization

**Not yet granted for live provider write.** This PRE-PUBLISH stop does not enable the gate and does not Execute.

---

## M. Controlled Execute

Not executed.

---

## N. Provider response/stages

Not executed.

---

## O. POST Production state

Not captured. PRE counts remain the baseline (see E in the first-response report / section 7 below).

Org publishing counts at PRE:

| Metric | Count |
| --- | --- |
| Content items / variants / versions | 11 / 11 / 11 |
| Media assets | 11 |
| Approval decisions | 11 |
| Publications | 11 (`queued=6`, `succeeded=3`, `manual_intervention=2`) |
| Attempts | 5 (`succeeded=3`, `failed_terminal=2`) |
| Publication events | 37 |
| Latest publication create | `2026-08-19 11:01:56.801808+00` |
| Latest attempt start | `2026-08-19 11:43:20.72354+00` |

---

## P. Owner Instagram visual confirmation

Not requested yet.

---

## Q. Publishing gate final state

Still PRE. `SOCIAL_PUBLISHING_ENABLED` is configured in Production and does **not** parse as exact `true`. SQL `private.social_publishing_execution_enabled()` is **false**. GUC `zyntix.social_publishing_enabled` is unset.

---

## R. Production mutation summary (this PRE-PUBLISH stop)

| Item | Result |
| --- | --- |
| Live Instagram provider publish attempted | **NO** |
| Instagram provider publish succeeded | **NO** |
| Intended successful provider content writes | **0** |
| Instagram post created | **NO** |
| Connection UUID changed | **NO** |
| Instagram identity changed | **NO** |
| Credential refreshed | **NO** |
| New Social connection | **NO** |
| New `authorization_pending` shell | **NO** |
| Disconnect | **NO** |
| Publishing gate | remains OFF |
| Code changed | **NO** |

---

## S. Verdict

```text
SMM-B1.7-R2 PRE-PUBLISH READY — OWNER ACTION REQUIRED
```

Do **not** enable publishing until the owner explicitly approves the controlled Execute flow below.
