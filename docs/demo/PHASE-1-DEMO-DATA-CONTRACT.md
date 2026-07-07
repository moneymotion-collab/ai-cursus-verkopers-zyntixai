# ZyntixAI Phase 1 Demo Data Contract

## 1. Purpose

Defines minimum demo data entities, relationships, and truthfulness rules. **Does not implement data** — specifies what seed/fixture data MUST exist when a live demo is executed.

Companion: `PHASE-1-DEMO-SCENARIO-MATRIX.md`, `PHASE-1-DEMO-READINESS-GATE.md`.

---

## 2. Data Classification

| Class | Meaning | Demo disclosure |
| ----- | ------- | --------------- |
| `REAL IMPLEMENTATION DATA` | Persisted in environment from actual usage | None required |
| `DEMO SEED DATA` | Intentionally created fixture records | MUST disclose "demo data" if mixed with real |
| `PLACEHOLDER COPY` | Static UI copy not representing live computation | MUST NOT imply AI generation |
| `UNAVAILABLE FEATURE` | Not built | MUST NOT appear as functional |

At Phase 1 planning, all narrative data is **`DEMO SEED DATA`** until implementation exists.

---

## 3. Tenant Boundary

| Rule | Requirement |
| ---- | ----------- |
| Single tenant | All demo records belong to one organization tenant `TENANT-DEMO-01` |
| No cross-tenant | No record references another tenant |
| QA-GAP-002 | Adversarial RLS proof is desktop-dependent; demo does not claim backend proof |

---

## 4. Entity Requirements

### 4.1 Lead

| Field | Value |
| ----- | ----- |
| Purpose | WF1, WF2 demo |
| Required records | `LEAD-DEMO-01` (Qualified, follow-up due); `LEAD-DEMO-02` (Won, pending handoff for DEMO-F-001) |
| Relations | Notes, tasks linked |
| Forbidden shortcut | Lead shown as Customer without handoff |

### 4.2 Customer

| Field | Value |
| ----- | ----- |
| Purpose | Customer 360, multi-enrollment, attention |
| Required records | `CUST-DEMO-01` (Active, multi-enrollment); `CUST-DEMO-02` (from LEAD-DEMO-02 handoff) |
| Relations | 2+ enrollments for CUST-DEMO-01; notes; tasks |
| Forbidden shortcut | Customer-level progress aggregate |

### 4.3 Program

| Field | Value |
| ----- | ----- |
| Purpose | Reference/configuration object |
| Required records | `PROG-DEMO-01` (e.g. "12-Week Coaching"); `PROG-DEMO-02` (e.g. "Self-Paced Course") |
| Relations | Enrollments reference programs |
| Forbidden shortcut | Program count without unit (QA-GAP-001) |

### 4.4 Enrollment

| Field | Value |
| ----- | ----- |
| Purpose | F001, progress, attention |
| Required records | See §5 multi-enrollment matrix |
| Relations | Exactly one customer + one program each |
| Forbidden shortcut | Merged enrollments; customer substituted for enrollment in progress |

### 4.5 Progress Context

| Field | Value |
| ----- | ----- |
| Purpose | WF5, DEMO-E |
| Required records | Stalled evidence on ENR-DEMO-01; **no evidence** on ENR-DEMO-03 |
| Relations | Enrollment-scoped only |
| Forbidden shortcut | 0% for missing evidence; customer-level % |

### 4.6 Attention Item

| Field | Value |
| ----- | ----- |
| Purpose | F002, WF6 |
| Required records | `ATT-DEMO-01` (Open, linked ENR-DEMO-01, evidence: stalled progress) |
| Relations | One per underlying concern; enrollment At Risk references this item |
| Forbidden shortcut | Duplicate item for same concern; At Risk without item |

### 4.7 NBA Recommendation

| Field | Value |
| ----- | ----- |
| Purpose | WF10, DEMO-D |
| Required records | `NBA-DEMO-01` (Recommended, rationale, evidence refs) |
| Relations | Context from attention or task chain |
| Forbidden shortcut | Auto-accepted; no rationale |

### 4.8 Task

| Field | Value |
| ----- | ----- |
| Purpose | WF7, WF9, CC bucket |
| Required records | `TASK-DEMO-01` (Overdue, customer-linked); `TASK-DEMO-02` (Due today) |
| Relations | Linked to lead or customer |
| Forbidden shortcut | Task complete = business outcome resolved |

### 4.9 Note / Context

| Field | Value |
| ----- | ----- |
| Purpose | O3, handoff, AI grounding |
| Required records | Notes on LEAD-DEMO-02 (handoff); CUST-DEMO-01 (operational) |
| Relations | Lead/Customer scoped |
| Forbidden shortcut | Notes presented as eliminating S13 need for P1-04 |

### 4.10 Onboarding State

| Field | Value |
| ----- | ----- |
| Purpose | WF4, CC bucket |
| Required records | ENR-DEMO-02 onboarding Incomplete (optional CC reference) |
| Relations | Enrollment-scoped |
| Forbidden shortcut | Complete without evidence |

---

## 5. Multi-Enrollment Matrix (F001 — Mandatory)

```text
CUST-DEMO-01 "Alex Rivera"
├─ ENR-DEMO-01 → PROG-DEMO-01 → Active → Progress: Stalled → ATT-DEMO-01 open → At Risk visible
└─ ENR-DEMO-02 → PROG-DEMO-02 → Active → Progress: Healthy

ENR-DEMO-03 → PROG-DEMO-01 → Active → Progress: Unknown (no evidence)  [DEMO-E-001]
```

**Acceptance:**

- Enrollment identity preserved in all views
- CC shows fan-out (e.g. "1 enrollment needs review" with unit, not "1 customer problem" × 2)
- Drill-down: SCR-010 filtered or SCR-011 per enrollment
- No universal customer progress state

---

## 6. Attention Integrity Data (F002 — Mandatory)

```text
ENR-DEMO-01
  At Risk: visible (enrollment-scoped visibility)
  ATT-DEMO-01: Open (authoritative)
  Evidence: stalled progress signal (enrollment-scoped)
```

**After resolution demo branch:**

- ATT-DEMO-01 → Resolved
- At Risk on ENR-DEMO-01 MUST NOT persist independently

**Distinct concern branch (optional extension):**

- Second evidence type (e.g. onboarding gap) → `ATT-DEMO-02` allowed if materially distinct (QA-P1-084)

---

## 7. Command Center Reference Data (F003)

Minimum buckets for DEMO-A-001:

| Bucket | Demo record | Count unit |
| ------ | ----------- | ---------- |
| Tasks overdue | TASK-DEMO-01 | `tasks` |
| Attention open | ATT-DEMO-01 | `items` |
| NBA awaiting review | NBA-DEMO-01 | `recommendations` |
| Lead follow-ups | LEAD-DEMO-01 | `leads` |
| Onboarding gaps | ENR-DEMO-02 (optional) | `enrollments` |

**MUST NOT:** Single combined priority score across buckets.

---

## 8. Demo Data Truthfulness Rules

| Prohibited | Required instead |
| ---------- | ---------------- |
| Placeholder as live AI insight | Disclose DEMO SEED or show real generation with evidence |
| Static text as AI output without disclosure | Label as illustrative OR use real S13 with context |
| Cross-tenant records | Single TENANT-DEMO-01 |
| Invented progress % | Unknown or evidence-backed state label |
| Customer-level progress score | Enrollment-scoped only |
| Risk/churn score | Evidence-backed attention only |
| Ranking score across domains | Separate buckets (F003) |

---

## 9. AI Demo Data Requirements

For S13 demos (when implemented):

| Requirement | Data |
| ----------- | ---- |
| Grounding context | Notes + customer context on CUST-DEMO-01 |
| Insufficient evidence case | ENR-DEMO-03 or empty note set |
| Personalization trace | Customer-specific note content in output chain |
| Human review | No pre-sent message in fixture |

**Prohibited:** Pre-written "AI response" fixture presented as live generation without disclosure.

---

## 10. Entity Relationship Diagram (Demo Fixture)

```text
TENANT-DEMO-01
├── LEAD-DEMO-01 ──task── TASK-DEMO-02
├── LEAD-DEMO-02 ──handoff──► CUST-DEMO-02
├── CUST-DEMO-01
│   ├── ENR-DEMO-01 ── PROG-DEMO-01 ── ATT-DEMO-01
│   ├── ENR-DEMO-02 ── PROG-DEMO-02
│   └── ENR-DEMO-03 ── PROG-DEMO-01 (unknown progress)
├── NBA-DEMO-01 (context: ATT-DEMO-01 or TASK-DEMO-01)
└── TASK-DEMO-01 (overdue, CUST-DEMO-01)
```

---

## 11. Data Implementation Dependency

| Entity data | Dependency |
| ----------- | ---------- |
| All persistence | DEPENDS ON DESKTOP BACKEND |
| CC display | DEPENDS ON L5 |
| Attention surfacing | DEPENDS ON L6 |
| NBA presentation | DEPENDS ON L7 |
| Fixture creation | Desktop or approved seed mechanism — **not laptop scope** |

Laptop defines contract only; does not create seed scripts.

---

## 12. QA-GAP-001 Data Impact

Program list count on SCR-014:

- If count shown: MUST declare unit (`programs`, `enrollments`, `customers`)
- If unit undefined in product: omit count from demo OR disclose QA-GAP-001 limitation
- MUST NOT silently use active/all semantics
