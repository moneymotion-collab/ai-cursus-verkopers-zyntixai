# SMM-B1.11-C — Fail-Closed Scheduler Worker — Evidence

## 1. Executive verdict

```text
SMM-B1.11-C CLOSED WITH EVIDENCE — FAIL-CLOSED SCHEDULER WORKER READY
```

Production now has a machine-authenticated Vercel Cron worker at `/api/cron/social-publications`. Authorized dry-run discovered **0** due scheduled publications, claimed **0**, and did not call the Instagram adapter. Both automatic execution gates remain OFF. No Production publication was scheduled, claimed, or published.

Live scheduled Instagram provider write remains **not authorized**. That belongs to `SMM-B1.11-E`.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Start HEAD | `1c86e6b05bbad0b122ebf165f69f09d75705d6e3` |
| Implementation commit | `390305a882516c5af84462a0edd2acf7d2027119` |
| Branch | `core/platform-readiness-20260707` |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Prior milestone | `SMM-B1.11-B CLOSED WITH EVIDENCE — CALENDAR + SCHEDULING UX READY` |
| B1.11-B implementation | `8f01120aaae47c4e17a32c65aa257801817c3bfb` |
| Prior Production deployment | `dpl_GWfGmjE76cgG1h1UA6oNwhkHAaqi` |

Production safety at phase start (read-only):

| Item | Value |
| --- | --- |
| Instagram connection | `24420652-d0b4-4237-9a75-51d89be50c65` `connected` / `healthy` |
| Credential version | 2 |
| Connected Instagram connections | 1 |
| Scheduled publications | 0 |
| Currently due | 0 |
| Claimed / processing | 0 |
| Active controlled windows | 0 |
| `private.social_publishing_execution_enabled()` | false |
| Attempts after R2 `2026-08-21T11:05:55.829837+00` | 0 |
| Existing scheduler worker / Vercel Cron | none |

---

## B. Architecture

`social_publications` remains the execution source of truth. No `social_schedules` table, no second queue, no Inngest/QStash/BullMQ/Redis/Cloud Tasks.

```text
Vercel Cron GET/POST /api/cron/social-publications
  → Bearer CRON_SECRET (machine auth only)
  → gate read (SOCIAL_SCHEDULING_ENABLED + SOCIAL_PUBLISHING_ENABLED)
  → scheduler_list_due_scheduled_social_publications (read-only)
  → if both gates exact "true": scheduler_start_scheduled_publication_attempt
       → existing Instagram adapter + attempt lifecycle
  → otherwise dry-run: no claim, no credentials, no adapter
```

Trigger is the only difference versus manual Execute. Claim, lease, unknown-external-outcome, and Instagram container/`media_publish` logic are reused, not duplicated as a second publisher.

Closed-beta enrollment is re-checked at start via `private.social_closed_beta_publish_result_code`. A scheduled worker cannot bypass `publishing_allowed` merely because the publication was created earlier.

---

## C. Scheduler gate

New env: `SOCIAL_SCHEDULING_ENABLED`.

Fail-closed parse: trim + lower-case exact `"true"` only. Unset / `"1"` / `"yes"` / `"TRUE "` after trim of non-true values → OFF. `" TRUE "` after trim+lower is ON in the same helper used by publishing.

Automatic provider execution requires **both**:

* `SOCIAL_SCHEDULING_ENABLED === "true"`
* `SOCIAL_PUBLISHING_ENABLED === "true"`

Anything else: mode `dry-run`, no claim, no provider write.

Production final:

* `SOCIAL_SCHEDULING_ENABLED` **unset** (not present in Vercel Production env)
* `SOCIAL_PUBLISHING_ENABLED` present but **does not resolve as exact `"true"`** (worker logged `publishingEnabled: false`; `private.social_publishing_execution_enabled()` is false)

No `NEXT_PUBLIC_SOCIAL_SCHEDULING_ENABLED`.

---

## D. Cron authentication

Machine authorization, not member authorization.

* Secret: Production `CRON_SECRET` (server-side only; already present)
* Header: `Authorization: Bearer <secret>`
* Comparison: `crypto.timingSafeEqual` on equal-length UTF-8 buffers
* Query `secret` / `cron_secret` → **401 `missing_credentials` even if a valid Bearer is also present**
* Missing header → 401 `missing_credentials`
* Wrong Bearer → 401 `invalid_credentials`
* Missing configured secret → 503 `missing_secret`
* Owner/Admin browser session without Bearer → denied (route never reads cookies / `auth.uid()` / `?org=`)

Observed Production:

| Request | Result |
| --- | --- |
| No auth | 401 `missing_credentials` |
| Query-param secret | 401 `missing_credentials` |
| Wrong Bearer | 401 `invalid_credentials` |
| `npx vercel crons run /api/cron/social-publications` | 200 dry-run (platform injects Bearer) |

---

## E. Cron cadence

| Item | Value |
| --- | --- |
| Target Beta 1 cadence | `*/5 * * * *` (`SOCIAL_SCHEDULER_CRON_SCHEDULE_TARGET`) |
| Deployed cadence | `0 0 * * *` (00:00 UTC) |
| Reason | Vercel Hobby: “Hobby accounts are limited to daily cron jobs.” `*/5 * * * *` was rejected at deploy. |
| Precision | Hobby cron is per-hour (±59 min). Worker does not depend on firing at an exact second. Due clock remains UTC `coalesce(next_attempt_at, intended_execute_at)`. |
| Manual invoke | `vercel crons run` and authorized HTTP do not wait for the daily tick. |

Five-minute ticks inside the locked 15-minute miss grace require a Pro upgrade before live scheduled publishing (`SMM-B1.11-E`). That is a cadence gap, not a C safety defect: live execute is gated OFF.

---

## F. Runtime duration

| Item | Value |
| --- | --- |
| Route `maxDuration` | **300** |
| Claim lease | **360** seconds |
| Historical controlled IMAGE publish | ~**70.69** seconds |
| Adapter poll | 60-second intervals, up to ~5 attempts (~240s sleep + HTTP) |
| Vercel Hobby function duration (Fluid compute, current docs) | default and maximum **300s** |
| Deploy accepted `maxDuration = 300` | YES |

The existing synchronous Instagram container polling lifecycle **fits the deployed 300s budget** for a single publication (batch limit 1). Historical 70.69s is well inside. Worst-case poll approaches the 300s ceiling; the 360s lease outlives the route.

Not classified `BLOCKER — WORKER EXECUTION DURATION`. Live execute remains gated OFF. If a future publish exceeds 300s, split container-create / status / `media_publish` would need a separate owner-approved architecture — not implemented here.

---

## G. Worker DB privilege boundary

Local forward-only migration:

`supabase/migrations/20260821123346_add_social_scheduler_worker_domain.sql`

Remote names (split apply, same SQL):

1. `add_social_scheduler_worker_domain`
2. `add_social_scheduler_workflow_ready_and_list_due`
3. `add_scheduler_start_scheduled_publication_attempt`
4. `add_scheduler_load_and_complete_rpcs`

`private.assert_social_scheduler_service_role()` requires `auth.role() = 'service_role'`.

Production execute grants:

| Function | anon | authenticated | service_role |
| --- | --- | --- | --- |
| `scheduler_list_due_scheduled_social_publications` | false | false | true |
| `scheduler_start_scheduled_publication_attempt` | false | false | true |
| `scheduler_load_social_publication_execution_context` | false | false | true |
| `scheduler_load_social_provider_credential_envelope` | false | false | true |
| `scheduler_complete_scheduled_publication_attempt` | false | false | true |
| `private.claim_due_social_publications` | false | false | **false** |
| `private.assert_social_scheduler_service_role` | false | false | false (internal) |
| `private.social_variant_version_is_workflow_ready` | false | false | false (internal) |

Raw `claim_due_social_publications` remains ungranted. Organization/publication identity comes from authoritative rows, not client bindings. The cron route uses the existing service-role client wrapper (`scheduler-service-client.ts`), allowlisted in `tests/security/security-boundary.test.ts`.

---

## H. Due discovery

RPC: `scheduler_list_due_scheduled_social_publications(p_limit)` (default/cap used by worker: 5, hard SQL cap 20).

Exact filter:

* `execution_mode = 'scheduled'` (immediate leftovers are excluded even if clocks are null/old)
* `status in ('pending','queued','failed_retryable')` **or** expired `claimed` lease (`claim_lease_expires_at < now()`)
* `coalesce(next_attempt_at, intended_execute_at) <= now()`
* skip: `succeeded`, `cancelled`, `unknown_external_outcome`, `manual_intervention`, `failed_terminal`, live `processing` / unexpired `claimed`

`seconds_late` is returned for B1.11-D. C safety-refuses start when late **> 900 seconds** (`missed_window`) without Attention.

---

## I. Claim concurrency

Start reuses `FOR UPDATE SKIP LOCKED` against `social_publications_claim_due_idx` via the existing private claim helper, then writes:

* `claimed_at`, `claim_lease_expires_at` (+360s), `claimed_by` (`sched_…`), `claim_generation + 1`
* attempt row + `social_publication_claimed` / attempt-started events with `payload.source = scheduler`

Two simultaneous starts: at most one `success` per publication. The loser receives `skipped_locked` / `none_due` / `conflict` and does not load credentials.

---

## J. Claim-time revalidation

Before claim/provider write, `scheduler_start_scheduled_publication_attempt` re-checks:

* still `scheduled`; still due; eligible status; not cancelled/succeeded/UEO/manual_intervention/failed_terminal/processing
* closed-beta `publishing_allowed`
* workspace not archived
* exact bound variant version workflow-ready (approvals + media still present; private helper, no `auth.uid()`)
* IMAGE only (`content_format = image`, single media item)
* connection: same row, `connected`, `healthy`, no `reauthorization_required_at`, capability `publish_image`
* no controlled-window consume (scheduler must not spend R2 budget)

TypeScript execute core repeats connection/capability/format checks after start and **before** adapter construction.

---

## K. Manual-vs-worker race

Manual Execute continues to use `b18_start_controlled_publication_attempt` (requires `auth.uid()` + controlled window). The scheduler uses `scheduler_start_scheduled_publication_attempt`. Both serialize on the same publication row lock / claim generation. One owner wins. There is no scheduler path that bypasses claim to call the adapter.

---

## L. Cancel / reschedule races

Locked semantics implemented in start:

* Cancel before lock → publication no longer scheduled/eligible → start `conflict` / skip, no provider write
* Claim first → cancel RPC already conflicts on claimed/processing (B1.11-A)
* Reschedule to future before claim → `due_at > now()` → `none_due`, no claim
* Worker cannot execute an old due instant after a winning reschedule

C additionally refuses `seconds_late > 900` without claiming.

---

## M. Idempotency

Existing publication `idempotency_key`, `claim_generation`, and attempt uniqueness remain. Unknown external outcome is terminal for automatic retry: due discovery skips `unknown_external_outcome`; start returns conflict if that status is seen. Next cron tick does not blindly retry. `failed_retryable` is eligible only when `next_attempt_at` (else intended clock) is due. Full missed-window / Attention policy is **not** implemented (B1.11-D).

---

## N. Unknown external outcome handling

Preserved. Skip statuses include `unknown_external_outcome`. Worker maps that outcome as `unknownOutcome`, not retryable success. Adapter/final-publish uncertainty still uses the existing complete path.

---

## O. Tests

### Targeted

```text
npx vitest run tests/features/social-media/social-scheduler-worker.test.ts tests/security/social-scheduler-b111c-migration-security.test.ts tests/security/security-boundary.test.ts
```

**30 passed / 3 files.**

Coverage includes: gate matrix; cron auth (missing/wrong/query/Owner-without-machine-auth); due/future/null clocks; 15-minute C refuse; dry-run no claim; scheduling ON + publishing OFF no claim; scheduling OFF + publishing ON no claim; zero due; batch 1 sequential; second-worker skip; UEO mapping; execute-core skip codes without credential load; static `vercel.json` / `maxDuration = 300` / no session; migration does not grant raw `claim_due` or create a second queue.

### Full Vitest

```text
npx vitest run
```

**2567 passed / 2 failed / 2569 total** (369 files: 367 passed, 2 failed).

Known pre-existing non-Social failures, not fixed:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

B1.11-B baseline was `2540 passed / 2 failed / 2542 total`. Net new: **27 passing tests**.

---

## P. Static / build

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (0 warnings/errors) |
| Production `npx vercel deploy --prod` | PASS — route `/api/cron/social-publications` live |

---

## Q. Production migration

Applied. Local file `20260821123346_add_social_scheduler_worker_domain.sql`. Remote versions:

* `20260821124312` `add_social_scheduler_worker_domain`
* `20260821124332` `add_social_scheduler_workflow_ready_and_list_due`
* `20260821124354` `add_scheduler_start_scheduled_publication_attempt`
* `20260821124413` `add_scheduler_load_and_complete_rpcs`

No Production scheduling rows inserted. Grants verified (section G).

---

## R. Production deployment

| Item | Value |
| --- | --- |
| Deployment id | `dpl_9KWUoRPKod5PoUKNxP9EooLmBTwn` |
| URL | `https://zyntixai-qb2h6zl6v-guus-projects-ai.vercel.app` |
| Target | production |
| Ready | YES |
| Canonical alias | `https://www.zyntixai.com` inspects to `dpl_9KWUoRPKod5PoUKNxP9EooLmBTwn` |
| Cron list | `/api/cron/social-publications` `0 0 * * *` (1 job) |
| `CRON_SECRET` | configured (encrypted) |
| `SOCIAL_SCHEDULING_ENABLED` | unset |
| `SOCIAL_PUBLISHING_ENABLED` | not exact `"true"` |

---

## S. Production dry-run verification

Triggered:

```text
npx vercel crons run /api/cron/social-publications --project zyntixai --scope guus-projects-ai
```

Invocation time: `2026-08-21T12:51:19.286Z`

Observed function logs (no secrets):

```text
{"event":"social_scheduler_invocation_start","invocationId":"2ee169e3-357f-4f60-acec-d84a0ae2c6e2","mode":"dry-run","schedulingEnabled":false,"publishingEnabled":false}
{"event":"social_scheduler_due_discovered","invocationId":"2ee169e3-357f-4f60-acec-d84a0ae2c6e2","dueDiscovered":0,"dueStale":0}
{"event":"social_scheduler_invocation_complete","invocationId":"2ee169e3-357f-4f60-acec-d84a0ae2c6e2","mode":"dry-run","claimed":0,"providerWriteAttempted":false,"durationMs":1295}
```

No Production scheduled publication was created to force a nonzero due count.

Post-invoke SQL (read-only):

| Item | Value |
| --- | --- |
| Scheduled count | 0 |
| Currently due | 0 |
| Claimed / processing | 0 |
| Active leases | 0 |
| Attempts after R2 | 0 |
| Publication events after `2026-08-21 12:40:00+00` | 0 |
| Latest attempt started_at | `2026-08-21 11:04:45.134868+00` (unchanged R2-era) |
| Active controlled windows | 0 |
| Connected Instagram | 1 (`24420652-d0b4-4237-9a75-51d89be50c65`) |
| Health / credential version | `healthy` / 2 |
| `private.social_publishing_execution_enabled()` | false |

---

## T. Production mutation summary

| Item | Result |
| --- | --- |
| Vercel Cron deployed | **YES** (`0 0 * * *`) |
| Scheduler route deployed | **YES** |
| Scheduler machine auth configured | **YES** (`CRON_SECRET`) |
| `SOCIAL_SCHEDULING_ENABLED` final | **FALSE** (unset) |
| `SOCIAL_PUBLISHING_ENABLED` final | **FALSE** (not exact `"true"`) |
| Production scheduled publication created | **NO** |
| Production publication claimed | **NO** |
| Production attempt created | **NO** |
| Provider adapter called | **NO** |
| Instagram container created | **NO** |
| `media_publish` called | **NO** |
| Instagram post created | **NO** |
| Instagram connection mutated | **NO** |
| Credential mutated | **NO** |
| Controlled window opened | **NO** |

Allowed C mutations that did occur: schema RPCs; deployed cron + route; dry-run operational logs.

---

## U. Remaining next phase

Exactly:

`SMM-B1.11-D — Missed Window + Attention`

Do not implement it in this phase.

Later, not started:

* `SMM-B1.11-E` — controlled scheduled IMAGE Production publish (requires both gates ON, Pro 5-minute cron, and separate owner approval)
* Hobby daily cron is insufficient for the locked 15-minute miss policy; upgrade is a prerequisite for live scheduled publishing, not for this fail-closed worker

Do not enable `SOCIAL_SCHEDULING_ENABLED`. Do not schedule a Production publication. Do not call `media_publish`.
