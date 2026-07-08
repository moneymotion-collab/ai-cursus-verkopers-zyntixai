# ZyntixAI Phase 1 Unit Economics Input Register

## 1. Purpose

Required cost inputs before pricing approval. **No fabricated values.** Formulas only.

---

## 2. Input Status Vocabulary

| Status | Meaning |
| ------ | ------- |
| `AVAILABLE` | Evidence in repository or vendor quote |
| `INPUT MISSING` | Required but not present |
| `NOT APPLICABLE` | Pre-revenue / pre-implementation |

---

## 3. AI Cost Inputs

| ID | Cost input | Required? | Available? | Source | Confidence |
| -- | ---------- | --------- | ---------- | ------ | ---------- |
| AI-IN-001 | LLM model(s) for S8/S9/S13 | Yes | INPUT MISSING | — | — |
| AI-IN-002 | Avg input tokens per prep request | Yes | INPUT MISSING | — | — |
| AI-IN-003 | Avg output tokens per prep request | Yes | INPUT MISSING | — | — |
| AI-IN-004 | Requests per workspace/month (P50) | Yes | INPUT MISSING | Beta required | — |
| AI-IN-005 | Requests per workspace/month (P90) | Yes | INPUT MISSING | Beta required | — |
| AI-IN-006 | Context payload size (S10) | Yes | INPUT MISSING | — | — |
| AI-IN-007 | Retry / failure rate | Yes | INPUT MISSING | — | — |
| AI-IN-008 | Provider price per 1M tokens | Yes | INPUT MISSING | Vendor | — |
| AI-IN-009 | Embeddings cost (if used) | If applicable | INPUT MISSING | — | — |

---

## 4. Non-AI Cost Inputs

| ID | Cost input | Required? | Available? | Source | Confidence |
| -- | ---------- | --------- | ---------- | ------ | ---------- |
| INF-IN-001 | Hosting / edge compute | Yes | INPUT MISSING | — | — |
| INF-IN-002 | Database (Supabase tier) | Yes | INPUT MISSING | — | — |
| INF-IN-003 | Storage per workspace | Yes | INPUT MISSING | — | — |
| INF-IN-004 | Bandwidth | Yes | INPUT MISSING | — | — |
| INF-IN-005 | Email delivery | If in scope | INPUT MISSING | — | — |
| INF-IN-006 | Observability (logs/metrics) | Yes | INPUT MISSING | LAUNCH-GAP-003 | — |
| INF-IN-007 | Support hours per account | Yes | INPUT MISSING | Beta required | — |
| INF-IN-008 | Stripe fee % + fixed | At paid launch | INPUT MISSING | Stripe | — |
| INF-IN-009 | Payment failure handling cost | At paid launch | INPUT MISSING | — | — |

---

## 5. Revenue Inputs (Hypothetical Until Approved)

| ID | Input | Required? | Available? | Notes |
| -- | ----- | --------- | ---------- | ----- |
| REV-IN-001 | Core monthly price | At launch | HYPOTHETICAL | Scenario A/B |
| REV-IN-002 | Pro monthly price | At launch | HYPOTHETICAL | Scenario B/C |
| REV-IN-003 | Seat add-on price | At launch | HYPOTHETICAL | — |
| REV-IN-004 | AI overage unit price | If offered | HYPOTHETICAL | Requires AI-IN-* |
| REV-IN-005 | Annual discount % | Optional | INPUT MISSING | — |
| REV-IN-006 | Conversion rate beta→paid | At launch | INPUT MISSING | Beta required |
| REV-IN-007 | Churn rate assumption | At launch | INPUT MISSING | **Do not invent** |

---

## 6. Unit Economics Formulas

### Per workspace (monthly)

```
Revenue_ws = subscription_fee + (extra_seats × seat_price) + AI_overage_revenue

AI_cost_ws = prep_requests × (tokens_in × price_in + tokens_out × price_out)
Infra_cost_ws = fixed_allocation + variable_per_enrollment + variable_per_storage
Payment_cost_ws = Revenue_ws × stripe_rate + stripe_fixed_component
Support_cost_ws = support_hours × hourly_rate / active_workspaces

Variable_cost_ws = AI_cost_ws + Infra_cost_ws + Payment_cost_ws + Support_cost_ws

Contribution_margin_ws = Revenue_ws − Variable_cost_ws
```

### Portfolio

```
Blended_contribution_margin = Σ(margin_ws × workspace_share)
```

---

## 7. Usage Stress Scenarios

| Scenario | Description | Inputs required | Cost risk | Package risk |
| -------- | ----------- | --------------- | --------- | ------------ |
| Low usage | 1 operator, minimal AI | AI-IN-004 P10 | Under-monetization | Low |
| Normal | Median beta usage | AI-IN-004 P50 | Baseline model | Medium |
| Heavy | Power user, daily prep | AI-IN-005 P90 | AI margin squeeze | High without overage |
| Extreme / abuse | Scripted AI flood | Rate limits + caps | Provider bill spike | Requires hard limits |

**No numeric results** — all INPUT MISSING.

---

## 8. Gross Margin Readiness

| Check | Status |
| ----- | ------ |
| Baseline positive contribution margin | NOT YET ASSESSABLE |
| P90 stress acceptable | NOT YET ASSESSABLE |
| Abuse scenario bounded | NOT YET ASSESSABLE |

---

## 9. Handoff to Billing (Desktop)

When inputs AVAILABLE and PRICING APPROVED:

1. Desktop implements Stripe products/prices per packaging matrix
2. Webhooks enforce subscription state
3. Usage metering aligns with value metric (workspace + seats + AI)
4. No laptop mutation of `app/**`, Stripe, or migrations

Owner: Desktop per `SHARED-PATH-POLICY.md`.
