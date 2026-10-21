# CAP-1FV — Canonical Capability Registry Production Verification

| Field | Value |
| --- | --- |
| Phase | **CAP-1FV — Canonical Capability Registry Production Apply & Final Verification** |
| Parent | CAP-1 / CAP-1A / CAP-1B / CAP-1B-C |
| Date | 2026-08-24 |
| Formal status | `CAP-1FV CLOSED WITH EVIDENCE — CANONICAL CAPABILITY REGISTRY PRODUCTION VERIFIED` |
| Implementation HEAD | `869fa2317dc5089257bbaa9f3a62afac1c35b931` |
| Branch | `core/platform-readiness-20260707` |

This phase does **not** claim CAP-1C read surface, Organization enablement, Context, TAX-2, or Closed Beta runtime change.

`production_verified` does **not** mean Social execution gates ON.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `869fa2317dc5089257bbaa9f3a62afac1c35b931` |
| Subject | `feat(capabilities): add canonical CAP-1 registry foundation` |
| Parent | `a6c5bcf689e660c8e61e74a7a7506ef946df7c4d` |
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
| Identity match | Same Production project as TAX-1FV / Closed Beta |

No passwords, service-role keys, or connection strings recorded.

---

## C. Pre-apply state

- CAP-1 versions/names **absent**. Latest remote then: `20260824162611` `seed_taxonomy_registry_tax1`.
- TAX-1 already present: `20260824162408` `create_taxonomy_registry`, `20260824162611` `seed_taxonomy_registry_tax1`.
- No `public.capabilities` / `capability_dependencies` / `capability_readiness`.
- TAX-1 `knowledge` Foundation present, active, listed; four Foundations total.

`npx supabase db push --linked` was **not** used (DB-MIGRATION-DRIFT-01).

---

## D. Migration apply

Established workflow: MCP `apply_migration` of the **full frozen SQL** onto `dmctinrcjvsgmoxwwodw` only.

| Frozen file | MCP name | Production `schema_migrations.version` | Result |
| --- | --- | --- | --- |
| `20260824180000_create_capability_registry.sql` | `create_capability_registry` | `20260824171201` | success |
| `20260824180010_seed_capability_registry_cap1.sql` | `seed_capability_registry_cap1` | `20260824171622` | success |

MCP stamps apply-time versions (same TAX-1FV pattern). File timestamps remain the repository identity. Names match frozen files. No duplicate CAP-1 rows. No `db reset`. No DROP. No tenant mutation. Ledger not rewritten.

---

## E. Schema

Three tables exist. No `organization_id`. No assignment tables.

Production CHECKs: lifecycle `draft|active|deprecated|superseded`; visibility `internal|listed`; readiness `planned|context_ready|foundation_ready|beta_supported|production_verified`; `production_verified` requires evidence_phase + verified_at + non-empty JSON object scope; lower states require `verified_at` NULL.

---

## F. Capability seed

Count: **13**. All `active` / `listed`.

Keys: `core.tasks`, `core.attention`, `core.member-administration`, `shared.crm.leads`, `shared.crm.customers`, `knowledge.programs`, `knowledge.enrollments`, `knowledge.progress`, `horizontal.social.connection`, `horizontal.social.content`, `horizontal.social.approval`, `horizontal.social.scheduling`, `horizontal.social.publishing`.

No Stories / Service / Field / Product / Files / Search / Analytics / Auth / Invitations rows.

Ownership: Core `core`/`platform` NULL; CRM `shared`/`crm` NULL; Knowledge `foundation`/`knowledge` JOIN `taxonomy_foundations.key = knowledge` (3 rows); Social `horizontal`/`social` NULL. No Social Foundation.

---

## G. Dependency graph

Count: **7**. Recursive read-only walk: 13 nodes, 7 edges, **cycle_hits = 0**.

Exact edges match the frozen contract. Explicit non-edges absent. No eighth edge.

---

## H. Readiness

Count: **13**. One row per capability. All `production_verified`.

| Group | Scope | Phase | `verified_at` UTC |
| --- | --- | --- | --- |
| Core / CRM / Knowledge (8) | `{ "workspace": "closed-beta-course-sellers" }` | `BETA1-FV` | `2026-08-22 13:50:00` |
| Social connection / content / approval (3) | `{ "provider": "instagram" }` | `SMM-B1-FV` | `2026-08-22 10:27:28` |
| Social scheduling / publishing (2) | `{ "provider": "instagram", "media": ["feed-image", "story-image"] }` | `SMM-B1-FV` | `2026-08-22 10:27:28` |

No video-story / LinkedIn / TikTok / other providers in scope.

---

## I. Security

| Gate | Result |
| --- | --- |
| RLS enabled (3 tables) | true |
| FORCE RLS | false |
| Policy count | 0 |
| Grants to `public` / `anon` / `authenticated` / `service_role` | **none** |
| CAP catalog RPCs | none |

Pre-existing private Social helpers `private.capability_required_for_social_content_format` and `private.social_beta1_capabilities_are_valid` remain Instagram **connection snapshot** validators from SMM-B1.1 (20260815). They are **not** CAP-1 catalog RPCs and were not created or altered by this apply.

---

## J. Runtime isolation

Isolation tests PASS. No `src/` CAP table consumer. Generated types **not** regenerated. No Organization assignment.

---

## K. TAX-1

Counts still **1 / 4 / 22 / 1 / 0 / 0 / 2**. Foundations: `knowledge`, `service`, `field-operations`, `product-operations`. `manufacturing-and-production` → `product-operations`.

---

## L. Closed Beta regression

Full Vitest: **2722 passed / 2 failed / 2724 total**. Same two historical failures. No new failures. `tsc` PASS. `next lint` PASS. Targeted CAP+TAX: 48 passed.

---

## M. Social safety

- Cron still exactly one job: `zyntixai_social_publication_scheduler_5m`, `*/5 * * * *`, `active=true`
- Vercel Production: `SOCIAL_SCHEDULING_ENABLED` and `SOCIAL_PUBLISHING_ENABLED` remain Encrypted; last env write **3d ago**
- `INVITATIONS_ENABLED` Encrypted, last write **12d ago**
- `PUBLIC_REGISTRATION_ENABLED` still **absent** (fail-closed)
- This phase did **not** enable gates or perform provider writes
- Catalog `production_verified` for scheduling/publishing is compatible with execution **OFF**

---

## N. DB-MIGRATION-DRIFT-01

Still present. Not repaired. Targeted frozen apply used. Ledger versions were not rewritten to match repository timestamps.

---

## O. Scope exclusions

No CAP-1C, CTX-1, TAX-2, Service/Field/Product seed, Organization enablement, permission map, or generated-type regen.

---

## P. Final verdict

```text
CAP-1FV CLOSED WITH EVIDENCE — CANONICAL CAPABILITY REGISTRY PRODUCTION VERIFIED
CAP-1 CANONICAL CAPABILITY REGISTRY = PRODUCTION VERIFIED
```

Visual owner confirmation: **not required**.

Non-mutating smoke: `https://www.zyntixai.com/login` → `200`, `X-Matched-Path: /login`.
