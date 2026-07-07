# ZyntixAI Phase 1 Demo Readiness Gate

## 1. Purpose

Defines scenario readiness levels, claim control, implementation dependencies, demo failure conditions, and beta reuse mapping.

Companion: `PHASE-1-DEMO-STRATEGY.md`, `PHASE-1-DEMO-SCENARIO-MATRIX.md`, `PHASE-1-DEMO-DATA-CONTRACT.md`.

---

## 2. Readiness Levels

| Level | Meaning |
| ----- | ------- |
| `READY` | Implementation exists; data contract satisfied; claims allowed; QA mapped |
| `READY WITH DISCLOSURE` | Runnable with explicit limitation disclosure (e.g. QA-GAP) |
| `IMPLEMENTATION_DEPENDENT` | Specified; not yet runnable |
| `BLOCKED` | Cannot demo until dependency or gap resolved |
| `OUT OF SCOPE` | Not Phase 1 |

**Current planning baseline:** All interactive scenarios are `IMPLEMENTATION_DEPENDENT` until L5+ and desktop backend exist.

---

## 3. Scenario Readiness Matrix

| Scenario | Readiness | Blocker | Disclosure required |
| -------- | --------- | ------- | ------------------- |
| DEMO-A-001 | IMPLEMENTATION_DEPENDENT | L5 | "Command Center shell pre-ranking buckets" |
| DEMO-B-001 | IMPLEMENTATION_DEPENDENT | L5 | F001 fan-out behavior |
| DEMO-C-001 | IMPLEMENTATION_DEPENDENT | L5, L6 | Evidence-backed attention |
| DEMO-D-001 | IMPLEMENTATION_DEPENDENT | L5, L7 | Human-reviewed NBA |
| DEMO-E-001 | IMPLEMENTATION_DEPENDENT | L5 | Unknown progress state |
| DEMO-F-001 | IMPLEMENTATION_DEPENDENT | L5 | Handoff preservation |
| DEMO-NEG-001 | IMPLEMENTATION_DEPENDENT | L5, L6 | Negative path behavior |
| DEMO-CRIT-001 | IMPLEMENTATION_DEPENDENT | L5, L6, L7 | Full chain |

---

## 4. Implementation Dependency Matrix

| Scenario | L5 | L6 | L7 | Desktop Backend | QA Gap |
| -------- | -- | -- | -- | --------------- | ------ |
| DEMO-A-001 | ✓ | — | — | ✓ | — |
| DEMO-B-001 | ✓ | — | — | ✓ | — |
| DEMO-C-001 | ✓ | ✓ | — | ✓ | — |
| DEMO-D-001 | ✓ | — | ✓ | ✓ | — |
| DEMO-E-001 | ✓ | — | — | ✓ | — |
| DEMO-F-001 | ✓ | — | — | ✓ | — |
| DEMO-NEG-001 | ✓ | ✓ | — | ✓ | — |
| DEMO-CRIT-001 | ✓ | ✓ | ✓ | ✓ | — |
| Program count display | — | — | — | ✓ | QA-GAP-001 |
| Tenant adversarial proof | — | — | — | ✓ | QA-GAP-002 |

---

## 5. Claim Control Matrix

| Demo claim | Source | Status | Allowed? | Required disclosure |
| ---------- | ------ | ------ | -------- | ------------------- |
| "See what needs attention today" | O1, S8 | SPECIFIED_NOT_IMPLEMENTED | Yes, when built | — |
| "ZyntixAI automatically fixes customer risk" | — | PROHIBITED_CLAIM | **No** | — |
| "Surfaces evidence-backed items for human review" | S8, State §4.1 | SPECIFIED_NOT_IMPLEMENTED | Yes | Not autonomous |
| "AI sends messages for you" | S13 boundary | PROHIBITED_CLAIM | **No** | Human reviews all consequential action |
| "One priority score for everything" | F003 | PROHIBITED_CLAIM | **No** | Separate buckets pre-L5 |
| "Customer progress 73%" | S6 boundary | PROHIBITED_CLAIM | **No** | No universal % in Phase 1 |
| "Churn risk score 0.82" | State §4.1 | PROHIBITED_CLAIM | **No** | No risk engine |
| "Progress unknown — no reliable evidence" | State §6, UXS-10 | SPECIFIED_NOT_IMPLEMENTED | Yes | Integrity feature |
| "Two enrollments need review" (unit: enrollments) | F001 | SPECIFIED_NOT_IMPLEMENTED | Yes | Count unit explicit |
| "Tenant-isolated data" (live proof) | DoD §4 | IMPLEMENTATION_DEPENDENT | Only with desktop proof | QA-GAP-002 |
| "Grounded AI draft from your notes" | S13, P1-04/05 | SPECIFIED_NOT_IMPLEMENTED | Yes, when built | Human review required |
| "Scheduling/reminder platform" | S11 boundary | PROHIBITED_CLAIM | **No** | Out of scope |
| "Autonomous business operator" | S1 boundary | PROHIBITED_CLAIM | **No** | — |

---

## 6. Demo Readiness Gate Checklist

A scenario may move to `READY` only when ALL pass:

| # | Check |
| - | ----- |
| 1 | Scope valid (frozen Phase 1) |
| 2 | Implementation exists for required screens |
| 3 | Demo data contract records available (`PHASE-1-DEMO-DATA-CONTRACT.md`) |
| 4 | QA case mapping exists |
| 5 | No blocked dependency (or disclosure applied) |
| 6 | All claims in matrix allowed |
| 7 | Demo path stable (no undocumented routes) |
| 8 | No known P0/P1 defect on scenario path |
| 9 | F001/F002/F003 preserved if applicable |
| 10 | Disclosure applied for QA-GAP or impl-dependent items |

---

## 7. Demo Failure Register

| Failure ID | Failure | Severity | Required action |
| ---------- | ------- | -------- | --------------- |
| DEMO-FAIL-001 | Unsupported feature shown as implemented | P0 | Stop demo; correct claim |
| DEMO-FAIL-002 | Fake AI output without disclosure | P0 | Stop demo; use real S13 or label fixture |
| DEMO-FAIL-003 | Hidden cross-domain ranking | P1 | Stop demo; restore bucket separation |
| DEMO-FAIL-004 | Customer/enrollment conflation | P1 | Stop demo; fix data/view |
| DEMO-FAIL-005 | Duplicate attention authority | P1 | Stop demo; deduplicate lifecycle |
| DEMO-FAIL-006 | Missing evidence presented as fact | P1 | Stop demo; show Unknown |
| DEMO-FAIL-007 | Stale data as current | P2 | Disclose or refresh |
| DEMO-FAIL-008 | Cross-tenant data visible | P0 | Stop demo immediately |
| DEMO-FAIL-009 | Demo requires unimplemented backend | P1 | Mark IMPLEMENTATION_DEPENDENT; do not run live |
| DEMO-FAIL-010 | Autonomous NBA/external action | P0 | Stop demo; enforce human gate |
| DEMO-FAIL-011 | Unknown shown as 0% progress | P1 | Stop demo; fix state display |
| DEMO-FAIL-012 | Program count without unit | P2 | Omit or disclose QA-GAP-001 |

---

## 8. QA-GAP Impact on Demo

### QA-GAP-001 — Program count semantics

| Impact | Mitigation |
| ------ | ---------- |
| SCR-014/015 count display | Omit count OR label unit explicitly OR disclose gap |
| Demo claim | Do not state "X active customers in program" without defined semantics |

### QA-GAP-002 — Desktop RLS adversarial proof

| Impact | Mitigation |
| ------ | ---------- |
| Tenant isolation demo | Use single-tenant fixture; do not claim adversarial verification |
| Beta/security narrative | Defer to Computer 1 evidence |

---

## 9. Beta Reuse Strategy

| Demo artifact | Beta reuse |
| ------------- | ---------- |
| DEMO-CRIT-001 | Primary beta onboarding journey |
| DEMO-A-001 | Day-1 "start here" task |
| DEMO-C-001 | Attention workflow training |
| DEMO-B-001 | Multi-enrollment education |
| DEMO-E-001 | Integrity/trust building ("honest unknowns") |
| DEMO-D-001 | NBA human-control training |
| DEMO-NEG-001 | Advanced beta — edge case awareness |
| Scenario matrix §11 WF table | Beta task checklist by workflow |
| Data contract §5 | Beta seed data specification for desktop |
| Failure register | Beta "stop and report" conditions |
| QA case IDs in matrix | Beta tester maps to `PHASE-1-QA-EXECUTION-RESULTS-TEMPLATE.md` |

---

## 10. Demo Planning Gap Register

| Gap ID | Domain | Missing item | Impact | Severity | Resolution |
| ------ | ------ | ------------ | ------ | -------- | ---------- |
| DEMO-GAP-001 | WF8 | Full conversation prep live demo | DEMO-WF8 partial only | P2 | Extend when SCR-016 implemented |
| DEMO-GAP-002 | Implementation | No runnable build at planning time | All scenarios planning-only | P2 | Desktop L5+ delivery |

**No P0/P1 demo planning gaps.**

---

## 11. No-Scope-Expansion Audit

| Potential expansion | Added? | Evidence |
| ------------------- | ------ | -------- |
| New product feature | NO | Scenarios trace to S1–S13, WF1–WF10 |
| New AI capability | NO | S13 boundary only |
| New queue | NO | Existing Attention/NBA/Task |
| New role | NO | Actor matrix only |
| New ranking | NO | F003 prohibits |
| New risk engine | NO | State §4.1 prohibits |
| New analytics | NO | — |
| New integration | NO | — |
| New database contract | NO | Data contract is planning fixture |
| New autonomous action | NO | Human gates throughout |

---

## 12. Pre-Execution Signoff (Future)

When implementation exists, demo executor MUST complete readiness gate §6 before public or beta demo.

Record in `PHASE-1-QA-EXECUTION-RESULTS-TEMPLATE.md` run header with `Contract version` = demo planning commit SHA.
