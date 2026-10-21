# TG2-AGENCY-SLICE — Agency / Business Services End-to-End Beta-1 Workflow

## Executive verdict

`TG2-AGENCY-SLICE CLOSED WITH EVIDENCE — SERVICE ORGANIZATIONS CAN OPERATE THE FROZEN LEAD-TO-CLIENT-TO-PROJECT-TO-WORK-TO-ATTENTION-TO-COMPLETION BETA-1 WORKFLOW`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE`

`TG2 SLICE IMPLEMENTED ≠ TG2 FINAL VERIFIED`

`SHARED PROJECT DOMAIN PRESERVED`

`DEFERRED AGENCY SCOPE NOT PULLED INTO BETA-1`

This phase composes already-closed shared foundations (Leads, Customers,
shared Projects, Tasks, Attention, Home, Members) into one coherent Service
operator journey: Lead → Client → Project → Tasks + assignment → delivery
status → Attention → completion visibility. Most of the frozen contract was
already satisfied by prior closed phases (Lead→Client conversion, Task
assignment, Project lifecycle). The actual gaps closed here are: Client→
Project discoverability/creation, Project→Task creation/summary continuity,
three minimal Project Attention signals (shared, not Agency-only), Attention↔
Project/Task cross-links, Home Attention context-label coverage for Project
signals, and Service ("Client") wording on the Lead conversion panel. No new
Customer/Project domain, no Client Portal, no billing, no files, no advanced
capacity or automation were introduced.

## Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `a960f6798f9707544b06517dacf19b57b0909f51` |
| Final implementation HEAD | `8e670732c5ed7d715ab97381f97f7c8f1843dae7` |
| Implementation commit | `8e670732c5ed7d715ab97381f97f7c8f1843dae7` — `feat(beta1): complete agency service slice` |
| Evidence commit | follow-up closure-HEAD record containing implementation SHA alignment |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | `0 0` |
| Worktree | clean before implementation and clean after push |

## Investigation

Inspected before coding: Lead schema/domain/UI/status lifecycle and existing
Lead→Customer conversion RPC/UI; Customer list/detail; the shared Projects
module (schema, RPCs, lifecycle, list/detail UI) from `SHARED-PROJECTS-
FOUNDATION`; Project↔Task linkage and the Task assignee model; Task create/
update flows; the Attention item/signal architecture (source/shape checks,
dedupe, severity, resolution lifecycle, RLS, RPC gating) from `B1.7.2/B1.7.3`
and its Social generalization (`SMM-B1.11-D`); Home/daily-operating
composition; the product-access module registry, capability gating, and
Service/Field/Knowledge/Product context packs; `ProductTerminology`; RBAC/
organization-isolation patterns; existing cross-links; current test coverage;
and the full migration inventory.

## Gap analysis

| Frozen TG2 step | Already complete | Gap | Action |
| --- | --- | --- | --- |
| Lead | Yes — full Lead domain/UI/lifecycle | none | none |
| Lead → Client | Yes — `convert_lead_to_customer` RPC, dedupe/idempotent retry, `lead_conversion` history source, `LeadDetail` "Converted customer" panel with link | Service wording said "customer" unconditionally | made the converted-entity panel and convert link terminology-aware (`Client` under Service, unchanged default `Customer`) |
| Client | Yes — Customer domain displayed as Client in Service | Client detail had no Projects section and no "New project" affordance | added `CustomerProjectsSection` + `listProjectsForCustomer` + create-with-customer prefill |
| Project | Yes — shared Project domain, lifecycle, RLS, RPCs | none | none |
| Tasks | Yes — Task↔Project FK, `create_project_task` | Project detail had no "New task" link and no outstanding/completed/overdue summary | added `buildTaskCreateHrefForProject`, task summary line, status badges |
| Assignment | Yes — existing Task assignee model, same-org enforced | none (Project Task creation/reassignment already reuses it) | none |
| Delivery status | Yes — authoritative Project status lifecycle | Project detail lacked a quick outstanding/overdue readout | added task summary/overdue counts (same panel as above) |
| Attention | Architecture yes; Project signals no | no Project-sourced Attention signals existed | added `project` Attention source + 3 rule keys + `evaluate_project_attention_rules` RPC + UI wiring |
| Completion visibility | Yes — `active/on_hold/completed/cancelled` + archive, badges already present | none | preserved as-is |
| Home composition | Yes — Attention + assigned overdue/due-today Tasks generically composed | Project-sourced Attention items had no context label (no enrollment/program) | added `projectName` to the Home context-label fallback |

Only the identified gaps were implemented. Already-satisfying components
(Lead domain, Project domain/lifecycle, Task assignment, Attention core
architecture, Home composition core) were **not** rewritten.

## Before state

- Lead→Customer conversion was already fully implemented (RPC, UI, retry
  safety, `lead_conversion` history label) from prior phases; verified with
  existing passing tests (`tests/ui/lead-convert-workflow.test.tsx`, customer
  history source tests).
- Customer detail had `CustomerHistorySection`, `CustomerEnrollmentSection`,
  and `CustomerRelatedTasksSection`, but no Project awareness at all.
- Project detail (`SHARED-PROJECTS-FOUNDATION`) showed Customer/owner/status/
  dates/summary and a plain related-Task list with no creation entry point or
  outstanding/completed/overdue readout.
- Attention supported `enrollment`, `social_publication`, and
  `social_connection` sources only; no Project-derived signal existed.
- Home (`DailyOperatingBriefPanel`) already generically composed Attention +
  assigned overdue/due-today Tasks; Project Attention items would have
  appeared with a blank context label.

## Lead → Client

No new conversion mechanism was built — `convert_lead_to_customer` (idempotent,
same-organization, preserves Lead status/history, records `lead_conversion`
customer history) and the `LeadDetail` "Converted customer" panel already
satisfied every Beta-1 requirement (traceability, no duplicate creation,
accessible resulting Client).

The only change: `LeadDetail` and the Lead detail page now accept an optional
`terminology` prop (default `DEFAULT_PRODUCT_TERMINOLOGY`, fully backward
compatible) so the converted-entity heading, aria-label, badge, and the
"Convert to …" workflow link say **Client** in Service context instead of
always saying "customer." No routes, capability keys, or database
identifiers changed.

```64:71:src/features/leads/ui/lead-detail.tsx
export function LeadDetail({
  viewModel,
  reloadHref,
  workflowLinks,
  terminology = DEFAULT_PRODUCT_TERMINOLOGY,
}: LeadDetailProps) {
  const customerSingular = terminology.customer.singular;
```

Tests: `tests/ui/lead-detail-presentation.test.tsx` adds a Service-terminology
case ("Converted client" / "Client archived" / "Convert to client") and a
default-terminology backward-compatibility case; all four pre-existing Lead
convert/workflow test files pass unchanged.

## Client → Project

`CustomerDetail` now renders a `CustomerProjectsSection` (new component)
listing the Customer's non-archived Projects (name, link, owner, status
badge) with an optional "New project" link, gated by
`moduleAccess.navVisibility.projects` and `projectPermissions(role).canCreate`
exactly as Project pages already gate creation. Project creation from a
Client pre-fills the Customer via `buildProjectCreateHrefForCustomer` /
`initialCustomerId`, so the operator does not have to re-select the Client.

```8:22:src/features/projects/server/project-queries.ts
export async function listProjectsForCustomer(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  customerId: string,
  options: { limit?: number } = {},
): Promise<{ data: ProjectRecord[]; error: string | null }> {
```

No `agency_clients` table, no duplicated Customer/Client domain, no
Customer-schema change. The section is hidden entirely (`kind: "hidden"`)
when the Projects module is not visible in the resolved context (e.g. a
future Knowledge-only Customer view), fails soft with a reload affordance on
query error, and shows a plain empty state otherwise — matching the existing
Enrollment/Task section conventions on the same page.

Tests: `tests/ui/customer-detail-presentation.test.tsx` adds ready/empty/
hidden/error cases for the new section.

## Tasks + assignment

Project detail now has a "New task" action (visible to editors, i.e.
`projectPermissions(role).canUpdate`) that pre-selects the Project as Task
context via `buildTaskCreateHrefForProject` → `?projectId=…` →
`TaskCreateForm`'s new `initialContext` prop. This reuses the existing
Task→Project linked-context and the existing Task assignee model verbatim; no
second assignee model, no new Task fields, no cross-org bypass. Same-
organization assignee enforcement, predecessor/context exclusivity, and every
legacy Task path (Lead/Customer/Enrollment Tasks) are unchanged.

Project detail also now shows an outstanding/completed/overdue task summary
line and per-task status badges/"Overdue" indicators, computed client-side
from data the loader already returned (`ProjectTask[]`); no new query.

```234:238:src/features/projects/ui/project-views.tsx
  const outstandingCount = tasks.filter((task) => task.status === "open").length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const overdueCount = tasks.filter(isTaskOverdue).length;
  const canCreateTask = permissions.canUpdate;
```

This is a **shared improvement**: the Project detail component is the same
component Field renders as Job detail, so Field organizations get the
identical "New task"/summary affordance with Field/Job terminology — no
Agency-only branch was introduced (proven by the Field-terminology test case
below).

Tests: `tests/ui/projects-terminology.test.tsx` adds a
`ProjectDetail` describe block covering the New-task link + summary for
editors, hiding New-task for viewers, gating the new Attention control to
owner/admin, and an explicit Field/Job-terminology equivalence case.

## Delivery status

No new delivery-status field or engine. The authoritative Project status
lifecycle (`planned/active/on_hold/completed/cancelled` + archive) from
`SHARED-PROJECTS-FOUNDATION` remains the single source of truth. What changed
is *visibility*: Project detail's outstanding/completed/overdue task summary
(above) makes "what's actually happening" legible next to the existing status
badge without inventing a parallel status concept. No "all Tasks must be
complete before Project completion" rule was added — existing lifecycle
transitions are preserved unchanged.

## Attention

New, additive-only migration:
`supabase/migrations/20260905140000_tg2_agency_slice.sql`.

It adds a `project` Attention source (mirroring the existing `enrollment` /
`social_publication` / `social_connection` sources exactly) with:

- `attention_items.project_id` / `.task_id` columns, organization-scoped
  composite foreign keys to `projects`/`tasks`, and a widened
  `attention_items_source_shape_chk` requiring `project_id` set and all other
  source-entity columns null for `source_type = 'project'`;
- three new rule keys added to the existing `attention_signals_rule_key_check`
  / `..._origin_rule_consistency_check` constraints and to
  `private.append_attention_signal` (full `create or replace`, same
  signature — not a parallel signal path):
  - `project_overdue_active` — active Project whose `planned_end` has passed;
  - `project_task_overdue` — active Project with at least one overdue open
    Task;
  - `project_no_owner` — active Project with no `owner_member_id`;
- `private.upsert_project_rule_attention_item` /
  `private.expire_project_rule_attention_item_if_present`, reusing the
  existing `private.build_attention_source_dedupe_key`,
  `private.insert_attention_item_event`, and `private.expire_attention_item`
  helpers verbatim (no second dedupe/expiry mechanism);
- `public.evaluate_project_attention_rules(organization_id, project_id?)`,
  Owner/Admin-only via `private.require_attention_actor`, `security definer`,
  empty `search_path`, `revoke ... from public/anon`, `grant execute ... to
  authenticated` only — the same authorization shape as the existing
  `evaluate_attention_rules`. On-demand, no scheduler.

These three signals were deliberately selected as the smallest high-value set
out of the candidate list (overdue Project, overdue-Task Project, ownerless
Project) — "no open Tasks" and "stalled on-hold" were **not** implemented, per
the requirement to avoid a large new risk engine. Every signal is an
exception requiring action, not a restatement of normal healthy status; a
healthy active Project with an owner, no overdue Task, and an unexpired plan
produces zero items. The rule scan additionally expires any open Project
Attention item whose Project has left active scope (on_hold/completed/
cancelled/archived) even without a per-rule condition change, so closure
becomes visible without waiting for a coincidental re-check.

Application layer: `evaluateProjectAttentionRules` RPC adapter (new,
`ATTENTION_RPC_NAMES.evaluateProjectRules`), a new
`evaluateProjectAttentionRulesAction` server action + Zod input schema, and a
new `AttentionEvaluateProjectRulesActions` client control (same pattern as
the existing enrollment evaluate control) rendered:

- organization-wide on `/attention`, gated by `capabilities.canEvaluateRules`
  **and** `moduleAccess.navVisibility.projects` (so it is invisible to
  Knowledge/Product where Projects does not exist);
- Project-scoped on `/projects/[projectId]`, gated by
  `role === "owner" | "admin"` and `navVisibility.attention` — this closes the
  "Project → Attention" direction of the workflow loop.

Read-side: `attention_items.project_id`/`task_id` flow through
`AttentionItemListItemReadModel`/`AttentionItemDetailReadModel`
(`projectId`, `taskId`, `projectName`, `project`, `task`), the Attention list/
detail pages resolve and link `projectHref`/`taskHref` in "Related context",
list filtering accepts `projectId`, and `resolveAttentionTypeLabel(FromDetail)`
labels the three new rule keys ("Project past planned end date", "Project has
an overdue task", "Active project has no owner").

Tests:

- `tests/security/tg2-agency-slice-migration-security.test.ts` (new, 10
  cases) — additive-only DDL, widened source/shape checks, FK organization
  scoping, widened rule-key allow-lists, `append_attention_signal` full
  replace, Owner/Admin + security-definer + empty search_path on the new RPC,
  locked-down EXECUTE grants, no Agency-specific tables/Client-Portal/billing/
  files scope, reuse (not duplication) of dedupe/expiry helpers, and stale
  Attention cleanup on Project scope exit.
- `tests/server/attention-rpc-adapters.test.ts` — exact RPC name/args and
  jsonb-result mapping for `evaluateProjectAttentionRules`, and Staff/Viewer
  denial before any RPC call (organization isolation / RBAC).
- `tests/features/social-media/social-missed-window-attention.test.ts` —
  updated the frozen `ATTENTION_SOURCE_TYPES` assertion to include `project`
  (an intentional, reviewed widening, not a regression).

## Completion visibility

Unchanged lifecycle semantics; unchanged badges. `active`, `on_hold`,
`completed`, and archived Projects remain visually distinct via the existing
`statusVariant`/`Badge` combination on both list and detail. The new task
summary line makes "still has 2 outstanding" vs. "0 outstanding · 5
completed" legible at a glance without adding a second completion concept.

## Home composition

`composeDailyOperatingBrief` already generically surfaces open/acknowledged
Attention (Critical/High organization-wide for Owner/Admin, all severities
assigned-to-me for everyone) and the caller's own overdue/due-today Tasks —
this composition is source-agnostic and required **no change** to consume
Project Attention items or Project-linked Tasks. The one gap: its
`attentionContextLabel` only read `customerDisplayName`/`programName`, which
are always null for `project`-sourced items, so Project Attention rows would
have shown with no context label. Fixed additively by also including
`projectName`:

```58:64:src/features/daily-operating/domain/compose-daily-operating-brief.ts
function attentionContextLabel(item: AttentionItemListItemReadModel): string | null {
  const parts = [
    item.customerDisplayName,
    item.programName,
    item.projectName,
  ].filter((value): value is string => Boolean(value && value.trim()));
  return parts.length > 0 ? parts.join(" · ") : null;
}
```

No Home redesign, no separate Agency dashboard, no new widget type. This is a
shared improvement (useful to any Project-Attention consumer, Service or
Field), not an Agency-specific composition.

## Cross-linking

| From | To | Mechanism |
| --- | --- | --- |
| Lead | resulting Client | existing `convertedCustomerHref` (unchanged) |
| Client | Projects list + New project | new `CustomerProjectsSection` + `buildProjectCreateHrefForCustomer` |
| Project | Client | existing Customer link in Project detail (unchanged) |
| Project | related Tasks + New task | existing related-task list + new `buildTaskCreateHrefForProject` |
| Attention | Project/Task | new `projectHref`/`taskHref` in `AttentionDetailViewModel`, rendered in "Related context" |
| Attention list | filter by Project | new `projectId` filter param (`AttentionListFilters`, `attentionListFiltersSchema`) |

Every link uses an identifier plus a shared domain relationship
(`customerId`, `projectId`, `attentionItemId`) and is always emitted with
`?org=<organizationId>`; no duplicated data was stored to support a link.

## Service terminology

No rename of `customers`, `projects`, capability keys, routes, or database
types. `ProductTerminology` (`customer.singular/plural`,
`project.singular/plural`) is the only vocabulary source, and it was extended
to exactly one more consumer (`LeadDetail`) with a fully backward-compatible
default. Service continues to read `Client/Clients` and `Project/Projects`;
Field continues to read `Customer/Customers` and `Job/Jobs` — proven by the
explicit Field-terminology equivalence test in
`tests/ui/projects-terminology.test.tsx`.

## Security / organization isolation

- Every new query/action re-derives `organizationId` from verified
  membership (`resolveOrganizationContext`), never from client input.
- `evaluate_project_attention_rules` requires Owner/Admin via
  `private.require_attention_actor`, exactly like `evaluate_attention_rules`;
  Staff/Viewer are rejected before any RPC call (`attention-rpc-adapters.
  test.ts`).
- `attention_items.project_id`/`task_id` use organization-scoped composite
  foreign keys (`(organization_id, project_id)` / `(organization_id,
  task_id)`), so a cross-organization Project/Task id cannot be attached to an
  Attention item even at the database layer.
- `listProjectsForCustomer` filters by `organization_id` and `customer_id`
  together; the "New project" link only appears when
  `projectPermissions(role).canCreate` is true for the resolved role.
- No new Agency role, no broadened archive/restore/admin permission — Project
  Task creation/reassignment continues to use the pre-existing Task
  RBAC/organization checks unchanged.

## TG1 preservation

No file under Programs/Enrollments/Progress was modified except the required,
additive `projectId`/`taskId`/`project`/`task` field additions to shared
Attention read models (needed because `AttentionItemListItemReadModel`/
`AttentionItemDetailReadModel` are shared across every source, including
`enrollment`). Existing enrollment Attention behavior, dedupe, and evaluate
flow are untouched and covered by the full, unmodified enrollment Attention
test suite (all passing). No Course Seller UI, capability, or route changed.

## TG3 preservation

Field renders the identical `ProjectDetail`/`ProjectActions` component tree
as Job detail. The New-task link, task summary, and (owner/admin-gated)
"Evaluate project Attention" control are rendered from the same shared
component with no `if (context === "service")` branch — proven directly by
the "works identically under Field (Job) terminology" test case. The three
new Attention rules operate on any `projects` row regardless of which context
created it; they are computed from Project/Task columns that exist for every
target, so Field Jobs get the same overdue/no-owner exception visibility for
free, with no Field-only or Agency-only fork. No Sites, Work Orders, or
Dispatch were added.

## TG4 preservation

`shared.projects` was not broadened; the Product Operations pack still has no
mapping to it, so Projects, the new Attention signals, and the new evaluate
controls remain unreachable in that context (`navVisibility.projects` false
⇒ every new Project-linked control is hidden by the same existing gates
verified in `tests/features/product-access/**`).

## Explicitly deferred

Not implemented, as required: Client Portal, retainers, billing/invoices/
payments, proposals/SOW/file management, advanced capacity/workload
planning/resource forecasting, freelancer marketplace, advanced automation,
profitability/margin/timesheets, a full Agency problem catalog, Social as an
Agency product, and any new Agency-specific `agency_clients`/`agency_projects`
schema. `foundation.service` remains `context_ready`; no `beta_supported`
promotion occurred.

## Changed files

The implementation commit contains 59 files with 2,674 additions and 54
deletions:

- `supabase/migrations/20260905140000_tg2_agency_slice.sql` (new);
- `src/types/database.generated.ts` (manually synchronized, no `db push`);
- `src/features/attention/**` (new source/rule keys, read models, RPC
  adapter, new evaluate-project action/schema/UI, cross-links, filters);
- `src/features/customers/ui/customer-projects.{tsx,module.css}` (new),
  `src/features/customers/ui/load-customer-detail.ts`,
  `src/features/customers/ui/customer-detail.tsx`;
- `src/features/projects/**` (query helper, navigation helper, form/loader
  prefill, detail task summary/new-task/evaluate-attention wiring);
- `src/features/tasks/ui/{load-task-workflow-page,task-create-form,
  task-navigation}.ts` (initial-context prefill from `projectId`);
- `src/features/leads/ui/lead-detail.tsx` (terminology-aware converted-entity
  panel);
- `src/features/daily-operating/domain/compose-daily-operating-brief.ts`
  (project context-label fallback);
- route wiring in `src/app/(authenticated)/{attention,customers,leads,
  projects,tasks}/**`;
- new `tests/security/tg2-agency-slice-migration-security.test.ts` and
  targeted updates across `tests/ui/**`, `tests/server/**`,
  `tests/domain/**`, `tests/features/**`, `tests/helpers/**`;
- `docs/phases/TG2-AGENCY-SLICE-agency-business-services-e2e-beta1-evidence.md`
  (this document).

No CAP/CTX seed, onboarding, readiness, BQA, Social, Program, Enrollment, or
Progress implementation file was modified.

## Tests / quality

Targeted TG2-AGENCY-SLICE-relevant suite (Leads, Customers, Projects, Tasks,
Attention, Home/daily-operating, product-access, security/migration, generated
types):

`29 test files / 207 tests — all passed`

Full Vitest:

`488 test files: 486 passed / 2 failed`

`3493 passed / 2 failed / 3495 total`

The two failures are exactly the pre-existing accepted historical failures
(unchanged assertions, unchanged root cause, present in the frozen Beta-1
baseline before this phase):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

`NEW REGRESSIONS = 0`

Quality gates:

- `npm run typecheck` — PASS
- `npm run lint` — PASS, zero warnings/errors
- `npm run build` — PASS, all Lead/Customer/Project/Task/Attention/Home
  routes compiled and prerendered; only the pre-existing, unrelated Social
  CSS autoprefixer warning remains

## Production non-effects

`PRODUCTION CUSTOMER WRITES = 0`

`PRODUCTION PROJECT WRITES = 0`

`PRODUCTION TASK WRITES = 0`

`PRODUCTION ATTENTION WRITES = 0`

`PRODUCTION DATA WRITES = 0`

`PRODUCTION MIGRATIONS APPLIED = 0`

`DEPLOYMENTS = 0`

`SOCIAL EXECUTION GATES CHANGED = NO`

`CTX BETA_SUPPORTED PROMOTION = NO`

`CORE REOPENED = NO`

`DATA REOPENED = NO`

The local Docker-backed Supabase stack was unavailable, so
`src/types/database.generated.ts` was synchronized directly from the reviewed
additive migration (the same approach used in `SHARED-PROJECTS-FOUNDATION`)
and compile-checked; no remote schema or data was touched.

## Scope compliance

The diff is one additive Attention migration (new `project` source + 3 rule
keys + 1 RPC, reusing all existing helpers), Client↔Project and Project↔Task
UI continuity on top of the existing shared components, Attention↔Project/
Task cross-links, one Home context-label fallback line, one Lead terminology
prop, and targeted tests/evidence. It contains no new Customer/Project
domain, no Agency-specific schema, no Client Portal/billing/files/capacity
scope, no TG1/TG3/TG4 contamination, and no readiness/admission change.

## Final verdict

`TG2-AGENCY-SLICE CLOSED WITH EVIDENCE — SERVICE ORGANIZATIONS CAN OPERATE THE FROZEN LEAD-TO-CLIENT-TO-PROJECT-TO-WORK-TO-ATTENTION-TO-COMPLETION BETA-1 WORKFLOW`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE`

`TG2 SLICE IMPLEMENTED ≠ TG2 FINAL VERIFIED`

`SHARED PROJECT DOMAIN PRESERVED`

`DEFERRED AGENCY SCOPE NOT PULLED INTO BETA-1`

## Next required phase

`NEXT REQUIRED PHASE = TG3-FIELD-SLICE`

TG3's frozen workflow (Customer → Job → Site → Work Order → technician
assignment → lightweight Dispatch → execution status → completion →
Attention) still requires Field-specific foundations not present today
(Sites, Work Orders, lightweight Dispatch), which this phase correctly did
not implement.
