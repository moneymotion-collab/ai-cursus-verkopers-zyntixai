# ZyntixAI Course Seller Operational State Model

## 1. State Modelling Principle

These are **product operational states**, not database schema, enums, or API contracts.

States describe how operators understand where a lead, customer, enrollment, or operational item stands in real work.

Transitions are evidence-driven, human-controlled where consequential, and may be reversible.

---

## 2. Lead State Concepts

| Conceptual state | Meaning |
| ---------------- | ------- |
| New | Lead is known but minimally contextualized |
| Context Incomplete | Insufficient information for meaningful follow-up |
| Unqualified | Fit or intent not established |
| Qualified | Meaningful fit or intent indicated |
| Follow-Up Due | Next contact action is required |
| Conversation Planned | Sales conversation scheduled or intended |
| Decision Pending | Awaiting lead decision |
| Won | Commercial outcome positive |
| Lost | Commercial outcome negative |
| Deferred | Lead paused; may return |
| Reactivation Candidate | Prior lead may warrant renewed attention |

---

## 3. Customer Relationship State Concepts

| Conceptual state | Meaning |
| ---------------- | ------- |
| New Customer | Recently converted; handoff in progress |
| Active | Ongoing operational relationship |
| Needs Attention | Attention signal under review or open |
| Paused | Relationship temporarily inactive |
| Completed | Program relationship completed successfully |
| Exited | Relationship ended without completion |
| Reactivation Candidate | Prior customer may warrant renewed outreach |

---

## 4. Enrollment State Concepts

| Conceptual state | Meaning |
| ---------------- | ------- |
| Pending | Association initiated but not active |
| Onboarding | Enrollment active; onboarding in progress |
| Active | Customer actively participating in delivery |
| Paused | Delivery temporarily suspended |
| At Risk | Engagement or progress concern flagged — **visibility interpretation only**; see §4.1 |
| Completed | Program relationship fulfilled |
| Ended | Enrollment ended early or exited |

---

## 4.1 Enrollment "At Risk" and Attention Authority (L3.1-R1)

`At Risk` is an **enrollment-scoped visibility state**, not a separate review queue object.

| Rule | Requirement |
| ---- | ----------- |
| Meaning | The enrollment currently has evidence-backed concern associated with human review |
| Authoritative review object | **Attention Item** in the Attention queue (single lifecycle per underlying concern) |
| Same concern | MUST NOT produce multiple authoritative Attention Items for the same underlying evidence and concern identity |
| Badge relationship | Enrollment `At Risk` MUST reference the authoritative Attention Item (or eligible candidate not yet open); it MUST NOT stand alone as a second authoritative review object |
| Distinct concerns | Materially different evidence (e.g., stalled progress vs missed onboarding step) MAY produce separate Attention Items on the same enrollment |
| Resolution | When the authoritative Attention Item is resolved, dismissed, or superseded without remaining valid evidence, `At Risk` MUST NOT persist as an independent authority |
| No risk engine | `At Risk` does not imply autonomous churn scoring or a separate risk queue |

---

## 5. Onboarding State Concepts

| Conceptual state | Meaning |
| ---------------- | ------- |
| Not Started | Onboarding not yet initiated |
| In Progress | Onboarding steps underway |
| Blocked | Progress blocked by missing step or dependency |
| Incomplete | Required steps remain open past expected window |
| Complete | Required onboarding steps satisfied |

---

## 6. Progress / Engagement State Concepts

| Conceptual state | Meaning |
| ---------------- | ------- |
| Unknown | No reliable evidence available |
| Healthy | Evidence indicates normal participation |
| Stalled | Progress appears stopped |
| Declining | Engagement trend negative |
| Needs Review | Ambiguous or conflicting signals require human review |

No universal numeric thresholds are defined at L2.

---

## 7. Attention Item State Concepts

| Conceptual state | Meaning |
| ---------------- | ------- |
| Candidate | Evidence suggests attention may be needed |
| Open | Attention item surfaced for review |
| Reviewed | Operator has examined evidence |
| Snoozed | Deferred for later review |
| Dismissed | Operator determined no action needed |
| Resolved | Intervention completed or issue addressed |

---

## 8. Task State Concepts

| Conceptual state | Meaning |
| ---------------- | ------- |
| Planned | Task created for future action |
| Due | Task due now or today |
| Overdue | Task past due without completion |
| Completed | Task finished |
| Cancelled | Task no longer applicable |

---

## 9. Next Best Action State Concepts

| Conceptual state | Meaning |
| ---------------- | ------- |
| Candidate | System may recommend an action |
| Recommended | Action proposed with rationale |
| Reviewed | Operator has seen recommendation |
| Accepted | Operator agrees to perform action |
| Deferred | Operator postpones action |
| Dismissed | Operator rejects recommendation |
| Completed | Recommended action performed |

---

## 10. Conversation Readiness Concepts

### Operator readiness

| Conceptual state | Meaning |
| ---------------- | ------- |
| Unknown | Preparation status not assessed |
| Incomplete | Operator lacks sufficient context |
| Ready | Operator has reviewed relevant preparation |
| Blocked | Critical missing context prevents effective conversation |

### Customer readiness

| Conceptual state | Meaning |
| ---------------- | ------- |
| Unknown | Customer preparation status not known |
| Incomplete | Required pre-call items outstanding |
| Ready | Required preparation items satisfied |
| Blocked | Customer cannot proceed without intervention |

Operator readiness and customer readiness are **independent** dimensions.

---

## 11. Transition Principles

1. **Evidence-driven** — State changes reflect observable operational evidence.
2. **Human decision where consequential** — Qualification, intervention, dismissal, and external communication remain human-controlled.
3. **Reversible where appropriate** — Deferred, snoozed, and dismissed states may change with new evidence.
4. **Explicit failure state** — Unknown, incomplete, blocked, and ambiguous states are first-class.
5. **No silent transition** — State changes should be traceable to an event or human action.
6. **Pause ≠ terminal** — `Paused` is a temporary enrollment/customer state during `LCS-12`/`LCS-13`. It does not route through `LCS-20` Completion/Exit.
7. **NBA review ≠ candidate generation** — `Recommended` → `Reviewed` occurs in `LCS-17`. New `Candidate` states require changed context or explicit recomputation.

---

## 12. State-to-Scope Traceability

| State family | Primary scope domains |
| ------------ | --------------------- |
| Lead | S2, S7 |
| Customer | S3, S8 |
| Enrollment | S4, S5 |
| Onboarding | S12, S5 |
| Progress/engagement | S6, S8 |
| Attention | S8 |
| Task | S7 |
| Next best action | S9 |
| Conversation readiness | S11, S7, S12 |
| AI-assisted preparation | S13 |
