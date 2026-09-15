# PW-5 — Homepage Content Model

| Field | Value |
| --- | --- |
| Document | PW-5 — Homepage Content Model |
| Type | Content schema, evidence/qualifier authority, and copy-input contract (not copy, not wireframes, not implementation) |
| Date | 2026-09-15 |
| Branch | `core/platform-readiness-20260707` |
| HEAD at drafting | `c6f4489bc5cbf9306b4784320cc747975209caeb` |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Binding closures | PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; PW-3 `9c12c977383a100eb548880d8d35b329b4406f90`; PW-4 `c6f4489bc5cbf9306b4784320cc747975209caeb` |
| Authenticated Home | Closure `49cd5773976143139a154f9b8ddf36535a4dd914`; Production product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Establishment status (historical) | `CONDITIONAL — PW-5 OWNER CONTENT-MODEL DECISIONS REQUIRED` — see §38.1; superseded as current status by §39, §41, and §42 |
| Independent R1 | §42 — `PW5-R1-FND-001` … `PW5-R1-FND-023` |
| Current status | `PW-5 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` |

---

## 1. Document Control

This file is the sole PW-5 deliverable. It freezes **content-block roles, fields, evidence mapping, and copy-input constraints** for the desired public homepage. It does not freeze publication copy, visual layout, components, or routes.

| Control | Rule |
| --- | --- |
| Product code | Unchanged by this phase |
| Authenticated Home | Closed; not reopened; not a public demo |
| Dual-use `/` | Not mutated; Root Model A remains desired IA only |
| Copy | Not written; placeholders are semantic roles, not sentences |
| Wireframes / visual design | Out of scope |
| Assets / screenshots | Not created; not copied from product data |
| Implementation | Forbidden in PW-5 |
| PW-6 | Not started |
| Owner content-model freeze | `EXPLICIT ZYNTIXAI OWNER HOMEPAGE CONTENT-MODEL DECISION` (2026-09-15). V1 content-model choices in `PW5-OD-001`–`008` are frozen as specified in §35 and §41. This is not visitor research, Production proof, final copy, legal approval, screenshot approval, visual design, implementation, or publication authority. |

`CONTENT MODEL READY ≠ COPY READY ≠ DESIGN READY ≠ IMPLEMENTATION READY ≠ PUBLICATION READY`

`CONTENT-MODEL DECISION ≠ FINAL COPY ≠ VISUAL DESIGN ≠ IMPLEMENTATION ≠ PUBLICATION`

No content block in this file is `PUBLICATION READY`. Owner content-model decisions: **8 fully resolved**, **0 partial**, **0 open**. Remaining gates are copy, design, legal, destination, technical, and publication gates — not reopeners of the frozen V1 content-model choices.

---

## 2. Executive Decision

PW-4 closed a professional public information architecture. PW-5 translates that architecture into a **component-neutral content model** for the first public ZyntixAI homepage (Site Model A, desired Root Model A).

The first public homepage must help `PW2-VIS-001` recognize, in plain language, that ZyntixAI is a product for organizing daily business work — customers, work, responsibilities, progress, and next attention — without presenting a chatbot, a complete suite, a public LMS, or general availability.

**Owner-frozen V1 content model:** Site Model A remains the IA. Header + identity + value + early Layer-B closed beta + mechanism + primary Today/Home proof + one compact qualified Course Seller relevance block + compact named-controls trust + later two-layer access/honest stop with Sign in in header and the access block + footer. Deferred target-group content is omitted from V1. There is no standalone AI section. Text is first; one optional abstract evidence-safe operational-system visual may later be prepared; product screenshots remain HOLD. `REQUIRED CONTENT ROLE ≠ HERO PROMINENCE ≠ COMPLETE EDITION CLAIM`. `HONEST STOP = VALID JOURNEY OUTCOME, NOT A DEAD END`.

Establishment recorded eight OPEN owner decisions. Those decisions are now frozen (§35, §41). Exact copy, labels, visual production, legal pages, routes, and publication remain gated.

This document is **not** a homepage and **not** copy. It is the frozen schema later copy and design must fill without inventing product truth.

---

## 3. Purpose

Define, for every homepage content unit:

- the function it serves;
- the visitor question it answers;
- required, optional, conditional, and prohibited fields;
- which PW-1 claims it may support;
- which qualifiers must stay attached;
- which maturity, trust, and availability status must remain visible;
- which actions it may and must not support;
- which responsive and accessibility content rules apply;
- which inputs PW-6 needs before writing copy.

---

## 4. Scope

- Desired public homepage content model under PW-4 Site Model A.
- Header, in-page navigation roles, body blocks, footer, and homepage-adjacent safe-stop/not-found content roles.
- Evidence, qualifier, proof, trust, stop, budget, visual-dependency, state, governance, traceability, risk, and validation registers.
- Copy-input contract to PW-6.
- Owner-decision register for frozen V1 content-model choices (`PW5-OD-001`–`008`). Remaining copy, legal, visual, and technical gates stay open.

---

## 5. Non-Scope

- Final headlines, paragraphs, or CTA labels.
- Wireframes, components, tokens, or visual design.
- Route implementation, Root Model A technical plan, or `/` mutation.
- Authenticated Home content, screenshots of live data, or product-code change.
- Legal approval, privacy-policy prose, analytics, or indexation.
- PW-6 copy drafting.

---

## 6. Binding Authority

| Authority | Closure SHA | What this file may not reverse |
| --- | --- | --- |
| PW-0 | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` | Dual-use `/`; shared surfaces; no public marketing group today |
| PW-1 | `e694b85ead8a4b75054a078624aadfd315cea39d` | Maximum public-truth boundary |
| PW-2 | `d3bea25bca052ebdd6adce4c9c08328a41445eba` | `PW2-VIS-001` sole brand-primary; journeys; Sign in utility |
| PW-3 | `9c12c977383a100eb548880d8d35b329b4406f90` | Model A; `PW3-POS-001`; `PW3-TER-001`; BOS not mandatory Layer A; AI not hero-hook; `PW3-OD-007` beta phrasing still OPEN |
| PW-4 | `c6f4489bc5cbf9306b4784320cc747975209caeb` | Site Model A; Root Model A desired only; Option 2; in-page exploration; Layer B closed beta; named-controls trust |
| Authenticated Home | `49cd5773976143139a154f9b8ddf36535a4dd914` | `/home` remains closed Daily Operating |

Read-only product sources used to **map evidence**, not to publish product UI: `src/app/(authenticated)/home/page.tsx`; Home loader/composition; Tasks/Attention modules; `module-registry.ts`; Course Seller modules (leads, customers, programs, enrollments, progress, members); public/auth entry; `/login`; invite/admission; previously closed H1, Beta-1, and target-group evidence as recorded in PW-1. No new Production evidence is claimed. No browser, Production, or product test was executed.

---

## 7. Evidence and Readiness Classification

| Class | Meaning in PW-5 |
| --- | --- |
| `CURRENT PRODUCT EVIDENCE` | Product fact already governed by PW-1 (with its evidence tier) |
| `OWNER-FROZEN CONTENT DIRECTION` | PW-3/PW-4 frozen strategy/IA that content must obey |
| `OWNER-FROZEN CONTENT MODEL` | PW-5 V1 block/field/proof/visual/access choices frozen by owner |
| `CONTENT MODEL READY` | Schema is specified enough for copy/design handoff of that unit |
| `COPY REQUIRED` | PW-6 must still write wording |
| `ASSET REQUIRED` | Later design must supply or reject a visual |
| `VALIDATION REQUIRED` | Planned tests in §33; not executed |
| `HOLD — DESTINATION MISSING` | No live public destination; no CTA |
| `EXTERNALLY GATED` | Legal/content authority outside this file |
| `PROHIBITED` | Must not appear |
| `PUBLICATION READY` | Copy + design + implementation + a11y + deployment. **Unused.** |

`CONTENT MODEL READY` does not make a block copy-ready, design-ready, implementation-ready, or publication-ready.

---

## 8. Content-Model Principles

1. Every content unit has one primary function.
2. Every claim has PW-1 evidence or an explicit hypothesis status.
3. Every qualifier stays attached to the claim it bounds.
4. Maturity is visible early (Layer B), not footer-only.
5. Relevance and availability are not merged.
6. Sign in is utility, not conversion.
7. Missing destinations receive no CTA.
8. Visuals must not claim more than adjacent text.
9. Mobile reduction must not remove product truth.
10. Accessibility-equivalent information is required.
11. Repetition must be functional, not decorative disclaimer spam.
12. The single page is a foundation, not an unbounded dump.
13. Internal governance language is not automatically public content.
14. Negative qualifiers must not erase positive product meaning.
15. No content is added only because other SaaS homepages typically show it.
16. `CONTENT ROLE ≠ CONTENT BLOCK ≠ POSSIBLE COMPOSITION GROUP ≠ VISUAL SECTION — NOT YET DESIGNED`. Required V1 roles are not eleven required visual sections.

---

## 9. Homepage Content-Block Register

| Block ID | Content role | Primary visitor question | Audience | IA source | Messaging source | Required fields | Conditional fields | Prohibited fields | Evidence | Qualifier | Action role | Mobile preservation | A11Y requirement | Readiness | Placement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-BLK-001 | Public header / navigation | Where am I, and how do I move? | All public visitors | `PW4-NAV-*`; SEC-011 | MSG-001 | Identity; Sign in utility | In-page dest. after real IDs; mobile disclosure | Signup; pricing; contact; beta-request; legal without route; `href="#"` | CLM-001, 045 | Sign in = existing accounts | Utility Sign in; information nav only | Identity + Sign in never hidden as the only path | Unique accessible names | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` | Persistent header |
| PW5-BLK-002 | Identity and operational recognition | What is this, and is it for people like me? | `PW2-VIS-001` | `PW4-SEC-001` | MSG-001/002; POS-001 | Product name; operational meaning | Short support; later exploration role | BOS/AI/CS as required headline; four TGs; signup | CLM-001, 003 | Not chatbot-first; not GA | None | Name + operational meaning | One page H1 | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` | First information |
| PW5-BLK-003 | Plain-language value | What daily work does this organize? | VIS-001 | `PW4-SEC-002` | TER-001; VP without outcomes | Value intent; one support idea | Object list if it stays concrete | Guaranteed growth/revenue; LMS; all-in-one | CLM-002, 018 | No fabricated research; not complete suite | None | Value meaning | Heading/support relationship | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` | Immediately after identity |
| PW5-BLK-004 | Early closed-beta maturity (Layer 1) | How mature is this, and can I use it? | All public | `PW4-SEC-003`; PW4-OD-006; `PW5-OD-008` | MSG-009 | Closed beta; not GA; not open self-serve | Invite-only wording (`PW3-OD-007` still OPEN) | Scarcity; urgency; Request access; Join waitlist; conversion control | CLM-007, 008, 011 | Last governed policy; live flag UNKNOWN | Informational only | Status in initial viewport / Layer B | Status as text | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` | Early Layer B, not hero, not footer-only; distinct from later BLK-011 |
| PW5-BLK-005 | Conceptual mechanism | How does it work, conceptually? | VIS-001 | `PW4-SEC-004` | MSG-005/006 | Mechanism intent; human-operated objects | BOS term with plain-language qualifier; optional abstract visual (`PW5-OD-006`) | Autonomous OS; complete platform; process wireframe; screenshot as required proof | CLM-018, 027, 070, 062 | Evidence tiers not merged | In-page later, not conversion | Mechanism idea; text complete without visual | Definition, not icon-only | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` | After maturity |
| PW5-BLK-006 | Primary Today / Home proof | Which parts exist demonstrably? | VIS-001 | `PW4-SEC-005` | MSG-005 | Today/Home proof + qualifier | Tasks/Attention as supporting context only, own lower evidence tier | Complete current-SHA edition; fixtures as traction; peer Production proofs | CLM-014, 018 **primary**; 070 supporting only | Home Production ≠ full edition; not public `/home` | None | Today meaning + qualifier | List/status in text | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` (`PW5-OD-005`) | After mechanism |
| PW5-BLK-007 | Compact qualified Course Seller relevance | Does this relate to course-based work? | CS visitor; still VIS-001 brand | `PW4-SEC-006`; `PW5-OD-001` | MSG-007/015 | Relevance; operational use; limited evidence-backed context; maturity; availability; honest stop | CS Sign in only per `PW5-FLD-069` (default omit) | LMS; catalog; complete CS edition; CS as brand; public signup; hero/ATF | CLM-015, 016, 071; PRH-022 | SECONDARY; `RELEVANCE ≠ AVAILABILITY`; compact | Honest stop if not admitted | Qualifier attached; not hero | Availability in text | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` (`PW5-OD-001`) | After general operator-first explanation and primary proof; not hero; not ATF-required |
| PW5-BLK-008 | Deferred-context boundary | Are Agencies, Field, E-commerce already available? | Deferred TG visitors | `PW4-SEC-007` | MSG-008 | Historical schema only | n/a in V1 | Equal solution cards; live editions; “solutions for every business” | CLM-020–022, 055; PRH-001 | Unequal; not Production-verified | Honest stop if a visitor brings that expectation (`PW5-STOP-007`) | Not an active V1 homepage proposition | n/a in V1 | `OMITTED FROM V1 — OWNER FROZEN` (`PW5-OD-002`) | Not counted as an active V1 block |
| PW5-BLK-009 | AI expectation | Is this a chatbot / generative AI product? | VIS-001 if AI named or name-misread is validated | `PW4-SEC-008` | MSG-003/012 | Limitation adjacent to a trigger | Short contextual unit after positive product explanation | Standalone AI section; AI hero; chatbot visual; generative SKU; future AI SKU as name-justification | CLM-003, 027, 028, 053, 054 | Rule-based; human-operated; not a long defensive disclaimer | None | Limitation stays with the mention | Text, not icon | `NO STANDALONE BLOCK — CONTEXTUAL ONLY IF TRIGGERED` (`PW5-OD-003`) | Not a V1 section; only if copy names AI or validation shows material ZyntixAI-name misread |
| PW5-BLK-010 | Compact named-control trust | What happens with my data / access? | Trust seekers | `PW4-SEC-009`; `PW5-OD-004` | TRU-001–004 | Named controls only: signed-in access; org-aware; fail-closed nav; user-scoped Home loading | None as legal page | GDPR/SOC/ISO; fully secure; badges; legal conclusion | CLM-032, 013, 034, 033 | Technical control ≠ legal conclusion | No compliance CTA | Controls remain in text | Status/control names in reading order | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` (`PW5-OD-004` homepage treatment frozen) | After CS relevance; before later access block |
| PW5-BLK-011 | Later access clarification and honest stop | Can I join? What can I do if I cannot? | Uninvited visitors; existing accounts | `PW4-SEC-010`; STOP-*; `PW5-OD-008` | MSG-009; CLM-045–053 | No public registration; honest close; access-block Sign in | None | Register; trial; intake; contact; demo; “coming soon”; disclaimer wall | CLM-011, 046–053 | Sign in ≠ join; `HONEST STOP = VALID JOURNEY OUTCOME, NOT A DEAD END` | Informational stop + utility Sign in | Stop remains later on the page, not footer-only, not hero | Stop announced in text | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` | Layer 2 after trust; distinct from early Layer-B status |
| PW5-BLK-012 | Sign in utility | Where do existing users sign in? | `PW2-VIS-007` | `PW4-NAV-005`; SEC-011; `PW5-OD-007` | CLM-045 | Label Sign in; dest. `/login`; existing-accounts qualifier | Footer repeat requires demonstrated usability need | Start; Join; Explore; View product; footer-only | CLM-010, 045 | Existing accounts only | Utility to `/login` | Findable in header; must not own the brand message | Accessible name unique; two instances share purpose | `CONTENT-MODEL REQUIRED` / `COPY REQUIRED` | Header required; repeated in BLK-011; footer default omit |
| PW5-BLK-013 | Public footer | Where is identity / legal later? | All | `PW4-SEC-012` | Footer IA | Identity allowed | Copyright with authority; legal only with route+approval | Social icons; fake address; contact; pricing; careers; badges; Sign in by default | CLM-001; legal EXTERNALLY GATED | Maturity and access must not live only here | Utility / omit HOLD | Must not replace access block | Link purpose if links exist | `CONTENT-MODEL REQUIRED` / legal HOLD | Last |
| PW5-BLK-014 | Public not-found / adjacent safe-stop role | This page does not exist | Lost visitor | `PW4-PAGE-016`; STOP-008 | n/a | Honest missing-page meaning | Path to future homepage and/or Sign in | Fake sitemap of unbuilt pages | PAGE-016 UNKNOWN default | Not product chrome | Sign in if useful | Same meaning | Error identified in text | `OPTIONAL LATER` / conditional governance outside the core homepage | Not a V1 homepage section |

**Frozen V1 functional order (content roles, not a wireframe):** 001 header and in-page navigation → 002 identity and operational recognition → 003 plain-language value → 004 early closed-beta maturity → 005 conceptual mechanism → 006 primary Today/Home proof → 007 compact qualified Course Seller relevance → 010 compact named-controls trust → 011 later access clarification and honest stop → 012 repeated Sign in utility within the access block (also required in header) → 013 public footer. Conditional governance: 009 contextual AI clarification only when triggered; VISUAL-001 optional abstract evidence-safe visual; 014 public not-found/safe-stop outside the core homepage where relevant. Omitted from V1: 008 deferred target-group section; standalone AI section; product screenshot; four target-group cards; testimonial block; customer-logo block; metrics/traction block; pricing; trial; signup; beta-request; waitlist; contact; demo; public product tour.

Eleven required content roles must not be implemented as eleven large visual sections. See `PW5-COMP-*`. Combining later in design must never: hide closed beta; detach a qualifier; widen Today proof; let Course Seller replace general proof; turn trust into a badge; move access to a footer-only line; or turn Sign in into conversion.

### 9.1 Content-composition register

`CONTENT ROLE` is an information function. `CONTENT BLOCK` is the schema record. `POSSIBLE COMPOSITION GROUP` is a later design clustering option. `VISUAL SECTION — NOT YET DESIGNED` is not frozen here. These rows are not wireframes.

| Composition ID | Content roles | May combine? | Required separation | Truth dependency | Mobile rule | Design freedom |
| --- | --- | --- | --- | --- | --- | --- |
| PW5-COMP-001 | BLK-002 + BLK-003 | Yes — one early recognition/value cluster | H1 remains operational recognition; value meaning remains; no outcome guarantee | `PW2-VIS-001`; CLM-001, 002, 018 | Combined cluster still first | Not BOS/AI/CS headline |
| PW5-COMP-002 | BLK-004 attached to identity/value as maturity unit | Yes — attach, do not bury | Closed beta remains early Layer B text; not hero CTA; not footer-only | `PW4-OD-006`; `PW5-OD-008` Layer 1 | Status stays early | Short status, not a conversion band |
| PW5-COMP-003 | BLK-005 + BLK-006 | Yes — one operational-meaning cluster | Today qualifier stays; Tasks/Attention not peer Production; no complete suite | PROOF-001 primary; CLM-014, 018 vs 070 | Proof remains understandable | Two information roles, not two feature catalogues |
| PW5-COMP-004 | BLK-007 | No — not with identity, hero, or general Today as equal | Secondary compact CS; qualifier and availability attached; not ATF-required | `PW5-OD-001`; Model A | Qualifier attached | Compact cluster after general proof |
| PW5-COMP-005 | BLK-010 | Distinct named-controls unit; one compact list | Not a badge row; not footer-only; not a legal page; not four visual sections | `PW5-OD-004`; TRUST-001–004 | Scope stays with each control | Compact list |
| PW5-COMP-006 | BLK-011 + BLK-012 access Sign in | Yes — later access cluster | Honest stop not footer-only; Sign in remains utility | `PW5-OD-007`; `PW5-OD-008` Layer 2 | Stop remains visible | One later close, not a disclaimer wall |
| PW5-COMP-007 | BLK-001 + BLK-012 header Sign in | Must share one utility | Findable; must not own the brand message | CLM-045 | Findable | Not a separate marketing section |
| PW5-COMP-008 | BLK-013 + identity repeat | Yes — minimal footer identity | Footer must not host unique maturity or unique access | `PW5-OD-007` | Footer does not replace BLK-011 | Omit HOLD links |
| PW5-COMP-009 | BLK-009 | Must not become a section | Adjacent clause only if triggered; positive product first | `PW5-OD-003` | With the mention | Not a default disclaimer band |
| PW5-COMP-010 | VISUAL-001 | Optional; not a required section | Text complete without it; not a product-proof asset; not technical OS/network/enterprise architecture | `PW5-OD-006` | May omit | Not screenshot; not chatbot; not four TGs |

---

## 10. Content-Field Register

Semantic units only. Placeholders are roles, not copy.

| Field ID | Parent block | Field role | Requirement | Content type | Max function | Source authority | Qualifier dependency | Mobile rule | A11Y equivalent | Validation | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-FLD-001 | BLK-001 | `[PRODUCT_IDENTITY_LABEL]` | REQUIRED | short label | Name the product | CLM-001 | None for the name | Never omit | Accessible name = visible name | VAL-001 | PW-6 |
| PW5-FLD-002 | BLK-001 | In-page information destinations | CONDITIONAL | link | Jump to real section IDs later | NAV-001–004; FUT-006 | No dest. until IDs/focus exist | Labels remain understandable | Unique link purpose | VAL-016 | PW-6/13 |
| PW5-FLD-003 | BLK-001 | Availability nav role | REQUIRED as information role | short label | Point to maturity meaning | SEC-003 | Not a join CTA | Must remain findable | Text, not color | VAL-004 | PW-6 |
| PW5-FLD-004 | BLK-001 | `[SIGN_IN_UTILITY_LABEL]` | REQUIRED | link | Existing-account Sign in | CLM-045 | Existing accounts | Never omit as only utility | Unique accessible name | VAL-005 | PW-6 |
| PW5-FLD-005 | BLK-001 | Mobile navigation disclosure | CONDITIONAL | status + links | Same destinations as desktop | A11Y-015 | Closed menu must not hide Layer B | Same truth if used | Name, expanded/collapsed | VAL-014 | PW-7/8 |
| PW5-FLD-006 | BLK-001 | Current-section indication | OPTIONAL later | status | Match focused heading | A11Y-016 | Not color-only | Optional | Text or programmatic current | VAL-016 | PW-8 |
| PW5-FLD-007 | BLK-001 | Public signup / pricing / contact / beta-request / legal-without-route | PROHIBITED | n/a | n/a | CLM-046–049, 037 | n/a | n/a | n/a | Nav audit | Content owner |
| PW5-FLD-008 | BLK-001 | `href="#"` or fake disabled control | PROHIBITED | n/a | n/a | `PW2-FUT-006`; `PW4-OD-005` | n/a | n/a | n/a | Link review | PW-13 |
| PW5-FLD-009 | BLK-002 | Product name in identity block | REQUIRED | heading support | Same product name | CLM-001 | None | Preserve | Contributes to H1 meaning | VAL-003 | PW-6 |
| PW5-FLD-010 | BLK-002 | `[PRIMARY_VALUE_HEADING]` / operational recognition intent | REQUIRED | heading | One recognition idea for VIS-001 | MSG-002; POS-001 | Not chatbot-first; not CS-primary | Preserve | Sole page H1 purpose | VAL-003 | PW-6 |
| PW5-FLD-011 | BLK-002 | Short supporting context | OPTIONAL | support text | One clarifying idea | MSG-002 | Must not add prohibited claims | May shorten, not invert | Same meaning | VAL-003 | PW-6 |
| PW5-FLD-012 | BLK-002 | Non-conversion exploration role | CONDITIONAL | link | In-page only after real IDs | `PW4-CTA-012`; `PW4-OD-005` | Never `/login` or `/home` as Explore | Optional | Descriptive name | VAL-018 analog | PW-6/13 |
| PW5-FLD-013 | BLK-002 | “Not a chatbot” as comprehension outcome | OPTIONAL | support text | Recognition, not identity headline | MSG-003; CLM-003 | If used, not the H1 | Must not replace value | Text | VAL-007 | PW-6 |
| PW5-FLD-014 | BLK-002 | BOS, AI, Course Sellers, four TGs, signup, or trial as required headline | PROHIBITED | n/a | n/a | `PW3-POS-001`; `PW5-OD-001` not-hero; `PW4-OD-002` | n/a | n/a | n/a | VAL-003/007/008 | PW-6 |
| PW5-FLD-015 | BLK-003 | Plain-language value heading intent | REQUIRED | heading | Daily-work organization | TER-001 | No guaranteed outcomes | Preserve | Heading purpose | VAL-001 | PW-6 |
| PW5-FLD-016 | BLK-003 | Value support | REQUIRED | support text | One explanation | POS-001 objects | Hypothesis vs product fact distinguished | May shorten | Same claim | VAL-001 | PW-6 |
| PW5-FLD-017 | BLK-003 | Object list (customers, work, responsibilities, progress, attention) | CONDITIONAL | list | Concrete meaning, not module catalog | TER-001; §14 matrix | Customers as general CRM forbidden | Limited items | List text | VAL-011 | PW-6 |
| PW5-FLD-018 | BLK-003 | Guaranteed efficiency, growth, revenue, or complete suite | PROHIBITED | n/a | n/a | CLM-067; PRH-003/009 | n/a | n/a | n/a | Claim audit | PW-6 |
| PW5-FLD-019 | BLK-004 | `[CLOSED_BETA_STATUS]` | REQUIRED | status | Closed beta, not GA | CLM-007, 008 | Invite-only as last governed policy | Preserve early | Status in text | VAL-004 | PW-6 (`PW3-OD-007`) |
| PW5-FLD-020 | BLK-004 | Not open self-service access | REQUIRED | status/support | Access is not public signup | CLM-011 | Live flag UNKNOWN | Preserve | Text | VAL-004/005 | PW-6 |
| PW5-FLD-021 | BLK-004 | Sign in is for existing accounts | REQUIRED nearby | qualifier | Distinguishes utility from join | CLM-045 | Attached to access story | Preserve | Text | VAL-005 | PW-6 |
| PW5-FLD-022 | BLK-004 | Scarcity, urgency, limited seats, free-while-beta | PROHIBITED | n/a | n/a | MSG-009; CLM-037/038 | n/a | n/a | n/a | VAL-004 | PW-6 |
| PW5-FLD-023 | BLK-004 | Request access / Join waitlist control | PROHIBITED | n/a | n/a | CLM-047, 048 | n/a | n/a | n/a | CTA inventory | PW-6 |
| PW5-FLD-024 | BLK-005 | Mechanism heading intent | REQUIRED | heading | Conceptual how, not feature dump | MSG-005/006 | Not autonomous | Preserve idea | Heading purpose | VAL-006 | PW-6 |
| PW5-FLD-025 | BLK-005 | Operating-object explanation | REQUIRED | support text / definition | Work, attention, ownership, progress as meaning | §14 matrix | Tiers not merged | May shorten list | Definitions in text | VAL-006/011 | PW-6 |
| PW5-FLD-026 | BLK-005 | `[BOS_TERM_WITH_PLAIN_LANGUAGE]` | CONDITIONAL | definition | Intended category only | CLM-002 | Not technical OS; not all-in-one; not autonomous; not GA; expand acronym at first use | If used, qualifier attached | Acronym expansion | VAL-006 | PW-6 |
| PW5-FLD-027 | BLK-005 | All-in-one / autonomous OS / complete platform | PROHIBITED | n/a | n/a | PRH-003, 004, 023 | n/a | n/a | n/a | VAL-006 | PW-6 |
| PW5-FLD-028 | BLK-005 | Guaranteed outcome or process diagram as required content | PROHIBITED | n/a | n/a | CLM-067; this file non-scope | n/a | n/a | n/a | Design review | PW-9 |
| PW5-FLD-029 | BLK-006 | Today / Home primary proof | REQUIRED | evidence descriptor / list | Authenticated daily overview only | PROOF-001; CLM-014, 018; `PW5-OD-005` | Home ≠ full edition; not public demo | Preserve Today meaning | Text | VAL-011 | PW-6 |
| PW5-FLD-030 | BLK-006 | Evidence-level / current-SHA qualifier | REQUIRED | qualifier | Home ≠ full edition; Tasks/Attention not peer Production | CLM-014, 018, 070; PRH-022 | Attached to proof | Never detach | Text in order | VAL-011 | PW-6 |
| PW5-FLD-031 | BLK-006 | Complete current-SHA edition or screenshot-as-live-public-product | PROHIBITED | n/a | n/a | PRH-022; CLM-014 | n/a | n/a | n/a | VAL-011/018 | PW-6/10 |
| PW5-FLD-032 | BLK-006 | Product UI screenshot | HOLD | visual description | Not V1; later only after privacy/state/sanitization/evidence/truth/permission/crop/a11y/design authority | VISUAL-002; `PW5-OD-006` | Authenticated UI ≠ public demo | Text fallback required | Alt = information role | VAL-018 | Design + privacy |
| PW5-FLD-033 | BLK-007 | `[COURSE_SELLER_RELEVANCE]` | REQUIRED | relevance statement | One compact qualified context | MSG-007/015; `PW5-OD-001` | Not brand-primary; not hero | Preserve | Text | VAL-008/009 | PW-6 |
| PW5-FLD-034 | BLK-007 | Mandatory CS qualifier | REQUIRED | qualifier | Not LMS; not complete edition; not catalog | CLM-016, 071; PRH-022 | Attached to relevance | Never hover-only | Text | VAL-009 | PW-6 |
| PW5-FLD-035 | BLK-007 | CS availability boundary | REQUIRED | availability statement | Not publicly joinable as CS edition | CLM-007, 011 | `RELEVANCE ≠ AVAILABILITY` | Preserve | Text | VAL-008 | PW-6 |
| PW5-FLD-036 | BLK-007 | LMS / public course platform / catalog / student marketplace / public signup / free / trial / open beta | PROHIBITED | n/a | n/a | CLM-071, 046, 008 | n/a | n/a | n/a | VAL-009 | PW-6 |
| PW5-FLD-037 | BLK-007 | Public CS signup | PROHIBITED | n/a | n/a | CLM-046 | n/a | n/a | n/a | CTA inventory | PW-6 |
| PW5-FLD-038 | BLK-008 | Restrained future-context sentence | OMITTED FROM V1 | support text | Historical Option B only | `PW5-OD-002` Option A | Not available now | Not an active V1 field | n/a | VAL-010 | PW-6 |
| PW5-FLD-039 | BLK-008 | Unequal named contexts | OMITTED FROM V1 | list | Historical Option C only | CLM-020–022 | Per name, attached | Not an active V1 field | n/a | VAL-010 | PW-6 |
| PW5-FLD-040 | BLK-008 | Three or four equal solution cards | PROHIBITED / REJECTED | n/a | n/a | PW4-OD-002 Option 4; `PW5-OD-002` | n/a | n/a | n/a | VAL-010 | PW-9/12 |
| PW5-FLD-041 | BLK-009 | AI limitation if triggered | CONDITIONAL | qualifier | After positive product explanation; short; evidence-correct | MSG-012; CLM-027; `PW5-OD-003` | Adjacent to the mention; not a long disclaimer | Cannot wait for footer | Text | VAL-007 | PW-6 |
| PW5-FLD-042 | BLK-009 | Standalone AI feature section | PROHIBITED | n/a | n/a | `PW5-OD-003` Option A | No standalone in V1 | n/a | n/a | VAL-007 | Owner frozen |
| PW5-FLD-043 | BLK-009 | Generative/autonomous AI, connect-provider, AI hero, chatbot visual, future AI SKU as name-justification | PROHIBITED | n/a | n/a | CLM-028, 053, 054 | n/a | n/a | n/a | VAL-007 | PW-6 |
| PW5-FLD-044 | BLK-010 | Named-control list | REQUIRED | list | Signed-in access; org-aware; fail-closed nav; user-scoped Home loading | CLM-032, 013, 034, 033; `PW5-OD-004` | Technical, not legal | Preserve | Control names in text | VAL-012 | PW-6 |
| PW5-FLD-045 | BLK-010 | Legal-compliance conclusion | PROHIBITED | n/a | n/a | CLM-041, 042; `PW4-OD-003`; `PW3-OD-009` | n/a | n/a | n/a | VAL-012 | Legal |
| PW5-FLD-046 | BLK-010 | Certification / fully secure / bank-level / SLA / badge wall | PROHIBITED | n/a | n/a | CLM-036, 041; PRH-011–013 | n/a | n/a | n/a | VAL-012 | PW-6 |
| PW5-FLD-047 | BLK-010 | Separate legal/privacy page link | HOLD / EXTERNALLY GATED | link | Only with approved route+content | PAGE-013/014 | No dead link | Omit until authority | n/a | Footer audit | Legal |
| PW5-FLD-048 | BLK-011 | Access heading intent | REQUIRED | heading | Can I join? Layer 2 | SEC-010; `PW5-OD-008` | Sign in ≠ join | Preserve | Heading purpose | VAL-005/017 | PW-6 |
| PW5-FLD-049 | BLK-011 | Honest-stop meaning | REQUIRED | support text | No public next conversion; not a dead end | STOP-001–006 | No “coming soon” commitment | Preserve | Stop identified | VAL-017 | PW-6 |
| PW5-FLD-050 | BLK-011 | No public registration statement | REQUIRED | status | Fail-closed signup | CLM-011, 046 | Live flag UNKNOWN | Preserve | Text | VAL-005 | PW-6 |
| PW5-FLD-051 | BLK-011 | HOLD conversion buttons | PROHIBITED | n/a | n/a | CLM-047–053 | n/a | n/a | n/a | CTA inventory | PW-6 |
| PW5-FLD-052 | BLK-012 / BLK-001 | Header Sign in label | REQUIRED | short label | Must remain Sign in | CLM-045; `PW5-OD-007` | Not Start/Join/Explore/View product | Preserve; findable; must not own brand message | Accessible name | VAL-005 | PW-6 |
| PW5-FLD-053 | BLK-012 | Destination `/login` | REQUIRED | link | Auth-owned utility | PAGE-002 | Not a product tour | Preserve | Link purpose includes Sign in | VAL-005 | Auth |
| PW5-FLD-054 | BLK-012 | Existing-accounts qualifier | REQUIRED | qualifier | Audience bound | CLM-010, 045 | Attached to each Sign in instance | Preserve | Text | VAL-005 | PW-6 |
| PW5-FLD-055 | BLK-013 | Footer identity | REQUIRED as allowed role | short label | Repeat name | CLM-001 | None | May remain | Text | Footer review | PW-6 |
| PW5-FLD-056 | BLK-013 | Footer Sign in | OMITTED FROM V1 BY DEFAULT | link | Extra repeat only with demonstrated usability need | `PW5-OD-007` | Same qualifier | Default omit | n/a | OD-007 | PW-6 |
| PW5-FLD-057 | BLK-013 | Legal/privacy links | HOLD / EXTERNALLY GATED | link | Real dest. only | PW4-OD-003 | Approved content required | Omit | n/a | Legal | Legal |
| PW5-FLD-058 | BLK-013 | Copyright / ownership identity | CONDITIONAL | short label | Only with authority | Q-013 | No fake address | Optional | Text | Legal/identity owner | Owner |
| PW5-FLD-059 | BLK-013 | Social icons, contact, pricing, careers, resources, logos, badges, waitlist, beta-request | PROHIBITED without new authority | n/a | n/a | CLM-037, 040, 047–049 | n/a | n/a | n/a | Footer audit | PW-6 |
| PW5-FLD-060 | BLK-014 | Missing-page meaning | OPTIONAL LATER | status | Page does not exist | STOP-008 | Not product chrome | Same | Error in text | Later a11y | PW-8/13 |
| PW5-FLD-061 | BLK-014 | Fake unbuilt sitemap links | PROHIBITED | n/a | n/a | STOP-008 | n/a | n/a | n/a | Link review | PW-13 |
| PW5-FLD-062 | BLK-011 | Access-block `[SIGN_IN_UTILITY_LABEL]` | REQUIRED | link | Functional repeat of header Sign in; not a second acquisition CTA | CLM-045; `PW5-OD-007` | Existing accounts; same `/login` purpose | Findable; must not dominate | Accessible name shares purpose with header Sign in | VAL-005 | PW-6 |
| PW5-FLD-063 | BLK-007 | Recognizable CS operational use | REQUIRED | support text | Evidence-bound operator work, not LMS | CLM-015 | Attached to CS relevance | Preserve | Text | VAL-008 | PW-6 |
| PW5-FLD-064 | BLK-007 | Limited evidence-backed CS product context | REQUIRED | evidence descriptor | Operator records only; not complete edition | CLM-015, 016; PROOF-004/005 | Not current-SHA complete CS | May shorten, not inflate | Text | VAL-009 | PW-6 |
| PW5-FLD-065 | BLK-007 | CS maturity in the CS block | REQUIRED | status | Closed beta still applies in this context | CLM-007 | Not open beta | Preserve | Text | VAL-004/008 | PW-6 |
| PW5-FLD-066 | BLK-007 | CS honest stop for non-admitted visitors | REQUIRED | support text | No public CS join | STOP analog | No signup/trial | Preserve | Stop identified | VAL-017 | PW-6 |
| PW5-FLD-067 | BLK-006 | Tasks/Attention supporting context | CONDITIONAL | support text | May be named only with own lower evidence tier; not peer Production | CLM-070 | Not merged into Home E5 | If used, qualifier attached | Text | VAL-011 | PW-6 |
| PW5-FLD-068 | BLK-005 / VISUAL-001 | Optional abstract operational-system visual alternative | OPTIONAL | visual description | Text remains complete without it | `PW5-OD-006` | No fake function; no four TGs; no chatbot; not a technical OS, network, or enterprise-architecture claim | Visual may omit if text complete | Informative alt if used; decorative empty | VAL-018 | Design |
| PW5-FLD-069 | BLK-007 | CS-block Sign in control | CONDITIONAL — conservative default omit | link | Extra existing-account utility inside CS only if header and access Sign in would not be findable in that reading | CLM-045; `PW5-OD-007` | Same `/login` purpose; not a third acquisition CTA | Default omit; if used, findable as utility | Shares Sign in purpose | VAL-005 | PW-6 |

---

## 11. Header and Navigation Content Model

Header content is orientation and utility, not acquisition.

Required: product identity (`PW5-FLD-001`); header Sign in utility (`PW5-FLD-004`, `052–054`). Access-block Sign in is `PW5-FLD-062` (`PW5-OD-007`). Footer Sign in is omitted by default.

Conditional: in-page destinations (`PW5-FLD-002`) only after real section IDs, landmarks, and focus management exist (`PW4-OD-005`). Until then, document-order reading is the safe fallback. Do not ship `href="#"`.

Information-destination roles (labels remain PW-6): product explanation; how it helps; availability; trust. They describe **where information lives**, not conversion.

Never in header/nav: public signup; pricing; contact without destination; beta-request without destination; legal link without approved route/content; Start/Join/Explore/View product as a rename of Sign in.

Mobile: identity and Sign in must remain findable. A later disclosure may collapse extra in-page items but must not make the closed menu the only carrier of Layer B or availability (`PW5-FLD-005`). Current-section indication, if later used, is not color-only (`PW5-FLD-006`).

Fields that may never disappear: product name; Sign in utility; closed-beta truth (may live in BLK-004, not only nav). Fields that may wait: in-page links; current-section chrome.

---

## 12. Identity and Operational-Recognition Model

Primary audience: `PW2-VIS-001`. Primary IA: `PW4-SEC-001`. Primary messaging: MSG-001/002 and internal `PW3-POS-001` (not publication copy).

The block must make room for: product name; a recognizable daily-work problem/value; short support; optional later non-conversion in-page exploration; a visible handoff into Layer B maturity.

It must not require: BOS as headline; AI as headline; “operator” as a mandatory public self-label (POS-001 may say owner/operator internally; public addressing may be plainer); Course Sellers as primary audience; four target groups; complete-platform language; autonomous language; signup or trial CTAs.

“Not a chatbot” may be a **comprehension test** (FLD-013) after operational meaning. It is not a required first sentence and must not become the identity.

H1 rule: one meaningful page heading owned by this block’s recognition intent.

---

## 13. Closed-Beta Maturity Model

Early visible unit (`PW4-OD-006`; `PW5-OD-008` Layer 1). Not Layer A/hero. Not footer-only. Not a conversion control. Distinct from the later access/honest-stop block (`PW5-BLK-011`).

Required information roles: closed beta; not public GA; access is not open self-service; Sign in is for existing accounts; no free/trial implication; no scarcity or urgency.

Minimum: `[CLOSED_BETA_STATUS]` plus a bound access distinction. Exact phrasing remains OPEN (`PW3-OD-007`). Qualified terms: closed beta; invite-only (last governed policy, not a re-probed live flag); not generally available.

Forbidden interpretations: now live for everyone; register here; start free; limited seats; coming soon as a commitment.

Mobile: status remains in the early reading order. Screen readers receive the same status in text, not color or icon alone.

No Request access or Join waitlist control.

---

## 14. Conceptual Mechanism Model

Explain conceptually what ZyntixAI does without claiming a complete suite or prescribing a diagram.

### 14.1 Mechanism evidence matrix

| Object | Homepage use | Evidence | Tier / limitation | Allowed representation | Required qualifier | Prohibited implication |
| --- | --- | --- | --- | --- | --- | --- |
| Product name / host | Identity | CLM-001, 004 | E5 name/host | Name the product | Host ≠ existing marketing homepage | Public homepage already live |
| Daily operating view | Mechanism + proof | CLM-018, 014 | E5 Home Today at SHA `d110b6e3…` | Today overview from attention and assigned tasks | Authenticated closed-beta Home; not public `/home` | Home is the website; AI ranking |
| Tasks | Mechanism support | CLM-070 | E4 release; pre-H1 Production read | Admitted operators can use tasks | Not current-SHA Production from Home alone | Complete Tasks edition now |
| Attention / next attention | Mechanism support | CLM-018, 027, 070 | E5 composition; E3 rule-based NBA; E4 module | Next attention as operator queues | Rule-based; not generative | AI command center |
| Responsibilities / ownership | Meaning, not module dump | POS-001; CLM-017 | Members E4, invitation gated | Work can have an owner inside admitted orgs | Not public team signup | Open collaboration product |
| Progress | CS-qualified if detailed | CLM-016 | E4 CS operator progress | Operator progress records if CS shown | Not learner LMS | Students take courses here |
| Customers | CS-qualified | CLM-015 | E4; not current-SHA Production | CS operator leads/customers if CS shown | Not general public CRM | CRM for every business |
| Shared operational context | Supporting | CLM-062 | E4 shared core | One product core; unused modules hidden | Shared ≠ four live editions | All-in-one OS |
| Business Operating System | Conditional term | CLM-002 | E1 intended category | Only with plain-language qualifier | Not technical OS; not autonomous; not GA | The OS runs itself |

Do not merge Home, Tasks, Attention, and Course Seller evidence into one current-SHA completeness claim. “Connected” must not mean all-in-one. Mechanism content does not prescribe a process diagram or wireframe. No guaranteed efficiency or outcome.

Home may name Attention and assigned tasks as **inputs to the Today composition** (`PW1-CLM-018`, E5 Home). That is not permission to present standalone Tasks or Attention modules as peer current-SHA Production proofs (`PW1-CLM-070`, E4). Ordering inside Home uses rule-based severity and due-date sorts, not AI ranking.

---

## 15. Proof-Backed Operational-Areas Model

| Proof ID | Public information role | Product evidence | Evidence level | Current-SHA limitation | Allowed representation | Required qualifier | Prohibited implication | Asset dependency | Copy dependency | Selection |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-PROOF-001 | Today / daily operating view | Home page, `compose-daily-operating-brief`, H1 | E5 Production Home | Home only; SHA `d110b6e3…` | Admitted users see a Today brief / authenticated daily overview | Authenticated closed beta; not public demo; not public product access | Full edition; AI-ranked Home; generative recommendation; autonomous daily planning; traction | Optional abstract visual later; screenshot HOLD | PW-6 | `SELECTED — PRIMARY V1` (`PW5-OD-005`) |
| PW5-PROOF-002 | Tasks as work objects | Tasks module; B1-FV read | E4 release | Pre-H1 Production walk | Supporting context only; own lower evidence tier | Not proven by Home Production alone; not peer Production | Complete current-SHA Tasks suite | None as primary visual | PW-6 | `SUPPORTING CONTEXT ONLY` |
| PW5-PROOF-003 | Attention queues | Attention module; NBA rules | E4 + E3 rules | Pre-H1 module walk; NBA not generative | Supporting context only; own lower evidence tier | Rule-based; human-operated; not peer Production | Generative ranking; autonomous planning | None as primary visual | PW-6 | `SUPPORTING CONTEXT ONLY` |
| PW5-PROOF-004 | CS operator customer records | Leads/customers modules; B1-FV read | E4 | Not H1 SHA; read/fixture limits | Only inside CS relevance block | Not public CRM; not every business | General-operator CRM; primary homepage proof | Optional | PW-6 | `CS-BLOCK ONLY` (not general primary proof) |
| PW5-PROOF-005 | Programs / enrollments / progress | CS knowledge modules; B1-FV | E4 | Not learner delivery; not current-SHA Production | Operator tools inside CS block | Not LMS; not public catalog | Public course platform; primary homepage proof | Optional | PW-6 | `CS-BLOCK ONLY` |
| PW5-PROOF-006 | Members administration | Members module; invitations gated | E4 | Invitation flags historically off/allowlisted | Omit from V1 homepage | Not public signup | Invite anyone from the website | None | PW-6 | `HOLD` |
| PW5-PROOF-007 | Rule-based next action | `evaluate-next-best-action`; H1 no AI ranking | E3 | Not Production LLM-absence telemetry | Only if AI clarification is triggered | Not generative; not autonomous | AI-powered insights | None | PW-6 | `CONDITIONAL` if AI triggered; else omit |
| PW5-PROOF-008 | Social publishing | SMM gated; publishing resting OFF | E4/E5 gated/disabled | Not default public feature | Not homepage proof | Gated; not generally on | Publish to Instagram from the website | None | n/a | `PROHIBITED` as homepage proof |

Internal QA state, fixtures, and test records are not customer proof. Screenshots are not evidence without privacy and state control. Release-tested is not current-SHA Production. Thin slices are not complete products.

Proof classes (do not collapse):

| Class | V1 status |
| --- | --- |
| `PRODUCT PROOF CLAIM` | Selected: textual Today/Home meaning within CLM-014/018 bounds |
| `PRODUCT PROOF ASSET` | Not automatically allowed; optional abstract visual is not a proof asset |
| `SCREENSHOT` | `HOLD` (`PW5-VISUAL-002`) |
| `PUBLIC DEMO` | Prohibited; authenticated Home is not a public tour |

Home composition inputs (attention items and assigned tasks loaded into the Today brief) may be named as how Today is composed. They must not be presented as a second and third primary Production proof, as AI ranking, or as guaranteed daily recommendations. Section cap and calm empty-state exist in product source; they are not public traction metrics.

**Owner freeze (`PW5-OD-005`):** V1 primary proof is PROOF-001 only. Tasks/Attention may be named as supporting context with their own lower evidence tier (`FLD-067`) and must not be presented as peer Production proofs or merged into a complete current-SHA suite. Course Seller capability proof stays inside BLK-007. Members remain HOLD. Social remains prohibited as homepage proof.

---

## 16. Course Seller Relevance Model

PW-4 frozen treatment: Option 2 — one qualified Course Seller relevance context. Not brand-primary; not co-primary; not LMS; no public course platform or catalog; no complete current-SHA edition; Home Production must not be expanded to a full CS edition; not a hero/ATF mandate.

`REQUIRED CONTENT ROLE ≠ HERO PROMINENCE ≠ COMPLETE EDITION CLAIM`

**Owner freeze (`PW5-OD-001`):** `INCLUDE ONE COMPACT, QUALIFIED COURSE SELLER RELEVANCE BLOCK IN V1`. Status: `RESOLVED — OWNER FROZEN`. The block is **required** in the V1 content model. Placement: after general operator-first explanation and primary Today/Home proof. Not in the hero. Not required above the fold. Compact, evidence-bound, clearly qualified.

Required content roles: Course Seller relevance (`FLD-033`); recognizable operational use (`FLD-063`); limited evidence-backed product context (`FLD-064`); maturity (`FLD-065`); availability qualifier (`FLD-034`/`035`); honest stop for non-admitted visitors (`FLD-066`). CS-block Sign in is `PW5-FLD-069` with conservative default omit (header + later access Sign in already exist).

Required fields must still fit BUD-007 (maximum four visible concepts). Compose, do not stack seven essays: relevance + attached qualifier/availability as one cluster; operational use + limited evidence-backed context as one support cluster; maturity as a short pointer that closed beta still applies, not a second Layer-1 paragraph; honest stop as a short clause. This keeps OD-001 required and Model A operator-first. Qualifier burden is a material copy risk (`PW5-RSK-032`), not authority to reverse OD-001.

The block must not suggest: LMS; public course platform; public course catalog; complete Course Seller edition; complete current-SHA edition; public signup; open beta; free access; trial; that Course Sellers define the whole ZyntixAI identity. Home/Today proof must not be used as proof of all CS capabilities.

`PW5-OD-001 — COURSE SELLER CONTENT-BLOCK REQUIREMENT`

| Field | Value |
| --- | --- |
| Options | Required compact V1 block; conditional when TG relevance is shown; omit always |
| Evidence | PW4-OD-002; MSG-007/015; CLM-015/016/071; PRH-022 |
| Trade-offs | Required helps CS visitors, raises brand-capture risk if it becomes hero |
| Establishment recommendation | Conditional |
| Owner decision | **INCLUDE ONE COMPACT, QUALIFIED COURSE SELLER RELEVANCE BLOCK IN V1** |
| Status | `RESOLVED — OWNER FROZEN` |
| Frozen scope | Required V1 content role; compact; after operator-first + primary proof; not hero; not ATF-required; not brand/co-primary |
| Remaining gate | Copy/qualifiers PW-6; design must not make CS the hero |
| Owner | Product owner |
| Blocked phase | PW-6 CS hero; PW-9 Layer A CS block |

---

## 17. Deferred-Context Model

Agencies, Field, and E-commerce remain deferred thin slices: integration-tested, not Production-verified, not proven closed-beta-eligible. Agency is not a complete suite. Field has no GPS/route optimization. E-commerce has no storefront, checkout, payments, or Stripe.

| Option | Treatment | Model A | PW-1 truth | Visitor relevance | Focus | Qualifier burden | Mobile | Misread risk | Maintainability | Score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A Omit | No deferred section | Strong | Strong | Defers TG2–4 questions | Strong | Lowest | Strong | Lowest fake-scale | Strong | Best conservative |
| B One restrained sentence | No cards | Strong | Strong if “not equally available” | Medium | Strong | Low | Strong | Low | Strong | Acceptable |
| C Unequal list | Named, not available | Medium | Strong if attached | Higher for those visitors | Weaker | High | Weak | Medium | Hard | Only if owner insists on naming |
| D Three/four cards | Equal chrome | Fail | Fail | False | Fail | High and false | Fail | High | Fail | **Rejected** |

`PW5-OD-002 — DEFERRED-CONTEXT CONTENT TREATMENT`

| Field | Value |
| --- | --- |
| Owner decision | **OPTION A — OMIT DEFERRED TARGET-GROUP CONTENT FROM THE INITIAL HOMEPAGE** |
| Status | `RESOLVED — OWNER FROZEN` |
| Frozen V1 | No Agencies section; no Field Service section; no E-commerce section; no four TG cards; no three deferred-edition cards; no copy that still makes those groups look available; no “solutions for every business” |
| Schema retention | BLK-008 remains as historical/governance schema: `OMITTED FROM V1 — OWNER FROZEN`. Not counted as an active V1 block |
| TG2–TG4 | Remain in governance; available as safe-stop context (`PW5-STOP-007`) if a visitor brings that expectation; later reconsideration only after product evidence + owner authority |
| Option D / four cards | **REJECTED** |
| Conservative later path | If later named, Option B before C; never D |
| Owner | Product owner |

No deferred-context content may suggest availability that does not exist.

Omission of TG2–TG4 must not be read as “ZyntixAI is only for Course Sellers.” Brand width remains the general operator-first identity, value, mechanism, and Today proof (`PW2-VIS-001`). Course Seller is one qualified later example. Do not invent unsupported target-group claims to fill the omitted section.

---

## 18. AI-Expectation Model

| Option | Treatment | Confusion | Name expectation | Chatbot-capture | Negative overload | Evidence | Mobile burden | Maintainability | Score |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A No standalone block | Explain only when name/claim requires | Acceptable if MSG-003 outcome appears after value | Leaves name unexplained until needed | Low if identity is operational | Lowest | Matches weak generative evidence | Lowest | Strong | Best |
| B Small expectation unit | Positive product first, then limited AI truth | Helps name curiosity | Direct | Medium if still not hero | Medium | Fits CLM-003/027 | Medium | Medium | Acceptable if AI is named in identity |
| C AI feature section | Capability section | High | Over-answers | High | High | No generative/autonomous evidence | High | Poor | **Rejected** |

Do not invent an AI roadmap to justify the brand name.

`PW5-OD-003 — AI CONTENT-BLOCK TREATMENT`

| Field | Value |
| --- | --- |
| Owner decision | **OPTION A — NO STANDALONE AI CONTENT BLOCK** |
| Status | `RESOLVED — OWNER FROZEN` |
| Frozen V1 | No standalone AI section; no AI hero; no chatbot visual as central image; no AI-capability feature grid; no generative/autonomous AI promise; no future AI SKU to justify the name |
| Contextual only if | AI is actively named in copy as a capability/claim, or later validation shows the name ZyntixAI causes a material misread |
| Conservative default | The product name alone is **not** a default trigger for a defensive AI disclaimer on every visit. Do not add BLK-009 by default. |
| Then order | 1. positive product explanation; 2. short evidence-correct AI bound; 3. no long defensive disclaimer |
| Schema retention | BLK-009 remains conditional governance: `NO STANDALONE BLOCK — CONTEXTUAL ONLY IF TRIGGERED` |
| Exact wording | PW-6-owned |
| Option C | **Rejected** |
| Owner | Product owner |

---

## 19. Trust Content Model

Homepage trust = named controls only (`PW4-OD-003` / `PW3-OD-009`). Legal/privacy/trust pages remain `EXTERNALLY GATED`.

| Trust ID | Control role | Evidence | Allowed public abstraction | Required scope | Prohibited conclusion | Legal dependency | Asset dependency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-TRUST-001 | Signed-in access | CLM-032, 010; `/home` protected | Product Home requires a session; product use is for signed-in users | Authenticated Home and signed-in product use; not a claim that every `(authenticated)` route is middleware-listed | Bank-grade; SSO for all IdPs; all routes middleware-protected | None for this control | None |
| PW5-TRUST-002 | Organization-aware behavior | CLM-013, 062 | Admitted users work in an organization workspace | Closed-beta membership | Public self-serve workspaces; four-industry picker as Production | None | None |
| PW5-TRUST-003 | Fail-closed control / navigation | CLM-034, 062 | Unused modules stay hidden until capability resolution | Product navigation, not a legal access policy | Fully isolated guarantee; unhackable | None | None |
| PW5-TRUST-004 | User-scoped Home loading | CLM-033 | Home is implemented to load through the user-scoped client, not service-role | Home only | AVG/GDPR compliant; data never leaves Europe | Legal review before any privacy-policy sentence | None |

No AVG/GDPR, SOC 2, ISO, certification, fully secure, bank-level, enterprise-grade security, uptime/SLA, absolute privacy, or legal badge.

Recommended treatment is now owner-frozen: a **compact separate required V1 block** after explanation (and after CS relevance), not a badge row. Integrated-only trust is not the V1 choice. Badge-only is prohibited.

`PW5-OD-004 — HOMEPAGE TRUST CONTENT TREATMENT`

| Field | Value |
| --- | --- |
| Owner decision | **ONE COMPACT, SEPARATE NAMED-CONTROLS TRUST BLOCK** |
| Status | `RESOLVED — OWNER FROZEN FOR HOMEPAGE CONTENT MODEL` |
| Frozen homepage scope | Required V1 block; named controls only within exact evidence bounds |
| Not frozen | Separate legal/privacy/trust pages remain `OPEN — EXTERNAL LEGAL AND CONTENT AUTHORITY REQUIRED` |
| Remaining gate | Legal content; publication obligation; copy of named controls |
| Owner | Product owner; legal remainder external |

This freeze decides homepage content treatment only. It is not legal approval. OD-004 is fully resolved for the homepage model; the external legal remainder is not a seventh owner content-model decision and does not make OD-004 partial.

---

## 20. Access Clarification and Honest-Stop Model

Visitors without a valid public next conversion still receive a complete, announced stop.

| Stop ID | Visitor expectation | Truth to communicate | Allowed action | Prohibited action | Escape path | Tone requirement | A11Y requirement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-STOP-001 | Public signup | Public self-serve accounts are not offered | Read; Sign in if existing account | Create account; Register | Homepage + Sign in utility | Calm, factual | Status in text |
| PW5-STOP-002 | Free trial | No trial surface | Read | Start free / Start trial | Homepage | No commercial tease | Text |
| PW5-STOP-003 | Beta request | No public intake | Read closed-beta explanation | Request-access button | Stay on homepage | No fake form | Stop announced |
| PW5-STOP-004 | Waitlist | No public waitlist | Read | Join waitlist | Homepage | BQA is not the website | Text |
| PW5-STOP-005 | Contact | No public contact destination | None as control | Contact button; mailbox in copy | Homepage | Not unfriendly absence | No dead link |
| PW5-STOP-006 | Demo / tour | No demo or public tour | In-page reading later | Watch demo; View product as `/home` | Document order | No mock tour | No `#` |
| PW5-STOP-007 | Deferred target group | Context not currently available | Read general operator story | Equal edition CTA | General IA | Unequal, not mocking | Availability with the name |
| PW5-STOP-008 | Unpublished legal detail | Named controls only | Read TRUST list | Fake `/privacy` | Homepage | Not a compliance dodge presented as certification | No dead legal link |
| PW5-STOP-009 | Missing destination | HOLD dest. must not look live | None as control | Dead nav | Document order | No “coming soon” link | Do not ship the link |
| PW5-STOP-010 | Authenticated arrival at desired public `/` | Admitted users continue product-entry, not marketing | Product-entry (PW-13) | Showing public homepage as logged out | Product path | Not a public H1 on the auth branch | Distinct from public stop |

No governed public “coming soon” commitment exists. Do not invent one.

**Owner freeze (`PW5-OD-008`):** `TWO-LAYER ACCESS COMMUNICATION`. Status: `RESOLVED — OWNER FROZEN`.

- Layer 1 — Early maturity (`PW5-BLK-004`): short closed-beta status; not GA; no open self-service; no conversion control.
- Layer 2 — Later access and honest-stop block (`PW5-BLK-011`): compact separate required V1 block; existing-account Sign in; clear access situation; explanation for visitors without invitation; no fake next step; no “coming soon”; no request-access, waitlist, or contact button without destination.

The access block is required in V1; not footer-only; not hero-dominant; not a negative disclaimer wall; a calm close of the visitor journey. `HONEST STOP = VALID JOURNEY OUTCOME, NOT A DEAD END`.

---

## 21. Sign-In Utility Model

| Topic | Rule |
| --- | --- |
| Purpose | Let existing account holders sign in |
| Destination | `/login` only |
| Audience | Existing accounts (`PW2-VIS-007`) |
| Required qualifier | Existing accounts; not account creation |
| Accessible name | Must remain recognizably Sign in; not Start/Join/Explore/View product |
| Header | Required and findable |
| Access block | Required functional repeat (`PW5-FLD-062`); not a second acquisition button |
| Footer | Default omit; extra repeat only with demonstrated usability need (`PW5-OD-007`) |
| Mobile | Must remain findable; must not take over the primary brand message |
| Prohibited framing | Primary conversion; product tour via `/login`; Explore → `/login`; Start; Join; Explore; View product |

`/login` is not a marketing homepage and is not a product tour.

`PW5-OD-007 — SIGN IN REPETITION`

| Field | Value |
| --- | --- |
| Owner decision | **SIGN IN IN HEADER AND LATER ACCESS BLOCK** |
| Status | `RESOLVED — OWNER FROZEN` |
| Frozen V1 | Header required; access-block functional repeat required; footer not required; conservative footer default: do not repeat |
| Each instance | Existing accounts; later destination `/login`; not acquisition; not Start/Join/Explore/View product; no open signup |
| Mobile | Findable; must not own the brand message; accessible name and destination purpose remain clear |
| Owner | Product owner / PW-6 |

---

## 22. Footer Content Model

Footer is utility, not the home of material truth. Closed beta must not appear first or only here.

| Footer field | Requirement |
| --- | --- |
| ZyntixAI identity | REQUIRED as allowed role |
| Concise availability repeat | OPTIONAL; cannot be the only maturity location |
| Sign in utility | OMITTED FROM V1 BY DEFAULT (`PW5-OD-007`) |
| Real legal links | HOLD until route + approved content |
| Copyright / ownership | CONDITIONAL on identity authority |
| Social icons | PROHIBITED without destinations |
| Fake address | PROHIBITED |
| Contact | HOLD / omit |
| Pricing, careers, resources | PROHIBITED |
| Customer logos | PROHIBITED |
| Legal claims / certification badges | PROHIBITED |
| Waitlist / public beta request | PROHIBITED |

---

## 23. Content Density and Budget

Budgets are design/copy constraints, not validated optima.

| Budget ID | Block | Desktop density | Mobile density | Maximum concepts | Required preservation | May shorten | Must not remove |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-BUD-001 | BLK-001 | Identity + few nav roles + one utility | Identity + Sign in; extra nav in disclosure if needed | 4 | Sign in; name | Extra in-page items until IDs exist | Sign in; name |
| PW5-BUD-002 | BLK-002 | One H1 idea + optional one support | Same idea | 2 | Operational recognition | Support sentence | Name + recognition |
| PW5-BUD-003 | BLK-003 | One heading + one explanation | Same | 2 | Daily-work value | Object list length | Value meaning |
| PW5-BUD-004 | BLK-004 | One status cluster | Same, still early | 2 | Closed beta; not open join | Invite-only phrasing detail | Maturity; not-GA |
| PW5-BUD-005 | BLK-005 | One mechanism idea | Same | 3 objects max in first draft | Human-operated how | Extra objects | Not-autonomous if BOS/AI used |
| PW5-BUD-006 | BLK-006 | One Today/Home proof cluster | Same | 2 (Today + qualifier; Tasks/Attention only as supporting clause) | Qualifier | Extra module names | Evidence-level qualifier; not a feature catalogue |
| PW5-BUD-007 | BLK-007 | Compact CS cluster | Stacked, attached | 4 visible concepts (compose required fields; do not write seven essays) | Qualifier + availability | Extra CS detail; FLD-069 default omit | Not-LMS; not complete edition; not hero |
| PW5-BUD-008 | BLK-008 | None in V1 | None | 0 | n/a | n/a | Do not reintroduce equal cards |
| PW5-BUD-009 | BLK-009 | Adjacent clause only if triggered | Same | 1 | Limitation if triggered | Extra AI history; no long disclaimer block | Not-generative if AI named |
| PW5-BUD-010 | BLK-010 | Compact control list | Same | 4 | Named-control scope | Extra explanation | No certification leap |
| PW5-BUD-011 | BLK-011 | Compact but complete stop + Sign in | Same | 3 | No public join; Sign in ≠ join; announced close | Extra HOLD examples; not a disclaimer wall | Honest close |
| PW5-BUD-012 | BLK-012 | Header utility + access repeat | Same | 1 function, 2 locations | Label + dest. + qualifier | Visual emphasis | Utility meaning |
| PW5-BUD-013 | BLK-013 | Identity; no Sign in by default | Fewer | 2 | Must not host unique maturity or unique access | Optional copyright | Dead links remain omitted; footer does not replace BLK-011 |
| PW5-BUD-014 | Whole page | Quiet premium; not twelve equal sections | Same order | Prefer identity, value, beta, mechanism, Today, CS, trust, access | Layer B early; CS compact; trust compact | Optional visual; contextual AI | Required V1 truth |

Heading: one idea. Support: one primary explanation. Qualifier: one attached boundary. List: limited proof items. Action: one function. Status: concise and explicit.

Avoid wall of text, disclaimer overload, twelve equal sections, repetitive claims, and visual emptiness that removes product meaning.

---

## 24. Repetition and Consistency Rules

Classify every repeat before writing it.

| Class | Meaning |
| --- | --- |
| `PRIMARY EXPLANATION` | The first place a meaning is established |
| `FUNCTIONAL REPEAT` | A later occurrence required by a different job (utility, attached qualifier, later stop) |
| `QUALIFIER REPEAT` | A bound that must travel with a restated claim |
| `REDUNDANT` | Same meaning without a new job — omit |
| `PROHIBITED` | Repeat that changes availability, conversion, or evidence level |

| Information | Primary location | Repeat class if reused | Must repeat qualifier | Icon-only forbidden |
| --- | --- | --- | --- | --- |
| Closed beta | BLK-004 (`PRIMARY EXPLANATION`) | Footer optional summary = `FUNCTIONAL REPEAT` only after primary; second beta essay = `REDUNDANT` | Yes if restated | Yes |
| Sign in | Header BLK-001/012 (`PRIMARY EXPLANATION` of the utility) | BLK-011 = required `FUNCTIONAL REPEAT`; footer default omit; CS FLD-069 default omit = otherwise `REDUNDANT` | Existing-accounts if it could be read as join | Yes |
| Operational clarity | BLK-002/003 | Mechanism may reuse objects without new claims (`FUNCTIONAL REPEAT`); a third “organize your work” essay = `REDUNDANT` | Outcome prohibition remains | Yes |
| Course Seller qualifier | BLK-007 | Nowhere as brand identity (`PROHIBITED`); restated CS claim needs `QUALIFIER REPEAT` | Always with CS relevance | Yes |
| Availability | BLK-004/011 | Nav role; footer must not be first | Yes | Yes |
| Trust | BLK-010 | Restating as certification = `PROHIBITED` | Control scope | Yes |
| BOS | BLK-005 if used | Do not also hero (`PROHIBITED`) | Plain-language + not-autonomous | Yes |
| AI | Adjacent to mention if triggered | Do not add a second AI section (`PROHIBITED`); default name-disclaimer = `REDUNDANT`/`PROHIBITED` | Not-generative | Yes |
| Today proof | BLK-006 | Repeating as complete suite or public demo = `PROHIBITED` | Home ≠ full edition | Yes |

Use one term family per concept in PW-6. Do not mix Sign in with Join. Do not mix closed beta with launch. Prevent both inconsistent repetition and disclaimer spam (Principle 14).

---

## 25. Visual-Content Dependency Model

No visual is created here.

| Visual ID | Parent block | Intended information role | Required or optional | Source type | Truth risk | Privacy risk | Alt-text need | Mobile fallback | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-VISUAL-001 | BLK-005 | Abstract evidence-safe operational-relationship visual | OPTIONAL — at most one primary V1 visual role | Abstract diagram of operational relationships (not a technical OS, network, or enterprise-architecture claim) | All-in-one overclaim; fake function; OS/network diagram | Low | Informative if it carries meaning | Text mechanism remains complete | `OWNER-FROZEN OPTIONAL`; not designed in this phase |
| PW5-VISUAL-002 | BLK-006 | Product UI screenshot | HOLD | Authenticated UI | Looks like public demo; completeness | High (org/person data) | Required if informative | Text proof list | `HOLD` — not approved; do not make, select, or export |
| PW5-VISUAL-003 | BLK-005 | Simplified workflow as a second primary visual | PROHIBITED as extra primary V1 visual | Conceptual | Implies complete process | Low | If informative | Text objects | Not a second primary visual; VISUAL-001 is the only optional primary slot |
| PW5-VISUAL-004 | BLK-007 | CS relevance visual | OPTIONAL later, not a second primary system visual | Conceptual | LMS/catalog reading | High if real data | Required if informative | CS qualifier text | Must not replace CS text qualifiers |
| PW5-VISUAL-005 | BLK-001/010 | Iconography | OPTIONAL | Decorative or labeled | Color-only status | Low | Decorative vs informative split | Text labels | Later |
| PW5-VISUAL-006 | BLK-002 | Decorative brand visual | OPTIONAL | Brand | Must not carry the claim | Low | Decorative: empty alt | Identity text remains | Later |
| PW5-VISUAL-007 | BLK-008 | Four equal TG illustrations | PROHIBITED | n/a | Fake equal availability | n/a | n/a | n/a | `PROHIBITED` |
| PW5-VISUAL-008 | BLK-002/009 | Chatbot-interface visual as hero | PROHIBITED | n/a | Chatbot-first identity | n/a | n/a | n/a | `PROHIBITED` |

Screenshot rules: no real customer, organization, or personal data; authenticated UI must not be presented as a public demo; mock UI is conceptual; availability remains in text; no four equal TG pictures. Screenshot reconsideration requires: privacy review; state review; data sanitization; evidence review; truth vs deployed product; permission for public representation; responsive crop review; accessible alternative; design-phase authority. No screenshot is made, selected, or exported in this phase. No abstract visual is designed in this phase.

`PW5-OD-006 — VISUAL-EVIDENCE STRATEGY`

| Field | Value |
| --- | --- |
| Owner decision | **TEXT-FIRST WITH SPACE FOR ONE OPTIONAL ABSTRACT, EVIDENCE-SAFE OPERATIONAL-SYSTEM VISUAL** |
| Status | `RESOLVED — OWNER FROZEN` |
| Frozen V1 | Textual product meaning is independently complete; at most one primary abstract operational-relationship visual role may be prepared later; optional; may help operational relationships; must not show non-existent function; must not present four TGs as equal; must not be chatbot-first; must not suggest generative/autonomous AI; must not act as customer proof; must not be a technical OS, network, or enterprise-architecture diagram |
| Screenshot | `HOLD` |
| Owner | Product + design + privacy |

---

## 26. Content State Model

The model must work beyond the ideal logged-out draft.

| State ID | Trigger | Affected block | Required truth | Allowed content change | Prohibited change | Fallback | Reverification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-STATE-001 | Default public visitor | All public blocks | Desired IA content roles | Normal rendering later | Claiming publication-ready now | Document-order reading | PW-12 |
| PW5-STATE-002 | Closed-beta policy still governed | BLK-004/011 | Invite-only; not GA | Phrasing via PW-6 | GA language | Keep BLK-004 | Registration-policy change |
| PW5-STATE-003 | Existing-account utility | BLK-001/011/012 | Sign in to `/login` in header and access block | Emphasis, not rewrite as join | Conversion framing; footer-only | Header + access Sign in | Auth change |
| PW5-STATE-004 | Destination unavailable | NAV/CTA/footer | Omit control | Text stop | Dead button | STOP-009 | Destination authority |
| PW5-STATE-005 | Legal content unavailable | BLK-010/013 | Named controls only | Omit legal links | Template policy | TRUST list | Legal authority |
| PW5-STATE-006 | Target-group deferred | BLK-008 omitted; STOP-007 | Not an active V1 homepage proposition | Safe-stop if visitor expectation arises | Equal live cards; deferred section reintroduced | Omit + STOP-007 | TG Production FV + owner |
| PW5-STATE-007 | Visual asset unavailable | VISUAL-001 | Text carries meaning | Hide optional visual | Hide required text | Mechanism/proof text | Asset review |
| PW5-STATE-008 | Evidence expired | BLK-006/007 | Withdraw or requalify | Remove stale proof | Keep old completeness | Conservative omit | GOV claim-expiry |
| PW5-STATE-009 | Copy awaiting validation | All copy fields | Schema still binds | Candidate copy only | Treat as frozen publication copy | Placeholders | VAL plan |
| PW5-STATE-010 | Authenticated visitor on desired public `/` | Not public marketing | Product-entry, not BLK-002 H1 | PW-13 branch | Show public homepage as logged out | PW4 §17.7 | PW-13 |
| PW5-STATE-011 | Narrow mobile | All V1 required blocks | Same core truth | Shorten per BUD | Remove qualifier/maturity/CS qualifier/trust scope/Sign in | Single order | PW-7 |
| PW5-STATE-012 | Visitor without invitation | BLK-011 | Honest stop is a valid outcome | Calm close | Fake next step; dead end | STOP-001–006 | PW-6 |
| PW5-STATE-013 | Course Seller V1 block present | BLK-007 | Compact qualified relevance | Copy candidates | CS hero or complete edition | Qualifiers FLD-033–035, 063–066 | PW-6/12 |
| PW5-STATE-014 | AI clarification not triggered | BLK-009 omitted | No standalone AI section | Do not invent AI copy | Standalone AI section | Identity/value remain product-led | VAL-007 |
| PW5-STATE-015 | AI clarification triggered | BLK-009 contextual | Short bound after positive product explanation | Adjacent qualifier | Long disclaimer; generative promise | FLD-041 | PW-6 |
| PW5-STATE-016 | Screenshot HOLD | VISUAL-002 | No product UI image | Keep HOLD | Screenshot used without approval | Text proof | GOV-014 |
| PW5-STATE-017 | Admission / registration policy change | BLK-004/011/012; FLD-019–023 | Re-verify closed-beta and Sign in ≠ join against the new governed policy; live flag remains UNKNOWN until re-probed | Withdraw CTAs that the new policy still forbids | Invent public signup, waitlist, or GA from a rumour | Keep fail-closed omit of HOLD destinations | GOV-005/017/021 |

---

## 27. Content Governance and Lifecycle

Event-based. No calendar date is invented. Publication effect is never automatic: a trigger requires re-verify, requalify, or withdraw — it does not authorize new CTAs, screenshots, or legal sentences.

| Gov ID | Topic | Rule |
| --- | --- | --- |
| PW5-GOV-001 | Content owner | Product owner for meaning; PW-6 for wording; design for visuals |
| PW5-GOV-002 | Evidence owner | PW-1 remains maximum truth; this file maps, does not widen |
| PW5-GOV-003 | Review trigger | Any claim, destination, TG, AI, legal, or routing change |
| PW5-GOV-004 | Claim expiry | New SHA that changes Home/Tasks/Attention/CS evidence; parked Production gates |
| PW5-GOV-005 | Availability-change | `PUBLIC_REGISTRATION_ENABLED` live re-probe; GA authority |
| PW5-GOV-006 | TG readiness | TG2–TG4 Production FV + admission policy before any availability upgrade |
| PW5-GOV-007 | Legal-review | Before any privacy/terms sentence or footer legal link |
| PW5-GOV-008 | Destination-readiness | Before any new CTA or nav dest. |
| PW5-GOV-009 | Copy revalidation | After PW-6 candidates; after any qualifier change |
| PW5-GOV-010 | Asset privacy review | Before any screenshot or mock derived from product UI; screenshot remains HOLD until all listed reviews exist |
| PW5-GOV-011 | Production deployment verification | After PW-14; not this phase |
| PW5-GOV-012 | Canonical-host ownership | Still unresolved (`PW0-PB-034`); do not encode competing host claims in content |
| PW5-GOV-013 | Course Seller evidence change | Re-enter CS mapping if CLM-015/016/071 or PRH-022 change; do not widen to a complete edition |
| PW5-GOV-014 | Screenshot approval | Requires privacy, state, sanitization, evidence, truth, permission, crop, a11y, and design-phase authority before HOLD can be lifted |
| PW5-GOV-015 | Public intake or contact destination | New destination authority before any CTA; V1 remains omit |
| PW5-GOV-016 | Today/Home product change | Re-verify PROOF-001 against current Home contract; do not inflate to other modules |
| PW5-GOV-017 | Closed-beta / registration policy | Re-verify BLK-004/011; live flag remains UNKNOWN until re-probed |
| PW5-GOV-018 | Root-route behavior | Authenticated arrival remains PW-13; public content must not assume Root A is implemented |
| PW5-GOV-019 | AI capabilities | New AI ranking, generative, or autonomous capability evidence is required before any AI content meaning expands; V1 remains no standalone AI block |
| PW5-GOV-020 | Tasks/Attention evidence change | Re-verify FLD-067 and PROOF-002/003; do not promote them to peer Production or merge them into Home E5 |
| PW5-GOV-021 | Admission / beta-access policy | Re-verify BLK-004/011 and Sign in qualifier; no invented intake; publication remains fail-closed until new PW-1 authority |

If registration opens, beta access opens, contact appears, TG2–TG4 gain Production evidence, AI changes, legal authority arrives, authenticated routing changes, screenshots are proposed, Home/Today changes, or canonical host is owned: re-enter PW-1/PW-5 mapping before copy stays published. Conservative content remains fail-closed. No calendar date is invented.

---

## 28. Copy-Input Contract

PW-6 receives the frozen schema below. It may write headline candidates, supporting-copy candidates, navigation labels, maturity wording, section labels, qualifier wording, trust wording, safe-stop wording, and accessible labels.

PW-6 may not: invent product claims; activate HOLD CTAs; write legal conclusions; suggest four-TG availability; make Course Sellers brand-primary; invent AI capabilities; reverse a frozen content-model decision without owner authority.

Required copy units: header identity; in-page navigation labels; primary identity/recognition; plain-language value; early closed-beta status; mechanism explanation; Today/Home proof; qualified Course Seller relevance; compact named-controls trust; later access/honest-stop explanation; Sign in utility in header; Sign in utility in the access block; footer identity/utility.

Conditional copy units: short contextual AI clarification, only if triggered; abstract visual support text/alternative, if used; public not-found/safe-stop content when later in scope.

Omitted V1 copy units: deferred target-group section; standalone AI section; screenshot caption; four solution cards; pricing; trial; signup; request access; waitlist; contact; demo; testimonials; customer logos; traction metrics.

Composition constraint: required copy units are information roles, not eleven visual sections (`PW5-COMP-*`). CS required meanings must compose into BUD-007. The product name is not a default AI-disclaimer trigger. `PRODUCT PROOF CLAIM` is selected; screenshot, public demo, and proof assets are not.

| Block | Message role | Audience | Visitor question | Required meaning | Evidence | Level | Mandatory qualifier | Prohibited implication | Tone | Field type | Budget | Mobile preservation | A11Y | Action/dest. | Validation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BLK-001 | Orientation + utility | All | How do I move? | Name + Sign in | CLM-001, 045 | E5 | Existing accounts | Signup nav | Quiet | Labels/links | BUD-001 | Name + Sign in | Unique names | `/login` only live dest. | VAL-016 |
| BLK-002 | Recognition | VIS-001 | What is this? | Operational product, not chatbot-first | MSG-001/002; CLM-001, 003 | E5 name; E3 not-only-chatbot | Not CS-primary | BOS/AI hero | Plain | H1 + optional support | BUD-002 | Recognition | One H1 | None | VAL-003 |
| BLK-003 | Value | VIS-001 | What work is organized? | Daily operating clarity | TER-001; POS-001 | Intent + Home fact | No outcomes | All-in-one | Concrete | Heading + support | BUD-003 | Value | Relation preserved | None | VAL-001 |
| BLK-004 | Maturity | All | Can I use it? | Closed beta; not GA | CLM-007, 008, 011 | E5 historical policy; E3 fail-closed | Invite-only last governed; live flag UNKNOWN | Scarcity; free | Factual | Status | BUD-004 | Early status | Status text | No HOLD CTA | VAL-004 |
| BLK-005 | Mechanism | VIS-001 | How does it work? | Human-operated objects | CLM-018, 070, 027 | Mixed tiers | Tiers not merged | Autonomous OS | Explanatory | Definition | BUD-005 | How | Acronym if BOS | In-page later | VAL-006 |
| BLK-006 | Primary Today proof | VIS-001 | What exists? | Authenticated daily overview | OD-005; PROOF-001 | E5 Home only | Home ≠ full edition | Complete suite; Tasks/Attention as Production peers | Restrained | Today + qualifier | BUD-006 | Qualifier | List text | None | VAL-011 |
| BLK-007 | CS relevance | CS visitor | Is this for course work? | Compact qualified example | CLM-015/016/071 | E4 + prohibit LMS | SECONDARY; not complete | LMS; brand capture; hero | Qualified | Relevance + qualifier | BUD-007 | Qualifier | Text availability | Stop if uninvited | VAL-008/009 |
| BLK-008 | Deferred boundary | TG2–4 visitors | Are others live? | Omitted from V1 | CLM-020–022, 055 | E4 slice ≠ offering | Unequal | Four editions | n/a in V1 | Omit | BUD-008 | n/a | n/a | STOP-007 if asked | VAL-010 |
| BLK-009 | AI limit | If triggered | Is it generative? | Short bound after positive product | CLM-027, 054 | E3/E5 forbid ranking | Adjacent | Standalone section; connect provider | Precise | Qualifier | BUD-009 | With mention | Text | None | VAL-007 |
| BLK-010 | Trust | Trust seekers | What about access/data? | Named controls | TRUST-001–004 | E5/E3 controls | Not legal conclusion | SOC/GDPR | Technical-plain | List | BUD-010 | Controls | Names in order | No legal link | VAL-012 |
| BLK-011 | Later honest stop | Uninvited | What can I do? | No public join + Sign in utility | STOP-001–006; FLD-062 | Policy | Sign in ≠ join | Coming soon CTA; disclaimer wall | Calm close | Status + support + Sign in | BUD-011 | Stop | Announced | Utility Sign in | VAL-017 |
| BLK-012 | Utility | VIS-007 | Where do I sign in? | Sign in in header and access block | CLM-045 | E5 | Existing accounts | Join/Start; footer-only | Functional | Label + link | BUD-012 | Findable | Accessible name | `/login` | VAL-005 |
| BLK-013 | Footer utility | All | Where is identity/legal? | Repeat, not new truth | CLM-001 | E5 name | Legal HOLD | Dead links; unique access | Minimal | Labels | BUD-013 | Not unique maturity | Link purpose | Omit HOLD | Footer audit |

---

## 29. Responsive-Content Rules

Content behavior, not layout.

| Resp ID | Rule |
| --- | --- |
| PW5-RESP-001 | Desktop and mobile keep the same core meaning |
| PW5-RESP-002 | Maturity remains early in the reading order |
| PW5-RESP-003 | Qualifiers stay attached to their claims |
| PW5-RESP-004 | Heading and support keep one relationship |
| PW5-RESP-005 | Proof items may be reduced, not falsely merged |
| PW5-RESP-006 | Course Seller relevance stays qualified; CS is required in V1 and remains attached on mobile |
| PW5-RESP-007 | Deferred TG section stays omitted; if a visitor expectation arises, use STOP-007 rather than a homepage section |
| PW5-RESP-008 | Sign in remains utility, findable in header and later access block |
| PW5-RESP-009 | Navigation labels remain understandable |
| PW5-RESP-010 | Optional visual may disappear when text equivalent remains complete |
| PW5-RESP-011 | No essential text only in a tooltip or hover |
| PW5-RESP-012 | No required horizontal target-group comparison; footer does not replace the access block |

---

## 30. Accessibility-Content Rules

Requirements, not implementation evidence.

| A11Y ID | Requirement |
| --- | --- |
| PW5-A11Y-001 | One meaningful page heading (identity/recognition) |
| PW5-A11Y-002 | Heading purpose per block |
| PW5-A11Y-003 | Link purpose without visual context, including Sign in destination purpose (`/login`, existing accounts) |
| PW5-A11Y-004 | Status as text |
| PW5-A11Y-005 | Qualifier in reading order |
| PW5-A11Y-006 | Availability not only via color or icon |
| PW5-A11Y-007 | Acronym expansion at first relevant BOS mention |
| PW5-A11Y-008 | Understandable language; “operator” not mandatory public jargon |
| PW5-A11Y-009 | Decorative versus informative visual split |
| PW5-A11Y-010 | Alt-text matches information role when informative |
| PW5-A11Y-011 | No duplicate ambiguous links (two Sign ins must share purpose) |
| PW5-A11Y-012 | Error/safe-stop identified in text |
| PW5-A11Y-013 | Screen-reader-equivalent maturity |
| PW5-A11Y-014 | In-page navigation target names match headings |
| PW5-A11Y-015 | Language attribute remains `lang="en"` until a language strategy exists |
| PW5-A11Y-016 | No motion-dependent content meaning |
| PW5-A11Y-017 | No hover-only explanation |

---

## 31. Claim-to-Content Traceability

`NEED-*` and `JNY-*` in this table are `PW4-NEED-*` / `PW4-JNY-*`, which encode PW-2 visitor questions and journeys for public IA. They are not a second PW-2 ID family.

| Map ID | Block/field | PW-1 source | PW-2 via PW-4 need/journey | PW-3 message | PW-4 IA role | Allowed content meaning | Qualifier | Prohibited expansion | Readiness |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-MAP-001 | BLK-002 / FLD-010 | CLM-001, 003 | NEED-001; JNY-001 | MSG-001/002 | SEC-001 | Named product for daily operating work | Not chatbot-first | CS as brand; GA site | Copy required |
| PW5-MAP-002 | BLK-003 / FLD-015 | CLM-002, 018 | NEED-003 | TER-001; POS-001 | SEC-002 | Organize customers, work, responsibilities, progress, attention as meaning | No guaranteed outcomes | Complete suite | Copy required |
| PW5-MAP-003 | BLK-004 / FLD-019 | CLM-007, 008, 011 | NEED-008/009 | MSG-009 | SEC-003 | Closed beta; not GA; not open signup | Live flag UNKNOWN | Scarcity; free | Copy required (`PW3-OD-007`) |
| PW5-MAP-004 | BLK-005 / FLD-025 | CLM-018, 070, 027, 062 | NEED-004 | MSG-005/006 | SEC-004 | Conceptual operating objects | Tiers not merged | Autonomous BOS | Copy required |
| PW5-MAP-005 | BLK-006 / PROOF-001 | CLM-014, 018 | NEED-007 | MSG-005 | SEC-005 | Today brief exists for admitted users | Not public Home | Full edition from Home; Tasks/Attention as Production peers | `CONTENT-MODEL REQUIRED` |
| PW5-MAP-006 | BLK-007 / FLD-033–035, 063–066 | CLM-015, 016, 071 | NEED-012; JNY-005 | MSG-007/015 | SEC-006 | Compact qualified CS relevance | SECONDARY; not LMS | Complete CS edition; CS hero | `CONTENT-MODEL REQUIRED` |
| PW5-MAP-007 | BLK-008 omitted from V1 | CLM-020–022, 055 | NEED-013; JNY-006 | MSG-008 | SEC-007 | Not an active V1 proposition | Unequal | Four live editions | `OMITTED FROM V1` |
| PW5-MAP-008 | BLK-009 / FLD-041 | CLM-003, 027, 054 | NEED-005 | MSG-003/012 | SEC-008 | Contextual AI bound only if triggered | Adjacent; not a section | AI feature section | Conditional governance |
| PW5-MAP-009 | BLK-010 / TRUST-* | CLM-032, 013, 034, 033 | NEED-014; JNY-007 | TRU named controls | SEC-009 | Named controls | Not legal conclusion | Certification | `CONTENT-MODEL REQUIRED` |
| PW5-MAP-010 | BLK-011 / STOP-* / FLD-062 | CLM-045–053 | NEED-010/011/016/018; JNY-004 | MSG-009 | SEC-010 | Two-layer access; later honest stop | Sign in ≠ join | HOLD buttons; footer-only stop | `CONTENT-MODEL REQUIRED` |
| PW5-MAP-011 | BLK-012 / FLD-052 + FLD-062 | CLM-010, 045 | NEED-015; JNY-002 | n/a | NAV-005; SEC-011 | Sign in in header and access block | Existing accounts | Start/Join; footer-only | `CONTENT-MODEL REQUIRED` |
| PW5-MAP-012 | BLK-001 / FLD-002 | CLM-050 HOLD | FUT-006 | n/a | NAV-001–004 | In-page dest. later | Not publication-ready | `#`; Explore→login | HOLD dest. |
| PW5-MAP-013 | BLK-013 / FLD-057 | CLM-041, 042 | NEED-014 | `PW3-OD-009` | SEC-012 | Legal links only with authority | EXTERNALLY GATED | Template policy | HOLD |
| PW5-MAP-014 | BLK-014 | PAGE-016 | STOP-008 | n/a | PAGE-016 | Missing page later | Not product chrome | Fake sitemap | Optional later |
| PW5-MAP-015 | BLK-004 + BLK-011 | CLM-007, 008, 011, 045 | NEED-008–011 | MSG-009 | SEC-003 + SEC-010 | Two-layer access communication | Layer 1 informational; Layer 2 stop | Conversion in Layer 1 | `CONTENT-MODEL REQUIRED` |
| PW5-MAP-016 | FLD-068 / VISUAL-001 | n/a visual | NEED-004 | MSG-005 | SEC-004 | Optional abstract operational visual | Text remains complete | Fake function; four TGs; chatbot | Optional |
| PW5-MAP-017 | BLK-006 / FLD-067 | CLM-070 | NEED-007 | MSG-006 | SEC-005 | Tasks/Attention supporting context only | Own lower evidence tier | Peer Production proofs | Conditional clause |

No orphan substantive block. No unsupported claim. No IA role without a content input. Mixed evidence levels remain visible. HOLD actions are not public controls. Visuals, if any, require a textual truth source.

---

## 32. Content Risk Register

| Risk ID | Trigger | Affected block | Affected visitor | Misleading interpretation | Likelihood | Impact | Severity | Preventive content rule | Detection | Owner | Blocking phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-RSK-001 | Hero uses BOS jargon | BLK-002 | VIS-001 | Technical OS | Medium | High | High | FLD-014; BOS only in BLK-005 with qualifier | VAL-003/006 | PW-6 | PW-6 |
| PW5-RSK-002 | Hero becomes AI/chatbot-first | BLK-002/009 | VIS-001 | Chatbot product | Medium | High | High | AI not H1; VISUAL-008 prohibited | VAL-003/007 | PW-6 | PW-6 |
| PW5-RSK-003 | “Operator” as unfamiliar address | BLK-002 | VIS-001 | Insider jargon | Medium | Medium | Medium | Public addressing need not say operator | VAL-003 | PW-6 | PW-6 |
| PW5-RSK-004 | Closed beta too late | BLK-004/013 | All | Implied GA | High if footer-only | High | High | Layer B early; BUD-004 | VAL-004 | PW-5/7 | Design freeze |
| PW5-RSK-005 | Beta wording implies signup | BLK-004 | VIS-001 | Join here | High | High | High | FLD-023 prohibited; OD-007 | VAL-004/005 | PW-6 | PW-6 |
| PW5-RSK-006 | Sign in appears primary conversion | BLK-001/012 | VIS-001 | Sign in = join | High | High | High | Utility labelling; BLK-011 stop | VAL-005 | PW-6/12 | PW-12 |
| PW5-RSK-007 | Proof implies complete suite | BLK-006 | VIS-001 | All-in-one now | Medium | High | High | FLD-030; OD-005 Today-only primary | VAL-011 | Owner | PW-6 |
| PW5-RSK-008 | Home evidence expands to full edition | BLK-006 | VIS-001 | CS/Tasks current-SHA complete | Medium | High | High | PRH-022; PROOF-001 qualifier; FLD-067 | VAL-011 | PW-1/6 | PW-6 |
| PW5-RSK-009 | Course Seller becomes brand-primary | BLK-007 | VIS-001 | CS = ZyntixAI | Medium | High | High | OD-001 required compact; not ATF; not hero | VAL-008 | PW-6 | PW-6 |
| PW5-RSK-010 | Course Seller appears as LMS | BLK-007 | CS visitor | Public catalog | Medium | High | High | FLD-036 | VAL-009 | PW-6 | PW-6 |
| PW5-RSK-011 | Four TGs equally available | BLK-008 | TG visitors | Four live editions | Medium | High | High | OD-002 omit from V1; FLD-040 prohibited | VAL-010 | PW-9/12 | PW-12 |
| PW5-RSK-012 | Deferred groups reintroduced | BLK-008 | TG visitors | Named = live | Medium if ignored | High | High | OMITTED FROM V1; STOP-007 only | VAL-010 | PW-6/9 | PW-6 |
| PW5-RSK-013 | Connected means all-in-one | BLK-005 | VIS-001 | Complete platform | Medium | High | High | FLD-027; matrix | VAL-006 | PW-6 | PW-6 |
| PW5-RSK-014 | Abstract visual overclaims | VISUAL-001 | All | Live complete UI | Medium if used | High | High | Visuals ≤ text; optional | VAL-018 | Design | PW-10 |
| PW5-RSK-015 | Screenshot used without approval | VISUAL-002 | All | Real org/PII or fake demo | Medium if ignored | High | High | HOLD; GOV-014 | Privacy review | Privacy | Before asset |
| PW5-RSK-016 | Mock UI appears live | VISUAL-002/003 | VIS-001 | Public demo | Medium | High | High | Conceptual labelling; screenshot HOLD | VAL-018 | Design | PW-10 |
| PW5-RSK-017 | Named controls imply compliance | BLK-010 | Trust seekers | GDPR/SOC | Medium | High | High | FLD-045/046 | VAL-012 | PW-6/8 | PW-8 |
| PW5-RSK-018 | Footer dead links | BLK-013 | Trust seekers | Broken legal/contact | High if templated | High | High | Omit HOLD dest. | Footer audit | PW-6 | PW-13 |
| PW5-RSK-019 | Unavailable CTA as button | BLK-004/011 | HOLD seekers | Live intake | High in SaaS templates | High | High | FLD-023/051 | CTA inventory | PW-6 | PW-5 |
| PW5-RSK-020 | Safe stop becomes disclaimer wall or dead end | BLK-011 | Uninvited | Broken page or negativity | Medium | Medium | High | Escape = read + Sign in; compact; not footer-only | VAL-017 | PW-6 | PW-6 |
| PW5-RSK-021 | Mobile removes qualifier | All qualified blocks | Mobile VIS-001 | Unqualified claim | Medium | High | High | RESP-003; BUD | VAL-014 | PW-7 | PW-7 |
| PW5-RSK-022 | Density destroys calm/premium feel | Whole page | VIS-001 | Wall of text | Medium | Medium | High | BUD-014; Principle 12 | VAL-013 | PW-6/9 | PW-9 |
| PW5-RSK-023 | Excessive disclaimers hide value | BLK-002–006 | VIS-001 | Product has no meaning | Medium | High | High | Principle 14; no long AI disclaimer | VAL-003/013 | PW-6 | PW-6 |
| PW5-RSK-024 | Footer duplication / Sign in as conversion | BLK-001/011/013 | All | Mixed maturity or join | Medium | High | High | OD-007 header+access; footer omit | VAL-005 | PW-6 | PW-6 |
| PW5-RSK-025 | Outdated evidence remains published | BLK-006 | All | Stale completeness | Medium later | High | High | STATE-008; GOV-004/016 | Stale-evidence review | Evidence owner | Before publish |
| PW5-RSK-026 | Final copy written before PW-6 | All | All | Schema treated as copy | Medium | High | High | This freeze is not copy | Copy review | PW-6 | PW-6 start |
| PW5-RSK-027 | Internal governance language leaks | Any | VIS-001 | Unreadable SHA/gate jargon | Medium | Medium | Medium | Principle 13 | Copy review | PW-6 | PW-6 |
| PW5-RSK-028 | Artificial testimonials/metrics/logos | Footer/proof | All | Fake traction | Medium if templated | High | High | CLM-039, 040; FLD-059 | Proof audit | PW-6 | PW-6 |
| PW5-RSK-029 | Standalone AI section reintroduced | BLK-009 | VIS-001 | AI product | Medium | High | High | OD-003 Option A | VAL-007 | PW-6 | PW-6 |
| PW5-RSK-030 | Tasks/Attention called Production | BLK-006 | VIS-001 | Current-SHA suite | Medium | High | High | FLD-067; PROOF-002/003 supporting only | VAL-011 | PW-6 | PW-6 |
| PW5-RSK-031 | Inconsistent repetition | Beta, Sign in, CS, Today | All | Mixed GA/join/suite status | Medium | High | High | §24 classes; one term family | VAL-013/005 | PW-6 | PW-6 |
| PW5-RSK-032 | Required CS + omitted TG2–TG4 reads as CS-only brand | BLK-002/007 | VIS-001 | ZyntixAI is a Course Seller product | Medium | High | High | Operator-first identity/value/Today carry brand width; CS compact secondary; do not reverse OD-001 | VAL-008/021 | PW-6/12 | PW-6 |
| PW5-RSK-033 | Operational-system visual read as technical OS | VISUAL-001 | VIS-001 | Enterprise architecture / autonomous OS | Medium if designed loosely | High | High | Abstract operational relationships only; text-first | VAL-018 | Design | PW-10 |
| PW5-RSK-034 | Extra CS Sign in becomes conversion | BLK-007 | CS visitor | Join the CS edition | Medium if FLD-069 ignored | High | High | FLD-069 default omit | VAL-005 | PW-6 | PW-6 |

---

## 33. Validation Plan

All results: `PLANNED — NOT EXECUTED`. All thresholds: `PROPOSED — NOT ACHIEVED`. No participants, results, or analytics are fabricated.

| Val ID | Objective | Artifact | Reviewer/participant profile | Method | Proposed threshold | Failure condition | Evidence output | Blocking phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-VAL-001 | Block-purpose review | This schema + later copy | Independent reviewer | Checklist vs BLK register | Every required block has one function | Dual conversion+identity in one block | Notes | PW-6 |
| PW5-VAL-002 | Claim-to-content audit | MAP + copy candidates | PW-1 literate reviewer | Trace each sentence | 100% substantive claims mapped | Unsupported claim | Matrix | PW-6 |
| PW5-VAL-003 | Five-second comprehension | Homepage artifact later | VIS-001 analogue | Five-second test | Majority: daily work, not chatbot | Chatbot-first or CS-as-brand | Notes | PW-6 |
| PW5-VAL-004 | Closed-beta comprehension | Artifact | Any visitor analogue | Findability | Beta in early viewport, not footer-only, not hero | GA inference | Notes | PW-5/7 |
| PW5-VAL-005 | Sign in versus signup, including header + access repetition | Header + access | VIS-001 and VIS-007 | First-click + question | Majority: no public signup; both Sign ins read as utility | Sign in = join; footer-only | Notes | PW-6 |
| PW5-VAL-006 | BOS comprehension | Mechanism copy if BOS used | VIS-001 | Read-aloud | Not technical OS | Unexplained OS | Notes | PW-6 |
| PW5-VAL-007 | Chatbot-only interpretation and contextual AI | Identity ± triggered AI bound | VIS-001 | Question | Not chatbot-first; no standalone AI section | Generative SKU; AI section | Notes | PW-6 |
| PW5-VAL-008 | Required CS relevance without brand capture | BLK-007 (required V1) | CS visitor analogue | Question | Relevant but not whole brand; not hero | Brand = CS | Notes | PW-6 |
| PW5-VAL-009 | CS LMS misinterpretation | BLK-007 | CS visitor analogue | Question | Not LMS/catalog | Students take courses here | Notes | PW-6 |
| PW5-VAL-010 | Omitted deferred-context interpretation | Homepage without BLK-008 | Deferred TG analogue | Question | Not live editions; no missing-section failure that invents cards | Equal live cards | Notes | PW-12 |
| PW5-VAL-011 | Today-proof comprehension | BLK-006 | VIS-001 | Question | Daily overview, not complete suite; Tasks/Attention not Production peers | Home = full edition | Notes | PW-6 |
| PW5-VAL-012 | Compact trust comprehension | BLK-010 | Trust seeker | Question | Named controls; no legal leap | Compliance inferred | Notes | PW-8 |
| PW5-VAL-013 | Content density | Full page | Design + content | Expert review | Calm; not wall; not empty | Twelve equal sections or disclaimer fog | Notes | PW-9 |
| PW5-VAL-014 | Mobile qualifier preservation | Narrow viewport | Mobile VIS-001 | Order review | Qualifiers still attached; beta early; CS qualified; Sign in findable | Reorder hides truth | Notes | PW-7 |
| PW5-VAL-015 | Screen-reader reading order | Later prototype | SR user / expert | Landmark + heading review | One H1; status in text | Marketing H1 on Home | Checklist | PW-8 |
| PW5-VAL-016 | Link-purpose review including two Sign ins | Nav + header/access Sign in | Keyboard/SR | Name review | Shared Sign in purpose; no `#` | Explore→login; conflicting names | Checklist | PW-8 |
| PW5-VAL-017 | Two-layer access / safe-stop comprehension | BLK-004 + BLK-011 | Uninvited visitor | Question | Early beta found; later stop understood; not broken; not disclaimer wall | Looks for missing button; footer-only stop | Notes | PW-6 |
| PW5-VAL-018 | Optional abstract visual truth | VISUAL-001 if used | Content + privacy | Compare to text | Visual ≤ text; no PII; may omit | Live demo / four TGs / chatbot | Notes | PW-10 |
| PW5-VAL-019 | Stale-evidence review | Proof list vs PW-1 | Evidence owner | SHA/gate check | Current mapping | Expired completeness | Log | Before publish |
| PW5-VAL-020 | Copy handoff completeness | PW-6 inputs vs §28 | PW-6 author | Contract checklist | Every required V1 block has inputs; COMP roles ≠ sections | Missing qualifier/evidence; eleven visual sections assumed | Checklist | PW-6 start |
| PW5-VAL-021 | CS-only brand from TG omission | Identity/value + CS + omitted BLK-008 | VIS-001 analogue | Question | General operator product with one qualified CS example | Brand = Course Sellers | Notes | PW-6 |
| PW5-VAL-022 | Required roles not eleven visual sections | Schema + later wireframe | Design + content | Expert review | Related roles may compose per COMP; required truth remains | Twelve equal sections | Notes | PW-9 |
| PW5-VAL-023 | Complete-suite synonym scan | BLK-005/006 copy | VIS-001 | Claim audit | No “everything in one place” / connected-as-complete | Suite via synonym | Matrix | PW-6 |

---

## 34. Open Questions

| Q ID | Question | Status | Conservative default | Owner | Resolution phase | Blocking gate | Consequence if unresolved |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-Q-001 | Is the Course Seller block required or conditional? | **RESOLVED** | Required compact qualified V1 block; not hero | Product owner | `PW5-OD-001` | PW-6 CS copy/qualifiers | CS hero or missing CS relevance |
| PW5-Q-002 | Are deferred contexts named? | **RESOLVED** | Omit from V1 (Option A) | Product owner | `PW5-OD-002` | Later TG evidence + owner | Fake scale if reintroduced |
| PW5-Q-003 | Is a standalone AI expectation block needed? | **RESOLVED** | No standalone; contextual only if triggered | Product owner | `PW5-OD-003` | PW-6 if AI named | Chatbot-capture or unexplained name |
| PW5-Q-004 | Is trust a separate block or integrated? | **RESOLVED** | Compact separate named-control block | Product owner | `PW5-OD-004` | Legal remainder external | Hidden trust or compliance leap |
| PW5-Q-005 | Which proof areas are selected? | **RESOLVED** | Today/Home primary; Tasks/Attention supporting only | Product owner | `PW5-OD-005` | PW-6 proof copy | Complete-suite implication |
| PW5-Q-006 | Is product UI used as a screenshot? | **RESOLVED** | HOLD; not V1 | Product + privacy | `PW5-OD-006` | GOV-014 if later proposed | Privacy leak or fake demo |
| PW5-Q-007 | Is an abstract system visual used? | **RESOLVED** (strategy) | Optional; at most one primary abstract visual; text-first | Design | `PW5-OD-006` | PW-10 production | Empty or overclaiming visual |
| PW5-Q-008 | How is closed beta exactly phrased? | **OPEN** | Factual invite-only closed beta; not scarcity | Product owner | `PW3-OD-007` / PW-6 | Copy freeze | GA or signup implication |
| PW5-Q-009 | How many in-page navigation items / exact labels? | **OPEN** | Functional roles only; omit until real IDs | PW-6/13 | After IDs exist | Focus/a11y | `#` or hidden truth |
| PW5-Q-010 | Is Sign in shown once or multiple times? | **RESOLVED** | Header + later access block; footer default omit | Product owner | `PW5-OD-007` | PW-6 | Conversion-looking duplicates |
| PW5-Q-011 | Which legal/footer items exist at publication? | **EXTERNALLY GATED** | Omit legal links | Legal | External | Public-deployment completeness | Dead links or missing legal |
| PW5-Q-012 | Language strategy? | **OPEN** | Keep `lang="en"` | Product owner | Later | Localization start | Mixed-language IA |
| PW5-Q-013 | Public owner/copyright identity? | **EXTERNALLY GATED** | Omit invented legal entity/address | Legal/identity | External | Footer copy | Fake address |
| PW5-Q-014 | Authenticated arrival on public `/`? | **OPEN** technically | Not public marketing content | PW-13 | PW4 §17.7 | Root A implementation | Silent Root B |
| PW5-Q-015 | When is evidence revalidated? | **OPEN** as events | Event-based GOV-004–021 | Evidence owner | After SHA/policy change | Stale proof | Outdated claims |
| PW5-Q-016 | What may be shortened on mobile? | **OPEN** in detail | BUD + RESP; never qualifier/maturity/Sign in/CS qualifier | PW-7 | PW-7 | Hidden truth | Unqualified mobile page |
| PW5-Q-017 | Which safe-stop information sits on the homepage? | **RESOLVED** | Two-layer: early beta + later compact access/stop | Product owner | `PW5-OD-008` | PW-6 | Dead end or missing stop |
| PW5-Q-018 | Which content waits on PW-6 validation? | **OPEN** | All copy candidates | PW-6 | VAL-003–017 | Unvalidated publication copy | Schema treated as copy |

### 34.1 Question-count reconciliation

| Count | Establishment (before OD freeze) | After OD freeze |
| --- | --- | --- |
| Total | 18 | 18 |
| Resolved | 0 | 9 (`PW5-Q-001`–`007`, `010`, `017`) |
| Partially resolved | 0 | 0 |
| Open | 18 | 7 (`PW5-Q-008`, `009`, `012`, `014`, `015`, `016`, `018`) |
| Externally gated | 0 (Q-011 mixed) | 2 (`PW5-Q-011`, `013`) |

---

## 35. Owner-Decision Register

Product facts already decided in PW-1/PW-4 are **not** reopened. Authority: `EXPLICIT ZYNTIXAI OWNER HOMEPAGE CONTENT-MODEL DECISION` (2026-09-15). `CONTENT-MODEL DECISION ≠ FINAL COPY ≠ VISUAL DESIGN ≠ IMPLEMENTATION ≠ PUBLICATION`. Downstream copy, legal, asset, technical, and publication gates do **not** reopen these choices.

### PW5-OD-001 — COURSE SELLER CONTENT-BLOCK REQUIREMENT

See §16. Status: `RESOLVED — OWNER FROZEN`. Decision: include one compact qualified CS relevance block in V1.

### PW5-OD-002 — DEFERRED-CONTEXT CONTENT TREATMENT

See §17. Status: `RESOLVED — OWNER FROZEN`. Decision: Option A omit from V1. Option D rejected.

### PW5-OD-003 — AI CONTENT-BLOCK TREATMENT

See §18. Status: `RESOLVED — OWNER FROZEN`. Decision: Option A; no standalone AI block.

### PW5-OD-004 — HOMEPAGE TRUST CONTENT TREATMENT

See §19. Status: `RESOLVED — OWNER FROZEN FOR HOMEPAGE CONTENT MODEL`. Decision: one compact separate named-controls trust block. Legal pages remain externally gated and do not make this decision partial.

### PW5-OD-005 — PROOF-AREA SELECTION

See §15. Status: `RESOLVED — OWNER FROZEN`. Decision: Today/authenticated Home as the primary V1 product proof.

### PW5-OD-006 — VISUAL-EVIDENCE STRATEGY

See §25. Status: `RESOLVED — OWNER FROZEN`. Decision: text-first with space for one optional abstract evidence-safe operational-system visual. Screenshot HOLD.

### PW5-OD-007 — SIGN IN REPETITION

See §21. Status: `RESOLVED — OWNER FROZEN`. Decision: Sign in in header and later access block; footer default omit.

### PW5-OD-008 — SAFE-STOP BLOCK PROMINENCE

See §20. Status: `RESOLVED — OWNER FROZEN`. Decision: two-layer access communication.

| Count | Value |
| --- | --- |
| Total owner content-model decisions | 8 |
| Fully resolved | 8 |
| Partially resolved | 0 |
| Open owner content-model decisions | 0 |
| Product facts reopened | 0 |

---

## 36. Block Acceptance Register

A block cannot be content-model-required without visitor need, evidence, and qualifier mapping. Required means `CONTENT-MODEL REQUIRED`, not copy/design/implementation/publication complete.

| Acc ID | Block | Required fields present | Evidence mapped | Qualifier mapped | Prohibited identified | Mobile preservation | A11Y equivalent | Action status | Asset dependency | Copy dependency | Validation | Owner | V1 status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-ACC-001 | BLK-001 | Yes | Yes | Yes | Yes | Yes | Yes | Utility `/login` | None required | Labels | VAL-016 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-002 | BLK-002 | Yes | Yes | Yes | Yes | Yes | Yes | None | Decorative optional | H1 | VAL-003 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-003 | BLK-003 | Yes | Yes | Yes | Yes | Yes | Yes | None | None | Value copy | VAL-001 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-004 | BLK-004 | Yes | Yes | Yes | Yes | Yes | Yes | Informational | None | `PW3-OD-007` | VAL-004 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-005 | BLK-005 | Yes | Yes | Yes | Yes | Yes | Yes | In-page later | VISUAL-001 optional | Mechanism | VAL-006 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-006 | BLK-006 | Yes — Today primary | Yes | Yes | Yes | Yes | Yes | None | Screenshot HOLD | Today copy | VAL-011 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-007 | BLK-007 | Yes; FLD-069 default omit | Yes | Yes | Yes | Yes | Yes | Stop if uninvited; no extra CS Sign in by default | No screenshot | Compact CS copy (BUD-007 compose) | VAL-008/009/021 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-008 | BLK-008 | Historical schema only | Yes | Yes | Yes | n/a V1 | n/a V1 | STOP-007 if asked | VISUAL-007 prohibited | Omit | VAL-010 | Owner | `OMITTED FROM V1` |
| PW5-ACC-009 | BLK-009 | If triggered | Yes | Yes | Yes | Yes | Yes | None | VISUAL-008 prohibited | Adjacent qualifier | VAL-007 | PW-6 | Conditional governance |
| PW5-ACC-010 | BLK-010 | Yes | Yes | Yes | Yes | Yes | Yes | No legal CTA | None | Control list | VAL-012 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-011 | BLK-011 | Yes including FLD-062 | Yes | Yes | Yes | Yes | Yes | Stop + utility Sign in | None | Stop copy | VAL-017 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-012 | BLK-012 | Yes | Yes | Yes | Yes | Yes | Yes | `/login` header + access | None | Label | VAL-005 | PW-6 | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-013 | BLK-013 | Yes | Yes | Yes | Yes | Yes | Yes | Omit HOLD; no default Sign in | None | Minimal | Footer audit | Legal remainder external | `CONTENT-MODEL REQUIRED` |
| PW5-ACC-014 | BLK-014 | Optional later | Yes | Yes | Yes | Yes | Yes | Sign in optional | None | Later | Later | PW-13 | Conditional outside core homepage |

---

## 37. Downstream Handoffs

### PW-6 — Copy Deck

Receives the frozen V1 content-model schema, evidence mapping, terminology constraints, budgets, qualifier requirements, two-layer access roles, composition register, and remaining copy questions including `PW3-OD-007`. Must not treat this file as copy. Must not reverse `PW5-OD-001`–`008` without owner authority. PW-6 is **not** started.

Required copy units: header identity; in-page navigation labels; primary identity/recognition; plain-language value; early closed-beta status; mechanism explanation; Today/Home proof; qualified Course Seller relevance; compact named-controls trust; later access/honest-stop explanation; Sign in utility in header; Sign in utility in the access block; footer identity/utility.

Conditional copy units: short contextual AI clarification, only if triggered; abstract visual support text/alternative, if used; public not-found/safe-stop content when later in scope.

Omitted V1 copy units: deferred target-group section; standalone AI section; screenshot caption; four solution cards; pricing; trial; signup; request access; waitlist; contact; demo; testimonials; customer logos; traction metrics.

Composition constraint: required copy units are information roles, not eleven visual sections (`PW5-COMP-*`). CS required meanings must compose into BUD-007. The product name is not a default AI-disclaimer trigger.

PW-6 remains responsible for: headline candidates; support copy; exact beta wording; section labels; navigation labels; qualifier wording; trust wording; safe-stop wording; accessible labels.

PW-5-R1 is recorded in §42. PW-5-FV is **not** started.

### PW-7 — Responsive UX

Receives: RESP-001–012; budgets; frozen V1 block priority; reduction rules; navigation-content requirements; qualifier attachment (including CS, trust scope, early beta, honest stop, Sign in). Exact mobile interaction remains PW-7.

### PW-8 — Accessibility and Trust

Receives: A11Y-001–017; accessible names; reading-order; status/qualifier; visual alternatives; named-control boundary; external legal gate. This remains requirements authority, not implementation PASS.

### PW-9 — Wireframes

Receives content roles, `PW5-COMP-*`, and dependencies. No freedom to remove required truth. No permission to write final copy. Required roles are not eleven visual sections. No four equal editions. No fake CTAs. No CS-as-hero. No standalone AI section. No screenshot without later authority.

### PW-10 / PW-11

Receive density and visual-dependency rules; text-first strategy; optional abstract visual slot; screenshot HOLD; proof/trust restrictions; no fake customer proof; no chatbot-dominant visual.

### PW-12

Must check that required content roles and qualifiers remain visible; Sign in is not acquisition; Option 2 is not converted to a CS hero; deferred TG content is not reintroduced as an active section.

### PW-13 / PW-14

Receive destination states, content states, update triggers, asset/privacy requirements, and remaining route/implementation gates. Do not receive implementation or publication authority from this file. Authenticated Home remains closed.

---

## 38. Acceptance Gate

AND logic. Documentation-only slice: browser/production gates **not required** (no user-visible product change).

### 38.1 Historical establishment (superseded as current status)

The establishment of this file closed as `CONDITIONAL — PW-5 OWNER CONTENT-MODEL DECISIONS REQUIRED` because `PW5-OD-001`–`008` were then OPEN. That result is historical evidence only. It is superseded by §38.2, §39, and §41.

| # | Historical establishment condition | Historical result |
| --- | --- | --- |
| 1 | Correct preflight | **PASS** — branch `core/platform-readiness-20260707`; HEAD/upstream `c6f4489bc5cbf9306b4784320cc747975209caeb`; ahead/behind `0 0`; clean worktree before write |
| 2 | PW-0–PW-4 used | **PASS** |
| 3 | Exact one new document | **PASS** — this file |
| 4 | Current evidence correct; no new Production claim | **PASS** |
| 5 | Readiness states separated; none publication-ready | **PASS** |
| 6 | Full block register | **PASS** — BLK-001–014 |
| 7 | Full field register (at establishment) | **PASS** — FLD-001–061 at establishment; FLD-062–068 added in this freeze |
| 8 | Every block has a visitor need | **PASS** |
| 9 | Substantive messages traced | **PASS** |
| 10 | Evidence levels distinguished | **PASS** — §14–15 |
| 11 | Qualifiers attached | **PASS** |
| 12 | Closed beta early | **PASS** — BLK-004 |
| 13 | Sign in utility | **PASS** |
| 14 | No fake destinations | **PASS** |
| 15 | Course Sellers secondary | **PASS** |
| 16 | No LMS; no four equal editions; no AI overclaim; no all-in-one; no trust/legal overclaim | **PASS** |
| 17 | Visuals truth-safe | **PASS** |
| 18 | Responsive meaning preserved | **PASS** |
| 19 | Accessibility content requirements complete | **PASS** |
| 20 | Risks and validation sufficient | **PASS** — planned/not executed |
| 21 | Open decisions visible | **PASS historically** — OD-001–008 were OPEN at establishment |
| 22 | Downstream handoffs executable | **PASS** |
| 23 | No final copy, wireframe, or implementation | **PASS** |
| 24 | File integrity at establishment | **PASS** |

### 38.2 Owner homepage content-model decision freeze

| # | Mandatory condition | Result |
| --- | --- | --- |
| 1 | Correct preflight | **PASS** — same HEAD; untracked exact this file |
| 2 | Owner authority correct | **PASS** — `EXPLICIT ZYNTIXAI OWNER HOMEPAGE CONTENT-MODEL DECISION` |
| 3 | All eight decisions processed | **PASS** — OD-001–008 unique and resolved as specified |
| 4 | V1 content structure consistent | **PASS** — §9 frozen order |
| 5 | Course Seller required but not dominant | **PASS** — BLK-007 required; not hero/ATF/brand-primary |
| 6 | Deferred target groups omitted | **PASS** — BLK-008 `OMITTED FROM V1`; Option D rejected |
| 7 | No standalone AI | **PASS** — OD-003 Option A |
| 8 | Compact trust block required | **PASS** — BLK-010; legal remainder externally gated |
| 9 | Today primary proof | **PASS** — PROOF-001 selected; 002/003 supporting only |
| 10 | Evidence levels separated | **PASS** |
| 11 | Text-first with optional abstract visual | **PASS** — OD-006 |
| 12 | Screenshot HOLD | **PASS** — VISUAL-002 |
| 13 | Sign in header and access block | **PASS** — OD-007; footer default omit |
| 14 | Two-layer access | **PASS** — OD-008 |
| 15 | No fake destinations | **PASS** |
| 16 | Registers reconciled | **PASS** — §40 |
| 17 | Open questions updated | **PASS** — 9 resolved / 0 partial / 7 open / 2 externally gated |
| 18 | Risks and validations updated | **PASS** — planned/not executed; no fabricated results |
| 19 | PW-6 handoff complete | **PASS** — §28 and §37; PW-6 not started |
| 20 | No final copy | **PASS** |
| 21 | No product change | **PASS** |
| 22 | File integrity | **PASS** — see verification after this freeze |

---

## 39. Final Status

`PW-5 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT`

PW-5 is **not** `CLOSED WITH EVIDENCE` until PW-5-FV. Independent R1 is recorded in §42.

The earlier `CONDITIONAL — PW-5 OWNER CONTENT-MODEL DECISIONS REQUIRED` status remains only as historical establishment evidence. The owner freeze in §41 remains binding. R1 did not reverse `PW5-OD-001`–`008`.

No block is `PUBLICATION READY`. `CONTENT MODEL READY ≠ COPY READY ≠ DESIGN READY ≠ IMPLEMENTATION READY ≠ PUBLICATION READY`. `CONTENT-MODEL DECISION ≠ FINAL COPY ≠ VISUAL DESIGN ≠ IMPLEMENTATION ≠ PUBLICATION`. `CONTENT ROLE ≠ VISUAL SECTION`.

PW-5-FV is not started. PW-6 is not started. Authenticated Home remains closed. No route, copy, visual, or deployment is authorized.

---

## 40. Evidence Appendix

### 40.1 ID census

| Family | Range | Count |
| --- | --- | --- |
| PW5-BLK | 001–014 | 14 |
| PW5-FLD | 001–069 | 69 |
| PW5-PROOF | 001–008 | 8 |
| PW5-TRUST | 001–004 | 4 |
| PW5-STOP | 001–010 | 10 |
| PW5-BUD | 001–014 | 14 |
| PW5-VISUAL | 001–008 | 8 |
| PW5-STATE | 001–017 | 17 |
| PW5-GOV | 001–021 | 21 |
| PW5-RESP | 001–012 | 12 |
| PW5-A11Y | 001–017 | 17 |
| PW5-MAP | 001–017 | 17 |
| PW5-RSK | 001–034 | 34 |
| PW5-VAL | 001–023 | 23 |
| PW5-Q | 001–018 | 18 |
| PW5-OD | 001–008 | 8 |
| PW5-ACC | 001–014 | 14 |
| PW5-COMP | 001–010 | 10 |
| PW5-R1-FND | 001–023 | 23 |

Pre-R1 owner-freeze census: FLD 68; STATE 16; GOV 19; RSK 30; VAL 20. R1 added without remapping: FLD-069; STATE-017; GOV-020–021; RSK-031–034; VAL-021–023; COMP-001–010; R1-FND-001–023. No block IDs split. No owner decisions reversed.

### 40.2 Source files inspected (read-only)

- `src/app/(authenticated)/home/page.tsx`
- Home composition/loader path via `loadDailyOperatingPage` / `compose-daily-operating-brief`
- `src/features/product-access/domain/module-registry.ts` (home, leads, customers, programs, attention, tasks, members)
- Public/auth entry and `/login` as already bound in PW-4
- PW-1 claims and prohibitions; H1 / Beta-1 / 4TG evidence only as recorded there
- No secrets copied; no product tests executed

### 40.3 Binding SHAs

| Authority | SHA |
| --- | --- |
| PW-0 | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| PW-1 | `e694b85ead8a4b75054a078624aadfd315cea39d` |
| PW-2 | `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| PW-3 | `9c12c977383a100eb548880d8d35b329b4406f90` |
| PW-4 | `c6f4489bc5cbf9306b4784320cc747975209caeb` |
| Authenticated Home closure | `49cd5773976143139a154f9b8ddf36535a4dd914` |
| Authenticated Home Production product-code | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |

### 40.4 What this file is not

Not copy. Not wireframes. Not a live sitemap. Not a screenshot set. Not PW-13 implementation. Not `CLOSED WITH EVIDENCE` until PW-5-FV. Not `PUBLICATION READY`. Owner content-model freeze plus independent R1.

---

## 41. OD1 Owner Homepage Content-Model Decision Evidence

### 41.1 Authority

| Field | Value |
| --- | --- |
| Authority type | `EXPLICIT ZYNTIXAI OWNER HOMEPAGE CONTENT-MODEL DECISION` |
| Date | 2026-09-15 |
| Branch | `core/platform-readiness-20260707` |
| Baseline HEAD | `c6f4489bc5cbf9306b4784320cc747975209caeb` |
| Approved package | The full recommended PW-5 homepage content-model package: OD-001 compact qualified Course Seller V1 block; OD-002 Option A omit deferred target-group content; OD-003 Option A no standalone AI block; OD-004 one compact separate named-controls trust block; OD-005 Today/authenticated Home as primary V1 proof; OD-006 text-first with space for one optional abstract evidence-safe operational-system visual; OD-007 Sign in in header and later access block; OD-008 two-layer access communication |
| Distinctions | `CONTENT-MODEL DECISION ≠ FINAL COPY ≠ VISUAL DESIGN ≠ IMPLEMENTATION ≠ PUBLICATION` |
| Not this authority | Visitor research; new product evidence; Production verification; final homepage copy; final navigation labels; legal approval; screenshot approval; visual design; implementation; publication |

### 41.2 Decision table

| Decision ID | Decision | Previous status | New status | Frozen scope | Remaining gate |
| --- | --- | --- | --- | --- | --- |
| PW5-OD-001 | INCLUDE ONE COMPACT, QUALIFIED COURSE SELLER RELEVANCE BLOCK IN V1 | OPEN (establishment recommended conditional) | `RESOLVED — OWNER FROZEN` | Required compact V1 CS role after operator-first + primary proof; not hero; not ATF-required; not brand/co-primary | PW-6 CS copy/qualifiers; PW-9 must not make CS the hero |
| PW5-OD-002 | OPTION A — OMIT DEFERRED TARGET-GROUP CONTENT FROM THE INITIAL HOMEPAGE | OPEN (establishment recommended A) | `RESOLVED — OWNER FROZEN` | No Agencies/Field/E-commerce section or cards; BLK-008 schema retained as `OMITTED FROM V1`; Option D rejected | Later TG evidence + owner before any V1 reintroduction |
| PW5-OD-003 | OPTION A — NO STANDALONE AI CONTENT BLOCK | OPEN (establishment recommended A) | `RESOLVED — OWNER FROZEN` | No standalone AI section; contextual only if triggered | Exact AI wording PW-6 if triggered |
| PW5-OD-004 | ONE COMPACT, SEPARATE NAMED-CONTROLS TRUST BLOCK | OPEN (establishment recommended compact separate) | `RESOLVED — OWNER FROZEN FOR HOMEPAGE CONTENT MODEL` | Required compact named-controls homepage treatment only; not legal-page authority | Legal/privacy/trust pages remain `OPEN — EXTERNAL LEGAL AND CONTENT AUTHORITY REQUIRED` |
| PW5-OD-005 | TODAY / AUTHENTICATED HOME AS THE PRIMARY V1 PRODUCT PROOF | OPEN (establishment conservative Today-only) | `RESOLVED — OWNER FROZEN` | PROOF-001 primary; Tasks/Attention supporting with own lower tier; CS proof stays in CS block; Members HOLD; Social prohibited | PW-6 proof sentences; no current-SHA inflation |
| PW5-OD-006 | TEXT-FIRST WITH SPACE FOR ONE OPTIONAL ABSTRACT, EVIDENCE-SAFE OPERATIONAL-SYSTEM VISUAL | OPEN (establishment recommended text-first; no screenshot) | `RESOLVED — OWNER FROZEN` | Text complete without visual; at most one optional abstract visual; screenshot HOLD | Visual design/asset production; screenshot only after listed reviews |
| PW5-OD-007 | SIGN IN IN HEADER AND LATER ACCESS BLOCK | OPEN (establishment recommended header required; extra optional) | `RESOLVED — OWNER FROZEN` | Header required; access-block functional repeat; footer default omit | Extra footer Sign in only with demonstrated usability need; PW-6 labels |
| PW5-OD-008 | TWO-LAYER ACCESS COMMUNICATION | OPEN (establishment recommended distinct later stop) | `RESOLVED — OWNER FROZEN` | Layer 1 early closed-beta in BLK-004; Layer 2 later compact access/stop in BLK-011 with Sign in | Exact phrasing PW-6; `PW3-OD-007` still OPEN |

No other alternative is co-selected. Legal remainder on OD-004 is a downstream gate and does not make OD-004 partial.

### 41.3 Frozen V1 content structure

Functional content-role order, not a visual wireframe:

1. Public header and in-page navigation
2. Identity and operational recognition
3. Plain-language value
4. Early closed-beta maturity
5. Conceptual mechanism
6. Primary Today/Home proof
7. Compact qualified Course Seller relevance
8. Compact named-controls trust
9. Later access clarification and honest stop
10. Repeated Sign in utility within the access block
11. Public footer

Conditional governance: contextual AI clarification only when triggered; optional abstract evidence-safe visual; public not-found/safe-stop role outside the core homepage where relevant.

### 41.4 Required, conditional and omitted content

Required V1 blocks: header/navigation; identity; plain-language value; early closed-beta maturity; conceptual mechanism; Today/Home proof; Course Seller relevance; compact named-controls trust; access clarification/honest stop; Sign in utility; footer.

Conditional governance blocks: contextual AI clarification; not-found/safe-stop outside homepage where applicable.

Optional visual: one abstract evidence-safe operational-system visual; text remains complete if omitted.

Omitted V1 blocks/units: deferred target-group section; standalone AI section; product screenshot; four target-group cards; testimonial block; customer-logo block; metrics/traction block; pricing; trial; signup; beta-request; waitlist; contact; demo; public product tour.

HOLD assets: product UI screenshot (`VISUAL-002`).

Prohibited content includes, without limitation: LMS/public catalog; complete Course Seller or complete current-SHA edition; public signup; open beta; free/trial; CS as brand-primary; four equal editions; generative/autonomous AI; certification/compliance/absolute-security claims; Sign in as conversion; fake destinations; “coming soon” conversion; request-access/waitlist/contact without destination.

### 41.5 Decision-count reconciliation

| Count | Value |
| --- | --- |
| Total | 8 |
| Fully resolved | 8 |
| Partially resolved | 0 |
| Open owner content-model decisions | 0 |

### 41.6 Open-question reconciliation

| Count | Establishment (before OD freeze) | After OD freeze |
| --- | --- | --- |
| Total | 18 | 18 |
| Resolved | 0 | 9 (`PW5-Q-001`–`007`, `010`, `017`) |
| Partially resolved | 0 | 0 |
| Open | 18 | 7 (`PW5-Q-008`, `009`, `012`, `014`, `015`, `016`, `018`) |
| Externally gated | 0 recorded as a separate class (Q-011 was mixed OPEN / EXTERNALLY GATED) | 2 (`PW5-Q-011`, `013`) |

Remaining open questions cover exact closed-beta phrasing, definitive navigation labels, language strategy, authenticated-arrival content detail, evidence-revalidation implementation, exact mobile shortening, and final PW-6 copy. Legal/footer destinations and public ownership/copyright wording remain externally gated.

### 41.7 Evidence and availability boundaries

Today/authenticated Home is the primary V1 product proof. Tasks and Attention may appear only as supporting context with their own lower evidence tier and must not be presented as peer Production proofs. Course Seller capability proof remains inside the qualified Course Seller block. TG2–TG4 content is omitted from the initial homepage and is not an active proposition. There is no standalone AI section. Trust is named-controls only. Screenshot remains HOLD.

### 41.8 Remaining gates

Exact copy; copy validation; visual design; asset production; screenshot privacy (and the other screenshot-reconsideration reviews); responsive design; accessibility implementation; legal content; route destinations; Root Model A technical feasibility; implementation; deployment.

Technical, copy, asset, legal, and publication gates do not reopen the frozen content-model choices.

### 41.9 Downstream effect

| Phase | Effect |
| --- | --- |
| PW-5-R1 | Independent review recorded in §42. Frozen OD-001–008 were not reversed. |
| PW-6 | Receives unambiguous required, conditional, and omitted copy units plus COMP constraints. May not reverse OD-001–008 without owner authority. Not started here. |
| PW-7 | Receives frozen responsive content truth, including CS qualifier, early beta, honest stop, and Sign in locations. |
| PW-8 | Receives accessibility-content requirements and named-controls trust boundary; legal pages remain external. |
| PW-9 | Wireframes must follow the frozen role order; no CS hero; no four cards; no fake CTAs. |
| PW-10–PW-11 | Visual production is text-first; optional abstract visual only; screenshot HOLD. |
| PW-12 | Must preserve required roles and prohibit deferred-section or CS-brand reintroduction. |
| PW-13–PW-14 | Receive remaining destination, root-route, and publication gates. No implementation or deployment authority from this freeze. Authenticated Home remains closed. |

---

## 42. R1 Independent Homepage Content-Model Review Evidence

### 42.1 Review scope and independence

| Field | Value |
| --- | --- |
| Reviewed file | `docs/phases/PW-5-homepage-content-model.md` |
| Baseline HEAD | `c6f4489bc5cbf9306b4784320cc747975209caeb` |
| Binding authorities | B1-GATE.1; PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; PW-3 `9c12c977383a100eb548880d8d35b329b4406f90`; PW-4 `c6f4489bc5cbf9306b4784320cc747975209caeb`; Home closure `49cd5773976143139a154f9b8ddf36535a4dd914`; Home product `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Evidence sources (read-only, not executed) | `src/app/(authenticated)/home/page.tsx`; `load-daily-operating-page.ts`; `compose-daily-operating-brief.ts`; Tasks/Attention read paths used by Home; `module-registry.ts`; `/login`; public-registration/invite references as bound in PW-1/PW-4; H1 and Beta-1 evidence only as recorded in PW-1 |
| Independence | PW-5 was treated as a candidate. Frozen owner decisions OD-001–008 were **not** reversed. No final copy, wireframes, assets, or implementation were produced. No research or test results were fabricated. No new Production evidence was claimed. Authenticated Home remains closed. |

### 42.2 Findings matrix

| Finding ID | Review area | Test question | Evidence | Finding | Severity | Required correction | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW5-R1-FND-001 | Readiness states | Is any block publication-ready, copy-final, or implemented? | §7; ACC; OD register | No block is `PUBLICATION READY`. Placeholders remain semantic. | OBSERVATION | None | **PASS** |
| PW5-R1-FND-002 | Composition | Can eleven required roles be read as eleven visual sections? | BLK-001–013; BUD-014 | Yes — density and PW-9 risk. Required role ≠ visual section was implicit. | P1 — MATERIAL | Principle 16; `PW5-COMP-001`–`010` | **PASS AFTER CORRECTION** |
| PW5-R1-FND-003 | Blocks | Do Sign in records duplicate functions? | BLK-001/011/012 | Same utility in two locations is intended (`PW5-OD-007`), not two products. | P2 — IMPROVEMENT | COMP-006/007 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-004 | Fields | Is CS “Sign in where logical” modelable? | BLK-007 conditional; no field | Underspecified; PW-6 could add a third conversion control. | P1 — MATERIAL | `PW5-FLD-069` default omit | **PASS AFTER CORRECTION** |
| PW5-R1-FND-005 | Identity / value / maturity | Do first roles serve VIS-001 without BOS/AI/CS-first or GA/signup? | BLK-002–004; FLD-014 | Yes. Operator is not a mandatory public address. Layer B is early, not hero, not footer-only. | OBSERVATION | None | **PASS** |
| PW5-R1-FND-006 | Mechanism | Can objects be connected without a complete-suite claim? | §14.1; CLM-014/018/070 | Matrix separates tiers. Home composition inputs could still be misread as peer Production. | P2 — IMPROVEMENT | CLM-018 vs 070 rule after §14.1 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-007 | Today proof | Are proof claim, asset, screenshot, and public demo distinguished? | PROOF-001; VISUAL-002; Home source | Candidate selected a textual claim but did not name the four classes. Home uses rule-based severity/due sorts, not AI ranking. | P1 — MATERIAL | Proof-class table in §15 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-008 | Supporting proof | Are Tasks/Attention peer Production? | PROOF-002/003; FLD-067; CLM-070 | Correctly supporting. Handoff needed: composition inputs ≠ module proofs. | P1 — MATERIAL | §14.1 and §15 composition-input rule | **PASS AFTER CORRECTION** |
| PW5-R1-FND-009 | Course Seller | Is required CS compatible with Model A without a qualifier wall? | FLD-033–035, 063–066 vs BUD-007 | Seven required meanings vs four visible concepts. Material density risk; OD-001 not reversed. | P1 — MATERIAL | Compact compose rule; BUD-007; RSK-032 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-010 | Deferred omission | Can omit + required CS read as CS-only brand? | OD-002; BLK-007 required | Yes, opposite misread. Operator-first content must carry brand width. | P1 — MATERIAL | §17 anti-interpretation; VAL-021 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-011 | AI | Does the name ZyntixAI default a disclaimer on every visit? | OD-003 trigger clause | Ambiguous. Conservative default: name alone is not a trigger. | P1 — MATERIAL | OD-003 conservative default; COMP-009 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-012 | Trust | Does TRUST-001 inflate CLM-032 to all routes? | TRUST-001; CLM-032 | Slight inflation risk. | P2 — IMPROVEMENT | TRUST-001 scope: Home/session, not all middleware-listed routes | **PASS AFTER CORRECTION** |
| PW5-R1-FND-013 | Access / Sign in / footer | Is two-layer access honest, and is Sign in utility not acquisition? | OD-007/008; STOP-*; footer table | Layer 1 informational; Layer 2 later stop + utility Sign in; footer default omit; no fake destinations. | OBSERVATION | None | **PASS** |
| PW5-R1-FND-014 | Density | Is the page compact enough for a quiet premium single page? | BUD-001–014; eleven roles | Manageable only if COMP is binding. Otherwise overload. | P1 — MATERIAL | COMP register; BUD-007 compose; VAL-022 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-015 | Repetition | Are repeats classified so PW-6 cannot mix statuses? | Former §24 | Functional vs redundant vs prohibited was implicit. | P2 — IMPROVEMENT | §24 classes; RSK-031 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-016 | Visual | Can “operational-system visual” become a technical OS diagram? | VISUAL-001; OD-006 | Yes if designed loosely. Screenshot remains HOLD. | P1 — MATERIAL | VISUAL-001 / OD-006 OS-architecture prohibition | **PASS AFTER CORRECTION** |
| PW5-R1-FND-017 | States | Is changed admission policy covered? | STATE-001–016 candidate | Closed-beta governed existed; policy-change fallback was missing. | P1 — MATERIAL | STATE-017 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-018 | Governance | Are Tasks/Attention and admission/beta-access explicit event triggers? | GOV-004/017 | Combined in 004/017; dedicated rows missing. Publication effect was implicit. | P2 — IMPROVEMENT | GOV-020/021; publication-effect sentence | **PASS AFTER CORRECTION** |
| PW5-R1-FND-019 | Traceability | Are NEED/JNY labelled as PW-2 IDs incorrectly? | MAP header | They are PW4-NEED/JNY encoding PW-2. Ambiguous shorthand. | P2 — IMPROVEMENT | MAP header note; `PW3-OD-009` on MAP-013 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-020 | ID integrity | Do bare OD-001/003/005 collide with PW5-OD-*? | FLD-008/012/014/045 | Yes — FLD-014 especially could be read against PW5-OD-001. | P2 — IMPROVEMENT | Prefixed PW-3/PW-4 authorities | **PASS AFTER CORRECTION** |
| PW5-R1-FND-021 | Owner decisions | Do all eight frozen directions remain resolved with no co-selected alternative? | §35; §41 | 8/8 resolved as specified. Legal remainder stays outside OD-004. Screenshot HOLD stays inside OD-006. | OBSERVATION | None | **PASS** |
| PW5-R1-FND-022 | PW-6 handoff | Could PW-6 choose strategically contradictory interpretations? | §28/§37 candidate | Yes: eleven sections; default AI disclaimer; extra CS Sign in; proof asset = screenshot. | P1 — MATERIAL | Handoff constraints in §28/§37 | **PASS AFTER CORRECTION** |
| PW5-R1-FND-023 | Validation | Are CS-only brand, visual-section count, and suite-synonym tests planned? | VAL-001–020 | Density and Today comprehension existed; three failure modes were unnamed. | P2 — IMPROVEMENT | VAL-021–023; planned/not executed | **PASS AFTER CORRECTION** |

No P0. All P1 findings corrected. Open copy, legal, asset, and implementation questions remain downstream and do not reopen owner content-model decisions.

### 42.3 Readiness and state result

Current product evidence, owner-frozen content model, copy required, asset required, validation required, HOLD, externally gated, and prohibited remain separated. No block is `PUBLICATION READY`. No placeholder is approved copy. No visual role is an existing asset. Today is not a public product tour. Sign in is not acquisition.

### 42.4 Block, field and composition result

Fourteen BLK records remain unique. Required V1 roles match the owner freeze. BLK-008 omitted. BLK-009 contextual. Fields 001–069; FLD-069 closes the CS Sign in gap. Composition groups COMP-001–010 distinguish roles from visual sections. Density is manageable if those groups are used.

### 42.5 Evidence and proof result

Today/Home (`PW1-CLM-014`/`018`, E5, SHA `d110b6e3…`) is the only selected primary V1 product-proof **claim**. Home loads user-scoped Attention and assigned tasks and composes a bounded Today brief with rule-based severity and due-date order — not AI ranking, not a public demo. Tasks/Attention remain supporting at CLM-070 E4. CS proof stays in BLK-007 at E4. Members HOLD. Social prohibited. Screenshot HOLD. Proof asset and public demo are not selected.

### 42.6 Audience, maturity and access result

`PW2-VIS-001` remains brand-primary. Course Seller is required, compact, secondary, after general proof. Early closed beta remains Layer 1. Two-layer access remains. Sign in remains header + access utility to `/login`.

### 42.7 AI, trust and visual result

No standalone AI section. Brand name is not a default disclaimer trigger. Trust is named-controls only, with TRUST-001 scoped to Home/session rather than all routes. Legal pages remain externally gated. Optional abstract visual may show operational relationships, not a technical OS. Screenshot HOLD.

### 42.8 Responsive and accessibility result

RESP and A11Y remain requirements authority. Mobile must keep identity/value, early beta, Today, CS qualifier, trust scope, honest stop, and Sign in utility. Optional visual may omit. No implementation PASS is claimed.

### 42.9 Register reconciliation

| Family | Before R1 | After R1 |
| --- | ---: | ---: |
| BLK | 14 | 14 |
| FLD | 68 | 69 |
| PROOF | 8 | 8 |
| TRUST | 4 | 4 |
| STOP | 10 | 10 |
| BUD | 14 | 14 |
| VISUAL | 8 | 8 |
| STATE | 16 | 17 |
| GOV | 19 | 21 |
| RESP | 12 | 12 |
| A11Y | 17 | 17 |
| MAP | 17 | 17 |
| RSK | 30 | 34 |
| VAL | 20 | 23 |
| Q | 18 | 18 (9 resolved / 0 partial / 7 open / 2 gated) |
| OD | 8 | 8 (8 resolved / 0 partial / 0 open) |
| ACC | 14 | 14 |
| COMP | 0 | 10 |
| R1-FND | 0 | 23 |

### 42.10 Corrections performed

| Before | Finding | Evidence | Correction | Register impact | Remaining gate |
| --- | --- | --- | --- | --- | --- |
| Required roles readable as eleven sections | FND-002/014/022 | BLK + BUD-014 | Principle 16; COMP-001–010 | COMP 10 | PW-9 layout |
| CS Sign in “where logical” | FND-004 | BLK-007 | FLD-069 default omit | FLD 69 | PW-6 |
| Proof classes unnamed | FND-007 | §15 | Claim vs asset vs screenshot vs demo | PROOF unchanged | Asset/privacy |
| Home inputs vs module proofs | FND-006/008 | CLM-018 vs 070 | Explicit composition-input rule | None | PW-6 |
| CS field load vs compact | FND-009 | FLD-033–066 vs BUD-007 | Compose into four visible concepts | BUD-007 note | PW-6 copy |
| Omit TG + required CS = CS-only brand | FND-010 | OD-001/002 | Anti-interpretation; RSK-032; VAL-021 | RSK/VAL | PW-6/12 |
| Name as default AI trigger | FND-011 | OD-003 | Conservative default | None | PW-6 if AI named |
| TRUST-001 all-routes | FND-012 | CLM-032 | Home/session scope | TRUST-001 | PW-8 |
| Repetition unclassified | FND-015 | §24 | Five classes; RSK-031 | RSK | PW-6 |
| OS-architecture visual | FND-016 | VISUAL-001 | Operational-relationship bound; RSK-033 | VISUAL | PW-10 |
| Missing admission-change state | FND-017 | STATE | STATE-017 | STATE 17 | Policy re-probe |
| Combined GOV triggers | FND-018 | GOV | GOV-020/021 | GOV 21 | Event re-verify |
| Ambiguous NEED/OD shorthand | FND-019/020 | MAP; FLD-008/012/014/045 | Prefixes and MAP note | None | None |
| Missing VAL failure modes | FND-023 | VAL-020 | VAL-021–023 | VAL 23 | Planned tests |

### 42.11 Remaining gates

Final copy; copy validation; navigation labels; language; legal/footer destinations; ownership/copyright; visual design; asset production; screenshot privacy; responsive design; accessibility implementation; route implementation; Root Model A technical feasibility; deployment.

### 42.12 R1 conclusion

`PASS — PW-5-R1 HOMEPAGE CONTENT-MODEL REVIEW CLOSED WITH EVIDENCE`

`PW-5 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT`

PW-5-FV is not started. PW-6 is not started. Authenticated Home remains closed.
