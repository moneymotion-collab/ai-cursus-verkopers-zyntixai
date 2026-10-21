# CONTROL-PLANE-READ-1FV — Unified Control-Plane Read Production Verification

| Field | Value |
| --- | --- |
| Phase | **CONTROL-PLANE-READ-1FV — Unified Control-Plane Read Production Activation & Final Verification** |
| Parent | CONTROL-PLANE-READ-1 / 1A / 1B / 1C |
| Document type | Production verification evidence |
| Date | 2026-08-25 |
| Formal status | `CONTROL-PLANE-READ-1FV CLOSED WITH EVIDENCE — UNIFIED CONTROL-PLANE SERVER READ PRODUCTION VERIFIED` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `cf292389ae45fae21efa09b484be84fbdd523c18` |
| Production grant | **APPLIED ONCE** |
| Reader | **PRODUCTION VERIFIED** against live TAX/CAP/CTX catalogs |

This phase does **not** assign Organization Context, implement a resolver, wire product UI, promote readiness, or open client-role catalog access.

---

## A. Repository baseline

### 1A architecture

Trusted ZyntixAI server-only logic → existing `createSupabaseServiceRoleClient()` → direct SELECT → canonical TAX/CAP/CTX catalogs.

Not selected: authenticated/anon SELECT, public RPC, public API, Organization assignment, Context resolver, product wiring.

### 1B implementation commit

`5ef8c25a2e00f5c02bbe81b6bb12e5d1aa7e6626` — `feat(control-plane): grant server read access to canonical catalogs`

### 1C implementation commit

`cf292389ae45fae21efa09b484be84fbdd523c18` — `feat(control-plane): add typed server catalog reader`

Parent of 1C = 1B.

### Current frozen HEAD at FV start

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `cf292389ae45fae21efa09b484be84fbdd523c18` |
| Divergence | `0 0` |
| Worktree | clean |

Hard gate passed. 1C reader and 1B migration files were not edited during FV.

---

## B. Production target

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Linked `supabase/.temp/project-ref` | `dmctinrcjvsgmoxwwodw` |
| Host | `db.dmctinrcjvsgmoxwwodw.supabase.co` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Canonical app | `https://www.zyntixai.com` |

No service-role JWT, database password, or access token is recorded here.

---

## C. Pre-apply migration and privilege state

Remote ledger did **not** contain `grant_control_plane_select_to_service_role`.

Last remote catalog migration before apply: `20260824185459` / `seed_context_pack_registry_ctx1`.

All 15 catalog relations existed as base tables.

RLS enabled, FORCE false, policy count 0 on all 15.

`information_schema.role_table_grants` for `public` / `anon` / `authenticated` / `service_role` on the 15 tables: **empty**.

Semantic counts matched the frozen catalogs. Context pack readiness was already `context_ready` with `verified_at` NULL. FV did not remediate catalogs.

---

## D. Frozen grant migration

| Field | Value |
| --- | --- |
| File | `supabase/migrations/20260824210000_grant_control_plane_select_to_service_role.sql` |
| SHA-256 | `578bb5028c4e8fa7ea7abb182022ac0d0f99945744e1572ee28b6f0294c94017` |
| Git blob at 1B and HEAD | identical (`5bca43351067fdf9c1207bb002ad37ab7c7714c9`) |
| Last commit touching the file | `5ef8c25a2e00f5c02bbe81b6bb12e5d1aa7e6626` |

Exact 15 tables, SELECT only, `service_role` only:

TAX: `taxonomy_releases`, `taxonomy_foundations`, `taxonomy_industries`, `taxonomy_niches`, `taxonomy_specializations`, `taxonomy_deep_specializations`, `taxonomy_aliases`

CAP: `capabilities`, `capability_dependencies`, `capability_readiness`

CTX: `context_packs`, `context_pack_versions`, `context_capability_mappings`, `context_terminology`, `context_pack_readiness`

No 16th table. No `GRANT SELECT ON ALL TABLES`. No default-privilege change in the migration. Full committed file contents were applied; GRANT statements were not retyped from this evidence prompt.

---

## E. Targeted Production apply

| Field | Value |
| --- | --- |
| Method | MCP `apply_migration` |
| Name | `grant_control_plane_select_to_service_role` |
| Result | success |
| Local file | `supabase/migrations/20260824210000_grant_control_plane_select_to_service_role.sql` |
| Remote version | `20260825084824` |
| `db push --linked` | **not used** |
| Migration repair | **not used** |
| DB-MIGRATION-DRIFT-01 | **untouched** |

Remote filename timestamp differs from the local committed timestamp. That mapping is expected under DB-MIGRATION-DRIFT-01.

---

## F. Live privilege matrix

Live `has_table_privilege` on all 15 tables:

| Role | SELECT | INSERT | UPDATE | DELETE | TRUNCATE | REFERENCES | TRIGGER |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `public` | no | no | no | no | no | no | no |
| `anon` | no | no | no | no | no | no | no |
| `authenticated` | no | no | no | no | no | no | no |
| `service_role` | **yes** | no | no | no | no | no | no |

`role_table_grants` after apply: exactly 15 `service_role` SELECT rows. No client-role grants. No extra TAX/CAP/CTX-named table received SELECT.

Historical schema-level default ACLs for **future** objects remain the Supabase platform defaults. The 1B migration did not grant schema-wide `SELECT ON ALL TABLES` and did not alter those defaults.

---

## G. RLS / policies

All 15 tables after apply:

- RLS enabled
- FORCE false
- policy count 0

Unchanged from pre-apply. No authenticated/anon policies were added.

Trigger/integrity functions exist (`context_packs_protect_identity`, `context_pack_versions_enforce_integrity`, `context_pack_version_protect_children`). They are not client-callable catalog RPCs: `routine_privileges` for `anon` / `authenticated` / `public` / `service_role` on those names was empty.

---

## H. Server reader

| Field | Value |
| --- | --- |
| Execution | Uncommitted Vitest invoking frozen `createControlPlaneReaders()` |
| Client | existing `createSupabaseServiceRoleClient()` |
| Credentials | short-lived in-process service-role key from linked project API-keys; never written to the repo; never printed |
| Public debug surface | **none** |
| Committed verification endpoint | **none** |
| `server-only` | unchanged on all five server modules |
| Temporary files | `tests/_tmp_control_plane_read_1fv.live.test.ts` and `scripts/_tmp_fv_live.ps1` deleted before evidence commit |

1C reader implementation was not modified.

---

## I. TAX live reads

| Call | Result |
| --- | --- |
| `findFoundationByKey("knowledge")` | exactly one Foundation, label Knowledge |
| `findIndustryByKey("education-and-learning")` | exactly one Industry, label Education & Learning |
| `findNicheByKey("online-course-business")` | exactly one Niche, label Online Course Business |
| `findActiveRelease()` | exactly one active release (`ucf-tax-1` / UCF Taxonomy v1) |
| `getTaxonomyPath(online-course-business)` | Niche → Education & Learning Industry → Knowledge Foundation |
| `getTaxonomyPath(manufacturing-and-production)` | Industry → Product Operations Foundation |

Active/listed child filtering: Knowledge Foundation listed children are `coaching-and-mentoring`, `communities-and-memberships`, `education-and-learning` (not the global 22 industries).

Seeded aliases (inspected before alias calls): `Course Seller` and `Course Sellers`, both `en`, both targeting the Niche. Each resolve is deterministic (not AMBIGUOUS). Production seed currently contains two unique labels, so the synthetic AMBIGUOUS branch remains unit-tested only.

---

## J. CAP live reads

| Check | Result |
| --- | --- |
| `listCatalog()` | 13 |
| `listCatalog({ includeInternal: true })` | 13 |
| `getDirectDependencies()` | 7 |
| `shared.crm.customers` | present, owner_class `shared` |
| `knowledge.programs` | present, owner_class `foundation` |
| `knowledge.enrollments` | present, owner_class `foundation` |
| `knowledge.progress` | present, owner_class `foundation` |
| `horizontal.social.publishing` | present, owner_class `horizontal` |

Readiness rows are returned as data. Several keys store `production_verified`. That is **not** entitlement, feature enablement, or Social execution.

---

## K. CAP live closure

Live edges were loaded through the repository and passed into frozen pure `computeCapabilityClosure(...)`. No duplicated graph constants.

`knowledge.progress` closed keys:

- `knowledge.progress`
- `knowledge.enrollments`
- `knowledge.programs`
- `shared.crm.customers`

`horizontal.social.publishing` closed keys:

- `horizontal.social.publishing`
- `horizontal.social.connection`
- `horizontal.social.content`

Direct live edges (7):

- `knowledge.enrollments` → `knowledge.programs`
- `knowledge.enrollments` → `shared.crm.customers`
- `knowledge.progress` → `knowledge.enrollments`
- `horizontal.social.approval` → `horizontal.social.content`
- `horizontal.social.scheduling` → `horizontal.social.content`
- `horizontal.social.publishing` → `horizontal.social.connection`
- `horizontal.social.publishing` → `horizontal.social.content`

---

## L. CTX live reads

| Call | Result |
| --- | --- |
| `findPackByKey("foundation.knowledge")` | Foundation pack |
| `findPackByKey("niche.online-course-business")` | Niche pack |
| taxonomy target lookup | exact pack for each; no fallback; no Organization parameter |
| Knowledge v1 | published, full, parent null |
| Online Course Business v1 | published, full, parent = Knowledge v1 |
| Foundation v1 mappings | exactly 4 required: `shared.crm.customers`, `knowledge.programs`, `knowledge.enrollments`, `knowledge.progress` |
| Niche v1 mappings | exactly 6 stored: `shared.crm.leads` recommended + five `horizontal.social.*` optional |
| Core mappings | none |
| Foundation mappings stored as Niche rows | none |
| Knowledge v1 terminology | exactly 4 `en` rows |
| Niche v1 terminology | 0 rows (stored only; no parent merge; no locale fallback) |

---

## M. ContextVersionBundle live read

`loadContextVersionBundle(<Online Course Business v1 id>)`:

| Field | Result |
| --- | --- |
| pack | `niche.online-course-business` |
| version | v1 |
| parentVersion | Knowledge Foundation v1 |
| mappings | exactly the 6 stored Niche mappings |
| terminology | 0 Niche terms |
| readiness | `context_ready` |
| referenced capabilities | the 6 directly referenced Niche keys |

Bundle does **not** contain the four inherited Foundation mappings as resolved Niche capabilities. No Core baseline. No locale resolution. No Organization. No authorization. Mechanical parent fetch only.

---

## N. Typed fail-closed NOT_FOUND proof

| Call | Result |
| --- | --- |
| `findFoundationByKey("foundation-that-does-not-exist")` | `NOT_FOUND` |
| `findPackByKey("foundation.does-not-exist")` | `NOT_FOUND` |
| `resolveAliasCandidates("no-such-alias-label", "en")` | `NOT_FOUND` |

No first-row fallback. No Course Sellers fallback. No first Context pack. Impossible `CATALOG_INTEGRITY_ERROR` branches remain unit tested; no synthetic Production rows were inserted.

---

## O. Context readiness

| Pack version | readiness_status | verified_at | supported_scope |
| --- | --- | --- | --- |
| `foundation.knowledge` v1 | `context_ready` | NULL | `{ journey: "closed-beta-course-sellers", runtime: "inert", resolver: false }` |
| `niche.online-course-business` v1 | `context_ready` | NULL | `{ journey: "closed-beta-course-sellers", runtime: "inert", resolver: false }` |

No readiness mutation. Not reinterpreted as runtime `production_verified`.

---

## P. Registry semantics

Reader working does **not** mean:

- Context resolved
- Context assigned
- feature enabled
- entitlement granted
- Social execution enabled
- capability `production_verified` readiness = entitled/runtime-on

Valid state after FV: catalogs are Production verified **and** server readable.

---

## Q. Organization assignment

0.

Production `organizations` has no `context_pack_id` / `context_version_id`.

No `organization_context_assignments`, `organization_context_overrides`, or equivalent tables.

Control-plane reader code has no Organization query.

---

## R. Product wiring

0 current product consumers.

No `src/app` import of control-plane. Home, AppShell, onboarding, navigation, CRM, Programs, Enrollments, Progress, Tasks, Attention, Members, Settings, and Social do not import the server repositories.

No public API. No `/api/control-plane`.

---

## S. TAX/CAP/CTX semantic counts unchanged

Observed before apply, after apply, and after live reader execution:

| Registry | Counts |
| --- | --- |
| TAX | 1 / 4 / 22 / 1 / 0 / 0 / 2 |
| CAP | 13 / 7 / 13 |
| CTX | 2 / 2 / 10 / 4 / 2 |

No catalog row mutation. No new alias. No new version. No assignment. Social capabilities remain `horizontal`.

---

## T. Social safety

| Check | Result |
| --- | --- |
| `SOCIAL_SCHEDULING_ENABLED` exact `"true"` | **false** (not enabled) |
| `SOCIAL_PUBLISHING_ENABLED` exact `"true"` | **false** (not enabled) |
| GUC `zyntix.social_publishing_enabled` | unset |
| GUC `zyntix.social_scheduling_enabled` | unset |
| `private.social_publishing_execution_enabled()` | **false** |
| Cron | jobid 1, `*/5 * * * *`, `select private.invoke_social_publication_scheduler();`, active |
| Provider writes | none performed |
| Scheduler manual invoke | none performed |

Control-plane reader may read Social capability **metadata**. That does not enable execution.

---

## U. Closed Beta / PATH B

`GET https://www.zyntixai.com/register` redirects to `/login?registration=disabled` with copy “Public registration is currently unavailable.”

Invitations, allowlist, membership, and auth were not altered. No test invitation was created.

---

## V. Tests / static checks

Targeted CONTROL-PLANE-READ-1B/1C + generated type + TAX/CAP/CTX repository tests: **69 passed**.

Also passed in the full suite: TAX-1 / CAP-1 / CTX-1 contracts, CTX child-trigger and key-format remediation, runtime-isolation, tenant/security regressions.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (no warnings or errors) |
| `npx vitest run` | 2831 passed / 2 failed / 2833 total |

Historical failures only (non-blocking, not remediated here):

1. `tests/features/invitations/load-member-administration-page.test.ts` — foreign org id
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — Progress copy assertion

No new failures.

---

## W. Production smoke

| Request | Result |
| --- | --- |
| `GET https://www.zyntixai.com/login` | normal Sign in page |
| `GET https://www.zyntixai.com/register` | fail-closed redirect to `/login?registration=disabled` |

No records created. No visual owner confirmation required. Product UI was not changed.

---

## X. DB-MIGRATION-DRIFT-01

Historical Social local/remote timestamp divergence remains. FV used controlled MCP apply of the frozen committed SQL only.

| Local file | Remote version | Name |
| --- | --- | --- |
| `20260824210000_grant_control_plane_select_to_service_role.sql` | `20260825084824` | `grant_control_plane_select_to_service_role` (exactly once) |

No `db push`. No repair. No rewrite of the historical ledger.

---

## Y. Scope exclusions

- no ORG-CONTEXT-1
- no CONTEXT-RESOLVER-1
- no onboarding integration
- no AppShell integration
- no public API
- no cache
- no generated type regeneration
- no catalog DML
- no readiness promotion

---

## Z. Final verdict

CONTROL-PLANE-READ-1FV Production verification passed.

CONTROL-PLANE-READ-1 = PRODUCTION VERIFIED.

Post-closure semantic rule remains:

- TAX/CAP/CTX registries: Production verified + server readable
- CTX pack readiness: `context_ready`
- Organization Context: unassigned
- Context resolution: not implemented
- UI: not Context-aware
- Readable capability ≠ entitled capability
- Context version ≠ runtime `production_verified`

Recommended next phase: **ORG-CONTEXT-1A — ORGANIZATION CONTEXT ASSIGNMENT ARCHITECTURE & SECURITY CONTRACT**. Do not immediately modify onboarding.
