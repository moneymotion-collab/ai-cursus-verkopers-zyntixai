# DATA-1I — Governed Import Planning + Review/Approval Foundation

| Field | Value |
| --- | --- |
| Phase | **DATA-1I — GOVERNED IMPORT PLANNING + REVIEW/APPROVAL FOUNDATION** |
| Parent | DATA-1H / DATA-1H-FV |
| Document type | Implementation evidence |
| Date | 2026-08-30 |
| Formal status | `DATA-1I IMPLEMENTATION COMPLETE WITH EVIDENCE — GOVERNED IMPORT PLANNING + REVIEW/APPROVAL FOUNDATION READY FOR CONTROLLED PRODUCTION QA` |
| Governing 1H-FV | `docs/phases/DATA-1H-FV-controlled-production-customer-matching-verification-evidence.md` |
| Governing contract | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `0a0ae14a94859a34f2fc03d38628c0fb514acbea` |
| Production apply | **NOT PERFORMED** |
| Production import plan | **NOT AUTHORIZED** |
| Production approval | **NOT AUTHORIZED** |

**IMPORT PLANNING = IMPLEMENTED**

**IMPORT REVIEW = IMPLEMENTED**

**IMPORT APPROVAL = IMPLEMENTED**

**PLAN HASH / IMMUTABLE SNAPSHOT = IMPLEMENTED**

**CUSTOMER WRITES = 0**

**CUSTOMER WRITER INVOKED = NO**

**CUSTOMER WRITER MODIFIED = NO**

**IMPORT EXECUTION = NOT IMPLEMENTED**

**IMPORT ROW RESULTS = 0**

**EXTERNAL RECORD LINKS = 0**

**CUSTOMER IMPORT = NOT IMPLEMENTED**

**DATA-1I PRODUCTION APPLY = NOT YET AUTHORIZED**

**DATA-1I PRODUCTION IMPORT PLAN = NOT YET AUTHORIZED**

**DATA-1I PRODUCTION APPROVAL = NOT YET AUTHORIZED**

---

## 1. Executive verdict

DATA-1I implementation is complete with evidence. After current deterministic Customer matching, an authorized Owner/Admin can create an immutable import-plan snapshot and explicitly approve that exact snapshot. Approval is not execution. No Customer is created, updated, deleted, or merged. No row-result or external-link row is written.

Targeted DATA tests: **163 / 163 = 100%**. Previous targeted count: **143**. Tests added: **20**. Full suite: **3329 passed, 2 failed, 3331 total**. The two failures are the same historical tracked debt as DATA-1H-FV. `NEW REGRESSIONS = 0`.

This phase does **not** apply the planning migration to Production and does **not** create or approve a Production import plan.

---

## 2. Strategic purpose

DATA-1H proves deterministic Customer identity resolution. DATA-1I adds the next safety boundary:

Match → Plan → Review → Approve → [STOP]

without any canonical write.

Future only: Execute → Results → canonical Customer effects (DATA-1J).

---

## 3. DATA-1H-FV dependency

Authoritative prior verdict:

`DATA-1H-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION DETERMINISTIC CUSTOMER MATCHING + IDENTITY RESOLUTION VERIFIED`

`DATA-1H RELEASE READY WITH EVIDENCE`

`DATA-1H TARGETED TEST SUCCESS RATE = 100%`

Closure HEAD: `0a0ae14a94859a34f2fc03d38628c0fb514acbea`.

---

## 4. Starting Git state

| Item | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `0a0ae14a94859a34f2fc03d38628c0fb514acbea` |
| HEAD subject | `docs(data): verify controlled Production customer matching` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `0a0ae14a94859a34f2fc03d38628c0fb514acbea` |
| Divergence | `0 0` |
| Worktree | clean |
| `git diff --check` | clean |

---

## 5. Frozen DATA-1B import-plan contract

Inspected `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` §§7–9, 25–31, 40.

DATA-1B already froze `data_import_plans` as the immutable execution contract after approval. Execution must later read this snapshot, never live mapping/staging rows. DATA-1I reuses that table. It does not create a ninth DATA workflow table.

---

## 6. Existing data_import_plans schema

Frozen columns reused:

`id`, `organization_id`, `session_id`, `version`, `source_id`, `source_sha256`, `target_domain`, `adapter_version`, `business_activity_id` (NULL for customer), `mapping_snapshot`, `included_fingerprints`, `summary`, `plan_hash`, `status`, `created_by_user_id`, `approved_by_user_id`, `created_at`, `approved_at`, `superseded_at`.

Unique `(session_id, version)`. Partial unique: one `approved|executing` per session.

Executor-related session fields (`execution_lease_*`, batch indexes) remain unused. DATA-1I does not populate `data_import_row_results`.

---

## 7. Existing plan statuses

Frozen CHECK: `draft | approved | superseded | executing | executed`.

DATA-1I writes only `draft`, `approved`, and `superseded`. `executing` / `executed` remain reserved for DATA-1J.

---

## 8. Approval fields

Plan: `approved_by_user_id`, `approved_at`.

Session: `approved_by_user_id`, `approved_at`, `current_plan_id`.

`service_role` is never written as approver. The human Owner/Admin actor id is persisted.

---

## 9. Session state graph

`private.data_intake_session_status_transition_allowed` already allows:

- `ready_for_approval → approved`
- `review_required` cannot go to `approved`
- `approved → cancelled` before first batch
- `approved → mapped` on plan-invalidating edit
- `approved → importing` (DATA-1J only)

DATA-1I implements `ready_for_approval → approved` only after governed approval. It does not invent new session statuses.

---

## 10. ready_for_approval ambiguity

**READY_FOR_APPROVAL ALONE IS SUFFICIENT = NO**

DATA-1G may set `ready_for_approval` after validation with no matching. DATA-1I independently requires a current `matching_completed` event bound to the current source, mapping hash, matcher version, and staging resolutions.

---

## 11. Current matching prerequisite

Plan evaluation requires:

- current source
- current verified object hash
- current confirmed mapping hash
- current staging rows
- current `matching_completed` provenance
- persisted staging resolutions equal to a fresh DATA-1H reclassification

---

## 12. matching_completed currency rules

Latest `matching_completed` for the session must have:

- `source_id` = current source
- `mapping_hash` = current confirmed mapping digest
- `matcher_version` = `customer-matcher-v1`

Then DATA-1H `classifyIdentityResolutions` is recomputed. If persisted `resolution` / `target_operation` / `target_record_id` differ, planning fails `PLAN_STALE`.

A historical matching event is not automatically sufficient.

---

## 13. Source hash binding

The stored private object is re-hashed. Size and SHA-256 must match `data_intake_sources.sha256` and the plan `source_sha256`. Mutation fails `SOURCE_HASH_INVALID`.

---

## 14. Mapping hash binding

Planning binds `mappingSnapshotHash(canonicalizeMappingSnapshot(...))`. A changed confirmed mapping denies create/approval (`MAPPING_HASH_MISMATCH` or `PLAN_STALE`). The old draft/approved snapshot is not rewritten.

---

## 15. Staging snapshot

Authoritative rows are the current `data_intake_staging_rows` for the source. The plan snapshot includes only execution-needed fields: source row number, fingerprint, lifecycle, resolution, target operation, target record id.

No raw client payloads. No ignored values. Ordering is `source_row_number` ascending.

---

## 16. Matching snapshot

Matching currency is the pair of:

1. latest `matching_completed` metadata
2. recomputed DATA-1H classifications vs persisted staging resolutions

DATA-1I does not invent a second matcher. No name, phone, fuzzy, AI, or confidence matching.

---

## 17. Plan canonicalization

Canonical JSON for the plan hash:

- `source_sha256`
- `target_domain` = `customer`
- `adapter_version` = `customer.v1`
- `business_activity_id` = null
- `mapping_snapshot` (existing canonical mapping snapshot)
- `included_fingerprints` sorted
- `matcher_version` = `customer-matcher-v1`
- `operations` sorted by `source_row_number`: fingerprint, operation, target id

DATA-1B §27 already defined the first six inputs. DATA-1I extends the digest with matcher version and operations/target IDs so a future executor can prove the approved plan corresponds to the exact matching result, not merely the included fingerprints.

Request order and DB row order do not change the hash.

---

## 18. Plan hash

SHA-256 of the canonical JSON above. Stored on `data_import_plans.plan_hash`. Approval binds this exact digest. Same authoritative input → same hash.

---

## 19. Plan item representation

Executable items only:

- create candidate: `resolution=create`, `target_operation=create`, `target_record_id=null`
- link candidate: `resolution=duplicate`, `target_operation=link`, `target_record_id=<same-org Customer>`

`included_fingerprints` contains only those executable fingerprints. Operations and counts are persisted in `summary` (jsonb) so the snapshot survives later staging TTL without a ninth table.

---

## 20. Create candidate semantics

A DATA-1H create row may become a future CREATE plan item. DATA-1I does not INSERT a Customer.

---

## 21. Existing/link candidate semantics

A DATA-1H duplicate/link row may become a future LINK plan item. DATA-1I does not UPDATE a Customer and does not create `data_external_record_links`. `link` is not reinterpreted as `update`.

---

## 22. Blocked-row semantics

`lifecycle=blocked` is never executable. Pattern B: plan creation is denied. No target operation or target record is planned.

---

## 23. Conflict semantics

`resolution=conflict` is never executable. No automatic conflict resolution, dedupe, or merge. Plan creation is denied.

---

## 24. No-key semantics

Validated rows with `resolution=none` (no deterministic email key) are approval blockers. They are not auto-created. DATA-1B does not say no-key becomes create. Safe default used: review blocker / plan denied.

---

## 25. Partial-import decision

**PARTIAL IMPORT = NOT INVENTED**

If any row is blocked, conflict, or no-key, plan creation is denied. The valid subset is not approved alone.

---

## 26. review_required behavior

**Pattern B.** Plan creation from `review_required` is denied. Operators must resolve blockers through the existing validation/matching flow. No draft plan with blockers.

---

## 27. ready_for_approval behavior

Even when session = `ready_for_approval`, current matching completion is required. Absent or stale matching denies planning.

---

## 28. Plan creation eligibility

Required:

- Owner/Admin human actor
- session `ready_for_approval` (or already `approved` for same-hash replay)
- current verified source object
- current mapping hash
- current staging set
- current `matching_completed`
- persisted resolutions = recomputed DATA-1H matches
- no blocked / conflict / no-key rows
- link targets still same-org and email-compatible
- plan operations server-computed

`READY_FOR_APPROVAL ALONE IS SUFFICIENT = NO`

---

## 29. Plan summary

Persisted/review counts:

- total source rows
- validated rows
- create candidates
- link/existing candidates
- blocked rows
- conflicts
- no-key rows
- excluded rows
- executable candidate count
- mapping hash
- matcher version

Informational only. Does not execute.

---

## 30. Plan idempotency

Same snapshot → replay the same active draft (or the already-approved plan with the same hash). No duplicate active plan. No duplicate `plan_created` event.

---

## 31. Plan concurrency

Memory and SQL use a per-org/session advisory lock (`872019`). Two simultaneous create requests yield one authoritative plan and one replay.

---

## 32. Plan supersession

If a draft exists and the recomputed hash differs, the old draft is `superseded` (`plan_superseded`), then `version+1` is created. An approved plan is never rewritten in place. A different hash after approval fails `PLAN_STALE`.

---

## 33. Approval eligibility

Requires:

- current plan exists
- plan `draft` (or already `approved` for replay)
- recomputed `plan_hash` matches stored hash
- source/object hash current
- mapping hash current
- matching current
- no approval-blocking rows
- session `ready_for_approval`
- actor authorized

Approval is not by plan id alone.

---

## 34. Approval authority

Proven against the frozen DATA role model:

| Actor | Approval |
| --- | --- |
| Owner | allowed |
| Admin | allowed |
| Staff | denied |
| Viewer | denied |
| suspended member | denied |
| unauthenticated | denied |
| foreign organization / session / plan | denied |
| `service_role` | executor only; never written as approver |

---

## 35. Approval snapshot

On first approval:

- `plans.status = approved`
- `plans.approved_at` / `approved_by_user_id` set
- session `ready_for_approval → approved`
- session approval columns and `current_plan_id` set
- `plan_approved` event once, with org/session/plan/hash/version/actor, no Customer PII

---

## 36. Approval replay

Approving the same already-approved identical plan returns `replayed=true`. `approved_at` and `approved_by_user_id` are not rewritten. No second `plan_approved` event.

---

## 37. Approved-plan immutability

Existing trigger `private.enforce_data_import_plan_immutability` already freezes snapshot/hash/summary/fingerprints after approve. DATA-1I never updates those fields on an approved plan. Upstream change after approval does not silently keep the old approval as current executable authority.

---

## 38. Approved-state transition

Only `ready_for_approval → approved` after successful governed approval. `review_required` cannot become `approved`.

---

## 39. Approved abort/revoke analysis

**APPROVED PRE-EXECUTION ABORT PATH = `approved → cancelled` via existing `cancel_session`**

DATA-1B already allowed this before first batch. The DATA-1G foundation allowlist excluded `approved`. DATA-1I aligns the smallest frozen behavior: add `approved` to `cancel_session`. `importing` and `failed` remain excluded.

Cancel after approval:

- session becomes `cancelled`
- approved plan snapshot/hash remain unchanged
- event remains `import_cancelled`
- future executor must refuse a cancelled session

No separate revoke-approval RPC was invented. No reject-comment workflow was invented.

This is not user-trapping: an approved-but-not-executed session can be cancelled.

---

## 40. TOCTOU boundary

Customer state may change after matching, after planning, and after approval. DATA-1I approval does **not** waive DATA-1J execution-time revalidation. DATA-1J must revalidate the approved plan immediately before any canonical write.

---

## 41. Customer target revalidation

For each link candidate, DATA-1I re-reads same-organization Customers by staged email and requires the persisted `target_record_id` to still exist, belong to the same organization, and still equal the staged normalized email. Foreign IDs fail closed. No silent retarget.

Customer lookup is read-only. The Customer writer is not imported or invoked.

---

## 42. Privacy

Plans store row identity, operation, target id, hashes, and counts. Events do not copy staged emails or Customer PII. No secrets.

---

## 43. Audit events

Frozen vocabulary reused (no invented names):

- `plan_created`
- `plan_approved`
- `plan_superseded`
- `import_cancelled` (approved abort)

Metadata: plan id, plan hash, version, candidate counts, actor id. No row contents.

---

## 44. RPC/server architecture

Bounded commands:

- `evaluatePlanningContext` (internal)
- `createOrReplayDataIntakeImportPlan`
- `approveDataIntakeImportPlan`
- `listDataIntakePlanningState`

RPC: `apply_data_intake_planning_mutation` operations `create_import_plan` | `approve_import_plan`.

No generic “execute arbitrary DATA operation” endpoint. No import executor.

---

## 45. Database security

`apply_data_intake_planning_mutation`:

- `SECURITY DEFINER`
- `search_path = ''`
- `auth.role() = service_role`
- EXECUTE granted to `service_role` only
- real human actor + Owner/Admin membership
- org/session/source validation
- explicit operation allowlist
- no dynamic SQL
- no Customer mutation
- no external link creation
- no row-result creation
- payload rejects `target_record_id` / `target_operation` / raw rows

Authenticated clients do not receive broad DML on `data_import_plans`.

---

## 46. Constraints/indexes

Reused frozen constraints. No conflicting new CHECKs. Advisory lock key `872019` (matching remains `872018`).

---

## 47. Migration decision

Required. DATA-1B schema was sufficient for the table. DATA-1I adds:

- bounded planning RPC
- `approved` on foundation `cancel_session`

No new workflow table. No Customer executor. No rollback/retry/dedupe table.

---

## 48. Migration filename/hash

| Item | Value |
| --- | --- |
| Filename | `supabase/migrations/20260830300000_add_data_intake_import_planning_approval.sql` |
| SHA-256 | `efd34811e36e46b0e6abeb3dd87047fc4dcbc1fb49145f9ac93b5d39d7b1d0a2` |
| Production apply | **NO** |

---

## 49. Generated types

Local `src/types/database.generated.ts` gained `apply_data_intake_planning_mutation` only. Production typegen was not contacted.

---

## 50. Happy-path plan test

`planning.test.ts`: two validated rows (link + create), current matching. Plan generated with total 2, link 1, create 1, blockers 0. Customer delta 0.

---

## 51. Ready-without-matching denial

`ready_for_approval` after DATA-1G staging, no `matching_completed` → plan creation `INVALID_STATE`. Mandatory regression.

---

## 52. Stale-matching test

Historical matching, then staging resolution mutated → `PLAN_STALE`.

---

## 53. Source-hash stale test

Stored object bytes replaced → `SOURCE_HASH_INVALID`. No plan.

---

## 54. Mapping-hash stale test

Confirmed mapping mutated after draft plan → approval denied. Draft snapshot/hash unchanged.

---

## 55. Staging stale test

Row fingerprint changed after plan → approval `PLAN_STALE`. No Customer write.

---

## 56. Target Customer stale test

Link target email changed after matching → plan creation `PLAN_STALE`. No retarget.

---

## 57. Blocked-row test

Blocked staging + matching → `review_required` → plan generation denied. Row never executable.

---

## 58. Conflict test

Collision resolution → plan generation denied. No arbitrary target.

---

## 59. No-key test

Validated no-email row → plan generation denied. Not auto-created.

---

## 60. Injection test

Caller supplies `targetRecordId` / `targetOperation` → `SOURCE_INVALID`. **PLAN TARGETS SERVER COMPUTED = TRUE**

---

## 61. Tenant test

Foreign org/session/plan denied. Foreign Customer id cannot enter the plan snapshot.

---

## 62. Plan hash test

Domain test: reversed row order yields the same canonical hash.

---

## 63. Replay test

Second create returns `replayed=true`, same plan id/hash, one `plan_created` event.

---

## 64. Concurrency test

Two simultaneous creates: one authoritative draft, one replay, same hash.

---

## 65. Approval happy path

Owner approves clean plan: session `approved`, `approved_by` = owner, `approved_at` set, hash bound, one `plan_approved`. Customer delta 0.

---

## 66. Approval authorization

Owner/Admin allowed. Staff/Viewer/suspended/unauthenticated/foreign/`service_role` denied.

---

## 67. Approval replay

Second approve: `replayed=true`, stamps unchanged, one approval event.

---

## 68. Approved immutability

Approved hash and `approved_at` remain unchanged after replay and after attempted summary mutation. Create with a different live snapshot fails `PLAN_STALE` and does not rewrite the approved row.

---

## 69. Upstream-change behavior

After approval, staging resolution drift denies a new plan (`PLAN_STALE`). The approved snapshot is not mutated. DATA-1J must still revalidate at execute time.

---

## 70. Approved abort path

`cancel_session` after approval succeeds. Session `cancelled`. Plan remains `approved` with the same hash. `import_cancelled` once.

---

## 71. Customer non-effect

All planning/approval tests assert `store.customers` unchanged. No `customer-mutations` import under `src/features/data-intake`.

**CUSTOMER WRITES = 0**

**CUSTOMER WRITER INVOKED = NO**

**CUSTOMER WRITER MODIFIED = NO**

---

## 72. Row-result non-effect

`store.rowResults` remains `[]`. SQL migration does not insert `data_import_row_results`.

**data_import_row_results attributable delta = 0**

---

## 73. External-link non-effect

`store.links` remains `[]`. SQL migration does not insert `data_external_record_links`.

**data_external_record_links attributable delta = 0**

---

## 74. Targeted DATA count

| Item | Count |
| --- | --- |
| Previous | 143 |
| Added | 20 |
| Final | 163 |

Added coverage: `planning-domain.test.ts` (2), `planning.test.ts` (15), `data-intake-planning-migration.test.ts` (3).

---

## 75. Targeted success rate

Command: `npx vitest run tests/features/data-intake tests/security/data-intake`

**163 / 163 = 100%**

---

## 76. Typecheck

`npx tsc --noEmit` — PASS

---

## 77. Lint

`npx next lint` — PASS (0 warnings, 0 errors)

---

## 78. Build

`next build` is not a DATA-1C–1H-FV closure gate. Not required for DATA-1I. Not run.

---

## 79. Full suite

`npx vitest run`

**3329 passed**

**2 failed**

**3331 total**

---

## 80. Full-suite percentage

`3329 / 3331 = 99.94%` of the repository suite. Strategic 100% objective remains. The two failures are historical debt, not DATA-1I.

---

## 81. Historical failures

Exactly:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

DATA-1I did not scope-creep into those modules.

---

## 82. New regressions

**NEW REGRESSIONS = 0**

Prior full-suite baseline: 3309 passed / 2 failed / 3311 total. Added 20 DATA tests. Passed increased by 20. Failures unchanged.

---

## 83. Production status

| Action | Status |
| --- | --- |
| `supabase db push` | not run |
| MCP `apply_migration` | not run |
| Production import plan | not created |
| Production approval | not performed |
| Production Customer mutation | not performed |

**DATA-1I PRODUCTION APPLY = NOT YET AUTHORIZED**

---

## 84. Proposed DATA-1I-FV

Future controlled Production QA, synthetic DATA only, no Customer writes.

Preferred fixture: reuse DATA-1H synthetic Customer `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921` in org `2fc07699-ece5-44b9-bbb3-abbc23e9fffb`.

Approval happy path:

- ROW A: validated + exact existing synthetic match → link candidate
- ROW B: validated + unique `.invalid` no-match → create candidate
- current `matching_completed`
- plan created, hash independently verified
- counts: total 2, link 1, create 1, blockers 0
- Owner/Admin approval
- one `plan_approved`
- approved snapshot immutable
- Customer count unchanged
- no row results, no external links, no execution

Separate safe case: blocked/conflict → approval/plan denied.

Do not perform DATA-1I-FV until the owner string is issued:

`DATA-1I-FV CONTROLLED PRODUCTION IMPORT PLANNING + APPROVAL = AUTHORIZED`

---

## 85. DATA-1J boundary

DATA-1I does not own:

- Customer INSERT/UPDATE/DELETE/merge
- Customer writer invocation
- import execution
- row execution results
- external record link creation
- rollback / retry
- execution-time revalidation (required of DATA-1J)

Approval means only: an authorized human approved this exact immutable plan snapshot for potential future execution.

---

## 86. Residual risks

1. TOCTOU: canonical Customer state can change after approval. DATA-1J must revalidate immediately before write.
2. Staging TTL: after cleanup, execution must use the approved plan snapshot (`included_fingerprints` + `summary.operations`), not live staging.
3. Cancel after approval leaves an approved historical plan on a cancelled session. Executor must check session status.
4. Migration is local-only until a separate DATA-1I-FV authorization.

---

## 87. Final Git state

| Item | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Implementation commit | `ff9f2db78e570418a6fdab276417b01598c3a67c` |
| Evidence commit | recorded immediately after this document |
| Start HEAD | `0a0ae14a94859a34f2fc03d38628c0fb514acbea` |
| Expected divergence after push | `0 0` |
| Worktree | clean |

---

## 88. Final verdict

DATA-1I IMPLEMENTATION COMPLETE WITH EVIDENCE — GOVERNED IMPORT PLANNING + REVIEW/APPROVAL FOUNDATION READY FOR CONTROLLED PRODUCTION QA

DATA-1I TARGETED TEST SUCCESS RATE = 100%

DATA-1I-FV CONTROLLED PRODUCTION IMPORT PLANNING + APPROVAL = OWNER AUTHORIZATION REQUIRED
