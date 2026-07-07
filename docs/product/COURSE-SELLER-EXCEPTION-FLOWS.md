# ZyntixAI Course Seller Exception Flows

## 1. Exception Principle

Failures, missing context, and ambiguous evidence are **first-class** product behavior.

The operating model must not assume happy paths only.

Recovery requires visible failure, human review where appropriate, and no silent data fabrication.

---

## 2. Lead Exceptions

| Exception | Operational impact | Recovery principle |
| --------- | ------------------ | ------------------ |
| Duplicate lead | Confusion, split context | Flag potential duplicate; human merges or links; preserve history |
| Missing contact information | Follow-up blocked | Surface incomplete context; task to obtain info |
| Unknown source | Attribution unclear | Record as unknown; do not invent source |
| Insufficient context | Qualification/follow-up weak | Mark context incomplete; request more before strong action |
| No response | Follow-up loop continues | Reschedule follow-up; do not auto-close as lost |
| Repeated no response | Lead may defer or lose | Human decides defer vs lost; evidence recorded |
| Conflicting notes | Trust in context reduced | Surface conflict; human reconciles |
| Lead returns after loss/deferment | Reactivation path | Re-enter follow-up or reactivation lifecycle |

**Traceability:** P1-06, P1-11 | S2, S10 | WF1

---

## 3. Conversion Exceptions

| Exception | Recovery principle |
| --------- | ------------------ |
| Decision delayed | Record decision pending; schedule follow-up |
| Payment decision unclear | Do not auto-convert; human confirms outcome |
| Offer declined | Record lost with reason if known |
| Conversion without handoff context | Block clean handoff; surface missing notes/history |

No billing implementation is defined at L2.

**Traceability:** P1-06 | S2, S3 | WF2

---

## 4. Customer Exceptions

| Exception | Recovery principle |
| --------- | ------------------ |
| Incomplete profile/context | Mark incomplete; surface in customer 360 |
| Duplicate customer identity | Flag; human resolves |
| Missing ownership | Assign or clarify owner |
| Conflicting operational context | Surface conflict; human reconciles |

**Traceability:** P1-01, P1-14 | S3 | WF2, WF3

---

## 5. Enrollment Exceptions

| Exception | Recovery principle |
| --------- | ------------------ |
| Customer without active enrollment | Valid state; surface for review |
| Enrollment with unclear program | Surface ambiguity; human associates program |
| Early exit | Record ended state; review attention if needed |
| Pause | Record paused; retain context; **resume to LCS-12** — not routed through LCS-20 |
| Status ambiguity | Default to needs review; no silent assumption |

**Traceability:** P1-14 | S4, S5 | WF3

---

## 6. Onboarding Exceptions

| Exception | Recovery principle |
| --------- | ------------------ |
| Onboarding never started | Surface not started; create attention candidate |
| Onboarding stalled | Surface incomplete; attention candidate |
| Required step missing | Block complete state; show missing step |
| Customer blocked | Surface blocked; human intervention |
| Business-side task incomplete | Surface owner task; do not blame customer |

**Traceability:** P1-13, P1-02 | S12, S8 | WF4

---

## 7. Progress Exceptions

| Exception | Recovery principle |
| --------- | ------------------ |
| No signals available | State = Unknown; do not fabricate |
| Stale signals | Flag staleness; recommend review |
| Conflicting signals | State = Needs Review |
| Progress unknown | Valid; human investigates |
| Niche metric unavailable | Do not require universal metric |

**Traceability:** P1-03, P1-12 | S6 | WF5

---

## 8. Attention Exceptions

| Exception | Recovery principle |
| --------- | ------------------ |
| Insufficient evidence | Do not surface as open attention; remain candidate or suppress |
| False positive | Human dismisses with record |
| Stale attention signal | Refresh or snooze; surface staleness |
| Duplicate attention items | Consolidate or flag duplicate |
| Human dismisses signal | Record dismissal; may re-open with new evidence |
| Issue returns after resolution | New attention cycle with new evidence |

**Traceability:** P1-02, P1-12 | S8 | WF6

---

## 9. AI Exceptions

| Exception | Required behavior |
| --------- | ----------------- |
| Missing context | Fail visibly; no draft or state "insufficient context" |
| Ambiguous context | Disclose uncertainty; narrow recommendation |
| Contradictory context | Do not resolve silently; surface for human |
| Low confidence | Disclose; human decides |
| Unsupported claim risk | Withhold or qualify; no fabricated facts |
| Draft cannot be grounded | No output presented as fact |

**Traceability:** P1-04, P1-05, P1-09 | S13 | Cross-lifecycle; WF8 conditional; WF10 for NBA |

---

## 10. Conversation Preparation Exceptions

| Exception | Recovery principle |
| --------- | ------------------ |
| No recent context | Operator readiness incomplete |
| Operator readiness incomplete | Surface gaps before conversation |
| Customer readiness incomplete | Show outstanding pre-call items |
| Requested preparation missing | Link to task or onboarding gap |
| Meeting purpose unclear | Prompt human to clarify purpose |

**Traceability:** P1-09, P1-10 | S11, S7 | WF8

---

## 11. Task Exceptions

| Exception | Recovery principle |
| --------- | ------------------ |
| Overdue | Surface in command center inputs |
| Duplicate | Flag; human consolidates |
| Conflicting owner | Surface; human assigns |
| Completed without outcome | Prompt for outcome note |
| Interrupted follow-up chain | Preserve continuity; suggest next task |

**Traceability:** P1-07 | S7 | WF9

---

## 12. Recovery Principles

1. **Visible failure** — Operators see what went wrong or what is missing.
2. **Recoverable state** — Unknown, incomplete, and blocked are valid; work can resume.
3. **Human review** — Consequential resolution remains human-controlled.
4. **No silent data fabrication** — Especially for AI and progress signals.
5. **No automatic destructive action** — No auto-delete, auto-close, or auto-send.

---

## 13. Exception Traceability

| Exception group | Problem IDs | Scope domains | Workflows |
| --------------- | ----------- | ------------- | --------- |
| Lead | P1-06, P1-11 | S2, S10 | WF1 |
| Conversion | P1-06 | S2, S3 | WF2 |
| Customer | P1-01, P1-14 | S3 | WF2, WF3 |
| Enrollment | P1-14 | S4, S5 | WF3 |
| Onboarding | P1-13, P1-02 | S12, S8 | WF4 |
| Progress | P1-03, P1-12 | S6, S8 | WF5 |
| Attention | P1-02, P1-12 | S8 | WF6 |
| AI | P1-04, P1-05 | S13 | Cross-lifecycle; WF8 conditional |
| Conversation prep | P1-09, P1-10 | S11 | WF8 |
| Task | P1-07 | S7 | WF9 |
