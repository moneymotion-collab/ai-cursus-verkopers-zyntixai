# SHARED-PROJECTS-FOUNDATION — Generic Delivery Project Domain

## Executive verdict

`SHARED-PROJECTS-FOUNDATION CLOSED WITH EVIDENCE — ONE ORGANIZATION-ISOLATED PROJECT DOMAIN NOW SUPPORTS SERVICE PROJECTS AND FIELD JOBS WITHOUT TARGET-SPECIFIC WORKFLOW EXPANSION`

One shared `Project` domain now represents a Customer delivery engagement for
Service and Field organizations. Service presents that domain as
`Project / Projects`; Field presents the same rows, routes, RPCs, and components
as `Job / Jobs`. Capability relevance controls access; terminology remains
presentation-only.

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE`

`PROJECT = SHARED DOMAIN`

`JOB = FIELD DISPLAY TERMINOLOGY`

`SHARED PROJECTS IMPLEMENTED ≠ TG2/TG3 COMPLETE`

## Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `cc8e331d520aa79c9dbd33d7e91e7546f37c048a` |
| Final implementation HEAD | `3579525199cd3baaa205643c32380db95ae54fc6` |
| Implementation commit | `3579525199cd3baaa205643c32380db95ae54fc6` — `feat(beta1): add shared projects foundation` |
| Evidence commit | follow-up closure-HEAD record containing implementation SHA alignment |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | verified after normal push |
| Worktree | clean before implementation; clean required after push |

## Investigation

The repository was inspected before implementation across Customers, Leads,
Tasks, Programs, Enrollments, organization membership, generated database
types, migrations, RLS, RPC adapters, page loaders, AppShell, product access,
terminology, responsive UI, and security tests.

Evidence established:

- `shared.projects` already existed in the CAP catalog with
  `context_ready` readiness and a dependency on `shared.crm.customers`.
- Service and Field context packs already required `shared.projects`.
- CTX already seeded `Project / Projects` for Service and `Job / Jobs` for
  Field.
- no `projects` table, Project RPC, `/projects` route, Projects feature, or
  implemented module-registry entry existed;
- Tasks supported Lead, Customer, and Enrollment contexts only;
- organization-scoped composite foreign keys, RPC-only lifecycle writes, RLS,
  nullable member ownership, and orthogonal soft archival were established
  production patterns.

## Before state

`shared.projects` was a declared, context-ready capability only.

`CAPABILITY DECLARED ≠ MODULE IMPLEMENTED`

`DISPLAY TERMINOLOGY ≠ DOMAIN MODEL`

No Project data model or user surface existed, and Projects navigation was
intentionally absent.

## Shared domain decision

One `public.projects` table serves both target groups because every included
field is useful to both an Agency Project and a Field Job: organization,
Customer, name, summary, controlled delivery status, delivery owner, planned
dates, audit timestamps, and archive state.

There is no `jobs`, `agency_projects`, or `field_jobs` table and no duplicated
target implementation. `Job` is exclusively the Field display projection of
the shared Project term key.

## Database model

Migration:

`supabase/migrations/20260905123943_shared_projects_foundation.sql`

`public.projects` fields:

- UUID `id`;
- required `organization_id`;
- required `customer_id`;
- required trimmed `name`;
- nullable `summary`;
- status `planned | active | on_hold | completed | cancelled`;
- nullable same-organization `owner_member_id`;
- nullable `planned_start` and `planned_end`, with end not before start;
- required `created_by_member_id`;
- nullable `archived_at`;
- object `metadata`;
- `created_at` and `updated_at`.

Constraints and indexes include the `(organization_id, id)` tenant anchor,
same-organization composite Customer/member foreign keys, organization/status,
organization/Customer, organization/owner, and active-list indexes.

`public.project_status_history` records creation and lawful status transitions.

Generated contract synchronization updated
`src/types/database.generated.ts` for both Project tables, all six new RPCs,
and `tasks.project_id`. The repository command `npm run supabase:types` targets
the linked database; it was not run because this repository-only migration was
intentionally not applied remotely. The local Docker-backed Supabase stack was
unavailable, so the committed generated contract was synchronized directly
from the reviewed additive migration and compile-checked. No remote schema or
data was changed.

## RLS / security

- RLS is enabled on `projects` and `project_status_history`.
- Authenticated users receive SELECT only on tables.
- Active members can read non-archived Projects in their organization.
- Owner/Admin can additionally read archived Projects.
- All writes use explicit authenticated security-definer RPCs with empty
  `search_path` and revoked default/public/service-role execution.
- RPCs re-resolve the authenticated active member in the requested active
  organization.
- Owner/Admin/Staff can create, update, and transition status.
- Owner/Admin alone can archive and restore.
- Viewers remain read-only.
- Customer, owner, and creator references use composite organization foreign
  keys.
- Customer and owner state is revalidated in create, update, and restore.
- Every application read includes `organization_id`; every action resolves the
  authenticated organization and product capability before invoking an
  organization-scoped RPC.

Cross-organization Customer, owner, Project, and Task references therefore fail
at both server validation/authorization boundaries and database constraints or
RPC validation.

## Project lifecycle

Create starts in `planned`. The deliberately small controlled graph is:

- `planned → active | cancelled`;
- `active → on_hold | completed | cancelled`;
- `on_hold → active | completed | cancelled`;
- `completed → active`;
- `cancelled → planned`.

Archive is reversible and orthogonal to lifecycle status. No hard-delete
workflow was added.

## Customer relationship

Every Beta-1 Project belongs to exactly one Customer. Create and edit forms
select only non-archived Customers loaded inside the active organization.
Composite `(organization_id, customer_id)` enforcement prevents cross-tenant
references. Detail links back to the Customer/Client surface and uses
context-resolved Customer terminology.

## Task relationship

`tasks.project_id` is an additive nullable same-organization foreign key.
Project is a fourth mutually exclusive Task linked-context kind:

- Lead Tasks remain valid;
- Customer Tasks remain valid;
- Enrollment Tasks retain their Customer/Program tuple;
- Project Tasks reference the shared Project only.

The established `create_task` RPC and every legacy path remain unchanged.
`create_project_task` safely creates manual Project-linked Tasks after active
membership, role, assignee, predecessor, organization, Project existence, and
archive checks. Task forms, read mapping, filters, labels, detail presentation,
and Project related-task lists support the new context.

Project archival never deletes Task records; `ON DELETE RESTRICT` prevents
corruption.

## Module registration

`projects` is now an implemented centralized product module at `/projects`,
requiring `shared.projects` at `required` relevance. Unresolved access remains
fail-closed.

AppShell renders the Projects link only when module visibility is true and
reads its label from `terminology.project.plural`. No target key or target name
is hardcoded into access decisions.

## Navigation/access matrix

| Context | Label | Visible | Direct route |
| --- | --- | --- | --- |
| Knowledge | — | No | Denied |
| Service | Projects | Yes | Allowed |
| Field | Jobs | Yes | Allowed |
| Product | — | No | Denied |
| Unresolved | — | No | Denied |

All list, create, detail, and edit loaders resolve organization context and call
`evaluateProductModuleRouteAccess({ moduleId: "projects" })` before Project
reads. Server actions repeat module authorization before RPC invocation.

## Terminology

`ProductTerminology` was minimally extended with the already-seeded `project`
term only:

- Service: `Project / Projects`;
- Field: `Job / Jobs`;
- generic unresolved fallback: `Project / Projects`, without visibility or
  access.

No Site, Work Order, Technician, Product, Order, Inventory, or Fulfillment
terms were wired.

## UI

Implemented routes:

- `/projects`;
- `/projects/new`;
- `/projects/[projectId]`;
- `/projects/[projectId]/edit`.

The responsive list provides target-aware headings/actions, search and status
filters, archived access for Owner/Admin, Customer/Client, owner, status badges,
planned dates, mobile cards, and a calm empty state.

Create/edit provides validated Customer, name, summary, owner, and planned date
fields. Detail provides Customer linkage, owner/dates/summary, controlled status
transitions, archive/restore, and related Tasks. Pending, validation, denied,
unavailable, loading, and error states are explicit and accessible.

## TG1 preservation

The Knowledge/OCB pack has no `shared.projects` mapping. Its existing navigation
and Course Seller modules remain unchanged; Projects is hidden and direct
routes are denied. Programs, Enrollments, Progress, onboarding, and the closed
TG1 acceptance contract were not modified.

## TG4 preservation

The Product Operations pack still has no `shared.projects` mapping. Projects is
hidden and direct routes are denied. No Product, Order, Inventory, or
Fulfillment module was introduced.

## Explicitly not implemented

- Agency deliverables, SOW, retainers, rates, budgets, profitability, portal,
  approval, or recurring-engagement behavior;
- Field Sites, GPS/location, Work Orders, dispatch, technicians, materials,
  job costing, assets, or equipment;
- Project Attention signal generation;
- Home redesign;
- custom statuses, templates, custom fields, Kanban, milestones, subtasks,
  dependencies, time tracking, billing, or files;
- TG2/TG3 `beta_supported` promotion or broader admission;
- production deployment or migration application.

## Changed files

The implementation commit contains 56 files with 4,701 additions and 61
deletions:

- `supabase/migrations/20260905123943_shared_projects_foundation.sql`;
- `src/types/database.generated.ts`;
- `src/features/projects/**`;
- `src/app/(authenticated)/projects/**`;
- product module/access/terminology changes in
  `src/features/product-access/domain/**`;
- Projects navigation in `src/components/app-shell.tsx`;
- additive Task project-context changes in `src/features/tasks/**`;
- focused tests in `tests/actions/project-actions.test.ts`,
  `tests/features/projects/**`, `tests/security/projects-migration-security.test.ts`,
  `tests/types/projects-generated-types.test.ts`,
  `tests/ui/project-page-loaders.test.ts`,
  `tests/ui/projects-terminology.test.tsx`;
- targeted product-access, AppShell, Task validation, Task server, and Task UI
  regression updates under `tests/features/product-access/**`,
  `tests/server/**`, `tests/ui/**`, and `tests/validation/schemas.test.ts`.

No CAP/CTX seed, onboarding, readiness, BQA, Social, Home, Program, Enrollment,
Progress, Customer, or Lead implementation file was modified.

## Tests / quality

Targeted command covered Projects, RLS/security, generated types, product
access, terminology, AppShell, Tasks, CTX seed integrity, and runtime isolation:

`19 passed files / 152 passed tests / 0 failed`

Full Vitest:

`487 test files: 485 passed / 2 failed`

`3471 passed / 2 failed / 3473 total`

The two failures are exactly the accepted historical failures:

1. `tests/features/invitations/load-member-administration-page.test.ts`;
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`.

`NEW REGRESSIONS = 0`

Quality gates:

- `npm run typecheck` — PASS;
- `npm run lint` — PASS, zero warnings/errors;
- `npm run build` — PASS, all four Projects routes emitted; only the existing
  unrelated Social CSS autoprefixer warning remains;
- `git diff --check` — PASS (Git reported only the existing line-ending
  normalization notice for the generated type file).

## Production non-effects

`PRODUCTION CUSTOMER WRITES = 0`

`PRODUCTION PROJECT WRITES = 0`

`PRODUCTION DATA WRITES = 0`

`PRODUCTION MIGRATIONS APPLIED = 0`

`DEPLOYMENTS = 0`

`SOCIAL EXECUTION GATES CHANGED = NO`

`CTX BETA_SUPPORTED PROMOTION = NO`

`CORE REOPENED = NO`

`DATA REOPENED = NO`

## Scope compliance

The diff contains one shared Project foundation, one optional Task foreign key,
capability-gated shared UI, target terminology projection, and direct tests.
It does not contain an Agency or Field domain fork, target workflow expansion,
readiness mutation, admission change, Attention redesign, Home redesign, or
Production side effect.

## Final verdict

`SHARED-PROJECTS-FOUNDATION CLOSED WITH EVIDENCE — ONE ORGANIZATION-ISOLATED PROJECT DOMAIN NOW SUPPORTS SERVICE PROJECTS AND FIELD JOBS WITHOUT TARGET-SPECIFIC WORKFLOW EXPANSION`

`PROJECT = SHARED DOMAIN`

`JOB = FIELD DISPLAY TERMINOLOGY`

`SHARED PROJECTS IMPLEMENTED ≠ TG2/TG3 COMPLETE`

## Next required phase

`NEXT REQUIRED PHASE = TG2-AGENCY-SLICE`

Shared Projects now supplies the major remaining common dependency for the
Agency flow. TG3 still requires Field-specific Sites, Work Orders, and
lightweight Dispatch in its later dedicated slice.
