# ZyntixAI Course Seller Operating Decision Register

## 1. Purpose

Record material L2 operating-model decisions that govern how course-selling businesses are represented in ZyntixAI Phase 1 planning.

## 2. Decision Statuses

| Status | Meaning |
| ------ | ------- |
| `PROPOSED` | Under review |
| `APPROVED` | Authorized for L2 operating model |
| `REJECTED` | Not accepted |
| `DEFERRED` | Valid; resolved in later phase |
| `SUPERSEDED` | Replaced by later decision |

## 3. Decision Template

```text
Decision ID:
Date:
Status:
Operating question:
Related lifecycle stage:
Related problem IDs:
Related scope domains:
Decision:
Rationale:
User impact:
Scope impact:
Computer 1 dependency:
Residual uncertainty:
Owner:
```

## 4. Initial Operating Decisions

### OD-001 — Lifecycle-based, not page-based

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (L2 register entry date) |
| Status | `APPROVED` |
| Operating question | Should L2 model pages or operational events? |
| Related lifecycle stage | All `LCS-01`–`LCS-22` |
| Related problem IDs | P1-01 through P1-15 |
| Related scope domains | S1–S13 |
| Decision | Model operations as lifecycle events and transitions |
| Rationale | Real work moves through context, decisions, and outcomes—not through static screens |
| Owner | Laptop Product Completion Track |

### OD-002 — Follow-up may repeat

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Operating question | Is lead follow-up a one-time stage? |
| Related lifecycle stage | `LCS-04` |
| Related problem IDs | P1-06, P1-07 |
| Related scope domains | S2, S7 |
| Decision | Follow-up is a repeatable loop, not a single pass |
| Rationale | Course sellers often require multiple contact attempts |
| Owner | Laptop Product Completion Track |

### OD-003 — Won lead requires explicit handoff context

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-07`, `LCS-08` |
| Related problem IDs | P1-01, P1-11 |
| Related scope domains | S2, S3, S10 |
| Decision | Conversion must preserve lead history and notes in customer context |
| Rationale | Prevents restart-from-zero after sale |
| Owner | Laptop Product Completion Track |

### OD-004 — Enrollment and customer identity are distinct

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-08`, `LCS-09` |
| Related problem IDs | P1-14 |
| Related scope domains | S3, S5 |
| Decision | Customer relationship and program enrollment are separate operational concepts |
| Rationale | One customer may have zero, one, or multiple enrollments over time |
| Owner | Laptop Product Completion Track |

### OD-005 — Onboarding incompleteness may create attention

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-11` |
| Related problem IDs | P1-02, P1-13 |
| Related scope domains | S12, S8 |
| Decision | Stalled or incomplete onboarding is an attention candidate with evidence |
| Rationale | Activation failures are operational risks |
| Owner | Laptop Product Completion Track |

### OD-006 — Progress may be unknown

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-13` |
| Related problem IDs | P1-03, P1-12 |
| Related scope domains | S6 |
| Decision | Unknown progress is a valid state when evidence is unavailable |
| Rationale | Prevents fabricated engagement signals |
| Owner | Laptop Product Completion Track |

### OD-007 — Needs Attention requires evidence and human review

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-15`, `LCS-16` |
| Related problem IDs | P1-02, P1-12 |
| Related scope domains | S8 |
| Decision | Attention items require evidence context and human review before intervention |
| Rationale | Black-box alerts are not authoritative |
| Owner | Laptop Product Completion Track |

### OD-008 — Next Best Action is recommendation only

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-17` |
| Related problem IDs | P1-15 |
| Related scope domains | S9 |
| Decision | NBA is a recommendation with rationale; not automatic authority |
| Rationale | Human retains operational control |
| Owner | Laptop Product Completion Track |

### OD-009 — Conversation preparation has dual actors

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-19` |
| Related problem IDs | P1-09, P1-10 |
| Related scope domains | S11, S7, S12 |
| Decision | Operator preparation and customer readiness visibility are distinct |
| Rationale | Unprepared customers and unprepared operators are different problems |
| Owner | Laptop Product Completion Track |

### OD-010 — Recurring answers use bounded preparation

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-14` |
| Related problem IDs | P1-04, P1-05 |
| Related scope domains | S13, S10, S3 |
| Decision | Recurring questions addressed via grounded answer preparation; no autonomous support agent assumed |
| Rationale | Aligns with L1.1 semantic remediation |
| Owner | Laptop Product Completion Track |

### OD-011 — Common-core customer readiness signals

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-19` |
| Related problem IDs | P1-09 |
| Related scope domains | S11, S7, S12 |
| Decision | Readiness uses common-core categories only at L2; niche signals deferred |
| Rationale | Prevents trading/fitness-specific signals becoming universal |
| Residual uncertainty | Final signal list refined in L4 UX specification |
| Owner | Laptop Product Completion Track |

### OD-012 — Renewal/reactivation without revenue automation expansion

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| Related lifecycle stage | `LCS-21`, `LCS-22` |
| Related problem IDs | P1-06, P1-15 |
| Related scope domains | S2, S9 |
| Decision | Renewal and reactivation are lifecycle concepts; not a full revenue automation platform |
| Rationale | Preserves Phase 1 scope boundary |
| Owner | Laptop Product Completion Track |
