# PW-2 — Visitor Goals & Journey Map

## 1. Document Control

| Field | Value |
| --- | --- |
| Phase ID | **PW-2** |
| Title | Visitor Goals & Journey Map |
| Status | `PASS — PW-2 VISITOR GOALS & JOURNEY MAP ESTABLISHED WITH EVIDENCE` |
| R1 status | `PASS — PW-2-R1 VISITOR STRATEGY REVIEW CLOSED WITH EVIDENCE` |
| Date | 2026-09-15 |
| R1 review date | 2026-09-15 |
| Branch | `core/platform-readiness-20260707` |
| Baseline HEAD | `e694b85ead8a4b75054a078624aadfd315cea39d` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `e694b85ead8a4b75054a078624aadfd315cea39d` |
| Ahead / behind | `0 0` |
| Governing PW-0 | `docs/phases/PW-0-public-web-charter-boundary-freeze.md` |
| PW-0 closure | `CLOSED WITH EVIDENCE — PW-0 PUBLIC WEB CHARTER & BOUNDARY FREEZE` at `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| Governing PW-1 | `docs/phases/PW-1-product-truth-claims-register.md` |
| PW-1 closure | `CLOSED WITH EVIDENCE — PW-1 PRODUCT TRUTH & CLAIMS REGISTER` at `e694b85ead8a4b75054a078624aadfd315cea39d` |
| Authenticated Home | Closed and protected. Closure SHA `49cd5773976143139a154f9b8ddf36535a4dd914`. Production product-code SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828`. Route `/home`. |
| Document type | Additive documentation and UX-strategy only |
| Allowed mutation | This file only |
| Product / test / config edits | **NONE** |
| Commit / push / deploy | **NOT AUTHORIZED by this phase** |
| PW-3 | **NOT STARTED** |
| PW2-OD-001 | `RESOLVED — OWNER FROZEN` — `MODEL A — GENERAL OPERATOR PRIMARY` |
| Readiness | `PW-2 OWNER AUDIENCE DECISION FROZEN — READY FOR FINAL VERIFICATION` |

**Purpose.** Establish a repository-grounded visitor-journey authority for the future ZyntixAI public website. Define audiences, jobs, questions, comprehension requirements, truthful current actions, blocked future actions, and handoffs to later PW phases.

**Scope.** Documentation and UX strategy only. No page design, sitemap, wireframes, visual system, final marketing copy, analytics implementation, or product-code change.

**Non-goals.** This phase does not write positioning or headlines; does not define homepage sections; does not invent user research; does not invent working conversion destinations; does not broaden PW-1 claims; does not implement routes, forms, waitlists, contact, or demos; does not change `/`, `/login`, `/register`, `/home`, middleware, or authenticated behavior; does not commit, push, deploy, or start PW-3.

**Repository instructions inspected.** No `AGENTS.md`, nested `AGENTS.md`, `.cursor/rules`, or `CONTRIBUTING.md` was present. Binding authorities found: this PW-2 governing prompt; PW-0; PW-1; `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md`; existing `docs/phases/` convention. The most specific applicable instruction is: create exactly this file and do not modify any existing file.

PW-0 and PW-1 remain binding. Authenticated Home remains closed. P0 and controlled P1 surfaces are not modified.

---

## 2. Executive Decision

The future public website must serve **unauthenticated visitors** who need to understand ZyntixAI before they can take a truthful next step.

**Owner-frozen audience model: `MODEL A — GENERAL OPERATOR PRIMARY` (`PW2-OD-001`).** This is an explicit ZyntixAI owner strategy decision, not visitor research. It governs PW-3 and later public-web phases. It may be revisited only through an explicit owner change, materially changed product evidence, or new governed visitor research.

The primary public visitor is the **owner/operator of a small business** who wants to organize customers, work, responsibilities, and progress clearly (`PW2-VIS-001`, **PRIMARY**). That visitor governs the first public value story and must not receive a generic “works for everyone” claim.

Course Sellers / coaches (`PW2-VIS-002`) is **SECONDARY**: the strongest evidenced relevance context, not co-primary, and must not define the complete ZyntixAI brand identity, control the entire homepage message, or imply LMS or a complete current-SHA Production edition. If later IA/copy phases use a target-group example, Course Sellers may be the first concrete example. That display choice remains `PW2-OD-002` / `PW2-OD-003` (still open).

Agencies, Field, and E-commerce remain **deferred relevance contexts** under their PW-1 qualifiers. Broader or future target groups are not current public audiences or available editions. Relevance remains separate from availability.

Model B (Course Sellers primary) and Model C (co-primary) remain documented as **evaluated and rejected alternatives**, not active options. Co-primary is not an active model.

This decision **resolves the audience-hierarchy blocker for PW-3**. It does **not** resolve copy, CTA, IA, target-group display, beta-intake, waitlist, contact, demo, legal, or implementation decisions.

### 2.1 Owner decision record

| Field | Value |
| --- | --- |
| Decision ID | `PW2-OD-001` |
| Decision | Primary public audience |
| Selected model | `MODEL A — GENERAL OPERATOR PRIMARY` |
| Authority | Explicit ZyntixAI owner decision |
| Decision date | 2026-09-15 |
| Brand-primary | Small-business owner/operator (`PW2-VIS-001`) |
| Leading relevance context | Course Sellers / coaches (`PW2-VIS-002`) |
| Rejected models | Model B Course Sellers primary; Model C co-primary |
| Product-truth boundary | PW-1 remains binding |
| Effective phases | PW-3 and all later public-web phases |
| Reverification trigger | Formal owner change, materially changed product evidence, or new governed visitor research |
| Status | `RESOLVED — OWNER FROZEN` |

**Three journey states are distinct:** `CURRENT PRODUCTION STATE` ≠ `DESIGN-INTENT STATE` ≠ `PUBLICATION-READY STATE`.

The only currently operational public CTA is **Sign in**, for existing accounts (`PW1-CLM-045`). Sign in is a **utility** action. It must not become the acquisition message merely because it is the only live destination.

There is **no** publication-ready public intake, waitlist, contact page, product tour, demo, or in-page public exploration destination. Those remain design-intent HOLD items until destinations exist and PW-1 is updated where required. Create account, Register, Start free, Start trial, and Connect AI provider are **not** journey options.

```text
CURRENT PRODUCTION STATE  ≠  DESIGN INTENT  ≠  PUBLICATION READY
RELEVANCE                 ≠  AVAILABILITY
CLOSED BETA               ≠  GENERAL AVAILABILITY
SIGN IN                   ≠  START / EXPLORE / JOIN
```

No interviews, surveys, analytics, or usability tests were executed for PW-2 or PW-2-R1. Jobs, objections, and comprehension outcomes that are not proven by PW-0/PW-1 are labelled **UX HYPOTHESIS**.

This section is not marketing copy.

---

## 3. Governing Authorities and Constraints

| Authority | What it binds in PW-2 |
| --- | --- |
| PW-0 | Public-web is a separate trajectory; visitor is unauthenticated; Home is not the public site; chatbot-first positioning is forbidden; four-TG availability is not auto-public; dual-use `/` currently redirects logged-out visitors to `/login`; no `(marketing)` / `(public)` group exists. |
| PW-1 | Claim IDs, factual statuses, public decisions, CTA matrix, target-group qualifiers, prohibited claims, and open questions. PW-2 may design HOLD jobs; it may not invent destinations. |
| B1-GATE.1 | AND-logic completion; documentation-only phases do not require browser/production gates when no user-visible product change ships. Publication (commit/push) is **not** authorized here. |
| Authenticated Home | `/home` remains closed. Public journeys must not send visitors into Home as if it were a marketing page. |

**Current CTA authority (PW-1 §9), consumed unchanged:**

| CTA | PW-1 decision | PW-2 journey use |
| --- | --- | --- |
| Sign in | ALLOW WITH QUALIFIER | Utility returning-user action; existing accounts only |
| Create account | PROHIBIT | Not a journey option |
| Register | PROHIBIT | Not a journey option |
| Request beta access | HOLD | Design-intent only; not operational; not publication-ready |
| Join waitlist | HOLD | Design-intent only; not operational; not publication-ready |
| Contact | HOLD | Design-intent only; not operational; not publication-ready |
| View product | HOLD | Design-intent exploration only; not publication-ready |
| Watch demo | HOLD | Design-intent only; not operational; not publication-ready |
| Start free | PROHIBIT | Not a journey option |
| Start trial | PROHIBIT | Not a journey option |
| Connect AI provider | PROHIBIT | Not a journey option |

**Product-truth constraints that journeys must not contradict:** ZyntixAI is not public GA (`PW1-CLM-008`); last governed access policy is invite-only closed beta (`PW1-CLM-007`); Course Sellers is not a complete current-SHA Production-verified edition and not an LMS (`PW1-CLM-015`–`016`, `PW1-CLM-071`, `PW1-PRH-022`); TG2–TG4 are integration-tested thin slices, not live editions (`PW1-CLM-020`–`022`, `PW1-CLM-055`); generative/autonomous AI and “connect any AI provider” are prohibited (`PW1-CLM-027`–`028`, `PW1-CLM-054`, `PW1-PRH-004`–`005`); Stripe, public pricing, free access, and trials are not established (`PW1-CLM-029`, `PW1-CLM-037`–`038`); QA/import/invitation data is not traction (`PW1-CLM-039`, `PW1-CLM-064`); unsupported compliance, certification, uptime, and absolute-security claims are prohibited (`PW1-CLM-036`, `PW1-CLM-041`–`042`).

**Current production visitor path (not a marketing homepage):** unauthenticated `https://www.zyntixai.com/` → `/login` (`PW1-CLM-009`; `src/app/page.tsx`). PW-2 does not change that path.

---

## 4. Evidence and Hypothesis Model

Every audience or behavior conclusion uses exactly one class.

| Class | Meaning | Binding effect |
| --- | --- | --- |
| **VERIFIED PRODUCT FACT** | Supported by PW-1 ALLOW / ALLOW WITH QUALIFIER rows, Production/release evidence, or inspected current routes. | Binding as current product truth. |
| **GOVERNED PRODUCT INTENT** | Supported by PW-0/PW-1 intended category, scope freeze, or strategy, not by visitor research. | Binding as intent; public wording still needs PW-1 qualifiers and PW-3. |
| **UX HYPOTHESIS** | Reasonable journey-design assumption. Not observed visitor behavior. | Designable for later validation. Must not be written as a research finding. |
| **UNSUPPORTED** | Inadequate evidence. | Must not become a binding audience, CTA, or availability decision. |

**Rules**

1. Do not describe UX hypotheses as findings from real customers or visitors.
2. Do not convert absence of research into invented personas, quotes, or conversion rates.
3. Where PW-1 already records a fact, PW-2 must not weaken or broaden it.
4. `UNSUPPORTED` items may appear only as open decisions or out-of-scope notes.
5. Emotional jobs and arrival contexts are **UX HYPOTHESIS** unless a PW-1 fact is cited. They are not observed visitor behavior.
6. An owner freeze is a strategy decision, not a research finding. `PW2-OD-001` is owner-frozen as Model A. Remaining open decisions keep conservative defaults until their own owners resolve them.

No user research was conducted in PW-2, PW-2-R1, or OD1. Model A is not claimed as empirically validated.

---

## 5. Visitor Universe

Materially different unauthenticated visitor types that **may** arrive. Identification is not the same as targeting.

| Visitor ID | Visitor group | Evidence class | How identified | Automatically a target? |
| --- | --- | --- | --- | --- |
| PW2-VIS-001 | First-time small-business owner or operator exploring ZyntixAI | GOVERNED PRODUCT INTENT (PW-0) + owner freeze (`PW2-OD-001`); UX HYPOTHESIS for jobs | PW-0 §3; owner OD1 | Owner-frozen brand-primary; not a researched persona |
| PW2-VIS-002 | Course seller or coach evaluating relevance | VERIFIED PRODUCT FACT for TG1 product status; UX HYPOTHESIS for arrival and jobs | PW-1 §8 TG1 | No — leading relevance context, not brand-primary |
| PW2-VIS-003 | Agency / business-services operator evaluating future relevance | VERIFIED PRODUCT FACT for TG2 thin-slice status; UX HYPOTHESIS for arrival | PW-1 §8 TG2 | No |
| PW2-VIS-004 | Construction / installation / field-service operator evaluating future relevance | VERIFIED PRODUCT FACT for TG3 thin-slice status; UX HYPOTHESIS for arrival | PW-1 §8 TG3 | No |
| PW2-VIS-005 | E-commerce / product / fulfillment operator evaluating future relevance | VERIFIED PRODUCT FACT for TG4 thin-slice status; UX HYPOTHESIS for arrival | PW-1 §8 TG4 | No |
| PW2-VIS-006 | Invited closed-beta participant | VERIFIED PRODUCT FACT that invite-only PATH B existed; UX HYPOTHESIS for public-site use after invite | PW1-CLM-007; invitation routes exist | No |
| PW2-VIS-007 | Existing account holder returning to sign in | VERIFIED PRODUCT FACT | PW1-CLM-010, PW1-CLM-045 | Utility only |
| PW2-VIS-008 | Potential beta tester without an invitation | UX HYPOTHESIS for intent; VERIFIED PRODUCT FACT that no public intake exists | PW1-CLM-047; PW1-RQ-004 | No |
| PW2-VIS-009 | Partner, adviser, technical reviewer, or due-diligence visitor | UX HYPOTHESIS | No research; trust questions are real product-truth needs | No |
| PW2-VIS-010 | Visitor looking for pricing, free access, a trial, or immediate registration | UX HYPOTHESIS for intent; VERIFIED PRODUCT FACT that those offers are absent/prohibited | PW1-CLM-037–038, 046, 052 | Out of scope as a conversion target; honest non-offer answers remain required |
| PW2-VIS-011 | Wrong-fit visitor expecting a chatbot or autonomous AI product | UX HYPOTHESIS for expectation; VERIFIED PRODUCT FACT that chatbot-only and autonomy are prohibited | PW-0 rule 7; PW1-PRH-004/016/023 | Wrong-fit; must be corrected, not targeted |
| PW2-VIS-012 | Visitor from an unsupported or future business context | VERIFIED PRODUCT FACT that manufacturing and complete suites are not supported | PW1-CLM-063; PW1-PRH-002 | No |
| PW2-VIS-013 | Visitor seeking privacy, security, or trust information | GOVERNED PRODUCT INTENT that trust must not be faked; UX HYPOTHESIS for arrival | PW-1 §11 | No |
| PW2-VIS-014 | Accidental or low-intent visitor | UX HYPOTHESIS | No analytics | No |

**Universe count:** 14 visitor groups assessed. Targeting is §6.

---

## 6. Visitor Prioritization Matrix

Each group has exactly one priority.

| Visitor ID | Visitor group | Evidence class | Arrival context | Core intent | Priority | Why served or deferred | Product-truth constraint | Current valid action | Desired future action | Validation needed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW2-VIS-001 | First-time operator exploring ZyntixAI | GOVERNED PRODUCT INTENT + owner freeze (`PW2-OD-001`); UX HYPOTHESIS for arrival | Direct www, referral, or search (**hypothesis**) | Understand operational organization of customers, work, responsibilities, and progress | PRIMARY | Owner-frozen brand-primary. Governs the first public value story. Intended BOS direction within PW-1. | Not GA; not chatbot-only; not “works for everyone”; BOS is intended category | In **current production**: Sign in is not exploration. In **design intent**: read public information on an isolated surface that does not yet exist. | Publication-ready View product / in-page exploration only after a real destination (`PW1-CLM-050` HOLD) | Five-second Layer A (`PW2-VAL-001`) |
| PW2-VIS-002 | Course seller / coach | VERIFIED PRODUCT FACT + UX HYPOTHESIS | Same as 001, or industry language (**hypothesis**) | Judge whether an operator product for courses/coaching is relevant | SECONDARY | Strongest evidenced **relevance** context. Must not control the entire public brand. Not a second primary. | Not LMS; not complete current-SHA Production-verified edition; invite-only historically | Understand qualified Course Sellers status; Sign in only if already admitted | Future beta-interest if eligible and a publication-ready intake exists | Message test: operator vs LMS (`PW2-VAL-010`) |
| PW2-VIS-003 | Agency operator | VERIFIED PRODUCT FACT + UX HYPOTHESIS | Industry language (**hypothesis**) | Judge future relevance of an agency workflow | DEFERRED | Thin slice only; must not control the homepage | Not Production-proven; not proven closed-beta-eligible; no client portal/billing | Honest qualifier; safe stop | Future intake only if admission policy later includes TG2 | Availability comprehension (`PW2-VAL-008`) |
| PW2-VIS-004 | Field operator | VERIFIED PRODUCT FACT + UX HYPOTHESIS | Industry language (**hypothesis**) | Judge future relevance of field workflow | DEFERRED | Thin slice; GPS/routing prohibited | No GPS/route optimization; not live field edition | Honest qualifier; safe stop | Future intake only if admission policy later includes TG3 | Same |
| PW2-VIS-005 | E-commerce / fulfillment operator | VERIFIED PRODUCT FACT + UX HYPOTHESIS | Industry language (**hypothesis**) | Judge future relevance of product/fulfillment workflow | DEFERRED | Thin operator slice; not a shop | No storefront, checkout, Stripe | Honest qualifier; safe stop | Future intake only if admission policy later includes TG4 | Same |
| PW2-VIS-006 | Invited closed-beta participant | VERIFIED PRODUCT FACT + UX HYPOTHESIS | Invitation email / invite URL | Complete admission and reach the product | SECONDARY | Completing admission, **not** an acquisition audience. Must not be conflated with VIS-007. Public site must not replace `/invite/accept`. | Invite-only historically; `/home` is not public | Follow invitation or Sign in | Optional public orientation before Sign in (design intent) | First-click: invitees still find Sign in (`PW2-VAL-002`) |
| PW2-VIS-007 | Existing account holder | VERIFIED PRODUCT FACT | Bookmark, `/login`, `/` bounce | Sign in | UTILITY | Fast functional route; does not own the value story | Existing accounts only; Sign in ≠ signup | Sign in | Unchanged, unless PW-13 isolates `/` | First-click sign-in discovery |
| PW2-VIS-008 | Potential beta tester without invitation | UX HYPOTHESIS + VERIFIED PRODUCT FACT (no intake) | Exploration after understanding closed beta | Express interest without claiming access | SECONDARY | Core **design-intent** conversion job; currently no destination. Must not be promised an intake route. | HOLD CTAs; do not invent forms | Honest safe stop: access is invite-only; no public request path today | Request beta access or waitlist only when publication-ready | First-click: do not expect immediate access (`PW2-VAL-004`) |
| PW2-VIS-009 | Partner / adviser / due-diligence visitor | UX HYPOTHESIS | Diligence or advisory review (**hypothesis**) | Assess maturity, honesty, and controls without overclaim | SECONDARY | Trust and limitation transparency protect later copy | No fake traction; no certifications | Read identity, status, limitations; no public contact today | Public contact or trust page after legal/technical authority | Trust test (`PW2-VAL-011`) |
| PW2-VIS-010 | Pricing / free / trial / register seeker | UX HYPOTHESIS + VERIFIED PRODUCT FACT (offers absent) | Commercial intent (**hypothesis**) | Get a price, trial, or account | OUT OF SCOPE | Out of scope as a **conversion target**. Questions Q-008, Q-010, Q-021 still require an honest non-offer, not silence. | PROHIBIT those CTAs; closed beta ≠ free | Honest non-offer; no Register/Start free | None unless commercial + admission authorities change PW-1 | False-expectation rate (`PW2-M-006`) |
| PW2-VIS-011 | Wrong-fit chatbot / autonomous-AI expecter | UX HYPOTHESIS + VERIFIED PRODUCT FACT (prohibition) | AI-category expectation (**hypothesis**) | Use or buy a chatbot / autonomous OS | OUT OF SCOPE | Wrong-fit visitor. Must be corrected, not targeted as a product audience. | Not chatbot-only; not autonomous; no provider connect | Corrective comprehension; safe stop if they only want a chatbot | None that promises generative AI | Non-chatbot comprehension (`PW2-VAL-001`, `PW2-VAL-009`) |
| PW2-VIS-012 | Unsupported / future business context | VERIFIED PRODUCT FACT | Other industry language (**hypothesis**) | Find an edition for their context | DEFERRED | Must not distort four-TG story | Manufacturing not supported; not “every business” | Honest out-of-scope; no availability promise | Later TG program only | Availability comprehension |
| PW2-VIS-013 | Privacy / security / trust seeker | GOVERNED PRODUCT INTENT + UX HYPOTHESIS | Trust-first scan (**hypothesis**) | Know how access and data are handled without legal overclaim | SECONDARY | Trust is required; legal claims are prohibited | Named controls only; no AVG/SOC2/uptime | Narrow factual trust on homepage; no public privacy policy page today | Supporting trust/privacy page after legal review | Trust + legal-review gate (`PW2-OD-011`) |
| PW2-VIS-014 | Accidental / low-intent visitor | UX HYPOTHESIS | Mis-click or unrelated search | Leave quickly without false conversion | OUT OF SCOPE | Must not drive CTAs, urgency, or scarcity | No fake urgency | Safe ignore; identity still honest if they glance | None | Dead-end honesty (`PW2-M-007`) |

### 6.1 Priority counts

| Priority | Count | IDs |
| --- | --- | --- |
| PRIMARY | 1 | PW2-VIS-001 |
| SECONDARY | 5 | PW2-VIS-002, PW2-VIS-006, PW2-VIS-008, PW2-VIS-009, PW2-VIS-013 |
| UTILITY | 1 | PW2-VIS-007 |
| DEFERRED | 4 | PW2-VIS-003, PW2-VIS-004, PW2-VIS-005, PW2-VIS-012 |
| OUT OF SCOPE | 3 | PW2-VIS-010, PW2-VIS-011, PW2-VIS-014 |
| **Total** | **14** | PW2-VIS-001 … PW2-VIS-014 |

### 6.2 Primary-audience model (R1 analysis; OD1 freeze)

R1 evaluated three models. OD1 owner-freezes Model A. Model B and Model C remain documented rejected alternatives, not active options.

| Model | Meaning | R1 analysis | OD1 status |
| --- | --- | --- | --- |
| **A — General operator primary** | VIS-001 shapes the public value story. Course Sellers is the leading **relevance** context if TGs appear. TG2–TG4 stay deferred. | Matches PW-0’s unauthenticated-visitor purpose and intended BOS category. Avoids LMS/course-platform brand capture. | **`RESOLVED — OWNER FROZEN`** (`PW2-OD-001`). Binding for PW-3 and later public-web phases. Not a research result. |
| **B — Course Sellers primary** | CS controls the first public value story. General operators become secondary. | Strongest TG evidence does not authorize making the public brand a course product. Conflicts with PW1-CLM-002/071 and PW1-PRH-016 if CS becomes the identity. | **Rejected alternative.** Not an active option. |
| **C — Governed co-primary** | VIS-001 and VIS-002 are both PRIMARY. | Co-primary avoided a first-impression choice. One calm five-second message cannot be both generic-operator and course-specific without becoming vague. | **Rejected alternative.** Not an active option. No active co-primary model. |

**Brand-primary:** `PW2-VIS-001` — first-time small-business owner/operator; sole PRIMARY; governs the first public value story; needs to understand operational organization and control; must not receive a generic “works for everyone” claim.

**Leading relevance context:** `PW2-VIS-002` — Course Sellers / coaches; SECONDARY; strongest evidenced target-group context; may be the first concrete relevance example if later IA/copy choose to use TG examples (`PW2-OD-002` / `PW2-OD-003` still open); does not define the complete brand; does not imply LMS; does not imply a complete current-SHA Production edition.

**Priority principles applied**

- The single owner-frozen primary visitor shapes the public value story (VIS-001).
- Course Sellers is a secondary **relevance** audience, not a second brand-primary, and must not control the entire homepage message.
- Secondary visitors need enough relevance or trust information without owning the homepage.
- Utility visitors get a fast functional route (Sign in). Invited participants (VIS-006) complete admission; they are not conflated with existing account holders (VIS-007).
- Deferred visitors may be acknowledged without an availability promise.
- Out-of-scope visitors must not distort the product story or receive prohibited CTAs. Wrong-fit and commercial-intent visitors still receive honest answers where listed in §9.

All four target groups are **not** equal primary audiences. The existence of broader or future target groups does not make them current public audiences or available editions.

---

## 7. Visitor Jobs and Decision Needs

Jobs below for PRIMARY, SECONDARY, and UTILITY visitors. Emotional and decision jobs are **UX HYPOTHESIS** unless noted. Functional destinations that already exist are VERIFIED PRODUCT FACT. VIS-002 remains in this table as SECONDARY (leading relevance), not as a second primary.

| Visitor ID | Functional job | Understanding job | Emotional job | Decision job | Current safe action | Desired future action | Claim IDs governing the journey |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW2-VIS-001 | Form a truthful first impression of ZyntixAI without entering the authenticated product | Name; intended operator purpose; organize customers, work, responsibilities, and progress; not-only-chatbot; closed-beta status | Reduce “is this a chatbot / vaporware / GA SaaS?” uncertainty (**hypothesis**) | Decide whether to keep reading, stop honestly, or (if already invited) sign in | Read future public information if/when an isolated public surface exists; today production only offers Sign in, which is **not** exploration | View product information (`PW1-CLM-050` HOLD) | PW1-CLM-001, 002, 003, 007, 008, 009, 045, 050; PW1-PRH-002, 016 |
| PW2-VIS-002 | Judge Course Sellers / coaching relevance as an **operator** | Operator CRM/programs/Home exist in Beta-1 with qualifiers; not an LMS | Reduce fear of buying a student platform or an unfinished edition (**hypothesis**) | Decide “relevant but invite-only / not a complete live edition” vs “not for me” | Qualified relevance + safe stop or Sign in if already admitted | Beta-interest intake if later eligible | PW1-CLM-015, 016, 018, 023, 071; PW1-PRH-022 |
| PW2-VIS-006 | Complete invitation or sign in | Invite-only access; product Home is `/home` after admission, not the public site | Reduce “am I in the right place?” after an email (**hypothesis**) | Decide to use the invite/sign-in path, not a public signup | Invitation flow or Sign in | Public orientation that does not replace invite routes | PW1-CLM-007, 010, 014, 031, 045 |
| PW2-VIS-007 | Sign in | Destination is Sign in, not account creation | Reduce accidental signup confusion (**hypothesis**) | Sign in or recover password via existing auth routes (auth UX, not public-web mutation) | Sign in | Same | PW1-CLM-010, 045, 032 |
| PW2-VIS-008 | Express interest in closed beta | Access is not open self-serve; no public request form exists today | Reduce feeling ignored or tricked by a dead button (**hypothesis**) | Accept a transparent stop, or wait for a real intake | Honest stop: no public request path | Request beta access / waitlist (`PW1-CLM-047`, `048` HOLD) | PW1-CLM-007, 011, 047, 048; PW1-PRH-015, 021 |
| PW2-VIS-009 | Diligence scan | Maturity: working closed-beta product vs public marketing site; named controls vs certifications | Reduce hype suspicion (**hypothesis**) | Trust enough to continue reading or to stop | Read limitations; no fake proof | Trust/privacy page; optional contact | PW1-CLM-033, 034, 039–042; PW1-PRH-007–013 |
| PW2-VIS-013 | Find honest access and data-handling facts | Session-gated product; named technical controls; no legal conclusion | Reduce “will you overclaim security?” (**hypothesis**) | Decide whether trust information is sufficient for this stage | Homepage-level honesty; no public privacy policy today | Supporting trust page after legal authority | PW1-CLM-032–035, 041, 042, 066 |

Deferred and out-of-scope visitors do not get invented capability needs. Their only current-safe outcome is an honest qualifier or a safe stop.

Needs that would imply Stripe, generative AI, LMS, open registration, trials, or four live editions are **UNSUPPORTED** and are not listed as jobs.

---

## 8. Five-Second Comprehension Contract

This contract states **required understandings**, not a headline. PW-3 writes wording. No final hero copy is authorized here.

**UX HYPOTHESIS:** later copy and layout can produce these understandings if they follow the layers below. Untested (`PW2-VAL-001`, `PW2-VAL-017`).

R1 cognitive-load rule: the first five seconds must prevent **immediate fundamental misunderstanding**. They must not communicate every limitation as a separate sentence. The first impression must remain calm, understandable, and credible.

### 8.1 Comprehension layers

| Layer | Responsibility | What belongs here |
| --- | --- | --- |
| **A — Five-second recognition** | Prevent immediate wrong-product identification | Name; operator work; not-only-a-chatbot as a **recognition outcome** (product-led framing and non-chat hierarchy; not a second slogan) |
| **B — Initial viewport / immediate orientation** | Available without deep exploration | Closed beta vs GA; exploration vs Sign in; Sign in remains findable as utility |
| **C — Homepage comprehension** | Required before an action decision | Intended BOS (qualified); explicit AI limitation if AI is mentioned; operator vs LMS if CS appears; unequal TG availability if TGs appear; no price/trial/register if commercial intent is invited |
| **D — Supporting page or later detail** | Matters but would overload the first view | Named-control detail; social publishing; legal/privacy; demo/contact/waitlist answers; processor/residency |

Autonomous/generative AI: **not** a separate five-second slogan. Layer A prevents it by operator framing, non-chat hierarchy, and absence of autonomy language. Explicit “not generative / not autonomous” is Layer C if AI is mentioned at all.

Closed-beta status is Layer B, not the footer, and not a fifth five-second sentence.

| Comprehension ID | Required understanding | Layer | Governing PW-1 claims | Misinterpretation prevented | Validation question | Failure condition |
| --- | --- | --- | --- | --- | --- | --- |
| PW2-CMP-001 | The product is named ZyntixAI | A — FIVE-SECOND | PW1-CLM-001 | Wrong or generic brand | What is the product called? | Visitor cannot name ZyntixAI |
| PW2-CMP-002 | ZyntixAI is **intended** as a Business Operating System for operators | C — HOMEPAGE; not locked as the five-second headline (PW1-RQ-003) | PW1-CLM-002; PW1-PRH-023 | “Complete OS for every business”; autonomous OS; vague all-in-one | What kind of product is it intended to be? | Visitor reports a live all-in-one OS or a chatbot SKU as the category |
| PW2-CMP-003 | It helps operators organize or operate business work (human-operated) | A — FIVE-SECOND | PW1-CLM-002, 003, 018, 027 | Chatbot toy; autonomous operation | What kind of work does it help with? | Visitor says it chats, writes content, or runs the company |
| PW2-CMP-004 | It is broader than an AI chatbot | A — FIVE-SECOND (recognition outcome; not a required second headline) | PW1-CLM-003; PW1-PRH-016 | Chatbot-only product | Is it only a chatbot? | Visitor says yes, it is a chatbot product |
| PW2-CMP-005 | AI is not presented as generative or autonomous | C — HOMEPAGE if AI is mentioned; Layer A prevention by omission of autonomy language | PW1-CLM-027, 028, 054; PW1-PRH-004 | Generative/autonomous AI | Does AI run the business or generate work? | Visitor reports generative or autonomous AI |
| PW2-CMP-006 | Access is controlled closed beta, not general availability | B — INITIAL VIEWPORT | PW1-CLM-007, 008, 011 | GA; open signup; artificial scarcity | Is it publicly available to anyone? | Visitor says anyone can start now, or that access is “limited seats” without evidence |
| PW2-CMP-007 | Exploration (information) is distinct from Sign in (existing accounts) | B — INITIAL VIEWPORT | PW1-CLM-009, 010, 045, 050 | Sign in as Start/Join | What can you do next? | Visitor treats Sign in as create-account or product tour |
| PW2-CMP-008 | Course Sellers relevance, if shown, is an operator product, not an LMS | C — HOMEPAGE when TG1 is mentioned | PW1-CLM-016, 071 | Student course platform; CS as the entire brand | Is this a course platform for learners? | Visitor says students take courses on the site, or that ZyntixAI is only a course product |
| PW2-CMP-009 | Target-group contexts are not equally available live editions | C — HOMEPAGE if more than one TG is shown | PW1-CLM-006, 020–022, 055; PW1-PRH-001 | Four fully available editions | Are all four editions available now? | Visitor says all four are live |
| PW2-CMP-010 | There is no public price, trial, or self-serve account creation on this site today | C — HOMEPAGE if commercial intent is invited; otherwise D when the question is asked | PW1-CLM-037, 038, 046, 052 | Free/trial/register | Can I start free or create an account? | Visitor believes a trial or register CTA exists |

**Layer A (five-second) set:** PW2-CMP-001, 003, 004.

**Layer B (initial viewport) set:** PW2-CMP-006, 007.

**Layer C (homepage) set:** PW2-CMP-002, 005, 008, 009, 010.

**Layer D:** supporting answers in §9 classified MAY ANSWER ON SUPPORTING PAGE or DEFER.

Do not write the final headline to satisfy CMP-002. PW-3 may narrow the intended-category wording. BOS must not become vague “all-in-one” (`PW2-RSK-019`).

---

## 9. Visitor Questions and Objections

Question wording is a **UX HYPOTHESIS** about likely visitor questions. Answers must stay inside PW-1. Classification is binding for later IA and copy.

| Question ID | Question | Classification | Who needs it | Allowed answer class | Must not imply | Governing claim IDs |
| --- | --- | --- | --- | --- | --- | --- |
| PW2-Q-001 | What is ZyntixAI? | MUST ANSWER ON INITIAL VIEW | VIS-001, 002, 006, 009, 014 | Name + operator purpose; intended BOS only with qualifier | Chatbot-only; GA all-in-one | PW1-CLM-001, 002, 003 |
| PW2-Q-002 | Is it a chatbot? | MUST ANSWER ON INITIAL VIEW | VIS-001, 011 | Not only a chatbot; Home/NBA are not generative chat | “No AI ever”; “AI runs the company” | PW1-CLM-003, 027, 054; PW1-PRH-016 |
| PW2-Q-003 | What business problem does it address? | MUST ANSWER ON HOMEPAGE | VIS-001, 002 | Human operators organizing work (Today, tasks, attention, TG-qualified tools) | Autonomous operation; guaranteed results | PW1-CLM-002, 018, 027, 067 |
| PW2-Q-004 | What can it actually do today? | MUST ANSWER ON HOMEPAGE | VIS-001, 002, 009 | Qualified Beta-1 operator capabilities; Home Production ≠ complete CS edition | Current-SHA complete CS; live TG2–4 editions | PW1-CLM-014–018, 070; PW1-PRH-022 |
| PW2-Q-005 | Is it built for a business like mine? | MUST ANSWER ON HOMEPAGE for VIS-002; MAY ANSWER ON HOMEPAGE for deferred TGs | VIS-002–005, 012 | Relevance with availability qualifier | Equal availability of four editions | PW-1 §8; PW1-CLM-020–022 |
| PW2-Q-006 | Are all target-group editions available? | MUST ANSWER ON HOMEPAGE if TGs appear; otherwise MUST ANSWER ON HOMEPAGE as soon as implied | VIS-001–005, 009 | No. TG1 qualified; TG2–4 thin slices not live offerings | “All four available” | PW1-PRH-001; PW1-CLM-055 |
| PW2-Q-007 | Is this a course platform or LMS? | MUST ANSWER ON HOMEPAGE if courses/coaching appear | VIS-002, 011 | Operator programs, not learner-facing LMS | Public catalog; take a course | PW1-CLM-016, 071 |
| PW2-Q-008 | Can I create an account? | MUST ANSWER ON HOMEPAGE | VIS-007, 008, 010 | No public Create account / Register CTA | Open signup; “coming soon” Register button | PW1-CLM-011, 012, 046; PW1-PRH-015 |
| PW2-Q-009 | Can I request beta access? | MUST ANSWER ON HOMEPAGE | VIS-008 | No public request destination today; HOLD future | Working form; implied access | PW1-CLM-047; PW1-PRH-021 |
| PW2-Q-010 | Is it free? | MUST ANSWER ON HOMEPAGE if commercial language appears; otherwise MUST NOT IMPLY AN ANSWER | VIS-010 | No price and no “free” claim | Free forever; free because closed beta | PW1-CLM-037, 038 |
| PW2-Q-011 | Is AI included? | MUST ANSWER ON HOMEPAGE if AI is mentioned; MUST NOT IMPLY AN ANSWER as a product SKU | VIS-001, 011 | Rule-based support inside an operator product; not a generative SKU | Unlimited AI; AI included free | PW1-CLM-027; PW1-PRH-004 |
| PW2-Q-012 | Can I connect my own AI provider? | MUST NOT IMPLY AN ANSWER as a capability; if asked, MUST ANSWER ON HOMEPAGE as unavailable | VIS-011 | Prohibited capability | Coming-soon provider grid | PW1-CLM-028, 053 |
| PW2-Q-013 | Is my data protected? | MUST ANSWER ON HOMEPAGE at named-control level; MAY ANSWER ON SUPPORTING PAGE for detail | VIS-013, 009 | Session, org-scoped loaders, fail-closed nav; not “fully secure” | Absolute security | PW1-CLM-032–034 |
| PW2-Q-014 | Is it compliant or certified? | MUST NOT IMPLY AN ANSWER | VIS-013, 009 | No AVG/GDPR/SOC2/ISO claim | Certification badges | PW1-CLM-041, 042; PW1-PRH-011–012 |
| PW2-Q-015 | Can I see the product? | MUST ANSWER ON HOMEPAGE | VIS-001, 008, 009 | No public tour today; authenticated Home is not the public site | Screenshots as live public app; `/home` as marketing | PW1-CLM-014, 050; PW1-PRH-017 |
| PW2-Q-016 | Is this a real working product or only a concept? | MUST ANSWER ON HOMEPAGE | VIS-001, 009 | Closed-beta product exists; public marketing site does not yet | GA launch; vaporware | PW1-CLM-005, 007, 009, 014 |
| PW2-Q-017 | What should I do next? | MUST ANSWER ON INITIAL VIEW | All prioritized visitors | Existing users: Sign in. Others: continue reading or honest stop | Sign in as Join; dead HOLD buttons | PW1-CLM-045–053 |
| PW2-Q-018 | Can I join a waitlist? | DEFER UNTIL CAPABILITY EXISTS | VIS-008 | No public waitlist; BQA is internal | Public waitlist CTA | PW1-CLM-048 |
| PW2-Q-019 | How do I contact you? | DEFER UNTIL CAPABILITY EXISTS | VIS-008, 009, 013 | No public contact page; do not publish in-app mailbox | Public Contact CTA; SLA | PW1-CLM-049, 043, 061 |
| PW2-Q-020 | Can I watch a demo? | DEFER UNTIL CAPABILITY EXISTS | VIS-001, 009 | No demo destination | Demo button | PW1-CLM-051 |
| PW2-Q-021 | Can I start a trial / start free? | MUST NOT IMPLY AN ANSWER | VIS-010 | Prohibited | Disabled “Start free” | PW1-CLM-052 |
| PW2-Q-022 | Do you use Stripe / can I pay? | MUST NOT IMPLY AN ANSWER as a capability | VIS-005, 010 | Payments not present | Checkout; subscriptions | PW1-CLM-029, 057 |
| PW2-Q-023 | Is social publishing on? | MAY ANSWER ON SUPPORTING PAGE; MUST NOT IMPLY always-on | VIS-002, 009 | Gated; last governed execution OFF | Always-on publishing | PW1-CLM-024, 025; PW1-PRH-018 |
| PW2-Q-024 | How many customers use it? | MUST NOT IMPLY AN ANSWER | VIS-009 | No traction numbers | User counts from QA | PW1-CLM-039, 064 |
| PW2-Q-025 | What happens if I cannot get access today? | MUST ANSWER ON HOMEPAGE | VIS-008, 010, 003–005 | Honest stop: invite-only historically; no public form; this is not a broken conversion | Fake intake; unexplained dead end; “check back soon” scarcity | PW1-CLM-007, 047; PW1-PRH-021 |

**Coverage rule:** MUST ANSWER questions require later PW-5 content slots. DEFER questions must not be answered with fake destinations. MUST NOT IMPLY questions must not be answered by badges, buttons, or present-tense capability copy. VIS-010 remains out of scope as a conversion target; Q-008, Q-010, Q-021, Q-025 still require honest answers.

### 9.1 Question-to-layer map

| Layer | Question IDs |
| --- | --- |
| A — five-second / initial recognition | PW2-Q-001, PW2-Q-002 |
| B — initial viewport | PW2-Q-017 (next step: Sign in vs stop); PW2-Q-016 at “is this real vs a public site” level |
| C — homepage before action | PW2-Q-003–011, PW2-Q-015, PW2-Q-025 |
| D — supporting page / defer / must not imply | PW2-Q-012–014, PW2-Q-018–024 |

Q-006 and Q-007 are Layer C only if TGs or courses appear; otherwise they must not be implied.

---

## 10. Journey Stages

Stages describe the **design-intent** public information journey. They are **not** the current production `/` → `/login` bounce (§11) and they are **not** publication-ready until §12.2.

R1 consolidation: former “problem recognition” is merged into orientation so adjacent stages are not duplicate “what is this / what work” beats. Status is placed **before** capability lists so visitors cannot form a false availability expectation from feature language.

| Stage | Visitor decision | Required information | Allowed claim types | Misleading implication to prevent | Current production action | Design-intent / HOLD | Exit condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1. ARRIVAL | Am I in the right place? | Name ZyntixAI; host www.zyntixai.com | ALLOW identity (`PW1-CLM-001`, `004`) | Marketing homepage already exists at `/` | Production bounce to Sign in | Isolated public arrival (PW-13) | Wrong host/brand → leave |
| 2. ORIENTATION | What is this, and what work is it for? | Operator product; human-operated work; not-only-chatbot | ALLOW / ALLOW WITH QUALIFIER identity | Chatbot SKU; autonomous OS | Read if a public surface exists; today there is none | In-page explanation (FUT-006) | “I only wanted a chatbot” → safe stop |
| 3. STATUS AND AVAILABILITY | Can I use it now? | Closed beta; not GA; no open signup | CLM-007/008/011 | Public registration; scarcity theater | Honest status is not shown on production login as a marketing story | Same facts on a future public page (Layer B) | Wants open signup/trial → safe stop |
| 4. PRODUCT UNDERSTANDING | What exists in that status? | Qualified capabilities; vision ≠ availability | ALLOW WITH QUALIFIER capabilities | Present-tense complete suites | Not available in production public IA | Governed preview if later created | Expectation of full suite → safe stop |
| 5. RELEVANCE ASSESSMENT | Is it for my business? | TG **relevance** and **availability** as separate fields | TG matrix; no equal-availability visual | Four live editions; LMS; CS as the whole brand | Qualified relevance if TGs appear | Later TG-specific pages | Wrong TG or LMS expectation → safe stop |
| 6. TRUST EVALUATION | Can I take this seriously? | Clarity, realism, limitations; named controls only if they do not read as certification | Named technical controls only | Certifications; traction; urgency; badges in the hero | Read; no badges | Trust page after legal review | Needs legal claims → defer; do not invent |
| 7. ACTION DECISION | What may I do? | CTA hierarchy §13 | Sign in if existing user; otherwise no HOLD/PROHIBIT buttons | Dead buttons; Sign in as Start | Sign in **or** production has no explore action | HOLD destinations only after publication-ready | Existing user → Sign in; others → stop or later HOLD |
| 8. DESTINATION OR SAFE STOP | Did I finish honestly? | Transparent outcome, including why there is no form | No deceptive loop | Conversion dead end disguised as a form | `/login` for accounts; no public stop copy today | Real intake/demo/contact | Stop is successful if the visitor was not misled |

**Keyboard / screen-reader / mobile sequence (journey requirement, not a layout):** heading and focus order follow stages 1→8. Status (stage 3) must not be announced only after capabilities. Assistive technology must receive the same availability impression as the visual page (`PW2-RSK-023`).

**Safe-stop conditions (transparent, not deceptive):**

- no public intake exists;
- the visitor’s target-group edition is not live;
- they expected open registration;
- they expected generative AI;
- they expected a free trial;
- they need a capability that is not currently available.

A safe stop is an acceptable successful outcome. It must include a short explanation (`PW2-Q-025`), not an unexplained blank (`PW2-RSK-021`).

---

## 11. Current Production State

**VERIFIED PRODUCT FACT.** This is what exists now. It is not a marketing homepage and not design intent.

Unauthenticated visitor opens `https://www.zyntixai.com/` → `src/app/page.tsx` redirects to `/login` (`PW1-CLM-009`). `/login` is Sign in (`PW1-CLM-045`). Unauthenticated `/home` redirects to login (`PW1-CLM-032`). There is no public marketing IA, no in-page public exploration destination, and no `(marketing)` / `(public)` route group.

This path is **utility sign-in**, not product exploration. PW-2 does not treat it as an acceptable long-term exploration journey. PW-2 also does not change it. Dual-use `/` remains unresolved (`PW0-PB-036`); PW-2 must not choose replacement vs isolation.

**Non-admitted visitor outcome in current production:** they land on Sign in. That is not a truthful exploration journey. It must not be relabelled Explore, View product, Join, or Start.

---

## 12. Design-Intent and Publication-Ready Journeys

These states must never be collapsed into “current” or into each other.

### 12.1 Design-intent state

What later design phases **may specify**. Design intent does **not** prove implementation or publication readiness.

| Design-intent item | Visitor job | PW-1 status | Must not be treated as |
| --- | --- | --- | --- |
| Isolated public information journey | VIS-001 orientation | HOLD (`PW1-CLM-050`) | Current production; live CTA |
| In-page exploration (real section dest. / public explanation) | Continue reading without Sign in | HOLD until a real dest. exists (`PW2-FUT-006`) | `href="#"`; authenticated product access |
| Beta-interest journey | VIS-008 | HOLD (`PW1-CLM-047`) | Live access |
| Waitlist journey | VIS-008 | HOLD (`PW1-CLM-048`) | Public BQA |
| Trust-information journey | VIS-013, 009 | HOLD / PROHIBIT by claim | Certification page |
| Product preview or demo | VIS-001, 009 | HOLD (`PW1-CLM-050`, `051`) | `/home` or unlabeled mock |

Desired design-intent sequence (**UX HYPOTHESIS**): ARRIVAL → orientation → **status** → qualified understanding → relevance → trust → **either** Sign in (existing users) **or** a publication-ready HOLD destination **or** an explained safe stop.

### 12.2 Publication-ready state

A HOLD destination may be published only after **all** of:

1. a real unauthenticated destination exists (not `#`, not `/home`, not a disabled button);
2. policy/governance exists;
3. implementation is verified;
4. PW-1 is updated where the public decision must change;
5. accessibility, mobile qualifier, and authenticated-regression gates required by PW-0/B1-GATE.1 pass.

Until then the item remains design-intent. Unavailable actions are omitted or explained as status information.

### 12.3 HOLD routes (design-intent until publication-ready)

Every row is `DESIGNABLE — NOT CURRENTLY PUBLISHABLE`.

| Future route ID | Desired action | PW-1 decision | Required destination | Implementation owner | Validation requirement | Latest phase before public deployment | Publication condition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW2-FUT-001 | Request beta access | HOLD (`PW1-CLM-047`) | New governed unauthenticated intake (not BQA-internal, not `/home`) | Admission owner + PW-13 | Real route; policy; no implied admission | After implementation verification and PW-1 update | PW1-RQ-004 / PW1-PRH-021 closed as HOLD→allowable |
| PW2-FUT-002 | Join a controlled waitlist | HOLD (`PW1-CLM-048`) | New public waitlist page; **do not** reuse internal BQA as a public UI | Admission/support owner + PW-13 | Distinct from BQA commands | Same | Same |
| PW2-FUT-003 | Contact ZyntixAI | HOLD (`PW1-CLM-049`) | Unauthenticated contact destination; do not publish authenticated mailbox | Support owner + PW-13 | Fail-closed; no SLA invention | Same; legal review if personal data collected | PW1-RQ-011 |
| PW2-FUT-004 | View a governed product tour | HOLD (`PW1-CLM-050`) | Isolated public IA; not `/home` | Public-web implementation after design freeze | Must not look like authenticated Home | PW-13 after design freeze | PW0-PB-036 resolved; Home still P0 |
| PW2-FUT-005 | Watch a real demo | HOLD (`PW1-CLM-051`) | Hosted demo asset + page | Content/product owner + PW-13 | Asset exists; not a mock presented as live | Same | PW-1 still forbids presenting mocks as live (`PW2-RSK-014`) |
| PW2-FUT-006 | In-page public exploration | HOLD (no public sections today) | Real in-page destination or public explanation route; focus moves to the target | PW-4 / PW-13 | Real dest.; not `href="#"`; not authenticated UI | Design freeze + PW-13 | Must not expose `/home` or product modules |

Until publication-ready destinations exist, design-intent sequences **must collapse to §11** in production and to an explained safe stop plus Sign in (utility) on any future page that ships without HOLD destinations.

Do not treat desired routes as current product truth.

---

## 13. CTA Hierarchy Contract

No final CTA copy. Roles only.

| CTA role | Visitor served | Current readiness | PW-1 decision | Destination state | Design treatment | Publication condition | Fallback if unavailable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Primary exploration action | VIS-001, 002, 009 | DESIGN INTENT — not current, not publication-ready | HOLD View product (`PW1-CLM-050`) | No public product IA | Specify in design; do not render a working control until §12.2 | Isolated public surface + PW-1 update | Informational content without a fake “View product” button |
| In-page exploration | VIS-001 | DESIGN INTENT | HOLD until a real dest. (`PW2-FUT-006`) | No public section dest. | Real in-page target or public explanation; focus moves to the target | Implemented dest.; not `#`; not `/home` | Continue reading in document order; no fake anchor |
| Beta-interest action | VIS-008, optionally 002 | DESIGN INTENT — not publication-ready | HOLD Request beta / waitlist (`PW1-CLM-047`, `048`) | No public intake | Designable journey; **not** a public promise | Real governed intake | Honest text: no public request path today (`PW2-Q-025`) |
| Returning-user action | VIS-007, 006 | CURRENT PRODUCTION READY (qualified) | ALLOW WITH QUALIFIER Sign in (`PW1-CLM-045`) | `/login` exists | Persistent **utility** control; **not** the acquisition message; never labelled Start, Join, Explore, or View product | Already publishable as Sign in for existing accounts | Password recovery remains auth-owned, not a public-web CTA |
| Trust-information action | VIS-013, 009 | DESIGN INTENT as a page | HOLD / PROHIBIT depending on claim | No public privacy/trust page | May design a supporting page; no certification badges | Legal/technical authority + PW-1 | Homepage named-control sentences only if they do not overload Layer A/B; omit if they would overclaim |
| Safe-stop information | VIS-008, 003–005, 010–012 | READY as information (not a CTA) | Status ALLOW WITH QUALIFIER; HOLD destinations absent | None required | Visible text status; not a disabled button | Always required when HOLD/PROHIBIT actions are expected | Transparent explained stop is the success path |
| Prohibited commercial action | VIS-010, 011 | MUST NOT APPEAR | PROHIBIT Create account, Register, Start free, Start trial, Connect AI (`PW1-CLM-046`, `052`, `053`) | `/register` exists but must not be offered as a public CTA | Do not show enabled, disabled, or “coming soon” conversion buttons | Only if a later PW-1 authority changes the decision | Omit entirely |

**Binding constraints**

1. Sign in may be functional for existing accounts.
2. Sign in must not automatically become the main acquisition message because it is the only live CTA.
3. Sign in must not be relabelled Start, Join, Explore, or View product.
4. HOLD actions may be designed as design-intent but not rendered as working public promises.
5. PROHIBIT actions must not appear as enabled, disabled, “coming soon,” or implied conversion buttons unless a later authority changes PW-1. They are not valid current or future **default** actions.
6. A nonfunctional button is not an acceptable placeholder. Unavailable actions are omitted or explained as status.
7. `#` links are prohibited.
8. A button that silently routes to `/login` must not be labeled as product exploration.
9. A beta-interest CTA requires a real governed intake destination before publication.
10. In-page exploration must not pretend to expose authenticated product functionality.

---

## 14. Target-Group Relevance Journeys

Do not design cards or a final section. If later IA shows contexts, they must not visually imply equal availability.

| Target group | Visitor need (hypothesis) | Proven product scope | Status that must be communicated | What may be shown | Mandatory qualifier | What must not be implied | Safe current next action | Desired future next action | Validation question |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Course sellers / coaches | “Does this help me run courses/coaching as an operator?” | Release-verified CS operator product; Home Production-verified at `d110b6e3…`; other CS modules earlier B1-FV read/fixture mix | RELEASE VERIFIED operator product; **not** complete current-SHA Production-verified edition | Operator CRM/programs/Home/tasks at qualifier depth; coaching as same operating model | Invite-only historically; **not an LMS**; Home Production does not prove CRM/programs | Learner-facing LMS; public course catalog; complete live CS edition; equal TG availability | Qualified read + Sign in if admitted; otherwise honest stop | Beta-interest if intake exists and policy includes them | “Did you think students take courses on this website?” |
| Agencies / business services | “Is there an agency edition I can use?” | Implemented and integration-tested thin slice (lead → client → project → tasks → attention) | Thin slice; **not** Production-proven; **not** proven closed-beta-eligible | Thin workflow as in-repository scope | Not an available agency beta edition | Complete agency edition; client portal; billing; live agency customers | Honest deferred relevance; safe stop | Intake only after TG2 Production FV + admission | “Did you think agencies can join this edition now?” |
| Construction / installation / field | “Is there field-service software with routing/GPS?” | Implemented and integration-tested thin slice; lightweight dispatch | Thin slice; not Production-proven; not proven closed-beta-eligible | Thin workflow | Lightweight dispatch ≠ route optimization; **no GPS/routing** | Full field suite; GPS; mobile offline; live field edition | Honest deferred relevance; safe stop | Intake only after TG3 Production FV + admission | “Did you think GPS/routing is included?” |
| E-commerce / product / fulfillment | “Can I sell online with ZyntixAI?” | Implemented and integration-tested operator inventory/order/fulfillment slice | Thin operator slice; not a live storefront; not proven closed-beta-eligible | Operator inventory/order language only | Not consumer e-commerce; **no storefront/checkout/payments/Stripe** | Shop, checkout, Stripe, marketplaces, complete commerce platform | Honest deferred relevance; safe stop | Intake only after TG4 Production FV + admission + payments authority | “Did you think you can check out or take payments here?” |

**Shared rule:** four contexts must not be presented as four equally available products. Shared core ≠ four public editions (`PW1-CLM-062`). Course Sellers must not redefine the entire ZyntixAI brand.

### 14.1 Comparative presentation requirement (not a card design)

If later design shows more than one target-group context:

| Field | Must be separate | Must not be inferred from |
| --- | --- | --- |
| Relevance | “Who this context is for” | Imagery, order, or equal card weight |
| Availability / readiness | Visible **text** status (e.g. operator Beta-1 vs thin slice, not live edition) | Color, badges-only, sequence, photography, or equal visual weight |

- Equal visual card weight must **not** imply equal readiness.
- Status cannot be conveyed only through color, badges, order, or imagery.
- Future/deferred contexts must not look selectable or accessible without a real route.
- Keyboard, screen-reader, and mobile visitors must receive the same relevance/availability pair (`PW2-RSK-023`).
- Do not design the cards here.

---

## 15. Misinterpretation and Expectation-Risk Register

| Risk ID | Misinterpretation | Trigger | Affected visitor | Severity | Prevention requirement | Governing claim IDs | Validation method | Blocking gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW2-RSK-001 | ZyntixAI is a chatbot | Hero/AI-first visuals; chat widget | VIS-001, 011 | High | CMP-004 on first view; no chatbot-first layout | PW1-CLM-003; PW1-PRH-016 | PW2-VAL-001 | Copy freeze / design freeze |
| PW2-RSK-002 | AI is generative or autonomous | “AI” without “rule-based/human-operated” | VIS-001, 011 | High | CMP-005; no autonomy verbs | PW1-CLM-027, 054; PW1-PRH-004, 023 | PW2-VAL-009 | Copy freeze |
| PW2-RSK-003 | All four target groups are fully available | Four equal cards/badges | VIS-001–005 | High | Unequal availability text; no equal “available” chrome | PW1-PRH-001; PW1-CLM-055 | PW2-VAL-008 | Copy freeze / public deploy if claimed |
| PW2-RSK-004 | Course Sellers is an LMS | “Courses” without operator qualifier | VIS-002 | High | CMP-008; prohibit learner CTAs | PW1-CLM-071 | PW2-VAL-010 | Copy freeze |
| PW2-RSK-005 | Closed beta means public registration | `/register` mentioned as a visitor action | VIS-008, 010 | High | No Register CTA; status text | PW1-CLM-011, 046; PW1-PRH-015 | PW2-VAL-004 | Public deploy of Register CTA |
| PW2-RSK-006 | Sign in means Start / Join | Sign in as only large button with acquisition label | VIS-001, 007 | High | CMP-007; Sign in is utility | PW1-CLM-045 | PW2-VAL-002, 003 | Design freeze |
| PW2-RSK-007 | Future beta-interest is live access | HOLD button rendered as working | VIS-008 | High | No HOLD controls; honest stop | PW1-CLM-047; PW1-PRH-021 | PW2-VAL-004 | PW-13 if CTA in surface |
| PW2-RSK-008 | Thin slices are complete editions | Feature lists without exclusions | VIS-003–005 | High | Mandatory qualifiers attached to subjects | PW1-CLM-020–022, 058, 059 | PW2-VAL-008 | Copy freeze |
| PW2-RSK-009 | Product is free or has a trial | Closed-beta language; empty price | VIS-010 | High | No free/trial words or buttons | PW1-CLM-037, 038, 052 | PW2-VAL-001 Q5 | Copy freeze |
| PW2-RSK-010 | Stripe / payments are active | Commerce context without exclusion | VIS-005, 010 | High | Explicit no-storefront/no-payments | PW1-CLM-029, 057 | Message test | Copy freeze |
| PW2-RSK-011 | Social publishing is active | Social logos | VIS-002 | Medium | Resting OFF; gated | PW1-CLM-025; PW1-PRH-018 | Copy review | Social-on copy |
| PW2-RSK-012 | Internal/QA data is traction | Counts, “customers”, logos | VIS-009 | High | No counts/logos/testimonials | PW1-CLM-039, 040, 064 | Copy review | Copy freeze |
| PW2-RSK-013 | Technical controls equal compliance | Shield/lock badges | VIS-013 | High | No AVG/SOC2/uptime | PW1-CLM-041, 042, 036 | Legal review | Trust page / deploy |
| PW2-RSK-014 | Mockup or future UI is current live functionality | Preview imagery without caption | VIS-001, 009 | High | Label vision vs current; no fake product tour | PW1-CLM-044, 050 | PW2-VAL-006 | Design freeze |
| PW2-RSK-015 | Authenticated Home is the public website | Deep link to `/home` as marketing | All | High | PW-0 P0; unauthenticated `/home` stays login | PW1-PRH-017 | Architecture review | PW-13 |
| PW2-RSK-016 | Manufacturing or “every business” is supported | Broad industry collage | VIS-012 | Medium | Do not add unsupported TGs | PW1-CLM-063; PW1-PRH-002 | Copy review | Copy freeze |
| PW2-RSK-017 | Disabled button means “coming soon, click anyway” | Greyed Register/Start | VIS-010 | High | Omit prohibited controls | PW1-CLM-046, 052 | PW2-VAL-005 | Design freeze |
| PW2-RSK-018 | BQA/internal waitlist is a public waitlist | “Join waitlist” copy without a page | VIS-008 | High | HOLD until public destination | PW1-CLM-048 | IA review | PW-13 |
| PW2-RSK-019 | Intended BOS becomes vague “all-in-one” positioning | Category language without operator/closed-beta qualifiers | VIS-001 | High | CMP-002 on homepage; prohibit all-in-one/autonomy | PW1-CLM-002; PW1-PRH-003, 023 | PW2-VAL-006 | PW-3 copy freeze |
| PW2-RSK-020 | Closed-beta wording creates artificial scarcity | “Limited seats”, countdown, remaining invites | VIS-008, 010 | Medium | Invite-only as policy, not a sales countdown | PW1-CLM-007 | Copy review | Copy freeze |
| PW2-RSK-021 | Honest safe stop is an unexplained conversion dead end | Status with no Q-025 explanation | VIS-008 | High | Explain why there is no form; do not fake a button | PW1-CLM-047; PW2-Q-025 | PW2-VAL-004 | Design freeze |
| PW2-RSK-022 | Mobile reordering separates claims from qualifiers | Accordion/reflow hides availability text | VIS-001–005 | High | Qualifiers attached; not default-collapsed when material | PW-1 §8; CMP-009 | PW2-VAL-016 | PW-7 |
| PW2-RSK-023 | Assistive technology receives a different availability impression | Color-only status; SR misses qualifier | VIS-001–005, SR users | High | Text status in the accessibility tree; same CTA hierarchy | PW1-PRH-001 | PW2-VAL-013 | PW-8 |
| PW2-RSK-024 | Design-intent destination ships without PW-1 reverification | HOLD CTA implemented as live | VIS-008 | High | §12.2 checklist; update PW-1 before publish | PW1-RQ-004 | Release review | Public deploy |

**Risk count:** 24. **Highest severity (High):** PW2-RSK-001–010, 012–015, 017–019, 021–024.

---

## 16. Trust Journey

Earn trust in this order. Sequence is **GOVERNED PRODUCT INTENT** plus **UX HYPOTHESIS** about visitor processing. It is not a tested funnel.

1. Clear product identity (`PW2-CMP-001`) — Layer A.
2. Understandable operational value (`PW2-CMP-003`).
3. Honest maturity and availability (`PW2-CMP-006`) — Layer B, **not** the footer.
4. Concrete evidence-based capabilities (qualified; `PW2-Q-004`) — after status.
5. Limitations and qualifiers (TG, LMS, AI, commercial) — Layer C, attached to subjects.
6. Access clarity (invite-only historically; Sign in ≠ Join).
7. Narrow factual trust controls (session, org scope, fail-closed nav) — Layer C/D, not the hero, not legal conclusions.
8. Safe action (Sign in or explained honest stop).

Trust must arise from clarity, product realism, consistency, and honest limitations — not from badges or social proof.

| Trust information | Where it belongs |
| --- | --- |
| Product name; operator work; not-only-chatbot | Layer A |
| Closed beta vs GA; Sign in vs explore | Layer B / initial viewport |
| Qualified capabilities; TG relevance vs availability; no LMS; explicit AI limit if AI is mentioned | Layer C homepage |
| Named technical controls at a high level | Homepage Layer C, only if they do not read as certification and do not overload Layer A/B |
| Privacy policy, AVG/GDPR conclusions, processor map, residency | Layer D supporting page **only after legal authority** (PW1-RQ-008) |
| Certifications, uptime/SLA, absolute security, traction, logos, testimonials | Only after a new PW-1 authority — currently **must not appear** |

**Prohibited trust mechanisms:** fake testimonials; invented logos; unsupported user counts; certification badges; absolute security claims; generic “trusted by”; urgency or scarcity without evidence.

---

## 17. Accessibility Journey Requirements

These are journey-level requirements for later PW-8. They do not replace PW-8.

1. Visitors can understand the primary purpose without motion.
2. Heading order matches the journey stages in §10 (identity → orientation → status → capabilities → relevance → trust → action).
3. Actions are understandable without color alone.
4. Status qualifiers are visible text, not icon-only, and exist in the accessibility tree.
5. Target-group availability is not encoded only through badges or color.
6. Keyboard sequence follows the intended decision journey; Sign in is findable but not announced as the product purpose.
7. Screen-reader action hierarchy matches visual CTA roles; availability impression must match the visual page (`PW2-RSK-023`).
8. Mobile visitors receive the same product-truth qualifiers as desktop; material qualifiers stay attached after reflow (`PW2-RSK-022`).
9. Plain language is used for beta, availability, and AI limitations.
10. No critical explanation depends on hover.
11. Reduced-motion users do not lose journey information.
12. Zoom and reflow keep qualifiers with their claims.
13. If in-page exploration is later implemented, focus moves to the destination; `href="#"` is forbidden.
14. Disabled or unavailable actions are not rendered as misleading controls.
15. Authenticated Home skip-link/AppShell contracts are not reused as the public-page chrome (PW-0 isolation).

---

## 18. Responsive Journey Requirements

Journey behavior, not visual layouts. No breakpoints or component layouts are defined.

### Desktop

- Visitors may compare information in parallel.
- Action hierarchy remains clear: exploration/status first; Sign in as utility.
- Product status remains near relevant capability information.

### Tablet

- Comparison may collapse progressively.
- Qualifiers must remain attached to their subjects.
- No target group may appear more available because of reordering.

### Mobile

- One dominant reading sequence.
- Identity and value before detailed feature lists.
- Closed-beta/status information remains discoverable early (within the mandatory five-second set, not buried at the end).
- Sign in remains available without becoming the false primary acquisition action.
- Qualifiers cannot be hidden in accordions by default when they materially change a claim.
- No CTA is separated from its governing availability context.
- No horizontal comparison is required to understand target-group differences.

---

## 19. Validation Plan

No tests in this plan were executed. Thresholds in §20 are **proposed**, not achieved.

| Test ID | Hypothesis | Participant profile | Task | Success criterion | Failure threshold | Evidence artifact | Required phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW2-VAL-001 | Layer A five-second view communicates name, operator work, and not-only-chatbot | First-time operator (VIS-001 analogue) | View initial screen ~5s; answer: What is the product? What work? Only a chatbot? | Correct on CMP-001, 003, 004 | Any chatbot-only answer, or inability to name ZyntixAI / operator work | Session notes + answer sheet | PW-9 / copy freeze |
| PW2-VAL-002 | Existing users find Sign in | Returning user analogue (VIS-007) | “Sign in to your existing account” | First click on Sign in | Click on a non-sign-in or missing control | First-click map | PW-9 |
| PW2-VAL-003 | Exploratory visitors do not use Sign in as exploration | VIS-001 analogue | “Learn what ZyntixAI is” | First click is information, not Sign in, once a public surface exists | Majority first-click Sign in as “see the product” | First-click map | PW-9 |
| PW2-VAL-004 | Beta-interested visitors do not expect immediate access when no intake exists, and can explain the stop | VIS-008 analogue | “Ask to join the beta” | Visitor reports no working request path; can state invite-only / no form (`PW2-Q-025`) | Visitor believes they submitted access, or cannot explain the stop | Task recording | PW-9; again before PW-13 if HOLD CTA added |
| PW2-VAL-005 | Visitors do not select misleading or dead actions | Mixed | Open-ended “what would you click?” | Zero clicks on `#`, disabled, or login-mislabelled controls | Any such click | Click list | Design freeze |
| PW2-VAL-006 | Visitors distinguish vision from current availability | VIS-001, 009 | Identify what exists today vs intended | No present-tense complete-suite report | Any “it does all of this now” for deferred suites | Comprehension sheet | PW-6 / PW-9 |
| PW2-VAL-007 | Visitors distinguish closed beta from GA | VIS-001, 010 | “Can anyone start using it today?” | No | Yes / register now | Same | PW-6 |
| PW2-VAL-008 | Visitors distinguish thin slices from complete editions | VIS-003–005 analogues | Availability of agency/field/commerce | Not live complete editions | Equal availability | Same | PW-6 |
| PW2-VAL-009 | Visitors distinguish rule-based support from generative AI | VIS-011 analogue | “Does AI write or run this?” | No generative/autonomous | Yes | Same | PW-6 |
| PW2-VAL-010 | Visitors distinguish operator product from LMS | VIS-002 analogue | “Do students take courses here?” | No | Yes | Same | PW-6 |
| PW2-VAL-011 | Page feels credible, calm, clear, honest, professional, not overpromising | VIS-001, 009 | Likert + qualitative | Directional honesty; no fabricated score presented as pass | Pattern of “overpromising” | Interview notes | PW-9 |
| PW2-VAL-012 | Keyboard journey matches intended decision order | Keyboard user | Tab through primary journey | Focus order matches §10; no hidden HOLD controls | Focus lands on deceptive control | Keyboard log | PW-8 / PW-9 |
| PW2-VAL-013 | Screen-reader action order matches visual hierarchy | Screen-reader user | Listen to headings and actions | Same CTA roles announced | Sign in announced as the product purpose | SR transcript | PW-8 |
| PW2-VAL-014 | Zoom/reflow keeps qualifiers attached | Low-vision analogue | 200% / reflow | Qualifiers remain with claims | Qualifier dropped | Screenshots | PW-8 |
| PW2-VAL-015 | Reduced motion keeps journey information | Reduced-motion user | Disable motion | Purpose and status remain | Information only in animation | Notes | PW-8 |
| PW2-VAL-016 | Mobile shows the same material qualifiers | Mobile visitor | Complete CMP-006 and TG qualifiers | Parity with desktop on material qualifiers | Qualifier only on desktop, or detached after reflow | Mobile notes | PW-7 / PW-8 |
| PW2-VAL-017 | Layer B initial viewport communicates closed beta vs GA and Sign in ≠ explore | VIS-001 analogue | View the initial viewport (not a 5-second flash); answer: Is it publicly available? What can you do next? | Correct on CMP-006 and CMP-007 | GA, Sign-in-as-Join, or status only in the footer | Viewport notes + answer sheet | PW-9 / copy freeze |

---

## 20. Success and Failure Metrics

Design-validation metrics only. Not live analytics. No traffic, conversion, or customer benchmarks are claimed. **Any numerical threshold is a proposed acceptance threshold, not an achieved result, and is subject to later validation.**

| Metric ID | What it measures | Target definition | Measurement method | Guardrail | Earliest validation phase |
| --- | --- | --- | --- | --- | --- |
| PW2-M-001 | Correct operator-purpose comprehension | Proposed: ≥ 8/10 participants state operator business work, not chatbot SKU. **Not achieved.** | PW2-VAL-001 | Do not ship chatbot-first | PW-9 |
| PW2-M-002 | Correct non-chatbot comprehension | Proposed: 0 chatbot-only answers in a planned sample. **Not achieved.** | PW2-VAL-001 Q3 | Chatbot-only is a copy freeze blocker | PW-9 |
| PW2-M-003 | Correct beta-status comprehension (Layer B) | Proposed: ≥ 8/10 say not generally available after initial-viewport view. **Not achieved.** | PW2-VAL-017 / 007 | GA answer is a copy freeze blocker | PW-9 |
| PW2-M-004 | Correct target-group availability comprehension | Proposed: 0 “all four live” answers when TGs are shown | PW2-VAL-008 | Equal-availability visual is a design freeze blocker | PW-9 |
| PW2-M-005 | Successful sign-in discovery for existing users | Proposed: ≥ 9/10 first-click Sign in on the returning-user task | PW2-VAL-002 | Sign in must remain findable | PW-9 |
| PW2-M-006 | False-expectation rate (trial, register, generative AI, live TG2–4) | Proposed: 0 uncorrected false expectations after homepage | Combined message tests | Any uncorrected false expectation blocks copy freeze | PW-6 / PW-9 |
| PW2-M-007 | Dead-end honesty (not deceptive dead-end) | Proposed: visitors who cannot act still report they were told access is invite-only / no form | PW2-VAL-004 | Fake form or `#` link is a design freeze blocker | PW-9 |
| PW2-M-008 | First-click accuracy (explore vs sign-in vs absent HOLD) | Proposed: exploratory task does not majority-click Sign in once a public surface exists | PW2-VAL-003 | Sign in as false acquisition | PW-9 |
| PW2-M-009 | Trust-rating distribution | Proposed: qualitative majority “honest / not overpromising”; **no numeric brand-lift target** | PW2-VAL-011 | Fake social proof forbidden regardless of score | PW-9 |
| PW2-M-010 | Mobile comprehension parity | Proposed: same pass/fail on CMP-006 and material TG qualifiers as desktop | PW2-VAL-016 | Mobile-only qualifier loss blocks PW-7 | PW-7 |
| PW2-M-011 | Accessibility blocker count | Proposed: 0 blockers that hide status, swap CTA meaning, or rely on color/hover | PW2-VAL-012–015 | Any such blocker blocks PW-8 | PW-8 |

Do not implement analytics to collect these metrics (`PW1-CLM-060`).

---

## 21. Decision Register

Journey decisions. Conservative defaults remain binding for **open** rows until a named owner changes them. They are **not** user-research conclusions. `PW2-OD-001` is owner-frozen and is no longer an open blocker.

| Decision ID | Decision | Why unresolved / resolved | Current default or selected option | Options | Governing authority | Owner / phase | Latest blocking gate | Consequence if unresolved | Owner-level? |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW2-OD-001 | Primary public audience | **Resolved.** Previously open because there was no visitor research. Frozen by explicit owner selection, not by research. | **Selected:** `MODEL A — GENERAL OPERATOR PRIMARY`. VIS-001 sole brand-primary; VIS-002 leading relevance context. Status: `RESOLVED — OWNER FROZEN`. | Selected Model A. Model B and Model C remain documented rejected alternatives, not active options. | Explicit ZyntixAI owner decision; PW-0 §3; PW-1 remains binding | **Owner** (frozen 2026-09-15); governs PW-3 and later public-web phases | **Does not block PW-3.** Reverification: explicit owner change, materially changed product evidence, or governed visitor research | Later positioning must use the general operator as brand-primary and Course Sellers as leading relevance context | **Yes — resolved** |
| PW2-OD-002 | Whether Course Sellers is the leading homepage relevance context | Strategy vs research gap; owner choice | Yes, as lead relevance **if** TG contexts appear; not as a complete live edition; not the whole brand | CS-first relevance; no TG on homepage; all four equal (**forbidden** without PW-1 change) | PW-1 §8 | **Owner** + PW-3 / PW-4 / PW-5 | PW-3 if it changes the first story; design freeze for a TG section | CS must not silently become the brand in copy | **Yes** |
| PW2-OD-003 | Whether the four target groups appear on the homepage | IA not in scope | Allowed as deferred contexts with unequal availability; **not required** | Homepage; supporting page; omit until evidence | PW1-PRH-001 | **Owner** + PW-4 / PW-5 | Copy freeze if equal availability implied | If shown without §14.1, equal-availability risk | **Yes** |
| PW2-OD-004 | Whether beta interest gets a public intake | No destination | HOLD; design FUT-001; do not publish | Build intake; remain informational stop | PW1-RQ-004 | **Admission owner**; PW-13 | Public deploy of that CTA | Remain explained safe stop | **Yes** |
| PW2-OD-005 | Whether a public waitlist is created | BQA is internal | HOLD; do not reuse BQA | New public waitlist; none | PW1-CLM-048 | **Admission/support owner**; PW-13 | PW-13 | Remain no waitlist CTA | **Yes** |
| PW2-OD-006 | Whether a public contact route is created | In-app mailto only | HOLD public Contact; do not publish mailbox | Public contact; remain none | PW1-RQ-011 | **Support owner** | PW-13 | Remain no public Contact | **Yes** |
| PW2-OD-007 | Whether a product preview or demo is created | No public IA or asset | HOLD; Home must not be the preview | Isolated tour; hosted demo; none | PW1-CLM-050, 051; PW-0 P0 | **Owner** + PW-4 / content / PW-13 | Design freeze + PW-13 | Remain no tour/demo CTA | **Yes** |
| PW2-OD-008 | What happens to non-invited interested visitors | No intake | Honest explained safe stop (`PW2-Q-025`) | Stop; future intake; waitlist | PW1-PRH-021 | PW-3 tone; **owner** if CTA | Public deploy | Default stop remains | No (tone) / Yes (if CTA) |
| PW2-OD-009 | Dual-use `/` vs isolated public page; login restyle | PW-0 U items | Keep current bounce; do not restyle login via PW-2 | Isolate public `/` vs keep bounce; login restyle yes/no | PW0-PB-036/037; PW1-RQ-009/010 | PW-13; PW-3 for login restyle | PW-13 / design freeze for login | Must not implement `/` replacement from this document | Split: architecture vs brand |
| PW2-OD-010 | How future / unsupported target groups are acknowledged | Manufacturing and others not supported | Mention only as not currently in scope if needed; otherwise omit | Footer note; supporting page; omit | PW1-CLM-063 | PW-3 / PW-4 | Copy freeze | Default omit | No |
| PW2-OD-011 | Which trust information requires legal review | No legal dossier | Homepage: named controls only; no AVG/certification/residency | Trust page timing | PW1-RQ-008 | **Legal owner** before trust page | Trust page / public deploy of legal claims | No legal claims ship | **Yes** (legal) |
| PW2-OD-012 | Whether intended BOS wording appears in Layer A | PW1-RQ-003 | CMP-002 is Layer C; CMP-003 carries five-second purpose | BOS in Layer A; later; narrowed category | PW1-CLM-002 | PW-3 | PW-3 copy freeze | Default Layer C | No (PW-3 may decide) |
| PW2-OD-013 | In-page exploration vs separate public explanation route | No public sections exist | Design-intent FUT-006; not current; no `#` | In-page dest.; separate route; omit | PW1-CLM-050; PW-0 | PW-4 / PW-13 | Design freeze | No fake anchors | No (IA) |

| Count | Value | IDs |
| --- | --- | --- |
| Total decision records | **13** | PW2-OD-001 … PW2-OD-013 |
| Resolved | **1** | PW2-OD-001 (`RESOLVED — OWNER FROZEN`) |
| Unresolved / open | **12** | PW2-OD-002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 013 |

Cursor must not silently resolve remaining owner-level rows through wording elsewhere. Model A in §2 and §6.2 is **owner-frozen**, not a working default. OD-002 through OD-013 remain open under their existing gates.

---

## 22. Handoff Contract

### PW-3 — Positioning & Messaging

**Binding audience direction (`PW2-OD-001` owner-frozen).** PW-3 must:

- address `PW2-VIS-001` as the single brand-primary visitor;
- make operational business organization (customers, work, responsibilities, progress) understandable;
- preserve the intended Business Operating System direction within PW-1 limits;
- avoid chatbot-first positioning;
- avoid autonomous-AI implications;
- use Course Sellers / coaches (`PW2-VIS-002`) only as the strongest evidenced relevance context;
- avoid defining ZyntixAI as an LMS or course platform;
- avoid “for every business” and undefined “all-in-one” claims;
- avoid letting Course Sellers control the entire homepage message.

`PW2-OD-001` **no longer blocks** PW-3 positioning freeze.

**Still open for PW-3 and later phases** (not decided by Model A):

- final positioning statement;
- category prominence in the hero;
- final value proposition;
- final headline or supporting copy;
- whether Course Sellers appears above the fold (`PW2-OD-002`);
- whether target groups appear on the homepage, and how many (`PW2-OD-003`);
- final CTA hierarchy;
- beta-interest language (`PW2-OD-004`);
- supporting trust language (`PW2-OD-011`).

Must also consume layered comprehension (§8); questions (§9); risks (§15); claim-ID boundaries. May narrow approved wording. Must not broaden ALLOW, convert HOLD/PROHIBIT to ALLOW, write chatbot-first / four-TG-available / LMS / GA headlines, or treat Course Sellers as the entire brand.

### PW-4 — Information Architecture

Must consume: visitor paths (§10–§12); question coverage (§9); **current production / design-intent / publication-ready** states; in-page exploration rules (`PW2-FUT-006`); safe-stop requirements; dual-use `/` remains unresolved (do not design replacement of `/` as if approved).

### PW-5 — Homepage Content Model

Must map each content requirement to: visitor ID; journey stage; question ID; claim IDs; CTA readiness (CURRENT PRODUCTION READY / DESIGN INTENT / HOLD / PROHIBIT / information-only); comprehension layer (A/B/C/D).

### PW-6 — Public Copy Deck

Every material sentence must map to approved PW-1 claim IDs and PW-2 comprehension goals. No invented CTAs.

### PW-7 / PW-8

Responsive and accessibility work must preserve journey order, qualifier visibility, and truthful CTA hierarchy (§13, §17, §18).

### PW-9 through PW-12

Wireframes and HIFI must be validated against §15 risks and §19 tests. Imagery must not trigger PW2-RSK-014.

### PW-13 and public deployment

No HOLD destination may become a functioning public CTA until: a real route exists; governance exists; implementation is verified; PW-1 is updated where necessary. Authenticated Home remains closed. No analytics without a new authority.

PW-2 does not start PW-3.

---

## 23. Acceptance Gate

PW-2 uses AND logic. One failed mandatory condition means PW-2 is not closed. Browser/production gates are **NOT REQUIRED** for this documentation-only slice (no user-visible product change). Justification: this file cannot alter runtime behavior.

| # | Mandatory condition | Result |
| --- | --- | --- |
| 1 | Preflight matches expected clean baseline | **PASS** — root, branch `core/platform-readiness-20260707`, HEAD/upstream `e694b85…`, ahead/behind `0 0`, clean worktree before this file |
| 2 | PW-0 and PW-1 present and binding | **PASS** |
| 3 | Audiences based on evidence or explicitly labelled hypotheses | **PASS** — §4–§6 |
| 4 | PRIMARY / SECONDARY / UTILITY / DEFERRED / OUT OF SCOPE distinguished; sole brand-primary is VIS-001; co-primary is not an active model | **PASS** — §6.1–§6.2; PRIMARY 1; OD1 owner-frozen |
| 5 | No fabricated research | **PASS** — hypotheses labelled; no interviews claimed |
| 6 | Visitor jobs and decisions defined for prioritized visitors | **PASS** — §7 |
| 7 | Comprehension layered (A/B/C/D); five-second load controlled | **PASS** — §8 |
| 8 | Chatbot-only interpretation actively prevented | **PASS** — CMP-004; RSK-001 |
| 9 | Autonomous-AI interpretation actively prevented | **PASS** — CMP-005 Layer C + Layer A omission; RSK-002 |
| 10 | Closed beta separated from GA | **PASS** — CMP-006 Layer B; Q-008 |
| 11 | Relevance separated from availability | **PASS** — §14.1; Q-005/006 |
| 12 | All four target groups retain PW-1 qualifiers | **PASS** — §14 |
| 13 | Course Sellers not presented as an LMS or the entire brand | **PASS** — CMP-008; RSK-004 |
| 14 | Current production, design-intent, and publication-ready states distinct | **PASS** — §11–§12 |
| 15 | HOLD actions remain non-publishable | **PASS** — §12–§13 |
| 16 | PROHIBIT actions are not valid journey options | **PASS** — §13 prohibited role |
| 17 | No dead or deceptive CTA authorized | **PASS** — no `#`, no disabled conversion buttons |
| 18 | Sign in usable without becoming false acquisition | **PASS** — utility role; CMP-007 |
| 19 | Trust does not rely on fake social proof or unsupported claims | **PASS** — §16 |
| 20 | Accessibility and responsive journey requirements defined | **PASS** — §17–§18 |
| 21 | Validation methods defined without fabricated results | **PASS** — §19 |
| 22 | Proposed metrics not presented as achieved | **PASS** — §20 |
| 23 | Decision register: OD-001 owner-frozen; 12 other decisions remain open under existing gates | **PASS** — §21; OD-001 no longer blocks PW-3 |
| 24 | Later-phase handoffs explicit | **PASS** — §22 |
| 25 | No final positioning, copy, sitemap, wireframe, or implementation created | **PASS** |
| 26 | Only this PW-2 document created; no existing file changed | **PASS** — verified after write |
| 27 | No product, test, configuration, dependency, or infrastructure code changed | **PASS** |
| 28 | No secret or sensitive information recorded | **PASS** |
| 29 | No commit, push, or deployment | **PASS** |

---

## 24. Final Status

```text
PASS — PW-2 VISITOR GOALS & JOURNEY MAP ESTABLISHED WITH EVIDENCE
PASS — PW-2-R1 VISITOR STRATEGY REVIEW CLOSED WITH EVIDENCE
PASS — PW2-OD-001 OWNER AUDIENCE DECISION FROZEN
```

Primary audience ambiguity is resolved. Model A is owner-frozen. PW-3 is no longer blocked by `PW2-OD-001`. Twelve other decisions remain open under their existing gates and do not prevent PW-2 documentation closure. PW-2 remains documentation-only. Final verification and commit are still required.

```text
PW-2 OWNER AUDIENCE DECISION FROZEN — READY FOR FINAL VERIFICATION
```

No implementation is authorized. Do not start PW-3 until separately authorized. Authenticated Home remains closed.

---

## 25. Evidence Appendix

### 25.1 Preflight

| Check | Result |
| --- | --- |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `e694b85ead8a4b75054a078624aadfd315cea39d` |
| Upstream | `origin/core/platform-readiness-20260707` @ `e694b85ead8a4b75054a078624aadfd315cea39d` |
| Ahead / behind | `0 0` |
| Staged / unstaged tracked / untracked before this file | none / none / none |
| Worktree | completely clean |

### 25.2 Authorities inspected (read, not modified)

- `docs/phases/PW-0-public-web-charter-boundary-freeze.md`
- `docs/phases/PW-1-product-truth-claims-register.md`
- `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md`
- `src/app/page.tsx` (logged-out `redirect("/login")`)
- `src/app/login/page.tsx` (Sign in surface)
- Path existence: `src/features/auth/server/public-registration.ts`; `src/features/business-qualification/domain/admission.ts`; `src/features/onboarding/domain/operating-model.ts`
- No `AGENTS.md`

Cited PW-1 claim IDs used in this document are from `PW1-CLM-001` through `PW1-CLM-071` as referenced in tables. Prohibited-claim IDs used: `PW1-PRH-001`, `002`, `004`, `005`, `007`–`013`, `015`–`018`, `021`–`023`. Open questions consumed: `PW1-RQ-003`, `004`, `008`–`011`.

### 25.3 ID inventory

| Register | Original PW-2 | After R1 | ID range |
| --- | --- | --- | --- |
| Visitors | 14 | **14** | PW2-VIS-001 … PW2-VIS-014 |
| Comprehension | 10 | **10** | PW2-CMP-001 … PW2-CMP-010 |
| Questions | 24 | **25** | PW2-Q-001 … PW2-Q-025 |
| Future / design-intent routes | 5 | **6** | PW2-FUT-001 … PW2-FUT-006 |
| Risks | 18 | **24** | PW2-RSK-001 … PW2-RSK-024 |
| Tests | 16 | **17** | PW2-VAL-001 … PW2-VAL-017 |
| Metrics | 11 | **11** | PW2-M-001 … PW2-M-011 |
| Open decisions | 12 | **13** | PW2-OD-001 … PW2-OD-013 |

Priority totals after R1: PRIMARY 1, SECONDARY 5, UTILITY 1, DEFERRED 4, OUT OF SCOPE 3. Sum 14.

OD1 (2026-09-15) did not change visitor counts. Decision records remain **13**; **1** resolved (`PW2-OD-001`); **12** open (`PW2-OD-002` … `PW2-OD-013`).

### 25.4 Commands not run

No `npm install`, formatter, build, or test suite. No analytics. No commit. No push. No deploy. No PW-3 document.

### 25.5 Confirmation

No product code changed. No test code changed. No configuration changed. No existing tracked file was modified. PW-0 and PW-1 were not edited. Authenticated Home was not reopened. No HOLD destination was treated as live. No PROHIBIT CTA was authorized as a journey option.

```text
PW-2 DOCUMENTATION COMPLETE — R1 CLOSED — AWAITING FINAL VERIFICATION AUTHORIZATION
```

---

## 26. R1 Independent Visitor-Strategy Review Evidence

| Field | Value |
| --- | --- |
| Review date | 2026-09-15 |
| Baseline SHA | `e694b85ead8a4b75054a078624aadfd315cea39d` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` @ same SHA; ahead/behind `0 0` |
| Initial R1 worktree | no staged files; no tracked modifications; exactly one untracked file: this document |
| Product / test / config edits in R1 | **NONE** |
| Commit / push / deploy | **NOT DONE** |

### Authorities inspected

- This document (PW-2 draft under review)
- `docs/phases/PW-0-public-web-charter-boundary-freeze.md` (closed at `40ab024…`)
- `docs/phases/PW-1-product-truth-claims-register.md` (closed at `e694b85…`)
- `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md`
- `src/app/page.tsx`; `src/app/login/page.tsx`; `src/app/invite/accept/page.tsx` (path existence)
- No `AGENTS.md`

### Visitor groups reviewed

All 14 groups (`PW2-VIS-001`–`014`) were reviewed individually. None were split, merged, added, or removed. VIS-011 was renamed as a **wrong-fit** visitor. VIS-010 remains out of scope as a conversion target with required honest answers. VIS-006 (invited) and VIS-007 (existing account) remain unconflated.

| | Visitors | PRIMARY | SECONDARY | UTILITY | DEFERRED | OUT OF SCOPE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Original PW-2 | 14 | 2 | 4 | 1 | 4 | 3 |
| After R1 | 14 | **1** | **5** | 1 | 4 | 3 |

### Primary-audience model review

Models A, B, and C were evaluated against PW-0 purpose, PW-1 TG evidence, closed-beta policy, intended BOS category, multi-context direction, generic-message risk, and CS-as-entire-brand risk.

- **Working model at R1 close:** Model A (general operator primary), recorded as a conservative working default pending owner freeze.
- **Rejected as working defaults:** Model B (CS would capture the brand); Model C (co-primary avoided prioritization).
- **Owner decision at R1 close:** `PW2-OD-001` remained open and blocked PW-3 positioning freeze.
- **OD1 later (2026-09-15):** explicit owner freeze of Model A; see §27. R1 analysis is retained. This annotation does not rewrite the R1 PASS.

### Comprehension

Original 10 / final 10 IDs. Layers introduced: A (CMP-001, 003, 004); B (CMP-006, 007); C (CMP-002, 005, 008, 009, 010). CMP-005 moved off the five-second mandatory slogan list; autonomy is prevented in Layer A by operator framing and omission, with explicit explanation on the homepage if AI is mentioned. Closed-beta status moved from five-second dump to Layer B (not the footer).

### Journey states

Original two-way current/future split was insufficient. R1 requires three states: **current production** (§11); **design intent** (§12.1); **publication-ready** (§12.2). Stages consolidated from 9 to 8 (problem recognition merged into orientation; status moved before capabilities).

### CTA

Sign in confirmed as utility. In-page exploration added as FUT-006 design intent (no `#`, no `/home`). HOLD destinations remain non-operational. PROHIBIT actions remain omitted. Safe stop must be explained (`PW2-Q-025`).

### Target groups

TG1 remains leading relevance, not brand-primary, not LMS, Home Production not extended to the edition. TG2–TG4 remain deferred thin slices. §14.1 requires separate relevance and availability fields.

### Questions, risks, tests, metrics, open decisions

| Register | Original | Final | Material change |
| --- | ---: | ---: | --- |
| Questions | 24 | **25** | Added PW2-Q-025 (explained safe stop); layer map §9.1 |
| Future routes | 5 | **6** | Added PW2-FUT-006 |
| Risks | 18 | **24** | Added RSK-019–024 (all-in-one BOS, scarcity, unexplained stop, mobile qualifier split, AT mismatch, publish without PW-1) |
| Tests | 16 | **17** | VAL-001 narrowed to Layer A; added VAL-017 for Layer B |
| Metrics | 11 | **11** | M-001/003 retargeted to layers; still proposed/not achieved |
| Open decisions | 12 | **13** | OD-001 owner-blocked at PW-3 (R1); added OD-013; consequence column. **OD1 later resolved OD-001; 12 remain open.** |

### Accessibility / responsive review

Heading/focus order tied to §10. Qualifier attachment, AT parity, in-page focus movement, and mobile non-reordering of availability are now journey requirements, not a generic checklist.

### Material corrections (reasons)

1. Co-primary → Model A working default: co-primary avoided a first-impression decision.
2. VIS-002 PRIMARY → SECONDARY: CS is evidence/relevance, not the public brand.
3. Comprehension layers A–D: five-second set was overloaded.
4. Three journey states: current/future was too broad.
5. Status stage moved before capabilities: prevent false availability from feature lists.
6. In-page exploration specified as design intent, not current readiness.
7. Explained safe stop: prevent deceptive or blank dead ends.
8. Comparative TG fields: equal cards must not imply equal availability.
9. Owner decisions listed with blocking gates; at R1 close, OD-001 blocked PW-3. OD1 later froze OD-001 (see §27).

### Confirmation

No research result, interview, conversion rate, or test score was invented. No product code, tests, configuration, or tracked file changed. PW-0 and PW-1 were not edited. Authenticated Home was not reopened. PW-3 was not started.

### R1 conclusion

```text
PASS — PW-2-R1 VISITOR STRATEGY REVIEW CLOSED WITH EVIDENCE
```

PW-2 status after R1:

```text
PW-2 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

At R1 close, `PW2-OD-001` remained owner-blocked for PW-3 positioning freeze. OD1 (2026-09-15) later owner-froze Model A; see §27. Do not start PW-3 without separate authorization. Wait for final-verification authorization to commit.

---

## 27. OD1 Owner Audience Decision Evidence

| Field | Value |
| --- | --- |
| Decision ID | `PW2-OD-001` |
| Decision date | 2026-09-15 |
| Selected model | `MODEL A — GENERAL OPERATOR PRIMARY` |
| Authority | Explicit ZyntixAI owner decision |
| Status | `RESOLVED — OWNER FROZEN` |
| OD1 result | `PASS — PW2-OD-001 OWNER AUDIENCE DECISION FROZEN` |

### Binding owner decision

The primary public visitor for ZyntixAI is the owner/operator of a small business who wants to organize customers, work, responsibilities, and progress clearly. Course Sellers / coaches is the strongest evidenced relevance context, but it does not define the complete ZyntixAI brand identity. Other business contexts may only be presented truthfully and without unsupported availability implications.

### Rationale

R1 had already selected Model A as the conservative working default because PW-0 requires an unauthenticated visitor to understand an intended Business Operating System, not only a chatbot, and because Course Sellers evidence must not capture the public brand as an LMS or course platform. OD1 does not add visitor research. It converts that default into an owner freeze.

### Rejected alternatives

- **Model B — Course Sellers primary:** rejected. Strongest TG evidence is not a license to make CS the entire public identity.
- **Model C — co-primary:** rejected. Co-primary avoided a first-impression choice. It is not an active model.

### Affected visitor IDs

- Brand-primary: `PW2-VIS-001` (PRIMARY).
- Leading relevance context: `PW2-VIS-002` (SECONDARY).
- Other IDs and priorities unchanged (PRIMARY 1, SECONDARY 5, UTILITY 1, DEFERRED 4, OUT OF SCOPE 3; total 14).

### Affected phases

Governs PW-3 and all later public-web phases. Does not start PW-3. Does not authorize implementation.

### Product-truth guardrails

PW-1 remains binding. No LMS implication. No complete current-SHA Course Sellers edition. Agencies, Field, and E-commerce remain deferred. Relevance remains separate from availability. No CTA readiness, AI capability, or availability claim was changed.

### Decisions explicitly not resolved

`PW2-OD-002` through `PW2-OD-013` remain open. This freeze does not decide final positioning, hero category prominence, value proposition, headline or copy, whether Course Sellers appears above the fold, whether or how many target groups appear on the homepage, CTA hierarchy, beta-interest language, waitlist, public contact, demo/tour, legal trust copy, dual-use `/`, or implementation.

### Decision counts

| Count | Before OD1 | After OD1 |
| --- | ---: | ---: |
| Total decision records | 13 | **13** |
| Resolved | 0 | **1** (`PW2-OD-001`) |
| Open | 13 | **12** (`PW2-OD-002` … `PW2-OD-013`) |

### Confirmation

No visitor research, interview, conversion rate, or test result was claimed. No person name or signature was invented. No product code, tests, configuration, or tracked file changed. PW-0 and PW-1 were not edited. Authenticated Home was not reopened. PW-3 was not started. No staging, commit, push, or deployment occurred.

```text
PASS — PW2-OD-001 OWNER AUDIENCE DECISION FROZEN
```
