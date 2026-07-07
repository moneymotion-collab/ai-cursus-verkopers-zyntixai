# ZyntixAI Course Seller Lifecycle Map

## 1. Canonical Lifecycle

`LCS-01` Lead Entry → `LCS-02` Lead Context Capture → `LCS-03` Qualification → `LCS-04` Follow-Up → `LCS-05` Sales Conversation Preparation → `LCS-06` Sales Conversation / Decision Progress → `LCS-07` Won / Lost / Deferred Outcome → `LCS-08` Customer Handoff → `LCS-09` Enrollment Association → `LCS-10` Onboarding Initiation → `LCS-11` Onboarding Monitoring → `LCS-12` Active Delivery → `LCS-13` Progress and Engagement Monitoring → `LCS-14` Recurring Question / Support Preparation → `LCS-15` Attention Signal Emergence → `LCS-16` Attention Review → `LCS-17` Next Best Action Review → `LCS-18` Human Intervention → `LCS-19` Conversation Readiness → `LCS-20` Completion / Exit → `LCS-21` Renewal / Continuation Review → `LCS-22` Reactivation

This is not a strictly linear path. Stages may loop, skip, or re-enter.

---

## 2. Primary Flow

The normal path for a converting course seller:

1. Lead enters (`LCS-01`)
2. Context captured (`LCS-02`)
3. Qualified (`LCS-03`)
4. Follow-up until conversation (`LCS-04` loop)
5. Sales conversation prepared (`LCS-05`)
6. Sales conversation held (`LCS-06`)
7. Won outcome (`LCS-07`)
8. Customer handoff (`LCS-08`)
9. Enrollment associated (`LCS-09`)
10. Onboarding initiated and monitored (`LCS-10`, `LCS-11`)
11. Active delivery (`LCS-12`)
12. Progress monitored (`LCS-13` loop)
13. Conversations prepared as needed (`LCS-19`)
14. Questions handled via grounded preparation (`LCS-14`)
15. Attention and NBA as signals arise (`LCS-15`–`LCS-17`)
16. Human intervention when needed (`LCS-18`)
17. Completion (`LCS-20`)
18. Renewal review (`LCS-21`) or reactivation later (`LCS-22`)

---

## 3. Alternate Paths

| Alternate path | Entry point | Typical exit |
| -------------- | ----------- | ------------ |
| Lead lost | `LCS-07` | `LCS-22` reactivation or archive |
| Lead deferred | `LCS-07` | `LCS-04` follow-up or `LCS-22` |
| Reactivation | `LCS-22` | `LCS-04` or `LCS-03` |
| Customer paused | `LCS-12` / `LCS-20` | Resume `LCS-12` |
| Onboarding stalled | `LCS-11` | `LCS-18` intervention |
| Enrollment ended early | `LCS-20` | `LCS-22` or complete exit |
| Progress stalled | `LCS-13` | `LCS-15`–`LCS-18` |
| Renewal declined | `LCS-21` | `LCS-20` or `LCS-22` |

---

## 4. Looping Behavior

| Loop | Stages | Trigger |
| ---- | ------ | ------- |
| Follow-up repeats | `LCS-04` | No response, deferred decision |
| Conversation preparation repeats | `LCS-05`, `LCS-19` | Each scheduled interaction |
| Attention review repeats | `LCS-15`–`LCS-16` | New or returning evidence |
| Task continuity repeats | `LCS-04`, `LCS-09`, `LCS-18` | WF9 chains |
| Progress monitoring repeats | `LCS-13` | Ongoing delivery |
| Recurring Q&A | `LCS-14` | Repeated customer questions |

---

## 5. State Transition Table

| From Stage | Trigger | To Stage | Actor | Notes |
| ---------- | ------- | -------- | ----- | ----- |
| LCS-01 | Lead source identified | LCS-02 | Sales Operator / Owner | May be same person |
| LCS-02 | Minimum context captured | LCS-03 | Sales Operator | May skip if unqualified early |
| LCS-03 | Qualified | LCS-04 | Sales Operator | Unqualified → LCS-07 Lost or Deferred |
| LCS-04 | Follow-up due | LCS-05 | Sales Operator | Loop if no conversation yet |
| LCS-05 | Prepared | LCS-06 | Sales Operator | |
| LCS-06 | Decision point | LCS-07 | Lead + Sales Operator | |
| LCS-07 | Won | LCS-08 | Sales Operator | Lost/Deferred → LCS-22 or end |
| LCS-08 | Handoff complete | LCS-09 | Owner / Coach | |
| LCS-09 | Program linked | LCS-10 | Coach / Owner | |
| LCS-10 | Onboarding started | LCS-11 | Coach / Customer | |
| LCS-11 | Onboarding complete | LCS-12 | System Process | Stall → LCS-15 |
| LCS-12 | Active participation | LCS-13 | Coach | Ongoing |
| LCS-13 | Stall/risk signal | LCS-15 | ZyntixAI (Observe/Analyze) | |
| LCS-14 | Question received | LCS-14 | Owner + ZyntixAI Prepare | May loop |
| LCS-15 | Signal surfaced | LCS-16 | Owner | |
| LCS-16 | Review complete | LCS-17 or LCS-18 | Owner | |
| LCS-17 | Action recommended | LCS-18 or dismiss | Owner | |
| LCS-18 | Intervention done | LCS-12 or LCS-04 | Owner | |
| LCS-19 | Conversation upcoming | LCS-06 or check-in | Owner + Customer | Dual readiness |
| LCS-12 | Program ends | LCS-20 | Owner | |
| LCS-20 | Continuation possible | LCS-21 | Owner | |
| LCS-21 | No renewal | LCS-22 or exit | Owner | |
| LCS-22 | Re-engagement | LCS-04 or LCS-03 | Sales Operator | |

---

## 6. Non-Linear Reality

Real course businesses may:

- skip qualification for warm referrals
- re-enter follow-up after months of deferral
- pause enrollments without exiting customer relationship
- complete one program and immediately start another (`LCS-09` again)
- never formally "lose" a lead but let it go dormant (`LCS-22` candidate)

The lifecycle map models **common** behavior, not every business identically.

---

## 7. Traceability

| Workflow | Primary lifecycle stages |
| -------- | ------------------------ |
| WF1 Lead to Follow-Up | LCS-01–04, LCS-22 |
| WF2 Lead to Customer Handoff | LCS-07–08 |
| WF3 Customer to Enrollment | LCS-08–09, LCS-12 |
| WF4 Onboarding Visibility | LCS-10–11 |
| WF5 Progress Review | LCS-13 |
| WF6 Attention to Intervention | LCS-15–18 |
| WF7 Morning Prioritization | Aggregates LCS-04, 07, 11, 13, 15–17, 19 |
| WF8 Conversation Preparation | LCS-05, LCS-19 |
| WF9 Task Continuity | LCS-04, 10, 18, 19 |
| WF10 Next Best Action | LCS-17 |
