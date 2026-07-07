# ZyntixAI Parallel Work Ownership Manifest

## 1. Purpose

ZyntixAI is being developed in parallel on two physical computers. This manifest exists to:

- prevent overlapping edits
- protect migration integrity
- protect backend and Supabase verification
- reduce merge conflict risk
- define decision authority
- make handoff explicit

## 2. Current Parallel Tracks

### Computer 1 — Technical Foundation Track

Computer 1 owns active work involving:

- Supabase
- migrations
- database schema
- SQL
- RLS
- JWT/auth behavior
- membership isolation
- Programs backend
- Enrollments backend
- Customer remediation
- Leads remediation
- remote migration state
- local/remote parity
- adversarial database/security testing
- formal technical closure

Computer 1 is currently handling the Phase 5.2A technical verification track.

### Laptop — Product Completion Track

Laptop ownership is intended for:

- Phase 1 scope
- course seller lifecycle
- information architecture
- UX specifications
- Morning Command Center specification
- Needs Attention specification
- Next Best Action specification
- AI operating model
- UI/frontend contracts as documentation
- QA acceptance documentation
- demo planning
- launch readiness planning
- pricing/business planning
- beta planning
- marketing planning

## 3. Ownership Principle

**Single Writer Per Technical Surface**

One track owns each sensitive surface. The laptop must not silently cross into Computer 1 territory. Computer 1 work takes precedence for protected technical surfaces. Shared-path edits require explicit release and coordination.

## 4. Authority Model

### Computer 1 has final authority over

Technical backend/database surfaces.

### Laptop has final authority over

New documentation-only product/specification surfaces within its allowlist.

### Shared areas

Require explicit coordination before modification.

### `docs/parallel-work/**`

Classification: `SHARED_CONTROLLED` (not exclusively laptop-owned).

- Laptop maintains product-track policy documents during parallel work.
- Desktop holds normal update authority for canonical execution artifacts (`ACTIVE-PATH-REGISTRY.md`, `D2-CONDITIONS-REGISTER.md`).
- Any edit requires shared-lock procedure per `SHARED-PATH-POLICY.md`.
- Integration owner: Desktop.

## 5. Baseline

- laptop branch: `parallel/laptop-product-track-20260707`
- isolation baseline SHA: `fd9a981ed41e15ed08b9a6951c82f535c579d3ca`
- L0-B status: `PASS — LAPTOP BRANCH ISOLATED`
- D2 verdict: `PASS WITH CONDITIONS — CONTROLLED PARALLEL EXECUTION ONLY`
- D2-R1 verdict: `PASS — PARALLEL EXECUTION LOCK ESTABLISHED` (see `D2-CONDITIONS-REGISTER.md`)

## 6. Canonical Governance Index

| Document | Role |
| -------- | ---- |
| `PARALLEL-WORK-OWNERSHIP.md` | Authority model (this file) |
| `LAPTOP-ALLOWLIST.md` | Laptop path authorization |
| `COMPUTER-1-PROTECTED-ZONES.md` | Desktop protected surfaces |
| `SHARED-PATH-POLICY.md` | Shared-file locks and `.env.example` precedence |
| `SESSION-SAFETY-CHECKLIST.md` | Per-session operational checks |
| `ACTIVE-PATH-REGISTRY.md` | Canonical active-path state (desktop update authority) |
| `D2-CONDITIONS-REGISTER.md` | D2 condition tracking and provenance |
| `SHARED-LOCK-REGISTRY.md` | Shared-file lock records |

## 7. Default Deny Principle

Any path not explicitly authorized for the laptop must be treated as **NOT AUTHORIZED** until intentionally classified.

## 8. Stop-Work Conditions

Laptop work must stop immediately if:

- current branch is wrong
- protected path changes appear
- unexpected root file changes appear
- Supabase files change
- migrations change
- package files change
- environment files change
- a broad agent edit touches unrelated paths
- branch ownership becomes unclear
- merge/rebase is unexpectedly required

## 9. Change Transfer Principle

Laptop work is not merged into `main` automatically. Integration occurs only at explicit checkpoints after:

- scope review
- changed-path review
- protected-zone verification
- conflict assessment

