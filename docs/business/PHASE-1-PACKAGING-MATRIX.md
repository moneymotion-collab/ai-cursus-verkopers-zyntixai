# ZyntixAI Phase 1 Packaging Matrix

## 1. Purpose

Package logic before price points. Every capability classified for sellability.

---

## 2. Package Classes (Hypothetical — Not Activated)

| Package | Target | Status |
| ------- | ------ | ------ |
| **Free / Controlled Beta** | Invited validators | BETA_ONLY — when execution authorized |
| **Core** (hypothetical) | Solo–small course seller | UNVALIDATED HYPOTHESIS |
| **Pro** (hypothetical) | Multi-operator, higher volume | UNVALIDATED HYPOTHESIS |
| **Business** (hypothetical) | Multi-program, enrollment bands | UNVALIDATED HYPOTHESIS |

No Stripe products. No checkout. Names are planning placeholders.

---

## 3. Package Definition Template

Each package must specify: target customer, included outcomes, included S-domains, excluded capabilities, usage boundary, implementation dependency, support boundary, readiness state.

---

## 4. Feature Availability Classification

| Capability | Package candidate | Availability | Sellable now? | Evidence |
| ---------- | ----------------- | ------------ | ------------- | -------- |
| S1 Command Center shell | Core+ | SPECIFIED_NOT_IMPLEMENTED | **NO** | L5 deferred |
| S2 Lead/customer records | Core+ | IMPLEMENTATION_DEPENDENT | **NO** | Product spec |
| S3 Program context | Core+ | IMPLEMENTATION_DEPENDENT | **NO** | Product spec |
| S4 Enrollment lifecycle | Core+ | IMPLEMENTATION_DEPENDENT | **NO** | F001 semantics |
| S5 Attention queue | Core+ | SPECIFIED_NOT_IMPLEMENTED | **NO** | L6 deferred |
| S6 NBA suggestions | Pro+ | SPECIFIED_NOT_IMPLEMENTED | **NO** | L7 deferred |
| S7 Follow-up tasks | Core+ | IMPLEMENTATION_DEPENDENT | **NO** | Product spec |
| S8 Conversation prep (WF8) | Core+ | SPECIFIED_NOT_IMPLEMENTED | **NO** | DEMO-GAP-001 |
| S9 Grounded AI (bounded) | Core+ | IMPLEMENTATION_DEPENDENT | **NO** | S13, OOS-14 |
| S10 Context assembly | Core+ | IMPLEMENTATION_DEPENDENT | **NO** | Product spec |
| S11 Onboarding visibility | Core+ | IMPLEMENTATION_DEPENDENT | **NO** | Product spec |
| S12 Multi-tenant isolation | All paid | IMPLEMENTATION_DEPENDENT | **NO** | QA-GAP-002 |
| S13 Human-controlled AI | All | IMPLEMENTATION_DEPENDENT | **NO** | S13 contract |

**Rule:** `SPECIFIED_NOT_IMPLEMENTED` must not be sold as `LIVE FEATURE`.

---

## 5. L5 / L6 / L7 Commercial Impact

| Wave | Commercial value | Package impact | Current evidence | Sellable? |
| ---- | ---------------- | -------------- | ---------------- | --------- |
| **L5 Command Center** | Daily operational hub (O1, O6) | Core differentiator | Spec only; no build | **NO** |
| **L6 Attention** | Risk visibility (O1, O2) | Core value prop | Spec only; F002 defined | **NO** |
| **L7 NBA** | Next-best-action (O8) | Pro tier candidate | Spec only; human-controlled | **NO** |

Do not price L5/L6/L7 value before implementation proof.

---

## 6. Plan Boundary Matrix

| Capability | Free/Beta | Core (hyp.) | Pro (hyp.) | Business (hyp.) | Notes |
| ---------- | --------- | ----------- | ---------- | --------------- | ----- |
| Workspace access | 1 | 1 | 1 | 1–3 | Primary metric |
| Operator seats | 1–2 | 2 | 5 | 10+ | Seat add-on |
| S1–S4 operational core | When implemented | Yes | Yes | Yes | Launch scope |
| S5 Attention | When implemented | Yes | Yes | Yes | L6 |
| S6 NBA | When implemented | No | Yes | Yes | L7 |
| S8 conversation prep | When implemented | Limited | Standard | Higher allowance | AI-bound |
| AI prep requests/month | Low cap | Medium | High | Custom band | OOS-14 |
| Enrollment fair-use cap | Low | Medium | High | Negotiated | F001 preserved |
| Support | Best-effort | Email | Priority | Dedicated | BUSINESS-GAP-008 |
| SLA | None | None | TBD | TBD | INPUT MISSING |

All limits **HYPOTHETICAL** until cost model + beta usage.

---

## 7. Upgrade / Downgrade Logic (Contract Level)

| Transition | Rule | Implementation |
| ---------- | ---- | -------------- |
| Beta → paid Core | New subscription; beta data retention per policy | BILLING IMPLEMENTED required |
| Core → Pro | Add NBA + higher AI cap | Seat + feature flags |
| Pro → Core | NBA disabled; AI cap reduced | Grace period TBD — BUSINESS-GAP-005 |
| Downgrade at cancel | Access until period end | BUSINESS-GAP-005 |

No billing implementation in this phase.

---

## 8. QA-to-Pricing Integrity

| Capability | QA contract | QA executed? | Commercial status |
| ---------- | ----------- | ------------ | ----------------- |
| Enrollment semantics (F001) | QA-GAP-001 | No | Do not sell enrollment-based claims |
| RLS isolation | QA-GAP-002 | No | Do not sell multi-tenant security |
| WF8 demo path | DEMO-GAP-001 | Partial | Do not sell prep as proven |
| Runnable build | DEMO-GAP-002 | No | Nothing sellable |

---

## 9. Out-of-Scope in All Packages

OOS-01 through OOS-15 (see Out-of-Scope register). Not available at any tier.
