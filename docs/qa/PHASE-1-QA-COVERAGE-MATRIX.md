# ZyntixAI Phase 1 QA Coverage Matrix

## 1. Purpose

Traceability companion to `PHASE-1-QA-ACCEPTANCE-CONTRACT.md`. Maps scope, workflows, screens, actors, states, DoD requirements, and coverage status.

---

## 2. Scope-to-QA Traceability (S1–S13)

| Scope ID | Requirement Summary | QA Case IDs | Coverage Status |
| -------- | ------------------- | ----------- | --------------- |
| S1 | Morning Command Center daily overview | QA-P1-001–008, 140–141, 205 | COVERED |
| S2 | Leads operational management | QA-P1-010–014, 020–023, 201 | COVERED |
| S3 | Customer 360 bounded context | QA-P1-030–033, 202 | COVERED |
| S4 | Programs operational context | QA-P1-040–042, 203 | PARTIALLY COVERED (QA-GAP-001) |
| S5 | Enrollments lifecycle | QA-P1-050–054, 160, 203 | COVERED |
| S6 | Progress/engagement visibility | QA-P1-060–064, 150, 161, 204 | COVERED |
| S7 | Tasks and follow-up | QA-P1-070–074, 071, 209 | COVERED |
| S8 | Needs Attention | QA-P1-080–088, 162–163, 200 | COVERED |
| S9 | Next Best Action | QA-P1-090–095, 164–165, 207 | COVERED |
| S10 | Notes and context | QA-P1-100–101, 202 | COVERED |
| S11 | Conversation preparation | QA-P1-110–113, 206 | COVERED |
| S12 | Onboarding visibility | QA-P1-120–122, 209 | COVERED |
| S13 | Bounded AI assistance | QA-P1-130–139, 166, 208 | COVERED |

---

## 3. Problem-to-QA Traceability (P1-01–P1-15)

| Problem ID | Primary Scope | QA Case IDs | Status |
| ---------- | ------------- | ----------- | ------ |
| P1-01 | S3, S10 | 030, 100, 202 | COVERED |
| P1-02 | S8 | 080–088, 200 | COVERED |
| P1-03 | S6 | 060–064, 204 | COVERED |
| P1-04 | S13 | 134, 136, 208 | COVERED |
| P1-05 | S13 | 135, 208 | COVERED |
| P1-06 | S2 | 010–012, 020, 201 | COVERED |
| P1-07 | S7 | 070–071, 209 | COVERED |
| P1-08 | S1 | 001, 140–141, 205 | COVERED |
| P1-09 | S11 | 110–111, 206 | COVERED |
| P1-10 | S11, S13 | 111, 130–131 | COVERED |
| P1-11 | S10 | 100, 021 | COVERED |
| P1-12 | S6, S8 | 061, 081, 088 | COVERED |
| P1-13 | S12 | 120–122 | COVERED |
| P1-14 | S3, S1 | 030, 001, 202 | COVERED |
| P1-15 | S9 | 090–095, 207 | COVERED |

---

## 4. Workflow Acceptance Matrix (WF1–WF10)

| Workflow | Entry | Critical Transition | Terminal State | QA Cases | Verdict |
| -------- | ----- | ------------------- | -------------- | -------- | ------- |
| WF1 Lead to Follow-Up | Lead needs follow-up (LCS-04) | Review → task/action recorded | Follow-Up Due cleared or advanced | 010–014, 012 | COVERED |
| WF2 Lead to Customer Handoff | Lead won (LCS-07) | Handoff with preserved context | Customer active with history | 020–023 | COVERED |
| WF3 Customer to Enrollment | Customer associated to program (LCS-09) | Enrollment context displayed | Active/Onboarding understood | 032, 050, 160 | COVERED |
| WF4 Onboarding Visibility | New customer onboarding (LCS-10/11) | Gap identified | Onboarding Complete or intervention | 120–122 | COVERED |
| WF5 Progress Review | Progress monitoring (LCS-13) | Concern → human review | Intervention or continue monitoring | 060–064, 150, 161–162 | COVERED |
| WF6 Attention to Intervention | Attention surfaced (LCS-15/16) | Review → dismiss/resolve/defer | Resolved/Dismissed or LCS-18 | 080–088, 163 | COVERED |
| WF7 Morning Prioritization | Start workday | CC review → first action chosen | Owner begins work | 001–008, 140–141 | COVERED |
| WF8 Conversation Preparation | Upcoming conversation (LCS-05/19) | Prep reviewed; readiness checked | Operator Ready | 110–113 | COVERED |
| WF9 Task Completion | Task due (LCS-04/07) | Complete/reschedule | Task Completed; continuity preserved | 070–073, 071 | COVERED |
| WF10 NBA Review | Recommendation presented (LCS-17) | Accept/defer/dismiss | Accepted→action or dismissed | 090–095, 164–165 | COVERED |

---

## 5. Screen Coverage Matrix (SCR-001–SCR-021)

| Screen | Type | Critical | QA Cases | Happy | Negative | Access | Coverage |
| ------ | ---- | -------- | -------- | ----- | -------- | ------ | -------- |
| SCR-001 | Aggregate | Yes | 001–008, 140–141 | ✓ | ✓ | ✓ | FULL |
| SCR-002 | Workspace | Yes | 010–014 | ✓ | ✓ | ✓ | FULL |
| SCR-003 | Detail | High | 011, 020–023 | ✓ | ✓ | ✓ | FULL |
| SCR-004 | Workspace | Yes | 010, 030 | ✓ | ✓ | ✓ | FULL |
| SCR-005 | Detail | High | 030–033 | ✓ | ✓ | ✓ | FULL |
| SCR-006 | Queue | Yes | 070–074 | ✓ | ✓ | ✓ | FULL |
| SCR-007 | Detail | High | 070–073 | ✓ | ✓ | — | PARTIAL |
| SCR-008 | Queue | Yes | 080–088 | ✓ | ✓ | ✓ | FULL |
| SCR-009 | Review | Yes | 082–087 | ✓ | ✓ | ✓ | FULL |
| SCR-010 | Workspace | High | 006–007, 050–051 | ✓ | ✓ | — | FULL |
| SCR-011 | Detail | High | 050–054, 060 | ✓ | ✓ | — | FULL |
| SCR-012 | Queue | High | 090–095 | ✓ | ✓ | ✓ | FULL |
| SCR-013 | Review | High | 090–095 | ✓ | ✓ | ✓ | FULL |
| SCR-014 | Workspace | Secondary | 040–042 | ✓ | ✓ | — | PARTIAL |
| SCR-015 | Detail | Secondary | 040–041 | ✓ | — | — | PARTIAL |
| SCR-016 | Contextual | High | 110–113 | ✓ | ✓ | — | FULL |
| SCR-017 | Contextual | High | 134–136 | ✓ | ✓ | — | FULL |
| SCR-018 | Discovery | High | 180 | — | ✓ | ✓ | PARTIAL |
| SCR-019 | Contextual | High | 130–139 | ✓ | ✓ | ✓ | FULL |
| SCR-020 | Secondary | Medium | — | — | — | — | DEFERRED |
| SCR-021 | Secondary | Low | — | — | — | — | DEFERRED |

SCR-020/021: Phase 1 secondary surfaces; core flows covered via navigation model. Non-blocking deferral.

---

## 6. Actor & Access Acceptance

| Surface / Workflow | Actor | Allowed Action | Forbidden Action | QA Case |
| ------------------ | ----- | -------------- | ---------------- | ------- |
| Lead qualification | Sales Operator | Qualify, follow up, won/lost | Auto-send without review | 011, 012 |
| Customer intervention | Coach / Owner | Intervene, pause enrollment | Unauthorized tenant access | 031, 033 |
| Attention dismiss | Business Owner | Dismiss false positive | Dismiss without authority | 086–087 |
| Attention resolve | Coach / Owner | Resolve after intervention | Auto-resolve | 080, 163 |
| NBA accept | Business Owner | Accept recommendation | Autonomous execution | 092, 095 |
| Enrollment status | Coach / Owner | Pause, complete, exit | Unauthorized change | 053, 054 |
| External message | Owner / Sales / Coach | Send after human review | AI auto-send | 133, 139 |
| AI context | ZyntixAI (bounded) | Analyze, Prepare, Recommend | Execute consequential; cross-tenant | 130–138 |
| Tenant boundary | Any authorized user | Own-tenant data only | Cross-tenant read/search/AI | 180–182 |

**Note:** Product-level access expectations are not proof of implemented RLS. Cases marked `DEPENDS ON DESKTOP BACKEND` require Computer 1 adversarial verification.

---

## 7. State Acceptance Matrix

### 7.1 Lead States

| Entity | State | Valid Entry | Valid Exit | Forbidden Transition | QA Cases |
| ------ | ----- | ----------- | ---------- | -------------------- | -------- |
| Lead | New | LCS-01 | LCS-02 | Won without LCS-06/07 | 011 |
| Lead | Context Incomplete | Missing data | LCS-02 complete | Qualified without evidence | 013 |
| Lead | Qualified | LCS-03 | LCS-04/05/07 | — | 012 |
| Lead | Won | LCS-07 positive | LCS-08 handoff | Customer without handoff | 020–021 |
| Lead | Lost/Deferred | LCS-07 | LCS-22 or end | — | 012 |

### 7.2 Customer States

| Entity | State | Valid Entry | Valid Exit | Forbidden | QA Cases |
| ------ | ----- | ----------- | ---------- | --------- | -------- |
| Customer | New Customer | WF2 handoff | Active | Skip handoff context | 020 |
| Customer | Active | Ongoing relationship | Paused/Completed | Merge with Lead | 022 |
| Customer | Needs Attention | Attention open | Resolved | Independent of Attention queue | 082–085 |
| Customer | Paused | Temporary inactive | Active resume | Terminal without LCS-20 | 053 |

### 7.3 Enrollment States

| Entity | State | Valid Entry | Valid Exit | Forbidden | QA Cases |
| ------ | ----- | ----------- | ---------- | --------- | -------- |
| Enrollment | Onboarding | LCS-10 | Active | Unknown → Active | 050, 120 |
| Enrollment | Active | LCS-12 | Paused/Completed/Ended | Pause → Ended direct | 053 |
| Enrollment | At Risk | Evidence concern | Cleared on Attention resolve | Standalone review queue | 082–085 |
| Enrollment | Paused | LCS-12/13 pause | Resume Active | Route through LCS-20 | 053–054 |
| Enrollment | Completed/Ended | LCS-20 | — | In active CC aggregate | 052, 191 |

### 7.4 Attention Item States

| State | Valid Entry | Valid Exit | Forbidden | QA Cases |
| ----- | ----------- | ---------- | --------- | -------- |
| Candidate | LCS-15 evidence | Open | Duplicate same concern | 083 |
| Open | Surfaced | Reviewed/Dismissed/Resolved | Auto-resolve | 080, 163 |
| Dismissed | Human dismiss | Re-open on new evidence only | Silent re-open | 085, 087 |
| Resolved | Intervention done | — | Persist At Risk alone | 085 |

### 7.5 NBA States

| State | Valid Entry | Valid Exit | Forbidden | QA Cases |
| ----- | ----------- | ---------- | --------- | -------- |
| Recommended | LCS-17 | Reviewed | Auto-accept | 091–092 |
| Accepted | Human accept | Completed action | Autonomous execution | 092, 165 |
| Dismissed | Human dismiss | New candidate on context change only | Self-loop | 093 |

### 7.6 Progress States

| State | Meaning | Forbidden display | QA Cases |
| ----- | ------- | ----------------- | -------- |
| Unknown | No reliable evidence | Show as 0% or Healthy | 061, 174 |
| Healthy/Stalled/Declining | Evidence-based | Collapse to single label | 062 |
| Needs Review | Ambiguous | Auto-resolve | 061 |

### 7.7 Onboarding States

| State | QA Cases |
| ----- | -------- |
| Not Started / In Progress / Blocked / Incomplete / Complete | 120–122 |

### 7.8 Task States

| State | QA Cases |
| ----- | -------- |
| Planned / Due / Overdue / Completed / Cancelled | 070–073 |

---

## 8. Integrity Rule Coverage (L3.1-R1)

| Rule | Description | QA Cases | Regression |
| ---- | ----------- | -------- | ---------- |
| F001 | Enrollment-scoped fan-out; count unit; no inflation/collapse | 006, 007, 051, 064 | ✓ |
| F002 | At Risk references Attention; no duplicate authority | 082, 083, 084, 085 | ✓ |
| F003 | Cross-domain buckets non-comparable pre-L5 | 008, 074 | ✓ |

---

## 9. Evidence Chain Traceability

| Decision | Required Source Evidence | Traceability Expectation | QA Cases |
| -------- | ------------------------ | ------------------------ | -------- |
| Progress concern | Enrollment-scoped activity signals | Visible per enrollment; Unknown if missing | 060–061, 161 |
| Attention item | Evidence-backed candidate (LCS-15) | Reason + evidence in SCR-009 | 081, 162 |
| NBA recommendation | Context + rationale | Why + why now + evidence | 091, 164 |
| AI draft | S3/S10 customer context | Traceable; no fabrication | 134–135, 166 |
| At Risk visibility | Authoritative Attention Item | Reference not duplicate queue | 082–085 |
| Command Center priority | Bucket references only | Drill to authoritative owner | 002, 008 |

---

## 10. AI Boundary Matrix

| Mode | Permitted | Prohibited | QA Cases |
| ---- | --------- | ---------- | -------- |
| Analyze | Inspect authorized context | Cross-tenant; unauthorized | 130, 138 |
| Prepare | Summarize, draft from evidence | Fabricate facts | 131, 134–135 |
| Recommend | Suggest with rationale/uncertainty | False certainty | 132, 137 |
| Execute | Only where Phase 1 explicitly allows human-confirmed action | Silent consequential action | 133, 139 |

---

## 11. Definition of Done Traceability

| DoD Requirement | QA Evidence | QA Case IDs | Status |
| --------------- | ----------- | ----------- | ------ |
| §2 Capability traceability (S1–S13) | Scope matrix §2 | 001–209 | COVERED |
| §2 Acceptance criteria exist | This contract | All cases | COVERED |
| §2 QA result recorded | Results template | Template artifact | COVERED |
| §3 Workflow completion (WF1–WF10) | §4 workflow matrix | 010–165 | COVERED |
| §4 Security — tenant isolation | §6, §9 tenant cases | 031, 033, 173, 180–182 | IMPLEMENTATION_DEPENDENT |
| §4 No P0/P1 security blocker | Adversarial cases | 031, 033, 130, 133, 138 | IMPLEMENTATION_DEPENDENT |
| §5 AI semantic (P1-04, P1-05, P1-09) | §10 AI matrix | 110, 134–135, 139 | COVERED |
| §6 UX — loading/empty/error | Interaction cases | 003, 004, 170–175 | COVERED |
| §6 Mobile usable | Responsive spec | Deferred to implementation UX pass | IMPLEMENTATION_DEPENDENT |
| §7 Reliability — refresh/retry | UXS-05, 08, 12 | 005, 063, 171 | COVERED |
| §8 Manual QA core flows | Workflow matrix | WF1–WF10 cases | COVERED |
| §8 Adversarial checks | Tenant + AI cases | 180–182, 136–138 | IMPLEMENTATION_DEPENDENT |
| §9 P0/P1 launch blockers | Severity per case | Launch class column | COVERED |
| §10 Final GO gate | Outcome cases + template | 200–209 | COVERED |

---

## 12. Full Coverage Summary Matrix

| Requirement / Workflow / Screen | QA Cases | Happy | Negative | Access | State | Regression | Coverage |
| ------------------------------- | -------- | ----- | -------- | ------ | ----- | ---------- | -------- |
| S1 Command Center | 001–008, 140–141 | ✓ | ✓ | — | ✓ | ✓ | FULL |
| S2 Leads | 010–014, 020–023 | ✓ | ✓ | ✓ | ✓ | ✓ | FULL |
| S3 Customer 360 | 030–033 | ✓ | ✓ | ✓ | ✓ | ✓ | FULL |
| S4 Programs | 040–042 | ✓ | — | — | — | — | PARTIAL |
| S5 Enrollments | 050–054 | ✓ | ✓ | — | ✓ | ✓ | FULL |
| S6 Progress | 060–064 | ✓ | ✓ | — | ✓ | ✓ | FULL |
| S7 Tasks | 070–074 | ✓ | ✓ | — | ✓ | ✓ | FULL |
| S8 Attention | 080–088 | ✓ | ✓ | ✓ | ✓ | ✓ | FULL |
| S9 NBA | 090–095 | ✓ | ✓ | ✓ | ✓ | ✓ | FULL |
| S10 Notes | 100–101 | ✓ | ✓ | — | — | — | FULL |
| S11 Conv Prep | 110–113 | ✓ | ✓ | — | ✓ | — | FULL |
| S12 Onboarding | 120–122 | ✓ | ✓ | — | ✓ | — | FULL |
| S13 AI | 130–139 | ✓ | ✓ | ✓ | — | ✓ | FULL |
| WF1–WF10 | §4 | ✓ | ✓ | ✓ | ✓ | ✓ | FULL |
| F001/F002/F003 | §8 | — | ✓ | — | ✓ | ✓ | FULL |
| Tenant boundary | 180–182 | — | ✓ | ✓ | — | ✓ | FULL (impl-dep) |
| Evidence chain | 160–166 | ✓ | ✓ | — | ✓ | ✓ | FULL |
| O1–O10 outcomes | 200–209 | ✓ | — | — | — | — | FULL |

---

## 13. Implementation Dependency Summary

| Dependency | Case count (approx.) | Notes |
| ---------- | -------------------- | ----- |
| DEPENDS ON L5 | ~85 | Command Center, screens, workflows |
| DEPENDS ON L6 | ~8 | Attention detection thresholds |
| DEPENDS ON L7 | ~6 | NBA ranking/scoring |
| DEPENDS ON DESKTOP BACKEND | ~12 | Tenant, RLS, persistence |
| AVAILABLE NOW | ~5 | Spec-review, AI boundary language, outcomes |
| BLOCKED BY UNDEFINED CONTRACT | 1 | QA-P1-042 (QA-GAP-001) |

---

## 14. Automation Classification Summary

| Class | Approx. cases |
| ----- | ------------- |
| MANUAL | 15 |
| HYBRID | 45 |
| AUTOMATABLE | 30 |
| NOT AUTOMATABLE YET | 10 |

Exact per-case classification in contract §7 tables (Automation class on expanded cases; HYBRID default for implementation-dependent UI cases).
