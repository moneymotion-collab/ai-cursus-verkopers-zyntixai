# ZyntixAI Phase 1 Information Architecture Decision Register

## 1. Purpose

Record material L3 information architecture decisions that govern how Phase 1 operational information is organized, discovered, and navigated.

---

## 2. Decision Statuses

| Status | Meaning |
| ------ | ------- |
| `PROPOSED` | Under review |
| `APPROVED` | Authorized for L3 information architecture |
| `REJECTED` | Not accepted |
| `DEFERRED` | Valid; resolved in later phase |
| `SUPERSEDED` | Replaced by later decision |

---

## 3. Decision Template

```text
Decision ID:
Date:
Status:
IA question:
Evidence:
Alternatives considered:
Decision:
Rationale:
User impact:
Navigation impact:
Mobile impact:
Scope impact:
L2 compatibility:
Computer 1 dependency:
Residual uncertainty:
Owner:
```

---

## 4. Initial Required Decisions

### IA-001 — Architecture based on operational needs, not database structure

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (L3 register entry date) |
| Status | `APPROVED` |
| IA question | Should navigation mirror database tables? |
| Evidence | P1-01 scattered context; L2 object model; AP-01 audit |
| Alternatives considered | Table-mirror navigation |
| Decision | Navigation follows operational objects and work queues |
| Rationale | Course sellers think in leads and customers, not rows |
| User impact | Intuitive findability |
| Navigation impact | Object-centric primary nav |
| Mobile impact | None negative |
| Scope impact | None |
| L2 compatibility | Full |
| Computer 1 dependency | Implementation mapping deferred |
| Owner | Laptop Product Completion Track |

### IA-002 — Lifecycle stages do not become navigation destinations

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Should LCS-01–LCS-22 appear in menu? |
| Evidence | L2 blueprint; AP-03; Candidate C rejected |
| Alternatives considered | Lifecycle-oriented nav (Acquire/Convert/Deliver) |
| Decision | Lifecycle stages inform context, not menu labels |
| Rationale | Stages are events; users navigate to objects and queues |
| User impact | Lower cognitive translation |
| Navigation impact | No lifecycle menu |
| Mobile impact | Simpler nav |
| Scope impact | None |
| L2 compatibility | Full — LCS unchanged |
| Owner | Laptop Product Completion Track |

### IA-003 — Scope domains do not automatically become top-level navigation

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Should each S1–S13 be a menu item? |
| Evidence | C1–C10 scoring; AP-02 |
| Alternatives considered | Full S1–S13 mirror |
| Decision | Each domain earns placement by operational frequency and identity |
| Rationale | S6 Progress and S13 AI are contextual, not destinations |
| User impact | Less menu clutter |
| Navigation impact | 5 primary + More |
| Mobile impact | Critical — enables 5-item bottom nav |
| Scope impact | None — all S domains represented |
| L2 compatibility | Full |
| Owner | Laptop Product Completion Track |

### IA-004 — Command Center is aggregate, not duplicate truth

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Does Command Center own operational records? |
| Evidence | S1 scope; AP-04; L2 Command Center inputs |
| Alternatives considered | Dashboard-owned tasks and attention |
| Decision | Command Center references authoritative sources only |
| Rationale | Prevents sync conflicts and fragmented state |
| User impact | Trust in single source |
| Navigation impact | Drill-down to owners |
| Mobile impact | Home remains trustworthy entry |
| Scope impact | None |
| L2 compatibility | Full |
| Residual uncertainty | Section ordering in L5 |
| Owner | Laptop Product Completion Track |

### IA-005 — Lead and Customer remain distinct with explicit handoff

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Should Lead and Customer be one navigable object? |
| Evidence | WF2; OD-003 (L2); P1-06 vs P1-14 |
| Alternatives considered | Unified "Contact" object |
| Decision | Separate Lead and Customer with handoff flow |
| Rationale | Sales and delivery contexts differ; conversion is explicit event |
| User impact | Clear pipeline vs delivery mental model |
| Navigation impact | Separate top-level lists |
| Mobile impact | Both in bottom nav |
| Scope impact | None |
| L2 compatibility | Full |
| Owner | Laptop Product Completion Track |

### IA-006 — Program and Enrollment remain distinct

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Should Program and Enrollment be collapsed? |
| Evidence | OD-004 (L2); S4 vs S5; pause on enrollment (OD-014) |
| Alternatives considered | Program-only nav; enrollment as customer field only |
| Decision | Both exist; Enrollment in More group with Customer contextual access |
| Rationale | One customer, multiple enrollments; program is reference |
| User impact | Correct lifecycle visibility |
| Navigation impact | Programs and Enrollments under More |
| Mobile impact | Secondary via More; primary via Customer |
| Scope impact | None |
| L2 compatibility | Full |
| Owner | Laptop Product Completion Track |

### IA-007 — Needs Attention has one authoritative ownership model

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Where is attention truth owned? |
| Evidence | P1-02; AP-07; WF6 |
| Alternatives considered | Dashboard-only attention; per-page lists |
| Decision | Top-level Attention queue is authoritative; other surfaces reference |
| Rationale | Prevents incompatible attention states |
| User impact | Consistent review experience |
| Navigation impact | Attention in primary nav |
| Mobile impact | Bottom nav item |
| Scope impact | None |
| L2 compatibility | Full |
| Residual uncertainty | Thresholds in L6 |
| Owner | Laptop Product Completion Track |

### IA-008 — NBA review distinct from candidate generation

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Is NBA review the same as NBA generation UI? |
| Evidence | OD-015; LCS-17; AP-08 |
| Alternatives considered | NBA as top-level menu equal to Attention |
| Decision | NBA review is authoritative queue in More; generation is contextual; single review surface (refined L3.1: IA-018) |
| Rationale | Separates recommendation framing from human review; coherent multi-item workload |
| User impact | Clear accept/defer/dismiss |
| Navigation impact | RI-NBA-QUEUE in More; not primary nav |
| Mobile impact | More menu; Command Center entry |
| Scope impact | None |
| L2 compatibility | Full — OD-015 preserved |
| Residual uncertainty | Ranking in L7 |
| Owner | Laptop Product Completion Track |

### IA-009 — Recurring Q&A is cross-lifecycle, not one universal destination

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Does LCS-14 need a Support Center menu item? |
| Evidence | OD-013; P1-04, P1-05; L2.1 residual IA question |
| Alternatives considered | Support inbox; knowledge base nav item |
| Decision | Contextual on Lead/Customer + AI prepare; no standalone destination |
| Rationale | Questions occur across lifecycle; no chatbot/KB in scope |
| User impact | Answer prep where customer context exists |
| Navigation impact | RI-ANSWER-PREP contextual intent |
| Mobile impact | Customer detail → AI |
| Scope impact | None — no new capability |
| L2 compatibility | Full — OD-013 preserved |
| Owner | Laptop Product Completion Track |

### IA-010 — Customer 360 is bounded, not a dumping ground

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Should everything appear on Customer detail? |
| Evidence | AP-05; S3 scope; object hierarchy |
| Alternatives considered | Full embed of attention queue, program admin |
| Decision | Customer 360 shows summary, links, and related context — not full duplicates |
| Rationale | Prevents unbounded page complexity |
| User impact | Scannable customer hub |
| Navigation impact | Drill to Enrollment, Attention, Tasks |
| Mobile impact | Sectioned detail view |
| Scope impact | None |
| L2 compatibility | Full |
| Owner | Laptop Product Completion Track |

### IA-011 — AI access is contextual and permission-aware

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Should AI be a top-level navigation destination? |
| Evidence | S13; AP-06; L2 AI boundary |
| Alternatives considered | "AI Assistant" primary nav item |
| Decision | Contextual AI command from object/aggregate views |
| Rationale | AI assists current work; does not replace navigation |
| User impact | Grounded, relevant assistance |
| Navigation impact | RI-AI-COMMAND overlay |
| Mobile impact | Header/FAB on detail views |
| Scope impact | None |
| L2 compatibility | Full |
| Owner | Laptop Product Completion Track |

### IA-012 — Mobile navigation is intentionally prioritized

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Is mobile a compressed desktop menu? |
| Evidence | C9; AP-09; P1-08 mobile usability (L1 NFR) |
| Alternatives considered | Identical desktop/mobile trees |
| Decision | 5-item bottom nav; secondary in More |
| Rationale | Field use requires fast access to core five |
| User impact | Usable mobile operations |
| Navigation impact | See mobile principles doc |
| Mobile impact | Primary design constraint |
| Scope impact | None |
| L2 compatibility | Full |
| Owner | Laptop Product Completion Track |

### IA-013 — States are not standalone navigation destinations

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Should Paused, Overdue, Ready be menu items? |
| Evidence | AP-12; OD-014; state model |
| Alternatives considered | "Paused enrollments" top-level |
| Decision | States are filters and badges on object lists |
| Rationale | States are conditions, not work destinations |
| User impact | Filter-based discovery |
| Navigation impact | List filters only |
| Mobile impact | Filter sheets |
| Scope impact | None |
| L2 compatibility | Full — OD-014 preserved |
| Owner | Laptop Product Completion Track |

### IA-014 — Selected model is Object-Centric Operational Hybrid

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Which IA candidate wins? |
| Evidence | Candidate comparison table in PHASE-1-INFORMATION-ARCHITECTURE.md |
| Alternatives considered | A pure object-centric; B workstream; C lifecycle |
| Decision | Hybrid: object-centric primary nav + grouped secondary + contextual cross-lifecycle |
| Rationale | Best findability and scope alignment with mobile constraints |
| User impact | Familiar CRM-like objects without lifecycle confusion |
| Navigation impact | Final tree in navigation model |
| Mobile impact | 5 bottom nav + More |
| Scope impact | None |
| L2 compatibility | Full |
| Owner | Laptop Product Completion Track |

### IA-015 — Tasks are top-level, not only contextual

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Should Tasks exist only inside Lead/Customer? |
| Evidence | P1-07; C1 score 5 for daily task access; WF9 |
| Alternatives considered | Contextual-only tasks |
| Decision | Tasks are primary destination with contextual links on objects |
| Rationale | Owners need cross-entity task view for daily work |
| User impact | Single task inbox |
| Navigation impact | Tasks in primary nav |
| Mobile impact | Bottom nav |
| Scope impact | None |
| L2 compatibility | Full |
| Owner | Laptop Product Completion Track |

### IA-016 — Reports are not a Phase 1 navigation destination

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 |
| Status | `APPROVED` |
| IA question | Should Reports/Analytics appear in nav? |
| Evidence | PHASE-1-OUT-OF-SCOPE; no P1 problem for analytics |
| Alternatives considered | Empty Reports placeholder |
| Decision | Reports not in Phase 1 IA |
| Rationale | Out of scope; avoids empty destination |
| User impact | No false promise |
| Navigation impact | Excluded |
| Mobile impact | Excluded |
| Scope impact | None |
| L2 compatibility | Full |
| Owner | Laptop Product Completion Track |

### IA-017 — Progress aggregate visibility via Enrollments workspace

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (L3.1 register entry date) |
| Status | `APPROVED` |
| IA question | Is contextual-only Progress sufficient for cross-customer review? |
| Evidence | P1-03, P1-12; WF5; Scenario B (80 customers); AT-03 cross-object need |
| Alternatives considered | Top-level Progress nav; Reports module |
| Decision | Progress detail on Enrollment; cross-enrollment aggregate via Enrollments list filters; Customer list operational filters; Command Center drills to Enrollments filtered view |
| Rationale | WF5 requires cross-enrollment visibility without one-by-one Customer opens; no new scope domain |
| User impact | Coach can review stalled/unknown/declining enrollments in one workspace |
| Navigation impact | Enrollments operational workspace strengthened; Progress not top-level |
| Mobile impact | More → Enrollments; Command Center drill-down |
| Scope impact | None — operational states only; no metrics suite |
| L2 compatibility | Full |
| Residual uncertainty | Filter labels and column layout in L4 |
| Owner | Laptop Product Completion Track |

### IA-018 — NBA Review authoritative queue in More

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (L3.1 register entry date) |
| Status | `APPROVED` |
| IA question | Is there one coherent place to review all pending NBA recommendations? |
| Evidence | P1-15; WF10; Scenario B (multiple awaiting review); OD-015 |
| Alternatives considered | Top-level NBA nav; Command Center as review workspace |
| Decision | NBA review queue in More (RI-NBA-QUEUE); detail via RI-NBA-REVIEW; Command Center references only |
| Rationale | One recommendation, one review lifecycle, multiple references; avoids Command Center overload |
| User impact | Intentional access to full review workload |
| Navigation impact | More menu item; supersedes intent-only access |
| Mobile impact | More menu; Command Center entry |
| Scope impact | None |
| L2 compatibility | Full — OD-015 preserved |
| Owner | Laptop Product Completion Track |

### IA-019 — Enrollments remains grouped; strengthened as operational workspace

| Field | Value |
| ----- | ----- |
| Date | 2026-07-07 (L3.1 register entry date) |
| Status | `APPROVED` |
| IA question | Is More too deep for Phase 1 Enrollment operations? |
| Evidence | S5, S12, S6; WF3–5; cross-enrollment scenarios; AT-01 frequency 3–4 |
| Alternatives considered | Promote to primary desktop/mobile nav |
| Decision | Keep Enrollments in More; define as cross-enrollment operational workspace; first item in More; Command Center and Customer list entry points |
| Rationale | Daily frequency lower than Customers/Tasks; aggregate workspace solves depth without mobile nav expansion |
| User impact | Cross-enrollment operations accessible in ≤2 taps from Home drill-down |
| Navigation impact | More ordering: Enrollments first |
| Mobile impact | More menu; not bottom nav |
| Scope impact | None |
| L2 compatibility | Full — OD-014 pause on Enrollment |
| Owner | Laptop Product Completion Track |
