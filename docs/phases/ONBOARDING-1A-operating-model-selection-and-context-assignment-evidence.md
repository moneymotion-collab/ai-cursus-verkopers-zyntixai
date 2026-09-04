# ONBOARDING-1A — Operating-Model Selection and Context Assignment

## Executive verdict

`ONBOARDING-1A CLOSED WITH EVIDENCE — FOUR-TARGET-GROUP OPERATING-MODEL SELECTION LAWFULLY ASSIGNS ORGANIZATION CONTEXT WITHOUT REOPENING TG1 OR PRODUCT READINESS`

An authenticated active Owner or Admin can make one explicit operating-model
selection for an organization with no Business Activity state. The browser sends
one of four closed product identifiers; a service-role-only atomic RPC owns the
TAX/CTX mapping, verifies actor membership again in PostgreSQL, and creates the
primary Activity plus active context assignment in the existing ORG-CONTEXT
model. Existing valid context remains authoritative, partial/invalid legacy
state is not overwritten, and arbitrary target switching is not exposed.

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE`

`OPERATING MODEL SELECTED ≠ TARGET FEATURE IMPLEMENTED`

`CONTEXT ASSIGNED ≠ BETA_SUPPORTED`

`SERVER CONTROLS PACK ASSIGNMENT`

## Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `0fe213862a082d24774f9e536bc4594e0c71a6d4` |
| Final HEAD | recorded after implementation commit |
| Implementation commit | `feat(beta1): add operating-model context onboarding` |
| Evidence commit | this document; follow-up HEAD record if required |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | verified after push |
| Worktree | clean before implementation; clean required after push |

## Investigation

### Existing onboarding and TG1

`/onboarding` is the closed Course Seller first-run flow. It persists profile and
organization fields through `apply_organization_onboarding`, requires the Owner,
and asks Course Seller-specific business/offer/audience/goal questions. It did
not assign TAX/CTX state. Reusing it for TG2–TG4 would force Knowledge-specific
questions on unrelated organizations, so it remains intact and follows the new
operating-model step only for Knowledge/OCB.

### Context schema and write authority

ORG-CONTEXT already provides:

- `organization_business_activities` with one active primary per organization;
- `organization_context_assignments` with one active immutable version pin per
  Activity;
- append-only `organization_context_assignment_events`;
- assignment/event source `onboarding`;
- tenant-scoped RLS reads and no authenticated direct writes.

No existing writer could safely implement the new flow:

- the platform RPC requires platform-operator authority;
- the BQA RPC cannot create the first Activity and fixes provenance to
  `bqa_confirmed`;
- the Course Seller onboarding RPC does not write ORG-CONTEXT.

Therefore one additive RPC migration was necessary. No new table or organization
target-group column was created.

### RBAC, resolver, and admission

- Active organization membership is first resolved with the authenticated
  client.
- Owner/Admin is the existing confirmed-context mutation authority.
- The RPC repeats organization, actor, active-membership, and role checks before
  any DML.
- Product context is re-read through the existing product-access resolver
  boundary after assignment.
- Product access continues to resolve in `internal_qa`; BQA `closed_beta`
  continues to require `beta_supported` or `production_verified`.

### Browser/E2E tooling

The repository Playwright harness targets authenticated, read-only Production
Course Seller verification. It has no safe local ONBOARDING-1A write fixture.
Running it would not prove this new write path and Production context writes are
prohibited, so verification uses the established Vitest SSR/server/security
patterns rather than introducing a new E2E framework.

## Before state

The four target packs, context resolver, AppShell gating, and Customer
terminology projection existed. However, product users had no approved flow
from business operating-model choice to an organization context assignment.
TG2–TG4 therefore required manual/governed backend setup.

## Operating-model contract

Exactly four browser values are accepted:

| UI operating model | Internal foundation/context | Status |
| --- | --- | --- |
| Courses & Coaching | Knowledge via `niche.online-course-business` (inherits `foundation.knowledge`) | Existing TG1 path; legacy wizard preserved |
| Agency & Business Services | `foundation.service` | `context_ready` |
| Construction & Field Service | `foundation.field-operations` | `context_ready` |
| E-commerce & Product Operations | `foundation.product-operations` | `context_ready` |

The browser cannot submit a pack ID, taxonomy ID, readiness value, or arbitrary
context identifier.

## Implemented onboarding architecture

```text
operating-model card
→ strict four-value server-action validation
→ authenticated membership and Owner/Admin check
→ service-role-only atomic RPC
→ server-owned TAX/CTX lookup
→ existing Business Activity + context assignment + audit events
→ existing resolver verification
→ existing AppShell gating and terminology
```

The resolver remains behind `features/product-access`; onboarding receives only
a product-context summary. Raw context-table inspection remains behind
`features/org-context`. Existing runtime-isolation tests enforce both boundaries.

## Assignment/write path

Migration:
`supabase/migrations/20260904110421_add_operating_model_context_onboarding.sql`

RPC: `assign_organization_operating_model(uuid, uuid, text)`

- `SECURITY DEFINER`, empty search path;
- executable by `service_role` only;
- exact four-value allowlist;
- per-organization transaction advisory lock;
- active organization + active Owner/Admin membership check;
- server-owned TAX target and latest published pack-version lookup;
- existing ORG-CONTEXT tables and `source = onboarding`;
- no organization profile target enum and no BQA/readiness write.

## Existing organization behavior

| State | Behavior |
| --- | --- |
| Valid resolved context | Configured; no selector and no overwrite |
| Existing Knowledge/OCB context | Configured; existing TG1 flow remains authoritative |
| No Activities / no context | Owner/Admin may choose once; member sees administrator-required state |
| Activity rows but no valid primary context | Review-required state; no automatic mutation |
| Invalid/unassigned/malformed primary context | Review-required state; no automatic mutation |
| Different valid context submitted after configuration | `ALREADY_CONFIGURED`; no switching |
| Repeated identical successful selection | Idempotent success; no duplicate Activity/assignment |

## UX

`/onboarding/operating-model` presents four keyboard-accessible radio cards with
clear business descriptions, selected state, disabled/pending state, readable
error summary, and no internal TAX/CAP/CTX labels. Copy describes the operating
model without promising Projects, Work Orders, Orders, Inventory, or other
unimplemented modules.

Newly provisioned owners enter this route first. Missing-context product entry
and login landing also route here. Course Seller continues to the established
three-step TG1 wizard; non-Knowledge models enter `/home` and do not receive
Course Seller-specific questions.

## Authorization / security

- Client input is strict and rejects unknown keys.
- Authenticated membership resolution prevents cross-organization targeting
  before privileged code runs.
- PostgreSQL repeats tenant/actor/role checks under the advisory lock.
- Normal members cannot write.
- Public, anonymous, and authenticated database roles cannot execute the RPC.
- Raw database errors and internal identifiers are not returned to the UI.
- Context/runtime isolation suites remain green.

## Idempotency

The organization advisory lock serializes double-clicks and retries. A matching
active primary Activity/context pin returns `idempotent = true`. A different
valid pin returns `ALREADY_CONFIGURED`; partial legacy state returns
`CONFIGURATION_REVIEW_REQUIRED`. No change-version or target-switch path exists.

## Resolver integration

The server does not trust submitted UI state after the write. It calls the
existing primary-context resolver through the product-access boundary in
`internal_qa` mode and returns success only when the resolved pack matches the
RPC result. Subsequent page loads resolve again normally.

## AppShell / terminology integration

No AppShell or terminology rule changed. Existing tests prove that:

- Service resolution produces the frozen shared-module navigation and
  `Client`/`Clients`;
- Field and Product resolve their existing frozen implemented-module matrices;
- Knowledge/OCB preserves TG1 labels;
- terminology cannot grant module access.

## TG1 preservation

- Existing valid `foundation.knowledge` and
  `niche.online-course-business` assignments are recognized as configured.
- The new TG1 selection assigns the OCB niche so Knowledge inheritance remains
  authoritative.
- Existing Course Seller profile/onboarding RPC, fields, wizard, and Owner-only
  completion semantics are unchanged.
- Existing TG1 organizations are not asked to reselect.

## BQA / readiness preservation

The migration contains no BQA admission/support tables and no
`context_pack_readiness` write. TG2/TG3/TG4 remain `context_ready`.
Existing policy tests continue to prove `context_ready` is eligible for
`internal_qa` resolution but not customer `closed_beta` admission.

`CONTEXT ASSIGNED ≠ PRODUCT RELEASE-READY`

## Explicitly not implemented

- operating-model switching or domain migration;
- BQA bypass, customer PATH A expansion, or CTX promotion;
- Projects, Agency workflow, Sites, Work Orders, Dispatch;
- Products, Orders, Inventory, Fulfillment;
- DATA import/UI or target-specific questionnaires;
- Social changes, analytics, deployment, or Production verification writes.

## Tests / quality

Pre-change full-suite baseline was re-run:

- **3389 passed / 2 failed / 3391 total**
- accepted failures:
  `tests/features/invitations/load-member-administration-page.test.ts` and
  `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`.

New focused tests:

| File | Tests |
| --- | ---: |
| `tests/onboarding/operating-model-assignment.test.ts` | 6 |
| `tests/onboarding/operating-model-status.test.ts` | 6 |
| `tests/onboarding/operating-model-ui.test.tsx` | 3 |
| `tests/security/onboarding-operating-model-migration-security.test.ts` | 8 |

Final focused ONBOARDING-1A + resolver/AppShell/terminology/RBAC/admission suite:
**178 passed / 178 total**.

| Gate | Result |
| --- | --- |
| typecheck | PASS |
| lint | PASS — zero warnings/errors |
| build | PASS — pre-existing unrelated Social CSS autoprefixer warning only |
| full Vitest | **3412 passed / 2 failed / 3414 total** |
| new regressions | **0** — only the two accepted historical failures remain |

## Changed files

Runtime/domain:

- `src/app/onboarding/operating-model/page.tsx`
- `src/app/onboarding/page.tsx`
- `src/features/onboarding/domain/operating-model.ts`
- `src/features/onboarding/actions/onboarding-actions.ts`
- `src/features/onboarding/server/assign-operating-model.ts`
- `src/features/onboarding/server/operating-model-status.ts`
- `src/features/onboarding/server/enforce-product-onboarding.ts`
- `src/features/onboarding/ui/operating-model-selector.tsx`
- `src/features/onboarding/ui/operating-model-selector.module.css`
- `src/features/auth/server/resolve-authenticated-landing.ts`
- `src/features/auth/server/resolve-registration-destination.ts`
- `src/features/auth/server/safe-return-path.ts`
- `src/features/org-context/server/organization-context-status.ts`
- `src/features/product-access/server/resolve-product-context-summary.ts`
- `src/types/database.generated.ts`

Database:

- `supabase/migrations/20260904110421_add_operating_model_context_onboarding.sql`

Tests:

- `tests/onboarding/operating-model-assignment.test.ts`
- `tests/onboarding/operating-model-status.test.ts`
- `tests/onboarding/operating-model-ui.test.tsx`
- `tests/security/onboarding-operating-model-migration-security.test.ts`
- `tests/auth/resolve-authenticated-landing.test.ts`
- `tests/auth/safe-return-path.test.ts`
- `tests/onboarding/onboarding-routing.test.ts`

Evidence:

- `docs/phases/ONBOARDING-1A-operating-model-selection-and-context-assignment-evidence.md`

## Production non-effects

| Metric | Result |
| --- | --- |
| Production customer writes | 0 |
| Production DATA writes | 0 |
| Production context writes | 0 |
| Production migrations applied | 0 |
| Deployments | 0 |
| Social execution gates changed | NO |
| CTX `beta_supported` promotion | NO |
| Core reopened | NO |
| DATA reopened | NO |

The migration is code only and was not applied to Production.

## Scope compliance

The change adds only the operating-model contract, first-assignment write
authority, setup detection/routing, four-choice UX, generated RPC typing, tests,
and evidence. It adds no target-domain table/page/nav item and changes no
existing access matrix or terminology rule.

## Final verdict

`ONBOARDING-1A CLOSED WITH EVIDENCE — FOUR-TARGET-GROUP OPERATING-MODEL SELECTION LAWFULLY ASSIGNS ORGANIZATION CONTEXT WITHOUT REOPENING TG1 OR PRODUCT READINESS`

## Next required phase

`NEXT REQUIRED PHASE = SHARED-PROJECTS-FOUNDATION`

Packs, gating, terminology, and operating-model assignment now form the common
productization foundation. The next frozen dependency is the generic
`shared.projects` domain used as Project by TG2 and Job by TG3. It is not started
in this phase.
