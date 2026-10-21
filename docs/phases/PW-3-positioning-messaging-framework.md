# PW-3 — Positioning & Messaging Framework

## 1. Document Control

| Field | Value |
| --- | --- |
| Phase ID | **PW-3** |
| Title | Positioning & Messaging Framework |
| Status | `PASS — PW-3-R1 POSITIONING AND MESSAGING REVIEW CLOSED WITH EVIDENCE` |
| Establishment status | `CONDITIONAL — PW-3 OWNER DECISION REQUIRED` (historical, at framework write) |
| OD freeze status | `PASS — PW3-OD OWNER POSITIONING DECISIONS FROZEN` |
| OD freeze date | 2026-09-15 |
| R1 review date | 2026-09-15 |
| Date | 2026-09-15 |
| Branch | `core/platform-readiness-20260707` |
| Baseline HEAD | `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| Ahead / behind | `0 0` |
| Governing PW-0 | `docs/phases/PW-0-public-web-charter-boundary-freeze.md` |
| PW-0 closure | `CLOSED WITH EVIDENCE — PW-0 PUBLIC WEB CHARTER & BOUNDARY FREEZE` at `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| Governing PW-1 | `docs/phases/PW-1-product-truth-claims-register.md` |
| PW-1 closure | `CLOSED WITH EVIDENCE — PW-1 PRODUCT TRUTH & CLAIMS REGISTER` at `e694b85ead8a4b75054a078624aadfd315cea39d` |
| Governing PW-2 | `docs/phases/PW-2-visitor-goals-journey-map.md` |
| PW-2 closure | `CLOSED WITH EVIDENCE — PW-2 VISITOR GOALS & JOURNEY MAP` at `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| Authenticated Home | Closed and protected. Closure SHA `49cd5773976143139a154f9b8ddf36535a4dd914`. Production product-code SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828`. Route `/home`. |
| Document type | Additive documentation and messaging-strategy only |
| Allowed mutation | This file only |
| Product / test / config edits | **NONE** |
| Commit / push / deploy | **NOT AUTHORIZED by this phase** |
| PW-4 | **NOT STARTED** |
| Audience model | `MODEL A — GENERAL OPERATOR PRIMARY` (`PW2-OD-001`, `RESOLVED — OWNER FROZEN`) |
| Public positioning direction | `OPERATIONAL CLARITY FOR SMALL-BUSINESS OPERATORS` (`PW3-TER-001`, `PW3-POS-001`) |
| Framework freeze | **Strategy frozen for OD-001–006 and homepage-scope OD-009.** OD-007 and OD-008 remain open. OD-009 legal/trust-page claims remain externally gated. Final public copy is **not** frozen. |
| Readiness | `PW-3 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT` |
| PW-3-R1 | Closed in §30. Independent review treated the framework as a candidate, not as automatically correct. |
| PW-3-FV / PW-4 | **NOT STARTED** |

**Purpose.** Establish an evidence-backed public positioning and messaging framework for the future ZyntixAI public website. Guide later information architecture, content modelling, and copy without becoming the final copy deck.

**Scope.** Documentation and messaging strategy only. No sitemap, homepage sections, wireframes, visual system, final marketing copy, CTA implementation, or product-code change.

**Non-goals.** This phase does not freeze a hero headline; does not write button labels; does not define navigation; does not implement routes, intake, waitlist, contact, or demo; does not change PW-1 claim decisions or product availability; does not change `/`, `/login`, `/register`, `/home`, middleware, or authenticated behavior; does not commit, push, deploy, or start PW-4.

**Repository instructions inspected.** No `AGENTS.md`, nested `AGENTS.md`, `.cursor/rules`, or `CONTRIBUTING.md` was present. Binding authorities: this PW-3 governing prompt; PW-0; PW-1; PW-2; `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md`; existing `docs/phases/` convention. In-product terminology files (`src/features/product-access/domain/terminology.ts` and related tests) are authenticated target-group language, not public-web copy authority. Old social “brand brain” documents are not public positioning authority (`PW1-CLM-065` PROHIBIT). The most specific applicable instruction is: create exactly this file and do not modify any existing file.

PW-0, PW-1, and PW-2 remain binding. Authenticated Home remains closed.

Candidate lines in this document are **strategic prototypes**, not publication-ready copy.

---

## 2. Executive Positioning Decision

**Authority.** `EXPLICIT ZYNTIXAI OWNER POSITIONING DECISION` (2026-09-15). The owner explicitly approved the recommended PW-3 decision package. This is not visitor research, not Production evidence, not legal approval, not final homepage copy, and not implementation or publication authorization. See §29.

The public value story is governed by `PW2-VIS-001`: the owner/operator of a small business who wants to organize **customers, work, responsibilities, and progress** clearly. Course Sellers / coaches (`PW2-VIS-002`) is the leading evidenced relevance context, not co-primary, and must not define the brand, imply an LMS, or imply a complete current-SHA Production edition. Model A remains binding. Model B and Model C remain rejected alternatives.

**Public positioning direction (owner-frozen):** `OPERATIONAL CLARITY FOR SMALL-BUSINESS OPERATORS`.

**Intended category:** Business Operating System (`PW1-CLM-002`, ALLOW WITH QUALIFIER). It is a governed product-intent label, not live UI copy and not a technical computer OS. Plain-language meaning for operators: a product for organizing and operating business work — customers, work, responsibilities, and progress — under human control. BOS is **not** a mandatory hero slogan or standalone Layer A message (`PW3-OD-001` `RESOLVED — OWNER FROZEN`). First orientation must first explain, in plain language, which operational problem ZyntixAI helps organize. Public BOS mentions require context and qualifiers at Level 2 / Layer C.

**Leading message territory:** `PW3-TER-001 — OPERATIONAL CLARITY` (`PW3-OD-002` `RESOLVED — OWNER FROZEN`). Not co-leading with TER-002 or TER-003. Connected-workspace language may be supporting only and must not become an all-in-one claim. Later copy need not use the words “operational clarity” (`PW-6` formulates).

**Internal positioning basis (`PW3-POS-001`):**

`OWNER FROZEN — INTERNAL POSITIONING AUTHORITY — NOT PUBLICATION-READY COPY`

Binding owner direction (internal; not a hero; not homepage copy): ZyntixAI helps small-business operators bring customers, work, responsibilities, and progress together clearly. It is developing as a Business Operating System for daily operations: human-operated, broader than a chatbot, and currently inside a closed beta. “Developing” is category intent plus closed-beta maturity, not a present-tense complete OS or a coming-soon capability (`PW1-CLM-044`).

Formal internal statement (`PW3-POS-001`, selected, not publication-ready): For the owner/operator of a small business who needs a clear view of customers, work, responsibilities, and progress, ZyntixAI is intended as a Business Operating System that helps operators see what needs attention and keep work organized, because admitted operators can use a Today overview, tasks, attention, and operator records inside a closed-beta workspace. Unlike chatbot-only products or disconnected lists used in isolation, ZyntixAI is a human-operated operator product, not a generative chatbot and not generally available.

PW-6 must not publish this wording verbatim without copy review. It is not a final headline, subheadline, hero body, or publication-ready claim.

**AI role:** supporting, not Layer A or hero-hook (`PW3-OD-006` `RESOLVED — OWNER FROZEN`). The name ZyntixAI must not become a generative or autonomous promise. Layer A prevents chatbot-only identification by product-led framing, not by an AI slogan.

**Target groups:** Course Sellers is not in Level 1 (`PW3-OD-004`). A four-target-group comparison is not required on the homepage (`PW3-OD-005`). Conservative default: no four equal target-group cards.

**Homepage trust:** named technical controls only (`PW3-OD-009` homepage scope frozen). Separate legal/trust-page claims remain externally gated.

**Maturity:** last governed access is invite-only closed beta, not GA, not public self-registration. Sign in is utility for existing accounts. HOLD actions remain non-publishable. Exact beta phrasing (`PW3-OD-007`) and in-page vs separate exploration (`PW3-OD-008`) remain open.

**Still not frozen:** final headline, subheadline, hero body, navigation labels, CTA copy, section headings, full homepage copy, content order, page architecture, wireframes, visual design, public routes, implementation, or deployment.

```text
MODEL A                  = OWNER-FROZEN
POS-001 / TER-001        = OWNER-FROZEN INTERNAL STRATEGY — NOT PUBLIC COPY
BOS                      = LEVEL 2 / LAYER C; NOT MANDATORY LAYER-A HERO
COURSE SELLERS           = LEADING RELEVANCE, NOT BRAND-PRIMARY, NOT LMS
AI                       = SUPPORTING, NOT LAYER A
FOUR TG EDITIONS         ≠ EQUALLY AVAILABLE
HOMEPAGE TRUST           = NAMED CONTROLS ONLY
SIGN IN                  ≠ START / JOIN / EXPLORE
RELEVANCE                ≠ AVAILABILITY
FINAL PUBLIC COPY        = NOT FROZEN
```

No interviews, surveys, analytics, or usability tests were executed for PW-3. Problem and emotional-value statements that are not PW-1 facts are **MESSAGING HYPOTHESIS**.

This section is not marketing copy.

---

## 3. Governing Authorities

| Authority | What it binds in PW-3 |
| --- | --- |
| PW-0 | Public-web is a separate trajectory; visitor is unauthenticated; Home is not the public site; chatbot-first positioning is forbidden; four-TG availability is not auto-public; dual-use `/` currently redirects logged-out visitors to `/login`. |
| PW-1 | Maximum public-truth boundary. PW-3 may narrow approved wording. PW-3 may not broaden ALLOW or convert HOLD/PROHIBIT to ALLOW. Every factual message maps to claim IDs. |
| PW-2 | Visitor model, comprehension layers A–D, CTA hierarchy, risks, remaining open decisions. Model A is owner-frozen. `PW2-OD-002`–`013` remain open. |
| B1-GATE.1 | AND-logic completion. Documentation-only phases do not require browser/production gates when no user-visible product change ships. Publication (commit/push) is **not** authorized here. |
| Authenticated Home | `/home` remains closed. Public messaging must not send visitors into Home as if it were a marketing page (`PW1-PRH-017`). |

**Consumed unchanged from PW-1 §9:** Sign in ALLOW WITH QUALIFIER; Create account / Register / Start free / Start trial / Connect AI provider PROHIBIT; Request beta / waitlist / contact / view product / demo HOLD.

---

## 4. Evidence and Hypothesis Model

Every strategic statement uses exactly one class.

| Class | Meaning | Binding effect |
| --- | --- | --- |
| **PRODUCT FACT** | Supported by PW-1 ALLOW or ALLOW WITH QUALIFIER. | Binding as current product truth, with the claim’s qualifier. |
| **OWNER-FROZEN STRATEGY** | Explicit owner decision already recorded. | Binding until a formal owner change. Currently: `PW2-OD-001` Model A; `PW3-OD-001`–`006`; homepage-scope `PW3-OD-009`. |
| **GOVERNED PRODUCT INTENT** | Supported by PW-0/PW-1 intended category or scope freeze, not by visitor research. | Binding as direction; public wording still needs PW-1 qualifiers and later copy freeze. |
| **MESSAGING HYPOTHESIS** | Reasonable message-design assumption. Not observed visitor behavior. | Designable for later validation. Must not be written as research. |
| **UNSUPPORTED** | Inadequate evidence. | Must not enter approved messaging. |

**Rules**

1. Product facts require PW-1 claim IDs.
2. The primary audience is owner-frozen through `PW2-OD-001`, not through visitor research. Positioning strategy OD-001–006 and homepage-scope OD-009 are owner-frozen through explicit owner approval of the recommended package, not through research or Production evidence.
3. Product intent may guide category and value direction; it cannot become an availability claim.
4. Messaging hypotheses require later validation (`PW3-VAL-*`).
5. Unsupported statements cannot enter approved messaging.
6. HOLD and PROHIBIT PW-1 rows do not become approved public promises.
7. No item in this document is publication-ready copy. Owner-frozen strategy is not a copy freeze.

No user research was conducted in PW-3.

---

## 5. Audience Foundation

| Visitor | Role | Status | Messaging consequence |
| --- | --- | --- | --- |
| `PW2-VIS-001` | First-time small-business owner/operator | PRIMARY; brand-primary; OWNER-FROZEN STRATEGY | Governs the first public value story. Must understand operational organization. Must not receive “works for everyone” (`PW1-PRH-002`). |
| `PW2-VIS-002` | Course seller / coach | SECONDARY; leading relevance context | Not Level 1 / not brand definition (`PW3-OD-004` owner-frozen). If CS later appears on the homepage, it is the leading evidenced relevance context. Not LMS (`PW1-CLM-071`). Not complete current-SHA edition (`PW1-PRH-022`). Whether a CS example is used at all remains a later IA/copy choice inside those bounds (`PW2-OD-002`). |
| `PW2-VIS-003`–`005`, `012` | Agencies, Field, E-commerce, unsupported contexts | DEFERRED | Mention only inside PW-1 thin-slice qualifiers, or omit. |
| `PW2-VIS-007` | Existing account holder | UTILITY | Sign in only. Not the acquisition story. |
| `PW2-VIS-006`, `008`, `009`, `013` | Invitee, beta-interested, diligence, trust | SECONDARY | Need honest status, safe stop, and narrow trust. No invented intake. |
| `PW2-VIS-010`, `011`, `014` | Commercial-intent, chatbot-expecter, accidental | OUT OF SCOPE as conversion targets | Honest non-offers and corrective comprehension still required. |

Model B (Course Sellers primary) and Model C (co-primary) remain **rejected alternatives**, not active options.

**Public addressing rule.** `operator` is the internal audience and product term for VIS-001. Public copy may say small-business owner, business owner, or you. Visitors do not have to call themselves “operator” for the positioning to fit. PW-6 must not require that self-label as a comprehension test.

---

## 6. Category Strategy

### 6.1 Role of “Business Operating System”

| Question | Decision in this framework |
| --- | --- |
| Is it the primary category descriptor? | **Yes, as intended category** (`PW1-CLM-002`). GOVERNED PRODUCT INTENT. |
| Where should it appear? | **Level 2 / Layer C** (`PW3-OD-001` `RESOLVED — OWNER FROZEN`). Not a mandatory five-second slogan or standalone Layer A message. |
| Plain-language companion | A product for small-business owners to organize customers, work, responsibilities, and progress. |
| Credibility at current maturity | Always paired with closed-beta / not-GA and human-operated limits. Do not use BOS to imply completeness. |

**Owner freeze (`PW3-OD-001`).** “Business Operating System” is not required as a hero slogan or standalone Layer A message. First orientation must first explain, in plain language, which operational problem ZyntixAI helps organize. Every public BOS mention requires context and qualifiers. This narrows `PW1-RQ-003` for PW-3 strategy; it does not freeze a headline.

**Qualifier-load warning (R1).** BOS is only safe with intended / not-GA / not-all-in-one / not-autonomous / not-technical-OS qualifiers. That load is a material messaging risk (`PW3-RSK-024`), not a reason to reverse OD-001. Downstream copy should therefore keep BOS at Level 2 / Layer C and lead with the operational problem. If a later sentence cannot carry those qualifiers without becoming unreadable, omit the BOS label in that sentence; do not drop the qualifiers.

### 6.2 What “Business Operating System” must not mean

- a computer operating system;
- complete software for every business process;
- replacement for every business tool;
- autonomous AI controlling the company;
- every target-group edition being available;
- general availability;
- enterprise completeness.

### 6.3 Category-definition contract

| Category element | Strategic role | Plain-language meaning | Evidence/authority | Mandatory qualifier | Prohibited implication | Validation need |
| --- | --- | --- | --- | --- | --- | --- |
| ZyntixAI | Identity | The product name | `PW1-CLM-001` ALLOW | None for the name | A different public brand; name proves a marketing site exists | `PW2-CMP-001`; `PW3-VAL-001` |
| Business Operating System | Intended category | Product for operating business work, not a computer OS | `PW1-CLM-002`; PW-0 §3 | Intended; not GA; not all-in-one; not autonomous; not live UI copy | Technical OS; complete OS for every business; the OS runs itself | `PW2-CMP-002`; `PW3-VAL-002` |
| Daily business work | Five-second purpose | Helps a small-business owner organize customers, work, responsibilities, and progress | OWNER-FROZEN STRATEGY (`PW2-OD-001`) + `PW1-CLM-002`, `003`, `018` | Human-operated; not chatbot-only; customer records as product capability are CS-qualified | Guaranteed results; “runs the company”; public CRM for every business | `PW2-CMP-003`; `PW3-VAL-003` |
| Broader than a chatbot | Recognition outcome | Not only an AI chatbot | `PW1-CLM-003`; `PW1-PRH-016` | Rule-based Home/NBA; no generative provider | “No AI ever”; “AI runs the company”; chatbot SKU | `PW2-CMP-004`; `PW3-VAL-004` |
| Closed-beta operator product | Maturity frame for the category | Invite-only closed beta, not a public launch | `PW1-CLM-007`, `008` | Last governed policy; not live-flag re-probe | GA; limited-seats scarcity | `PW2-CMP-006`; `PW3-VAL-008` |

**Technical vs business meaning.** In public language, “operating system” means a way of running the business’s work, not Windows/Linux, not a kernel, and not software that operates itself.

**Avoiding all-in-one.** Use specific operator objects (customers, work, attention, progress). Do not say “everything in one place,” “replace all your tools,” or “complete platform” (`PW1-PRH-003`).

No final hero line is frozen.

---

## 7. Core Problem Architecture

Problem themes are **MESSAGING HYPOTHESIS** unless a PW-1 fact is cited. They are not researched prevalence claims. They do not quantify loss.

| Problem ID | Problem hypothesis | Evidence class | Audience relevance | Product connection | Claim boundaries | Messaging risk | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW3-PRB-001 | Customer and work information is fragmented across tools and messages | MESSAGING HYPOTHESIS | VIS-001 problem language; CS as relevance (VIS-002) | CS operator CRM/leads/customers exist with qualifiers (`PW1-CLM-015`); shared core (`PW1-CLM-062`). CS CRM is **relevance-context evidence**, not proof of a general-operator public CRM. | Not a public CRM for every business; not current-SHA CS Production (`PW1-PRH-022`) | “All-in-one CRM”; four-TG CRM; treating CS CRM as VIS-001 product fact | **USE** as hypothesis; do not claim all businesses have this; do not present CS CRM as general-operator capability |
| PW3-PRB-002 | Responsibilities are unclear, so work does not have an obvious owner | MESSAGING HYPOTHESIS | VIS-001 | Members admin exists for admitted orgs (`PW1-CLM-017`); tasks exist (`PW1-CLM-070`) | Closed-beta; not public team signup | “Effortless assignment”; guaranteed accountability | **USE** as hypothesis |
| PW3-PRB-003 | Work is spread across disconnected lists, chats, and inboxes | MESSAGING HYPOTHESIS | VIS-001 | Tasks, Attention, Home Today (`PW1-CLM-018`, `070`) | Not a communications suite; not a document OS (`PW1-CLM-068`) | “Replaces Slack/email/spreadsheets” | **USE** as hypothesis; compare approaches, not named competitors |
| PW3-PRB-004 | It is hard to see what needs attention now and what has progressed | MESSAGING HYPOTHESIS | VIS-001 | Today brief from Attention + assigned tasks (`PW1-CLM-018`); Attention/NBA rule-based (`PW1-CLM-027`) | Not AI ranking; not generative; not autonomous. “Calm” is not part of this problem; it lives in `PW3-VP-004`. | AI command center; guaranteed next action; proven calm | **USE** as hypothesis |
| PW3-PRB-005 | It is hard to keep a consistent operating process as the business grows | MESSAGING HYPOTHESIS | VIS-001; extensible later TGs | Shared core and context model (`PW1-CLM-062`, `069`) | Four contexts are not equally available (`PW1-PRH-001`) | “Works for every business”; complete OS | **USE** narrowly; process language must not imply GA or four live editions |

**Separated layers**

| Layer | Content |
| --- | --- |
| Problem hypothesis | Small-business owners need clearer organization of customers, work, responsibilities, and progress. “Operator” is the internal term. |
| Verified product capability | Admitted users can use Home Today, tasks, and attention with qualifiers. Leads/customers/programs are CS-qualified (`PW1-CLM-015`, `016`), not a general public CRM. |
| Desired value | A clearer operating view of what needs attention. Emotional calm is a hypothesis (`PW3-VP-004`), not a proven outcome. |

Do not claim ZyntixAI eliminates every tool. Do not claim proven time, cost, growth, or revenue outcomes (`PW1-CLM-067`).

---

## 8. Value-Proposition Architecture

Value IDs use `PW3-VP-*` so they remain unique from the validation plan (`PW3-VAL-*`).

| Value ID | Value layer | Proposition | Audience need | Supporting PW-1 claims | Evidence class | Required qualifier | Prohibited overstatement | Validation method |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW3-VP-001 | Functional | Helps admitted users see today’s work, tasks, and attention inside the product | VIS-001 need to understand operational organization | `PW1-CLM-018`, `070` | PRODUCT FACT with qualifier | Closed beta; Home Today is Production-verified; Tasks/Attention are release-verified, not current-SHA Production from Home alone | “Complete operating suite now”; public CRM for every business; LMS; four live editions | `PW3-VAL-003` |
| PW3-VP-002 | Operational | Connected records and workflows can make the operating picture more coherent than isolated lists | VIS-001 / PRB-001, 003 | `PW1-CLM-018`, `062`, `070` | GOVERNED PRODUCT INTENT + PRODUCT FACT | Shared core ≠ four complete editions; not replacement for every tool | All-in-one; “one tool for everything” | `PW3-VAL-003`; `PW3-VAL-011` |
| PW3-VP-003 | Decision | Attention, status, and a Today overview help the visitor see what to handle next | VIS-001 / PRB-004 | `PW1-CLM-018`, `027`, `070` | PRODUCT FACT with qualifier | Rule-based next actions; human-operated; not guaranteed recommendations | Autonomous decisions; “AI tells you exactly what to do” | `PW3-VAL-005` |
| PW3-VP-004 | Emotional | Intended sense of calm control from a clear operating view | VIS-001 | GOVERNED PRODUCT INTENT + MESSAGING HYPOTHESIS | Must stay hypothetical; no research claimed | “Feel in control”; guaranteed calm; premium exclusivity | `PW3-VAL-010` |
| PW3-VP-005 | Functional, CS-qualified | Admitted Course Seller operators can work with leads, customers, programs, enrollments, and progress | VIS-002 relevance; not VIS-001 brand-primary proof | `PW1-CLM-015`, `016` | PRODUCT FACT with qualifier | Only if CS context is shown; release-verified; not current-SHA Production; not LMS; not public CRM | CS = the brand; public catalog; complete CS edition | `PW3-VAL-007`; `PW3-VAL-015` |

Emotional value (`PW3-VP-004`) is a **MESSAGING HYPOTHESIS**. Do not claim guaranteed efficiency, time savings, growth, revenue, or reduced costs. `PW3-VP-005` must not leak into Layer A as the brand-primary functional promise.

---

## 9. Internal Positioning Statement

Internal framework statements only. Not homepage copy. No named competitors. No superiority claim.

### PW3-POS-001 — SELECTED (OWNER FROZEN)

> For the owner/operator of a small business who needs a clear view of customers, work, responsibilities, and progress, ZyntixAI is intended as a Business Operating System that helps operators see what needs attention and keep work organized, because admitted operators can use a Today overview, tasks, attention, and operator records inside a closed-beta workspace. Unlike chatbot-only products or disconnected lists used in isolation, ZyntixAI is a human-operated operator product, not a generative chatbot and not generally available.

| Field | Value |
| --- | --- |
| Status | `OWNER FROZEN — INTERNAL POSITIONING AUTHORITY — NOT PUBLICATION-READY COPY` (`PW3-OD-003`) |
| Evidence class | OWNER-FROZEN STRATEGY (audience + POS-001) + GOVERNED PRODUCT INTENT (BOS) + PRODUCT FACT (Today/tasks/attention, closed beta, not chatbot) |
| Mechanism claims | `PW1-CLM-002`, `003`, `007`, `008`, `013`, `018`, `027`, `070` |
| Mechanism-clause decomposition (R1) | The frozen “because” clause mixes evidence tiers. PW-6 must decompose, not copy as a complete suite: Home Today = Production-verified (`PW1-CLM-018`); Tasks/Attention = release-verified (`PW1-CLM-070`); “operator records” is not a general public CRM. Customer/program records are CS-qualified (`PW1-CLM-015`, `016`) and belong to relevance context, not Layer A brand proof. |
| Public addressing | Internal statement may say owner/operator. Public copy need not use “operator” as a self-label. |
| Trade-off | Strongest VIS-001 fit; lowest LMS and all-in-one risk; requires later copy to stay concrete without becoming a feature dump |
| Public-copy status | Not a hero, not final homepage copy, not publication-ready. PW-6 may not publish this wording verbatim without copy review. |

### PW3-POS-002 — ALTERNATIVE (NOT SELECTED)

> For the owner/operator of a small business whose customer, work, and progress information is split across tools, ZyntixAI is intended as a Business Operating System that brings those operating objects into one governed workspace, because the product uses a shared operator core and a Today overview rather than a chatbot as the home. Unlike using separate lists and chat tools as the system of record, ZyntixAI is built as an operator workspace in closed beta.

| Field | Value |
| --- | --- |
| Status | ALTERNATIVE — **not selected**. Not co-leading with POS-001. |
| Trade-off | Stronger “connected workspace” story (Territory B). Higher risk of vague all-in-one (`PW1-PRH-003`; `PW2-RSK-019`). |
| Use | Supporting connected-workspace language only if it does not become an all-in-one claim (`PW3-OD-002`). |

### PW3-POS-003 — REJECTED

> For course sellers and coaches, ZyntixAI is the course-business operating system / AI course platform.

| Field | Value |
| --- | --- |
| Status | REJECTED |
| Why | Restores Model B. Makes CS the brand. Implies LMS/course platform (`PW1-CLM-071`; `PW1-PRH-016` adjacent). Conflicts with `PW2-OD-001`. |

**Strategic prototypes for recognition (NOT PUBLICATION-READY; not a frozen hero):**

- Prototype A: Name + daily business work, without saying “Business Operating System” in the first line. Aligns with `PW3-OD-001`.
- Prototype B: Name + “not only a chatbot” as a **recognition outcome after** the operational problem, still product-led, not an AI slogan. Aligns with `PW3-OD-006`. Do not make “not a chatbot” the identity.
- Prototype C: Name + BOS in the first line — **not permitted as a required Layer A / hero slogan** after `PW3-OD-001`. BOS may appear later at Level 2 / Layer C with qualifiers.

PW-6 may later write sentences from `PW3-MSG-*`. It may not publish these prototypes as-is.

---

## 10. Message Territories

| Territory ID | Label | Focus | Evidence class |
| --- | --- | --- | --- |
| PW3-TER-001 | Operational clarity | Understand what is happening in the business; know what needs attention; connect customers, work, ownership, and progress | **SELECTED — OWNER FROZEN** (`PW3-OD-002`). Leading territory. Not co-leading. |
| PW3-TER-002 | Connected business workspace | Bring customers, work, and progress into one coherent environment | **Evaluated alternative.** Higher all-in-one risk. Supporting language only; not co-leading. |
| PW3-TER-003 | Governed way of working | Clear workflows, context, ownership, and controlled next steps | **Evaluated alternative.** Weaker first-impression direction. Not co-leading. |

### 10.1 Scoring

Scoring below is **historical evaluation evidence** from the PW-3 establishment pass. It is not a present-tense recommendation contest. `PW3-OD-002` later owner-froze TER-001.

Scoring: **Pass / Caution / Fail**. Mandatory criteria cannot be Caution as a recommended default.

| Criterion | Priority | TER-001 Operational clarity | TER-002 Connected workspace | TER-003 Governed way of working |
| --- | --- | --- | --- | --- |
| Primary-audience clarity | High | **Pass** — maps to VIS-001 objects | Caution — “workspace” can feel generic | Caution — “governed” is abstract for first visit |
| PW-1 truth safety | Mandatory | **Pass** | Caution — needs heavy anti-all-in-one qualifiers | **Pass** if “governed” stays non-legal |
| Five-second comprehension | High | **Pass** | Caution | Fail as first story without a plainer companion |
| Non-chatbot differentiation | High | **Pass** (product-led) | **Pass** | Caution if “controlled next steps” sounds like AI |
| Current product evidence | Mandatory | **Pass** (`PW1-CLM-018`, `070`) | Caution if “one environment” overreaches TG evidence | **Pass** for fail-closed/human-operated, not for process-maturity claims |
| Multi-context extensibility | High | **Pass** | **Pass** | **Pass** |
| Premium credibility | High | **Pass** if calm and concrete | Caution — can sound like a suite promise | **Pass** if not exclusive |
| Vague all-in-one risk | High | **Pass** (lowest) | Caution | Caution if “way of working” = complete OS |
| Overstated availability | Mandatory | **Pass** | **Pass** only with beta/TG qualifiers | **Pass** only with beta qualifiers |
| Mobile message simplicity | High | **Pass** | Caution | Caution |
| Accessibility / plain language | High | **Pass** | Caution | Caution (“governed”, “context”) |

### 10.2 Owner selection

**Leading territory:** `PW3-TER-001 — OPERATIONAL CLARITY` (`PW3-OD-002` `RESOLVED — OWNER FROZEN`).

**Product meaning of “clarity” (R1, binding).** Operational clarity is not a visual style, empty calm, or generic professionalism. It means a visitor can name: what is happening with customers and work; who owns it; what progressed; and what needs attention next. Later copy may use other words, but the meaning must stay those objects. Empty “clarity” is `PW3-RSK-019`.

It is the selected match to Model A, Layer A, and current Home/Attention/Tasks evidence. Later copy need not use the words “operational clarity.” TER-002 may supply Level 2/3 supporting language if tightly qualified and must not become an all-in-one claim. TER-003 may supply later trust/process language, not the first impression. Neither TER-002 nor TER-003 is co-leading.

### 10.3 R1 independent territory re-score

Scale: **Strong / Adequate / Weak** for fit (higher is better). Risk rows: **Low / Medium / High** (lower is safer). This re-score does not reopen `PW3-OD-002`. It tests whether TER-001 remains the best frozen choice.

| Criterion | TER-001 | TER-002 | TER-003 |
| --- | --- | --- | --- |
| Fit with VIS-001 | **Strong** — daily customers, work, ownership, progress | Adequate — “workspace” is less first-visit concrete | Weak — “governed” is abstract |
| Five-second clarity | **Strong** if bound to those objects | Adequate | Weak as first story |
| PW-1 truth fit | **Strong** — Home/Tasks/Attention | Medium all-in-one pressure | **Strong** if non-legal |
| Differentiation usefulness | **Adequate → Strong** once clarity names objects | Adequate | Weak for first impression |
| All-in-one risk | **Low** | **High** | Medium |
| Chatbot-capture risk | **Low** if product-led | Low | Medium if “controlled next steps” sounds like AI |
| Target-group distortion risk | **Low** | Medium if “one environment” lists four editions | Medium |
| Closed-beta credibility | **Strong** | Adequate with qualifiers | Adequate |
| Mobile-message viability | **Strong** | Medium | Weak |
| Downstream copy usefulness | **Strong** for PW-4/PW-5/PW-6 | Supporting only | Later trust/process only |

**R1 confirmation.** TER-001 remains the best match. TER-002 and TER-003 stay non-co-leading. No owner change is required or made.

---

## 11. Messaging Hierarchy

Not webpage sections. Later IA must not reorder these into a false availability story.

| Message level | Visitor question | Required message | PW-1 claim IDs | PW-2 comprehension IDs | Qualifier | Risk prevented | Later destination |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 — Recognition | What is this called, and is it for daily business work? | ZyntixAI; daily operating work (customers, work, responsibilities, progress as problem language); broader than a chatbot as a recognition **outcome**, not the identity slogan | `PW1-CLM-001`, `003` | `PW2-CMP-001`, `003`, `004`; `PW2-Q-001`, `002` | No BOS required here; no AI slogan; no “not a chatbot” as the lead identity | Chatbot SKU; generic brand; identity-by-denial | Layer A; PW-5/PW-6 |
| 2 — Category and value | What kind of product, and what does it help organize? | Intended BOS in plain language after operational-problem orientation; operational clarity as named objects; connected business context without all-in-one | `PW1-CLM-002`, `018` | `PW2-CMP-002`, `003` | Intended; not GA; not complete OS; BOS not a Layer A slogan (`PW3-OD-001`) | Technical OS; all-in-one; autonomy | Layer C |
| 3 — Product mechanism | How does it help organize work? | Customers, work, responsibilities, progress, attention, workflows, organization workspace — only as evidenced | `PW1-CLM-013`, `015`, `018`, `062`, `070` | `PW2-Q-003`, `004` | Closed beta; CS vs general-operator wording; no LMS | Feature dump; current-SHA complete CS | Layer C after status |
| 4 — Relevance contexts | Is it for a business like mine? | CS as leading evidence context if TGs appear; not Level 1; four-TG comparison not required | `PW1-CLM-015`, `016`, `020`–`023`, `055`, `071`; `PW1-PRH-001` | `PW2-CMP-008`, `009`; `PW2-Q-005`–`007` | Relevance ≠ availability; no four equal live editions (`PW3-OD-004`, `005`) | CS as brand; LMS; four live editions | Optional Level 4; PW-4/PW-5 may later place limited context references inside PW-1 |
| 5 — Trust and maturity | Can I take this seriously, and can I use it now? | Controlled closed beta; access limits; named controls only; honest maturity | `PW1-CLM-007`, `008`, `011`, `032`–`034` | `PW2-CMP-006`; `PW2-Q-013`, `014`, `016` | No certifications; no traction; no scarcity theater | Fake proof; exclusivity marketing | Layer B then C/D |
| 6 — Action | What may I do? | Exploration vs Sign in vs unavailable acquisition | `PW1-CLM-009`, `010`, `045`–`053` | `PW2-CMP-007`; `PW2-Q-017`, `025` | Sign in = existing accounts; HOLD not live | Sign in as Start; dead HOLD buttons | Utility Sign in; explained safe stop |

Level 1 must not carry every qualifier. Closed-beta status is Level 5 / Layer B, not a fifth five-second sentence. Level 1 must lead with the operational problem, not with a chatbot denial. Broader-than-chatbot remains a Layer A **recognition outcome** (`PW2-CMP-004`), not the brand story.

---

## 12. Message Pillars

Four pillars. AI is not the lead pillar. A bounded supporting-intelligence pillar exists so the brand name and NBA facts are governed rather than implied.

| Pillar ID | Pillar | Audience value | Product mechanism | Proof basis | Allowed message boundary | Mandatory qualifier | Prohibited implication | Later content need |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW3-PIL-001 | Visible work and next attention | Know what is happening today and what needs attention next | Today brief; Attention; tasks | `PW1-CLM-018`, `070`, `027` | Overview of work and attention; this is the **substance** of TER-001, not a restatement of the territory name | Human-operated; not AI ranking; Home Production ≠ complete Tasks/Attention current-SHA proof | Autonomous OS; guaranteed decisions; empty “clarity” | PW-5 mechanism copy after status |
| PW3-PIL-002 | Connected business context | Keep related customers, work, and progress together rather than only isolated lists | Shared core; org workspace; CS operator records only if CS is shown | `PW1-CLM-013`, `015`, `016`, `062` | Supporting to TER-001. Operator objects that exist in evidence. Connection ≠ completeness. | Closed beta; CS not the whole brand; not all-in-one; not “one tool for everything” | Replace all tools; four complete editions; complete platform | PW-5; TG treatment if shown |
| PW3-PIL-003 | Attention and progress | See progress and next work without treating chat as the system of record | Tasks, progress (CS programs), Attention queues | `PW1-CLM-016`, `018`, `070` | Progress as operator records, not learner LMS. CS progress only if CS is shown. | CS programs ≠ public catalog | LMS; “students take courses here” | PW-6 if CS appears |
| PW3-PIL-004 | Supporting intelligence, not autonomous AI | Honest later answer to the name “ZyntixAI”, without inventing AI SKUs | Rule-based NBA; no Home AI ranking; no LLM dependency | `PW1-CLM-003`, `027`, `028`, `054`; `PW1-PRH-004`, `005`, `016` | Supporting, non-generative, human-operated. Name the mechanism (rule-based next actions), not a vague “intelligence”. | If AI is mentioned, explicit limitation; **not Layer A** (`PW3-OD-006` frozen) | Generative AI; any-provider; AI runs the business; chatbot-first identity | Layer C only if AI is mentioned |

No “automation” pillar. Social execution is gated/resting OFF (`PW1-CLM-025`) and is not a public pillar.

---

## 13. Differentiation Framework

Distinctions are messaging positions, not proven competitive benchmarks. No named competitors. No price, ease, security, or performance superiority.

| Differentiation ID | Alternative approach | Visitor problem | ZyntixAI distinction | Evidence | Classification | Safe wording boundary | Prohibited comparison |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW3-DIF-001 | Disconnected tools and spreadsheets | Fragmented operating picture | Product that can hold tasks and a Today overview together; customer records only where evidenced | `PW1-CLM-018`, `070`; CS customers `PW1-CLM-015` if CS shown | evidenced (Today/tasks); CS customers CS-qualified; general “customers together” is strategically inferred | “Built for daily business work, not only a spreadsheet habit” | “Better than Excel”; replaces all tools |
| PW3-DIF-002 | Communication-only work | Chat is used as the system of record | Work and attention live as records and a Today overview, not as a chatbot thread | `PW1-CLM-003`, `018` | evidenced | Broader than chat as recognition outcome, not the whole identity | “Replaces email/Slack” |
| PW3-DIF-003 | Generic task lists | Tasks without customer/work context | Tasks sit with attention and, where evidenced, customer/work records | `PW1-CLM-018`, `070` | evidenced for tasks/attention; customer context is CS-qualified or hypothesis | Not a complete PSA | “Best project tool”; complete agency suite |
| PW3-DIF-004 | Chatbot-only AI experiences | Visitor thinks ZyntixAI is a chatbot | Not only a chatbot; Home is a Today brief; NBA is rule-based | `PW1-CLM-003`, `027`, `054`; `PW1-PRH-016` | evidenced | Product-led, not an AI launch. Must not become the entire brand story. | Smarter than ChatGPT; generative advantage |
| PW3-DIF-005 | Vertical systems that cover one isolated workflow | One workflow, no shared operating picture | Intended BOS direction with a shared core; CS is one evidenced context, not the whole brand | `PW1-CLM-002`, `062`; Model A | strategically inferred (category intent); CS evidenced as relevance | Extensible direction ≠ current four live editions. Verticals are not called inferior. | “Unlike course platforms”; LMS comparison as identity |
| PW3-DIF-006 | Overly complex enterprise platforms | Too heavy for a small-business owner | Aimed at a small-business owner; closed-beta product | `PW2-OD-001`; `PW1-CLM-007` | strategically inferred (audience); not a proven simplicity benchmark | Audience and maturity, not “simpler than SAP” | Easier implementation; cheaper; enterprise-grade security; caricature of enterprise suites |

---

## 14. AI Positioning

### 14.1 Role

| Question | Framework answer |
| --- | --- |
| In the first message? | **No** (`PW3-OD-006` `RESOLVED — OWNER FROZEN`). Not a Layer A or hero-hook. Layer A is product-led. |
| In the category explanation? | Only as a limitation if AI is discussed. BOS must not be explained as an AI OS (`PW1-PRH-023`). |
| Supporting direction or current capability? | Current public fact: not only a chatbot; Home does not rank with AI; NBA is rule-based. Not a generative capability. Do not invent a future AI promise to justify the name. |
| Name risk | “ZyntixAI” can trigger chatbot expectation (`PW2-VIS-011`; `PW2-RSK-001`). Correct with daily-work framing, not with a bigger AI claim. |

### 14.2 AI messaging ladder

| Layer | Permitted treatment | Evidence | Required qualifier | Prohibited implication |
| --- | --- | --- | --- | --- |
| A — Five-second | Omit AI as a slogan. Prevent chatbot identification through daily work and non-chat hierarchy | `PW1-CLM-001`, `003`; `PW2-CMP-004` | None beyond product-led framing | “Meet your AI”; chatbot widget as hero |
| B — Initial orientation | Do not introduce AI as the reason to sign in | `PW1-CLM-045` | Sign in is utility | AI demo CTA |
| C — If AI is mentioned | Rule-based next actions; human-operated; not generative | `PW1-CLM-027`, `054` | Not generative; not autonomous; not guaranteed | AI-powered insights; AI daily briefing |
| D — Supporting | Explicit unavailability of provider connect / generative SKU if the question arises | `PW1-CLM-028`, `053` | Prohibited capability | Coming-soon provider grid |

**Explicitly prohibit:** generative AI without evidence; autonomous operation; AI running the business; guaranteed recommendations; any-provider connectivity; free or unlimited AI; invisible human-control assumptions; Brand Brain as live generative AI (`PW1-CLM-065`).

### 14.3 Name-honesty rule (R1)

The name contains “AI”. Later copy must not solve that only by listing what AI is not.

| Rule | Direction |
| --- | --- |
| First message | Product-led daily work. No AI slogan. No chatbot-widget hero. |
| Positive explanation | Work lives as records, tasks, attention, and a Today overview. That is the product. |
| If the visitor asks what the AI is | Supporting, rule-based next actions; human-operated; not generative. Cite `PW1-CLM-027`, `054`. |
| What not to do | Invent a generative SKU to justify the name. Leave “supporting intelligence” unexplained. Make “not a chatbot” the whole identity. |
| Remaining tension | The name can still outrun the evidenced AI. That is `PW3-RSK-023`. Do not close it with unsupported capability. |

---

## 15. Target-Group Messaging

| Context | Messaging role | Allowed relevance language | Mandatory status language | Prohibited implication | Earliest reconsideration trigger |
| --- | --- | --- | --- | --- | --- |
| Course Sellers / coaches | Leading evidenced relevance context; **not** brand-primary | Operator product for running courses/coaching; programs/enrollments/progress as operator tools | Invite-only historically; not LMS; Home Production does not prove complete CS edition | Public catalog; students take courses; complete current-SHA edition; CS = ZyntixAI | Current-SHA CS module Production FV (`PW1-RQ-013`); learner-delivery program (not expected) |
| Agencies / business services | Deferred thin-slice context | Thin workflow exists in-repository | Not Production-proven; not proven beta-eligible; not a complete agency suite | Client portal; billing; live agency edition | TG2 Production FV + admission |
| Construction / Field | Deferred thin-slice context | Thin field workflow; lightweight dispatch | Not Production-proven; **no GPS/routing**; not a live field suite | GPS; route optimization; mobile offline; live field edition | TG3 Production FV + admission |
| E-commerce / Fulfillment | Deferred operator-workflow context | Operator inventory/order/fulfillment language only | Not a live storefront; no checkout/payments/Stripe; not proven beta-eligible | Shop; checkout; Stripe; complete commerce edition | TG4 Production FV + payments authority |

### 15.1 Display decision (not a visual or card design)

| Option | Status after `PW3-OD-004` / `PW3-OD-005` |
| --- | --- |
| No target-group mention | Conservative homepage default. A four-target-group comparison is **not required**. |
| Course Sellers only | Allowed later as leading evidenced relevance context, **not** as brand definition, not required in Level 1 or the first five seconds. Not LMS; not public course marketplace; not complete current-SHA edition; not the only ZyntixAI audience. |
| Course Sellers plus future-context language | Allowed only as “other contexts are not live editions.” |
| All four with explicit unequal status | **Not required.** Do not show four equal target-group cards. TG2–TG4 must not be presented as fully available, Production-verified, or closed-beta-eligible. |

PW-4 and PW-5 may later decide whether limited context references are useful in the information architecture, but not beyond PW-1. Do not decide cards or page placement here.

**RELEVANCE ≠ AVAILABILITY.** Course Sellers may be the strongest evidenced relevance context and still not be a complete live edition. TG2–TG4 may be relevant as deferred thin slices and still not be available, Production-verified, or closed-beta-eligible. Do not use four equal homepage cards.

---

## 16. Maturity and Closed-Beta Messaging

| Topic | Required treatment |
| --- | --- |
| Controlled closed beta | ALLOW WITH QUALIFIER (`PW1-CLM-007`). Last governed Production policy. |
| Invite-only | Policy, not a sales countdown. No “limited spots.” |
| No public registration | Do not offer Register/Create account (`PW1-CLM-011`, `046`; `PW1-PRH-015`). |
| Not GA | PROHIBIT GA language (`PW1-CLM-008`). |
| Direction vs availability | Intended BOS and future TGs are direction. Current availability is closed beta + unequal TG readiness. |
| Release-verified vs Production-verified | CS operator modules are release-verified; Home is Production-verified at `d110b6e3…`; that does not prove the complete CS edition (`PW1-PRH-022`). |
| Unequal TG readiness | If TGs appear, availability is a separate text field (`PW2` §14.1). |

### Placement responsibilities

| Surface | Maturity job |
| --- | --- |
| Initial orientation (Layer B) | Closed beta vs GA; Sign in ≠ explore |
| Homepage (Layer C) | Direction ≠ availability; no price/trial/register |
| Target-group context | Per-TG status next to relevance |
| Action area | Sign in utility; explained safe stop; no HOLD buttons |
| Supporting detail | Release vs Production nuance; no legal conclusions |

Beta is not a substitute for trust. Do not use exclusivity, urgency, or scarcity theater (`PW2-RSK-020`). Closed beta is not a free offer, not a trial, not “join now,” and not a waitlist without a real public destination. Invite-only is the last governed admission policy, not a re-probed live registration flag (`PW1-CLM-007`, `011`; `PW1-RQ-002`).

---

## 17. Trust Messaging

Trust comes first from clarity, product realism, honest maturity, and consistent limitations — not from badges.

| Trust ID | Trust question | Factual control | PW-1 claim | Safe message boundary | Legal/technical review need | Prohibited wording |
| --- | --- | --- | --- | --- | --- | --- |
| PW3-TRU-001 | Can I tell this is a real product? | Closed-beta product exists; public marketing site does not yet | `PW1-CLM-005`, `007`, `009`, `014` | Working closed-beta product; `/` is not a marketing homepage | None for this fact | GA launch; vaporware; Home as public site |
| PW3-TRU-002 | Who can use it? | Signed-in access; existing accounts; invite-only historically | `PW1-CLM-010`, `032`, `045` | Product pages are for signed-in users | None | Bank-grade auth; SSO for all IdPs |
| PW3-TRU-003 | Is access scoped? | Org-aware workspace; fail-closed module navigation | `PW1-CLM-013`, `034`, `062` | Named controls; not a legal privacy policy | Technical review before expanding | Fully isolated guarantee; “perfect access control” |
| PW3-TRU-004 | How is Home data loaded? | User-scoped client, not service-role, for authenticated Home | `PW1-CLM-033` | Technical access pattern for Home only | Legal review before privacy-policy conclusions | AVG/GDPR compliant; data never leaves Europe |
| PW3-TRU-005 | Are you certified / fully secure? | No | `PW1-CLM-041`, `042`; `PW1-PRH-011`–`013` | Omit | Legal/security owner before any certification sentence | Fully secure; enterprise-grade; SOC 2; ISO; uptime/SLA |

**Do not allow:** “fully secure”; “enterprise-grade security”; “bank-level encryption”; AVG/GDPR conclusions; SOC 2 or ISO; guaranteed residency; uptime/SLA; fake testimonials; invented logos; user/customer counts; “trusted by.”

**Homepage trust (`PW3-OD-009` homepage scope):** `RESOLVED — OWNER FROZEN TO NAMED CONTROLS ONLY`. Homepage trust may rest only on accurately named, technically evidenced controls. No legal compliance conclusions, certifications, SLA/uptime, or absolute security claims.

**Separate legal/trust-page claims:** `OPEN — EXTERNAL LEGAL AUTHORITY REQUIRED`. This owner decision does **not** approve GDPR/AVG, SOC 2, ISO, or a public privacy/trust page. `PW2-OD-011` / `PW1-RQ-008` remain the external legal gate.

---

## 18. Voice and Tone

**Voice characteristics:** calm; clear; direct; competent; helpful; grounded; premium without sounding exclusive; modern without sounding futuristic; confident without absolute claims; understandable without SaaS jargon.

### Tone adjustments

| Situation | Tone |
| --- | --- |
| Primary positioning | Calm, concrete, daily-work-led |
| Product explanation | Specific objects (customers, work, attention); no feature fireworks |
| Beta status | Factual policy; no exclusivity marketing |
| Target-group status | Precise and unequal; never peppy “available now” for deferred slices |
| Trust/security | Narrow, technical-control language; no legal voice |
| Unavailable actions | Plain; omit the button; explain the stop |
| Safe-stop | Respectful, complete, non-apologetic theater |
| Errors or limitations | Direct; do not compensate with hype |

### Illustrative pairs (not final copy)

| Preferred tone | Rejected tone | Reason |
| --- | --- | --- |
| “ZyntixAI is a product for small-business owners who need a clearer view of customers, work, and progress.” | “The revolutionary AI OS for every ambitious business.” | Hype, autonomy, for-everyone |
| “Access is invite-only closed beta, not general availability.” | “Limited seats remaining — join the exclusive beta.” | Scarcity theater |
| “Course Sellers is one evidenced operator context, not a course platform for learners.” | “The all-in-one course platform.” | LMS + all-in-one |
| “People with an existing account can sign in.” | “Start now.” | Sign in as acquisition |
| “There is no public request form today.” | “Apply now” on a dead control | HOLD treated as live |

---

## 19. Terminology Governance

| Term | Class | Permitted meaning | Required qualifier | Risk | Prohibited use | Governing claim IDs |
| --- | --- | --- | --- | --- | --- | --- |
| ZyntixAI | APPROVED | Product name | None for the name | Chatbot expectation from “AI” | Other brand; name as GA proof; name as generative-AI proof | `PW1-CLM-001` |
| operator | APPROVED WITH DEFINITION OR QUALIFIER | Internal audience and product term for VIS-001 | Public copy may say small-business owner, business owner, or you. Visitors need not self-identify as “operator”. | Jargon; excluding owners who do not use the word | Requiring “operator” as the public salutation; “for every operator in every business” | `PW2-VIS-001`; `PW2-OD-001` |
| Business Operating System | APPROVED WITH DEFINITION OR QUALIFIER | Intended operator category | Intended; not technical OS; not autonomous; not complete; not GA; **not a mandatory Layer A / hero slogan** (`PW3-OD-001`) | All-in-one; autonomy; computer OS | “Complete OS for every business”; unexplained Layer A BOS | `PW1-CLM-002`; `PW1-PRH-003`, `023` |
| business platform | DISCOURAGED | Too vague | If used, immediately specify operating objects | All-in-one | Unqualified “platform”; “complete platform” | `PW1-PRH-003` |
| platform | DISCOURAGED | Completeness and suite expectation | Prefer product / workspace / named objects | All-in-one; complete platform | Unqualified platform identity | `PW1-PRH-003` |
| workspace | APPROVED WITH DEFINITION OR QUALIFIER | Admitted org workspace | Closed-beta; not public self-serve create | Public org create; all-in-one workspace | “Create a workspace on this site” | `PW1-CLM-013` |
| business workspace | APPROVED WITH DEFINITION OR QUALIFIER | Admitted org workspace | Closed-beta; not public self-serve create | Public org create | “Create a workspace on this site” | `PW1-CLM-013` |
| operating environment | DISCOURAGED | Sounds technical | Prefer operator work / workspace | Technical OS | Computer-environment claims | `PW1-CLM-002` |
| workflow | APPROVED WITH DEFINITION OR QUALIFIER | Evidenced operator workflow | Name the slice; unequal availability | Complete suite | GPS/storefront/complete PSA | `PW1-CLM-020`–`022` |
| context | APPROVED WITH DEFINITION OR QUALIFIER | Operating-model / TG context | Not public industry picker; V2 onboarding not Production-verified | Four live editions | Public “choose your industry” | `PW1-CLM-069` |
| attention | APPROVED | Operator attention queue / Today inputs | Rule-based; not AI ranking | AI command center | “AI attention engine” | `PW1-CLM-018`, `027` |
| progress | APPROVED WITH DEFINITION OR QUALIFIER | Operator progress records (e.g. CS programs) | Not learner LMS | LMS | Student course progress as public catalog | `PW1-CLM-016`, `071` |
| responsibility | APPROVED | Ownership of work / members in-product | Closed-beta member admin | Public team signup | Open invite-from-website | `PW1-CLM-017` |
| automation | DISCOURAGED | Easy to hear as autonomous or always-on social | If used, human-operated and gated | Autonomy; social-on | “Automate your business” | `PW1-CLM-025`; `PW1-PRH-004` |
| AI | APPROVED WITH DEFINITION OR QUALIFIER | Supporting, non-generative, rule-based where evidenced | Not Layer A / hero-hook (`PW3-OD-006`); if mentioned later, explicit limitation | Generative/autonomous | AI-powered; unlimited AI; AI as first message | `PW1-CLM-027`, `028`, `054` |
| intelligence | APPROVED WITH DEFINITION OR QUALIFIER | Supporting, rule-based next actions | Must name the mechanism; not predictive; not Layer A | Vague “smart”; hidden generative claim | “Predictive intelligence”; “business intelligence OS” | `PW1-CLM-027`; `PW1-PRH-004` |
| intelligent | DISCOURAGED | Inflated | Prefer specific mechanism | Hidden AI overclaim | “Intelligent OS” | `PW1-PRH-004` |
| assistant | DISCOURAGED | Chatbot frame | Avoid as identity | Chatbot SKU | “Your AI assistant” | `PW1-PRH-016` |
| all-in-one | PROHIBITED | n/a | n/a | Completeness | Any present-tense all-in-one | `PW1-PRH-003` |
| complete | DISCOURAGED | Completeness overclaim | Only to deny completeness | CS complete edition | “Complete CS edition”; complete suites | `PW1-PRH-022` |
| autonomous | PROHIBITED | n/a | n/a | Autonomy | Any autonomy claim | `PW1-PRH-004`, `023` |
| effortless | PROHIBITED | Outcome without evidence | n/a | Outcome claim | Effortless growth/setup | `PW1-CLM-067` |
| seamless | DISCOURAGED | Inflated | Avoid | Hidden completeness | Seamless all-in-one | `PW1-PRH-003` |
| revolutionary | PROHIBITED | Hype | n/a | Hype | Any use | (tone; `PW1-CLM-067`) |
| enterprise-grade | PROHIBITED | n/a | n/a | Trust overclaim | Security/completeness | `PW1-CLM-034`, `041` |
| secure | DISCOURAGED | Absolute security | Prefer named controls | Absolute security | “Fully secure” | `PW1-CLM-034` |
| compliant | PROHIBITED as legal conclusion | n/a | n/a | Legal overclaim | AVG/GDPR/SOC2 | `PW1-CLM-041`, `042` |
| free | PROHIBITED | n/a | n/a | Commercial falsehood | Free; free forever | `PW1-CLM-037`, `038` |
| trial | PROHIBITED | n/a | n/a | Commercial falsehood | Start trial | `PW1-CLM-038`, `052` |
| beta | APPROVED WITH DEFINITION OR QUALIFIER | Invite-only closed beta | Not GA; not scarcity | Exclusivity theater | Limited seats | `PW1-CLM-007` |
| invite-only | APPROVED WITH DEFINITION OR QUALIFIER | Last governed access policy | Not a live-flag re-probe claim | Treating historical policy as probed live flag | “Anyone can join” | `PW1-CLM-007`; `PW1-RQ-002` |
| available | APPROVED WITH DEFINITION OR QUALIFIER | Must attach whose availability | Unequal TG status | Four live editions | “Available for all businesses” | `PW1-PRH-001` |
| coming soon | DISCOURAGED | Looks like a CTA | Do not attach to PROHIBIT actions | Dead conversion | Coming-soon Register | `PW1-CLM-046`, `044` |
| for every business | PROHIBITED | n/a | n/a | Scope overclaim | Any use | `PW1-PRH-002` |
| replace all your tools | PROHIBITED | n/a | n/a | All-in-one | Any use | `PW1-PRH-003` |

Avoid internal engineering terms (RLS, AppShell, SHA, CTX pack, fail-closed) in visitor-facing copy unless a later trust page, after review, needs a named control in plain language.

---

## 20. Claim-to-Message Traceability Register

No row is publication-ready. Later PW-6 copy must cite these message IDs. HOLD/PROHIBIT claims are **not** approved messages.

| Message ID | Intended role | Strategic message | Visitor need | Source claims | Strategy authority | Evidence class | Required qualifier | Prohibited implication | Current readiness | Downstream owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW3-MSG-001 | Layer A identity | The product is named ZyntixAI | Name the product (`PW2-CMP-001`) | `PW1-CLM-001` | PW-0 identity | PRODUCT FACT | None for the name | Name proves a marketing site or GA | NOT PUBLICATION-READY | PW-6 |
| PW3-MSG-002 | Layer A purpose | It helps a small-business owner organize customers, work, responsibilities, and progress | Daily operating-work recognition (`PW2-CMP-003`; `PW2-VIS-001`) | `PW1-CLM-002`, `003`, `018` | `PW2-OD-001`; `PW3-OD-003`; TER-001 | OWNER-FROZEN STRATEGY + GOVERNED PRODUCT INTENT. Home Today is PRODUCT FACT; general customer records are **not** a general CRM fact. | Human-operated; not “every business”; customer records as capability are CS-qualified | Public CRM for every business; guaranteed results; chatbot identity | NOT PUBLICATION-READY | PW-6 |
| PW3-MSG-003 | Layer A recognition outcome | It is broader than only a chatbot | Correct chatbot-only expectation (`PW2-CMP-004`) | `PW1-CLM-003`; `PW1-PRH-016` | `PW3-OD-006` | PRODUCT FACT | Not a Production-verified slogan; not “no AI ever”; not the lead identity | Chatbot SKU; “no AI”; AI runs the company | NOT PUBLICATION-READY | PW-6 |
| PW3-MSG-004 | Layer C category | Intended category is a Business Operating System, explained in plain language | Category after the operational problem (`PW2-CMP-002`) | `PW1-CLM-002`; `PW1-PRH-023` | `PW3-OD-001` | GOVERNED PRODUCT INTENT | Intended; not technical OS; not all-in-one; not autonomous; not GA; not Layer A slogan | Computer OS; complete OS; market-proven category position | NOT PUBLICATION-READY | PW-6 |
| PW3-MSG-005 | Mechanism | Admitted users can see a Today overview from attention and assigned tasks | What it actually does (`PW2-Q-003`) | `PW1-CLM-018` | POS-001 mechanism | PRODUCT FACT | Authenticated closed-beta Home; not public Home; not AI ranking | AI daily briefing; public product tour of Home | NOT PUBLICATION-READY | PW-5 / PW-6 |
| PW3-MSG-006 | Mechanism | Admitted users can use tasks and attention in Beta-1 | What it can do today (`PW2-Q-004`) | `PW1-CLM-070` | POS-001 mechanism | PRODUCT FACT | Release-verified; pre-H1 SHA for those modules; not generative | Current-SHA complete Tasks/Attention edition; AI command center | NOT PUBLICATION-READY | PW-6 |
| PW3-MSG-007 | Relevance, if CS shown | Course Sellers is an operator context, not an LMS | CS relevance without brand capture (`PW2-CMP-008`) | `PW1-CLM-016`, `071`; `PW1-PRH-022` | `PW3-OD-004` | PRODUCT FACT | If CS is shown; not brand-primary; not complete current-SHA edition | CS = ZyntixAI; public catalog; students take courses | NOT PUBLICATION-READY | PW-5 / PW-6 |
| PW3-MSG-008 | Relevance / availability | Target-group contexts are not equally available live editions | Unequal readiness (`PW2-CMP-009`) | `PW1-CLM-006`, `020`–`022`, `055`; `PW1-PRH-001` | `PW3-OD-005` | PRODUCT FACT | If more than one TG is shown; RELEVANCE ≠ AVAILABILITY | Four equal live editions | NOT PUBLICATION-READY | PW-4 / PW-6 |
| PW3-MSG-009 | Layer B maturity | Access is invite-only closed beta, not general availability | Can I use it now (`PW2-CMP-006`) | `PW1-CLM-007`, `008`, `011` | `PW3-OD-007` still open for exact phrasing | PRODUCT FACT | Last governed policy; not live-flag certainty; not free; not trial; not scarcity | GA; open signup; limited seats; join now | NOT PUBLICATION-READY | PW-6 (phrasing still open) |
| PW3-MSG-010 | Action utility | Sign in is for existing accounts, not exploration or signup | Distinct from exploration (`PW2-CMP-007`) | `PW1-CLM-010`, `045` | PW-2 CTA map | PRODUCT FACT | Utility only | Sign in as Start/Join/Create account | NOT PUBLICATION-READY | PW-5 / PW-6 |
| PW3-MSG-011 | Commercial non-offer | There is no public price, trial, or self-serve registration offer | Commercial-intent honesty (`PW2-VIS-010`) | `PW1-CLM-037`, `038`, `046`, `052` | PW-1 PROHIBIT | PRODUCT FACT | PROHIBIT those CTAs | Free; trial; listed prices | NOT PUBLICATION-READY | PW-6 |
| PW3-MSG-012 | AI limitation, if mentioned | If AI is mentioned, next actions are rule-based and human-operated | Non-autonomous AI (`PW2-CMP-005`) | `PW1-CLM-027`, `054` | `PW3-OD-006` | PRODUCT FACT | Not generative; not autonomous; not Layer A | Generative AI; AI employee; autopilot | NOT PUBLICATION-READY | PW-6 |
| PW3-MSG-013 | Trust / safe stop | Product pages are for signed-in users; Home is not the public site | Diligence without fake proof (`PW2-Q-015`) | `PW1-CLM-014`, `032`; `PW1-PRH-017` | `PW3-OD-009` homepage scope | PRODUCT FACT | Not a public tour | Home as marketing site; bank-grade auth | NOT PUBLICATION-READY | PW-8 / PW-6 |
| PW3-MSG-014 | Action fallback | An explained safe stop is acceptable when no intake exists | Honest stop (`PW2-Q-025`) | `PW1-CLM-047`; `PW1-PRH-021` | `PW3-OD-008` still open for exploration architecture | PRODUCT FACT (no destination) | Do not invent a form | Waitlist; apply now; HOLD treated as live | NOT PUBLICATION-READY | PW-4 / PW-13 |
| PW3-MSG-015 | CS-qualified functional value | Admitted Course Seller operators can work with leads, customers, programs, enrollments, and progress | CS relevance (`PW2-VIS-002`) | `PW1-CLM-015`, `016` | `PW3-OD-004`; `PW3-VP-005` | PRODUCT FACT with qualifier | Only if CS is shown; release-verified; not current-SHA Production; not LMS | General-operator public CRM; CS brand capture | NOT PUBLICATION-READY | PW-6 |

HOLD/PROHIBIT claims are **not** approved messages. Beta-request, waitlist, contact, demo, view-product, and AI-provider-connect remain non-messages until destinations and PW-1 updates exist.

Validation status for all rows: **planned, not executed**. Copy use: **not publication-ready**. No row is `PUBLICATION READY`.

---

## 21. Message Risk Register

Likelihood and impact: **High / Medium / Low**. Severity is the combined messaging harm if later copy ignores the prevention rule. All High-severity rows block the named later phase, not PW-3-R1, unless they remain ungoverned.

| Risk ID | Trigger | Misleading interpretation | Affected visitor | Likelihood | Impact | Severity | Preventive rule | Detection gate | Owner | Blocking phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW3-RSK-001 | Unexplained “operating system” | Technical computer OS | VIS-001 | Medium | High | High | Plain-language companion; Level 2 not unexplained Layer A | `PW3-VAL-002` | PW-6 | PW-6 |
| PW3-RSK-002 | “Platform”, “everything”, “replace tools” | Complete all-in-one software | VIS-001 | Medium | High | High | `PW3-MSG-004`; prohibit all-in-one | `PW3-VAL-002` | PW-6 | PW-6 |
| PW3-RSK-003 | Name; AI-first visuals | ZyntixAI is a chatbot | VIS-001, 011 | High | High | High | Layer A product-led; `PW3-MSG-003` as outcome not identity | `PW3-VAL-004` | PW-6 | PW-6 / design freeze |
| PW3-RSK-004 | “AI” without limitation; AI as hero | Generative or autonomous AI | VIS-001, 011 | Medium | High | High | Ladder §14; **no AI in Layer A** | `PW3-VAL-005` | PW-6 | PW-6 |
| PW3-RSK-005 | Broad collage; “any business” | Works for everyone | VIS-001 | Medium | High | High | Model A; `PW1-PRH-002` | `PW3-VAL-006` | PW-6 | PW-6 |
| PW3-RSK-006 | CS in Layer A; course-platform identity | Course Sellers is the brand | VIS-001, 002 | Medium | High | High | CS not Level 1 (`PW3-OD-004`); Model A | `PW3-VAL-015` | PW-6 | PW-6 |
| PW3-RSK-007 | “Courses” without operator qualifier | LMS / student platform | VIS-002 | Medium | High | High | `PW3-MSG-007` | `PW3-VAL-007` | PW-6 | PW-6 |
| PW3-RSK-008 | Equal cards/badges | Four equal live editions | VIS-001–005 | Medium | High | High | No four equal cards (`PW3-OD-005`); RELEVANCE ≠ AVAILABILITY | `PW3-VAL-009` | PW-4 / PW-6 | PW-6 / PW-7 |
| PW3-RSK-009 | Feature lists without exclusions | Thin slices as complete editions | VIS-003–005 | Medium | High | High | Mandatory TG qualifiers | `PW2-VAL-008` | PW-6 | PW-6 |
| PW3-RSK-010 | “Limited seats”, countdown | Closed beta as exclusivity marketing | VIS-001, 008 | Medium | Medium | High | Policy language only; not free; not trial | Copy review | PW-6 | PW-6 |
| PW3-RSK-011 | Start/Join/Explore labels on Sign in | Sign in as acquisition | VIS-001, 007 | High | High | High | `PW3-MSG-010` | `PW3-VAL-014`; `PW2-VAL-002`, `003` | PW-5 / PW-6 | Design freeze |
| PW3-RSK-012 | Request/demo/contact buttons | HOLD CTA treated as live | VIS-008 | Medium | High | High | Omit; explained stop | `PW2-VAL-004` | PW-13 | PW-13 |
| PW3-RSK-013 | “Save time”, “grow revenue” | Outcome guarantees | VIS-001 | Medium | High | High | `PW1-CLM-067` | Copy review | PW-6 | PW-6 |
| PW3-RSK-014 | Counts, logos, testimonials, “trusted by” | Fake traction | VIS-009 | Medium | High | High | Trust §17 | Copy review | PW-6 | PW-6 |
| PW3-RSK-015 | Shield badges; “GDPR” | Named controls as legal compliance | VIS-013 | Medium | High | High | `PW3-TRU-004`, `005`; OD-009 homepage scope | Legal review | Legal owner | Trust page |
| PW3-RSK-016 | revolutionary, seamless, effortless | Inflated or exclusive premium | VIS-001 | Medium | Medium | High | Voice §18; terminology §19 | `PW3-VAL-010` | PW-6 | PW-6 |
| PW3-RSK-017 | All limits in Layer A | Defensive page; no positive product | VIS-001 | Medium | High | High | Layered model; Level 1 stays short and positive | `PW3-VAL-001`, `011` | PW-5 / PW-6 | PW-5 / PW-6 |
| PW3-RSK-018 | Accordion/reflow | Qualifier separated from claim on mobile | Mobile VIS-001 | Medium | High | High | Qualifiers attached (`PW2-RSK-022`) | `PW3-VAL-012` | PW-7 / PW-8 | PW-7 / PW-8 |
| PW3-RSK-019 | “Clarity” used as style or empty calm | Generic clarity with no product meaning | VIS-001 | Medium | High | High | TER-001 bound to customers, work, ownership, progress, next attention | `PW3-VAL-016` | PW-6 | PW-6 |
| PW3-RSK-020 | “Join”, “start”, missing invite-only | Closed beta interpreted as open signup | VIS-001, 008, 010 | Medium | High | High | `PW3-MSG-009`; no Register CTA | `PW3-VAL-008` | PW-6 | PW-6 |
| PW3-RSK-021 | Luxury, scarce, “exclusive club” | Premium interpreted as exclusivity | VIS-001, 008 | Medium | Medium | High | Premium = functional clarity, not scarcity | `PW3-VAL-010` | PW-6 | PW-6 |
| PW3-RSK-022 | Publishing POS-001 or §9 prototypes as headlines | Final copy created before PW-6 | VIS-001 | Medium | High | High | POS-001 is internal authority, not copy | Copy-freeze checklist | PW-6 | PW-6 |
| PW3-RSK-023 | Name “ZyntixAI” with only anti-AI denials | Name implies AI the copy never honestly explains, or invents generative AI | VIS-011 | High | High | High | §14.3 name-honesty; rule-based mechanism if AI is asked | `PW3-VAL-017` | PW-6 | PW-6 |
| PW3-RSK-024 | Unexplained or over-qualified BOS in Layer A | Category unusable, or technical/all-in-one OS | VIS-001 | Medium | High | High | Keep BOS at Level 2 / Layer C; omit the label rather than drop qualifiers. Do not reverse OD-001. | `PW3-VAL-002` | PW-6 | PW-6 |

Existing High-severity rows remain High. New rows 019–024 close previously missing material risks. No risk is treated as already validated.

---

## 22. Message Validation Plan

No tests in this plan were executed. Thresholds are **proposed, not achieved**.

| Validation ID | Hypothesis | Message tested | Participant | Method | Proposed success criterion | Failure condition | Required phase |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW3-VAL-001 | Layer A communicates name and daily business work | MSG-001, 002 | VIS-001 analogue | 5-second view + questions | Proposed: correct name + daily work. **Not achieved.** | Cannot name ZyntixAI or names only a chatbot | PW-9 / copy freeze |
| PW3-VAL-002 | BOS is understood as operator category, not technical OS or all-in-one | MSG-004 | VIS-001 analogue | Homepage comprehension | Proposed: no “computer OS” or “does everything now” | Technical OS or complete-suite report | PW-6 / PW-9 |
| PW3-VAL-003 | Operational value is understood | VP-001–003 | VIS-001 analogue | Task: “what does it help you do?” | Proposed: customers/work/attention/progress, not chat | Chat or guaranteed outcomes | PW-9 |
| PW3-VAL-004 | Non-chatbot understanding | MSG-003 | VIS-001, 011 | Direct question | Proposed: 0 chatbot-only answers in planned sample | Chatbot-only product | PW-9 |
| PW3-VAL-005 | Non-autonomous AI understanding | MSG-012 | VIS-011 analogue | “Does AI run this?” | Proposed: no generative/autonomous report | Yes / AI runs the company | PW-6 / PW-9 |
| PW3-VAL-006 | Primary-audience relevance | MSG-002 | VIS-001 analogue | “Is this for someone like you?” | Proposed: small-business owner relevance without “every business” and without requiring the self-label “operator” | For everyone / only for course sellers / only if they call themselves operators | PW-9 |
| PW3-VAL-007 | CS vs LMS | MSG-007 | VIS-002 analogue | “Do students take courses here?” | Proposed: no | Yes | PW-6 / PW-9 |
| PW3-VAL-008 | Closed-beta understanding | MSG-009 | VIS-001, 010 | “Can anyone start today?” | Proposed: no | Yes / register now | PW-9 |
| PW3-VAL-009 | Target-group readiness | MSG-008 | VIS-001–005 | Availability of four contexts | Proposed: not four live editions | Equal availability | PW-6 / PW-9 |
| PW3-VAL-010 | Credibility, calm, premium-without-hype | Voice §18; VP-004 | VIS-001, 009 | Likert + qualitative | Proposed: majority “honest / not overpromising”; **no numeric brand-lift** | Overpromising pattern | PW-9 |
| PW3-VAL-011 | Clarity without defensive overload | Hierarchy §11 | VIS-001 analogue | First-view recall | Proposed: can state Level 1 without reciting every qualifier | Cannot state purpose; or only recites limits | PW-5 / PW-9 |
| PW3-VAL-012 | Mobile comprehension | MSG-002, 009 and TG qualifiers if shown | Mobile visitor | Mobile viewport | Proposed: same pass/fail on material qualifiers as desktop | Qualifier only on desktop | PW-7 / PW-8 |
| PW3-VAL-013 | Plain-language accessibility | Terminology §19 | Keyboard / SR analogue | Headings + key sentences | Proposed: BOS/beta/AI limits understandable without jargon | Only engineering terms carry the truth | PW-8 |
| PW3-VAL-014 | Sign in is not treated as Start or account creation | MSG-010 | VIS-001, 007 analogue | First-click / label task | Proposed: Sign in = existing accounts | Sign in treated as Start/Join/Create account | PW-6 / PW-9 |
| PW3-VAL-015 | Course Sellers does not capture the brand | MSG-007, 015 | VIS-001 analogue | “What is ZyntixAI for?” | Proposed: general small-business daily work; CS optional relevance | “It is a course/LMS product” as the brand | PW-6 / PW-9 |
| PW3-VAL-016 | Operational clarity names product objects | TER-001; MSG-002 | VIS-001 analogue | “What does clarity mean here?” | Proposed: customers/work/ownership/progress/next attention | Empty calm, visual style, or generic professionalism | PW-6 / PW-9 |
| PW3-VAL-017 | Name/AI honesty without generative invention | MSG-003, 012; §14.3 | VIS-011 analogue | “Why is it called ZyntixAI?” | Proposed: product-led first; if AI asked, rule-based supporting; no generative SKU | Generative AI invented, or “there is no AI and I cannot explain the name” | PW-6 / PW-9 |
| PW3-VAL-018 | Message preference does not override product truth | MSG-* vs PW-1 | VIS-001 analogue | Preference ranking after truth brief | Proposed: preferred wording still inside PW-1 | Preferred wording requires a PROHIBIT or HOLD claim | PW-6 / PW-9 |

No participants, results, or analytics were collected. Future evidence artifacts: PW-9 comprehension sheets; PW-6 copy-review checklist; PW-8 accessibility notes. Do not implement analytics to collect these metrics (`PW1-CLM-060`).

---

## 23. Positioning Decision Register

Conservative defaults remain binding for **open** rows. Owner-frozen rows bind later phases until a formal owner change. They are not visitor research, not Production evidence, and not publication-ready copy.

| Decision ID | Decision | Status | Selected option | Alternatives | Evidence | Remaining gate |
| --- | --- | --- | --- | --- | --- | --- |
| PW3-OD-001 | Category prominence (BOS in first view vs later explanation) | `RESOLVED — OWNER FROZEN` | BOS is not a mandatory hero slogan or standalone Layer A message. May be used as intended category at Level 2 / Layer C with context and qualifiers. First orientation explains the operational problem in plain language first. | Required BOS in Layer A (rejected). Narrower category without the BOS label remains a later copy option inside CLM-002. | `PW1-CLM-002`; `PW1-RQ-003`; `PW2-OD-012`; `PW2-CMP-002` | PW-6 writes actual words; must not exceed CLM-002 |
| PW3-OD-002 | Leading messaging territory | `RESOLVED — OWNER FROZEN` | `PW3-TER-001 — Operational clarity`. No co-leading territory. Connected-workspace language supporting only; no all-in-one claim. | TER-002 (higher all-in-one risk); TER-003 (weaker first impression) | §10 scores; Model A | PW-6 formulates; need not say “operational clarity” |
| PW3-OD-003 | Internal positioning basis | `RESOLVED — OWNER FROZEN` | `PW3-POS-001`. Status: `OWNER FROZEN — INTERNAL POSITIONING AUTHORITY — NOT PUBLICATION-READY COPY` | POS-002 not selected; POS-003 rejected | §9 | PW-6 copy review before any public sentence |
| PW3-OD-004 | Course Sellers in the first brand layer | `RESOLVED — OWNER FROZEN` | CS does not define the brand. Not required in Level 1 or the first five seconds. If later on the homepage: leading evidenced relevance context; not LMS; not public marketplace; not complete current-SHA edition; not the only audience. | CS-first (rejected); omit CS entirely (still allowed later) | `PW2-OD-001`; `PW1-CLM-071`; `PW1-PRH-022` | PW-4/PW-5/PW-6 may place a CS example inside these bounds |
| PW3-OD-005 | Four target groups on the homepage | `RESOLVED — OWNER FROZEN` | Four-TG comparison not required. Conservative default: no four equal cards. Relevance ≠ availability. TG2–TG4 not fully available, Production-verified, or closed-beta-eligible. | Limited later context references by PW-4/PW-5 inside PW-1 | `PW1-PRH-001`; `PW2-OD-003` | Copy freeze if equal availability implied |
| PW3-OD-006 | AI in the primary message | `RESOLVED — OWNER FROZEN` | AI is not a Layer A or hero-hook. Not chatbot-first. AI may be explained later and supporting only inside PW-1. Prohibited: generative AI as a current capability; autonomous operation; AI running the company; guaranteed recommendations; any-provider connect; free/unlimited AI. | AI limitation in Layer A; AI as supporting Level 2 | §14; `PW1-PRH-016` | PW-6 if AI is mentioned later |
| PW3-OD-007 | How closed-beta status is expressed | **OPEN** | Conservative default: factual invite-only closed beta; not scarcity | Stronger “not launched” vs softer “early access” | `PW1-CLM-007`; `PW2-RSK-020` | PW-6; owner if exclusivity language is proposed |
| PW3-OD-008 | Whether product exploration is in-page or separate | **OPEN** | Conservative default: no exploration CTA; no `#`; do not choose architecture in PW-3 | In-page (`PW2-FUT-006`); separate route; omit | `PW2-OD-013`; `PW1-CLM-050` | PW-4 / PW-13 |
| PW3-OD-009 | Trust claims on homepage vs legal/trust page | **PARTIAL** | Homepage: `RESOLVED — OWNER FROZEN TO NAMED CONTROLS ONLY`. Separate legal/trust-page claims: `OPEN — EXTERNAL LEGAL AUTHORITY REQUIRED` | Broader trust page | `PW2-OD-011`; `PW1-RQ-008` | Legal/technical owner before a trust/privacy page. This freeze is **not** legal-compliance approval. |

| Count | Value | IDs |
| --- | --- | --- |
| Total decision records | **9** | PW3-OD-001 … PW3-OD-009 |
| Fully resolved | **6** | PW3-OD-001, 002, 003, 004, 005, 006 |
| Partially resolved | **1** | PW3-OD-009 |
| Open | **2** | PW3-OD-007, PW3-OD-008 |
| Externally gated | **1** | PW3-OD-009 separate legal/trust-page claims |

Do not present OD-009 as legal-compliance approval. `PW2-OD-001` remains the owner-frozen audience decision. PW-3 strategy OD-001–006 are now also owner-frozen. OD-007 and OD-008 were **not** closed by this package.

**Count overlap.** Fully resolved (6) + partially resolved (1) + open (2) = **9** total records. “Externally gated” is a qualifier on the OD-009 remainder, not a tenth record. 6 + 1 + 2 = 9. Externally gated (1) overlaps the partial record.

---

## 24. Open Questions

| ID | Question | Status after OD freeze | Public default | Resolution owner | Blocks PW-4 | Blocks PW-6 copy freeze |
| --- | --- | --- | --- | --- | --- | --- |
| PW3-Q-001 | Does BOS appear as a required first-view slogan? | **Resolved** by `PW3-OD-001`: no. BOS may appear at Level 2 / Layer C with qualifiers. Exact wording remains PW-6. | Plain-language operational problem first | PW-6 within OD-001 | No | **Yes** if headline exceeds CLM-002 or makes BOS a required Layer A slogan |
| PW3-Q-002 | Is TER-001 the leading territory? | **Resolved** by `PW3-OD-002` | TER-001 leading; TER-002/003 not co-leading | PW-6 formulates | No | **Yes** if copy treats TER-002/003 as co-leading |
| PW3-Q-003 | Does CS define the first brand layer? | **Resolved** by `PW3-OD-004`: no. Whether a later CS example is used remains PW-4/PW-5/PW-6 inside those bounds. | CS not Level 1 | PW-4 / PW-5 / PW-6 | No | **Yes** if CS becomes identity |
| PW3-Q-004 | Is a four-TG homepage comparison required? | **Resolved** by `PW3-OD-005`: no. Limited later context references may be useful, inside PW-1. | No four equal cards | PW-4 / PW-5 | No | **Yes** if equal availability implied |
| PW3-Q-005 | Is AI named in first-view copy? | **Resolved** by `PW3-OD-006`: no Layer A / hero-hook | No AI slogan in Layer A | PW-6 if AI mentioned later | No | **Yes** if AI-first |
| PW3-Q-006 | What exact beta phrasing is used? | **Open** (`PW3-OD-007`) | Factual invite-only closed beta | PW-6 within this framework | No | No, unless scarcity language is introduced |
| PW3-Q-007 | In-page vs separate public exploration? | **Open** (`PW3-OD-008`) | No exploration CTA; no `#` | PW-4 / PW-13 | **Yes** if architecture is treated as approved | **Yes** if a HOLD CTA is implied as live |

`PW1-RQ-004`–`013` remain as in PW-1. PW-3 does not reopen them except where they constrain wording. `PW3-OD-009` legal/trust-page remainder is externally gated (`PW1-RQ-008`).

---

## 25. Handoff Contract

### PW-4 — Information Architecture

Must consume: owner-frozen TER-001 / POS-001 / Model A; sole brand-primary `PW2-VIS-001`; message hierarchy §11 (operational problem first; chatbot as recognition outcome; BOS later; CS not Level 1); PW-2 visitor questions; target-group messaging roles §15 (CS not brand-primary; no four equal live editions; RELEVANCE ≠ AVAILABILITY); maturity/trust placement §16–§17; CTA boundaries (Sign in utility; HOLD/PROHIBIT). Must not treat this document as a sitemap. Dual-use `/` remains unresolved (`PW2-OD-009`). Do not design replacement of `/` as if approved. `PW3-OD-008` remains open: do not treat in-page vs separate exploration as decided.

Required first-message order for IA, not a section list: Recognition (name + daily work) → Layer B maturity/action distinction as soon as the first viewport allows → category/mechanism later → optional CS relevance → trust named controls → actions. PW-4 still chooses page structure.

### PW-5 — Homepage Content Model

Must map every content requirement to: visitor; journey stage; `PW3-MSG-*`; PW-1 claim ID; qualifier; destination readiness (CURRENT PRODUCTION / DESIGN INTENT / HOLD / PROHIBIT / information-only); comprehension layer A/B/C/D. Must not require four target-group cards. Must not place CS or AI in Layer A.

Required content roles (not a layout):

| Content role | Authority | Layer | Must not |
| --- | --- | --- | --- |
| Identity | MSG-001 | A | Rename; imply a live marketing site from the name |
| Daily-work purpose | MSG-002; TER-001 objects | A | Empty “clarity”; chatbot identity; BOS slogan |
| Recognition outcome | MSG-003 | A outcome | “Not a chatbot” as the whole story |
| Maturity | MSG-009 | B | GA; scarcity; free/trial |
| Action distinction | MSG-010, 014 | B | Sign in as Start; HOLD buttons |
| Category | MSG-004 | C | Unexplained BOS; all-in-one |
| Mechanism | MSG-005, 006 | C | Feature dump; AI ranking |
| Optional CS relevance | MSG-007, 015 | C / later | CS as brand; LMS |
| Optional other TG | MSG-008 | C if shown | Equal availability |
| Named-control trust | TRU-001–004 | C / D | Compliance conclusions |
| AI limitation | MSG-012 | C only if asked/shown | Hero-hook; generative SKU |

### PW-6 — Public Copy Deck

May write final copy only from approved/conditional `PW3-MSG-*`, PW-1 claims, PW-2 comprehension goals, and the owner-frozen strategy (TER-001, POS-001, OD-001–006, homepage OD-009). May narrow wording. May not broaden it, convert HOLD/PROHIBIT to ALLOW, publish POS-001 verbatim without copy review, freeze a hero from §9 prototypes, or treat internal positioning as publication-ready copy. Exact beta phrasing remains open (`PW3-OD-007`). Validation hypotheses remain unexecuted.

Must use: selected positioning POS-001; territory TER-001 meaning; voice §18; terminology §19; claim-to-message bounds §20. Copy that still requires `PW3-VAL-*` is not publication-ready.

### PW-7 / PW-8

Must preserve message hierarchy, qualifiers, beta status, target-group distinctions, named-controls-only homepage trust, and action clarity. No color-only status. No hover-only material information. PW-8 must not introduce legal-compliance copy. A separate trust/privacy page remains externally gated (`PW3-OD-009`). Qualifiers must remain attached on mobile. Text equivalents must carry maturity, Sign in utility, and TG availability where those claims appear.

### PW-9 through PW-12

Design must not visually contradict message truth (chatbot-first hero, AI hero-hook, equal TG chrome, mockups as live product, Sign in as Start, BOS as unexplained technical OS). PW-12 design freeze must consume the owner-frozen strategy and still not treat it as final copy. PW-12/PW-13 must know: strategy is frozen; copy is not publication-ready until PW-6 + validation; HOLD/PROHIBIT route and CTA gates remain.

### PW-13 and deployment

Every published sentence must be rechecked against the current PW-1 register. HOLD destinations still require real routes, governance, implementation, and PW-1 update. Authenticated Home remains closed. No analytics without a new authority (`PW1-CLM-060`).

PW-3-R1 is recorded in §30. PW-3-FV and PW-4 are **not** started.

---

## 26. Acceptance Gate

PW-3 uses AND logic. One failed mandatory condition means PW-3 is not closed as a freeze. Browser/production gates are **NOT REQUIRED** for this documentation-only slice (no user-visible product change). Justification: this file cannot alter runtime behavior.

| # | Mandatory condition | Result |
| --- | --- | --- |
| 1 | Preflight matches clean baseline | **PASS** — root, branch `core/platform-readiness-20260707`, HEAD/upstream `d3bea25…`, ahead/behind `0 0`, clean worktree |
| 2 | PW-0, PW-1, PW-2 present and binding | **PASS** |
| 3 | Model A preserved; VIS-001 sole brand-primary | **PASS** — §5 |
| 4 | Course Sellers remains relevance context, not brand | **PASS** — §15 |
| 5 | Category strategy defined; BOS plain language; not technical OS/autonomy/completeness/GA | **PASS** — §6 |
| 6 | Core problem separated from fabricated research | **PASS** — §7 |
| 7 | Value propositions map to evidence; no guaranteed outcomes | **PASS** — §8 |
| 8 | Positioning alternatives evaluated; TER-001 and POS-001 owner-selected | **PASS** — §9–§10; OD-002, OD-003 |
| 9 | Owner decisions explicit: OD-001–006 frozen; OD-007–008 open; OD-009 partial | **PASS** — §23 |
| 10 | Hierarchy preserves PW-2 layers | **PASS** — §11 |
| 11 | Pillars evidence-backed; AI supporting, not Layer A | **PASS** — §12, §14; OD-006 |
| 12 | Differentiation without unsupported superiority | **PASS** — §13 |
| 13 | TG unequal readiness; CS not LMS and not brand-primary | **PASS** — §15; OD-004, OD-005 |
| 14 | Closed-beta honest and non-manipulative | **PASS** — §16; OD-007 still open for exact phrasing |
| 15 | Trust language narrow; OD-009 not treated as legal approval | **PASS** — §17 |
| 16 | Voice and terminology complete | **PASS AFTER R1** — §18–§19; operator/intelligence/platform rows added |
| 17 | Factual messages map to PW-1; goals map to PW-2 | **PASS AFTER R1** — §20; MSG-002 reclassified; MSG-015 added |
| 18 | HOLD/PROHIBIT do not become approved messages | **PASS** — §20 last note |
| 19 | Risks and validation complete; tests unexecuted | **PASS AFTER R1** — §21–§22; RSK-019–024 and VAL-014–018 added |
| 20 | No final homepage copy, IA, wireframe, design, or implementation | **PASS** |
| 21 | Only this PW-3 file changed; no existing tracked file changed | **PASS** — verified after R1 |
| 22 | No product, test, configuration, dependency, or infrastructure change | **PASS** |
| 23 | No secret or sensitive information | **PASS** |
| 24 | No commit, push, or deployment; PW-3-FV / PW-4 not started | **PASS** — R1 is recorded in §30; FV and PW-4 remain unstarted |
| 25 | Material brand strategy owner-frozen; remaining ODs visible; public copy not frozen | **PASS** — §23, §29 |
| 26 | Independent R1 closed with evidence; no P0; P1s corrected or explicitly later-gated | **PASS** — §30 |

PW-3 is **not** `CLOSED WITH EVIDENCE`. Independent positioning review (PW-3-R1) is recorded in §30. Final verification and commit remain separately authorized.

---

## 27. Final Status

Historical establishment result (before this OD freeze):

```text
CONDITIONAL — PW-3 OWNER DECISION REQUIRED
```

Owner positioning freeze result:

```text
PASS — PW3-OD OWNER POSITIONING DECISIONS FROZEN
```

```text
PASS — PW-3-R1 POSITIONING AND MESSAGING REVIEW CLOSED WITH EVIDENCE
```

```text
PW-3 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```

Do not use `CLOSED WITH EVIDENCE — PW-3`. Do not start PW-3-FV or PW-4 until separately authorized. Do not treat this document as a copy deck. Authenticated Home remains closed.

---

## 28. Evidence Appendix

### 28.1 Preflight

| Check | Result |
| --- | --- |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| Upstream | `origin/core/platform-readiness-20260707` @ `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| Ahead / behind | `0 0` |
| Staged / tracked / untracked before this file | none / none / none |
| Worktree | completely clean |

### 28.2 Authorities inspected (read, not modified)

- `docs/phases/PW-0-public-web-charter-boundary-freeze.md`
- `docs/phases/PW-1-product-truth-claims-register.md`
- `docs/phases/PW-2-visitor-goals-journey-map.md`
- `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md`
- `src/features/product-access/domain/terminology.ts` (authenticated TG terms; not public copy authority)
- No `AGENTS.md`

### 28.3 ID inventory

| Register | Count | ID range |
| --- | --- | --- |
| Problem themes | **5** | PW3-PRB-001 … PW3-PRB-005 |
| Value propositions | **5** | PW3-VP-001 … PW3-VP-005 |
| Positioning statements | **3** | PW3-POS-001 … PW3-POS-003 |
| Territories | **3** | PW3-TER-001 … PW3-TER-003 |
| Pillars | **4** | PW3-PIL-001 … PW3-PIL-004 |
| Differentiation | **6** | PW3-DIF-001 … PW3-DIF-006 |
| Trust | **5** | PW3-TRU-001 … PW3-TRU-005 |
| Messages | **15** | PW3-MSG-001 … PW3-MSG-015 |
| Risks | **24** | PW3-RSK-001 … PW3-RSK-024 |
| Validation tests | **18** | PW3-VAL-001 … PW3-VAL-018 |
| Owner decisions | **9** | PW3-OD-001 … PW3-OD-009 |
| Open questions | **7** | PW3-Q-001 … PW3-Q-007 |
| R1 findings | **30** | PW3-R1-FND-001 … PW3-R1-FND-030 |

Historical establishment counts (before OD freeze): PW-3 owner decisions **0 frozen / 9 open**. After OD freeze: **6 fully resolved / 1 partial / 2 open / 1 externally gated remainder**. R1 did not change OD statuses. R1 added VP-005, MSG-015, RSK-019–024, VAL-014–018, and the R1 finding family.

### 28.4 Commands not run

No `npm install`, formatter, build, or test suite. No analytics. No commit. No push. No deploy. No PW-3-FV. No PW-4 document.

### 28.5 B1-GATE.1 documentation-only justification

| Gate | Result |
| --- | --- |
| Browser verification | NOT REQUIRED WITH JUSTIFICATION — no user-visible product change |
| Production verification | NOT REQUIRED WITH JUSTIFICATION — no production flow change |
| Targeted / regression tests | NOT REQUIRED — no code change |
| Typecheck / lint / production build | NOT REQUIRED — no code change |
| Publication | FAIL (not a defect) — commit/push not authorized by this phase |

### 28.6 Confirmation

No research result, interview, conversion rate, or test score was invented. No product code, tests, configuration, or tracked file changed. PW-0, PW-1, and PW-2 were not edited. Authenticated Home was not reopened. No HOLD destination was treated as live. No PROHIBIT CTA was authorized. No final homepage copy was written. PW-3-FV and PW-4 were not started.

Historical establishment line retained for audit:

```text
CONDITIONAL — PW-3 OWNER DECISION REQUIRED
```

Current OD-freeze result:

```text
PASS — PW3-OD OWNER POSITIONING DECISIONS FROZEN
```

---

## 29. OD1 Owner Positioning Decision Evidence

### 29.1 Decision authority

| Field | Value |
| --- | --- |
| Authority type | `EXPLICIT ZYNTIXAI OWNER POSITIONING DECISION` |
| Processing date | 2026-09-15 |
| Branch | `core/platform-readiness-20260707` |
| HEAD at freeze | `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| Package approved | The owner explicitly approved the recommended PW-3 decision package. |
| Strategy vs product evidence | This freeze is strategy. It is not visitor research and not Production evidence. |
| Strategy vs public copy | Frozen strategy is not final homepage copy and is not publication-ready. PW-6 remains responsible for wording. |
| Strategy vs legal authority | Homepage named-controls-only is frozen. Separate legal/trust-page claims remain `OPEN — EXTERNAL LEGAL AUTHORITY REQUIRED`. The owner did not approve legal compliance. |

### 29.2 Decision table

| Decision ID | Decision | Previous status | New status | Scope | Remaining gate |
| --- | --- | --- | --- | --- | --- |
| PW3-OD-001 | BOS prominence | Open / conservative Layer C default | `RESOLVED — OWNER FROZEN` | BOS not mandatory Layer A / hero slogan; Level 2 / Layer C with qualifiers | PW-6 wording inside CLM-002 |
| PW3-OD-002 | Leading territory | Open / recommended TER-001 | `RESOLVED — OWNER FROZEN` | TER-001 leading; no co-leading territory | PW-6 formulation |
| PW3-OD-003 | Internal positioning basis | Open / recommended POS-001 | `RESOLVED — OWNER FROZEN` | POS-001 selected; not publication-ready copy | PW-6 copy review |
| PW3-OD-004 | CS in first brand layer | Open | `RESOLVED — OWNER FROZEN` | CS not brand-primary; not required in Level 1 | Later CS example inside bounds |
| PW3-OD-005 | Four TGs on homepage | Open | `RESOLVED — OWNER FROZEN` | Four-TG comparison not required; no four equal cards | PW-4/PW-5 limited context inside PW-1 |
| PW3-OD-006 | AI in primary message | Open / conservative no Layer A | `RESOLVED — OWNER FROZEN` | AI not Layer A or hero-hook | PW-6 if AI mentioned later |
| PW3-OD-009 | Trust / legal boundary | Open named-controls default | Homepage: `RESOLVED — OWNER FROZEN TO NAMED CONTROLS ONLY`. Legal/trust page: `OPEN — EXTERNAL LEGAL AUTHORITY REQUIRED` | Homepage messaging only | `PW1-RQ-008`; `PW2-OD-011` |

OD-007 and OD-008 were **not** in this package and remain **OPEN**.

### 29.3 Positioning freeze

- Model A remains binding. `PW2-VIS-001` is the sole brand-primary. `PW2-VIS-002` is secondary leading relevance.
- `PW3-POS-001` is the internal positioning basis: `OWNER FROZEN — INTERNAL POSITIONING AUTHORITY — NOT PUBLICATION-READY COPY`.
- `PW3-TER-001` is the leading territory. TER-002 and TER-003 are not co-leading.
- BOS is Level 2 / Layer C, not a mandatory Layer A slogan.
- Course Sellers is leading relevance, not brand-primary, not LMS, not a public marketplace, not a complete current-SHA edition.
- AI is supporting, not Layer A.
- Four target groups are not presented as equally available editions.
- Homepage trust uses named controls only.

### 29.4 Remaining open decisions

- `PW3-OD-007` — OPEN (closed-beta phrasing).
- `PW3-OD-008` — OPEN (in-page vs separate exploration).
- `PW3-OD-009` — PARTIAL; separate legal/trust-page claims externally gated.

### 29.5 Downstream effect

| Phase | Effect |
| --- | --- |
| PW-3-R1 | Independent positioning review closed in §30. |
| PW-3-FV | Final verification and commit remain separately authorized. Not started here. |
| PW-4 IA | Consume TER-001, hierarchy, TG bounds, and open OD-008. Do not invent a sitemap from this freeze. |
| PW-5 content model | Map content to frozen strategy and `PW3-MSG-*`. Do not require four TG cards or Layer A AI/CS. |
| PW-6 copy deck | Write from frozen strategy + PW-1/PW-2. Do not publish POS-001 verbatim without copy review. Headlines remain unfrozen. |
| PW-8 accessibility and trust | Preserve qualifiers and named-controls-only homepage trust. No legal-compliance copy. |
| PW-12 design freeze | Visuals must not contradict frozen strategy. Design freeze is not a copy freeze. |
| PW-13 implementation planning | HOLD/PROHIBIT CTAs unchanged. No public routes authorized by this freeze. |

```text
PASS — PW3-OD OWNER POSITIONING DECISIONS FROZEN
```

---

## 30. R1 Independent Positioning and Messaging Review Evidence

### 30.1 Review scope and independence

| Field | Value |
| --- | --- |
| Reviewed file | `docs/phases/PW-3-positioning-messaging-framework.md` |
| Review authority | PW-3-R1 independent positioning and messaging review prompt; B1-GATE.1 AND logic |
| Baseline HEAD | `d3bea25bca052ebdd6adce4c9c08328a41445eba` |
| Binding authorities | PW-0 `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8`; PW-1 `e694b85ead8a4b75054a078624aadfd315cea39d`; PW-2 `d3bea25bca052ebdd6adce4c9c08328a41445eba`; authenticated Home closure `49cd5773976143139a154f9b8ddf36535a4dd914`; Home Production product-code `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Independence | The existing PW-3 document was treated as a candidate, not as automatically correct. Frozen owner decisions were not reversed. No visitor research was simulated. No new product claims were created. No final homepage copy was written. PW-3-FV and PW-4 were not started. |

The review tested audience fit, five-second layers, category, positioning, territories, problems/values, hierarchy, pillars, differentiation, AI, target groups, maturity, trust, voice, terminology, message traceability, risks, validation, owner decisions, and downstream handoffs. Findings were adversarial: empty-clarity, chatbot-identity, CS-as-brand, all-in-one, mixed evidence tiers, and name/AI gap were tested even where the candidate looked complete.

### 30.2 Review matrix

| Review ID | Review area | Test question | Evidence | Finding | Severity | Required correction | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW3-R1-FND-001 | Audience | Is PW-3 written from VIS-001, not CS-first or “every business”? | §5; `PW2-OD-001`; `PW3-OD-004` | Model A and VIS-001 sole brand-primary are intact. CS remains secondary. | OBSERVATION | None beyond later copy discipline | PASS |
| PW3-R1-FND-002 | Audience | Can “operator” stay internal without forcing that self-label? | §5; terminology before R1 lacked an operator row | Candidate used operator as if it were the public address form | P1 — MATERIAL | Public addressing rule + terminology row | PASS AFTER CORRECTION |
| PW3-R1-FND-003 | Audience | Is Course Sellers clearly secondary and not brand-defining? | §15; OD-004; MSG-007 | Bound correctly; MSG-015 split keeps CS capability out of Layer A | OBSERVATION | Keep CS out of Layer A | PASS |
| PW3-R1-FND-004 | Comprehension | Does Layer A lead with daily work, not chatbot denial? | §11 Level 1 before R1 | Visitor question framed “or only a chatbot?”, which made denial the identity | P1 — MATERIAL | Lead with daily work; chatbot as recognition outcome | PASS AFTER CORRECTION |
| PW3-R1-FND-005 | Comprehension | Is BOS kept off Layer A, with usable Layer C qualifiers? | OD-001; §6 | BOS stays Level 2 / Layer C. Qualifier load is high but OD-001 is not reversed. | P2 — IMPROVEMENT | Register `PW3-RSK-024`; omit label rather than drop qualifiers | PASS AFTER CORRECTION |
| PW3-R1-FND-006 | Positioning | Does POS-001 mix evidence tiers in the “because” clause? | Frozen POS-001 vs `PW1-CLM-018` vs `070` vs `015` | Mechanism clause bundled Production Home, release-verified Tasks/Attention, and vague “operator records” | P1 — MATERIAL | Decomposition rule; statement text owner-frozen and retained | PASS AFTER CORRECTION |
| PW3-R1-FND-007 | Positioning | Are POS-002 not selected and POS-003 rejected, with no co-positioning? | §9 | Status correct; rejection rationale sufficient | OBSERVATION | None | PASS |
| PW3-R1-FND-008 | Territory | Is TER-001 empty aesthetic “clarity”? | §10 before R1 | Focus was too thin; could be generic professionalism | P1 — MATERIAL | Bind clarity to customers, work, ownership, progress, next attention | PASS AFTER CORRECTION |
| PW3-R1-FND-009 | Territory | Does independent re-score still select TER-001? | §10.3 | TER-001 remains strongest on VIS-001, five-second, all-in-one, mobile | OBSERVATION | Do not change OD-002 | PASS |
| PW3-R1-FND-010 | Problems | Does PRB-001 treat CS CRM as general-operator proof? | PRB-001 product connection | CS CRM was connected to VIS-001 without enough class split | P1 — MATERIAL | CS = relevance evidence, not general CRM | PASS AFTER CORRECTION |
| PW3-R1-FND-011 | Problems | Is “calm” smuggled into PRB-004 as if evidenced? | PRB-004; VP-004 | Calm sat in the problem sentence | P1 — MATERIAL | Move calm to VP-004 only | PASS AFTER CORRECTION |
| PW3-R1-FND-012 | Values | Does VP-001 mix CS CRM with general Home/tasks? | VP-001 claims `015`, `016`, `018`, `070` | One row, two truth statuses | P1 — MATERIAL | Split VP-005 | PASS AFTER CORRECTION |
| PW3-R1-FND-013 | Hierarchy | Can closed beta appear in Layer B without dominating the hero? | §11 Level 5; §16 | Placement is Layer B; OD-007 still open for phrasing, not R1-blocking | OBSERVATION | Conservative default remains | PASS |
| PW3-R1-FND-014 | Pillars | Is PIL-001 only a repeat of the territory name? | PIL-001 before R1 | Label “Operational clarity” was tautological | P1 — MATERIAL | Rename substance to visible work and next attention | PASS AFTER CORRECTION |
| PW3-R1-FND-015 | Pillars | Can PIL-002 become all-in-one? | PIL-002 | Needed a connection≠completeness bound | P1 — MATERIAL | Supporting-only; not “one tool for everything” | PASS AFTER CORRECTION |
| PW3-R1-FND-016 | Differentiation | Are DIF rows classified evidenced / inferred / hypothesis / prohibited? | §13 before R1 | Classification column missing; DIF-001 overused CS customers | P1 — MATERIAL | Add classification; CS-qualify customers | PASS AFTER CORRECTION |
| PW3-R1-FND-017 | AI | Does the name outrun evidenced AI, or become anti-AI-only? | §14 before R1 | Ladder was denial-heavy; no name-honesty rule | P1 — MATERIAL | §14.3; `PW3-RSK-023`; `PW3-VAL-017` | PASS AFTER CORRECTION |
| PW3-R1-FND-018 | Target groups | Is RELEVANCE ≠ AVAILABILITY and no four equal cards consistent? | §15; OD-005 | Present but needed an explicit rule line | P2 — IMPROVEMENT | Explicit RELEVANCE ≠ AVAILABILITY | PASS AFTER CORRECTION |
| PW3-R1-FND-019 | Maturity | Is closed beta not GA, free, trial, scarcity, or open signup? | §16; CLM-007/008/011 | Mostly correct; missing explicit not-free/not-trial/not-join-now | P1 — MATERIAL | Add those prohibitions; `PW3-RSK-020` | PASS AFTER CORRECTION |
| PW3-R1-FND-020 | Trust | Is OD-009 fully closed or dual-status? | §17; §23 | Homepage named-controls resolved; legal remainder externally gated. Not silently closed. | OBSERVATION | Keep dual status | PASS |
| PW3-R1-FND-021 | Voice | Is premium exclusivity, hype, or empty minimalism? | §18 | Voice list was sound; luxury-as-exclusivity needed a dedicated risk | P2 — IMPROVEMENT | `PW3-RSK-021`; owner-facing illustrative pair | PASS AFTER CORRECTION |
| PW3-R1-FND-022 | Terminology | Are operator, intelligence, platform, workspace governed? | §19 before R1 | operator / intelligence / platform missing or thin | P1 — MATERIAL | Add rows | PASS AFTER CORRECTION |
| PW3-R1-FND-023 | Traceability | Do MSG rows have required columns and correct classes? | §20 before R1 | Missing prohibited implication, strategy authority, readiness, owner; MSG-002 overclassified as product fact | P1 — MATERIAL | Expand columns; reclassify MSG-002; add MSG-015 | PASS AFTER CORRECTION |
| PW3-R1-FND-024 | Risk / validation | Are required risks and tests present, planned not executed? | §21–§22 before R1 | Missing empty clarity, open signup, final-copy-before-PW-6, name/AI, CS brand capture, Sign in vs Start, preference-without-truth | P1 — MATERIAL | RSK-019–024; VAL-014–018 | PASS AFTER CORRECTION |
| PW3-R1-FND-025 | Owner decisions | Are OD-001–006 frozen and 007/008/009 remainder not silently closed? | §23 | Statuses correct; overlap in counts needed to be explicit | P2 — IMPROVEMENT | Explicit 6+1+2=9 overlap note | PASS AFTER CORRECTION |
| PW3-R1-FND-026 | Downstream | Can PW-4/PW-5/PW-6 act without contradictory interpretations? | §25 before R1 | Handoffs named phases but not first-message order or PW-5 content roles | P1 — MATERIAL | Content-role table; first-message order; PW-6 VAL bound | PASS AFTER CORRECTION |
| PW3-R1-FND-027 | Authority conflict | Does any frozen decision contradict PW-0/PW-1/PW-2? | OD-001–006 vs CLM-002, PRH-016, Model A | No conflict. BOS Layer C narrows RQ-003 as allowed. | OBSERVATION | None; would have been a blocker if found | PASS |
| PW3-R1-FND-028 | Publication | Is any message marked publication-ready? | §20 | No row is publication-ready; HOLD/PROHIBIT remain non-messages | OBSERVATION | None | PASS |
| PW3-R1-FND-029 | Active language | Do active (non-governance) sentences overclaim chatbot-first, all-in-one, four editions, GA, compliance, outcomes? | Active-language scan after correction | Remaining uses are prohibition, qualifier, or owner-frozen internal statement | OBSERVATION | Governance context may contain those terms | PASS |
| PW3-R1-FND-030 | Integrity | Unique IDs, contiguous families, cited PW-1/PW-2 IDs exist? | Registers after correction | Families contiguous after additions; cited CLM/PRH/VIS/CMP/Q IDs exist in PW-1/PW-2 | OBSERVATION | File-integrity checks in verification | PASS |

No P0 — BLOCKING finding. No FAIL result. OD-007, OD-008, and OD-009 legal remainder remain open or externally gated for later phases; they do not block R1 because homepage bounds stay conservative.

### 30.3 Audience and comprehension result

| Test | Result |
| --- | --- |
| VIS-001 fit | Pass after addressing rule. Central problem is daily customers, work, ownership, progress. |
| Course Sellers boundary | Secondary; leading evidenced relevance; not brand; not LMS; not complete current-SHA edition. |
| Layer A | Name + daily work. BOS not required. Chatbot is a recognition outcome, not the identity. |
| Layer B | Closed beta vs GA; exploration vs Sign in; existing user vs new visitor. Exact beta phrasing still OD-007. |
| Layer C | BOS with qualifiers; mechanism; optional CS; unequal TGs; AI only if mentioned. |
| Jargon / cognitive load | Operator is internal. BOS stays later. Qualifier load is managed by layers, not by stuffing Layer A. |

Emotional prevalence and “calm” remain messaging hypotheses. They were not converted into product facts.

### 30.4 Category and positioning result

| Test | Result |
| --- | --- |
| BOS | Governed product intent, not a proven market position. Plain-language definition is daily operating work, not a computer OS. All-in-one, enterprise-suite, and autonomy readings are prohibited. Qualifier load is a material risk (`PW3-RSK-024`); OD-001 not reversed. |
| POS-001 | Remains selected internal authority. Not publication-ready. Mechanism clause must be decomposed by PW-6. |
| POS-002 / POS-003 | Not selected / rejected. No co-positioning. |
| Territory | Independent re-score confirms TER-001. Clarity is now object-bound. |
| Differentiation | Useful without named competitors. Chatbot distinction exists but must not own the brand story. No superiority, price, ease, security, or completeness comparison. |

Main interpretation risks after correction: empty clarity (mitigated), chatbot capture from the name, all-in-one via “platform/workspace”, CS brand capture, BOS as technical OS.

### 30.5 AI, maturity and trust result

| Test | Result |
| --- | --- |
| AI role | Supporting; not Layer A; not chatbot-first; not generative; not autonomous. If asked, rule-based next actions. Name-honesty rule added so the brand is not only a list of denials. |
| Closed-beta truth | Not GA; invite-only is last governed policy; live registration flag not re-proved; not free; not trial; not scarcity theater. |
| CTA / access | Sign in = existing accounts. HOLD destinations remain non-messages. No waitlist or beta-request without a real destination. |
| Named-controls boundary | Homepage may name signed-in access, org-aware workspace, fail-closed navigation, user-scoped Home loading. |
| External legal gate | OD-009 remainder: no AVG/GDPR, SOC 2, ISO, certified, fully secure, bank-level, uptime/SLA. |

### 30.6 Register reconciliation

| Register | Before R1 | After R1 | Change |
| --- | --- | --- | --- |
| PRB | 5 | 5 | Reclassified PRB-001, PRB-004; no split |
| VP | 4 | 5 | Split CS functional value to VP-005 |
| POS | 3 | 3 | Usage notes on POS-001; text frozen |
| TER | 3 | 3 | TER-001 meaning bound; §10.3 re-score added |
| PIL | 4 | 4 | PIL-001 label/substance; PIL-002/004 bounds |
| DIF | 6 | 6 | Classification column; CS-qualify DIF-001 |
| TRU | 5 | 5 | No change |
| MSG | 14 | 15 | Columns expanded; MSG-002 reclassified; MSG-015 added |
| RSK | 18 | 24 | Columns expanded; RSK-019–024 added |
| VAL | 13 | 18 | VAL-001/006 tightened; VAL-014–018 added |
| OD | 9 | 9 | Statuses unchanged; overlap note added |
| Q | 7 | 7 | No change |
| R1-FND | 0 | 30 | New family |

Splits: VP-001 → VP-001 + VP-005; MSG-002 CS capability → MSG-015. Additions: RSK-019–024; VAL-014–018; terminology rows; §14.3. Deletions: none. Reclassifications: MSG-002 evidence class; PRB-001 product-connection class; PRB-004 problem wording.

OD counts unchanged: total 9; fully resolved 6; partially resolved 1; open 2; externally gated 1 (overlaps the partial).

### 30.7 Corrections performed

| # | Original | Finding | Evidence | Exact correction | Register effect | Remaining uncertainty |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | “Operator” used as public address | FND-002 | VIS-001 is owner/operator; no research that visitors use that word | Public addressing rule; terminology row | Terminology + | PW-6 still chooses exact words |
| 2 | Level 1 asked “or only a chatbot?” | FND-004 | PW2-CMP-004 is an outcome, not identity | Hierarchy lead with daily work | Hierarchy wording | PW-6 headlines unfrozen |
| 3 | POS-001 “because” mixed tiers | FND-006 | CLM-018 vs 070 vs CS records | Decomposition rule; frozen sentence retained | POS usage notes | PW-6 must not copy the because-clause as a suite |
| 4 | TER-001 “clarity” under-specified | FND-008 | Risk of empty professionalism | Object-bound definition; RSK-019; VAL-016 | TER + RSK + VAL | Copy still must stay concrete |
| 5 | PRB-001 CS CRM as VIS-001 proof | FND-010 | CLM-015 is CS-qualified | Relevance-context note | PRB class | Hypothesis prevalence still untested |
| 6 | PRB-004 included “calm” | FND-011 | VP-004 is the emotional hypothesis | Problem = attention/progress only | PRB wording | Calm remains unvalidated |
| 7 | VP-001 mixed CS + general | FND-012 | CLM-015/016 vs 018/070 | VP-005 split | VP 4→5 | CS display still a later IA choice |
| 8 | PIL-001 named the territory | FND-014 | Tautology | Pillar = visible work and next attention | PIL label | Copy may still say clarity if objects are named |
| 9 | PIL-002 completeness risk | FND-015 | PRH-003 | Connection ≠ completeness | PIL bound | Supporting language still risky in PW-6 |
| 10 | DIF unclassified; CS customers in DIF-001 | FND-016 | CLM-015 scope | Classification column | DIF columns | Inferred rows remain non-benchmarks |
| 11 | AI ladder denial-heavy | FND-017 | Name vs CLM-027 | §14.3; RSK-023; VAL-017 | AI + RSK + VAL | Name/AI tension cannot be fully closed without overclaim |
| 12 | MSG columns thin; MSG-002 too factual | FND-023 | Prompt required columns | Expand table; MSG-015 | MSG 14→15 | No message is publication-ready |
| 13 | Missing required risks/tests | FND-024 | Review §22–§23 | RSK-019–024; VAL-014–018 | RSK 18→24; VAL 13→18 | Tests remain unexecuted |
| 14 | Handoffs too thin for PW-5 | FND-026 | Downstream P1 rule | Content roles + first-message order | Handoff | PW-4 still must not treat this as a sitemap |
| 15 | BOS qualifier load unmarked | FND-005 | OD-001 retained | RSK-024; omit-label rule | RSK + | PW-6 may still write unreadable BOS if it ignores the rule |
| 16 | “Developing as a BOS” could read as roadmap-now | FND-005 adjacent | CLM-044 | Explicit not-complete-OS / not coming-soon | Exec note | Exact BOS sentence remains PW-6 |

### 30.8 Remaining open items

| Item | Status | Blocks PW-3-R1? | Blocks later |
| --- | --- | --- | --- |
| `PW3-OD-007` exact closed-beta phrasing | OPEN — OWNER | No | PW-6 if scarcity language is proposed |
| `PW3-OD-008` in-page vs separate exploration | OPEN — OWNER | No | PW-4 if architecture treated as approved; PW-13 if HOLD CTA implied live |
| `PW3-OD-009` legal/trust-page claims | PARTIAL; remainder OPEN — EXTERNAL AUTHORITY | No | PW-8 / trust page / legal claims |
| `PW3-Q-006`, `PW3-Q-007` | Open mirrors of OD-007/008 | No | Same as above |
| All `PW3-VAL-*` | Planned, not executed | No | PW-6 copy freeze / PW-9 |
| Dual-use `/` (`PW2-OD-009`) | Open in PW-2 | No | PW-4 / PW-13 |
| CS example display (`PW2-OD-002`) | Open in PW-2 | No | PW-4 / PW-5 inside OD-004 |
| Authenticated Home | Closed | n/a | Never via public-web |

Validation hypotheses remain hypotheses. No participants or results were invented.

### 30.9 R1 conclusion

Independent review found material classification, Layer A framing, empty-clarity, mixed-evidence, AI name-honesty, register-completeness, and handoff defects. Those P1 items were corrected in this file. Frozen owner decisions were left intact. No P0 remains. Open owner and external items gate later deliverables, not this review.

```text
PASS — PW-3-R1 POSITIONING AND MESSAGING REVIEW CLOSED WITH EVIDENCE
```

```text
PW-3 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
```
