# TG3-FIELD-SLICE — Construction / Installation / Field Service End-to-End Beta-1

## Executive verdict

`TG3-FIELD-SLICE CLOSED WITH EVIDENCE — FIELD ORGANIZATIONS CAN OPERATE THE FROZEN CUSTOMER-TO-JOB-TO-SITE-TO-WORK-ORDER-TO-DISPATCH-TO-COMPLETION BETA-1 WORKFLOW`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE`

`TG3 SLICE IMPLEMENTED ≠ TG3 FINAL VERIFIED`

`JOB = SHARED PROJECT DOMAIN`

`TECHNICIAN = MEMBER DISPLAY / FIELD EXECUTION CONCEPT`

`LIGHTWEIGHT DISPATCH ≠ ROUTE OPTIMIZATION`

`DEFERRED FIELD SCOPE NOT PULLED INTO BETA-1`

## Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `00b8d3fbee49dd0dec48a2302fe08ddf49dce1c8` |
| Final implementation HEAD | `e9cefe3e13b6e344fde242d83bd396b94cebe600` |
| Implementation commit | `e9cefe3e13b6e344fde242d83bd396b94cebe600` — `feat(beta1): complete field operations slice` |
| Evidence HEAD commit | `docs(beta1): record field slice closure HEAD` (the commit containing this alignment) |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | `0 0` after normal push |
| Worktree | clean before implementation and after push |

## Investigation

Before coding, the repository state and all required foundations were inspected:
shared Project schema/RPC/RLS/UI, Customer→Project continuity, Field context
capabilities and terminology, product module registry and fail-closed access,
AppShell, Members/RBAC and Task assignment, Attention including TG2 Project
rules, Home daily-operating composition, migration/RLS/RPC conventions,
generated types, route/page/form patterns, and current tests.

No hidden Site, Work Order, Dispatch, Job, or Technician implementation
existed. The CTX/CAP catalogs already authoritatively seeded
`field.locations`, `field.work-orders`, `field.dispatch`, and the
Site/Work order/Technician terms, but none was an implemented product module.

## Gap analysis

| Frozen TG3 step | Current state before TG3 | Gap | Required action |
| --- | --- | --- | --- |
| Customer | shared Customer complete; Field says Customer | none | preserve |
| Job | shared Project complete; Field says Job | no Field execution composition | add Field-only Sites/Work Orders sections to shared detail |
| Site | capability/term seeded only | domain, security, routes, UI absent | implement `sites` |
| Work Order | capability/term seeded only | domain, lifecycle, assignment, routes, UI absent | implement `work_orders` + history |
| Technician assignment | active organization Members complete | no Work Order assignment field/validation | add nullable same-org member reference |
| Dispatch | capability seeded only | no operational queue | implement `/dispatch` over Work Orders |
| Execution status | Project status only | no independent Work Order lifecycle | controlled five-state lifecycle |
| Completion | Project completion only | no Work Order completion state/timestamp | `completed` + `completed_at`, retained in history/list |
| Attention | shared architecture + Project rules | no Work Order source/rules/link | add overdue/unassigned rules and Work Order link |
| Home composition | generic Attention already composed | no separate widget needed | reuse; Work Order items carry Job label through `project_id` |

Only these gaps were implemented.

## Before state

Field organizations could manage Customers and shared Projects displayed as
Jobs, plus shared Tasks and Attention. They could not represent a physical
Site, executable Work Order, technician assignment, schedule queue, Work
Order completion, or Field-specific exception. Service/Knowledge/Product
correctly did not expose the seeded-but-unimplemented Field capabilities.

## Site architecture

`Site` is intentionally Field-specific and belongs to exactly one
organization, Customer, and shared Project/Job. This matches the frozen
Customer→Job→Site journey and avoids a global geospatial platform.

Routes:

- `/sites`
- `/sites/new`
- `/sites/[siteId]`
- `/sites/[siteId]/edit`

Job detail links to prefilled Site creation. Site detail links back to
Customer and Job, shows the address and operational note, lists related Work
Orders, and links to prefilled Work Order creation. Empty, denied,
unavailable, and query-error states are explicit.

## Site database model

Migration: `supabase/migrations/20260905172331_tg3_field_slice.sql`.

`public.sites` contains:

- `id`, `organization_id`, `customer_id`, `project_id`;
- `name`;
- `address_line_1`, optional `address_line_2`, `postal_code`, `city`,
  `country`;
- optional `operational_note`;
- `created_by_member_id`, `archived_at`, `created_at`, `updated_at`.

Composite organization foreign keys protect Customer, Project, and creator.
`private.validate_site_relations` additionally proves the Project belongs to
the selected Customer and both remain unarchived. A Site's Job/Customer
cannot change after Work Orders exist. Site archive is Owner/Admin-only and
is rejected while nonterminal Work Orders exist. Shared Job archive is
rejected while an active Site remains, without changing Service Project
behavior (Service Projects have no Sites).

RPCs: `create_site`, `update_site`, `archive_site`, `restore_site`.

## Work Order architecture

`public.work_orders` is the Field execution unit. It belongs to one shared
Project/Job and one Site; there is no automatic duplicate Task. This avoids
two execution sources of truth while leaving shared Tasks independently
available.

Fields:

- organization, Project, Site;
- title and optional instructions;
- nullable `technician_member_id`;
- nullable `scheduled_for`;
- controlled status;
- `completed_at`;
- creator and timestamps.

`private.validate_work_order_relations` proves the Site belongs to the Job,
both are in the organization and unarchived, and any Technician is an active
organization Member. Job/Site identity becomes immutable after creation;
schedule and assignment remain editable until terminal state.

RPCs: `create_work_order`, `update_work_order`,
`transition_work_order_status`.

No WorkOrder↔Task duplication was introduced.

## Work Order lifecycle

Independent of Project/Job status:

- `planned → scheduled | cancelled`
- `scheduled → planned | in_progress | cancelled`
- `in_progress → scheduled | completed | cancelled`
- `completed → in_progress`
- `cancelled → planned`

Scheduled/in-progress/completed states require `scheduled_for`; completed
requires and records `completed_at`; every initial state and transition is
recorded in `work_order_status_history`. No automatic Job completion occurs.

## Technician assignment

Technician is a display/execution concept over
`organization_members.id`—not a table or identity domain. Forms offer active
member options using the existing member-label loader. Database composite
foreign keys plus active-member RPC validation reject cross-organization,
inactive, or unknown assignments. Global Members remains named Members.

## Lightweight Dispatch

`/dispatch` is a simple operational queue over the authoritative Work Order
records. It groups:

- overdue scheduled work;
- unassigned active work;
- today;
- upcoming;
- recently completed work.

Rows expose Customer, Job, Site, planned time, Technician, status, and a
direct Work Order link. Assignment/schedule changes occur through the Work
Order edit path with full server/RPC validation. No calendar engine, map,
route, GPS, live tracking, or optimization exists.

## Customer → Job → Site → Work Order flow

- Customer detail already lists related shared Projects/Jobs.
- Field Job detail now conditionally composes Sites and Work Orders.
- `New site` carries validated `projectId`.
- Site detail carries Customer/Job/address context.
- `New work order` carries validated `siteId`, which server-owned options map
  back to the authoritative Job.
- Work Order detail links to Customer, Job, and Site.

The composition is rendered only when both Field module capabilities resolve
visible. Service Project detail remains unchanged.

## Attention

Attention receives one new source (`work_order`) and two high-value rules:

1. `work_order_overdue`: still `scheduled` after `scheduled_for`;
2. `work_order_unassigned`: `scheduled`/`in_progress`, due within 24 hours,
   with no Technician.

No stale/blocked/SLA/routing rules were added. Healthy, future, completed, or
cancelled Work Orders do not create actionable items.

The migration adds `attention_items.work_order_id` with an
organization-scoped composite FK and widens existing source/rule constraints.
`private.upsert_work_order_attention_item` and
`private.expire_work_order_attention_item` reuse the existing source dedupe
key, signal append, event, and expiry helpers. Re-evaluation updates the
existing open item; assignment, start/completion, cancellation, or other
healthy state expires it. `evaluate_work_order_attention_rules` is
Owner/Admin-only and can evaluate one Work Order or the organization.

Attention detail now loads the Work Order summary and provides
Attention→Work Order→Job/Site navigation. Job name remains available through
the denormalized, organization-scoped `project_id`.

## Completion visibility

Completed Work Orders show a success status badge and exact completion
timestamp, remain visible in Work Orders and Dispatch history, and no longer
satisfy active Attention rules. Job completion remains the existing explicit
Project lifecycle; completing one Work Order never completes its Job.

## Home composition

No Home redesign or Field dashboard was needed. Home already composes shared
Attention and Tasks. Work Order Attention items include their Job
`project_id`, so the existing `projectName` context-label path introduced in
TG2 renders meaningful Field context. `/dispatch` is the dedicated minimal
operational queue.

## Module registration

The product module registry now contains:

- `projects` → `shared.projects`;
- `sites` → `field.locations`;
- `workOrders` → `field.work-orders`;
- `dispatch` → `field.dispatch`.

Every route resolves organization/onboarding/context first and invokes the
same authoritative product-module access evaluator before any domain read.
Every server action repeats capability and RBAC authorization.

## Navigation / access matrix

| Module | Knowledge | Service | Field | Product | Unresolved |
| --- | --- | --- | --- | --- | --- |
| Jobs/Projects | hidden | Projects | Jobs | hidden | hidden |
| Sites | hidden | hidden | visible | hidden | hidden |
| Work Orders | hidden | hidden | visible | hidden | hidden |
| Dispatch | hidden | hidden | visible | hidden | hidden |

Direct routes fail closed under the same matrix.

## Terminology

The already-seeded resolver-authoritative CTX keys are projected into
`ProductTerminology`:

- `project`: Job / Jobs in Field;
- `site`: Site / Sites;
- `work_order`: Work order / Work orders;
- `technician`: Technician / Technicians.

These are presentation-only. Database/domain names remain `projects`,
`sites`, `work_orders`, and `organization_members`. Global Members is not
renamed.

## RLS / security

- RLS enabled on all three new tables.
- Authenticated users receive table SELECT only; all CUD is RPC-only.
- Every security-definer function has empty `search_path`; default/public/
  anon/service-role execution is revoked, then only required public RPCs are
  granted to authenticated callers.
- active organization membership required for every mutation;
  Owner/Admin/Staff operate Sites/Work Orders, Owner/Admin archive Sites and
  evaluate Attention, Viewer remains read-only.
- composite tenant foreign keys and RPC validation defend Customer/Job/Site/
  Technician relation integrity.
- all app reads include `organization_id`; all actions re-resolve membership,
  module capability, and role.

Local Supabase execution was unavailable because Docker Desktop's Linux
engine was not running (`failed to inspect container health`). The generated
contract was synchronized directly from the reviewed additive migration and
compile-tested. No linked/Production schema was used to generate types.

## TG1 preservation

Knowledge receives none of the three Field modules; direct routes deny.
Programs, Enrollments, Progress, Course Seller onboarding, and TG1
capabilities were not changed. Full-suite results show no new TG1 failure.

## TG2 preservation

Service still sees Clients, Projects, Tasks, Attention, and Members, but not
Sites/Work Orders/Dispatch. Shared Project behavior is preserved; the Field
sections are capability-gated and absent from Service rendering. TG2 Project
Attention rules remain in the same widened allow-list and pass their prior
security tests.

## TG4 preservation

Product remains Project-free and receives no Field capability/module.
Product navigation and direct routes remain denied.

## Explicitly deferred

No route optimization, maps, coordinates/GPS, live tracking, geofencing,
territories, workforce/shift optimizer, vehicles, tools/equipment,
materials/inventory/purchasing, subcontractors, job costing/WIP, estimates,
change orders, signatures, photos/files, mobile/offline app, timesheets,
payroll, advanced SLA/scheduling, recurring maintenance, assets, or complete
Field Service catalog was implemented.

## Changed files

The implementation commit contains:

- one additive migration:
  `supabase/migrations/20260905172331_tg3_field_slice.sql`;
- generated database contracts in `src/types/database.generated.ts`;
- new `src/features/field-operations/**`;
- new routes under `src/app/(authenticated)/sites/**`,
  `work-orders/**`, and `dispatch/**`;
- Field-only Job composition in shared Project loader/detail;
- additive module/access/AppShell/terminology registration;
- additive Work Order Attention source/read/presentation/link integration;
- focused tests under `tests/actions`, `tests/security`, `tests/server`,
  `tests/types`, and `tests/ui`, plus expected shared fixtures/assertion
  updates.

Implementation commit: `55 files changed, 4540 insertions(+), 21 deletions(-)`.

## Tests / quality

Consolidated TG3 and cross-target targeted command:

`29 test files / 277 tests / 0 failed`

Coverage includes Sites/Work Orders/Dispatch, shared Projects, member
assignment, Attention, Home composition, capability/access, terminology,
RLS/migration security, generated types, Task/Project regressions, and
TG1/TG2/TG4 access preservation.

Full Vitest:

`493 test files: 491 passed / 2 failed`

`3522 passed / 2 failed / 3524 total`

The only failures are exactly the accepted historical baseline:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

`NEW REGRESSIONS = 0`

Quality gates:

- `npm run typecheck` — PASS
- `npm run lint` — PASS, zero warnings/errors
- `npm run build` — PASS; all 9 Field routes emitted; only the existing
  unrelated Social CSS autoprefixer warning remains
- `git diff --check` — PASS (generated-type line-ending notice only)

## Production non-effects

`PRODUCTION CUSTOMER WRITES = 0`

`PRODUCTION PROJECT WRITES = 0`

`PRODUCTION SITE WRITES = 0`

`PRODUCTION WORK_ORDER WRITES = 0`

`PRODUCTION ATTENTION WRITES = 0`

`PRODUCTION DATA WRITES = 0`

`PRODUCTION MIGRATIONS APPLIED = 0`

`DEPLOYMENTS = 0`

`SOCIAL EXECUTION GATES CHANGED = NO`

`CTX BETA_SUPPORTED PROMOTION = NO`

`CORE REOPENED = NO`

`DATA REOPENED = NO`

## Scope compliance

The implementation contains only the three authorized Field capabilities,
their minimum secure persistence/UI, two actionable Attention rules, and
cross-links over existing shared foundations. It creates no Job table, no
Technician identity, no WorkOrder↔Task duplicate, no advanced Field feature,
and no readiness/BQA/admission change.

## Final verdict

`TG3-FIELD-SLICE CLOSED WITH EVIDENCE — FIELD ORGANIZATIONS CAN OPERATE THE FROZEN CUSTOMER-TO-JOB-TO-SITE-TO-WORK-ORDER-TO-DISPATCH-TO-COMPLETION BETA-1 WORKFLOW`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE`

`TG3 SLICE IMPLEMENTED ≠ TG3 FINAL VERIFIED`

`JOB = SHARED PROJECT DOMAIN`

`TECHNICIAN = MEMBER DISPLAY / FIELD EXECUTION CONCEPT`

`LIGHTWEIGHT DISPATCH ≠ ROUTE OPTIMIZATION`

`DEFERRED FIELD SCOPE NOT PULLED INTO BETA-1`

## Next required phase

`NEXT REQUIRED PHASE = TG4-PRODUCT-SLICE`

TG4 remains independent of Projects and must implement its frozen Product →
Order → inventory impact → fulfillment status → completion visibility →
Attention flow in its own phase.
