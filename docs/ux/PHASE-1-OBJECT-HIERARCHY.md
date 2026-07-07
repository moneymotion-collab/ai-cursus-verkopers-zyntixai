# ZyntixAI Phase 1 Object Hierarchy

## 1. Product Object Principle

Phase 1 information objects represent **operational entities** a course seller recognizes in daily work. Objects have persistent identity and contextual meaning. They are not database tables, API resources, or lifecycle stages.

---

## 2. Object Classification

| Class | Definition | Examples |
| ----- | ---------- | -------- |
| Core Object | Stable entity with direct operational identity | Lead, Customer, Program, Enrollment |
| Context Object | Information primarily meaningful relative to another object | Note, Progress context, Onboarding context, Readiness, AI output |
| Action Object | Work item, signal, or recommendation requiring action | Task, Attention Item, NBA Recommendation |
| Aggregate Object | Synthesis across domains without owning duplicate truth | Command Center |
| State Concept | Condition applied to objects | Paused, Overdue, Ready, Blocked, Unknown, Deferred |

---

## 3. Core Objects

### Lead

Prospective customer before conversion. Owns sales-stage context: source, qualification, follow-up history, sales notes, outcome (won/lost/deferred).

### Customer

Paying or converted operational relationship. Owns Customer 360 summary hub. Distinct from Lead after conversion (WF2).

### Program

What the business delivers — course, cohort, mentorship, academy offer. Reference context for enrollments.

### Enrollment

Relationship of a Customer to a Program over time. Owns lifecycle state (active, paused, completed, exited), onboarding linkage, delivery context.

---

## 4. Context Objects

| Object | Meaning |
| ------ | ------- |
| Note / Operational Context | Free-form or structured operational memory linked to Lead or Customer |
| Progress / Engagement Context | Signals and assessment relative to an Enrollment |
| Onboarding Context | Step state relative to an Enrollment |
| Conversation Preparation Context | Operator prep + customer readiness for upcoming interaction |
| AI Prepared Output | Draft, summary, or suggestion grounded in invoking context |

---

## 5. Action Objects

| Object | Meaning |
| ------ | ------- |
| Task | Operational work item with due state, owner, linked entity |
| Attention Item | Evidence-backed signal requiring human review |
| NBA Recommendation | Proposed next action with rationale awaiting human review (OD-015) |

---

## 6. Aggregate Objects

### Morning Command Center

Synthesizes references from Tasks, Attention, NBA review, Leads, Customers, Enrollments. Owns prioritization **lens** only — not underlying records.

---

## 7. State Concepts

| State | Applies To | IA Treatment |
| ----- | ---------- | ------------ |
| Paused | Enrollment, Customer relationship | Filter/badge on Enrollment; not terminal (OD-014) |
| Overdue | Task, Follow-up | Filter on Tasks / Lead list |
| Ready / Incomplete / Blocked | Readiness, Onboarding | Section state within context |
| At Risk / Needs Attention | Lead, Customer, Enrollment | Attention Item or badge linking to queue |
| Unknown | Progress | Valid display state; not hidden |
| Deferred | Lead outcome, NBA | Filter or outcome label |

States are never standalone navigation destinations (IA-013).

---

## 8. Lead Boundary

| Information | Classification | Inside Lead Context |
| ----------- | -------------- | ------------------- |
| Lead identity | PRIMARY | Yes |
| Source | PRIMARY | Yes |
| Known interest / fit | PRIMARY | Yes |
| Qualification context | PRIMARY | Yes |
| Notes | PRIMARY | Yes |
| Last meaningful activity | PRIMARY | Yes |
| Follow-up state | PRIMARY | Yes |
| Tasks (linked) | LINKED ACTION | Yes — views of Task objects |
| Sales conversation preparation | CROSS-LIFECYCLE | Yes — contextual section |
| NBA (contextual) | LINKED ACTION | Yes — links to review surface |
| AI drafts | CROSS-LIFECYCLE | Yes — contextual |
| Won/lost/deferred outcome | PRIMARY | Yes |
| Customer conversion handoff | EXTERNAL DESTINATION | Link to Customer on won — not merged identity |

**Lead ≠ Customer.** Won lead triggers explicit handoff to Customer object with preserved history.

---

## 9. Customer Boundary

| Information | Classification | Inside Customer 360? |
| ----------- | -------------- | -------------------- |
| Identity and contact | PRIMARY CUSTOMER CONTEXT | Yes |
| Relationship summary | PRIMARY | Yes |
| Active enrollment summary | PRIMARY | Yes — summary; detail on Enrollment |
| Notes | PRIMARY | Yes |
| Linked tasks | LINKED ACTION | Yes — summary + link to Task |
| Open attention items | LINKED ACTION | Yes — badge/link to authoritative queue |
| Contextual NBA | LINKED ACTION | Yes — link to review surface |
| Per-enrollment progress | RELATED CONTEXT | Summary on Customer; detail on Enrollment |
| Per-enrollment onboarding | RELATED CONTEXT | Summary; detail on Enrollment |
| Conversation readiness | CROSS-LIFECYCLE SURFACE | Section when conversation upcoming |
| AI summaries/drafts | CROSS-LIFECYCLE SURFACE | Contextual panel |
| Activity/history | PRIMARY | Yes — timeline of meaningful events |
| Full Attention queue | EXTERNAL DESTINATION | Link only — not embedded duplicate list |
| Program definition | EXTERNAL DESTINATION | Link to Program |
| Paused state | STATE | Badge on enrollment summary |

Customer 360 is a **bounded hub** — not a dumping ground (IA-010).

---

## 10. Program Boundary

| Information | Owner |
| ----------- | ----- |
| Program name and description | Program object |
| Offer/delivery context | Program object |
| Associated enrollments | Program detail → Enrollment list |
| Customers enrolled | Via Enrollment relationships |

Programs are reference/configuration objects — not delivery execution surfaces.

---

## 11. Enrollment Boundary

| Information | Owner |
| ----------- | ----- |
| Customer–Program relationship | Enrollment object |
| Lifecycle state (active, paused, completed, exited) | Enrollment object |
| Onboarding context | Enrollment → Onboarding section |
| Progress context | Enrollment → Progress section |
| Completion/exit | Enrollment terminal state (LCS-20) |
| Pause | Enrollment state — resume to active delivery (OD-014) |

Enrollment is the operational unit for delivery lifecycle — not replaceable by Customer or Program alone.

---

## 12. Task Boundary

| Aspect | Rule |
| ------ | ---- |
| Identity | Task object with stable ID |
| Top-level access | Tasks list (Today/Upcoming/Overdue) |
| Contextual access | Linked section on Lead/Customer |
| Ownership | Task object is authoritative for due/completion |
| Non-goals | Not a project-management suite; no arbitrary project hierarchies |

---

## 13. Attention Boundary

| Aspect | Rule |
| ------ | ---- |
| Authoritative owner | Attention queue (top-level) |
| Object contextual | Badge/count linking to same attention item |
| Command Center | Reference cards only |
| Evidence | Stored with attention item — not duplicated on Customer |
| Review state | Single state per item across all surfaces |

---

## 14. Next Best Action Boundary

| Aspect | Rule |
| ------ | ---- |
| Candidate generation | Occurs in operational context (LCS stages per L2) — not in review UI |
| Review surface | NBA review intent — authoritative for accept/defer/dismiss |
| Object contextual | Shows current recommendation for entity — links to review |
| Command Center | References awaiting review |
| OD-015 | Review does not self-generate infinite loop |

---

## 15. Notes and Context Boundary

Notes are Context Objects owned relative to Lead or Customer. Searchable via global discovery. Not a standalone notes app — always anchored to operational entity.

---

## 16. Conversation Preparation Boundary

Dual-actor context object (OD-009):

- **Operator preparation:** history, notes, progress, issues, talking points
- **Customer readiness:** tasks, submitted info, onboarding prerequisites

Accessed contextually from Lead (sales) or Customer (delivery). WF8 when within conversation prep. Recurring Q&A may embed when prep includes answer drafting (OD-013).

---

## 17. AI Prepared Output Boundary

AI output is Context Object — never authoritative truth. Always tied to invoking Lead/Customer/Task/Attention context. Human reviews before consequential action. Not stored as separate navigable universe.

---

## 18. Relationship Matrix

| Source Concept | Relationship | Target Concept | Product Meaning | IA Consequence |
| -------------- | ------------ | -------------- | --------------- | -------------- |
| Lead | MAY PRODUCE | Customer | Won conversion creates/links customer | Explicit handoff navigation |
| Lead | OWNS CONTEXT | Note | Sales-stage memory | Notes section on Lead |
| Lead | ASSOCIATED WITH | Task | Follow-up work | Linked tasks on Lead |
| Lead | MAY SURFACE IN | Attention Item | Sales risk signals | Link to Attention queue |
| Lead | MAY REQUIRE | Conversation Preparation | Sales call upcoming | Contextual prep section |
| Customer | ASSOCIATED WITH | Enrollment | Customer participates in programs | Enrollment list on Customer |
| Customer | OWNS CONTEXT | Note | Delivery memory | Notes section on Customer |
| Customer | ASSOCIATED WITH | Task | Delivery/follow-up work | Linked tasks |
| Customer | MAY SURFACE IN | Attention Item | Delivery risk | Link to Attention queue |
| Program | ASSOCIATED WITH | Enrollment | Program has participants | Enrollment list on Program |
| Enrollment | REFERENCES | Customer | Relationship participant | Parent link |
| Enrollment | REFERENCES | Program | What is delivered | Parent link |
| Enrollment | OWNS CONTEXT | Onboarding Context | Activation state | Enrollment detail section |
| Enrollment | OWNS CONTEXT | Progress Context | Engagement state | Enrollment detail section |
| Enrollment | MAY SURFACE IN | Attention Item | Onboarding/progress risk | Link to Attention queue |
| Attention Item | DERIVED FROM | Lead/Customer/Enrollment/Task/Progress | Evidence-backed signal | Drill-down to source |
| Attention Item | MAY PRODUCE | NBA Recommendation | Escalation to action review | Link to NBA review |
| NBA Recommendation | DERIVED FROM | Operational evidence | Context-triggered suggestion | Rationale visible in review |
| Task | REFERENCES | Lead or Customer | Work linkage | Drill-down to entity |
| Command Center | AGGREGATES | Task, Attention, NBA, Lead, Customer refs | Daily synthesis | Reference only |
| AI Prepared Output | DERIVED FROM | Lead/Customer context | Grounded draft | Contextual panel |
| Recurring Q&A | CROSS-LIFECYCLE | Customer/Lead | LCS-14 thread | Contextual AI prepare |

---

## 19. Object Ownership Rules

1. One authoritative record per Task, Attention Item, NBA Recommendation, Enrollment.
2. Customer 360 displays summaries and links — not parallel copies.
3. Deleting or dismissing in authoritative surface updates all references.
4. Pause state lives on Enrollment — not on Command Center.

---

## 20. Non-Schema Disclaimer

This hierarchy describes **product-level information relationships**. It does not define database tables, foreign keys, API endpoints, or ORM models. Computer 1 owns technical implementation mapping.
