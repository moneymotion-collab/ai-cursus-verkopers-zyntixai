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

## 5. Baseline

- laptop branch: `parallel/laptop-product-track-20260707`
- isolation baseline SHA: `fd9a981ed41e15ed08b9a6951c82f535c579d3ca`
- L0-B status: `PASS — LAPTOP BRANCH ISOLATED`

## 6. Default Deny Principle

Any path not explicitly authorized for the laptop must be treated as **NOT AUTHORIZED** until intentionally classified.

## 7. Stop-Work Conditions

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

## 8. Change Transfer Principle

Laptop work is not merged into `main` automatically. Integration occurs only at explicit checkpoints after:

- scope review
- changed-path review
- protected-zone verification
- conflict assessment

