# BETA1-4TG-SCOPE-RECONCILIATION — Four-Target-Group Product Scope + True Beta-1 Product Roadmap

| Field | Value |
| --- | --- |
| Phase | **BETA1-4TG-SCOPE-RECONCILIATION — FOUR-TARGET-GROUP PRODUCT SCOPE RECONCILIATION + TRUE BETA-1 PRODUCT ROADMAP** |
| Parent | BETA1-MASTER-FV |
| Document type | Read-only product-scope reconciliation (no implementation) |
| Date | 2026-08-31 |
| Formal status | `BETA1-4TG-SCOPE-RECONCILIATION CLOSED WITH EVIDENCE — FOUR-TARGET-GROUP PRODUCT SCOPE REQUIRES FORMAL FREEZE BEFORE IMPLEMENTATION` |
| Authoritative Core closure | `docs/phases/BETA1-MASTER-FV-frozen-beta1-program-final-closure-verification-evidence.md` |
| Core closure HEAD | `24e17b25ebb8b7e26dd3c5d5edb81d0c7959242f` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `24e17b25ebb8b7e26dd3c5d5edb81d0c7959242f` |
| Implementation / migration / Production writes | **none** |

This phase reconciles the **closed Beta-1 Core** with the owner-level **four-target-group product** mandate. It does **not** reopen Core, invent target-group feature lists, or start implementation.

**FROZEN BETA-1 CORE = 100% CLOSED WITH EVIDENCE**

**BETA-1 CORE REOPENED = NO**

**FOUR-TARGET-GROUP BETA-1 PRODUCT = NOT YET 100% COMPLETE**

**BETA-1 4TG PRODUCT COMPLETION = NOT YET MEASURABLE — TARGET-GROUP ACCEPTANCE CONTRACTS MUST FIRST BE FROZEN**

**NEXT REQUIRED PHASE = BETA1-4TG-SCOPE-FREEZE**

**NEXT PHASE IMPLEMENTATION = NOT STARTED**

---

## 1. Executive verdict

Layer A (Beta-1 Core / platform foundation) remains **100% closed with evidence**. That verdict is not rewritten.

Layer B (four-target-group product) is **not** complete. Repository truth:

| Target group | Frozen product contract | Classification |
| --- | --- | --- |
| TG1 Course Sellers / Coaches | YES — Course Sellers B1-FV | **CLOSED WITH EVIDENCE** |
| TG2 Agencies / Business Services | **NO — CONTRACT NOT FOUND** | **PRODUCT SCOPE FREEZE REQUIRED** |
| TG3 Construction / Installation / Field Service | **NO — CONTRACT NOT FOUND** | **PRODUCT SCOPE FREEZE REQUIRED** |
| TG4 E-commerce / Product / Fulfillment | **NO — CONTRACT NOT FOUND** | **PRODUCT SCOPE FREEZE REQUIRED** |

TAX seeds four Foundations and 22 industries. Only **one** niche (`online-course-business`) and **two** context packs (Knowledge + OCB) exist. CAP has Core/CRM/Knowledge/Social rows only — **no** Service / Field / Product capability rows. AppShell is Course-Seller navigation, not context-gated. No `projects`, `orders`, `products`, `inventory`, or `work_orders` tables exist in product code.

A large Agency problem catalog (e.g. “184 problems”) is **not in this repository**. Treat it as:

`EXTERNAL PRODUCT DECISION NOT REPRESENTED IN REPOSITORY`

It is **not** a frozen implementation contract.

Program outcome: **B — ONE OR MORE TARGET-GROUP PRODUCT CONTRACTS MUST BE FROZEN FIRST.**

---

## 2. Purpose

Determine what reusable Core already exists, what is target-specific vs theoretical, which groups lack a frozen product contract, and the shortest evidence-backed route to:

`ZYNTIXAI BETA-1 FOUR-TARGET-GROUP PRODUCT = 100% CLOSED WITH EVIDENCE`

---

## 3. Governance correction

`BETA1-MASTER-FV` closed the **frozen Core**. It must **not** be read as “all four target-group products are complete.”

This phase adds Layer B without invalidating Layer A.

---

## 4. Repository start state

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `24e17b25ebb8b7e26dd3c5d5edb81d0c7959242f` |
| Subject | `docs(beta1): close frozen beta1 program with evidence` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Divergence | `0 0` |
| Worktree | clean |
| `git diff --check` | PASS |

---

## 5. Closed Beta-1 Core dependency

`BETA1-MASTER-FV CLOSED WITH EVIDENCE — ZYNTIXAI FROZEN BETA-1 PROGRAM FULLY VERIFIED AND CLOSED`

Eleven Core tracks remain closed. This phase does not reimplement them. Later product work must **consume** them.

---

## 6. Two-layer Beta-1 model

| Layer | Meaning | Status |
| --- | --- | --- |
| **A. BETA-1 CORE / PLATFORM FOUNDATION** | Auth, CS operator product, Closed Beta, Social fail-closed, TAX/CAP/CTX, control-plane, org-context, resolver, BQA backend, DATA engine | **CLOSED WITH EVIDENCE** |
| **B. BETA-1 FOUR-TARGET-GROUP PRODUCT** | Usable end-to-end products for four owner-mandated target groups | **TO BE RECONCILED — NOT COMPLETE** |

---

## 7. Owner four-target-group mandate

Authoritative **product-level** count from this phase’s owner mandate (not from a prior in-repo 4TG contract):

1. Course Sellers / Coaches  
2. Agencies / Business Services  
3. Construction / Installation / Field Service  
4. E-commerce / Product / Fulfillment  

`BETA-1 TARGET GROUPS = EXACTLY FOUR`

Exact **feature** scope for TG2–TG4 is **not** frozen in-repo and must be frozen separately.

---

## 8. Shared Core capability inventory

| Capability | Classification | Evidence |
| --- | --- | --- |
| Authentication | SHARED CORE — CLOSED | B1.1 / B1-FV |
| Organizations | SHARED CORE — CLOSED | org RPCs / B1-FV |
| Memberships / roles | SHARED CORE — CLOSED | invitations / members |
| Closed Beta admission | SHARED CORE — CLOSED | BETA1-FV |
| Customers | SHARED CORE — CLOSED (productized as CS CRM) | customers feature + B1-FV |
| Leads | SHARED CORE — CLOSED | leads feature |
| Tasks | SHARED CORE — CLOSED | tasks feature; CAP `core.tasks` |
| Attention / NBA | SHARED CORE — CLOSED | attention/nba; CAP `core.attention` |
| Members admin | SHARED CORE — CLOSED | invitations; CAP `core.member-administration` |
| Programs / Enrollments / Progress | TARGET-SPECIFIC — IMPLEMENTED (Knowledge / CS) | programs/enrollments/progress |
| Social | SHARED CORE — EXISTS BUT NOT TARGET-PRODUCTIZED | SMM-B1-FV; fail-closed; optional in OCB pack |
| DATA import | SHARED CORE — EXISTS BUT NOT TARGET-PRODUCTIZED | DATA-TRACK-FV; Customer adapter; no UI |
| TAX | SHARED CORE — CLOSED | 4 foundations, 22 industries, 1 niche |
| CAP | SHARED CORE — CLOSED (seed incomplete for 4TG) | Core/CRM/Knowledge/Social only |
| CTX | SHARED CORE — CLOSED (seed incomplete for 4TG) | Knowledge + OCB packs only |
| ORG-CONTEXT / resolver / BQA | SHARED CORE — EXISTS BUT NOT TARGET-PRODUCTIZED | Backend verified; no AppShell/onboarding consumer |
| Control-plane reads | SHARED CORE — CLOSED | CONTROL-PLANE-READ-1FV |
| Files/storage | SHARED CORE — EXISTS BUT NOT TARGET-PRODUCTIZED | `data-intake` private + Social media; no generic files product |
| Planning / dispatch | TARGET-SPECIFIC — NOT IMPLEMENTED | no field planner |
| Projects | TARGET-SPECIFIC — NOT IMPLEMENTED | DATA-1A GAP; no feature module |
| Orders / products / inventory | TARGET-SPECIFIC — NOT IMPLEMENTED | DATA-1A GAP; no tables in src |
| Communications (inbox) | POST-BETA / BACKLOG | BETA1-FV residual |
| Workflows/automation | POST-BETA / BACKLOG | no generic engine |
| Dashboards/analytics | POST-BETA / BACKLOG | no analytics product |
| Daily operating | SHARED CORE — CLOSED | home / daily-operating |
| First-run CS onboarding | TARGET-SPECIFIC — IMPLEMENTED (CS) | B1.2–B1.4 |
| ONBOARDING-1A (BQA/DATA/context UX) | OWNED BY ANOTHER TRACK / 4TG CANDIDATE | not started |

---

## 9. Evidence-level model

L0 idea → L1 design → L2 code → L3 automated → L4 Production → L5 target-group product closed.

Do not treat L0/L1 as L5.

---

## 10. Problem-research vs frozen scope

| Layer | Rule |
| --- | --- |
| PROBLEM DISCOVERY | Not automatic Beta-1 features |
| SOLUTION FOUNDATION | TAX/CAP/CTX/BQA/DATA are Core, not TG products |
| FROZEN BETA-1 PRODUCT REQUIREMENT | Exists only for Course Sellers (B1-FV) |
| POST-BETA EXPANSION | Extra niches, payments, inbox, etc. |

“184 Agency problems” ≠ 184 Agency Beta-1 features. **Not found in-repo.**

---

## 11. Course Sellers contract

**YES — CONTRACT FOUND**

`docs/phases/B1-FV-course-sellers-beta-1-final-release-verification-evidence.md`

`COURSE SELLERS BETA 1 RELEASE READY WITH EVIDENCE`

Also composed into BETA1-MASTER-FV as Core track 1. Not reopened.

Coaches: TAX industry `coaching-and-mentoring` exists; **no** Coach niche/pack/product. Owner grouping with Course Sellers does **not** create a second TG1 contract. Residual Coach-as-distinct-niche is a **scope-freeze** question, not a Core reopen.

---

## 12. Course Sellers current product

User-facing: Home, Leads, Customers, Programs, Enrollments, Progress, Attention, Tasks, Members, Social (enrollment-gated), first-run onboarding, checklist. Production verified. Security/roles verified.

Missing as TG1 Beta-1: none that B1-FV required. Post-Beta: richer analytics, payments, LMS student portal (explicitly out of CS Beta 1).

---

## 13. Course Sellers scorecard

| Capability | Beta-1 required? | Level | Shared vs specific | Impl | UX | Prod | Gap | Blocker | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Auth/org/members | yes | L5 | shared | closed | yes | yes | polish | NO | Core |
| Leads/Customers/Tasks | yes | L5 | shared CRM | closed | CS labels | yes | none required | NO | Core |
| Programs/Enrollments/Progress | yes | L5 | Knowledge-specific | closed | yes | yes | historical copy test debt | NO | Core |
| Attention/NBA | yes | L5 | shared | closed | yes | yes | deferred lifecycle | NO | Core |
| Social | parallel | L4 | horizontal | closed OFF | yes | verified OFF | permanent ON deferred | NO | Core |
| DATA UI | no (Core) | L4 engine | shared | engine only | no | yes | ONBOARDING-1A | NO for Core | 4TG freeze |

**TG1 BETA-1 BLOCKER = NO**

---

## 14. Agencies evidence inventory

In-repo:

- TAX industries under `service` (marketing/creative, consulting, IT, HR, finance-legal, business-support, property-real-estate)
- BQA-1B stress: “Agency / construction / ecommerce, no pack” → `missing_context_pack` / `not_yet_supported`
- DATA-1A Service OS = GAP (Client-as-label, Project, recurring)
- Social architecture note: agency multi-brand **later, not first** (`SMM-B1.1` preflight)
- No `src/features/projects`, no Agency UI, no Agency tests, no Agency acceptance contract

**EXTERNAL PRODUCT DECISION NOT REPRESENTED IN REPOSITORY** for any 184-problem catalog.

---

## 15. Agencies problem/solution foundation

TAX Service foundation + industries = **L1 catalog seed**. No Service context pack. No Service capabilities. Problem catalogs = **L0**, not in-repo.

---

## 16. Agencies implementation inventory

Reusable: auth, org, Customers, Leads, Tasks, Attention, Members, DATA engine, Social (OFF), BQA/resolver backends.

Not implemented: Client Portal, Projects, recurring retainers, capacity, freelancer coordination, SOP knowledge product, files versioning, meetings/decisions, service-delivery OS, reporting, approvals engine, Agency navigation/labels.

---

## 17. Agencies scorecard

| Cluster | Beta-1 required? | Level | Shared vs specific | Status | UX | Prod | Gap | Blocker? | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Command Center | unknown | L0 | TBD | not implemented | no | n/a | no contract | freeze | 4TG freeze |
| CRM / Customers | candidate shared | L5 Core | shared | exists as Customer | CS “Customers” | yes | label/Client | freeze | freeze + reuse |
| Projects | unknown | L0 | likely shared later | **not implemented** | no | n/a | domain missing | freeze | freeze |
| Tasks | candidate shared | L5 | shared | exists | generic | yes | productization | freeze | freeze |
| Client Portal | unknown | L0 | specific | not implemented | no | n/a | — | freeze | freeze |
| Planning/capacity | unknown | L0 | mix | not implemented | no | n/a | — | freeze | freeze |
| Social/creative | optional Core | L4 | horizontal | verified OFF | Social UI | verified | enablement deferred | NO as Core | later Social |

---

## 18. Construction evidence inventory

TAX: `construction-and-installation` and other `field-operations` industries. No Field niche. No Field pack. No work-order/location/asset tables. DATA-1A Field OS = GAP. No Bouw/dispatch feature module.

---

## 19. Construction problem/solution foundation

L1 taxonomy only. Conceptual dispatch/scheduling lists = **L0**, not frozen.

---

## 20. Construction implementation inventory

Reusable Core as for Agencies. Not implemented: dispatch, dynamic scheduling, routes, job briefs, site/location, work capture, subcontractors, WIP, field comms.

---

## 21. Construction scorecard

| Cluster | Required? | Level | Shared vs specific | Status | Blocker? |
| --- | --- | --- | --- | --- | --- |
| Lead/request | unknown | L5 if reuse Leads | shared candidate | Leads exist | freeze |
| Job/project | unknown | L0 | possibly shared Projects | missing | freeze |
| Location/site | unknown | L0 | field-specific | missing | freeze |
| Planning/dispatch | unknown | L0 | field-specific | missing | freeze |
| Field execution | unknown | L0 | field-specific | missing | freeze |
| Customers | candidate | L5 | shared | exists | freeze |

---

## 22. E-commerce evidence inventory

TAX: `ecommerce-and-online-retail`, `warehousing-and-fulfillment`, other `product-operations` industries. No Product niche/pack. No products/orders/inventory schema in `src`. DATA-1A Product OS = GAP. BETA1-FV lists fulfillment as **Beta 2 idea**.

---

## 23. E-commerce product foundation

L1 taxonomy. No L2 domain.

---

## 24. E-commerce implementation inventory

Reusable: Customers, Tasks, Attention, DATA engine (Customer only). Missing: products, orders, stock, pick/pack, shipment, tracking, returns, warehouse.

---

## 25. E-commerce scorecard

| Cluster | Required? | Level | Shared vs specific | Status | Blocker? |
| --- | --- | --- | --- | --- | --- |
| Customer | candidate | L5 | shared | exists | freeze |
| Order | unknown | L0 | product-ops specific | missing | freeze |
| Inventory/stock | unknown | L0 | specific | missing | freeze |
| Fulfillment | unknown | L0 | specific | missing | freeze |
| Tracking/returns | unknown | L0 | specific | missing | freeze |

---

## 26. Frozen contract discovery by target

| TG | Contract | Evidence |
| --- | --- | --- |
| TG1 | **YES — CONTRACT FOUND** | B1-FV + Core master FV |
| TG2 | **NO — CONTRACT NOT FOUND** | no Agency product acceptance doc |
| TG3 | **NO — CONTRACT NOT FOUND** | no Field product acceptance doc |
| TG4 | **NO — CONTRACT NOT FOUND** | no E-commerce product acceptance doc |

PARTIAL would understate: there is **no** closure-defining TG2–TG4 product contract at all.

---

## 27. Shared vs target-specific capabilities

| Capability | SHARED IMPLEMENTATION POSSIBLE |
| --- | --- |
| Auth, org, roles, members | YES |
| Customers (party of record) | YES — labels may be target-specific |
| Leads | YES |
| Tasks | YES |
| Attention | YES |
| DATA engine | YES — adapters later |
| Social | YES — horizontal, fail-closed |
| TAX/CAP/CTX/BQA/resolver | YES — configuration, not four apps |
| Programs/Enrollments/Progress | NO as Agency/Field/Ecom primary workflow |
| Projects | YES **if** freeze includes them (Agency + Construction likely) — **do not build twice** |
| Planning/dispatch | NO as copy of CS Progress; Field-specific engine if frozen |
| Orders/inventory | NO — e-commerce-specific if frozen |
| Work orders / locations | NO — field-specific if frozen |
| Client Portal | likely target-specific if frozen |

---

## 28. Context-driven productization

Intended architecture (TAX→CAP→CTX→ORG-CONTEXT→resolver→BQA): **one shared system + context packs + capability relevance + terminology**, not four applications.

**Actual wiring:** resolver has **PRODUCT CONSUMER: 0**. AppShell does not import context-resolver. Navigation is hardcoded CS modules. Capability visibility is not driving primary nav (Social is the exception: enrollment-gated).

Gap: **productization of an already-closed foundation**, not a Core defect.

---

## 29. TAX / CAP / CTX reuse

Reuse for 4TG: assign/create packs for Service / Field / Product, add niches, add capability rows, terminology. **Do not rebuild TAX/CAP/CTX engines.**

Missing for 4TG: niches/packs/capabilities for TG2–TG4. OCB pack remains `context_ready` (customer closed_beta BQA would deny — testers use PATH B). Promotion still deferred for Core; 4TG freeze must decide pack readiness policy **without** silently promoting in this phase.

---

## 30. BQA reuse

BQA backend can classify industries and refuse missing packs (`not_yet_supported`). That is correct fail-closed. 4TG product needs packs + (likely) onboarding to **use** BQA, not a second BQA engine.

---

## 31. DATA reuse

Closed Customer CSV engine is reusable. New adapters (Projects, Orders, etc.) are **later DATA backlog**, not Core reopen, and only after canonical domains exist (DATA-1A). **DATA-1K not created.**

---

## 32. Social reuse

Horizontal Social is reusable across groups. Permanent ON not required by Core. 4TG freeze may keep Social optional.

`SOCIAL EXECUTION GATES CHANGED = NO`

---

## 33. Customers reuse

`customers` + CRM UX is the shared party. Agency “Client” is terminology/productization, not a second CRM.

---

## 34. Tasks / Attention reuse

Generic operational work and NBA exist. Target-specific rules (stale enrollment vs stale job) would be **new Attention rules**, not a second Attention platform.

---

## 35. Projects / workflow analysis

No Projects domain. If freeze requires Agency delivery **and** Construction jobs, **one** shared Projects foundation with context labels — not two systems.

`SHARED DEPENDENCY` candidate: Projects. **Not implemented; not frozen required yet.**

---

## 36. Planning analysis

No shared planning engine. Field dispatch ≠ Social calendar ≠ CS Progress. Freeze must say whether a shared scheduler is in Beta-1 4TG or deferred.

---

## 37. Files / knowledge analysis

No universal files/SOP product. DATA-intake storage is import-private. Social media storage is Social-specific. Freeze before building a fourth files stack.

---

## 38. Orders / inventory analysis

**Not present** (not schema-only in product). E-commerce-specific if frozen. Do not share-fake via Programs.

---

## 39. Onboarding role

Core: ONBOARDING-1A **non-blocking**.

4TG: user-facing context selection / BQA / capability-gated workspace is a **FOUR-TARGET-GROUP PRODUCT REQUIREMENT CANDIDATE**. Without it, TG2–TG4 users would still see CS Programs/Enrollments.

**Not** next: freeze must define *what* onboarding admits. Implementing ONBOARDING-1A now would onboard into undefined products.

---

## 40. Module visibility / gating

Users currently see **CS module set** (Home, Leads, Customers, Programs, Enrollments, Progress, Attention, Tasks, Members) plus Social if enrolled. Not context-filtered. Not capability-driven except Social.

**Productization gap** for 4TG. Do not change navigation here.

---

## 41. Target-specific terminology

CTX stores terminology (Knowledge: Customer/Program/Enrollment/Progress). Resolver can return it. **UI does not consume it** — AppShell hardcodes “Customers”, “Programs”, etc.

Architecture supports labels. Product wiring = gap.

---

## 42. Product UX gaps

| Group | FUNCTIONAL FOUNDATION | PRODUCT UX | TARGET-SPECIFIC UX |
| --- | --- | --- | --- |
| TG1 | complete | complete | CS |
| TG2 | shared CRM/tasks only | CS screens | none |
| TG3 | shared CRM/tasks only | CS screens | none |
| TG4 | shared Customers only | CS screens | none |

---

## 43. E2E workflow analysis

Conceptual (not frozen except TG1):

| TG | Evidence-backed primary workflow |
| --- | --- |
| TG1 | lead/customer → program → enrollment → progress/attention — **proven** |
| TG2 | lead → client → project/service → task → delivery — **conceptual only** |
| TG3 | request → job → location → planning → field → completion — **conceptual only** |
| TG4 | customer/order → stock → pick/pack → ship → track — **conceptual only** |

Do not freeze TG2–TG4 workflows in this phase.

---

## 44. Shared dependency graph

```text
Closed Core (immutable)
    → BETA1-4TG-SCOPE-FREEZE  (required next)
        → shared productization as freeze defines
           (packs/capabilities, gating, terminology wiring,
            optional shared Projects, ONBOARDING-1A)
        → TG2 / TG3 / TG4 vertical slices (order per freeze)
        → per-TG FV
        → BETA1-4TG-MASTER-FV
```

---

## 45. TG1 status

**TG1 = CLOSED WITH EVIDENCE**

Do not reopen because TG2–TG4 are open.

---

## 46. TG2 status

**TG2 = PRODUCT SCOPE FREEZE REQUIRED**

---

## 47. TG3 status

**TG3 = PRODUCT SCOPE FREEZE REQUIRED**

---

## 48. TG4 status

**TG4 = PRODUCT SCOPE FREEZE REQUIRED**

---

## 49. 4TG requirement-accounting feasibility

`TOTAL 4TG PRODUCT REQUIREMENTS = NOT YET FREEZABLE`

No TG2–TG4 acceptance denominators. Counting problems would invent scope.

---

## 50. 4TG completion percentage

`BETA-1 CORE COMPLETION = 100%`

`BETA-1 4TG PRODUCT COMPLETION = NOT YET MEASURABLE — SCOPE FREEZE REQUIRED`

Do not invent a percentage.

---

## 51. Scope-freeze gaps

Must freeze before code:

- MVP E2E for TG2, TG3, TG4 (“what must a real user accomplish?”)
- Coach vs Course Seller identity inside TG1 (reuse CS vs extra niche)
- Shared Projects yes/no
- Field planning in/out
- Orders/inventory in/out
- Pack readiness / BQA customer vs PATH B
- ONBOARDING-1A required yes/no
- Module gating rules
- What is explicitly POST-BETA

---

## 52. Shared implementation gaps (after freeze)

Likely candidates (not authorized yet): Service/Field/Product packs + capabilities; nav gating; terminology wiring; ONBOARDING-1A; possibly Projects.

---

## 53. Target-specific implementation gaps (after freeze)

Only what freeze lists. Do not implement 184 Agency items.

---

## 54. FV gaps

No TG2–TG4 FV possible until scope + implementation exist. TG1 FV already closed.

---

## 55. Deferred / backlog items

Payments, inbox, extra Social networks, DATA-1K, Customer UPDATE, Social permanent ON, CTX promotion, GDPR product, full-suite 100% green, public commercial launch.

BETA-1 CORE BLOCKER = NO. 4TG freeze may still defer them.

---

## 56. Implementation-order analysis

Priority (evidence):

1. Missing **contracts** (blocks all TG2–TG4 work)  
2. Shared productization unlocked by freeze  
3. Closest vertical slice (unknown until freeze — do not assume Agency first)  
4. Smallest testable slice  
5. UX/onboarding after there is something to admit into  

Market size is **not** used as repository evidence.

---

## 57. Proposed next phase

```text
NEXT REQUIRED PHASE = BETA1-4TG-SCOPE-FREEZE
```

No pre-existing freeze document. Smallest repository-consistent name.

---

## 58. Why next

TG2–TG4 have no frozen product acceptance. Implementing now would invent scope. ONBOARDING-1A and SHARED-PROJECTS-FOUNDATION depend on that freeze.

---

## 59. What it unblocks

Measurable 4TG requirements, shared vs specific decisions, a real implementation order, and later ONBOARDING-1A / vertical foundations **if** the freeze includes them.

---

## 60. Exclusions

Freeze phase must **not**: implement features, reopen Core, create DATA-1K, enable Social, promote CTX, mutate Production, copy external problem catalogs wholesale into MVP.

---

## 61. Route to true 4TG Beta-1

```text
CURRENT (Core 100% closed)
→ BETA1-4TG-SCOPE-FREEZE
→ shared productization (as freeze defines)
→ target-specific implementation slices (as freeze defines)
→ target-specific FV
→ BETA1-4TG-MASTER-FV
→ ZYNTIXAI BETA-1 FOUR-TARGET-GROUP PRODUCT = 100% CLOSED WITH EVIDENCE
```

Include ONBOARDING-1A / Projects only if the freeze requires them.

---

## 62. Production non-effects

```text
PRODUCTION MUTATIONS ATTRIBUTABLE TO 4TG RECONCILIATION = 0
CUSTOMER WRITES = 0
DATA WRITES = 0
SOCIAL WRITES = 0
CTX WRITES = 0
MIGRATION APPLIES = 0
DEPLOYMENTS = 0
```

No Production inspection required beyond Core evidence already accepted (catalog gaps are proven in migrations/tests).

---

## 63. DATA non-reopen

`DATA BETA-1 CORE = CLOSED`  
`DATA REOPENED = NO`  
`DATA-1K = NOT CREATED`

---

## 64. Social non-effect

`SOCIAL EXECUTION GATES CHANGED = NO`

---

## 65. Tests

No Agency/Construction/E-commerce targeted suite exists.

DATA: `npx vitest run tests/features/data-intake tests/security/data-intake` — **183 / 183**

Build **not rerun** (docs-only; master FV build remains current). `BUILD = NOT RUN`

---

## 66. Typecheck

`npx tsc --noEmit` — PASS

---

## 67. Lint

`npx next lint` — PASS

---

## 68. Full suite

`npx vitest run`

**3349 passed, 2 failed, 3351 total**

---

## 69. Historical failures

1. `tests/features/invitations/load-member-administration-page.test.ts`  
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Same identities as the Core master baseline. Not repaired.

---

## 70. New regressions

`NEW REGRESSIONS = 0`

---

## 71. Final Git state

Evidence-only commit: `docs(beta1): reconcile four-target-group product scope`

After push: branch `core/platform-readiness-20260707`, divergence `0 0`, clean worktree.

---

## 72. Final verdict

BETA1-4TG-SCOPE-RECONCILIATION CLOSED WITH EVIDENCE — FOUR-TARGET-GROUP PRODUCT SCOPE REQUIRES FORMAL FREEZE BEFORE IMPLEMENTATION

BETA-1 CORE = 100% CLOSED WITH EVIDENCE

FOUR-TARGET-GROUP BETA-1 PRODUCT = NOT YET 100% COMPLETE

NEXT REQUIRED PHASE = BETA1-4TG-SCOPE-FREEZE

NEXT PHASE IMPLEMENTATION = NOT STARTED
