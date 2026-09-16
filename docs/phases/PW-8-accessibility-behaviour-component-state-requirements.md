# PW-8 — Accessibility Behaviour & Component-State Requirements

| Field | Value |
| --- | --- |
| Document | PW-8 — Accessibility Behaviour & Component-State Requirements |
| Type | Accessibility behaviour and component-state requirements authority (not implementation, not WCAG conformance, not legal approval, not publication) |
| Date | 2026-09-16 |
| Branch | `core/platform-readiness-20260707` |
| HEAD at drafting | `adcbd1707caa97a4b5511a56616210d7444a5663` |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Binding closures | PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; PW-3 `9c12c977383a100eb548880d8d35b329b4406f90`; PW-4 `c6f4489bc5cbf9306b4784320cc747975209caeb`; PW-5 `fcb4eab3fbfe7cefd0013828d9b9819cb452cb87`; PW-6 `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`; PW-7 `adcbd1707caa97a4b5511a56616210d7444a5663` |
| Authenticated Home | Closure `49cd5773976143139a154f9b8ddf36535a4dd914`; Production product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Copy input | Owner-frozen Route A2 (`PW6-OD-002`) |
| Layout input | Owner-frozen PW7-OD-001–014 |
| Establishment status (historical) | `PW-8 ACCESSIBILITY REQUIREMENTS ESTABLISHED — AWAITING OWNER DECISIONS` — see §2 and §44 as first-establishment record |
| Establishment gate (historical) | `CONDITIONAL — PW-8 OWNER ACCESSIBILITY DECISIONS REQUIRED` |
| Owner accessibility freeze | §45 — `PW8-OD Owner Accessibility Decision Evidence` |
| Current status | `PW-8 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` |
| Owner-freeze gate (historical) | `PASS — PW8-OD OWNER ACCESSIBILITY DECISIONS FROZEN` |
| Independent review | §46 — `PW-8-R1 Independent Accessibility Requirements Review Evidence` |
| Independent-review gate | `PASS — PW-8-R1 INDEPENDENT ACCESSIBILITY REQUIREMENTS REVIEW CLOSED WITH EVIDENCE` |

```text
PW-8 ACCESSIBILITY REQUIREMENTS ≠ IMPLEMENTATION PASS ≠ WCAG CONFORMANCE CLAIM ≠ LEGAL APPROVAL ≠ PUBLICATION AUTHORITY
ACCESSIBILITY REQUIREMENT ≠ IMPLEMENTED BEHAVIOUR ≠ KEYBOARD VERIFIED ≠ SCREEN-READER VERIFIED ≠ WCAG COMPLIANT
OWNER ACCESSIBILITY FREEZE ≠ IMPLEMENTATION PASS ≠ WCAG CONFORMANCE ≠ LEGAL APPROVAL ≠ PUBLICATION READY
OWNER ACCESSIBILITY DECISION ≠ SHARED CSS CHANGE ≠ APPSHELL CHANGE ≠ AUTHENTICATED HOME REOPENING
OWNER DECISION RESOLVED ≠ IMPLEMENTATION OR EVIDENCE CONDITION UNRESOLVED
```

No accessibility unit is `PUBLICATION READY`, `IMPLEMENTATION READY`, `WCAG COMPLIANT`, `ACCESSIBILITY PASSED`, `KEYBOARD VERIFIED`, or `SCREEN-READER VERIFIED`. The phase status `CLOSED WITH EVIDENCE — PW-8` is reserved for a later PW-8-FV commit and push. Sixteen `PW8-OD-*` records are `RESOLVED — OWNER FROZEN`. Implementation, keyboard, screen-reader, contrast, zoom, and publication evidence remain unexecuted.

---

## 1. Document Control

This file is the sole PW-8 deliverable. It translates closed PW-0 through PW-7 authorities into accessibility behaviour and component-state requirements for the future public homepage. It does not implement routes, CSS, ARIA, skip links, navigation, focus styles, contrast tokens, components, assets, metadata, or authenticated Home.

| Control | Rule |
| --- | --- |
| Product code | Unchanged |
| Authenticated Home | Closed; not restyled; not used as the public accessibility system |
| Dual-use `/` | Current truth unchanged; Root Model A remains desired IA only |
| `/login`, `/register`, invite, recovery | Read-only; not mutated |
| Shared CSS / root metadata / AppShell / existing skip-link | Protected; public accessibility may identify later isolation dependencies only |
| Frozen Route A2 copy | Quoted, not rewritten |
| Frozen PW-7 layout decisions | Respected, not reopened |
| Wireframes / mockups / screenshots | Out of scope |
| Staging / commit / push / deploy | Not authorized |
| PW8-OD | Owner freeze; evidence in §45 |
| PW-8-R1 | This independent review; evidence in §46 |
| PW-9 | Not started |

---

## 2. Executive Decision

PW-8 first established accessibility behaviour and component-state requirements for the future Dutch-first public homepage. That establishment remains historical evidence. **PW8-OD** is the owner freeze of those accessibility decisions.

Authority: `EXPLICIT ZYNTIXAI OWNER ACCESSIBILITY REQUIREMENTS DECISION` (2026-09-16). Baseline HEAD `adcbd1707caa97a4b5511a56616210d7444a5663`. Scope: public-homepage accessibility behaviour and component-state requirements. Source: explicit owner approval of the professional recommendation following PW-8 establishment. This is requirements-direction authority, not implementation, WCAG conformance, legal approval, keyboard evidence, screen-reader evidence, zoom evidence, visitor validation, or publication.

```text
OWNER ACCESSIBILITY FREEZE ≠ IMPLEMENTATION PASS ≠ WCAG CONFORMANCE ≠ LEGAL APPROVAL ≠ PUBLICATION READY
```

Owner-frozen selections (`PW8-OD-001`–`016`, all `RESOLVED — OWNER FROZEN`):

- Target: `WCAG 2.2 LEVEL AA-ORIENTED PRODUCT REQUIREMENTS` — not a conformance claim.
- Language: Language Model A, route-scoped Dutch; do not casually change global root `lang`.
- Course Seller: normal titled `section` in `main`; visual aside does not mean HTML `aside`.
- Skip link: Dutch `Ga naar de hoofdinhoud` targeting public `main`.
- In-page focus: Anchor Model B — move focus to the destination heading.
- Mobile nav: non-modal inline expansion; no hamburger selected.
- Focus: 2 CSS-pixel outline with 2 CSS-pixel offset; `:focus-visible`; not implemented or tested.
- Target size: 24×24 CSS-pixel standards floor; 44×44 CSS-pixel product preference for primary header and navigation controls.
- Link recognition: not colour-only; body links use a persistent non-colour cue.
- Contrast: WCAG 2.2 AA-oriented floors; palette later-gated.
- Motion: subtle non-essential transitions only; page usable with no motion.
- Icons: text-first; icons do not carry essential meaning.
- Announcements: static visible information by default.
- Zoom/reflow: 200%, 320 CSS px, text resize/spacing mandatory planned; 400% additional planned; not executed.
- Screen-reader scope: manual cross-engine planned matrix; environment-dependent.
- No-JavaScript: core content and essential navigation remain usable.

`Today` pronunciation annotation remains `OPEN VALIDATION DETAIL`. Value/mechanism H2 wording remains `OPEN ASSEMBLY DETAIL — PW-9 GATE`. Neither reopens frozen PW-6 copy or this owner freeze.

Present defect findings after independent review: P0 none; open P1 none. High-severity future risks remain open with named preventive gates. They are not deferred current P1 defects.

PW-8-R1 independently reviewed this file, corrected clerical and completeness defects, and did not replace owner-frozen decisions. Current document status: `PW-8 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT`.

Historical establishment record retained: recommendations were not owner decisions until this freeze. Desired semantics remain unimplemented. Current unauthenticated `/` still redirects to `/login`. Root `lang="en"` is unchanged.

```text
NO ARIA IS BETTER THAN INCORRECT ARIA
DESIRED SEMANTICS ≠ IMPLEMENTED SEMANTICS
DUTCH PUBLIC COPY ≠ CURRENT ROOT lang="en"
PUBLIC SKIP-LINK CONTRACT ≠ APPSHELL SKIP-LINK IMPLEMENTATION
WCAG 2.2 AA-ORIENTED REQUIREMENTS TARGET — NOT A CONFORMANCE CLAIM
OWNER FROZEN LANGUAGE MODEL — TECHNICAL ISOLATION REQUIRED
```

---

## 3. Purpose

Define the accessibility behaviour, semantic structure, keyboard contract, component states, fallback states, and planned validation needed before later public-homepage assembly, visual design, technical architecture, and evidence work.

PW-8 answers:

- how the eight frozen clusters should be expressed in the accessibility tree;
- how keyboard, pointer, zoom, contrast, motion, and screen-reader users should be able to use the page later;
- which component states are legitimate;
- which owner decisions are frozen and which implementation or evidence conditions remain open;
- which later phases inherit which requirements.

---

## 4. Non-Goals

PW-8 does not:

- implement a public homepage, skip link, disclosure, focus CSS, or ARIA;
- modify AppShell, authenticated Home, `/login`, middleware, root layout, or `globals.css`;
- rewrite frozen PW-6 copy or frozen PW-7 layout;
- claim WCAG, EN 301 549, ADA, or Dutch legal conformance;
- execute keyboard, screen-reader, browser, device, contrast, zoom, or user testing;
- authorize screenshots, icons, colour tokens, or motion assets;
- design an unauthorized public form;
- start PW-9 or later implementation;
- treat authenticated accessibility patterns as automatic public-system authority.

---

## 5. Governing Authorities

Authority order:

1. PW-0 defines scope and protected boundaries.
2. PW-1 remains the public-truth ceiling.
3. PW-2 defines visitor comprehension and journeys.
4. PW-3 defines messaging and trust boundaries.
5. PW-4 defines public information architecture.
6. PW-5 defines the homepage content model.
7. PW-6 defines frozen Route A2 copy.
8. PW-7 defines frozen responsive content and layout requirements.
9. PW-8 defines accessibility behaviour and component-state requirements only.
10. PW8-OD supplies explicit owner authority for the sixteen accessibility decisions in this file.

B1-GATE.1 remains the repository completion-and-evidence standard. PW-8 is a documentation phase. Browser, production, keyboard, and screen-reader verification are not required for this owner freeze and have not been executed.

Authenticated Home closure `49cd5773976143139a154f9b8ddf36535a4dd914` and production product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` remain binding. AppShell skip-link, Menu disclosure, and Home loading chrome remain out of mutation scope (`PW0-OUT-002`; `PW0-PB-008`).

---

## 6. Evidence Model

| Class | Meaning in PW-8 |
| --- | --- |
| Normative requirement | Later implementation must satisfy it to claim this requirements target |
| Owner-frozen requirement | Product decision recorded in `PW8-OD-*`; still not implemented or tested |
| ZyntixAI product standard | Stronger product preference; not presented as a universal legal duty |
| Recommended enhancement | Useful, not required for this target |
| Planned validation | Later evidence method; `PLANNED — NOT EXECUTED` |
| Implementation dependency | Needs PW-13 or another later gate; not authorized here |
| Externally gated legal interpretation | Accessibility law, procurement, or certification is outside this file |

Numeric thresholds record their origin. A product preference is not a legal requirement.

No measurement, scan, or manual review in this file is executed evidence. Automated tooling may later support evidence. It may not replace manual review.

---

## 7. Current Architecture Truth

Inspected read-only. Not modified.

| Surface | Current truth | Public-homepage implication |
| --- | --- | --- |
| `src/app/page.tsx` | Unauthenticated `/` redirects to `/login`; authenticated `/` uses membership/onboarding-aware entry | No public marketing homepage exists |
| `src/app/layout.tsx` | `<html lang="en">`; title `ZyntixAI`; description `ZyntixAI application foundation`; imports `globals.css` | Dutch public copy would currently inherit English document language unless a later isolated public layout exists |
| `src/middleware.ts` | Session refresh / auth redirects | Public routing must not simplify `/` (`PW0-RQ-002`) |
| `src/app/login/page.tsx` | English sign-in landing | `/login` remains English utility, not a Dutch marketing page |
| `src/app/(authenticated)/layout.tsx` | Passthrough children | Must not receive public chrome |
| `src/app/(authenticated)/home/page.tsx` | Authenticated Home / Today | Closed; not a public demo |
| `src/components/app-shell.tsx` | Skip link `Skip to main content` → `#main-content`; `main` `tabIndex={-1}`; desktop nav plus `details`/`summary` `Menu` | Informs regression risk only; not the public system |
| `src/components/app-shell.module.css` | Skip link clipped until `:focus` / `:focus-visible`; 2px outline; `details` disclosure | Public CSS must not restyle this file |
| `src/app/globals.css` | Shared tokens, `a:focus-visible` 2px outline, body `#f8fafc` | Public page must not treat this as its visual/accessibility system (`PW0-PB-019`; `PW0-RQ-005`) |
| Shared `Button` primitive | Used by onboarding/product, not public homepage | Public must not requisition it without isolation analysis |
| Tests | AppShell skip-link and responsive skip-link overlay contracts exist | Future shared skip-link work must prove no authenticated regression |

Route truth remains:

- unauthenticated `/` redirects to `/login`;
- authenticated `/` uses membership/onboarding-aware entry;
- `/home` remains protected;
- no public marketing homepage exists;
- public Root Model A remains desired IA, not implementation truth.

---

## 8. Frozen Inputs

### 8.1 Audience and copy

Primary public visitor: owner of a small business (`PW2-OD-001`; `PW2-VIS-001`). Public copy uses `je` and `eigenaar`. Course Sellers remain secondary relevance (`PW5-OD-001`; `PW6-OD-008`).

Frozen Route A2 copy is quoted, not rewritten:

| Role | Frozen text |
| --- | --- |
| H1 | `Houd zicht op klanten, werk en voortgang.` |
| Hero support | `ZyntixAI helpt je als eigenaar van een klein bedrijf het dagelijkse werk te organiseren: klanten, verantwoordelijkheden, voortgang en wat aandacht nodig heeft.` |
| Closed beta (Layer B) | `ZyntixAI is nu in gesloten bèta.` |
| Beta utility (Layer B) | `Inloggen is voor bestaande accounts.` |
| Today heading | `Today als voorbeeld in het product` |
| Course Seller heading | `Als je opleidingen of coaching geeft` |
| Course Seller qualifier | `Dit is geen leeromgeving en geen open catalogus.` |
| Trust heading | `Hoe toegang in het product werkt` |
| Access heading | `Toegang` |
| Access status | `ZyntixAI is in gesloten bèta. Via deze site kun je geen nieuw account aanmaken.` |
| Access existing-account line | `Heb je al een account? Inloggen.` |
| Access stop | `Heb je geen account, dan is deze pagina bedoeld om ZyntixAI te leren kennen.` |

Value (`PW6-COPY-046`) and mechanism (`PW6-COPY-047`) remain frozen body text. They do not independently freeze visible H2 wording. See `PW8-HEAD-004` and `PW8-Q-028`.

### 8.2 Navigation

Frozen labels: `Over ZyntixAI` · `Hoe het werkt` · `Gesloten bèta` · `Inloggen` (`PW6-OD-003`).

The first three remain desired in-page roles and `CANDIDATE DESTINATION — NOT IMPLEMENTED`. `Inloggen` remains utility for existing accounts to `/login`.

### 8.3 Layout

Frozen PW-7 owner decisions remain binding: asymmetric narrative with editorial fallback; complete single-column text hero; adaptive navigation disclosure; static header; inline maturity layer; continuous value/mechanism; text-only Today proof; Course Seller editorial aside; compact trust list; compact access panel; Sign in in header and access; eight clusters; no required image; content-driven thresholds.

AI clarification remains `CONDITIONAL LAYOUT — INACTIVE BY DEFAULT`. Today remains bounded proof, authenticated context, not a public demo, not the complete product, and not AI-ranked.

### 8.4 Copy-or-layout conflict rule

If an accessibility requirement would require a material copy or owner-layout change: record the conflict; do not silently rewrite it; identify the upstream owner; block closure if it is a present P0 or P1 defect. The value/mechanism heading-wording gap is recorded as a later content decision, not a silent rewrite, and is not a present implementation defect.

---

## 9. Accessibility Principles

| ID | Principle |
| --- | --- |
| PW8-PRIN-001 | Prefer native HTML semantics. `NO ARIA IS BETTER THAN INCORRECT ARIA`. Do not add ARIA roles where native elements already express the behaviour. |
| PW8-PRIN-002 | One public-page H1. Heading levels follow information structure, not visual size. |
| PW8-PRIN-003 | DOM order carries meaning without CSS. Visual reordering must not change comprehension or focus sequence. |
| PW8-PRIN-004 | Keyboard users can reach, operate, and leave every interactive control without a trap. |
| PW8-PRIN-005 | Visible labels normally provide accessible names. Hidden names may not contradict visible text. |
| PW8-PRIN-006 | Status, maturity, availability, and trust are text, not colour, icon, or motion alone. |
| PW8-PRIN-007 | Qualifiers remain in the accessibility tree in reading order. They may not be omitted, delayed, or hover-only. |
| PW8-PRIN-008 | Unavailable actions are omitted. No fake destinations, `href="#"`, or misleading disabled Join/Demo/Register controls. |
| PW8-PRIN-009 | The page remains usable without animation, without optional images, and without JavaScript where native behaviour is sufficient. |
| PW8-PRIN-010 | Public accessibility work may not restyle or reopen authenticated Home, AppShell, or shared global CSS. |
| PW8-PRIN-011 | Requirements are not conformance. Planned validation is not achieved evidence. |
| PW8-PRIN-012 | Repeated Sign-in links share purpose and destination. They do not become a second acquisition path. |
| PW8-PRIN-013 | A `title` attribute, tooltip, or icon must not be the only explanation of a control, qualifier, or status. Visible text or an associated accessible name remains required. |

---

## 10. Standards Target

External standard referenced: [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/), W3C Recommendation (current TR at drafting). PW-8 does not claim later WCAG versions, EN 301 549, ADA, or Dutch legal conformance.

| ID | Record | Class | Origin |
| --- | --- | --- | --- |
| PW8-STD-001 | Owner-frozen target: `WCAG 2.2 LEVEL AA-ORIENTED PRODUCT REQUIREMENTS`. Establishment recommended this target; PW8-OD selected it. | Owner-frozen product target | WCAG 2.2 Level AA as orientation; not a conformance statement |
| PW8-STD-002 | Selected AA-oriented success criteria that later apply to this static marketing page include 1.3.1, 1.3.2, 1.4.1, 1.4.3, 1.4.4, 1.4.10, 1.4.11, 1.4.12, 2.1.1, 2.1.2, 2.4.1, 2.4.2, 2.4.3, 2.4.4, 2.4.6, 2.4.7, 2.4.11, 2.5.2, 2.5.8, 3.1.1, 3.2.1, 3.2.2, 3.3.2 if forms later exist, 4.1.2, 4.1.3 if live regions later exist | Normative-oriented later requirement | WCAG 2.2 AA |
| PW8-STD-003 | Focus Appearance (2.4.13) and Target Size Enhanced (2.5.5) are AAA. They are not treated as AA legal minima here | ZyntixAI product preference candidates | WCAG 2.2 AAA |
| PW8-STD-004 | Legal interpretation of Dutch, EU, or US accessibility obligations remains externally gated | Externally gated | Not a repository legal opinion |
| PW8-STD-005 | Automated scans may later support evidence; they cannot replace keyboard, zoom, and screen-reader review | Planned validation constraint | Product evidence model |
| PW8-STD-006 | Authenticated AppShell patterns may inform regression tests; they do not define public conformance | Implementation dependency | PW0-PB-008 |
| PW8-STD-007 | No page, component, or state in this file is claimed to pass WCAG | Evidence restraint | This phase |
| PW8-STD-008 | Owner selected `PW8-STD-001`. Stronger AAA-oriented preferences do not convert the complete product target to AAA. Legal interpretation remains externally gated. | Owner-frozen | `PW8-OD-001` |

```text
WCAG 2.2 AA-ORIENTED REQUIREMENTS TARGET — NOT A CONFORMANCE CLAIM
```

Establishment label retained as history: `PROPOSED STANDARDS TARGET — OWNER DECISION REQUIRED`. Current: `RESOLVED — OWNER FROZEN` (`PW8-OD-001`). Do not state WCAG compliant, certified, accessibility passed, legally compliant, or audited.

---

## 11. Semantic Document Structure

Desired structure for the future public homepage. Not implemented.

| ID | Cluster | Semantic role | Accessible name / heading | Landmark | Label needed | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| PW8-SEM-001 | Page shell | `html` + `body` document | Page title names ZyntixAI and operational purpose (`PW6-A11Y-001`) | Document | Document language yes (`PW8-LANG-001`) | Isolated public layout later; do not reuse root marketing metadata on Home |
| PW8-SEM-002 | Skip link | Link | Owner-frozen visible name `Ga naar de hoofdinhoud` | None; first focusable | Visible name is the name | Public chrome copy; not PW-6 frozen body copy (`PW8-OD-004`) |
| PW8-SEM-003 | Header | `header` | Brand identity visible text `ZyntixAI` | Banner | Not required if only one banner | Static header (`PW7-OD-004`) |
| PW8-SEM-004 | Primary navigation | `nav` | Accessible name `Hoofdnavigatie` or labelled by visible heading/text | Navigation | Yes, unique name | Do not leave an unnamed `nav` if a second nav appears |
| PW8-SEM-005 | Hero and closed beta | `section` inside `main` | H1 is the section heading; beta is status text, not a heading | Main content | Section not separately labelled beyond H1 | Layer B associated, not a second H1 |
| PW8-SEM-006 | Value and mechanism | `section` inside `main` | Heading relationship: see `PW8-HEAD-004` | Main | If two landmarks are not used, section heading is enough | Continuous editorial (`PW7-VALUE-001`); not cards |
| PW8-SEM-007 | Today proof | `section` inside `main` | Frozen H2 `Today als voorbeeld in het product` | Main | Heading is the label | Qualifier immediately after claim |
| PW8-SEM-008 | Course Seller | `section` inside `main` (owner-frozen) | Frozen H2 `Als je opleidingen of coaching geeft` | Main, not complementary by default | Heading is the label | `OWNER FROZEN SECTION SEMANTICS — VISUAL ASIDE DOES NOT MEAN HTML ASIDE` (`PW8-OD-003`) |
| PW8-SEM-009 | Trust | `section` inside `main` containing a list | Frozen H2 `Hoe toegang in het product werkt` | Main | Heading is the label | Compact semantic list (`PW7-TRUST-001`) |
| PW8-SEM-010 | Access | `section` inside `main` | Frozen H2 `Toegang` | Main | Heading is the label | Status, Sign in, honest stop in that order |
| PW8-SEM-011 | Footer | `footer` | Identity text; no second H1 | Contentinfo | Not required if only one contentinfo | Legal links omitted until authorized |
| PW8-SEM-012 | Optional AI / visual | Inactive by default; if present, paragraph or decorative image inside the triggering section | No extra landmark | Main | Do not create a complementary landmark for decoration | Conditional; HOLD/prohibit rules remain |

Prohibited ARIA:

- `role="banner"` on a native `header` that is already a banner;
- `role="navigation"` on native `nav`;
- `role="main"` on native `main`;
- `role="contentinfo"` on native `footer`;
- `role="alert"` for ordinary beta or access copy;
- `aria-label` that contradicts visible text;
- `aria-hidden="true"` on focusable controls;
- presenting static status as `aria-live` polite spam.

Lists: trust items use a list. Navigation uses a list of links. Paragraphs carry hero support, value, mechanism, qualifiers, and stops. Decorative visuals do not receive names.

---

## 12. Language Semantics

| ID | Model | Description | Risk |
| --- | --- | --- | --- |
| PW8-LANG-001 | Language Model A — Route-scoped Dutch document language | Future public homepage document `lang="nl"`; English authenticated surfaces and `/login` keep English | Requires isolated public layout or route-level html/lang strategy (`PW0-PB-018`; `PW0-RQ-007`) |
| PW8-LANG-002 | Language Model B — Global root language change | Change `src/app/layout.tsx` to `lang="nl"` | Owner-rejected. Would announce authenticated Home, AppShell English chrome, and `/login` as Dutch |
| PW8-LANG-003 | Language Model C — Element-level Dutch only inside an English document | Keep `lang="en"` and mark clusters `lang="nl"` | Owner-rejected as the preferred final solution. Screen readers may still announce the page as English |
| PW8-LANG-004 | Current truth | Root `lang="en"` (`PW5-A11Y-015`; `PW6-A11Y-016`) | Dutch working copy does not silently change product `lang`. `src/app/layout.tsx` is not modified |
| PW8-LANG-005 | Product name `Today` | Remains an English product noun in Dutch copy (`PW7-A11Y-020`). No element-level `lang="en"` annotation is mandated during PW-8 | Later screen-reader validation may show a material pronunciation problem. If a change is required, preserve the visible frozen product name. Do not silently translate `Today`. Status: `OPEN VALIDATION DETAIL — DOES NOT REOPEN DUTCH-FIRST OR FROZEN COPY` |
| PW8-LANG-006 | Proper nouns | `ZyntixAI` is a product name; do not translate | Do not add phonetic ARIA |
| PW8-LANG-007 | `/login` | Remains English `Sign in` utility | Public Dutch skip-link or nav must not restyle login as a marketing page |
| PW8-LANG-008 | Inheritance | Child elements inherit document language unless marked otherwise | Public page must not inherit English from a shared root if Model A is selected |

`PW8-LANG-001` is owner-frozen Language Model A.

```text
OWNER FROZEN LANGUAGE MODEL — TECHNICAL ISOLATION REQUIRED
```

Desired behaviour: the future Dutch public homepage is exposed with Dutch document-language semantics; authenticated English surfaces remain English; `/login` remains current English truth until separately changed; the global root language must not be casually changed to Dutch; element-level Dutch inside an English document is not the preferred final solution.

Implementation dependency: PW-13 must determine a safe route/layout architecture; shared root changes require regression protection; authenticated Home must not be mis-announced as Dutch. Do not modify `src/app/layout.tsx` in this phase. Establishment label retained as history: `PROPOSED LANGUAGE-SEMANTICS MODEL — OWNER DECISION REQUIRED`.

---

## 13. Heading Architecture

| ID | Requirement |
| --- | --- |
| PW8-HEAD-001 | Exactly one H1 on the public homepage. The H1 is the frozen hero headline `Houd zicht op klanten, werk en voortgang.` (`PW6-A11Y-002`; `PW7-A11Y-002`). |
| PW8-HEAD-002 | Heading levels are not selected for visual size. No skipped level without a recorded semantic reason. |
| PW8-HEAD-003 | Closed-beta sentences are status text, not headings, even if visually prominent (`PW7-BETA-003`). |
| PW8-HEAD-004 | Value and mechanism are a continuous editorial section (`PW7-VALUE-001`). Frozen A2 supplies body (`PW6-COPY-046`, `PW6-COPY-047`) without a separately frozen visible H2. Accessible section headings are required later. Frozen navigation labels `Over ZyntixAI` and `Hoe het werkt` remain the leading candidates. Final visible use as section H2s is `OPEN ASSEMBLY DETAIL — PW-9 GATE`. In-page navigation may not activate until matching destinations and headings exist. Do not rewrite PW-6 copy here. |
| PW8-HEAD-005 | Today, Course Seller, trust, and access keep their frozen headings as H2. |
| PW8-HEAD-006 | H3 is used only for genuine nesting. Do not create H3s for visual subheads without content authority. |
| PW8-HEAD-007 | Footer identity is text, not a second H1. |
| PW8-HEAD-008 | In-page destinations, once implemented, must target real headings or labelled sections (`PW4-A11Y-007`; `PW5-A11Y-014`). |
| PW8-HEAD-009 | Visually subtle sections still receive heading structure where they are major landmarks of meaning (Today, Course Seller, trust, access). |
| PW8-HEAD-010 | Brand wordmark in the header is not an H1. |

Intended outline (desired, not implemented):

1. H1 `Houd zicht op klanten, werk en voortgang.`
2. H2 `Over ZyntixAI` — leading candidate from frozen nav; final visible use is `OPEN ASSEMBLY DETAIL — PW-9 GATE` (`PW8-Q-028`)
3. H2 `Hoe het werkt` — leading candidate from frozen nav; same PW-9 gate
4. H2 `Today als voorbeeld in het product`
5. H2 `Als je opleidingen of coaching geeft`
6. H2 `Hoe toegang in het product werkt`
7. H2 `Toegang`

No additional visible heading copy is invented. In-page navigation may not activate until matching destinations and headings exist. This does not block the PW8-OD freeze.

---

## 14. Landmark Architecture

| ID | Landmark | Requirement |
| --- | --- | --- |
| PW8-LAND-001 | Banner | One `header` / banner containing identity, navigation, and header Sign in |
| PW8-LAND-002 | Navigation | One primary `nav`, uniquely named. A second nav (footer) is omitted until authorized |
| PW8-LAND-003 | Main | One `main`. Skip-link target. Contains hero through access |
| PW8-LAND-004 | Complementary | Not used by default. Course Seller is an owner-frozen `section` in `main`, not `aside` (`PW8-OD-003`) |
| PW8-LAND-005 | Contentinfo | One `footer` |
| PW8-LAND-006 | Secondary navigation | Not required. Do not add a table-of-contents nav unless later proven necessary |
| PW8-LAND-007 | Duplicate names | If two navigation landmarks exist later, each must have a unique accessible name |
| PW8-LAND-008 | Noise | Do not assign a landmark role to every cluster. Sections with headings inside `main` are enough |
| PW8-LAND-009 | Course Seller choice | Visual editorial aside (`PW7-CS-002`) remains layout. HTML `aside` would likely be announced as complementary and is easier to skip. Owner-frozen: `section` in `main` so the qualifier remains in the primary reading order |

Landmark acceptance (planned, not executed): exactly one banner, one named navigation, one main, one contentinfo; no complementary landmark unless a later demonstrated benefit exists; no unnamed duplicate navs; Course Seller still reachable in `main` reading order.

---

## 15. Skip-Link Contract

| ID | Requirement |
| --- | --- |
| PW8-SKIP-001 | The skip link is the first focusable control |
| PW8-SKIP-002 | It is not visible until focused, then becomes fully visible, not clipped, not `pointer-events: none` while focused |
| PW8-SKIP-003 | Owner-frozen target is public `main` (`PW7-A11Y-006`; `PW8-OD-004`), with `main` programmatically focusable where required, normally `tabindex="-1"`, without joining the tab order |
| PW8-SKIP-004 | Activation moves focus to the target and brings the start of main content into view below any header |
| PW8-SKIP-005 | Static header (`PW7-OD-004`) does not cover the focused target. If sticky header is later separately authorized, offset and `PW7-A11Y-008` apply |
| PW8-SKIP-006 | Keyboard-visible; contrast per `PW8-CONTRAST-*`; usable at 200% zoom and 320 CSS px |
| PW8-SKIP-007 | No-JavaScript: native fragment to `main` id is sufficient; do not require a script to reveal the link on focus |
| PW8-SKIP-008 | Public skip-link copy is Dutch. AppShell remains English `Skip to main content`. Sharing one component requires proven bilingual isolation and authenticated regression tests |
| PW8-SKIP-009 | Do not modify the existing AppShell skip link in this phase |
| PW8-SKIP-010 | Alternative targets (H1 container only, or `#hero`) are weaker because they skip less chrome or miss `main` as a landmark. Not recommended |

`PW8-SKIP-003` is owner-frozen.

```text
OWNER FROZEN SKIP-LINK CONTRACT — AUTHENTICATED REGRESSION TEST REQUIRED
```

Dutch visible label: `Ga naar de hoofdinhoud`. First focusable control. Hidden visually until focused without being removed from accessibility APIs. Activation moves viewport and focus meaningfully. Works without JavaScript. Remains visible at zoom. Focus style remains visible. No collision with header. Does not modify the AppShell skip link. The Dutch skip-link label is public chrome copy, not a rewrite of frozen Route A2 body copy.

Establishment label retained as history: `PROPOSED SKIP-LINK CONTRACT — OWNER DECISION REQUIRED`. Evaluated alternatives (H1 container; `#hero`) remain weaker and are not selected.

---

## 16. Reading and Focus Order

| ID | Sequence rule |
| --- | --- |
| PW8-ORDER-001 | DOM order is the reading order and the meaning order without CSS |
| PW8-ORDER-002 | Visual order may not contradict DOM meaning. CSS `order` may not create a misleading focus sequence |
| PW8-ORDER-003 | Two-column source order, if a later wide viewport shows an optional visual, keeps text first in DOM. The visual is last in the cluster or `aria-hidden` if decorative |
| PW8-ORDER-004 | Mobile stacking follows the eight clusters in this order: header; hero and closed beta; value and mechanism; Today proof; Course Seller; trust; access; footer |
| PW8-ORDER-005 | Disclosure, when closed, does not leave hidden in-page links in the tab order. When open, disclosed in-page links appear in label order |
| PW8-ORDER-006 | Header Sign in remains available in order after identity and in-page items or after the disclosure control (`PW7-A11Y-005`) |
| PW8-ORDER-007 | Access Sign in remains after access status and before the no-account stop |
| PW8-ORDER-008 | Today qualifier follows the Today claim. Course Seller qualifier follows the relevance claim. Trust items follow the trust heading |
| PW8-ORDER-009 | Decorative visuals do not interrupt reading order |
| PW8-ORDER-010 | Anchor navigation, once authorized, moves reading/focus to the destination heading without sending the user to the footer |
| PW8-ORDER-011 | Footer follows access. Footer contains identity; no extra conversion control |
| PW8-ORDER-012 | Optional AI clarification, if later activated, is inserted adjacent to its trigger, not at the start of the page |

Reading-order table:

| Step | Cluster | Focusable controls | Notes |
| --- | --- | --- | --- |
| 0 | Skip | Skip link | First Tab |
| 1 | Header | Brand link if linked; in-page links or disclosure button; header Sign in | Static header |
| 2 | Hero / beta | None required besides text | Beta is not a control |
| 3 | Value / mechanism | None required | Continuous text |
| 4 | Today | None required | Qualifier after claim |
| 5 | Course Seller | None required | Qualifier after claim |
| 6 | Trust | None required | List after heading |
| 7 | Access | Access Sign in | After status; before stop |
| 8 | Footer | Future legal links only if authorized | Currently omitted |

---

## 17. Link and Button Semantics

| ID | Role | Semantics | Allowed | Prohibited |
| --- | --- | --- | --- | --- |
| PW8-ROLE-001 | Navigation in-page | Link | Real unique section destinations when they exist | `href="#"`; placeholder anchors |
| PW8-ROLE-002 | Route utility | Link | `Inloggen` → `/login` | Button imitating a missing join route |
| PW8-ROLE-003 | Brand identity | Link to page start or public home if a public home route exists; otherwise non-linked text | Native link or static text | Fake home route on dual-use `/` until PW-13 isolates it |
| PW8-ROLE-004 | Mobile disclosure opener | Button | Native `button` or `summary` with accessible name | `div` click handler; link with no destination |
| PW8-ROLE-005 | Close control if later present | Button | Named close | Icon-only without name |
| PW8-ROLE-006 | Static status | Text | Beta, honest stop, qualifiers | `role="button"`; clickable status |
| PW8-ROLE-007 | Disabled controls | Not used for unavailable acquisition | Omit Request access, Join, Demo, Register | Disabled buttons that look like the next step |
| PW8-ROLE-008 | Unavailable destination | Omit the link | Do not ship in-page nav until destinations exist | Visible dead links |
| PW8-ROLE-009 | Skip | Link | Fragment to `main` | Script-only skip that fails without JS |
| PW8-ROLE-010 | Future legal nav | Link | Real documents only | Privacy/terms placeholders |
| PW8-ROLE-011 | Non-interactive headings | Headings | May receive programmatic focus after anchor move | Positive `tabindex` for decoration |
| PW8-ROLE-012 | Click surfaces | Only on links/buttons | Keyboard equivalent required | Click on `div`/`span`/`li` |

Interaction-role register: in-page items are links after destinations exist; `Inloggen` is always a link, never a submit; disclosure is a button; status is text; no form submit exists on this page.

---

## 18. Accessible Names

| ID | Control | Visible text | Accessible name rule |
| --- | --- | --- | --- |
| PW8-NAME-001 | Skip link | Owner-frozen `Ga naar de hoofdinhoud` | Visible text is the name; public chrome copy, not PW-6 body rewrite |
| PW8-NAME-002 | Brand | `ZyntixAI` | Visible text; if linked, name remains `ZyntixAI` |
| PW8-NAME-003 | Primary nav | `Hoofdnavigatie` as nav name | Nav name is not duplicated on every link |
| PW8-NAME-004 | `Over ZyntixAI` | Frozen label | Visible text is the name; destination heading should match |
| PW8-NAME-005 | `Hoe het werkt` | Frozen label | Visible text is the name |
| PW8-NAME-006 | `Gesloten bèta` | Frozen label; `Bèta` allowed on narrow viewports (`PW6-RESP-011`) | Visible text is the name; shortened visible text is the name when shortened |
| PW8-NAME-007 | Header `Inloggen` | Frozen label | Name `Inloggen`; context is header utility to `/login` |
| PW8-NAME-008 | Access `Inloggen` | Frozen label | Same visible text and destination; context is access section. Additional hidden wording only if later testing proves ambiguity, and it must not contradict `Inloggen` |
| PW8-NAME-009 | Disclosure trigger | Visible text preferred (`Menu` is authenticated English and is not automatically reused). Proposed Dutch visible label such as `Menu` is an owner/content choice; icon-only is discouraged | Must name the action, not a decorative glyph |
| PW8-NAME-010 | Future close | Proposed `Sluiten` | Visible or programmatically associated |
| PW8-NAME-011 | Optional visual | Empty alt if decorative; concise Dutch equivalent if informative | Filename is not alt text |
| PW8-NAME-012 | Footer identity | `ZyntixAI` | Not a second document title |

Generic names such as `klik hier`, `lees meer`, or `button` are prohibited (`PW4-A11Y-008`; `PW6-A11Y-004`). No redundant `aria-label` that conflicts with visible text. A `title` attribute is not an acceptable substitute for a visible name or qualifier (`PW8-PRIN-013`).

```text
OWNER FROZEN LINK-RECOGNITION POLICY — VISUAL TOKENS LATER-GATED
```

Owner-frozen (`PW8-OD-009`): links must be recognizable without relying only on colour. Links inside running body copy use an underline or another persistent non-colour cue. Navigation links may rely on established navigation placement and grouping. Focus remains explicit. Hover is supplemental only. Active/current state does not depend only on colour. Visited styling may be used where useful and truthful. `Inloggen` remains visibly identifiable as an action.

Identical destinations may share visible text when purpose is the same (`PW6-A11Y-017`; `PW7-A11Y-018`).

---

## 19. In-Page Navigation

When destinations later exist:

| Control | Desired destination |
| --- | --- |
| `Over ZyntixAI` | Value heading / section |
| `Hoe het werkt` | Mechanism heading / section |
| `Gesloten bèta` | Access section (`Toegang`) or associated Layer B container; not a fake badge target |

| ID | Requirement |
| --- | --- |
| PW8-ANCHOR-001 | Real unique section IDs. No placeholder hashes |
| PW8-ANCHOR-002 | Destination exists before the link is offered |
| PW8-ANCHOR-003 | URL fragment may update. Back navigation remains usable |
| PW8-ANCHOR-004 | Direct fragment arrival works without a prior click |
| PW8-ANCHOR-005 | Native fragment behaviour is preferred. Do not require JavaScript for basic movement |
| PW8-ANCHOR-006 | Destination heading is not hidden under a header |
| PW8-ANCHOR-007 | Reduced-motion: no required smooth-scroll animation |
| PW8-ANCHOR-008 | Visible active-section indication is optional. If present, it must not depend only on colour (`PW4-A11Y-016`) |
| PW8-ANCHOR-009 | Focus model options: A native scroll without programmatic focus; B move focus to the destination heading; C context-dependent |
| PW8-ANCHOR-010 | Owner-frozen Anchor Model B: move focus to the destination heading, matching `PW4-A11Y-007` and `PW7-A11Y-007` (`PW8-OD-005`) |

```text
OWNER FROZEN IN-PAGE FOCUS MODEL — IMPLEMENTATION AND BROWSER VALIDATION REQUIRED
```

Requirements: real unique destination ID; destination exists before link activation; destination heading receives programmatic focus when necessary; temporary or persistent `tabindex="-1"` may support focus; focus is visible or context is otherwise clear; URL fragment remains meaningful; direct fragment arrival works; back navigation remains predictable; reduced motion is respected; heading is not obscured; no placeholder anchor; no focus on a non-meaningful wrapper. Headings that receive programmatic focus are not in sequential tab order.

Establishment label retained as history: `PROPOSED IN-PAGE FOCUS MODEL — OWNER DECISION REQUIRED`. Model A remains weaker for screen-reader arrival. Model C remains rejected as the default.

---

## 20. Mobile Navigation Disclosure

| ID | Requirement |
| --- | --- |
| PW8-NAV-001 | Disclosure control is a native button, or a native `summary` if `details` is the chosen no-JS pattern |
| PW8-NAV-002 | Visible label or clearly named icon-plus-text. No icon-only default |
| PW8-NAV-003 | `aria-expanded` reflects closed/open when a `button` pattern is used. Native `details`/`summary` exposes expanded state without extra ARIA if not broken by CSS |
| PW8-NAV-004 | `aria-controls` points to the panel id when a `button` pattern is used |
| PW8-NAV-005 | Initial state closed at the disclosure threshold (`PW7-NAV-002`) |
| PW8-NAV-006 | Keyboard: Enter/Space toggles. Escape closes when enhanced disclosure behaviour is present (`PW8-OD-006`). Native `details` is not required to polyfill Escape if the user agent does not close on Escape. Tab order is predictable. No keyboard trap |
| PW8-NAV-007 | After successful in-page or route navigation, close the disclosure where that remains the least surprising behaviour |
| PW8-NAV-008 | Dismiss restores focus to the trigger unless a destination heading was chosen |
| PW8-NAV-009 | Background interaction: owner-frozen non-modal inline expansion in document flow (`PW8-OD-006`). Overlay/dialog is not the default. No forced modal focus containment for this non-modal pattern. If a later overlay covers content, `PW7-A11Y-010` focus-remaining-in-disclosure applies only then |
| PW8-NAV-010 | Scroll-lock only if needed to keep focus usable; not default for inline expansion |
| PW8-NAV-011 | `Inloggen` remains available outside the disclosure where feasible (`PW7-OD-003`) |
| PW8-NAV-012 | No-JS fallback: native `details`/`summary` or always-visible in-page headings. JS failure must not remove all navigation |

Evaluated patterns: inline expanding navigation (owner-frozen, least complex); popover overlay; off-canvas panel; modal dialog (not justified for three in-page links).

```text
OWNER FROZEN NON-MODAL DISCLOSURE MODEL — COMPONENT IMPLEMENTATION LATER-GATED
```

Preferred implementation direction: least complex native or button-based disclosure; native `details`/`summary` may be evaluated; otherwise a button with correct state semantics. Required: meaningful visible control label; button semantics where a button pattern is used; correct `aria-expanded`; `aria-controls` where appropriate; keyboard and pointer activation; Escape closes when enhanced disclosure behaviour is present; focus restores to the trigger after dismissal; no keyboard trap; predictable Tab order; close after successful anchor navigation where appropriate; no-JavaScript fallback; reduced-motion support; usable at 320 px and zoom; `Inloggen` remains available outside the disclosure where feasible.

Do not select a hamburger icon. Do not implement a hamburger in this phase. Authenticated AppShell `details`/`summary` `Menu` may inform a later no-JS fallback, but its English label and CSS are not the public system.

Establishment label retained as history: `PROPOSED MOBILE-NAV INTERACTION MODEL — OWNER DECISION REQUIRED`.

---

## 21. Focus Appearance

```text
OWNER FROZEN FOCUS STANDARD — NOT IMPLEMENTED OR TESTED
```

| ID | Requirement | Origin |
| --- | --- | --- |
| PW8-FOCUS-001 | Every interactive component has a visible focus indicator. Focus is not removed without a replacement | WCAG 2.2 AA 2.4.7 |
| PW8-FOCUS-002 | Focused targets are not entirely hidden by padding, sticky/static overlap, or other content | WCAG 2.2 AA 2.4.11 |
| PW8-FOCUS-003 | Owner-frozen ZyntixAI indicator: a solid 2 CSS-pixel outline with 2 CSS-pixel offset, or an equivalent that remains visible on all allowed backgrounds. Exact colour is a later visual-token decision | Product standard (`PW8-OD-007`); informed by current `globals.css` but not copying those tokens into public CSS |
| PW8-FOCUS-004 | Focus is distinguishable from hover, current/active section, and visited | Product standard |
| PW8-FOCUS-005 | Indicator is not clipped by `overflow: hidden` on header, disclosure, or cards | Product standard |
| PW8-FOCUS-006 | High-contrast / forced-colour: indicator remains using a system highlight or a pair of contrasting lines | Product standard |
| PW8-FOCUS-007 | Use `:focus-visible` so pointer users are not forced into a persistent keyboard ring, without hiding keyboard focus | Product standard |
| PW8-FOCUS-008 | Skip link, brand, nav links, disclosure, Sign in, in-page links, and any close control all inherit this standard | This phase |
| PW8-FOCUS-009 | Do not rely on colour change of text alone as the focus indicator | WCAG 2.2 AA 1.4.1 / 2.4.7 |
| PW8-FOCUS-010 | Keyboard modality support: Tab, Shift+Tab, and scripted focus after anchors must show the same indicator | Product standard |

---

## 22. Pointer and Touch

| ID | Requirement | Origin |
| --- | --- | --- |
| PW8-TARGET-001 | Standards-oriented minimum: 24 by 24 CSS pixels for pointer targets, with the WCAG 2.2 2.5.8 exceptions where they genuinely apply | WCAG 2.2 AA 2.5.8 |
| PW8-TARGET-002 | Owner-frozen ZyntixAI preferred target: at least 44 by 44 CSS pixels for primary header and navigation controls, including Sign in, disclosure, skip-link when visible, and in-page nav items where practical | Product preference (`PW8-OD-008`); related to WCAG 2.2 AAA 2.5.5, not an AA legal minimum |
| PW8-TARGET-003 | Adjacent targets have enough spacing that a 24 CSS-pixel circle on each target does not intersect another target, unless 2.5.8 exceptions apply | WCAG 2.2 AA 2.5.8 |
| PW8-TARGET-004 | Narrow header: identity, disclosure, and Sign in remain usable without overlapping (`PW7-A11Y-011`) | Product + PW-7 |
| PW8-TARGET-005 | Pointer cancellation: no down-event-only activation for custom controls (WCAG 2.2 2.5.2). Native links/buttons already satisfy this if not broken | WCAG 2.2 AA 2.5.2 |
| PW8-TARGET-006 | Hover is never the only way to reveal a qualifier, destination, or status (`PW5-A11Y-017`) | Upstream + WCAG 2.2 1.4.13 where hover content exists |
| PW8-TARGET-007 | Accidental activation: no full-row hit areas that also contain nested links | Product standard |
| PW8-TARGET-008 | Skip-link hit area when revealed meets the preferred 44 CSS-pixel height where feasible | Product preference |

```text
OWNER FROZEN TARGET-SIZE STANDARD — 44PX PRODUCT PREFERENCE, 24PX STANDARDS FLOOR
```

Do not describe 44px as the WCAG AA minimum. Adjacent targets require sufficient separation. Narrow headers may wrap rather than reduce essential targets below the 24 CSS-pixel minimum. Sign in remains usable. Small inline links may rely on the applicable 2.5.8 exception only when spacing and context remain safe. Pointer cancellation and accidental activation remain validation requirements. No device testing is claimed.

Establishment label retained as history: `PROPOSED TARGET-SIZE STANDARD — OWNER DECISION REQUIRED`.

---

## 23. Colour and Contrast

No palette and no tokens are chosen here.

| ID | Surface | Standards-oriented minimum | Notes |
| --- | --- | --- | --- |
| PW8-CONTRAST-001 | Normal text | 4.5:1 against immediate background | WCAG 2.2 AA 1.4.3 |
| PW8-CONTRAST-002 | Large text (18pt/14pt bold or equivalent) | 3:1 | WCAG 2.2 AA 1.4.3 |
| PW8-CONTRAST-003 | Interactive text | Same as text; link vs surrounding text 3:1 if colour is a primary cue, plus a second cue where context is insufficient | 1.4.1 / 1.4.3; see `PW8-OD-009` |
| PW8-CONTRAST-004 | Focus indicators | 3:1 non-text contrast against adjacent colours | WCAG 2.2 AA 1.4.11 |
| PW8-CONTRAST-005 | Borders conveying structure | 3:1 if the border is required to understand grouping | 1.4.11 |
| PW8-CONTRAST-006 | Informative icons | 3:1; decorative icons carry no information | 1.4.11 |
| PW8-CONTRAST-007 | Status text | Text contrast; colour is not the only signal | Closed beta remains text |
| PW8-CONTRAST-008 | Disabled states | No legitimate disabled acquisition control exists. If a later disabled state is authorized, it must still be identifiable as unavailable in text, not grey alone | Product rule |
| PW8-CONTRAST-009 | Hover / active / current | Distinguishable from default and from focus; not colour-only for current section | `PW4-A11Y-016` |
| PW8-CONTRAST-010 | Visited links | Optional distinct visited style. If used, contrast still holds; visited must not be the only cue that a destination is unavailable | Owner-gated |
| PW8-CONTRAST-011 | Forced colours | Meaning remains without authored background colour (`PW8-HC-*`) | Planned, not executed |
| PW8-CONTRAST-012 | Trust and Course Seller | No badge colour, traffic-light, or availability chip as the sole signal | PW-1 / PW-6 |

Validation method later: instrumented contrast measurement plus forced-colour review (`PW8-VAL-016`, `PW8-VAL-018`). No contrast PASS is claimed.

```text
OWNER FROZEN CONTRAST REQUIREMENTS — PALETTE AND MEASUREMENT LATER-GATED
```

Owner-frozen floors (`PW8-OD-010`): normal text at least 4.5:1; large text at least 3:1; meaningful non-text UI and focus indicators at least 3:1 against adjacent colours where applicable; status does not depend only on colour; essential borders remain distinguishable; link recognition remains available beyond colour; high-contrast and forced-colour modes retain meaning; decorative content may use lower contrast only when it carries no required meaning.

---

## 24. Status and Announcements

The homepage is primarily static. Avoid unnecessary live regions.

```text
OWNER FROZEN ANNOUNCEMENT POLICY — STATIC-FIRST
```

Owner-frozen (`PW8-OD-013`): static visible information by default; live regions only for genuine dynamic updates. Static visible text includes closed beta, existing-account qualification, honest stop, Today qualifier, Course Seller qualifier, and trust statements. No `role="alert"` for ordinary page information. No automatic announcement of decorative changes. Disclosure state is communicated through the disclosure control. Anchor arrival uses focus and heading context. `status` may be used later only for genuine non-urgent asynchronous updates. `alert` is reserved for urgent actionable errors. No live-region spam.

| ID | Message | Classification | Announcement policy |
| --- | --- | --- | --- |
| PW8-ANNOUNCE-001 | Closed beta sentences | Static visible text | No live region; no `role="alert"` |
| PW8-ANNOUNCE-002 | Honest stop | Static visible text | No live region |
| PW8-ANNOUNCE-003 | Trust notes and qualifiers | Static visible text | In reading order; not polite spam |
| PW8-ANNOUNCE-004 | Disclosure open/closed | Control semantics (`aria-expanded` or native `details`) | State is on the control; no extra live region |
| PW8-ANNOUNCE-005 | Anchor arrival | Focus / heading context (Model B) | No live region |
| PW8-ANNOUNCE-006 | Decorative visual change | None | No announcement |
| PW8-ANNOUNCE-007 | Future loading, if technically necessary | `status` only for a short global wait that is not already obvious | Do not copy AppShell `Loading workspace…` onto the public page |
| PW8-ANNOUNCE-008 | Future error blocking a task | `alert` or focus to inline error, not both unless needed | Public homepage has no form; keep this inactive |
| PW8-ANNOUNCE-009 | `/login` unavailable | Static error on the login surface or a public not-found/fallback | Do not invent a fake public recovery route |
| PW8-ANNOUNCE-010 | Autoplaying announcement | Prohibited | No timers, toasts, or carousels |

---

## 25. Motion

| ID | Requirement |
| --- | --- |
| PW8-MOTION-001 | Motion never carries essential meaning (`PW5-A11Y-016`; `PW4-A11Y-013`) |
| PW8-MOTION-002 | The page works with animation disabled |
| PW8-MOTION-003 | `prefers-reduced-motion: reduce` removes non-essential transitions, smooth scrolling, and decorative motion |
| PW8-MOTION-004 | Parallax, autoplay, looping background motion, and flashing are prohibited |
| PW8-MOTION-005 | Anchor scrolling uses instant movement when reduced motion is requested; native jump is acceptable |
| PW8-MOTION-006 | Disclosure may use a short non-essential transition. Content must already be readable without it |
| PW8-MOTION-007 | Focus movement is not animated as a story. Do not scroll-hijack |
| PW8-MOTION-008 | Owner-frozen policy: subtle non-essential transitions only, off or minimized under reduced motion. Conservative baseline: the page is fully usable with no motion (`PW8-OD-011`) |

```text
OWNER FROZEN RESTRAINED MOTION POLICY — NO MOTION REQUIRED
```

No parallax, autoplay, looping essential motion, or flashing. No motion is required to reveal core content. Anchor scrolling does not require smooth motion. Disclosure works without animation. Focus movement remains understandable without animated scrolling. No animation implementation is authorized.

Establishment label retained as history: `PROPOSED MOTION POLICY — OWNER DECISION REQUIRED`.

---

## 26. Icons and Images

No image is required for page comprehension (`PW7-OD-013`).

```text
OWNER FROZEN TEXT-FIRST ICON POLICY — ICONOGRAPHY LATER-GATED
```

Owner-frozen (`PW8-OD-012`): visible text remains primary; decorative icons are hidden from assistive technology where appropriate; informative icons require a text equivalent; functional icon-only controls are discouraged and, if later required, need explicit accessible names; trust icons cannot imply certification; no AI robot, brain, sparkle, or chatbot iconography is required; no icon replaces closed-beta text, Course Seller qualifiers, or Sign in text.

| ID | Visual | Class | Requirement |
| --- | --- | --- | --- |
| PW8-MEDIA-001 | Wordmark / text identity | Informative if image; functional if linked | If text `ZyntixAI` is visible, image may be decorative. Image-only wordmark needs alt `ZyntixAI` |
| PW8-MEDIA-002 | Abstract brand visual | Decorative by default; HOLD until authorized | Empty alt or CSS background; omit on failure |
| PW8-MEDIA-003 | Navigation icon | Decorative if text remains | No icon-only in-page items |
| PW8-MEDIA-004 | Disclosure icon | Decorative beside a visible name, or functional if icon-only (discouraged) | Name from the action |
| PW8-MEDIA-005 | Trust icons | Decorative or omitted | Trust meaning is text (`PW7-TRUST-001`) |
| PW8-MEDIA-006 | Section dividers | Decorative | Empty alt / CSS |
| PW8-MEDIA-007 | Today screenshot | HOLD | Privacy, fidelity, caption, and alt authority required before any informative screenshot (`PW7-Q-020`) |
| PW8-MEDIA-008 | Product screenshot | HOLD / prohibited as public demo | Same as MEDIA-007; Home is not recreated |
| PW8-MEDIA-009 | Course Seller illustration | Prohibited as LMS/catalogue imagery; otherwise HOLD | Qualifier remains text |
| PW8-MEDIA-010 | AI imagery | Prohibited as lead identity | Conditional AI text is inactive by default |
| PW8-MEDIA-011 | Four-target-group illustrations | Prohibited in V1 | Deferred TGs omitted (`PW5-OD-002`) |
| PW8-MEDIA-012 | Failed optional image | Omit; no empty reserved panel (`PW7-STATE-011`) | Do not announce a broken image as a product module |

Redundant alt that repeats adjacent headings is prohibited. Filenames are not alt text.

---

## 27. Component Inventory

| ID | Component | Semantic role | Interaction | Keyboard | Focus | Accessible name | State source | Content dependency | Responsive dependency | Prohibited | Validation owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW8-COMP-001 | Page shell | Document, language, title | None | Landmarks reachable | n/a | Page title | Route | PW-6 title intent | Isolated public layout | Shared root metadata as Home title | PW-13 / PW-12 |
| PW8-COMP-002 | Skip link | Link | Activate fragment | First Tab; Enter | Visible on focus | `PW8-NAME-001` | CSS :focus | Dutch chrome copy | Zoom/reflow | Restyling AppShell skip link | PW-8 / PW-13 |
| PW8-COMP-003 | Brand identity | Text or link | Optional in-page/home | Tab if linked | Visible | `ZyntixAI` | Static | Frozen name | Header wrap | Second H1 | PW-12 |
| PW8-COMP-004 | Primary navigation | `nav` + list | In-page links when live | Tab | Visible | `PW8-NAME-003` | Viewport fit | Frozen labels | `PW7-NAV-001/002` | Placeholder hashes | PW-13 |
| PW8-COMP-005 | Navigation link | Link | Fragment | Enter | Visible | Visible label | Destinations exist | Frozen labels | Shorten `Bèta` only | Dead links | PW-12 |
| PW8-COMP-006 | Mobile disclosure trigger | Button / summary | Toggle | Enter/Space; Escape closes enhanced disclosure; native `details` follows the user agent | Visible | Named control | Viewport | Owner label | `PW7-NAV-002` | Div click; icon-only default | PW-13 |
| PW8-COMP-007 | Mobile navigation panel | Region/list | Contains in-page links | Tab within; no trap | Moves with items | Controlled by trigger | Expanded state | Same labels | 320 px; zoom | Hidden but focusable | PW-13 |
| PW8-COMP-008 | Sign in link | Link | Route `/login` | Enter | Visible | `Inloggen` | Dual placement | Frozen utility | Outside disclosure | Join/Demo/Register | PW-12 |
| PW8-COMP-009 | Hero | `section` + H1 + paragraph | None | Reading | H1 not in tab order unless programmatic | H1 text | Static | Frozen H1/support | Single-column text | Image-required hero | PW-12 |
| PW8-COMP-010 | Closed-beta status | Text | None | Reading | n/a | Text itself | Static | Frozen Layer B | Inline associated | Badge-only; alert role | PW-12 |
| PW8-COMP-011 | Editorial value/mechanism | `section` | None | Reading | Headings if Model B | Leading-candidate H2s; final wording `PW8-Q-028` / PW-9 | Static | COPY-046/047 | Continuous stack | Feature cards; invented marketing H2 | PW-9 / PW-12 |
| PW8-COMP-012 | Today proof | `section` | None | Reading | H2 | Frozen heading | Static | Frozen Today copy | Text-only | Public demo; screenshot without authority | PW-12 |
| PW8-COMP-013 | Course Seller aside | `section` in `main` (owner-frozen; not HTML `aside`) | None | Reading | H2 | Frozen heading | Static | Frozen CS copy | Editorial aside layout | HTML complementary skip; LMS imagery; extra CTA | PW-12 |
| PW8-COMP-014 | Trust list | `section` + list | None | Reading | H2 | Frozen heading | Static | Frozen trust copy | Compact list | Certification wall | PW-12 |
| PW8-COMP-015 | Access panel | `section` | Contains Sign in | Reading then Sign in | H2 + link | Frozen heading | Static | Frozen access copy | Compact panel | Signup form | PW-12 |
| PW8-COMP-016 | Footer | `footer` | Optional future links | Tab if links exist | Visible | Identity text | Static | Identity only | Full width | Second H1; conversion CTA | PW-12 |
| PW8-COMP-017 | Conditional AI clarification | Paragraph | None | Reading | n/a | Text | Inactive default | Trigger copy only | Adjacent to trigger | Standalone AI section; alert | PW-6 / PW-12 |
| PW8-COMP-018 | Optional abstract visual | Image or CSS | None | Ignored if decorative | n/a | Empty or equivalent | Absent default | HOLD | Text-first fallback | Required image; empty panel | PW-10 |
| PW8-COMP-019 | Not-found content | Page or section | Recovery links that exist | Keyboard to Sign in or public home if it exists | Visible | Honest title | Route | Later ownership | Same principles | Fake product routes | PW-13 / PW-14 |
| PW8-COMP-020 | Loading state | Optional status | None | Not a trap | If used, short | Non-sensitive | Technical necessity only | None on static page | n/a | Copying Home pending chrome | PW-13 |
| PW8-COMP-021 | Error state | Status or alert as defined | Recovery | Focus to message if blocking | Visible | Describes read or Inloggen (`PW6-A11Y-015`) | Failure | Real next step | n/a | Sensitive diagnostics | PW-13 |

Component count: 21.

---

## 28. Component-State Model

Unique contiguous family `PW8-STATE-001` onward. Meaningless hover states are not defined for purely static paragraphs.

| ID | Component | State | Required behaviour | Prohibited |
| --- | --- | --- | --- | --- |
| PW8-STATE-001 | Link | Default | Recognisable as a link in context | Colour-only on a sentence of mixed links if later used in body |
| PW8-STATE-002 | Link | Hover | Optional enhancement; not required for use | Hover-only destination |
| PW8-STATE-003 | Link | Focus-visible | `PW8-FOCUS-*` | Outline removed |
| PW8-STATE-004 | Link | Active/pressed | Transient; does not look like current section unless it is | Sticky pressed that implies a live app |
| PW8-STATE-005 | Link | Current section | Optional; not colour-only; matches focused heading | Fake current on unimplemented anchors |
| PW8-STATE-006 | Link | Visited | Optional; contrast maintained | Visited style implying Join completed |
| PW8-STATE-007 | Link | Unavailable destination | Omit the control | Dead or disabled nav item |
| PW8-STATE-008 | Link | Wrapping | Multi-line target still hittable; name intact | Truncation that drops meaning |
| PW8-STATE-009 | Link | High contrast | Link underline or system link colour survives | Transparent text |
| PW8-STATE-010 | Disclosure button | Closed | `aria-expanded="false"` or native closed `details`; in-page links not tabbable | Hidden links still focusable |
| PW8-STATE-011 | Disclosure button | Open | Expanded true; panel visible | Open with empty panel |
| PW8-STATE-012 | Disclosure button | Hover | Optional | Hover-only open |
| PW8-STATE-013 | Disclosure button | Focus-visible | Visible indicator | Clip in header |
| PW8-STATE-014 | Disclosure button | Keyboard activated | Enter/Space toggle | Mouse-only |
| PW8-STATE-015 | Disclosure button | Touch activated | Up-event / native activation | Immediate down-event custom handler |
| PW8-STATE-016 | Disclosure button | Dismissed | Closed; focus restored to trigger | Focus lost to `body` |
| PW8-STATE-017 | Disclosure button | Reduced motion | Instant open/close | Required animation |
| PW8-STATE-018 | Disclosure button | No-JavaScript fallback | Native `details` or visible headings | Blank header with no nav |
| PW8-STATE-019 | Navigation panel | Hidden | Not displayed; not in tab order; not `visibility` tricks that keep focus | `display` visible off-screen but tabbable |
| PW8-STATE-020 | Navigation panel | Visible | Lists in-page items in frozen order | Different order than desktop |
| PW8-STATE-021 | Navigation panel | Opening | Non-essential motion only | Content unreadable during open |
| PW8-STATE-022 | Navigation panel | Closing | Returns to hidden | Close without restoring focus |
| PW8-STATE-023 | Navigation panel | Focus entered | Keyboard users can reach each item | Skip hidden duplicates |
| PW8-STATE-024 | Navigation panel | Focus restored | Trigger receives focus after Escape | Focus jumps to Sign in unexpectedly |
| PW8-STATE-025 | Navigation panel | Route/anchor selected | Close; move to destination per Model B | Stay open covering the heading |
| PW8-STATE-026 | Navigation panel | Viewport changed while open | If labels now fit, return to `PW7-NAV-001` without a trap | Desktop and mobile duplicate focusable sets |
| PW8-STATE-027 | Sign in | Header | Visible utility link | Billboard CTA |
| PW8-STATE-028 | Sign in | Access section | Second same-purpose link | Different destination |
| PW8-STATE-029 | Sign in | Narrow viewport | Remains visible outside disclosure where feasible | Hidden only inside a failed menu |
| PW8-STATE-030 | Sign in | Wrapped header | Still a 24px-minimum target; preferred 44px | Collision with disclosure |
| PW8-STATE-031 | Sign in | Focus-visible | Meets focus standard | Outline same colour as header fill with no offset |
| PW8-STATE-032 | Sign in | Destination unavailable | Honest login/fallback error; no fake public account-create | Disabled Inloggen that pretends join exists |
| PW8-STATE-033 | Static status | Closed beta | Visible text | Badge-only |
| PW8-STATE-034 | Static status | Honest stop | Visible text after Sign in | Alert role |
| PW8-STATE-035 | Static status | Trust note | List items after heading | Icon-only |
| PW8-STATE-036 | Static status | Qualifier attached | Immediately after claim | Hover tooltip |
| PW8-STATE-037 | Static status | High contrast / text resize | Text remains; wraps | Clipped qualifier |
| PW8-STATE-038 | Optional visual | Absent | Complete text page | Empty reserved column |
| PW8-STATE-039 | Optional visual | Decorative | Empty alt / CSS; ignored | Named `image` with filename |
| PW8-STATE-040 | Optional visual | Informative | Concise equivalent | Screenshot of private Home data |
| PW8-STATE-041 | Optional visual | Failed to load | Collapse omitted | Broken-image box as proof |
| PW8-STATE-042 | Optional visual | Reduced motion | Static fallback | Required parallax |
| PW8-STATE-043 | Optional visual | High contrast | Omit if it fails; text remains | Essential background image |
| PW8-STATE-044 | Disclosure button | Disabled / unavailable | Not applicable on this homepage. Omit the control rather than disable it | Disabled menu that hides Sign in |
| PW8-STATE-045 | Page / disclosure | Loading | Not applicable on the static homepage unless a later technical wait is unavoidable (`PW8-COMP-020`). Honest stop is not a loading or error state | AppShell `Loading workspace…` copied to public page |

State count: 45. Loading and disabled disclosure are recorded as not applicable on the static homepage, not as invented flows.

---

## 29. Error and Fallback States

| ID | Condition | Requirement |
| --- | --- | --- |
| PW8-ERROR-001 | Invalid in-page fragment | Show the page start; do not fake a section. Prefer staying at top with main available |
| PW8-ERROR-002 | Missing destination | Do not render the corresponding in-page link |
| PW8-ERROR-003 | Failed optional image | Omit; no empty panel |
| PW8-ERROR-004 | JavaScript unavailable | Core content readable; skip link native; in-page native fragments; disclosure native `details` or headings visible |
| PW8-ERROR-005 | Disclosure script failure | Same as ERROR-004; Sign in still outside |
| PW8-ERROR-006 | `/login` unavailable | Do not create a fake fallback route; show an honest error on the login surface or a generic public not-found if that route owns it |
| PW8-ERROR-007 | Authentication transition | Public page does not animate a logged-in marketing state. Authenticated users are not the public audience |
| PW8-ERROR-008 | Stale session | Login/session messaging stays on auth surfaces (`PW4-A11Y-009`). Public page does not impersonate session state |
| PW8-ERROR-009 | Public not-found | Honest non-existence; recovery to public home if it exists, or to `/login` as utility, without implying join |
| PW8-ERROR-010 | Legal destination unavailable | Omit the link |
| PW8-ERROR-011 | Metadata/indexation not ready | Do not claim SEO completeness; title still names ZyntixAI honestly |
| PW8-ERROR-012 | Optional AI inactive | Omit the clarification; do not leave a hidden live region |
| PW8-ERROR-013 | Screenshot unavailable | Text-only proof remains (`PW7-PROOF-001`) |
| PW8-ERROR-014 | Font loading failure | System font fallback; no invisible text (avoid `visibility: hidden` while waiting that never resolves) |
| PW8-ERROR-015 | CSS partial failure / high contrast | Semantic HTML remains readable; lists, headings, and links still make sense |

Principles: core content remains readable; Sign in failure does not create a fake fallback route; no dead or misleading disabled controls; errors do not expose tokens, emails of other users, or stack traces.

```text
OWNER FROZEN PROGRESSIVE-ENHANCEMENT POLICY — IMPLEMENTATION VALIDATION REQUIRED
```

Owner-frozen (`PW8-OD-016`): core content and essential navigation remain usable without JavaScript. Sign in remains a real link. Genuine in-page anchors remain usable. No essential meaning depends on script. Optional visuals may disappear safely. No empty panels. Disclosure implementation must provide a usable fallback; a native disclosure may remain available. If enhancement fails, navigation links must not become unreachable. Unavailable destinations remain omitted. Honest stop remains visible.

---

## 30. Form Boundary

The frozen homepage contains no public form.

There is no signup form, waitlist form, contact form, beta-request form, search form, or AI-provider form.

Form accessibility is therefore not an active homepage component requirement.

Future gate: if a form is later authorized by a separate owner decision, that work requires its own requirements for labels, instructions, errors, validation, autocomplete, input purpose, grouping, focus, announcements, privacy, submission state, and success state. This file does not design an unauthorized form.

---

## 31. Zoom, Reflow and Text Resize

Carry-forward from PW-7 (`PW7-A11Y-012`, `PW7-A11Y-013`) plus stronger planned validation.

| ID | Target | Class | Status |
| --- | --- | --- | --- |
| PW8-ZOOM-001 | 200% browser zoom | WCAG 2.2 AA 1.4.4-oriented | `PROPOSED ACCESSIBILITY VALIDATION TARGET — NOT EXECUTED` |
| PW8-ZOOM-002 | 320 CSS-pixel layout width | WCAG 2.2 AA 1.4.10-oriented | `PROPOSED ACCESSIBILITY VALIDATION TARGET — NOT EXECUTED` |
| PW8-ZOOM-003 | 400% zoom/reflow on a representative 1280 CSS-pixel wide starting viewport | WCAG 2.2 AA 1.4.10 equivalent; planned additional check | `PROPOSED ACCESSIBILITY VALIDATION TARGET — NOT EXECUTED` |
| PW8-ZOOM-004 | Text-only zoom / text resize where supported | Product + 1.4.4 | Not executed |
| PW8-ZOOM-005 | Long Dutch words (`verantwoordelijkheden`, `gesloten`, `voortgang`) wrap or break without covering controls | Product | Not executed |
| PW8-ZOOM-006 | Increased line height, paragraph spacing, letter spacing per 1.4.12 | WCAG 2.2 AA 1.4.12-oriented | Not executed |
| PW8-ZOOM-007 | Larger default font does not clip H1, qualifiers, Sign in, or disclosure | Product | Not executed |
| PW8-ZOOM-008 | No two-dimensional scrolling for normal page content; header may wrap rather than force horizontal pan | 1.4.10-oriented | Not executed |
| PW8-ZOOM-009 | Navigation disclosure remains operable; Sign in remains visible; qualifiers remain | PW-7 | Not executed |
| PW8-ZOOM-010 | No overlapping or lost text | Product | Not executed |
| PW8-ZOOM-011 | Orientation change (portrait/landscape) does not lose content, controls, or frozen qualifiers | Product; not a device claim | `PROPOSED ACCESSIBILITY VALIDATION TARGET — NOT EXECUTED` |

Do not claim success. All zoom/reflow rows remain `PLANNED — NOT EXECUTED` / `PROPOSED — NOT ACHIEVED`.

```text
OWNER FROZEN ZOOM/REFLOW VALIDATION SCOPE — NOT EXECUTED
```

Owner-frozen (`PW8-OD-014`): mandatory planned validation is 200% browser zoom, 320 CSS-pixel reflow, and text resize plus increased spacing. Additional planned validation is representative 400% zoom/reflow. No clipped or overlapping text; no lost controls; no hidden qualifiers; no essential two-dimensional scrolling for normal page content; Sign in remains available; disclosure remains usable; long Dutch words wrap safely; frozen copy is not shortened merely to pass. 400% remains a planned evidence target, not an achieved result.

---

## 32. Keyboard Contract

Prefer native keyboard behaviour. Do not invent application shortcuts.

| ID | Action | Required behaviour |
| --- | --- | --- |
| PW8-KEY-001 | Initial Tab | Focuses the skip link |
| PW8-KEY-002 | Skip activation | Focus to `main`; H1 is next in reading order |
| PW8-KEY-003 | Brand link | In tab order if linked |
| PW8-KEY-004 | Primary nav links | Tab in visual/DOM order when the full nav is shown |
| PW8-KEY-005 | Disclosure button | In tab order at the disclosure threshold; Enter/Space toggles |
| PW8-KEY-006 | Open disclosure | Next Tabs reach disclosed in-page links, then leave without a trap. Owner-frozen non-modal inline pattern does not use forced modal focus containment (`PW8-OD-006`) |
| PW8-KEY-007 | Escape | Closes an enhanced open disclosure; ignored when closed. Not required to invent Escape behaviour on unmodified native `details` if the user agent does not provide it (`PW8-OD-006`) |
| PW8-KEY-008 | Focus restoration | Returns to the trigger after Escape/dismiss |
| PW8-KEY-009 | Header Sign in | Reachable without opening the disclosure where feasible |
| PW8-KEY-010 | In-page anchors | Enter activates; Model B moves focus to the heading |
| PW8-KEY-011 | Access Sign in | After access status in tab order |
| PW8-KEY-012 | Footer | After access; only if links exist |
| PW8-KEY-013 | Shift+Tab | Reverse of the above; no skip-link trap |
| PW8-KEY-014 | Space | Activates buttons, not links (native) |
| PW8-KEY-015 | Arrow keys | Not required for this simple nav. Do not add a roving tabindex unless a later pattern truly needs it |
| PW8-KEY-016 | No keyboard trap | Always a Tab or Escape path out |
| PW8-KEY-017 | `tabindex` | No positive tabindex. `tabindex="-1"` only on `main` and destination headings |
| PW8-KEY-018 | Non-interactive focus | Not used except programmatic destination headings |

---

## 33. Screen-Reader Contract

Do not require a particular proprietary screen reader. Planned expectations only.

| ID | Topic | Planned expectation |
| --- | --- | --- |
| PW8-SR-001 | Page title | Announces ZyntixAI and operational purpose, not GA or “best” |
| PW8-SR-002 | Language | Matches the chosen language model; Dutch copy not announced as English if Model A is implemented |
| PW8-SR-003 | Landmarks | Banner, named navigation, main, contentinfo discoverable |
| PW8-SR-004 | H1 | Single; frozen hero headline |
| PW8-SR-005 | Section headings | Today, Course Seller, trust, access discoverable; value/mechanism per `PW8-HEAD-004` |
| PW8-SR-006 | Navigation label | Unique; links named by visible labels |
| PW8-SR-007 | Disclosure state | Expanded/collapsed announced via control semantics |
| PW8-SR-008 | Repeated Sign in | Same name and destination; understood as the same action in two places |
| PW8-SR-009 | Beta status | Heard as text, not omitted |
| PW8-SR-010 | Today qualifier | Follows the Today claim |
| PW8-SR-011 | Course Seller qualifier | Follows the relevance claim; not skipped because of `aside` |
| PW8-SR-012 | Trust list | List semantics; named-controls meaning |
| PW8-SR-013 | Access stop | Heard after Sign in as a stop, not a failed CTA |
| PW8-SR-014 | Footer | Identity; no extra CTA |
| PW8-SR-015 | Optional image | Decorative silent; informative equivalent present |
| PW8-SR-016 | Errors / dynamic disclosure | Per announcement policy; no alert spam |
| PW8-SR-017 | Product name `Today` | Heard in the Dutch sentence as the frozen English product noun; pronunciation follow-up is `PW8-Q-003`, not a copy rewrite |

Planned later representative combinations remain `PLANNED — NOT EXECUTED`. Owner-frozen minimum planned representative scope (`PW8-OD-015`), subject to available governed test environments:

- NVDA with a current Chromium-based browser;
- NVDA with Firefox where feasible;
- VoiceOver with Safari where an Apple test environment is available.

```text
OWNER FROZEN SCREEN-READER TEST SCOPE — ENVIRONMENT-DEPENDENT EXECUTION
```

Document test environment and versions. Test page title and language, landmarks and headings, disclosure name and state, repeated Sign in links, beta status, Today and Course Seller qualifiers, trust list, access stop, and errors/fallback where implemented. Automated scanning does not replace manual testing. If an environment is unavailable: do not fabricate results; record the evidence gap; keep the applicable publication gate open.

---

## 34. High Contrast and Forced Colours

| ID | Requirement |
| --- | --- |
| PW8-HC-001 | Text remains using system CanvasText or equivalent; no transparent fill text |
| PW8-HC-002 | Links remain distinguishable as links (system LinkText or underline) |
| PW8-HC-003 | Focus indicator survives (system Highlight or a two-line fallback) |
| PW8-HC-004 | Disclosure open/closed is not conveyed only by background fill |
| PW8-HC-005 | Borders that group access/trust panels remain or are replaced by headings/lists |
| PW8-HC-006 | Custom icons remain visible or are omitted safely |
| PW8-HC-007 | Hidden navigation is not revealed only by colour; it is not displayed and not focusable |
| PW8-HC-008 | Selected/current indication uses more than a fill colour |
| PW8-HC-009 | Closed beta remains text; no essential background image; no gradient-clipped essential text |
| PW8-HC-010 | Forced-colour testing is planned, not executed |

---

## 35. Accessibility Acceptance Matrix

Strict AND logic. A component is not accepted unless every column for that row can later pass. No row is passed in this phase.

| ID | Component | Semantic | Keyboard | Focus | Name | Order | Responsive | Contrast | Motion | Fallback | Failure condition | Planned evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW8-ACC-001 | Page shell | lang + title + one H1 | Landmarks reachable | n/a | Title honest | Clusters 1–8 | Isolated layout | Text 4.5:1 | Independent | Readable without CSS extras | English lang on Dutch page; two H1s | DOM + SR (`PW8-VAL-001`–`004`) |
| PW8-ACC-002 | Skip link | First link | First Tab; Enter | Visible on focus | Dutch name | Before header | 320 / 200% | Non-text 3:1 | n/a | Native fragment | Target not focusable | Keyboard (`PW8-VAL-005`) |
| PW8-ACC-003 | Header | `header` banner | Identity and Sign in reachable | Not covering targets | Brand name | Before main | Static wrap | Header text | No required motion | Identity visible without JS | Sticky covering H1 without offset | Keyboard + zoom |
| PW8-ACC-004 | Primary navigation | Named `nav` | Tab each live link | Visible | Frozen labels | Matches DOM | Fit or disclose | Link contrast | n/a | Headings remain | `href="#"` | DOM + keyboard |
| PW8-ACC-005 | Disclosure | Button/summary | Enter/Space; Escape when enhanced | Restore | Named | Hidden when closed | 320 operable | Control contrast | Reduced motion | `details` or headings | Trap; hidden focusable | Keyboard (`PW8-VAL-008`–`011`) |
| PW8-ACC-006 | Hero | One H1 | Reading | Skip lands in main | H1 text | First in main | Single column | 4.5:1 | Independent | Complete without image | Image-only meaning | DOM + zoom |
| PW8-ACC-007 | Beta status | Text | n/a | n/a | Full sentences | With hero | Not omitted | Not colour-only | n/a | Visible without CSS colour | Badge-only | SR + visual |
| PW8-ACC-008 | Value/mechanism | Section + headings per HEAD-004 | Reading | Model B when linked | Proposed H2s | After hero | Continuous stack | 4.5:1 | Independent | Anti-replacement present | Cards; omitted clause | Reading order |
| PW8-ACC-009 | Today proof | H2 section | Reading | Heading discoverable | Frozen H2 | After value | Text-only | 4.5:1 | Independent | Complete without screenshot | Public demo reading | SR qualifier |
| PW8-ACC-010 | Course Seller | Section in main | Reading | H2 | Frozen H2 | After Today | Intact unit | 4.5:1 | Independent | Qualifier present | Complementary skip; LMS | SR qualifier |
| PW8-ACC-011 | Trust | H2 + list | Reading | H2 | Frozen H2 | After CS | Compact list | 4.5:1 | Independent | Understandable without icons | Certification claim | SR list |
| PW8-ACC-012 | Access | H2 section | Sign in after status | H2 + link | Frozen H2 | Before footer | Compact | 4.5:1 | Independent | Stop visible | Signup control | SR stop |
| PW8-ACC-013 | Sign in | Links | Both placements | Visible | `Inloggen` | Header and access | Visible at 320 | Link contrast | n/a | Native `/login` | Hidden; join label | Keyboard + 320 |
| PW8-ACC-014 | Footer | Contentinfo | After access | If links | Identity | Last | Wraps | 4.5:1 | n/a | Identity without JS | Second H1 | DOM |
| PW8-ACC-015 | Optional visual | Decorative or informative | Ignored if decorative | n/a | Empty or equivalent | After text | Omitted when empty | Decorative exempt | Static fallback | Absent complete | Empty panel; private screenshot | Image-off |
| PW8-ACC-016 | Conditional AI text | Paragraph or omitted | Reading | n/a | Text | Adjacent trigger | Inactive default | 4.5:1 | n/a | Omitted when inactive | Alert; AI hero | Content review |
| PW8-ACC-017 | Not-found/fallback | Honest page | Recovery links | Visible | Honest title | Logical | Same zoom rules | 4.5:1 | n/a | Readable without JS | Fake product | Manual |
| PW8-ACC-018 | Authenticated regression | AppShell unchanged | Existing skip still first | Existing outline | English skip name on product | Unchanged | Unchanged | Unchanged | Unchanged | Existing tests remain meaningful | Public CSS leaking into Home | AppShell tests |

Acceptance-record count: 18.

---

## 36. Risk Register

Non-defect future-risk scale: CRITICAL / HIGH / MEDIUM / LOW. Present P0/P1 defects remain separate and are currently none.

| ID | Risk | Severity | Likelihood | Trigger | Harm | Prevention | Detection | Owner | Gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW8-RSK-001 | Wrong page language | HIGH | High if Model B or C ships | Shared root `lang="en"` or global Dutch | AT announces the wrong language | Model A isolation | Lang inspection | PW-13 | PW-13 |
| PW8-RSK-002 | Dutch page announced as English | HIGH | High without isolation | Inherit root layout | Mispronunciation; comprehension loss | Isolated public layout | SR check | PW-13 | `PW8-VAL-004` |
| PW8-RSK-003 | Duplicate or missing H1 | HIGH | Medium | Brand as H1 plus hero H1 | Outline failure | HEAD-001 | Heading outline | PW-9 / PW-13 | `PW8-VAL-002` |
| PW8-RSK-004 | Incorrect heading hierarchy | MEDIUM | Medium | Visual size driving tags | Sections undiscoverable | HEAD-002 | Outline | PW-9 | `PW8-VAL-002` |
| PW8-RSK-005 | Landmark noise | MEDIUM | Medium | Every cluster as complementary | AT noise | LAND-008 | Landmark list | PW-13 | `PW8-VAL-003` |
| PW8-RSK-006 | Missing skip link | HIGH | Medium | Implementing header first | Keyboard tax | SKIP-001 | First Tab | PW-13 | `PW8-VAL-005` |
| PW8-RSK-007 | Skip target not focusable | HIGH | Medium | Fragment without tabindex on `main` | Focus stays on skip | SKIP-003 | Keyboard | PW-13 | `PW8-VAL-005` |
| PW8-RSK-008 | Visual order differs from DOM | HIGH | Medium | CSS grid creative order | Meaning reversed | ORDER-001 | CSS-off reading | PW-9 | `PW8-VAL-001` |
| PW8-RSK-009 | CSS `order` reorders focus | HIGH | Medium | Flex order on header | Keyboard sequence lies | ORDER-002 | Tab test | PW-13 | `PW8-VAL-006` |
| PW8-RSK-010 | Mobile menu without button semantics | HIGH | Medium | `div` hamburger | Keyboard/AT failure | NAV-001 | DOM | PW-13 | `PW8-VAL-008` |
| PW8-RSK-011 | Incorrect `aria-expanded` | HIGH | Medium | Stale React state | AT lies | NAV-003 | SR | PW-13 | `PW8-VAL-033` |
| PW8-RSK-012 | Focus lost after close | HIGH | Medium | Remove panel from DOM | Keyboard disorientation | NAV-008 | Keyboard | PW-13 | `PW8-VAL-010` |
| PW8-RSK-013 | Keyboard trap | CRITICAL | Low if modal chosen casually | Focus loop in overlay | Blocked user | KEY-016 | Keyboard | PW-13 | `PW8-VAL-011` |
| PW8-RSK-014 | Escape not working | HIGH | Medium | Custom overlay | No dismiss | KEY-007 | Keyboard | PW-13 | `PW8-VAL-009` |
| PW8-RSK-015 | Disclosure hidden but focusable | HIGH | Medium | `opacity:0` / off-canvas | Tab to invisible links | STATE-019 | Tab when closed | PW-13 | `PW8-VAL-008` |
| PW8-RSK-016 | Sign in hidden at 320 px | HIGH | Medium | Menu-only Sign in | Existing accounts cannot sign in | NAV-011 | 320 inspect | PW-7 / PW-12 | `PW8-VAL-022` |
| PW8-RSK-017 | Anchor destination not announced | HIGH | Medium | Model A only | SR users lost | ANCHOR-010 | SR | PW-13 | `PW8-VAL-012` |
| PW8-RSK-018 | Focus covered by header | HIGH | Low while static; high if sticky later | Sticky without offset | Hidden heading | SKIP-005 | Visual keyboard | PW-13 | `PW8-VAL-014` |
| PW8-RSK-019 | Invisible focus | HIGH | Medium | `outline: none` | Keyboard users lost | FOCUS-001 | Keyboard | PW-11 | `PW8-VAL-015` |
| PW8-RSK-020 | Focus depending on colour only | MEDIUM | Medium | Text colour change | Low-vision miss | FOCUS-009 | Visual | PW-11 | `PW8-VAL-015` |
| PW8-RSK-021 | Insufficient target size | HIGH | Medium | Dense header | Missed taps | TARGET-001/002 | Measure | PW-11 | `PW8-VAL-026` |
| PW8-RSK-022 | Adjacent-target collision | HIGH | Medium | Identity + menu + Sign in | Wrong control | TARGET-003 | Measure | PW-11 | `PW8-VAL-026` |
| PW8-RSK-023 | Contrast failure | HIGH | Medium | Unchosen palette | Unreadable text | CONTRAST-001 | Measure | PW-11 | `PW8-VAL-016` |
| PW8-RSK-024 | Forced-colour failure | HIGH | Medium | Background-image text | Invisible content | HC-001 | Forced colours | PW-11 | `PW8-VAL-018` |
| PW8-RSK-025 | Maturity conveyed only by badge | HIGH | Medium | Visual design | AT/colour-blind miss | ANNOUNCE-001 | SR | PW-11 | `PW8-VAL-035` |
| PW8-RSK-026 | Qualifier omitted from accessibility tree | HIGH | Medium | `display:none` at mobile; `aside` skip | LMS or completeness reading | PRIN-007 | SR | PW-13 | `PW8-VAL-036`; `PW8-VAL-037` |
| PW8-RSK-027 | Live-region spam | MEDIUM | Low on static page | Decorative polite regions | Interruption | ANNOUNCE-010 | SR | PW-13 | Expert review |
| PW8-RSK-028 | Misuse of alert | MEDIUM | Medium | Beta as `role="alert"` | False urgency | ANNOUNCE-001 | DOM | PW-13 | Expert review |
| PW8-RSK-029 | Autoplay or essential motion | HIGH | Low if policy held | Decorative loop | Vestibular harm; meaning loss | MOTION-004 | Reduced-motion test | PW-11 | `PW8-VAL-019` |
| PW8-RSK-030 | Reduced-motion ignored | HIGH | Medium | Smooth-scroll only | Harm / unreadability | MOTION-003 | Prefers-reduced-motion | PW-13 | `PW8-VAL-019` |
| PW8-RSK-031 | Decorative image announced | MEDIUM | Medium | Missing empty alt | Noise | MEDIA-002 | SR | PW-10 | `PW8-VAL-032` |
| PW8-RSK-032 | Informative image missing equivalent | HIGH | Medium if screenshot authorized | Alt empty on proof image | Lost meaning | MEDIA-007 | SR | PW-10 | `PW8-VAL-032` |
| PW8-RSK-033 | Screenshot exposing private data | CRITICAL | Medium if HOLD ignored | Home capture | Privacy / tenant harm | MEDIA-007 HOLD | Privacy review | Privacy + owner | Screenshot authority |
| PW8-RSK-034 | Failed image leaving empty space | MEDIUM | Medium | Broken `img` in MODEL-002 | Incomplete-looking product | STATE-038 | No-image / fail tests | PW-13 | `PW8-VAL-029` |
| PW8-RSK-035 | Text clipping at zoom | HIGH | Medium | Fixed header heights | Lost copy | ZOOM-007 | 200%/400% | PW-12 | `PW8-VAL-020` |
| PW8-RSK-036 | Horizontal scrolling | HIGH | Medium | Nowrap Dutch strings | 1.4.10 fail | ZOOM-008 | 320 / 400% | PW-12 | `PW8-VAL-021`–`022` |
| PW8-RSK-037 | Long-word overflow | MEDIUM | High for Dutch | `verantwoordelijkheden` | Overlap | ZOOM-005 | Text resize | PW-12 | `PW8-VAL-025` |
| PW8-RSK-038 | Text resize breaking layout | HIGH | Medium | px-locked header | Lost controls | ZOOM-004 | Text resize | PW-12 | `PW8-VAL-023` |
| PW8-RSK-039 | Duplicate Sign in ambiguity | MEDIUM | Medium | Extra hidden names | Unclear purpose | NAME-007/008 | SR | PW-6 / PW-12 | `PW8-VAL-034` |
| PW8-RSK-040 | Inaccessible not-found | HIGH | Medium | Unstyled Next default | Dead end | ERROR-009 | Manual | PW-13 | `PW8-VAL-040` |
| PW8-RSK-041 | JavaScript failure removing navigation | HIGH | Medium | Client-only menu | No in-page or Sign in path | NAV-012 | No-JS | PW-13 | `PW8-VAL-030` |
| PW8-RSK-042 | No-JavaScript path unavailable | HIGH | Medium | JS-required anchors | Keyboard/AT/no-JS users blocked | ANCHOR-005 | No-JS | PW-13 | `PW8-VAL-030` |
| PW8-RSK-043 | Desired behaviour claimed as tested | CRITICAL | Medium in later reports | Status wording | False publication | PRIN-011 | Review | Evidence owner | B1-GATE.1 |
| PW8-RSK-044 | Shared accessibility CSS regresses Home | CRITICAL | High if globals/AppShell edited | Token or skip-link share | Closed Home reopened | PRIN-010 | AppShell tests | PW-13 | `PW8-VAL-042`; `PW8-VAL-043` |
| PW8-RSK-045 | `lang` change breaks authenticated surfaces | CRITICAL | High if Model B is used | Root layout edit | Home/login announced wrong | Model B owner-rejected; isolate public route | Auth SR spot-check | PW-13 | `PW8-OD-002` |
| PW8-RSK-046 | Compliance claim without audit | CRITICAL | Medium | Marketing pressure | Legal/trust harm | STD-007 | Publication review | Legal + PW-14 | PW-14 |
| PW8-RSK-047 | Value/mechanism H2 invented against PW-6 | HIGH | Medium | A11y outline pressure | Unfrozen copy | HEAD-004 | Copy diff | Product | `PW8-Q-028` |
| PW8-RSK-048 | Public skip link regresses authenticated skip contract | HIGH | Medium | Shared component | Home skip fails | SKIP-008/009 | Existing tests | PW-13 | `PW8-VAL-042` |
| PW8-RSK-049 | Dutch `Inloggen` leads to English `/login` | HIGH | High with current architecture | Utility link to existing login | Language switch may confuse; not a second join path | Keep `/login` English until separately changed; do not restyle login as Dutch marketing | SR + reading | PW-12 / PW-13 | `PW8-VAL-047` |
| PW8-RSK-050 | 44 CSS px presented as WCAG AA minimum | MEDIUM | Medium in later design | Token docs | False standards claim | `PW8-OD-008` 24px floor / 44px preference | Review | PW-11 | `PW8-VAL-026` |
| PW8-RSK-051 | Dialog or modal semantics on non-modal disclosure | HIGH | Medium | `role="dialog"` convenience | Unexpected trap; OD-006 breach | Non-modal inline; no dialog unless a later overlay is separately authorized | Keyboard / DOM | PW-13 | `PW8-VAL-011` |
| PW8-RSK-052 | `title` or tooltip as the only explanation | MEDIUM | Medium | Icon-only chrome | Hover-only meaning | `PW8-PRIN-013` | Pointer-off / SR | PW-11 | `PW8-VAL-045` |
| PW8-RSK-053 | Orientation change loses content or Sign in | MEDIUM | Medium | Landscape/portrait reflow | Lost functionality | `PW8-ZOOM-011` | Orientation inspect | PW-12 | `PW8-VAL-048` |

Risk count: 53. Scale remains CRITICAL / HIGH / MEDIUM / LOW. Not deferred present P1 defects.

---

## 37. Validation Plan

Every row: `PLANNED — NOT EXECUTED`. Every threshold: `PROPOSED — NOT ACHIEVED`.

| ID | Validation | Method | Threshold | Evidence later |
| --- | --- | --- | --- | --- |
| PW8-VAL-001 | Semantic DOM inspection | Manual DOM | Native landmarks/headings present | Notes |
| PW8-VAL-002 | Heading outline | Outline tool + manual | One H1; no unjustified skips | Notes |
| PW8-VAL-003 | Landmark inspection | AT / DOM | One each banner, named nav, main, contentinfo | Notes |
| PW8-VAL-004 | Page-language inspection | DOM `lang` | Matches owner language model | Notes |
| PW8-VAL-005 | Skip-link keyboard test | Keyboard | First focus; visible; moves to main | Notes |
| PW8-VAL-006 | Full keyboard traversal | Keyboard | All interactive; order matches DOM | Notes |
| PW8-VAL-007 | Reverse keyboard traversal | Shift+Tab | Reverse of VAL-006; no trap | Notes |
| PW8-VAL-008 | Disclosure open/close | Keyboard + pointer | States match semantics | Notes |
| PW8-VAL-009 | Escape | Keyboard | Closes enhanced open disclosure; native `details` follows the user agent; ignored when closed | Notes |
| PW8-VAL-010 | Focus restoration | Keyboard | Trigger refocused | Notes |
| PW8-VAL-011 | Focus containment where applicable | Keyboard | No trap; non-modal inline does not force containment | Notes |
| PW8-VAL-012 | Anchor navigation | Keyboard | Arrival understood | Notes |
| PW8-VAL-013 | Direct fragment arrival | URL | Section shown; Model B heading focus | Notes |
| PW8-VAL-014 | Visible focus | Keyboard | Indicator not clipped or covered | Notes |
| PW8-VAL-015 | Focus vs hover vs current | Visual | Distinguishable | Notes |
| PW8-VAL-016 | Contrast measurement | Instrumented | 4.5:1 / 3:1 as applicable | Samples |
| PW8-VAL-017 | Non-text contrast | Instrumented | 3:1 UI / focus | Samples |
| PW8-VAL-018 | Forced-colour mode | OS/browser mode | Meaning without backgrounds | Notes |
| PW8-VAL-019 | Reduced motion | Prefers-reduced-motion | No required motion | Notes |
| PW8-VAL-020 | 200% zoom | Browser zoom | No clip/loss | Notes |
| PW8-VAL-021 | Proposed 400% zoom/reflow | Browser zoom | Reflow; no essential 2D scroll | Notes |
| PW8-VAL-022 | 320 px reflow | Viewport | No essential 2D scroll; Sign in visible | Notes |
| PW8-VAL-023 | Text resize | Browser/OS | Controls remain | Notes |
| PW8-VAL-024 | Increased text spacing | 1.4.12 CSS | No overlap | Notes |
| PW8-VAL-025 | Long Dutch words | Inspection | No overflow covering controls | Notes |
| PW8-VAL-026 | Target-size measurement | CSS/computed | 24px min; 44px preferred for primary header/nav | Samples |
| PW8-VAL-027 | Pointer cancellation | Pointer | No down-only custom activation | Notes |
| PW8-VAL-028 | No-image state | Disable images | Complete page | Notes |
| PW8-VAL-029 | Image-failure state | Broken src | No empty panel | Notes |
| PW8-VAL-030 | No-JavaScript state | Disable JS | Nav and content remain | Notes |
| PW8-VAL-031 | CSS partial-failure state | Disable author CSS | Semantics readable | Notes |
| PW8-VAL-032 | Screen-reader reading order | Manual SR | Matches ORDER-* | Notes |
| PW8-VAL-033 | Disclosure-state announcement | SR | Expanded/collapsed correct | Notes |
| PW8-VAL-034 | Repeated Sign in purpose | SR | Same action | Notes |
| PW8-VAL-035 | Beta-status comprehension | SR + reading | Both sentences heard | Notes |
| PW8-VAL-036 | Today qualifier | SR | After claim | Notes |
| PW8-VAL-037 | Course Seller qualifier | SR | After claim; not skipped | Notes |
| PW8-VAL-038 | Trust interpretation | SR | Named controls; no certification | Notes |
| PW8-VAL-039 | Access honest stop | SR | Stop after Sign in | Notes |
| PW8-VAL-040 | Not-found experience | Manual | Honest recovery | Notes |
| PW8-VAL-041 | Authenticated-arrival state | Manual | Public page not mixed with Home chrome | Notes |
| PW8-VAL-042 | Regression of authenticated skip link | Existing tests | AppShell contract holds | Tests |
| PW8-VAL-043 | Regression of authenticated Home | Existing Home tests | No shared-CSS leak | Tests |
| PW8-VAL-044 | Automated accessibility scan | Non-proprietary or already-authorized tooling | Findings triaged; not a PASS | Report |
| PW8-VAL-045 | Manual expert review | Accessibility reviewer | Residual risk listed | Notes |
| PW8-VAL-046 | `Today` pronunciation in Dutch sentence | Manual SR | Frozen English noun remains; no silent translation | Notes |
| PW8-VAL-047 | Dutch `Inloggen` to English `/login` | Keyboard + SR | Destination is existing-account sign-in; language change is expected until separately changed; no join implication | Notes |
| PW8-VAL-048 | Orientation change | Viewport rotate | No lost text, Sign in, disclosure, or qualifiers | Notes |
| PW8-VAL-049 | Fragment history back/forward | Browser history | Arrival remains understandable; no trap | Notes |
| PW8-VAL-050 | Forced-colours link and focus | Forced-colour mode | Links and focus remain distinguishable (`PW8-HC-002`, `PW8-HC-003`) | Notes |

Validation count: 50. Automated tooling is not selected as a named proprietary service. Every row remains `PLANNED — NOT EXECUTED`. Every threshold remains `PROPOSED — NOT ACHIEVED`.

---

## 38. Open Questions

IDs `PW8-Q-001`–`028` are retained. Establishment recommendations remain historical. Status is reconciled to the owner freeze. Resolved questions are not deleted.

| ID | Question | Why it matters | Options | Establishment recommendation | Conservative default | Controlling OD | Downstream | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW8-Q-001 | Accessibility standards target | Sets later evidence bar | AA-oriented 2.2 / AAA extras / unspecified | `PW8-STD-001` | AA-oriented 2.2; no claim | `PW8-OD-001` | Evidence plan; not a conformance claim | `RESOLVED BY OWNER` |
| PW8-Q-002 | Route-scoped language implementation | Dutch vs English AT | Models A/B/C | Model A | Do not change root lang; isolate public route | `PW8-OD-002` | PW-13 isolation | `PARTIALLY RESOLVED BY OWNER` — model frozen; architecture later-gated |
| PW8-Q-003 | `Today` language annotation | Pronunciation | `lang="en"` on the noun / none | Optional annotation | Surrounding Dutch; keep noun | Not a 17th OD | PW-12 validation; PW-13 if needed | `OPEN VALIDATION DETAIL — DOES NOT REOPEN DUTCH-FIRST OR FROZEN COPY` |
| PW8-Q-004 | Semantic role of Course Seller aside | Whether AT skips it | `section` in main / `aside` / other | `section` in main | `section` in main | `PW8-OD-003` | PW-9 markup | `RESOLVED BY OWNER` |
| PW8-Q-005 | Skip-link target | Keyboard start | `main` / H1 / other | `main` | `main` | `PW8-OD-004` | PW-13 | `RESOLVED BY OWNER` |
| PW8-Q-006 | Anchor focus model | Arrival comprehension | A/B/C | B | B | `PW8-OD-005` | When anchors go live | `RESOLVED BY OWNER` — implementation later-gated |
| PW8-Q-007 | Disclosure interaction model | Keyboard complexity | Inline / overlay / off-canvas / modal | Inline non-modal | Inline; native `details` fallback | `PW8-OD-006` | PW-13 component | `PARTIALLY RESOLVED BY OWNER` — model frozen; component later-gated |
| PW8-Q-008 | Focus appearance standard | Visibility | 2px outline+offset / custom / AAA 2.4.13 | 2px outline+offset | Do not remove native outline without replacement | `PW8-OD-007` | PW-11 tokens | `RESOLVED BY OWNER` — colour later-gated |
| PW8-Q-009 | Target-size standard | Touch | 24px 2.5.8 floor / 44px product preference | 24 min + 44 preferred | 24px minimum | `PW8-OD-008` | PW-11 / PW-12 | `RESOLVED BY OWNER` |
| PW8-Q-010 | Link underline policy | Recognition | Always underline / in-nav exception / colour-only | Underline in body; nav placement plus extra cue | Never colour-only in body | `PW8-OD-009` | PW-11 tokens | `RESOLVED BY OWNER` — visual tokens later-gated |
| PW8-Q-011 | Visited-link treatment | History cue vs clutter | Distinct visited / same as default | Same as default on this static page | Same as default | `PW8-OD-009` | PW-11 | `PARTIALLY RESOLVED BY OWNER` — optional visited style remains visual |
| PW8-Q-012 | Contrast standard | Palette later | AA / stronger product | AA minima | AA minima | `PW8-OD-010` | PW-11 palette | `RESOLVED BY OWNER` — palette later-gated |
| PW8-Q-013 | High-contrast strategy | Forced colours | System colours / extra borders / both | Both | Semantic HTML first | `PW8-OD-010` | PW-11 / PW-12 | `PARTIALLY RESOLVED BY OWNER` — floors frozen; execution later |
| PW8-Q-014 | Motion policy | Vestibular risk | None / subtle / rich | Subtle, off when reduced | No motion | `PW8-OD-011` | PW-11 | `RESOLVED BY OWNER` |
| PW8-Q-015 | Active-section indication | Orientation | None / text+icon / colour | None initially | None | None | Later if anchors live | `OPEN — OPTIONAL LATER` |
| PW8-Q-016 | No-JavaScript disclosure fallback | Robustness | `details` / always-visible headings | `details` plus persistent Sign in | Headings always in `main` | `PW8-OD-016` | PW-13 | `PARTIALLY RESOLVED BY OWNER` — policy frozen; exact component later |
| PW8-Q-017 | Focus containment vs non-modal disclosure | Trap vs PW7-A11Y-010 | Non-modal Tab-through / contain while open | Non-modal inline; contain only if overlay | Non-modal | `PW8-OD-006` | PW-13 | `RESOLVED BY OWNER` — no forced modal containment |
| PW8-Q-018 | Direct-fragment focus | Deep links | Focus heading / scroll only | Focus heading | Focus heading | `PW8-OD-005` | When fragments exist | `RESOLVED BY OWNER` |
| PW8-Q-019 | Duplicate Sign in context | Ambiguity | Shared name / extra hidden context | Shared visible name | Shared name | `PW8-NAME-007/008` | PW-12 if testing fails | `OPEN VALIDATION DETAIL` |
| PW8-Q-020 | Optional visual alt strategy | AT noise | Decorative empty / informative | Decorative default | Decorative or absent | `PW8-OD-012` | PW-10 if visual added | `PARTIALLY RESOLVED BY OWNER` |
| PW8-Q-021 | Not-found ownership | Recovery path | Public 404 / login-only | Honest public 404 later | Do not fake routes | None | PW-13 | `OPEN TECHNICAL` |
| PW8-Q-022 | Automated tooling | Evidence support | Unspecified / later selected | Do not brand a vendor now | Manual-first | `PW8-OD-015` | PW-12 | `OPEN — EVIDENCE TOOLING` |
| PW8-Q-023 | Manual screen-reader matrix | Scope | One combo / multi OS | Cross-engine later | Do not fabricate missing environments | `PW8-OD-015` | PW-12 / PW-14 | `RESOLVED BY OWNER` — environment-dependent execution |
| PW8-Q-024 | 400% zoom target | Extra evidence | Required / optional | Planned additional | 200% + 320 required | `PW8-OD-014` | PW-12 | `RESOLVED BY OWNER` — not executed |
| PW8-Q-025 | Shared CSS isolation | Home regression | Public-only sheet / shared tokens | Public-only sheet | Do not edit `globals.css` | None | PW-13 | `OPEN TECHNICAL` |
| PW8-Q-026 | Regression-test ownership | Skip-link / Home | PW-13 tests / existing packs | Keep existing packs green; add public tests | Do not weaken Home tests | `PW8-OD-004` | PW-13 | `OPEN TECHNICAL` |
| PW8-Q-027 | Legal interpretation of accessibility obligations | Law vs product target | External counsel / none in-repo | External; not this file | No legal claim | `PW8-OD-001` | PW-14 | `OPEN — EXTERNAL LEGAL` |
| PW8-Q-028 | Visible H2 wording for value/mechanism | Outline vs frozen body | Reuse nav labels / later new copy / no H2s | Reuse frozen nav labels | No invented marketing H2 | None | PW-9 | `OPEN ASSEMBLY DETAIL — PW-9 GATE` |

Question-status totals: 28 retained. Fully resolved by owner: 13 (`001`, `004`, `005`, `006`, `008`, `009`, `010`, `012`, `014`, `017`, `018`, `023`, `024`). Partially resolved by owner: 6 (`002`, `007`, `011`, `013`, `016`, `020`). Open validation: 2 (`003`, `019`). Open optional later: 1 (`015`). Open technical: 3 (`021`, `025`, `026`). Open evidence tooling: 1 (`022`). Open external legal: 1 (`027`). Open assembly: 1 (`028`).

Settled PW-1 through PW-7 product and layout decisions are not reopened.

---

## 39. Owner Decision Register

Existing IDs `PW8-OD-001` through `PW8-OD-016` are retained without renumbering. Topics correspond in substance to the sixteen owner selections; wording is reconciled, not remapped.

Establishment status for every row was `OPEN — OWNER DECISION REQUIRED`. Current status for every row is `RESOLVED — OWNER FROZEN`. Recommendations are preserved as historical evidence. Owner selection is the freeze. `OWNER DECISION RESOLVED` is distinct from `IMPLEMENTATION OR EVIDENCE CONDITION UNRESOLVED`.

| ID | Topic | Options | Owner selection | Exact requirement | Status | Evidence | Mandatory condition | Prohibited interpretation | Downstream owner | Downstream gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW8-OD-001 | Accessibility target | STD-001 / stronger / unspecified | `WCAG 2.2 LEVEL AA-ORIENTED PRODUCT REQUIREMENTS` | AA-oriented A/AA criteria inform design and validation; stronger preferences may exceed AA; AAA extras do not convert the complete target to AAA | `RESOLVED — OWNER FROZEN` | WCAG 2.2 TR; establishment `PW8-STD-001` | `WCAG 2.2 AA-ORIENTED REQUIREMENTS TARGET — NOT A CONFORMANCE CLAIM` | WCAG compliant; certified; accessibility passed; legally compliant; audited | Product + legal | Implementation evidence; PW-14 legal |
| PW8-OD-002 | Language-semantics model | A / B / C | Language Model A — `ROUTE-SCOPED DUTCH DOCUMENT LANGUAGE` | Future Dutch public page uses Dutch document language; English auth and `/login` remain English; do not casually change global root `lang` | `RESOLVED — OWNER FROZEN` | Root `lang="en"`; Dutch copy; `PW8-LANG-001` | `OWNER FROZEN LANGUAGE MODEL — TECHNICAL ISOLATION REQUIRED` | Implemented language; Model B as convenience; shipping Dutch under English `html lang` | Product + PW-13 | Public layout isolation; Home regression |
| PW8-OD-003 | Course Seller semantic treatment | `section` / `aside` / other | `NORMAL SECTION WITHIN MAIN` | Titled `section` in `main`; visual aside remains layout; qualifier in the same section; discoverable by heading; no complementary landmark without demonstrated benefit; no CTA | `RESOLVED — OWNER FROZEN` | `PW7-CS-002`; SR skip risk | `OWNER FROZEN SECTION SEMANTICS — VISUAL ASIDE DOES NOT MEAN HTML ASIDE` | Course Sellers as brand-primary; HTML `aside` by default; LMS edition | PW-9 markup | Assembly |
| PW8-OD-004 | Skip-link target | `main` / H1 / other | `MAIN LANDMARK AS THE SKIP TARGET` | Dutch `Ga naar de hoofdinhoud`; first focusable; hidden until focused; `main` with `tabindex="-1"` as needed; no-JS; no AppShell edit | `RESOLVED — OWNER FROZEN` | `PW7-A11Y-006`; AppShell informs regression only | `OWNER FROZEN SKIP-LINK CONTRACT — AUTHENTICATED REGRESSION TEST REQUIRED` | AppShell rewrite; chrome copy as PW-6 body rewrite | PW-13 | Skip implementation + Home tests |
| PW8-OD-005 | In-page focus model | A / B / C | `ANCHOR MODEL B — MOVE FOCUS TO THE DESTINATION HEADING` | Real IDs; destination exists first; heading focus; fragment; direct arrival; back usable; reduced motion; heading not obscured | `RESOLVED — OWNER FROZEN` | `PW4-A11Y-007`; `PW7-A11Y-007` | `OWNER FROZEN IN-PAGE FOCUS MODEL — IMPLEMENTATION AND BROWSER VALIDATION REQUIRED` | Placeholder hashes; focus on a meaningless wrapper | PW-13 | When anchors go live |
| PW8-OD-006 | Mobile navigation interaction | Inline / overlay / off-canvas / modal | `NON-MODAL INLINE EXPANSION` | Least-complex native or button disclosure; named control; correct expanded state; Escape; focus restore; no trap; no forced modal containment; `Inloggen` outside where feasible | `RESOLVED — OWNER FROZEN` | `PW7-OD-003`; least complexity | `OWNER FROZEN NON-MODAL DISCLOSURE MODEL — COMPONENT IMPLEMENTATION LATER-GATED` | Hamburger icon freeze; modal by default | PW-13 | Component implementation |
| PW8-OD-007 | Focus appearance | 2px outline+offset / custom / AAA 2.4.13 | `2 CSS-PIXEL VISIBLE FOCUS OUTLINE WITH 2 CSS-PIXEL OFFSET` | `:focus-visible`; never remove without replacement; distinct from hover/current; not clipped; not colour-only; high-contrast resilient; colour later | `RESOLVED — OWNER FROZEN` | `globals.css` informs; not copied | `OWNER FROZEN FOCUS STANDARD — NOT IMPLEMENTED OR TESTED` | Implemented or tested focus; outline removed | PW-11 | Visual tokens + PW-12 keyboard |
| PW8-OD-008 | Target size | 24 AA / 44 preferred / mixed | 24×24 CSS-pixel standards floor; 44×44 CSS-pixel preference for primary header and navigation controls | Wrap rather than shrink below 24px; Sign in usable; 2.5.8 exceptions only when safe; 44px is not the AA minimum | `RESOLVED — OWNER FROZEN` | WCAG 2.2 2.5.8 / 2.5.5 | `OWNER FROZEN TARGET-SIZE STANDARD — 44PX PRODUCT PREFERENCE, 24PX STANDARDS FLOOR` | 44px as WCAG AA minimum; device-tested claim | PW-11 / PW-12 | Measurement |
| PW8-OD-009 | Link recognition | Underline always / nav exception / colour-only | `LINKS MUST BE RECOGNIZABLE WITHOUT RELYING ONLY ON COLOUR` | Body links use underline or another persistent non-colour cue; nav may use placement/grouping; hover supplemental; no `klik hier` | `RESOLVED — OWNER FROZEN` | WCAG 2.2 1.4.1 | `OWNER FROZEN LINK-RECOGNITION POLICY — VISUAL TOKENS LATER-GATED` | Colour-only body links | PW-11 | Tokens |
| PW8-OD-010 | Contrast | AA / stronger | `WCAG 2.2 AA-ORIENTED CONTRAST FLOORS` | Text 4.5:1; large 3:1; non-text UI/focus 3:1 where applicable; status not colour-only | `RESOLVED — OWNER FROZEN` | WCAG 2.2 1.4.3 / 1.4.11 | `OWNER FROZEN CONTRAST REQUIREMENTS — PALETTE AND MEASUREMENT LATER-GATED` | Contrast PASS; palette freeze | PW-11 / PW-12 | Measurement |
| PW8-OD-011 | Motion | None / subtle / rich | `SUBTLE NON-ESSENTIAL TRANSITIONS ONLY` | Page usable with no motion; reduced-motion removes or minimizes non-essential motion; no parallax/autoplay/loop/flash | `RESOLVED — OWNER FROZEN` | `PW5-A11Y-016`; `PW7-A11Y-015` | `OWNER FROZEN RESTRAINED MOTION POLICY — NO MOTION REQUIRED` | Motion as meaning; implemented animation | PW-11 | Tokens / reduced-motion tests |
| PW8-OD-012 | Icon policy | Text first / icon-plus-text / icon-only | `TEXT-FIRST; ICONS SUPPORT BUT DO NOT CARRY ESSENTIAL MEANING` | Decorative icons hidden from AT where appropriate; no icon replaces beta, CS qualifier, or Sign in; no required AI iconography | `RESOLVED — OWNER FROZEN` | `PW6-A11Y-009`; `PW8-MEDIA-*` | `OWNER FROZEN TEXT-FIRST ICON POLICY — ICONOGRAPHY LATER-GATED` | Icon-only essential meaning; certification icons | PW-10 | If icons are introduced |
| PW8-OD-013 | Status / live-region policy | Static / live / alert | `STATIC VISIBLE INFORMATION BY DEFAULT; LIVE REGIONS ONLY FOR GENUINE DYNAMIC UPDATES` | Beta, stop, qualifiers, and trust are static text; no `alert` for ordinary page information | `RESOLVED — OWNER FROZEN` | Static homepage | `OWNER FROZEN ANNOUNCEMENT POLICY — STATIC-FIRST` | Live-region spam; beta as alert | PW-13 | Implementation |
| PW8-OD-014 | Zoom / reflow target | 200%+320 / plus 400% | Mandatory planned 200%, 320 CSS px, text resize/spacing; additional planned 400% | No clip/overlap/lost controls/hidden qualifiers; no essential 2D scroll; copy not shortened merely to pass | `RESOLVED — OWNER FROZEN` | WCAG 2.2 1.4.4 / 1.4.10 / 1.4.12 | `OWNER FROZEN ZOOM/REFLOW VALIDATION SCOPE — NOT EXECUTED` | Zoom PASS; 400% achieved | PW-12 | Validation |
| PW8-OD-015 | Screen-reader validation scope | One combo / multi OS | `MANUAL CROSS-ENGINE SCREEN-READER VALIDATION` | Planned NVDA+Chromium; NVDA+Firefox where feasible; VoiceOver+Safari where an Apple environment is available; do not fabricate gaps | `RESOLVED — OWNER FROZEN` | No testing executed | `OWNER FROZEN SCREEN-READER TEST SCOPE — ENVIRONMENT-DEPENDENT EXECUTION` | Screen-reader VERIFIED; compliance from one scan | PW-12 / PW-14 | Manual SR |
| PW8-OD-016 | No-JavaScript fallback | `details` / always-visible / JS-required | `CORE CONTENT AND ESSENTIAL NAVIGATION REMAIN USABLE WITHOUT JAVASCRIPT` | Core readable; Sign in a real link; genuine anchors usable; disclosure fallback; no empty panels; no invented destinations | `RESOLVED — OWNER FROZEN` | Robustness; `PW8-ERROR-004` | `OWNER FROZEN PROGRESSIVE-ENHANCEMENT POLICY — IMPLEMENTATION VALIDATION REQUIRED` | JS-only essential nav; fake destinations | PW-13 | No-JS validation |

Decision-count reconciliation: total 16; fully resolved 16; partially resolved 0; open owner decisions 0.

---

## 40. Traceability

| ID | PW-8 coverage | Upstream |
| --- | --- | --- |
| PW8-MAP-001 | Protected boundaries; no Home/AppShell/globals mutation | `PW0-OUT-001`; `PW0-OUT-002`; `PW0-PB-001`; `PW0-PB-008`; `PW0-PB-012`; `PW0-PB-017`; `PW0-PB-018`; `PW0-PB-019`; `PW0-PB-020`; `PW0-PB-024`; `PW0-RQ-002`; `PW0-RQ-005`; `PW0-RQ-007`; `PW0-IN-007` |
| PW8-MAP-002 | Truth ceiling; no join/demo; Today/CS/AI limits | `PW1-CLM-014`; `PW1-CLM-015`; `PW1-CLM-018`; `PW1-PRH-003`; `PW1-PRH-022` |
| PW8-MAP-003 | Visitor comprehension, Sign in utility, safe stop | `PW2-OD-001`; `PW2-VIS-001`; `PW2-VIS-002`; `PW2-VIS-007`; `PW2-VIS-008` |
| PW8-MAP-004 | Messaging, trust named controls, maturity, CS | `PW3-MSG-001`; `PW3-MSG-002`; `PW3-MSG-005`; `PW3-MSG-007`; `PW3-MSG-009`; `PW3-TRU-002`; `PW3-TRU-003`; `PW3-TRU-004`; `PW3-TRU-005` |
| PW8-MAP-005 | IA landmarks, skip, keyboard, in-page focus, mobile menu, stops | `PW4-A11Y-001`; `PW4-A11Y-002`; `PW4-A11Y-003`; `PW4-A11Y-004`; `PW4-A11Y-005`; `PW4-A11Y-006`; `PW4-A11Y-007`; `PW4-A11Y-008`; `PW4-A11Y-009`; `PW4-A11Y-010`; `PW4-A11Y-011`; `PW4-A11Y-012`; `PW4-A11Y-013`; `PW4-A11Y-014`; `PW4-A11Y-015`; `PW4-A11Y-016`; `PW4-NEED-001`; `PW4-NEED-004`; `PW4-NEED-008` |
| PW8-MAP-006 | Content-model a11y, CS secondary, AI conditional, screenshot HOLD | `PW5-A11Y-001`; `PW5-A11Y-002`; `PW5-A11Y-003`; `PW5-A11Y-004`; `PW5-A11Y-005`; `PW5-A11Y-006`; `PW5-A11Y-009`; `PW5-A11Y-010`; `PW5-A11Y-011`; `PW5-A11Y-014`; `PW5-A11Y-015`; `PW5-A11Y-016`; `PW5-A11Y-017`; `PW5-OD-001`; `PW5-OD-002`; `PW5-OD-003`; `PW5-OD-006`; `PW5-BLK-007` |
| PW8-MAP-007 | Frozen copy, names, language, repeated Sign in, access stop | `PW6-OD-002`; `PW6-OD-003`; `PW6-OD-007`; `PW6-OD-008`; `PW6-OD-010`; `PW6-OD-011`; `PW6-A11Y-001`; `PW6-A11Y-002`; `PW6-A11Y-003`; `PW6-A11Y-004`; `PW6-A11Y-005`; `PW6-A11Y-006`; `PW6-A11Y-013`; `PW6-A11Y-014`; `PW6-A11Y-015`; `PW6-A11Y-016`; `PW6-A11Y-017`; `PW6-NAV-002`; `PW6-NAV-004`; `PW6-NAV-006`; `PW6-NAV-007`; `PW6-COPY-046`; `PW6-COPY-047`; `PW6-TRUST-007`; `PW6-ACCESS-008`; `PW6-ACCESS-009`; `PW6-RESP-011` |
| PW8-MAP-008 | Layout, nav disclosure, static header, a11y handoff to PW-8 | `PW7-OD-001`; `PW7-OD-002`; `PW7-OD-003`; `PW7-OD-004`; `PW7-OD-005`; `PW7-OD-006`; `PW7-OD-007`; `PW7-OD-008`; `PW7-OD-009`; `PW7-A11Y-001`; `PW7-A11Y-002`; `PW7-A11Y-003`; `PW7-A11Y-004`; `PW7-A11Y-005`; `PW7-A11Y-006`; `PW7-A11Y-007`; `PW7-A11Y-008`; `PW7-A11Y-009`; `PW7-A11Y-010`; `PW7-A11Y-011`; `PW7-A11Y-012`; `PW7-A11Y-013`; `PW7-A11Y-014`; `PW7-A11Y-015`; `PW7-A11Y-016`; `PW7-A11Y-017`; `PW7-A11Y-018`; `PW7-A11Y-019`; `PW7-A11Y-020`; `PW7-NAV-001`; `PW7-NAV-002`; `PW7-VALUE-001`; `PW7-PROOF-001`; `PW7-CS-002`; `PW7-TRUST-001`; `PW7-STATE-011` |
| PW8-MAP-009 | Skip / language / disclosure / focus / targets | This file `PW8-SKIP-*`; `PW8-LANG-*`; `PW8-NAV-*`; `PW8-FOCUS-*`; `PW8-TARGET-*` |
| PW8-MAP-010 | Component and state model | `PW8-COMP-*`; `PW8-STATE-*` |
| PW8-MAP-011 | Acceptance AND matrix | `PW8-ACC-*` |
| PW8-MAP-012 | Risks | `PW8-RSK-*` |
| PW8-MAP-013 | Planned validation | `PW8-VAL-*` |
| PW8-MAP-014 | Open questions | `PW8-Q-*` |
| PW8-MAP-015 | Owner decisions | `PW8-OD-*` |
| PW8-MAP-016 | HOLD/PROHIBIT constraints only | Screenshot HOLD; four-TG illustrations prohibited; AI inactive; no public form |

HOLD and PROHIBIT records constrain only. Planned validation is not achieved evidence.

| Authority | Unique references | Missing | Invalid use |
| --- | ---: | ---: | ---: |
| PW-0 | 14 | 0 | 0 |
| PW-1 | 5 | 0 | 0 |
| PW-2 | 5 | 0 | 0 |
| PW-3 | 9 | 0 | 0 |
| PW-4 | 19 | 0 | 0 |
| PW-5 | 18 | 0 | 0 |
| PW-6 | 28 | 0 | 0 |
| PW-7 | 39 | 0 | 0 |

---

## 41. Downstream Handoffs

If the repository later publishes a different governed phase map, follow that map and treat the labels below as capability handoffs.

### PW-8-R1

Independent accessibility-requirements review receives sixteen owner-frozen decisions; the distinction between requirements and conformance; route-scoped Dutch; skip-link, anchor-focus, and non-modal disclosure contracts; focus and target standards; contrast and link-recognition requirements; motion, icon, and announcement policy; zoom/reflow scope; screen-reader matrix; no-JavaScript policy; unresolved `Today` pronunciation detail; unresolved H2 assembly detail; and all technical and validation gates. PW-8-R1 may test internal consistency. It may not casually replace owner selections. This freeze did not start PW-8-R1. PW-8-R1 is now recorded in §46. PW-9 remains not started.

### PW-9

If governed as page assembly or wireframe work, receives the semantic outline, component inventory, state model, reading/focus order, Course Seller `section`-in-`main` rule, and the open H2 assembly detail (`PW8-Q-028`). No authority to alter PW-1 truth, frozen PW-6 copy, or owner-frozen accessibility decisions. PW-9 remains not started.

### PW-10 / PW-11

Visual design receives frozen focus, contrast, target-size, state, motion, link-recognition, and icon/image rules. Exact colour tokens remain later-gated. No authority to hide qualifiers, replace beta text with a badge, or introduce Join/Demo/Register.

### PW-12

Fidelity and validation receives the acceptance matrix, 200%/320/text-resize mandatory planned checks, additional 400% planned check, keyboard contract, owner-frozen screen-reader matrix, high-contrast requirements, `Today` pronunciation validation, and evidence expectations. All remain unexecuted until that phase runs them.

### PW-13

Technical architecture receives route-scoped Dutch isolation, root-layout risk, skip-link implementation isolation, public CSS isolation, non-modal disclosure implementation, Anchor Model B, no-JavaScript fallback, and authenticated skip-link/Home regression requirements. It does not receive permission to edit AppShell, `globals.css`, or `src/app/layout.tsx` as a convenience.

### PW-14

Publication readiness receives executed accessibility evidence, environment-dependent screen-reader gaps if any, and unresolved legal interpretation (`PW8-Q-027`). No publication PASS without required validation.

This freeze did not start PW-8-R1, PW-9, or later implementation. PW-8-R1 is now this review (§46). PW-9 remains not started.

---

## 42. Acceptance Gate

PW-8 establishment remains historical. PW8-OD owner freeze may pass only if the checklist in the owner-decision prompt is met. Result for this freeze:

| Check | Result |
| --- | --- |
| Preflight matches expected HEAD | Yes: `adcbd1707caa97a4b5511a56616210d7444a5663` |
| Only PW-8 changed | This file |
| Authorities reviewed | B1-GATE.1; PW-0–PW-7; this file |
| PW-1 remains truth ceiling | Yes |
| Authenticated Home remains closed | Yes |
| Frozen PW-6 copy unchanged | Yes |
| Frozen PW-7 layout unchanged | Yes |
| Sixteen owner decisions exist and are resolved | Yes |
| WCAG target is non-conformance | Yes |
| Route-scoped Dutch frozen; root lang not changed | Yes |
| Course Seller uses section semantics | Yes |
| Skip link targets `main` | Yes |
| Anchor focus targets destination heading | Yes |
| Mobile nav is non-modal inline disclosure | Yes |
| Focus, target, link, contrast, motion, icon, announcement, zoom, SR, no-JS frozen | Yes |
| `Today` pronunciation validation-gated | Yes |
| H2 wording PW-9-gated | Yes |
| Implementation unclaimed; validation unexecuted | Yes |
| Present P0 / P1 defects | 0 / 0 |
| PW-8-R1 / PW-9 started | At freeze time: No |

Because every freeze condition passes:

`PASS — PW8-OD OWNER ACCESSIBILITY DECISIONS FROZEN`

PW-8-R1 independent review may pass only if the R1 checklist is met. Result after correction of open P1 findings:

| R1 check | Result |
| --- | --- |
| Preflight exact | Yes |
| Only PW-8 changed | Yes |
| Sixteen owner decisions intact | Yes; 0 open |
| Open P0 / open P1 after correction | 0 / 0 |
| Standards claims bounded; no conformance claim | Yes |
| Frozen PW-6 copy quoted, not rewritten | Yes |
| Validation unexecuted | Yes |
| PW-9 started | No |

`PASS — PW-8-R1 INDEPENDENT ACCESSIBILITY REQUIREMENTS REVIEW CLOSED WITH EVIDENCE`

---

## 43. Final Status

```text
PW-8 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

Not stated: `CLOSED WITH EVIDENCE — PW-8`; `WCAG COMPLIANT`; `ACCESSIBILITY PASSED`; `KEYBOARD VERIFIED`; `SCREEN-READER VERIFIED`; `IMPLEMENTATION READY`; `PUBLICATION READY`.

Historical statuses retained: establishment awaiting owner decisions; owner freeze PASS; independent-review status was `PW-8 READY FOR INDEPENDENT ACCESSIBILITY REQUIREMENTS REVIEW` before this R1.

`Today` pronunciation (`PW8-Q-003`) and value/mechanism H2 wording (`PW8-Q-028`) remain later-gated details and do not block R1.

---

## 44. Evidence Appendix

### 44.1 Identifier census (master definitions)

Counts below are the specified master families. Mechanical uniqueness and continuity are verified after write.

| Family | From | To | Master count |
| --- | --- | --- | --- |
| PW8-PRIN | 001 | 013 | 13 |
| PW8-STD | 001 | 008 | 8 |
| PW8-SEM | 001 | 012 | 12 |
| PW8-LANG | 001 | 008 | 8 |
| PW8-HEAD | 001 | 010 | 10 |
| PW8-LAND | 001 | 009 | 9 |
| PW8-SKIP | 001 | 010 | 10 |
| PW8-ORDER | 001 | 012 | 12 |
| PW8-ROLE | 001 | 012 | 12 |
| PW8-NAME | 001 | 012 | 12 |
| PW8-ANCHOR | 001 | 010 | 10 |
| PW8-NAV | 001 | 012 | 12 |
| PW8-FOCUS | 001 | 010 | 10 |
| PW8-TARGET | 001 | 008 | 8 |
| PW8-CONTRAST | 001 | 012 | 12 |
| PW8-ANNOUNCE | 001 | 010 | 10 |
| PW8-MOTION | 001 | 008 | 8 |
| PW8-MEDIA | 001 | 012 | 12 |
| PW8-COMP | 001 | 021 | 21 |
| PW8-STATE | 001 | 045 | 45 |
| PW8-ERROR | 001 | 015 | 15 |
| PW8-ZOOM | 001 | 011 | 11 |
| PW8-KEY | 001 | 018 | 18 |
| PW8-SR | 001 | 017 | 17 |
| PW8-HC | 001 | 010 | 10 |
| PW8-ACC | 001 | 018 | 18 |
| PW8-RSK | 001 | 053 | 53 |
| PW8-VAL | 001 | 050 | 50 |
| PW8-Q | 001 | 028 | 28 |
| PW8-OD | 001 | 016 | 16 |
| PW8-MAP | 001 | 016 | 16 |
| PW8-R1-FND | 001 | 012 | 12 |
| Total master families above except R1-FND | | | 506 |
| Total including R1 findings | | | 518 |

### 44.2 Architecture inspection (read-only)

- Root layout `lang="en"`; shared metadata title `ZyntixAI`.
- Unauthenticated `/` redirects to `/login`.
- AppShell skip link: first focusable control, English name, `#main-content`, `main` `tabIndex={-1}`, clipped until focus, 2px outline.
- AppShell mobile pattern: native `details`/`summary` labelled `Menu`.
- `globals.css` defines shared focus outline and tokens used by product and login.
- Existing tests cover authenticated skip-link placement and overlay safety.
- These patterns inform regression requirements only.

### 44.3 Integrity

Whitespace, encoding, fence balance, prohibited tokens, and Git state are verified after writes and are reported in establishment, owner-freeze, and R1 reports, not claimed as WCAG evidence.

### 44.4 What this file is not

This appendix is not keyboard evidence, screen-reader evidence, contrast evidence, zoom evidence, legal approval, or implementation. Establishment evidence in §44 remains historical.

---

## 45. PW8-OD Owner Accessibility Decision Evidence

### 45.1 Owner authority

Authority type: `EXPLICIT ZYNTIXAI OWNER ACCESSIBILITY REQUIREMENTS DECISION`.

### 45.2 Date

`2026-09-16`

### 45.3 Baseline HEAD

`adcbd1707caa97a4b5511a56616210d7444a5663`

### 45.4 Scope

Public-homepage accessibility behaviour and component-state requirements. Source: explicit owner approval of the professional recommendation following PW-8 establishment.

### 45.5 Non-authority statement

```text
OWNER ACCESSIBILITY FREEZE ≠ IMPLEMENTATION PASS ≠ WCAG CONFORMANCE ≠ LEGAL APPROVAL ≠ PUBLICATION READY
OWNER DECISION RESOLVED ≠ IMPLEMENTATION OR EVIDENCE CONDITION UNRESOLVED
```

This freeze does not prove implementation, conformance, legal compliance, browser support, keyboard support, screen-reader support, zoom support, device support, visitor validation, or publication readiness.

### 45.6 Complete sixteen-decision table

See §39. Totals: 16 / 16 fully resolved / 0 partial / 0 open owner decisions.

### 45.7 Standards target

`PW8-OD-001`: `WCAG 2.2 LEVEL AA-ORIENTED PRODUCT REQUIREMENTS`. Mandatory wording: `WCAG 2.2 AA-ORIENTED REQUIREMENTS TARGET — NOT A CONFORMANCE CLAIM`.

### 45.8 Language model

`PW8-OD-002`: Language Model A, route-scoped Dutch. `OWNER FROZEN LANGUAGE MODEL — TECHNICAL ISOLATION REQUIRED`. Root layout is not modified.

### 45.9 Course Seller semantics

`PW8-OD-003`: normal titled section in `main`. `OWNER FROZEN SECTION SEMANTICS — VISUAL ASIDE DOES NOT MEAN HTML ASIDE`.

### 45.10 Skip-link decision

`PW8-OD-004`: public `main`; Dutch chrome `Ga naar de hoofdinhoud`. `OWNER FROZEN SKIP-LINK CONTRACT — AUTHENTICATED REGRESSION TEST REQUIRED`.

### 45.11 Anchor-focus decision

`PW8-OD-005`: Anchor Model B. `OWNER FROZEN IN-PAGE FOCUS MODEL — IMPLEMENTATION AND BROWSER VALIDATION REQUIRED`.

### 45.12 Disclosure decision

`PW8-OD-006`: non-modal inline expansion. `OWNER FROZEN NON-MODAL DISCLOSURE MODEL — COMPONENT IMPLEMENTATION LATER-GATED`. No hamburger selected.

### 45.13 Focus decision

`PW8-OD-007`: 2 CSS-pixel outline with 2 CSS-pixel offset. `OWNER FROZEN FOCUS STANDARD — NOT IMPLEMENTED OR TESTED`.

### 45.14 Target-size decision

`PW8-OD-008`: 24×24 CSS-pixel standards floor; 44×44 CSS-pixel product preference for primary header and navigation controls. `OWNER FROZEN TARGET-SIZE STANDARD — 44PX PRODUCT PREFERENCE, 24PX STANDARDS FLOOR`.

### 45.15 Link-recognition decision

`PW8-OD-009`: links recognizable without colour alone. `OWNER FROZEN LINK-RECOGNITION POLICY — VISUAL TOKENS LATER-GATED`.

### 45.16 Contrast decision

`PW8-OD-010`: WCAG 2.2 AA-oriented floors. `OWNER FROZEN CONTRAST REQUIREMENTS — PALETTE AND MEASUREMENT LATER-GATED`.

### 45.17 Motion decision

`PW8-OD-011`: subtle non-essential transitions only. `OWNER FROZEN RESTRAINED MOTION POLICY — NO MOTION REQUIRED`.

### 45.18 Icon decision

`PW8-OD-012`: text-first. `OWNER FROZEN TEXT-FIRST ICON POLICY — ICONOGRAPHY LATER-GATED`.

### 45.19 Announcement decision

`PW8-OD-013`: static-first. `OWNER FROZEN ANNOUNCEMENT POLICY — STATIC-FIRST`.

### 45.20 Zoom/reflow decision

`PW8-OD-014`: 200%, 320 CSS px, text resize/spacing mandatory planned; 400% additional planned. `OWNER FROZEN ZOOM/REFLOW VALIDATION SCOPE — NOT EXECUTED`.

### 45.21 Screen-reader decision

`PW8-OD-015`: planned NVDA+Chromium, NVDA+Firefox where feasible, VoiceOver+Safari where an Apple environment is available. `OWNER FROZEN SCREEN-READER TEST SCOPE — ENVIRONMENT-DEPENDENT EXECUTION`.

### 45.22 No-JavaScript decision

`PW8-OD-016`: core content and essential navigation remain usable without JavaScript. `OWNER FROZEN PROGRESSIVE-ENHANCEMENT POLICY — IMPLEMENTATION VALIDATION REQUIRED`.

### 45.23 `Today` annotation status

No seventeenth owner decision. `Today` remains the frozen English product name in Dutch copy. No element-level `lang="en"` is mandated during PW-8. Later screen-reader validation determines whether pronunciation is a material problem. Status: `OPEN VALIDATION DETAIL — DOES NOT REOPEN DUTCH-FIRST OR FROZEN COPY`. Downstream: PW-12; PW-13 if a change is later required without translating the visible name.

### 45.24 H2 wording status

Value/mechanism still need accessible section headings. Frozen nav labels `Over ZyntixAI` and `Hoe het werkt` are the leading candidates. Final visible H2 use remains a PW-9 assembly/content decision. In-page navigation may not activate until matching destinations and headings exist. Status: `OPEN ASSEMBLY DETAIL — PW-9 GATE`. This does not block the PW-8 owner freeze. PW-6 copy is not rewritten.

### 45.25 Question reconciliation

28 questions retained. Fully resolved by owner: 13. Partially resolved by owner: 6. Open validation: 2. Open optional later: 1. Open technical: 3. Open evidence tooling: 1. Open external legal: 1. Open assembly: 1. See §38.

### 45.26 Decision-count reconciliation

| Status | Count |
| --- | ---: |
| Total | 16 |
| Fully resolved | 16 |
| Partially resolved | 0 |
| Open owner decisions | 0 |

### 45.27 Remaining downstream gates

At freeze time remaining: PW-8-R1 consistency review; PW-9 H2 assembly; PW-10/11 visual tokens; PW-12 executed validation including `Today` pronunciation and the owner-frozen screen-reader matrix; PW-13 route-language isolation, skip-link, disclosure, no-JS, and authenticated regression; PW-14 legal interpretation and publication evidence. All validation remains `PLANNED — NOT EXECUTED`. All thresholds remain `PROPOSED — NOT ACHIEVED`.

### 45.28 Acceptance result

`PASS — PW8-OD OWNER ACCESSIBILITY DECISIONS FROZEN`

### 45.29 Scope confirmation

Authenticated Home remained closed. Frozen PW-6 copy unchanged. Frozen PW-7 layout unchanged. Root `lang="en"` unchanged. AppShell skip link unchanged. No public homepage implemented. No WCAG, keyboard, screen-reader, contrast, zoom, browser, or device PASS claimed. At freeze time: PW-8-R1 and PW-9 not started.

### 45.30 Git/file-integrity evidence

Verified after this freeze: only `docs/phases/PW-8-accessibility-behaviour-component-state-requirements.md` is untracked/changed; HEAD and upstream remain `adcbd1707caa97a4b5511a56616210d7444a5663`; nothing staged, committed, pushed, or deployed. Mechanical census, whitespace, and upstream-ID checks are reported in the owner-freeze report.

End of PW-8 owner accessibility freeze evidence.

---

## 46. PW-8-R1 Independent Accessibility Requirements Review Evidence

### 46.1 Review scope

Independent review of `docs/phases/PW-8-accessibility-behaviour-component-state-requirements.md` after PW8-OD freeze. Product code, AppShell, Home, PW-6 copy, and PW-7 layout were not modified. No keyboard, screen-reader, zoom, contrast, browser, or legal test was executed.

### 46.2 Independence statement

Prior PASS statements were treated as hypotheses. Owner-frozen selections were not replaced. Establishment and OD evidence remain historical.

```text
OWNER ACCESSIBILITY FREEZE ≠ IMPLEMENTATION PASS ≠ WCAG CONFORMANCE ≠ LEGAL APPROVAL ≠ PUBLICATION READY
```

### 46.3 Authority review

B1-GATE.1 and PW-0 through PW-7 remain binding. PW-1 is the public-truth ceiling. PW-6 is copy authority. PW-7 is responsive-layout authority. PW-8 does not create claims, CTAs, compliance, or Production observations.

### 46.4 Protected-boundary review

Authenticated Home closure `49cd5773976143139a154f9b8ddf36535a4dd914` and product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` remain closed. Root `lang="en"` is unchanged. AppShell skip link is unchanged. Unauthenticated `/` still redirects to `/login`.

### 46.5 Owner-decision integrity

`PW8-OD-001`–`016` are present and `RESOLVED — OWNER FROZEN`. No silent remapping. Totals: 16 / 16 / 0 / 0.

### 46.6 Standards and claim review

WCAG 2.2 AA-oriented remains a requirements target, not compliance. 24×24 is the 2.5.8-oriented floor; 44×44 is a product preference. Contrast floors are unmeasured. Focus, zoom, screen-reader, and no-JS remain unexecuted requirements.

### 46.7 Language and semantics review

Language Model A remains desired, not implemented. `Today` stays the frozen English product name. Element-level `lang="en"` is not mandated. Final value/mechanism H2 wording remains PW-9.

### 46.8 Landmark and heading review

One H1; Course Seller is a `section` in `main`; DOM order is the meaning order; PW-7 asymmetry is visual, not a complementary landmark.

### 46.9 Skip-link review

Dutch `Ga naar de hoofdinhoud` to public `main`. No AppShell edit. Authenticated regression remains required.

### 46.10 Anchor/focus review

Anchor Model B remains. Destinations must exist before links. History back/forward is now an explicit planned check (`PW8-VAL-049`).

### 46.11 Mobile-disclosure review

Non-modal inline remains. Escape is required for enhanced disclosure, not as a polyfill mandate on native `details` (`PW8-R1-FND-003`).

### 46.12 Keyboard/focus/pointer review

2px outline + 2px offset remains untested. Target-size overclaim is an explicit future risk (`PW8-RSK-050`).

### 46.13 Component/state review

21 components retained. States extended to 45 by marking disabled disclosure and homepage loading as not applicable, not by inventing form flows.

### 46.14 Form/error-boundary review

No public form. Honest stop is not an error. ERROR-001–015 remain later technical/fallback states.

### 46.15 Frozen-copy review

Quoted Route A2 navigation, H1, hero support, Layer B, Today, Course Seller, trust heading, and full access block (`PW6-ACCESS-008`/`009` and the honest stop). No owner-frozen visible sentence was rewritten.

### 46.16 Responsive/zoom/reflow review

Aligned with PW-7. 200%, 320 CSS px, text resize, and text spacing remain separately planned. 400% remains additional. Orientation added as `PW8-ZOOM-011` / `PW8-VAL-048`. Not executed.

### 46.17 Screen-reader, forced-colours, and motion review

Planned NVDA/Chromium, NVDA/Firefox where feasible, VoiceOver/Safari where available. `PW8-SR-017` records `Today` pronunciation as a planned scenario. Motion remains non-essential. No execution claimed.

### 46.18 No-JavaScript review

Core content and essential navigation remain required without script. Sign in remains a real link. Visual parity is not required.

### 46.19 Trust/legal-boundary review

Named controls only. No WCAG, AVG/GDPR, certification, or universal AT claim. Legal interpretation remains `PW8-Q-027`.

### 46.20 Traceability audit

Cited PW-0–PW-7 identifiers were re-checked after correction. Invalid CS citation of `PW6-OD-007` was replaced with `PW6-OD-008`. Missing access identifiers were added.

### 46.21 Register census

Updated in §44.1. R1 additions: PRIN-013; STATE-044–045; ZOOM-011; SR-017; RSK-049–053; VAL-046–050; R1-FND-001–012. Existing IDs were not renumbered.

### 46.22 Risk and validation review

Future risks remain non-defect severity. All validation rows remain `PLANNED — NOT EXECUTED`.

### 46.23 Findings register

| ID | Severity | Subject | Evidence | Impact | Correction or later gate | Status | Downstream |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW8-R1-FND-001 | P1 | Frozen-inputs table omitted access status and existing-account lines | §8.1 vs `PW6-ACCESS-008`/`009` | Incomplete copy contract for access | Quoted the frozen access sentences | `CORRECTED` | n/a |
| PW8-R1-FND-002 | P1 | `PW6-OD-007` cited as Course Seller authority | §8.1; `PW6-OD-007` is Today proof | Invalid use | Replaced with `PW6-OD-008` | `CORRECTED` | n/a |
| PW8-R1-FND-003 | P1 | Escape required for every disclosure, including native `details` | `PW8-NAV-006`; `PW8-KEY-007` vs `PW8-OD-006` | Over-requirement vs owner freeze | Aligned Escape to enhanced disclosure only | `CORRECTED` | PW-13 |
| PW8-R1-FND-004 | P1 | `title`/tooltip could be the only explanation | Missing principle | Hover-only meaning | Added `PW8-PRIN-013` | `CORRECTED` | PW-11 |
| PW8-R1-FND-005 | P1 | No planned SR check for `Today` pronunciation | `PW8-Q-003` had no VAL | Open validation without route | Added `PW8-SR-017`; `PW8-VAL-046` | `CORRECTED` | PW-12 |
| PW8-R1-FND-006 | P1 | Dutch `Inloggen` to English `/login` not in risk/validation | Current architecture truth | Language-switch surprise | Added `PW8-RSK-049`; `PW8-VAL-047` | `CORRECTED` | PW-12 / PW-13 |
| PW8-R1-FND-007 | P1 | Disabled/loading states not marked not-applicable | Component/state review | Risk of invented form/loading flows | Added `PW8-STATE-044`; `PW8-STATE-045` | `CORRECTED` | n/a |
| PW8-R1-FND-008 | P1 | Orientation not in zoom/reflow contract | R1 §14 vs `PW8-ZOOM-*` | Possible lost content on rotate | Added `PW8-ZOOM-011`; `PW8-VAL-048`; `PW8-RSK-053` | `CORRECTED` | PW-12 |
| PW8-R1-FND-009 | P1 | Q-009 options said `24px AA` | Could be read as 44px dispute or overclaim | Terminology | Clarified 2.5.8 floor vs product preference | `CORRECTED` | n/a |
| PW8-R1-FND-010 | P1 | Remaining Escape overstatements after NAV/KEY alignment | `PW8-COMP-006`; `PW8-ACC-005`; `PW8-VAL-009` | Could still require Escape on native `details` | Aligned those rows to enhanced-disclosure Escape | `CORRECTED` | PW-13 |
| PW8-R1-FND-011 | P1 | Freeze-time “R1 not started” language read as current | §41; §42 freeze checklist; §45.29 | False current-state claim after this review | Labeled freeze-time; §46 records R1; PW-9 still not started | `CORRECTED` | n/a |
| PW8-R1-FND-012 | P1 | Traceability unique-count for PW-6 stale after R1 citations | §40 said 24; mechanical unique count 28 | Census error | Updated unique PW-6 references to 28 | `CORRECTED` | n/a |

Open P0: 0. Open P1: 0. Remaining P2 later gates: H2 assembly (`PW8-Q-028`); `Today` annotation execution (`PW8-Q-003`); route-language isolation (`PW8-Q-002`); exact disclosure component (`PW8-Q-007`); visual tokens (`PW8-Q-008`/`010`/`012`); Apple SR environment (`PW8-Q-023`); legal interpretation (`PW8-Q-027`); shared CSS isolation (`PW8-Q-025`); not-found ownership (`PW8-Q-021`); executed validation.

### 46.24 Corrections performed

Quoted omitted access copy; corrected CS citation; aligned Escape with OD-006 including COMP-006, ACC-005, and VAL-009; added title-attribute principle; marked N/A states; added orientation, pronunciation, language-switch, history, forced-colour-focus, modal-semantics, and target-overclaim routes; labeled freeze-time R1 language as historical; corrected PW-6 unique-reference census; updated census; added this section. Owner decisions were not replaced.

### 46.25 Remaining downstream gates

PW-8-FV commit/push; PW-9 H2 assembly; PW-10/11 tokens; PW-12 executed validation; PW-13 isolation and authenticated regression; PW-14 legal and publication evidence.

### 46.26 File-integrity verification

Mechanical checks after this R1: CRLF only; no trailing whitespace; one ending newline; 42 balanced fences; no deferred-task or conflict markers; unique headings; census continuous; PW-0–PW-7 cited IDs all exist (unique counts 14/5/5/9/19/18/28/39); `git diff --check` clean; untracked `git diff --no-index --check` vs NUL exits 1 for content difference with no whitespace warning. Not claimed as WCAG evidence.

### 46.27 Gate result

`PASS — PW-8-R1 INDEPENDENT ACCESSIBILITY REQUIREMENTS REVIEW CLOSED WITH EVIDENCE`

### 46.28 Resulting PW-8 status

`PW-8 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT`

End of PW-8-R1 independent review evidence.
