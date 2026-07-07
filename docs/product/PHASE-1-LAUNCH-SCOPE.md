# ZyntixAI Phase 1 Launch Scope

## 1. Document Status

| Field | Value |
| ----- | ----- |
| Status | `FROZEN FOR PHASE 1 PLANNING` |
| Target market | `Course Sellers` |
| Track owner | `Laptop Product Completion Track` |
| Technical backend authority | `Computer 1` |
| Branch | `parallel/laptop-product-track-20260707` |

This document defines product intent and launch behavior.

It does **not** authorize database, migration, RLS, auth, or backend changes.

---

## 2. Phase 1 Mission

Phase 1 establishes one operational command center for course-selling businesses.

The mission is to help a course business owner:

- understand what is happening across leads, customers, and active program relationships
- see who needs attention and why
- prioritize daily work with confidence
- follow up consistently
- understand customer progress and engagement context
- prepare for conversations faster
- act on clear next actions
- use bounded AI assistance grounded in available operational context

Phase 1 is not an autonomous business operator. It is a human-centered operational system that reduces chaos, improves visibility, and supports better decisions.

---

## 3. Target Customer

Phase 1 targets **Course Sellers**: businesses that sell and operate paid educational programs, coaching programs, academies, mentorships, and structured learning offers.

### Common operational profile

A Phase 1 course seller typically:

- generates leads from marketing and sales activity
- converts leads into paying customers
- delivers a structured program or cohort experience
- manages ongoing customer relationships
- monitors progress or engagement signals
- performs follow-up across leads and customers
- conducts calls, check-ins, or coaching conversations
- manages recurring operational work without a dedicated operations team

### Included business types

Examples include trading education businesses, day-trading course sellers, business coaching programs, marketing education businesses, fitness education/coaching programs, online academies, cohort programs, and mentorship businesses.

### Scope boundary

Phase 1 defines a **shared operational foundation** for course-selling businesses. It does not require separate niche products for each vertical.

---

## 4. Authoritative Problem Set

| Problem ID | Problem | Operational consequence | Phase 1 response |
| ---------- | ------- | ----------------------- | ---------------- |
| P1-01 | Customer information is scattered across different tools and places. | Context is fragmented; preparation and follow-up are slow and error-prone. | Centralize customer operational context in one command center (`S3`, `S10`). |
| P1-02 | The business owner does not know which customer needs attention. | Important customers are missed; risk and dissatisfaction increase. | Provide Needs Attention visibility with explainable priority (`S8`). |
| P1-03 | Customer progress is unclear. | Intervention is delayed; coaching and support become reactive. | Expose progress and engagement visibility (`S6`). |
| P1-04 | The owner repeatedly answers the same questions. | Time is wasted; customer experience feels inconsistent. | Preserve operational context and support bounded AI preparation (`S10`, `S11`, `S13`). |
| P1-05 | Answers are often not personalized enough. | Customers feel generic support; trust and outcomes suffer. | Ground preparation and recommendations in customer-specific context (`S3`, `S11`, `S13`). |
| P1-06 | Leads are followed up poorly. | Conversion drops; pipeline value is lost. | Provide lead operational management and follow-up control (`S2`, `S7`). |
| P1-07 | Daily tasks are forgotten. | Operational debt accumulates; customers and leads are neglected. | Provide task and follow-up control with daily prioritization (`S1`, `S7`). |
| P1-08 | The entrepreneur does not know where to start in the morning. | Time is spent reactively instead of on highest-value work. | Provide Morning Command Center daily overview (`S1`). |
| P1-09 | Customers arrive unprepared for conversations. | Calls are inefficient; outcomes are weaker. | Improve onboarding visibility and conversation preparation (`S11`, `S12`). |
| P1-10 | The entrepreneur must manually prepare every conversation. | Preparation becomes a bottleneck; consistency varies. | Provide conversation preparation with relevant history and talking points (`S11`, `S13`). |
| P1-11 | Notes are chaotic. | Institutional knowledge is lost; handoffs fail. | Provide structured notes and operational context (`S10`). |
| P1-12 | The business does not know which customers are likely to disengage or drop out. | Churn risk is discovered too late. | Surface attention and engagement-risk signals for human intervention (`S6`, `S8`). |
| P1-13 | New customers do not receive a sufficiently clear onboarding process. | Activation is delayed; early value is reduced. | Provide onboarding visibility and next-step clarity (`S5`, `S12`). |
| P1-14 | The entrepreneur lacks a reliable overview of the customer base. | Strategic and daily decisions lack grounding. | Provide customer 360 operational context and command-center overview (`S1`, `S3`). |
| P1-15 | The entrepreneur does not know the best next action. | Work is chosen by urgency noise instead of operational priority. | Provide Next Best Action recommendations with explanation (`S9`). |

---

## 5. Phase 1 Product Outcomes

Phase 1 is complete when the product reliably enables these behavior-focused outcomes:

| Outcome ID | Outcome |
| ---------- | ------- |
| O1 | Owner can see what needs attention today. |
| O2 | Owner can identify priority follow-ups across leads and customers. |
| O3 | Customer context is centralized enough to reduce tool-hopping. |
| O4 | Active customer/program relationship context is understandable. |
| O5 | Progress or engagement context is visible for human review. |
| O6 | Daily work can be prioritized from one operational overview. |
| O7 | Conversations can be prepared faster with relevant context. |
| O8 | Next actions are explicit, explainable, and human-controlled. |
| O9 | AI assistance remains grounded in available evidence and does not fabricate facts. |
| O10 | Onboarding and follow-up work is less likely to be forgotten. |

These outcomes describe product behavior. They are not numeric business-performance guarantees.

---

## 6. In-Scope Capability Domains

### S1 — Morning Command Center

**Purpose:** Help the entrepreneur understand where to start.

**Minimum Phase 1 behavior:**

- daily operational overview
- urgent items
- top priorities
- relevant tasks
- customer attention items
- lead follow-ups
- concise daily briefing

**Boundary:** This is not yet an autonomous business operator.

### S2 — Leads Operational Management

**Minimum Phase 1 intent:**

- central lead visibility
- lead status
- follow-up context
- last meaningful activity
- next action
- notes/context
- prioritization support
- conversion handoff concept

**Boundary:** No database implementation is defined in this document.

### S3 — Customer 360 Operational Context

**Minimum Phase 1 intent:**

- centralized customer identity/context
- relevant notes
- relationship/activity context
- active program/enrollment context
- progress/engagement context
- attention state
- next action
- relevant tasks

**Boundary:** This is not a universal enterprise CRM.

### S4 — Programs Operational Context

**Purpose:** Represent what the business delivers.

**Minimum Phase 1 intent:**

- identify programs/offers
- understand which customers are associated with which program
- provide context for enrollment and delivery workflows

**Boundary:** Not a full LMS authoring platform unless separately approved.

### S5 — Enrollments Operational Lifecycle

**Minimum Phase 1 intent:**

- connect customer to program
- represent lifecycle/status
- support onboarding context
- active delivery context
- completion/exit context where relevant

**Boundary:** No schema is defined in this document.

### S6 — Progress and Engagement Visibility

**Minimum Phase 1 intent:**

- understand whether a customer is progressing
- expose relevant signals
- identify stalled or declining engagement
- support human intervention

**Boundary:** No niche-specific performance metrics are required as universal Phase 1 requirements.

### S7 — Tasks and Follow-Up Control

**Minimum Phase 1 intent:**

- today
- upcoming
- overdue
- lead-linked actions
- customer-linked actions
- operational priority context

### S8 — Needs Attention

**Minimum Phase 1 intent:**

- identify leads/customers/enrollments requiring attention
- explain why
- communicate severity/priority
- provide evidence context
- support resolution, dismissal, or later review conceptually

**Boundary:** Unexplainable black-box AI is not the source of truth.

### S9 — Next Best Action

**Minimum Phase 1 intent:**

- recommend a practical next action
- explain why
- explain why now
- connect action to available evidence
- allow the human to decide

**Boundary:** Full autonomous execution is not promised.

### S10 — Notes and Operational Context

**Minimum Phase 1 intent:**

- reduce chaotic notes
- preserve relevant context
- support customer/lead preparation
- improve continuity across interactions

### S11 — Conversation Preparation

**Minimum Phase 1 intent:**

Before a call/check-in, provide useful preparation context such as:

- relevant history
- latest notes
- progress/engagement context
- unresolved issues
- suggested talking points
- missing information

**Boundary:** Guaranteed conversation outcomes are not promised.

### S12 — Onboarding Visibility

**Minimum Phase 1 intent:**

- show onboarding state
- identify incomplete onboarding
- expose next onboarding steps
- reduce forgotten activation work

**Boundary:** Not a complex workflow automation suite.

### S13 — Bounded AI Assistance

**Minimum Phase 1 intent may include:**

- summarization
- preparation
- grounded suggestions
- drafting
- prioritization assistance
- next-action recommendation

**Required controls:**

- available evidence required
- uncertainty disclosure where needed
- no fabricated customer facts
- human control
- approval boundaries for consequential actions

---

## 7. Required End-to-End Phase 1 Workflows

### WF1 — Lead to Follow-Up

| Element | Definition |
| ------- | ---------- |
| Trigger | New or existing lead requires follow-up |
| Actor | Business owner or authorized team member |
| Required context | Lead identity, status, last activity, notes, next action |
| Main flow | Lead appears in operational view → owner reviews context → follow-up task or action is chosen → follow-up is recorded |
| Expected outcome | Lead receives timely, context-aware follow-up |
| Failure/exception | Missing contact context, stale status, duplicate lead confusion |
| AI role | Suggest follow-up timing or draft message when context exists |
| Human boundary | Owner decides whether and how to follow up |

### WF2 — Lead to Customer Conversion Handoff

| Element | Definition |
| ------- | ---------- |
| Trigger | Lead converts to paying customer |
| Actor | Business owner or sales operator |
| Required context | Lead history, offer/program context, conversion status |
| Main flow | Lead marked converted → customer record/context created or linked → enrollment/onboarding path becomes visible |
| Expected outcome | Conversion context is preserved; no restart from zero |
| Failure/exception | Handoff loses notes, status, or program association |
| AI role | Summarize lead history for handoff preparation |
| Human boundary | Owner confirms conversion and program association |

### WF3 — Customer to Active Enrollment Context

| Element | Definition |
| ------- | ---------- |
| Trigger | Customer is associated with a program |
| Actor | Business owner or operations user |
| Required context | Customer identity, program, enrollment status |
| Main flow | Customer selected → active enrollment context displayed → lifecycle state understood |
| Expected outcome | Owner knows what the customer is enrolled in and current state |
| Failure/exception | Enrollment missing, stale, or ambiguous |
| AI role | Summarize enrollment context for review |
| Human boundary | Owner validates enrollment accuracy |

### WF4 — New Customer Onboarding Visibility

| Element | Definition |
| ------- | ---------- |
| Trigger | New customer enters onboarding |
| Actor | Business owner or onboarding operator |
| Required context | Customer, program, onboarding state, required steps |
| Main flow | Onboarding state shown → incomplete steps identified → next onboarding action surfaced |
| Expected outcome | Onboarding progress is visible and less likely to stall |
| Failure/exception | Steps undefined, status unclear, owner unaware of blockers |
| AI role | Highlight missing onboarding steps from available context |
| Human boundary | Owner decides onboarding interventions |

### WF5 — Customer Progress Review

| Element | Definition |
| ------- | ---------- |
| Trigger | Owner reviews customer progress |
| Actor | Business owner or coach |
| Required context | Customer, enrollment, progress/engagement signals, notes |
| Main flow | Customer opened → progress context reviewed → attention or next action considered |
| Expected outcome | Owner understands whether intervention is needed |
| Failure/exception | Progress signals missing or misleading |
| AI role | Summarize progress context and suggest review focus |
| Human boundary | Owner decides intervention |

### WF6 — Risk or Attention Detection to Human Intervention

| Element | Definition |
| ------- | ---------- |
| Trigger | Lead/customer/enrollment enters Needs Attention state |
| Actor | Business owner |
| Required context | Attention reason, severity, evidence, related tasks |
| Main flow | Attention item surfaced → reason reviewed → owner intervenes, dismisses, or defers |
| Expected outcome | Risk is acted on by a human with explainable context |
| Failure/exception | False positive noise, missing evidence, unexplained alert |
| AI role | Explain why attention is suggested based on available signals |
| Human boundary | Owner decides intervention; AI does not auto-resolve |

### WF7 — Morning Prioritization

| Element | Definition |
| ------- | ---------- |
| Trigger | Owner starts the workday |
| Actor | Business owner |
| Required context | Tasks, attention items, lead follow-ups, urgent updates |
| Main flow | Morning Command Center opened → priorities reviewed → first actions chosen |
| Expected outcome | Owner knows where to start |
| Failure/exception | Empty overview with no guidance, overloaded undifferentiated list |
| AI role | Provide concise daily briefing from available context |
| Human boundary | Owner chooses actual start order and actions |

### WF8 — Conversation Preparation

| Element | Definition |
| ------- | ---------- |
| Trigger | Upcoming call/check-in with lead or customer |
| Actor | Business owner or coach |
| Required context | History, notes, progress, unresolved issues, program context |
| Main flow | Preparation view opened → context reviewed → talking points considered → conversation conducted |
| Expected outcome | Conversation starts with relevant context ready |
| Failure/exception | Missing notes, stale history, fabricated suggestions |
| AI role | Prepare summary and talking points from evidence |
| Human boundary | Owner validates preparation before conversation |

### WF9 — Task Completion and Follow-Up Continuity

| Element | Definition |
| ------- | ---------- |
| Trigger | Task created or due |
| Actor | Business owner or team member |
| Required context | Task, linked lead/customer, due state, outcome |
| Main flow | Task surfaced → completed or rescheduled → follow-up continuity preserved |
| Expected outcome | Work does not disappear after one action |
| Failure/exception | Completed task leaves no trace; next step lost |
| AI role | Suggest next follow-up when appropriate |
| Human boundary | Owner confirms completion and next step |

### WF10 — Next Best Action Review

| Element | Definition |
| ------- | ---------- |
| Trigger | Owner requests or system surfaces a recommended next action |
| Actor | Business owner |
| Required context | Current entity state, evidence, recommended action, rationale |
| Main flow | Recommendation shown → rationale reviewed → owner accepts, modifies, or rejects |
| Expected outcome | Owner acts with clearer priority |
| Failure/exception | Recommendation without evidence or wrong target |
| AI role | Recommend and explain next action |
| Human boundary | Owner always decides whether to act |

---

## 8. Phase 1 AI Boundary

| Mode | Phase 1 status |
| ---- | -------------- |
| Observe | Generally in scope when authorized and permission-aware |
| Analyze | In scope when grounded in available evidence |
| Recommend | In scope with explanation |
| Prepare | In scope for bounded drafts and preparation outputs |
| Execute | Limited and not assumed by default |

Consequential external actions must not be considered automatically authorized merely because AI suggested them.

Examples of consequential actions requiring explicit human approval:

- sending messages to leads or customers
- changing operational status with customer impact
- creating commitments on behalf of the business

---

## 9. Non-Functional Product Expectations

At product scope level, Phase 1 expects:

| Expectation | Requirement |
| ----------- | ----------- |
| Tenant isolation | Users see only their organization's operational data |
| Privacy | Sensitive customer context is handled appropriately |
| Explainability | Attention and recommendations include understandable rationale |
| Deterministic failure behavior | Known failure modes behave predictably where possible |
| Loading states | Long operations show progress or waiting state |
| Empty states | No-data conditions are clear and actionable |
| Error states | Failures are visible; silent failure is unacceptable for core flows |
| Mobile usability | Core operational review is usable on mobile |
| Persistence | Completed work and context survive refresh/re-entry |
| Refresh resilience | Re-opening views restores meaningful state |
| Permission-aware behavior | Unauthorized actions are blocked clearly |
| No fabricated AI context | AI must not invent customer facts |

Technical implementation evidence remains under Computer 1 authority.

---

## 10. Scope Traceability Matrix

| Problem ID | Problem | Primary Scope Domain | Supporting Domain | Phase 1 Outcome |
| ---------- | ------- | -------------------- | ----------------- | --------------- |
| P1-01 | Scattered customer information | S3 | S10 | O3 |
| P1-02 | Unknown who needs attention | S8 | S1 | O1 |
| P1-03 | Unclear customer progress | S6 | S3 | O5 |
| P1-04 | Repeated same questions | S10 | S11, S13 | O7 |
| P1-05 | Insufficient personalization | S3 | S11, S13 | O7, O9 |
| P1-06 | Poor lead follow-up | S2 | S7 | O2 |
| P1-07 | Forgotten daily tasks | S7 | S1 | O6, O10 |
| P1-08 | No morning starting point | S1 | S7, S9 | O6 |
| P1-09 | Unprepared customers | S12 | S11 | O7, O10 |
| P1-10 | Manual conversation prep | S11 | S13 | O7 |
| P1-11 | Chaotic notes | S10 | S3 | O3 |
| P1-12 | Unknown disengagement risk | S8 | S6 | O1, O5 |
| P1-13 | Unclear onboarding | S12 | S5 | O10 |
| P1-14 | No customer base overview | S3 | S1 | O3, O4 |
| P1-15 | Unknown best next action | S9 | S1, S7 | O8 |

---

## 11. Phase 1 Success Boundary

Phase 1 is product-complete when all of the following are true:

- all in-scope capability domains (`S1`–`S13`) meet the Definition of Done standard
- all required workflows (`WF1`–`WF10`) pass workflow completion criteria
- product outcomes (`O1`–`O10`) are demonstrably supported in core flows
- QA acceptance criteria are recorded and passed for core flows
- security gate passes with no open P0 or P1 launch blockers
- accepted P2 issues are explicitly documented
- no unresolved scope contradiction remains against this freeze

Phase 1 is **not** complete because a route exists, a table exists, or a one-time demo succeeded.

---

## 12. Change Control

After freeze, any addition to Phase 1 requires:

1. proposed change
2. problem addressed
3. why existing scope is insufficient
4. launch impact
5. dependency impact
6. conflict impact with Computer 1
7. explicit decision recorded in `PHASE-1-SCOPE-DECISION-REGISTER.md`

Default decision for new ideas: **`LATER`**

A change is approved only when evidence shows Phase 1 cannot solve its approved problems without it.
