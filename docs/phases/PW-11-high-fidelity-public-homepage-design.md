# PW-11 — High-Fidelity Public Homepage Design

| Field | Value |
| --- | --- |
| Document | PW-11 — High-Fidelity Public Homepage Design |
| Type | High-fidelity public homepage design authority (not CSS, not implementation, not accessibility PASS, not publication) |
| Date | 2026-09-16 |
| Branch | `core/platform-readiness-20260707` |
| HEAD at drafting | `b2ebfd0e8b2fb037d04fcc179f347f218df3ab9b` |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Binding closures | PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; PW-3 `9c12c977383a100eb548880d8d35b329b4406f90`; PW-4 `c6f4489bc5cbf9306b4784320cc747975209caeb`; PW-5 `fcb4eab3fbfe7cefd0013828d9b9819cb452cb87`; PW-6 `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`; PW-7 `adcbd1707caa97a4b5511a56616210d7444a5663`; PW-8 `0b453cfdbc678309bed47c1fef75d0155aa3eac4`; PW-9 `8402acd6c1e3547795a9b0ab4d6d4ae44d6d7149`; PW-10 `b2ebfd0e8b2fb037d04fcc179f347f218df3ab9b` |
| Authenticated Home | Closure `49cd5773976143139a154f9b8ddf36535a4dd914`; Production product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Copy input | Owner-frozen Route A2 (`PW6-OD-002`) |
| Layout input | Owner-frozen PW7-OD-001–014 |
| Accessibility input | Owner-frozen PW8-OD-001–016 |
| Wireframe input | Owner-frozen PW9-OD-001–012 |
| Visual-system input | Owner-frozen PW10-OD-001–020 |
| High-fidelity assembly | Owner-frozen PW11-OD-001–007 (2026-09-16); see §51 |
| Current status | `PW-11 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` |
| R1 gate | `PASS — PW-11-R1 INDEPENDENT HIGH-FIDELITY PUBLIC HOMEPAGE DESIGN REVIEW CLOSED WITH EVIDENCE` |
| Owner-decision gate (historical; intact) | `PASS — PW11-OD OWNER HIGH-FIDELITY HOMEPAGE DESIGN DECISIONS FROZEN` |
| Establishment gate (historical) | `CONDITIONAL — PW-11 OWNER HIGH-FIDELITY DESIGN DECISIONS REQUIRED` — superseded by §51 |

```text
HIGH-FIDELITY DESIGN SPECIFICATION
≠ CSS IMPLEMENTED
≠ ROUTES ACTIVATED
≠ ACCESSIBILITY PASS
≠ WCAG CONFORMANCE
≠ PRODUCTION VERIFIED
≠ PUBLICATION READY
≠ DEPLOYMENT AUTHORITY
≠ CLOSED WITH EVIDENCE — PW-11
OWNER HIGH-FIDELITY DESIGN FREEZE
≠ VISITOR VALIDATION
≠ IMPLEMENTATION
≠ ACCESSIBILITY PASS
≠ WCAG CONFORMANCE
≠ BROWSER VERIFICATION
≠ PRODUCTION VERIFICATION
≠ PUBLICATION READINESS
≠ DEPLOYMENT AUTHORITY
OWNER DECISION FROZEN ≠ TOKEN IMPLEMENTED ≠ CONTRAST MEASURED
ANALYTICAL CONTRAST ≠ RENDERED BROWSER VALIDATION
```

Primary design: `PW11-DESIGN-001 — QUIET OPERATIONAL EDITORIAL HOMEPAGE`. Status: `OWNER FROZEN HIGH-FIDELITY DESIGN DIRECTION — DOWNSTREAM REVIEW REQUIRED`. `PW11-OD-001`–`007` are owner-frozen (see §51). Independent R1 is recorded in §52. PW-12 validation and PW-13 implementation remain unstarted.

---

## 1. Document Control

This file is the sole PW-11 deliverable. It translates closed PW-0 through PW-10 authorities into one high-fidelity homepage design specification for desktop, tablet, mobile, narrow mobile, zoom, text-spacing, and interaction states.

| Control | Rule |
| --- | --- |
| Product code | Unchanged |
| Authenticated Home | Closed; not restyled |
| Dual-use `/` | Current truth unchanged; Root Model A remains desired IA only |
| `/login`, `/register`, invite, recovery | Read-only; not mutated |
| Shared CSS / root metadata / AppShell | Protected |
| Frozen Route A2 copy | Quoted exactly; not rewritten |
| Frozen PW-7 / PW-8 / PW-9 / PW-10 | Respected; not reopened |
| Assets / fonts / Figma / CSS | Out of scope |
| Staging / commit / push / deploy | Not authorized |
| PW-12 | Not started |
| PW-13 | Not started |

---

## 2. Executive Decision

PW-11 establishes **one** primary high-fidelity design: Quiet Operational Editorial realized as a calm, modern, premium, operator-first, text-led public homepage. It does not create competing visual directions. It does not implement routes or CSS.

Historical establishment (before §51): seven assembly choices were recorded as open owner decisions with conservative defaults. Owner freeze (2026-09-16): `PW11-OD-001`–`007` are `RESOLVED — OWNER FROZEN`. Independent R1 review is recorded in §52. Validation and implementation remain unexecuted.

```text
PASS — PW-11-R1 INDEPENDENT HIGH-FIDELITY PUBLIC HOMEPAGE DESIGN REVIEW CLOSED WITH EVIDENCE
PW-11 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

Owner-freeze strings remain historical evidence in §51.

---

## 3. Purpose

Specify the visible high-fidelity appearance of the future Dutch-first public homepage so that owner review, independent review, PW-12 validation, and later PW-13 implementation can proceed without visual guesswork.

---

## 4. Scope

In scope: high-fidelity geometry, typography application, colour application, surfaces, region contracts, viewport canvases, interaction states, accessibility-by-design requirements, product-truth review, anti-patterns, risks, planned validations, and owner assembly decisions.

Out of scope: implementation, CSS, React, assets, metadata publication, favicon, authenticated restyle, visitor research, browser testing, and PW-12 execution.

---

## 5. Non-Goals

PW-11 does not:

- implement a public homepage, skip link, disclosure, CSS variables, or ARIA;
- modify AppShell, authenticated Home, `/login`, middleware, root layout, or `globals.css`;
- rewrite frozen PW-6 copy or reopen PW-7 / PW-8 / PW-9 / PW-10 owner decisions;
- add fonts, images, screenshots, mock product UI, or a second palette;
- claim WCAG, EN 301 549, ADA, or Dutch legal conformance;
- execute browser, keyboard, screen-reader, zoom, or visitor tests;
- start PW-12, PW-13, or PW-14.

---

## 6. Authority Register

| Authority | Role in PW-11 |
| --- | --- |
| B1-GATE.1 | Evidence standard; this phase is documentation only |
| PW-0 | Public/auth isolation; Home closed; shared chrome is P1 |
| PW-1 | Public-truth ceiling; no visual claim may exceed product truth |
| PW-2 | `PW2-VIS-001` is the only brand-primary visitor |
| PW-3 | Operational positioning; AI and BOS are not visual centre |
| PW-4 | Desired IA; current `/` redirect is not restyled as if already Model A |
| PW-5 | Content roles; no extra clusters |
| PW-6 | Frozen Route A2 copy; no new marketing sentences |
| PW-7 | Responsive layout; content-driven thresholds; eight-cluster budget |
| PW-8 | Contrast intent, focus 2px+2px, links not colour-only, 24px floor / 44px preference |
| PW-9 | Frozen composition; surface budget; omitted supporting field and screenshot slot |
| PW-10 | Frozen visual direction and candidate tokens |

---

## 7. Evidence Model

| Class | Meaning |
| --- | --- |
| `UPSTREAM FROZEN` | Directly required by closed PW-0 through PW-10 |
| `OWNER FROZEN` | Explicit ZyntixAI owner high-fidelity assembly freeze (`PW11-OD-001`–`007`; §51) |
| `HIGH-FIDELITY DERIVATION` | Concrete realization of frozen authority |
| `RECOMMENDED — OWNER DECISION REQUIRED` | Historical class for material assembly choice needing owner selection. Unused for `PW11-OD-001`–`007` after §51. |
| `VALIDATION REQUIRED` | Candidate that must be measured or tested later |
| `EXTERNALLY GATED` | Legal, brand, Production, or other external authority |
| `PROHIBITED` | Must not appear |

Analytical WCAG relative-luminance ratios from PW-10-R1 remain candidate evidence. They are not rendered-browser validation.

---

## 8. Protected Boundaries

Authenticated Home remains closed at `49cd5773976143139a154f9b8ddf36535a4dd914` / product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828`. PW-11 does not change `src/app/page.tsx`, `/`, `/login`, `/home`, AppShell, middleware, auth, `globals.css`, root layout, shared primitives, favicon, metadata, Vercel configuration, dependencies, tests, or Production. Public visual language remains route-scoped for later implementation (`PW10-OD-018`).

---

## 9. Frozen Inputs

### 9.1 Route A2 visible copy (`UPSTREAM FROZEN`)

Quoted exactly from the owner-frozen PW-6 working deck. Not paraphrased.

| Role | Frozen visible text | Record |
| --- | --- | --- |
| Wordmark / footer identity | `ZyntixAI` | `PW6-COPY-001`; `PW6-COPY-031` |
| Nav | `Over ZyntixAI` | `PW6-NAV-006`; `PW6-COPY-041` |
| Nav | `Hoe het werkt` | `PW6-NAV-002` |
| Nav | `Gesloten bèta` | `PW6-NAV-007`; `PW6-COPY-042` |
| Nav utility | `Inloggen` | `PW6-NAV-004` |
| Narrow nav shortening allowed | `Bèta` for `Gesloten bèta` only when needed | `PW6-RESP-011`; `PW6-NAV-007` |
| H1 | `Houd zicht op klanten, werk en voortgang.` | `PW6-COPY-043`; `PW6-HERO-006` |
| Hero support | `ZyntixAI helpt je als eigenaar van een klein bedrijf het dagelijkse werk te organiseren: klanten, verantwoordelijkheden, voortgang en wat aandacht nodig heeft.` | `PW6-COPY-044` |
| Layer B sentence 1 | `ZyntixAI is nu in gesloten bèta.` | `PW6-COPY-045` |
| Layer B sentence 2 | `Inloggen is voor bestaande accounts.` | `PW6-COPY-045` |
| Value H2 | `Over ZyntixAI` | `PW9-OD-003` |
| Value body | `ZyntixAI is bedoeld om klanten, werk, verantwoordelijkheden en voortgang bij het werk te houden. Het vervangt niet al je andere tools.` | `PW6-COPY-046` |
| Mechanism H2 | `Hoe het werkt` | `PW9-OD-003` |
| Mechanism body | `Relevante informatie over klanten, werk en verantwoordelijkheden blijft bij het werk waar het bij hoort. Toegelaten gebruikers kunnen daarna op Today een beperkt dagelijks startpunt zien.` | `PW6-COPY-047` |
| Today H2 | `Today als voorbeeld in het product` | `PW6-PROOF-005` |
| Today body | `Wie is toegelaten en ingelogd, begint op Today. Die pagina toont een beperkt dagelijks startpunt met aandachtspunten en toegewezen taken.` | `PW6-PROOF-006` |
| Today qualifier | `Today is geen publieke demo en staat niet voor het hele product.` | `PW6-PROOF-007` |
| Course Seller H2 | `Als je opleidingen of coaching geeft` | `PW6-COPY-049`; `PW6-CS-009` |
| Course Seller body | `In die context kunnen toegelaten gebruikers werken met klanten, programma’s, inschrijvingen en voortgang.` | `PW6-CS-010` |
| Course Seller qualifier | `Dit is geen leeromgeving en geen open catalogus.` | `PW6-CS-011` |
| Trust H2 | `Hoe toegang in het product werkt` | `PW6-TRUST-007` |
| Trust body | `ZyntixAI is bedoeld voor mensen die zijn ingelogd binnen hun organisatie. Wat voor jou niet geldt, blijft buiten beeld. Today gebruikt gegevens binnen de context van je ingelogde account en organisatie.` | `PW6-TRUST-008`; `PW6-COPY-050` |
| Access H2 | `Toegang` | `PW6-ACCESS-007` |
| Access status | `ZyntixAI is in gesloten bèta. Via deze site kun je geen nieuw account aanmaken.` | `PW6-ACCESS-008` |
| Access utility | `Heb je al een account? Inloggen.` | `PW6-ACCESS-009` |
| Honest stop | `Heb je geen account, dan is deze pagina bedoeld om ZyntixAI te leren kennen.` | `PW6-ACCESS-010` |

Skip-link chrome (not PW-6 body copy): `Ga naar de hoofdinhoud` (`PW8-NAME-001`; `PW8-OD-004`).

Inactive by default, not in the active board: `ZyntixAI is geen chatbot. Het is een product om dagelijks werk te organiseren.` (`PW6-AI-002`). BOS omitted (`PW6-COPY-054` omitted from Route A2). Metadata remains do-not-implement (`PW6-COPY-052`; `PW6-COPY-053`). Footer copyright remains `EXTERNALLY GATED`.

### 9.2 Visual-system package (`UPSTREAM FROZEN`)

Quiet Operational Editorial; light-first; text-first `ZyntixAI`; canvas `#F4F1EA`; ink `#1A1916`; muted `#5C574E`; teal `#1F5C57`; system-first sans; restrained type; modest radius; shadow-none; Today subtle background shift; Course Seller typographic divider; plain trust; compact enclosed access; factual inline beta; underlined body links; 2px+2px focus candidate `#1F5C57`; no required icons; no-motion baseline; route-scoped isolation; text-labelled non-modal inline disclosure; identity-only footer.

---

## 10. High-Fidelity Design Objective

| ID | Principle |
| --- | --- |
| PW11-PRIN-001 | Calm: quiet paper, no urgency, no motion as quality |
| PW11-PRIN-002 | Modern: contemporary editorial product, not retro |
| PW11-PRIN-003 | Premium: hierarchy, measure, alignment, scarce surfaces |
| PW11-PRIN-004 | Credible: closed-beta honesty; no fake scale |
| PW11-PRIN-005 | Operator-first: `PW2-VIS-001` is the apparent audience |
| PW11-PRIN-006 | Content-led: type and copy before decoration |
| PW11-PRIN-007 | Restrained: one accent; one enclosed panel |
| PW11-PRIN-008 | Accessible by design: focus, non-colour cues, wrap, zoom |
| PW11-PRIN-009 | Truthful maturity: Layer B early; access repeats no-new-account |
| PW11-PRIN-010 | Broader than a chatbot: no orb, chat UI, or AI hero |
| PW11-PRIN-011 | Not a public LMS: Course Seller secondary with qualifier |
| PW11-PRIN-012 | Relevance ≠ availability: qualifiers attached; no open signup |

The page must visually communicate the ten truths in the phase brief without adding claims.

---

## 11. Primary Design

| ID | Design | Status |
| --- | --- | --- |
| PW11-DESIGN-001 | Quiet Operational Editorial Homepage | `OWNER FROZEN HIGH-FIDELITY DESIGN DIRECTION — DOWNSTREAM REVIEW REQUIRED` |

No co-leading alternative design exists. `PW11-OD-001`–`007` are owner-frozen assembly values inside this single design, not a second design direction. `PW10-DIR-002` and `PW10-DIR-003` remain historical PW-10 alternatives and are not realized here.

---

## 12. Page Composition

Eight visual clusters (`PW9-ZONE-001`–`008`) and ten semantic regions (`PW9-SEC-001`–`010`) remain. Footer is a semantic region, not a ninth marketing cluster.

| ID | Region | Semantic | Cluster | Copy |
| --- | --- | --- | --- | --- |
| PW11-REGION-001 | Skip link | link before `header` | chrome | `Ga naar de hoofdinhoud` |
| PW11-REGION-002 | Header | `header` | ZONE-001 | Wordmark `ZyntixAI` |
| PW11-REGION-003 | Primary nav | named `nav` | ZONE-001 | Four frozen labels |
| PW11-REGION-004 | Utility Sign in | link in header | ZONE-001 | `Inloggen` |
| PW11-REGION-005 | Hero | `section` in `main` | ZONE-002 | H1 + support |
| PW11-REGION-006 | Closed beta | status text | ZONE-002 | Layer B two sentences |
| PW11-REGION-007 | Over ZyntixAI | `section` | ZONE-003 | H2 + `PW6-COPY-046` |
| PW11-REGION-008 | Hoe het werkt | `section` | ZONE-004 | H2 + `PW6-COPY-047` |
| PW11-REGION-009 | Today | `section` | ZONE-005 | H2 + body + qualifier |
| PW11-REGION-010 | Course Seller | `section` in `main` | ZONE-006 | H2 + body + qualifier |
| PW11-REGION-011 | Trust | `section` | ZONE-007 | H2 + named-controls body |
| PW11-REGION-012 | Access | `section` | ZONE-008 | H2 + status + utility + stop |
| PW11-REGION-013 | Footer | `footer` | ZONE-008 close | `ZyntixAI` |
| PW11-REGION-014 | Disclosure | in-flow when needed | ZONE-001 | Trigger `Navigatie`; same four labels; not icon-only |

Order contract (`UPSTREAM FROZEN`): DOM order = visual order = reading order = keyboard order = responsive order. Same truth on every canvas.

Count reconciliation (R1): eight visual clusters remain the PW-7/PW-9 marketing budget. Ten semantic regions remain `PW9-SEC-001`–`010`. Fourteen `PW11-REGION-*` IDs are the high-fidelity component set that implements those counts plus header chrome. They are not fourteen extra marketing clusters.

| PW9-SEC | Implements | PW11-REGION | Visual cluster |
| --- | --- | --- | --- |
| SEC-001 | Skip | REGION-001 | chrome, not a cluster |
| SEC-002 | Header | REGION-002 + 003 + 004 + 014 | ZONE-001 |
| SEC-003 | Hero | REGION-005 | ZONE-002 |
| SEC-004 | Closed beta | REGION-006 | ZONE-002 |
| SEC-005 | Value | REGION-007 | ZONE-003 (cluster 3 with ZONE-004) |
| SEC-006 | Mechanism | REGION-008 | ZONE-004 (same cluster 3) |
| SEC-007 | Today | REGION-009 | ZONE-005 |
| SEC-008 | Course Seller | REGION-010 | ZONE-006 |
| SEC-009 | Trust | REGION-011 | ZONE-007 |
| SEC-010 | Access + footer close | REGION-012 + 013 | ZONE-008 |

Candidate anchors remain not implemented (`PW9-ANCHOR-001`–`007`): `hoofdinhoud`; `over-zyntixai`; `hoe-het-werkt`; `today`; `opleidingen-en-coaching`; `hoe-toegang-werkt`; `toegang`. No `href="#"`.

---

## 13. Viewport Review Canvases

These are design-review canvases (`PW7-VIEW-*` family), not implementation breakpoints (`PW7-OD-014`).

| ID | Canvas | CSS px | Role | Header / nav | Type | Surfaces |
| --- | --- | --- | --- | --- | --- | --- |
| PW11-VIEW-001 | Large desktop | 1440 | Wide editorial | Full nav while fit | display-1 2.00rem | One enclosed (access) |
| PW11-VIEW-002 | Compact desktop | 1280 | Same truth; less outer margin | Full nav while fit | Same | One enclosed |
| PW11-VIEW-003 | Tablet landscape / compact nav | 1024 | Content-driven transition | Full or wrap-then-disclose | Slightly reduced | One enclosed |
| PW11-VIEW-004 | Tablet portrait | 768 | One column likely | Disclose if labels no longer fit | heading-2 1.25rem | One enclosed |
| PW11-VIEW-005 | Mobile | 390 | One column | Inline disclosure; `Inloggen` outside | display-1 1.625rem | One enclosed; max two |
| PW11-VIEW-006 | Narrow mobile | 320 | Required safety | Disclosure; `Bèta` shortening allowed | Wrap H1 and support | One enclosed |
| PW11-VIEW-007 | 200% zoom equivalent | reflow | Same DOM truth | May disclose | No lost qualifier | Same |
| PW11-VIEW-008 | Text-spacing override | override | Qualifiers attached | Header may wrap | No orphaned qualifier | Same |
| PW11-VIEW-009 | Landscape mobile | short height | Static header; no vh hero | May wrap | Compress space, not copy | Same |

Reconciliation with PW-7: `PW7-VIEW-001`–`010` remain the governed review set. PW-11 maps them as follows and does not invent CSS breakpoints (`PW7-OD-014`).

| PW-7 canvas | PW-11 canvas | Reconciliation |
| --- | --- | --- |
| `PW7-VIEW-001` 320 | `PW11-VIEW-006` | Required safety |
| `PW7-VIEW-002` 360 | inherit `PW11-VIEW-006` / `005` | Alias; no extra composition |
| `PW7-VIEW-003` 390 | `PW11-VIEW-005` | Mobile |
| `PW7-VIEW-004` 430 | inherit `PW11-VIEW-005` | Alias; no extra composition |
| `PW7-VIEW-005` 768 | `PW11-VIEW-004` | Tablet portrait |
| `PW7-VIEW-006` 1024 | `PW11-VIEW-003` | Compact-nav / tablet landscape |
| `PW7-VIEW-007` 1280 | `PW11-VIEW-002` | Compact desktop |
| `PW7-VIEW-008` 1440 | `PW11-VIEW-001` | Wide desktop; extra space is margin |
| `PW7-VIEW-009` 1920 | inherit `PW11-VIEW-001` | Cap by `content-wide`; prevent marketing-wall stretch |
| `PW7-VIEW-010` 200% | `PW11-VIEW-007` | Accessibility reflow |
| Text-spacing (PW-8) | `PW11-VIEW-008` | Not a PW-7 numbered VIEW; still required |
| Landscape mobile | `PW11-VIEW-009` | Short-height review; not a named PW-7 VIEW |

Navigation changes on content-fit, likely near 640–768 px, still `VALIDATION REQUIRED`. Optional two-column supporting field remains omitted (`PW9-OD-004`).

### 13.1 Canvas contracts

Every canvas below uses the same DOM, copy, and order. Values are design-review contracts, not implemented CSS.

| Field | VIEW-001 1440 | VIEW-002 1280 | VIEW-003 1024 | VIEW-004 768 |
| --- | --- | --- | --- | --- |
| Viewport role | Wide editorial | Representative desktop | Compact-nav transition | Tablet portrait |
| Outer inline | 1.50rem | 1.50rem | 1.25–1.50rem | 1.00–1.25rem |
| Max content width | 64rem | 64rem | 64rem or 100% | 100% of viewport minus inline |
| Reading column | 40rem start-aligned | 40rem | ≤40rem | full reading width |
| Header | static; white grouping bar | same | same | same; may wrap |
| Navigation | full while fit | full while fit | full or wrap-then-disclose | disclose if labels collide |
| Type scale | display-1 2.00rem; H2 1.375rem | same | same unless wrap | H2 1.25rem; display-1 may remain 2.00rem until mobile rule |
| Section rhythm | major space-8 | space-8 | space-7–8 | space-7 |
| Surface occupancy | 1 enclosed (access) | 1 | 1 | 1 |
| Content order | skip → header → hero → beta → value → mechanism → Today → CS → trust → access → footer | same | same | same |
| Qualifier placement | in-section after claim | same | same | same |
| Access-panel width | `OWNER FROZEN` reading column (`PW11-OD-004`) | same | same | reading width within safe inline |
| Today-band width | `OWNER FROZEN` reading column (`PW11-OD-003`) | same | same | same meaning within available width |
| CS divider span | `OWNER FROZEN` copy-measure (`PW11-OD-005`) | same | same | same |
| Header separator | `OWNER FROZEN` 1px `border-default` (`PW11-OD-002`) | same | same | same; not the sole boundary |
| Hero top | `OWNER FROZEN` space-8 (`PW11-OD-007`) | space-8 | space-7–8 | space-7 |
| H1 wrapping | `OWNER FROZEN` natural wrap (`PW11-OD-006`) | same | same | natural; no forced break |
| Disclosure label | not required while full nav fits | same | `Navigatie` when disclosed (`PW11-OD-001`) | `Navigatie` when disclosed |
| Footer | identity; top divider; content-wide | same | same | compact |
| Expected wrapping | H1 one or two lines | same | support may wrap | H1 two lines likely |
| Prohibited overflow | no horizontal core scroll; no clipped focus | same | same | same |
| Focus | 2px+2px; space-3 clearance | same | same | same |
| Must remain adjacent | H1+support; Layer B pair; Today body+qualifier; CS body+qualifier; access triad | same | same | same |

| Field | VIEW-005 390 | VIEW-006 320 | VIEW-007 200% | VIEW-008 text-spacing | VIEW-009 landscape mobile |
| --- | --- | --- | --- | --- | --- |
| Viewport role | One-column mobile | Required safety | Accessibility reflow | Spacing override | Short height |
| Outer inline | 1.00rem | 1.00rem never below | as zoomed | as authored + override | 1.00rem |
| Max content width | 100% minus inline | 100% minus inline | reflowed | reflowed | 100% minus inline |
| Reading column | full | full | full | full | full |
| Header | static; identity + `Inloggen` + `Navigatie` | identity may wrap; `Inloggen` outside; `Navigatie` remains understandable | may disclose with `Navigatie` | may wrap | static; not sticky |
| Navigation | inline disclosure labelled `Navigatie` | disclosure labelled `Navigatie`; `Bèta` shortening allowed | may disclose | wrap or disclose | wrap or disclose |
| Type scale | display-1 1.625rem; H2 1.25rem | same; wrap | reflowed sizes | same roles | compress space not type below floor |
| Section rhythm | major toward 1.50rem | compact | content-driven | extra gap must not orphan | compact |
| Surface occupancy | 1 enclosed; max 2 | 1 | 1 | 1 | 1 |
| Content order | same as desktop | same | same | same | same |
| Qualifier placement | attached | attached; not dropped | attached | attached | attached |
| Access-panel width | available safe width; same meaning as reading-column panel (`PW11-OD-004`) | same; padding 1.25rem still fits | same | same | same |
| Today-band width | available safe width; reading-column meaning (`PW11-OD-003`) | same | same | same | same |
| CS divider span | copy-measure within available width (`PW11-OD-005`) | same | same | same | same |
| Header separator | 1px; not the sole boundary or focus (`PW11-OD-002`) | same | same | same | same |
| H1 wrapping | natural wrap; no forced break (`PW11-OD-006`) | same | same | same | same |
| Footer | compact identity | compact | compact | compact | compact |
| Expected wrapping | H1 2–3 lines naturally; `verantwoordelijkheden` in support; no forced H1 break | same; no truncate | wrapping increases naturally | wrapping increases naturally | wrapping; no vh-hero |
| Prohibited overflow | no 2D core scroll | no 2D core scroll | no lost control | no overlap | no sticky overlay |
| Focus | not clipped | not clipped | visible | visible | visible |
| Must remain adjacent | same pairs | same pairs | same pairs | same pairs | same pairs |

---

## 14. Geometry System

Frozen PW-10 SPACE / SIZE / CONT values are used. High-fidelity assembly values that were establishment recommendations are now owner-frozen (`PW11-OD-001`–`007`; §51 is current authority).

| ID | Token | Value | Class |
| --- | --- | --- | --- |
| PW11-GEO-001 | page-inline-safe | 1.00rem at 320; 1.50rem at ≥1280 | `UPSTREAM FROZEN` `PW10-CONT-001` |
| PW11-GEO-002 | content-wide | max 64rem | `UPSTREAM FROZEN` `PW10-CONT-003` |
| PW11-GEO-003 | content-reading | max 40rem; hard max box for editorial and panels | `UPSTREAM FROZEN` `PW10-CONT-002` |
| PW11-GEO-004 | copy-measure | 60–72ch preferred line length **inside** the reading column; must not exceed content-reading | `UPSTREAM FROZEN` layout guidance; R1 precedence |
| PW11-GEO-005 | header-min-height | content-driven; ≥ ~3.5rem | `UPSTREAM FROZEN` `PW10-SIZE-001` |
| PW11-GEO-006 | header-padding-inline | space-4 to space-5 **inside** content-wide; not added to viewport page-inline-safe | `HIGH-FIDELITY DERIVATION` |
| PW11-GEO-007 | header-padding-block | space-3 | `HIGH-FIDELITY DERIVATION` |
| PW11-GEO-008 | wordmark-size | 1.125–1.25rem | `UPSTREAM FROZEN` `PW10-ID-003` |
| PW11-GEO-009 | nav-gap | space-4 | `HIGH-FIDELITY DERIVATION` |
| PW11-GEO-010 | hero-space-top | space-8 at large desktop; same token at 1280; not vh-hero; not extra +space-4 | `OWNER FROZEN` `PW11-OD-007` |
| PW11-GEO-011 | hero-space-bottom | space-5 into Layer B | `UPSTREAM FROZEN` `PW10-SPACE-013` |
| PW11-GEO-012 | h1-max-measure | copy-measure; natural wrap; no forced break | `OWNER FROZEN` `PW11-OD-006` plus `UPSTREAM FROZEN` measure |
| PW11-GEO-013 | support-max-measure | copy-measure | `UPSTREAM FROZEN` |
| PW11-GEO-014 | beta-separation | space-5 after support | `UPSTREAM FROZEN` |
| PW11-GEO-015 | section-space-major | space-8 | `UPSTREAM FROZEN` |
| PW11-GEO-016 | section-space-compact | space-5 | `UPSTREAM FROZEN` |
| PW11-GEO-017 | heading-to-body | space-4 | `UPSTREAM FROZEN` `PW10-SPACE-011` |
| PW11-GEO-018 | paragraph-gap | space-4 | `HIGH-FIDELITY DERIVATION` |
| PW11-GEO-019 | today-padding | panel-padding 1.25rem | `UPSTREAM FROZEN` `PW10-SPACE-018` |
| PW11-GEO-020 | cs-divider-space | space-6 above / space-4 below | `HIGH-FIDELITY DERIVATION` |
| PW11-GEO-021 | trust-spacing | section-space-default space-7 | `UPSTREAM FROZEN` `PW10-SPACE-014` |
| PW11-GEO-022 | access-width | reading column; mobile uses available safe width | `OWNER FROZEN` `PW11-OD-004` |
| PW11-GEO-023 | access-padding | 1.25rem | `UPSTREAM FROZEN` |
| PW11-GEO-024 | footer-spacing | space-5 block; space-4 above divider | `HIGH-FIDELITY DERIVATION` |
| PW11-GEO-025 | mobile-space-reduction | major 2.50rem → 1.50rem | `HIGH-FIDELITY DERIVATION` |
| PW11-GEO-026 | narrow-inline | never below 1.00rem | `UPSTREAM FROZEN` |
| PW11-GEO-027 | focus-clearance | ≥ space-3 around wordmark and controls | `UPSTREAM FROZEN` |
| PW11-GEO-028 | cluster-gap interior | space-6 between value and mechanism | `UPSTREAM FROZEN` `PW10-SPACE-012` |
| PW11-GEO-029 | today-band-width | reading column; not content-wide; not full-bleed | `OWNER FROZEN` `PW11-OD-003` |
| PW11-GEO-030 | cs-divider-span | copy-measure; not wide-container span | `OWNER FROZEN` `PW11-OD-005` |

Header separator stroke is 1px (`OWNER FROZEN` `PW11-OD-002`; colour application `PW11-COLOR-013`). Disclosure visible label is `Navigatie` (`OWNER FROZEN` `PW11-OD-001`; not a geometry token). No fixed section heights. No viewport-height hero. No AppShell `72rem` copy.

Width-role precedence (R1): viewport → page-inline-safe → content-wide (header/footer/close cluster) → content-reading (editorial and enclosed panel max) → copy-measure (preferred line length, never wider than the reading box). Today band and access panel both use the reading column as width, but they remain separate regions and separate surfaces. Course Seller divider uses copy-measure and therefore cannot be wider than the reading column.

Narrow-mobile arithmetic at a 16px root (design contract, not a measured browser result): 320 CSS px minus 1.00rem page-inline on each side leaves 288 CSS px. Access padding 1.25rem on each side plus 1px `border-strong` each side leaves about 246 CSS px of inner text. Preferred 44 CSS px targets fit. Focus 2px outline + 2px offset consumes 8 CSS px and remains inside the 16 CSS px page-inline, so the ring is not clipped. copy-measure 60–72ch is not a required width at 320; the safe inner width governs. Identity, `Navigatie`, and `Inloggen` wrap rather than overflow (`PW7-NAV-002`; `PW11-OD-001`; `PW11-OD-006`).

---

## 15. Typography Application

Family for every role: public candidate stack `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` (`PW10-OD-006`). No external font. Tracking 0 unless noted. Contrast pairing: text-primary `#1A1916` on canvas `#F4F1EA` unless noted.

| ID | Role | Size desktop / mobile | Line-height | Weight | Measure | Wrap |
| --- | --- | --- | --- | --- | --- | --- |
| PW11-TYPE-001 | Wordmark | 1.125–1.25rem / same | 1.2 | 700 | header | no truncate |
| PW11-TYPE-002 | Navigation | 0.9375rem / 1.00rem | 1.25 | 600 | nav-container | wrap or disclose |
| PW11-TYPE-003 | H1 | 2.00rem / 1.625rem | 1.2 | 700 | copy-measure | natural wrap (`PW11-OD-006`); no forced break; no truncate |
| PW11-TYPE-004 | Hero support | 1.125rem / 1.0625rem | 1.5 | 400 | copy-measure | wrap `verantwoordelijkheden` |
| PW11-TYPE-005 | Closed-beta status | 1.00rem / 1.00rem | 1.45 | 400 | copy-measure | two sentences remain |
| PW11-TYPE-006 | H2 | 1.375rem / 1.25rem | 1.25 | 600 | copy-measure | wrap |
| PW11-TYPE-007 | Body | 1.00rem / 1.00rem | 1.55 | 400 | copy-measure | wrap |
| PW11-TYPE-008 | Qualifier | 0.9375rem / 0.9375rem | 1.5 | 400 | copy-measure | attached; text-secondary; not below floor |
| PW11-TYPE-009 | Utility `Inloggen` | 0.9375rem / 1.00rem | 1.25 | 600 | control | wrap |
| PW11-TYPE-010 | Access H2 | same as TYPE-006 | 1.25 | 600 | panel | wrap |
| PW11-TYPE-011 | Footer identity | 0.9375rem | 1.4 | 600 | content-wide | wrap |
| PW11-TYPE-012 | Disclosure trigger | 0.9375rem / 1.00rem (same as TYPE-002) | 1.25 | 600 | control | visible label `Navigatie` (`PW11-OD-001`); not icon-only |
| PW11-TYPE-013 | Skip link | body-default | 1.5 | 600 | control | visible on focus |

H1 must not look like an inflated slogan. Essential qualifiers (Today and Course Seller) use `text-secondary` `#3F3C36` so they are not demoted to faint meta. `text-muted` `#5C574E` is reserved for footer identity and other non-required chrome. Independent analytical candidate on canvas: secondary 9.74:1; muted 6.36:1. Rendered pairing remains `VALIDATION REQUIRED`.

H1 wrap is owner-frozen natural wrapping (`PW11-OD-006`). Do not insert a forced line break into the authoritative copy or markup contract. Actual wrap points remain `VALIDATION REQUIRED`.

---

## 16. Colour Application

No new hex values. Semantic mapping of the frozen DIR-001 palette.

| ID | Application | Token | Hex | Notes |
| --- | --- | --- | --- | --- |
| PW11-COLOR-001 | Page canvas | canvas | `#F4F1EA` | Whole page |
| PW11-COLOR-002 | Primary text | text-primary | `#1A1916` | H1, H2, body, wordmark |
| PW11-COLOR-003 | Supporting text | text-secondary | `#3F3C36` | Essential qualifiers (Today, Course Seller) |
| PW11-COLOR-004 | Muted text | text-muted | `#5C574E` | Footer; not required claims |
| PW11-COLOR-005 | Link | link | `#1F5C57` | Plus underline in body |
| PW11-COLOR-006 | Link hover | link-hover | `#174843` | Never sole cue |
| PW11-COLOR-007 | Focus ring | focus-ring | `#1F5C57` | 2px outline + 2px offset |
| PW11-COLOR-008 | Decorative rule | border-default | `#C9C2B4` | Header/footer grouping only |
| PW11-COLOR-009 | Essential enclosure | border-strong | `#8A8376` | Access panel |
| PW11-COLOR-010 | Today band | canvas-subtle | `#EBE6DC` | Not a card |
| PW11-COLOR-011 | Access surface | surface | `#FFFFFF` | Only enclosed panel |
| PW11-COLOR-012 | CS / footer divider | border-subtle | `#E4DFD4` | Decorative; text remains cue |
| PW11-COLOR-013 | Header separator | border-default | `#C9C2B4` | `OWNER FROZEN` 1px (`PW11-OD-002`); decorative grouping; not the sole state cue |
| PW11-COLOR-014 | Beta optional edge | border-strong left | `#8A8376` | Optional; text is the cue |
| PW11-COLOR-015 | Disclosure surface | canvas | `#F4F1EA` | In-flow list; not a second enclosed panel |
| PW11-COLOR-016 | Active | accent-active | `#123833` | Pressed links |
| PW11-COLOR-017 | Selection | selection | `#D5E6E3` / `#1A1916` | Native selection |
| PW11-COLOR-018 | Visited body link | same as default | `#1F5C57` | `PW8-OD-009` partial |
| PW11-COLOR-019 | Forced-colours fallback | system | system | Text, links, focus, borders |
| PW11-COLOR-020 | Accent in headings | none | n/a | `PROHIBITED` as heading paint |

Low-contrast default/subtle borders remain decorative only (`PW10-R1-FND-005`). Closed beta, links, and current nav must not depend only on colour.

Independent R1 analytical candidates using WCAG 2.x relative luminance (sRGB, not a browser measurement, **not** an accessibility PASS): text-primary/canvas 15.58:1; text-primary/surface 17.58:1; text-primary/Today 14.13:1; text-secondary/canvas 9.74:1; text-secondary/Today 8.84:1; text-muted/canvas 6.36:1; text-muted/Today 5.77:1; accent/canvas 6.83:1; accent/surface 7.70:1; accent/Today 6.19:1; hover/canvas 9.11:1; border-strong/surface 3.76:1; border-strong/canvas 3.33:1; border-default/canvas 1.57:1 decorative; border-subtle/canvas 1.18:1 decorative; Today band/canvas 1.10:1 (not a text pair). These numbers agree with PW-10-R1 where overlapping. `VALIDATION REQUIRED` in PW-12.

---

## 17. Surface and Emphasis Budget

| ID | Zone | Treatment |
| --- | --- | --- |
| PW11-SURF-001 | Page | Warm paper; shadow-none |
| PW11-SURF-002 | Header | Surface `#FFFFFF` + decorative bottom rule |
| PW11-SURF-003 | Hero | Canvas; not enclosed |
| PW11-SURF-004 | Beta | Inline; not pill |
| PW11-SURF-005 | Value / mechanism | Continuous editorial; not enclosed |
| PW11-SURF-006 | Today | Subtle band; not heavy card |
| PW11-SURF-007 | Course Seller | Typographic divider; not card |
| PW11-SURF-008 | Trust | Plain titled text |
| PW11-SURF-009 | Access | One compact enclosed panel |
| PW11-SURF-010 | Footer | Top divider; not card |
| PW11-SURF-011 | Disclosure | In-flow list on canvas; not overlay; not a second enclosed panel |

Enclosed occupancy: desktop 1 (access panel); tablet 1; mobile 1. The header white grouping bar is a surface with a bottom decorative rule, not a counted enclosed panel. Today is a background shift, not an enclosure. Maximum allowed remains 3 desktop / 2 mobile (`PW9-OD-008`). Recommended occupancy is one principal enclosed panel.

Emphasis budget: accent only on links and focus; bold limited to wordmark, H1, H2, nav, utility; no filled primary button; no alternating zebra bands; no product-card grid. Hierarchy is type, width, spacing, and alignment.

---

## 18. Header Design

### 18.A Skip link (`PW11-REGION-001`; `PW11-COMP-001`)

| Contract | Value |
| --- | --- |
| Section ID | REGION-001 |
| Semantic | Link before `header`; first focusable |
| Design role | Keyboard bypass of chrome |
| Frozen copy | `Ga naar de hoofdinhoud` (`PW8-NAME-001`; `PW8-OD-004`) |
| Container | Full viewport; not in the reading column |
| Width | Hug content + control padding |
| Typography | TYPE-013; body-default; weight 600 |
| Spacing | Control padding; space-3 clearance when visible |
| Surface | surface `#FFFFFF` when focused; clipped off-canvas when not |
| Border | none required; focus ring is the boundary |
| Radius | radius-small 0.25rem optional; not a pill |
| Color | text-primary on surface when visible |
| Desktop / tablet / mobile | Same behaviour; never sticky overlay covering `main` |
| Interaction | Hidden until `:focus-visible`. Target is `main` (`PW8-OD-004`). Candidate fragment `hoofdinhoud` is used only when that ID exists on `main`. Omit the href rather than use `href="#"` (`PW8-ERROR-002`). |
| Accessibility | Public Dutch chrome; do not restyle AppShell `Skip to main content` |
| Claim boundary | Not a product claim |
| Status | Required chrome; destination `CANDIDATE DESTINATION — NOT IMPLEMENTED` |
| Prohibited | English public label; changing authenticated skip; visible-by-default clutter; `href="#"` |
| PW-13 | Route-scoped skip; isolate from AppShell |
| PW-12 | `PW11-VAL-016`; `PW11-VAL-017` |

### 18.B Public header (`PW11-REGION-002`)

| Contract | Value |
| --- | --- |
| Section ID | REGION-002 |
| Semantic | `header` landmark |
| Design role | Identity + exploration + utility Sign in |
| Frozen copy | Wordmark `ZyntixAI` |
| Container | content-wide max 64rem, centred, inside page-inline-safe |
| Width | content-wide |
| Typography | TYPE-001 wordmark 1.125–1.25rem / 700 |
| Spacing | GEO-006/007; min height content-driven ≥ ~3.5rem |
| Surface | `#FFFFFF` grouping bar |
| Border | bottom 1px `border-default` `#C9C2B4`; presence frozen (`PW10-SURF-002`); stroke `OWNER FROZEN` `PW11-OD-002` |
| Radius | 0 |
| Color | text-primary wordmark; surface bar |
| Desktop | Brand start; nav middle/end; `Inloggen` end |
| Tablet | Same until fit fails |
| Mobile | Brand start; `Inloggen` visible; disclosure trigger adjacent |
| Interaction | Static, non-sticky (`PW7-OD-004`). Wordmark is not a `/home` link. |
| Accessibility | Landmark; 44×44 preferred targets; focus not clipped |
| Claim boundary | Name is identity, not GA |
| Status | Required |
| Prohibited | Sticky bar; AppShell clone; filled Sign in; logo image; robot mark |
| PW-13 | Route-scoped header; never mutate AppShell |
| PW-12 | `PW11-VAL-011`; `PW11-VAL-029` |

`Inloggen` is an underlined utility link (`PW11-REGION-004`), not a filled primary acquisition CTA. Preferred target 44×44 CSS px; floor 24×24. Header separator is owner-frozen at 1px matching `PW10-BORD-002` (`PW11-OD-002`). Omitting the rule would reopen `PW10-SURF-002` and remains `PROHIBITED`. Rendered contrast of the rule remains `VALIDATION REQUIRED`.

---

## 19. Navigation and Disclosure Design

| Contract | Value |
| --- | --- |
| Section ID | REGION-003 / REGION-014 |
| Semantic | Named `nav`; disclosure is in-flow, non-modal |
| Design role | In-page orientation; not live IA until IDs exist |
| Frozen copy | PW-6 labels `Over ZyntixAI` · `Hoe het werkt` · `Gesloten bèta` · `Inloggen`. Chrome trigger `Navigatie` (`PW11-OD-001`; not PW-6 body copy) |
| Container | nav-container = content-wide |
| Width | Hug labels with GEO-009 gap space-4 |
| Typography | TYPE-002 nav 0.9375rem desktop / 1.00rem mobile / 600 |
| Spacing | space-4 between items; control padding |
| Surface | none; disclosure list uses canvas or surface without overlay dim |
| Border | none required |
| Radius | 0; not pills |
| Color | ink or link; underline on hover/focus; never colour-only current |
| Desktop | Full inline while identity + four labels + `Inloggen` fit |
| Tablet | Wrap-before-disclosure allowed if one wrap keeps `Inloggen` usable |
| Mobile / 320 / 200% | Text-labelled inline disclosure with visible label `Navigatie`; `Inloggen` outside (`PW7-NAV-002`; `PW11-OD-001`) |
| Interaction | No `href="#"`. Missing destinations omit the link (`PW8-ERROR-002`). |
| Accessibility | Visible name; 24/44 targets; no trap; Escape only if enhanced (`PW8-OD-006`) |
| Claim boundary | Labels do not prove live sections |
| Status | Required; destinations later |
| Prohibited | Hamburger-only; drawer; modal; icon-only; `Menu` auto-copied from AppShell |
| PW-13 | Native `details`/`summary` fallback (`PW8-OD-016`) |
| PW-12 | `PW11-VAL-024`; `PW11-VAL-025`; `PW11-VAL-029` |

Disclosure trigger copy is public chrome, not PW-6 marketing copy. Owner-frozen visible label: `Navigatie` (`PW11-OD-001`). It is text-labelled, non-modal, and inline. It must not rely on a hamburger icon as its only accessible or visible label. It must work without animation. It must not create a modal navigation system. Do not translate or restyle authenticated AppShell navigation. Expanded state: in-flow list of the same frozen labels; page remains usable. Exact implementation mechanism remains PW-13. Behaviour and fit remain `VALIDATION REQUIRED`. Do not invent a CSS breakpoint.

No-JavaScript: native `details`/`summary` or always-visible in-page headings remain usable. Candidate anchors remain not implemented: `hoofdinhoud`; `over-zyntixai`; `hoe-het-werkt`; `today`; `opleidingen-en-coaching`; `hoe-toegang-werkt`; `toegang`.

---

## 20. Hero Design

| Contract | Value |
| --- | --- |
| Section ID | REGION-005 |
| Semantic | First `section` in `main` |
| Design role | Operator recognition; one H1 |
| Frozen copy | H1 `Houd zicht op klanten, werk en voortgang.` (`PW6-COPY-043`; `PW6-HERO-006`). Support `PW6-COPY-044` |
| Container | copy-measure / content-reading |
| Width | ≤40rem; 60–72ch guidance |
| Typography | TYPE-003 display-1 2.00/1.625rem 700/1.2; TYPE-004 body-lead 1.125/1.0625rem 400/1.5 |
| Spacing | GEO-010 top space-8 at large desktop (`OWNER FROZEN` `PW11-OD-007`); GEO-011 bottom space-5 into Layer B |
| Surface | canvas; not enclosed |
| Border | none |
| Radius | 0 |
| Color | text-primary on canvas; no accent wash |
| Desktop | Single start-aligned column; extra 1440 space is margin |
| Tablet | Same column |
| Mobile | Wrap; no vh-hero |
| Interaction | None required |
| Accessibility | Sole H1; natural wrap; not truncated |
| Claim boundary | Direction, not guaranteed outcome (`PW6-RSK-031`) |
| Status | Required |
| Prohibited | CTA row; illustration; screenshot; glow; gradient field; empty oversized viewport; eyebrow |
| PW-13 | Route-scoped type; no AppShell display class |
| PW-12 | `PW11-VAL-001`; `PW11-VAL-002`; `PW11-VAL-021` |

H1 wrapping is owner-frozen as natural wrapping (`PW11-OD-006`). Do not insert a forced line break into the authoritative copy or markup contract. Do not tune the design around a single screenshot-perfect line break. The H1 remains one semantic heading: `Houd zicht op klanten, werk en voortgang.` Actual wrap points remain `VALIDATION REQUIRED`.

---

## 21. Closed-Beta Design

| Contract | Value |
| --- | --- |
| Section ID | REGION-006 |
| Semantic | Status text associated with hero; not an H2 |
| Design role | Early maturity; Sign in qualification |
| Frozen copy | `ZyntixAI is nu in gesloten bèta.` `Inloggen is voor bestaande accounts.` (`PW6-COPY-045`) |
| Container | copy-measure |
| Width | same as support |
| Typography | TYPE-005 status 1.00rem / 1.45 / 400 |
| Spacing | GEO-014 space-5 after support |
| Surface | none; optional beta-surface unused by default |
| Border | optional left `border-strong`; text remains the cue |
| Radius | 0; not a pill |
| Color | text-primary or text-secondary; not colour-only |
| Desktop / tablet / mobile | Immediately after support; both sentences remain |
| Interaction | None; not a button |
| Accessibility | Understandable without colour; wraps at 320 |
| Claim boundary | Closed beta; existing-account Sign in; not scarcity |
| Status | Required; not removable |
| Prohibited | Badge; chip; glow; countdown; waitlist; join |
| PW-13 | `status` text; no `role="alert"` |
| PW-12 | `PW11-VAL-004`; `PW11-VAL-005` |

---

## 22. Value and Mechanism Design

| Contract | Value |
| --- | --- |
| Section ID | REGION-007 / REGION-008 |
| Semantic | Two titled `section`s in one visual cluster |
| Design role | What it organizes; how it works |
| Frozen copy | H2 `Over ZyntixAI` + `PW6-COPY-046`. H2 `Hoe het werkt` + `PW6-COPY-047` |
| Container | content-reading |
| Width | ≤40rem |
| Typography | TYPE-006 H2; TYPE-007 body |
| Spacing | major space-8 before the cluster; interior cluster-gap space-6; heading-to-body space-4 |
| Surface | canvas; not enclosed |
| Border | none |
| Radius | 0 |
| Color | text-primary |
| Desktop / tablet / mobile | Continuous editorial stack; never a card grid |
| Interaction | Future anchors `#over-zyntixai` / `#hoe-het-werkt` not live |
| Accessibility | Visible H2s; logical hierarchy |
| Claim boundary | Anti-replacement; Today is later and bounded; not a complete suite |
| Status | Required |
| Prohibited | Feature cards; module tiles; BOS sentence; AI sentence; four TG cards |
| PW-13 | Native headings; no card component |
| PW-12 | `PW11-VAL-001`; `PW11-VAL-003` |

---

## 23. Today Design

| Contract | Value |
| --- | --- |
| Section ID | REGION-009 |
| Semantic | `section` |
| Design role | Bounded authenticated example |
| Frozen copy | H2 `PW6-PROOF-005`; body `PW6-PROOF-006`; qualifier `PW6-PROOF-007` |
| Container | `OWNER FROZEN` reading column (`PW11-OD-003`) |
| Width | not full-bleed luxury; not a tiny floating card |
| Typography | H2 heading-2; body body-default; qualifier body-small 0.9375rem text-secondary |
| Spacing | panel-padding 1.25rem; qualifier attached after body |
| Surface | canvas-subtle `#EBE6DC`; shadow-none |
| Border | none required |
| Radius | 0 |
| Color | text-primary / text-secondary on `#EBE6DC` |
| Desktop | Quiet band under mechanism |
| Tablet | Same; not a second card |
| Mobile | Must not become a heavy enclosed card |
| Interaction | Not interactive; not a demo |
| Accessibility | Qualifier remains; not a live region |
| Claim boundary | Example ≠ whole product; not public demo; bound to SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Status | Required in Route A2 |
| Prohibited | Screenshot; browser frame; Home window; fabricated data; AI ranking |
| PW-13 | Background token only; no iframe |
| PW-12 | `PW11-VAL-006`; `PW11-VAL-030` |

---

## 24. Course Seller Design

| Contract | Value |
| --- | --- |
| Section ID | REGION-010 |
| Semantic | `section` in `main`, not HTML `aside` (`PW8-OD-003`) |
| Design role | Secondary relevance |
| Frozen copy | H2 `PW6-CS-009`; body `PW6-CS-010`; qualifier `PW6-CS-011` |
| Container | copy-measure |
| Width | secondary to the operator column |
| Typography | H2 not below heading-2; qualifier 0.9375rem text-secondary |
| Spacing | space-6 above divider / space-4 below; qualifier attached |
| Surface | canvas |
| Border | top typographic divider `border-subtle`; span `OWNER FROZEN` copy-measure (`PW11-OD-005`) |
| Radius | 0 |
| Color | text-primary / text-secondary; divider decorative |
| Desktop | After Today; not brand-primary |
| Tablet / mobile | Intact unit; not a second heavy card |
| Interaction | No extra CTA |
| Accessibility | Discoverable by heading; visual aside ≠ complementary landmark |
| Claim boundary | Relevance ≠ availability; not LMS; not catalogue; not complete CS edition |
| Status | Removable without breaking operator flow |
| Prohibited | Edition card; coaching funnel; learner imagery; extra Sign in |
| PW-13 | `section` in `main` |
| PW-12 | `PW11-VAL-007`; `PW11-VAL-026` |

---

## 25. Trust Design

| Contract | Value |
| --- | --- |
| Section ID | REGION-011 |
| Semantic | `section` |
| Design role | Named controls, not certification |
| Frozen copy | H2 `PW6-TRUST-007`; body `PW6-TRUST-008` |
| Container | content-reading |
| Width | ≤40rem |
| Typography | H2 + body; optional short semantic list restating the same three sentences without adding claims |
| Spacing | section-space-default space-7 from CS; heading-to-body space-4 |
| Surface | canvas; plain |
| Border | none or optional weak divider from CS that does not merge into one card |
| Radius | 0 |
| Color | text-primary |
| Desktop / tablet / mobile | Compact titled text; not oversized |
| Interaction | None |
| Accessibility | Understandable without icons |
| Claim boundary | Technical named controls; not AVG, SOC 2, ISO, SLA, or absolute security |
| Status | Required; not merged with access (`PW9-OD-007`) |
| Prohibited | Shield; badge; lock; compliance green; legal seal |
| PW-13 | Text/list; no icon set |
| PW-12 | `PW11-VAL-008` |

---

## 26. Access and Honest-Stop Design

| Contract | Value |
| --- | --- |
| Section ID | REGION-012 |
| Semantic | `section` |
| Design role | Maturity close; existing-account utility; dignified stop |
| Frozen copy | H2 `PW6-ACCESS-007`; status `PW6-ACCESS-008`; utility `PW6-ACCESS-009`; stop `PW6-ACCESS-010` |
| Container | `OWNER FROZEN` reading column inside content-wide close (`PW11-OD-004`) |
| Width | not a tiny floating card; not a full-bleed banner |
| Typography | TYPE-010 H2; body-default; utility TYPE-009 for `Inloggen` |
| Spacing | panel-padding 1.25rem; status → Inloggen → stop |
| Surface | `#FFFFFF`; the only recommended enclosed panel |
| Border | 1px `border-strong` `#8A8376` |
| Radius | radius-panel 0.50rem |
| Color | text-primary on white; link teal + underline |
| Desktop | Compact panel after trust |
| Tablet | Same |
| Mobile | Full reading width minus page-inline; still one panel |
| Interaction | `Inloggen` is a real `/login` utility; not filled |
| Accessibility | 44×44 preferred; stop is not `role="alert"` |
| Claim boundary | No new account; reading is valid; Sign in ≠ join |
| Status | Required; not removable |
| Prohibited | Error red; signup form; waitlist; conversion banner; disabled Register |
| PW-13 | Native section + link; no form |
| PW-12 | `PW11-VAL-009`; `PW11-VAL-031` |

---

## 27. Footer Design

| Contract | Value |
| --- | --- |
| Section ID | REGION-013 |
| Semantic | `footer` / contentinfo |
| Design role | Identity close |
| Frozen copy | `ZyntixAI` (`PW6-COPY-031`) |
| Container | content-wide |
| Width | max 64rem |
| Typography | TYPE-011 footer 0.9375rem / 1.4 / 600 |
| Spacing | space-4 above divider; space-5 block |
| Surface | canvas |
| Border | top `border-subtle` or `border-default` decorative |
| Radius | 0 |
| Color | text-muted `#5C574E` on canvas (analytical 6.36:1; not a PASS) |
| Desktop / tablet / mobile | Compact; wraps; intentional short close |
| Interaction | No links unless later externally gated |
| Accessibility | Contentinfo; identity text survives forced colours |
| Claim boundary | Name only; not legal entity |
| Status | Required identity; copyright `EXTERNALLY GATED` |
| Prohibited | Mega-footer; dead legal links; social; footer-only Sign in |
| PW-13 | Route-scoped footer; do not invent legal |
| PW-12 | `PW11-VAL-032` |

---

## 28. Desktop High-Fidelity Specification

Canvas `PW11-VIEW-001` / `002` (1440 / 1280). Outer inline 1.50rem. Content-wide 64rem centred. Reading column 40rem start-aligned within that wide container (not a second content column). Header uses a 1px `border-default` separator (`PW11-OD-002`). Brand + four labels + `Inloggen` on one row while they fit. Hero begins with space-8 top (`PW11-OD-007`); not a viewport-height hero and not extra luxury +space-4. H1 wraps naturally (`PW11-OD-006`). Layer B directly under support. Editorial sections in the reading column. Today band uses reading-column width (`PW11-OD-003`). Course Seller divider uses copy-measure (`PW11-OD-005`). Access enclosed panel uses reading-column width (`PW11-OD-004`). Footer identity in content-wide with a short top rule. Extra 1440 space is empty margin, not a card rail. Focus 2px+2px with space-3 clearance. No horizontal overflow. Adjacent pairs that must remain visually attached: H1+support; Layer B two sentences; Today body+qualifier; CS body+qualifier; access status+Inloggen+stop. These canvases are not browser-tested.

---

## 29. Compact Desktop Specification

Same composition as §28, including 1px header separator, natural H1 wrapping, reading-column Today and access, and copy-measure Course Seller divider. Slightly less outer margin. Type scale unchanged unless content-fit requires nav wrap. Full navigation only while it fits. No new cluster. No condensed “marketing” variant. Not browser-tested.

---

## 30. Tablet Specification

Canvases 1024 and 768. One reading column. Navigation: full while fit; otherwise wrap-then-disclose labelled `Navigatie` (`PW11-OD-001`) with `Inloggen` outside and separately recognizable as utility. Type: heading-2 1.25rem at 768. H1 wraps naturally. Surfaces: still one enclosed access panel at reading-column alignment within available safe width. Today remains a quiet reading-column band, not a second card. Course Seller divider remains copy-measure aligned. No carousel. No supporting column. Landscape tablet does not restore a screenshot slot. Not browser-tested.

---

## 31. Mobile Specification

Canvas 390. One column. Display-1 1.625rem. Nav disclosed with visible label `Navigatie` (`PW11-OD-001`); `Inloggen` visible as utility. H1 wraps naturally; no forced line break. Major section space compresses toward space-6. Today and access use available safe width while retaining reading-column meaning and hierarchy. Qualifiers remain in-section. Footer compact. No sticky acquisition bar. No disappearing Layer B. No horizontal overflow. Not browser-tested.

---

## 32. Narrow-Mobile and Zoom Specification

320 CSS px: page-inline 1.00rem; H1 wraps naturally (`PW11-OD-006`); support wraps `verantwoordelijkheden`; `Navigatie` remains understandable (`PW11-OD-001`); `Gesloten bèta` may shorten to `Bèta`; both Layer B sentences remain; access complete; no core horizontal scroll; focus not clipped; 1px header separator is not the sole boundary or focus indication. Checked design-contract arithmetic is in §14 (not a browser measurement).

200% zoom: same DOM; disclosure may engage with label `Navigatie`; H1 wraps naturally; no lost qualifier; skip link usable; no sticky overlay covering targets; no layout depends on a fixed line break.

Text-spacing override: heading-to-body and qualifier attachment must survive; do not rely on tight absolute positioning or forced H1 breaks.

These states are not browser-tested.

---

## 33. Interaction-State Specification

No state is implemented or tested.

| ID | State | Appearance contract |
| --- | --- | --- |
| PW11-STATE-001 | Default | Warm paper; frozen copy; one enclosed panel |
| PW11-STATE-002 | Hover | Extra underline on links; colour darkens; hover never sole cue |
| PW11-STATE-003 | Active | Darker teal `#123833`; still a link |
| PW11-STATE-004 | Focus-visible | 2px outline + 2px offset `#1F5C57`; not clipped |
| PW11-STATE-005 | Visited body link | Same as default on this static page |
| PW11-STATE-006 | Current in-page section | Later only; never colour-only; destinations not live |
| PW11-STATE-007 | Disclosure collapsed | Trigger visible as `Navigatie`; in-page links not shown |
| PW11-STATE-008 | Disclosure expanded | Native expanded/collapsed communicated by visible `Navigatie` plus native semantics; in-flow list on canvas; page usable; no trap; not colour-only |
| PW11-STATE-009 | Skip hidden | Clipped until focus |
| PW11-STATE-010 | Skip focused | Visible Dutch control |
| PW11-STATE-011 | Anchor target focused | Visible H2; not under a sticky header |
| PW11-STATE-012 | Reduced motion | No required motion |
| PW11-STATE-013 | No motion | Meaning complete at 0ms |
| PW11-STATE-014 | Forced colours | System text, links, focus, essential border |
| PW11-STATE-015 | High contrast / forced | Status remains text |
| PW11-STATE-016 | 200% zoom | Same truth; possible disclosure |
| PW11-STATE-017 | Text spacing | Qualifiers attached |
| PW11-STATE-018 | No JavaScript | Core, skip, Sign in, disclosure fallback, access complete |
| PW11-STATE-019 | Missing destination | Do not render the link (`PW8-ERROR-002`) |
| PW11-STATE-020 | Authenticated visitor | Desired `/` is not this marketing page; not designed as an auth variant |
| PW11-STATE-021 | Unauthenticated visitor | This is the desired public page; current `/` still redirects to `/login` |
| PW11-STATE-022 | Legal destination omitted | Do not invent footer legal links |
| PW11-STATE-023 | AI copy inactive | Conditional sentence not shown |
| PW11-STATE-024 | Optional content omitted | No screenshot slot; page remains complete |

---

## 34. Responsive Transformation Rules

| ID | Rule |
| --- | --- |
| PW11-RESP-001 | Same DOM and content truth on every canvas |
| PW11-RESP-002 | One-column mobile layout |
| PW11-RESP-003 | No horizontal core scrolling |
| PW11-RESP-004 | No desktop-only product truth |
| PW11-RESP-005 | No mobile-only product claim |
| PW11-RESP-006 | Closed-beta status remains early |
| PW11-RESP-007 | Qualifiers remain attached |
| PW11-RESP-008 | Today limitation remains visible |
| PW11-RESP-009 | Course Seller qualifier remains visible |
| PW11-RESP-010 | Sign in remains utility |
| PW11-RESP-011 | Honest stop remains dignified and complete |
| PW11-RESP-012 | No sticky mobile acquisition bar |
| PW11-RESP-013 | No content removed solely to look cleaner |
| PW11-RESP-014 | No fixed-height content sections |
| PW11-RESP-015 | No viewport-height hero |
| PW11-RESP-016 | No horizontal target-group comparison |
| PW11-RESP-017 | No carousel |
| PW11-RESP-018 | Disclosure is content-fit driven, not device-identity driven |

May compress: spacing, H1 size, navigation presentation, panel padding, section separation. Must not be removed: maturity, qualifier, honest stop, existing-account context, product-scope boundaries. Display-1 1.625rem applies at mobile/narrow canvases (390/320), not automatically at 768. 768 remains tablet portrait with heading-2 1.25rem and H1 still at the desktop 2.00rem role until the mobile canvas (`PW11-VIEW-004` vs `PW11-VIEW-005`).

---

## 35. Accessibility-by-Design Review

Do not claim accessibility PASS or WCAG conformance.

| ID | Requirement | Class |
| --- | --- | --- |
| PW11-A11Y-001 | One H1 | `UPSTREAM FROZEN` |
| PW11-A11Y-002 | Logical H2s matching frozen titles | `UPSTREAM FROZEN` |
| PW11-A11Y-003 | Landmarks: banner, main, contentinfo, named nav | `UPSTREAM FROZEN` |
| PW11-A11Y-004 | Skip link `Ga naar de hoofdinhoud` to `main` | `UPSTREAM FROZEN` |
| PW11-A11Y-005 | Text-labelled disclosure | `UPSTREAM FROZEN` |
| PW11-A11Y-006 | Visible 2px+2px focus | `UPSTREAM FROZEN` |
| PW11-A11Y-007 | Focus clearance space-3 | `HIGH-FIDELITY DERIVATION` |
| PW11-A11Y-008 | Keyboard order equals DOM order | `UPSTREAM FROZEN` |
| PW11-A11Y-009 | Descriptive visible names | `UPSTREAM FROZEN` |
| PW11-A11Y-010 | Colour-independent state | `UPSTREAM FROZEN` |
| PW11-A11Y-011 | Qualifier not below ~0.9375rem | `UPSTREAM FROZEN` |
| PW11-A11Y-012 | Body line-height 1.55 | `UPSTREAM FROZEN` |
| PW11-A11Y-013 | Content at 200% zoom | `VALIDATION REQUIRED` |
| PW11-A11Y-014 | Text-spacing resilience | `VALIDATION REQUIRED` |
| PW11-A11Y-015 | Forced-colours resilience | `VALIDATION REQUIRED` |
| PW11-A11Y-016 | Reduced-motion equivalence | `UPSTREAM FROZEN` |
| PW11-A11Y-017 | Target floor 24×24 | `UPSTREAM FROZEN` |
| PW11-A11Y-018 | Preferred target 44×44 | `UPSTREAM FROZEN` |
| PW11-A11Y-019 | No hover-only truth | `UPSTREAM FROZEN` |
| PW11-A11Y-020 | No icon-only truth | `UPSTREAM FROZEN` |
| PW11-A11Y-021 | No low-contrast required text | `VALIDATION REQUIRED` |
| PW11-A11Y-022 | No fake disabled controls | `UPSTREAM FROZEN` |
| PW11-A11Y-023 | Disclosure name, role, value, and expanded/collapsed state are text plus native semantics, not colour-only | `UPSTREAM FROZEN` `PW8-OD-006`; `PW11-OD-001` |
| PW11-A11Y-024 | Escape closes only if an enhanced overlay exists; baseline is non-modal inline (`PW8-OD-006`) | `UPSTREAM FROZEN` |
| PW11-A11Y-025 | No-JavaScript core, skip, Sign in, access, honest stop, and disclosure fallback remain complete | `UPSTREAM FROZEN` |
| PW11-A11Y-026 | Omitted optional content leaves no empty heading, screenshot slot, or broken spacing | `UPSTREAM FROZEN` |
| PW11-A11Y-027 | Future public document language is Dutch (`PW8-OD-002`); not a current visual token; do not mutate authenticated `lang` | `UPSTREAM FROZEN`; PW-13 |
| PW11-A11Y-028 | Reflow: one-column at 320 CSS px; no 2D core scrolling in the design contract | `UPSTREAM FROZEN` `PW8-OD-012` |

Every material A11Y assumption is planned in `PW11-VAL-*`. Do not claim accessibility PASS or WCAG conformance.

---

## 36. Product-Truth Review

The design must not visually imply general availability, open registration, free access, trial, pricing, public demo, waitlist, contact, generative or autonomous AI, any-provider AI, Stripe, a complete four-target-group product, an LMS, a public catalogue, guaranteed outcomes, legal compliance, certification, absolute security, SLA, traction, testimonials, logos, or scarcity.

Copy stays inside PW-1. Visual conventions that would create a false claim (`PROHIBITED`): pill beta, filled Sign in, dashboard screenshot, certification chrome, Course Seller edition card, chatbot orb, waitlist form, customer-logo strip.

---

## 37. Premium-Quality Review

Premium here means: clear hierarchy; controlled line length; consistent start alignment; intentional whitespace; one enclosed panel; restrained accent; precise type; coherent rhythm; honest maturity; no feature grid; no fake social proof; no overbuilt nav; no overprominent Sign in; no claim beyond evidence. Empty luxury space at 1440 fails this test (`PW11-RSK-015`).

---

## 38. Anti-Pattern Register

| ID | Pattern | Why prohibited |
| --- | --- | --- |
| PW11-ANTI-001 | Generic AI-startup template | Interchangeable product reading |
| PW11-ANTI-002 | Chatbot landing | False identity |
| PW11-ANTI-003 | Coaching funnel | Lifestyle/CS-primary |
| PW11-ANTI-004 | LMS homepage | Catalogue/edition |
| PW11-ANTI-005 | Enterprise dashboard | AppShell clone |
| PW11-ANTI-006 | Coming-soon page | Fake launch |
| PW11-ANTI-007 | Waitlist page | False access route |
| PW11-ANTI-008 | Free-trial SaaS template | Open signup implication |
| PW11-ANTI-009 | Screenshot hero | HOLD; missing-UI |
| PW11-ANTI-010 | Feature-card grid | Extra clusters |
| PW11-ANTI-011 | Four TG cards | Deferred audiences as editions |
| PW11-ANTI-012 | Testimonial / logo strip | Invented traction |
| PW11-ANTI-013 | Certification badges | Legal overclaim |
| PW11-ANTI-014 | Pill-heavy UI | Scarcity/marketing |
| PW11-ANTI-015 | Glass / heavy shadow | Floating-card theatre |
| PW11-ANTI-016 | Gradient brand crutch | Neon-AI |
| PW11-ANTI-017 | Display webfont | Reopens PW-10 |
| PW11-ANTI-018 | Dark theme toggle | Reopens PW-10 |
| PW11-ANTI-019 | Sticky mobile CTA bar | Acquisition pressure |
| PW11-ANTI-020 | Icon-only hamburger | Breaks OD-019 |

---

## 39. Component-to-Design Mapping

| ID | Component | Region | Tokens | Downstream |
| --- | --- | --- | --- | --- |
| PW11-COMP-001 | Skip link | REGION-001 | TYPE-013; COLOR-007 | PW-13; do not restyle AppShell |
| PW11-COMP-002 | Header | REGION-002 | SURF-002; GEO-005 | PW-13 |
| PW11-COMP-003 | Wordmark | REGION-002 | TYPE-001 | PW-13; never `/home` |
| PW11-COMP-004 | Nav list | REGION-003 | TYPE-002 | Destinations later |
| PW11-COMP-005 | Nav link | REGION-003 | COLOR-005; underline on hover | PW-13 |
| PW11-COMP-006 | Sign in utility | REGION-004 | TYPE-009; 44px pref | `/login` auth-owned |
| PW11-COMP-007 | Disclosure trigger | REGION-014 | TYPE-012; `Navigatie` (`PW11-OD-001`) | PW-13 |
| PW11-COMP-008 | Disclosure list | REGION-014 | in-flow | PW-13 |
| PW11-COMP-009 | Hero | REGION-005 | TYPE-003/004 | PW-13 |
| PW11-COMP-010 | Beta status | REGION-006 | TYPE-005 | PW-13 |
| PW11-COMP-011 | Editorial section | REGION-007/008 | TYPE-006/007 | PW-13 |
| PW11-COMP-012 | Today band | REGION-009 | SURF-006; OD-003 | PW-13 |
| PW11-COMP-013 | CS section | REGION-010 | SURF-007; OD-005 | PW-13 |
| PW11-COMP-014 | Trust block | REGION-011 | SURF-008 | PW-13 |
| PW11-COMP-015 | Access panel | REGION-012 | SURF-009; OD-004 | PW-13 |
| PW11-COMP-016 | Footer | REGION-013 | SURF-010 | PW-13 |
| PW11-COMP-017 | Body link | in copy | underline + teal | PW-13 |
| PW11-COMP-018 | Focus ring | all controls | 2px+2px | PW-13 |

---

## 40. Design-State Matrix

See `PW11-STATE-001`–`024`. Additional matrix notes: unauthenticated desired public page is this design; current architecture still redirects `/` to `/login` and is not described as changed. Authenticated arrival must not be held on marketing (`PW-4` dual-use). Missing anchors omit the link. Legal footer omitted until authority.

---

## 41. Risks

| ID | Severity | Trigger | Impact | Mitigation | Downstream |
| --- | --- | --- | --- | --- | --- |
| PW11-RSK-001 | P1 | Too sparse | Product unexplained | Restrained but complete copy; no empty hero; space-8 is spacing not vh-hero (`PW11-OD-007`) | PW-12 |
| PW11-RSK-002 | P1 | Unbounded editorial | Dump reading | Eight-cluster budget; major rhythm | PW-12 |
| PW11-RSK-003 | P0 | H1 as guaranteed outcome | PW-1 breach | H1 is direction, not result; natural wrap does not rewrite copy (`PW11-OD-006`) | PW-12 |
| PW11-RSK-004 | P1 | Beta as exclusivity | Dark pattern | Inline factual sentences | PW-12 |
| PW11-RSK-005 | P0 | Sign in as acquisition | False open signup | Utility underline; not filled | PW-12 |
| PW11-RSK-006 | P1 | Today defines the product | Proof overclaim | Qualifier; quieter band; reading-column width (`PW11-OD-003`) | PW-12 |
| PW11-RSK-007 | P1 | CS takes the brand | LMS/four-TG | Secondary copy-measure divider (`PW11-OD-005`); qualifier | PW-12 |
| PW11-RSK-008 | P1 | Trust as certification | Legal overclaim | Plain text; no shields | PW-12 |
| PW11-RSK-009 | P1 | Access as error or conversion | Broken-site or signup reading | Calm reading-column panel (`PW11-OD-004`); no alert red; no extra buttons | PW-12 |
| PW11-RSK-010 | P1 | Warm paper as lifestyle | Coaching brand | Operational type; CS secondary | PW-12 |
| PW11-RSK-011 | P1 | Teal as generic SaaS | Interchangeable | Accent only links/focus | PW-12 |
| PW11-RSK-012 | P1 | Excessive muted text | Lost qualifiers | Qualifiers use secondary | PW-12 |
| PW11-RSK-013 | P1 | Decorative borders as meaning | Invisible grouping | Essential enclosure = strong; header 1px is grouping only (`PW11-OD-002`) | PW-12 |
| PW11-RSK-014 | P1 | Qualifier demotion | Truth dropped | 0.9375rem floor; attached | PW-12 |
| PW11-RSK-015 | P1 | 1440 empty luxury | Unfinished premium | Margin, not a third column; hero top is space-8 not extra +space-4 (`PW11-OD-007`) | PW-12 |
| PW11-RSK-016 | P1 | 320 hierarchy loss | Unreadable | Natural wrap (`PW11-OD-006`); `Navigatie` disclosure (`PW11-OD-001`); no clip | PW-12 |
| PW11-RSK-017 | P1 | 200% nav break | Lost exploration | Fit-or-disclose; label `Navigatie` remains understandable (`PW11-OD-001`) | PW-12 |
| PW11-RSK-018 | P1 | Disclosure hides maturity | Beta omitted | Layer B not inside menu-only; `Navigatie` is chrome, not a maturity substitute | PW-12 |
| PW11-RSK-019 | P1 | Current-nav colour-only | 1.4.1 risk | Destinations not live; later cue | PW-13 |
| PW11-RSK-020 | P1 | Text-first looks unfinished | Stub reading | Complete identity footer; rhythm | PW-12 |
| PW11-RSK-021 | P1 | System font looks generic | Weak character | Weight 700/600; measure | PW-12 |
| PW11-RSK-022 | P0 | Spec mistaken for implementation | Premature CSS | Formula in header; owner freeze ≠ CSS | Review |
| PW11-RSK-023 | P0 | Public tokens leak to Home | Auth regression | Route-scoped; no `:root` | PW-13 |
| PW11-RSK-024 | P1 | Owner freeze treated as validation | False PASS | OD ≠ VAL; freeze closes selection only | PW-12 |
| PW11-RSK-025 | P1 | Review canvases treated as CSS breakpoints | Framework lock-in | `PW7-OD-014` | PW-13 |
| PW11-RSK-026 | P1 | Optional AI state activated | Chatbot centre | Remain inactive | Owner |
| PW11-RSK-027 | P2 | Implementer treats 72ch as a box wider than 40rem | Horizontal overflow or competing column | GEO-003 is the hard max; GEO-004 is preferred line length inside it | PW-13 |
| PW11-RSK-028 | P1 | 14 REGION IDs treated as 14 marketing clusters | Extra decoration or empty slots | §12 count reconciliation; eight clusters / ten SEC remain | PW-13 |

---

## 42. Validation Plan

Every record: `PLANNED — NOT EXECUTED`. Every threshold: `PROPOSED — NOT ACHIEVED`. Owner freeze does not execute validation. Records test the selected owner-frozen package, not undecided alternatives.

| ID | Planned validation | Method | Selected package |
| --- | --- | --- | --- |
| PW11-VAL-001 | Five-second comprehension | Expert; later visitor | Frozen Route A2; space-8 hero top |
| PW11-VAL-002 | Operator-primary recognition | Expert | Operator story before CS |
| PW11-VAL-003 | Chatbot misinterpretation | Expert | No orb; AI inactive |
| PW11-VAL-004 | Closed-beta comprehension | Expert | Early Layer B |
| PW11-VAL-005 | Sign in versus signup | Expert | Utility `Inloggen` |
| PW11-VAL-006 | Today-as-example | Expert | Reading-column band (`PW11-OD-003`) |
| PW11-VAL-007 | CS relevance versus brand | Expert | Copy-measure divider (`PW11-OD-005`) |
| PW11-VAL-008 | Trust-copy interpretation | Expert | Plain named controls |
| PW11-VAL-009 | Honest-stop dignity | Expert | Reading-column access (`PW11-OD-004`) |
| PW11-VAL-010 | Desktop scan path | Expert | space-8 top; not vh-hero (`PW11-OD-007`) |
| PW11-VAL-011 | Tablet navigation fit | Later browser | `Navigatie` when disclosed (`PW11-OD-001`) |
| PW11-VAL-012 | Mobile reading order | Later browser | Same DOM truth |
| PW11-VAL-013 | 320 CSS px | Later browser | Natural H1 wrap; complete content |
| PW11-VAL-014 | 200% zoom | Later browser | `Navigatie` understandable; natural H1 wrap |
| PW11-VAL-015 | Text-spacing overrides | Later browser | No forced H1 break |
| PW11-VAL-016 | Keyboard navigation | Later keyboard | Disclosure keyboard behaviour |
| PW11-VAL-017 | Focus visibility | Later keyboard | 2px+2px; separator not sole cue |
| PW11-VAL-018 | Forced colours | Later browser | System text, links, focus, essential border |
| PW11-VAL-019 | Reduced motion | Later browser | `Navigatie` usable at 0ms |
| PW11-VAL-020 | Line length | Expert + later browser | copy-measure |
| PW11-VAL-021 | Type wrapping | Later browser | Natural H1 wrap (`PW11-OD-006`) |
| PW11-VAL-022 | Rendered contrast | Instrumented | Including 1px header separator |
| PW11-VAL-023 | Target sizes | Instrumented | `Navigatie` and `Inloggen` |
| PW11-VAL-024 | Disclosure behaviour | Later browser | Label `Navigatie`; non-modal inline |
| PW11-VAL-025 | No-JavaScript behaviour | Later browser | Native fallback; `Navigatie` or headings |
| PW11-VAL-026 | Optional-section removal | Review | CS removable; Today removable as band |
| PW11-VAL-027 | Cross-browser rendering | Later lab | System font wrap |
| PW11-VAL-028 | Public/auth visual isolation | Diff + review | Route-scoped; AppShell untouched |
| PW11-VAL-029 | Header fit threshold | Later measurement | 1px separator; fit-or-disclose |
| PW11-VAL-030 | Today-band perceivability | Expert + later browser | Reading-column quiet band |
| PW11-VAL-031 | Access not error/acquisition | Expert | Reading-column panel |
| PW11-VAL-032 | Footer completeness | Expert | Identity-only |

---

## 43. Open Questions

Product truth, frozen copy, wireframes, and PW-10 visual direction are not open PW-11 questions. The seven high-fidelity assembly questions are owner-frozen. Implementation, validation, legal, and brand-asset conditions remain separately gated.

| ID | Question | Class | Status |
| --- | --- | --- | --- |
| PW11-Q-001 | Disclosure trigger copy | Owner HF | `RESOLVED — OWNER FROZEN` `Navigatie` (`PW11-OD-001`). Disclosure implementation remains PW-13; behaviour validation remains PW-12/PW-13. |
| PW11-Q-002 | Header rule stroke | Owner HF | `RESOLVED — OWNER FROZEN` 1px (`PW11-OD-002`). Rendered contrast remains PW-12. |
| PW11-Q-003 | Today band width | Owner HF | `RESOLVED — OWNER FROZEN` reading column (`PW11-OD-003`). Hierarchy validation remains PW-12. |
| PW11-Q-004 | Access panel width | Owner HF | `RESOLVED — OWNER FROZEN` reading column (`PW11-OD-004`). Interpretation validation remains PW-12. |
| PW11-Q-005 | CS divider span | Owner HF | `RESOLVED — OWNER FROZEN` copy-measure (`PW11-OD-005`). Secondary-weight validation remains PW-12. |
| PW11-Q-006 | H1 wrap preference | Owner HF | `RESOLVED — OWNER FROZEN` natural wrap (`PW11-OD-006`). Rendered wrapping remains PW-12/PW-13. |
| PW11-Q-007 | 1440 hero top space | Owner HF | `RESOLVED — OWNER FROZEN` space-8 (`PW11-OD-007`). Whitespace balance remains PW-12. |
| PW11-Q-008 | Rendered contrast | PW-12 | `OPEN — PW-12` |
| PW11-Q-009 | Nav fit measurement | PW-12/13 | `PARTIALLY RESOLVED — IMPLEMENTATION OR VALIDATION REMAINS` |
| PW11-Q-010 | Isolation CSS form | PW-13 | `OPEN — PW-13` |
| PW11-Q-011 | Legal footer | External | `EXTERNALLY GATED` |
| PW11-Q-012 | Favicon / brand asset | External | `EXTERNALLY GATED` |
| PW11-Q-013 | Optional visited style | Visual later | `PARTIALLY RESOLVED — IMPLEMENTATION OR VALIDATION REMAINS` same-as-default |
| PW11-Q-014 | Inactive AI display | Frozen inactive | `RESOLVED BY UPSTREAM` not shown |

Question-status counts: `RESOLVED — OWNER FROZEN` 7 (`PW11-Q-001`–`007`); `RESOLVED BY UPSTREAM` 1 (`PW11-Q-014`); `PARTIALLY RESOLVED — IMPLEMENTATION OR VALIDATION REMAINS` 2 (`PW11-Q-009`, `PW11-Q-013`); `OPEN — PW-12` 1 (`PW11-Q-008`); `OPEN — PW-13` 1 (`PW11-Q-010`); `EXTERNALLY GATED` 2 (`PW11-Q-011`, `PW11-Q-012`). Open owner-assembly questions: 0.

---

## 44. Owner Decisions

Existing frozen PW-10 choices are not reopened. Historical establishment status for every row was `OPEN — OWNER DECISION REQUIRED`. Current status for every row: `RESOLVED — OWNER FROZEN`. Selected values are the establishment conservative recommendations. Decision register: total 7; fully resolved 7; partially resolved 0; open owner decisions 0.

| ID | Question | Selected | Rejected alternatives | Status | Viewports | Upstream | Downstream remaining |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW11-OD-001 | Disclosure visible label | `Navigatie` | `Menu`; other Dutch chrome; icon-only hamburger | `RESOLVED — OWNER FROZEN` | disclosure canvases | `PW8-NAME-009`; `PW10-OD-019` | PW-12/13 behaviour and mechanism |
| PW11-OD-002 | Header separator stroke | 1px `border-default` | 2px; omit (omit remains `PROHIBITED`) | `RESOLVED — OWNER FROZEN` | all | `PW10-Q-015`; `PW10-SURF-002`; `PW10-BORD-002` | PW-12 rendered contrast |
| PW11-OD-003 | Today band width | reading column | content-wide; full-bleed | `RESOLVED — OWNER FROZEN` | desktop+; mobile uses safe width | `PW10-OD-010` | PW-12 hierarchy |
| PW11-OD-004 | Access panel max width | reading column | max 36rem; content-wide | `RESOLVED — OWNER FROZEN` | desktop+; mobile uses safe width | `PW10-OD-013` | PW-12 interpretation |
| PW11-OD-005 | CS divider span | copy-measure | content-wide / viewport span | `RESOLVED — OWNER FROZEN` | desktop+ | `PW10-OD-011` | PW-12 secondary weight |
| PW11-OD-006 | H1 wrap | natural wrap | forced break after comma | `RESOLVED — OWNER FROZEN` | all; especially 320–768 and zoom | `PW10-OD-007` | PW-12/13 rendered wrap |
| PW11-OD-007 | 1440 hero top | space-8 | space-8+space-4; vh-hero; vertical centering | `RESOLVED — OWNER FROZEN` | 1440 | `PW10-SPACE-015` | PW-12 whitespace balance |

Accent in headings: not an owner decision; `PROHIBITED` by `PW10-OD-005`. Repeated Sign in: header + access only; footer Sign in remains prohibited. Inactive AI state remains not shown. Optional motion remains later-gated, not required. Omitting the header separator remains `PROHIBITED`. An implementation or validation condition does not reopen these owner decisions.

---

## 45. Traceability

Missing upstream IDs: 0. Invalid uses: 0. HOLD/PROHIBIT used as positive claims: 0. Orphan material design decisions: 0.

| ID | Maps | Upstream |
| --- | --- | --- |
| PW11-MAP-001 | Header | `PW7-OD-004`; `PW9-ZONE-001`; `PW10-OD-003`; `PW10-SURF-002`; `PW11-OD-002` |
| PW11-MAP-002 | Navigation | `PW6-OD-003`; `PW6-NAV-006`; `PW6-NAV-002`; `PW6-NAV-007`; `PW6-NAV-004`; `PW7-NAV-001`; `PW7-NAV-002`; `PW9-OD-009`; `PW11-OD-001` |
| PW11-MAP-003 | Hero | `PW6-COPY-043`; `PW6-COPY-044`; `PW9-OD-004`; `PW10-OD-001`; `PW11-OD-006`; `PW11-OD-007` |
| PW11-MAP-004 | Closed beta | `PW6-COPY-045`; `PW7-BETA-003`; `PW10-OD-014` |
| PW11-MAP-005 | Value | `PW6-COPY-046`; `PW9-OD-003`; `PW9-SEC-005` |
| PW11-MAP-006 | Mechanism | `PW6-COPY-047`; `PW9-OD-003`; `PW9-SEC-006` |
| PW11-MAP-007 | Today | `PW6-PROOF-005`; `PW6-PROOF-006`; `PW6-PROOF-007`; `PW6-COPY-048`; `PW9-OD-005`; `PW10-OD-010`; `PW11-OD-003` |
| PW11-MAP-008 | Course Seller | `PW6-CS-009`; `PW6-CS-010`; `PW6-CS-011`; `PW8-OD-003`; `PW9-OD-006`; `PW10-OD-011`; `PW11-OD-005` |
| PW11-MAP-009 | Trust | `PW6-TRUST-007`; `PW6-TRUST-008`; `PW6-COPY-050`; `PW9-OD-007`; `PW10-OD-012` |
| PW11-MAP-010 | Access | `PW6-ACCESS-007`; `PW6-ACCESS-008`; `PW6-ACCESS-009`; `PW6-ACCESS-010`; `PW6-COPY-051`; `PW9-OD-007`; `PW10-OD-013`; `PW11-OD-004` |
| PW11-MAP-011 | Footer | `PW9-OD-011`; `PW10-OD-020` |
| PW11-MAP-012 | Desktop composition | `PW9-WF-001`; `PW9-MODEL-001`; `PW7-VIEW-008`; `PW11-OD-002`; `PW11-OD-003`; `PW11-OD-004`; `PW11-OD-005`; `PW11-OD-006`; `PW11-OD-007` |
| PW11-MAP-013 | Tablet composition | `PW9-WF-002`; `PW7-NAV-001`; `PW7-NAV-002`; `PW11-OD-001` |
| PW11-MAP-014 | Mobile composition | `PW9-WF-003`; `PW9-WF-004`; `PW9-OD-008`; `PW11-OD-001`; `PW11-OD-006` |
| PW11-MAP-015 | Focus states | `PW8-OD-007`; `PW8-FOCUS-003`; `PW10-OD-015` |
| PW11-MAP-016 | Disclosure | `PW8-OD-006`; `PW9-OD-009`; `PW10-OD-019`; `PW11-OD-001` |
| PW11-MAP-017 | Palette | `PW10-OD-004`; `PW10-OD-005`; `PW8-OD-010` |
| PW11-MAP-018 | Typography | `PW10-OD-006`; `PW10-OD-007`; `PW9-GRID-008`; `PW11-OD-006` |
| PW11-MAP-019 | Surfaces | `PW9-OD-008`; `PW10-SURF-001`; `PW10-SURF-006`; `PW10-SURF-007`; `PW10-SURF-009` |
| PW11-MAP-020 | Honest stop | `PW6-OD-011`; `PW8-COMP-015`; `PW3-MSG-014`; `PW11-OD-004` |
| PW11-MAP-021 | Owner-frozen HF assembly package | `PW11-OD-001`; `PW11-OD-002`; `PW11-OD-003`; `PW11-OD-004`; `PW11-OD-005`; `PW11-OD-006`; `PW11-OD-007`; `PW6-OD-002`; `PW6-COPY-043`; `PW6-COPY-044`; `PW6-COPY-045`; `PW6-COPY-046`; `PW6-COPY-047`; `PW6-COPY-048`; `PW6-COPY-049`; `PW6-COPY-050`; `PW6-COPY-051`; `PW6-NAV-002`; `PW6-NAV-004`; `PW6-NAV-006`; `PW6-NAV-007`; `PW6-PROOF-005`; `PW6-PROOF-006`; `PW6-PROOF-007`; `PW6-CS-009`; `PW6-CS-010`; `PW6-CS-011`; `PW6-TRUST-007`; `PW6-TRUST-008`; `PW6-ACCESS-007`; `PW6-ACCESS-008`; `PW6-ACCESS-009`; `PW6-ACCESS-010`; `PW7-OD-001`; `PW7-OD-002`; `PW7-OD-003`; `PW7-OD-004`; `PW7-OD-005`; `PW7-OD-006`; `PW7-OD-007`; `PW7-OD-008`; `PW7-OD-009`; `PW7-OD-010`; `PW7-OD-011`; `PW7-OD-012`; `PW7-OD-013`; `PW7-OD-014`; `PW8-OD-001`; `PW8-OD-002`; `PW8-OD-003`; `PW8-OD-004`; `PW8-OD-005`; `PW8-OD-006`; `PW8-OD-007`; `PW8-OD-008`; `PW8-OD-009`; `PW8-OD-010`; `PW8-OD-011`; `PW8-OD-012`; `PW8-OD-013`; `PW8-OD-014`; `PW8-OD-015`; `PW8-OD-016`; `PW9-OD-001`; `PW9-OD-002`; `PW9-OD-003`; `PW9-OD-004`; `PW9-OD-005`; `PW9-OD-006`; `PW9-OD-007`; `PW9-OD-008`; `PW9-OD-009`; `PW9-OD-010`; `PW9-OD-011`; `PW9-OD-012`; `PW10-OD-001`; `PW10-OD-002`; `PW10-OD-003`; `PW10-OD-004`; `PW10-OD-005`; `PW10-OD-006`; `PW10-OD-007`; `PW10-OD-008`; `PW10-OD-009`; `PW10-OD-010`; `PW10-OD-011`; `PW10-OD-012`; `PW10-OD-013`; `PW10-OD-014`; `PW10-OD-015`; `PW10-OD-016`; `PW10-OD-017`; `PW10-OD-018`; `PW10-OD-019`; `PW10-OD-020` |

---

## 46. PW-12 Handoff

PW-12 receives this owner-frozen high-fidelity specification (`PW11-OD-001`–`007`) and the validation plan. It must measure rendered contrast, fit, zoom, text-spacing, keyboard, forced-colours, and perception of the selected package. It must not treat analytical ratios as browser PASS. Owner freeze is not visitor validation. PW-12 is **not** started.

---

## 47. PW-13 Handoff

PW-13 receives implementable appearance contracts and route-scoped isolation strategy. It does not receive permission to edit AppShell, `globals.css`, Home, login, or root layout as a convenience. Destinations remain unimplemented until real IDs exist. PW-13 is **not** started.

---

## 48. Acceptance Gate

AND logic. Establishment remains historical evidence. Current owner-decision freeze may pass only if: all seven OD IDs are retained and `RESOLVED — OWNER FROZEN`; selected values match the authorization; Route A2, PW-9 composition, and PW-10 direction remain exact; geometry and viewports are reconciled; questions, risks, validations, traceability, and acceptance records are consistent; validations remain unexecuted; no implementation; no protected boundary changed. Independent review is still required. Publication readiness is not established.

| ID | Topic | Status |
| --- | --- | --- |
| PW11-ACC-001 | Primary design | `OWNER FROZEN HIGH-FIDELITY DESIGN DIRECTION — DOWNSTREAM REVIEW REQUIRED` |
| PW11-ACC-002 | Frozen copy | `PRESERVED EXACTLY` |
| PW11-ACC-003 | Wireframe order | `PRESERVED` |
| PW11-ACC-004 | Visual system | `NOT REOPENED` |
| PW11-ACC-005 | Desktop | `SPECIFIED — VALIDATION REQUIRED` |
| PW11-ACC-006 | Tablet | `SPECIFIED — VALIDATION REQUIRED` |
| PW11-ACC-007 | Mobile | `SPECIFIED — VALIDATION REQUIRED` |
| PW11-ACC-008 | Narrow / zoom | `SPECIFIED — VALIDATION REQUIRED` |
| PW11-ACC-009 | Regions | `CONTRACTED` |
| PW11-ACC-010 | Geometry | `OWNER FROZEN ASSEMBLY — VALIDATION REQUIRED` |
| PW11-ACC-011 | Typography | `APPLIED FROM PW-10`; H1 natural wrap frozen |
| PW11-ACC-012 | Colour | `MAPPED; NOT MEASURED` |
| PW11-ACC-013 | Surfaces | `BUDGET INTACT` |
| PW11-ACC-014 | Header/nav | `SPECIFIED; DISCLOSURE LABEL FROZEN` |
| PW11-ACC-015 | Accessibility-by-design | `SPECIFIED — NOT PASSED` |
| PW11-ACC-016 | Product truth | `REVIEWED — NO EXTRA CLAIM` |
| PW11-ACC-017 | Isolation | `STRATEGY UNCHANGED` |
| PW11-ACC-018 | Implementation | `NOT PERFORMED` |
| PW11-ACC-019 | Validation | `PLANNED — NOT EXECUTED` |
| PW11-ACC-020 | Traceability | `MAP 21; missing 0` |
| PW11-ACC-021 | Owner HF decisions | `PASS — PW11-OD OWNER HIGH-FIDELITY HOMEPAGE DESIGN DECISIONS FROZEN` |

---

## 49. Final Status

Historical establishment status (retained as evidence; superseded by §51):

```text
PW-11 HIGH-FIDELITY PUBLIC HOMEPAGE DESIGN ESTABLISHED — AWAITING OWNER DECISIONS
CONDITIONAL — PW-11 OWNER HIGH-FIDELITY DESIGN DECISIONS REQUIRED
```

Status after the 2026-09-16 owner freeze (historical; superseded as current by §52):

```text
PW-11 READY FOR INDEPENDENT HIGH-FIDELITY DESIGN REVIEW
PASS — PW11-OD OWNER HIGH-FIDELITY HOMEPAGE DESIGN DECISIONS FROZEN
```

Current status after PW-11-R1:

```text
PASS — PW-11-R1 INDEPENDENT HIGH-FIDELITY PUBLIC HOMEPAGE DESIGN REVIEW CLOSED WITH EVIDENCE
PW-11 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

Not used: `CLOSED WITH EVIDENCE — PW-11`; `IMPLEMENTATION READY`; `PUBLICATION READY`; `ACCESSIBILITY PASS`; `WCAG COMPLIANT`; `PRODUCTION VERIFIED`. Final verification and commit require separate authorization. Validations remain unexecuted. Implementation remains absent.

---

## 50. Evidence Appendix

### 50.1 Identifier census

| Family | From | To | Count |
| --- | --- | --- | --- |
| PW11-PRIN | 001 | 012 | 12 |
| PW11-DESIGN | 001 | 001 | 1 |
| PW11-VIEW | 001 | 009 | 9 |
| PW11-GEO | 001 | 030 | 30 |
| PW11-TYPE | 001 | 013 | 13 |
| PW11-COLOR | 001 | 020 | 20 |
| PW11-SURF | 001 | 011 | 11 |
| PW11-REGION | 001 | 014 | 14 |
| PW11-COMP | 001 | 018 | 18 |
| PW11-STATE | 001 | 024 | 24 |
| PW11-RESP | 001 | 016 | 16 |
| PW11-A11Y | 001 | 022 | 22 |
| PW11-ANTI | 001 | 020 | 20 |
| PW11-RSK | 001 | 026 | 26 |
| PW11-VAL | 001 | 032 | 32 |
| PW11-Q | 001 | 014 | 14 |
| PW11-OD | 001 | 007 | 7 |
| PW11-MAP | 001 | 020 | 20 |
| PW11-ACC | 001 | 020 | 20 |
| **Establishment total** |  |  | **329** |
| PW11-MAP (after OD freeze) | 001 | 021 | 21 |
| PW11-ACC (after OD freeze) | 001 | 021 | 21 |
| **Pre-R1 total** |  |  | **331** |
| PW11-RESP (after R1) | 001 | 018 | 18 |
| PW11-A11Y (after R1) | 001 | 028 | 28 |
| PW11-RSK (after R1) | 001 | 028 | 28 |
| **Main-register total after R1** |  |  | **341** |
| PW11-R1-FND (review family; not in main total) | 001 | 022 | 22 |

Establishment census 329 is unchanged as historical inventory. OD-freeze additions: `PW11-MAP-021`, `PW11-ACC-021`. R1 additions to the main register: `PW11-RESP-017`, `PW11-RESP-018`, `PW11-A11Y-023`–`028`, `PW11-RSK-027`, `PW11-RSK-028`. R1 findings are a separate family. No existing ID was renumbered.

### 50.2 What this file is not

Not CSS. Not a Figma file. Not a second wireframe. Not an implementation plan. Not visitor research. Not a contrast PASS.

### 50.3 Protected-boundary confirmation

No product file is changed by this phase. Authenticated Home remains closed. Public tokens remain later route-scoped.

### 50.4 Copy integrity confirmation

All active visible sentences are quoted from owner-frozen Route A2 records. Historical Routes A/B/C and hero alts are not used as visible PW-11 content. AI remains inactive. BOS remains omitted.

---

## 51. OD1 Owner High-Fidelity Homepage Design Decision Evidence

### 51.1 Decision authority

| Field | Value |
| --- | --- |
| Authority type | `EXPLICIT ZYNTIXAI OWNER HIGH-FIDELITY HOMEPAGE DESIGN DECISION` |
| Decision date | 2026-09-16 |
| Baseline HEAD | `b2ebfd0e8b2fb037d04fcc179f347f218df3ab9b` |
| Authorized file | `docs/phases/PW-11-high-fidelity-public-homepage-design.md` only |
| Decision scope | `PW11-OD-001` through `PW11-OD-007` |
| Owner authorization | The ZyntixAI owner approves all seven recommended conservative high-fidelity assembly defaults documented in the PW-11 establishment package. |

```text
OWNER HIGH-FIDELITY DESIGN FREEZE
≠ VISITOR VALIDATION
≠ IMPLEMENTATION
≠ ACCESSIBILITY PASS
≠ WCAG CONFORMANCE
≠ BROWSER VERIFICATION
≠ PRODUCTION VERIFICATION
≠ PUBLICATION READINESS
≠ DEPLOYMENT AUTHORITY
```

This freeze closes high-fidelity composition selection. It does not prove implementation or validation.

### 51.2 Selected values

This subsection restates §44. It is not a second definition register. The seven frozen decisions remain `PW11-OD-001` through `PW11-OD-007`.

| Frozen decision | Selected | Rejected / non-selected |
| --- | --- | --- |
| Disclosure visible label | `Navigatie` | `Menu`; other Dutch chrome; hamburger-only |
| Header separator | 1px header separator | 2px; omit |
| Today band width | Today band = reading-column width | content-wide; full-bleed |
| Access panel width | Access panel = reading-column width | max 36rem; content-wide |
| Course Seller divider | Course Seller divider = copy-measure width | wide-container / viewport span |
| H1 wrapping | Natural H1 wrapping | Forced line break after the comma |
| Large-desktop hero top | Large-desktop hero top = `space-8` | space-8+space-4; vh-hero; vertical centering |

Status of all seven: `RESOLVED — OWNER FROZEN`. No eighth owner decision was created.

### 51.3 Unchanged upstream authorities

PW-1 remains the public-truth ceiling. PW-6 Route A2 remains frozen copy. PW-7, PW-8, PW-9, and PW-10 remain responsive, accessibility/state, wireframe, and visual-system authorities. Authenticated Home remains closed. Eight clusters, ten regions, text-led hero, early closed beta, continuous value/mechanism, plain trust, identity-only footer, no supporting field, no screenshot slot, no feature-card grid, no deferred-target-group grid, no acquisition CTA row, no new destination.

### 51.4 Downstream conditions that remain unresolved

| Condition | Gate | Not an open owner decision |
| --- | --- | --- |
| Rendered contrast, zoom, text-spacing, keyboard, forced colours, perception | PW-12 | Yes |
| Disclosure mechanism, route-scoped CSS, destinations | PW-13 | Yes |
| Legal footer; brand asset / favicon | External | Yes |
| Visitor validation; browser verification; Production verification; publication | Later | Yes |

### 51.5 Implementation exclusions

No HTML, React, CSS, routes, AppShell restyle, `globals.css` mutation, `/login` restyle, `/home` restyle, assets, fonts, palette additions, dark theme, CTA, or destination activation is authorized by this freeze.

### 51.6 Protected-boundary confirmation

Authenticated Home closure `49cd5773976143139a154f9b8ddf36535a4dd914` and product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` remain closed. Current `/` is not mutated. This documentation freeze does not change product files.

### 51.7 Decision-register reconciliation

Total decisions: 7. Fully resolved: 7. Partially resolved: 0. Open owner decisions: 0.

### 51.8 Open-question reconciliation

`PW11-Q-001`–`007` are `RESOLVED — OWNER FROZEN`. `PW11-Q-008` remains `OPEN — PW-12`. `PW11-Q-009` and `PW11-Q-013` remain `PARTIALLY RESOLVED — IMPLEMENTATION OR VALIDATION REMAINS`. `PW11-Q-010` remains `OPEN — PW-13`. `PW11-Q-011` and `PW11-Q-012` remain `EXTERNALLY GATED`. `PW11-Q-014` remains `RESOLVED BY UPSTREAM`.

### 51.9 Risk reconciliation

Selection uncertainty for the seven assembly values is closed. Execution risks remain: Today dominance, CS prominence, access conversion appearance, H1 guarantee reading, 1440 whitespace, zoom/disclosure, header-separator contrast, and public/authenticated isolation. Owner approval does not prove safe implementation.

### 51.10 Verification evidence

Only this file is modified and remains untracked. No product, route, CSS, config, test, dependency, or asset change. Validations remain unexecuted. Route A2 copy is unchanged. PW-9 order is unchanged. PW-10 direction is unchanged.

### 51.11 Resulting gate and current PW-11 status

```text
PASS — PW11-OD OWNER HIGH-FIDELITY HOMEPAGE DESIGN DECISIONS FROZEN
PW-11 READY FOR INDEPENDENT HIGH-FIDELITY DESIGN REVIEW
```

Historical establishment status remains present in §2 and §49 as evidence. This subsection records the OD-freeze gate. Current R1 status is §52. PW-12 and PW-13 are not started.

---

## 52. R1 Independent High-Fidelity Public Homepage Design Review Evidence

Independent review of the untracked PW-11 candidate. Previous establishment PASS and owner-decision PASS were treated as hypotheses. This section does not implement the homepage, execute validation, or start PW-12 or PW-13.

### 52.1 Preflight

| Check | Result |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `b2ebfd0e8b2fb037d04fcc179f347f218df3ab9b` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Ahead / behind | 0 / 0 after `git fetch origin` |
| Staged | none |
| Unstaged tracked | none |
| Untracked | exactly `docs/phases/PW-11-high-fidelity-public-homepage-design.md` |
| Instruction files | No `AGENTS.md`, nested `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules` |
| Binding local instructions | B1-GATE.1 plus closed PW-0 through PW-10; no instruction conflict with this review |
| Pre-R1 census | 331 (PRIN 12, DESIGN 1, VIEW 9, GEO 30, TYPE 13, COLOR 20, SURF 11, REGION 14, COMP 18, STATE 24, RESP 16, A11Y 22, ANTI 20, RSK 26, VAL 32, Q 14, OD 7, MAP 21, ACC 21) |
| Destructive git | not used |

### 52.2 Authority and independence

R1 does not assume the establishment PASS or the owner-decision PASS proves design correctness. Owner approval proves selection of `PW11-OD-001` through `PW11-OD-007`, not rendered validation, accessibility PASS, implementation, or publication. Analytical contrast is not browser measurement. Documentation completeness is not implementation completeness. Frozen Route A2, PW-9 composition, PW-10 visual direction, and PW-1 product truth were not reopened.

### 52.3 Protected-boundary review

Authenticated Home remains closed at `49cd5773976143139a154f9b8ddf36535a4dd914` with product-code authority `d110b6e3da5c690b31a68a0b145b7b6521c10828`. PW-10 closure remains `b2ebfd0e8b2fb037d04fcc179f347f218df3ab9b`. No product file, route, CSS, test, config, dependency, or asset was changed. Current `/` remains unauthenticated redirect to `/login`. AppShell, `/login`, and `/home` were not restyled. Public tokens remain later route-scoped.

### 52.4 Owner-decision integrity

All seven IDs are present and `RESOLVED — OWNER FROZEN`. No eighth owner decision exists. Active text does not still await owner selection. Historical `OPEN — OWNER DECISION REQUIRED` in §44 and historical AWAITING strings in §49 remain labelled historical. Values remain: `Navigatie`; 1px `border-default`; Today reading-column; access reading-column; Course Seller copy-measure; natural H1 wrapping; large-desktop hero top `space-8`. Freeze is not treated as validation evidence.

### 52.5 Frozen-copy audit

Every required visible Route A2 sentence in §9.1 matches PW-6 character-for-character, including `programma’s` (U+2019), `Today`, Layer B, honest stop, and footer identity `ZyntixAI`. Required H1 and support match `PW6-COPY-043` and `PW6-COPY-044`. BOS remains omitted. `PW6-AI-002` remains inactive. Skip chrome `Ga naar de hoofdinhoud` remains PW-8, not PW-6. No frozen sentence was rewritten.

### 52.6 Composition review

One primary design `PW11-DESIGN-001`. Eight visual clusters and ten semantic regions remain. Fourteen `PW11-REGION-*` IDs implement those counts plus header chrome; they are not fourteen marketing clusters (`PW11-R1-FND-001` corrected). Same DOM, visual, reading, keyboard, and responsive order. Text-led hero; early closed beta; continuous value/mechanism; bounded Today band; secondary Course Seller divider; separate trust; separate access; identity-only footer. No supporting hero field, screenshot slot, feature-card grid, deferred-target-group grid, acquisition CTA row, mega-footer, pricing, public demo, waitlist, or fake destinations. Skipped decoration does not leave a reserved empty column.

### 52.7 Viewport reviews

**1440 / 1280.** Outer safe space; wide-container 64rem; reading column 40rem start-aligned; natural H1 wrap; hero top `space-8` (2.50rem), not viewport-height and not extra luxury; beta remains in the initial flow; extra width is margin, not a competing rail; Today and access use reading-column width; Course Seller uses copy-measure; one enclosed panel; identity footer closes the page. Full navigation is retained only while content fits. Not browser-tested.

**1024 / 768.** One primary reading flow. Wrap-then-disclose is content-fit, not device identity (`PW11-RESP-018`). `Inloggen` remains separately recognizable. Header separator remains structural and quiet. H1 remains the 2.00rem desktop role at 768; 1.625rem applies at 390/320 (`PW11-R1-FND-013` corrected). Not browser-tested. Content-fit threshold remains PW-12.

**390 / 320 / 200% / text-spacing / landscape mobile.** One column. `Navigatie` remains visible text. Maturity is not menu-only. Qualifiers and honest stop remain. Access uses safe available width with the §14 arithmetic contract. No sticky acquisition bar. No fixed section heights. No viewport-height hero. No content removed for cleanliness. Design-contract 320 arithmetic is internally consistent; it is not a measured browser result.

### 52.8 Geometry review

Frozen PW-10 spacing is reused. No parallel spacing scale. Width-role precedence is now explicit: reading column is the hard max box; copy-measure is preferred line length inside it (`PW11-R1-FND-002`). Header padding is inside content-wide and is not stacked onto viewport page-inline (`PW11-R1-FND-003`). Today and access share the reading-column width role without merging regions. Course Seller divider cannot exceed the reading column. 320 inner access width is about 246 CSS px at a 16px root; 44px targets and 2+2 focus fit (`PW11-R1-FND-010`). No negative margins. No fixed content heights. No geometry depends on one exact system-font rendering.

### 52.9 Typography review

System-first sans only. One semantic H1. Qualifier floor 0.9375rem. Essential qualifiers use `text-secondary`. Nav and `Inloggen` remain distinct. Disclosure trigger sizes match TYPE-002 (`PW11-R1-FND-006`). Wordmark remains text-first. No letter-spacing that damages Dutch. Canvases are design-review contracts, not hard-coded implementation breakpoints.

### 52.10 Colour and contrast review

Frozen palette only: canvas `#F4F1EA`; ink `#1A1916`; muted `#5C574E`; accent `#1F5C57`. No extra active brand colour. Independent R1 WCAG 2.x relative-luminance candidates: text-primary/canvas 15.58:1; text-primary/surface 17.58:1; text-primary/Today 14.13:1; text-secondary/canvas 9.74:1; text-secondary/Today 8.84:1; muted/canvas 6.36:1; muted/Today 5.77:1; accent/canvas 6.83:1; accent/surface 7.70:1; accent/Today 6.19:1; hover/canvas 9.11:1; border-strong/surface 3.76:1; border-strong/canvas 3.33:1; border-default/canvas 1.57:1 decorative; border-subtle/canvas 1.18:1 decorative; Today/canvas 1.10:1 not a text pair. These numbers agree with overlapping PW-10-R1 figures. They are not browser measurement and not an accessibility PASS. Header separator is not the sole state cue. Focus is outline plus offset. Forced-colours fallback remains specified. Disclosure list uses canvas, not a second white enclosed panel (`PW11-R1-FND-005`).

### 52.11 Surface review

Actual enclosed occupancy is one (access) on desktop, tablet, and mobile. Header white bar is grouping, not a counted card. Today is a band. Course Seller is a divider. Trust is plain. Footer is a divider close. Desktop maximum remains three; mobile maximum remains two. Access is the primary enclosed surface and remains utility, not a conversion banner. Today must not read as a dashboard card.

### 52.12 Section-by-section review

Skip, header, disclosure, hero, closed beta, value, mechanism, Today, Course Seller, trust, access, and footer each have required copy, semantic element, visual treatment, spacing, responsive behaviour, interaction behaviour, accessibility behaviour, evidence boundary, and later validation owner. Skip targets `main`; candidate fragment `hoofdinhoud` is used only when present (`PW11-R1-FND-012`). No section restores a screenshot, filled CTA, waitlist, or fake destination.

### 52.13 Interaction-state review

`PW11-STATE-001`–`024` cover default, hover, active, focus-visible, visited, future current, disclosure collapsed/expanded, skip hidden/focused, anchor target, reduced motion, no motion, forced colours, zoom, text spacing, no JavaScript, missing destination, authenticated bypass, unauthenticated visitor, omitted legal destination, inactive AI, and omitted optional content. Expanded disclosure is native semantics plus visible `Navigatie`, not colour-only. No state implies implementation. Authenticated routing remains PW-13-owned.

### 52.14 Responsive review

`PW11-RESP-001`–`018` preserve the same content truth and order. Only permitted properties compress. Maturity, qualifiers, honest stop, and existing-account context are never removed. No device-specific product claim. Disclosure is fit-driven. No carousel (`PW11-RESP-017`). No sticky acquisition CTA. No horizontal target-group comparison.

### 52.15 Accessibility-by-design review

`PW11-A11Y-001`–`028` cover one H1, heading hierarchy, landmarks, skip, focus order and visibility, clearance, disclosure name/role/value/state, keyboard, Escape only if enhanced, target floors, link identification, colour-independent state, qualifier size, line height, zoom, reflow, text spacing, forced colours, reduced motion, no-JavaScript, omitted optional content, no hover-only truth, no icon-only truth, and no fake disabled control. Document language remains a PW-13 isolation obligation (`PW11-A11Y-027`). No accessibility PASS or WCAG conformance is claimed.

### 52.16 Product-truth review

Neither copy nor visual convention implies GA, open signup, public registration, free access, trial, pricing, public demo, request access, waitlist, contact availability, generative or autonomous AI, provider connections, Stripe, checkout, four complete editions, Course Seller as the whole brand, LMS, public catalogue, complete current-SHA Course Seller edition, guaranteed outcomes, legal compliance, certification, absolute security, uptime/SLA, traction, testimonials, logos, or artificial scarcity. Closed beta remains factual inline text. Trust remains named controls. Access remains an existing-account utility with an honest stop.

### 52.17 Premium-quality review

Premium quality is specified through hierarchy, alignment, controlled line length, consistent spacing, restrained palette, limited surfaces, precise type, honest maturity, and coherent closure. The design is not a chatbot landing page, coaching funnel, LMS homepage, enterprise dashboard, coming-soon page, waitlist, free-trial SaaS template, or hamburger-only marketing page. Residual risks that a text-first page can look empty at 1440 or unfinished without a screenshot remain later-gated (`PW11-R1-FND-020`). They are not solved by adding forbidden decoration.

### 52.18 Executability review

An implementer can determine region order, container and width roles, spacing, type, colour, surface, border, focus, header and disclosure behaviour, responsive transformations, optional-content behaviour, states, exact frozen copy, prohibited patterns, and validation obligations. Remaining implementation freedom (native `details` versus button-plus-region; exact content-fit threshold; optional later micro-colour) does not change the frozen design contract and is later-gated.

### 52.19 Risk and validation review

Risks cover sparse/unfinished reading, unbounded editorial, H1 guarantee, beta exclusivity, Sign in as acquisition, Today/CS/trust/access misread, muted-qualifier loss, 1440 luxury space, 320/zoom failure, disclosure hiding maturity, colour-only current nav, system-font genericness, spec-as-implementation, token leak, freeze-as-validation, canvas-as-breakpoint, AI activation, 72ch overflow, and 14-region overcount. All `PW11-VAL-*` remain `PLANNED — NOT EXECUTED`. All thresholds remain `PROPOSED — NOT ACHIEVED`. No participants or results were fabricated. Owner freeze is not validation evidence.

### 52.20 Question review

Fourteen `PW11-Q-*` IDs remain unique. Open owner-assembly questions: 0. `PW11-Q-001`–`007` are owner-frozen with implementation/validation remaining where stated. `PW11-Q-008` is open PW-12. `PW11-Q-009` and `PW11-Q-013` are partially resolved. `PW11-Q-010` is open PW-13. `PW11-Q-011` and `PW11-Q-012` are externally gated. `PW11-Q-014` is resolved by upstream. Technical questions are not marked owner-resolved.

### 52.21 Traceability review

`PW11-MAP-001`–`021` were audited. `PW11-MAP-021` phase-name shorthand was expanded to explicit upstream IDs (`PW11-R1-FND-008`). Cited IDs exist in PW-3, PW-6, PW-7, PW-8, PW-9, PW-10, and PW-11. Missing cited IDs: 0. Invalid cited IDs: 0. HOLD/PROHIBIT used as positive claims: 0. Orphan material design decisions: 0.

### 52.22 Finding register

| ID | Severity | Area | Evidence | Impact | Correction or disposition | Affected authority | Downstream | Final status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW11-R1-FND-001 | P1 | Composition | 14 REGION IDs vs 10 SEC vs 8 clusters were not mapped | Implementer could invent extra clusters | Added §12 count reconciliation | PW-9; PW11-REGION | PW-13 | `CORRECTED` |
| PW11-R1-FND-002 | P1 | Geometry | 72ch can exceed 40rem (~640px) | Overflow or competing column | GEO-003 hard max; GEO-004 inside it | PW10-CONT-002; PW9-GRID-008 | PW-13 | `CORRECTED` |
| PW11-R1-FND-003 | P1 | Geometry | page-inline-safe and header-padding-inline could be stacked | Extra inset or clipped header | GEO-006 is inside content-wide | PW11-GEO-001; GEO-006 | PW-13 | `CORRECTED` |
| PW11-R1-FND-004 | P1 | Colour / truth | Qualifier colour allowed secondary or muted | Material truth could be demoted | Essential qualifiers locked to `#3F3C36` | PW11-TYPE-008; COLOR-003 | PW-12 | `CORRECTED` |
| PW11-R1-FND-005 | P1 | Surface | COLOR-015 allowed canvas or white surface | Second enclosed panel | Disclosure list is canvas only | PW11-COLOR-015; SURF-011 | PW-13 | `CORRECTED` |
| PW11-R1-FND-006 | P1 | Typography | TYPE-012 said “utility / nav”; TYPE-010 said “heading-2” | Materially different sizes | Explicit rem values | PW11-TYPE-010; TYPE-012 | PW-13 | `CORRECTED` |
| PW11-R1-FND-007 | P1 | Accessibility | A11Y register omitted disclosure state, Escape, no-JS, omit, lang, reflow | Incomplete PW-13 contract | Added A11Y-023–028 | PW-8 | PW-12/13 | `CORRECTED` |
| PW11-R1-FND-008 | P1 | Traceability | MAP-021 cited phase names | Non-auditable authority | Expanded to explicit IDs | PW11-MAP-021 | n/a | `CORRECTED` |
| PW11-R1-FND-009 | P1 | Governance | §51.2 duplicated OD definition rows | False second register | Relabelled restatement | PW11-OD | n/a | `CORRECTED` |
| PW11-R1-FND-010 | P1 | Geometry | 320 fit was asserted without arithmetic | Impossible narrow layout risk | Documented 288 / ~246 CSS px contract | PW11-GEO-022; VIEW-006 | PW-12 | `CORRECTED` |
| PW11-R1-FND-011 | P1 | Responsive | No explicit no-carousel / fit-driven disclosure rows | Device-identity or carousel implementation | Added RESP-017 and RESP-018 | PW-7 | PW-13 | `CORRECTED` |
| PW11-R1-FND-012 | P1 | Skip | Skip could be read as `href="#hoofdinhoud"` before the ID exists | Dead hash | Target `main`; omit href if ID missing | PW8-OD-004; PW8-ERROR-002 | PW-13 | `CORRECTED` |
| PW11-R1-FND-013 | P1 | Typography | Unclear whether H1 becomes 1.625rem at 768 | Collapsed tablet hierarchy | 1.625rem only at 390/320 | PW11-VIEW-004/005; TYPE-003 | PW-13 | `CORRECTED` |
| PW11-R1-FND-014 | P2 | Contrast | Analytical ratios are not rendered measurements | False PASS risk | Remain VAL-022; Q-008 | PW8-OD-010 | PW-12 | `LATER-GATED` |
| PW11-R1-FND-015 | P2 | Navigation fit | Exact wrap/disclose threshold unmeasured | Premature CSS breakpoint | Remain Q-009; VAL-011; VAL-029 | PW7-OD-014 | PW-12/13 | `LATER-GATED` |
| PW11-R1-FND-016 | P2 | Today band | 1.10:1 band vs canvas is not a text pair | Band may be weak or over-strong | Remain VAL-030 | PW10-OD-010 | PW-12 | `LATER-GATED` |
| PW11-R1-FND-017 | P2 | Type wrap | System fonts wrap H1 at different points | Line-count variance | Remain VAL-021; VAL-027; OD-006 | PW11-OD-006 | PW-12 | `LATER-GATED` |
| PW11-R1-FND-018 | P2 | External | Legal footer and brand asset absent | Footer/identity completeness | Remain Q-011; Q-012 | PW9-OD-011; PW10-OD-003 | External | `LATER-GATED` |
| PW11-R1-FND-019 | P2 | Isolation | Route-scoped CSS, `lang`, destinations unimplemented | Cannot ship from this file | Remain Q-010; A11Y-027 | PW8-OD-002; PW10-OD-018 | PW-13 | `LATER-GATED` |
| PW11-R1-FND-020 | P2 | Premium | Text-first 1440 can look empty or unfinished | Perception, not a frozen-decision defect | Remain RSK-015; RSK-020; VAL-010; VAL-032 | PW11-OD-007 | PW-12 | `LATER-GATED` |
| PW11-R1-FND-021 | P2 | Validation | Zoom, text-spacing, keyboard, forced colours, no-JS unexecuted | No PASS | Remain VAL-014–019; VAL-025 | PW-8 | PW-12/13 | `LATER-GATED` |
| PW11-R1-FND-022 | P2 | Targets | 44×44 preference vs 24×24 floor at 320 wrap | Measurement remaining | Remain VAL-023 | PW8-OD-008 | PW-12 | `LATER-GATED` |

P0 remaining: 0. Unresolved P1 remaining: 0. P1 corrected: 13. P2 later-gated: 9. R1 finding count: 22.

### 52.23 Corrections performed

| Finding | Before | Defect | After | Why allowed | Affected IDs | Verification |
| --- | --- | --- | --- | --- | --- | --- |
| FND-001 | Counts stated separately | Unmapped 14/10/8 | SEC-to-REGION mapping table | Documentation mapping; PW-9 not changed | REGION-001–014 | Mapping complete |
| FND-002 | copy-measure 60–72ch beside 40rem | Conflicting boxes | Reading column hard max | Clerical geometry; OD-003–005 unchanged | GEO-003; GEO-004 | Precedence explicit |
| FND-003 | Header padding not located | Double inset risk | Inside content-wide | Derivation clarification | GEO-006 | Stacking forbidden |
| FND-004 | secondary or muted | Truth could hide | Essential qualifiers secondary | Colour role, not palette change | TYPE-008; COLOR-003 | Muted reserved for footer |
| FND-005 | canvas or surface | Second card | Canvas only | Surface budget, not OD change | COLOR-015; SURF-011 | Occupancy remains 1 |
| FND-006 | Role aliases | Size ambiguity | Explicit rem | Typography precision | TYPE-010; TYPE-012 | Sizes executable |
| FND-007 | 22 A11Y rows | Coverage gaps | A11Y-023–028 | Additive a11y-by-design | A11Y-023–028 | Gaps named |
| FND-008 | Phase-name shorthand | Unauditable MAP | Explicit IDs | Traceability only | MAP-021 | IDs exist upstream |
| FND-009 | Second OD table | Duplicate definitions | Restatement table | Clerical governance | §51.2 | §44 remains unique |
| FND-010 | 320 fit asserted | Unchecked arithmetic | 288 / ~246 CSS px | Geometry documentation | §14; §32 | Internally consistent |
| FND-011 | Carousel/fit implicit | Ambiguous RESP | RESP-017; RESP-018 | Additive responsive rules | RESP-017; RESP-018 | Contiguous |
| FND-012 | Skip to later fragment | Dead `href="#"` risk | Target `main`; omit if missing | Accessibility contract | COMP-001; A11Y-004 | Matches PW8-OD-004 |
| FND-013 | Mobile scale could apply at 768 | Hierarchy collapse | 1.625rem at 390/320 only | Viewport role clarification | VIEW-004; VIEW-005 | Tablet H1 remains 2.00rem |

No frozen owner decision, Route A2 sentence, PW-9 composition, PW-10 direction, or PW-1 claim was changed.

### 52.24 Remaining P2 gates

PW-12 owns rendered contrast, zoom, text-spacing, keyboard, forced colours, Today-band perceivability, whitespace balance, `Navigatie` comprehension, and target-size measurement. PW-13 owns isolation CSS, document language, disclosure mechanism, destinations, and no-JS fallback implementation. External owners own legal footer and brand asset. Optional visited-link styling remains same-as-default until later visual work.

### 52.25 Register census after R1

| Family | Count |
| --- | ---: |
| PRIN | 12 |
| DESIGN | 1 |
| VIEW | 9 |
| GEO | 30 |
| TYPE | 13 |
| COLOR | 20 |
| SURF | 11 |
| REGION | 14 |
| COMP | 18 |
| STATE | 24 |
| RESP | 18 |
| A11Y | 28 |
| ANTI | 20 |
| RSK | 28 |
| VAL | 32 |
| Q | 14 |
| OD | 7 |
| MAP | 21 |
| ACC | 21 |
| **Main total** | **341** |
| R1-FND (separate) | 22 |

Families are unique and contiguous. Existing IDs were not renumbered. Historical mentions are not counted as new definitions.

### 52.26 File-integrity evidence

Only `docs/phases/PW-11-high-fidelity-public-homepage-design.md` changed. The file remains untracked. No staged files. No tracked files changed. No other untracked files. No product, route, CSS, test, config, dependency, or asset change. Authenticated Home untouched. Unique contiguous IDs. No trailing whitespace. One terminating newline. CRLF preserved. Balanced fences. No duplicate H2 headings. No conflict markers. No leftover work-marker tokens. No secrets. `git diff --check` and no-index whitespace check recorded in the R1 report.

### 52.27 Gate result

AND logic. Unresolved P0: 0. Unresolved P1: 0. Seven owner decisions intact. Frozen Route A2 exact. PW-9 intact. PW-10 intact. PW-1 respected. Composition, desktop, tablet, mobile, narrow-mobile, zoom, and text-spacing contracts coherent. Geometry, typography, colour, and surface budget internally consistent. Header and disclosure executable. Section contracts complete. States sufficient. Responsive transformations preserve truth. Accessibility-by-design coverage complete as a specification, not a PASS. No unsupported visual implication found after corrections. Design is precise enough for downstream implementation without material visual invention. All P2 items have later owners. Validations remain unexecuted. Traceability missing/invalid: 0. Protected boundaries unchanged. File integrity passes.

```text
PASS — PW-11-R1 INDEPENDENT HIGH-FIDELITY PUBLIC HOMEPAGE DESIGN REVIEW CLOSED WITH EVIDENCE
```

### 52.28 Resulting PW-11 status

```text
PW-11 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

Not used: `CLOSED WITH EVIDENCE — PW-11`; `IMPLEMENTATION READY`; `PUBLICATION READY`; `ACCESSIBILITY PASS`; `WCAG COMPLIANT`; `PRODUCTION VERIFIED`. Final verification and commit require separate authorization. PW-12 and PW-13 were not started.
