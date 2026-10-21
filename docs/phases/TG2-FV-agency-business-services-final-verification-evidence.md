# TG2-FV — Agency / Business Services Final Verification

## Executive verdict

`TG2-FV CLOSED WITH EVIDENCE — AGENCY / BUSINESS SERVICES BETA-1 ACCEPTANCE CONTRACT IS FINAL VERIFIED AT L5`

`TG2 = CLOSED WITH EVIDENCE`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION / FINAL VERIFICATION IN PROGRESS — NOT YET MASTER CLOSED`

`DEFERRED AGENCY SCOPE REMAINS OUTSIDE BETA-1`

Independent review found three frozen-contract UX blockers after the initial
evidence commit: Service Lead conversion copy still used Customer, Service
Client detail could expose Knowledge Enrollment links to a forbidden route,
and the Service Project empty state still said customer. The focused
correction and four regression tests close those blockers. No database,
readiness, or production change was required.

## Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `f4d3dbc85ad726f7719377b0ed1020a33a7381f7` |
| Initially verified implementation HEAD | `f4d3dbc85ad726f7719377b0ed1020a33a7381f7` |
| Initial evidence commit | `7ac68c9bc46ca69426cf0706c1a0f128af111ffe` — superseded by the independent-review correction recorded below |
| Verification/fix commit | `ff5d2c42b69e5c4bba6c8787da040175f590a935` — `fix(beta1): close agency verification UX blockers` |
| Evidence alignment commit | follow-up commit containing this corrected closure record; exact SHA is reported in the final handoff because a Git commit cannot contain its own SHA |
| Final HEAD | evidence-alignment commit containing this corrected closure record; exact SHA is reported in the final handoff |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | `0 0` after normal push |
| Worktree | clean before verification and clean after push |

Pre-flight stopped-on-mismatch checks all passed: the branch, exact starting
HEAD, upstream, clean worktree, and `0 0` divergence matched the governed
request. No pull, merge, rebase, reset, stash, repair, or history rewrite was
performed.

## Frozen acceptance contract

The frozen Service workflow is:

`Lead → Client → Project → Tasks + assignment → delivery status → Attention → completion visibility`

The verified implementation composes the shared Lead, Customer, Project, Task,
Attention, Home, Member, product-access, terminology, and onboarding
foundations. `Client` is display terminology over the shared Customer domain;
Service `Project` and Field `Job` are display projections over the same
Project domain.

## Verification matrix

| Frozen criterion | Current evidence | Result | Blocker? | Action |
| --- | --- | --- | --- | --- |
| Lead available | Service capability/nav matrix; Lead list/detail/actions and Lead security suites | PASS | No | none |
| Lead→Client | `convert_lead_to_customer`; row lock; same-org lookup; converted link/history; conversion UI/action tests | PASS | No | none |
| Client terminology | terminology projection and Lead/Customer presentation tests prove Client/Clients without domain rename | PASS | No | none |
| Client→Project | Customer Projects section, prefilled create link, Project query/action/UI tests | PASS | No | none |
| Project lifecycle | shared Project status, owner, dates, archive/restore RPC and UI contracts | PASS | No | none |
| Tasks under Project | Project-linked Task create prefill, list and summary contracts | PASS | No | none |
| Task assignment | existing Member assignee model and same-org mutation constraints | PASS | No | none |
| Delivery status | Project status plus owner/dates and outstanding/completed/overdue Task summary | PASS | No | none |
| Attention | three Project rules; positive/healthy branches; shared dedupe/expiry; Project/Task links | PASS | No | none |
| Completion visibility | completed status remains listed/readable; related Tasks retained; stale active Attention expires | PASS | No | none |
| Home composition | shared Home surfaces Attention and assigned due/overdue Tasks with Project context label | PASS | No | none |
| Gating | Service matrix and fail-closed direct-route tests | PASS | No | none |
| RBAC | Owner/Admin/Staff/viewer matrices; privileged Attention evaluation remains Owner/Admin | PASS | No | none |
| Org isolation | tenant-anchored reads, composite FKs, membership-derived mutations, foreign-ID rejection | PASS | No | none |
| TG1 regression | Course Seller module/terminology matrix and full suite | PASS | No | none |
| TG3 regression | Field Job terminology and Field workflow UI regression suite | PASS | No | none |
| TG4 regression | Product workflow UI regression suite; Projects remain absent | PASS | No | none |

## Investigation

Final verification inspected the authoritative TG2 scope/slice evidence,
Shared Projects evidence, AppShell gating, terminology, ONBOARDING-1A, current
Lead conversion, Client detail, all Project pages and actions, Project-linked
Tasks, assignment, Project Attention SQL/read/actions/UI, Home composition,
product-access registry and guards, RBAC, organization isolation, generated
types, migration security contracts, and current cross-target/full-suite
baseline. Verification used the current repository state rather than treating
prior closure as proof by itself. Independent workflow and UX review completed
after the initial evidence commit found the three blockers documented below;
the first PASS assertion is therefore superseded by the fix and this corrected
alignment record rather than being treated as authoritative.

## End-to-end acceptance scenario

The governed scenario is proven as one composed contract:

1. A newly assigned Service organization resolves `service` to
   `foundation.service` at `context_ready`.
2. Service navigation exposes Leads, Clients, Projects, Tasks, Attention, Home,
   and role-gated Members.
3. An open Lead is readable and can be converted once by Owner/Admin/Staff.
   The conversion transaction locks the Lead, creates or explicitly links one
   same-organization Customer, records conversion history, and exposes the
   resulting entity as `Client`.
4. Client detail exposes shared Projects and a role-gated New project link
   prefilled with that Client.
5. The shared Project persists its Client, owner, planned dates, and status.
6. Project detail exposes related Tasks and a prefilled New task action. The
   existing Task model assigns an active same-organization Member.
7. Project status plus open/completed/overdue Tasks, owner, and dates answer
   the delivery-status question.
8. An overdue active Project, overdue open Project Task, or active unowned
   Project creates the corresponding lawful Attention item. Healthy branches
   create none; repeated evaluation reuses the source dedupe key.
9. Attention detail links back to the Project and optional Task.
10. Correcting the condition, completing/cancelling/on-hold moving, or
    archiving the Project expires the applicable open item under the existing
    Attention lifecycle.
11. Moving the Project to completed leaves it visible with an unambiguous
    Completed badge and historically readable related Tasks.
12. Home provides access to active issues and assigned due/overdue work.

No portal, billing, files, timesheets, or other deferred feature is needed to
complete this operator journey.

## Lead

Service includes Leads through its capability matrix. Lead list/detail,
owner/status, lifecycle, direct-route authorization, read isolation, mutation
authorization, accessibility, responsive, and workflow tests remain green.
Lead terminology remains general; no Course Seller-only wording was projected
into Service.

## Lead → Client

`public.convert_lead_to_customer` is a `security definer` RPC with empty
`search_path`. It derives active organization membership, permits
Owner/Admin/Staff, locks the selected Lead `FOR UPDATE`, restricts the lookup
to `(organization_id, lead_id)`, rejects archived/non-open/already-converted
Leads, restricts an existing Customer to the same organization, records
`lead_conversion` history, and stores `converted_customer_id`. A repeated or
concurrent request cannot create a second Client: after the first transaction
the locked Lead is no longer open and conversion fails closed. The resulting
Client link and Service terminology are covered by conversion and Lead-detail
tests.

## Client

Service renders Customer as `Client / Clients` in list/detail/actions while
retaining the `customers` table, Customer types, routes, and shared mutation
architecture. Search, detail, create/edit, archive/restore, breadcrumbs, and
action copy consume projected terminology. Client detail contains Projects
without creating an Agency-specific Client domain.

## Client → Project

Client detail queries Projects by organization and Customer together. The New
project affordance is capability- and permission-gated and carries the Client
ID into Project creation. The Project RPC independently validates the
organization-owned Customer; the persisted Project is returned by the same
Client-scoped query. No duplicated Agency Project model exists.

## Project

The shared Project domain remains authoritative. Service verifies list,
create, detail, edit, owner, planned dates, status transitions
(`planned/active/on_hold/completed/cancelled`), archive/restore, and Client
relationship. Owner/Admin retain archive/restore; Staff retain the lawful
operational subset; viewers cannot mutate. The same implementation renders as
Job in Field.

## Tasks + assignment

Project detail exposes related Tasks and a prefilled Task-create route.
Project-linked Task creation and reassignment reuse the existing Task and
Member models. Organization-scoped foreign keys/RPC checks reject a foreign
Project or assignee. The UI distinguishes open, completed, and overdue Tasks.
Lead-, Customer-, Enrollment-, and generic-Task contexts remain covered by the
full suite.

## Delivery status

The operator can see Project status, owner, planned dates, archive state, open
and completed Task counts, overdue count, and each related Task state. This is
sufficient delivery visibility without a second delivery engine.

## Attention

The authoritative Project rules are:

- `project_overdue_active`;
- `project_task_overdue`;
- `project_no_owner`.

SQL branches prove positive creation for each condition and no upsert for its
healthy branch. Upsert uses the shared source dedupe key, so repeated
evaluation updates/reuses one item instead of spamming. Rule recovery invokes
the shared expiry helper; a cleanup branch also expires open Project Attention
when the Project leaves active scope. Project/Task composite foreign keys
include `organization_id`, reads are tenant-anchored, and Attention detail
links to the relevant Project and optional Task. Evaluation is Owner/Admin
only and locked down to authenticated RPC execution.

## Completion visibility

Completed Projects remain available with a stable Completed label; completion
does not delete Project or Task history. Project Attention cleanup treats
completed work as outside active scope and expires stale open rule items.
There is intentionally no automatic Project completion from Tasks.

## Home composition

The shared daily operating brief surfaces open/acknowledged Attention and the
operator's overdue/due-today Tasks. Project Attention carries `projectName`
into the context label, providing a lawful path from Home to active Service
issues without an Agency-only dashboard.

## Terminology

Service proves `Client / Clients` and `Project / Projects`. The underlying
domains remain Customer and Project. Field proves `Customer / Customers` and
`Job / Jobs`; Product modules retain Product vocabulary. No database or
capability identifier was renamed for presentation.

## AppShell / route gating

Resolved Service navigation exposes Home, Leads, Clients, Projects, Tasks,
Attention, and role-gated Members. It does not expose Programs, Enrollments,
Progress, Sites, Work Orders, Dispatch, Products, Orders, Inventory, or
Fulfillment. Direct routes use the same capability evaluator and fail closed
for representative Knowledge-, Field-, and Product-only modules. Unresolved
context also fails closed.

## RBAC

Existing roles are retained. Owner/Admin have lawful administrative Project
actions and Attention evaluation. Staff can perform the defined operator
actions but cannot archive/restore or evaluate Project rules. Viewer/member
read-only paths cannot mutate. Members administration remains independently
role-gated.

## Organization isolation

`ORG A CANNOT READ OR MUTATE ORG B TG2 DATA`.

Lead reads and conversion anchor both organization and entity ID; conversion
rejects a foreign Customer. Project mutations re-resolve membership and RPCs
validate Customer and owner in the organization. Task RPCs validate Project
and assignee in the organization. Project Attention source references use
organization-scoped composite foreign keys and tenant-anchored reads.
Representative foreign IDs therefore fail closed at action/RPC and database
boundaries.

## Onboarding/resolver integration

The assignment contract maps the `service` operating model only to
`foundation.service`; the resolver returns the Service capability and
terminology composition. UI/status and seed-contract tests prove the governed
selection and assignment flow. Existing Course Seller onboarding remains
unchanged.

## TG1 regression

The four-target AppShell test proves Course Seller retains Programs,
Enrollments, Progress, Leads, Customers, Tasks, Attention, and its own
navigation/terminology without Agency leakage. Full Vitest reports no new
failure.

## TG3 regression

Field continues to render the shared Project as Job and retains Sites, Work
Orders, and Dispatch. The Field workflow UI regression suite passes. TG2-FV
changed no Field implementation.

## TG4 regression

Product continues to expose Product, Order, Inventory, and Fulfillment while
Projects remain unavailable. The Product Operations UI regression suite
passes. TG2-FV changed no Product implementation.

## UX review

Static route/component inspection and rendered UI tests verified the operator
journey, links, empty/error states, terminology, status copy, action placement,
responsive contracts, and safe normalized action errors. Critical controls
use labels, semantic links/buttons, pending/disabled states, and the existing
focus system. No broken link, dead page, unsafe raw database error, or
acceptance-blocking accessibility issue was found. Authenticated browser
execution was not used because this evidence phase did not write seed or
production data; the rendered tests and compiled routes provide deterministic
non-mutating evidence.

## Blockers found and fixes

`BLOCKERS FOUND = 3`

1. `/leads/[leadId]/convert` and related status guidance hardcoded Customer
   instead of consuming Service Client terminology. The forms now receive
   resolved `ProductTerminology` and project Client through all operator copy.
2. Service Client detail loaded Enrollment summaries and emitted Enrollment
   links even though `enrollments` is capability-denied. Both the loader query
   and page links now require `navVisibility.enrollments`.
3. The Client Projects empty state hardcoded customer. It now consumes the
   resolved Customer/Client singular term.

Four regression cases cover Service conversion copy, Service status guidance,
Service Client Project-empty copy, and absence of Enrollment query/data in
Service context. The smallest correction touched only the relevant shared
forms/detail composition and tests. No migration or generated-type change was
needed.

## Deferred scope verification

No implementation was introduced for Client Portal, retainers, billing,
invoices, payments, files/SOW/proposals, advanced capacity, freelancer
marketplace, profitability, timesheets, advanced automation, or a full Agency
problem catalog. A source scan of Project implementation and the TG2 migration
scope test found none of these additions.

## Tests / quality

Targeted TG2/cross-target verification:

- primary governed run: `25 test files / 183 tests — all passed`;
- Service onboarding/readiness supplement: `3 test files / 20 tests — all passed`;
- pre-repair aggregate targeted evidence: `28 test files / 203 tests — all passed`;
- post-repair blocker regression run: `5 test files / 33 tests — all passed`.

The targeted scope covered Leads, conversion, Clients, Projects, Tasks,
assignment, Attention, Home, terminology, access/direct routes, RBAC,
organization isolation, onboarding/resolver/readiness, and TG1/TG3/TG4
regressions.

Full Vitest:

`498 test files: 496 passed / 2 failed`

`3554 passed / 2 failed / 3556 total`

The two failures are exactly the accepted historical baseline:

1. `tests/features/invitations/load-member-administration-page.test.ts`;
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`.

`NEW REGRESSIONS = 0`

Quality gates:

- `npm run typecheck` — PASS on isolated rerun. An initial parallel invocation
  overlapped `next build` replacing `.next/types` and was invalidated by
  transient missing generated files; the post-build isolated command passed.
- `npm run lint` — PASS, no ESLint warning or error. The command reports the
  framework's existing `next lint` deprecation notice.
- `npm run build` — PASS. All application routes compiled. One pre-existing
  warning remains: autoprefixer recommends `flex-end` instead of `end` in
  `src/features/social-media/ui/platform-closed-beta-operator-list.module.css`.
  Prior BETA1-FV and SMM evidence records the same warning; it is not new.
- npm also reports the pre-existing unknown `devdir` environment-config
  warning.

## Production non-effects

`PRODUCTION CUSTOMER WRITES = 0`

`PRODUCTION LEAD WRITES = 0`

`PRODUCTION PROJECT WRITES = 0`

`PRODUCTION TASK WRITES = 0`

`PRODUCTION ATTENTION WRITES = 0`

`PRODUCTION DATA WRITES = 0`

`PRODUCTION MIGRATIONS APPLIED = 0`

`DEPLOYMENTS = 0`

`SOCIAL EXECUTION GATES CHANGED = NO`

`CORE REOPENED = NO`

`DATA REOPENED = NO`

All commands were local code inspection, compilation, or deterministic tests.

## Readiness / BQA status

`foundation.service = context_ready`

`CTX BETA_SUPPORTED PROMOTION = NO`

BQA/customer admission was not broadened. TG2-FV does not perform a readiness
promotion.

## Scope compliance

The final phase diff contains the evidence document plus the minimum three
blocker corrections and four regression cases across Lead conversion/status
forms and Client detail composition. There is no new migration, production
action, target-pack change, deferred feature, or unrelated cleanup.

Changed files:

- `src/app/(authenticated)/customers/[customerId]/page.tsx`;
- `src/app/(authenticated)/leads/[leadId]/{convert,status}/page.tsx`;
- `src/features/customers/ui/{customer-detail,customer-projects}.tsx`;
- `src/features/customers/ui/load-customer-detail.ts`;
- `src/features/leads/ui/{lead-convert-form,lead-status-form}.tsx`;
- `tests/ui/{customer-detail-loader,customer-detail-presentation,lead-convert-workflow,lead-status-workflow}.test.*`;
- this evidence document.

## Final verdict

All 36 governed success criteria pass. The only full-suite failures are the
two explicitly accepted historical failures and there are zero new
regressions.

`TG2-FV CLOSED WITH EVIDENCE — AGENCY / BUSINESS SERVICES BETA-1 ACCEPTANCE CONTRACT IS FINAL VERIFIED AT L5`

`TG2 = CLOSED WITH EVIDENCE`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION / FINAL VERIFICATION IN PROGRESS — NOT YET MASTER CLOSED`

`DEFERRED AGENCY SCOPE REMAINS OUTSIDE BETA-1`

## Next required phase

`NEXT REQUIRED PHASE = TG3-FV`

TG3-FV must independently verify Customer → Job → Site → Work Order →
Technician → Dispatch → execution → completion → Attention. It is not started
by this phase.
