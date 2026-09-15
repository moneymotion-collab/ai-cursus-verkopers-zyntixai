# PW-4 — Public Information Architecture

| Field | Value |
| --- | --- |
| Document | PW-4 — Public Information Architecture |
| Type | Decision and handoff authority (not copy, not wireframes, not implementation) |
| Date | 2026-09-15 |
| Branch | `core/platform-readiness-20260707` |
| HEAD at drafting | `9c12c977383a100eb548880d8d35b329b4406f90` |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Binding closures | PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; PW-3 `9c12c977383a100eb548880d8d35b329b4406f90` |
| Authenticated Home | Closure `49cd5773976143139a154f9b8ddf36535a4dd914`; Production product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Establishment status (historical) | `CONDITIONAL — PW-4 OWNER IA DECISIONS REQUIRED` — see §34.1; superseded as current status by §35 and §37 |
| Current status | `PW-4 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` |

---

## 1. Document Control

This file is the sole PW-4 deliverable. It freezes **information architecture roles**, not publication copy, visual layout, or routes.

| Control | Rule |
| --- | --- |
| Product code | Unchanged by this phase |
| Authenticated Home | Closed; not reopened |
| Dual-use `/` | Not mutated; `src/app/page.tsx` remains P1-protected until later authority |
| Copy | Not written; section IDs are information roles |
| Wireframes / visual design | Out of scope |
| Implementation | Forbidden in PW-4; `DESIRED IA DECISION ≠ TECHNICAL IMPLEMENTATION AUTHORITY` |
| PW-4-R1 | Independent review recorded in §38; PW-4-FV and PW-5 not started |
| Owner IA freeze | `EXPLICIT ZYNTIXAI OWNER INFORMATION ARCHITECTURE DECISION` (2026-09-15). Desired-IA choices in `PW4-OD-001`–`006` are frozen as specified in §32 and §37. This is not visitor research, Production proof, technical feasibility, legal approval, final copy, design freeze, implementation, or deployment authority. |

Owner IA decisions: **5 fully resolved**, **1 partially resolved** (`PW4-OD-003`), **0 open**. Remaining gates are technical, publication, legal, or destination gates — not reopeners of the frozen desired-IA choices. Conservative implementation default remains: do not mutate `/`, middleware, landing resolvers, `/login`, `/home`, shared CSS, or metadata.

---

## 2. Executive Decision

A professional public information architecture for ZyntixAI is **owner-frozen as desired IA** and is **not** publication-ready. `DESIRED IA DECISION ≠ TECHNICAL IMPLEMENTATION AUTHORITY`.

**Current production truth:** unauthenticated `https://www.zyntixai.com/` does not present a marketing homepage. `src/app/page.tsx` redirects logged-out visitors to `/login`. Authenticated `/` resolves membership- and onboarding-aware product entry. `/home` is authenticated Daily Operating. Public registration is fail-closed. The only live public utility destination is Sign in for existing accounts.

**Desired IA (owner-frozen):** a quiet **single-page public foundation** (Site Model A, `PW4-OD-004`) on a **conditional public root** (Root Model A, `PW4-OD-001`): unauthenticated `/` should eventually show the public homepage; authenticated `/` conceptually retains governed membership/onboarding-aware product-entry. Visitors explore via **in-page** content roles (`PW4-OD-005`). Closed-beta maturity is **early in the initial viewport / Layer B**, after identity/value, never footer-only (`PW4-OD-006`). Course Sellers may appear as **one qualified relevance context** (Option 2, `PW4-OD-002`), not as the brand, not co-primary, not LMS, and not a complete current-SHA edition. Homepage trust is **named controls only** (`PW4-OD-003`). Sign in remains a returning-user utility. Business Operating System is not required in the first information. AI is not the information hook. `RELEVANCE ≠ AVAILABILITY`. Four equal target-group cards remain rejected.

**Publication-ready architecture:** none of the desired public marketing destinations exist. HOLD and PROHIBIT actions have no live public destinations. Legal/privacy content remains **EXTERNALLY GATED** (OD-003 remainder). Canonical-host ownership remains unresolved (`PW0-PB-034`). Technical feasibility of Root Model A is **not** proven. `src/app/page.tsx`, middleware, and landing resolvers remain protected.

**Selected site model:** Site Model A — single-page public foundation. `RESOLVED — OWNER FROZEN` (`PW4-OD-004`). Site Model B is later expansion only. Site Model C remains rejected.

**Selected root model:** Root Model A — conditional public root. `RESOLVED — OWNER FROZEN FOR DESIRED IA` (`PW4-OD-001`). Root Model B remains rejected. Root Model C is a **safe technical fallback** only if Model A cannot later be implemented responsibly — not the chosen visitor architecture. **Do not change `/`.**

**Current gate:** `PW-4 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT`. Establishment `CONDITIONAL` is historical evidence only (§34.1). R1 evidence is §38. PW-4 is not `CLOSED WITH EVIDENCE` until FV.

---

## 3. Purpose

PW-4 determines:

- which public information needs exist;
- which page and content roles those needs require;
- what belongs on a future homepage;
- how visitors find information;
- how public and authenticated journeys stay separate;
- which navigation and routes are logically coherent;
- which parts are not publication-ready;
- which later decisions copy, design, and implementation still require.

This document is the IA authority for PW-5 through PW-13. It is not a sitemap of live URLs. Owner-frozen desired IA is recorded in §32 and §37; technical implementation remains gated.

---

## 4. Scope

| In scope | Meaning |
| --- | --- |
| Three-layer classification | CURRENT PRODUCTION TRUTH vs DESIRED IA vs PUBLICATION-READY |
| Visitor information needs | `PW4-NEED-001` … `PW4-NEED-018` |
| Public page inventory | `PW4-PAGE-001` … `PW4-PAGE-016` |
| Homepage information roles | `PW4-SEC-001` … `PW4-SEC-012` |
| Progressive disclosure | `PW4-DISC-001` … `PW4-DISC-010` |
| Navigation roles | `PW4-NAV-001` … `PW4-NAV-008` |
| Root-route options | Compared in §17; desired IA frozen as Root Model A (`PW4-OD-001`); implementation gated |
| Public/authenticated boundaries | `PW4-BND-001` … `PW4-BND-016`; surfaces remain protected |
| Journeys, CTAs, stops | `PW4-JNY-*`, `PW4-CTA-*`, `PW4-STOP-*` |
| Target-group, trust, footer, responsive, accessibility, discoverability, analytics boundary | Architecture only; OD-002/003/006 frozen as specified |
| Risks, validation plan, open questions, owner decisions | Validation planned not executed; OD register frozen per §32; §37 evidence |
| Owner-decision freeze | §37 — desired IA vs implementation distinction |
| Independent R1 | §38 — `PW4-R1-FND-001` … `PW4-R1-FND-022` |

---

## 5. Non-Scope

PW-4 does **not**:

- write homepage or navigation copy;
- choose visual layout, breakpoints, or component design;
- implement routes, middleware, layouts, CSS, or metadata;
- change `/`, `/login`, `/home`, or authenticated Home;
- invent HOLD destinations or PROHIBIT CTAs;
- invent visitor research, analytics, conversion rates, or certifications;
- resolve legal/privacy content;
- resolve apex/www ownership;
- start PW-4-FV or PW-5;
- treat a desired page as an existing or publication-ready page;
- treat this owner freeze as implementation or deployment authority.

---

## 6. Binding Authority

| Source | SHA / status | Binding use in PW-4 |
| --- | --- | --- |
| B1-GATE.1 | Governance standard | AND-gate completeness; documentation-only slice needs no browser/production gate |
| PW-0 | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` | Dual-use `/` (`PW0-PB-017`, `PW0-PB-036`); root layout (`PW0-PB-018`); middleware (`PW0-PB-020`); login (`PW0-PB-024`); register (`PW0-PB-025`); site-origin (`PW0-PB-027`); apex/www unresolved (`PW0-PB-034`) |
| PW-1 | `e694b85ead8a4b75054a078624aadfd315cea39d` | Product-truth ceiling; CTA ALLOW/HOLD/PROHIBIT; closed-beta; no four editions |
| PW-2 | `d3bea25bca052ebdd6adce4c9c08328a41445eba` | `PW2-VIS-001` sole brand-primary; journeys; Sign in utility; `PW2-FUT-006` in-page exploration publication HOLD until real IDs/focus; `PW2-OD-009` dual-use `/` remains a PW-0/PW-13 boundary (desired IA now Root A) |
| PW-3 | `9c12c977383a100eb548880d8d35b329b4406f90` | Model A; `PW3-POS-001`; `PW3-TER-001`; BOS not mandatory Layer A; AI not hero-hook; `PW3-OD-008` superseded for **public IA direction** by `PW4-OD-005` (in-page); `PW3-OD-009` homepage named-controls only, legal externally gated — aligned by `PW4-OD-003` |
| Authenticated Home | Closure `49cd5773…`; product `d110b6e3…` | `/home` closed; public IA must not restyle or reopen it |

Owner-frozen strategy that PW-4 must not reverse:

- Audience Model A; `PW2-VIS-001` sole brand-primary.
- Course Sellers SECONDARY leading evidenced relevance; not brand-primary or co-primary.
- Public direction: operational clarity for small-business operators.
- `PW3-TER-001` leading; TER-002/003 not co-leading.
- BOS = governed product intent, not mandatory first information.
- AI not chatbot-first; no generative/autonomous/connect-any-provider journey.
- `RELEVANCE ≠ AVAILABILITY`; TG2–TG4 deferred thin slices.
- Sign in ALLOW WITH QUALIFIER; Create account / Register / Start free / Start trial / Connect AI provider **PROHIBIT**; Request beta / waitlist / contact / view product / watch demo **HOLD**.

---

## 7. Evidence Classification

| Class | Meaning in this document |
| --- | --- |
| `CURRENT PRODUCTION` | Observed or previously production-verified runtime behavior |
| `CURRENT SOURCE` | Present in this repository at HEAD |
| `OWNER-FROZEN STRATEGY` | Frozen in PW-2 / PW-3 owner decisions; not reversed here |
| `OWNER-FROZEN DESIRED IA` | Frozen in PW-4 owner decisions (`PW4-OD-001`–`006`); not publication-ready; not implementation authority |
| `GOVERNED PRODUCT INTENT` | Intended product meaning in PW-1; not a live public page |
| `PROPOSED IA` | Historical establishment wording for structures before the OD freeze; active selected models are `OWNER-FROZEN DESIRED IA` |
| `HOLD — DESTINATION MISSING` | Information or action role exists; no governed public destination |
| `EXTERNALLY GATED` | Requires legal, platform, or content authority outside this file |
| `PROHIBITED` | Must not appear as a public destination or control |
| `PUBLICATION READY` | Real destination + governed policy + copy + a11y evidence + implementation + regression + deployment authority. **None of the desired public marketing surfaces currently qualify.** |
| `UNKNOWN` | Not proven in this worktree or production evidence cited here |

Never use “current” for a desired future page.

---

## 8. Current Architecture Findings

### 8.1 Unauthenticated `/`

**CURRENT PRODUCTION / CURRENT SOURCE.** `src/app/page.tsx` is a dual-use entry resolver, not a marketing homepage.

- No session: `redirect("/login")`.
- Session present: `resolveAuthenticatedEntryPath` using invitation cookies.
- Middleware (`src/middleware.ts` → `updateSession`) does **not** treat `/` as a protected application path. The logged-out `/` → `/login` hop is the Server Component redirect.
- Production observation recorded in PW-0: `https://www.zyntixai.com/` → `307` → `/login`.

There is no `(marketing)` or `(public)` App Router group. There is no public marketing homepage.

### 8.2 Authenticated `/`

**CURRENT SOURCE.** Logged-in visitors hitting `/` are sent through `resolveAuthenticatedEntryPath` (`src/features/auth/server/resolve-registration-destination.ts`). This is product-entry, not public IA. Landing is **membership- and lifecycle-aware**, not a universal `/home` default.

| Authenticated condition | Current `/` result (source) |
| --- | --- |
| Email not verified | `/register/check-email` |
| Trusted invitation context | `/invite/accept` |
| Zero active memberships; invitation-resume path | `/invite/accept` |
| Zero active memberships; otherwise | `/register/complete` (no auto-provision) |
| One membership, onboarding incomplete | `/onboarding?org=…` (or operating-model onboarding path) |
| One membership, onboarding complete | `/home?org=…` |
| Multiple memberships | `/home` (organization selection) |

Zero-membership users never auto-provision. Tests that pin this include `tests/auth/resolve-authenticated-landing.test.ts` (single completed org → `/home?org=`; incomplete → `/onboarding?org=`; multi-org → `/home`).

### 8.3 `/login`

**CURRENT SOURCE.** `src/app/login/page.tsx` is Sign in.

- Unauthenticated: renders `LoginForm`; brand text “ZyntixAI”; registration link only if `isPublicRegistrationEnabled()`; otherwise fail-closed messaging when `registration=disabled`.
- Authenticated: page-level bounce via `resolvePostLoginDestination`; **middleware also bounces authenticated `/login` to `/` and strips the query string** (`tests/auth/middleware-auth-redirects.test.ts`: `/login?next=/tasks` → `/` with empty search).
- `DEFAULT_RETURN_PATH` is `/`. Authenticated login therefore re-enters the dual-use root resolver. Under desired Root Model A, that bounce must still hit the **authenticated** branch of `/`, not the public homepage.

`/login` is auth-owned. It is not a marketing homepage. Restyling it as a public-web acquisition surface is **not** authorized (`PW2-OD-009` remains open; conservative default: do not restyle via public-web IA).

### 8.4 `/home`

**CURRENT SOURCE.** `src/app/(authenticated)/home/page.tsx` is the Daily Operating brief. Middleware treats daily-operating Home as a protected application path. Unauthenticated `/home` redirects to `/login?next=…`. Authenticated Home is **outside public IA**.

`(authenticated)/layout.tsx` currently passes children through with no extra chrome. Public styling must not be introduced here.

### 8.5 Public registration and invite

**CURRENT SOURCE.** `isPublicRegistrationEnabled()` fail-closes unless `PUBLIC_REGISTRATION_ENABLED` parses to exact `true`. `/register` without trusted invitation continuation redirects to `/login?registration=disabled`. Live Production flag is **UNKNOWN** in this worktree (PW-1: last governed policy is invite-only closed beta). Public IA must treat Create account / Register as **PROHIBIT**.

`/invite/accept` is invitation-owned admission, not a marketing page.

### 8.6 Recovery and other auth routes

**CURRENT SOURCE.** `/forgot-password`, `/reset-password`, `/auth/callback`, `/register/check-email`, `/register/complete` exist. They are authentication/admission surfaces. They are not public marketing destinations.

### 8.7 Shared layout, CSS, metadata, chrome

**CURRENT SOURCE.**

| Surface | Finding |
| --- | --- |
| `src/app/layout.tsx` | `lang="en"`; title `ZyntixAI`; description `ZyntixAI application foundation`; imports `./globals.css` |
| Favicon / `app/` icons | No `favicon.ico` / app icon files found under `src/app`; middleware matcher excludes `favicon.ico` |
| `public/` | No `public/` tree found in this worktree |
| `next.config.ts` | `reactStrictMode` only; no redirects, rewrites, headers, or host rules |
| `vercel.json` | `{ "crons": [] }` |
| robots / sitemap / Open Graph | No matches in `src` |
| Analytics | `PW1-CLM-060` NOT PRESENT / PROHIBIT |

### 8.8 Canonical host

**CURRENT PRODUCTION (observed, not repo-owned).** Apex `zyntixai.com` → `www.zyntixai.com` 308 was production-observed in H1-FV. It is **not** in `vercel.json` or `next.config.ts`. Ownership is **UNKNOWN** (`PW0-PB-034`). `resolveSiteOrigin` prefers `NEXT_PUBLIC_SITE_URL`, then `VERCEL_URL`, then `http://127.0.0.1:3000`. Tests pin `https://www.zyntixai.com` as auth origin. Canonical-host implementation is **not** PW-4-owned.

### 8.9 Errors and not-found

**CURRENT SOURCE.** No root `src/app/not-found.tsx`. Authenticated feature error files exist. Public 404 is Next.js default unless later designed. **UNKNOWN** as a governed public error experience.

### 8.10 Inventory method

Read-only: `rg --files` / glob of `src/app/**/page.tsx`; `src/middleware.ts`; `src/lib/supabase/middleware.ts`; landing and registration resolvers; `site-origin.ts`; `next.config.ts`; `vercel.json`; `tests/auth/middleware-auth-redirects.test.ts`; `tests/auth/resolve-authenticated-landing.test.ts`; `tests/auth/entry-routing-and-login-ui.test.tsx`; Home browser specs under `tests/browser/b1-c1-production-home.*.spec.ts`; `tests/onboarding/product-admission-app-shell.test.ts`. No product tests were executed for this documentation slice.

---

## 9. Current vs Desired vs Publication-Ready IA

| Layer | What it is | What it is not |
| --- | --- | --- |
| CURRENT PRODUCTION TRUTH | Dual-use `/` → `/login` for logged-out visitors; Sign in; fail-closed register; protected `/home`; invite/recovery auth-owned | A public marketing site |
| DESIRED INFORMATION ARCHITECTURE | Owner-frozen Site Model A + Root Model A + in-page exploration + Option 2 CS treatment + early Layer B closed beta + named-control trust | A claim that those pages, routes, or legal documents exist; not implementation authority |
| PUBLICATION-READY ARCHITECTURE | Requires a real destination, governed policy, correct copy, accessibility evidence, implementation, regression evidence, and deployment authority | Any desired-IA row in this file, including owner-frozen choices |

A desired page is not an existing page. A proposed navigation item is not a live `href`.

---

## 10. Visitor Information-Need Register

Unproven needs are **hypotheses**. Depth is architectural, not copy.

| Need ID | Visitor | Information need | Triggering question | Required information | Required depth | Ideal location | Urgency | Evidence source | Current availability | Unresolved dependency |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-NEED-001 | VIS-001 | What ZyntixAI is | What is ZyntixAI? | Name + daily operational purpose in plain language | First five seconds / initial viewport | Public homepage identity (`PW4-SEC-001`) | Immediate | PW-2 Q; PW-3 MSG-001/002; TER-001 | Not available on unauthenticated `/` | Public homepage; PW-6 copy |
| PW4-NEED-002 | VIS-001 | Intended audience | For whom is it intended? | Small-business owner/operator; not four equal editions | Early homepage | Homepage after identity | Immediate | Model A; VIS-001; `PW4-OD-002` | Missing | Copy; CS treatment frozen as Option 2 when shown, not hero |
| PW4-NEED-003 | VIS-001 | Daily problem | Which daily problem does it help organize? | Scattered daily work; operational clarity objects | Early homepage | `PW4-SEC-002` | Immediate | PW-3 PRB/TER-001 | Missing | PW-6; no fabricated research |
| PW4-NEED-004 | VIS-001 | Conceptual mechanism | How does it work conceptually? | Work objects, attention, operating rhythm — not a feature dump | Mid-page | `PW4-SEC-004` | After recognition | PW-3 MSG-005/006 | Missing | PW-5 content model |
| PW4-NEED-005 | VIS-001 | Chatbot expectation | Is it only a chatbot? | Recognition outcome: not chatbot-first; AI not hero | When AI or the name is active | `PW4-SEC-001` outcome and `PW4-SEC-008` if AI is named | High if AI is shown | PW-3 OD-006; MSG-003/012 | Missing | Whether AI is named on homepage (PW-5) |
| PW4-NEED-006 | VIS-001 | Category meaning | What does Business Operating System mean? | Plain-language qualifier; not technical OS / all-in-one / autonomous / GA | With the category, not in the first information by default | `PW4-SEC-004` if BOS is used | After plain-language meaning | PW-1; PW-3 category rules | Missing | Whether BOS appears at all on homepage |
| PW4-NEED-007 | VIS-001 | Proof-backed parts | Which parts exist demonstrably? | Only PW-1-backed areas; no screenshot-as-tour | Mid-page | `PW4-SEC-005` | After mechanism | PW-1 claims | Missing public explanation | Copy bounded by PW-1 |
| PW4-NEED-008 | All public | Maturity | How mature is the product? | Invite-only closed beta; not GA | Initial viewport / Layer B (not footer-only) | `PW4-SEC-003` | Immediate | PW-1; PW-3 MSG-009; `PW4-OD-006` | Missing on public `/` | Exact phrasing `PW3-OD-007`; visual placement later design |
| PW4-NEED-009 | VIS-001 | Public availability | Is it publicly available? | Not open self-serve; invite-only | With maturity | `PW4-SEC-003` / `PW4-SEC-010` | Immediate | PW-1 closed beta; `PW4-OD-001` desired Root A | Login exists; availability story missing | Technical root implementation PW-13; copy |
| PW4-NEED-010 | VIS-001 | Account creation | Can I create an account? | No public self-serve account creation | Access clarification | `PW4-SEC-010`; honest stop | Immediate | PW1-CLM-046 PROHIBIT | Fail-closed `/register`; must not be offered as CTA | Policy remains fail-closed |
| PW4-NEED-011 | Interested visitor | Beta intake | Can I sign up for the beta? | No public intake destination today | Honest stop | `PW4-STOP-003` | After maturity | PW1-CLM-047 HOLD | **HOLD — DESTINATION MISSING** | Intake authority |
| PW4-NEED-012 | Course Seller visitor | CS availability | What is available for Course Sellers? | Leading relevance example; not LMS; not a complete current-SHA CS edition; not public course platform or catalog | With CS relevance, not as brand; not required above the fold | `PW4-SEC-006` when TG relevance is shown | After general brand | PW-1 CS claims; PW-3 MSG-007/015; `PW4-OD-002` | Missing | Copy/qualifiers; Option 2 frozen as treatment, not hero mandate |
| PW4-NEED-013 | TG2–TG4 visitor | Other contexts | Are Agencies, Field, and E-commerce already available? | Explicit not-currently-available; unequal status; `RELEVANCE ≠ AVAILABILITY` | With any TG mention | `PW4-SEC-007` only if named and unequally qualified | If those names appear | PW-1; `PW4-OD-002` | Missing | Four equal cards remain rejected; omit equal presentation |
| PW4-NEED-014 | Trust seeker | Data handling | What happens to my data? | Homepage: named controls only; legal conclusions **EXTERNALLY GATED** | Short on homepage; legal page only with authority | `PW4-SEC-009`; legal page HOLD | After comprehension | PW3-OD-009; `PW4-OD-003` PARTIALLY RESOLVED | Named-controls not published; no public legal page found | Legal/content authority (OD-003 remainder) |
| PW4-NEED-015 | VIS-007 | Sign in | Where can an existing user sign in? | Sign in utility to `/login` | Persistent utility, not primary acquisition | Utility nav `PW4-NAV-005` | Immediate for returning users | PW1-CLM-045 | **CURRENT PRODUCTION** `/login` | Must not be relabelled Start/Join/Explore |
| PW4-NEED-016 | Uninvited visitor | Safe public action | What can a non-invited visitor safely do? | Read public information; Sign in only if they have an account; otherwise honest stop | Entire public journey | Homepage + stop | Immediate | PW-2 journeys | Today: only `/login` | Public homepage |
| PW4-NEED-017 | All | Homepage exclusion | Which information does not belong on the homepage? | No pricing, careers, blog, four equal editions, legal conclusions, HOLD buttons, authenticated chrome | Architecture rule | This IA; PW-5 | Immediate | This document §14.2 | n/a | Downstream must not add excluded roles |
| PW4-NEED-018 | All HOLD seekers | Honest stop | Which questions can currently only be answered with an honest stop? | Beta request, waitlist, contact, demo, tour, public signup, trial | Informational stop, not a fake CTA | `PW4-STOP-*` | When those expectations appear | PW-1 HOLD/PROHIBIT | No designed stop; login is the only public screen | Copy; destination still missing |

`PW4-NEED-017` is a governance need (what to omit), not a visitor research finding.

---

## 11. Public Page Inventory

Pages exist in this inventory only when a visitor need or governance obligation exists. Classification is publication role, not “this URL is live.”

| Page ID | Page role | Visitor need | Current state | Desired state | Publication status | Required authority | Route status | Dependency | Exclusion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-PAGE-001 | Public homepage | NEED-001–011, 015–018 | No marketing homepage; unauthenticated `/` redirects to `/login` | Single-page public foundation with section roles `PW4-SEC-*` on desired conditional `/` | `REQUIRED FOR INITIAL PUBLIC IA` | Desired Root Model A (`PW4-OD-001`); PW-5–8; PW-13 technical plan | No public marketing route; `/` protected | Copy, a11y, implementation, Home regression if `/` later changes | Must not be authenticated Home; must not imply GA |
| PW4-PAGE-002 | Sign-in utility | NEED-015 | `/login` exists; authenticated bounce to `/` | Remain Sign in for existing accounts | `REQUIRED FOR INITIAL PUBLIC IA` | Auth-owned; PW-1 qualifier | **CURRENT SOURCE** `/login` | Must stay labelled Sign in; bounce must be preserved or consciously reconciled in PW-13 | Not acquisition; no Create account |
| PW4-PAGE-003 | Authenticated product entry | Admitted users | `/home` Daily Operating | Unchanged authenticated Home | `AUTHENTICATED — OUTSIDE PUBLIC IA` | Home closure | **CURRENT SOURCE** `/home` | Home remains closed | Public nav must not deep-link product modules as marketing |
| PW4-PAGE-004 | Dual-use root resolver | Product entry vs public arrival | `src/app/page.tsx` | Desired: Root Model A (unauthenticated public homepage; authenticated product-entry retained conceptually) | Shared surface; not a marketing page today | `PW4-OD-001` desired IA frozen; PW-13 implementation | **CURRENT SOURCE** `/` | Protected until PW-13 authority | Do not treat as publication-ready homepage; no route change in PW-4 |
| PW4-PAGE-005 | Invite acceptance | Invited participant | `/invite/accept` | Remain invitation-owned | `AUTHENTICATED — OUTSIDE PUBLIC IA` | Invitations feature | **CURRENT SOURCE** | Not a marketing CTA | No public “get invited here” form |
| PW4-PAGE-006 | Public registration | NEED-010 | `/register` fail-closes without trusted invite | Must not appear as public marketing destination | `PROHIBITED` | Public-registration policy | Route exists; policy fail-closed | Live flag UNKNOWN | No Register / Create account CTA |
| PW4-PAGE-007 | Password recovery | Existing account holder | `/forgot-password`, `/reset-password` | Remain auth-owned | `AUTHENTICATED — OUTSIDE PUBLIC IA` | Auth | **CURRENT SOURCE** | Linked from login, not public nav | Not a public-web conversion journey |
| PW4-PAGE-008 | Contact | Contact seekers | No public `/contact`; authenticated support mailto only | None until destination exists | `HOLD` | Contact destination + policy | **HOLD — DESTINATION MISSING** | PW1-CLM-049 | No fake contact page |
| PW4-PAGE-009 | Beta-interest / request access | NEED-011 | No public intake | None until governed intake exists | `HOLD` | Intake workflow | **HOLD — DESTINATION MISSING** | PW1-CLM-047 | No request-access button |
| PW4-PAGE-010 | Waitlist | Waitlist seekers | Internal BQA only; no public page | None as public site | `HOLD` | Public waitlist authority | **HOLD — DESTINATION MISSING** | PW1-CLM-048 | No BQA-as-website waitlist |
| PW4-PAGE-011 | Preview / product tour | NEED-007 | No public tour | Optional later if assets and truth allow | `HOLD` | PW1-CLM-050; `PW4-OD-005` | **HOLD — DESTINATION MISSING** | Real dest.; not `/home` | No mock tour |
| PW4-PAGE-012 | Demo | Demo seekers | No demo route or video surface | None | `HOLD` | Asset + hosting | **HOLD — DESTINATION MISSING** | PW1-CLM-051 | No Watch demo control |
| PW4-PAGE-013 | Privacy / legal explanation | NEED-014 | No public privacy route found | Only with external legal authority | `EXTERNALLY GATED` | Legal/content owner | Missing | `PW4-OD-003` | No template privacy claims |
| PW4-PAGE-014 | Terms | Legal seekers | No public terms route found | Only with external legal authority | `EXTERNALLY GATED` | Legal authority | Missing | Same as PAGE-013 | No invented terms |
| PW4-PAGE-015 | Separate product-explanation page | NEED-004–007 | Does not exist | Not part of the initial Site Model A standard; optional later only if a real visitor need, governed content, working route, and maintenance exist | `OPTIONAL LATER` | `PW4-OD-004` Site Model A frozen; `PW4-OD-005` in-page is the initial exploration | Missing | Must not be created empty | Do not create empty `/product` as initial IA |
| PW4-PAGE-016 | Public not-found / error | Lost visitor | No root `not-found.tsx`; Next default **UNKNOWN** | Designed public 404 later | `OPTIONAL LATER` | PW-7/PW-8/PW-13 | Default only | Must not expose product chrome | Must not invent marketing sitemap links |

**Not inventoried as public pages:** pricing, careers, blog/resources, comparison, solutions hubs, four edition landing pages, status page, social-link destinations. No visitor need or governance obligation currently justifies them. Creating them now would be fake scale (Site Model C).

Safe-stop is a **role** on `PW4-PAGE-001`, not a separate URL (`PW4-STOP-*`).

---

## 12. Minimum Viable Public IA Options

Historical comparison from establishment (unchanged as evidence). **Selection is now owner-frozen** in §13 and `PW4-OD-004`.

### 12.1 Site Model A — Single-page public foundation

**Selected.** One public homepage carries identity, problem, maturity, mechanism, one qualified CS relevance context when TG relevance is shown, named-control trust, access clarification, returning-user Sign in, and honest stop. Navigation is mostly **in-page destinations** with real future section IDs and focus management. Separate pages are added only when a real visitor need, governed content, a working route, and responsible maintenance exist.

Fits current maturity: almost every desired destination besides `/login` is missing.

### 12.2 Site Model B — Small multi-page public site

Homepage plus separate product, relevance, and trust/access pages. More routes and nav depth. Requires real pages, copy, a11y, and canonical URLs for each. High empty-page risk while HOLD destinations and legal authority are missing. **Not selected** as the initial foundation. Remains a possible later expansion after those conditions exist.

### 12.3 Site Model C — Broad SaaS marketing site

Solutions, pricing, resources, comparison, conversion funnels. **Evaluated and rejected** for the initial public IA. Not co-selected.

Not allowed as the initial standard: a broad empty SaaS marketing site; pricing page; resources hub without content; blog without governance; comparison pages; four solution/edition pages; careers page without purpose; empty contact page; empty demo page; fake trust or legal page.

### 12.4 Comparison

Scale (declared): **Strong** / **Adequate** / **Weak** / **Fail**. Independent R1 re-score; Site Model A remains owner-frozen and is independently supported.

| Criterion | Site A | Site B | Site C |
| --- | --- | --- | --- |
| VIS-001 comprehension | Strong if hierarchy and disclosure are correct | Adequate if pages are real and linked | Weak: implies a mature marketing org |
| PW-1 truth fit | Strong: one honest surface | Mixed: empty inner pages become lies | Fail: fake scale |
| PW-3 positioning fit | Strong: operator-first, Layer A/B/C order possible | Adequate if inner pages preserve hierarchy | Weak: solutions/pricing chrome fights TER-001 |
| Destination readiness | Strong: only `/login` is a live public dest. | Fail today: extra routes missing | Fail |
| Maintenance burden | Strong (lowest) | Medium | Weak (high) |
| Empty-site risk | Strong (lowest) | Weak | Fail |
| Mobile usability | Strong: one stacking order | Adequate if kept consistent | Weak |
| Accessibility | Adequate: fewer routes; in-page focus still required later | More pages, more landmarks to prove | Weak |
| Discoverability | Adequate for closed beta; indexation gated | Slightly more URLs if those URLs are real | Harmful if empty pages indexed |
| Future scalability | Strong: extra pages only when need + content + route exist | Natural later expansion | False scale now |
| Implementation complexity | Adequate (lowest public surface; still high if `/` changes) | Higher | Weak (highest) |
| Auth-boundary risk | Depends on root model, not page count | More public CSS/nav sharing | Weak (highest sharing) |

Model C remains rejected while evidence, content, and destinations are missing. It would force PROHIBIT and HOLD journeys into a marketing chrome they cannot support.

**Single-page does not mean:** all conceivable information on one unbounded scroll; no future legal/error/auth-utility pages; no semantic navigation; or no later Site Model B expansion. It means one **quiet public foundation URL** with progressive disclosure (`PW4-DISC-*`), Sign in as a separate utility, and extra pages only when they have a real need, governed content, a working route, and maintenance.

---

## 13. Selected IA Model

**Selected:** Site Model A — single-page public foundation.

**Classification:** `OWNER-FROZEN DESIRED IA` (`PW4-OD-004`). Status: `RESOLVED — OWNER FROZEN`.

**Establishment history:** this model was recommended in the CONDITIONAL establishment draft. It is now owner-selected. That history is not rewritten as if the freeze existed at first drafting.

**Rationale (unchanged):** visitor comprehension can be met on one governed homepage; `/login` already exists as utility; almost all other public destinations are HOLD, EXTERNALLY GATED, or PROHIBITED. Model B is reserved for later expansion after real destinations exist. Model C remains rejected.

In-page destinations remain **not publication-ready** until real section IDs, landmarks, heading hierarchy, keyboard use, focus management, screen-reader link purpose, browser navigation, mobile usability, reduced-motion/no-JavaScript comprehensibility, and regression evidence exist (`PW4-OD-005`). `OWNER-FROZEN IA DIRECTION — NOT YET PUBLICATION READY`.

This selection is **not** an implementation decision and does **not** authorize editing `/`.

Independent R1 confirmation: Site Model A remains the only foundation that fits current destination readiness without inventing empty pages. It is not a license to dump every future topic onto one unbounded page.

---

## 14. Homepage Information Hierarchy

Content roles, not section titles or copy.

| Section ID | Information role | Visitor question | Priority | Required evidence | Required qualifier | Action role | Mobile order | May defer? | Prohibited implication |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-SEC-001 | Identity and operational recognition | What is this, and is it for operators like me? | 1 | PW-3 MSG-001/002; VIS-001 | Operator-first; not chatbot-first | None (recognition) | 1 | No | Live marketing site; chatbot product; CS as brand |
| PW4-SEC-002 | Plain-language value orientation | What daily work does this organize? | 2 | TER-001 objects; PW-3 VP without guaranteed outcomes | No fabricated research | None | 2 | No | Guaranteed growth/revenue; LMS |
| PW4-SEC-003 | Closed-beta maturity and availability | How mature is this, and can I use it? | 3 | PW-1 closed beta; MSG-009 | Invite-only; not GA; not scarcity theater | Informational; not a HOLD button | 3 (still early; not footer) | No | GA; Start free; public signup |
| PW4-SEC-004 | Conceptual mechanism | How does it work? | 4 | MSG-005/006; PW-1 | BOS only if used, with qualifier; not technical OS | In-page exploration later | 4 | Mechanism required; unexplained BOS may be omitted | All-in-one; autonomous AI |
| PW4-SEC-005 | Operational capabilities (proof-backed) | What parts exist? | 5 | PW-1 only | Current-SHA limits | None or in-page | 5 | Yes, if it would dump features | Screenshots as live public product; completeness |
| PW4-SEC-006 | Course Seller relevance context | Does this relate to course-based work? | 6 | CS claims; MSG-007/015; `PW4-OD-002` | Not LMS; not complete CS edition; SECONDARY; not public course platform/catalog; Home Production evidence must not be expanded to a full CS edition | None | After general brand; **not** required above the fold | Treatment frozen as Option 2 **when shown**; not a hero mandate | CS as brand-primary; equal editions |
| PW4-SEC-007 | Broader / deferred context | Are other contexts available? | 7 | RELEVANCE ≠ AVAILABILITY | Explicit not-currently-available; must not become four equal cards (Option 3 sneak / Option 4) | Honest stop if named | After CS if shown | Yes; omit is conservative; if named, unequal only | Four live editions |
| PW4-SEC-008 | AI expectation handling | Is this a chatbot / generative AI product? | 8 | MSG-012; PW3-OD-006 | Visible **when AI is named** | None | Adjacent to any AI mention | Yes if AI is not named | Generative SKU; connect any provider |
| PW4-SEC-009 | Trust / control explanation | What happens with my data? | 9 | TRU named controls; PW3-OD-009; `PW4-OD-003` | Named controls only: signed-in access; org-aware behavior; fail-closed control/navigation; user-scoped Home loading; no legal conclusion | No compliance badge | After explanation | Named controls required if trust is claimed; separate legal page deferred | Certification; SLA; absolute security; unqualified “secure” |
| PW4-SEC-010 | Access clarification | Can I join? What is allowed? | 10 | CLM-045–053 | Sign in ≠ join | Informational stop + utility Sign in | With or immediately after maturity | No | Register; trial; request-access button |
| PW4-SEC-011 | Returning-user utility | I already have an account | 11 | CLM-045 | Existing accounts only | Utility Sign in | Persistent; not first acquisition | No as a hidden-only control | Sign in as Start/Join/Explore |
| PW4-SEC-012 | Footer / legal utility | Where is identity, Sign in, legal? | 12 | Only real dest. or explicit HOLD | Legal EXTERNALLY GATED | Utility / HOLD-as-absent | Last | Legal links deferred | Empty social; fake address; pricing; blog |

### 14.1 Hierarchy checks

| Check | Result |
| --- | --- |
| First information is for VIS-001 | Yes — SEC-001/002 before CS or BOS |
| BOS not required to own the first information | Yes — SEC-004, optional |
| Course Sellers does not own the homepage | Yes — SEC-006 after general brand; Option 2 is treatment when shown, not a mandatory above-the-fold hero |
| Four target groups do not appear equally available | Yes — SEC-007 unequal or omitted |
| Maturity is not footer-only | Yes — SEC-003 early |
| Sign in is not primary acquisition | Yes — SEC-011 utility; SEC-010 honest stop |
| No CTA without destination | Yes — HOLD omitted as controls |
| Mobile is one logical order | Yes — mobile order = priority 1–12; no desktop-only meaning |

### 14.2 Homepage exclusions

Do not place on the public homepage: pricing; careers; resource/blog indexes; comparison tables; four equal solution cards; authenticated product navigation; Connect AI; Create account; Register; Start free; Start trial; Request beta / waitlist / contact / demo / tour **buttons**; legal-compliance conclusions; certification walls; “coming soon” links; social icons without destinations; authenticated Home content.

---

## 15. Progressive Disclosure

| Disc ID | Layer | Information that belongs here | Must not wait until later | Owner note |
| --- | --- | --- | --- | --- |
| PW4-DISC-001 | First five seconds | Name + operator daily-work purpose | Closed-beta must not contradict this by sounding GA | Copy in PW-6 |
| PW4-DISC-002 | Initial viewport / Layer B | SEC-001, enough of SEC-002, **maturity visible** (SEC-003), Sign in findable as utility | Maturity must not first appear in the footer; closed beta is not Layer A/hero | `PW4-OD-006` frozen |
| PW4-DISC-003 | Early homepage | Access distinction: Sign in vs not-for-public-join | HOLD buttons; open signup; trial; waitlist; beta-request route | SEC-010 near SEC-003 |
| PW4-DISC-004 | Mid-page explanation | Mechanism, proof-backed areas, CS relevance when shown (Option 2) | TG availability must sit with TG relevance | `PW4-OD-002` frozen |
| PW4-DISC-005 | Later homepage | Named-control trust; deferred TG only if named and unequal; AI limit if AI was named earlier | If AI was named in SEC-001/004, limitation cannot wait until footer | Qualifier attachment |
| PW4-DISC-006 | Separate page | Only later Site Model B expansion with a real destination | Must not move material qualifiers off the homepage so the homepage becomes misleading | `PW4-OD-004` Site Model A is the initial standard |
| PW4-DISC-007 | Utility / footer | Identity repeat, Sign in, copyright if accurate, legal **only with authority** | Must not be the first place closed beta appears | Footer §23 |
| PW4-DISC-008 | Authenticated environment | Daily Operating, product modules, support mailto | Must not be linked as public marketing proof | Home closed |
| PW4-DISC-009 | Omitted until authority | Intake, contact, demo, tour, legal prose, analytics, indexation | Do not disclose as if live | HOLD / EXTERNALLY GATED |
| PW4-DISC-010 | Omitted permanently unless policy changes | Create account, Register, Start free, Start trial, Connect AI provider | n/a | `PROHIBITED` |

Material qualifiers travel with the claim: closed beta with availability; CS availability with CS relevance; BOS meaning with BOS; AI limit with AI; trust controls are not a detached security badge.

---

## 16. Navigation Architecture

Labels below are **functional roles**, not final strings (PW-6). No `href="#"` as a solution. Exact mobile interaction remains PW-7. Focus and landmarks remain PW-8 and implementation. In-page destinations later require real section IDs and focus move.

| Nav ID | Label role | Destination type | Current destination | Desired destination | Status | Visitor | Priority | Mobile treatment | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-NAV-001 | Product explanation | In-page (Site Model A selected) | None | Real section ID on homepage | `OWNER-FROZEN DESIRED IA`; dest. not publication-ready until IDs/focus exist | VIS-001 | High | In document order; not hidden; no empty menu items | Fake `#`; empty `/product`; Explore → `/login` or `/home` |
| PW4-NAV-002 | How it helps | In-page | None | SEC-002/004 | `OWNER-FROZEN DESIRED IA` | VIS-001 | High | Same order as desktop meaning | Desktop-only nav meaning |
| PW4-NAV-003 | Availability | In-page | None | SEC-003 | `OWNER-FROZEN DESIRED IA` | All | High | Visible without opening a submenu | Late beta |
| PW4-NAV-004 | Trust | In-page named controls; legal page only if authority | None | SEC-009; PAGE-013 HOLD | In-page frozen; legal `EXTERNALLY GATED` | Trust seeker | Medium | Qualifier in text, not hover | Compliance badge; legal link without dest. |
| PW4-NAV-005 | Sign in | Utility action | `/login` | `/login` | `CURRENT PRODUCTION` | VIS-007 | Utility high; acquisition low | Findable; not the largest acquisition control | Relabelled Start/Join |
| PW4-NAV-006 | Legal / privacy | Utility | None found | PAGE-013/014 only with authority | `HOLD — DESTINATION MISSING` / `EXTERNALLY GATED` | Trust seeker | Omit until authority | Omit; do not show dead footer links | Dead legal links |
| PW4-NAV-007 | Contact / intake / demo / tour | Conversion | None | None | `HOLD` — **not in navigation** | Conversion seekers | Omit | Omit | HOLD appearing live |
| PW4-NAV-008 | Authenticated product areas | Product | `/home` and modules | Remain authenticated | `AUTHENTICATED — OUTSIDE PUBLIC IA` | Admitted users | Not in public nav | Not in public nav | Duplicate public/auth nav |

### 16.1 Primary navigation

For Site Model A, primary nav is a **short in-page set**: product explanation, how it helps, availability. Trust may be in-page rather than a primary item if SEC-009 is in document order. Do not add Solutions, Pricing, Resources, Blog, contact, beta-request, or legal links without destinations. No HOLD or PROHIBIT items. No disabled fake controls.

PAGE-015 is **not** part of the initial primary nav. It may be added only in a later Site Model B expansion after that page exists.

### 16.2 Utility navigation

Sign in (`PW4-NAV-005`) is the only currently real public utility destination and remains a **separate** utility from exploration. Legal links omitted until external authority supplies PAGE-013/014 (`PW4-OD-003` remainder). Password recovery stays inside login, not public chrome. No contact or beta-request footer/nav items.

### 16.3 In-page navigation

**Selected desired IA** (`PW4-OD-005`): visitors explore the initial public foundation through logical content roles on the same page. Exploration is information navigation, not a conversion claim. Explore must not point to `/login`, `/home`, or authenticated product UI. Sign in remains a separate utility.

Publication conditions remain: real section IDs; semantic landmarks; heading hierarchy; keyboard; focus management; screen-reader-understandable link purpose; working browser navigation; mobile usability; no-JavaScript/reduced-motion independent comprehensibility; regression evidence. Until those exist, document-order reading is the safe fallback (`PW2-FUT-006`). `OWNER-FROZEN IA DIRECTION — NOT YET PUBLICATION READY`.

### 16.4 Mobile navigation

| Rule | Requirement |
| --- | --- |
| Priority | Identity and maturity in page order first; Sign in findable; in-page items after |
| Order | Same meaning as desktop; no reordering that hides beta or TG unavailability |
| Open/closed state | If a disclosure menu is used later, closed state must not hide material qualifiers that exist only in the menu |
| Keyboard / screen reader | Later PW-8: open/close announced; focus trap or standard disclosure pattern; escape path |
| Hidden material | Forbidden: closed-beta, TG availability, Sign in vs join distinction only in hover or closed menu |

---

## 17. Public Root-Route Options

`/` is dual-use (`PW0-PB-017`). `src/app/page.tsx` stays protected until later authority. PW-4 compared models and **does not** change routes. `DESIRED IA DECISION ≠ TECHNICAL IMPLEMENTATION AUTHORITY`.

### 17.1 Root Model A — Conditional public root

**Selected desired IA.** Unauthenticated `/` eventually shows the public ZyntixAI homepage. Authenticated `/` conceptually keeps governed membership/onboarding-aware product-entry resolution. `/home` remains authenticated and protected. Sign in remains an auth-owned utility. The main domain can present the public brand experience to new logged-out visitors.

**Visitor-goal fit is strongest.** Remaining gates: technical feasibility not proven; `src/app/page.tsx`, middleware, and landing resolvers remain protected; session/auth interaction must be designed later; authenticated `/login` bounce to `/` must be preserved or consciously reconciled; regression tests required; PW-0 shared-boundary authority remains binding; technical decision and implementation remain PW-13/PW-14-owned.

### 17.2 Root Model B — Universal public root

`/` is the public homepage for everyone. Authenticated users reach product via an explicit workspace/Home utility. Changes current authenticated entry semantics (`DEFAULT_RETURN_PATH` `/`, middleware login bounce to `/`). Highest Home/login regression risk. **Rejected** because it would materially change existing authenticated entry behavior.

### 17.3 Root Model C — Isolated public route

`/` keeps current redirect/entry function. Public homepage lives on a separate route. Smallest authenticated impact. **Does not** make `www.zyntixai.com/` the public homepage. **Not** the chosen visitor architecture. Retained **only** as a safe technical fallback if Root Model A cannot later be implemented responsibly.

### 17.4 Decision matrix

Historical comparison from establishment. Selection is recorded in §17.5.

| Criterion | Root A | Root B | Root C |
| --- | --- | --- | --- |
| Visitor-goal fit | Strong (public main host) | Strong for visitors; weak for returning operators expecting product | Weak for first-time host visitors |
| Product-entry continuity | Preserved if authenticated branch stays | Broken unless a new product entry is designed | Preserved |
| Authenticated Home risk | Medium (shared `/` file/layout) | High | Lowest |
| Middleware / session complexity | High (branch on session at `/`) | High (stop login→`/` product bounce) | Lowest |
| Accessibility | One public H1 at `/` for logged-out | Same, but logged-in users see marketing first | Public H1 not at `/` |
| Canonical URL clarity | Strong **if** `/` is public for logged-out | Strong for `/`; confuses product entry | Public canonical is not `/` |
| Analytics / SEO | Indexing `/` becomes meaningful **after** publication readiness | Same | Alternate URL; `/` still login |
| Deployment reversibility | Harder (touches P1 root) | Hardest | Easier to isolate/revert |
| Testing burden | Home + login bounce + public page | Highest | Public page + proof `/` unchanged |
| PW-0 boundary impact | Conflicts with “do not design `/` replacement as approved”; requires owner + PW-13 | Highest conflict | Aligns with PW-0 isolation preference |

### 17.5 Selected root model

**Selected desired visitor IA:** Root Model A — conditional public root.

**Classification:** `OWNER-FROZEN DESIRED IA` (`PW4-OD-001`). Status: `RESOLVED — OWNER FROZEN FOR DESIRED IA`. Not an implementation decision.

**Establishment history:** establishment recommended Root A as proposed IA with conservative default “do not change `/` / isolate if implementing early.” The owner has now selected Root A as the **desired** architecture. Root C is fallback only. The conservative **implementation** default remains: do not change `/`, middleware, or login bounce until PW-13.

Technical feasibility and implementation remain **PW-13-owned**. PW-14 may implement only after PW-13 authority.

### 17.6 Protected surfaces and required-before-implementation

**Protected (no PW-4 mutation):** `src/app/page.tsx`; middleware; authenticated landing resolvers; `/login`; `/home`; authenticated layouts; session resolution; public-registration behavior; invite/recovery flows; shared global styling; root metadata; favicon/browser chrome; canonical-host configuration.

**Required before any implementation:** PW-13 technical plan; explicit shared-boundary change authority; route-state decision table (§17.7); authenticated/unauthenticated regression coverage; membership/onboarding entry tests; login bounce tests (including query-strip behavior); middleware tests; `/home` regression tests; public accessibility tests; deployment and rollback plan. If Root A cannot be implemented without becoming Root B, Root C is the fallback and must be an **explicit owner-visible** choice, not a silent permanent substitute.

### 17.7 Authenticated and host state matrix

Desired IA only. **Not** a middleware design and **not** technical feasibility proof.

| Visitor/session state | Current `/` result | Desired `/` result (Root A) | Protected behavior | Implementation risk | Required evidence |
| --- | --- | --- | --- | --- | --- |
| Unauthenticated visitor | `src/app/page.tsx` `redirect("/login")` | Public homepage | Must not see `/home` or product modules | Dual-state `/`; public H1 vs product H1 | Public render + a11y; Home not leaked |
| Authenticated, email unverified | `/register/check-email` | Same admission path; **not** marketing | Verification before product | Showing public homepage as if logged out | Entry-resolver tests |
| Authenticated, zero organizations | `/invite/accept` or `/register/complete` | Same product-entry; **not** marketing | No auto-provision | Root A implemented as Root B | Landing tests; invite tests |
| Authenticated, one completed organization | `/home?org=…` | Same org-scoped Home | Org-aware Home | Lost `org` query; marketing intercept | `resolve-authenticated-landing` tests |
| Authenticated, multiple organizations | `/home` | Same Home selection | Multi-org Home | Same | Landing tests |
| Authenticated, incomplete onboarding | `/onboarding?org=…` (or operating-model path) | Same onboarding-before-CRM | Onboarding invariant | Skipping onboarding via public `/` | Onboarding + landing tests |
| Invited participant | `/invite/accept` when trusted context | Same invite-owned flow | Marketing must not replace invite | Invite cookies/host | Invite tests |
| Authenticated visit to `/login` | Middleware `307` → `/` with **empty search** | `/` authenticated branch → product-entry | Bounce must not land on marketing | Query `next` stripped; dual `/` | Middleware login-bounce tests |
| Unauthenticated visit to `/home` | Middleware → `/login?next=…` | Unchanged | Never show Home | Public CSS/nav leak | Home + middleware tests |
| Stale/invalid session (auth cookie, no user) | `/` behaves as logged-out → `/login`; protected routes get `reason=session_expired` | `/` behaves as logged-out **public homepage**; `/home` still login + expired reason | No Home content | Treating stale cookie as admitted | Middleware + `/` branch tests |
| Return-path query (`next`) | Allowlisted on login page; middleware login bounce **strips** search | Same safety; bounce still reaches product-entry | Open-redirect protection | `next` honored unsafely or lost into marketing | Safe-return-path + bounce tests |
| Apex-host visitor | Production-observed 308 → www; **not** in repo config | Host behavior unchanged by PW-4 | Do not add competing redirects | Duplicate/conflicting host rules | `PW0-PB-034`; not PW-4-owned |
| www-host visitor | Unauth `/` → `/login` | Unauth public homepage; auth product-entry | Canonical-host ownership unresolved | Indexing `/login` as brand | noindex until ready; PW-13/14 |

Analytics or SEO must **not** force a route decision. Root C remains fallback only if Root A would otherwise become Root B or break the protected behaviors above.

---

## 18. Public/Authenticated Boundary Register

| Bnd ID | Surface | Public / authenticated / shared | Current owner | Desired IA role | Change risk | Protected invariant | Required regression evidence | Implementation phase | Publication blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-BND-001 | `/` (`src/app/page.tsx`) | Shared dual-use | Auth/product entry | Desired: unauthenticated public homepage; authenticated product-entry retained conceptually (Root A) | P1 | Authenticated membership/onboarding resolution; logged-out must not see `/home` | Login bounce; entry resolver; Home | PW-13 after shared-boundary authority | Technical feasibility; Home tests; **not** authorized by OD freeze |
| PW4-BND-002 | `/login` | Public utility; auth-owned | Auth | Sign in only | Medium if restyled as marketing | Existing-accounts qualifier; authenticated bounce to `/` | Login tests; session bounce | Not PW-4; login restyle not approved | Must not become Create account |
| PW4-BND-003 | `/home` | Authenticated | Daily Operating | Outside public IA | High if public CSS/nav leak | Home closure SHAs | Home browser/production gates | None in public-web without new authority | Home remains closed |
| PW4-BND-004 | `(authenticated)/layout.tsx` | Authenticated | Product | Pass-through; no marketing chrome | High if reused | No public header injected | Home nav/layout | PW-13 if shared | Do not share public header here |
| PW4-BND-005 | Root layout `src/app/layout.tsx` | Shared | Platform | Shared document shell; public metadata later must not break auth pages | High | `lang="en"`; no unapproved analytics | All routes using root layout | PW-13 / PW-14 | Metadata copy not frozen |
| PW4-BND-006 | `src/middleware.ts` / `updateSession` | Shared | Auth | Session refresh; protect app paths; login bounce | P1 | `/` not currently protected; `/home` is | Middleware + login tests | PW-13 if `/` session-branches | Do not implement in PW-4 |
| PW4-BND-007 | Landing resolver | Authenticated | Auth | Product entry after login/`/` for authenticated users: verify-email, invite, zero-org complete, single-org onboarding or `/home?org=`, multi-org `/home` | High if `/` becomes marketing for all | Invitation + membership + onboarding paths | Auth routing tests | PW-13 | Root Model B rejected; Root A must not silently become B |
| PW4-BND-008 | Public-registration logic | Auth/policy | Auth | Fail-closed; not marketing | High if IA links `/register` | Fail-closed default | Register redirect tests | Not public-web | PROHIBIT CTA |
| PW4-BND-009 | `globals.css` | Shared | Platform | Public visual language later | High | Authenticated Home visual regressions | Home visual + a11y | PW-13 if shared CSS | Public CSS vs Home |
| PW4-BND-010 | Metadata | Shared | Platform | Public titles later; current “application foundation” | Medium | No false indexation | Metadata review | PW-13/PW-14 | Indexation before readiness |
| PW4-BND-011 | Favicon / browser chrome | Shared | Platform | Browser identity; files not found in `src/app` | Medium | Must not imply a different product | Visual chrome | Later | UNKNOWN asset ownership |
| PW4-BND-012 | Site origin | Shared auth | Auth/platform | Auth email/callback origin | P1 | Invite cookies host-only | Site-origin tests | Not PW-4 | `PW0-PB-027`; apex UNKNOWN |
| PW4-BND-013 | Legal links | Public if they exist | Missing | EXTERNALLY GATED | Medium if invented | No template claims | Legal review | After legal authority | Blocker for “full” public launch copy |
| PW4-BND-014 | Auth recovery routes | Auth | Auth | Outside marketing IA | Medium if linked from public footer | Recovery not a join path | Recovery tests | Auth | Not public nav |
| PW4-BND-015 | Invite acceptance | Admission | Invitations | Outside marketing IA | Medium if marketed as signup | Token/cookie rules | Invite tests | Auth | No public get-invite CTA |
| PW4-BND-016 | Authenticated support contact | Authenticated / env-gated | Support | Not public contact | Medium if mailbox published | Not a public `/contact` | Support policy | HOLD | PW1-CLM-049 |

Confirmed:

- Authenticated Home is not reopened.
- Sign in remains auth-owned.
- Recovery, register, and invite flows are not marketing-IA without new authority.
- Public styling may later cause authenticated regression; shared surfaces need separate impact analysis (`PW4-BND-005`, `PW4-BND-009`).

---

## 19. Visitor Journey Architecture

No journey ends in an invented CTA.

| Jny ID | Journey | Entry | Information need | Decision point | Destination | Current state | Desired state | Failure mode | Safe stop | Required future authority |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-JNY-001 | First-time primary visitor | Desired unauthenticated `/` (Root A); today `/` → `/login` | NEED-001–010, 016 | Understand vs leave vs Sign in if they already have an account | Homepage sections then stop or `/login` | Redirected to `/login` | Comprehension → relevance → maturity → explanation → safe available action | Login looks like join | Informational stop on homepage | PW-13 for `/`; PW-5–6 copy |
| PW4-JNY-002 | Existing account holder | `/` or `/login` | NEED-015 | Recognize Sign in utility | `/login` → authenticated resolution (`/` or landing) | **CURRENT PRODUCTION** | Same utility; marketing must not hide it or relabel it; authenticated `/` remains product-entry under Root A | Sign in as Join | n/a (success path) | Copy qualifier; PW-13 bounce reconciliation |
| PW4-JNY-003 | Invited participant | Invite URL / email | Admission, not marketing | Continue invite | `/invite/accept` then auth/onboarding | **CURRENT SOURCE** invite flow | Public IA may explain closed beta but must not replace invite entry | Marketing signup instead of invite | Invite-owned errors | Invitations remain owner |
| PW4-JNY-004 | Interested visitor without invitation | Public homepage (desired Root A / Site Model A) | NEED-008–011, 016, 018 | No intake | Honest stop | Forced through `/login` | Comprehension → closed beta (Layer B) → honest stop | Fake request-access | `PW4-STOP-003` | Intake still HOLD |
| PW4-JNY-005 | Course Seller | Same as JNY-001 | NEED-001 then 012 | Relevance vs availability | Homepage CS block when TG relevance is shown (Option 2); else general + stop | No public CS page | General brand → qualified relevance (not LMS, not complete edition) → availability → Sign in if admitted else stop | LMS / live CS edition; CS as brand | Stop if not invited | Copy/qualifiers; `PW4-OD-002` frozen treatment |
| PW4-JNY-006 | Deferred target-group visitor | Same | NEED-002, 013 | Availability | Explicit not-available + stop | No public TG pages | General relevance → explicit boundary → safe stop; never four equal cards | Four equal cards | `PW4-STOP-004` | Unequal qualification if named |
| PW4-JNY-007 | Trust / privacy seeker | Homepage | NEED-014 | Named controls vs legal detail | Homepage SEC-009; legal only if authority | No public legal page | Named controls when published; legal HOLD / EXTERNALLY GATED | Template privacy page | `PW4-STOP-007` | `PW4-OD-003` remainder |
| PW4-JNY-008 | Authenticated visitor at `/` | `/` with session | Product-entry, not marketing | Am I in the product or on a public page? | Governed entry path (§8.2) | **CURRENT SOURCE** entry resolver | Same product-entry under Root A; **not** the public homepage | Silent Root B (marketing for admitted users) | `PW4-STOP-010` | PW-13 session branch |

---

## 20. CTA and Destination Architecture

| CTA ID | Functional role | PW-1 status | Current destination | Desired destination | IA treatment | Publication blocker | Safe fallback |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-CTA-001 | Sign in | ALLOW WITH QUALIFIER (`PW1-CLM-045`) | `/login` | `/login` | **Utility action**; never Start/Join/Explore | Qualifier in copy/IA | Keep Sign in |
| PW4-CTA-002 | Create account | PROHIBIT (`PW1-CLM-046`) | `/register` fail-closed | None | **Omitted** | Policy | Honest stop NEED-010 |
| PW4-CTA-003 | Register | PROHIBIT | Same | None | **Omitted** | Same | Same |
| PW4-CTA-004 | Start free | PROHIBIT (`PW1-CLM-052`) | None | None | **Omitted** | Commercial authority | `PW4-STOP-002` |
| PW4-CTA-005 | Start trial | PROHIBIT | None | None | **Omitted** | Same | `PW4-STOP-002` |
| PW4-CTA-006 | Connect AI provider | PROHIBIT (`PW1-CLM-053`) | None | None | **Omitted** | AI program | `PW4-STOP-005` |
| PW4-CTA-007 | Request beta access | HOLD (`PW1-CLM-047`) | None | None until intake | **No button** | Destination + governance | `PW4-STOP-003` text |
| PW4-CTA-008 | Join waitlist | HOLD (`PW1-CLM-048`) | Internal BQA only | None public | **No button** | Public waitlist | Textual stop |
| PW4-CTA-009 | Contact | HOLD (`PW1-CLM-049`) | Authenticated mailto only | None public | **No button** | Public contact dest. | `PW4-STOP-007` analog |
| PW4-CTA-010 | View product | HOLD (`PW1-CLM-050`) | None | In-page exploration after real section IDs; not PAGE-015 as initial standard; never `/home` | Navigation/exploration only after real dest. | Real dest.; not `/home`; not `/login` as Explore | Document-order reading |
| PW4-CTA-011 | Watch demo | HOLD (`PW1-CLM-051`) | None | None | **No button** | Asset + dest. | Omit |
| PW4-CTA-012 | In-page exploration | HOLD for publication (`PW2-FUT-006`); desired IA frozen (`PW4-OD-005`) | None | Real section IDs + focus | **Information navigation**, not conversion; `OWNER-FROZEN IA DIRECTION — NOT YET PUBLICATION READY` | Focus, landmarks, keyboard, SR link purpose | Read in order; no `#` |
| PW4-CTA-013 | Honest informational stop | n/a (not a conversion CTA) | None | Homepage stop role | **Informational safe stop** | Copy in PW-6 | Stop is the result |

Distinctions:

- **Navigation:** NAV-001–004 (in-page on the frozen Site Model A foundation).
- **In-page exploration:** CTA-012 (desired IA frozen; not publication-ready).
- **Utility action:** CTA-001 Sign in.
- **Conversion action:** none live; HOLD/PROHIBIT omitted.
- **Authentication action:** Sign in and auth-owned recovery/invite; not marketing conversion.
- **Informational safe stop:** CTA-013.

Nonfunctional controls are forbidden. Text may replace a missing CTA.

---

## 21. Target-Group Information Architecture

### 21.1 Options

| Option | Treatment | Fit |
| --- | --- | --- |
| Option 1 — No explicit target-group block | Homepage fully operator-first | Strong Model A; lowest availability risk; CS relevance delayed |
| Option 2 — Course Seller relevance example | One evidence-bound relevance context, not brand-primary | Strong if placed after general brand with availability qualifier |
| Option 3 — Unequal relevance overview | Name four contexts with unequal availability | Higher copy and mobile risk; possible if qualifiers stay attached |
| Option 4 — Four equal solution cards | Four live-looking editions | **Rejected** — contradicts PW-1 and Model A |

### 21.2 Comparison

| Criterion | Option 1 | Option 2 | Option 3 | Option 4 |
| --- | --- | --- | --- | --- |
| Model A fit | Strong | Strong if CS stays SECONDARY | Medium | Fail |
| Course Seller evidence use | Weak (omits strongest relevance) | Strong with qualifiers | Mixed | Misleading equal chrome |
| Brand-capture risk | Lowest | Medium (must stay non-hero) | High | Fail |
| Availability risk | Lowest | Medium (must qualify) | High | Fail |
| Mobile clarity | Strong | Adequate: one extra block | Weak: four statuses | Fail: horizontal comparison forbidden |
| Qualifier burden | Lowest | Medium | High | High and false |
| Future scalability | Add CS later | Natural | Hard to maintain four statuses | False scale |
| PW-1 truth fit | Strong | Strong with qualifiers | Medium | Fail |

### 21.3 Selected treatment

**Selected:** Option 2 — Course Sellers as **one qualified relevance context** (`PW4-SEC-006`), after operator recognition and maturity, with availability qualifier and no LMS / public course platform / catalog / complete current-SHA edition claim. Home Production evidence must not be expanded to a full Course Seller edition.

**Classification:** `OWNER-FROZEN DESIRED IA` (`PW4-OD-002`). Status: `RESOLVED — OWNER FROZEN`.

`PW2-VIS-001` remains sole brand-primary. Course Sellers is not the definition of ZyntixAI, not co-primary, and must not dominate the homepage. Option 2 is the **allowed treatment when target-group relevance is shown**. It does **not** require Course Sellers in the hero or above the fold.

**Frozen:** `RELEVANCE ≠ AVAILABILITY`. TG2–TG4 remain deferred thin slices, not Production-verified, not presented as fully available, not as equal live editions. Option 4 remains **rejected**. A later content or design phase must not convert this choice into four visually equal solution cards. Option 3 is not the selected standard. Option 1 (omit the block) remains a valid **content** choice for a given draft only if no TG relevance is shown; it is not a competing IA treatment that reopens OD-002.

---

## 22. Trust and Legal Information Architecture

### 22.1 Homepage trust role

**Frozen:** `HOMEPAGE TRUST = NAMED CONTROLS ONLY` (`PW4-OD-003` placement). Status: `RESOLVED — OWNER FROZEN TO NAMED CONTROLS ONLY`.

Homepage scope: short, accurate explanation of demonstrable controls, exclusively within the exact evidence bound (`PW3-OD-009` / PW-1):

- signed-in access;
- org-aware behavior;
- fail-closed control/navigation behavior;
- user-scoped Home loading.

No badge wall, legal conclusion, compliance, certification, SLA, uptime, absolute-security, or unqualified “secure” claim.

### 22.2 Separate trust page

A separate informational role may exist in the desired inventory. It may appear only when a real route with approved content exists. Status: `OPEN — EXTERNAL LEGAL AND CONTENT AUTHORITY REQUIRED` / `EXTERNALLY GATED`. Not required for Site Model A. Not publication-ready. No navigation or footer link until the destination exists.

### 22.3 Privacy / legal pages

No public privacy or terms route was found in `src/app`. Absence can later be a public-deployment gate but does **not** authorize template legal copy. Existing authenticated support contact is not a privacy policy.

`PW4-OD-003` is **PARTIALLY RESOLVED**: homepage placement is owner-frozen; legal content and any publication obligation are **not** owner-approved. The owner froze IA placement only.

---

## 23. Footer Architecture

Footer is utility, not the home of material truth.

| Footer role | IA treatment | Destination rule |
| --- | --- | --- |
| Product identity | Allowed as repeat of name | In-page top / homepage |
| Sign in utility | Allowed | `/login` exists |
| Availability clarification | Must not be the **only** closed-beta location | Repeat OK; primary is SEC-003 |
| Legal / privacy | HOLD / EXTERNALLY GATED | Omit links until PAGE-013/014 exist |
| Contact | HOLD | Omit |
| Copyright / ownership | Allowed only if accurate non-legal identity text is later authorized | No fake address |
| Status | No public status page found | Omit |
| Social links | No destinations found | **Omit** (no empty icons) |

Forbidden in footer: empty social icons; fake company address; non-existent contact page; unauthorized legal claims; pricing; careers; resources/blog without content; “coming soon” links.

---

## 24. Error and Safe-Stop Architecture

A safe stop is a legitimate journey result, not an empty dead end. No final stop copy here.

| Stop ID | Situation | Truthful explanation role | Action allowed | Action prohibited | Escape path | Focus / a11y need | Destination dependency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-STOP-001 | Visitor expected public signup | Public self-serve accounts are not offered | Read; Sign in if existing account | Create account; Register | Homepage / Sign in utility | Text status, not color-only | Policy remains PROHIBIT |
| PW4-STOP-002 | Visitor expected free trial | No trial surface | Read; Sign in if existing | Start free / Start trial | Homepage | Same | Commercial authority |
| PW4-STOP-003 | Visitor expected beta request | No public intake | Read closed-beta explanation | Request-access button | Stay on homepage; optional Sign in | Stop is announced in text | Intake HOLD |
| PW4-STOP-004 | Deferred target group | Context not currently available | Read general operator story | Equal edition CTA | Homepage general IA | Availability in text with the name | `PW4-OD-002`; four equal cards rejected |
| PW4-STOP-005 | Visitor expected generative AI | Not a generative/chatbot-first product | Read mechanism / AI limit if AI named | Connect provider; chat-first CTA | Homepage | Limitation adjacent to AI mention | OD-006 from PW-3 |
| PW4-STOP-006 | Destination unavailable | HOLD dest. must not look live | None as control | Dead nav; `#` | Homepage document order | Do not ship the link | Real dest. |
| PW4-STOP-007 | Legal/trust detail not published | Named controls only; legal detail unavailable | Homepage named controls | Template policy; fake `/privacy` | Homepage | Do not imply certification | Legal authority |
| PW4-STOP-008 | Public page not found | Page does not exist | Path to public homepage (once it exists) and/or Sign in | Fake sitemap of unbuilt pages | `/login` today; future public homepage | Designed 404 later | PAGE-016 |
| PW4-STOP-009 | Authenticated route without session | Sign in required | Redirect to `/login` with safe `next` | Showing `/home` content | `/login` | Session-expired reason already exists | **CURRENT SOURCE** middleware |
| PW4-STOP-010 | Authenticated visitor arriving at desired public `/` | Admitted users continue into governed product-entry; this is not a public marketing stop | Product-entry resolution | Showing the public homepage as if logged out | Product path (`/home`, onboarding, invite, or check-email) | Must not use a marketing H1 on the authenticated branch | PW-13 session branch; Root A must not become Root B |

---

## 25. Responsive Information Architecture

No breakpoint values (PW-7). Architectural rules:

- One primary reading order: SEC-001 → … → SEC-012 (identity/value → early closed beta → mechanism → proof-backed areas → one qualified CS context when shown → deferred contexts only if needed and unequally qualified → AI limit only if AI is named → named-control trust → access → Sign in utility → footer).
- No desktop-only meaning.
- Maturity remains early Layer B (`PW4-OD-006`); not footer-only; not Layer A/hero.
- Qualifiers stay with claims when stacked, including CS availability with CS relevance.
- Nav priority remains understandable without a wide bar; in-page items; Sign in as separate utility.
- Sign in remains findable and not primary acquisition.
- No horizontal four-target-group comparison.
- No material information default-hidden in closed menus, empty mobile items, or hover.
- In-page destinations later need focus management (PW-8/PW-13); OD-005 does not waive that.
- Footer is not the storehouse of essential truth.
- Sections stack without meaning loss; Option 4 layout is forbidden.
- A long single page remains navigable via in-page destinations (once they exist) and skip links; it must not require a horizontal TG comparison or hide Layer B in a closed menu.
- Desktop and mobile carry the same product truth.

---

## 26. Accessibility Architecture

Architecture authority, not implementation evidence.

| A11y ID | Requirement | IA implication |
| --- | --- | --- |
| PW4-A11Y-001 | Semantic landmarks | Public homepage: banner, main, contentinfo; nav labelled by role |
| PW4-A11Y-002 | One logical H1 | Public homepage has one H1 (identity/purpose); `/login` keeps its own H1; do not give authenticated Home a marketing H1 |
| PW4-A11Y-003 | Heading hierarchy | Section roles map to a single outline; no skipped levels for visual effect |
| PW4-A11Y-004 | Skip navigation | Required when primary nav exists |
| PW4-A11Y-005 | Keyboard navigation | All proposed nav items must be reachable later; no keyboard-only traps in mobile disclosure |
| PW4-A11Y-006 | Focus order | Matches information order; Sign in utility in order, not a surprise at the end only |
| PW4-A11Y-007 | In-page destination focus | Target heading receives focus; not `href="#"` |
| PW4-A11Y-008 | Descriptive link purpose | Functional labels must become unique accessible names in PW-6; “click here” forbidden |
| PW4-A11Y-009 | Status in text | Closed beta, TG unavailability, registration unavailable, session expired |
| PW4-A11Y-010 | No color-only availability | TG2–TG4 and beta status not color dots alone |
| PW4-A11Y-011 | No hover-only qualifiers | Qualifiers in document text |
| PW4-A11Y-012 | Screen-reader-equivalent truth | Same maturity, access, and TG facts |
| PW4-A11Y-013 | Reduced-motion independence | IA meaning does not require motion |
| PW4-A11Y-014 | Auth vs public actions distinct | Sign in vs omitted join; errors identified in text (`PW4-STOP-*`) |
| PW4-A11Y-015 | Mobile menu semantics | If a disclosure is used later: name, expanded/collapsed state, and escape; closed menu must not be the only carrier of Layer B or TG availability — architecture requirement, not implemented |
| PW4-A11Y-016 | Current-section indication | If in-page nav later indicates the active section, indication must not be color-only and must match the focused heading |

---

## 27. Discoverability and Metadata Architecture

Conceptual later needs. **No final metadata copy.** Technical execution is PW-13/PW-14. Canonical-host ownership remains unresolved (`PW0-PB-034`).

| Topic | Later need | Must not claim now |
| --- | --- | --- |
| Page title | Distinct public vs login vs product titles | Current root title is application metadata, not a marketing title freeze |
| Meta description | Public description after PW-6 | Current “application foundation” is not public-web copy |
| Canonical URL | Depends on desired Root A plus unresolved host ownership | Apex/www ownership is **not** repo-solved; OD-001 does not freeze hosts |
| index / noindex | Default conservative: noindex until publication-ready | Indexation of `/login` as the brand homepage is misleading |
| Open Graph / social | Only after copy + real public URL | No OG implementation found |
| Structured data | Only if claims remain PW-1-true | Not implemented; not valid by assertion |
| robots / sitemap | None found | Do not invent a sitemap of HOLD pages |
| Language | Root `lang="en"` **CURRENT SOURCE** | Broader language strategy open (`PW4-Q-016`) |
| Favicon / browser identity | Shared chrome; assets not found in `src/app` | Not proven complete |

---

## 28. Analytics and Measurement Boundary

No proven public analytics layer (`PW1-CLM-060` PROHIBIT).

Future measurement **needs** (not implementation): navigation use; comprehension validation; Sign in utility use vs mistaken join; section engagement; dead-end detection; target-group misinterpretation; safe-stop exits.

Forbidden in PW-4: tracking code; consent-banner design; analytics provider choice; invented conversion rates or benchmarks.

Privacy, consent, and provider choice are later governed decisions.

---

## 29. Risk Register

| Risk ID | Trigger | Affected visitor | Misleading outcome | Likelihood | Impact | Severity | Prevention | Detection | Owner | Blocking gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-RSK-001 | Public homepage designed as authenticated Home | VIS-001 | Product UI presented as marketing | Medium | High | High | Home closed; SEC roles ≠ Daily Operating | Design review PW-12 | Public-web | Design freeze |
| PW4-RSK-002 | Root-route change breaks authenticated entry | VIS-007; admitted users | Cannot reach product | Medium | High | High | Desired Root A ≠ implementation authority; protect `page.tsx`/middleware/resolvers; PW-13 tests; Root C fallback only if A cannot be implemented responsibly | Auth routing + Home + login bounce | PW-13 | PW-13 |
| PW4-RSK-003 | `/login` becomes acquisition CTA | VIS-001 | Sign in means join | High if only live dest. | High | High | Utility labelling; SEC-010 stop | VAL Sign in vs signup | PW-6/PW-12 | Design freeze |
| PW4-RSK-004 | Fake public signup journey | VIS-001 | Register/Create account offered | Medium | High | High | PROHIBIT omit | Nav/CTA inventory | PW-5 | PW-13 |
| PW4-RSK-005 | HOLD destination appears live | HOLD seekers | Dead or deceptive button | High in SaaS templates | High | High | No HOLD buttons; OD-004/005 omit missing dest. | Nav audit | PW-5/13 | PW-13 |
| PW4-RSK-006 | Dead navigation | All | Broken trust | High if Model B/C | High | High | Site Model A frozen; omit missing dest.; no `#` | Link review | PW-13 | PW-13 |
| PW4-RSK-007 | Four equal target-group editions | TG visitors | False availability | Medium | High | High | `PW4-OD-002` Option 2; Option 4 rejected; design must not equalize cards | VAL TG | PW-5/PW-12 | Design freeze |
| PW4-RSK-008 | Course Sellers captures brand | VIS-001 | Brand becomes LMS/CS | Medium | High | High | Option 2 frozen as non-hero treatment; SEC-001 before SEC-006; VIS-001 sole brand-primary | VAL CS | PW-5/PW-6 | PW-5 |
| PW4-RSK-009 | BOS dominates before plain language | VIS-001 | Technical OS reading | Medium | Medium | High | SEC-002 before unexplained BOS | VAL BOS | PW-5 | PW-6 |
| PW4-RSK-010 | AI dominates IA | VIS-001 | Chatbot-first product | Medium | High | High | AI not first information | VAL AI | PW-5 | PW-6 |
| PW4-RSK-011 | Closed beta hidden too late | All | Implied GA | High if footer-only | High | High | `PW4-OD-006` early Layer B; SEC-003; not Layer A | VAL beta findability | PW-5 | Design freeze |
| PW4-RSK-012 | Qualifier separated from claim | All | Unqualified claim | High on mobile | High | High | DISC rules; CS availability attached to CS relevance | Mobile review | PW-7 | PW-7 |
| PW4-RSK-013 | Mobile reordering changes truth | Mobile VIS-001 | Beta/TG facts disappear | Medium | High | High | Single order; OD-006 early | VAL mobile | PW-7 | PW-7 |
| PW4-RSK-014 | Footer hides material maturity | All | GA impression above | Medium | High | High | SEC-003 not footer-only; OD-006 | Five-second test | PW-5 | PW-5 |
| PW4-RSK-015 | Legal/trust page invents compliance | Trust seekers | False certification | Medium if templated | High | High | OD-003 named-controls only; legal EXTERNALLY GATED; no footer link without dest. | Legal review | Legal owner | Legal + PW-8 |
| PW4-RSK-016 | Duplicate/conflicting public and auth navigation | Admitted users | Two products | Medium | Medium | High | BND-003/008; no public product nav; Root A must not become Root B | Nav inventory | PW-13 | PW-13 |
| PW4-RSK-017 | Canonical-host ambiguity | All | Split apex/www identity | Known unresolved | Medium | Medium | Do not implement hosts in PW-4 | PW-0 curl evidence | Platform | PW-13 host work |
| PW4-RSK-018 | Indexation before publication readiness | Search visitors | Login or empty pages indexed as brand | Medium | High | High | noindex until ready | robots review | PW-14 | PW-14 |
| PW4-RSK-019 | In-page anchors without focus | Keyboard/SR users | Skip/lost focus | High if `#` used | Medium | High | OD-005 forbids `#` and fake controls; A11Y-007; still requires PW-8/13 implementation | Keyboard review | PW-8/13 | PW-8 |
| PW4-RSK-020 | Overbuilt empty SaaS site | All | Fake scale | High if Model C | High | High | Site Model A frozen; Model C rejected | Page inventory | PW-5 | PW-5 |
| PW4-RSK-021 | Visual design prematurely determines hierarchy | VIS-001 | Hero AI/CS/BOS | Medium | High | High | Frozen IA before visual; Option 2 not hero | PW-12 vs this file | PW-9–12 | PW-12 |
| PW4-RSK-022 | IA assumed to be final copy | All | Internal roles published | Medium | Medium | High | PW-6 owns phrasing | Copy review | PW-6 | PW-6 |
| PW4-RSK-023 | Public CSS impacts authenticated Home | Admitted users | Home regression | Medium if shared | High | High | BND-009 impact analysis; shared CSS still protected | Home gates | PW-13 | Home + PW-13 |
| PW4-RSK-024 | Accidental route implementation during documentation | All | Unapproved `/` change | Low in this slice | High | High | Docs-only; desired IA ≠ implementation | `git status` | This phase | PW-4 close |
| PW4-RSK-025 | Single-page treated as unbounded dump | VIS-001 | Cognitive overload; late beta; qualifiers detached | Medium in PW-5/7 | High | High | DISC layers; in-page nav; not “all topics on one scroll” | Length + order review | PW-5/PW-7 | PW-7 |
| PW4-RSK-026 | Root C fallback becomes silent permanent public URL | VIS-001 | Main host stays login without owner awareness | Medium if A is hard | High | High | Root C only with explicit owner-visible fallback; not a quiet substitute for Root A | PW-13 decision record | PW-13 | PW-13 |

---

## 30. Validation Plan

All thresholds are `PROPOSED — NOT ACHIEVED`. No research results are fabricated.

| Val ID | Objective | Participant or review profile | Task | Artifact | Proposed threshold | Failure condition | Evidence output | Blocking phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-VAL-001 | Tree testing | Operator VIS-001 | Find what ZyntixAI is and whether they can join | IA tree / later prototype | Proposed: ≥8/10 locate availability without signup CTA | Majority choose Register/Start | Notes | PW-12 |
| PW4-VAL-002 | First-click testing | VIS-001 | First click for “learn what this is” | Nav roles | Proposed: first click is explanation or page body, not Sign in as join | Majority click Sign in as join | Notes | PW-12 |
| PW4-VAL-003 | Findability | VIS-001 | Find availability | Homepage roles | Proposed: availability in initial viewport | Only found in footer | Notes | PW-5/7 |
| PW4-VAL-004 | Five-second comprehension | VIS-001 | What is this for? | Homepage artifact | Proposed: operator daily work, not chatbot | Chatbot/AI-first or CS-as-brand | Notes | PW-6 |
| PW4-VAL-005 | Navigation-label comprehension | VIS-001 | What each nav role does | Functional labels then copy | Proposed: no label read as Create account | Label maps to HOLD dest. | Notes | PW-6 |
| PW4-VAL-006 | Closed-beta findability | All | Is this generally available? | Homepage | Proposed: beta in initial viewport / Layer B, not footer-only, not Layer A | GA inference or beta as hero | Notes | PW-5 |
| PW4-VAL-007 | Sign in vs signup distinction | VIS-001 and VIS-007 | Can I create an account here? | Homepage + login | Proposed: majority say no public signup | Sign in = join | Notes | PW-6 |
| PW4-VAL-008 | Course Seller relevance interpretation | CS visitor | Is this an LMS / CS-only product? | SEC-006 if present | Proposed: CS relevant but not the whole brand; not required as hero | Brand = CS/LMS | Notes | PW-6 |
| PW4-VAL-009 | TG2–TG4 availability | Deferred TG visitor | Are Agencies/Field/E-commerce live? | SEC-007 or omission | Proposed: not interpreted as live editions | Equal live cards | Notes | PW-12 |
| PW4-VAL-010 | BOS location/comprehension | VIS-001 | What BOS means if shown | SEC-004 | Proposed: not technical OS | Unexplained OS | Notes | PW-6 |
| PW4-VAL-011 | AI expectation | VIS-001 | Is this a chatbot? | Any AI mention | Proposed: not chatbot-first | Generative SKU | Notes | PW-6 |
| PW4-VAL-012 | Trust-information findability | Trust seeker | What happens with data? | SEC-009 | Proposed: named controls found; no legal conclusion invented; no dead legal link | Compliance inferred | Notes | PW-8 |
| PW4-VAL-013 | Safe-stop comprehension | Uninvited visitor | What can I do next? | STOP-003 | Proposed: understands no intake; not a broken page | Looks for missing button | Notes | PW-6 |
| PW4-VAL-014 | Keyboard route traversal | Keyboard user | Move through public dest. | Later prototype | Proposed: all dest. reachable; in-page focus | `#` with no focus | Checklist | PW-8 |
| PW4-VAL-015 | Screen-reader landmark and link purpose | SR user | Landmarks and link names | Later prototype | Proposed: one H1; link purpose clear | Marketing H1 on Home | Checklist | PW-8 |
| PW4-VAL-016 | Mobile information-order | Mobile VIS-001 | Same truth as desktop | Stacked homepage | Proposed: beta and qualifiers still early/attached | Reorder hides truth | Notes | PW-7 |
| PW4-VAL-017 | Conditional root comprehension | VIS-001 and VIS-007 | What `/` is for logged-out vs signed-in | Later prototype after PW-13 | Proposed: logged-out understand public homepage; admitted users still reach product | Logged-in users trapped on marketing; logged-out sent only to join | Notes | PW-13 |
| PW4-VAL-018 | In-page navigation findability | VIS-001 | Find product explanation without leaving the page | Homepage with real IDs | Proposed: in-page dest. found; Explore is not Sign in | Explore goes to `/login` or `/home` | Notes | PW-8 |
| PW4-VAL-019 | Authenticated-state matrix review | VIS-007 + admitted users | After sign-in, `/` still reaches product-entry, not marketing | Later prototype after PW-13 | Proposed: each §17.7 row preserves protected behavior | Admitted users see public homepage (silent Root B) | Checklist vs §17.7 | PW-13 |

---

## 31. Open Questions

Establishment recorded 18 questions, all open. Owner freeze reclassifies only questions this package actually resolves. Historical IDs are retained.

| Q ID | Question | Status | Conservative default / frozen direction | Owner | Latest resolution phase | Remaining gate | Consequence if unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-Q-001 | Which root-route model? | **PARTIALLY RESOLVED** | Desired IA: Root Model A. Implementation: do not change `/` until PW-13. Root C fallback only | Product owner (desired IA frozen) | `PW4-OD-001` | Technical feasibility; session; login bounce; PW-13 | Public host remains login until implemented |
| PW4-Q-002 | Single-page vs small multi-page? | **RESOLVED** | Site Model A | Product owner | `PW4-OD-004` | Empty Model B pages if later invented without dest. | Empty pages |
| PW4-Q-003 | Target-group treatment? | **RESOLVED** | Option 2 when TG relevance is shown; Option 4 rejected | Product owner | `PW4-OD-002` | Design converting Option 2 into four equal cards | CS-as-brand or four editions |
| PW4-Q-004 | Exact Course Sellers role on public IA? | **RESOLVED** | SECONDARY; one qualified relevance context; not hero/ATF-required; not LMS; not complete edition | Product owner | `PW4-OD-002` | Copy/qualifiers PW-6 | Brand capture |
| PW4-Q-005 | In-page vs separate product explanation? | **RESOLVED** (desired IA) | In-page exploration on Site Model A; no empty `/product` | Product owner | `PW4-OD-005` | Publication conditions (IDs, focus, a11y) | Fake exploration |
| PW4-Q-006 | Where availability / closed beta is explained? | **RESOLVED** (placement) | Early initial viewport / Layer B (SEC-003); not footer-only; not Layer A | Product owner | `PW4-OD-006` | Exact phrasing `PW3-OD-007`; visual placement later design | Late beta if design ignores placement |
| PW4-Q-007 | Public intake? | **OPEN** | None; honest stop | Admissions | After destination exists | PW-13 | HOLD remains |
| PW4-Q-008 | Contact destination? | **OPEN** | Omit | Support + legal | After dest. | PW-13 | No contact CTA |
| PW4-Q-009 | Separate trust page? | **PARTIALLY RESOLVED** | Homepage named-controls only; no separate page until authority | Legal + product | `PW4-OD-003` | External legal/content | Template risk |
| PW4-Q-010 | Legal/privacy authority? | **EXTERNALLY GATED** | No public legal page | External legal | External | Public-deployment completeness | Missing legal pages |
| PW4-Q-011 | Canonical host ownership? | **OPEN** | Do not implement host redirects | Platform | PW-0 PB-034; PW-13 | Host implementation | Split identity |
| PW4-Q-012 | Authenticated user behavior on `/`? | **PARTIALLY RESOLVED** | Conceptually retain product-entry (Root A). Technical path OPEN | Product owner (concept frozen) | `PW4-OD-001` | PW-13 route-state table | Home/login regression |
| PW4-Q-013 | Mobile navigation depth? | **OPEN** | Short in-page; no extra menus that hide truth | Design | PW-7 | PW-7 | Hidden qualifiers |
| PW4-Q-014 | Metadata / indexation timing? | **OPEN** | noindex until publication-ready | Public-web + platform | PW-14 | PW-14 | Premature index |
| PW4-Q-015 | Analytics / consent? | **OPEN** | No tracking | Privacy + product | New authority | New gate | PW1-CLM-060 |
| PW4-Q-016 | Language strategy? | **OPEN** | Keep `lang="en"` | Product owner | Later | If localization starts | Mixed-language IA |
| PW4-Q-017 | Safe-stop placement? | **RESOLVED** (desired IA) | On the single-page homepage after availability | Product owner | Site Model A + OD-006 | Copy PW-6 | Dead end at login only until homepage exists |
| PW4-Q-018 | Future resources/content strategy? | **OPEN** | No blog/resources until content exists | Product owner | Later than PW-4 | Design freeze | Model C creep |

Waitlist, demo, and tour remain HOLD destinations (not separate Q IDs). Technical focus implementation remains a publication gate on Q-005, not a new owner IA choice.

### 31.1 Question-count reconciliation

| Count | Establishment (before OD freeze) | After OD freeze |
| --- | --- | --- |
| Total | 18 | 18 |
| Resolved | 0 | 6 (`PW4-Q-002`, `003`, `004`, `005`, `006`, `017`) |
| Partially resolved | 0 | 3 (`PW4-Q-001`, `009`, `012`) |
| Open | 18 | 8 (`PW4-Q-007`, `008`, `011`, `013`, `014`, `015`, `016`, `018`) |
| Externally gated | 0 | 1 (`PW4-Q-010`); overlaps OD-003 remainder with `PW4-Q-009` |

---

## 32. Owner-Decision Register

Product facts already decided in PW-1 (closed beta, HOLD/PROHIBIT CTAs, no four editions) are **not** reopened as owner decisions.

Authority: `EXPLICIT ZYNTIXAI OWNER INFORMATION ARCHITECTURE DECISION` (2026-09-15). Desired IA ≠ implementation, legal approval, copy, design freeze, or deployment.

| Count | Value |
| --- | --- |
| Total decisions | 6 |
| Fully resolved | 5 (`PW4-OD-001`, `002`, `004`, `005`, `006`) |
| Partially resolved | 1 (`PW4-OD-003`) |
| Open owner IA decisions | 0 |
| Externally gated remainder | 1 (legal/trust content; overlaps OD-003; not a seventh decision) |

Downstream technical or publication gates do **not** reopen OD-001 or OD-005 as IA choices. Distinguish: resolved desired IA / unresolved technical implementation / unresolved publication readiness.

### PW4-OD-001 — PUBLIC ROOT MODEL

| Field | Value |
| --- | --- |
| Options | Root A conditional public `/`; Root B universal public `/`; Root C isolated public route |
| Evidence | PW-0 dual-use `/`; login middleware bounce to `/`; `DEFAULT_RETURN_PATH` `/`; visitor goal for `www.zyntixai.com` |
| Trade-offs | A best visitor fit, higher P1 risk; B breaks product entry; C preserves auth, fails public root URL |
| Establishment recommendation | Root A as **desired** IA |
| Owner decision | **ROOT MODEL A — CONDITIONAL PUBLIC ROOT** |
| Status | `RESOLVED — OWNER FROZEN FOR DESIRED IA` |
| Frozen scope | Unauthenticated `/` eventually shows the public homepage; authenticated `/` conceptually retains governed product-entry; `/home` protected; Sign in auth-owned |
| Remaining gate | Technical feasibility; protected `page.tsx`/middleware/resolvers/session; login bounce reconciliation; regression; PW-13/PW-14 |
| Rejected | Root Model B |
| Fallback only | Root Model C if A cannot later be implemented responsibly |
| Phase blocked | Any PW-4 route change; PW-13 implementation without shared-boundary authority |

### PW4-OD-002 — TARGET-GROUP IA TREATMENT

| Field | Value |
| --- | --- |
| Options | Opt. 1 omit; Option 2 CS example; Option 3 unequal four; Option 4 equal cards |
| Evidence | Model A; PW-1 CS vs TG2–TG4; PW-3 MSG-007/008/015 |
| Trade-offs | Omit is safest; Option 2 helps CS visitors; Option 3 copy-heavy; Option 4 prohibited |
| Establishment recommendation | Option 2, not brand-primary |
| Owner decision | **OPTION 2 — COURSE SELLERS AS ONE QUALIFIED RELEVANCE CONTEXT** |
| Status | `RESOLVED — OWNER FROZEN` |
| Frozen scope | Operator-first homepage; VIS-001 sole brand-primary; CS SECONDARY; not LMS/catalog/complete edition; `RELEVANCE ≠ AVAILABILITY`; TG2–TG4 deferred; Option 4 rejected; not a hero/ATF mandate |
| Remaining gate | Copy qualifiers (PW-6); design must not equalize four cards |
| Phase blocked | Four equal solution cards; CS as brand-primary |

### PW4-OD-003 — TRUST/LEGAL INFORMATION PLACEMENT

| Field | Value |
| --- | --- |
| Options | Homepage named-controls only; add separate trust page; add legal/privacy routes |
| Evidence | PW3-OD-009; no public legal routes found; PW-1 no compliance claims |
| Trade-offs | Named-controls honest; legal pages need external authority |
| Establishment recommendation | Homepage named-controls only; legal EXTERNALLY GATED |
| Owner decision | Homepage: **NAMED CONTROLS ONLY**. Separate legal/privacy/trust pages remain informational roles without destinations |
| Status | `PARTIALLY RESOLVED` — homepage `RESOLVED — OWNER FROZEN TO NAMED CONTROLS ONLY`; legal/trust pages `OPEN — EXTERNAL LEGAL AND CONTENT AUTHORITY REQUIRED` |
| Frozen scope | Signed-in access; org-aware behavior; fail-closed control/navigation; user-scoped Home loading; no badge wall; no legal conclusion; no absolute security |
| Remaining gate | Legal content; publication obligation; real routes before nav/footer links |
| Phase blocked | Footer legal links; template privacy; treating legal pages as approved |

### PW4-OD-004 — SINGLE-PAGE OR SMALL MULTI-PAGE FOUNDATION

| Field | Value |
| --- | --- |
| Options | Site Model A; Site Model B; Site Model C |
| Evidence | Missing destinations; §12 comparison |
| Trade-offs | A honest and small; B needs real inner pages; C rejected |
| Establishment recommendation | Site Model A |
| Owner decision | **SITE MODEL A — SINGLE-PAGE PUBLIC FOUNDATION** |
| Status | `RESOLVED — OWNER FROZEN` |
| Frozen scope | Quiet single-page first public experience; in-page primary nav; extra pages only with need + content + route + maintenance |
| Remaining gate | Copy; a11y; implementation of the homepage itself |
| Rejected as initial standard | Site Model C; empty SaaS chrome listed in §12.3 |
| Later expansion | Site Model B only after conditions in §12.2 |
| Phase blocked | Extra empty public routes as the initial standard |

### PW4-OD-005 — EXPLORATION ARCHITECTURE

| Field | Value |
| --- | --- |
| Options | In-page destinations; separate PAGE-015; omit exploration nav |
| Evidence | PW2-FUT-006; PW-3 OD-008 now superseded for public IA direction; no public sections today |
| Trade-offs | In-page fits Model A but needs focus; separate page is Model B; omit is safest until IDs exist |
| Establishment recommendation | In-page destinations after real section IDs |
| Owner decision | **IN-PAGE EXPLORATION** |
| Status | `RESOLVED — OWNER FROZEN FOR DESIRED IA` |
| Frozen scope | Same-page content roles; later real section IDs; exploration ≠ conversion; Explore must not target `/login`, `/home`, or product UI; no `href="#"`; no nonfunctional controls |
| Remaining gate | Publication conditions in §16.3; PW-7/PW-8/PW-13 |
| Classification | `OWNER-FROZEN IA DIRECTION — NOT YET PUBLICATION READY` |
| Phase blocked | Fake anchors; Explore-as-Sign-in; treating OD-005 as shipped navigation |

### PW4-OD-006 — CLOSED-BETA INFORMATION PLACEMENT

| Field | Value |
| --- | --- |
| Options | Initial viewport; early homepage after identity; mid-page only; footer only |
| Evidence | PW-3 maturity Layer B; PW-2 initial-view questions; RSK-011/014 |
| Trade-offs | Too early may dominate identity; too late implies GA |
| Establishment recommendation | After identity/value, still in initial viewport / early homepage (SEC-003) |
| Owner decision | **CLOSED-BETA STATUS EARLY IN THE INITIAL VIEWPORT / LAYER B** |
| Status | `RESOLVED — OWNER FROZEN` |
| Frozen scope | After Layer A identity/value; early Layer B; not footer-only; not hidden until availability assumptions form; not Layer A/hero; no open signup/trial/scarcity/waitlist/beta-request implication |
| Remaining gate | Exact phrasing PW-6 (`PW3-OD-007`); visual placement later design |
| Phase blocked | Footer-only maturity; beta as hero; GA implication |

---

## 33. Downstream Handoffs

### PW-4-R1 — Independent information architecture review

Must independently test: Root Model A as desired IA (not implementation); Site Model A; in-page exploration; Course Seller Option 2; closed-beta Layer B; named-controls trust; remaining technical and external gates. Must not start from this freeze as if PW-4 were `CLOSED WITH EVIDENCE`. PW-4-R1 is **not** started by this freeze.

### PW-5 — Homepage Content Model

Receives as frozen: Site Model A; section-role hierarchy `PW4-SEC-001`–`012`; early maturity role (Layer B); one qualified Course Seller relevance context when TG relevance is shown (not hero-mandated); no four equal editions; no fake CTAs; named-control trust; Sign in utility. Must not invent HOLD buttons or four edition cards. PW-5 is **not** started.

### PW-6 — Copy Deck

Receives: no final IA label copy; beta wording remains exact-copy work (`PW3-OD-007`); navigation labels remain copy work; BOS/AI/trust terminology remains governed; Course Seller qualifiers are mandatory when SEC-006 is used. Must not treat this IA as copy.

### PW-7 — Responsive UX

Receives: one-page mobile reading order; early maturity preservation; in-page navigation behavior; attached qualifiers; Sign in utility priority; single-page length/navigation risk (`PW4-RSK-025`). Exact mobile interaction remains PW-7.

### PW-8 — Accessibility and Trust

Receives: semantic landmarks; in-page focus requirements; named-control trust boundary; text status; legal external gate. Must not introduce legal-compliance copy.

### PW-9 / PW-10 / PW-11

Receive IA authority. No freedom to remove content roles that this file marks non-deferrable (SEC-001, 002, 003, 010, 011). No permission to add fake CTAs or proof. Must not introduce four equal editions.

### PW-12

Must check frozen design against this IA: no four equal editions; no fake CTA; no hidden maturity; no detached qualifier; Sign in not acquisition; no trust overclaim; Option 2 not converted to CS hero.

### PW-13

Receives: desired conditional public `/`; technical feasibility unresolved; protected route/shared surfaces (§17.6); **state matrix §17.7**; regression requirements (Home, login bounce including query-strip, register fail-closed, onboarding, invite); fallback Root Model C as **explicit** fallback only; canonical-host ambiguity; legal and destination gates. Does not receive permission to implement from this file alone.

### PW-14

May implement only after PW-13 authority. Must not treat OD freeze as deployment authorization.

---

## 34. Acceptance Gate

AND logic. Documentation-only slice: browser/production gates **not required** (no user-visible product change).

### 34.1 Historical establishment evidence

The establishment draft closed as `CONDITIONAL — PW-4 OWNER IA DECISIONS REQUIRED` because OD-001–006 were then **OPEN**. That result is **historical phase-evidence**. It must not be read as the current status. Current status is §35. Evidence of the freeze is §37.

Establishment AND-gate rows 1–22, 24–27 remain valid as drafting evidence. Row 23 (“OD-001–006 OPEN”) and the CONDITIONAL final line are superseded by this owner freeze.

### 34.2 Owner-decision freeze gate

| # | Mandatory condition | Result |
| --- | --- | --- |
| 1 | Correct preflight | **PASS** — branch `core/platform-readiness-20260707`; HEAD/upstream `9c12c977383a100eb548880d8d35b329b4406f90`; ahead/behind `0 0`; untracked only this file |
| 2 | Only PW-4 changed | **PASS** |
| 3 | Owner authority recorded | **PASS** — §1, §32, §37 |
| 4 | Six decisions processed | **PASS** — fully resolved 5; partial 1; open 0 |
| 5 | Root Model A desired IA only | **PASS** — not implementation |
| 6 | Technical root remains gated | **PASS** — §17.6 |
| 7 | Site Model A selected | **PASS** |
| 8 | Target-group Option 2 selected | **PASS** |
| 9 | Course Sellers remains secondary | **PASS** |
| 10 | Four equal cards rejected | **PASS** |
| 11 | In-page exploration bounded | **PASS** — not publication-ready |
| 12 | Closed beta early, not hero | **PASS** — OD-006 |
| 13 | Homepage trust named-controls only | **PASS** |
| 14 | Legal remainder externally gated | **PASS** — OD-003 |
| 15 | Registers reconciled | **PASS** |
| 16 | Open questions updated | **PASS** — §31.1 |
| 17 | Risks and validations correct | **PASS** — planned, not executed |
| 18 | Downstream handoffs correct | **PASS** — §33 |
| 19 | No product code changed | **PASS** |
| 20 | File integrity | **PASS** — one untracked file; no trailing whitespace; one terminating newline; no extra EOF blank line; no fences; unique contiguous IDs; no placeholder tokens; `git diff --check` clean for tracked tree; no-index vs empty exits 1 with no whitespace warning |

---

## 35. Final Status

`PW-4 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT`

Independent R1 closed in §38. PW-4 is **not** `CLOSED WITH EVIDENCE` until FV.

Establishment `CONDITIONAL — PW-4 OWNER IA DECISIONS REQUIRED` is historical evidence only (§34.1).

`DESIRED IA DECISION ≠ TECHNICAL IMPLEMENTATION AUTHORITY`. No route, copy, visual design, or deployment is authorized. PW-4-FV and PW-5 are not started.

---

## 36. Evidence Appendix

### 36.1 ID census

| Family | Range | Count |
| --- | --- | --- |
| PW4-NEED | 001–018 | 18 |
| PW4-PAGE | 001–016 | 16 |
| PW4-SEC | 001–012 | 12 |
| PW4-DISC | 001–010 | 10 |
| PW4-NAV | 001–008 | 8 |
| PW4-BND | 001–016 | 16 |
| PW4-JNY | 001–008 | 8 |
| PW4-CTA | 001–013 | 13 |
| PW4-STOP | 001–010 | 10 |
| PW4-A11Y | 001–016 | 16 |
| PW4-RSK | 001–026 | 26 |
| PW4-VAL | 001–019 | 19 |
| PW4-Q | 001–018 | 18 |
| PW4-OD | 001–006 | 6 |
| PW4-R1-FND | 001–022 | 22 |

### 36.2 Source files inspected (read-only)

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app/login/page.tsx`
- `src/app/(authenticated)/home/page.tsx`
- `src/app/(authenticated)/layout.tsx`
- `src/app/register/page.tsx`
- `src/app/invite/accept/page.tsx`
- `src/app/forgot-password/page.tsx` / `src/app/reset-password/page.tsx` (inventory)
- `src/middleware.ts`
- `src/lib/supabase/middleware.ts`
- `src/features/auth/server/public-registration.ts`
- `src/features/auth/server/resolve-authenticated-landing.ts`
- `src/features/auth/server/resolve-registration-destination.ts`
- `src/features/auth/server/safe-return-path.ts`
- `src/lib/env/site-origin.ts`
- `next.config.ts`
- `vercel.json`
- `tests/auth/middleware-auth-redirects.test.ts`
- `tests/auth/resolve-authenticated-landing.test.ts`
- `tests/auth/entry-routing-and-login-ui.test.tsx`
- `tests/onboarding/product-admission-app-shell.test.ts`
- `tests/browser/b1-c1-production-home.desktop.spec.ts` (inventory; not executed here)

### 36.3 Binding SHAs

| Authority | SHA |
| --- | --- |
| PW-0 | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| PW-1 | `e694b85ead8a4b75054a078624aadfd315cea39d` |
| PW-2 | `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| PW-3 | `9c12c977383a100eb548880d8d35b329b4406f90` |
| Authenticated Home closure | `49cd5773976143139a154f9b8ddf36535a4dd914` |
| Authenticated Home Production product-code | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |

### 36.4 What this file is not

Not copy. Not wireframes. Not a live sitemap. Not a PW-13 implementation plan. Not a claim that apex/www, structured data, analytics, or legal pages are solved. Not implementation or deployment authority. Not `CLOSED WITH EVIDENCE`.

### 36.5 Historical establishment note

The CONDITIONAL establishment status is retained as historical evidence that OD-001–006 were open at first drafting. Current owner-frozen desired IA is recorded in §32 and §37.

---

## 37. OD1 Owner Information Architecture Decision Evidence

### 37.1 Authority

| Field | Value |
| --- | --- |
| Authority type | `EXPLICIT ZYNTIXAI OWNER INFORMATION ARCHITECTURE DECISION` |
| Date | 2026-09-15 |
| Branch | `core/platform-readiness-20260707` |
| Baseline HEAD | `9c12c977383a100eb548880d8d35b329b4406f90` |
| Approved package | The full recommended PW-4 decision set: Root Model A; Site Model A; Option 2; in-page exploration; closed beta early in Layer B; homepage named controls only |
| Distinction | This is owner authority for **desired information architecture**. It is not visitor research, Production proof, technical feasibility confirmation, legal approval, final copy, design freeze, implementation authorization, or deployment authorization. `DESIRED IA DECISION ≠ TECHNICAL IMPLEMENTATION AUTHORITY` |

### 37.2 Decision table

| Decision ID | Decision | Previous status | New status | Frozen scope | Remaining gate |
| --- | --- | --- | --- | --- | --- |
| PW4-OD-001 | ROOT MODEL A — CONDITIONAL PUBLIC ROOT | OPEN (proposed) | `RESOLVED — OWNER FROZEN FOR DESIRED IA` | Unauthenticated `/` public homepage; authenticated `/` conceptual product-entry retained | Technical feasibility; protected surfaces; PW-13/PW-14 |
| PW4-OD-002 | OPTION 2 — COURSE SELLERS AS ONE QUALIFIED RELEVANCE CONTEXT | OPEN (proposed) | `RESOLVED — OWNER FROZEN` | CS SECONDARY; not brand/co-primary; not LMS/complete edition; `RELEVANCE ≠ AVAILABILITY`; Option 4 rejected | Copy; design must not equalize four cards |
| PW4-OD-003 | Homepage named-controls only; legal pages separate | OPEN / PW3-OD-009 bound | `PARTIALLY RESOLVED` | Homepage named controls frozen | External legal/content; publication obligation |
| PW4-OD-004 | SITE MODEL A — SINGLE-PAGE PUBLIC FOUNDATION | OPEN (proposed) | `RESOLVED — OWNER FROZEN` | Single-page first public experience; extra pages only with need/content/route/maintenance | Copy/a11y/implementation of the page |
| PW4-OD-005 | IN-PAGE EXPLORATION | OPEN (proposed) | `RESOLVED — OWNER FROZEN FOR DESIRED IA` | Same-page roles; no `#`; Explore ≠ `/login`/`/home` | Publication conditions; PW-7/8/13 |
| PW4-OD-006 | CLOSED-BETA EARLY IN INITIAL VIEWPORT / LAYER B | OPEN (proposed) | `RESOLVED — OWNER FROZEN` | After identity/value; not footer-only; not Layer A | PW-6 phrasing; visual placement |

### 37.3 Frozen IA summary

- Root Model A — conditional public root (desired IA).
- Site Model A — single-page public foundation.
- Target-group Option 2 — Course Sellers as one qualified relevance context.
- In-page exploration.
- Closed beta early in Layer B / initial viewport.
- Homepage named controls only.
- Legal/trust content externally gated.

### 37.4 Decision-count reconciliation

| Count | Value |
| --- | --- |
| Total | 6 |
| Fully resolved | 5 |
| Partially resolved | 1 |
| Open owner decisions | 0 |
| Externally gated remainder | 1 (overlaps OD-003; not a seventh decision) |

### 37.5 Open-question reconciliation

| Count | Before | After |
| --- | --- | --- |
| Total | 18 | 18 |
| Resolved | 0 | 6 |
| Partially resolved | 0 | 3 |
| Open | 18 | 8 |
| Externally gated | 0 | 1 |

### 37.6 Protected boundaries

No mutation authorized for: `/` (`src/app/page.tsx`); `/login`; `/home`; middleware; landing resolvers; auth/session behavior; public-registration behavior; invite/recovery flows; authenticated layouts; shared global styles; root metadata; favicon/browser chrome; canonical-host configuration.

### 37.7 Remaining gates

Technical feasibility; copy; responsive behavior; accessibility; legal content; real destinations; metadata/canonical; analytics/consent; implementation; deployment.

### 37.8 Downstream effect

PW-4-R1 is recorded in §38. PW-5–PW-12 consume the frozen roles without converting them into copy, wireframes, fake CTAs, or four editions. PW-13 owns technical feasibility of Root A, using §17.7, with Root C as an explicit fallback only. PW-14 may implement only after PW-13 authority. Authenticated Home remains closed.

---

## 38. R1 Independent Public Information Architecture Review Evidence

### 38.1 Review scope and independence

| Field | Value |
| --- | --- |
| Reviewed file | `docs/phases/PW-4-public-information-architecture.md` |
| Baseline HEAD | `9c12c977383a100eb548880d8d35b329b4406f90` |
| Binding authorities | B1-GATE.1; PW-0 `40ab024f…`; PW-1 `e694b85e…`; PW-2 `d3bea25b…`; PW-3 `9c12c977…`; Home closure `49cd5773…`; Home product `d110b6e3…` |
| Source routes inspected | `/` (`page.tsx`); `/login`; `/home`; register; invite/accept; recovery; middleware `updateSession`; `resolveAuthenticatedEntryPath`; `resolveAuthenticatedLanding`; `resolvePostLoginDestination`; `public-registration.ts`; `site-origin.ts`; `next.config.ts`; `vercel.json`; auth-routing and Home/AppShell tests (read-only, **not executed**) |
| Independence | PW-4 was treated as a candidate. Frozen owner decisions were **not** reversed. Technical feasibility was **not** treated as proven. Legal approval was **not** inferred. No research results were fabricated. |

### 38.2 Findings matrix

| Finding ID | Review area | Test question | Evidence | Finding | Severity | Required correction | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW4-R1-FND-001 | Current architecture | Is unauthenticated `/` correctly not a marketing homepage? | `src/app/page.tsx`; PW-0 307 observation | Correct: redirect to `/login`; no `(public)` group | OBSERVATION | None | **PASS** |
| PW4-R1-FND-002 | Current architecture | Is authenticated `/` landing accurately described? | `resolveAuthenticatedLanding`; landing tests | Candidate said default `/home`. Source: unverified → check-email; zero-org invite/complete; one org onboarding or `/home?org=`; multi-org `/home` | P1 — MATERIAL | §8.2 landing table | **PASS AFTER CORRECTION** |
| PW4-R1-FND-003 | Current architecture | Is authenticated `/login` bounce fully described? | Middleware test: `/login?next=/tasks` → `/` empty search | Query-strip was implicit | P2 — IMPROVEMENT | §8.3 bounce + strip | **PASS AFTER CORRECTION** |
| PW4-R1-FND-004 | Current/desired/publication-ready | Any surface wrongly marked publication-ready? | PAGE/CTA/NAV registers | None claimed publication-ready; class `PUBLICATION READY` was unnamed | P2 — IMPROVEMENT | Classification row | **PASS AFTER CORRECTION** |
| PW4-R1-FND-005 | Visitor needs | Do NEED-001–018 answer the required questions without invented research? | PW-2 VIS-001/007; PW-1 CTAs | Needs exist; hypotheses labelled; honest stops for HOLD | OBSERVATION | None | **PASS** |
| PW4-R1-FND-006 | Page inventory | Does initial IA include empty SaaS pages or omit required roles? | PAGE-001–016 | No pricing/blog/careers/four editions; identity, maturity, Sign in, legal gate, 404 role present | OBSERVATION | None | **PASS** |
| PW4-R1-FND-007 | Site foundation | Does independent scoring still support Site Model A? | §12.4 R1 matrix | Destination unreadiness makes B/C false-scale. Owner freeze intact; not reversed | OBSERVATION | Expand named criteria | **PASS AFTER CORRECTION** |
| PW4-R1-FND-008 | Site foundation | Can “single page” be read as unbounded dump / no legal or error pages? | §13; PW-5/7 handoff | Downstream could dump all topics or forbid utility pages | P1 — MATERIAL | Anti-interpretation + RSK-025 | **PASS AFTER CORRECTION** |
| PW4-R1-FND-009 | Homepage hierarchy | Is Layer B early, not hero, not footer-only? CS not ATF-required? BOS not first? | SEC-001–012; OD-006/002 | Order matches frozen direction | OBSERVATION | None | **PASS** |
| PW4-R1-FND-010 | Progressive disclosure | Can material qualifiers detach from claims? | DISC-001–010 | Rules attach beta, CS availability, AI limit, BOS meaning | OBSERVATION | None | **PASS** |
| PW4-R1-FND-011 | Navigation | Any live HOLD/PROHIBIT/`#` destination? | NAV-001–008 | HOLD omitted; Sign in is `/login`; in-page not publication-ready | OBSERVATION | None | **PASS** |
| PW4-R1-FND-012 | Root route | Is Root A only desired IA, with C fallback and B rejected, without feasibility proof? | OD-001; PW-0 PB-036 | Compatible with PW-0 because implementation remains gated. Duplicate §17.4 heading was a documentation defect | P2 — IMPROVEMENT | Remove duplicate heading; add §17.7 | **PASS AFTER CORRECTION** |
| PW4-R1-FND-013 | Root route | Can PW-13 implement Root A without a session-state matrix? | Missing matrix in candidate | Multiple contradictory `/` behaviors possible | P1 — MATERIAL | §17.7 matrix | **PASS AFTER CORRECTION** |
| PW4-R1-FND-014 | Boundaries | Does PW-4 authorize shared-surface edits? | BND-001–016; §17.6 | No mutation permission; Home closed | OBSERVATION | BND-007 landing cases expanded | **PASS AFTER CORRECTION** |
| PW4-R1-FND-015 | Journeys / stops | Is authenticated arrival at desired public `/` specified? | JNY-002 only | Missing explicit non-marketing path | P1 — MATERIAL | JNY-008; STOP-010 | **PASS AFTER CORRECTION** |
| PW4-R1-FND-016 | CTAs | Do CTA statuses match PW-1? | CLM-045–053 | Sign in utility; PROHIBIT omitted; HOLD no buttons; in-page not publication-ready | OBSERVATION | None | **PASS** |
| PW4-R1-FND-017 | Target groups | Does independent review support Option 2? Can Option 3 sneak via SEC-007? | OD-002; PW-1; SEC-007 | Option 2 supported; Option 4 rejected; SEC-007 needed an anti-equal-cards qualifier | P2 — IMPROVEMENT | SEC-007; TG matrix criteria | **PASS AFTER CORRECTION** |
| PW4-R1-FND-018 | Closed beta / access | Is Layer B early without GA/signup/trial/scarcity/intake? | OD-006; CTA HOLD/PROHIBIT | Placement frozen; phrasing remains PW-6; live flag still UNKNOWN | OBSERVATION | None | **PASS** |
| PW4-R1-FND-019 | Trust / footer | Is OD-003 still partial? Footer free of dead legal/contact/social? | OD-003; PAGE-013/014; footer table | Named controls only; legal EXTERNALLY GATED; no dead links | OBSERVATION | None | **PASS** |
| PW4-R1-FND-020 | Responsive / a11y | Are length, mobile-menu semantics, and current-section indication specified as architecture (not implemented)? | A11Y-001–014 candidate | Gaps vs R1 required list | P2 — IMPROVEMENT | A11Y-015/016; §25 length | **PASS AFTER CORRECTION** |
| PW4-R1-FND-021 | Risk / validation | Are Root C silent permanence, page length, and authenticated-state validation present? | RSK/VAL candidate | Missing RSK-025/026; VAL-019 | P2 — IMPROVEMENT | Add records; all VAL remain planned / not achieved | **PASS AFTER CORRECTION** |
| PW4-R1-FND-022 | Q / OD / downstream | Do counts and frozen statuses match? Can PW-13 choose conflicting `/` semantics? | §31.1; §32; PW-13 handoff | Counts 6/3/8/1 and OD 5/1/0 correct; PW-13 handoff lacked explicit matrix | P1 — MATERIAL | PW-13 handoff → §17.7 | **PASS AFTER CORRECTION** |

No P0. No unresolved P1. Owner-frozen decisions were not reversed. No conflict with PW-1/PW-2/PW-3 requiring a blocker.

### 38.3 Current/desired/publication-ready result

Corrected: authenticated landing is not a universal `/home`. `PUBLICATION READY` is now an explicit unused class. Desired Root A `/` remains desired IA, not current. `/login` is CURRENT PRODUCTION utility. `/home` remains authenticated. Register/invite/recovery remain admission-owned. Legal pages remain EXTERNALLY GATED. In-page destinations remain not publication-ready. HOLD journeys are not existing journeys.

### 38.4 Root and boundary result

Root Model A remains desired IA. Technical feasibility **unproven**. Root B rejected. Root C explicit fallback if A would become B or break protected behaviors. §17.7 records unauthenticated, unverified, zero-org, one-org complete, multi-org, incomplete onboarding, invite, authenticated `/login` bounce, unauthenticated `/home`, stale session, `next` query, apex, and www. Protected surfaces unchanged. Required regressions: landing tests, middleware bounce (query-strip), Home, onboarding, invite, public a11y, rollback.

### 38.5 Page, hierarchy and navigation result

Page inventory remains rational. Site Model A independently confirmed. Hierarchy: identity/value → Layer B maturity → mechanism → proof → optional CS → unequal deferred only if named → AI only if named → named-control trust → access → Sign in utility → footer. In-page nav has no fake destinations. Single-page is a foundation URL with disclosure, not an unbounded dump.

### 38.6 Journey, CTA and target-group result

JNY-001–007 retained. JNY-008 added. STOP-010 added. CTA register matches PW-1. Option 2 independently supported as one qualified, non-hero relevance context. Option 4 remains rejected. Option 3 must not return via equal “broader context” cards.

### 38.7 Responsive, accessibility and trust result

One mobile reading order; Layer B early; qualifiers attached; Sign in findable not acquisition. A11Y remains architecture, not implementation evidence. Trust: named controls only. Legal: externally gated.

### 38.8 Register reconciliation

| Family | Before R1 | After R1 | Change |
| --- | --- | --- | --- |
| NEED | 18 | 18 | None |
| PAGE | 16 | 16 | None |
| SEC | 12 | 12 | SEC-007 qualifier |
| DISC | 10 | 10 | None |
| NAV | 8 | 8 | None |
| BND | 16 | 16 | BND-007 expanded |
| JNY | 7 | 8 | Added JNY-008 |
| CTA | 13 | 13 | None |
| STOP | 9 | 10 | Added STOP-010 |
| A11Y | 14 | 16 | Added 015–016 |
| RSK | 24 | 26 | Added 025–026 |
| VAL | 18 | 19 | Added 019; still planned / not achieved |
| Q | 18 (6/3/8/1) | 18 (6/3/8/1) | Confirmed |
| OD | 6 (5/1/0) | 6 (5/1/0) | Unchanged |
| R1-FND | 0 | 22 | New |

No deletions. No owner-decision remaps.

### 38.9 Corrections performed

| Original | Finding | Evidence | Correction | Register effect | Remaining gate |
| --- | --- | --- | --- | --- | --- |
| Authenticated `/` “defaults to `/home`” | FND-002 | Landing source + tests | §8.2 condition table | None new | PW-13 must not flatten landing |
| No session matrix | FND-013 | R1 §14 | §17.7 | PW-13 handoff | Technical feasibility |
| No authenticated public-`/` stop | FND-015 | R1 §21 | JNY-008; STOP-010 | JNY 8; STOP 10 | PW-13 session branch |
| Single-page unbounded | FND-008 | Downstream ambiguity | §12.4/§13 anti-interpretation; RSK-025 | RSK-026 also Root C silence | PW-5/7/13 |
| Incomplete a11y/risk/VAL/site matrix; duplicate 17.4 | FND-003, 007, 012, 017, 020, 021 | R1 lists | Classification; bounce strip; SEC-007; A11Y-015/016; VAL-019; tests in §8.10 | As census | Implementation/a11y/copy |

### 38.10 Remaining gates

Root technical feasibility; canonical host; public intake; contact; legal content; metadata/indexation; analytics/consent; exact copy; responsive interaction; accessibility implementation; implementation; deployment. These do **not** reopen owner IA choices.

### 38.11 R1 conclusion

`PASS — PW-4-R1 PUBLIC INFORMATION ARCHITECTURE REVIEW CLOSED WITH EVIDENCE`

`PW-4 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT`

Later technical, legal, and deployment gates remain. They do not block R1 while desired IA and conservative boundaries are fully recorded. PW-4-FV and PW-5 are not started. PW-4 is not `CLOSED WITH EVIDENCE`.
