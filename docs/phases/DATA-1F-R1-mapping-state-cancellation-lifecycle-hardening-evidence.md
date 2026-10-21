# DATA-1F-R1 — Mapping-State Cancellation + Lifecycle Hardening

| Field | Value |
| --- | --- |
| Phase | **DATA-1F-R1 — MAPPING-STATE CANCELLATION + LIFECYCLE HARDENING** |
| Parent | DATA-1F |
| Document type | Remediation evidence |
| Date | 2026-08-29 |
| Formal status | `DATA-1F-R1 CLOSED WITH EVIDENCE — MAPPING-STATE CANCELLATION + LIFECYCLE HARDENING VERIFIED` |
| Governing 1F implementation | `docs/phases/DATA-1F-governed-semantic-mapping-foundation-evidence.md` |
| Prior cancel hardening | `docs/phases/DATA-1E-R1-parsed-session-cancellation-hardening-evidence.md` |
| Governing contract | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `2bbba72eb3cbc61b321f69aa142330cd36580358` |
| Implementation commit | `66a0ed72ca94e3760fa09bb5244b1ff76b4d33b6` |
| Production apply | **NOT PERFORMED** |
| Production mapping / cancel | **NOT AUTHORIZED** |

**MAPPING_REQUIRED → CANCELLED = SUPPORTED**

**MAPPED → CANCELLED = SUPPORTED**

**DATA-1F-R1 PRODUCTION APPLY = NOT YET AUTHORIZED**

**DATA-1F PRODUCTION MAPPING = NOT YET AUTHORIZED**

---

## 1. Executive verdict

DATA-1F-R1 is complete. After mapping begins or is confirmed, an authorized Owner/Admin can abandon the intake through the existing governed `cancel_session` path. The frozen DATA-1B/1C graph already allowed `mapping_required → cancelled` and `mapped → cancelled`. The foundation RPC allowlist did not. This remediation expands that explicit allowlist only.

Cancellation stops the workflow. It does not delete source, discovery, mapping rows, confirmation snapshot/hash, or immutable events. It does not import Customers.

Targeted DATA tests: **105 / 105 = 100%**. Full suite: **3271 passed, 2 failed, 3273 total**. Same two historical failures. `NEW REGRESSIONS = 0`.

---

## 2. Strategic reason

Mapping confirmation means only “this is the intended source → target relationship.” It is not import approval. Users must not become trapped in an active DATA workflow merely because mapping has begun or been confirmed. DATA-1F-FV needs a governed abort after `mapped` without raw SQL.

---

## 3. DATA-1F dependency

Authoritative DATA-1F:

- Implementation: `b78f01c457f74c957083620957a0f6124de4137c`
- Evidence HEAD: `2bbba72eb3cbc61b321f69aa142330cd36580358`
- Targeted baseline: **96 / 96 = 100%**

DATA-1F residual: `cancel_session` still rejected `mapping_required` and `mapped` even though the frozen graph listed those edges.

---

## 4. Starting Git state

Proven before R1 files were added:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `2bbba72eb3cbc61b321f69aa142330cd36580358` |
| Subject | `docs(data): record semantic mapping foundation evidence` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `2bbba72eb3cbc61b321f69aa142330cd36580358` |
| Divergence | `0 0` |
| `git status` | clean |
| Staged / unstaged / untracked | none |
| `git diff --check` | clean |

---

## 5. Frozen state graph

`private.data_intake_session_status_transition_allowed` (DATA-1C, unchanged) already returns true for:

- `created → cancelled`
- `source_ready → cancelled`
- `parsed → cancelled`
- `mapping_required → cancelled`
- `mapped → cancelled`

DATA-1B session status machine lists the same mapping-state cancel edges. Later states (`validating`, `review_required`, `ready_for_approval`, `approved`, `importing`, `failed`) also have graph cancel edges; this R1 does **not** enable those in the RPC allowlist.

---

## 6. Original cancel allowlist

DATA-1E-R1 `public.apply_data_intake_foundation_mutation` `cancel_session`:

`created | source_ready | parsed`

DATA-1E-R1 evidence stated later mapping/import states remain non-cancellable in the v1 RPC until those states exist and a future phase implements the already-frozen graph edges.

---

## 7. Root cause

| Layer | Result |
| --- | --- |
| Frozen graph | Already allowed both mapping-state cancels |
| Session CHECK / trigger | Uses the graph; not the blocker |
| TypeScript `cancelDataIntakeSession` | Delegates to foundation RPC; no extra mapping-state denial |
| Mapping RPC | Rejects `cancelled` after the fact; does not own cancel |
| Foundation RPC allowlist | **Blocked**: `v_session.status not in ('created', 'source_ready', 'parsed')` |

Root cause file: `public.apply_data_intake_foundation_mutation` as last replaced by `20260827161658_allow_parsed_data_intake_session_cancellation.sql`.

---

## 8. mapping_required cancellation decision

**AUTHORIZED.** DATA-1B and the DATA-1C graph already list `mapping_required → cancelled`. DATA-1F made that state product-reachable. R1 implements the missing RPC allowlist entry.

---

## 9. mapped cancellation decision

**AUTHORIZED.** Same evidence: DATA-1B / DATA-1C list `mapped → cancelled`. Confirmation is not import approval. R1 implements the missing RPC allowlist entry.

---

## 10. State graph impact

**None.** `private.data_intake_session_status_transition_allowed` is unchanged.

---

## 11. RPC impact

`create or replace` of `public.apply_data_intake_foundation_mutation` (same pattern as DATA-1E-R1). Semantic change is only the `cancel_session` allowlist:

Before: `created, source_ready, parsed`

After: `created, source_ready, parsed, mapping_required, mapped`

Operations remain `create_session`, `register_source`, `cancel_session`. Cancel still writes `import_cancelled` once, sets `cancelled_at` once, and does not delete mappings/sources/events.

---

## 12. Implementation files

- `supabase/migrations/20260829190000_allow_mapping_states_data_intake_session_cancellation.sql`
- `tests/features/data-intake/memory-rpc.ts` (cancel allowlist mirror)
- `tests/features/data-intake/parsed-session-cancellation.test.ts` (later-state fixture `mapping_required` → `validating`)
- `tests/features/data-intake/mapping-state-cancellation.test.ts`
- `tests/security/data-intake-mapping-cancellation-migration.test.ts`
- `tests/security/data-intake-object-verification-migration.test.ts` (inventory)
- `tests/security/data-intake-runtime-isolation.test.ts` (authorized `202608291*` prefix)

No DATA-1F catalog, mapping RPC, parser, Customer writer, Social, BQA, or other product module changes.

---

## 13. Migration decision

Additive function replacement required. PostgreSQL cannot patch a single `IF` without `CREATE OR REPLACE`. No new table. No RLS/grant/Storage/catalog change.

---

## 14. Migration filename / hash

| File | SHA-256 |
| --- | --- |
| `supabase/migrations/20260829190000_allow_mapping_states_data_intake_session_cancellation.sql` | `3293c94fe1550868017a752f0c7b5d4c88993f0ef222fd8b834fca0c59f7a4fe` |

**Not applied to Production.**

---

## 15. Security review

Reverified on the replaced function:

- `SECURITY DEFINER`
- `search_path = ''`
- `REVOKE ALL` from `public` / `anon` / `authenticated`
- `GRANT EXECUTE` to `service_role` only
- human actor + active Owner/Admin membership still required
- no dynamic SQL
- no new operation type
- service_role remains executor only (`isServiceRole: false` → `UNAUTHORIZED`)

---

## 16. Owner / Admin behavior

Owner and Admin can cancel `mapping_required` and `mapped` through `cancelDataIntakeSession`. Existing `created` / `source_ready` / `parsed` cancel paths remain green.

---

## 17. Staff / Viewer behavior

Staff and Viewer remain `FORBIDDEN_ROLE` for mapping-state cancellation.

---

## 18. Suspended / unauthenticated behavior

Suspended member: `ORG_NOT_FOUND` (fail closed). Unauthenticated: `UNAUTHORIZED`.

---

## 19. Foreign org / session behavior

Foreign Owner on org A: `ORG_NOT_FOUND`. Foreign session (org B + org A session id): `SESSION_NOT_FOUND`.

---

## 20. Tenant isolation

Cancellation remains organization-scoped. Organization A cannot cancel Organization B’s mapped intake. Runtime isolation still forbids DATA table tokens in Social / BQA / TAX / CAP / CTX / Programs / Enrollments / Tasks / Attention / invitations / memberships / billing / onboarding.

---

## 21. mapping_required lifecycle proof

Tested: parse → first mapping (`mapping_required`) → optional ignore → Owner/Admin `cancel_session` → `cancelled`, `cancelled_at` set once, mapping rows retained, `mapping_proposed` retained, post-cancel mapping `INVALID_STATE`, staging/plans/links empty.

---

## 22. mapped lifecycle proof

Tested: parse → map `display_name` → confirm → `mapped` → snapshot hash present → Owner/Admin `cancel_session` → `cancelled`. Confirmed rows remain `confirmed`. `mapping_confirmed` and `mapping_hash` unchanged. Post-cancel upsert/confirm `INVALID_STATE`.

---

## 23. Confirmed snapshot retention

Cancel does not rewrite mapping rows or confirmation stamps. Hash in `mapping_confirmed` metadata is unchanged after mapped cancellation and after cancel replay.

---

## 24. Mapping-event retention

`mapping_proposed` and `mapping_confirmed` remain immutable. Cancel appends `import_cancelled` only.

---

## 25. Cancellation-event behavior

Existing taxonomy `import_cancelled` is unchanged. Exactly one event. Metadata is `{ status: cancelled }`. No source row values.

---

## 26. Terminal / replay behavior

Second cancel remains `INVALID_STATE` (not idempotent success). `cancelled_at` is not rewritten. No second `import_cancelled`. Mapping rows and hash unchanged.

---

## 27. Later-state rejection

`validating` (frozen graph cancel edge, **not** in this R1 allowlist) still returns `INVALID_STATE`. This proves an explicit allowlist, not “cancel anything the graph allows.”

DATA-1E-R1 later-state fixture was updated from `mapping_required` to `validating` for the same reason.

---

## 28. Parser / discovery regression

CSV/XLSX structure, object verification, and `parsed` discovery tests remain green. Parser scope unchanged.

---

## 29. Mapping regression

DATA-1F mapping domain + service tests remain green. Catalog still `display_name`, `email`, `phone`, `first_name`, `last_name`. Duplicate-target, ignore, hash, and confirmation behavior unchanged.

---

## 30. Staging non-effect

Attributable `data_intake_staging_rows` delta: **0**

---

## 31. Import-plan non-effect

`data_import_plans` = **0**. `data_import_row_results` = **0**.

---

## 32. Customer non-effect

Customers delta = **0**. `CUSTOMER WRITER MODIFIED = NO`. `CUSTOMER WRITER INVOKED = NO`.

---

## 33. External-links non-effect

`data_external_record_links` delta = **0**

---

## 34. Targeted DATA tests

| Measure | Count |
| --- | --- |
| Previous | 96 |
| Added | 9 |
| Final | 105 |

Added: `mapping-state-cancellation.test.ts` (6), `data-intake-mapping-cancellation-migration.test.ts` (3). Existing DATA-1E-R1 later-state assertion retargeted to `validating`.

---

## 35. Targeted success rate

`105 / 105 = 100%`

---

## 36. Typecheck

`npx tsc --noEmit` — PASS

---

## 37. Lint

`npx next lint` — PASS (0 warnings)

---

## 38. Build

`next build` is not a DATA-1C–1F-R1 closure gate (same convention as DATA-1E / DATA-1F).

---

## 39. Full suite

`npx vitest run`: **3271 passed, 2 failed, 3273 total**

Prior DATA-1F baseline: 3262 passed, 2 failed, 3264 total. Added 9 R1 tests (3264 + 9 = 3273).

---

## 40. Full-suite percentage

`3271 / 3273 = 99.9389%`

---

## 41. Historical failures

Exactly:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Neither was modified.

---

## 42. New regressions

`NEW REGRESSIONS = 0`

---

## 43. Production status

`DATA-1F-R1 PRODUCTION APPLY = NOT YET AUTHORIZED`

`DATA-1F PRODUCTION MAPPING = NOT YET AUTHORIZED`

No Production fixture. No Production cancel. No `db push`. No migration-history repair.

---

## 44. DATA-1F-FV implication

After this R1, a future owner-authorized FV can prove without raw SQL:

fresh session → source → private upload → object verification → structure discovery → `parsed` → mapping decision(s) → `mapping_required` → confirm → `mapped` → governed `cancel_session` → `cancelled`

with staging = 0, import plans = 0, Customer delta = 0.

Required future owner string (do not manufacture):

`DATA-1F-FV CONTROLLED PRODUCTION SEMANTIC MAPPING = AUTHORIZED`

Do not start DATA-1F-FV from this close-out.

---

## 45. Residual risks

- This migration is not on Production until a separate FV/apply gate.
- Graph cancel edges for `validating` and later import states remain RPC-blocked by design.
- Cancel still does not delete Storage objects (retain-on-cancel policy).
- Function replacement copies the DATA-1E-R1 RPC body; future foundation-RPC edits must keep the R1 allowlist or replace this function again.

---

## 46. Final Git state

Implementation commit: `66a0ed72ca94e3760fa09bb5244b1ff76b4d33b6`. Evidence commit SHA is recorded in the closing response. Required: branch `core/platform-readiness-20260707`, normal push, divergence `0 0`, clean worktree. No amend. No force-push.

---

## 47. Final verdict

`DATA-1F-R1 CLOSED WITH EVIDENCE — MAPPING-STATE CANCELLATION + LIFECYCLE HARDENING VERIFIED`

`DATA-1F TARGETED TEST SUCCESS RATE = 100%`

`DATA-1F-FV READY FOR CONTROLLED PRODUCTION VERIFICATION — OWNER AUTHORIZATION REQUIRED`
