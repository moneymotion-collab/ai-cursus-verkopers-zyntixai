# CAP-1B — Canonical Capability Registry Database Foundation

| Field | Value |
| --- | --- |
| Phase | **CAP-1B — Canonical Capability Registry Database Foundation** |
| Parent track | **CAP-1 — Capability Registry** |
| Document type | Implementation evidence (database foundation only) |
| Date | 2026-08-24 |
| Formal status | `IMPLEMENTATION READY FOR REPOSITORY FREEZE / PRODUCTION VERIFICATION` |
| Governing design | CAP-1A Canonical Capability Registry Architecture & Security Contract |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Start HEAD | `a6c5bcf689e660c8e61e74a7a7506ef946df7c4d` |
| Production | **NOT DEPLOYED / NOT PRODUCTION VERIFIED** |

This phase does **not** claim Production migration apply, CAP-1C read surface, Organization assignment, Context, or any Closed Beta runtime change.

---

## 1. Verdict

```text
CAP-1B CLOSED WITH EVIDENCE — CANONICAL CAPABILITY REGISTRY DATABASE FOUNDATION IMPLEMENTED AND READY FOR REPOSITORY FREEZE
```

Authorized: two additive public capability migrations, deny-by-default RLS + privilege revoke, frozen CAP-1 seed (13 / 7 / 13), static schema/security/seed/dependency/isolation tests, this evidence file.

**Not** authorized and **not** done: Production deploy, linked type regen, `src/` consumers, RPCs, policies, grants to runtime roles, org assignment, onboarding/AppShell/PATH B/Social/CRM/Knowledge/TAX-1 changes.

---

## 2. Starting repository state

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `a6c5bcf689e660c8e61e74a7a7506ef946df7c4d` |
| Subject | `docs(taxonomy): record TAX-1 production verification` |
| Divergence | `0 0` |
| Worktree | clean |

---

## 3. Changed files

| Path | Role |
| --- | --- |
| `supabase/migrations/20260824180000_create_capability_registry.sql` | Schema, FKs, indexes, comments, triggers, RLS, REVOKE |
| `supabase/migrations/20260824180010_seed_capability_registry_cap1.sql` | 13 capabilities + 7 requires edges + 13 readiness rows |
| `tests/security/capability-registry-migration-security.test.ts` | Schema + security + migration inventory |
| `tests/security/capability-registry-seed-contract.test.ts` | Frozen seed + readiness provenance |
| `tests/security/capability-registry-dependency-contract.test.ts` | Exact 7 edges, non-edges, BFS DAG |
| `tests/security/capability-registry-runtime-isolation.test.ts` | No `src/` consumer; protected surfaces; no TAX/Social mutation |
| `docs/phases/CAP-1B-canonical-capability-registry-database-foundation-evidence.md` | This evidence |

No protected runtime files were modified. TAX-1 migrations/tests were not modified.

---

## 4. Schema contract

Three `public` tables, **no** `organization_id`:

1. `capabilities` — UUID PK, unique immutable dotted `capability_key`, owner_class/owner_key, nullable `foundation_id` → `taxonomy_foundations(id)` ON DELETE RESTRICT, lifecycle, visibility, supersession FK
2. `capability_dependencies` — composite PK `(capability_id, depends_on_capability_id)`, both FKs RESTRICT, no self-edge, **requires only**
3. `capability_readiness` — unique `capability_id`, JSON object `supported_scope`, evidence integrity CHECKs

Indexes: unique key; `(owner_class, owner_key)`; `(lifecycle_status, catalog_visibility)`; partial `foundation_id`; reverse dependency lookup. No GIN, trigram, or full-text.

`set_updated_at` triggers on all three tables.

---

## 5. Security

- RLS enabled on all three.
- **Not** FORCE ROW LEVEL SECURITY.
- **No** CREATE POLICY.
- **No** capability RPCs / SECURITY DEFINER functions.
- `REVOKE ALL` from `public`, `anon`, `authenticated`, and `service_role`.
- `service_role` is revoked because it bypasses RLS.

---

## 6. Exact catalog seed

| Object | Count | Identity |
| --- | --- | --- |
| Capabilities | 13 | See table below; all `active` / `listed` |
| Hard requires edges | 7 | Frozen CAP-1A graph |
| Readiness rows | 13 | all `production_verified` |

| Key | Label | Owner | Foundation |
| --- | --- | --- | --- |
| `core.tasks` | Tasks | core / platform | NULL |
| `core.attention` | Attention | core / platform | NULL |
| `core.member-administration` | Member administration | core / platform | NULL |
| `shared.crm.leads` | Leads | shared / crm | NULL |
| `shared.crm.customers` | Customers | shared / crm | NULL |
| `knowledge.programs` | Programs | foundation / knowledge | `taxonomy_foundations.key = knowledge` |
| `knowledge.enrollments` | Enrollments | foundation / knowledge | `knowledge` |
| `knowledge.progress` | Progress | foundation / knowledge | `knowledge` |
| `horizontal.social.connection` | Social account connection | horizontal / social | NULL |
| `horizontal.social.content` | Social content management | horizontal / social | NULL |
| `horizontal.social.approval` | Social review and approval | horizontal / social | NULL |
| `horizontal.social.scheduling` | Social calendar and scheduling | horizontal / social | NULL |
| `horizontal.social.publishing` | Social publishing | horizontal / social | NULL |

Seed fails closed if Knowledge Foundation is missing. Does not insert a Foundation. `ON CONFLICT DO NOTHING` does not rewrite metadata; a validation `RAISE` proves exact counts.

Not seeded: auth, Organization, RLS, invitations, Home, Stories, Service, Field, Product, Files, Search, Analytics.

---

## 7. Exact dependency graph (7)

1. `knowledge.enrollments` → `knowledge.programs`
2. `knowledge.enrollments` → `shared.crm.customers`
3. `knowledge.progress` → `knowledge.enrollments`
4. `horizontal.social.approval` → `horizontal.social.content`
5. `horizontal.social.scheduling` → `horizontal.social.content`
6. `horizontal.social.publishing` → `horizontal.social.connection`
7. `horizontal.social.publishing` → `horizontal.social.content`

Explicit non-edges (not seeded): leads→customers; attention→tasks/enrollments/social; publishing→scheduling; publishing→approval; scheduling→publishing; content→connection.

Static BFS proves the seed graph is acyclic. No recursive Production triggers.

---

## 8. Readiness provenance

`production_verified` is a catalog evidence statement. It does **not** mean entitled, relevant, authorized, or execution-gate ON.

| Keys | `supported_scope` | `evidence_phase` | `verified_at` | Source |
| --- | --- | --- | --- | --- |
| Core / CRM / Knowledge (8) | `{ "workspace": "closed-beta-course-sellers" }` | `BETA1-FV` | `2026-08-22 13:50:00+00` | Evidence document field **Verification UTC** in `docs/phases/BETA1-FV-zyntixai-closed-beta-final-verification-evidence.md` |
| Social connection / content / approval (3) | `{ "provider": "instagram" }` | `SMM-B1-FV` | `2026-08-22 10:27:28+00` | Evidence commit `cd125f81e02fb7b829f69de35277b95e6616c4d0` (`docs(smm): close beta 1 final verification`; committer `2026-08-22T12:27:28+02:00`) |
| Social scheduling / publishing (2) | `{ "provider": "instagram", "media": ["feed-image", "story-image"] }` | `SMM-B1-FV` | `2026-08-22 10:27:28+00` | Same SMM-B1-FV evidence commit. Stories remain a format in scope, not a capability row. |

No `now()` / migration-execution timestamp was used.

Social scheduling and publishing remain `production_verified` while `SOCIAL_SCHEDULING_ENABLED` and `SOCIAL_PUBLISHING_ENABLED` stay fail-closed OFF. CAP-1B did not change those gates.

---

## 9. TAX-1 boundary

TAX-1 remains Production verified and unmodified. Seed **reads** `taxonomy_foundations.key = 'knowledge'` only. No TAX inserts, updates, grant changes, or Niche maps.

---

## 10. Runtime isolation

- No `src/` capability consumer
- No generated type regeneration (`src/types/database.generated.ts` unchanged)
- No Organization assignment
- No AppShell / permission / Context / entitlement integration
- Social tables, `social_closed_beta_enrollments`, cron, and execution gates untouched

---

## 11. Tests

| Check | Result |
| --- | --- |
| Targeted CAP-1B + TAX-1B | **48 passed** |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS |
| Full Vitest | **2722 passed / 2 failed / 2724 total** |

Prior baseline: 2696 passed / 2 failed / 2698 total. Delta = **+26** CAP-1B tests. No new failures.

Historical failures (non-blocking, unchanged):

1. `tests/features/invitations/load-member-administration-page.test.ts` — foreign org id
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — Progress copy assertion

Build was not required for this DB-only runtime-inert phase.

---

## 12. Migration drift

**DB-MIGRATION-DRIFT-01** (historical Social local/remote timestamps) is unchanged. CAP-1B did not run repair, `db pull`, `db reset`, or `db push --linked`. CAP-1FV must use targeted frozen apply, as TAX-1FV.

---

## 13. Git / Production

Changes are implemented in the worktree for owner review / CAP-1B-C freeze. This phase did **not** Production-deploy, push, or claim Production verification.

```text
IMPLEMENTATION READY FOR REPOSITORY FREEZE / PRODUCTION VERIFICATION
```
