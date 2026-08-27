# DATA-1B — Universal Business Data Intake Domain + Schema Contract

| Field | Value |
| --- | --- |
| Phase | **DATA-1B — UNIVERSAL BUSINESS DATA INTAKE DOMAIN + SCHEMA CONTRACT FREEZE** |
| Parent | DATA-1A |
| Document type | Domain + schema contract (documentation only) |
| Date | 2026-08-27 |
| Formal status | `DATA-1B CLOSED — UNIVERSAL BUSINESS DATA INTAKE DOMAIN + SCHEMA CONTRACT FROZEN` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `1a6aa6d8382bb5a315eb801246a50838f1fe3d04` |
| SQL / migration / Storage / parser / import / Production | **none** |

This document is the implementation-ready contract for DATA-1C+. DATA-1A architectural decisions remain binding. No schema is created in this phase.

**SOURCE DATA IS NOT CANONICAL ZYNTIXAI DATA**

**APPROVED PLANS ARE IMMUTABLE**

**service_role IS EXECUTOR, NEVER APPROVER**

---

## 0. Baseline

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `1a6aa6d8382bb5a315eb801246a50838f1fe3d04` |
| DATA-1A | CLOSED — architecture ready for contract freeze |
| BQA-1 backend | PRODUCTION VERIFIED |
| Divergence at start | `0 0` |
| Worktree at start | clean |

---

## 1. Contract scope

v1 executable adapter: **Customers only**. Schema is future-compatible with other `target_domain` values. Unknown `target_domain` **fail closed**.

Not in this contract’s executable surface: leads, tasks, programs, enrollments, connectors, Party, mapping-template product, Staff prepare, mass UPDATE, universal undo, onboarding.

---

## 2. Domain object set (frozen)

**Eight tables.** DATA-1A proposed seven. An eighth is required so raw/staging TTL can delete PII without erasing “which plan created/linked this Customer”.

| Table | Role | v1 required |
| --- | --- | --- |
| `data_intake_sessions` | Aggregate root + execution lease | yes |
| `data_intake_sources` | One artifact version | yes |
| `data_intake_mappings` | Per-field maps | yes |
| `data_intake_staging_rows` | Ephemeral parse/validate PII | yes |
| `data_import_plans` | Immutable execution contract | yes |
| `data_import_row_results` | Durable per-row outcome, **no PII** | **yes (justified)** |
| `data_intake_events` | Append-only audit | yes |
| `data_external_record_links` | Optional source-system identity | yes (may be empty for CSV) |

**Not v1 tables:** job table, per-target staging, mapping templates.

**Eighth-table justification:** plan JSONB freezes *inclusion fingerprints* (≤10k). After staging deletion, fingerprints + `target_record_id` + operation must live somewhere without emails/names. Events are session-level (no per-row spam). External links exist only when a source system id exists. Therefore `data_import_row_results` is the durable provenance row.

**Tenant pattern (frozen):** every table stores `organization_id` NOT NULL. Child rows use composite FK `(organization_id, session_id)` → `data_intake_sessions (organization_id, id)`. Session has `UNIQUE (organization_id, id)`. Child `organization_id` must equal the session’s; never a second unsynchronized tenant identity.

---

## 3. Session aggregate (`data_intake_sessions`)

| Column | Null | Notes |
| --- | --- | --- |
| `id` | no | uuid PK |
| `organization_id` | no | FK organizations RESTRICT |
| `business_activity_id` | yes | FK activities RESTRICT; see §6 |
| `target_domain` | no | CHECK; v1 executable = `customer` |
| `source_kind` | no | `csv` \| `xlsx` |
| `status` | no | §8 |
| `locale` | yes | BCP 47 suggestion |
| `timezone` | yes | IANA suggestion |
| `currency` | yes | ISO 4217 suggestion |
| `date_order` | yes | `dmy` \| `mdy` \| `ymd` once confirmed |
| `created_by_user_id` | no | auth user |
| `approved_by_user_id` | yes | auth user; never service_role |
| `approved_at` | yes | |
| `current_plan_id` | yes | FK plans; active approved/executing plan |
| `failure_code` | yes | stable code |
| `cancel_requested` | no | default false |
| `execution_lease_token` | yes | uuid |
| `execution_lease_expires_at` | yes | |
| `execution_attempt` | no | int ≥ 0 default 0 |
| `current_batch_index` | no | int ≥ 0 default 0 |
| `last_completed_batch_index` | yes | |
| `heartbeat_at` | yes | |
| `execution_started_at` | yes | |
| `completed_at` | yes | |
| `cancelled_at` | yes | |
| `created_at` / `updated_at` | no | |
| `archived_at` | — | **not in v1** |

No redundant status booleans besides `cancel_requested` (in-flight stop signal, not a status).

---

## 4. Organization scope

Exactly one Organization per session. No global or cross-org intake. All children inherit tenant truth through composite FKs plus stored `organization_id`.

---

## 5. Business Activity scope

Customers v1 are **Organization-scoped**. `customers` has no `business_activity_id`.

**Frozen:** for `target_domain = 'customer'`, `business_activity_id` **MUST be NULL**. Supplying an Activity is **forbidden** (`ACTIVITY_NOT_ALLOWED_FOR_TARGET`). It is not stored as “contextual metadata”. Mapping may still *read* EffectiveContext for terminology suggestions without binding the session to an Activity. **No** primary / first / latest Activity fallback — there is no Activity on the session at all.

Future Activity-scoped adapters set `business_activity_id` NOT NULL under their own CHECK. Unknown Activity or cross-org Activity: fail closed.

---

## 6. Target domain

Closed string, **not** a SQL table name.

v1 executable: `customer`.

Forward-compatible values (not executable until their adapter exists): `lead`, `task`, `program`, `enrollment`. Unknown → `TARGET_NOT_SUPPORTED`.

Adapter version stored on the plan: `customer.v1` (code-owned).

---

## 7. Session status machine (frozen)

States: `created` · `source_ready` · `parsed` · `mapping_required` · `mapped` · `validating` · `review_required` · `ready_for_approval` · `approved` · `importing` · `completed` · `completed_with_errors` · `failed` · `cancelled`

**Allowed transitions**

| From | To | Trigger |
| --- | --- | --- |
| created | source_ready | source artifact registered |
| created | cancelled | cancel before source |
| source_ready | parsed | parse succeeded |
| source_ready | failed | parse non-retryable |
| source_ready | cancelled | |
| parsed | mapping_required | always after first successful parse |
| mapping_required | mapped | all **required** adapter fields confirmed; others unmapped/rejected/ignored |
| mapping_required | cancelled | |
| mapped | validating | start validation |
| mapped | mapping_required | mapping edit |
| mapped | cancelled | |
| validating | review_required | blocking rows or unresolved resolutions |
| validating | ready_for_approval | no blocking rows; required maps confirmed |
| validating | failed | infrastructure failure |
| validating | cancelled | |
| review_required | validating | row resolutions changed |
| review_required | mapped | mapping changed (invalidates prior validation) |
| review_required | cancelled | |
| ready_for_approval | approved | Owner/Admin approve current plan |
| ready_for_approval | review_required | user returns to review |
| ready_for_approval | mapped | mapping/source change (supersede plan) |
| ready_for_approval | cancelled | |
| approved | importing | execution start |
| approved | mapped | any plan-invalidating edit (supersede; **new plan + new approval**) |
| approved | cancelled | before first batch |
| importing | completed | all included rows imported or skipped as planned, zero execution failures |
| importing | completed_with_errors | some included rows `failed` after retries exhausted |
| importing | failed | batch infrastructure failure; cursor preserved |
| importing | cancelled | after current batch if `cancel_requested` |
| failed | importing | retry **same** approved plan if hash still valid |
| failed | mapped | source/mapping change |
| failed | cancelled | |

**Terminal:** `completed`, `completed_with_errors`, `cancelled`.  
**`failed` is not terminal** for the same immutable plan.  
**`cancelled` is terminal.** A new intake requires a new session.  
No free-form status writes. Authenticated DML denied.

---

## 8. Revision / return-to-review

Approved plan is **immutable**. Change of source, mapping, defaults, included rows, transforms, or (future) Activity:

1. set `plans.superseded_at`
2. clear `sessions.current_plan_id` and approval columns
3. status → `mapped` or `review_required`
4. new plan `version + 1`
5. new Owner/Admin approval

Never UPDATE an approved plan’s snapshot/hash.

---

## 9. Source artifact (`data_intake_sources`)

| Column | Null | Notes |
| --- | --- | --- |
| `id` | no | |
| `organization_id` | no | |
| `session_id` | no | |
| `source_kind` | no | must match session |
| `storage_bucket` | no | private DATA bucket name |
| `storage_path` | no | generated; not user filename |
| `original_filename` | no | metadata only |
| `mime_type` | no | |
| `byte_size` | no | |
| `sha256` | no | hex lowercase |
| `encoding` | yes | `utf-8` after parse |
| `delimiter` | yes | csv |
| `sheet_name` | yes | xlsx |
| `header_row_index` | yes | 1-based |
| `row_count` | yes | data rows excluding header |
| `column_count` | yes | |
| `parse_metadata` | no | jsonb bounded, default `{}` |
| `superseded_at` | yes | |
| `created_at` | no | |
| `expires_at` | no | cleanup eligibility |
| `deleted_at` | yes | object removed |

**v1 cardinality:** at most **one active** source per session (`superseded_at IS NULL`). Replacement = new row; never overwrite `sha256`/path.

`.xls` unsupported. Password-protected / macros / external links / merged-cell workbooks: reject at parse (`UNSUPPORTED_FILE` / `SOURCE_INVALID`).

---

## 10. Storage path

Logical pattern:

`{organization_id}/{session_id}/{source_id}/{generated_object_id}`

`generated_object_id` is a server uuid + safe extension (`.csv` / `.xlsx`). User filename is **never** path authority.

Bucket: **new private bucket**, not `zyntix-social-media`. No public URL. Signed GET/PUT only after server auth. Short-lived signed URLs (≤ 15 minutes v1 policy).

---

## 11. Raw retention (cleanup eligibility)

TTL is **eligibility**, not a synchronous hard delete. A later worker/cron performs cleanup. Not a legal policy.

| Session class | Source object + full staging PII eligible |
| --- | --- |
| `completed` / `completed_with_errors` | `completed_at + 30 days` |
| `cancelled` | `cancelled_at + 7 days` |
| `failed` | `updated_at` of the failure + **7 days** |
| `approved` / `importing` | **not eligible** while execution can still run |
| any non-terminal except `failed` | not eligible |

`failed` remains retryable on the **same** approved plan until the source is deleted. After cleanup eligibility is applied, retry is `PLAN_STALE` (`SOURCE_MISSING`); a new session is required.

`expires_at` on the source is set when the session becomes eligible. Plans, events, row_results, external links **outlive** raw artifacts.

---

## 12. Staging retention

While eligible for cleanup, worker:

1. deletes Storage object; sets `sources.deleted_at`
2. **DELETE** `data_intake_staging_rows` for the session (full `raw_values` / `normalized_values` gone)

Audit continues via plans + row_results + events + external links. Staging is not a PII warehouse.

---

## 13. Staging row (`data_intake_staging_rows`)

| Column | Null | Notes |
| --- | --- | --- |
| `id` | no | |
| `organization_id` | no | |
| `session_id` | no | |
| `source_id` | no | |
| `source_row_number` | no | §14 |
| `raw_values` | no | jsonb object, keys = `source_field_key` |
| `normalized_values` | yes | jsonb; **persisted** at validation; execution must not re-parse source |
| `row_fingerprint` | no | §15 |
| `lifecycle` | no | §16 |
| `resolution` | no | §16 |
| `error_codes` | no | jsonb array default `[]` |
| `warning_codes` | no | jsonb array default `[]` |
| `error_details` | no | jsonb array of `{code, field, message}` bounded; no PII dump |
| `target_operation` | yes | `create` \| `link` \| `skip` once ready |
| `target_record_id` | yes | proposed link target |
| `created_at` / `updated_at` | no | |

Unique `(source_id, source_row_number)` and unique `(plan-independent) (source_id, row_fingerprint)`.

---

## 14. Source row number

`source_row_number` is the **1-based human-visible row index** in the original CSV/sheet, **including** the header row. If `header_row_index = 1`, first data row is `2`. Errors cite this number. No separate zero-based public index.

---

## 15. Row fingerprint

Deterministic SHA-256 hex of UTF-8:

```text
{source.sha256}\n{sheet_name or empty}\n{source_row_number}\n{canonical_json(raw_values)}
```

`canonical_json`: UTF-8 JSON object, keys sorted lexicographically, no insignificant whitespace, string values as stored after parse (not post-transform). Does **not** include UUID, insert order, or timestamps.

Same frozen source/row → same fingerprint. Fingerprint is plan/idempotency identity, **not** a business key.

---

## 16. Row state (frozen)

**Lifecycle** (mutually exclusive): `pending` · `validated` · `blocked` · `ready` · `imported` · `failed` · `ignored`

**Resolution** (mutually exclusive): `none` · `create` · `link` · `skip` · `duplicate` · `conflict`

Warnings live in `warning_codes` so a row can be `validated` **and** have warnings. Do not use parallel lifecycle values `valid` and `warning`.

| Lifecycle | Meaning |
| --- | --- |
| pending | parsed, not validated |
| validated | parse+field OK; may have warnings |
| blocked | invalid, unresolved duplicate/conflict, or required missing |
| ready | included in the current draft plan (`create`/`link`/`skip` chosen) |
| imported | canonical effect committed for this plan+fingerprint |
| failed | execution failed this row |
| ignored | excluded from plan |

---

## 17. Error storage

No per-error table. JSONB arrays of stable codes + optional `{code, field, message}` where `message` is a bounded safe template (no cell contents, no Postgres text). Scale: 10k × 50 is acceptable.

---

## 18. Mapping (`data_intake_mappings`)

| Column | Null | Notes |
| --- | --- | --- |
| `id` | no | |
| `organization_id` | no | |
| `session_id` | no | |
| `source_id` | no | |
| `source_field_key` | no | stable key |
| `source_header` | no | original header text |
| `target_domain` | no | must match session |
| `target_field` | yes | null if unmapped/rejected |
| `status` | no | §21 |
| `proposal_source` | no | §20 |
| `confidence` | yes | §22 |
| `transform_kind` | no | default `identity` |
| `transform_config` | no | jsonb `{}`; validated per kind |
| `default_value` | yes | jsonb; only if human-set |
| `confirmed_by_user_id` | yes | |
| `confirmed_at` | yes | |
| `created_at` / `updated_at` | no | |

Unique active mapping: `(source_id, source_field_key)`.

v1: **one source field → at most one target field**. No silent fan-out. Concat of multiple sources is **not** in Customer adapter v1 (schema may allow `concat`/`split` kinds for later adapters; Customer registry rejects them).

---

## 19. Target field registry

**Code-owned adapter registry**, not a CMS table. Caller cannot supply SQL column names.

Customer `customer.v1` fields:

| Semantic key | DB column | Required | Nullable | Max | Normalize | Duplicate |
| --- | --- | --- | --- | --- | --- | --- |
| `display_name` | `display_name` | **yes** | no | 200 | `btrim`; empty illegal | none (not a unique key) |
| `email` | `email` | no | yes | 200 | `lower(btrim)`; empty → null | exact org unique when not null |
| `phone` | `phone` | no | yes | 50 | `btrim`; empty → null | none |
| `first_name` | `first_name` | no | yes | 200 | `btrim`; empty → null | none |
| `last_name` | `last_name` | no | yes | 200 | `btrim`; empty → null | none |

**Not importable v1:** `status` (writer always `onboarding`), `owner_member_id`, `metadata`, `started_at`, `ended_at`, `archived_at`, `created_by_member_id` (executor membership).

Unknown `target_field` → `MAPPING_AMBIGUOUS` / target injection denial.

---

## 20. Proposal source

`deterministic` · `context` · `ai` · `user` · `template`

None of these confirms a mapping. `ai` and `template` are forward-compatible.

---

## 21. Mapping status

`proposed` · `confirmed` · `rejected` · `unmapped` · `needs_review`

Owner/Admin only. **Forbidden:** `proposed` → `confirmed` solely from confidence.

Required adapter fields must be `confirmed` before `mapped`. Other columns may stay `unmapped` / `rejected`.

---

## 22. Confidence

Persist **`high` \| `medium` \| `low` \| `none`**, not a float. Not approval authority. Aligns with BQA bands as *labels only*, not shared calibration.

---

## 23. Transforms

Schema CHECK allowlist: `identity` · `trim` · `lowercase` · `uppercase` · `date_parse` · `number_parse` · `currency_parse` · `boolean_map` · `enum_map` · `email_normalize` · `phone_normalize` · `concat` · `split`

**Customer.v1 allowlist:** `identity`, `trim`, `lowercase`, `uppercase`, `email_normalize`, `phone_normalize`.

No JavaScript, SQL, unbounded regex, eval, or user scripts. `transform_config` validated per kind (empty object for identity/trim/case/email/phone).

---

## 24. Locale

Session `locale` / `timezone` / `currency` / `date_order` are suggestions until `date_order` is **confirmed** when any date transform is used. Customer.v1 has **no date fields**, so ambiguous dates do not arise in the first adapter. Rule still frozen for later adapters: no hidden server locale fallback.

---

## 25. Import plan (`data_import_plans`)

| Column | Null | Notes |
| --- | --- | --- |
| `id` | no | |
| `organization_id` | no | |
| `session_id` | no | |
| `version` | no | int ≥ 1 |
| `source_id` | no | |
| `source_sha256` | no | copy of source hash |
| `target_domain` | no | |
| `adapter_version` | no | `customer.v1` |
| `business_activity_id` | yes | must be null for customer |
| `mapping_snapshot` | no | jsonb confirmed maps+transforms |
| `included_fingerprints` | no | jsonb array of fingerprint strings |
| `summary` | no | jsonb counts |
| `plan_hash` | no | §27 |
| `status` | no | `draft` \| `approved` \| `superseded` \| `executing` \| `executed` |
| `created_by_user_id` | no | |
| `approved_by_user_id` | yes | |
| `created_at` | no | |
| `approved_at` | yes | |
| `superseded_at` | yes | |

Unique `(session_id, version)`. At most one plan per session with `status in ('approved','executing')`.

Execution reads **this snapshot**, never live mapping rows.

---

## 26. Plan version

Starts at 1 per session. Invalidating edits create `version + 1`. Only one approved/executing plan per session (partial unique index).

---

## 27. Plan hash

SHA-256 of canonical JSON of:

- `source_sha256`
- `target_domain`
- `adapter_version`
- `business_activity_id` (null)
- `mapping_snapshot` (canonical)
- `included_fingerprints` sorted
- transform/default subset already inside mapping_snapshot

**Exclude** timestamps and user ids so semantically identical plans hash identically. Purpose: tamper / `PLAN_STALE`.

---

## 28. Adapter version

Code-owned `customer.v1` stored on the plan. Execution **rejects** any other/unsupported version rather than reinterpret (`PLAN_STALE` / adapter mismatch).

---

## 29. Included rows

**Option A frozen:** `included_fingerprints` jsonb array on the plan (≤ 10,000). No ninth join table.

At execute time each fingerprint is processed in deterministic `source_row_number` order (join staging while it exists; after that, results table + fingerprint).

---

## 30. Approval

Owner and Admin only. Staff/Viewer: no.

Requires: `auth.getUser` (real user), active membership, same org, plan `draft` in `ready_for_approval`, `plan_hash` matches recomputation, no `blocked` included rows, required mappings confirmed, session not cancelled, org active.

`approved_by_user_id` is that user. **service_role must never be written as approver.**

---

## 31. Execution authority

Start only from `approved` plan.

Order: `auth.getUser` → active membership → Owner/Admin → session → exact plan → recompute `plan_hash` + source sha256 → privileged executor.

---

## 32. Direct RPC security

Future execute RPC: PUBLIC / anon / authenticated **no EXECUTE**; service_role **yes**. RPC still validates org/session/plan/hash/role internally. No authenticated bulk INSERT grants on DATA or `customers`.

---

## 33. Execution lease (on session)

`execution_lease_token`, `execution_lease_expires_at`, `execution_attempt`, `current_batch_index`, `last_completed_batch_index`, `heartbeat_at`. Worker-agnostic. Concurrent second executor must not steal a valid lease.

---

## 34. Small / medium policy

**Code constants, not DB CHECKs** (tunable later):

| Name | v1 value |
| --- | --- |
| `DATA_MAX_FILE_BYTES` | 10 × 1024 × 1024 |
| `DATA_MAX_DATA_ROWS` | 10_000 |
| `DATA_MAX_COLUMNS` | 50 |
| `DATA_SYNC_MAX_ROWS` | 500 |
| `DATA_SYNC_MAX_BYTES` | 2 × 1024 × 1024 |
| `DATA_BATCH_SIZE` | 100 |

Schema always supports batches.

---

## 35. Batch model

Deterministic order: `source_row_number` ascending. Batch size 100. Per-batch SQL transaction. After batch N commits, `last_completed_batch_index = N`. Retry must not re-create batches 1–N (plan_id + fingerprint idempotency + unique results).

---

## 36. Idempotency (two layers)

**A. Plan-row:** unique `(plan_id, row_fingerprint)` on `data_import_row_results`. Retry that already `created`/`linked`/`skipped` is success (no second canonical write).

**B. Business identity:** Customer email unique index; optional external link unique. Duplicate detection ≠ import idempotency.

---

## 37. External record links

| Column | Null |
| --- | --- |
| `id` | no |
| `organization_id` | no |
| `source_system` | no |
| `external_object_type` | no |
| `external_record_id` | no |
| `target_domain` | no |
| `target_record_id` | no |
| `first_seen_session_id` | no |
| `last_seen_session_id` | no |
| `first_seen_plan_id` | yes |
| `created_at` / `updated_at` | no |

Unique `(organization_id, source_system, external_object_type, external_record_id)` → at most one canonical target. CSV without stable external id: unused.

FK `target_record_id` is **not** a typed Customer FK in v1 (domain-polymorphic uuid + `target_domain`). Integrity for `customer` is enforced by the adapter (row exists in org). Avoid Customer-specific columns so Party can reuse the table.

---

## 38. Durable provenance (KEY)

After staging/source PII deletion, the system must still answer: which session, plan, source hash, approver created or linked this Customer.

**Mechanism:**

1. `data_import_plans` (hash, source_sha256, adapter, approver)
2. `data_import_row_results` (`plan_id`, `row_fingerprint`, `source_row_number`, `operation`, `target_record_id`, `outcome`) — **no raw values**
3. `data_intake_events` (`plan_approved`, `import_completed`, …)
4. `data_external_record_links` when applicable

No `created_source` on `customers`. History row uses `source = import` inside the canonical writer (§46).

---

## 39. `data_import_row_results`

| Column | Null |
| --- | --- |
| `id` | no |
| `organization_id` | no |
| `session_id` | no |
| `plan_id` | no |
| `row_fingerprint` | no |
| `source_row_number` | no |
| `operation` | no | `create` \| `link` \| `skip` |
| `outcome` | no | `imported` \| `failed` \| `skipped` |
| `target_domain` | no |
| `target_record_id` | yes |
| `error_code` | yes |
| `created_at` | no |

Unique `(plan_id, row_fingerprint)`. Append/upsert by executor only. No PII columns.

---

## 40. Events (`data_intake_events`)

Append-only. No UPDATE/DELETE normal path.

Columns: `id`, `organization_id`, `session_id`, `event_type`, `actor_user_id` nullable, `plan_id` nullable, `metadata` jsonb bounded (hashes, counts, codes — **no row contents**), `created_at`.

Owner/Admin SELECT via governed server. Authenticated INSERT denied.

**Vocabulary:** `intake_created` · `source_uploaded` · `source_replaced` · `source_parsed` · `mapping_proposed` · `mapping_confirmed` · `validation_completed` · `plan_created` · `plan_approved` · `plan_superseded` · `import_started` · `import_batch_completed` · `import_completed` · `import_failed` · `import_cancelled`

---

## 41. Cancellation

Before `importing`: status `cancelled` immediately.  
During `importing`: set `cancel_requested`; finish current batch transaction; then `cancelled`.  
Committed batches remain canonical. **No DELETE of customers.**  
`cancelled` is terminal.

---

## 42. Failure / retry

`failed` preserves `last_completed_batch_index`. Retry: `failed` → `importing` on the **same** approved plan if hash/source still valid and not cancelled. Mapping/source change → supersede plan, not in-place retry. Non-retryable row conflicts stay row `failed` / session may `completed_with_errors`.

---

## 43. Customer adapter (actual schema)

Inspected: `public.customers`, `private.create_customer_record`, `private.normalize_customer_email`, `createCustomerInputSchema`, unique index `customers_org_email_unique_idx`.

Required canonical field: **`display_name` only** (trim, min 1, max 200). Email is **not** required.

Writer sets `status = 'onboarding'`, `started_at = now()`, `archived_at` null. `created_by_member_id` = executor’s membership.

---

## 44. Customer duplicates

Exact duplicate: existing row in **same org** with `lower(btrim(email))` equal and email not null (index includes archived). → resolution `duplicate`, proposed operation `link` (human still confirms in plan). Intra-file same normalized email: `conflict` (cannot create two; first create, later rows link or skip).

No email: **no exact duplicate key**. Same `display_name` is **warning only** (`probable`); never auto-merge, never auto-link.

`conflict`: email matches more than one target (should be impossible under unique index) or intra-file + existing mismatch policy.

---

## 45. Create / link / skip

| Operation | When |
| --- | --- |
| `create` | no exact email match; `display_name` present |
| `link` | exact email match to one existing customer; human confirmed in plan |
| `skip` | human excluded row |

**No update.** Ambiguous name-only: cannot `link` without explicit human target id (v1: leave `blocked` / skip). Deterministic email match may be **auto-proposed**; execution still only runs included fingerprints on the approved plan.

---

## 46. Customer writer strategy (DATA-1G, not now)

Reuse `private.create_customer_record`. **Additive extension required:** today `p_source not in ('manual', 'lead_conversion')` raises, while `customer_status_history_source_check` already allows `'import'`. DATA-1G must allow `p_source = 'import'` on the **private** helper only. `public.create_customer` remains `'manual'`. DATA must not raw-INSERT `customers`. Unique violation → map to duplicate/idempotent path, not a leaked DB error.

---

## 47. Customer history source

**Yes.** History CHECK includes `import`. Import creates must write `source = 'import'` via the private helper. Do not claim this works until DATA-1G extends the helper allowlist.

---

## 48. Future domains

Programs/enrollments/leads/tasks: not executable. Note: `public.create_enrollment` rejects non-`manual` source. Do not change that in DATA-1C–1F.

---

## 49. Party compatibility

`target_domain` + polymorphic `target_record_id` on results/links. Do not add Customer-only provenance columns. Do not redesign Customer into Party now.

---

## 50. RLS intent (not applied yet)

| Object | authenticated | Owner/Admin (via server) | service_role |
| --- | --- | --- | --- |
| All DATA tables | **no INSERT/UPDATE/DELETE** | read via RPC/server | parse/execute |
| Sessions/plans/events/results | no broad SELECT required | SELECT | SELECT/INSERT as needed |
| Sources/staging | **no SELECT** (PII) | read via governed server only | yes |
| Storage | deny direct | signed URL after authz | upload/delete |

Staff/Viewer: **no** DATA-1 v1 PII read or write.

---

## 51. CSV / XLSX / limits

CSV: UTF-8 (BOM OK); delimiter detect `,` / `;` / tab on first lines; quoted fields; embedded newlines if parser-safe; formula-like cells **text**; never execute.  
XLSX: cached/scalar only; no macros/links/formulas; password-protected reject; `.xls` unsupported.  
Limits: §34 constants.

---

## 52. Plan staleness

Reject execute when source hash, mapping snapshot/hash, adapter version, session cancelled, plan superseded, approval missing, or org inactive. Customer v1: no Activity staleness. Error `PLAN_STALE` with metadata reason code.

---

## 53. Entitlement / BQA / multi-Activity

Import does not grant entitlement. No BQA/ORG-CONTEXT DML. Customer v1: no Activity on session.

---

## 54. Cross-tenant defense

Composite FKs `(organization_id, session_id)` on all children. Source/mapping/plan/staging/results/events must reference the same org. RPC checks session.organization_id = caller org. External link cannot point at another org’s id (adapter verifies customer.organization_id). Storage path prefixed by org id; server ignores client-supplied paths.

---

## 55. Constraint matrix (no SQL)

### `data_intake_sessions`

| Kind | Definition |
| --- | --- |
| PK | `id` |
| UNIQUE | `(organization_id, id)` |
| FK | `organization_id` → organizations **RESTRICT** |
| FK | `(organization_id, business_activity_id)` → activities **RESTRICT** (nullable) |
| FK | `current_plan_id` → plans **RESTRICT** |
| CHECK | `target_domain` known closed set |
| CHECK | `source_kind in ('csv','xlsx')` |
| CHECK | status enum |
| CHECK | `target_domain = 'customer' ⇒ business_activity_id IS NULL` |
| NOT NULL | id, org, target_domain, source_kind, status, created_by, timestamps, cancel_requested, execution_attempt, current_batch_index |
| Indexes | `(organization_id, created_at desc)`, `(organization_id, status)` |
| RLS | authenticated no write; Owner/Admin read via server |
| Mutable | status, lease, plan pointer, approval, timestamps, failure_code, locale fields |
| Append-only | created_by, organization_id, target_domain (immutable after created) |

### `data_intake_sources`

| Kind | Definition |
| --- | --- |
| PK | `id` |
| UNIQUE | `(organization_id, id)` |
| UNIQUE partial | one `(session_id)` where `superseded_at IS NULL` |
| FK | `(organization_id, session_id)` → sessions **RESTRICT** |
| CHECK | source_kind, sha256 format, byte_size > 0 AND ≤ policy max (optional CHECK vs code) |
| Indexes | `(session_id)`, `(expires_at)` where deleted_at is null |
| Retention | `expires_at`, `deleted_at` |
| Mutable | parse stats, superseded_at, deleted_at, expires_at |
| Immutable | sha256, storage_path, byte_size after insert |

### `data_intake_mappings`

| Kind | Definition |
| --- | --- |
| PK | `id` |
| UNIQUE | `(source_id, source_field_key)` |
| FK | `(organization_id, session_id)` → sessions **RESTRICT** |
| FK | `(organization_id, source_id)` → sources **RESTRICT** |
| CHECK | mapping status, proposal_source, transform_kind, confidence |
| Mutable | status, target_field, transform, confirmation |

### `data_intake_staging_rows`

| Kind | Definition |
| --- | --- |
| PK | `id` |
| UNIQUE | `(source_id, source_row_number)` |
| UNIQUE | `(source_id, row_fingerprint)` |
| FK | session/source composite **RESTRICT** |
| CHECK | lifecycle, resolution, source_row_number ≥ 1 |
| Physical DELETE | allowed after TTL |
| PII | raw_values, normalized_values |

### `data_import_plans`

| Kind | Definition |
| --- | --- |
| PK | `id` |
| UNIQUE | `(session_id, version)` |
| UNIQUE | `(organization_id, id)` |
| UNIQUE partial | one `(session_id)` where status in `(approved, executing)` |
| FK | session/source **RESTRICT** |
| CHECK | version ≥ 1, status, adapter_version non-empty |
| Immutable after approved | snapshot, hash, fingerprints, source_sha256 |
| Mutable | status, superseded_at, approved_* |

### `data_import_row_results`

| Kind | Definition |
| --- | --- |
| PK | `id` |
| UNIQUE | `(plan_id, row_fingerprint)` |
| FK | `(organization_id, session_id)` **RESTRICT** |
| FK | `(organization_id, plan_id)` **RESTRICT** |
| CHECK | operation, outcome |
| No PII | |
| Mutable | outcome/error on retry upsert of same unique key only |

### `data_intake_events`

| Kind | Definition |
| --- | --- |
| PK | `id` |
| FK | session **RESTRICT**; plan **RESTRICT** nullable |
| CHECK | event_type vocabulary |
| Append-only | all columns |
| No UPDATE/DELETE | except break-glass |

### `data_external_record_links`

| Kind | Definition |
| --- | --- |
| PK | `id` |
| UNIQUE | `(organization_id, source_system, external_object_type, external_record_id)` |
| FK | sessions **RESTRICT** for first/last seen |
| CHECK | target_domain |
| Mutable | last_seen_*, updated_at |

**Canonical `customers`:** no new columns. No FK from intake that `ON DELETE CASCADE`s customers.

---

## 56. Delete / FK behavior (frozen)

| Relation | ON DELETE |
| --- | --- |
| session → organization | **RESTRICT** |
| session → activity | **RESTRICT** |
| source/mapping/staging/plan/event/result → session | **RESTRICT** (worker deletes children explicitly) |
| plan → source | **RESTRICT** |
| row_results → plan | **RESTRICT** |
| row_results.target_record_id | **no FK** (polymorphic) |
| customers → organization | existing **CASCADE** (unchanged; org deletion is not a DATA cleanup path) |
| customer_status_history → customer | existing **CASCADE** (unchanged) |

Intake cleanup **never** deletes `customers`. Session delete in v1 is **not** a product path.

---

## 57. Observability

Allowed metric labels: `target_domain`, `source_kind`, `status`, `error_code`, row-count bucket, duration, batch count.  
Forbidden: email, name, phone, row contents, raw filename.

---

## 58. Threat matrix (HIGH)

| Threat | DB | Server | Storage | Test | Phase |
| --- | --- | --- | --- | --- | --- |
| Cross-tenant artifact | composite FK + RLS | path ignore client | private + prefix | isolation | 1C |
| Forged org | NOT NULL org + FK | membership | | isolation | 1C/1F |
| Forged Activity | CHECK null for customer | reject | | | 1C |
| Unauthorized approval | no authenticated UPDATE | Owner/Admin + getUser | | role denial | 1F |
| service_role as approver | CHECK approver not null user | never stamp service | | | 1F |
| Plan tamper | immutable snapshot + hash | recompute | | tamper | 1F |
| Mapping injection | no SQL names; registry | allowlist | | allowlist | 1D/1G |
| Formula / workbook | | reject macros/links; text formulas | MIME | parser | 1D |
| Oversize | optional CHECK | 10MB/10k/50 | size before accept | | 1C/1D |
| External-id collision | UNIQUE links | | | | 1G |
| Duplicate execution | unique (plan, fingerprint) | lease | | retry | 1F |
| PII logs | | codes/hashes only | short signed URL | | all |

---

## 59. Phase ownership

| Phase | Owns |
| --- | --- |
| **DATA-1C** | Eight tables, CHECKs, RLS, events, **Storage bucket + policies**, create-session + register-source-metadata commands (no parse) |
| **DATA-1D** | Parse, schema discovery, mapping persistence, proposals |
| **DATA-1E** | Normalize, validate, duplicates, preview |
| **DATA-1F** | Plan freeze, approval, lease, batches, idempotency, execute RPC ACL |
| **DATA-1G** | Customer adapter + `private.create_customer_record` allow `import` |
| **DATA-1-FV** | Controlled Production E2E |

Storage bucket belongs in **1C** (sources.storage_path is core metadata). Parser packages belong in **1D**.

---

## 60. DATA-1C scope (do not implement now)

- Create the eight tables and constraints in this contract  
- RLS + grants as specified  
- Private Storage bucket (not Social) + deny public  
- Event append helper  
- Server-only: create session (`target_domain=customer`), attach source metadata after authorized upload  
- **No** parser, mapping UI, import, Customer writer change, Production apply in 1B  

---

## 61. Future tests (mandatory)

Tenant isolation · role denial Staff/Viewer · state transitions · plan immutability · cross-org FK rejection · source hash · fingerprint determinism · mapping allowlist · Owner/Admin approval · service_role ≠ approver · duplicate execution · plan tamper · TTL cleanup does not delete customers · events append-only · customer CHECK activity null · import history source after 1G.

---

## 62. Open decisions (classified)

| Item | Class | Freeze |
| --- | --- | --- |
| TTL 30 / 7 days | **FROZEN NOW** | eligibility timestamps |
| Staff prepare | **DEFERRED PRODUCT POLICY** | v1 deny |
| 500-row / 2 MB sync | **FROZEN NOW** | code constants, not CHECK |
| Programs adapter | **DEFERRED** | not v1 executable |
| Worker vendor | **DEFERRED IMPLEMENTATION DETAIL** | lease fields frozen |
| Lease fields | **FROZEN NOW** | on session |

---

## 63. Blockers

**None.** Customer required-field and history-`import` facts are verified. Helper allowlist gap is a DATA-1G additive extension, not an owner decision.

---

## 64. Behavior rules (reaffirmed)

Documentation only. One engine. Customer first. CSV/XLSX. Session root. Explicit org. Customer session has no Activity. Code-owned field registry. AI cannot confirm. Owner/Admin approve. Staff/Viewer no v1 write. service_role executor only. Plan immutable. Adapter version on plan. Deterministic hash/fingerprint. Retry-safe. No silent merge. Create/link/skip. No mass overwrite. Bounded raw/staging. Audit survives TTL. No universal undo. No canonical cascade. No scripts/formulas/public storage. No BQA/Context/entitlement mutation. Onboarding later.
