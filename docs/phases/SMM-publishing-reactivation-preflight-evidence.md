# SMM-PUBLISHING-REACTIVATION-PREFLIGHT — Production Execution Gate Readiness

| Field | Value |
| --- | --- |
| Phase | **SMM-PUBLISHING-REACTIVATION-PREFLIGHT** |
| Document type | Readiness / preflight evidence |
| Date | 2026-08-28 |
| Formal status | `SMM-PUBLISHING-REACTIVATION-PREFLIGHT CLOSED WITH EVIDENCE — OWNER QUEUE DISPOSITION REQUIRED BEFORE REACTIVATION` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `f2a6d02953f0e50c4f208ec8bac917a6a5e6bc09` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Production app | `https://www.zyntixai.com` |
| Prior SMM FV | `docs/phases/SMM-B1-FV-social-media-management-beta-1-final-verification-evidence.md` |

This phase inspects Production Social publishing readiness. It does **not** enable publishing, enable scheduling, open a publish window, reconnect OAuth, or perform a provider write.

`PUBLISHING EXECUTION = OFF`

`SCHEDULING EXECUTION = OFF`

`PROVIDER WRITE ATTEMPTED = FALSE`

`IMMEDIATE ELIGIBLE PUBLICATIONS IF PUBLISHING IS ENABLED = 0` (automatic scheduler)

Five stale **immediate** `queued` QA publications remain. They are not scheduler-eligible. They would still become human-executable if publishing is turned ON **and** a new one-shot window is bound to their IDs. They must be owner-reviewed before any reactivation.

---

## 1. Executive verdict

Infrastructure is fail-closed and healthy. Instagram connection `24420652-d0b4-4237-9a75-51d89be50c65` (`zyntixai`, Business) is connected/healthy, token refreshed 2026-08-28, expiry 2026-10-27. One authoritative Cron path fires `*/5` into the Vercel worker. Live ticks are `mode=dry-run`, both env gates false, `dueDiscovered=0`, `claimed=0`, `providerWriteAttempted=false`.

Automatic reactivation of **both** worker gates would not publish anything immediately. Five leftover immediate `queued` rows plus six abandoned `authorization_pending` connections require owner disposition before a later controlled write.

`SMM PUBLISHING REACTIVATION READINESS = READY WITH CONTROLLED QUEUE DISPOSITION REQUIRED`

---

## 2. Reason for preflight

Social publishing and scheduling were Production-verified, then returned to a safe OFF state. DATA phases were not authorized to change Social gates. This preflight answers whether the execution gate can be re-enabled without accidentally publishing stale, queued, duplicated, or unauthorized content.

---

## 3. Repository start state

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `f2a6d02953f0e50c4f208ec8bac917a6a5e6bc09` |
| Subject | `docs(data): verify controlled Production source structure discovery` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `f2a6d02953f0e50c4f208ec8bac917a6a5e6bc09` |
| Divergence | `0 0` |
| Status | clean |
| `git diff --check` | clean |

No Social implementation change. No migration. `DB-MIGRATION-DRIFT-01` untouched.

---

## 4. Prior SMM evidence dependency

Latest whole-product Social FV:

`SMM-B1-FV CLOSED WITH EVIDENCE — SOCIAL MEDIA MANAGEMENT BETA 1 PRODUCTION VERIFIED`

Supporting Production write proofs remain B1.8 / B1.7-R2 (immediate IMAGE), B1.11-E (scheduled IMAGE), B1.11-G (scheduled Story IMAGE). This preflight re-measures current gates, Cron, connection, and queue rather than repeating those writes.

---

## 5. Publishing architecture

Verified from current code:

```text
Owner/Admin action or scheduler
  → SOCIAL_PUBLISHING_ENABLED exact "true" (Vercel env; fail-closed)
  → closed-beta entitlement
  → SECURITY DEFINER start RPC
  → one-shot controlled window consume (publication-bound)
  → claim lock
  → Instagram adapter (provider write)
  → attempt/status persistence
```

Immediate execute: `executeB18ImagePublication` in `src/features/social-media/server/b18-execute-image-publication.ts`. Adapter: `src/features/social-media/server/instagram-publishing/adapter.ts`.

DB helper `private.social_publishing_execution_enabled()` reads GUC `zyntix.social_publishing_enabled` (exact `'true'`). Worker/start RPCs set that GUC **transaction-local** after the env gate has already been checked. The operational kill-switch is the Vercel env, not a permanently-on database setting.

---

## 6. Scheduling architecture

```text
Supabase pg_cron job zyntixai_social_publication_scheduler_5m
  */5 * * * *
  → select private.invoke_social_publication_scheduler()
  → Vault secret zyntixai_social_scheduler_cron_secret
  → Bearer POST https://www.zyntixai.com/api/cron/social-publications
  → authorizeSocialSchedulerCronHeader (CRON_SECRET)
  → runSocialPublicationScheduler
```

Route: `src/app/api/cron/social-publications/route.ts`. Worker: `src/features/social-media/server/run-social-publication-scheduler.ts`.

Automatic provider execution requires **both** `SOCIAL_SCHEDULING_ENABLED` and `SOCIAL_PUBLISHING_ENABLED` exact `"true"`. Either missing/false → `mode=dry-run`, no claim, no adapter.

`vercel.json` `"crons": []`. Native Vercel Social Cron count remains **0**. One authoritative timer.

---

## 7. Gate configuration source

| Gate | Source | Enable predicate | Default |
| --- | --- | --- | --- |
| Publishing (worker + immediate TS) | Vercel env `SOCIAL_PUBLISHING_ENABLED` | trim+lower === `"true"` | unset = OFF |
| Scheduling (worker) | Vercel env `SOCIAL_SCHEDULING_ENABLED` | trim+lower === `"true"` | unset = OFF |
| Publishing (SQL helpers) | GUC `zyntix.social_publishing_enabled` | exact `'true'` | unset = false |
| Missed-window mutation | scheduling env only | exact `"true"` | OFF → no missed writes |

No `NEXT_PUBLIC_` variants.

---

## 8. Current publishing state

Live worker JSON (automatic ticks, not manually invoked):

`publishingEnabled = false`

Database: `private.social_publishing_execution_enabled()` = **false**; `current_setting('zyntix.social_publishing_enabled', true)` = NULL.

`PUBLISHING EXECUTION = OFF`

Fail-closed: only exact `"true"` enables.

---

## 9. Current scheduling state

Live worker JSON: `schedulingEnabled = false`, `mode = dry-run`.

No scheduling GUC is used for the worker. Unset/disabled env means dry-run discovery only.

`SCHEDULING EXECUTION = OFF`

---

## 10. Cron verification

| Check | Production |
| --- | --- |
| Job | `zyntixai_social_publication_scheduler_5m` jobid **1** |
| Active | **true** |
| Schedule | `*/5 * * * *` |
| Command | `select private.invoke_social_publication_scheduler();` |
| Duplicate Social Cron | **none** |
| Latest runs | 1956–1949 succeeded (`1 row`) at 09:00 … 08:25 UTC on 2026-08-28 |
| Vercel-native Social Cron | **0** |

---

## 11. Provider connection health

Intended target (only `connected` row):

| Field | Value |
| --- | --- |
| Connection ID | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Organization | QA `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Provider | Instagram |
| Status | `connected` |
| Health | `healthy` |
| Display name | `zyntixai` |
| Professional type | `business` |
| Reauthorization required | **no** |
| Credential ref | present |
| Last refreshed | `2026-08-28T08:44:24.004782+00:00` |
| Token expires | `2026-10-27T08:44:23.636+00:00` |
| Capabilities | `publish_image`, `publish_video`, `publish_carousel`, `publish_story`, `publish_short` |
| Closed-beta enrollment | `publishing_allowed` |

Tokens/secrets were not printed. No reconnect performed.

Six additional rows are `authorization_pending` with **no** credential ref, **no** connected_at, empty capability snapshot. They cannot publish. They are abandoned OAuth starts, not the live target.

---

## 12. Provider target

If reactivated, the worker/immediate path would target Instagram Business account labelled `zyntixai`, connection `24420652-d0b4-4237-9a75-51d89be50c65`, organization `2fc07699-ece5-44b9-bbb3-abbc23e9fffb`. External account ID is not printed beyond a non-secret prefix `178414`.

---

## 13. Publication inventory

Actual repository statuses (no `draft` / `scheduled` / `publishing` status names on `social_publications`; schedule is `execution_mode=scheduled`).

| Status × mode | Count |
| --- | --- |
| `queued` × immediate | 5 |
| `succeeded` × immediate | 4 |
| `succeeded` × scheduled | 2 |
| `manual_intervention` × immediate | 2 |
| pending / claimed / processing / failed_retryable / failed_terminal / cancelled | **0** |
| **Total** | **13** |

Open controlled windows: **0** (`consumed` 5, `closed` 1; none open/expired-open).

---

## 14. Immediately eligible records

Scheduler due query (scheduled + `pending|queued|failed_retryable` or expired-lease `claimed` + due_at ≤ now): **empty**.

`IMMEDIATE ELIGIBLE PUBLICATIONS IF PUBLISHING IS ENABLED = 0`

Automatic claim also requires scheduling ON. With both current gates OFF, live ticks report `dueDiscovered=0`.

---

## 15. Stale / overdue records

No overdue **scheduled** publications. The two scheduled rows are terminal `succeeded` (B1.11-E IMAGE `ae6caf94-2fc7-4653-a085-0228d32e0c53`, B1.11-G Story `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2`), `attempt_count=1`, provider ID present.

Five **immediate queued** rows have `intended_execute_at` in the past (2026-08-18, 08-19, 08-24), `attempt_count=0`, no provider ID. Scheduler **excludes** `execution_mode=immediate`. Immediate execute still requires env publishing ON **and** a new publication-bound window (none open).

Recommended disposition (do not delete in this phase):

| Publication ID | Mode | Status | Format | Created (UTC) | Provider ID | Recommendation |
| --- | --- | --- | --- | --- | --- | --- |
| `040e15f3-22f7-4b94-a16a-d30ee7ce24d4` | immediate | queued | image | 2026-08-18 13:28 | no | cancel or leave non-windowed |
| `1714161a-29dd-4070-a1f0-6e2411ff363b` | immediate | queued | image | 2026-08-18 13:30 | no | cancel or leave non-windowed |
| `9dd4f6ed-5d99-4cb9-9297-1051a5ed8564` | immediate | queued | image | 2026-08-18 13:31 | no | cancel or leave non-windowed |
| `f584f4bb-c90b-4f19-865b-c066408368c6` | immediate | queued | image | 2026-08-19 09:32 | no | cancel or leave non-windowed |
| `7da29316-5e4f-40ef-86d8-6695afb55793` | immediate | queued | story | 2026-08-24 17:12 | no | cancel or leave non-windowed |

Do not open a window against these IDs unless the owner explicitly wants to publish that leftover.

---

## 16. Failed / retryable records

`failed_retryable`: **0**.

`manual_intervention` (not reclaimable by scheduler):

| ID | Failure class | Provider ID |
| --- | --- | --- |
| `bdd8a0dc-936d-419a-ac35-4a5d8801fc27` | `provider_permanent` | no |
| `cd493386-f7e9-4b87-8243-76e80cb7009f` | `provider_permanent` | no |

These stay out of due discovery (`SOCIAL_SCHEDULER_SKIP_STATUSES`).

---

## 17. QA / test record status

Succeeded historical QA writes remain terminal (`attempt_count=1`, provider ID set). They cannot be reclaimed. No old succeeded post would retry when gates open.

---

## 18. Idempotency analysis

- Org-scoped `idempotency_key` on publications
- Claim via start RPC + `claim_generation` + 360s lease
- Batch size 1, sequential worker
- Terminal statuses not in due list
- Window consume is one-shot (`max_execute_count=1`); exhausted → `controlled_window_exhausted`
- Env gates evaluated **before** claim (`socialSchedulerAllowsClaim`); execute function re-checks both env flags and returns `feature_disabled` with `claimed=false`, `providerWriteAttempted=false`
- Dry-run discovers due rows but returns before `executeScheduledSocialPublication`

Crash-after-provider-write remains bounded by UEO / succeeded persistence from prior FV. Not re-tested with a live write.

---

## 19. Duplicate-prevention proof

Automated: `tests/features/social-media/social-scheduler-worker.test.ts`, `social-scheduler-controlled-rollout.test.ts`, story second-tick `controlled_window_exhausted`. Live E/G rows still `attempt_count=1`. Succeeded + UEO + `failed_terminal` + `manual_intervention` are not reclaimable.

---

## 20. Dry-run / no-write result

Observed automatic Production ticks (not `vercel crons run`, not manual `invoke_social_publication_scheduler`):

| UTC | HTTP id | Status | mode | scheduling | publishing | due | claimed | providerWriteAttempted |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-08-28 09:00:00 | 1924 | 200 | dry-run | false | false | 0 | 0 | false |
| 2026-08-28 08:55:00 | 1923 | 200 | dry-run | false | false | 0 | 0 | false |
| 2026-08-28 08:50:00 | 1922 | 200 | dry-run | false | false | 0 | 0 | false |
| 2026-08-28 08:45:00 | 1921 | 200 | dry-run | false | false | 0 | 0 | false |
| 2026-08-28 08:40:00 | 1920 | 200 | dry-run | false | false | 0 | 0 | false |
| 2026-08-28 08:35:00 | 1919 | 200 | dry-run | false | false | 0 | 0 | false |

Publication state was not mutated by these ticks (claimed remains null on queued immediate rows; succeeded rows unchanged).

---

## 21. Provider write attempt result

`PROVIDER WRITE ATTEMPTED = FALSE`

Gate OFF prevents adapter dispatch. Dry-run cannot call the provider.

---

## 22. Authorization model

| Action | Authority |
| --- | --- |
| Create / schedule / cancel publications | Owner/Admin membership RPCs |
| Immediate execute | Owner/Admin + publishing env + closed-beta + window |
| `/social` workspace | Owner/Admin; Staff/Viewer forbidden (B1.10/B1.11-B) |
| Execution gates | Platform env (not a member RPC) |
| Windows | Operator RPCs, service_role executor, human actor IDs |
| Scheduler worker | Bearer `CRON_SECRET` only; no member session |
| Query-secret | rejected (`?secret` / `?cron_secret` → 401) |

`service_role` is executor, not human approval.

---

## 23. Tenant isolation

Publications and connections are org-scoped. RLS plus SECURITY DEFINER membership asserts. Scheduler RPCs `service_role` only. Foreign org cannot use another org's connection. Automated coverage includes `social-calendar-tenant-security.test.ts` and social security migration files.

---

## 24. Targeted Social tests

`npx vitest run` on Social feature, domain, and security files:

| Slice | Files | Tests |
| --- | --- | --- |
| `tests/features/social-media` | 40 | 280 |
| `tests/domain/social-*.test.ts` + `tests/security/social-*.test.ts` | 36 | 219 |
| **Total** | **76** | **499** |

**499 passed / 499 total.**

Coverage included gate OFF/ON mocks, scheduling disabled, worker auth, provider-write suppression, claim/idempotency, duplicate prevention, retry/UEO, succeeded skip, missed window, provider errors, tenant isolation, Instagram adapter, Story IMAGE, controlled windows.

---

## 25. Targeted success rate

`SOCIAL TARGETED TEST SUCCESS RATE = 100%`

`499 / 499 = 100%`

---

## 26. Typecheck

`npx tsc --noEmit` — PASS

---

## 27. Lint

`npx next lint` — PASS (0 warnings / 0 errors)

---

## 28. Build

`next build` is not required by this Social preflight convention (same as DATA/SMM FV closures).

---

## 29. Full suite

`npx vitest run`

**3247 passed, 2 failed, 3249 total**

---

## 30. Full-suite percentage

`3247 / 3249 = 99.94%`

Do not call this 100%.

`FULL REPOSITORY 100% RESTORATION REMAINS A SEPARATE QUALITY OBJECTIVE`

---

## 31. Historical failures

Unchanged:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

`HISTORICAL FAILURES = 2`

Neither was modified.

---

## 32. New regressions

`NEW REGRESSIONS = 0`

---

## 33. Unrelated domain non-effects

No DATA/TAX/CAP/CTX/BQA/membership/invitation/Path B mutation in this phase.

Observed counts (read-only): DATA sessions 4, Customers 116, TAX releases 1, capabilities 13, context packs 2, memberships 22, invitations 16 — unchanged versus DATA-1E-FV. Social publication count 13 was already present; this phase did not insert/update/delete those rows.

---

## 34. Readiness decision

`SMM PUBLISHING REACTIVATION READINESS = READY WITH CONTROLLED QUEUE DISPOSITION REQUIRED`

Not BLOCKED: provider healthy, gates controllable, Cron known, auto-eligible count 0, writes suppressed while OFF, idempotency proven, tests 100%, no new regression.

Not fully READY: five stale immediate `queued` QA publications and six abandoned pending connections should be owner-classified before any gate or window is opened.

---

## 35. Proposed controlled Production reactivation plan

Do **not** execute now.

Preferred next phase: `SMM-PUBLISHING-REACTIVATION-FV`

1. Owner disposes the five queued immediate IDs (cancel or explicit keep).
2. Re-prove due list empty and no open windows.
3. Enable **only** `SOCIAL_PUBLISHING_ENABLED` if an immediate one-shot is chosen; keep `SOCIAL_SCHEDULING_ENABLED` OFF.
4. Open exactly one publication-bound window for a **new** owner-authorized publication (do not reuse stale queued IDs unless explicitly chosen).
5. Observe one worker/execute path.
6. Prove exactly one provider write and `attempt_count=1`.
7. Return gates to OFF unless permanent enablement is separately approved.

Safest first reactivation: publishing ON / scheduling OFF / one window / one new publication.

---

## 36. Required owner authorization

Do not infer from DATA or prior SMM test authorization.

Required for the later write phase:

`SMM-PUBLISHING-REACTIVATION-FV CONTROLLED PRODUCTION PROVIDER WRITE = AUTHORIZED`

---

## 37. Final Git state

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `f2a6d02953f0e50c4f208ec8bac917a6a5e6bc09` |
| Evidence commit | evidence-only `docs/phases/SMM-publishing-reactivation-preflight-evidence.md` |
| Implementation | none |
| Required close-out | divergence `0 0` after normal push; worktree clean |

No amend, force-push, rebase, reset, `db push`, or migration repair.
