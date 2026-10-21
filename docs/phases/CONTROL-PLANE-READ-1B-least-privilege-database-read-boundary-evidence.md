# CONTROL-PLANE-READ-1B — Least-Privilege Database Read Boundary

| Field | Value |
| --- | --- |
| Phase | **CONTROL-PLANE-READ-1B — Least-Privilege Database Read Boundary** |
| Parent | CONTROL-PLANE-READ-1 / CONTROL-PLANE-READ-1A |
| Document type | Implementation evidence (repository privilege contract only) |
| Date | 2026-08-24 |
| Formal status | `CONTROL-PLANE-READ-1B CLOSED WITH EVIDENCE — LEAST-PRIVILEGE CONTROL-PLANE DATABASE READ BOUNDARY IMPLEMENTED AND FROZEN` |
| Governing design | CONTROL-PLANE-READ-1A Unified Control Plane Read Architecture & Security Contract |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Start HEAD | `a4382d710214678d11c0e126721452bf1856b69d` |
| Production | **NOT APPLIED TO PRODUCTION** |

This phase does **not** claim that trusted server code can already read TAX/CAP/CTX in Production. The grant migration exists in the repository only. CONTROL-PLANE-READ-1FV applies it.

This phase does **not** create `src/features/control-plane/`, regenerate types, or wire any reader.

---

## A. Architecture source

CONTROL-PLANE-READ-1A selected:

- Database authority: `service_role` → **SELECT only**
- Client roles (`public`, `anon`, `authenticated`): **no** control-plane table privileges
- Read mechanism (later 1C): server-only `createSupabaseServiceRoleClient()` → PostgREST table SELECT
- Not selected: authenticated/anon SELECT, public RPC, private-schema Postgres connection, SECURITY DEFINER read API, resolver, Organization assignment

1B does not reopen that decision.

---

## B. Repository baseline

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `a4382d710214678d11c0e126721452bf1856b69d` |
| Subject | `docs(context): record CTX-1 production verification` |
| Divergence | `0 0` |
| Worktree | clean |

---

## C. New migration

| Field | Value |
| --- | --- |
| File | `supabase/migrations/20260824210000_grant_control_plane_select_to_service_role.sql` |
| SHA-256 | `578bb5028c4e8fa7ea7abb182022ac0d0f99945744e1572ee28b6f0294c94017` |
| Purpose | Fail-closed relation check, then `GRANT SELECT` on exactly 15 named tables to `service_role` |
| Historical files | Unchanged (original TAX/CAP/CTX `REVOKE ALL` remains the earlier story) |

---

## D. Exact 15 tables

TAX (7): `taxonomy_releases`, `taxonomy_foundations`, `taxonomy_industries`, `taxonomy_niches`, `taxonomy_specializations`, `taxonomy_deep_specializations`, `taxonomy_aliases`

CAP (3): `capabilities`, `capability_dependencies`, `capability_readiness`

CTX (5): `context_packs`, `context_pack_versions`, `context_capability_mappings`, `context_terminology`, `context_pack_readiness`

No 16th table. No `GRANT SELECT ON ALL TABLES IN SCHEMA public`. No default privileges.

---

## E. Exact role / privilege matrix (intended after future apply)

| Role | SELECT | INSERT | UPDATE | DELETE | TRUNCATE | REFERENCES | TRIGGER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public` | no | no | no | no | no | no | no |
| `anon` | no | no | no | no | no | no | no |
| `authenticated` | no | no | no | no | no | no | no |
| `service_role` | **yes** (15 tables only) | no | no | no | no | no | no |

Write denial is enforced by **privileges**, not by RLS. `service_role` bypasses RLS.

---

## F. RLS unchanged

No `ENABLE` / `DISABLE` / `FORCE ROW LEVEL SECURITY` in this migration.

Expected after future Production apply: RLS still enabled, FORCE false, on all 15 tables.

---

## G. Zero policies

No `CREATE POLICY`.

anon/authenticated remain denied by table privilege absence **and** by policy absence.

---

## H. No DML privileges

The migration contains 15 statements of the form:

```sql
grant select on table public.<table> to service_role;
```

It does not grant `ALL`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, or `TRIGGER`.

Live Production write-denial is **not** claimed here (not applied).

---

## I. No semantic data mutation

0 INSERT / UPDATE / DELETE / UPSERT.

TAX seed 1 / 4 / 22 / 1 / 0 / 0 / 2, CAP 13 / 7 / 13, CTX 2 / 2 / 10 / 4 / 2 are not encoded in the grant file and are not changed.

---

## J. No Organization assignment

Migration has no `organization_id`, `organizations`, `organization_context_assignments`, or `organization_context_overrides`.

---

## K. No readiness promotion

`capability_readiness` and `context_pack_readiness` appear only as `GRANT SELECT` targets.

Expected future pack readiness remains:

- `foundation.knowledge` v1 → `context_ready`
- `niche.online-course-business` v1 → `context_ready`

---

## L. No application reader yet

No `src/features/control-plane/`. `createSupabaseServiceRoleClient()` unchanged. No Route Handler, Server Action, or public API.

CONTROL-PLANE-READ-1C owns repositories and domain types.

---

## M. No generated types

`src/types/database.generated.ts` was not regenerated. `npm run supabase:types` was not run.

---

## N. Social / Closed Beta untouched

No Social schema, RPCs, Cron, entitlement, or execution-gate changes.

No registration / PATH B / invitations / allowlist / membership / auth changes.

---

## O. DB-MIGRATION-DRIFT-01

Historical Social local vs Production timestamp divergence was **not** repaired.

Not used: `db push --linked`, migration repair, `db pull`, historical rename/rewrite.

Future 1FV must apply this frozen file with the targeted Production apply strategy.

---

## P. Tests / results

New: `tests/security/control-plane-read-grant-security.test.ts` (15 tests)

Proves: exact 15-table SELECT set; `service_role` only; no client grants; no write privileges; no wildcard/default privileges; no policies/RLS change; no functions/views/triggers/schema mutation; no semantic DML; no org assignment; no readiness promotion; historical TAX/CAP/CTX files still `REVOKE ALL`; final migration-chain state is client none + `service_role` SELECT only.

Historical TAX/CAP/CTX security tests were **not** rewritten. They still assert the original schema-file deny-by-default contract. The new file distinguishes that historical revoke from the later SELECT-only exception.

Targeted: TAX/CAP/CTX migration + seed + isolation + R1A/R1C remediation tests passed.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | pass |
| `npx next lint` | No ESLint warnings or errors |
| Targeted security/isolation | 81 + 36 passing |
| Full `npx vitest run` | **2791 passed / 2 failed / 2793 total** |

Known historical failures (unchanged, non-blocking):

1. `tests/features/invitations/load-member-administration-page.test.ts` — foreign org id
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — Progress copy

Previous accepted baseline: 2776 passed / 2 failed / 2778 total. Delta: **+15** from this phase’s security tests. No new failures.

---

## Q. Production status

**NOT APPLIED TO PRODUCTION.**

Production still has `REVOKE ALL` including `service_role` on the 15 catalog tables. Trusted server code **cannot** SELECT them yet.

No MCP `apply_migration`. No `db push`. No grant change on `dmctinrcjvsgmoxwwodw`. No deploy.

---

## Fail-closed prerequisite

Anonymous `DO` block inspects `pg_catalog.pg_class` / `pg_namespace` for all 15 `public` base tables (`relkind = 'r'`). Missing any relation raises:

```text
CONTROL-PLANE-READ-1B: missing required control-plane table(s): …
```

It does not create missing tables. `GRANT` statements follow the check.

Schema `USAGE` on `public` was not added. Repository migrations do not grant schema-wide privileges; platform defaults already allow `service_role` to use `public` relations it is granted.

---

## Next phase

**CONTROL-PLANE-READ-1C** — linked Production type generation, domain types, server-only repositories, capability closure, context version bundle loader, repository tests.

Still no Organization assignment, Context resolver, UI/onboarding wiring, public API, or Production grant apply.

**CONTROL-PLANE-READ-1FV** later applies this frozen SQL and Production-verifies the reader.
