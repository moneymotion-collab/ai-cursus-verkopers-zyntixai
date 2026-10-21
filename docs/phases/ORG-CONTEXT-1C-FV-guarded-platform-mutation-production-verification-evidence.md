# ORG-CONTEXT-1C-FV — Guarded Platform Mutation Boundary Production Verification

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1C-FV — Guarded Platform Mutation Boundary Production Verification** |
| Parent | ORG-CONTEXT-1C / ORG-CONTEXT-1C-R1A |
| Document type | Production verification evidence |
| Date | 2026-08-25 |
| Formal status | `ORG-CONTEXT-1C-FV CLOSED WITH EVIDENCE — GUARDED PLATFORM MUTATION BOUNDARY PRODUCTION VERIFIED` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `b64cf8a9f5852c988ed60dd870e04af0a0199fa5` |
| Mutation RPC | **PRODUCTION DEPLOYED + SECURITY VERIFIED** |
| Organization assignments | **0** |

This phase deploys infrastructure only. It does **not** create Business Activities, Context assignments, or audit events. It does **not** execute a valid mutation payload. It does **not** enable the application operator flag. It does **not** implement a resolver, customer self-service, onboarding mapping, BQA, or Social coupling.

**ORG-CONTEXT MUTATION RPC: PRODUCTION DEPLOYED + SECURITY VERIFIED**

**PRODUCTION BUSINESS ACTIVITIES: 0**

**PRODUCTION CONTEXT ASSIGNMENTS: 0**

**PRODUCTION ORG-CONTEXT EVENTS: 0**

**ALL EXISTING ORGANIZATIONS: UNASSIGNED**

**ORG-CONTEXT MUTATION JOURNEY: NOT YET PRODUCTION VERIFIED**

Do not claim ORG-CONTEXT-1 complete.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD at FV start | `b64cf8a9f5852c988ed60dd870e04af0a0199fa5` |
| Subject | `fix(org-context): isolate platform operator authorization` |
| Divergence | `0 0` |
| `git status --short` | empty (clean) |

Hard gate passed before any Production action.

---

## B. 1B-FV dependency

Live Production already had the ORG-CONTEXT-1B foundation from `ae63be94280df2069ad47e13a13696f118093135`:

| Object | Live |
| --- | --- |
| Tables | `organization_business_activities`, `organization_context_assignments`, `organization_context_assignment_events` |
| RLS | enabled on all three |
| Compatibility trigger | `organization_context_assignments_enforce_integrity` → `private.enforce_organization_context_assignment_integrity` |
| Event immutability | `organization_context_assignment_events_guard_immutable` |
| Remote ledger | `20260825093152` / `create_organization_context_assignment_foundation`; `20260825093232` / `enable_organization_context_assignment_rls` |

1B files were not edited.

---

## C. 1C implementation

Frozen at `294002b1f039b3b746cbaa2444c1f7f84e974a80`:

- typed repository + guarded mutation service
- committed RPC SQL only; **not applied in 1C**
- temporary handwritten RPC typing because linked Production types did not yet include the function

---

## D. R1A security remediation

Frozen at `b64cf8a9f5852c988ed60dd870e04af0a0199fa5`.

Application mutation authority uses:

- `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED` (fail-closed; exact `true`)
- `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST`

ORG-CONTEXT no longer consumes `SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST` or `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` for mutation authority.

Production operator env was **not** enabled in this FV. RPC deploy does not require the application flag. Operator execution remains fail-closed.

---

## E. Mutation migration hash

| Field | Value |
| --- | --- |
| Authoritative file | `supabase/migrations/20260825130000_add_organization_context_platform_mutations.sql` |
| SHA-256 | `A2F35C87BD84DE5D887271DCA76DAC36299418F400FECF00A73F85251329F205` |
| Git history | introduced in `294002b` only; R1A did not modify it |
| Recalculated before apply | match |

If the hash had differed, FV would have stopped.

---

## F. Production target

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Linked `supabase/.temp/project-ref` | `dmctinrcjvsgmoxwwodw` |
| Host | `db.dmctinrcjvsgmoxwwodw.supabase.co` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Canonical app | `https://www.zyntixai.com` |

Proven before any write. Credentials are not recorded.

---

## G. Pre-apply RPC state

| Check | Result |
| --- | --- |
| Ledger name `add_organization_context_platform_mutations` | **absent** |
| `public.apply_organization_context_platform_mutation` | **absent** (`mutation_rpc_exists = false`) |
| activities / assignments / events | **0 / 0 / 0** |
| organizations | **6**, all unassigned |
| TAX | 1 / 4 / 22 / 1 / 0 / 0 / 2 |
| CAP | 13 / 7 / 13 |
| CTX | 2 / 2 / 10 / 4 / 2 |
| Readiness | `foundation.knowledge` v1 `context_ready` / `verified_at` NULL; `niche.online-course-business` v1 `context_ready` / `verified_at` NULL |
| CONTROL-PLANE | `service_role` SELECT only on exact 15 tables |

DB-MIGRATION-DRIFT-01 left untouched. No `db push`, no repair, no `db pull`.

---

## H. Targeted migration apply

| Field | Value |
| --- | --- |
| Method | MCP `apply_migration` |
| Source file | `supabase/migrations/20260825130000_add_organization_context_platform_mutations.sql` |
| Source hash | `A2F35C87BD84DE5D887271DCA76DAC36299418F400FECF00A73F85251329F205` |
| Migration name | `add_organization_context_platform_mutations` |
| SQL | full unchanged committed file |
| `db push --linked` | **not used** |
| Manual `CREATE FUNCTION` / grant edits | **not used** |
| Result | **success** |

---

## I. Remote migration ledger

| Local file | Remote version | Name |
| --- | --- | --- |
| `20260825130000_add_organization_context_platform_mutations.sql` | `20260825102936` | `add_organization_context_platform_mutations` |

Appears **exactly once**. Remote timestamp differs from the local filename (expected under DB-MIGRATION-DRIFT-01). No ledger repair.

---

## J. Live function definition

Exactly one `pg_proc` row:

| Property | Live value |
| --- | --- |
| Schema | `public` |
| Name | `apply_organization_context_platform_mutation` |
| Identity | `p_operation text, p_organization_id uuid, p_actor_user_id uuid, p_payload jsonb` |
| Result | `jsonb` |
| Owner | `postgres` |
| Overloads | **none** |

`pg_get_functiondef` header:

```
CREATE OR REPLACE FUNCTION public.apply_organization_context_platform_mutation(...)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
```

Definition length 25059. Matches frozen committed semantics.

---

## K. SECURITY DEFINER / search_path

| Check | Live |
| --- | --- |
| `prosecdef` | **true** |
| `proconfig` | `{search_path=""}` |
| Canonical definer clause | `SECURITY DEFINER` |
| Canonical search_path | `SET search_path TO ''` (empty; Postgres form of `set search_path = ''`) |
| `SECURITY INVOKER` | **absent** |

Fully qualified object references remain. No unsafe search_path inheritance.

---

## L. auth.role service-role assertion

Live body contains:

`auth.role() is distinct from 'service_role'`

Unauthorized callers receive `UNAUTHORIZED` before domain mutation. This is defense-in-depth even if EXECUTE were later misgranted.

---

## M. EXECUTE privilege matrix

Live `proacl`: `{postgres=X/postgres,service_role=X/postgres}`

Live `has_function_privilege(..., 'EXECUTE')`:

| Role | EXECUTE |
| --- | --- |
| PUBLIC | **no** (not in ACL) |
| `anon` | **false** |
| `authenticated` | **false** |
| `service_role` | **true** |
| `postgres` (owner) | **true** |

`information_schema.routine_privileges` grantees: `postgres`, `service_role` only.

---

## N. anon / authenticated execution-probe availability

| Probe | Result |
| --- | --- |
| AUTHENTICATED RPC EXECUTION PROBE | **NOT AVAILABLE** (no safe existing authenticated session harness; users were not created) |
| ANON RPC EXECUTION PROBE | **NOT AVAILABLE** (no anon PostgREST harness used; live ACL remains authoritative) |

No valid mutation payload was sent.

---

## O. service_role authority proof

`has_function_privilege('service_role', ..., 'EXECUTE') = true`.

No valid create/assign/classify/archive operation was executed. No rollback harness was used. ACL/privilege inspection is the Production proof.

---

## P. Advisory lock

Live body contains:

`pg_catalog.pg_advisory_xact_lock(872011, pg_catalog.hashtext(p_organization_id::text))`

Per-Organization transaction lock. It supplements the primary unique index and the active-assignment unique index; it does not replace them.

---

## Q. Transaction atomicity inspection

Static live-function inspection (not executed in Production):

`change_context_version` occurs inside one function transaction, in order:

1. old active assignment → `status = 'superseded'`
2. new assignment → `INSERT` active
3. audit event → `context_version_changed`

Relative offsets in the live `change_context_version` slice: supersede 607, insert 773, event 1566.

No external multi-request coordination.

---

## R. Catalog read-only behavior

Function SELECTs TAX/CTX for validation only.

Live definition contains **no** INSERT/UPDATE/DELETE against `taxonomy_*`, `capabilit*`, or `context_pack*`.

CONTROL-PLANE `service_role` remains SELECT-only on the exact 15 tables after apply.

---

## S. Tenant write scope

Live definition writes only:

- `public.organization_business_activities`
- `public.organization_context_assignments`
- `public.organization_context_assignment_events`

No writes to `organizations`, `organization_members`, invitations, auth, CRM, Knowledge, or Social.

---

## T. Zero-data post-apply

Immediately after apply, and again at close:

| Table | Count |
| --- | --- |
| `organization_business_activities` | **0** |
| `organization_context_assignments` | **0** |
| `organization_context_assignment_events` | **0** |
| `organizations` | **6**, all unassigned |

Applying the function created zero domain data.

---

## U. Linked generated function type

| Check | Value |
| --- | --- |
| Pre-generation SHA-256 | `001200DD11B8D3726923575938F182100ECAE351B0901DE2913CBA9896A8F82B` |
| RPC before typegen | **absent** (expected pre-FV) |
| Command | `npm run supabase:types` → `supabase gen types typescript --linked` |
| Post-generation SHA-256 | `75FC555082F5BA17CD565D0851862F2F1B784B07481FAD6D952F3C0D56D29A6C` |
| Diff | **+9 / −0** |

Generated contract:

```
apply_organization_context_platform_mutation: {
  Args: {
    p_actor_user_id: string
    p_operation: string
    p_organization_id: string
    p_payload: Json
  }
  Returns: Json
}
```

Matches frozen SQL `(text, uuid, uuid, jsonb) → jsonb`. uuid maps to `string`; jsonb maps to `Json`. No unexplained destructive removals.

---

## V. Temporary adapter reconciliation

The 1C handwritten `OrgContextPlatformMutationArgs` / unapplied-function comment is gone.

`organization-context-rpc.ts` now:

- `satisfies keyof Database["public"]["Functions"]` for the function name
- `Args` / `Returns` taken from `Database["public"]["Functions"]["apply_organization_context_platform_mutation"]`
- still `import "server-only"`
- still a fixed function name (no caller-controlled `.rpc(name)`)
- still maps jsonb `activity_id` → domain camelCase

No second canonical RPC interface. No behavioral redesign.

---

## W. Operator authorization unchanged

R1A boundary remains:

1. authenticated `getUser()`
2. `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED=true`
3. dedicated `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST` membership
4. explicit Organization + explicit operation in the service

Allowlist was not moved to the database. Production operator env was left fail-closed.

---

## X. RLS / table grants unchanged

SELECT policies only (unchanged):

| Table | Policy |
| --- | --- |
| activities | member SELECT |
| assignments | member SELECT of `active` + owner/admin history |
| events | owner/admin SELECT |

| Role | Writes |
| --- | --- |
| `anon` | none |
| `authenticated` | no INSERT/UPDATE/DELETE |
| `service_role` | activities/assignments SELECT+INSERT+UPDATE; events SELECT+INSERT; **no DELETE** |

RPC apply did not add or drop table policies.

---

## Y. TAX / CAP / CTX / readiness unchanged

| Catalog | Counts after apply |
| --- | --- |
| TAX | 1 / 4 / 22 / 1 / 0 / 0 / 2 |
| CAP | 13 / 7 / 13 |
| CTX | 2 / 2 / 10 / 4 / 2 |

| Pack | readiness | verified_at |
| --- | --- | --- |
| `foundation.knowledge` v1 | `context_ready` | NULL |
| `niche.online-course-business` v1 | `context_ready` | NULL |

Mutation infrastructure availability did not promote pack readiness.

---

## Z. Social / Closed Beta safety

| Check | Result |
| --- | --- |
| GUC `zyntix.social_publishing_enabled` | unset |
| GUC `zyntix.social_scheduling_enabled` | unset |
| `private.social_publishing_execution_enabled()` | **false** |
| Cron | jobid 1, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active |
| Scheduler invoke / provider writes | none performed |
| Social operator env | independent; not used by ORG-CONTEXT |
| Registration | fail-closed; `GET /register` → `307 /login?registration=disabled` |
| PATH B / invitation allowlist | unchanged; no memberships or users created |

No QA assignment. Operator application execution remains fail-closed.

---

## Tests / static checks

| Check | Result |
| --- | --- |
| Generated function type + RPC wrapper/isolation + migration security + operator + 1B + service/repo/domain | 85 passed |
| CONTROL-PLANE / TAX / CAP / CTX / invitation / registration / Social gate | 208 passed |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (no warnings or errors) |
| Full `npx vitest run` | **2918 passed / 2 failed / 2920 total** |

Accepted R1A baseline: 2918 / 2 / 2920. Same two historical failures only (non-blocking, not repaired):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures.

---

## Production smoke

| Request | Result |
| --- | --- |
| `GET https://www.zyntixai.com/login` | `200`, `X-Matched-Path: /login` |
| `GET https://www.zyntixai.com/register` | `307` → `/login?registration=disabled` |

No records created. Product UI was not changed.

---

## Scope exclusions

- no QA Business Activity
- no Context assignment
- no mutation RPC execution that creates domain data
- no resolver
- no customer self-service
- no onboarding mapping
- no BQA
- no readiness promotion
- no catalog DML
- no Social env/config change
- no `db push` / migration repair

---

## Next phase

**ORG-CONTEXT-1D — CONTROLLED INTERNAL QA ASSIGNMENT JOURNEY**

After 1C-FV:

- ORG-CONTEXT schema: Production verified
- typed repository: implemented
- platform mutation service: implemented
- operator authorization: isolated (fail-closed)
- transactional RPC: Production deployed / security verified
- Production Business Activities: 0
- Production Context assignments: 0
- Production ORG-CONTEXT events: 0
- Context resolver: not implemented
- normal customer assignment: disabled / not implemented
- pack readiness: `context_ready`
