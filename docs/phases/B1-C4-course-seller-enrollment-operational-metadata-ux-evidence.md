# B1-C4 — Course Seller Enrollment Operational Metadata UX — Evidence

## 1. Executive verdict

**B1-C4 CLOSED WITH EVIDENCE — COURSE SELLER ENROLLMENT OPERATIONAL METADATA UX PRODUCTION VERIFIED**

Enrollment list and detail now compose authoritative Progress + Attention metadata so Owner/Admin can immediately understand WHO, PROGRAM, STATUS, PROGRESS, LAST PROGRESS, ATTENTION, and NEXT ACTION — without a new domain, migration, scheduler, or AI scoring.

## 2. Authoritative baseline

| Field | Value |
|---|---|
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `7e340c4` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Prior phases | B1-C1 ✅ · B1-C2 ✅ · B1-C3 ✅ |
| Production deploy (B1-C4) | `dpl_CEABHUAj2np7LDS4LymsjxmwjsBQ` → `https://www.zyntixai.com` |

## 3. Existing enrollment architecture

Preserved:

- Routes: list, detail, create, edit owner, status, archive, restore
- Status enum: pending / active / paused / completed / cancelled + soft archive
- Read models + foundations + RLS-bound queries
- Progress facts table / Attention Items linked by `enrollment_id`
- B1-C3 `enrollment_no_recent_progress` (14 UTC days) unchanged

## 4. Existing UX inventory (pre-B1-C4)

Detail showed identity + lifecycle + PE links only (no progress summary, no Attention summary, no next action).

List showed customer / program / status / owner / enrolled only.

## 5. Authoritative metadata inventory

| Concept | Source | Availability |
|---|---|---|
| Customer / program / status / timestamps | `enrollments` + joins | READY |
| Owner / source | enrollments | READY |
| Progress facts count / latest | `enrollment_progress_facts` (non-voided) | READY (was poorly exposed) |
| Last meaningful progress | max non-voided `occurred_at` | DERIVABLE |
| Stale health | existing Attention eligibility evaluator | DERIVABLE |
| Open Attention | `attention_items` open/acknowledged | READY (was poorly exposed) |
| Completion % | none authoritative | NOT AVAILABLE / NOT NEEDED |
| Task↔enrollment join | not authoritative | NOT NEEDED |

## 6. Data classification

- **A READY:** identity, program, status, lifecycle timestamps
- **B POORLY EXPOSED → now composed:** last progress, open Attention, stale health
- **C DERIVABLE:** progress health via B1-C3 rule
- **D NOT AVAILABLE:** fake % / AI risk — not invented
- **E NOT NEEDED:** task dashboard on enrollment

## 7. Schema/migration decision

**B1-C4 SCHEMA IMPACT — NONE**

**NO MIGRATION**

## 8. Enrollment list contract

Compact operational columns added:

- Progress health
- Last progress (timestamp or honest “No progress yet”)
- Attention open indicator (count · highest severity)

Existing filters/sort/pagination retained. No report-builder complexity.

## 9. Enrollment detail contract

Hierarchy:

1. Header (customer · program · status · health badge · **Next action**)
2. Enrollment details (identity/lifecycle)
3. Progress (health, fact count, last meaningful progress, type/title, UTC age when eligible)
4. Attention summary (open items → Attention detail; lifecycle stays in Attention)
5. Status history (existing)
6. Related links (customer/program/progress/Attention)

## 10. Progress presentation

Faithful fact model: non-voided fact count + latest fact title/type/occurred_at. No invented percentage.

## 11. Last meaningful progress

Authoritative: latest non-voided `enrollment_progress_facts.occurred_at`. Honest empty: “No progress recorded yet”.

## 12. Customer/student context

Display name + link to `/customers/{id}` when available.

## 13. Program context

Program name + link to `/programs/{id}` when available.

## 14. Attention integration

Summary only (title/severity/status + link). No duplicated acknowledge/resolve/dismiss.

## 15. B1-C3 stale-enrollment integration

Natural Production stale enrollments:

- `e405c5c8-8b26-4768-bc74-67c7d52224e0` (active)
- `aca64f96-8c62-4494-9698-6eee3f19df02` (paused)

Each shows: health **No recent progress**, open stale Attention, Next action **Open Attention**.

14-day rule unchanged.

## 16. NBA navigation

Cross-phase journey verified:

`/home` → Organization Attention (`No recent enrollment progress`) → Attention detail (NBA present) → Enrollment detail (Progress + Attention + Next action).

Enrollment next action prefers highest open Attention, else Review progress.

## 17. Activity boundary

Status history retained. No second event table. No raw audit dump.

## 18. Task/work boundary

No invented Task↔enrollment joins. Due work remains B1-C1.

## 19. Role authorization

- Owner/Admin: full operational composition + evaluate control when permitted
- Staff: permitted reads; no evaluate
- Viewer: read-only; no Attention mutation; temporary B1-C2 Viewer role unchanged

## 20. Tenant isolation

Composition queries filter by server-resolved `organization_id`. Client org never trusted alone. Links preserve `?org=`.

## 21. Server composition/read model

`loadEnrollmentOperationalSnapshot` (detail) and `loadEnrollmentListOperationalHints` (batched list) — org-scoped, bounded, fail-soft on optional joins.

## 22. UX states

Loading via existing page loaders; empty list preserved; honest “No progress recorded yet” / “No open Attention”; unavailable/error panels unchanged.

## 23. Mobile/responsive

List cards show progress/attention; detail sections stack; no horizontal overflow (mobile Playwright PASS).

## 24. Accessibility

Semantic headings (Progress / Attention / Next action); severity/status badges with text labels; focus styles retained; no icon-only actions.

## 25. Functional tests

Enrollment + Attention/NBA focused suites: **44 files / 340 passed**.

B1-C4 domain contract tests: **2 passed**.

## 26. Security tests

Existing enrollment/attention permission + tenant loader tests remain green within the 340.

## 27. Browser QA

| Spec | Result |
|---|---|
| `b1-c4-production-enrollment.desktop.spec.ts` (journey + list) | **2 PASS** |
| `b1-c4-production-enrollment.mobile.spec.ts` | **1 PASS** |

## 28. Cross-phase journey

PASS — home → stale Attention → enrollment operational detail with back navigation.

## 29. Production verification

Read-only on natural stale enrollments. **0 Production mutations.** **0 external provider writes.**

## 30. Performance

List uses batched progress + Attention fetches for page IDs only (no per-row N+1). Detail bounded fact/attention queries.

## 31. Usefulness review

| Question | Result |
|---|---|
| WHO | PASS |
| PROGRAM | PASS |
| STATUS | PASS |
| PROGRESS | PASS |
| LAST PROGRESS | PASS |
| ATTENTION | PASS |
| NEXT ACTION | PASS |

**Overall: PASS** — stale enrollment understandable without hunting.

## 32. Social safety

| Check | Result |
|---|---|
| Open controlled publish windows | **0** |
| Social publishing | remains OFF |
| R1-F | untouched |
| Instagram writes | **0** |

## 33. Known limitations

1. List stale fallback uses `enrolledAt` when no facts (detail uses `createdAt` matching B1-C3).
2. Attention open count on list is from bounded fetch (≤20/enrollment cap in query window) — sufficient for Beta-scale QA org.
3. No completion percentage (not authoritative).

## 34. Pre-existing unrelated test failures

`tests/domain/social-universal-architecture.test.ts` — Social migration list drift (extra Instagram/publish-window migrations). **Unrelated to B1-C4.** Reassess before Final Beta-1 Verification.

## 35. Git state

| Field | Value |
|---|---|
| Implementation SHA | `8b65b83` (+ browser assertion fix commit) |
| Evidence SHA | *(this commit)* |
| Branch | `core/platform-readiness-20260707` |
| Expected final | HEAD = origin; divergence `0 0`; clean |

## 36. Closure verdict

**B1-C4 CLOSED WITH EVIDENCE — COURSE SELLER ENROLLMENT OPERATIONAL METADATA UX PRODUCTION VERIFIED**

DoD: list ✅ detail ✅ identity ✅ program ✅ status ✅ progress ✅ last progress ✅ stale context ✅ Attention ✅ NBA/journey ✅ no duplicate lifecycle ✅ no new domains ✅ roles ✅ tenant ✅ states ✅ desktop ✅ mobile ✅ Production read-only ✅ external writes 0 ✅ Social OFF ✅ regression ✅ evidence ✅ Git ✅

**STOP after B1-C4.** Do not start B1-C5 / B1-FV / R1-F / Social Story.
