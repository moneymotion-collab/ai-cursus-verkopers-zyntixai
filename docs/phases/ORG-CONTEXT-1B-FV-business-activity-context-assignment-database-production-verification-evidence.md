# ORG-CONTEXT-1B-FV — Business Activity + Context Assignment Database Foundation Production Verification

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1B-FV — Business Activity + Context Assignment Database Foundation Production Verification** |
| Parent | ORG-CONTEXT-1B |
| Document type | Production verification evidence |
| Date | 2026-08-25 |
| Formal status | `ORG-CONTEXT-1B-FV CLOSED WITH EVIDENCE — BUSINESS ACTIVITY + CONTEXT ASSIGNMENT DATABASE FOUNDATION PRODUCTION VERIFIED` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `d8d1bd85a8430a5847be9293687b22b4e251668c` |
| Production schema | **APPLIED ONCE** (two targeted MCP migrations) |
| Organization assignments | **0** |

This phase does **not** create Business Activities, Context assignments, or audit events. It does **not** regenerate types, implement mutation RPCs, start a resolver, map onboarding, promote readiness, or change Social/Closed Beta.

**ORG-CONTEXT DATABASE FOUNDATION: PRODUCTION VERIFIED**

**ORGANIZATION CONTEXT ASSIGNMENTS: 0**

**ALL EXISTING ORGANIZATIONS: UNASSIGNED**

Do not claim ORG-CONTEXT-1 complete.

---

## A. Frozen 1B repository baseline

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `d8d1bd85a8430a5847be9293687b22b4e251668c` |
| Subject | `feat(org-context): add business activity assignment foundation` |
| Divergence | `0 0` |
| Worktree at FV start | clean |

Hard gate passed before any Production action. 1B migration files were not edited during FV.

---

## B. Both migration hashes

| Local file | SHA-256 | Git |
| --- | --- | --- |
| `supabase/migrations/20260825120000_create_organization_context_assignment_foundation.sql` | `0B09529A5B8132908C0A9416840221408F15C7FBF81BEC7C641C432310DFD6B0` | unchanged from `d8d1bd8`; no local diff |
| `supabase/migrations/20260825120010_enable_organization_context_assignment_rls.sql` | `C80E9A15192971E679CA7BC17A41E0CCC83BB7A768E910F1F6E5F2564D60A6E0` | unchanged from `d8d1bd8`; no local diff |

Hashes recalculated on disk immediately before apply. Full committed file contents were applied via MCP `apply_migration`. SQL was not reconstructed from this prompt.

---

## C. Production target

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Linked `supabase/.temp/project-ref` | `dmctinrcjvsgmoxwwodw` |
| Host | `db.dmctinrcjvsgmoxwwodw.supabase.co` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Postgres | `17.6.1.141` |
| Canonical app | `https://www.zyntixai.com` |

No service-role JWT, database password, or access token is recorded here.

---

## D. Migration ledger before / after

**Before:** last remote version `20260825084824` / `grant_control_plane_select_to_service_role`. Names `create_organization_context_assignment_foundation` and `enable_organization_context_assignment_rls` were absent.

**After:** each applied exactly once.

| Local file | Remote version | Remote name |
| --- | --- | --- |
| `20260825120000_create_organization_context_assignment_foundation.sql` | `20260825093152` | `create_organization_context_assignment_foundation` |
| `20260825120010_enable_organization_context_assignment_rls.sql` | `20260825093232` | `enable_organization_context_assignment_rls` |

Remote timestamps differ from local filenames. That mapping is expected under DB-MIGRATION-DRIFT-01. No ledger rewrite. No duplicate names.

---

## E. Targeted apply method

| Field | Value |
| --- | --- |
| Method | MCP `apply_migration` |
| `db push --linked` | **not used** |
| Migration repair | **not used** |
| `db pull` | **not used** |
| History rewrite | **not used** |
| Migration A result | success |
| Migration B result | success |

Intermediate check after A, before B: three tables existed; activities/assignments/events = 0; Organizations = 6.

---

## F. Exact three-table schema

Live `public` relations named `organization_context%` / `organization_business%`:

- `organization_business_activities`
- `organization_context_assignments`
- `organization_context_assignment_events`

No `organization_context_state`, `organization_context_overrides`, `organization_context_resolved`, or `organization_context_entitlements`.

`organizations` has no `context_*`, `foundation_id`, `industry_id`, `niche_id`, `specialization_id`, or `deep_specialization_id` columns.

---

## G. Zero rows / no backfill

| Table | Row count |
| --- | --- |
| `organization_business_activities` | **0** |
| `organization_context_assignments` | **0** |
| `organization_context_assignment_events` | **0** |

Counted after A and again after B. No DML was issued against these tables during FV.

---

## H. Six Organizations unchanged

`select count(*) from public.organizations` = **6** before apply, after A, and after B.

No `UPDATE`/`INSERT`/`DELETE` on `organizations`. The only `organizations` trigger remains `organizations_set_updated_at`. No TAX mapping trigger.

**ALL EXISTING ORGANIZATIONS: UNASSIGNED.**

---

## I. Classification XOR

Live `pg_get_constraintdef`:

- `organization_business_activities_target_cardinality_check`: sum of populated TAX FKs `<= 1`
- `organization_business_activities_kind_target_check`: null kind requires all FKs null; otherwise kind matches the populated typed FK
- `organization_business_activities_active_classified_check`: `status <> 'active' OR classification_kind IS NOT NULL`
- `organization_business_activities_status_check`: `draft` \| `active` \| `archived`

Together: draft/archived 0 or 1 target; active exactly 1; never more than one.

---

## J. Primary uniqueness

Live CHECK `organization_business_activities_primary_active_check`: `is_primary = false OR status = 'active'`.

Live partial unique index `organization_business_activities_one_active_primary_uidx`: `UNIQUE (organization_id) WHERE status = 'active' AND is_primary = true`.

Zero primary remains valid. No Production activity rows were inserted to prove this; catalog/index inspection is sufficient.

---

## K. Assignment pin

Live columns include `context_pack_version_id` (uuid, not null). No `context_pack_id`, `latest_version`, `auto_upgrade`, `resolved_version`, or entitlement columns.

Status CHECK: `active` \| `superseded`.

Version FK: `FOREIGN KEY (context_pack_version_id) REFERENCES context_pack_versions(id) ON DELETE RESTRICT`.

---

## L. Compatibility trigger

Live `private.enforce_organization_context_assignment_integrity()`:

- `SECURITY DEFINER`
- `search_path = ''`
- `BEFORE INSERT OR UPDATE` on `organization_context_assignments`

INSERT path verifies Activity exists for the assignment Organization, is classified, is not archived, Context version exists, new pin `publication_status = published`, `pack_kind` equals `classification_kind`, and pack TAX target UUID equals Activity TAX target UUID (no ancestor fallback). Unclassified + assigned is forbidden.

The function does **not** grant entitlement, change permissions, enable Social, promote readiness, or resolve Context.

---

## M. Publication-state semantics

UPDATE path returns after identity + `active → superseded` checks and **does not** re-read `publication_status`. A later global `published → superseded` does not invalidate an existing pin. Production CTX versions were not mutated to test this.

---

## N. Assignment uniqueness

Live partial unique index `organization_context_assignments_one_active_uidx`: `UNIQUE (organization_id, business_activity_id) WHERE status = 'active'`.

Historical superseded rows remain structurally possible. Active assignments in Production: **0**.

---

## O. Event append-only semantics

Live trigger `organization_context_assignment_events_guard_immutable`: `BEFORE UPDATE` and `BEFORE DELETE` → `private.guard_organization_context_assignment_event_immutable()` raises `organization context assignment events are immutable`.

Event-type CHECK: `business_activity_created`, `business_activity_classified`, `context_version_assigned`, `context_version_changed`, `primary_activity_changed`, `business_activity_archived`. Payload must be a JSON object. Canonical truth stays on activity/assignment rows.

No event was written. `service_role` has `SELECT, INSERT` (not UPDATE/DELETE).

---

## P. Function security

Three private functions only. No `public.*` ORG-CONTEXT RPC.

| Function | SECURITY DEFINER | search_path | EXECUTE public/anon/authenticated/service_role |
| --- | --- | --- | --- |
| `private.guard_organization_context_assignment_event_immutable` | yes | `''` | **false** / no `routine_privileges` rows except owner `postgres` |
| `private.enforce_organization_business_activity_identity` | yes | `''` | same |
| `private.enforce_organization_context_assignment_integrity` | yes | `''` | same |

Triggers remain registered and fire as table-owner. These functions are **not** the future 1C transactional mutation RPC.

---

## Q. RLS definitions

RLS enabled, FORCE false.

| Table | Policies | Command | Qual |
| --- | --- | --- | --- |
| `organization_business_activities` | 1 | SELECT to `authenticated` | `private.is_org_member(organization_id)` |
| `organization_context_assignments` | 2 | SELECT to `authenticated` | members: `is_org_member AND status = 'active'`; Owner/Admin: `has_org_role(..., ARRAY['owner','admin'])` |
| `organization_context_assignment_events` | 1 | SELECT to `authenticated` | Owner/Admin only |

No INSERT/UPDATE/DELETE policies.

---

## R. Table grant matrix

Live `has_table_privilege` after B:

| Role | Activities | Assignments | Events |
| --- | --- | --- | --- |
| `public` | none | none | none |
| `anon` | none | none | none |
| `authenticated` | SELECT only | SELECT only | SELECT only |
| `service_role` | SELECT, INSERT, UPDATE | SELECT, INSERT, UPDATE | SELECT, INSERT |

No DELETE/TRUNCATE/REFERENCES/TRIGGER for client or `service_role` on these three. Owner `postgres` retains table-owner privileges as expected. `role_table_grants` matches: authenticated SELECT only; `service_role` as above; no anon/public grants.

---

## S. Authenticated write denial

Catalog: authenticated `INSERT`/`UPDATE`/`DELETE` = false on all three tables. No write policies.

**AUTHENTICATED DIRECT WRITE EXECUTION PROBE = NOT AVAILABLE** (no new Production user; no mutation harness). Privilege catalog is authoritative.

---

## T. Foreign-org verification limitation while tables are empty

No rows exist. An empty-table cross-tenant query would not prove foreign denial.

**AUTHENTICATED MEMBER RLS EXECUTION PROBE = NOT AVAILABLE** (no existing Closed Beta session harness used; no users/memberships created).

Policy/catalog definitions plus frozen 1B static tenant security tests are sufficient for 1B-FV. Complete row-level foreign-denial execution belongs to **ORG-CONTEXT-1FV** after one explicitly authorized QA assignment exists.

**ANON LIVE REST EXECUTION PROBE = NOT AVAILABLE.** Live `has_table_privilege` already shows anon has no privileges on the three tables.

---

## U. CONTROL-PLANE unchanged

Regression query for INSERT/UPDATE/DELETE on the 15 catalog tables, or client-role SELECT, or missing `service_role` SELECT: **empty** (no regressions).

`service_role` remains SELECT-only on the exact 15 TAX/CAP/CTX tables. ORG-CONTEXT DML applies only to the three tenant tables.

---

## V. TAX/CAP/CTX unchanged

Observed after apply (same as pre-apply):

| Registry | Counts |
| --- | --- |
| TAX | 1 / 4 / 22 / 1 / 0 / 0 / 2 |
| CAP | 13 / 7 / 13 |
| CTX | 2 / 2 / 10 / 4 / 2 |

No catalog DML.

---

## W. Context readiness unchanged

| Pack version | readiness_status | verified_at |
| --- | --- | --- |
| `foundation.knowledge` v1 | `context_ready` | NULL |
| `niche.online-course-business` v1 | `context_ready` | NULL |

`supported_scope` remains `{ journey: "closed-beta-course-sellers", runtime: "inert", resolver: false }`. No version mutation. No assignment.

---

## X. Onboarding legacy isolation

`organizations` still has `business_type`, `primary_audience`, `primary_offering`, `primary_goal`, `team_size_band`. No mapping trigger. No Organization gained an activity or assignment.

---

## Y. Social / Closed Beta safety

| Check | Result |
| --- | --- |
| GUC `zyntix.social_publishing_enabled` | unset |
| GUC `zyntix.social_scheduling_enabled` | unset |
| `private.social_publishing_execution_enabled()` | **false** |
| Cron | jobid 1, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active (unchanged) |
| Scheduler invoke / provider writes | none performed |
| `GET /login` | 200, Sign in |
| `GET /register` | 307 → `/login?registration=disabled`; copy “Public registration is currently unavailable.” |

Invitation/allowlist/auth/member rows were not mutated. `SOCIAL_SCHEDULING_ENABLED` / `SOCIAL_PUBLISHING_ENABLED` were not enabled. Schema existence has no Social effect.

---

## Z. DB-MIGRATION-DRIFT-01 untouched

Historical Social local/remote timestamp divergence remains. FV used controlled MCP apply of the two frozen committed SQL files only. No `db push`. No repair.

---

## Tests / static checks

| Check | Result |
| --- | --- |
| New ORG-CONTEXT contract tests | 32 + 4 passing |
| Targeted TAX/CAP/CTX/CONTROL-PLANE/invitation | 459 passing + the same historical invitation failure |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (no warnings or errors) |
| Full `npx vitest run` | **2867 passed / 2 failed / 2869 total** |

1B accepted baseline: 2867 / 2 / 2869. Same two historical failures only (non-blocking, not repaired):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures. `src/types/database.generated.ts` was **not** regenerated.

---

## Production smoke

| Request | Result |
| --- | --- |
| `GET https://www.zyntixai.com/login` | 200 Sign in |
| `GET https://www.zyntixai.com/register` | fail-closed redirect to `/login?registration=disabled` |

No records created. No owner visual confirmation required. Product UI was not changed.

---

## Scope exclusions

- no generated types
- no `src/features/org-context/**`
- no mutation RPC
- no resolver
- no entitlement
- no onboarding mapping
- no QA pin
- no BQA
- no UI

---

## Next phase

**ORG-CONTEXT-1C — TYPED TENANT REPOSITORY + GUARDED PLATFORM MUTATION FOUNDATION**

1C should own: linked Production typegen; domain types; tenant-honest read repository; platform-operator authorization; narrow atomic mutation RPC; service-role server wrapper; readiness-mode validation; explicit activity actions; audit writing; idempotency/concurrency; tests.

Still: no normal customer assignment, no resolver, no onboarding, no BQA, no UI.

Post-closure rule:

- BUSINESS ACTIVITY SCHEMA: Production verified
- CONTEXT ASSIGNMENT SCHEMA: Production verified
- ORGANIZATION ASSIGNMENTS: 0
- CTX PACK READINESS: `context_ready`
- CONTEXT RESOLUTION: not implemented
- No tenant has changed product behavior
