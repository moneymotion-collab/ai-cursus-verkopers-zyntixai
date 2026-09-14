# PW-0 — Public Web Charter & Boundary Freeze

## 1. Document Control

| Field | Value |
| --- | --- |
| Phase ID | **PW-0** |
| Title | Public Web Charter & Boundary Freeze |
| Status | `PASS — PW-0 BOUNDARY FROZEN WITH EVIDENCE` |
| R1 status | `PASS — PW-0-R1 BOUNDARY REVIEW CLOSED WITH EVIDENCE` |
| Date | 2026-09-14 |
| R1 review date | 2026-09-14 |
| Branch | `core/platform-readiness-20260707` |
| Baseline HEAD | `49cd5773976143139a154f9b8ddf36535a4dd914` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `49cd5773976143139a154f9b8ddf36535a4dd914` |
| Ahead / behind | `0 0` |
| Authenticated Home closure SHA | `49cd5773976143139a154f9b8ddf36535a4dd914` |
| Production product-code SHA | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Document type | Additive documentation only |
| Allowed mutation | This file only |
| Product / test / config edits | **NONE** |
| Commit / push / deploy | **NOT AUTHORIZED by this phase** |

**Document purpose.** Establish a repository-grounded trajectory contract for a new, separate ZyntixAI public-web program. Define what belongs to that program, what does not, which authenticated Home surfaces remain closed and protected, and which governance rules apply before any public-web implementation may begin.

**Relationship to later PW phases.** This document is the boundary authority for all later PW phases. Later phases may add product-truth, journey, messaging, design, and implementation-planning authorities. They may not silently override this freeze, reopen authenticated Home, or treat classification as implementation approval.

**Repository instructions inspected.** No `AGENTS.md`, nested `AGENTS.md`, `.cursor/rules`, or `CONTRIBUTING.md` was present at the repository root or under inspected paths. Applicable instructions actually found:

- `README.md` — title only (`zyntixai-cursus-verkopers`); no route-ownership or phase-file prohibition.
- `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` — repository-wide phase-completion and evidence standard.
- Existing `docs/phases/` evidence convention — phase authorities live as additive markdown under `docs/phases/`.
- Closed B1-C1-H1 contract and evidence chain listed in §5.6.

The most specific applicable instruction for this slice was the PW-0 prompt: create exactly this file and do not modify any existing file. PW-0-R1 may update only this same untracked file.

---

## 2. Executive Decision

A new and separate **public-web trajectory** is established. It concerns the unauthenticated visitor experience at `https://www.zyntixai.com`.

The authenticated Home program remains **closed and protected**. Public-web work must not reopen, restyle, replace, or indirectly alter that accepted authenticated behavior through shared dependencies.

PW-0 authorizes **documentation only**. No implementation, redesign, route change, middleware change, shared-component change, test change, dependency change, commit, push, or deployment is authorized.

```text
NEW PUBLIC-WEB TRAJECTORY = ESTABLISHED
AUTHENTICATED HOME = CLOSED AND PROTECTED
PW-0 IMPLEMENTATION AUTHORITY = NONE
```

Authenticated Home closure used by this charter:

```text
CLOSED WITH EVIDENCE — B1-C1-H1 AUTHENTICATED HOME HARDENING
```

That parent status is adopted from the PW-0 governing prompt after independent publication of the FV dossier at SHA `49cd5773976143139a154f9b8ddf36535a4dd914`. See §5.7 for reconciliation with the in-file FV wording. PW-0 does not reopen or reassess H1.

---

## 3. Purpose and Desired Outcome

The future public website exists to serve an **unauthenticated visitor** opening `www.zyntixai.com`. At a governance level, later approved phases should enable that visitor to:

- understand that ZyntixAI is a **Business Operating System**, not only an AI chatbot;
- form a credible, evidence-backed impression of the product;
- find a safe next step toward exploration, closed-beta access, or sign-in;
- avoid being told that all four target groups are fully available unless a later product-truth authority (PW-1) supports that claim.

This section is not marketing copy. Final homepage wording, claims, and visual design are out of scope for PW-0. Product truth and public claims belong to **PW-1**. Visitor journeys belong to **PW-2**. Positioning and messaging belong to **PW-3**.

---

## 4. Scope Register

### 4.1 In scope for the overall public-web trajectory

Later PW phases may work on these subjects only after their own phase contracts and, where required, design freeze plus implementation approval. PW-0 does not authorize doing them.

| ID | Subject | Notes |
| --- | --- | --- |
| PW0-IN-001 | Unauthenticated visitor experience at the canonical host | Current production host recorded as `https://www.zyntixai.com` |
| PW0-IN-002 | Public explanation of ZyntixAI as a Business Operating System | Claims require PW-1; copy requires PW-3 |
| PW0-IN-003 | Safe public route to exploration, beta access, or sign-in | Must not weaken existing auth, invitation, or registration gates |
| PW0-IN-004 | Isolated public marketing/landing surfaces, if later created | No `(marketing)` or `(public)` route group exists today |
| PW0-IN-005 | Historical public-brand asset gaps recorded by H1-FV | `/favicon.ico` and `/apple-touch-icon.png` 404s |
| PW0-IN-006 | Public metadata, SEO, and visitor-facing information architecture | Only after later design/implementation approval; root metadata is currently shared |
| PW0-IN-007 | Governance, evidence, accessibility, performance, and authenticated-regression gates for later PW implementation | Binding on PW-13 and any later implementation slice |

### 4.2 Out of scope for the public-web trajectory

| ID | Subject | Why |
| --- | --- | --- |
| PW0-OUT-001 | Authenticated `/home` product, copy, layout, or visual freeze | Closed B1-C1-H1 |
| PW0-OUT-002 | AppShell information architecture, skip-link, Menu, or Home loading chrome | H1-SHELL / SHELL-DESIGN |
| PW0-OUT-003 | Authentication, session, authorization, invitations, or public-registration flags | Separate closed authorities; current unauthenticated landing is `/login` |
| PW0-OUT-004 | Onboarding, provisioning, Ready/Creating, or ENG-ONB-1H | Closed/parked; Home admission depends on the onboarding gate |
| PW0-OUT-005 | Supabase schema, RLS, policies, migrations, or service-role usage | H1 and adjacent authorities forbid this class of change for public-web |
| PW0-OUT-006 | Authenticated module routes under `src/app/(authenticated)/` other than as regression surfaces | Product workspaces are not the public website |
| PW0-OUT-007 | Replacing Home with a marketing page or presenting Home as the public site | Explicitly forbidden by this charter |
| PW0-OUT-008 | Four target-group availability claims, chatbot-first positioning, or unverified product claims | PW-1, not PW-0; public-web may not invent them |
| PW0-OUT-009 | Dependency, lockfile, platform, or deploy-config mutation | Requires separate approval outside PW-0–PW-12 |

### 4.3 Deferred to later phases

| Subject | Latest owner |
| --- | --- |
| Whether any current product claim may be stated publicly | PW-1 |
| Visitor goals, jobs-to-be-done, and journey map | PW-2 |
| Positioning, messaging, and tone | PW-3 |
| Visual design, wireframes, and design freeze | Later design phases |
| Whether `/` remains an authenticated bounce pad or a public page | PW-13 implementation planning, after design freeze |
| Creating an isolated public route group | PW-13+, only after design freeze and implementation approval |
| Favicon / apple-touch-icon / other public assets | Later implementation; classified P1 (shared browser chrome), not isolated P2 |
| Login/register visual restyle as part of public brand | Not decided; treated as P1 until a later authority isolates it |

### 4.4 Explicitly prohibited during PW-0

| Prohibition | Status |
| --- | --- |
| Implement a public homepage | Prohibited |
| Change `/`, redirects, or session routing | Prohibited |
| Change authenticated Home, AppShell, layouts, or navigation | Prohibited |
| Change middleware, auth, authorization, or Supabase | Prohibited |
| Change onboarding, provisioning, shared components, or global CSS/tokens | Prohibited |
| Change metadata, SEO, analytics, cookies, or tracking | Prohibited |
| Create visual designs, wireframes, or final homepage copy | Prohibited |
| Decide product-claim truth or target-group availability | Prohibited |
| Create or change tests | Prohibited |
| Install dependencies, format, build, or run mutating commands | Prohibited |
| Commit, push, deploy, or mutate production | Prohibited |
| Modify any existing file | Prohibited |

---

## 5. Repository Architecture Findings

Every claim below is from inspection at HEAD `49cd5773976143139a154f9b8ddf36535a4dd914`.

### 5.1 Current public entry architecture

There is **no marketing homepage** in this repository.

| Finding | Evidence |
| --- | --- |
| Root App Router page exists at `/` | `src/app/page.tsx` |
| Unauthenticated `/` redirects to `/login` | `src/app/page.tsx` lines 13–15; `tests/auth/entry-routing-and-login-ui.test.tsx` (`redirects logged-out root visits to /login`) |
| Middleware does **not** treat `/` as protected; the logged-out `/` → `/login` redirect is the root Server Component, not `updateSession` | `isProtectedApplicationPath` omits `/` (`src/features/auth/server/safe-return-path.ts`); `updateSession` only redirects unauthenticated users when `isProtected` is true |
| Authenticated `/` does not render a public page; it resolves product entry | `src/app/page.tsx` lines 17–22 via `resolveAuthenticatedEntryPath` |
| Production unauthenticated `/` was observed as `307 → /login` | `docs/phases/B1-C1-H1-FV-final-verification-evidence.md` §22 |
| Apex host `https://zyntixai.com/` was observed as `308 → https://www.zyntixai.com/` | Same FV §22. **Not implemented in** `vercel.json` or `next.config.ts` (see §11) |
| Discovery record: “no marketing homepage” | `docs/phases/BETA1-LR-0-closed-beta-launch-readiness-discovery.md` §D |
| No `src/app/(marketing)` or `src/app/(public)` route group | Directory inspection |
| No `public/` static directory in the repository | Glob `public/**/*` returned 0 files |
| No `robots.txt`, `sitemap`, `favicon.ico`, or `apple-touch-icon` in the repository | Glob for those names returned 0 files |
| Current unauthenticated landing UI is Sign in | `src/app/login/page.tsx`; brand mark is a text `ZyntixAI` paragraph; `LoginForm` subtitle is “Sign in to continue to ZyntixAI.” |
| Login CSS is reused by register and password recovery | `src/app/register/page.tsx`, `src/app/register/check-email/page.tsx`, `src/app/register/complete/page.tsx`, `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx` import `login/page.module.css` |
| Public registration is fail-closed unless `PUBLIC_REGISTRATION_ENABLED` parses to exact `true` | `src/features/auth/server/public-registration.ts`; `/register` redirects to `/login?registration=disabled` when disabled and no trusted invite (`src/app/register/page.tsx`) |
| Other unauthenticated routes | `/login`, `/register`, `/register/check-email`, `/register/complete`, `/forgot-password`, `/reset-password`, `/invite/accept`, `/auth/callback` |
| No marketing nav or public footer component was found | Login/register pages render `<main>` only; AppShell footer is authenticated closed-beta support (`src/components/app-shell.tsx`) |
| No `next/font`, Tailwind config, or PostCSS config | Search for `next/font` and glob for `tailwind.config.*` / `postcss.config.*` |
| No analytics, consent, or tracking library in application source | Search over `src` for analytics/gtag/plausible/posthog/cookie-consent did not find a visitor tracking layer |
| Root metadata is application-foundation, not a marketing title | `src/app/layout.tsx`: `title: "ZyntixAI"`, `description: "ZyntixAI application foundation"` |

### 5.2 Current authenticated entry architecture

| Finding | Evidence |
| --- | --- |
| Authenticated product Home is `/home`, not `/` | `src/app/(authenticated)/home/page.tsx`; module registry `id: "home", route: "/home"` in `src/features/product-access/domain/module-registry.ts` |
| Route group `(authenticated)` layout is a passthrough | `src/app/(authenticated)/layout.tsx` returns `children` only |
| Home is a bounded Today brief composed from Attention + assigned Tasks | `src/features/daily-operating/server/load-daily-operating-page.ts`; `src/features/daily-operating/domain/compose-daily-operating-brief.ts` |
| Home admission uses `moduleId: "home"` | `load-daily-operating-page.ts` calls `resolveTaskPageOrganization(supabase, orgParam, "home")` |
| Shared resolver default remains `"tasks"` | `src/features/tasks/ui/resolve-task-page-organization.ts` default argument; source lock in `tests/onboarding/product-admission-app-shell.test.ts` |
| Onboarding gate remains on the shared resolver | `redirectIfOrganizationOnboardingIncomplete` in `resolve-task-page-organization.ts`; helper in `src/features/onboarding/server/enforce-product-onboarding.ts` |
| Home states include auth required, no organizations, organization required, error, success, and loading | `src/app/(authenticated)/home/page.tsx`; `src/app/(authenticated)/home/loading.tsx` |
| AppShell is the authenticated chrome: skip-link, brand, Primary nav / Menu, org selector, Log out, `main#main-content`, optional support footer | `src/components/app-shell.tsx`; `src/components/app-shell.module.css` |
| Frozen Home copy | `DAILY_OPERATING_TODAY_SUBTITLE`, `DAILY_OPERATING_CALM_TITLE`, `DAILY_OPERATING_CALM_SUPPORTING` in `compose-daily-operating-brief.ts` |
| Visual freeze for authenticated Today | `docs/phases/B1-C1-H1-SHELL-DESIGN-authenticated-home-visual-freeze.md` |
| Home is not a public marketing page | H1 contract §6.2: “Public marketing website” is out of H1 scope |

### 5.3 Current route / session decision behavior

R1 reproduced the following decision points from source. Public-web work must not silently change them.

**Logged-out visitor to `https://www.zyntixai.com/`**

1. Middleware matcher includes `/` (`src/middleware.ts`).
2. `updateSession` runs `getUser()`. `/` is **not** `isProtectedApplicationPath`, so a logged-out user is **not** redirected by middleware.
3. `src/app/page.tsx` sees `!user` and `redirect("/login")`.
4. Production H1-FV §22 observed `https://www.zyntixai.com/` → `307` → `/login`. That matches the Server Component redirect, not a middleware protected-path redirect.
5. `/login` renders Sign in (`src/app/login/page.tsx`) when no user is present.

**Logged-out visitor to `/home`**

1. `/home` **is** protected (`isDailyOperatingHomePathname`).
2. Middleware `307` → `/login?next=/home` (search preserved on `next`). H1-FV §22: `/home` → `/login?next=%2Fhome`. Optional `reason=session_expired` if a stale auth cookie is present.

**Authenticated visitor hitting `/login`**

1. Middleware: `user && isLogin` → `307` to `/` with **search stripped** (`src/lib/supabase/middleware.ts`; `tests/auth/middleware-auth-redirects.test.ts`).
2. `/` then calls `resolveAuthenticatedEntryPath` → `resolvePostAuthDestination` (`src/features/auth/server/resolve-registration-destination.ts`), including invitation cookies.
3. The login page’s `if (user)` branch uses `resolvePostLoginDestination` (`src/features/auth/server/resolve-authenticated-landing.ts`) as defense in depth. The primary bounce path after middleware is `/` + `resolveAuthenticatedEntryPath`, not the login `next` query (which middleware discarded).

**Membership / onboarding / organization landing** (`resolveAuthenticatedLanding` / `resolveOrganizationLanding`):

| Condition | Destination |
| --- | --- |
| Unverified email | `/register/check-email` (`resolvePostAuthDestination`) |
| Trusted invitation auth context | `/invite/accept` |
| Zero memberships + invitation admission path | `/invite/accept` |
| Zero memberships otherwise | `/register/complete` |
| One membership, onboarding incomplete | Onboarding stage path for that org |
| One membership, onboarding complete | `buildProductDestination` → `/home?org=` (`src/features/onboarding/domain/onboarding-steps.ts`) |
| Multiple memberships | `/home` (no org preselected) |

**`?org=` on Home:** `loadDailyOperatingPage` → `resolveTaskPageOrganization(..., "home")` → `resolveSelectedOrganization`. Foreign org does not silently fall back. Incomplete onboarding redirects via `redirectIfOrganizationOnboardingIncomplete` before the brief.

| Actor | Unauthenticated | Authenticated |
| --- | --- | --- |
| `src/middleware.ts` | Delegates to `updateSession` | Same |
| `src/lib/supabase/middleware.ts` | If path is protected: `307` to `/login?next=…`; optional `reason=session_expired` | Authenticated `/login` → `/`; authenticated `/register` → `/` or `/register/check-email` if unverified; unverified users blocked from protected product routes |
| Protected-path helper | `isProtectedApplicationPath` in `src/features/auth/server/safe-return-path.ts` | Includes `/home` via `isDailyOperatingHomePathname`. **Does not include `/`.** |
| Root page | `/` → `/login` | `resolveAuthenticatedEntryPath` → membership/onboarding-aware path |
| Login page | Renders sign-in | Server redirect via `resolvePostLoginDestination` if the page is reached with a user |
| Auth callback | `src/app/auth/callback/route.ts` uses `resolvePostAuthDestination` and `resolveCanonicalRedirectOrigin` | Same |

### 5.4 Layouts, providers, and global style

| Surface | Finding | Evidence |
| --- | --- | --- |
| Root layout | HTML shell, `lang="en"`, imports global CSS, no providers | `src/app/layout.tsx` |
| Global tokens / fonts | CSS custom properties and `system-ui` stack on `:root`; body background `#f8fafc` | `src/app/globals.css` |
| No React provider tree, theme provider, or error boundary at root | Root layout has no wrapping providers; no root `error.tsx` / `not-found.tsx` found | Directory inspection of `src/app` |
| Shared UI primitives | Alert, Button, Surface, Badge, EmptyState, form controls | `src/components/ui/*` |
| Home error state uses `Alert` | `src/app/(authenticated)/home/page.tsx` | Shared primitive risk |

### 5.5 Existing public-web assets or components

| Surface | Finding |
| --- | --- |
| Marketing components | None found |
| Public-only tokens | None found; login uses `page.module.css` + `login-form.module.css` plus global tokens |
| Public assets | No repository `public/` tree; H1-FV recorded production 404s for `/favicon.ico` and `/apple-touch-icon.png` |

### 5.6 Relevant evidence and tests

**Authenticated Home closure chain**

| Slice | Path | Recorded result |
| --- | --- | --- |
| Contract | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` | Contract; `/home` owner remains B1-C1 |
| ADMISSION | `docs/phases/B1-C1-H1-ADMISSION-independent-home-admission-evidence.md` | PASS |
| TRUTH | `docs/phases/B1-C1-H1-TRUTH-truthful-home-actions-evidence.md` | PASS |
| SHELL-DESIGN | `docs/phases/B1-C1-H1-SHELL-DESIGN-authenticated-home-visual-freeze.md` | Frozen |
| SHELL | `docs/phases/B1-C1-H1-SHELL-responsive-authenticated-home-evidence.md` | PASS |
| COMPOSITION | `docs/phases/B1-C1-H1-COMPOSITION-relevant-work-preservation-evidence.md` | PASS |
| R1-C1 | `docs/phases/B1-C1-H1-R1-C1-skip-link-responsive-contract-reconciliation-evidence.md` | PASS |
| R1 | `docs/phases/B1-C1-H1-R1-integrated-home-hardening-regression-evidence.md` | PASS at product SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| PROD | `docs/phases/B1-C1-H1-PROD-production-home-verification-evidence.md` | PASS on production product SHA `d110b6e3…` |
| PROD-C1 | `docs/phases/B1-C1-H1-PROD-C1-authoritative-browser-contract-reconciliation-evidence.md` | PASS; `npm run test:browser:b1-c1` 3/3 |
| FV | `docs/phases/B1-C1-H1-FV-final-verification-evidence.md` | `PASS — B1-C1-H1-FV DAILY OPERATING HOME HARDENING CLOSED WITH EVIDENCE`; published at `49cd577…` |

**Named tests that later public-web implementation must not regress without evidence**

| Command / files | Why they matter |
| --- | --- |
| `npm run test:browser:b1-c1` → `tests/browser/b1-c1-production-home.{desktop,tablet,mobile}.spec.ts` | Authoritative authenticated Production Home browser gate (H1 T15) |
| `tests/browser/helpers/daily-operating.ts` | Shared Production Home helper; PROD-C1 contract |
| `tests/ui/daily-operating-browser-helper-contract.test.ts` | Helper/subtitle contract |
| `tests/features/daily-operating/*.ts(x)` | Home loader, composition, UI truth |
| `tests/onboarding/product-admission-app-shell.test.ts` | `/home` uses `"home"`; layout remains passthrough |
| `tests/ui/appshell-customers-terminology.test.tsx` | Skip-link, pending nav, Menu, Home current |
| `tests/features/product-access/beta1-4tg-appshell-gating.test.ts` | Fail-closed nav |
| `tests/ui/tasks-ui-responsive-contract.test.ts` | Responsive overlay contract used by H1-FV |
| `tests/auth/entry-routing-and-login-ui.test.tsx` | Root `/` unauthenticated and authenticated redirects |
| `tests/auth/middleware-auth-redirects.test.ts` | Middleware login/root bounce |
| `tests/auth/resolve-authenticated-landing.test.ts` | Post-auth landing |
| `tests/auth/auth-callback.test.ts` | Callback / canonical origin |

H1-FV also recorded that onboarding, public website, and general release readiness are **not** closed by H1.

### 5.7 Closure-status reconciliation

Inspected facts:

1. Commit `49cd5773976143139a154f9b8ddf36535a4dd914` (`docs(home): close daily operating home hardening`) adds only `docs/phases/B1-C1-H1-FV-final-verification-evidence.md` and is the current local and origin HEAD.
2. That FV file’s own PASS line is `PASS — B1-C1-H1-FV DAILY OPERATING HOME HARDENING CLOSED WITH EVIDENCE`.
3. The FV body still says the parent-program line `CLOSED WITH EVIDENCE — B1-C1-H1 AUTHENTICATED HOME HARDENING` was **not used in that FV execution**, because FV required subsequent independent review plus commit/push.
4. The H1 contract §19.3 program-closure string is `CLOSED WITH EVIDENCE — 100% REQUIRED GATES PASSED` plus the H1-FV PASS line.
5. Production product-code SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828` matches the user-supplied authority and the FV/R1/PROD record. FV records that `f799389…` through `49cd577…` are test/docs-only relative to that product SHA.

**Reconciliation used by PW-0.** The product and route baseline is unambiguous: `/home` is the accepted authenticated Home; product runtime SHA is `d110b6e3…`; FV dossier is published at `49cd577…`. The PW-0 governing prompt supplies the independent-review parent status after that publication. PW-0 treats authenticated Home as closed and protected. It does not reopen H1, rewrite H1 evidence, or treat the status-string variance as permission to change Home.

This is a documentation labeling variance, not an ambiguity about which files and routes are protected. See PW0-RQ-001.

---

## 6. Protected-Boundary Register

Classification model:

- **P0 — FROZEN AUTHENTICATED BOUNDARY.** No public-web modification without a separate reopening authority. No indirect behavioral change through shared dependencies. Authenticated regression evidence is mandatory in every later implementation phase.
- **P1 — CONTROLLED SHARED BOUNDARY.** No change during PW-0 through PW-12. Later change requires explicit implementation authorization, impact analysis, and authenticated regression evidence. Public-only alternatives are preferred.
- **P2 — PUBLIC-WEB CANDIDATE SURFACE.** Isolated, or currently absent, unauthenticated/public surface. Classification does **not** authorize modification.
- **U — UNRESOLVED.** Treated as protected until resolved. Required before implementation planning can pass.

| ID | Classification | Route/File/Component | Responsibility | Why protected or controlled | Public-web risk | Allowed during PW-0 | Later change authority | Required regression evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW0-PB-001 | P0 | `/home` · `src/app/(authenticated)/home/page.tsx` | Authenticated Today page and state matrix | Closed H1 product entry | Restyling or replacing it would reopen Home | No | Separate H1 reopening authority only | H1 Home states; `test:browser:b1-c1`; daily-operating tests |
| PW0-PB-002 | P0 | `src/app/(authenticated)/home/loading.tsx` · `loading.module.css` | Home loading chrome; pending AppShell | H1 loading honesty | Shared-shell or CSS edits can change Home loading | No | H1 reopening | Loading contract; AppShell pending tests |
| PW0-PB-003 | P0 | `src/app/(authenticated)/home/page.module.css` | Home page layout | SHELL-DESIGN / SHELL freeze | Visual regression on Today | No | H1 reopening | 1440/390 overflow; SHELL evidence |
| PW0-PB-004 | P0 | `src/features/daily-operating/server/load-daily-operating-page.ts` | Home server composition loader | Admission `moduleId: "home"`; no service-role | Changing loader coupling would reopen ADMISSION | No | H1 reopening | `tests/features/daily-operating/load-daily-operating-page.test.ts`; source lock |
| PW0-PB-005 | P0 | `src/features/daily-operating/domain/compose-daily-operating-brief.ts` | Frozen copy, section cap 5, calm rules, Home pathname helper | TRUTH + COMPOSITION freeze | Copy or composition change is a Home reopen | No | H1 reopening | daily-operating domain/UI tests; helper contract |
| PW0-PB-006 | P0 | `src/features/daily-operating/ui/daily-operating-brief.tsx` · `daily-operating-brief.module.css` | Today brief UI and actions | TRUTH link matrix | Public restyle via shared CSS/tokens could alter Home | No | H1 reopening | `daily-operating-brief-ui.test.tsx` |
| PW0-PB-007 | P0 | `src/features/daily-operating/ui/daily-operating-organization-required-panel.tsx` | Org-selection required state | H1 org-isolation presentation | Indirect chrome/token change | No | H1 reopening | Loader organization_required tests |
| PW0-PB-008 | P0 | `src/components/app-shell.tsx` · `src/components/app-shell.module.css` | Authenticated chrome including skip-link, Menu, Home-current, pending | SHELL freeze; used by Home and other product pages | Any AppShell change is an authenticated Home change | No | H1 reopening plus product-shell impact analysis | AppShell tests; `test:browser:b1-c1`; skip-link contract |
| PW0-PB-009 | P0 | `src/features/tasks/ui/resolve-task-page-organization.ts` | Shared org admission; Home passes `"home"`; default `"tasks"` | Direct Home admission path | Changing default or gate would break Home and Tasks | No | Separate admission authority; not PW | product-admission-app-shell; Home loader tests |
| PW0-PB-010 | P0 | `src/features/onboarding/server/enforce-product-onboarding.ts` | Incomplete orgs never remain on product Home | H1 invariant 6; ENG-ONB-1H-P1-D | Public routing “simplification” could skip the gate | No | Onboarding authority; not PW | Onboarding admission tests; Home incomplete-org case |
| PW0-PB-011 | P0 | `src/features/product-access/domain/module-registry.ts` (`id: "home"`) · `module-access.ts` (`FAIL_CLOSED_MODULE_NAV_VISIBILITY.home === true`) | Home module identity and fail-closed nav | Unresolved context is Home-only, not a CS fallback | Changing visibility would reopen APPSHELL-GATING and H1 | No | Product-access authority; not PW | `beta1-4tg-appshell-gating.test.ts` |
| PW0-PB-012 | P0 | `src/app/(authenticated)/layout.tsx` | Authenticated group passthrough | Source lock: no second admission system in this layout | Adding public chrome here would wrap all product pages | No | Explicit product-shell authority | product-admission-app-shell layout assertion |
| PW0-PB-013 | P0 | `src/components/org-aware-link.tsx` | Preserve `?org=` on authenticated nav | H1 outbound-link / tenant contract | Changing it affects Home and all AppShell nav | No | Product-shell authority | AppShell / org-link tests; tenant isolation |
| PW0-PB-014 | P0 | H1 contract and evidence dossier listed in §5.6 | Acceptance and visual freeze for `/home` | Closed program; later PW cannot override | Reinterpretation of acceptance | No | Formal H1 reopening procedure (§9) | Reproduce named H1 gates |
| PW0-PB-015 | P0 | `tests/browser/b1-c1-production-home.*.spec.ts` · `tests/browser/helpers/daily-operating.ts` | Production Home browser contract | T15 remaining Home authority | Weakening or skipping these tests would hide Home regressions | No change in PW-0–PW-12 | Test change only with H1-aware implementation approval | Must remain green for any PW implementation that can touch shared surfaces |
| PW0-PB-016 | P0 | `tests/features/daily-operating/*` · `tests/ui/daily-operating-browser-helper-contract.test.ts` · `tests/onboarding/product-admission-app-shell.test.ts` | Home unit/source-lock pack | Direct Home invariants | Public-web must not edit these tests in PW-0 | No | Later PW implementation may add tests, not weaken these | Same pack plus any new authenticated regressions |
| PW0-PB-017 | P1 | `/` · `src/app/page.tsx` | Dual-use entry: unauthenticated → `/login`; authenticated → product landing | Proven shared by tests and middleware bounce to `/` | Replacing this file with a marketing page would break authenticated login bounce | No | PW-13+ with isolation design; prefer not mutating this file | `entry-routing-and-login-ui.test.tsx`; middleware login→`/` test; landing tests |
| PW0-PB-018 | P1 | `src/app/layout.tsx` | Root HTML, metadata, global CSS import | Shared by public and authenticated trees | Metadata/SEO or wrappers would affect Home | No | Explicit shared-layout approval | Authenticated Home render + public page; metadata review |
| PW0-PB-019 | P1 | `src/app/globals.css` | Global tokens, fonts, body, focus, `main` rules | SHELL-DESIGN inventoried this file; Home and login inherit it | Token/font/background change restyles Home | No | Explicit token authority; prefer public-only stylesheet | Home 1440/390; login; skip-link contrast |
| PW0-PB-020 | P1 | `src/middleware.ts` · `src/lib/supabase/middleware.ts` | Session refresh and auth redirects | Controls `/login`, protected `/home`, registration bounce | Matcher or redirect changes can loop, skip Home, or leak routes | No | Separate auth/routing authority | middleware-auth-redirects; Production smokecheck of `/`, `/login`, `/home` |
| PW0-PB-021 | P1 | `src/features/auth/server/safe-return-path.ts` | Allowlist, protected-path set, default return `/` | `/home` is protected; `/` is allowlisted and is the default return | Changing allowlists alters post-login and deep-link behavior | No | Auth authority | `tests/auth/safe-return-path.test.ts`; landing tests |
| PW0-PB-022 | P1 | `src/features/auth/server/resolve-authenticated-landing.ts` · `resolve-registration-destination.ts` | Authenticated landing and root entry resolution | Root page and login depend on these | Public homepage work that “simplifies `/`” can strand users | No | Auth/onboarding authority | `resolve-authenticated-landing.test.ts`; entry-routing tests |
| PW0-PB-023 | P1 | `src/lib/supabase/server.ts` · `src/lib/env/public.ts` | User-scoped Supabase server client | Home reads use this client, not service-role | Client changes affect public and authenticated data access | No | Platform/security authority | Home loader; auth tests; no service-role on Home |
| PW0-PB-024 | P1 | `/login` · `src/app/login/page.tsx` · `src/app/login/page.module.css` · `src/features/auth/ui/login-form.tsx` · `login-form.module.css` | Current unauthenticated landing and shared auth chrome | Current public entry **and** authentication UI | Marketing restyle of login restyles register/recovery and can break sign-in | No | Auth UX authority, not assumed by PW design freeze | Login tests; registration/recovery pages that share CSS |
| PW0-PB-025 | P1 | `/register*` · `src/app/register/**` · `src/features/auth/server/public-registration.ts` | Fail-closed public registration | Closed-beta admission | Public CTA “Create account” can contradict fail-closed flag | No | Registration/invitation authority | `tests/auth/public-registration.test.ts`; `/register` redirect |
| PW0-PB-026 | P1 | `/forgot-password` · `/reset-password` · `/auth/callback` | Recovery and OAuth/email callback | Auth security | Public site must not weaken callback origin or return-path rules | No | Auth authority | `tests/auth/auth-callback.test.ts`; `tests/auth/site-origin.test.ts` |
| PW0-PB-027 | P1 | `src/lib/env/site-origin.ts` | Canonical redirect origin for auth email/callback | Tests pin `https://www.zyntixai.com` | Wrong origin breaks invite cookies and login | No | Platform/auth authority | site-origin and auth-callback tests |
| PW0-PB-028 | P1 | `src/features/auth/actions/auth-actions.ts` | Login/logout/register server actions | Session mutation | Public forms must not bypass existing actions | No | Auth authority | `tests/auth/auth-actions.test.ts` |
| PW0-PB-029 | P1 | `src/components/ui/*` | Shared primitives used by Home (`Alert`) and auth forms | Shared by public and authenticated UI | Restyling primitives restyles Home | No | Prefer public-only components | Home error/empty; login forms |
| PW0-PB-030 | P1 | `next.config.ts` · `vercel.json` · `playwright.config.ts` · `package.json` | Runtime, host, browser QA base URL, dependencies | `playwright.config.ts` defaults to `https://www.zyntixai.com`; `vercel.json` is `{ "crons": [] }` | Config edits can change routing, deploy, or Home QA | No | Separate platform approval | Build; Home browser gate; production smokecheck |
| PW0-PB-031 | P1 | `src/app/onboarding/**` · invitation routes `/invite/accept*` | Admission before or instead of Home | Adjacent closed programs; root resolver may send users here | Public “start here” CTAs can collide with invite/onboarding | No | Onboarding/invitation authority | Onboarding P1-D tests; invite tests |
| PW0-PB-032 | P2 | Absent `src/app/(marketing)` / `src/app/(public)` | Candidate class for a **future** isolated public route group | Directory inspection: those groups do not exist today. This is not a claim that an isolated public surface already exists. | Creating public pages under `(authenticated)` or by replacing `/` without preserving the authenticated bounce is a P0/P1 hit | No | Design freeze + PW-13 implementation approval, only as an isolated public tree | Must prove `/home` and `/` authenticated bounce unchanged |
| PW0-PB-033 | P1 | Absent repository `public/` assets, including `/favicon.ico` and `/apple-touch-icon.png` | Shared browser chrome / brand files | H1-FV §22 and §26 recorded production 404s as public-web follow-up. Files are not in Git. A favicon or `apple-touch-icon.png` would appear on **all** routes, including authenticated `/home`. Middleware already special-cases `favicon.ico` and `*.png`. | Not an isolated public surface. Adding these files changes authenticated and unauthenticated browser chrome | No | Later implementation approval with shared-chrome impact analysis; not P2 | Unauthenticated and authenticated loads; `/` and `/home` redirects unchanged; Home tab icon must not be treated as Home product restyle without H1 review |
| PW0-PB-034 | U | Apex `zyntixai.com` → `www.zyntixai.com` 308 | Canonical-host behavior | Observed in H1-FV production smokecheck; **not** expressed in `vercel.json` or `next.config.ts` | Public-web “canonical URL” work might duplicate or break host rules owned outside this repo | No | Resolve ownership before PW-13 | Production `curl -sI --max-redirs 0` for apex and www |
| PW0-PB-035 | U | `isProtectedApplicationPath` vs `src/app/(authenticated)/**` | Middleware protected-path set | `/home` is included. Projects, sites, work-orders, dispatch, products, orders, inventory, fulfillment are in the authenticated route group but **not named** in `isProtectedApplicationPath`. Ownership of that gap is not proven here. | Public-web must not “fix” middleware as a side effect | No | Separate routing/security resolution | Do not treat as PW scope; if later touched, full protected-route matrix |
| PW0-PB-036 | U | Future public homepage vs root resolver | Whether unauthenticated `/` becomes a page while authenticated `/` stays a resolver | Dual-use of `src/app/page.tsx` is proven; the later architecture is not chosen | Choosing replacement over isolation would hit P1/P0 | No | PW-13 after design freeze | Explicit architecture decision record |
| PW0-PB-037 | U | Login visual/brand ownership | Whether later public brand work may restyle `/login` | Login is the current public landing and an auth surface | Undeclared restyle would mix trajectories | Treat as P1 until resolved | PW-3 and design freeze must say yes or no | Login + Home regression if shared CSS/tokens are involved |

**PW-0–PW-12 rule for every P1 row:** no change. **Rule for every U row:** treat as protected until resolved. Do not implement against the uncertainty. Each U item’s latest resolution gate is in §6.1. A U item blocks only the work that depends on it; it does not leave authenticated `/home` materially uncertain.

### 6.1 Unresolved-boundary governance

A `U` item may remain open after PW-0 only when it is treated as protected, no implementation depends on it yet, impact and required evidence are recorded, a latest resolution phase is assigned, and it does not leave the authenticated Home boundary materially uncertain.

| ID | Surface | Exact uncertainty | Potential impact | Temporary protection rule | Evidence needed | Resolution owner/phase | Latest resolution gate | Blocking status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW0-PB-034 | Apex `zyntixai.com` → www 308 | Redirect is production-observed (H1-FV §22) and **not** present in `vercel.json` or `next.config.ts`. Owner (DNS / Vercel / other platform) is not proven in this repo. | Duplicate or conflicting canonical-host rules; broken apex or www entry | Do not add, change, or “fix” host redirects, `NEXT_PUBLIC_SITE_URL` semantics, or deploy-host config in any PW phase until ownership is proven | Platform/config owner; reproduce H1-FV `curl -sI --max-redirs 0` for apex and www | Platform/release owner; record before any host-behavior implementation | PW-13 if the implementation slice touches hosts or canonical URLs; otherwise before any host change | **Does not block PW-1.** Does not block isolated public-site design. **Does not block PW-13** of an isolated public tree that does not change hosts. **Blocks** host/canonical-redirect implementation. **Not a P0 Home ambiguity.** |
| PW0-PB-035 | `isProtectedApplicationPath` vs `(authenticated)` routes | `/home` is named and protected. Projects, sites, work-orders, dispatch, products, orders, inventory, and fulfillment live under `src/app/(authenticated)/` but are not named in `isProtectedApplicationPath`. Whether that gap is intentional is not proven here. | A public-web middleware edit could “complete” or further weaken the list as a side effect | Do not modify middleware, the matcher, or `isProtectedApplicationPath` in PW-0–PW-12. Public-web must not treat this as in-scope cleanup | Separate routing/security authority; full protected-route matrix if ever touched | Security/routing owner, outside public-web unless a later prompt explicitly includes it | Before any middleware edit | **Does not block PW-1, design, or PW-13 isolated public pages.** **Blocks** middleware changes. `/home` remains protected. **Not a P0 Home ambiguity.** |
| PW0-PB-036 | Future public homepage vs root resolver | Current dual-use of `src/app/page.tsx` is proven (P1). Whether a later public page replaces that file or is isolated elsewhere is not chosen | Replacing `/` would break authenticated `/login` → `/` bounce and membership/onboarding landing | Do not change `src/app/page.tsx`. Prefer a new isolated public route/layout if a public page is later approved | Written architecture decision: public page isolation vs dual-use `/` | PW-13 after design freeze | PW-13 before any edit to `src/app/page.tsx` | **Does not block PW-1.** Does not block design of an isolated public surface that is **not** a replacement of `/`. **Blocks** designing or implementing `/` as a replacement homepage. **Not a P0 Home ambiguity.** |
| PW0-PB-037 | Login visual/brand ownership | `/login` is the current unauthenticated landing **and** the auth UI (already P1 as PW0-PB-024). Whether later public brand work may restyle it is not decided | Undeclared login restyle can break sign-in and shared register/recovery CSS | Treat login as P1. No restyle, copy rewrite, or shared-CSS change until a later authority says yes or no | Explicit yes/no in PW-3 and/or design freeze | PW-3 and design freeze; implementation only after that decision | Design freeze before any login visual implementation | **Does not block PW-1 product-truth work.** Constrains design of login restyle. **Blocks** login implementation. **Not a P0 Home ambiguity.** |

---

## 7. Authenticated Home Invariants

Future public-web work must preserve the following. Each row is an observable behavior or accepted contract. Breaking any invariant is a stop condition for later PW implementation. Unsupported claims are not listed.

| ID | Invariant | Evidence | Public-web regression path | Required protection evidence |
| --- | --- | --- | --- | --- |
| PW0-INV-001 | Authenticated completed users continue to reach the accepted `/home` Today shell, not a marketing page | H1 contract §2, §5, §13; `src/app/(authenticated)/home/page.tsx`; `buildProductDestination` → `/home?org=`; landing tests | Replacing `/` or AppShell with marketing chrome; sending completed users to a public page | `tests/auth/entry-routing-and-login-ui.test.tsx`; `tests/auth/resolve-authenticated-landing.test.ts`; `npm run test:browser:b1-c1` |
| PW0-INV-002 | `/home` remains the only authenticated product Home; no second dashboard or per-target Home | H1 contract invariants 2–3; 4TG freeze cited by the contract | Adding `/dashboard` or a public “home” that collides with product Home | Route inventory; H1 contract still cited; no new Home route |
| PW0-INV-003 | Unauthenticated `/` continues to have a deliberate, deterministic destination until a later approved architecture replaces it without harming the authenticated bounce | `src/app/page.tsx`; entry-routing test; H1-FV §22 `307 → /login` | Changing `/` to render marketing without keeping authenticated resolution | Entry-routing test; production smokecheck of `/` |
| PW0-INV-004 | Authenticated visits to `/login` continue to resolve through `/` to membership/onboarding-aware product entry | Middleware `user && isLogin` → `/`; `resolveAuthenticatedEntryPath`; middleware-auth-redirects test | Public routing “simplification” that leaves authenticated users on `/login` or skips `/` | Middleware test; landing tests |
| PW0-INV-005 | Unauthenticated `/home` continues to redirect to login with safe `next` | `isProtectedApplicationPath`; H1-FV §22 `/home` → `/login?next=%2Fhome` | Matcher or protected-path edits | Middleware tests; production `/home` smokecheck |
| PW0-INV-006 | Session expiry continues to be marked when a stale auth cookie is present on protected routes | `updateSession` `reason=session_expired`; middleware tests | Cookie/session helper changes for a public site | Middleware expired-session test |
| PW0-INV-007 | Incomplete onboarding never remains on Today | `redirectIfOrganizationOnboardingIncomplete`; H1 invariant 6; ENG-ONB-1H-P1-D | Bypassing the gate from a public “enter product” CTA | `tests/onboarding/product-admission-app-shell.test.ts`; Home incomplete-org case |
| PW0-INV-008 | Foreign `?org=` never returns that org’s data and never silently substitutes another organization | H1 invariant 7; `resolveSelectedOrganization` via Home loader | Changing org query handling on shared links | Home loader tests; tenant isolation tests |
| PW0-INV-009 | Home admission remains `moduleId: "home"`; Tasks default remains `"tasks"` | ADMISSION evidence; `tests/onboarding/product-admission-app-shell.test.ts` | Shared-resolver default change | Source-lock test; Home loader tests |
| PW0-INV-010 | Unresolved operating-model context remains Home-only nav, not a Course Seller fallback | APPSHELL-GATING; `FAIL_CLOSED_MODULE_NAV_VISIBILITY` | Changing fail-closed nav for a public IA | `tests/features/product-access/beta1-4tg-appshell-gating.test.ts` |
| PW0-INV-011 | AppShell remains the authenticated chrome: skip-link before header, `main#main-content`, pending hides Primary and Menu, desktop cluster hidden below 960px, mobile `<details>` Menu | SHELL / SHELL-DESIGN; `src/components/app-shell.tsx` | Restyling AppShell or globals as if they were public chrome | `tests/ui/appshell-customers-terminology.test.tsx`; `test:browser:b1-c1` |
| PW0-INV-012 | Frozen Today subtitle and calm copy remain exactly as in `compose-daily-operating-brief.ts` | TRUTH; `tests/ui/daily-operating-browser-helper-contract.test.ts` | Token/copy “brand alignment” leaking into Home | Helper contract; daily-operating UI tests |
| PW0-INV-013 | Calm state remains allowed only when both Attention and Tasks queries succeed and `hasAnyActionable === false` | TRUTH; `isDailyOperatingCalmState` | Changing composition or empty-state copy | daily-operating domain/UI tests |
| PW0-INV-014 | Outbound Home links remain derived from server `moduleNavVisibility`; no universal Leads | H1 contract §8; TRUTH evidence | Shared link/button restyle that hardcodes module CTAs | `tests/features/daily-operating/daily-operating-brief-ui.test.tsx` |
| PW0-INV-015 | Home reads remain user-scoped Supabase session client; no service-role on Home render | ADMISSION; FV §25; source lock | New public data loaders that change the shared server client | Source lock; Home loader tests |
| PW0-INV-016 | Loading, error, empty, org-required, and success Home states remain honest and distinct | `src/app/(authenticated)/home/page.tsx`; `loading.tsx` | Shared Alert/token/loading chrome changes | Home state tests; AppShell pending tests |
| PW0-INV-017 | Accepted Home layout and responsive behavior remain unchanged at the contracted 1440 and 390 viewports with no horizontal overflow | SHELL / R1 / PROD / FV; `tests/ui/tasks-ui-responsive-contract.test.ts` | Global CSS, fonts, or `main` rules | 1440/390 evidence; `test:browser:b1-c1` |
| PW0-INV-018 | Roles remain `owner \| admin \| staff \| viewer`; Home does not invent capabilities | H1 invariant 11 | Marketing role language leaking into product chrome | Home identity presentation; no new role enum |
| PW0-INV-019 | Public-web work does not present authenticated Home as the public website | This charter; H1 §6.2 “Public marketing website” | Using `/home` as the marketing landing | Architecture review; `/` and `/home` remain distinct |
| PW0-INV-020 | Home composition sources remain Attention + assigned Tasks; section cap 5; no KPI, chart, feed, or AI ranking on Home | H1 contract invariants 3–4; COMPOSITION evidence; `DAILY_OPERATING_SECTION_LIMIT` | Adding marketing widgets to Home or shared composition | daily-operating composition tests |
| PW0-INV-021 | Logout from AppShell continues to sign out and redirect to `/login` | `logoutAction` in `src/features/auth/actions/auth-actions.ts` (`redirect("/login")`) | Changing auth-actions for a public header | `tests/auth/auth-actions.test.ts`; AppShell logout control remains |
| PW0-INV-022 | Multi-org authenticated landing remains `/home`; single completed org remains `/home?org=` | `resolveAuthenticatedLanding`; `buildProductDestination`; entry-routing tests | Root-page rewrite that always sends users to a public page | Landing + entry-routing tests |
| PW0-INV-023 | `(authenticated)` layout remains a passthrough with no second admission system | `src/app/(authenticated)/layout.tsx`; product-admission-app-shell test | Wrapping product pages in a public layout | Source-lock layout assertion |

---

## 8. Public-Web Change Rules

These rules bind all later PW phases.

1. **No product-code implementation before approved design freeze.** PW-0 through the design phases are not implementation authority. PW-13 plans; a later implementation slice executes only after written implementation approval.
2. **Isolate public functionality from authenticated functionality.** Prefer a new public-only route group, layout, and styles over mutating `/`, AppShell, Home, or global tokens.
3. **Shared-boundary changes require explicit justification.** A P1 change is forbidden unless a named implementation contract explains why a public-only alternative is impossible.
4. **All shared changes require authenticated regression evidence.** Minimum: H1 Home unit pack, AppShell/skip-link tests, `entry-routing` and middleware tests, and `npm run test:browser:b1-c1` when the change can affect Home chrome, routing, or session. Browser and production gates follow B1-GATE.1 whenever the change is user-visible.
5. **No public claim without PW-1 authority.** PW-0 does not decide whether product claims are true.
6. **No unsupported target-group availability.** Do not present TG1–TG4 as fully available on the public site unless PW-1 records evidence for that public claim.
7. **No chatbot-first product representation.** Public-web must not describe ZyntixAI as only an AI chatbot.
8. **No hidden expansion of scope.** New routes, analytics, cookies, tracking, fonts, tokens, or auth-adjacent CTAs are new scope and need their own approval.
9. **No dependency or platform changes without separate approval.** Includes lockfiles, Next, Playwright, Vercel, Supabase, and env contracts.
10. **No commit, push, deployment, or production mutation unless explicitly requested** by a later governing prompt.
11. **Do not reopen H1.** A later public-web requirement cannot silently override a closed authenticated authority.
12. **Unresolved (`U`) items are treated as protected until resolved.**
13. **Classification is not permission.** P2 means “candidate,” not “approved to edit.”
14. **Accessibility, performance, product-truth, and regression gates apply** to any later public-web implementation.
15. **Design approval is not implementation approval.** Implementation approval is not deployment or publication approval.
16. **Later implementation contracts must include a rollback plan and a production-verification plan** before user-visible public-web code may ship.

### 8.1 Shared-surface impact analysis (mandatory before any P1 edit)

No P1 surface may be modified without a written impact analysis covering all of the following that the surface can reach:

| Surface | Can affect authenticated routing | onboarding | org selection | session | login recovery | AppShell appearance | global typography | component states | accessibility | performance | canonical URLs | production redirects |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/app/page.tsx` | Yes | Yes (entry path) | Yes (landing) | No directly | Indirect | No | No | No | Indirect | Redirect cost | No | Yes (`/` → `/login`) |
| `src/app/layout.tsx` | Indirect | No | No | No | Metadata on login | Yes (wraps Home) | Yes | Possible providers | Yes | Yes | Metadata | No |
| Middleware / session helpers | Yes | Yes | Indirect | Yes | Yes | No | No | No | Focus after redirect | Yes | Possible host | Yes |
| Landing resolvers | Yes | Yes | Yes | No | Indirect | No | No | No | Redirect UX | Yes | No | Yes |
| `/login` and shared login CSS | Bounce if changed | No | No | Sign-in | Yes | No | If tokens used | Form states | Yes | Yes | No | Login 200 |
| `globals.css` | No | No | No | No | Visual | Yes | Yes | Yes | Focus rings | Yes | No | No |
| Shared UI primitives | No routing | No | Selector controls | No | Forms | Alert on Home | Possible | Yes | Yes | Yes | No | No |
| `OrgAwareLink` | Org query on nav | No | Yes | No | No | Nav hrefs | No | Current-org | Yes | No | No | No |
| `site-origin.ts` | Auth redirects | Invite continuation | No | Cookies/host | Callback | No | No | No | No | No | Yes | Yes |
| Favicon / `public/` icons | No | No | No | Matcher exception | Tab chrome | Tab chrome on Home | No | No | No | Asset load | Possible | Matcher |
| Root metadata | No | No | No | No | Document title | Document title | No | No | Title | No | SEO canonical if added | No |

Providers: none exist at root today (`src/app/layout.tsx`). Introducing a provider is a new P1 change with Home impact.

Authenticated regression minimum after any such edit remains §8 rule 4.

---

## 9. Governance and Decision Rights

### 9.1 Source-of-truth hierarchy

Later documents may add detail. They may not delete a higher authority.

1. This PW-0 charter for public-web boundaries and H1 non-reopening.
2. Closed B1-C1-H1 contract + slice evidence for authenticated `/home` behavior and visual freeze.
3. `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` for phase completion, evidence, publication, and rollback.
4. Adjacent closed authorities that Home or entry routing depend on (B1-C1, ENG-ONB-1H-P1-D, BETA1-4TG-APPSHELL-GATING, public-registration fail-closed, invitations).
5. Later PW phase documents (PW-1, PW-2, PW-3, design freeze, PW-13), each subordinate to this charter.

A later public-web requirement **cannot silently override** a closed authenticated authority.

### 9.2 Phase-by-phase approval

Each PW phase needs its own prompt/contract, evidence file, and gate result. Completing PW-0 does not start PW-1.

### 9.3 AND-logic for acceptance gates

Every PW phase, including this one, uses AND logic: one failed mandatory condition means the phase is not closed. B1-GATE.1 Gate catalog applies to later technical/implementation slices. PW-0 is documentation-only; browser/production gates are **not required for PW-0** because no user-visible product change is shipped. They **are required** for later user-visible public-web implementation.

### 9.4 P0 blocker handling

A P0 ambiguity, H1 invariant break, or unprotected shared change **blocks** the current PW slice. The correct response is stop, record, and obtain a new authority. Do not reclassify a P0 as polish to proceed.

### 9.5 Evidence requirements

Later implementation evidence must include: exact files changed; impact analysis on P0/P1; authenticated regression commands and results; public-surface checks; security/tenant notes if routing or cookies change; rollback assessment; clean publication per B1-GATE.1 Gate 10 when publication is separately authorized.

### 9.6 Change-control process

1. Identify the target surface in this register.
2. If P0: stop unless a reopening authority exists.
3. If U: resolve first; treat as protected until then.
4. If P1: write impact analysis; prefer a public-only alternative; obtain implementation authorization beyond PW-0–PW-12.
5. If P2: still wait for design freeze and implementation approval.
6. Execute only the allowlisted files.
7. Produce regression evidence before claiming done.

### 9.7 Reopening procedure for protected authenticated scope

To modify a P0 authenticated Home surface:

1. Named governing prompt that explicitly reopens the cited H1 slice.
2. Restatement of which H1 invariants remain vs are being changed.
3. New tests that fail before the change and pass after, plus the existing H1 pack.
4. Browser and production Home verification if user-visible.
5. New evidence file; do not rewrite closed H1 evidence in place.

Public-web desire is not a reopening authority.

### 9.8 Rollback and production-verification requirement for later implementation

Any later PW implementation contract must name:

1. a rollback boundary (git revert of the PW slice; redeploy the prior Ready deployment if production was mutated);
2. a production-verification plan when the change is user-visible (B1-GATE.1 Gates 7–8), including authenticated Home regression on `https://www.zyntixai.com` when shared surfaces are involved.

H1 shipped no schema; public-web must not introduce migrations that cannot be rolled back without a separate data authority.

### 9.9 Design approval vs implementation approval vs deployment approval

| Approval | Meaning |
| --- | --- |
| Design freeze | Visual/content contract for a public surface. Still not permission to edit product code. |
| Implementation approval | Named allowlist of files, tests, and gates. Required before coding. |
| Publication / deployment approval | Separate commit/push/deploy request. Implementation approval is **not** deployment approval. |

---

## 10. Future Phase Handoffs

| From PW-0 | To | PW-0 has decided | PW-0 deliberately does not decide |
| --- | --- | --- | --- |
| Boundary freeze | **PW-1 Product Truth & Claims Register** | What is protected; that claims need evidence; chatbot-first is forbidden; four-group availability is not auto-public | Which product facts may be claimed; whether TG1–TG4 are publicly “available” |
| | **PW-2 Visitor Goals & Journey Map** | Visitor is unauthenticated; current real journey is `/` → `/login` (and invite/register when enabled) | Desired future journeys, IA, or CTAs |
| | **PW-3 Positioning & Messaging** | Product category for governance: Business Operating System; Home is not the public site | Taglines, narrative, or homepage copy |
| | Later design phases | Constraints: isolate from Home/AppShell; do not restyle Home; login is P1 | Wireframes, visual system, component library |
| | **PW-13 implementation planning** | Dual-use `/`; no marketing route group yet; P1/P0 map; U items that must be resolved first | File allowlist, sequence, or implementation start |

PW-0 does not start PW-1. Wait for review and separate authorization.

---

## 11. Risks and Unresolved Questions

| ID | Item | Severity | Impact | Required resolution | Latest phase |
| --- | --- | --- | --- | --- | --- |
| PW0-RQ-001 | H1 parent status-string variance (FV withholds parent line; contract uses B1-GATE.1 wording; PW-0 prompt uses `CLOSED WITH EVIDENCE — B1-C1-H1 AUTHENTICATED HOME HARDENING`) | Medium (documentation) | None on product files if H1 is not reopened. Confusion if a later agent treats FV’s “not used” sentence as “Home still open.” | This charter: Home is closed and protected; do not reopen. Optional later docs-only H1 status note is outside PW-0 allowed mutation. | Before any H1-adjacent edit; not a PW-1 blocker |
| PW0-RQ-002 | Dual-use `/` (`src/app/page.tsx`) | High | A naive public homepage implementation would break authenticated login bounce | Architecture decision: isolate public page vs keep resolver; record in PW-13 | PW-13 |
| PW0-RQ-003 | Apex→www 308 not in repo config | Medium | Canonical-host edits might fight platform config | Prove owner (Vercel/DNS vs app) before changing host behavior | PW-13 |
| PW0-RQ-004 | Middleware protected-path set does not name every `(authenticated)` route | Medium | Public-web must not “complete” that list as a side effect; security ownership is unresolved | Separate routing/security resolution; treat as U/protected | Before any middleware edit; not required to start PW-1 |
| PW0-RQ-005 | No isolated public surface exists yet | Medium | Implementation will be greenfield; temptation to reuse login/AppShell/globals | Design freeze must specify public-only layout/CSS | Design freeze + PW-13 |
| PW0-RQ-006 | Login is both current public landing and auth UI | High | Brand work on `/login` can break sign-in and shared auth CSS | PW-3 and design freeze must accept or forbid login restyle | Design freeze |
| PW0-RQ-007 | Root metadata is shared (`ZyntixAI application foundation`) | Medium | SEO changes in root layout affect authenticated pages | Public metadata should live on a public-only layout if later approved | PW-13 |
| PW0-RQ-008 | Production runtime SHA `d110b6e3…` is not HEAD; HEAD is docs/tests-equivalent per FV | Low | Public-web must not assume HEAD is what production executes for product code | Keep using FV SHA-equivalence analysis; no PW-0 deploy | Before any production mutation |
| PW0-RQ-009 | No AGENTS.md / contributor route map | Low | Future agents may miss this charter if indexes are not updated | PW-0 is forbidden from editing indexes; later docs-index work needs its own approval | Optional follow-up docs slice |
| PW0-RQ-010 | Historical icon 404s (`/favicon.ico`, `/apple-touch-icon.png`) | Low | Shared browser chrome missing; not an H1 blocker | Later P1 implementation with Home-tab impact analysis; not isolated P2 | Later implementation after explicit approval |
| PW0-RQ-011 | Four-target-group **product** evidence exists (`BETA1-4TG-MASTER-FV`) while **public** availability remains unapproved | High if ignored | Public site could over-claim | PW-1 must separate product-closed from public-claim-allowed | PW-1 |
| PW0-RQ-012 | No analytics/consent layer found | Medium | Later “just add tracking” would be new shared scope | Separate privacy/analytics authority | Before any tracking implementation |

---

## 12. Acceptance Gate

PW-0 uses AND logic. One failed mandatory condition means PW-0 is not closed.

| # | Mandatory condition | Result |
| --- | --- | --- |
| 1 | Repository preflight matched the expected baseline | **PASS** — branch, HEAD, upstream SHA, `0 0`, clean worktree |
| 2 | Authenticated closure authority was found and reconciled | **PASS** — FV dossier + SHA `49cd577…` + production product SHA `d110b6e3…`; parent status adopted per §5.7 without reopening |
| 3 | Public and authenticated entry surfaces were inspected | **PASS** — §5 |
| 4 | Protected boundaries are registered using repository evidence | **PASS** — §6 |
| 5 | Shared-risk surfaces are identified | **PASS** — P1 rows PW0-PB-017–031 and PW0-PB-033 |
| 6 | Authenticated Home is explicitly protected | **PASS** — §2, §6 P0, §7 |
| 7 | In-scope, out-of-scope, and deferred work are unambiguous | **PASS** — §4 |
| 8 | Governance and change-control rules are defined | **PASS** — §8–§9 |
| 9 | No product or test code was changed | **PASS** — only this file created |
| 10 | No existing file was modified | **PASS** |
| 11 | Only the authorized PW-0 document was created | **PASS** |
| 12 | No unresolved P0 ambiguity remains that prevents a trustworthy freeze | **PASS** — remaining `U` items are shared-host/architecture questions, not ambiguity about which Home files are frozen |

PW-0 is documentation-only. B1-GATE.1 browser/production gates are **not required** for this slice (no user-visible product change). Justification: this file cannot alter runtime behavior.

---

## 13. Final Status

```text
PASS — PW-0 BOUNDARY FROZEN WITH EVIDENCE
```

No implementation is authorized. Do not proceed to PW-1 without a separate governing prompt.

---

## 14. Evidence Appendix

### 14.1 Preflight commands and results

Read-only Git, PowerShell-safe (`@{u}` quoted).

| Check | Result |
| --- | --- |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `49cd5773976143139a154f9b8ddf36535a4dd914` |
| Upstream ref | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `49cd5773976143139a154f9b8ddf36535a4dd914` |
| Ahead / behind | `0 0` |
| `git status` | `nothing to commit, working tree clean` (before this file) |
| Staged | none |
| Unstaged tracked | none |
| Untracked | none before this file |

`git log -15 --oneline` (abridged): `49cd577 docs(home): close daily operating home hardening`; `f799389 test(home): reconcile production browser contract`; `d110b6e test(home): verify integrated home hardening regression`.

`git show 49cd577 --stat`: one file added, `docs/phases/B1-C1-H1-FV-final-verification-evidence.md`.

### 14.2 Exact evidence paths

See §5.6 and §6. No secrets, env values, tokens, or user data are included.

### 14.3 Route / file inventory summary

| Class | Inventory |
| --- | --- |
| Public / unauthenticated App Router | `/` (`src/app/page.tsx`), `/login`, `/register`, `/register/check-email`, `/register/complete`, `/forgot-password`, `/reset-password`, `/invite/accept`, `/auth/callback` |
| Authenticated Home | `/home` plus daily-operating feature, AppShell, Home loading |
| Authenticated group | `src/app/(authenticated)/**` including Home and product modules; layout passthrough |
| Shared session | `src/middleware.ts`, `src/lib/supabase/middleware.ts`, `safe-return-path.ts`, landing resolvers |
| Global style / metadata | `src/app/layout.tsx`, `src/app/globals.css` |
| Absent | `(marketing)` / `(public)` groups, `public/` assets, Tailwind, `next/font`, analytics/consent, root error boundary |

### 14.4 Classification counts

| Classification | Count in §6 |
| --- | --- |
| P0 | 16 |
| P1 | 16 |
| P2 | 1 |
| U | 4 |
| **Total register rows** | **37** |

Original PW-0 draft counts were P0 16 / P1 15 / P2 2 / U 4. R1 reclassified PW0-PB-033 from P2 to P1. See §15.

### 14.5 Commands not run

Per PW-0 non-goals: no `npm install`, formatter, build, or test run. No commit. No push. No deploy.

### 14.6 Changed-file proof

PW-0 creation and PW-0-R1 hardening both touch only this untracked file.

| Check | Result |
| --- | --- |
| Tracked modifications | none |
| Staged files | none |
| Untracked files | this file only: `docs/phases/PW-0-public-web-charter-boundary-freeze.md` |
| Product / test / config / lockfiles | unchanged |
| Existing tracked documentation | unmodified |

### 14.7 Confirmation

No product code changed. No test code changed. No configuration changed. No existing tracked documentation file was modified. PW-1 product-truth decisions were not made. No implementation instructions or code patches are included.

---

## 15. R1 Independent Review Evidence

| Field | Value |
| --- | --- |
| Review date | 2026-09-14 |
| Reviewed baseline | `core/platform-readiness-20260707` @ `49cd5773976143139a154f9b8ddf36535a4dd914` |
| Upstream | `origin/core/platform-readiness-20260707` @ same SHA; ahead/behind `0 0` |
| Initial R1 worktree | no staged files; no tracked modifications; exactly one untracked file: this document |
| Product / test / config edits in R1 | **NONE** |
| Commit / push / deploy | **NOT DONE** |

### Authorities inspected

- This document (PW-0 draft under review)
- `docs/phases/B1-C1-H1-FV-final-verification-evidence.md`
- `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` (invariants §5, scope §6.2, program gates)
- `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md`
- H1 slice evidence cited in §5.6 as needed for invariants (ADMISSION, TRUTH, SHELL-DESIGN, SHELL, COMPOSITION)
- No `AGENTS.md` present

### Route-model review result

Reproduced from source, not from the prior PASS line.

- Logged-out `www.zyntixai.com/` → middleware does **not** protect `/` → `src/app/page.tsx` `redirect("/login")`. Production H1-FV §22: `307 → /login`.
- Authenticated `/login` → middleware `307` to `/` (query stripped) → `resolveAuthenticatedEntryPath` / `resolvePostAuthDestination`.
- Membership: 0 orgs → invite or `/register/complete`; 1 completed org → `/home?org=`; many orgs → `/home`; incomplete onboarding → onboarding stage.
- Unauthenticated `/home` → middleware `/login?next=/home`.
- Apex `zyntixai.com` → www `308` is production-observed only; not in `vercel.json` or `next.config.ts`.

Corrections: §5.1 and §5.3 now state that the logged-out `/` redirect is the root Server Component, not middleware; and that the login bounce uses `/` + `resolveAuthenticatedEntryPath` as the primary path.

### Boundary-row review result

All 37 rows were reviewed against the repository. Every cited product, test, and evidence path exists, including `tests/auth/safe-return-path.test.ts` and `tests/auth/public-registration.test.ts` (exact paths added).

AppShell (PW0-PB-008) remains P0: it is authenticated chrome frozen by H1-SHELL, not a public+authenticated shared landing. `OrgAwareLink` is used by AppShell, not by the daily-operating brief.

### Classification counts

| | P0 | P1 | P2 | U | Total |
| --- | ---: | ---: | ---: | ---: | ---: |
| Original PW-0 report | 16 | 15 | 2 | 4 | 37 |
| After R1 | 16 | 16 | 1 | 4 | 37 |

### Classification changes

| ID | From | To | Reason |
| --- | --- | --- | --- |
| PW0-PB-033 | P2 | P1 | Favicon / apple-touch-icon would be shared browser chrome on authenticated `/home` as well as public routes. H1-FV already recorded the 404s. Isolation is not proven. Uncertainty must not be classified P2. |

No rows removed. No rows added. PW0-PB-032 remains P2 only as a **candidate class** for a future isolated public route group, with explicit text that those groups do not exist today.

### Unresolved-item result

All four U items (PW0-PB-034–037) remain U. §6.1 now records uncertainty, protection rule, evidence needed, owner, latest gate, and blocking status for each.

None leaves authenticated `/home` materially uncertain. None blocks PW-1. None is an unresolved P0 Home ambiguity.

### Authenticated-invariant result

Original 19 invariants were evidence-backed. R1 expanded them with regression path and required protection evidence, and added INV-020 (composition sources/cap/no AI), INV-021 (logout → `/login`), INV-022 (membership landing), INV-023 (authenticated layout passthrough). No unsupported invariants were added.

### Governance result

Required rules 1–14 were present. R1 made explicit: design approval ≠ implementation approval ≠ deployment approval; later implementation needs rollback **and** production-verification plans; shared-surface impact analysis (§8.1); U items are protected with per-item gates rather than a blanket “block all of PW-13.”

### Exact files inspected (non-exhaustive of H1 docs)

`src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/middleware.ts`, `src/lib/supabase/middleware.ts`, `src/app/login/page.tsx`, `src/app/(authenticated)/home/page.tsx`, `src/app/(authenticated)/home/loading.tsx`, `src/app/(authenticated)/layout.tsx`, `src/components/app-shell.tsx`, `src/components/org-aware-link.tsx`, daily-operating loader/domain/UI, `resolve-task-page-organization.ts`, `enforce-product-onboarding.ts`, `safe-return-path.ts`, `resolve-authenticated-landing.ts`, `resolve-registration-destination.ts`, `onboarding-steps.ts` (`buildProductDestination`), `auth-actions.ts` (`logoutAction`), `site-origin.ts`, `next.config.ts`, `vercel.json`, named tests in §5.6 plus `tests/auth/safe-return-path.test.ts` and `tests/auth/public-registration.test.ts`.

### Confirmation that no product code changed

R1 modified only this untracked PW-0 document.

### R1 conclusion

```text
PASS — PW-0-R1 BOUNDARY REVIEW CLOSED WITH EVIDENCE
```

The original PW-0 PASS is **confirmed** after the P2→P1 favicon correction and the governance/route-model hardenings above. Authenticated Home remains closed. No PW-1 claim decisions were introduced. Do not start PW-1. Wait for separate authorization to commit.
