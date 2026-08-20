# B1-C3 — Course Seller Attention usefulness & signal coverage — Evidence

## 1. Executive verdict

**B1-C3 CLOSED WITH EVIDENCE — COURSE SELLER ATTENTION SIGNAL COVERAGE & USEFULNESS PRODUCTION VERIFIED**

The existing Attention engine was made operationally useful for Course Sellers by product-wiring the already-authoritative `enrollment_no_recent_progress` rule (14 UTC calendar days). Owner/Admin on-demand evaluation creates/updates/expires Items through existing RPCs; repeated evaluation appends Signals without duplicate open Items; Items are elevated to **high** via the existing severity RPC so they surface in B1-C1 `/home` Organization attention (which only composes critical/high). No scheduler. No migration. Social remains OFF. External provider writes: **0**.

## 2. Authoritative baseline

| Field | Value |
|---|---|
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `8bfa84f` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Production www (pre) | `dpl_EN6cgHzS8JafpWkHzvFp9uhfZGZe` |
| Control org | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (ZyntixAI Production QA) |
| Prior phases | B1-C1 ✅ · B1-C2 ✅ |
| Temporary B1-C2 QA Viewer | intentionally retained (not mutated) |

## 3. Existing Attention architecture

Preserved as authoritative:

- Signal = immutable evidence (append-only)
- Item = operational object with lifecycle `open → acknowledged → resolved|dismissed|expired` + archive
- Dedup: one open/acknowledged Item per dedupe key
- Severity: low/medium/high/critical
- RPCs: create/record/ack/assign/severity/resolve/dismiss/archive/`evaluate_attention_rules`
- No reopen / restore / snooze / parallel alert entity

Primary Course Seller rule already existed in SQL + domain:

- Rule key: `enrollment_no_recent_progress`
- Threshold: **14 UTC calendar days** (B1.7.0 locked)
- Eligible: `active`/`paused`, not archived
- Reference: max non-voided progress `occurred_at`, else enrollment `created_at`
- Create severity in RPC: `medium`
- Assignment on create: unassigned
- Re-eval while stale: append Signal + bump detection
- No longer stale: expire Item

## 4. Current signal inventory

| Source | Domain | Trigger | Classification |
|---|---|---|---|
| `evaluate_attention_rules` → `enrollment_no_recent_progress` | Enrollments + Progress | Owner/Admin evaluate (now product-wired) | **USEFUL** (KEEP) |
| `create_manual_attention_item` / `record_attention_signal` | Enrollment | Manual (adapters exist; no Course Seller auto path) | PARTIAL / TECHNICAL ONLY |
| Task overdue Attention | Tasks | — | **DUPLICATIVE** of B1-C1 overdue section; would need non-enrollment source → deferred |
| Lead/customer inactivity | Leads/Customers | — | NOT COURSE-SELLER RELEVANT without inventing thresholds |
| Org onboarding incomplete | Organizations | — | NOT Course Seller student risk |

Pre-B1-C3 product gap: rule + RPC existed; **no server action / UI / event entry** called evaluate, so natural stale enrollments never became Attention Items.

## 5. Course Seller risk inventory

Inspected implemented domains (no invented fields):

| Domain | Authoritative risk support |
|---|---|
| Tasks | `due_at` + open status — already on `/home` Overdue/Due today |
| Enrollments | status, archived, owner_member_id |
| Progress facts | occurred_at, voided_at — supports stale detection |
| Customers/Leads | status/pipeline only — no native stall SLA |
| Programs | status only |
| Org onboarding | org-level completion timestamp — not student risk |

Highest-confidence Beta-1 risk with contracted threshold: **stalled enrollment progress (≥14 UTC days)**.

## 6. Selected Beta-1 signal set

1. **`enrollment_no_recent_progress`** — operationalized (only KEEP rule for B1-C3)

## 7. Rejected/deferred signal candidates

| Candidate | Disposition | Reason |
|---|---|---|
| Assigned task overdue Attention | DEFER | Duplicates B1-C1 overdue tasks; enrollment-only Attention source |
| Lead inactivity SLA | DEFER | Would invent threshold → Owner gate |
| Customer onboarding incomplete | DEFER | No enrollment/customer deadline field |
| Scheduler for stale scan | REJECT for B1-C3 | Event/on-demand sufficient; Owner/Admin evaluate + post-progress re-eval |
| New Attention tables | REJECT | Parallel engine forbidden |

## 8. Signal contracts

### `enrollment_no_recent_progress`

| Field | Contract |
|---|---|
| Signal ID / type | `enrollment_no_recent_progress` |
| Purpose | Surface stalled Course Seller enrollments needing intervention |
| Origin domain | Enrollments + Progress |
| Trigger | Eligible enrollment age ≥ 14 UTC calendar days since progress reference |
| Evidence | `{ kind: stale_progress, referenceOccurredAt, evaluationOccurredAt, ageCalendarDays }` |
| Severity | RPC create `medium` → B1-C3 elevates to **`high`** via `update_attention_severity` for `/home` surfacing |
| Severity rationale | Meaningful stalled operational state; B1-C1 org Attention only shows critical/high |
| Dedup key | `attention:enrollment:<orgId>:<enrollmentId>:enrollment_no_recent_progress` |
| Assignment | Unassigned (organization Attention); manual assign retained |
| Title | `No recent enrollment progress` |
| Summary | `Enrollment has no qualifying progress within the stale threshold.` |
| NBA | Existing deterministic stale-progress NBA → Progress/enrollment/customer routes |
| Resolution | Auto-expire when re-eval finds not stale; human resolve/dismiss also available |
| Expiry | Via `expire_attention_item` when condition clears |
| Re-evaluation | Append Signal while still stale; no second open Item |
| False-positive safeguards | Archived / non-active-paused / fresh progress / future reference |
| Tenant boundary | `organization_id` from server membership; dedupe includes org id |
| Tests | Domain eligibility, evaluate action, adapters, browser Production QA |

## 9. Severity model

- LOW/MEDIUM/HIGH/CRITICAL unchanged as enums
- Course Seller stale rule operational severity for surfacing: **HIGH**
- Elevation is audited through existing severity update (not a silent column write)
- Manual QA fixtures remain at their authored severities

## 10. Assignment model

- Rule Items remain **unassigned** → Organization attention (Owner/Admin)
- Prefer not to force-assign to org Owner
- Enrollment `owner_member_id` may be used later for assignment without migration; not required for B1-C3 usefulness
- B1-C1 continues to distinguish MY WORK (assigned Attention + tasks) vs ORGANIZATION ATTENTION

## 11. Dedup/spam control

Production proof (control org):

| Metric | Value |
|---|---|
| Open rule Items | **2** |
| Distinct enrollments with open rule Item | **2** |
| Rule Signals total (after repeated evaluates) | **12** |
| Duplicate open Item for same enrollment | **0** |

Evaluation #1 created Items; subsequent evaluates appended Signals / updated detection; never a second open Item per dedupe key.

## 12. NBA mapping

Reuses existing NBA:

- Evidence kind `stale_progress` / rule `enrollment_no_recent_progress`
- Reason `attention_stale_progress_needs_review`
- Detail CTA to Progress / enrollment / customer context (permission-preserving)

Browser QA: detail page shows **Next Best Action** with actionable link.

## 13. Lifecycle integration

| Condition | Behavior |
|---|---|
| Still stale | Append Signal; keep open/acknowledged Item |
| Progress resumes (Owner/Admin progress mutation or evaluate) | Expire Item |
| Human resolve/dismiss | Existing lifecycle RPCs |
| Archive | Terminal only; Owner/Admin |

AUTO-RESOLVABLE: expire when not stale. HUMAN-RESOLUTION: resolve/dismiss remain available.

Known limitation: Staff progress mutations do not call evaluate (no `canEvaluateRules`); expire waits for Owner/Admin evaluate or Owner/Admin progress write.

## 14. Evaluation architecture

| Entry | Mechanism |
|---|---|
| Explicit Owner/Admin | `evaluateAttentionRulesAction` on `/attention` and enrollment detail |
| Event-driven | After Owner/Admin Progress record/correct/void → single-enrollment evaluate |
| Home read | **Read-only** composition (no evaluate-on-render) |
| Scheduler | **Not added** |

Server authoritative, org-bound, idempotent, bounded, fail-soft after Progress commit.

## 15. Migration decision

**NO MIGRATION**

All required evidence/lifecycle already represented. Severity elevation uses existing RPC.

## 16. Home integration

Flow verified:

Course Seller stale condition → evaluate → open high Attention Item → existing `/home` Organization attention → NBA → Attention detail

No duplicate home-specific signal representation.

## 17. Detail UX

Verified for rule Items:

- title, severity (High), status, evidence/context via existing detail loader
- assignment, timeline/events, NBA
- acknowledge / resolve / dismiss / severity per existing authority

## 18. Role authorization

| Role | Evaluate | Notes |
|---|---|---|
| Owner/Admin | Yes | UI + RPC |
| Staff | No | Progress may write; Attention evaluate denied |
| Viewer | No | Read only; no evaluate control |

Temporary B1-C2 QA Viewer role unchanged.

## 19. Tenant isolation

- Evaluate uses `resolveOrganizationContext` (server membership)
- Dedupe keys include organization id
- Cross-org enrollment ids cannot inject Attention into another org (RPC org filter)
- Unit coverage: distinct dedupe keys across orgs; org-context missing fails closed before RPC

## 20. False-positive tests

Covered in `tests/domain/attention-evaluate-rules-b1-c3.test.ts`:

- archived → no stale
- completed/cancelled → ineligible
- recent progress → NOT_STALE
- paused/active beyond 14d → STALE
- org-bound dedupe inequality

## 21. Functional tests

B1-C3 + Attention/NBA suite:

- `tests/domain/attention-evaluate-rules-b1-c3.test.ts` — **9 passed**
- Attention + NBA focused suites — **34 files / 231 passed**
- Typecheck — pass
- Lint — pass
- Build — pass (local + Vercel)

## 22. Attention regression

Focused Attention/NBA regression: **231 passed / 0 failed** (34 files).

Existing lifecycle/adapters/security/list/detail/NBA tests included.

## 23. Course Seller domain regression

Touched domains: Attention evaluate wiring, Progress action post-hook, Enrollment detail evaluate UI.

Progress actions remain fail-soft on Attention errors. Enrollment detail remains read-first with optional evaluate panel for Owner/Admin.

## 24. Browser QA

Harness: existing Playwright Production auth (`playwright/.auth/production-owner.json`, gitignored).

| Spec | Result |
|---|---|
| `b1-c3-production-attention.desktop.spec.ts` | **PASS** |
| `b1-c3-production-attention.mobile.spec.ts` | **PASS** |

Covered: evaluate UI → home shows Course Seller Attention → detail → NBA → mobile readability.

## 25. Production verification

Natural qualifying conditions existed (2 active/paused enrollments ≥14 days stale). **No fabricated Production fixture.**

| Before evaluate (rule Items) | After |
|---|---|
| 0 open rule Items | **2** open rule Items |
| Manual open Attention still present | retained |
| Signals for rule | grew with re-evals (append-only); Items stayed 2 |

| Deploy | ID |
|---|---|
| Implementation deploy | `dpl_6hjQqk5ChxRz5ZEii4DRgT5riUfS` |
| Home-surfacing fix deploy | `dpl_CqBEKzib3b4C4jGW72xzNwHUVkkc` → `https://www.zyntixai.com` |

Dedup: 2 enrollments → 2 open rule Items (not more).

## 26. Usefulness review

| Rule | Care? | Actionable? | Severity? | Duplicate? | NBA? | Stale risk? | Fatigue? | Evidence? | Verdict |
|---|---|---|---|---|---|---|---|---|---|
| `enrollment_no_recent_progress` | Yes | Yes | High proportionate for 14d stall | No (home tasks are separate) | Yes | Controlled by expire | Low (deduped) | Yes | **KEEP** |

## 27. Social safety

| Check | Result |
|---|---|
| Social publishing enabled | false (not flipped) |
| Open controlled publish windows | **0** |
| Consumed windows | 2 (unchanged intent) |
| R1-F | untouched / remains paused |
| Instagram provider writes | **0** |

## 28. Known limitations

1. Staff progress writes do not auto-expire Attention until Owner/Admin evaluate/progress.
2. Archived enrollments are skipped by evaluate loop; open Items for archived enrollments require human resolve/dismiss (pre-existing RPC shape; no migration in B1-C3).
3. Create-time RPC severity remains medium; operational surfacing severity is high via audited elevation.
4. Pre-existing unrelated failure: `tests/domain/social-universal-architecture.test.ts` expects an outdated Social migration list (extra migrations present). Not introduced by B1-C3.

## 29. Deferred scheduled-evaluation discussion

**Scheduler not required for B1-C3.**

On-demand Owner/Admin evaluate + post-progress re-eval for Owner/Admin is sufficient for Beta-1. A future scheduler would only be justified if Owners cannot be expected to refresh and Staff-driven progress must auto-expire without Owner action — that would be an Owner decision with cost/idempotency analysis.

## 30. Git state

| Field | Value |
|---|---|
| Implementation SHA (wire evaluate) | `1d44187` |
| Implementation SHA (home severity elevation) | `c9bbb1a` |
| Evidence SHA | *(this commit)* |
| Branch | `core/platform-readiness-20260707` |
| Expected final | HEAD = upstream = origin; divergence `0 0`; clean |

## 31. Closure verdict

**B1-C3 CLOSED WITH EVIDENCE — COURSE SELLER ATTENTION SIGNAL COVERAGE & USEFULNESS PRODUCTION VERIFIED**

DoD checklist: inventory ✅ · gaps ✅ · minimal rules ✅ · no parallel domain ✅ · deterministic ✅ · evidence safe ✅ · severity explainable ✅ · assignment correct ✅ · dedup ✅ · spam controlled ✅ · NBA ✅ · lifecycle ✅ · home ✅ · detail ✅ · roles ✅ · tenant ✅ · browser ✅ · domain/Attention regression ✅ · Production ✅ · external writes 0 ✅ · Social OFF ✅ · evidence ✅ · Git authoritative (after evidence push) ✅

**STOP after B1-C3.** Do not start B1-C4 / B1-C5 / R1-F / Social publishing.
