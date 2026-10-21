# ORG-CONTEXT-1X-B — Additive Governed Mutation Authority Implementation

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1X-B — ADDITIVE GOVERNED MUTATION AUTHORITY IMPLEMENTATION** |
| Parent | ORG-CONTEXT-1X-A contract freeze |
| Document type | Implementation evidence (database + server; no Production apply) |
| Date | 2026-08-26 |
| Formal status | `ORG-CONTEXT-1X-B CLOSED WITH EVIDENCE — ADDITIVE BQA GOVERNED MUTATION AUTHORITY IMPLEMENTED AND FROZEN` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `24b7d633142437e60f92b5ac94a5ae91f97abc96` |
| Contract | `docs/phases/ORG-CONTEXT-1X-A-bqa-governed-mutation-authority-extension-contract.md` |
| Migration | `supabase/migrations/20260826200000_extend_org_context_bqa_governed_authority.sql` |
| Migration SHA-256 | `D26D8EF97400DDE6F33A127D01B94A8A13B650E0AA3D894D777062895C9E320A` |
| Production apply | **NOT PERFORMED** |
| Production tenant mutation | **0** (this phase did not contact Production data) |

**ORG-CONTEXT CANONICAL MUTATION IMPLEMENTATION: ONE**

**PLATFORM MUTATION WRAPPER: PRESERVED**

**BQA MUTATION WRAPPER: IMPLEMENTED**

**BQA SOURCE: bqa_confirmed**

**PLATFORM SOURCE: platform_operator**

**BQA OWNER/ADMIN DB DEFENSE: IMPLEMENTED**

**ACTIVATE_ACTIVITY: IMPLEMENTED**

**BQA CHANGE_CONTEXT_VERSION: FORBIDDEN**

**AUTO REPIN: FORBIDDEN**

**BQA-1F: NOT IMPLEMENTED**

**PRODUCTION APPLY: NOT PERFORMED**

---

## A. Starting baseline

Proven before any 1X-B file was added:

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `24b7d633142437e60f92b5ac94a5ae91f97abc96` |
| Subject | `docs(org-context): freeze BQA mutation authority extension` |
| Divergence | `0 0` |
| Worktree | clean |

ORG-CONTEXT-1 = PRODUCTION VERIFIED. ORG-CONTEXT-1X-A = CLOSED / CONTRACT FROZEN. BQA-1F = BLOCKED pending this extension.

---

## B. 1X-A frozen dependency

Binding 1X-A decisions were not reopened:

- one canonical writer
- two fixed-source wrappers
- no caller-selected source
- `service_role` is executor only
- `bqa_confirmed` requires active Owner/Admin
- BQA ops: classify / activate / assign
- BQA forbidden: create / set_primary / change_context_version / archive
- no auto-repin
- `activate_activity` added
- platform path preserved
- no generic bypass

---

## C. Migration

Additive file only. Applied 1B/1C/BQA-1C/1D/1E SQL was not edited.

| Item | Value |
| --- | --- |
| Filename | `20260826200000_extend_org_context_bqa_governed_authority.sql` |
| SHA-256 | `D26D8EF97400DDE6F33A127D01B94A8A13B650E0AA3D894D777062895C9E320A` |
| 1C platform migration hash (unchanged) | `A2F35C87BD84DE5D887271DCA76DAC36299418F400FECF00A73F85251329F205` |
| 1B schema hash (unchanged) | `0B09529A5B8132908C0A9416840221408F15C7FBF81BEC7C641C432310DFD6B0` |

Contents:

1. Expand event-type CHECK with `business_activity_activated`
2. `private.apply_organization_context_mutation(p_source, p_operation, p_organization_id, p_actor_user_id, p_payload)`
3. `CREATE OR REPLACE` existing 4-arg platform wrapper (source fixed `platform_operator`)
4. New `public.apply_organization_context_bqa_mutation` (source fixed `bqa_confirmed`)
5. Exact GRANT/REVOKE

No `db push`, no repair, no MCP apply.

---

## D. Canonical writer

`private.apply_organization_context_mutation` owns all transitions:

`create_activity` · `classify_activity` · `activate_activity` · `set_primary` · `assign_context_version` · `change_context_version` · `archive_activity`

- `SECURITY DEFINER`, `search_path = ''`
- Source must be `platform_operator` or `bqa_confirmed`; unknown/null fail closed (`UNAUTHORIZED`)
- `p_payload->>'source'` is never read
- Stamps assignment and event `source` from `p_source`
- Lock `872011` unchanged
- Nested calls share the caller transaction; `ok: false` does not roll back prior DML (documented for 1F abort-via-RAISE)

EXECUTE revoked from `public`, `anon`, `authenticated`, and `service_role`. Wrappers call it as the function owner.

---

## E. Platform wrapper

`public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb)` signature **unchanged**.

Thin wrapper: `service_role` gate, then canonical with `'platform_operator'`. Existing `OrganizationContextService` callers need no invocation-shape change. `requireOperator()` remains on every platform method.

---

## F. BQA wrapper

`public.apply_organization_context_bqa_mutation(text, uuid, uuid, jsonb)`

- Same argument shape as the platform wrapper (no source parameter, no member id parameter)
- `service_role` executor gate
- Actor must map to an **active** `owner` or `admin` membership in the Organization (`ACTOR_NOT_AUTHORIZED` otherwise)
- Operation allowlist before canonical call (`FORBIDDEN_OPERATION` otherwise)
- Canonical invoked with `'bqa_confirmed'`
- Canonical repeats Owner/Admin + allowlist (defense-in-depth)

Does not inspect support assessments, admission decisions, rollout, or readiness policy.

---

## G. Fixed-source architecture

| Wrapper | Internal source | Payload `source` |
| --- | --- | --- |
| platform | `platform_operator` | ignored |
| BQA | `bqa_confirmed` | stripped in the named TypeScript method; ignored in SQL |

No `p_source` argument on public wrappers. No generic bypass flag.

---

## H. BQA Owner/Admin DB defense

Staff, Viewer, suspended, foreign, and missing actors fail at the BQA wrapper **and** again in the canonical writer when `p_source = bqa_confirmed`. `service_role` plus a Staff `p_actor_user_id` is insufficient.

Platform membership lookup remains optional and role-blind (ORG-CONTEXT-1 preserved).

---

## I. Operation allowlist

| Operation | Platform | BQA wrapper / canonical `bqa_confirmed` |
| --- | --- | --- |
| `classify_activity` | yes | yes (mismatch fails) |
| `activate_activity` | yes | yes |
| `assign_context_version` | yes | yes (different pin → `CONTEXT_REPIN_REQUIRED`) |
| `create_activity` | yes | **FORBIDDEN_OPERATION** |
| `set_primary` | yes | **FORBIDDEN_OPERATION** |
| `change_context_version` | yes | **FORBIDDEN_OPERATION** |
| `archive_activity` | yes | **FORBIDDEN_OPERATION** |
| unknown | `MUTATION_FAILED` | **FORBIDDEN_OPERATION** |

TypeScript `OrgContextBqaMutationOperation` does not include the forbidden operations. Database remains the second line of defense.

---

## J. `activate_activity`

| From | Result |
| --- | --- |
| draft + classified | `active` + `business_activity_activated` |
| already active | idempotent, no event |
| draft unclassified | `ACTIVITY_NOT_CLASSIFIED` |
| archived | `ACTIVITY_ARCHIVED` |

No primary, Context pin, entitlement, or permission side effect.

Platform `OrganizationContextService.activateBusinessActivity` still requires `requireOperator()`.

---

## K. Activation event

Event-type CHECK now includes `business_activity_activated`. Source matches `p_source`. Idempotent active→active emits no second event.

---

## L. BQA classification mismatch

Unclassified → apply exact TAX. Same TAX → idempotent. Different existing TAX → `ACTIVITY_CLASSIFICATION_MISMATCH`, no overwrite, no Context mutation.

Platform classify-without-pin overwrite is **unchanged**.

---

## M. BQA Context assignment

No pin → insert with `source = bqa_confirmed`. Same pin → idempotent. Different pin → `CONTEXT_REPIN_REQUIRED`, no supersession.

---

## N. No auto-repin

BQA wrapper rejects `change_context_version` before canonical mutation. Assign-different-pin never falls through to change.

---

## O. Source / event provenance

Canonical assignment and event inserts use `p_source` only. After refactor, `'platform_operator'` remains only as an allowed source value and as the platform wrapper’s fixed argument.

---

## P. Platform backwards compatibility

- 4-arg public signature preserved
- `requireOperator()` preserved
- Existing operations retain previous semantics, including assign-different-pin `MUTATION_FAILED` on the platform path
- Generated Production types still describe only the platform function
- Existing ORG-CONTEXT service/repository tests pass

---

## Q. `service_role` separation

`service_role` is the executor. It does not select source, actor, or operation authority. Public wrappers require `auth.role() = service_role`. Canonical repeats that check.

---

## R. Transaction compatibility

Functions are plpgsql, contain no `COMMIT`/`ROLLBACK`, and share the caller transaction. Nested classify/activate/assign can run in one outer transaction. `ok: false` does not undo prior DML; 1F must RAISE to abort. Documented in the migration header and function comment.

---

## S. Lock semantics

Canonical still takes `pg_advisory_xact_lock(872011, hashtext(organization_id))`. Reacquire in the same transaction is safe. Future 1F dual-lock order remains **872011 then 872012**. 1X-B does not take `872012`.

---

## T. No BQA admission logic

ORG-CONTEXT 1X-B SQL/server does not read `business_activity_support_assessments`, `business_activity_admission_decisions`, BQA review state, or confidence.

---

## U. No readiness policy added

No `closed_beta` / `internal_qa` / `production_verified` gates were added to the mutation SQL. Existing platform `assertInternalQaReadiness` on `OrganizationContextService.pinContextVersion` is unchanged platform behavior, not a BQA policy.

---

## V. Server-only isolation

New `OrganizationContextConfirmedMutationService` is `server-only`. No public API, Server Action, browser hook, feature barrel, or UI consumer. BQA-1F is not implemented and does not call this path yet.

Pre-Production typing: `ORG_CONTEXT_BQA_MUTATION_RPC` is a named constant, **not** `keyof Database["public"]["Functions"]`. `database.generated.ts` was not hand-edited.

---

## W. Production untouched

This phase did not apply the migration, did not call Production RPCs, and did not mutate tenant rows. Expected retained Production fixture (verified in BQA-1E-FV; not re-queried here):

Organizations 6 · QA Activity unchanged · Context assignment unchanged · ORG-CONTEXT events 2 · BQA 1/3/2/10/2/2/0 · readiness unchanged.

---

## X. Tests

| Suite | Result |
| --- | --- |
| New 1X-B authority / SQL / isolation / confirmed service | pass |
| Existing ORG-CONTEXT domain/service/repository/security | pass |
| BQA 1D isolation | pass |
| `npx tsc --noEmit` | pass |
| `npx next lint` | pass (0 warnings) |
| `npx vitest run` | **3133 passed / 2 failed / 3135 total** |

Only accepted historical failures:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Prior 1E-FV baseline was 3115/2/3117. Delta is **+18 passing tests**. No new failures.

---

## Explicit freeze lines

```
ORG-CONTEXT CANONICAL MUTATION IMPLEMENTATION: ONE
PLATFORM MUTATION WRAPPER: PRESERVED
BQA MUTATION WRAPPER: IMPLEMENTED
BQA SOURCE: bqa_confirmed
PLATFORM SOURCE: platform_operator
BQA OWNER/ADMIN DB DEFENSE: IMPLEMENTED
ACTIVATE_ACTIVITY: IMPLEMENTED
BQA CHANGE_CONTEXT_VERSION: FORBIDDEN
AUTO REPIN: FORBIDDEN
BQA-1F: NOT IMPLEMENTED
PRODUCTION APPLY: NOT PERFORMED
```

```
ORG-CONTEXT-1X-B CLOSED WITH EVIDENCE — ADDITIVE BQA GOVERNED MUTATION AUTHORITY IMPLEMENTED AND FROZEN
ORG-CONTEXT-1X-B PRODUCTION AUTHORITY VERIFICATION = NOT YET PERFORMED
```

Recommended next phase: **ORG-CONTEXT-1X-FV — CONTROLLED PRODUCTION AUTHORITY + SECURITY VERIFICATION** (targeted apply of this exact hash; zero tenant mutation). Do not resume BQA-1F before 1X-FV closes.
