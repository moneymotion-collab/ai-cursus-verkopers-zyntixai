# BETA1-4TG-SCOPE-FREEZE — Four-Target-Group Beta-1 Product Acceptance Contract Freeze

| Field | Value |
| --- | --- |
| Phase | **BETA1-4TG-SCOPE-FREEZE — FORMAL PRODUCT ACCEPTANCE CONTRACT FREEZE** |
| Parent | BETA1-4TG-SCOPE-RECONCILIATION |
| Document type | Formal product-scope freeze (documentation / specification only — no implementation) |
| Date | 2026-09-01 |
| Formal status | `BETA1-4TG-SCOPE-FREEZE CLOSED WITH EVIDENCE — TG2, TG3 AND TG4 BETA-1 PRODUCT ACCEPTANCE CONTRACTS FORMALLY FROZEN` |
| Authoritative Core closure | `docs/phases/BETA1-MASTER-FV-frozen-beta1-program-final-closure-verification-evidence.md` |
| Authoritative 4TG reconciliation | `docs/phases/BETA1-4TG-SCOPE-RECONCILIATION-four-target-group-product-roadmap-evidence.md` |
| TG1 frozen contract | `docs/phases/B1-FV-course-sellers-beta-1-final-release-verification-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `badea7dccf151acaba09df78d28187e81eff53b1` |
| Implementation / migration / Production writes | **none** |

This phase converts owner-level four-target-group product intent into repository-authoritative, measurable Beta-1 acceptance contracts.

It does **not** implement product features, reopen Core, reopen DATA, enable Social, promote CTX, seed packs, apply migrations, or mutate Production.

**BETA-1 CORE = 100% CLOSED WITH EVIDENCE**

**BETA-1 CORE REOPENED = NO**

**FOUR-TARGET-GROUP BETA-1 PRODUCT = SCOPE FROZEN — IMPLEMENTATION NOT YET COMPLETE**

**TG1 = CLOSED WITH EVIDENCE — NOT REOPENED**

**SHARED PROJECTS = YES**

**ONBOARDING-1A IN BETA-1 = YES**

**NEXT REQUIRED PHASE = BETA1-4TG-CONTEXT-PACKS**

---

## 1. Executive verdict

Layer A (Beta-1 Core) remains **100% closed with evidence**. Historical `BETA1-MASTER-FV` is not rewritten as “all four target-group products already exist.”

Layer B (four-target-group product) now has **frozen, testable Beta-1 acceptance contracts** for TG2, TG3, and TG4. Those products are **not implemented**. This freeze makes later implementation accountable to explicit workflows, modules, shared-vs-specific boundaries, gating, terminology, and deferred lists.

Repository investigation confirms the reconciliation baseline still holds at start HEAD `badea7dccf151acaba09df78d28187e81eff53b1`:

- TAX has four Foundations and 22 industries; only niche `online-course-business` exists.
- CAP seeds exactly 13 capabilities (Core / CRM / Knowledge / Social). CAP-1 seed contract **forbids** `service.engagement`, `field.jobs`, and `product.inventory`.
- CTX seeds exactly two packs: `foundation.knowledge` and `niche.online-course-business`, both `context_ready`.
- AppShell is hardcoded Course-Seller navigation. `PROGRAMS_NAV_VISIBLE = true`. Context resolver has **no AppShell consumer**.
- No `projects`, `orders`, `products`, `inventory`, `work_orders`, or `locations` / `sites` tables exist in `src/types/database.generated.ts`.
- No `src/features/projects`, orders, products, inventory, fulfillment, work-orders, locations, or dispatch modules exist.
- BQA already fail-closes Agency / construction / ecommerce with `missing_context_pack` / `not_yet_supported`.
- Existing Course Seller first-run onboarding (`BUSINESS_TYPES`) is Knowledge-niche only and does **not** assign TAX/CTX.
- External “184 Agency problems” catalogs remain **absent from this repository** and are **not** Beta-1 scope.

This phase freezes the smallest professionally useful end-to-end slice per remaining target group, plus the shared architecture those slices require.

---

## 2. Repository state

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `badea7dccf151acaba09df78d28187e81eff53b1` |
| Start subject | `docs(beta1): reconcile four-target-group product scope` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Start worktree | clean |
| `git diff --check` at start | PASS (no local diff) |

Parent phase verdict remains authoritative:

`BETA1-4TG-SCOPE-RECONCILIATION CLOSED WITH EVIDENCE — FOUR-TARGET-GROUP PRODUCT SCOPE REQUIRES FORMAL FREEZE BEFORE IMPLEMENTATION`

`NEXT REQUIRED PHASE = BETA1-4TG-SCOPE-FREEZE` (now executing; implementation still not started)

---

## 3. Investigation evidence

### 3.1 Documents inspected

| Artifact | Use |
| --- | --- |
| `BETA1-4TG-SCOPE-RECONCILIATION-…` | Parent gap analysis; next-phase mandate |
| `BETA1-MASTER-FV-…` | Core 11-track closure; ONBOARDING-1A not a Core blocker |
| `BETA1-MASTER-ROADMAP-PREFLIGHT-…` | Track inventory; deferred UX ownership |
| `B1-FV-course-sellers-…` | TG1 frozen acceptance / L5 closure |
| `DATA-1A-…` | Service / Field / Product OS classified **GAP**; Party/Project/Order/Product/Inventory/Location/Work Order missing |
| `DATA-TRACK-FV-…` | DATA core closed; Customer adapter only; DATA-1K not created |
| `TAX-1B` seed + seed-contract tests | 4 foundations / 22 industries / 1 niche |
| `CAP-1B` seed + seed-contract tests | 13 capabilities; no Service/Field/Product rows |
| `CTX-1B` seed | 2 packs; Knowledge terminology; OCB inherits Knowledge |
| `BQA-1B` contract | Agency/construction/ecommerce → `missing_context_pack` |
| `BQA-1E` / `BQA-1F-FV` | Support/admission fail-closed; no AppShell consumer |
| `CONTEXT-RESOLVER-1FV` | Resolver closed; Product consumer = 0 |
| `BETA1-FV` | Fulfillment listed as Beta 2 idea for the historical CS Closed Beta |
| Course Seller AppShell / onboarding / tasks / attention / home | Current productization truth |

### 3.2 Architecture findings (verified in code)

| Finding | Evidence |
| --- | --- |
| Intended model already exists as engines | TAX → CAP → CTX → ORG-CONTEXT → resolver → BQA → DATA |
| Productization missing | AppShell does not import `@/features/context-resolver` |
| Nav is Course-Seller hardcoded | `src/components/app-shell.tsx`: Home, Leads, Customers, Programs, Enrollments, Progress, Attention, Social, Tasks, Members |
| Knowledge nav always on | `PROGRAMS_NAV_VISIBLE = true` (same pattern for Enrollments/Progress/Attention) |
| System baseline capabilities | Resolver `SYSTEM_BASELINE_CAPABILITY_KEYS` = `core.member-administration`, `core.tasks`, `core.attention` |
| Terminology engine exists, UI unused | CTX `context_terminology` + `resolveTerminology()`; AppShell hardcodes “Customers” / “Programs” |
| CS onboarding is niche-local | `BUSINESS_TYPES` = course_seller / trading_mentor / business_coach / online_coach / membership_owner / other — no TAX/CTX assignment |
| Tasks can link lead / customer / enrollment only | `TaskLinkedContext` has no project / work-order / order kind |
| Attention is enrollment/Social-shaped | Primary rule `enrollment_no_recent_progress`; empty copy mentions enrollments or Social |
| Home is reusable Today shell | `/home` daily-operating brief; composition is CS Attention/tasks today |
| Social remains fail-closed | Enrollment-gated nav; publishing OFF; not a 4TG Beta-1 requirement |

### 3.3 Confirmed presences

Shared Core (closed, reusable, not reopened by this freeze):

Authentication, Organizations, Memberships, Roles, Closed Beta admission, Customers, Leads, Tasks (assignee + lead/customer/enrollment link), Attention / NBA engine, Members / invitations, Daily Operating / Home, DATA Customer import engine (no product UI), TAX engine, CAP engine, CTX engine, BQA backend, Context resolver backend, ORG-CONTEXT assignment backend, Social provider infrastructure in fail-closed state.

TG1 Course Seller product (closed L5): Programs, Enrollments, Progress, CS first-run onboarding/checklist, CS operator UX.

### 3.4 Confirmed absences

| Missing productization | Proof |
| --- | --- |
| Projects module / table | No `projects` in generated Database types; no `src/features/projects` |
| Orders / Products / Inventory / Fulfillment | No matching public tables; DATA-1A Product OS = GAP |
| Work orders / locations / sites / dispatch | No matching public tables; DATA-1A Field OS = GAP |
| Agency / Field / Product UI, routes, tests | No authenticated pages beyond CS + Social + Members |
| Service / Field / Product CAP rows | CAP-1 seed + `capability-registry-seed-contract.test.ts` |
| Service / Field / Product CTX packs | CTX-1 seed expects exactly 2 packs |
| TG2–TG4 niches | TAX-1 seed expects exactly 1 niche (`online-course-business`) |
| AppShell context consumer | No import of context-resolver outside its own feature |
| Client Portal | No portal feature / routes |
| External 184-problem Agency catalog | Not in repository |

### 3.5 Problem-research rule (reaffirmed)

External problem catalogs and prior research lists are **L0**. They may inform later product development. They are **not** imported into this Beta-1 freeze.

`EXTERNAL PRODUCT DECISION NOT REPRESENTED IN REPOSITORY` remains the status of any “184 Agency problems” catalog.

---

## 4. Current 4TG status

| Target group | Frozen product contract | Classification after this freeze |
| --- | --- | --- |
| TG1 Course Sellers / Coaches | YES — `B1-FV` | **CLOSED WITH EVIDENCE — UNCHANGED** |
| TG2 Agencies / Business Services | YES — this document §11 | **SCOPE FROZEN — IMPLEMENTATION NOT STARTED** |
| TG3 Construction / Installation / Field Service | YES — this document §12 | **SCOPE FROZEN — IMPLEMENTATION NOT STARTED** |
| TG4 E-commerce / Product / Fulfillment | YES — this document §13 | **SCOPE FROZEN — IMPLEMENTATION NOT STARTED** |

```text
BETA-1 CORE COMPLETION = 100%
BETA-1 4TG PRODUCT COMPLETION = SCOPE FROZEN — IMPLEMENTATION NOT YET COMPLETE
TG1 REOPENED = NO
```

Coach identity inside TG1: **no second TG1 product**. TAX industry `coaching-and-mentoring` and CS onboarding labels `business_coach` / `online_coach` / `trading_mentor` already sit on the Knowledge / Course Seller path. Beta-1 does **not** create a distinct Coach niche, pack, or acceptance contract.

---

## 5. Shared architecture decision

```text
PRODUCT MODEL = ONE SHARED ZYNTIXAI SYSTEM + TARGET CONTEXT PACKS / CAPABILITIES
NOT = FOUR INDEPENDENT APPLICATIONS
NOT = FOUR DUPLICATED ARCHITECTURES
NOT = FOUR SEPARATE CODEBASES
```

| Layer | Decision |
| --- | --- |
| Shared Core reuse | Consume closed Auth / Org / Members / Customers / Leads / Tasks / Attention / DATA engine / TAX / CAP / CTX / BQA / resolver / fail-closed Social. Do not rebuild. |
| Shared productization required | Context packs for TG2–TG4; new capability rows; AppShell gating; selected terminology wiring; ONBOARDING-1A minimum context selection; **shared Projects** |
| Target-specific required | Only what each frozen E2E needs (see §11–§13) |
| Explicitly not four apps | One AppShell, one CRM party (`customers`), one Tasks engine, one Attention engine, one Home/Today shell |

Home remains the shared operational landing (`/home` daily-operating). Each target composes **target-relevant** Attention and work queues into that shell. Do not build four unrelated dashboards.

Customers remain the shared party of record. “Client” is terminology, not a second CRM.

Tasks remain the shared work item. Later phases may add linked-context kinds (`project`, `work_order`, `order`) without creating a second task platform.

Attention remains the shared exception engine. Later phases add target rules (stale project, overdue work order, unfulfilled order). Do not copy the enrollment-progress rule into other domains.

Social remains horizontal and **fail-closed / optional**. Permanent ON is not required for any TG Beta-1 contract.

DATA remains closed. New adapters (Projects, Orders, etc.) are later backlog **after** canonical domains exist. **DATA-1K is not created** and is not a 4TG Beta-1 requirement.

---

## 6. Shared Projects decision

```text
SHARED PROJECTS = YES
```

### 6.1 Why YES

DATA-1A classifies **Project** as a Service OS gap and **Location / Work Order** as Field OS gaps. Reconciliation already identified Projects as the shared delivery container if both Agency and Construction require a named engagement. Repository evidence now supports that both TG2 and TG3 Beta-1 E2E workflows are incoherent without a delivery object above Tasks:

- Tasks today link only to lead / customer / enrollment. That is insufficient for agency delivery or field jobs.
- Programs / Enrollments / Progress are Knowledge-specific and must **not** be reused as fake projects or jobs.
- Building Agency “engagements” and Construction “jobs” as two domains would duplicate status, ownership, customer binding, and task attachment.

TG1 does **not** require Projects. TG4 is **not** project-centric (orders/products are the operational spine).

### 6.2 Generic meaning

A **Project** is an organization-scoped, named **delivery engagement** that may bind to one Customer, has an owner, a status lifecycle, and optional planned dates. It is the shared container to which Tasks (and, for TG3, Work Orders) attach.

It is **not** a full PSA, construction ERP, Gantt planner, or document workspace.

### 6.3 Target-group use

| Target | Uses shared Projects? | Local name | Role in E2E |
| --- | --- | --- | --- |
| TG1 | NO | — | Knowledge uses Programs / Enrollments |
| TG2 | YES | Project | Service engagement / delivery container |
| TG3 | YES | Job | Field / construction job container |
| TG4 | NO | — | Product / Order / Fulfillment spine |

### 6.4 Shared core fields (contract only — not implemented here)

Required shared productization:

- `organization_id`
- `customer_id` (nullable; typical but not mandatory at create)
- `name`
- `status` — at minimum `planned` / `active` / `on_hold` / `completed` / `cancelled`
- `owner_member_id` (nullable)
- `planned_start` / `planned_end` (nullable dates)
- `summary` / notes (optional short text)
- standard audit / archive / restore posture consistent with existing CRM entities

### 6.5 Outside the shared model

Remain target-specific or deferred:

- Agency retainer / billing / SOW documents / deliverable registry
- Field primary site (TG3 `site_id` is a **target-specific association**, not a shared Project column required for TG2)
- Work orders, dispatch windows, technician routing
- Orders, SKUs, inventory
- Files, time tracking, capacity, client portal

### 6.6 What this freeze does **not** do

No Projects schema, RPC, UI, or migration is created in this phase.

---

## 7. Context pack decision

```text
CONTEXT PACKS REQUIRED FOR 4TG BETA-1 = YES
SEED / MIGRATE IN THIS PHASE = NO
```

### 7.1 Pack identifiers and mapping

| Target | TAX foundation / industry evidence | Required pack key | Pack kind | Status |
| --- | --- | --- | --- | --- |
| TG1 | `knowledge` + niche `online-course-business` | `foundation.knowledge` + `niche.online-course-business` | existing | **DO NOT CHANGE** |
| TG2 | foundation `service` (7 service industries) | `foundation.service` | new foundation pack | **REQUIRED** |
| TG3 | foundation `field-operations` (incl. `construction-and-installation`) | `foundation.field-operations` | new foundation pack | **REQUIRED** |
| TG4 | foundation `product-operations` (incl. `ecommerce-and-online-retail`, `warehousing-and-fulfillment`) | `foundation.product-operations` | new foundation pack | **REQUIRED** |

Beta-1 does **not** require new niches for TG2–TG4. Foundation packs are sufficient for the frozen slices. Later niches (e.g. a specific agency or construction specialty) are post-Beta expansion.

`manufacturing-and-production` remains BQA `architecture_gap` and is **not** a TG4 Beta-1 admission path.

### 7.2 Required capability flags (catalog contract)

Existing reusable (do not rebuild):

| Key | 4TG use |
| --- | --- |
| `core.tasks` | All targets |
| `core.attention` | All targets |
| `core.member-administration` | All targets (role-gated UX) |
| `shared.crm.customers` | All targets |
| `shared.crm.leads` | Required TG1/TG2; recommended TG3; not required TG4 |
| `knowledge.programs` / `enrollments` / `progress` | TG1 only |
| `horizontal.social.*` | Optional / fail-closed; not a TG2–TG4 acceptance blocker |

New capabilities required by frozen E2E (additive later; **not** seeded here):

| Key | Owner | Used by |
| --- | --- | --- |
| `shared.projects` | shared | TG2, TG3 |
| `field.locations` | foundation `field-operations` | TG3 |
| `field.work-orders` | foundation `field-operations` | TG3 |
| `field.dispatch` | foundation `field-operations` | TG3 (lightweight schedule/assignment) |
| `product.products` | foundation `product-operations` | TG4 |
| `product.orders` | foundation `product-operations` | TG4 |
| `product.inventory` | foundation `product-operations` | TG4 |
| `product.fulfillment` | foundation `product-operations` | TG4 |

CAP-1’s current prohibition of `service.engagement` / `field.jobs` / `product.inventory` is a **frozen CAP-1 seed inventory** constraint. It does not forbid a later additive capability migration. This freeze names the keys above so that later seed work does not invent a second vocabulary.

### 7.3 Pack capability relevance (Beta-1)

| Pack | Required relevance | Recommended | Optional |
| --- | --- | --- | --- |
| `foundation.knowledge` (existing) | customers, programs, enrollments, progress | leads | social.* |
| `foundation.service` | customers, leads, `shared.projects` | — | social.* |
| `foundation.field-operations` | customers, `shared.projects`, `field.locations`, `field.work-orders`, `field.dispatch` | leads | social.* |
| `foundation.product-operations` | customers, `product.products`, `product.orders`, `product.inventory`, `product.fulfillment` | — | social.*, leads |

System baseline (`core.tasks`, `core.attention`, `core.member-administration`) remains resolver-baseline for every pack.

### 7.4 Readiness / admission policy

New packs start at CTX readiness **`context_ready`**, matching Knowledge / OCB. This freeze does **not** authorize CTX promotion to `beta_supported` or customer PATH A opening.

Testers continue to use Closed Beta PATH B + governed org-context assignment, as TG1 testers already do.

BQA `missing_context_pack` for service / field-operations / product-operations industries becomes incorrect **only after** the later packs phase seeds those packs. This freeze does not change that outcome.

---

## 8. Navigation / gating decision

```text
CONTEXT-GATED NAVIGATION IN 4TG BETA-1 = YES
UNAVAILABLE MODULES = HIDDEN (NOT MERELY DISABLED)
CONTEXT RESOLUTION FAILURE = FAIL CLOSED
NO RUNTIME IMPLEMENTATION IN THIS PHASE
```

### 8.1 Principle

Users must see only modules they are entitled to **and** that are relevant to the resolved context. Capability relevance is not authorization; route/server authorization remains authoritative. UI hide is presentation. Missing context or failed resolution must not expose target capabilities.

### 8.2 Always-visible shared modules (when org context is valid)

- Home
- Customers (label may be target-specific)
- Tasks
- Attention
- Members (existing role fail-closed visibility; route auth remains authoritative)

### 8.3 Context-gated modules

| Module | Visible when |
| --- | --- |
| Leads | `shared.crm.leads` is required or recommended on the resolved pack |
| Programs / Enrollments / Progress | Knowledge capabilities required (TG1 only) |
| Projects (Jobs) | `shared.projects` required |
| Sites | `field.locations` required |
| Work Orders | `field.work-orders` required |
| Dispatch / schedule surface | `field.dispatch` required |
| Products | `product.products` required |
| Orders | `product.orders` required |
| Inventory | `product.inventory` required |
| Fulfillment | `product.fulfillment` required |
| Social | Existing enrollment + capability gate; remains fail-closed |

### 8.4 Generalizing Course-Seller navigation

Current AppShell treats Knowledge modules as unconditionally visible (`PROGRAMS_NAV_VISIBLE = true`). Beta-1 4TG requires those constants to become **resolver-derived**. TG1 must keep today’s CS module set when Knowledge + OCB context is resolved. Other targets must **not** inherit Programs / Enrollments / Progress as a fallback.

### 8.5 Failure behavior

| Condition | Product behavior |
| --- | --- |
| No membership / no org | Existing org-required states |
| Context resolution fails, no pinned context, catalog integrity error | Fail closed: show Home + system-baseline modules only (Tasks, Attention, Members if role-allowed). Hide Knowledge and all target modules. Target routes deny. Honest error, not an empty CS workspace pretending to be valid. |
| Pack missing / not relevant | Hide module; direct URL deny |
| Social gates off / not enrolled | Hide Social (current behavior) |

Do not show disabled “coming soon” target modules in Beta-1 primary nav.

---

## 9. Terminology decision

```text
TERMINOLOGY MODE = B — NAVIGATION + SELECTED PAGE TERMINOLOGY
FULL DOMAIN-LANGUAGE / TRANSLATION ENGINE = NO
```

CTX already stores term keys and the resolver already merges inherited terminology. Beta-1 requires the **product consumer**, not a new engine.

### 9.1 Required term keys

| Term key | TG1 (existing) | TG2 | TG3 | TG4 |
| --- | --- | --- | --- | --- |
| `customer` | Customer / Customers | Client / Clients | Customer / Customers | Customer / Customers |
| `lead` | Lead / Leads | Lead / Leads | Lead / Leads (if shown) | — (hidden if leads not relevant) |
| `program` | Program / Programs | — | — | — |
| `enrollment` | Enrollment / Enrollments | — | — | — |
| `progress` | Progress | — | — | — |
| `project` | — | Project / Projects | Job / Jobs | — |
| `site` | — | — | Site / Sites | — |
| `work_order` | — | — | Work order / Work orders | — |
| `technician` | — | — | Technician / Technicians (assignee label on field work) | — |
| `product` | — | — | — | Product / Products |
| `order` | — | — | — | Order / Orders |
| `inventory` | — | — | — | Inventory |
| `fulfillment` | — | — | — | Fulfillment |

`task` and `attention` keep English Core labels unless a pack later supplies an override. Beta-1 does not require renaming Tasks.

### 9.2 Surfaces in scope

- Primary nav labels
- Page H1 / empty-state nouns for the frozen modules
- Selected column/card entity labels on those pages
- Home brief section titles that name those entities

Out of scope: full i18n, legal copy engines, email localization, AI rewriting of domain language, or replacing every historical CS string globally when context is Knowledge.

TG1 existing labels remain valid. Do not reopen CS copy as part of this freeze.

“Deliverables” is **not** a TG2 Beta-1 required term. Agency Beta-1 uses Projects + Tasks.

---

## 10. ONBOARDING-1A decision

```text
ONBOARDING-1A IN BETA-1 = YES
ONBOARDING-1A IMPLEMENTATION IN THIS PHASE = NO
ONBOARDING-1A IS NOT A CORE REOPEN
DATA UI IS NOT PART OF ONBOARDING-1A BETA-1
```

### 10.1 Why YES

Without a user-facing context selection step, TG2–TG4 operators cannot obtain a pack. Current `/onboarding` is Course-Seller first-run (B1.2–B1.4) and writes CS business-type enums only. ORG-CONTEXT / BQA backends can assign context but have **no product consumer**. If AppShell becomes context-gated and no pack is selected, fail-closed baseline would hide the very products this freeze defines.

Core already decided `ONBOARDING-1A REQUIRED FOR MASTER BETA-1 CLOSURE = NO`. That remains true. This freeze promotes ONBOARDING-1A to a **4TG product requirement**, not a Core defect.

### 10.2 Minimum frozen behavior

```text
User enters organization
→ chooses operating model / business type from the four target foundations
→ applicable context pack is selected / assigned through existing ORG-CONTEXT authority
→ later navigation and terminology resolve from that context
```

Allowed operating-model choices (product labels, mapped to TAX foundations / packs):

1. Course Sellers / Coaches → existing Knowledge + OCB path (do not break TG1)
2. Agencies / Business Services → `foundation.service`
3. Construction / Installation / Field Service → `foundation.field-operations`
4. E-commerce / Product / Fulfillment → `foundation.product-operations`

### 10.3 Explicitly not in ONBOARDING-1A Beta-1

- DATA import / mapping / approval UI
- Full BQA questionnaire as the only admission path
- Multi-activity personalization engine
- Automatic CTX `beta_supported` promotion
- Replacement or material rescope of closed TG1 first-run onboarding
- Coach-as-separate-product onboarding

PATH B Closed Beta admission remains the workspace gate. ONBOARDING-1A configures **which product context** an already-admitted organization operates.

---

## 11. TG2 frozen acceptance contract — Agencies / Business Services

### Target

| Field | Value |
| --- | --- |
| Name | Agencies / Business Services |
| Taxonomy | Foundation `service` |
| Representative industries (catalog only) | `marketing-creative-and-media-services`, `consulting-and-advisory`, `technology-and-it-services`, `recruitment-hr-and-talent-services`, `finance-legal-and-administrative-services`, `business-support-and-outsourcing`, `property-and-real-estate-services` |
| Context pack | `foundation.service` |
| Current classification | `SCOPE FROZEN — IMPLEMENTATION NOT STARTED` |

### Beta-1 operator objective

An agency / professional-services operator can take a commercial lead, convert it to a client, open a delivery project, assign work, see delivery status, and clear exceptions — without Programs / Enrollments and without a client portal.

### Required workflow

```text
Lead
→ Customer (shown as Client)
→ Project (service engagement)
→ Tasks + owner assignment
→ Project delivery status
→ Attention / exceptions
→ Completion visibility (completed project remains findable; open tasks/exceptions visible)
```

Recurring-work **visibility** means: completed and active projects remain listable; open Tasks on a client remain visible. It does **not** mean a retainer / recurring-billing engine.

### Required capabilities / modules

- Auth / org / members (Core)
- Leads
- Customers (Client terminology)
- Shared Projects
- Tasks (linkable to lead, customer, and project)
- Attention (project/delivery exception rules)
- Home / Today (agency operational composition)
- Context pack `foundation.service` + gating + terminology
- ONBOARDING-1A context selection

### Existing reusable Core

Customers, Leads, Tasks (assignee already exists), Attention engine, Members, Home shell, resolver/BQA/TAX/CAP/CTX engines, fail-closed Social.

### Shared implementation required

- `foundation.service` pack + `shared.projects` capability
- AppShell gating / terminology consumer
- Shared Projects domain + professional list/detail/status UX
- Task linked-context kind `project`
- Attention rules for stale/blocked/unassigned projects or overdue project tasks
- ONBOARDING-1A operating-model choice

### Target-specific implementation required

- Agency operational landing composition (Today: clients needing action, active projects, overdue tasks, exceptions)
- Client / Project terminology
- Empty states and status hierarchy for service delivery

No Agency-only schema beyond terminology and landing composition is required if shared Projects exists.

### Required UX

Desktop-first professional operator UX, not a raw CRUD dump:

- Agency-relevant Today / Home
- Clients and Projects tables/cards with status, owner, next date
- Project detail showing client, status, owners, related tasks, exceptions
- Honest empty / error / fail-closed states
- Consistent gated navigation and Client/Project labels

### Required gating / context behavior

Visible when `foundation.service` is resolved: Home, Leads, Clients, Projects, Tasks, Attention, Members (role-gated). Knowledge modules hidden. Social hidden unless separately enrolled.

### Required terminology

Client(s), Project(s); Leads/Tasks/Attention retain Core labels.

### Explicitly deferred

Client portal; retainers / recurring billing; SOW/files versioning; capacity / utilization; freelancer marketplace; approvals engine; meetings/decisions log; multi-brand Social as first-class Agency product; the external 184-problem catalog; advanced reporting; payments.

### Acceptance criteria

1. Operator can create a Lead and convert it to a Customer/Client.
2. Operator can create a Project linked to that Client, with owner and status.
3. Operator can create and assign Tasks on that Project.
4. Operator can move the Project through planned → active → completed (and on_hold / cancelled).
5. Home and Attention surface at least one project/delivery exception class (e.g. active project with overdue task, or project with no owner).
6. Programs / Enrollments / Progress are not in Agency primary nav and are denied if opened.
7. Labels show Client / Project on nav and the corresponding list/detail headings.
8. Fail-closed: missing service context does not show Agency modules.
9. Security: tenant isolation and Owner/Admin/Staff/Viewer contracts consistent with existing CRM/Tasks.
10. UX: empty, populated, error, and forbidden states are honest; desktop operational layout is coherent.

### Evidence level required for closure

**L5** — same class as TG1 `B1-FV`: implementation + automated tests + Production verification + role/tenant security + professional operator UX. This freeze document is **L1** only.

---

## 12. TG3 frozen acceptance contract — Construction / Installation / Field Service

### Target

| Field | Value |
| --- | --- |
| Name | Construction / Installation / Field Service |
| Taxonomy | Foundation `field-operations` |
| Representative industries | `construction-and-installation`, `property-and-facility-services`, `cleaning-and-hygiene-services`, `landscaping-and-outdoor-services`, `technical-maintenance-and-repair`, `security-safety-and-inspection-services` |
| Context pack | `foundation.field-operations` |
| Current classification | `SCOPE FROZEN — IMPLEMENTATION NOT STARTED` |

### Beta-1 operator objective

A field / construction operator can take a customer job, attach a site, plan work orders, assign a technician and date, record execution status through completion, and see exceptions — without a routing optimizer or full field-service suite.

### Required workflow

```text
Customer
→ Job (shared Project, labeled Job)
→ Site / location
→ Work order / planned work
→ Assignment (technician)
→ Schedule / dispatch (planned date + assignee — lightweight)
→ Field execution status
→ Completion
→ Attention / exception handling
```

Leads are **recommended** (incoming job request) but **not required** for TG3 acceptance. The frozen E2E may start from an existing Customer.

### Required capabilities / modules

- Auth / org / members
- Customers
- Shared Projects (Job)
- `field.locations` (Site)
- `field.work-orders`
- `field.dispatch` (lightweight: planned date + assignee on the work order; no routing engine)
- Tasks (optional supporting work; work orders are the field execution object)
- Attention (overdue / unassigned / stuck job or work-order rules)
- Home / Today field composition
- Context pack + gating + terminology
- ONBOARDING-1A context selection

### Existing reusable Core

Customers, Tasks, Attention engine, Members, Home shell, assignment-to-member already exists on Tasks, engines listed in §5.

### Shared implementation required

- `foundation.field-operations` pack + field capabilities + `shared.projects`
- AppShell gating / terminology
- Shared Projects (Job label)
- Task may link to project; work orders are the field-specific execution record
- ONBOARDING-1A
- Attention rule extension points

### Target-specific implementation required

- Sites: name, address/text location, optional notes, link to Job
- Work orders: parent Job, optional Site, status (`planned` / `assigned` / `in_progress` / `blocked` / `completed` / `cancelled`), assignee, planned date/window, short description
- Lightweight dispatch surface: operational queue of work orders by date / unassigned / blocked (not maps, routes, or optimization)
- Field Home composition (today’s jobs, unassigned work, blocked work, exceptions)
- Technician terminology on field assignment

### Required UX

Desktop-first operations console:

- Jobs and Work Orders with clear status hierarchy
- Site visible on job/work-order detail
- Dispatch/today queue with empty and blocked states
- Fail-closed and forbidden states
- Consistent Job / Site / Work order labels

Mobile-responsive readability is required for status/queue views; a native field app is **deferred**.

### Required gating / context behavior

Visible: Home, Customers, Jobs, Sites, Work Orders, Dispatch/schedule, Tasks, Attention, Members (role-gated). Leads visible only if pack marks leads recommended **and** the later implementation includes the leads nav (allowed, not required for FV). Knowledge and Product modules hidden.

### Required terminology

Job(s), Site(s), Work order(s), Technician(s); Customer(s) retained.

### Explicitly deferred

Dynamic routing / optimization; GPS / map dispatch; parts/assets inventory; subcontractors; WIP accounting; job costing; time-and-attendance; photo/work-capture vault; customer field portal; previously researched full Field Service problem catalogs; enterprise workforce optimization.

### Acceptance criteria

1. Operator can create a Customer and a Job linked to that customer.
2. Operator can create a Site and associate it to the Job.
3. Operator can create a Work Order on the Job (optionally on the Site) with planned date and technician assignee.
4. Operator can move the Work Order planned → assigned/in_progress → completed (and blocked / cancelled).
5. Dispatch/today queue shows dated, unassigned, and blocked work honestly.
6. Attention surfaces at least one field exception class (e.g. overdue work order, unassigned planned work, blocked job).
7. Knowledge and Product modules are hidden/denied.
8. Labels show Job / Site / Work order on nav and corresponding headings.
9. Fail-closed without field context.
10. Tenant/role security consistent with Core CRM/Tasks.
11. UX: empty/populated/error/forbidden states honest; desktop operational layout coherent.

### Evidence level required for closure

**L5** — same class as TG1 `B1-FV`. This freeze is **L1** only.

---

## 13. TG4 frozen acceptance contract — E-commerce / Product / Fulfillment

### Target

| Field | Value |
| --- | --- |
| Name | E-commerce / Product / Fulfillment |
| Taxonomy | Foundation `product-operations` |
| Representative industries | `ecommerce-and-online-retail`, `brands-and-consumer-products`, `retail-and-omnichannel`, `wholesale-and-distribution`, `warehousing-and-fulfillment` |
| Explicitly excluded industry | `manufacturing-and-production` (BQA `architecture_gap`) |
| Context pack | `foundation.product-operations` |
| Current classification | `SCOPE FROZEN — IMPLEMENTATION NOT STARTED` |

### Beta-1 operator objective

A product / fulfillment operator can define products, take an order, see inventory impact, move fulfillment status to completion, and handle exceptions — without a storefront, payments, or warehouse-management system.

### Required workflow

```text
Product
→ Order (customer + lines)
→ Inventory impact
→ Fulfillment status (operational queue)
→ Completion visibility
→ Attention / exception handling
```

Shipment **visibility** is a fulfillment status (e.g. `shipped` / `completed`) plus optional tracking-text field. It is **not** a carrier integration.

### Required capabilities / modules

- Auth / org / members
- Customers (order party)
- `product.products`
- `product.orders`
- `product.inventory` (on-hand quantity + order impact)
- `product.fulfillment` (status machine + queue)
- Attention (unfulfillable / blocked / stuck order rules)
- Home / Today fulfillment composition
- Context pack + gating + terminology
- ONBOARDING-1A context selection

Leads are **not required**. Projects are **not used**.

### Existing reusable Core

Customers, Tasks (supporting only; not the order spine), Attention engine, Members, Home shell, engines in §5. DATA Customer import may later load customers; it does **not** import products/orders in Beta-1.

### Shared implementation required

- `foundation.product-operations` pack + product capabilities
- AppShell gating / terminology
- ONBOARDING-1A
- Attention extension points
- Shared Customer as order party

Do **not** share-fake Products via Programs or Orders via Enrollments.

### Target-specific implementation required

- Product: name, SKU/code, active/archived, on-hand quantity
- Order: customer, lines (product + qty), status (`draft` / `confirmed` / `picking` / `packed` / `shipped` / `completed` / `cancelled`)
- Inventory impact: confirming an order decrements or reserves on-hand; cancellation/completion rules remain consistent and auditable; insufficient stock blocks confirm or raises Attention (fail closed, no silent negative stock)
- Fulfillment queue: filterable list by status; operator advances status
- Optional tracking-text on shipped/completed orders
- Product Home composition (open orders, blocked stock, exceptions)

### Required UX

Desktop-first operations console:

- Products and Orders tables with stock/status
- Order detail with lines, inventory impact, fulfillment status
- Fulfillment queue (not a spreadsheet dump)
- Honest empty / insufficient-stock / error / fail-closed states
- Product / Order / Inventory / Fulfillment labels

### Required gating / context behavior

Visible: Home, Customers, Products, Orders, Inventory, Fulfillment, Tasks, Attention, Members (role-gated). Knowledge, Projects, Field modules hidden. Leads hidden unless later pack marks them recommended (not required).

### Required terminology

Product(s), Order(s), Inventory, Fulfillment; Customer(s) retained.

### Explicitly deferred

Public storefront; payments / checkout; marketplace integrations; deep carrier / shipping APIs; advanced WMS (bins, waves, multi-warehouse); returns automation; purchasing / suppliers; manufacturing; BETA1-FV historical “fulfillment as Beta 2 idea” is **superseded for this 4TG Layer B slice** only — it does not reopen Core or the historical CS Closed Beta contract.

### Acceptance criteria

1. Operator can create an active Product with SKU and on-hand quantity.
2. Operator can create an Order for a Customer with at least one line.
3. Confirming the Order applies inventory impact; insufficient stock cannot silently confirm.
4. Operator can move fulfillment picking → packed → shipped/completed (and cancelled).
5. Fulfillment queue shows open vs blocked vs completed work.
6. Attention surfaces at least one commerce exception class (e.g. confirmed order that cannot fulfill, or stuck-in-picking).
7. Knowledge / Projects / Field modules hidden/denied.
8. Labels show Product / Order / Inventory / Fulfillment on nav and corresponding headings.
9. Fail-closed without product-operations context.
10. Tenant/role security consistent with Core.
11. UX: empty/populated/error/forbidden/insufficient-stock states honest; desktop operational layout coherent.

### Evidence level required for closure

**L5** — same class as TG1 `B1-FV`. This freeze is **L1** only.

---

## 14. Deferred / post-Beta contract

Unless a later **formal freeze amendment** supersedes this list, the following remain outside 4TG Beta-1:

- Payments / checkout / invoicing / full accounting / advanced billing
- Universal inbox / communications product
- Social permanently enabled; extra networks; agency multi-brand Social as a required product
- DATA-1K and any new DATA adapters before canonical domains exist
- DATA product UI (not part of ONBOARDING-1A Beta-1)
- Advanced AI automation layers
- Broad extra niches / specializations beyond the four foundation packs
- Marketplace ecosystems
- Enterprise workforce optimization; dynamic routing; native field app
- Advanced warehouse management; returns automation; deep third-party integrations
- Client portal
- Public commercial PATH A / CTX `beta_supported` promotion
- Coach-as-distinct-product (separate from TG1)
- Manufacturing (`architecture_gap`)
- Entire external Agency / Field problem catalogs
- Features not required by the frozen E2E workflows in §11–§13

```text
PAYMENTS = POST-BETA
UNIVERSAL INBOX = POST-BETA
SOCIAL PERMANENT ON = POST-BETA
DATA-1K = NOT IN 4TG BETA-1
CTX PRODUCTION PROMOTION = NOT AUTHORIZED BY THIS FREEZE
```

---

## 15. Implementation dependency order

Do **not** implement in this phase. Each future phase must be independently evidence-verifiable.

```text
1. BETA1-4TG-CONTEXT-PACKS
     Additive CAP rows + CTX foundation packs (service / field-operations /
     product-operations) + terminology + capability mappings.
     Readiness = context_ready. No AppShell behavior change required.
     No Projects / Orders / Field domains.

2. BETA1-4TG-APPSHELL-GATING
     Wire AppShell + route deny to resolver relevance.
     Hide unavailable modules. Fail closed on resolution failure.
     TG1 module set must remain available under Knowledge/OCB context.

3. BETA1-4TG-TERMINOLOGY
     Consume CTX terminology for nav + selected page headings/empty states.
     No generic translation engine.

4. ONBOARDING-1A
     Minimum operating-model → pack assignment.
     Do not include DATA UI. Do not reopen TG1 first-run as a new product.

5. SHARED-PROJECTS-FOUNDATION
     Shared Project domain + professional core UX + task link kind `project`.
     No Agency-only or Field-only extras beyond shared fields.

6. TG2-AGENCY-SLICE
     Service landing, Client terminology already wired, project Attention rules,
     Agency acceptance workflow.

7. TG3-FIELD-SLICE
     Sites, work orders, lightweight dispatch, Job terminology, field Attention,
     Field acceptance workflow. Depends on shared Projects.

8. TG4-PRODUCT-SLICE
     Products, orders, inventory impact, fulfillment queue, commerce Attention.
     Does not depend on Projects. Sequenced after TG3 for evidence isolation;
     must not start before packs + gating + terminology + ONBOARDING-1A.

9. TG2-FV / TG3-FV / TG4-FV
     Independent L5 closures. TG1-FV remains closed and is not rerun as a
     reopen.

10. BETA1-4TG-MASTER-FV
     Compose TG1 (already closed) + TG2/TG3/TG4 FVs into:
     ZYNTIXAI BETA-1 FOUR-TARGET-GROUP PRODUCT = 100% CLOSED WITH EVIDENCE
```

Phases 2–3 may be combined later **only** if a dedicated preflight proves a single evidence bundle remains independently verifiable. Default is separate.

TG4 must not leapfrog packs/gating/onboarding. It may be implemented without Projects.

```text
NEXT REQUIRED PHASE = BETA1-4TG-CONTEXT-PACKS
NEXT PHASE IMPLEMENTATION = NOT STARTED
```

### Why that phase is next

BQA already classifies Agency / construction / ecommerce industries and then fail-closes on `missing_context_pack`. The resolver cannot emit TG2–TG4 capabilities or terminology without packs. AppShell gating has nothing lawful to resolve. Seeding packs is the smallest shared productization step and does not invent Projects/Orders/Work Orders.

### What it unlocks

Published foundation packs, capability rows, and term keys so gating, terminology, ONBOARDING-1A, and vertical slices can consume a real catalog.

### What it may modify

Additive CAP/CTX catalog seed, seed-contract tests, and documentation. Catalog readiness rows at `context_ready` only.

### What it must not modify

- Course Seller runtime product / TG1 contract
- AppShell behavior (owned by the gating phase)
- Projects / Orders / Products / Inventory / Work orders implementation
- Social execution gates
- DATA core / DATA-1K
- CTX promotion to `beta_supported`
- Customer PATH A
- Production customer / DATA business writes
- Core track closures

---

## 16. Verification requirements

Later implementation phases must prove their own slice. This freeze’s verification is documentary + non-mutating repository checks.

| Gate | This phase | Result |
| --- | --- | --- |
| Feature implementation | None allowed | PASS — docs only (`docs/phases/BETA1-4TG-SCOPE-FREEZE-…`) |
| Migrations / db push / reset | None allowed | PASS — none run |
| Production writes | None allowed | PASS — none run |
| `npx tsc --noEmit` / `npm run typecheck` | Required | **PASS** |
| `npx next lint` / `npm run lint` | Required | **PASS** — no ESLint warnings or errors |
| `npm run build` | Not required (docs-only; cannot change runtime) | **NOT RUN** |
| Full Vitest suite | Not required to re-prove Core; no `src/` / test / migration mutation | **NOT RUN** |
| Historical failures | Must not be counted as new if unchanged | Unchanged; not re-executed |

Historical accepted full-suite failures (unchanged; not repaired here):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Accepted Core / reconciliation baseline if a later phase re-runs the full suite: **3349 passed / 2 failed / 3351 total**. This phase introduced **no runtime change**, so `NEW REGRESSIONS = 0` by construction.

Evidence level of **this document**: **L1 frozen contract**. It is not L5 product closure.

---

## 17. Production non-effects

This phase creates documentation only.

```text
PRODUCTION MUTATIONS ATTRIBUTABLE TO BETA1-4TG-SCOPE-FREEZE = 0
CUSTOMER WRITES = 0
DATA WRITES = 0
PRODUCTION MIGRATIONS = 0
DEPLOYMENTS = 0
SOCIAL EXECUTION GATES CHANGED = NO
CTX PRODUCTION PROMOTION = NO
DATA REOPENED = NO
CORE REOPENED = NO
```

No Production inspection was required: no runtime, catalog, or tenant mutation path exists in this change set.

---

## 18. Next required phase

```text
NEXT REQUIRED PHASE = BETA1-4TG-CONTEXT-PACKS
```

See §15 for why, unlocks, allowed modifications, and exclusions.

```text
NEXT PHASE IMPLEMENTATION = NOT STARTED
```

---

## 19. Formal closure statement

Investigation of the authoritative repository at `badea7dccf151acaba09df78d28187e81eff53b1` confirms TG1 remains closed, TG2–TG4 lacked measurable acceptance contracts, and the shared engines exist without target productization.

This phase freezes those contracts without implementing them.

```text
BETA1-4TG-SCOPE-FREEZE CLOSED WITH EVIDENCE — TG2, TG3 AND TG4 BETA-1 PRODUCT ACCEPTANCE CONTRACTS FORMALLY FROZEN

BETA-1 CORE = 100% CLOSED WITH EVIDENCE

FOUR-TARGET-GROUP BETA-1 PRODUCT = SCOPE FROZEN — IMPLEMENTATION NOT YET COMPLETE

SHARED PROJECTS = YES
ONBOARDING-1A IN BETA-1 = YES
CONTEXT-GATED NAVIGATION = YES
TERMINOLOGY MODE = B
TG1 REOPENED = NO
DATA REOPENED = NO
SOCIAL EXECUTION GATES CHANGED = NO
PRODUCTION MUTATIONS = 0

NEXT REQUIRED PHASE = BETA1-4TG-CONTEXT-PACKS
```

The four-target-group **product** is not complete. Later phases must implement and L5-verify TG2, TG3, and TG4 against this freeze. Inventing requirements outside §11–§14 is a scope violation.
