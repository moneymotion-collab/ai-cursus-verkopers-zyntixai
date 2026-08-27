# DATA-1A — Universal Business Data Intake Discovery

| Field | Value |
| --- | --- |
| Phase | **DATA-1A — UNIVERSAL BUSINESS DATA INTAKE DISCOVERY** |
| Parent | BQA-1 (Production verified) |
| Document type | Read-only architecture discovery + domain contract |
| Date | 2026-08-27 |
| Formal status | `DATA-1A CLOSED — UNIVERSAL BUSINESS DATA INTAKE ARCHITECTURE READY FOR CONTRACT FREEZE` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `f20f28d0599ee6ccbdec7cad5bd294eeafa3f38a` |
| Production mutation | **none** |
| Migration | **none** |
| Implementation | **none** |

This phase designs the universal Business Data Intake architecture. It does **not** apply schema, import data, wire onboarding, implement connectors, or mutate Production.

**SOURCE DATA IS NOT CANONICAL ZYNTIXAI DATA**

**BQA CLASSIFIES AND ADMITS. DATA IMPORTS INTO AN ALREADY GOVERNED ENVIRONMENT.**

**AI PROPOSES. HUMANS CONFIRM. PRIVILEGED EXECUTION IS NOT BUSINESS AUTHORITY.**

---

## 1. Starting repository state

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `f20f28d0599ee6ccbdec7cad5bd294eeafa3f38a` |
| Subject | `docs(bqa): record Production governed handoff verification` |
| Divergence | `0 0` |
| Worktree | clean |

---

## 2. BQA-1 dependency

| Dependency | Status |
| --- | --- |
| UCF-1 / TAX / CAP / CTX | PRODUCTION VERIFIED |
| ORG-CONTEXT-1 | PRODUCTION VERIFIED |
| ORG-CONTEXT BQA governed authority | PRODUCTION VERIFIED |
| CONTEXT-RESOLVER-1 | PRODUCTION VERIFIED |
| BQA qualification / classification / support / admission / handoff | PRODUCTION VERIFIED |
| BQA-1 BUSINESS QUALIFICATION + ADMISSION BACKEND | **PRODUCTION VERIFIED** |

BQA answers who the Activity is, what canonical TAX applies, whether a rollout is supported, whether the Activity may be operationally configured, and which exact Context applies.

DATA answers what operational data already exists outside ZyntixAI, what it means, how it maps, what is valid or unsafe, and how a confirmed plan may write canonical records.

---

## 3. DATA-1 purpose

Universal Business Data Intake lets an Organization that already operates outside ZyntixAI bring structured operational data into the canonical domain **after** BQA has governed the Activity and Context.

It must support source material from CSV, Excel, manual spreadsheets, CRM/project/order/inventory/customer/member/student/task exports, and later SaaS connectors.

It must **not** be designed around Online Course Business or any single niche. One intake engine must serve Knowledge OS, Service OS, Field Operations OS, and Product Operations OS as those domains exist. Missing Foundation models are **gaps**, not reasons to invent tables in DATA-1A.

---

## 4. Core pipeline (frozen)

```text
Source
→ Intake Session
→ Source artifact registration
→ Deterministic parsing
→ Source schema discovery
→ Proposed mapping
→ Human mapping confirmation
→ Validation
→ Normalization
→ Entity resolution
→ Duplicate / conflict detection
→ Human review
→ Immutable import plan
→ Explicit approval
→ Canonical write (existing domain writers)
→ Audit / reconciliation
```

AI may assist interpretation. AI may not skip stages, confirm low-confidence mappings, merge ambiguous entities, fabricate required values, or write canonical records.

---

## 5. DATA vs BQA vs onboarding

| Layer | Owns |
| --- | --- |
| BQA | Understand and configure Business Activities (qualify, classify, support, admit, hand off Context) |
| DATA | Import operational data into that governed environment |
| Onboarding | Future product/UI orchestration that may *ask* “do you have customers?” and *invoke* DATA primitives |

DATA **may read** Activities, Context, TAX, terminology, and Foundation relevance to improve mapping suggestions.

DATA **must not** reclassify, admit, assign/repin Context, or promote Context readiness.

Onboarding must not become the data engine. Ordinary single-record product forms are **not** DATA imports.

---

## 6. Current canonical data inventory

Inspected from `src/types/database.generated.ts`, `supabase/migrations/`, and `src/features/*/server`. No bulk import / CSV / XLSX writer exists in product code or `Database.public.Functions`.

### 6.1 Tenant operational domains (candidates / non-candidates)

| Entity | Tenant | Natural keys | Writer today | Audit | Safe bulk import writer | Importable in DATA-1? |
| --- | --- | --- | --- | --- | --- | --- |
| `organizations` | is the tenant | `slug` unique | RPC create-org / self-registration | none dedicated | no | **no** (identity, not CRM intake) |
| `profiles` | auth user | email in Auth, not public | trigger + own row | none | n/a | **no** |
| `organization_members` | `organization_id` | `(org, user_id)` unique | invitation/create-org RPCs | invitation events | no | **no** (Path B / identity) |
| `organization_invitations` | `organization_id` | pending `(org, email_normalized)` | invitation RPCs | invitation events | no | **no** (docs already exclude bulk CSV) |
| `customers` | `organization_id` | optional unique `(org, lower(btrim(email)))` | `create_customer` (authenticated RPC) | `customer_status_history` (`source` includes `import`) | **GAP** | **yes — first target** |
| `customer_tags` / `customer_tag_links` | `organization_id` | tag name unique per org | RLS allows Owner/Admin DML; unused in product | none | GAP | later / optional |
| `leads` | `organization_id` | email **not** unique | `create_lead` | stage/status history (`import` reserved) | GAP | later (duplicate policy harder) |
| `lead_pipeline_stages` | `organization_id` | name unique; one default | stage RPCs | none | GAP | no (config, not bulk CRM) |
| `tasks` | `organization_id` | system `idempotency_key` | `create_task` | `task_status_history` | GAP | later (requires related entity) |
| `programs` | `organization_id` | active name unique | `create_program` (Owner/Admin) | `program_status_history` (`import` reserved) | GAP | **yes — second Knowledge target** |
| `enrollments` | `organization_id` | one open `(org, customer, program)` | `create_enrollment` **manual-only** (`import` in CHECK but public RPC rejects non-manual) | `enrollment_status_history` | GAP | after customers+programs adapter |
| `enrollment_progress_facts` | `organization_id` | optional idempotency key | `record_progress_fact` (`source` = `manual`/`correction` only) | self (void) | GAP | later |
| `attention_*` | `organization_id` | `dedupe_key` | attention RPCs | events/signals | GAP | **no** (derived operational, not source lists) |
| `organization_business_activities` | `organization_id` | `activity_key` | ORG-CONTEXT / BQA service_role RPCs | context assignment events | GAP | **no** (BQA/ORG-CONTEXT owns) |
| BQA tables | `organization_id` | 1:1 qualification per Activity | BQA service_role RPCs | BQA events | GAP | **no** |
| `registration_intents` | user-scoped | `user_id` PK | registration RPCs | none | n/a | **no** |
| Social `social_*` | org via brand/workspace | provider external ids | Social RPCs | social events | n/a | **no** (execution domain) |
| TAX / CAP / CTX catalogs | **global** | keys | migration-managed | n/a | n/a | **no** |

Product create paths for customers/leads/tasks/programs/enrollments do **not** use `.insert()`. History `source='import'` is reserved on several tables but **no import RPC exists**. `public.create_customer` does not accept a source argument; import must later extend the **private** customer writer, not bypass it.

### 6.2 Missing production models (gaps — do not invent in DATA-1A)

Party, Relationship graph, Project, Order, Product, Inventory, Location, Work Order, Asset, Supplier, Employee-as-CRM, Work Area runtime, Service/Field/Product Context packs, CRM `source_system` / `external_id`, shared file storage (only `zyntix-social-media` exists).

---

## 7. Foundation classification of candidate entities

| Class | Entities | Status |
| --- | --- | --- |
| **A. Universal shared** | Organization, Member (identity), Customer (current concrete party), Task (operational), Lead (commercial pursuit) | Customer/Lead/Task exist |
| **B. Knowledge OS** | Program, Enrollment, Progress | exist (Course Seller maturity) |
| **C. Service OS** | Client-as-label, Project, recurring service | **GAP** (Customer may display as client) |
| **D. Field Operations OS** | Location, Work order, Asset | **GAP** |
| **E. Product Operations OS** | Product, Order, Inventory | **GAP** |
| **F. Future/unknown** | Party, Relationship, Supplier, Employee CRM, connectors | **GAP** |

DATA core must exist before all Foundations exist. Adapters are added when the canonical domain exists.

---

## 8. Party / Relationship dependency (frozen)

**Immediate:** DATA can proceed safely **before** Party for current concrete models (`customers`, `leads`, `programs`, `enrollments`).

**Future:** Party + Relationship is a **prerequisite** for truly canonical shared identity across customer / supplier / contact / employee and across multiple Activities. DATA-1 must not invent Party. Cross-Activity “same person” reuse is recorded as an architecture dependency, not a v1 feature.

Do not block Customer import on Party.

---

## 9. Intake session (frozen concept)

`DataIntakeSession` is shared core, Organization-scoped.

| Field (conceptual) | Rule |
| --- | --- |
| `organization_id` | required |
| `business_activity_id` | optional; **required when the chosen target domain is Activity-scoped**; never inferred from primary/latest Activity |
| `source_type` | csv / xlsx (v1) |
| `status` | session state machine §19 |
| created/approved/imported actors + timestamps | required for audit |
| summary counts | derived, not authority |

One session = one controlled import attempt. Re-upload or remapping after approval requires a **new plan version** or return to review — not silent mutation of an approved plan.

---

## 10. Source artifact (frozen concept)

`DataIntakeSource` v1 kinds: **`csv`**, **`xlsx`**. Later: `manual_table`, `api_connector`, `platform_export`, `json` — same pipeline, different adapter.

Retain metadata, not unbounded raw copies:

- original filename, mime, byte size, SHA-256, encoding, delimiter/sheet name, header row index, uploaded_at, storage path if persisted

Do not retain macros, formulas, external links, or full workbook objects.

---

## 11. Raw data retention (v1 recommendation)

**Hybrid B + C with bounded retention (D).**

| Artifact | v1 |
| --- | --- |
| Original file | private tenant-scoped Storage object, TTL **30 days** or until `cancelled` + 7-day grace, whichever first |
| Parsed source rows | staging table, same TTL |
| After successful import | keep **plan + mapping snapshot + row fingerprints + canonical ids created/linked + events**; delete raw file and full staging payloads on TTL |
| Debugging | hash + column metadata + error codes remain; raw PII is not required forever |

Rationale: GDPR minimization, tenant isolation, enough replay for idempotency during the window, no permanent raw PII warehouse. This is technical architecture, not legal advice.

---

## 12. Source schema discovery (deterministic)

Parser emits:

- headers, column count, row count
- inferred scalar types (string, number, integer, boolean, date, datetime, email, phone, currency)
- null rate, unique rate, sample values (capped, redacted in logs)
- delimiter/encoding/sheet
- date/currency/locale **candidates**, never silent resolution of ambiguous `03/04/2026`

AI may label headers in the UI. AI must not rewrite cells.

---

## 13. Canonical target model (frozen)

Primary abstraction is **semantic field**, not database column:

`source field` → `canonical entity` + `canonical field`

Example: “Client Name” / “Company” / “Customer” / “Student” may all map to `customer.display_name` depending on Context terminology, while the canonical entity remains `customer`.

Database columns are adapter implementation detail inside the domain writer.

---

## 14. Mapping model (frozen)

`DataMapping` per source column (and explicit transforms):

| Property | v1 |
| --- | --- |
| source column | required |
| target entity + field | null if unmapped |
| mapping type | direct / transform / ignore |
| confidence | 0–1 for proposals |
| proposal source | `deterministic` / `ai` / `user` / `saved_template` / `system_context` |
| status | `proposed` / `confirmed` / `rejected` / `unmapped` / `needs_review` |
| transform rule | from the frozen safe set only |
| confirmed_by | membership + user |

Unknown columns may stay `unmapped` / `ignore`. They must not block import unless required canonical fields are missing.

---

## 15. Mapping authority

| Actor | May |
| --- | --- |
| Deterministic rules | propose |
| Context terminology | propose |
| AI | propose only; never confirm low-confidence semantic maps |
| Human Owner/Admin | confirm / reject |
| Saved template | propose (future); still requires confirmation unless DATA-1B later freezes a stricter reuse rule |

**No silent semantic mapping.**

---

## 16–18. Context, Foundation, terminology

EffectiveContext is **relevance guidance**: expected entities, labels (student vs customer vs client), likely fields.

It is **not** authorization, entitlement, or permission.

Foundation relevance influences *candidate targets*. Target domain **availability** (table + writer exists) is a separate gate from Context relevance and from future commercial entitlement.

Canonical entity keys stay stable (`customer`, `program`, `enrollment`, `progress` — already seeded on `foundation.knowledge`). Display uses Context terminology. Imported semantics map to canonical concepts, not to display labels.

Current terminology seed: `customer`, `program`, `enrollment`, `progress` (en). Niche OCB inherits. No `lead` / `task` term keys yet.

---

## 19. Validation layers (frozen)

1. File / schema validity  
2. Field parse validity  
3. Entity-field validity (canonical types, enums)  
4. Cross-field validity  
5. Tenant / Activity-scope validity  
6. Relationship validity  
7. Duplicate / conflict validity  
8. Canonical write eligibility (domain writer would accept)

Errors are stable codes. No raw Postgres text to the end user.

---

## 20. Row state machine (frozen)

`pending` → `valid` | `warning` | `invalid` | `duplicate` | `conflict` | `ignored`

`valid` / `warning` (if policy allows) → `ready`

`ready` → `imported` | `failed`

`ignored` is terminal for that plan. `duplicate` / `conflict` require explicit row action (`skip` / `link-to-existing` / `create` if policy allows). Never a single success boolean.

---

## 21. Error model (frozen)

`SOURCE_INVALID` · `UNSUPPORTED_FILE` · `HEADER_MISSING` · `MAPPING_REQUIRED` · `MAPPING_AMBIGUOUS` · `VALUE_INVALID` · `REQUIRED_VALUE_MISSING` · `RELATION_NOT_FOUND` · `RELATION_AMBIGUOUS` · `DUPLICATE_FOUND` · `CONFLICT_FOUND` · `TARGET_NOT_SUPPORTED` · `TENANT_MISMATCH` · `ACTIVITY_REQUIRED` · `IMPORT_NOT_APPROVED` · `PLAN_STALE` · `CANONICAL_WRITE_FAILED` · `UNAUTHORIZED` · `FORBIDDEN_ROLE`

---

## 22–24. Duplicates, resolution, merge (frozen)

Duplicates are **entity-specific**. Do not assume email uniqueness globally.

| Entity | v1 match |
| --- | --- |
| Customer | exact email (org-normalized) = duplicate; display_name-only = probable, never auto-merge |
| Lead | email is **not** unique today; v1 should not silently unique it |
| Program | normalized active name |
| Enrollment | existing open `(customer, program)` |

Resolution outcomes: existing entity · new entity · ambiguous · invalid reference. **No silent merge under ambiguity.**

v1 merge policy: **CREATE or LINK-TO-EXISTING or SKIP**. No mass UPDATE/overwrite. `update-safe-fields` is a later capability. Manual conflict resolution stays in review, not in the writer.

---

## 25. External identifiers

v1 introduces a **shared** `data_external_record_links` (or equivalent) rather than adding `source_system`/`external_id` to every canonical table:

`(organization_id, source_system, external_id, target_entity, target_id, intake_session_id)`

Enables re-import, dedupe, traceability. Not implemented in DATA-1A. Social already has provider external ids in a different domain — do not reuse those tables.

---

## 26–27. Import plan and preview

`DataImportPlan` is **immutable** after approval:

- source snapshot (hash + metadata)
- confirmed mapping set
- included / excluded row ids or fingerprints
- create / link / skip counts
- warnings
- validation result
- optional Activity id
- plan version + content hash

Execution uses the frozen plan, not a re-parse of the file.

Preview read model (no UI now): rows read, new, linked, duplicates, invalid, warnings, importable, blocked. No raw DB errors, no full PII dumps in logs.

---

## 28–29. Human approval and import authority

**Architecture requirement:** real `auth.getUser`, active membership, role authorization, explicit approved plan, server-only privileged execution.

`service_role` is the executor of a governed RPC, **never** the business authority (same principle as BQA).

**Frozen architecture vs v1 product policy:**

| Action | Architecture minimum | v1 product policy |
| --- | --- | --- |
| Create session / upload / map / validate | authenticated member | Owner/Admin |
| Approve plan / execute | Owner or Admin | Owner/Admin |
| View preview/audit (PII) | need-to-know | Owner/Admin |
| Viewer | read-only of non-PII session status at most | no staging PII |
| Staff prepare mappings | allowed later | **not** in v1 |

Staff may create a single customer today; bulk import is a governed write like BQA handoff, so v1 approval stays Owner/Admin.

---

## 30–32. Atomicity, idempotency, concurrency

A 100k-row file is **not** one SQL transaction.

| Size | Strategy |
| --- | --- |
| Small (≤ 500 rows **and** file ≤ 2 MB) | synchronous server request, one transaction |
| Medium / large | durable batches on the session; per-batch transaction; retry-safe |

Idempotency key (conceptual): `(plan_id, row_fingerprint)` and/or `(org, source_system, external_id)` and/or domain natural key (customer email). Retry must not create 1,000 duplicate customers.

Concurrency: one **execution owner** per session (lease). Same plan executed twice is idempotent. Overlapping sessions that hit the same natural key: second writer sees `DUPLICATE_FOUND` / link, not a second create. Do not take a global org lock.

---

## 33–36. Audit, undo, provenance, events

Audit must reconstruct who uploaded, source hash, confirmed mappings, approved plan hash, who approved, attempts, created/linked/skipped/failed canonical ids, timestamps — **without** requiring permanent raw PII.

**Undo (frozen):** DATA v1 does **not** promise automatic undo, soft rollback of the whole import, or cascade delete. Imported records may gain legitimate subsequent work. Retain provenance; scoped remediation is a later phase.

Provenance: **shared** link/event (`created via data_import` / external link table), **not** a new `created_source` column on every entity. History `source='import'` may be set **inside** existing domain writers where the CHECK already allows it (customers/programs). Enrollment public RPC currently **rejects** non-manual source — adapter work, not a bypass.

Events (session-level, not per-cell spam):

`intake_created` · `source_uploaded` · `source_parsed` · `mapping_proposed` · `mapping_confirmed` · `validation_completed` · `plan_created` · `plan_approved` · `import_started` · `import_batch_completed` · `import_completed` · `import_failed` · `import_cancelled`

---

## 37–39. File limits, CSV, XLSX

v1 operational boundaries (conservative for Vercel + Postgres RLS SaaS):

| Limit | Value | Rationale |
| --- | --- | --- |
| Max file size | **10 MB** | enough for typical CRM exports; blocks zip-bomb-ish workbooks |
| Max rows | **10,000** | reviewable; larger is a later worker generation |
| Max columns | **50** | mapping UX and parse cost |
| Encoding | UTF-8 required; UTF-8 BOM accepted | reject opaque encodings in v1 |
| CSV delimiter | detect `,` `;` tab among first lines | do not guess wildly |
| XLSX | first sheet **or** explicitly selected sheet; cached/scalar values only | no formula execution |
| Password-protected / macros / external links | **reject** | |
| Merged cells | reject or flatten by policy as `SOURCE_INVALID` | |
| Formula-looking cells (`=CMD|`) | store as text; never execute | CSV injection |

---

## 40–41. PII / storage security

- Tenant isolation via `organization_id` + RLS on every DATA table  
- Private Storage bucket (new; **not** `zyntix-social-media`)  
- Tenant-scoped object path; no public URLs; short-lived signed URLs  
- Deny anon/authenticated direct bucket access  
- Minimize logs: codes + hashes, not emails/names  
- Delete/cancel: stop execution; do not delete already committed canonical rows; delete raw/staging per TTL  
- Malware scanning: **future** requirement, not v1 blocker  

---

## 42–46. AI, deterministic core, templates, connectors, manual entry, export

AI may suggest headers, mappings, relationships, and quality explanations. AI may **not** write canonical records, approve, silently merge, invent required data, or change BQA/Context.

The pipeline must run **without AI**.

Saved mapping templates: **future-compatible** (`organization_id` + source fingerprint / header signature). Not a v1 product.

Connectors (HubSpot, Salesforce, Shopify, …) are **source adapters** into the same session/parse/map/validate/plan/execute engine. Not separate architectures. Not designed per vendor now.

Single manual create = normal domain command. Bulk paste/table = DATA. Export/portability is out of DATA-1 scope but the provenance model must not block it.

---

## 47–52. Availability, entitlement, Activity scope

| Gate | Meaning |
| --- | --- |
| Target domain availability | canonical table + writer exist |
| Context relevance | suggested targets / labels |
| Entitlement | future commercial module check; **not** implemented now; import must not grant access |

Organization-wide vs Activity-specific:

| Example | Scope |
| --- | --- |
| Customer / contact list | Organization-wide in current model (no `business_activity_id` on `customers`) |
| Program / enrollment | Organization-wide tables today; **may** require explicit Activity when Knowledge OS is the operating Context — v1 Customer import does **not** require Activity |
| Field work order (future) | Activity-specific |

If a target **requires** Activity context, the session must carry an **explicit** `business_activity_id`. **No** primary / first / latest Activity fallback.

Cross-Activity reuse of the same customer is possible today because Customer is org-scoped. Future Party should preserve that rather than duplicating people per Activity.

---

## 53–56. Unknown fields, required data, transforms, locale

Unknown source fields are valid (`unmapped` / `ignore`).

Required canonical fields cannot be fabricated by AI. Humans may supply explicit defaults in review.

Safe transforms only: trim, case, date/number/currency/boolean/enum parse, email/phone normalize, explicit concat/split. **No user scripts.**

Organization/Context locale **suggests** parse rules. Ambiguous dates without resolved locale → `VALUE_INVALID` / `needs_review`, never a silent guess.

---

## 57. Session status machine (frozen)

`created` → `source_ready` → `parsed` → `mapping_required` → `mapped` → `validating` → `review_required` | `ready_for_approval` → `approved` → `importing` → `completed` | `completed_with_errors` | `failed`

`cancelled` from any pre-`completed` state except that **in-flight batches finish or fail**; cancellation does **not** delete committed canonical rows.

From `approved`, mapping/source/row selection cannot silently change. Edits require a new plan version or return to `review_required` (which **revokes** approval).

---

## 58–62. Cancellation, recovery, observability, stack

Cancellation: pre-import = no canonical writes; during batches = stop scheduling further batches; post-import = no automatic delete.

Recovery: persist last completed batch index, failed row fingerprints, retryable vs non-retryable. No hidden infinite retry.

Metrics (no PII): sessions created, parse duration, mapping completion, validation failures, rows attempted/created/linked, duplicates, conflicts, batch failures, duration.

**Actual stack (not the prompt’s Next 16):** Next.js **15.5**, React 19, Supabase Postgres, Vercel. Social cron worker `maxDuration = 300` is the only documented long path; `vercel.json` crons = `[]`. Large imports **must not** run inside a normal user request.

No new vendor in DATA-1A. Future worker can reuse the existing Vercel authenticated/cron route pattern or a queue later — DATA-1C decides durable job columns on the session, not a new product.

---

## 63–64. Small vs large; job model

| Class | Recommendation |
| --- | --- |
| Small | ≤ 500 rows and ≤ 2 MB: request-scoped transaction |
| Medium | 501–10,000 rows: background execution owned by the session |
| Large | > 10,000 rows: **out of v1** (reject `UNSUPPORTED_FILE` / too many rows) |

`DataImportJob` is **not** a separate table in v1. `DataIntakeSession` holds `execution_status`, `lease_owner`, `cursor_batch`, `attempt_count`. Minimum durable job state lives on the session.

---

## 65. Security threat model (ranked)

| Threat | Rank | Mitigation |
| --- | --- | --- |
| Cross-tenant file access | HIGH | tenant path + RLS + no public URLs |
| Forged org / Activity id | HIGH | membership + explicit Activity; no primary fallback |
| Unauthorized approval / service_role as authority | HIGH | BQA-style: auth user + role **before** privileged RPC |
| Replay / tamper after approval | HIGH | immutable plan hash; execute that hash only |
| Mapping target injection | HIGH | allowlist canonical fields per adapter |
| Oversized upload / resource exhaustion | HIGH | 10 MB / 10k rows / 50 cols |
| CSV injection / malicious XLSX | HIGH | never execute formulas/macros; reject protected files |
| PII in logs / signed URL leak | HIGH | codes+hashes; short-lived URLs |
| Duplicate flooding / external-id collision | MEDIUM | natural keys + link table uniqueness |
| AI exfiltration | MEDIUM | AI sees samples only; no raw dump to third parties in v1 (deterministic path must work without AI) |
| Duplicate overlapping imports | MEDIUM | session lease + domain unique indexes |
| Malware in files | LOW/future | scanner later; reject executable MIME now |

---

## 66. Authorization matrix (v1 product policy)

| Action | Owner | Admin | Staff | Viewer |
| --- | --- | --- | --- | --- |
| Create intake | yes | yes | no | no |
| Upload source | yes | yes | no | no |
| Edit mapping | yes | yes | no | no |
| Validate | yes | yes | no | no |
| Approve plan | yes | yes | no | no |
| Execute import | yes | yes | no | no |
| View PII preview/audit | yes | yes | no | no |
| Cancel | yes | yes | no | no |

Architecture still allows a later product policy where Staff prepare mappings. It does **not** allow Viewer or unauthenticated import.

---

## 67–68. Table candidates and staging

**Minimum proposed (not created):**

1. `data_intake_sessions` — session + execution/job fields  
2. `data_intake_sources` — file metadata + storage key + hash  
3. `data_intake_mappings`  
4. `data_intake_staging_rows` — generic JSONB original + normalized + state  
5. `data_import_plans` — immutable snapshots  
6. `data_intake_events`  
7. `data_external_record_links` — provenance / re-import  

Rejected as v1 tables: per-entity staging tables, unlogged tables (lose durability), source-generated DDL, separate job table.

**Staging recommendation: generic JSONB row table (A)** with RLS. Queryable enough for preview, schema-stable across adapters, cleanup by session TTL. Hybrid object-storage for the original file only.

---

## 69. Canonical writer strategy (frozen)

**Disfavored:** direct SQL that duplicates invariants (D).

**v1:** domain-specific import adapters that call **existing private helpers** / command invariants in deterministic batches (B wrapping A). Example: extend `private.create_customer_record` to accept `source='import'` and set history accordingly, invoked from a DATA SECURITY DEFINER RPC that already proved Owner/Admin + approved plan.

Performance comes from batching inside one transaction per batch, not from skipping CHECKs, uniqueness, or RLS-equivalent tenant checks.

---

## 70. First supported import domain (frozen recommendation)

**Customers.**

| Criterion | Why customers |
| --- | --- |
| Domain maturity | Production RPC + uniqueness + history `import` reserved |
| Relationship complexity | Low (org-scoped; no Activity required) |
| Duplicate risk | Email unique index is a real, testable rule |
| Business value | Highest for organizations coming from spreadsheets/CRMs |
| Testability | Isolated from Program/Enrollment graph |

Not first: Tasks (need a related entity), Enrollments (need customer+program + public RPC currently rejects `import`), Programs (valuable second Knowledge adapter after customers).

---

## 71. MVP DATA-1 scope (before onboarding)

**In:** CSV + XLSX, Customer adapter, mapping, validation, preview, duplicates, Owner/Admin approval, execution, audit, idempotency, tenant security.

**Out:** live connectors, two-way sync, mass overwrite, AI-autonomous import, universal undo, Party, Service/Field/Product entities, enrollment/progress import, invitation/member import.

Programs may follow as DATA-1G+ second adapter, not a requirement to close the first FV.

---

## 72. Phase decomposition (recommended)

| Phase | Purpose |
| --- | --- |
| **DATA-1A** | Discovery + architecture (this document) |
| **DATA-1B** | Domain types + schema/security contract freeze |
| **DATA-1C** | Database / Storage / staging / events foundation |
| **DATA-1D** | Parsing + schema discovery + mapping persistence |
| **DATA-1E** | Validation + duplicate/resolution |
| **DATA-1F** | Immutable plan + approval + batch execution + idempotency |
| **DATA-1G** | First canonical adapter: Customers |
| **DATA-1-FV** | Controlled Production verification |
| **ONBOARDING-1A** | Orchestration discovery — only after DATA-1-FV |

Do not start ONBOARDING-1A automatically. Do not implement DATA-1B in this phase.

---

## 73. Onboarding entry criteria

Premium onboarding may consume DATA only after Production verification of:

intake session · safe parse · mapping confirmation · validation · preview · approval · canonical execution · audit · idempotency · tenant security.

Otherwise onboarding becomes data infrastructure.

---

## 74. Open decisions (non-blocking)

These are refinements for DATA-1B, not DATA-1A blockers:

- Exact raw/staging TTL vs 30-day default  
- Whether a later product policy allows Staff to prepare mappings  
- Exact small-import row cutoff vs 500  
- Whether Programs is scheduled immediately after Customers or after first FV  
- Worker implementation (session-owned Vercel route vs later queue)

---

## 75. Blockers

**None.** BQA-1 baseline is proven. Party is not a prerequisite for Customer intake. No Production change is required to freeze this architecture.

---

## 76. Behavior rules (reaffirmed)

BQA remains frozen. DATA does not classify, admit, assign Context, mutate readiness, or grant entitlement. Source data is not canonical data. Parsing is deterministic. AI proposes, not approves. No silent maps or merges. Unknown fields are valid. Required values cannot be fabricated. Explicit plan approval before writes. No client privileged import. `service_role` is executor, not authority. Multi-Activity scope is explicit. No primary-Activity fallback. No public storage. No scripts or spreadsheet execution. Idempotent imports. Audit governed steps. No universal destructive undo. Connectors share this engine. Onboarding comes later.
