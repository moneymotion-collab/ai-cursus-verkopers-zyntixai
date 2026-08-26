# BQA-1C — Business Qualification & Admission Database Foundation

| Field | Value |
| --- | --- |
| Phase | **BQA-1C — BUSINESS QUALIFICATION & ADMISSION DATABASE FOUNDATION** |
| Parent | BQA-1B |
| Document type | Implementation evidence (repository schema/security contract only) |
| Date | 2026-08-26 |
| Formal status | `BQA-1C CLOSED WITH EVIDENCE — BUSINESS QUALIFICATION & ADMISSION DATABASE FOUNDATION IMPLEMENTED AND FROZEN` |
| Governing design | `docs/phases/BQA-1B-business-qualification-admission-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Start HEAD | `98c7530b95a391fc7a7737fd9cb399e2a680b7ca` |
| Production | **NOT APPLIED TO PRODUCTION** |

This phase does **not** apply schema to Production, regenerate `database.generated.ts`, implement server qualification logic, Context assignment handoff, AI classification, admission engine, onboarding, product UI, or a public API.

**BQA DATABASE FOUNDATION: IMPLEMENTED**

**PRODUCTION BQA DATA: EMPTY / NOT YET APPLIED**

**BQA SERVER QUALIFICATION LOGIC: NOT IMPLEMENTED**

**BQA CONTEXT ASSIGNMENT HANDOFF: NOT IMPLEMENTED**

**ONBOARDING INTEGRATION: NOT IMPLEMENTED**

**BQA-1C PRODUCTION DATABASE VERIFICATION = NOT YET PERFORMED**

---

## A. Starting baseline

Proven before any 1C file was added:

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `98c7530b95a391fc7a7737fd9cb399e2a680b7ca` |
| Subject | `docs(bqa): freeze qualification and admission contract` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

Hard gate passed. Frozen BQA-1B baseline proven.

## B. Frozen 1B dependency

Authoritative contract: `docs/phases/BQA-1B-business-qualification-admission-domain-schema-contract.md` at `98c7530`.

Immutable inputs left closed: TAX-1, CAP-1, CTX-1, CONTROL-PLANE-READ-1, ORG-CONTEXT-1, CONTEXT-RESOLVER-1, BQA-1A, BQA-1B, Path B Closed Beta.

Binding owner policy stored as data vocabulary only:

- Closed Beta customer minimum Context readiness: `beta_supported` (also `production_verified`).
- `context_ready` remains `internal_qa` only.
- `planned` is not a customer-eligible readiness.
- Review is risk-based; not encoded as a mandatory confirm gate.
- Open Beta policy remains undefined (`open_beta_policy_undefined`). Schema forbids `admitted` + `open_beta`.
- CAP readiness is not a v1 admission gate. No capability columns.

## C. Seven-table implementation

Exact BQA-1B names. No eighth workflow, review, question-CMS, or raw AI-candidate table. `text` + CHECK, not Postgres ENUM.

| Table | Purpose |
| --- | --- |
| `business_activity_qualifications` | One aggregate per Activity. Progress + review + current pointers only. |
| `business_activity_qualification_answers` | Current answers by stable `question_key`. |
| `business_activity_classification_decisions` | Historical TAX decisions (`proposed` / `confirmed` / `superseded`). |
| `business_activity_support_assessments` | Catalog support snapshots. Not a Context assignment. |
| `business_activity_admission_decisions` | Orthogonal admission + rollout + reason. |
| `business_activity_qualification_events` | Append-only audit. |
| `business_activity_demand_signals` | Minimal tenant waitlist. One **active** row per Activity + TAX target. |

### Migration files

| File | SHA-256 |
| --- | --- |
| `supabase/migrations/20260826170000_create_business_qualification_admission_foundation.sql` | `D4EDC741D63BFE83E8C3773F5ED226EDD106723437988F0E56B1D355A8033C45` |
| `supabase/migrations/20260826170010_enable_business_qualification_admission_rls.sql` | `09181FED5DB45BAC668205E7212070B0148D8C258CFC29EA58E9BF9948DA2B4F` |

Decomposition: schema/constraints/triggers/deny-by-default RLS, then SELECT policies and the grant matrix. Expand-only. No backfill. No `db push`. No migration repair.

## D. Qualification table

Unique `(organization_id, business_activity_id)`. Composite Activity FK `ON DELETE RESTRICT`.

Owns only:

- `progress_status`: `unstarted` \| `collecting` \| `awaiting_confirmation` \| `needs_review` \| `confirmed` \| `requalifying`
- `review_status`: `none` \| `required` \| `requested` \| `resolved_proceed` \| `resolved_reject`
- `split_recommended`
- current pointers to classification / support / admission rows
- `created_at`, `updated_at`

Identity (`id`, `organization_id`, `business_activity_id`) is immutable. Pointers must belong to the same qualification.

## E. Answers table

Unique current row `(qualification_id, question_key)`. `value_kind` text/code XOR. Frozen keys `activity_description`, `primary_value_delivered`, `line_structure` constrained; adaptive keys remain expandable by format check. No question CMS. No stored question prompt text. Mutation history is events, not revision rows.

## F. Classification decisions

Historical rows. TAX `taxonomy_target_id` + `taxonomy_target_kind` + `taxonomy_target_key` snapshot + `taxonomy_release_id`. Confidence bands `high` \| `medium` \| `low` \| `none`. No numeric score.

`proposal_source` may be `ai_proposal`. `decision_source` cannot be `ai_proposal`. Confirmed requires classified target + `decision_source` + `confirmed_by_user_id` + `confirmed_at`. At most one `confirmed` row per Activity. Supersession cannot self-reference and must stay on the same qualification. Evidence snapshot forbids `chain_of_thought` / `prompt` / `reasoning` / `raw_model_output`.

## G. Support assessments

Snapshot at `assessed_at`. May capture TAX-linked classification, pack, exact version, readiness, requested rollout, support status, reason code.

Eligible (`supported_for_requested_rollout`) requires pack + version + readiness + reason `eligible`. Missing-pack / unknown / gap rows do **not** require a pack. No FK to `organization_context_assignments`. No assignment trigger.

Frozen support reasons: `eligible`, `missing_context_pack`, `no_published_context_version`, `context_readiness_insufficient`, `architecture_gap`, `classification_unknown`, `classification_ambiguous`, `review_required`, `open_beta_policy_undefined`.

## H. Admission decisions

Orthogonal `admission_status` + `rollout_mode` + `reason_code`. No `admitted_closed_beta` / `admitted_production` status values. `admitted` requires `eligible` + support snapshot + actor. `open_beta` cannot be `admitted` under frozen v1 policy.

Admission does not create login, membership, invitation, permission, entitlement, or capability execution. No Path B trigger.

## I. Events

Append-only. Frozen types only. `created_at` only. Unique `(organization_id, idempotency_key)` where key is not null. Immutability trigger blocks UPDATE/DELETE. Owner/Admin SELECT. No ordinary-read events. Payload object; same forbidden AI keys as classification evidence.

## J. Demand signals

`active` \| `withdrawn`. One active signal per `(business_activity_id, taxonomy_target_id)`. Tenant-scoped. No votes, ranking, public roadmap, TAX creation, Context creation, or automatic admission.

## K. State separation

Progress, classification outcome/lifecycle, support, admission, and review remain separate fields on the tables that own them. Qualification does not collapse them into one status.

## L. Tenant consistency

Every row has `organization_id` + `business_activity_id`. Composite FKs to `organization_business_activities (organization_id, id)` fail closed on cross-tenant Activity references. Child rows composite-FK to qualifications. Current pointers and supersession targets must match the same Activity/qualification. `ON DELETE RESTRICT` everywhere; Activity archive preserves BQA history.

## M. TAX integrity

Kind CHECK matches the canonical TAX hierarchy. Trigger `private.lookup_bqa_taxonomy_target_key` verifies the UUID exists in the matching typed catalog table and that the key snapshot matches the canonical `key`.

**Boundary:** parent-path, lifecycle `active`, catalog visibility, and release coherence remain Control Plane / later server validation. 1C does not create a second TAX truth and does not copy catalog tables.

## N. CTX snapshot

Support may store observed `context_pack_id` / `context_pack_version_id` / `context_readiness`. Version, when present, must belong to the stated pack. This is not an assignment pin and never auto-upgrades an existing `organization_context_assignment`.

New unassigned Activities may later choose the highest eligible published exact-target version; that behavior is **not** implemented here. Existing pins remain authoritative until a separate governed repin.

## O. Readiness policy storage

Readiness values stored as snapshot text: `planned`, `context_ready`, `beta_supported`, `production_verified`. No SQL engine encodes Closed Beta vs Production admission beyond the frozen Open Beta non-admit CHECK. `context_ready` is representable so internal QA can be assessed later; 1C does not promote OCB.

## P. Open Beta

`rollout_mode` includes `open_beta`. Support reason `open_beta_policy_undefined` cannot be `supported_for_requested_rollout`. Admission cannot be `admitted` + `open_beta`. No constraint states what Context readiness Open Beta will require.

## Q. Provenance

Distinct columns: `proposal_source`, `decision_source`, `actor_user_id` / `confirmed_by_user_id`. AI may propose. AI must not confirm.

## R. Supersession / idempotency structure

- One qualification per Activity.
- One current answer per question.
- At most one confirmed classification per Activity.
- One active DemandSignal per Activity + TAX target.
- Events idempotency_key unique per Organization where present.
- No generic idempotency column on every table.

## S. RLS, grants, and role matrix

RLS ON. Default deny. No FORCE RLS (ORG-CONTEXT convention). No public/anon access. No `using (true)`.

**1C actual grants (conservative):**

| Role | Qualifications / answers / decisions / support / admission / demand | Events | Writes |
| --- | --- | --- | --- |
| Owner (active) | SELECT | SELECT | none |
| Admin (active) | SELECT | SELECT | none |
| Staff (active) | SELECT | none | none |
| Viewer (active) | SELECT | none | none |
| Suspended / foreign / anon / public | none | none | none |
| `service_role` | SELECT/INSERT/UPDATE (events INSERT only) | INSERT | no DELETE |

`service_role` is an implementation detail, never user authority. Authenticated INSERT/UPDATE/DELETE is revoked on every BQA table. Classification confirmation, support assessment, admission, events, and demand writes are reserved for a later server/RPC boundary. Staff cannot confirm or admit. Staff cannot join demand in v1.

## T. Platform review

No platform-review authorization. `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST` is not reused. `decision_source = platform_review` is a provenance value only.

## U. Non-effects

| Surface | 1C effect |
| --- | --- |
| `organization_business_activities` | none (no INSERT/UPDATE; classification remains ORG-CONTEXT handoff) |
| `organization_context_assignments` | none (no INSERT/UPDATE; no `apply_organization_context_platform_mutation` call) |
| Path B / invitations / members | none |
| TAX/CAP/CTX grants | unchanged |
| CAP readiness | no columns, not a gate |
| Social | none |
| Onboarding / `business_type` / `registration_intents` | none |
| Product UI / Home / AppShell / CRM / Knowledge / Tasks / Attention | no consumer |
| Public API / browser hook | none |

CONTEXT_UNASSIGNED remains valid: classified Activity + BQA rows with no assignment FK.

## V. QA fixture protection / backfill

No INSERT into BQA tables. No automatic qualification for the retained QA Activity. Expected immediately after a future Production apply: seven empty BQA tables; Organizations = 6; QA Activity = 1; active assignment = 1; ORG-CONTEXT events = 2; Context readiness `context_ready` / `verified_at` NULL unchanged.

## W. Indexes

Justified access paths only:

- `organization_id` on all seven tables (qualifications, answers, classification, support, admission, events+created_at, demand)
- `qualification_id` on answers (unique with question_key), classification, support, admission, events
- confirmed classification unique on `business_activity_id`
- classification TAX target (partial)
- active demand unique `(business_activity_id, taxonomy_target_id)`
- demand TAX target
- events idempotency (partial)

No enum/timestamp proliferation indexes.

## X. Generated types

**Deferred.** Same rationale as ORG-CONTEXT-1B: `npm run supabase:types` is `--linked` to Production. These seven tables do not exist in Production yet. Hand-editing `src/types/database.generated.ts` is forbidden. Isolation tests assert generated types still do not mention BQA tables. Typegen belongs to **BQA-1C-FV** after a controlled Production apply, or to the first server repository phase after Production tables exist.

## Y. Tests executed

Focused:

- `tests/security/business-qualification-admission-migration-security.test.ts` (22)
- `tests/security/business-qualification-admission-runtime-isolation.test.ts` (3)
- Control Plane grant/reader + TAX/CAP/CTX isolation
- ORG-CONTEXT assignment + mutation + 1C server isolation
- Context Resolver domain/server + server unit tests
- Invitation migration + RPC security
- Social Closed Beta enrollment + entitlement defense

Then:

- `npx tsc --noEmit` — pass
- `npx next lint` — no ESLint warnings or errors
- `npx vitest run` — **3023 passed / 2 failed / 3025 total**

Previous accepted baseline: 2998 passed / 2 failed / 3000 total. Delta: **+25** from this phase’s contract tests. No new failures.

Known historical failures (unchanged, non-blocking):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

## Z. Production status

**NOT APPLIED TO PRODUCTION.**

No MCP apply. No `supabase db push`. No `db reset`. No migration repair. Historical `DB-MIGRATION-DRIFT-01` remains respected.

Expected Production until **BQA-1C-FV**:

| Surface | State |
| --- | --- |
| Seven BQA tables | do not exist yet |
| Organizations | 6 unchanged |
| QA Activity / assignment / events | 1 / 1 / 2 unchanged |
| CTX readiness | `context_ready` / `verified_at` NULL |
| Path B | unchanged |
| Product behavior | unchanged |

## AA. Blockers for Production verification

None in the repository freeze. Production apply requires a dedicated FV phase with targeted SQL (not blind `db push`), empty-table proof, QA fixture re-count, and grant/RLS live checks.

## AB. Recommended next phase

**BQA-1C-FV — CONTROLLED PRODUCTION DATABASE FOUNDATION VERIFICATION**

Then BQA server qualification commands. Not AI classification, not assignment handoff, not onboarding, not product UI.

---

BQA-1C CLOSED WITH EVIDENCE — BUSINESS QUALIFICATION & ADMISSION DATABASE FOUNDATION IMPLEMENTED AND FROZEN

BQA-1C PRODUCTION DATABASE VERIFICATION = NOT YET PERFORMED
