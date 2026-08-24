# CONTROL-PLANE-READ-1C — Typed Server-Only Control-Plane Reader

| Field | Value |
| --- | --- |
| Phase | **CONTROL-PLANE-READ-1C — Typed Server-Only Control-Plane Reader** |
| Parent | CONTROL-PLANE-READ-1 / 1A / 1B |
| Document type | Implementation evidence (repository reader only) |
| Date | 2026-08-24 |
| Formal status | `CONTROL-PLANE-READ-1C CLOSED WITH EVIDENCE — TYPED SERVER-ONLY CONTROL-PLANE READER IMPLEMENTED AND FROZEN` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `5ef8c25a2e00f5c02bbe81b6bb12e5d1aa7e6626` |
| Production grant | **CONTROL-PLANE-READ-1B GRANT NOT APPLIED TO PRODUCTION** |
| Reader | **IMPLEMENTED BUT NOT PRODUCTION VERIFIED** |

This phase does **not** close CONTROL-PLANE-READ-1. Live `service_role` catalog SELECT remains unauthorized until CONTROL-PLANE-READ-1FV.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `5ef8c25a2e00f5c02bbe81b6bb12e5d1aa7e6626` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

---

## B. 1A architecture contract

Trusted server-only logic → existing `createSupabaseServiceRoleClient()` → PostgREST table SELECT → hand-written domain models.

No public API. No resolver. No Organization assignment. No user-session requirement on the reader.

---

## C. 1B frozen grant dependency

`supabase/migrations/20260824210000_grant_control_plane_select_to_service_role.sql` is unchanged.

Intended future Production authorization remains SELECT-only `service_role` on the 15 tables. 1C did not apply it.

---

## D. Linked Production typegen target proof

| Check | Value |
| --- | --- |
| `supabase/.temp/project-ref` | `dmctinrcjvsgmoxwwodw` |
| MCP `get_project` | `dmctinrcjvsgmoxwwodw`, `ACTIVE_HEALTHY`, `eu-central-1` |
| DB host | `db.dmctinrcjvsgmoxwwodw.supabase.co` |
| Canonical app | `https://www.zyntixai.com` |
| Command | `npm run supabase:types` → `supabase gen types typescript --linked > src/types/database.generated.ts` |

Read-only schema metadata. No `db push`. No `db pull`. No MCP `apply_migration`.

Production catalog counts observed via table inventory (not via the new reader): TAX 1/4/22/1/0/0/2, CAP 13/7/13, CTX 2/2/10/4/2.

---

## E. Generated type diff review

| | Before | After |
| --- | --- | --- |
| SHA-256 | `81dcf92377311ccb172e0a699ee4916ab67456882568acd0862d507571b96770` | `bdb01d94583c6c74db4629849137002e5b0a821bc7bd95d3f6e97e33f656b91f` |
| Lines | 2156 | 6979 |

Classification:

**A. Expected control-plane addition.** All 15 TAX/CAP/CTX tables now exist under `Database["public"]["Tables"]`.

**B. Legitimate existing Production schema difference.** The previous generated file lagged Production: Social tables/RPCs and richer `Relationships` metadata were missing. No tables or functions were removed.

**C. Unexplained / suspicious.** None.

Two existing modules needed type-only compile adapters so `tsc` matches the more accurate Production types:

- `src/features/attention/server/attention-read-queries.ts` — `customer_id` / `program_id` are nullable; index only when present.
- `src/features/onboarding/server/apply-onboarding.ts` — optional RPC args are `string?`, so `?? undefined` instead of `?? null`.

These are not control-plane wiring and do not change AppShell/Home/onboarding product flow.

---

## F. Added control-plane domain types

`src/features/control-plane/domain/types.ts` — internal server models: taxonomy refs/path/alias, capability definition/edge/readiness, context pack/version/mapping/terminology/readiness/bundle.

Generated `Tables["..."]["Row"]` is not the application contract.

---

## G. Error model

`NOT_FOUND` | `AMBIGUOUS` | `CATALOG_INTEGRITY_ERROR` | `UNSUPPORTED_STATE` | `DATABASE_READ_ERROR`

Result union `{ ok: true, value } | { ok: false, error }`. Unknown is valid. No first-row fallback.

---

## H. Server-only client boundary

`src/features/control-plane/server/control-plane-client.ts` imports `server-only` and reuses `createSupabaseServiceRoleClient()`. Repositories accept an injected `ControlPlaneQueryClient` for tests.

---

## I. TAX repository

By-key lookups, active release (exactly one), mechanical `getTaxonomyPath`, active/listed children, alias candidates (`NOT_FOUND` / unique / `AMBIGUOUS`).

---

## J. CAP repository

`findByKey`, batched `listByKeys`, `listCatalog` (active+listed default), `getDirectDependencies`, `getReadiness` as data.

---

## K. Capability closure

Pure `computeCapabilityClosure` in domain. Cycle → `CATALOG_INTEGRITY_ERROR`. No duplicated CAP seed graph.

---

## L. CTX repository

Pack by key and typed taxonomy target, version by id / pack+number, published list, explicit superseded fetch, parent by `parent_version_id`, stored mappings/terminology, pack readiness.

---

## M. ContextVersionBundle

`loadContextVersionBundle(versionId)` returns pack, version, parentVersion, stored mappings, stored terminology, readiness, referenced capabilities for **that version only**. Niche v1 fixture has 6 mappings, not inherited Foundation rows.

---

## N. Explicit non-resolver boundary

No Core baseline, merge, locale fallback, Work Area, role, or authorization.

---

## O. Explicit zero Organization assignment

No `organization_id`, assignment tables, or org queries in control-plane code.

---

## P. Zero product/UI wiring

No `src/app` imports of control-plane. No route, Server Action, or React provider.

---

## Q. Server-only security controls

`import "server-only"` on all server modules. Service-role factory only in `control-plane-client.ts`. Domain has no env/service-role. No DML methods. 1B grant file unchanged.

---

## R. Tests

- `tests/features/control-plane/*` (memory client; no live Production SELECT)
- `tests/security/control-plane-reader-security.test.ts`
- generated-type coverage in `tests/types/database-contract.test.ts`
- TAX/CAP/CTX runtime isolation now allows `src/features/control-plane/` and `database.generated.ts`, and still forbids product surfaces
- `security-boundary.test.ts` allows the new client module

---

## S. Full-suite result

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | pass |
| `npx next lint` | No ESLint warnings or errors |
| Full `npx vitest run` | **2831 passed / 2 failed / 2833 total** |

Historical failures unchanged:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

1B baseline 2791/2/2793. Delta **+40** from this phase.

---

## T. DB-MIGRATION-DRIFT-01 unchanged

Not repaired. No `db push --linked`. No migration repair.

---

## U. Production status

**1B SELECT grant is not applied.** The server reader exists in git and is not Production-authorized. Pack readiness remains `context_ready`. Closed Beta and Social are unwired from this reader.
