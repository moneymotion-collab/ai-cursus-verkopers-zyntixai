# ORG-CONTEXT-1C — Typed Tenant Repository + Guarded Platform Mutation Foundation

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1C — Typed Tenant Repository + Guarded Platform Mutation Foundation** |
| Parent | ORG-CONTEXT-1B / ORG-CONTEXT-1B-FV |
| Document type | Repository implementation evidence |
| Date | 2026-08-25 |
| Formal status | `ORG-CONTEXT-1C IMPLEMENTED BUT NOT PRODUCTION MUTATION VERIFIED` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `ae63be94280df2069ad47e13a13696f118093135` |
| Production mutation RPC | **NOT APPLIED** |
| Organization assignments | **0** |

This phase does **not** create Production Business Activities, Context assignments, or audit events. It does **not** apply the 1C mutation SQL. It does **not** implement customer self-service, onboarding, BQA, Context resolution, entitlement, Social execution, UI, or a public HTTP API.

**ORG-CONTEXT-1C IMPLEMENTED BUT NOT PRODUCTION MUTATION VERIFIED.**

**ALL PRODUCTION ORGANIZATIONS REMAIN UNASSIGNED.**

---

## A. Starting repository state

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `ae63be94280df2069ad47e13a13696f118093135` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| `git status --short` | empty (clean) |

Hard gate passed before any 1C edit.

---

## B. Production-verified 1B foundation

Live Production (`dmctinrcjvsgmoxwwodw`) after ORG-CONTEXT-1B-FV:

| Object | Live count |
| --- | --- |
| `organization_business_activities` | 0 |
| `organization_context_assignments` | 0 |
| `organization_context_assignment_events` | 0 |
| Organizations | 6, all unassigned |

1B migrations were not edited.

| File | SHA-256 |
| --- | --- |
| `supabase/migrations/20260825120000_create_organization_context_assignment_foundation.sql` | `0B09529A5B8132908C0A9416840221408F15C7FBF81BEC7C641C432310DFD6B0` |
| `supabase/migrations/20260825120010_enable_organization_context_assignment_rls.sql` | `C80E9A15192971E679CA7BC17A41E0CCC83BB7A768E910F1F6E5F2564D60A6E0` |
| `supabase/migrations/20260824210000_grant_control_plane_select_to_service_role.sql` | `578BB5028C4E8FA7EA7ABB182022AC0D0F99945744E1572EE28B6F0294C94017` |

---

## C. Linked typegen target

| Check | Value |
| --- | --- |
| `supabase/.temp/project-ref` | `dmctinrcjvsgmoxwwodw` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Status | `ACTIVE_HEALTHY` |
| Region | `eu-central-1` |
| Command | `npm run supabase:types` → `supabase gen types typescript --linked` |

Read-only schema metadata. No `db push`, no migration repair.

---

## D. Generated type diff review

| Check | Value |
| --- | --- |
| Pre-generation SHA-256 | `BDB01D94583C6C74DB4629849137002E5B0A821BC7BD95D3F6E97E33F656B91F` |
| ORG-CONTEXT tables before | **absent** (TAX/CAP/CTX already present) |
| Post-generation SHA-256 | `001200DD11B8D3726923575938F182100ECAE351B0901DE2913CBA9896A8F82B` |
| Diff | **+253 / −0** |
| Added tables | `organization_business_activities`, `organization_context_assignments`, `organization_context_assignment_events` |
| Destructive removals | none |
| Unapplied 1C RPC in linked types | **absent (expected)** |

No hand-written persistence types. No generated-type invention of the future RPC.

---

## E. ORG-CONTEXT domain types

Stable application types in `src/features/org-context/domain/types.ts`:

- `BusinessActivity`
- `BusinessActivityStatus`
- `TaxonomyClassificationRef`
- `OrganizationContextAssignment`
- `ContextAssignmentStatus`
- `ContextAssignmentSource`
- `OrganizationContextEvent`
- `PinnedContextVersionSummary`
- `ActivityWithContextAssignment`

Canonical identity uses `organizationId`, `activityId`, `activityKey`, typed TAX refs, and exact Context version identity. Generated Row types are not the application contract. No Production UUIDs are hardcoded in domain/server code.

---

## F. Tenant-honest read repository

`OrganizationContextRepository` requires an explicit `organizationId` on every method:

- `listBusinessActivities`
- `getPrimaryBusinessActivity`
- `getBusinessActivity`
- `getActivityClassification`
- `getPinnedContextVersion`
- `getAssignmentHistory`
- `getActivityWithActiveAssignment`
- `listActivityEvents`

Foreign activity UUID + wrong Organization → `ACTIVITY_NOT_OWNED_BY_ORG`. No first/last/fallback Organization.

---

## G. Platform-operator authorization

`service_role` / privileged client construction is **not** authorization.

v1 mutations require:

1. authenticated actor identity (`auth.getUser()`)
2. `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED` exact `true`
3. email on the shared Closed Beta operator allowlist (`SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST`)
4. explicit target Organization
5. explicit operation

Social UI enablement is **not** required (domain assumption differs from Social operator UI). Organization owner/admin/staff/viewer is never sufficient. Privileged database factory alone is denied.

---

## H. Transactional mutation API design

PostgREST cannot run multi-statement transactions as separate table calls. 1C adds one public RPC:

`public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb)`

Callable only through the Data API by the privileged role. Private-schema functions are not PostgREST-callable, so a locked public function is the smallest safe boundary. Public ≠ tenant self-service.

Operations: `create_activity`, `classify_activity`, `set_primary`, `assign_context_version`, `change_context_version`, `archive_activity`.

---

## I. RPC migration

`supabase/migrations/20260825130000_add_organization_context_platform_mutations.sql`

CLI `migration new` produced a same-day timestamp **before** the frozen 1B filenames (`20260825094645`). That file was discarded. The committed filename is ordered **after** `20260825120010` so local history cannot apply the RPC before the 1B tables exist.

Additive function only. No table redesign, backfill, Organization DML, catalog DML, or Social DML.

**Not applied to Production in 1C.**

---

## J. RPC privilege model

- `SECURITY DEFINER`
- `search_path = ''`
- fully qualified `public.` / `auth.` / `pg_catalog.` names
- `auth.role()` must be `service_role`
- `REVOKE ALL` from `public`, `anon`, `authenticated`, and `service_role`
- `GRANT EXECUTE` only to `service_role`
- no new GRANT INSERT/UPDATE/DELETE on TAX/CAP/CTX
- table constraints and 1B integrity triggers remain the structural floor

---

## K. Business Activity actions

`createBusinessActivity`:

- Organization must exist and be active
- operator authorized
- `activity_key` generated from display name + collision-safe suffix, or explicit key
- draft may be unclassified
- active must be classified
- primary requires active
- TAX target must exist and be `active`
- appends `business_activity_created`

---

## L. Classification actions

`classifyBusinessActivity`:

- explicit Organization + activity ownership
- archived cannot be reclassified
- taxonomy node exists and is active
- typed XOR update
- no Context auto-assigned
- active pin blocks reclassification (`CONTEXT_INCOMPATIBLE`)
- same classification is an idempotent no-op
- appends `business_activity_classified` only when state changes

Onboarding `organizations.business_type` is not used.

---

## M. Primary action

`setPrimaryBusinessActivity`:

- target owned, status `active`
- atomically clears previous primary
- same primary is an idempotent no-op
- appends `primary_activity_changed` only when changed
- zero primary remains valid
- no permission / entitlement / Social side effects

---

## N. Assignment / change action

`assignContextVersion` / `changePinnedContextVersion`:

- classified activity, published version, exact TAX kind+target match, `internal_qa` readiness
- same exact version is an idempotent no-op
- change supersedes old assignment **without** mutating `context_pack_version_id`, then inserts the new active pin, then appends `context_version_changed`
- no auto-follow latest
- no ancestor fallback

---

## O. Archive action

`archiveBusinessActivity`:

- owned activity, operator authorized
- already archived is an idempotent no-op
- active pin is superseded in the same transaction
- primary is cleared
- status becomes `archived`
- rows are not deleted
- appends `business_activity_archived`

This matches 1B: archived activities cannot receive a **new** pin; supersede is an UPDATE of an existing assignment.

---

## P. Readiness-mode policy

Only `internal_qa` exists in 1C.

Allowed: `context_ready`, `beta_supported`, `production_verified`.

Rejected: `planned`, missing readiness.

Readiness is not mutated. Readiness is not stored as a second canonical truth on the assignment row.

---

## Q. Structural compatibility double validation

Application service validates exact `classification.kind` + `targetId` against Context pack kind + target **before** RPC.

Database 1B integrity trigger validates again on INSERT of a new assignment.

No ancestor fallback. No closest Context. No Course Seller fallback.

---

## R. Audit events

Every real state change writes one event in the same transaction:

- `business_activity_created`
- `business_activity_classified`
- `context_version_assigned`
- `context_version_changed`
- `primary_activity_changed`
- `business_activity_archived`

Idempotent no-ops write **no** extra event. Payload is descriptive JSON. Canonical truth stays on activity/assignment rows.

---

## S. Idempotency

| Action | No-op when |
| --- | --- |
| classify | XOR already matches |
| set primary | target already primary |
| assign | same exact version already active |
| change | same exact version already active |
| archive | already archived |

---

## T. Concurrency

`pg_catalog.pg_advisory_xact_lock(872011, hashtext(organization_id))` serializes competing mutations per Organization.

Partial unique indexes remain the hard consistency floor (one active primary, one active pin).

---

## U. Zero customer self-service

No owner/admin Server Action, no authenticated tenant assignment RPC, no onboarding submission, no BQA endpoint.

---

## V. Zero resolver

Repository/service may return classification, pinned version, pack, and readiness. They do **not** return effective capabilities, inherited mappings, resolved terminology, navigation, permissions, entitlement, or a hybrid merged Context.

---

## W. Zero UI / product wiring

No AppShell, Home, navigation, `/api/org-context`, or browser mutation client. No public feature barrel.

---

## X. Zero Production ORG-CONTEXT data mutation

Live SELECT after repository implementation (still unapplied RPC):

| Metric | Value |
| --- | --- |
| activities | 0 |
| assignments | 0 |
| events | 0 |
| organizations | 6 |
| unassigned organizations | 6 |
| `apply_organization_context_platform_mutation` exists | **false** |
| pack readiness | `context_ready` / `context_ready` |

---

## Y. Tests

New/updated coverage:

- generated-type contract for the three tables
- domain validation
- tenant-honest repository
- operator authorization
- mutation migration static contract
- service create/classify/primary/assign/change/archive/audit/idempotency
- server-only isolation
- 1B isolation updated to authorize `src/features/org-context/` only
- CONTROL-PLANE `getNodeById` additive test

Execution:

- targeted ORG-CONTEXT + isolation + CONTROL-PLANE grant/reader + TAX/CAP/CTX isolation: pass
- `npx tsc --noEmit`: pass
- `npx next lint`: pass (0 warnings)
- `npx vitest run`: **2914 passed / 2 failed / 2916 total**

Historical non-blocking failures (unchanged):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures.

---

## Z. DB-MIGRATION-DRIFT-01

Historical Social migration divergence remains. 1C did **not**:

- `db push --linked`
- `db pull` reconciliation
- migration repair
- history rewrite

Linked typegen is read-only metadata. Future Production apply of the 1C RPC must use targeted committed-file apply in ORG-CONTEXT-1C-FV.

---

## RPC typing (pre-FV boundary)

Linked Production types do not include `apply_organization_context_platform_mutation` because the function is unapplied.

Temporary adapter: `src/features/org-context/server/organization-context-rpc.ts` (`ORG_CONTEXT_PLATFORM_MUTATION_RPC` + mapped jsonb result).

`database.generated.ts` was **not** hand-edited to invent the function.

After Production apply in 1C-FV, regenerate linked types and replace this adapter if the generated `Functions` entry is then present.

---

## Minimal CONTROL-PLANE adapter

`TaxonomyRepository.getNodeById` is a one-line public alias over the existing private lookup. Required so ORG-CONTEXT can validate classification by UUID without querying TAX table names from the org-context feature. No runtime catalog behavior change beyond exposing an already-used reader method.

---

## Recommended next phases

1. **ORG-CONTEXT-1C-FV** — apply the frozen RPC; prove `service_role`-only EXECUTE; regenerate function types if required; **still no tenant rows**
2. **ORG-CONTEXT-1D** — controlled internal QA assignment journey
3. **ORG-CONTEXT-1FV** — tenant/RLS/foreign-org live verification after one authorized QA assignment

Do not combine 1C-FV tenant-row creation with 1C itself. 1C is closed as repository foundation only.
