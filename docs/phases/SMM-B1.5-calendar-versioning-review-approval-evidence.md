# SMM-B1.5 — Calendar + Content Versioning + Review + Approval — Evidence

## 1. Executive verdict

```text
SMM-B1.5 CLOSED WITH EVIDENCE — CONTENT VERSIONING, REVIEW, APPROVAL AND CALENDAR FOUNDATION READY
SMM-B1.5 PRODUCTION SCHEMA VERIFIED — VERSION-BOUND APPROVAL AND EDITORIAL PLANNING FOUNDATION ACTIVE WITH SOCIAL FEATURE GATES OFF
```

## 2. Verified Git baseline

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `9698e22bc9d62520743b104b14289dcb1e655108` |
| Upstream / origin | aligned `0 0` |
| Worktree | clean at start |
| Prior tip | `docs(smm): close B1.4 content media foundation` |

## 3. Binding prior SMM state

A–D / B1.2 / B1.3 / B1.4 preserved. Instagram-only runtime connection CHECK unchanged. Staff content mutation retained. Brand Brain remains Owner/Admin.

## 4. Preflight findings

Inspected D §§12–13, B1.4 migration/evidence, content/variant/media tables, audit/RPC patterns. No reusable generic approval/comment system found → Social owns workflow tables.

## 5. B1.5 scope

In: immutable versions, review requests/comments, approval decisions, schedule slots, workflow readiness, RLS/RPCs, tests, production schema.

Out: publication jobs, provider publish APIs, analytics, Attention, AI review, client portal identities.

## 6. Versioning design decision

Both Master Content and Platform Variant get version tables. Variant versions are the approval/schedule target (provider-facing snapshot). Master versions capture concept snapshots. Current pointers on mutable parents.

## 7–8. Master / Variant version models

- `social_content_item_versions` — title/summary/message/campaign/pillar/origin
- `social_content_variant_versions` — copy fields + bounded `provider_config` + `media_snapshot` array

## 9. Version sequencing

Race-safe: `FOR UPDATE` on parent + latest version row; next number = max+1; unique `(org, parent, version_number)`.

## 10. Immutable snapshot semantics

UPDATE/DELETE blocked by immutability triggers. No overwrite of historical versions.

## 11. Media snapshot semantics

Variant version freezes ordered attachments including `asset_id`, role, order, plus storage/mime/category metadata. Does not rely on live `social_variant_media` joins for historical proof.

## 12. Current-version semantics

`current_version_id` on content/variant; same-org FK to version tables; updated transactionally on create.

## 13. Revision lineage

`previous_version_id` same-parent chain. No cross-variant ancestry.

## 14–16. Review request / lifecycle / feedback

`social_review_requests`: statuses `open|completed|cancelled|superseded`. Bound to exact `variant_version_id`. Due via `due_at` (overdue derived; no expiry worker). Comments append-only immutable.

## 17–19. Approval Decision / binding / invalidation

`social_approval_decisions` append-only: `approved|changes_requested|rejected`, context `internal|client`. Bound to exact version. Creating Version N+1 does not mutate prior decisions; new version starts unapproved. Unique terminal internal approved/rejected per version.

## 20. Internal / client approval decision

Beta 1 executes **internal only** (D). `client_approval_required` workspace flag is an extension point; client decisions/RPC context rejected. Constant: `SOCIAL_CLIENT_APPROVAL_B15_DECISION`.

## 21–23. Role matrix / Staff / self-approval

| Action | Owner | Admin | Staff | Viewer |
| --- | --- | --- | --- | --- |
| Versions / review request / comment / schedule | ✓ | ✓ | ✓ | ✗ |
| Approve / reject / changes_requested | ✓ | ✓ | ✓ | ✗ |
| Approval policy settings | ✓ | ✓ | ✗ | ✗ |

Self-approval: **allowed** (`SOCIAL_SELF_APPROVAL_B15_POLICY = allowed`).

## 24. Approval deadline

`due_at` absolute timestamptz; overdue = open && due_at < now(). No Attention mutation.

## 25–29. Planning / Calendar / timezone / move-cancel

`social_content_schedule_slots`: exact `variant_version_id`, `planned_at timestamptz`, IANA `planning_timezone` (validated via `pg_timezone_names`). Status `active|cancelled` only. Move keeps version binding. One active slot per version. Calendar = projection (no duplicated copy).

## 30–31. Workflow readiness

`evaluate_social_variant_version_workflow_readiness` derives editorial `workflow_ready` from approvals/policy/media/archive. Explicitly **not** provider_publishable.

## 32–36. Tenant / RLS / RPC / audit

Composite org/brand/workspace FKs. RLS on all new tables. Member SELECT; events Owner/Admin. 11 SECURITY DEFINER RPCs, empty `search_path`, authenticated EXECUTE, service_role revoked. Workflow events append-only.

## 37–39. Client-safe / no-publishing / no-Attention

Domain exports workflow types only. No publication tables/jobs. No Attention signals created.

## 40. Local SQL

`tests/security/social-workflow-rpc-live-verification.sql` (BEGIN/ROLLBACK + GUC). Production schema verified directly (B1.3/B1.4 pattern).

## 41–47. Tests

Domain workflow + migration security + inventory updates + prior Social regression inventories.

## 48–50. Results

| Gate | Result |
| --- | --- |
| Targeted | 7 files / 45 PASS |
| Full Vitest | **325 files / 2287 PASS** |
| typecheck / lint / build | PASS |

## 51–53. Reviews

Security PASS (immutable versions, version-bound approval, schedule binding, Staff approval, RLS, search_path, connection CHECK unchanged). Anti-chaos smells ABSENT for mutable approved snapshots, `is_approved` primary truth, publication statuses, provider API, Attention, AI approval.

## 54–58. Production

| Check | Result |
| --- | --- |
| Project | `dmctinrcjvsgmoxwwodw` |
| Applied | `20260815185612` |
| Drift | none |
| RLS | true on all 7 new tables |
| RPCs | SECURITY DEFINER + empty search_path |
| Connection CHECK | still Instagram-only |
| Schedule status | active\|cancelled only |
| Version/review/approval/schedule/workflow rows | **0** |
| Content/brands | **0** |
| Gates / secrets | unchanged OFF |

## 59. External-effect statement

```text
PRODUCTION DATABASE MIGRATIONS APPLIED: 1 (20260815185612)

CONTENT VERSION ROWS: 0
VARIANT VERSION ROWS: 0
REVIEW REQUEST ROWS: 0
APPROVAL DECISION ROWS: 0
CALENDAR/SCHEDULE ROWS: 0

OAUTH AUTHORIZATIONS: 0
INSTAGRAM/FACEBOOK/THREADS/TIKTOK/LINKEDIN/YOUTUBE/PINTEREST/X ACCOUNTS CONNECTED: 0
REAL PROVIDER TOKENS / LIVE API CALLS / MUTATIONS: 0
SOCIAL POSTS / STORIES / WEBHOOKS: 0
SMM FEATURE GATES ENABLED: 0
```

## 60. Residual risks

- Generated DB types lag Social tables (ongoing residual).
- Client approval identity deferred; `client_approval_required=true` keeps workflow_ready false until later.
- Local Docker live SQL script prepared; production schema verified.

## 61–62. Closure / evidence path

Closure criteria met.

`docs/phases/SMM-B1.5-calendar-versioning-review-approval-evidence.md`

## 63. Commits / push

| Full hash | Subject |
| --- | --- |
| `5255213b73ea825a74c0650c0f830d94f7b6e036` | `feat(smm): add content review approval and calendar foundation` |
| *(this evidence commit)* | `docs(smm): close B1.5 review approval calendar foundation` |

## 64–65. Final Git / verdict

Filled after push.

```text
SMM-B1.5 CLOSED WITH EVIDENCE — CONTENT VERSIONING, REVIEW, APPROVAL AND CALENDAR FOUNDATION READY
SMM-B1.5 PRODUCTION SCHEMA VERIFIED — VERSION-BOUND APPROVAL AND EDITORIAL PLANNING FOUNDATION ACTIVE WITH SOCIAL FEATURE GATES OFF
```

## 66. Next boundary

```text
SMM-B1.6 NOT YET AUTHORIZED
```

### Source-of-truth map after B1.5

| Layer | Status |
| --- | --- |
| Master Content / Variant | Mutable planning objects |
| Content/Variant Version | Immutable reviewed snapshot |
| Review Request | Human workflow request |
| Approval Decision | Immutable evidence for exact version |
| Schedule Slot | Editorial planning intent for exact version |
| Calendar | Projection over schedule + workflow |
| Publication / provider publishability / Attention / Analytics | Not yet implemented |
