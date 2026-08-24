# CTX-1FV — Canonical Context Pack Registry Production Verification

| Field | Value |
| --- | --- |
| Phase | **CTX-1FV / CTX-1FV-R1D — Production child-trigger repair, frozen seed apply, and final verification** |
| Parent | CTX-1 / CTX-1A / CTX-1B / CTX-1B-C / CTX-1FV / R1A / R1B / R1C |
| Date | 2026-08-24 |
| Formal status | `CTX-1FV CLOSED WITH EVIDENCE — CANONICAL CONTEXT PACK REGISTRY PRODUCTION VERIFIED` |
| Implementation HEAD | `95b4b49e5d0a0ed489a0c5121ed2c4932834ea0d` |
| R1A HEAD | `ad008312ebbe9564ac4d289cad7d7b5f0c187f3e` |
| R1C HEAD | `61c041a5a417dd9fc50b8486c4a66237f6d7dd4e` |
| Branch | `core/platform-readiness-20260707` |

This document does **not** hide the R1A regex-transport incident or the R1B child-trigger 42703 incident.

`CTX-1 registry = Production verified` does **not** mean pack runtime readiness is `production_verified`.

---

## A. CTX-1B implementation / freeze

Canonical Context Pack registry was implemented and frozen as:

- Commit: `95b4b49e5d0a0ed489a0c5121ed2c4932834ea0d`
- Subject: `feat(context): add canonical CTX-1 context pack foundation`
- Schema: `supabase/migrations/20260824190000_create_context_pack_registry.sql`
- Seed: `supabase/migrations/20260824190010_seed_context_pack_registry_ctx1.sql`

Five global tables. No `organization_id`. Deny-by-default (RLS on, FORCE false, 0 policies, no runtime grants). Seed contract 2 / 2 / 10 / 4 / 2. Pack readiness `context_ready`, `verified_at` NULL, inert resolver scope.

Hashes at R1D (unchanged vs those commits / R1A / R1C):

| File | Hash |
| --- | --- |
| `20260824190000_create_context_pack_registry.sql` | `855cb551fdc3a1f8ff8769389027634f555dd496` |
| `20260824190010_seed_context_pack_registry_ctx1.sql` | `7896dcabb6ba851d5c0ef455a276e776192e0f1a` |
| `20260824200500_fix_context_pack_key_format_check.sql` | `507af7d468e7a9c1cffa632df434f2927b744b5e` |
| `20260824203000_fix_context_pack_child_protection_trigger.sql` | `0d8c5dbbf986f2802fae1d88efe1aae0f69ecc03` |

Original schema and seed were **never edited**.

---

## B. Initial targeted schema apply

Production project: `dmctinrcjvsgmoxwwodw` (`ACTIVE_HEALTHY`, `eu-central-1`, host `db.dmctinrcjvsgmoxwwodw.supabase.co`). Canonical app: `https://www.zyntixai.com`.

Method: MCP `apply_migration` of frozen SQL. **Not** `db push --linked`. DB-MIGRATION-DRIFT-01 (historical Social local/remote timestamps) was not repaired or rewritten.

| Frozen file | Production version | Name | Result |
| --- | --- | --- | --- |
| `20260824190000_create_context_pack_registry.sql` | `20260824180231` | `create_context_pack_registry` | success |

Five Context tables existed. Catalog was empty. Seed was **not** applied in that first apply.

---

## C. R1A incident — transported pack-key regex

Live `context_packs_key_format_check` rejected frozen seed keys `foundation.knowledge` and `niche.online-course-business`.

Cause: Production apply reconstructed POSIX `\.` with different escaping. Frozen source grammar was correct.

Seed was correctly withheld (`SCHEMA_APPLY_BLOCKER`).

R1A repository forward-fix `20260824200500_fix_context_pack_key_format_check.sql` (`ad00831`) replaced the CHECK with transport-safe `[.]`:

```text
^[a-z][a-z0-9_]*([.][a-z0-9]+(-[a-z0-9]+)*)+$
```

R1B applied that file to Production as `20260824184007` `fix_context_pack_key_format_check`. Live CHECK then accepted both seed keys. Identities were not weakened.

---

## D. R1B seed attempt — child-trigger 42703

Unchanged frozen seed was applied and failed:

```text
ERROR 42703: record "new" has no field "mapping_op"
FUNCTION: public.context_pack_version_protect_children()
SQL: INSERT INTO public.context_terminology (...)
```

Shared trigger referenced `NEW.mapping_op` in a single AND with `tg_table_name = 'context_capability_mappings'`. `context_terminology` has no that column.

Transaction rolled back. Seed was **not** recorded in the ledger. Catalog remained **0 / 0 / 0 / 0 / 0**. Blocker: `SEED_APPLY_BLOCKER`.

This was a frozen schema trigger-function defect, not a seed-content defect.

---

## E. R1C remediation

Repository forward-fix `20260824203000_fix_context_pack_child_protection_trigger.sql` (`61c041a`) replaced only `public.context_pack_version_protect_children()` so `NEW.mapping_op` is read after nested:

- `TG_TABLE_NAME = 'context_capability_mappings'`
- `TG_OP IN ('INSERT', 'UPDATE')`

Local executable Postgres was **not available**. Static regression **PASS**. Production was not modified in R1C.

---

## F. R1D Production function repair

R1D start HEAD: `61c041a5a417dd9fc50b8486c4a66237f6d7dd4e`. Divergence `0 0`. Worktree clean.

Pre-apply live function still contained the defective AND form. Triggers on mappings and terminology still pointed at that function. `context_pack_readiness` did not. `prosecdef = false`, `search_path = ''`. Runtime EXECUTE for `public` / `anon` / `authenticated` / `service_role` = false.

Applied committed file via MCP `apply_migration` name `fix_context_pack_child_protection_trigger`. Result: **success**. Production version: `20260824185314`.

Post-apply live `pg_get_functiondef` contained nested table/operation branches, DELETE `RETURN OLD` before any `NEW.mapping_op`, FULL/remove exception, published/superseded child protection, and OLD/NEW `version_id` movement protection. Triggers were not dropped/recreated. Privileges remained revoke-only.

---

## G. Frozen seed live regression

Pre-seed catalog still **0 / 0 / 0 / 0 / 0**. TAX `knowledge` and `online-course-business` present once. Required CAP keys present once. Live CHECK still accepted both seed keys.

Applied committed `20260824190010_seed_context_pack_registry_ctx1.sql` via MCP `apply_migration` name `seed_context_pack_registry_ctx1`. Result: **success**. Production version: `20260824185459`.

The seed itself is the live PostgreSQL proof:

- **DRAFT CAPABILITY MAPPING LIVE POSTGRES REGRESSION = PASS**
- **DRAFT TERMINOLOGY LIVE POSTGRES REGRESSION = PASS**

Publication and readiness INSERT then succeeded. Exact catalog: **2 / 2 / 10 / 4 / 2**.

---

## H. Inheritance / CAP closure

`niche.online-course-business` v1 parent = `foundation.knowledge` v1. Industry Context pack count = 0.

Foundation mappings (4 SET required): `shared.crm.customers`, `knowledge.programs`, `knowledge.enrollments`, `knowledge.progress`.

Niche mappings (6 SET): leads recommended; five Social optional. No Foundation duplicates. No `core.*`. No REMOVE.

Resolved Niche Context: those four required + leads recommended + five Social optional. Core baseline unstored.

CAP graph: `knowledge.progress` transitively requires `knowledge.enrollments`, `knowledge.programs`, `shared.crm.customers`. All are Foundation required. CTX has no copied dependency table. **PASS**.

---

## I. Security / immutability

| Gate | Production result |
| --- | --- |
| Five CTX tables | exactly those five; no org-assignment / catch-all JSON table |
| RLS | enabled; FORCE false; 0 policies |
| Table grants (`public`/`anon`/`authenticated`/`service_role`) | empty |
| Integrity functions | invoker; no runtime EXECUTE; not RPCs |
| Version integrity | live trigger `context_pack_versions_enforce_integrity`; published → superseded only |
| Child semantics | live repaired function on mappings + terminology; readiness independently mutable |
| Terminology | 4 Foundation `en` identity maps; Niche 0 |

Published Production rows were **not** mutated to prove denial.

---

## J. Registry vs pack readiness

| Surface | Status |
| --- | --- |
| CTX-1 registry | **Production verified** |
| `foundation.knowledge` v1 | `context_ready` (`verified_at` NULL, `evidence_phase` CTX-1B, inert resolver scope) |
| `niche.online-course-business` v1 | `context_ready` (same) |

Neither version is `beta_supported` or `production_verified`. No resolver exists. This is correct.

Live readiness CHECKs: `planned` / `context_ready` / `beta_supported` / `production_verified`; `supported_scope` must be a JSON object; `context_ready` requires non-empty scope; planned/context_ready require `verified_at` NULL; beta/production_verified require evidence_phase + `verified_at`.

---

## K. Runtime isolation / Organization assignment

No `src/` Context consumer. Generated types unchanged. `organizations` has no `context_pack_id` / `context_version_id`. No `organization_context_assignments` / `organization_context_overrides`. No Organization assigned.

---

## L. TAX / CAP unchanged

TAX remains **1 / 4 / 22 / 1 / 0 / 0 / 2**. `knowledge` once. `online-course-business` once. `manufacturing-and-production` → `product-operations`.

CAP remains **13 / 7 / 13**. Social `owner_class` remains `horizontal`. No CAP DML from CTX.

---

## M. Closed Beta / Social safety

- `GET https://www.zyntixai.com/login` → **200**
- `GET https://www.zyntixai.com/register` → **307** `/login?registration=disabled` (`PUBLIC_REGISTRATION_ENABLED` fail-closed)
- PATH B / invitations / allowlist / delivery / acceptance were not changed
- Social Cron unchanged: jobid 1, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active. Scheduler was **not** invoked by this phase. No provider writes.
- `SOCIAL_SCHEDULING_ENABLED` / `SOCIAL_PUBLISHING_ENABLED` were not changed. CTX Social rows are optional relevance only.

---

## N. DB-MIGRATION-DRIFT-01

Untouched. No `db push --linked`, no migration repair, no `db pull` reconciliation, no DROP, no ledger rewrite.

Final mapping:

| Frozen file | Remote version | Name |
| --- | --- | --- |
| `20260824190000_create_context_pack_registry.sql` | `20260824180231` | `create_context_pack_registry` |
| `20260824200500_fix_context_pack_key_format_check.sql` | `20260824184007` | `fix_context_pack_key_format_check` |
| `20260824203000_fix_context_pack_child_protection_trigger.sql` | `20260824185314` | `fix_context_pack_child_protection_trigger` |
| `20260824190010_seed_context_pack_registry_ctx1.sql` | `20260824185459` | `seed_context_pack_registry_ctx1` |

---

## O. Final verdict

Targeted R1A+R1C+CTX+TAX+CAP: **102 passed**. `npx tsc --noEmit` PASS. `npx next lint` PASS. Full Vitest: **2776 passed / 2 failed / 2778 total**. Same two historical failures only.

CTX-1FV-R1D CLOSED — CONTEXT CHILD TRIGGER REMEDIATED, FROZEN SEED APPLIED AND PRODUCTION VERIFIED

CTX-1FV CLOSED WITH EVIDENCE — CANONICAL CONTEXT PACK REGISTRY PRODUCTION VERIFIED

CTX-1 CANONICAL CONTEXT PACK REGISTRY = PRODUCTION VERIFIED

Pack runtime readiness remains `context_ready` until a future Context resolver consumes these versions in an evidence-backed Product journey.
