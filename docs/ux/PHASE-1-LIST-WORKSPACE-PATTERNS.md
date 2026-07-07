# ZyntixAI Phase 1 List and Workspace Patterns

## 1. Purpose

Common list, workspace, and queue presentation rules for Phase 1 screens. Defines behavior intent — not frontend implementation.

---

## 2. Browse List vs Workspace vs Queue

| Pattern | Screens | Purpose |
| ------- | ------- | ------- |
| Browse list | Programs | Find and open reference objects |
| Operational workspace | Leads, Customers, Enrollments | Review and act across entities |
| Authoritative queue | Tasks, Attention, NBA Review | Process workload with outcomes |

---

## 3. Shared List Principles

- Header states screen purpose in user language
- Result count visible when loaded
- Active filters visible and clearable
- Row/card shows P0 identity + P1 decision context
- Tap/click opens authoritative detail
- Return preserves scroll and filter state (L4 intent)
- No competing state with Command Center references

---

## 4. Search Intent

| Screen | Search Scope |
| ------ | ------------ |
| Leads | Name, email, company, notes match |
| Customers | Name, email, company |
| Tasks | Title, linked entity name |
| Enrollments | Customer name, program name |
| Programs | Program name |
| Attention | Entity name (secondary to queue browse) |
| NBA Review | Entity name (secondary to queue browse) |

Global search: SCR-018.

---

## 5. Filter Intent

| Screen | Filter Categories |
| ------ | ----------------- |
| Leads | Needs follow-up, follow-up due, no recent activity, qualification state, outcome (won/lost/deferred), source |
| Customers | Active, onboarding incomplete, needs progress review, unknown progress, paused enrollment, has open attention |
| Tasks | Today, upcoming, overdue; lead-linked; customer-linked |
| Attention | Open, snoozed, dismissed history |
| Enrollments | Active, paused, onboarding incomplete, progress needs review, stalled candidate, declining candidate, unknown, completed/exited |
| NBA Review | Awaiting review, deferred, dismissed history |
| Programs | Active/inactive (if applicable) |

No threshold values defined at L4.

---

## 6. Sort Intent

| Screen | Default Sort | Alternatives |
| ------ | ------------ | ------------ |
| Leads | Last meaningful activity (recent first) | Name, follow-up due |
| Customers | Last activity | Name, attention priority indicator (L6) |
| Tasks | Due date | Overdue first, linked entity |
| Attention | Severity/priority indicator (L6) | Recent, entity |
| Enrollments | Progress concern indicator | Customer name, program, onboarding state |
| NBA Review | Recommendation age / urgency indicator (L7) | Entity, type |
| Programs | Name | Enrollment count |

Sort labels are product intent; algorithms deferred.

---

## 7. Active Filter State

- Filter chips or equivalent show active filters
- "Clear all filters" restores default view
- Empty filtered state distinct from empty system state (UX-009)
- Command Center drill-down may pre-apply filter (e.g., progress needs review)

---

## 8. Result Count Intent

Show "Showing N enrollments" or "N tasks due today" when data loaded. During loading, show loading state — not zero.

---

## 9. Row/Card Information Priority

**P0 (always visible):** Identity (name/title), primary state indicator  
**P1 (decision context):** Due date, follow-up state, progress/onboarding summary, attention badge  
**P2 (supporting):** Source, program name, last activity timestamp  
**P3 (deferred):** Extended metadata on detail only

---

## 10. Selection Rules

Default: no multi-select. Single-item navigation only. No bulk consequential actions at L4.

---

## 11. Bulk Action Boundary

No bulk send, bulk dismiss, or bulk status change unless explicitly added in future scope. Not required for Phase 1.

---

## 12. Loading Behavior

Initial: full-list skeleton or spinner with screen purpose visible. Incremental: append indicator for pagination/infinite scroll (technical choice deferred).

---

## 13. Empty System State

"No leads yet" with guidance to add or import (if applicable). Actionable where product allows creation. Not an error.

---

## 14. Empty Filtered State

"No enrollments match these filters" with clear-filters action. Distinguish from system empty.

---

## 15. Error Behavior

Recoverable: retry button, preserve filters. Blocking: message with support path intent.

---

## 16. Partial Data

Some rows load; others fail — show loaded rows with inline error for failed sections. Do not hide entire list.

---

## 17. Stale Data

Timestamp or "may be outdated" indicator where refresh available. Refresh action restores current state.

---

## 18. Return Position Preservation

Back from detail returns to same scroll position and filter set on list/workspace.

---

## 19. Mobile Adaptation

Filters in sheet/drawer. Essential P0/P1 on card. Swipe actions only if they map to primary non-consequential actions (L4 defers implementation).

---

## 20. Per-Screen Pattern Matrix

| Screen | Pattern | Search | Filters | Sort | Authoritative? |
| ------ | ------- | ------ | ------- | ---- | -------------- |
| Leads (SCR-002) | Workspace | Yes | Yes | Yes | Lead object |
| Customers (SCR-004) | Workspace | Yes | Yes | Yes | Customer object |
| Tasks (SCR-006) | Queue | Yes | Yes | Yes | Task object |
| Attention (SCR-008) | Queue | Limited | Yes | Yes | Attention item |
| Enrollments (SCR-010) | Workspace | Yes | Yes | Yes | Enrollment object |
| NBA Review (SCR-012) | Queue | Limited | Yes | Yes | NBA recommendation |
| Programs (SCR-014) | Browse | Yes | Minimal | Yes | Program object |
