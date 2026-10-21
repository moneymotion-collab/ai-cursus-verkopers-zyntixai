# BQA-1F — Governed Activity + Context Assignment Handoff

| Field | Value |
| --- | --- |
| Phase | **BQA-1F — GOVERNED ACTIVITY + CONTEXT ASSIGNMENT HANDOFF** |
| Parent | BQA-1E / BQA-1E-FV |
| Document type | Discovery evidence (hard stop; no handoff implementation) |
| Date | 2026-08-26 |
| Formal status | `BQA-1F BLOCKED — ORG-CONTEXT GOVERNED MUTATION AUTHORITY REQUIRES EXPLICIT EXTENSION` |
| Alternate protocol phrasing | `BQA-1F BLOCKED — ORG-CONTEXT MUTATION AUTHORITY CONTRACT REQUIRES EXPLICIT EXTENSION` |
| Governing contract | `docs/phases/BQA-1B-business-qualification-admission-domain-schema-contract.md` |
| Frozen mutation | `supabase/migrations/20260825130000_add_organization_context_platform_mutations.sql` |
| Frozen assignment schema | `supabase/migrations/20260825120000_create_organization_context_assignment_foundation.sql` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `db0e352a37bb47d0bcdca1c5070291ddd3299142` |
| Production apply | **NOT APPLIED** |
| Production handoff | **NOT PERFORMED** |
| Production Activity / Context mutation | **0** |

This phase inspected the frozen ORG-CONTEXT mutation boundary before any BQA handoff code. The live contract cannot honestly represent an authorized Organization Owner/Admin BQA handoff. Protocol §10 therefore stops implementation. No bypass was written.

**BQA GOVERNED HANDOFF SERVER: NOT IMPLEMENTED**

**ACTIVITY CLASSIFICATION HANDOFF: NOT IMPLEMENTED**

**ACTIVITY ACTIVATION HANDOFF: NOT AVAILABLE IN FROZEN VOCABULARY**

**CONTEXT ASSIGNMENT HANDOFF: NOT IMPLEMENTED**

**AUTO CONTEXT REPIN: FORBIDDEN (unchanged; never implemented)**

**ADMISSION DECISION AS PERMANENT AUTHORITY: FORBIDDEN (unchanged)**

**CONTEXT READINESS MUTATION: 0**

**PRODUCTION HANDOFF: NOT YET PERFORMED**

**ONBOARDING: NOT IMPLEMENTED**

---

## A. Starting baseline

Proven before any 1F file was added:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `db0e352a37bb47d0bcdca1c5070291ddd3299142` |
| Subject | `docs(bqa): record Production support admission verification` |
| Divergence | `0 0` |
| Worktree at 1F start | clean |

Frozen dependencies at this HEAD:

| Dependency | Status |
| --- | --- |
| ORG-CONTEXT-1 | PRODUCTION VERIFIED |
| CONTEXT-RESOLVER-1 | PRODUCTION VERIFIED |
| BQA DATABASE FOUNDATION | PRODUCTION VERIFIED |
| BQA QUALIFICATION + CLASSIFICATION FOUNDATION | PRODUCTION VERIFIED |
| BQA SUPPORT + ADMISSION FOUNDATION | PRODUCTION VERIFIED |

Hard gate passed. Discovery proceeded. Implementation did not.

Retained Production QA fixture (read-only; not mutated in 1F):

| Field | Value |
| --- | --- |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Activity | `07e6918e-6c13-437e-b698-f0f3be27e9bb` (`qa_online_course_business`) |
| Canonical Activity | active, primary, `niche.online-course-business`, OCB v1 assigned |
| Qualification / answers / classification / events / support / admission / demand | 1 / 3 / 2 / 10 / 2 / 2 / 0 |
| Historical `internal_qa` | supported + admitted (superseded pointer) |
| Historical `closed_beta` | not_yet_supported + not admitted |
| Current evaluation pointer | `closed_beta` |

---

## B. BQA / ORG-CONTEXT boundary

BQA through 1E records what the Activity is and whether ZyntixAI supports/admits it. ORG-CONTEXT owns canonical Activity classification, lifecycle, and Context assignment.

BQA-1B already reserved:

- classify via existing RPC `classify_activity`
- assign via existing RPC `assign_context_version` with `source = "bqa_confirmed"`
- events `assignment_handoff_requested` / `assignment_handoff_completed` (schema check exists; TypeScript event union does not yet include them)
- no eighth BQA table

BQA-1F was the first phase allowed to cause canonical tenant configuration changes. It must reuse `apply_organization_context_platform_mutation` and must not duplicate that SQL.

---

## C. Existing mutation contract

Live function:

`public.apply_organization_context_platform_mutation(p_operation text, p_organization_id uuid, p_actor_user_id uuid, p_payload jsonb)`

File: `supabase/migrations/20260825130000_add_organization_context_platform_mutations.sql`

Application wrapper: `src/features/org-context/server/organization-context-rpc.ts` (`ORG_CONTEXT_PLATFORM_MUTATION_RPC`)

Application service: `src/features/org-context/server/organization-context.service.ts`

### Exact operation vocabulary

| Operation | Present |
| --- | --- |
| `create_activity` | yes |
| `classify_activity` | yes |
| `set_primary` | yes |
| `assign_context_version` | yes |
| `change_context_version` | yes |
| `archive_activity` | yes |
| `activate_activity` | **no** |

There is no composite atomic handoff operation.

### Database execution assumptions

- `SECURITY DEFINER`, `search_path = ''`
- `auth.role()` must be `service_role`
- `p_actor_user_id` required; looked up as an **active** `organization_members` row in that Organization
- Advisory lock `872011` hashed on organization id
- EXECUTE: `public` / `anon` / `authenticated` revoked; `service_role` granted
- Does **not** read `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED` or the email allowlist
- Error text still says “Authenticated platform operator identity is required” for a missing actor id

### Payloads (exact keys used by live SQL)

| Operation | Payload keys used |
| --- | --- |
| `create_activity` | `display_name`, `activity_key`, `status` (default `draft`), `is_primary`, classification columns, `reason` |
| `classify_activity` | `classification_kind`, `target_id`, `reason` |
| `set_primary` | `reason` |
| `assign_context_version` | `context_pack_version_id`, `reason` |
| `change_context_version` | `context_pack_version_id`, `reason` |
| `archive_activity` | `reason` |

`p_payload->>'source'` is **never read**.

### Classification / assignment / repin behavior

- `classify_activity`: exact same TAX is idempotent (`ok: true`, no event). Different TAX with an active pin returns `CONTEXT_INCOMPATIBLE`. Different TAX without an active pin overwrites Activity TAX and writes `business_activity_classified`.
- `assign_context_version`: no active pin inserts a new assignment. Same version pin is idempotent. Different version pin returns `MUTATION_FAILED` (“Activity already has a different active Context pin”). Does **not** auto-repin.
- `change_context_version`: explicit repin. Same version is idempotent. No pin returns `MUTATION_FAILED`.
- Assignment does **not** require Activity `status = 'active'`. An unclassified Activity cannot be assigned. A classified **draft** can receive a pin.
- `create_activity` may create `status = 'active'` only if classified (`assertClassifiedForActive` at the service layer; SQL also enforces classified-for-active). There is no later activate operation.

### Event behavior

ORG-CONTEXT events written by the mutation always set `source = 'platform_operator'` (hardcoded literal). Event types: `business_activity_created`, `business_activity_classified`, `context_version_assigned`, `context_version_changed`, `primary_activity_changed`, `business_activity_archived`.

---

## D. Authority model

Two stacked gates exist today. They are not the same contract.

| Layer | Who may mutate | Provenance written |
| --- | --- | --- |
| Database RPC | `service_role` + any **active org member** as `p_actor_user_id` | always `platform_operator` |
| `OrganizationContextService` | dedicated platform-operator identity (`ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED=true` **and** email in `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST`) | same RPC, therefore `platform_operator` |

Frozen comment in `src/features/org-context/domain/operator-identity.ts`:

> Closed Beta admission, invitation eligibility, Social operator UI, and Organization Owner/Admin/Staff/Viewer are never sufficient. Privileged database access is not authorization.

### §10 discovery answers

| Option | Result |
| --- | --- |
| A. service_role-only database execution after server authorization | **True of the SQL function.** Any active member id is accepted as actor. Operator env is not consulted. |
| B. additionally gated by platform-operator configuration | **True of the application service.** Every mutation calls `requireOperator()`. |
| C. designed only for platform operators | **True of the frozen product contract and of every written `source` literal.** |
| D. already supports `source = bqa_confirmed` without platform-operator identity | **False.** Schema allows the value. Live mutation never writes it and never reads a payload source. |

### Why BQA-1F cannot proceed without an explicit extension

An Owner/Admin BQA handoff would have to choose one of these dishonest or forbidden paths:

1. Call `OrganizationContextService` as the tenant Owner/Admin → operator gate denies (correct) or the caller must be **pretended** to be a platform operator (forbidden).
2. Call the same RPC from a new BQA server after Owner/Admin auth, skipping `requireOperator()` → reuses SQL (allowed by Option A preference) but **bypasses the frozen application operator model** and still writes `source = 'platform_operator'` (false provenance; protocol §11 forbids this).
3. Duplicate classify/assign SQL inside a BQA function so `source = 'bqa_confirmed'` can be written → protocol §9 forbids duplicating ORG-CONTEXT mutation SQL.
4. Edit the applied ORG-CONTEXT migration in place → protocol §44 forbids migration repair.

Honest BQA provenance therefore requires an **additive, explicit ORG-CONTEXT mutation-authority extension**, not a BQA-side workaround.

This is the hard stop.

---

## E. Caller auth

Intended 1F order (not implemented):

`auth.getUser()` → active Organization membership → Owner/Admin role → exact Activity tenant read → BQA qualification → exact AdmissionDecision → linked SupportAssessment → confirmed ClassificationDecision → Control Plane TAX/CTX/readiness → Activity/assignment current state → deterministic validation → governed ORG-CONTEXT mutation.

No 1F server entrypoint was added. Existing BQA mutations remain Owner/Admin for classification/support/admission; Staff/Viewer remain denied for those commands.

---

## F. Explicit AdmissionDecision

Frozen 1E pointer semantics remain: `current_admission_decision_id` is the most recently evaluated state, not universal rollout authority. 1F must not authorize from that pointer alone.

Not implemented. The requirement is unchanged: explicit `admissionDecisionId` + `rolloutMode`, server-validated to match.

---

## G. Rollout validation

Frozen 1E policy (unchanged, not re-opened):

| Rollout | Eligible current Context readiness |
| --- | --- |
| `internal_qa` | `context_ready+` |
| `closed_beta` | `beta_supported+` |
| `production` | `production_verified` |
| `open_beta` | undefined → forbidden |

Current Production OCB remains `context_ready`. Current `closed_beta` decision therefore cannot hand off. Not executed.

---

## H. Fresh support / readiness validation

Persisted `admitted` is evidence of intent, not a bearer token. Fresh Control Plane readiness and version lifecycle must be re-read before mutation. Not implemented.

---

## I. Classification handoff

Would use `classify_activity` with server-derived `classification_kind` + `target_id` from the confirmed BQA decision. Same TAX is already idempotent in the frozen RPC. Different TAX with no pin would overwrite — 1F must instead fail `ACTIVITY_CLASSIFICATION_MISMATCH` before Context mutation. Not implemented.

---

## J. Activity activation

**Exact result: not covered by the frozen mutation vocabulary.**

BQA-1B recommended: classify (still draft) → **activate** → assign.

Live operations have no `activate_activity`. Draft→active is only available at `create_activity` time. `assign_context_version` does not require `active`. Protocol §16: do not invent a direct `UPDATE` of `organization_business_activities.status`.

Activation therefore cannot be part of a 1F handoff until ORG-CONTEXT grows an explicit activate operation (or the product freezes “classified draft + assigned” as the admitted configuration). That freeze was not taken here because authority/provenance already blocks the whole handoff.

---

## K. Context assignment

Would use `assign_context_version` with server-derived `context_pack_version_id`. Frozen SQL would pin `source = 'platform_operator'`, which is dishonest for BQA. Not implemented.

---

## L. Existing pin behavior

Frozen SQL already matches 1F intent for pin identity:

- no pin → insert
- same version → idempotent no-op
- different version on `assign_context_version` → fail, no auto-repin

`change_context_version` remains the explicit repin path and must **not** be called by 1F.

---

## M. No auto-repin

Unchanged. 1F did not call `change_context_version`. Auto-repin remains forbidden.

---

## N. Atomicity

Preferred design after inspection: **Option A** — a new narrow BQA handoff RPC that internally invokes the existing ORG-CONTEXT database function inside one PostgreSQL transaction.

This is still the correct atomicity shape **after** ORG-CONTEXT is extended to accept honest `bqa_confirmed` provenance and a non-operator BQA caller path.

Not implemented. No REST-chained classify/activate/assign was added.

Option B (composite ORG-CONTEXT operation) does not exist.

Option C (durable handoff table) is not required for v1 and was not created.

---

## O. Idempotency

Frozen classify-same and assign-same already no-op without extra events. BQA completion events would still need a 1F idempotency key among `assignment_handoff_completed` rows. Not implemented.

---

## P. Cross-domain audit

BQA schema already allows `assignment_handoff_requested` / `assignment_handoff_completed`. TypeScript `QualificationEventType` and 1D/1E RPC parsers do not yet include them.

ORG-CONTEXT would emit classify/assign events only if mutation ran. Mutation was not invoked.

---

## Q. Stale admission protection

Not implemented. Required fail-closed cases remain: requalifying, review required, old classification pointer, non-admitted status, readiness drop, version no longer assignable.

---

## R. Role / security matrix

Intended (not implemented):

| Caller | Handoff |
| --- | --- |
| Owner | allow after full revalidation |
| Admin | allow after full revalidation |
| Staff | deny |
| Viewer | deny |
| Unauthenticated | deny before privileged executor |
| Suspended / nonmember / foreign | deny |
| Platform operator identity used as stand-in for Owner | **forbidden** |
| Client direct ORG-CONTEXT RPC | already denied (`authenticated` has no EXECUTE) |

---

## S. Context readiness non-effect

1F implementation wrote no catalog or readiness SQL. Production readiness was not contacted. Expected non-effect: 0 readiness writes.

---

## T. Path B non-effect

No invitation, membership, or user-creation code was added.

---

## U. Entitlement non-effect

No subscription, capability, or permission code was added.

---

## V. Social non-effect

No Social publishing or enrollment code was added.

---

## W. Tests

No new 1F test suite was added because the authority contract blocked implementation.

Accepted historical baseline remains the 1E-FV close:

- 3115 passed
- 2 failed
- 3117 total

Historical failures only:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

This discovery-only document did not rerun the full suite. No new test file was introduced, so no new failure was added by 1F code.

---

## X. Production untouched

During 1F discovery:

- no new Production Activity
- retained QA Activity not classified/activated/assigned
- no BQA support/admission re-evaluation
- no ORG-CONTEXT mutation
- no readiness change
- no Path B / entitlement / Social mutation

Production handoff remains **BQA-1F-FV**, and only after the authority extension and a subsequent 1F implementation freeze.

The retained QA Activity is already classified and Context-assigned. It is not a sufficient 1F-FV success fixture for a real first-time handoff.

---

## Required extension (do not treat as 1F scope)

An explicit later ORG-CONTEXT mutation-authority extension must, at minimum:

1. Keep the single mutation function as the only writer of Activity TAX, lifecycle, and assignments (no duplicated SQL in BQA).
2. Accept an honest assignment/event `source` of `bqa_confirmed` (schema already allows it).
3. Represent an authorized Owner/Admin BQA caller without requiring `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST` and without writing `platform_operator`.
4. Keep `service_role` EXECUTE, `search_path = ''`, PUBLIC/anon/authenticated none, and organization advisory locking.
5. Decide activation: add a governed `activate_activity` operation, or freeze “classified draft may remain draft after assignment” as the admitted v1 state.
6. Remain additive (`CREATE OR REPLACE` in a **new** migration). Do not edit `20260825130000` in place.

Until that extension exists, BQA-1F must not ship a handoff server.

---

## Explicit freeze lines

```
BQA GOVERNED HANDOFF SERVER: NOT IMPLEMENTED
ACTIVITY CLASSIFICATION HANDOFF: NOT IMPLEMENTED
ACTIVITY ACTIVATION HANDOFF: NOT AVAILABLE IN FROZEN VOCABULARY
CONTEXT ASSIGNMENT HANDOFF: NOT IMPLEMENTED
AUTO CONTEXT REPIN: FORBIDDEN
ADMISSION DECISION AS PERMANENT AUTHORITY: FORBIDDEN
CONTEXT READINESS MUTATION: 0
PRODUCTION HANDOFF: NOT YET PERFORMED
ONBOARDING: NOT IMPLEMENTED
```

```
BQA-1F BLOCKED — ORG-CONTEXT GOVERNED MUTATION AUTHORITY REQUIRES EXPLICIT EXTENSION
BQA-1F PRODUCTION HANDOFF VERIFICATION = NOT YET PERFORMED
```
