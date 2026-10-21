# CTX-1FV-R1C — Context Pack Child-Protection Trigger Forward Fix

| Field | Value |
| --- | --- |
| Phase | **CTX-1FV-R1C — Context Child-Protection Trigger Forward-Fix Implementation & Freeze** |
| Parent | CTX-1 / CTX-1B / CTX-1B-C / CTX-1FV (blocked) / CTX-1FV-R1A / CTX-1FV-R1B (blocked) |
| Date | 2026-08-24 |
| Formal status | `CTX-1FV-R1C CLOSED — FORWARD FIX IMPLEMENTED AND FROZEN; PRODUCTION NOT REPAIRED` |
| Repository HEAD at R1B incident | `ad008312ebbe9564ac4d289cad7d7b5f0c187f3e` |
| Branch | `core/platform-readiness-20260707` |

This phase does **not** claim CTX-1FV closed, Production repaired, or seed applied.

---

## A. R1B incident

R1A live `context_packs_key_format_check` repair was applied to Production:

| Frozen file | Production version | Name |
| --- | --- | --- |
| `supabase/migrations/20260824190000_create_context_pack_registry.sql` | `20260824180231` | `create_context_pack_registry` |
| `supabase/migrations/20260824200500_fix_context_pack_key_format_check.sql` | `20260824184007` | `fix_context_pack_key_format_check` |

The unchanged frozen seed `20260824190010_seed_context_pack_registry_ctx1.sql` was then applied via MCP `apply_migration`. It failed with:

```text
ERROR 42703: record "new" has no field "mapping_op"
CONTEXT: SQL expression
  tg_table_name = 'context_capability_mappings'
  and new.mapping_op = 'remove'
  and v_completeness = 'full'
FUNCTION: public.context_pack_version_protect_children()
SQL: INSERT INTO public.context_terminology (...)
```

The seed transaction rolled back. Ledger did **not** record `seed_context_pack_registry_ctx1`. Catalog remained:

`context_packs` / `context_pack_versions` / `context_capability_mappings` / `context_terminology` / `context_pack_readiness` = **0 / 0 / 0 / 0 / 0**

Classification: frozen CTX schema trigger-function implementation defect resulting in `SEED_APPLY_BLOCKER`.

Not a seed-content, TAX, CAP, regex-transport, architecture, permission, Organization-assignment, or runtime application defect.

---

## B. Root cause

`public.context_pack_version_protect_children()` is shared by:

- `context_capability_mappings_protect_children` on `public.context_capability_mappings`
- `context_terminology_protect_children` on `public.context_terminology`

The already-applied function referenced a mapping-only column in a single AND expression:

```sql
if tg_table_name = 'context_capability_mappings'
  and new.mapping_op = 'remove'
  and v_completeness = 'full'
then
  ...
end if;
```

PostgreSQL resolves `NEW.mapping_op` against the triggering table's rowtype. `context_terminology` has no `mapping_op`, so draft terminology INSERT (the frozen seed path) raises 42703 even though the table-name predicate is false.

---

## C. Frozen file integrity

These committed files remain byte-for-byte unchanged:

- `supabase/migrations/20260824190000_create_context_pack_registry.sql`
- `supabase/migrations/20260824190010_seed_context_pack_registry_ctx1.sql`
- `supabase/migrations/20260824200500_fix_context_pack_key_format_check.sql`

Historical source still contains the defective AND form. The chain stays transparent:

original schema → key-format repair → child-trigger repair → original seed

---

## D. Forward fix

`supabase/migrations/20260824203000_fix_context_pack_child_protection_trigger.sql`

Behavior:

1. Fail if `public.context_pack_version_protect_children()` does not exist exactly once as a zero-argument trigger function.
2. Fail if the expected mappings and terminology triggers are not present exactly once.
3. `CREATE OR REPLACE FUNCTION` with the same signature, `language plpgsql`, `security invoker`, `set search_path = ''`.
4. Nest `NEW.mapping_op` under `TG_TABLE_NAME = 'context_capability_mappings'` and `TG_OP IN ('INSERT', 'UPDATE')`.
5. Reassert `REVOKE ALL` from `public`, `anon`, `authenticated`, `service_role`.
6. No DML, no table CREATE/DROP, no trigger drop/recreate, no policy, no GRANT.

No semantic redesign: publication immutability, FULL/remove, and DELETE early-return are preserved.

---

## E. Operation semantics

| Path | Expected |
| --- | --- |
| Draft mapping INSERT/UPDATE (valid SET) | allowed |
| Draft terminology INSERT/UPDATE/DELETE | allowed; `mapping_op` is never evaluated |
| FULL draft mapping `mapping_op = remove` | forbidden |
| DELETE | publication-status of `OLD.version_id` only; `NEW.mapping_op` not evaluated |
| Published/superseded child INSERT/UPDATE/DELETE | forbidden on both child tables |
| UPDATE that moves `version_id` away from published/superseded | already blocked via `OLD.version_id` |
| UPDATE/INSERT into published/superseded | already blocked via `NEW.version_id` |
| `context_pack_readiness` | not attached to this function |

OLD/NEW safety review: **PASS**. Existing function already protected both `OLD.version_id` and `NEW.version_id`. This migration does not broaden that contract.

No other table-specific field is referenced outside a table-specific branch. The only mapping-only field is `mapping_op`.

---

## F. Security

- `security invoker` preserved
- `search_path = ''` preserved
- No `GRANT EXECUTE`
- Function remains an internal trigger, not a Context RPC

---

## G. Regression

Static contract tests: `tests/security/context-pack-registry-child-trigger-remediation.test.ts`

Necessary R1A inventory adjustment (not a schema/seed change): `tests/security/context-pack-registry-key-format-remediation.test.ts` now asserts the original schema, seed, and R1A repair remain the first three Context migrations, so a later forward-fix is not forbidden.

**EXECUTABLE LOCAL POSTGRES REGRESSION = NOT AVAILABLE**

Investigated existing isolated paths:

- `npx supabase status` failed: Docker Desktop engine pipe not present
- `docker ps` failed: Docker daemon not running
- `psql` / `pg_isready` not installed

No existing local Supabase instance, migration test database, or project test container was available. A new infrastructure stack was not installed. Production was not used as a test database.

R1D must execute the live function against Production after applying this frozen file, including the exact draft terminology INSERT path, before applying the unchanged seed.

---

## H. Full suite

| Check | Result |
| --- | --- |
| Targeted R1C + R1A + CTX + TAX + CAP | **102 passed** |
| Isolated Postgres execution | **NOT AVAILABLE** (no local Docker/Supabase/psql) |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS |
| Full Vitest | **2776 passed / 2 failed / 2778 total** |

Prior R1A baseline: 2769 passed / 2 failed / 2771 total. Delta = **+7** R1C tests. Same two historical failures only. No new blockers.

---

## I. Production

**Not modified in R1C.** Expected live state remains:

- `create_context_pack_registry` applied (`20260824180231`)
- `fix_context_pack_key_format_check` applied (`20260824184007`) — live pack-key CHECK repaired
- `fix_context_pack_child_protection_trigger` **not applied**
- `seed_context_pack_registry_ctx1` **not applied**
- CTX catalog **0 / 0 / 0 / 0 / 0**
- Live child-protection function **still defective**

---

## J. Next step

**CTX-1FV-R1D:** targeted apply of this function forward-fix, inspect live `pg_proc` definition and trigger registrations, verify no table-specific field leakage, then apply the unchanged frozen seed and resume CTX-1FV gates.

Do not start CONTROL-PLANE-READ-1.
