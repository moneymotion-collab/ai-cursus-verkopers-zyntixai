# ORG-CONTEXT-1D — Controlled Internal QA Assignment Journey

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1D — Controlled Internal QA Assignment Journey** |
| Parent | ORG-CONTEXT-1C-FV / ORG-CONTEXT-1C-R1A / ORG-CONTEXT-1B-FV |
| Document type | Production verification evidence |
| Date | 2026-08-25 |
| Formal status | `ORG-CONTEXT-1D CLOSED WITH EVIDENCE — CONTROLLED INTERNAL QA CONTEXT ASSIGNMENT PRODUCTION VERIFIED` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `129dcc5ae38fb92dae57c51ae9feb15482137d3b` |
| Journey | **ONE authorized internal-QA Production assignment via frozen application service** |
| QA assignment | **RETAINED** |

This phase proves the first controlled Production tenant assignment path:

authenticated platform operator → dedicated operator authorization → ORG-CONTEXT service → generated typed RPC wrapper → `service_role` → Production RPC → constraints/triggers → tenant rows/events.

It is **internal QA infrastructure verification**, not general customer assignment.

**PRODUCTION BUSINESS ACTIVITIES: 1**

**PRODUCTION CONTEXT ASSIGNMENTS: 1 ACTIVE**

**PRODUCTION ORG-CONTEXT EVENTS: 2**

**PRODUCTION QA ASSIGNMENT: RETAINED FOR FUTURE RESOLVER VERIFICATION**

**OTHER ORGANIZATIONS: UNASSIGNED**

**CONTEXT RESOLUTION: NOT IMPLEMENTED**

Do not claim ORG-CONTEXT-1 complete. Authenticated tenant RLS execution probes remain for ORG-CONTEXT-1FV.

---

## A. Repository baseline

Proven **before any Production action**:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `129dcc5ae38fb92dae57c51ae9feb15482137d3b` |
| Subject | `docs(org-context): record mutation boundary Production verification` |
| Divergence | `0 0` |
| `git status --short` | empty (clean) |

Hard gate passed. No implementation change was required. No ORG-CONTEXT-1D-R1 defect was found.

---

## B. Production target

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Host | `db.dmctinrcjvsgmoxwwodw.supabase.co` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Canonical app | `https://www.zyntixai.com` |

Credentials are not recorded.

---

## C. Infrastructure preflight

Reconfirmed before tenant mutation. No infrastructure remediation in 1D.

| Check | Result |
| --- | --- |
| ORG-CONTEXT schema | Production verified (1B-FV) |
| Mutation RPC | `public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb)` exists **exactly once** |
| `SECURITY DEFINER` | true |
| `search_path` | empty (`search_path=""`) |
| `auth.role()` | asserts `service_role` |
| `anon` EXECUTE | **false** |
| `authenticated` EXECUTE | **false** |
| `service_role` EXECUTE | **true** |
| CONTROL-PLANE catalog grants | `service_role` SELECT-only (spot-check: `taxonomy_releases`, `capabilities`, `context_packs`, `context_pack_readiness`) |

---

## D. Pre-journey data counts

| Object | Count |
| --- | --- |
| `organization_business_activities` | **0** |
| `organization_context_assignments` | **0** |
| `organization_context_assignment_events` | **0** |
| Organizations | **6** |
| Organizations with ORG-CONTEXT Activity | **0** |

No unexpected pre-existing assignment data.

---

## E. Designated QA Organization evidence

The QA Organization was **not** inferred from `business_type`, Programs, Enrollments, CRM, first/last/active Organization, or course-seller heuristics.

Authoritative Closed Beta evidence already names this tenant as the internal Production QA Organization:

- `docs/phases/BETA1-LR-1-closed-beta-admission-activation-evidence.md`
- `docs/phases/BETA1-LR-2-closed-beta-support-first-user-smoke-evidence.md`
- `docs/phases/BETA1-FV-zyntixai-closed-beta-final-verification-evidence.md`

Live Production identity:

| Field | Value |
| --- | --- |
| id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| name | `ZyntixAI Production QA` |
| slug | `zyntixai-production-qa` |
| status | `active` |

Memberships (no emails/user ids): owner 1 active, admin 1 active, staff 2 active, viewer 4 active + 2 suspended.

Intended internal QA usage is proven by prior Closed Beta evidence plus this live identity match.

---

## F. Operator authorization plan

Application mutation authority remains the dedicated R1A gate:

- `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED` (fail-closed; exact `true`)
- `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST`

Not used:

- Closed Beta admission allowlist
- Social operator allowlist
- tenant Owner/Admin role alone

Preferred final state: Production website flag **not enabled**.

The journey used **one** explicit authorized operator identity (QA Organization owner, also on the dedicated allowlist **only during the local harness process**). Values are not recorded.

---

## G. Operator environment before / during / after

| State | Result |
| --- | --- |
| **Before** | Production Vercel has **neither** `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED` nor `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST`. Absence is fail-closed. `SOCIAL_PUBLISHING_ENABLED` / `SOCIAL_SCHEDULING_ENABLED` exist as Production env keys; live values were not exact `true`. |
| **During** | Production Vercel was **not** changed. Temporary in-memory process env on a local uncommitted server-side vitest harness only: flag exact `true` + dedicated allowlist containing the authorized operator identity. |
| **After** | Harness process env keys deleted. `resolveOrgContextPlatformOperator` restored to fail-closed (`operator_disabled`). Production Vercel still has no ORG-CONTEXT operator keys. |

Temporary local harness (removed before this evidence commit; never public):

- `tests/org-context-1d-qa-journey.live.test.ts`
- `scripts/org-context-1d-qa-journey.ts` (not picked up by vitest include; copied into `tests/` for the run)
- helper scripts for gitignored Production env merge
- gitignored `.env.1d.production.local`

No `/api/org-context`, operator UI, browser button, or client mutation hook was created.

---

## H. Canonical TAX target

Resolved live through the Production control-plane reader (`TaxonomyRepository.findNicheByKey` / path), **not** hardcoded from prior evidence.

| Field | Live value |
| --- | --- |
| Niche key | `online-course-business` |
| Niche id | `9831efc8-b7ce-4726-be96-f5a061f21951` |
| Niche label | Online Course Business |
| Lifecycle | `active` |
| Parent industry | `education-and-learning` / Education & Learning |
| Parent foundation | `knowledge` / Knowledge |

Path: Online Course Business → Education & Learning → Knowledge.

---

## I. Exact Context Pack / version

Resolved live through the Production CTX reader (`getVersionByPackAndNumber("niche.online-course-business", 1)`). Not latest-by-implicit-default. No Foundation pin.

| Field | Live value |
| --- | --- |
| Pack | `niche.online-course-business` |
| Label | Online Course Business |
| Kind | `niche` |
| Version number | **1** |
| Version id | `1b942da6-9472-4520-a004-3d68096b44ff` |
| `publication_status` | `published` |
| Readiness | `context_ready` |
| `verified_at` | NULL |
| Pack TAX target | niche `online-course-business` (`9831efc8-b7ce-4726-be96-f5a061f21951`) |
| `parent_version_id` | Knowledge v1 (`3f42e003-6df3-4344-9941-8a1afe9bb329`) |

---

## J. Readiness

Mutation used `internal_qa`. Frozen policy allows `context_ready` for INTERNAL QA / platform assignment.

This is **not** `beta_supported`, `production_verified`, or customer-supported.

Context Pack readiness was not modified.

---

## K. Exact service journey

Smallest legitimate frozen path. `createBusinessActivity` atomically created **active + classified + primary**. `classifyBusinessActivity` was **not** called. `setPrimaryBusinessActivity` was used only as an idempotency repeat after assign.

Sequence:

1. `resolveOrgContextPlatformOperator` — PASS (dedicated allowlist + flag true in harness process)
2. `createOrganizationContextService(...).createBusinessActivity({ organizationId: QA, displayName: "Online Course Business QA", activityKey: "qa_online_course_business", status: "active", isPrimary: true, classification: { kind: "niche", targetId: live niche id }, reason: "ORG-CONTEXT-1D controlled internal QA assignment" })`
3. `assignContextVersion({ ..., contextPackVersionId: live v1 id, mode: "internal_qa" })`
4. Repeat **same** `assignContextVersion` — idempotent no-op
5. Repeat **same** `setPrimaryBusinessActivity` — idempotent no-op

No SQL INSERT. No table DML. No public endpoint.

Sanitized mutation outcomes:

| Step | Result |
| --- | --- |
| create | ok; not idempotent; event `business_activity_created`; activity `07e6918e-6c13-437e-b698-f0f3be27e9bb`; event `98a5b85b-29c6-4a0e-a7b7-d54c04b9870e` |
| assign | ok; not idempotent; event `context_version_assigned`; assignment `dba4065d-b7f6-4076-b9a5-610141d41807`; event `5bf918c6-fe0b-4fca-a509-a0a2a1a47db8` |
| assign again | ok; event id null; same assignment |
| setPrimary again | ok; event id null |
| anon RPC | `DENIED:42501` |
| operator restored fail-closed | true |

---

## L. Resulting Business Activity

Exactly one row.

| Field | Value |
| --- | --- |
| id | `07e6918e-6c13-437e-b698-f0f3be27e9bb` |
| organization_id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| activity_key | `qa_online_course_business` |
| display_name | `Online Course Business QA` |
| status | `active` |
| is_primary | **true** |
| classification_kind | `niche` |
| niche_id | `9831efc8-b7ce-4726-be96-f5a061f21951` (`online-course-business`) |
| foundation_id / industry_id / specialization_id / deep_specialization_id | **NULL** |
| created_at / updated_at | `2026-08-25 10:49:13.19796+00` |

No second Activity. No Service/Product/Field classification columns exist on this table; TAX cardinality is one kind only.

---

## M. Resulting active assignment

Exactly one row. No superseded row.

| Field | Value |
| --- | --- |
| id | `dba4065d-b7f6-4076-b9a5-610141d41807` |
| organization_id | QA Organization |
| business_activity_id | `07e6918e-6c13-437e-b698-f0f3be27e9bb` |
| context_pack_version_id | `1b942da6-9472-4520-a004-3d68096b44ff` |
| pack | `niche.online-course-business` v1 `published` |
| status | `active` |
| source | `platform_operator` |
| actor_user_id | present (not printed) |
| actor_member_id | present (operator is an org member; membership may be NULL in general) |
| superseded_at | NULL |
| created_at | `2026-08-25 10:49:13.81213+00` |

---

## N. Exact audit events

Exactly **two** append-only events. No `business_activity_classified` or `primary_activity_changed` because those were not separate state-changing operations.

| id | type | assignment_id | source | created_at |
| --- | --- | --- | --- | --- |
| `98a5b85b-29c6-4a0e-a7b7-d54c04b9870e` | `business_activity_created` | NULL | `platform_operator` | `2026-08-25 10:49:13.19796+00` |
| `5bf918c6-fe0b-4fca-a509-a0a2a1a47db8` | `context_version_assigned` | `dba4065d-b7f6-4076-b9a5-610141d41807` | `platform_operator` | `2026-08-25 10:49:13.81213+00` |

Both events: QA organization; QA activity; actor_user present; actor_member present; payload JSON object; reason column `ORG-CONTEXT-1D controlled internal QA assignment`.

Created payload keys: `activity_key`, `classification_kind`, `deep_specialization_id`, `display_name`, `foundation_id`, `industry_id`, `is_primary`, `niche_id`, `specialization_id`, `status`.

Assigned payload keys: `context_pack_version_id`, `pack_kind`.

Operator email is not recorded.

---

## O. Idempotency

| Repeat | Result |
| --- | --- |
| Assign same exact Context version again | ok; no-op; no second active assignment; no second assignment event |
| `setPrimaryBusinessActivity` on the already-primary Activity | ok; no-op; no `primary_activity_changed` event |

Live unique index remains: `organization_business_activities_one_active_primary_uidx` on `organization_id` where `status='active' and is_primary=true`. Exactly one active primary Activity for the QA Organization. A second real Production Activity was **not** created merely to force uniqueness failure.

---

## P. Tenant member read probe

**QA MEMBER RLS EXECUTION PROBE = NOT AVAILABLE**

No safe stored authenticated QA member session (`playwright/.auth/production-owner.json` or equivalent) existed. No user was created for this probe. Policy inspection is **not** claimed as runtime PASS.

---

## Q. Owner / admin history probe

**NOT AVAILABLE** (same session constraint). Catalog/policy contract remains. Executed owner/admin event-history proof is deferred to ORG-CONTEXT-1FV.

---

## R. Foreign-tenant probe

**NOT AVAILABLE** as a live authenticated foreign-tenant session.

Do **not** claim row-level runtime PASS from policy inspection alone. Final ORG-CONTEXT-1FV should prioritize genuine foreign-tenant isolation now that one real Activity exists.

---

## S. Unauthorized mutation proof

| Check | Result |
| --- | --- |
| RPC EXECUTE `authenticated` | **false** |
| RPC EXECUTE `anon` | **false** |
| Live anon PostgREST invoke | `DENIED:42501` |
| Admission allowlist only | application denial `allowlist_empty` |
| Social operator allowlist only | application denial `allowlist_empty` |
| Tenant owner identity without dedicated ORG-CONTEXT allowlist | application denial `email_not_allowlisted` |
| After harness env restore | application denial `operator_disabled` |

Users were not changed. Closed Beta admission, Social operator identity, and tenant Owner/Admin remain insufficient.

---

## T. Operator gate final safe state

| Check | Result |
| --- | --- |
| Production Vercel `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED` | **absent** |
| Production Vercel `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST` | **absent** |
| Application resolver without flag | fail-closed |
| QA Activity / assignment | **retained** (data persistence ≠ mutation authority) |

Privileged mutation execution is not left open on the Production website.

---

## U. No resolver

Assignment is a pinned resolver **input** only.

Not performed:

- merge Knowledge + Niche mappings
- inject Core baseline
- derive capabilities / navigation / terminology / permissions / entitlement
- change Home / AppShell

No `resolveContext` / capability-derivation consumer exists in `src/`.

---

## V. No entitlement

ORG-CONTEXT assignment did not change feature entitlements, permissions, role grants, Social access, or execution gates. CAP readiness remains catalog data. Social capability relevance stored in Context still does not enable anything.

---

## W. TAX / CAP / CTX immutability

| Catalog | Expected | After 1D |
| --- | --- | --- |
| TAX | 1 / 4 / 22 / 1 / 0 / 0 / 2 | **1 / 4 / 22 / 1 / 0 / 0 / 2** |
| CAP | 13 / 7 / 13 | **13 / 7 / 13** |
| CTX | 2 / 2 / 10 / 4 / 2 | **2 / 2 / 10 / 4 / 2** |

No catalog row mutation.

---

## X. Context readiness unchanged

| Pack | version | readiness | verified_at |
| --- | --- | --- | --- |
| `foundation.knowledge` | 1 | `context_ready` | NULL |
| `niche.online-course-business` | 1 | `context_ready` | NULL |

Assignment did **not** promote either pack.

---

## Y. Social unchanged

| Check | Result |
| --- | --- |
| Production env `SOCIAL_PUBLISHING_ENABLED` === `"true"` | **false** |
| Production env `SOCIAL_SCHEDULING_ENABLED` === `"true"` | **false** |
| GUC `zyntix.social_publishing_enabled` | unset |
| GUC `zyntix.social_scheduling_enabled` | unset |
| `private.social_publishing_execution_enabled()` | **false** |
| Cron | jobid 1, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active |
| Provider writes / account connect | none by this journey |
| `social_account_connections` newest `created_at` | `2026-08-18` (before journey) |

---

## Z. Closed Beta / registration unchanged

| Check | Result |
| --- | --- |
| `GET https://www.zyntixai.com/register` | `307` → `/login?registration=disabled` |
| `GET https://www.zyntixai.com/login` | `200` |
| New user | none |
| New membership | none (`organization_members` newest `created_at` `2026-08-22`) |
| Invitations | unchanged (`organization_invitations` newest `created_at` `2026-08-22`) |
| Production `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | still present; not used for ORG-CONTEXT authority |

QA assignment is not admission.

---

## Legacy onboarding isolation

QA Organization `updated_at` remains `2026-07-23 12:59:18+00` (before journey `2026-08-25 10:49:13+00`).

`organizations.business_type` remains the pre-existing `course_seller` value and was **not** used as classification input. ORG-CONTEXT classification is TAX niche `online-course-business`. No UPDATE to `business_type`, `primary_audience`, `primary_offering`, `primary_goal`, or `team_size_band`.

Max `organizations.updated_at` across all orgs remains `2026-08-04`.

---

## Other Organization safety

| Check | Result |
| --- | --- |
| Organizations | 6 |
| Organizations with Business Activity | **1** (QA only) |
| Unassigned Organizations | **5** |
| Active assignments outside QA | **0** |

No onboarding inference. Other tenants were not modified.

---

## Tests / static checks

| Check | Result |
| --- | --- |
| ORG-CONTEXT service / operator / RPC wrapper / mutation migration security / 1B schema / CONTROL-PLANE / invitations / Social gate (targeted) | **130 passed** |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (no warnings or errors) |
| Full `npx vitest run` | **2918 passed / 2 failed / 2920 total** |

Accepted baseline: 2918 / 2 / 2920. Same two historical failures only (non-blocking, not repaired):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures. No leftover live harness file in the suite.

---

## Production smoke

| Request | Result |
| --- | --- |
| `GET https://www.zyntixai.com/login` | `200`, `X-Matched-Path: /login` |
| `GET https://www.zyntixai.com/register` | `307` → `/login?registration=disabled` |

No product UI was added for ORG-CONTEXT. Visual owner confirmation is not required.

---

## Explicit final tenant state

| Object | State |
| --- | --- |
| Production Business Activities | **1** |
| Production Context assignments | **1 ACTIVE** |
| Production ORG-CONTEXT events | **2** |
| Production QA assignment | **RETAINED FOR FUTURE RESOLVER VERIFICATION** |
| Other Organizations | **UNASSIGNED** |
| Context Pack readiness | `context_ready` / `verified_at` NULL |
| Context resolution | **NOT IMPLEMENTED** |
| Customer self-service | **not implemented** |
| Onboarding connection | **not connected** |
| BQA | **not implemented** |
| Operator execution on Production website | **fail-closed** |

---

## Scope exclusions

- no second Activity
- no Foundation Context pin
- no catalog DML
- no readiness promotion
- no resolver / entitlement / Social coupling
- no public mutation surface
- no implementation code change
- no `db push` / migration repair
- no destructive cleanup of the QA pin

---

## Remaining blockers for later phases

Authenticated tenant RLS execution is still unproven in Production:

- QA member Activity/assignment read
- owner/admin history/event read
- Staff/Viewer raw-event denial
- foreign-tenant denial against the now-real QA Activity

These are **not** 1D closers. They are the priority for **ORG-CONTEXT-1FV**.

---

## Next phase

**ORG-CONTEXT-1FV** — final ORG-CONTEXT verification, including executed tenant RLS / foreign-tenant isolation against this retained QA pin.

Later: **CONTEXT-RESOLVER-1** can use this canonical tenant pin as Production input. Resolver is still not implemented.
