# BQA-1D-FV — Controlled Production Qualification + Classification Verification

| Field | Value |
| --- | --- |
| Phase | **BQA-1D-FV — CONTROLLED PRODUCTION QUALIFICATION + CLASSIFICATION VERIFICATION** |
| Parent | BQA-1D |
| Document type | Production verification evidence |
| Date | 2026-08-26 |
| Formal status | `BQA-1D-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION QUALIFICATION + CLASSIFICATION VERIFIED` |
| Governing implementation | `docs/phases/BQA-1D-qualification-classification-server-foundation-evidence.md` |
| Governing database | `docs/phases/BQA-1C-FV-controlled-production-database-foundation-verification-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `47b127c66545a3b534cf703c85b8a9a060c6a31d` |
| Production schema | **APPLIED** (targeted MCP apply of frozen BQA mutation SQL only) |
| Production BQA fixture | **1 / 3 / 2 / 6 / 0 / 0 / 0** (qualifications / answers / decisions / events / support / admission / demand) |

This phase verifies the frozen BQA-1D server path on the retained QA Activity. It does **not** implement support evaluation, admission, AI classification, onboarding, Activity TAX mutation, Context assignment, Path B, or Social execution.

**BQA PRODUCTION QUALIFICATION = VERIFIED**

**BQA PRODUCTION CLASSIFICATION = VERIFIED**

**BQA ACTIVITY TAX MUTATION = 0**

**BQA CONTEXT ASSIGNMENT MUTATION = 0**

**ORG-CONTEXT EVENT DELTA = 0**

**BQA SUPPORT ASSESSMENTS = 0**

**BQA ADMISSION DECISIONS = 0**

**BQA DEMAND SIGNALS = 0**

**CONTEXT READINESS = UNCHANGED**

**AI CLASSIFICATION MODEL = NOT IMPLEMENTED**

**BQA ONBOARDING = NOT IMPLEMENTED**

---

## A. Repository baseline

Proven at FV start, before Production apply and before live Owner commands:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `47b127c66545a3b534cf703c85b8a9a060c6a31d` |
| Subject | `feat(bqa): add qualification and classification server foundation` |
| Divergence | `0 0` |
| Worktree at FV start | clean |

Hard gate passed. Frozen BQA-1D implementation commit was not amended.

---

## B. Production target

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Canonical app | `https://www.zyntixai.com` |
| QA Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| QA Activity | `07e6918e-6c13-437e-b698-f0f3be27e9bb` (`qa_online_course_business`) |

No service-role JWT, database password, cookie, or access token is recorded here.

---

## C. RPC migration / apply / security

Local frozen file (unchanged; DB-MIGRATION-DRIFT-01 retains local filename):

| Local file | SHA-256 |
| --- | --- |
| `supabase/migrations/20260826180000_add_business_qualification_classification_mutations.sql` | `6B52281B3EFD21A55E4833A65125219DDAB74F948B376934476E6B0E75203225` |

Targeted MCP `apply_migration` name `add_business_qualification_classification_mutations` succeeded in one shot. No `db push`. No repair.

Remote ledger: version `20260826140018` / name `add_business_qualification_classification_mutations`.

Live RPC `public.apply_business_qualification_mutation`:

| Check | Result |
| --- | --- |
| Arguments | `p_operation text, p_organization_id uuid, p_business_activity_id uuid, p_actor_user_id uuid, p_actor_member_id uuid, p_payload jsonb` |
| Returns | `jsonb` |
| Owner | `postgres` |
| `SECURITY DEFINER` | yes |
| `search_path` | `""` |
| PUBLIC EXECUTE | **no** |
| anon EXECUTE | **no** |
| authenticated EXECUTE | **no** |
| service_role EXECUTE | **yes** |

---

## D. Typegen reconciliation

Linked Production typegen (`npm run supabase:types`):

| Check | Result |
| --- | --- |
| SHA-256 | `C276A4AC720BB6089AA89536FB39D8ABD3293F109573330C167B3DAE88F8BB34` |
| Diff vs 1C-FV types | **+11 / −0** |
| Added function | `apply_business_qualification_mutation` under `Database["public"]["Functions"]` |
| Wrapper | `src/features/business-qualification/server/bqa-rpc.ts` now `satisfies keyof Database["public"]["Functions"]` |

No unexplained catalog drift. No behavioral command rewrite. Hand-edit of generated types: **none**.

---

## E. Secure input / secret handling

Live Owner harness used a gitignored local launcher only (`playwright/.auth/run-bqa-1d-fv.ps1`).

| Check | Result |
| --- | --- |
| Collection | `Read-Host -AsSecureString` |
| Conversion | `SecureStringToBSTR` → `PtrToStringBSTR` |
| Cleanup | `ZeroFreeBSTR` + `Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY` in `finally` |
| Persistence | not written to `.env`, Vercel pull, disk, or evidence |
| Process-local key after completion | **CLEARED** |
| Harness files committed | **no** (`/playwright/.auth/` gitignored) |

---

## F. Live Owner authentication

| Check | Evidence |
| --- | --- |
| `auth.getUser` | **PASS** (live harness) |
| Session manufacture | none; existing QA Owner storage used locally and not committed |

---

## G. Active membership

| Check | Result |
| --- | --- |
| Role | **owner** |
| Organization | exact QA org `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |

---

## H. Exact QA Activity

| Field | Live value |
| --- | --- |
| id | `07e6918e-6c13-437e-b698-f0f3be27e9bb` |
| `activity_key` | `qa_online_course_business` |
| status | `active` |
| `is_primary` | true |
| `classification_kind` | `niche` |
| `niche_id` | `9831efc8-b7ce-4726-be96-f5a061f21951` |
| created_at / updated_at | both `2026-08-25 10:49:13.19796+00` |

No second Activity was created.

---

## I. Qualification initialization

Single qualification `35315be1-91c5-4e7b-a95b-bd8e3f05fc23` created by frozen `ensureBusinessActivityQualification`. First ensure was non-idempotent (**PASS**).

---

## J. Initialization idempotency

Second ensure returned idempotent. Qualification count remains **1**. No extra `qualification_started` event.

---

## K. Answers

Exactly three current answers:

| question_key | value_kind | value_code | notes |
| --- | --- | --- | --- |
| `activity_description` | text | null | controlled non-sensitive QA description (45 chars); not duplicated here |
| `primary_value_delivered` | code | `structured_programs` | |
| `line_structure` | code | `one_line` | |

`created_at = updated_at` on every answer row.

---

## L. Answer idempotency

Same-value `activity_description` repeat was idempotent. Answer count remains **3**. No extra `answer_saved` event.

---

## M. Completeness

Read model: `requiredComplete = true`, `progress_status = confirmed`, `review_status = none`.

---

## N. Classification proposal

One `proposed` decision `4ec247c0-46e0-40a2-881f-285d6eb1b171`:

- outcome `classified`
- confidence `high`
- kind `niche`
- key `online-course-business`
- TAX id `9831efc8-b7ce-4726-be96-f5a061f21951`
- release `accda96d-dfc7-4666-8b28-4da515e3bbdd`
- `supersedes_decision_id` null

Caller-claimed `foundation` / `attacker-key` did **not** become canonical.

---

## O. TAX canonicalization

Control Plane identity:

| Field | Production value |
| --- | --- |
| kind | `niche` |
| key | `online-course-business` |
| niche id | `9831efc8-b7ce-4726-be96-f5a061f21951` |
| release | `ucf-tax-1` / `accda96d-dfc7-4666-8b28-4da515e3bbdd` / lifecycle `active` |

No TAX catalog DML. Confirmed and proposed rows share the same canonical target.

---

## P. Classification confirmation

One `confirmed` decision `b73d6d39-3963-43bc-8c2e-79384f1d5bc1`:

- `decision_source = user_self`
- `confidence_band = high`
- same canonical TAX identity
- qualification `current_classification_decision_id` points to this confirmed row

Proposal remains historical (not the current pointer). No unexpected supersession.

---

## Q. Confirmation idempotency

Second confirm was idempotent. Decision count remains **2**. No extra confirmed row. No extra `classification_confirmed` event.

---

## R. Read model

| Field | Value |
| --- | --- |
| progress | `confirmed` |
| review | `none` |
| complete | true |
| current kind | `niche` |
| current key | `online-course-business` |
| current decision source | `user_self` |
| `split_recommended` | false |

---

## S. Final retained BQA fixture

| Table | Count |
| --- | --- |
| `business_activity_qualifications` | **1** |
| `business_activity_qualification_answers` | **3** |
| `business_activity_classification_decisions` | **2** (1 proposed, 1 confirmed) |
| `business_activity_qualification_events` | **6** |
| `business_activity_support_assessments` | **0** |
| `business_activity_admission_decisions` | **0** |
| `business_activity_demand_signals` | **0** |

The fixture belongs only to the QA Organization + QA Activity above. It is retained; no DELETE-to-zero was performed.

---

## T. BQA event audit

Derived live order:

1. `qualification_started`
2. `answer_saved`
3. `answer_saved`
4. `answer_saved`
5. `classification_proposed`
6. `classification_confirmed`

**EVENT COUNT = 6**

**EVENT TYPES = qualification_started, answer_saved ×3, classification_proposed, classification_confirmed**

**IDEMPOTENCY EVENT DELTA = 0**

Payload keys are bounded identifiers/codes (`question_key`, `change`, `decision_id`, TAX ids/keys, confidence). No bearer/JWT/`sb_secret`, no duplicated business-description payload.

---

## U. Activity non-effect

QA Activity identity, lifecycle, primary flag, and canonical TAX fields are unchanged from the 2026-08-25 fixture. `updated_at` equals `created_at` (`2026-08-25 10:49:13.19796+00`) and predates the BQA run (`2026-08-26 17:34:05Z`).

**BQA ACTIVITY MUTATION = 0**

A BQA ClassificationDecision matching the already-existing Activity classification is not an Activity mutation.

---

## V. Context assignment non-effect

| Field | Live value |
| --- | --- |
| assignment id | `dba4065d-b7f6-4076-b9a5-610141d41807` |
| pin | `niche.online-course-business` v1 `1b942da6-9472-4520-a004-3d68096b44ff` |
| status | `active` |
| active count | **1** |
| superseded count | **0** |
| created_at / updated_at | both `2026-08-25 10:49:13.81213+00` |

No new assignment, repin, or fallback.

**BQA CONTEXT ASSIGNMENT MUTATION = 0**

---

## W. ORG-CONTEXT event non-effect

Pre-run: **2**. Post-run: **2** (`business_activity_created`, `context_version_assigned`).

**ORG-CONTEXT EVENT DELTA = 0**

---

## X. Support / admission / demand zero

| Table | Count |
| --- | --- |
| `business_activity_support_assessments` | **0** |
| `business_activity_admission_decisions` | **0** |
| `business_activity_demand_signals` | **0** |

Qualification pointers `current_support_assessment_id` and `current_admission_decision_id` are null. Classification did not implicitly evaluate or admit the Activity.

---

## Y. Context readiness

| Pack | readiness_status | verified_at |
| --- | --- | --- |
| `foundation.knowledge` | `context_ready` | NULL |
| `niche.online-course-business` | `context_ready` | NULL |

No promotion to `beta_supported` or `production_verified`.

**CONTEXT READINESS MUTATION = 0**

---

## Z. TAX / CAP / CTX invariants

Unchanged from pre-run:

| Registry | Counts |
| --- | --- |
| TAX | 1 / 4 / 22 / 1 / 0 / 0 / 2 (releases / foundations / industries / niches / specializations / deep / aliases) |
| CAP | 13 / 7 / 13 |
| CTX | 2 / 2 / 10 / 4 / 2 (packs / versions / mappings / terminology / readiness) |

No catalog DML attributable to BQA.

---

## AA. Path B

`GET https://www.zyntixai.com/register` still returns public-registration-unavailable copy. Organizations remain **6**. BQA has no invitation/member/user DML.

---

## AB. Social

| Check | Result |
| --- | --- |
| `private.social_publishing_execution_enabled()` | **false** |
| Cron | jobid **1**, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active |
| `social_publication_events` | **52** (unchanged from pre-run) |
| Provider write attributable to BQA | **0** |

---

## AC. RPC direct-client denial

Authenticated/anon/PUBLIC cannot EXECUTE `apply_business_qualification_mutation`. Live Owner JWT direct `.rpc` was denied by the harness before server commands. Static ACL reconfirmed after the live run without re-mutating.

---

## AD. Other-role evidence

| Role | Evidence level |
| --- | --- |
| Owner | **LIVE** Production server path PASS |
| Unauthenticated | **LIVE** harness denied before privileged mutation (`UNAUTHORIZED`; mutate spy not called) plus no-key discovery gate |
| Staff | **TEST** frozen BQA-1D: answers allowed, confirmation denied |
| Viewer | **TEST** frozen BQA-1D: read-only |
| Suspended / foreign | **TEST** frozen server tests + existing Production membership/RLS semantics |

No extra Closed Beta sessions were manufactured.

---

## AE. Transactional evidence

Successful live mutations completed atomically (1 qualification, 3 answers, 2 decisions, 6 events; no partial extra rows from retries). Frozen BQA-1D forced-failure rollback tests remain the destructive-failure authority.

Production destructive failure injection was **intentionally not performed**.

---

## AF. Tests

Focused BQA / Control Plane / ORG-CONTEXT / Context Resolver / Path B / Social isolation coverage is included in the full run.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (no warnings or errors) |
| Full `npx vitest run` | **3069 passed / 2 failed / 3071 total** |

Historical failures only (unchanged, non-blocking):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures.

---

## AG. Final git state

Recorded after the typegen/wrapper commit and this evidence commit:

| Check | Value |
| --- | --- |
| Typegen/wrapper commit | `52c51253edd2ffb290f433195c1e2ce2a123b17a` (`chore(bqa): sync Production mutation types`) |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence after push | `0 0` |
| Worktree after push | clean |
| Harness / auth storage | gitignored; not committed |

Recommended next phase (not implemented): **BQA-1E — SUPPORT + ADMISSION EVALUATION FOUNDATION**.
