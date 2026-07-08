# ZyntixAI Phase 1 Pricing Strategy

## 1. Purpose

Pricing hypotheses, scenarios, usage boundaries, and AI governance. **No approved price points.** Companion to `PHASE-1-BUSINESS-MODEL.md`.

---

## 2. Pricing Evidence Status Vocabulary

| Status | Meaning |
| ------ | ------- |
| `PROVEN` | Market/beta evidence supports |
| `SUPPORTED HYPOTHESIS` | Aligns with product value; not validated |
| `UNVALIDATED HYPOTHESIS` | Plausible; needs beta/WTP data |
| `INPUT MISSING` | Cannot assess |
| `HYPOTHETICAL` | Scenario modeling only — **NOT APPROVED** |

---

## 3. Launch Pricing Hypotheses (All UNVALIDATED)

No live prices. All figures are **HYPOTHETICAL** for modeling only.

### Scenario A — Low-friction adoption

| Field | Value |
| ----- | ----- |
| Target | Solo course seller |
| Assumption | 1 workspace, 1–2 operators, bounded AI |
| Price hypothesis | Low monthly SaaS (range TBD after cost inputs) |
| Evidence | UNVALIDATED HYPOTHESIS |
| Risk | Underpricing AI variable cost |

### Scenario B — Value-aligned core

| Field | Value |
| ----- | ----- |
| Target | Growing course business, 2–5 operators |
| Assumption | Full S1–S13 when implemented |
| Price hypothesis | Mid-tier monthly per workspace + seats |
| Evidence | UNVALIDATED HYPOTHESIS |
| Risk | Value not proven pre-beta |

### Scenario C — Higher-touch business

| Field | Value |
| ----- | ----- |
| Target | Multi-program seller, higher enrollment volume |
| Assumption | Enrollment fairness limits; priority support |
| Price hypothesis | Higher workspace fee + enrollment band |
| Evidence | UNVALIDATED HYPOTHESIS |
| Risk | Requires enrollment metering without F001 violation |

**Default label for all prices:** `HYPOTHETICAL` / `TEST CANDIDATE` — not `APPROVED`.

---

## 4. Free / Beta Offer Architecture

| Offer | Eligibility | Duration | Limits | Evidence goal | Exit path |
| ----- | ----------- | -------- | ------ | ------------- | --------- |
| **Controlled free beta** | Invited course sellers; single tenant | Wave-based; fixed end date | Full Phase 1 scope when implemented; bounded AI; no SLA | Workflow + value validation | Convert to paid launch offer or exit |
| Paid beta | — | — | — | — | **NOT SUPPORTED** until WTP + cost proof |
| Public free tier at launch | TBD | TBD | TBD | Acquisition | BUSINESS-GAP-007 |

**Purpose of free beta:** Evidence collection (beta plan), not revenue.

---

## 5. Usage Boundary Architecture

| Usage unit | User understandable? | Cost correlated? | Measurable? | Planning use |
| ---------- | ---------------------- | ---------------- | ------------- | ------------ |
| AI preparation requests / month | Yes | High | IMPLEMENTATION_DEPENDENT | Included allowance + overage |
| Active operator seats | Yes | Medium | Yes | Package tier |
| Active enrollments (cap) | Yes | Medium | Yes | Fair-use band; not customer=progress |
| Workspaces (businesses) | Yes | High | Yes | Primary billing unit |
| Storage / media | Medium | Medium | INPUT MISSING | Deferred |

**No technical enforcement in this phase** — contract only.

---

## 6. AI Usage Planning

Per OOS-14 and S13 boundary:

| Control | Planning requirement |
| ------- | -------------------- |
| Included allowance | Monthly AI prep requests per workspace (quantity TBD after cost model) |
| Fair-use | Soft warning before hard limit |
| Hard limit | Degrade to manual-only; no silent overage charge without disclosure |
| Overage | Optional paid add-on — requires BUSINESS-GAP-003 cost inputs |
| Abuse | Rate limit; no autonomous external sends |
| Degradation | UXS-10 style decline when context insufficient |

**Prohibited commercial claim:** "Unlimited AI" without cost proof + enforcement (OOS-14).

---

## 7. AI Cost Input Register (Required — No Values)

| Cost input | Required? | Available? | Confidence |
| ---------- | --------- | ---------- | ---------- |
| Model selection | Yes | INPUT MISSING | — |
| Input tokens per prep request | Yes | INPUT MISSING | — |
| Output tokens per prep request | Yes | INPUT MISSING | — |
| Requests per active workspace/month | Yes | INPUT MISSING | — |
| Context size (S3/S10 payload) | Yes | INPUT MISSING | — |
| Retry rate | Yes | INPUT MISSING | — |
| Embeddings (if used) | If applicable | INPUT MISSING | — |

**No fabricated token costs.**

---

## 8. Non-AI Cost Input Register (Required — No Values)

| Cost input | Required? | Available? |
| ---------- | --------- | ---------- |
| Hosting / compute | Yes | INPUT MISSING |
| Database (Supabase) | Yes | INPUT MISSING |
| Storage | Yes | INPUT MISSING |
| Email (if any) | If in scope | INPUT MISSING |
| Observability | Yes | LAUNCH-GAP-003 |
| Support allocation | Yes | INPUT MISSING |
| Payment processing (Stripe %) | At paid launch | INPUT MISSING |
| File/media | If in scope | INPUT MISSING |

---

## 9. Unit Economics Contract (Formulas Only)

```
Monthly revenue per workspace
  = subscription fee
  + seat add-ons
  + AI overage (if any)

Variable cost per workspace
  = AI variable cost (tokens × price per token)
  + infrastructure variable (DB, storage, bandwidth)
  + payment processing fee
  + support allocation (if modeled)

Contribution margin
  = revenue − variable cost

Contribution margin %
  = contribution margin / revenue
```

| Metric | Inputs required | Available? |
| ------ | --------------- | ---------- |
| Revenue per account | Price hypothesis | HYPOTHETICAL only |
| AI variable cost | AI cost register | INPUT MISSING |
| Infrastructure variable | Non-AI register | INPUT MISSING |
| Payment cost | Stripe fee % | INPUT MISSING |
| Contribution margin | All above | **NOT CALCULABLE** |

**Do not claim positive margin without evidence.**

---

## 10. Gross Margin Readiness Gate

| Scenario | Required inputs | Status |
| -------- | --------------- | ------ |
| Baseline usage | AI + infra at median assumptions | INPUT MISSING |
| High-usage stress | 90th percentile AI requests | INPUT MISSING |
| Abuse stress | Rate-limit bypass attempts | INPUT MISSING |

**Gate:** Contribution margin must be positive in baseline AND acceptable in stress — **NOT YET ASSESSABLE**.

---

## 11. Beta-to-Pricing Evidence Handoff

| Beta evidence | Pricing decision enabled |
| ------------- | ------------------------ |
| Workflow completion rates | Package scope validation |
| Recurring daily usage | Value metric confirmation |
| AI usage patterns | Allowance sizing |
| Support burden | Support cost allocation |
| WTP feedback (qualitative) | Scenario A/B/C ranking |
| Feature usage by S-domain | Packaging matrix refinement |

Requires beta completion — not available.

---

## 12. Launch-to-Pricing Gate

| Pricing activation requirement | Launch gate | Current |
| ------------------------------ | ----------- | ------- |
| Product implemented | LAUNCH-BLOCK-001, 007 | OPEN |
| QA executed | LAUNCH-BLOCK-002 | OPEN |
| Security proof | LAUNCH-BLOCK-004 | OPEN |
| Runnable build | LAUNCH-BLOCK-003, 006 | OPEN |

**Live pricing blocked while launch blockers open.**

---

## 13. Pricing Claim Integrity

| Claim | Allowed? | Disclosure |
| ----- | -------- | ---------- |
| "Unlimited AI" | **NO** | OOS-14 |
| "Unlimited customers" | **NO** without cost model | Enrollment/customer distinction |
| "Everything included" | **NO** | OOS items excluded |
| "Prevents churn" | **NO** | No outcome guarantee |
| "AI runs your business" | **NO** | OOS-08, S1 boundary |
| "Grounded AI preparation" | Yes when S13 implemented | Human review required |
| "Operational command center" | Yes when S1 implemented | Not autonomous |

Full matrix in `PHASE-1-COMMERCIAL-READINESS-GATE.md`.
