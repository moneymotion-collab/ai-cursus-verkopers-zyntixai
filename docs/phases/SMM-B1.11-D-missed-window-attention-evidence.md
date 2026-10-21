# SMM-B1.11-D — Missed Window + Attention — Evidence

## 1. Executive verdict

```text
SMM-B1.11-D CLOSED WITH EVIDENCE — MISSED WINDOW + ATTENTION READY
```

Scheduled publications more than **900 seconds** late no longer remain executable. The scheduler marks them `manual_intervention` / `schedule_missed` and upserts one high-severity Attention item on the existing Attention tables. Automatic provider writes remain gated OFF. Production dry-run reported `missedMarked: 0` and `attentionUpserted: 0`. No Production scheduled row, Social Attention item, or Instagram write was created.

Live automatic 15-minute scheduled publishing is **not** Production ready while Vercel Cron remains daily (`0 0 * * *`). That cadence gap is a later `SMM-B1.11-E` prerequisite, not a D implementation failure.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Start HEAD | `1f3113d8394673e0ba849e87f609bcc8e5f4f46e` |
| Implementation commit | `cd904e9b56899229315bd059437f092ed4d31ced` |
| Branch | `core/platform-readiness-20260707` |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Prior milestone | `SMM-B1.11-C CLOSED WITH EVIDENCE — FAIL-CLOSED SCHEDULER WORKER READY` |
| B1.11-C implementation | `390305a882516c5af84462a0edd2acf7d2027119` |
| B1.11-C evidence HEAD | `1f3113d8394673e0ba849e87f609bcc8e5f4f46e` |
| Prior Production deployment | `dpl_9KWUoRPKod5PoUKNxP9EooLmBTwn` |

Production safety at phase start (read-only):

| Item | Value |
| --- | --- |
| Instagram connection | `24420652-d0b4-4237-9a75-51d89be50c65` `connected` / `healthy` |
| Credential version | 2 |
| Connected Instagram connections | 1 |
| Scheduled publications | 0 |
| Currently due / stale | 0 |
| Active controlled windows | 0 |
| `private.social_publishing_execution_enabled()` | false |
| Attempts after R2 `2026-08-21T11:05:55.829837+00` | 0 |
| Existing Attention items | 10 (enrollment) |
| `SOCIAL_SCHEDULING_ENABLED` | unset (effectively FALSE) |
| `SOCIAL_PUBLISHING_ENABLED` | present, not exact `"true"` |
| Cron | `/api/cron/social-publications` `0 0 * * *` |

---

## B. Production safety baseline

Confirmed before implementation and again after D deploy:

* same Instagram connection, connected, healthy, credential version 2, one active Instagram connection;
* scheduler cron and `CRON_SECRET` remain configured;
* scheduling gate OFF;
* publishing execution false;
* scheduled count 0.

No live Instagram publish was performed.

---

## C. Attention architecture before/after

### Before (repository evidence)

Attention was enrollment-oriented:

* tables: `attention_items`, `attention_signals`, `attention_item_events`;
* TypeScript hardcoded `source_type = "enrollment"`;
* only rule key: `enrollment_no_recent_progress`;
* dedupe: `attention:enrollment:{org}:{enrollmentId}:{signalKey}`;
* evaluator `evaluate_attention_rules` remains enrollment-only;
* list/detail UI assumed Customer / Program / Enrollment context;
* lifecycle RPCs (acknowledge / resolve / dismiss / archive) were already source-agnostic.

### After

Existing Attention tables were generalized. No `social_attention_items`, `social_notifications`, `social_alerts`, or scheduler inbox tables.

* `attention_items.source_type` / `source_entity_id`;
* optional `social_publication_id` / `social_connection_id`;
* enrollment FKs remain for enrollment items; Social items leave them null;
* trigger `attention_items_fill_source_defaults` keeps existing enrollment INSERTs valid;
* `evaluate_attention_rules` unchanged.

Atomicity decision:

* **Missed window:** publication transition + Attention upsert happen in one RPC (`scheduler_mark_scheduled_publication_missed`). If Attention upsert fails, the function raises `P0001` so the transaction does not commit a silent `manual_intervention`.
* **UEO / reauth / permission / terminal:** Attention upsert runs after the existing lifecycle write. The next scheduling-ON tick is idempotent via dedupe. Documented reconciliation, not a second event bus.

---

## D. Social Attention source model

Source types: `enrollment` | `social_publication` | `social_connection`.

Dedupe: `attention:{source_type}:{organization_id}:{source_entity_id}:{rule_key}`.

Non-terminal uniqueness remains on `(organization_id, source_type, source_entity_id, dedupe_key)` for open/acknowledged items.

Enrollment rule `enrollment_no_recent_progress` is unchanged.

---

## E. Rule matrix

| Condition | Rule key | Severity | Publication action | Provider write |
| --------- | -------- | -------- | ------------------ | -------------- |
| `seconds_late > 900` while still due/executable | `scheduled_publication_missed` | high | `manual_intervention` + `schedule_missed` | NO |
| `unknown_external_outcome` | `publication_result_unknown` | critical | remains non-retryable | already happened or unknown; no retry |
| bound account requires reauthorization | `social_account_reauthorization_required` | high | no claim / no write | NO |
| required capability (e.g. `publish_image`) missing | `provider_permission_missing` | high | no claim / no write | NO |
| other terminal scheduled failure | `scheduled_publication_failed` | high | existing terminal status | NO |
| `failed_retryable` with future `next_attempt_at` | none | — | automatic retry remains | later, if gates ON |
| success | none | — | `succeeded` | already completed |
| cancelled | none | — | skipped | NO |
| future / not yet due | none | — | remains scheduled | NO |
| read-only dry-run | none | — | no mutation | NO |

Most-specific rule wins. Reauth and missing-permission are not also given the generic failure item for the same condition.

---

## F. 15-minute missed contract

Owner policy:

* `0 <= seconds_late <= 900` → still eligible for automatic execution;
* `seconds_late > 900` → must not auto-publish.

TypeScript `isMissedBeyondSchedulerGrace` and SQL `extract(epoch from (now() - due)) <= 900` agree.

Proven tests:

* 899s → not missed;
* 900s → still grace;
* 901s → missed;
* missed path never calls `executePublication`.

---

## G. Missed transition

RPC: `public.scheduler_mark_scheduled_publication_missed(p_organization_id, p_publication_id)`  
`service_role` only.

Exact durable state:

* `status = 'manual_intervention'`
* `last_failure_class = 'schedule_missed'`
* claim fields cleared
* `completed_at` set
* event `social_publication_manual_intervention` with `safe_error_code = schedule_missed`
* Attention upsert `scheduled_publication_missed`

Already-missed rows return `already_missed` and re-upsert the same Attention (dedupe). Succeeded / cancelled / UEO / terminal / processing return `conflict`. Future or in-grace clocks return `not_missed`.

Due discovery already excludes `manual_intervention`. Start still returns `missed_window` without claiming if a stale row slips through.

---

## H. Dedupe

Identity: organization + source type + source entity UUID + rule key.

Cron ×10 against the same missed publication (unit): 10 mark calls, one logical Attention id returned, zero provider writes.

Production: no Social Attention rows exist, so no live spam was created.

---

## I. Recovery semantics

B1.11-A `reschedule_social_publication` / `cancel_scheduled_social_publication` still refuse generic `manual_intervention`.

D adds a **narrow** Owner/Admin recovery, not a generic reopen:

* `reschedule_missed_social_publication` — requires `manual_intervention` + `schedule_missed` + `execution_mode = scheduled` + future UTC; same publication UUID; restores `queued`; clears missed metadata; sets `intended_execute_at = next_attempt_at`; resolves `scheduled_publication_missed`.
* `cancel_missed_social_publication` — same preconditions; sets `cancelled`; resolves Attention.

Staff / Viewer denied in the server action before RPC. Foreign org denied via authoritative organization context. `service_role` cannot execute recovery RPCs.

No automatic “retry now” for UEO.

---

## J. Connection / permission intervention

Scheduler execution-time skip codes `capability_missing`, `connection_ineligible`, `credential_unavailable`, and `format_unsupported` call `scheduler_upsert_social_intervention_attention`.

SQL selects:

* UEO / `unknown_external_outcome` → critical `publication_result_unknown` on the publication;
* `capability_missing` → high `provider_permission_missing` on the connection;
* `connection_ineligible` **and** `reauthorization_required_at is not null` → high `social_account_reauthorization_required` on the connection;
* other listed terminal hints → high `scheduled_publication_failed` on the publication.

Successful reauthorization (`status=connected`, `health=healthy`, `reauthorization_required_at` cleared) resolves active `social_account_reauthorization_required` via trigger `social_account_connections_resolve_reauth_attention`.

Deep links:

* publication Attention → `/social?org=…&section=activity&publication=…`
* connection Attention → `/social?org=…&section=accounts`

Query params select UI state only. They never authorize tenant access.

---

## K. UEO handling

`unknown_external_outcome` remains skipped by due discovery and is not retryable. D additionally upserts critical Attention `publication_result_unknown`. Copy tells the user the external result could not be confirmed and not to retry blindly. No retry button was added.

---

## L. Tenant / role security

* Organization comes from the publication/connection row, not URL, cron body, or browser state.
* Cross-org source UUID fails closed (`not_found` / `forbidden` inside upsert helpers).
* Scheduler Attention writes use `service_role` after `private.assert_social_scheduler_service_role()`.
* End-user Attention lifecycle RPCs are unchanged.
* Missed recovery is Owner/Admin authenticated only.

Production grants:

| Function | anon | authenticated | service_role |
| --- | --- | --- | --- |
| `scheduler_mark_scheduled_publication_missed` | false | false | true |
| `scheduler_upsert_social_intervention_attention` | false | false | true |
| `reschedule_missed_social_publication` | false | true | false |
| `cancel_missed_social_publication` | false | true | false |
| `private.upsert_social_rule_attention_item` | false | false | false |
| `private.resolve_social_attention_for_dedupe` | false | false | false |

---

## M. Calendar / Activity integration

Calendar kind `schedule_missed` labels **Missed**. `canReschedule` stays false; `canRecoverMissed` is true for Owner/Admin. Original `intended_execute_at` remains visible. The publication UUID is not deleted.

Activity copy: `missed schedule (not posted automatically)`.

Reschedule recovery repositions the same UUID to the new future instant.

---

## N. Scheduler integration

Minimal C worker change:

1. list due;
2. if `SOCIAL_SCHEDULING_ENABLED === "true"`, mark stale rows via missed RPC (Attention included);
3. skip marked IDs in the execute loop;
4. claim/execute only when both gates are exact `"true"`;
5. upsert intervention Attention for UEO / capability / connection / terminal outcomes.

Summary fields: `dueDiscovered`, `dueWithinGrace`, `dueStale`, `missedMarked`, `attentionUpserted`, `claimed`, `providerWriteAttempted`.

Dry-run / scheduling OFF: `missedMarked = 0`, `attentionUpserted = 0` always.

Cron cadence was **not** changed.

---

## O. Tests

### Targeted D + regression

```text
npx vitest run tests/features/social-media/social-missed-window-attention.test.ts tests/security/social-attention-b111d-migration-security.test.ts tests/features/social-media/schedule-social-publication-actions.test.ts tests/features/social-media/social-scheduler-worker.test.ts tests/domain/attention-typed-domain.test.ts tests/ui/attention-presentation.test.ts tests/security/attention-migration-security.test.ts tests/security/attention-rpc-migration-security.test.ts tests/security/social-closed-beta-enrollment-migration-security.test.ts tests/security/social-closed-beta-entitlement-defense-r1ar1.test.ts tests/security/social-closed-beta-operator-r1b-migration-security.test.ts
```

**113 passed / 11 files.**

Coverage includes: 899/900/901; dry-run no mutation; scheduling ON / publishing OFF marks stale without provider write and does not mark in-grace work; cron×10 one Attention id; UEO critical Attention; capability missing; connection ineligible; terminal failure; retryable/success no failure Attention; Calendar Missed badge; source/rule labels; Owner missed reschedule; Staff/Viewer/foreign-org deny; C worker regression (auth, gates, batch 1, second-worker skip, UEO mapping, missed_window start skip); enrollment Attention presentation; closed-beta last-migration inventory.

### Full Vitest

```text
npx vitest run
```

**2591 passed / 2 failed / 2593 total** (371 files: 369 passed, 2 failed).

Known pre-existing non-Social failures, not fixed:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

C baseline was `2567 passed / 2 failed / 2569 total`. Net new: **24 passing tests**.

---

## P. Existing Attention regression

Enrollment mapping, empty-state (now mentions Social operations as well as enrollments), list/detail labels, typed domain, and Attention migration/RPC security tests passed. `evaluate_attention_rules` was not rewritten. Production still has **10** enrollment Attention items, `source_type = enrollment`, **0** Social Attention items.

---

## Q. Static / build

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| eslint on D-touched files | PASS |
| `npx next build` | PASS — `/attention`, `/attention/[attentionItemId]`, `/social`, `/api/cron/social-publications` built |
| Production `npx vercel deploy --prod` | PASS — Ready, aliased to `https://www.zyntixai.com` |

Known Next warning (pre-existing): autoprefixer `end` vs `flex-end` in closed-beta operator CSS.

---

## R. Database migration

Local forward-only file:

`supabase/migrations/20260821130449_add_social_attention_missed_window_domain.sql`

Remote split apply (same SQL, C pattern; applied migrations were not edited):

1. `20260821131741` `add_social_attention_missed_window_domain` (`schedule_missed` failure class)
2. `20260821131905` `add_social_attention_source_generalization`
3. `20260821132010` `add_social_attention_upsert_and_missed_mark`
4. `20260821132110` `add_social_rule_attention_upsert_helpers`
5. `20260821132135` `add_social_attention_resolve_helper`
6. `20260821132156` `add_scheduler_mark_scheduled_publication_missed`
7. `20260821132216` `add_scheduler_upsert_social_intervention_attention`
8. `20260821132232` `add_reschedule_missed_social_publication`
9. `20260821132249` `add_cancel_missed_social_publication`
10. `20260821132443` `add_social_reauth_attention_resolve_trigger`

Existing 10 enrollment Attention rows backfilled: `source_type` / `source_entity_id` non-null. No Production Social mutation.

---

## S. Production deployment

| Item | Value |
| --- | --- |
| Deployment id | `dpl_2TyTqu2sjUWt1T2nFUtPASSdD1N8` |
| URL | `https://zyntixai-d8y0gfx8m-guus-projects-ai.vercel.app` |
| Target | production |
| Ready | YES |
| Canonical alias | `https://www.zyntixai.com` inspects to `dpl_2TyTqu2sjUWt1T2nFUtPASSdD1N8` |
| Attention routes | `/attention` and `/attention/[attentionItemId]` present on the Ready deployment |
| Cron list | `/api/cron/social-publications` `0 0 * * *` (1 job) |
| `CRON_SECRET` | configured (encrypted) |
| `SOCIAL_SCHEDULING_ENABLED` | **unset** |
| `SOCIAL_PUBLISHING_ENABLED` | present, not exact `"true"` |

---

## T. Production read-only verification

Triggered:

```text
npx vercel crons run /api/cron/social-publications --project zyntixai --scope guus-projects-ai
```

Invocation time: `2026-08-21T13:30:48.490Z`

Observed function logs (no secrets):

```text
{"event":"social_scheduler_invocation_start","invocationId":"502f66ed-a372-4e9f-be7f-647c9a1dd3d6","mode":"dry-run","schedulingEnabled":false,"publishingEnabled":false}
{"event":"social_scheduler_due_discovered","invocationId":"502f66ed-a372-4e9f-be7f-647c9a1dd3d6","dueDiscovered":0,"dueWithinGrace":0,"dueStale":0}
{"event":"social_scheduler_invocation_complete","invocationId":"502f66ed-a372-4e9f-be7f-647c9a1dd3d6","mode":"dry-run","claimed":0,"missedMarked":0,"attentionUpserted":0,"providerWriteAttempted":false,"durationMs":1243}
```

Post-invoke SQL (read-only):

| Item | Value |
| --- | --- |
| Scheduled count | 0 |
| Missed rows | 0 |
| Claimed / processing | 0 |
| Attempts after R2 | 0 |
| Latest attempt started_at | `2026-08-21 11:04:45.134868+00` (unchanged R2-era) |
| Enrollment Attention | 10 |
| Social Attention | 0 |
| Attention total | 10 |
| Connected Instagram | 1 (`24420652-d0b4-4237-9a75-51d89be50c65`) |
| Health / credential version | `healthy` / 2 |
| `private.social_publishing_execution_enabled()` | false |

No fake stale Production publication was created.

---

## U. Cron cadence limitation

| Item | Value |
| --- | --- |
| Current deployed cadence | `0 0 * * *` (00:00 UTC) |
| Target before live scheduled verification | approximately `*/5 * * * *` (three ticks inside the 15-minute grace) |
| Current Vercel plan | Hobby — sub-daily Cron rejected historically |
| Classification | **PRODUCTION LIVE SCHEDULING PREREQUISITE** |

This is **not** a D implementation failure. D must not claim that live automatic 15-minute scheduling is Production ready.

No Vercel plan upgrade, billing change, or second scheduler vendor was introduced.

---

## V. Production mutation statement

| Item | Result |
| --- | --- |
| Production scheduled publication created | **NO** |
| Production missed publication mutation | **NO** |
| Production Social Attention created | **NO** |
| Scheduler live execution | **NO** |
| Publishing enabled | **NO** |
| Provider adapter called | **NO** |
| Instagram container | **NO** |
| `media_publish` | **NO** |
| Instagram post | **NO** |
| Connection mutation | **NO** |
| Credential mutation | **NO** |

Allowed D mutations: schema/RPC apply; Production app deploy; authorized dry-run logs.

---

## W. Remaining prerequisite for B1.11-E

Only requirements before controlled scheduled IMAGE Production (`SMM-B1.11-E`):

1. Scheduler cadence compatible with the locked 15-minute grace (recommended ~`*/5 * * * *`). Current daily Hobby Cron is insufficient.
2. Explicit owner authorization for B1.11-E.
3. Controlled gate choreography (`SOCIAL_SCHEDULING_ENABLED` / `SOCIAL_PUBLISHING_ENABLED`) for a specific test publication — not enabled in D.

Do not enable either gate now. Do not schedule a Production publication. Do not start Stories or Analytics.

---

## Gate matrix (chosen invariant)

| Scheduling | Publishing | Missed mutation + Attention from scheduler | Provider write |
| --- | --- | --- | --- |
| OFF | anything | **NO** (dry-run) | NO |
| ON | OFF | **YES** for stale due work | NO |
| ON | ON | YES missed for stale; in-grace may execute | YES (existing C rules) |

Missed mutation requires scheduling ON only. Publishing only gates provider writes. Rollout isolation: do not enable scheduling globally until the controlled test publication is ready. Production currently has 0 scheduled rows.

---

## Next phase

`SMM-B1.11-E — Controlled Scheduled IMAGE Production`

**NOT YET AUTHORIZED**

**BLOCKED UNTIL SCHEDULER CADENCE SUPPORTS THE 15-MINUTE POLICY**
