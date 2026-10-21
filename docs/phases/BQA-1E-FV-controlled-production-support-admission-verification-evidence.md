# BQA-1E-FV — Controlled Production Support + Admission Verification

| Field | Value |
| --- | --- |
| Phase | **BQA-1E-FV — CONTROLLED PRODUCTION SUPPORT + ADMISSION VERIFICATION** |
| Parent | BQA-1E |
| Document type | Production verification evidence |
| Date | 2026-08-26 |
| Formal status | `BQA-1E-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION SUPPORT + ADMISSION VERIFIED` |
| Governing implementation | `docs/phases/BQA-1E-support-admission-evaluation-foundation-evidence.md` |
| Qualification verification | `docs/phases/BQA-1D-FV-controlled-production-qualification-classification-verification-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `23c1eaf4dd3111b6a5be1be121aeb64d15e7b98c` |
| Production schema | **APPLIED** (targeted MCP apply of frozen BQA-1E SQL only) |
| Production BQA fixture | **1 / 3 / 2 / 10 / 2 / 2 / 0** (qualifications / answers / decisions / events / support / admission / demand) |

This phase production-verifies the frozen BQA-1E support + admission evaluation foundation on the retained QA Activity. It does **not** mutate Activity TAX, assign or repin Context, promote Context readiness, join demand, enable Path B, grant entitlement, execute Social, implement AI classification, or expose product UI.

**BQA PRODUCTION SUPPORT EVALUATION: VERIFIED**

**BQA PRODUCTION ADMISSION EVALUATION: VERIFIED**

**INTERNAL_QA OCB: SUPPORTED + ADMITTED**

**CLOSED_BETA OCB AT context_ready: NOT_YET_SUPPORTED + NOT ADMITTED**

**BQA ACTIVITY MUTATION: 0**

**BQA CONTEXT ASSIGNMENT MUTATION: 0**

**ORG-CONTEXT EVENT DELTA: 0**

**CONTEXT READINESS MUTATION: 0**

**CAP READINESS OVERRIDE: 0**

**PATH B MUTATION: 0**

**ENTITLEMENT MUTATION: 0**

**DEMAND SIGNAL: 0**

**AI: NOT IMPLEMENTED**

**ONBOARDING: NOT IMPLEMENTED**

---

## A. Starting repository baseline

Proven at FV start, before Production apply and before live Owner commands:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `23c1eaf4dd3111b6a5be1be121aeb64d15e7b98c` |
| Subject | `feat(bqa): add support and admission evaluation foundation` |
| Divergence | `0 0` |
| Worktree at FV start | clean |

Hard gate passed. BQA-1C DATABASE FOUNDATION = PRODUCTION VERIFIED. BQA QUALIFICATION + CLASSIFICATION FOUNDATION = PRODUCTION VERIFIED. Frozen BQA-1E implementation commit was not amended.

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

## C. Migration hash / apply

Local frozen files (unchanged; DB-MIGRATION-DRIFT-01 retains local filenames):

| Local file | SHA-256 |
| --- | --- |
| `supabase/migrations/20260826190000_add_business_qualification_support_admission_mutations.sql` | `EF1E63A99B853B912842492478E5F32C205048CDE889C763FAF8D7FCE006FD46` |
| `supabase/migrations/20260826180000_add_business_qualification_classification_mutations.sql` | `6B52281B3EFD21A55E4833A65125219DDAB74F948B376934476E6B0E75203225` (unchanged) |

Targeted MCP `apply_migration` name `add_business_qualification_support_admission_mutations` succeeded in one shot. No `db push`. No repair. No rewrite of applied history.

Remote ledger: version `20260826182759` / name `add_business_qualification_support_admission_mutations`.

Linked Production typegen (`npm run supabase:types`) after apply: **no diff** against `src/types/database.generated.ts`. RPC signature already existed; new operations are text-dispatched payloads. Hand-edit of generated types: **none**.

---

## D. RPC contract / security

Live `public.apply_business_qualification_mutation` after apply:

| Check | Result |
| --- | --- |
| Arguments | `p_operation text, p_organization_id uuid, p_business_activity_id uuid, p_actor_user_id uuid, p_actor_member_id uuid, p_payload jsonb` |
| Returns | `jsonb` |
| `SECURITY DEFINER` | yes |
| `search_path` | `""` |
| Named operations present | `record_support_assessment`, `record_admission_decision`, `join_demand_waitlist`, `withdraw_demand_waitlist` |
| Second unrestricted BQA mutation RPC | **none** |
| INSERT/UPDATE `organization_business_activities` | **no** |
| INSERT/UPDATE `organization_context_assignments` | **no** |
| Catalog DML (`taxonomy_*` / `context_pack*` / `capabilities`) | **no** |
| PUBLIC EXECUTE | **no** |
| anon EXECUTE | **no** |
| authenticated EXECUTE | **no** |
| service_role EXECUTE | **yes** |

`service_role` is database execution only. It is not caller authorization. Live Owner JWT `.rpc` returned PostgreSQL `42501`.

---

## E. Real Owner auth

Live Owner harness used a gitignored local launcher only (`playwright/.auth/run-bqa-1e-fv.ps1`), reusing the verified 1D-FV secure-input mechanism:

| Check | Result |
| --- | --- |
| Collection | `Read-Host -AsSecureString` |
| Conversion | `SecureStringToBSTR` → `PtrToStringBSTR` |
| Cleanup | `ZeroFreeBSTR` + `Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY` in `finally` |
| Persistence | not written to `.env`, Vercel pull, disk, or evidence |
| Process-local key after completion | **CLEARED** |
| Harness files committed | **no** (`/playwright/.auth/` gitignored) |
| `auth.getUser` | **PASS** (live harness) |
| Session manufacture | none; existing QA Owner storage used locally and not committed |

---

## F. Retained classification fixture

1D qualification/answers/proposal/confirmation were **not** rerun.

| Field | Live value |
| --- | --- |
| Qualification | `35315be1-91c5-4e7b-a95b-bd8e3f05fc23` |
| progress | `confirmed` |
| review | `none` |
| complete | true |
| Confirmed decision | `b73d6d39-3963-43bc-8c2e-79384f1d5bc1` |
| kind / key | `niche` / `online-course-business` |
| confidence | `high` |
| decision source | `user_self` |
| Answers | **3** |
| Classification decisions | **2** (proposed + confirmed) |

---

## G. Internal QA support result

Live `evaluateBusinessActivitySupport({ requestedRollout: "internal_qa" })`:

| Field | Value |
| --- | --- |
| assessment id | `4677547d-de94-4889-876a-01b633873f25` |
| `rollout_mode` | `internal_qa` |
| `support_status` | `supported_for_requested_rollout` |
| `reason_code` | `eligible` |
| `context_readiness` | `context_ready` |
| pack | `niche.online-course-business` `9acd19bf-8394-419a-b55b-5256256af65b` |
| version | OCB v1 `1b942da6-9472-4520-a004-3d68096b44ff` |
| classification decision | confirmed `b73d6d39-3963-43bc-8c2e-79384f1d5bc1` |
| `architecture_gap` | false |
| `upgrade_may_exist` | false |
| first evaluation | non-idempotent; event `support_assessed` |

No Activity/Context mutation. Existing pin was observed, not selected as a replacement.

---

## H. Internal QA admission result

Live `evaluateBusinessActivityAdmission({ requestedRollout: "internal_qa" })`:

| Field | Value |
| --- | --- |
| admission id | `4ff288ac-a6ac-4ff0-8ccd-fd44284d4fe2` |
| `rollout_mode` | `internal_qa` |
| `admission_status` | `admitted` |
| `reason_code` | `eligible` |
| `support_assessment_id` | `4677547d-de94-4889-876a-01b633873f25` |
| `decision_source` | `user_self` |
| first evaluation | non-idempotent; event `admission_decided` |

No login grant, membership, invitation, entitlement, or Context assignment.

---

## I. Internal QA idempotency

Exact same support evaluation: `idempotent = true`, same assessment id, `eventType = null`.

Exact same admission evaluation: `idempotent = true`, same admission id, `eventType = null`.

No duplicate equivalent current row. No duplicate `support_assessed` / `admission_decided` event.

---

## J. Closed Beta support result

Same Activity, same Context pin, same `context_ready`, `requestedRollout: "closed_beta"`:

| Field | Value |
| --- | --- |
| assessment id | `38265b8b-5819-4bc0-ae1d-7035e5aedecf` |
| `rollout_mode` | `closed_beta` |
| `support_status` | `not_yet_supported` |
| `reason_code` | `context_readiness_insufficient` |
| `context_readiness` | `context_ready` |
| version | same OCB v1 `1b942da6-9472-4520-a004-3d68096b44ff` |
| classification decision | same confirmed `b73d6d39-3963-43bc-8c2e-79384f1d5bc1` |

This proves: existing Context pin ≠ Closed Beta support.

Closed Beta support was evaluated once in the primary FV path (no extra Production audit row). Structural idempotency is the frozen SQL snapshot match on the current pointer plus frozen tests.

---

## K. Closed Beta admission result

| Field | Value |
| --- | --- |
| admission id | `397c241f-32a4-46d8-b162-b0eacee5608d` |
| `rollout_mode` | `closed_beta` |
| `admission_status` | `not_yet_supported` |
| `reason_code` | `not_yet_supported` |
| `support_assessment_id` | `38265b8b-5819-4bc0-ae1d-7035e5aedecf` |

Hard requirement: `admission_status != admitted`. **PASS**.

---

## L. Rollout-history semantics

Frozen 1E schema has **one** `current_support_assessment_id` and **one** `current_admission_decision_id` per qualification (global latest evaluation, not per rollout mode).

Live Production after internal_qa then closed_beta:

| Question | Answer |
| --- | --- |
| A. Two historical SupportAssessment rows? | **yes** |
| B. Two historical AdmissionDecision rows? | **yes** |
| C. Did closed_beta set `superseded_at` on internal_qa rows? | **yes** (pointer supersession only) |
| D. Current support pointer = closed_beta only? | **yes** `38265b8b-5819-4bc0-ae1d-7035e5aedecf` |
| E. Current admission pointer = closed_beta only? | **yes** `397c241f-32a4-46d8-b162-b0eacee5608d` |
| F. Can internal_qa historical truth still be retrieved? | **yes** |

Internal QA rows were **not rewritten**:

- support `4677547d-…` remains `internal_qa` / `supported_for_requested_rollout` / `eligible`, `superseded_at = 2026-08-26 18:34:29.658671+00`
- admission `4ff288ac-…` remains `internal_qa` / `admitted` / `eligible`, `superseded_at = 2026-08-26 18:34:30.2776+00`

No DELETE. Closed Beta did not change those status/reason/rollout fields.

Governed retrieval after closed_beta is current:

1. `business_activity_support_assessments` / `business_activity_admission_decisions` retain both rows
2. Owner-visible qualification events retain `support_assessed` and `admission_decided` for both rollout modes with bounded metadata
3. `BusinessQualificationRepository.listSupportAssessments` / `listAdmissionDecisions` load all rows for the Activity

**Current pointer meaning:** the most recently evaluated support/admission snapshot for this qualification. It is **not** the universal truth for every rollout mode. Product callers must not infer “internal_qa is no longer admitted” from the current closed_beta snapshot. A later rollout-aware read model may be required for product UI; it was **not** built in this FV.

This is the frozen 1E contract, not BQA-1E-FV-R1.

---

## M. Existing-pin non-authority

QA Activity already had active OCB v1 pin `dba4065d-b7f6-4076-b9a5-610141d41807` / `1b942da6-9472-4520-a004-3d68096b44ff`.

- internal_qa support: eligible
- closed_beta support: not eligible

Assignment existence is **not** admission authority. Pin unchanged.

---

## N. Context version behavior

Support observed the existing exact pin/version. It did not select or apply a replacement. `upgrade_may_exist = false`. Live upgrade-selection among multiple published versions was not exercised; frozen tests cover multi-version behavior. No auto-upgrade. No repin.

---

## O. Support / admission events

Chronological Production events (10):

1. `qualification_started` (1D)
2. `answer_saved` ×3 (1D)
3. `classification_proposed` (1D)
4. `classification_confirmed` (1D)
5. `support_assessed` internal_qa (`eligible` / `supported_for_requested_rollout`)
6. `admission_decided` internal_qa (`admitted` / `eligible`)
7. `support_assessed` closed_beta (`not_yet_supported` / `context_readiness_insufficient`)
8. `admission_decided` closed_beta (`not_yet_supported` / `not_yet_supported`)

**FINAL EVENT COUNT = 10**

**1E EVENT DELTA = 4**

**1E EVENT TYPES = support_assessed ×2, admission_decided ×2**

**IDEMPOTENCY EVENT DELTA = 0**

Payloads are bounded identifiers/codes (rollout_mode, status/reason, assessment/admission ids, catalog/version ids, existing pin ids, `upgrade_may_exist`). No JWT/`sb_secret`/`eyJ`, no full Context payload, no capability dump, no entitlement data, no duplicated business-description payload.

---

## P. Read model

Live Owner `getBusinessActivityQualification` after both evaluations:

| Field | Value |
| --- | --- |
| progress / review / complete | `confirmed` / `none` / true |
| current classification | `niche.online-course-business` / `user_self` |
| current support | closed_beta `not_yet_supported` / `context_readiness_insufficient` / `context_ready` |
| current admission | closed_beta `not_yet_supported` / `not_yet_supported` |
| pin | same assignment + OCB v1 |
| `upgradeMayExist` | false |
| demand | null |
| events (Owner) | all 10 types present, including both rollout `support_assessed` and `admission_decided` |

Historical internal_qa admitted truth remains in events and superseded rows. Current pointer semantics as in L.

Post-run closure used read-only SQL plus the already-captured Owner read-model result. Support/admission/demand commands were not rerun.

---

## Q. Final BQA counts

| Table | Pre-apply | Post-run |
| --- | --- | --- |
| `business_activity_qualifications` | 1 | **1** |
| `business_activity_qualification_answers` | 3 | **3** |
| `business_activity_classification_decisions` | 2 | **2** |
| `business_activity_qualification_events` | 6 | **10** |
| `business_activity_support_assessments` | 0 | **2** |
| `business_activity_admission_decisions` | 0 | **2** |
| `business_activity_demand_signals` | 0 | **0** |

Support 2 = internal_qa row + closed_beta row. Admission 2 = admitted internal_qa + not_yet_supported closed_beta. Events 10 = 6 retained 1D events + 4 1E events. Demand 0 because waitlist join was not executed.

---

## R. Activity non-effect

QA Activity `07e6918e-6c13-437e-b698-f0f3be27e9bb`:

- `activity_key = qa_online_course_business`
- status `active`, primary true
- canonical TAX `niche` / `9831efc8-b7ce-4726-be96-f5a061f21951`
- `created_at = updated_at = 2026-08-25 10:49:13.19796+00` (predates BQA-1E)

Qualification `updated_at` changed only because frozen 1E pointer fields (`current_support_assessment_id`, `current_admission_decision_id`) were written. That is BQA qualification state, not Activity domain mutation.

**BQA ACTIVITY MUTATION = 0**

---

## S. Context assignment non-effect

| Field | Live value |
| --- | --- |
| assignment id | `dba4065d-b7f6-4076-b9a5-610141d41807` |
| pin | `niche.online-course-business` v1 `1b942da6-9472-4520-a004-3d68096b44ff` |
| status | `active` |
| active count | **1** |
| superseded count | **0** |
| created_at / updated_at | both `2026-08-25 10:49:13.81213+00` |

**BQA CONTEXT ASSIGNMENT MUTATION = 0**

---

## T. ORG-CONTEXT event delta

Pre-run: **2**. Post-run: **2** (`business_activity_created`, `context_version_assigned`).

**ORG-CONTEXT EVENT DELTA = 0**

---

## U. Context readiness unchanged

| Pack | readiness_status | verified_at |
| --- | --- | --- |
| `foundation.knowledge` | `context_ready` | NULL |
| `niche.online-course-business` | `context_ready` | NULL |

No `beta_supported` or `production_verified` promotion.

**CONTEXT READINESS MUTATION = 0**

Critical: internal_qa admitted and closed_beta denied with readiness unchanged.

---

## V. CAP readiness non-authority

CAP remains **13 / 7 / 13**. All 13 current readiness rows are `production_verified`. Closed Beta still returned `not_yet_supported` / `context_readiness_insufficient` because Context readiness was `context_ready`.

**CAPABILITY READINESS DID NOT OVERRIDE CONTEXT READINESS POLICY**

**CAP READINESS OVERRIDE = 0**

---

## W. Path B non-effect

`GET https://www.zyntixai.com/register` still returns “Public registration is currently unavailable” (`login?registration=disabled`). Organizations remain **6**. BQA has no invitation/member/user DML. An Activity’s internal_qa admission does not create user identity access.

**PATH B MUTATION = 0**

---

## X. Entitlement / permission non-effect

BQA-1E produced no feature entitlement, role change, permission change, subscription change, or execution-gate enablement. Admission output is BQA state only.

**ENTITLEMENT MUTATION = 0**

**PERMISSION MUTATION = 0**

---

## Y. Social non-effect

| Check | Result |
| --- | --- |
| `private.social_publishing_execution_enabled()` | **false** |
| GUC `zyntix.social_scheduling_enabled` | unset |
| Cron | jobid **1**, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active |
| `social_publication_events` | **52** (unchanged from pre-run) |
| Provider write attributable to BQA | **0** |

**SOCIAL MUTATION = 0**

---

## Z. TAX / CAP / CTX invariants

Unchanged from pre-run:

| Registry | Counts |
| --- | --- |
| TAX | 1 / 4 / 22 / 1 / 0 / 0 / 2 |
| CAP | 13 / 7 / 13 |
| CTX | 2 / 2 / 10 / 4 / 2 |

No catalog DML.

---

## AA. Open Beta policy proof

No persistent Production `open_beta` decision row was created.

**TEST** (`tests/features/business-qualification/support-policy.test.ts`, `support.test.ts`, `admission.test.ts`, `support-admission.server.test.ts`):

- Open Beta eligibility set is undefined
- support reason `open_beta_policy_undefined`
- admission `blocked` / `blocked_policy`

No policy inference.

---

## AB. Production policy proof

Live CTX remains `context_ready`. No extra Production production-customer rows.

**TEST** frozen matrix:

- `context_ready` → production not eligible
- `beta_supported` → production not eligible
- `production_verified` → production eligible / admitted when other admission gates pass

---

## AC. Missing-pack / architecture-gap test evidence

No extra Production Activities/classifications were created.

**TEST:**

- missing exact pack: `not_yet_supported` / `missing_context_pack`
- manufacturing known architecture gap: `not_yet_supported` / `architecture_gap` with `architecture_gap = true`

`architecture_gap` is a reason code. It does **not** automatically mean `support_status = unsupported`. `unsupported` remains reserved for a genuinely unsupported business model.

---

## AD. Other-role evidence

| Role | Evidence level |
| --- | --- |
| Owner | **LIVE** Production server path PASS |
| Unauthenticated | **LIVE** harness denied before privileged mutation (`UNAUTHORIZED`; mutate spy not called) |
| Direct authenticated RPC | **LIVE** denied (`42501`) |
| Admin | **TEST** frozen BQA-1E: Owner/Admin may evaluate support/admission |
| Staff | **TEST** frozen BQA-1E: read support/admission; cannot decide/demand-write (`FORBIDDEN_ROLE`) |
| Viewer | **TEST** frozen BQA-1E: read-only; evaluate denied |
| Suspended / foreign | **TEST** frozen server tests + existing Production membership/RLS semantics |

No extra Closed Beta sessions were manufactured.

---

## AE. Transactional evidence

Successful live mutations completed atomically:

- internal_qa support row + `support_assessed` event
- internal_qa admission row + `admission_decided` event
- closed_beta support row + `support_assessed` event
- closed_beta admission row + `admission_decided` event

No partial SupportAssessment without event. No partial AdmissionDecision without event.

Frozen `tests/features/business-qualification/transaction.test.ts` remains the destructive-failure authority (forced event failure rolls back assessment, admission, and demand). Production destructive failure injection was **intentionally not performed**.

**TRANSACTIONALITY = PASS** (LIVE atomic success + TEST forced-failure)

---

## AF. Tests

Focused BQA / Control Plane / ORG-CONTEXT / Context Resolver / Path B / Social isolation coverage is included in the full run.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (no warnings or errors) |
| Full `npx vitest run` | **3115 passed / 2 failed / 3117 total** |

Historical failures only (unchanged, non-blocking):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures.

---

## AG. Final git state

Evidence-only commit. Typegen unchanged.

| Check | Value |
| --- | --- |
| Typegen commit | none (no schema signature change) |
| Evidence commit | recorded after this document |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Harness / auth storage | gitignored; not committed |

Recommended next phase (not implemented): **BQA-1F — GOVERNED ACTIVITY + CONTEXT ASSIGNMENT HANDOFF**.
