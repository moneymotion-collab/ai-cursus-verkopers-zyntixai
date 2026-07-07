# ZyntixAI D2 Conditions Register

## 1. Purpose

Stable record of D2 governance conditions and D2-R1 remediation status. Replaces informal "Condition N" references.

## 2. Governance Provenance (D1 / D1-R1)

| Item | Status |
| ---- | ------ |
| Repository-tracked D1 artifact | **Not found** |
| Repository-tracked D1-R1 artifact | **Not found** |
| Nearest evidence | L0-C commit `97dabf6` (`docs(parallel): establish laptop ownership boundaries`) and 5 files in `docs/parallel-work/` |
| Remediation model | **Current-state supersession** — D2-R1 closure is based on present repository evidence; historical D1/D1-R1 provenance is a documentation limitation, not a current safety blocker |
| Fabrication policy | No historical evidence is invented or marked VERIFIED when absent |

## 3. Conditions

| ID | Condition | Source | Severity | Remediation | Status | Evidence |
| -- | --------- | ------ | -------- | ----------- | ------ | -------- |
| D2-C01 | No repository-tracked D1/D1-R1 audit artifact | D2 §3 | P2 | Provenance note in this register (§2); current-state validation supersedes | `ACCEPTED_RESIDUAL` | Git log search; no D1/D1-R1 files |
| D2-C02 | `.env.example` precedence implied only | D2 §3, §9 | P1 | Explicit precedence added to `SHARED-PATH-POLICY.md` §7 | `CLOSED` | `SHARED-PATH-POLICY.md` |
| D2-C03 | `README.md` lock semantics only in external policy | D2 §3, §9 | P1 | Governance pointer added to `README.md`; canonical rules in `SHARED-PATH-POLICY.md` | `CLOSED` | `README.md`, `SHARED-PATH-POLICY.md` |
| D2-C04 | `LAPTOP-ALLOWLIST.md` stale (L0-C-only §3 vs actual `docs/product/**`, `docs/ux/**` work) | D2 §3, §19 R3 | P1 | §3 rewritten to match current authorized zones | `CLOSED` | `LAPTOP-ALLOWLIST.md` |
| D2-C05 | Future roots `app/**`, `src/**`, `lib/**`, `components/**` unassigned | D2 §5, §19 R2 | P1 | Remain `BLOCKED_BY_DEFAULT`; guard in allowlist §5 and registry | `MITIGATED` | `ACTIVE-PATH-REGISTRY.md`, `LAPTOP-ALLOWLIST.md` |
| D2-C06 | Desktop live state not directly observed during D2 | D2 §2, §19 R8 | P2 | `origin/main` verified at `fd9a981`; physical desktop machine `NOT DIRECTLY VERIFIED` | `ACCEPTED_RESIDUAL` | `git rev-parse origin/main` |
| D2-C07 | Active-path registry not persisted | D2 §6, §19 | P1 | `ACTIVE-PATH-REGISTRY.md` created with update authority rules | `CLOSED` | This repo file |
| D2-C08 | `docs/parallel-work/**` classified `LAPTOP_OWNED` but desktop told to create registry there | D2 §1 contradiction | P0 | Reclassified to `SHARED_CONTROLLED`; desktop update authority for canonical files | `CLOSED` | `PARALLEL-WORK-OWNERSHIP.md`, this register |

### D2-R2 Closure Conditions

| ID | Condition | Source | Severity | Remediation | Status | Evidence |
| -- | --------- | ------ | -------- | ----------- | ------ | -------- |
| D2-C09 | Governance remediation not persisted (7 files uncommitted) | D2-R1 §14 | P1 | Local commit under `LOCK-20260707-001` | `CLOSED` | Git persistence commit |
| D2-C10 | Bootstrap authority ambiguity (registry desktop authority vs laptop creation) | D2-R1 §5 | P1 | `BT-20260707-001` bounded bootstrap in `SHARED-LOCK-REGISTRY.md` | `CLOSED` | `SHARED-LOCK-REGISTRY.md` |
| D2-C11 | Lock evidence absent for D2-R1 candidate shared edits | D2-R1 §4 | P1 | Honest bootstrap; no retroactive compliance claimed | `CLOSED` | `SHARED-PATH-POLICY.md` §11 |
| D2-C12 | Active-path registry baseline stale (pre-remediation SHA as final state) | D2-R1 §8 | P1 | §3 baseline semantics split in `ACTIVE-PATH-REGISTRY.md` | `CLOSED` | `ACTIVE-PATH-REGISTRY.md` §3 |

## 4. Open / Residual Summary

| Severity | Count | IDs |
| -------- | ----- | --- |
| P0 open | 0 | — |
| P1 open | 0 | — |
| Accepted residual | 2 | D2-C01, D2-C06 |
| Mitigated (ongoing guard) | 1 | D2-C05 |

## 5. D2-R1 Closure

| Field | Value |
| ----- | ----- |
| D2-R1 verdict | `PASS — PARALLEL EXECUTION LOCK ESTABLISHED` |
| D2 closure (policy) | `D2 CLOSED` (pending persistence — resolved by D2-R2) |
| Closed | 2026-07-07 |

## 6. Governance Persistence (D2-R2)

| Field | Value |
| ----- | ----- |
| Candidate Parent SHA | `16716f540292b156d13af42fcc101ea5a79bef30` |
| Source Main SHA | `fd9a981ed41e15ed08b9a6951c82f535c579d3ca` |
| Bootstrap lock | `LOCK-20260707-001` |
| Persistence strategy | Single commit |
| Governance Baseline Commit | Recorded post-commit below |
| D2-R2 verdict | Pending post-commit verification |

## 7. D2-R2 Closure

| Field | Value |
| ----- | ----- |
| D2-R2 verdict | Pending post-commit verification |
| D2 final closure | Pending |
| Remote push | `NO` |
