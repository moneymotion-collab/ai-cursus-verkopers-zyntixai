# BQA-1B — Business Qualification & Admission Domain + Schema Contract

| Field | Value |
| --- | --- |
| Phase | **BQA-1B — BUSINESS QUALIFICATION & ADMISSION DOMAIN + SCHEMA CONTRACT** |
| Parent | BQA-1A |
| Document type | Architecture contract (no migration, no implementation) |
| Date | 2026-08-26 |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `40d26d67f1404cde76d60449fa23a1764b4ef8b3` |
| Formal status | `BQA-1B CLOSED — BUSINESS QUALIFICATION & ADMISSION DOMAIN + SCHEMA CONTRACT FROZEN` |

**No SQL. No tables created. No Production write. No UI. No onboarding change. No Context readiness mutation.**

CONTEXT-RESOLVER-1 remains **PRODUCTION VERIFIED**. OCB Context remains `context_ready` / `verified_at` NULL.

---

## A. Starting baseline

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `40d26d67f1404cde76d60449fa23a1764b4ef8b3` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |
| BQA-1A | accepted architecture input |
| CONTEXT-RESOLVER-1 | PRODUCTION VERIFIED |

## B. Frozen owner decisions

**Decision 1 — readiness vs rollout**

| Rollout | Eligible Context readiness | Not eligible |
| --- | --- | --- |
| `internal_qa` | `context_ready`, `beta_supported`, `production_verified` | `planned` |
| `closed_beta` (customer) | `beta_supported`, `production_verified` | `planned`, `context_ready` |
| `production` | `production_verified` | `planned`, `context_ready`, `beta_supported` |
| `open_beta` | **undefined** — must not be inferred | — |

`context_ready` remains permitted only for `internal_qa`. This contract does **not** promote OCB readiness.

**Decision 2 — review is risk-based**

Human platform review is **not** mandatory for every Closed Beta confirmation. High-confidence + user confirmation + all deterministic gates may proceed. Mandatory review at minimum: ambiguous classification; confidence `low` or `none`; unknown; unresolved multi-Activity; architecture gap; unsupported / not-yet-supported; conflicting confirmation; integrity anomaly; any future policy flag.

## C. Domain boundary

Grain: **Business Activity**. Tenant: **Organization**.

BQA owns: qualification progress, answers, classification decisions, support snapshots, admission decisions, review state, demand signals, decision history.

BQA does **not** own: authentication, membership, Path B invitations, billing, entitlement, permissions, TAX authoring, Context Pack authoring, Context resolution, Context assignment mutation, DATA-1 import, product UI.

## D. Entity model (v1)

Seven future tables. No question-registry table. No ReviewRequest table. No raw AI-candidate table.

| Entity | Canonical? | v1 required? |
| --- | --- | --- |
| `BusinessActivityQualification` | yes — aggregate | yes |
| `QualificationAnswer` | yes — current answers | yes |
| `ClassificationDecision` | yes — proposed/confirmed/superseded | yes |
| `SupportAssessment` | yes — time-stamped snapshot | yes |
| `AdmissionDecision` | yes — time-stamped snapshot | yes |
| `QualificationEvent` | yes — append-only audit | yes |
| `DemandSignal` | yes — minimal waitlist | yes |
| AI candidates / prompts | no — structured evidence only | snapshot on decision |
| ReviewRequest | no — status + events | defer until queue/SLA |

**One qualification aggregate per Activity** (unique `(organization_id, business_activity_id)`), plus immutable superseded decision rows. Not a new aggregate per attempt.

## E. State separation

Never one `approved` boolean.

| Domain | Field | Values |
| --- | --- | --- |
| Qualification progress | `progress_status` | `unstarted`, `collecting`, `awaiting_confirmation`, `needs_review`, `confirmed`, `requalifying` |
| Classification outcome | `classification_outcome` | `classified`, `ambiguous`, `unknown`, `architecture_gap` |
| Classification lifecycle | `decision_status` | `proposed`, `confirmed`, `superseded` |
| Confidence | `confidence_band` | `high`, `medium`, `low`, `none` |
| Review | `review_status` | `none`, `required`, `requested`, `resolved_proceed`, `resolved_reject` |
| Support | `support_status` | `supported_for_requested_rollout`, `not_yet_supported`, `unsupported`, `unknown`, `needs_review` |
| Admission | `admission_status` | `incomplete`, `needs_review`, `waitlisted`, `not_yet_supported`, `unsupported`, `admitted`, `rejected`, `blocked` |
| Rollout | `rollout_mode` | `internal_qa`, `closed_beta`, `production`, `open_beta` |

`admitted` + `rollout_mode` is orthogonal (avoids `admitted_closed_beta` explosion). `open_beta` is a legal mode value with **no frozen eligibility rule**; assessment must return `needs_review` / reason `open_beta_policy_undefined`.

### Confidence semantics

| Band | Meaning |
| --- | --- |
| `high` | One dominant TAX target supported by provided evidence |
| `medium` | Plausible leader; a distinguishing dimension remains |
| `low` | Weak evidence or several plausible interpretations |
| `none` | Cannot classify honestly |

AI score never writes `confirmed`. User/governed confirmation is required.

### Medium-confidence rule

Require at least one additional clarification. If still `medium` after that → `review_status = required`. `high` may proceed after confirmation if support/admission gates pass.

## F. Qualification aggregate

`business_activity_qualifications`

- Exactly one row per Activity.
- Holds progress, review, current-pointer FKs, split recommendation.
- Mutable current pointers; historical truth lives in decision/event tables.

`progress_status` is **workflow**, not classification outcome. Classification lives on `ClassificationDecision`.

## G. Answers and questions

**Question definitions:** application/domain-owned stable keys. **No** DB question-builder/CMS table in v1.

Frozen v1 keys:

| Key | Required | Value shape |
| --- | --- | --- |
| `activity_description` | yes | text |
| `primary_value_delivered` | yes | `structured_programs` \| `individualized_service` \| `physical_product` \| `digital_product` \| `field_work` |
| `line_structure` | yes | `one_line` \| `several_lines` |

Adaptive keys (examples, not exhaustive): `delivery_mode`, `programs_vs_coaching`. Unknown keys rejected server-side.

**Storage:** one **current** row per `(qualification_id, question_key)`. Mutable in place. History via `answer_saved` events (payload includes previous/new value). Chosen over answer-revision rows to keep v1 small while remaining auditable.

## H. Classification decision

Canonical confirmed classification references TAX **id**. `taxonomy_target_key` is an audit snapshot, not an alternate identity. Labels are not stored.

`decision_source` (confirmation authority, never `ai_proposal`): `user_self`, `organization_admin`, `support_assisted`, `platform_review`, `migration`.

`proposal_source` (how the candidate appeared): `ai_proposal`, `user_self`, `organization_admin`, `support_assisted`, `platform_review`, `migration`.

AI may be `proposal_source`. AI must **not** be `decision_source`.

Structured evidence on the decision (not canonical TAX truth): `alternative_target_ids uuid[]`, `unresolved_dimension_codes text[]`, `evidence_snapshot jsonb` (question keys + selected attributes only). No chain-of-thought, no unrestricted model prose, no prompt text.

Correction: new decision row + `supersedes_decision_id` + event. Then a **separate** ORG-CONTEXT `classify_activity` handoff. Never silent overwrite.

Hybrid: `split_recommended = true` and outcome code `activity_split_recommended`. BQA does not clone Activities or create Business Units.

## I. Support assessment

Snapshot of observed catalog truth at `assessed_at`. Not “current forever”.

Inputs: confirmed TAX target; pack existence; published version existence; that version’s readiness; requested `rollout_mode`; architecture-gap flag. **CAP readiness is not a v1 gate.**

**No tenant Context fallback.** If no assignable pack/version for the **exact** TAX target: `not_yet_supported` + Activity may remain `CONTEXT_UNASSIGNED`. Catalog `parent_version_id` inheritance inside an already-pinned version remains valid and is not BQA’s job.

### Context version selection (handoff proposal only)

Eligible version: `publication_status = published`, exact TAX target match (`pack_kind` + target id), readiness in the rollout policy set. If **exactly one** eligible: select it. If **several:** highest `version_number` among eligible published (deterministic, documented). Never `MAX(version)` across drafts/superseded. Never ancestor pack. No silent repin of an existing tenant pin.

## J. Admission

`admission_status` + `rollout_mode` + `reason_code`.

| Status | Meaning |
| --- | --- |
| `incomplete` | Required answers/confirmation missing |
| `needs_review` | Risk-based review required |
| `waitlisted` | Understood, not eligible now; demand signal allowed |
| `not_yet_supported` | Classified; platform Context/readiness insufficient |
| `unsupported` | Classified; outside current architectural support |
| `admitted` | Eligible for `rollout_mode` |
| `rejected` | Explicit governed “do not admit” despite understood state |
| `blocked` | Policy/security/integrity prevents admission |

`rejected` is reserved for platform_review / integrity resolutions. Ordinary “no pack yet” is `not_yet_supported`, not `rejected`.

## K. Review storage

**No ReviewRequest table in v1.** `review_status` on the qualification + `review_requested` / resolution events. Add a queue table only when assignment, SLA, or reviewer workflow exists.

Platform review authority is **not** `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST`. Future dedicated BQA review identity. `service_role` is never reviewer identity.

## L. Path B

Path B creates users/memberships/invitations. BQA never does. Path B success does not imply BQA admission or Context assignment. Orchestration: identity gate then Activity qualification; either may fail closed independently.

## M. Handoffs (never direct table writes)

### Activity classification

Confirmed `ClassificationDecision` → `apply_organization_context_platform_mutation` `classify_activity` with TAX XOR payload → Activity FKs updated → ORG-CONTEXT event. BQA does not UPDATE `organization_business_activities`.

### Activation (frozen recommendation)

1. Create **draft** Activity (ORG-CONTEXT).
2. Collect BQA answers.
3. Confirm classification (BQA).
4. Governed `classify_activity` (still draft).
5. Governed **activate** Activity (now classified; still unassigned).
6. Support snapshot + admission decision (BQA).
7. If `admitted` for requested rollout, assignment handoff.

Activation is owned by ORG-CONTEXT after BQA confirmation + classify. Support may run immediately after classify; it does not delay activation. Waitlisted/not-yet-supported Activities remain **active + CONTEXT_UNASSIGNED**.

### Context assignment

BQA produces command: `{ organizationId, businessActivityId, contextPackVersionId, source: "bqa_confirmed", actorUserId, idempotencyKey }`. Execution: existing `apply_organization_context_platform_mutation` `assign_context_version` (or frozen successor). No INSERT into `organization_context_assignments`.

## N. Demand signal

One **active** signal per `(business_activity_id, taxonomy_target_id)`. Waitlisted / not-yet-supported may create or refresh it. No voting, no TAX write, no public roadmap, no cross-tenant identity in future aggregates.

## O. Events (append-only)

Canonical audit events (not per-read):

`qualification_started`, `answer_saved`, `classification_proposed`, `classification_confirmed`, `classification_superseded`, `review_requested`, `review_resolved`, `support_assessed`, `admission_decided`, `waitlist_joined`, `waitlist_withdrawn`, `split_recommended`, `assignment_handoff_requested`, `assignment_handoff_completed`, `requalify_started`.

Ordinary answer overwrites still emit `answer_saved` (needed for audit) but do not create extra progress events.

## P. Idempotency

| Command | Natural key |
| --- | --- |
| save answer | `(qualification_id, question_key)` upsert |
| confirm classification | no-op if current confirmed target+release already matches |
| requalify | explicit command; new proposed decision; never implicit |
| request review | no-op if `review_status` already `required` or `requested` |
| support reassess | new snapshot; pointer update; caller idempotency key optional |
| admission decide | new snapshot if inputs changed; else no-op |
| join waitlist | unique active demand signal upsert (`last_confirmed_at`) |
| assignment handoff | `idempotency_key` unique among requested events for that Activity |

## Q. Future RLS (not implemented)

| Role | Answers | Confirm / admit | Demand signal |
| --- | --- | --- | --- |
| Owner | read/write | yes | join/withdraw |
| Admin | read/write | yes | join/withdraw |
| Staff | read/write answers | **no** | no |
| Viewer | read | no | no |
| Suspended / nonmember / foreign | none | none | none |
| Platform review | separate server authority | review resolve only | no |
| `service_role` | implementation detail | never user authority | — |

Staff write of answers matches existing Staff create/edit of operational work; confirmation stays Owner/Admin (activation-class authority).

Tenant isolation on `organization_id`. No authenticated grants on TAX/CTX catalog tables. No client-direct BQA DML in v1 (server RPC later).

## R. Server trust and AI

Server validates: membership, Activity ownership, question keys, TAX id existence + lifecycle `active`, release, pack/version/publication/readiness, rollout policy.

Never trust client-supplied Foundation path, eligibility, or admission outcome. Client may suggest a TAX id only as a **choice among server-ranked candidates**; server re-resolves.

Untrusted content: descriptions and websites. Structured AI output schema; deterministic validation onto TAX ids. No tool-calling from that text. AI input: Activity answers only — not customers, leads, members, or financial data.

## S. Evolution

TAX superseded: historical decision remains; Activity FKs change only after new confirmed decision + classify handoff.

Context: new eligible version → reassessment available; existing pin unchanged until governed `change_context_version`.

Requalify: `progress_status = requalifying`; previous decisions/answers retained; new proposed classification; current pointers move after confirm.

## T. Proposed tables (contract only — no SQL)

### 1. `business_activity_qualifications`

| | |
| --- | --- |
| Purpose | One aggregate per Activity |
| PK | `id uuid` |
| Tenant | `organization_id` → `organizations(id)` |
| Activity | `business_activity_id` → `organization_business_activities(id)` |
| Unique | `(organization_id, business_activity_id)` |
| Columns | `progress_status`, `review_status`, `split_recommended bool`, `current_classification_decision_id`, `current_support_assessment_id`, `current_admission_decision_id`, `created_at`, `updated_at` |
| CHECKs | enums above; FKs same-org |
| Mutable | yes (pointers/progress) |
| Delete | no hard delete; retain on Activity archive |
| Indexes | unique activity; org |
| RLS | tenant member SELECT; writes via future SECURITY DEFINER |

### 2. `business_activity_qualification_answers`

| | |
| --- | --- |
| Purpose | Current answers by stable question key |
| PK | `id uuid` |
| FKs | `qualification_id`, `organization_id`, `business_activity_id` |
| Unique | `(qualification_id, question_key)` |
| Columns | `question_key text`, `value_kind text`, `value_text`, `value_code`, `source` (`user_self` \| `organization_admin` \| `support_assisted` \| `ai_proposal`), `actor_user_id`, `created_at`, `updated_at` |
| CHECKs | known key set expandable; xor text/code by kind |
| Mutable | current value |
| History | events |
| RLS | same tenant |

### 3. `business_activity_classification_decisions`

| | |
| --- | --- |
| Purpose | Proposed/confirmed/superseded TAX decisions |
| PK | `id uuid` |
| FKs | org, activity, qualification; `taxonomy_release_id`; `supersedes_decision_id` self-FK |
| Columns | `taxonomy_target_kind`, `taxonomy_target_id uuid`, `taxonomy_target_key text` (snapshot), `classification_outcome`, `confidence_band`, `decision_status`, `proposal_source`, `decision_source` nullable until confirmed, `confirmed_by_user_id`, `confirmed_at`, `alternative_target_ids uuid[]`, `unresolved_dimension_codes text[]`, `evidence_snapshot jsonb`, `created_at`, `superseded_at` |
| CHECKs | kind in TAX kinds; `decision_source <> 'ai_proposal'`; confirmed requires target+source+confirmed_at; unknown/ambiguous allow null target |
| Unique current | at most one `decision_status = confirmed` per Activity |
| Mutable | only `decision_status`/`superseded_at` on supersede |
| Delete | none |
| RLS | tenant |

TAX target FKs cannot be a single column to typed tables; enforce kind/id coherence in server + CHECK that kind is valid; 1C may add composite integrity via trigger (same pattern as Activity XOR) **without** writing it now.

### 4. `business_activity_support_assessments`

| | |
| --- | --- |
| Purpose | Observed catalog snapshot |
| PK | `id uuid` |
| Columns | org, activity, qualification, `classification_decision_id`, `rollout_mode`, `support_status`, `reason_code`, `context_pack_id`, `context_pack_version_id`, `context_readiness`, `architecture_gap bool`, `assessed_at`, `superseded_at` |
| CHECKs | pack/version null when not_yet_supported/missing pack; CAP columns **absent** |
| Mutable | supersede only |
| Delete | none |

### 5. `business_activity_admission_decisions`

| | |
| --- | --- |
| Purpose | Admission snapshot |
| PK | `id uuid` |
| Columns | org, activity, qualification, `support_assessment_id`, `rollout_mode`, `admission_status`, `reason_code`, `decision_source`, `actor_user_id`, `decided_at`, `superseded_at` |
| Unique current | at most one non-superseded current via qualification pointer |
| Delete | none |

### 6. `business_activity_qualification_events`

| | |
| --- | --- |
| Purpose | Append-only audit |
| PK | `id uuid` |
| Columns | org, activity, qualification, `event_type`, `actor_user_id`, `actor_member_id`, `payload jsonb`, `idempotency_key text`, `created_at` |
| Unique | `(organization_id, idempotency_key)` where key not null |
| Mutable | **no** |
| Delete | **no** (immutability trigger intent, like assignment events) |
| RLS | Owner/Admin history; Staff/Viewer current-state reads only (events owner/admin) — matches ORG-CONTEXT event pattern |

### 7. `business_activity_demand_signals`

| | |
| --- | --- |
| Purpose | Waitlist / not-yet-supported demand |
| PK | `id uuid` |
| Columns | org, activity, `taxonomy_target_kind`, `taxonomy_target_id`, `taxonomy_target_key` snapshot, `requested_rollout`, `status` (`active` \| `withdrawn`), `created_at`, `last_confirmed_at`, `withdrawn_at` |
| Unique | one `active` per `(business_activity_id, taxonomy_target_id)` |
| Mutable | status / last_confirmed_at |
| Delete | no; withdraw |
| RLS | tenant; no global authenticated read |

## U. Existing table interaction

| Existing | Interaction |
| --- | --- |
| `organizations` | Tenant FK only. Do not write `business_type` / onboarding columns. |
| `organization_members` | Authz only. |
| `organization_business_activities` | Parent grain. Draft first. Classify/activate via mutation RPC. |
| `organization_context_assignments` | Handoff only, `source = bqa_confirmed`. |
| `organization_context_assignment_events` | ORG-CONTEXT audit, not BQA events. |
| `taxonomy_*` / `context_*` | Control Plane reads. No tenant writes. |
| `registration_intents` | None. |
| Onboarding enums | None as TAX. Optional future hint, never auto-convert. |
| `customers` / `leads` | Forbidden as BQA input. |

## V. Timestamps

Qualification: `created_at`, `updated_at`. Answers: `created_at`, `updated_at`. Classification: `created_at`, `confirmed_at`, `superseded_at`. Support: `assessed_at`, `superseded_at`. Admission: `decided_at`, `superseded_at`. Demand: `created_at`, `last_confirmed_at`, `withdrawn_at`. Events: `created_at` only.

## W. Deletion / retention

No hard delete of events or decisions. Activity archive: keep BQA rows. Withdraw demand signals. No cascade-delete of audit history.

## X. Reason codes

**Support:** `eligible`, `missing_context_pack`, `no_published_context_version`, `context_readiness_insufficient`, `architecture_gap`, `classification_unknown`, `classification_ambiguous`, `review_required`, `open_beta_policy_undefined`.

**Admission:** `eligible`, `incomplete_answers`, `confirmation_required`, `review_required`, `waitlisted_not_eligible`, `not_yet_supported`, `unsupported`, `blocked_integrity`, `blocked_policy`, `rejected_by_review`, `path_b_independent` (informational; Path B is not a BQA column).

Codes are machine identifiers. UX copy is not domain logic.

## Y. Stress tests (contract traces)

| Case | Classification | Support | Admission | Assign? |
| --- | --- | --- | --- | --- |
| OCB `context_ready`, `internal_qa` | confirmed niche | eligible | `admitted` + `internal_qa` | yes if gates pass |
| OCB `context_ready`, customer `closed_beta` | confirmed niche | `context_readiness_insufficient` | `not_yet_supported` or `waitlisted` | no; demand signal allowed |
| OCB future `beta_supported`, `closed_beta` | confirmed | eligible | `admitted` + `closed_beta` | yes |
| Agency / construction / ecommerce, no pack | industry classified | `missing_context_pack` | `not_yet_supported` | no |
| Manufacturer | industry `manufacturing-and-production` | architecture_gap and/or missing pack | `not_yet_supported` + review | no |
| SaaS | `unknown` / `architecture_gap` | unknown | `needs_review` / waitlist | no |
| Hybrid agency + course | `split_recommended` | OCB path only after split | split first | no on hybrid aggregate |
| Ambiguous coaching/course | `ambiguous` / medium→review | n/a | `needs_review` | no |
| Invited Path B + unsupported | may classify | not eligible | BQA waitlist; Path B unchanged | no |
| Eligible Activity, user not Path B admitted | BQA irrelevant | — | no workspace | no |
| Requalify after new pack | new confirmed decision | new snapshot | may become `admitted` | proposal only; no auto-repin |

## Z. Threat model (schema-updated)

| Threat | Rank | Mitigation |
| --- | --- | --- |
| Cross-tenant qualification row | HIGH | `organization_id` on every table; RLS; Activity org match CHECKs |
| Forged Activity id | HIGH | Server: Activity belongs to membership org |
| Forged TAX / Context version / admission | HIGH | Server re-resolve catalog; ignore client eligibility |
| AI hallucinated TAX key | HIGH | Validate id+key+kind against Control Plane |
| Prompt injection | HIGH | Untrusted text; structured output; no tools |
| Confirmation replay / double assign | MEDIUM | Confirm idempotency; mutation org lock; handoff idempotency_key |
| Silent reclassify / downgrade | HIGH | Supersede-only; events immutable |
| Reviewer impersonation | HIGH | Dedicated future review authority; not operator allowlist; not service_role-as-user |
| Event tampering | HIGH | Append-only, no UPDATE/DELETE |
| PII in AI logs | MEDIUM | Answers-only input; no CRM dump |
| Demand signal identity leak | MEDIUM | Tenant RLS; future aggregates without org ids |

## AA. Migration strategy preview (BQA-1C, not now)

Expand-only new tables, empty. No backfill of Organizations or B1.2 onboarding. **Retained QA Activity untouched** (no BQA row, no assignment change). No automatic classify/assign. Expected Production after 1C: seven empty BQA tables; TAX/CTX/ORG-CONTEXT counts unchanged; Path B unchanged.

## AB. Open decisions

None blocking this contract freeze. Non-blocking later: exact adaptive question key list; whether Staff waitlist join is allowed (v1: no); review-queue table when workflow exists.

## AC. Next phase

**BQA-1C — DATABASE FOUNDATION** (schema only). Do not implement it from this document automatically. Do not promote Context readiness. Do not wire onboarding.

---

BQA-1B CLOSED — BUSINESS QUALIFICATION & ADMISSION DOMAIN + SCHEMA CONTRACT FROZEN
