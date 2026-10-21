# TG3-FV — Construction / Installation / Field Service Final Verification

## Executive verdict

`TG3-FV CLOSED WITH EVIDENCE — CONSTRUCTION / INSTALLATION / FIELD SERVICE BETA-1 ACCEPTANCE CONTRACT IS FINAL VERIFIED AT L5`

`TG3 = CLOSED WITH EVIDENCE`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`TG2 = CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = FINAL VERIFICATION IN PROGRESS — NOT YET MASTER CLOSED`

`JOB = SHARED PROJECT DOMAIN`

`LIGHTWEIGHT DISPATCH ≠ ROUTE OPTIMIZATION`

`DEFERRED FIELD SCOPE REMAINS OUTSIDE BETA-1`

Independent verification found one frozen context-navigation blocker: Work
Order Attention already carried the Site ID but omitted a direct Site link.
The focused fix projects that existing identity into the Attention detail view
and adds loader/presentation regression tests. All acceptance criteria now
pass. No database, readiness, production, or deferred-scope change was made.

## Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `df26e241a3ef8e813d7b1d800eeaa4c067188b35` |
| Verification/fix commit | `0aeebe9bf93bd048fe53506af2b036bb2f7f67ac` — `fix(beta1): link field attention to sites` |
| Evidence commit | evidence commit containing this document; exact SHA reported in final handoff because a Git commit cannot contain its own SHA |
| Final HEAD | evidence commit containing this document; exact SHA reported in final handoff |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | `0 0` after normal push |
| Worktree | clean before verification and clean after push |

Pre-flight verified the exact branch, starting HEAD, upstream, clean worktree,
and zero divergence. No pull, merge, rebase, reset, stash, migration repair,
force-push, or evidence rewrite occurred.

## Frozen acceptance contract

The frozen Field workflow is:

`Customer → Job → Site → Work Order → Technician → Dispatch → execution → completion → Attention`

Required composition remains Customers, shared Projects displayed as Jobs,
Sites, Work Orders, Members displayed as Technicians where operationally
relevant, lightweight Dispatch, Tasks, Attention, Home,
`foundation.field-operations`, `shared.projects`, `field.locations`,
`field.work-orders`, `field.dispatch`, context gating, Field terminology, and
ONBOARDING-1A. Leads remain recommended rather than mandatory.

## Verification matrix

| Frozen criterion | Current evidence | Result | Blocker? | Action |
| --- | --- | --- | --- | --- |
| Customer | Shared Customer UI/actions, Field gating and tenant-scoped reads | PASS | No | none |
| Customer→Job | Customer Projects section, prefilled creation, shared Project RPC | PASS | No | none |
| Job terminology | Field terminology tests project Job/Jobs; Service remains Project | PASS | No | none |
| Job→Site | Field-only Job detail section and prefilled Site create route | PASS | No | none |
| Site | Site schema, list/detail/create/edit/archive/restore and route gates | PASS | No | none |
| Site→Work Order | Site detail prefill plus RPC relation validation/immutability | PASS | No | none |
| Work Order | Full read/write UI, schedule, instructions, relations and history | PASS | No | none |
| Technician assignment | Nullable active same-org Member FK and RPC validation | PASS | No | none |
| Dispatch | Overdue/Unassigned/Today/Upcoming/Completed queue and links | PASS | No | none |
| Execution lifecycle | UI and SQL transition graph match; invalid edges rejected | PASS | No | none |
| Completion | Completed timestamp/history/Dispatch state; Job remains independent | PASS | No | none |
| Attention | Required rules, dedupe, expiry, Work Order/Job/Site links | PASS | No | fixed direct Site link |
| Home composition | Shared Attention and assigned due/overdue Task composition | PASS | No | none |
| Gating | Field modules allowed; cross-target/unresolved routes fail closed | PASS | No | none |
| RBAC | Existing Owner/Admin/Staff/viewer boundaries retained | PASS | No | none |
| RLS/org isolation | RLS, select-only grants, RPC checks and composite tenant FKs | PASS | No | none |
| TG1 regression | Knowledge surface preserved; no Field leakage | PASS | No | none |
| TG2 regression | Corrected Service terminology/enrollment gating preserved | PASS | No | none |
| TG4 regression | Product workflow preserved; Projects/Field modules absent | PASS | No | none |

## Investigation

Verification inspected the TG3 scope freeze and Field slice evidence, Shared
Projects, AppShell gating, terminology, ONBOARDING-1A, Customers, shared
Projects/Jobs, Sites, Work Orders and status history, Technician/Member
assignment, Dispatch classification, Work Order Attention SQL/read/actions/UI,
Home composition, registry and direct-route guards, RBAC/RLS/composite
constraints, corrected TG2 state, TG4 Product state, generated types, current
tests, and full-suite baseline.

Independent workflow and security reviews found the domain and security
contracts complete. Operator UX review identified the missing direct Site
link. The separate observation that an empty top-level Work Order list says
"No work orders in this group" is non-blocking backlog: the create action
remains available, the state is truthful, and it does not prevent operation.
It was not changed under the verify-not-build rule.

## End-to-end acceptance

The governed evidence scenario is:

1. A Field organization assigned `field_operations` resolves
   `foundation.field-operations` at `context_ready`.
2. Field navigation exposes Customers, Jobs, Sites, Work orders, Dispatch,
   Tasks, Attention, recommended Leads, and role-gated Members.
3. Customer detail exposes shared Projects as Jobs and a permission-gated New
   job action prefilled with that Customer.
4. The shared Project RPC validates Customer/owner in the organization and
   persists the Job without a second Job table.
5. Job detail exposes Field-only Sites and Work orders. New site carries the
   Job context; server validation rechecks Customer/Job consistency.
6. Site detail exposes New work order with Site context. The Work Order RPC
   rechecks the Site/Job relationship and rejects mismatched or foreign IDs.
7. A nullable Technician assignment selects an active organization Member.
8. Scheduling places the Work Order into the applicable lightweight Dispatch
   group with Customer, Job, Site, Technician, schedule, status, and detail
   link.
9. Valid transitions move planned → scheduled → in_progress → completed and
   append status history; invalid transitions fail closed.
10. Overdue or unassigned actionable conditions produce one deduped Attention
    item. Healthy/completed/corrected work expires the open rule item.
11. Attention links directly to Work Order, Job, and Site.
12. Completion records `completed_at`, remains visible in Dispatch/history,
    and does not automatically complete the Job.
13. Shared Home exposes active Attention and assigned due/overdue work.

No map, route optimizer, GPS, inventory, costing, mobile/offline application,
or other deferred feature is needed to complete the scenario.

## Customer

Field has lawful Customer list/detail/create/edit/archive behavior and generic
Customer terminology. Customer reads and mutations remain organization
anchored. Service `Client` wording does not leak into Field. Enrollment
composition remains hidden because Field lacks that capability.

## Customer → Job

Customer detail uses the shared Projects relationship but displays Jobs and a
New job action. The create route carries the Customer ID; the Project RPC
independently validates the active same-organization Customer. The persisted
row appears through the organization-and-Customer-scoped query.

`JOB = SHARED PROJECT DOMAIN`

No `jobs` table or parallel lifecycle exists.

## Job

Field uses shared Project list/create/detail/edit/status/archive/restore,
owner, dates, and Customer relationship. The authoritative Project lifecycle
remains `planned`, `active`, `on_hold`, `completed`, `cancelled`. Field-only
Site/Work Order composition appears only when field capabilities resolve;
Service continues to render the same domain as Project without those panels.

## Job → Site

Job detail links to `/sites/new` with organization and Project IDs. Site form
options derive Customer from the selected Job. The RPC verifies the Project
and Customer are active, same-organization, and mutually related. The Site is
then returned under the same Job.

## Site

The Field-only Site module provides list, create, detail, edit, archive/restore
where permitted, address and operational notes, Customer/Job context, and
Work Order continuity. RLS and same-org composite references protect reads and
relations. No map/GPS semantics are present.

## Site → Work Order

Site detail links to a prefilled Work Order create form. The server/RPC
validates Job, Site, Technician, and schedule. Site and Job must match;
foreign IDs fail closed. Work Order Job/Site identity is immutable on update,
matching the frozen design.

## Work Order

Work Order list/create/detail/edit surfaces title, instructions, Customer,
Job, Site, Technician, schedule, execution status, `completed_at`, and status
history. It is a separate field execution record rather than a duplicate Task.

## Technician assignment

`TECHNICIAN = MEMBER DISPLAY / FIELD EXECUTION CONCEPT`.

The nullable `technician_member_id` references
`organization_members(organization_id, id)`. RPC validation requires an
active same-organization Member when assigned. Foreign and inactive Member
IDs fail closed. No Technician identity table or Field-specific role was
introduced; Members administration remains generic.

## Dispatch

`/dispatch` classifies Work Orders into Overdue, Unassigned, Today, Upcoming,
and Completed. Rows expose Customer, Job, Site, Technician, schedule, status,
and Work Order navigation. Completed work is historical rather than active;
unassigned and overdue work remain visible.

`LIGHTWEIGHT DISPATCH ≠ ROUTE OPTIMIZATION`

The UI explicitly avoids maps, routing, GPS, and optimization.

## Execution lifecycle

The SQL and UI transition graph is:

- `planned → scheduled | cancelled`;
- `scheduled → planned | in_progress | cancelled`;
- `in_progress → scheduled | completed | cancelled`;
- `completed → in_progress`;
- `cancelled → planned`.

Scheduled/in-progress/completed states require a schedule. Completion sets
`completed_at`; leaving completed clears it. Every transition appends
organization-scoped status history. Invalid graph edges fail closed. Job
status is not mutated.

## Completion

Completed Work Orders show an unambiguous status and completion timestamp,
remain readable in detail/history and Completed Dispatch, and leave the Job
independent. Completion makes overdue/unassigned rules healthy so stale active
Attention expires on evaluation.

`WORK ORDER COMPLETION ≠ AUTOMATIC JOB COMPLETION`

## Attention

Required rules:

- `work_order_overdue`: scheduled and past its schedule;
- `work_order_unassigned`: scheduled/in-progress, due within the configured
  window, and lacking a Technician.

Positive SQL branches upsert the lawful item. Healthy branches do not upsert.
Both use the shared source dedupe key and expiry mechanism. Completion,
cancellation, assignment, schedule correction, or leaving actionable scope
expires the corresponding open item. Queries and source foreign keys include
organization identity.

The blocker fix consumes the already-mapped `workOrder.siteId`, builds a
tenant-preserving Site route, and renders direct Work Order, Job, and Site
links. Two regression tests verify loader and rendered navigation.

## Home composition

The shared daily operating brief is source-agnostic: it presents open/
acknowledged Attention and the operator's overdue/due-today Tasks. Work Order
Attention carries Job context through `projectName`, so Field operators can
identify and enter active work without a separate Field dashboard.

## Terminology

Field surfaces use Customer/Customers, Job/Jobs, Site/Sites, Work order/Work
orders, and Technician/Technicians where semantically appropriate. Members
remains generic administration. Service remains Client/Project, and Product
retains Product terminology.

## AppShell / routes

Field exposes Home, recommended Leads, Customers, Jobs, Sites, Work orders,
Dispatch, Tasks, Attention, and role-gated Members. It hides Programs,
Enrollments, Progress, Products, Orders, Inventory, and Fulfillment.

Capability enforcement occurs in route loaders, not navigation alone. Sites,
Work Orders, Dispatch, and Jobs are allowed for Field; Knowledge/Product
routes are denied. Field-only routes are denied for Service, Knowledge,
Product, and unresolved context.

## RBAC

Existing Owner/Admin/Staff/viewer semantics remain authoritative. Owner/Admin/
Staff can perform normal Site and Work Order operations; Owner/Admin retain
administrative archive/restore and Attention evaluation where required;
viewers cannot mutate. Technician assignment remains within the existing
Member model. Members administration remains independently role-gated.

## RLS / organization isolation

`ORG A CANNOT READ OR MUTATE ORG B FIELD DATA`.

Sites and Work Orders have RLS enabled, authenticated SELECT-only table grants,
and RPC-only CUD. Composite foreign keys bind Customer, Project, Site,
Technician Member, creator, Work Order history, and Attention sources to
`organization_id`. RPC validators independently check active membership and
relationship consistency. Representative cross-org Customer/Job/Site/Work
Order/Technician/Attention identities therefore fail at application, RPC, or
constraint boundaries.

## Onboarding integration

The governed mapping is:

`field_operations → foundation.field-operations`

Assignment rejects arbitrary pack IDs; the resolver returns Field
capabilities and terminology. The pack remains `context_ready` and is
available only through the existing internal-QA resolution posture. No
Course Seller onboarding behavior changed.

## TG1 regression

Knowledge retains Programs, Enrollments, Progress, Leads, Customers, Tasks,
Attention, navigation, and onboarding. Field modules remain hidden and
direct-route denied. Targeted and full suites show no new regression.

## TG2 regression

Service retains Leads, Clients, Projects, Tasks, and Attention while Sites,
Work Orders, and Dispatch remain denied. Corrected TG2 behavior remains
covered: Lead conversion/status says Client, Client detail suppresses forbidden
Enrollments, and the Project empty state says client.

## TG4 regression

Product retains Product → Order → Inventory → Fulfillment, with no Project or
Field modules and no Field terminology leakage. Product UI/gating tests pass.

## UX verification

Operator-level route/component review verified creation prefills, relation
context, assignment labels, lifecycle actions, pending/disabled/error states,
Dispatch links/classification, completion, responsive table/card behavior,
semantic controls, labels, and safe normalized errors. The one blocking
navigation omission was fixed. The top-level Work Order empty-state wording is
recorded as non-blocking post-Beta copy backlog; it does not hide creation or
cause a dead end.

## Blockers / fixes

`BLOCKERS FOUND = 1`

**Failed criterion:** Attention context/cross-link completeness.

**Root cause:** `AttentionWorkOrderSummary` included `siteId`, but
`loadAttentionDetailPage` projected only Work Order and Project hrefs, and the
Work Order Attention branch rendered no Site.

**Correction:** add `siteHref` to the detail view model, derive it with the
existing Field navigation helper, render the Site link, and add loader and
presentation tests.

**Before:** Attention → Work Order + Job only.

**After:** Attention → Work Order + Job + Site.

No migration, schema, generated-type, lifecycle, RBAC, or shared-domain change
was needed.

## Deferred scope

No implementation was added for maps, GPS, routing/optimization, geofencing,
live tracking, vehicles, materials/inventory, purchasing, tools/equipment,
costing, timesheets, payroll, photos, signatures, advanced scheduling,
recurring maintenance, SLA engine, assets, native/offline application,
calculations/quotes, change orders, or subcontractors.

## Tests / quality

Governed TG3-FV targeted suite:

`40 test files / 368 tests — all passed`

Coverage includes Customers/Jobs, Projects, Sites, Work Orders, Technician
assignment, Dispatch, lifecycle, Attention, Home, terminology, product access,
direct routes, RBAC/RLS/isolation, onboarding/resolver, TG1, corrected TG2,
and TG4.

Full Vitest:

`498 test files: 496 passed / 2 failed`

`3556 passed / 2 failed / 3558 total`

The two failures are exactly the accepted historical baseline:

1. `tests/features/invitations/load-member-administration-page.test.ts`;
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`.

`NEW REGRESSIONS = 0`

Quality gates:

- `npm run typecheck` — PASS (isolated after build);
- `npm run lint` — PASS, no ESLint warning/error; existing `next lint`
  deprecation notice remains;
- `npm run build` — PASS; all Field and shared routes compiled;
- pre-existing build warning only: autoprefixer recommends `flex-end` instead
  of `end` in
  `src/features/social-media/ui/platform-closed-beta-operator-list.module.css`;
- npm's pre-existing unknown `devdir` environment-config warning remains.

## Production non-effects

`PRODUCTION CUSTOMER WRITES = 0`

`PRODUCTION PROJECT/JOB WRITES = 0`

`PRODUCTION SITE WRITES = 0`

`PRODUCTION WORK_ORDER WRITES = 0`

`PRODUCTION ATTENTION WRITES = 0`

`PRODUCTION DATA WRITES = 0`

`PRODUCTION MIGRATIONS APPLIED = 0`

`DEPLOYMENTS = 0`

`SOCIAL EXECUTION GATES CHANGED = NO`

`CORE REOPENED = NO`

`DATA REOPENED = NO`

All activity was local inspection, deterministic tests/builds, source changes,
and Git evidence operations.

## Readiness / BQA

`foundation.field-operations = context_ready`

`TG3 FINAL VERIFIED ≠ AUTOMATIC CTX PROMOTION`

`CTX BETA_SUPPORTED PROMOTION = NO`

BQA/customer admission was not broadened.

## Scope compliance

The implementation correction contains four files:

- `src/features/attention/ui/load-attention-detail-page.ts`;
- `src/features/attention/ui/attention-detail.tsx`;
- `tests/ui/attention-detail-page-loader.test.ts`;
- `tests/ui/attention-detail-presentation.test.tsx`.

The phase adds this evidence document separately. No unrelated cleanup,
migration, readiness change, production mutation, or deferred scope appears.

## Final verdict

All 43 governed success criteria pass. The only full-suite failures are the
two accepted historical failures.

`TG3-FV CLOSED WITH EVIDENCE — CONSTRUCTION / INSTALLATION / FIELD SERVICE BETA-1 ACCEPTANCE CONTRACT IS FINAL VERIFIED AT L5`

`TG3 = CLOSED WITH EVIDENCE`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`TG2 = CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = FINAL VERIFICATION IN PROGRESS — NOT YET MASTER CLOSED`

`JOB = SHARED PROJECT DOMAIN`

`LIGHTWEIGHT DISPATCH ≠ ROUTE OPTIMIZATION`

`DEFERRED FIELD SCOPE REMAINS OUTSIDE BETA-1`

## Next required phase

`NEXT REQUIRED PHASE = TG4-FV`

TG4-FV must independently verify Product → Order → inventory impact →
Fulfillment → completion → Attention. It is not started by this phase.
