# ZyntixAI Phase 1 Cross-Lifecycle Information Model

## 1. Cross-Lifecycle Principle

Some operational information spans multiple lifecycle stages and objects. Cross-lifecycle threads are **capabilities and contexts**, not navigation destinations. They surface where the user is already working, in aggregates that reference authoritative sources, or via contextual AI command.

---

## 2. Recurring Question / Support Preparation

| Field | Specification |
| ----- | ------------- |
| L2 stage | LCS-14 |
| L2.1 decision | OD-013 — cross-lifecycle thread; WF8 conditional only within conversation prep |
| Primary contexts | Customer detail, Lead detail (if pre-sale question) |
| Aggregate surface | Command Center may reference "questions awaiting preparation" if surfaced as task |
| Standalone destination | **No** — not a Support Center, chatbot, or knowledge base |
| Access rule | User opens Customer/Lead → AI prepare grounded answer → human reviews → human sends externally |
| WF8 boundary | When preparation occurs inside LCS-05/LCS-19 conversation prep, embed in preparation context |

---

## 3. Notes and Operational Context

| Field | Specification |
| ----- | ------------- |
| Scope | S10 |
| Primary contexts | Lead detail, Customer detail |
| Aggregate surface | Command Center does not duplicate notes |
| Standalone destination | **No** |
| Access rule | Notes anchored to Lead or Customer; searchable via discovery |
| L2 support | LCS-02, 06, 08, 14 |

---

## 4. Tasks and Follow-Up

| Field | Specification |
| ----- | ------------- |
| Scope | S7 |
| Primary contexts | Top-level Tasks list; linked sections on Lead/Customer |
| Aggregate surface | Command Center references overdue/due today tasks |
| Standalone destination | **Yes** — Tasks is top-level (high frequency P1-07) |
| Access rule | Single Task object; contextual views are filters of same object |
| L2 support | LCS-04, 10, 18, 19; WF9 |

---

## 5. Needs Attention

| Field | Specification |
| ----- | ------------- |
| Scope | S8 |
| Primary contexts | Top-level Attention queue (authoritative) |
| Aggregate surface | Command Center references open attention items |
| Contextual surface | Badge/count on Lead/Customer/Enrollment linking to same item |
| Standalone destination | **Yes** — Attention queue is top-level |
| Access rule | One attention item, one review state, all surfaces reference same ID |
| Evidence | Required — insufficient evidence does not surface (L2 exception flows) |
| L2 support | LCS-15–16, LCS-18; WF6 |

---

## 6. Next Best Action

| Field | Specification |
| ----- | ------------- |
| Scope | S9 |
| L2.1 decision | OD-015 — LCS-17 reviews existing recommendations; no self-generating loop |
| Candidate generation | In operational context (LCS-02, 04, 07, 08, 10, 11, 13, 14, 15, 18, 19, 21, 22) |
| Review location | NBA review intent (accessible from Command Center, Attention escalation, object contextual panel) |
| Aggregate surface | Command Center references NBA awaiting review |
| Contextual surface | Object detail shows current recommendation with link to review |
| Standalone destination | **Review intent yes; generation no** |
| Access rule | Accept/defer/dismiss in one review surface; new candidate requires changed context |
| L2 support | LCS-17; WF10 |

---

## 7. Conversation Preparation

| Field | Specification |
| ----- | ------------- |
| Scope | S11 |
| L2 decision | OD-009 — dual actor: operator prep + customer readiness |
| Primary contexts | Lead detail (sales), Customer detail (delivery) |
| Trigger | Upcoming conversation identified (task, calendar intent, manual) |
| Aggregate surface | Command Center references upcoming conversations needing prep |
| Standalone destination | **No** — contextual preparation intent |
| WF8 | Direct for LCS-05, LCS-19; conditional for LCS-14 within prep |
| L2 support | LCS-05, LCS-19 |

---

## 8. Bounded AI Assistance

| Field | Specification |
| ----- | ------------- |
| Scope | S13 |
| Primary contexts | Invoked from Lead, Customer, Task, Attention, Command Center |
| Standalone destination | **No** — not an "AI app" section |
| Access rule | Contextual command; grounded in current object permissions |
| Capabilities | Summarize, prepare draft, explain attention/NBA rationale, prepare answer |
| Boundary | No autonomous send; no permission bypass; no fabricated facts |
| L2 support | LCS-05, 14, 15–17, 19 |

---

## 9. Progress and Engagement

| Field | Specification |
| ----- | ------------- |
| Scope | S6 |
| Primary contexts | Enrollment detail; summary on Customer |
| Aggregate surface | Command Center may reference progress stall candidates |
| Standalone destination | **No** |
| Access rule | Unknown is valid state; does not fabricate signals |
| L2 support | LCS-13; WF5 |

---

## 10. Onboarding Visibility

| Field | Specification |
| ----- | ------------- |
| Scope | S12 |
| Primary contexts | Enrollment detail; summary on Customer |
| Aggregate surface | Command Center references onboarding gaps |
| Standalone destination | **No** |
| Access rule | Incomplete/blocked states visible; intervention links to Attention/Tasks |
| L2 support | LCS-10–11; WF4 |

---

## 11. Information Ownership

| Thread | Authoritative Owner |
| ------ | ------------------- |
| Task | Task object |
| Attention Item | Attention queue |
| NBA Recommendation | NBA review surface |
| Note | Note linked to Lead/Customer |
| Enrollment lifecycle | Enrollment object |
| AI output | Contextual to invocation — not standalone record type at IA level |
| Command Center synthesis | Aggregate lens only |

---

## 12. Contextual Surfacing

Cross-lifecycle threads appear on object detail when:

- The thread has active work for that entity (open task, open attention, pending NBA, upcoming conversation)
- The user invokes AI command from that context
- A question is received (recurring Q&A on Customer/Lead)

---

## 13. Aggregate Surfacing

Command Center surfaces **counts, summaries, and priority references** for cross-lifecycle threads. Each reference includes enough identity to drill to authoritative owner.

---

## 14. Authoritative Source Principle

> If two screens show the same operational item, they reference the same underlying object with the same ID and state.

Violations (separate attention lists, independent NBA copies) are IA defects.

---

## 15. Duplication Rules

1. Command Center never owns task completion state.
2. Customer detail never owns attention dismissal state.
3. Object contextual NBA panel never owns review outcome — links to review surface.
4. Enrollment summary on Customer never owns full onboarding detail.

---

## 16. L2.1 Semantic Preservation

| Decision | IA Preservation |
| -------- | --------------- |
| OD-013 | Recurring Q&A contextual on Lead/Customer; WF8 only in conversation prep embed |
| OD-014 | Paused shown as Enrollment state filter/badge; no "Paused customers" top-level destination |
| OD-015 | NBA review surface separate from candidate generation; no infinite review loop in navigation |
