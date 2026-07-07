# ZyntixAI Phase 1 Demo Strategy

## 1. Document Status

| Field | Value |
| ----- | ----- |
| Status | `AUTHORITATIVE — PHASE 1 DEMO PLANNING CONTRACT` |
| Target market | `Course Sellers` |
| Track owner | `Laptop Product Completion Track` |
| Branch | `parallel/laptop-product-track-20260707` |
| Parent evidence | L1–L4 product/UX freeze; QA contract (`98995b1`); L3.1-R1 integrity (`fb03ba8`) |
| Companion artifacts | `PHASE-1-DEMO-SCENARIO-MATRIX.md`, `PHASE-1-DEMO-DATA-CONTRACT.md`, `PHASE-1-DEMO-READINESS-GATE.md` |

**This document does not authorize implementation or demo execution.** It defines what a Phase 1 demo MUST prove, how it MUST remain truthful, and how it maps to frozen scope and QA acceptance cases.

---

## 2. Purpose

Establish a trustworthy Demo Planning contract that shows how ZyntixAI demonstrates real Phase 1 value through:

- verified workflows and outcomes;
- evidence-backed states;
- human-controlled AI;
- correct Customer/Enrollment semantics;
- authoritative Attention review;
- safe NBA behavior;
- QA-mapped scenarios;

without presenting unfinished functionality as live product behavior.

---

## 3. Demo Truthfulness Standard

Every demo claim MUST be classified:

| Class | Meaning |
| ----- | ------- |
| `IMPLEMENTED` | Feature exists in running build; demo shows real behavior |
| `SPECIFIED_NOT_IMPLEMENTED` | Frozen in product/UX docs; not yet built |
| `IMPLEMENTATION_DEPENDENT` | Requires L5/L6/L7 or desktop backend before live demo |
| `DEMO_ONLY_DATA` | Seed/fixture data for narrative; disclosed as demo data |
| `PROHIBITED_CLAIM` | Must never be stated or implied in demo |

**Rule:** `SPECIFIED_NOT_IMPLEMENTED` and `IMPLEMENTATION_DEPENDENT` MUST NOT be presented as `IMPLEMENTED`.

At Phase 1 planning time, **all interactive demo surfaces are `IMPLEMENTATION_DEPENDENT`** until Computer 1 delivers L5+ implementation. Planning defines the contract for when implementation exists.

---

## 4. Audience

| Audience | Primary? | Demo Type | Purpose |
| -------- | -------- | --------- | ------- |
| Course seller / business owner | **Yes** | PRODUCT DEMO, BETA WALKTHROUGH | Prove daily operational value (O1–O10) |
| Internal QA / product review | Yes | QA DEMO | Validate QA case coverage |
| Beta tester (future) | Secondary | BETA WALKTHROUGH | Repeatable critical journeys |
| Implementation review (Computer 1) | Secondary | QA DEMO | Confirm L5/L6/L7 alignment with frozen contracts |
| Investor / marketing | **No** | — | Out of scope for Phase 1 demo planning; no unsupported claims |

Do not mix investor/marketing claims into product demo narratives.

---

## 5. Demo Goals (Frozen Outcomes)

The demo MUST prove these Phase 1 outcomes (`PHASE-1-LAUNCH-SCOPE.md` §5):

| Outcome | Demo proof intent |
| ------- | ----------------- |
| O1 | Owner sees what needs attention today |
| O2 | Priority follow-ups across leads/customers identifiable |
| O3 | Customer context centralized; reduced tool-hopping |
| O4 | Program/enrollment relationship understandable |
| O5 | Progress visible for human review |
| O6 | Daily work prioritizable from one overview |
| O7 | Conversation prep faster with relevant context |
| O8 | Next actions explicit, explainable, human-controlled |
| O9 | AI grounded; no fabricated facts |
| O10 | Onboarding/follow-up less likely forgotten |

---

## 6. Demo Types

| Type | When used | Disclosure |
| ---- | --------- | ---------- |
| `PRODUCT DEMO` | Stakeholder walkthrough of value proposition | Implementation status per scenario |
| `BETA WALKTHROUGH` | Repeatable journey for beta testers | Same as product demo + QA case IDs |
| `QA DEMO` | Acceptance verification | Links to `PHASE-1-QA-ACCEPTANCE-CONTRACT.md` cases |
| `STAKEHOLDER DEMO` | Not authorized for external marketing claims | — |

---

## 7. Critical Demo Journey (Integrity Chain)

**Mandatory end-to-end narrative** — maps to QA-P1-160–166:

```text
Program (reference)
  → Enrollment (customer–program link)
    → Progress evidence (enrollment-scoped)
      → Attention candidate (evidence-backed)
        → Attention Item (authoritative review)
          → NBA recommendation (optional branch)
            → Human review & disposition
              → Human action (task/intervention)
```

| Step | Actor | Screen(s) | Prohibited claim |
| ---- | ----- | --------- | ---------------- |
| Program context | Coach/Owner | SCR-014, SCR-015 | "Program tracks customer progress" |
| Enrollment | Coach/Owner | SCR-010, SCR-011 | Customer-level universal progress |
| Progress | Coach/Owner | SCR-011, SCR-005 | Fabricated %; unknown → zero |
| Attention | Business Owner | SCR-008, SCR-009 | Autonomous risk fix; duplicate queues |
| NBA | Business Owner | SCR-012, SCR-013 | AI auto-executes recommendation |
| Action | Coach/Owner | SCR-007, contextual | Silent consequential change |

Full scenario detail: `PHASE-1-DEMO-SCENARIO-MATRIX.md` §4 (DEMO-CRIT-001).

---

## 8. Recommended Demo Sequence

Evidence-derived narrative (not a click script):

| Step | Scenario ID | Duration | Outcomes |
| ---- | ----------- | -------- | -------- |
| 1 | DEMO-A-001 Morning Command Center | 1–2 min | O6, O1 |
| 2 | DEMO-C-001 Attention review | 2–3 min | O1, O2 |
| 3 | DEMO-B-001 Multi-enrollment customer | 2–3 min | O3, O4, O5 |
| 4 | DEMO-E-001 Progress unknown | 1 min | O5, O9 |
| 5 | DEMO-D-001 NBA human review | 2 min | O8, O9 |
| 6 | DEMO-F-001 Lead handoff (optional) | 2 min | O2, O3 |
| 7 | DEMO-NEG-001 Controlled negative | 1 min | Integrity proof |

**Total recommended:** 10–14 minutes core path; 16–18 with optional WF2.

Sequence preserves F001 (step 3), F002 (step 2), F003 (step 1).

---

## 9. Integrity Rules in Demo (Non-Negotiable)

| Rule | Source | Demo requirement |
| ---- | ------ | ---------------- |
| F001 | IA §13 | Multi-enrollment fan-out explicit; count unit declared |
| F002 | State §4.1 | At Risk references Attention Item; no duplicate authority |
| F003 | IA §13 | Task ≠ Attention ≠ NBA buckets; no universal score |
| Unknown ≠ zero | State §6; UXS-10 | Missing progress → Unknown, not 0% |
| Human gate | S9, S13 | No autonomous external action or NBA execution |
| Tenant boundary | DoD §4 | Single-tenant demo data only; no cross-tenant narrative |

---

## 10. QA-GAP Handling in Demo

| Gap | Demo impact | Required handling |
| --- | ----------- | ----------------- |
| QA-GAP-001 | Program list counts | Avoid ambiguous active/all claim; label unit if shown; else omit count |
| QA-GAP-002 | Tenant isolation proof | Demo uses single-tenant fixture; do NOT claim adversarial RLS proof |

---

## 11. Implementation Ownership Boundary

| Surface | Owner | Demo planning stance |
| ------- | ----- | -------------------- |
| L5 Command Center shell | Computer 1 | DEMO-A scenarios `DEPENDS ON L5` |
| L6 Attention detection | Computer 1 | DEMO-C scenarios `DEPENDS ON L6` |
| L7 NBA ranking | Computer 1 | DEMO-D scenarios `DEPENDS ON L7` |
| Persistence, RLS, API | Computer 1 | All live demos `DEPENDS ON DESKTOP BACKEND` |
| Product/UX/QA/Demo docs | Laptop | This contract |

Demo planning does not begin desktop implementation.

---

## 12. Beta Reuse Strategy (Summary)

Demo scenarios map 1:1 to future:

- beta tester onboarding tasks;
- manual QA scripts (`PHASE-1-QA-EXECUTION-RESULTS-TEMPLATE.md`);
- regression journeys on critical chain;
- stakeholder walkthrough checklists.

Detail: `PHASE-1-DEMO-READINESS-GATE.md` §8.

---

## 13. What Demo Planning Does Not Do

- Implement UI, routes, or backend
- Create seed scripts or fake API responses
- Resolve QA-GAP-001 or QA-GAP-002
- Expand Phase 1 scope
- Invent ranking, risk scores, or autonomous AI
- Produce marketing copy
