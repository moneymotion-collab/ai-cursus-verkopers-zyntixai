# BQA-1F-R — Governed Activity + Context Assignment Handoff Implementation

| Field | Value |
| --- | --- |
| Phase | **BQA-1F-R — RESUME GOVERNED ACTIVITY + CONTEXT ASSIGNMENT HANDOFF IMPLEMENTATION** |
| Parent | BQA-1F (blocked) / ORG-CONTEXT-1X-FV |
| Document type | Implementation evidence |
| Date | 2026-08-27 |
| Formal status | `BQA-1F-R CLOSED WITH EVIDENCE — ATOMIC GOVERNED ACTIVITY + CONTEXT ASSIGNMENT HANDOFF IMPLEMENTED AND FROZEN` |
| Production handoff | **NOT YET PERFORMED** |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `406b4edfc9eb3c7e3db8f84eb607f113e8b535ec` |
| Local migration | `supabase/migrations/20260827120000_add_business_qualification_assignment_handoff.sql` |
| SHA-256 | `11EBE1AAAA07F6EE4AE6763AA1EF6C63A1F3F667C2DF5893788DBBF8C9057406` |
| Production apply | **NOT APPLIED** |

This phase implements the previously blocked BQA governed handoff. It does **not** execute a Production handoff, apply the new migration to Production, connect onboarding, expose a public API, enable entitlement, mutate Context readiness, mutate Path B, or mutate Social.

**BQA GOVERNED HANDOFF SERVER: IMPLEMENTED**

**BQA HANDOFF AUTHORITY: bqa_confirmed**

**PLATFORM OPERATOR IMPERSONATION: 0**

**ACTIVITY CLASSIFICATION HANDOFF: IMPLEMENTED**

**ACTIVITY ACTIVATION HANDOFF: IMPLEMENTED**

**CONTEXT ASSIGNMENT HANDOFF: IMPLEMENTED**

**AUTO CONTEXT REPIN: FORBIDDEN**

**ADMISSION AS PERMANENT AUTHORITY: FORBIDDEN**

**ATOMIC HANDOFF: IMPLEMENTED**

**PRODUCTION HANDOFF: NOT YET PERFORMED**

**ONBOARDING INTEGRATION: NOT IMPLEMENTED**

---

## A. Starting baseline

Proven before 1F-R files were added:

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `406b4edfc9eb3c7e3db8f84eb607f113e8b535ec` |
| Subject | `docs(org-context): record governed authority Production verification` |
| Divergence | `0 0` |
| Worktree | clean |

Production-verified dependencies:

| Dependency | Status |
| --- | --- |
| ORG-CONTEXT-1 | PRODUCTION VERIFIED |
| ORG-CONTEXT BQA GOVERNED AUTHORITY | PRODUCTION VERIFIED |
| CONTEXT-RESOLVER-1 | PRODUCTION VERIFIED |
| BQA DATABASE FOUNDATION | PRODUCTION VERIFIED |
| BQA QUALIFICATION + CLASSIFICATION FOUNDATION | PRODUCTION VERIFIED |
| BQA SUPPORT + ADMISSION FOUNDATION | PRODUCTION VERIFIED |

Hard gate passed. Implementation proceeded.

---

## B. Original 1F blocker resolution

`docs/phases/BQA-1F-governed-activity-context-assignment-handoff-evidence.md` remains historical evidence.

The blocker was that live ORG-CONTEXT mutation authority could only truthfully represent `platform_operator`. That is resolved by Production-verified `public.apply_organization_context_bqa_mutation` with fixed `source = bqa_confirmed`, Owner/Admin DB defense, and bounded operations `classify_activity` / `activate_activity` / `assign_context_version`. This phase does not reopen that authority decision.

---

## C. Production-verified BQA authority dependency

Handoff nested calls **only** `public.apply_organization_context_bqa_mutation`.

Forbidden operations are never attempted: `create_activity`, `set_primary`, `change_context_version`, `archive_activity`.

No fallback to `apply_organization_context_platform_mutation`. No `platform_operator` source.

---

## D. Handoff server boundary

Server-only entrypoint:

`BusinessActivityAdmissionHandoffService.applyBusinessActivityAdmissionHandoff({ organizationId, businessActivityId, admissionDecisionId, rolloutMode })`

All four values are explicit. The server derives TAX target, Context pack, Context version, Activity status targets, and source. Callers cannot pass `taxonomyTargetId`, `taxonomyKind`, `taxonomyKey`, `contextPackId`, `contextPackVersionId`, readiness, support/admission status, source, or Activity status target.

No public HTTP API. No Server Action. No browser import. No React hook. No onboarding / Home / AppShell / CRM / Settings / Members / Social consumer.

---

## E. Auth / order / roles

Strict order:

`createSupabaseServerClient()` → `auth.getUser()` → active Organization membership → Owner/Admin → exact Activity tenant read → BQA qualification → exact AdmissionDecision → linked SupportAssessment → current confirmed ClassificationDecision → Control Plane TAX/CTX revalidation → current readiness → current Activity / assignment → **then** privileged handoff RPC.

The factory keeps `createHandoffRpc` lazy. The privileged writer is not constructed before tenant authorization.

---

## F. Explicit AdmissionDecision rule

`admissionDecisionId` is required. The server loads the exact row. It does not select latest admission, `qualification.current_admission_decision_id`, first admitted decision, or historical `internal_qa` automatically.

Mismatch of Organization / Activity / qualification → `ADMISSION_NOT_FOUND` (no existence leak).

---

## G. Rollout binding

Requested `rolloutMode` must equal `AdmissionDecision.rollout_mode`. Cross-rollout (`internal_qa` decision + `closed_beta` request) → `ROLLOUT_MISMATCH`. Open Beta → `ROLLOUT_POLICY_UNDEFINED`.

---

## H. Persisted-admission non-authority

A persisted `admitted` row is historical evidence. Every handoff re-evaluates qualification, classification pointer, TAX catalog, exact Context pack/version, and **current** Context readiness. Linked superseded support denies (`SUPPORT_ASSESSMENT_NOT_READY`).

---

## I. Fresh qualification / classification validation

Handoff requires qualification present, `progress_status = confirmed`, required answers complete, review not blocking, split not unresolved, not requalifying. Current confirmed ClassificationDecision must be the one linked from support/admission. Newer confirmed classification → `ADMISSION_STALE`.

---

## J. TAX validation

Canonical TAX target is re-resolved through Control Plane. Kind, id, and canonical key must still match. No TAX writes.

---

## K. Context pack / version validation

Exact pack is resolved from the confirmed TAX target (no ancestor fallback). Linked SupportAssessment pack must match. Version comes from the SupportAssessment and is re-resolved: same pack, published, no newer-version substitution.

---

## L. Current readiness validation

Current `context_pack_readiness` is read immediately before the writer:

| Rollout | Eligible current readiness |
| --- | --- |
| `internal_qa` | `context_ready`, `beta_supported`, `production_verified` |
| `closed_beta` | `beta_supported`, `production_verified` |
| `production` | `production_verified` |
| `open_beta` | forbidden / undefined |

Persisted SupportAssessment readiness is historical only. Below-threshold current readiness → `CONTEXT_READINESS_NO_LONGER_ELIGIBLE` **before** ORG mutation. No automatic new AdmissionDecision.

---

## M. Activity-state validation

Canonical `organization_business_activities` is read through tenant-honest ORG-CONTEXT lookup.

Covered states: draft+unclassified; draft+same classification; active+same classification; different classification; archived; integrity-invalid (fail closed). State is not inferred from BQA alone.

---

## N. Classify transition

Unclassified → nested `classify_activity` with server-derived TAX. Same classification → nested no-op (`idempotent`). Different classification → `ACTIVITY_CLASSIFICATION_MISMATCH` before writer. No overwrite. No platform path.

---

## O. Activate transition

Draft after canonical classification is established → nested `activate_activity`. Already active → no-op. Archived → `ACTIVITY_ARCHIVED` before assignment. No `set_primary`.

---

## P. Exact Context assignment

No active pin → nested `assign_context_version` with the SupportAssessment version. Same exact version → no-op. Different active version → `CONTEXT_REPIN_REQUIRED` before writer.

---

## Q. No auto-repin

`change_context_version` is absent from the handoff SQL and from BQA TypeScript. Wrong pin never supersedes.

---

## R. Atomic handoff RPC

New additive function:

`public.apply_business_qualification_assignment_handoff(uuid, uuid, uuid, uuid, text)`

One PostgreSQL transaction. No eighth BQA table. No copied ORG-CONTEXT transition SQL. Nested ORG mutation only through the BQA wrapper.

---

## S. Nested result → RAISE behavior

Each nested jsonb result is inspected. `ok != true` → `RAISE EXCEPTION` with `HANDOFF_NESTED:<CODE>` (`P0001`). Prior DML including the requested event rolls back. Pre-DML validation returns jsonb `ok: false` without RAISE.

Tests prove:

- forced assign failure after classify+activate would otherwise succeed → Activity returns to draft/unclassified, no pin, no ORG events, no BQA completed event
- forced completed-event failure after nested ORG success → entire transaction rolls back

---

## T. Lock order

Frozen order: **872011** (organization) then **872012** (organization:activity). Nested ORG wrapper re-takes 872011 in the same xact. Memory concurrency tests record `872011` immediately before each `872012`.

---

## U. BQA handoff audit

Event vocabulary now includes `assignment_handoff_requested` and `assignment_handoff_completed` in the TypeScript union (schema already allowed them). First success writes one requested and one completed event keyed by `handoff-requested:{admissionId}` and `handoff-completed:{admissionId}`. Repeat success finds the completed event and writes none. Metadata is bounded identifiers only.

---

## V. ORG-CONTEXT audit

Nested wrapper emits truthful `bqa_confirmed` events. This phase never writes `platform_operator`. Reconstructability: BQA requested/completed + ORG classify/activate/assign events.

---

## W. Idempotency

Repeat exact successful handoff returns `ok: true`, `idempotent: true`. No duplicate classification/activation/assignment events, no second assignment, no second completed event. Mechanism: unique BQA completed idempotency key plus canonical-state verification. First success against an already-configured Activity writes BQA requested+completed with nested ORG no-ops (`idempotent: false` at handoff layer); the second call is `idempotent: true`.

---

## X. Concurrency

Two equivalent in-memory handoffs: one canonical assignment, one completed event, lock order preserved, no inversion.

---

## Y. Stale-state protections

Covered denials: stale readiness, stale classification, requalifying, review-required, not-admitted, rollout mismatch, superseded support, archived, classification mismatch, wrong pin, Open Beta, unknown/foreign admission id.

---

## Z. Entitlement non-effect

No `enabled_capabilities`, subscription, role, or Social publishing mutation.

---

## AA. Readiness non-effect

Handoff reads `context_pack_readiness`. It never writes it. No promotion. No `verified_at` update.

---

## AB. Path B non-effect

No invitation, registration, membership, or auth-user mutation. Membership count is unchanged across a successful local handoff.

---

## AC. Social non-effect

No publishing/scheduling/Cron/publication mutation.

---

## AD. Product isolation

No `src/app` import. No feature barrel. No `"use server"`. No `use client`. Isolation tests still forbid `classify_activity` / `assign_context_version` / platform wrapper in BQA TypeScript. TypeScript calls only `apply_business_qualification_assignment_handoff`. Creating an `admitted` AdmissionDecision does not trigger handoff (no insert trigger).

---

## AE. Tests

Executed:

- BQA 1D / 1E regression
- ORG-CONTEXT 1X authority regression
- BQA-1F-R domain, authorization, atomicity, idempotency, concurrency
- assignment-handoff migration security
- BQA / ORG-CONTEXT isolation
- Path B / Social / Control Plane remain in the full suite
- `npx tsc --noEmit`
- `npx next lint`
- `npx vitest run`

Full suite: **3166 passed / 2 failed / 3168 total**.

Historical failures only (unchanged):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures. Prior accepted baseline was 3133 / 2 / 3135; the +33 passing tests are 1F-R coverage.

---

## AF. Production untouched

Read-only confirmation after implementation (no handoff executed, no migration applied):

| Check | Production value |
| --- | --- |
| QA Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Activities | 1 (`07e6918e-6c13-437e-b698-f0f3be27e9bb`, active, primary, classified, 1 active pin) |
| Draft Activity | **none** |
| ORG-CONTEXT events | 2 |
| BQA fixture | 1 / 3 / 2 / 10 / 2 / 2 / 0 |
| `apply_business_qualification_assignment_handoff` | **not present** |
| Context readiness | not written by this phase |

Generated Production types were not hand-edited. `BQA_HANDOFF_RPC` is a named pre-Production constant until 1F-FV typegen.

---

## Pre-commit review

| Check | Result |
| --- | --- |
| Old BQA-1C/1D/1E / ORG-CONTEXT 1X-B migrations edited | No |
| ORG-CONTEXT SQL copied | No |
| Platform wrapper call | No |
| `platform_operator` source | No |
| `change_context_version` | No |
| Auto-repin | Forbidden |
| Current-pointer-only admission selection | No |
| Persisted-admission-as-token | Forbidden |
| Fresh readiness validation | Yes (server) |
| Explicit AdmissionDecision | Yes |
| Exact rollout | Yes |
| Nested `ok=false` aborts transaction | Yes |
| Lock 872011 → 872012 | Yes |
| Entitlement / Path B / Social / UI / API | No |
| Production execution | No |

---

## FV fixture plan (not executed)

Retained QA Activity is already classified, active, and exactly pinned. 1F-FV therefore needs two proofs:

A. Retained Activity `07e6918e-6c13-437e-b698-f0f3be27e9bb`: desired-state idempotent handoff (if current revalidation allows the explicit admission + rollout).

B. First-time handoff: **no safe draft Activity exists** in the QA Organization (read-only). Recommend creating one dedicated internal-QA draft/unclassified/unassigned fixture in BQA-1F-FV only, with explicit Owner authorization.

Do not create that Production draft in 1F-R.

Recommend next phase: **BQA-1F-FV — CONTROLLED PRODUCTION GOVERNED HANDOFF VERIFICATION**. Do not execute automatically.
