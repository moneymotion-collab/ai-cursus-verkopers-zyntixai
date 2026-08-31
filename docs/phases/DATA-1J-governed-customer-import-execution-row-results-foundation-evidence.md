# DATA-1J — Governed Customer Import Execution + Row Results Foundation

| Field | Value |
| --- | --- |
| Phase | **DATA-1J — GOVERNED CUSTOMER IMPORT EXECUTION + ROW RESULTS FOUNDATION** |
| Parent | DATA-1I / DATA-1I-FV |
| Document type | Implementation evidence |
| Date | 2026-08-31 |
| Formal status | `DATA-1J IMPLEMENTATION COMPLETE WITH EVIDENCE — GOVERNED CUSTOMER IMPORT EXECUTION + ROW RESULTS FOUNDATION READY FOR CONTROLLED PRODUCTION QA` |
| Governing 1I-FV | `docs/phases/DATA-1I-FV-controlled-production-import-planning-approval-verification-evidence.md` |
| Governing contract | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `307e7f938f0d236c6a7564c0896266417dd5a7bc` |
| Production apply | **NOT PERFORMED** |
| Production execution | **NOT PERFORMED** |
| Production Customer writes | **0** |

**IMPORT EXECUTION = IMPLEMENTED**

**IMPORT ROW RESULTS = IMPLEMENTED**

**CUSTOMER CREATE = IMPLEMENTED VIA PRIVATE WRITER**

**CUSTOMER LINK = RESULT ONLY**

**LINK CUSTOMER UPDATE = NO**

**EXTERNAL RECORD LINKS = 0**

**CUSTOMER MERGE / DELETE / ARCHIVE = NOT IMPLEMENTED**

**DATA-1J PRODUCTION APPLY = NO**

**DATA-1J PRODUCTION EXECUTION = NO**

**PRODUCTION CUSTOMER WRITES = 0**

---

## 1. Executive verdict

DATA-1J implementation is complete with evidence. After an authorized Owner/Admin approval, the same role model can execute that exact immutable plan. Create uses `private.create_customer_record(..., 'import')`. Link writes a row result only. Customer INSERT and the matching `data_import_row_results` row happen in the same database transaction. CSV v1 does not write `data_external_record_links`.

Targeted DATA tests: **183 / 183 = 100%**. Previous targeted count: **163**. Tests added: **20**. Full suite: **3349 passed, 2 failed, 3351 total**. The two failures are the same historical tracked debt as DATA-1I-FV. `NEW REGRESSIONS = 0`.

This phase does **not** apply the execution migration to Production and does **not** execute a Production import.

DATA-1J IMPLEMENTATION COMPLETE WITH EVIDENCE — GOVERNED CUSTOMER IMPORT EXECUTION + ROW RESULTS FOUNDATION READY FOR CONTROLLED PRODUCTION QA

DATA-1J TARGETED TEST SUCCESS RATE = 100%

DATA-1J-FV CONTROLLED PRODUCTION CUSTOMER IMPORT EXECUTION = OWNER AUTHORIZATION REQUIRED

---

## 2. Strategic purpose

DATA-1I proves Match → Plan → Review → Approve without canonical writes. DATA-1J adds the next safety boundary:

Approve → Revalidate → Claim → Execute batch → Row results → Finalize

Create and link are distinct. `link` is not `update`. Retry cannot create a second Customer because success evidence was lost.

---

## 3. DATA-1I-FV dependency

Authoritative prior verdict:

`DATA-1I-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION GOVERNED IMPORT PLANNING + REVIEW/APPROVAL VERIFIED`

`DATA-1I RELEASE READY WITH EVIDENCE`

Closure HEAD: `307e7f938f0d236c6a7564c0896266417dd5a7bc`.

DATA-1I-FV session was cancelled after approval. Plan `3987600f-51cd-412b-bf74-da4c2d8baf2f` is historical evidence only. This phase does not reuse or execute it.

---

## 4. Starting Git state

| Item | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `307e7f938f0d236c6a7564c0896266417dd5a7bc` |
| HEAD subject | `docs(data): verify controlled Production import planning approval` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `307e7f938f0d236c6a7564c0896266417dd5a7bc` |
| Divergence | `0 0` |
| Worktree | clean |
| `git diff --check` | clean |

---

## 5. Frozen DATA-1B execution contract

Inspected `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` §§7–9, 25–31, 35–47, 52.

The contract already froze session `importing` / `completed` / `completed_with_errors` / `failed`, plan `executing` / `executed`, `data_import_row_results`, batch size 100, and reuse of `private.create_customer_record` with `p_source = 'import'`. DATA-1J implements that frozen contract. It does not invent a ninth workflow table, a worker, or Customer merge.

**FROZEN IMPORT EXECUTION CONTRACT = SUFFICIENT**

---

## 6. Session states

Existing CHECK already includes `approved → importing → completed | completed_with_errors | failed | cancelled` and `failed → importing`. Successful terminal is `completed`. Partial terminal is `completed_with_errors`. `failed` is not terminal. `cancelled` is terminal.

---

## 7. Plan statuses

Existing CHECK: `draft | approved | superseded | executing | executed`. Claim: `approved → executing`. Finalize: `executing → executed` only when every executable row has an authoritative result. Snapshot/hash stay immutable. Status is mutable. Unique: one `approved`/`executing` plan per session.

---

## 8. Create vs link

`create` and `link` are distinct plan operations. `skip` exists in schema but DATA-1I plans emit create/link only. Blocked, conflict, and no-key rows cannot execute.

---

## 9. LINK CUSTOMER UPDATE = NO

Link writes `data_import_row_results` with the approved `target_record_id`. It does not UPDATE, DELETE, merge, dedupe, or archive the existing Customer.

---

## 10. Customer writer

Create reuses `private.create_customer_record`. The private helper now allows `p_source = 'import'`. `public.create_customer` remains `'manual'`. DATA does not raw-INSERT `customers` from the execution RPC. Writer semantics: `status=onboarding`, `started_at=now()`, `archived_at` null, `created_by_member_id` = executor membership, `owner_member_id` null.

---

## 11. Importable allowlist

Only `display_name`, `email`, `phone`, `first_name`, `last_name` from staging `normalized_values`. Required: `display_name` trim 1–200. Email optional. Organization comes from session/plan, not the client.

---

## 12. Never-import fields

Never imported: `id`, `organization_id`, `status`, `owner_member_id`, `created_by_member_id`, `metadata`, timestamps, `archived_*`. Extra normalized keys are ignored.

---

## 13. Row results table reuse

`data_import_row_results` is reused. No ninth DATA table. No queue table. No rollback table.

---

## 14. Row result identity

Unique `(plan_id, row_fingerprint)`. Columns: org, session, plan, fingerprint, `source_row_number`, operation `create|link|skip`, outcome `imported|failed|skipped`, `target_domain`, nullable `target_record_id` / `error_code`, `created_at`. No PII. Replay of `imported`/`skipped` is success with no second canonical write.

---

## 15. External links unused

**EXTERNAL RECORD LINK SEMANTICS = optional source-system identity. Not required for CSV create/link.**

CSV without a stable external id does not write `data_external_record_links`. Planning/approval still never write them.

---

## 16. Atomicity

Customer INSERT and row-result INSERT occur in the same RPC transaction. Crash before commit rolls back both, including claim when claim is in that transaction. Retry cannot create a second Customer because success evidence was lost.

---

## 17. Batch model

DATA-1B model B: row-accountable, resumable, `DATA_BATCH_SIZE = 100`, deterministic `source_row_number` ascending, `last_completed_batch_index` on the session. The app may loop batches; each RPC call is one transaction.

---

## 18. Advisory lock

Execution uses `pg_advisory_xact_lock(872020, hash(org:session))`. Planning remains `872019`. Matching remains `872018`.

---

## 19. Retry

`failed → importing` on the same approved/executing plan if hash/source still valid. Already `imported`/`skipped`/`failed` fingerprints are not rewritten. Mapping/source change is `PLAN_STALE`, not in-place rewrite.

---

## 20. Crash safety

Memory and SQL both treat create + row result as one transaction. A fault after create and before the result rolls back the Customer. A fault after claim and before the first effect rolls back the claim.

---

## 21. Cancellation

DATA-1I `approved → cancelled` before claim remains. Ordinary `cancel_session` still excludes `importing`. Importing cancellation is denied. `cancel_requested` during importing is out of this foundation. Created Customers are not deleted.

---

## 22. Events

Existing names only: `import_started`, `import_batch_completed`, `import_completed`. Metadata is hashes, counts, plan id, batch index. No PII. `import_failed` remains reserved for a later infra-failure path.

---

## 23. Authority

Owner/Admin human requests execution. `service_role` is infrastructure only. Admin may execute a plan Owner approved. Staff, Viewer, suspended, unauthenticated, foreign org/plan/customer are denied. The client cannot supply `target_operation`, `target_record_id`, Customer fields, or row lists. The RPC loads plan + staging server-side.

---

## 24. Execution-time revalidation

Before claim/first write: org, session, current plan id, plan status, exact `plan_hash`, `approved_by`/`approved_at`, source verified + SHA, mapping snapshot/hash, staging fingerprints + lifecycle, current `matching_completed`, matcher `customer-matcher-v1`, unfinished persisted resolutions vs live matching, create-candidate still count 0, link target still same-org exact email.

---

## 25. TOCTOU

Canonical Customer state can change after approval. Revalidation runs immediately before write. Wrong hash is `PLAN_STALE` before claim.

---

## 26. Create-target-appeared

If a create email exists before the first write, execution fails closed `PLAN_STALE`. No claim. No silent convert create → link.

---

## 27. Link-target stale

If the approved link target is missing, foreign, or email-mismatched, execution fails `PLAN_STALE` and does not retarget.

---

## 28. Unique violation late race

Unique violation on create after pre-claim revalidation marks that row `failed` with `CUSTOMER_CONFLICT`. It does not convert the row to link.

---

## 29. Replay

An executed plan with authoritative results returns the existing results. No second Customer. No second `import_started` / `import_completed`.

---

## 30. Finalization

`executing → executed` only when every executable row has a result. Session becomes `completed` when failures = 0, else `completed_with_errors`.

---

## 31. Partial completed_with_errors

A row `failed` after retries/exhaustion can finalize the session as `completed_with_errors`. Successful creates and links in the same plan remain canonical.

---

## 32. Infra failed

`failed` is not terminal. Retry claims `failed → importing` on the same executing plan. This foundation does not invent a worker or lease owner.

---

## 33. Claim

First write path: session `approved → importing`, plan `approved → executing`, `import_started`, `execution_attempt += 1`, `execution_started_at = now()`. Later calls continue an already executing plan.

---

## 34. Payload rejection

Rejected client keys include `target_record_id`, `target_operation`, `rows`, `records`, `customers`, `display_name`, `email`, `normalized_values`, `raw_values`, storage paths. Error `SOURCE_INVALID`.

---

## 35. Privacy

Row results and events contain no emails, names, or raw values. Tests assert event payloads do not include fixture emails.

---

## 36. RPC/server architecture

| Layer | File |
| --- | --- |
| Domain | `src/features/data-intake/domain/execution.ts` |
| RPC | `src/features/data-intake/server/data-intake-execution-rpc.ts` |
| Commands | `src/features/data-intake/server/data-intake-execution-commands.ts` |
| Service | `executeDataIntakeImportPlan` |
| Client | `createDataIntakeExecutionRpcClient` |
| Memory | `createMemoryDataIntakeExecutionRpc` |

TypeScript never calls `private.create_customer_record`. Only the SQL RPC does.

---

## 37. Database security

`apply_data_intake_execution_mutation` is SECURITY DEFINER, `search_path=''`, EXECUTE `service_role` only. Authenticated/anon/public are revoked.

---

## 38. Constraints

Reused unique `(plan_id, row_fingerprint)` on `data_import_row_results`. Customer email uniqueness remains the business-identity layer. No new unique indexes were invented.

---

## 39. Migration decision

One local additive migration. No Production apply. No `supabase db push`. No MCP `apply_migration`.

---

## 40. Migration filename/hash

| Item | Value |
| --- | --- |
| File | `supabase/migrations/20260830400000_add_data_intake_customer_import_execution.sql` |
| Name | `add_data_intake_customer_import_execution` |
| Bytes | 29250 |
| SHA-256 | `2e08f7ec93f066e85096b587be80ee95ae0499ad29c7f444963c6c36415649be` |

---

## 41. Generated types

`src/types/database.generated.ts` locally includes `apply_data_intake_execution_mutation` with the same Args shape as planning: `p_operation`, `p_organization_id`, `p_actor_user_id`, `p_actor_member_id`, `p_payload`.

---

## 42. Isolation

Runtime isolation allowlists `202608304*`. Server-only isolation binds the execution RPC name to `Database["public"]["Functions"]`. DATA TypeScript still must not contain `private.create_customer_record`.

---

## 43. Happy create

Bob-only approved plan creates one Customer via the import writer and one `imported` create result.

---

## 44. Happy link

Alice-only approved plan writes one `imported` link result and leaves the existing Customer unchanged.

---

## 45. Mixed create+link

Alice link + Bob create: two results, one new Customer, Alice display name unchanged, zero external links.

---

## 46. Draft denial

A draft plan cannot execute (`INVALID_STATE`). No Customer write.

---

## 47. Cancel denial

A cancelled approved session cannot execute (`INVALID_STATE`). The historical approved snapshot is not rewritten.

---

## 48. Supersede denial

A superseded plan cannot execute (`PLAN_STALE` / `INVALID_STATE`).

---

## 49. Hash stale

Wrong `planHash` is `PLAN_STALE` before claim.

---

## 50. Source stale

Mutated source SHA is `SOURCE_HASH_INVALID` before claim.

---

## 51. Matching stale

Missing or non-current `matching_completed` denies execution.

---

## 52. Create appeared

A create email that appears after approval fails `PLAN_STALE`. Session stays `approved`. No claim. No row result.

---

## 53. Link stale

Moved/missing link-target email fails `PLAN_STALE`. No retarget.

---

## 54. Authorization

Owner and Admin may execute. Staff/Viewer = `FORBIDDEN_ROLE`. Suspended/unauthenticated = `ORG_NOT_FOUND` / `UNAUTHORIZED`. Non-service-role RPC = `UNAUTHORIZED`.

---

## 55. Tenant

Foreign org cannot see or execute another org’s session (`ORG_NOT_FOUND` / `SESSION_NOT_FOUND`).

---

## 56. Injection

Client-supplied Customer fields, row lists, and target ids are `SOURCE_INVALID`.

---

## 57. Allowlist

Phone / first / last import when present in `normalized_values`. Status/owner/metadata extras do not reach the Customer.

---

## 58. Ignored fields

Rejected or extra mapping values stay out of the created Customer.

---

## 59. Replay

Second execute is `replayed=true`, same Customers, same two row results, one `import_started`, one `import_completed`.

---

## 60. Concurrency

Two concurrent executes serialize on the memory/SQL lock. One claim. One created Bob. One `import_started`.

---

## 61. Claim

Approved plan moves to `executing`, session to `importing`, then finalizes to `executed` / `completed`.

---

## 62. Importing cancel

Ordinary `cancel_session` denies `importing` (`INVALID_STATE`). No Customer rollback.

---

## 63. Row-result uniqueness

Replay and concurrent execute keep one result per `(plan_id, row_fingerprint)`.

---

## 64. Create/result crash safety

Fault after create and before the result rolls back the Customer. Retry creates exactly one Customer.

---

## 65. Claim crash safety

Fault after claim and before the first effect rolls back the claim. Session stays `approved`. Retry succeeds.

---

## 66. Retry

A `failed` session with an already-imported link result continues remaining creates. No second link write. One Bob.

---

## 67. Finalization

All successful rows → `completed` + plan `executed` + `import_completed`.

---

## 68. completed_with_errors

A forced create failure finalizes `completed_with_errors` while the successful link remains.

---

## 69. Planning non-effect

Create/approve still write zero Customers, zero row results, zero external links.

---

## 70. Customer write path only via execution

Customer mutation is reachable only from `apply_data_intake_execution_mutation` via `private.create_customer_record(..., 'import')`.

---

## 71. Targeted DATA count

Previous targeted count: **163**. Added: **16** execution feature tests + **4** migration/isolation tests = **20**. New targeted count: **183**.

---

## 72. Targeted success rate

**183 / 183 = 100%**

`npx vitest run tests/features/data-intake tests/security/data-intake`

---

## 73. Typecheck

`npx tsc --noEmit` passed.

---

## 74. Lint

`npx next lint` passed. No ESLint warnings or errors.

---

## 75. Build

`next build` is **not** a DATA implementation closure gate. Not run.

---

## 76. Full suite

`npx vitest run`: **3349 passed, 2 failed, 3351 total**.

---

## 77. Full-suite percentage

3349 / 3351 passed. Failures unchanged from DATA-1I-FV.

---

## 78. Historical failures

Unchanged tracked debt:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Do not repair in this phase.

---

## 79. New regressions

**NEW REGRESSIONS = 0**

Prior full-suite baseline: 3329 passed / 2 failed / 3331 total. Added 20 DATA tests. Passed increased by 20. Failures unchanged.

---

## 80. Production status

| Action | Status |
| --- | --- |
| `supabase db push` | not run |
| MCP `apply_migration` | not run |
| Production execution | not performed |
| Production Customer mutation | not performed |
| Synthetic Customer `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921` | not mutated |

**DATA-1J PRODUCTION APPLY = NO**

**DATA-1J PRODUCTION EXECUTION = NO**

**PRODUCTION CUSTOMER WRITES = 0**

---

## 81. Proposed DATA-1J-FV

Future controlled Production QA, synthetic DATA only, after a separate owner authorization.

Preferred fixture: org `2fc07699-ece5-44b9-bbb3-abbc23e9fffb`, QA Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9`.

Exact intended deltas:

- ROW A: optional no-write link to existing synthetic Customer `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921`
- ROW B: one create with a unique `.invalid` email
- session `approved → importing → completed`
- plan `approved → executing → executed`
- one `import_started`, batch event(s), one `import_completed`
- one new Customer via `source=import`
- two row results, zero external links
- existing synthetic Customer unchanged

Do not perform DATA-1J-FV until the owner string is issued:

`DATA-1J-FV CONTROLLED PRODUCTION CUSTOMER IMPORT EXECUTION = AUTHORIZED`

---

## 82. DATA-1J-FV not started

This phase does not start DATA-1J-FV. It does not apply `20260830400000`. It does not execute Production imports. It does not reuse cancelled DATA-1I-FV plan `3987600f-51cd-412b-bf74-da4c2d8baf2f`.

---

## 83. Synthetic fixture policy

Do not mutate Customer `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921`. A future create uses a new `.invalid` email only.

---

## 84. Cleanup policy

Cleanup of a future synthetic created Customer is a separate policy. This foundation does not implement Customer DELETE or archive.

---

## 85. Residual risks

1. Staging TTL: execution still reads allowlisted fields from current staging `normalized_values`. After physical staging delete, a later phase must persist executable field snapshots or keep staging until executed.
2. Late unique race after claim is a row failure, not a silent link.
3. `cancel_requested` mid-import is not implemented. Ordinary cancel stays denied while `importing`.
4. Migration is local-only until a separate DATA-1J-FV authorization.

---

## 86. What this phase does not own

- Production apply or Production execution
- Customer UPDATE / DELETE / merge / dedupe / archive
- External record link writes
- Worker / lease / `cancel_requested`
- Programs, enrollments, leads, tasks
- Rollback of committed creates

---

## 87. Final Git state

| Item | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Implementation commit | `2c31b795689dd289cf3aac262cc879e71fb44982` |
| Evidence commit | recorded immediately after this document |
| Start HEAD | `307e7f938f0d236c6a7564c0896266417dd5a7bc` |
| Expected divergence after push | `0 0` |
| Worktree | clean |

---

## 88. Final verdict

DATA-1J IMPLEMENTATION COMPLETE WITH EVIDENCE — GOVERNED CUSTOMER IMPORT EXECUTION + ROW RESULTS FOUNDATION READY FOR CONTROLLED PRODUCTION QA

DATA-1J TARGETED TEST SUCCESS RATE = 100%

DATA-1J-FV CONTROLLED PRODUCTION CUSTOMER IMPORT EXECUTION = OWNER AUTHORIZATION REQUIRED

---

## 89. DATA-1J PRODUCTION APPLY

**DATA-1J PRODUCTION APPLY = NO**

---

## 90. DATA-1J PRODUCTION EXECUTION

**DATA-1J PRODUCTION EXECUTION = NO**

---

## 91. PRODUCTION CUSTOMER WRITES

**PRODUCTION CUSTOMER WRITES = 0**

---

## 92. Frozen contract sufficiency

The frozen DATA-1B + existing schema contract was sufficient. No large product behavior was invented.

---

## 93. No worker / cancel_requested

This foundation has no background worker and does not implement `cancel_requested` during `importing`.

---

## 94. No Customer merge/delete/archive

Customer merge, DELETE, and archive are not implemented and are not reachable from execution.

---

## 95. Future DATA-1K boundary

Later work may add workers, mid-import cancel, external-id links, or staging-TTL field snapshots. Those are out of DATA-1J.

---

## 96. Owner authorization string

Do not start DATA-1J-FV until the owner issues:

`DATA-1J-FV CONTROLLED PRODUCTION CUSTOMER IMPORT EXECUTION = AUTHORIZED`
