# ZyntixAI Phase 1 Beta Feedback & Triage

## 1. Purpose

Defines feedback channels, record schema, severity, triage workflow, stop/pause/continue criteria, and feature-request containment.

---

## 2. Feedback Categories

| Category | Examples | Default severity |
| -------- | -------- | ---------------- |
| `DEFECT` | Broken workflow, wrong state | P1–P2 |
| `CONFUSING_UX` | Misunderstood bucket/label | P2–P3 |
| `INCORRECT_DATA` | Wrong enrollment link | P1 |
| `MISSING_EVIDENCE` | Unknown shown as zero | P1 |
| `AI_QUALITY` | Ungrounded output | P1 |
| `PERMISSION_ACCESS` | Unauthorized view | P0–P1 |
| `PERFORMANCE` | Unusable latency | P2 |
| `FEATURE_REQUEST` | New capability ask | Out of scope unless defect |
| `OUT_OF_SCOPE` | Scheduling platform, etc. | N/A — reject |

---

## 3. Feedback Record Schema

| Field | Required |
| ----- | -------- |
| Feedback ID | Yes — `BETA-FB-###` |
| Tester | Yes |
| Task ID | Yes — `BETA-TASK-###` |
| Workflow | Yes |
| Environment | Yes |
| Commit SHA | Yes |
| Observed behavior | Yes |
| Expected behavior | Yes |
| Evidence | Yes — screenshot/recording/log |
| Category | Yes |
| Severity | Yes — P0/P1/P2/P3 |
| Reproducible? | Yes |
| Status | Yes — see §5 |
| Owner | Yes |

---

## 4. Defect Severity Model

| Level | Beta examples |
| ----- | ------------- |
| **P0** | Cross-tenant exposure; autonomous AI action; data corruption |
| **P1** | Core workflow blocked; F001/F002/F003 regression; duplicate attention authority |
| **P2** | Confusing UX; non-blocking data issue; performance degradation |
| **P3** | Cosmetic; minor copy |

Aligns with `PHASE-1-DEFINITION-OF-DONE.md` §9.

---

## 5. Issue Status Vocabulary

`NEW` → `TRIAGED` → `REPRODUCED` / `NOT REPRODUCED` → `IN FIX` → `READY FOR RETEST` → `RETEST PASS` / `RETEST FAIL` → `DEFERRED` / `OUT OF SCOPE` → `CLOSED`

---

## 6. Triage Workflow

```text
Feedback (BETA-FB-###)
  → Classification (category)
  → Severity (P0–P3)
  → Owner assignment (Computer 1 / Laptop / QA)
  → Reproduction attempt
  → Decision: Fix / Defer / Reject (out of scope)
  → Retest on corrected build
  → Closure with evidence
```

| Stage | Responsible | Evidence |
| ----- | ----------- | -------- |
| Intake | Tester | BETA-FB record |
| Triage | Laptop Product + QA | Severity + owner |
| Fix | Computer 1 (impl) | Commit SHA |
| Retest | QA Executor / Tester | BETA-RUN retest row |
| Close | Business Owner | Closure note |

---

## 7. Feature Request Containment

| Input | Classification |
| ----- | -------------- |
| Broken frozen-scope behavior | `DEFECT` |
| Usability improvement in scope | `CONFUSING_UX` / P2 |
| New capability not in Phase 1 | `FEATURE_REQUEST` → `OUT OF SCOPE` |
| Unsupported integration | `OUT_OF_SCOPE` |

**Rule:** Feature requests do NOT automatically become Phase 1 defects or scope changes.

---

## 8. Beta Stop Conditions (Immediate)

| Stop ID | Condition | Severity | Who pauses | Evidence preserved |
| ------- | --------- | -------- | ---------- | ------------------- |
| BETA-STOP-001 | Cross-tenant data visible | P0 | Business Owner + C1 | Screenshots, logs, SHA |
| BETA-STOP-002 | Destructive unauthorized action | P0 | Business Owner | Repro recording |
| BETA-STOP-003 | Corrupted authoritative state | P0 | Business Owner | DB snapshot (C1) |
| BETA-STOP-004 | Autonomous AI external action | P0 | Business Owner | AI context dump |
| BETA-STOP-005 | Migration corruption | P0 | Computer 1 | Migration logs |
| BETA-STOP-006 | Severe privacy breach | P0 | Business Owner | Incident record |

**Restart requires:** Root cause fixed; retest PASS; no open P0; Owner authorization.

---

## 9. Beta Pause Conditions (Non-Immediate)

| Pause ID | Condition | Action |
| -------- | --------- | ------ |
| BETA-PAUSE-001 | ≥3 unrelated P1 in 24h | Pause new testers; triage |
| BETA-PAUSE-002 | Unstable build (crash loop) | Hold until new build |
| BETA-PAUSE-003 | Critical journey broken | Pause until BETA-JOURNEY-CRIT fixed |
| BETA-PAUSE-004 | Invalid environment | Hold until env reset |
| BETA-PAUSE-005 | Evidence capture unavailable | Pause until restored |

**Threshold rule (BETA-GAP-001):** Pause-001 uses ≥3 P1 in 24h as interim rule.

---

## 10. Beta Continuation Criteria

Beta may continue when:

- No open P0
- Pause condition resolved
- Corrected build deployed and smoke PASS
- Affected testers notified
- Regression on failed task PASS

---

## 11. Beta Exit Criteria

| # | Criterion |
| - | --------- |
| 1 | All MANDATORY beta tasks executed with evidence |
| 2 | BETA-JOURNEY-CRIT-001 completed by ≥1 tester per profile group |
| 3 | No open P0 |
| 4 | Beta-blocking P1 resolved OR formally contained with Owner signoff |
| 5 | F001/F002/F003 tasks PASS |
| 6 | Pre-beta QA subset PASS (BETA-ENTRY-009) |
| 7 | Feedback archive complete (all BETA-FB triaged) |
| 8 | Retests complete for fixed P1 defects |
| 9 | Beta summary report complete |
| 10 | Security: no unresolved tenant findings |

**Beta complete ≠ launch approved.**

---

## 12. Beta Success Criteria (Qualitative)

| Dimension | Success signal |
| --------- | -------------- |
| Critical journey | BETA-JOURNEY-CRIT PASS with evidence |
| Workflow coverage | All MANDATORY WF tasks PASS |
| Integrity | Zero F001/F002/F003 failures in beta |
| AI trust | No P0/P1 AI boundary failures |
| Comprehension | Testers articulate bucket semantics (F003) |
| Defect closure | All beta P1 defects closed or accepted |

Numeric targets deferred to `BETA-GAP-003`.

---

## 13. Beta Execution Result Template (Fields)

```text
Beta Run ID:        BETA-RUN-YYYYMMDD-###
Date:
Environment:
Branch:
Commit SHA:
Tester:
Tester Profile:
Task ID:
Workflow:
Result:             PASS | FAIL | BLOCKED | DEFERRED
Evidence:           (path/URL)
Observed Behavior:
Expected Behavior:
Feedback IDs:       BETA-FB-###
Defect IDs:
Stop Condition Triggered?  YES | NO
Retest Required?     YES | NO
Notes:
```

Do not execute beta during planning.

---

## 14. Evidence Standard (Minimum per Task)

| Task type | Minimum evidence |
| --------- | ---------------- |
| Workflow E2E | Screen recording or screenshot series |
| Integrity (F001–3) | Screenshots showing enrollment IDs + counts |
| AI boundary | Context + output screenshot |
| Negative path | Screenshot of safe refusal |
| P0 incident | Full repro + logs (Computer 1) |

---

## 15. No-Scope-Expansion Audit

| Expansion | Added? |
| --------- | ------ |
| New product feature | NO |
| New AI capability | NO |
| New role | NO |
| New queue/ranking/risk engine | NO |
| New integration | NO |
| New autonomous action | NO |
