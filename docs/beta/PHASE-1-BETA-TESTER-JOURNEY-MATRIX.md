# ZyntixAI Phase 1 Beta Tester Journey Matrix

## 1. Purpose

Maps beta tasks, workflows, tester profiles, QA cases, and demo reuse. Companion to `PHASE-1-BETA-PLAN.md`.

---

## 2. Workflow Beta Coverage (WF1–WF10)

| Workflow | Must test? | Profile | Beta Task(s) | QA mapping | Status |
| -------- | ---------- | ------- | ------------ | ---------- | ------ |
| WF1 Lead follow-up | MANDATORY | Sales Operator | BETA-TASK-010 | QA-P1-010–012 | NOT READY |
| WF2 Handoff | MANDATORY | Sales Operator | BETA-TASK-011 | QA-P1-020–023 | NOT READY |
| WF3 Enrollment context | MANDATORY | Coach/Owner | BETA-TASK-020, 030 | QA-P1-032, 050 | NOT READY |
| WF4 Onboarding | OPTIONAL | Coach/Owner | BETA-TASK-021 | QA-P1-120–122 | NOT READY |
| WF5 Progress review | MANDATORY | Coach/Owner | BETA-TASK-022, 040 | QA-P1-060–064 | NOT READY |
| WF6 Attention | MANDATORY | Business Owner | BETA-TASK-030, 031 | QA-P1-080–088 | NOT READY |
| WF7 Morning prioritization | MANDATORY | Business Owner | BETA-TASK-001 | QA-P1-140–141 | NOT READY |
| WF8 Conversation prep | OPTIONAL | Coach/Owner | BETA-TASK-023 | QA-P1-110–111 | NOT READY |
| WF9 Task continuity | MANDATORY | All | BETA-TASK-012 | QA-P1-070–071 | NOT READY |
| WF10 NBA review | MANDATORY | Business Owner | BETA-TASK-032 | QA-P1-090–095 | NOT READY |

---

## 3. Critical Beta Journey — BETA-JOURNEY-CRIT-001

```text
Program → Enrollment → Progress → Attention → NBA → Human Review → Action
```

| Step | Actor | Precondition | Screen | Action | Expected | QA | Evidence |
| ---- | ----- | ------------ | ------ | ------ | -------- | -- | -------- |
| 1 Program ref | Coach | PROG-DEMO-01 exists | SCR-015 | View program | Program ≠ enrollment | 160 | Screenshot |
| 2 Enrollment | Coach | CUST-DEMO-01 multi-enr | SCR-011 | Open ENR-DEMO-01 | Enrollment-scoped state | 160, 050 | Screenshot |
| 3 Progress | Coach | Stalled evidence | SCR-011 | Review progress | Stalled visible; not customer % | 161, 060 | Screenshot |
| 4 Attention | System→Owner | LCS-15 candidate | SCR-008→009 | Review item | Evidence + reason | 162, 081 | Recording |
| 5 NBA (opt) | Owner | Post-attention | SCR-012→013 | Review rec | Rationale + evidence | 164, 091 | Screenshot |
| 6 Human review | Owner | — | SCR-009/013 | Disposition | UXS-13 if consequential | 163, 092 | Screenshot |
| 7 Action | Coach | Accepted NBA/task | SCR-007 | Complete task | Human-executed; not auto | 165 | Screenshot |

**Tasks:** BETA-TASK-030, 031, 032, 012 (chain). **Failure severity:** P1 if chain breaks.

---

## 4. F001 — Multi-Enrollment (BETA-TASK-020)

| Field | Value |
| ----- | ----- |
| Profile | Coach / Business Owner |
| Preconditions | CUST-DEMO-01; ENR-DEMO-01 (stalled); ENR-DEMO-02 (healthy); ENR-DEMO-03 (unknown) |
| Screens | SCR-001 or SCR-005 → SCR-010/011 |
| Action | Locate customer; verify fan-out; drill per enrollment |
| Expected | Count unit declared; 2 concerns not 2 customers; ENR-03 shows Unknown not 0% |
| QA | 006, 007, 051, 061, 064 |
| Stop if | Customer/enrollment conflation (DEMO-FAIL-004) |

---

## 5. F002 — Attention Authority (BETA-TASK-030, 031)

| Case | Setup | Expected | QA |
| ---- | ----- | -------- | -- |
| A | E1 At Risk + ATT open | One lifecycle | 082 |
| B | Duplicate same concern | No duplicate items | 083 |
| C | Two distinct concerns | Both visible | 084 |
| D | Resolve ATT | At Risk clears | 085 |

---

## 6. F003 — Cross-Domain Buckets (BETA-TASK-001)

| Field | Value |
| ----- | ----- |
| Profile | Business Owner |
| Screen | SCR-001 |
| Setup | 1 overdue task + 1 attention + 1 NBA |
| Expected | Separate buckets; no universal score; human drill-down |
| QA | 001, 008, 140 |
| Stop if | Hidden cross-domain ranking (DEMO-FAIL-003) |

---

## 7. Unknown State (BETA-TASK-040)

| Field | Value |
| ----- | ----- |
| Profile | Coach |
| Screen | SCR-011 (ENR-DEMO-03) |
| Expected | UXS-10 / Unknown — NOT 0% progress |
| QA | 061, 174 |
| Comprehension | Tester confirms "no data" ≠ "zero progress" |

---

## 8. AI Boundary (BETA-TASK-050, 051)

| Task | Action | Expected | QA |
| ---- | ------ | -------- | -- |
| BETA-TASK-050 | Request grounded draft with context | Traceable output; human review gate | 134, 135 |
| BETA-TASK-051 | Request with insufficient context | Decline/uncertainty UXS-10 | 136 |
| BETA-TASK-052 | Request autonomous send | Refused; no execution | 133, 139 |

---

## 9. Beta Tester Task Register

| Task ID | Title | Profile | WF | QA Cases | Demo reuse | Severity if fail |
| ------- | ----- | ------- | -- | -------- | ---------- | ---------------- |
| BETA-TASK-001 | Morning Command Center buckets | Business Owner | WF7 | 001, 008, 140 | DEMO-A-001 | P1 |
| BETA-TASK-010 | Lead follow-up | Sales Operator | WF1 | 010–012 | — | P1 |
| BETA-TASK-011 | Lead→Customer handoff | Sales Operator | WF2 | 020–023 | DEMO-F-001 | P1 |
| BETA-TASK-012 | Task complete + continuity | All | WF9 | 070–071 | DEMO-CRIT step 7 | P1 |
| BETA-TASK-020 | Multi-enrollment fan-out | Coach/Owner | WF3,5 | 006, 007, 051 | DEMO-B-001 | P1 |
| BETA-TASK-021 | Onboarding visibility | Coach | WF4 | 120–122 | Background | P2 |
| BETA-TASK-022 | Progress stalled review | Coach | WF5 | 060, 150 | DEMO-B | P1 |
| BETA-TASK-023 | Conversation prep | Coach | WF8 | 110–111 | Partial DEMO-GAP-001 | P2 |
| BETA-TASK-030 | Attention review | Business Owner | WF6 | 082–085 | DEMO-C-001 | P1 |
| BETA-TASK-031 | Attention negative duplicate | Business Owner | WF6 | 083 | DEMO-NEG-001 | P1 |
| BETA-TASK-032 | NBA human review | Business Owner | WF10 | 090–092 | DEMO-D-001 | P1 |
| BETA-TASK-040 | Progress unknown | Coach | WF5 | 061, 174 | DEMO-E-001 | P1 |
| BETA-TASK-050 | AI grounded draft | Coach/Owner | S13 | 134–135 | — | P1 |
| BETA-TASK-051 | AI insufficient context | Coach/Owner | S13 | 136 | DEMO-NEG | P0 |
| BETA-TASK-052 | AI execute refusal | Owner | S13 | 133 | DEMO-NEG | P0 |

---

## 10. QA-to-Beta Traceability (Critical)

| Beta Task | QA Cases | QA status required before beta? |
| --------- | -------- | ------------------------------- |
| BETA-TASK-001 | 001, 008, 140 | Yes — pre-beta PASS on subset |
| BETA-TASK-020 | 006, 007, 051 | Yes |
| BETA-TASK-030 | 082–085 | Yes |
| BETA-TASK-032 | 090–092 | Yes |
| BETA-TASK-040 | 061, 174 | Yes |
| BETA-TASK-050–052 | 133–139 | Yes |

Pre-beta: Internal QA executes mapped cases **before** external testers (BETA-ENTRY-009).

---

## 11. Demo-to-Beta Reuse

| Demo Scenario | Beta Task | Reuse type | Dependency |
| ------------- | --------- | ---------- | ---------- |
| DEMO-A-001 | BETA-TASK-001 | Exact journey | L5 |
| DEMO-B-001 | BETA-TASK-020 | Exact journey | L5 |
| DEMO-C-001 | BETA-TASK-030 | Exact journey | L5, L6 |
| DEMO-D-001 | BETA-TASK-032 | Exact journey | L5, L7 |
| DEMO-E-001 | BETA-TASK-040 | Exact journey | L5 |
| DEMO-F-001 | BETA-TASK-011 | Exact journey | L5 |
| DEMO-CRIT-001 | BETA-JOURNEY-CRIT-001 | Full chain | L5, L6, L7 |
| DEMO-NEG-001 | BETA-TASK-031, 051, 052 | QA-assisted | L5, L6 |

---

## 12. Beta Task Schema (per task)

Every task MUST document: Beta Task ID, Tester Profile, Workflow, Preconditions, Starting State, Action, Expected Result, Evidence Capture (screenshot/recording/note), QA Mapping, Failure Severity, Stop Condition (where applicable).

---

## 13. Beta-to-Launch Handoff (Preview)

| Beta evidence | Launch gate | Required |
| ------------- | ----------- | -------- |
| BETA-RUN results | LAUNCH-GATE-014 | Yes |
| F001–F003 task PASS | LAUNCH-GATE-019–021 | Yes |
| Security findings | LAUNCH-GATE-017 | Yes |
| Defect closure log | LAUNCH-GATE-013 | Yes |
| Build SHA | LAUNCH-GATE-031 | Yes |

Detail: `PHASE-1-BETA-EXIT-SIGNOFF-TEMPLATE.md`
