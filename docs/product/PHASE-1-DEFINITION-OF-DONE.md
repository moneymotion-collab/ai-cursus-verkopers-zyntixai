# ZyntixAI Phase 1 Definition of Done

## 1. Done Is Not

Phase 1 is **not** done merely because:

- a route exists
- UI renders
- a database table exists
- a migration applies
- a happy path works once
- AI returns text
- build passes
- desktop works
- a demo looks good

Done means the approved product scope is behaviorally complete, verifiable, and launch-safe.

---

## 2. Capability Completion Standard

For each in-scope capability domain (`S1`–`S13`), Phase 1 requires:

| Criterion | Required |
| --------- | -------- |
| Intended user problem is traceable | Yes — maps to `P1-xx` |
| Primary user flow works | Yes |
| Important exception states defined | Yes |
| Acceptance criteria exist | Yes |
| Persistence behavior defined | Yes |
| Permission behavior defined | Yes |
| Loading state defined | Yes |
| Empty state defined | Yes |
| Error state defined | Yes |
| Mobile behavior defined | Yes |
| QA result recorded | Yes — pass/fail with evidence |

---

## 3. Workflow Completion Standard

Each required workflow (`WF1`–`WF10`) must have:

| Criterion | Required |
| --------- | -------- |
| Valid trigger | Documented and testable |
| Valid start state | Documented |
| Successful main path | Demonstrated end-to-end |
| Meaningful end state | Observable outcome |
| Failure behavior | Defined and tested |
| Recovery behavior | Defined where appropriate |
| Correct context | Required context present in flow |
| No unauthorized cross-tenant behavior | Verified |
| Refresh/re-entry behavior | Considered and tested |

---

## 4. Security Completion Standard

At product-gate level, Phase 1 requires:

| Criterion | Required at launch |
| --------- | ------------------ |
| No known P0 security blocker | Yes — `0 open` |
| No known P1 security blocker | Yes — `0 open` |
| Tenant isolation verified | Yes |
| Protected operations permission-aware | Yes |
| Auth failures fail safely | Yes |
| Cross-tenant access attempts rejected | Yes |

Technical evidence and adversarial verification remain under **Computer 1** authority.

---

## 5. AI Completion Standard

For any Phase 1 AI capability (`S13` and AI-assisted domains), require:

| Criterion | Required |
| --------- | -------- |
| Context source identified | Yes |
| Missing context behavior defined | Yes |
| No fabricated customer facts | Yes |
| Uncertainty represented where needed | Yes |
| Recommendation explainable | Yes |
| Human approval boundary explicit | Yes |
| Consequential action not silently executed | Yes |
| Failure behavior visible | Yes |

### Semantic problem coverage (P1-04, P1-05, P1-09)

| Problem | Required completion evidence |
| ------- | ---------------------------- |
| P1-04 | Owner can prepare grounded answers to recurring questions using `S13` with context from `S3`/`S10`; notes alone are insufficient; no autonomous support agent |
| P1-05 | Personalized response drafts are traceable to customer-specific context; human reviews before consequential action; no quality guarantee claimed |
| P1-09 | Operator preparation (`S11`) and customer readiness visibility (`S7`, `S12` where relevant) are distinguishable; scheduling/reminder platform not required |

---

## 6. UX Completion Standard

| Criterion | Required |
| --------- | -------- |
| Desktop usable | Yes — core flows |
| Mobile usable | Yes — core review flows |
| Loading states | Yes |
| Empty states | Yes |
| Error states | Yes |
| Partial data handling | Yes |
| Permission denied handling | Yes — where relevant |
| Clear primary action | Yes |
| No critical dead ends | Yes |

---

## 7. Reliability Completion Standard

Phase 1 must consider:

| Scenario | Required handling |
| -------- | ----------------- |
| Page refresh | State recovers meaningfully |
| Logout/login | Session behavior is safe |
| Retry | User can recover from transient failure |
| Stale data | User can understand or refresh |
| Failed request | Visible error; no silent failure |
| Duplicate action | Does not corrupt state |
| Interrupted flow | User can resume or restart safely |

---

## 8. QA Completion Standard

Phase 1 requires:

| QA type | Required |
| ------- | -------- |
| Manual QA | Yes — core flows |
| Regression QA | Yes — after material changes |
| Adversarial checks | Yes — where relevant (tenant, auth, AI grounding) |
| Workflow QA | Yes — `WF1`–`WF10` |
| Negative-path QA | Yes — failure and empty states |
| Evidence-based pass/fail | Yes — recorded results |

Exact future test counts are not defined in this document.

---

## 9. Launch Blocker Standard

### P0 — Catastrophic launch blocker

Examples: security breach risk, data isolation failure, destructive unrecoverable behavior.

**Required at launch:** `0 open`

### P1 — Critical launch blocker

Examples: core workflow broken, high-risk security/reliability failure.

**Required at launch:** `0 open`

### P2 — Material defect

Must be reviewed and explicitly accepted or fixed before launch signoff.

### P3 — Minor issue / hygiene

May be deferred with record.

---

## 10. Final Product Gate

Phase 1 product status can only become **`GO`** when:

- scope defined in `PHASE-1-LAUNCH-SCOPE.md` is satisfied
- required workflows pass completion criteria
- P0 = 0
- P1 = 0
- security gate passes
- core QA passes
- accepted P2 issues are documented
- launch signoff exists

Otherwise status must be:

- **`CONDITIONAL GO`** — blockers documented with explicit acceptance criteria, or
- **`NO-GO`** — launch must not proceed
