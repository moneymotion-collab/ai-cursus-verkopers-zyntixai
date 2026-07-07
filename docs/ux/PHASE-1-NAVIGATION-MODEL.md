# ZyntixAI Phase 1 Navigation Model

## 1. Navigation Mission

Enable a course seller to move from daily prioritization to the correct operational object, review queue, or contextual capability in minimal steps — without learning internal product taxonomy.

Navigation serves **work**, not documentation structure.

---

## 2. Primary Navigation

| Label | Type | User Intent |
| ----- | ---- | ----------- |
| Command Center | Aggregate | "Where do I start today?" |
| Leads | Object list | "Who am I selling to?" |
| Customers | Object list | "Who am I delivering for?" |
| Tasks | Action list | "What work is due?" |
| Attention | Review queue | "Who needs my attention and why?" |

Primary navigation is persistent on desktop sidebar and mobile bottom bar (subset on mobile — see mobile principles doc).

---

## 3. Navigation Groups

### More (grouped secondary)

| Item | Intent |
| ---- | ------ |
| Enrollments | Cross-enrollment operational workspace — active relationships, onboarding, progress, pause state |
| Next Best Action Review | Review all pending recommendations coherently (authoritative queue) |
| Programs | What we offer |
| Settings | Configure my business access and preferences |

Grouping rationale: lower daily frequency than primary five (C1 score 3–4); reduces mobile top-level clutter. Enrollments and NBA Review are **operational workspaces**, not passive registries — ordered first in More for discoverability.

---

## 4. Secondary Navigation

Secondary navigation appears within list views and object detail:

- Filters (status, overdue, paused, source)
- Sort (due date, last activity, priority)
- Segmented views on Tasks (Today / Upcoming / Overdue)
- Segmented views on Attention (Open / Snoozed / Dismissed history)
- Segmented views on Enrollments (Active / Paused / Onboarding incomplete / Progress needs review / Completed)
- Progress concern filters on Enrollments list (stalled candidate, declining candidate, unknown — product states, not metrics)
- Operational filters on Customers list (open attention, enrollment stalled, onboarding incomplete)
- Segmented views on NBA Review queue (Awaiting review / Deferred / Dismissed history)

Secondary navigation does not create new operational truth.

---

## 5. Contextual Navigation

Contextual navigation is available inside object detail and triggered flows:

| Capability | Entry |
| ---------- | ----- |
| Notes | Lead/Customer detail tab or section |
| Progress | Enrollment detail (detail); Enrollments list (aggregate cross-enrollment view) |
| Onboarding | Enrollment detail |
| Conversation preparation | Lead/Customer detail; upcoming conversation banner |
| NBA recommendation | Object detail panel; links to NBA review queue |
| AI assistance | Contextual command affordance on any object/aggregate view |
| Recurring Q&A preparation | Customer/Lead context; AI prepare answer |

---

## 6. Aggregate-to-Detail Navigation

```
Command Center
  → [reference card] → Attention item detail (authoritative queue)
  → [reference card] → Task detail
  → [reference card] → Lead / Customer detail
  → [reference card] → NBA review queue (filtered if scoped)
  → [reference card] → Enrollments list (progress/onboarding filter)
  → [reference card] → Conversation preparation intent
```

Every Command Center drill-down lands on the **authoritative owner** of that information — never a Command Center-only copy.

---

## 7. Object-to-Related-Context Navigation

```
Lead detail
  → Tasks (linked)
  → Notes
  → Conversation preparation (sales)
  → Attention items (linked)
  → NBA (contextual)
  → [on won] → Customer handoff / Customer detail

Customer detail
  → Enrollments (linked)
  → Tasks (linked)
  → Notes
  → Progress (per enrollment)
  → Onboarding (per enrollment)
  → Conversation preparation
  → Attention items (linked)
  → NBA (contextual)
  → AI command

Program detail
  → Enrolled customers / enrollments
  → Program context notes (if any)

Enrollment detail
  → Customer (parent)
  → Program (parent)
  → Onboarding state
  → Progress context
  → Lifecycle state (active, paused, completed, exited)
```

---

## 8. Cross-Lifecycle Navigation

Cross-lifecycle threads do not have standalone menu items. Users reach them via:

| Thread | Navigation Path |
| ------ | --------------- |
| Recurring Q&A | Customer/Lead → AI prepare answer |
| Notes | Any Lead/Customer |
| Tasks | Top-level Tasks or object-linked |
| Attention | Top-level Attention (authoritative) |
| NBA | Attention escalation → NBA review; object contextual panel |
| Conversation prep | Object detail or Command Center upcoming conversations |
| AI assistance | Contextual command from current view |

---

## 9. Return and Context Preservation

- Returning from Attention review to Customer preserves which attention item was open.
- Converting Lead → Customer shows handoff banner with link to preserved lead history.
- Command Center → drill-down → back returns to same Command Center scroll/section intent (L4 implements; L3 requires behavior).
- Deep links to Lead/Customer/Task/Attention item must restore object context.

---

## 10. Breadcrumb Intent

Conceptual breadcrumb pattern (non-binding):

```
[Primary Nav] > [List] > [Object Name] > [Context Section]
```

Examples:

- `Customers > Jane Doe > Enrollment: Cohort Q3`
- `Attention > Onboarding stalled > Customer: Jane Doe`
- `Tasks > Overdue > Follow up lead: John Smith`

Breadcrumbs express **information hierarchy**, not URL structure.

---

## 11. Navigation Depth Rules

| Rule | Limit |
| ---- | ----- |
| Primary to object detail | ≤ 2 steps |
| Primary to contextual capability | ≤ 3 steps |
| Maximum conceptual depth | 3 levels before contextual action |
| Grouped (More) items | +1 step acceptable |

Exceeding depth requires L4 justification.

---

## 12. Role Compression Principle

Navigation does not require selecting "Sales mode" vs "Coach mode." The same operator accesses Leads, Customers, Tasks, and Attention without role switching.

If permissions differ by team member (future), navigation items hide — IA structure remains stable.

---

## 13. Desktop Principles

- Persistent left primary navigation (5 items + More).
- Object detail uses main content area with contextual tabs/sections.
- Review queues (Attention) support split view: list + detail where width allows (L4).
- Contextual AI command accessible from header or object action area — not a separate app section.
- No duplicate menu entries for the same intent.

---

## 14. Navigation Anti-Patterns

| Anti-Pattern | Prevention |
| ------------ | ---------- |
| Lifecycle menu (Acquire, Convert…) | Rejected in L3 |
| One menu item per S1–S13 | Scope domains mapped to contextual/aggregate |
| Separate AI app section | Contextual command only |
| Paused/Overdue top-level | Filter on Tasks, Enrollments, Customers |
| Reports/Analytics placeholder | Not in Phase 1 IA |
| Notes as top-level universe | Contextual on objects |

---

## 15. Final Navigation Tree

```
Command Center                    [AGGREGATE]
├── Daily briefing (owned lens)
├── Referenced: overdue tasks
├── Referenced: open attention
├── Referenced: NBA awaiting review
├── Referenced: lead follow-ups due
├── Referenced: onboarding gaps
├── Referenced: upcoming conversations
└── Drill-down → authoritative destinations

Leads                             [OBJECT LIST]
├── Lead list (filters: status, source, overdue follow-up)
└── Lead detail
    ├── Identity and qualification
    ├── Notes
    ├── Tasks (linked)
    ├── Conversation preparation (sales)
    ├── Attention (linked)
    ├── NBA (contextual)
    ├── AI command
    └── [Won] → Customer handoff

Customers                         [OBJECT LIST]
├── Customer list (filters: active, attention, enrollment state)
└── Customer detail
    ├── Identity and 360 summary
    ├── Enrollments (linked)
    ├── Notes
    ├── Tasks (linked)
    ├── Attention (linked)
    ├── NBA (contextual)
    ├── Per-enrollment: Progress, Onboarding, Lifecycle state
    ├── Conversation preparation
    └── AI command

Tasks                             [ACTION LIST]
├── Today / Upcoming / Overdue
├── Filters: lead-linked, customer-linked
└── Task detail → linked Lead/Customer

Attention                         [REVIEW QUEUE — authoritative]
├── Open / Snoozed
└── Attention item detail
    ├── Evidence
    ├── Related Lead/Customer/Enrollment
    ├── Review actions (dismiss, snooze, intervene)
    └── Escalate → NBA review / Intervention

More                              [GROUPED]
├── Enrollments                   [OPERATIONAL WORKSPACE — cross-enrollment]
│   └── Enrollment detail → Customer, Program, Onboarding, Progress
├── Next Best Action Review       [AUTHORITATIVE REVIEW QUEUE]
│   └── Recommendation detail → Accept / Defer / Dismiss → Intervention
├── Programs
│   └── Program detail → Enrollments
└── Settings

Contextual (no top-level)
├── Conversation Preparation intent (from object, Command Center)
├── Recurring Q&A preparation (from Customer/Lead, AI)
└── Bounded AI command (from any object/aggregate context)
```
