# ZyntixAI Phase 1 Screen and UX Blueprint

## 1. Document Status

| Field | Value |
| ----- | ----- |
| Status | `FROZEN FOR L4 UX SPECIFICATION` |
| Target market | `Course Sellers` |
| Track owner | `Laptop Product Completion Track` |
| Branch | `parallel/laptop-product-track-20260707` |
| Parent evidence | L1–L3.1 |

**This document does not authorize implementation.** No code, routes, schema, or APIs are defined.

---

## 2. Purpose

Translate validated Phase 1 scope, operating model, and information architecture into authoritative screen and interaction specifications for desktop and mobile.

---

## 3. Evidence Base

L1 scope (P1-01–P1-15, S1–S13, WF1–WF10), L2 lifecycle (LCS-01–LCS-22), L2.1 (OD-013–015), L3/L3.1 IA (IA-017–019), eight L3 UX documents.

---

## 4. L4 Boundary

**In scope:** screen inventory, information priority, actions, states, navigation behavior, responsive adaptation, review flows, confirmation principles.

**Out of scope:** pixels, CSS, components, routes, schema, APIs, L5 ranking, L6 thresholds, L7 scoring.

---

## 5. UX Principles

UXP-01 through UXP-14: decision context, authoritative truth, context before action, human control, visible failure, unknown valid, recovery first-class, mobile intentional, workspaces not passive lists, detail not dump, one NBA/Attention lifecycle, aggregate no duplicate, evidence before confidence.

---

## 6. Screen Architecture

| Type | Screens |
| ---- | ------- |
| Aggregate | SCR-001 |
| Workspaces | SCR-002, 004, 010, 014 |
| Object detail | SCR-003, 005, 007, 011, 015 |
| Queues | SCR-006, 008, 012 |
| Reviews | SCR-009, 013 |
| Contextual preparation | SCR-016, 017, 019 |
| Discovery | SCR-018 |
| Secondary | SCR-020, 021 |

---

## 7. Full Screen Specifications

*Information priority: P0=understand screen, P1=decide, P2=supporting, P3=deferred detail.*

---

### SCR-001 — Command Center

| Field | Specification |
| ----- | ------------- |
| Classification | AGGREGATE |
| Primary intent | Start the day; see what needs work |
| Primary question | Where should I start today? |
| Information owner | Command Center lens (references only) |
| Entry | App launch, Home nav |
| Drill-down | Tasks, Attention, NBA queue, Leads, Customers, Enrollments (filtered), Conversation prep |
| P0 | Briefing summary region; workload reference sections |
| P1 | Actionable reference cards with entity identity |
| P2 | Counts per workload type |
| Primary action | Open highest-priority reference (user chooses) |
| AI role | Prepare (daily briefing summary) |
| States | UXS-01, 03, 05, 08 |
| Desktop | Multi-region layout; sections not ranked by L4 |
| Mobile | Stacked sections; tap to drill |
| Traceability | P1-02,07,08,14,15 \| S1 \| WF7 \| LCS-04,07,11,13,15–17,19 |
| L5 reserved | Section order, ranking weights, briefing algorithm |

**Regions (unordered at L4):** overdue tasks, overdue follow-ups, open attention, NBA awaiting review, onboarding gaps, progress review candidates, upcoming conversations, new leads needing context.

**Rule:** Every card drills to authoritative destination. Does not own task/attention/NBA/enrollment state.

---

### SCR-002 — Leads Workspace

| Field | Specification |
| ----- | ------------- |
| Classification | WORKSPACE |
| Primary intent | Find and continue lead work |
| Primary question | Who should I follow up with? |
| Owner | Lead list |
| Entry | Leads nav, SCR-001, SCR-018 |
| Drill-down | SCR-003 |
| P0 | Lead identity, follow-up state |
| P1 | Last activity, qualification state, next task indicator |
| Filters | Needs follow-up, due, no activity, qualification, outcome, source |
| Sort | Last activity default |
| Primary action | Open lead |
| AI role | Observe, Recommend (priority hints — L5/L7 deferred) |
| States | UXS-01–05, 03, 04 |
| Traceability | P1-06,11 \| S2 \| WF1 \| LCS-01–07,22 |

---

### SCR-003 — Lead Detail

| Field | Specification |
| ----- | ------------- |
| Classification | OBJECT-DETAIL |
| Primary intent | Understand one lead; act on sales work |
| Primary question | What do I know and what should I do next for this lead? |
| Owner | Lead object |
| Entry | SCR-002, SCR-001, SCR-018 |
| Drill-down | SCR-007, SCR-016, SCR-017, SCR-009, SCR-013, handoff→SCR-005 |
| P0 | Identity, qualification, outcome state |
| P1 | Follow-up state, last activity, known interest |
| P2 | Notes, tasks, NBA ref, activity |
| Primary action | Follow up / record outcome |
| Consequential | Won/lost/deferred; handoff to Customer (UXS-13) |
| AI role | Prepare (draft follow-up, summarize) |
| Preserve | Lead ≠ Customer |
| Traceability | P1-06,10,11 \| S2,10,11 \| WF1,2,8 \| LCS-02–07 |

---

### SCR-004 — Customers Workspace

| Field | Specification |
| ----- | ------------- |
| Classification | WORKSPACE |
| Primary intent | Find customers; see operational status |
| Primary question | Which customers need my focus? |
| Owner | Customer list |
| Entry | Customers nav, SCR-001, SCR-018 |
| Drill-down | SCR-005 |
| P0 | Identity, active relationship indicator |
| P1 | Enrollment summary, attention badge, progress/onboarding concern |
| Filters | Active, onboarding incomplete, progress review, unknown progress, paused, open attention |
| Traceability | P1-01,03,14 \| S3 \| WF3,5 \| LCS-08–14 |

---

### SCR-005 — Customer 360 Detail

| Field | Specification |
| ----- | ------------- |
| Classification | OBJECT-DETAIL |
| Primary intent | Bounded customer hub |
| Primary question | What is happening with this customer? |
| Owner | Customer object |
| Hierarchy | **P0:** Identity, relationship summary \| **P1:** Enrollment summaries, open task/attention counts \| **P2:** Notes, activity \| **Linked:** Tasks, Attention refs, NBA ref, per-enrollment progress/onboarding summary |
| Excluded | Full attention queue, program admin, reports dump |
| Primary action | Open enrollment or conversation prep |
| AI role | Prepare, Analyze |
| Traceability | P1-01,03,14 \| S3,10 \| WF3,5,8 \| LCS-08–14,19 |

---

### SCR-006 — Tasks Queue

| Field | Specification |
| ----- | ------------- |
| Classification | QUEUE |
| Primary intent | Review operational tasks |
| Primary question | What work is due? |
| Owner | Task list |
| Segments | Today, Upcoming, Overdue |
| Drill-down | SCR-007 |
| Traceability | P1-07 \| S7 \| WF9 \| LCS-04,10,18,19 |

---

### SCR-007 — Task Detail

| Field | Specification |
| ----- | ------------- |
| Classification | OBJECT-DETAIL |
| Primary intent | Complete one task |
| Primary question | What is this task and what happens when I complete it? |
| Owner | Task object |
| P0 | Task title, due state, linked entity |
| P1 | Purpose, notes |
| Primary action | Mark complete |
| **UX-016** | Completion records task done; optional outcome note; does not auto-resolve lead/customer business outcome |
| Traceability | P1-07 \| S7 \| WF9 |

---

### SCR-008 — Attention Queue

| Field | Specification |
| ----- | ------------- |
| Classification | QUEUE |
| Primary intent | Review Needs Attention workload |
| Primary question | Who needs my attention and why? |
| Owner | Attention queue |
| Segments | Open, Snoozed, Dismissed history |
| Drill-down | SCR-009 |
| L6 reserved | Severity calculation, detection rules |
| Traceability | P1-02,12 \| S8 \| WF6 \| LCS-15–16 |

---

### SCR-009 — Attention Item Detail

| Field | Specification |
| ----- | ------------- |
| Classification | REVIEW |
| Primary intent | Review evidence; decide outcome |
| Primary question | Is this attention warranted and what should I do? |
| Owner | Attention item |
| P0 | Reason, affected entity |
| P1 | Evidence list, freshness, uncertainty |
| Outcomes | Snooze, dismiss, resolve, escalate intervention/NBA |
| Consequential | Dismiss/resolve (UXS-13) |
| Preserve | Attention ≠ NBA owner |
| L6 reserved | Thresholds |
| Traceability | P1-02,12 \| S8 \| WF6 \| LCS-16,18 |

---

### SCR-010 — Enrollments Workspace

| Field | Specification |
| ----- | ------------- |
| Classification | WORKSPACE |
| Primary intent | Cross-enrollment operational review |
| Primary question | Which enrollments need operational review? |
| Owner | Enrollment list (IA-017, IA-019) |
| Entry | More (first), SCR-001 drill-down, SCR-005, SCR-015 |
| P0 | Customer, program, lifecycle state |
| P1 | Onboarding state, progress state (stalled/declining/unknown/needs review) |
| Filters | Active, paused, onboarding incomplete, progress concerns, completed/exited |
| Default | Active enrollments |
| Drill-down | SCR-011 |
| Not | Reports/analytics |
| Traceability | P1-03,13,14 \| S5,6,12 \| WF3,4,5 \| LCS-09–13,20 |

---

### SCR-011 — Enrollment Detail

| Field | Specification |
| ----- | ------------- |
| Classification | OBJECT-DETAIL |
| Primary intent | Customer–program relationship over time |
| Primary question | What is the state of this enrollment? |
| Owner | Enrollment object |
| Sections | Relationship summary, lifecycle state, onboarding, progress/engagement, pause (temporary), tasks, attention refs, NBA refs, notes, completion/exit |
| **UX-011** | Pause distinct from terminal completion (OD-014) |
| Primary action | Review progress / address gap |
| Traceability | P1-03,13,14 \| S5,6,12 \| WF3–5 \| LCS-09–13,20 |

---

### SCR-012 — NBA Review Queue

| Field | Specification |
| ----- | ------------- |
| Classification | QUEUE |
| Primary intent | Review recommendation workload |
| Primary question | What actions are recommended for my review? |
| Owner | NBA review queue (IA-018) |
| Entry | More (second), SCR-001, object panel |
| Segments | Awaiting review, Deferred, Dismissed history |
| Drill-down | SCR-013 |
| L7 reserved | Ranking order |
| OD-015 | Review does not auto-generate candidates |
| Traceability | P1-15 \| S9 \| WF10 \| LCS-17 |

---

### SCR-013 — NBA Recommendation Review

| Field | Specification |
| ----- | ------------- |
| Classification | REVIEW |
| Primary intent | Disposition one recommendation |
| Primary question | Should I accept, defer, or dismiss this recommendation? |
| Owner | NBA recommendation |
| P0 | Recommended action, rationale |
| P1 | Evidence, affected entity, uncertainty |
| Outcomes | Accept, defer, dismiss, mark completed |
| Consequential | Accept (UXS-13) → intervention/task |
| One lifecycle | Same ID across CC, object, queue |
| Traceability | P1-15 \| S9 \| WF10 \| LCS-17 |

---

### SCR-014 — Programs Workspace

| Field | Specification |
| ----- | ------------- |
| Classification | WORKSPACE |
| Primary intent | Browse programs |
| Primary question | What does the business offer? |
| Owner | Program list |
| Drill-down | SCR-015 |
| Not | LMS authoring |
| Traceability | P1-14 \| S4 \| WF3 \| LCS-09 |

---

### SCR-015 — Program Detail

| Field | Specification |
| ----- | ------------- |
| Classification | OBJECT-DETAIL |
| Primary intent | Understand one program |
| Owner | Program object |
| P0 | Program identity, description |
| P1 | Related enrollments list |
| Drill-down | SCR-011, SCR-010 filtered |
| Traceability | P1-14 \| S4 \| WF3 |

---

### SCR-016 — Conversation Preparation

| Field | Specification |
| ----- | ------------- |
| Classification | CONTEXTUAL-PREPARATION |
| Primary intent | Operator prep + customer readiness visibility |
| Primary question | Am I ready and is the customer ready? |
| **Operator P1** | History, notes, progress, issues, talking points |
| **Customer readiness P1** | Pre-call tasks, submitted info, onboarding prereqs, progress update (OD-009, OD-011) |
| Not | Calendar suite |
| AI role | Prepare (operator summary) |
| Traceability | P1-09,10 \| S11,7,12 \| WF8 \| LCS-05,19 |

---

### SCR-017 — Answer Preparation

| Field | Specification |
| ----- | ------------- |
| Classification | CONTEXTUAL-PREPARATION |
| Primary intent | Grounded answer preparation (LCS-14) |
| Primary question | What can I answer based on available context? |
| P0 | Question context, customer/lead link |
| P1 | Available grounding context, limitations |
| P2 | Prepared draft (editable) |
| Human boundary | Review before external send |
| Not | Chatbot, KB, ticketing (OD-013, UX-013) |
| States | UXS-10 when insufficient context |
| Traceability | P1-04,05 \| S13,10,3 \| LCS-14 |

---

### SCR-018 — Global Search Results

| Field | Specification |
| ----- | ------------- |
| Classification | DISCOVERY |
| Primary intent | Find authorized objects |
| Results | Leads, Customers, Programs, Enrollments, Tasks with type labels |
| Drill-down | Respective detail screens |
| Not | Search infrastructure spec |
| Traceability | P1-01,06,14 \| S2,3,4,5,7 |

---

### SCR-019 — AI Contextual Assistance

| Field | Specification |
| ----- | ------------- |
| Classification | CONTEXTUAL-PREPARATION |
| Primary intent | Bounded AI from current context |
| Intents | Summarize, prepare follow-up/conversation/answer, explain attention/NBA |
| Boundaries | Permission-aware; no nav replacement; no autonomous send |
| States | UXS-10, 11 on failure |
| Traceability | P1-04,05,10,15 \| S13 |

---

### SCR-020 — More / Secondary Navigation

| Field | Specification |
| ----- | ------------- |
| Classification | SECONDARY |
| Primary intent | Grouped destination access |
| Order | 1. Enrollments 2. NBA Review 3. Programs 4. Settings |
| Not | Miscellaneous dump |

---

### SCR-021 — Settings

| Field | Specification |
| ----- | ------------- |
| Classification | SECONDARY |
| Primary intent | Phase 1 configuration |
| Not | HR, accounting, marketing suite, enterprise admin |

---

## 8. Cross-Screen Context Continuity

Object ID preserved across drill-down. Handoff Lead→Customer preserves history link. Queue filters preserved on return. AI session tied to invoking context.

---

## 9. Aggregate-to-Detail Behavior

SCR-001 cards always link to SCR-006, 008, 012, 002, 004, 010 (filtered), 016 — never inline completion.

---

## 10. Workspace-to-Detail Behavior

List row → detail → linked queue item → return preserves list position.

---

## 11. Queue-to-Review Behavior

Queue row → review/detail → outcome → return to queue (filters preserved). Stale item handling per queue patterns doc.

---

## 12. AI Contextual Access

SCR-019 overlay from any object screen. Outputs link to SCR-017 or SCR-016 when appropriate. Human approves consequential use.

---

## 13. Human Approval Boundaries

External communication, dismissal, NBA accept, terminal enrollment, handoff — UXS-13 confirmation with consequence summary.

---

## 14. Error and Recovery Philosophy

No silent failure. Retry on recoverable errors. Partial data explicit. Stale data refresh offered.

---

## 15. Mobile Adaptation

Per responsive spec. Bottom nav: Home, Leads, Customers, Tasks, Attention. More for Enrollments, NBA, Programs, Settings.

---

## 16. Accessibility Intent

Keyboard reachable controls. Text labels for states. Focus continuity after dialogs. Meaningful control names.

---

## 17. UX Anti-Pattern Audit

| ID | Risk | Prevention |
| -- | ---- | ---------- |
| UXAP-01 Dashboard dump | Mitigated | SCR-001 references only |
| UXAP-02 Customer dump | Mitigated | SCR-005 bounded hierarchy |
| UXAP-03 Queue fragmentation | Mitigated | Authoritative queues |
| UXAP-04 Hidden work | Mitigated | Enrollments/NBA in More + CC drill |
| UXAP-05 False certainty | Mitigated | UXS-10, 11 |
| UXAP-06 Empty=error | Mitigated | UX-009 |
| UXAP-07 Dead end error | Mitigated | Retry paths |
| UXAP-08 AI magic box | Mitigated | Context + limits on SCR-019 |
| UXAP-09 Mobile shrink | Mitigated | UX-010 |
| UXAP-10 Action overload | Mitigated | One primary action |
| UXAP-11 Color only | Mitigated | Text state labels |
| UXAP-12 Silent consequential | Mitigated | UX-014 |

---

## 18. Traceability Summary

| Screen ID | Problems | Scope | Workflows | Lifecycle | IA Intent |
| --------- | -------- | ----- | --------- | --------- | --------- |
| SCR-001 | P1-02,07,08,14,15 | S1 | WF7 | LCS-04,07,11,13,15–17,19 | RI-HOME |
| SCR-002 | P1-06,11 | S2 | WF1 | LCS-01–07,22 | RI-LEADS |
| SCR-003 | P1-06,10,11 | S2,10,11 | WF1,2,8 | LCS-02–07 | RI-LEAD-DETAIL |
| SCR-004 | P1-01,03,14 | S3 | WF3,5 | LCS-08–14 | RI-CUSTOMERS |
| SCR-005 | P1-01,03,14 | S3,10 | WF3,5,8 | LCS-08–14,19 | RI-CUSTOMER-DETAIL |
| SCR-006 | P1-07 | S7 | WF9 | LCS-04,10,18,19 | RI-TASKS |
| SCR-007 | P1-07 | S7 | WF9 | LCS-04+ | RI-TASK-DETAIL |
| SCR-008 | P1-02,12 | S8 | WF6 | LCS-15–16 | RI-ATTENTION |
| SCR-009 | P1-02,12 | S8 | WF6 | LCS-16,18 | RI-ATTENTION-DETAIL |
| SCR-010 | P1-03,13,14 | S5,6,12 | WF3–5 | LCS-09–13,20 | RI-ENROLLMENTS |
| SCR-011 | P1-03,13,14 | S5,6,12 | WF3–5 | LCS-09–13,20 | RI-ENROLLMENT-DETAIL |
| SCR-012 | P1-15 | S9 | WF10 | LCS-17 | RI-NBA-QUEUE |
| SCR-013 | P1-15 | S9 | WF10 | LCS-17 | RI-NBA-REVIEW |
| SCR-014 | P1-14 | S4 | WF3 | LCS-09 | RI-PROGRAMS |
| SCR-015 | P1-14 | S4 | WF3 | LCS-09 | RI-PROGRAM-DETAIL |
| SCR-016 | P1-09,10 | S11,7,12 | WF8 | LCS-05,19 | RI-CONV-PREP |
| SCR-017 | P1-04,05 | S13,10,3 | Cross | LCS-14 | RI-ANSWER-PREP |
| SCR-018 | P1-01,06,14 | S2,3,4,5,7 | Multiple | Multiple | Discovery |
| SCR-019 | P1-04,05,10,15 | S13 | WF8,10 | Multiple | RI-AI-COMMAND |
| SCR-020 | — | — | — | — | More |
| SCR-021 | — | — | — | — | RI-SETTINGS |

---

## 19. L5/L6/L7 Handoff

| Phase | L4 Delivers | L4 Defers |
| ----- | ----------- | --------- |
| L5 Command Center | SCR-001 shell, regions, drill-down | Ranking, weights, briefing algorithm |
| L6 Needs Attention | SCR-008, 009, evidence UI, outcomes | Thresholds, severity, detection |
| L7 Next Best Action | SCR-012, 013, evidence UI, outcomes | Ranking, scoring, recomputation |

L4 is complete for screen/interaction blueprint. Implementation authorization remains with Computer 1 per frozen scope.
