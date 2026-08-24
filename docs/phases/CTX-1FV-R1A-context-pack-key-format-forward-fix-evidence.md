# CTX-1FV-R1A — Context Pack Key Format Forward Fix

| Field | Value |
| --- | --- |
| Phase | **CTX-1FV-R1A — Context Pack Key Format Constraint Forward-Fix Implementation & Freeze** |
| Parent | CTX-1 / CTX-1B / CTX-1B-C / CTX-1FV (blocked) |
| Date | 2026-08-24 |
| Formal status | `CTX-1FV-R1A CLOSED — FORWARD FIX IMPLEMENTED AND FROZEN; PRODUCTION NOT REPAIRED` |
| Implementation HEAD at incident | `95b4b49e5d0a0ed489a0c5121ed2c4932834ea0d` |
| Branch | `core/platform-readiness-20260707` |

This phase does **not** claim CTX-1FV closed, Production repaired, or seed applied.

---

## 1. Incident

CTX-1FV targeted apply recorded Production schema migration:

| Frozen file | Production version | Name |
| --- | --- | --- |
| `supabase/migrations/20260824190000_create_context_pack_registry.sql` | `20260824180231` | `create_context_pack_registry` |

Frozen seed `20260824190010_seed_context_pack_registry_ctx1.sql` was **not** applied.

Production catalog after schema apply: five Context tables exist; all five counts = 0.

Live `context_packs_key_format_check` rejected:

- `foundation.knowledge`
- `niche.online-course-business`

Classification: **CTX-1FV Production application fidelity defect** resulting in `SCHEMA_APPLY_BLOCKER`.

Not a TAX-1, CAP-1, seed-content, RLS, Organization-assignment, or runtime application defect.

---

## 2. Root cause

The frozen schema expressed the intended pack-key grammar with a POSIX backslash-dot:

```text
^[a-z][a-z0-9_]*(\.[a-z0-9]+(-[a-z0-9]+)*)+$
```

The Production apply path reconstructed/transported that expression with different escaping semantics, so the live CHECK no longer accepted dotted namespaced keys. Historical CTX-1B source remains the immutable implementation artifact. This remediation does not rewrite that file or pretend the first apply was byte-exact.

---

## 3. Forward-fix expression

Replacement CHECK uses a transport-safe literal dot:

```text
^[a-z][a-z0-9_]*([.][a-z0-9]+(-[a-z0-9]+)*)+$
```

`[.]` is a POSIX character class containing only `.`. It is semantically equivalent to the frozen intended `\.` for this grammar and does not depend on backslash-dot surviving MCP/JSON transport.

Accepted identities remain:

- `foundation.knowledge`
- `niche.online-course-business`

Identities were not weakened to hyphen-only keys.

---

## 4. New migration

`supabase/migrations/20260824200500_fix_context_pack_key_format_check.sql`

Behavior:

1. Fail if `public.context_packs` is not present exactly once.
2. Fail if `context_packs_key_format_check` is not present exactly once (no `DROP CONSTRAINT IF EXISTS`).
3. Drop only that constraint.
4. Recreate it with the `[.]` grammar and the same length bound (3–160).
5. No DML, no other objects, no grants/policies, no TAX/CAP mutation.

---

## 5. Frozen originals

These files remain byte-for-byte the CTX-1B implementation:

- `supabase/migrations/20260824190000_create_context_pack_registry.sql`
- `supabase/migrations/20260824190010_seed_context_pack_registry_ctx1.sql`

Future seed remains 2 / 2 / 10 / 4 / 2. CTX-1FV-R1B applies the unchanged seed only after Production CHECK repair is verified.

---

## 6. Tests

## 6. Tests

`tests/security/context-pack-registry-key-format-remediation.test.ts` covers scope, `[.]` regex, positive/negative keys, frozen-file integrity, inventory of the third migration, and isolation.

Necessary CTX-1B inventory adjustment (not a schema/seed change): `tests/security/context-pack-registry-migration-security.test.ts` now asserts the original two CTX-1B files remain first and ordered, so a later forward-fix is not forbidden.

| Check | Result |
| --- | --- |
| Targeted R1A + CTX + TAX + CAP | **95 passed** |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS |
| Full Vitest | **2769 passed / 2 failed / 2771 total** |

Prior baseline: 2762 passed / 2 failed / 2764 total. Delta = **+7** R1A tests. No new failures.

---

## 7. Production

**Not modified in R1A.** Expected live state remains:

- CTX schema ledger row `20260824180231` `create_context_pack_registry`
- five empty Context tables
- defective live CHECK still present
- CTX seed absent

---

## 8. Next step

**CTX-1FV-R1B:** targeted apply of this forward-fix, verify seed keys match the live CHECK, then apply the unchanged frozen seed, then resume Production verification.
