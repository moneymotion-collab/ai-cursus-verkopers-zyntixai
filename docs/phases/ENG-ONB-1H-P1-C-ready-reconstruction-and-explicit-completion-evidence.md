# ENG-ONB-1H-P1-C / P1-C-R1 / P1-C-R2 — Ready reconstruction, database-atomic completion, and organization-context isolation evidence

**Phase.** `ENG-ONB-1H-P1-C`
**Verdict.** `PASS — ENG-ONB-1H-P1-C READY RECONSTRUCTION AND DATABASE-ATOMIC COMPLETION CLOSED WITH EVIDENCE`
**Closure.** **Closed with evidence.** Gate 10 is PASS through the dedicated `ENG-ONB-1H-P1-C-PUB` commit and ordinary fast-forward push that contain this document and the 20 implementation/test paths.
**Revision.** P1-C-R1 database Ready gate + P1-C-R2 organization-context isolation; published after independent `ENG-ONB-1H-P1-C-R1-R2-FR`

This document is the repository-native evidence for P1-C, including the R1 database-atomic current-Ready gate and the R2 Organization Context read-isolation correction. Publication of this document closes P1-C. It does not consume P1-D authority. Production remains unverified and unauthorized.

`GATE 10 PUBLICATION = PASS` (satisfied by the commit and push that contain this document)

`MANDATORY GATES PASSED = 9 of 9`

`ENG-ONB-1H-P1-C = CLOSED WITH EVIDENCE`

`INDEPENDENT FINAL REVIEW = PASS — ENG-ONB-1H-P1-C-R1-R2-FR DATABASE-ATOMIC COMPLETION AND CONTEXT ISOLATION INDEPENDENTLY VERIFIED`

`PRODUCTION = UNVERIFIED AND UNAUTHORIZED`

`NEXT PHASE = ENG-ONB-1H-P1-D (NOT STARTED)`

**Publication identity (Gate 10; this commit cannot contain its own hash in advance)**

| Field | Value |
| --- | --- |
| Identifier | `ENG-ONB-1H-P1-C` |
| Title | Ready Reconstruction and Explicit Completion |
| Working branch | `core/platform-readiness-20260707` |
| Publication parent | `8371928109d0f42ee30f0e30dd0f13140fe49b90` |
| Required subject | `feat(onboarding): add Ready reconstruction and completion` |
| Publication scope | exactly the 21 governed paths in §16 |
| Independent final review | `PASS — ENG-ONB-1H-P1-C-R1-R2-FR DATABASE-ATOMIC COMPLETION AND CONTEXT ISOLATION INDEPENDENTLY VERIFIED` |
| Publication | **performed** by `ENG-ONB-1H-P1-C-PUB` |
| Gate 10 | **PASS** — satisfied by that commit and ordinary fast-forward push |
| Mandatory gates | **9 of 9 PASS** (Gate 8 justified) |
| Phase status | **CLOSED WITH EVIDENCE** |
| Production | **unverified and unauthorized** |
| Next phase | `ENG-ONB-1H-P1-D` — **not started** |

---

## 1. P1-C-FR defect (corrected overclaim)

P1-C reconstructed Ready in the application and hid Enter ZyntixAI unless the reconstructed snapshot was Ready. That was **not** database authority.

The exposed authenticated RPC `public.complete_organization_v2_onboarding(uuid)` completed a V2 Setup Ready organization without proving that the completion run was currently `ready_for_cutover` from current evidence.

An authenticated Owner could complete when the run was:

- absent;
- `inviting`;
- `invite_partial`;
- `setup_ready`;
- no longer Ready after a committed concurrent downgrade;
- stored `ready_for_cutover` whose pending invitation had clock-expired.

That produced split state:

- organization lifecycle = `v2_completed`;
- completion run = `invite_partial` (or other non-completed status);
- completion-run `completed_at` = null.

The previous evidence statement that SQL does **not** check `ready_for_cutover` was accurate for P1-C and is **no longer true** after the forward correction.

Application tests that mocked `SETUP_NOT_READY` / `NOT_READY` prove UI mapping only. They are **not** PostgreSQL proof. Direct authenticated local RPC proof is `tests/security/onboarding-completion-ready-gate-live-verification.sql`.

---

## 2. Forward correction

Exactly one new forward migration replaces the existing signature:

`public.complete_organization_v2_onboarding(uuid) returns jsonb`

Path: `supabase/migrations/20260911144302_complete_onboarding_requires_current_ready_authority.sql`

Canonical-LF SHA-256: `11106D8BB66E9FF13547142F26E7370E4C507B7050923FFBBB62FF6A2FB2DFC3`

Historical migrations were **not** modified:

| Migration | canonical-LF SHA-256 |
| --- | --- |
| `20260907140829_onboarding_v2_transition_authority.sql` | `8D9B05FC09BC1DB9EA7B0C2AB6C909910D6B04661E75175133692C4227CF9BFF` |
| `20260908111356_onboarding_completion_authority.sql` | `D86E0B4D72F7D1D9B83571E87723ACAC0649EC9EFE1B501EE1D9BD808F2A1796` |
| `20260908131955_reconcile_stale_onboarding_invitation_proof.sql` | `52A041953918A621A88D30C41EFD70AB5167AC303DAED12488BD623181CEFEE3` |

Generated types `src/types/database.generated.ts` remain `68DC7981247FC4DA05008C237EC74FAA422B85B9996B752A166E32EFFD693F01`. Temporary `--local` generation compared semantically: no table or RPC signature drift. Tracked types were not rewritten.

---

## 3. Why application-only Ready checking was insufficient

The UI and `completeReadyOnboarding` refuse unless the reconstructed snapshot is Ready. `completeV2Onboarding` in `transition-v2-onboarding.ts` still calls the RPC without that pre-check. Any authenticated Owner can also invoke the RPC directly.

Those paths bypass the application gate. The database must fail closed.

Leftover helper disposition: **kept**. It remains required by `tests/onboarding/v2-onboarding-transitions.test.ts`. After the SQL correction it cannot complete a non-Ready organization. It maps `NOT_READY` to `invalid_state` without leaking SQL. It was not deleted.

---

## 4. Database-owned Ready validation

Inside one transaction, for a non-completed organization:

1. Acquire advisory locks in canonical order: **872002** then **872004** using the governed organization-key derivation (`hashtext(p_organization_id::text)` then `hashtext(coalesce(p_organization_id::text, ''))`). Never invert.
2. Owner `FOR UPDATE`; organization `FOR UPDATE`.
3. Absent completion run → `NOT_READY` (does not `ensure`).
4. Row-lock intents, invitation results, invitations, and other memberships `ORDER BY id FOR UPDATE`.
5. Reconcile every frozen intent with `private.resolve_organization_onboarding_invite_intent_evidence` and non-incrementing persist (same B4 path, including `invitation_proof_lost` / `historical_invitation`).
6. `private.advance_organization_onboarding_completion_run`.
7. If status is distinct from `ready_for_cutover` → `NOT_READY` **before** any completion write.
8. One timestamp `v_completed_at := now()`; set organization `onboarding_completed_at`; set run `status='completed'` and `completed_at` equal to that timestamp; **do not** overwrite `ready_for_cutover_at`. If the run update is not exactly one row, raise so both writes roll back.

Invitation revoke/accept/create do **not** take 872004. Row locks are the TOCTOU protection for those paths.

No invitation create, delivery, token, or rate-limit side effects.

Idempotent replay of an already-completed organization returns `ok: true, idempotent: true` without altering timestamps or creating a missing legacy run.

---

## 5. Direct authenticated RPC matrix (local clone)

Artifact: `tests/security/onboarding-completion-ready-gate-live-verification.sql`

Clone: `zyntixai_onb_p1c_r1_20260911t1454` (dropped after PASS). Role: `SET LOCAL ROLE authenticated` with JWT actor claims. Synthetic `@example.test` identities.

**Refused (`NOT_AUTHENTICATED` / `NOT_AUTHORIZED` / `NOT_READY` as applicable):**

unauthenticated; non-Owner; outsider; foreign Owner; absent run; `setup_ready`; stored `inviting`; stored `invite_partial`; clock-expired stored Ready; revoked invitation; expired/historical proof; accepted without matching membership; missing result; foreign membership; unrelated membership.

**Succeeded:**

current pending unexpired invitation; zero-intent Ready; mixed terminal (pending + active membership + membership-collision); matching active membership; already-completed idempotent replay.

**Clock expiry:** stored `ready_for_cutover` with `expires_at <= now()` on a pending invitation, completed **without** the application Ready loader, returned `NOT_READY`. Organization not completed.

**Atomicity:** forced run write failure after organization write rolled back both. Coherent retry then completed with equal timestamps.

**Two-session (dblink, distinct backends):**

1. Two simultaneous valid completions: one first-success, one idempotent; B waited on **872002** (complete acquires 872002 before 872004).
2. Reconcile/downgrade commits before complete → `NOT_READY`.
3. Complete holds 872004 while reconcile waits.
4. Reconcile holds 872004 while complete waits.
5. Invitation revocation races completion (invitation row lock).
6. Membership status change races completion (membership row lock).
7. Controlled failure after org write / before run write: no split state.
8. Already-completed replay racing another replay: both idempotent; one timestamp.

Terminal notice: `PASS - ENG-ONB-1H-P1-C-R1 onboarding completion Ready-gate runtime verification` against that clone; zero residue after cleanup.

This proves the **local** RPC boundary and the tested local serialization. It does **not** prove Production.

---

## 6. Privileges (primary `postgres` after apply)

- Overloads: 1
- Owner: `postgres`
- `SECURITY DEFINER`: true
- `search_path=""`
- `authenticated` EXECUTE: true
- `anon` EXECUTE: false
- `public` EXECUTE: false
- `service_role` EXECUTE: true (preserved by `CREATE OR REPLACE`; already present before replacement)
- authenticated cannot `UPDATE organizations.onboarding_completed_at`
- no batch/bulk completion RPC
- definition contains `872004`, `ready_for_cutover`, `NOT_READY`
- function definition md5: `21b7e4a637752a0acebb399211e70c63`

---

## 7. Local ledger

- Repository migrations after the new file: **129**
- Primary ledger: **129**
- New ledger version: `20260911144302` exactly once
- Pending after apply: **0**
- Applied with `npx supabase migration up --local` only

---

## 8. Checkpoint

Pre-apply custom-format dump (kept; not overwritten):

`C:\Users\guusv\AppData\Local\zyntixai-db-checkpoints\ENG-ONB-1H-P1-C-R1-complete-onboarding-requires-current-ready-authority-20260911T144244Z.dump`

- Created: `2026-09-11T16:42:44.2975770+02:00`
- Size: 2773636
- SHA-256: `1319261B47433616B91060FBA038000DD300D57D534F42024016FB78F116C144`
- Signature: `PGDMP`
- `pg_restore --list` numbered entries: **3304**

This dump predates applying `20260911144302`.

---

## 9. Automated tests

| Command | Result |
| --- | --- |
| Ready-gate static mutation tests + P1-C focused + leftover helper | **115 passed / 8 files** (reused; hashes unchanged after that run) |
| P1-A/P1-B `completion-run-integration` + `governed-invitation-execution` | **98 passed** |
| Invitation/security focused (4 files) | **79 passed** |
| `npx vitest run tests/onboarding tests/security` | **1146 passed / 2 failed / 1148** |
| `npx vitest run --fileParallelism false --maxWorkers 1` | **4070 passed / 4 failed / 4074 total** |
| `npx tsc --noEmit` | pass |
| `npm run lint` | pass |
| `npm run build` | pass; `ƒ /onboarding/ready` present |
| P0 live (schema-only clone `zyntixai_onb_completion_rv_20260911t1948`) | **PASS** — 437 single-session + 4 two-session races; clone dropped |
| Ready-gate live SQL | **PASS** (see §5) |

Historical failures still present (unchanged HEAD tests):

- `tests/features/invitations/load-member-administration-page.test.ts`
- `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

**Additional persistent failures that blocked R1 (resolved in R2):**

- `tests/security/organization-context-assignment-runtime-isolation.test.ts` (2 tests)

Those failures were **not** historical. They were caused by the P1-C Ready loader’s direct `.from("organization_business_activities")` read. An authenticated client and the absence of a service-role client did **not** make that read acceptable. HEAD isolation authorizes only `src/types/database.generated.ts` and `src/features/org-context/**` as table consumers, and `src/features/onboarding` is a protected Closed Beta surface. See §14.

P0 live against a `--no-acl` full dump first failed clone-only `anon EXECUTE` and later `n_profiles` residue. Those were restore-method artifacts. The published schema-only clone method passed. Primary `anon` EXECUTE on `ensure_organization_onboarding_completion_run` is **false**.

---

## 10. Browser (local)

Harness: `C:\Users\guusv\AppData\Local\Temp\p1c-ready\run.mjs` (not a repository file). Child env: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54441`; `SUPABASE_SERVICE_ROLE_KEY` deleted; `NODE_OPTIONS=--require guard.cjs`. Port **3457**. `.env.local` not edited and not used as the effective target.

| Item | Count |
| --- | --- |
| Gate 7 cells | **12 / 12 PASS** (4 operating models × 3 viewports) |
| Gate 7 checks | **276 / 276 PASS** |
| Runtime matrix | **60 / 60 PASS** |
| Remote `supabase.co` in egress log | **none** |
| Leftover `P1C%` organizations | **0** |
| Port 3457 after | **free** |

J8 / J9 / J12 including explicit click-to-complete, no product admission, completed refresh. Clock-expired stored Ready **direct RPC** refusal is proven in §5, not as a separate Gate 7 cell. Browser tests prove local application interaction, not Production.

---

## 11. Resume / interruption

A P0 `pg_restore` into `zyntixai_onb_completion_rv_20260911t1712` started ~15:12 local and remained stuck while the Owner was absent. Host PID 2808 / container restore later **no longer existed**. The leftover database was an **empty shell** (no `schema_migrations`). It was dropped after proving 0 sessions and the disposable prefix. Primary `postgres` was not restored over. Checkpoint was not overwritten.

---

## 12. Remaining blockers after R1 (historical)

R1 remaining blocker was the two isolation failures. R2 resolved them. After R2, before independent review and this publication, the open items were:

1. Gate 10 pending (no stage/commit/push).
2. Production unverified.
3. P1-C not closed; P1-D not begun.
4. Combined independent review `ENG-ONB-1H-P1-C-R1-R2-FR` had not run.

Independent `ENG-ONB-1H-P1-C-R1-R2-FR` is now **PASS**. Items 1, 3, and 4 are closed by this publication. Item 2 remains: Production is unverified. See §15–§18.

---

## 13. Git end state after R1 (retained historical snapshot)

| Field | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `8371928109d0f42ee30f0e30dd0f13140fe49b90` |
| Divergence | `0 0` |
| Staging | empty |
| Publication | **not performed at that snapshot**; closed by `ENG-ONB-1H-P1-C-PUB` in §16 |

---

## 14. P1-C-R2 organization-context isolation correction

### 14.1 Failures reproduced before editing

Command: `npx vitest run tests/security/organization-context-assignment-runtime-isolation.test.ts`

Exit 1. Two of three tests failed. Both expected `[]` and received:

`["src/features/onboarding/server/onboarding-ready.ts"]`

Exact names:

1. `ORG-CONTEXT runtime isolation > authorizes only generated types and the org-context feature as table consumers`
2. `ORG-CONTEXT runtime isolation > leaves Closed Beta product surfaces free of ORG-CONTEXT identifiers`

Failure kind: **static source scan** of production TypeScript. Not mocked runtime and not live PostgreSQL. Stack pointed at `tests/security/organization-context-assignment-runtime-isolation.test.ts` lines 84 and 98. Production hit: `readOwnerOperatingModelLabel` in `src/features/onboarding/server/onboarding-ready.ts` (`.from("organization_business_activities").select("display_name")`).

This did not fail before P1-C because no onboarding file contained those identifiers. The test protects the canonical rule that Closed Beta product surfaces, including `src/features/onboarding`, must not become organization-context table consumers.

### 14.2 Why the authenticated table read was not acceptable

The earlier P1-C / R1 statement that the authenticated direct table read was acceptable (to avoid a service-role client) is **not true** under HEAD isolation. The isolation authority is the source-consumer boundary, not the database role used. Direct `.from("organization_business_activities")` in onboarding bypassed `src/features/org-context`. No new RPC, RLS change, or service-role path is justified to retain decorative copy.

### 14.3 Correction

Removed the Ready loader’s direct table query. Presentation now uses the existing canonical `OrganizationContextRepository.getPrimaryBusinessActivity` with the **authenticated** Owner client and the **server-derived** organization id. That repository is the authorized org-context consumer. The loader:

- does not mention `organization_business_activities` in onboarding source;
- does not use `createSupabaseServiceRoleClient`, `createOrgContextQueryClient`, or control-plane readers;
- does not call `resolveOperatingModelSetupStatus` (that path needs the control-plane service role and crashed Ready under the local harness that deletes `SUPABASE_SERVICE_ROLE_KEY`);
- refuses a foreign activity `organizationId` and shows `Configured operating model` instead of a foreign label;
- never lets label presence, absence, or mismatch grant or deny Ready / completion. Ready authority remains Owner + listing + current-evidence reconciliation + database-proven `ready_for_cutover`.

Displayed activity / operating-model label source: primary Business Activity `displayName` from `OrganizationContextRepository` for `actor.organizationId`. Fallback: `READY_OPERATING_MODEL_FALLBACK_LABEL` (`Configured operating model`). Domain helper `readyOperatingModelPresentationLabel` still maps pack keys to product-facing titles but is not a completion gate.

### 14.4 Isolation tests

The two originally failing tests were **not** weakened, skipped, deleted, or excluded. `src/features/onboarding` remains in `PROTECTED_PATHS`. Added:

- in-memory mutation: appending `.from("organization_business_activities")` to a copy of the Ready loader matches the isolation token; production file remains a non-authorized consumer;
- no `.skip` / `.only` on this file.

Behavioral Ready reconstruction tests now prove: no direct `from()` in the loader; membership-derived org is used even if the client sends a forged `org`; non-Owner never reaches presentation; missing presentation cannot mint Ready; a foreign activity id cannot appear in the snapshot.

### 14.5 Mutation-test result

In-memory mutation of the Ready loader source with `void client.from("organization_business_activities")` makes `ORG_CONTEXT_TOKEN` match. Production file was not rewritten for the experiment. Reintroducing the prohibited read would fail both original isolation tests.

### 14.6 Database immutability during R2

No migration was applied, reverted, or edited. Ledger remained **129 / 129** with pending **0**. Migration `20260911144302` canonical-LF SHA-256 remained `11106D8BB66E9FF13547142F26E7370E4C507B7050923FFBBB62FF6A2FB2DFC3`. Function md5 remained `21b7e4a637752a0acebb399211e70c63`. Generated types remained `68DC7981247FC4DA05008C237EC74FAA422B85B9996B752A166E32EFFD693F01`. Checkpoint dump unchanged: `1319261B47433616B91060FBA038000DD300D57D534F42024016FB78F116C144`. R1 database Ready-gate live SQL evidence is **retained** (hashes and live function definition identical; no database-authority code changed).

### 14.7 Focused verification (R2)

| Command | Result |
| --- | --- |
| `tests/security/organization-context-assignment-runtime-isolation.test.ts` plus five related org-context assignment/isolation files | **58 passed / 6 files** |
| Ready reconstruction + Ready route + V2 actions + routing | **61 passed / 4 files** |
| P1-A/P1-B `completion-run-integration` + `governed-invitation-execution` + `creating-route` + `team-foundation-route` + `v2-onboarding-transitions` | **133 passed / 5 files** |
| Completion-authority static (`onboarding-completion-ready-gate-migration-security` + `onboarding-completion-authority-migration-security`) | **95 passed / 2 files** |
| Invitation/security focused (7 files including v2 transition authority) | **101 passed / 7 files** |
| `npx vitest run tests/onboarding tests/security` | **1157 passed / 0 failed / 1157 total / 125 files** |
| `npx vitest run --fileParallelism false --maxWorkers 1` | **4081 passed / 2 failed / 4083 total** |
| `npx tsc --noEmit` | pass |
| `npm run lint` | pass |
| `npm run build` | pass; `ƒ /onboarding/ready` present |

The two full-suite failures are only the governed historical pair:

- `tests/features/invitations/load-member-administration-page.test.ts`
- `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No third persistent failure. Added tests: isolation file 3 → 5; Ready reconstruction 31 → 38. Totals increased from 4074 / 1148 to **4083 / 1157**.

### 14.8 Browser (R2 local rerun)

Harness: `C:\Users\guusv\AppData\Local\Temp\p1c-ready\run.mjs` (not a repository file). Child env: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54441`; `SUPABASE_SERVICE_ROLE_KEY` deleted; `NODE_OPTIONS=--require guard.cjs`. Port **3457**. `.env.local` not edited. Effective target was loopback, not the remote host stored in `.env.local`.

| Item | Count |
| --- | --- |
| Gate 7 cells | **12 / 12 PASS** (4 operating models × 3 viewports) |
| Gate 7 checks | **288 / 288 PASS** |
| Runtime matrix | **60 / 60 PASS** (rerun because Ready-loader presentation changed) |
| Remote `supabase.co` in egress log | **none** |
| Leftover `P1C%` organizations | **0** |
| Port 3457 after | **free** |
| `startedAt` / `endedAt` | `2026-09-11T18:47:02.159Z` / `2026-09-11T18:50:54.180Z` |

The harness gained one legitimate extra check per cell: `J8 truthful operating-model presentation` against the seeded product-facing display name. That is why the total is 288 rather than the prior 276 (23 × 12). J8 / J9 / J12, four operating models, desktop / tablet / mobile, explicit completion, non-Owner denial, foreign-organization denial, completed refresh, no product admission.

A first R2 browser attempt using `resolveOperatingModelSetupStatus` for the label failed in ~88s with `SUPABASE_SERVICE_ROLE_KEY is not configured` (500 on `/onboarding/ready`). That confirmed the control-plane path is not a lawful Ready presentation source under the local no-service-role harness. The repository correction was then verified at 288/288.

R1 SQL Ready-gate live matrix was **not** re-executed. Reconfirmed before reuse: migration hash, live function md5, and ledger unchanged; no database-authority code changed.

### 14.9 Files modified during R2

Authorized application/test/evidence only:

- `src/features/onboarding/server/onboarding-ready.ts`
- `src/features/onboarding/domain/onboarding-ready.ts`
- `tests/onboarding/ready-reconstruction.test.tsx`
- `tests/security/organization-context-assignment-runtime-isolation.test.ts`
- this evidence document

The R1 migration was not altered. Generated types were not rewritten. P1-D was not started.

---

## 15. Residual after publication

Independent `ENG-ONB-1H-P1-C-R1-R2-FR` is **PASS**. Gate 10 is **PASS** through this dedicated commit and push. P1-C is **closed with repository evidence**. Remaining after closure:

1. Production remains unverified and unauthorized (`ENG-ONB-1H-PROD`, `ENG-ONB-1H-FV`).
2. `ENG-ONB-1H-P1-D` is the next phase and has **not** started.
3. The two governed historical Vitest failures remain unchanged.

---

## 16. Publication authority and exact repository state

Publication authority for Gate 10 (this commit cannot contain its own hash in advance):

| Field | Value |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Publication parent | `8371928109d0f42ee30f0e30dd0f13140fe49b90` |
| Required subject | `feat(onboarding): add Ready reconstruction and completion` |
| Paths in the publication commit | exactly the 21 governed paths below, including this document |
| Upstream | `origin/core/platform-readiness-20260707` |
| Push | ordinary fast-forward; no force |

Independent final review reused as Gate 4 / 5 / 6 / 7 authority (no protected implementation bytes changed for this publication):

- local ledger **129/129**; migration `20260911144302` applied exactly once; pending **0**
- completion function md5 `21b7e4a637752a0acebb399211e70c63`
- browser matrix **288/288**; application runtime matrix **60/60**
- onboarding/security **1157/1157**
- serial Vitest **4081 passed / 2 failed / 4083 total** (only the two governed historical failures)
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` passed
- no remote Supabase or Production access
- no residual P1-C processes, fixtures, `zyntixai_onb_*` databases, advisory locks, or idle-in-transaction sessions

### 16.1 Exact publication paths

Modified:

1. `src/app/onboarding/creating/page.tsx`
2. `src/features/onboarding/actions/onboarding-actions.ts`
3. `src/features/onboarding/domain/onboarding-invite-execution.ts`
4. `src/features/onboarding/domain/onboarding-routes.ts`
5. `src/features/onboarding/server/transition-v2-onboarding.ts`
6. `tests/onboarding/creating-route.test.tsx`
7. `tests/onboarding/onboarding-routing.test.ts`
8. `tests/onboarding/v2-onboarding-actions.test.ts`
9. `tests/onboarding/v2-onboarding-transitions.test.ts`
10. `tests/security/organization-context-assignment-runtime-isolation.test.ts`

Added:

11. `docs/phases/ENG-ONB-1H-P1-C-ready-reconstruction-and-explicit-completion-evidence.md`
12. `src/app/onboarding/ready/page.tsx`
13. `src/features/onboarding/domain/onboarding-ready.ts`
14. `src/features/onboarding/server/onboarding-ready.ts`
15. `src/features/onboarding/ui/onboarding-ready.module.css`
16. `src/features/onboarding/ui/onboarding-ready.tsx`
17. `supabase/migrations/20260911144302_complete_onboarding_requires_current_ready_authority.sql`
18. `tests/onboarding/ready-reconstruction.test.tsx`
19. `tests/onboarding/ready-route.test.tsx`
20. `tests/security/onboarding-completion-ready-gate-live-verification.sql`
21. `tests/security/onboarding-completion-ready-gate-migration-security.test.ts`

`GATE 10 = PASS`

---

## 17. `B1-GATE.1` Gate 1–10 table

Dispositions from contract §14.2 column `P1-C`. `Y` = mandatory PASS. `J` = `NOT_REQUIRED_WITH_JUSTIFICATION`.

| Gate | Contract | Result | Evidence |
| --- | --- | --- | --- |
| 1 Baseline | Y | **PASS** | P1-B closed at `8371928109d0f42ee30f0e30dd0f13140fe49b90`; publication parent is that same commit |
| 2 Scope freeze | Y | **PASS** | §16.1 21 governed paths only; generated types unchanged; no P1-D product admission |
| 3 Implementation completeness | Y | **PASS** | `/onboarding/ready` reconstruction; explicit click-to-complete; database-authoritative current-Ready validation; atomic organization/run completion; Organization Context read isolation |
| 4 Automated tests | Y | **PASS** | §9 and §14.7; independent review 1157/1157 and 4081/2/4083 |
| 5 Static quality | Y | **PASS** | §14.7 typecheck/lint/build; `git diff --check` clean |
| 6 Security / tenant isolation | Y | **PASS** | §5 RPC matrix; §6 privileges; §14 Organization Context isolation; no service-role application client |
| 7 Browser / visual | Y | **PASS** | §14.8 288/288; runtime matrix 60/60 |
| 8 Production verification | J | `NOT_REQUIRED_WITH_JUSTIFICATION` | No Production deployment. No linked/remote Supabase. Local Docker only. Contract §14.2 relocates Production to `PROD`/`FV`. |
| 9 Documentation / evidence | Y | **PASS** | this document, published by `ENG-ONB-1H-P1-C-PUB` |
| 10 Publication / closure | Y | **PASS** | `ENG-ONB-1H-P1-C-PUB` commit subject `feat(onboarding): add Ready reconstruction and completion`; parent `8371928109d0f42ee30f0e30dd0f13140fe49b90`; ordinary fast-forward of the 21 §16.1 paths |

`MANDATORY GATES PASSED THIS PHASE = 9 of 9`
`GATES JUSTIFIED = 1 (gate 8)`

---

## 18. Recommended next phase

`ENG-ONB-1H-P1-D` — Product route cutover and recovery. **Not started.**

Production remains unverified and unauthorized. Do not begin `ENG-ONB-1H-PROD` or `ENG-ONB-1H-FV`.

`ENG-ONB-1H-P1-D WORK PERFORMED HERE = NONE`

`ENG-ONB-1H-P1-D STARTED = NO`
