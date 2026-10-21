# BQA-1E — Support + Admission Evaluation Foundation

| Field | Value |
| --- | --- |
| Phase | **BQA-1E — SUPPORT + ADMISSION EVALUATION FOUNDATION** |
| Parent | BQA-1D / BQA-1D-FV |
| Document type | Implementation evidence (server/domain/RPC contract only) |
| Date | 2026-08-26 |
| Formal status | `BQA-1E CLOSED WITH EVIDENCE — SUPPORT + ADMISSION EVALUATION FOUNDATION IMPLEMENTED AND FROZEN` |
| Governing contract | `docs/phases/BQA-1B-business-qualification-admission-domain-schema-contract.md` |
| Governing database | `docs/phases/BQA-1C-business-qualification-admission-database-foundation-evidence.md` |
| Qualification foundation | `docs/phases/BQA-1D-qualification-classification-server-foundation-evidence.md` |
| Production qualification verification | `docs/phases/BQA-1D-FV-controlled-production-qualification-classification-verification-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `980843e555062374f36a4b3ae19a8ee2d6fee1b3` |
| Production apply | **NOT APPLIED** |
| Production support / admission / demand rows | **0** (this phase did not contact Production data) |

This phase implements deterministic Business Qualification support assessment, admission evaluation, and demand-waitlist commands on top of the Production-verified qualification + classification foundation. It does **not** mutate Activity TAX, assign or repin Context, change Context readiness, call the Effective Context Resolver as authority, grant identity or entitlement, implement AI classification, or expose a product UI / public API.

**BQA SUPPORT ENGINE: IMPLEMENTED**

**BQA ADMISSION ENGINE: IMPLEMENTED**

**BQA DEMAND SIGNAL SERVER: IMPLEMENTED**

**ACTIVITY HANDOFF: NOT IMPLEMENTED**

**CONTEXT ASSIGNMENT HANDOFF: NOT IMPLEMENTED**

**CONTEXT REPIN: NOT IMPLEMENTED**

**AI CLASSIFICATION: NOT IMPLEMENTED**

**ONBOARDING: NOT IMPLEMENTED**

**PRODUCTION SUPPORT ASSESSMENTS: 0**

**PRODUCTION ADMISSION DECISIONS: 0**

**PRODUCTION DEMAND SIGNALS: 0**

**BQA-1E PRODUCTION SUPPORT / ADMISSION VERIFICATION = NOT YET PERFORMED**

---

## A. Starting baseline

Proven before any 1E file was added:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `980843e555062374f36a4b3ae19a8ee2d6fee1b3` |
| Subject | `docs(bqa): record Production qualification verification` |
| Divergence | `0 0` |
| Worktree at 1E start | clean |

Hard gate passed. BQA-1C DATABASE FOUNDATION = PRODUCTION VERIFIED. BQA QUALIFICATION + CLASSIFICATION FOUNDATION = PRODUCTION VERIFIED.

Retained Production BQA QA fixture at 1D-FV close: qualifications 1 / answers 3 / classification decisions 2 / events 6 / support 0 / admission 0 / demand 0. Classification: `niche.online-course-business`, confidence high, progress confirmed, review none.

---

## B. Frozen readiness policy

| Rollout | Eligible Context readiness | Not eligible |
| --- | --- | --- |
| `internal_qa` | `context_ready`, `beta_supported`, `production_verified` | `planned` |
| `closed_beta` (customer) | `beta_supported`, `production_verified` | `planned`, `context_ready` |
| `production` | `production_verified` | `planned`, `context_ready`, `beta_supported` |
| `open_beta` | none — policy UNDEFINED | all readiness values |

`context_ready` remains permitted only for `internal_qa`. CAP readiness is not a v1 BQA admission gate. Open Beta cannot be admitted in v1.

Current Production OCB Context remains `context_ready` / `verified_at` NULL. 1E does not promote readiness to make Closed Beta or Production pass.

---

## C. Support domain

Pure module: `src/features/business-qualification/domain/support.ts` plus `rollout-policy.ts` and `architecture-gap.ts`.

Support answers, in order:

1. Is the Activity canonically classified (confirmed)?
2. Does an exact governed Context Pack exist for that TAX target?
3. Does a published Context version exist?
4. What is the observed Context readiness?
5. Does that readiness satisfy the requested rollout?
6. Does the Activity require review?
7. Resulting support status / reason code.

Client claims for TAX key, pack id, version id, readiness, eligibility, and support status are ignored. Canonical catalog truth is resolved server-side from Control Plane.

---

## D. Admission domain

Pure module: `src/features/business-qualification/domain/admission.ts`.

Admission consumes qualification completeness, confirmed classification, review/split state, the current SupportAssessment, requested rollout, and whether an active demand signal exists.

Orthogonal fields: `admission_status` + `rollout_mode` + `reason_code`. There is no `admitted_closed_beta` status.

Automatic `admitted` requires all of: qualification complete, classification confirmed, review not required, support eligible for the requested rollout, rollout policy defined, no integrity blocker.

Admission is not identity authorization, entitlement, capability enablement, or Context assignment.

---

## E. Exact Context Pack resolution

`ContextRepository.findPackForExactTaxonomyTarget({ kind, id })` plus BQA adapter `context-catalog.ts`.

Lookup is exact TAX kind + id XOR. No ancestor Industry/Foundation pack. No nearest supported target. Duplicate packs for one target are `CATALOG_INTEGRITY_ERROR`. Missing pack is a support outcome (`missing_context_pack`), not an exception.

---

## F. Version selection

No active pin: highest `version_number` among **published** versions whose observed readiness is eligible for the requested rollout. Drafts are never used. This selected version is a proposed future assignment observation on the SupportAssessment only.

Active exact pin: the pin remains authoritative. A newer eligible published version may be reported as `upgradeMayExist`. 1E never repins.

---

## G. Existing-pin non-authority

The retained QA Activity already has an active OCB v1 Context assignment. Support evaluation observes that pin. Pin existence is **not** Closed Beta eligibility and is **not** Context readiness. `context_ready` + existing assignment still fails Closed Beta and Production.

---

## H. Support status / reasons

Statuses: `supported_for_requested_rollout`, `not_yet_supported`, `unsupported`, `unknown`, `needs_review`.

Reasons: `eligible`, `missing_context_pack`, `no_published_context_version`, `context_readiness_insufficient`, `architecture_gap`, `classification_unknown`, `classification_ambiguous`, `review_required`, `open_beta_policy_undefined`.

Preconditions:

| Classification / workflow | Support |
| --- | --- |
| confirmed classified, gates pass, eligible version | `supported_for_requested_rollout` / `eligible` |
| unconfirmed proposal | `needs_review` / `review_required` |
| unknown | `unknown` / `classification_unknown` |
| ambiguous | `needs_review` / `classification_ambiguous` |
| architecture_gap outcome or frozen gap TAX key | `not_yet_supported` / `architecture_gap` |
| review/split/requalifying | `needs_review` / `review_required` |
| open_beta | `needs_review` / `open_beta_policy_undefined` |

---

## I. Admission status / reasons

Statuses: `incomplete`, `needs_review`, `waitlisted`, `not_yet_supported`, `unsupported`, `admitted`, `rejected`, `blocked`.

Reasons used by the engine: `eligible`, `incomplete_answers`, `confirmation_required`, `review_required`, `waitlisted_not_eligible`, `not_yet_supported`, `unsupported`, `blocked_policy`, `blocked_integrity`.

`rejected` remains an explicit governed/human decision. 1E does not implement a reject command. Missing pack / insufficient readiness are not `blocked` and not `rejected`.

---

## J. Review gates

Mandatory review remains risk-based: unknown, ambiguous, architecture gap, unresolved split, review_status required/requested, unconfirmed proposal, requalifying workflow.

Medium-confidence long-term rule is unchanged from 1D (clarification first; 1D conservative medium→review remains until adaptive questions exist). 1E does not turn every customer into mandatory review.

Architecture-gap TAX key frozen in v1: `manufacturing-and-production`. Missing pack for a recognized-but-unbuilt Context is `not_yet_supported`, not `unsupported`.

---

## K. Open Beta undefined

Requested rollout `open_beta`:

- support: `needs_review` / `open_beta_policy_undefined`
- admission: `blocked` / `blocked_policy`
- no admitted decision
- no inferred `beta_supported` rule

---

## L. DemandSignal

Commands: `joinBusinessActivityDemandWaitlist`, `withdrawBusinessActivityDemandWaitlist`.

Owner/Admin only. Staff/Viewer denied. One active signal per Activity + TAX target. Eligible only when current support status is `not_yet_supported`. Explicit command; evaluation failure does not auto-create demand.

Demand does not change TAX, Context, readiness, admission, login, membership, or entitlement.

Repeat join and repeat withdraw are idempotent (no extra event).

---

## M. Auth / roles

Order:

1. `auth.getUser()`
2. active Organization membership
3. exact Business Activity
4. role authorization
5. BQA qualification / current classification
6. Control Plane catalog reads
7. privileged BQA mutation

| Role | Read support/admission | Evaluate support/admission | Demand join/withdraw |
| --- | --- | --- | --- |
| Owner | yes | yes | yes |
| Admin | yes | yes | yes |
| Staff | yes | **no** | **no** |
| Viewer | read only | no | no |
| Suspended / foreign / unauthenticated | none / `ORG_NOT_FOUND` / `UNAUTHORIZED` | | |

Platform review is not implemented.

---

## N. Transaction boundary

Extended operations on existing `public.apply_business_qualification_mutation` (additive CREATE OR REPLACE; 1D SQL file not edited):

- `record_support_assessment` — assessment + pointer + `support_assessed` event
- `record_admission_decision` — decision + pointer + `admission_decided` event
- `join_demand_waitlist` / `withdraw_demand_waitlist` — signal mutation + event

Same `SECURITY DEFINER`, `search_path=""`, `auth.role() = service_role`, advisory lock, EXECUTE grant surface.

`begin_requalification` now supersedes current support/admission snapshots and clears those pointers so historical classification cannot remain current support/admission truth.

Forced later-step failure tests restore the memory snapshot: no assessment without event, no admission pointer without decision/event, no half-written demand.

---

## O. Idempotency

Identical support snapshot against the current pointer: no new row, no new event.

Identical admission snapshot against the same support assessment + policy: no new row, no new event.

Active waitlist join: no-op. Already-withdrawn / never-joined withdraw: no-op.

Changed catalog, readiness, classification, or rollout: new snapshot, old row superseded, new event. No DELETE.

---

## P. Staleness / reassessment

Support becomes stale when pack/version/readiness/classification/policy changes. 1E does not asynchronously mutate admission. Explicit `evaluateBusinessActivitySupport` / `evaluateBusinessActivityAdmission` reassess. Historical rows remain.

Admission requires a current support assessment whose `rollout_mode` and `classification_decision_id` match the requested evaluation. Otherwise `SUPPORT_ASSESSMENT_NOT_READY`.

---

## Q. Classification supersession handling

Requalification supersedes current support and admission and nulls qualification pointers. Evaluating support while `progress_status = requalifying` yields `needs_review` / `review_required` rather than silently reusing the historical confirmed target as eligible support.

No Activity Context repin.

---

## R. No Activity mutation

BQA 1E does not INSERT/UPDATE `organization_business_activities`. Classification matching an already-canonical Activity TAX is observation only. Activation, archive, and primary changes are out of scope.

---

## S. No Context mutation

No INSERT/UPDATE of `organization_context_assignments` or assignment events. No `assign_context_version`, `change_context_version`, or `apply_organization_context_platform_mutation`. Existing pin is read-only observation via `OrganizationContextRepository.getPinnedContextVersion`.

---

## T. No readiness mutation

No writes to `context_pack_readiness`. Observed readiness is snapshotted onto SupportAssessment only.

---

## U. No Path B effect

BQA does not call invitation, membership, or registration logic. Activity admission is independent of identity admission.

---

## V. No entitlement

Admission output is not capability enablement, permission change, role change, subscription change, or feature-flag change. CAP readiness is not consulted.

---

## W. No AI

No model invocation. No AI admission. Classification remains 1D structured proposal only.

---

## X. No product consumer

No Home, AppShell, navigation, onboarding, CRM, Social, Settings, or Members consumer. No public BQA API. No UI. No browser hook. No feature barrel.

---

## Y. Tests

| Suite | Result |
| --- | --- |
| BQA 1D regression | pass |
| Support policy matrix (all readiness × rollout including open_beta) | pass |
| Support evaluation (eligible, missing pack, no published version, insufficient readiness, architecture gap, unknown/ambiguous/unconfirmed, existing pin, multi-version, no auto-repin) | pass |
| Admission evaluation (internal_qa OCB context_ready admitted; closed_beta context_ready not admitted; closed_beta beta_supported admitted; production beta_supported not admitted; production production_verified admitted; open_beta blocked; review/not-yet-supported no auto-admit) | pass |
| Demand join/repeat/withdraw/Staff/Viewer deny / no join when supported | pass |
| Support/admission server commands, idempotency, requalify stale pointers, forged-eligibility ignored | pass |
| Transaction rollback (assessment, admission, demand) | pass |
| RPC/migration security | pass |
| BQA-1C / 1D isolation + non-effect | pass |
| Control Plane exact-pack-by-id + version list | pass |
| `npx tsc --noEmit` | pass |
| `npx next lint` | pass — no warnings or errors |
| `npx vitest run` | **3115 passed**, **2 failed**, **3117 total** |

Accepted historical failures only (unchanged; no new failures):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Accepted 1E-start baseline was 3069 passed / 2 failed / 3071 total. 1E added 46 passing tests.

---

## Z. Production untouched

This implementation phase did not apply the new migration and did not execute Owner support/admission/demand commands against Production.

| Invariant | Status |
| --- | --- |
| Frozen 1D SQL `20260826180000_add_business_qualification_classification_mutations.sql` | SHA-256 `6B52281B3EFD21A55E4833A65125219DDAB74F948B376934476E6B0E75203225` **unchanged** |
| New additive SQL `20260826190000_add_business_qualification_support_admission_mutations.sql` | SHA-256 `EF1E63A99B853B912842492478E5F32C205048CDE889C763FAF8D7FCE006FD46` — **not applied** |
| Generated types | unchanged (RPC signature already present; operations are `text` payload) |
| Production support assessments | **0** |
| Production admission decisions | **0** |
| Production demand signals | **0** |
| Retained 1D qualification fixture | untouched by this phase |
| Context readiness | unchanged |
| Path B / Social | unchanged |

Recommended next phase: **BQA-1E-FV — CONTROLLED PRODUCTION SUPPORT + ADMISSION VERIFICATION**, using the retained OCB fixture to prove `internal_qa` eligible/admitted and `closed_beta` not_yet_supported / not admitted, with Activity mutation = 0, Context assignment mutation = 0, and Context readiness mutation = 0.

Do not implement 1E-FV from this document automatically.
