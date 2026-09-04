# BETA1-4TG-TERMINOLOGY — Target-Aware Navigation and Shared-Page Language Wiring

| Field | Value |
| --- | --- |
| Phase | **BETA1-4TG-TERMINOLOGY — TARGET-AWARE NAVIGATION & SHARED-PAGE LANGUAGE WIRING** |
| Parent | BETA1-4TG-APPSHELL-GATING |
| Document type | Shared productization / terminology-wiring evidence |
| Date | 2026-09-04 |
| Formal status | `BETA1-4TG-TERMINOLOGY CLOSED WITH EVIDENCE — TARGET-AWARE NAVIGATION AND SELECTED SHARED-PAGE TERMINOLOGY ARE RESOLVED FROM CTX WITHOUT CHANGING ACCESS CONTROL` |
| Scope freeze authority | `docs/phases/BETA1-4TG-SCOPE-FREEZE-four-target-group-product-acceptance-contract-evidence.md` |
| Context packs authority | `docs/phases/BETA1-4TG-CONTEXT-PACKS-additive-cap-ctx-productization-evidence.md` |
| AppShell gating authority | `docs/phases/BETA1-4TG-APPSHELL-GATING-context-driven-navigation-and-route-access-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `0f9eda15f24eae6b8e66cba0326e572bb0bc55cc` |
| Production mutations | **none** |

This phase wires the already-seeded CTX target terminology (`customer` term key) into the existing context-aware AppShell nav and the Customers shared page, through one small sanitized `ProductTerminology` projection. No new database migration. No access/security change. Terminology Mode B ("navigation + selected page terminology") only.

**BETA-1 CORE = 100% CLOSED WITH EVIDENCE**

**FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE**

**DISPLAY TERMINOLOGY ≠ DOMAIN MODEL**

**TERM EXISTS ≠ MODULE IMPLEMENTED**

**TERMINOLOGY MUST NOT GRANT ACCESS**

**NEXT REQUIRED PHASE = ONBOARDING-1A**

---

## 1. Executive verdict

`BETA1-4TG-TERMINOLOGY CLOSED WITH EVIDENCE — TARGET-AWARE NAVIGATION AND SELECTED SHARED-PAGE TERMINOLOGY ARE RESOLVED FROM CTX WITHOUT CHANGING ACCESS CONTROL`

The AppShell "Customers" nav label and the Customers shared page (list, filters, detail) now render the seeded CTX `customer` term for the resolved organization context: `Client`/`Clients` for Service, `Customer`/`Customers` for Knowledge (TG1, unchanged), Field, and Product. Unresolved context renders the generic system default, never a Course-Seller-specific fallback, and only where the underlying module is already lawfully visible. Module visibility, route enforcement, and RBAC are provably unchanged.

---

## 2. Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `0f9eda15f24eae6b8e66cba0326e572bb0bc55cc` |
| Final HEAD | *(recorded after push — see §16)* |
| Implementation commit | `feat(beta1): wire target-aware terminology` |
| Evidence commit | this document, same commit as implementation unless a follow-up HEAD-alignment commit is required |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | `0 0` (verified after push, §16) |
| Worktree | clean before and after |

---

## 3. Investigation

### 3.1 CTX terminology schema and resolver output

- `public.context_terminology(version_id, locale, term_key, singular_label, plural_label, short_label, help_text)` — seeded in `supabase/migrations/20260901100010_seed_context_pack_registry_4tg_ctx2.sql` (16 rows total, additive to CTX-1's 4 Knowledge rows).
- Resolver domain type `EffectiveTerminology` (`src/features/context-resolver/domain/types.ts`) and `resolveTerminology()` (`src/features/context-resolver/domain/terminology-resolution.ts`) already merge inherited pack terminology into `EffectiveContext.terminology: readonly EffectiveTerminology[]` — no resolver changes were required.
- Confirmed seeded term keys/labels (matches `tests/security/beta1-4tg-context-packs-seed-contract.test.ts`):

  | Foundation | `customer` term | Other seeded terms (not wired — no implemented module) |
  | --- | --- | --- |
  | Knowledge (CTX-1) | Customer / Customers | program, enrollment, progress |
  | Service | **Client / Clients** | project |
  | Field-operations | Customer / Customers | project (Job), site, work_order, technician |
  | Product-operations | Customer / Customers | product, order, inventory, fulfillment |

  No `lead` term key exists in any seed — confirming the freeze instruction "only change label if the terminology catalog explicitly defines a lawful target variant; otherwise preserve Leads" resolves to **no change** for Leads.

### 3.2 Existing terminology-related utilities

None existed. `src/features/product-access/` (module registry, module access, loader, route enforcement) had no terminology concept — it only produced `navVisibility` and `relevantCapabilities`.

### 3.3 AppShell props / product-access shell prop derivation

- `AppShellProps.moduleNavVisibility` was the only context-derived prop; nav labels for Customers/Programs/etc. were hardcoded JSX text.
- `src/features/product-access/ui/product-shell-props.ts` exported `moduleNavVisibilityForAccess()` (unused elsewhere in the app; pages read `result.moduleAccess.navVisibility` directly).

### 3.4 Module registry / implemented shared pages inspected

`src/features/product-access/domain/module-registry.ts` confirms exactly nine implemented modules (`home, leads, customers, programs, enrollments, progress, attention, tasks, members`) — no `projects`, `products`, `orders`, `work-orders` entries. Customers page/list/detail/create (`src/app/(authenticated)/customers/**`, `src/features/customers/ui/**`), Leads page, Tasks page, Attention page, Home, and Members were inspected for literal "Customer" nouns. Only the Customers surfaces contain the entity noun directly; Leads/Tasks/Attention/Home/Members do not reference "Customer" as a page-level noun requiring wiring (Members is generic org-membership administration, not a Field technician roster — confirmed by inspecting `src/app/(authenticated)/settings/members/page.tsx` and `src/features/invitations/domain/members-navigation.ts`).

### 3.5 Existing tests for copy/navigation/gating

`tests/ui/programs-navigation.test.tsx`, `tests/ui/customer-list-presentation.test.tsx`, `tests/ui/customer-detail-presentation.test.tsx`, `tests/features/product-access/beta1-4tg-appshell-gating.test.ts`, and `tests/features/product-access/module-access-fixtures.ts` were the load-bearing surfaces requiring additive (not destructive) changes.

---

## 4. Before state

Target terminology existed in CTX (seeded, resolvable) but had **zero product consumers**. AppShell always rendered the literal string `"Customers"`; the Customers page, list table, filters, and detail view all hardcoded the word "Customer" in headings, table headers, breadcrumbs, and labels — for every target group, including Service (where the frozen contract requires `Client`/`Clients`).

---

## 5. Implemented terminology architecture

### 5.1 Terminology projection (new)

`src/features/product-access/domain/terminology.ts`:

- `ProductTerminology` — the smallest reusable view model: `{ customer: { singular, plural } }`. Only the `customer` term key is represented because it is the only seeded term key that maps onto an **implemented** shared module (Customers). `project`/`site`/`work_order`/`technician`/`product`/`order`/`inventory`/`fulfillment` remain seeded and unconsumed — no fields were added for them (`TERM EXISTS ≠ MODULE IMPLEMENTED`).
- `DEFAULT_PRODUCT_TERMINOLOGY` — generic system default (`Customer`/`Customers`). This is Core shared language, identical to Knowledge/TG1 wording — not a Course-Seller-specific fallback — used only when context is unresolved or a term key is absent.
- `projectProductTerminology(terms: readonly EffectiveTerminology[] | null): ProductTerminology` — pure function, reads only `termKey`/`singularLabel`/`pluralLabel` off resolver output. No raw resolver internals are threaded into UI.

### 5.2 Server/client boundary

`ProductModuleAccessState` (`src/features/product-access/domain/types.ts`) gained one additive field, `terminology: ProductTerminology`, on both the `resolved` and `unresolved` variants. `loadProductModuleAccess()` (`src/features/product-access/server/load-product-module-access.ts`) — the single server-side integration point already used for nav visibility — now also calls `projectProductTerminology(resolved.value.terminology)` and threads the sanitized result through `buildResolvedProductModuleAccess()` / `buildUnresolvedProductModuleAccess()` (`src/features/product-access/domain/module-access.ts`). One resolver call per page load, as before; terminology piggybacks on the existing `ProductModuleAccessState` object already passed from server loaders into `<AppShell>`.

### 5.3 Access logic is untouched

`buildModuleNavVisibility()`, `canAccessModule()`, `evaluateProductModuleRouteAccess()`, and `FAIL_CLOSED_MODULE_NAV_VISIBILITY` have **zero** terminology awareness. `ProductTerminology` never appears in any access/visibility/route-guard function signature or branch — it is carried as inert sibling data on the same state object.

### 5.4 AppShell label wiring

`src/components/app-shell.tsx`: new optional prop `terminology?: ProductTerminology` (defaults to `DEFAULT_PRODUCT_TERMINOLOGY`). `PrimaryNav`/`PrimaryNavFallback` render `{terminology.customer.plural}` instead of the literal `"Customers"` for the Customers nav link. The `moduleNavVisibility.customers` boolean gate is unchanged — terminology only changes the text inside an already-decided `if (visible)` branch.

---

## 6. Terminology matrix

| Concept | Knowledge (TG1) | Service | Field | Product | Unresolved |
| --- | --- | --- | --- | --- | --- |
| `customer` (singular) | Customer | **Client** | Customer | Customer | Customer *(generic default; Customers module hidden anyway)* |
| `customer` (plural) | Customers | **Clients** | Customers | Customers | Customers *(generic default; unused — module hidden)* |

No other concept was wired (Leads has no seeded term variant; Programs/Enrollments/Progress/Members/Tasks/Attention/Home are unaffected — see §11).

---

## 7. Navigation changes

| Target | Before | After |
| --- | --- | --- |
| Knowledge/OCB | `Customers` | `Customers` (unchanged — `DEFAULT_PRODUCT_TERMINOLOGY` matches seeded Knowledge term exactly) |
| Service | `Customers` | **`Clients`** |
| Field-operations | `Customers` | `Customers` (unchanged — seeded Field term is `Customer`/`Customers`) |
| Product-operations | `Customers` | `Customers` (unchanged — seeded Product term is `Customer`/`Customers`) |
| Unresolved | `Customers` (rendered only if visible) | Unchanged — nav gate hides Customers entirely for unresolved context; no terminology needed |
| Members (all targets) | `Members` | **Unchanged** — verified by explicit regression test; Technician term is not applied |

`moduleNavVisibility.programs`/`.enrollments`/`.progress`/etc. booleans are provably unchanged (see §9/§13).

---

## 8. Shared-page terminology

Wired only on the Customers shared page (list, filters, detail — the page explicitly named as the primary target by the phase brief):

| Surface | File | Nouns wired |
| --- | --- | --- |
| List page title / count / create link / subtitle / empty states / pagination aria-label | `src/app/(authenticated)/customers/page.tsx` | "Customers" → `{plural}`, "New customer" → `New {singular}`, "Customer list for…" → `{singular} list for…`, "…customers" count → `…{plural}`, empty-state copy, `aria-label` |
| List table headers / list aria-label | `src/features/customers/ui/customer-list.tsx` | `Customer` / `Customer status` / `Customer since` column headers, `aria-label="Customer list"` |
| Filters: status label, sort options, search placeholder, archived-toggle label | `src/features/customers/ui/customer-list-filters.tsx` | "Customer status", "Customer name", "Customer since", "Search by customer name or email", "Show archived customers" |
| Detail page breadcrumb, section heading, metadata labels, workflow action labels, unavailable-state heading | `src/features/customers/ui/customer-detail.tsx` | "Back to customers", "Customer details", "Customer name/status/since", "Edit/Archive/Restore customer", "Customer unavailable" |

Leads, Tasks, Attention, Home, Members, Programs, Enrollments, Progress were evaluated and **intentionally left unwired** — none reference the `customer` noun as page-level copy requiring a target variant, and no other seeded term key maps to an implemented module (§11).

---

## 9. TG1 preservation

`DEFAULT_PRODUCT_TERMINOLOGY = { customer: { singular: "Customer", plural: "Customers" } }` is byte-identical to the Knowledge/OCB seeded term (`("customer", "Customer", "Customers")` in both `CTX-1` and via inheritance). Knowledge/OCB pages therefore render **exactly** the pre-existing wording whether or not `terminology` is explicitly resolved. Verified by:

- `tests/features/product-access/terminology-projection.test.ts` — "projects Knowledge/OCB terminology as Customer/Customers (TG1 unchanged)"
- `tests/ui/appshell-customers-terminology.test.tsx` — "renders generic Customers label for Knowledge/OCB… when terminology is omitted"
- Pre-existing `tests/ui/customer-list-presentation.test.tsx`, `tests/ui/customer-detail-presentation.test.tsx`, `tests/ui/programs-navigation.test.tsx` pass unmodified (defaults match old hardcoded copy).

Programs/Enrollments/Progress copy was not touched at all (no CTX term keys for those exist, and the freeze forbids unnecessary TG1 churn).

---

## 10. Fail-safe fallback

- `projectProductTerminology(null)` and `projectProductTerminology([])` return `DEFAULT_PRODUCT_TERMINOLOGY` — generic, not Course-Seller-specific.
- `buildUnresolvedProductModuleAccess()` sets `terminology: DEFAULT_PRODUCT_TERMINOLOGY` alongside the pre-existing `FAIL_CLOSED_MODULE_NAV_VISIBILITY` (Home only). Because `navVisibility.customers` is `false` in the unresolved case, the Customers nav link and page are not reachable — terminology is present but inert, matching the phase's own example ("If Customers is not accessible under unresolved context, no terminology rendering is needed there").
- Verified by `tests/features/product-access/terminology-projection.test.ts` (null/empty/absent-term-key cases) and `tests/ui/appshell-customers-terminology.test.tsx` ("falls back to generic Customers wording for unresolved context").

---

## 11. Access / security preservation

- `ProductTerminology` is not referenced by `buildModuleNavVisibility`, `canAccessModule`, `evaluateProductModuleRouteAccess`, `hasEffectiveCapabilityRelevance`, or any capability/relevance function — confirmed by reading `src/features/product-access/domain/module-access.ts` and `src/features/product-access/server/enforce-product-module-access.ts` (no edits to control-flow, only an additive default-valued function parameter on `buildResolvedProductModuleAccess`).
- `tests/ui/appshell-customers-terminology.test.tsx` — "does not let terminology influence module visibility (Programs stays hidden for Service)" renders Service terminology + Service nav visibility together and asserts Programs remains hidden.
- `tests/features/product-access/beta1-4tg-appshell-gating.test.ts` (all 9 cases, including route-bypass denial for Programs/Enrollments/Progress) passes unmodified in behavior — the two literal `ProductModuleAccessState` fixtures were extended with `terminology: DEFAULT_PRODUCT_TERMINOLOGY` only to satisfy the additive type, with no assertion changes.
- Members RBAC (`resolveMembersNavVisible`, `canAccessMemberAdministration`) untouched; explicit regression test confirms the Members nav label stays `"Members"` (not `"Technicians"`) even when Service terminology is supplied.
- No route path, capability key, database table, domain type, or migration column was renamed.

---

## 12. Explicitly not implemented

- ONBOARDING-1A (no operating-model selector, no context-assignment UI)
- Projects, Sites, Work Orders, Dispatch, Products, Orders, Inventory, Fulfillment modules/pages/nav — terms remain seeded and unconsumed
- i18n framework, translation management, dictionary editor, localization CMS, user-custom labels, per-user overrides, AI wording layer, dynamic grammar engine
- Technician terminology on Members (semantic mismatch avoided deliberately)
- Any CTX/CAP migration or promotion
- Any change to Programs/Enrollments/Progress copy

---

## 13. Tests / quality

### 13.1 New targeted tests

| File | Tests | Purpose |
| --- | --- | --- |
| `tests/features/product-access/terminology-projection.test.ts` | 7 | Projection correctness: null/empty/absent-term fallback, Knowledge/Service/Field/Product projections via the real resolver |
| `tests/ui/appshell-customers-terminology.test.tsx` | 6 | AppShell nav label per target, terminology/visibility independence, Members regression, unresolved fallback |
| `tests/ui/customers-service-terminology.test.tsx` | 4 | Customers list/filters/detail/unavailable render `Client`/`Clients` for Service |

Fixture additions: `tests/features/product-access/module-access-fixtures.ts` gained `SERVICE_PRODUCT_TERMINOLOGY` and `mockServiceProductModuleAccess()` (additive; existing `mockKnowledgeProductModuleAccess()` extended with `terminology: DEFAULT_PRODUCT_TERMINOLOGY`).

### 13.2 Full-suite results

| Gate | Result |
| --- | --- |
| Targeted new tests | 17 passed / 17 total |
| Full Vitest suite | **3389 passed / 2 failed / 3391 total** |
| Historical accepted failures (unchanged) | `tests/features/invitations/load-member-administration-page.test.ts`, `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` |
| New regressions | **0** |
| typecheck (`tsc --noEmit`) | PASS |
| lint (`next lint`) | PASS — no warnings or errors |
| build (`next build`) | PASS (pre-existing unrelated autoprefixer CSS warning only) |

Baseline was `3372 passed / 2 failed / 3374 total`; this phase adds 17 new passing tests (3391 − 3374) with the same 2 historical failures and zero new ones.

One in-flight regression was caught and fixed during implementation: a docstring in `terminology.ts` initially contained the literal substring `context_terminology`, which `tests/security/context-pack-registry-runtime-isolation.test.ts` flags as an unauthorized raw-table reference outside the control-plane reader. The comment was reworded to describe the concept without the literal table-name token; the isolation test now passes with zero unauthorized consumers.

---

## 14. Production non-effects

| Metric | Value |
| --- | --- |
| CUSTOMER WRITES | 0 |
| DATA WRITES | 0 |
| PRODUCTION MIGRATIONS | 0 |
| DEPLOYMENTS | 0 |
| SOCIAL EXECUTION GATES CHANGED | NO |
| CTX BETA_SUPPORTED PROMOTION | NO |
| CORE REOPENED | NO |
| DATA REOPENED | NO |

No `supabase/migrations/` files were added or modified. No Supabase MCP mutation tools were invoked.

---

## 15. Scope compliance

| Requirement | Met |
| --- | --- |
| Terminology sourced from the same authoritative effective context as the product shell | Yes — `loadProductModuleAccess()` is the single integration point |
| No second target-mapping layer / no pathname guesses / no per-target UI switch statements | Yes — one `projectProductTerminology()` helper, keyed only on resolver `termKey` |
| Service Customer UI uses Client/Clients where frozen | Yes |
| Field/Product terminology available without fake Field/Product modules | Yes (seeded, resolvable, unconsumed by any nav/page) |
| TG1 unchanged | Yes (byte-identical default) |
| Unresolved context ≠ Course Seller fallback | Yes (generic default; Customers hidden regardless) |
| AppShell module visibility unchanged | Yes (§11) |
| Route protection unchanged | Yes (§11) |
| RBAC unchanged | Yes (§11) |
| No unimplemented module made visible | Yes |
| No domain/database renaming | Yes |
| No i18n framework | Yes |
| No ONBOARDING-1A | Yes |
| No target-slice implementation | Yes |
| TG2/TG3/TG4 remain `context_ready` | Yes — no CTX/CAP file touched |
| No CTX promotion | Yes |
| No new migration | Yes |

---

## 16. Final verdict

`BETA1-4TG-TERMINOLOGY CLOSED WITH EVIDENCE — TARGET-AWARE NAVIGATION AND SELECTED SHARED-PAGE TERMINOLOGY ARE RESOLVED FROM CTX WITHOUT CHANGING ACCESS CONTROL`

Retained:

- `BETA-1 CORE = 100% CLOSED WITH EVIDENCE`
- `FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE`
- `DISPLAY TERMINOLOGY ≠ DOMAIN MODEL`
- `TERM EXISTS ≠ MODULE IMPLEMENTED`
- `TERMINOLOGY MUST NOT GRANT ACCESS`

Final HEAD / divergence / worktree state to be recorded immediately after push (this section is updated in the same commit or a follow-up HEAD-alignment commit, matching established repository convention).

---

## 17. Next required phase

`NEXT REQUIRED PHASE = ONBOARDING-1A`

Context packs exist, AppShell gating is context-aware, and terminology now resolves from context end to end for the Customers shared page. The next shared dependency is the minimum operating-model onboarding flow that lawfully assigns an organization to the correct foundation pack: organization → choose operating model → assign foundation context → resolver → lawful navigation + terminology.
