# ZyntixAI Phase 1 Business Model

## 1. Document Status

| Field | Value |
| ----- | ----- |
| Status | `AUTHORITATIVE — PHASE 1 BUSINESS MODEL CONTRACT` |
| Target market | `Course Sellers` |
| Track owner | `Laptop Product Completion Track` |
| Branch | `parallel/laptop-product-track-20260707` |
| Parent evidence | Launch Scope; Out-of-Scope OOS-14; Beta plan (`a511615`); Actor matrix |
| Companion artifacts | `PHASE-1-PRICING-STRATEGY.md`, `PHASE-1-PACKAGING-MATRIX.md`, `PHASE-1-UNIT-ECONOMICS-INPUT-REGISTER.md`, `PHASE-1-COMMERCIAL-READINESS-GATE.md` |

**This document does not authorize live pricing, billing, or paid launch.**

---

## 2. Core Commercial Principle

| State | Meaning |
| ----- | ------- |
| `BUSINESS MODEL PLANNED` | Commercial architecture documented |
| `PRICING HYPOTHESIS DEFINED` | Scenarios labeled; not approved |
| `PRICING APPROVED` | Owner signoff with cost evidence |
| `BILLING IMPLEMENTED` | Stripe/checkout exists (desktop) |
| `LIVE PRICING AUTHORIZED` | May publish prices |
| `COMMERCIAL LAUNCH AUTHORIZED` | Paid acquisition permitted |

**Planning PASS ≠ sell authorization.**

---

## 3. Target Customer Contract

| Actor | Uses product? | Buys product? | Receives value? | Evidence |
| ----- | ------------- | ------------- | --------------- | -------- |
| **Course Seller / Business Owner** | Yes | **Yes** (economic buyer) | Yes — O1, O6, O8 | Launch Scope §2; Actor matrix |
| **Sales Operator** | Yes | No (seat under buyer) | Yes — O2, conversion | Actor matrix |
| **Coach / Program Operator** | Yes | No (seat under buyer) | Yes — O4, O5, O7 | Actor matrix |
| End customer (learner) | No direct product use in Phase 1 | No | Indirect via seller service | Out of scope as buyer |

**Primary commercial target:** Small-to-mid course-selling business where the **Business Owner** is economic buyer and often wears multiple operational hats.

---

## 4. Problem-to-Value Mapping (Summary)

| Problem | Outcome | Commercial value hypothesis | Evidence status |
| ------- | ------- | --------------------------- | --------------- |
| P1-01, P1-11 | O3 | Reduce tool-hopping; time saved | SUPPORTED HYPOTHESIS |
| P1-02, P1-12 | O1 | Faster attention; risk visibility | SUPPORTED HYPOTHESIS |
| P1-03, P1-12 | O5 | Progress clarity | SUPPORTED HYPOTHESIS |
| P1-04, P1-05 | O9, O7 | Grounded AI prep; not autonomous support | SUPPORTED HYPOTHESIS |
| P1-06, P1-07 | O2, O10 | Follow-up discipline | SUPPORTED HYPOTHESIS |
| P1-08 | O6 | Morning prioritization | SUPPORTED HYPOTHESIS |
| P1-09, P1-10 | O7 | Conversation prep efficiency | SUPPORTED HYPOTHESIS |
| P1-13 | O10 | Onboarding visibility | SUPPORTED HYPOTHESIS |
| P1-14 | O3, O4 | Customer base overview | SUPPORTED HYPOTHESIS |
| P1-15 | O8 | Explainable next actions | SUPPORTED HYPOTHESIS |

Full P1→O mapping in Launch Scope §4–5. **No ROI numbers claimed.**

---

## 5. Monetizable Outcome Matrix

| Outcome | User value | Buyer value | Frequency | Monetizable? |
| ------- | ---------- | ----------- | --------- | ------------ |
| O1 Attention visibility | High | High | Daily | YES |
| O2 Follow-up priority | High | High | Daily | YES |
| O3 Centralized context | High | Medium | Daily | YES |
| O4 Program/enrollment clarity | Medium | High | Weekly | YES |
| O5 Progress visibility | Medium | High | Weekly | POSSIBLY |
| O6 Daily prioritization | High | High | Daily | YES |
| O7 Faster prep | Medium | Medium | Weekly | POSSIBLY |
| O8 Human-controlled NBA | Medium | Medium | Weekly | POSSIBLY |
| O9 Grounded AI | Medium | Medium | Variable | YES (bounded) |
| O10 Onboarding/follow-up | Medium | Medium | Weekly | POSSIBLY |

**Not monetizable:** Autonomous operation (OOS-08), unlimited AI (OOS-14), revenue guarantees.

---

## 6. Value Metric Analysis

| Value metric | Alignment | Predictability | Abuse risk | Cost align | UX risk | Verdict |
| ------------ | --------- | -------------- | ---------- | ---------- | ------- | ------- |
| Per business (workspace) | High | High | Low | Medium | Low | **PREFERRED** |
| Per active operator seat | High | Medium | Low | Medium | Low | VIABLE |
| Per customer record | Medium | Medium | Medium | Low | Medium | WEAK — confuses F001 |
| Per enrollment | High for delivery | Variable | Medium | Medium | Low | VIABLE (add-on metric) |
| Per AI request/token | Medium | Low | High | High | Medium | VIABLE (overage only) |
| Per program | Low | Low | Low | Low | Low | REJECTED as primary |

**Preferred primary metric:** **Per business workspace** with optional **operator seat** add-on. Enrollment counts used for **usage fairness**, not as customer= enrollment conflation (F001 preserved).

---

## 7. Commercially Unavailable (Must Not Sell)

Per Out-of-Scope register and implementation state:

- Autonomous business operator (OOS-08)
- Unlimited AI (OOS-14)
- Full CRM/BI/LMS/marketing suite (OOS-01–07, 11–13)
- Guaranteed ROI, churn prevention, revenue outcomes
- L5/L6/L7-dependent value before implementation proof
- Any `SPECIFIED_NOT_IMPLEMENTED` capability as live feature

---

## 8. Beta Pricing Decision

| Verdict | **NOT YET ASSESSABLE** for paid beta |
| ------- | ------------------------------------- |
| Supported now | **Free controlled beta** (when BETA EXECUTION AUTHORIZED) |
| Not supported | Paid beta, discounted paid beta, public pricing |
| Rationale | BETA-BLOCK-001–007 open; no runnable build; no WTP evidence |

---

## 9. Current Commercial Assessment

| Assessment | Verdict |
| ---------- | ------- |
| Business model architecture | ESTABLISHED (this artifact set) |
| Commercial model ready for paid launch | **NOT YET ASSESSABLE** |
| Live pricing | **NOT AUTHORIZED** |

---

## 10. Policy Boundaries (Gaps)

| Topic | Repository evidence | Status |
| ----- | ------------------- | ------ |
| Trial terms | None | Defined by decision rule in `PHASE-1-COMMERCIAL-READINESS-GATE.md` §7.1 (UNAPPROVED; activation-gated) |
| Refund policy | None | Defined by decision rule in `PHASE-1-COMMERCIAL-READINESS-GATE.md` §7.1 (legal-dependent) |
| Cancellation/downgrade | None | Defined by decision rule in `PHASE-1-COMMERCIAL-READINESS-GATE.md` §7.1 (legal + billing-dependent) |
| Tax treatment | None | Defined by decision rule in `PHASE-1-COMMERCIAL-READINESS-GATE.md` §7.1 (accounting-dependent) |
| Public free tier | None | Explicitly deferred (no public free tier required for Phase 1) — see §7.1 |
| Support model | None | Support scope defined; SLA/resourcing deferred — see §7.1 |

No legal conclusions invented.
