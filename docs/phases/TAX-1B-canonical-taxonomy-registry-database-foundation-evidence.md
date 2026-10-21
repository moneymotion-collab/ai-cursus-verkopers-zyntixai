# TAX-1B — Canonical Taxonomy Registry Database Foundation

| Field | Value |
| --- | --- |
| Phase | **TAX-1B — Canonical Taxonomy Registry Database Foundation** |
| Parent track | **TAX-1 — Taxonomy Registry** |
| Document type | Implementation evidence (database foundation only) |
| Date | 2026-08-24 |
| Formal status | `IMPLEMENTATION READY FOR DEPLOYMENT VERIFICATION` |
| Governing design | TAX-1A Canonical Taxonomy Registry Schema & Security Contract |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Start HEAD | `5f1126981128f8ed9e9763e0b81697026fba7c52` |
| Production | **NOT DEPLOYED / NOT PRODUCTION VERIFIED** |

This phase does **not** claim Production migration apply, TAX-1C read surface, Organization assignment, Context/Capability, or any Closed Beta runtime change.

---

## 1. Verdict

```text
TAX-1B CLOSED WITH EVIDENCE — CANONICAL TAXONOMY REGISTRY DATABASE FOUNDATION IMPLEMENTED AND READY FOR PRODUCTION VERIFICATION
```

Authorized: two additive public taxonomy migrations, deny-by-default RLS + privilege revoke, frozen TAX-1 seed, static/security/seed/isolation tests, this evidence file.

**Not** authorized and **not** done: Production deploy, linked type regen, `src/` consumers, RPCs, policies, grants to runtime roles, org assignment, onboarding/AppShell/PATH B/Social/CRM/Knowledge changes.

---

## 2. Starting repository state

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `5f1126981128f8ed9e9763e0b81697026fba7c52` |
| Divergence | `0 0` |
| Worktree | clean |

---

## 3. Changed files

| Path | Role |
| --- | --- |
| `supabase/migrations/20260824153300_create_taxonomy_registry.sql` | Schema, FKs, indexes, comments, triggers, RLS, REVOKE |
| `supabase/migrations/20260824153310_seed_taxonomy_registry_tax1.sql` | Release + 4 Foundations + 22 Industries + 1 Niche + 2 aliases |
| `tests/security/taxonomy-registry-migration-security.test.ts` | Schema + security + migration inventory |
| `tests/security/taxonomy-registry-seed-contract.test.ts` | Frozen seed contract |
| `tests/security/taxonomy-registry-runtime-isolation.test.ts` | No `src/` consumer; protected surfaces; no org FKs |
| `docs/phases/TAX-1B-canonical-taxonomy-registry-database-foundation-evidence.md` | This evidence |

No protected runtime files were modified.

---

## 4. Security design

- Seven `public` tables, **no** tenant ownership column.
- `ENABLE ROW LEVEL SECURITY` on all seven.
- **Not** `FORCE ROW LEVEL SECURITY` (owner seed must work).
- **No** `CREATE POLICY`.
- **No** taxonomy RPCs / SECURITY DEFINER functions.
- `REVOKE ALL` from `public`, `anon`, `authenticated`, and `service_role`.
- `service_role` is revoked because it bypasses RLS; grants are the write/read wall.
- Application DELETE path: none.

---

## 5. Seed contract

| Object | Count | Identity |
| --- | --- | --- |
| Release | 1 | `ucf-tax-1` / UCF Taxonomy v1 / active |
| Foundations | 4 | `knowledge`, `service`, `field-operations`, `product-operations` |
| Industries | 22 | UCF-1C.1 map; `manufacturing-and-production` → `product-operations` |
| Niches | 1 | `online-course-business` → `education-and-learning` |
| Specializations | 0 | table exists |
| Deep specializations | 0 | table exists |
| Aliases | 2 | `Course Seller`, `Course Sellers` / `en` → Niche |

Parents resolved by `key`. No hardcoded UUIDs. `ON CONFLICT (key) DO NOTHING` does not rewrite labels. Migration `DO` block RAISES if counts/parents/aliases are wrong.

Aliases do **not** change `organizations.business_type`.

---

## 6. Tests executed

| Command | Result |
| --- | --- |
| Targeted TAX-1B Vitest (22 tests) | PASS |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (0 warnings/errors) |
| `npx vitest run` (full) | **2696 passed / 2 failed / 2698 total** |

Historical failures (unchanged; not introduced by TAX-1B):

1. `tests/features/invitations/load-member-administration-page.test.ts` — `does not trust a foreign org id outside active memberships`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — `Progress no longer claims deferred tracking; Progress workspace language is present`

Prior BETA1-FV baseline: 2674 passed / 2 failed / 2676 total. Delta = **+22 passing tests**, same two failures.

`npx next build` not required (no application consumer). Linked `supabase gen types` **not** run. Migrations **not** applied to Production or linked remote.

---

## 7. Runtime isolation

- No `src/` file references taxonomy table names.
- Protected auth, org resolution, invitations, CRM, Knowledge, Tasks, Attention, AppShell, onboarding, Social, support paths contain no taxonomy identifiers.
- Taxonomy migrations contain no tenant ownership column and do not `ALTER` organizations.

---

## 8. Scope exclusions confirmed

No Organization assignment, no TAX-1C reader, no Context/Capability/Party/Opportunity/Service/Field/Product/Data Intake, no Social gate change, no PATH B change, no onboarding enum change, no generated type change, no package install, no environment change, no commit/push in the implementation run unless the owner later requests it.

---

## 9. Recommended next phase

**TAX-1FV — Production migration apply and catalog verification** (still runtime-inert). Do not start TAX-1C or TAX-2 until TAX-1FV proves the Production catalog and grants.
