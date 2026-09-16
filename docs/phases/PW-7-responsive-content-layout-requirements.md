# PW-7 — Responsive Content & Layout Requirements

| Field | Value |
| --- | --- |
| Document | PW-7 — Responsive Content & Layout Requirements |
| Type | Responsive content and layout-requirements authority (not visual design freeze, not implementation, not publication, not accessibility PASS) |
| Date | 2026-09-16 |
| Branch | `core/platform-readiness-20260707` |
| HEAD at drafting | `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5` |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Binding closures | PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; PW-3 `9c12c977383a100eb548880d8d35b329b4406f90`; PW-4 `c6f4489bc5cbf9306b4784320cc747975209caeb`; PW-5 `fcb4eab3fbfe7cefd0013828d9b9819cb452cb87`; PW-6 `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5` |
| Authenticated Home | Closure `49cd5773976143139a154f9b8ddf36535a4dd914`; Production product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Copy input | Owner-frozen Route A2 (`PW6-OD-002`) |
| Establishment status (historical) | `PW-7 RESPONSIVE REQUIREMENTS ESTABLISHED — AWAITING OWNER DECISIONS` — see §2 and §39 as first-establishment record |
| Owner layout freeze | §41 — `PW7-OD Owner Responsive Layout Decision Evidence` |
| Independent review | §42 — `PW-7-R1 Independent Responsive Requirements Review Evidence` |
| Current status | `PW-7 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` |
| Establishment gate (historical) | `CONDITIONAL — PW-7 OWNER RESPONSIVE-LAYOUT DECISIONS REQUIRED` |
| Owner-freeze gate (historical) | `PASS — PW7-OD OWNER RESPONSIVE LAYOUT DECISIONS FROZEN` |

```text
PW-7 LAYOUT AUTHORITY ≠ VISUAL DESIGN FREEZE ≠ IMPLEMENTATION AUTHORITY ≠ PUBLICATION AUTHORITY
OWNER RESPONSIVE FREEZE ≠ VISUAL DESIGN FREEZE ≠ IMPLEMENTATION READY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY
RESPONSIVE REQUIREMENT ≠ IMPLEMENTED LAYOUT ≠ BROWSER-TESTED LAYOUT ≠ PUBLICATION-READY PAGE
```

No layout unit is `PUBLICATION READY`, `IMPLEMENTATION READY`, `ACCESSIBILITY PASSED`, `RESPONSIVE IMPLEMENTATION PASSED`, `VISITOR VALIDATED`, or `CLOSED WITH EVIDENCE`. Fourteen `PW7-OD-*` records are `RESOLVED — OWNER FROZEN`. Selected layout remains requirements authority, not live behaviour.

---

## 1. Document Control

This file is the sole PW-7 deliverable. It translates closed PW-0 through PW-6 authorities into a professional responsive-page specification for the future public homepage. It does not implement routes, CSS, components, assets, metadata, or authenticated Home.

| Control | Rule |
| --- | --- |
| Product code | Unchanged |
| Authenticated Home | Closed; not restyled; not used as a public visual system |
| Dual-use `/` | Current truth unchanged; Root Model A remains desired IA only |
| `/login`, `/register`, invite, recovery | Read-only; not mutated |
| Shared CSS / root metadata / AppShell | Protected; public layout must not borrow them as the visual system |
| Frozen Route A2 copy | Quoted, not rewritten |
| Wireframes / mockups / screenshots | Out of scope |
| Staging / commit / push / deploy | Not authorized |
| PW-7-R1 | This review; evidence in §42 |
| PW-8 | Not started |

---

## 2. Executive Decision

PW-7 first established layout and responsive-content requirements for the owner-frozen Route A2 homepage. That establishment remains historical evidence. **PW7-OD** is the owner freeze of those layout decisions.

Authority: `EXPLICIT ZYNTIXAI OWNER RESPONSIVE LAYOUT DECISION` (2026-09-16). Baseline HEAD `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`. Scope: responsive content and layout requirements for the future public homepage. This is layout-direction authority, not visitor research, browser evidence, visual-token freeze, CSS implementation, public-root implementation, accessibility PASS, publication, or deployment.

```text
OWNER RESPONSIVE FREEZE ≠ VISUAL DESIGN FREEZE ≠ IMPLEMENTATION READY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY
```

Owner-frozen selections (`PW7-OD-001`–`014`, all `RESOLVED — OWNER FROZEN`):

- Model: `PW7-MODEL-002` with mandatory fallback to `PW7-MODEL-001` when no approved supporting field exists.
- Hero: `PW7-HERO-001` complete default; `PW7-HERO-002` later-gated; `PW7-HERO-003` blocked.
- Navigation: `PW7-NAV-001` while content fits, then `PW7-NAV-002`; `Inloggen` outside disclosure where feasible.
- Header: static for the initial public foundation.
- Maturity: `PW7-BETA-003`.
- Value/mechanism: `PW7-VALUE-001`.
- Today proof: `PW7-PROOF-001`; screenshot HOLD.
- Course Seller: `PW7-CS-002`.
- Trust: `PW7-TRUST-001`.
- Access: `PW7-ACCESS-001`.
- Sign in: header and access only by default.
- Density: eight-cluster budget.
- Visual: text-first; no required image.
- Thresholds: content-driven reflow; exact CSS not implemented.

Present defect findings: P0 none; P1 none. High-severity future risks remain open with named preventive gates. They are not deferred current P1 defects.

Historical establishment record retained:

```text
PW-7 RESPONSIVE REQUIREMENTS ESTABLISHED — AWAITING OWNER DECISIONS
```

```text
CONDITIONAL — PW-7 OWNER RESPONSIVE-LAYOUT DECISIONS REQUIRED
```

Owner-freeze status (historical):

```text
PW-7 READY FOR INDEPENDENT RESPONSIVE REQUIREMENTS REVIEW
```

Current status after independent review:

```text
PW-7 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

---

## 3. Purpose

Give later accessibility, wireframe, visual-design, fidelity, and implementation phases a content-driven responsive specification that:

- preserves PW-1 truth and PW-6 frozen copy;
- keeps a small-business owner oriented without dashboard theatre;
- defines desktop, tablet, and mobile behaviour without implementing it;
- records owner-frozen layout decisions and independent R1 confirmation before final verification.

---

## 4. Non-Goals

- Visual-token freeze (colour, typeface, shadow, radius).
- Component implementation, CSS, routes, or public-root mutation.
- Screenshot production or fake dashboards.
- Accessibility implementation PASS or WCAG certification.
- Visitor research, browser testing, device testing, or keyboard testing.
- Metadata publication, indexation, analytics, or legal-page invention.
- Rewriting Route A2 copy to force a layout.
- Starting PW-8.

---

## 5. Governing Authorities

| Authority | Role | Closure SHA |
| --- | --- | --- |
| B1-GATE.1 | Evidence standard | repository governance |
| PW-0 | Public-web charter and protected boundaries | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| PW-1 | Public-truth ceiling | `e694b85ead8a4b75054a078624aadfd315cea39d` |
| PW-2 | Visitors, journeys, honest stops | `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| PW-3 | Positioning, messaging, voice | `9c12c977383a100eb548880d8d35b329b4406f90` |
| PW-4 | Public information architecture | `c6f4489bc5cbf9306b4784320cc747975209caeb` |
| PW-5 | Homepage content model | `fcb4eab3fbfe7cefd0013828d9b9819cb452cb87` |
| PW-6 | Owner-frozen Route A2 copy | `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5` |
| Authenticated Home | Closed product surface | `49cd5773976143139a154f9b8ddf36535a4dd914` |
| Home Production product-code | Today/Home evidence bound | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |

Authority order: PW-0 scope → PW-1 truth → PW-2 visitors → PW-3 messaging → PW-4 IA → PW-5 content model → PW-6 copy → PW-7 layout requirements only.

---

## 6. Evidence Model

| Class | Meaning in PW-7 |
| --- | --- |
| `CURRENT TRUTH` | Observed in current product source |
| `DESIRED RESPONSIVE BEHAVIOUR` | Layout requirement for the future public homepage |
| `PROPOSED` | Numerical constraint, validation viewport, or historical establishment recommendation; not an open owner choice; not implemented CSS |
| `LATER IMPLEMENTATION REQUIREMENT` | Hand-off to PW-13 or later, not authorized now |
| `EXTERNALLY GATED` | Legal or destination authority outside PW-7 |
| `HOLD` | Blocked until named upstream authority exists |
| `OWNER FROZEN` | Layout direction frozen by PW7-OD; not implementation |
| `OWNER RESPONSIVE DECISION RESOLVED` | Owner layout choice closed |
| `TECHNICAL OR VALIDATION CONDITION UNRESOLVED` | Downstream gate still open |
| `PLANNED — NOT EXECUTED` | Validation not run |
| `PROPOSED — NOT ACHIEVED` | Threshold not claimed |

```text
PROPOSED RESPONSIVE THRESHOLD — NOT IMPLEMENTED
PROPOSED LAYOUT BUDGET — NOT VALIDATED
```

Numerical shell values in this file are proposed content constraints, not implementation-ready CSS tokens.

---

## 7. Current Architecture Truth

Inspected read-only. Authenticated styling is not the required public visual system.

| Surface | Observed truth | Public-homepage implication |
| --- | --- | --- |
| `src/app/page.tsx` | Unauthenticated `/` redirects to `/login`; authenticated `/` uses membership/onboarding-aware entry | No public marketing homepage exists. Root Model A (`PW4-OD-001`) remains desired IA, not implemented route truth |
| `src/middleware.ts` | Session update via `updateSession`; broad matcher | Shared P1 boundary. PW-7 may not edit it |
| `src/app/layout.tsx` | `lang="en"`; title `ZyntixAI`; description `ZyntixAI application foundation`; imports `globals.css` | Root metadata and global CSS are shared. Public homepage must not treat them as its visual system |
| `src/app/globals.css` | Application tokens, system font stack, `#f8fafc` body, focus rings | Application chrome, not a public marketing language. Isolated public CSS is later preferred (`PW0-RQ-005`) |
| `src/app/login/page.tsx` | English H1 `Sign in`; fail-closed public registration | `/login` remains the live utility destination. Dutch `Inloggen` is homepage label only |
| `src/app/login/page.module.css` | Centered login canvas; 768 px padding shift | Login composition is not the public homepage shell |
| Authenticated Home | `/home` Daily Operating; AppShell; Today brief | Closed. Must not be restyled or visually recreated as a public demo |
| Public route group | No `src/app/(marketing)` or `(public)` | Greenfield public surface later; isolation preferred over replacing `/` |
| Canonical host | Apex→www observed historically, not in repo config (`PW0-PB-034`) | Outside PW-7 |

Current truth remains:

- unauthenticated `/` redirects to `/login`;
- authenticated `/` uses membership/onboarding-aware entry;
- `/home` remains protected;
- no public marketing homepage currently exists.

Desired conditional public root from PW-4 remains design intent.

---

## 8. Frozen Homepage Inputs

Copy is quoted from PW-6 Route A2. PW-7 does not rewrite it.

### 8.1 Selected navigation (`PW6-OD-003`)

`Over ZyntixAI` · `Hoe het werkt` · `Gesloten bèta` · `Inloggen`

The first three are desired in-page roles and are not implemented destinations (`CANDIDATE DESTINATION — NOT IMPLEMENTED`). `Inloggen` is an existing-account utility to `/login`.

### 8.2 Selected hero (`PW6-OD-004`)

H1 (`PW6-HERO-006`):

`Houd zicht op klanten, werk en voortgang.`

Support (`PW6-COPY-044`):

`ZyntixAI helpt je als eigenaar van een klein bedrijf het dagelijkse werk te organiseren: klanten, verantwoordelijkheden, voortgang en wat aandacht nodig heeft.`

### 8.3 Early maturity (`PW6-OD-006`)

`ZyntixAI is nu in gesloten bèta.`

`Inloggen is voor bestaande accounts.`

### 8.4 BOS (`PW6-OD-005`)

Omitted from the frozen Route A2 working deck.

### 8.5 Value and mechanism (`PW6-OD-002`)

Value (`PW6-COPY-046`):

`ZyntixAI is bedoeld om klanten, werk, verantwoordelijkheden en voortgang bij het werk te houden. Het vervangt niet al je andere tools.`

Mechanism (`PW6-COPY-047`):

`Relevante informatie over klanten, werk en verantwoordelijkheden blijft bij het werk waar het bij hoort. Toegelaten gebruikers kunnen daarna op Today een beperkt dagelijks startpunt zien.`

### 8.6 Today proof (`PW6-OD-007`)

Heading: `Today als voorbeeld in het product`

Today is a bounded authenticated product example; not a public demo; not the entire product; not AI-ranked. Bound to SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828`.

### 8.7 Course Seller relevance (`PW6-OD-008`)

Heading: `Als je opleidingen of coaching geeft`

Qualifier: `Dit is geen leeromgeving en geen open catalogus.`

Secondary relevance after general value and Today proof.

### 8.8 AI (`PW6-OD-009`)

`ZyntixAI is geen chatbot. Het is een product om dagelijks werk te organiseren.`

Status: `OWNER FROZEN CONDITIONAL COPY — INACTIVE BY DEFAULT`. No visible AI block by default.

### 8.9 Trust (`PW6-OD-010`)

Named controls only. Visible: signed-in use; organization context; non-applicable content outside the active view; Today data within account and organization context. `PW6-TRUST-009` remains governance-only.

### 8.10 Access (`PW6-OD-011`)

Heading: `Toegang`

`ZyntixAI is in gesloten bèta. Via deze site kun je geen nieuw account aanmaken.`

`Heb je al een account? Inloggen.`

`Heb je geen account, dan is deze pagina bedoeld om ZyntixAI te leren kennen.`

### 8.11 Metadata (`PW6-OD-012`)

Candidate-only. Outside PW-7 implementation scope.

### 8.12 Functional content order (not a wireframe)

From `PW5-BLK-*` and `PW6-A2-*`: header → identity/H1/support → early Layer B → value → mechanism → Today proof → Course Seller relevance → named-control trust → later access/honest stop → footer.

Eleven required content roles must not become eleven large visual sections (`PW5-COMP-*`). Combining later must never hide closed beta, detach a qualifier, widen Today, let Course Seller replace general proof, turn trust into a badge, move access to footer-only, or turn Sign in into conversion.

If a genuine content defect cannot be solved by layout without rewriting frozen copy, it is recorded as a blocker. None was found at P0 or P1. `PW6-RSK-032` remains an open PW-6 P2 risk for mobile qualifier loss, with a named preventive gate in PW-7 (`PW7-PRI-004`, `PW7-REDUCE-005`, `PW7-VAL-022`). It is not a deferred current PW-7 P1 defect.

---

## 9. Responsive Design Principles

| Principle | Requirement |
| --- | --- |
| Truth before decoration | Material qualifiers survive every viewport |
| Text-led completeness | The page must feel complete with no optional visual |
| Calm premium | Spacious without empty reserved panels |
| Product-aware, not product-demo | Name Today without recreating `/home` |
| One story | Editorial spine, not disconnected cards |
| Operator-first | Small-business owner remains the brand-primary visitor (`PW2-VIS-001`) |
| Utility, not acquisition | `Inloggen` must not become Start/Join |
| Honest stop | Reading is a valid journey outcome |
| Isolation | Public layout must not restyle AppShell, Home, or shared CSS |
| Copy freeze | Layout yields to frozen copy; copy is not shortened to fit a budget |

Feel: calm, modern, premium, credible, precise, professional without enterprise-heaviness, confident without hype.

Must not feel like: generic AI landing, chatbot homepage, task-manager template, all-in-one SaaS claim, enterprise card wall, four-edition catalogue, signup or waitlist funnel, fake product demo, or an unbounded dump.

---

## 10. Responsive Models

| ID | Model | Characteristics | Premium fit | SaaS credibility | Content clarity | Mobile continuity | Primary risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-MODEL-001 | Text-led editorial spine | Strong central reading flow; restrained width; large controlled whitespace; limited multi-column | High if type and rhythm are later well designed | Medium-high: credible, may look like a document | Highest | Highest | Document-like rather than a product website |
| PW7-MODEL-002 | Asymmetric product narrative | Text-led hero with optional restrained supporting field; selected two-column supporting sections; no screenshot requirement; alternation of explanation, proof, relevance, trust, access | High | High if supporting field is not an empty panel | High | High if supporting field stacks or omits | Empty decorative space; fake product proof if a panel is reserved |
| PW7-MODEL-003 | SaaS card-grid composition | Cards or tiles for propositions and proof | Low-medium for this evidence | Low: generic template | Weaker qualifiers | Dense; cards wrap into a catalogue | Completeness; four-TG equality; dashboard implication |

Model C is rejected as the working model. It exceeds current evidence (`PW1-PRH-003`; `PW5-OD-002` omitted TGs; `PW6-BAN` completeness bans). `PW7-MODEL-003` remains rejected after owner freeze.

---

## 11. Selected Working Model

Establishment recommended `PW7-MODEL-002` as `PROPOSED RESPONSIVE MODEL — OWNER DECISION REQUIRED`. That recommendation is historical.

**Owner-frozen model (`PW7-OD-001`):** `PW7-MODEL-002 — ASYMMETRIC PRODUCT NARRATIVE`.

```text
OWNER FROZEN RESPONSIVE MODEL — DOWNSTREAM VISUAL AND IMPLEMENTATION REVIEW REQUIRED
```

Binding conditions: text remains the primary carrier of meaning; asymmetric composition may create a modern product feel; no visual is required to complete the page; the layout must degrade cleanly to `PW7-MODEL-001 — TEXT-LED EDITORIAL SPINE` whenever no approved supporting field exists; no empty right-side panel may be reserved; no fake screenshot may fill the asymmetric space; no unsupported feature-card grid; no four-target-group grid.

Working rules now frozen:

- Hero remains text-primary (`PW7-HERO-001` complete default). Supporting field is optional later visual content, never a screenshot placeholder, and must disappear when empty.
- Value and mechanism stay editorial. At most one restrained two-column pair on wide viewports, stacking in source order below the content-fit threshold.
- Today, Course Seller, trust, and access remain single-column reading blocks.
- No product-feature cards. No four-target-group cards.

Conservative implementation fallback remains `PW7-MODEL-001` when no approved supporting field exists.

---

## 12. Page-Shell Requirements

Functional token roles, not final design tokens.

| ID | Role | Proposed constraint | Rationale | Class |
| --- | --- | --- | --- | --- |
| PW7-SHELL-001 | Page background | Quiet full-bleed surface; no dashboard chrome | Distinguishes public page from AppShell | `PROPOSED` |
| PW7-SHELL-002 | Content canvas | Centered column inside gutters | Desktop centring; mobile full usable width minus gutters | `PROPOSED` |
| PW7-SHELL-003 | `page-max` | About 72rem for full sections | Prevents 1920 px stretch of a marketing wall | `PROPOSED` content constraint, not CSS |
| PW7-SHELL-004 | `reading-max` | About 40rem / 60–72 characters | Preserves support and qualifier readability | `PROPOSED` |
| PW7-SHELL-005 | `section-gap` | Larger than `content-gap`; one calm rhythm | Avoids eleven stacked banners | `PROPOSED LAYOUT BUDGET — NOT VALIDATED` |
| PW7-SHELL-006 | `content-gap` | Heading-to-body tighter than section-gap | Keeps H1 and support related | `PROPOSED` |
| PW7-SHELL-007 | `mobile-gutter` | About 1rem at 320 px; not less than 0.75rem | Overflow prevention; thumb margin | `PROPOSED` |
| PW7-SHELL-008 | `desktop-gutter` | About 2rem inside `page-max` | Spacious without empty sides as a feature | `PROPOSED` |
| PW7-SHELL-009 | Tablet gutters | Between mobile and desktop; no third composition language | Avoids a unique tablet product | `PROPOSED` |
| PW7-SHELL-010 | Full-width vs contained | Header/footer may span `page-max`; reading blocks use `reading-max` | Maturity and access stay readable | `PROPOSED` |
| PW7-SHELL-011 | Overflow, zoom, long words | No horizontal scroll for normal content at 320 px; 200% zoom reflows; Dutch compounds wrap or break safely | `verantwoordelijkheden`, `inschrijvingen` | `DESIRED RESPONSIVE BEHAVIOUR` |
| PW7-SHELL-012 | Alignment and safe-area | Start-aligned text; honour device safe-area insets; no justified text | Predictable reading; no clipped copy | `DESIRED RESPONSIVE BEHAVIOUR` |

Header may be full-canvas width. Hero, value, mechanism, proof, CS, trust, and access remain contained. Do not select colours, fonts, shadows, or radii here.

---

## 13. Viewport and Reflow Matrix

Widths are validation viewports, not proof of testing. Do not bind to `sm` / `md` / `lg`.

```text
PROPOSED RESPONSIVE THRESHOLD — NOT IMPLEMENTED
```

Establishment thresholds above remain proposed numerical ranges, not implementation-ready tokens.

**Owner-frozen responsive policy (`PW7-OD-014`):** `CONTENT-DRIVEN REFLOW THRESHOLDS`.

```text
OWNER FROZEN RESPONSIVE POLICY — EXACT CSS THRESHOLDS NOT YET IMPLEMENTED
```

Do not define responsive behaviour primarily by device names. Do not freeze framework labels such as `sm`, `md`, or `lg`. Navigation changes when the selected identity and labels no longer fit. Likely navigation disclosure range around 640–768 px remains proposed, not fixed implementation truth. Optional two-column composition may begin only when content fits comfortably, likely above approximately 1024 px. Narrow layouts use one meaningful reading column. 320 px remains a required validation width. 200% browser zoom remains a required reflow state. Long Dutch words and expanded text remain required validation conditions. Implementation breakpoints must later be derived from real rendered content.

Proposed content-driven thresholds (not device names):

- Navigation disclosure when the four labels plus identity no longer fit on one line without wrapping into two header rows or colliding with `Inloggen`. Likely near 640–768 px, to be measured from type, not assumed from a framework.
- Optional two-column supporting sections only above about 1024 px.
- Typography scale may reduce below about 768 px without dropping material meaning.

| ID | Viewport | Role | Nav mode | Columns | Type/spacing | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| PW7-VIEW-001 | 320 px | Validation / hard reflow | Disclosure; Inloggen independently visible; identity may wrap | 1 | Compact; wrap H1 2–3 lines | No horizontal scroll; not NAV-003 |
| PW7-VIEW-002 | 360 px | Validation alias (common small phone) | Same as 320 | 1 | Same | Qualifiers remain; not a device-name breakpoint |
| PW7-VIEW-003 | 390 px | Validation alias (common large phone) | Same | 1 | Same | Layer B still in first viewport if reasonably possible |
| PW7-VIEW-004 | 430 px | Validation / large-phone width | Same | 1 | Same | Support remains near H1 |
| PW7-VIEW-005 | 768 px | Tablet portrait / nav change candidate | Fit-or-disclose | 1 | Reading measure may widen | Not a card grid |
| PW7-VIEW-006 | 1024 px | Layout-column candidate | Likely inline nav | 1, optional 2 in one supporting pair | Desktop rhythm begins | No screenshot required |
| PW7-VIEW-007 | 1280 px | Representative desktop | Inline | 1–2 as allowed | Full `reading-max` | Primary composition |
| PW7-VIEW-008 | 1440 px | Wide desktop | Inline | Same | Do not stretch measure | Extra space is margin, not a third column of cards |
| PW7-VIEW-009 | 1920 px | Very wide | Inline | Same | Canvas capped by `page-max` | Prevent marketing-wall stretch |
| PW7-VIEW-010 | 200% zoom at ~1280 CSS px | Accessibility reflow | May disclose | 1 | Text reflows; focus visible | Not a separate product |

---

## 14. Content Priority System

Layout-priority classes are not defect severities:

| Class | Meaning |
| --- | --- |
| `LAYOUT-P0` | Must remain visible and complete |
| `LAYOUT-P1` | Must remain visible; may reformat |
| `LAYOUT-P2` | May shorten only via an upstream-approved copy variant |
| `LAYOUT-P3` | Conditional or omittable under existing authority |

Material truth must never become tooltip-only, hover-only, visually hidden when relevant, desktop-only, accordion-only by default, colour-only, or icon-only.

| ID | Block | Purpose | Desktop | Tablet | Mobile | Move | Stack | Collapse | Omit | Shorten | Required qualifier | Prohibited loss | Upstream |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-PRI-001 | BLK-001 identity | Product name | LAYOUT-P0 | LAYOUT-P0 | LAYOUT-P0 | no | no | no | no | no | Visible name | Identity | PW6-A2-001; PW1-CLM-001 |
| PW7-PRI-002 | BLK-002 hero | Operational recognition | LAYOUT-P0 | LAYOUT-P0 | LAYOUT-P0 | no | support under H1 | no | no | LAYOUT-P2 support only per PW6-RESP-002 | Objects remain; not a guarantee | H1 or nearby support | PW6-HERO-006; PW6-COPY-044; PW6-RSK-031 |
| PW7-PRI-003 | BLK-004 Layer B | Closed beta + existing-account | LAYOUT-P0 | LAYOUT-P0 | LAYOUT-P0 | no later than after hero | yes | no | no | no | Both Layer B sentences | Maturity; Sign in ≠ join | PW6-BETA-007; PW4-OD-006 |
| PW7-PRI-004 | BLK-003 value | Daily-work objects + anti-replacement | LAYOUT-P0 | LAYOUT-P0 | LAYOUT-P0 | after Layer B | yes | no | no | LAYOUT-P2 objects to three plus aandacht; anti-replacement stays | `Het vervangt niet al je andere tools.` | All-in-one | PW6-COPY-046; PW6-RSK-032 |
| PW7-PRI-005 | BLK-005 mechanism | How work stays together | LAYOUT-P1 | LAYOUT-P1 | LAYOUT-P1 | after value | yes | no | no | LAYOUT-P2 Today mention may shorten | Not autonomous | Feature dump / OS | PW6-COPY-047 |
| PW7-PRI-006 | BLK-006 Today | Bounded proof | LAYOUT-P0 | LAYOUT-P0 | LAYOUT-P0 | after mechanism | yes | no | no | LAYOUT-P2 body; qualifier stays | Not public demo; not whole product | Public tour | PW6-PROOF-005–007 |
| PW7-PRI-007 | BLK-007 CS | Secondary relevance | LAYOUT-P0 if present | LAYOUT-P0 | LAYOUT-P0 | after Today | yes | no | no (V1 required) | LAYOUT-P2 heading length | Non-LMS qualifier | LMS / brand capture | PW6-CS-009–011 |
| PW7-PRI-008 | BLK-009 AI | Conditional clarification | LAYOUT-P3 | LAYOUT-P3 | LAYOUT-P3 | adjacent to trigger | n/a | n/a | yes by default | if active, second sentence | Inactive by default | Accidental activation | PW6-AI-002 |
| PW7-PRI-009 | BLK-010 trust | Named controls | LAYOUT-P0 | LAYOUT-P0 | LAYOUT-P0 | after CS | yes | no | no | LAYOUT-P2 explanations | Account/org context meaning | Certification | PW6-TRUST-007/008; PW6-RSK-033 |
| PW7-PRI-010 | BLK-011 access | No-new-account + honest stop | LAYOUT-P0 | LAYOUT-P0 | LAYOUT-P0 | after trust | yes | no | no | ACCESS-009 qualifier may shorten only if header already qualified existing-account nearby (`PW6-RESP-010`); the access `Inloggen` control remains (`PW7-OD-011`) | No-new-account; read-is-enough | Waitlist / error | PW6-ACCESS-007–010 |
| PW7-PRI-011 | BLK-012 Sign in | Existing-account utility | LAYOUT-P0 | LAYOUT-P0 | LAYOUT-P0 | header required; access repeat | no | no | header never | qualifier if already nearby | Existing accounts | Acquisition CTA | PW6-OD-003/011 |
| PW7-PRI-012 | BLK-013 footer | Identity repeat | LAYOUT-P1 | LAYOUT-P1 | LAYOUT-P1 | end | yes | n/a | legal slots yes | maturity repeat optional | Footer ≠ unique access | Unique stop in footer | PW6-A2-015 |
| PW7-PRI-013 | BOS | Omitted | LAYOUT-P3 | LAYOUT-P3 | LAYOUT-P3 | n/a | n/a | n/a | yes | n/a | n/a | Do not invent BOS | PW6-OD-005 |

---

## 15. Header and Navigation

| ID | Model | Behaviour | Trade-off |
| --- | --- | --- | --- |
| PW7-NAV-001 | Always visible until content no longer fits | Identity + four labels inline | Best orientation; overflows on small widths |
| PW7-NAV-002 | Compact mobile disclosure | In-page labels in a named disclosure; `Inloggen` remains outside | Keeps destinations; risk of hiding labels; must not hide Layer B |
| PW7-NAV-003 | Reduced header: identity + Sign in only | Smallest chrome | Sign in stays findable; in-page roles disappear; closed-beta must still appear in Layer B |

Recommended: `PW7-NAV-001` until labels no longer fit; then `PW7-NAV-002` with `Inloggen` always visible outside the disclosure. Conservative default: `PW7-NAV-002` with persistent `Inloggen`, never `PW7-NAV-003` as the only maturity path.

Historical establishment label (not an open owner choice):

```text
HISTORICAL ESTABLISHMENT — PROPOSED NAVIGATION BEHAVIOUR — OWNER DECISION REQUIRED
```

**Owner-frozen navigation (`PW7-OD-003`):** use `PW7-NAV-001` while identity and navigation content fit without compression or collision; switch to `PW7-NAV-002` when labels no longer fit; keep `Inloggen` visible outside the disclosure where feasible and usable.

```text
OWNER FROZEN NAVIGATION BEHAVIOUR — INTERACTION IMPLEMENTATION LATER-GATED
```

Responsive change is triggered by content fit, not a device name. `PW7-NAV-003` is not the primary selected model. Conservative implementation fallback: compact disclosure plus independently visible `Inloggen`. No hamburger is selected or implemented in this phase.

Governed meaning of “where feasible”: at 320 px, identity may wrap onto a second header row; the disclosure control may sit with identity; `Inloggen` remains outside the disclosure as a header utility. `Inloggen` must not exist only inside the menu. If identity, disclosure control, and `Inloggen` still collide, wrap in that order rather than moving `Inloggen` into the disclosure. Discoverability at the access section does not replace the header occurrence (`PW7-OD-011`).

| ID | Requirement |
| --- | --- |
| PW7-NAV-004 | Sign in remains findable and must not be the visually dominant acquisition CTA |
| PW7-NAV-005 | Closed-beta truth must not depend only on the nav label `Gesloten bèta` |
| PW7-NAV-006 | Disclosure, if used: explicit open/close name; Escape closes; focus returns to the control; no assumed outside-click-only close; no scroll-lock unless needed to keep focus; reduced-motion: no required animation; no-JavaScript: in-page labels remain in document order or Sign in plus on-page headings remain usable |
| PW7-NAV-007 | In-page items stay `CANDIDATE DESTINATION — NOT IMPLEMENTED`. No `href="#"`. No active-section chrome that implies live anchors. Deep-link arrival is a later PW-13 behaviour. Header position is `STATIC HEADER FOR THE INITIAL PUBLIC FOUNDATION` (`PW7-OD-004`). After scroll, exploration uses on-page headings; the access section supplies the second Sign in. A static header in normal flow does not require a sticky offset; later anchors still move focus to the target heading (`PW7-A11Y-007`) |

Do not implement a hamburger. Do not freeze icon artwork. Header height is a functional role: enough for identity, nav or disclosure control, and Sign in, not a billboard. The header participates in normal document flow (`PW7-OD-004`). Later sticky-header reconsideration requires a separate governed decision plus anchor-offset, focus, zoom, reduced-motion, and mobile review.

**Owner-frozen Sign in repetition (`PW7-OD-011`):** `INLOGGEN IN HEADER AND ACCESS SECTION`. One Sign in utility in the header; one contextual Sign in utility in the access section; no default Sign in in the footer; no Sign in button inside the Course Seller section or Today proof; no Sign in control presented as Start, Join, Register, Explore, or View product. The header occurrence remains utility-level. The access occurrence may receive clearer local emphasis without becoming acquisition. Footer repetition may be reconsidered only after usability evidence demonstrates a need.

---

## 16. Hero Layout

| ID | Model | Five-second | Premium | Wrap | Mobile | Layer B | Task-mgr risk | Chatbot risk | Empty-space | Fake proof |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-HERO-001 | Single-column text-led | High if Layer B follows | High if measure is controlled | Best | Stack naturally | Easy to keep nearby | Low if objects stay | Low; no AI art | Low | None |
| PW7-HERO-002 | Asymmetric text + restrained field | High if field is optional | High | Good | Field stacks below or omits | Must stay with text column | Low | Low if field is not a bot | High if field is reserved empty | High if field looks like UI |
| PW7-HERO-003 | Split with product screenshot | Distorted toward Today | Low for current evidence | Screenshot dominates | Screenshot first is forbidden | Easy to bury | High | Medium | Medium | Blocked |

`PW7-HERO-003` remains blocked unless later screenshot authority exists (`PW5-VISUAL-002` HOLD).

| ID | Requirement |
| --- | --- |
| PW7-HERO-004 | Target line behaviour: H1 1–2 lines from 1024 px up, 2–3 lines at 320–430 px; support 2–4 lines desktop, 3–6 mobile. If a layout cannot hold that without rewriting copy, reject the layout |
| PW7-HERO-005 | Identity wordmark may sit above the H1; it is not a second H1 |

Recommended hero: `PW7-HERO-001` as the complete default. `PW7-HERO-002` is allowed only if the supporting field is optional and omitted when no approved visual exists.

Establishment recommendation above is historical.

**Owner-frozen hero (`PW7-OD-002`):** `PW7-HERO-001 — SINGLE-COLUMN TEXT-LED HERO`.

```text
OWNER FROZEN HERO DEFAULT — CONDITIONAL SUPPORTING FIELD LATER-GATED
```

The complete default hero is a single primary text column. Frozen H1 and support remain unchanged. Layer B remains visibly associated. Sign in does not become the dominant acquisition message. Today does not appear before general product value. BOS remains omitted. AI is not introduced. Course Sellers do not appear in the hero. The hero must work without any image.

`PW7-HERO-002` may be used only as a later visual-design variant when an approved supporting field exists, contains meaningful approved visual content, disappears completely when empty, keeps reading order text-first, and does not imply product access or completeness.

The selected hero layout must not: place Today before general value; make Sign in the dominant message; move closed beta to the footer; introduce a public screenshot; insert AI imagery; imply four editions; separate support from the H1 so meaning is lost.

---

## 17. Closed-Beta Layout

| ID | Form | Allowed | Risk |
| --- | --- | --- | --- |
| PW7-BETA-001 | Short text row | Yes | May wrap; still complete |
| PW7-BETA-002 | Restrained status panel | Yes if text, not scarcity | Promo-band reading |
| PW7-BETA-003 | Inline status + utility copy | Yes — recommended | None if Sign in stays utility |
| PW7-BETA-004 | Badge plus visible explanatory text | Badge may support, not replace, the two sentences | Colour-only status; launch badge |
| PW7-BETA-005 | Later-layer reminder | Full no-new-account explanation remains in the access section even when Layer B is early and visible | Treating Layer B as the complete access story |

Recommended: `PW7-BETA-003`.

Historical establishment label (not an open owner choice):

```text
HISTORICAL ESTABLISHMENT — PROPOSED MATURITY-LAYER LAYOUT — OWNER DECISION REQUIRED
```

**Owner-frozen maturity-layer layout (`PW7-OD-005`):** `PW7-BETA-003 — INLINE STATUS WITH ASSOCIATED UTILITY COPY`.

```text
OWNER FROZEN MATURITY-LAYER LAYOUT — VISUAL STYLING LATER-GATED
```

Required visible copy remains `ZyntixAI is nu in gesloten bèta.` and `Inloggen is voor bestaande accounts.` Both sentences remain available on mobile. Appears early near the hero and remains in the initial reading sequence. Understandable without colour; not badge-only; not artificial scarcity; not a launch promotion; not a large conversion banner. The later access section retains the complete no-new-account explanation (`PW7-BETA-005`). Presence in the first viewport at every zoom is a validation target (`PW7-VAL-003`/`021`), not an impossible guarantee; both sentences must remain in the early reading sequence even when zoom or wrapping pushes them below the first screen.

---

## 18. General Value and Mechanism

| ID | Treatment | Verdict |
| --- | --- | --- |
| PW7-VALUE-001 | Continuous editorial section | Recommended conservative |
| PW7-VALUE-002 | Definition-list of objects | Allowed if not module tiles |
| PW7-VALUE-003 | Small grouped statements | Allowed; watch repetition |
| PW7-VALUE-004 | Restrained two-column explanation | Optional above ~1024 px; stack on tablet/mobile |
| PW7-VALUE-005 | Card-based presentation | Rejected — implies complete modules |

Rejected implications: each named object is a complete module; all capabilities are currently available; ZyntixAI replaces every tool; the homepage is a product dashboard.

Establishment recommendation (`PW7-VALUE-001`) is historical.

**Owner-frozen value/mechanism layout (`PW7-OD-006`):** `PW7-VALUE-001 — CONTINUOUS EDITORIAL VALUE AND MECHANISM SECTION`.

```text
OWNER FROZEN EDITORIAL VALUE LAYOUT — COLUMN EXECUTION LATER-GATED
```

Value appears before detailed proof. Customers, work, responsibilities, progress, and attention remain operational objects, not unsupported feature cards. The frozen anti-replacement qualifier remains attached. The section stays readable as one narrative. Desktop may use a restrained two-column arrangement only where semantic order remains clear; below the content-fit threshold, columns stack in source order. Mobile remains one continuous reading sequence. No card grid. No module tiles. No implication that every named object is a complete available product module.

Heading/body stay in `reading-max`. Object names (`klanten`, `werk`, `verantwoordelijkheden`, `voortgang`, `aandacht`) may appear as a short list inside the value block, not as five product cards. Mechanism follows value. Do not repeat the H1 as a second hero. Anti-replacement clause remains with the value meaning (`PW6-RSK-032`).

---

## 19. Today Proof Layout

| ID | Model | Status |
| --- | --- | --- |
| PW7-PROOF-001 | Text-only bounded proof | Recommended |
| PW7-PROOF-002 | Text plus abstract structural illustration | Optional later; must not recreate Home; text complete without it |
| PW7-PROOF-003 | Text plus authenticated product screenshot | `HOLD — SCREENSHOT AUTHORITY REQUIRED` |
| PW7-PROOF-004 | Empty screenshot placeholder | Prohibited |

Recommended: `PW7-PROOF-001`.

Establishment recommendation above is historical.

**Owner-frozen Today proof layout (`PW7-OD-007`):** `PW7-PROOF-001 — TEXT-ONLY BOUNDED PROOF`. Heading remains `Today als voorbeeld in het product`. Today remains one example, not the definition of ZyntixAI. Proof remains text-first. Qualifier remains immediately associated. Today is not a public demo, not the complete product, and not AI-ranked. No fake data. Authenticated Home is not recreated. The layout remains complete without imagery.

`PW7-PROOF-003` remains `HOLD — SCREENSHOT AUTHORITY REQUIRED`. A later approved screenshot requires separate authority, controlled data, privacy review, fidelity review, accurate caption, meaningful alternative text, and proof that it does not imply public access.

Must make clear: Today is one example; for admitted signed-in users; limited; not a public demo; not the complete product; not AI-ranked.

Heading and body use `reading-max`. Qualifier (`PW6-PROOF-007`) sits immediately after the body, not in a collapsed note. Desktop: start-aligned editorial. Mobile: same order. If a later visual is approved, alt text is owned by that visual’s information role; decorative empty alt only if it carries no meaning. When no visual exists, the section remains a complete text block.

Do not visually recreate authenticated Home. Do not invent product data. Do not create a fake dashboard mockup.

---

## 20. Course Seller Layout

| ID | Treatment | Verdict |
| --- | --- | --- |
| PW7-CS-001 | Inline relevance panel | Allowed if secondary weight |
| PW7-CS-002 | Editorial aside | Recommended — least misleading |
| PW7-CS-003 | Full-width equal section | Allowed if visually quieter than Today |
| PW7-CS-004 | Card treatment | Rejected as default |
| PW7-CS-005 | Industry carousel / four equal cards | Prohibited |

Recommended: `PW7-CS-002`.

Historical establishment label (not an open owner choice):

```text
HISTORICAL ESTABLISHMENT — PROPOSED COURSE-SELLER LAYOUT — OWNER DECISION REQUIRED
```

**Owner-frozen Course Seller layout (`PW7-OD-008`):** `PW7-CS-002 — EDITORIAL ASIDE`.

```text
OWNER FROZEN SECONDARY RELEVANCE LAYOUT — NOT BRAND-PRIMARY
```

Appears after general product value and Today proof. Receives lower visual weight than the main operator story. Remains a relevance example, not a product edition. Qualifier stays attached. No separate CTA. No LMS, learner-dashboard, or course-catalogue imagery. Does not introduce Agencies, Field Service, Construction, E-commerce, Retail, or Fulfillment. Does not become one card within four equivalent target-group cards. Stacks as one intact unit on mobile. Not hero-adjacent by default. No default-closed accordion.

---

## 21. Conditional AI Layout

| ID | Rule |
| --- | --- |
| PW7-AI-001 | Never in the hero; never a standalone default section |
| PW7-AI-002 | If later activated, place a short text unit adjacent to the first likely misunderstanding (product name in identity/mechanism), after positive product meaning |
| PW7-AI-003 | Removable without breaking page structure; no chatbot, sparkle, robot, brain, or AI-gradient visual; no generative or autonomous suggestion |

```text
CONDITIONAL LAYOUT — INACTIVE BY DEFAULT
```

PW-7 does not decide that activation is needed.

---

## 22. Trust Layout

| ID | Treatment | Verdict |
| --- | --- | --- |
| PW7-TRUST-001 | Compact text section | Recommended |
| PW7-TRUST-002 | Short list | Allowed — recommended mobile form |
| PW7-TRUST-003 | Two-column control explanation | Optional wide only; not a badge row |
| PW7-TRUST-004 | Card grid | Rejected |
| PW7-TRUST-005 | Certification / SOC 2 / ISO / AVG / encryption / uptime badges | Prohibited |

Recommended: `PW7-TRUST-001` with `PW7-TRUST-002` as the mobile list form.

Historical establishment label (not an open owner choice):

```text
HISTORICAL ESTABLISHMENT — PROPOSED TRUST LAYOUT — OWNER DECISION REQUIRED
```

**Owner-frozen trust layout (`PW7-OD-009`):** `PW7-TRUST-001 — COMPACT TEXT WITH A SHORT SEMANTIC LIST`.

```text
OWNER FROZEN NAMED-CONTROL TRUST LAYOUT — LEGAL CLAIMS EXTERNALLY GATED
```

Only named controls may be described. The layout must not resemble a certification wall. No security badges, compliance logos, SOC 2, ISO, AVG/GDPR conclusion, uptime claim, encryption claim, or “secure platform” claim. Text remains understandable without icons. Any later icon remains supporting decoration. Mobile reading order matches the visible order. Governance-only certification/legal boundaries remain outside required visible copy.

Heading `Hoe toegang in het product werkt` then the named-control sentences. List semantics if more than one control is visually grouped. Maximum density: one compact cluster, not four assurance tiles. Icons may later support labels but text remains independently understandable. Screen-reader order matches visual order. `PW6-TRUST-009` stays governance-only, not a visitor badge.

---

## 23. Access and Honest Stop

| ID | Treatment | Verdict |
| --- | --- | --- |
| PW7-ACCESS-001 | Compact access panel | Recommended |
| PW7-ACCESS-002 | Full-width closing section | Allowed if calm, not a banner |
| PW7-ACCESS-003 | Two-column status and utility | Optional wide; mobile order fixed |
| PW7-ACCESS-004 | Card treatment | Rejected |
| PW7-ACCESS-005 | Disabled request-access / fake form / missing-destination button | Prohibited |

Recommended: `PW7-ACCESS-001`.

Historical establishment label (not an open owner choice):

```text
HISTORICAL ESTABLISHMENT — PROPOSED ACCESS-LAYOUT MODEL — OWNER DECISION REQUIRED
```

**Owner-frozen access layout (`PW7-OD-010`):** `PW7-ACCESS-001 — COMPACT ACCESS PANEL`.

```text
OWNER FROZEN ACCESS-LAYOUT MODEL — DESTINATION IMPLEMENTATION LATER-GATED
```

Appears as a deliberate closing section before the footer. Stays calm and informational. Not a giant CTA banner, error state, disabled registration form, or waitlist. Contains no request-access, contact, demo, or signup control. `Inloggen` remains available for existing accounts. Visitors without an account receive the frozen honest-stop message. Mobile order remains: (1) status; (2) existing-account Sign in; (3) no-account informational outcome.

Feel: deliberate, calm, respectful, complete, truthful. Must not look like an error, disabled signup, rejected application, waitlist, conversion banner, or giant CTA panel. Sign in remains visually available and is not labelled as starting or joining.

---

## 24. Footer Layout

| ID | Rule |
| --- | --- |
| PW7-FOOT-001 | Desktop/mobile: identity `ZyntixAI` first |
| PW7-FOOT-002 | Optional Sign in or closed-beta repeat only if usability evidence later requires it; default omit (`PW5-OD-007`) |
| PW7-FOOT-003 | Future legal slots only when destinations and authority exist; currently `EXTERNALLY GATED` |
| PW7-FOOT-004 | Footer may not be the only place where maturity or access truth appears |

The minimal footer direction is confirmed through the layout and Sign-in decisions (`PW7-OD-011`, `PW7-OD-012`). Default contents: `ZyntixAI` identity. Default omissions: Sign in repetition; beta repetition; legal links without destinations; privacy; terms; contact; social icons; pricing; careers; blog; status; documentation; invented company details. Legal slots remain `EXTERNALLY GATED`. No additional owner-decision ID is created for the footer.

Do not include invented legal entity, copyright owner, address, empty social icons, pricing, careers, blog, contact, privacy, terms, cookie settings, status page, documentation, or legal links without destinations.

---

## 25. Section Rhythm and Page Length

Visible top-level visual sections should follow composition groups, not one banner per `PW5-BLK`.

Proposed cluster map:

1. Header
2. Hero + Layer B
3. Value + mechanism
4. Today proof
5. Course Seller relevance (quieter)
6. Trust
7. Access / honest stop
8. Footer

```text
PROPOSED LAYOUT BUDGET — NOT VALIDATED
```

Establishment budget above is historical. Numerical values remain content and layout constraints, not universal validated truths.

**Owner-frozen density (`PW7-OD-012`):** `CONTROLLED EIGHT-CLUSTER SINGLE-PAGE BUDGET`.

```text
OWNER FROZEN LAYOUT BUDGET — IMPLEMENTATION VALIDATION REQUIRED
```

Selected visual clusters: (1) header; (2) hero plus early closed beta; (3) value plus mechanism; (4) Today proof; (5) Course Seller editorial aside; (6) trust; (7) access and honest stop; (8) footer. Maximum eight primary visual clusters. Maximum two simultaneous content columns. Zero product-feature card grids. Zero four-target-group grids. Zero required screenshots. One primary reading spine. Body-copy measure approximately 60–72 characters where practical. Maximum two intentional Sign in placements. One primary high-emphasis maturity treatment. No repeated hero-level CTA bands. No unbounded section accumulation.

| ID | Budget | Proposed limit | Rationale |
| --- | --- | --- | --- |
| PW7-DENS-001 | Active top-level visual sections | 8 including header/footer | Eleven roles would feel like a dump |
| PW7-DENS-002 | Simultaneous columns | 2 | Third column becomes a catalogue |
| PW7-DENS-003 | Cards per row | 0 product cards | Evidence does not support a grid |
| PW7-DENS-004 | Text measure | 60–72 characters | Qualifier retention |
| PW7-DENS-005 | Consecutive dense-text sections | 2 before a quieter break | Fatigue; not an excuse to drop truth |
| PW7-DENS-006 | High-emphasis actions | 1 visual emphasis class for actions: `Inloggen` remains utility, not a conversion band | Prevents acquisition CTA; distinct from the one high-emphasis maturity treatment (`PW7-DENS-008`) |
| PW7-DENS-007 | Sign in repetitions | Header + access only by default (`PW7-OD-011`); footer omit; maximum 2 intentional placements | PW6-RESP-010; owner freeze |
| PW7-DENS-008 | Prominent status treatments | 1 early Layer B; access restates in body text | Avoid promo badges |

Do not shorten owner-frozen copy to meet a budget. Adjust layout instead.

---

## 26. Content Reduction Rules

Allowed: column stacking; spacing reduction; alignment changes; measure changes; navigation disclosure; decorative visual removal; non-material repetition removal where authority allows.

Prohibited: removing closed-beta truth; removing existing-account qualification; removing no-new-account truth; removing Today limitations; removing Course Seller qualifiers; removing the honest stop; making Sign in look like signup; hiding material information in a tooltip; hiding qualifiers in a default-closed accordion; relying on desktop hover; showing a shorter mobile claim that becomes materially stronger.

| ID | Content item | Desktop | Tablet | Mobile | May shorten | May omit | Qualifier retention | Approval | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-REDUCE-001 | Identity | Wordmark/name | Same | Same | no | no | Name visible | none | PW7-ACC-001 |
| PW7-REDUCE-002 | H1 | Full HERO-006 | Full | Full | no | no | Direction, not guarantee | none | PW7-VAL-019 |
| PW7-REDUCE-003 | Support | Full COPY-044 | Full | Nearby; may wrap | only PW6-RESP-002 nearby rule | no | Objects remain | copy owner if shorter variant | PW7-VAL-020 |
| PW7-REDUCE-004 | Layer B | Two sentences | Two | Two | no | no | Both sentences | none | PW7-VAL-021 |
| PW7-REDUCE-005 | Value | COPY-046 both sentences | Same | Same | objects list only | no | Anti-replacement | none | PW7-VAL-022 |
| PW7-REDUCE-006 | Mechanism | COPY-047 | Same | Today mention may shorten | LAYOUT-P2 | no | Not autonomous | none | PW7-VAL-016 |
| PW7-REDUCE-007 | Today | PROOF-005–007 | Same | Body short + qualifier | body | no | PROOF-007 | none | PW7-VAL-024 |
| PW7-REDUCE-008 | CS | CS-009–011 | Same | Heading + qualifier minimum | heading | no | CS-011 | none | PW7-VAL-025 |
| PW7-REDUCE-009 | Trust | TRUST-007/008 | List | List | explanations | no | Account/org meaning | none | PW7-VAL-026 |
| PW7-REDUCE-010 | Access | ACCESS-007–010 | Same | 007+008+010 plus access `Inloggen`; ACCESS-009 qualifier may shorten if header already qualified nearby | ACCESS-009 qualifier only, not the access `Inloggen` control (`PW7-OD-011`) | no | Stop + no-new-account | none | PW7-VAL-027 |
| PW7-REDUCE-011 | Nav labels | Four + identity | Fit-or-disclose | Disclose; keep Inloggen | `Gesloten bèta` → `Bèta` allowed (`PW6-RESP-011`; `PW6-NAV-007`) | in-page items only if disclosed, not deleted | Destinations not claimed live | PW6-RESP-011; PW7-OD-003 | PW7-VAL-013 |
| PW7-REDUCE-012 | Optional visual | May show | May show | May omit | n/a | yes | Text remains complete | PW5-OD-006 | PW7-VAL-017 |
| PW7-REDUCE-013 | AI-002 | Absent | Absent | Absent | n/a | yes default | If active, full short text | PW6-OD-009 | PW7-STATE-017 |
| PW7-REDUCE-014 | Footer legal | Absent | Absent | Absent | n/a | yes | No invented links | external | PW7-Q-023 |

---

## 27. Visual Dependencies

No visual may be required to make unclear copy understandable. If approved visuals are absent, the page must still feel complete. No images are created in this phase.

| ID | Visual | Class |
| --- | --- | --- |
| PW7-VISUAL-001 | Logo/wordmark | Optional as graphic; identity text required |
| PW7-VISUAL-002 | Abstract brand field | Optional; omit rather than empty panel |
| PW7-VISUAL-003 | Product screenshot | HOLD — `PW5-VISUAL-002` |
| PW7-VISUAL-004 | Today screenshot | HOLD |
| PW7-VISUAL-005 | Fake dashboard | Prohibited |
| PW7-VISUAL-006 | Chatbot illustration | Prohibited |
| PW7-VISUAL-007 | AI robot/brain imagery | Prohibited |
| PW7-VISUAL-008 | Course Seller illustration | Optional later; not LMS/catalogue |
| PW7-VISUAL-009 | Four-target-group illustration set | Prohibited |
| PW7-VISUAL-010 | Decorative background texture | Optional; must not carry meaning |
| PW7-VISUAL-011 | Icons for named controls | Optional later; text independent |
| PW7-VISUAL-012 | Section dividers | Optional; not required for structure |
| PW7-VISUAL-013 | Motion | Optional decorative; reduced-motion: no required motion; motion must not carry meaning |

Required visual: none except the readable product name. Conditional: `PW5-VISUAL-001` abstract operational visual at most one primary slot, text-first.

Establishment visual recommendation is historical.

**Owner-frozen visual policy (`PW7-OD-013`):** `TEXT-FIRST — NO REQUIRED HOMEPAGE IMAGE`.

```text
OWNER FROZEN TEXT-FIRST VISUAL POLICY — OPTIONAL ABSTRACT VISUAL LATER-GATED
```

The homepage must feel complete without an image. Do not reserve empty visual space. Do not require a product screenshot or Today screenshot. Do not create a fake dashboard. Do not use chatbot imagery. Do not use robot, brain, sparkle, or generic AI imagery as product explanation. Do not use four target-group illustration sets. Do not require Course Seller imagery. Do not require motion to explain meaning.

Conditional later allowance: at most one restrained abstract brand or operational visual may be considered; it requires separate visual-design authority; it must add atmosphere or structure without creating a false claim; it must disappear cleanly when absent; it may not replace text; it may not imply a live product state.

---

## 28. Responsive Accessibility

Layout-level requirements, not an implementation PASS. Do not claim WCAG compliance, accessibility certification, or fully accessible.

| ID | Requirement | Owner |
| --- | --- | --- |
| PW7-A11Y-001 | Landmarks: banner, main, contentinfo; nav named | PW-8 / PW-13 |
| PW7-A11Y-002 | One H1: `PW6-HERO-006` | PW-8 |
| PW7-A11Y-003 | Heading hierarchy matches section purpose (`PW6-A11Y-003`) | PW-8 |
| PW7-A11Y-004 | DOM order matches meaning and visual order | PW-8 |
| PW7-A11Y-005 | Focus order: identity → in-page or disclosure → Inloggen → main sections → access Inloggen | PW-8 |
| PW7-A11Y-006 | Skip link to main | PW-8 |
| PW7-A11Y-007 | Later in-page anchors move focus to the target heading | PW-8 / PW-13 |
| PW7-A11Y-008 | Initial foundation uses a static header (`PW7-OD-004`). If sticky is later separately authorized, focused targets must remain visible below it | PW-8; later sticky remains separately gated |
| PW7-A11Y-009 | Keyboard operation of any disclosure | PW-8 |
| PW7-A11Y-010 | Disclosure name, expanded/collapsed state, Escape, focus restore; keyboard focus remains in the disclosure while open unless a chosen destination is taken; scroll-lock only if needed to keep focus (`PW7-NAV-006`) | PW-8 |
| PW7-A11Y-011 | Touch targets for Inloggen and disclosure meet later control-size criteria without turning Inloggen into a billboard | PW-8 / PW-11 |
| PW7-A11Y-012 | Zoom 200% and text-resize reflow; no loss of material text | PW-12 / PW-13 |
| PW7-A11Y-013 | No horizontal scrolling at 320 px for normal content; no clipped copy | PW-12 |
| PW7-A11Y-014 | Visible focus | PW-8 |
| PW7-A11Y-015 | Reduced motion: no required animation | PW-8 / PW-11 |
| PW7-A11Y-016 | High-contrast resilience; status not colour-only | PW-8 / PW-11 |
| PW7-A11Y-017 | Qualifiers available to assistive technology in reading order | PW-8 |
| PW7-A11Y-018 | Repeated Inloggen links share purpose (`PW6-A11Y-017`) | PW-8 |
| PW7-A11Y-019 | Optional imagery alt-text owned by information role | PW-10 / PW-8 |
| PW7-A11Y-020 | English product name `Today` remains a named product noun, explained in surrounding Dutch | PW-8 / localization |

Acceptance language: requirement, acceptance criterion, planned validation, implementation owner. Not: accessibility certified; WCAG compliant; fully accessible.

---

## 29. Responsive State Matrix

| ID | Visitor / state | Viewport | Visible content | Action hierarchy | Required qualifier | Focus | Fallback | Prohibited reading | Downstream | Class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-STATE-001 | Unauthenticated first visit | all | Full A2 page when public root exists | Read; utility Inloggen | Layer B + no-new-account later | Skip to main | Current: `/` → `/login` | GA; open signup | PW-13 | desired vs current truth |
| PW7-STATE-002 | Existing-account visitor | all | Same page; Inloggen findable | Inloggen utility | Existing accounts | Header Inloggen | `/login` English UI | Join | PW-13 | desired |
| PW7-STATE-003 | Visitor without account | all | Honest stop visible | Read is enough | ACCESS-010 | Access heading | Stay on page | Dead end; waitlist | PW-6/7 | desired |
| PW7-STATE-004 | Invited participant | all | Same public copy; no invite CTA invented | Invite remains outside this page | Not public join | n/a | Existing invite routes | Homepage as invite | PW-0 | current + desired |
| PW7-STATE-005 | Authenticated arrival at desired public `/` | all | Must not show marketing homepage as product Home | Product-entry retained conceptually | Not a public demo of Today | Product shell | Current authenticated `/` resolver | Public page hijacks session | PW-13 | desired; current truth different |
| PW7-STATE-006 | Mobile menu closed | narrow | Identity + Inloggen + disclosure control | Open menu; Inloggen | Layer B still on page | Disclosure control | Inline headings | Maturity only in closed menu | PW-8 | desired |
| PW7-STATE-007 | Mobile menu open | narrow | In-page labels; Inloggen still available | Close; choose label later | Destinations not live | First menu item | Close on Escape | Fake pages | PW-13 | later implementation |
| PW7-STATE-008 | In-page anchor arrival | all | Target section | Continue reading | Focus on heading | Target | Ignore until IDs exist | `href="#"` | PW-13 | later |
| PW7-STATE-009 | 200% zoom | desktop CSS | Reflowed single column | Same | All LAYOUT-P0 | Visible | Horizontal scroll forbidden | Cropped H1 | PW-12 | desired |
| PW7-STATE-010 | Reduced motion | all | Static | Same | Same | Same | No required motion | Motion as meaning | PW-8 | desired |
| PW7-STATE-011 | No optional visual | all | Complete text page | Same | Same | Same | `PW7-MODEL-001` text-led fallback (`PW7-OD-001`/`013`); not Root Model A | Empty panel | PW-10 | desired |
| PW7-STATE-012 | Later approved visual | wide | One optional field | Same | Text still complete | Visual after text or beside, never before H1 | Omit if missing | Screenshot as public Today | PW-10 | conditional |
| PW7-STATE-013 | Long / expanded text | all | Wrap; no overflow | Same | Qualifiers stay | Same | Increase measure stack | Hidden overflow | localization | desired |
| PW7-STATE-014 | Unavailable legal destinations | all | Footer without legal links | None | Externally gated | n/a | Omit | Fake privacy/terms | legal | externally gated |
| PW7-STATE-015 | Public not-found | later route | Outside core homepage | Honest not-found | Not a signup | Main | PW5-BLK-014 later | Fake sitemap | PW-13 | later |
| PW7-STATE-016 | Stale session / auth transition | login, not homepage | Login messaging remains on `/login` | Sign in | Session copy stays English on login | Login H1 | Homepage must not impersonate session errors | Homepage as error | auth | current truth |
| PW7-STATE-017 | AI clarification inactive | all | No AI block | n/a | Inactive | n/a | Omit | Accidental AI section | PW6-OD-009 | desired |
| PW7-STATE-018 | AI clarification later active | all | Short adjacent text | None | AI-002 wording | After trigger | Removable | Chatbot SKU | validation owner | conditional |

---

## 30. Block Acceptance Matrix

AND logic within each block. Passing at one desktop width is not enough.

| ID | Block | Viewport | Wrap | Order | Qualifier | Visibility | Interaction | Accessibility | Visual dep. | Failure | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-ACC-001 | Header | 320–1920 + 200% | Identity does not overflow | Identity then nav/utility | Destinations not live | Identity + Inloggen | Disclosure if used | Named nav | Wordmark optional | Inloggen hidden | VAL-013 |
| PW7-ACC-002 | Navigation | same | Labels wrap or disclose | In-page before Inloggen | Not implemented | Labels or disclosure | No dead href | Unique purposes | none | Fake pages | VAL-013 |
| PW7-ACC-003 | Hero | same | H1 1–3 lines typical | H1 then support | Not a guarantee | Both in cluster | none | One H1 | No screenshot | Support detached | VAL-019/020 |
| PW7-ACC-004 | Early closed beta | first-viewport target, subject to wrap and zoom | Two sentences wrap | After support | Existing-account | Both sentences in early sequence | none | Text status | No promo badge-only | Late, colour-only, or omitted on mobile | VAL-021 |
| PW7-ACC-005 | Value | same | Anti-replacement wraps | After Layer B | Not all tools | COPY-046 | none | Heading/support | No object cards | Clause dropped | VAL-022 |
| PW7-ACC-006 | Mechanism | same | Objects remain | After value | Today later, bounded | COPY-047 | none | Heading purpose | Optional abstract only | Autonomous OS | VAL-016 |
| PW7-ACC-007 | Today proof | same | Qualifier wraps | After mechanism | Not public demo | PROOF-005–007 | none | Qualifier in order | Text-only default | Screenshot as access | VAL-024 |
| PW7-ACC-008 | Course Seller | same | Qualifier attached | After Today | Non-LMS | CS-009–011 | no extra CTA | Availability in text | No LMS art | Brand capture | VAL-025 |
| PW7-ACC-009 | Conditional AI | n/a default | n/a | Adjacent if active | Inactive default | Absent now | none | Text if active | No AI art | Default block | STATE-017 |
| PW7-ACC-010 | Trust | same | Named controls wrap | After CS | Not certification | TRUST-007/008 | none | List order | Icons optional | SOC/AVG badges | VAL-026 |
| PW7-ACC-011 | Access/stop | same | Stop wraps | After trust | No new account; read-enough | ACCESS-007–010 | Inloggen utility | Stop announced | No fake form | Error/waitlist | VAL-027 |
| PW7-ACC-012 | Sign in utility | same | Label stable | Header + access | Existing accounts | Findable | Goes to `/login` later | Shared purpose | Not a giant CTA | Start/Join | VAL-023 |
| PW7-ACC-013 | Footer | same | Name wraps | After access | Not unique access | Identity | No dead legal links | Text | No social icons | Only access place | REDUCE-014 |

---

## 31. Terminology

| Term | Meaning |
| --- | --- |
| Validation viewport | Width used later to inspect reflow; not evidence of testing |
| Content reflow point | Where wrapping or stacking must occur to keep meaning |
| Navigation mode change | Inline labels versus disclosure |
| Layout-column change | One column versus optional two |
| `LAYOUT-P0`–`P3` | Responsive content priority, not defect severity |
| Supporting field | Optional non-screenshot space beside hero text |
| Disclosure | Named expandable navigation, not an implemented hamburger |

---

## 32. Traceability

| ID | Layout subject | PW-1 | PW-2 | PW-3 | PW-4 | PW-5 | PW-6 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-MAP-001 | Identity / H1 | PW1-CLM-001, 002, 018 | PW2-VIS-001; PW2-CMP-003 | PW3-MSG-001, 002; PW3-POS-001 | PW4-NEED-001; PW4-SEC-001 | PW5-BLK-002; PW5-FLD-010 | PW6-HERO-006; PW6-OD-004; PW6-A2-003 |
| PW7-MAP-002 | Navigation | PW1-CLM-045 | PW2-FUT-006 | PW3-MSG-010 | PW4-NAV-001, 002, 003, 005; PW4-OD-005 | PW5-BLK-001; PW5-FLD-002–005 | PW6-OD-003; PW6-A2-002; PW6-RESP-011 |
| PW7-MAP-003 | Layer B | PW1-CLM-007, 008, 045 | PW2-VIS-001 | PW3-MSG-009 | PW4-OD-006; PW4-SEC-003 | PW5-BLK-004; PW5-OD-008 | PW6-OD-006; PW6-A2-005; PW6-RESP-004 |
| PW7-MAP-004 | Value / anti-replacement | PW1-PRH-003 | PW2-CMP-003 | PW3-TER-001 | PW4-SEC-002; PW4-NEED-003 | PW5-BLK-003; PW5-FLD-015, 016 | PW6-COPY-046; PW6-A2-006; PW6-RSK-032 |
| PW7-MAP-005 | Mechanism | PW1-CLM-018, 014 | PW2-CMP-003 | PW3-MSG-005 | PW4-SEC-004 | PW5-BLK-005 | PW6-COPY-047; PW6-A2-008 |
| PW7-MAP-006 | Today proof | PW1-CLM-014, 018, 070; PW1-PRH-022 | PW2-CMP-003 | PW3-MSG-005, 006 | PW4-SEC-005; PW4-NEED-007 | PW5-BLK-006; PW5-PROOF-001; PW5-VISUAL-002 | PW6-OD-007; PW6-A2-009; PW6-RESP-006 |
| PW7-MAP-007 | Course Seller | PW1-CLM-015, 016, 071; PW1-PRH-022 | PW2-VIS-002 | PW3-MSG-007, 015 | PW4-SEC-006; PW4-OD-002 | PW5-BLK-007; PW5-OD-001 | PW6-OD-008; PW6-A2-010; PW6-RESP-007 |
| PW7-MAP-008 | Deferred TGs omitted | PW1-CLM-020, 021, 022, 055 | PW2-VIS-001 | PW3-MSG-008 | PW4-SEC-007 | PW5-BLK-008; PW5-OD-002 | PW6-COPY-039 |
| PW7-MAP-009 | Conditional AI | PW1-CLM-003, 027, 054; PW1-PRH-016 | PW2-VIS-011; PW2-CMP-004 | PW3-MSG-003, 012 | PW4-SEC-008 | PW5-BLK-009; PW5-OD-003 | PW6-OD-009; PW6-A2-011 |
| PW7-MAP-010 | Trust | PW1-CLM-032, 013, 034, 033 | PW2-VIS-001 | PW3-TRU-002 | PW4-SEC-009; PW4-OD-003 | PW5-BLK-010; PW5-OD-004 | PW6-OD-010; PW6-A2-012; PW6-RSK-033 |
| PW7-MAP-011 | Access / stop | PW1-CLM-011, 046, 045 | PW2-VIS-008, 010 | PW3-MSG-014 | PW4-SEC-010 | PW5-BLK-011; PW5-OD-008 | PW6-OD-011; PW6-A2-013; PW6-RESP-009 |
| PW7-MAP-012 | Sign in utility | PW1-CLM-045 | PW2-VIS-007 | PW3-MSG-010 | PW4-NAV-005 | PW5-BLK-012; PW5-OD-007 | PW6-A2-014; PW6-RESP-010 |
| PW7-MAP-013 | Footer | PW1-CLM-001 | n/a | n/a | PW4-SEC-011 | PW5-BLK-013 | PW6-A2-015; PW6-FOOT-004 |
| PW7-MAP-014 | Root / isolation | n/a | PW2-OD-009 | n/a | PW4-OD-001, 004; PW4-PAGE-001 | n/a | PW6 non-scope |
| PW7-MAP-015 | Qualifier survival | PW1-PRH-003 | n/a | n/a | PW4-DISC-002 | PW5-RESP-001–012 | PW6-RESP-001–014; PW6-R1-FND-010 |
| PW7-MAP-016 | No fake destinations | n/a | PW2-FUT-006 | n/a | PW4-OD-005 | PW5-FLD-008 | PW6-R1-FND-014 |

HOLD and PROHIBIT records support exclusions only.

---

## 33. Risk Register

Severities use a non-defect risk scale: CRITICAL / HIGH / MEDIUM / LOW. These are risk scenarios, not present open defects.

Present findings: current P0 findings none; current P1 findings none.

Rule: `P0/P1 DEFECTS MUST BE CLOSED BEFORE PHASE PASS; HIGH-SEVERITY FUTURE RISKS MAY REMAIN OPEN WITH A NAMED PREVENTIVE GATE`

Do not label a deferred current defect as P1 merely to close it later. High or critical potential impact does not make a scenario a current P1 defect when the prohibited condition has not occurred.

| ID | Risk | Sev. | Like. | Viewport | Block | Trigger | Harm | Prevention | Detection | Owner | Gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-RSK-001 | Desktop-only design | HIGH | M | mobile | all | Designing at 1440 only | Lost truth | Viewport matrix | VAL-001–004 | layout owner | PW-12 |
| PW7-RSK-002 | Mobile qualifier loss | HIGH | H | 320–430 | value/CS/Today | Truncation | All-in-one / LMS | REDUCE + PRI | VAL-022/025 | PW-7/12 | PW-12 |
| PW7-RSK-003 | Sign in as acquisition | HIGH | M | all | header | Giant button | Open-join reading | Utility hierarchy | VAL-023 | design | PW-11 |
| PW7-RSK-004 | Closed beta too late | HIGH | M | first view | Layer B | Buried after proof | GA implication | Early Layer B | VAL-021 | layout | PW-12 |
| PW7-RSK-005 | Hidden no-account boundary | HIGH | M | mobile | access | Footer-only | Fake join | ACCESS not footer-only | VAL-027 | layout | PW-12 |
| PW7-RSK-006 | H1 unreadable wrap | MEDIUM | M | 320 | hero | Narrow measure + large type | Task-mgr scramble | Line targets | VAL-019 | type | PW-11 |
| PW7-RSK-007 | Overly wide body | MEDIUM | M | 1920 | reading | Uncapped measure | Lost qualifiers | `reading-max` | VAL-010 | shell | PW-11 |
| PW7-RSK-008 | Overly narrow premium | MEDIUM | L | desktop | canvas | Tiny column | Document feel | Model 002 optional field omitted rather than reserved | owner OD-001 | layout | PW-10 / PW-12 |
| PW7-RSK-009 | Excessive blank space | MEDIUM | M | desktop | hero | Reserved empty panel | Unfinished site | Omit missing visuals | VAL-017 | layout | PW-10 |
| PW7-RSK-010 | Generic SaaS card grid | HIGH | M | all | value | Model C | Completeness | Reject cards | review | layout | this file |
| PW7-RSK-011 | Fake dashboard | CRITICAL | M | all | Today | Mock UI | Public Home demo | Text-only default | VAL-024 | layout | screenshot HOLD |
| PW7-RSK-012 | Screenshot as public access | CRITICAL | M | all | Today | Cropped Home UI | Privacy + completeness | `PW5-VISUAL-002` | design review | privacy | later authority |
| PW7-RSK-013 | Today as whole product | HIGH | M | all | Today | Visual dominance | Suite claim | Secondary weight vs hero | VAL-024 | layout | PW-12 |
| PW7-RSK-014 | Course Seller as brand | HIGH | M | all | CS | Hero-adjacent CS | Brand capture | After Today; quieter | VAL-025 | layout | PW-12 |
| PW7-RSK-015 | Four-TG equality | HIGH | L | all | omitted | Card set | False editions | Omitted TGs | audit | content | PW-5/6 |
| PW7-RSK-016 | Trust as certification | HIGH | M | all | trust | Badges | Legal overclaim | Named-control list | VAL-026 | layout | legal |
| PW7-RSK-017 | Menu hides maturity | HIGH | H | mobile | nav | Layer B only in menu | GA on first view | Layer B in main | VAL-021 | nav | PW-8 |
| PW7-RSK-018 | Inaccessible disclosure | HIGH | M | mobile | nav | Div-only menu | Keyboard trap | A11Y-009/010 | VAL-013 | PW-8 | PW-8 |
| PW7-RSK-019 | Sticky header covers anchors | MEDIUM | M | desktop | header | Sticky + no offset | Lost heading | Static default or offset | VAL-014 | PW-8 | OD-004 |
| PW7-RSK-020 | Focus loss after in-page nav | HIGH | M | all | nav | Hash without focus | Disorientation | Later focus move | VAL-014 | PW-13 | PW-13 |
| PW7-RSK-021 | Horizontal overflow | HIGH | M | 320 | all | Long Dutch words | Clipped truth | Wrap/break | VAL-028 | layout | PW-12 |
| PW7-RSK-022 | 200% zoom failure | HIGH | M | zoom | all | Fixed heights | Lost copy | Reflow | VAL-011 | layout | PW-12 |
| PW7-RSK-023 | Compound-word overflow | MEDIUM | H | 320 | support/CS | `verantwoordelijkheden` | Horizontal scroll | Soft wrap | VAL-028 | type | PW-11 |
| PW7-RSK-024 | Motion carrying meaning | HIGH | L | all | status | Animated badge | Colour/motion-only status | Text status | VAL-015 | design | PW-8 |
| PW7-RSK-025 | Missing reduced motion | MEDIUM | M | all | nav | Required animation | Vestibular harm | Optional motion | VAL-015 | PW-8 | PW-8 |
| PW7-RSK-026 | Footer-only access | HIGH | M | mobile | footer | Budget cutting | Hidden stop | ACCESS required | VAL-027 | layout | PW-12 |
| PW7-RSK-027 | Copy rewrite beyond PW-6 | CRITICAL | M | mobile | all | Fitting type | Truth change | Reject layout | review | copy | this file |
| PW7-RSK-028 | Layout treated as CSS authority | MEDIUM | H | n/a | shell | Token numbers | Premature implementation | Proposed labels | review | PW-13 | PW-13 |
| PW7-RSK-029 | Root Model A as implemented | CRITICAL | M | n/a | root | Spec as current truth | Broken `/` bounce | Current truth section | review | PW-13 | PW-13 |
| PW7-RSK-030 | Shared CSS hits Home | CRITICAL | M | all | globals | Editing `globals.css` | Home regression | Isolated public CSS | impact analysis | PW-13 | PW-0 P1 |
| PW7-RSK-031 | Empty visual placeholder | HIGH | M | desktop | hero/proof | Reserved image box | Fake product | Omit if missing | VAL-017 | layout | PW-10 |
| PW7-RSK-032 | Unbounded page length | MEDIUM | M | mobile | all | One block per BLK | Fatigue; drop later truth | Density budget | review | layout | PW-12 |
| PW7-RSK-033 | Excessive repetition | MEDIUM | M | all | beta/Sign in | Three status bands | Promo feel | DENS-007/008 | review | layout | OD-011 |
| PW7-RSK-034 | Excessive card density | HIGH | M | tablet | value | 2×2 tiles | Completeness | Zero product cards | review | layout | this file |
| PW7-RSK-035 | Mobile stop as error | HIGH | M | mobile | access | Alert styling | Rejection | Calm panel | VAL-027 | design | PW-11 |
| PW7-RSK-036 | AI text accidentally active | HIGH | L | all | AI | Defaulting the conditional | Chatbot SKU | Inactive default | STATE-017 | copy | PW6-OD-009 |

Present findings against this specification: P0 none; P1 none, provided the prohibited layouts are not selected. Remaining rows are risk scenarios with named preventive gates, not deferred current P1 defects. Historical establishment sentence “P1 items are later-gated by named owners” is withdrawn as ambiguous.

---

## 34. Validation Plan

All validation remains `PLANNED — NOT EXECUTED`. All thresholds remain `PROPOSED — NOT ACHIEVED`. No results are fabricated.

| ID | Objective | Setup | Viewport/state | Method | Expected | Threshold | Artifact | Owner | Gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-VAL-001 | 320 px reflow | Spec or later prototype | 320 | Inspection | No horizontal scroll; LAYOUT-P0 visible | No clipped LAYOUT-P0 | Notes | PW-12 | PW-12 |
| PW7-VAL-002 | 360 px reflow | same | 360 | Inspection | Same | Same | Notes | PW-12 | PW-12 |
| PW7-VAL-003 | 390 px reflow | same | 390 | Inspection | Layer B reasonably in first view | Both Layer B sentences | Notes | PW-12 | PW-12 |
| PW7-VAL-004 | 430 px reflow | same | 430 | Inspection | Support near H1 | Support not detached | Notes | PW-12 | PW-12 |
| PW7-VAL-005 | Tablet portrait | same | 768 | Inspection | No card grid | One reading column at this width; optional 2-col only above content-fit (`PW7-OD-006`/`014`) | Notes | PW-12 | PW-12 |
| PW7-VAL-006 | Tablet landscape | same | ~1024 landscape | Inspection | Nav likely inline | Inloggen not buried | Notes | PW-12 | PW-12 |
| PW7-VAL-007 | 1024 px | same | 1024 | Inspection | Optional 2-col only in allowed pair | No product cards | Notes | PW-12 | PW-12 |
| PW7-VAL-008 | 1280 px | same | 1280 | Inspection | Primary composition | `reading-max` held | Notes | PW-12 | PW-12 |
| PW7-VAL-009 | 1440 px | same | 1440 | Inspection | Extra space is margin | No third card column | Notes | PW-12 | PW-12 |
| PW7-VAL-010 | 1920 px | same | 1920 | Inspection | Canvas capped | No wall stretch | Notes | PW-12 | PW-12 |
| PW7-VAL-011 | 200% zoom | same | 1280 CSS at 200% | Inspection | Reflow; focus visible | No lost LAYOUT-P0 | Notes | PW-12 | PW-12 |
| PW7-VAL-012 | Keyboard navigation | later build | desktop | Keyboard | Order matches A11Y-005 | No trap | Notes | PW-8 | PW-8 |
| PW7-VAL-013 | Mobile-menu operation | later build | narrow | Keyboard/touch | Open/close; Escape; Inloggen outside | Named disclosure | Notes | PW-8 | PW-8 |
| PW7-VAL-014 | In-page anchor focus | later IDs | all | Keyboard | Focus to heading | Not implemented now | Notes | PW-13 | PW-13 |
| PW7-VAL-015 | Reduced motion | later build | all | Prefers-reduced-motion | No required animation | Status still text | Notes | PW-8 | PW-8 |
| PW7-VAL-016 | Long-text expansion | +20% copy fixture | 320 | Inspection | Wrap; qualifiers stay | No overflow | Notes | localization | later |
| PW7-VAL-017 | No-image state | omit visuals | all | Inspection | Page complete | No empty panel | Notes | PW-10 | PW-10 |
| PW7-VAL-018 | Optional-image state | one approved field | wide | Inspection | Text still complete; field not UI | Not a screenshot | Notes | PW-10 | PW-10 |
| PW7-VAL-019 | H1 wrapping | Route A2 H1 | 320–1920 | Inspection | 1–3 typical lines | Not 5+ ragged | Notes | PW-11 | PW-11 |
| PW7-VAL-020 | Support wrapping | COPY-044 | 320–1920 | Inspection | Nearby H1 | Meaning intact | Notes | PW-11 | PW-11 |
| PW7-VAL-021 | Maturity visibility | Layer B | first view | Inspection | Both sentences | Not menu-only | Notes | PW-12 | PW-12 |
| PW7-VAL-022 | Qualifier retention | value/CS/Today/trust/access | 320 | Inspection | All required qualifiers | No stronger short claim | Notes | PW-12 | PW-12 |
| PW7-VAL-023 | Sign in hierarchy | header+access | all | Inspection | Utility, not Start | Existing-account | Notes | PW-12 | PW-12 |
| PW7-VAL-024 | Today comprehension | proof block | all | Planned read | Bounded example | Not public demo | Notes | later validation | after layout freeze |
| PW7-VAL-025 | CS qualifier | CS block | all | Planned read | Not LMS | Qualifier attached | Notes | later validation | after layout freeze |
| PW7-VAL-026 | Trust interpretation | trust block | all | Planned read | Named controls | Not certified | Notes | later validation | after layout freeze |
| PW7-VAL-027 | Honest-stop comprehension | access | all | Planned read | Read is enough | Not error/waitlist | Notes | later validation | after layout freeze |
| PW7-VAL-028 | Horizontal-overflow scan | all blocks | 320 | Inspection | No scroll | Compounds wrap | Notes | PW-12 | PW-12 |
| PW7-VAL-029 | Heading-order inspection | page | all | DOM review | One H1; logical h2 | Matches meaning | Notes | PW-8 | PW-8 |
| PW7-VAL-030 | Screen-reader order plan | later build | all | Planned SR | Matches visual | Qualifiers not skipped | Notes | PW-8 | PW-8 |
| PW7-VAL-031 | Authenticated-arrival state | desired `/` | n/a | Architecture review | Product-entry retained | Not marketing Home | Decision record | PW-13 | PW-13 |
| PW7-VAL-032 | Public-root fallback | current `/` | n/a | Source review | Still `/login` bounce | No premature `/` edit | Source note | PW-13 | PW-13 |

---

## 35. Open Questions

Settled PW-1–PW-6 product decisions are not restated as open. Question IDs are retained. Owner freeze does not close downstream technical, visual, accessibility, legal, or validation gates.

Reconciled totals: 23 questions retained. Resolved by owner: 13. Partially resolved by owner: 3. Open visual-design: 1. Open implementation: 2. Open technical: 2. Open validation: 0 as question IDs (validation remains `PW7-VAL-001`–`032`, `PLANNED — NOT EXECUTED`). HOLD / later screenshot authority: 1. Externally gated: 1.

| ID | Question | Why it matters | Options | Recommendation | Conservative default | Owner | Latest phase | Gate | Status | Controlling decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-Q-001 | Final responsive model | Sets the page grammar | MODEL-001/002/003 | MODEL-002 degrading to 001 | MODEL-001 | Product owner | PW7-OD-001 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-001 |
| PW7-Q-002 | Hero composition | Five-second meaning | HERO-001/002/003 | HERO-001; 002 only if field omits when empty | HERO-001 | Product owner | PW7-OD-002 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-002 |
| PW7-Q-003 | Optional visual role | Empty-panel risk | none / brand field / abstract (`PW5-VISUAL-001`) / screenshot | none required; screenshot HOLD | none | Design + owner | PW7-OD-013 | PW-10 | `PARTIALLY RESOLVED BY OWNER` — optional abstract remains `OPEN VISUAL-DESIGN` | PW7-OD-013 |
| PW7-Q-004 | Navigation collapse | Sign in vs labels | NAV-001/002/003/hybrid | Hybrid 001 then 002 | NAV-002 + persistent Inloggen | Product owner | PW7-OD-003 | Owner freeze | `PARTIALLY RESOLVED BY OWNER` — disclosure semantics remain `OPEN IMPLEMENTATION` | PW7-OD-003 |
| PW7-Q-005 | Sticky versus static header | Anchor coverage | static / sticky with offset | static | static | Product owner | PW7-OD-004 | PW-8 | `RESOLVED BY OWNER` | PW7-OD-004 |
| PW7-Q-006 | Closed-beta presentation | Scarcity vs fact | BETA-001–004 | BETA-003 | BETA-001 text row | Product owner | PW7-OD-005 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-005 |
| PW7-Q-007 | Value/mechanism columns | Module-card risk | editorial / deflist / 2-col / cards | editorial; optional 2-col | editorial 1-col | Product owner | PW7-OD-006 | Owner freeze | `RESOLVED BY OWNER` — column execution later-gated | PW7-OD-006 |
| PW7-Q-008 | Today proof treatment | Fake demo risk | PROOF-001/002/003 | PROOF-001 | PROOF-001 | Product owner | PW7-OD-007 | screenshot HOLD | `RESOLVED BY OWNER` — screenshot eligibility remains Q-020 | PW7-OD-007 |
| PW7-Q-009 | Course Seller treatment | Brand capture | CS-001–005 | CS-002 aside | quieter full-width text | Product owner | PW7-OD-008 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-008 |
| PW7-Q-010 | Trust layout | Certification risk | TRUST-001–005 | TRUST-001 + list | compact text | Product owner | PW7-OD-009 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-009 |
| PW7-Q-011 | Access layout | Error/CTA risk | ACCESS-001–005 | ACCESS-001 | compact panel | Product owner | PW7-OD-010 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-010 |
| PW7-Q-012 | Sign in repetition | Acquisition vs findability | header only / header+access / +footer | header+access | header+access; footer omit | Product owner | PW7-OD-011 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-011 |
| PW7-Q-013 | Page-length budget | Dump vs completeness | 6–10 visual sections | 8 | 8 | Product owner | PW7-OD-012 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-012 |
| PW7-Q-014 | Breakpoint policy | Framework lock-in | content-driven / named tokens | content-driven | content-driven | Technical + owner | PW7-OD-014 | PW-13 | `PARTIALLY RESOLVED BY OWNER` — exact CSS remains `OPEN IMPLEMENTATION` | PW7-OD-014 |
| PW7-Q-015 | Section-background alternation | Promo bands | none / quiet alternate | none or one quiet shift after proof | none | Visual design | PW-10 | PW-10 | `OPEN VISUAL-DESIGN` | none |
| PW7-Q-016 | Mobile menu current-section | Fake live IA | none / later when IDs exist | none until destinations exist | none | PW-13 | PW-13 | PW-13 | `OPEN IMPLEMENTATION` | none |
| PW7-Q-017 | Long-text policy | Localization | wrap always / owner short variants | wrap; no silent rewrite | wrap | Copy + localization | later | copy owner | `OPEN TECHNICAL` | none |
| PW7-Q-018 | Tablet-specific composition | Extra language | none / unique tablet | none; stack or desktop | none | Product owner | OD-001 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-001 |
| PW7-Q-019 | Footer repetition | Unique-truth risk | identity only / +status / +Sign in | identity only | identity only | Product owner | OD-011 | Owner freeze | `RESOLVED BY OWNER` | PW7-OD-011 |
| PW7-Q-020 | Later screenshot eligibility | Privacy/demo | remain HOLD / later review list | remain HOLD | HOLD | Privacy + owner | PW5-OD-006 | later authority | `HOLD — SCREENSHOT AUTHORITY REQUIRED` | PW7-OD-007 |
| PW7-Q-021 | Public-root dependency | `/` bounce | isolated public tree vs replace `/` | isolated preferred (`PW0-PB-036`) | do not edit `page.tsx` | PW-13 | PW-13 | PW-13 | `OPEN IMPLEMENTATION` | none |
| PW7-Q-022 | Shared CSS isolation | Home regression | new public CSS / reuse globals | new isolated public CSS | do not edit globals | PW-13 | PW-13 | PW-0 P1 | `OPEN TECHNICAL` | none |
| PW7-Q-023 | Legal-link future slots | Dead links | omit / later destinations | omit now | omit | Legal | external | external | `EXTERNALLY GATED` | none |

---

## 36. Owner Decision Register

Existing IDs `PW7-OD-001` through `PW7-OD-014` are retained without renumbering. Topics correspond in substance to the fourteen owner selections; wording is reconciled, not remapped.

| Status | Count |
| --- | ---: |
| Total | 14 |
| Fully resolved | 14 |
| Partially resolved | 0 |
| Open owner decisions | 0 |

Distinguish: `OWNER RESPONSIVE DECISION RESOLVED` from `TECHNICAL OR VALIDATION CONDITION UNRESOLVED`. A resolved owner layout decision does not close downstream implementation, visual-design, accessibility, or validation questions.

Establishment recommendations remain historical evidence. They were not owner decisions at establishment.

| ID | Topic | Options considered | Owner selection | Exact selected model or rule | Status | Rationale | Mandatory condition | Prohibited interpretation | Downstream owner | Downstream validation gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-OD-001 | Responsive layout model | MODEL-001 / MODEL-002 / MODEL-003 | MODEL-002 | `PW7-MODEL-002 — ASYMMETRIC PRODUCT NARRATIVE` with mandatory degradation to `PW7-MODEL-001` | `RESOLVED — OWNER FROZEN` | Modern product feel without requiring a visual | Text remains primary; degrade to MODEL-001 when no approved supporting field exists | Empty right-side panel; fake screenshot; feature-card or four-TG grid; MODEL-003 | Product + visual + PW-13 | PW-7-R1; PW-10; PW-12 |
| PW7-OD-002 | Hero layout | HERO-001 / HERO-002 / HERO-003 | HERO-001 | `PW7-HERO-001 — SINGLE-COLUMN TEXT-LED HERO` | `RESOLVED — OWNER FROZEN` | Complete default without imagery | Frozen H1/support; Layer B associated; hero works without image | Sign in as acquisition; Today before value; BOS; AI; Course Sellers in hero; HERO-003 | Product + visual | PW-7-R1; PW-11; later visual gate for HERO-002 |
| PW7-OD-003 | Mobile-navigation behaviour | NAV-001 / NAV-002 / NAV-003 / hybrid | NAV-001 while fit, then NAV-002; Inloggen outside disclosure | Adaptive fit-or-disclose; `Inloggen` independently visible where feasible | `RESOLVED — OWNER FROZEN` | Content-fit, not device names | Full nav when it genuinely fits; compact disclosure holds in-page roles; keyboard/AT later | Fake live anchors; hamburger selected now; NAV-003 as primary; maturity only inside menu | PW-8 / PW-13 | PW-8 menu semantics; PW-12 fit |
| PW7-OD-004 | Sticky versus static header | static / sticky with offset | Static header for the initial public foundation | Header in normal document flow | `RESOLVED — OWNER FROZEN` | Calmer first version; lower shared-surface and focus risk | Sign in findable; exploration not dependent on permanent header; access provides second Sign in | Sticky as default; footer as only fallback; leaving sticky vs static open | PW-8 | Later sticky only after separate decision + VAL-014 |
| PW7-OD-005 | Early closed-beta presentation | BETA-001–004 | BETA-003 | `PW7-BETA-003 — INLINE STATUS WITH ASSOCIATED UTILITY COPY` | `RESOLVED — OWNER FROZEN` | Both sentences early, without promo reading | Required Layer B copy; understandable without colour; access retains full no-new-account explanation | Badge-only; scarcity; launch promo; conversion banner; mobile omission of either sentence | Product + visual | PW-7-R1; VAL-021 |
| PW7-OD-006 | Value and mechanism layout | VALUE-001–005 | VALUE-001 | `PW7-VALUE-001 — CONTINUOUS EDITORIAL VALUE AND MECHANISM SECTION` | `RESOLVED — OWNER FROZEN` | One narrative; objects stay objects | Value before detailed proof; anti-replacement attached; stack in source order below content-fit | Feature cards; module tiles; implied complete modules | Product + PW-11 | PW-7-R1; VAL-022; column execution later-gated |
| PW7-OD-007 | Today proof layout | PROOF-001 / 002 / 003 / empty placeholder | PROOF-001 | `PW7-PROOF-001 — TEXT-ONLY BOUNDED PROOF` | `RESOLVED — OWNER FROZEN` | Bounded example without recreating Home | Heading `Today als voorbeeld in het product`; qualifier associated; complete without imagery | Public demo; complete product; AI-ranked; fake data; Home recreation; PROOF-003 without authority | Privacy + PW-10 | HOLD for screenshots; VAL-024 |
| PW7-OD-008 | Course Seller layout | CS-001–005 | CS-002 | `PW7-CS-002 — EDITORIAL ASIDE` | `RESOLVED — OWNER FROZEN` | Secondary relevance, not a product edition | After value and Today; qualifier attached; one intact mobile unit | Separate CTA; LMS/catalogue/learner imagery; four-TG card; brand-primary CS | Product + visual | PW-7-R1; VAL-025 |
| PW7-OD-009 | Trust layout | TRUST-001–005 | TRUST-001 | `PW7-TRUST-001 — COMPACT TEXT WITH A SHORT SEMANTIC LIST` | `RESOLVED — OWNER FROZEN` | Named controls only | Understandable without icons; mobile order matches visible order | Certification wall; SOC 2; ISO; AVG/GDPR conclusion; uptime; encryption; “secure platform” | Legal (external) + layout | VAL-026; legal claims externally gated |
| PW7-OD-010 | Access and honest-stop layout | ACCESS-001–005 | ACCESS-001 | `PW7-ACCESS-001 — COMPACT ACCESS PANEL` | `RESOLVED — OWNER FROZEN` | Calm closing truth, not conversion | Mobile order status → Sign in → no-account outcome; Inloggen for existing accounts | Giant CTA; error; disabled form; waitlist; request-access/contact/demo/signup | PW-13 destinations | VAL-027; destination implementation later-gated |
| PW7-OD-011 | Sign in repetition | header only / header+access / +footer | Header and access | `INLOGGEN IN HEADER AND ACCESS SECTION` | `RESOLVED — OWNER FROZEN` | Findable utility without acquisition pressure | One header utility; one access utility; footer omit by default | Sign in in CS or Today; Start/Join/Register/Explore/View product; footer default repeat | PW-8 / PW-9 | VAL-023; footer repeat only after usability evidence |
| PW7-OD-012 | Page-length and density budget | DENS-001–008 | Controlled eight-cluster single-page budget | Eight visual clusters; ≤2 columns; 0 product-card grids | `RESOLVED — OWNER FROZEN` | Completeness without a dump | Eight-cluster map; 60–72 character measure where practical; two Sign in placements | Unbounded sections; four-TG grids; required screenshots; repeated hero CTA bands | PW-9–12 | PW-12 density validation |
| PW7-OD-013 | Optional visual policy | none / field / abstract / screenshot | Text-first; no required homepage image | `TEXT-FIRST — NO REQUIRED HOMEPAGE IMAGE` | `RESOLVED — OWNER FROZEN` | Page complete without imagery | Omit empty space; no fake dashboard; no AI/chatbot/robot imagery; no four-TG illustrations | Required screenshot; reserved empty panel; motion as meaning | Visual design (PW-10) | VAL-017/018; optional abstract later-gated |
| PW7-OD-014 | Responsive breakpoint policy | content-driven vs framework names | Content-driven reflow thresholds | `CONTENT-DRIVEN REFLOW THRESHOLDS` | `RESOLVED — OWNER FROZEN` | Fit from content, not device labels | 320 px and 200% zoom required; nav changes on fit; no frozen `sm`/`md`/`lg` | Device-name primary policy; treating 640–768 or 1024 as implemented CSS tokens | PW-13 | PW-12/13 measurement from rendered content |

Historical establishment recommendation column is preserved in §10–27 recommendation rows and in §40. Upstream PW-6 copy decisions remain frozen and are not reopened here.

---

## 37. Downstream Handoffs

Governed roadmap in PW-5/PW-6: PW-7-R1 independent responsive-requirements review; PW-8 accessibility; PW-9 wireframes/content assembly; PW-10/11 visual design; PW-12 fidelity; PW-13/14 routes and indexation. PW-7 follows that map. No implementation phase may infer permission to edit authenticated Home.

### PW-7-R1

Completed in this file (§42). Independently reviewed the fourteen frozen owner decisions, model consistency, current-versus-desired truth, accessibility handoff, risk classification, traceability, and identifier census. Did not reverse owner selections. Remaining technical, visual, implementation, and validation gates pass to PW-8 and later phases.

### PW-8

Not started. Later receives: responsive accessibility requirements (`PW7-A11Y-*`); mobile-menu semantics; focus expectations; anchor expectations; qualifier-retention requirements. Does not receive an implementation PASS or permission to restyle authenticated Home.

### PW-9

Receives: owner-frozen layout model; frozen block order; responsive content rules; Route A2 copy references. No authority to broaden copy or invent CTAs to fill a wireframe.

### PW-10 and PW-11

Receive: shell roles; section hierarchy; density budgets; visual-dependency classifications; later-gated optional abstract visual. No permission to alter product truth or rewrite frozen copy to fit a visual.

### PW-12

Receives: viewport matrix; block acceptance criteria; state matrix; validation requirements. Does not receive fabricated test results.

### PW-13

Receives: desired layout requirements; shared-boundary risks (`PW7-RSK-029/030`); in-page destination requirements. No permission to reopen authenticated Home or treat Root Model A as already implemented.

### PW-14

Receives: responsive evidence requirements; metadata/indexation dependencies from PW-6; unresolved legal dependencies. No assumed pass.

---

## 38. Acceptance Gate

Historical establishment used AND-logic while owner decisions remained open, producing `CONDITIONAL — PW-7 OWNER RESPONSIVE-LAYOUT DECISIONS REQUIRED`. That result is retained as historical evidence in §2, §39 history, and §40.

PW7-OD used strict AND logic. Historical owner-freeze result retained:

```text
PASS — PW7-OD OWNER RESPONSIVE LAYOUT DECISIONS FROZEN
```

PW-7-R1 uses independent AND logic. Current result:

```text
PASS — PW-7-R1 INDEPENDENT RESPONSIVE REQUIREMENTS REVIEW CLOSED WITH EVIDENCE
```

Conditions held:

- preflight matched;
- only the PW-7 document changed;
- all binding authorities were reviewed;
- PW-1 remains the truth ceiling;
- authenticated Home remains closed;
- current route truth remains accurate;
- Route A2 copy remains unchanged;
- all fourteen owner decisions exist;
- all fourteen owner decisions are fully resolved;
- Model 002 is selected with Model 001 fallback;
- Hero 001 is the complete default;
- empty supporting fields are prohibited;
- adaptive navigation behaviour is frozen;
- Sign in remains outside disclosure where feasible;
- static header is frozen for the initial foundation;
- Beta 003 is frozen;
- Value 001 is frozen;
- Proof 001 is frozen;
- screenshot proof remains HOLD;
- CS 002 is frozen;
- Trust 001 is frozen;
- Access 001 is frozen;
- Sign in is limited to header and access by default;
- the eight-cluster budget is frozen;
- text-first visual policy is frozen;
- responsive thresholds remain content-driven;
- AI remains inactive by default;
- legal/footer links remain externally gated;
- present P0 findings are zero;
- present P1 findings are zero;
- risk scenarios are not misreported as deferred P1 defects;
- open questions are reconciled;
- all identifiers reconcile;
- all upstream references validate;
- no implementation is claimed;
- no accessibility PASS is claimed;
- no browser or device test is fabricated;
- file integrity passes;
- nothing is staged, committed, pushed, or deployed;
- PW-8 is not started.

R1 additionally held: authorities independently reviewed; desired behaviour not presented as implemented; no owner decision silently reversed; Model 002 compatible with Hero 001; Model 001 remains a clean fallback; static header coherent with adaptive navigation; accessibility handoff sufficient; state matrix distinguishes current and desired behaviour; block acceptance uses AND logic; current P0/P1 after correction are zero; all P2 items have an owner and gate; open-question counts reconcile; upstream citations exist and are valid.

Not used: `PW-7 CLOSED WITH EVIDENCE`; `RESPONSIVE IMPLEMENTATION PASSED`; `ACCESSIBILITY PASSED`; `PUBLICATION READY`; `IMPLEMENTATION READY`.

---

## 39. Final Status

Historical establishment status retained:

```text
PW-7 RESPONSIVE REQUIREMENTS ESTABLISHED — AWAITING OWNER DECISIONS
```

Owner-freeze status retained:

```text
PW-7 READY FOR INDEPENDENT RESPONSIVE REQUIREMENTS REVIEW
```

```text
PASS — PW7-OD OWNER RESPONSIVE LAYOUT DECISIONS FROZEN
```

Current status after independent review:

```text
PW-7 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

```text
PASS — PW-7-R1 INDEPENDENT RESPONSIVE REQUIREMENTS REVIEW CLOSED WITH EVIDENCE
```

```text
OWNER RESPONSIVE FREEZE ≠ VISUAL DESIGN FREEZE ≠ IMPLEMENTATION READY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY
```

PW-7-R1 completed in §42. PW-8 not started. This file is not staged, committed, pushed, or deployed. Authenticated Home remains closed. Frozen Route A2 copy is unchanged. Selected layout is not live. Final verification remains a separate authorization.

---

## 40. Evidence Appendix

### 40.1 Preflight

Root `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1`. Branch `core/platform-readiness-20260707`. HEAD and upstream `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`. Ahead/behind `0 0`. Staged none. Tracked none. Untracked none. Worktree clean. No project `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules`. PW-0 through PW-6 present. PW-6 closed at `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`. No prior PW-7 file.

### 40.2 Source inspection

Read-only: B1-GATE.1; PW-0–PW-6; `src/app/page.tsx`; `src/app/layout.tsx`; `src/app/globals.css`; `src/middleware.ts`; `src/app/login/page.tsx`; login CSS; authenticated Home entry path confirmed closed.

### 40.3 Identifier census (expected)

MODEL 3; SHELL 12; VIEW 10; PRI 13; NAV 7; HERO 5; BETA 5; VALUE 5; PROOF 4; CS 5; AI 3; TRUST 5; ACCESS 5; FOOT 4; DENS 8; REDUCE 14; VISUAL 13; A11Y 20; STATE 18; ACC 13; MAP 16; RSK 36; VAL 32; Q 23; OD 14.

### 40.4 Distinctions retained

`CANDIDATE COPY ≠ APPROVED COPY ≠ IMPLEMENTED COPY ≠ PUBLICATION-READY COPY`

`OWNER COPY FREEZE ≠ IMPLEMENTATION READY ≠ PUBLICATION READY ≠ DEPLOYMENT AUTHORITY`

`PW-7 LAYOUT AUTHORITY ≠ VISUAL DESIGN FREEZE ≠ IMPLEMENTATION AUTHORITY ≠ PUBLICATION AUTHORITY`

End of PW-7 establishment file.

---

## 41. PW7-OD Owner Responsive Layout Decision Evidence

Establishment evidence in §40 remains historical. This section records the 2026-09-16 owner freeze.

### 41.1 Decision authority

`EXPLICIT ZYNTIXAI OWNER RESPONSIVE LAYOUT DECISION`

### 41.2 Decision date

`2026-09-16`

### 41.3 Baseline HEAD

`b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`

### 41.4 Scope

Responsive content and layout requirements for the future public homepage. Source: explicit owner approval of the professional recommendation following PW-7 establishment.

This authority freezes layout direction, responsive content behaviour, navigation behaviour requirements, section-composition requirements, visual-dependency policy, responsive content budgets, and validation targets.

### 41.5 Non-authority statement

This authority does not freeze colours, typography, exact spacing tokens, border radii, shadows, gradients, illustrations, images, final visual composition, component implementation, CSS breakpoints, route implementation, metadata implementation, public-root implementation, publication, or deployment.

This authority is not visitor research, browser evidence, device evidence, accessibility-test evidence, legal approval, Production evidence, or technical implementation proof.

```text
OWNER RESPONSIVE FREEZE ≠ VISUAL DESIGN FREEZE ≠ IMPLEMENTATION READY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY
```

Selected layout is not live. Current route truth remains: unauthenticated `/` redirects to `/login`; authenticated `/` uses membership/onboarding-aware entry; `/home` remains protected; no public homepage currently exists; Root Model A remains desired IA, not implemented behaviour.

### 41.6 Complete fourteen-decision table

See §36. Result: total 14; fully resolved 14; partially resolved 0; open owner decisions 0. IDs `PW7-OD-001`–`014` retained without remapping.

### 41.7 Responsive-model selection

`PW7-MODEL-002 — ASYMMETRIC PRODUCT NARRATIVE`. Fallback: `PW7-MODEL-001 — TEXT-LED EDITORIAL SPINE` whenever no approved supporting field exists. `PW7-MODEL-003` remains rejected. Label: `OWNER FROZEN RESPONSIVE MODEL — DOWNSTREAM VISUAL AND IMPLEMENTATION REVIEW REQUIRED`.

### 41.8 Hero selection

`PW7-HERO-001 — SINGLE-COLUMN TEXT-LED HERO` is the complete default. `PW7-HERO-002` later-gated when an approved supporting field exists, contains meaning, disappears when empty, stays text-first, and does not imply access or completeness. `PW7-HERO-003` blocked. Label: `OWNER FROZEN HERO DEFAULT — CONDITIONAL SUPPORTING FIELD LATER-GATED`.

### 41.9 Navigation selection

Use `PW7-NAV-001` while identity and labels fit; switch to `PW7-NAV-002` when they no longer fit; keep `Inloggen` visible outside the disclosure where feasible. `PW7-NAV-003` is not the primary selected model. Conservative fallback: compact disclosure plus independently visible `Inloggen`. No hamburger is selected or implemented in this phase. Label: `OWNER FROZEN NAVIGATION BEHAVIOUR — INTERACTION IMPLEMENTATION LATER-GATED`.

### 41.10 Static-header selection

`STATIC HEADER FOR THE INITIAL PUBLIC FOUNDATION`. Header participates in normal document flow. Sticky versus static is not left open. Later sticky requires a separate governed decision plus anchor-offset, focus, zoom, reduced-motion, and mobile review.

### 41.11 Maturity-layer selection

`PW7-BETA-003 — INLINE STATUS WITH ASSOCIATED UTILITY COPY`. Required visible copy: `ZyntixAI is nu in gesloten bèta.` and `Inloggen is voor bestaande accounts.` Label: `OWNER FROZEN MATURITY-LAYER LAYOUT — VISUAL STYLING LATER-GATED`.

### 41.12 Value/mechanism selection

`PW7-VALUE-001 — CONTINUOUS EDITORIAL VALUE AND MECHANISM SECTION`. Label: `OWNER FROZEN EDITORIAL VALUE LAYOUT — COLUMN EXECUTION LATER-GATED`.

### 41.13 Today-proof selection

`PW7-PROOF-001 — TEXT-ONLY BOUNDED PROOF`. Heading remains `Today als voorbeeld in het product`. `PW7-PROOF-003` remains `HOLD — SCREENSHOT AUTHORITY REQUIRED`.

### 41.14 Course Seller selection

`PW7-CS-002 — EDITORIAL ASIDE`. Label: `OWNER FROZEN SECONDARY RELEVANCE LAYOUT — NOT BRAND-PRIMARY`.

### 41.15 Trust selection

`PW7-TRUST-001 — COMPACT TEXT WITH A SHORT SEMANTIC LIST`. Label: `OWNER FROZEN NAMED-CONTROL TRUST LAYOUT — LEGAL CLAIMS EXTERNALLY GATED`.

### 41.16 Access selection

`PW7-ACCESS-001 — COMPACT ACCESS PANEL`. Mobile order: status; existing-account Sign in; no-account informational outcome. Label: `OWNER FROZEN ACCESS-LAYOUT MODEL — DESTINATION IMPLEMENTATION LATER-GATED`.

### 41.17 Sign in repetition

`INLOGGEN IN HEADER AND ACCESS SECTION`. Footer omit by default. No Sign in in Course Seller or Today proof. No Start/Join/Register/Explore/View product labelling.

### 41.18 Density budget

`CONTROLLED EIGHT-CLUSTER SINGLE-PAGE BUDGET`. Clusters: header; hero plus early closed beta; value plus mechanism; Today proof; Course Seller editorial aside; trust; access and honest stop; footer. Label: `OWNER FROZEN LAYOUT BUDGET — IMPLEMENTATION VALIDATION REQUIRED`.

### 41.19 Visual policy

`TEXT-FIRST — NO REQUIRED HOMEPAGE IMAGE`. Label: `OWNER FROZEN TEXT-FIRST VISUAL POLICY — OPTIONAL ABSTRACT VISUAL LATER-GATED`.

### 41.20 Responsive threshold policy

`CONTENT-DRIVEN REFLOW THRESHOLDS`. Label: `OWNER FROZEN RESPONSIVE POLICY — EXACT CSS THRESHOLDS NOT YET IMPLEMENTED`. Proposed 640–768 px and ~1024 px ranges remain proposed, not implemented tokens.

### 41.21 AI conditional status

`CONDITIONAL LAYOUT — INACTIVE BY DEFAULT`. Not a separate open owner decision. If later activated: short adjacent text; never the hero; not a standalone major section; no AI imagery; removable without breaking layout. Not marked active.

### 41.22 Footer result

Confirmed through layout and Sign-in decisions. Default contents: `ZyntixAI` identity. Default omissions: Sign in repetition; beta repetition; legal links without destinations; privacy; terms; contact; social; pricing; careers; blog; status; documentation; invented company details. Legal slots: `EXTERNALLY GATED`. No additional `PW7-OD-*` created.

### 41.23 Risk-classification correction

Present findings: P0 none; P1 none. Risk scenarios use CRITICAL / HIGH / MEDIUM / LOW. They are not current open P1 defects. Historical establishment sentence that P1 items are later-gated is withdrawn as ambiguous.

Rule: `P0/P1 DEFECTS MUST BE CLOSED BEFORE PHASE PASS; HIGH-SEVERITY FUTURE RISKS MAY REMAIN OPEN WITH A NAMED PREVENTIVE GATE`

Protections unchanged: qualifier loss, Sign in as acquisition, shared CSS affecting Home, Root Model A treated as implemented, and screenshots implying public access remain prevented.

### 41.24 Open-question reconciliation

See §35. Totals: 23 retained. Resolved by owner 13. Partially resolved by owner 3. Open visual-design 1. Open implementation 2. Open technical 2. Open validation 0 as question IDs. HOLD / later screenshot authority 1. Externally gated 1.

### 41.25 Decision-count reconciliation

| Status | Count |
| --- | ---: |
| Total | 14 |
| Fully resolved | 14 |
| Partially resolved | 0 |
| Open owner decisions | 0 |

### 41.26 Remaining downstream gates

Technical or validation conditions remain unresolved: exact visual styling; exact CSS thresholds; mobile-menu component behaviour; precise anchor implementation; optional abstract visual design; screenshot eligibility; shared CSS isolation; legal links; public-root implementation; browser and assistive-technology validation. Accessibility requirements remain downstream implementation, PW-8 handoff, and validation requirements. No WCAG, accessibility, keyboard, or screen-reader PASS is claimed.

### 41.27 Acceptance-gate result

```text
PASS — PW7-OD OWNER RESPONSIVE LAYOUT DECISIONS FROZEN
```

### 41.28 Scope confirmation

Only `docs/phases/PW-7-responsive-content-layout-requirements.md` changed. No product code, routes, middleware, authentication, sessions, landing resolvers, shared CSS, root layout, metadata, assets, configuration, dependencies, tests, authenticated Home, or closed PW-6 document changed. PW-7-R1 not started. PW-8 not started. Nothing staged, committed, pushed, or deployed.

### 41.29 Git and file-integrity evidence

Expected at freeze: branch `core/platform-readiness-20260707`; HEAD and upstream `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`; ahead/behind `0 0`; staged none; tracked modifications none; untracked exactly this PW-7 file. File-integrity, identifier census, and upstream-reference validation are reported in the PW7-OD freeze report, not claimed as browser or device tests.

---

## 42. PW-7-R1 Independent Responsive Requirements Review Evidence

Establishment evidence (§40) and owner-freeze evidence (§41) remain historical. This section does not rewrite those records. R1 did not exist at establishment or owner freeze.

### 42.1 Review authority

Independent PW-7-R1 review of the complete responsive-requirements authority, including fourteen owner-frozen decisions. Reviewer does not assume establishment PASS or owner freeze is correct merely because those labels exist.

### 42.2 Independence statement

Prior PASS statements were treated as hypotheses. No viewport test, browser observation, screenshot, device test, usability session, keyboard test, screen-reader test, zoom test, performance result, legal review, or visitor validation was fabricated. Owner selections were not replaced with stylistic preference.

### 42.3 Preflight

Root `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1`. Branch `core/platform-readiness-20260707`. HEAD and upstream `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`. Ahead/behind `0 0`. Staged none. Tracked none. Untracked exactly this PW-7 file. No project `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules`. PW-0 through PW-6 present. PW-6 closed at `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`. PW-7 contained establishment evidence, fourteen `PW7-OD-*` records, owner-freeze evidence, and status ready for independent review. No PW-7-R1 section existed. No PW-8 document existed.

### 42.4 Authority review

Read: B1-GATE.1; PW-0 through PW-6; this PW-7 file. Inspected read-only: `src/app/page.tsx`; `src/app/layout.tsx`; `src/middleware.ts`; `src/app/login/page.tsx`; `src/features/auth/ui/login-form.tsx`; `src/app/globals.css`; `src/app/(authenticated)/home/page.tsx`; `src/components/app-shell.tsx`. PW-1 remains the public-truth ceiling. An owner layout decision may not override product truth, accessibility truth, or a protected boundary.

### 42.5 Protected-boundary review

PW-7 does not authorize edits to `/home`, Today behaviour, AppShell, authenticated layouts, root route, middleware, authentication, sessions, landing resolvers, `/login`, `/register`, invite or recovery flows, `globals.css`, root metadata, browser chrome, tests, configuration, or dependencies. Authenticated Home remains closed at `49cd5773976143139a154f9b8ddf36535a4dd914`. Production product-code authority remains `d110b6e3da5c690b31a68a0b145b7b6521c10828`.

### 42.6 Current architecture review

Observed: unauthenticated `/` redirects to `/login`; authenticated `/` uses membership/onboarding-aware entry; `/home` is the authenticated Daily Operating surface inside AppShell; English login H1 is `Sign in`; root layout is `lang="en"` with title `ZyntixAI` and `globals.css`; no public marketing homepage exists. Root Model A remains desired IA (`PW4-OD-001`), not implemented behaviour. Desired responsive behaviour is not described as live.

### 42.7 Owner-decision integrity

| Status | Count |
| --- | ---: |
| Total | 14 |
| Fully resolved | 14 |
| Partially resolved | 0 |
| Open owner decisions | 0 |

Verified selections unchanged: MODEL-002 with MODEL-001 fallback; HERO-001 default; NAV-001 then NAV-002 with `Inloggen` outside disclosure; static header; BETA-003; VALUE-001; PROOF-001; CS-002; TRUST-001; ACCESS-001; Sign in header and access not footer; eight-cluster budget; text-first visual policy; content-driven thresholds. No owner decision was silently reversed.

### 42.8 Responsive-model review

Independent comparison (requirements review, not a test result):

| Criterion | MODEL-001 | MODEL-002 | MODEL-003 |
| --- | --- | --- | --- |
| Visitor comprehension | High | High if field omits when empty | Weakened qualifiers |
| Truth safety | Highest | High with no-empty-field rule | Low |
| Mobile continuity | Highest | High if field stacks or omits | Catalogue wrap |
| No-image completeness | Complete | Complete only if field omitted | Implies tiles |
| Accessibility potential | Highest | High if DOM stays text-first | Card order risk |
| Implementation risk | Lowest | Medium (optional field) | High |
| Shared-surface risk | Isolation still required | Isolation still required | Isolation still required |
| Premium product feel | Medium unless type is later strong | High if not empty | Generic template |
| Generic-template risk | Document-like | Low if no fake UI | High |
| Content-density risk | Low | Low if eight clusters held | High |

MODEL-002 remains credible and text-led. It does not require imagery or empty space. Default execution without an approved field is MODEL-001 behaviour; MODEL-001 is therefore a genuine fallback, not a second competing direction. MODEL-003 remains rejected (`PW1-PRH-003`; omitted TGs; `PW6-BAN`). Hero 001 is compatible with Model 002 because the complete default hero is a single text column and any later supporting field must disappear when empty.

### 42.9 Page-shell review

`PW7-SHELL-001`–`012` distinguish canvas and reading spine. `page-max` ~72rem, `reading-max` ~40rem / 60–72 characters, mobile gutter ~1rem, desktop gutter ~2rem remain `PROPOSED` content constraints, not CSS tokens. 320 px gutters, 1920 px cap, 200% zoom reflow, safe-area, start-aligned text, long Dutch words, and prohibition of horizontal overflow are present. Isolated public CSS remains later preferred (`PW0-RQ-005`).

### 42.10 Viewport/reflow review

`PW7-VIEW-001`–`010` cover 320, 360, 390, 430, 768, 1024, 1280, 1440, 1920 px and 200% zoom. Terminology in §31 distinguishes validation viewport, content reflow, navigation-mode change, and layout-column change. Approximate 640–768 px and ~1024 px ranges remain proposed. R1 corrected VIEW-001 so 320 px does not authorize NAV-003-only chrome, and relabelled phone aliases so they are not device-name design authority.

### 42.11 Content-priority review

`LAYOUT-P0`–`P3` remain distinct from defect severity. Material identity, hero, Layer B, Sign in qualification, no-new-account, Today limitation, Course Seller non-LMS qualifier, honest stop, and conditional AI if activated cannot become tooltip-only, hover-only, colour-only, icon-only, desktop-only, or default-closed accordion content. R1 corrected PRI-010 so ACCESS-009 qualifier shortening cannot remove the required access `Inloggen` control.

### 42.12 Navigation review

Static header plus adaptive NAV-001/002 plus independently visible `Inloggen` plus later access Sign in are coherent for the eight-cluster page. After scroll, on-page headings and the access utility compensate; exploration does not depend on a sticky bar. PW-8 receives disclosure name, expanded/collapsed state, Escape, focus restore, focus containment, and no-JavaScript fallback. “Where feasible” now has a wrap-order fallback that keeps `Inloggen` outside the disclosure. No hamburger is selected.

### 42.13 Hero review

HERO-001 is complete without imagery. Frozen H1 and support are quoted unchanged. Layer B stays associated. Sign in stays utility. Today, Course Sellers, AI, and BOS stay out of the hero. HERO-002 must omit when empty. HERO-003 remains blocked. Line targets in HERO-004 are fit targets: if copy does not fit, the layout adapts; copy is not truncated or rewritten.

### 42.14 Maturity-layer review

Both frozen sentences remain required. Status is not badge-only or colour-only. First-viewport presence is a validation target subject to wrap and zoom, not an impossible guarantee. Mobile may not omit the existing-account qualification. Access retains the full no-new-account explanation.

### 42.15 Value/mechanism review

VALUE-001 remains one editorial narrative. Objects are not feature cards. Anti-replacement stays attached. Optional two-column arrangement may not reorder meaning; mobile stacks in source order. Compatible with MODEL-002 because value stays editorial while overall asymmetry is limited to an optional later hero field.

### 42.16 Today-proof review

PROOF-001 text-only is the authoritative default. Heading remains `Today als voorbeeld in het product`. Qualifier stays adjacent. Not a public demo, not the entire product, not AI-ranked, not a Home recreation, no fake data, no empty screenshot placeholder. PROOF-003 remains HOLD.

### 42.17 Course Seller review

CS-002 editorial aside follows value and Today, stays in the main flow, secondary weight, qualifier attached, no CTA, no four-target-group comparison, stacks intact. Visual styling must not reduce qualifier prominence below the capability statement.

### 42.18 Trust review

TRUST-001 plus a short semantic list describes named controls only. TRUST-004 card grid remains rejected, so the list is not a product-card grid. Icons optional and non-semantic. `PW6-TRUST-009` remains governance-only.

### 42.19 Access review

ACCESS-001 is a closing informational panel, not a hero CTA, conversion banner, error, disabled form, or waitlist. Mobile order: status; existing-account Sign in; no-account outcome. Sign in may not look like open product entry.

### 42.20 Sign in/footer review

Two placements only by default: header and access. None in footer, Today, Course Seller, trust, or hero-as-acquisition. Footer identity `ZyntixAI` is complete enough. Footer is not the only place for maturity, access, honest stop, or identity. Legal slots remain `EXTERNALLY GATED`.

### 42.21 Density review

Eight clusters match PW-4/PW-5/PW-6 composition order. Conditional AI remains adjacent text, not a ninth major section. Budgets (two columns, zero product-card grids, zero required screenshots, two Sign in placements, one high-emphasis maturity treatment, 60–72 character measure) are requirements and proposed constraints, not browser-tested results. Mobile scroll length remains planned validation.

### 42.22 Visual-dependency review

No image is required. At most one later abstract visual. Empty space must not be reserved. Motion is not required for meaning. Screenshots, fake dashboards, chatbot/AI imagery, and four-target-group illustration sets remain prohibited or HOLD.

### 42.23 Responsive-accessibility review

`PW7-A11Y-001`–`020` are requirements, not results. No WCAG, accessibility, keyboard, or screen-reader PASS is claimed. PW-8 receives landmarks, one H1, heading order, DOM/focus order, skip link, disclosure semantics, Escape, focus restoration and containment, visible focus, touch-target caution, 320 px reflow, 200% zoom and text-resize, reduced motion, text status, qualifier preservation, duplicate-link purpose, and alt-text ownership.

### 42.24 State-matrix review

`PW7-STATE-001`–`018` cover the required visitor and technical states. Current versus desired is explicit for public root, authenticated arrival, and login session messaging. No desired state is described as live Production behaviour. R1 replaced the no-image fallback “Model A behaviour” with `PW7-MODEL-001` so Root Model A is not implied.

### 42.25 Block-acceptance review

`PW7-ACC-001`–`013` cover header, navigation, hero, early beta, value, mechanism, Today, Course Seller, conditional AI, trust, access, Sign in, and footer. AND logic is stated. Passing at one desktop width is not enough.

### 42.26 Risk-governance review

Present defects after R1 correction: P0 none; P1 none. Future risks use CRITICAL / HIGH / MEDIUM. The withdrawn “P1 items are later-gated” sentence is not restored. The named-gate rule is present. `PW7-RSK-001`–`036` retain prevention, detection, owner, and gate. No risk is labelled resolved without evidence. RSK-008 gate no longer says “OD freeze”.

### 42.27 Validation-plan review

`PW7-VAL-001`–`032` remain `PLANNED — NOT EXECUTED`. Thresholds remain `PROPOSED — NOT ACHIEVED`. Coverage includes the required widths, zoom, keyboard, disclosure, anchors, reduced motion, long text, image states, wrapping, maturity, qualifiers, Sign in hierarchy, Today/CS/trust/stop comprehension, overflow, heading order, screen-reader plan, authenticated arrival, and public-root fallback. No results were invented.

### 42.28 Open-question review

Independent recount: resolved by owner 13; partially resolved 3; open visual-design 1; open implementation 2; open technical 2; open validation as Q records 0; HOLD / screenshot 1; externally gated 1; total 23. Owner-resolved questions are not presented as open choices. Screenshot remains HOLD. Legal remains externally gated.

### 42.29 Traceability review

`PW0-PB-034`, `PW0-PB-036`, and `PW0-RQ-005` exist and are used as uncertainty, isolation preference, and greenfield CSS caution — not as implemented host or public-root proof. R1 removed the invalid `PW5-OD-006` citation from the mechanism map. Remaining citations support the responsive use; HOLD/PROHIBIT records constrain rather than authorize. Frozen PW-6 copy is quoted, not rewritten.

| Authority | Unique references | Missing | Invalid use | Result |
| --- | ---: | ---: | ---: | --- |
| PW-0 | 3 | 0 | 0 | PASS |
| PW-1 | 27 | 0 | 0 | PASS |
| PW-2 | 10 | 0 | 0 | PASS |
| PW-3 | 15 | 0 | 0 | PASS |
| PW-4 | 26 | 0 | 0 | PASS |
| PW-5 | 44 | 0 | 0 | PASS |
| PW-6 | 50 | 0 | 0 | PASS |

`PW5-OD-006` remains validly cited for visual policy (`PW7-REDUCE-012`, `PW7-Q-020`) and is no longer used to authorize mechanism layout.

### 42.30 Identifier census

Master families remain: MODEL 3; SHELL 12; VIEW 10; PRI 13; NAV 7; HERO 5; BETA 5; VALUE 5; PROOF 4; CS 5; AI 3; TRUST 5; ACCESS 5; FOOT 4; DENS 8; REDUCE 14; VISUAL 13; A11Y 20; STATE 18; ACC 13; MAP 16; RSK 36; VAL 32; Q 23; OD 14. New family: `PW7-R1-FND` 16. Continuity from 001. No duplicate masters.

### 42.31 R1 findings

| ID | Sev. | Section | Evidence | Impact | Correction authority | Action | Remaining gate | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW7-R1-FND-001 | P1 | §6 | `PROPOSED` still meant “awaiting owner freeze” after OD freeze | Stale active status | R1 clerical | Redefined `PROPOSED` as constraint/historical, not an open owner choice | none | CORRECTED |
| PW7-R1-FND-002 | P1 | §14 / §26 | PRI-010 and REDUCE-010 allowed omitting ACCESS-009 Sign in | Contradicted `PW7-OD-011` | R1 clerical | Qualifier may shorten; access `Inloggen` control remains | VAL-023 | CORRECTED |
| PW7-R1-FND-003 | P1 | §29 | STATE-011 fallback “Model A behaviour” | Could be read as Root Model A implemented | R1 clerical | Fallback is `PW7-MODEL-001` | PW-10 | CORRECTED |
| PW7-R1-FND-004 | P1 | §32 | MAP-005 cited `PW5-OD-006` for mechanism | Invalid use of visual-policy ID | R1 clerical | Citation removed; `PW5-BLK-005` remains | none | CORRECTED |
| PW7-R1-FND-005 | P1 | §13 | VIEW-001 allowed “identity+Sign in” without disclosure | Could authorize NAV-003 at 320 px | R1 clerical | 320 px is disclosure plus independent `Inloggen` | VAL-013 | CORRECTED |
| PW7-R1-FND-006 | P1 | §15–23 | `OWNER DECISION REQUIRED` fences still looked active | Stale active recommendation | R1 clerical | Prefixed historical establishment | none | CORRECTED |
| PW7-R1-FND-007 | P2 | §15 | 320 px `Inloggen` outside disclosure is specified, not tested | Collision remains an implementation risk | Wrap-order fallback recorded | PW-8 / PW-12 | VAL-013 | OPEN |
| PW7-R1-FND-008 | P2 | §15 | Static header after scroll is specified, not tested | Utility discoverability | Access Sign in + on-page headings | PW-12 | VAL-023 | OPEN |
| PW7-R1-FND-009 | P2 | §18 | Optional two-column value pairing untested | Meaning-order risk | Source-order stack required | PW-11 / PW-12 | VAL-022 | OPEN |
| PW7-R1-FND-010 | P2 | §19 | Screenshot proof remains HOLD | No public product capture | Keep HOLD | Privacy + PW-10 | Q-020 | OPEN |
| PW7-R1-FND-011 | P2 | §7 / Q-022 | Shared CSS isolation unbuilt | Home regression if globals edited | Do not edit `globals.css` | PW-13 | PW-0 P1 | OPEN |
| PW7-R1-FND-012 | P2 | §13 | Exact CSS thresholds not derived | Premature tokens | Content-driven policy frozen | PW-13 | VAL-001–011 | OPEN |
| PW7-R1-FND-013 | P2 | §11 | Heading still said Recommended Working Model | Historical/current mix | Renamed Selected Working Model | none | CORRECTED |
| PW7-R1-FND-014 | P2 | §28 | Focus containment and text-resize were implicit | Incomplete PW-8 handoff | Expanded A11Y-010/012 | PW-8 | CORRECTED |
| PW7-R1-FND-015 | P2 | §33 | RSK-008 gate still “OD freeze” | Stale gate after freeze | Gate PW-10 / PW-12 | PW-12 | CORRECTED |
| PW7-R1-FND-016 | P2 | §26 | REDUCE-013 cited VAL-032 analog | Wrong validation pointer | Now STATE-017 | none | CORRECTED |

Present R1 defects remaining: P0 0; P1 0. Open P2 items have named owners and gates.

### 42.32 Corrections performed

Evidence-model status; access Sign in reduction rules; STATE-011 fallback; MAP-005 citation; VIEW-001/002/003 labels; historical recommendation fences; 320 px Inloggen wrap-order fallback; static-header after-scroll rule; first-viewport target wording; DENS-006 versus maturity emphasis; REDUCE-011 `PW6-RESP-011` citation; A11Y-010/012; RSK-008; REDUCE-001/013 pointers; §11 heading; document-control and status for R1; §37–§39 current gate.

### 42.33 Before/after evidence

Before: status `PW-7 READY FOR INDEPENDENT RESPONSIVE REQUIREMENTS REVIEW`; no §42; ACCESS-009 treatable as optional; VIEW-001 allowed identity+Sign in only; `PROPOSED` awaited owner freeze. After: status `PW-7 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT`; fourteen owner decisions unchanged; P1 defects corrected; P2 later conditions named.

### 42.34 Remaining downstream gates

PW-8 accessibility implementation; PW-9 wireframes; PW-10/11 visual design and optional abstract visual; PW-12 fidelity and viewport validation; PW-13 public-root architecture and isolated CSS; PW-14 indexation; legal destinations externally gated; screenshot HOLD. Final verification remains separately authorized.

### 42.35 Acceptance result

```text
PASS — PW-7-R1 INDEPENDENT RESPONSIVE REQUIREMENTS REVIEW CLOSED WITH EVIDENCE
```

### 42.36 File-integrity evidence

Reported in the PW-7-R1 review report: CRLF, no trailing whitespace, one terminating newline, sequential headings through §42, even fences, no conflict markers, no placeholder tokens, identifier census, upstream validation. Not claimed as browser or device tests.

### 42.37 Scope confirmation

Only `docs/phases/PW-7-responsive-content-layout-requirements.md` changed. No product code, PW-0 through PW-6, or authenticated Home changed. Nothing staged, committed, pushed, or deployed. PW-8 not started.

### 42.38 Final R1 status

```text
PW-7 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

```text
OWNER RESPONSIVE FREEZE ≠ VISUAL DESIGN FREEZE ≠ IMPLEMENTATION READY ≠ ACCESSIBILITY PASS ≠ PUBLICATION READY
```
