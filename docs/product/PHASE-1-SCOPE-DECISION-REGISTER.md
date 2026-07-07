# ZyntixAI Phase 1 Scope Decision Register

## 1. Purpose

Every post-freeze change to Phase 1 scope must be recorded here before planning or implementation proceeds.

This register prevents silent scope creep and makes ownership, rationale, and launch impact explicit.

---

## 2. Decision Statuses

| Status | Meaning |
| ------ | ------- |
| `PROPOSED` | Under review; not authorized |
| `APPROVED` | Authorized for Phase 1 |
| `REJECTED` | Not accepted for Phase 1 |
| `DEFERRED` | Valid idea; not required for launch |
| `SUPERSEDED` | Replaced by a later decision |

---

## 3. Decision Template

Use this template for all new entries:

```text
Decision ID:
Date:
Status:
Proposal:
Problem ID addressed:
Current scope insufficiency:
User value:
Launch impact:
UX impact:
AI impact:
Backend dependency:
Computer 1 conflict risk:
QA impact:
Security impact:
Decision:
Rationale:
Owner:
```

---

## 4. Initial Frozen Decisions

### SD-001 — Phase 1 target market is Course Sellers

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `APPROVED` |
| Proposal | Launch Phase 1 for course-selling businesses as the initial target market |
| Problem ID addressed | P1-01 through P1-15 (shared operational foundation) |
| Decision | `APPROVED` |
| Rationale | Authoritative problems align with course-seller operational chaos, not unrelated industries |
| Owner | Laptop Product Completion Track |

### SD-002 — Shared course-seller operational core, not separate niche apps

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `APPROVED` |
| Proposal | Build one shared operational foundation; do not launch separate niche products |
| Problem ID addressed | All authoritative problems |
| Decision | `APPROVED` |
| Rationale | Prevents fragmentation and uncontrolled niche expansion at launch |
| Owner | Laptop Product Completion Track |

### SD-003 — Morning prioritization is in scope

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `APPROVED` |
| Proposal | Include Morning Command Center (`S1`) in Phase 1 |
| Problem ID addressed | P1-07, P1-08 |
| Decision | `APPROVED` |
| Rationale | Directly addresses forgotten tasks and unknown daily starting point |
| Owner | Laptop Product Completion Track |

### SD-004 — Needs Attention is in scope

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `APPROVED` |
| Proposal | Include Needs Attention (`S8`) in Phase 1 |
| Problem ID addressed | P1-02, P1-12 |
| Decision | `APPROVED` |
| Rationale | Owner must know who needs attention and why |
| Owner | Laptop Product Completion Track |

### SD-005 — Next Best Action is in scope

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `APPROVED` |
| Proposal | Include Next Best Action (`S9`) in Phase 1 |
| Problem ID addressed | P1-15 |
| Decision | `APPROVED` |
| Rationale | Owner needs explicit, explainable next actions |
| Owner | Laptop Product Completion Track |

### SD-006 — Full autonomous AI business operation is deferred

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `DEFERRED` |
| Proposal | Allow AI to autonomously run business operations |
| Problem ID addressed | None requiring autonomy for launch |
| Decision | `DEFERRED` |
| Rationale | Violates human-control boundary; not required for Phase 1 problems |
| Owner | Laptop Product Completion Track |

### SD-007 — Full accounting suite is deferred

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `DEFERRED` |
| Proposal | Include full accounting/bookkeeping in Phase 1 |
| Problem ID addressed | None authoritative |
| Decision | `DEFERRED` |
| Rationale | Out of scope per `OOS-01` |
| Owner | Laptop Product Completion Track |

### SD-008 — Sponsor/partnership marketplace is deferred

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `DEFERRED` |
| Proposal | Include sponsor/partnership marketplace in Phase 1 |
| Problem ID addressed | None authoritative |
| Decision | `DEFERRED` |
| Rationale | Out of scope per `OOS-03` |
| Owner | Laptop Product Completion Track |

### SD-009 — Supplier/procurement intelligence is deferred

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `DEFERRED` |
| Proposal | Include supplier/procurement intelligence in Phase 1 |
| Problem ID addressed | None authoritative |
| Decision | `DEFERRED` |
| Rationale | Out of scope per `OOS-02` |
| Owner | Laptop Product Completion Track |

### SD-010 — Deep niche-specific modules are deferred unless separately approved

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `DEFERRED` |
| Proposal | Build niche-specific deep modules at launch |
| Problem ID addressed | None requiring niche depth for shared core |
| Decision | `DEFERRED` |
| Rationale | Out of scope per `OOS-07`; requires separate approval |
| Owner | Laptop Product Completion Track |

### SD-011 — Phase 1 does not require every future ZyntixAI industry

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `APPROVED` |
| Proposal | Limit Launch 1 to Course Sellers only |
| Problem ID addressed | N/A — scope boundary decision |
| Decision | `APPROVED` |
| Rationale | Prevents universal multi-industry scope creep at launch |
| Owner | Laptop Product Completion Track |

### SD-012 — New ideas default to deferred after scope freeze

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (register entry date) |
| Status | `APPROVED` |
| Proposal | Default all post-freeze ideas to deferred unless formally approved |
| Problem ID addressed | N/A — governance decision |
| Decision | `APPROVED` |
| Rationale | Enforces change control and prevents silent expansion |
| Owner | Laptop Product Completion Track |

### SD-013 — Repeated-question handling via bounded AI preparation

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (L1.1 register entry date) |
| Status | `APPROVED` |
| Proposal | Correct primary mapping for P1-04: `S13` primary, `S10`/`S3` supporting |
| Problem ID addressed | P1-04 |
| Current scope insufficiency | `S10` alone preserves context but does not reduce repeat-answer burden |
| Decision | `APPROVED` |
| Rationale | Recurring questions are solved through grounded answer preparation, not notes storage alone; no chatbot or knowledge base required |
| Owner | Laptop Product Completion Track |

### SD-014 — Personalization as context plus bounded AI preparation

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (L1.1 register entry date) |
| Status | `APPROVED` |
| Proposal | Correct primary mapping for P1-05: `S13` primary, `S3`/`S10` supporting |
| Problem ID addressed | P1-05 |
| Current scope insufficiency | `S3` provides context availability but does not produce personalized responses |
| Decision | `APPROVED` |
| Rationale | Personalization requires grounded AI draft preparation with human review; `S3` is supporting context, not the personalization mechanism |
| Owner | Laptop Product Completion Track |

### SD-015 — Conversation preparation distinguishes operator and customer readiness

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (L1.1 register entry date) |
| Status | `APPROVED` |
| Proposal | Correct primary mapping for P1-09: `S11` primary, `S7`/`S12` supporting; clarify dual-actor boundary |
| Problem ID addressed | P1-09 |
| Current scope insufficiency | `S12` onboarding visibility alone does not address customer pre-call readiness |
| Decision | `APPROVED` |
| Rationale | Operator preparation and customer readiness visibility are distinct; pre-call tasks (`S7`) and onboarding (`S12` where relevant) support but do not replace `S11` |
| Owner | Laptop Product Completion Track |
