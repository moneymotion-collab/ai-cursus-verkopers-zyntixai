# BQA-1F-FV — Controlled Production Governed Handoff Verification

| Field | Value |
| --- | --- |
| Phase | **BQA-1F-FV — CONTROLLED PRODUCTION GOVERNED HANDOFF VERIFICATION** |
| Parent | BQA-1F-R |
| Document type | Production verification evidence |
| Date | 2026-08-27 |
| Formal status | `BQA-1F-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION GOVERNED ACTIVITY + CONTEXT HANDOFF VERIFIED` |
| Governing implementation | `docs/phases/BQA-1F-R-governed-activity-context-assignment-handoff-implementation-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `6413fc923a8f436edde4f0c0916f5f67db33d15b` |
| Production schema | **APPLIED** (targeted MCP apply of frozen BQA-1F-R SQL only) |
| Dedicated QA fixture | **RETAINED** (`qa_bqa_handoff_first_time_v1`) |

This phase production-verifies the frozen BQA-1F-R atomic governed handoff on a **new dedicated draft Activity**. It does **not** refresh retained internal_qa support, delete audit history, promote Context readiness, enable Path B, grant entitlement, execute Social, wire onboarding, or expose product UI.

**BQA FIRST-TIME PRODUCTION HANDOFF = VERIFIED**

**BQA DESIRED-STATE HANDOFF IDEMPOTENCY = VERIFIED**

**BQA GOVERNED HANDOFF SOURCE = bqa_confirmed**

**PLATFORM OPERATOR IMPERSONATION = 0**

**ACTIVITY CLASSIFICATION HANDOFF = PRODUCTION VERIFIED**

**ACTIVITY ACTIVATION HANDOFF = PRODUCTION VERIFIED**

**CONTEXT ASSIGNMENT HANDOFF = PRODUCTION VERIFIED**

**AUTO REPIN = 0**

**HISTORICAL ADMISSION AS BEARER TOKEN = DENIED**

**CROSS-ROLLOUT AUTHORITY = DENIED**

**CONTEXT READINESS MUTATION = 0**

**ENTITLEMENT MUTATION = 0**

**PATH B MUTATION = 0**

**SOCIAL EXECUTION = 0**

**ONBOARDING = NOT IMPLEMENTED**

---

## A. Starting repository state

Proven before fixture creation (typegen already completed and pushed):

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `6413fc923a8f436edde4f0c0916f5f67db33d15b` |
| Subject | `chore(bqa): sync Production handoff types` |
| Divergence | `0 0` |
| Worktree | clean |

Required Production-verified dependencies remained closed: ORG-CONTEXT-1, ORG-CONTEXT BQA governed authority, CONTEXT-RESOLVER-1, BQA database / qualification / support+admission foundations, BQA-1F-R implemented and frozen.

**BQA-1F-FV MIGRATION + SECURITY PREFLIGHT = PASS** (completed before owner fixture authorization).

---

## B. Production target

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Canonical app | `https://www.zyntixai.com` |
| QA Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (`ZyntixAI Production QA`) |

No service-role JWT, database password, cookie, or access token is recorded here.

---

## C. Migration hash

| Check | Value |
| --- | --- |
| Local filename | `supabase/migrations/20260827120000_add_business_qualification_assignment_handoff.sql` |
| SHA-256 | `11EBE1AAAA07F6EE4AE6763AA1EF6C63A1F3F667C2DF5893788DBBF8C9057406` |
| Recalculated before apply | **exact match** |
| Frozen file edited | **no** |

---

## D. Targeted apply

| Check | Value |
| --- | --- |
| Method | MCP `apply_migration` of the exact frozen SQL |
| Not used | `supabase db push`, reset, repair, blind pull |
| MCP name | `add_business_qualification_assignment_handoff` |
| Remote version | `20260827102408` |
| Apply result | **success** |
| Unrelated migrations | **none** |

---

## E. RPC security

Live `public.apply_business_qualification_assignment_handoff(uuid, uuid, uuid, uuid, text)`:

| Check | Live value |
| --- | --- |
| Owner | `postgres` |
| `SECURITY DEFINER` | true |
| `search_path` | `''` |
| PUBLIC EXECUTE | **false** |
| anon EXECUTE | **false** |
| authenticated EXECUTE | **false** |
| service_role EXECUTE | **true** |

Nested ORG-CONTEXT calls are only `public.apply_organization_context_bqa_mutation` for `classify_activity`, `activate_activity`, `assign_context_version`. Nested `ok != true` raises `P0001` `HANDOFF_NESTED:<CODE>`. Lock order **872011 → 872012**. No `apply_organization_context_platform_mutation`, no `change_context_version`, no direct Activity/assignment DML.

---

## F. Typegen

After apply, linked Production types were regenerated with `npm run supabase:types`. Diff was additive only: `apply_business_qualification_assignment_handoff`. `BQA_HANDOFF_RPC` was constrained by `keyof Database["public"]["Functions"]`. Commit `6413fc923a8f436edde4f0c0916f5f67db33d15b` `chore(bqa): sync Production handoff types`. No hand-edit. No unrelated destructive type drift.

---

## G. Migration zero-data effect

Immediately after apply, before fixture creation:

| Check | Value |
| --- | --- |
| Organizations | 6 |
| QA Activities | 1 |
| Assignments | 1 |
| Superseded assignments | 0 |
| ORG-CONTEXT events | 2 |
| BQA | 1 / 3 / 2 / 10 / 2 / 2 / 0 |
| TAX / CAP / CTX | 1 / 4 / 22 / 1 / 0 / 0 / 2 · 13 / 7 / 13 · 2 / 2 / 10 / 4 / 2 |

The migration created capability, not tenant state.

---

## H. Owner authentication

Live Owner harness used gitignored local launchers only (`playwright/.auth/run-bqa-1f-fv.ps1`).

| Check | Evidence |
| --- | --- |
| `auth.getUser` | **PASS** |
| Session manufacture | none; existing QA Owner storage used locally and not committed |
| Active membership | **owner** on exact QA org `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| service_role as Owner identity | **not used** |

---

## I. Platform-authorized fixture creation

Creation used the established application path only:

`OrganizationContextService.createBusinessActivity` → `requireOperator()` → `invokeOrgContextPlatformMutation` → `public.apply_organization_context_platform_mutation` → `private.apply_organization_context_mutation` (`create_activity`).

Operator identity was `resolveOrgContextPlatformOperator` with process-local enablement + allowlist for the authenticated user email. Owner role alone was not treated as operator authority. Direct INSERT, direct service_role RPC shortcut, and BQA wrapper `create_activity` were not used.

---

## J. Explicit owner fixture authorization

Owner confirmation received:

`BQA-1F-FV DEDICATED INTERNAL_QA FIXTURE CREATION = AUTHORIZED`

Key collision recheck immediately before creation: `qa_bqa_handoff_first_time_v1` **did not exist**.

---

## K. Dedicated draft initial state

Created Activity:

| Field | Value |
| --- | --- |
| id | `3612fd93-d1a1-491f-ba29-56fba767c55b` |
| organization | QA org `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| `activity_key` | `qa_bqa_handoff_first_time_v1` |
| display name | `BQA Handoff First Time QA` |
| initial status | `draft` |
| initial classification | none |
| initial primary | **false** |
| initial assignment | none |
| create event | `business_activity_created` |
| create source | `platform_operator` |
| create timestamp | `2026-08-27 10:47:18.684881+00` |

Post-create: QA Activities **2**. Retained Activity unchanged and still primary.

---

## L. BQA qualification

Real Owner `ensureBusinessActivityQualification` on the new Activity.

| Check | Value |
| --- | --- |
| Qualification id | `48b02e7a-e0d8-4626-9411-adf337438b4e` |
| First ensure | non-idempotent (`qualification_started` `2026-08-27 10:47:19.480502+00`) |
| Repeat ensure | idempotent (no extra start event) |
| Activity mutation | **0** |

---

## M. Answers

Three controlled non-sensitive answers (same OCB semantics as prior QA proof):

| question_key | value |
| --- | --- |
| `activity_description` | short generic controlled QA description |
| `primary_value_delivered` | `structured_programs` |
| `line_structure` | `one_line` |

Answer count on the new fixture: **3**. Same-value description repeat: idempotent. Raw secret/user PII: **none**.

---

## N. BQA classification

High-confidence proposal for exact canonical `niche.online-course-business` (`9831efc8-b7ce-4726-be96-f5a061f21951`). Server canonicalized TAX (claimed kind/key were not trusted). Owner confirmed.

| Check | Value |
| --- | --- |
| Proposed decision | 1 |
| Confirmed decision id | `34e697da-abdb-48d6-85e0-4fa8b77b5bcf` |
| Progress | `confirmed` |
| Review | `none` |
| Canonical Activity after confirm | still `draft` / unclassified / unassigned |

BQA confirmation itself had **zero** ORG-CONTEXT effect.

---

## O. Support

`evaluateBusinessActivitySupport` for `internal_qa`:

| Check | Value |
| --- | --- |
| Assessment id | `ac31294f-d620-4933-abd4-9803da36bf63` |
| Status | `supported_for_requested_rollout` |
| Reason | `eligible` |
| Context version | `1b942da6-9472-4520-a004-3d68096b44ff` |
| Readiness observed | `context_ready` |
| Activity / assignment mutation | **0** |

---

## P. Admission

`evaluateBusinessActivityAdmission` for `internal_qa`:

| Check | Value |
| --- | --- |
| Admission id | `d4ec3853-e8ce-43d5-8f08-ed2e3834c05c` |
| Status | `admitted` |
| Reason | `eligible` |
| Rollout | `internal_qa` |
| Automatic handoff | **0** |

---

## Q. Proof admission caused no automatic handoff

Timeline on the new fixture:

| Time (UTC) | Event |
| --- | --- |
| `10:47:23.630796` | `admission_decided` |
| `10:47:25.951286` | `assignment_handoff_requested` + `assignment_handoff_completed` and the three ORG-CONTEXT handoff events |

Between admission and handoff the Owner JWT direct RPC probe ran and was denied (`42501`). Canonical Activity remained draft / unclassified / unassigned until the explicit server handoff.

**ADMISSION AUTO-HANDOFF = 0**

---

## R. Pre-handoff snapshot

| Field | Value |
| --- | --- |
| Activity | `3612fd93-d1a1-491f-ba29-56fba767c55b` |
| Status | `draft` |
| Classification | none |
| Primary | false |
| Assignment | none |
| Qualification | `48b02e7a-e0d8-4626-9411-adf337438b4e` |
| Confirmed classification | `34e697da-abdb-48d6-85e0-4fa8b77b5bcf` |
| Support | `ac31294f-d620-4933-abd4-9803da36bf63` |
| Admission | `d4ec3853-e8ce-43d5-8f08-ed2e3834c05c` |
| Rollout | `internal_qa` |
| Intended Context version | `1b942da6-9472-4520-a004-3d68096b44ff` |
| ORG events attributable to fixture | create only (`platform_operator`) |

---

## S. First-time handoff

Actual server entrypoint:

`applyBusinessActivityAdmissionHandoff({ organizationId, businessActivityId, admissionDecisionId, rolloutMode: "internal_qa" })`

The handoff RPC was **not** the primary business proof.

First live result (Owner path, before local same-timestamp event-order assertion):

| Field | Value |
| --- | --- |
| ok | true |
| idempotent | false |
| classificationApplied | true |
| activationApplied | true |
| assignmentApplied | true |

The first harness then failed a **local** assertion that required UUID-ordered event sequence. The three handoff ORG-CONTEXT events share timestamp `2026-08-27 10:47:25.951286+00`; UUID sort is not semantic order. Production nested order remains classify → activate → assign inside one transaction. No second fixture was created. Remaining proofs resumed against this authorized fixture.

---

## T. Classification transition

Canonical Activity TAX after first handoff: `niche` / `9831efc8-b7ce-4726-be96-f5a061f21951` (`online-course-business`).

ORG event: `business_activity_classified` / `bqa_confirmed`.

---

## U. Activation transition

Canonical status: `active`. Primary remains **false**.

ORG event: `business_activity_activated` / `bqa_confirmed`.

---

## V. Context assignment

| Field | Value |
| --- | --- |
| Assignment id | `b4d5983b-59f1-4f54-92bd-7b22702a67f6` |
| Context version | `1b942da6-9472-4520-a004-3d68096b44ff` (OCB v1) |
| Status | `active` |
| Source | `bqa_confirmed` |
| Superseded at | NULL |

ORG event: `context_version_assigned` / `bqa_confirmed`.

---

## W. Cross-domain provenance

| Event | Source |
| --- | --- |
| `business_activity_created` | `platform_operator` |
| `business_activity_classified` | `bqa_confirmed` |
| `business_activity_activated` | `bqa_confirmed` |
| `context_version_assigned` | `bqa_confirmed` |

No `platform_operator` source on classify / activate / assign. Setup authority is not conflated with handoff authority.

---

## X. BQA handoff audit

New fixture BQA events (10):

`qualification_started`, `answer_saved` ×3, `classification_proposed`, `classification_confirmed`, `support_assessed`, `admission_decided`, `assignment_handoff_requested`, `assignment_handoff_completed`.

Requested and completed are tied to the exact Activity, AdmissionDecision `d4ec3853-e8ce-43d5-8f08-ed2e3834c05c`, and `internal_qa`. No secret / full Context payload.

---

## Y. Atomic final state

After first handoff all of the following were simultaneously true:

- Activity `active`
- Canonical TAX exact OCB
- Context assignment exact OCB v1
- Assignment source `bqa_confirmed`
- ORG events complete truthful set
- BQA completed event present

No partial result. Frozen rollback tests remain the failure-path authority. Production was not deliberately corrupted.

---

## Z. Repeat handoff idempotency

Exact same Owner entrypoint, Organization, Activity, AdmissionDecision, and `internal_qa` — **without** re-evaluating support/admission.

| Field | Value |
| --- | --- |
| ok | true |
| idempotent | true |
| classificationApplied | false |
| activationApplied | false |
| assignmentApplied | false |
| assignmentId | unchanged `b4d5983b-59f1-4f54-92bd-7b22702a67f6` |

This dedicated fixture is the authoritative Production desired-state idempotency proof.

---

## AA. Retained closed_beta denial

Retained AdmissionDecision `397c241f-32a4-46d8-b162-b0eacee5608d` with requested rollout `closed_beta`:

**ADMISSION_NOT_ELIGIBLE**

Privileged writer not reached as a successful mutation. Retained Activity unchanged.

---

## AB. Historical admission stale denial

Historical retained AdmissionDecision `4ff288ac-a6ac-4ff0-8ccd-fd44284d4fe2` with requested rollout `internal_qa`:

**SUPPORT_ASSESSMENT_NOT_READY**

Linked support was superseded by the later closed_beta evaluation. Historical admission is not a permanent bearer token. No fresh internal_qa support/admission was created on the retained Activity.

---

## AC. Cross-rollout denial

Same historical internal_qa AdmissionDecision with requested rollout `closed_beta`:

**ROLLOUT_MISMATCH**

Zero ORG-CONTEXT mutation.

---

## AD. Direct RPC denial

Authenticated Owner JWT against `apply_business_qualification_assignment_handoff`:

| Check | Value |
| --- | --- |
| Result | permission denied |
| Code | `42501` |
| Mutation | **0** |

ACL remains PUBLIC/anon/authenticated **no EXECUTE**, service_role **EXECUTE**.

Unauthenticated server entrypoint: `UNAUTHORIZED`; privileged handoff spy not called.

---

## AE. Readiness non-effect

| Pack | Readiness | `verified_at` | `updated_at` |
| --- | --- | --- | --- |
| `foundation.knowledge` | `context_ready` | NULL | `2026-08-24 18:54:59.603485+00` |
| `niche.online-course-business` | `context_ready` | NULL | `2026-08-24 18:54:59.603485+00` |

Handoff succeeded because rollout = `internal_qa`. It did not promote Context readiness.

**CONTEXT READINESS MUTATION = 0**

CAP remains **13 / 7 / 13**. CAP readiness played no handoff-authority role.

---

## AF. Entitlement non-effect

No feature entitlement, permission, membership role, subscription, or feature-flag change. Memberships remain **22**. Invitations remain **16**.

**ENTITLEMENT MUTATION = 0**

**PERMISSION MUTATION = 0**

---

## AG. Path B

`GET https://www.zyntixai.com/register` still returns sign-in with “Public registration is currently unavailable.” Organizations remain **6**. No new auth user / membership / invitation as a consequence of BQA.

**PATH B MUTATION = 0**

---

## AH. Social

| Check | Result |
| --- | --- |
| `private.social_publishing_execution_enabled()` | **false** |
| GUC `zyntix.social_scheduling_enabled` | unset |
| Cron | jobid **1**, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active |
| `social_publication_events` | **52** (unchanged) |
| Provider write attributable to BQA | **0** |

**SOCIAL EXECUTION = 0**

---

## AI. TAX / CAP / CTX

Unchanged:

| Registry | Counts |
| --- | --- |
| TAX | 1 / 4 / 22 / 1 / 0 / 0 / 2 |
| CAP | 13 / 7 / 13 |
| CTX | 2 / 2 / 10 / 4 / 2 |

No catalog DML.

---

## AJ. Resolver downstream proof

Read-only Owner path:

`resolveBusinessActivityContext({ organizationId: QA_ORG, activityId: NEW_FIXTURE, mode: "internal_qa" })`

| Check | Value |
| --- | --- |
| Result | **PASS** |
| Pack | `niche.online-course-business` v1 |
| Path | Knowledge → Education & Learning → Online Course Business |
| Relevant capabilities | 13 |

Resolver is downstream compatibility evidence only. It did **not** authorize the handoff.

---

## AK. Final Production fixtures / counts

Authorized QA Activity count change **1 → 2** is FV data, not drift. The dedicated fixture is retained.

| Fixture | id | status | primary | TAX | pin | source |
| --- | --- | --- | --- | --- | --- | --- |
| Retained `qa_online_course_business` | `07e6918e-6c13-437e-b698-f0f3be27e9bb` | active | true | OCB niche | `dba4065d-b7f6-4076-b9a5-610141d41807` / OCB v1 | `platform_operator` |
| New `qa_bqa_handoff_first_time_v1` | `3612fd93-d1a1-491f-ba29-56fba767c55b` | active | false | OCB niche | `b4d5983b-59f1-4f54-92bd-7b22702a67f6` / OCB v1 | `bqa_confirmed` |

Retained Activity `updated_at` remains `2026-08-25 10:49:13.19796+00`. Its ORG-CONTEXT history remains its original two events. Retained support **2** / admission **2** (no new rows during 1F-FV).

| Registry | Baseline | Final |
| --- | --- | --- |
| Organizations | 6 | 6 |
| QA Activities | 1 | **2** |
| Assignments | 1 | **2** |
| Superseded assignments | 0 | 0 |
| ORG-CONTEXT events | 2 | **6** |
| Qualifications | 1 | **2** |
| Answers | 3 | **6** |
| Classification decisions | 2 | **4** |
| Support assessments | 2 | **3** |
| Admission decisions | 2 | **3** |
| Demand signals | 0 | 0 |
| BQA events | 10 | **20** |

ORG-CONTEXT event delta = fixture create + three first-handoff transitions. Second handoff event delta = **0**.

Global BQA event types: `qualification_started` 2, `answer_saved` 6, `classification_proposed` 2, `classification_confirmed` 2, `support_assessed` 3, `admission_decided` 3, `assignment_handoff_requested` 1, `assignment_handoff_completed` 1.

---

## AL. Secret cleanup

| Check | Result |
| --- | --- |
| Collection | `Read-Host -AsSecureString` |
| Conversion | `SecureStringToBSTR` → `PtrToStringBSTR` |
| Cleanup | `ZeroFreeBSTR` + `Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY` in `finally` |
| Persistence | not written to `.env`, Vercel pull, disk evidence, or result JSON |
| Process-local key after completion | **CLEARED** |
| Harness files committed | **no** (`/playwright/.auth/` gitignored) |

---

## AM. Tests

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** |
| `npx next lint` | **PASS** (no warnings or errors) |
| `npx vitest run` | **3166 passed / 2 failed / 3168 total** |

Only accepted historical failures:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failure. No generated-type assertion delta.

Coverage included BQA-1D/1E regression, ORG-CONTEXT 1X authority, BQA-1F domain/authorization/atomicity/idempotency/concurrency, migration/RPC security, Control Plane, Context Resolver, Path B/invitation, and Social isolation.

---

## AN. Final git state

Evidence-only commit after this document. Typegen commit `6413fc9` was not amended.

| Check | Required |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence after push | `0 0` |
| Worktree | clean |

---

## Other-role evidence

| Role | Evidence level |
| --- | --- |
| Owner | **LIVE** Production server path PASS |
| Unauthenticated | **LIVE** harness denied before privileged handoff (`UNAUTHORIZED`; writer spy not called) |
| Direct authenticated RPC | **LIVE** denied (`42501`) |
| Admin | **TEST** frozen BQA-1F authorization (Owner/Admin may hand off) |
| Staff | **TEST** frozen BQA-1F: denied before writer |
| Viewer | **TEST** frozen BQA-1F: denied before writer |
| Suspended / foreign | **TEST** + existing Production authority evidence |

No extra users were manufactured.

---

## Hard closure

| Gate | Result |
| --- | --- |
| Migration hash exact | PASS |
| Targeted apply | PASS |
| Handoff RPC security | PASS |
| Generated types reconciled | PASS |
| Migration tenant effect | 0 |
| Platform-authorized fixture creation | PASS |
| Explicit owner fixture authorization | PASS |
| New Activity started draft / unclassified / unassigned / non-primary | PASS |
| BQA qualification / classification / support / admission | PASS |
| Admission auto-handoff | 0 |
| First handoff classify + activate + assign | PASS |
| Assignment source `bqa_confirmed` | PASS |
| Repeat same handoff idempotent / event delta 0 | PASS |
| Retained closed_beta denied | PASS |
| Historical internal_qa stale support denied | PASS |
| Cross-rollout denied | PASS |
| Direct authenticated RPC denied | PASS |
| Auto-repin | 0 |
| Context readiness mutation | 0 |
| Entitlement / Path B / Social / TAX-CAP-CTX | unchanged |
| Tests | same historical failures only |
| Secret | cleared |

**BQA-1F-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION GOVERNED ACTIVITY + CONTEXT HANDOFF VERIFIED**

**BQA GOVERNED ACTIVITY + CONTEXT HANDOFF = PRODUCTION VERIFIED**

**BQA-1 BUSINESS QUALIFICATION + ADMISSION BACKEND = PRODUCTION VERIFIED**

Recommended next (not started): **DATA-1A — UNIVERSAL BUSINESS DATA INTAKE DISCOVERY**. Do not wire onboarding automatically.
