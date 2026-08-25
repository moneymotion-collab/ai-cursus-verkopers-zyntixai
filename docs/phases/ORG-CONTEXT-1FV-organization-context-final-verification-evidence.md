# ORG-CONTEXT-1FV — Organization Context Tenant Security & Final Verification

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1FV — Organization Context Tenant Security & Final Verification** |
| Parent | ORG-CONTEXT-1D / ORG-CONTEXT-1C-FV / ORG-CONTEXT-1C-R1A / ORG-CONTEXT-1B-FV / ORG-CONTEXT-1A |
| Document type | Production final verification evidence |
| Date | 2026-08-25 |
| Formal status | `ORG-CONTEXT-1FV CLOSED WITH EVIDENCE — ORGANIZATION CONTEXT TENANT SECURITY PRODUCTION VERIFIED` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `7452d73837c4f41cf084a5169f8bdf5603b4af99` |
| Domain implementation | **none** (verification only) |
| QA assignment | **RETAINED** |

This phase executes real PostgreSQL RLS against the retained Production QA fixture. No new Organization, user, membership, Business Activity, Context assignment, or resolver was created.

**ORG-CONTEXT TENANT RLS: PRODUCTION VERIFIED**

**FOREIGN TENANT ISOLATION: PRODUCTION VERIFIED**

**ROLE READ MATRIX: PRODUCTION VERIFIED**

**PLATFORM MUTATION JOURNEY: PRODUCTION VERIFIED** (1D journey + 1FV write/RPC denial)

**QA ASSIGNMENT: RETAINED**

**CONTEXT RESOLUTION: NOT IMPLEMENTED**

**CUSTOMER ASSIGNMENT: NOT ENABLED**

**ORG-CONTEXT-1 = PRODUCTION VERIFIED**

---

## A. Repository baseline

Proven **before any Production verification**:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `7452d73837c4f41cf084a5169f8bdf5603b4af99` |
| Subject | `docs(org-context): record controlled QA assignment journey` |
| Divergence | `0 0` |
| `git status --short` | empty (clean) |

Hard gate passed. No implementation defect was found. No ORG-CONTEXT-1FV-R1 remediation.

---

## B. Production target

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Linked `supabase/.temp/project-ref` | `dmctinrcjvsgmoxwwodw` |
| Host | `db.dmctinrcjvsgmoxwwodw.supabase.co` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Canonical app | `https://www.zyntixai.com` |

Credentials are not recorded.

---

## C. ORG-CONTEXT implementation lineage

| Phase | Proven |
| --- | --- |
| ORG-CONTEXT-1A | architecture / security contract |
| ORG-CONTEXT-1B + 1B-FV | tenant schema Production verified |
| ORG-CONTEXT-1C + R1A + 1C-FV | typed repository, isolated operator authorization, transactional mutation RPC Production verified |
| ORG-CONTEXT-1D | first controlled internal QA Activity + exact Context v1 pin Production verified |

1FV adds executed tenant/RLS proof against that real fixture and formally closes ORG-CONTEXT-1.

---

## D. Retained QA fixture

Resolved live by `organization_id` + `activity_key`, not copied UUIDs as the primary lookup.

| Object | Live value |
| --- | --- |
| Organization id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Name | `ZyntixAI Production QA` |
| Status | `active` |
| Activity id | `07e6918e-6c13-437e-b698-f0f3be27e9bb` |
| activity_key | `qa_online_course_business` |
| status / primary | `active` / **true** |
| classification_kind | `niche` |
| niche | `online-course-business` |
| Assignment id | `dba4065d-b7f6-4076-b9a5-610141d41807` |
| status / source | `active` / `platform_operator` |
| Context pack | `niche.online-course-business` **v1** `published` |
| Parent | `foundation.knowledge` v1 |
| Readiness | `context_ready` / `verified_at` NULL |
| Events | **2** (`business_activity_created`, `context_version_assigned`) |

Pre-FV counts: Organizations **6**, Activities **1**, active assignments **1**, events **2**, orgs with Activities **1**, unassigned orgs **5**.

---

## E. Membership-role principals (no emails)

QA `organization_members` live counts match 1D:

| role | status | count |
| --- | --- | --- |
| owner | active | 1 |
| admin | active | 1 |
| staff | active | 2 |
| viewer | active | 4 |
| viewer | suspended | 2 |

Selected existing principals (one membership each; no membership changes):

| Probe | role / status | user_id |
| --- | --- | --- |
| QA Owner | active owner | `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| QA Admin | active admin | `77c7a60b-ab6b-4986-84b6-20b733e0d2ac` |
| QA Staff | active staff | `0844191e-a699-4aaf-beb3-24cfda2ddff2` |
| QA Viewer | active viewer | `3a81f180-c231-411d-899e-d44adf5cff47` |
| QA Suspended | suspended viewer only | `19db8e29-2e6f-4033-89a5-548bcf2ed41e` |
| Foreign Owner | active owner of `fec38060-15b1-4de8-974c-29cefe7764e1` | `33c0f6cf-1606-4d57-a044-706d33f9c051` |

Suspended principal has **no** active QA membership. Foreign principal has **no** QA membership. Emails are not recorded.

---

## F. Authenticated JWT / RLS simulation mechanism

Live helpers:

- `private.is_org_member` / `private.has_org_role` compare `om.user_id = auth.uid()` and require `status = 'active'`.
- `auth.uid()` reads `request.jwt.claim.sub` or `request.jwt.claims->>'sub'`.
- `auth.role()` reads `request.jwt.claim.role` or `request.jwt.claims->>'role'`.

MCP SQL runs as `postgres` (`rolbypassrls=true`). A CTE that only `set_config('role', 'authenticated')` is **not** sufficient for table RLS: `auth.uid()` updates, but scans still bypass RLS.

Valid harness used for every table probe:

```sql
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claims', json_build_object('sub', '<existing-user-id>', 'role', 'authenticated')::text, true);
SELECT set_config('request.jwt.claim.sub', '<existing-user-id>', true);
SELECT set_config('request.jwt.claim.role', 'authenticated', true);
-- SELECT probes --
ROLLBACK;
```

This is a transaction-local RLS execution probe. No passwords. No application-session impersonation. Every impersonation transaction rolled back.

---

## G. auth.uid / auth.role harness proof

Foreign-owner validity gate (must see **0** QA rows because the only Activity in Production belongs to QA):

| Check | Result |
| --- | --- |
| `current_user` | `authenticated` |
| `auth.uid()` | `33c0f6cf-1606-4d57-a044-706d33f9c051` (exact selected user) |
| `auth.role()` | `authenticated` |
| `rolbypassrls` for current_user | **false** |
| Activities / assignments / events | **0 / 0 / 0** |

Owner gate: `auth.uid()` = `928bbcaf-6117-4fef-84a3-d1d8611373e9`, `auth.role()` = `authenticated`, then 1/1/2 rows visible. Harness validated **before** trusting role-matrix results.

---

## H. Owner Activity read

| Check | Result |
| --- | --- |
| Activities visible | **1** |
| QA key `qa_online_course_business` | **1** |
| Cross-tenant extra rows | **0** |

---

## I. Owner assignment / history / event read

| Check | Result |
| --- | --- |
| Assignments visible | **1** |
| Active | **1** |
| Superseded | **0** |
| Events | **2** |
| Event types | `business_activity_created`, `context_version_assigned` |

---

## J. Admin read matrix

Same as owner: Activity **1**, active assignment **1**, events **2** with the same two types. `private.has_org_role(..., '{owner,admin}')` = true.

---

## K. Staff Activity / assignment read

| Check | Result |
| --- | --- |
| `is_org_member` | true |
| `has_org_role(owner,admin)` | **false** |
| Activities | **1** (`qa_online_course_business`) |
| Active assignments | **1** |

No superseded row exists, so history policy is not inferred from zero superseded rows.

---

## L. Staff event denial

Raw `organization_context_assignment_events`: **0** rows. The two retained events exist and are visible to Owner/Admin, so this is executed denial, not an empty table.

---

## M. Viewer Activity / assignment read

Activity **1**, active assignment **1**. `has_org_role(owner,admin)` = false. Viewer is not mutation authority.

---

## N. Viewer event denial

Raw events: **0** rows.

---

## O. Suspended member denial

Suspended-only principal: `is_org_member` = false. Activities **0**, assignments **0**, events **0**.

---

## P. Foreign tenant Activity denial

As a real active Owner of another Organization, targeting the **real QA row**:

| Query | Visible |
| --- | --- |
| all Activities | **0** |
| `organization_id` = QA | **0** |
| Activity id `07e6918e-…` | **0** |
| `activity_key` = `qa_online_course_business` | **0** |

Home org membership remains true (`is_org_member` on `fec38060-…` = true). Foreign Owner/Admin of their own tenant does not see QA data.

---

## Q. Foreign tenant assignment denial

Assignments **0**. Assignment id `dba4065d-…` **0**.

---

## R. Foreign tenant event denial

Events **0**. QA-org scoped events **0**.

---

## S. Repository foreign-org behavior

Frozen `OrganizationContextRepository.getBusinessActivity(foreignOrganizationId, qaActivityId)`:

1. scoped select by `(organization_id, id)` → empty
2. unscoped select by `id` → if present, `ACTIVITY_NOT_OWNED_BY_ORG`

Live analog as privileged reader (not a user-facing path):

| Lookup | Count |
| --- | --- |
| `organization_id` = foreign org AND `id` = QA Activity | **0** |
| `id` = QA Activity | **1** |

That maps to `ACTIVITY_NOT_OWNED_BY_ORG`. Existing unit test `refuses to fetch Organization A activity through Organization B` passed. No first-org fallback. No Production mutation.

---

## T. Authenticated DML denial

Catalog privileges on all three ORG-CONTEXT tables:

| Role | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| authenticated | true | **false** | **false** | **false** |
| anon | false | false | false | false |
| public | false | false | false | false |

Executed INSERT under validated authenticated Owner JWT, dummy non-QA `organization_id`, `ROLLBACK` transaction:

`42501` `permission denied for table organization_business_activities`

Denied at privilege boundary before domain integrity. After probe: Activities **1**, `fv_probe_should_fail` rows **0**. QA fixture untouched.

---

## U. Authenticated RPC denial

Under the same authenticated Owner harness, invalid/no-op `apply_organization_context_platform_mutation('create_activity', …, '{}')`:

`42501` `permission denied for function apply_organization_context_platform_mutation`

No row changes.

---

## V. Anon denial

| Probe | Result |
| --- | --- |
| `SET LOCAL ROLE anon` SELECT Activities | `42501` permission denied for table |
| anon RPC invoke | `42501` permission denied for function |
| anon EXECUTE (catalog) | **false** |

---

## W. service_role RPC privilege

| Role | EXECUTE |
| --- | --- |
| service_role | **true** |
| authenticated | **false** |
| anon | **false** |
| public | **false** |

No additional valid Production mutation was performed.

---

## X. Operator application fail-closed state

Production Vercel env listing has **neither** `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED` nor `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST`.

`parseOrgContextPlatformOperatorEnabled` requires exact `true`. Absence is fail-closed. 1FV did not enable the flag.

---

## Y. QA fixture unchanged

After all FV reads and denied write/RPC probes:

| Object | Count / state |
| --- | --- |
| Business Activities | **1** |
| QA Activity | active, primary, niche `online-course-business` |
| Active assignments | **1** |
| Same Context | Online Course Business v1 |
| Events | **2** (no FV-generated event) |
| Superseded assignments | **0** |
| Memberships | unchanged (newest `2026-08-22`) |

---

## Z. TAX / CAP / CTX / readiness / Social / Closed Beta integrity

| Check | Result |
| --- | --- |
| TAX | **1 / 4 / 22 / 1 / 0 / 0 / 2** |
| CAP | **13 / 7 / 13** |
| CTX | **2 / 2 / 10 / 4 / 2** |
| `foundation.knowledge` v1 | `context_ready`, `verified_at` NULL |
| `niche.online-course-business` v1 | `context_ready`, `verified_at` NULL |
| CONTROL-PLANE 15 catalog tables | `service_role` SELECT-only; anon/authenticated none; no DML |
| Social GUCs | unset |
| `private.social_publishing_execution_enabled()` | **false** |
| Cron | jobid 1, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active |
| Production Social env keys | present; last changed 4d ago; 1FV did not set them to `true` |
| `/register` | `307` → `/login?registration=disabled` |
| `/login` | `200` |
| Invitations | 16; newest `2026-08-22` |
| Members | 22; newest `2026-08-22` |
| QA org `updated_at` | `2026-07-23` (legacy onboarding fields unchanged) |

No resolver, entitlement, permission, Social execution, onboarding mapping, BQA, or product-UI consumer.

ORG-CONTEXT server modules are imported only inside `src/features/org-context/**`. App routes (Home, AppShell, navigation, CRM, Knowledge, Tasks, Attention, Social, Settings, Members) do not consume pinned Context.

---

## Database constraints / policies

No drift versus 1B-FV:

| Check | Live |
| --- | --- |
| RLS enabled | true on all three tables |
| FORCE RLS | **false** (frozen) |
| Policies | exactly the four SELECT policies from `20260825120010_enable_organization_context_assignment_rls.sql` |
| One active primary | `organization_business_activities_one_active_primary_uidx` |
| One active assignment | `organization_context_assignments_one_active_uidx` |
| Classification XOR | `organization_business_activities_target_cardinality_check` + `kind_target_check` |
| TAX/CTX compatibility | trigger `organization_context_assignments_enforce_integrity` |
| Event immutability | trigger `organization_context_assignment_events_guard_immutable` |

---

## Tests / static checks

| Check | Result |
| --- | --- |
| Targeted ORG-CONTEXT / operator / RPC / 1B / CONTROL-PLANE / invitations / Social | **130 passed** |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (no warnings or errors) |
| Full `npx vitest run` | **2918 passed / 2 failed / 2920 total** |

Accepted 1D baseline: 2918 / 2 / 2920. Same two historical failures only (non-blocking, not repaired):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures. No implementation commit.

---

## Production smoke

| Request | Result |
| --- | --- |
| `GET https://www.zyntixai.com/login` | `200`, `X-Matched-Path: /login` |
| `GET https://www.zyntixai.com/register` | `307` → `/login?registration=disabled` |

No product UI change. Visual owner confirmation is not required.

---

## Explicit closure state

| Object | State |
| --- | --- |
| TAX / CAP / CTX | Production verified + server readable |
| ORG-CONTEXT | **Production verified** |
| QA Organization | one retained canonical Business Activity + exact Context v1 pin |
| Other Organizations | unassigned |
| CTX readiness | `context_ready` (not `production_verified` pack runtime) |
| Context resolver | **NOT implemented** |
| BQA | **NOT implemented** |
| Customer self-service | **NOT implemented** |
| Onboarding integration | **NOT implemented** |
| Operator execution | **fail-closed** |

---

## Next phase

**CONTEXT-RESOLVER-1A — CONTEXT RESOLUTION ARCHITECTURE & SECURITY CONTRACT**

Do not modify onboarding first. Do not treat ORG-CONTEXT closure as Context Pack `production_verified` runtime.
