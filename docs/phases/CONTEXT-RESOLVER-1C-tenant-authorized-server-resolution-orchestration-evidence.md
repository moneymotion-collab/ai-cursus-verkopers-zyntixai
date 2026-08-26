# CONTEXT-RESOLVER-1C — Tenant-Authorized Server Resolution Orchestration

| Field | Value |
| --- | --- |
| Phase | **CONTEXT-RESOLVER-1C — SERVER INPUT LOADER + TENANT-AUTHORIZED RESOLUTION ORCHESTRATION** |
| Parent | CONTEXT-RESOLVER-1B / CONTEXT-RESOLVER-1B-R1A |
| Document type | Server orchestration implementation evidence |
| Date | 2026-08-26 |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `67c8d7ea4642ae1905b2a899215804b074d6673d` |

**TENANT AUTHORIZATION: AUTHENTICATED MEMBERSHIP + RLS**

**GLOBAL CONTROL PLANE: SERVER-ONLY SERVICE_ROLE READ**

**PURE RESOLUTION ENGINE: REUSED WITHOUT SEMANTIC DUPLICATION**

**PRODUCTION CONTEXT RESOLUTION: NOT YET VERIFIED**

---

## A. Starting baseline

Proven before implementation:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `67c8d7ea4642ae1905b2a899215804b074d6673d` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

## B. 1B/R1A dependency

The frozen pure engine is invoked unchanged. Server code does not duplicate mapping merge, dependency coherence, locale selection, Core baseline, or provenance. R1A optional CAP readiness is preserved: missing rows become `readinessStatus: null`.

## C. Server boundary

`src/features/context-resolver/server/**` is `server-only`. No public API, no Server Action, no browser hook, no feature barrel, no product consumer.

Entrypoints:

- `resolveBusinessActivityContext({ organizationId, activityId, mode, locale? })`
- `resolvePrimaryBusinessActivityContext({ organizationId, mode, locale? })`

## D. Caller identity

Caller identity comes from `createSupabaseServerClient()` → `auth.getUser()` via existing `resolveOrganizationContext`. No trusted `userId` parameter. No JWT claims from function arguments. Unauthenticated → `UNAUTHORIZED`.

## E. Organization membership

Active membership in the **explicit** Organization is required before any Control Plane read. Owner, Admin, Staff, and Viewer are allowed. Suspended/removed/invited/non-member are denied.

Platform-operator env/allowlist is not imported. Mutation operator authority is not used.

## F. Tenant RLS read strategy

After membership, tenant rows are loaded through `OrganizationContextRepository` constructed with the **authenticated** server client (cast to the existing query-client interface). Normal resolve does **not** use `createOrgContextQueryClient()` / service_role.

Queries remain org-scoped:

- Activity: `organization_id` + `id`
- Assignment: `organization_id` + `business_activity_id` + `status = active`

## G. Activity loading

Exact Activity only. Missing → `ACTIVITY_NOT_FOUND`. Foreign Activity under an authenticated org (repository can still see it without RLS in tests) → `ACTIVITY_NOT_OWNED_BY_ORG`. Under real RLS the second lookup returns empty and collapses to `ACTIVITY_NOT_FOUND` (tenant-honest). Unclassified → `ACTIVITY_UNCLASSIFIED` before catalog load. Archived/draft → fail-closed in the pure engine.

## H. Assignment loading

Exactly one active assignment continues. Zero → `CONTEXT_UNASSIGNED`. More than one → `CATALOG_INTEGRITY_ERROR`. Superseded history is not inspected to choose a pin.

## I. Organization locale

`organizations.locale` is loaded after membership via `getOrganizationLocale`. Browser `Accept-Language`, profile locale, Social locale, and IP are not used.

## J. Exact pin

Leaf version id is only `activeAssignment.context_pack_version_id`. Callers cannot supply a Context version id. Newer published versions in the catalog are ignored.

## K. Pinned chain load

The loader follows `parent_version_id` from the exact leaf until null, max depth 8. Missing parent → `PARENT_CONTEXT_NOT_FOUND`. Cycle → `PARENT_CONTEXT_CYCLE`. TAX is not used to discover parents.

## L. Context batch reads

After chain ids are known, one batched read each for:

- packs by id
- mappings for all version ids
- terminology for all version ids
- pack readiness for all version ids (missing parent readiness omitted)

## M. TAX path

Canonical path is loaded from the Activity classification target via `getTaxonomyPathById`. The leaf pack is not used as a substitute classification. The pure engine still validates exact Activity ↔ leaf pack compatibility and real parent TAX ancestry.

## N. CAP loading strategy

**Option A:** load the complete canonical capability catalog, all hard `requires` edges, and all existing readiness rows once per resolution.

Chosen because the global catalog is small (currently 13 mapped+Core capabilities). Recursive per-key closure queries would add complexity without a present scale problem. Future large catalogs can switch to batched key+closure loads without changing the pure engine.

The loader never inserts extra capabilities into Context. A decoy unmapped catalog capability does not appear in `relevantCapabilities`. Core keys are expected in the catalog definitions; the engine still fails if a Core definition is missing.

## O. Optional CAP readiness handling

`listReadiness()` returns only existing rows. Mapped/Core capabilities without a row resolve with `readinessStatus: null`. Explicit `planned` is copied through. Planned is never synthesized.

## P. Dependency graph input

Canonical hard `requires` edges are supplied in full. The pure engine owns cycle detection, transitive coherence, required-strength, and REMOVE-vs-requires.

## Q. Leaf Context readiness

Leaf pack readiness is the resolution-mode gate. `internal_qa` + `context_ready` is allowed. Missing or `planned` leaf readiness fails in the engine. Parent pack readiness does not independently block. No readiness writes.

## R. Locale input preservation

`requestedLocale = explicit locale ?? organization.locale ?? null`

The server does **not** substitute the leaf pack default as the requested locale. That keeps engine provenance honest (`nl-NL` requested, `en` resolved, `fallbackUsed: true`).

## S. Pure engine invocation

Server constructs `ContextResolutionInput` and calls `resolveEffectiveContext`. One semantic implementation.

## T. Primary convenience resolver

`resolvePrimaryBusinessActivityContext` authenticates, requires membership, loads the exact primary Activity for that Organization, then delegates to the core resolver. Zero primary → `NO_PRIMARY_ACTIVITY`. Multiple primaries → `CATALOG_INTEGRITY_ERROR`. First non-primary is never selected. Foreign org primary is never selected.

## U. Query plan

Bounded logical round trips (no cache, no per-capability queries):

1. `auth.getUser`
2. active `organization_members`
3. `organizations.locale`
4. exact Business Activity
5. exact active assignment
6. Context versions along the pinned parent chain (1–8 sequential, because each parent id is discovered from the previous row)
7. packs for chain pack ids (batch)
8. mappings for chain version ids (batch)
9. terminology for chain version ids (batch)
10. Context pack readiness for chain version ids (batch)
11. TAX path from Activity classification (canonical parent walk)
12. full CAP definitions
13. CAP dependency edges (current reader also re-reads capability rows; acceptable at current catalog size)
14. CAP readiness catalog

Sequential catalog reads are accepted: Context versions are immutable, pins are exact, TAX/CAP/CTX are migration-managed, and the engine validates integrity on the assembled snapshot. No cross-reader DB transaction.

## V. Error contract

| Condition | Code |
| --- | --- |
| No session | `UNAUTHORIZED` |
| Foreign or missing org / inactive membership | `ORG_NOT_FOUND` (same tenant-honest collapse as existing `ORG_CONTEXT_MISSING`) |
| Missing Activity | `ACTIVITY_NOT_FOUND` |
| Activity in another org (visible to query client) | `ACTIVITY_NOT_OWNED_BY_ORG` |
| No primary | `NO_PRIMARY_ACTIVITY` |
| Unclassified | `ACTIVITY_UNCLASSIFIED` |
| No active assignment | `CONTEXT_UNASSIGNED` |
| Leaf not resolvable for mode | `CONTEXT_NOT_RESOLVABLE_FOR_MODE` |
| Read failure | `DATABASE_READ_ERROR` |
| Pure integrity | unchanged 1B codes |

`CONTEXT_UNASSIGNED` is not rewritten as a generic 500. No Context substitution.

## W. service_role separation

`createControlPlaneReaders()` is invoked only after `loadTenantResolutionContext` succeeds. Tests assert Control Plane factory call count is 0 for unauthenticated, non-member, suspended, and foreign-org cases. `createSupabaseServiceRoleClient` is not imported by the resolver server layer.

## X. No writes / product / API / entitlement

No INSERT/UPDATE/DELETE, no mutation RPC, no snapshot table, no cache, no `/api/context`, no Home/AppShell/onboarding/Social/CRM consumers. Output remains `relevantCapabilities`. Membership is permission to resolve tenant Context, not entitlement.

## Y. Tests

- Server auth matrix (unauthenticated, non-member, suspended, owner/admin/staff/viewer, foreign org, cross-tenant activity)
- Tenant loader (exact Activity, missing, unassigned, duplicate active assignment)
- Primary convenience (delegate, none, multiple, never first/non-primary/foreign)
- Exact pin / superseded / draft / missing parent / ignore newer version
- CAP definition missing, planned vs missing readiness, Core missing readiness
- Leaf Context planned/missing vs per-capability missing
- Locale preservation / fallback metadata
- Control Plane batch reader tests
- ORG-CONTEXT locale read
- Server + domain isolation
- Existing Control Plane / ORG-CONTEXT / Social isolation regressions

## Z. Production untouched

No Production resolve execution. No mutation. No env/deploy. Retained QA fixture is unchanged and unused by 1C tests.

---

CONTEXT-RESOLVER-1C CLOSED WITH EVIDENCE — TENANT-AUTHORIZED SERVER RESOLUTION ORCHESTRATION IMPLEMENTED AND FROZEN
