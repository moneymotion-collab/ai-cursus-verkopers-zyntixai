# B1-C1-H1 — Daily Operating Home Hardening — Acceptance Contract

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1 — Daily Operating Home Hardening** |
| Document | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` |
| Document type | Additive docs-only acceptance contract |
| Date | 2026-09-13 |
| Branch | `core/platform-readiness-20260707` |
| Contract HEAD | `b30bde0c78ec93981b30fd4ecc9bcff495436fb8` |
| Parent authority | **B1-C1 — Daily Operating Composition** |
| Parent evidence | `docs/phases/B1-C1-daily-operating-composition-evidence.md` |
| Parent status | `B1-C1 CLOSED WITH EVIDENCE — AUTHENTICATED PRODUCTION BROWSER AUTOMATION VERIFIED` |
| Binding standard | `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` |
| Implementation | **NOT STARTED** |
| Migrations | **NONE allowed in H1** |
| Production / onboarding / fixture work | **OUT OF SCOPE for this contract document and for H1 implementation slices except H1-PROD/H1-FV verification of already-deployed Home** |

```text
OPEN — B1-C1-H1 CONTRACT CREATED, IMPLEMENTATION NOT STARTED
```

This document opens an additive hardening program under closed B1-C1. It does
not implement product changes. It does not rewrite, reopen, or replace B1-C1
evidence. It does not create a second dashboard architecture.

Forbidden statuses for **this docs-only file** until a later governed slice
actually earns them:

- `PASS — B1-C1-H1`
- `CLOSED`
- `RELEASE READY`
- `PRODUCTION VERIFIED`

---

## 1. Executive verdict

`B1-C1` remains the owner of `/home`. `B1-C1-H1` hardens that same shared
Today shell so admission, copy, next actions, workspace identity, shell
honesty, and composition completeness match the data Home actually shows.

H1 is **not**:

- a new dashboard;
- a replacement of the frozen shared-Today shell;
- four target-group dashboards;
- a KPI, chart, or activity-feed program;
- an onboarding or Production-fixture program;
- a schema or RLS-migration track.

```text
PARENT AUTHORITY PRESERVED = B1-C1
SHARED /home FROZEN = YES
FOUR DASHBOARDS = NO
IMPLEMENTATION STARTED = NO
```

---

## 2. Repository and authority baseline

### 2.1 Contract-time preflight

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `b30bde0c78ec93981b30fd4ecc9bcff495436fb8` |
| Upstream | `origin/core/platform-readiness-20260707` @ same SHA |
| Ahead / behind | `0 0` |
| Worktree at contract drafting | clean |
| Prior `B1-C1-H1` document or phase-ID | **none** — no name conflict |

### 2.2 Parent and adjacent closed authorities

| Authority | Status used by this contract | Binding on H1 |
| --- | --- | --- |
| B1-C1 Daily Operating Composition | CLOSED WITH EVIDENCE | Parent. `/home` product owner. Thin server composition of Attention + assigned Tasks. Owner/Admin org Attention. No AI ranking. No activity feed. No migration. |
| B1-C3 | CLOSED WITH EVIDENCE | Stale-enrollment Attention may be elevated to high **outside Home GET** so it can surface in the existing org-Attention subset. H1 does not add new Attention rules. |
| B1-C5 | CLOSED WITH EVIDENCE | Loading chrome, org-aware nav links, wrap-based narrow-viewport nav. H1 may polish honesty of that chrome; it does not reopen C5 evidence. |
| BETA1-4TG-SCOPE-FREEZE | CLOSED / frozen | One shared `/home`. Target-relevant queues compose into that shell. Do not build four dashboards. |
| BETA1-4TG-APPSHELL-GATING | CLOSED WITH EVIDENCE | Nav and route access are server-resolved and fail-closed. Unresolved context is Home-only nav, not a Course Seller fallback. |
| BETA1-4TG-TERMINOLOGY | CLOSED WITH EVIDENCE | Terminology is presentation only. It never grants access. Home copy must not invent target-specific KPI language. |
| BETA1-4TG-MASTER-FV | CLOSED WITH EVIDENCE | One Home composes lawful source context across TG1–TG4. No cross-target dashboard card. |
| ENG-ONB-1H-P1-D | CLOSED WITH EVIDENCE | Incomplete orgs never remain on product `/home`. Completed admission is `/home?org=`. H1 must not weaken `redirectIfOrganizationOnboardingIncomplete`. |
| ENG-ONB-1H-PROD | parked / NOT LIVE | **Out of H1 scope.** Do not resume Production onboarding verification. |

B1-C1 evidence is historical truth for the original composition. H1 cites it. H1
does not edit it.

### 2.3 Current Home code cited by this contract (read-only)

| Path | Why it is in the contract |
| --- | --- |
| `src/app/(authenticated)/home/page.tsx` | Current Today page and state matrix |
| `src/app/(authenticated)/home/loading.tsx` | Loading chrome; AppShell without resolved module visibility |
| `src/features/daily-operating/server/load-daily-operating-page.ts` | Server composition loader |
| `src/features/daily-operating/domain/compose-daily-operating-brief.ts` | Deterministic brief; section limit 5; Attention fetch limit 25 |
| `src/features/daily-operating/ui/daily-operating-brief.tsx` | Calm copy, org Attention, assigned queues, hardcoded “Open Leads” |
| `src/features/tasks/ui/resolve-task-page-organization.ts` | **Current defect:** Home admission uses `moduleId: "tasks"` |
| `src/features/product-access/domain/types.ts` | `ProductModuleId` includes `"home"` |
| `src/features/product-access/domain/module-registry.ts` | `id: "home"`, route `/home`, `capabilityRequirement: null` |
| `src/features/product-access/domain/module-access.ts` | `FAIL_CLOSED_MODULE_NAV_VISIBILITY.home === true` |
| `src/features/product-access/server/enforce-product-module-access.ts` | `evaluateProductModuleRouteAccess` |
| `src/features/onboarding/server/enforce-product-onboarding.ts` | Product admission helper |
| `src/components/app-shell.tsx` | Shared shell; `id="main-content"`; no skip-link |
| `src/components/org-aware-link.tsx` | Existing `?org=` preservation contract |
| `src/features/tasks/ui/resolve-task-organization-selection.ts` | Org selection; foreign `org` does not silently fall back |
| `tests/features/daily-operating/*.ts(x)` | Existing Home unit coverage |
| `tests/browser/b1-c1-production-home.*.spec.ts` | Existing authenticated Production Home harness |

---

## 3. Problem definition

Closed B1-C1 already answers the start-of-day question with a real Attention +
Tasks brief. Inventory of the current code shows these honesty and reliability
gaps that a professional SaaS landing must close **without replacing Home**:

1. **Admission coupling.** `/home` resolves organization through the Tasks page
   helper and evaluates `moduleId: "tasks"`. Unresolved context is contracted to
   Home-only navigation, but Home itself can fail as if Tasks were the landing
   module.
2. **Over-claiming calm copy.** “You are clear for now.” plus “Nothing urgent
   needs your attention and no assigned work is due today.” can be read as
   organization-wide health. Home shows a bounded subset.
3. **Unsafe next action.** Calm-state “Open Leads” is hardcoded. Leads is not
   visible for every operating model (notably `product_operations`) and is hidden
   when context is unresolved.
4. **Missing workspace identity.** The page does not name the active
   organization from data already loaded for the selector.
5. **Shell honesty / a11y.** Loading AppShell fail-closes to Home-only nav;
   there is no skip-link to existing `main-content`.
6. **Composition cap.** Attention is fetched with `pageSize` 25, then composed.
   Assigned or critical/high items can theoretically fall outside that window.

These are hardening defects of the existing `/home`, not a mandate for a new
surface.

---

## 4. Product-truth

### 4.1 What Home is

Home is a **bounded daily operating brief** for the active membership in the
active organization. It is not a report, not a health score, and not a
complete queue.

Visible subsets remain the B1-C1 composition:

| Section | Who sees it | What it contains |
| --- | --- | --- |
| Organization attention | `owner` and `admin` only | open/acknowledged, not archived/terminal, **critical or high**, cap 5 |
| Assigned to me — Attention | all admitted roles | assigned to the current `membershipId`, cap 5 |
| Overdue work | all admitted roles | open assigned tasks that are overdue in the org timezone, cap 5 |
| Due today | all admitted roles | open assigned tasks due today in the org timezone, cap 5 |

Home does **not** claim:

- the organization has no medium, low, or unassigned Attention;
- every open or assigned Task was listed or reviewed;
- every Attention item in the organization was fetched;
- revenue, growth, enrollment counts, inventory counts, or other KPIs;
- that the user has no work elsewhere in the product.

### 4.2 Frozen calm copy

Replace the current calm title:

```text
You are clear for now.
```

Frozen English calm title for H1:

```text
No priority attention or due work is showing in today’s brief.
```

Frozen English calm supporting sentence:

```text
This page lists priority Attention and due work in today’s brief. Other items may exist elsewhere.
```

“Priority Attention” means the composed critical/high organization items and
assigned Attention actually shown on Home. “Due work” means the composed
overdue and due-today assigned Tasks actually shown on Home. The calm title
must not be read as a check of every Task assigned to the user.

Rules for this copy:

- it must match the subset actually composed;
- it must not claim the organization is empty, safe, or fully handled;
- it must not claim that every assigned Task was reviewed;
- it must not deny hidden medium/low or unassigned items;
- it must be readable by a non-technical user;
- it must remain short enough for a 390px viewport without horizontal overflow.

Calm state is allowed only when **both** Attention and Tasks queries succeed and
the composed brief has `hasAnyActionable === false`. Partial failure must never
render calm copy.

Section empty rows (for example “No work is due today.”) remain local to that
section. They must not be rewritten as organization-wide health.

The page title remains **Today**. The subtitle remains a short explanation of
the brief, not a KPI. Allowed subtitle (frozen):

```text
Priority Attention and due work in today’s brief.
```

### 4.3 Bounded brief invariant

`DAILY_OPERATING_SECTION_LIMIT` remains the maximum visible density per section
on Home (currently 5). H1 must not turn Home into an unbounded report or a
second Attention/Tasks list page. “View all” links, when lawful, remain the
escape hatch to the existing module routes.

---

## 5. Invariants

H1 implementation and later verification must preserve all of the following.
Breaking any invariant is a stop condition.

1. **B1-C1 remains parent authority** of `/home`. H1 does not reopen or rewrite
   B1-C1 evidence.
2. **One shared `/home`.** No `/dashboard`, no per-target Home routes, no second
   composition engine.
3. **Core sources remain Attention + assigned Tasks.** No KPI widgets, charts,
   activity feeds, NBA cards, or planning modules on Home.
4. **No AI ranking or AI summaries.**
5. **No schema, RLS, or COUNT-RPC change inside H1.** Additional uses of
   existing `listAttentionItems` / `listTasks` filters are allowed. New database
   objects are not.
6. **Onboarding admission is unchanged.** `redirectIfOrganizationOnboardingIncomplete`
   remains the product gate. Incomplete users never stay on Today because of H1.
7. **Organization isolation.** Membership-scoped reads only. Foreign `?org=`
   never returns that org’s data and never silently substitutes another
   organization. Existing `resolveSelectedOrganization` invalid-selection
   behavior remains.
8. **Fail-closed security.** Nav visibility and Home outbound links are derived
   from server-resolved `ProductModuleAccessState`. No client-only gating.
9. **Authenticated session client** for Home reads. H1 does not introduce a
   service-role path on the Home render.
10. **Existing AppShell** remains the chrome. No sidebar, command palette,
    notification center, or global search in H1.
11. **Roles remain** `owner | admin | staff | viewer`. H1 does not invent
    manager/executor roles or change Attention-list rights outside Home.
12. **Production onboarding fixtures and ENG-ONB-1H-PROD remain out of scope.**

---

## 6. Scope

### 6.1 In scope for the H1 program

- Independent Home admission using the existing product-module access machinery.
- Honest calm/empty copy.
- Context-safe outbound links on Home.
- Small workspace identity header from already-loaded org/membership data.
- Shell honesty and accessibility polish of the existing Home/AppShell.
- Composition completeness so assigned and critical/high items are not lost to
  the current Attention fetch window, without raising Home’s visible density.
- Focused tests, regression, R1 if required, Production Home verification, and
  final verification of **this hardening**.

### 6.2 Explicitly out of scope

- New KPIs; revenue or growth charts; invented demo metrics.
- Activity feed; notification center; global search; command center.
- AI ranking or AI summaries.
- Agenda / planning module.
- Separate dashboards per target group.
- Database or RLS migrations; new COUNT-RPC; new capability key; new module ID.
- Onboarding resumption; Ready/Creating redesign; invitation delivery.
- Production-fixture creation or ENG-ONB-1H-PROD work.
- Public marketing website.
- Broader AppShell rebuild (sidebar IA, new information architecture).
- Changing Attention list/detail permissions outside Home.
- Rewriting closed B1-C1 / B1-C3 / B1-C5 / 4TG / P1-D evidence files.

---

## 7. P1 contract — independent Home admission

### 7.1 Existing module identity (verified, not invented)

`"home"` is already a valid `ProductModuleId`:

- `src/features/product-access/domain/types.ts` — union member `"home"`;
- `PRODUCT_MODULE_DEFINITIONS` entry `{ id: "home", route: "/home", implemented: true, capabilityRequirement: null }`;
- `FAIL_CLOSED_MODULE_NAV_VISIBILITY.home === true`;
- `evaluateProductModuleRouteAccess({ moduleId: "home", access })` therefore
  allows Home for both resolved and unresolved `ProductModuleAccessState`.

`"home"` is **not** a capability key. H1 must not invent `core.home` or a new
resolver target. Admission uses existing `evaluateProductModuleRouteAccess`
with `moduleId: "home"`.

`capabilityRequirement: null` means Home is not capability-gated in the
module registry. It does **not** skip authentication, membership checks,
onboarding admission, organization selection, or org isolation. Those
controls remain mandatory in §7.2.

### 7.2 Required behavior

Home organization resolution must use the same authentication, membership
listing, organization selection, onboarding admission, timezone, and
fail-closed module-access load as other product pages. It must **not** call
`evaluateProductModuleRouteAccess` with `moduleId: "tasks"` as the condition
for remaining on `/home`.

After H1-ADMISSION:

| Situation | Required result |
| --- | --- |
| Completed + resolved operating model | Remain on `/home`; compose brief; show lawful nav |
| Completed + unresolved context | Remain on `/home`; Home-only nav; brief may still read Attention/Tasks through existing org-scoped read queries because those are Home sources, not a nav grant |
| Incomplete onboarding | Push to current onboarding stage via existing helper; never Today |
| No membership | Existing `organization_unavailable` / no-organizations state; no product brief |
| Foreign `?org=` | Selection-required or invalid-selection path; no foreign data; no silent fallback to another org |
| Multiple organizations, no `org` | Organization selection required; no brief for an unchosen org |
| Tasks visible | Home still loads; Tasks links may appear when visibility is true |
| Tasks not visible | Home still loads; Tasks **links** must not appear; Home must not fail as “module unavailable” |
| Session missing / expired | Existing auth_required / middleware login redirect; no brief |

Unresolved context must not Course-Seller-fallback. Home-only navigation
remains the APPSHELL-GATING contract.

### 7.3 Data reads versus navigation grants

Attention and Tasks remain the B1-C1 data sources for the brief. Reading them
on Home is allowed for an admitted membership even when `/attention` or
`/tasks` are not in the primary nav. **Outbound links** to those modules are a
separate grant and follow §8.

### 7.4 Required tests (H1-ADMISSION)

| Case | Must prove |
| --- | --- |
| Completed + resolved | Home ready; `moduleId: "home"` allowed; brief composed |
| Completed + unresolved | Home ready; not Tasks-denied; fail-closed nav Home-only |
| Incomplete onboarding | Redirect to onboarding stage; no Today body |
| No membership | no-organizations / unavailable; no other-org data |
| Foreign organization | no data from that org; no silent substitution |
| Multiple organizations | `/home` without org asks for selection |
| Tasks available | Home succeeds; Tasks link lawful |
| Tasks not available | Home succeeds; no Tasks link; no Tasks-module error as the Home page error |
| Session missing / expired | auth_required or login redirect |

Source lock: Home loader source must not evaluate Tasks as the Home route
module. Targeted tests may snapshot that `evaluateProductModuleRouteAccess` for
the Home path uses `"home"`.

---

## 8. Context-safe next steps

### 8.1 Rule

“Open Leads” must not be universally visible.

Every empty-state, calm-state, section “view all”, and row href on Home that
targets a product module must be derived from the **same server-resolved**
`moduleNavVisibility` (or the `ProductModuleAccessState` that produced it).
Client-only hiding is not the security boundary. Home `moduleNavVisibility`
is presentation for which links may be offered. Destination route loaders
remain the authorization boundary; showing or hiding a Home link does not
grant or replace `/attention`, `/tasks`, or other module admission.

Links must keep `?org=` through existing org-aware contracts (`OrgAwareLink`
and/or the same `org` query already used by brief hrefs). H1 must not add
routes.

If a module is hidden, inaccessible, or not in that operating model’s visibility
map, Home must not offer a link to it. If a brief row would otherwise point at a
hidden module, render the row as non-navigating text. Do not invent a detail
route.

### 8.2 Lawful link candidates (existing routes only)

| Module ID | Route | May appear on Home when `navVisibility` is true |
| --- | --- | --- |
| `attention` | `/attention`, `/attention/:id` | View all Attention; Attention rows |
| `tasks` | `/tasks`, `/tasks/:id` | View overdue / due today; task rows |
| `leads` | `/leads` | Optional calm/empty operational link |
| `projects` | `/projects` | Optional calm/empty operational link |
| `workOrders` | `/work-orders` | Optional calm/empty operational link |
| `orders` | `/orders` | Optional calm/empty operational link |

Customers, programs, sites, dispatch, products, inventory, fulfillment,
members, and social are **not** required calm links in H1. They must not be
added as hardcoded extras.

### 8.3 Minimum calm/empty link matrix

When the calm state renders, show at most the lawful subset below, in this
order, omitting any ID whose visibility is false:

| Operating model / context | Required if visible | Forbidden |
| --- | --- | --- |
| `course_seller` | Attention, Tasks, Leads | Projects / Work orders / Orders links |
| `service` | Attention, Tasks, Projects | Leads only if `leads` visibility is true; never Knowledge-only routes |
| `field_operations` | Attention, Tasks, Work orders | Leads only if visible; no invented Field dashboard |
| `product_operations` | Attention, Tasks, Orders | **Leads must not appear** when `leads` is false |
| unresolved | **no module links** | No Leads, Attention, Tasks, or other module CTAs |

Section “view all” links follow the same visibility map even when the calm
banner is not shown.

---

## 9. Workspace identity

Add a small professional context header using **only** data already available
to the successful Home loader:

- active organization display name from `organizationOptions`;
- optional membership role, presented as a display label of the existing
  role enum (`Owner`, `Admin`, `Staff`, `Viewer`);
- heading **Today**;
- the frozen brief subtitle in §4.2.

Role labels are a presentation layer only. They must not invent a job title,
username, or greeting, and they must not imply extra capabilities beyond the
existing server-side role checks. Raw enum values may be mapped to those
labels; they must not become a second permission system.

Forbidden: invented personal greeting, persona, company health, KPI, or
operating-model marketing line.

| State | Required presentation |
| --- | --- |
| One organization | Show that org name; selector may stay hidden (current AppShell rule: selector only when `length > 1`) |
| Multiple organizations | Show the **selected** org name; existing selector remains the switcher |
| Long organization name | Wrap / truncate without document horizontal overflow at 390px and 1440px |
| Missing display name | Keep existing fallback `Organization {n}` from `buildOrganizationOptions`; do not invent a trade name |
| Mobile | Name + role remain readable; no overflow; Today heading stays first in the document outline |
| Loading | Must **not** invent an organization name. `loading.tsx` has no org payload; show Today + loading message only |
| Error / org required / auth required | Existing state headings remain; do not display another organization’s name |

---

## 10. Shell and accessibility (H1-SHELL)

Later H1-SHELL slice, not a new information architecture:

- Keep `AppShell`. No sidebar. No command palette.
- Add a skip-link to existing `main id="main-content"`.
- Keyboard order: skip-link, brand/nav, org selector if present, log out, main.
- Focus-visible treatment must keep existing global 2px focus tokens.
- Loading shell must not present a **final** navigation set. Until
  `moduleNavVisibility` is known, do not imply that only Home exists as the
  user’s product, and do not flash a false full Course Seller nav. Contracted
  loading presentation: Today hierarchy + “Loading today’s brief…” without a
  completed primary-nav claim. Passing already-known org into loading is not
  required if the Next.js `loading.tsx` contract cannot receive it; inventing
  nav is forbidden.
- Verify **1440px** and **390px**: no document `scrollWidth > clientWidth`;
  long labels and org names wrap; interactive targets keep existing
  `--control-min-height` / 2.75rem pattern.
- Semantic `h1` Today, `h2` section titles, `role="status"` for calm/partial,
  `role="alert"` for errors. Do not assert `getByRole('alert')` count 0 in a
  way that fights the Next.js route announcer (B1-C1-R1 lesson).
- Mobile nav may be investigated (wrap vs overflow). A full new nav IA
  requires a **separate** frozen contract and is out of H1.

---

## 11. Composition completeness (H1-COMPOSITION)

“No items on Home” must not be caused solely by the arbitrary Attention
`pageSize` of 25 dropping relevant rows **before** `composeDailyOperatingBrief`.

H1-COMPOSITION must prove:

1. **Deterministic sort** remains: Attention by severity rank desc then
   `lastDetectedAt` desc; tasks by `due_at` as today.
2. **Assigned-to-me Attention** that is open/acknowledged and not archived is
   not lost because a first page of org-wide items filled the 25 window.
3. **Owner/Admin critical/high** items are not lost for the same reason.
4. **Visible density** on Home remains the section cap (5). Extra fetch is for
   correctness of that cap, not a longer Home list.
5. **No unbounded client payload.** Server still slices to the section cap
   before render.
6. **No schema change. No new COUNT-RPC.** Prefer additional existing list queries
   with already-supported filters (`assigneeMemberId`, `severity`, `status`,
   `dueState`) over new database objects.
7. Partial Attention or Tasks failure still shows the partial warning and
   **must not** produce calm state.
8. Cross-org rows continue to be dropped by compose filters.

If completeness cannot be proven without a new RPC or migration, H1-COMPOSITION
stops and requests new authority. It must not silently keep the 25-cap loss.

---

## 12. Phased execution

Implementation is not started. Later work must follow this order. A later slice
must not start while a prior required slice is BLOCKED.

### 12.1 `B1-C1-H1-ADMISSION`

| Field | Contract |
| --- | --- |
| Goal | `/home` admission independent of the Tasks module, without weakening onboarding or tenant isolation |
| Allowed | Home-specific use of existing org resolver pieces; `evaluateProductModuleRouteAccess` with `moduleId: "home"`; tests |
| Denylist | New module/capability IDs; schema; onboarding changes; copy/link/shell work beyond what admission tests need |
| Acceptance | Cases in §7.4 pass; Home source no longer gates on `"tasks"`; incomplete users never see Today |
| Tests | Vitest for loader/admission matrix in §7.4; source lock |
| Evidence | Implementation note + test commands/results; no Production claim |
| Rollback | Revert the resolver wiring; `/home` may again use the previous helper only as an emergency rollback, not as the accepted design |
| Stop | If `"home"` were missing from types (it is not); if onboarding gate would be skipped; if foreign org data leaked |
| PASS line | `PASS — B1-C1-H1-ADMISSION HOME ADMISSION INDEPENDENT OF TASKS` |

### 12.2 `B1-C1-H1-TRUTH`

| Field | Contract |
| --- | --- |
| Goal | Honest calm/empty copy, bounded-brief meaning, context-safe links, workspace identity header |
| Allowed | Copy in daily-operating UI; link gating from `moduleNavVisibility`; org name + role from existing loader data |
| Denylist | KPIs; greetings; new routes; client-only gating; Leads hardcoded |
| Acceptance | Frozen copy in §4.2; matrix in §8.3; identity states in §9; partial ≠ calm |
| Tests | UI tests for copy; visibility matrix per operating model + unresolved; org fallback name; no Leads on `product_operations` / unresolved |
| Evidence | Screenshots optional later; Vitest required here |
| Rollback | Revert UI; do not restore “You are clear for now.” as accepted truth |
| Stop | If copy claims org-wide health or a complete assigned-work check; if a hidden module is linked |
| PASS line | `PASS — B1-C1-H1-TRUTH HOME COPY AND NEXT ACTIONS ARE HONEST` |

### 12.3 `B1-C1-H1-SHELL`

| Field | Contract |
| --- | --- |
| Goal | Skip-link, loading honesty, 1440/390, keyboard/focus, no overflow |
| Allowed | AppShell/Home CSS and skip-link; loading presentation; targeted a11y tests |
| Denylist | Sidebar; command palette; new IA; token rewrite of `globals.css` beyond Home/shell need |
| Acceptance | §10; 1440px and 390px; no horizontal overflow; skip-link reaches `main-content` |
| Tests | Unit/a11y where feasible; browser 1440/390 in R1/PROD as required by B1-GATE.1 Gate 7–8 |
| Evidence | Viewport measurements; keyboard notes |
| Rollback | Revert chrome; keep AppShell wrap from B1-C1/C5 |
| Stop | New nav IA without its own freeze; overflow regressions |
| PASS line | `PASS — B1-C1-H1-SHELL HOME CHROME IS ACCESSIBLE AND HONEST` |

### 12.4 `B1-C1-H1-COMPOSITION`

| Field | Contract |
| --- | --- |
| Goal | Assigned and critical/high Attention cannot be dropped by the pre-compose fetch window |
| Allowed | Extra existing read-query calls/filters; keep section cap 5 |
| Denylist | COUNT-RPC; migrations; unbounded lists; AI sort |
| Acceptance | §11; tests with >25 distractor items; partial failure ≠ calm |
| Tests | Domain + loader tests with overflow fixtures |
| Evidence | Deterministic sort proof; fixture counts |
| Rollback | Revert queries; do not ship a known-lossy 25-cap as “complete” |
| Stop | Completeness requires schema/RPC — new authority needed |
| PASS line | `PASS — B1-C1-H1-COMPOSITION RELEVANT HOME ITEMS ARE NOT LOST BEFORE COMPOSE` |

### 12.5 `B1-C1-H1-R1`

| Field | Contract |
| --- | --- |
| Goal | Close defects found in ADMISSION–COMPOSITION without expanding scope |
| Allowed | Fixes inside this contract |
| Denylist | New features; out-of-scope items in §6.2 |
| Acceptance | Every R1 defect classified; P0/P1 closed; polish listed |
| Tests | Failing tests from the defect plus prior H1 tests |
| Evidence | R1 note; no silent evidence rewrite of B1-C1 |
| Rollback | Per-fix revert |
| Stop | P0/P1 that needs out-of-scope work |
| PASS line | `PASS — B1-C1-H1-R1 HARDENING DEFECTS CLOSED` |

### 12.6 `B1-C1-H1-PROD`

| Field | Contract |
| --- | --- |
| Goal | Authenticated Production `/home` verifies this hardening on a governed completed org |
| Allowed | Read-only Production browser verification; record deploy SHA |
| Denylist | Production mutations; onboarding fixture work; ENG-ONB-1H-PROD resumption; new QA orgs |
| Acceptance | Deploy SHA equals tested commit; completed Home shows Today; admission/copy/link/identity/shell checks that are live on that org |
| Tests | Existing `npm run test:browser:b1-c1` plus H1 assertions that do not require incomplete-onboarding Production fixtures |
| Evidence | URL (redacted org), deploy SHA, viewport 1440/390, no secrets |
| Rollback | Revert deploy if P0/P1 |
| Stop | Missing auth bootstrap; incomplete-onboarding Production probe (out of scope) |
| PASS line | `PASS — B1-C1-H1-PROD AUTHENTICATED PRODUCTION HOME HARDENING VERIFIED` |

### 12.7 `B1-C1-H1-FV`

| Field | Contract |
| --- | --- |
| Goal | Final verification that all AND-gates in §18 pass |
| Allowed | Evidence dossier; regression record; authority check |
| Denylist | New scope; rewriting parent evidence |
| Acceptance | All 18 AND-gates PASS; zero open P0/P1; zero open mandatory conditions |
| Tests | Full required regression before publication closure (B1-GATE.1 Gate 4/10) |
| Evidence | FV document; clean `HEAD = upstream` `0 0` |
| Rollback | Do not declare FV if any gate is open |
| Stop | Any open P0/P1 or missing mandatory gate |
| PASS line | `PASS — B1-C1-H1-FV DAILY OPERATING HOME HARDENING CLOSED WITH EVIDENCE` |

H1 as a program is not closed until H1-FV. Individual slice PASS lines are not
`PASS — B1-C1-H1` and not `CLOSED` for the parent program.

---

## 13. Acceptance criteria (program)

H1 is acceptable only if all are true:

1. Parent B1-C1 remains closed and is not rewritten.
2. `/home` is still the only authenticated product Home.
3. Home admission is independent of Tasks and still shares auth, membership,
   org selection, onboarding gate, RLS, and fail-closed module access.
4. Unresolved completed context can use Home with Home-only nav.
5. Incomplete onboarding never sees Today via H1.
6. Foreign `org` cannot read or silently switch tenants.
7. Calm copy matches §4.2.
8. Outbound Home links follow `moduleNavVisibility`.
9. Workspace identity uses only existing org name + role.
10. Loading, empty, partial, error, and populated states exist and are honest.
11. 1440px and 390px have no horizontal overflow.
12. Skip-link and heading/status semantics meet §10.
13. Composition does not lose assigned or critical/high items to the old
    pre-compose window.
14. No schema, KPI, chart, feed, or onboarding change shipped as H1.

---

## 14. Test matrix

| ID | Slice | Type | Contract |
| --- | --- | --- | --- |
| T1 | ADMISSION | Vitest | Home uses `moduleId: "home"` |
| T2 | ADMISSION | Vitest | Completed resolved → brief |
| T3 | ADMISSION | Vitest | Completed unresolved → Home, not Tasks-denied |
| T4 | ADMISSION | Vitest | Incomplete → onboarding redirect |
| T5 | ADMISSION | Vitest | No membership / foreign org / multi-org selection |
| T6 | ADMISSION | Vitest | Session missing |
| T7 | TRUTH | Vitest UI | Exact frozen calm title `No priority attention or due work is showing in today’s brief.`; no “You are clear for now.”; no “assigned to you” as a complete assigned-work claim |
| T8 | TRUTH | Vitest UI | Partial failure suppresses calm |
| T9 | TRUTH | Vitest | Link matrix §8.3 including no Leads for `product_operations` and unresolved |
| T10 | TRUTH | Vitest UI | Org name + role; fallback name |
| T11 | SHELL | unit / browser | Skip-link; 1440/390 overflow; loading does not claim final nav |
| T12 | COMPOSITION | Vitest | >25 Attention distractors; assigned + critical/high still composed |
| T13 | COMPOSITION | Vitest | Section cap 5; org filter |
| T14 | R1+ | Vitest + Playwright | Prior H1 tests remain green |
| T15 | PROD | Playwright | `npm run test:browser:b1-c1` plus H1 live assertions permitted by the control org |
| T16 | FV | `vitest run` / typecheck / lint / build as required | Regression before publication |

Do not start those commands in this docs-only phase.

Existing commands that later slices may use:

- `npx vitest run tests/features/daily-operating tests/auth/resolve-authenticated-landing.test.ts tests/onboarding/product-admission-enforcement.test.ts`
- `npm run test:browser:b1-c1`

---

## 15. Evidence plan

Each implementation slice adds **new** evidence under `docs/phases/` and does
not edit `B1-C1-daily-operating-composition-evidence.md`.

Minimum dossier at H1-FV:

- this contract (unchanged invariants);
- per-slice evidence with HEAD, commands, results;
- security/tenant notes (org isolation, onboarding gate, no service-role on Home);
- browser 1440/390;
- Production deploy SHA + authenticated Home result;
- AND-gate table;
- rollback assessment;
- clean git publication per B1-GATE.1 Gate 10.

---

## 16. Rollback strategy

| Slice | Rollback boundary |
| --- | --- |
| ADMISSION | Restore previous loader wiring; product remains B1-C1 Home with known Tasks coupling |
| TRUTH | Restore previous UI; do not treat over-claiming copy as the accepted end state |
| SHELL | Revert chrome; keep C1/C5 wrap |
| COMPOSITION | Revert extra reads; if lossiness remains, status is not complete |
| PROD | Redeploy previous SHA if P0/P1 |

Rollback must not include schema reverse-migrations because H1 ships none.

---

## 17. Stop conditions

Stop the current slice and do not declare program PASS if any of:

- repository preflight fails;
- a change would reopen or rewrite B1-C1 evidence;
- a second dashboard or per-target Home is proposed as H1;
- `"home"` would need a new invented capability or table;
- onboarding admission would be bypassed;
- foreign org data would render;
- unresolved context would be mapped to Course Seller nav or denied Home;
- calm copy claims full organization health or that every assigned Task was checked;
- a hidden module is linked;
- a KPI, chart, feed, or AI summary is added;
- a migration or COUNT-RPC is required to finish COMPOSITION;
- ENG-ONB-1H-PROD or Production fixtures are pulled into H1;
- any P0/P1 remains open at FV.

---

## 18. Final AND-gates

B1-C1-H1 as a program may close only when **all** gates below are PASS.
AND logic: one open P0/P1 or one missing mandatory gate means no final PASS.

| # | Gate | Meaning |
| --- | --- | --- |
| 1 | Parent-authority preserved | B1-C1 still owns `/home`; evidence file not rewritten |
| 2 | Repository scope clean | Only contracted Home hardening; no schema/onboarding/dashboard |
| 3 | Home admission independent from Tasks | `moduleId: "home"` |
| 4 | Onboarding admission preserved | Incomplete never Today |
| 5 | Organization isolation preserved | Foreign `org` cannot read or silent-fallback |
| 6 | Unresolved context safely supported | Home functions; Home-only nav; no CS fallback |
| 7 | Target-aware actions | Links from server visibility; no universal Leads |
| 8 | Truthful calm/empty state | Frozen copy; partial ≠ calm |
| 9 | Loading / partial / error / populated | All present and honest |
| 10 | Workspace identity | Org name + optional role; no invented greeting/KPI |
| 11 | Responsive 1440/390 | No horizontal overflow |
| 12 | Accessibility | Skip-link, headings, status, focus, touch targets |
| 13 | Deterministic composition | Relevant assigned + critical/high not lost pre-compose |
| 14 | Focused tests | T1–T13 as applicable to shipped slices |
| 15 | Regression suite | Required automated regression before publication |
| 16 | Production deployment SHA verified | Deployed commit is the tested SHA |
| 17 | Authenticated Production Home verified | Completed org Today; H1-PROD |
| 18 | Evidence dossier complete | §15 |

---

## 19. Allowed end statuses

### 19.1 This document (docs-only)

```text
OPEN — B1-C1-H1 CONTRACT CREATED, IMPLEMENTATION NOT STARTED
```

### 19.2 Later slices (not claimed now)

See PASS lines in §12.1–§12.7.

### 19.3 Program closure (only after H1-FV)

```text
CLOSED WITH EVIDENCE — 100% REQUIRED GATES PASSED
```

plus the H1-FV PASS line. Until then the program is open.

Statuses that are **invalid** for this contract file and for any slice that
has not earned them:

- `PASS — B1-C1-H1`
- `CLOSED` (on this file)
- `RELEASE READY`
- `PRODUCTION VERIFIED`

---

## 20. Conflict scan against B1-C1

| B1-C1 rule | H1 position |
| --- | --- |
| Shared Today shell on `/home` | Unchanged |
| Compose Attention + assigned Tasks | Unchanged as data sources |
| Owner/Admin org Attention critical/high | Unchanged |
| Staff/Viewer see assigned work, not org Attention on Home | Unchanged |
| No AI ranking | Unchanged |
| No activity feed | Unchanged |
| No migration | Unchanged |
| No enrollment-metadata UI on Home | Unchanged |
| Thin server composition | Extra **existing** reads allowed only to prevent pre-compose loss |
| Production browser Home | Later H1-PROD; does not rewrite C1 evidence |

H1 changes admission coupling, honesty of copy/links/identity/shell, and
fetch completeness. Those are additive hardening, not a new product.

---

## 21. Document control

| Field | Value |
| --- | --- |
| Created | 2026-09-13 |
| Authoring mode | Docs only; no product code, tests, or parent evidence edited |
| Next allowed action | `B1-C1-H1-ADMISSION` implementation under this contract |
| Implementation started | **NO** |
