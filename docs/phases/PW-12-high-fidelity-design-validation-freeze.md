# PW-12 — High-Fidelity Design Validation and Freeze

| Field | Value |
| --- | --- |
| Document | PW-12 — High-Fidelity Design Validation and Freeze |
| Type | Design-validation and design-freeze authority (not implementation, not browser PASS, not accessibility PASS, not publication) |
| Date | 2026-09-16 |
| Branch | `core/platform-readiness-20260707` |
| HEAD at drafting | `085c40e5bd0fced04f2b2c847c5194c72737458c` |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Binding closures | PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; PW-3 `9c12c977383a100eb548880d8d35b329b4406f90`; PW-4 `c6f4489bc5cbf9306b4784320cc747975209caeb`; PW-5 `fcb4eab3fbfe7cefd0013828d9b9819cb452cb87`; PW-6 `b81ef171b68c62fb7e1a353b4d2ee79ba403d4b5`; PW-7 `adcbd1707caa97a4b5511a56616210d7444a5663`; PW-8 `0b453cfdbc678309bed47c1fef75d0155aa3eac4`; PW-9 `8402acd6c1e3547795a9b0ab4d6d4ae44d6d7149`; PW-10 `b2ebfd0e8b2fb037d04fcc179f347f218df3ab9b`; PW-11 `085c40e5bd0fced04f2b2c847c5194c72737458c` |
| Authenticated Home | Closure `49cd5773976143139a154f9b8ddf36535a4dd914`; product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Current status | `PW-12 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` |
| Establishment gate | `PASS — PW-12 HIGH-FIDELITY DESIGN CONTRACT VALIDATED AND FROZEN` (historical) |
| R1 gate | `PASS — PW-12-R1 INDEPENDENT DESIGN VALIDATION & FREEZE REVIEW CLOSED WITH EVIDENCE` |

```text
DESIGN CONTRACT FROZEN
≠ IMPLEMENTED
≠ BROWSER VALIDATED
≠ ACCESSIBILITY PASSED
≠ WCAG CONFORMANT
≠ USER VALIDATED
≠ PRODUCTION VERIFIED
≠ PUBLICATION READY
≠ DEPLOYED
```

---

## 1. Document Control

This file is the sole PW-12 deliverable. It validates the closed PW-11 high-fidelity design contract and freezes that contract for controlled implementation handoff. It does not implement routes, CSS, or markup.

| Control | Rule |
| --- | --- |
| Product code | Unchanged |
| Authenticated Home | Closed; not restyled |
| Dual-use `/` | Current truth unchanged; Root Model A remains desired IA only |
| `/login`, `/register`, invite, recovery | Read-only; not mutated |
| Shared CSS / root metadata / AppShell | Protected |
| Frozen Route A2 copy | Validated; not rewritten |
| Frozen PW-7 / PW-8 / PW-9 / PW-10 / PW-11 | Respected; not reopened |
| Assets / fonts / Figma / CSS | Out of scope |
| Staging / commit / push / deploy | Not authorized in this establishment |
| PW-13 | Not started |

---

## 2. Executive Decision

PW-12 validates that the owner-frozen Quiet Operational Editorial homepage contract in PW-11 is internally coherent, truth-safe, responsive by specification, accessibility-ready by design, and sufficiently executable for controlled PW-13 handoff.

Rendered browser, assistive-technology, visitor, and Production checks remain mandatory later gates. They are not passed here.

No P0 or unresolved P1 defect was found in the closed PW-11 contract. Residual PW-11 items remain P2 with owners. Independent R1 found documentation defects in this PW-12 file; they are corrected in §37 and do not reopen PW-11.

```text
PASS — PW-12 HIGH-FIDELITY DESIGN CONTRACT VALIDATED AND FROZEN
PW-12 DESIGN VALIDATION ESTABLISHED — READY FOR INDEPENDENT REVIEW
```

Historical establishment strings above are retained. Current status after R1 is in the document-control table and §37.

---

## 3. Purpose

Determine whether the PW-11 design contract can be frozen for implementation handoff without visual invention, copy rewrite, or protected-boundary breach, and assign every deferred check a method and owner.

---

## 4. Scope

In scope: source comparison, deterministic contrast arithmetic, design-contract geometry, typography, composition, navigation, accessibility-by-design, interaction-state, product-truth, premium-quality, executability, routing-contract, and isolation-contract validation; design freeze; deferred-validation ownership.

Out of scope: implementation; browser measurement; screen-reader execution; visitor research; legal drafting; brand-asset production; publication.

---

## 5. Non-Goals

Do not implement the homepage. Do not mutate `/`, `/login`, `/home`, AppShell, `globals.css`, middleware, or metadata. Do not claim accessibility PASS, WCAG conformance, browser verification, visitor validation, Production verification, or publication readiness. Do not authorize PW-13 until PW-12 closes through independent review and final verification.

---

## 6. Authority Register

| ID | Authority | Role |
| --- | --- | --- |
| PW12-AUTH-001 | B1-GATE.1 | Evidence and 100% required-gate standard |
| PW12-AUTH-002 | PW-0 | Public-web charter and protected boundaries |
| PW12-AUTH-003 | PW-1 | Public-truth ceiling |
| PW12-AUTH-004 | PW-2 | Visitor `PW2-VIS-001` operator-primary |
| PW12-AUTH-005 | PW-3 | Positioning and honest-stop messaging |
| PW12-AUTH-006 | PW-4 | Desired Root Model A; current dual-use `/` |
| PW12-AUTH-007 | PW-5 | Homepage content model |
| PW12-AUTH-008 | PW-6 | Frozen Route A2 copy |
| PW12-AUTH-009 | PW-7 | Responsive layout |
| PW12-AUTH-010 | PW-8 | Accessibility, behaviour, state |
| PW12-AUTH-011 | PW-9 | Wireframe and composition |
| PW12-AUTH-012 | PW-10 | Visual direction and system |
| PW12-AUTH-013 | PW-11 | Owner-frozen high-fidelity design |
| PW12-AUTH-014 | Home closure `49cd5773976143139a154f9b8ddf36535a4dd914` | Authenticated Home closed |
| PW12-AUTH-015 | Product SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828` | Today proof bound to current product |

PW-12 validates and freezes the design contract. It does not reopen upstream phases.

---

## 7. Evidence and Validation Model

| Class | Meaning | Used when |
| --- | --- | --- |
| `PASS — SOURCE VERIFIED` | Proven by closed source or exact document comparison | Copy, IDs, owner decisions |
| `PASS — ANALYTICALLY VERIFIED` | Deterministically calculable without rendering | Contrast ratios; 320 arithmetic |
| `PASS — CONTRACT VERIFIED` | Coherent implementable requirement in the design contract | Composition, states, freeze rules |
| `DEFERRED — REQUIRES IMPLEMENTATION` | Needs PW-13 code | Routing, isolation CSS, disclosure mechanism |
| `DEFERRED — REQUIRES BROWSER VALIDATION` | Needs actual layout, focus, reflow, or visual inspection | Zoom, wrap, rendered contrast |
| `DEFERRED — REQUIRES ASSISTIVE-TECHNOLOGY VALIDATION` | Needs a screen reader or equivalent | Disclosure name/state, skip |
| `DEFERRED — REQUIRES USER VALIDATION` | Needs governed participants | Five-second comprehension |
| `EXTERNALLY GATED` | Legal, brand, or domain authority | Footer legal; favicon |
| `FAIL — BLOCKING` | P0 or unresolved P1 in the design contract | Not used in this establishment |

A deferred implementation-dependent validation is not a design-contract failure when the contract is coherent, expected behaviour is explicit, the future method is defined, a downstream owner is assigned, and later failure can block publication. A deferred item is never reported as passed.

Each `PW11-VAL-*` record has exactly one primary class. Secondary dependencies (implementation before user tests; browser after implementation; assistive technology for name/role/state) are recorded separately and do not increment the primary group total. Primary assistive-technology count remaining zero does not waive screen-reader evidence.

---

## 8. Protected Boundaries

Current architecture remains: unauthenticated `/` redirects to `/login` (`src/app/page.tsx`). Root `lang="en"`. Authenticated Home at `/home` remains closed. PW-12 authorizes no route, code, styling, or configuration change.

---

## 9. PW-11 Closure Verification

| Check | Expected | Observed | Status |
| --- | --- | --- | --- |
| Closure commit | `085c40e5bd0fced04f2b2c847c5194c72737458c` | HEAD and PW-11 commit | `PASS — SOURCE VERIFIED` |
| Final status language | Closed with evidence after FV | Commit message and FV report; document retains `PW-11 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` as pre-FV current status plus FV closure in the authorized report | `PASS — SOURCE VERIFIED` |
| Main census | 341 | Definition rows 341 | `PASS — SOURCE VERIFIED` |
| R1 findings | 22 | `PW11-R1-FND-001`–`022` | `PASS — SOURCE VERIFIED` |
| P0 remaining | 0 | 0 | `PASS — SOURCE VERIFIED` |
| P1 remaining | 0 | 0 | `PASS — SOURCE VERIFIED` |
| P1 corrected | 13 | FND-001–013 `CORRECTED` | `PASS — SOURCE VERIFIED` |
| P2 later-gated | 9 | FND-014–022 | `PASS — SOURCE VERIFIED` |
| Owner decisions | 7 / 7 / 0 | `PW11-OD-001`–`007` `RESOLVED — OWNER FROZEN` | `PASS — SOURCE VERIFIED` |

Family counts: PRIN 12, DESIGN 1, VIEW 9, GEO 30, TYPE 13, COLOR 20, SURF 11, REGION 14, COMP 18, STATE 24, RESP 18, A11Y 28, ANTI 20, RSK 28, VAL 32, Q 14, OD 7, MAP 21, ACC 21. Main total 341. R1-FND 22 separately. PW-11 was not repaired.

---

## 10. Frozen Design Package

| Element | Frozen value | Status |
| --- | --- | --- |
| Visual direction | Quiet Operational Editorial (`PW11-DESIGN-001`; `PW10-DIR-001`) | `PASS — SOURCE VERIFIED` |
| Theme | Light-first; no public theme toggle (`PW10-OD-002`) | `PASS — SOURCE VERIFIED` |
| Identity | Text-first `ZyntixAI` | `PASS — SOURCE VERIFIED` |
| Canvas | `#F4F1EA` | `PASS — SOURCE VERIFIED` |
| Ink | `#1A1916` | `PASS — SOURCE VERIFIED` |
| Muted | `#5C574E` | `PASS — SOURCE VERIFIED` |
| Accent | `#1F5C57` | `PASS — SOURCE VERIFIED` |
| Typography | System-first sans (`PW10-OD-006`) | `PASS — SOURCE VERIFIED` |
| Hero surface | Open canvas | `PASS — CONTRACT VERIFIED` |
| Closed beta | Inline factual text | `PASS — CONTRACT VERIFIED` |
| Value / mechanism | Continuous editorial | `PASS — CONTRACT VERIFIED` |
| Today | Subtle reading-column band (`PW11-OD-003`) | `PASS — CONTRACT VERIFIED` |
| Course Seller | Copy-measure divider (`PW11-OD-005`) | `PASS — CONTRACT VERIFIED` |
| Trust | Plain titled text | `PASS — CONTRACT VERIFIED` |
| Access | Reading-column enclosed panel (`PW11-OD-004`) | `PASS — CONTRACT VERIFIED` |
| Footer | Identity with divider | `PASS — CONTRACT VERIFIED` |
| Header | Static, non-sticky, text wordmark, 1px separator (`PW11-OD-002`) | `PASS — CONTRACT VERIFIED` |
| `Inloggen` | Utility | `PASS — CONTRACT VERIFIED` |
| Disclosure | `Navigatie`; non-modal inline (`PW11-OD-001`) | `PASS — CONTRACT VERIFIED` |
| Hero | Natural H1 wrap (`PW11-OD-006`); `space-8` top (`PW11-OD-007`); no image; no CTA row | `PASS — CONTRACT VERIFIED` |
| Motion | No-motion baseline | `PASS — CONTRACT VERIFIED` |
| Icons | None required | `PASS — CONTRACT VERIFIED` |
| Isolation | Future route-scoped public tokens | `PASS — CONTRACT VERIFIED` |

No contradiction in the frozen package.

---

## 11. Frozen-Copy Validation

Method: character-for-character comparison of PW-11 §9.1 against the owner-frozen PW-6 Route A2 working deck. Special characters: `programma’s` uses U+2019; `bèta` uses U+00E8. Rounding and rendering are not involved.

| ID | Role | PW-6 source | PW-11 role | Expected exact text | Char | Punct | Unicode | State | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW12-COPY-001 | Wordmark / footer | `PW6-COPY-001`; `PW6-COPY-031` | Identity | `ZyntixAI` | match | n/a | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-002 | Nav | `PW6-NAV-006` | Nav | `Over ZyntixAI` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-003 | Nav | `PW6-NAV-002` | Nav | `Hoe het werkt` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-004 | Nav | `PW6-NAV-007` | Nav | `Gesloten bèta` | match | match | U+00E8 | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-005 | Nav utility | `PW6-NAV-004` | Utility | `Inloggen` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-006 | Narrow shortening | `PW6-RESP-011` | Disclosure canvas | `Bèta` only as shortening of `Gesloten bèta` | match | match | U+00E8 | allowed when needed | `PASS — SOURCE VERIFIED` |
| PW12-COPY-007 | H1 | `PW6-COPY-043`; `PW6-HERO-006` | Hero | `Houd zicht op klanten, werk en voortgang.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-008 | Support | `PW6-COPY-044` | Hero | `ZyntixAI helpt je als eigenaar van een klein bedrijf het dagelijkse werk te organiseren: klanten, verantwoordelijkheden, voortgang en wat aandacht nodig heeft.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-009 | Layer B 1 | `PW6-COPY-045` | Closed beta | `ZyntixAI is nu in gesloten bèta.` | match | match | U+00E8 | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-010 | Layer B 2 | `PW6-COPY-045` | Closed beta | `Inloggen is voor bestaande accounts.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-011 | Value H2 | `PW9-OD-003` | Value | `Over ZyntixAI` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-012 | Value body | `PW6-COPY-046` | Value | `ZyntixAI is bedoeld om klanten, werk, verantwoordelijkheden en voortgang bij het werk te houden. Het vervangt niet al je andere tools.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-013 | Mechanism H2 | `PW9-OD-003` | Mechanism | `Hoe het werkt` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-014 | Mechanism body | `PW6-COPY-047` | Mechanism | `Relevante informatie over klanten, werk en verantwoordelijkheden blijft bij het werk waar het bij hoort. Toegelaten gebruikers kunnen daarna op Today een beperkt dagelijks startpunt zien.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-015 | Today H2 | `PW6-PROOF-005` | Today | `Today als voorbeeld in het product` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-016 | Today body | `PW6-PROOF-006` | Today | `Wie is toegelaten en ingelogd, begint op Today. Die pagina toont een beperkt dagelijks startpunt met aandachtspunten en toegewezen taken.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-017 | Today qualifier | `PW6-PROOF-007` | Today | `Today is geen publieke demo en staat niet voor het hele product.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-018 | CS H2 | `PW6-CS-009` | Course Seller | `Als je opleidingen of coaching geeft` | match | no terminal period | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-019 | CS body | `PW6-CS-010` | Course Seller | `In die context kunnen toegelaten gebruikers werken met klanten, programma’s, inschrijvingen en voortgang.` | match | match | U+2019 | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-020 | CS qualifier | `PW6-CS-011` | Course Seller | `Dit is geen leeromgeving en geen open catalogus.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-021 | Trust H2 | `PW6-TRUST-007` | Trust | `Hoe toegang in het product werkt` | match | no terminal period | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-022 | Trust body | `PW6-TRUST-008` | Trust | `ZyntixAI is bedoeld voor mensen die zijn ingelogd binnen hun organisatie. Wat voor jou niet geldt, blijft buiten beeld. Today gebruikt gegevens binnen de context van je ingelogde account en organisatie.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-023 | Access H2 | `PW6-ACCESS-007` | Access | `Toegang` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-024 | Access status | `PW6-ACCESS-008` | Access | `ZyntixAI is in gesloten bèta. Via deze site kun je geen nieuw account aanmaken.` | match | match | U+00E8 | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-025 | Access utility | `PW6-ACCESS-009` | Access | `Heb je al een account? Inloggen.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-026 | Honest stop | `PW6-ACCESS-010` | Access | `Heb je geen account, dan is deze pagina bedoeld om ZyntixAI te leren kennen.` | match | match | ASCII | active | `PASS — SOURCE VERIFIED` |
| PW12-COPY-027 | Skip chrome | `PW8-NAME-001` | Skip | `Ga naar de hoofdinhoud` | match | match | ASCII | active chrome | `PASS — SOURCE VERIFIED` |
| PW12-COPY-028 | Disclosure chrome | `PW11-OD-001` | Header | `Navigatie` | match | match | ASCII | active chrome | `PASS — SOURCE VERIFIED` |
| PW12-COPY-029 | AI sentence | `PW6-AI-002` | Inactive | `ZyntixAI is geen chatbot. Het is een product om dagelijks werk te organiseren.` | n/a | n/a | ASCII | inactive by default | `PASS — SOURCE VERIFIED` |
| PW12-COPY-030 | BOS | `PW6-COPY-054` | Omitted | not in active board | n/a | n/a | n/a | omitted | `PASS — SOURCE VERIFIED` |

Active copy mismatches: 0. Unauthorized mobile shortening beyond `Bèta`: 0. Invented CTA copy: 0. PW-6 and PW-11 were not edited.

---

## 12. PW-11 Validation Disposition

Every `PW11-VAL-*` remains unexecuted as a rendered or visitor test. PW-12 assigns a class. Analytical contrast in §13 does not execute `PW11-VAL-022`.

| ID | PW-11 ID | Subject | Intended evidence | Now | Class | Method | Result if executed | Evidence | Downstream | Publication blocker if later failed | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW12-VDISP-001 | PW11-VAL-001 | Five-second comprehension | Expert; later visitor | no | `DEFERRED — REQUIRES USER VALIDATION` | Governed expert then visitor task on rendered page | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-002 | PW11-VAL-002 | Operator-primary recognition | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert ranking of apparent audience | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-003 | PW11-VAL-003 | Chatbot misinterpretation | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert probe for chatbot reading | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-004 | PW11-VAL-004 | Closed-beta comprehension | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert restatement of maturity | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-005 | PW11-VAL-005 | Sign in versus signup | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert probe of `Inloggen` meaning | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-006 | PW11-VAL-006 | Today-as-example | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert probe of example versus product | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-007 | PW11-VAL-007 | CS relevance versus brand | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert probe of secondary CS | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-008 | PW11-VAL-008 | Trust-copy interpretation | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert probe of named controls versus certification | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-009 | PW11-VAL-009 | Honest-stop dignity | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert probe of stop versus error | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-010 | PW11-VAL-010 | Desktop scan path | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert scan of rendered 1440 | not executed | none | PW-13 then research | no | deferred |
| PW12-VDISP-011 | PW11-VAL-011 | Tablet navigation fit | Later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Measure wrap-then-disclose | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-012 | PW11-VAL-012 | Mobile reading order | Later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | DOM versus visual order at 390 | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-013 | PW11-VAL-013 | 320 CSS px | Later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Reflow, wrap, no 2D scroll | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-014 | PW11-VAL-014 | 200% zoom | Later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Zoom reflow | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-015 | PW11-VAL-015 | Text-spacing overrides | Later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | WCAG text-spacing | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-016 | PW11-VAL-016 | Keyboard navigation | Later keyboard | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Tab order and disclosure keys | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-017 | PW11-VAL-017 | Focus visibility | Later keyboard | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | 2px+2px visible | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-018 | PW11-VAL-018 | Forced colours | Later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Forced-colours mode | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-019 | PW11-VAL-019 | Reduced motion | Later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | `prefers-reduced-motion` | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-020 | PW11-VAL-020 | Line length | Expert + later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Rendered measure inside 40rem | not executed | none | PW-13 | no | deferred |
| PW12-VDISP-021 | PW11-VAL-021 | Type wrapping | Later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Natural H1 wrap | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-022 | PW11-VAL-022 | Rendered contrast | Instrumented | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Measured ratios | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-023 | PW11-VAL-023 | Target sizes | Instrumented | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | 24 floor / 44 preference | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-024 | PW11-VAL-024 | Disclosure behaviour | Later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | `Navigatie` non-modal inline | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-025 | PW11-VAL-025 | No-JavaScript behaviour | Later browser | no | `DEFERRED — REQUIRES IMPLEMENTATION` | Native fallback after markup exists | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-026 | PW11-VAL-026 | Optional-section removal | Review | yes | `PASS — CONTRACT VERIFIED` | Source review of removable CS and Today | Contract specifies removable units without empty slots | PW-11 SURF/REGION/STATE-024 | PW-13 regression | yes | passed as contract |
| PW12-VDISP-027 | PW11-VAL-027 | Cross-browser rendering | Later lab | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Chromium/Firefox/WebKit sample | not executed | none | PW-13 | no | deferred |
| PW12-VDISP-028 | PW11-VAL-028 | Public/auth visual isolation | Diff + review | no | `DEFERRED — REQUIRES IMPLEMENTATION` | Route-scoped tokens; AppShell diff | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-029 | PW11-VAL-029 | Header fit threshold | Later measurement | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Content-fit, not `md`/`lg` | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-030 | PW11-VAL-030 | Today-band perceivability | Expert + later browser | no | `DEFERRED — REQUIRES BROWSER VALIDATION` | Quiet band versus card | not executed | none | PW-13 | yes | deferred |
| PW12-VDISP-031 | PW11-VAL-031 | Access not error/acquisition | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert probe of panel meaning | not executed | none | PW-13 then research | yes | deferred |
| PW12-VDISP-032 | PW11-VAL-032 | Footer completeness | Expert | no | `DEFERRED — REQUIRES USER VALIDATION` | Expert probe of intentional close | not executed | none | PW-13 then research | no | deferred |

Primary group counts (must equal 32; one primary class per VAL):

| Group | Count | IDs |
| --- | ---: | --- |
| Source-verifiable now | 0 | none of the 32 is a copy-byte comparison; copy is §11 |
| Analytically verifiable now | 0 | contrast is §13, not a PW11-VAL execution |
| Contract-verifiable now | 1 | VAL-026 |
| Implementation-dependent | 2 | VAL-025; VAL-028 |
| Browser-dependent | 17 | VAL-011 through VAL-024; VAL-027; VAL-029; VAL-030 |
| Assistive-technology-dependent | 0 as primary | No PW11-VAL row is solely a screen-reader test. Primary 0 does not waive AT evidence. Secondary AT applies as listed below. |
| User-validation-dependent | 12 | VAL-001 through VAL-010; VAL-031; VAL-032 |
| Externally gated | 0 | legal/brand are questions, not VAL rows |
| **Total** | **32** | |

Secondary dependencies (do not add to the primary 32):

| Primary VAL | Secondary class | Why |
| --- | --- | --- |
| VAL-001 through VAL-010; VAL-031; VAL-032 | Implementation then browser | Human probes need a rendered public page; they remain user-primary because the distinctive evidence is governed judgment |
| VAL-016 | Assistive technology | Keyboard/browser remains primary; SR must still confirm control names and disclosure state |
| VAL-020 | Analytical / contract | 40rem hard max and copy-measure-inside-reading are already specified; rendered measure remains primary |
| VAL-024 | Assistive technology | Non-modal inline behaviour is browser-primary; accessible name `Navigatie`, role, and expanded state require AT |
| VAL-025 | Browser | Markup/implementation is primary; the no-JS lab is a browser/runtime check after markup exists |
| VAL-028 | Browser | Token/isolation implementation is primary; AppShell/Home/login visual diff is a browser/review check |
| VAL-030 | User (expert visual) | Band-versus-card is browser-primary; expert perception remains a later human check |

Screen-reader execution is owned by `PW12-DEFER-010`, `PW12-A11Y-004`, `PW12-A11Y-023`, and `PW12-STATE-007` / `008` / `010`. It is not a primary `PW11-VAL` class.

---

## 13. Contrast Validation

Formula: WCAG 2.x relative luminance, sRGB, `(L1+0.05)/(L2+0.05)`. Rounding: half-up to two decimal places. Independent PW-12 calculation. Not a browser measurement. Not an accessibility PASS. Not WCAG conformance.

| ID | Foreground | Background | Exact | Round 2 | PW-11 expected | Role | Prohibited as | Rendered still required |
| --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- |
| PW12-CONTRAST-001 | `#1A1916` | `#F4F1EA` | 15.584682 | 15.58 | 15.58 | body/H1/H2 on canvas | n/a | yes |
| PW12-CONTRAST-002 | `#1A1916` | `#FFFFFF` | 17.579692 | 17.58 | 17.58 | text on access surface | n/a | yes |
| PW12-CONTRAST-003 | `#1A1916` | `#EBE6DC` | 14.134592 | 14.13 | 14.13 | text on Today band | n/a | yes |
| PW12-CONTRAST-004 | `#3F3C36` | `#F4F1EA` | 9.742119 | 9.74 | 9.74 | essential qualifiers | n/a | yes |
| PW12-CONTRAST-005 | `#3F3C36` | `#EBE6DC` | 8.835655 | 8.84 | 8.84 | qualifiers on Today | n/a | yes |
| PW12-CONTRAST-006 | `#5C574E` | `#F4F1EA` | 6.357446 | 6.36 | 6.36 | footer identity | essential claim text | yes |
| PW12-CONTRAST-007 | `#5C574E` | `#EBE6DC` | 5.765912 | 5.77 | 5.77 | non-required chrome on Today | essential qualifiers | yes |
| PW12-CONTRAST-008 | `#1F5C57` | `#F4F1EA` | 6.827499 | 6.83 | 6.83 | links on canvas; not colour-only | sole state cue | yes |
| PW12-CONTRAST-009 | `#1F5C57` | `#FFFFFF` | 7.701494 | 7.70 | 7.70 | links on access | sole state cue | yes |
| PW12-CONTRAST-010 | `#1F5C57` | `#EBE6DC` | 6.192229 | 6.19 | 6.19 | links on Today | sole state cue | yes |
| PW12-CONTRAST-011 | `#174843` | `#F4F1EA` | 9.106140 | 9.11 | 9.11 | link hover | sole hover cue | yes |
| PW12-CONTRAST-012 | `#8A8376` | `#FFFFFF` | 3.757531 | 3.76 | 3.76 | access `border-strong` UI | body text | yes |
| PW12-CONTRAST-013 | `#8A8376` | `#F4F1EA` | 3.331113 | 3.33 | 3.33 | strong border on canvas | body text | yes |
| PW12-CONTRAST-014 | `#C9C2B4` | `#F4F1EA` | 1.569813 | 1.57 | 1.57 | decorative header/footer rule | meaning or state | yes |
| PW12-CONTRAST-015 | `#E4DFD4` | `#F4F1EA` | 1.177941 | 1.18 | 1.18 | decorative CS/footer divider | meaning or state | yes |
| PW12-CONTRAST-016 | `#EBE6DC` | `#F4F1EA` | 1.102592 | 1.10 | 1.10 | Today band versus canvas; not a text pair | text contrast | yes |

Reconciliation with PW-10-R1 and PW-11: all sixteen round-2 values match. Class: `PASS — ANALYTICALLY VERIFIED`. `PW11-VAL-022` remains deferred.

---

## 14. Responsive Geometry Validation

Canvases are design-review surfaces (`PW7-OD-014`), not CSS breakpoints. `space-8` = 2.50rem from PW-10. Root assumption for arithmetic: 16 CSS px. Not a measured browser result.

| ID | Canvas | Safe inline | Wide max | Reading max | Copy-measure | Panel | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW12-GEO-001 | 1440 | 1.50rem | 64rem inside viewport minus inline | 40rem hard max | inside reading | access ≤40rem | `PASS — ANALYTICALLY VERIFIED` |
| PW12-GEO-002 | 1280 | 1.50rem | same | 40rem | inside reading | same | `PASS — ANALYTICALLY VERIFIED` |
| PW12-GEO-003 | 1024 | ≥1.00rem | shrinks with viewport | ≤40rem | inside reading | same | `PASS — CONTRACT VERIFIED` |
| PW12-GEO-004 | 768 | ≥1.00rem | one column | available width ≤40rem | inside box | same | `PASS — CONTRACT VERIFIED` |
| PW12-GEO-005 | 390 | 1.00rem | full minus inline | full minus inline | not 72ch width | safe width | `PASS — CONTRACT VERIFIED` |
| PW12-GEO-006 | 320 | 1.00rem | see arithmetic | see arithmetic | not 72ch width | ~246 inner (conceptual; border-box) | `PASS — ANALYTICALLY VERIFIED` |
| PW12-GEO-007 | 200% zoom | as zoomed | reflow | reflow | wrap | wrap | `PASS — CONTRACT VERIFIED`; render `DEFERRED — REQUIRES BROWSER VALIDATION` |
| PW12-GEO-008 | Text-spacing | authored + override | no orphan qualifier | attached pairs | wrap | wrap | `PASS — CONTRACT VERIFIED`; render deferred |
| PW12-GEO-009 | Landscape mobile | 1.00rem | no vh-hero | compact space | wrap | one panel | `PASS — CONTRACT VERIFIED` |
| PW12-GEO-010 | Focus clearance | ≥ space-3; 2px+2px | must not clip | page-inline 16px > 8px focus stack at 320 | n/a | panel padding 20px > focus | `PASS — ANALYTICALLY VERIFIED` |
| PW12-GEO-011 | Targets | 24×24 floor; 44×44 preferred | wrap rather than shrink below 24 | n/a | n/a | 246px inner > 44 | `PASS — ANALYTICALLY VERIFIED` for fit; measure deferred |
| PW12-GEO-012 | Width-role precedence | viewport → page-inline → content-wide → content-reading → copy-measure | copy-measure must not exceed 40rem | Today and access share reading width as separate regions | CS uses copy-measure | no negative margin; no fixed section height; no vh-hero | `PASS — CONTRACT VERIFIED` |

320 CSS px arithmetic (16px root). This is conceptual contract arithmetic, not measured reflow.

Assumptions: the access panel’s used border-box width equals the inner page (288 CSS px); `box-sizing: border-box`; frozen access padding is 1.25rem per side (`PW11-GEO-023`); 1px `border-strong` per side occupies the border box. If an implementer uses `content-box`, padding and borders must still fit inside the 288 CSS px inner page and must not expand it. Horizontal overflow remains prohibited.

| Step | Token | CSS px |
| --- | --- | ---: |
| Viewport | VIEW-006 | 320 |
| Page-inline each side | GEO-001 1.00rem | 16 |
| Inner page | 320 − 32 | 288 |
| Access padding each side | GEO-023 1.25rem | 20 |
| Border each side | 1px `border-strong` | 1 |
| Access inner text (border-box) | 288 − 40 − 2 | 246 |
| Focus stack | 2px outline + 2px offset | 8; page-inline 16 > 8, so external room exists at the page edge |
| Preferred target | 44 | fits in 246 inner text width |

No required horizontal scrolling in the contract. Actual browser reflow: `DEFERRED — REQUIRES BROWSER VALIDATION`.

---

## 15. Typography Validation

Stack: `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. No external font. Tracking 0. One semantic H1. H1 2.00rem desktop / 1.625rem at 390 and 320 only, not automatically at 768. 60–72ch is a copy-measure role inside the 40rem hard max; it is not a requirement that that character count physically fit at 320.

PW12-TYPE IDs are PW-12 validation rows. They are not a 1:1 renumbering of PW11-TYPE IDs. Crosswalk:

| PW-12 row | Role | PW-11 row |
| --- | --- | --- |
| `PW12-TYPE-001` | Wordmark | `PW11-TYPE-001` |
| `PW12-TYPE-002` | Navigation | `PW11-TYPE-002` |
| `PW12-TYPE-003` | Disclosure | `PW11-TYPE-012` |
| `PW12-TYPE-004` | H1 | `PW11-TYPE-003` |
| `PW12-TYPE-005` | Support | `PW11-TYPE-004` |
| `PW12-TYPE-006` | Closed-beta status | `PW11-TYPE-005` |
| `PW12-TYPE-007` | H2 | `PW11-TYPE-006` |
| `PW12-TYPE-008` | Body | `PW11-TYPE-007` |
| `PW12-TYPE-009` | Qualifier | `PW11-TYPE-008` |
| `PW12-TYPE-010` | Links | not a PW11-TYPE row; body underline + teal from COLOR/A11Y |
| `PW12-TYPE-011` | Access H2 | `PW11-TYPE-010`, which equals `PW11-TYPE-006` H2 (not closed-beta) |
| `PW12-TYPE-012` | Footer identity | `PW11-TYPE-011` |
| `PW12-TYPE-013` | Skip | `PW11-TYPE-013` |

Utility `Inloggen` remains `PW11-TYPE-009` and is validated under `PW12-NAV-008` / `PW12-TYPE-002`. It is not omitted from the contract.

| ID | Role | Contract | Status |
| --- | --- | --- | --- |
| PW12-TYPE-001 | Wordmark | 1.125–1.25rem / 700 / 1.2; text-first | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-002 | Navigation | 0.9375 / 1.00rem / 600 / 1.25 | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-003 | Disclosure | same as navigation; label `Navigatie` | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-004 | H1 | 2.00 / 1.625; 700; 1.2; natural wrap | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-005 | Support | 1.125 / 1.0625; 400; 1.5; wrap `verantwoordelijkheden` | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-006 | Beta | 1.00rem; 400; 1.45; both sentences remain | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-007 | H2 | 1.375 / 1.25; 600; 1.25 | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-008 | Body | 1.00rem; 400; 1.55 | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-009 | Qualifier | 0.9375rem floor; text-secondary | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-010 | Links | underline in body; teal; hover not sole cue | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-011 | Access H2 | same as `PW12-TYPE-007` / `PW11-TYPE-006` H2 (1.375 / 1.25; 600; 1.25); not closed-beta size | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-012 | Footer identity | 0.9375rem; 600; muted allowed | `PASS — CONTRACT VERIFIED` |
| PW12-TYPE-013 | Skip | body-default; 600; visible on focus | `PASS — CONTRACT VERIFIED` |

Rendered font metrics and wrap points: `DEFERRED — REQUIRES BROWSER VALIDATION`. Exact screenshot line breaks are not required.

---

## 16. Composition and Density Validation

| ID | Check | Result | Status |
| --- | --- | --- | --- |
| PW12-COMP-001 | One primary design | `PW11-DESIGN-001` only | `PASS — SOURCE VERIFIED` |
| PW12-COMP-002 | Eight visual clusters | ZONE-001–008 | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-003 | Ten semantic regions | SEC-001–010 | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-004 | Fourteen REGION IDs mapped | skip, header splits, disclosure extra | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-005 | One H1 | `PW11-TYPE-003` / `PW12-TYPE-004` | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-006 | Enclosed occupancy 1/1/1 | access only | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-007 | Same order all axes | DOM = visual = reading = keyboard = responsive | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-008 | Today band not card | SURF-006 | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-009 | CS divider not card | SURF-007 | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-010 | Trust plain; footer divider | SURF-008/010 | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-011 | No feature grid, TG cards, screenshot, rail, CTA row, mega-footer | ANTI register | `PASS — CONTRACT VERIFIED` |
| PW12-COMP-012 | Density: complete copy, finite eight-cluster rhythm, two Sign in, attached qualifiers, `space-8` not vh-hero | Contract prevents empty luxury and unbounded dump | `PASS — CONTRACT VERIFIED`; perception deferred |

Perception of unfinished-document or empty-luxury remains `DEFERRED — REQUIRES BROWSER VALIDATION` (`PW11-R1-FND-020`).

---

## 17. Header and Navigation Validation

| ID | Requirement | Status |
| --- | --- | --- |
| PW12-NAV-001 | Text wordmark; not `/home` | `PASS — CONTRACT VERIFIED` |
| PW12-NAV-002 | Desired brand destination is future public root | `PASS — CONTRACT VERIFIED`; routing deferred |
| PW12-NAV-003 | Static non-sticky header | `PASS — CONTRACT VERIFIED` |
| PW12-NAV-004 | 1px `border-default` separator | `PASS — SOURCE VERIFIED` |
| PW12-NAV-005 | Full nav while content fits | `PASS — CONTRACT VERIFIED` |
| PW12-NAV-006 | Wrap before disclose; content-fit not device identity | `PASS — CONTRACT VERIFIED` |
| PW12-NAV-007 | Visible label `Navigatie`; not hamburger-only | `PASS — SOURCE VERIFIED` |
| PW12-NAV-008 | `Inloggen` outside disclosure where feasible | `PASS — CONTRACT VERIFIED` |
| PW12-NAV-009 | Non-modal inline expansion; no required motion | `PASS — CONTRACT VERIFIED` |
| PW12-NAV-010 | Native semantic fallback; no `href="#"`; no dead control | `PASS — CONTRACT VERIFIED` |
| PW12-NAV-011 | Candidate anchors unimplemented | `PASS — SOURCE VERIFIED` |
| PW12-NAV-012 | No-JS readability of core, skip, Sign in, access | `PASS — CONTRACT VERIFIED`; behaviour deferred |

Ambiguity permitting a modal drawer, fake link, or hidden Sign in: not found. Keyboard and routing remain deferred.

---

## 18. Accessibility-Contract Validation

Do not claim accessibility PASS or WCAG conformance. Complete accessibility documentation is not an accessibility PASS.

| ID | PW-11 | Coverage | Contract now | Impl | Browser | AT | Future evidence | Owner | Publication blocker if later failed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW12-A11Y-001 | A11Y-001 | One H1 | yes | yes | no for count | no | One `h1` in public markup matching frozen H1 | PW-13 | yes |
| PW12-A11Y-002 | A11Y-002 | Logical H2s | yes | yes | no for titles | no | Visible H2s match frozen titles; no skipped level | PW-13 | yes |
| PW12-A11Y-003 | A11Y-003 | Landmarks | yes | yes | yes | yes | `header` / `main` / `footer`; CS is `section` not `aside` | PW-13 | yes |
| PW12-A11Y-004 | A11Y-004 | Skip to `main` | yes | yes | yes | yes | First focusable; visible on focus; target `main`; omit href if ID missing | PW-13 | yes |
| PW12-A11Y-005 | A11Y-005 | Text-labelled disclosure | yes | yes | yes | yes | Visible name `Navigatie`; not icon-only | PW-13 | yes |
| PW12-A11Y-006 | A11Y-006 | 2px+2px focus | yes | yes | yes | no | Visible 2px outline + 2px offset `#1F5C57`; not colour-only | PW-13 | yes |
| PW12-A11Y-007 | A11Y-007 | Focus clearance space-3 | yes | yes | yes | no | Focus not clipped by header, panel, or overflow | PW-13 | yes |
| PW12-A11Y-008 | A11Y-008 | Keyboard = DOM order | yes | yes | yes | no | Tab order equals DOM/reading order including disclosure | PW-13 | yes |
| PW12-A11Y-009 | A11Y-009 | Descriptive names | yes | yes | no | yes | Accessible names match visible Dutch labels | PW-13 | yes |
| PW12-A11Y-010 | A11Y-010 | Colour-independent state | yes | yes | yes | no | Current/hover/maturity not colour-only | PW-13 | yes |
| PW12-A11Y-011 | A11Y-011 | Qualifier ≥ ~0.9375rem | yes | yes | yes | no | Qualifiers remain at or above floor at 320 and 200% | PW-13 | yes |
| PW12-A11Y-012 | A11Y-012 | Body line-height 1.55 | yes | yes | yes | no | Authored 1.55; text-spacing overrides still wrap | PW-13 | yes |
| PW12-A11Y-013 | A11Y-013 | 200% zoom | yes | yes | yes | no | No lost qualifier/control; no essential 2D scroll | PW-13 | yes |
| PW12-A11Y-014 | A11Y-014 | Text-spacing | yes | yes | yes | no | WCAG text-spacing override; attached pairs survive | PW-13 | yes |
| PW12-A11Y-015 | A11Y-015 | Forced colours | yes | yes | yes | no | Text, links, focus, essential border remain perceptible | PW-13 | yes |
| PW12-A11Y-016 | A11Y-016 | Reduced motion | yes | yes | yes | no | Usable at 0ms; no required motion | PW-13 | yes |
| PW12-A11Y-017 | A11Y-017 | 24×24 floor | yes | yes | yes | no | Measured CSS px ≥ 24 for essential controls | PW-13 | yes |
| PW12-A11Y-018 | A11Y-018 | 44×44 preference | yes | yes | yes | no | Header `Navigatie` and `Inloggen` prefer 44; wrap rather than shrink below 24 | PW-13 | yes |
| PW12-A11Y-019 | A11Y-019 | No hover-only truth | yes | yes | yes | no | Essential meaning visible without hover | PW-13 | yes |
| PW12-A11Y-020 | A11Y-020 | No icon-only truth | yes | yes | no | yes | No icon carries essential meaning | PW-13 | yes |
| PW12-A11Y-021 | A11Y-021 | No low-contrast required text | analytical pairing now | yes | yes | no | Rendered text ≥ 4.5:1; decorative borders stay decorative | PW-13 | yes |
| PW12-A11Y-022 | A11Y-022 | No fake disabled controls | yes | yes | yes | no | No opacity-only disabled Sign in or nav | PW-13 | yes |
| PW12-A11Y-023 | A11Y-023 | Disclosure name/role/state | yes | yes | yes | yes | Name `Navigatie`; collapsed/expanded announced | PW-13 | yes |
| PW12-A11Y-024 | A11Y-024 | Escape only if enhanced | yes | yes | yes | no | Escape only if the enhanced component requires it; native `details` may differ | PW-13 | yes |
| PW12-A11Y-025 | A11Y-025 | No-JS core complete | yes | yes | yes | no | Core, skip, Sign in, access readable with JS disabled | PW-13 | yes |
| PW12-A11Y-026 | A11Y-026 | Omitted optional content | yes | yes | yes | no | No empty CS/Today slot when omitted | PW-13 | yes |
| PW12-A11Y-027 | A11Y-027 | Dutch public `lang` isolation | yes | yes | no | yes | Public Dutch `lang`; authenticated English unchanged | PW-13 | yes |
| PW12-A11Y-028 | A11Y-028 | 320 reflow; no 2D core scroll | yes | yes | yes | no | Complete copy; no required horizontal scroll of core | PW-13 | yes |

PW-13 evidence required for deferred rows: implemented public route; keyboard pass notes; zoom/reflow screenshots or equivalent lab notes; forced-colours notes; reduced-motion notes; one NVDA+Chromium session when the environment exists; no fabricated gaps (`PW8-OD-015`). Secondary AT dependencies exist even though primary `PW11-VAL` AT count is 0.

---

## 19. Interaction-State Validation

No state is implemented.

| ID | PW-11 | Contract complete | Impl required | Browser required | AT required | Publication blocker if failed |
| --- | --- | --- | --- | --- | --- | --- |
| PW12-STATE-001 | Default | yes | yes | yes | no | yes |
| PW12-STATE-002 | Hover | yes | yes | yes | no | no |
| PW12-STATE-003 | Active | yes | yes | yes | no | no |
| PW12-STATE-004 | Focus-visible | yes | yes | yes | no | yes |
| PW12-STATE-005 | Visited body link | yes (same as default) | yes | yes | no | no |
| PW12-STATE-006 | Future current section | yes (later; not colour-only) | yes when anchors live | yes | no | yes |
| PW12-STATE-007 | Disclosure collapsed | yes | yes | yes | yes | yes |
| PW12-STATE-008 | Disclosure expanded | yes | yes | yes | yes | yes |
| PW12-STATE-009 | Skip hidden | yes | yes | yes | no | yes |
| PW12-STATE-010 | Skip focused | yes | yes | yes | yes | yes |
| PW12-STATE-011 | Anchor target focus | yes | yes when IDs exist | yes | no | yes |
| PW12-STATE-012 | Reduced motion | yes | yes | yes | no | yes |
| PW12-STATE-013 | No motion | yes | yes | yes | no | yes |
| PW12-STATE-014 | Forced colours | yes | yes | yes | no | yes |
| PW12-STATE-015 | High contrast / forced | yes | yes | yes | no | yes |
| PW12-STATE-016 | 200% zoom | yes | yes | yes | no | yes |
| PW12-STATE-017 | Text spacing | yes | yes | yes | no | yes |
| PW12-STATE-018 | No JavaScript | yes | yes | yes | no | yes |
| PW12-STATE-019 | Missing destination | yes | yes | no | no | yes |
| PW12-STATE-020 | Authenticated visitor | yes (not this page) | yes | yes | no | yes |
| PW12-STATE-021 | Unauthenticated visitor | yes (desired this page) | yes | yes | no | yes |
| PW12-STATE-022 | Legal omitted | yes | yes | no | no | yes |
| PW12-STATE-023 | AI inactive | yes | yes | no | no | yes |
| PW12-STATE-024 | Optional omitted | yes | yes | yes | no | yes |

Class for the set: `PASS — CONTRACT VERIFIED`. Implementation and browser checks remain deferred.

---

## 20. Product-Truth Validation

Unsupported positive claims: 0. Prohibited CTA controls: 0. Equal-availability implications: 0.

| ID | Risk | Copy | Visual | Authority | Mitigation | Status | Later render |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW12-TRUTH-001 | GA | closed beta early and in access | no launch chrome | PW1-CLM-007 | Layer B + access status | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-002 | Open signup | no new account via this site | no register control | PW1-CLM-011 | honest stop | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-003 | Public registration | same | no form | PW1 | omit | `PASS — CONTRACT VERIFIED` | yes |
| PW12-TRUTH-004 | Free | absent | no price-free badge | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-005 | Trial | absent | no trial CTA | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-006 | Pricing | absent | no table | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-007 | Public demo | Today qualifier | no screenshot | PW6-PROOF-007 | band not demo | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-008 | Request access | absent | no request CTA | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-009 | Waitlist | absent | no waitlist form | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-010 | Contact | absent | no contact | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-011 | Generative AI | AI copy inactive | no orb | PW6-AI-002 | omit | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-012 | Autonomous AI | absent | no autopilot chrome | PW1 | omit | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-013 | AI running the business | H1 is direction not result | restrained H1 | PW6-RSK-031 | natural wrap unchanged | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-014 | Provider connections | absent | no logos | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-015 | Stripe | absent | no checkout | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-016 | Checkout | absent | no cart | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-017 | Four complete editions | CS secondary | no four-card grid | PW4-OD-002 | divider + qualifier | `PASS — CONTRACT VERIFIED` | yes |
| PW12-TRUTH-018 | Equal TG availability | relevance ≠ availability | no equal cards | PW-1 | qualifier | `PASS — CONTRACT VERIFIED` | yes |
| PW12-TRUTH-019 | CS as whole brand | heading after Today | copy-measure divider | PW11-OD-005 | secondary | `PASS — CONTRACT VERIFIED` | yes |
| PW12-TRUTH-020 | LMS | qualifier | no learner chrome | PW6-CS-011 | attached qualifier | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-021 | Public catalogue | qualifier | no catalogue | PW6-CS-011 | attached | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-022 | Complete current-SHA CS | bound to SHA; not claimed complete | no edition card | PW-1 | omit | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-023 | Guaranteed clarity | H1 not a result | no slogan inflation | PW6-RSK-031 | restrained type | `PASS — CONTRACT VERIFIED` | yes |
| PW12-TRUTH-024 | Guaranteed efficiency | absent | no metric badges | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-025 | Growth or revenue | absent | no hockey-stick | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-026 | Compliance | trust named controls | no seals | PW6-TRUST-008 | plain text | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-027 | Certification | same | no shields | PW10-OD-012 | plain | `PASS — CONTRACT VERIFIED` | yes |
| PW12-TRUTH-028 | Absolute security | absent | no lock wall | PW1 | omit | `PASS — SOURCE VERIFIED` | yes |
| PW12-TRUTH-029 | SLA | absent | no uptime | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-030 | Traction | absent | no customer count | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-031 | Testimonials | absent | no quotes | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-032 | Customer logos | absent | no logo strip | PW1 | omit | `PASS — SOURCE VERIFIED` | no |
| PW12-TRUTH-033 | Artificial scarcity | beta factual not exclusive | no pill | PW10-OD-014 | inline status | `PASS — CONTRACT VERIFIED` | yes |

Status in this table covers copy presence/absence and the design contract. Rows with Later render = yes are not a rendered visual PASS. Visual-convention risks (Today band, CS divider, access panel, no screenshot, no four-card grid, no pill, no shields) remain `DEFERRED — REQUIRES BROWSER VALIDATION` for implication once implemented.

---

## 21. Premium-Quality Validation

| ID | Pattern | Contract prevention | Status |
| --- | --- | --- | --- |
| PW12-PREMIUM-001 | Hierarchy, alignment, measure, spacing, palette, surfaces, type, maturity, closure | Specified in PW-11 PRIN/GEO/TYPE/COLOR/SURF | `PASS — CONTRACT VERIFIED` |
| PW12-PREMIUM-002 | Generic AI startup | No orb, sparkles, purple, giant CTA | `PASS — CONTRACT VERIFIED`; look deferred |
| PW12-PREMIUM-003 | Chatbot landing | AI inactive; no chat UI | `PASS — CONTRACT VERIFIED`; look deferred |
| PW12-PREMIUM-004 | Coaching funnel | No waitlist; CS secondary | `PASS — CONTRACT VERIFIED`; look deferred |
| PW12-PREMIUM-005 | LMS homepage | CS qualifier; no catalogue | `PASS — CONTRACT VERIFIED`; look deferred |
| PW12-PREMIUM-006 | Enterprise dashboard | No screenshot; Today band not card | `PASS — CONTRACT VERIFIED`; look deferred |
| PW12-PREMIUM-007 | Coming-soon page | Full eight-cluster content | `PASS — CONTRACT VERIFIED`; look deferred |
| PW12-PREMIUM-008 | Waitlist page | No waitlist control | `PASS — CONTRACT VERIFIED` |
| PW12-PREMIUM-009 | Free-trial template | No trial CTA; utility Sign in | `PASS — CONTRACT VERIFIED` |
| PW12-PREMIUM-010 | Empty luxury editorial | `space-8` not vh-hero; extra 1440 is margin | `PASS — CONTRACT VERIFIED`; perception deferred |
| PW12-PREMIUM-011 | Unstyled document | Palette, type roles, one panel, header rule, footer close | `PASS — CONTRACT VERIFIED`; perception deferred |
| PW12-PREMIUM-012 | Oversized CTA | No filled primary button | `PASS — CONTRACT VERIFIED` |

No visual inspection of an unimplemented page was fabricated.

---

## 22. Executability Validation

PW-13 can determine content order, semantics, containers, width/spacing/type roles, palette, surfaces, borders, radii, shadow-none, focus, header, disclosure, responsive transformations, optional-content behaviour, states, exact copy, prohibited patterns, routing boundary, and validation obligations from PW-11 plus this freeze.

| ID | Ambiguity | Severity | Rule |
| --- | --- | --- | --- |
| PW12-EXEC-001 | Component names / files / CSS technique / tests | P2 | Permitted discretion |
| PW12-EXEC-002 | `details` versus equivalent button-and-region | P2 | Behaviour must match non-modal inline `Navigatie` |
| PW12-EXEC-003 | Exact content-fit threshold | P2 | Chosen by testing; not `sm`/`md`/`lg` stereotypes |
| PW12-EXEC-004 | New copy, colour, layout, CTA, TG grid, modal nav, screenshot, sticky header, new section | P0/P1 if attempted | Prohibited deviation |
| PW12-EXEC-005 | Materially different homepage from underspecification | none found | `PASS — CONTRACT VERIFIED` |

---

## 23. Root and Authenticated-Arrival Contract

Actual routing changes: `DEFERRED — REQUIRES IMPLEMENTATION`. Current `/` still redirects logged-out users to `/login`.

| ID | Future state | Contract | Status |
| --- | --- | --- | --- |
| PW12-ROUTE-001 | Unauthenticated `/` | Public homepage | `PASS — CONTRACT VERIFIED`; impl deferred |
| PW12-ROUTE-002 | Authenticated `/` | Existing membership/onboarding/invitation resolver | `PASS — CONTRACT VERIFIED`; impl deferred |
| PW12-ROUTE-003 | Authenticated `/login` | Existing bounce | `PASS — SOURCE VERIFIED` current; preserve |
| PW12-ROUTE-004 | Unauthenticated `/home` | Existing login redirect | `PASS — SOURCE VERIFIED` current; preserve |
| PW12-ROUTE-005 | Stale session | Fail-safe unauthenticated behaviour | `PASS — CONTRACT VERIFIED`; impl deferred |
| PW12-ROUTE-006 | Invitation | Admission-owned journey | `PASS — SOURCE VERIFIED` current; preserve |
| PW12-ROUTE-007 | Zero organization | Existing resolver | `PASS — SOURCE VERIFIED` current; preserve |
| PW12-ROUTE-008 | One completed organization | Existing resolver | `PASS — SOURCE VERIFIED` current; preserve |
| PW12-ROUTE-009 | Multiple organizations | Existing resolver | `PASS — SOURCE VERIFIED` current; preserve |
| PW12-ROUTE-010 | Incomplete onboarding | Existing resolver | `PASS — SOURCE VERIFIED` current; preserve |
| PW12-ROUTE-011 | Apex host | Externally/technically governed (`PW0-PB-034`) | `EXTERNALLY GATED` |
| PW12-ROUTE-012 | www host | Public canonical experience | `EXTERNALLY GATED` / later technical |

Do not modify routes or middleware in PW-12.

---

## 24. Protected-Boundary and Isolation Validation

| ID | Shared risk | Future rule | Regression |
| --- | --- | --- | --- |
| PW12-ISO-001 | Root layout | No global `lang` swap that breaks authenticated English | Fail if `/home`, `/login`, or AppShell document/UI language becomes Dutch; public Dutch `lang` must be route-scoped |
| PW12-ISO-002 | `globals.css` | No `:root` overwrite | Fail if authenticated Home/login/AppShell computed canvas, ink, or button tokens change; visual diff required |
| PW12-ISO-003 | Middleware | Preserve `/login` bounce and `/home` protection | Fail if authenticated `/login` bounce or unauthenticated `/home` redirect regresses |
| PW12-ISO-004 | Root route | Root Model A later; dual-use until then | Fail if unauthenticated `/` cannot keep the current login redirect until Model A ships, or if authenticated `/` stops resolving |
| PW12-ISO-005 | Metadata | No public metadata change before later authority | Fail if `src/app/layout.tsx` title/description/open-graph changes without later public-metadata authority |
| PW12-ISO-006 | Favicon | No change without shared-chrome authority | Fail if favicon path or bytes change without shared-chrome authority (`PW11-Q-012`) |
| PW12-ISO-007 | Site origin / hosts | Canonical unresolved | Fail only if PW-13 invents a canonical-host claim; ownership remains `PW0-PB-034` / external |
| PW12-ISO-008 | Shared buttons/links | Do not restyle login submit or AppShell | Fail if login submit becomes public teal filled-primary or AppShell link styles change |
| PW12-ISO-009 | Skip-link patterns | Public Dutch skip; do not restyle AppShell English skip | Fail if AppShell skip copy, target, or styling changes, or if public skip is missing |
| PW12-ISO-010 | Authentication state | Marketing page is unauthenticated desired `/`; never hold admitted users on marketing | Fail if an authenticated session remains on the public marketing page |

Route-scoped public tokens. Isolated Dutch public document language. No AppShell, login, or authenticated-navigation restyle.

---

## 25. Findings

| ID | Severity | Area | Evidence | Impact | Disposition | Correction required | Downstream | Publication blocker if later failed | Final status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW12-FND-001 | P2 | Evidence vocabulary | Analytical contrast could be misread as PASS | False a11y claim | Labelled analytical; VAL-022 deferred | none in PW-11 | PW-13 | yes | `OPEN — ASSIGNED` |
| PW12-FND-002 | P2 | Freeze vs publication | Freeze could be treated as ship authority | Premature publication | Freeze vocabulary in header | none | Review / PW-14 | yes | `OPEN — ASSIGNED` |
| PW12-FND-003 | P2 | Content-fit | Device stereotypes could replace fit testing | Wrong disclosure | `PW7-OD-014`; VAL-029 | none | PW-13 | yes | `OPEN — ASSIGNED` |
| PW12-FND-004 | P2 | Visitor validation | Comprehension untested | Misread maturity or Sign in | VAL-001–010 deferred with owners | none | Research after PW-13 | yes | `OPEN — ASSIGNED` |
| PW12-FND-005 | P2 | Browser postponement | Rendered checks delayed past publication | Inaccessible or untrue page ships | Deferred register blocks publication | none | PW-13 / PW-14 | yes | `OPEN — ASSIGNED` |
| PW12-FND-006 | P2 | Today / CS / access perception | Band, divider, panel can still be misread when rendered | Visual implication | VAL-006/007/030/031 | none | PW-13 | yes | `OPEN — ASSIGNED` |
| PW12-FND-007 | P2 | External | Legal footer and brand asset absent | Incomplete chrome | Q-011/012 | none | External | no for design freeze; yes for legal if invented | `OPEN — ASSIGNED` |

P0: 0. Unresolved P1: 0. P2: 7, all assigned. No PW-11 P0/P1 requiring a correction phase. Independent R1 findings are a separate family in §37.

---

## 26. Design-Freeze Register

The design contract is frozen for controlled implementation handoff. Rendered validation remains mandatory.

| ID | Subject | Source | Frozen rule | Permitted discretion | Prohibited | Required validation | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW12-FREEZE-001 | Audience | PW-2; PW11-PRIN-005 | `PW2-VIS-001` is brand-primary | none | Four equal audiences | VAL-002 | PW-13 |
| PW12-FREEZE-002 | Positioning | PW-3 | Quiet operational organiser; honest stop | none | Chatbot or coaching funnel positioning | VAL-001/003 | PW-13 |
| PW12-FREEZE-003 | Copy | PW-6 Route A2 | Exact sentences in §11 | none | Rewrite, English swap, CTA invention | source already; visitor later | PW-13 |
| PW12-FREEZE-004 | Navigation | PW-6; PW11-OD-001 | Four labels + `Navigatie` + utility `Inloggen` | CSS for wrap/disclose | Hamburger-only; modal drawer; hide Sign in | VAL-011/024/029 | PW-13 |
| PW12-FREEZE-005 | Hero | PW11-OD-006/007 | Natural H1 wrap; `space-8` top; no image; no CTA row | wrap points | Forced `<br>`; vh-hero | VAL-010/021 | PW-13 |
| PW12-FREEZE-006 | Closed beta | PW-6; PW10-OD-014 | Two early factual sentences | none | Pill, scarcity | VAL-004 | PW-13 |
| PW12-FREEZE-007 | Value | PW-6; PW-9 | Continuous editorial; anti-replacement attached | none | Feature cards | VAL-002 | PW-13 |
| PW12-FREEZE-008 | Mechanism | PW-6; PW-9 | Continuous after value | none | Tool-replacement implication | VAL-002 | PW-13 |
| PW12-FREEZE-009 | Today | PW11-OD-003 | Reading-column band; qualifier attached | none | Screenshot; dashboard card | VAL-006/030 | PW-13 |
| PW12-FREEZE-010 | Course Seller | PW11-OD-005 | Copy-measure divider; qualifier attached; no CTA | none | LMS edition card | VAL-007 | PW-13 |
| PW12-FREEZE-011 | Trust | PW-6; PW10-OD-012 | Named controls; plain text | optional semantic list of same three sentences | Shields, certification | VAL-008 | PW-13 |
| PW12-FREEZE-012 | Access | PW11-OD-004 | Reading-column enclosed panel; existing-account utility; honest stop | CSS for panel | Signup form; error chrome | VAL-009/031 | PW-13 |
| PW12-FREEZE-013 | Footer | PW9-OD-011 | Identity + divider | none | Mega-footer; invented legal | VAL-032 | PW-13 |
| PW12-FREEZE-014 | Visual direction | PW10-DIR-001 | Quiet Operational Editorial; light-first | none | Co-leading second direction | visual review | PW-13 |
| PW12-FREEZE-015 | Palette | PW-10/11 | `#F4F1EA` `#1A1916` `#5C574E` `#1F5C57` plus authorized neutrals | none | New brand colour | VAL-022 | PW-13 |
| PW12-FREEZE-016 | Typography | PW11-TYPE | System-first stack and roles | OS glyph differences | Webfont; giant H1 | VAL-021 | PW-13 |
| PW12-FREEZE-017 | Spacing | PW-10 SPACE; OD-007 | Reuse scale; `space-8` hero top | compression within RESP rules | Parallel scale; vh-hero | VAL-010 | PW-13 |
| PW12-FREEZE-018 | Containers | PW11-GEO | Wide 64rem; reading 40rem; copy-measure inside | CSS technique | 72ch wider than 40rem | VAL-020 | PW-13 |
| PW12-FREEZE-019 | Surfaces | PW11-SURF; PW10-OD-008/009 | One enclosed access panel; Today band; CS divider; modest radius ~0.25rem small / ~0.50rem panel; shadow-none default | CSS technique for the same surfaces | Card grid; drop-shadow hierarchy; pill beta; extra enclosed panels | VAL-030 | PW-13 |
| PW12-FREEZE-020 | Focus | PW8-OD-007 | 2px outline + 2px offset `#1F5C57` | equivalent visible indicator | Colour-only; clipped | VAL-017 | PW-13 |
| PW12-FREEZE-021 | Responsive behaviour | PW-7; PW11-RESP | Same truth; fit-driven disclosure; no carousel | exact fit px from testing | Device-only claims; sticky CTA | VAL-011–015 | PW-13 |
| PW12-FREEZE-022 | Interaction states | PW11-STATE | All 24 states | CSS selectors | Fake disabled; hover-only truth | VAL-016/024 | PW-13 |
| PW12-FREEZE-023 | Accessibility contract | PW-8; PW11-A11Y | 28 requirements as design law | native vs equivalent disclosure | Skip AppShell restyle; icon-only | VAL-016–019/025 | PW-13 |
| PW12-FREEZE-024 | Route isolation | PW10-OD-018 | Route-scoped tokens | file layout | `:root` leak | VAL-028 | PW-13 |
| PW12-FREEZE-025 | Authenticated bypass | PW-4 | Admitted users never held on marketing | resolver internals | Marketing trap | routing tests | PW-13 |
| PW12-FREEZE-026 | Metadata | PW6-OD-012 | Do not implement now | later authority | GA/AI overclaim titles | later | External / later |
| PW12-FREEZE-027 | Legal footer | PW11-Q-011 | Omitted until authority | none | Invented privacy/terms | legal | External |
| PW12-FREEZE-028 | Prohibited patterns | PW11-ANTI | All twenty anti-patterns remain prohibited | none | Screenshot, waitlist, four-TG grid | review | PW-13 |

Not frozen: React names, file organization, CSS methodology, test filenames, exact tested content-fit pixel, equivalent disclosure implementation, external legal content, favicon, deployment configuration.

---

## 27. Deferred-Validation Register

| ID | Source | Why not now | Prerequisite | Method | Artifact | Pass condition | Failure consequence | Owner | Blocks PW-13 completion | Blocks publication |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW12-DEFER-001 | VAL-010 | No render | Public page | Desktop walkthrough | notes | eight-cluster scan; required clusters present; not vh-hero | Missing/broken clusters: fix CSS, no copy rewrite; empty-luxury perception alone remains P2 | PW-13 | yes if required clusters missing or unreadable; no for subjective empty-luxury alone | yes if required content missing or unreadable; no for empty-luxury perception alone |
| PW12-DEFER-002 | VAL-011 | No render | Public page | 1024/768 fit | notes + widths | wrap then `Navigatie`; `Inloggen` visible | fix fit logic | PW-13 | yes | yes |
| PW12-DEFER-003 | VAL-012 | No render | Public page | 390 order | notes | same DOM truth | fix layout | PW-13 | yes | yes |
| PW12-DEFER-004 | VAL-013 | No render | Public page | 320 reflow | notes | no 2D core scroll; complete copy | fix geometry | PW-13 | yes | yes |
| PW12-DEFER-005 | VAL-014 | No render | Public page | 200% zoom | notes | no lost qualifier/control | fix reflow | PW-13 | yes | yes |
| PW12-DEFER-006 | VAL-015 | No render | Public page | text-spacing | notes | attached pairs survive | fix CSS | PW-13 | yes | yes |
| PW12-DEFER-007 | VAL-016 | No render | Public page | keyboard | notes | order = DOM; disclosure operable | fix markup | PW-13 | yes | yes |
| PW12-DEFER-008 | VAL-017 | No render | Public page | focus-visible | notes | 2px+2px not clipped | fix CSS | PW-13 | yes | yes |
| PW12-DEFER-009 | VAL-024; A11Y-023 | No component | Disclosure impl | keyboard + AT | notes | name `Navigatie`; expanded state | fix component | PW-13 | yes | yes |
| PW12-DEFER-010 | PW8-OD-015; VAL-016/024; A11Y-004/023 | No page; env | Public page | NVDA+Chromium | session notes | skip, headings, `Navigatie` name/state, Sign in, and access announced; no fabricated gaps | fix semantics; do not invent AT PASS | PW-13 | no solely because Apple VoiceOver is unavailable; yes if NVDA+Chromium is available and fails, or is skipped without an environment-gate record | yes until the planned NVDA+Chromium session is executed or formally recorded as environment-unavailable under `PW8-OD-015`; never fabricate |
| PW12-DEFER-011 | VAL-018 | No render | Public page | forced colours | notes | text, links, focus, essential border | fix CSS | PW-13 | yes | yes |
| PW12-DEFER-012 | VAL-019 | No render | Public page | reduced motion | notes | usable at 0ms | remove required motion | PW-13 | yes | yes |
| PW12-DEFER-013 | VAL-025 | No markup | Native fallback | disable JS | notes | core, skip, Sign in, access complete | fix progressive enhancement | PW-13 | yes | yes |
| PW12-DEFER-014 | VAL-021 | System fonts | Public page | wrap inspection | notes | no forced break; Dutch words wrap | fix CSS not copy | PW-13 | yes | yes |
| PW12-DEFER-015 | VAL-022 | No render | Public page | instrumented contrast | numbers | text ≥4.5:1; UI ≥3:1 where required; decorative borders stay decorative | retoken only with new authority | PW-13 | yes | yes |
| PW12-DEFER-016 | VAL-023 | No render | Public page | target measure | numbers | ≥24; prefer 44 header controls | fix padding | PW-13 | yes | yes |
| PW12-DEFER-017 | VAL-027 | No render | Public page | cross-browser sample | notes | no engine-only truth; core complete in sampled engines | fix CSS | PW-13 | yes if the implementation browser loses core content; no solely because an extra engine is unavailable | yes if a sampled engine loses core content or Sign in; no for system-font wrap variance alone |
| PW12-DEFER-018 | ROUTE-001/002 | Dual-use `/` current | PW-13 routing authority | route tests | tests | unauth public; auth resolver; Home closed | do not ship Model A | PW-13 | yes for Model A | yes |
| PW12-DEFER-019 | VAL-028 | No public CSS | Route-scoped tokens | diff Home/login/AppShell | diff | no leak | revert tokens | PW-13 | yes | yes |
| PW12-DEFER-020 | VAL-001–010 | No participants | Rendered page | governed expert then visitor | notes | no GA/signup/chatbot/LMS misread | copy/layout only with new authority | later research | no | yes before publication |
| PW12-DEFER-021 | VAL-030 | No render | Public page | Today band versus card | notes | qualifier visible; not dashboard | reduce surface | PW-13 | yes | yes |
| PW12-DEFER-022 | VAL-031 | No participants | Public page | access meaning | notes | not error or conversion | restyle panel | PW-13 / research | yes | yes |

---

## 28. Risks

| ID | Risk | Severity | Likelihood | Mitigation | Owner | Closure evidence |
| --- | --- | --- | --- | --- | --- | --- |
| PW12-RSK-001 | Analytical PASS mistaken for rendered PASS | P0 if claimed | medium | vocabulary; VAL-022 stays deferred | PW-13 | no PASS language |
| PW12-RSK-002 | Design freeze mistaken for publication | P0 if shipped | medium | freeze ≠ deployed | Review / PW-14 | publication gate |
| PW12-RSK-003 | Implementation drifts from frozen copy | P0 | medium | quote PW-6; tests on strings | PW-13 | string tests |
| PW12-RSK-004 | Content-fit chosen by device stereotype | P1 | medium | `PW7-OD-014` | PW-13 | measured threshold |
| PW12-RSK-005 | Mobile qualifier loss | P1 | medium | RESP-007; A11Y-011 | PW-13 | 320/zoom notes |
| PW12-RSK-006 | Today visual dominance | P1 | medium | OD-003; quiet band | PW-13 | VAL-030 |
| PW12-RSK-007 | Course Seller brand capture | P1 | medium | OD-005; qualifier | PW-13 | VAL-007 |
| PW12-RSK-008 | Trust-as-certification | P1 | medium | plain text | PW-13 | VAL-008 |
| PW12-RSK-009 | Access-as-conversion | P1 | medium | OD-004; no filled CTA | PW-13 | VAL-031 |
| PW12-RSK-010 | Focus weakened in CSS | P1 | medium | 2px+2px frozen | PW-13 | VAL-017 |
| PW12-RSK-011 | Low-contrast border used as meaning | P1 | medium | decorative-only | PW-13 | VAL-022 |
| PW12-RSK-012 | Public tokens leak to auth UI | P0 | medium | route-scoped; no `:root` | PW-13 | VAL-028 |
| PW12-RSK-013 | Root-routing regression | P0 | medium | preserve resolver until Model A | PW-13 | existing tests |
| PW12-RSK-014 | Authenticated users trapped on marketing | P0 | medium | auth branch of `/` | PW-13 | resolver tests |
| PW12-RSK-015 | Dutch `lang` leaks into authenticated UI | P1 | medium | route-scoped language | PW-13 | A11Y-027 |
| PW12-RSK-016 | External legal links invented | P1 | low | omit until authority | PW-13 | STATE-022 |
| PW12-RSK-017 | Screenshot or asset added in impl | P1 | medium | ANTI; no slot | PW-13 | review |
| PW12-RSK-018 | Four target groups as equal cards | P1 | low | prohibited grid | PW-13 | review |
| PW12-RSK-019 | Generic AI visual treatment | P1 | medium | no orb; AI inactive | PW-13 | VAL-003 |
| PW12-RSK-020 | Visitor validation never performed | P2 | medium | DEFER-020 | Research | notes |
| PW12-RSK-021 | Browser validation postponed beyond publication | P0 if published | medium | publication blocker flags | PW-14 | gates |
| PW12-RSK-022 | Ungoverned design exceptions | P1 | medium | freeze register | Review | change control |
| PW12-RSK-023 | Primary AT count of zero misread as waived screen-reader gate | P1 if waived | medium | Secondary AT table; `PW12-DEFER-010`; A11Y-004/023 | PW-13 | SR session or environment-gate record |

---

## 29. Open Questions

Owner-assembly questions remain 0. Technical and external questions remain gated.

| ID | Question | Class | Status |
| --- | --- | --- | --- |
| PW12-Q-001 | Rendered contrast on implemented page | PW-13 | `OPEN — PW-13` (analytical done) |
| PW12-Q-002 | Measured nav-fit threshold | PW-13 | `OPEN — PW-13` |
| PW12-Q-003 | Isolation CSS form | PW-13 | `OPEN — PW-13` (`PW11-Q-010`) |
| PW12-Q-004 | Legal footer | External | `EXTERNALLY GATED` |
| PW12-Q-005 | Favicon / brand asset | External | `EXTERNALLY GATED` |
| PW12-Q-006 | Optional visited-link style | Visual later | `PARTIALLY RESOLVED` same-as-default |
| PW12-Q-007 | Visitor comprehension study | Research | `OPEN — AFTER IMPLEMENTATION` |
| PW12-Q-008 | Canonical host | External / technical | `EXTERNALLY GATED` (`PW0-PB-034`) |
| PW12-Q-009 | Screen-reader environment availability | PW-13 | `OPEN — ENVIRONMENT-DEPENDENT` |
| PW12-Q-010 | Exact disclosure native versus button-region | PW-13 | `OPEN — IMPLEMENTATION DISCRETION` within freeze |

---

## 30. Traceability

Missing IDs: 0. Invalid uses: 0. HOLD/PROHIBIT used as positive claims: 0. Orphan freeze records: 0. Orphan deferred validations: 0.

| ID | Maps | Upstream |
| --- | --- | --- |
| PW12-MAP-001 | Boundaries | `PW0-PB-034`; Home closure `49cd5773976143139a154f9b8ddf36535a4dd914` |
| PW12-MAP-002 | Truth | PW-1 ceiling; `PW12-TRUTH-001` through `PW12-TRUTH-033` |
| PW12-MAP-003 | Visitor | `PW2-VIS-001`; `PW12-FREEZE-001` |
| PW12-MAP-004 | Positioning | `PW3-MSG-014`; `PW12-FREEZE-002` |
| PW12-MAP-005 | IA / root | `PW4-OD-001`; `PW12-ROUTE-001` through `PW12-ROUTE-012` |
| PW12-MAP-006 | Content model | PW-5 blocks via PW-6 Route A2 |
| PW12-MAP-007 | Copy | `PW6-OD-002`; `PW12-COPY-001` through `PW12-COPY-030` |
| PW12-MAP-008 | Responsive | `PW7-OD-001` through `PW7-OD-014`; `PW12-GEO-001` through `PW12-GEO-012` |
| PW12-MAP-009 | Accessibility | `PW8-OD-001` through `PW8-OD-016`; `PW12-A11Y-001` through `PW12-A11Y-028` |
| PW12-MAP-010 | Wireframes | `PW9-OD-001` through `PW9-OD-012`; `PW12-COMP-001` through `PW12-COMP-012` |
| PW12-MAP-011 | Visual system | `PW10-OD-001` through `PW10-OD-020`; `PW12-CONTRAST-001` through `PW12-CONTRAST-016` |
| PW12-MAP-012 | High-fidelity | `PW11-DESIGN-001`; `PW11-OD-001` through `PW11-OD-007` |
| PW12-MAP-013 | VAL disposition | `PW11-VAL-001` through `PW11-VAL-032`; `PW12-VDISP-001` through `PW12-VDISP-032` |
| PW12-MAP-014 | States | `PW11-STATE-001` through `PW11-STATE-024`; `PW12-STATE-001` through `PW12-STATE-024` |
| PW12-MAP-015 | Isolation | `PW10-OD-018`; `PW12-ISO-001` through `PW12-ISO-010` |
| PW12-MAP-016 | Freeze | `PW12-FREEZE-001` through `PW12-FREEZE-028` |
| PW12-MAP-017 | Deferred | `PW12-DEFER-001` through `PW12-DEFER-022` |
| PW12-MAP-018 | Honest stop | `PW6-ACCESS-010`; `PW11-OD-004` |
| PW12-MAP-019 | Header/nav | `PW11-OD-001`; `PW11-OD-002`; `PW12-NAV-001` through `PW12-NAV-012` |
| PW12-MAP-020 | Today / CS | `PW11-OD-003`; `PW11-OD-005` |

---

## 31. Acceptance Register

AND logic. Deferred rendered, AT, visitor, and Production checks are accepted only as governed deferrals with owners and publication consequences. They are not listed as executed PASS.

| ID | Topic | Status |
| --- | --- | --- |
| PW12-ACC-001 | Authority integrity | `PASS — SOURCE VERIFIED` |
| PW12-ACC-002 | PW-11 closure | `PASS — SOURCE VERIFIED` |
| PW12-ACC-003 | Copy fidelity | `PASS — SOURCE VERIFIED` |
| PW12-ACC-004 | Owner-decision integrity | `PASS — SOURCE VERIFIED` |
| PW12-ACC-005 | Contrast analysis | `PASS — ANALYTICALLY VERIFIED` (hex arithmetic only; not `PW11-VAL-022`) |
| PW12-ACC-006 | Responsive arithmetic | `PASS — ANALYTICALLY VERIFIED` (conceptual 320 border-box; not browser reflow) |
| PW12-ACC-007 | Typography contract | `PASS — CONTRACT VERIFIED` |
| PW12-ACC-008 | Composition | `PASS — CONTRACT VERIFIED` |
| PW12-ACC-009 | Density | `PASS — CONTRACT VERIFIED`; perception deferred |
| PW12-ACC-010 | Header and navigation | `PASS — CONTRACT VERIFIED`; keyboard/browser deferred |
| PW12-ACC-011 | Accessibility contract | `PASS — CONTRACT VERIFIED` (not accessibility PASS; not WCAG conformant) |
| PW12-ACC-012 | Interaction states | `PASS — CONTRACT VERIFIED` (no state implemented) |
| PW12-ACC-013 | Product truth | `PASS — SOURCE VERIFIED`; visual implication deferred |
| PW12-ACC-014 | Premium contract | `PASS — CONTRACT VERIFIED`; look deferred |
| PW12-ACC-015 | Executability | `PASS — CONTRACT VERIFIED` |
| PW12-ACC-016 | Route contract | `PASS — CONTRACT VERIFIED`; actual route change deferred |
| PW12-ACC-017 | Isolation contract | `PASS — CONTRACT VERIFIED`; regression after implementation |
| PW12-ACC-018 | Deferred-validation ownership | `PASS — CONTRACT VERIFIED` |
| PW12-ACC-019 | Zero P0 | `PASS` after R1 corrections |
| PW12-ACC-020 | Zero unresolved P1 | `PASS` after R1 corrections |
| PW12-ACC-021 | Design freeze | `PASS — CONTRACT VERIFIED` (not publication; not PW-13 authorization) |
| PW12-ACC-022 | No implementation | `PASS — SOURCE VERIFIED` |
| PW12-ACC-023 | File integrity | `PASS` after R1 appendix check |

---

## 32. PW-13 Handoff

PW-13, when separately authorized after PW-12 final verification, implements the frozen contract on a route-scoped public surface without mutating AppShell, `/login`, `/home`, or `globals.css` `:root`. It must preserve exact Route A2 copy, execute deferred browser/AT/no-JS/isolation/routing checks, and treat failures listed as publication blockers as blockers. This R1 file does not authorize implementation.

---

## 33. PW-14 Handoff

PW-14 remains publication, legal, and Production verification territory. Design freeze does not authorize indexation, legal footer invention, or Production claims.

---

## 34. Gate Logic

Establishment passes only if repository state is exact; authorities present; PW-11 closure reconciles; frozen copy matches; all 32 VAL records are dispositioned; contrast reconciles; geometry, type, composition, navigation, a11y contract, states, truth, premium, executability, routing, and isolation are coherent; no P0 or unresolved P1; every P2 and deferred item has an owner; freeze scope is explicit; no implementation; no existing file changes; file integrity passes.

Deferred browser-dependent validation does not block design-contract freeze when contract, method, owner, and publication-blocking consequence are explicit. It is not reported as passed.

---

## 35. Final Status

```text
PASS — PW-12 HIGH-FIDELITY DESIGN CONTRACT VALIDATED AND FROZEN
PW-12 DESIGN VALIDATION ESTABLISHED — READY FOR INDEPENDENT REVIEW
```

Historical establishment status above is retained. Independent R1 result is in §37.

The design contract is frozen for controlled implementation handoff. Rendered validation remains mandatory. Accessibility PASS is not claimed. WCAG conformance is not claimed. Browser validation is not claimed. Visitor validation is not claimed. Implementation is not authorized until PW-12 closes through review and final verification.

Not used: `CLOSED WITH EVIDENCE — PW-12`; `PW-13 AUTHORIZED`; `IMPLEMENTATION COMPLETE`; `PUBLICATION READY`; `ACCESSIBILITY PASS`; `WCAG COMPLIANT`; `BROWSER VERIFIED`; `PRODUCTION VERIFIED`.

---

## 36. Evidence Appendix

### 36.1 Identifier census

| Family | From | To | Count |
| --- | ---: | ---: | ---: |
| PW12-AUTH | 001 | 015 | 15 |
| PW12-COPY | 001 | 030 | 30 |
| PW12-VDISP | 001 | 032 | 32 |
| PW12-CONTRAST | 001 | 016 | 16 |
| PW12-GEO | 001 | 012 | 12 |
| PW12-TYPE | 001 | 013 | 13 |
| PW12-COMP | 001 | 012 | 12 |
| PW12-NAV | 001 | 012 | 12 |
| PW12-A11Y | 001 | 028 | 28 |
| PW12-STATE | 001 | 024 | 24 |
| PW12-TRUTH | 001 | 033 | 33 |
| PW12-PREMIUM | 001 | 012 | 12 |
| PW12-EXEC | 001 | 005 | 5 |
| PW12-ROUTE | 001 | 012 | 12 |
| PW12-ISO | 001 | 010 | 10 |
| PW12-FND | 001 | 007 | 7 |
| PW12-FREEZE | 001 | 028 | 28 |
| PW12-DEFER | 001 | 022 | 22 |
| PW12-RSK | 001 | 023 | 23 |
| PW12-Q | 001 | 010 | 10 |
| PW12-MAP | 001 | 020 | 20 |
| PW12-ACC | 001 | 023 | 23 |
| **Total** |  |  | **399** |

Establishment main census before R1 was 398. R1 added `PW12-RSK-023` only. `PW12-R1-FND-001` through `PW12-R1-FND-020` are a separate family and are not included in 399.

### 36.2 Contrast method

Independent Node evaluation of WCAG 2.x relative luminance, sRGB, two-decimal half-up rounding. Temporary calculator was not stored in the repository.

### 36.3 What this file is not

Not CSS. Not a rendered page. Not a contrast PASS. Not an accessibility PASS. Not PW-13 authorization.

### 36.4 Protected-boundary confirmation

No product file is changed by this phase. Authenticated Home remains closed. Current `/` remains dual-use redirect for unauthenticated visitors.

### 36.5 VAL group proof

1 + 2 + 17 + 12 = 32. Source 0 + analytical 0 + AT 0 primary + external 0. Secondary AT is recorded and does not change the primary total.

---

## 37. R1 Independent High-Fidelity Design Validation and Freeze Review Evidence

Independent review treated establishment PASS, analytical results, freeze completeness, dispositions, and acceptance records as hypotheses. PW-11 was not modified. Frozen Route A2 copy was not rewritten. Owner decisions were not changed. No implementation occurred.

### 37.1 Preflight

| Check | Result |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `085c40e5bd0fced04f2b2c847c5194c72737458c` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Ahead/behind | 0 0 after `git fetch origin` |
| Staged | none |
| Unstaged tracked | none |
| Untracked at start | exactly `docs/phases/PW-12-high-fidelity-design-validation-freeze.md` |
| Instruction files | No `AGENTS.md`, nested `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules` found. Binding authorities in §6 applied. No instruction conflict. |
| PW-13 | Not present; not started |

### 37.2 Authority and independence

PW-1 remains the public-truth ceiling. PW-6 remains frozen Route A2 copy. PW-7 through PW-11 remain closed authorities. Previous PASS statements were re-checked. Analytical contrast was recalculated. Deferred tests were not treated as passed. Design freeze is not implementation authorization and is not publication readiness. Owner approval is not user validation.

### 37.3 Protected-boundary review

Current unauthenticated `/` still redirects to `/login`. Root `lang="en"`. Authenticated Home remains closed at `49cd5773976143139a154f9b8ddf36535a4dd914` / product `d110b6e3da5c690b31a68a0b145b7b6521c10828`. PW-12 still authorizes no route, CSS, middleware, metadata, or shared-primitive change.

### 37.4 PW-11 closure review

Commit `085c40e5bd0fced04f2b2c847c5194c72737458c` is HEAD and the PW-11 closure SHA. The PW-11 file retains `PW-11 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` as the last in-file status string; authorized FV/commit language lives in the closure commit and this register. Main census 341. R1 findings 22. P0 0. Unresolved P1 0. P1 corrected 13. P2 9. Owner decisions 7 resolved, 0 open. Seven owner decisions, Route A2 copy, eight visual clusters, ten semantic regions, fourteen REGION records, PW-7/8/9/10 rules, and protected boundaries were not reinterpreted as new design.

### 37.5 Frozen-copy review

All thirty `PW12-COPY` records were compared to PW-6 and PW-11. Active mismatches: 0. `programma’s` remains U+2019. `bèta` remains U+00E8. `Today` capitalization is preserved. BOS remains omitted. `PW6-AI-002` remains inactive. Skip chrome remains PW-8. `Navigatie` remains owner-frozen chrome. No CTA invention. No unauthorized mobile shortening beyond `Bèta`.

### 37.6 Disposition audit

Primary classes after independent audit, summing to 32:

| Group | Primary count |
| --- | ---: |
| Source-verifiable now | 0 |
| Analytically verifiable now | 0 |
| Contract-verifiable now | 1 |
| Implementation-dependent | 2 |
| Browser-dependent | 17 |
| Assistive-technology-dependent | 0 |
| User-validation-dependent | 12 |
| Externally gated | 0 |
| **Total** | **32** |

No unexecuted rendered validation is labelled PASS. `PW11-VAL-022` remains deferred. Secondary dependencies are now explicit. Primary AT 0 is retained because no `PW11-VAL` row is solely a screen-reader test.

### 37.7 Contrast recalculation

Independent WCAG 2.x relative-luminance recalculation (sRGB linearization; `(L1+0.05)/(L2+0.05)`; half-up to two decimals). Temporary calculator was not stored in the repository. Frozen hex values were not changed.

| Pair | Exact | Round 2 | Role check |
| --- | ---: | ---: | --- |
| `#1A1916` / `#F4F1EA` | 15.584682 | 15.58 | text permitted |
| `#1A1916` / `#FFFFFF` | 17.579692 | 17.58 | text permitted |
| `#1A1916` / `#EBE6DC` | 14.134592 | 14.13 | text permitted |
| `#3F3C36` / `#F4F1EA` | 9.742119 | 9.74 | text permitted |
| `#3F3C36` / `#EBE6DC` | 8.835655 | 8.84 | text permitted |
| `#5C574E` / `#F4F1EA` | 6.357446 | 6.36 | footer identity; not essential claim if used alone as muted |
| `#5C574E` / `#EBE6DC` | 5.765912 | 5.77 | non-required chrome |
| `#1F5C57` / `#F4F1EA` | 6.827499 | 6.83 | links; not colour-only |
| `#1F5C57` / `#FFFFFF` | 7.701494 | 7.70 | links; not colour-only |
| `#1F5C57` / `#EBE6DC` | 6.192229 | 6.19 | links; not colour-only |
| `#174843` / `#F4F1EA` | 9.106140 | 9.11 | hover; not sole cue |
| `#8A8376` / `#FFFFFF` | 3.757531 | 3.76 | UI border; not body text |
| `#8A8376` / `#F4F1EA` | 3.331113 | 3.33 | UI border; not body text |
| `#C9C2B4` / `#F4F1EA` | 1.569813 | 1.57 | decorative only |
| `#E4DFD4` / `#F4F1EA` | 1.177941 | 1.18 | decorative only |
| `#EBE6DC` / `#F4F1EA` | 1.102592 | 1.10 | Today/canvas surface difference; not a text pair |

All sixteen round-2 values match the establishment table. Analytical PASS is not rendered PASS. Surface difference is not the sole section boundary. Focus and maturity remain non-colour-only in the contract.

### 37.8 Geometry audit

1440 / 1280 / 1024 / 768 / 390 / 320, 200% zoom, text-spacing, and landscape contracts remain coherent. Container precedence is unchanged. No vh-hero, no negative margins, no required horizontal scrolling, no fixed-height sections. 320 arithmetic: 320 − 32 = 288 inner page; access inner text 246 CSS px under border-box and 1.25rem padding plus 1px borders. Focus offset has external room in 16px page-inline. 44px targets fit in 246. Real reflow remains deferred.

### 37.9 Typography audit

System-first only. No external font. One H1. Natural wrapping. Qualifier floor 0.9375rem. Explicit line heights. No harmful letter-spacing. No exact screenshot line break. 60–72ch is not a narrow-width physical-fit requirement. Access H2 is H2 scale, not closed-beta scale. Font metrics remain deferred.

### 37.10 Composition and density audit

One primary design, eight visual clusters, ten semantic regions, fourteen REGION records, enclosed occupancy 1/1/1, Today band, Course Seller divider, plain trust, identity footer. No screenshot, feature grid, target-group grid, CTA row, right rail, or mega-footer. Contract density is distinct from rendered perception. Empty-luxury and unstyled-document perception remain deferred.

### 37.11 Header and navigation audit

Contract still prohibits `/home` brand link, sticky header, modal drawer, hamburger-only labeling, hidden Sign in, filled primary acquisition styling, dead anchors, `href="#"`, animation-required access, and JavaScript-only essential information. `Navigatie` and the 1px separator remain exact. Candidate anchors remain unimplemented. Keyboard/disclosure/browser behaviour remain deferred.

### 37.12 Accessibility audit

All 28 `PW11-A11Y` records now have contract status, implementation/browser/AT flags, future evidence, owner, and publication-blocker status. Complete documentation is not an accessibility PASS. Secondary AT exists despite primary VAL AT = 0.

### 37.13 State audit

All 24 states remain contract-complete and unimplemented. Disclosure collapsed/expanded and skip-focused require AT. No state is marked implemented.

### 37.14 Product-truth audit

33 misinterpretation checks remain. Unsupported positive claims: 0. Prohibited CTA controls: 0. Equal-availability implications: 0. Visual-convention rows with later render = yes are not rendered PASS.

### 37.15 Premium-quality audit

Anti-template coverage remains contract-based. Actual look and empty-luxury perception remain deferred.

### 37.16 Executability audit

PW-13 can implement order, containers, type, color, surfaces, radii, shadow-none, focus, navigation, disclosure, copy, and prohibitions without inventing them. Permitted discretion remains names, files, CSS technique, tests, equivalent disclosure mechanics, and measured content-fit threshold. Material remaining ambiguity after R1 corrections: none found.

### 37.17 Routing audit

Current unauthenticated `/` redirect is distinguished from desired public `/`. Authenticated resolver, `/login` bounce, `/home` protection, invitation, organization, onboarding, stale-session, and host questions remain correctly classified. PW-12 does not authorize middleware changes. Root Model A remains desired. Canonical host remains externally gated.

### 37.18 Isolation audit

Shared-risk rows now have fail-if regression gates. Route-scoped tokens, no `:root` replacement, no authenticated-shell restyle, no login restyle, no Dutch leakage into authenticated English UI, no metadata publication before later authority.

### 37.19 Freeze-register audit

All 28 freeze records remain. Surfaces freeze now states modest radii and shadow-none explicitly. Orphan freeze records: 0.

### 37.20 Deferred-validation audit

All 22 deferred records remain. Methods, owners, PW-13-completion, and publication consequences were tightened for desktop walkthrough, screen-reader environment, and cross-browser sampling. No deferred item is marked passed.

### 37.21 Risk and question audit

Establishment P2 findings remain 7 and assigned. Risks are now 23 after `PW12-RSK-023`. Open owner-assembly decisions remain 0. Legal footer, brand asset, and canonical host remain externally gated.

### 37.22 Traceability audit

MAP ranges expanded to first-and-last full IDs. Cited OD ranges exist in PW-7 through PW-11. Missing IDs: 0. Invalid IDs: 0. HOLD/PROHIBIT used positively: 0. Orphan freeze, defer, acceptance, and analytical records: 0.

### 37.23 Acceptance audit

AND logic retained. Deferred rendered checks are governed deferrals, not executed PASS. `PW12-ACC-011` is contract completeness, not accessibility PASS. `PW12-ACC-005` is analytical hex arithmetic, not `PW11-VAL-022`.

### 37.24 R1 findings

| ID | Severity | Area | Evidence | Impact | Before state | Correction or disposition | Affected IDs | Downstream | Publication consequence | Final status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW12-R1-FND-001 | P1 | Disposition | Secondary impl/browser/AT dependencies were omitted | Double-count risk or waived AT | Primary-only table | Secondary-dependency table added | VDISP; VAL-016/024/025/028 | PW-13 | AT/browser still block publication | `CORRECTED` |
| PW12-R1-FND-002 | P1 | Accessibility mapping | A11Y rows lacked owner, evidence, and blocker columns | Unenforceable later gate | Classes-only table | Full mapping table | A11Y-001 through 028 | PW-13 | Failed a11y contract blocks publication | `CORRECTED` |
| PW12-R1-FND-003 | P1 | Typography | Access H2 said “same as TYPE-006”, which is closed-beta in this file | Wrong H2 size in PW-13 | `PW12-TYPE-011` | Remapped to H2 / `PW11-TYPE-006` | TYPE-011 | PW-13 | Wrong hierarchy would block publication | `CORRECTED` |
| PW12-R1-FND-004 | P1 | Composition | One-H1 row cited TYPE-003 (disclosure) | False H1 ID | `PW12-COMP-005` | Cite `PW11-TYPE-003` / `PW12-TYPE-004` | COMP-005 | PW-13 | Clerical; corrected | `CORRECTED` |
| PW12-R1-FND-005 | P1 | Traceability | MAP used truncated numeric suffixes instead of full IDs | Unverifiable citations | MAP-005 through 019 | First-and-last full IDs | MAP-002 through 019 | Review | Incomplete handoff | `CORRECTED` |
| PW12-R1-FND-006 | P1 | Geometry | 320 arithmetic omitted box-sizing | Padding could overflow 288 | GEO-006 table | Border-box assumption and content-box prohibition documented | GEO-006 | PW-13 | Overflow would block publication | `CORRECTED` |
| PW12-R1-FND-007 | P1 | Product truth | Visual-convention rows looked like rendered PASS | False visual closure | TRUTH status column | Explicit later-render deferral note | TRUTH-001 through 033 | PW-13 | Visual implication still deferred | `CORRECTED` |
| PW12-R1-FND-008 | P1 | Acceptance | ACC-005/011/012 could be read as rendered or a11y PASS | False evidence | Bare PASS labels | Qualified as analytical/contract only | ACC-005 through 012 | Review | No a11y/browser PASS claimed | `CORRECTED` |
| PW12-R1-FND-009 | P1 | Deferred gates | DEFER-001/010/017 blockers were too weak or advisory | Item could disappear | no/no or env-only | Enforceable PW-13 and publication language | DEFER-001; 010; 017 | PW-13 / PW-14 | Publication remains gated | `CORRECTED` |
| PW12-R1-FND-010 | P1 | Isolation | Metadata and favicon regressions were review-named, not fail-if | Ungated shared chrome | ISO-005/006 | Executable fail-if gates | ISO-001 through 010 | PW-13 | Shared-chrome change blocks | `CORRECTED` |
| PW12-R1-FND-011 | P1 | AT classification | Summary said AT 0 “covered under A11Y mapping” without listing secondaries | SR could be treated as waived | Group-count row | Explicit primary-versus-secondary reconciliation | VDISP; DEFER-010; A11Y-004/023 | PW-13 | SR remains a publication gate | `CORRECTED` |
| PW12-R1-FND-012 | P1 | Freeze completeness | Radii and shadow-none were only implicit in surfaces | Implementer could add elevation | FREEZE-019 | Explicit modest radius and shadow-none | FREEZE-019 | PW-13 | Elevation theatre prohibited | `CORRECTED` |
| PW12-R1-FND-013 | P2 | Type ID families | PW12-TYPE numbering differs from PW11-TYPE | Confusion only | No crosswalk | Crosswalk added | TYPE-001 through 013 | PW-13 | Residual naming risk | `LATER-GATED` |
| PW12-R1-FND-014 | P2 | Rendered evidence | Browser/zoom/focus/contrast/target checks remain unexecuted | Cannot ship | Deferred register | Remain deferred with owners | DEFER-002 through 016 | PW-13 | Block publication if failed | `LATER-GATED` |
| PW12-R1-FND-015 | P2 | User validation | Comprehension untested | Misread Sign in or maturity | VAL-001 through 010 | Remain DEFER-020 | DEFER-020; FND-004 | Research | Block publication if failed | `LATER-GATED` |
| PW12-R1-FND-016 | P2 | Analytical contrast | Hex ratios are not rendered measurements | False WCAG claim | VAL-022 deferred | Remain deferred | CONTRAST; VAL-022 | PW-13 | Block publication if failed | `LATER-GATED` |
| PW12-R1-FND-017 | P2 | Density perception | Empty-luxury/unstyled look untested | Polish only | COMP-012; PREMIUM-010/011 | Remain deferred | VAL-010; DEFER-001 | PW-13 | Perception alone is not a freeze defect | `LATER-GATED` |
| PW12-R1-FND-018 | P2 | Content-fit | Exact fit pixel is discretion | Device stereotype risk | EXEC-003 | Remain measured-not-named | VAL-029; FND-003 | PW-13 | Wrong disclosure blocks publication | `LATER-GATED` |
| PW12-R1-FND-019 | P2 | External | Legal footer, favicon, canonical host unresolved | Incomplete chrome | Q-004/005/008 | Remain externally gated | FREEZE-026/027; ROUTE-011/012 | External | Do not invent legal or host claims | `LATER-GATED` |
| PW12-R1-FND-020 | P2 | AT residual | Primary AT count remains 0 after correction | Misread risk | Group table | `PW12-RSK-023` | RSK-023; DEFER-010 | PW-13 | Waiving SR would be P1/P0 | `LATER-GATED` |

P0 remaining: 0. P1 remaining: 0. P1 corrected: 12. P2 later-gated in this family: 8. Establishment `PW12-FND-001` through `007` remain assigned P2.

### 37.25 Corrections

Documentation-only corrections in this file: secondary VAL dependencies; A11Y mapping completeness; Access H2 remapping; H1 ID correction; MAP expansion; 320 box-sizing; truth later-render note; ACC qualifications; DEFER blocker language; ISO fail-if gates; AT reconciliation; surfaces freeze radii/shadow; TYPE crosswalk; `PW12-RSK-023`; this section. No PW-11 edit. No copy rewrite. No owner-decision change. No code.

### 37.26 Remaining later gates

Implementation; browser reflow and zoom; keyboard and focus; disclosure behaviour; NVDA+Chromium; forced colours; reduced motion; no-JS; rendered contrast; target size; isolation diffs; routing Model A; visitor comprehension; legal footer; favicon; canonical host; Production verification; publication.

### 37.27 Final census

Main registers: 399. Separate R1 findings: 20. Families remain unique and contiguous. Historical establishment mentions of 398 are superseded by the R1 census except as history.

### 37.28 File-integrity evidence

Only this untracked PW-12 file is in scope. No staged file. No tracked file changed. No product, route, CSS, test, config, dependency, or asset change. Authenticated Home unchanged. Unique contiguous IDs. No trailing whitespace. One terminating newline. CRLF preserved. Balanced fences. No duplicate H2 headings. No conflict markers. No leftover work-marker tokens. No secrets.

### 37.29 Gate result

```text
PASS — PW-12-R1 INDEPENDENT DESIGN VALIDATION & FREEZE REVIEW CLOSED WITH EVIDENCE
```

### 37.30 Resulting status

```text
PW-12 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

Not used: `CLOSED WITH EVIDENCE — PW-12`; `PW-13 AUTHORIZED`; `IMPLEMENTATION READY`; `PUBLICATION READY`; `ACCESSIBILITY PASS`; `WCAG COMPLIANT`; `BROWSER VERIFIED`; `PRODUCTION VERIFIED`. Final verification and commit require separate authorization. PW-13 was not started.
