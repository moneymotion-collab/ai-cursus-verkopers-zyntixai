# PW-13 — Public Homepage Implementation and Routing

| Field | Value |
| --- | --- |
| Document | PW-13 — Public Homepage Implementation and Routing |
| Type | Implementation, local-evidence, and independent R1 review authority (not publication, not Production verification, not final verification or commit) |
| Date | 2026-09-16 |
| Branch | `core/platform-readiness-20260707` |
| Baseline HEAD | `b49b6ac936e8824ae8b9f3d1f8536b2910f3b651` |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Binding closures | PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; PW-3 `9c12c977383a100eb548880d8d35b329b4406f90`; PW-4 `c6f4489bc5cbf9306b4784320cc747975209caeb`; PW-5 `fcb4eab3fbfe7cefd0013828d9b9819cb452cb87`; PW-6 `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`; PW-7 `adcbd1707caa97a4b5511a56616210d7444a5663`; PW-8 `0b453cfdbc678309bed47c1fef75d0155aa3eac4`; PW-9 `8402acd6c1e3547795a9b0ab4d6d4ae44d6d7149`; PW-10 `b2ebfd0e8b2fb037d04fcc179f347f218df3ab9b`; PW-11 `085c40e5bd0fced04f2b2c847c5194c72737458c`; PW-12 `b49b6ac936e8824ae8b9f3d1f8536b2910f3b651` |
| Authenticated Home | Closure `49cd5773976143139a154f9b8ddf36535a4dd914`; product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Current status | `PW-13 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` |
| Establishment gate | `PASS — PW-13 PUBLIC HOMEPAGE IMPLEMENTATION ESTABLISHED WITH LOCAL EVIDENCE` |
| R1 gate | `PASS — PW-13-R1 INDEPENDENT CODE, ROUTING, ACCESSIBILITY & BROWSER REVIEW CLOSED WITH EVIDENCE` |

```text
IMPLEMENTED WITH LOCAL EVIDENCE
≠ CLOSED WITH EVIDENCE — PW-13
≠ PUBLICATION READY
≠ PRODUCTION VERIFIED
≠ ACCESSIBILITY PASS
≠ WCAG COMPLIANT
≠ USER VALIDATED
≠ DEPLOYED
```

---

## 1. Document Control

This file is the PW-13 implementation evidence. It records Root Model A routing, the public homepage, route-scoped visual isolation, tests, and local verification. It does not reopen PW-0 through PW-12. It does not start PW-14.

| Control | Rule |
| --- | --- |
| Product code | Public homepage and conditional root only |
| Authenticated Home | Closed; not restyled |
| AppShell / login / register / invite / recovery | Unchanged except existing `/login` bounce now lands on Model A `/` then the existing resolver |
| Middleware | Unchanged |
| Global `:root` / `globals.css` | Unchanged |
| Root layout language | Remains `en`; public wrapper uses `lang="nl"` |
| Frozen Route A2 copy | Implemented exactly; not rewritten |
| Dependencies / lockfile | Unchanged |
| Metadata / legal / favicon / analytics | Omitted as governed exclusions |
| Staging / commit / push / deploy | Not authorized in this phase |

---

## 2. Executive Decision

PW-13 implements the frozen public homepage on unauthenticated `/` and preserves the existing authenticated entry resolver for authenticated `/`. Local unit, routing, isolation, lint, type, production-build, and local browser evidence were collected. Independent code, routing, accessibility, and browser review remain required.

No P0 or unresolved P1 implementation defect remains. Deferred checks are named in §30.

```text
PASS — PW-13 PUBLIC HOMEPAGE IMPLEMENTATION ESTABLISHED WITH LOCAL EVIDENCE
PW-13 IMPLEMENTED — READY FOR INDEPENDENT CODE, ROUTING, ACCESSIBILITY AND BROWSER REVIEW
```

---

## 3. Purpose

Implement Root Model A and the frozen public homepage without redesign, copy rewrite, authenticated restyle, dependency addition, or publication.

---

## 4. Scope

In scope: unauthenticated `/` public homepage; authenticated `/` reuse of `resolveAuthenticatedEntryPath`; route-scoped public CSS module; Dutch `lang="nl"` wrapper; in-page exploration; `Navigatie` disclosure; frozen Route A2 copy; local tests; local browser checks; this evidence file.

Out of scope: PW-14; deploy; metadata/Open Graph/robots/sitemap; legal pages; favicon; analytics; consent; waitlist; signup; contact; AI sentence activation; BOS; axe dependency; Production publication.

---

## 5. Non-Goals

- Redesign or restyle authenticated Home, AppShell, login, registration, invitation, or recovery.
- Change middleware, global tokens, root layout language, or shared primitives.
- Add dependencies, fonts, icon packs, animation libraries, or marketing frameworks.
- Claim WCAG conformance, screen-reader PASS, user validation, or Production verification.
- Stage, commit, push, or start PW-14.

---

## 6. Binding Authorities

| ID | Authority | Role in PW-13 |
| --- | --- | --- |
| PW13-AUTH-001 | B1-GATE.1 | Evidence completeness; no fabricated PASS |
| PW13-AUTH-002 | PW-0 | Public-web boundary; dual-use `/`; B1-C1 pack when root routing changes |
| PW13-AUTH-003 | PW-1 | Public-truth ceiling |
| PW13-AUTH-004 | PW-6 | Exact frozen Route A2 copy |
| PW13-AUTH-005 | PW-7 | Responsive layout |
| PW13-AUTH-006 | PW-8 | Accessibility, behaviour, states |
| PW13-AUTH-007 | PW-9 | Composition and candidate anchors |
| PW13-AUTH-008 | PW-10 | Visual system and tokens |
| PW13-AUTH-009 | PW-11 | High-fidelity design |
| PW13-AUTH-010 | PW-12 | Design freeze and validation gate |
| PW13-AUTH-011 | Home closure `49cd577…` / product `d110b6e3…` | Authenticated Home remains closed |
| PW13-AUTH-012 | PW-12 HEAD `b49b6ac9…` | Implementation baseline |

Authority hierarchy: PW-1 truth ceiling; PW-6 copy; PW-7 responsive; PW-8 a11y/behaviour; PW-9 composition; PW-10 visual; PW-11 high-fidelity; PW-12 freeze. PW-13 implements and may not reinterpret.

---

## 7. Preflight

`git fetch origin` was run. Observed state matched the expected baseline before edits:

| Check | Expected | Observed |
| --- | --- | --- |
| Worktree | `…/parallel__laptop-product-track-20260707-1` | match |
| Branch | `core/platform-readiness-20260707` | match |
| HEAD | `b49b6ac936e8824ae8b9f3d1f8536b2910f3b651` | match |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA | match |
| Ahead/behind | `0 0` | match |
| Staged / unstaged / untracked | none | match |

Instruction discovery: no repository `AGENTS.md`, nested `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules`. README is a title stub. `tests/browser/README.md` governs Production Playwright as an authenticated QA harness against `https://www.zyntixai.com`, not local public-page specs. No instruction conflict with this authority.

After implementation, HEAD remains `b49b6ac9…` and ahead/behind remains `0 0` because nothing was committed.

---

## 8. Architecture Findings

| Topic | Finding |
| --- | --- |
| Logged-out `/` before PW-13 | `src/app/page.tsx` redirected to `/login` |
| Logged-in `/` | `getUser` then `resolveAuthenticatedEntryPath` with invitation cookies |
| Authenticated `/login` | Middleware redirects to `/`; page resolver then `resolvePostLoginDestination` |
| Unauthenticated `/home` | Middleware `isProtectedApplicationPath`; login with `next=/home`; stale cookie adds `reason=session_expired` |
| Helper chain | `createSupabaseServerClient` → `auth.getUser` → if user: `cookies` + `readInvitationCookiesFromStore` → `resolveAuthenticatedEntryPath` → `resolvePostAuthDestination` → memberships / invitation / `resolveAuthenticatedLanding` |
| Missing session | `user` null renders public homepage; matches existing login-page null-user convention |
| Unexpected auth/system error | `getUser` throw remains an uncaught server error (existing convention; not a silent public render of authenticated data) |
| CSS architecture | Global slate/blue `:root` in `globals.css`; feature CSS modules; AppShell and login modules separate |
| Testing stack | Vitest node + `renderToStaticMarkup`; no Testing Library; no axe; Playwright Production B1-C1 with gitignored auth storage; `*.desktop.spec.ts` matchers |
| Native `details` | Already used in AppShell menu; reused for public `Navigatie` |
| Middleware and `/` | `/` is not a protected application path; no middleware change required |

Current source did not contradict closed PW-12 evidence. Desired Root Model A was still unimplemented at baseline; PW-13 is the authorized implementation.

---

## 9. Protected Boundaries

| Surface | Status |
| --- | --- |
| Authenticated `/home` loaders and components | Unchanged |
| AppShell and English skip `Skip to main content` | Unchanged |
| `/login` markup and CSS | Unchanged |
| Register, invite, recovery | Unchanged |
| Middleware | Unchanged |
| Membership/onboarding resolvers | Reused, not duplicated |
| Shared primitives | Unchanged |
| `globals.css` `:root` | Unchanged |
| Root layout `lang="en"` | Unchanged |
| Favicon, legal, metadata, analytics | Unchanged / omitted |
| Production configuration | Unchanged |

`src/app/page.tsx` is the only high-risk shared runtime file edited, and only for conditional Root Model A.

---

## 10. Implementation Plan

1. Conditional root: null user → `PublicHomepage`; user → existing resolver.
2. Isolated `src/features/public-web` composition, copy constants, CSS module, and hash-focus enhancer.
3. Route-scoped custom properties on the public wrapper; no `:root` write.
4. Real fragment hrefs plus optional client focus movement.
5. Native `details`/`summary` labelled `Navigatie`; content-fit threshold from local width testing.
6. Frozen Route A2 constants with U+00E8 and U+2019 locked.
7. Landmarks, skip, focus, forced-colours, reduced-motion, no-JS content.
8. Vitest copy/semantics/isolation plus updated root-routing tests.
9. Local Cursor-browser viewport and interaction checks; no new Production Playwright spec.
10. Existing Home/AppShell/auth regression commands.
11. This evidence document.

---

## 11. Changed-File Register

| ID | Path | Status | Purpose | Authority | Risk | Tests | Authenticated impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW13-FILE-001 | `src/app/page.tsx` | modified | Root Model A branch | PW-0; PW-4; PW-12 | high | entry-routing tests | Resolver path preserved |
| PW13-FILE-002 | `src/features/public-web/copy.ts` | added | Frozen Route A2 strings and IDs | PW-6; PW-12 COPY | medium | public-homepage tests | none |
| PW13-FILE-003 | `src/features/public-web/ui/public-homepage.tsx` | added | Semantic homepage | PW-8; PW-9; PW-11 | medium | public-homepage tests | none |
| PW13-FILE-004 | `src/features/public-web/ui/public-homepage.module.css` | added | Route-scoped visual system | PW-7; PW-10; PW-11; PW-12 | medium | isolation source-lock | none if selectors stay scoped |
| PW13-FILE-005 | `src/features/public-web/ui/public-hash-focus.tsx` | added | Progressive hash focus | PW-8 | low | no-JS still works without it | none |
| PW13-FILE-006 | `tests/public-web/public-homepage.test.tsx` | added | Copy, semantics, isolation | PW-13 testing | low | self | none |
| PW13-FILE-007 | `tests/auth/entry-routing-and-login-ui.test.tsx` | modified | Logged-out `/` contract + resolver cases | PW-0; Root Model A | medium | self | authenticated assertions preserved |
| PW13-FILE-008 | `tests/auth/middleware-auth-redirects.test.ts` | modified | Public `/` not redirected; `/home` still protected | PW-0 | medium | self | middleware unchanged |
| PW13-FILE-009 | `docs/phases/PW-13-public-homepage-implementation-routing.md` | added | Evidence | B1-GATE.1 | low | n/a | none |

Unexpected changed files: none.

---

## 12. Root Routing Implementation

| ID | Behaviour | Implementation |
| --- | --- | --- |
| PW13-ROUTE-001 | Unauthenticated `/` | Render `PublicHomepage`; no `/login` redirect |
| PW13-ROUTE-002 | Authenticated `/` | Existing `resolveAuthenticatedEntryPath` |
| PW13-ROUTE-003 | One completed org | `/home?org=…` (existing) |
| PW13-ROUTE-004 | Multiple orgs | `/home` (existing) |
| PW13-ROUTE-005 | Zero orgs | `/register/complete` (existing) |
| PW13-ROUTE-006 | Incomplete onboarding owner | `/onboarding?org=…` via existing lifecycle |
| PW13-ROUTE-007 | Unverified email | `/register/check-email` (existing) |
| PW13-ROUTE-008 | Null user with auth error object | Treated as logged-out public page (Supabase missing-session shape) |
| PW13-ROUTE-009 | Authenticated `/login` | Middleware still bounces to `/`; page resolver unchanged |
| PW13-ROUTE-010 | Unauthenticated `/home` | Middleware still redirects to `/login?next=/home` |

No service-role access. No client-side auth flash: the server component decides before paint. No authenticated data is passed into `PublicHomepage`.

---

## 13. Public Component Architecture

| ID | Unit | Role |
| --- | --- | --- |
| PW13-COMP-001 | `PublicHomepage` | Server-rendered composition |
| PW13-COMP-002 | `copy.ts` | Frozen strings and section IDs |
| PW13-COMP-003 | `public-homepage.module.css` | Route-scoped tokens and layout |
| PW13-COMP-004 | `PublicHashFocus` | Client enhancer; returns null |
| PW13-COMP-005 | `ExplorationLinks` | Shared in-page list for inline and disclosure copies |

No new route. No marketing framework. No third-party UI.

---

## 14. Frozen-Copy Mapping

Active Route A2 board from PW-6 / PW-12 COPY, implemented character-for-character:

| ID | Surface | Exact text |
| --- | --- | --- |
| PW13-COPY-001 | Wordmark / footer | `ZyntixAI` |
| PW13-COPY-002 | Nav | `Over ZyntixAI` |
| PW13-COPY-003 | Nav | `Hoe het werkt` |
| PW13-COPY-004 | Nav | `Gesloten bèta` (U+00E8) |
| PW13-COPY-005 | Utility | `Inloggen` |
| PW13-COPY-006 | Skip chrome | `Ga naar de hoofdinhoud` |
| PW13-COPY-007 | Disclosure chrome | `Navigatie` |
| PW13-COPY-008 | H1 | `Houd zicht op klanten, werk en voortgang.` |
| PW13-COPY-009 | Support | PW6-COPY-044 sentence |
| PW13-COPY-010 | Layer B | `ZyntixAI is nu in gesloten bèta.` |
| PW13-COPY-011 | Layer B | `Inloggen is voor bestaande accounts.` |
| PW13-COPY-012 | Value H2/body | PW12-COPY-011/012 |
| PW13-COPY-013 | Mechanism H2/body | PW12-COPY-013/014 |
| PW13-COPY-014 | Today H2/body/qualifier | PW12-COPY-015/016/017 |
| PW13-COPY-015 | Course Seller H2/body/qualifier | PW12-COPY-018/019/020; body uses U+2019 in `programma’s` |
| PW13-COPY-016 | Trust H2/body | PW12-COPY-021/022 |
| PW13-COPY-017 | Access H2/status/utility/stop | PW12-COPY-023/024/025/026 |

Inactive/omitted: `PW6-AI-002` chatbot sentence; BOS; signup; waitlist; contact; pricing; demo CTA. Access utility is split only to wrap the `Inloggen` link; concatenated visible sentence remains `Heb je al een account? Inloggen.`

---

## 15. Semantic Structure

| ID | Requirement | Implementation |
| --- | --- | --- |
| PW13-SEM-001 | Public Dutch skip | First focusable link to `#hoofdinhoud` |
| PW13-SEM-002 | Header / nav / main / footer | Present |
| PW13-SEM-003 | One H1 | Hero only |
| PW13-SEM-004 | H2s | Over, Hoe het werkt, Today, Course Seller, Trust, Access |
| PW13-SEM-005 | `main` id | `hoofdinhoud` |
| PW13-SEM-006 | Wrapper language | `lang="nl"` on public wrapper |
| PW13-SEM-007 | DOM order | Skip, header, hero+beta, value, mechanism, Today, Course Seller, trust, access, footer |
| PW13-SEM-008 | Unique IDs | Section IDs unique; Next runtime script id `_R_` is framework, not a public duplicate |

Section IDs: `hoofdinhoud`, `over-zyntixai`, `hoe-het-werkt`, `gesloten-beta`, `today`, `opleidingen-en-coaching`, `hoe-toegang-werkt`, `toegang`. `gesloten-beta` is the required Gesloten bèta destination on Layer B. It is not a PW-9 seven-anchor rewrite; it is the PW-13 implementation of a required nav target.

---

## 16. Header and Navigation

| ID | Requirement | Implementation |
| --- | --- | --- |
| PW13-NAV-001 | Text wordmark | `ZyntixAI` link to `/` |
| PW13-NAV-002 | Static header | `position: static`; 1px `#C9C2B4` separator |
| PW13-NAV-003 | Explore destinations | Real hashes; no `href="#"` |
| PW13-NAV-004 | `Inloggen` | `/login`; utility, not a filled CTA |
| PW13-NAV-005 | Disclosure | Native `details`/`summary` text `Navigatie`; non-modal; no focus trap |
| PW13-NAV-006 | Exclusive lists | Inline list at fit; `details` when not; closed panel forced `display: none` so `ul { display:flex }` cannot leak |
| PW13-NAV-007 | Hash enhancement | `PublicHashFocus` focuses target with `tabindex="-1"`; native fragments work without JS |
| PW13-NAV-008 | AppShell skip | English text unchanged |

---

## 17. Responsive Disclosure

Local width testing, not a new design decision:

| Viewport / container | Observed nav |
| --- | --- |
| 1440 / 1280 / 1024 / 768 / 720 / landscape 844 | Inline list; `details` `display: none` |
| 640 / 390 / 320 | `Navigatie` disclosure; inline list `display: none` |

Selected implementation threshold: `@container public-header (max-width: 40rem)` with `@media (max-width: 45rem)` fallback when container queries are absent. 40rem is recorded as content-fit evidence. It is not an upstream PW-7/PW-11 change.

---

## 18. Visual-System Implementation

Local custom properties on `.publicWeb` only:

- canvas `#F4F1EA`; ink `#1A1916`; muted `#5C574E`; teal `#1F5C57`; supporting neutrals from PW-10 DIR-001
- system-first sans; radii 0.25rem / 0.50rem; `box-shadow: none`
- no gradients, glass, images, icons, AI orb, screenshot, logo strip, or four-group cards
- content-wide 64rem; reading 40rem; copy `min(72ch, 40rem)`; space-8 `2.5rem`
- light-first `color-scheme: light`; no theme toggle

| ID | Isolation check |
| --- | --- |
| PW13-STYLE-001 | Public CSS has no `:root` block |
| PW13-STYLE-002 | `globals.css` still uses slate/blue tokens; no `#F4F1EA` |
| PW13-STYLE-003 | AppShell / login / Home CSS modules have no public canvas token |
| PW13-STYLE-004 | Enclosed occupancy 1/1/1: access panel only |

---

## 19. Section Implementation

| ID | Section | Treatment |
| --- | --- | --- |
| PW13-COMP-006 | Hero | H1 + support; no CTA row; no image; no vh hero |
| PW13-COMP-007 | Closed beta | Inline text immediately after support; not a pill |
| PW13-COMP-008 | Value / mechanism | Continuous editorial H2 + paragraph |
| PW13-COMP-009 | Today | Reading-column band `#EBE6DC`; qualifier visible |
| PW13-COMP-010 | Course Seller | Copy-measure divider; qualifier attached |
| PW13-COMP-011 | Trust | Plain titled text |
| PW13-COMP-012 | Access | One enclosed panel; honest stop; existing-account `Inloggen` |
| PW13-COMP-013 | Footer | Identity-only; top divider; no legal/contact/social |

---

## 20. Accessibility Implementation

| ID | Contract | Evidence type |
| --- | --- | --- |
| PW13-A11Y-001 | `lang="nl"` scope | Markup + Vitest + local DOM |
| PW13-A11Y-002 | One H1 / logical H2 | Vitest + local DOM |
| PW13-A11Y-003 | Skip to `hoofdinhoud` | Markup; click/hash moved focus to `MAIN` |
| PW13-A11Y-004 | Named disclosure `Navigatie` | Native `summary`; expanded/collapsed via `open` |
| PW13-A11Y-005 | 2px + 2px teal focus | CSS; skip has explicit `:focus` outline |
| PW13-A11Y-006 | Target size | Nav/summary/sign-in min-height 2.75rem |
| PW13-A11Y-007 | No colour-only meaning | Underlines; text beta; text honest stop |
| PW13-A11Y-008 | Forced-colours | Route-scoped `@media (forced-colors: active)`; local emulate showed 2px access border and underlined body link |
| PW13-A11Y-009 | Reduced motion | Route-scoped `@media (prefers-reduced-motion: reduce)`; no motion required |
| PW13-A11Y-010 | No axe in repo | Strongest local a11y tool remains Vitest semantics + browser DOM; axe not added |

No accessibility PASS claim.

---

## 21. Interaction States

| ID | State | Implementation |
| --- | --- | --- |
| PW13-STATE-001 | Default | Ink body; teal body links |
| PW13-STATE-002 | Hover | Underline plus darker teal; hover never sole cue |
| PW13-STATE-003 | Active | Darker teal |
| PW13-STATE-004 | Focus-visible | 2px outline, 2px offset |
| PW13-STATE-005 | Visited body link | Remains teal (not a new purple family) |
| PW13-STATE-006 | Disclosure collapsed/expanded | Native `open`; closed panel `display: none` |
| PW13-STATE-007 | Skip hidden | `translateY(-200%)` until `:focus` / `:focus-visible` |
| PW13-STATE-008 | Anchor target focus | `tabindex="-1"` on main and sections |
| PW13-STATE-009 | No disabled fake CTAs | No `<button>` on the public page |

---

## 22. Responsive Implementation

Local Cursor-browser `Emulation.setDeviceMetricsOverride` (not Playwright binaries):

| ID | Width | Overflow | Nav | Material copy |
| --- | --- | --- | --- | --- |
| PW13-RESP-001 | 1440 | no (`1425=1425`) | inline | visible |
| PW13-RESP-002 | 1280 | no | inline | visible |
| PW13-RESP-003 | 1024 | no | inline; H1 32px | visible |
| PW13-RESP-004 | 768 | no | inline | visible |
| PW13-RESP-005 | 390 | no | disclosure; H1 26px; access 358px | qualifier + Today limit visible |
| PW13-RESP-006 | 320 | no | disclosure; access 288px | all material copy visible |
| PW13-RESP-007 | 720 (200% equivalent) | no | inline (container still fits) | honest stop + qualifier visible |
| PW13-RESP-008 | 844×390 landscape | no | inline | visible |
| PW13-RESP-009 | 390 + text-spacing override | no | disclosure | H1 and honest stop remain |
| PW13-RESP-010 | 640 (threshold probe) | no | disclosure | n/a |

320 arithmetic matches PW-12: access inner width 288px under border-box.

---

## 23. No-JavaScript Behavior

Unauthenticated `GET /` HTML (production server, no client execution required for first paint) contained H1, `lang="nl"`, `hoofdinhoud`, `/login`, `details`, Inloggen, honest stop, `programma’s` (U+2019), and no waitlist or `/register` CTA.

Native fragments and `details` remain in the HTML. `PublicHashFocus` is enhancement only.

---

## 24. Authenticated Regression Protection

| Check | Result |
| --- | --- |
| Authenticated Home files | Not modified |
| AppShell English skip | Source-locked |
| Login CSS / Sign in copy | Unchanged; local `/login` still English |
| Resolver tests | One-org, multi-org, zero-org, incomplete onboarding, unverified, login bounce |
| Middleware `/` | 200 for logged-out `/` |
| Middleware `/home` | 307 `/login?next=/home` |
| Local `/home` in browser | Redirected to `/login?next=%2Fhome&reason=session_expired` (stale cookie + protected path; existing rule) |

---

## 25. Unit and Component Tests

`tests/public-web/public-homepage.test.tsx`: exact board, diacritics, destinations, unique IDs, landmarks, prohibited CTAs, `details` disclosure, isolation source-lock, frozen hex, disclosure closed-state CSS.

---

## 26. Routing Tests

Updated `tests/auth/entry-routing-and-login-ui.test.tsx`: logged-out `/` renders homepage; authenticated resolver cases retained and extended. Updated `tests/auth/middleware-auth-redirects.test.ts` for public `/` and protected `/home`. Existing `resolve-authenticated-landing` and `safe-return-path` tests remain.

---

## 27. Browser Validation

| ID | Check | Class | Result |
| --- | --- | --- | --- |
| PW13-BROWSER-001 | Logged-out `/` renders Dutch homepage | local browser | pass |
| PW13-BROWSER-002 | No client auth flash on public `/` | local browser | pass (SSR) |
| PW13-BROWSER-003 | Content order | local browser | pass |
| PW13-BROWSER-004 | Header fit / disclosure | local browser | pass; threshold recorded |
| PW13-BROWSER-005 | `Inloggen` → `/login` | local browser | pass |
| PW13-BROWSER-006 | `#over-zyntixai` focus | local browser | `SECTION#over-zyntixai` |
| PW13-BROWSER-007 | Skip activation | local browser | `MAIN#hoofdinhoud` |
| PW13-BROWSER-008 | Keyboard Tab to skip | Cursor harness | not demonstrated (Tab landed on `BODY`) |
| PW13-BROWSER-009 | Overflow 1440–320, zoom, landscape, text-spacing | local browser | no horizontal overflow |
| PW13-BROWSER-010 | Forced-colours emulate | local browser | content remains; access 2px; links underlined |
| PW13-BROWSER-011 | No-JS HTML | HTTP GET | pass |
| PW13-BROWSER-012 | Authenticated root bypass | Vitest | pass; not live-browser authenticated |
| PW13-BROWSER-013 | `npm run test:browser:b1-c1` | Production Playwright | 3 skipped; no auth storage |
| PW13-BROWSER-014 | Screenshots | temp only | not committed |
| PW13-BROWSER-015 | Screen readers | unexecuted | deferred |

---

## 28. Accessibility Evidence

Automated: Vitest semantics, unique IDs, skip href, disclosure markup, isolation. No axe. Local DOM confirmed Dutch wrapper, one H1, six H2s, closed disclosure links `checkVisibility() === false`. Keyboard Tab skip visual in a standard browser remains deferred. No NVDA, VoiceOver, or TalkBack execution. No WCAG-compliant claim.

---

## 29. Build, Type, and Lint Evidence

| Command | Result |
| --- | --- |
| `npm run lint` | pass; no warnings or errors |
| `npm run typecheck` | pass |
| `npm run build` | pass; unrelated existing autoprefixer warning in `platform-closed-beta-operator-list.module.css` |
| `git diff --check` | pass on implementation diffs |

Production route `/` remains dynamic (`ƒ`), which is required for the session branch.

---

## 30. Deferred Validation

| ID | Item | Why deferred | Blocks PW-13 establishment? |
| --- | --- | --- | --- |
| PW13-DEFER-001 | axe / equivalent engine | not in toolchain; no new dependency | no |
| PW13-DEFER-002 | NVDA / VoiceOver / TalkBack | not executed | no |
| PW13-DEFER-003 | Visitor / user validation | not in scope | no |
| PW13-DEFER-004 | Production publication of public `/` | not deployed | no |
| PW13-DEFER-005 | B1-C1 authenticated Production pack | `playwright/.auth/production-owner.json` absent; suite targets `https://www.zyntixai.com`, not this worktree | no; environment skip, not a fabricated pass |
| PW13-DEFER-006 | Playwright local Chromium for public page | browser binaries absent in this environment | no; Cursor browser used instead |
| PW13-DEFER-007 | Standard-browser Tab skip visibility | Cursor Tab did not move to skip | no; skip CSS and skip activation evidenced |
| PW13-DEFER-008 | Authenticated live `/` resolver in browser | no logged-in local session exercised | no; Vitest covers resolver |
| PW13-DEFER-009 | Metadata / legal / canonical / robots | gated; candidate-only in PW-6 | no |
| PW13-DEFER-010 | Independent code/routing/a11y/browser review | next authorized phase | no |

---

## 31. Risks

| ID | Risk | Severity | Mitigation |
| --- | --- | --- | --- |
| PW13-RSK-001 | Duplicate nav lists if CSS fails | medium | closed `details` panel `display: none`; exclusive media/container rules |
| PW13-RSK-002 | Global `a` colour leaking into wordmark | medium | higher-specificity public header rules |
| PW13-RSK-003 | Skip not visible in some automation harnesses | low | off-screen translate; explicit `:focus` outline |
| PW13-RSK-004 | Production B1-C1 not executed here | medium | named deferral; Home files unchanged |
| PW13-RSK-005 | Stale cookie on `/home` shows session-expired | existing | unchanged middleware |
| PW13-RSK-006 | Independent review may find visual deltas vs PW-11 screenshots | expected | screenshots were not implementation; copy/geometry locked |

---

## 32. Open Questions

| ID | Question | Owner |
| --- | --- | --- |
| PW13-Q-001 | When may public metadata / legal / canonical host be filled? | later gated phase |
| PW13-Q-002 | When is Production public `/` published? | not PW-13 |
| PW13-Q-003 | Independent review findings | next authorized review |

---

## 33. Traceability

| ID | PW-13 item | Upstream |
| --- | --- | --- |
| PW13-MAP-001 | Root Model A | PW-0; PW-4 OD; PW-12 ISO-004 later clause |
| PW13-MAP-002 | Copy | PW-6; PW-12 COPY-001–030 |
| PW13-MAP-003 | Responsive | PW-7; PW-12 RESP |
| PW13-MAP-004 | A11y/behaviour | PW-8; PW-12 A11Y |
| PW13-MAP-005 | Composition / anchors | PW-9; PW-11 regions |
| PW13-MAP-006 | Visual tokens | PW-10 DIR-001; PW-11 COLOR |
| PW13-MAP-007 | Isolation | PW-10/11/12 ISO |
| PW13-MAP-008 | Authenticated Home closed | `49cd577…`; `d110b6e3…` |
| PW13-MAP-009 | No metadata invention | PW-6 candidate-only; PW-12 external gates |
| PW13-MAP-010 | B1-C1 pack | PW-0; browser README |

---

## 34. Acceptance Gate

AND logic. All required establishment conditions are true:

- baseline exact at start;
- architecture understood;
- unauthenticated `/` renders public homepage;
- authenticated `/` preserves resolver;
- `/login` and `/home` remain governed;
- frozen Route A2 copy exact;
- no unsupported CTA;
- Dutch isolated; tokens route-scoped;
- authenticated styles unchanged;
- semantics, skip target, real anchors, utility `Inloggen`;
- accessible non-modal disclosure;
- no-JS content present;
- governed widths tested without overflow;
- focus CSS present; forced-colours and reduced-motion CSS present;
- metadata/legal/analytics not invented;
- targeted and auth/Home regression tests passed;
- lint/type/build passed;
- executable local browser checks passed;
- unexecuted checks deferred;
- no P0; no unresolved P1;
- changed-file scope exact.

---

## 35. Final Status

```text
PASS — PW-13 PUBLIC HOMEPAGE IMPLEMENTATION ESTABLISHED WITH LOCAL EVIDENCE
PW-13 IMPLEMENTED — READY FOR INDEPENDENT CODE, ROUTING, ACCESSIBILITY AND BROWSER REVIEW
```

Not staged. Not committed. Not pushed. Not deployed. PW-14 not started.

---

## 36. Evidence Appendix

### 36.1 Commands

```text
npm run test:run -- tests/public-web/public-homepage.test.tsx
npm run test:run -- tests/auth/entry-routing-and-login-ui.test.tsx tests/auth/middleware-auth-redirects.test.ts tests/auth/safe-return-path.test.ts tests/auth/resolve-authenticated-landing.test.ts
npm run test:run -- tests/auth tests/onboarding/product-admission-routing.test.ts tests/onboarding/onboarding-routing.test.ts tests/onboarding/product-admission-enforcement.test.ts
npm run test:run -- tests/public-web/public-homepage.test.tsx tests/auth/entry-routing-and-login-ui.test.tsx tests/ui/appshell-customers-terminology.test.tsx tests/onboarding/product-admission-app-shell.test.ts tests/onboarding/product-shell-authenticated-authority.test.ts tests/features/daily-operating/daily-operating-brief-ui.test.tsx tests/features/daily-operating/load-daily-operating-page.test.ts tests/ui/shared-foundations.test.tsx
npm run lint
npm run typecheck
npm run build
npm run test:browser:b1-c1
git diff --check
```

### 36.2 Result counts

| Suite | Files | Tests | Result |
| --- | --- | --- | --- |
| Public homepage | 1 | 8 | pass |
| Entry + landing + middleware + safe-return | 5 | 64 after first fix; later green | pass |
| Auth + admission routing | 22 | 175 | pass |
| Home / AppShell / foundations batch | 8 | 122 | pass |
| B1-C1 | 3 | 3 skipped | not executed; owner bootstrap required |

### 36.3 Census

| Family | From | To | Count |
| --- | --- | --- | --- |
| PW13-AUTH | 001 | 012 | 12 |
| PW13-FILE | 001 | 009 | 9 |
| PW13-ROUTE | 001 | 010 | 10 |
| PW13-COPY | 001 | 017 | 17 |
| PW13-SEM | 001 | 008 | 8 |
| PW13-NAV | 001 | 008 | 8 |
| PW13-STYLE | 001 | 004 | 4 |
| PW13-COMP | 001 | 013 | 13 |
| PW13-STATE | 001 | 009 | 9 |
| PW13-RESP | 001 | 010 | 10 |
| PW13-A11Y | 001 | 010 | 10 |
| PW13-TEST | (commands in §36.1) |  |  |
| PW13-BROWSER | 001 | 015 | 15 |
| PW13-DEFER | 001 | 010 | 10 |
| PW13-RSK | 001 | 006 | 6 |
| PW13-Q | 001 | 003 | 3 |
| PW13-MAP | 001 | 010 | 10 |
| PW13-ACC | (gate in §34) |  |  |

### 36.4 Governed exclusions

Public metadata, Open Graph, canonical host, robots, sitemap, favicon, legal links, analytics, consent, contact route, waitlist, and beta-intake form were not implemented. PW-6 metadata remained candidate-only. These are omissions with authority, not missing implementation.

---

End of PW-13 implementation evidence.

---

## 37. R1 Independent Code, Routing, Accessibility and Browser Review Evidence

Independent review treated the establishment PASS, unit-test results, browser observations, routing statements, and accessibility statements as untrusted hypotheses. Source, tests, production build, local `next start`, and Playwright Chromium were re-executed on this worktree. Establishment §§1–36 remain historical evidence and are not restated as R1 proof.

```text
PASS — PW-13-R1 INDEPENDENT CODE, ROUTING, ACCESSIBILITY & BROWSER REVIEW CLOSED WITH EVIDENCE
PW-13 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

Not: `CLOSED WITH EVIDENCE — PW-13`. Not publication ready. Not Production verified. Not accessibility PASS. Not WCAG compliant. Not user validated. Not deployed.

### 37.1 Preflight

| Check | Result |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| `git fetch origin` | origin did not advance |
| Local HEAD | `b49b6ac936e8824ae8b9f3d1f8536b2910f3b651` |
| Upstream `origin/core/platform-readiness-20260707` | `b49b6ac936e8824ae8b9f3d1f8536b2910f3b651` |
| Ahead / behind | `0 0` |
| Staged files | none |
| Initial changed-file set | 9 files as authorized |
| Dependency / lockfile change | none |
| Destructive git | not used |

Instruction discovery: no `AGENTS.md`, nested `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules`. Binding repository authorities in `docs/governance` and `docs/phases` were applied. No instruction conflict with this phase.

### 37.2 Authority and independence

Authorities read and applied: B1-GATE.1; PW-0 through PW-13; authenticated Home closures `49cd5773976143139a154f9b8ddf36535a4dd914` and `d110b6e3da5c690b31a68a0b145b7b6521c10828`; PW-12/PW-13 baseline `b49b6ac936e8824ae8b9f3d1f8536b2910f3b651`. Hierarchy unchanged: PW-1 truth ceiling; PW-6 Route A2 copy; PW-7 responsive; PW-8 a11y/behavior; PW-9 composition; PW-10 visual system; PW-11 high-fidelity; PW-12 freeze. PW-13 implements and does not reopen upstream. Previous PASS statements were not accepted without independent reproduction.

### 37.3 Changed-file audit

Initial nine-file set was exact and authorized:

Modified: `src/app/page.tsx`; `tests/auth/entry-routing-and-login-ui.test.tsx`; `tests/auth/middleware-auth-redirects.test.ts`.

New: `src/features/public-web/copy.ts`; `src/features/public-web/ui/public-homepage.tsx`; `src/features/public-web/ui/public-homepage.module.css`; `src/features/public-web/ui/public-hash-focus.tsx`; `tests/public-web/public-homepage.test.tsx`; `docs/phases/PW-13-public-homepage-implementation-routing.md`.

R1 corrections stayed inside that set. No extra production file. No generated screenshot, coverage, build-output, secret, or environment-value file was added to the worktree. `package.json` and lockfile unchanged. Middleware, AppShell, login UI, globals, root layout, authenticated Home, and dependencies unchanged.

### 37.4 Root-routing review

`src/app/page.tsx` independently inspected. Logged-out `if (!user)` returns `PublicHomepage` with no `/login` redirect and no client auth flash. Authenticated path still calls `resolveAuthenticatedEntryPath` with invitation cookies from the cookie store. No hard-coded `/home` shortcut. `createSupabaseServerClient` remains the publishable cookie client, not a service-role client. `PublicHomepage` receives no user or organization props. Null `user` with an auth error object follows the existing repository `getUser` convention and is treated as logged out; this is not a data leak. Thrown `getUser` failures still surface as route failure. R1 added `export const dynamic = "force-dynamic"`. Local production responses for `/` used `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`. Build lists `ƒ /` (1.07 kB page / 104 kB first load).

### 37.5 Authenticated resolver review

Entry-routing tests still exercise single-org `/home?org=`, multi-org `/home`, zero-org `/register/complete`, unverified `/register/check-email`, incomplete onboarding `/onboarding?org=`, and authenticated `/login` bounce through the existing resolver. Invitation cookies remain wired in `page.tsx`; `readInvitationCookiesFromStore` is source-locked. Sealed-cookie invitation routing remains covered by existing invitation/resolver tests rather than a new HomePage cookie-seal fixture. Existing authenticated expectations were not weakened. Logged-out `/` is the only intentionally changed root contract.

### 37.6 Middleware review

`src/middleware.ts` and `src/lib/supabase/middleware.ts` are not in the diff. `/` is not an `isProtectedApplicationPath`. Independent middleware tests: logged-out `/` is not redirected; logged-out `/home` remains 307 `/login?next=/home`. Local curl: `/` 200; `/login` 200; `/home` 307 `location: /login?next=%2Fhome`. Static matcher exclusions unchanged. No new public route was treated as authenticated product UI.

### 37.7 Component review

Server component `PublicHomepage` plus minimal client `PublicHashFocus` (`"use client"`, `useEffect`, returns `null`). Copy centralized in `copy.ts`. No `dangerouslySetInnerHTML`, no authenticated imports, no private env, no hidden future CTA, no new dependency. Duplicate `ExplorationLinks` is CSS-exclusive: at every Playwright width only one exploration copy was shown and keyboard-reachable.

### 37.8 Copy audit

`copy.ts` and rendered HTML compared to PW-6 Route A2 / PW-12 COPY register. Exact matches for H1, support, beta sentences, value, mechanism, Today, Course Seller heading without terminal period (`PW12-COPY-018`), CS body with U+2019 `programma’s`, CS qualifier, trust, access, honest stop, nav labels, skip chrome, footer identity. `bèta` uses U+00E8. No BOS. No historical HERO/BETA variants. No mobile shortening.

### 37.9 Product-truth audit

Source, static markup, and Playwright `hasProhibited` checks found no open signup, public registration CTA, free/trial/pricing, request-access, waitlist, contact/demo CTA, generative/autonomous AI, Stripe/checkout, four editions, equal target-group cards, Course Sellers as the whole brand, LMS, public catalogue, guaranteed results, compliance, certification, absolute security, SLA, traction, testimonials, logos, or scarcity language. Unsupported positive claims: 0. Prohibited CTA controls: 0. Equal-availability implications: 0. Header/access `Inloggen` remains `/login` utility only.

### 37.10 Semantic audit

Public wrapper `lang="nl"`; root layout remains `lang="en"`. One H1, six H2s, logical order, real `header` / labelled `nav` / `main#hoofdinhoud` / `footer`. Unique IDs. Section IDs: `over-zyntixai`, `hoe-het-werkt`, `gesloten-beta`, `today`, `opleidingen-en-coaching`, `hoe-toegang-werkt`, `toegang`. Skip target `hoofdinhoud`. Fragment hrefs match real unique elements. Course Seller remains `section` in `main`. No invalid interactive nesting.

### 37.11 Hash-focus audit

Native fragments work without JavaScript (Playwright `javaScriptEnabled: false`: click `Over ZyntixAI` → `/#over-zyntixai`, heading visible). Enhancement listens to `hashchange` + initial load, uses `getElementById` (not selector injection), ignores missing targets, does not `preventDefault` clicks, does not attach a global handler outside this tree, and uses `focus({ preventScroll: true })` with no smooth-scroll dependency. R1 corrected destination focus to PW-8 Anchor Model B: `#hoofdinhoud` stays on `main`; other destinations focus the heading. Reproduced: click → H2 `Over ZyntixAI`; direct `/#today` → H2 Today heading; back/forward URLs remain usable.

### 37.12 Skip-link audit

Establishment attributed first-Tab failure to a Cursor harness limitation. Independent Playwright Chromium against local `http://127.0.0.1:3013/` did not accept that as the skip verdict.

Method: `chromium.launch({ headless: true })`; `page.keyboard.press("Tab")` after `goto /`.

Result: first Tab focused `Ga naar de hoofdinhoud` (`href="#hoofdinhoud"`), outline `rgb(31, 92, 87) solid 2px` / offset `2px`, `clipped: false`. Enter moved focus to `MAIN#hoofdinhoud` with hash `#hoofdinhoud`. At 320×568 the focused skip box was `top:12 left:12 bottom:56 right:217.5` inside `320×568`. At CSS `zoom: 2` first Tab still landed on the skip link, not clipped. AppShell English skip was not modified.

### 37.13 Disclosure audit

Visible summary label `Navigatie`. No modal/focus-trap/icon-only. No JavaScript required (no-JS 320: native summary click opened details and showed `Over ZyntixAI`). Playwright widths:

| Width | Nav mode | Duplicate explore focusable | Overflow |
| --- | --- | --- | --- |
| 1440, 1280, 1024, 844 landscape, 768, 721, 720, 700 | inline | no | 0 |
| 641, 640, 639, 390, 320 | disclosure; closed panel not shown | no; only `Navigatie` + `Inloggen` | 0 |

Threshold on this implementation is the `public-header` 40rem container query (media 45rem is fallback and is overridden when container queries apply). Keyboard at 320: Tab to `Navigatie`, Enter opens (`display:flex` panel), next Tab is `Over ZyntixAI`; Space also opens. `Inloggen` remains independently visible.

### 37.14 CSS-isolation audit

Tokens scoped under `.publicWeb`. No global `:root`. No AppShell/login/Home selectors. No `!important` except reduced-motion neutralization. System font stack exact. Radii modest. Shadows `none`. Focus 2px+2px `#1F5C57`. R1 removed `overflow-x: clip` (PW8-FOCUS-005 / no overflow masking). R1 added Today `border: 1px solid CanvasText` under `forced-colors`. R1 raised skip color specificity so `.publicWeb a` cannot turn the skip link teal.

### 37.15 Responsive-browser audit

Local production `npm start` `PORT=3013`. Playwright Chromium, exact CSS viewports:

1440×900; 1280×800; 1024×768; 844×390; 768×1024; 721; 720; 700; 641; 640; 639; 390×844; 320×568.

At every width: `htmlOverflow/bodyOverflow/rootOverflow = 0`; H1 exact; beta/Today/CS/trust/access visible; two visible `Inloggen` controls (header + access); access width 640px until it shrinks (288px at 320). 200% CSS zoom equivalent: `document.documentElement.style.zoom = "2"` on 1280×800; overflow 0; disclosure mode; skip still first Tab. WCAG text-spacing override at 1280×800: overflow 0; qualifiers remain in the tree; no clipped controls.

### 37.16 No-JavaScript audit

Playwright context `javaScriptEnabled: false`. `/` 200; H1 and all required Route A2 strings present; `details`/`Navigatie` present; `/login` link present; fragment click updated URL and left heading visible; 320 disclosure native-open worked; `/login` 200 with `Sign in`. No blank shell and no auth flash.

### 37.17 Keyboard/focus audit

Wide 1280: Tab order skip → wordmark → Over ZyntixAI → Hoe het werkt → Gesloten bèta → header Inloggen → access Inloggen. Narrow 320: skip → wordmark → Navigatie → header Inloggen → access Inloggen. No duplicate exploration links. No focus trap. Outline visible and not clipped on tested controls. Hash activation from open disclosure focused H2. 320 skip not covered by header.

### 37.18 Forced-colours / reduced-motion audit

`page.emulateMedia({ forcedColors: "active" })`: Today `1px solid rgb(0,0,0)`; access `2px solid rgb(0,0,0)`; login link underline; H1 present. `reducedMotion: "reduce"`: H1 present; skip `transition-duration: 0s`. Not an assistive-technology PASS.

### 37.19 Authenticated-browser evidence

`npm run test:browser:b1-c1`: 3 tests skipped; Playwright auth storage `playwright/.auth/production-owner.json` absent. The suite targets Production `https://www.zyntixai.com`, not this uncommitted worktree. Not counted as passed. No local authenticated browser session was invented. Local authenticated routing was verified by source + Vitest. Missing Production-owner browser pack remains a governed later gate (PW-14 / preview / owner bootstrap), not an R1 P0, because this phase does not publish and does not claim Production verification.

### 37.20 Test review

Public tests lock frozen copy, semantics, destinations, unique IDs, prohibited CTA absence, disclosure markup, CSS isolation, `force-dynamic`, invitation-cookie wiring, Today forced-colours border, no `overflow-x` clip/hidden, and hash-focus Model B source contracts. Auth tests cover missing session, null-user-with-error, resolver states, `/login` bounce, and middleware `/` vs `/home`. They do not mock away `HomePage` for the logged-out contract.

### 37.21 Full command results

| Command | Exit | Result | Validates |
| --- | --- | --- | --- |
| `npm run test:run -- tests/public-web/public-homepage.test.tsx` | 0 | 9 passed | local worktree |
| `npm run test:run -- tests/auth/entry-routing-and-login-ui.test.tsx tests/auth/middleware-auth-redirects.test.ts tests/auth/safe-return-path.test.ts tests/auth/resolve-authenticated-landing.test.ts` | 0 | 4 files, 56 passed | local worktree |
| `npm run test:run -- tests/auth tests/onboarding/product-admission-routing.test.ts tests/onboarding/onboarding-routing.test.ts tests/onboarding/product-admission-enforcement.test.ts` | 0 | 22 files, 175 passed | local worktree |
| Home/AppShell/foundation batch (8 files) | 0 | 123 passed | local worktree |
| `npm run test:run` full suite | 1 | 2 failed / 4210 passed / 536 files; 60.42s | local worktree; failures pre-existing and outside PW-13 files |
| `npm run lint` | 0 | No ESLint warnings or errors | local worktree |
| `npm run typecheck` | 0 | pass | local worktree |
| `npm run build` | 0 | `ƒ /`; autoprefixer warning in `platform-closed-beta-operator-list.module.css` (pre-existing, not public-web) | local worktree |
| `npm start` `PORT=3013` | running then stopped | `/` 200 public; `/login` 200; `/home` 307 `/login?next=%2Fhome` | local worktree |
| `npm run test:browser:b1-c1` | 0 | 3 skipped | current Production harness; not this worktree |
| `git diff --check` | 0 | clean | local worktree |
| `npx playwright install chromium` | 0 | browser binary only; package.json/lockfile unchanged | recorded |

Full-suite failures: `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` (Progress copy assertion); `tests/features/invitations/load-member-administration-page.test.ts` (org-context spy). Neither file is in the PW-13 diff.

### 37.22 Build/runtime review

Production build passed. `/` remains dynamic `ƒ`. First-load JS shared 103 kB; `/` page 1.07 kB. No hydration error in Playwright. No server exception in `next start` logs. CSS modules loaded (`/_next/static/css/*.css`). Client boundary limited to `PublicHashFocus`. Server stopped after review. No background process left running as a deliverable.

### 37.23 Security/privacy review

No user/org serialization to the public page. No organization query on the logged-out branch. No service-role client. Auth cookies not rendered. Hash handled via `getElementById`. No open redirect introduced (`/login` and `/` only). Response `Cache-Control: private, no-store`. Playwright recorded no third-party requests from `/`. No analytics, tracking, remote font, or image. No `dangerouslySetInnerHTML` in public-web source.

### 37.24 Performance review

No new dependency. No image. No remote font. Content server-rendered. No loading spinner. No auth flash. Hash-focus is a small client enhancer. Duplicate nav is CSS-exclusive, not a second hydrated island. Lighthouse was not run.

### 37.25 R1 findings

| ID | Sev | Area | Evidence | Impact | Before | Correction or disposition | Files | Tests | Owner | Publication consequence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW13-R1-FND-001 | P1 | Forced colours | `.today` set `border-color` without `border-width` | Today/CS separation could disappear in forced colours | Dead CSS | Added `border: 1px solid CanvasText` | `public-homepage.module.css` | public CSS lock | PW-13 R1 | Forced-colours Today boundary would be colour-only | Corrected |
| PW13-R1-FND-002 | P1 | CSS / focus | `.publicWeb { overflow-x: clip }` | Could mask overflow and clip focus contrary to PW8-FOCUS-005 | Clip present | Removed; Playwright overflow 0 at governed widths | `public-homepage.module.css` | CSS lock | PW-13 R1 | Overflow hidden instead of fixed | Corrected |
| PW13-R1-FND-003 | P1 | Caching | Root lacked explicit `force-dynamic` | Future refactor of the logged-out branch could cache user-dependent routing | Implicit dynamic via cookies client | `export const dynamic = "force-dynamic"`; `/` still `ƒ`; `no-store` | `src/app/page.tsx` | source lock | PW-13 R1 | Cross-user cache of `/` | Corrected |
| PW13-R1-FND-004 | P1 | Hash focus | Enhancement focused the section wrapper | Diverged from PW8-OD-005 heading focus | Section focus | Focus heading except skip/`main` | `public-hash-focus.tsx` | source lock + Playwright | PW-13 R1 | In-page focus lands on a wrapper | Corrected |
| PW13-R1-FND-005 | P2 | Skip colour | `.publicWeb a` teal could override `.skip` colour | Skip might appear teal if revealed | Specificity gap | Raised `.publicWeb .skip` ink rules | `public-homepage.module.css` | none extra | PW-13 R1 | Minor skip contrast/brand | Corrected |
| PW13-R1-FND-006 | P2 | AT | No screen-reader run | SR matrix not executed | Deferred | Later AT gate | none | none | PW-14 / a11y preview | Cannot claim WCAG/SR PASS | Open — later |
| PW13-R1-FND-007 | P2 | Auth browser | B1-C1 3 skipped; Production URL; no auth storage | Authenticated Home not browser-proven on this worktree | Skipped | Retain owner bootstrap / preview | none | none | Owner bootstrap / PW-14 | Production Home browser pack missing | Open — later |
| PW13-R1-FND-008 | P2 | Metadata/legal | Governed omissions | No favicon/legal/canonical/analytics | Omitted with authority | Do not implement in PW-13 | none | none | Later public-web phases | Incomplete publication chrome | Open — later |
| PW13-R1-FND-009 | P2 | Full Vitest | 2 failures outside PW-13 files | Full-suite not green | Pre-existing | Do not weaken those tests | none | none | Platform test hygiene | Unrelated red suite on HEAD | Open — later |
| PW13-R1-FND-010 | P2 | Visitor research | Not in scope | No user validation | Deferred | PW visitor research | none | none | Research later | No USER VALIDATED claim | Open — later |
| PW13-R1-FND-011 | P2 | Local auth session | No safe local authenticated browser session | Authenticated `/` not clicked in a browser | None invented | Vitest + source remain the local proof | none | existing resolver tests | Preview with test account | Authenticated `/` browser path later | Open — later |
| PW13-R1-FND-012 | P2 | Invitation HomePage fixture | HomePage tests do not seal a live invitation cookie | Wiring proven by source lock + resolver tests | Cookie mock empty | Residual fixture gap only | test source lock | existing invitation tests | Invitation/auth FV | Unlikely if resolver stays wired | Open — later |

P0 remaining: 0. P1 remaining: 0. P1 corrected: 4. P2 later-gated: 7. P2 corrected: 1. Exact R1 finding count: 12.

### 37.26 Corrections

Authorized R1 edits only: `force-dynamic`; Today forced-colours border; removal of `overflow-x: clip`; skip ink specificity; hash-focus heading resolution; public tests for those contracts. Frozen copy unchanged. Frozen design not redesigned. Authenticated Home / AppShell / login / middleware / dependencies unchanged.

### 37.27 Remaining deferred evidence

Screen-reader execution; Production-owner B1-C1; local authenticated browser session; metadata/legal/canonical/favicon/analytics; visitor research; unrelated full-suite failures; Today pronunciation AT detail. Each has an owner in §37.25.

### 37.28 Final changed-file register

Same nine paths as establishment, with R1 edits inside them. Staged: none. Generated artifacts: none committed to the worktree. Playwright binaries installed locally outside the repository. Temporary review scripts deleted.

### 37.29 Final verification of this R1 pass

Repository baseline exact. Scope authorized. No P0. No remaining P1. Root routing correct. Resolver and middleware remain correct. Frozen copy exact. Product truth preserved. Semantics, fragments, skip, disclosure, exclusive navigation, route-scoped CSS, responsive overflow-free widths, no-JS, keyboard, forced-colours, and reduced-motion independently verified where tooling permitted. Critical targeted tests, lint, typecheck, build, and runtime smoke passed. Security/privacy passed. No dependency change. Deferred checks explicit. Evidence reconciled. File integrity `git diff --check` clean.

### 37.30 Gate result

```text
PASS — PW-13-R1 INDEPENDENT CODE, ROUTING, ACCESSIBILITY & BROWSER REVIEW CLOSED WITH EVIDENCE
```

### 37.31 Resulting PW-13 status

```text
PW-13 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

Nothing staged, committed, pushed, or deployed. PW-14 not started. Final verification is separately authorized.

End of PW-13-R1 independent review evidence.
