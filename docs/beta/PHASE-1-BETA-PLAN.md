# ZyntixAI Phase 1 Beta Plan

## 1. Document Status

| Field | Value |
| ----- | ----- |
| Status | `AUTHORITATIVE — PHASE 1 BETA PLANNING CONTRACT` |
| Target market | `Course Sellers` |
| Track owner | `Laptop Product Completion Track` |
| Branch | `parallel/laptop-product-track-20260707` |
| Parent evidence | Launch plan (`603840d`); QA (`98995b1`); Demo (`a71efb0`); L3.1-R1 (`fb03ba8`) |
| Companion artifacts | `PHASE-1-BETA-ENTRY-GATE.md`, `PHASE-1-BETA-TESTER-JOURNEY-MATRIX.md`, `PHASE-1-BETA-FEEDBACK-TRIAGE.md`, `PHASE-1-BETA-EXIT-SIGNOFF-TEMPLATE.md` |

**This document does not authorize beta execution, user invitations, or production access.**

---

## 2. Core Beta Principle

| State | Meaning |
| ----- | ------- |
| `BETA PLAN ESTABLISHED` | Governance artifacts define entry, tasks, feedback, exit |
| `BETA ENTRY GATES DEFINED` | Criteria documented in entry gate |
| `BETA ENTRY GATES PASSED` | Evidence proves all beta-blocking gates PASS |
| `BETA EXECUTION AUTHORIZED` | Formal authorization to invite testers |
| `BETA RUNNING` | Testers actively executing tasks |
| `BETA COMPLETE` | Exit criteria met; evidence archived |
| `LAUNCH REVIEW AUTHORIZED` | Beta evidence handed to launch signoff |

**Beta Planning PASS ≠ beta-ready.**

---

## 3. Beta Purpose

Controlled validation of Phase 1 against frozen scope — **not** marketing launch or scope expansion.

| Goal | Evidence basis |
| ---- | -------------- |
| Validate core workflows WF1–WF10 | `PHASE-1-LAUNCH-SCOPE.md` §7 |
| Validate operational usefulness (O1–O10) | Launch Scope §5 |
| Discover implementation defects | DoD §8 |
| Test state transitions and integrity (F001–F003) | L3.1-R1; QA contract |
| Validate multi-enrollment comprehension | DEMO-B-001; QA-P1-006/007 |
| Validate Attention/NBA human-review semantics | WF6, WF10; F002 |
| Validate AI grounding and refusal boundaries | S13; QA-P1-130–139 |
| Validate failure/unknown states | UXS-10; QA-P1-061 |

**Out of scope:** public launch, feature discovery, investor demo, autonomous AI validation beyond contract.

---

## 4. Beta Scope Boundary

| In scope | Out of scope |
| -------- | ------------ |
| Frozen S1–S13 behaviors | New capabilities |
| WF1–WF10 critical paths | L5/L6/L7 algorithm tuning beyond contract |
| Integrity rules F001–F003 | Ranking/risk engine invention |
| Human-controlled AI (S13) | Autonomous execution |
| Single-tenant beta cohort | Cross-tenant testing without desktop proof |

---

## 5. Tester Profile Matrix

Actors from `COURSE-SELLER-ACTOR-RESPONSIBILITY-MATRIX.md` only.

| Profile | Required workflows | Key screens | Data access | Beta objective |
| ------- | ------------------ | ----------- | ----------- | -------------- |
| **Business Owner** | WF6, WF7, WF10 | SCR-001, 008, 009, 012, 013 | Full tenant operational data | Attention, prioritization, NBA disposition |
| **Sales Operator** | WF1, WF2 | SCR-002, 003, 005 | Leads + handoff customers | Lead follow-up, conversion handoff |
| **Coach / Program Operator** | WF3, WF4, WF5, WF8 (partial) | SCR-005, 010, 011, 016 | Customers, enrollments, progress | Enrollment context, progress, prep |
| **Internal QA Executor** | All mandatory WF | All critical SCR | Test tenant fixture | Structured QA-P1 execution + beta tasks |

One person may hold multiple profiles; tasks remain profile-tagged for coverage.

---

## 6. Beta Cohort Design

| Principle | Rule |
| --------- | ---- |
| Size | **Small controlled cohort** — minimum 1 per required profile; maximum defined by `BETA-GAP-001` decision rule |
| Role coverage | At least one tester capable per mandatory workflow family |
| Tenancy | Single organization per beta wave; no cross-tenant contamination |
| Environment | Isolated beta environment (not production until launch gate passes) |
| Onboarding | Staged: entry gate PASS → credentials → task assignment → evidence capture training |

**Cohort size rule (BETA-GAP-001):** Start with 3–5 testers covering all four profiles before expanding; expansion requires zero open P0 and ≤2 open beta-blocking P1.

---

## 7. Beta Status Vocabulary

### Planning
- `BETA PLAN ESTABLISHED` / `BETA PLAN CONDITIONALLY OPEN` / `BETA PLAN FAILED`

### Entry
- `BETA ENTRY READY` / `BETA ENTRY NOT READY` / `BETA ENTRY NOT YET ASSESSABLE`

### Execution
- `BETA EXECUTION AUTHORIZED` / `BETA EXECUTION NOT AUTHORIZED`

---

## 8. Current Beta Entry Assessment (Planning Time)

| Assessment | Verdict |
| ---------- | ------- |
| Beta plan | ESTABLISHED (this artifact set) |
| Beta entry gates | DEFINED |
| Beta entry gates passed | **NO** |
| **Beta entry readiness** | **NOT YET ASSESSABLE** |
| **Beta execution** | **NOT AUTHORIZED** |

**Rationale:** LAUNCH-BLOCK-001 through 007 open; no runnable build; no QA execution; no RLS proof. Cannot assess runtime beta gates until Computer 1 delivers implementation.

---

## 9. Public Demo vs Controlled Beta

| Concept | Requirement |
| ------- | ----------- |
| `PUBLIC DEMO READY` | Polished narrative demo (DEMO-CRIT-001 live) |
| `CONTROLLED BETA JOURNEY RUNNABLE` | Critical chain executable with evidence capture |

**Conclusion:** Polished public demo is **NOT** a beta blocker. Beta requires **controlled journey runnable** (BETA-BLOCK-003), not marketing-grade demo polish. LAUNCH-GATE-027 is launch-demo optional; beta substitutes QA-executed journeys.

---

## 10. Environment Planning (No Implementation)

| Property | Requirement |
| -------- | ----------- |
| Isolation | Dedicated beta environment; not production |
| Configuration | Production-like where security-relevant |
| Tenant | One beta tenant per wave; synthetic or controlled seed per `PHASE-1-DEMO-DATA-CONTRACT.md` |
| Build ID | Commit SHA recorded per beta run |
| Reset | Environment reset procedure before each wave (desktop-owned) |
| Secrets | Managed by Computer 1; never in repo |

Preserves `LAUNCH-GAP-001` (target environment undefined at planning time).

---

## 11. Beta Data Strategy

| Class | Use |
| ----- | --- |
| Synthetic / demo seed | Primary — per demo data contract entities |
| Controlled real data | Only with explicit owner consent; minimum necessary |
| Prohibited | Production customer dump; cross-tenant data; fabricated AI outputs presented as live |

**Reset:** Desktop-owned seed/reset; laptop defines contract only.

---

## 12. Privacy & Access Boundaries

| Rule | Requirement |
| ---- | ----------- |
| Minimum necessary | Testers see only their tenant data |
| Evidence capture | Screenshots/recordings must redact third-party PII where possible |
| Access | Beta credentials scoped to beta tenant |
| Retention | Evidence retained per `BETA-GAP-002` decision rule until launch review |

No legal policy invented — `BETA-GAP-002` records retention rule gap.

---

## 13. Preserved Gap Impact (Summary)

| Gap | Beta impact |
| --- | ----------- |
| QA-GAP-001 | Non-blocking; avoid ambiguous program counts in tasks |
| QA-GAP-002 | **Beta blocker** until desktop adversarial proof |
| DEMO-GAP-001 | WF8 tasks optional/partial |
| DEMO-GAP-002 | **Beta blocker** (no runnable build) |
| LAUNCH-GAP-001 | **Beta blocker** (environment undefined) |
| LAUNCH-GAP-002 | Pause/restart procedure partial |
| LAUNCH-GAP-003 | Observability partial for beta monitoring |
| D2-C13 | Non-blocking |

Detail: entry gate and feedback triage artifacts.

---

## 14. What Beta Planning Does Not Do

- Invite users or create accounts
- Execute QA or security tests
- Deploy or migrate
- Resolve launch/demo/QA gaps
- Authorize beta execution
- Declare beta-ready
