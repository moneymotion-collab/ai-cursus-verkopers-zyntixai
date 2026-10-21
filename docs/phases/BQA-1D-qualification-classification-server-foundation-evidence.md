# BQA-1D — Qualification + Classification Server Foundation

| Field | Value |
| --- | --- |
| Phase | **BQA-1D — QUALIFICATION + CLASSIFICATION SERVER FOUNDATION** |
| Parent | BQA-1C / BQA-1C-FV |
| Document type | Implementation evidence (server/domain/RPC contract only) |
| Date | 2026-08-26 |
| Formal status | `BQA-1D CLOSED WITH EVIDENCE — QUALIFICATION + CLASSIFICATION SERVER FOUNDATION IMPLEMENTED AND FROZEN` |
| Governing contract | `docs/phases/BQA-1B-business-qualification-admission-domain-schema-contract.md` |
| Governing database | `docs/phases/BQA-1C-business-qualification-admission-database-foundation-evidence.md` |
| Production database verification | `docs/phases/BQA-1C-FV-controlled-production-database-foundation-verification-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `cb8862cebc34e7077960fd44571385b8ef4ace8a` |
| Production apply | **NOT APPLIED** |
| Production BQA rows | **0** (unchanged; this phase did not contact Production data) |

This phase implements authenticated Business Qualification reads and governed classification commands. It does **not** call an AI model, evaluate support or admission, mutate Activity TAX, assign or repin Context, change Path B, or expose a product UI / public API.

**BQA QUALIFICATION SERVER: IMPLEMENTED**

**BQA CLASSIFICATION SERVER: IMPLEMENTED**

**AI CLASSIFICATION MODEL: NOT IMPLEMENTED**

**BQA SUPPORT ENGINE: NOT IMPLEMENTED**

**BQA ADMISSION ENGINE: NOT IMPLEMENTED**

**ACTIVITY CLASSIFICATION HANDOFF: NOT IMPLEMENTED**

**CONTEXT ASSIGNMENT HANDOFF: NOT IMPLEMENTED**

**PRODUCTION BQA QUALIFICATION DATA: 0**

**BQA-1D PRODUCTION QUALIFICATION VERIFICATION = NOT YET PERFORMED**

---

## A. Starting baseline

Proven before any 1D file was added:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `cb8862cebc34e7077960fd44571385b8ef4ace8a` |
| Subject | `docs(bqa): record Production database verification` |
| Divergence | `0 0` |
| Worktree at 1D start | clean |

Hard gate passed. BQA-1C-FV is CLOSED. Production-verified BQA database baseline proven.

---

## B. BQA-1C Production dependency

| Check | Value |
| --- | --- |
| BQA-1C | CLOSED — seven-table foundation frozen |
| BQA-1C-FV | CLOSED — Production schema verified |
| Frozen table SQL | `20260826170000_create_business_qualification_admission_foundation.sql` SHA-256 `D4EDC741D63BFE83E8C3773F5ED226EDD106723437988F0E56B1D355A8033C45` |
| Frozen RLS SQL | `20260826170010_enable_business_qualification_admission_rls.sql` SHA-256 `09181FED5DB45BAC668205E7212070B0148D8C258CFC29EA58E9BF9948DA2B4F` |
| Generated types | already include the seven BQA tables in `src/types/database.generated.ts` |
| Production BQA rows at 1C-FV close | 0 across all seven tables |
| Retained QA Activity | outside BQA (1 Activity, 1 active Context assignment, 2 ORG-CONTEXT events) |
| Context readiness | `context_ready`, `verified_at` NULL |

1C migration files were **not** edited. No migration repair. No `db push`. No Production apply in 1D.

---

## C. Domain model

Pure modules under `src/features/business-qualification/domain/**`. They do not import `server-only`, Supabase, Next runtime, environment, Social, or ORG-CONTEXT mutation.

| Module | Owns |
| --- | --- |
| `errors.ts` | Stable BQA error codes and `BqaResult` |
| `types.ts` | Qualification, answer, decision, event, and command types |
| `questions.ts` | v1 allowlist, coded contracts, completeness |
| `authorization.ts` | Role matrix for commands and event visibility |
| `progress.ts` | Completeness vs review vs awaiting confirmation |
| `classification.ts` | Confidence, unknown/ambiguous, confirmation gates, evidence sanitization |

Completeness is qualification progress only. It is not support, admission, entitlement, or Context assignment.

---

## D. Server architecture

Server-only path: `src/features/business-qualification/server/**`.

Every privileged module imports `server-only`. There is no feature barrel, no `"use server"` action, no React hook, no `src/app` consumer, and no public API route.

| Module | Role |
| --- | --- |
| `tenant-authorization.ts` | `getUser()` → active Organization → exact membership/role |
| `activity-lookup.ts` | Exact Activity via ORG-CONTEXT **read** repository (tenant-constrained) |
| `taxonomy-target.ts` | Control Plane TAX resolve-by-id; ignore caller key/kind snapshot |
| `business-qualification.repository.ts` | Tenant-constrained BQA reads |
| `bqa-query.ts` | Allowlisted BQA + membership/org read tables |
| `bqa-rpc.ts` | Named mutation dispatcher only |
| `bqa-client.ts` | Sole BQA construction of the privileged database client |
| `business-qualification.service.ts` | Command orchestration + `createBusinessQualificationService()` |

Command grain is always `organizationId` + `businessActivityId`. No default Organization, first membership, or primary Activity.

---

## E. Authentication and role matrix

Order is frozen:

1. `createSupabaseServerClient()` → `auth.getUser()`
2. active Organization membership
3. exact Business Activity belonging to that Organization
4. role gate
5. Control Plane TAX validation where required
6. privileged atomic BQA mutation

`service_role` is database execution machinery. It is not caller identity, Organization authorization, classification authority, or platform-review identity.

| Role | Read | Init / answers | Propose / confirm / requalify / review |
| --- | --- | --- | --- |
| Owner | yes | yes | yes |
| Admin | yes | yes | yes |
| Staff | yes | yes | **no** |
| Viewer | read only | no | no |
| Suspended / foreign / non-member | `ORG_NOT_FOUND` (tenant-honest) | | |
| Unauthenticated | `UNAUTHORIZED` | | |

Events are returned only to Owner/Admin (`events: null` for Staff/Viewer).

Denied callers are proven not to invoke `mutate.rpc`.

---

## F. Tenant honesty

Foreign Organization, missing membership, and suspended membership all return `ORG_NOT_FOUND`.

Foreign or archived Activity mutations return `ACTIVITY_NOT_FOUND`. No cross-tenant existence leakage.

---

## G. Qualification initialization and read model

`ensureBusinessActivityQualification({ organizationId, businessActivityId })`:

- returns the existing aggregate when present (idempotent)
- otherwise creates exactly one qualification (`progress_status = unstarted`) and appends `qualification_started`
- concurrent-safe via advisory transaction lock class `872012` keyed by Organization + Activity
- does not classify, activate, or assign Context

`getBusinessActivityQualification(...)` returns a stable aggregate:

- qualification
- current answers
- completeness
- current classification decision (if any)
- classification history summary
- events where the role permits

It does not return support/admission calculations.

---

## H. Question contract and answer mutation

Frozen v1 keys (exact BQA-1B vocabulary; UI wording is not canonical):

| Key | Contract |
| --- | --- |
| `activity_description` | meaningful non-empty text, 1–8000 |
| `primary_value_delivered` | `structured_programs` \| `individualized_service` \| `physical_product` \| `digital_product` \| `field_work` |
| `line_structure` | `one_line` \| `several_lines` |

Adaptive keys are **not** a generic form engine. v1 allowlist is those three keys only. Unknown keys → `QUESTION_NOT_ALLOWED`. Invalid coded values → `INVALID_ANSWER`.

`saveQualificationAnswer`:

- Owner/Admin/Staff
- qualification resolved from Organization + Activity (client `qualificationId` is not trusted)
- auto-initializes the aggregate when missing
- same exact value: idempotent, no duplicate event
- changed value: updates current answer and emits one `answer_saved` with `{ question_key, change }`
- does not persist the free-text business description in event metadata (1D data-minimization freeze)

`line_structure = several_lines` sets `split_recommended = true`. 1D does not create a second Activity or Business Unit.

---

## I. Classification proposal, TAX, confidence, unknown/ambiguous, review

`recordClassificationProposal` is AI-ready structured input only. No model is invoked.

Caller may supply a candidate TAX id. The server independently resolves canonical kind/id/key/release from Control Plane. Client-supplied key/kind snapshots are ignored. Unknown id → `CLASSIFICATION_TARGET_NOT_FOUND`. Draft/non-active → `CLASSIFICATION_TARGET_INVALID`.

Confidence bands: `high` | `medium` | `low` | `none`. No numeric model score is authority.

| Outcome / band | Confirmation | Review |
| --- | --- | --- |
| classified + high + no unresolved + no split | eligible | none |
| medium, unresolved medium, low, none | blocked | `needs_review` / `review_status = required` |
| unknown | no TAX target confirmed | review required |
| ambiguous | bounded alternative ids only; no auto-pick | review required |
| architecture_gap | blocked | review required |
| split unresolved | blocked | review required |

Unknown is valid. Nearest TAX fallback is forbidden.

`proposal_source` may be `ai_proposal` (structured future classifier). `ai_proposal` cannot become `decision_source`. Tenant commands never emit `platform_review`, `migration`, or `support_assisted` as confirmation source.

No ReviewRequest table. Review is `review_status` + events. No reviewer queue, SLA, or platform-review authority.

---

## J. Confirmation, requalification, supersession

`confirmClassification` is Owner/Admin only. Staff/Viewer → `FORBIDDEN_ROLE`.

Atomic effect:

- insert a **new** confirmed `ClassificationDecision` (1C forbids updating `proposed` → `confirmed`)
- point qualification `current_classification_decision_id` at it
- set `progress_status = confirmed`
- append `classification_confirmed`

It does **not** mutate `organization_business_activities`, activate the Activity, assign Context, evaluate admission, or grant entitlement.

Same confirmed TAX target + release against unchanged current state: idempotent no-op.

Different target while still `confirmed`: `REQUALIFICATION_REQUIRED`.

`beginRequalification` (Owner/Admin):

- preserves previous decision/history and current answers
- sets `progress_status = requalifying`
- does not mutate Activity classification or Context assignment
- repeat while already requalifying: idempotent

Supersession is insert/status-only:

- old confirmed → `superseded` (no DELETE, no rewrite of old target)
- new confirmed → current
- pointer moves
- `classification_superseded` + `classification_confirmed` events
- all in one transaction

Hybrid split: confirmation fails with `CLASSIFICATION_REVIEW_REQUIRED`. No second Activity is created.

Confirmation `decision_source` is derived from actor role: Owner → `user_self`, Admin → `organization_admin`. Client cannot self-assert `platform_review` / `migration` / `support_assisted` / `ai_proposal`.

---

## K. Transaction and RPC boundary

Multi-row canonical commands cannot tolerate partial success. They all go through one purpose-bounded dispatcher:

`public.apply_business_qualification_mutation`

Operations: `ensure_qualification`, `save_answer`, `record_proposal`, `confirm_classification`, `begin_requalification`, `request_review`.

| Property | Contract |
| --- | --- |
| `SECURITY DEFINER` | yes, necessary for the bounded write |
| `search_path` | `''` |
| in-function role check | `auth.role() = service_role` |
| EXECUTE | revoked from public/anon/authenticated; granted only to `service_role` |
| tenant re-check | Organization exists/active; qualification tenant columns match |
| idempotency | encoded per operation |
| ORG-CONTEXT DML | none |
| support / admission / demand DML | none |
| Path B / Social DML | none |
| dynamic SQL | none |
| caller authorization | **not** performed here; already proven in application server code |

Memory mutation tests force failure after a later write and restore the snapshot: no partial qualification, no orphan decision, no current pointer without decision, no event for a rolled-back mutation, no superseded old decision without a new current decision.

Additive migration (local contract only):

| File | SHA-256 |
| --- | --- |
| `supabase/migrations/20260826180000_add_business_qualification_classification_mutations.sql` | `6B52281B3EFD21A55E4833A65125219DDAB74F948B376934476E6B0E75203225` |

---

## L. Events and data minimization

Emitted in 1D:

- `qualification_started`
- `answer_saved` (`question_key`, `change`)
- `classification_proposed` (decision id, outcome, confidence, target id/key)
- `classification_confirmed`
- `classification_superseded`
- `review_requested`
- `requalify_started`

Not stored: full activity description, tokens, cookies, JWTs, prompts, chain-of-thought.

1B listed additional event types (`support_assessed`, `admission_decided`, waitlist, assignment handoff, `review_resolved`). Those remain unimplemented; they belong to later engines.

---

## M. Privileged writer and service_role separation

`createSupabaseServiceRoleClient` appears in BQA `src` **only** in `bqa-client.ts`. Security-boundary allowlist updated accordingly.

Named commands only. The raw privileged client is not returned to feature callers.

Reads of BQA tables use the same privileged query client **after** tenant authorization, always scoped by `organization_id` + `business_activity_id`.

Control Plane `TaxonomyRepository.getNodeById` received an explicit return-type annotation only. No Control Plane behavior change. No TAX writes.

---

## N. Non-effects

| Surface | 1D result |
| --- | --- |
| `business_activity_support_assessments` | 0 writes |
| `business_activity_admission_decisions` | 0 writes |
| `business_activity_demand_signals` | 0 writes |
| `organization_business_activities` | 0 writes |
| `organization_context_assignments` | 0 writes |
| `apply_organization_context_platform_mutation` / `classify_activity` / archive / set-primary | not imported/called |
| Context Resolver | not invoked |
| Path B registration/invitations/memberships | unchanged |
| OpenAI / Anthropic / Gemini / embeddings / prompts | none |
| Home / AppShell / onboarding / CRM / Social / Settings / Members | no BQA imports |
| Public API / browser route / Server Action | none |

Activity lookup uses `OrganizationContextRepository.getBusinessActivity` (read). That is not Activity classification handoff.

---

## O. Generated types

`src/types/database.generated.ts` is **unchanged**. The new RPC is not in generated `Functions` until Production apply + typegen in **BQA-1D-FV**. Server code uses a named constant, not `satisfies keyof Database["public"]["Functions"]`.

---

## P. Tests

| Suite | Result |
| --- | --- |
| BQA domain | pass |
| BQA authorization (unauthenticated / foreign / suspended / role matrix / deny-before-RPC) | pass |
| BQA qualification (create-once, idempotent init, foreign/archived Activity, answers, invalid keys/codes, incompleteness) | pass |
| BQA classification (canonical TAX, ignored claimed key, unknown/draft, high/medium/low/none, unknown/ambiguous, split, Owner/Admin confirm, Staff/Viewer deny, AI cannot self-confirm, confirm idempotency, requalify + supersession) | pass |
| BQA transaction rollback | pass |
| BQA repository mapping | pass |
| BQA-1D server isolation | pass |
| BQA mutation migration security | pass |
| BQA-1C runtime/migration isolation (consumers now include `src/features/business-qualification/`) | pass |
| Control Plane reader security | pass |
| ORG-CONTEXT isolation | pass |
| Context Resolver isolation | pass |
| Path B / invitation security | historical failure only (below) |
| Social isolation | pass |
| `npx tsc --noEmit` | pass |
| `npx next lint` | pass — no warnings or errors |
| `npx vitest run` | **3069 passed**, **2 failed**, **3071 total** |

Accepted historical failures only (unchanged; no new failures):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Accepted 1D-start baseline was 3024 passed / 2 failed / 3026 total. 1D added 45 passing tests.

---

## Q. Pre-commit review

- Authenticate first; explicit Organization; explicit Activity.
- Denied callers never reach the privileged mutation client.
- Staff may save answers; may not confirm, supersede, or requalify.
- Viewer is read-only.
- TAX identity is server-resolved from Control Plane.
- Confirmation and supersession are atomic with events.
- No Activity TAX mutation, Context assignment, support/admission writes, Path B mutation, AI model call, product consumer, or Production data write.

---

## R. Production status

Implementation did not apply the RPC migration and did not create a QA qualification.

| Invariant | Status |
| --- | --- |
| Production BQA rows | remain 0 (not applied; not executed) |
| QA Activity | unchanged by this phase |
| QA Context assignment | unchanged by this phase |
| Context readiness | unchanged by this phase |
| TAX / CAP / CTX / Path B / Social gates | unchanged by this phase |

---

## S. Blockers for Production verification

1. Targeted apply of `20260826180000_add_business_qualification_classification_mutations.sql` only.
2. Verify RPC EXECUTE grants and `search_path`.
3. Regenerate Production types so `apply_business_qualification_mutation` appears in `Functions`.
4. Create **one** controlled Production QA qualification via real server commands.
5. Prove init / answers / proposal / confirm against that Activity.
6. Prove Activity TAX, Context assignment, Context readiness, support, admission, and demand remain unchanged.
7. Clean up only if the frozen fixture policy requires it.

---

## T. Recommended next phase

**BQA-1D-FV — CONTROLLED PRODUCTION QUALIFICATION + CLASSIFICATION VERIFICATION**

Do not implement support/admission (BQA-1E), Activity classification handoff, Context assignment, AI classification, onboarding UI, or product UI in that verification phase.
