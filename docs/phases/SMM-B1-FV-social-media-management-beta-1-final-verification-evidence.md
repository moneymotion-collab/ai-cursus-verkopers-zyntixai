# SMM-B1-FV — Social Media Management Beta 1 Final Verification — Evidence

## A. Final Verdict

```text
SMM-B1-FV CLOSED WITH EVIDENCE — SOCIAL MEDIA MANAGEMENT BETA 1 PRODUCTION VERIFIED
SOCIAL MEDIA MANAGEMENT BETA 1 RELEASE READY WITH EVIDENCE
```

This phase is whole-product Final Verification, not feature development. No implementation, schema, gate, timer, or Instagram provider mutation occurred. A new live provider write was **not** required: B1.8 / B1.7-R2 / B1.11-E / B1.11-G already proved controlled Production writes, and current automatic scheduler ticks remain fail-closed dry-run.

---

## B. Repository State

| Check | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Start HEAD | `89122c8e85b8eae76210f8248437fde56c81295d` |
| Start message | `docs(smm): close B1.11 Stories scheduling final verification` |
| Prior phase | `SMM-B1.11-FV CLOSED WITH EVIDENCE — STORIES + SCHEDULING PRODUCTION VERIFIED` |
| Implementation commit this phase | none |
| Evidence commit | recorded after this file is committed |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence at start | `0 0` |
| Worktree at start | clean |

HEAD matched the expected B1.11-FV close SHA. No unrelated dirty files. No reset or history rewrite.

---

## C. Scope Verified

Reconstructed from current code, migrations, tests, and closed phase evidence (B1.0 → B1.11-FV), not filenames alone.

**Owner-executable Beta 1 (Instagram-only, closed beta, Owner/Admin `/social`):**

* Instagram OAuth connect / reauth / disconnect
* AES-256-GCM encrypted credentials (private schema)
* Social workspace shell
* Content → media → variant/version → approval → publication
* Immediate controlled feed IMAGE publish (B1.8 / B1.7-R2)
* Scheduled feed IMAGE (B1.11-E)
* Story IMAGE domain + scheduled Story IMAGE (B1.11-F / G)
* Calendar scheduling UX
* Fail-closed dual execution gates
* Supabase Cron `*/5` → machine-authenticated Vercel worker
* Controlled one-shot windows
* Claim / idempotency / UEO
* Missed-window Attention
* Activity / lifecycle surfaces
* Platform operator closed-beta enrollment

**Foundation / locked (not owner-executable in Beta 1; not defects):**

* Brand Brain / Campaign UI
* Video / carousel / Reels / Story VIDEO
* Metrics / insights / engagement inbox
* Multi-provider
* Staff read-only Social page (workspace remains Owner/Admin)

Verification matrix used before any edit:

| Area | Implementation | Automated evidence | Production evidence | Verdict |
| --- | --- | --- | --- | --- |
| Foundations B1.0–B1.6 | Domain + SQL + RLS | security + domain tests | migrations applied | PASS |
| Instagram connection | OAuth + AES-GCM | connection/oauth/secret tests | connected/healthy v2 | PASS |
| Tenant isolation | RLS + server org context | 19 social security files + tenant tests | no cross-org write observed | PASS |
| Content lifecycle | workflow_ready before publication | B18 prepare + SQL | E/G rows approved+succeeded | PASS |
| Stories IMAGE | format + adapter STORIES | F/G tests + G live | G persisted | PASS |
| Scheduling | Cron `*/5` + worker | C/PR1/E/G + worker tests | 1 active job, dry-run | PASS |
| Fail-closed gates | exact `"true"` only | scheduler/publishing tests | both false on live ticks | PASS |
| Idempotency | claim lock + window + UEO | worker/story/rollout tests | E/G attempts remain 1 | PASS |
| Owner journey | `/social` sections | B1.10 + B1.11-B tests | unauth → Sign in | PASS |

No HIGH/CRITICAL defect identified. No implementation change authorized.

---

## D. Instagram Connection Verification

Production connection (read-only; token not printed):

| Field | Value |
| --- | --- |
| UUID | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Status | connected |
| Health | healthy |
| Account | Instagram Business (`professional_account_type=business`) |
| Label | `zyntixai` |
| Fingerprint | `eefce660bad5c0ad` |
| Credential version | 2 |
| Reauthorization required | no |
| Connected Instagram count | 1 |
| Capability snapshot | `publish_image`, `publish_video`, `publish_carousel`, `publish_story`, `publish_short` |

Owner-executable publish paths still require `publish_image` (feed IMAGE) or `publish_story` (Story IMAGE). Video/carousel/short remain capability-represented but not Beta 1 owner-executable.

Code: OAuth connect/reauth intact; credentials in `private.social_provider_credentials`; client read model strips secrets (`secret-boundary.test.ts`). Missing/invalid decrypt fails closed before Meta.

No reconnect or credential rotation during B1-FV.

---

## E. Tenant & Security Verification

`Org A must never read, mutate, schedule, publish, retry, or execute Social resources owned by Org B.`

Enforcement:

* RLS on Social tables; direct authenticated INSERT/UPDATE/DELETE revoked on publications
* Human mutations via SECURITY DEFINER RPCs with membership assert
* Actions use `resolveOrganizationContext`; foreign `org` URL does **not** silently fall back (`resolve-task-organization-selection.ts`)
* Scheduler RPCs `service_role` only
* Window consume binds org / workspace / connection / publication

Automated: `tests/security/social-*-migration-security.test.ts`, `social-calendar-tenant-security.test.ts`, `schedule-social-publication-actions.test.ts` (foreign org), `task-organization-selection.test.ts`.

**PASS.** No tenant-honesty defect found. No silent single-org fallback on security-sensitive paths.

---

## F. Content Lifecycle Verification

Conceptual flow implemented:

`Workspace → Brand/Strategy (foundation) → Content → Media → Version/Variant → Approval → Calendar/Schedule → Publication`

`create_social_publication` and scheduler start require `workflow_ready`. Unapproved versions cannot publish. B18 Prepare materializes the chain and records an approval decision before publication create.

Immediate execute additionally requires `SOCIAL_PUBLISHING_ENABLED` exact `"true"` plus closed-beta entitlement and (when rollout is on) a matching controlled window.

No orphan path found that calls Instagram without a publication row.

**PASS.**

---

## G. Stories Verification

Story is a real Beta 1 `content_format=story`.

| Check | Result |
| --- | --- |
| Representation | Domain + DB + Calendar label `Story` |
| Capability | `publish_story` required (not substitutable by `publish_image`) |
| Scheduler | `image\|story` only; Story VIDEO → `format_unsupported` |
| Adapter | `media_type=STORIES`; no caption; no `alt_text` |
| Production | `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` succeeded, attempts 1, provider `18111265202036012` |
| Terminal reclaim | succeeded / UEO excluded from claim |
| Advanced Story builder | not in scope (backlog) |

`STORY VIDEO = NOT PRODUCTION SUPPORTED IN B1.11` — still true for Beta 1.

**PASS.**

---

## H. Scheduling Architecture

```text
Supabase Cron */5 * * * * → private.invoke_social_publication_scheduler()
  → Vault-backed Bearer CRON_SECRET
  → POST https://www.zyntixai.com/api/cron/social-publications
```

| Timer | Count |
| --- | --- |
| Active Social Supabase Cron | **1** (`zyntixai_social_publication_scheduler_5m`, jobid 1, `*/5 * * * *`) |
| Vercel-native Social Cron | **0** (`vercel crons list` empty; `vercel.json` `"crons": []`) |
| GitHub Action Social timer | **0** (no `.github/workflows`) |

Architecture unchanged. No duplicate timer.

---

## I. Production Gate Verification

Gates observed via automatic worker JSON (values not printed from Vercel env). Fail-closed parse: exact `"true"` only.

| When | Scheduling | Publishing | Mode |
| --- | --- | --- | --- |
| Phase start (latest ticks) | false | false | dry-run |
| During B1-FV | false | false | dry-run |
| Phase end (required) | **OFF** | **OFF** | dry-run |

No gate was enabled. No temporary provider-write window was opened. None was necessary.

Canonical Production: `dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa` Ready, alias `https://www.zyntixai.com`. Runtime code on that deploy is `817522fc4bd2e22331f4b9c989560c84cecf0a8b` (G OFF). Later HEAD commits are documentation-only and do not change runtime.

---

## J. Fail-Closed Verification

Automatic Production ticks during this phase (not manually invoked):

| UTC | Cron runid | HTTP | invocationId | mode | scheduling | publishing | claimed | providerWriteAttempted |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `2026-08-22 10:20:00+00` | 244 | 212 | `e85568b4-5247-4d35-b25c-31bac8f3edcb` | dry-run | false | false | 0 | false |
| `2026-08-22 10:25:00+00` | 245 | 213 | `84193edb-ffda-43e0-8f83-2e7dfb4c7714` | dry-run | false | false | 0 | false |

HTTP 200 (authenticated). Query-secret rejected in code/tests. Immediate Execute and scheduled worker both require publishing/scheduling gates. Story and feed share the same gate + window consume path.

Expected safe outcome met: `providerWriteAttempted = false`.

**PASS.**

---

## K. Retry / Idempotency Verification

Mechanisms (code + tests + live E/G persistence):

* Org-scoped publication `idempotency_key`
* Claim `FOR UPDATE` / discovery `SKIP LOCKED`; `claim_generation`; 360s lease
* Batch size 1, sequential worker
* Terminal statuses (`succeeded`, `unknown_external_outcome`, `failed_terminal`, …) not reclaimable
* UEO: no blind retry; Attention `publication_result_unknown`
* Controlled window: max 1 / consumed 1 / remaining 0 cannot execute again
* Manual + scheduler collision tests
* Second Story tick test: `controlled_window_exhausted`, `providerWriteAttempted=false`

Live: E and G still `attempt_count = 1` with a single persisted provider ID each. No second provider write since those closures.

**PASS.** Duplicate provider writes are prevented or safely bounded; not merely “unlikely.”

---

## L. Owner Journey Verification

Canonical Owner/Admin path:

`Sign in → Social → Overview → Accounts (connect) → Publish (Prepare IMAGE/Story IMAGE) → Calendar (schedule) → Activity (lifecycle)`

Routes exist (`SOCIAL_SECTIONS`: overview, accounts, publish, calendar, activity). Legacy URLs redirect. Authorization: Owner/Admin page load; Staff/Viewer forbidden at `/social` (locked B1.10/B1.11-B). Failed states do not present as success (workflow_not_ready, gate OFF, window required).

Unauthenticated Production smoke (no login, no mutation):

| URL | Result |
| --- | --- |
| `/social` | `/login?next=%2Fsocial` — Sign in |
| `?section=accounts` | Sign in |
| `?section=publish` | Sign in |
| `?section=calendar` | Sign in |
| `?section=activity` | Sign in |

Authenticated surfaces were not exercised in-browser this phase. Correctness uses tests + prior B1.8 / B1.10 / B1.11 visual/owner confirmations. This is **not** a fabricated authenticated UI PASS.

**PASS** for Beta 1 journey coherence.

---

## M. Automated Regression Results

| Command | Result |
| --- | --- |
| `npx vitest run --reporter=dot` | `2 failed / 2645 passed / 2647 total` (377 files: 2 failed / 375 passed) |
| `npx tsc --noEmit` | PASS |
| `npx eslint` on `src/features/social-media`, `tests/features/social-media`, `tests/domain`, `tests/security` | PASS |
| `npx next build` | PASS |

Known unrelated / pre-existing failures (same identities and reasons as B1.11-FV; **not** Social release blockers):

1. `tests/features/invitations/load-member-administration-page.test.ts` — foreign org spy
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — Progress copy string

Pre-existing Next warning: autoprefixer `end` vs `flex-end` on operator CSS. Non-blocking.

No new Social failure.

---

## N. Production Evidence

Timestamps UTC.

| Item | Evidence |
| --- | --- |
| Deploy | `dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa` Ready; `https://www.zyntixai.com` |
| Gates | both OFF on `2026-08-22 10:20:00` and `10:25:00` automatic ticks |
| Timer | 1 × `*/5`; Vercel Social Cron 0 |
| Connection | unchanged healthy v2 fingerprint `eefce660bad5c0ad` |
| E feed | `ae6caf94-2fc7-4653-a085-0228d32e0c53` succeeded scheduled IMAGE, provider `18116980474912030`, attempts 1 |
| G Story | `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` succeeded scheduled Story, provider `18111265202036012`, attempts 1 |
| Active windows | 0 |
| Scheduled open / due / claimed / processing / UEO | 0 |
| Queued immediate leftovers | 4 historical B1.8 rows, attempts 0 (not scheduler-eligible; not deleted) |
| Social failure Attention | 0 |
| B1-FV provider writes | 0 |

---

## O. Defects Found and Remediation

None.

No implementation commit.

---

## P. Residual Risks / Beta 2 Backlog

Not release blockers:

* Advanced grid/feed layout builder
* Advanced daily Story sequencing / design builder
* Story VIDEO
* AI Video Studio
* Expanded analytics / AI
* Engagement inbox / comments / DMs
* Additional networks
* Brand Brain / Campaign customer UI
* Staff view-only Social workspace (page remains Owner/Admin)
* Historical unused B1.8 immediate queued rows (not scheduler-eligible)
* Org timezone unset → honest UTC display fallback

Do not implement these in B1-FV.

---

## Q. Final Release Gate Matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Repository integrity | PASS | HEAD `89122c8` at start, `0 0`, clean |
| Instagram connection | PASS | D; connected/healthy/v2 |
| Tenant isolation | PASS | E; RLS + server org + tests |
| Content lifecycle | PASS | F; workflow_ready |
| Stories | PASS | G; G Production + fail-closed VIDEO |
| Scheduling | PASS | H; 1 Cron `*/5`, 0 Vercel Social Cron |
| Fail-closed safety | PASS | J; `providerWriteAttempted=false` |
| Idempotency | PASS | K; E/G attempts remain 1 |
| Owner journey | PASS | L; routes + auth gate + tests |
| Regression suite | PASS | M; no new Social failures |
| Production state | PASS | I + N; gates OFF, Ready deploy |

All rows PASS.

---

## Production Mutation Summary

New publication / schedule / window / claim / attempt / container / `media_publish` / feed post / Story / connection / credential / timer / schema / gate flip: **NO**

Scheduling gate: **OFF**

Publishing gate: **OFF**
