# TAX-1FV — Canonical Taxonomy Registry Production Verification

| Field | Value |
| --- | --- |
| Phase | **TAX-1FV — Canonical Taxonomy Registry Production Apply & Final Verification** |
| Parent | TAX-1 / TAX-1B / TAX-1B-C |
| Date | 2026-08-24 |
| Formal status | `TAX-1FV CLOSED WITH EVIDENCE — CANONICAL TAXONOMY REGISTRY PRODUCTION VERIFIED` |
| Implementation HEAD | `bb44cb70f6f05c02a1290e453052294b5fbe04b0` |
| Branch | `core/platform-readiness-20260707` |

This phase does **not** claim TAX-1C read surface, TAX-2 niche library, Organization assignment, Context, Capability, or Closed Beta runtime change.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `bb44cb70f6f05c02a1290e453052294b5fbe04b0` |
| Subject | `feat(taxonomy): add canonical TAX-1 registry foundation` |
| Parent | `5f1126981128f8ed9e9763e0b81697026fba7c52` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Start worktree | clean |

---

## B. Production target verification

| Item | Evidence |
| --- | --- |
| Linked project ref | `dmctinrcjvsgmoxwwodw` (`supabase/.temp/project-ref`) |
| MCP `get_project` | same id, status `ACTIVE_HEALTHY`, region `eu-central-1`, Postgres `17.6.1.141` |
| Host | `db.dmctinrcjvsgmoxwwodw.supabase.co` |
| Canonical app | `https://www.zyntixai.com` |
| Identity match | Same Production project used by Closed Beta / Social evidence |

No passwords, service-role keys, or connection strings recorded.

---

## C. Migration apply

`npx supabase db push --linked --dry-run` **cannot** apply TAX-1 because of **pre-existing Social timestamp drift** (local vs remote versions for B1.8/B1.9/scheduler files). Repair/`db pull` was **not** used.

Established safe workflow (same as prior Social targeted applies): MCP `apply_migration` of the **full frozen SQL** onto `dmctinrcjvsgmoxwwodw` only.

| Frozen file | MCP name | Production `schema_migrations.version` | Result |
| --- | --- | --- | --- |
| `20260824153300_create_taxonomy_registry.sql` | `create_taxonomy_registry` | `20260824162408` | success |
| `20260824153310_seed_taxonomy_registry_tax1.sql` | `seed_taxonomy_registry_tax1` | `20260824162611` | success |

MCP stamps apply-time versions (same historical pattern as Social). File timestamps remain the repository identity. Names match the frozen files. No duplicate TAX-1 rows. No `db reset`. No DROP. No tenant data mutation. Ledger versions were **not** rewritten after apply.

Pre-apply: versions `20260824153300` / `20260824153310` absent; latest remote `20260822124924` `add_organization_member_labels_rpc`; no `public.taxonomy_*` tables.

---

## D. Production schema

Seven tables exist: `taxonomy_releases`, `taxonomy_foundations`, `taxonomy_industries`, `taxonomy_niches`, `taxonomy_specializations`, `taxonomy_deep_specializations`, `taxonomy_aliases`.

| Gate | Result |
| --- | --- |
| `organization_id` on taxonomy tables | none |
| `organizations` taxonomy FKs | none |
| Assignment tables | none |
| RLS enabled (7 tables) | true |
| FORCE RLS | false |
| Policy count | 0 |
| Grants to `public` / `anon` / `authenticated` / `service_role` | **none** |
| Taxonomy RPCs | none |

Lifecycle CHECK: `draft \| active \| superseded`. Visibility CHECK: `internal \| listed`. No `beta_supported` / `production_verified` / `context_ready` / `foundation_ready`.

---

## E. Exact seed evidence

Counts: **1 / 4 / 22 / 1 / 0 / 0 / 2**

- Release: `ucf-tax-1` active
- Foundations: `knowledge`, `service`, `field-operations`, `product-operations` (active, listed)
- Niche: `online-course-business` → `education-and-learning` → `knowledge` (active, listed)
- Aliases: `Course Seller` / `course seller` / `en`; `Course Sellers` / `course sellers` / `en`; both → that Niche only
- `manufacturing-and-production` → `product-operations`
- No fifth Foundation

Industry parent map (22): Knowledge 3, Service 7, Field Operations 6, Product Operations 6 — matches TAX-1A/TAX-1B contract.

---

## F. Runtime isolation

- No `src/` taxonomy consumer (isolation tests PASS)
- Onboarding columns on `organizations` unchanged (`business_type` and siblings still present; not rewritten)
- PATH B / invitations / CRM / Knowledge / Tasks / Attention / AppShell / Social **not modified** in this phase
- No Organization classified by TAX-1

---

## G. Regression

| Check | Result |
| --- | --- |
| Targeted TAX-1B (22) | PASS |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS |
| Full Vitest | **2696 passed / 2 failed / 2698 total** |

Historical failures unchanged (non-blocking):

1. `tests/features/invitations/load-member-administration-page.test.ts` — foreign org id
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — Progress copy

No new failures. Generated types **not** regenerated.

---

## H. Social safety

- No Social source/migration/env change in TAX-1FV
- Cron still exactly one job: `zyntixai_social_publication_scheduler_5m`, schedule `*/5 * * * *`, `active=true`
- Vercel Production: `SOCIAL_SCHEDULING_ENABLED` and `SOCIAL_PUBLISHING_ENABLED` remain Encrypted; last env write **3d ago** (not this phase)
- Fail-closed parsers still require exact `"true"`; this phase did **not** enable either gate
- No provider writes, no publish, no scheduler trigger invoked by TAX-1FV
- `PUBLIC_REGISTRATION_ENABLED` still **absent** from Production env list (PATH B fail-closed)

---

## I. Scope exclusions

No TAX-1C, TAX-2, CAP-1, Context, Party, Service/Field/Product verticals, Data Intake, or Work Area runtime.

---

## J. Final verdict

```text
TAX-1FV CLOSED WITH EVIDENCE — CANONICAL TAXONOMY REGISTRY PRODUCTION VERIFIED
TAX-1 CANONICAL TAXONOMY REGISTRY = PRODUCTION VERIFIED
```

Visual owner confirmation: **not required** (no UI / no assignment / no runtime consumer).

Non-mutating smoke: `https://www.zyntixai.com/login` → `200`, `X-Matched-Path: /login`.
