# ZyntixAI Phase 1 Object Detail Patterns

## 1. Purpose

Common detail-screen structure for Phase 1 object types. Preserves hierarchy without identical layouts.

---

## 2. Detail Screen Principle

Detail answers: **Who/what is this? What state is it in? What should I do?** Linked contexts drill to authoritative owners — not embedded duplicates.

---

## 3. Identity Region

- Entity name and type
- Key identifier (email, program name for enrollment)
- Primary state badge with text label (not color-only)
- Last updated / activity timestamp where relevant

---

## 4. State Region

Current operational state with plain-language label. Unknown and partial states explicit. Pause shown as temporary on Enrollment (UX-011).

---

## 5. Decision Context

P1 information block: why this matters now — overdue follow-up, open attention, pending NBA, onboarding gap, progress concern.

---

## 6. Linked Context

Sections linking to Tasks, Enrollments, Attention badges, NBA panel — each opens authoritative destination.

---

## 7. Activity and History

Chronological meaningful events: notes, status changes, completed tasks. Not exhaustive audit log.

---

## 8. Primary Action

One dominant action per context: complete task, review attention, follow up lead, open conversation prep.

---

## 9. Secondary Actions

Add note, create task, AI summarize, view related program — in overflow or secondary row.

---

## 10. Contextual AI Access

AI command affordance in header or action area. Invokes SCR-019 with current object context.

---

## 11. Evidence Freshness

When evidence-backed (attention, progress, readiness): show freshness/staleness indicator. Stale triggers review prompt — not auto-dismiss.

---

## 12. Empty Context

"No notes yet" / "No tasks linked" — actionable add where permitted.

---

## 13. Partial Context

"Some enrollment data unavailable" — show available sections; mark missing.

---

## 14. Stale Context

Banner: information may have changed; refresh action.

---

## 15. Permission Boundary

Unauthorized sections hidden or disabled with clear message — not empty silence.

---

## 16. Return Behavior

Back to list preserves filters. Breadcrumb intent per IA.

---

## 17. Mobile Adaptation

Identity + state + primary action above fold. Sections collapsible. Linked items as tappable rows.

---

## 18. Per-Object Detail Matrix

| Object | Screen | Primary Context | State | Linked Context | Primary Action |
| ------ | ------ | --------------- | ----- | -------------- | -------------- |
| Lead | SCR-003 | Identity, qualification, follow-up | Qualification, outcome | Tasks, notes, prep, NBA | Follow up / qualify |
| Customer | SCR-005 | Identity, relationship summary | Active relationship | Enrollments, tasks, attention refs | Open enrollment / prep |
| Task | SCR-007 | Task purpose, due | Due/overdue/complete | Lead/Customer link | Mark complete |
| Attention Item | SCR-009 | Evidence, reason | Open/snoozed/dismissed | Entity, tasks, NBA ref | Review outcome |
| Enrollment | SCR-011 | Customer+Program, lifecycle | Active/paused/completed | Onboarding, progress, tasks | Review progress / intervene |
| NBA Recommendation | SCR-013 | Action, rationale, evidence | Awaiting/deferred/dismissed | Entity | Accept/defer/dismiss |
| Program | SCR-015 | Program identity, description | Active | Enrollments list | View enrollments |
