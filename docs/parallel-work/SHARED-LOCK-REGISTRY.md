# ZyntixAI Shared Lock Registry

## 1. Purpose

Canonical record of shared-file locks for `SHARED_CONTROLLED` paths. Established during D2-R2 (2026-07-07).

## 2. Bootstrap Transition Policy

### BT-20260707-001 — D2-R1 Candidate Persistence Bootstrap

This is a **current remediation decision** for D2-R2. It does **not** claim retroactive lock compliance for D2-R1 edits made without prior lock evidence.

| Rule | Detail |
| ---- | ------ |
| Applicability | One-time only; ends immediately after governance persistence commit |
| Enumerated scope | Exactly these candidate files from parent SHA `16716f5`: `README.md`, `docs/parallel-work/ACTIVE-PATH-REGISTRY.md`, `docs/parallel-work/D2-CONDITIONS-REGISTER.md`, `docs/parallel-work/LAPTOP-ALLOWLIST.md`, `docs/parallel-work/PARALLEL-WORK-OWNERSHIP.md`, `docs/parallel-work/SESSION-SAFETY-CHECKLIST.md`, `docs/parallel-work/SHARED-PATH-POLICY.md`, `docs/parallel-work/SHARED-LOCK-REGISTRY.md` |
| Does not grant | Permanent laptop authority over canonical execution artifacts |
| Requires | Candidate diff validation; zero protected technical changes; `origin/main` intersection verified |
| After release | All shared-controlled edits require normal lock protocol per `SHARED-PATH-POLICY.md` |

## 3. Lock Records

### LOCK-20260707-001

| Field | Value |
| ----- | ----- |
| Lock ID | `LOCK-20260707-001` |
| Type | `BOUNDED_BOOTSTRAP` |
| Path | `README.md`, `docs/parallel-work/**` (enumerated in BT-20260707-001) |
| Holder | Laptop |
| Requestor | D2-R2 closure session |
| Reason | Persist validated D2-R1 governance remediation; establish lock mechanism; resolve bootstrap authority ambiguity |
| Scope | Governance-only candidate files; no technical surfaces |
| Start SHA | `16716f540292b156d13af42fcc101ea5a79bef30` |
| Start Time | 2026-07-07 (D2-R2 session) |
| Release Condition | Governance persistence commit completes; working tree clean |
| Integration Owner | Desktop |
| Status | `ACTIVE` (release upon persistence commit) |

## 4. Released Locks

_(None yet — LOCK-20260707-001 releases upon governance persistence commit.)_

## 5. Future Lock Template

```text
LOCK-YYYYMMDD-NNN
Path:
Holder:
Requestor:
Reason:
Scope:
Start SHA:
Start Time:
Release Condition:
Integration Owner:
Status: ACTIVE | RELEASED | STALE | CANCELLED
```
