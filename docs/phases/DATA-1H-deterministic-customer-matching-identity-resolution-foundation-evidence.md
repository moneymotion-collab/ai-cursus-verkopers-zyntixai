# DATA-1H — Deterministic Customer Matching + Identity Resolution Foundation

| Field | Value |
| --- | --- |
| Phase | **DATA-1H — DETERMINISTIC CUSTOMER MATCHING + IDENTITY RESOLUTION FOUNDATION** |
| Parent | DATA-1G / DATA-1G-FV |
| Document type | Implementation evidence |
| Date | 2026-08-30 |
| Formal status | `DATA-1H IMPLEMENTATION COMPLETE WITH EVIDENCE — DETERMINISTIC CUSTOMER MATCHING + IDENTITY RESOLUTION FOUNDATION READY FOR CONTROLLED PRODUCTION QA` |
| Governing 1G-FV | `docs/phases/DATA-1G-FV-controlled-production-validation-staging-verification-evidence.md` |
| Governing contract | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `9e370c93c34b49fb6f00790f35c2f675c9411451` |
| Production apply | **NOT PERFORMED** |
| Production Customer matching | **NOT AUTHORIZED** |

**CUSTOMER READS = IMPLEMENTED**

**DETERMINISTIC CUSTOMER MATCHING = IMPLEMENTED**

**IDENTITY COLLISION DETECTION = IMPLEMENTED**

**FUZZY MATCHING = NOT IMPLEMENTED**

**AI MATCHING = NOT IMPLEMENTED**

**CUSTOMER DEDUPLICATION = NOT IMPLEMENTED**

**CUSTOMER MERGE = NOT IMPLEMENTED**

**IMPORT PLANNING = NOT IMPLEMENTED**

**CUSTOMER IMPORT = NOT IMPLEMENTED**

**CUSTOMER WRITER INVOKED = NO**

**CUSTOMER WRITER MODIFIED = NO**

**CUSTOMER WRITES = 0**

**DATA-1H PRODUCTION APPLY = NOT YET AUTHORIZED**

**DATA-1H PRODUCTION CUSTOMER MATCHING = NOT YET AUTHORIZED**

---

## 1. Executive verdict

DATA-1H implementation is complete with evidence. After governed staging, an authorized Owner/Admin can run a bounded, deterministic, same-organization Customer identity resolution against persisted staged normalized values. Matching classifies exact, no-match, no-key, ambiguous, collision, and blocked-skip outcomes. It does not create, update, merge, or deduplicate Customers. It does not create an import plan.

Targeted DATA tests: **143 / 143 = 100%**. Full suite: **3309 passed, 2 failed, 3311 total**. The two failures are the same historical tracked debt as DATA-1G-FV. `NEW REGRESSIONS = 0`.

This phase does **not** apply the matching migration to Production and does **not** execute Production Customer matching.

---

## 2. Strategic purpose

DATA-1G proves validated staging. DATA-1H adds the next safety boundary:

Stage → deterministic Customer match

without canonical Customer mutation or import planning.

Conceptual pipeline now:

Upload → Verify → Discover → Map → Confirm → Validate → Stage → Match

Still not: Plan → Review → Approve → Execute.

---

## 3. DATA-1G-FV dependency

Authoritative prior verdict:

`DATA-1G-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION DETERMINISTIC VALIDATION + GOVERNED STAGING VERIFIED`

`DATA-1G RELEASE READY WITH EVIDENCE`

`DATA-1G TARGETED TEST SUCCESS RATE = 100%`

Closure HEAD: `9e370c93c34b49fb6f00790f35c2f675c9411451`.

This phase started from that HEAD and did not reset later history.

---

## 4. Starting Git state

- worktree: `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1`
- branch: `core/platform-readiness-20260707`
- HEAD: `9e370c93c34b49fb6f00790f35c2f675c9411451`
- subject: `docs(data): verify controlled Production validation staging`
- upstream: `origin/core/platform-readiness-20260707` at the same SHA
- divergence: `0 0`
- worktree: clean
- staged / unstaged / untracked: none at start
- `git diff --check`: clean

---

## 5. Frozen DATA-1B identity-resolution contract

Inspected `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` §§16, 44–45, 7, 40.

DATA-1B already reserved staging-row identity fields. A ninth matching table is not required and was not created.

Exact duplicate: same organization, `lower(btrim(email))`, email not null. Unique index includes archived Customers.

No email: no exact key. Same `display_name` is warning-only and never auto-links.

Intra-file same normalized email: `conflict`. DATA-1H implements the safer reading: every colliding staged row is `conflict`. It does not pick the first row as `create` and later rows as `link`.

There is no frozen `matching` session state.

---

## 6. Staging resolution fields

Reused `data_intake_staging_rows` columns already frozen in DATA-1B:

| Field | Frozen values used by DATA-1H |
| --- | --- |
| `lifecycle` | unchanged: `validated` \| `blocked` |
| `resolution` | `none` \| `create` \| `duplicate` \| `conflict` |
| `target_operation` | `create` \| `link` \| null |
| `target_record_id` | Customer id only for a unique exact match; otherwise null |

`link` and `skip` remain reserved. DATA-1H does not write `skip` or `ready`. `target_operation = link` is a proposed candidate, not an update.

---

## 7. Canonical Customer identity model

Inspected `public.customers`, `customers_org_email_unique_idx`, `private.normalize_customer_email` / writer normalization, and DATA-1B §43–45.

Candidate identity fields: `id`, `organization_id`, `email`, `archived_at`. Matching reads only those columns.

Display name, first name, last name, phone, status, and metadata are not v1 match keys.

---

## 8. Canonical Customer uniqueness findings

- Unique index: `customers_org_email_unique_idx` on `(organization_id, lower(btrim(email))) WHERE email IS NOT NULL`
- Scope: same organization only
- Email is optional; null/empty email is permitted
- Comparisons are case-insensitive after `lower(btrim(email))`
- Writer/trigger stores `nullif(lower(btrim(email)), '')`
- Phone is not unique
- Names are not unique
- Multiple same-org emails should be impossible in Production; DATA-1H still classifies that case as `conflict` and does not add a uniqueness constraint

---

## 9. Customer lifecycle eligibility

Statuses: `onboarding | active | paused | completed | cancelled | churned` plus optional `archived_at`.

The unique email index includes archived rows. DATA-1B says the exact duplicate rule includes archived Customers.

DATA-1H rule: archived Customers remain match-eligible. An exact archived match is `resolution=duplicate`, `target_operation=link`. It does not restore, update, or hide the Customer. A later import plan must revalidate eligibility before any write.

Inactive/ended statuses without archive are also eligible. There is no soft-delete column.

---

## 10. Chosen v1 match key

Exact normalized staged email within the same organization.

Matcher version: `customer-matcher-v1`.

Match field key: `email`.

This is the only identifier that the canonical unique index and DATA-1B duplicate rule treat as deterministic.

---

## 11. Rejected match keys

Rejected for automatic matching:

- `display_name`
- `first_name`
- `last_name`
- `phone`
- fuzzy/similar email
- phonetic or token similarity
- embeddings / AI scores

---

## 12. No-name-match rule

An identical Customer `display_name` such as `John Smith` does not produce a match when the deterministic email key differs or is absent.

No exact-name fallback. No fuzzy-name fallback.

---

## 13. No-fuzzy-match rule

`alice@example.com` versus `alic@example.com` is no-match.

No Levenshtein, trigram, phonetic, token, embedding, or heuristic confidence score exists in the matcher.

---

## 14. Normalized match input

Matching uses persisted `normalized_values.email` from DATA-1G.

Example: source `PERSON@EXAMPLE.COM` is already staged as `person@example.com`. Matching does not apply a second normalization algorithm. It compares that staged value to the stored canonical Customer email, which the writer already lowercases and trims.

---

## 15. Eligible staged-row rule

Only `lifecycle=validated` rows enter Customer lookup.

The operation binds organization, session, source, current mapping hash, verified source hash, and completed staging. Client-supplied Customer IDs and matching payloads are rejected.

---

## 16. Blocked-row behavior

Blocked rows are skipped. They keep `resolution=none`, `target_operation=null`, `target_record_id=null`, and their validation error codes.

Matching does not query Customers for blocked emails as an eligibility path and cannot convert a blocked row into a valid or create/link candidate.

---

## 17. Exact-match behavior

Exactly one same-org Customer with the staged normalized email:

- `resolution = duplicate`
- `target_operation = link`
- `target_record_id = <customer id>`
- `matchKind = exact`

No Customer update is executed. `link` is a proposed candidate for a later plan.

---

## 18. No-match behavior

Zero eligible Customers for a usable staged email:

- `resolution = create`
- `target_operation = create`
- `target_record_id = null`
- `matchKind = no_match`

No Customer is created. `create` is proposed intent only.

---

## 19. No-key behavior

Validated row with null/empty staged email:

- `resolution = none`
- `target_operation = null`
- `target_record_id = null`
- `matchKind = no_key`

This is not treated as “definitely a new Customer.” It is distinct from no-match.

---

## 20. Multiple-match behavior

If more than one same-org Customer shares the email (fixture-only; unique index should prevent this in Production):

- `resolution = conflict`
- `target_operation = null`
- `target_record_id = null`
- `matchKind = ambiguous`

No first-row, newest, oldest, or name tie-breaker.

---

## 21. Staged-row collision behavior

Two different validated staged rows with the same normalized email, whether or not a Customer exists:

- every colliding row is `conflict`
- no row receives `target_record_id`
- no merge or collapse

`COLLISION DETECTION = IMPLEMENTED`

`CUSTOMER DEDUPLICATION = NOT IMPLEMENTED`

---

## 22. Duplicate create-candidate behavior

Two validated source rows share an email and zero Customers exist: both remain staged, both are `conflict`. DATA-1H does not invent one combined future Customer.

---

## 23. target_record_id security

`target_record_id` is computed server-side.

Before persist, the matching RPC verifies:

- Customer belongs to the same organization
- Customer email equals the staged normalized email
- resolution is `duplicate` and operation is `link`

Caller-supplied `target_record_id` / `target_operation` on the external request are rejected. A foreign Customer id cannot be persisted.

---

## 24. target_operation semantics

Frozen values `create` and `link` are proposed/candidate intent only.

They do **not** authorize Customer INSERT/UPDATE, merge, plan execution, or approval.

A future import plan must independently consume and revalidate them.

---

## 25. Match provenance

Safe `matching_completed` event metadata:

- `source_id`
- `mapping_hash`
- `matcher_version`
- eligible / exact / no-match / no-key / ambiguous / collision / blocked counts

No raw emails, names, or full Customer records are written to events.

---

## 26. Matcher version

`customer-matcher-v1`

A later plan can see which deterministic rule set produced the resolution.

---

## 27. Match summary

Returned counts:

- `eligibleRows`
- `exactMatches`
- `noMatches`
- `noKeyRows`
- `ambiguousRows`
- `collisions`
- `blockedSkipped`

These counts do not authorize import.

---

## 28. State-machine impact

No `matching` state was added.

Matching may run only while the session is `review_required` or `ready_for_approval`.

DATA-1B does not allow `review_required → ready_for_approval` except via `validating`. DATA-1H therefore never promotes `review_required` to `ready_for_approval`.

`ready_for_approval → review_required` is allowed and is used when matching finds no-key, collision, or ambiguous rows.

---

## 29. review_required semantics

Session stays or becomes `review_required` when:

- any staged row is blocked; or
- matching finds no-key, collision, or ambiguous rows; or
- the session was already `review_required`

Ambiguous matching is not hidden under `ready_for_approval`.

---

## 30. ready_for_approval semantics

DATA-1G `ready_for_approval` means staging validation succeeded. It does **not** mean identity resolution is complete.

After DATA-1H, `ready_for_approval` remains only when the session was already `ready_for_approval` and every validated row is a safe `create` or `duplicate` with no blocked/no-key/collision/ambiguous rows.

---

## 31. Replay / idempotency

Same authoritative staging set + same canonical Customer state:

- recomputes the same classifications
- does not append a second `matching_completed` event
- does not duplicate staging rows
- keeps `target_record_id` stable

Replay requires an existing `matching_completed` event. A first run that happens to leave `resolution=none` (no-key / blocked) is not treated as replay.

---

## 32. Customer-state change / re-evaluation

Matching is not a timeless guarantee (TOCTOU).

If canonical Customers change between runs, DATA-1H recomputes from the current Customer set. Example: previous no-match becomes exact when a synthetic Customer is added.

A future import plan **must** revalidate identity before any canonical write.

---

## 33. Concurrency

Matching uses advisory lock class `872018` hashed by organization + session.

Memory tests serialize competing runs on a per-store tail. One authoritative outcome; the second is a safe replay. No mixed row resolutions.

---

## 34. Atomicity

The matching RPC updates all staged resolution fields and the session status in one transaction. A failed run is not a completed matching event. Partial completion cannot be reported as success.

---

## 35. Authorization

Unchanged DATA role contract:

| Actor | Matching |
| --- | --- |
| Owner | allowed |
| Admin | allowed |
| Staff | denied |
| Viewer | denied |
| Suspended | denied |
| Unauthenticated | denied |
| Foreign organization | denied |
| service_role | executor only; cannot substitute human authority |

---

## 36. Tenant isolation

A staged row from Organization A queries only Organization A Customers.

An Organization B Customer with the same email is invisible: Organization A receives no-match and never sees the foreign id.

Foreign session and foreign source are denied.

---

## 37. Privacy

Events carry IDs, matcher version, field key, and counts.

Full Customer records, raw emails, and names are not logged in matching events.

Cross-org existence is not exposed.

---

## 38. Customer query architecture

Fixed/code-owned read:

`customers` → `id, organization_id, email, archived_at` filtered by `organization_id`, then in-process filter to staged emails.

No arbitrary filter objects. No dynamic SQL column names. No Customer mutation statements.

The lookup is a dedicated DATA-owned reader. It does not import Customer writer/mutation modules.

---

## 39. Index / performance review

`customers_org_email_unique_idx` already provides a tenant-scoped normalized-email lookup path.

DATA-1H does not add an index and does not add uniqueness. The unique index already exists as a canonical Customer constraint, not a DATA invention.

---

## 40. RPC / server architecture

New bounded RPC: `apply_data_intake_matching_mutation` / `confirm_source_matching`.

`apply_data_intake_staging_mutation` remains staging-only and still rejects caller `target_record_id` / non-`none` resolution.

Flow:

authorize actor → load eligible staged rows → verify mapping/source provenance → read tenant-scoped Customers → classify → persist staging resolution → append `matching_completed`

Service-role credentials stay in `data-intake-client.ts` only.

---

## 41. DB security

- `SECURITY DEFINER`
- `search_path = ''`
- `service_role` EXECUTE only
- authenticated / anon / public revoked
- human Owner/Admin membership required
- explicit operation allowlist: `confirm_source_matching`
- no dynamic SQL
- no Customer INSERT/UPDATE/DELETE
- no arbitrary target acceptance

Authenticated clients do not receive broad UPDATE on staging resolution fields.

---

## 42. Migration decision

Schema already supported resolution fields. Migration is required for:

- the matching RPC
- `matching_completed` on the event-type check

Not created: matching table, dedupe table, merge table, import-plan machinery, Customer mutation RPC, unique email constraint.

---

## 43. Migration filename / hash

Filename: `supabase/migrations/20260830200000_add_data_intake_customer_identity_resolution.sql`

SHA-256: `e745e566918b76c436d92c5333fa49d0ad32fad1c06534a2f6ebbd3bce412b1d`

Purpose: bounded matching RPC + `matching_completed` event. Production apply = NO.

---

## 44. RLS / grants impact

No RLS policy changes on `customers` or DATA tables.

Matching RPC: revoke public/anon/authenticated; grant execute to `service_role` only.

---

## 45. Exact-match test

Same-org Customer `alice@example.com` + staged normalized `alice@example.com` → `duplicate` / `link` / exact Customer id. Writer not invoked.

---

## 46. Normalized-key test

Customer `person@example.com` + staged source `PERSON@EXAMPLE.COM` → match on staged `person@example.com`.

---

## 47. No-match test

Validated email absent from canonical Customers → `create` / `create` / null target. Customers untouched.

---

## 48. Null-key test

Validated null email → `none` / null / `no_key`. Not treated as a new Customer.

---

## 49. Multi-match test

Two same-org memory Customers sharing one email → `conflict`, no target. No lowest-ID fallback.

Production uniqueness makes this a defensive invariant test, not a product invitation to create duplicates.

---

## 50. Foreign-org test

Org B Customer `person@example.com`, Org A staged same email, Org A has no Customer → Org A no-match. Foreign id never appears in the result.

---

## 51. Name-only non-match test

Staged `John Smith` with a different email than the existing Customer → `create`, no target.

---

## 52. Fuzzy non-match test

Staged `alic@example.com` versus Customer `alice@example.com` → no match.

---

## 53. Blocked-row test

DATA-1G blocked row remains blocked, `resolution=none`, no `target_record_id`, validation codes preserved, session `review_required`.

---

## 54. Same-target collision test

Two staged rows `same@example.com` plus one Customer → both `conflict`. Both rows preserved. No merge.

---

## 55. Duplicate create-candidate test

Two staged rows `same@example.com` and zero Customers → both `conflict`. No combined future Customer.

---

## 56. Target-ID injection test

Service input `targetRecordId` and RPC payload `target_record_id` are rejected (`SOURCE_INVALID`). Foreign Customer cannot be bound.

---

## 57. Archived Customer test

Archived same-org Customer with the exact email → `duplicate` / `link`. Matches the unique-index-includes-archived contract.

---

## 58. Replay test

Second identical matching run: `replayed=true`, one `matching_completed` event, stable targets, no Customer writes.

---

## 59. Concurrency test

Two competing matching calls: one authoritative write, one replay, one event, consistent resolutions.

---

## 60. Customer-state-change test

First run no-match; add synthetic Customer; rematch → exact. Stale no-match is not permanent authority.

---

## 61. Staging regression

Matching does not rewrite `raw_values`, `normalized_values`, validation error codes, row fingerprint, source row number, source hash, or mapping hash.

DATA-1G coverage still passes.

---

## 62. Customer write non-effect

Customer array snapshots are unchanged. No `create_customer` / writer path.

`CUSTOMER WRITES = 0`

---

## 63. Import-plan non-effect

`data_import_plans` delta = 0

---

## 64. Row-result non-effect

`data_import_row_results` delta = 0

---

## 65. External-link non-effect

`data_external_record_links` delta = 0

---

## 66. Targeted DATA count

Previous: **126**

Added: **17** (5 domain + 9 service + 3 migration)

Final: **143**

---

## 67. Targeted success rate

`143 / 143 = 100%`

Command: `npx vitest run tests/features/data-intake tests/security/data-intake`

---

## 68. Typecheck

`npx tsc --noEmit` — PASS

---

## 69. Lint

`npx next lint` — PASS (0 warnings)

---

## 70. Build

`next build` is not a DATA-1C through DATA-1H closure gate. Typecheck + lint + targeted + full Vitest were the quality gates.

---

## 71. Full suite

`npx vitest run`: **3309 passed, 2 failed, 3311 total**

Prior DATA-1G-FV baseline: 3292 passed, 2 failed, 3294 total. Added 17 DATA-1H tests (3294 + 17 = 3311).

---

## 72. Full-suite percentage

`3309 / 3311 = 99.9396%`

Strategic objective remains 100%. Historical restoration is a separate quality phase.

---

## 73. Historical failures

Exactly the same two tracked failures:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Neither became green. Neither was repaired inside DATA-1H.

---

## 74. New regressions

`NEW REGRESSIONS = 0`

---

## 75. Production status

DATA-1H migration was **not** applied to Production.

No Production Customer matching.

No real Production Customer PII was read for fixtures.

`DATA-1H PRODUCTION APPLY = NOT YET AUTHORIZED`

`DATA-1H PRODUCTION CUSTOMER MATCHING = NOT YET AUTHORIZED`

---

## 76. Proposed DATA-1H-FV

Future controlled Production QA, Customer-write free, after exact owner authorization:

`DATA-1H-FV CONTROLLED PRODUCTION CUSTOMER MATCHING = AUTHORIZED`

Preferred strategy: reuse an already-existing synthetic QA Customer whose identity is known to be synthetic. Then stage one matching row and one no-match row.

If no suitable synthetic QA Customer exists:

`DATA-1H-FV SYNTHETIC CANONICAL MATCH FIXTURE = OWNER FIXTURE PREPARATION REQUIRED`

Do not create a canonical Customer merely to satisfy DATA-1H-FV.

Do not use real Customer PII.

Proposed cases:

A. one synthetic exact deterministic match  
B. one synthetic no-match  
C. no cross-org leakage  
D. blocked row skipped  
E. replay safe  
F. Customer counts unchanged  
G. Customer writer not invoked  
H. import tables remain zero  
I. governed cancellation still works  

Ambiguous duplicate-canonical-Customer Production testing remains automated unless a safe synthetic fixture already exists.

---

## 77. DATA-1I boundary

DATA-1I is not started. Still out of scope:

- import plans
- import approval
- import execution
- `data_import_plans`
- `data_import_row_results`
- `data_external_record_links`
- Customer create/update/delete/merge/dedupe

---

## 78. Residual risks

- Matching is TOCTOU. A later plan must re-read Customers before execution.
- Production unique email index should prevent multi-match; the matcher still fail-closes to `conflict`.
- Intra-file email collision is stricter than one possible DATA-1B reading (“first create, later link”). DATA-1H chose all-`conflict` for safety.
- `review_required` cannot be promoted to `ready_for_approval` by matching alone.
- Memory concurrency is serialized; Production concurrency relies on advisory lock 872018.
- Historical invitations + Programs/Enrollments copy failures remain tracked debt.

---

## 79. Final Git state

Recorded after the implementation and evidence commits and normal push. See the closing report.

Expected:

- branch `core/platform-readiness-20260707`
- upstream `origin/core/platform-readiness-20260707`
- divergence `0 0`
- clean worktree

---

## 80. Final verdict

`DATA-1H IMPLEMENTATION COMPLETE WITH EVIDENCE — DETERMINISTIC CUSTOMER MATCHING + IDENTITY RESOLUTION FOUNDATION READY FOR CONTROLLED PRODUCTION QA`

`DATA-1H TARGETED TEST SUCCESS RATE = 100%`

`DATA-1H-FV CONTROLLED PRODUCTION CUSTOMER MATCHING = OWNER AUTHORIZATION REQUIRED`
