# DATA-1F — Governed Semantic Mapping Foundation

| Field | Value |
| --- | --- |
| Phase | **DATA-1F — GOVERNED SEMANTIC MAPPING FOUNDATION** |
| Parent | DATA-1E / DATA-1E-FV |
| Document type | Implementation evidence |
| Date | 2026-08-29 |
| Formal status | `DATA-1F IMPLEMENTATION COMPLETE WITH EVIDENCE — GOVERNED SEMANTIC MAPPING FOUNDATION READY FOR CONTROLLED PRODUCTION QA` |
| Governing 1E implementation | `docs/phases/DATA-1E-secure-parser-structure-discovery-evidence.md` |
| DATA-1E-R1 | `docs/phases/DATA-1E-R1-parsed-session-cancellation-hardening-evidence.md` |
| DATA-1E-FV | `docs/phases/DATA-1E-FV-controlled-production-source-structure-discovery-verification-evidence.md` |
| Governing contract | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `ed09faecb2112a00c22272731f4a85344d8752f7` |
| Implementation commit | `b78f01c457f74c957083620957a0f6124de4137c` |
| Production apply | **NOT PERFORMED** |
| Production mapping | **NOT AUTHORIZED** |

**SEMANTIC MAPPING FOUNDATION = IMPLEMENTED**

**MAPPING CONFIRMATION = IMPLEMENTED**

**VALUE VALIDATION = NOT IMPLEMENTED**

**STAGING = NOT IMPLEMENTED**

**IMPORT PLANNING = NOT IMPLEMENTED**

**CUSTOMER IMPORT = NOT IMPLEMENTED**

**DATA-1F PRODUCTION MAPPING = NOT YET AUTHORIZED**

---

## 1. Executive verdict

DATA-1F implementation is complete with evidence. After DATA-1E structure discovery, an authorized Owner/Admin can bind discovered source columns to a server-controlled `customer.v1` allowlist, intentionally ignore irrelevant columns, evaluate mapping completeness, and confirm a deterministic mapping snapshot. Confirmation does not import Customers, write staging, create import plans, or call the Customer writer.

Targeted DATA tests: **96 / 96 = 100%**. Full suite: **3262 passed, 2 failed, 3264 total**. The two failures are the same historical tracked debt as DATA-1E-FV. `NEW REGRESSIONS = 0`.

This phase does **not** apply the mapping migration to Production and does **not** create a Production mapping fixture.

---

## 2. Strategic purpose

DATA-1E discovers technical source structure (headers, ordinals, sheet identity). DATA-1F expresses the intended semantic relationship between those source columns and approved destination fields.

The system never allows arbitrary `source header → database column name` mapping. All destination fields come from a frozen, explicit, server-controlled allowlist derived from the canonical Customer creation contract.

---

## 3. DATA-1E dependency

Authoritative prior verdict:

`DATA-1E-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION CSV + XLSX STRUCTURE DISCOVERY VERIFIED`

`DATA-1E RELEASE READY WITH EVIDENCE`

DATA-1E targeted tests at closure: **81 / 81 = 100%**.

DATA-1E leaves authorized sessions in `parsed` after successful structure discovery. DATA-1F starts from that state. The later Social publishing-reactivation evidence commit at start HEAD is a separate track and did not change DATA architecture. This phase did **not** reset back to the DATA-1E closure HEAD.

---

## 4. Starting Git state

Proven before DATA-1F files were added:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `ed09faecb2112a00c22272731f4a85344d8752f7` |
| Subject | `docs(social): verify controlled Production publishing reactivation` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `ed09faecb2112a00c22272731f4a85344d8752f7` |
| Divergence | `0 0` |
| `git status` | clean |
| Staged / unstaged / untracked | none |
| `git diff --check` | clean |

---

## 5. Frozen scope

In scope:

- `customer` target-domain field catalog
- safe importable-field allowlist
- deterministic source-column identity
- manual source → target mapping
- intentionally ignored source columns
- required/optional target metadata from the canonical Customer contract
- duplicate-target prevention
- mapping completeness evaluation
- persistence on existing `data_intake_mappings`
- confirmation / freeze snapshot + hash
- mapping audit events
- Owner/Admin authorization and tenant isolation
- typed contracts, tests, and this evidence

Out of scope (unchanged / not implemented):

- new parsers or arbitrary file reads
- value-level validation, coercion, normalization
- email/phone/date transformation
- deduplication / Customer matching
- staging rows, import plans, row results, external links
- Customer create/update / writer modification
- AI / LLM / fuzzy autonomous mapping
- DATA-1G
- Production apply or Production mapping fixtures

---

## 6. Canonical Customer model inspection

Inspected:

- `public.customers` generated types
- `createCustomerInputSchema` in `src/features/customers/validation/mutation-schemas.ts`
- `src/features/customers/server/customer-mutations.ts` and `customer-rpc-adapters.ts`
- `private.create_customer_record` (`supabase/migrations/20260705170000_add_private_create_customer_record.sql`)
- DATA-1B `customer.v1` target-field registry

Writable business profile fields on create: `display_name` (required), `email`, `phone`, `first_name`, `last_name`. Optional `ownerMemberId` exists on the human create contract but is **not** a DATA import target (DATA-1B: not importable).

System/organization-owned fields: `id`, `organization_id`, `status` (writer sets `onboarding`), `owner_member_id`, `created_by_member_id`, `metadata`, `started_at`, `ended_at`, `archived_at`, `created_at`, `updated_at`.

---

## 7. Canonical Customer writer inspection

The live writer path is `customer-mutations.ts` → `create_customer` RPC → `private.create_customer_record`. DATA-1F inspected this path read-only.

`CUSTOMER WRITER MODIFIED = NO`

DATA-1F never calls the writer. Mapping tests assert the store contains no `create_customer` token and Customer-adjacent tables are untouched.

---

## 8. Target-domain decision

DATA-1B freezes v1 executable adapter as **`customer` only**. Forward-compatible CHECK values (`lead`, `task`, `program`, `enrollment`) remain non-executable.

DATA-1F supports `customer` only. Unknown / other domains fail closed (`TARGET_NOT_SUPPORTED`). No arbitrary table-name mapping.

---

## 9. Target-field allowlist

Code-owned catalog in `src/features/data-intake/domain/target-catalog.ts`. Keys are adapter semantic keys, not `customer.email` dotted paths.

| Key | Type | Required | Nullable | Max |
| --- | --- | --- | --- | --- |
| `display_name` | string | **yes** | no | 200 |
| `email` | string | no | yes | 200 |
| `phone` | string | no | yes | 50 |
| `first_name` | string | no | yes | 200 |
| `last_name` | string | no | yes | 200 |

`customer.email` and other dotted/SQL identifiers are `TARGET_FIELD_UNKNOWN`.

---

## 10. Excluded / system fields

Explicitly excluded from the catalog and rejected as `TARGET_FIELD_FORBIDDEN` when submitted:

`id`, `organization_id`, `status`, `owner_member_id`, `created_by_member_id`, `metadata`, `started_at`, `ended_at`, `archived_at`, `created_at`, `updated_at`.

The catalog is a business contract. It does not expose schema introspection or raw SQL.

---

## 11. Source-column identity model

Header text is never identity. DATA-1E discovery headers are addressed by ordinal (and sheet for XLSX):

- CSV: `csv:<0-based-index>`
- XLSX: `xlsx:<0-based-index>:<selectedSheet>`

Duplicate header text, empty headers, casing, and whitespace variants remain distinct columns. Headers are not silently renamed.

A submitted key that is not in the frozen discovery is `SOURCE_COLUMN_UNKNOWN`.

---

## 12. Mapping row model

Existing table `public.data_intake_mappings` is reused. No ninth DATA workflow table.

Minimum persisted decision:

| Concept | Persistence |
| --- | --- |
| Mapped | `status = proposed` or `confirmed`, `target_field` in allowlist |
| Intentionally ignored | `status = rejected`, `target_field` is null |
| Unresolved | no row, or `unmapped` / `needs_review` |

Unique `(source_id, source_field_key)` remains the one-decision-per-column invariant. `proposal_source = user`. `transform_kind` stays `identity`. No value transforms are applied.

Rows stay organization / session / source scoped via existing composite FKs.

---

## 13. Ignored-column model

`ignore_source_column` writes `rejected` + `target_field = null`. This is distinct from “not mapped yet” (missing / unresolved).

An ignored column cannot remain mapped: ignore overwrites a prior target. A later upsert on the same source key replaces ignore with a mapped decision.

---

## 14. Mapping completeness

Completeness is structural only (no row values):

- **mapped** — proposed/confirmed with a target
- **ignored** — rejected
- **unresolved** — no usable decision

`confirmable` is true only when every **required target field** is mapped. Unresolved *source* columns are allowed. Users may ignore irrelevant columns.

---

## 15. Required-target behavior

Authoritative required destination field: **`display_name` only**.

Derived from `createCustomerInputSchema` (`displayName` min 1) and DATA-1B `customer.v1`. Email/phone/names are optional.

Missing `display_name` → `MAPPING_INCOMPLETE`. Mapping a required target does **not** prove every source row contains a usable value. That is later validation/staging work.

---

## 16. Duplicate-source protection

One source column has at most one active decision (`unique (source_id, source_field_key)`). A second upsert for the same key replaces the decision (or is an identical replay). A column cannot be mapped and ignored at the same time.

---

## 17. Duplicate-target protection

v1 rule: one single-value target ← at most one source column.

Defense in depth:

- application `duplicateTargetField`
- SQL conflict select
- unique partial index `data_intake_mappings_one_target_per_source_idx` on `(source_id, target_field)` where `target_field is not null` and status in `proposed` / `confirmed`

Failure code: `DUPLICATE_TARGET_MAPPING`. No merge/transform/fan-in.

---

## 18. Authorization model

Unchanged DATA role contract:

| Actor | Mapping |
| --- | --- |
| active Owner | allowed |
| active Admin | allowed |
| Staff | `FORBIDDEN_ROLE` |
| Viewer | `FORBIDDEN_ROLE` |
| suspended member | `ORG_NOT_FOUND` (fail closed; no membership leak) |
| unauthenticated | `UNAUTHORIZED` |
| foreign Owner | `ORG_NOT_FOUND` / `SESSION_NOT_FOUND` |

`service_role` is executor only. Human authority is the authenticated member. Authenticated clients have no direct DML on `data_intake_mappings`.

---

## 19. Tenant isolation

Session and source lookups are organization-scoped. Foreign session IDs resolve `SESSION_NOT_FOUND`. Foreign source IDs resolve `SOURCE_NOT_FOUND`. Mapping events and rows carry `organization_id`. Isolation tests still forbid DATA table tokens in Social / BQA / TAX / CAP / CTX / Programs / Enrollments / Tasks / Attention / invitations / memberships / billing / onboarding surfaces.

---

## 20. Session / source prerequisite

Mapping requires:

- authorized org + Owner/Admin
- session in `parsed`, `mapping_required`, or `mapped`
- same-org active source
- completed structure discovery (`header_row_index` present and persisted discovery reconstructable)

Rejected: `created`, `source_ready`, unverified source, `cancelled`, foreign session/source, later unauthorized pipeline states (`validating` and beyond).

---

## 21. State-machine before

Frozen graph already contained:

`parsed → mapping_required → mapped`

and `mapped → mapping_required` (re-edit). DATA-1E discovery stopped at `parsed`. `mapping_required` / `mapped` were unused by product commands.

Cancel RPC allowlist (DATA-1E-R1) remains `created | source_ready | parsed` only.

---

## 22. State-machine after

| From | Command | To |
| --- | --- | --- |
| `parsed` | first upsert / ignore / confirm (via intermediate) | `mapping_required` |
| `mapping_required` | confirm (completeness ok) | `mapped` |
| `mapped` | confirm replay | `mapped` (idempotent) |
| `mapped` | later upsert / ignore | `mapping_required` (confirmed rows become `proposed`) |

No new state names. Transitions use existing `data_intake_session_status_transition_allowed` edges. DATA-1F does **not** extend `cancel_session` to `mapping_required` or `mapped`.

---

## 23. Draft / editability behavior

While `parsed` or `mapping_required`, Owner/Admin may add, change, or ignore decisions. Identical upserts / ignores are replay-safe (`replayed = true`, no extra event).

After `mapped`, a non-confirm edit reopens the session to `mapping_required` and clears confirmation stamps so the later snapshot cannot silently mutate underneath a future plan.

---

## 24. Confirmation / freeze behavior

`confirm_mapping` validates required-target completeness, canonicalizes the snapshot, hashes it, marks proposed mapped rows `confirmed`, writes `mapping_confirmed`, and sets session `mapped`.

Confirmation is **not** import approval. It does not create plans, staging, or Customers.

---

## 25. Mapping snapshot / version / hash

No new version column was required. Confirmation produces:

- canonical JSON: `adapterVersion = customer.v1`, `targetDomain = customer`, decisions sorted by `sourceFieldKey`
- SHA-256 via existing `sha256Hex`
- hash stored only in `mapping_confirmed` event metadata as `mapping_hash`

Independent of DB / request / UI order. A later DATA phase can prove a plan used exactly this confirmed mapping. Import plans are not implemented here.

There is no client-supplied mapping revision. `MAPPING_ALREADY_FROZEN` is reserved in the error taxonomy; v1 treats re-confirm of an already-mapped session as idempotent replay, and treats later edits as an explicit reopen (`mapped → mapping_required`).

---

## 26. Idempotency

- Identical upsert → `replayed = true`, no second `mapping_proposed`
- Identical ignore → `replayed = true`, no second event
- Confirm of an already-mapped identical session → `replayed = true`, no second `mapping_confirmed`

Covered by targeted tests.

---

## 27. Concurrency behavior

No mapping revision column exists on the frozen schema. DATA-1F uses the smallest compatible mechanism:

- transaction advisory lock `872016` hashed on `organization_id:session_id`
- unique source-column constraint
- unique active target index

Concurrent Owner/Admin tabs are serialized per session. Last distinct write to the same source column wins. Two tabs mapping different columns to the same target: the second fails `DUPLICATE_TARGET_MAPPING`. This is not a collaborative editor.

---

## 28. Audit events

DATA-1B already defined `mapping_proposed` and `mapping_confirmed`. DATA-1F uses those names.

Events are immutable append-only rows with actor, organization, session, and safe structural metadata (`source_id`, `source_field_key`, decision `mapped`/`ignored`, `mapping_hash`). They do not contain source row values or Customer payloads. Harmless replay does not insert a duplicate event.

---

## 29. Privacy / logging

Mapping metadata is organization-private. Headers may be sensitive business terms. DATA-1F does not send mappings to analytics, does not put mappings in public URLs, and does not log full mapping payloads to generic application logs. Authorized UI/API readback to Owner/Admin is allowed.

Tests assert mapping responses and events omit raw CSV body text.

---

## 30. RPC / server architecture

Bounded surface:

| Layer | Responsibility |
| --- | --- |
| `listCustomerImportTargetCatalog` | server-controlled allowlist |
| `listDataIntakeMappingState` | authorized readback + completeness |
| `upsertDataIntakeMapping` | validate + persist mapped decision |
| `ignoreDataIntakeSourceColumn` | persist ignore |
| `confirmDataIntakeMapping` | completeness + snapshot + freeze |
| `apply_data_intake_mapping_mutation` | privileged SQL mutation |

Not one giant public endpoint. Service-role credentials stay in the existing DATA client factory. Authenticated users do not receive Execute on the RPC.

Payload rejects `storage_path`, `records`, `bytes`, `rows`, `cells`. No dynamic SQL.

---

## 31. Schema changes

No ninth DATA table. Additive only:

- `data_intake_mappings_decision_shape_check` (mapped allowlist vs ignored-null)
- unique partial index `data_intake_mappings_one_target_per_source_idx`
- `public.apply_data_intake_mapping_mutation(...)`

No staging/import/Customer writer columns.

---

## 32. Migration filenames / hashes

| File | SHA-256 |
| --- | --- |
| `supabase/migrations/20260829180000_add_data_intake_semantic_mapping.sql` | `736e11d712209115922e5a2b77bc2aa546f090629c1c10d059f9cc7fb8c65594` |

**Not applied to Production in DATA-1F.**

---

## 33. Grants / RLS impact

RPC: `SECURITY DEFINER`, `search_path = ''`, `REVOKE ALL` from `public` / `anon` / `authenticated`, `GRANT EXECUTE` to `service_role` only.

Authenticated DATA write grants on `data_intake_mappings` remain absent (DATA-1C RLS unchanged). No Storage policy changes. Eight DATA tables unchanged.

---

## 34. Customer writer non-effect

Writer files were not modified. Mapping RPC/SQL contain no `private.create_customer_record`, no `insert into public.customers`, and no `create_customer` call. Tests assert Customer mutation tokens are absent from the DATA store after mapping + confirm + reopen.

`CUSTOMER WRITER MODIFIED = NO`

---

## 35. Staging non-effect

Attributable `data_intake_staging_rows` delta: **0**. Mapping tests use structural discovery metadata and synthetic fixtures only.

---

## 36. Import-plan non-effect

Attributable `data_import_plans` delta: **0**. Attributable `data_import_row_results` delta: **0**. Confirmation is not import approval.

---

## 37. External-link non-effect

Attributable `data_external_record_links` delta: **0**. No canonical Customer relationship is established.

---

## 38. Mapping test matrix

Domain: catalog allowlist; excluded/system fields; unknown/malformed/wrong-domain keys; duplicate/empty CSV identity; XLSX sheet+ordinal identity; mapped vs ignored vs unresolved; required `display_name`; duplicate-target; order-independent snapshot hash.

Service: Owner happy path (map two fields, ignore one, confirm); Admin + idempotent upsert/confirm; unknown column; forbidden/system target; dotted `customer.email`; duplicate target; pre-discovery `created`; incomplete confirm; cancelled session; XLSX identity; reopen after mapped; catalog excludes system fields; non-effect zeros.

SQL static: additive, no ninth table, no staging/plan/Customer writes, service_role-only, hardened `search_path`, frozen SHA-256.

---

## 39. Authorization tests

Owner allowed. Admin allowed. Staff `FORBIDDEN_ROLE`. Viewer `FORBIDDEN_ROLE`. Suspended `ORG_NOT_FOUND`. Unauthenticated `UNAUTHORIZED`. Foreign Owner `ORG_NOT_FOUND`. Foreign session `SESSION_NOT_FOUND`.

---

## 40. Tenant tests

Organization-scoped session/source lookup. Runtime isolation allowlist updated only to authorize `2026082918*` DATA migration consumers. Protected product surfaces still have zero DATA table tokens.

---

## 41. State tests

`created` mapping denied (`INVALID_STATE`). `parsed` mapping allowed. First write → `mapping_required`. Confirm → `mapped`. Confirm replay stays `mapped`. Later edit → `mapping_required` and unconfirms rows. `cancelled` mapping denied. Cancel allowlist was not broadened.

---

## 42. Targeted DATA count

| Measure | Count |
| --- | --- |
| Previous (DATA-1E / 1E-R1 / 1E-FV) | 81 |
| Tests added | 15 |
| Final | 96 |

Added files: `mapping-domain.test.ts` (6), `mapping.test.ts` (6), `data-intake-mapping-migration.test.ts` (3). Existing DATA-1D inventory and isolation tests were updated only to recognize the new additive migration filename / RPC bind / authorized consumer prefix.

---

## 43. Targeted success rate

`96 / 96 = 100%`

Command: `npx vitest run tests/features/data-intake tests/security/data-intake-*.test.ts` (DATA security set used by DATA-1E plus `data-intake-mapping-migration.test.ts`).

---

## 44. Typecheck

`npx tsc --noEmit` — PASS

---

## 45. Lint

`npx next lint` — PASS (0 warnings)

---

## 46. Build

`next build` is not a DATA-1C/1D/1E/1F closure gate (same convention as DATA-1E / DATA-1E-R1). Typecheck + lint + targeted + full Vitest were the quality gates.

---

## 47. Full suite

`npx vitest run`: **3262 passed, 2 failed, 3264 total**

Prior verification baseline: 3247 passed, 2 failed, 3249 total. Added 15 DATA-1F tests (3249 + 15 = 3264).

---

## 48. Full-suite percentage

`3262 / 3264 = 99.9387%`

Strategic objective remains 100%. Historical restoration is a separate quality phase.

---

## 49. Historical failures

Exactly the same two tracked failures:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Neither became green. Neither was modified.

`HISTORICAL FAILURES = 2`

---

## 50. New regressions

`NEW REGRESSIONS = 0`

---

## 51. Residual risks

- Mapping migration is **not** on Production until a separate DATA-1F-FV owner gate.
- `cancel_session` still rejects `mapping_required` and `mapped` even though the frozen graph lists those cancel edges. DATA-1F did not broaden cancel.
- No optimistic mapping revision token; concurrency is advisory-lock + unique constraints.
- Confirmation does not prove row values are present or valid.
- `MAPPING_ALREADY_FROZEN` is reserved; v1 uses idempotent re-confirm and explicit reopen instead of a hard freeze error.
- Headers may be sensitive; keep mapping readback Owner/Admin-only in any future UI.

---

## 52. Proposed DATA-1F-FV Production verification

Do **not** start this gate from DATA-1F close-out.

Required future owner string (do not manufacture):

`DATA-1F-FV CONTROLLED PRODUCTION SEMANTIC MAPPING = AUTHORIZED`

Recommended lifecycle on **one fresh synthetic QA fixture** (meaningless or safe illustrative headers; no Production customer data; do not reuse historical DATA-1E-FV source rows):

1. Apply only the frozen DATA-1F SQL/hash by targeted MCP `apply_migration` (not `db push`, not repair, not reset).
2. create session (`customer` / csv)
3. register source
4. upload tiny synthetic CSV
5. object verify
6. structure discover → `parsed`
7. map `display_name` (and optionally one other allowlisted field)
8. intentionally ignore one optional source column
9. confirm mapping → `mapped`
10. verify snapshot hash + `mapping_proposed` / `mapping_confirmed` audit
11. Cancel only if the session is still in a cancel-allowlisted state. After confirm the session is `mapped`; DATA-1E-R1 `cancel_session` will deny it. Prefer a sibling parsed fixture for cancel, or leave the mapped QA session as retained evidence without inventing a new cancel path.

No staging. No Customer import. Do not modify existing Production DATA fixtures.

---

## 53. DATA-1G boundary

DATA-1G is **not** started. Value validation, coercion, normalization, staging, import planning, Customer matching, and Customer mutation remain future work.

---

## 54. Final Git state

Implementation commit: `b78f01c457f74c957083620957a0f6124de4137c`. Evidence commit SHA is recorded in the closing response after this file is committed. Required: branch `core/platform-readiness-20260707`, normal push, divergence `0 0`, clean worktree. No amend of published commits. No force-push.

---

## 55. Final verdict

`DATA-1F IMPLEMENTATION COMPLETE WITH EVIDENCE — GOVERNED SEMANTIC MAPPING FOUNDATION READY FOR CONTROLLED PRODUCTION QA`

`DATA-1F TARGETED TEST SUCCESS RATE = 100%`

`DATA-1F-FV CONTROLLED PRODUCTION SEMANTIC MAPPING = OWNER AUTHORIZATION REQUIRED`
