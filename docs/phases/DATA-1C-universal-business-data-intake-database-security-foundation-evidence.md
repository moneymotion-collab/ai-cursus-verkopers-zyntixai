# DATA-1C — Universal Business Data Intake Database + Security Foundation

| Field | Value |
| --- | --- |
| Phase | **DATA-1C — UNIVERSAL BUSINESS DATA INTAKE DATABASE + SECURITY FOUNDATION** |
| Parent | DATA-1B |
| Document type | Implementation evidence (schema / RLS / Storage / server foundation) |
| Date | 2026-08-27 |
| Formal status | `DATA-1C CLOSED WITH EVIDENCE — UNIVERSAL BUSINESS DATA INTAKE DATABASE + SECURITY FOUNDATION IMPLEMENTED AND FROZEN` |
| Governing design | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `9078c9a9a6c93890227e4c6d3bbb071789ff0a7d` |
| Production apply | **NOT PERFORMED** |
| Parser / import / Customer writer | **NOT IMPLEMENTED** |

**DATA INTAKE TABLES: 8**

**DATA STORAGE BUCKET: IMPLEMENTED LOCALLY / MIGRATION FROZEN**

**CUSTOMER IMPORT: NOT IMPLEMENTED**

**PARSER: NOT IMPLEMENTED**

**IMPORT EXECUTION: NOT IMPLEMENTED**

**BQA MUTATION: 0**

**CONTEXT MUTATION: 0**

**CUSTOMER WRITER MUTATION: 0**

**PRODUCTION APPLY: NOT PERFORMED**

`DATA-1C PRODUCTION VERIFICATION = NOT YET PERFORMED`

---

## A. Starting baseline

Proven before any 1C file was added:

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `9078c9a9a6c93890227e4c6d3bbb071789ff0a7d` |
| Subject | `docs(data): freeze universal intake domain schema contract` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

Hard gate passed. Frozen DATA-1B baseline proven.

## B. DATA-1B dependency

Authoritative contract: `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md`.

Left closed: eight-table model; Customer as v1 target; Customer Activity = NULL; generic JSONB staging; immutable approved plans; `data_import_row_results` for post-TTL provenance; no job table; Owner/Admin v1; Staff/Viewer no DATA writes; `service_role` executor only; bounded raw/staging retention; no destructive canonical cascade; no mass update; no import yet.

SQL reality note (not an R1 redesign): `data_intake_sources.expires_at` is **nullable** until a later cleanup worker stamps eligibility from session terminal timestamps. DATA-1B listed it as required once eligible. Session `completed_at` / `cancelled_at` / `failed` `updated_at` remain the computation source. No synchronous delete trigger.

## C. Migration inventory

Additive only. No applied migration edited. No `db push` / repair / reset.

| File | Role |
| --- | --- |
| `supabase/migrations/20260827140000_create_data_intake_foundation.sql` | Eight tables, CHECKs, FKs, indexes, integrity/immutability triggers |
| `supabase/migrations/20260827140010_enable_data_intake_rls.sql` | RLS enablement, revoke authenticated, service_role grants, foundation RPC |
| `supabase/migrations/20260827140020_add_data_intake_storage_bucket.sql` | Private `data-intake` bucket + restrictive Storage policies |

SHA-256 (file contents, lowercase hex):

| File | SHA-256 |
| --- | --- |
| `20260827140000_create_data_intake_foundation.sql` | `ad37fdbfb24fb4c1bd8038c9aede550ed7f4b07abac0f5a1ba8cf0042d3a0276` |
| `20260827140010_enable_data_intake_rls.sql` | `85b306b85cc9c66b9d6af4eb70d0b6042e040f23215f771d5c9f07a099d91a4a` |
| `20260827140020_add_data_intake_storage_bucket.sql` | `7f8fa5e7e442647bfeff0f6d56c4bb21432b821c1a8ea636dd442ad25e5cff54` |

DATA-1C-FV must apply only these frozen hashes.

## D. Eight tables

Exact DATA-1B names. No ninth plan-row, job, mapping-template, or Customer-specific staging table.

1. `data_intake_sessions`
2. `data_intake_sources`
3. `data_intake_mappings`
4. `data_intake_staging_rows`
5. `data_import_plans`
6. `data_intake_events`
7. `data_external_record_links`
8. `data_import_row_results`

## E. Tenant composite FK pattern

Every table has `organization_id NOT NULL` and `UNIQUE (organization_id, id)`. Children use `(organization_id, session_id)` → `data_intake_sessions (organization_id, id)` **ON DELETE RESTRICT**. Sources/mappings/plans additionally bind `(organization_id, source_id)`. Cross-org parent references are structurally impossible.

## F. Session state

CHECK vocabulary matches DATA-1B. `private.data_intake_session_status_transition_allowed` encodes the frozen graph. A BEFORE trigger rejects illegal status updates, including from `service_role` raw SQL. 1C RPC only performs `created`, `created → source_ready`, and `created|source_ready → cancelled`.

## G. Source model

One active artifact per session: unique index on `session_id WHERE superseded_at IS NULL`. Deleted-but-not-superseded rows still occupy the active slot. Replacement inserts a new row and stamps `superseded_at`. Hash, path, bucket, byte_size, mime, and filename are immutable after insert.

## H. Mapping model

`(source_id, source_field_key)` unique. Frozen status / proposal_source / confidence / transform allowlists. `target_field` is semantic metadata. No `quote_ident`, no `format('%I'`, no dynamic SQL from mapping columns.

## I. Staging model

Generic JSONB `raw_values` / `normalized_values`. Lifecycle + resolution CHECKs (no `valid`/`warning` pair). Unique `(source_id, source_row_number)` and `(source_id, row_fingerprint)`. `service_role` may DELETE rows for future TTL. No CASCADE to customers.

## J. Plan model

`UNIQUE (session_id, version)`, `version >= 1`. Partial unique: one `approved` or `executing` plan per session. `included_fingerprints` is a JSONB array. `plan_hash` is 64 lowercase hex; not DB-random.

## K. Plan immutability

Trigger `private.enforce_data_import_plan_immutability`: once `status in (approved, executing, executed, superseded)` or `approved_at` is set, snapshot fields (`source_sha256`, `adapter_version`, `mapping_snapshot`, `included_fingerprints`, `plan_hash`, target/Activity/source) cannot change. Status / `superseded_at` remain mutable. No authenticated UPDATE grant.

## L. Events

Append-only. BEFORE UPDATE/DELETE raise. `service_role` INSERT+SELECT only. Frozen event_type vocabulary including `source_replaced` and `plan_superseded`. Metadata is a JSON object of ids/counts/codes/hashes — no filename, no row contents.

## M. External links

Unique `(organization_id, source_system, external_object_type, external_record_id)`. Polymorphic `target_record_id` has **no** FK to `customers`. No 1C governed link writer. Authenticated INSERT denied. Same-tenant target proof is owned by DATA-1F/1G.

## N. Row results

Unique `(plan_id, row_fingerprint)`. No `raw_values`. Optional `external_record_link_id` RESTRICT. Survives staging/source file deletion. No FK to customers.

## O. RLS

RLS enabled on all eight tables. No authenticated/anon policies. No `GRANT SELECT` to `authenticated`. Direct PostgREST access is denied even for Owner.

## P. DB privileges

| Role | DATA tables | Foundation RPC |
| --- | --- | --- |
| public / anon / authenticated | none | none |
| service_role | SELECT/INSERT/UPDATE as executor; events INSERT only; staging DELETE for future TTL | EXECUTE |

Integrity trigger functions are revoked from all roles (they still fire).

## Q. Server commands

`src/features/data-intake/` — `server-only`. Named RPC `apply_data_intake_foundation_mutation` (pre-Production constant, not `keyof Database["public"]["Functions"]`).

| Command | Operation |
| --- | --- |
| `createDataIntakeSession` | `create_session` |
| `registerDataIntakeSource` | `register_source` |
| `cancelDataIntakeSession` | `cancel_session` |

No parse / map / validate / approve / execute. No public API route. No signed upload yet.

## R. Role model

Server: `auth.getUser` → active membership → Owner/Admin. Staff/Viewer/suspended/foreign/unauthenticated denied before RPC. RPC re-checks active Owner/Admin membership as defense-in-depth.

## S. service_role separation

RPC requires `auth.role() = service_role` **and** a real actor user/member id. Staff actor + service_role → `FORBIDDEN_ROLE`. Missing actor → `UNAUTHORIZED`. `created_by_user_id` is the human Owner/Admin. service_role is never written as actor.

## T. Storage bucket

`data-intake`. `public = false`. `file_size_limit = 10485760`. MIME allowlist: `text/csv` and XLSX OOXML. Distinct from `zyntix-social-media`.

## U. Storage policies

Restrictive deny for `anon` and `authenticated` on this bucket (`bucket_id is distinct from 'data-intake'`). No product upload surface in 1C. Bucket is locked until a future signed-URL command. `service_role` is the only practical Storage actor.

## V. TTL support

`sources.expires_at` nullable eligibility stamp. Session `completed_at` / `cancelled_at` / failure `updated_at` exist. No cleanup worker. No delete-on-terminal trigger. Eligibility remains: completed +30d; cancelled +7d; failed +7d; approved/importing not eligible.

## W. Delete safety

All intake FKs **RESTRICT**. No references to `public.customers`. Staging DELETE cannot cascade-delete Customers. Session delete is not a product path.

## X. Customer non-effect

No edits to `customers`, `private.create_customer_record`, `public.create_customer`, or customer history. Isolation tests assert generated types and customer feature files do not mention DATA tables.

## Y. BQA non-effect

No BQA table/RPC/handoff changes. DATA commands do not call `apply_business_qualification_mutation`.

## Z. Tests

Targeted DATA tests: 33 passed.

Full suite:

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (0 warnings) |
| `npx vitest run` | 3199 passed, 2 failed, 3201 total |

Historical failures only (unchanged):

- `tests/features/invitations/load-member-administration-page.test.ts`
- `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures. Added 33 tests (3166+33=3199).

## AA. Production untouched

No Production apply. No Production Storage bucket creation. No live harness. `src/types/database.generated.ts` not regenerated and not hand-edited. Typegen belongs to DATA-1C-FV.

## AB. Migration hashes

See section C. Frozen for DATA-1C-FV targeted apply.

## AC. Git state

Recorded after implementation commit/push in the closing response.

---

## Consistency: Storage object vs DB row

DATA-1C does **not** treat Storage upload and the source row as one transaction. 1C has no upload surface. Future DATA-1D pattern:

1. create session (`created`)
2. register source metadata with server-generated path (this already transitions to `source_ready` in 1C)
3. signed upload to that exact path
4. verify object size/hash against the row
5. parse

Until signed upload exists, the bucket stays locked. Hash accepted by `register_source` is an internal server-layer input, not browser-validated truth.

---

## Pre-commit review

| Check | Result |
| --- | --- |
| Applied migrations edited | no |
| Ninth table / job table | no |
| Customer writer change | no |
| Parser dependency | no |
| Import executor | no |
| Onboarding / connector | no |
| Authenticated DML | denied |
| Generic service_role-as-authority | no (actor required) |
| Public Storage | no |
| Raw PII events | no |
| Weak cross-tenant FK | no |
| Canonical cascade | no |
| Production execution | no |
