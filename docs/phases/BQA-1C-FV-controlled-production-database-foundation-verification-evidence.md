# BQA-1C-FV — Controlled Production Database Foundation Verification

| Field | Value |
| --- | --- |
| Phase | **BQA-1C-FV — CONTROLLED PRODUCTION DATABASE FOUNDATION VERIFICATION** |
| Parent | BQA-1C |
| Document type | Production verification evidence |
| Date | 2026-08-26 |
| Formal status | `BQA-1C-FV CLOSED WITH EVIDENCE — BUSINESS QUALIFICATION & ADMISSION DATABASE FOUNDATION PRODUCTION VERIFIED` |
| Governing implementation | `docs/phases/BQA-1C-business-qualification-admission-database-foundation-evidence.md` |
| Governing contract | `docs/phases/BQA-1B-business-qualification-admission-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `f62da020a99815fc6cf39db1630b406ded91b105` |
| Production schema | **APPLIED** (targeted MCP apply of frozen BQA SQL only) |
| Production BQA rows | **0** |

This phase verifies **only** the database/storage/security foundation. It does **not** implement qualification server logic, AI classification, support evaluation, admission evaluation, Activity handoff, Context assignment handoff, onboarding, product UI, public API, entitlement, Path B, or Context readiness promotion.

**BQA PRODUCTION DATABASE FOUNDATION: VERIFIED**

**BQA PRODUCTION ROWS: 0**

**BQA SERVER QUALIFICATION LOGIC: NOT IMPLEMENTED**

**BQA SUPPORT / ADMISSION ENGINE: NOT IMPLEMENTED**

**BQA ACTIVITY HANDOFF: NOT IMPLEMENTED**

**BQA CONTEXT ASSIGNMENT HANDOFF: NOT IMPLEMENTED**

**BQA ONBOARDING INTEGRATION: NOT IMPLEMENTED**

**CONTEXT PACK READINESS: UNCHANGED**

---

## A. Starting repository state

Proven before any Production SQL:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `f62da020a99815fc6cf39db1630b406ded91b105` |
| Subject | `feat(bqa): add qualification and admission database foundation` |
| Divergence | `0 0` |
| Worktree at FV start | clean |

Hard gate passed. Frozen BQA-1C files were not edited during FV.

---

## B. Production target

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Postgres | `17.6.1.141` |
| Host | `db.dmctinrcjvsgmoxwwodw.supabase.co` |
| Canonical app | `https://www.zyntixai.com` |

No service-role JWT, database password, or access token is recorded here.

---

## C. Frozen migration hashes

Recalculated on disk immediately before apply and again after tests. Files were not modified.

| Local file | SHA-256 |
| --- | --- |
| `supabase/migrations/20260826170000_create_business_qualification_admission_foundation.sql` | `D4EDC741D63BFE83E8C3773F5ED226EDD106723437988F0E56B1D355A8033C45` |
| `supabase/migrations/20260826170010_enable_business_qualification_admission_rls.sql` | `09181FED5DB45BAC668205E7212070B0148D8C258CFC29EA58E9BF9948DA2B4F` |

Exact match to the frozen BQA-1C contract. No SQL rewrite. No additive remediation migration required.

---

## D. Targeted apply method

| Field | Value |
| --- | --- |
| Method | MCP `apply_migration` + live `execute_sql` verification |
| `supabase db push` | **not used** |
| `supabase db reset` | **not used** |
| Migration repair | **not used** |
| Blind `db pull` | **not used** |
| History rewrite | **not used** |
| Unrelated local migrations | **not applied** |

`DB-MIGRATION-DRIFT-01` remains respected. Historical Social local/remote timestamp divergence was not reconciled.

Operational constraint: MCP `apply_migration` could not accept the full 1416-line foundation file in a single payload. Frozen local SQL was **not** rewritten. Remaining exact frozen objects were applied additively (`CREATE OR REPLACE` on already-created helpers is idempotent). The RLS file was applied in one shot.

This is a ledger-mapping detail, not a schema rewrite.

---

## E. Remote migration records

Local filenames remain `20260826170000` / `20260826170010`. Remote timestamps differ, as expected under DB-MIGRATION-DRIFT-01.

| Remote version | Remote name | Contents |
| --- | --- | --- |
| `20260826130951` | `create_business_qualification_admission_foundation` | Truncated first payload (`private.guard_business_activity_qualification_event_immutable` only) |
| `20260826131049` | `create_business_qualification_admission_foundation` | TAX lookup + qualification/answer identity functions |
| `20260826131125` | `create_business_qualification_admission_integrity_functions` | Remaining integrity helpers |
| `20260826131144` | `create_business_qualification_admission_decision_demand_functions` | Classification / support / admission / demand helpers |
| `20260826131155` | `create_business_activity_qualifications` | Qualifications table |
| `20260826131209` | `create_business_activity_qualification_answers` | Answers table |
| `20260826131231` | `create_business_activity_classification_decisions` | Classification table |
| `20260826131249` | `create_business_activity_support_assessments` | Support table |
| `20260826131306` | `create_business_activity_admission_decisions` | Admission table |
| `20260826131320` | `create_business_activity_qualification_events` | Events table |
| `20260826131330` | `create_business_activity_demand_signals` | Demand signals table |
| `20260826131418` | `create_business_qualification_admission_foundation` | Pointer FKs, indexes, triggers, RLS enable, revokes |
| `20260826131515` | `enable_business_qualification_admission_rls` | Full frozen RLS file, one shot |

Live objects after this ledger match the frozen SQL contract. No duplicate BQA tables. No unrelated grant/policy changes.

---

## F. Seven-table existence

**BQA TABLE COUNT = 7**

Exact live `public` relations:

1. `business_activity_qualifications`
2. `business_activity_qualification_answers`
3. `business_activity_classification_decisions`
4. `business_activity_support_assessments`
5. `business_activity_admission_decisions`
6. `business_activity_qualification_events`
7. `business_activity_demand_signals`

No eighth workflow, question-CMS, review-queue, or raw AI-candidate table. No capability-entitlement or assignment-id columns.

---

## G. Zero-row state

Counted immediately after apply and again after all rolled-back verification transactions:

| Table | Rows |
| --- | --- |
| qualifications | **0** |
| answers | **0** |
| classification_decisions | **0** |
| support_assessments | **0** |
| admission_decisions | **0** |
| events | **0** |
| demand_signals | **0** |

No QA backfill. No Organization backfill. No onboarding conversion.

---

## H. Structural constraints

Live PKs, composite tenant FKs (`ON DELETE RESTRICT`), unique `(organization_id, id)` keys, CHECKs, indexes, and partial unique indexes match the frozen 1C contract.

Notable live objects:

- `business_activity_qualifications_activity_unique` — one qualification per Activity
- `business_activity_qualification_answers_current_unique` — one current answer per question
- `business_activity_classification_decisions_one_confirmed_uidx` — at most one confirmed classification per Activity
- `business_activity_demand_signals_one_active_uidx` — one active signal per `(business_activity_id, taxonomy_target_id)`
- `business_activity_qualification_events_idempotency_uidx` — unique org + idempotency key where present
- `business_activity_admission_decisions_open_beta_not_admitted_ch` — `NOT (admitted AND open_beta)`
- `business_activity_admission_decisions_admitted_fields_check` — admitted requires `eligible` + support snapshot + actor
- Classification self-supersession CHECK: `supersedes_decision_id IS DISTINCT FROM id`
- Support eligible-without-context CHECK: eligible requires pack + version + readiness
- Support `missing_context_pack` may omit version

Triggers:

| Table | Trigger |
| --- | --- |
| qualifications | identity + `set_updated_at` |
| answers | identity + `set_updated_at` |
| classification | integrity |
| support | integrity |
| admission | integrity |
| demand | integrity |
| events | immutability (`BEFORE UPDATE OR DELETE`) |

---

## I. Tenant consistency

Rolled-back Production `BEGIN` … `ROLLBACK` probes rejected representative invalid aggregates:

- Organization A qualification → Activity B
- answer → wrong qualification/Activity tenant
- classification decision → mismatched Activity/qualification
- support assessment → mismatched aggregate
- admission decision → mismatched aggregate
- event → mismatched tenant aggregate
- demand signal → foreign Activity

Composite FKs to `organization_business_activities (organization_id, id)` and child composite FKs to qualifications are live. No retained QA fixture row was mutated. Probe transaction ended `P0001: bqa_fv_rollback` after expected rejections; BQA tables remained 0 rows.

---

## J. TAX typed validation

`private.lookup_bqa_taxonomy_target_key(kind, id)` is `SECURITY DEFINER` with `search_path=""`. EXECUTE is revoked from `public` / `anon` / `authenticated` / `service_role`. Triggers still fire as table-owner.

Rolled-back probes:

- correct kind/id/key combination: structurally accepted when other required fields were valid
- wrong taxonomy kind for UUID: rejected
- wrong key snapshot: rejected
- unknown TAX UUID: rejected

No TAX DML. No TAX grant change. No public RPC surface for the lookup helper.

---

## K. Classification history integrity

Live CHECK vocabulary: `high` / `medium` / `low` / `none`. Invalid values rejected in rollback.

Also proven in rollback / catalog:

- self-supersession rejected
- cross-Activity / cross-tenant supersession cannot be constructed (composite FK + tenant identity trigger)
- at most one current confirmed classification per Activity (partial unique index)
- historical superseded rows remain structurally possible; no DELETE required to change history
- `proposal_source` may be `ai_proposal`; `decision_source` cannot

---

## L. Support snapshot integrity

Live CHECKs allow legitimate absence of Context metadata for `missing_context_pack`, `no_published_context_version`, `architecture_gap`, and classification unknown/ambiguous reasons.

Eligible (`supported_for_requested_rollout`) requires pack + exact version + readiness + reason `eligible`. Version, when present, FKs to `context_pack_versions`. Integrity trigger requires the version to belong to the referenced pack.

No assignment mutation. No auto-select of latest Context.

---

## M. Admission integrity

Orthogonal live fields: `admission_status`, `rollout_mode`, `reason_code`. No `admitted_closed_beta` / `admitted_production` status.

Live CHECKs:

- admitted requires `eligible` + support snapshot + actor
- `admitted` + `open_beta` rejected
- non-admitted states do not require Context assignment

Rollback probed admitted + open_beta and admitted + non-eligible reason. Schema forbids those combinations. Non-admitted rows do not require assignment FKs (none exist on the table).

---

## N. DemandSignal integrity

Live lifecycle: `active` / `withdrawn`. One active signal per exact uniqueness grain. Rolled-back duplicate-active insert failed on `business_activity_demand_signals_one_active_uidx`.

No TAX mutation, no Context mutation, no admission trigger, no roadmap/public table.

---

## O. RLS

Every BQA table: RLS **enabled**, FORCE RLS **false**.

| Table | RLS | FORCE |
| --- | --- | --- |
| `business_activity_qualifications` | true | false |
| `business_activity_qualification_answers` | true | false |
| `business_activity_classification_decisions` | true | false |
| `business_activity_support_assessments` | true | false |
| `business_activity_admission_decisions` | true | false |
| `business_activity_qualification_events` | true | false |
| `business_activity_demand_signals` | true | false |

No BQA table has RLS disabled.

---

## P. Grants

Live `role_table_grants` (no PUBLIC / anon rows):

| Role | Current-state tables | Events |
| --- | --- | --- |
| PUBLIC | none | none |
| anon | none | none |
| authenticated | SELECT only | SELECT only |
| service_role | SELECT, INSERT, UPDATE | SELECT, INSERT |

No authenticated INSERT / UPDATE / DELETE on any BQA table, including classification, support, and admission.

---

## Q. Role read model

Policies inspected by expression, not name:

| Role | Current-state SELECT | Events SELECT | Writes |
| --- | --- | --- | --- |
| Owner (active) | `private.is_org_member(organization_id)` | `private.has_org_role(..., ARRAY['owner','admin'])` | none |
| Admin (active) | same | same | none |
| Staff (active) | same member SELECT | none (events policy is owner/admin only) | none |
| Viewer (active) | same member SELECT | none | none |
| Suspended | none (`is_org_member` / `has_org_role` require `status = 'active'`) | none | none |
| Foreign | none (tenant `organization_id` predicate) | none | none |
| Anonymous / public | none (no privilege + no policy) | none | none |

No `USING (true)`. No generic cross-tenant policy. No INSERT/UPDATE/DELETE policies.

**AUTHENTICATED MEMBER RLS EXECUTION PROBE = NOT AVAILABLE** (tables empty; no new Closed Beta session created). Catalog + expressions + frozen static tests are the 1C-FV authority.

---

## R. Event immutability

`business_activity_qualification_events_guard_immutable` fires `BEFORE UPDATE OR DELETE` → `private.guard_business_activity_qualification_event_immutable()`.

Rollback probes: UPDATE blocked, DELETE blocked. No DELETE grant. Authenticated has SELECT only. `service_role` has SELECT + INSERT only.

---

## S. service_role boundary

Exact frozen limited privileges only. `service_role` DML is database capability for a **future** server/RPC boundary. No server endpoint exists yet. No user authorization is derived from `service_role`. Helper EXECUTE remains revoked from `service_role`; triggers still fire as table-owner.

`service_role` is not reviewer identity.

---

## T. No Activity mutation

BQA function sources and triggers do not call `classify_activity`, `activate_activity`, or `archive_activity`. No DML against `organization_business_activities` from BQA objects. Composite FKs are references only.

---

## U. No Context assignment mutation

Zero BQA triggers/functions call `apply_organization_context_platform_mutation`. Zero BQA DML against `organization_context_assignments`. No automatic latest-version selection. No assignment-id column.

**BQA → ORG-CONTEXT automatic mutation = 0**

---

## V. No Path B coupling

No new BQA FK/trigger/function modifies `invitations`, `organization_members`, `registration_intents`, auth users, or registration gates. Path B remains independent.

---

## W. No CAP-readiness admission coupling

Production BQA schema contains no capability entitlement, minimum capability readiness, required capability readiness, or per-capability admission gate. CAP catalog remains 13 / 7 / 13.

---

## X. Generated-type result

Linked Production typegen:

```text
npm run supabase:types
```

(`supabase gen types typescript --linked > src/types/database.generated.ts`)

| Check | Result |
| --- | --- |
| Hand-edit | **none** |
| Diff | **+575 / −1** |
| Seven BQA tables typed | **yes** (public Tables, alphabetical) |
| BQA RPCs / Functions | **none** (no server surface yet) |
| SHA-256 | `8E9818F4A467C72175852D02B6CE26EBB5899BF1FD01D16EF3293ECA7243D4E1` |

The single deletion is `__InternalSupabase.PostgrestVersion: "14.5"` → `"14.17"` (linked Production API version drift, not schema destruction). No unexplained destructive/unrelated table removals.

Isolation tests were updated so generated types are the **only** authorized BQA table consumer. `src/features/bqa` still must not exist. Protected product paths still have zero BQA hits.

---

## Y. QA fixture

Re-read after apply and after all rollback probes:

| Surface | Count / state |
| --- | --- |
| Organizations | **6** |
| Business Activities | **1** |
| Active Context assignments | **1** |
| Superseded assignments | **0** |
| ORG-CONTEXT events | **2** |
| Other Organizations with Activities | **0** |
| QA Context readiness | `context_ready` |
| `verified_at` | NULL |
| BQA rows for QA Activity | **0** |

QA Activity remains the retained online-course-business fixture. No new BQA row.

---

## Z. TAX / CAP / CTX invariants

Unchanged after apply and after rollback probes:

| Registry | Counts |
| --- | --- |
| TAX | 1 / 4 / 22 / 1 / 0 / 0 / 2 |
| CAP | 13 / 7 / 13 |
| CTX | 2 / 2 / 10 / 4 / 2 |

No catalog DML. No readiness promotion.

`niche.online-course-business` and `foundation.knowledge` remain `context_ready` with `verified_at` NULL.

---

## AA. Closed Beta / Social safety

| Check | Result |
| --- | --- |
| `GET https://www.zyntixai.com/register` | **307** → `/login?registration=disabled` |
| New user / membership / invitation | none created |
| BQA admission rows | **0** |
| `private.social_publishing_execution_enabled()` | **false** |
| Cron | jobid 1, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active (unchanged) |
| Social provider execution | none performed |
| ORG-CONTEXT platform-operator enablement | unchanged; not used by BQA |

BQA migrations do not reference Social execution tables/functions.

---

## AB. Tests

Focused (192 passed):

- BQA migration-security (22) + runtime-isolation (3)
- `tests/types/database-contract.test.ts` (6, including the new seven-table assertion)
- Control Plane grant + reader
- TAX / CAP / CTX isolation
- ORG-CONTEXT assignment / mutation / 1C server isolation
- Context Resolver domain / server / unit
- Invitation migration + RPC security
- Social Closed Beta enrollment + entitlement defense

Then:

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (no warnings or errors) |
| Full `npx vitest run` | **3024 passed / 2 failed / 3026 total** |

Accepted BQA-1C baseline: 3023 passed / 2 failed / 3025 total. Delta: **+1** from the generated-type contract assertion. No new failures.

Historical only (unchanged, non-blocking):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

---

## AC. Production status

**BQA PRODUCTION DATABASE FOUNDATION: VERIFIED**

**BQA PRODUCTION ROWS: 0**

**BQA SERVER QUALIFICATION LOGIC: NOT IMPLEMENTED**

**BQA SUPPORT / ADMISSION ENGINE: NOT IMPLEMENTED**

**BQA ACTIVITY HANDOFF: NOT IMPLEMENTED**

**BQA CONTEXT ASSIGNMENT HANDOFF: NOT IMPLEMENTED**

**BQA ONBOARDING INTEGRATION: NOT IMPLEMENTED**

**CONTEXT PACK READINESS: UNCHANGED**

Product behavior is unchanged. Seven empty tenant tables now exist in Production with frozen RLS/grants/constraints.

---

## Scope exclusions (still closed)

- no `src/features/bqa/**`
- no qualification commands
- no AI classifier
- no support/admission engine
- no Activity classification/activation handoff
- no Context assignment handoff / auto-repin
- no onboarding mapping
- no product UI
- no public API
- no entitlement
- no Path B change
- no Context readiness promotion

---

## Next phase

**BQA-1D — QUALIFICATION + CLASSIFICATION SERVER FOUNDATION**

Do not implement automatically.

Still: no AI confirmation, no support/admission engine, no assignment handoff, no onboarding, no product UI.

---

BQA-1C-FV CLOSED WITH EVIDENCE — BUSINESS QUALIFICATION & ADMISSION DATABASE FOUNDATION PRODUCTION VERIFIED

BQA-1C DATABASE FOUNDATION = PRODUCTION VERIFIED
