# ORG-CONTEXT-1X-A — BQA Governed Mutation Authority Extension Contract

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1X-A — BQA GOVERNED MUTATION AUTHORITY EXTENSION CONTRACT** |
| Parent | ORG-CONTEXT-1 (Production verified) + BQA-1F blocked discovery |
| Document type | Read-only discovery + security/authority contract freeze |
| Date | 2026-08-26 |
| Formal status | `ORG-CONTEXT-1X-A CLOSED — BQA GOVERNED MUTATION AUTHORITY EXTENSION CONTRACT FROZEN` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `5249a5770d1ba0bed4405aeaada3a240c9c04275` |
| SQL / implementation | **NONE** |
| Production apply | **NONE** |
| Production tenant mutation | **0** |

This phase does **not** classify the BQA-1F block as an ORG-CONTEXT-1 defect. Frozen v1 was intentionally platform-operator governed. A **new** authority source now exists: `bqa_confirmed`. The extension is additive. `ORG-CONTEXT-1 = PRODUCTION VERIFIED` is preserved.

**ORG-CONTEXT-1 = PRODUCTION VERIFIED**

**ONE CANONICAL STATE-TRANSITION IMPLEMENTATION**

**PLATFORM_OPERATOR PATH PRESERVED**

**BQA_CONFIRMED PATH DISTINCT**

**service_role ≠ BUSINESS AUTHORITY**

**NO GENERIC OPERATOR BYPASS**

**NO AUTO-REPIN**

**NO BQA ADMISSION LOGIC IN ORG-CONTEXT**

**NO MIGRATION IN 1X-A**

---

## A. Starting baseline

Proven before this document was added:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `5249a5770d1ba0bed4405aeaada3a240c9c04275` |
| Subject | `docs(bqa): record 1F ORG-CONTEXT authority discovery block` |
| Divergence | `0 0` |
| Worktree | clean |

Frozen dependencies:

| Dependency | Status |
| --- | --- |
| ORG-CONTEXT-1 | PRODUCTION VERIFIED |
| CONTEXT-RESOLVER-1 | PRODUCTION VERIFIED |
| BQA QUALIFICATION + CLASSIFICATION | PRODUCTION VERIFIED |
| BQA SUPPORT + ADMISSION | PRODUCTION VERIFIED |
| BQA-1F | BLOCKED ON GOVERNED MUTATION AUTHORITY |

BQA-1F evidence: `docs/phases/BQA-1F-governed-activity-context-assignment-handoff-evidence.md`.

---

## B. Existing writer contract (re-inspected)

Live function, not assumed from the 1F summary:

**Name:** `public.apply_organization_context_platform_mutation`

**Signature (unchanged; Production-deployed):**

```
(p_operation text, p_organization_id uuid, p_actor_user_id uuid, p_payload jsonb)
returns jsonb
```

**File:** `supabase/migrations/20260825130000_add_organization_context_platform_mutations.sql`

**Generated types:** `src/types/database.generated.ts` → `Database["public"]["Functions"]["apply_organization_context_platform_mutation"]`

| Property | Exact live truth |
| --- | --- |
| Language | plpgsql |
| Security | `SECURITY DEFINER` |
| `search_path` | `''` |
| Executor gate | `auth.role()` must be `service_role`; else `UNAUTHORIZED` |
| Actor | `p_actor_user_id` required; else `UNAUTHORIZED` (“Authenticated platform operator identity is required”) |
| Membership | lookup `organization_members` for **active** row matching org + user; **role is not read**; member id may be **NULL** (non-member operator is allowed) |
| Role validation | **none** at database layer |
| Advisory lock | `pg_catalog.pg_advisory_xact_lock(872011, hashtext(organization_id::text))` — **transaction-scoped** |
| Source stamping | hardcoded `'platform_operator'` on every assignment INSERT and every event INSERT |
| Payload `source` | **never read** |
| Grants | `REVOKE ALL` from `public`, `anon`, `authenticated`, `service_role`; `GRANT EXECUTE` only to `service_role` |
| Comment | “Not tenant self-service, resolver, entitlement, or Social execution.” |

Business failures generally `RETURN` jsonb `{ ok: false, code, message }` rather than `RAISE`. Constraint violations are caught and returned as `MUTATION_FAILED`. Nested DML therefore **commits with the surrounding transaction** unless the caller aborts.

### Payload keys actually consumed

| Operation | Keys |
| --- | --- |
| `create_activity` | `display_name`, `activity_key`, `status` (default `draft`), `is_primary`, `classification_kind` + XOR target columns, `reason` |
| later ops | `activity_id` required |
| `classify_activity` | `classification_kind`, `target_id`, `reason` |
| `set_primary` | `reason` |
| `assign_context_version` / `change_context_version` | `context_pack_version_id`, `reason` |
| `archive_activity` | `reason` |

### Idempotency already in the writer

| Operation | Same-state result |
| --- | --- |
| `classify_activity` | exact same TAX → `{ ok: true, idempotent: true }`, no event |
| `set_primary` | already primary → idempotent |
| `archive_activity` | already archived → idempotent |
| `assign_context_version` | active pin same version → idempotent |
| `change_context_version` | active pin same version → idempotent |

Different TAX with **no** active pin: platform `classify_activity` **overwrites**. Different TAX with active pin: `CONTEXT_INCOMPATIBLE`. Different pin on assign: `MUTATION_FAILED` (“Activity already has a different active Context pin”) — **no auto-repin**.

Assign does not require `status = 'active'`. Unclassified cannot be assigned. Archived cannot receive a new pin (SQL + integrity trigger).

### Application operator gate

`OrganizationContextService` requires `OrgContextPlatformOperator` via `requireOperator()` on **every** mutation method.

`resolveOrgContextPlatformOperator()`:

1. `auth.getUser()`
2. `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED` exact `"true"`
3. email on `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST`

Owner/Admin/Staff/Viewer and Closed Beta admission are never sufficient. Privileged DB access is not authorization.

`createOrganizationContextService` is the only production factory. Live product routes do not currently construct it; tests construct `OrganizationContextService` directly. The only RPC invocation path is `OrganizationContextService.mutate` → `invokeOrgContextPlatformMutation` → the platform function. Tests use an in-memory mutate client.

---

## C. Existing operation vocabulary

Verified exact:

| Operation | Exists |
| --- | --- |
| `create_activity` | yes |
| `classify_activity` | yes |
| `set_primary` | yes |
| `assign_context_version` | yes |
| `change_context_version` | yes |
| `archive_activity` | yes |
| `activate_activity` | **no** |

No other existing governed draft→active transition was found. `create_activity` may insert `status = 'active'` only at creation time, and only if classified (`organization_business_activities_active_classified_check` plus service `assertClassifiedForActive`).

---

## D. Provenance matrix (schema vs writer)

`organization_business_activities` has **no** `source` column. Classification and lifecycle provenance live only on events.

Assignment and event CHECK vocabularies are identical and already include `bqa_confirmed`:

`platform_operator` · `manual_owner` · `manual_admin` · `onboarding` · `bqa_confirmed` · `migration`

| Surface | `bqa_confirmed` allowed by CHECK | Written by live mutation |
| --- | --- | --- |
| `organization_context_assignments.source` | yes | **never** (always `platform_operator`) |
| `organization_context_assignment_events.source` | yes | **never** (always `platform_operator`) |
| Activity row | n/a (no source column) | n/a |
| Event `business_activity_created` | source CHECK yes | stamps `platform_operator` |
| Event `business_activity_classified` | source CHECK yes | stamps `platform_operator` |
| Event `context_version_assigned` | source CHECK yes | stamps `platform_operator` |
| Event `context_version_changed` | source CHECK yes | stamps `platform_operator` |
| Event `primary_activity_changed` | source CHECK yes | stamps `platform_operator` |
| Event `business_activity_archived` | source CHECK yes | stamps `platform_operator` |
| Event `business_activity_activated` | **does not exist** | n/a |

**Freeze:** assignment `bqa_confirmed` does **not** imply an activation event exists. Activation requires an additive event-type CHECK expansion.

Reserved sources `manual_owner`, `manual_admin`, `onboarding`, `migration` remain unused by the live writer and are **out of scope** for 1X.

---

## E. Three authority concepts (frozen)

These must never be collapsed.

### A. Database executor

`service_role` may invoke privileged functions. It does not select source, actor, role, or operation authority.

### B. Business actor

A real authenticated Organization member (`p_actor_user_id` resolved to an `organization_members` row).

| Path | Actor requirement |
| --- | --- |
| `platform_operator` | authenticated platform-operator identity at **application** layer; DB currently allows non-member (`actor_member_id` null) |
| `bqa_confirmed` | **active** Organization membership **and** role `owner` or `admin` (application **and** database) |

### C. Mutation source

Why the write happened. Truthful stamp on assignment rows and ORG-CONTEXT events.

| Source | Meaning |
| --- | --- |
| `platform_operator` | dedicated operator mutation |
| `bqa_confirmed` | authorized BQA Owner/Admin handoff |

BQA must never impersonate `platform_operator`. Platform must never stamp `bqa_confirmed`.

---

## F. Frozen architecture (smallest safe additive design)

### Rejected options

| Option | Why rejected |
| --- | --- |
| Payload `p_payload.source` on the existing function (Option A) | Caller-supplied source is an authority channel. BQA or a confused platform client could smuggle the wrong source. |
| Add a 5th RPC argument to the existing function (Option B) | PostgreSQL overload / signature change risk against the Production-deployed 4-arg function. |
| Wrapper that still stamps `platform_operator` | False provenance. Forbidden. |
| Duplicate classify/assign SQL inside BQA | Forks domain semantics. Forbidden. |
| `skipOperatorCheck` / `trusted` / `isInternal` flags | Generic bypass. Forbidden. |
| Rename or drop the Production function | Destructive. Forbidden. |

### Frozen option: one private canonical writer + two public wrappers

**Canonical (not PostgREST-facing):**

`private.apply_organization_context_mutation(p_source text, p_operation text, p_organization_id uuid, p_actor_user_id uuid, p_payload jsonb) returns jsonb`

- Single implementation of all state-transition rules (move current SQL here; do not fork).
- `p_source` is an **internal** argument, never a client JSON field.
- Unknown source → fail closed (`UNAUTHORIZED` / `MUTATION_FAILED`). No fallback to `platform_operator`.
- Stamps assignment `source` and event `source` from `p_source`.
- Keeps lock `872011`, integrity triggers, and existing idempotency.
- `search_path = ''`, `SECURITY DEFINER`.
- `REVOKE ALL` from `public`, `anon`, `authenticated`, **and** `service_role`. Wrappers call it as the function owner, not as a granted `service_role` client.

**Platform wrapper (existing name + exact 4-arg signature):**

`public.apply_organization_context_platform_mutation(p_operation, p_organization_id, p_actor_user_id, p_payload)`

- `CREATE OR REPLACE` in a **new** additive migration (do not edit `20260825130000` in place).
- `auth.role() = service_role`.
- Ignores any payload `source`.
- Calls canonical with `p_source` **fixed** to `'platform_operator'`.
- Allows the full platform operation set, including new `activate_activity`.
- Does **not** add Owner/Admin role checks (operator identity remains an application concern, as frozen in ORG-CONTEXT-1C-R1A).

**BQA wrapper (new):**

`public.apply_organization_context_bqa_mutation(p_operation, p_organization_id, p_actor_user_id, p_payload)`

- Same argument shape as the platform function (no caller-supplied source, no caller-supplied member id).
- `auth.role() = service_role`.
- Ignores any payload `source`.
- Resolves **active** membership for `p_actor_user_id` in `p_organization_id` whose `role IN ('owner','admin')`. Staff/Viewer/suspended/missing/foreign → `UNAUTHORIZED` / `FORBIDDEN` equivalent (`UNAUTHORIZED` to match existing ORG-CONTEXT codes, or `MUTATION_FAILED` only if a new code is avoided). **Freeze:** return `UNAUTHORIZED`.
- Operation allowlist (below). Disallowed operations fail closed **before** canonical mutation.
- Calls canonical with `p_source` **fixed** to `'bqa_confirmed'`.
- Canonical **also** enforces: if `p_source = 'bqa_confirmed'` then actor must be active Owner/Admin and operation must be on the BQA allowlist (defense-in-depth if someone later grants the private function).

Repository already uses `private` for trigger/helper functions (`private.enforce_organization_context_assignment_integrity`, BQA identity guards). `private` schema is not a security boundary by itself; EXECUTE grants and PostgREST exposure are. Do not GRANT the canonical function to `authenticated`. Historical `GRANT USAGE ON SCHEMA private TO authenticated` exists for RLS helpers and must not be treated as permission to execute this mutation.

---

## G. Application service design

Keep `OrganizationContextService.requireOperator()` on **all existing methods**. Do not add a bypass flag.

Add a **named** server path, conceptually:

`applyBqaConfirmedMutation({ organizationId, actorUserId, operation, payload })`

Constraints:

- Lives in the ORG-CONTEXT server feature, not as a raw RPC client export for product UI.
- Does **not** call `requireOperator()`.
- Does **not** accept `source`.
- Restricts `operation` to the BQA allowlist in TypeScript as well as SQL.
- Invokes **only** `apply_organization_context_bqa_mutation`.
- BQA-1F remains responsible for tenant `auth.getUser()`, membership, Owner/Admin, admission, readiness, and TAX/Context derivation **before** calling this method.
- This method is not a public HTTP API.

Platform callers continue: `resolveOrgContextPlatformOperator` → `OrganizationContextService` → platform RPC.

---

## H. BQA operation allowlist (frozen)

| Operation | `platform_operator` | `bqa_confirmed` |
| --- | --- | --- |
| `create_activity` | yes | **no** — Activity exists before qualification |
| `classify_activity` | yes | **yes** — more restrictive than platform (no silent reclassify) |
| `activate_activity` | **yes** (new shared op) | **yes** |
| `set_primary` | yes | **no** — admission ≠ primary |
| `assign_context_version` | yes | **yes** — no auto-repin |
| `change_context_version` | yes | **no** — hard v1 freeze |
| `archive_activity` | yes | **no** |

BQA does not inherit platform operations by default.

---

## I. `activate_activity` decision (frozen)

**Add `activate_activity` to the shared canonical writer.**

Do not leave an admitted, classified, Context-assigned Activity silently `draft`. That would make “configured” mean something other than the frozen product lifecycle (`active` is the operational status; `draft` is pre-operational; `active` may still be Context-unassigned as a **global** invariant, but BQA handoff’s **desired** success state is active).

No already-governed activate path exists. Inventing `UPDATE organization_business_activities.status` outside the writer is forbidden.

### Transition contract

| From | To | Result |
| --- | --- | --- |
| `draft` + classified | `active` | mutate; event `business_activity_activated` |
| `active` + classified | `active` | idempotent no-op; no event |
| `draft` + unclassified | — | fail closed (`MUTATION_FAILED`: cannot activate unclassified) |
| `archived` | `active` | **forbidden v1** (`MUTATION_FAILED`) |
| `active` → still no pin required | — | activation does **not** assign Context |
| activation | primary / entitlement / Social | **no side effects** |

Event type CHECK must add `'business_activity_activated'`. Source CHECK already includes `bqa_confirmed`.

Platform_operator **may** call `activate_activity` (same shared writer). Accidental exposure is avoided because the operation is explicit in both allowlists, not a fall-through.

---

## J. Classification authority (BQA stricter than platform)

Platform `classify_activity` may overwrite a different TAX when there is no active pin. That remains **platform-only**.

For `bqa_confirmed` + `classify_activity`:

| Current Activity TAX | Requested TAX | Result |
| --- | --- | --- |
| unclassified | confirmed BQA TAX | classify; event `business_activity_classified`; source `bqa_confirmed` |
| exact same TAX | same | idempotent |
| different TAX | any | **fail** `ACTIVITY_CLASSIFICATION_MISMATCH`; no write |
| archived | any | fail (existing archived-cannot-reclassify) |
| different TAX + active pin | any | fail (existing `CONTEXT_INCOMPATIBLE` or mismatch; do not overwrite) |

Add ORG-CONTEXT result code `ACTIVITY_CLASSIFICATION_MISMATCH` for the BQA source path. Do not change platform overwrite behavior.

BQA-1F still fails closed **before** calling ORG-CONTEXT when mismatch is detected. Database enforcement is defense-in-depth.

---

## K. Context assign authority

Preserve frozen assign semantics for both sources:

| Active pin | Requested version | Result |
| --- | --- | --- |
| none | exact published compatible version | insert; event `context_version_assigned`; source from `p_source` |
| same version | same | idempotent |
| different version | any | fail; **no** `change_context_version` |

For `bqa_confirmed`, freeze a distinct result code `CONTEXT_REPIN_REQUIRED` when an active pin differs (BQA-1F expected name). For `platform_operator`, keep `MUTATION_FAILED` with the current message (backwards compatible).

BQA must never call `change_context_version`, including when a newer version is more ready.

Integrity already required by the writer + trigger (do **not** duplicate BQA policy here):

- published version
- exact TAX pack/activity match
- not archived
- classified

**BQA decides WHETHER** (admission, rollout, current readiness). **ORG-CONTEXT safely performs WHAT** (pin this exact version).

---

## L. Atomic future BQA handoff

PostgreSQL plpgsql functions run in the **caller’s transaction**. Nested `SECURITY DEFINER` calls do not start a new transaction. Therefore a future BQA handoff RPC **can** call the BQA wrapper (or canonical writer) three times in one transaction.

Preferred future 1F pattern:

```
BQA handoff RPC (one transaction)
  lock 872011 then 872012
  apply_organization_context_bqa_mutation(classify_activity)
  apply_organization_context_bqa_mutation(activate_activity)
  apply_organization_context_bqa_mutation(assign_context_version)
  BQA assignment_handoff_* events
  commit or abort
```

**Abort rule:** current writers `RETURN` jsonb `ok: false` without rolling back prior DML. The 1F orchestrator **must** abort the transaction on any nested failure (controlled `RAISE` or equivalent subtransaction handler) so classify/activate cannot commit without assign. Do not REST-chain three calls.

1X-B implements writer/wrappers/activate only. It does **not** implement the BQA orchestrator.

### Recommended BQA sequence

`classify_activity` → `activate_activity` → `assign_context_version`

Global invariant **unchanged**: active may be unassigned. Inside a successful **atomic** handoff, the committed end state is classified + active + exact pin. Intermediate rows are not visible if the transaction aborts.

Assign-before-activate was evaluated: same committed success state under abort-on-failure. Rejected to match BQA-1B’s classify → activate → assign recommendation and to keep activation a lifecycle decision independent of pin success **inside** the transaction.

### Desired atomic final state (new admitted draft)

| Domain | State |
| --- | --- |
| Activity | `active` |
| Canonical TAX | confirmed BQA target |
| Context | exact admitted eligible `context_pack_version_id` |
| Assignment source | `bqa_confirmed` |
| ORG-CONTEXT events | truthful `bqa_confirmed` classify / activate / assign (only for steps that mutated) |
| BQA | `assignment_handoff_requested` + `assignment_handoff_completed` |

All committed, or none.

### Already in desired state

Each nested op is idempotent. 1F must not emit a second `assignment_handoff_completed` (use a stable BQA `idempotency_key`, e.g. scoped to admission decision). No eighth BQA table.

### Wrong existing state (no automatic repair)

| State | Result |
| --- | --- |
| Different canonical TAX | `ACTIVITY_CLASSIFICATION_MISMATCH`; stop |
| Different Context pin | `CONTEXT_REPIN_REQUIRED`; stop |
| Archived | fail closed |
| Wrong Organization | `ACTIVITY_NOT_OWNED_BY_ORG` / `ORG_NOT_FOUND` |
| Unclassified but assigned | integrity defect; fail closed; no repair |
| Staff/Viewer/suspended/foreign actor | `UNAUTHORIZED` |

---

## M. Locks (document only; do not change 1X-A)

| Domain | Key | Grain |
| --- | --- | --- |
| ORG-CONTEXT | `872011` + `hashtext(organization_id)` | Organization |
| BQA | `872012` + `hashtext(organization_id \|\| ':' \|\| business_activity_id)` | Organization + Activity |

`pg_advisory_xact_lock` is **transaction-scoped**. Reacquiring the same lock in the same transaction succeeds immediately (no self-deadlock). Nested classify/activate/assign therefore must not change lock semantics.

**Canonical dual-lock order for any future transaction that needs both:**

1. `872011` (ORG, coarser; already first on the platform path)
2. `872012` (BQA activity)

Never the reverse. Platform path takes only `872011` today, so it cannot deadlock with itself. A 1F handoff that took `872012` then `872011` would invert that order and create a future deadlock if any ORG path later needed the BQA lock.

1F therefore should **not** add ORG nested calls to the existing BQA mutation function without first taking `872011`. Prefer a dedicated handoff RPC that locks in the canonical order.

---

## N. Event model

### ORG-CONTEXT (actual frozen names)

| Step | Event type | Source on BQA path |
| --- | --- | --- |
| classify (mutated) | `business_activity_classified` | `bqa_confirmed` |
| activate (mutated) | `business_activity_activated` (**new**) | `bqa_confirmed` |
| assign (mutated) | `context_version_assigned` | `bqa_confirmed` |

Idempotent steps emit **no** ORG-CONTEXT event (existing behavior).

### BQA (schema already allows; TypeScript union does not)

Schema CHECK includes `assignment_handoff_requested`, `assignment_handoff_completed`, and `review_resolved`.

TypeScript `QualificationEventType` currently:

`qualification_started`, `answer_saved`, `classification_proposed`, `classification_confirmed`, `classification_superseded`, `review_requested`, `split_recommended`, `requalify_started`, `support_assessed`, `admission_decided`, `waitlist_joined`, `waitlist_withdrawn`

**Mismatch confirmed.** Repair in **BQA-1F**, not in ORG-CONTEXT-1X-A/B unless shared generated types force a typegen after the ORG event CHECK change (`business_activity_activated` is ORG-CONTEXT, not BQA).

Do not duplicate full Context payloads across domains. Cross-reference ids (admission decision, activity, assignment, event ids).

---

## O. Source × operation matrix (required contract artifact)

| Operation | platform_operator allowed | bqa_confirmed allowed | Min actor for platform | Min actor for BQA | Event source | Assignment source | Idempotent same-state |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `create_activity` | yes | **no** | app operator + `p_actor_user_id`; member optional | n/a | `platform_operator` | n/a | no (unique key fails) |
| `classify_activity` | yes (may overwrite if no pin) | **yes** (mismatch fails) | same | active Owner/Admin | matches `p_source` | n/a | yes if exact TAX |
| `activate_activity` | **yes** (new) | **yes** (new) | same | active Owner/Admin | matches `p_source` | n/a | yes if already active |
| `set_primary` | yes | **no** | same | n/a | `platform_operator` | n/a | yes if already primary |
| `assign_context_version` | yes | **yes** | same | active Owner/Admin | matches `p_source` | matches `p_source` | yes if same pin |
| `change_context_version` | yes | **no** | same | n/a | `platform_operator` | `platform_operator` | yes if same pin |
| `archive_activity` | yes | **no** | same | n/a | `platform_operator` | n/a | yes if already archived |

---

## P. Role matrix

### BQA source (`bqa_confirmed`)

| Caller | Bounded BQA operations |
| --- | --- |
| Owner | allow |
| Admin | allow |
| Staff | deny |
| Viewer | deny |
| Suspended / nonmember | deny |
| Foreign org member | deny |
| Unauthenticated | deny before privileged executor |
| `service_role` with Staff `p_actor_user_id` | **deny at DB** |
| Platform-operator identity without Owner/Admin membership | **deny** on BQA wrapper |

### Platform source

Unchanged: application allowlist + flag; DB membership optional; tenant role never sufficient.

---

## Q. Security threat model

| Threat | Rating | Mitigation |
| --- | --- | --- |
| BQA server forging `platform_operator` | HIGH | BQA path can invoke only the BQA wrapper; source fixed internally |
| Platform service forging `bqa_confirmed` | HIGH | Platform wrapper source fixed; canonical rejects BQA ops without Owner/Admin |
| Client supplying `source` | HIGH | Wrappers ignore payload source; no public EXECUTE |
| Staff actor via `service_role` + `bqa_confirmed` | HIGH | DB Owner/Admin membership required |
| Foreign actor / org mismatch | HIGH | Existing activity ownership checks + membership lookup |
| `actor_user_id` / member mismatch | HIGH | BQA wrapper derives member from user+org; does not trust client member id |
| BQA calling `change_context_version` | HIGH | Allowlist deny in wrapper + canonical |
| BQA calling `archive_activity` / `create_activity` / `set_primary` | HIGH | Allowlist deny |
| Source omitted on canonical | HIGH | Required argument; unknown/null fail closed; no default to platform |
| Unknown source | HIGH | Fail closed |
| Old client compatibility | MEDIUM | Platform 4-arg signature preserved; omission means platform wrapper only |
| Overloaded RPC / extra signature | MEDIUM | Do not add a 5-arg overload of the platform name |
| Event source ≠ assignment source | HIGH | Canonical stamps both from `p_source` |
| Activate unclassified | HIGH | Reject |
| Activate archived | HIGH | Reject |
| Automatic repin | HIGH | BQA cannot call `change_context_version`; assign different pin fails |
| `service_role` as user identity | HIGH | Actor is `p_actor_user_id`; executor is not the business actor |
| Generic `skipOperatorCheck` | HIGH | Rejected; named paths only |

---

## R. Backwards compatibility

Existing Production callers of the 4-arg platform function must keep behaving as today:

- no source field → platform wrapper stamps `platform_operator`
- operator application gate unchanged
- operation vocabulary expanded only by **adding** `activate_activity` (unknown ops still fail; existing ops unchanged)
- assign-different-pin still `MUTATION_FAILED` on the platform path
- classify still overwrites when no pin on the platform path

Generated types for the platform function remain the same Args/Returns shape.

After 1X-B apply: **zero** tenant row mutation expected. Authority/security structure only. Actual handoff remains BQA-1F-FV.

---

## S. Migration strategy (future 1X-B; not now)

Additive new migration only. **DB-MIGRATION-DRIFT-01** remains active. No repair, no blind `db push`, no edit of `20260825120000` / `20260825130000` / BQA-1C/1D/1E files.

1. Expand `organization_context_assignment_events_event_type_check` to include `business_activity_activated`.
2. Add `private.apply_organization_context_mutation` (canonical body moved from current platform SQL + source parameter + BQA restrictions + `activate_activity`).
3. `CREATE OR REPLACE` `public.apply_organization_context_platform_mutation` as the thin platform wrapper (same signature).
4. `CREATE` `public.apply_organization_context_bqa_mutation`.
5. Exact GRANT/REVOKE; no `authenticated` EXECUTE.
6. No data backfill. No Production row mutation.
7. Application: keep `requireOperator()`; add named BQA mutation method; extend TypeScript operation/event unions; typegen after apply as a separate chore if Production types must include the new function.
8. Targeted Production apply later in **ORG-CONTEXT-1X-FV** (security/authority only).

---

## T. Implementation decomposition

| Phase | Work |
| --- | --- |
| **ORG-CONTEXT-1X-A** | this contract (done) |
| **ORG-CONTEXT-1X-B** | additive SQL + application named BQA path + tests; no Production apply in B; no BQA-1F |
| **ORG-CONTEXT-1X-FV** | Production security/authority verification; **ZERO tenant mutation** |
| **BQA-1F** | governed handoff implementation using the BQA wrapper; TypeScript BQA event union repair |
| **BQA-1F-FV** | controlled real Production handoff on a safe draft fixture (not the already-pinned QA Activity alone) |

Do not auto-start 1X-B from this phase.

---

## U. Open decisions

| # | Topic | Status |
| --- | --- | --- |
| 1 | Shared source-aware canonical writer | **FROZEN** — `private.apply_organization_context_mutation` |
| 2 | Separate BQA wrapper vs payload source | **FROZEN** — two public wrappers; source **not** caller-supplied |
| 3 | BQA allowed operations | **FROZEN** — classify, activate, assign only |
| 4 | Add `activate_activity` | **FROZEN** — yes; platform and BQA |
| 5 | Activation vs assignment order | **FROZEN** — classify → activate → assign inside one future 1F transaction |
| 6 | Event/source additions | **FROZEN** — add event type `business_activity_activated`; source vocab already sufficient |
| 7 | Transaction/lock strategy | **FROZEN** — nested calls share one txn; abort on nested failure; lock order `872011` then `872012`; do not change lock keys in 1X-B |

**OWNER DECISION required before 1X-B:** none.

**BLOCKING BEFORE IMPLEMENTATION:** none, provided 1X-B follows this contract without generic bypass or SQL duplication.

---

## V. Explicit freeze lines

```
ORG-CONTEXT-1 = PRODUCTION VERIFIED
BQA GOVERNED MUTATION AUTHORITY EXTENSION = CONTRACT FROZEN
CANONICAL WRITER = private.apply_organization_context_mutation
PLATFORM WRAPPER = public.apply_organization_context_platform_mutation (signature preserved, source fixed platform_operator)
BQA WRAPPER = public.apply_organization_context_bqa_mutation (source fixed bqa_confirmed)
ACTIVATE_ACTIVITY = ADD
BQA ALLOWLIST = classify_activity + activate_activity + assign_context_version
BQA FORBIDDEN = create_activity + set_primary + change_context_version + archive_activity
AUTO-REPIN = FORBIDDEN
GENERIC BYPASS = FORBIDDEN
BQA ADMISSION LOGIC IN ORG-CONTEXT = FORBIDDEN
SQL IN 1X-A = NONE
PRODUCTION TENANT MUTATION IN 1X-A = 0
```

---

## W. Recommended next phase

**ORG-CONTEXT-1X-B — ADDITIVE GOVERNED MUTATION AUTHORITY IMPLEMENTATION**

Do not implement from this document automatically.
