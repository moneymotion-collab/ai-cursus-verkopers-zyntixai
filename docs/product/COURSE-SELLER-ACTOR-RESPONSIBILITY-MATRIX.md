# ZyntixAI Course Seller Actor Responsibility Matrix

## 1. Actor Definitions

| Actor | Definition |
| ----- | ---------- |
| Business Owner | Person accountable for the business; often performs all roles in small course sellers |
| Sales Operator | Person responsible for lead qualification, follow-up, and conversion (may be Owner) |
| Coach / Program Operator | Person responsible for delivery, onboarding, progress, and customer conversations (may be Owner) |
| Lead | Prospective customer before conversion |
| Customer | Paying participant in a program relationship |
| ZyntixAI | Bounded AI assistance within Observe/Analyze/Recommend/Prepare; limited Execute |
| System Process | Automated operational recording (timestamps, state updates, aggregations) without judgment |

One real person may perform Business Owner, Sales Operator, and Coach roles simultaneously.

---

## 2. Responsibility Principles

1. **AI does not become business authority** — Recommendations and drafts require human review for consequential actions.
2. **Human control over consequential action** — External messages, status changes with customer impact, and dismissals require human decision.
3. **System process ≠ AI judgment** — Recording a due date is not the same as deciding priority.
4. **Customer readiness ≠ operator readiness** — Distinct actors and distinct preparation obligations.

---

## 3. Lifecycle Responsibility Matrix

| Stage | Primary Actor | Supporting Actor | ZyntixAI Role | Human Decision Required? |
| ----- | ------------- | ---------------- | ------------- | ------------------------ |
| LCS-01 Lead Entry | Sales Operator | Lead | Observe | No (record entry) |
| LCS-02 Lead Context Capture | Sales Operator | Lead | Prepare (summarize) | Yes (validate context) |
| LCS-03 Qualification | Sales Operator | Lead | Recommend | Yes |
| LCS-04 Follow-Up | Sales Operator | Lead | Prepare (draft) | Yes (send/contact) |
| LCS-05 Sales Conversation Preparation | Sales Operator | — | Prepare | Yes |
| LCS-06 Sales Conversation / Decision | Sales Operator | Lead | Analyze (optional) | Yes |
| LCS-07 Won / Lost / Deferred | Sales Operator | Lead | Observe | Yes |
| LCS-08 Customer Handoff | Sales Operator | Coach | Prepare (summary) | Yes |
| LCS-09 Enrollment Association | Coach / Owner | Customer | Observe | Yes |
| LCS-10 Onboarding Initiation | Coach | Customer | Recommend | Yes |
| LCS-11 Onboarding Monitoring | Coach | Customer, System Process | Analyze | Yes (intervention) |
| LCS-12 Active Delivery | Coach | Customer | Observe | Yes (delivery actions) |
| LCS-13 Progress Monitoring | Coach | System Process | Analyze | Yes (interpretation) |
| LCS-14 Recurring Q&A Preparation | Coach / Owner | Customer | Prepare | Yes (send answer) |
| LCS-15 Attention Signal Emergence | System Process | ZyntixAI Analyze | Analyze | No (candidate only) |
| LCS-16 Attention Review | Business Owner | — | Recommend | Yes |
| LCS-17 Next Best Action Review | Business Owner | — | Recommend | Yes |
| LCS-18 Human Intervention | Coach / Owner | Customer | Prepare (optional) | Yes |
| LCS-19 Conversation Readiness | Coach | Customer | Prepare | Yes |
| LCS-20 Completion / Exit | Coach / Owner | Customer | Observe | Yes |
| LCS-21 Renewal / Continuation | Business Owner | Customer | Recommend | Yes |
| LCS-22 Reactivation | Sales Operator | Lead/Customer | Recommend | Yes |

---

## 4. AI Responsibility Boundary

| Mode | L2 responsibility |
| ---- | ----------------- |
| Observe | Record and surface available operational evidence |
| Analyze | Identify patterns, gaps, stall signals, attention candidates |
| Recommend | Suggest follow-up, attention review, next action with rationale |
| Prepare | Draft messages, answers, summaries, talking points from context |
| Execute | **Not default** — no autonomous external send or status mutation |

---

## 5. Consequential Action Matrix

| Action | Final decision owner |
| ------ | -------------------- |
| External message to lead/customer | Business Owner / Sales Operator / Coach |
| Lead qualification outcome | Sales Operator |
| Won / lost / deferred outcome | Sales Operator |
| Enrollment association | Coach / Owner |
| Enrollment status change | Coach / Owner |
| Customer intervention | Coach / Owner |
| Attention item dismissal | Business Owner |
| Attention item resolution | Coach / Owner |
| Next best action acceptance | Business Owner |
| Program completion / exit | Coach / Owner |
| Renewal decision | Business Owner |

Backend permission implementation is not defined at L2.

---

## 6. Responsibility Ambiguities

| Ambiguity | L2 handling |
| --------- | ------------- |
| Who owns small-business leads vs delivery? | Same person may hold all roles; system does not enforce role separation |
| Who marks onboarding complete? | Coach/Owner; customer may complete steps but human confirms |
| Who dismisses false-positive attention? | Business Owner or delegated operator with authority |
| Can AI send messages? | No — Prepare only; human sends |
| Customer self-service readiness updates | Deferred to L4 UX; L2 assumes visibility, not customer portal specification |
