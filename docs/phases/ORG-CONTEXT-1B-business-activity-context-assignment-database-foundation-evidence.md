# ORG-CONTEXT-1B — Business Activity + Context Assignment Database Foundation

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1B — Business Activity + Context Assignment Database Foundation** |
| Parent | ORG-CONTEXT-1A |
| Document type | Implementation evidence (repository schema/security contract only) |
| Date | 2026-08-25 |
| Formal status | `ORG-CONTEXT-1B CLOSED WITH EVIDENCE — BUSINESS ACTIVITY + CONTEXT ASSIGNMENT DATABASE FOUNDATION IMPLEMENTED AND FROZEN` |
| Governing design | ORG-CONTEXT-1A Business Activity + Organization Context architecture |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Start HEAD | `0f37d765429d0bcd14587ac311bf5a8c07eb2f53` |
| Production | **NOT APPLIED TO PRODUCTION** |

This phase does **not** apply schema to Production, regenerate `database.generated.ts`, implement `src/features/org-context/**`, create mutation RPCs, assign any Organization, promote Context readiness, or wire UI.

**ALL EXISTING ORGANIZATIONS REMAIN UNASSIGNED IN PRODUCTION.**

---

## A. 1A architecture source

ORG-CONTEXT-1A froze the canonical grain:

**Organization → Business Activity → typed TAX classification → optional exact Context-version pin.**

Binding 1A decisions this phase implements at the database boundary:

- Organization is the tenant boundary, not the classification entity.
- Hybrid Organizations are first-class (zero or more Business Activities).
- Classification is typed TAX XOR. It is not assignment.
- Assignment stores an exact immutable `context_pack_version_id`. Pack is derived. Never latest.
- Classified + unassigned is valid. Unclassified + assigned is forbidden.
- Assignment is not entitlement, authorization, execution, or Context resolution.
- Existing Organizations may remain entirely unassigned.
- CONTROL-PLANE TAX/CAP/CTX remain global and immutable from this feature.

Do not add `organizations.context_pack_id`, `organizations.context_version_id`, `organizations.foundation_id`, `organizations.niche_id`, or equivalent shortcuts.

---

## B. Three binding implementation clarifications

### Clarification 1 — classification XOR by lifecycle

| Status | TAX targets |
| --- | --- |
| `draft` | zero **or** exactly one |
| `active` | **exactly** one |
| `archived` | zero or exactly one (preserves prior classification when present) |

Never more than one target. Draft creation does not require classification.

Enforced by:

- `organization_business_activities_target_cardinality_check` (`<= 1`)
- `organization_business_activities_kind_target_check` (kind matches populated typed FK, or all null)
- `organization_business_activities_active_classified_check` (`active` requires `classification_kind`)

### Clarification 2 — primary only when active

`is_primary = true` → `status = active`.

At most one **active** primary per Organization via partial unique index:

`organization_business_activities_one_active_primary_uidx` on `(organization_id) WHERE status = 'active' AND is_primary = true`.

Zero primary is valid. Draft/archived primary is rejected. There is no uniqueness rule over all non-archived rows that would permit a draft primary.

### Clarification 3 — structural assignment compatibility at the DB boundary

`private.enforce_organization_context_assignment_integrity()` runs `BEFORE INSERT OR UPDATE` on assignments and fails closed when a **new** pin:

- cannot find the Activity for `(organization_id, business_activity_id)`
- targets an unclassified Activity
- targets an archived Activity
- cannot find the Context version
- points at a version whose `publication_status` is not `published`
- has mismatched `pack_kind` / TAX target (no ancestor fallback)

The trigger does not grant entitlement, change readiness, resolve Context, or auto-select another version.

---

## C. Repository baseline

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `0f37d765429d0bcd14587ac311bf5a8c07eb2f53` |
| Subject | `docs(control-plane): record Production read verification` |
| Divergence | `0 0` |
| Worktree at start | clean |

Hard gate passed before any 1B file was added.

---

## D. Existing tenant / RLS / audit precedents

Inspected and followed:

| Precedent | Source | Applied as |
| --- | --- | --- |
| Composite `(organization_id, id)` uniqueness | `20260705160000_add_organization_members_tenant_anchor.sql` | unique `(organization_id, id)` on all three new tables |
| Tenant-honest composite FKs | invitations, members | assignment/event FKs to `(organization_id, id)` |
| Status as `text` + CHECK, not Postgres ENUM | invitations, CTX | activity/assignment/event/source CHECKs |
| Partial unique indexes | invitations pending uniqueness | one active primary; one active assignment |
| `private.is_org_member` / `private.has_org_role` | `20260705150003_add_foundation_helpers.sql` | SELECT policies; active membership only |
| Deny-by-default RLS then later SELECT grants | invitations schema + operational RLS | schema migration revokes + enables RLS with zero policies; companion grants policies |
| Authenticated SELECT, no authenticated writes | invitations | SELECT policies only |
| Append-only events + immutability trigger | `private.guard_organization_invitation_event_immutable` | same pattern; also blocks DELETE |
| `SECURITY DEFINER` + `search_path = ''` | invitation guards, helpers | all three private ORG-CONTEXT functions |
| EXECUTE revoke from public/anon/authenticated/service_role | invitation event guard | integrity/immutability functions are not RPCs |
| `public.set_updated_at` | tenant tables | activities + assignments |
| Actor user `ON DELETE SET NULL` | invitation `accepted_by_user_id` | `actor_user_id` → `profiles` |
| Actor member composite `ON DELETE RESTRICT` | invitation events | `actor_member_id` cannot SET NULL without nulling `organization_id` |
| TAX/CTX XOR typed FKs + `ON DELETE RESTRICT` | CTX packs | activity classification FKs |
| Explicit `service_role` table grants, not `GRANT ALL ON ALL TABLES` | CONTROL-PLANE-READ-1B | limited DML on the three tenant tables only |

`pg_advisory_xact_lock` is used in some mutation RPCs elsewhere. 1B does **not** add advisory locks; unique indexes are the concurrency floor. 1C may add per-Organization advisory locks inside a future transactional RPC.

---

## E. Exact new tables

| Table | Purpose |
| --- | --- |
| `public.organization_business_activities` | Tenant Business Activity identity, lifecycle, primary flag, typed TAX classification |
| `public.organization_context_assignments` | Exact immutable Context version pin history (`active` / `superseded`) |
| `public.organization_context_assignment_events` | Append-only governance events |

No fourth generic JSON/context-state table. No resolver snapshot table.

### Migration files

| File | SHA-256 |
| --- | --- |
| `supabase/migrations/20260825120000_create_organization_context_assignment_foundation.sql` | `0B09529A5B8132908C0A9416840221408F15C7FBF81BEC7C641C432310DFD6B0` |
| `supabase/migrations/20260825120010_enable_organization_context_assignment_rls.sql` | `C80E9A15192971E679CA7BC17A41E0CCC83BB7A768E910F1F6E5F2564D60A6E0` |

Decomposition rationale: invitation/CONTROL-PLANE precedent splits schema from privilege hardening. Migration A creates tables, CHECKs, FKs, indexes, integrity triggers, and deny-by-default RLS/revokes. Migration B adds SELECT policies and the exact grant matrix. Both remain additive. No backfill.

---

## F. Business Activity identity / lifecycle

| Column | Contract |
| --- | --- |
| `id` | UUID PK `gen_random_uuid()` |
| `organization_id` | Tenant owner; `ON DELETE RESTRICT` |
| `activity_key` | System/application-generated; unique per Organization; `lower(btrim)` + `^[a-z][a-z0-9_]*$` length 2–64; not a TAX key; not `display_name` |
| `display_name` | Tenant business identity; trimmed length 2–100 |
| `status` | `draft` \| `active` \| `archived` |
| `is_primary` | Default UX relevance only; not authorization |
| `classification_kind` + typed TAX FKs | Canonical classification XOR |
| `created_at` / `updated_at` | `set_updated_at` on UPDATE |

Identity freeze on UPDATE: `id`, `organization_id`, and `activity_key` are immutable (`private.enforce_organization_business_activity_identity`).

Two Activities in the same Organization may share a TAX classification. There is no unique `(organization_id, niche_id)`.

---

## G. Classification XOR

Typed FKs only:

- `foundation_id` → `taxonomy_foundations`
- `industry_id` → `taxonomy_industries`
- `niche_id` → `taxonomy_niches`
- `specialization_id` → `taxonomy_specializations`
- `deep_specialization_id` → `taxonomy_deep_specializations`

All `ON DELETE RESTRICT`. No generic `taxonomy_type` / `taxonomy_id`. No copied ancestor chain.

| Case | Result |
| --- | --- |
| draft + no target | PASS |
| draft + exactly one matching target | PASS |
| draft + two targets | FAIL cardinality |
| active + zero targets | FAIL active-classified |
| active + exactly one matching target | PASS |
| active + two targets | FAIL cardinality |
| archived + zero or one | PASS |
| `kind=niche` + `industry_id` populated | FAIL kind/target |

---

## H. Active / primary constraints

- `is_primary = false OR status = 'active'`
- Partial unique: at most one row per Organization with `status = 'active' AND is_primary = true`
- Zero primary is valid
- Draft primary FAIL
- Archived primary FAIL
- Two Organizations may each have one active primary

---

## I. Assignment version pin

`organization_context_assignments.context_pack_version_id` → `public.context_pack_versions.id` `ON DELETE RESTRICT`.

Do **not** store `context_pack_id` as a second canonical truth. Pack is derived: version → pack → typed TAX target.

Do not store `latest_version`, `auto_upgrade`, or `resolved_version`.

Statuses: `active` | `superseded`. No draft assignment. No scheduled assignment.

`superseded_at` is null iff `status = 'active'`, not null iff `status = 'superseded`.

New rows must be `active`. The only allowed UPDATE is `active` → `superseded` with pin identity frozen.

---

## J. Assignment structural compatibility

Tenant-honest FK:

`(organization_id, business_activity_id)` → `organization_business_activities(organization_id, id)` `ON DELETE RESTRICT`.

Integrity trigger additionally verifies, for INSERT:

1. Activity exists for that Organization (forged `organization_id` cannot attach a foreign Activity).
2. Activity is classified.
3. Activity is not archived.
4. Context version exists (join `context_pack_versions` → `context_packs`).
5. New pin `publication_status = published`.
6. `pack_kind` equals `classification_kind`.
7. Pack TAX target UUID equals Activity TAX target UUID. Niche X cannot pin Foundation Y even if Y is X's ancestor.

| Case | Result |
| --- | --- |
| Niche Activity X + published Niche X version | PASS (when fixtures exist) |
| Niche Activity X + Niche Y version | FAIL target mismatch |
| Niche Activity X + parent Foundation version | FAIL kind or target mismatch |
| Industry Activity + unrelated Foundation version | FAIL |
| Foundation Activity + matching Foundation version | PASS (when fixtures exist) |
| unclassified Activity + any assignment | FAIL |
| new assignment to draft Context version | FAIL |

Contract tests assert the SQL/trigger messages. Live fixture execution is deferred to a later FV; 1B does not mutate real CTX seed.

---

## K. Exact publication-state behavior

New pin: `publication_status` must be `published`.

Historical pin: UPDATE path returns after status/identity checks and **does not** re-validate publication. If a pinned version later moves `published → superseded` globally, the existing assignment row remains structurally valid.

This is not readiness/admission. There is no CHECK equating `context_ready` with assignability. Future 1C mutation policy may require `context_ready` (internal QA) or `beta_supported` (customer self-service) **in addition** to this structural floor.

---

## L. Active assignment uniqueness

Partial unique index `organization_context_assignments_one_active_uidx` on `(organization_id, business_activity_id) WHERE status = 'active'`.

| Case | Result |
| --- | --- |
| one active | PASS |
| one superseded + one active | PASS (insert active, then supersede old + insert new in one transaction) |
| multiple historical superseded | PASS |
| two concurrent actives for same Activity | FAIL |
| different Activities each active | PASS |

Schema permits 1C idempotency: assigning the already-active exact version is a no-op at the application layer; the unique index prevents duplicate active rows.

Atomic `changePinnedContextVersion` (supersede old + insert new + append event) is **not** implementable as multiple independent PostgREST calls. **ORG-CONTEXT-1C must add a narrow `service_role`-only transactional database RPC.** 1B does not implement that RPC. The schema does not prevent it.

---

## M. Event / audit model

`organization_context_assignment_events` v1 `event_type` CHECK:

- `business_activity_created`
- `business_activity_classified`
- `context_version_assigned`
- `context_version_changed`
- `primary_activity_changed`
- `business_activity_archived`

`context_version_assigned` / `context_version_changed` require `assignment_id`.

Canonical truth stays on activity/assignment rows. `payload` is a JSON object for descriptive old/new/source metadata only. No secrets columns.

Source CHECK (text, not ENUM) on assignments and events:

`platform_operator` | `manual_owner` | `manual_admin` | `onboarding` | `bqa_confirmed` | `migration`

v1 writes use `platform_operator` without blocking later sources.

### Actor choice

| Column | FK | DELETE |
| --- | --- | --- |
| `actor_user_id` | `profiles(id)` | `SET NULL` — preserve the row if the profile is deleted |
| `actor_member_id` | `organization_members(organization_id, id)` | `RESTRICT` — composite SET NULL would also null `organization_id` |

Platform operators are not required to be Organization members. `actor_member_id` is nullable (MATCH SIMPLE). Membership is recorded when relevant; it is not fabricated.

---

## N. Append-only protection

`private.guard_organization_context_assignment_event_immutable()` raises on UPDATE or DELETE.

Trigger: `BEFORE UPDATE OR DELETE`.

`service_role` is granted `SELECT, INSERT` on events, not UPDATE/DELETE. Authenticated has no write grants. Migration-owner maintenance is not application behavior.

---

## O. RLS

RLS enabled on all three tables. FORCE false.

| Table | SELECT |
| --- | --- |
| `organization_business_activities` | active members (`owner`/`admin`/`staff`/`viewer`) via `private.is_org_member(organization_id)` |
| `organization_context_assignments` | members: `status = 'active'` only; Owner/Admin: full history via `private.has_org_role(..., array['owner','admin'])` |
| `organization_context_assignment_events` | Owner/Admin only |

Foreign Organization denied. Unauthenticated denied (no `anon` grant). No `USING (true)`. No first-org fallback. No global SELECT policy. No `organizations.status` gate.

Staff/Viewer cannot read raw event history. They may read active pins because future relevance depends on the current pin; superseded history stays Owner/Admin.

No INSERT/UPDATE/DELETE policies for `authenticated`.

---

## P. Exact table grants

Intended after future Production apply of both migrations:

| Role | Activities | Assignments | Events |
| --- | --- | --- | --- |
| `public` | none | none | none |
| `anon` | none | none | none |
| `authenticated` | SELECT | SELECT | SELECT |
| `service_role` | SELECT, INSERT, UPDATE | SELECT, INSERT, UPDATE | SELECT, INSERT |

No DELETE on any of the three. No `GRANT ALL`. No `ALL TABLES IN SCHEMA`. No default-privilege change.

Authenticated SELECT is still filtered by RLS. `service_role` bypasses RLS.

CONTROL-PLANE-READ-1 grant file `20260824210000_grant_control_plane_select_to_service_role.sql` is unchanged. `service_role` remains SELECT-only on the exact 15 TAX/CAP/CTX tables.

---

## Q. service_role blast radius

DML on the three ORG-CONTEXT tables is an explicit privileged mutation surface for later 1C platform operations.

- Browser never receives the service-role key.
- `service_role` is not user authorization.
- 1C must add operator authorization in application/RPC code.
- DB constraints and integrity triggers remain defense-in-depth.
- Events must be written atomically with domain changes (future transactional RPC).

Integrity trigger functions have EXECUTE revoked from `service_role`; they still fire as triggers.

---

## R. No authenticated writes

No `organizations_update_admin` reuse. No authenticated INSERT/UPDATE/DELETE policies or grants.

Tenant self-service mutation, if ever added, requires a later reviewed SECURITY DEFINER RPC after BQA. Not in 1B.

---

## S. No backfill

Both migrations contain **zero** `INSERT`/`UPDATE`/`DELETE`/`TRUNCATE` DML.

INSERT 0 Business Activities. INSERT 0 assignments. INSERT 0 events.

---

## T. Current six Organizations untouched

No `ALTER TABLE public.organizations`. No `UPDATE public.organizations`. No interpretation of `business_type`, Programs, Enrollments, CRM, or `onboarding_complete`.

Schema existence does not assign Context.

**ALL EXISTING ORGANIZATIONS REMAIN UNASSIGNED IN PRODUCTION.**

Production still has six Organization rows and does not yet contain these tables.

---

## U. Onboarding legacy fields untouched

Not removed, rewritten, or mapped:

- `organizations.business_type`
- `primary_audience`
- `primary_offering`
- `primary_goal`
- `team_size_band`

No trigger maps `course_seller` → `online-course-business`. Mapping is future evidence-backed work.

---

## V. Global TAX/CAP/CTX untouched

No DML on taxonomy, capabilities, context packs, versions, mappings, terminology, or readiness.

No `GRANT`/`REVOKE` on the 15 control-plane tables.

FKs from Activities/assignments **reference** global catalogs with `ON DELETE RESTRICT`. They do not mutate them.

---

## W. Pack readiness unchanged

No `context_ready` / `beta_supported` / `production_verified` in ORG-CONTEXT SQL.

Production pack readiness remains `context_ready` with `verified_at` NULL. 1B does not promote it.

---

## X. No resolver / entitlement / UI

Not created:

- `src/features/org-context/**`
- resolved Foundation+Niche capability set
- effective terminology / navigation / permission / entitlement
- `entitled` / `enabled_capabilities` / `feature_flags`
- public mutation RPC
- UI
- generated type edits

Pin means relevance input only. Existing permissions remain authorization truth.

---

## Y. DB-MIGRATION-DRIFT-01

Historical Social local vs Production timestamp divergence is unchanged.

1B did **not**:

- `db push --linked`
- migration repair
- `db pull`
- history rewrite
- MCP `apply_migration`

Future Production apply must be targeted committed-file apply of these two frozen SQL files.

---

## Z. Tests

Static/schema contract tests (this phase):

- `tests/security/organization-context-assignment-migration-security.test.ts`
- `tests/security/organization-context-assignment-runtime-isolation.test.ts`

They prove table/constraint/index/trigger/policy/grant contracts, classification XOR, primary uniqueness, assignment uniqueness, structural compatibility messages, publication-state ordering, event immutability, function EXECUTE revocation, no backfill, no `src/` consumers, Social/onboarding isolation.

Live RLS against a running database is **not** executed in 1B. That matrix is deferred to FV after schema exists in the target environment.

CONTROL-PLANE-READ, TAX, CAP, CTX, tenant/security, invitation/PATH B, and runtime-isolation suites are regression-run.

| Check | Result |
| --- | --- |
| New ORG-CONTEXT contract tests | 32 + 4 passing |
| Targeted TAX/CAP/CTX/CONTROL-PLANE/invitation/isolation | 530 passing + the same historical invitation failure |
| `npx tsc --noEmit` | pass |
| `npx next lint` | No ESLint warnings or errors |
| Full `npx vitest run` | **2867 passed / 2 failed / 2869 total** |

Previous accepted baseline: 2831 passed / 2 failed / 2833 total. Delta: **+36** from this phase’s contract tests. No new failures.

Known historical failures (unchanged, non-blocking):

1. `tests/features/invitations/load-member-administration-page.test.ts` — foreign org id
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — Progress copy

---

## Production status

**NOT APPLIED TO PRODUCTION.**

Expected Production after 1B repository freeze:

| Surface | State |
| --- | --- |
| `organizations` | 6 existing rows unchanged |
| Business Activity table | does not exist |
| Context assignment table | does not exist |
| Events table | does not exist |
| Organization Context assignments | 0 |
| CTX readiness | unchanged `context_ready` |
| CONTROL-PLANE grants | unchanged SELECT-only on 15 catalog tables |
| Product behavior | unchanged |

No MCP apply. No `db push`. No deploy.

---

## Next phase recommendation

Apply schema in a dedicated **ORG-CONTEXT-1B-FV** before ORG-CONTEXT-1C.

Reason: CONTROL-PLANE-READ-1C could typegen against catalogs that already existed in Production. These three tenant tables do **not** exist in Production yet. Linked `--linked` typegen during 1C cannot generate them until a targeted MCP apply of the frozen SQL.

Suggested sequence:

1. **ORG-CONTEXT-1B-FV** — targeted `apply_migration` of the two committed files; verify tables, RLS, grants, zero backfill, six Organizations still unassigned; no `db push`; no migration repair.
2. **ORG-CONTEXT-1C** — generated linked DB types; domain types; tenant-honest read repository; platform-operator authorization; atomic guarded mutation RPC; audit writing; idempotency; server-only tests.

1C still must not implement BQA, owner/admin self-service RPC, Context resolver, UI, or entitlement.
