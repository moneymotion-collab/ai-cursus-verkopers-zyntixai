# NBA — Next Best Action Design, Security and Readiness Contract

| Field | Value |
| --- | --- |
| Capability | **Next Best Action (NBA)** |
| Document type | Design, security and implementation-readiness contract (**documentation only**) |
| Official phase number | **NONE ASSIGNED** — unnumbered until a separate owner decision assigns an official B1.x identity |
| Date | 2026-08-09 |
| Formal status | `OWNER-APPROVED MVP PACKAGE — READY FOR PUBLICATION REVIEW` |
| Owner decision package | Derived-first · one primary · deterministic · recommend-only · Attention-detail panel · first-match catalog |
| Predecessor track | **B1.7 — Attention Foundation** (`B1.7-PUB PASS`) |
| Governing standard | `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` |
| Discovery predecessor | Post-B1.7 NBA Design / Security / Readiness Discovery (owner-approved package) |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Contract baseline | `3a1ae25ab1727d18d9db6956010d6a15b52bae99` |
| Parallel | `PARALLEL BLOCKED` |

**This contract does not authorize implementation, migrations, fixtures, deploy, AI, notifications, or assignment of an official B1.x phase number.**

**This contract does not invent B1.8.** Historical B1.7 sequence documents remain unchanged.

---

## 1. Formal status and verdict

```text
NBA DESIGN / SECURITY / READINESS CONTRACT —
OWNER-APPROVED MVP PACKAGE LOCKED
IMPLEMENTATION NOT STARTED
OFFICIAL B1.x PHASE NUMBER NOT ASSIGNED
```

Authorized by owner decision package: docs-only contract publication after separate publication approval.

**Not** authorized by this document alone: product code, schema, RPC/RLS, fixtures, browser production mutations, deploy, AI/notifications, Task auto-create, sticky dismiss persistence, official phase numbering.

---

## 2. Critical product sequence

Repository-authoritative Course Sellers sequence (B1.5 / B1.6 / B1.7.0 / B1.7 discovery):

```text
Program → Enrollment → Progress → Attention → Next Best Action
```

| Dependency | Status |
| --- | --- |
| B1.5 Programs & Enrollments | PRODUCTION VERIFIED, CLOSED AND PUBLISHED |
| B1.6 Progress | PRODUCTION VERIFIED, CLOSED AND PUBLISHED |
| B1.7 Attention | `B1.7-PUB PASS — B1.7 PRODUCTION VERIFIED, CLOSED AND PUBLISHED` |
| NBA | This contract — **implementation not started** |

B1.7.0 deferred NBA until Attention was production-verified. That dependency is satisfied. B1.7-PUB requires separate owner-approved design/readiness before NBA starts — this document is that design contract.

---

## 3. Owner-approved decision package (locked)

| # | Decision | Locked value |
| --- | --- | --- |
| 1 | Persistence | **DERIVED-FIRST** — no NBA persistence table in MVP |
| 2 | Recommendation count | **Exactly one primary** recommendation per eligible Attention Item |
| 3 | Generation | **Deterministic only** — no AI / LLM |
| 4 | Execution | **Recommend-only** — NBA performs no customer/business-state mutation |
| 5 | Lifecycle | **No** sticky dismiss/accept lifecycle in MVP |
| 6 | Tasks | **No** automatic Task creation; Task deep-link **deferred** |
| 7 | UI | **Attention detail panel only** — no AppShell NBA nav / workspace |
| 8 | Ranking | **First-match deterministic catalog** — no ranking platform |

Course Sellers Beta 1 minimum remains:

```text
deterministic + explainable + human-in-the-loop + contextual + tenant-safe + recommendation-only
```

---

## 4. Official product positioning

```text
NBA = A deterministic and explainable recommendation layer that evaluates an
authorized non-terminal, non-archived Attention Item and its existing
authorized context and returns exactly one primary next operational action
for the human operator to consider.
```

### Locked layer separation

| Layer | Meaning |
| --- | --- |
| **Attention Signal** | Evidence / detection (immutable) |
| **Attention Item** | Operational follow-up object |
| **Next Best Action** | Recommendation about what the operator should consider doing next |

```text
Recommendation ≠ Decision ≠ Execution
```

| Layer | Owner |
| --- | --- |
| Recommendation | NBA mapper (this contract) |
| Decision | Human operator |
| Execution | Existing Attention / Progress / CRM workflows |

NBA must **not** replace, collapse, or mutate Signal or Item semantics locked by B1.7.0–B1.7.6.

---

## 5. MVP scope

### In scope

- Attention Item as primary NBA source
- Eligible: non-terminal (`open` \| `acknowledged`), non-archived, organization-authorized, readable by actor
- Exactly one primary recommendation or `null`
- Constrained deterministic catalog (§9)
- First-match priority (§10)
- Explainability (§11)
- Authorized related context (Enrollment / Customer / Program / Progress evidence)
- Contextual navigation CTA or focus on existing Attention lifecycle controls
- Attention detail panel only
- Safe empty / error / unavailable states
- Owner / Admin / Staff / Viewer read semantics
- Tenant isolation
- Pure deterministic mapper + authorized server-side context assembly
- Automated tests
- Controlled production QA / R1 / PUB methodology (later gates)

### Out of scope

- AI / LLM recommendations
- Autonomous decisions or outreach
- Automatic email / SMS / notifications
- Automatic Task creation
- Automatic Attention / PE / Progress lifecycle mutation by NBA
- Generic rules-engine productization
- Prediction / ML / churn / health scores
- Multi-recommendation lists / ranking platforms
- Dedicated NBA workspace or AppShell nav item
- NBA analytics / outcomes learning
- Sticky dismiss / accept / completed / superseded persistence
- NBA database table / migration / RLS policies
- Recommendation-specific audit event stream
- M8 / expired expansion; snooze; reopen; restore; multi-assignee
- Billing; member portal; generalized workflow automation
- `resolve_attention` / `dismiss_attention` catalog entries in MVP (§9–10)
- `create_follow_up_task` (deferred)

---

## 6. Eligibility contract

NBA **may** be evaluated only when the source Attention Item is:

1. Organization-authorized for the current actor
2. Readable by the current actor under existing Attention authorization
3. **Non-archived** (`archived_at` is null)
4. **Non-terminal** status ∈ {`open`, `acknowledged`}

### No active NBA (`null`) when

| Condition | Result |
| --- | --- |
| `resolved` \| `dismissed` \| `expired` | `null` |
| Archived | `null` |
| Unauthorized / unavailable Attention | safe unavailable / fail-closed (no foreign leak) |
| Required context cannot be safely read | `null` or safe evaluation failure — **never guess** |

B1.7.0 reminder: **Dismissed** must not be treated as “problem solved” evidence for generative recommendations without separate product rules. MVP does not recommend resolve/dismiss at all.

---

## 7. Derived-first domain result (no persistence)

MVP defines a **typed application-domain result**, not a database entity.

### Conceptual type: `NextBestAction`

| Field | Required | Purpose |
| --- | --- | --- |
| `actionType` | yes | Constrained catalog key |
| `title` | yes | Operator-facing action label |
| `explanation` | yes | Short deterministic why |
| `reasonCode` | yes | Stable machine reason code |
| `generatedAt` | yes | Evaluation timestamp (read time) |
| `attentionItemId` | yes | Source Attention reference (already authorized) |
| `relatedEnrollmentId` | when available | Authorized enrollment context |
| `relatedCustomerId` | when available | Authorized customer context |
| `relatedProgramId` | when available | Authorized program context |
| `evidenceSummary` | when applicable | Safe summary of signals/status used |
| `destination` | yes | Affordance descriptor (§22) |

### Explicitly not on MVP result

- NBA database ID
- NBA status / lifecycle fields
- Accepted / dismissed timestamps
- Recommendation history
- Priority score / ML rank

No NBA ID is required for stable rendering; React keys may use `actionType` + `attentionItemId` + `reasonCode`.

---

## 8. Pure recommendation mapper

```text
evaluateNextBestAction(context: AuthorizedNbaContext): NextBestAction | null
```

### Properties (locked)

- Deterministic
- Side-effect free
- No database writes
- No external network / AI / notifications
- No autonomous execution
- Same authorized input ⇒ same output
- Evaluated only on **server-assembled authorized context** — never solely from untrusted client payloads

Application integration **must not** turn mapper evaluation into mutation.

---

## 9. Recommendation catalog (MVP)

Revalidated against existing product surfaces. `create_follow_up_task` remains **DEFERRED**. `resolve_attention` / `dismiss_attention` are **EXCLUDED** from MVP (no deterministic “solved / should dismiss” evidence without inventing judgment).

### 9.1 `acknowledge_attention`

| Field | Contract |
| --- | --- |
| Eligibility | Status = `open`; non-archived; actor may acknowledge (owner/admin/staff) |
| Explanation intent | Item is open and should be triaged |
| Reason code | `attention_open_needs_acknowledge` |
| Destination | **Existing mutation affordance** — focus/scroll to Acknowledge control on Attention detail (B1.7.6-B). Do **not** invent parallel acknowledge mutation |
| Ends eligibility | Status ≠ `open` |

### 9.2 `assign_attention_owner`

| Field | Contract |
| --- | --- |
| Eligibility | Status ∈ {`open`, `acknowledged`}; `assigneeMemberId` is null; non-archived; actor may assign |
| Explanation intent | Item has no assignee |
| Reason code | `attention_unassigned_needs_owner` |
| Destination | Focus existing Assign control (B1.7.6-C) |
| Ends eligibility | Assignee present, or terminal/archived |

### 9.3 `review_progress`

| Field | Contract |
| --- | --- |
| Eligibility | Non-terminal, non-archived; authorized enrollment; **and** stale/no-recent-progress evidence is present via existing Attention inputs (see §13) |
| Explanation intent | Progress follow-up is indicated by Attention evidence |
| Reason code | `attention_stale_progress_needs_review` |
| Destination | **Navigation** to Progress list filtered by enrollment using existing helper `buildProgressListHref({ organizationId, enrollmentId })` → `/progress?org=…&enrollmentId=…` |
| Ends eligibility | Evidence no longer present on re-read, or Item terminal/archived |
| Forbidden | Writing Progress; inventing health scores; exposing voided facts to unauthorized roles |

### 9.4 `open_enrollment`

| Field | Contract |
| --- | --- |
| Eligibility | Non-terminal, non-archived; authorized `enrollmentHref` / enrollment id readable by actor |
| Explanation intent | Review enrollment operational context |
| Reason code | `attention_open_enrollment_context` |
| Destination | Existing enrollment detail link already used by Attention detail Related context |
| Ends eligibility | Enrollment unauthorized/unavailable, or Item terminal/archived |

### 9.5 `open_customer`

| Field | Contract |
| --- | --- |
| Eligibility | Non-terminal, non-archived; authorized customer link readable by actor |
| Explanation intent | Review customer CRM context |
| Reason code | `attention_open_customer_context` |
| Destination | Existing customer detail link from Attention Related context |
| Ends eligibility | Customer unauthorized/unavailable, or Item terminal/archived |

### 9.6 Explicitly excluded / deferred types

| Type | Status | Why |
| --- | --- | --- |
| `resolve_attention` | **Excluded from MVP** | No deterministic evidence that concern is handled; recommending resolve would invent operator judgment |
| `dismiss_attention` | **Excluded from MVP** | B1.7.0: dismiss ≠ solved; unsafe to auto-recommend |
| `create_follow_up_task` | **Deferred** | Owner package: no Task auto-create; deep-link optional later without expanding MVP |

Operators may still resolve/dismiss via existing Attention lifecycle controls; NBA simply does not **recommend** those actions in MVP.

---

## 10. First-match priority (locked)

Evaluate catalog entries in this **exact** order; return the **first** match; otherwise `null`.

1. `acknowledge_attention` — if eligible
2. `assign_attention_owner` — if eligible
3. `review_progress` — if eligible
4. `open_enrollment` — if eligible
5. `open_customer` — if eligible
6. else `null`

### Safety note on resolve/dismiss

A recommendation engine must **never** recommend resolving or dismissing merely because an Attention Item is acknowledged. MVP therefore omits those types entirely.

---

## 11. Explainability contract

Every non-null NBA **must** include:

| Element | Rule |
| --- | --- |
| `title` | Human action label (e.g. “Acknowledge this attention item”) |
| `reasonCode` | Stable code from §9 |
| `explanation` | Short deterministic sentence derived from reason code + safe facts |
| `evidenceSummary` | Optional: status, severity, signal rule key / evidence kind already visible to actor |
| Related refs | Only IDs/labels already authorized on Attention detail |

**Forbidden:** AI prose; unsupported claims (e.g. “customer will churn”); leaking inaccessible entity names/status.

---

## 12. Attention input contract

NBA may consume **only** fields already available on authorized Attention detail / related context:

| Input | Allowed |
| --- | --- |
| `status`, `severity`, `assigneeMemberId` / assignee label | Yes |
| `archivedAt` | Yes (eligibility gate) |
| Signal `ruleKey`, evidence `kind` (e.g. `stale_progress`), safe signal explanation | Yes if already on detail |
| `enrollmentId`, `customerId`, `programId` + authorized labels/hrefs | Yes |
| Resolution / dismissal reason text | **No** for MVP generation (not needed; types excluded) |
| Raw event payloads beyond safe timeline presentation | **No** |

NBA must never expose more than the actor can independently read via Attention/PE/Progress authorization.

---

## 13. Progress input contract

Prefer existing Attention signal citations and authorized Progress navigation.

| Allowed | Forbidden |
| --- | --- |
| Detect `enrollment_no_recent_progress` rule key on signals | New Progress writes |
| Detect evidence `kind: "stale_progress"` already on Attention | Second progress-health engine |
| Navigate via `buildProgressListHref` | Exposing voided Progress to Staff/Viewer beyond existing Progress permissions |
| | Client-side recomputation of private Progress |

If neither stale rule key nor `stale_progress` evidence is present on the authorized Attention detail, `review_progress` is **not** eligible—even if Progress list might be empty. Do not invent staleness outside Attention evidence.

---

## 14. Customer / Enrollment / Program context

Reuse Attention Related context links (`customerHref`, `programHref`, `enrollmentHref`).

| Case | Behavior |
| --- | --- |
| Link authorized | May use for catalog destination / explanation |
| Missing / inaccessible | Fail closed; do not leak existence; skip that catalog entry |

---

## 15. Tasks boundary

MVP:

- NBA does **not** create Tasks
- NBA does **not** add Task server actions
- `create_follow_up_task` remains deferred optional integration

Preserve: recommendation → operator decision → existing execution workflow.

---

## 16. Security / role matrix

| Role | Read NBA on eligible Attention | Execute via NBA |
| --- | --- | --- |
| Owner | Yes | No — uses destination’s own auth |
| Admin | Yes | No — destination auth |
| Staff | Yes (non-archived Attention only, same as Attention) | No — destination auth |
| Viewer | Yes if Attention readable | **Cannot** perform forbidden mutations; CTAs to mutation controls must remain unavailable / non-operative per B1.7.6 |

Hidden buttons are not authorization. Destination workflows retain server-authoritative checks (Attention lifecycle RPCs, Progress/Enrollment/Customer loaders).

Archive visibility: Owner/Admin may view archived Attention; NBA remains **`null`** for archived Items (§6).

---

## 17. Tenant isolation contract

NBA evaluation is organization-scoped via existing Attention detail authorization.

Must not leak foreign:

Attention · signals · customer · enrollment · program · Progress · assignee · destinations · reasons · error differentiation that reveals existence

Reuse existing org resolution and uniform unavailable patterns.

---

## 18. No-persistence consequences (intentional)

MVP **does not** support:

- Sticky dismiss
- Persistent accept
- Recommendation history
- Recommendation-specific audit events
- Recommendation status / analytics

Following an NBA means navigating or using an existing workflow. Business-state change remains audited by **existing** Attention (and other domain) events.

This is an intentional Beta 1 scope decision, not missing implementation.

---

## 19. Re-evaluation contract

NBA recalculates on authorized Attention detail read / reload (including post-lifecycle `router.refresh()` already used by Attention UX).

| After | Expected |
| --- | --- |
| Acknowledge | Recompute (likely assign / review_progress / open_*) |
| Assignment | Suppress assign recommendation |
| Severity change | Recompute (severity alone does not change catalog priority in MVP) |
| Progress change | Visible on next detail read if Attention signals/evidence change |
| Resolve / dismiss / archive | `null` |

No scheduler, event bus, or dedicated evaluate-NBA RPC required for MVP unless a later implementation discovery proves a hard server-boundary need (would require separate owner authorization).

---

## 20. UI contract

### Placement

**Attention detail page only.**

Recommended section position: after lifecycle action blocks / Related context, **before** Signals and Timeline (detail is a vertical section composition — `attention-detail.tsx`).

### Panel contents (when recommendation present)

- Recommended action title
- Why (explanation)
- Evidence / context summary (safe)
- One clear CTA aligned with destination type (§22)

### States

| State | Behavior |
| --- | --- |
| Loading | Inherit Attention detail loading; do not flash false recommendation |
| Recommendation | Show panel |
| Empty (`null`) | Quiet empty: no recommendation (or short “No next action recommended”) |
| Error | Safe evaluation failure copy; no tenant leak |
| Unavailable Attention | Existing Attention unavailable presentation; no NBA |

### Forbidden UI

AppShell NBA nav · NBA list workspace · NBA dashboard · NBA notification badge

---

## 21. CTA / execution boundary

| Destination kind | Behavior |
| --- | --- |
| **Existing mutation affordance** (`acknowledge_attention`, `assign_attention_owner`) | Direct/focus existing authoritative lifecycle control; reuse confirmation/pending patterns; **do not** invoke mutation on NBA card click alone |
| **Navigation** (`review_progress`, `open_enrollment`, `open_customer`) | Navigate to authorized href |

NBA itself must not call Attention/Progress/Task mutation actions.

---

## 22. Error contract

Conceptual outcomes:

| Outcome | Meaning |
| --- | --- |
| Recommendation available | Non-null `NextBestAction` |
| No recommendation | Eligible Item but no catalog match → `null` |
| Source unavailable | Attention unavailable — existing fail-closed UI |
| Context unavailable | Skip unsafe catalog entries; may still return another match or `null` |
| Evaluation failure | Safe error; no fake recommendation |

Avoid exposing tenant/object existence through error differences.

---

## 23. Audit contract

Derived MVP: **no** recommendation-specific audit events.

Underlying executed actions continue to use Attention `attention_item_events` (and other domain history). Do not create “viewed” noise.

Future persistence may introduce dedicated events under a **separate** contract change.

---

## 24. Dedupe / idempotency (derived)

| Rule | Contract |
| --- | --- |
| Count | Exactly one primary result or `null` |
| Refresh | Creates nothing |
| Same authorized state | Same recommendation |
| State change | May change recommendation |
| Terminal / archive | `null` |
| DB uniqueness | N/A — not persisted |

Optional test fingerprint (not stored):

```text
nba:attention:<organizationId>:<attentionItemId>:<actionType>:<reasonCode>
```

---

## 25. Database impact

```text
MVP EXPECTED:
NO NEW NBA TABLE
NO NBA MIGRATION
NO NBA RLS TABLE POLICY
NO NBA DATABASE EVENT TABLE
```

Architecturally viable: mapper + Attention detail read enrichment.

If implementation discovery later finds a true blocker requiring persistence: **STOP** and seek owner decision — do not silently add persistence.

---

## 26. Application / API impact

Enrich Attention detail application read model:

```text
nextBestAction: NextBestAction | null
```

### Layer ownership

| Layer | Responsibility |
| --- | --- |
| Domain types | `NextBestAction`, `NbaActionType`, reason codes |
| Pure mapper | `evaluateNextBestAction` |
| Server context assembly | Build `AuthorizedNbaContext` from authorized Attention detail (+ safe related fields already loaded) |
| Presentation | Attention detail NBA panel |

Authorization-sensitive evaluation must not run entirely from client-supplied context.

---

## 27. Testing contract

Deterministic unit/contract cases (minimum):

| Case | Expectation |
| --- | --- |
| `open`, non-archived | `acknowledge_attention` |
| `acknowledged`, unassigned | `assign_attention_owner` |
| `acknowledged`, assigned, stale evidence | `review_progress` |
| `open`, assigned, stale evidence | still `acknowledge_attention` (priority) |
| Assigned suppresses assign | no `assign_attention_owner` |
| Terminal (`resolved`/`dismissed`/`expired`) | `null` |
| Archived | `null` |
| Missing enrollment for review_progress | skip; continue catalog |
| Viewer | may receive recommendation text; cannot gain mutation authority |
| Org A context cannot produce Org B NBA | isolation |
| Identical input | identical output |
| Mapper | zero side effects; no writes |

Presentation tests: panel empty/recommendation/error; CTA does not call mutation actions directly.

---

## 28. Production QA / fixture strategy (plan only — do not create)

### Reuse of retained B1.7 fixtures (read-only)

| Fixture | Current state | NBA read-only usefulness |
| --- | --- | --- |
| F1-SEVERITY | `open` / high / unassigned | Expect `acknowledge_attention` |
| F1-ACK | `acknowledged` / unassigned | Expect `assign_attention_owner` (unless stale evidence elevates after ack—priority still assign before review) |
| F1-RESOLVE | `resolved` | Expect `null` |
| F1-DISMISS | `dismissed` | Expect `null` |
| F1-ARCHIVE | `resolved` / archived | Expect `null` |
| Org B Isolation | `open` | Tenant isolation; Org A must not see Org B NBA |

Stale-progress recommendation may require a future controlled fixture with `enrollment_no_recent_progress` / `stale_progress` evidence if current retained fixtures lack that signal shape—**separate owner authorization**; do not mutate retained fixtures for contract work.

### Planned verification themes

Deterministic cases · null cases · role matrix · tenant isolation · detail panel · CTA handoff · refresh recalculation · no side effects · regression · R1 · PUB

---

## 29. Definition of Done (MVP)

MVP is done only when:

1. Constrained typed catalog locked in code per this contract
2. Pure deterministic mapper implemented and tested
3. Authorized server-side context assembly
4. Attention detail exposes exactly one primary NBA or `null`
5. Explainability fields present on non-null results
6. Attention detail panel shipped (no AppShell NBA nav)
7. Terminal/archive suppression verified
8. Role safety verified (Viewer non-mutating)
9. Tenant isolation verified
10. No autonomous mutation; no NBA persistence/migration
11. Unit/integration tests per §27
12. Controlled production/browser QA per plan
13. Regression green
14. Production publication evidence under later NBA-PUB gate

Deferred evolution is **not** part of MVP DoD.

---

## 30. Conceptual delivery architecture (unnumbered)

Not official B1.x phases:

| Slice | Scope |
| --- | --- |
| **NBA-D** | This design / security / readiness contract |
| **NBA-T** | Typed domain + deterministic mapper + unit tests |
| **NBA-I** | Authorized context + Attention detail read enrichment |
| **NBA-U** | Attention detail NBA panel UX |
| **NBA-Q** | Controlled fixture / security / browser readiness (may need fixture substep if stale-progress case missing) |
| **NBA-R1** | Controlled production verification |
| **NBA-PUB** | Production publication |

No sticky-dismiss / persistence slice in MVP.

Estimated: **~5–7** implementation/verification slices after contract publication, plus R1/PUB.

---

## 31. Owner gates (future)

Separate owner approval required before:

| Gate | Note |
| --- | --- |
| Implementation start (NBA-T) | After this contract is published |
| Any schema/persistence change | Fail closed — not in MVP |
| Production QA fixture creation | If new fixtures needed |
| Production browser verification | NBA-R1 |
| Production publication | NBA-PUB |
| Official B1.x phase number assignment | Separate owner decision |

Derived/read-only NBA minimizes production mutation gates versus Attention lifecycle QA.

---

## 32. Cross-target architecture

Course Sellers MVP binds NBA to Attention Item.

Keep reusable without premature polymorphism:

- Constrained `actionType` + `reasonCode` pattern
- Pure mapper pattern
- Recommendation ≠ decision ≠ execution
- Presentation panel contract
- Tenant-safe authorized context assembly

Do not introduce Course-Seller-only database architecture that blocks later Coaching / Memberships / Customer Success reuse.

---

## 33. Deferred evolution

Explicitly deferred:

- Persisted NBA objects
- Sticky dismiss / accept / completed / superseded
- Multiple simultaneous recommendations
- Recommendation history / analytics
- AI / LLM
- Predictive ranking
- Notifications / auto-execution / workflow automation
- Configurable rules product
- Task auto-create / Attention↔Task link table
- Cross-entity orchestration beyond Attention-primary
- M8 / expired coupling
- `resolve_attention` / `dismiss_attention` catalog entries

---

## 34. Acceptance gates (contract readiness)

| Gate | Requirement |
| --- | --- |
| G1 | Owner decision package recorded |
| G2 | No official B1.x number invented |
| G3 | Layer separation Attention Signal / Item / NBA locked |
| G4 | Derived-first / no table locked |
| G5 | Catalog + first-match priority locked (resolve/dismiss excluded) |
| G6 | Security / tenant / explainability locked |
| G7 | UI = Attention detail only |
| G8 | DoD / delivery slices / deferred evolution documented |
| G9 | Docs-only; implementation not started |

---

## 35. Exact next safe steps

1. Owner publication review of this contract
2. Docs-only commit/push of this file only (separate authorization)
3. Optionally assign an official B1.x phase number in a **separate** owner decision
4. Separate authorization for **NBA-T** implementation

```text
NBA IMPLEMENTATION NOT AUTHORIZED FROM THIS CONTRACT ALONE
SEPARATE IMPLEMENTATION AUTHORIZATION REQUIRED
NO B1.8 INVENTED BY THIS DOCUMENT
```

---

## 36. Formal approval verdict

```text
OWNER-APPROVED NBA MVP DECISION PACKAGE — CONTRACT READY FOR PUBLICATION REVIEW
```

```text
STATUS: APPROVED-FOR-PUBLICATION-REVIEW
IMPLEMENTATION STATUS: NOT STARTED
OFFICIAL PHASE NUMBER: UNASSIGNED
PERSISTENCE: DERIVED-FIRST
EXECUTION: RECOMMEND-ONLY
```
