# ZyntixAI Phase 1 Route Intent Map

## 1. Route Intent Principle

Route intents describe **what the user is trying to accomplish** and which information owner serves that intent. They are product-navigation contracts for L4 — not implementation specifications.

---

## 2. Non-Binding Disclaimer

All path labels in this document are:

`NON-BINDING CONCEPTUAL PATH`

No actual application routes, framework folders, or URL structures exist or are authorized by this document. Computer 1 and L4 implementation may map intents to technical routes.

---

## 3. Primary Destination Intents

| Intent ID | User Intent | Conceptual Path | Information Owner | Entry Points |
| --------- | ----------- | --------------- | ----------------- | ------------ |
| RI-HOME | Start my day; see priorities | `/command-center` | Command Center aggregate | App launch, logo/home |
| RI-LEADS | Manage sales pipeline | `/leads` | Lead list | Primary nav, search, Command Center |
| RI-CUSTOMERS | Manage customer relationships | `/customers` | Customer list | Primary nav, search, Command Center |
| RI-TASKS | See and complete work | `/tasks` | Task list | Primary nav, Command Center, object links |
| RI-ATTENTION | Review who needs attention | `/attention` | Attention queue | Primary nav, Command Center, object badges |

---

## 4. Object List Intents

| Intent ID | User Intent | Conceptual Path | Information Owner | Entry Points |
| --------- | ----------- | --------------- | ----------------- | ------------ |
| RI-PROGRAMS | See what we offer | `/more/programs` | Program list | More menu |
| RI-ENROLLMENTS | See active relationships; review progress/onboarding across enrollments | `/more/enrollments` | Enrollment list (operational workspace) | More menu, Program detail, Customer detail, Command Center |

---

## 5. Object Detail Intents

| Intent ID | User Intent | Conceptual Path | Information Owner | Entry Points |
| --------- | ----------- | --------------- | ----------------- | ------------ |
| RI-LEAD-DETAIL | Work a specific lead | `/leads/{lead}` | Lead object | Lead list, search, Command Center |
| RI-CUSTOMER-DETAIL | Work a specific customer | `/customers/{customer}` | Customer object | Customer list, search, Command Center, handoff |
| RI-PROGRAM-DETAIL | Understand a program | `/more/programs/{program}` | Program object | Programs list |
| RI-ENROLLMENT-DETAIL | Manage delivery relationship | `/more/enrollments/{enrollment}` | Enrollment object | Enrollments list, Customer, Program |
| RI-TASK-DETAIL | Complete specific task | `/tasks/{task}` | Task object | Tasks list, Command Center, object links |
| RI-ATTENTION-DETAIL | Review specific attention item | `/attention/{item}` | Attention item | Attention list, Command Center, object badge |

---

## 6. Aggregate Intents

| Intent ID | User Intent | Conceptual Path | Information Owner | Entry Points |
| --------- | ----------- | --------------- | ----------------- | ------------ |
| RI-HOME | Daily prioritization | `/command-center` | Command Center | Default entry |

Command Center sub-intents are **sections within RI-HOME**, not separate routes:

- Overdue tasks section → drill to RI-TASK-DETAIL
- Open attention section → drill to RI-ATTENTION-DETAIL
- NBA awaiting review → drill to RI-NBA-REVIEW
- Upcoming conversations → drill to RI-CONV-PREP

---

## 7. Review Queue Intents

| Intent ID | User Intent | Conceptual Path | Information Owner | Entry Points |
| --------- | ----------- | --------------- | ----------------- | ------------ |
| RI-NBA-QUEUE | Review all pending NBA recommendations | `/more/nba-review` | NBA review queue | More menu, Command Center, Attention escalation |
| RI-NBA-REVIEW | Review one NBA recommendation | `/more/nba-review/{recommendation}` | NBA review queue item | NBA queue, Command Center, object contextual panel |
| RI-ATTENTION-DETAIL | (see above) | `/attention/{item}` | Attention queue | — |

NBA review queue is the **authoritative list workspace** for WF10. Command Center references items — it is not the review workspace. One recommendation, one review lifecycle, multiple references (OD-015).

---

## 8. Contextual Preparation Intents

| Intent ID | User Intent | Conceptual Path | Information Owner | Entry Points |
| --------- | ----------- | --------------- | ----------------- | ------------ |
| RI-CONV-PREP | Prepare for upcoming conversation | `/prepare/conversation/{entity}` | Conversation preparation context | Customer/Lead detail, Command Center, task trigger |
| RI-ANSWER-PREP | Prepare grounded answer to question | `/prepare/answer/{entity}` | Recurring Q&A context (LCS-14) | Customer/Lead detail, AI command |
| RI-HANDOFF | Complete lead-to-customer handoff | `/handoff/{lead}` | Handoff flow (WF2) | Lead won outcome |

---

## 9. Cross-Lifecycle Intents

| Intent ID | User Intent | Conceptual Path | Information Owner | Entry Points |
| --------- | ----------- | --------------- | ----------------- | ------------ |
| RI-AI-COMMAND | Get AI assistance in current context | `/ai` (contextual overlay) | AI prepared output | Any object/aggregate view |
| RI-INTERVENTION | Perform human intervention | `/intervene/{attention\|nba}` | Intervention context (LCS-18) | Attention review, NBA accept |

---

## 10. Entry Point Matrix

| Entry Point | Intents Reachable |
| ----------- | ----------------- |
| Primary navigation | RI-HOME, RI-LEADS, RI-CUSTOMERS, RI-TASKS, RI-ATTENTION |
| More menu | RI-PROGRAMS, RI-ENROLLMENTS, RI-NBA-QUEUE, RI-SETTINGS |
| Global search | RI-LEAD-DETAIL, RI-CUSTOMER-DETAIL, RI-TASK-DETAIL, RI-PROGRAM-DETAIL |
| Command Center cards | All detail and review intents |
| Object badges | RI-ATTENTION-DETAIL, RI-TASK-DETAIL, RI-NBA-REVIEW |
| AI command | RI-AI-COMMAND → may hand off to RI-ANSWER-PREP, RI-CONV-PREP |

---

## 11. Drill-Down Matrix

| From Intent | User Action | To Intent |
| ----------- | ----------- | --------- |
| RI-HOME | Tap overdue task | RI-TASK-DETAIL |
| RI-HOME | Tap attention item | RI-ATTENTION-DETAIL |
| RI-HOME | Tap NBA card | RI-NBA-QUEUE or RI-NBA-REVIEW |
| RI-HOME | Tap progress/onboarding gap | RI-ENROLLMENTS (filtered) |
| RI-HOME | Tap lead follow-up | RI-LEAD-DETAIL |
| RI-HOME | Tap onboarding gap | RI-ENROLLMENT-DETAIL |
| RI-ATTENTION-DETAIL | Escalate to action | RI-NBA-REVIEW or RI-INTERVENTION |
| RI-LEAD-DETAIL | Won outcome | RI-HANDOFF → RI-CUSTOMER-DETAIL |
| RI-CUSTOMER-DETAIL | Open enrollment | RI-ENROLLMENT-DETAIL |
| RI-ENROLLMENT-DETAIL | View customer | RI-CUSTOMER-DETAIL |
| RI-NBA-REVIEW | Accept action | RI-INTERVENTION or RI-TASK-DETAIL |

---

## 12. Permission Sensitivity

| Intent | Sensitivity |
| ------ | ----------- |
| All object intents | Tenant-scoped; user sees organization data only |
| RI-HANDOFF | Consequential — human confirms conversion |
| RI-INTERVENTION | Consequential — human performs external action |
| RI-AI-COMMAND | Permission-aware; no cross-tenant context |
| RI-SETTINGS | Account/admin configuration |

Backend permission implementation not defined at L3.

---

## 13. Deep-Link Intent

Deep links must resolve to:

- Object detail with full context (RI-LEAD-DETAIL, RI-CUSTOMER-DETAIL, etc.)
- Attention item with evidence visible
- Task with linked entity

Invalid or unauthorized deep links show deterministic failure — not silent redirect.

---

## 14. Mobile Route Importance

| Intent | Mobile Priority |
| ------ | --------------- |
| RI-HOME | Critical — bottom nav |
| RI-LEADS | Critical — bottom nav |
| RI-CUSTOMERS | Critical — bottom nav |
| RI-TASKS | Critical — bottom nav |
| RI-ATTENTION | Critical — bottom nav |
| RI-ATTENTION-DETAIL | Critical |
| RI-TASK-DETAIL | High |
| RI-LEAD-DETAIL / RI-CUSTOMER-DETAIL | High |
| RI-NBA-QUEUE / RI-NBA-REVIEW | High — via More or Command Center |
| RI-CONV-PREP | High |
| RI-ENROLLMENTS | Secondary — More (operational workspace); Command Center drill-down |
| RI-PROGRAMS | Secondary — More menu |
| RI-AI-COMMAND | High — contextual overlay |

---

## 15. L4 Handoff

L4 maps intents to screens and interaction flows. L4 must preserve:

- Non-binding nature of conceptual paths
- Authoritative ownership per intent
- Drill-down matrix
- Mobile priority tiers

---

## Intent Summary Table

| Intent ID | User Intent | Information Owner | Entry Points | Drill-Down | Context Required | Mobile Importance |
| --------- | ----------- | ----------------- | ------------ | ---------- | ---------------- | ----------------- |
| RI-HOME | Start day / prioritize | Command Center | Launch, nav | All detail intents | None | Critical |
| RI-LEADS | Browse leads | Lead list | Nav, search | RI-LEAD-DETAIL | None | Critical |
| RI-LEAD-DETAIL | Work lead | Lead object | List, search, CC | Tasks, prep, handoff | Lead ID | High |
| RI-CUSTOMERS | Browse customers | Customer list | Nav, search | RI-CUSTOMER-DETAIL | None | Critical |
| RI-CUSTOMER-DETAIL | Work customer | Customer object | List, search, CC | Enrollment, tasks, prep | Customer ID | High |
| RI-TASKS | Browse tasks | Task list | Nav, CC | RI-TASK-DETAIL | None | Critical |
| RI-TASK-DETAIL | Complete task | Task object | List, CC, object | Linked entity | Task ID | High |
| RI-ATTENTION | Review attention queue | Attention queue | Nav, CC | RI-ATTENTION-DETAIL | None | Critical |
| RI-ATTENTION-DETAIL | Review item | Attention item | Queue, badge, CC | Entity, NBA, intervention | Item ID | Critical |
| RI-NBA-QUEUE | Review all pending NBA | NBA review queue | More, CC, Attention | RI-NBA-REVIEW | None | High |
| RI-NBA-REVIEW | Review one recommendation | NBA queue item | Queue, CC, object | Intervention, task | Recommendation ID | High |
| RI-PROGRAMS | Browse programs | Program list | More | RI-PROGRAM-DETAIL | None | Secondary |
| RI-PROGRAM-DETAIL | View program | Program object | List | Enrollments | Program ID | Secondary |
| RI-ENROLLMENTS | Browse/review enrollments | Enrollment workspace | More, CC, object | RI-ENROLLMENT-DETAIL | Filter params optional | Secondary |
| RI-ENROLLMENT-DETAIL | Manage enrollment | Enrollment object | List, customer | Customer, program, onboarding | Enrollment ID | Secondary |
| RI-CONV-PREP | Prepare conversation | Prep context | Object, CC, task | AI command | Entity + conversation | High |
| RI-ANSWER-PREP | Prepare answer | Q&A context | Object, AI | AI command | Entity + question | High |
| RI-HANDOFF | Convert lead | Handoff flow | Lead won | RI-CUSTOMER-DETAIL | Lead ID | High |
| RI-AI-COMMAND | AI assistance | AI output | Any context | Prep intents | Current context | High |
| RI-INTERVENTION | Intervene | Intervention | Attention, NBA | Task, object | Source item | High |
| RI-SETTINGS | Configure | Settings | More | — | None | Secondary |

CC = Command Center
