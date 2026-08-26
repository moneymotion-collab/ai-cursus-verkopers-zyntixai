# ORG-CONTEXT-1X-FV — Controlled Production Authority + Security Verification

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1X-FV — CONTROLLED PRODUCTION AUTHORITY + SECURITY VERIFICATION** |
| Parent | ORG-CONTEXT-1X-B implementation freeze |
| Document type | Production verification evidence |
| Date | 2026-08-26 |
| Formal status | `ORG-CONTEXT-1X-FV CLOSED WITH EVIDENCE — BQA GOVERNED MUTATION AUTHORITY PRODUCTION VERIFIED` |
| Contract | `docs/phases/ORG-CONTEXT-1X-A-bqa-governed-mutation-authority-extension-contract.md` |
| Implementation | `docs/phases/ORG-CONTEXT-1X-B-additive-governed-mutation-authority-implementation-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `f12f4d7c39b95ef4df95dfd3f04aa549e60d0012` |
| Production schema | **APPLIED** (targeted MCP apply of frozen 1X-B SQL only) |
| Production tenant mutation | **0** |

This phase production-verifies the additive ORG-CONTEXT BQA governed authority extension. It does **not** resume BQA-1F, execute a real BQA admission handoff, persist a new Activity, persist classification / lifecycle / assignment changes, create BQA handoff events, change Context readiness, change Path B, change entitlement, or change Social execution.

**ORG-CONTEXT CANONICAL WRITER: PRODUCTION VERIFIED**

**PLATFORM WRAPPER: PRODUCTION PRESERVED**

**BQA WRAPPER: PRODUCTION VERIFIED**

**BQA SOURCE: bqa_confirmed**

**PLATFORM SOURCE: platform_operator**

**BQA OWNER/ADMIN DB DEFENSE: PRODUCTION VERIFIED**

**BQA FORBIDDEN OPERATIONS: PRODUCTION VERIFIED**

**ACTIVATE_ACTIVITY: PRODUCTION VERIFIED**

**AUTO REPIN: FORBIDDEN**

**TENANT DATA MUTATION: 0**

**BQA-1F: STILL NOT IMPLEMENTED**

---

## A. Starting baseline

Proven before Production apply:

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `f12f4d7c39b95ef4df95dfd3f04aa549e60d0012` |
| Subject | `feat(org-context): add BQA governed mutation authority` |
| Divergence | `0 0` |
| Worktree | clean |

Frozen dependencies:

- ORG-CONTEXT-1 = PRODUCTION VERIFIED
- ORG-CONTEXT-1X-A = CONTRACT FROZEN
- ORG-CONTEXT-1X-B = IMPLEMENTED AND FROZEN
- BQA-1F = BLOCKED pending this FV

Hard gate passed. 1X-B was not amended.

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

## C. Migration hash

Authorized file only:

`supabase/migrations/20260826200000_extend_org_context_bqa_governed_authority.sql`

Recalculated SHA-256 before apply:

`D26D8EF97400DDE6F33A127D01B94A8A13B650E0AA3D894D777062895C9E320A`

Matches the 1X-B freeze. Frozen SQL was not edited.

---

## D. Targeted apply

DB-MIGRATION-DRIFT-01 remained active. `supabase db push`, `db reset`, migration repair, and blind `db pull` were not used.

| Check | Value |
| --- | --- |
| Mechanism | MCP `apply_migration` on project `dmctinrcjvsgmoxwwodw` |
| Local filename | `20260826200000_extend_org_context_bqa_governed_authority.sql` |
| MCP name | `extend_org_context_bqa_governed_authority` |
| Remote version | `20260826191921` |
| Remote name | `extend_org_context_bqa_governed_authority` |
| Apply result | **PASS** (`success: true`) |

Remote `schema_migrations` timestamps routinely differ from local filenames. That is expected under DB-MIGRATION-DRIFT-01 and was not repaired.

No unrelated SQL was applied.

---

## E. Canonical writer

LIVE Production function:

`private.apply_organization_context_mutation(p_source text, p_operation text, p_organization_id uuid, p_actor_user_id uuid, p_payload jsonb)`

| Check | Result |
| --- | --- |
| Overloads | one |
| Owner | `postgres` |
| `SECURITY DEFINER` | true |
| `search_path` | `""` |
| ACL | `{postgres=X/postgres}` |
| Dependencies | wrappers call this implementation only |

Public wrappers contain no duplicated classify / assign / activate transition SQL. The BQA wrapper mentions `classify_activity` only as an allowlist literal before forwarding to the canonical writer.

---

## F. Platform wrapper

LIVE Production function:

`public.apply_organization_context_platform_mutation(p_operation text, p_organization_id uuid, p_actor_user_id uuid, p_payload jsonb)`

Four-argument signature is unchanged from pre-extension Production. Source is fixed internally to `platform_operator`. There is no source argument. `p_payload->>'source'` is not read (`payload_source_pos = 0`).

---

## G. BQA wrapper

LIVE Production function:

`public.apply_organization_context_bqa_mutation(p_operation text, p_organization_id uuid, p_actor_user_id uuid, p_payload jsonb)`

Same governed 4-argument shape. Source is fixed internally to `bqa_confirmed`. No source parameter. Payload source is ignored. Owner/Admin membership is checked in the wrapper and again in the canonical writer. Operation allowlist exists in both layers.

---

## H. Fixed-source proof

Evidence level: **LIVE function body** + **LIVE no-op with spoofed payload**.

| Wrapper | Payload `source` | Observed authority |
| --- | --- | --- |
| BQA | `platform_operator` | still `bqa_confirmed` path (Owner classify no-op authorized) |
| Platform | `bqa_confirmed` | still platform activate no-op; wrapper never mentions `bqa_confirmed` |

Neither wrapper reads `p_payload->>'source'`. Canonical writer accepts `p_source` only from the wrapper call. Unknown payload source cannot choose authority.

A transaction-local write that would have shown event `source` after a spoofed payload was not executed: Auto-review blocked synthetic INSERT + RAISE EXCEPTION rollback. Protocol option B (live body + frozen 1X-B tests) is used for write-time provenance. Memory confirmed-mutation tests hardcode event `source: "bqa_confirmed"`.

---

## I. Grants / security

LIVE `has_function_privilege`:

| Function | PUBLIC | anon | authenticated | service_role | owner (`postgres`) |
| --- | --- | --- | --- | --- | --- |
| `public.apply_organization_context_platform_mutation` | no | no | no | **EXECUTE** | yes |
| `public.apply_organization_context_bqa_mutation` | no | no | no | **EXECUTE** | yes |
| `private.apply_organization_context_mutation` | no | no | no | **no** | yes |

Private canonical EXECUTE is wrappers-only. SECURITY DEFINER wrappers owned by `postgres` may call the helper. Schema name was not treated as the security boundary.

MCP SQL session is `postgres` with `auth.role() = null` until `request.jwt.claim.role = service_role` is set. Wrapper `auth.role()` checks JWT role, not `current_user`. Live probes used that established Production JWT GUC, matching how `auth.role()` actually identifies `service_role`.

---

## J. BQA Owner/Admin authority

Evidence level: **LIVE**.

Existing QA membership rows were used. No users or roles were created or modified.

| Actor | Operation | Result |
| --- | --- | --- |
| Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9` | `classify_activity` same TAX `9831efc8-b7ce-4726-be96-f5a061f21951` | `ok: true`, `idempotent: true`, `event_id: null` |
| Admin `77c7a60b-ab6b-4986-84b6-20b733e0d2ac` | same classify | `ok: true`, `idempotent: true`, `event_id: null` |
| Owner | `activate_activity` on already-active QA Activity | `ok: true`, `idempotent: true`, `event_id: null` |
| Owner | `assign_context_version` exact pin `1b942da6-9472-4520-a004-3d68096b44ff` | `ok: true`, `idempotent: true`, assignment id unchanged `dba4065d-b7f6-4076-b9a5-610141d41807` |

ORG-CONTEXT event count remained **2** across these probes.

---

## K. Staff / Viewer / suspended / foreign denial

Evidence level: **LIVE**.

Real membership rows, BQA wrapper, allowed operation `classify_activity`, JWT `service_role` executor:

| Actor | Role / status | Result |
| --- | --- | --- |
| `0844191e-a699-4aaf-beb3-24cfda2ddff2` | active Staff | `ACTOR_NOT_AUTHORIZED` |
| `3a81f180-c231-411d-899e-d44adf5cff47` | active Viewer | `ACTOR_NOT_AUTHORIZED` |
| `19db8e29-2e6f-4033-89a5-548bcf2ed41e` | suspended Viewer | `ACTOR_NOT_AUTHORIZED` |
| `f834c070-d1f9-46d4-b91d-1975fd7c352a` | active Owner of foreign org `02016e91-7237-4a20-aec3-6275d2e8a67f` | `ACTOR_NOT_AUTHORIZED` |

Zero mutation. Sessions were not manufactured.

---

## L. service_role separation

Evidence level: **LIVE**.

The Staff classify probe above was executed with `request.jwt.claim.role = service_role`. Result was still `ACTOR_NOT_AUTHORIZED`.

`service_role` execution ≠ BQA business authority. Active Owner/Admin membership is required.

---

## M. Operation allowlist

LIVE BQA wrapper permits only:

- `classify_activity`
- `activate_activity`
- `assign_context_version`

Unknown operation `not_a_real_operation` → `FORBIDDEN_OPERATION`.

Canonical writer repeats the same BQA allowlist before any DML.

---

## N. Forbidden-operation denial

Evidence level: **LIVE**. QA Owner actor. Failures occur in the BQA wrapper before canonical DML.

| Operation | Result |
| --- | --- |
| `create_activity` | `FORBIDDEN_OPERATION` |
| `set_primary` | `FORBIDDEN_OPERATION` |
| `change_context_version` | `FORBIDDEN_OPERATION` |
| `archive_activity` | `FORBIDDEN_OPERATION` |

After these calls: activities **1**, ORG-CONTEXT events **2**, superseded assignments **0**.

---

## O. activate_activity

LIVE:

- Canonical writer contains `activate_activity`.
- BQA wrapper allowlist includes it.
- Platform wrapper forwards all canonical operations, including `activate_activity`.
- Owner BQA activate on retained active QA Activity: idempotent, no `business_activity_activated` event.

Application platform service `OrganizationContextService.activateBusinessActivity` still calls `requireOperator()` then `invokeOrgContextPlatformMutation` only.

---

## P. Activation event

LIVE constraint `organization_context_assignment_events_event_type_check` allows `business_activity_activated`.

LIVE constraint `organization_context_assignment_events_source_check` allows `platform_operator` and `bqa_confirmed`.

Canonical writer writes `business_activity_activated` only on actual draft→active. Active→active returns `idempotent: true` with `event_id: null`.

No persistent activation event was created. Retained events remain:

1. `business_activity_created` / `platform_operator`
2. `context_version_assigned` / `platform_operator`

Draft→active / unclassified fail / archived fail: **STRUCTURAL** live body + **TEST** `tests/features/org-context/organization-context.service.test.ts` and confirmed-mutation tests. A transaction-local synthetic INSERT fixture was not run because Auto-review blocked Production INSERT even when the script intended RAISE EXCEPTION rollback. Protocol section 22 option B is used.

---

## Q. Classification mismatch protection

Evidence level: **LIVE**.

BQA `classify_activity` with different existing TAX foundation `e02402c8-6869-41a1-ab3c-023cfe3a5647` (`knowledge`) against the already-classified QA Activity:

`ACTIVITY_CLASSIFICATION_MISMATCH`

QA classification remained `niche` / `9831efc8-b7ce-4726-be96-f5a061f21951`. No classify event.

Same TAX is idempotent (Owner/Admin LIVE). Platform overwrite-without-pin semantics remain in the canonical writer for `platform_operator` only; this FV did not persist a platform reclassify.

---

## R. Assignment / repin protection

| Case | Evidence | Result |
| --- | --- | --- |
| Same exact active pin | **LIVE** | idempotent; assignment id unchanged |
| Different pack (foundation v1 `3f42e003-6df3-4344-9941-8a1afe9bb329`) | **LIVE** | `CONTEXT_INCOMPATIBLE`; no supersession |
| Different version of the same pack | **LIVE SQL** `CONTEXT_REPIN_REQUIRED` when `p_source = 'bqa_confirmed'` + **TEST** `tests/features/org-context/confirmed-mutation.service.test.ts` | no auto-repin; BQA wrapper never calls `change_context_version` |

No Production same-pack v2 row exists. A rolled-back synthetic version insert was not executed. Auto-repin count: **0**.

---

## S. Platform compatibility

| Check | Result |
| --- | --- |
| Platform wrapper signature | unchanged 4-arg |
| Application still calls `requireOperator()` | yes, including `activateBusinessActivity` |
| Platform operations | preserved; wrapper forwards to canonical writer |
| Source | `platform_operator` |
| Assignment / reclassification semantics | platform branch unchanged (`MUTATION_FAILED` on different pin, not `CONTEXT_REPIN_REQUIRED`) |
| Callers needing a source argument | none |

---

## T. Transaction semantics

LIVE function bodies contain **no** `COMMIT` and **no** `ROLLBACK`. Nested plpgsql shares the caller transaction. Advisory lock is `pg_advisory_xact_lock` (transaction-scoped).

Multiple BQA wrapper calls ran in one SQL statement/CTE chain (Owner classify → Admin classify → activate → assign) without lock errors. Reacquisition of `872011` in the same transaction is safe.

Important frozen truth, unchanged:

returning `{ ok: false }` does **not** automatically roll back prior successful operations.

Future BQA-1F wrapper MUST inspect nested results and `RAISE` on failure to abort the outer transaction. No 1F implementation was added in this FV.

---

## U. Lock semantics

LIVE canonical writer still takes transaction-scoped lock **872011** hashed on organization id.

`872012` is not taken by this writer. Future frozen dual-lock order remains **872011 → 872012**. No runtime 1F code exists.

---

## V. Typegen

After apply, linked Production types were regenerated with `npm run supabase:types` (`supabase gen types typescript --linked > src/types/database.generated.ts`). No hand-edit of generated output.

Diff is exactly the public BQA wrapper:

```
apply_organization_context_bqa_mutation: {
  Args: { p_actor_user_id, p_operation, p_organization_id, p_payload: Json }
  Returns: Json
}
```

Private `apply_organization_context_mutation` does not appear (generator/schema scope). No unrelated destructive type drift.

---

## W. Zero tenant mutation

Post-probe Production re-read matches pre-apply exactly.

| Field | Pre-apply | Post-probe |
| --- | --- | --- |
| Organizations | 6 | 6 |
| QA Activity | `07e6918e-6c13-437e-b698-f0f3be27e9bb` | same |
| Status | `active` | `active` |
| Primary | true | true |
| Classification | niche `online-course-business` / `9831efc8-…` | same |
| Active assignment | `dba4065d-b7f6-4076-b9a5-610141d41807` | same |
| Context version | `1b942da6-9472-4520-a004-3d68096b44ff` | same |
| Assignment source | `platform_operator` | `platform_operator` |
| Superseded assignments | 0 | 0 |
| ORG-CONTEXT events | 2 | 2 |
| BQA fixture | 1 / 3 / 2 / 10 / 2 / 2 / 0 | 1 / 3 / 2 / 10 / 2 / 2 / 0 |

No new BQA handoff events. No persistent activation / classify / assignment event.

**TENANT DATA MUTATION DELTA = 0**

---

## X. Context readiness

| Pack | Status | `verified_at` |
| --- | --- | --- |
| `foundation.knowledge` | `context_ready` | NULL |
| `niche.online-course-business` | `context_ready` | NULL |

**CONTEXT READINESS MUTATION = 0**

---

## Y. TAX / CAP / CTX

Unchanged:

- TAX: 1 / 4 / 22 / 1 / 0 / 0 / 2
- CAP: 13 / 7 / 13
- CTX: 2 / 2 / 10 / 4 / 2

No catalog DML. `context_pack_versions` remains 2.

---

## Z. Path B

LIVE browser: `GET https://www.zyntixai.com/register` → `https://www.zyntixai.com/login?registration=disabled` with copy “Public registration is currently unavailable.”

No user, membership, or invitation rows were created or modified by this FV. QA org membership inventory used for probes was read-only.

---

## AA. Entitlement

The 1X-B migration replaces functions and extends an event-type CHECK. It does not grant permissions, change roles, subscriptions, entitlements, or feature flags.

Authority extension gives a future mutation capability only. It does not admit or enable product use.

---

## AB. Social

| Check | Result |
| --- | --- |
| Cron | unchanged: job `1` `zyntixai_social_publication_scheduler_5m` `*/5 * * * *` active |
| Migration Social flags | none |
| Provider write attributable to this extension | **0** |
| Publishing / scheduling enablement | not mutated this phase; execute paths remain fail-closed unless env is exact `true` |

---

## AC. Product isolation

No BQA-1F server handoff, onboarding, UI, public API, Server Action, or browser hook.

`OrganizationContextConfirmedMutationService` remains `server-only`. `src/app` does not import it. `src/features/business-qualification` does not call it.

No `skipOperatorCheck`, `bypassOperator`, `usePlatformAuthority`, or caller-selected source flag in ORG-CONTEXT sources.

---

## AD. Tests

| Suite | Result |
| --- | --- |
| 1X-B authority isolation + migration security | pass |
| ORG-CONTEXT domain / service / repository / operator | pass |
| Confirmed-mutation authority + service | pass |
| Generated Production types | pass |
| Platform mutation security | pass |
| BQA 1D / 1E isolation and support-admission security | pass |
| Control Plane | pass |
| Context Resolver | pass |
| Path B / invitation security + feature gate | pass |
| `npx tsc --noEmit` | pass |
| `npx next lint` | pass (0 warnings) |
| `npx vitest run` | **3133 passed / 2 failed / 3135 total** |

Only accepted historical failures:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No new failures.

---

## AE. Final git state

Recorded after typegen + type reconciliation + this evidence document are committed and pushed:

| Check | Expected |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

Typegen commit: `95a1072` `chore(org-context): sync governed authority Production types`

Evidence commit: this document (`docs(org-context): record governed authority Production verification`)

1X-B commit `f12f4d7c39b95ef4df95dfd3f04aa549e60d0012` was not amended. No force push.

---

## Explicit freeze lines

```
ORG-CONTEXT CANONICAL WRITER:
PRODUCTION VERIFIED

PLATFORM WRAPPER:
PRODUCTION PRESERVED

BQA WRAPPER:
PRODUCTION VERIFIED

BQA SOURCE:
bqa_confirmed

PLATFORM SOURCE:
platform_operator

BQA OWNER/ADMIN DB DEFENSE:
PRODUCTION VERIFIED

BQA FORBIDDEN OPERATIONS:
PRODUCTION VERIFIED

ACTIVATE_ACTIVITY:
PRODUCTION VERIFIED

AUTO REPIN:
FORBIDDEN

TENANT DATA MUTATION:
0

BQA-1F:
STILL NOT IMPLEMENTED
```

```
ORG-CONTEXT-1X-FV CLOSED WITH EVIDENCE — BQA GOVERNED MUTATION AUTHORITY PRODUCTION VERIFIED
ORG-CONTEXT BQA GOVERNED AUTHORITY = PRODUCTION VERIFIED
BQA-1F = UNBLOCKED / AUTHORIZED
```

Recommended next phase: **BQA-1F-R — RESUME GOVERNED ACTIVITY + CONTEXT ASSIGNMENT HANDOFF IMPLEMENTATION**. Do not execute a Production handoff automatically. The retained QA Activity is already classified, active, and pinned, so it is not a sufficient first-time-handoff fixture.
