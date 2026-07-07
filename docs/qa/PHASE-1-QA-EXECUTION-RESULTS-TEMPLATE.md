# ZyntixAI Phase 1 QA Execution Results Template

## 1. Purpose

Reusable record for manual, hybrid, or future automated QA execution against `PHASE-1-QA-ACCEPTANCE-CONTRACT.md`.

This template does not authorize test execution during contract authoring. It defines how results MUST be recorded when QA is performed.

---

## 2. Run Header

| Field | Value |
| ----- | ----- |
| QA Run ID | `QA-RUN-YYYYMMDD-###` |
| Date | |
| Environment | `local` / `staging` / `production-like` |
| Branch | `parallel/laptop-product-track-20260707` or integration branch |
| Commit SHA | |
| Tester | |
| Contract version | Git SHA of `docs/qa/**` at run time |
| Implementation wave | `pre-L5` / `L5` / `L6` / `L7` / `post-integration` |

---

## 3. Per-Case Result Row

Copy one block per case executed.

```text
Case ID:
Result: PASS | FAIL | BLOCKED | NOT RUN | DEFERRED
Evidence: (screenshot path / recording / log / DB record / API response)
Observed Behavior:
Expected Behavior: (from contract)
Severity if Failed: P0 | P1 | P2 | P3 | N/A
Launch Impact: LAUNCH_BLOCKER | BETA_BLOCKER | NON_BLOCKING | DEFERRED
Bug ID:
Retest Required: YES | NO
Retest Result:
Notes:
Implementation Dependency: (if BLOCKED — e.g. DEPENDS ON L5)
```

---

## 4. Run Summary

| Metric | Count |
| ------ | ----- |
| Cases executed | |
| PASS | |
| FAIL | |
| BLOCKED | |
| NOT RUN | |
| DEFERRED | |
| P0 open | |
| P1 open | |
| Launch blockers open | |

---

## 5. Signoff Block

| Role | Name | Date | Verdict |
| ---- | ---- | ---- | ------- |
| QA executor | | | |
| Product owner | | | CONDITIONAL GO / NO-GO |

**Signoff rule:** Phase 1 product gate (`PHASE-1-DEFINITION-OF-DONE.md` §10) requires P0 = 0, P1 = 0, and core QA pass with evidence before `GO`.
