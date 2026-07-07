# ZyntixAI Phase 1 QA Acceptance Contract

## 1. Document Status

| Field | Value |
| ----- | ----- |
| Status | `AUTHORITATIVE — PHASE 1 ACCEPTANCE CONTRACT` |
| Target market | `Course Sellers` |
| Track owner | `Laptop Product Completion Track` |
| Branch | `parallel/laptop-product-track-20260707` |
| Parent evidence | L1–L4 product/UX freeze; L3.1-R1 integrity closure (`fb03ba8`) |
| Companion artifacts | `PHASE-1-QA-COVERAGE-MATRIX.md`, `PHASE-1-QA-EXECUTION-RESULTS-TEMPLATE.md` |

**This document does not authorize implementation.** It defines deterministic PASS/FAIL acceptance criteria for verifying Phase 1 against frozen product contracts.

---

## 2. Purpose

Convert frozen Phase 1 scope, lifecycle, IA, interaction, and UX specifications into an audit-grade QA acceptance system defining:

- what MUST work;
- for whom;
- under which preconditions;
- which evidence proves success;
- which negative cases MUST fail safely;
- which states MUST remain distinguishable;
- which permission assumptions MUST hold;
- which regressions are prohibited;
- which workflows are launch-blocking;
- how QA outcomes are recorded.

---

## 3. Evidence Hierarchy Applied

When sources conflict, precedence applied in this audit:

1. `PHASE-1-LAUNCH-SCOPE.md` (frozen scope)
2. `PHASE-1-SCOPE-DECISION-REGISTER.md`
3. `PHASE-1-DEFINITION-OF-DONE.md`
4. `COURSE-SELLER-STATE-MODEL.md`
5. `COURSE-SELLER-OPERATING-BLUEPRINT.md`
6. `COURSE-SELLER-OPERATING-DECISION-REGISTER.md`
7. `PHASE-1-IA-DECISION-REGISTER.md`
8. `PHASE-1-OBJECT-HIERARCHY.md`
9. `PHASE-1-CROSS-LIFECYCLE-INFORMATION-MODEL.md`
10. `PHASE-1-SCREEN-UX-BLUEPRINT.md`
11. `PHASE-1-INTERACTION-STATE-MODEL.md`
12. Supporting UX documents (`PHASE-1-NAVIGATION-MODEL.md`, queue/list patterns, etc.)

---

## 4. Identifier Registry Summary

| Identifier | Exact Name / Count | Source | Domain | Status |
| ---------- | ------------------ | ------ | ------ | ------ |
| P1-01 … P1-15 | Authoritative problem set | `PHASE-1-LAUNCH-SCOPE.md` §4 | Scope | VERIFIED |
| O1 … O10 | Product outcomes | `PHASE-1-LAUNCH-SCOPE.md` §5 | Scope | VERIFIED |
| S1 … S13 | Capability domains | `PHASE-1-LAUNCH-SCOPE.md` §6 | Scope | VERIFIED |
| WF1 … WF10 | End-to-end workflows | `PHASE-1-LAUNCH-SCOPE.md` §7 | Workflow | VERIFIED |
| LCS-01 … LCS-22 | Lifecycle stages | `COURSE-SELLER-OPERATING-BLUEPRINT.md` | Lifecycle | VERIFIED |
| SCR-001 … SCR-021 | Screens | `PHASE-1-SCREEN-INVENTORY.md` | Surface | VERIFIED |
| UXS-01 … UXS-15 | Interaction states | `PHASE-1-INTERACTION-STATE-MODEL.md` | Interaction | VERIFIED |
| IA-001 … IA-019+ | IA decisions | `PHASE-1-IA-DECISION-REGISTER.md` | IA | VERIFIED |
| OD-001 … OD-015+ | Operating decisions | `COURSE-SELLER-OPERATING-DECISION-REGISTER.md` | Product | VERIFIED |
| UX-001 … UX-015+ | UX decisions | `PHASE-1-UX-DECISION-REGISTER.md` | UX | VERIFIED |
| F001 | Command Center multi-enrollment fan-out | `PHASE-1-INFORMATION-ARCHITECTURE.md` §13 | Integrity | VERIFIED |
| F002 | At Risk vs Attention authority | `COURSE-SELLER-STATE-MODEL.md` §4.1 | Integrity | VERIFIED |
| F003 | Cross-domain incomparability | `PHASE-1-INFORMATION-ARCHITECTURE.md` §13 | Integrity | VERIFIED |
| L4.1 | — | — | — | NOT FOUND |
| Tenant | Organization boundary | `PHASE-1-LAUNCH-SCOPE.md` NFR; DoD §4 | Security | VERIFIED |

Full traceability matrices: `PHASE-1-QA-COVERAGE-MATRIX.md`.

---

## 5. Severity, Launch, and Dependency Models

### 5.1 Severity (from `PHASE-1-DEFINITION-OF-DONE.md` §9)

| Level | Meaning |
| ----- | ------- |
| P0 | Catastrophic — security breach, data isolation failure, destructive unrecoverable behavior |
| P1 | Critical — core workflow broken, invalid aggregate changes decisions, duplicate authority, broken evidence chain |
| P2 | Material defect — requires review before launch signoff |
| P3 | Minor / hygiene — may defer with record |

### 5.2 Launch Classification

| Class | Use when |
| ----- | -------- |
| LAUNCH_BLOCKER | Failure blocks `GO` per DoD §10 (typically P0/P1 on core flows) |
| BETA_BLOCKER | Blocks beta readiness but not necessarily all development |
| NON_BLOCKING | P2/P3 or cosmetic |
| DEFERRED | Out of Phase 1 scope or blocked by undefined contract |

### 5.3 Implementation Dependency

| Class | Meaning |
| ----- | ------- |
| AVAILABLE NOW | Contract testable at product-spec review |
| DEPENDS ON L5 | Command Center implementation shell/ordering |
| DEPENDS ON L6 | Attention detection/threshold mechanics |
| DEPENDS ON L7 | NBA ranking/scoring mechanics |
| DEPENDS ON DESKTOP BACKEND | RLS, persistence, API — technical verification on Computer 1 |
| BLOCKED BY UNDEFINED CONTRACT | Product contract gap — see Gap Register |

### 5.4 Automation Classification

| Class | Meaning |
| ----- | ------- |
| MANUAL | Human browser/observation required |
| AUTOMATABLE | Deterministic future automation candidate |
| HYBRID | Partial automation with human judgment |
| NOT AUTOMATABLE YET | Requires undefined implementation surface |

---

## 6. Canonical QA Case Schema

Every formal case in §7 uses:

| Field | Required |
| ----- | -------- |
| QA Case ID | Yes |
| Title | Yes |
| Source requirement | Yes |
| Scope / Workflow / Screen | Where applicable |
| Actor | Yes |
| Preconditions | Yes |
| Input / Trigger | Yes |
| Expected behavior | Yes |
| Expected state transition | Where applicable |
| Evidence required | Yes |
| Negative expectation | Where applicable |
| Pass criteria | Yes |
| Fail criteria | Yes |
| Severity if failed | Yes |
| Launch class | Yes |
| Regression boundary | Yes |
| Impl. dependency | Yes |
| Automation class | Yes |

**Acceptance language:** MUST, MUST NOT, SHALL, PASS IF, FAIL IF, BLOCKER IF.

---

## 7. Formal Acceptance Cases

### 7.1 S1 — Morning Command Center (SCR-001)

| ID | Title | Source | Actor | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ----- | ------- | ------- | --- | ------ | --- |
| QA-P1-001 | CC daily overview loads | S1; WF7; SCR-001 | Business Owner | Authorized user opens SCR-001; regions reference tasks, attention, leads, NBA without duplicating authoritative queues | Empty undifferentiated dump OR duplicate authoritative state | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-002 | CC references not substitutes | IA §13; SCR-001 | Business Owner | Drill-down navigates to authoritative queue/object owner | CC owns dismiss/resolve/accept for Attention or NBA | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-003 | CC initial loading state | UXS-01; UX-009 | Business Owner | First load shows UXS-01; MUST NOT show zero counts during load | Zero counts or fake empty during fetch | P2 | BETA_BLOCKER | DEPENDS ON L5 |
| QA-P1-004 | CC empty system vs empty day | UXS-03 | Business Owner | No data → UXS-03 guidance; data exists but none urgent → distinct messaging | "All clear" when no reliable evidence | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-005 | CC stale data indicator | UXS-08 | Business Owner | Stale references show refresh/caution per UXS-08 | Stale presented as current without indication | P2 | BETA_BLOCKER | DEPENDS ON L5 |

#### QA-P1-006 — F001 Scenario A: Single enrollment concern

| Field | Value |
| ----- | ----- |
| Source | F001; IA §13; `COURSE-SELLER-STATE-MODEL.md` |
| Actor | Business Owner |
| Preconditions | Customer A; 1 enrollment E1; 1 enrollment-scoped concern |
| Trigger | Open SCR-001 |
| Expected | Reference is enrollment-scoped; count unit declared (`enrollments` or `items`); drill-down → SCR-010/011 filtered to E1 |
| Pass IF | One concern visible; no customer-level progress merge; unit explicit |
| Fail IF | Concern hidden; inflated to multiple customers; unit undeclared |
| Severity | P1 |
| Launch | LAUNCH_BLOCKER |
| Regression | Progress remains enrollment-scoped |
| Dependency | DEPENDS ON L5 |
| Automation | HYBRID |

#### QA-P1-007 — F001 Scenario B: Multi-enrollment fan-out

| Field | Value |
| ----- | ----- |
| Preconditions | Customer A; 3 enrollments; 2 enrollment-scoped concerns across enrollments |
| Expected | Fan-out explicit (count or enumerated lines); MUST NOT present as 2 customer problems; MUST NOT collapse 2 distinct concerns |
| Pass IF | 2 concerns visible with enrollment identity; customer count ≠ concern count |
| Fail IF | Silent collapse OR customer inflation |
| Severity | P1 |
| Launch | LAUNCH_BLOCKER |
| Regression | Multi-enrollment fan-out rules preserved |
| Dependency | DEPENDS ON L5 |

#### QA-P1-008 — F003 Cross-domain incomparability

| Field | Value |
| ----- | ----- |
| Preconditions | 1 overdue task; 1 open Attention item; 1 NBA awaiting review |
| Expected | Regions/buckets separate; no universal numeric score ordering across types |
| Pass IF | User drills per bucket; no hidden cross-type ranking label (e.g. "#1 overall" mixing types) |
| Fail IF | Single merged priority score across task/attention/NBA |
| Severity | P1 |
| Launch | LAUNCH_BLOCKER |
| Regression | Pre-L5 buckets non-comparable |
| Dependency | DEPENDS ON L5 |

---

### 7.2 S2 — Leads (SCR-002, SCR-003) / WF1

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-010 | Lead list visibility | S2; WF1; SCR-002 | Authorized actor sees leads with status, last activity, next action context | Unauthorized tenant data visible | P0 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |
| QA-P1-011 | Lead detail context | S2; SCR-003 | Lead identity, notes, tasks, status traceable | Missing critical context without UXS-10 | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-012 | WF1 follow-up recorded | WF1; LCS-04 | Follow-up action/task recorded with lead link | Action lost after navigation | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-013 | Lead missing context | Exception flows; UXS-10 | Context Incomplete distinguishable; no fabricated qualification | Fake qualified state without evidence | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-014 | Lead filtered empty | UXS-04 | Filters exclude all → UXS-04 with clear-filters | UXS-03 when objects exist | P2 | NON_BLOCKING | DEPENDS ON L5 |

---

### 7.3 S2/S3 — WF2 Lead-to-Customer Handoff (SCR-003, SCR-005)

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-020 | Won lead handoff preserves history | WF2; OD-003; IA-005 | Won lead → Customer with preserved notes/history banner | Customer restarts with zero context | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-021 | Handoff without context blocked | Exception flows | Conversion without handoff context surfaces exception; UXS-13 for consequential handoff | Silent conversion losing notes | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-022 | Lead ≠ Customer identity | Object hierarchy | Lead and Customer remain distinct objects | Merged identity | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-023 | Handoff consequential confirm | UXS-13; UX-015 | Handoff requires UXS-13 confirmation with consequence summary | Handoff without confirmation | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |

---

### 7.4 S3 — Customer 360 (SCR-005) / WF3

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-030 | Customer 360 bounded hub | S3; SCR-005 | Shows identity, notes, enrollments, tasks, attention refs — bounded not enterprise CRM dump | Unbounded unrelated data | P2 | BETA_BLOCKER | DEPENDS ON L5 |
| QA-P1-031 | Customer tenant isolation | DoD §4; Launch NFR | Tenant A actor cannot open Tenant B customer | Cross-tenant record visible | P0 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |
| QA-P1-032 | WF3 enrollment context | WF3; S5 | Active enrollment(s) visible with lifecycle state | Ambiguous or missing enrollment | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-033 | Customer permission denied | UXS-09 | Unauthorized → UXS-09; no data leak | Partial record leaked | P0 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |

---

### 7.5 S4 — Programs (SCR-014, SCR-015)

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-040 | Program reference object | S4; SCR-014 | Program lists offers; links to enrollments | Program conflated with enrollment progress | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-041 | Program detail enrollment association | S4; SCR-015 | Program detail shows associated enrollments/customers | Customer-level progress aggregate on program | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-042 | Program count unit | S4; QA-GAP-001 | Count declares unit if shown | Silent active/all switch | P2 | NON_BLOCKING | BLOCKED BY UNDEFINED CONTRACT |

---

### 7.6 S5 — Enrollments (SCR-010, SCR-011)

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-050 | Enrollment customer-program link | S5; WF3 | Enrollment shows customer + program + lifecycle state | Missing association | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-051 | Multi-enrollment per customer | S5; F001 | Multiple enrollments listed separately | Collapsed to one synthetic enrollment | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-052 | Terminal enrollment exclusion | State model §4 | Completed/Ended excluded from active operational aggregates | Terminal counted as active | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-053 | Pause ≠ terminal | State model §11; OD-014 | Paused enrollment resumable to Active; not routed through LCS-20 | Pause treated as exit | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-054 | Enrollment pause record | Exception flows | Pause retains context; resume to LCS-12 | Context lost on pause | P2 | BETA_BLOCKER | DEPENDS ON L5 |

---

### 7.7 S6 — Progress / Engagement

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-060 | Progress enrollment-scoped | S6; F001 | Progress shown per enrollment | Customer-level universal % without definition | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-061 | Unknown progress | State model §6; UXS-10 | No evidence → Unknown/UXS-10; NOT zero | Missing evidence displayed as 0% or Healthy | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-062 | Stalled vs declining | State model §6 | Distinct states when evidence supports | All concerns labeled identical | P2 | BETA_BLOCKER | DEPENDS ON L6 |
| QA-P1-063 | Stale progress evidence | UXS-08 | Stale signals indicated; refresh available | Stale presented as current | P2 | BETA_BLOCKER | DEPENDS ON L5 |
| QA-P1-064 | Cross-enrollment non-merge | S6; F001 | Two enrollments' progress remain separate | Merged progress bar | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |

---

### 7.8 S7 — Tasks (SCR-006, SCR-007) / WF9

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-070 | Task due/overdue states | S7; State §8 | Due and Overdue distinguishable | Overdue hidden | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-071 | Task completion continuity | WF9 | Completed task preserves follow-up link/context | Work disappears | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-072 | Task vs business outcome | WF9 | Task complete ≠ enrollment complete ≠ attention resolved | Conflated terminal states | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-073 | Task linked context | S7 | Task shows linked lead/customer/enrollment where defined | Orphan task without context | P2 | BETA_BLOCKER | DEPENDS ON L5 |
| QA-P1-074 | Intra-domain task ordering | F003 | Overdue before upcoming within Tasks permitted | — | P3 | NON_BLOCKING | DEPENDS ON L5 |

---

### 7.9 S8 — Needs Attention (SCR-008, SCR-009) / WF6 / F002

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-080 | Attention queue authoritative | S8; IA §14 | SCR-008 is authoritative review surface | Parallel hidden queue | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-081 | Attention evidence required | S8; WF6 | Item shows reason + evidence context | Unexplained black-box alert | P1 | LAUNCH_BLOCKER | DEPENDS ON L6 |
| QA-P1-082 | F002 Case A: At Risk + open Attention | State §4.1 | E1 At Risk visible; A1 open → one authoritative lifecycle | Duplicate review queues | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-083 | F002 Case B: duplicate same concern | State §4.1 | Same concern → one Attention Item | Duplicate authoritative items | P1 | LAUNCH_BLOCKER | DEPENDS ON L6 |
| QA-P1-084 | F002 Case C: distinct concerns | State §4.1 | Stalled progress + missed onboarding → 2 items on same enrollment | Second concern suppressed | P1 | LAUNCH_BLOCKER | DEPENDS ON L6 |
| QA-P1-085 | F002 Case D: resolved Attention | State §4.1 | A1 resolved/dismissed → At Risk MUST NOT persist independently | Orphan At Risk badge | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-086 | Attention dismiss authority | Actor matrix | Dismiss requires Business Owner authority | Unauthorized dismiss | P1 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |
| QA-P1-087 | Attention dismiss confirm | UXS-13 | Dismiss uses UXS-13 | Silent dismiss | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-088 | No autonomous risk engine | State §4.1; S8 boundary | No separate churn score queue | Autonomous risk ranking | P1 | LAUNCH_BLOCKER | DEPENDS ON L6 |

---

### 7.10 S9 — Next Best Action (SCR-012, SCR-013) / WF10

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-090 | NBA review queue authoritative | S9; OD-015; IA §14 | SCR-012 authoritative; generation contextual | Self-generating review loop | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-091 | NBA evidence + rationale | S9; WF10 | Recommendation shows why + evidence | Recommendation without rationale | P1 | LAUNCH_BLOCKER | DEPENDS ON L7 |
| QA-P1-092 | NBA human review required | S9; LCS-17 | Accept/defer/dismiss requires human; UXS-13 on accept | Autonomous execution | P0 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-093 | NBA no self-loop | Blueprint LCS-17 | Dismiss → new candidate only on changed context | Automatic re-entry loop | P1 | LAUNCH_BLOCKER | DEPENDS ON L7 |
| QA-P1-094 | Stale NBA | Temporal | Stale recommendation indicated or suppressed | Acted on stale without warning | P2 | BETA_BLOCKER | DEPENDS ON L7 |
| QA-P1-095 | NBA accept authority | Actor matrix | Accept requires Business Owner | Unauthorized accept | P1 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |

---

### 7.11 S10 — Notes (contextual)

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-100 | Notes preserve context | S10; P1-11 | Notes on lead/customer retrievable for prep | Notes lost on navigation | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-101 | Notes ≠ answer automation | S10; S13 | Notes alone insufficient for P1-04; S13 required for grounded answers | Notes presented as eliminating repeat Q burden | P2 | BETA_BLOCKER | DEPENDS ON L5 |

---

### 7.12 S11 — Conversation Preparation (SCR-016) / WF8

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-110 | Operator vs customer readiness | S11; P1-09; DoD | Operator prep and customer readiness are separate dimensions | Conflated readiness | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-111 | WF8 prep flow | WF8; LCS-05/19 | History, notes, progress, issues visible | Missing notes undetected | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-112 | Not a scheduling platform | S11 boundary | No required scheduling/reminder platform behavior | Scheduling promised | P2 | NON_BLOCKING | AVAILABLE NOW |
| QA-P1-113 | LCS-14 standalone ≠ WF8 | Blueprint LCS-14 | Standalone inbound Q uses S13; WF8 only in conv prep context | All Q&A forced through WF8 | P2 | BETA_BLOCKER | DEPENDS ON L5 |

---

### 7.13 S12 — Onboarding (WF4)

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-120 | Onboarding states | S12; State §5 | Not Started / In Progress / Blocked / Incomplete / Complete distinguishable | Unknown → Complete | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-121 | WF4 visibility | WF4; LCS-10/11 | Onboarding gaps visible; next steps clear | Silent incomplete onboarding | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-122 | Onboarding empty vs not started | UXS-03/10 | No onboarding record ≠ Complete | False complete | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |

---

### 7.14 S13 — Bounded AI (SCR-017, SCR-019) / AI Boundary

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-130 | AI Analyze boundary | Actor matrix; S13 | AI inspects authorized context only | Cross-tenant context in output | P0 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |
| QA-P1-131 | AI Prepare boundary | S13 | Summarize/draft from evidence | Fabricated customer facts | P0 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-132 | AI Recommend boundary | S9/S13 | Recommendations include rationale + uncertainty | False certainty | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-133 | AI Execute boundary | S13; Launch scope | No silent consequential external action | Autonomous send/execute | P0 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-134 | P1-04 grounded answers | DoD §5; P1-04 | S13 + S3/S10 context; human review before send | Autonomous support agent | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-135 | P1-05 personalization trace | DoD §5; P1-05 | Draft traceable to customer context | Generic ungrounded draft | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-136 | Insufficient evidence | UXS-10/11 | Missing context → decline/uncertainty UXS-10 | Fabricated fill-in | P0 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-137 | Conflicting evidence | UXS-11 | Conflicting signals → UXS-11; human resolves | Picks arbitrary answer | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-138 | AI permission denied | UXS-09; RI-AI-COMMAND | Unauthorized AI context blocked | Leaked unauthorized data | P0 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |
| QA-P1-139 | Personalization chain | S13 scope | S3/S10 → S13 → human review → human action | Skipped human review | P0 | LAUNCH_BLOCKER | DEPENDS ON L5 |

---

### 7.15 WF7 — Morning Prioritization

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-140 | WF7 start-of-day | WF7; O6 | Owner opens CC; can choose first action from buckets | No guidance + overloaded list | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-141 | WF7 human choice | WF7 | Owner chooses order; AI briefing assistive only | AI auto-starts work | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |

---

### 7.16 WF5 — Progress Review

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-150 | WF5 human intervention path | WF5; LCS-13 | Progress concern → review → optional LCS-15/18 | Auto-intervention | P1 | LAUNCH_BLOCKER | DEPENDS ON L6 |

---

### 7.17 Critical Evidence Chain (Mandatory)

| ID | Chain Step | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ---------- | ------- | ------- | --- | ------ | --- |
| QA-P1-160 | Program → Enrollment | Enrollment links to program reference | Orphan enrollment | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-161 | Enrollment → Progress evidence | Progress evidence enrollment-scoped | Customer-level merge | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-162 | Progress → Attention candidate | Evidence-backed candidate only | Attention without evidence | P1 | LAUNCH_BLOCKER | DEPENDS ON L6 |
| QA-P1-163 | Attention → Human review | LCS-16 human disposition | Auto-resolve | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-164 | Attention → NBA (optional) | NBA may follow review; not automatic loop | Circular self-generation | P1 | LAUNCH_BLOCKER | DEPENDS ON L7 |
| QA-P1-165 | NBA → Human action | Accept → intervention/task; human executes | Autonomous execution | P0 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-166 | "AI said so" insufficient | High-impact decision requires evidence chain | Decision accepted on AI text alone | P0 | LAUNCH_BLOCKER | AVAILABLE NOW |

---

### 7.18 Interaction State Acceptance (Cross-Surface)

| ID | State | Surfaces | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | -------- | ------- | ------- | --- | ------ | --- |
| QA-P1-170 | UXS-03 vs UXS-04 | All workspaces | System empty vs filter empty distinct | Conflated | P2 | BETA_BLOCKER | DEPENDS ON L5 |
| QA-P1-171 | UXS-05 recoverable error | Lists/details | Retry reloads | Dead end | P2 | BETA_BLOCKER | DEPENDS ON L5 |
| QA-P1-172 | UXS-07 partial data | Customer 360 | Available sections shown; failed sections not fabricated | Fabricated sections | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-173 | UXS-09 permission | All surfaces | No data leak on denied | Partial leak | P0 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |
| QA-P1-174 | UXS-10 no evidence | Progress, AI, Attention | Unknown valid | Fake zero/healthy | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-175 | UXS-13 consequential | SCR-003,009,013 | Confirm before dismiss/accept/handoff/terminal | Silent consequential change | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |

---

### 7.19 Tenant & Discovery Boundary

| ID | Title | Source | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------ | ------- | ------- | --- | ------ | --- |
| QA-P1-180 | Search tenant-bounded | Global discovery §47 | SCR-018 results tenant-scoped | Cross-tenant search hit | P0 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |
| QA-P1-181 | Aggregate tenant isolation | DoD §4 | CC counts exclude other tenants | Cross-tenant aggregate | P0 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |
| QA-P1-182 | AI tenant isolation | RI-AI-COMMAND | AI context tenant-bounded | Cross-tenant AI context | P0 | LAUNCH_BLOCKER | DEPENDS ON DESKTOP BACKEND |

---

### 7.20 Temporal & Duplicate Acceptance

| ID | Title | Pass IF | Fail IF | Sev | Launch | Dep |
| -- | ----- | ------- | ------- | --- | ------ | --- |
| QA-P1-190 | Resolved attention temporal | Resolved item not in active queue | Stale open item | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-191 | Completed enrollment temporal | Terminal excluded from active CC refs | Terminal in active briefing | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |
| QA-P1-192 | Duplicate task same customer | Valid multiplicity; no double-count in CC unit | Hidden duplicate authority | P2 | BETA_BLOCKER | DEPENDS ON L5 |
| QA-P1-193 | Same concern two lenses | Reference in CC + authoritative queue = same item | Two independent lifecycles | P1 | LAUNCH_BLOCKER | DEPENDS ON L5 |

---

### 7.21 Outcome Verification (O1–O10)

| ID | Outcome | QA Cases | Pass aggregate |
| -- | ------- | -------- | -------------- |
| QA-P1-200 | O1 attention today | 080, 082, 140 | Owner sees attention via CC or queue |
| QA-P1-201 | O2 priority follow-ups | 010, 012, 070 | Lead/customer follow-ups prioritized |
| QA-P1-202 | O3 centralized context | 030, 100 | Customer context reduces tool-hopping |
| QA-P1-203 | O4 program relationship | 040, 050 | Enrollment/program understandable |
| QA-P1-204 | O5 progress visible | 060, 061, 150 | Human-reviewable progress |
| QA-P1-205 | O6 daily prioritization | 001, 140, 141 | Single overview start point |
| QA-P1-206 | O7 faster prep | 110, 111, 130-135 | Evidence-backed prep |
| QA-P1-207 | O8 explicit NBA | 090-095 | Human-controlled next action |
| QA-P1-208 | O9 grounded AI | 130-139, 166 | No fabrication |
| QA-P1-209 | O10 onboarding/follow-up | 120-122, 070, 071 | Less forgotten work |

---

## 8. Negative Path Matrix (Consolidated)

| Category | Representative Cases | Expected Safe Behavior | Forbidden | Sev |
| -------- | -------------------- | ---------------------- | --------- | --- |
| Missing data | 061, 174 | UXS-10 Unknown | Fake zero/healthy | P1 |
| Unauthorized access | 031, 033, 173, 180-182 | UXS-09; reject | Data leak | P0 |
| Invalid transition | 053, 122 | Block or explicit exception | Silent illegal transition | P1 |
| Duplicate event | 083, 193 | Dedup same concern | Duplicate authority | P1 |
| Stale data | 005, 063, 094, 190 | UXS-08 or exclude | Act on stale as current | P2 |
| Unsupported AI action | 133, 136 | Decline/confirm | Autonomous execute | P0 |
| Missing dependency | 013, 021 | Surface exception | Silent success | P1 |
| Ambiguous aggregate | 006-008, 042 | Declare unit | Silent unit switch | P1 |
| Cross-domain rank | 008 | Separate buckets | Universal score | P1 |

---

## 9. Regression Boundary Contract (Critical)

| Boundary | Cases | MUST NOT regress |
| -------- | ----- | ---------------- |
| Enrollment-scoped progress | 006, 060, 064, 161 | Customer-level universal progress |
| F001 fan-out | 006, 007, 051 | Customer inflation or concern collapse |
| F002 attention authority | 082-085 | Duplicate At Risk queue |
| F003 incomparability | 008 | Cross-type numeric ranking pre-L5 |
| Unknown ≠ zero | 061, 174 | Missing → 0 |
| NBA human gate | 092, 093, 165 | Autonomous execution |
| AI grounding | 131, 136, 166 | Fabrication |
| Tenant isolation | 031, 180-182 | Cross-tenant access |
| Lead ≠ Customer | 022 | Entity merge |
| Pause ≠ terminal | 053 | Pause as exit |

---

## 10. Coverage Gap Register

| Gap ID | Domain | Missing Contract | Impact | Severity | Owner | Required Resolution |
| ------ | ------ | ---------------- | ------ | -------- | ----- | ------------------- |
| QA-GAP-001 | S4 Programs | Program list count semantics (active vs all enrollments) not explicitly frozen | QA-P1-042 cannot be fully deterministic until product clarifies count unit | P2 | Product track | Future scope decision or program detail convention |
| QA-GAP-002 | Implementation | RLS/adversarial tenant proofs require Computer 1 technical verification | QA-P1-031, 033, 173, 180-182 marked DEPENDS ON DESKTOP BACKEND | P2 | Computer 1 | Desktop adversarial test evidence at implementation |

**No P0 or P1 QA contract gaps.** Gaps are bounded and do not block contract establishment.

---

## 11. No-Scope-Expansion Audit

| Potential Expansion | Added? | Evidence |
| ------------------- | ------ | -------- |
| New product feature | NO | All cases trace to frozen S1–S13, WF1–WF10 |
| New AI capability | NO | S13 boundary only |
| New queue | NO | References existing Attention/NBA/Task queues |
| New role | NO | Actor matrix actors only |
| New database requirement | NO | Product acceptance only |
| New analytics product | NO | — |
| New ranking algorithm | NO | F003 prohibits pre-L5 ranking |
| New risk engine | NO | State §4.1 prohibits |
| New autonomous action | NO | UXS-13 + human gates |
| New CRM domain | NO | Bounded S3 |

---

## 12. QA Evidence Standard (Per Case Type)

| Case type | Minimum evidence |
| --------- | ---------------- |
| Product-spec review | Traceability to source artifact + reviewer signoff |
| Browser manual | Screenshot or recording + observed state |
| Tenant/security | Adversarial attempt log + rejection proof (Desktop) |
| AI grounding | Input context dump + output showing evidence/uncertainty |
| Workflow E2E | Screen recording through terminal state |
| Regression | Before/after comparison on boundary case |

---

## 13. Contract Closure

This contract is **established** when paired with `PHASE-1-QA-COVERAGE-MATRIX.md` demonstrating full S1–S13, WF1–WF10, critical screen, actor, state, F001/F002/F003, AI, tenant, and DoD traceability coverage.

Execution results MUST use `PHASE-1-QA-EXECUTION-RESULTS-TEMPLATE.md`.
