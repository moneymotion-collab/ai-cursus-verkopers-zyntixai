# PW-9 — Homepage Wireframe & Layout Composition

| Field | Value |
| --- | --- |
| Document | PW-9 — Homepage Wireframe & Layout Composition |
| Type | Low-fidelity homepage wireframe and layout-composition authority (not visual design freeze, not implementation, not accessibility PASS, not publication) |
| Date | 2026-09-16 |
| Branch | `core/platform-readiness-20260707` |
| HEAD at drafting | `0b453cfdbc678309bed47c1fef75d0155aa3eac4` |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Binding closures | PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; PW-3 `9c12c977383a100eb548880d8d35b329b4406f90`; PW-4 `c6f4489bc5cbf9306b4784320cc747975209caeb`; PW-5 `fcb4eab3fbfe7cefd0013828d9b9819cb452cb87`; PW-6 `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`; PW-7 `adcbd1707caa97a4b5511a56616210d7444a5663`; PW-8 `0b453cfdbc678309bed47c1fef75d0155aa3eac4` |
| Authenticated Home | Closure `49cd5773976143139a154f9b8ddf36535a4dd914`; Production product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Copy input | Owner-frozen Route A2 (`PW6-OD-002`) |
| Layout input | Owner-frozen PW7-OD-001–014 |
| Accessibility input | Owner-frozen PW8-OD-001–016 |
| Establishment status (historical) | `PW-9 WIREFRAME & LAYOUT COMPOSITION ESTABLISHED — AWAITING OWNER DECISIONS` — see §2 and §40 as first-establishment record |
| Establishment gate (historical) | `CONDITIONAL — PW-9 OWNER WIREFRAME DECISIONS REQUIRED` |
| Owner wireframe freeze | §41 — `PW9-OD Owner Homepage Wireframe & Layout Decision Evidence` |
| Current status | `PW-9 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` |
| Owner-freeze gate (historical) | `PASS — PW9-OD OWNER HOMEPAGE WIREFRAME & LAYOUT DECISIONS FROZEN` |
| Independent review | §42 — `PW-9-R1 Independent Homepage Wireframe & Layout Review Evidence` |
| R1 gate | `PASS — PW-9-R1 INDEPENDENT HOMEPAGE WIREFRAME & LAYOUT REVIEW CLOSED WITH EVIDENCE` |

```text
WIREFRAME AUTHORITY ≠ VISUAL DESIGN FREEZE ≠ IMPLEMENTATION AUTHORITY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY ≠ DEPLOYMENT AUTHORITY
OWNER WIREFRAME FREEZE ≠ VISUAL DESIGN FREEZE ≠ HIGH-FIDELITY DESIGN ≠ IMPLEMENTATION AUTHORITY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY ≠ DEPLOYMENT AUTHORITY
PW-9 DESIRED LAYOUT ≠ CURRENT ARCHITECTURE ≠ ROOT MODEL A IMPLEMENTED ≠ PUBLIC HOMEPAGE LIVE
FROZEN COPY ≠ NEW MARKETING COPY ≠ H2 ASSEMBLY IS FROZEN LANGUAGE, NOT A PW-6 REWRITE
OWNER DECISION RESOLVED ≠ DOWNSTREAM CONDITION RESOLVED
```

No layout unit is `PUBLICATION READY`, `IMPLEMENTATION READY`, `ACCESSIBILITY PASSED`, `WCAG COMPLIANT`, `VISUAL DESIGN FROZEN`, or `CLOSED WITH EVIDENCE`. Twelve `PW9-OD-*` records are `RESOLVED — OWNER FROZEN`. Visual tokens, high-fidelity, implementation, and accessibility validation remain later-gated.

---

## 1. Document Control

This file is the sole PW-9 deliverable. It translates closed PW-0 through PW-8 authorities into a professional low-fidelity homepage composition for desktop, tablet, mobile, zoom/reflow, and keyboard/screen-reader logic. It does not implement routes, CSS, React, Next.js, Tailwind, components, assets, fonts, metadata, or authenticated Home.

| Control | Rule |
| --- | --- |
| Product code | Unchanged |
| Authenticated Home | Closed; not restyled; not used as a public visual system |
| Dual-use `/` | Current truth unchanged; Root Model A remains desired IA only |
| `/login`, `/register`, invite, recovery | Read-only; not mutated |
| Shared CSS / root metadata / AppShell | Protected |
| Frozen Route A2 copy | Quoted, not rewritten |
| Frozen PW-7 layout decisions | Respected, not reopened |
| Frozen PW-8 accessibility decisions | Respected, not reopened |
| Colour, type, shadow, radius | Out of scope; PW-10 |
| High-fidelity mockups / Figma | Out of scope; PW-11 |
| Staging / commit / push / deploy | Not authorized |
| PW9-OD | Owner freeze; evidence in §41 |
| PW-9-R1 | Independent review; evidence in §42 |
| PW-10 | Not started |

---

## 2. Executive Decision

PW-9 first established a recommended low-fidelity composition for the future Dutch-first public homepage. That establishment remains historical evidence. **PW9-OD** is the owner freeze of that recommended wireframe package.

Authority: `EXPLICIT ZYNTIXAI OWNER HOMEPAGE WIREFRAME & LAYOUT DECISION` (2026-09-16). Baseline HEAD `0b453cfdbc678309bed47c1fef75d0155aa3eac4`. Approved package: `PW-9 RECOMMENDED WIREFRAME PACKAGE`. This is layout-direction authority, not visual design, high-fidelity, implementation, WCAG conformance, legal approval, browser evidence, or publication.

```text
OWNER WIREFRAME FREEZE ≠ VISUAL DESIGN FREEZE ≠ HIGH-FIDELITY DESIGN ≠ IMPLEMENTATION AUTHORITY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY ≠ DEPLOYMENT AUTHORITY
```

Owner-frozen selections (`PW9-OD-001`–`012`, all `RESOLVED — OWNER FROZEN`):

- Composition: `MODEL-001 — CALM EDITORIAL FLOW`.
- Structure: eight visual clusters; ten semantic regions.
- Visible H2s: `Over ZyntixAI` and `Hoe het werkt`, mapped to the frozen nav labels.
- Hero: no supporting field in the frozen baseline.
- Today: compact editorial proof block.
- Course Seller: subtly separated editorial section in `main`.
- Trust and access: two separate compact blocks.
- Surfaces: max three enclosed on desktop; max two on mobile.
- Mobile nav: non-modal inline disclosure.
- Anchors: existing `PW9-ANCHOR-001`–`007` as candidate implementation contract, not implemented.
- Footer: identity-only baseline.
- Screenshot: no reserved slot.

`Today` pronunciation remains an open PW-8 validation detail. Historical establishment status retained: recommendations were not owner decisions until this freeze.

```text
PW-9 WIREFRAME & LAYOUT COMPOSITION ESTABLISHED — AWAITING OWNER DECISIONS
```

That historical gate is superseded for current status only. Owner-freeze status is recorded in §41. Independent review status is recorded in §42. Current document status: `PW-9 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT`.

---

## 3. Purpose

Define the concrete page-build, wireframes, container roles, surface budget, component composition, and layout states needed before visual design (PW-10), high-fidelity (PW-11), validation (PW-12), and implementation (PW-13).

PW-9 answers:

- which composition model the page should use;
- how eight frozen clusters occupy desktop, tablet, and mobile;
- which headings, anchors, and reading order the wireframe must preserve;
- which surfaces, assets, and states are allowed;
- which remaining conditions are later-gated (visual system, high-fidelity, validation, implementation, publication).

---

## 4. Non-Goals

PW-9 does not:

- implement a public homepage, skip link, disclosure, CSS, or ARIA;
- modify AppShell, authenticated Home, `/login`, middleware, root layout, or `globals.css`;
- rewrite frozen PW-6 copy or reopen PW-7 / PW-8 owner decisions;
- freeze colour, type, elevation, radius, or a design system;
- produce high-fidelity or Figma files;
- claim WCAG, EN 301 549, ADA, or Dutch legal conformance;
- execute browser, keyboard, screen-reader, zoom, or visitor tests;
- authorize screenshots, icons, photography, or motion assets;
- design an unauthorized public form or CTA;
- start PW-10 or later implementation.

---

## 5. Governing Authorities

1. PW-0 defines scope and protected boundaries.
2. PW-1 remains the public-truth ceiling.
3. PW-2 defines visitor comprehension; `PW2-VIS-001` is the only brand-primary visitor.
4. PW-3 defines messaging; operational clarity remains the territory; AI is not the hero hook; BOS is not required in Layer A.
5. PW-4 defines desired IA: Root Model A, Site Model A, in-page exploration.
6. PW-5 defines the V1 content model and eight-cluster budget.
7. PW-6 defines frozen Route A2 copy.
8. PW-7 defines frozen responsive layout.
9. PW-8 defines frozen accessibility behaviour and component states.
10. PW-9 defines low-fidelity composition only.

B1-GATE.1 remains the repository completion-and-evidence standard. PW-9 is a documentation/design phase. Browser, Production, keyboard, and screen-reader verification are not required for this review and have not been executed. Historical establishment evidence remains in §40; owner-freeze evidence remains in §41; independent-review evidence is §42.

Authenticated Home closure `49cd5773976143139a154f9b8ddf36535a4dd914` and production product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` remain binding.

---

## 6. Evidence Model

| Class | Meaning in PW-9 |
| --- | --- |
| Current architecture | Inspected truth; not redesigned here |
| Desired public layout | Wireframe authority for a future public `/` |
| Owner-frozen upstream | PW-1–PW-8 decisions PW-9 may not reopen |
| Owner-frozen PW-9 layout | `PW9-OD-*`; still not implemented or visually designed |
| PW-9 recommendation | Historical establishment judgement until this freeze |
| Open owner layout decision | None remaining after this freeze |
| Downstream visual condition | PW-10/11 |
| Implementation condition | PW-13 |
| Publication condition | PW-14 |
| Planned validation | `PLANNED — NOT EXECUTED` |

No measurement, scan, or perception test in this file is executed evidence.

---

## 7. Current Architecture Truth

Inspected read-only. Not modified.

| Surface | Current truth | Public-layout implication |
| --- | --- | --- |
| `src/app/page.tsx` | Unauthenticated `/` redirects to `/login`; authenticated `/` uses membership/onboarding-aware entry | No public marketing homepage exists |
| `src/app/layout.tsx` | `<html lang="en">`; title `ZyntixAI`; description `ZyntixAI application foundation`; imports `globals.css` | Route-scoped Dutch is not implemented |
| `src/middleware.ts` | Session refresh / auth redirects | Public routing must not simplify `/` (`PW0-RQ-002`) |
| `src/app/login/page.tsx` | English sign-in landing | `/login` remains English utility, not a Dutch marketing page |
| `src/app/(authenticated)/home/page.tsx` | Authenticated Home / Today | Closed; not a public demo or screenshot source |
| `src/components/app-shell.tsx` | Skip link `Skip to main content`; `details`/`summary` `Menu` | Informs regression only; not the public system |
| `src/app/globals.css` | Shared tokens and 2px focus outline | Public page must not treat this as its visual system |
| Metadata / canonical / analytics | No public marketing metadata, canonical-host ownership, or consent layer is demonstrated | Later-gated (`PW6-OD-012`; `PW0-PB-034`) |

Route truth remains:

- unauthenticated `/` redirects to `/login`;
- authenticated `/` uses membership/onboarding-aware entry;
- `/home` remains protected;
- Root Model A remains desired IA, not implementation truth;
- public skip link, in-page destinations, and public Dutch layout are not implemented.

```text
PW-9 ONTWERPT DE GEWENSTE LAYOUT EN WIJZIGT DE HUIDIGE ARCHITECTUUR NIET.
```

---

## 8. Design Objective and Boundaries

The homepage must feel calm, modern, premium, professional, credible, mature, clear, operational, human, and restrained. It must not feel loud, chatbot-led, futuristic-for-its-own-sake, or conversion-hungry.

ZyntixAI is presented as a serious product for owners of small businesses who need overview of customers, work, responsibilities, progress, and what needs attention (`PW2-VIS-001`; `PW3-POS-001`).

The layout must not make ZyntixAI look like:

- only an AI chatbot;
- a generic AI wrapper;
- a public LMS or open course catalogue;
- a task manager without broader work context;
- a complete all-in-one business platform;
- a product with four fully available editions;
- open self-service SaaS;
- a free product;
- a public demo;
- an enterprise suite;
- a marketing site with invented scale or traction.

| Principle | Rule |
| --- | --- |
| PW9-PRIN-001 | Content before decoration. Empty hero space is not quality. |
| PW9-PRIN-002 | One brand-primary visitor: the small-business owner/operator. |
| PW9-PRIN-003 | Course Sellers are secondary relevance, never brand-primary. |
| PW9-PRIN-004 | Maturity is early, visible, and textual. |
| PW9-PRIN-005 | Sign in is utility, never acquisition. |
| PW9-PRIN-006 | DOM order is the meaning order and the focus order. |
| PW9-PRIN-007 | Visual asymmetry never reverses reading order. |
| PW9-PRIN-008 | Text remains complete without images, motion, or JavaScript enhancement. |
| PW9-PRIN-009 | Qualifiers stay adjacent to their claims. |
| PW9-PRIN-010 | Surfaces are scarce. Not every block is a card. |
| PW9-PRIN-011 | Wireframe guidance is not a PW-10 token freeze. |
| PW9-PRIN-012 | Desired layout is not a claim that the route exists. |

---

## 9. Frozen Inputs

### 9.1 Audience and positioning

Primary visitor: owner of a small business (`PW2-OD-001`; `PW2-VIS-001`). Course Sellers remain secondary (`PW5-OD-001`; `PW6-OD-008`). Agencies, Field Service, and E-commerce remain deferred (`PW5-OD-002`). Four equal audience cards are prohibited. BOS is omitted from frozen Route A2 (`PW6-OD-005`). AI is not a hero hook (`PW6-OD-009`).

### 9.2 Frozen copy

Quoted, not rewritten.

| Role | Frozen text | Authority |
| --- | --- | --- |
| Brand | `ZyntixAI` | `PW6-COPY-001` |
| Nav | `Over ZyntixAI` · `Hoe het werkt` · `Gesloten bèta` · `Inloggen` | `PW6-OD-003` |
| H1 | `Houd zicht op klanten, werk en voortgang.` | `PW6-COPY-043` |
| Hero support | `ZyntixAI helpt je als eigenaar van een klein bedrijf het dagelijkse werk te organiseren: klanten, verantwoordelijkheden, voortgang en wat aandacht nodig heeft.` | `PW6-COPY-044` |
| Layer B | `ZyntixAI is nu in gesloten bèta.` | `PW6-OD-006` |
| Layer B utility | `Inloggen is voor bestaande accounts.` | `PW6-OD-006` |
| Value body | `ZyntixAI is bedoeld om klanten, werk, verantwoordelijkheden en voortgang bij het werk te houden. Het vervangt niet al je andere tools.` | `PW6-COPY-046` |
| Mechanism body | `Relevante informatie over klanten, werk en verantwoordelijkheden blijft bij het werk waar het bij hoort. Toegelaten gebruikers kunnen daarna op Today een beperkt dagelijks startpunt zien.` | `PW6-COPY-047` |
| Today heading | `Today als voorbeeld in het product` | `PW6-OD-007` |
| Today body | `Wie is toegelaten en ingelogd, begint op Today. Die pagina toont een beperkt dagelijks startpunt met aandachtspunten en toegewezen taken. Today is geen publieke demo en staat niet voor het hele product.` | `PW6-COPY-048` |
| CS heading | `Als je opleidingen of coaching geeft` | `PW6-OD-008` |
| CS body | `In die context kunnen toegelaten gebruikers werken met klanten, programma’s, inschrijvingen en voortgang.` | `PW6-COPY-049` |
| CS qualifier | `Dit is geen leeromgeving en geen open catalogus.` | `PW6-OD-008` |
| Trust heading | `Hoe toegang in het product werkt` | `PW6-OD-010` |
| Trust body | `ZyntixAI is bedoeld voor mensen die zijn ingelogd binnen hun organisatie. Wat voor jou niet geldt, blijft buiten beeld. Today gebruikt gegevens binnen de context van je ingelogde account en organisatie.` | `PW6-COPY-050` |
| Access heading | `Toegang` | `PW6-OD-011` |
| Access status | `ZyntixAI is in gesloten bèta. Via deze site kun je geen nieuw account aanmaken.` | `PW6-ACCESS-008` |
| Access existing | `Heb je al een account? Inloggen.` | `PW6-ACCESS-009` |
| Access stop | `Heb je geen account, dan is deze pagina bedoeld om ZyntixAI te leren kennen.` | `PW6-OD-011` |
| Conditional AI | `ZyntixAI is geen chatbot. Het is een product om dagelijks werk te organiseren.` | `PW6-OD-009` |

AI copy remains `CONDITIONAL — INACTIVE BY DEFAULT`. The recommended wireframe does not activate it.

Value and mechanism have frozen body text. Visible H2s are now owner-frozen as the matching nav labels (`PW9-OD-003`). This is assembly of already frozen language, not a PW-6 rewrite.

Skip-link chrome `Ga naar de hoofdinhoud` is PW-8 public chrome, not a PW-6 body rewrite.

### 9.3 Frozen responsive model

PW7-OD-001–014 remain binding: asymmetric narrative with editorial fallback; text-led single-column hero; no required image; fit-or-disclose navigation; `Inloggen` outside disclosure where feasible; static header; inline Layer B; continuous value/mechanism; text-only Today; Course Seller editorial aside; compact trust; compact access; Sign in in header and access; eight clusters; content-driven thresholds; planned 320 CSS px and 200% zoom.

### 9.4 Frozen accessibility model

PW8-OD-001–016 remain binding: AA-oriented requirements, not conformance; route-scoped Dutch; Course Seller `section` in `main`; skip to public `main`; Anchor Model B; non-modal inline disclosure; 2px outline + 2px offset; 24×24 floor / 44×44 preference; non-colour link cues; AA contrast floors; non-essential motion; text-first icons; static-first announcements; planned 200%/320/text-spacing plus additional 400%; planned SR matrix; no-JS core usability.

---

## 10. Layout Models Evaluated

Scores are establishment judgements, not visitor research. Scale 1–5.

### 10.1 PW9-MODEL-001 — Calm Editorial Flow

Quiet vertical page. Wide text zones. Few surfaces. Strong mobile continuity. Matches operator-primary positioning and PW-7 editorial fallback.

Risks: too long; too little product structure; honest stop can feel inactive if hierarchy is weak.

### 10.2 PW9-MODEL-002 — Structured Operational Canvas

More visible panels. Clearer product structure. Higher dashboard and feature-grid risk. Today and Course Seller can over-dominate. Harder no-JS and 320 CSS px story.

### 10.3 PW9-MODEL-003 — Product-Led Split Narrative

More split layouts and future visual slots. Depends on screenshots or abstract fields. Conflicts with text-first HOLD. Higher chatbot/UI-imitation risk.

| Criterion | MODEL-001 | MODEL-002 | MODEL-003 |
| --- | --- | --- | --- |
| Fit to `PW2-VIS-001` | 5 | 4 | 3 |
| Operational clarity | 5 | 4 | 3 |
| Premium / calm | 5 | 3 | 3 |
| Scanability | 4 | 4 | 3 |
| Mobile continuity | 5 | 3 | 2 |
| Qualifier visibility | 5 | 3 | 3 |
| Credibility | 5 | 3 | 2 |
| Chatbot risk | Low | Medium | High |
| All-in-one risk | Low | High | Medium |
| Today over-dominance | Low | High | Medium |
| CS over-dominance | Low | High | Medium |
| Accessibility risk | Low | Medium | High |
| Implementation complexity | Low | Medium | High |
| Future extensibility | 4 | 4 | 5 |

Recommendation: **MODEL-001**, applying frozen PW-7 MODEL-002 only as an optional non-content supporting field that must collapse without remainder. Conservative default and owner selection: single reading column. Frozen as `PW9-OD-001`. MODEL-002 and MODEL-003 remain historical evaluation and are not co-leading.

```text
OWNER FROZEN COMPOSITION MODEL — DOWNSTREAM VISUAL DESIGN REQUIRED
```

---

## 11. Homepage Section Architecture

Eight composition zones (`PW9-ZONE-001`–`008`) implement the PW-7 eight-cluster budget (`PW7-OD-012`) without adding a ninth marketing band. Semantic sections may be finer than visual clusters.

| ID | Composition zone | PW-7 visual cluster | Semantic containers | Heading | Nav destination |
| --- | --- | --- | --- | --- | --- |
| PW9-ZONE-001 | Header and navigation | 1. Header | `header` + named `nav` | None in header; brand text `ZyntixAI` | n/a |
| PW9-ZONE-002 | Hero and early closed beta | 2. Hero plus early closed beta | `main` > hero `section` + associated status | H1 frozen; beta is not an H2 | n/a for H1; beta is status |
| PW9-ZONE-003 | Value / Over ZyntixAI | 3. Value plus mechanism (continuous) | `section` | Frozen H2 `Over ZyntixAI` | `#over-zyntixai` |
| PW9-ZONE-004 | Mechanism / Hoe het werkt | 3. Value plus mechanism (continuous) | same continuous editorial stack | Frozen H2 `Hoe het werkt` | `#hoe-het-werkt` |
| PW9-ZONE-005 | Today proof | 4. Today proof | `section` | Frozen H2 `Today als voorbeeld in het product` | `#today` optional, not in primary nav |
| PW9-ZONE-006 | Course Seller | 5. Course Seller editorial aside | `section` in `main` | Frozen H2 `Als je opleidingen of coaching geeft` | `#opleidingen-en-coaching` optional |
| PW9-ZONE-007 | Trust | 6. Trust | `section` | Frozen H2 `Hoe toegang in het product werkt` | not in primary nav |
| PW9-ZONE-008 | Access and footer close | 7. Access and honest stop; 8. Footer | access `section` + `footer` | Frozen H2 `Toegang`; footer has no H1 | `#toegang` for nav `Gesloten bèta` |

`PW9-OD-002` names the eight visitor-facing chapters, including the two titled sections inside PW-7 cluster 3. That does not split cluster 3 into two extra marketing bands and does not add a ninth cluster. Footer remains PW-7 visual cluster 8: identity close, not an extra marketing content band.

Value and mechanism are two H2 sections inside one continuous visual cluster. Hero and Layer B share one early visual cluster so maturity stays in the first reading stretch without becoming the H1. Trust, access, and footer remain three semantic regions: trust is its own visual cluster; access is cluster 7; footer is cluster 8. Named-controls trust is not merged into the honest-stop panel.

```text
OWNER FROZEN SECTION AND CLUSTER ARCHITECTURE
```

| ID | Zone | Purpose | Visitor question | Width / grid | Surface | Qualifier | Sign-in role | Mobile | A11y | Downstream |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW9-SEC-001 | Skip | Reach main | How do I skip chrome? | Full | None | n/a | n/a | First focus | `PW8-SKIP-*` | PW-13 |
| PW9-SEC-002 | Header | Identity and exploration | Where am I? | Wide composition | None | n/a | Header utility | Wrap or disclose | `PW8-NAV-*` | PW-13 |
| PW9-SEC-003 | Hero | Operator recognition | Is this for my work? | Reading | None | Objects in support | None | Single column | One H1 | PW-10 |
| PW9-SEC-004 | Beta | Maturity | Can I use it now? | Reading | Inline status, not badge | Both sentences | Utility sentence only | Wrap, not omit | Text, not colour | PW-10 |
| PW9-SEC-005 | Value | What it organizes | What work is this for? | Reading | Editorial | Anti-replacement in `PW6-COPY-046` | None | Stack | Frozen H2 `Over ZyntixAI` | `PW9-OD-003` |
| PW9-SEC-006 | Mechanism | How it works | How does it work? | Reading | Editorial | Today is later and bounded | None | Stack | Frozen H2 `Hoe het werkt` | `PW9-OD-003` |
| PW9-SEC-007 | Today | Bounded proof | What exists? | Reading / compact proof | Optional proof surface | Not a public demo | None | Stack | Frozen H2 | `PW9-OD-005` |
| PW9-SEC-008 | Course Seller | Secondary relevance | Does this relate to coaching? | Reading, secondary | Subtle separation | No LMS / no catalogue | No extra CTA | Intact unit | `section` not `aside` | `PW9-OD-006` |
| PW9-SEC-009 | Trust | Named controls | How does access work? | Compact | Compact treatment | Not certification | None | Stack | List or paragraphs | `PW9-OD-007` |
| PW9-SEC-010 | Access + footer | Honest stop | What can I do if I have no account? | Compact panel + utility footer | Access panel | Reading is valid | Access utility | Status → Inloggen → stop | `PW8-NAME-007`; `PW8-NAME-008` | PW-13 |

Prohibited in every zone: feature grids without product truth; statistics; testimonials; customer logos; prices; demo/waitlist/contact/register/free/trial CTAs; four audience cards; repeated claim blocks; large empty marketing zones.

---

## 12. Header and Navigation Wireframe

Static header (`PW7-OD-004`). Brand `ZyntixAI`. In-page roles: `Over ZyntixAI`, `Hoe het werkt`, `Gesloten bèta`. Utility: `Inloggen` to `/login`. No Product/Solutions/Pricing/Demo/Contact. No dead `href="#"`. No logo animation. No sticky header. No primary acquisition button.

| Context | Navigation behaviour |
| --- | --- |
| Wide desktop | Full inline nav when labels fit (`PW7-NAV-001`) |
| Compact desktop / tablet | Wrap first; disclose only when the full set no longer fits |
| Mobile | Non-modal inline disclosure (`PW8-OD-006`); `Inloggen` outside where feasible |
| No-JS | Native `details`/`summary` or always-visible in-page headings |

Disclosure is not a dialog, drawer, or focus trap. Visible trigger text is required. Authenticated English `Menu` is not automatically reused (`PW8-NAME-009`). Exact visible chrome label remains later-gated (`PW9-Q-017`); it is not an open owner layout decision. The trigger must be named text, not icon-only (`PW9-OD-009`). Closed and open states must be designed in high-fidelity later. Escape applies only where an enhanced implementation actually requires it. Native semantics must not be overridden without necessity.

```text
OWNER FROZEN NON-MODAL INLINE DISCLOSURE COMPOSITION
```

Candidate destinations, `CANDIDATE DESTINATION — NOT IMPLEMENTED`:

| ID | Candidate fragment | Target heading | Status |
| --- | --- | --- | --- |
| PW9-ANCHOR-001 | `hoofdinhoud` | `main` landmark; skip target | Frozen candidate; not implemented |
| PW9-ANCHOR-002 | `over-zyntixai` | Frozen H2 `Over ZyntixAI` | Frozen candidate; not implemented |
| PW9-ANCHOR-003 | `hoe-het-werkt` | Frozen H2 `Hoe het werkt` | Frozen candidate; not implemented |
| PW9-ANCHOR-004 | `today` | Frozen Today H2 | Frozen candidate; optional; not primary nav; not implemented |
| PW9-ANCHOR-005 | `opleidingen-en-coaching` | Frozen CS H2 | Frozen candidate; optional; not primary nav; not implemented |
| PW9-ANCHOR-006 | `hoe-toegang-werkt` | Frozen trust H2 | Frozen candidate; optional; not primary nav; not implemented |
| PW9-ANCHOR-007 | `toegang` | Frozen access H2; nav `Gesloten bèta` | Frozen candidate; not implemented |

Read-only validity: each ID maps to a real section or skip utility; none is `href="#"`; none targets `/login` or `/home` as an in-page fragment; none is duplicate; nav `Gesloten bèta` maps to titled access, not a fake product page. Values are unchanged from establishment.

```text
OWNER FROZEN CANDIDATE ANCHOR CONTRACT — NOT IMPLEMENTED
```

Focus after activation follows Anchor Model B (`PW8-OD-005`). The set is frozen as `PW9-OD-010`.

---

## 13. Hero Wireframe

Text-led, single-column, operator-first (`PW7-OD-002`). Complete without image. No chatbot visual, dashboard mockup, AI orb, BOS label, Course Seller label, AI label, or Start/Join/Register.

Contains:

- brand context already in the header;
- exact frozen H1;
- exact frozen support;
- reading width, not a poster field;
- immediate association with Layer B.

The H1 is operator orientation, not a promised outcome. Visual design must not enlarge `Houd zicht` into a guarantee, metric, or before/after claim (`PW6-RSK-031`). Support copy keeps customers, responsibilities, progress, and attention in one human-operated work context; it must not be illustrated as a task-manager board.

Recommended measure: `copy-measure` about 60–72 characters where practical (`PW7-OD-012`). That range is layout guidance, not an accessibility PASS or WCAG measurement. Alignment: start/left in LTR. Vertical air: `section-space-major` after header, `section-space-compact` before Layer B so maturity is not delayed. No reserved empty right column remains after omitting the supporting field.

Supporting field: omitted in the frozen baseline (`PW9-OD-004`). Editorial single-column hero is the actual frozen baseline, not a temporary fallback. A later abstract element needs new design authority, no new product claim, no hierarchy change, and a separate review.

```text
OWNER FROZEN TEXT-LED HERO — NO SUPPORTING FIELD IN BASELINE
```

---

## 14. Closed-Beta Composition

Layer B immediately after the hero support, still in the first reading stretch (`PW7-OD-005`; `PW4-OD-006`).

Exact copy:

`ZyntixAI is nu in gesloten bèta.`

`Inloggen is voor bestaande accounts.`

Not a hero headline, footer-only note, scarcity badge, exclusivity banner, waitlist, request access, register, or Start button. Inline status with associated utility copy. Recognisable without colour (text, not a filled chip as the only cue). Access later repeats the fuller no-new-account explanation because it answers a different question (what can I do now if I have no account). Layer B answers whether the product is generally available. The two statements must not be omitted on mobile because the other exists, and must not be stacked as two identical warning banners.

---

## 15. Value and Mechanism Composition

Continuous editorial flow (`PW7-OD-006`). Not a feature-card grid.

Owner-frozen visible H2 mapping (`PW9-OD-003`):

| Nav label | Frozen H2 | Candidate ID | Body |
| --- | --- | --- | --- |
| `Over ZyntixAI` | `Over ZyntixAI` | `over-zyntixai` | `PW6-COPY-046` |
| `Hoe het werkt` | `Hoe het werkt` | `hoe-het-werkt` | `PW6-COPY-047` |

Nav label and visible H2 are identical. This is assembly of already frozen language, not a PW-6 rewrite. No alternative marketing heading is added. Focus goes to the visible H2. Headings are not visually hidden and are not extra sequential tab stops.

```text
OWNER FROZEN H2 ASSEMBLY — IMPLEMENTATION AND BROWSER VALIDATION LATER-GATED
```

Visible objects remain in frozen copy: customers, work, responsibilities, progress, what needs attention; human operation; no autonomous AI; anti-replacement clause remains in the value body.

Distinct roles, without rewriting PW-6:

- `Over ZyntixAI` / `PW6-COPY-046` answers what work the product helps keep together, including the non-replacement limit.
- `Hoe het werkt` / `PW6-COPY-047` answers how relevant information stays with that work, and only then points to Today as a later bounded start.

The two sections must not paraphrase each other, swap those roles, or become a feature-card pair.

---

## 16. Today Proof Composition

Bounded product example after value and mechanism (`PW7-OD-007`). Text-only. Not a public demo, dashboard mockup, interactive preview, AI ranking, or definition of the whole product.

Exact heading: `Today als voorbeeld in het product`

Exact body: `PW6-COPY-048`

Owner-frozen treatment: compact editorial proof block (`PW9-OD-005`). An enclosed surface is allowed only when it bounds the example as proof, not when it creates the strongest product picture on the page. Default may remain editorial without a card. If enclosed, the surface must stay quieter and smaller than value and mechanism. No production data, customer data, screenshots, or invented UI. Qualifier remains in the same section after the claim. Course Seller follows as secondary relevance, not as a second proof window.

```text
OWNER FROZEN COMPACT EDITORIAL PROOF TREATMENT
```

---

## 17. Course Seller Composition

Secondary relevance after general explanation and Today (`PW7-OD-008`; `PW8-OD-003`). Normal `section` in `main`. Visual aside does not mean HTML `aside`. Not hero, not a vertical edition, not one of four equal cards, not LMS, not public catalogue, no extra CTA.

Exact heading: `Als je opleidingen of coaching geeft`

Exact body plus qualifier from `PW6-COPY-049` / `PW6-OD-008`.

Owner-frozen treatment: subtly separated editorial section (`PW9-OD-006`) — divider or secondary measure, still in source order. Visual separation must not suggest a new product edition. Removable without breaking the primary operator flow. Deferred audiences remain omitted.

```text
OWNER FROZEN SECONDARY EDITORIAL RELEVANCE SECTION
```

---

## 18. Trust Composition

Compact and factual (`PW7-OD-009`). Named controls only: signed-in access; organisation context; non-applicable parts out of view; Today within account and organisation context.

Exact heading: `Hoe toegang in het product werkt`

Exact body: `PW6-COPY-050`

Not certification, AVG/GDPR, SOC 2, ISO, absolute security, bank-level encryption, uptime, legal approval, full accessibility, or privacy guarantee. No badges, shields, or invented marks. Compact text, optionally a short semantic list that restates the same frozen sentences without adding claims. Trust remains its own titled section, not merged with access (`PW9-OD-007`).

---

## 19. Access and Honest-Stop Composition

Compact access panel (`PW7-OD-010`). Reading is a valid end.

Exact heading: `Toegang`

Exact copy:

`ZyntixAI is in gesloten bèta. Via deze site kun je geen nieuw account aanmaken.`

`Heb je al een account? Inloggen.`

`Heb je geen account, dan is deze pagina bedoeld om ZyntixAI te leren kennen.`

No waitlist, request access, contact, demo, trial, register, disabled fake buttons, coming-soon control, or scarcity. `Inloggen` is the same-purpose utility as the header, preferred 44×44 CSS px, minimum 24×24. Mobile order: status → Inloggen → honest stop. Honest stop is calm closing truth, not an error state (`PW8-STATE-034`). Access remains a compact panel after trust; the two blocks may look related but are not merged (`PW9-OD-007`).

```text
OWNER FROZEN SEPARATE TRUST AND ACCESS COMPOSITION
```

---

## 20. Footer Composition

Owner-frozen baseline: identity-only (`PW9-OD-011`). Allowed: `ZyntixAI` identity. This is a complete intentional close after access, not an unfinished stub, empty link column, or missing legal row. Visual weight and spacing remain PW-10/PW-11; R1 does not freeze footer styling. No required Inloggen repetition. No footer-only Sign in. No social, contact, pricing, careers, blog, address, invented legal entity, copyright without authority, or privacy/terms without a real destination and authority.

```text
OWNER FROZEN MINIMAL IDENTITY-ONLY FOOTER
```

Without real destination and authority, do not render:

Privacy, Terms, Contact, Pricing, Careers, Blog, social links, business address, legal entity name, copyright line, certification badges.

```text
EXTERNALLY GATED — DO NOT RENDER WITHOUT REAL DESTINATION AND AUTHORITY
```

---

## 21. Desktop Wireframe

Design context, not a frozen CSS breakpoint: a wide viewport where the three in-page labels plus `Inloggen` fit on one header row. Content-driven. No lorem ipsum. No colour, type, shadow, or radius tokens.

Bracketed notes in the ASCII below are governance-only. They are not visitor-visible labels, headings, or UI chrome.

Visitor-facing content in this wireframe is the frozen Route A2 sentences. Ellipsis is not used as substitute public copy.

```text
PW9-WF-001 — WIDE DESKTOP  (desired public `/`, unauthenticated)
MODEL-001 CALM EDITORIAL FLOW — OWNER FROZEN
DOM / FOCUS ORDER = VISUAL ORDER
EIGHT VISUAL CLUSTERS / TEN SEMANTIC REGIONS
NO HERO SUPPORTING FIELD / NO SCREENSHOT SLOT
MAX THREE ENCLOSED SURFACES
IDENTITY-ONLY FOOTER

[skip] Ga naar de hoofdinhoud ------------------> #hoofdinhoud

header
  ZyntixAI | Over ZyntixAI | Hoe het werkt | Gesloten bèta | Inloggen
  (brand start)   (in-page when live)                    (utility)

main#hoofdinhoud
  section.hero                          [governance: supporting field omitted]
    H1  Houd zicht op klanten, werk en voortgang.
    p   ZyntixAI helpt je als eigenaar van een klein bedrijf het
        dagelijkse werk te organiseren: klanten, verantwoordelijkheden,
        voortgang en wat aandacht nodig heeft.
    status (not H2)
        ZyntixAI is nu in gesloten bèta.
        Inloggen is voor bestaande accounts.

  section#over-zyntixai
    H2  Over ZyntixAI          [governance: frozen H2 = nav label]
    p   ZyntixAI is bedoeld om klanten, werk, verantwoordelijkheden
        en voortgang bij het werk te houden. Het vervangt niet al je
        andere tools.

  section#hoe-het-werkt
    H2  Hoe het werkt          [governance: frozen H2 = nav label]
    p   Relevante informatie over klanten, werk en verantwoordelijkheden
        blijft bij het werk waar het bij hoort. Toegelaten gebruikers
        kunnen daarna op Today een beperkt dagelijks startpunt zien.

  section#today                    [governance: optional enclosed surface 1 of 3]
    H2  Today als voorbeeld in het product
    p   Wie is toegelaten en ingelogd, begint op Today. Die pagina
        toont een beperkt dagelijks startpunt met aandachtspunten
        en toegewezen taken. Today is geen publieke demo en staat
        niet voor het hele product.
    [governance: no screenshot slot]

  section#opleidingen-en-coaching  [governance: optional enclosed surface 2 of 3]
    H2  Als je opleidingen of coaching geeft
    p   In die context kunnen toegelaten gebruikers werken met klanten,
        programma’s, inschrijvingen en voortgang.
    p   Dit is geen leeromgeving en geen open catalogus.

  section#hoe-toegang-werkt        [governance: not required as a card]
    H2  Hoe toegang in het product werkt
    p   ZyntixAI is bedoeld voor mensen die zijn ingelogd binnen hun
        organisatie. Wat voor jou niet geldt, blijft buiten beeld.
        Today gebruikt gegevens binnen de context van je ingelogde
        account en organisatie.

  section#toegang  [governance: enclosed surface 3 of 3 — compact panel]
    H2  Toegang
    p   ZyntixAI is in gesloten bèta. Via deze site kun je geen nieuw
        account aanmaken.
    p   Heb je al een account? Inloggen.
    p   Heb je geen account, dan is deze pagina bedoeld om ZyntixAI
        te leren kennen.

footer
  ZyntixAI
  [governance: legal links omitted — externally gated]
```

Asymmetric moment: header is brand-start / actions-end. Body is a start-aligned reading column, not a centred marketing poster. Hero supporting field is omitted in the frozen baseline. Screenshot slot is omitted. Trust and access remain separate. Value and mechanism stay one continuous editorial cadence. Today must not become the dominant product picture. Course Seller remains secondary. Identity-only footer is the intentional close. PW-10 may choose which quiet enclosed treatments stay within the budget.

---

## 22. Tablet Wireframe

Tablet is not a scaled desktop. Content-fit decides nav wrap vs disclosure. Bracketed notes are governance-only. Compressed lines such as `H2 Today + qualifier` point at the frozen PW-6 sentences; they are not alternate public copy.

```text
PW9-WF-002 — TABLET / CONSTRAINED DESKTOP
SAME CONTENT TRUTH AS DESKTOP
CONTENT-DRIVEN TRANSITION
NON-MODAL INLINE DISCLOSURE
INLOGGEN OUTSIDE DISCLOSURE WHERE FEASIBLE
NO SUPPORTING FIELD / NO SCREENSHOT SLOT
MAX THREE ENCLOSED SURFACES IF NEEDED; NOT A CARD CANVAS
TODAY MUST NOT OUTWEIGH VALUE/MECHANISM
COURSE SELLER REMAINS SECONDARY

header (static)
  ZyntixAI
  Over ZyntixAI    Hoe het werkt    Gesloten bèta     Inloggen
  [if the row no longer fits:]
  ZyntixAI                    [named disclosure trigger]     Inloggen
  disclosure region (non-modal, inline, not a dialog or drawer)
    Over ZyntixAI
    Hoe het werkt
    Gesloten bèta

main  single reading column; supporting field omitted
  H1 + support + Layer B both sentences
  H2 Over ZyntixAI + value body
  H2 Hoe het werkt + mechanism body
  H2 Today als voorbeeld in het product + frozen Today body + qualifier
  H2 Als je opleidingen of coaching geeft + frozen CS body + qualifier
  H2 Hoe toegang in het product werkt
  H2 Toegang  status → Inloggen → honest stop

footer  ZyntixAI   [identity only; intentional close]
```

No horizontal content carousel. No hidden core content. DOM/focus order unchanged. Beta, qualifiers, and both Sign-in placements remain. Disclosure is non-modal and inline. No reserved screenshot slot. No unexpected second content column. Asymmetric supporting fields may collapse; meaning does not.

---

## 23. Mobile Wireframe

One meaningful reading column. No horizontal scroll. No competing columns. No icon-only nav. No sticky mobile CTA. No bottom-sheet acquisition. No shortened mobile copy that drops product truth. No footer-only access.

```text
PW9-WF-003 — NARROW MOBILE
PW9-WF-004 — 320 CSS PX / 200% ZOOM RELATION  (same structure)
ONE MEANINGFUL COLUMN
NON-MODAL INLINE DISCLOSURE — NOT MODAL / NOT DRAWER BASELINE
MAX TWO ENCLOSED SURFACES
QUALIFIERS WITH THEIR CLAIMS
IDENTITY-ONLY FOOTER
NO SCREENSHOT SLOT
NO STICKY CTA
NO HORIZONTAL SCROLL
NO ICON-ONLY NAV
NO SHIFTED DOM ORDER
NO LOSS OF ACCESS INFORMATION
CLOSED BETA REMAINS VISIBLE

[skip] Ga naar de hoofdinhoud

header
  ZyntixAI                 Inloggen
  [named disclosure trigger]  button/summary, not icon-only
  panel (closed by default; opens inline): in-page labels in frozen order

main
  H1 wraps; objects remain in support
  Layer B both sentences wrap; not colour-only
  editorial stack: Over ZyntixAI → Hoe het werkt → Today →
    Course Seller → trust → access
  CS qualifier stays with CS heading
  enclosed surfaces: access panel required; Today or Course Seller
    may be enclosed, not automatically both
  access panel: status, Inloggen (24px min / 44px preferred), stop

footer
  ZyntixAI
```

Long Dutch strings (`verantwoordelijkheden`, `gesloten bèta`, `voortgang`) wrap inside `copy-measure`. Text-spacing override must not clip Sign in, disclosure, or qualifiers. 200% zoom uses the same one-column truth. 320 CSS px must not introduce horizontal scroll, hide qualifiers, drop closed-beta status, collapse navigation to icon-only, or reorder the DOM.

---

## 24. Grid, Container and Spacing Model

Low-fidelity roles. Not PW-10 tokens. Ranges below are wireframe guidance.

| ID | Role | Intent |
| --- | --- | --- |
| PW9-GRID-001 | `page-inline-safe` | Edge padding so 320 CSS px does not clip focus or targets |
| PW9-GRID-002 | `content-reading` | Primary reading column |
| PW9-GRID-003 | `content-wide` | Header, access close, footer |
| PW9-GRID-004 | `content-supporting` | Optional non-content field; omitted in frozen baseline (`PW9-OD-004`) |
| PW9-GRID-005 | `section-space-major` | Between visual clusters |
| PW9-GRID-006 | `section-space-compact` | Hero to Layer B; heading to body |
| PW9-GRID-007 | `cluster-gap` | Inside continuous value/mechanism |
| PW9-GRID-008 | `copy-measure` | About 60–72 characters where practical; layout guidance, not an accessibility or WCAG measurement |
| PW9-GRID-009 | `supporting-column` | Never carries unique meaning; unused in frozen baseline after `PW9-OD-004`; later-gated if a new supporting field is authorised |
| PW9-GRID-010 | Column count | 1 content column default; header may be 2 tracks (brand / actions); never 2 competing content columns on mobile |
| PW9-GRID-011 | Breakpoint trigger | Content-fit of nav and measure; not frozen `sm`/`md`/`lg` |
| PW9-GRID-012 | Full-width band | Not required; do not add a decorative full-bleed unless PW-10 proves it serves calm |

Minimums inherited, not invented: focus 2 CSS px outline + 2 CSS px offset; target 24×24 floor, 44×44 preference for header/nav/Sign in.

---

## 25. Surface and Card Governance

Not everything is a card.

| ID | Content | Surface |
| --- | --- | --- |
| PW9-SURF-001 | Hero | No card |
| PW9-SURF-002 | Beta | Inline status, not marketing badge |
| PW9-SURF-003 | Value / mechanism | Continuous editorial |
| PW9-SURF-004 | Today | Compact editorial proof; optional quiet surface (`PW9-OD-005`) |
| PW9-SURF-005 | Course Seller | Editorial supporting section; divider allowed (`PW9-OD-006`) |
| PW9-SURF-006 | Trust | Compact treatment, not a certification wall |
| PW9-SURF-007 | Access | One compact panel |
| PW9-SURF-008 | Footer | Simple utility zone |

Owner-frozen budget (`PW9-OD-008`):

Desktop, at most three enclosed surfaces:

1. Today proof, if a bounded surface is needed;
2. Course Seller, if subtle surface separation is used;
3. Access panel.

Mobile, at most two enclosed surfaces:

1. Today or Course Seller — not automatically both heavily enclosed;
2. Access panel.

Hero, beta, Over ZyntixAI, Hoe het werkt, and footer are not cards. Trust need not be a card. Enclosed surfaces must be functionally motivated. No product-card grid, nested cards, floating cards, or “everything is a card”. PW-10 may choose quiet surface treatment inside this maximum. Dividers do not count as cards.

```text
OWNER FROZEN SURFACE BUDGET — VISUAL TOKENS LATER-GATED
```

---

## 26. Visual-Asset Dependencies

| ID | Asset | Class | Rule |
| --- | --- | --- | --- |
| PW9-AST-001 | ZyntixAI wordmark / text identity | REQUIRED | Visible text identity; logo optional later if equivalent |
| PW9-AST-002 | Abstract supporting shape | OMITTED IN FROZEN BASELINE | Later abstract element needs new design authority; no product claim; omit-safe |
| PW9-AST-003 | Product screenshot | DEFERRED / HOLD | `PW7-OD-013`; `PW7-PROOF-001` |
| PW9-AST-004 | Today screenshot | DEFERRED / HOLD | Home is closed; not public proof |
| PW9-AST-005 | Dashboard mockup | PROHIBITED | Suggests non-existent public UI |
| PW9-AST-006 | Chatbot visual | PROHIBITED | |
| PW9-AST-007 | AI orb as explanation | PROHIBITED | |
| PW9-AST-008 | Four-target-group illustrations | PROHIBITED | |
| PW9-AST-009 | Icons | OPTIONAL / text-first | No essential meaning (`PW8-OD-012`) |
| PW9-AST-010 | Photography | DEFERRED | Not required |
| PW9-AST-011 | Customer logos | PROHIBITED without evidence | |
| PW9-AST-012 | Testimonial portraits | PROHIBITED without evidence | |
| PW9-AST-013 | Certification badges | PROHIBITED | |
| PW9-AST-014 | Motion / video | NOT REQUIRED | Page usable with none (`PW8-OD-011`) |

Background texture: not required. Future screenshot reservation is owner-frozen as no reserved slot (`PW9-OD-012`). No empty screenshot frame, reserved browser mockup, dormant dashboard slot, fabricated product preview, screenshot-dependent layout, or leftover space that makes the page look incomplete without an image. Today remains text-only. A future screenshot needs an approved product state, privacy/data review, product-truth review, responsive review, accessibility review, and new layout/design authority, without changing the frozen reading order.

```text
OWNER FROZEN NO-SCREENSHOT BASELINE
```

---

## 27. Component Composition

Composition inventory, not an implementation library.

| ID | Component | Semantic | Visible content | Layout | Responsive | Interactive | No-JS | A11y | Upstream | Downstream |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW9-COMP-001 | Public skip link | link | `Ga naar de hoofdinhoud` | First control | Visible on focus | Activate fragment | Native fragment | `PW8-SKIP-*` | PW-8 | PW-13 |
| PW9-COMP-002 | Public header | `header` | Brand + nav + utility | Static | Wrap / disclose | None as a unit | Visible | Banner | PW-7 | PW-13 |
| PW9-COMP-003 | Brand | text or link | `ZyntixAI` | Start of header | Wrap | Optional in-page top or future public `/`; never `/home` | Text | Visible name | PW-6 | PW-13 |
| PW9-COMP-004 | Desktop navigation | named `nav` | Frozen labels | Inline when fit | Disclose when not | Fragment when live | Headings remain | `PW8-NAME-003` | PW-6 | PW-13 |
| PW9-COMP-005 | Disclosure trigger | button / summary | Named text | Header end-adjacent | At disclosure threshold | Toggle | Native summary | Not icon-only | `PW9-OD-009` frozen | PW-13 implementation |
| PW9-COMP-006 | Mobile nav region | list in flow | Same labels | Non-modal inline | Hidden when closed | No trap | Headings or details | `PW8-NAV-*` | `PW9-OD-009` frozen | PW-13 implementation |
| PW9-COMP-007 | Sign in utility | link | `Inloggen` | Header and access | Outside disclosure | `/login` | Real link | Shared purpose | PW-6 | PW-13 |
| PW9-COMP-008 | Hero | `section` | Frozen H1 + support | Reading; supporting field omitted | Single column | None | Complete | One H1 | `PW9-OD-004` frozen | PW-10 visual |
| PW9-COMP-009 | Beta status | text | Frozen Layer B | Associated to hero | Wrap | None | Visible | Not alert | PW-6/7 | PW-10 |
| PW9-COMP-010 | Value section | `section` | Frozen H2 `Over ZyntixAI` + `PW6-COPY-046` | Editorial | Stack | Anchor target | Complete | H2 | `PW9-OD-003` frozen | PW-13 implementation |
| PW9-COMP-011 | Mechanism section | `section` | Frozen H2 `Hoe het werkt` + `PW6-COPY-047` | Editorial | Stack | Anchor target | Complete | H2 | `PW9-OD-003` frozen | PW-13 implementation |
| PW9-COMP-012 | Today proof | `section` | Frozen Today copy | Compact editorial proof | Stack | None | Complete | H2 | `PW9-OD-005` frozen | PW-10 visual |
| PW9-COMP-013 | Course Seller | `section` | Frozen CS copy | Subtly separated editorial | Intact unit | None | Complete | Not complementary landmark | `PW9-OD-006` frozen | PW-10 visual |
| PW9-COMP-014 | Trust | `section` | Frozen trust copy | Compact; separate from access | Stack | None | Complete | Named controls | `PW9-OD-007` frozen | PW-10 visual |
| PW9-COMP-015 | Access panel | `section` | Frozen access copy | Compact panel after trust | Status → link → stop | Sign in | Complete | Honest stop not error | `PW9-OD-007` frozen | PW-13 implementation |
| PW9-COMP-016 | Footer | `footer` | `ZyntixAI` identity only | Wide | Wraps | None unless later gated links | Identity | Contentinfo | `PW9-OD-011` frozen | PW-14 publication |
| PW9-COMP-017 | In-page target | heading | Visible H2 | In flow | Not under header | Temporary focus | Native fragment | Model B | `PW9-OD-010` candidate | PW-13 implementation |
| PW9-COMP-018 | Section heading | H1/H2 | Frozen H1; frozen H2s | Reading | Wrap | Not a tab stop | Visible | Levels = structure | `PW9-OD-003` frozen | PW-12 validation |
| PW9-COMP-019 | Body link | link | `Inloggen` in access | In sentence/panel | Recognisable without colour only | `/login` | Real href | `PW8-OD-009` | PW-8 | PW-11 |
| PW9-COMP-020 | Optional supporting field | omitted in baseline | None | `content-supporting` unused | Omit | None | Page complete without it | No empty visual column | `PW9-OD-004` frozen | PW-10 only if new authority |

No component is implemented, tested, accessibility-passed, production-verified, or publication-ready. Owner layout dependency is frozen. Visual-system, implementation, and accessibility-validation dependencies remain open.

---

## 28. State Wireframes

| ID | State | Class | Wireframe note |
| --- | --- | --- | --- |
| PW9-STATE-001 | Wide desktop | Required wireframe | `PW9-WF-001` |
| PW9-STATE-002 | Constrained desktop | Required wireframe | Wrap then disclose |
| PW9-STATE-003 | Tablet with full nav | Required wireframe | `PW9-WF-002` full row |
| PW9-STATE-004 | Tablet with disclosure | Required wireframe | Non-modal inline |
| PW9-STATE-005 | Narrow mobile | Required wireframe | `PW9-WF-003` |
| PW9-STATE-006 | 320 CSS px | Required wireframe | `PW9-WF-004`; no 2D scroll |
| PW9-STATE-007 | 200% zoom/reflow | Required wireframe | Same one-column truth |
| PW9-STATE-008 | Text-spacing override | Conceptual behaviour | Qualifiers and Sign in remain |
| PW9-STATE-009 | No-JavaScript | Required wireframe | Core + essential nav remain |
| PW9-STATE-010 | Reduced motion | Conceptual behaviour | No required animation |
| PW9-STATE-011 | Forced colours | Conceptual behaviour | Structure without custom fills |
| PW9-STATE-012 | Keyboard focus on skip | Required wireframe | First control visible |
| PW9-STATE-013 | Keyboard focus on nav | Required wireframe | Visible 2px + 2px offset space |
| PW9-STATE-014 | Disclosure closed | Required wireframe | In-page links not in tab order |
| PW9-STATE-015 | Disclosure open | Required wireframe | In flow; no trap; Sign in still outside |
| PW9-STATE-016 | Focus after in-page nav | Conceptual behaviour | Destination H2; not under header |
| PW9-STATE-017 | Authenticated arrival at desired `/` | Conceptual behaviour | Not the public marketing page |
| PW9-STATE-018 | Unauthenticated public arrival | Required wireframe | Desired public state; not current `/` |
| PW9-STATE-019 | Missing anchor destination | Prohibited | Do not render the link (`PW8-ERROR-002`) |
| PW9-STATE-020 | Missing legal destination | Omitted | Do not render (`PW8-ERROR-010`) |

Owner layout is no longer an open dependency for these states. Visual execution, implementation, and accessibility validation remain open. No state is implemented, tested, accessibility-passed, production-verified, or publication-ready.

Later implementation validation remains PW-12/13. Not applicable: authenticated public-homepage variant as a primary flow.

---

## 29. Authenticated Arrival and Root Model

Root Model A remains desired IA (`PW4-OD-001`):

- unauthenticated `/` should eventually show this public homepage;
- authenticated `/` conceptually retains membership/onboarding-aware entry.

PW-9 does not implement this. An authenticated user must not be held on a marketing homepage when the root resolver should send them to product or onboarding. No authenticated variant of the public homepage is designed as a primary flow.

| Topic | PW-9 statement |
| --- | --- |
| Desired public state | Unauthenticated visitors see the wireframed page |
| Authenticated bypass | Resolver continues to send signed-in users to governed product/onboarding entry |
| Stale session | Auth messaging stays on auth surfaces |
| Routing owner | PW-13 |
| Regression | Authenticated Home and AppShell skip-link tests remain green |

---

## 30. Density and Premium Criteria

| ID | Budget |
| --- | --- |
| PW9-DENS-001 | At most one primary message per viewport zone (hero; then beta; then value) |
| PW9-DENS-002 | At most three enclosed surfaces on desktop; two on mobile |
| PW9-DENS-003 | At most two simultaneous accent levels (heading; body). Status is text, not a third promotional accent |
| PW9-DENS-004 | Exactly four header items: three in-page + one utility |
| PW9-DENS-005 | Sign in at most twice (header, access); footer omit by default |
| PW9-DENS-006 | Closed beta: early Layer B plus fuller access explanation; not a third banner |
| PW9-DENS-007 | Qualifiers immediately after their claim |
| PW9-DENS-008 | Eight visual clusters; no additional marketing bands |

Premium here means controlled hierarchy, breathing room, consistent alignment, limited visual competition, typographic composition, content before decoration, calm surfaces, precise qualifiers, and no fake scale.

| ID | Anti-pattern |
| --- | --- |
| PW9-ANTI-001 | Chatbot or AI-orb hero |
| PW9-ANTI-002 | Neon / glass / gradient as content substitute |
| PW9-ANTI-003 | Enormous empty hero |
| PW9-ANTI-004 | Feature-card grid |
| PW9-ANTI-005 | Floating arbitrary cards |
| PW9-ANTI-006 | Four audience editions |
| PW9-ANTI-007 | Screenshot-as-live-product |
| PW9-ANTI-008 | Sticky mobile acquisition bar |
| PW9-ANTI-009 | Modal mobile menu |
| PW9-ANTI-010 | Icon-only essential meaning |
| PW9-ANTI-011 | Certification wall |
| PW9-ANTI-012 | Testimonial / logo strip |
| PW9-ANTI-013 | Pricing or trial band |
| PW9-ANTI-014 | Motion as quality substitute |
| PW9-ANTI-015 | DOM order different from visual order |
| PW9-ANTI-016 | Treating this wireframe as publication-ready design |
| PW9-ANTI-017 | Incomplete screenshot placeholder or reserved empty product frame |
| PW9-ANTI-018 | Enterprise-scale site chrome without corresponding product truth |

These values are design governance, not proven UX optima.

---

## 31. Risk Register

Non-defect future-risk scale: CRITICAL / HIGH / MEDIUM / LOW.

| ID | Risk | Severity | Trigger | Impact | Prevention | Source | Owner | Closure |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW9-RSK-001 | Homepage looks like a chatbot | HIGH | Orb, chat UI, AI hero | Wrong category | No AI visual; AI copy inactive | PW-1/3/6 | PW-10 | Visual review |
| PW9-RSK-002 | Hero looks like a task manager | HIGH | Checklist/kanban mock | Narrowed product | Keep objects in support; no task UI | PW-1 | PW-10 | Copy/layout review |
| PW9-RSK-003 | Today defines the whole product | HIGH | Giant Today panel | Over-proof | Compact proof after value/mechanism | PW6-OD-007 | PW-10 | `PW9-VAL-005` |
| PW9-RSK-004 | Course Sellers define the brand | HIGH | CS in hero or equal cards | Wrong primary | Secondary section after Today | PW5-OD-001 | PW-10 | `PW9-VAL-006` |
| PW9-RSK-005 | Course Seller looks like an LMS | HIGH | Catalogue/learner imagery | False product | Frozen qualifier; no LMS art | PW6-OD-008 | PW-10 | `PW9-VAL-007` |
| PW9-RSK-006 | Four audiences look available | HIGH | Equal TG cards | False availability | Omit deferred TGs | PW5-OD-002 | PW-10 | `PW9-VAL-008` |
| PW9-RSK-007 | Closed beta appears too late | HIGH | Footer-only maturity | Over-promise | Layer B after hero | PW4-OD-006 | PW-12 | `PW9-VAL-003` |
| PW9-RSK-008 | Inloggen looks like acquisition | HIGH | Button styling / Start label | False join path | Utility treatment both placements | PW6-OD-011 | PW-10 | `PW9-VAL-004` |
| PW9-RSK-009 | Page has no action and feels broken | MEDIUM | Weak hierarchy at access | Abandoned reading | Honest stop as designed outcome | PW3-MSG-014 | PW-12 | `PW9-VAL-023` |
| PW9-RSK-010 | Honest stop feels like an error | MEDIUM | Alert styling | Shame / fake defect | Not `alert`; calm panel | PW-8 | PW-10 | `PW9-VAL-023` |
| PW9-RSK-011 | Layout suggests a public demo | HIGH | Interactive Today | Privacy / truth | Text-only proof | PW7-OD-007 | PW-13 | HOLD screenshots |
| PW9-RSK-012 | Supporting visual suggests missing UI | HIGH | Fake dashboard | Invented capability | Omit supporting field | PW7-OD-013 | PW-10 | `PW9-OD-004` |
| PW9-RSK-013 | Too many cards | MEDIUM | Canvas model | Noise | Surface budget | PW7-OD-012 | PW-10 | `PW9-OD-008` |
| PW9-RSK-014 | Too much whitespace | MEDIUM | Poster hero | Weak credibility | Compact hero-to-beta | PW9-PRIN-001 | PW-10 | Density review |
| PW9-RSK-015 | Page too long | MEDIUM | Extra bands | Fatigue | Eight clusters only | PW7-OD-012 | PW-12 | `PW9-VAL-021` |
| PW9-RSK-016 | Qualifier load too high | MEDIUM | Repeated disclaimers | Unread qualifiers | One qualifier per claim | PW-6 | PW-12 | Density review |
| PW9-RSK-017 | Trust looks like certification | HIGH | Badges / SOC copy | Legal overclaim | Named controls only | PW6-OD-010 | PW-10 | `PW9-VAL-028` |
| PW9-RSK-018 | Mobile disclosure becomes modal | HIGH | Dialog pattern | Trap / OD breach | Non-modal inline | PW8-OD-006 | PW-13 | `PW9-VAL-018` |
| PW9-RSK-019 | Inloggen disappears inside disclosure | HIGH | Utility inside menu only | Lost existing-account path | Outside where feasible | PW7-OD-003 | PW-13 | `PW9-VAL-004` |
| PW9-RSK-020 | DOM and visual order diverge | HIGH | CSS order / sticky columns | SR confusion | Source order = meaning | PW8-PRIN-003 | PW-13 | `PW9-VAL-019` |
| PW9-RSK-021 | Anchors miss destinations | HIGH | `href="#"` | Dead exploration | Destination exists first | PW8-ANCHOR-002 | PW-13 | `PW9-VAL-017` |
| PW9-RSK-022 | Focus hidden behind header | MEDIUM | Later sticky | Lost arrival | Static header; offset if sticky later | PW7-OD-004 | PW-13 | `PW9-VAL-017` |
| PW9-RSK-023 | 320px causes horizontal scroll | HIGH | Fixed widths / nowrap | WCAG 1.4.10-oriented miss | One column; wrap labels | PW8-OD-014 | PW-12 | `PW9-VAL-011` |
| PW9-RSK-024 | 200% zoom loses content | HIGH | Clipped header | Lost Sign in / qualifiers | Wrap; no essential 2D scroll | PW8-OD-014 | PW-12 | `PW9-VAL-012` |
| PW9-RSK-025 | No-JS hides navigation | HIGH | Client-only menu | Lost exploration | details or headings | PW8-OD-016 | PW-13 | `PW9-VAL-014` |
| PW9-RSK-026 | Dutch labels do not fit | MEDIUM | Long words | Truncation | Wrap; `Bèta` only where PW-6 allows | PW6-RESP-011 | PW-12 | `PW9-VAL-024` |
| PW9-RSK-027 | Root model described as implemented | CRITICAL | PW-9 wording | False architecture | Desired ≠ current | PW-4 | This file | Review language |
| PW9-RSK-028 | Shared CSS affects Home | CRITICAL | Editing `globals.css` | Protected Home | Public-only later sheet | PW0-PB-019 | PW-13 | Home tests |
| PW9-RSK-029 | PW-9 precedes PW-10 tokens | MEDIUM | Pixel freeze here | Dual authority | Named roles only | This file | PW-10 | Owner freeze closed the layout decision; visual execution remains unknown |
| PW9-RSK-030 | Wireframe taken as publication-ready | HIGH | Stakeholder over-read | Premature launch | Status formula | B1-GATE.1 | PW-14 | No publication claim |
| PW9-RSK-031 | Keyboard focus space ignored in visuals | MEDIUM | Tight header | Invisible 2px ring | Reserve focus offset | PW8-OD-007 | PW-10 | `PW9-VAL-016` |
| PW9-RSK-032 | Course Seller HTML `aside` | HIGH | Visual aside → landmark | SR skip | `section` in `main` | PW8-OD-003 | PW-13 | Markup review |
| PW9-RSK-033 | Visual execution remains unknown after freeze | MEDIUM | Tokens unset; sparse or loud styling | Layout looks unfinished or over-designed | Keep named roles; no pixel freeze here | This freeze | PW-10 / PW-11 | Visual-system review |
| PW9-RSK-034 | Surface budget misapplied | HIGH | Cards on hero, value, or trust | Canvas look | Max 3 desktop / 2 mobile enclosed | `PW9-OD-008` | PW-10 | Surface review |
| PW9-RSK-035 | Editorial layout becomes too sparse | MEDIUM | Large empty zones | Weak credibility | Density criteria; compact hero-to-beta | `PW9-PRIN-001` | PW-10 | Density review |
| PW9-RSK-036 | No screenshot weakens product specificity | MEDIUM | Text-only Today without objects | Abstract product | Keep qualifier and work objects; no fake preview | `PW9-OD-012` | PW-10 | Proof review |
| PW9-RSK-037 | Trust and access visually merge | MEDIUM | One shared card wrapping both | Semantic collapse | Separate titled blocks; related but not merged | `PW9-OD-007` | PW-10 | Composition review |
| PW9-RSK-038 | Inline disclosure implemented as drawer | HIGH | Drawer, dialog, or overlay in code | OD-009 breach | Non-modal inline; no trap; no required backdrop | `PW9-OD-009` | PW-13 | `PW9-VAL-018` |
| PW9-RSK-039 | Identity-only footer looks unfinished | MEDIUM | Empty link columns or missing copyright row | Incomplete-site reading | Identity is the intentional close; no invented legal links | `PW9-OD-011` | PW-10 / PW-14 | `PW9-VAL-030` |
| PW9-RSK-040 | H1 styled as an outcome guarantee | HIGH | Oversized `Houd zicht` lockup | False promise | Orientation, not a result metric | `PW6-RSK-031` | PW-10 | `PW9-VAL-031` |
| PW9-RSK-041 | Closing reads as a restriction dump | MEDIUM | Trust + access + beta stacked as warnings | Governance-only last impression | Value/mechanism first; compact named controls; calm stop | PW-3/6 | PW-10 | `PW9-VAL-032` |
| PW9-RSK-042 | Supporting column restored without authority | HIGH | Empty right column after OD-004 | Missing-UI implication | Keep `content-supporting` unused in baseline | `PW9-OD-004` | PW-10 | `PW9-VAL-029` |

An owner decision closes only the decision-uncertainty portion of a risk. It does not close implementation or validation risk. All validations remain `PLANNED — NOT EXECUTED`. All thresholds remain `PROPOSED — NOT ACHIEVED`.

---

## 32. Validation Plan

Every row: `PLANNED — NOT EXECUTED`. Every threshold: `PROPOSED — NOT ACHIEVED`.

| ID | Validation | Method | Threshold | Evidence later |
| --- | --- | --- | --- | --- |
| PW9-VAL-001 | Five-second hierarchy | Expert review | Operator work visible before CS/AI | Notes |
| PW9-VAL-002 | Operator-primary comprehension | Expert review | `PW2-VIS-001` is the apparent audience | Notes |
| PW9-VAL-003 | Closed-beta visibility | Visual + reading | Both Layer B sentences before value H2 | Notes |
| PW9-VAL-004 | Sign in utility | Visual + keyboard | Utility, not Start/Join; two placements | Notes |
| PW9-VAL-005 | Today scope | Reading | Bounded example; not whole product | Notes |
| PW9-VAL-006 | Course Seller secondary | Visual + outline | After Today; not hero | Notes |
| PW9-VAL-007 | Non-LMS interpretation | Reading | Qualifier present; no catalogue UI | Notes |
| PW9-VAL-008 | No four editions | Visual | Deferred TGs absent | Notes |
| PW9-VAL-009 | Desktop reading flow | Walkthrough | Matches `PW9-WF-001` | Notes |
| PW9-VAL-010 | Tablet transition | Walkthrough | Fit-or-disclose; no carousel | Notes |
| PW9-VAL-011 | Mobile 320px | Viewport | No essential 2D scroll | Notes |
| PW9-VAL-012 | 200% zoom layout | Browser zoom | No lost Sign in / qualifiers | Notes |
| PW9-VAL-013 | Text-spacing | 1.4.12 CSS | No overlap | Notes |
| PW9-VAL-014 | No-JavaScript content | Disable JS | Core + essential nav remain | Notes |
| PW9-VAL-015 | Keyboard focus order | Keyboard | Matches DOM | Notes |
| PW9-VAL-016 | Skip-link wireframe | Keyboard | First focus; to `main` | Notes |
| PW9-VAL-017 | Anchor/focus | Keyboard | Model B when live | Notes |
| PW9-VAL-018 | Disclosure open/closed | Keyboard + pointer | Non-modal; no trap | Notes |
| PW9-VAL-019 | Screen-reader reading order | Manual SR | Matches clusters 1–8 | Notes |
| PW9-VAL-020 | Forced-colours structure | Forced-colour mode | Headings/links/status remain | Notes |
| PW9-VAL-021 | Content density | Expert review | Eight clusters; surface budget | Notes |
| PW9-VAL-022 | Premium/calm perception | Expert review | No loud marketing system | Notes |
| PW9-VAL-023 | Honest-stop comprehension | Reading | Valid end, not error | Notes |
| PW9-VAL-024 | Dutch label fit | Inspection | No meaning truncation | Notes |
| PW9-VAL-025 | Authenticated-root bypass | Architecture review | Signed-in users not trapped on marketing | Notes |
| PW9-VAL-026 | Protected Home impact | Tests later | AppShell/Home unchanged | Tests |
| PW9-VAL-027 | Stakeholder copy/layout coherence | Review | Frozen sentences quoted | Notes |
| PW9-VAL-028 | Trust named-controls only | Reading | No certification implication | Notes |
| PW9-VAL-029 | No-screenshot completeness | Expert review | Page reads complete without image or reserved frame | Notes |
| PW9-VAL-030 | Identity-only footer | Expert review | Intentional close, not an unfinished stub | Notes |
| PW9-VAL-031 | H1 not a guarantee | Visual + reading | `Houd zicht` remains orientation | Notes |
| PW9-VAL-032 | Closing not restriction-only | Reading | Operational value precedes limits; stop is calm | Notes |
| PW9-VAL-033 | Surface-budget application | Inspection | ≤3 enclosed desktop; ≤2 mobile; no card canvas | Notes |
| PW9-VAL-034 | Value vs mechanism roles | Reading | Organising vs how attention stays with work | Notes |

No results are fabricated.

---

## 33. Open Questions

Establishment statuses are preserved as history. Current classification follows the owner freeze. `OWNER DECISION RESOLVED` is distinct from a resolved downstream condition.

| ID | Question | Class | Notes | Status |
| --- | --- | --- | --- | --- |
| PW9-Q-001 | Definitive composition model | Owner layout | MODEL-001 frozen | `RESOLVED BY OWNER` |
| PW9-Q-002 | Visible H2 mapping | Owner / assembly | Nav labels frozen as H2s | `RESOLVED BY OWNER` |
| PW9-Q-003 | Exact visual cluster count | Owner layout | Eight clusters; ten semantic regions | `RESOLVED BY OWNER` |
| PW9-Q-004 | Hero supporting field | Owner layout | None in frozen baseline | `RESOLVED BY OWNER` |
| PW9-Q-005 | Today proof surface | Owner layout | Compact editorial proof | `RESOLVED BY OWNER` |
| PW9-Q-006 | Course Seller visual treatment | Owner layout | Subtly separated editorial section | `RESOLVED BY OWNER` |
| PW9-Q-007 | Trust and access together or apart | Owner layout | Two separate compact blocks | `RESOLVED BY OWNER` |
| PW9-Q-008 | Maximum surface count | Owner layout | 3 desktop / 2 mobile enclosed | `RESOLVED BY OWNER` |
| PW9-Q-009 | Section background alternation | PW-10 visual | No colour freeze here | `OPEN — PW-10 VISUAL SYSTEM` |
| PW9-Q-010 | Mobile disclosure presentation | Owner, inside PW-7/8 | Non-modal inline frozen; visible chrome label later | `PARTIALLY RESOLVED BY OWNER` |
| PW9-Q-011 | Optional active-section indication | Optional later | `PW8-Q-015`; not a layout freeze | `OPEN — PW-12 VALIDATION` |
| PW9-Q-012 | Footer repetition | Owner layout | Identity only | `RESOLVED BY OWNER` |
| PW9-Q-013 | Future screenshot slot | Owner layout | No reserved slot | `RESOLVED BY OWNER` |
| PW9-Q-014 | Legal footer | External legal | Do not render without authority | `EXTERNALLY GATED — LEGAL` |
| PW9-Q-015 | Authenticated root bypass | PW-13 | Desired IA only | `OPEN — PW-13 IMPLEMENTATION` |
| PW9-Q-016 | Final anchor IDs | Owner layout | Candidate set frozen; not implemented | `PARTIALLY RESOLVED BY OWNER` |
| PW9-Q-017 | Disclosure visible label | Assembly / chrome | Named text required; exact label later | `PARTIALLY RESOLVED BY OWNER` |
| PW9-Q-018 | Final spacing/colour/type | PW-10 / PW-11 | Named roles only | `OPEN — PW-10 VISUAL SYSTEM` |

Reconciliation: total 18; resolved by owner 10; partially resolved by owner 3; open PW-10 visual system 2; open PW-11 high-fidelity 0; open PW-12 validation 1; open PW-13 implementation 1; open PW-14 publication 0; externally gated legal 1.

PW-1 product truth is not reopened.

---

## 34. Owner Decision Register

Existing IDs `PW9-OD-001` through `PW9-OD-012` are retained without renumbering. Historical alternatives remain. Establishment status for every row was `OPEN — OWNER DECISION REQUIRED`. Current status for every row is `RESOLVED — OWNER FROZEN`.

```text
OWNER DECISION RESOLVED ≠ DOWNSTREAM CONDITION RESOLVED
```

Owner authority for every row: `EXPLICIT ZYNTIXAI OWNER HOMEPAGE WIREFRAME & LAYOUT DECISION`. Freeze date for every row: `2026-09-16`. Baseline HEAD: `0b453cfdbc678309bed47c1fef75d0155aa3eac4`.

| ID | Question | Options | Recommendation | Conservative default | Rationale | Upstream | Downstream gates | Selected option | Resulting requirement | Remaining downstream condition | Reverification trigger | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW9-OD-001 | Homepage composition model | MODEL-001 / 002 / 003 | Calm Editorial / asymmetric narrative with editorial fallback | MODEL-001 single reading column | Fits VIS-001, PW-7, calm premium | PW7-OD-001 | PW-9-R1; PW-10 | `MODEL-001 — CALM EDITORIAL FLOW` | Calm vertical editorial flow; PW-7 asymmetric narrative supporting only; one reading order; coherent without supporting visual; conservative single-column fallback mandatory; MODEL-002/003 historical, not co-leading | Visual tokens; high-fidelity; implementation; validation | Supporting visual or MODEL-002/003 reintroduced as co-leading | `RESOLVED — OWNER FROZEN` |
| PW9-OD-002 | Section and cluster structure | 8 clusters as mapped / merge trust+access / other | Eight clusters `PW9-ZONE-001`–`008` | Eight clusters | Matches `PW7-OD-012` | PW-5/7 | PW-10 | Eight visual clusters; ten semantic regions; `PW9-ZONE-001`–`008`; `PW9-SEC-001`–`010` | Header; hero+early Layer B; Over ZyntixAI; Hoe het werkt; Today; Course Seller; Trust; Access and close. Footer is a semantic region, not an extra marketing cluster. DOM order = reading order. No extra feature-grid, four audience clusters, or standalone AI/BOS cluster | Visual grouping tokens | Extra cluster, feature-grid, or merged trust+access | `RESOLVED — OWNER FROZEN` |
| PW9-OD-003 | Visible H2 mapping | Nav labels as H2s / later new copy / no H2s | `Over ZyntixAI` and `Hoe het werkt` as H2s | Reuse nav labels; no invented marketing H2 | Closes `PW8-Q-028` without rewriting PW-6 | PW-6/8 | PW-13 anchors | Visible H2 `Over ZyntixAI`; visible H2 `Hoe het werkt` | Nav label equals visible H2; in-page destination is the titled section; focus moves to the visible H2; no extra tab stop; headings not visually hidden; one H1; logical heading levels | Implementation of IDs and focus; browser validation | Alternate marketing H2 or hidden heading | `RESOLVED — OWNER FROZEN` |
| PW9-OD-004 | Hero supporting field | none / optional abstract / reserved proof slot | None required; optional abstract only if no product claim | None | Text-first; HOLD screenshots | PW7-OD-002/013 | PW-10 | No hero supporting field in the frozen baseline | Text-led single-column hero; no required image, abstract field, screenshot, dashboard mockup, chatbot window, AI orb, floating cards, or reserved empty visual column | Later abstract element needs new design authority | Hero image, visual column, or implied missing UI | `RESOLVED — OWNER FROZEN` |
| PW9-OD-005 | Today proof treatment | editorial block / compact proof surface | Compact editorial proof block | Editorial block | Bounded; not a window onto Home | PW7-OD-007 | PW-10 | Compact editorial proof block | Text-only; after value and mechanism; bounded example; not a public demo; not the whole product; not AI-ranked; no screenshot/mockup/browser/dashboard frame or invented data; qualifier visible; quiet surface allowed if not heavier than general explanation | Quiet surface tokens inside budget | Screenshot, interactive mockup, or Today-as-product | `RESOLVED — OWNER FROZEN` |
| PW9-OD-006 | Course Seller visual treatment | continuous editorial / subtly separated section | Subtly separated editorial section | Continuous editorial | Secondary without HTML `aside` | PW7-OD-008; PW8-OD-003 | PW-10 | Subtly separated editorial section | Normal titled `section` in `main`; not HTML `aside`; after Today; secondary; not brand-primary; no extra CTA, LMS look, catalogue, complete-edition look, or four audiences; qualifier attached; removable without breaking primary flow | Visual separation tokens | CS as hero, edition, LMS, or HTML `aside` | `RESOLVED — OWNER FROZEN` |
| PW9-OD-007 | Trust and access | separate compact blocks / one combined close | Separate compact blocks | Separate | Named-controls ≠ honest stop | PW7-OD-009/010 | PW-10 | Two separate compact blocks | Trust: titled section; named controls; compact text/list; no badge wall, keurmerk, compliance claim, or certification look. Access: compact panel after trust; closed-beta repeat; existing-account Sign in; honest stop; not an error; no fake CTA, waitlist, request access, contact, or register. Related visually allowed; not merged | Visual relatedness without merge | Combined panel or certification wall | `RESOLVED — OWNER FROZEN` |
| PW9-OD-008 | Surface/card budget | 0–1 / 3 desktop 2 mobile / canvas | Max 3 enclosed desktop, 2 mobile | 0 product-card grids | Prevents canvas model | PW7-OD-012 | PW-10 | Desktop max three enclosed surfaces; mobile max two | Recommended enclosed: desktop Today / Course Seller / Access; mobile Today-or-CS plus Access. Hero, beta, Over ZyntixAI, Hoe het werkt, footer are not cards; trust need not be a card; no nested or floating product-card grid | Which quiet treatments PW-10 uses inside the maximum | Card canvas or extra enclosed surfaces | `RESOLVED — OWNER FROZEN` |
| PW9-OD-009 | Mobile disclosure presentation | inline details / button+region / other within PW-7/8 | Non-modal inline; named trigger; Sign in outside | Native `details` fallback | Already frozen in PW-7/8 | PW7-OD-003; PW8-OD-006 | PW-13 | Non-modal inline disclosure | Full nav visible while it fits; disclosure only when content-fit requires it; non-modal; opens inline; no dialog, drawer baseline, full-screen overlay, focus trap, or required backdrop; `Inloggen` outside where feasible; named text trigger; correct expanded/collapsed; meaningful no-JS alternative; closed and open states later in high-fidelity; Escape only if enhanced implementation requires it | High-fidelity closed/open states; implementation; exact chrome label | Drawer, dialog, overlay, or icon-only trigger | `RESOLVED — OWNER FROZEN` |
| PW9-OD-010 | Candidate anchor-ID set | `PW9-ANCHOR-001`–`007` / alternate slugs | Adopt the candidate set | Do not implement until destinations exist | Dutch, stable, semantic | PW-8 | PW-13 | Existing `PW9-ANCHOR-001`–`007` unchanged | Frozen as candidate implementation contract, not implemented. Values: `hoofdinhoud`; `over-zyntixai`; `hoe-het-werkt`; `today`; `opleidingen-en-coaching`; `hoe-toegang-werkt`; `toegang`. No `href="#"`; no `/login` or `/home` as in-page destination | Implementation of destinations and focus | Silent rename, dead hash, or product-page fake destination | `RESOLVED — OWNER FROZEN` |
| PW9-OD-011 | Footer repetition | identity only / +availability / +Inloggen | Identity only | No footer Sign in | Avoid third acquisition-looking control | PW7-OD-011 | PW-10 | Identity-only footer baseline | `ZyntixAI` identity; no required Inloggen repeat; no footer-only Sign in; no social, contact, pricing, careers, blog, address, invented legal entity, copyright without authority, or privacy/terms without real destination and authority | Legal destinations if later authorized | Ungated legal/social/contact footer | `RESOLVED — OWNER FROZEN` |
| PW9-OD-012 | Future screenshot reservation | no slot / dormant optional / later redesign only | No slot | No slot | HOLD; page complete in text | PW7-OD-007/013 | PW-10 | No reserved screenshot slot | No empty screenshot frame, reserved browser mockup, dormant dashboard slot, fabricated preview, screenshot-dependent layout, or leftover incomplete space. Today remains text-only. Future screenshot needs product-state, privacy, truth, responsive, accessibility, and new layout/design authority | New layout/design authority if a real screenshot is later approved | Reserved empty screenshot frame | `RESOLVED — OWNER FROZEN` |

Decision-count reconciliation: total 12; fully resolved 12; partially resolved 0; open owner layout decisions 0.

---

## 35. Traceability

| ID | PW-9 coverage | Upstream |
| --- | --- | --- |
| PW9-MAP-001 | Protected boundaries; no Home/AppShell/globals mutation | `PW0-PB-008`; `PW0-PB-019`; `PW0-RQ-002`; `PW0-RQ-005` |
| PW9-MAP-002 | Truth ceiling; no join/demo; Today/CS/AI limits | `PW1-CLM-014`; `PW1-CLM-015`; `PW1-CLM-018`; `PW1-PRH-003`; `PW1-PRH-022` |
| PW9-MAP-003 | Operator-primary visitor | `PW2-OD-001`; `PW2-VIS-001` |
| PW9-MAP-004 | Positioning; Sign in utility; maturity; CS secondary | `PW3-MSG-001`; `PW3-MSG-002`; `PW3-MSG-005`; `PW3-MSG-007`; `PW3-MSG-009`; `PW3-MSG-010`; `PW3-POS-001` |
| PW9-MAP-005 | Root Model A desired; in-page; early Layer B | `PW4-OD-001`; `PW4-OD-004`; `PW4-OD-005`; `PW4-OD-006`; `PW4-NAV-001`; `PW4-NAV-002`; `PW4-NAV-003`; `PW4-NAV-005` |
| PW9-MAP-006 | Content model; CS secondary; AI conditional; omitted TGs | `PW5-OD-001`; `PW5-OD-002`; `PW5-OD-003`; `PW5-OD-008`; `PW5-BLK-001`; `PW5-BLK-002`; `PW5-BLK-007` |
| PW9-MAP-007 | Frozen Route A2 copy | `PW6-OD-002`; `PW6-OD-003`; `PW6-OD-004`; `PW6-OD-005`; `PW6-OD-006`; `PW6-OD-007`; `PW6-OD-008`; `PW6-OD-009`; `PW6-OD-010`; `PW6-OD-011`; `PW6-COPY-043`; `PW6-COPY-044`; `PW6-COPY-046`; `PW6-COPY-047`; `PW6-COPY-048`; `PW6-COPY-049`; `PW6-COPY-050`; `PW6-ACCESS-008`; `PW6-ACCESS-009` |
| PW9-MAP-008 | Frozen responsive layout | `PW7-OD-001`; `PW7-OD-002`; `PW7-OD-003`; `PW7-OD-004`; `PW7-OD-005`; `PW7-OD-006`; `PW7-OD-007`; `PW7-OD-008`; `PW7-OD-009`; `PW7-OD-010`; `PW7-OD-011`; `PW7-OD-012`; `PW7-OD-013`; `PW7-OD-014` |
| PW9-MAP-009 | Frozen accessibility | `PW8-OD-001`; `PW8-OD-002`; `PW8-OD-003`; `PW8-OD-004`; `PW8-OD-005`; `PW8-OD-006`; `PW8-OD-007`; `PW8-OD-008`; `PW8-OD-009`; `PW8-OD-010`; `PW8-OD-011`; `PW8-OD-012`; `PW8-OD-013`; `PW8-OD-014`; `PW8-OD-015`; `PW8-OD-016`; `PW8-Q-028` |
| PW9-MAP-010 | Hero / beta / value zones | `PW9-ZONE-002`; `PW9-ZONE-003`; `PW9-SEC-003`; `PW9-SEC-004`; `PW9-SEC-005` |
| PW9-MAP-011 | Mechanism / Today / CS | `PW9-ZONE-004`; `PW9-ZONE-005`; `PW9-ZONE-006` |
| PW9-MAP-012 | Trust / access / footer | `PW9-ZONE-007`; `PW9-ZONE-008`; `PW9-SEC-009`; `PW9-SEC-010` |
| PW9-MAP-013 | Wireframes | `PW9-WF-001`; `PW9-WF-002`; `PW9-WF-003`; `PW9-WF-004` |
| PW9-MAP-014 | Components and states | `PW9-COMP-*`; `PW9-STATE-*` |
| PW9-MAP-015 | Risks and validation | `PW9-RSK-*`; `PW9-VAL-*` |
| PW9-MAP-016 | HOLD/PROHIBIT only | Screenshot HOLD; four-TG art prohibited; chatbot visual prohibited; legal footer omitted |
| PW9-MAP-017 | Owner-frozen wireframe package | `PW9-OD-001` MODEL-001; `PW9-OD-002` eight clusters / ten regions; `PW9-OD-003` visible H2s; `PW9-OD-004` no hero supporting field; `PW9-OD-005` compact editorial Today; `PW9-OD-006` subtly separated Course Seller; `PW9-OD-007` separate trust/access; `PW9-OD-008` surface budget; `PW9-OD-009` non-modal inline disclosure; `PW9-OD-010` candidate anchors not implemented; `PW9-OD-011` identity-only footer; `PW9-OD-012` no screenshot slot. Frozen consequence: recommended composition is now owner layout authority. Remaining downstream: PW-10 visual; PW-11 high-fidelity; PW-12 validation; PW-13 implementation; PW-14 publication. Reverification: any proposed supporting field, screenshot slot, extra cluster, drawer disclosure, footer legal invention, or H2 rewrite |
| PW9-MAP-018 | PW-7 eight-cluster budget through PW-9 zones | `PW7-OD-012` clusters 1–8 remain the visual budget. `PW9-ZONE-003`/`004` share cluster 3. `PW9-ZONE-008` carries access (cluster 7) plus identity footer (cluster 8). `PW9-OD-002` names chapters; it does not add a ninth marketing band |

HOLD and PROHIBIT constrain only. They are not active homepage claims. Owner decisions are not product evidence. Wireframe choices are not implementation evidence. Missing upstream references: 0. Invalid uses: 0.

---

## 36. Wireframe Acceptance Register

No record is `IMPLEMENTATION READY`, `ACCESSIBILITY PASSED`, `PRODUCTION VERIFIED`, or `PUBLICATION READY`. Owner layout dependency is frozen. Visual-system, implementation, and accessibility-validation dependencies remain open.

| ID | Zone | Role | Required content | Layout | Responsive | Semantic | A11y | Exclusions | Owner dep. | Downstream | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW9-ACC-001 | Header | Identity + exploration | Frozen nav + Inloggen | Static; brand start | Fit-or-disclose | `header` `nav` | Named nav; utility outside | Extra IA items | `PW9-OD-009` frozen | PW-13 implementation | `OWNER FROZEN — IMPLEMENTATION OPEN` |
| PW9-ACC-002 | Hero | Operator H1 | Frozen H1 + support | Text-led reading; supporting field omitted | Single column | One H1 | Measure; wrap | Image-required; BOS/AI/CS | `PW9-OD-004` frozen | PW-10 visual | `OWNER FROZEN — VISUAL SYSTEM OPEN` |
| PW9-ACC-003 | Beta | Early maturity | Both Layer B sentences | Inline associated | Not omitted | Text, not H2 | Not colour-only | Badge; scarcity | none | PW-12 validation | `WIREFRAME READY — VALIDATION OPEN` |
| PW9-ACC-004 | Value | What it organizes | `PW6-COPY-046` | Editorial | Stack | Frozen H2 `Over ZyntixAI` | Anchor Model B | Feature cards | `PW9-OD-003` frozen | PW-13 implementation | `OWNER FROZEN — IMPLEMENTATION OPEN` |
| PW9-ACC-005 | Mechanism | How it works | `PW6-COPY-047` | Continuous with value | Stack | Frozen H2 `Hoe het werkt` | Anchor Model B | Module tiles | `PW9-OD-003` frozen | PW-13 implementation | `OWNER FROZEN — IMPLEMENTATION OPEN` |
| PW9-ACC-006 | Today | Bounded proof | Frozen Today copy | Compact editorial | Stack | H2 | Qualifier attached | Public demo UI | `PW9-OD-005` frozen | PW-10 visual | `OWNER FROZEN — VISUAL SYSTEM OPEN` |
| PW9-ACC-007 | Course Seller | Secondary | Frozen CS copy | After Today; subtle separation | Intact unit | `section` in `main` | Not `aside` | LMS; extra CTA | `PW9-OD-006` frozen | PW-10 visual | `OWNER FROZEN — VISUAL SYSTEM OPEN` |
| PW9-ACC-008 | Trust | Named controls | Frozen trust copy | Compact; separate from access | Stack | H2 | No certification | Badges | `PW9-OD-007` frozen | PW-10 visual | `OWNER FROZEN — VISUAL SYSTEM OPEN` |
| PW9-ACC-009 | Access | Honest stop | Frozen access copy | Compact panel after trust | Status → link → stop | H2 | Stop not error | Forms; fake CTA | `PW9-OD-007` frozen | PW-13 implementation | `OWNER FROZEN — IMPLEMENTATION OPEN` |
| PW9-ACC-010 | Footer | Identity | `ZyntixAI` | Identity-only | Wrap | `footer` | No second H1 | Ungated legal links | `PW9-OD-011` frozen | PW-14 publication | `OWNER FROZEN — PUBLICATION OPEN` |
| PW9-ACC-011 | Desktop composition | Full page | Eight clusters | `PW9-WF-001`; MODEL-001 | Content-fit | DOM = visual | Reading column | Card canvas; screenshot slot | `PW9-OD-001` frozen | PW-10 visual | `OWNER FROZEN — VISUAL SYSTEM OPEN` |
| PW9-ACC-012 | Tablet composition | Transition | Same truth | `PW9-WF-002` | Wrap/disclose | Unchanged order | Sign in outside | Carousel; supporting field | `PW9-OD-009` frozen | PW-12 validation | `OWNER FROZEN — VALIDATION OPEN` |
| PW9-ACC-013 | Mobile composition | Narrow | Same truth | `PW9-WF-003` | One column; max two enclosed | Unchanged order | No icon-only | Sticky CTA; modal/drawer | `PW9-OD-001` frozen | PW-12 validation | `OWNER FROZEN — VALIDATION OPEN` |
| PW9-ACC-014 | Navigation disclosure | Compact nav | Frozen in-page labels | Non-modal inline | Threshold content-fit | button/summary | No trap | Dialog | `PW9-OD-009` frozen | PW-13 implementation | `OWNER FROZEN — IMPLEMENTATION OPEN` |
| PW9-ACC-015 | Anchor/focus model | In-page | Frozen candidate IDs | Destinations exist first | All viewports | Real fragments | Model B | `href="#"` | `PW9-OD-010` frozen candidate | PW-13 implementation | `OWNER FROZEN CANDIDATE CONTRACT — NOT IMPLEMENTED` |
| PW9-ACC-016 | No-JavaScript state | Robustness | Core clusters + Sign in | Same order | Native fallback | Real links | `PW8-OD-016` | JS-only nav | none | PW-13 implementation | `WIREFRAME READY — IMPLEMENTATION OPEN` |

---

## 37. Downstream Handoffs

If the repository later publishes a different governed phase map, follow that map and treat the labels below as capability handoffs.

### PW-9-R1

Receives owner-frozen composition, reconciled wireframes, matrices, traceability, risks, validations, remaining later-gated questions, and independent-review evidence. May not casually replace frozen PW-6/7/8 or reopen `PW9-OD-001`–`012`. Completed in this file as §42.

### PW-10

Receives frozen composition structure, container roles, spacing roles, surface budget, asset dependency, premium criteria, and anti-patterns. Chooses colour, type, elevation within the frozen budget. Not started.

### PW-11

Receives frozen wireframes plus visual-system authority for high-fidelity desktop/tablet/mobile. Not started.

### PW-12

Receives design validations, copy/layout coherence, responsive checks, and accessibility design checks. Not started.

### PW-13

Receives candidate anchors, semantic structure, route expectations, component composition, no-JS, focus, and protected-boundary requirements. Does not receive permission to edit AppShell or `globals.css` as a convenience. Not started.

### PW-14

Receives browser, accessibility, performance, metadata, indexation, and Production verification. Not started.

PW-10, PW-11, PW-12, PW-13, and PW-14 are not started.

---

## 38. Acceptance Gate

Establishment checklist remains historical evidence. It does not describe the current owner-freeze status.

| Check | Establishment result (historical) |
| --- | --- |
| Preflight matches expected HEAD | Yes: `0b453cfdbc678309bed47c1fef75d0155aa3eac4` |
| Only PW-9 added | This file |
| PW-0–PW-8 applied | Yes |
| Frozen copy quoted | Yes |
| PW-7 / PW-8 not reopened | Yes |
| Eight visual clusters | Yes |
| Desktop / tablet / mobile / 320px wireframes | Yes |
| DOM = visual order | Yes |
| Header/nav and candidate anchors | Yes |
| Hero bounded; beta early | Yes |
| Today bounded; CS secondary | Yes |
| Deferred TGs omitted | Yes |
| Trust named-controls; honest stop calm | Yes |
| No fake CTA; no unsupported visual proof | Yes |
| Components and states complete | Yes |
| Risks and validations complete | Yes |
| Owner decisions remain open | Yes — historical; superseded by §41 |
| Product code unchanged | Yes |
| Authenticated Home closed | Yes |
| No implementation or accessibility PASS | Yes |

Historical establishment gate, retained only as history:

```text
CONDITIONAL — PW-9 OWNER WIREFRAME DECISIONS REQUIRED
PW-9 WIREFRAME & LAYOUT COMPOSITION ESTABLISHED — AWAITING OWNER DECISIONS
```

Current owner-freeze gate: see §41. Independent-review gate: see §42. Current status is not the historical establishment strings.

Not used: `CLOSED WITH EVIDENCE — PW-9`; `IMPLEMENTATION READY`; `ACCESSIBILITY PASSED`; `VISUAL DESIGN FROZEN`; `PUBLICATION READY`.

---

## 39. Identifier census (master definitions)

| Family | From | To | Master count |
| --- | --- | --- | --- |
| PW9-PRIN | 001 | 012 | 12 |
| PW9-MODEL | 001 | 003 | 3 |
| PW9-ZONE | 001 | 008 | 8 |
| PW9-SEC | 001 | 010 | 10 |
| PW9-ANCHOR | 001 | 007 | 7 |
| PW9-WF | 001 | 004 | 4 |
| PW9-GRID | 001 | 012 | 12 |
| PW9-SURF | 001 | 008 | 8 |
| PW9-AST | 001 | 014 | 14 |
| PW9-COMP | 001 | 020 | 20 |
| PW9-STATE | 001 | 020 | 20 |
| PW9-DENS | 001 | 008 | 8 |
| PW9-ANTI | 001 | 018 | 18 |
| PW9-RSK | 001 | 042 | 42 |
| PW9-VAL | 001 | 034 | 34 |
| PW9-Q | 001 | 018 | 18 |
| PW9-OD | 001 | 012 | 12 |
| PW9-MAP | 001 | 018 | 18 |
| PW9-ACC | 001 | 016 | 16 |
| Total | | | 284 |

Review findings `PW9-R1-FND-*` are a separate family and are not included in the 284 masterrecords.

---

## 40. What this file is not

This file is not visual design, implementation, keyboard evidence, screen-reader evidence, contrast evidence, zoom evidence, legal approval, or publication. Historical establishment treated owner decisions as recommendations until a separate owner-authorisation phase. That historical non-authority remains true of the establishment record. Owner-freeze status is recorded in §41. Independent-review status is recorded in §42. Neither converts this file into visual-design freeze, implementation authority, accessibility PASS, or publication.

End of PW-9 homepage wireframe and layout composition establishment. Historical record only; current freeze evidence follows.

---

## 41. PW9-OD Owner Homepage Wireframe & Layout Decision Evidence

### 41.1 Preflight authority

Worktree root `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1`. Branch `core/platform-readiness-20260707`. Local HEAD and upstream `origin/core/platform-readiness-20260707` at `0b453cfdbc678309bed47c1fef75d0155aa3eac4`. Ahead/behind `0 0`. Staged none. Unstaged tracked none. Untracked exactly this PW-9 file. PW-8 closed at the same SHA. Exactly one PW-9 document. Establishment evidence retained in §40. `PW9-OD-001`–`012` existed and were open before this freeze. PW-9-R1 not started. PW-10 not started. No product code changed.

### 41.2 Owner authority type

`EXPLICIT ZYNTIXAI OWNER HOMEPAGE WIREFRAME & LAYOUT DECISION`

### 41.3 Decision date

`2026-09-16`

### 41.4 Baseline HEAD

`0b453cfdbc678309bed47c1fef75d0155aa3eac4`

### 41.5 Scope

Homepage composition; section grouping; visible H2 assembly; hero composition; proof treatment; Course Seller treatment; trust/access treatment; surface budget; mobile disclosure presentation; candidate anchor set; footer policy; screenshot-slot policy. Approved package: `PW-9 RECOMMENDED WIREFRAME PACKAGE`.

### 41.6 Non-authority statement

```text
OWNER WIREFRAME FREEZE ≠ VISUAL DESIGN FREEZE ≠ HIGH-FIDELITY DESIGN ≠ IMPLEMENTATION AUTHORITY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY ≠ DEPLOYMENT AUTHORITY
OWNER DECISION RESOLVED ≠ DOWNSTREAM CONDITION RESOLVED
```

This freeze is not visitor research, Production evidence, technical implementation, legal approval, browser validation, accessibility validation, permission to change authenticated Home, or permission to change routes or CSS.

### 41.7 OD-001 selection

`MODEL-001 — CALM EDITORIAL FLOW`. Usage: `OWNER FROZEN COMPOSITION MODEL — DOWNSTREAM VISUAL DESIGN REQUIRED`. MODEL-002 and MODEL-003 remain historical evaluation and are not co-leading.

### 41.8 OD-002 selection

Eight visual clusters and ten semantic regions (`PW9-ZONE-001`–`008`; `PW9-SEC-001`–`010`). Usage: `OWNER FROZEN SECTION AND CLUSTER ARCHITECTURE`.

### 41.9 OD-003 selection

Visible H2 `Over ZyntixAI` mapped to nav `Over ZyntixAI`. Visible H2 `Hoe het werkt` mapped to nav `Hoe het werkt`. Usage: `OWNER FROZEN H2 ASSEMBLY — IMPLEMENTATION AND BROWSER VALIDATION LATER-GATED`. Not a PW-6 rewrite.

### 41.10 OD-004 selection

No hero supporting field in the frozen baseline. Usage: `OWNER FROZEN TEXT-LED HERO — NO SUPPORTING FIELD IN BASELINE`.

### 41.11 OD-005 selection

Today as compact editorial proof block. Usage: `OWNER FROZEN COMPACT EDITORIAL PROOF TREATMENT`.

### 41.12 OD-006 selection

Course Seller as a subtly separated editorial section in `main`. Usage: `OWNER FROZEN SECONDARY EDITORIAL RELEVANCE SECTION`.

### 41.13 OD-007 selection

Trust and access as two separate compact blocks. Usage: `OWNER FROZEN SEPARATE TRUST AND ACCESS COMPOSITION`.

### 41.14 OD-008 selection

Desktop maximum three enclosed surfaces; mobile maximum two. Usage: `OWNER FROZEN SURFACE BUDGET — VISUAL TOKENS LATER-GATED`.

### 41.15 OD-009 selection

Non-modal inline disclosure. Usage: `OWNER FROZEN NON-MODAL INLINE DISCLOSURE COMPOSITION`.

### 41.16 OD-010 selection

Existing `PW9-ANCHOR-001`–`007` retained exactly after read-only validity check. Usage: `OWNER FROZEN CANDIDATE ANCHOR CONTRACT — NOT IMPLEMENTED`.

### 41.17 OD-011 selection

Identity-only footer baseline. Usage: `OWNER FROZEN MINIMAL IDENTITY-ONLY FOOTER`. Legal items remain `EXTERNALLY GATED — DO NOT RENDER WITHOUT REAL DESTINATION AND AUTHORITY`.

### 41.18 OD-012 selection

No reserved screenshot slot. Usage: `OWNER FROZEN NO-SCREENSHOT BASELINE`.

### 41.19 Decision-register reconciliation

See §34. Total 12. Fully resolved 12. Partially resolved 0. Open owner layout decisions 0. All records `RESOLVED — OWNER FROZEN`. Original question, options, recommendation, conservative default, rationale, upstream, and downstream gates retained. Selected option, owner authority, freeze date, resulting requirement, remaining downstream condition, and reverification trigger added.

### 41.20 Open-question reconciliation

See §33. Total 18. Resolved by owner 10 (`PW9-Q-001`–`008`, `012`, `013`). Partially resolved by owner 3 (`PW9-Q-010`, `016`, `017`). Open PW-10 visual system 2 (`PW9-Q-009`, `018`). Open PW-11 high-fidelity 0. Open PW-12 validation 1 (`PW9-Q-011`). Open PW-13 implementation 1 (`PW9-Q-015`). Open PW-14 publication 0. Externally gated legal 1 (`PW9-Q-014`). No question deleted. IDs retained.

### 41.21 Wireframe reconciliation

Desktop `PW9-WF-001`: MODEL-001; no hero supporting field; eight clusters; separate trust and access; max three enclosed surfaces; no screenshot slot; identity-only footer. Tablet `PW9-WF-002`: same content truth; content-driven transition; non-modal inline disclosure; Inloggen outside where feasible; no supporting field; no screenshot slot. Mobile `PW9-WF-003` and 320 CSS px / 200% `PW9-WF-004`: one meaningful column; non-modal inline disclosure; no modal/drawer baseline; max two enclosed surfaces; qualifiers with claims; identity-only footer; no screenshot slot; no sticky CTA; no horizontal scroll; no hidden qualifiers; no dropped closed-beta status; no icon-only navigation; no shifted DOM order; no loss of access information. No new homepage copy written.

### 41.22 Component/state reconciliation

Twenty component records and twenty state records retained. Owner dependency frozen. Implementation, visual-system, and accessibility-validation dependencies remain open. Hero supporting field omitted in baseline. Screenshot slot omitted. Today is compact editorial proof. Course Seller is a subtly separated editorial section. Trust and access are separate. Disclosure is non-modal inline. Footer is identity-only. Anchors remain candidate, not implemented. No component or state is implemented, tested, accessibility passed, production verified, or publication ready.

### 41.23 Copy integrity

PW-6 Route A2 copy remains quoted, not rewritten. Navigation: `Over ZyntixAI`; `Hoe het werkt`; `Gesloten bèta`; `Inloggen`. H1: `Houd zicht op klanten, werk en voortgang.` Hero support and Layer B sentences unchanged. Today heading `Today als voorbeeld in het product`. Course Seller heading `Als je opleidingen of coaching geeft` with qualifier `Dit is geen leeromgeving en geen open catalogus.` Trust heading `Hoe toegang in het product werkt`. Access heading `Toegang` with closed-beta, existing-account Sign in, and honest-stop sentences unchanged. BOS not reactivated. AI copy remains `CONDITIONAL — INACTIVE BY DEFAULT`. No new CTA, audience, public demo, or pricing/free/trial claim.

### 41.24 Responsive and accessibility integrity

Owner freeze is not in conflict with PW-7 or PW-8. Preserved: text-led single-column hero; content-driven thresholds; static header; early inline beta; continuous editorial value; text-only Today; secondary Course Seller; compact trust; compact access; header plus access Sign in; no footer-only Sign in; maximum eight clusters; route-scoped Dutch requirement; one H1; logical H2s; section within `main`; skip link; destination-heading focus; no-JavaScript contract; keyboard order; 320 CSS px; 200% zoom; text spacing; forced-colours; reduced-motion; screen-reader reading order. No execution or PASS claimed.

### 41.25 Traceability

`PW9-MAP-001`–`016` retained. `PW9-MAP-017` added for the owner-frozen package. Upstream IDs from PW-0 through PW-8 remain. Missing references 0. Invalid uses 0. HOLD and PROHIBIT support exclusions only. Owner decisions are not product evidence. Wireframe choices are not implementation evidence.

### 41.26 Risks and later gates

Existing risks retained. `PW9-RSK-033`–`038` record remaining visual, surface, sparsity, screenshot-absence, trust/access-merge, and drawer-implementation risks. Owner freeze reduces decision uncertainty only. Visual execution, surface application, desktop/mobile fidelity, unimplemented anchors, and possible later legal footer expansion remain later-gated. All validations remain `PLANNED — NOT EXECUTED`. All thresholds remain `PROPOSED — NOT ACHIEVED`. Remaining gates: PW-9-R1 consistency review; PW-10 visual system; PW-11 high-fidelity closed/open disclosure states; PW-12 validation; PW-13 implementation including anchors and language isolation; PW-14 publication and any legal footer authority. PW-9-R1 and PW-10 are not started by this freeze.

### 41.27 File-integrity verification

Only `docs/phases/PW-9-homepage-wireframe-layout-composition.md` is in scope. Mechanical whitespace, fence, census, and upstream-ID checks are reported in the owner-freeze report. No secrets or credentials added.

### 41.28 Gate result

```text
PASS — PW9-OD OWNER HOMEPAGE WIREFRAME & LAYOUT DECISIONS FROZEN
```

### 41.29 Resulting PW-9 status

Freeze-time resulting status, retained as history:

```text
PW-9 READY FOR INDEPENDENT WIREFRAME & LAYOUT REVIEW
```

Current status after independent review is recorded in §42.37.

Not used: `CLOSED WITH EVIDENCE — PW-9`; `IMPLEMENTATION READY`; `ACCESSIBILITY PASSED`; `VISUAL DESIGN FROZEN`; `PUBLICATION READY`.

Authenticated Home remained closed. No product code changed. Nothing staged, committed, pushed, or deployed. At freeze time, PW-9-R1 and PW-10 were not started. Independent review evidence is §42.

End of PW-9 owner homepage wireframe and layout freeze evidence.

---

## 42. PW-9-R1 Independent Homepage Wireframe & Layout Review Evidence

### 42.1 Review scope

Independent review of `docs/phases/PW-9-homepage-wireframe-layout-composition.md` after the PW9-OD owner freeze. Only this file may be edited. Product code, AppShell, authenticated Home, routes, CSS, PW-6 copy, PW-7 layout decisions, and PW-8 accessibility decisions were not modified. No browser, keyboard, screen-reader, contrast, zoom, visitor, or Production test was executed. PW-10 was not started.

### 42.2 Independence statement

Prior PASS statements were treated as hypotheses. Owner-frozen selections `PW9-OD-001`–`012` were not replaced, renumbered, or silently weakened. Establishment evidence (§40) and owner-freeze evidence (§41) remain historical.

```text
OWNER WIREFRAME FREEZE ≠ VISUAL DESIGN FREEZE ≠ HIGH-FIDELITY DESIGN ≠ IMPLEMENTATION AUTHORITY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY ≠ DEPLOYMENT AUTHORITY
OWNER DECISION RESOLVED ≠ DOWNSTREAM CONDITION RESOLVED
```

No user research, stakeholder quotes, usability scores, browser results, screen-reader results, contrast measurements, zoom results, performance data, Production evidence, or analytics were invented.

### 42.3 Preflight

Root `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1`. Branch `core/platform-readiness-20260707`. Local HEAD and upstream `0b453cfdbc678309bed47c1fef75d0155aa3eac4`. Ahead/behind `0 0`. Staged none. Unstaged tracked none. Untracked exactly this PW-9 file. PW-8 closed at the same SHA. Exactly one PW-9 document. §40 and §41 present. Twelve OD records frozen before this review. PW-9-R1 had not been executed. PW-10 not started. Authenticated Home remains protected.

### 42.4 Authority review

B1-GATE.1 and PW-0 through PW-8 remain binding. PW-1 is the public-truth ceiling. PW-6 is frozen copy authority. PW-7 is frozen responsive-layout authority. PW-8 is frozen accessibility- and component-state authority. PW9-OD is the owner-frozen wireframe authority. This review does not create claims, CTAs, visual tokens, or implementation evidence.

### 42.5 Protected-boundary review

Authenticated Home closure `49cd5773976143139a154f9b8ddf36535a4dd914` and product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` remain closed. Inspected current `/` still redirects unauthenticated visitors to `/login`. Root `lang="en"` is unchanged. AppShell skip link is unchanged. `globals.css` is unchanged. Desired public homepage remains not implemented.

### 42.6 Owner-decision integrity

`PW9-OD-001`–`012` are present and `RESOLVED — OWNER FROZEN`. Totals: 12 / 12 fully resolved / 0 partial / 0 open owner layout decisions. Selected package unchanged: MODEL-001; eight composition zones and ten semantic regions; visible H2s `Over ZyntixAI` and `Hoe het werkt`; no hero supporting field; compact editorial Today; subtly separated Course Seller; separate trust and access; max three/two enclosed surfaces; non-modal inline disclosure; candidate anchors `hoofdinhoud` through `toegang`; identity-only footer; no screenshot slot. No owner decision is used as product, test, or implementation evidence.

### 42.7 Full-page story review

Visitor-facing story: identity and utility nav; H1 and operator value; early closed beta; Over ZyntixAI; Hoe het werkt; Today as bounded example; Course Seller as secondary relevance; named-controls trust; access and honest stop; identity footer. Each step answers a distinct visitor question. Operational value precedes limits. Closing is intentional, not a governance dump. Bracketed ASCII notes are labelled governance-only so they are not visible wireframe content (`PW9-R1-FND-004`).

### 42.8 Hero review

Text-led, single-column, no supporting field, screenshot, dashboard, chatbot, AI orb, floating cards, BOS/AI/CS labels, or acquisition CTA. Frozen H1 and support remain quoted. H1 is orientation, not a guarantee (`PW9-R1-FND-008` / `PW9-VAL-031`). No empty right column remains after omitting the supporting field.

### 42.9 Beta review

Layer B remains immediately after hero support, not a headline, footer-only note, badge, or scarcity claim. Sign in is for existing accounts. Layer B and later access repeat functionally for different questions, not as duplicate warning banners (`PW9-R1-FND-009`).

### 42.10 Value/mechanism review

Visible H2s match nav labels. Destinations are real titled sections. Roles are now explicit: organising vs how information stays with work (`PW9-R1-FND-003`). Continuous editorial flow; no feature-card grid; anti-replacement remains in value; Today remains later and bounded.

### 42.11 Today review

After value and mechanism; compact; text-only; bounded example; not a demo, screenshot, interactive preview, AI ranking, or whole-product proof. Desktop ASCII now quotes the full frozen Today body (`PW9-R1-FND-002`). Enclosed surface is optional and must not outweigh general explanation (`PW9-R1-FND-010`).

### 42.12 Course Seller review

Normal `section` in `main`; not HTML `aside`; after Today; secondary; qualifier attached; removable without breaking the primary flow. Subtle separation must not become a Course Seller edition or a second heavy mobile card.

### 42.13 Trust/access review

Separate titled blocks. Trust is named controls only. Access is a compact panel after trust with closed-beta detail, existing-account Sign in, and a calm honest stop. Not merged. Not an error state. Not a fake CTA path.

### 42.14 Footer review

Identity-only `ZyntixAI` is the intentional complete close, not an unfinished stub (`PW9-R1-FND-007`). No footer-only Sign in. Legal items remain externally gated. Visual weight remains PW-10/PW-11.

### 42.15 Desktop review

`PW9-WF-001` is a complete MODEL-001 page: no empty hero column; no screenshot slot; max three enclosed surfaces; separate trust and access; identity footer; utility Sign in; static header. Concrete enough to inform PW-10 without freezing colour, type, or pixels.

### 42.16 Tablet review

`PW9-WF-002` is a content-driven transition, not scaled desktop. Wrap then non-modal inline disclosure; Inloggen outside where feasible; same meaning; no carousel or second content column. Relative weight of Today and Course Seller retained.

### 42.17 Mobile/reflow review

`PW9-WF-003`/`004`: one column; max two enclosed surfaces; no modal/drawer baseline; no sticky CTA; no icon-only nav; no horizontal scroll; qualifiers and closed beta remain; DOM order unchanged. 320 CSS px, 200% zoom, and text-spacing remain planned, not executed.

### 42.18 Navigation/anchor review

Seven candidate fragments remain unique and valid: `hoofdinhoud`; `over-zyntixai`; `hoe-het-werkt`; `today`; `opleidingen-en-coaching`; `hoe-toegang-werkt`; `toegang`. Header items remain the four frozen labels. Today, Course Seller, and Trust are not extra primary header items. Skip target remains `main`. Not implemented.

### 42.19 Disclosure review

Non-modal inline; named text trigger; no hamburger freeze; Inloggen outside where feasible; no trap; no required backdrop. Exact chrome label remains later-gated (`PW9-Q-017`). Closed and open high-fidelity states remain PW-11.

### 42.20 Grid/container/spacing review

Named roles remain guidance, not PW-10 tokens. `copy-measure` 60–72 is not an accessibility claim (`PW9-R1-FND-006`). `supporting-column` / `content-supporting` unused in frozen baseline (`PW9-R1-FND-011`).

### 42.21 Surface/density review

Desktop ≤3 enclosed; mobile ≤2; hero/beta/value/mechanism/footer not cards; trust need not be a card; access may be a compact panel. No nested or floating product-card grid. Eight composition zones must not become eight cards.

### 42.22 Premium/anti-pattern review

Premium remains hierarchy, rhythm, measure, and scarce surfaces. `PW9-ANTI-017` and `PW9-ANTI-018` record incomplete screenshot placeholders and empty enterprise chrome. No invented scale.

### 42.23 Asset dependency review

Text identity required. Supporting field omitted. Screenshots HOLD. Dashboard, chatbot, AI-orb, four-audience art, testimonials, logos, and certification badges prohibited. Icons text-first. Motion not required. Coherence does not depend on an omitted or prohibited asset.

### 42.24 Component/state review

20 components, 20 states, 16 acceptance records retained. Brand destination never `/home` (`PW9-R1-FND-005`). No record is implemented, tested, accessibility-passed, production-verified, or publication-ready.

### 42.25 Authenticated-arrival review

Root Model A remains desired IA. Current unauthenticated `/` still redirects to `/login`. Authenticated visitors must not be held on marketing. `/home` remains protected. `/login` remains auth-owned. Routing remains PW-13. No authenticated marketing variant is a primary flow.

### 42.26 Frozen-copy review

Quoted Route A2 navigation, H1, hero support, Layer B, Today heading and full body, Course Seller heading/body/qualifier, trust heading and body, and the access block are intact. No BOS copy. AI copy remains inactive. No new CTA, audience, pricing, trial, public demo, or compliance claim.

### 42.27 Responsive/accessibility review

Aligned with PW-7 and PW-8: content-driven thresholds; static header; fit-or-disclose; early beta; text-only Today; secondary Course Seller; compact trust/access; no footer-only Sign in; skip to `main`; one H1; logical H2s; DOM = meaning; Course Seller `section` in `main`; non-modal disclosure; no-JS core; 320/200%/text-spacing/forced-colours/reduced-motion remain planned. No responsive, accessibility, or WCAG PASS claimed.

### 42.28 Traceability audit

`PW9-MAP-001`–`017` retained. `PW9-MAP-018` added for the PW-7 cluster-budget mapping. `PW9-MAP-009` now lists `PW8-OD-001`–`016`. Upstream missing references 0. Invalid uses 0. HOLD/PROHIBIT remain exclusions only.

### 42.29 Risk and validation review

Risks extended `PW9-RSK-039`–`042`. Validations extended `PW9-VAL-029`–`034`. Coverage includes chatbot, task-manager, Today dominance, CS capture, LMS, four editions, late beta, acquisition Sign in, honest-stop-as-error, fake demo, unsupported UI, card overload, whitespace, length, qualifier load, trust-as-certification, modal/drawer disclosure, hidden Sign in, DOM mismatch, missing anchors, sticky obstruction, 320/200%/no-JS, Dutch fit, root-model-as-implemented, shared-CSS Home, PW-10 pre-emption, publication over-read, surface misuse, sparsity, no-screenshot specificity, trust/access merge, unfinished footer, H1-as-guarantee, and restriction-dump close. All validations remain `PLANNED — NOT EXECUTED`. All thresholds remain `PROPOSED — NOT ACHIEVED`.

### 42.30 Open-question review

Eighteen questions retained. Resolved by owner 10. Partially resolved 3. Open PW-10 visual system 2. Open PW-11 high-fidelity 0 as a question class; remaining high-fidelity conditions sit under `PW9-Q-018` notes and later gates. Open PW-12 validation 1. Open PW-13 implementation 1. Open PW-14 publication 0. Externally gated legal 1. Product truth not reopened.

### 42.31 ID census

Masterrecords before R1 additions: 271. After: 284. Finding family `PW9-R1-FND-001`–`020` counted separately. No ID renumbering. No gaps in existing families.

### 42.32 Findings register

| ID | Severity | Subject | Evidence | Impact | Correction or later gate | Status | Downstream |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW9-R1-FND-001 | P1 | ZONE table could be read as replacing the PW-7 eight-cluster map | §11 vs `PW7-OD-012` | Extra marketing bands or dropped footer cluster | Mapped ZONE-003/004 to cluster 3; ZONE-008 to clusters 7–8; OD-002 unchanged | `CORRECTED` | n/a |
| PW9-R1-FND-002 | P1 | Desktop Today body used ellipsis | `PW9-WF-001` vs `PW6-COPY-048` | Alternate public copy risk | Quoted the full frozen Today body | `CORRECTED` | n/a |
| PW9-R1-FND-003 | P1 | Value and mechanism roles not distinguished | §15 | Duplicate or swapped sections | Documented organising vs mechanism roles without rewriting copy | `CORRECTED` | n/a |
| PW9-R1-FND-004 | P1 | ASCII bracket notes could be read as visible UI | Desktop/tablet wireframes | Governance rendered as chrome | Labelled notes governance-only | `CORRECTED` | PW-10 |
| PW9-R1-FND-005 | P1 | Brand interaction said in-page/home | `PW9-COMP-003` | Possible `/home` destination | Never `/home`; optional in-page top or future public `/` | `CORRECTED` | PW-13 |
| PW9-R1-FND-006 | P1 | 60–72 measure could be read as WCAG evidence | `PW9-GRID-008` | False accessibility claim | Marked as layout guidance only | `CORRECTED` | PW-12 |
| PW9-R1-FND-007 | P1 | Identity-only footer not stated as complete close | §20 | Unfinished-site reading | Stated as intentional close; visual polish later-gated | `CORRECTED` | PW-10 / PW-14 |
| PW9-R1-FND-008 | P1 | H1 guarantee over-read not in hero wireframe | §13 vs `PW6-RSK-031` | False outcome promise | H1 remains orientation, not a result | `CORRECTED` | PW-10 |
| PW9-R1-FND-009 | P1 | Layer B and access could read as duplicate warnings | §14 / §19 | Restriction dump | Distinct visitor questions documented | `CORRECTED` | PW-10 |
| PW9-R1-FND-010 | P1 | Today enclosure not functionally bounded | §16 | Today becomes the product picture | Enclosure optional and quieter than general value | `CORRECTED` | PW-10 |
| PW9-R1-FND-011 | P1 | Supporting-column unused state unmarked | `PW9-GRID-009` | Empty column restored | Unused in baseline; later-gated | `CORRECTED` | PW-10 |
| PW9-R1-FND-012 | P1 | `PW9-MAP-009` omitted `PW8-OD-010`–`015` | §35 | Incomplete accessibility trace | Listed `PW8-OD-001`–`016` | `CORRECTED` | n/a |
| PW9-R1-FND-013 | P1 | Freeze-time “R1 not started” read as current | §1 / §41.29 | False current-state claim | Freeze-time labelled; §42 records R1 | `CORRECTED` | n/a |
| PW9-R1-FND-014 | P2 | Exact disclosure chrome label | `PW9-Q-017` | Visual naming | Named text required; exact label later | `LATER-GATED` | PW-10 / PW-11 |
| PW9-R1-FND-015 | P2 | Visual tokens unset | PW-10 | Execution unknown | Named roles only | `LATER-GATED` | PW-10 |
| PW9-R1-FND-016 | P2 | Footer visual weight | Identity-only baseline | May look sparse until tokens | No invented legal links | `LATER-GATED` | PW-10 / PW-14 |
| PW9-R1-FND-017 | P2 | Anchors not implemented | `PW9-OD-010` | Dead links if rendered early | Destinations first | `LATER-GATED` | PW-13 |
| PW9-R1-FND-018 | P2 | Legal footer destinations | `PW9-Q-014` | Missing required links later | External authority | `LATER-GATED` | PW-14 |
| PW9-R1-FND-019 | P2 | `Today` pronunciation | PW-8 open validation | SR reading | Frozen English name retained | `LATER-GATED` | PW-12 |
| PW9-R1-FND-020 | P2 | Desktop/tablet/mobile fidelity untested | VAL-009–013 | Layout break | Planned validation | `LATER-GATED` | PW-12 |

Open P0: 0. Open P1: 0.

### 42.33 Corrections performed

Document-only: cluster mapping clarified; Today body restored; value/mechanism roles distinguished; governance notes labelled; brand destination constrained; measure and supporting-column guidance clarified; footer completeness stated; H1 and beta/access questions bounded; Today enclosure bounded; MAP-009 completed; MAP-018 added; risks `039`–`042`, validations `029`–`034`, anti-patterns `017`–`018` added; freeze-time status labelled. Owner decisions, frozen copy, PW-7, and PW-8 were not reopened.

### 42.34 Remaining P2/later gates

PW-10 visual system. PW-11 high-fidelity including disclosure closed/open states. PW-12 executed validation including 320/200%/text-spacing, `Today` pronunciation, and density. PW-13 implementation including anchors, language isolation, no-JS, and Home regression. PW-14 publication and any legal footer authority. All remain unexecuted.

### 42.35 File-integrity verification

Only this PW-9 file is in scope. Mechanical whitespace, fence, census, and upstream-ID checks are reported in the R1 report. No secrets or credentials added.

### 42.36 Gate result

```text
PASS — PW-9-R1 INDEPENDENT HOMEPAGE WIREFRAME & LAYOUT REVIEW CLOSED WITH EVIDENCE
```

### 42.37 Resulting PW-9 status

```text
PW-9 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

Not used: `CLOSED WITH EVIDENCE — PW-9`; `VISUAL DESIGN FROZEN`; `IMPLEMENTATION READY`; `ACCESSIBILITY PASSED`; `PUBLICATION READY`; `DEPLOYMENT READY`.

Authenticated Home remained closed. No product code changed. Nothing staged, committed, pushed, or deployed. PW-10 not started.

End of PW-9-R1 independent homepage wireframe and layout review evidence.
