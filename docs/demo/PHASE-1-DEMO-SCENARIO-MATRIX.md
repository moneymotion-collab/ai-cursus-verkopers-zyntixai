# ZyntixAI Phase 1 Demo Scenario Matrix

## 1. Purpose

Maps demo scenarios to workflows, screens, lifecycle stages, QA cases, and readiness. Companion to `PHASE-1-DEMO-STRATEGY.md`.

---

## 2. Scenario Summary

| Scenario ID | Type | Title | Mandatory | Readiness | Primary QA |
| ----------- | ---- | ----- | --------- | --------- | ---------- |
| DEMO-A-001 | A | Morning Command Center buckets | Yes | IMPLEMENTATION_DEPENDENT | QA-P1-001, 008, 140 |
| DEMO-B-001 | B | Multi-enrollment customer fan-out | Yes | IMPLEMENTATION_DEPENDENT | QA-P1-006, 007, 051 |
| DEMO-C-001 | C | Attention review (F002) | Yes | IMPLEMENTATION_DEPENDENT | QA-P1-082–085 |
| DEMO-D-001 | D | NBA human review | Yes | IMPLEMENTATION_DEPENDENT | QA-P1-090–092 |
| DEMO-E-001 | E | Progress unknown state | Yes | IMPLEMENTATION_DEPENDENT | QA-P1-061, 174 |
| DEMO-F-001 | F | Lead to customer handoff | Optional | IMPLEMENTATION_DEPENDENT | QA-P1-020–023 |
| DEMO-NEG-001 | Negative | Duplicate concern / stale evidence | Yes | IMPLEMENTATION_DEPENDENT | QA-P1-083, 190 |
| DEMO-CRIT-001 | Chain | Full integrity chain | Yes | IMPLEMENTATION_DEPENDENT | QA-P1-160–166 |

---

## 3. DEMO-A-001 — Morning Command Center (F003)

| Field | Value |
| ----- | ----- |
| Demo type | PRODUCT DEMO, QA DEMO |
| Actor | Business Owner |
| Entry | SCR-001 |
| Workflows | WF7 |
| Outcomes | O1, O6 |
| Dependency | DEPENDS ON L5 |

**Show:** Separate buckets (tasks overdue, attention open, NBA awaiting review, lead follow-ups, onboarding gaps). Count units declared per bucket.

**Must NOT show:** Universal "#1 priority" across types; hidden cross-domain score; CC owning dismiss/resolve.

| Transition | State | Screen | QA |
| ---------- | ----- | ------ | -- |
| Open day | — | SCR-001 | 140 |
| Review buckets | Loaded regions | SCR-001 | 001, 008 |
| Drill to Attention | Reference only | SCR-008 | 002 |
| Drill to Tasks | Reference only | SCR-006 | 002 |

---

## 4. DEMO-B-001 — Multi-Enrollment Customer (F001)

| Field | Value |
| ----- | ----- |
| Actor | Coach / Owner |
| Entry | SCR-001 or SCR-004 → SCR-005 |
| Workflows | WF3, WF5 |
| Outcomes | O3, O4, O5 |
| Dependency | DEPENDS ON L5 |

**Data:** Customer `CUST-DEMO-01` with Enrollment `ENR-DEMO-01` (Program A, Active) and `ENR-DEMO-02` (Program B, Stalled progress).

**Show:** Two enrollment lines in CC or Customer 360; fan-out explicit ("2 enrollments need review"); drill to SCR-010/011 per enrollment.

**Must NOT show:** Two customer problems; merged customer progress bar; undeclared count unit.

| QA cases | 006, 007, 051, 060, 064 |

---

## 5. DEMO-C-001 — Attention Review (F002)

| Field | Value |
| ----- | ----- |
| Actor | Business Owner |
| Entry | SCR-001 → SCR-008 → SCR-009 |
| Workflows | WF6 |
| Lifecycle | LCS-15 → LCS-16 |
| Outcomes | O1, O2 |
| Dependency | DEPENDS ON L5, L6 |

**Data:** Enrollment `ENR-DEMO-01` shows `At Risk`; Attention Item `ATT-DEMO-01` open with evidence (stalled progress signal).

**Show:** Single authoritative Attention lifecycle; evidence on SCR-009; dismiss/resolve via UXS-13.

**Must NOT show:** Second parallel queue; At Risk without Attention reference; auto-resolve.

| Sub-case | Proof | QA |
| -------- | ----- | -- |
| At Risk + open Attention | One lifecycle | 082 |
| Resolve Attention | At Risk clears | 085 |
| Distinct concerns | Two items if data supports | 084 |

---

## 6. DEMO-D-001 — NBA Human Review

| Field | Value |
| ----- | ----- |
| Actor | Business Owner |
| Entry | SCR-012 → SCR-013 |
| Workflows | WF10 |
| Lifecycle | LCS-17 |
| Outcomes | O8, O9 |
| Dependency | DEPENDS ON L5, L7 |

**Show:** Recommendation with rationale + evidence links; accept/defer/dismiss; UXS-13 on accept.

**Must NOT show:** Auto-execution; recommendation without rationale; self-regenerating loop after dismiss.

| QA cases | 090, 091, 092, 093, 165 |

---

## 7. DEMO-E-001 — Progress Unknown

| Field | Value |
| ----- | ----- |
| Actor | Coach / Owner |
| Entry | SCR-011 (enrollment with no progress evidence) |
| Workflows | WF5 |
| Outcomes | O5, O9 |
| Dependency | DEPENDS ON L5 |

**Show:** UXS-10 / Unknown progress state on enrollment `ENR-DEMO-03`.

**Must NOT show:** 0% progress; Healthy without evidence.

| QA cases | 061, 174 |

---

## 8. DEMO-F-001 — Lead to Customer Handoff

| Field | Value |
| ----- | ----- |
| Actor | Sales Operator |
| Entry | SCR-002 → SCR-003 → handoff → SCR-005 |
| Workflows | WF2 |
| Lifecycle | LCS-07 → LCS-08 |
| Outcomes | O2, O3 |
| Dependency | DEPENDS ON L5 |

**Show:** Won lead preserves notes; Customer 360 shows handoff banner; Lead ≠ Customer.

**Must NOT show:** Zero-context customer; merged Lead/Customer ID.

| QA cases | 020, 021, 022, 023 |

---

## 9. DEMO-NEG-001 — Controlled Negative Path

| Field | Value |
| ----- | ----- |
| Purpose | Prove safe failure behavior |
| Dependency | DEPENDS ON L5/L6 |

| Negative | User sees | System must NOT | QA |
| -------- | --------- | --------------- | -- |
| Duplicate same concern | One Attention item | Inflate to two authoritative items | 083 |
| Stale attention evidence | Stale indicator or exclusion | Act as current without warning | 190, 005 |
| Insufficient AI context | UXS-10 decline/uncertainty | Fabricated answer | 136 |
| Unsupported AI execute request | Decline + human gate | Autonomous send | 133 |

---

## 10. DEMO-CRIT-001 — Full Integrity Chain

| Step | Entity | State | Screen | QA |
| ---- | ------ | ----- | ------ | -- |
| 1 | Program `PROG-DEMO-01` | Reference | SCR-015 | 160 |
| 2 | Enrollment `ENR-DEMO-01` | Active | SCR-011 | 160 |
| 3 | Progress | Stalled (evidence) | SCR-011 | 161 |
| 4 | Attention candidate | LCS-15 | — | 162 |
| 5 | Attention Item | Open | SCR-009 | 163 |
| 6 | NBA (optional) | Recommended | SCR-013 | 164 |
| 7 | Human action | Task created / intervention | SCR-007 | 165 |
| 8 | Evidence chain | Traceable | All | 166 |

**Prohibited:** Accepting step 7 because "AI said so" without evidence chain.

---

## 11. Workflow Demo Coverage (WF1–WF10)

| Workflow | Demo Required? | Scenario | Screen(s) | QA Cases | Status |
| -------- | -------------- | -------- | --------- | -------- | ------ |
| WF1 Lead to Follow-Up | Partial | Background in DEMO-F prep | SCR-002, 003 | 010–012 | PARTIAL DEMO |
| WF2 Lead to Customer Handoff | Optional full | DEMO-F-001 | SCR-003, 005 | 020–023 | FULL DEMO |
| WF3 Customer to Enrollment | Yes | DEMO-B-001 | SCR-005, 010, 011 | 032, 050 | FULL DEMO |
| WF4 Onboarding Visibility | Background | DEMO-A bucket | SCR-001, 012 | 120–122 | BACKGROUND ONLY |
| WF5 Progress Review | Yes | DEMO-B, DEMO-E | SCR-011 | 060–064, 150 | FULL DEMO |
| WF6 Attention to Intervention | Yes | DEMO-C-001 | SCR-008, 009 | 080–088 | FULL DEMO |
| WF7 Morning Prioritization | Yes | DEMO-A-001 | SCR-001 | 140–141 | FULL DEMO |
| WF8 Conversation Preparation | Partial | Extension scenario | SCR-016 | 110–111 | IMPLEMENTATION_DEPENDENT |
| WF9 Task Completion | Background | DEMO-CRIT-001 step 7 | SCR-006, 007 | 070–071 | PARTIAL DEMO |
| WF10 NBA Review | Yes | DEMO-D-001 | SCR-012, 013 | 090–095 | FULL DEMO |

---

## 12. Demo-to-Screen Traceability

| Scenario | Screen IDs | Entry | Exit |
| -------- | ---------- | ----- | ---- |
| DEMO-A-001 | SCR-001, 006, 008, 012 | SCR-001 | Drill-down target |
| DEMO-B-001 | SCR-001, 004, 005, 010, 011 | SCR-001 or SCR-004 | SCR-011 |
| DEMO-C-001 | SCR-001, 008, 009 | SCR-008 | SCR-009 post-disposition |
| DEMO-D-001 | SCR-012, 013 | SCR-012 | SCR-013 post-disposition |
| DEMO-E-001 | SCR-011 | SCR-010 or SCR-005 | SCR-011 |
| DEMO-F-001 | SCR-002, 003, 005 | SCR-002 | SCR-005 |
| DEMO-CRIT-001 | SCR-015, 011, 009, 013, 007 | SCR-001 | SCR-007 |

---

## 13. Demo-to-QA Traceability (Consolidated)

| Demo Scenario | QA Case IDs | Proof intent |
| ------------- | ----------- | ------------ |
| DEMO-A-001 | 001, 002, 008, 140, 141 | CC references, F003 buckets, human choice |
| DEMO-B-001 | 006, 007, 051, 060, 064 | F001 fan-out, enrollment-scoped progress |
| DEMO-C-001 | 082, 083, 084, 085, 081 | F002 authority, evidence, disposition |
| DEMO-D-001 | 090–095, 165 | NBA human gate, rationale, no auto-exec |
| DEMO-E-001 | 061, 174 | Unknown ≠ zero |
| DEMO-F-001 | 020–023 | Handoff integrity, Lead ≠ Customer |
| DEMO-NEG-001 | 083, 136, 133, 190 | Safe negative behavior |
| DEMO-CRIT-001 | 160–166 | Full evidence chain |

---

## 14. Demo-to-Workflow / Lifecycle Traceability

| Scenario | Workflows | Lifecycle stages |
| -------- | --------- | ---------------- |
| DEMO-A-001 | WF7 | — |
| DEMO-B-001 | WF3, WF5 | LCS-09, LCS-12, LCS-13 |
| DEMO-C-001 | WF6 | LCS-15, LCS-16, LCS-18 |
| DEMO-D-001 | WF10 | LCS-17 |
| DEMO-E-001 | WF5 | LCS-13 |
| DEMO-F-001 | WF2 | LCS-07, LCS-08 |
| DEMO-CRIT-001 | WF3, WF5, WF6, WF10, WF9 | LCS-09→17 |

---

## 15. Time Budget

| Scenario | Recommended duration |
| -------- | -------------------- |
| DEMO-A-001 | 1–2 min |
| DEMO-B-001 | 2–3 min |
| DEMO-C-001 | 2–3 min |
| DEMO-D-001 | 2 min |
| DEMO-E-001 | 1 min |
| DEMO-F-001 | 2 min (optional) |
| DEMO-NEG-001 | 1 min |
| DEMO-CRIT-001 | 5–8 min (full chain walkthrough) |

---

## 16. F001 / F002 / F003 Demo Preservation Checklist

| Rule | Scenario | Verification question |
| ---- | -------- | --------------------- |
| F001 | DEMO-B-001 | Are two enrollments explicitly shown, not two customers? |
| F002 | DEMO-C-001 | Is At Risk tied to one Attention Item lifecycle? |
| F003 | DEMO-A-001 | Are buckets separate with no universal score? |
