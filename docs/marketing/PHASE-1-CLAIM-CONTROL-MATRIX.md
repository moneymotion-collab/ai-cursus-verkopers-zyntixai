# ZyntixAI Phase 1 Marketing Claim Control Matrix

## 1. Purpose

Commercially truthful claim boundaries for all Marketing surfaces. Aligns with Business `PHASE-1-COMMERCIAL-READINESS-GATE.md` §4 and Demo planning discipline.

---

## 2. Claim Status Vocabulary

| Status | Meaning |
| ------ | ------- |
| `ALLOWED` | May state when disclosure rules met |
| `ALLOWED_WITH_DISCLOSURE` | Permitted only with explicit availability/scope disclosure |
| `IMPLEMENTATION_DEPENDENT` | Do not claim as live until implemented + verified |
| `EVIDENCE_REQUIRED` | Requires QA/demo/beta/runtime proof before use |
| `PROHIBITED` | Must not be used in any marketing surface |

---

## 3. Mandatory Claim Control Matrix

| Claim | Source | Capability status | Current proof | Claim status | Disclosure |
| ----- | ------ | ----------------- | ------------- | ------------ | ---------- |
| Operational command center | O1, O6, S1 | SPECIFIED_NOT_IMPLEMENTED | Spec only | IMPLEMENTATION_DEPENDENT | "Planned Phase 1 capability" |
| See who needs attention today | O1, S5 | SPECIFIED_NOT_IMPLEMENTED | Spec only | IMPLEMENTATION_DEPENDENT | When L6 ships |
| Centralized customer context | O3, S2–S4 | IMPLEMENTATION_DEPENDENT | No QA execution | EVIDENCE_REQUIRED | Post-QA |
| Enrollment ≠ customer conflation | F001 | Contract | Documented | ALLOWED_WITH_DISCLOSURE | Preserve semantics |
| Progress visibility | O5, S4 | IMPLEMENTATION_DEPENDENT | No build proof | EVIDENCE_REQUIRED | Human review required |
| Daily prioritization | O6, S1 | SPECIFIED_NOT_IMPLEMENTED | Spec only | IMPLEMENTATION_DEPENDENT | L5 dependent |
| Grounded AI conversation prep | O7, S8 | SPECIFIED_NOT_IMPLEMENTED | DEMO-GAP-001 | EVIDENCE_REQUIRED | Human review; bounded |
| Human-controlled NBA | O8, S6 | SPECIFIED_NOT_IMPLEMENTED | Spec only | IMPLEMENTATION_DEPENDENT | Not autonomous |
| Saves time / reduces tool-hopping | O3 | IMPLEMENTATION_DEPENDENT | No usage evidence | ALLOWED_WITH_DISCLOSURE | Hypothesis; no ROI % |
| Prevents churn | — | None | None | **PROHIBITED** | No outcome guarantee |
| Guaranteed revenue growth | — | None | None | **PROHIBITED** | — |
| Automatically fixes risk | — | None | None | **PROHIBITED** | — |
| AI runs your company | OOS-08 | OUT_OF_SCOPE | — | **PROHIBITED** | — |
| Fully autonomous operator | OOS-08 | OUT_OF_SCOPE | — | **PROHIBITED** | — |
| Unlimited AI | OOS-14 | OUT_OF_SCOPE | — | **PROHIBITED** | — |
| Everything included | OOS register | — | — | **PROHIBITED** | List exclusions |
| Secure multi-tenant isolation | S12 | IMPLEMENTATION_DEPENDENT | QA-GAP-002 | EVIDENCE_REQUIRED | Post-RLS proof |
| Beta is open / join now | Beta contract | NOT_EXECUTED | BETA-BLOCK open | **PROHIBITED** | — |
| Available now / launched | Launch contract | NOT_ASSESSABLE | LAUNCH-BLOCK open | **PROHIBITED** | — |
| Public pricing / buy now | Business contract | NOT_AUTHORIZED | LIVE PRICING NOT AUTHORIZED | **PROHIBITED** | — |
| All-in-one CRM/LMS/BI suite | OOS-01–07, 11–13 | OUT_OF_SCOPE | — | **PROHIBITED** | Operational scope only |

---

## 4. Prohibited Claim Baseline (Preserved)

- AI runs your company automatically
- Guaranteed revenue growth / ROI
- Prevents churn
- Automatically fixes risk
- Unlimited AI
- Everything included
- Fully autonomous operator
- Replaces your team
- Production-ready / serving customers (without launch proof)
- Live beta / customers testing now (without beta authorization)

---

## 5. Implementation Availability Matrix

| Capability | Availability | Current proof | Marketing status |
| ---------- | ------------ | ------------- | ---------------- |
| S1 Command Center | SPECIFIED_NOT_IMPLEMENTED | Spec | Do not claim live |
| S2 Leads | IMPLEMENTATION_DEPENDENT | Spec | Do not claim live |
| S3 Customer 360 | IMPLEMENTATION_DEPENDENT | Spec | Do not claim live |
| S4 Programs | IMPLEMENTATION_DEPENDENT | Spec | Do not claim live |
| S5 Enrollments | IMPLEMENTATION_DEPENDENT | Spec; F001 | Do not claim live |
| S6 Progress | IMPLEMENTATION_DEPENDENT | Spec | Do not claim live |
| S7 Tasks/follow-up | IMPLEMENTATION_DEPENDENT | Spec | Do not claim live |
| S8 Attention queue | SPECIFIED_NOT_IMPLEMENTED | L6 spec | Do not claim live |
| S9 NBA | SPECIFIED_NOT_IMPLEMENTED | L7 spec | Do not claim live |
| S10 Notes/context | IMPLEMENTATION_DEPENDENT | Spec | Do not claim live |
| S11 Conversation prep | IMPLEMENTATION_DEPENDENT | DEMO-GAP-001 | Do not claim proven |
| S12 Onboarding visibility | IMPLEMENTATION_DEPENDENT | Spec | Do not claim live |
| S13 Bounded AI | IMPLEMENTATION_DEPENDENT | S13 contract | Disclosure + limits required |
| Multi-tenant security | IMPLEMENTATION_DEPENDENT | QA-GAP-002 | Do not claim secure until proof |

**Rule:** `SPECIFIED_NOT_IMPLEMENTED` must never become `AVAILABLE NOW`.

---

## 6. Beta / Launch / Pricing Marketing Boundaries

| Domain | Preserved state | Marketing rule |
| ------ | --------------- | -------------- |
| Beta | BETA EXECUTION NOT AUTHORIZED | No open-beta, join-now, or tester claims |
| Launch | PHASE 1 PRODUCT READINESS NOT YET ASSESSABLE | No launch date, available-now, production-ready |
| Pricing | LIVE PRICING NOT AUTHORIZED | No price table, discount, paid CTA, checkout |

---

## 7. Proof Architecture Summary

| Claim class | Required proof | Current proof | Gap |
| ----------- | -------------- | ------------- | --- |
| Spec-level intent | Launch scope docs | AVAILABLE | — |
| Runnable feature | Build + QA | NOT EXECUTED | DEMO-GAP-002, QA |
| Security | RLS adversarial proof | PROOF_MISSING | QA-GAP-002 |
| User validation | Beta evidence | NOT_EXECUTED | BETA-BLOCK |
| Commercial | Pricing approval + billing | NOT AUTHORIZED | BUSINESS-BLOCK |

**Rule:** Specification ≠ runtime proof.
