# ZyntixAI Phase 1 Screen Inventory

## 1. Purpose

Stable inventory of all Phase 1 screens mapped to intents, IA, problems, workflows, and lifecycle support. Screen IDs are authoritative for L4 and downstream phases.

---

## 2. Screen Classification Model

| Classification | Definition |
| -------------- | ---------- |
| AGGREGATE | Synthesizes references; does not own operational truth |
| WORKSPACE | List supporting meaningful cross-object operational review |
| OBJECT-DETAIL | Single entity with persistent identity |
| QUEUE | Authoritative workload of actionable items |
| REVIEW | Human decision on one queue item |
| CONTEXTUAL-PREPARATION | Bounded prep flow tied to object/context |
| DISCOVERY | Find authorized entities |
| SECONDARY | Grouped navigation or configuration |

---

## 3. Complete Screen Inventory

| Screen ID | Screen | Classification | Primary Intent | Information Owner | Desktop Importance | Mobile Importance |
| --------- | ------ | -------------- | -------------- | ----------------- | ------------------ | ----------------- |
| SCR-001 | Command Center | AGGREGATE | Start day; see priority work | Command Center lens | Critical | Critical (Home) |
| SCR-002 | Leads Workspace | WORKSPACE | Find and continue lead work | Lead list | Critical | Critical |
| SCR-003 | Lead Detail | OBJECT-DETAIL | Understand one lead; follow up | Lead object | High | High |
| SCR-004 | Customers Workspace | WORKSPACE | Find customers; operational status | Customer list | Critical | Critical |
| SCR-005 | Customer 360 Detail | OBJECT-DETAIL | Bounded customer hub | Customer object | High | High |
| SCR-006 | Tasks Queue | QUEUE | Review due/upcoming/overdue tasks | Task list | Critical | Critical |
| SCR-007 | Task Detail | OBJECT-DETAIL | Complete one task | Task object | High | High |
| SCR-008 | Attention Queue | QUEUE | Review Needs Attention workload | Attention queue | Critical | Critical |
| SCR-009 | Attention Item Detail | REVIEW | Decide on one attention item | Attention item | Critical | Critical |
| SCR-010 | Enrollments Workspace | WORKSPACE | Cross-enrollment operational review | Enrollment list | High | Secondary (More) |
| SCR-011 | Enrollment Detail | OBJECT-DETAIL | Customer–program relationship | Enrollment object | High | Secondary |
| SCR-012 | NBA Review Queue | QUEUE | Review recommendation workload | NBA review queue | High | Secondary (More) |
| SCR-013 | NBA Recommendation Review | REVIEW | Disposition one recommendation | NBA recommendation | High | Secondary |
| SCR-014 | Programs Workspace | WORKSPACE | Browse programs offered | Program list | Secondary | Secondary |
| SCR-015 | Program Detail | OBJECT-DETAIL | Understand one program | Program object | Secondary | Secondary |
| SCR-016 | Conversation Preparation | CONTEXTUAL-PREPARATION | Operator prep + customer readiness | Prep context | High | High |
| SCR-017 | Answer Preparation | CONTEXTUAL-PREPARATION | Grounded answer prep (LCS-14) | Q&A context | High | High |
| SCR-018 | Global Search Results | DISCOVERY | Find authorized objects | Discovery layer | High | High |
| SCR-019 | AI Contextual Assistance | CONTEXTUAL-PREPARATION | Bounded AI from context | AI output (contextual) | High | High |
| SCR-020 | More / Secondary Navigation | SECONDARY | Access grouped destinations | Navigation shell | Medium | Medium |
| SCR-021 | Settings | SECONDARY | Phase 1 configuration | Settings | Low | Low |

---

## 4. Screen-to-Intent Mapping

| Screen ID | IA Intent(s) |
| --------- | ------------ |
| SCR-001 | RI-HOME |
| SCR-002 | RI-LEADS |
| SCR-003 | RI-LEAD-DETAIL, RI-HANDOFF |
| SCR-004 | RI-CUSTOMERS |
| SCR-005 | RI-CUSTOMER-DETAIL |
| SCR-006 | RI-TASKS |
| SCR-007 | RI-TASK-DETAIL |
| SCR-008 | RI-ATTENTION |
| SCR-009 | RI-ATTENTION-DETAIL, RI-INTERVENTION |
| SCR-010 | RI-ENROLLMENTS |
| SCR-011 | RI-ENROLLMENT-DETAIL |
| SCR-012 | RI-NBA-QUEUE |
| SCR-013 | RI-NBA-REVIEW, RI-INTERVENTION |
| SCR-014 | RI-PROGRAMS |
| SCR-015 | RI-PROGRAM-DETAIL |
| SCR-016 | RI-CONV-PREP |
| SCR-017 | RI-ANSWER-PREP |
| SCR-018 | Global search |
| SCR-019 | RI-AI-COMMAND |
| SCR-020 | More menu |
| SCR-021 | RI-SETTINGS |

---

## 5. Screen-to-IA Mapping

| Screen ID | IA Role |
| --------- | ------- |
| SCR-001 | Aggregate surface (IA-004) |
| SCR-002–005 | Lead/Customer objects (IA-005, IA-010) |
| SCR-006–007 | Task authoritative (IA-015) |
| SCR-008–009 | Attention authoritative (IA-007) |
| SCR-010–011 | Enrollments workspace (IA-017, IA-019) |
| SCR-012–013 | NBA review queue (IA-018, OD-015) |
| SCR-014–015 | Programs grouped (IA-006) |
| SCR-016–017 | Contextual prep (OD-009, OD-013) |
| SCR-019 | AI contextual (IA-011) |

---

## 6. Screen-to-Problem Mapping

| Screen ID | Primary Problems |
| --------- | ---------------- |
| SCR-001 | P1-02, P1-07, P1-08, P1-14, P1-15 |
| SCR-002, SCR-003 | P1-06, P1-11 |
| SCR-004, SCR-005 | P1-01, P1-03, P1-14 |
| SCR-006, SCR-007 | P1-07 |
| SCR-008, SCR-009 | P1-02, P1-12 |
| SCR-010, SCR-011 | P1-03, P1-13, P1-14 |
| SCR-012, SCR-013 | P1-15 |
| SCR-014, SCR-015 | P1-14 |
| SCR-016 | P1-09, P1-10 |
| SCR-017 | P1-04, P1-05 |
| SCR-018 | P1-01, P1-06, P1-14 |
| SCR-019 | P1-04, P1-05, P1-10, P1-15 |

---

## 7. Screen-to-Workflow Mapping

| Screen ID | Workflows |
| --------- | --------- |
| SCR-001 | WF7 |
| SCR-002–003 | WF1, WF2, WF8, WF9 |
| SCR-004–005 | WF2, WF3, WF5, WF8 |
| SCR-006–007 | WF9 |
| SCR-008–009 | WF6 |
| SCR-010–011 | WF3, WF4, WF5 |
| SCR-012–013 | WF10 |
| SCR-014–015 | WF3 |
| SCR-016 | WF8 |
| SCR-017 | Cross-lifecycle (LCS-14) |

---

## 8. Screen-to-Lifecycle Mapping

| Screen ID | Key Lifecycle Stages |
| --------- | -------------------- |
| SCR-002–003 | LCS-01–07, LCS-22 |
| SCR-004–005 | LCS-08–14, LCS-19–22 |
| SCR-010–011 | LCS-09–13, LCS-20 (OD-014 pause) |
| SCR-008–009 | LCS-15–18 |
| SCR-012–013 | LCS-17 |
| SCR-016 | LCS-05, LCS-19 |
| SCR-017 | LCS-14 |

---

## 9. Desktop Importance

Critical: SCR-001, 002, 004, 006, 008. High: SCR-003, 005, 007, 009, 010, 011, 012, 013, 016, 017, 018, 019. Secondary: SCR-014, 015, 020, 021.

---

## 10. Mobile Importance

Bottom nav: SCR-001, 002, 004, 006, 008. More: SCR-010, 012, 014, 021. Contextual overlays: SCR-016, 017, 019.

---

## 11. Contextual Entry Points

| Screen | Contextual From |
| ------ | --------------- |
| SCR-003 | SCR-002, SCR-001, SCR-018 |
| SCR-005 | SCR-004, handoff, SCR-001 |
| SCR-007 | SCR-006, object links |
| SCR-009 | SCR-008, badges, SCR-001 |
| SCR-011 | SCR-010, SCR-005, SCR-015 |
| SCR-013 | SCR-012, SCR-001, object panel |
| SCR-016 | SCR-003, SCR-005, SCR-001 |
| SCR-017 | SCR-003, SCR-005, SCR-019 |
| SCR-019 | Any object/aggregate screen |

---

## 12. Deferred Screen Concepts

| Concept | Deferred To |
| ------- | ----------- |
| Reports/Analytics dashboard | Out of scope |
| LMS authoring screens | Out of scope |
| Calendar/scheduling suite | Out of scope |
| Marketing automation | Out of scope |

---

## 13. Out-of-Scope Screen Concepts

Chatbot inbox, knowledge base admin, ticketing suite, project Gantt, billing/accounting, HR admin, developer API console, niche trading dashboards.
