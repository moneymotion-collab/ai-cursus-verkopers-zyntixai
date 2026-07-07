# ZyntixAI Phase 1 Queue and Review Patterns

## 1. Purpose

Distinguish workload queues from single-item review screens. One authoritative lifecycle per queue type.

---

## 2. Queue Definition

Ordered or filterable list of items requiring user processing. Owns item state for that workload type.

---

## 3. Review Definition

Single-item screen where human evaluates evidence and records outcome.

---

## 4. Authoritative Ownership

| Queue | Owner | Review Screen |
| ----- | ----- | ------------- |
| Tasks | Task object (SCR-006) | SCR-007 |
| Attention | Attention item (SCR-008) | SCR-009 |
| NBA | NBA recommendation (SCR-012) | SCR-013 |

Command Center references only. Object badges link to same item IDs.

---

## 5. Queue Item State

Displayed on list row. State changes only in authoritative queue or review screen — not on Command Center.

---

## 6. Review Entry

From queue row tap, Command Center card, or object badge — all open same review/detail for item ID.

---

## 7. Evidence Presentation

Review screens show: what triggered item, evidence list, freshness, uncertainty disclosure, related entity link.

---

## 8. Human Decision

Consequential outcomes require explicit user action. No auto-resolve.

---

## 9. Outcome Handling

Outcome updates authoritative record. References refresh. Optional create task or intervention flow.

---

## 10. Return to Queue

After outcome: return to queue with filters preserved; highlight next item optional (L4 intent, not required algorithm).

---

## 11. Next Item Behavior

After dismiss/complete on Attention or NBA: offer "next open item" navigation — user may decline.

---

## 12. Filter Preservation

Queue filters persist across review round-trip.

---

## 13. Interrupted Review

User leaves mid-review: draft notes may be lost (L4 defers persistence); item remains open until outcome recorded.

---

## 14. Stale Item

Item resolved elsewhere: on open, show "already resolved" with refresh — do not allow duplicate outcome silently.

---

## 15. Concurrent Change

Detect if possible; explain change; offer refresh. No silent overwrite of user input.

---

## 16. Mobile Review

Full evidence readable without horizontal scroll. Primary outcomes as buttons. Entity link prominent.

---

## 17. Task Queue Pattern

Segments: Today / Upcoming / Overdue. Complete on detail. Completion records task done — does not imply business outcome (e.g., customer paid) occurred.

---

## 18. Attention Queue Pattern

Segments: Open / Snoozed / History. Detail shows evidence (L6 thresholds deferred). Outcomes: snooze, dismiss, resolve, escalate to intervention/NBA. Attention does not own NBA lifecycle.

---

## 19. NBA Queue Pattern

Segments: Awaiting review / Deferred / History. Review shows rationale + evidence (L7 ranking deferred). Outcomes: accept, defer, dismiss, mark completed. Review does not auto-generate new candidate (OD-015). Accept may hand off to intervention or task creation.

---

## 20. Non-Goals

Universal inbox merging Tasks+Attention+NBA. Bulk dismiss. Autonomous queue processing.
