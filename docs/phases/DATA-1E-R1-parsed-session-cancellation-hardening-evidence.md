# DATA-1E-R1 — Parsed Session Cancellation + State-Machine Hardening

| Field | Value |
| --- | --- |
| Phase | **DATA-1E-R1 — PARSED SESSION CANCELLATION + STATE-MACHINE HARDENING** |
| Parent | DATA-1E |
| Document type | Remediation evidence |
| Date | 2026-08-27 |
| Formal status | `DATA-1E-R1 CLOSED WITH EVIDENCE — PARSED SESSION CANCELLATION + STATE-MACHINE HARDENING VERIFIED` |
| Governing DATA-1E | `docs/phases/DATA-1E-secure-parser-structure-discovery-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `62af75f4ce25320b289d49d9facd63c4c72c145a` |
| Implementation commit | `052ac0ce8cbb1288fc14b7efc07db2a92f456ef3` |
| Production apply | **NOT PERFORMED** |
| Production discovery | **NOT AUTHORIZED** |

`parsed → cancelled = SUPPORTED`

`DATA-1E-R1 PRODUCTION APPLY = NOT YET AUTHORIZED`

`DATA-1E PRODUCTION DISCOVERY = NOT YET AUTHORIZED`

---

## 1. Executive verdict

DATA-1E-R1 is complete. After structure discovery, an authorized Owner/Admin can cancel a `parsed` session through the governed `cancel_session` path. `created → cancelled` and `source_ready → cancelled` remain valid. Later pipeline states stay outside the cancel allowlist. Parser behavior is unchanged. Targeted DATA tests: **81 / 81 = 100%**. Full suite: **3247 passed, 2 failed, 3249 total**. Same two historical failures. `NEW REGRESSIONS = 0`.

---

## 2. Reason for remediation

DATA-1E left a residual lifecycle gap: discovery moved the session to `parsed`, but governed cancellation still accepted only `created` and `source_ready`. A user who discovered structure and decided not to continue could not abandon the intake without raw SQL. DATA-1E-FV needs `create → source → upload → verify → discover → cancel` as a complete controlled lifecycle.

---

## 3. DATA-1E dependency

Authoritative DATA-1E implementation:

- branch `core/platform-readiness-20260707`
- implementation `d1814931b942b481ed02f8e9ad9dc4d95060b37e`
- evidence HEAD `62af75f4ce25320b289d49d9facd63c4c72c145a`
- targeted tests `73 / 73 = 100%`

This remediation does not change CSV/XLSX parsing, mapping, staging, or Customer import.

---

## 4. Starting Git state

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `62af75f4ce25320b289d49d9facd63c4c72c145a` |
| Subject | `docs(data): record source parser discovery evidence` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `62af75f4ce25320b289d49d9facd63c4c72c145a` |
| Divergence | `0 0` |
| `git status` | clean |
| Staged / unstaged / untracked | none |
| `git diff --check` | clean |

---

## 5. Original lifecycle limitation

Governed `cancel_session` accepted only:

- `created → cancelled`
- `source_ready → cancelled`

`parsed → cancelled` returned `INVALID_STATE`.

---

## 6. Root cause

Restriction lived in **two application/RPC layers**, not in the status graph.

| Layer | File | Behavior |
| --- | --- | --- |
| Frozen graph | `private.data_intake_session_status_transition_allowed` in `20260827140000_create_data_intake_foundation.sql` | **Already allowed** `parsed → cancelled` |
| Session CHECK / integrity trigger | same foundation migration | Uses the graph helper; **already allowed** |
| TypeScript service | `cancelDataIntakeSession` | **No state filter**; delegates to RPC |
| Foundation RPC | `public.apply_data_intake_foundation_mutation` `cancel_session` in `20260827140010_enable_data_intake_rls.sql` | **Blocked**: `v_session.status not in ('created', 'source_ready')` |
| Memory RPC (tests) | `tests/features/data-intake/memory-rpc.ts` | Mirrored the SQL allowlist |

Exact SQL blocker:

`if v_session.status not in ('created', 'source_ready')` inside `p_operation = 'cancel_session'`.

---

## 7. State-machine before

Cancellable via governed RPC: `created`, `source_ready`.

Graph already listed `parsed → cancelled` but the RPC never exercised it.

---

## 8. State-machine after

Cancellable via governed RPC (explicit allowlist, **not** “any state”):

- `created → cancelled`
- `source_ready → cancelled`
- `parsed → cancelled`

Still rejected: already `cancelled` (terminal `INVALID_STATE`, no duplicate event), and later states such as `mapping_required` (tested by store mutation). `register_source` still requires `created` or `source_ready` only.

`parsed → cancelled = SUPPORTED`

---

## 9. Implementation change

- New migration replaces `apply_data_intake_foundation_mutation` with the same body except cancel allowlist `('created', 'source_ready', 'parsed')` and a matching error message.
- Memory RPC updated to the same allowlist and records `cancelled_at` once.
- No parser, mapping, staging, Customer, Storage, or RLS policy edits.

---

## 10. Migration decision

Required: the live restriction was in the SQL function body. Schema/CHECK already allowed the transition. Smallest fix is `CREATE OR REPLACE` of the existing foundation RPC. No new table.

---

## 11. Migration filename / hash

File: `supabase/migrations/20260827161658_allow_parsed_data_intake_session_cancellation.sql`

SHA-256: `b94a445e8a0a57285089f172ad778b4e1b4a70d52fe2cbd9313a6d00cfcd6b9e`

**Not applied to Production.** No `db push`. DB-MIGRATION-DRIFT-01 remains binding.

---

## 12. RPC security review

Unchanged except the cancel allowlist:

- `SECURITY DEFINER`
- `search_path = ''`
- `auth.role() = service_role` required
- EXECUTE revoked from `public` / `anon` / `authenticated`, granted to `service_role` only
- Owner/Admin actor membership still required
- operations remain `create_session`, `register_source`, `cancel_session` only
- no dynamic SQL (`EXECUTE format` absent)

---

## 13. Role authorization

Unchanged:

- Owner → allowed
- Admin → allowed
- Staff → `FORBIDDEN_ROLE`
- Viewer → `FORBIDDEN_ROLE`
- suspended → `ORG_NOT_FOUND`
- unauthenticated → `UNAUTHORIZED`
- `service_role` remains executor only

---

## 14. Tenant isolation

Unchanged composite lookup (`organization_id` + session id). Foreign Owner targeting ORG_A → `ORG_NOT_FOUND`. Foreign session UUID → `SESSION_NOT_FOUND`.

---

## 15. parsed → cancelled verification

Tested path: create → register → verify → discover (`parsed`) → `cancel_session` → `cancelled`, `cancelled_at` set, `import_cancelled` once.

---

## 16. Event behavior

Existing event type `import_cancelled` retained. Metadata `{ status: cancelled }` only. Actor is the RPC `p_actor_user_id`. Prior `source_object_verified` and `source_parsed` events remain. No headers, rows, or source bytes in cancellation metadata.

---

## 17. Replay / idempotency

Already-cancelled sessions still return `INVALID_STATE` (historical DATA-1C behavior preserved). No second `import_cancelled` event. `cancelled_at` is not rewritten.

---

## 18. Discovery evidence retention

After parsed cancellation, source `object_verified_at`, `header_row_index`, and `parse_metadata.parser_version` remain. Discovery metadata is not deleted.

---

## 19. Cancelled-state rejection

After `parsed → cancelled`:

- structure discovery → `INVALID_STATE`
- register source → `INVALID_STATE`
- upload/verify → `INVALID_STATE`

---

## 20. Parser regression tests

CSV structure (8), XLSX structure (6), and structure-discovery (5) tests still pass. No parser source files were modified.

---

## 21. Non-effects

Mappings, staging, plans, row-results, and external links remain length 0 after parsed cancellation. No Customer writer. Diff is DATA cancellation SQL + memory RPC + tests only.

---

## 22. Targeted test count

Previous DATA-1E: **73**. Added **8** (6 lifecycle + 2 migration security). Final: **81**.

---

## 23. Targeted test success rate

`81 / 81 = 100%`

---

## 24. Typecheck

`npx tsc --noEmit` — PASS

---

## 25. Lint

`npx next lint` — PASS (0 warnings)

---

## 26. Build

`next build` is not a DATA-1C/1D/1E/R1 closure gate.

---

## 27. Full suite

`npx vitest run`: **3247 passed, 2 failed, 3249 total**

Previous DATA-1E baseline: 3239 passed, 2 failed, 3241 total. The +8 tests are R1 coverage.

---

## 28. Full-suite success rate

`3247 / 3249 = 99.94%`

Do not hide the two failures.

---

## 29. Historical failures

Unchanged:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Neither was modified.

---

## 30. New regressions

`NEW REGRESSIONS = 0`

---

## 31. Production verification implication

DATA-1E-FV can now exercise:

fresh synthetic session → source registration → private upload → object verification → CSV structure discovery → `parsed` → governed cancellation → `cancelled`

without raw SQL. This R1 phase does **not** authorize Production apply or Production discovery.

Required future owner string (do not manufacture):

`DATA-1E-FV CONTROLLED PRODUCTION SOURCE STRUCTURE DISCOVERY = AUTHORIZED`

Apply this migration together with DATA-1E’s `20260827160000` migration when that gate is explicitly authorized.

---

## 32. Residual risks

- Later mapping/import states remain non-cancellable in the v1 RPC by design; DATA-1B lists more cancel edges that future phases must implement when those states exist.
- Cancel of `parsed` does not delete Storage objects (same retain-on-cancel policy as DATA-1C/1D).
- Function replacement copies the DATA-1C RPC body; future foundation-RPC edits must keep R1 cancel allowlist or replace this migration’s function again.

---

## 33. Final Git state

Recorded after the evidence commit in the closing response. Required: branch `core/platform-readiness-20260707`, normal push, divergence `0 0`, clean worktree.

---

## 34. Recommended DATA-1E-FV gate

DATA-1E + R1 are locally complete. Next is controlled Production structure discovery under a new owner authorization, including governed cancellation after `parsed`. Do not start DATA-1F. Do not start mapping or staging.
