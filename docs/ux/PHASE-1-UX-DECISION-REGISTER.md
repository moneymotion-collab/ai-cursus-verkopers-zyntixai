# ZyntixAI Phase 1 UX Decision Register

## 1. Purpose

Record material L4 UX decisions governing Phase 1 screen and interaction behavior.

---

## 2. Decision Statuses

| Status | Meaning |
| ------ | ------- |
| `PROPOSED` | Under review |
| `APPROVED` | Authorized for L4 UX blueprint |
| `REJECTED` | Not accepted |
| `DEFERRED` | Resolved in later phase |
| `SUPERSEDED` | Replaced |

---

## 3. Decision Template

```text
Decision ID, Date, Status, UX question, Evidence, Alternatives, Decision,
Rationale, User impact, Desktop impact, Mobile impact, Accessibility impact,
Scope impact, IA compatibility, L2 compatibility, L5/L6/L7 dependency,
Computer 1 dependency, Residual uncertainty, Owner
```

---

## 4. Initial Required Decisions

### UX-001 — One explicit primary intent per screen

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (L4 register entry date) |
| Status | `APPROVED` |
| UX question | Does every screen have one primary user intent? |
| Decision | Each SCR-001–021 has defined primary intent and question |
| Rationale | Reduces cognitive overload; supports UXP-01 |
| IA compatibility | Full |
| Owner | Laptop Product Completion Track |

### UX-002 — Command Center references only

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-001 drills to authoritative owners; no duplicate state |
| L5/L6/L7 dependency | L5 ranking deferred |
| Owner | Laptop Product Completion Track |

### UX-003 — Bounded Customer 360

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-005 hierarchy per IA-010; no dumping ground |
| Owner | Laptop Product Completion Track |

### UX-004 — Progress on Enrollment; aggregate on Enrollments workspace

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-011 detail; SCR-010 cross-enrollment filters (IA-017) |
| Owner | Laptop Product Completion Track |

### UX-005 — One Attention lifecycle

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-008/009 authoritative; badges reference same IDs |
| L5/L6/L7 dependency | L6 thresholds deferred |
| Owner | Laptop Product Completion Track |

### UX-006 — One NBA recommendation lifecycle

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-012/013 authoritative; OD-015 preserved |
| L5/L6/L7 dependency | L7 ranking deferred |
| Owner | Laptop Product Completion Track |

### UX-007 — AI grounding and human review

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-017/019 show limitations; human sends/acts |
| Owner | Laptop Product Completion Track |

### UX-008 — Distinct unknown/partial/stale/conflicting evidence

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | UXS-07, 08, 10, 11 distinct presentations |
| Owner | Laptop Product Completion Track |

### UX-009 — Empty system vs empty filtered

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | UXS-03 vs UXS-04 on all list/workspace screens |
| Owner | Laptop Product Completion Track |

### UX-010 — Mobile prioritizes work

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | 5 bottom nav; More for Enrollments/NBA |
| Owner | Laptop Product Completion Track |

### UX-011 — Pause not terminal

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-011 shows pause as temporary; distinct from completion (OD-014) |
| Owner | Laptop Product Completion Track |

### UX-012 — Dual-actor conversation preparation

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-016 separate operator readiness and customer readiness sections |
| Owner | Laptop Product Completion Track |

### UX-013 — Answer prep not chatbot

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-017 contextual flow; OD-013 |
| Owner | Laptop Product Completion Track |

### UX-014 — Consequential action confirmation

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | UXS-13 for dismiss, accept NBA, terminal enrollment, handoff |
| Owner | Laptop Product Completion Track |

### UX-015 — L4 defers L5/L6/L7 algorithms

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | No ranking, thresholds, or scoring in L4 |
| Owner | Laptop Product Completion Track |

### UX-016 — Task completion ≠ business outcome

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-007 completion records task; optional outcome note; does not auto-close lead/customer issues |
| Owner | Laptop Product Completion Track |

### UX-017 — Enrollments workspace default view

| Field | Value |
| ----- | ----- |
| Status | `APPROVED` |
| Decision | SCR-010 defaults to active enrollments; filters for operational concerns |
| IA compatibility | IA-019 |
| Owner | Laptop Product Completion Track |
