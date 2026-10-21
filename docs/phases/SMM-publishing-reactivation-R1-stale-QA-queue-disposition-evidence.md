# SMM-PUBLISHING-REACTIVATION-R1 — Stale QA Queue Disposition

| Field | Value |
| --- | --- |
| Phase | **SMM-PUBLISHING-REACTIVATION-R1** |
| Document type | Production queue-disposition evidence |
| Date | 2026-08-28 |
| Formal status | `SMM-PUBLISHING-REACTIVATION-R1 CLOSED WITH EVIDENCE — STALE QA QUEUE SAFELY DISPOSED` |
| Prior preflight | `docs/phases/SMM-publishing-reactivation-preflight-evidence.md` |
| Prior preflight commit | `fd0ce53310b6efd0f99044e5790c7f5a42ffca50` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `fd0ce53310b6efd0f99044e5790c7f5a42ffca50` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Production app | `https://www.zyntixai.com` |

This phase cancelled five historical immediate `queued` QA publications through the existing governed RPC. It did **not** enable publishing, enable scheduling, open a window, or perform a provider write.

`SMM-PUBLISHING-REACTIVATION-R1 OWNER AUTHORIZATION = PROVEN`

`SMM-PUBLISHING-REACTIVATION-R1 STALE QA QUEUE DISPOSITION = AUTHORIZED`

`PUBLISHING EXECUTION = OFF` (before and after)

`SCHEDULING EXECUTION = OFF` (before and after)

`PROVIDER WRITE ATTEMPTED = FALSE`

`STALE QA IMMEDIATE QUEUED PUBLICATIONS = 0`

`IMMEDIATE ELIGIBLE PUBLICATIONS IF PUBLISHING IS ENABLED = 0`

`OPEN CONTROLLED EXECUTION WINDOWS = 0`

---

## 1. Executive verdict

All five authorized historical QA publications are now `cancelled`. Rows are retained. Attempt count remains 0. Provider publication IDs remain absent. No publication-attempt rows were created. Automatic scheduler due list remains empty. Live worker ticks after disposition stay `mode=dry-run`, `claimed=0`, `providerWriteAttempted=false`.

`SMM PUBLISHING REACTIVATION READINESS = READY`

Later controlled provider write still requires a separate owner authorization. That authorization was **not** consumed here.

---

## 2. Owner authorization

Exact string present in this run’s owner prompt:

`SMM-PUBLISHING-REACTIVATION-R1 STALE QA QUEUE DISPOSITION = AUTHORIZED`

Scope: only the five publication IDs listed below. Not provider write, not gate enablement, not windows, not other rows, not DATA.

Printed before the first Production mutation:

`SMM-PUBLISHING-REACTIVATION-R1 OWNER AUTHORIZATION = PROVEN`

---

## 3. Reason for R1

Preflight classified infrastructure as safe but required owner disposition of five leftover immediate `queued` QA publications before any later window or publishing enablement. Owner intent: do **not** publish those leftovers; move them to a terminal non-executable state while preserving auditability.

---

## 4. Repository start state

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `fd0ce53310b6efd0f99044e5790c7f5a42ffca50` |
| Subject | `docs(social): verify publishing reactivation readiness` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `fd0ce53310b6efd0f99044e5790c7f5a42ffca50` |
| Divergence | `0 0` |
| Status | clean |
| `git diff --check` | clean |

No implementation change. No migration. `DB-MIGRATION-DRIFT-01` untouched.

---

## 5. Production identity

| Check | Value |
| --- | --- |
| App | `https://www.zyntixai.com` |
| Project | `dmctinrcjvsgmoxwwodw` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Postgres | `17.6.1.141` |
| QA org | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Connection | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Label | `zyntixai` Business |
| Health | `connected` / `healthy` |
| Reauth required | no |

Identity matches preflight.

---

## 6. Gate pre-state

Live worker HTTP **1928** at 2026-08-28 09:20:00 UTC (immediately before mutation): `mode=dry-run`, `publishingEnabled=false`, `schedulingEnabled=false`.

DB: `zyntix.social_publishing_enabled` NULL; `private.social_publishing_execution_enabled()` = **false**.

`PUBLISHING EXECUTION = OFF`

`SCHEDULING EXECUTION = OFF`

---

## 7. Scheduler pre-state

Exactly one Cron job: `zyntixai_social_publication_scheduler_5m` jobid **1**, `active=true`, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`. Native Vercel Social Cron remains **0**.

---

## 8. Execution-window pre-state

`consumed` 5, `closed` 1. Open (not consumed/closed/expired) = **0**. None of the five authorized IDs had a bound window.

---

## 9. Authorized publication IDs

```text
040e15f3-22f7-4b94-a16a-d30ee7ce24d4
1714161a-29dd-4070-a1f0-6e2411ff363b
9dd4f6ed-5d99-4cb9-9297-1051a5ed8564
f584f4bb-c90b-4f19-865b-c066408368c6
7da29316-5e4f-40ef-86d8-6695afb55793
```

---

## 10. Per-ID pre-state

All five matched preflight immediately before cancel:

| ID | Org | Connection | Mode | Status | Attempts | Claimed | Provider ID | Window |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `040e15f3-…ce24d4` | QA | `24420652-…` | immediate | queued | 0 | no | no | none |
| `1714161a-…ff363b` | QA | `24420652-…` | immediate | queued | 0 | no | no | none |
| `9dd4f6ed-…ed8564` | QA | `24420652-…` | immediate | queued | 0 | no | no | none |
| `f584f4bb-…8368c6` | QA | `24420652-…` | immediate | queued | 0 | no | no | none |
| `7da29316-…b55793` | QA | `24420652-…` | immediate | queued | 0 | no | no | none |

No row had changed since preflight. Baseline inventory: queued immediate 5, succeeded immediate 4, succeeded scheduled 2, manual_intervention 2. Attempts total **8**.

---

## 11. Governed cancellation path

Located and used:

`public.cancel_social_publication(p_organization_id uuid, p_publication_id uuid)`

Production `pg_get_functiondef` matches the foundation migration. SECURITY DEFINER, `search_path=""`, EXECUTE granted to `authenticated` (not `service_role`).

Flow:

Owner JWT (`auth.uid()`)
→ `private.assert_social_content_mutation_context` (active membership + `can_manage_social_content`)
→ load publication `FOR UPDATE`
→ allow `queued`
→ set `status='cancelled'`, `cancelled_at=now()`
→ insert `social_publication_cancelled` event with `actor_source=member`
→ return `success`

Not used: raw `UPDATE`, `cancel_scheduled_social_publication` (rejects `execution_mode=immediate`), window creation, claim RPC, Instagram adapter.

`cancel_scheduled_social_publication` remains the Owner/Admin calendar path for **scheduled** rows. These five were immediate, so the foundation cancel RPC is the correct governed path.

---

## 12. Actor identity / role

| Field | Value |
| --- | --- |
| Role | Owner |
| User ID | `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| Membership ID | `6d8c8c91-39ff-4f26-86c8-5ec712b8c4f0` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Membership status | active |

Each cancel transaction set `request.jwt.claim.sub` / `request.jwt.claims` so `auth.uid()` resolved to that Owner. Proven on the first call (`actor_uid` = Owner user ID). `service_role` was not the human approval authority. Audit events recorded `actor_source=member` and `actor_member_id=6d8c8c91-…`.

---

## 13. Per-ID cancellation result

Each call re-checked queued/immediate/attempts=0/no provider ID/no open window in the same transaction, then invoked the RPC for that exact ID only.

| ID | RPC | Result | Cancelled at UTC |
| --- | --- | --- | --- |
| `040e15f3-…ce24d4` | `cancel_social_publication` | `success` | 2026-08-28 09:21:07.908224 |
| `1714161a-…ff363b` | `cancel_social_publication` | `success` | 2026-08-28 09:21:22.117442 |
| `9dd4f6ed-…ed8564` | `cancel_social_publication` | `success` | 2026-08-28 09:21:23.222149 |
| `7da29316-…b55793` | `cancel_social_publication` | `success` | 2026-08-28 09:21:25.901351 |
| `f584f4bb-…8368c6` | `cancel_social_publication` | `success` | 2026-08-28 09:23:19.160287 |

Five `social_publication_cancelled` events exist, `attempt_id` null.

---

## 14. Terminal status verification

All five: `status=cancelled`, `execution_mode=immediate` (unchanged; not converted to scheduled).

`cancelled` is in `SOCIAL_SCHEDULER_SKIP_STATUSES`. Due discovery requires `execution_mode=scheduled` **and** status in `pending|queued|failed_retryable` or expired-lease `claimed`. Cancelled immediate rows match neither.

`b18_start_controlled_publication_attempt` claims only `pending|queued|failed_retryable` (or expired-lease `claimed`). Cancelled → not claimable (`conflict`). Window consume skip list includes `cancelled`. Immediate execute still requires publishing ON **and** a new bound window (none exist).

---

## 15. Attempt-count verification

All five: `attempt_count=0` after cancel and after the 09:25 worker tick.

---

## 16. Provider-ID verification

All five: `external_publication_id` still null/absent.

---

## 17. Provider-write verification

No Instagram adapter call. Publication attempts for these five IDs: **0**. Global attempt count remains **8**. Cancel events are audit entities, not provider attempts.

`PROVIDER WRITE ATTEMPTED = FALSE`

---

## 18. Execution-window post-state

Still `consumed` 5, `closed` 1. Open = **0**. No window was created.

`OPEN CONTROLLED EXECUTION WINDOWS = 0`

---

## 19. Queue post-state

| Status × mode | Count |
| --- | --- |
| `cancelled` × immediate | 5 |
| `succeeded` × immediate | 4 |
| `succeeded` × scheduled | 2 |
| `manual_intervention` × immediate | 2 |
| queued / pending / claimed / failed_retryable | **0** |
| **Total** | **13** (unchanged; no deletes) |

`STALE QA IMMEDIATE QUEUED PUBLICATIONS = 0`

Unrelated succeeded and manual_intervention IDs unchanged.

---

## 20. Immediate eligible post-state

Scheduler due predicate: empty.

`IMMEDIATE ELIGIBLE PUBLICATIONS IF PUBLISHING IS ENABLED = 0`

---

## 21. Scheduler due post-state

Due SQL empty. Immediate cancelled rows are excluded. Claimed count on live ticks remains 0 while gates stay OFF.

---

## 22. Worker dry-run

Automatic tick **after** all five cancels (not manually invoked):

| UTC | HTTP id | Status | mode | scheduling | publishing | due | claimed | providerWriteAttempted |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-08-28 09:25:00 | 1929 | 200 | dry-run | false | false | 0 | 0 | false |

Cancelled rows remained `cancelled`, `attempt_count=0` after this tick.

`CLAIMED = 0`

`PROVIDER WRITE ATTEMPTED = FALSE`

---

## 23. Gate post-state

Worker 1929: both env gates false. DB helper still false.

`PUBLISHING EXECUTION = OFF`

`SCHEDULING EXECUTION = OFF`

R1 did not change either gate.

---

## 24. Authorization / security verification

- Cancel used Owner membership in the QA org.
- Staff/Viewer remain forbidden on `/social` UI and on scheduled cancel actions (`assertOwnerAdminScheduler`). Immediate `cancel_social_publication` still uses `can_manage_social_content` (owner/admin/staff) — **unchanged** pre-existing RPC contract; this phase did not broaden it.
- Foreign org cannot satisfy the QA-org membership assert.
- `service_role` still lacks EXECUTE on `cancel_social_publication`.
- Tenant scope: cancel matched `organization_id` + exact publication ID.

Automated coverage: Social targeted suite including `schedule-social-publication-actions.test.ts` Staff/Viewer denial, `social-calendar-tenant-security.test.ts`, `social-publishing-migration-security.test.ts` (`cancel_social_publication` present, authenticated-only grant).

---

## 25. Unrelated Social non-effects

Publication total still **13**. Succeeded 6 and manual_intervention 2 unchanged. Pending Instagram shells still **6**. Attempts still **8**. Connection `24420652-…` still connected/healthy.

---

## 26. Unrelated product non-effects

| Surface | Count |
| --- | --- |
| Customers | 116 |
| Memberships | 22 |
| Invitations | 16 |
| DATA sessions | 4 |
| mappings / staging | 0 / 0 |
| TAX releases | 1 |
| capabilities | 13 |
| context packs | 2 |

No DATA/TAX/CAP/CTX/BQA/Path B/billing/onboarding mutation.

---

## 27. Targeted Social tests

`npx vitest run` on Social feature + domain + security:

| Slice | Files | Tests |
| --- | --- | --- |
| `tests/features/social-media` | 40 | 280 |
| `tests/domain/social-*.test.ts` + `tests/security/social-*.test.ts` | 36 | 219 |
| **Total** | **76** | **499** |

**499 passed / 499.** No implementation tests added (no code change).

---

## 28. Targeted success percentage

`SOCIAL TARGETED TEST SUCCESS RATE = 100%`

`499 / 499 = 100%`

---

## 29. Typecheck

`npx tsc --noEmit` — PASS

---

## 30. Lint

`npx next lint` — PASS (0 warnings / 0 errors)

---

## 31. Build

`next build` is not required by this Social closure convention.

---

## 32. Full suite

`npx vitest run`

**3247 passed, 2 failed, 3249 total**

---

## 33. Full-suite percentage

`3247 / 3249 = 99.94%`

Do not call this 100%.

`FULL REPOSITORY 100% RESTORATION REMAINS A SEPARATE QUALITY OBJECTIVE`

---

## 34. Historical failures

Unchanged:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

`HISTORICAL FAILURES = 2`

---

## 35. New regressions

`NEW REGRESSIONS = 0`

---

## 36. Final reactivation readiness

`SMM PUBLISHING REACTIVATION READINESS = READY`

Infrastructure remain fail-closed. Queue no longer contains executable stale QA immediates. Provider healthy. Windows 0. Due 0.

---

## 37. Next proposed FV

`SMM-PUBLISHING-REACTIVATION-FV`

1. Re-prove due empty, windows 0, gates OFF.
2. Create **one new** owner-authorized publication (do not reuse cancelled IDs).
3. Open **one new** publication-bound one-shot window.
4. Enable **only** `SOCIAL_PUBLISHING_ENABLED`; keep scheduling OFF.
5. Observe exactly one provider write and `attempt_count=1`.
6. Return gates OFF unless permanent enablement is separately approved.

Required later authorization (not granted here):

`SMM-PUBLISHING-REACTIVATION-FV CONTROLLED PRODUCTION PROVIDER WRITE = AUTHORIZED`

---

## 38. Final Git state

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `fd0ce53310b6efd0f99044e5790c7f5a42ffca50` |
| Evidence | this evidence-only document |
| Implementation | none |
| Required close-out | divergence `0 0` after normal push; worktree clean |

No amend, force-push, rebase, reset, `db push`, or migration repair.
