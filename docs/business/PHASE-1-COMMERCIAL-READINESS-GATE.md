# ZyntixAI Phase 1 Commercial Readiness Gate

## 1. Purpose

Deterministic gates before live pricing and commercial launch. **Planning artifact only.**

---

## 2. Planning Status Vocabulary

| Status | Meaning |
| ------ | ------- |
| `BUSINESS MODEL ESTABLISHED` | This contract set complete |
| `PRICING STRATEGY ESTABLISHED` | Hypotheses documented |
| `BUSINESS PLANNING CONDITIONALLY OPEN` | Gaps remain; architecture valid |
| `BUSINESS PLANNING FAILED` | Cannot proceed |

---

## 2.1 Severity Source of Truth (P0–P3)

This contract uses the repository-defined P0–P3 model from:

- `docs/beta/PHASE-1-BETA-FEEDBACK-TRIAGE.md` §4 (explicit examples)

| Level | Repository examples (not exhaustive) |
| ----- | ------------------------------------ |
| **P0** | Cross-tenant exposure; autonomous AI action; data corruption |
| **P1** | Core workflow blocked; F001/F002/F003 regression |
| **P2** | Confusing UX; non-blocking data issue; performance degradation |
| **P3** | Cosmetic; minor copy |

**Rule:** Commercial blocking impact must be represented separately and must not be encoded by inflating P-severity.

---

## 3. Commercial Identifier Registry

| Identifier | Exact name | Source | Commercial relevance | Status |
| ---------- | ---------- | ------ | -------------------- | ------ |
| P1-01–P1-15 | Phase 1 problems | Launch Scope | Value mapping | VERIFIED |
| O1–O10 | Phase 1 outcomes | Launch Scope | Monetization targets | VERIFIED |
| S1–S13 | Capability domains | Launch Scope | Packaging units | VERIFIED |
| WF1–WF10 | Workflows | Operating blueprint | Demo/beta paths | VERIFIED |
| F001 | Customer ≠ Enrollment | Product integrity | Value metric constraint | VERIFIED |
| F002 | Attention lifecycle | Product integrity | L6 commercial claims | VERIFIED |
| F003 | No hidden cross-domain ranking | Product integrity | Claim control | VERIFIED |
| OOS-14 | Unlimited AI deferred | Out-of-Scope | AI pricing boundary | VERIFIED |
| OOS-08 | Autonomous operator | Out-of-Scope | Prohibited claims | VERIFIED |
| QA-GAP-001 | Program count semantics | QA contract | Enrollment packaging | OPEN |
| QA-GAP-002 | Desktop RLS proof | QA contract | Multi-tenant sellability | OPEN |
| DEMO-GAP-001 | WF8 partial | Demo contract | S8 sellability | OPEN |
| DEMO-GAP-002 | No runnable build | Demo contract | All commercial offers | OPEN |
| LAUNCH-GAP-001–003 | Env, rollback, observability | Launch contract | Paid launch | OPEN |
| LAUNCH-BLOCK-001–007 | Launch blockers | Launch gate | Pricing activation | OPEN |
| BETA-GAP-001–003 | Cohort, retention, targets | Beta contract | Beta economics | OPEN |
| BETA-BLOCK-001–007 | Beta blockers | Beta gate | Beta offer | OPEN |
| BUSINESS-BLOCK-001–010 | See §6 | This artifact | Commercial planning | OPEN |
 | BUSINESS-GAP-004–008 | See §7 | This artifact | Planning inputs | CLOSED (R2) |

---

## 4. Commercial Claim Control Matrix

| Commercial claim | Source | Evidence status | Allowed? | Disclosure |
| ---------------- | ------ | --------------- | -------- | ---------- |
| Operational command center | O1, O6, S1 | SPECIFIED_NOT_IMPLEMENTED | **NO** (live) | When L5 ships |
| See who needs attention today | O1, S5 | SPECIFIED_NOT_IMPLEMENTED | **NO** (live) | When L6 ships |
| Human-controlled next actions | O8, S6 | SPECIFIED_NOT_IMPLEMENTED | **NO** (live) | When L7 ships |
| Grounded AI conversation prep | O7, S8 | DEMO-GAP-001 | **NO** (live) | Partial demo only |
| Centralized customer context | O3, S2–S4 | IMPLEMENTATION_DEPENDENT | **NO** (live) | Post-QA |
| Bounded AI assistance | S13, OOS-14 | IMPLEMENTATION_DEPENDENT | **NO** (live) | Limits required |
| AI runs your whole company | — | OOS-08 | **NO** | Prohibited |
| Prevents churn / guarantees revenue | — | None | **NO** | Prohibited |
| Automatically fixes risk | — | None | **NO** | Prohibited |
| Replaces your team | — | OOS-08 | **NO** | Prohibited |
| Fully autonomous operator | — | OOS-08 | **NO** | Prohibited |
| Guaranteed ROI | — | None | **NO** | Prohibited |
| Unlimited AI | — | OOS-14 | **NO** | Prohibited |
| Unlimited customers | — | Cost model missing | **NO** | Prohibited |
| Everything included | — | OOS register | **NO** | List exclusions |
| Secure multi-tenant isolation | S12 | QA-GAP-002 | **NO** (live) | Post-RLS proof |

---

## 5. Pricing Readiness Gate

| Gate | Criterion | Status |
| ---- | --------- | ------ |
| PRG-01 | Target buyer defined | **PASS** |
| PRG-02 | Value metric selected | **PASS** (workspace primary) |
| PRG-03 | Package boundaries defined | **PASS** (hypothetical tiers) |
| PRG-04 | Feature availability verified | **PASS** (all NOT sellable now) |
| PRG-05 | Cost inputs available | **FAIL** — INPUT MISSING |
| PRG-06 | Unit economics assessed | **NOT YET ASSESSABLE** |
| PRG-07 | Claim matrix approved | **PASS** (controls defined) |
| PRG-08 | Beta evidence sufficient | **FAIL** — beta not executed |
| PRG-09 | Billing implementation | **FAIL** — desktop not implemented |
| PRG-10 | Launch readiness compatible | **FAIL** — LAUNCH-BLOCK open |

**Overall pricing readiness:** **NOT YET ASSESSABLE** for approval; **FAIL** for activation.

---

## 6. Commercial Blocker Register

| Blocker ID | Root cause | Evidence state | Severity | Commercial impact | Canonical owner | Status |
| ---------- | ---------- | -------------- | -------- | ----------------- | --------------- | ------ |
| BUSINESS-BLOCK-001 | Runnable build/runtime evidence not available (Phase 1 not yet deployable) | `PROOF_MISSING` / `IMPLEMENTATION_DEPENDENT` | P1 | `BLOCKS_COMMERCIAL_ASSESSMENT`, `BLOCKS_PAID_BETA`, `BLOCKS_LIVE_PRICING` | Desktop | OPEN |
| BUSINESS-BLOCK-002 | QA acceptance evidence not executed | `NOT_EXECUTED` | P2 | `BLOCKS_CLAIM_APPROVAL`, `BLOCKS_LIVE_PRICING` | Desktop/QA | OPEN |
| BUSINESS-BLOCK-003 | Tenant-isolation adversarial proof missing (no confirmed exposure recorded) | `PROOF_MISSING` | P1 | `BLOCKS_COMMERCIAL_ASSESSMENT`, `BLOCKS_LIVE_PRICING`, `BLOCKS_SECURITY_CLAIMS` | Desktop | OPEN |
| BUSINESS-BLOCK-004 | AI cost inputs missing (tokens + vendor pricing + workload) | `PROOF_MISSING` | P2 | `BLOCKS_UNIT_ECONOMICS_APPROVAL`, `BLOCKS_LIVE_PRICING` | Product/Business | OPEN |
| BUSINESS-BLOCK-005 | Non-AI variable cost inputs missing (infra + support allocation) | `PROOF_MISSING` | P2 | `BLOCKS_UNIT_ECONOMICS_APPROVAL`, `BLOCKS_LIVE_PRICING` | Ops/Business | OPEN |
| BUSINESS-BLOCK-006 | Willingness-to-pay evidence absent | `PROOF_MISSING` | P2 | `BLOCKS_PRICE_APPROVAL` | Business | OPEN |
| BUSINESS-BLOCK-007 | Billing not implemented (Stripe, entitlement enforcement) | `IMPLEMENTATION_DEPENDENT` | P2 | `BLOCKS_LIVE_PRICING` | Desktop | OPEN |
| BUSINESS-BLOCK-008 | Launch readiness blockers unresolved | `PROOF_MISSING` / `NOT_EXECUTED` | P2 | `BLOCKS_PAID_BETA`, `BLOCKS_LIVE_PRICING` | Cross-team | OPEN |
| BUSINESS-BLOCK-009 | Beta execution not authorized / not executed | `NOT_EXECUTED` | P2 | `DEFERRED_DEPENDENCY`, `BLOCKS_BETA_EVIDENCE`, `BLOCKS_PRICE_APPROVAL` | Laptop/Desktop | OPEN |
| BUSINESS-BLOCK-010 | Legal/tax policy inputs not yet available | `PROOF_MISSING` | P2 | `BLOCKS_LIVE_PRICING` | Business/Legal/Finance | OPEN |

---

## 7. Business Planning Gap Register

| Gap ID | Planning-contract defect (missing/ambiguous) | Severity | Commercial impact | Canonical owner | Status |
| ------ | ------------------------------------------ | -------- | ----------------- | --------------- | ------ |
| BUSINESS-GAP-004 | Trial policy contract absent (length, eligibility, conversion rule) | P2 | `BLOCKS_PRICE_APPROVAL` | Business | **CLOSED (R2)** |
| BUSINESS-GAP-005 | Refund/cancel/downgrade contract absent (timing + downgrade behavior) | P2 | `BLOCKS_LIVE_PRICING` | Business/Legal | **CLOSED (R2)** |
| BUSINESS-GAP-006 | Tax handling decision absent (jurisdiction approach, disclosures) | P2 | `BLOCKS_LIVE_PRICING` | Finance/Legal | **CLOSED (R2)** |
| BUSINESS-GAP-007 | Public free tier policy undecided (existence + purpose) | P3 | `NON_BLOCKING` | Business | **CLOSED (R2)** |
| BUSINESS-GAP-008 | Support model definition missing (included channels + boundaries by package) | P2 | `BLOCKS_PRICE_APPROVAL` | Ops/Business | **CLOSED (R2)** |

### R2 Gap Closure (Decision rules; no invented durations/rights/tax treatment)

The following gaps are closed as **planning-contract defects** by adding deterministic decision rules and activation gates, without inventing the underlying future decisions or legal/tax facts.

| Gap ID | R2 decision | Post-state | Remaining dependency |
| ------ | ----------- | ---------- | -------------------- |
| BUSINESS-GAP-004 | CLOSE BY DECISION RULE | CLOSED | BUSINESS-BLOCK-010 (legal/tax) + BUSINESS-BLOCK-004/005 (unit economics) + BUSINESS-BLOCK-007 (billing) |
| BUSINESS-GAP-005 | CLOSE BY DECISION RULE | CLOSED | BUSINESS-BLOCK-010 (legal validation + billing behavior) |
| BUSINESS-GAP-006 | CLOSE BY DECISION RULE | CLOSED | BUSINESS-BLOCK-010 (accounting/tax configuration) |
| BUSINESS-GAP-007 | CLOSE BY CONTRACT DECISION | CLOSED | None (explicitly deferred; not required for Phase 1) |
| BUSINESS-GAP-008 | CLOSE BY CONTRACT DECISION | CLOSED | BUSINESS-BLOCK-005 (support cost inputs) |

---

## 7.1 Trial / Cancellation / Tax / Free Tier / Support — Decision Rules (No invented values)

### Trial policy (BUSINESS-GAP-004) — CLOSED BY DECISION RULE

- **Status:** Trial duration/structure is **UNAPPROVED**.
- **Rule:** No trial terms may be published or implemented until:
  - BUSINESS-BLOCK-007 (billing) is closed, and
  - BUSINESS-BLOCK-004/005 (unit economics inputs) support a bounded trial model, and
  - required legal/tax validation for displayed terms is available (BUSINESS-BLOCK-010).
- **Owner:** Business Owner (business decision) + Desktop (billing implementation).
- **Prohibited:** inventing a number of days, “credit card required”, auto-renewal behaviors, or any public claim of trial terms without approval.

### Cancellation / refund / downgrade (BUSINESS-GAP-005) — CLOSED BY DECISION RULE

- **Status:** Legal refund rights and jurisdictional obligations are **UNKNOWN** in this repository and must not be invented.
- **Rule:** Before live pricing activation:
  - decision owner must define *product policy behavior* (access after cancel, downgrade effects, data retention behavior) and
  - obtain legal review for externally displayed terms (BUSINESS-BLOCK-010) and
  - implement billing-state enforcement (BUSINESS-BLOCK-007).
- **Owner:** Business/Legal for terms; Desktop for enforcement.
- **Prohibited:** promising refunds, cancellation rights, or downgrade behavior beyond what is legally validated and technically implemented.

### Tax handling (BUSINESS-GAP-006) — CLOSED BY DECISION RULE

- **Status:** Tax/VAT/BTW treatment is **UNDETERMINED**.
- **Rule:** Live pricing must remain blocked until:
  - target jurisdictions are defined and
  - accounting/tax configuration and disclosures are documented with authoritative review (BUSINESS-BLOCK-010).
- **Prohibited:** stating VAT/BTW rates, reverse-charge rules, B2B/B2C treatment, OSS, or “tax included/excluded” claims without evidence.

### Public free tier (BUSINESS-GAP-007) — CLOSED BY CONTRACT DECISION

- **Decision:** **No public free tier is required for Phase 1 planning.** The only free access defined here is **controlled free beta** (separately governed by the Beta contract and authorization state).
- **Rule:** Marketing must not claim or assume a public free tier unless a future business decision explicitly introduces it.

### Support model (BUSINESS-GAP-008) — CLOSED BY CONTRACT DECISION

- **Decision:** Define **support scope and boundaries** now; defer response times/SLA and staffing to Ops inputs (BUSINESS-BLOCK-005).
- **Scope (allowed):** product usage questions, bug reporting, access issues triage, security incident escalation routing.
- **Out of scope:** guaranteed response times, 24/7 coverage, dedicated AM, bespoke implementation services (unless later approved).
- **Rule:** No SLA/support claims may be marketed until Ops confirms resourcing and billing terms exist.

### Reclassified (R1)

The following items were previously treated as BUSINESS planning gaps but are external evidence/implementation dependencies and are therefore canonical BUSINESS-BLOCKs:

| Prior item | R1 decision | Canonical representation |
| ---------- | ----------- | ------------------------ |
| BUSINESS-GAP-001 (AI token cost model) | RECLASSIFY AS BLOCK | BUSINESS-BLOCK-004 (AI cost inputs missing) |
| BUSINESS-GAP-002 (WTP evidence) | RECLASSIFY AS BLOCK | BUSINESS-BLOCK-006 (WTP evidence absent) |
| BUSINESS-GAP-003 (Beta AI usage distribution) | RECLASSIFY AS BLOCK | BUSINESS-BLOCK-009 (beta evidence deferred) |

---

## 8. Blocker Deduplication

| Existing blocker | Business impact | Reused or new? | Dedup rule |
| ---------------- | --------------- | -------------- | ---------- |
| DEMO-GAP-002 (no build) | BUSINESS-BLOCK-001 | **REUSED** | Same root — no triple count |
| LAUNCH-BLOCK-001–007 | BUSINESS-BLOCK-008 | **REUSED** | Launch gates pricing |
| BETA-BLOCK-001–007 | BUSINESS-BLOCK-009 | **REUSED** | Beta gates evidence collection (usage + WTP) |
| QA-GAP-002 | BUSINESS-BLOCK-003 | **REUSED** | Security blocks sell |
| OOS-14 / no cost data | BUSINESS-BLOCK-004 | **REUSED** | Single canonical cost-input blocker |

---

## 9. Commercial Readiness Matrix

| Domain | Required evidence | Current evidence | Status | Commercial blocker? |
| ------ | ----------------- | ---------------- | ------ | ------------------- |
| Buyer | Actor matrix, launch scope | Documented | PASS | No |
| Value | O1–O10, P1 map | Documented | PASS | No |
| Packaging | This matrix | Hypothetical tiers | PASS (planning) | No |
| Price hypothesis | Pricing strategy | HYPOTHETICAL only | PASS (planning) | No |
| Usage / AI limits | OOS-14, S13 | Planned not enforced | IMPLEMENTATION_DEPENDENT | Yes |
| AI costs | Unit economics register | INPUT MISSING | FAIL | BUSINESS-BLOCK-004 |
| Infra costs | Unit economics register | INPUT MISSING | FAIL | BUSINESS-BLOCK-005 |
| Unit economics | Formulas only | Not calculable | NOT YET ASSESSABLE | Yes |
| Claims | This matrix | Controlled | PASS | No |
| Beta evidence | Beta plan | Not executed | FAIL | BUSINESS-BLOCK-009 |
| Launch readiness | Launch gate | OPEN | FAIL | BUSINESS-BLOCK-008 |
| Billing | Shared path policy | Not implemented | FAIL | BUSINESS-BLOCK-007 |

---

## 10. Current Verdicts

| Decision | Verdict |
| -------- | ------- |
| Commercial model ready for paid launch | **PHASE 1 COMMERCIAL MODEL NOT YET ASSESSABLE** |
| Live pricing activation | **LIVE PRICING NOT AUTHORIZED** |
| Business planning closure | **BUSINESS & PRICING PLANNING CONTRACT CONDITIONALLY OPEN** |
| Beta execution | **NOT AUTHORIZED** (unchanged) |
| Launch authorization | **NOT AUTHORIZED** (unchanged) |

---

## 11. Handoff to Future Work

| Next phase | Depends on | Owner |
| ---------- | ---------- | ----- |
| Billing implementation | PRICING APPROVED + packaging frozen | Desktop |
| Stripe products/prices | BUSINESS-BLOCK-004–007 closed | Desktop |
| Beta execution | BETA gate PASS | Laptop + Desktop |
| Marketing planning | Business contract CLOSED (no open BUSINESS-GAP) | Laptop `docs/marketing/**` |
| Live pricing | All PRG gates PASS + owner signoff | Business + Desktop |

**This phase does not activate pricing or modify Stripe.**

---

## 12. No-Scope-Expansion Audit

| Potential expansion | Added? | Evidence |
| ------------------- | ------ | -------- |
| New product feature | NO | Docs only |
| New AI capability | NO | OOS-14 preserved |
| New role | NO | Actor matrix unchanged |
| New queue/ranking | NO | F002/F003 preserved |
| New integration | NO | — |
| New DB contract | NO | No migrations |
| Autonomous action | NO | OOS-08 preserved |
| New commercial promise | NO | Claim matrix restrictive |

---

## 13. Physical Desktop Verification

**PHYSICAL DESKTOP NOT DIRECTLY VERIFIED** — billing ownership inferred from governance docs only.
