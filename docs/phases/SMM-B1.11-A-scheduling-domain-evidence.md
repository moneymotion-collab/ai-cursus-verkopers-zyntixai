# SMM-B1.11-A — Scheduling Domain + Schedule / Cancel / Reschedule — Evidence

## 1. Executive verdict

```text
SMM-B1.11-A CLOSED WITH EVIDENCE — SCHEDULING DOMAIN READY
```

`social_publications` remains the execution source of truth. No `social_schedules` table. No worker, cron, calendar UI, Story publish, Attention, or Production scheduled publication. Publishing remains fail-closed OFF.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Start HEAD | `1757ee2fd9a186cb9572cbd4340388336a8f86c9` |
| Implementation commit | `3519012c19d8f74afd0255f47dd2ba278e4c19e2` |
| Branch | `core/platform-readiness-20260707` |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Prior milestone | `SMM-B1.7-R2 CLOSED WITH EVIDENCE` |

---

## B. Locked owner decisions

| Decision | Enforcement in B1.11-A |
| --- | --- |
| Owner may schedule / reschedule / cancel | Domain `canScheduleSocialPublication` + SQL `can_manage_social_connections` |
| Admin may schedule / reschedule / cancel | Same |
| Staff must not mutate execution clock | Denied at action and RPC |
| Viewer read-only | Denied at action and RPC |
| UTC `timestamptz` execution clock | `intended_execute_at` / `next_attempt_at` |
| Unambiguous instant required | ISO-8601 with `T` + `Z` or ±offset; naive local strings rejected |
| 15-minute missed grace | Recorded as `SOCIAL_SCHEDULE_MISS_GRACE_SECONDS = 900` for **B1.11-D only**. Not executed. |
| Immediate publish remains a separate path | Prepare still `execution_mode=immediate`; future Execute returns `none_due` |

`SOCIAL_SCHEDULING_ENABLED` was **not** added. Automatic execution is B1.11-C.

---

## C. Existing architecture reused

- Content chain: item → variant → immutable `variant_version_id` → publication
- Clock fields: `execution_mode`, `intended_execute_at`, `next_attempt_at`
- Due index `social_publications_claim_due_idx` (unchanged, not duplicated)
- Claim/lease/`none_due` on `b18_start_controlled_publication_attempt`
- Cancelled lifecycle + `social_publication_cancelled` event
- Owner/Admin actor helpers from connection mutations
- Workflow readiness RPC at schedule/reschedule time (fail-closed, no auto-approve)

Schedule slots remain an optional editorial overlay. Publication clock wins. Slot-move drift is **B1.11-B**.

---

## D. Migration

Local file (single additive migration):

`supabase/migrations/20260821114627_add_social_publication_scheduling_domain.sql`

Production apply (MCP `apply_migration`; schema only; no publication rows mutated):

| Remote version | Name |
| --- | --- |
| `20260821115233` | `add_social_publication_scheduling_domain` (event-type CHECK) |
| `20260821115244` | `add_social_publication_scheduling_rpcs` (actor helper) |
| `20260821115530` | `add_schedule_social_publication_rpc` |
| `20260821115549` | `add_reschedule_social_publication_rpc` |
| `20260821115601` | `add_cancel_scheduled_social_publication_rpc` |

RPCs:

- `private.assert_social_publication_schedule_actor`
- `public.schedule_social_publication`
- `public.reschedule_social_publication`
- `public.cancel_scheduled_social_publication`

Granted to `authenticated` only. Revoked from `anon` and `service_role`. `search_path = ''`. `FOR UPDATE` then conditional `UPDATE`.

No `social_schedules` table. No new due index.

---

## E. Schedule contract

Eligible: `pending` \| `queued` \| `failed_retryable`, `execution_mode` not already `scheduled`, no `processing` attempt, connected connection, workspace not archived, `workflow_ready`.

Mutations (only):

- `execution_mode = scheduled`
- `intended_execute_at = FUTURE_UTC`
- `next_attempt_at = FUTURE_UTC` (aligned)

Unchanged: publication UUID, `variant_version_id`, `connection_id`, `content_id`, `provider`, media snapshot.

Past/now: `invalid_time`. Naive/ambiguous timestamp: action `invalid_request` before RPC.

Same instant already scheduled: `already_scheduled` (success, no duplicate row).

Already scheduled at a different instant: `conflict` (must call reschedule).

---

## F. Reschedule contract

Same publication UUID. Requires `execution_mode = scheduled` and eligible status. Updates `intended_execute_at` and `next_attempt_at` atomically so the old due instant cannot remain. Event `social_publication_rescheduled` records previous and new instants.

Immediate rows: `not_scheduled`. Claimed/processing: `conflict`. Cancelled: `conflict`.

---

## G. Cancel contract

`cancel_scheduled_social_publication` is Owner/Admin only and requires `execution_mode = scheduled`.

Before claim (`pending`/`queued`/`failed_retryable`): status → `cancelled`, event `social_publication_cancelled`.

Claimed / processing / succeeded / UEO: `conflict`.

Second cancel: `conflict`.

Does not reopen cancelled rows. Existing Staff-capable `cancel_social_publication` for **immediate** leftovers is unchanged.

---

## H. Eligibility matrix

| Status | Schedule | Reschedule | Cancel scheduled |
| --- | ---: | ---: | ---: |
| `pending` | YES if immediate | YES if scheduled | YES if scheduled |
| `queued` | YES if immediate | YES if scheduled | YES if scheduled |
| `failed_retryable` | YES if immediate | YES if scheduled | YES if scheduled |
| `claimed` | NO | NO | NO |
| `processing` | NO | NO | NO |
| `succeeded` | NO | NO | NO |
| `cancelled` | NO | NO | NO |
| `failed_terminal` | NO | NO | NO |
| `manual_intervention` | NO | NO | NO |
| `unknown_external_outcome` | NO | NO | NO |

---

## I. Tenant / role security

| Actor | Schedule | Reschedule | Cancel scheduled |
| --- | --- | --- | --- |
| Owner own org | YES | YES | YES |
| Admin own org | YES | YES | YES |
| Staff | NO | NO | NO |
| Viewer | NO | NO | NO |
| Foreign org / foreign publication | NO (`forbidden` / `not_found`) | same | same |
| Client `org` mismatch | `resolveOrganizationContext` fail-closed | same | same |

---

## J. Concurrency behavior

Row `FOR UPDATE` then conditional `UPDATE` on eligible status + mode. Concurrent reschedules serialize; last committed future instant wins. Cancel vs reschedule: the first lock wins; the loser sees `cancelled` or a new clock and returns `conflict` / `not_scheduled` as applicable. Schedule vs Execute: future clock → Execute `none_due` and no attempt; if Execute already claimed, schedule sees `conflict`.

---

## K. Immediate-publishing regression

- Prepare still creates `execution_mode: "immediate"`.
- `b18_start` still returns `none_due` when `coalesce(next_attempt_at, intended_execute_at) > now()`.
- Execute mock: `none_due` → adapter `from()` never called; complete RPC never called.
- Publishing gate remains OFF in Production.

---

## L. Tests

Targeted B1.11-A + inventory updates: **73 passed** (11 files).

Social publishing/feature/security after inventory fix: **296 passed** (49 files; 3 inventory failures fixed then re-run 15 passed).

Full Vitest:

```text
npx vitest run
Test Files  2 failed | 360 passed (362)
Tests       2 failed | 2512 passed (2514)
```

Pre-existing non-Social failures (unchanged identity, not fixed in B1.11-A):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

---

## M. Static / build

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS (generated `database.generated.ts` was **not** committed: `supabase gen types --linked` introduced unrelated onboarding nullability drift. Schedule actions use typed `as never` RPC calls, same pattern as B1.9.) |
| `npx next lint` | PASS (0 warnings/errors) |
| `npx next build` | PASS |

No `/api/cron`. No Vercel Cron. No Story prepare/execute.

---

## N. Production migration state

Schema applied. Functions present. `authenticated` can execute schedule RPC; `anon` and `service_role` cannot.

`execution_mode = scheduled` publication count: **0**.

Attempts after R2 `11:05:55+00`: **0**.

---

## O. Production mutation summary

| Item | Result |
| --- | --- |
| Publishing enabled | **NO** |
| Automatic worker | **NO** |
| Production scheduled publication created | **NO** |
| Provider write / `media_publish` | **NO** |
| Instagram post | **NO** |
| Connection mutation | **NO** |
| Credential mutation | **NO** |
| Controlled window | still `consumed`; active windows **0** |
| Instagram connection | `connected` / `healthy`; credential version **2** |

---

## P. Remaining next phase

Only:

`SMM-B1.11-B — Calendar + Scheduling UX`

Do not implement it in this phase.
