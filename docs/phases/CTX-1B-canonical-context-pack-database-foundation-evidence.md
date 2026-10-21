# CTX-1B — Canonical Context Pack Database Foundation

| Field | Value |
| --- | --- |
| Phase | **CTX-1B — Canonical Context Pack Database Foundation** |
| Parent track | **CTX-1 — Context Pack Registry** |
| Document type | Implementation evidence (database foundation only) |
| Date | 2026-08-24 |
| Formal status | `IMPLEMENTATION READY FOR REPOSITORY FREEZE / PRODUCTION VERIFICATION` |
| Governing design | CTX-1A Canonical Context Pack Architecture & Security Contract, accepted with four binding clarifications |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Start HEAD | `57a597f020e885abf21a9354bb7bbe5a789dafd3` |
| Production | **NOT DEPLOYED / NOT PRODUCTION VERIFIED** |

This phase does **not** claim Production migration apply, Context runtime consumption, Organization assignment, or any Closed Beta behavior change.

`context_ready` is **not** `production_verified`.

---

## 1. Verdict

```text
CTX-1B CLOSED WITH EVIDENCE — CANONICAL CONTEXT PACK DATABASE FOUNDATION IMPLEMENTED AND READY FOR REPOSITORY FREEZE
```

Authorized: two additive public Context migrations, deny-by-default RLS + privilege revoke, published-version and child-semantic immutability triggers, frozen CTX-1 seed (2 / 2 / 10 / 4 / 2), static schema/security/immutability/seed/inheritance/isolation tests, this evidence file.

**Not** authorized and **not** done: Production deploy, linked type regen, `src/` consumers, RPCs, policies, grants to runtime roles, org assignment/overrides, onboarding/AppShell/PATH B/Social/CRM/Knowledge/TAX-1/CAP-1 changes.

---

## 2. Starting repository state

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `57a597f020e885abf21a9354bb7bbe5a789dafd3` |
| Subject | `docs(capabilities): record CAP-1 production verification` |
| Divergence | `0 0` |
| Worktree | clean |

---

## 3. Changed files

| Path | Role |
| --- | --- |
| `supabase/migrations/20260824190000_create_context_pack_registry.sql` | Schema, XOR TAX targets, FKs, indexes, comments, integrity triggers, RLS, REVOKE |
| `supabase/migrations/20260824190010_seed_context_pack_registry_ctx1.sql` | 2 packs + 2 published versions + 10 mappings + 4 terms + 2 readiness rows |
| `tests/security/context-pack-registry-migration-security.test.ts` | Schema + security + migration inventory |
| `tests/security/context-pack-registry-immutability-contract.test.ts` | Published/child-semantic immutability SQL contract |
| `tests/security/context-pack-registry-seed-contract.test.ts` | Frozen 2/2/10/4/2 seed + readiness provenance |
| `tests/security/context-pack-registry-inheritance-contract.test.ts` | Test-only resolver, FULL inheritance, CAP closure |
| `tests/security/context-pack-registry-runtime-isolation.test.ts` | No `src/` consumer; protected surfaces; no TAX/CAP/Social mutation |
| `docs/phases/CTX-1B-canonical-context-pack-database-foundation-evidence.md` | This evidence |

No protected runtime files were modified. TAX-1 and CAP-1 migrations/tests were not modified.

---

## 4. Schema contract

Five `public` global tables, **no** `organization_id`:

1. `context_packs` — UUID PK, unique immutable `pack_key`, `pack_kind`, XOR typed TAX FKs (`foundation_id` / `industry_id` / `niche_id` / `specialization_id` / `deep_specialization_id`) ON DELETE RESTRICT, unique partial index per target, pack identity lifecycle
2. `context_pack_versions` — unique `(pack_id, version_number)`, publication/completeness/change_impact CHECKs, optional `parent_version_id` self-FK ON DELETE RESTRICT, relational business-definition columns. **No `updated_at`** (published rows must not be rewritten)
3. `context_capability_mappings` — composite PK `(version_id, capability_id)`, FKs to versions and `capabilities` ON DELETE RESTRICT, `mapping_op` set/remove, SET requires relevance, REMOVE requires `relevance IS NULL`
4. `context_terminology` — unique `(version_id, locale, term_key)`, governed `term_key`
5. `context_pack_readiness` — unique `version_id`, JSON object `supported_scope`, evidence integrity CHECKs. Not covered by child-semantic immutability because readiness may later advance

Indexes: unique pack_key; unique partial TAX targets; `(pack_id, version_number)`; partial `parent_version_id`; reverse `capability_id`. No GIN, trigram, or full-text.

`set_updated_at` only on `context_packs` and `context_pack_readiness`.

---

## 5. Taxonomy target / XOR

Exactly one TAX FK is non-null and it must match `pack_kind`. Typed FKs to TAX-1 tables. No `target_type` + untyped `target_id`. Each taxonomy node may have at most one Context Pack.

---

## 6. Version / immutability implementation

Pack identity (`pack_key`, `pack_kind`, TAX target) is frozen by `context_packs_protect_identity`.

Published/superseded **version** semantic fields are frozen by `context_pack_versions_enforce_integrity`. Allowed UPDATE after publish: `publication_status` **published → superseded** only. Forbidden: published → draft, superseded → published, superseded → draft.

Completeness vs pack_kind is enforced in the same version trigger (cross-table; a CHECK cannot see `pack_kind`):

- foundation / niche → `full`
- industry / specialization / deep_specialization → `delta`

Parent version, when set, must already be `published` or `superseded` (nearest available governed ancestor, not a hardcoded parent-kind rule).

Trigger functions are `security invoker`, internal integrity only, **not** SECURITY DEFINER RPCs. `REVOKE ALL` on the functions from `public`, `anon`, `authenticated`, and `service_role`.

---

## 7. Child-semantic immutability

`context_pack_version_protect_children` runs BEFORE INSERT OR UPDATE OR DELETE on:

- `context_capability_mappings`
- `context_terminology`

If the referenced version is `published` or `superseded`, child mutation is blocked. Draft child rows remain writable by the migration owner.

`context_pack_readiness` is **not** protected this way. Readiness may later move `context_ready` → `beta_supported` → `production_verified` through a reviewed platform migration.

FULL versions may only SET (REMOVE on a FULL version is rejected by the child trigger). Weakening inherited required relevance is validated on the resolved set in seed/static tests, not by a giant runtime engine.

---

## 8. FULL vs DELTA clarification

FULL means the **resolved** Context at this layer is complete. It does **not** mean inherited mappings are duplicated onto the child version.

Foundation FULL stores the Knowledge required spine. Niche FULL inherits those four required rows and stores only Niche deltas.

---

## 9. Exact catalog seed (2 / 2 / 10 / 4 / 2)

| Object | Count | Identity |
| --- | --- | --- |
| Packs | 2 | `foundation.knowledge`, `niche.online-course-business` |
| Versions | 2 | both `published`, `full`, `change_impact = high`, v1 |
| Mappings | 10 | Foundation 4 + Niche 6 |
| Terminology | 4 | Foundation `en` only |
| Readiness | 2 | both `context_ready` |

No Industry pack. No Specialization pack. No extra Niche. No Organization assignment. No `core.*` mappings. No REMOVE rows.

### Packs

| pack_key | label | kind | TAX target | locale | lifecycle |
| --- | --- | --- | --- | --- | --- |
| `foundation.knowledge` | Knowledge | foundation | `taxonomy_foundations.key = knowledge` | `en` | `active` |
| `niche.online-course-business` | Online Course Business | niche | `taxonomy_niches.key = online-course-business` | `en` | `active` |

### Versions

Knowledge Foundation v1: `parent_version_id` NULL.

Online Course Business Niche v1: `parent_version_id` = published Knowledge Foundation v1.

Education & Learning Industry Context does not exist, so the Niche pins the nearest available governed ancestor.

### Business definition seed wording

Foundation `definition_summary`:

> A Knowledge business creates and delivers structured learning programs to enrolled customers and records their progress.

Niche `definition_summary`:

> An Online Course Business sells and delivers structured educational programs online, typically generating leads, converting them to customers, enrolling those customers in programs, and tracking progress.

`impact_note` (both): Initial governed Context baseline establishing capability relevance and operating definition.

### Foundation mappings (4, all SET required)

1. `shared.crm.customers`
2. `knowledge.programs`
3. `knowledge.enrollments`
4. `knowledge.progress`

### Niche mappings (6, SET only; inherited required spine not duplicated)

1. `shared.crm.leads` → recommended
2. `horizontal.social.connection` → optional
3. `horizontal.social.content` → optional
4. `horizontal.social.approval` → optional
5. `horizontal.social.scheduling` → optional
6. `horizontal.social.publishing` → optional

Social mappings are optional relevance only. They do not entitle, authorize, or enable Social gates.

### Terminology (Foundation v1 / `en`)

| term_key | singular | plural |
| --- | --- | --- |
| `customer` | Customer | Customers |
| `program` | Program | Programs |
| `enrollment` | Enrollment | Enrollments |
| `progress` | Progress | Progress |

Niche v1: **0** terminology rows (inherit).

### Readiness

Both versions:

- `readiness_status = context_ready`
- `verified_at = NULL`
- `evidence_phase = CTX-1B`
- `supported_scope = {"journey":"closed-beta-course-sellers","runtime":"inert","resolver":false}`

No `beta_supported`. No `production_verified`. The Course Sellers application was Production verified before a Context resolver existed.

---

## 10. Resolved Niche Context (test-only resolver)

Stored DB map = 10 rows. Resolved pack relevance after Foundation → Niche:

**Required:** `shared.crm.customers`, `knowledge.programs`, `knowledge.enrollments`, `knowledge.progress`

**Recommended:** `shared.crm.leads`

**Optional:** five `horizontal.social.*` capabilities

**Resolver-owned system baseline (not stored):** `core.member-administration`, `core.tasks`, `core.attention`

CAP-1 hard-dependency closure of required `knowledge.progress` is present as required: enrollments, programs, customers. Context does not copy `capability_dependencies` edges.

Seed sequence: Knowledge pack/version draft → mappings/terms → publish Knowledge v1 → Niche draft with parent = published Knowledge v1 → Niche mappings → publish Niche v1 → readiness. Immutability triggers stay enabled.

---

## 11. Security

- RLS enabled on all five tables.
- **Not** FORCE ROW LEVEL SECURITY.
- **No** CREATE POLICY.
- **No** Context RPCs.
- Integrity functions: `security invoker` only; EXECUTE revoked from `public`, `anon`, `authenticated`, `service_role`.
- `REVOKE ALL` table privileges from `public`, `anon`, `authenticated`, and `service_role`.
- `service_role` is revoked because it bypasses RLS.

---

## 12. TAX / CAP boundary

TAX-1 and CAP-1 remain Production verified and unmodified. Seed **reads** `taxonomy_foundations.key = knowledge`, `taxonomy_niches.key = online-course-business`, `capabilities`, and `capability_dependencies` only. Missing frozen identities fail the migration. No TAX/CAP inserts, updates, grant changes, or readiness rewrites.

---

## 13. Runtime isolation

- No `src/` Context consumer
- No generated type regeneration (`src/types/database.generated.ts` unchanged)
- No Organization assignment or override
- No AppShell / permission / entitlement / onboarding integration
- Social tables, `social_closed_beta_enrollments`, cron, and execution gates untouched

The inheritance resolver lives in tests only.

---

## 14. Tests

| Check | Result |
| --- | --- |
| Targeted CTX-1B + TAX-1B + CAP-1B | **88 passed** |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS |
| Full Vitest | **2762 passed / 2 failed / 2764 total** |

Prior baseline: 2722 passed / 2 failed / 2724 total. Delta = **+40** CTX-1B tests. No new failures.

Historical failures remain non-blocking if unchanged:

1. `tests/features/invitations/load-member-administration-page.test.ts` — foreign org id
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — Progress copy assertion

Build was not required for this DB-only runtime-inert phase.

---

## 15. Migration drift

**DB-MIGRATION-DRIFT-01** (historical Social local/remote timestamps) is unchanged. CTX-1B did not run repair, `db pull`, `db reset`, `db push --linked`, or apply CTX SQL to Production. CTX-1FV must use targeted frozen-file apply, as TAX-1FV and CAP-1FV.

---

## 16. Git / Production

Changes are implemented in the worktree for owner review / CTX-1B-C freeze. This phase did **not** Production-deploy, push, or claim Production verification.

```text
IMPLEMENTATION READY FOR REPOSITORY FREEZE / PRODUCTION VERIFICATION
```
