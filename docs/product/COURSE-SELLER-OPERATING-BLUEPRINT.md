# ZyntixAI Course Seller Operating Blueprint

## 1. Document Status

| Field | Value |
| ----- | ----- |
| Status | `FROZEN FOR L2 OPERATING MODEL` |
| Target market | `Course Sellers` |
| Track owner | `Laptop Product Completion Track` |
| Technical authority | `Computer 1` |
| Branch | `parallel/laptop-product-track-20260707` |

This is a **product operating model**. It does not authorize technical implementation, database schema, API design, or backend changes.

---

## 2. Operating Mission

Model how a course-selling business moves work, people, context, decisions, and attention from first lead contact through delivery, monitoring, intervention, completion, and reactivation.

Core chain: **Event → Context → Decision → Action → Outcome → Next State**

---

## 3. Course Seller Operating Profile

A Phase 1 course seller typically operates through:

- lead generation and intake
- qualification and sales conversations
- conversion to paying customers
- program/offer association and enrollment
- onboarding and activation
- active program delivery and check-ins
- progress and engagement monitoring
- follow-up, tasks, and attention management
- conversation preparation (operator and customer readiness)
- recurring questions and support preparation
- completion, renewal consideration, and reactivation

One operator may perform sales, coaching, and ownership roles. The model supports single-person businesses without requiring separate staff.

---

## 4. Operating Principles

1. **Context before recommendation** — No action without available operational context.
2. **Evidence before attention** — Needs Attention requires explainable evidence.
3. **Human control over consequential action** — AI prepares; humans decide and execute externally.
4. **One operational lifecycle** — Leads, customers, and enrollments connect in one model.
5. **Explicit next state** — Transitions are traceable.
6. **Failure states are first-class** — Unknown, incomplete, blocked, and ambiguous are valid.
7. **No silent scope expansion** — L2 operationalizes frozen S1–S13 only.
8. **Common core before niche depth** — Trading/fitness examples inform but do not define universal requirements.

---

## 5. Full Lifecycle Overview

| ID | Stage |
| -- | ----- |
| LCS-01 | Lead Entry |
| LCS-02 | Lead Context Capture |
| LCS-03 | Qualification |
| LCS-04 | Follow-Up |
| LCS-05 | Sales Conversation Preparation |
| LCS-06 | Sales Conversation / Decision Progress |
| LCS-07 | Won / Lost / Deferred Outcome |
| LCS-08 | Customer Handoff |
| LCS-09 | Enrollment Association |
| LCS-10 | Onboarding Initiation |
| LCS-11 | Onboarding Monitoring |
| LCS-12 | Active Delivery |
| LCS-13 | Progress and Engagement Monitoring |
| LCS-14 | Recurring Question / Support Preparation |
| LCS-15 | Attention Signal Emergence |
| LCS-16 | Attention Review |
| LCS-17 | Next Best Action Review |
| LCS-18 | Human Intervention |
| LCS-19 | Conversation Readiness |
| LCS-20 | Completion / Exit |
| LCS-21 | Renewal / Continuation Review |
| LCS-22 | Reactivation |

---

## 6. Detailed Stage Specifications

### LCS-01 — Lead Entry

| Field | Specification |
| ----- | ------------- |
| Operational purpose | A potential customer becomes known to the business |
| Primary actor | Sales Operator |
| Trigger | Lead arrives via form, referral, outreach response, event, or manual entry |
| Entry conditions | Business is actively selling programs |
| Required context | Lead identity (minimum), source if known, entry timestamp |
| Main flow | Lead recorded → appears in lead operational view → context capture begins |
| Human decision boundary | Whether to pursue lead; whether duplicate |
| AI role | Observe (record); optional Analyze for source patterns |
| Expected outcome | Lead exists in operational system with traceable entry |
| Exit conditions | Lead record created |
| Next states | LCS-02, LCS-03 (if context sufficient) |
| Failure/exception | Duplicate lead, missing contact, unknown source |
| Attention potential | Low — unless duplicate or data quality issue |
| NBA potential | "Capture missing context" if incomplete |
| Traceability | P1-06 \| S2 \| WF1 |

### LCS-02 — Lead Context Capture

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Relevant lead context becomes available for follow-up and qualification |
| Primary actor | Sales Operator |
| Trigger | New lead or incomplete lead context |
| Entry conditions | Lead exists |
| Required context | Contact details, source, interest signals, initial notes |
| Main flow | Operator adds notes/context → lead status updated → qualification enabled |
| Human decision boundary | What context is accurate; what to record |
| AI role | Prepare (summarize inbound info if available) |
| Expected outcome | Lead has enough context for meaningful next step |
| Exit conditions | Context sufficient or explicitly incomplete |
| Next states | LCS-03, LCS-04 |
| Failure/exception | Insufficient context, conflicting notes |
| Attention potential | Context incomplete beyond threshold → candidate |
| NBA potential | "Obtain missing contact" or "add qualification note" |
| Traceability | P1-01, P1-11 \| S2, S10 \| WF1 |

### LCS-03 — Qualification

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Determine whether meaningful fit or intent exists |
| Primary actor | Sales Operator |
| Trigger | Sufficient context for qualification attempt |
| Entry conditions | Lead context available |
| Required context | Interest, fit signals, program alignment, prior interactions |
| Main flow | Operator reviews → qualifies, defers, or disqualifies → status recorded |
| Human decision boundary | Qualification outcome |
| AI role | Recommend (qualification questions or fit summary) |
| Expected outcome | Lead has clear qualification state |
| Exit conditions | Qualified, unqualified, or deferred |
| Next states | LCS-04 (qualified), LCS-07 (lost/deferred) |
| Failure/exception | Ambiguous fit; premature qualification |
| Attention potential | High-value lead unqualified without review — optional |
| NBA potential | "Schedule qualification call" |
| Traceability | P1-06 \| S2 \| WF1 |

### LCS-04 — Follow-Up

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Execute required next contact or follow-up action |
| Primary actor | Sales Operator |
| Trigger | Follow-up due, no response, or scheduled contact |
| Entry conditions | Lead in follow-up-worthy state |
| Required context | Last activity, notes, next action, contact method |
| Main flow | Task surfaced → operator contacts → outcome recorded → next follow-up scheduled or stage advances |
| Human decision boundary | Whether/when/how to follow up; message content |
| AI role | Prepare (draft follow-up from context) |
| Expected outcome | Timely, context-aware follow-up |
| Exit conditions | Response received, conversation scheduled, or defer/lost |
| Next states | LCS-04 (loop), LCS-05, LCS-06, LCS-07, LCS-22 |
| Failure/exception | No response, duplicate tasks, missing contact |
| Attention potential | Overdue follow-up on high-value lead |
| NBA potential | "Send follow-up today" with rationale |
| Traceability | P1-06, P1-07 \| S2, S7 \| WF1, WF9 |

### LCS-05 — Sales Conversation Preparation

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Prepare operator for meaningful sales interaction |
| Primary actor | Sales Operator |
| Trigger | Sales conversation scheduled or imminent |
| Entry conditions | Lead qualified or in active sales dialogue |
| Required context | Lead history, notes, program fit, objections, prior interactions |
| Main flow | Preparation view opened → context reviewed → talking points prepared → conversation conducted |
| Human decision boundary | What to emphasize; whether ready to converse |
| AI role | Prepare (summary, talking points) |
| Expected outcome | Operator enters conversation with relevant context |
| Exit conditions | Preparation complete or gaps acknowledged |
| Next states | LCS-06, LCS-19 |
| Failure/exception | Missing history, stale context |
| Attention potential | High-value lead conversation unprepared |
| NBA potential | "Complete sales prep before call" |
| Traceability | P1-10 \| S11, S13 \| WF8 |

### LCS-06 — Sales Conversation / Decision Progress

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Lead moves toward commercial decision |
| Primary actor | Sales Operator |
| Trigger | Conversation occurs |
| Entry conditions | Preparation done or conversation started ad hoc |
| Required context | Offer/program context, lead state, conversation notes |
| Main flow | Conversation held → notes captured → decision state updated |
| Human decision boundary | Offer presentation; commitment; next step |
| AI role | Analyze (post-conversation summary optional) |
| Expected outcome | Decision progress recorded |
| Exit conditions | Decision pending, won, lost, or deferred |
| Next states | LCS-04, LCS-07 |
| Failure/exception | Decision delayed without next action |
| Attention potential | Decision pending too long |
| NBA potential | "Schedule decision follow-up" |
| Traceability | P1-06, P1-11 \| S2, S10 \| WF1 |

### LCS-07 — Won / Lost / Deferred Outcome

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Commercial outcome becomes known |
| Primary actor | Sales Operator |
| Trigger | Lead decision or operator determination |
| Entry conditions | Sales process reached outcome point |
| Required context | Outcome, reason (if known), program selected (if won) |
| Main flow | Outcome recorded → next lifecycle path determined |
| Human decision boundary | Outcome classification |
| AI role | Observe |
| Expected outcome | Clear commercial outcome with traceability |
| Exit conditions | Won, lost, or deferred recorded |
| Next states | LCS-08 (won), LCS-22 (deferred/lost), end |
| Failure/exception | Unclear payment/decision; conversion without context |
| Attention potential | Won without handoff readiness |
| NBA potential | "Complete handoff" (won) or "Schedule reactivation" (deferred) |
| Traceability | P1-06 \| S2 \| WF2 |

### LCS-08 — Customer Handoff

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Won lead becomes operational customer with preserved context |
| Primary actor | Sales Operator → Coach/Owner |
| Trigger | Lead won |
| Entry conditions | Won outcome recorded |
| Required context | Lead history, notes, program selection, expectations |
| Main flow | Customer context created/linked → lead history preserved → delivery owner notified |
| Human decision boundary | Handoff completeness; program association |
| AI role | Prepare (handoff summary) |
| Expected outcome | No restart-from-zero; customer 360 populated |
| Exit conditions | Customer record active with handoff context |
| Next states | LCS-09 |
| Failure/exception | Missing notes; duplicate customer |
| Attention potential | Handoff incomplete |
| NBA potential | "Complete customer handoff notes" |
| Traceability | P1-01, P1-11, P1-14 \| S3, S10 \| WF2 |

### LCS-09 — Enrollment Association

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Customer linked to program/offer for delivery |
| Primary actor | Coach / Owner |
| Trigger | Customer ready for program association |
| Entry conditions | Customer exists; program identified |
| Required context | Customer, program, offer terms (operational), start expectations |
| Main flow | Enrollment created → program context visible → lifecycle state set |
| Human decision boundary | Correct program; start timing |
| AI role | Observe |
| Expected outcome | Customer-program relationship operational |
| Exit conditions | Enrollment associated |
| Next states | LCS-10 |
| Failure/exception | Wrong program; ambiguous association |
| Attention potential | Customer without enrollment post-sale |
| NBA potential | "Associate enrollment with program X" |
| Traceability | P1-14 \| S4, S5 \| WF3 |

### LCS-10 — Onboarding Initiation

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Required onboarding work begins |
| Primary actor | Coach |
| Trigger | Enrollment active; onboarding required |
| Entry conditions | Enrollment associated |
| Required context | Onboarding checklist/steps, customer contact, program requirements |
| Main flow | Onboarding state set → steps assigned → customer notified (human-initiated) |
| Human decision boundary | Onboarding plan; first steps |
| AI role | Recommend (highlight first steps) |
| Expected outcome | Onboarding visibly started |
| Exit conditions | Onboarding in progress |
| Next states | LCS-11 |
| Failure/exception | Onboarding never started; missing step definition |
| Attention potential | Not started within expected window |
| NBA potential | "Initiate onboarding for customer" |
| Traceability | P1-13 \| S5, S12 \| WF4 |

### LCS-11 — Onboarding Monitoring

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Incomplete or stalled onboarding becomes visible |
| Primary actor | Coach |
| Trigger | Onboarding in progress; periodic review |
| Entry conditions | Onboarding initiated |
| Required context | Step completion state, blockers, elapsed time |
| Main flow | Progress reviewed → gaps surfaced → intervention or continuation |
| Human decision boundary | Whether onboarding complete; intervention needed |
| AI role | Analyze (missing steps) |
| Expected outcome | Onboarding state accurate; stalls visible |
| Exit conditions | Complete, incomplete, or blocked |
| Next states | LCS-12 (complete), LCS-15 (stall), LCS-18 |
| Failure/exception | Stalled, blocked, business-side delay |
| Attention potential | Yes — incomplete/stalled onboarding |
| NBA potential | "Complete onboarding step X" |
| Traceability | P1-02, P1-13 \| S12, S8 \| WF4 |

### LCS-12 — Active Delivery

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Customer actively participates in program relationship |
| Primary actor | Coach |
| Trigger | Onboarding complete or delivery start without formal onboarding |
| Entry conditions | Active enrollment |
| Required context | Program context, enrollment state, customer history |
| Main flow | Delivery activities occur → notes and signals recorded → monitoring continues |
| Human decision boundary | Delivery interventions; pacing |
| AI role | Observe |
| Expected outcome | Active participation tracked operationally |
| Exit conditions | Pause, completion, or exit initiated |
| Next states | LCS-13, LCS-19, LCS-20 |
| Failure/exception | Pause without reason; disengagement |
| Attention potential | Disengagement during delivery |
| NBA potential | "Schedule check-in" |
| Traceability | P1-03, P1-14 \| S4, S5, S6 \| WF3, WF5 |

### LCS-13 — Progress and Engagement Monitoring

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Observe whether customer is progressing or engaging |
| Primary actor | Coach |
| Trigger | Ongoing delivery; review cycle; new signal |
| Entry conditions | Active enrollment |
| Required context | Progress signals, engagement signals, last activity |
| Main flow | Signals reviewed → state assessed (healthy/stalled/declining/unknown) → action considered |
| Human decision boundary | Interpretation when ambiguous |
| AI role | Analyze (trend summary) |
| Expected outcome | Progress state visible and honest |
| Exit conditions | Review complete; state updated |
| Next states | LCS-13 (loop), LCS-15, LCS-18 |
| Failure/exception | No signals; stale/conflicting signals |
| Attention potential | Yes — stall or decline |
| NBA potential | "Review stalled customer progress" |
| Traceability | P1-03, P1-12 \| S6, S8 \| WF5 |

### LCS-14 — Recurring Question / Support Preparation

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Reduce repeat-answer burden via grounded preparation |
| Primary actor | Coach / Owner |
| Trigger | Customer question received (any channel — human-mediated) |
| Entry conditions | Question identified; customer/lead context available |
| Required context | Customer 360, notes, program context, prior Q&A patterns |
| Main flow | Question linked to context → grounded draft prepared → human reviews → human sends |
| Human decision boundary | Answer accuracy; whether to send; personalization |
| AI role | Prepare (grounded answer draft) |
| Expected outcome | Faster, consistent, personalized responses |
| Exit conditions | Answer sent or deferred; context updated |
| Next states | LCS-14 (loop), LCS-12 |
| Failure/exception | Missing context; ungrounded draft |
| Attention potential | Repeated questions without resolution pattern |
| NBA potential | "Prepare answer for recurring question" |
| Traceability | P1-04, P1-05 \| S13, S10, S3 \| WF8 |

**L1.1 Q1 resolution:** Explicit FAQ tagging is optional. Minimum behavior: question context + operational context + bounded grounded preparation + human review. Pattern detection deferred to L5/L6 if needed.

**L1.1 Q3 resolution:** Drafts conceptually link to customer/lead context and the active request (follow-up, conversation prep, or inbound question). Screen placement = L4.

### LCS-15 — Attention Signal Emergence

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Evidence suggests lead/customer/enrollment needs attention |
| Primary actor | System Process |
| Trigger | Rule/threshold candidate (onboarding stall, overdue follow-up, progress decline, etc.) |
| Entry conditions | Evidence available |
| Required context | Evidence category, entity, severity indicator |
| Main flow | Candidate generated → surfaced for review (not auto-action) |
| Human decision boundary | N/A at emergence — review follows |
| AI role | Analyze (explain why candidate) |
| Expected outcome | Attention candidate with evidence |
| Exit conditions | Candidate surfaced or suppressed (insufficient evidence) |
| Next states | LCS-16 |
| Failure/exception | Insufficient evidence; duplicate candidate |
| Attention potential | This stage creates attention |
| NBA potential | "Review attention item" |
| Traceability | P1-02, P1-12 \| S8 \| WF6 |

### LCS-16 — Attention Review

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Operator reviews evidence and decides on intervention |
| Primary actor | Business Owner |
| Trigger | Attention item open |
| Entry conditions | Attention candidate with evidence |
| Required context | Reason, severity, related entity, history |
| Main flow | Review → dismiss, snooze, or escalate to intervention |
| Human decision boundary | Dismissal, snooze, intervention |
| AI role | Recommend (suggested intervention) |
| Expected outcome | Human decision on attention item |
| Exit conditions | Dismissed, snoozed, or escalated |
| Next states | LCS-17, LCS-18, end |
| Failure/exception | False positive; stale signal |
| Attention potential | N/A — review stage |
| NBA potential | Leads to LCS-17 |
| Traceability | P1-02 \| S8 \| WF6 |

### LCS-17 — Next Best Action Review

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Practical next action recommended and reviewed |
| Primary actor | Business Owner |
| Trigger | Attention review, morning prioritization, or explicit request |
| Entry conditions | Entity in actionable state |
| Required context | Current state, evidence, recommended action, rationale |
| Main flow | Recommendation shown → rationale reviewed → accept/defer/dismiss |
| Human decision boundary | Accept or reject action |
| AI role | Recommend |
| Expected outcome | Clear next action decision |
| Exit conditions | Action accepted, deferred, or dismissed |
| Next states | LCS-18, LCS-04, LCS-09, etc. |
| Failure/exception | Recommendation without evidence |
| Attention potential | No |
| NBA potential | This stage is NBA |
| Traceability | P1-15 \| S9 \| WF10 |

### LCS-18 — Human Intervention

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Operator performs or approves corrective action |
| Primary actor | Coach / Owner |
| Trigger | Accepted attention, NBA, or operational need |
| Entry conditions | Decision to intervene |
| Required context | Intervention target, evidence, suggested approach |
| Main flow | Intervention performed → outcome recorded → tasks updated |
| Human decision boundary | Entire intervention |
| AI role | Prepare (draft outreach, talking points) |
| Expected outcome | Issue addressed or consciously deferred |
| Exit conditions | Resolved or re-scheduled |
| Next states | LCS-12, LCS-04, LCS-11, etc. |
| Failure/exception | Intervention without follow-up |
| Attention potential | Unresolved intervention |
| NBA potential | "Complete intervention follow-up" |
| Traceability | P1-02, P1-12 \| S7, S8 \| WF6, WF9 |

### LCS-19 — Conversation Readiness

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Upcoming conversation has operator preparation and customer readiness visibility |
| Primary actor | Coach |
| Trigger | Conversation scheduled or approaching |
| Entry conditions | Conversation identified |
| Required context | History, notes, progress, tasks, onboarding state |
| Main flow | Operator prep reviewed → customer readiness checked → gaps addressed |
| Human decision boundary | Proceed/postpone; how to address customer gaps |
| AI role | Prepare (operator summary) |
| Expected outcome | Both readiness dimensions visible |
| Exit conditions | Conversation held or rescheduled |
| Next states | LCS-06 (sales) or delivery check-in |
| Failure/exception | Operator incomplete; customer incomplete |
| Attention potential | Conversation with critical readiness gaps |
| NBA potential | "Complete pre-call task before conversation" |
| Traceability | P1-09, P1-10 \| S11, S7, S12 \| WF8 |

**Customer readiness common-core signals (OD-011):**

- Required pre-call task complete?
- Requested information submitted?
- Questions submitted by customer?
- Progress update available?
- Preparation item complete?
- Onboarding requirement complete (where relevant)?

Niche-specific signals (e.g., trading journal) deferred.

### LCS-20 — Completion / Exit

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Program relationship completes, ends, pauses, or exits |
| Primary actor | Coach / Owner |
| Trigger | Program end, early exit, pause request |
| Entry conditions | Active or paused enrollment |
| Required context | Completion criteria, exit reason, customer state |
| Main flow | Outcome recorded → enrollment state updated → renewal/reactivation considered |
| Human decision boundary | Completion vs exit; pause |
| AI role | Observe |
| Expected outcome | Clear end state |
| Exit conditions | Completed, ended, or paused recorded |
| Next states | LCS-21, LCS-22 |
| Failure/exception | Ambiguous end state |
| Attention potential | Exit without handoff note |
| NBA potential | "Record completion outcome" |
| Traceability | P1-14 \| S5 \| WF3 |

### LCS-21 — Renewal / Continuation Review

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Assess whether customer continues or renews |
| Primary actor | Business Owner |
| Trigger | Program completion or renewal window |
| Entry conditions | Completion or continuation opportunity |
| Required context | Customer history, outcomes, program fit |
| Main flow | Review → renewal outreach planned or declined |
| Human decision boundary | Renewal pursuit |
| AI role | Recommend (continuation opportunity) |
| Expected outcome | Renewal decision recorded |
| Exit conditions | Renewed, declined, or deferred |
| Next states | LCS-09 (new enrollment), LCS-22, end |
| Failure/exception | Not a revenue automation platform — human-driven |
| Attention potential | High-value customer renewal window |
| NBA potential | "Contact for renewal" |
| Traceability | P1-15 \| S9 \| WF10 |

### LCS-22 — Reactivation

| Field | Specification |
| ----- | ------------- |
| Operational purpose | Prior lead or customer may warrant renewed attention |
| Primary actor | Sales Operator |
| Trigger | Deferred lead, lost lead return, inactive customer signal |
| Entry conditions | Reactivation candidate state |
| Required context | Prior history, reason for dormancy, current fit |
| Main flow | Candidate reviewed → re-engagement planned or dismissed |
| Human decision boundary | Whether to reactivate |
| AI role | Recommend |
| Expected outcome | Re-engagement or conscious no-action |
| Exit conditions | Re-enter LCS-03/04 or dismiss |
| Next states | LCS-03, LCS-04 |
| Failure/exception | Stale context for reactivation |
| Attention potential | Dormant high-value lead/customer |
| NBA potential | "Reactivate lead/customer X" |
| Traceability | P1-06 \| S2, S9 \| WF1 |

---

## 7. Cross-Lifecycle Operating Threads

| Thread | Stages | Scope domains |
| ------ | ------ | ------------- |
| Lead Follow-Up | LCS-01–07, LCS-22 | S2, S7 |
| Customer Context | LCS-08–14 | S3, S10 |
| Enrollment | LCS-09–12, LCS-20 | S4, S5 |
| Onboarding | LCS-10–11 | S12, S5 |
| Progress | LCS-12–13 | S6 |
| Attention | LCS-15–16, LCS-18 | S8 |
| Next Best Action | LCS-17 | S9 |
| Task Continuity | LCS-04, 10, 18, 19 | S7 |
| Notes and Context | LCS-02, 06, 08, 14 | S10 |
| Conversation Preparation | LCS-05, LCS-19 | S11, S13 |
| Bounded AI | LCS-05, 14, 15–17, 19 | S13 |

---

## 8. Morning Command Center Inputs

Operational input categories for S1 (no UI design):

- Overdue and due-today tasks
- Overdue lead follow-ups
- Open and unresolved attention items
- Upcoming conversations requiring preparation
- Onboarding gaps (not started, incomplete, blocked)
- Progress stall or decline candidates
- High-priority next best actions awaiting review
- New leads requiring context capture
- Customer readiness gaps before scheduled conversations

Ranking thresholds are not defined at L2.

---

## 9. Needs Attention Entry Points

Stages that may create attention candidates:

- LCS-02 (context incomplete — extended)
- LCS-04 (overdue follow-up)
- LCS-07 (won without handoff readiness)
- LCS-11 (onboarding stall)
- LCS-13 (progress stall/decline)
- LCS-15 (explicit emergence stage)
- LCS-19 (critical readiness gaps)
- LCS-20 (ambiguous exit)

Detection rules are not defined at L2.

---

## 10. Next Best Action Entry Points

Stages that may produce NBA candidates:

- LCS-02, LCS-04, LCS-07, LCS-08, LCS-10, LCS-11, LCS-13, LCS-14, LCS-15, LCS-17, LCS-18, LCS-19, LCS-21, LCS-22

---

## 11. Operating Boundary

L2 does **not** model:

- Full accounting, LMS authoring, marketing automation, workflow platforms (per OOS register)
- Autonomous AI business operation
- Database schema or API contracts
- Screen layouts or component design
- Billing/payment implementation
- Niche-specific universal requirements

---

## 12. Traceability Summary

| Stage | Problem IDs | Scope Domains | Workflows |
| ----- | ----------- | ------------- | --------- |
| LCS-01 | P1-06 | S2 | WF1 |
| LCS-02 | P1-01, P1-11 | S2, S10 | WF1 |
| LCS-03 | P1-06 | S2 | WF1 |
| LCS-04 | P1-06, P1-07 | S2, S7 | WF1, WF9 |
| LCS-05 | P1-10 | S11, S13 | WF8 |
| LCS-06 | P1-06, P1-11 | S2, S10 | WF1 |
| LCS-07 | P1-06 | S2 | WF2 |
| LCS-08 | P1-01, P1-11, P1-14 | S3, S10 | WF2 |
| LCS-09 | P1-14 | S4, S5 | WF3 |
| LCS-10 | P1-13 | S5, S12 | WF4 |
| LCS-11 | P1-02, P1-13 | S12, S8 | WF4 |
| LCS-12 | P1-03, P1-14 | S4, S5, S6 | WF3, WF5 |
| LCS-13 | P1-03, P1-12 | S6, S8 | WF5 |
| LCS-14 | P1-04, P1-05 | S13, S10, S3 | WF8 |
| LCS-15 | P1-02, P1-12 | S8 | WF6 |
| LCS-16 | P1-02 | S8 | WF6 |
| LCS-17 | P1-15 | S9 | WF10 |
| LCS-18 | P1-02, P1-12 | S7, S8 | WF6, WF9 |
| LCS-19 | P1-09, P1-10 | S11, S7, S12 | WF8 |
| LCS-20 | P1-14 | S5 | WF3 |
| LCS-21 | P1-15 | S9 | WF10 |
| LCS-22 | P1-06 | S2, S9 | WF1 |

All 15 problems remain traceable across the lifecycle model.
