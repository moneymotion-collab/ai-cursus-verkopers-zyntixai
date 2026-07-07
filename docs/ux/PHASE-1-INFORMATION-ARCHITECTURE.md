# ZyntixAI Phase 1 Information Architecture

## 1. Document Status

| Field | Value |
| ----- | ----- |
| Status | `FROZEN FOR L3 INFORMATION ARCHITECTURE` |
| Target market | `Course Sellers` |
| Track owner | `Laptop Product Completion Track` |
| Technical authority | `Computer 1` |
| Branch | `parallel/laptop-product-track-20260707` |
| Parent evidence | L1 scope freeze, L2 operating model, L2.1 semantic hardening |

**This document does not authorize implementation.** It defines product information organization intent only. No database schema, API contracts, route files, or screen layouts are authorized.

---

## 2. Purpose

Define how the validated Phase 1 operational model is organized so a course seller can reliably find, understand, and act on the right information without the application mirroring database tables, scope domains, or lifecycle stages.

L3 answers: *Where does information live, how is it discovered, and what owns operational truth?*

---

## 3. Evidence Base

| Source | Use in L3 |
| ------ | --------- |
| `PHASE-1-LAUNCH-SCOPE.md` | Authoritative P1-01–P1-15, S1–S13, WF1–WF10 |
| L2 operating blueprint | Lifecycle stages LCS-01–LCS-22, cross-lifecycle threads |
| L2.1 semantic hardening | OD-013 (recurring Q&A cross-lifecycle), OD-014 (pause as state), OD-015 (NBA review boundary) |
| L1.1 semantic remediation | P1-04/05 S13-primary; P1-09 S11-primary |

---

## 4. IA Principles

1. **Operational need over technical structure** — Navigation follows how course sellers work, not internal tables.
2. **Lifecycle stages are not pages** — LCS stages describe operational events, not menu items.
3. **Scope domains are not automatic menu items** — S1–S13 describe capabilities; each must earn navigation placement.
4. **Objects have identity; states do not** — Lead, Customer, Program, Enrollment, Task have stable identity. Paused, Overdue, Ready are filters and conditions.
5. **One authoritative source per operational truth** — Attention, tasks, enrollments, and recommendations must not fragment across unrelated lists.
6. **Aggregates reference; they do not duplicate** — Command Center synthesizes; it does not become a second database.
7. **Cross-lifecycle threads surface contextually** — Recurring Q&A, notes, AI preparation appear where work happens.
8. **Lead ≠ Customer** — Distinct objects with explicit conversion handoff (WF2).
9. **Program ≠ Enrollment** — Program is what is delivered; Enrollment is customer–program relationship over time.
10. **AI is contextual, not a parallel universe** — Bounded assistance invoked from object and task context.
11. **Role compression** — One person may be Owner, Sales Operator, and Coach; IA does not assume separate staff.
12. **Mobile is prioritized, not shrunk** — Highest-frequency destinations first; depth controlled deliberately.

---

## 5. Information Concept Classification

| Concept | Classification | Rationale |
| ------- | -------------- | --------- |
| Lead | CORE-OBJECT | Stable identity; direct sales work (P1-06, S2) |
| Customer | CORE-OBJECT | Stable identity; delivery hub (P1-01, P1-14, S3) |
| Program | CORE-OBJECT | Stable business offering identity (S4) |
| Enrollment | CORE-OBJECT | Stable relationship identity over time (S5) |
| Task | ACTION-OBJECT | Independent work item with due state (P1-07, S7) |
| Attention Item | ACTION-OBJECT | Reviewable signal with evidence (P1-02, S8) |
| Next Best Action | ACTION-OBJECT | Recommendation requiring human review (P1-15, S9) |
| Note / Operational Context | CONTEXT-OBJECT | Primarily meaningful relative to Lead/Customer |
| Progress / Engagement Context | CONTEXT-OBJECT | Primarily relative to Customer/Enrollment |
| Onboarding Context | CONTEXT-OBJECT | Primarily relative to Enrollment |
| Conversation Preparation Context | CONTEXT-OBJECT | Triggered relative to Lead/Customer + upcoming event |
| AI Prepared Output | CONTEXT-OBJECT | Draft/summary tied to invoking context |
| Morning Command Center | AGGREGATE | Multi-domain daily synthesis (P1-08, S1) |
| Recurring Q&A Preparation | CROSS-LIFECYCLE-THREAD | LCS-14; OD-013 |
| Paused / Overdue / Ready / Blocked / Unknown | STATE | Filters and conditions, not destinations |
| WF1–WF10 | WORKFLOW | Behavioral sequences, not navigation items |

---

## 6. Candidate Architectures

### Candidate A — Object-Centric Architecture

**Concept:** Home (Command Center), Leads, Customers, Programs, Enrollments, Tasks, Attention.

| Strength | Weakness |
| -------- | -------- |
| High object findability | Risk of too many top-level items |
| Matches how sellers name their work | Programs/Enrollments may feel redundant at top level |
| Clear drill-down to context | Mobile nav cost if all promoted |

### Candidate B — Workstream-Grouped Architecture

**Concept:** Command Center, CRM (Leads + Customers), Delivery (Programs + Enrollments + Progress), Operations (Tasks + Attention + NBA), Intelligence (AI).

| Strength | Weakness |
| -------- | -------- |
| Lower top-level count | "CRM" and "Intelligence" are SaaS abstractions sellers may not use |
| Groups related work | Hides object identity; extra cognitive translation |
| Good for large teams | Poor fit for single-operator role compression |

### Candidate C — Lifecycle-Oriented Architecture

**Concept:** Acquire, Convert, Deliver, Retain, Operate.

| Strength | Weakness |
| -------- | -------- |
| Mirrors business phases | Directly violates anti-pattern AP-03 |
| Conceptually elegant | Objects split across phases; poor rediscovery |
| Future narrative potential | Enrollment may span Deliver and Retain awkwardly |

### Selected — Object-Centric Operational Hybrid

Combines Candidate A's object clarity with Candidate B's operational grouping for lower-frequency items. Command Center remains the daily aggregate entry. Lifecycle stages are never navigation labels.

---

## 7. Candidate Comparison

| Criterion | A Object-Centric | B Workstream | C Lifecycle | Selected Hybrid |
| --------- | ---------------- | ------------ | ----------- | --------------- |
| Findability | 5 | 3 | 2 | 5 |
| Lifecycle coherence | 4 | 4 | 5 | 4 |
| Object coherence | 5 | 3 | 2 | 5 |
| Cross-lifecycle support | 3 | 4 | 3 | 5 |
| Command Center fit | 4 | 5 | 4 | 5 |
| Mobile fit | 2 | 4 | 3 | 4 |
| Cognitive load | 3 | 4 | 3 | 4 |
| Duplication risk | 3 | 3 | 4 | 4 |
| Phase 1 scope alignment | 5 | 4 | 3 | 5 |
| Future extensibility | 4 | 4 | 3 | 4 |

**Winner:** Object-Centric Operational Hybrid — best object findability and scope alignment with controlled grouping for Programs/Enrollments and Settings.

---

## 8. Selected Architecture

| Field | Value |
| ----- | ----- |
| Architecture type | Object-Centric Operational Hybrid |
| Rejected | Pure lifecycle (AP-03 risk); pure workstream (role abstraction); flat all-objects desktop (mobile cost) |
| Trade-off | Enrollments accessible both as operational list and enrollment context under Customer — justified by S5 operational lifecycle need |
| Limitation | Exact Command Center section ordering deferred to L5; attention thresholds deferred to L6; NBA ranking deferred to L7 |

---

## 9. Final Top-Level Structure

```
Command Center          [AGGREGATE — primary daily entry]
Leads                   [CORE-OBJECT list]
Customers               [CORE-OBJECT list]
Tasks                   [ACTION-OBJECT list]
Attention               [ACTION-OBJECT authoritative queue]
More                    [GROUPED — Enrollments, Next Best Action Review, Programs, Settings]
```

Contextual capabilities (notes, progress, onboarding, conversation prep, NBA, AI) live inside object and aggregate contexts — not as parallel top-level universes.

---

## 10. Primary Destinations

| Destination | Scope | C1–C10 Summary | Classification |
| ----------- | ----- | -------------- | -------------- |
| Command Center | S1 | High frequency (5), cross-lifecycle (5), aggregation value (5), duplication risk if misused (4) | TOP-LEVEL AGGREGATE |
| Leads | S2 | High sales frequency (5), independent identity (5), P1-06 centrality (5) | TOP-LEVEL |
| Customers | S3 | High delivery frequency (5), Customer 360 hub (5), P1-14 (5) | TOP-LEVEL |
| Tasks | S7 | Daily frequency (5), actionability (5), P1-07 (5) | TOP-LEVEL |
| Attention | S8 | High when items exist (4), authoritative review need (5), P1-02 (5) | TOP-LEVEL |

---

## 11. Grouped Destinations

| Destination | Group | Rationale |
| ----------- | ----- | --------- |
| Programs | More | Lower daily frequency (C1: 3); configuration/reference role (S4) |
| Enrollments | More (operational workspace) | Cross-enrollment lifecycle workspace (S5, S6, S12); first item in More |
| Next Best Action Review | More (review queue) | Authoritative NBA review queue (S9); not top-level — grouped like Enrollments |
| Settings | More | Account/business configuration; not operational core |

---

## 12. Contextual Capabilities

| Capability | Access Model | Scope |
| ---------- | ------------ | ----- |
| Notes and operational context | Lead detail, Customer detail, preparation flows | S10 |
| Progress and engagement | Enrollment detail (authoritative detail); Enrollments list (aggregate operational view); Customer list filters | S6 |
| Onboarding visibility | Enrollment context on Customer/Program | S12 |
| Conversation preparation | Lead/Customer detail; upcoming-conversation trigger; Command Center reference | S11 |
| Next Best Action (contextual) | Object detail side panel; links to NBA review queue | S9 |
| Next Best Action (review queue) | More → Next Best Action Review; Command Center references | S9 |
| Bounded AI assistance | Contextual command from current object/aggregate | S13 |
| Recurring Q&A preparation | Customer/Lead context; AI command; optional conversation prep embed | S13, OD-013 |

---

## 13. Aggregate Surfaces

### Morning Command Center (S1)

**Owns:** Daily briefing lens, prioritized entry ordering intent, "start here" synthesis.

**References (does not duplicate):** Tasks, Attention items, NBA awaiting review, lead follow-ups, onboarding gaps, progress stall candidates, conversation prep gaps.

**Does not substitute for:** Enrollments operational workspace (progress/onboarding cross-view), NBA review queue, Tasks list, or Attention queue.

**Drill-down:** Always to authoritative object or queue owner — e.g., progress concerns → Enrollments filtered view; NBA cards → NBA review queue.

---

## 14. Cross-Lifecycle Threads

| Thread | IA Treatment |
| ------ | ------------ |
| Recurring Q&A (LCS-14) | Contextual on Lead/Customer; AI prepare; not standalone Support Center (OD-013) |
| Notes and context | Contextual; searchable via discovery |
| Tasks and follow-up | Top-level Tasks + contextual on Lead/Customer |
| Needs Attention | Authoritative Attention queue + contextual badges linking to same items |
| Next Best Action | Authoritative review queue (More) + contextual on objects; generation contextual (OD-015) |
| Conversation preparation | Contextual preparation intent; WF8 when within prep context |
| Bounded AI | Contextual command; never replaces navigation |
| Progress | Detail on Enrollment; aggregate operational view on Enrollments list; Customer list filters |
| Onboarding | Contextual under enrollment |

---

## 15. Information Ownership Rules

| Information Type | Authoritative Owner |
| ---------------- | ------------------- |
| Lead identity and sales context | Lead object |
| Customer identity and 360 summary | Customer object |
| Program definition | Program object |
| Enrollment lifecycle state | Enrollment object |
| Task due/completion state | Task object |
| Attention evidence and review state | Attention queue (single source) |
| NBA recommendation and review outcome | NBA review queue (single source) |
| Progress assessment (per enrollment) | Enrollment object |
| Cross-enrollment progress visibility | Enrollments list (filtered operational view) |
| Notes | Note context linked to Lead/Customer |
| Daily prioritization lens | Command Center (aggregate only) |

---

## 16. Duplication Prevention

1. Attention items appear in Command Center as **references** to the Attention queue — same item IDs, same review state.
2. NBA recommendations appear in Command Center as **references** to NBA review — not independent recommendations.
3. Tasks listed on Customer are **views** of Task objects — completing in either place updates one task.
4. Enrollment state on Customer is a **summary** — full lifecycle detail on Enrollment object.
5. Progress context does not duplicate Attention evidence — Attention links to underlying evidence.
6. Progress aggregate views on Enrollments list are **filters over enrollment records** — not a separate progress database.
7. NBA review queue owns accept/defer/dismiss state — Command Center and object panels reference same recommendation IDs.

---

## 17. Context Preservation

When navigating Lead → Customer (post-conversion), handoff context must remain visible (WF2, OD-003 L2).

When drilling Command Center → Attention → Customer, return path preserves reviewed item context.

Cross-navigation carries: current object ID, active enrollment where relevant, originating aggregate or queue.

---

## 18. IA Anti-Pattern Audit

| ID | Detected? | Evidence | Remediation |
| -- | --------- | -------- | ----------- |
| AP-01 Database Mirror | No | No table-named navigation | Object-centric model |
| AP-02 Scope Domain Mirror | No | S6 Progress not top-level; S13 not menu item | Contextual placement |
| AP-03 Lifecycle Mirror | No | No Acquire/Convert pages | Hybrid rejects Candidate C |
| AP-04 Dashboard Duplication | Risk mitigated | Command Center references only | Ownership rules §15–16 |
| AP-05 Customer 360 Dumping Ground | Risk mitigated | Bounded Customer sections | Object hierarchy doc |
| AP-06 AI Destination Overreach | No | AI is contextual command | IA-011 |
| AP-07 Attention Fragmentation | Risk mitigated | Single Attention queue | IA-007 |
| AP-08 NBA Fragmentation | Risk mitigated | Single review surface | IA-008, OD-015 |
| AP-09 Mobile Afterthought | No | Mobile principles doc | Prioritized bottom nav |
| AP-10 Deep Nesting | No | Max 3 conceptual levels | Navigation depth rules |
| AP-11 Role Assumption | No | Single-operator supported | Role compression |
| AP-12 State-as-Destination | No | Paused/Overdue are filters | IA-013 |

---

## 19. Traceability Summary

| IA Element | Problem IDs | Scope Domains | Workflows | Lifecycle Support | IA Role |
| ---------- | ----------- | ------------- | --------- | ----------------- | ------- |
| Command Center | P1-02, P1-07, P1-08, P1-14, P1-15 | S1 | WF7 | LCS-04, 07, 11, 13, 15–17, 19 | AGGREGATE |
| Leads | P1-06, P1-11 | S2 | WF1, WF2 | LCS-01–07, LCS-22 | PRIMARY DESTINATION |
| Customers | P1-01, P1-03, P1-14 | S3 | WF2, WF3, WF5 | LCS-08–14, LCS-19–22 | PRIMARY DESTINATION |
| Programs | P1-14 | S4 | WF3 | LCS-09 | GROUPED DESTINATION |
| Enrollments | P1-13, P1-14 | S5, S12 | WF3, WF4 | LCS-09–12, LCS-20 | GROUPED DESTINATION |
| Tasks | P1-07 | S7 | WF1, WF9 | LCS-04, 10, 18, 19 | PRIMARY DESTINATION |
| Attention | P1-02, P1-12 | S8 | WF6 | LCS-15–16, LCS-18 | PRIMARY DESTINATION |
| NBA Review | P1-15 | S9 | WF10 | LCS-17 | REVIEW QUEUE (More) |
| Progress aggregate | P1-03, P1-12 | S6 | WF5 | LCS-13 | AGGREGATE (Enrollments list) |
| Notes (contextual) | P1-01, P1-04, P1-11 | S10 | WF1, WF2 | LCS-02, 06, 08, 14 | CONTEXTUAL |
| Conversation Prep | P1-09, P1-10 | S11 | WF8 | LCS-05, LCS-19 | CONTEXTUAL |
| AI Assistance | P1-04, P1-05, P1-10, P1-15 | S13 | WF8, WF10 | LCS-05, 14, 15–17, 19 | CONTEXTUAL |
| Progress (contextual) | P1-03, P1-12 | S6 | WF5 | LCS-13 | CONTEXTUAL + AGGREGATE |
| Onboarding (contextual) | P1-13 | S12 | WF4 | LCS-10–11 | CONTEXTUAL |
| Recurring Q&A | P1-04, P1-05 | S13, S10, S3 | Cross-lifecycle | LCS-14 | CROSS-LIFECYCLE |

---

## 20. L4 Handoff Boundary

L4 receives: navigation tree, object boundaries, route intents, mobile priorities, anti-pattern constraints.

L4 does **not** receive authorization to: define database schema, implement routes, design pixel layouts, or set attention/NBA thresholds.

Deferred to later phases: Command Center section layout (L5), attention thresholds (L6), NBA ranking (L7), visual design (L4).
