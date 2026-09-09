# ENG-ONB-1H-P1-CONTRACT — V2 Onboarding Application Integration and Completion

## Executive verdict

`ENG-ONB-1H-P1-CONTRACT SCOPE FROZEN — AUTHORITATIVE ENG-ONB-1H PROGRAM LEDGER AND P1 ACCEPTANCE CONTRACT PUBLISHED`

This document is the first repository-native governance authority for the
ZyntixAI V2 onboarding program. Before this document, every `ENG-ONB-*`
identifier existed only inside migration headers, SQL comments, and Vitest
`describe` labels. No `ENG-ONB-*` phase contract, readiness contract, or closure
record existed anywhere under `docs/`.

`ENG-ONB PHASE DOCUMENTS BEFORE THIS ONE = 0`

`ENG-ONB-1H DATABASE AUTHORITY = IMPLEMENTED AND COMMITTED`

`ENG-ONB-1H APPLICATION AUTHORITY = NOT IMPLEMENTED`

`FIVE COMPLETION RPCS EXIST WITH ZERO APPLICATION CALL SITES`

`NO ENG-ONB UNIT IS CLOSED UNDER B1-GATE.1`

`RETIRED UNALLOCATED IDENTIFIERS = 12`

`REMAINING MANDATORY GOVERNED PHASES = 7`

This phase implements nothing. It changes exactly one untracked documentation
file. It does not weaken, reinterpret, or exempt anything in
`docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md`.

`P1 IMPLEMENTATION STARTED = NO`

`DATABASE ACCESS = 0`

`PRODUCTION ACCESS = 0`

---

## 1. Repository

| Field | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Preflight HEAD | `22721fad628affb0afa8c41a1b5fe653a0dfa4f8` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence at preflight | `0 0` |
| Worktree at preflight | clean; nothing staged; no untracked files |
| `git diff --check` at preflight | clean, exit `0` |
| Latest commit | `22721fad628affb0afa8c41a1b5fe653a0dfa4f8` — `fix(onboarding): reconcile stale invitation completion proof` |
| Binding standard | `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` |
| Phase type | Documentation authority and acceptance-contract freeze |
| Authorized change | exactly one new file under `docs/phases/` |

Preflight verified root, branch, HEAD, upstream, divergence, clean worktree,
empty staging, latest commit, the complete committed `ENG-ONB-1H-P0-B4` file
list, and an initial `git diff --check`. No fetch, pull, merge, rebase, reset,
stash, stage, commit, push, migration, type generation, or database command was
run in this phase.

### 1.1 Complete committed `ENG-ONB-1H-P0-B4` file list

Commit `22721fad628affb0afa8c41a1b5fe653a0dfa4f8` contains exactly four paths:

| Change | Path |
| --- | --- |
| `M` | `src/types/database.generated.ts` |
| `A` | `supabase/migrations/20260908111356_onboarding_completion_authority.sql` |
| `A` | `supabase/migrations/20260908131955_reconcile_stale_onboarding_invitation_proof.sql` |
| `A` | `tests/security/onboarding-completion-authority-migration-security.test.ts` |

This matches the expected list exactly. Both migrations were introduced in this
single commit, so `ENG-ONB-1H-P0-A` and `ENG-ONB-1H-P0-B4` share one publication
commit.

---

## 2. Binding governance standard as applied here

`B1-GATE.1` §2 makes the standard mandatory for all technical phases, subphases,
QA slices, browser verification, and publication from `B1.6.2` forward. Every
`ENG-ONB-*` unit is later than `B1.6.2`, so the standard binds all of them.

The three clauses that decide this document's conclusions:

1. §4 — a phase is definitively closed only with
   `CLOSED WITH EVIDENCE — 100% REQUIRED GATES PASSED`. `IMPLEMENTED — NOT
   VERIFIED` and `READY FOR PUBLICATION` explicitly do **not** mean closed.
2. §5 Gate 9 — closure requires a phase contract, implementation report, test
   results, security assessment, browser evidence, production evidence, commits,
   deployment data, rollback assessment, final verdict, and remaining polish, all
   present in repository documentation.
3. §12.6 — missing historical evidence is not invented or backfilled as if
   executed.

Consequence, stated plainly: because no `ENG-ONB-*` phase document existed in the
repository before this one, **no `ENG-ONB-*` unit can hold
`CLOSED_WITH_REPOSITORY_EVIDENCE`**, regardless of how complete its
implementation and automated tests are. Gate 9 is unmet by absence of the
document, not by any defect in the code. This document does not repair that for
past units; it stops the program from continuing without authority and makes the
gap explicit and countable.

`B1-GATE.1 WEAKENED = NO`

`B1-GATE.1 REINTERPRETED = NO`

---

## 3. Status vocabulary

This registry uses only the following statuses. No other status word is
permitted anywhere in this document's registry tables.

| Status | Exact meaning in this ledger |
| --- | --- |
| `CLOSED_WITH_REPOSITORY_EVIDENCE` | Implementation, verification, and a committed `docs/` closure record all exist; all required `B1-GATE.1` gates are demonstrated in repository documentation |
| `IMPLEMENTED_AWAITING_REPOSITORY_EVIDENCE` | Implementation is committed and pushed and automated verification exists, but the `B1-GATE.1` Gate 9 documentation authority is absent, so the unit is not closed |
| `PARTIALLY_IMPLEMENTED` | Part of the coherent scope is committed; a required part of the same scope is demonstrably absent from the repository |
| `NOT_STARTED` | Governed and required, with zero committed implementation |
| `RETIRED_UNALLOCATED` | The identifier appeared in planning outside repository authority; it was never allocated a binding repository contract; it is not completed; it is not failed; it is not a predecessor that future implementation must satisfy; any useful intended scope must be reassigned explicitly to the governed P1 structure defined here |
| `UNALLOCATED_UNKNOWN` | The identifier is referenced in program discussion, its position in a committed sequence is implied, but the repository contains neither a definition nor an artifact, so its intended scope cannot be stated |
| `SUPERSEDED` | A committed unit demonstrably replaced this unit's committed scope |

---

## 4. Authoritative phase registry — existing program units

Every status below is backed by a path in this repository at
`22721fad628affb0afa8c41a1b5fe653a0dfa4f8`. "Local DB" and "Production" columns
record **where evidence lives**, not a claim about what was or was not executed
by a human operator outside the repository.

| Phase | Objective | Current status | Implementation evidence | Verification evidence | Local DB | Remote Git | Production | Remaining requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `ONBOARDING-1A` | Four-target operating-model selection assigns governed TAX/CTX organization context via service-role-only atomic RPC | `CLOSED_WITH_REPOSITORY_EVIDENCE` | `supabase/migrations/20260904110421_add_operating_model_context_onboarding.sql`; `src/features/onboarding/server/assign-operating-model.ts`; `src/features/onboarding/domain/operating-model.ts` | `docs/phases/ONBOARDING-1A-operating-model-selection-and-context-assignment-evidence.md`; `tests/onboarding/operating-model-assignment.test.ts`; `tests/security/onboarding-operating-model-migration-security.test.ts` | no committed DB-state artifact; not required for this closure | pushed; commit `a7746886d942f27498ce408e4c8012f54660c3e3` | reconciled inside `BETA1-4TG-MASTER-FV` scope; `PRODUCTION MIGRATIONS APPLIED = 0` recorded there | none |
| `ENG-ONB-1H-A` | Versioned organization onboarding state: `NULL` grandfathered, `1` legacy, `2` four-target flow; V2 owner provisioning | `IMPLEMENTED_AWAITING_REPOSITORY_EVIDENCE` | `supabase/migrations/20260907120240_add_versioned_onboarding_state.sql`; `src/features/onboarding/domain/onboarding-flow-version.ts` | `tests/security/onboarding-versioning-migration-security.test.ts` (static SQL-text assertions) | no committed DB-state artifact | pushed; commit `71366cc` | not applied per repository evidence | Gate 9 phase document; repository-native runtime evidence |
| `ENG-ONB-1H-B` | unknown | `UNALLOCATED_UNKNOWN` | none | none | n/a | n/a | n/a | Owner decision: define and allocate, or formally retire |
| `ENG-ONB-1H-C` | Database authority for V2 onboarding transitions; Setup Ready and Complete become server-only; V1/`NULL` compatibility preserved | `IMPLEMENTED_AWAITING_REPOSITORY_EVIDENCE` | `supabase/migrations/20260907140829_onboarding_v2_transition_authority.sql` | `tests/security/onboarding-v2-transition-authority.test.ts` (static SQL-text assertions) | no committed DB-state artifact | pushed; commit `d3bd147` | not applied per repository evidence | Gate 9 phase document; repository-native runtime evidence |
| Unlabelled onboarding UX series | Onboarding shared UI foundations, shell and progress, V2 You & Company, V2 operating model, workspace confirmation, team foundation and governed invite-intent UI | `PARTIALLY_IMPLEMENTED` | `src/app/onboarding/page.tsx`; `src/app/onboarding/operating-model/page.tsx`; `src/app/onboarding/workspace-confirmation/page.tsx`; `src/app/onboarding/team/page.tsx`; `src/features/onboarding/ui/**`; `src/features/onboarding/domain/onboarding-lifecycle.ts`; `src/features/onboarding/server/resolve-onboarding-lifecycle.ts`; `src/features/onboarding/server/enforce-product-onboarding.ts`; commits `bf6dead`, `bab75bd`, `9edd6c3`, `aee8494`, `a3c5e69`, `6b37099`, `1475f19`, `d7f03d1` | 26 files under `tests/onboarding/`; `tests/ui/onboarding-shell.test.tsx` | no committed DB-state artifact | pushed | not applied per repository evidence | The `"ready"` progress step has no route and no screen; `markV2OnboardingSetupReadyAction` and `completeV2OnboardingAction` have zero UI call sites. Both gaps are assigned to P1 in §7 |
| `ENG-ONB-1G-A` | unknown | `RETIRED_UNALLOCATED` | none — see §6.2 | none | n/a | n/a | n/a | Intended scope reassigned to P1-B (§9.2) |
| `ENG-ONB-1G-A1` | Durable, non-actionable onboarding Team invite intents with no token, expiry, delivery, invitation lifecycle, or membership authority | `IMPLEMENTED_AWAITING_REPOSITORY_EVIDENCE` | `supabase/migrations/20260907230410_create_onboarding_team_invite_intent_authority.sql`; `src/features/onboarding/server/team-invite-intents.ts`; `src/features/onboarding/actions/team-invite-intent-actions.ts`; `src/features/onboarding/domain/team-invite-intents.ts` | `tests/security/onboarding-team-invite-intent-migration-security.test.ts` (static); `tests/security/onboarding-team-invite-intent-live-verification.sql` (committed transaction-wrapped runtime script); `tests/onboarding/team-invite-intents.test.ts`; `tests/onboarding/team-foundation-route.test.tsx`; `tests/onboarding/team-foundation-component-concurrency.test.tsx` | no committed DB-state artifact; a committed executable runtime script exists | pushed; commits `7f4874d`, `d7f03d1` | not applied per repository evidence | Gate 9 phase document; a recorded execution result for the committed runtime script |
| `ENG-ONB-1H-P0-A` | Durable V2 onboarding completion orchestration and invitation-result authority; callers never supply authoritative invitation outcomes or invitation IDs; every public invitation create/resend/accept path denies V2 before Setup Ready | `IMPLEMENTED_AWAITING_REPOSITORY_EVIDENCE` | `supabase/migrations/20260908111356_onboarding_completion_authority.sql`; `src/types/database.generated.ts` | `tests/security/onboarding-completion-authority-migration-security.test.ts` (static SQL-text and SHA-256 checksum assertions) | no committed DB-state artifact | pushed; commit `22721fad628affb0afa8c41a1b5fe653a0dfa4f8` | not applied per repository evidence | Gate 9 phase document; repository-native runtime evidence (`ENG-ONB-1H-P0-RV-EVIDENCE`, §10) |
| `ENG-ONB-1H-P0-B1` | unknown | `UNALLOCATED_UNKNOWN` | none | none | n/a | n/a | n/a | Owner decision: define and allocate, or formally retire |
| `ENG-ONB-1H-P0-B2` | unknown | `UNALLOCATED_UNKNOWN` | none | none | n/a | n/a | n/a | Owner decision: define and allocate, or formally retire |
| `ENG-ONB-1H-P0-B3` | unknown | `UNALLOCATED_UNKNOWN` | none | none | n/a | n/a | n/a | Owner decision: define and allocate, or formally retire |
| `ENG-ONB-1H-P0-B4` | Forward-only correction for stale invitation-bearing onboarding proof; cutover readiness now requires currently valid evidence; attempt history preserved | `IMPLEMENTED_AWAITING_REPOSITORY_EVIDENCE` | `supabase/migrations/20260908131955_reconcile_stale_onboarding_invitation_proof.sql`; `src/types/database.generated.ts` | `tests/security/onboarding-completion-authority-migration-security.test.ts` (static SQL-text and SHA-256 checksum assertions) | see §5 | see §5 | see §5 | see §5 |
| `ENG-ONB-1H-P1-CONTRACT` | This document: authoritative program ledger and P1 acceptance-contract freeze | `IMPLEMENTED_AWAITING_REPOSITORY_EVIDENCE` until its own publication commit exists | this file | §14 gate matrix | none required | untracked at authoring time; publication is a separate owner-approved act | not applicable | controlled publication |
| `ENG-ONB-1H-P0-RV-EVIDENCE` | Repository-native runtime evidence for the committed P0 authority | `NOT_STARTED` | none | none | target of the phase | none | none | §10 |
| `ENG-ONB-1H-P1-A` | Completion Run Integration | `NOT_STARTED` | none | none | none | none | none | §9.1 |
| `ENG-ONB-1H-P1-B` | Governed Invitation Execution and Creating State | `NOT_STARTED` | none | none | none | none | none | §9.2 |
| `ENG-ONB-1H-P1-C` | Ready Reconstruction and Explicit Completion | `NOT_STARTED` | none | none | none | none | none | §9.3 |
| `ENG-ONB-1H-P1-D` | Product Route Cutover and Recovery | `NOT_STARTED` | none | none | none | none | none | §9.4 |
| `ENG-ONB-1H-PROD` | Controlled Production application of committed P0 onboarding migrations | `NOT_STARTED` | none | none | none | none | none | §12 |
| `ENG-ONB-1H-FV` | Terminal V2 onboarding final verification | `NOT_STARTED` | none | none | none | none | none | §11 |

### 4.1 Why no existing `ENG-ONB` unit is closed

The `ENG-ONB` identifier appears in exactly ten committed files, all of them SQL
migrations or tests:

| File | Identifier reference |
| --- | --- |
| `supabase/migrations/20260907120240_add_versioned_onboarding_state.sql:1` | `ENG-ONB-1H-A` |
| `supabase/migrations/20260907140829_onboarding_v2_transition_authority.sql:1` | `ENG-ONB-1H-C` |
| `supabase/migrations/20260907230410_create_onboarding_team_invite_intent_authority.sql:1` | `ENG-ONB-1G-A1` |
| `supabase/migrations/20260908111356_onboarding_completion_authority.sql:1` | `ENG-ONB-1H-P0-A` |
| `supabase/migrations/20260908131955_reconcile_stale_onboarding_invitation_proof.sql:1` | `ENG-ONB-1H-P0-B4` |
| `tests/security/onboarding-versioning-migration-security.test.ts:20` | `ENG-ONB-1H-A` |
| `tests/security/onboarding-v2-transition-authority.test.ts` (9 references) | `ENG-ONB-1H-C` |
| `tests/security/onboarding-team-invite-intent-migration-security.test.ts` (6 references) | `ENG-ONB-1G-A1` |
| `tests/security/onboarding-team-invite-intent-live-verification.sql:162,699` | `ENG-ONB-1G-A1` |
| `tests/security/onboarding-completion-authority-migration-security.test.ts` (10 references) | `ENG-ONB-1H-P0-A`, `ENG-ONB-1H-P0-B4` |

`ENG-ONB REFERENCES UNDER docs/ BEFORE THIS DOCUMENT = 0`

`ENG-ONB REFERENCES IN COMMIT MESSAGES = 0`

This is the single root cause behind every
`IMPLEMENTED_AWAITING_REPOSITORY_EVIDENCE` status in §4.

---

## 5. `ENG-ONB-1H-P0-B4` evidence-location record

`B1-GATE.1` §12.6 forbids inventing or backfilling missing evidence. Recorded
separately and precisely, as required:

| Dimension | Recorded state |
| --- | --- |
| Implementation | committed and pushed at `22721fad628affb0afa8c41a1b5fe653a0dfa4f8`; four files, listed in §1.1 |
| Remote Git | `origin/core/platform-readiness-20260707` contains the commit; divergence `0 0` |
| Automated verification present | yes — `tests/security/onboarding-completion-authority-migration-security.test.ts`, including a canonical-LF SHA-256 pin `D86E0B4D72F7D1D9B83571E87723ACAC0649EC9EFE1B501EE1D9BD808F2A1796` on the P0-A migration |
| Nature of that verification | **static**. The test reads migration files from disk with `readFileSync` and asserts SQL text, constraint bodies, quoted literal sets, call-graph boundaries, and the checksum. It does not connect to PostgreSQL and does not execute the migration |
| Local database | reported by prior out-of-repository runtime work as locally applied. **This phase neither confirms nor denies that.** Database access is prohibited in this phase, and the repository contains no committed DB-state artifact, migration-history record, or execution log that could prove it |
| Production | not applied per repository evidence. `BETA1-4TG-MASTER-FV` records `PRODUCTION MIGRATIONS APPLIED = 0` and `DEPLOYMENTS = 0`, and no later document supersedes that |
| Repository-native runtime evidence | **absent**. `supabase/migrations/` holds seven onboarding migrations; `tests/security/` holds twelve `*-live-verification.sql` executable runtime scripts, including one for `ENG-ONB-1G-A1`. There is **no** `onboarding-completion-authority-live-verification.sql`. No committed runtime artifact covers `ENG-ONB-1H-P0-A` or `ENG-ONB-1H-P0-B4` |

`STATIC SQL-TEXT VERIFICATION ≠ RUNTIME VERIFICATION`

`EXTERNAL RUNTIME REPORT ≠ REPOSITORY-NATIVE PASS EVIDENCE`

This record does not invalidate the runtime work that was performed outside the
repository. It states accurately **where** evidence currently lives, and it
assigns recovery of the repository-native form to
`ENG-ONB-1H-P0-RV-EVIDENCE` (§10).

---

## 6. Legacy and undefined identifier dispositions

### 6.1 `RETIRED_UNALLOCATED`

Each identifier below was searched two ways at
`22721fad628affb0afa8c41a1b5fe653a0dfa4f8`: `git grep` across all tracked files
at `HEAD`, and `git log --all --grep` with fixed-string matching across all
commit messages. Both returned zero for every identifier.

| Identifier | Tracked files at `HEAD` | Commit messages | Disposition |
| --- | --- | --- | --- |
| `ENG-ONB-1B` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1C` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1D-A` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1D-B` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1E` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1F` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1G-A` | 0 (see §6.2) | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1G-B` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1I` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1J` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-1K` | 0 | 0 | `RETIRED_UNALLOCATED` |
| `ENG-ONB-FV` | 0 | 0 | `RETIRED_UNALLOCATED` |

`RETIRED UNALLOCATED COUNT = 12`

For all twelve, per the §3 definition: they appeared in planning outside
repository authority; none was allocated a binding repository contract; none is
completed; none is failed; **none is a predecessor that future implementation
must satisfy**. No objective and no historical PASS evidence is asserted for any
of them.

`ENG-ONB-FV` is retired and is **replaced** by `ENG-ONB-1H-FV` (§11), which is
newly defined here with a concrete acceptance contract. The retired identifier
carries no inherited scope; `ENG-ONB-1H-FV` derives its scope only from §7–§13
of this document.

### 6.2 `ENG-ONB-1G-A` — instructed wording not adopted

The instruction for this phase permitted recording `ENG-ONB-1G-A` as
`SUPERSEDED_BY_COMMITTED_ENG-ONB-1G-A1` **only if repository history supports
that wording**. It does not, so that wording is rejected.

A plain `git grep -l -F 'ENG-ONB-1G-A'` matches three files, but all three
matches are the substring inside `ENG-ONB-1G-A1`. A word-boundary search,
`git grep -n -E 'ENG-ONB-1G-A([^1]|$)' HEAD`, returns **zero** matches. There is
no committed `ENG-ONB-1G-A` contract, migration, test, document, or commit
message anywhere in history.

`SUPERSEDED` under §3 requires a committed unit to have demonstrably replaced
another committed unit's committed scope. There is no committed `ENG-ONB-1G-A`
scope to replace, so the relationship cannot be evidenced. The `A1` suffix is
*consistent with* a planning-level `A` predecessor but does not prove one, and an
inference is not evidence.

`ENG-ONB-1G-A` is therefore `RETIRED_UNALLOCATED`. The only governed team
invite-intent authority in this repository is the committed `ENG-ONB-1G-A1`
(`supabase/migrations/20260907230410_create_onboarding_team_invite_intent_authority.sql`).
Any intended `1G-A` scope concerning actionable invitations is reassigned
explicitly to `ENG-ONB-1H-P1-B` (§9.2).

### 6.3 `UNALLOCATED_UNKNOWN`

| Identifier | Tracked files at `HEAD` | Commit messages | Disposition |
| --- | --- | --- | --- |
| `ENG-ONB-1H-B` | 0 | 0 | `UNALLOCATED_UNKNOWN` |
| `ENG-ONB-1H-P0-B1` | 0 | 0 | `UNALLOCATED_UNKNOWN` |
| `ENG-ONB-1H-P0-B2` | 0 | 0 | `UNALLOCATED_UNKNOWN` |
| `ENG-ONB-1H-P0-B3` | 0 | 0 | `UNALLOCATED_UNKNOWN` |

`UNALLOCATED UNKNOWN COUNT = 4`

These four differ from §6.1 in one respect only: a committed sibling implies a
sequence position. `ENG-ONB-1H-A` and `ENG-ONB-1H-C` are committed with no
`ENG-ONB-1H-B` between them; `ENG-ONB-1H-P0-B4` is committed with no `B1`, `B2`,
or `B3` before it. The repository contains neither a definition nor an artifact
for any of the four, so their intended scope **cannot be stated** and is not
guessed here.

They are not counted as remaining mandatory work in §15, because a phase with no
statable objective cannot be given an acceptance contract. Each requires an Owner
decision: define and allocate a binding contract, or formally retire. No P1 slice
depends on any of them.

`FABRICATED OBJECTIVES = 0`

`FABRICATED PASS EVIDENCE = 0`

---

## 7. `ENG-ONB-1H` program objective and the P1 objective

### 7.1 `ENG-ONB-1H` objective

Deliver a versioned, server-authoritative V2 onboarding program in which a newly
provisioned four-target organization is enrolled at
`organizations.onboarding_flow_version = 2`, is guided through You & Company,
Business, Workspace, Team, and Ready, and reaches product access **only** through
a durable, replay-safe, Owner-authorized, organization-scoped completion
transition owned entirely by PostgreSQL — while V1 and `NULL`-version
organizations remain historically compatible and unaffected.

`ENG-ONB-1H` decomposes into a database-authority layer (`1H-A`, `1H-C`,
`1G-A1`, `1H-P0-A`, `1H-P0-B4` — all committed) and an application layer
(`1H-P1-A` … `1H-P1-D` — none implemented), terminating at `ENG-ONB-1H-FV`.

### 7.2 P1 objective — frozen

**P1 is the application layer that consumes the existing, committed P0 database
authority and allows a newly created V2 organization to complete onboarding
safely.**

P1 adds no database authority, invents no state machine, and introduces no
client-owned notion of correctness. Every authoritative decision is already
implemented in SQL; P1's entire job is to call it correctly, render its results
truthfully, and recover from interruption.

The gap P1 closes is exact and measurable. Five committed public RPCs have **zero
call sites anywhere in `src/`**:

| Committed RPC | Generated-type location | Application call sites |
| --- | --- | --- |
| `ensure_organization_onboarding_completion_run` | `src/types/database.generated.ts:8459` | **0** |
| `list_organization_onboarding_frozen_team_invite_intents` | `src/types/database.generated.ts:8556` | **0** |
| `execute_organization_onboarding_invite_intent` | `src/types/database.generated.ts:8499` | **0** |
| `reconcile_organization_onboarding_invite_intent` | `src/types/database.generated.ts:8878` | **0** |
| `list_organization_onboarding_invitation_results` | `src/types/database.generated.ts:8560` | **0** |

Two further server actions exist but are never invoked from any UI component:

| Server action | Location | UI call sites |
| --- | --- | --- |
| `markV2OnboardingSetupReadyAction` | `src/features/onboarding/actions/onboarding-actions.ts:150` | **0** |
| `completeV2OnboardingAction` | `src/features/onboarding/actions/onboarding-actions.ts:177` | **0** |

And one lifecycle state has no screen: `resolveOnboardingLifecycle` can return
`kind: "v2_ready"` with `logicalStage: "ready"`
(`src/features/onboarding/domain/onboarding-lifecycle.ts:53`), but no route
renders it. `src/app/onboarding/page.tsx:164` falls through to a generic
`OnboardingStatusPanel`. `ONBOARDING_PROGRESS_STEPS` declares a `"ready"` step
(`src/features/onboarding/ui/onboarding-progress.tsx:8`) that no component ever
sets as `currentStep`.

`A NEWLY CREATED V2 ORGANIZATION CANNOT CURRENTLY COMPLETE ONBOARDING`

### 7.3 The twelve required P1 journey elements, mapped to committed contracts

State names, RPC names, and route behavior below are derived from committed
source and SQL, not invented.

| # | Required element | Governing committed contract | Application status |
| --- | --- | --- | --- |
| 1 | Durable Setup Ready transition | `public.mark_organization_onboarding_setup_ready(p_organization_id uuid) → jsonb`, `20260907140829` L279–463; writes `organizations.onboarding_setup_ready_at` only; returns `state: 'ready'`, `idempotent: true` on replay | action exists, 0 UI call sites |
| 2 | Creation or retrieval of the completion run | `public.ensure_organization_onboarding_completion_run(p_organization_id uuid) → jsonb`, `20260908111356` L1113–1181; `insert … on conflict (organization_id) do nothing`; seeds one `organization_onboarding_invitation_results` row per frozen intent | **absent** |
| 3 | Loading frozen team invite intents | `public.list_organization_onboarding_frozen_team_invite_intents(p_organization_id uuid) → jsonb`, `20260908111356` L1195–1251 | **absent** |
| 4 | Executing invitation intents through governed authority | `public.execute_organization_onboarding_invite_intent(p_organization_id uuid, p_intent_id uuid) → jsonb`, `20260908111356` L1341–1548 | **absent** |
| 5 | Displaying Creating / in-progress state | `organization_onboarding_completion_runs.status ∈ {'setup_ready','inviting','invite_partial','ready_for_cutover','completed'}`, `20260908111356` L22–30 | **absent** — no route, no component |
| 6 | Reconciliation after refresh, retry or partial outcome | `public.reconcile_organization_onboarding_invite_intent(p_organization_id uuid, p_intent_id uuid) → jsonb`, replaced by `20260908131955` L340–462 | **absent** |
| 7 | Reconstructing Ready state from authoritative results | `public.list_organization_onboarding_invitation_results(p_organization_id uuid) → jsonb`, `20260908111356` L1265–1327; run status `'ready_for_cutover'` | **absent** |
| 8 | Handling membership collisions and stale invitation proof | `result_code` / `evidence_kind` pairs `'already_member'`/`'active_membership'`, `'existing_membership_requires_admin_action'`/`'membership_collision'`, `'invitation_proof_lost'`/`'historical_invitation'` (`20260908131955` L25, L40, L84–88) | **absent** |
| 9 | Deliberate Enter ZyntixAI action | no committed contract — new P1 UI affordance gating element 10 | **absent** |
| 10 | Completing onboarding through server authority | `public.complete_organization_v2_onboarding(p_organization_id uuid) → jsonb`, `20260907140829` L476–581; requires `onboarding_setup_ready_at is not null`; writes `onboarding_completed_at` only | action exists, 0 UI call sites |
| 11 | Cutover to product routes only after authoritative completion | `redirectIfOrganizationOnboardingIncomplete`, `src/features/onboarding/server/enforce-product-onboarding.ts:18`; allows only `kind: "v2_completed"`; 15 product resolver call sites | implemented; must extend to new P1 routes |
| 12 | Preserving four-target operating-model context | `V2_ONBOARDING_CONTEXT_PACKS`, `src/features/onboarding/domain/onboarding-lifecycle.ts:4–13`; Setup Ready requires a configured context pack (`20260907140829` L376–445, code `'CONFIGURED_CONTEXT_REQUIRED'`) | implemented upstream; must be preserved, not re-derived |

### 7.4 Authoritative state vocabulary P1 must render — no second state machine

P1 renders these committed values. It must not define parallel enums, derive
readiness client-side, or infer completion from anything other than the values
below.

Organization lifecycle — `resolveOnboardingLifecycle`
(`src/features/onboarding/domain/onboarding-lifecycle.ts:23–71`), discriminated
on `kind`: `"grandfathered"`, `"legacy"`, `"v2_owner_required"`,
`"v2_core_incomplete"`, `"v2_context_required"`, `"v2_configured"`,
`"v2_ready"`, `"v2_completed"`, `"invalid"`.

Completion run — `organization_onboarding_completion_runs.status`:
`'setup_ready'`, `'inviting'`, `'invite_partial'`, `'ready_for_cutover'`,
`'completed'`.

Invitation result — `organization_onboarding_invitation_results.result_code`
after `ENG-ONB-1H-P0-B4`: `'not_attempted'`, `'success'`,
`'invite_already_pending'`, `'already_member'`,
`'existing_membership_requires_admin_action'`, `'invalid_input'`,
`'invitation_proof_lost'`, `'forbidden'`, `'rate_limited'`, `'unexpected'`,
`'transport_error'`.

Invitation evidence — `organization_onboarding_invitation_results.evidence_kind`
after `ENG-ONB-1H-P0-B4`: `'created_invitation'`, `'pending_invitation'`,
`'active_membership'`, `'membership_collision'`, `'frozen_intent_invalid'`,
`'historical_invitation'`, `'rate_limited'`, `'none'`.

`P1 STATE VOCABULARY IS DATABASE-OWNED`

`SECOND CLIENT-OWNED STATE MACHINE = PROHIBITED`

### 7.5 P1 non-goals

P1 must not:

1. create, alter, or replace any migration, table, column, constraint, RPC,
   trigger, grant, or RLS policy;
2. regenerate `src/types/database.generated.ts`;
3. define a client-owned onboarding state machine, or any client-side derivation
   of readiness, completion, or invitation outcome;
4. introduce a batch invitation operation — P0-A explicitly declines one
   (`20260908111356` L6–7);
5. send email or alter invitation delivery, tokens, expiry, or acceptance;
6. widen public registration, self-service enrollment, or the
   `complete_owner_self_registration` preconditions;
7. enable, unlock, or auto-configure social publishing;
8. promote any context pack readiness state or broaden BQA/customer admission;
9. apply migrations to Production or perform any deployment;
10. redesign `V2YouCompanyForm`, `OperatingModelSelector`, or
    `WorkspaceConfirmation`, except where P1 requires a state or interaction they
    demonstrably lack today;
11. change repository-wide design tokens in `src/app/globals.css` — see §13.4;
12. modify `ONBOARDING-1A` operating-model assignment or the committed
    `assign_organization_operating_model` path;
13. reopen, re-audit, or restate the status of any unit closed under
    `BETA1-4TG-MASTER-FV`;
14. alter, delete, or rewrite any historical evidence document.

---

## 8. Frozen P1 security invariants

Eighteen invariants. Each is either already implemented — with its committed
source cited — or is a **P1 acceptance requirement** that P1 must satisfy and
prove. Nothing here is recorded as passing on the basis of an external report.

| # | Invariant | Current implementation source | P1 obligation |
| --- | --- | --- | --- |
| 1 | Server-authoritative completion | `public.complete_organization_v2_onboarding`, `20260907140829` L476–581. `revoke update (onboarding_flow_version, onboarding_setup_ready_at, onboarding_completed_at) on table public.organizations from authenticated`, L40–63 | **P1 acceptance requirement**: completion is reached only via `completeV2OnboardingAction`; no client write path to any lifecycle column |
| 2 | Owner-only mutation authority where currently governed | `private.resolve_organization_onboarding_completion_actor`, `20260908111356` L231–292 (active `'owner'` membership, active org, `onboarding_flow_version = 2`, `onboarding_setup_ready_at is not null`); `private.resolve_onboarding_team_invite_intent_actor`, `20260907230410` L75–199; `transition-v2-onboarding.ts:106–112` | **P1 acceptance requirement**: every new server boundary re-checks Owner before any read of completion-run or invitation-result data; non-Owner members receive a safe non-leaking state |
| 3 | Organization-scoped isolation | RLS enabled with **zero policies** plus `revoke all … from public, anon, authenticated, service_role` on `organization_onboarding_completion_runs` (`20260908111356` L66–72), `organization_onboarding_invitation_results` (L219–225), `organization_onboarding_team_invite_intents` (`20260907230410` L41–44). Composite uniques `(organization_id, id)`, `(organization_id, intent_id)` | **P1 acceptance requirement**: `organizationId` is resolved server-side from membership, never trusted from a query string or form field |
| 4 | No client-supplied authoritative invitation outcome | `public.execute_organization_onboarding_invite_intent(p_organization_id uuid, p_intent_id uuid)` — two arguments only; `result_code`, `evidence_kind`, and `invitation_id` are resolved by `private.resolve_organization_onboarding_invite_intent_evidence` (`20260908111356` L306–430) | **P1 acceptance requirement**: no action parameter may carry an outcome, status, or evidence value |
| 5 | No client-supplied evidence, invitation ID, or idempotency identity | `idempotency_key` check constraint `'onboarding-invite/' \|\| organization_id::text \|\| '/' \|\| intent_id::text` (`20260908111356` L126–129), unique (L96–97); `private.persist_organization_onboarding_invite_intent_result` revoked from `public, anon, authenticated, service_role` | **P1 acceptance requirement**: P1 never constructs, stores, or transmits an idempotency key |
| 6 | Setup Ready required before invitation execution | completion actor gate requires `onboarding_setup_ready_at is not null` (`20260908111356` L257–290); `create_organization_invitation` / `resend_organization_invitation` return `'setup_not_ready'` and `accept_organization_invitation` returns `'invite_not_found_or_unavailable'` for V2 before Setup Ready (L885–892, L994–1001, L1081–1088) | **P1 acceptance requirement**: no execute call is issued from any UI path before Setup Ready has been durably recorded |
| 7 | Currently valid evidence required for readiness | `ENG-ONB-1H-P0-B4` pending-proof contract requires `oi.status = 'pending' and oi.expires_at > pg_catalog.now()`, asserted at `tests/security/onboarding-completion-authority-migration-security.test.ts:86–87` | **P1 acceptance requirement**: readiness is read from run status `'ready_for_cutover'`; P1 never treats an invitation row's mere existence as readiness |
| 8 | Historical evidence is non-terminal | `'invitation_proof_lost'` / `'historical_invitation'` (`20260908131955` L25, L40, L84–88); `private.advance_organization_onboarding_completion_run` does not count it as proven-terminal | **P1 acceptance requirement**: the Ready screen must not present a `'invitation_proof_lost'` row as a delivered invitation, and must offer retry rather than completion |
| 9 | Active membership precedence | `'already_member'` / `'active_membership'` resolved in `private.resolve_organization_onboarding_invite_intent_evidence`, `20260908111356` L306–430 | **P1 acceptance requirement**: rendered as a satisfied, non-error outcome |
| 10 | Foreign membership rejection | `'existing_membership_requires_admin_action'` / `'membership_collision'`, same resolver | **P1 acceptance requirement**: rendered as an actionable collision that does not block cutover readiness computation, with no cross-organization detail disclosed |
| 11 | Attempt and timestamp preservation | `attempt_count = case when coalesce(p_increment_attempt, true) then … + 1 else greatest(attempt_count, 1) end`; `last_attempt_at = case when … then v_now else coalesce(last_attempt_at, v_now) end` — pinned at `tests/security/onboarding-completion-authority-migration-security.test.ts:81–83` | **P1 acceptance requirement**: reconciliation is always invoked with the authority's own non-incrementing path; P1 never writes attempt data |
| 12 | Organization-scoped concurrency locking | `pg_catalog.pg_advisory_xact_lock(872004, pg_catalog.hashtext(coalesce(p_organization_id::text, '')))` in all five completion RPCs (`20260908111356` L1125, L1207, L1277, L1363, L1579; `20260908131955` L357) | **P1 acceptance requirement**: P1 must not add application-level locking, queueing, or retry loops that defeat or duplicate the database lock |
| 13 | Refresh / retry idempotency | `ensure … on conflict (organization_id) do nothing` (L1143–1148) and per-intent `on conflict (organization_id, intent_id) do nothing` (L1150–1165); terminal-result re-persist skip (L1414–1425); `idempotent: true` replay returns in both transition RPCs | **P1 acceptance requirement**: single-flight submission per intent; refresh, back-navigation, and double-submit produce no additional attempt and no duplicate invitation |
| 14 | No invitation or email side effects from reconciliation | reconcile call-graph is pinned to exactly five permitted callees at `tests/security/onboarding-completion-authority-migration-security.test.ts:114–120`, and `20260908131955` L464–465 records that reconcile never creates invitations or tokens | **P1 acceptance requirement**: the reconciliation path is reachable only via `reconcile_organization_onboarding_invite_intent`; no P1 code may call an invitation-creating RPC during recovery |
| 15 | No product-route access before authoritative completion | `redirectIfOrganizationOnboardingIncomplete`, `src/features/onboarding/server/enforce-product-onboarding.ts:18`; permits only `kind: "v2_completed"`; 15 committed product resolver call sites | **P1 acceptance requirement**: new Creating and Ready routes are added to the enforced set with the same fail-closed policy; direct navigation to any product route before `onboarding_completed_at` still redirects |
| 16 | V1 and `NULL` compatibility where already contracted | `organizations_onboarding_complete_requires_fields` version-aware check, `20260907140829` L13–31; `PersistedOnboardingFlowVersion = OnboardingFlowVersion \| null`, `src/features/onboarding/domain/onboarding-flow-version.ts:9`; `apply_organization_onboarding` refuses V2 complete, `20260907140829` L140–143 | **P1 acceptance requirement**: zero behavioral change for `NULL` and `1` organizations, proven by regression tests |
| 17 | No widening of public registration | `public.complete_owner_self_registration`, `20260907120240` L72–213: requires `auth.uid()`, requires `auth.users.email_confirmed_at is not null`, requires a `registration_intents` row, locks on `pg_advisory_xact_lock(872001, hashtext(v_user_id::text))` | **P1 acceptance requirement**: unchanged; P1 touches no registration, auth, or provisioning path |
| 18 | No automatic enabling of social publishing | separately governed; `BETA1-4TG-MASTER-FV` records `SOCIAL EXECUTION GATES CHANGED = NO` and `SOCIAL REMAINS INDEPENDENTLY ENROLLMENT/GATE CONTROLLED` | **P1 acceptance requirement**: completing onboarding grants no social capability, connection, or publishing entitlement; proven by an explicit negative test |

`INVARIANTS WITH COMMITTED IMPLEMENTATION SOURCE = 17`

`INVARIANTS THAT ARE P1 ACCEPTANCE REQUIREMENTS = 18`

`INVARIANTS WITH NO CURRENT IMPLEMENTATION SOURCE = 1 (#18, separately governed)`

Invariants 1–17 have committed database or server implementation. Every one of
the eighteen is *also* a P1 acceptance requirement, because a correct database
guarantee can still be defeated by an application layer that bypasses it,
misreports it, or leaks around it.

---

## 9. Frozen P1 slice decomposition

Four implementation slices, strictly sequential. The recommended decomposition
was validated against committed source and is adopted **with one refinement**:
the durable Setup Ready wiring stays in P1-A, because
`ensure_organization_onboarding_completion_run` cannot pass its own actor gate
until `onboarding_setup_ready_at` is set (`20260908111356` L257–290) — the two
are a single indivisible dependency, not two slices.

`P1 SLICE COUNT = 4`

`PARALLEL P1 IMPLEMENTATION = PROHIBITED`

All four slices write to `src/features/onboarding/**` and
`src/app/onboarding/**`, and P1-B, P1-C, and P1-D each consume state
introduced by their predecessor. Overlap is total, so parallel execution is
prohibited unless a future overlap preflight proves a disjoint file partition.
`B1-GATE.1` §13.4 additionally requires a renewed overlap preflight for parallel
laptop work on shared paths.

### 9.1 `ENG-ONB-1H-P1-A` — Completion Run Integration

**Objective.** Wire the durable Setup Ready transition and make the completion
run readable by the application, with server-side Owner validation. No invitation
is executed.

**Prerequisites.** `ENG-ONB-1H-P0-RV-EVIDENCE` must be **closed** before P1-A
closure (§10.4). This contract published. `ENG-ONB-1H-C` and `ENG-ONB-1H-P0-A`
committed at `22721fad`.

**Exact allowed source areas.**
`src/features/onboarding/server/` (new completion-run reader module);
`src/features/onboarding/actions/onboarding-actions.ts` (new ensure action only);
`src/features/onboarding/domain/` (new result-shape parsers);
`src/app/onboarding/workspace-confirmation/page.tsx` and
`src/app/onboarding/team/page.tsx` (Setup Ready invocation point only);
`src/features/onboarding/ui/` (Setup Ready affordance only);
`tests/onboarding/`.

**Prohibited changes.** `supabase/**`; `src/types/database.generated.ts`; any
invitation execution or reconciliation call; any new route; any product-route
change; any change to `V2YouCompanyForm` or `OperatingModelSelector`;
`src/app/globals.css`.

**User-visible outcome.** An Owner of a V2 organization with a configured
context, completed core fields, and a reviewed Team step can take one deliberate
action that durably records Setup Ready. On success the organization's completion
run exists and is readable. No invitation is sent.

**Security boundaries.** Invariants 1, 2, 3, 6, 12, 13, 16, 17 of §8.
`organizationId` resolved server-side. Non-Owner receives a safe state with no
completion-run data. Setup Ready replay returns `idempotent: true` and creates no
second run.

**Tests.** `npx vitest run tests/onboarding tests/security/onboarding-v2-transition-authority.test.ts tests/security/onboarding-completion-authority-migration-security.test.ts`
must pass, and must include new tests proving: `mark_organization_onboarding_setup_ready`
is the only lifecycle RPC invoked; `ensure_organization_onboarding_completion_run`
is called with `{ p_organization_id }` only; a non-Owner member receives no run
data; a `NULL`-version and a version-`1` organization are unaffected; double
submission yields one run.

**Runtime requirements.** Against a local PostgreSQL instance carrying all seven
onboarding migrations: Setup Ready on a fresh V2 organization sets
`onboarding_setup_ready_at`; `ensure_organization_onboarding_completion_run`
returns `status = 'setup_ready'`, or `'ready_for_cutover'` when the organization
has zero frozen intents (`20260908111356` L757–758); a second `ensure` call
preserves `started_at`; a non-Owner call returns `'NOT_AUTHORIZED'`; a
pre-Setup-Ready call returns `'INVALID_LIFECYCLE'`. Recorded as a committed
runtime artifact per §10.

**Browser requirements.** Gate 7 journeys `J1`, `J2`, and `J13`–`J15` of §13.1,
on desktop, tablet, and mobile, for all four operating models.

**PASS rule.** `npm run typecheck`, `npm run lint`, `npm run build` pass;
targeted and full Vitest suites pass with no new failure beyond the two accepted
baseline failures recorded in `BETA1-4TG-MASTER-FV`; runtime matrix above
recorded in a committed artifact; browser journeys evidenced; `git diff --check`
clean; `supabase/**` and `src/types/database.generated.ts` unchanged; a phase
document exists under `docs/phases/`; pushed with divergence `0 0`.

**BLOCKED rule.** BLOCKED if any of: Setup Ready is reachable by a non-Owner;
`onboarding_setup_ready_at` is writable from the application; a completion run is
created or read before Setup Ready; a duplicate run or duplicate intent row is
created on replay; V1 or `NULL` behavior changes; any invitation side effect
occurs; `supabase/**` or generated types change;
`ENG-ONB-1H-P0-RV-EVIDENCE` is not closed.

**Successor.** `ENG-ONB-1H-P1-B`.

### 9.2 `ENG-ONB-1H-P1-B` — Governed Invitation Execution and Creating State

**Objective.** Execute frozen invite intents through governed authority, render
the Creating and partial-result experience, and provide controlled
retry/reconciliation. Onboarding is not completed and product routes are not
opened.

**Prerequisites.** `ENG-ONB-1H-P1-A` closed.

**Exact allowed source areas.** `src/features/onboarding/server/`;
`src/features/onboarding/actions/`; `src/features/onboarding/domain/`;
`src/features/onboarding/ui/` (new Creating surface);
`src/app/onboarding/` (one new Creating route);
`tests/onboarding/`.

**Prohibited changes.** `supabase/**`; `src/types/database.generated.ts`; any
call to `complete_organization_v2_onboarding`; any product-route or
`enforce-product-onboarding.ts` change; any invitation-delivery, template, token,
expiry, or acceptance change; `src/app/globals.css`; any batch invitation
operation.

**User-visible outcome.** After Setup Ready, the Owner sees a calm Creating state
listing each frozen invite intent with its authoritative outcome as it resolves.
Partial outcomes — already a member, invitation already pending, membership
collision requiring admin action, rate limited, transport error, stale historical
invitation — are each stated in plain language. Retry is available for
non-terminal outcomes. Refresh does not lose or duplicate progress.

**Security boundaries.** Invariants 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 of
§8. Execution is per-intent via
`execute_organization_onboarding_invite_intent(p_organization_id, p_intent_id)`.
Recovery is exclusively via
`reconcile_organization_onboarding_invite_intent(p_organization_id, p_intent_id)`.
This slice receives the intended actionable-invitation scope reassigned from the
retired `ENG-ONB-1G-A` identifier (§6.2).

**Tests.** `npx vitest run tests/onboarding tests/security/onboarding-completion-authority-migration-security.test.ts tests/security/onboarding-team-invite-intent-migration-security.test.ts`,
including new tests proving: every one of the eleven `result_code` values renders
a distinct non-misleading message; no action signature accepts `result_code`,
`evidence_kind`, `invitation_id`, or `idempotency_key`; reconciliation never
reaches an invitation-creating RPC; double submission of the same intent produces
one execute call; `'invitation_proof_lost'` is presented as non-terminal and
retryable; a foreign-organization `p_intent_id` is refused.

**Runtime requirements.** Against local PostgreSQL: a three-intent organization
reaching all of `'success'`, `'already_member'`, and
`'existing_membership_requires_admin_action'`; run status transitioning
`'setup_ready'` → `'inviting'` → `'invite_partial'`; a genuine data-bearing
concurrency case in which two simultaneous executes of the same intent yield one
`attempt_count` increment; reconciliation of an expired pending invitation
producing `'invitation_proof_lost'` / `'historical_invitation'` with
`attempt_count` preserved and `last_attempt_at` unchanged; zero rows added to
`organization_invitations` by any reconcile call.

**Browser requirements.** Gate 7 journeys `J3`–`J7` of §13.1, on desktop,
tablet, and mobile, for all four operating models.

**PASS rule.** As §9.1, plus: no `complete_organization_v2_onboarding` call site
exists in this slice; no product route is reachable; `organization_invitations`
row count is unchanged by every reconcile path in the runtime matrix.

**BLOCKED rule.** BLOCKED if any of: a client-supplied outcome, evidence,
invitation ID, or idempotency value is accepted anywhere; reconciliation causes an
invitation or email side effect; a duplicate invitation is created on retry or
refresh; `attempt_count` or `last_attempt_at` is written by application code; a
partial outcome is displayed as success; a stale historical invitation is
displayed as delivered; execution is possible before Setup Ready; cross-tenant
intent access succeeds; onboarding completes in this slice.

**Successor.** `ENG-ONB-1H-P1-C`.

### 9.3 `ENG-ONB-1H-P1-C` — Ready Reconstruction and Explicit Completion

**Objective.** Reconstruct the Ready state from authoritative results, present an
accurate summary, expose a deliberate Enter ZyntixAI action, and perform the
server-authoritative completion transition. Product access is not yet granted by
this slice.

**Prerequisites.** `ENG-ONB-1H-P1-B` closed.

**Exact allowed source areas.** `src/features/onboarding/server/`;
`src/features/onboarding/actions/onboarding-actions.ts`;
`src/features/onboarding/domain/`;
`src/features/onboarding/ui/` (Ready surface; `"ready"` progress step activation);
`src/app/onboarding/` (one new Ready route); `tests/onboarding/`.

**Prohibited changes.** `supabase/**`; `src/types/database.generated.ts`;
`src/features/onboarding/server/enforce-product-onboarding.ts`; any product
feature directory; `src/app/globals.css`; any new invitation execution path.

**User-visible outcome.** When the completion run reaches `'ready_for_cutover'`,
the Owner reaches a Ready screen — the first screen in the program to set
`currentStep="ready"` — showing what was actually provisioned: workspace name,
operating model, and per-invitation authoritative outcomes. A single explicit
Enter ZyntixAI action completes onboarding. The action is unavailable while the
run is not `'ready_for_cutover'`.

**Security boundaries.** Invariants 1, 2, 3, 7, 8, 12, 13, 15, 16, 18 of §8. The
Enter ZyntixAI affordance is a request to the server, never a client-side
determination that completion is permitted;
`complete_organization_v2_onboarding` re-verifies Owner, active organization,
`onboarding_flow_version = 2`, and `onboarding_setup_ready_at is not null`
independently.

**Tests.** `npx vitest run tests/onboarding tests/security/onboarding-v2-transition-authority.test.ts`,
including new tests proving: the Ready screen renders only from
`list_organization_onboarding_invitation_results` and run status; Enter ZyntixAI
is disabled unless status is `'ready_for_cutover'`; completion invokes exactly
`complete_organization_v2_onboarding`; replay returns `idempotent: true` with
`state: 'completed'` and does not re-run invitations; a `'invitation_proof_lost'`
row prevents a false "all invitations sent" summary; no social capability,
connection, or entitlement is created by completion.

**Runtime requirements.** Against local PostgreSQL: completion from
`'ready_for_cutover'` sets `onboarding_completed_at` and satisfies
`organizations_onboarding_complete_requires_fields`; completion attempted from
`'invite_partial'` is refused; completion attempted without Setup Ready returns
`'SETUP_NOT_READY'`; a non-Owner attempt returns `'NOT_AUTHORIZED'`; a repeated
completion is idempotent and adds no invitation attempt.

**Browser requirements.** Gate 7 journeys `J8`, `J9`, and `J12` of §13.1, on
desktop, tablet, and mobile, for all four operating models.

**PASS rule.** As §9.1, plus: `enforce-product-onboarding.ts` is unchanged; the
Ready summary is provably reconstructed from authoritative results only; the
negative social-entitlement test passes.

**BLOCKED rule.** BLOCKED if any of: completion is reachable before
`'ready_for_cutover'`; the Ready summary misstates any invitation outcome; Enter
ZyntixAI completes onboarding client-side or optimistically; completion is
reachable by a non-Owner; repeated completion re-executes invitations; product
access is granted by this slice; any social gate changes.

**Successor.** `ENG-ONB-1H-P1-D`.

### 9.4 `ENG-ONB-1H-P1-D` — Product Route Cutover and Recovery

**Objective.** Integrate the new onboarding routes with product-route
enforcement, guarantee refresh and direct-navigation recovery at every stage,
handle completed-user re-entry, add error boundaries and safe fallbacks, and
preserve four-target operating-model context across cutover.

**Prerequisites.** `ENG-ONB-1H-P1-C` closed.

**Exact allowed source areas.**
`src/features/onboarding/server/enforce-product-onboarding.ts`;
`src/features/onboarding/domain/onboarding-routes.ts`;
`src/features/onboarding/domain/onboarding-lifecycle.ts` (destination mapping for
the new routes only); `src/app/onboarding/**`;
`src/features/onboarding/ui/` (error boundaries and fallbacks);
`tests/onboarding/`; `tests/features/`; `tests/security/`.

**Prohibited changes.** `supabase/**`; `src/types/database.generated.ts`; any
product feature's domain logic; `src/middleware.ts`; any capability, context-pack,
readiness, admission, or terminology definition; `src/app/globals.css`.

**User-visible outcome.** A refresh or a pasted URL at any onboarding stage lands
the user on the correct stage rather than a dead end or a partially rendered
screen. Direct navigation to a product route before authoritative completion
redirects to the correct onboarding stage. After completion, onboarding routes
redirect to the product and the product route resolves in the organization's
correct operating-model context. Unexpected failures render a safe, actionable
boundary and never a raw error.

**Security boundaries.** Invariants 3, 15, 16, 18 of §8. Enforcement remains
fail-closed: any state that is not `kind: "v2_completed"` denies product access.
The new Creating and Ready routes gain the same Owner and lifecycle gates already
used by `src/app/onboarding/team/page.tsx:87–103`. Four-target module gating from
`BETA1-4TG-MASTER-FV` — `HIDDEN MODULE = DIRECT ROUTE DENIED`,
`UNKNOWN CONTEXT = FAIL CLOSED` — must remain intact after cutover.

**Tests.** `npx vitest run tests/onboarding tests/features tests/security`,
including new tests proving: each of the nine `OnboardingLifecycleState.kind`
values maps to exactly one defined destination with no fall-through to a generic
panel for any V2 stage; all 15 committed
`redirectIfOrganizationOnboardingIncomplete` call sites still deny incomplete V2
organizations; a completed organization is redirected off every onboarding route;
each of the four operating models resolves its correct product context
immediately after cutover; the two accepted baseline failures recorded in
`BETA1-4TG-MASTER-FV` remain the only failures in the full suite.

**Runtime requirements.** Against local PostgreSQL: a full single-organization
traversal from V2 provisioning to product access for each of the four operating
models, with a forced refresh injected at Setup Ready, mid-execution, and Ready,
proving no duplicate invitation, no lost run, and no premature product access.

**Browser requirements.** Gate 7 journeys `J1`–`J15` of §13.1 in full, on
desktop, tablet, and mobile, for all four operating models. This is the complete
matrix.

**PASS rule.** As §9.1, plus: full-suite regression parity with the
`BETA1-4TG-MASTER-FV` baseline; the complete §13.1 browser matrix evidenced; the
four-target gating matrix proven unchanged.

**BLOCKED rule.** BLOCKED if any of: any product route is reachable before
`onboarding_completed_at` is set; any onboarding stage can dead-end on refresh or
direct navigation; a completed user can re-enter and re-run onboarding
mutations; any V2 lifecycle state falls through to a generic panel; four-target
module gating regresses; a raw error or stack trace reaches the user; a new
full-suite regression appears.

**Successor.** `ENG-ONB-1H-PROD`, then `ENG-ONB-1H-FV`.

---

## 10. `ENG-ONB-1H-P0-RV-EVIDENCE` — runtime evidence recovery

### 10.1 Why this phase exists

The verification for `ENG-ONB-1H-P0-A` and `ENG-ONB-1H-P0-B4` is static: the
test reads migration files with `readFileSync` and asserts SQL text, constraint
bodies, literal sets, call-graph boundaries, and a SHA-256 pin. It never connects
to PostgreSQL. Local runtime verification was performed outside the repository
and is not addressable by any commit.

This document does not present that external work as repository-native evidence.
`B1-GATE.1` §12.6 forbids treating missing evidence as executed.

The repository already establishes the correct artifact form: twelve committed
`tests/security/*-live-verification.sql` scripts, including
`tests/security/onboarding-team-invite-intent-live-verification.sql` for
`ENG-ONB-1G-A1`. That script is `\set ON_ERROR_STOP on`, wrapped in
`begin; … rollback;`, seeds only synthetic `@example.test` identities, asserts
prior/after counters for invitations, deliveries, events, memberships, and
assignments, restores and verifies original organization lifecycle values, and
ends with `raise notice 'ENG-ONB-1G-A1 LIVE PASS: 17 rejection/authorization
checks; 5 creates; 1 update; 5 deletes; 0 invitation side effects'`.

**There is no equivalent script for the completion authority.** That is the exact
gap this phase closes.

### 10.2 Objective

Create and govern a reusable local PostgreSQL verification artifact that proves
the committed `ENG-ONB-1H-P0-A` and `ENG-ONB-1H-P0-B4` authority at runtime, in
the established repository form, addressable by commit.

### 10.3 Required properties

1. **Reusable governed script.** A committed
   `tests/security/onboarding-completion-authority-live-verification.sql`
   following the existing convention: `\set ON_ERROR_STOP on`, one
   `begin; … rollback;` transaction, deterministic `raise exception` on any
   violated assertion, terminal `raise notice` PASS line naming
   `ENG-ONB-1H-P0-A` and `ENG-ONB-1H-P0-B4` with exact check counts.
2. **Covers the existing P0-A and P0-B4 runtime matrix.** At minimum: the actor
   gate returning `'NOT_AUTHENTICATED'`, `'NOT_AUTHORIZED'`,
   `'INVALID_LIFECYCLE'`, `'OK'`; `ensure` idempotency including `started_at`
   preservation and per-intent seeding; every reachable `result_code` /
   `evidence_kind` pair permitted by the proof check constraint; the
   `'invitation_proof_lost'` / `'historical_invitation'` forward transition with
   `attempt_count` and `last_attempt_at` preserved; run status transitions across
   `'setup_ready'`, `'inviting'`, `'invite_partial'`, `'ready_for_cutover'`; the
   zero-intent direct-to-`'ready_for_cutover'` path; the V2-before-Setup-Ready
   denials on `create_organization_invitation`,
   `resend_organization_invitation`, and `accept_organization_invitation`;
   rejection of direct table access under `authenticated`; cross-tenant
   rejection; and zero invitation, delivery, or membership side effects from
   every reconcile path.
3. **Real data-bearing concurrency.** At least two genuinely concurrent sessions
   contending on the same `organization_id` through
   `pg_advisory_xact_lock(872004, …)`, proving serialization with exactly one
   `attempt_count` increment and no duplicate `organization_onboarding_invitation_results`
   row. A single-session simulation does not satisfy this requirement.
4. **No Production credentials.** No connection string, service-role key, token,
   password, project reference, or real email address in any committed file.
   Local connection parameters are supplied by the operator at run time.
5. **Zero fixtures left behind.** Every assertion runs inside the single
   transaction and the script ends in `rollback`. After execution, all onboarding
   and invitation table counts equal their pre-run values, asserted explicitly.
6. **Documented checkpoint and rollback rules.** The phase document must state
   the required local migration set, the exact invocation, the expected PASS
   notice, the failure semantics of `ON_ERROR_STOP`, and the guarantee that no
   committed migration is modified and no `db reset`, `db push`, or repair is
   performed.
7. **Commit-addressable evidence artifact.** A phase document under
   `docs/phases/` recording the script path, the executing commit SHA, the exact
   PASS notice text, the concurrency observation, and the post-run zero-residue
   assertion.

### 10.4 Dependency decision — stated explicitly

**`ENG-ONB-1H-P0-RV-EVIDENCE` must be closed before `ENG-ONB-1H-P1-A` closure,
and before any Production application of the onboarding migrations.** It may be
authored in parallel with P1-A design and implementation.

The reasoning is a dependency, not a preference. P1-A's own runtime matrix
(§9.1) asserts behavior of `ensure_organization_onboarding_completion_run` and
the completion actor gate. If the underlying authority has never been proven at
runtime in a commit-addressable form, then P1-A's runtime evidence would rest on
an unverified foundation, and a P1-A failure could not be attributed between the
application layer and the database layer. Equally, `ENG-ONB-1H-PROD` (§12) would
otherwise apply to Production a migration whose runtime behavior the repository
has never proven.

Blocking P1-A *start* is not required: P1-A design consumes the committed SQL
contracts, which are already fixed and checksum-pinned.

`RV-EVIDENCE BEFORE P1-A CLOSURE = REQUIRED`

`RV-EVIDENCE BEFORE PRODUCTION APPLICATION = REQUIRED`

`RV-EVIDENCE BEFORE P1-A START = NOT REQUIRED`

### 10.5 Slice contract

**Prerequisites.** This contract published.
**Allowed source areas.** `tests/security/` (new `*-live-verification.sql` only);
optionally `scripts/` for a non-secret runner; `docs/phases/`.
**Prohibited changes.** `supabase/**`; `src/**`; `tests/**` other than the new
SQL artifact; any dependency or configuration file; any Production access.
**PASS rule.** The committed script executes against a local PostgreSQL instance
carrying all seven onboarding migrations, emits its PASS notice, leaves zero
residue, demonstrates real concurrency, contains no secret, and its result is
recorded in a committed phase document. `git diff --check` clean.
**BLOCKED rule.** BLOCKED if any of: the script requires Production credentials;
any fixture survives; concurrency is simulated rather than real; any migration
is modified; any assertion is weakened to force a pass; the PASS notice is
recorded without a corresponding execution.
**Successor.** `ENG-ONB-1H-P1-A` closure.

---

## 11. `ENG-ONB-1H-FV` — terminal gate

**Objective.** Prove that V2 onboarding is complete, secure, recoverable, and
correct end to end across all four operating models, and that a newly provisioned
V2 organization can reach the product safely in Production.

`ENG-ONB-1H-FV` is the terminal gate of `ENG-ONB-1H`. It replaces the retired
`ENG-ONB-FV` identifier (§6.1) and inherits no scope from it.

**Prerequisites.** `ENG-ONB-1H-P0-RV-EVIDENCE`, `ENG-ONB-1H-P1-A`,
`ENG-ONB-1H-P1-B`, `ENG-ONB-1H-P1-C`, `ENG-ONB-1H-P1-D`, and
`ENG-ONB-1H-PROD` all closed with repository evidence.

**Required acceptance dimensions.**

| Dimension | Concrete requirement |
| --- | --- |
| Static | `npm run typecheck`, `npm run lint`, `npm run build` all pass; `git diff --check` clean; no secret, credential, token, or real email in any changed file |
| Automated | full `npm run test:run` with no failure beyond the two accepted baseline failures recorded in `BETA1-4TG-MASTER-FV` §Tests; the complete `tests/security/` suite passes |
| Runtime | the `ENG-ONB-1H-P0-RV-EVIDENCE` script re-executes and passes at FV HEAD; a full provisioning-to-product traversal is proven for each of the four operating models |
| Browser | the complete §13.1 matrix — 15 journeys × 3 viewports × 4 operating models — evidenced |
| Security | all 18 §8 invariants re-proven at FV HEAD; cross-tenant, non-Owner, unauthenticated, and pre-Setup-Ready denials verified; no client-supplied outcome path exists |
| Cross-target | the `BETA1-4TG-MASTER-FV` AppShell/access matrix and terminology matrix unchanged; `HIDDEN MODULE = DIRECT ROUTE DENIED` and `UNKNOWN CONTEXT = FAIL CLOSED` intact; TG1–TG4 regression suites at parity |
| Production | onboarding migrations applied to Production under `ENG-ONB-1H-PROD`; one controlled authenticated Production traversal of a newly provisioned V2 organization; rollback assessment with the prior Ready deployment ID recorded |
| Documentation | a phase document under `docs/phases/` satisfying every `B1-GATE.1` Gate 9 element |

**PASS rule.** Every dimension above evidenced in repository documentation; open
blockers `0`; open mandatory conditions `0`; the `B1-GATE.1` §8 dashboard
published at `PHASE COMPLETION: 100%`; verdict
`CLOSED WITH EVIDENCE — 100% REQUIRED GATES PASSED`; pushed with divergence
`0 0` and a clean worktree.

**BLOCKED rule.** BLOCKED if any of: any §8 invariant is unproven at FV HEAD; any
prerequisite slice is not closed; a newly provisioned V2 organization cannot
complete onboarding in Production; any four-target regression appears; Production
verification is missing or justified only generically; any evidence is asserted
without a committed artifact.

**Successor.** Controlled four-target closed-beta admission promotion —
separately governed (§12).

---

## 12. `ENG-ONB-1H-PROD` and four-target Beta 1 reconciliation

### 12.1 What `BETA1-4TG-MASTER-FV` did and did not establish

Read directly from
`docs/phases/BETA1-4TG-MASTER-FV-four-target-group-beta1-master-final-verification-evidence.md`:

1. It **verified the four-target implementation scope**. All 39 governed master
   criteria pass; `TG1`–`TG4` are each `CLOSED WITH EVIDENCE`;
   `ZYNTIXAI BETA-1 FOUR-TARGET-GROUP PRODUCT = 100% CLOSED WITH EVIDENCE`.
2. It **did not deploy or promote TG2–TG4 to beta-supported Production
   admission**. That document records `PRODUCTION MIGRATIONS APPLIED = 0`,
   `DEPLOYMENTS = 0`, `NO CTX BETA_SUPPORTED PROMOTION`,
   `TARGET FINAL VERIFICATION DOES NOT IMPLY AUTOMATIC BETA_SUPPORTED PROMOTION`,
   `PRODUCT ACCEPTANCE CLOSED ≠ PRODUCTION DEPLOYED`, and that
   `foundation.service`, `foundation.field-operations`, and
   `foundation.product-operations` all remain `context_ready`. BQA/customer
   admission was not broadened.
3. **`ENG-ONB` was outside that master scope.** Its authoritative closure
   inventory lists `ONBOARDING-1A` only. No `ENG-ONB-*` identifier appears
   anywhere in it. Its own §Post-Beta-1 next steps place "onboarding and UX
   polish" in separately governed remaining work. Its onboarding verification row
   covers operating-model context assignment, not V2 completion.
4. **Current V2 enrollment plus an incomplete application completion path creates
   a release dependency.** `complete_owner_self_registration`
   (`20260907120240` L165–196) provisions every new owner-registered organization
   at `onboarding_flow_version = 2`. Per §7.2, a V2 organization currently has no
   application path to completion, and
   `redirectIfOrganizationOnboardingIncomplete` correctly denies product access
   until `kind: "v2_completed"`. The two facts compose into a hard blocker for
   any newly admitted organization.

`NEWLY PROVISIONED V2 ORGANIZATION = CANNOT REACH PRODUCT TODAY`

### 12.2 Reconciliation statements

- No new Beta 1 organization may be admitted through V2 until
  `ENG-ONB-1H-P1-A` … `ENG-ONB-1H-P1-D` and `ENG-ONB-1H-FV` pass.
- Course Sellers' historical readiness does **not** override the new V2
  onboarding gate for newly provisioned organizations. `B1-FV` and
  `BETA1-4TG-MASTER-FV` closed the TG1 product and the four-target product; they
  did not verify V2 onboarding, which did not exist in their scope. A pre-V2 TG1
  organization is unaffected because it carries `onboarding_flow_version` `1` or
  `NULL`; a newly provisioned TG1 organization is enrolled at `2` and is subject
  to the same gate as TG2–TG4.
- Context readiness and admission promotion remain **separately governed**. This
  contract promotes nothing and does not touch context-pack readiness, BQA, or
  customer admission.
- Social publishing **remains disabled** and independently gated. Completing V2
  onboarding grants no social capability or entitlement (§8 invariant 18).

### 12.3 `ENG-ONB-1H-PROD` — controlled Production application

**Objective.** Apply the seven committed onboarding migrations to Production
under controlled change, with rollback assessment, so that `ENG-ONB-1H-FV` can
perform Production acceptance.

**Prerequisites.** `ENG-ONB-1H-P0-RV-EVIDENCE` closed (§10.4);
`ENG-ONB-1H-P1-D` closed.
**Allowed scope.** Production migration application and deployment only; a phase
document under `docs/phases/`.
**Prohibited changes.** Any modification to a committed migration; any schema
change; any readiness, admission, or social gate change; any application source
change.
**PASS rule.** Migrations applied in committed order with no modification;
Production schema matches the committed migration set; rollback assessment with
the prior Ready deployment ID recorded; no unauthorized Production data write;
a committed phase document records the applied set, the deployment identity, and
the verification queries used.
**BLOCKED rule.** BLOCKED if any of: a migration is edited to make it apply;
Production schema diverges from the committed set; rollback assessment is absent;
any readiness promotion or admission widening occurs alongside;
`ENG-ONB-1H-P0-RV-EVIDENCE` is not closed.
**Successor.** `ENG-ONB-1H-FV`.

### 12.4 Release dependency

`ENG-ONB-1H-FV MUST PASS BEFORE CONTROLLED FOUR-TARGET CLOSED-BETA ADMISSION PROMOTION`

Controlled four-target closed-beta admission promotion is a separately governed
gate outside `ENG-ONB`. It is not counted in §15. `ENG-ONB-1H-FV` is a blocking
prerequisite for it.

---

## 13. Browser and UX acceptance contract

### 13.1 Gate 7 journey matrix

Fifteen journeys. The matrix is 15 journeys × 3 viewports × 4 operating models.

| ID | Journey | Owning slice | Full matrix at |
| --- | --- | --- | --- |
| `J1` | Workspace step — review and proceed | P1-A | P1-D, FV |
| `J2` | Team step — invite intents reviewed, Setup Ready taken | P1-A | P1-D, FV |
| `J3` | Creating state — intents executing, progress truthful | P1-B | P1-D, FV |
| `J4` | Refresh during execution — no duplicate, no loss | P1-B | P1-D, FV |
| `J5` | Partial invitation outcomes — mixed results stated plainly | P1-B | P1-D, FV |
| `J6` | Membership collision — `'existing_membership_requires_admin_action'` presented actionably | P1-B | P1-D, FV |
| `J7` | Stale / expired invitation recovery — `'invitation_proof_lost'` retried | P1-B | P1-D, FV |
| `J8` | Ready reconstruction — authoritative summary after return | P1-C | P1-D, FV |
| `J9` | Explicit Enter ZyntixAI — deliberate completion | P1-C | P1-D, FV |
| `J10` | Direct navigation to a product route before completion — redirected | P1-D | P1-D, FV |
| `J11` | Direct navigation to an onboarding route after completion — redirected to product | P1-D | P1-D, FV |
| `J12` | Completed-user re-entry — no re-run of onboarding mutations | P1-C, P1-D | P1-D, FV |
| `J13` | Desktop viewport ≥ 1280 px | all | P1-D, FV |
| `J14` | Tablet viewport ≈ 768–1024 px | all | P1-D, FV |
| `J15` | Mobile viewport ≈ 375–430 px, sticky action treatment | all | P1-D, FV |

Operating models covered for every journey, per
`V2_ONBOARDING_CONTEXT_PACKS`: `niche.online-course-business` over
`foundation.knowledge` (TG1), `foundation.service` (TG2),
`foundation.field-operations` (TG3), `foundation.product-operations` (TG4).

`GATE 7 JOURNEYS = 15`

`VIEWPORTS = 3`

`OPERATING MODELS = 4`

### 13.2 Premium UX requirements

New P1 surfaces must be calm, modern, and high-end, and must provide:

- clear, honest progress that reflects only authoritative state;
- **no fake analytics**, no invented counts, no simulated progress animation that
  does not correspond to a real resolved outcome;
- mobile sticky action treatment where a primary action would otherwise fall
  below the fold — specifically Setup Ready, retry, and Enter ZyntixAI;
- target-aware language derived from the resolved operating model, using the
  committed terminology projection recorded in `BETA1-4TG-MASTER-FV`
  (Customer / Client, Project / Job);
- **no target-specific color coding** — the operating model changes words, never
  palette;
- semantic, dark-ready tokens in a light-only v1;
- Inter as the type family and deep muted indigo `#33438F` as the primary accent
  on new surfaces.

### 13.3 Scope limit on existing screens

`V2YouCompanyForm`, `OperatingModelSelector`, and `WorkspaceConfirmation` must
**not** be redesigned. They may be modified only where P1 requires a state or
interaction they currently lack — concretely, the Setup Ready affordance and the
activation of the `"ready"` progress step, both of which have no existing host.

### 13.4 Declared token gap — mandatory condition disposition

Verified at `22721fad`: `#33438F` and `Inter` **do not appear anywhere in this
repository**. A repository-wide search excluding build output returned zero
matches for `33438F`. `src/app/globals.css:9` defines
`--focus-color: #2563eb`, `src/features/onboarding/ui/onboarding-shell.module.css`
uses `#2563eb`, and `src/app/globals.css:15–20` sets a
`system-ui, -apple-system, Segoe UI, Roboto, sans-serif` stack.
`src/app/layout.tsx` imports no `next/font`.

The frozen direction is therefore **not implemented**, and this document does not
record it as implemented.

Adopting `#33438F` and `Inter` repository-wide means editing
`src/app/globals.css` and the root layout, which would restyle every closed
Beta 1 surface across TG1–TG4 and would constitute exactly the redesign §7.5
prohibits. Under `B1-GATE.1` §6, this condition is dispositioned:

`MOVED TO SEPARATE OWNER-APPROVED PHASE`

Justification per §6: it is clearly outside P1 scope; the agreed P1 user result
works safely on the existing tokens; no security, tenant, data, or primary-flow
issue remains; and the move does not dodge required verification, because P1's
own Gate 7 matrix remains fully mandatory.

The binding consequence for P1: every new P1 surface must consume **semantic
tokens** rather than literal color values, so that a later owner-approved
brand-token phase can adopt `#33438F` and `Inter` without reopening or editing
any P1 screen. A P1 slice that hard-codes a hex accent in a component or CSS
module fails its PASS rule.

This item is optional hardening for the program and is **excluded** from the
mandatory counts in §15.

---

## 14. `B1-GATE.1` gate mapping

### 14.1 This documentation-only contract phase

| Gate | Requirement here | Status |
| --- | --- | --- |
| 1 — Baseline and ownership | Root, branch, HEAD `22721fad`, upstream, divergence `0 0`, clean worktree, empty staging, initial `git diff --check` all verified before any change; no existing work deleted or overwritten; sole authorized change is one new file | **MANDATORY — PASS** |
| 2 — Scope contract | Exact goal, in/out of scope, allowlist and denylist, statuses, dependencies, and exit criteria are frozen in §1–§13 of this document | **MANDATORY — PASS** |
| 3 — Implementation completeness | `NOT_REQUIRED_WITH_JUSTIFICATION` — this phase implements no product behavior. Its own completeness requirement is documentary and is met by §4–§13: every existing unit has an evidence-backed status, every legacy identifier has an explicit disposition, and every future phase has an acceptance contract | **NOT_REQUIRED_WITH_JUSTIFICATION** |
| 4 — Automated tests | `NOT_REQUIRED_WITH_JUSTIFICATION` — one Markdown file under `docs/phases/` changes. No source, test, migration, generated type, configuration, or dependency changes, so no test outcome can be affected. Verified by `git status --short` showing exactly one untracked `.md` path | **NOT_REQUIRED_WITH_JUSTIFICATION** |
| 5 — Code quality | `git diff --check` clean; no secret, credential, token, connection string, or personal data; no temp file; no unexpected path. `typecheck`, `lint`, and `build` are `NOT_REQUIRED_WITH_JUSTIFICATION` on the same single-Markdown-file basis as Gate 4 | **MANDATORY — PASS** (diff-check, secrets, paths) |
| 6 — Security and tenant isolation | `NOT_REQUIRED_WITH_JUSTIFICATION` — no code path, RLS policy, grant, role, or query changes. The phase's security obligation is to *contract* the invariants without weakening them, discharged in §8, which cites committed sources and marks the rest as acceptance requirements | **NOT_REQUIRED_WITH_JUSTIFICATION** |
| 7 — Browser verification | `NOT_REQUIRED_WITH_JUSTIFICATION` — no user-visible change. No route, component, style, or copy is added or altered. The browser obligation is to *define* the matrix, discharged in §13.1 | **NOT_REQUIRED_WITH_JUSTIFICATION** |
| 8 — Production verification | `NOT_REQUIRED_WITH_JUSTIFICATION` — nothing is deployed; no production config, auth, RLS, routing, or deploy surface is touched; no production-observed defect is being fixed; no production flow is activated or changed. Production acceptance is contracted forward to `ENG-ONB-1H-PROD` (§12.3) and `ENG-ONB-1H-FV` (§11) | **NOT_REQUIRED_WITH_JUSTIFICATION** |
| 9 — Documentation and evidence | Documentation authority, traceability, and evidence location are the entire deliverable. Every §4 status cites a repository path; every rejected claim is recorded in §16; §5 records evidence location without backfill | **MANDATORY — PASS** |
| 10 — Publication | Repository cleanliness is mandatory: exactly one new untracked file, nothing staged, no tracked modification. Commit and push are a separate owner-approved act and are explicitly out of this phase's authority | **MANDATORY — PASS** (cleanliness); publication deferred |

Mandatory PASS gates for this phase: **1, 2, 5, 9, 10**.
`NOT_REQUIRED_WITH_JUSTIFICATION` gates: **3, 4, 6, 7, 8**, each with a
phase-specific auditable justification as required by `B1-GATE.1` §7.3.

### 14.2 Gate matrix for every future phase

`Y` = mandatory PASS. `J` = `NOT_REQUIRED_WITH_JUSTIFICATION` permitted with a
phase-specific written justification.

| Gate | `P0-RV-EVIDENCE` | `P1-A` | `P1-B` | `P1-C` | `P1-D` | `PROD` | `FV` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 Baseline | Y | Y | Y | Y | Y | Y | Y |
| 2 Scope freeze | Y | Y | Y | Y | Y | Y | Y |
| 3 Implementation completeness | Y | Y | Y | Y | Y | Y | Y |
| 4 Automated tests | Y | Y | Y | Y | Y | J | Y |
| 5 Static quality | Y | Y | Y | Y | Y | Y | Y |
| 6 Security / tenant isolation | Y | Y | Y | Y | Y | Y | Y |
| 7 Browser / visual | J | Y | Y | Y | Y | J | Y |
| 8 Production verification | J | J | J | J | J | Y | Y |
| 9 Documentation / evidence | Y | Y | Y | Y | Y | Y | Y |
| 10 Publication / closure | Y | Y | Y | Y | Y | Y | Y |

Additional cross-cutting requirements:

- **Readiness / dependency proof** — every slice must open by proving its
  predecessor is closed with repository evidence, and must record the exact
  prerequisite phase IDs from §9–§12.
- **Regression protection** — every implementation slice must run the full
  `npm run test:run` before closure and prove parity with the two accepted
  baseline failures recorded in `BETA1-4TG-MASTER-FV`. Generic "tests pass"
  wording is not acceptable; the concrete commands in §9 and §11 are binding.
- **Behavioral evidence** — Gate 4 for P1 slices requires named tests asserting
  the specific behaviors listed in each slice's Tests paragraph, not test counts.
- **Gate 7 justification limits** — `J` for `P0-RV-EVIDENCE` and `PROD` is
  permitted only because neither changes a user-visible surface. Any user-visible
  change in either phase converts Gate 7 to mandatory.
- **Gate 8 justification limits** — `J` for `P1-A` … `P1-D` is permitted only
  while no Production deployment occurs in those slices. Production acceptance is
  not waived; it is relocated to `PROD` and `FV`.

---

## 15. Deterministic remaining count

Counts are exact, not ranges. Optional hardening is excluded.

`REMAINING IMPLEMENTATION SLICES = 4`

`ENG-ONB-1H-P1-A`, `ENG-ONB-1H-P1-B`, `ENG-ONB-1H-P1-C`, `ENG-ONB-1H-P1-D`.

`REMAINING VERIFICATION / EVIDENCE SLICES = 2`

`ENG-ONB-1H-P0-RV-EVIDENCE`, `ENG-ONB-1H-FV`.

`REMAINING PRODUCTION / RELEASE GATES = 1`

`ENG-ONB-1H-PROD`.

`TOTAL GOVERNED PHASES BEFORE CONTROLLED CLOSED-BETA ADMISSION = 7`

### 15.1 Dependency order

Closure order is strictly sequential:

1. `ENG-ONB-1H-P0-RV-EVIDENCE`
2. `ENG-ONB-1H-P1-A`
3. `ENG-ONB-1H-P1-B`
4. `ENG-ONB-1H-P1-C`
5. `ENG-ONB-1H-P1-D`
6. `ENG-ONB-1H-PROD`
7. `ENG-ONB-1H-FV`

→ then controlled four-target closed-beta admission promotion, separately
governed and not counted.

### 15.2 Excluded from the mandatory count

| Excluded item | Reason |
| --- | --- |
| Repository-wide `#33438F` / `Inter` brand-token adoption | Optional hardening; `MOVED TO SEPARATE OWNER-APPROVED PHASE` per §13.4 |
| Gate 9 documentation recovery for `ENG-ONB-1H-A`, `1H-C`, `1G-A1`, `1H-P0-A`, `1H-P0-B4` | Retrospective documentation; no P1 slice and no gate depends on it. `ENG-ONB-1H-FV` verifies current behavior at FV HEAD, not historical paperwork |
| `ENG-ONB-1H-B`, `ENG-ONB-1H-P0-B1`, `-B2`, `-B3` | `UNALLOCATED_UNKNOWN`; no statable objective, so no acceptance contract is possible; nothing depends on them (§6.3) |
| The 12 `RETIRED_UNALLOCATED` identifiers | Not predecessors; carry no scope (§6.1) |
| Context readiness / admission promotion; social publishing enablement | Separately governed; explicitly out of `ENG-ONB` scope (§12.2) |

### 15.3 Safe parallelization

`SAFE PARALLEL PAIRS = 1`

`ENG-ONB-1H-P0-RV-EVIDENCE` authoring may proceed concurrently with
`ENG-ONB-1H-P1-A` design and implementation. The file partition is disjoint:
`P0-RV-EVIDENCE` writes only `tests/security/*.sql`, optionally `scripts/`, and
`docs/phases/`, while `P1-A` writes only `src/features/onboarding/**`,
`src/app/onboarding/**`, and `tests/onboarding/**`. `P0-RV-EVIDENCE` must still
close before `P1-A` closure (§10.4).

Every other pair is prohibited. `P1-A` … `P1-D` all write
`src/features/onboarding/**` and `src/app/onboarding/**`, and each consumes state
introduced by its predecessor. `PROD` and `FV` are terminal and require all
predecessors closed. Any future claim of additional parallelism requires an
overlap preflight proving a disjoint file partition, as required by
`B1-GATE.1` §13.4.

---

## 16. Unsupported claims rejected

Recorded explicitly so that no later phase inherits an unproven assertion.

| Claim considered | Disposition | Reason |
| --- | --- | --- |
| `ENG-ONB-1G-A` is `SUPERSEDED_BY_COMMITTED_ENG-ONB-1G-A1` | **Rejected**; recorded `RETIRED_UNALLOCATED` | A word-boundary search returns zero committed `ENG-ONB-1G-A` references. `SUPERSEDED` requires committed scope to replace; none exists (§6.2) |
| `ENG-ONB-1H-P0-A` / `P0-B4` runtime behavior is verified | **Rejected as repository-native evidence** | Verification is static file-text and checksum assertion. No `*-live-verification.sql` exists for the completion authority (§5) |
| The prior local runtime verification counts as PASS evidence | **Rejected** | Not commit-addressable. `B1-GATE.1` §12.6 forbids backfill. Relocated to `ENG-ONB-1H-P0-RV-EVIDENCE` (§10) |
| `ENG-ONB-1H-P0-B4` is applied to the local database | **Neither confirmed nor denied** | Database access is prohibited in this phase and no committed DB-state artifact exists. Recorded as a prior external report (§5) |
| Any `ENG-ONB-*` unit is closed | **Rejected** | Zero `ENG-ONB` phase documents existed before this one; `B1-GATE.1` Gate 9 is unmet by absence (§4.1) |
| The frozen `#33438F` / `Inter` direction is implemented | **Rejected** | Zero repository matches for `33438F`; `globals.css` uses `#2563eb` and a `system-ui` stack (§13.4) |
| `BETA1-4TG-MASTER-FV` verified V2 onboarding | **Rejected** | No `ENG-ONB-*` identifier appears in it; its inventory lists `ONBOARDING-1A` only; it defers onboarding work to separately governed next steps (§12.1) |
| Course Sellers' historical readiness exempts new organizations from the V2 gate | **Rejected** | New owner-registered organizations are provisioned at `onboarding_flow_version = 2` and are gated identically (§12.2) |
| `ENG-ONB-1H-B` / `P0-B1` / `-B2` / `-B3` intended scope | **Not stated** | No definition and no artifact exist; guessing would fabricate an objective (§6.3) |
| A batch invitation operation is available | **Rejected** | `20260908111356` L6–7 explicitly declines one; execution is per-intent (§7.5) |
| `reconcileTeamEditorWithAuthority` implements authority reconciliation | **Rejected** | It is a client-side UI helper in `team-foundation.tsx`; it does not call `reconcile_organization_onboarding_invite_intent` |

`FABRICATED PASS CLAIMS = 0`

`BACKFILLED EVIDENCE = 0`

---

## 17. Self-review

| Check | Result |
| --- | --- |
| Internal contradictions | none found. The §13.2 premium-UX requirement and the §7.5 no-redesign prohibition are reconciled explicitly in §13.4 via a `MOVED TO SEPARATE OWNER-APPROVED PHASE` disposition and a semantic-token obligation |
| Claims unsupported by repository evidence | none. Every §4 status cites a path; every rejected claim is recorded in §16 |
| Accidentally backfilled PASS claims | none. No `ENG-ONB-*` unit is marked closed; §5 records evidence location without asserting execution |
| Duplicate phase IDs | none. Every ID in §4 is unique; `ENG-ONB-FV` is retired and distinct from the newly defined `ENG-ONB-1H-FV` |
| Missing dependencies | none. Every future phase names its prerequisites; the §15.1 order is total and acyclic |
| Undefined status vocabulary | none. All seven statuses are defined in §3 and no other status word is used in any registry table |
| Missing acceptance gates | none. All ten `B1-GATE.1` gates are mapped for this phase (§14.1) and for all seven future phases (§14.2) |
| Unresolved successor relationships | none. Every phase declares a successor; `ENG-ONB-1H-FV`'s successor is the separately governed admission promotion |
| Secrets, credentials, personal data | none. The only email-shaped strings referenced are the synthetic `@example.test` identities already committed in `tests/security/onboarding-team-invite-intent-live-verification.sql`. No connection string, key, token, or password appears |

---

## 18. Verdict

`PASS — ENG-ONB-1H-P1-CONTRACT AUTHORITATIVE PROGRAM AND ACCEPTANCE CONTRACT FROZEN`

```text
PHASE COMPLETION: 100%

Required scope: PASS
Implementation completeness: NOT REQUIRED WITH JUSTIFICATION
Targeted tests: NOT REQUIRED WITH JUSTIFICATION
Relevant regression tests: NOT REQUIRED WITH JUSTIFICATION
Full regression suite: NOT REQUIRED WITH JUSTIFICATION
Typecheck: NOT REQUIRED WITH JUSTIFICATION
Lint: NOT REQUIRED WITH JUSTIFICATION
Production build: NOT REQUIRED WITH JUSTIFICATION
Security: NOT REQUIRED WITH JUSTIFICATION
Tenant isolation: NOT REQUIRED WITH JUSTIFICATION
Browser verification: NOT REQUIRED WITH JUSTIFICATION
Production verification: NOT REQUIRED WITH JUSTIFICATION
Documentation: PASS
Publication: PASS
Open blockers: 0
Open mandatory conditions: 0
Accepted polish items: 0
Final verdict: ENG-ONB-1H-P1-CONTRACT SCOPE FROZEN — AUTHORITATIVE PROGRAM LEDGER AND P1 ACCEPTANCE CONTRACT PUBLISHED
```

Every `NOT REQUIRED WITH JUSTIFICATION` above carries its phase-specific
justification in §14.1, as `B1-GATE.1` §7.3 requires. `Publication: PASS`
records repository cleanliness — exactly one new untracked documentation file,
nothing staged, no tracked modification. The commit and push are a separate
owner-approved act outside this phase's authority.

This document is a contract freeze. It closes no implementation phase, and under
`B1-GATE.1` §4 it does not and cannot claim
`CLOSED WITH EVIDENCE — 100% REQUIRED GATES PASSED` for any `ENG-ONB-*`
implementation unit.

`P1 IMPLEMENTATION STARTED = NO`

`REMAINING MANDATORY GOVERNED PHASES = 7`

`NEXT PHASE = ENG-ONB-1H-P0-RV-EVIDENCE`

## End of ENG-ONB-1H-P1-CONTRACT
