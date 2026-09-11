# ENG-ONB-1H-P1-B — Governed invitation execution and Creating-state evidence

**Phase.** `ENG-ONB-1H-P1-B`
**Verdict.** `PASS — ENG-ONB-1H-P1-B CLOSED WITH EVIDENCE AND PUBLISHED (R1 USER-CONTROLLED RETRY AUTHORITY, INDEPENDENT FINAL REVIEW, GATE 10 PUBLICATION)`
**Closure.** **Closed with evidence.** Gate 10 is PASS through the dedicated `ENG-ONB-1H-P1-B-PUB` commit and ordinary fast-forward push that contain this document and the 17 implementation/test paths.
**Revision.** `ENG-ONB-1H-P1-B-R1`

This document is the repository-native evidence for P1-B, including the R1 stop-on-retryable execution correction. Publication of this document closes the phase. It does not consume P1-C or P1-D authority. Production remains unverified and unauthorized.

`GATE 10 PUBLICATION = PASS` (satisfied by the commit and push that contain this document)

`MANDATORY GATES PASSED = 9 of 9`

`ENG-ONB-1H-P1-B = CLOSED WITH EVIDENCE`

`INDEPENDENT FINAL REVIEW = PASS — ENG-ONB-1H-P1-B-R1-FR USER-CONTROLLED RETRY AUTHORITY INDEPENDENTLY VERIFIED`

`PRODUCTION = UNVERIFIED AND UNAUTHORIZED (ENG-ONB-1H-PROD, ENG-ONB-1H-FV)`

`NEXT PHASE = ENG-ONB-1H-P1-C (NOT STARTED)`

---

## 1. Phase identifier and verdict

| Field | Value |
| --- | --- |
| Identifier | `ENG-ONB-1H-P1-B` |
| Title | Governed Invitation Execution and Creating State |
| Contract | `docs/phases/ENG-ONB-1H-P1-CONTRACT-v2-onboarding-application-integration-and-completion.md` §9.2 |
| Working branch | `core/platform-readiness-20260707` |
| Publication parent | `97956070bac6acc3d26140379752d4797b795ba4` |
| Required subject | `feat(onboarding): add governed invitation execution` |
| Publication scope | this document plus the 17 implementation/test paths in §4 |
| Independent final review | `PASS — ENG-ONB-1H-P1-B-R1-FR USER-CONTROLLED RETRY AUTHORITY INDEPENDENTLY VERIFIED` |
| Publication | **performed** by `ENG-ONB-1H-P1-B-PUB` |
| Gate 10 | **PASS** — satisfied by that commit and ordinary fast-forward push |
| Mandatory gates | **9 of 9 PASS** (Gate 8 justified) |
| Phase status | **CLOSED WITH EVIDENCE** |
| Production | **unverified and unauthorized** |
| Next phase | `ENG-ONB-1H-P1-C` — **not started** |

The R1 retry-loop blocker was corrected: one explicit activation executes each frozen intent at most once; only governed terminal outcomes permit progression; retry requires a new explicit user gesture. The independent final review confirmed Gate 7 **168/168**, the correction runtime matrix **32/32**, focused **158** across 7 files, onboarding/security **1080/122**, and the serial suite **4004 passed / 2 failed (4006)** with only the two governed historical failures.

---

## 2. Contract authority

Published P1 contract commit `20472f073e101b442abd3fa37d67348b6c7105b0` is the sole authority. Earlier prompts, report summaries, and successor wording in P1-A evidence do not override it.

**Objective (§9.2).** Execute frozen invite intents through governed authority, render the Creating and partial-result experience, and provide controlled retry/reconciliation. Onboarding is not completed and product routes are not opened.

**Exact allowed source areas.** `src/features/onboarding/server/`; `src/features/onboarding/actions/`; `src/features/onboarding/domain/`; `src/features/onboarding/ui/` (new Creating surface); `src/app/onboarding/` (one new Creating route); `tests/onboarding/`.

**Prohibited changes observed as unchanged.** `supabase/**`; `src/types/database.generated.ts`; `src/app/globals.css`; `complete_organization_v2_onboarding` call sites in this slice; product-route / `enforce-product-onboarding.ts`; invitation-delivery, template, token, expiry, or acceptance code; `.env` / `.env.local`.

The published contract assigns `list_organization_onboarding_invitation_results` to P1-C. This slice does not call it. Recovery is exclusively `reconcile_organization_onboarding_invite_intent` (§9.2). Ready reconstruction, Enter ZyntixAI, and `complete_organization_v2_onboarding` remain P1-C. Product cutover remains P1-D.

---

## 3. P0 and P1-A prerequisite commits

| Prerequisite | Commit | Subject / document | Status |
| --- | --- | --- | --- |
| P1 contract | `20472f073e101b442abd3fa37d67348b6c7105b0` | V2 onboarding P1 contract | **CLOSED** |
| P0 runtime SQL | `33fcdf528cd23029de70cbcfcf83aba8bb042c6f` | completion-authority SQL publication | **CLOSED** |
| P0 evidence | `878a561ddf85b31ab5e8684a8ae34578dc6a566c` | `docs(onboarding): publish completion runtime evidence` | **CLOSED** |
| P1-A | `97956070bac6acc3d26140379752d4797b795ba4` | `feat(onboarding): integrate Setup Ready completion authority` | **CLOSED** (9/9 mandatory gates; Gate 10 via publication) |

P1-A evidence: `docs/phases/ENG-ONB-1H-P1-A-setup-ready-application-integration-evidence.md`.

The published P0 runtime evidence proves **database** authority. It is not claimed as P1-B application-layer proof.

---

## 4. Exact changed files

### Modified

| Path | Role |
| --- | --- |
| `src/features/onboarding/domain/onboarding-routes.ts` | `CREATING_ONBOARDING_PATH` / `buildCreatingOnboardingPath` |
| `src/features/onboarding/ui/team-foundation.tsx` | After durable Setup Ready, Owner is sent to Creating |
| `src/app/onboarding/page.tsx` | Owner `v2_ready` → Creating; non-Owner sees a status panel (no redirect loop) |
| `src/app/onboarding/team/page.tsx` | Owner `v2_ready` → Creating; non-Owner returns to `/onboarding` |
| `tests/onboarding/completion-run-integration.test.tsx` | Expects Creating handoff |
| `tests/onboarding/onboarding-routing.test.ts` | Owner-only Creating redirect assertion |
| `tests/onboarding/team-foundation-route.test.tsx` | `v2_ready` target + non-Owner exclusion |
| `tests/onboarding/team-foundation-component-concurrency.test.tsx` | Router `push` mock for Creating |
| `tests/onboarding/team-configuration-review.test.tsx` | Router mock |

### Added

| Path | Role |
| --- | --- |
| `src/features/onboarding/domain/onboarding-invite-execution.ts` | Result-code vocabulary, Zod parsers, messages, sequencing helpers |
| `src/features/onboarding/server/onboarding-invite-execution.ts` | `server-only` list / execute / reconcile / Creating snapshot |
| `src/features/onboarding/actions/onboarding-invite-execution-actions.ts` | Focused Server Actions (not an `onboarding-actions.ts` monolith) |
| `src/features/onboarding/ui/onboarding-creating.tsx` | Creating surface |
| `src/features/onboarding/ui/onboarding-creating.module.css` | Creating styles |
| `src/app/onboarding/creating/page.tsx` | Creating route |
| `tests/onboarding/governed-invitation-execution.test.tsx` | 54 focused P1-B tests (39 original + 15 R1 sequence-stop regressions) |
| `tests/onboarding/creating-route.test.tsx` | 11 Creating-route tests |
| `docs/phases/ENG-ONB-1H-P1-B-governed-invitation-execution-and-creating-state-evidence.md` | this document |

### Proven unchanged

| Path | Proof |
| --- | --- |
| `supabase/**` | `git diff --name-only -- supabase` empty |
| `src/types/database.generated.ts` | canonical-LF SHA-256 `68dc7981247fc4da05008c237ec74faa422b85b9996b752a166e32effd693f01` |
| `.env` | absent |
| `.env.local` | SHA-256 `b779ee19020dfed746ad09d3e9402b5d87115fade14fc288f9b19824495f1149`; not modified |
| `src/app/globals.css` | not in dirty set |
| `src/features/onboarding/server/enforce-product-onboarding.ts` | not in dirty set |
| `src/features/onboarding/actions/onboarding-actions.ts` | not in dirty set |

---

## 5. Domain and server architecture

P1-B reuses the P1-A shape: domain parsing and closed result types; `server-only` readers/executors; thin Server Actions; server-derived organization identity; thin client UI.

| Module | Responsibility |
| --- | --- |
| `domain/onboarding-invite-execution.ts` | Eleven `result_code` values, evidence kinds, strict `{ organizationId, intentId }` input, RPC mappers that **discard** `raw_token` / `invitation_id` / `idempotency_key` |
| `server/onboarding-invite-execution.ts` | Owner gate, re-derived org id, list / execute / reconcile, GET snapshot = list + per-intent reconcile |
| `actions/onboarding-invite-execution-actions.ts` | Strict parse then executor; `revalidatePath` of Creating only |
| `ui/onboarding-creating.tsx` | Honest Creating states; sequential execute; component-local single-flight |
| `app/onboarding/creating/page.tsx` | Owner + `v2_ready` only |

Client execute input is only `{ organizationId, intentId }`. Extra `result_code`, `evidence_kind`, `invitation_id`, or `idempotency_key` fail Zod `.strict()`.

Mapped outcome keys: `intentId`, `emailNormalized`, `targetRole`, `resultCode`, `evidenceKind`, `runStatus`. Never `rawToken`.

---

## 6. Exact RPC authority

| RPC | Contract | Used by P1-B |
| --- | --- | --- |
| `list_organization_onboarding_frozen_team_invite_intents` | §7.3 element 3 / §9.2 Creating listing | **yes** |
| `execute_organization_onboarding_invite_intent` | §9.2 execution | **yes** |
| `reconcile_organization_onboarding_invite_intent` | §9.2 “Recovery is exclusively via” | **yes** |
| `ensure_organization_onboarding_completion_run` | P1-A; execute/reconcile already call it internally; zero-intent snapshot reuses the P1-A reader | **reuse only** |
| `list_organization_onboarding_invitation_results` | P1-C | **no** |
| `complete_organization_v2_onboarding` | P1-C | **no** |
| `mark_organization_onboarding_setup_ready` | P1-A | **no new call site** |

Generated signatures in `src/types/database.generated.ts` were used as-is. Types were not regenerated.

Local egress guard recorded application RPCs, all to `127.0.0.1`:

| Path | Count |
| --- | --- |
| `list_organization_onboarding_frozen_team_invite_intents` | 76 |
| `reconcile_organization_onboarding_invite_intent` | 232 |
| `execute_organization_onboarding_invite_intent` | 26 |
| `list_organization_onboarding_invitation_results` | **0** |
| `complete_organization_v2_onboarding` | **0** |

---

## 7. Authentication and organization isolation

- Unauthenticated Creating visitors are fail-closed. `/onboarding/creating` is intentionally **not** added to `safe-return-path` / `isProtectedApplicationPath`. The page sends unauthenticated callers to `/login?next=/onboarding?org=…`. After login, `/onboarding` Owner `v2_ready` continues to Creating.
- Non-Owner members cannot load the Creating snapshot. Creating redirects them to `/onboarding`; `/onboarding` renders a status panel instead of bouncing back to Creating.
- Outsiders cannot observe another organization's frozen emails or execute.
- A foreign organization id cannot cross server-side membership resolution.
- A foreign intent id is refused with `INTENT_NOT_FOUND`.
- Actor and organization identity are re-derived server-side from the session. Client-supplied organization/intent values are never treated as authoritative.
- Failure responses use the closed application vocabulary; they do not return SQLSTATE, schema names, or RPC internals.
- P1-B modules use `createSupabaseServerClient` only. No service-role client. No direct writes to intent, invitation-result, or invitation tables.

Runtime matrix checks 1–8, 16–17: **17/17 PASS**.

---

## 8. Frozen-intent authority

Creating lists the frozen Team snapshot through `list_organization_onboarding_frozen_team_invite_intents`. Intents are ordered by the database (`created_at`, `id`). The UI does not invent a parallel lifecycle enum. Email and role are displayed from the frozen row, not from client-edited fields.

On page load, each listed intent is reconciled (GET-with-reconcile). That is contracted recovery, not a batch create. Membership collisions and already-member evidence can therefore appear before the Owner presses Create invitations; that is honest state, not fabricated progress.

---

## 9. Execution ordering

`nextExecutableIntentId` walks the frozen snapshot in database list order and skips only **proven terminal** codes (`success`, `invite_already_pending`, `already_member`, `existing_membership_requires_admin_action`, `invalid_input`). It does **not** skip `forbidden`.

`runInvitationExecutionSequence` is bounded by the frozen intent array plus a per-activation `attemptedThisActivation` set. For one explicit Start/Retry activation:

1. each eligible intent is executed at most once;
2. a proven-terminal outcome may advance to the next frozen intent;
3. `ok: false` stops immediately;
4. an `ok: true` material/retryable outcome stops immediately;
5. busy state is released in `finally`;
6. Retry/Refresh become reachable;
7. executing that intent again requires a new user gesture.

R1 corrected a defect in which retryable `ok: true` results (`rate_limited` and the rest of the material-stop set) were written into the outcome map and then automatically re-selected by `nextExecutableIntentId`, producing an unbounded execute loop until unmount. The previous claim that the application added “no automatic retries” was therefore false for that sequence. Distributed idempotency remains database-owned.

### Canonical result classification

| Class | Codes | Sequence effect |
| --- | --- | --- |
| Proven terminal (skip / safe to advance) | `success`, `invite_already_pending`, `already_member`, `existing_membership_requires_admin_action`, `invalid_input` | Continue to the next frozen intent |
| Material/retryable stop | `invitation_proof_lost`, `forbidden`, `rate_limited`, `unexpected`, `transport_error` | Stop this activation; Owner Retry/Refresh required |
| Eligible initial | missing / `not_attempted` | Execute once during this activation |

SQL `private.advance_organization_onboarding_completion_run` counts `forbidden`, `rate_limited`, `unexpected`, and `transport_error` as non-terminal/retryable for run status (`invite_partial`). Contract invariant 8 plus §9.2 treat `invitation_proof_lost` as non-terminal and retryable. `forbidden` is **not** a proven terminal result: the application must not skip it, must stop the automatic sequence, and must require a new Owner gesture before another execute.

Runtime three-intent organizations reached `already_member`, `existing_membership_requires_admin_action`, and `success` (after J7 retry). Concurrent double-execute of one unused intent produced **one** `attempt_count` increment and **one** invitation.

---

## 10. Idempotency and concurrency boundary

| Mechanism | What it is | What it is not |
| --- | --- | --- |
| Component `mutationOwnerRef` | Prevents rapid double-clicks in one mounted instance | Distributed idempotency |
| Database advisory lock namespace `872004` | Serializes execute/reconcile per organization | Application lock |
| RPC `on conflict` / existing-result reuse | Cross-tab, refresh, repeated execute | Client-side queue |

No application advisory locks, polling loops, delay-based retries, exponential backoff, or queues were added. After R1, one explicit activation cannot automatically re-execute the same retryable intent. After the runtime matrix, advisory locks in namespace `872004`: **0**.

---

## 11. Creating-state UX

Owned surface states: execution not started; in progress; partial; safely retryable failure; non-retryable / Owner-action-required; P1-B work finished awaiting P1-C.

Copy uses database vocabulary. Success is **“An invitation was created”**, never delivered/sent. Awaiting P1-C: **“Invitation setup is finished for now. The next setup step is not available yet.”** `currentStep` remains `"team"` (not `"ready"`).

The existing onboarding shell still labels a later step “Ready”. That is preserved navigation terminology, not a P1-C Ready/cutover surface. No Enter ZyntixAI, Setup complete, Workspace complete, product destination, or fabricated percentage appears on Creating.

---

## 12. Accessibility

Creating provides a semantic `h1` / `h2`, real `Button` controls, keyboard access through those buttons, disabled/busy state during mutation, `role="status"` + `aria-live="polite"` for progress, `role="alert"` for actionable errors, distinct text labels (not color-only), focus return to the start control after a sequence, and no animation that hides execution state.

---

## 13. Partial and failure behavior

Mixed outcomes are stated per intent. Collision is labeled “Needs owner review” with the database message that an owner must review an existing membership. `invitation_proof_lost` is non-terminal and retryable. `forbidden` is a material stop with the safe message “You no longer have permission to invite this teammate.” Transport / invalid-response failures use the closed action messages. Stale invitation evidence is not displayed as current once reconcile returns `historical_invitation`. After a material stop the surface leaves `in_progress`, keeps real completed outcomes, and exposes Retry/Refresh.

Runtime: a dedicated three-intent correction org with an exhausted create window produced `rate_limited` once, cleared busy state, and required an explicit Retry for a second execute. A mixed org preserved an earlier `success` and did not execute the later intent. A seeded `forbidden` first intent was not skipped; later intents stayed at `attempt_count = 0`. Reconcile after rate-limited execute did not add invitation rows.

Committed SQL advances an all-terminal mixed run to `ready_for_cutover`. P1-B does not present that as product Ready or Enter ZyntixAI. The UI maps it to the awaiting-next-step copy owned by this slice.

---

## 14. Token and delivery boundaries

`execute_organization_onboarding_invite_intent` may create an invitation via `create_organization_invitation` and may include `raw_token` in the RPC payload. The application mapper discards the token. No plaintext token is returned to the browser, persisted by application code, or reconstructed from a hash.

Local runtime: `deliveries = 0` on fixture orgs during Gate 7 cells; no email-delivery claim is made. Rate-limit rows that appear are the governed create-window side effect of invitation **creation**, not a P1-B-owned mailer. Duplicate execute does not create a second invitation. Reconcile does not add invitation rows.

---

## 15. P1-C / P1-D exclusions

| Capability | Owner | P1-B status |
| --- | --- | --- |
| `list_organization_onboarding_invitation_results` | P1-C | not called |
| Ready reconstruction / Enter ZyntixAI | P1-C | not rendered |
| `complete_organization_v2_onboarding` | P1-C | no call site in this slice |
| `enforce-product-onboarding.ts` / product destination cutover | P1-D | unchanged |
| Invitation email templates, token hashing, expiry, acceptance | out of slice | unchanged |

---

## 16. Registration / provisioning non-interference

`/register` still responds. The registration page does not gain a Creating execute CTA. Authentication allowlists were not widened to include `/onboarding/creating`. Middleware, admission, billing, and social publishing routes were not modified.

Runtime matrix checks 14–15: **PASS**.

---

## 17. Focused test evidence

`npx vitest run tests/onboarding/governed-invitation-execution.test.tsx tests/onboarding/creating-route.test.tsx` plus P1-A/route regressions:

| File | Tests |
| --- | --- |
| `governed-invitation-execution.test.tsx` | 54 |
| `creating-route.test.tsx` | 11 |
| `completion-run-integration.test.tsx` | 44 |
| `team-foundation-route.test.tsx` | 15 |
| `onboarding-routing.test.ts` | 7 |
| `team-foundation-component-concurrency.test.tsx` | 15 |
| `team-configuration-review.test.tsx` | 12 |
| **Focused P1-B/P1-A set** | **158 passed** |
| **Final focused correction rerun** | **65 passed** (`governed-invitation-execution` 54 + `creating-route` 11) |

Named behaviors covered: every `result_code` message; action signatures reject outcome fields; reconcile never calls an invitation-creating RPC; double submission of one intent produces one execute; `invitation_proof_lost` is retryable; foreign intent refused; Owner-only Creating; no Ready/cutover CTA; no P1-C listing RPC. R1 added mutation-sensitive proofs that retryable `ok: true` stops after one execute, `forbidden` is not a terminal skip, busy state clears, explicit Retry executes at most once, and earlier success is preserved.

These are static and component tests. They do not claim browser or database runtime by themselves.

---

## 18. Onboarding / security evidence

| Command | Result |
| --- | --- |
| Completion-authority security tests | **72 passed** |
| Invitation security / RPC tests | **67 passed** |
| Onboarding lifecycle / authorization tests | **30 passed** |
| `npx vitest run tests/onboarding tests/security` | **1080 passed / 122 files** |

Independent review of the pre-R1 suite observed **1065**, not the previously recorded 1064. R1 adds 15 sequence-stop tests: `1065 + 15 = 1080`.

---

## 19. Full-suite result

`npx vitest run --no-file-parallelism`

| Metric | Value |
| --- | --- |
| Test files | 2 failed / 523 passed (525) |
| Tests | **2 failed / 4004 passed (4006)** |
| Duration | 191.14 s |

Independent review of the pre-R1 suite observed **3989/3991**, not the previously recorded 3988/3990. R1 adds 15 tests: `3989 + 15 = 4004` passing, `3991 + 15 = 4006` total. P1-A baseline was 3938/3940.

---

## 20. Typecheck, lint and build

| Command | When | Result |
| --- | --- | --- |
| `npm run typecheck` | after R1 correction | **pass** |
| `npm run lint` | after R1 correction | **pass** (0 warnings/errors) |
| `npm run build` | after R1 correction, before Gate 7 rerun | **pass**; route `ƒ /onboarding/creating` present (Next.js 15.5.20) |

---

## 21. Gate 7 journey matrix

Executed through Chromium against `http://127.0.0.1:3457` **after the R1 production-byte correction**. Previous Gate 7 cells are not reused as final-byte authority.

Contract §9.2 requires journeys `J3`–`J7` on desktop, tablet, and mobile for all four operating models. Viewports `J13`–`J15` are applied to that set: **12 cells**, **14 checks per cell**.

`CELLS = 12`  `CHECKS PER CELL = 14`  `GATE 7 CHECKS = 168`  `FAILED = 0`

| Operating model | Pack | `J13` desktop | `J14` tablet | `J15` mobile |
| --- | --- | --- | --- | --- |
| TG1 `course_seller` | `niche.online-course-business` | 14/14 | 14/14 | 14/14 |
| TG2 `service` | `foundation.service` | 14/14 | 14/14 | 14/14 |
| TG3 `field_operations` | `foundation.field-operations` | 14/14 | 14/14 | 14/14 |
| TG4 `product_operations` | `foundation.product-operations` | 14/14 | 14/14 | 14/14 |

### Checks in every cell

| # | Check | Result |
| --- | --- | --- |
| 1 | `J3` entry from completed P1-A Setup Ready (`/onboarding` → `/onboarding/creating`) | PASS |
| 2 | `J3` Creating heading | PASS |
| 3 | `J3` frozen snapshot emails | PASS |
| 4 | `J3` remaining success intent not started | PASS |
| 5 | no Ready/cutover/delivery claim before execute | PASS |
| 6 | `J3` start control visible | PASS |
| 7 | `J3` duplicate-click disabled or replaced | PASS |
| 8 | `J3`/`J5` mixed outcomes stated | PASS |
| 9 | `J6` collision actionable | PASS |
| 10 | no Enter ZyntixAI / delivery claim after execute | PASS |
| 11 | `J4` refresh preserves mixed results (invitation count unchanged) | PASS |
| 12 | `J7` expire + reload → `invitation_proof_lost` / no extra invitation | PASS |
| 13 | `J7` retry creates one new invitation | PASS |
| 14 | viewport class applied | PASS |

Browser request hosts: `["127.0.0.1"]`.

---

## 22. Local application-runtime evidence

`MATRIX CHECKS = 32`  `FAILED = 0` (17 original runtime checks + 15 R1 correction checks)

| # | Check | Result |
| --- | --- | --- |
| 1 | unauthenticated Creating fails closed | PASS |
| 2 | non-Owner cannot execute Creating | PASS |
| 3 | outsider cannot observe foreign Creating | PASS |
| 4 | foreign organization id cannot cross membership | PASS |
| 5 | unauthenticated RPC fail-closed | PASS |
| 6 | non-Owner execute refused | PASS |
| 7 | foreign organization execute refused | PASS |
| 8 | foreign intent execute refused | PASS |
| 9 | concurrent execute yields one attempt / one invitation | PASS |
| 10 | concurrent execute both `ok` | PASS |
| 11 | three-intent mixed codes present | PASS |
| 12 | `invite_partial` from rate-limited execute | PASS |
| 13 | reconcile does not add invitations | PASS |
| 14 | registration route still responds | PASS |
| 15 | registration not widened by P1-B | PASS |
| 16 | no retained advisory lock `872004` | PASS |
| 17 | browser hosts loopback | PASS |
| 18 | `rate_limited` executes once and stops | PASS (`1/0,0`) |
| 19 | `rate_limited` does not auto-execute a second time | PASS (attempt stayed 1) |
| 20 | busy state clears after `rate_limited` | PASS |
| 21 | Retry reachable after `rate_limited` | PASS |
| 22 | no Ready/Enter ZyntixAI/raw token after `rate_limited` | PASS |
| 23 | deliberate Retry executes at most once | PASS (`2/0,0`) |
| 24 | Refresh/reconcile creates no invitation | PASS (count 0) |
| 25 | earlier successful intent survives later retryable stop | PASS (`success/rate_limited/not_attempted`) |
| 26 | later intent is not executed after the stop | PASS (`attempt_count = 0`) |
| 27 | visible partial state retains earlier success | PASS |
| 28 | `forbidden` is visible and not treated as Ready | PASS |
| 29 | `forbidden` is not skipped as terminal | PASS (`2/0/0`) |
| 30 | `forbidden` recovery remains non-leaking | PASS |
| 31 | no P1-C result-listing RPC is called | PASS (0 hits) |
| 32 | no P1-C completion RPC is called | PASS (0 hits) |

Harness artifacts (local TEMP only, not committed): `C:\Users\guusv\AppData\Local\Temp\p1b-r1-corr\runtime\` (`gate7-results.json`, `matrix-results.json`, `baseline.json`, `restored.json`, `fixtures.json`, `runtime-request-hosts.jsonl`, `report.json`).

---

## 23. Fixture cleanup and baseline restoration

Synthetic `example.test` identities only. Exact fixture UUIDs. No broad delete predicate. `organization_context_assignment_events` cleanup used `SET LOCAL session_replication_role = 'replica'` inside the cleanup transaction.

After commit of cleanup:

- trigger `organization_context_assignment_events_guard_immutable` remains enabled (`tgenabled = O`);
- `session_replication_role` in a fresh session is `origin`.

| Closure | Result |
| --- | --- |
| Fixture residue (users, P1B orgs, runs, invitations, results) | **0** |
| Baseline table fingerprints restored | **YES** (byte-identical `baseline.json` / `restored.json`) |
| Advisory locks | **0** |
| Idle-in-transaction | **0** |
| Invitation-token column in public onboarding tables | **0** (GoTrue `auth.refresh_tokens.token` remains baseline-only) |

Plaintext-token marker: the schema still has GoTrue `auth.refresh_tokens.token` for the pre-existing baseline user `zyntix-team-owner-qa@example.test`. No invitation plaintext token column exists.

`FIXTURE RESIDUE = ZERO`  `BASELINE RESTORED = YES`

---

## 24. Process shutdown

| Property | Value |
| --- | --- |
| Preferred port | `3457` |
| Port free before launch | **YES** |
| Launch | `next dev -p 3457 -H 127.0.0.1` with process-scoped local URL/anon key only; **no** `SUPABASE_SERVICE_ROLE_KEY` in the application process |
| First SIGTERM | Next child stdio kept the harness process alive; `portFreeAfter` recorded TIME_WAIT rather than LISTEN |
| Verification pass | `taskkill /T /F` on leftover harness/node tree (`17068`, `15772`, `16124`) |
| Port `3457` after verification pass | **LISTEN FREE** |
| Surviving `next dev` for this port | **0** |

`PORT 3457 FREE = YES` (after the recorded verification pass)

Egress hosts: `127.0.0.1`, `telemetry.nextjs.org`, `registry.npmjs.org`. Remote Supabase hosts: **0**. Browser hosts: `["127.0.0.1"]`.

---

## 25. Static, runtime and Production distinction

| Claim class | What it proves here | What it does not prove |
| --- | --- | --- |
| **Static** | parsers, RPC names, Owner gate, single-flight, forbidden RPC absence in this slice | real browser / real database agreement |
| **Runtime, local** | Chromium + local PostgreSQL 17.6 with all 128 migrations behave as contracted | Production data, config, scale, or IdP |
| **Production** | **nothing — not attempted** | relocated to `ENG-ONB-1H-PROD` and `ENG-ONB-1H-FV` |

Component single-flight is local double-submission protection. Distributed idempotency remains database authority.

---

## 26. `B1-GATE.1` Gate 1–10 table

Dispositions from contract §14.2 column `P1-B`. `Y` = mandatory PASS. `J` = `NOT_REQUIRED_WITH_JUSTIFICATION`.

| Gate | Contract | Result | Evidence |
| --- | --- | --- | --- |
| 1 Baseline | Y | **PASS** | §3 P1-A closed at `97956070`; publication parent is that same commit |
| 2 Scope freeze | Y | **PASS** | §4 allowed paths only; §15 successor exclusions |
| 3 Implementation completeness | Y | **PASS** | §5–§13 Creating route, frozen list, execute, reconcile, honest UX |
| 4 Automated tests | Y | **PASS** | §17 named behaviors; §18 onboarding/security; §19 full-suite parity |
| 5 Static quality | Y | **PASS** | §20 typecheck/lint/build; `git diff --check` clean; untracked whitespace clean |
| 6 Security / tenant isolation | Y | **PASS** | §7 and runtime matrix 1–8, 16 |
| 7 Browser / visual | Y | **PASS** | §21 168/168 |
| 8 Production verification | J | `NOT_REQUIRED_WITH_JUSTIFICATION` | No Production deployment. No linked/remote Supabase. Local Docker only. §14.2 relocates Production to `PROD`/`FV`. |
| 9 Documentation / evidence | Y | **PASS** | this document, published by `ENG-ONB-1H-P1-B-PUB` |
| 10 Publication / closure | Y | **PASS** | `ENG-ONB-1H-P1-B-PUB` commit subject `feat(onboarding): add governed invitation execution`; parent `97956070bac6acc3d26140379752d4797b795ba4`; ordinary fast-forward of the 18 §4 paths |

`MANDATORY GATES PASSED THIS PHASE = 9 of 9`
`GATES JUSTIFIED = 1 (gate 8)`

---

## 27. Residual risks and deferred work

| # | Item | Disposition |
| --- | --- | --- |
| 1 | Gate 10 / phase closure | **Closed** by `ENG-ONB-1H-P1-B-PUB` (this document plus the 17 implementation/test paths) |
| 2 | Ready / Enter ZyntixAI / `complete_organization_v2_onboarding` | **By contract P1-C** |
| 3 | Product-route cutover | **By contract P1-D** |
| 4 | `list_organization_onboarding_invitation_results` | **By contract P1-C** |
| 5 | Two historical Vitest failures | **Pre-existing**, not fixed |
| 6 | Next.js telemetry / npm registry lookups during `next dev` | **Not Supabase**; recorded in the egress log (`telemetry.nextjs.org`, `registry.npmjs.org`); zero remote Supabase hosts |
| 7 | Harness sources live in TEMP | **Same as P1-A**; R1 harness is `C:\Users\guusv\AppData\Local\Temp\p1b-r1-corr\` |
| 8 | Shell progress step still named “Ready” | **Preserved existing terminology**; not a P1-C Ready surface |

---

## 28. Exact repository state

Publication authority for Gate 10 (this commit cannot contain its own hash in advance):

| Field | Value |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Publication parent | `97956070bac6acc3d26140379752d4797b795ba4` |
| Required subject | `feat(onboarding): add governed invitation execution` |
| Paths in the publication commit | exactly the 18 §4 paths, including this document |
| Upstream | `origin/core/platform-readiness-20260707` |
| Push | ordinary fast-forward; no force |

`GATE 10 = PASS`

---

## 29. Recommended next phase

`ENG-ONB-1H-P1-C` — Ready reconstruction and explicit completion. **Not started.**

Production remains unverified and unauthorized. Do not begin `ENG-ONB-1H-P1-D`, `ENG-ONB-1H-PROD`, or `ENG-ONB-1H-FV`.

`ENG-ONB-1H-P1-C WORK PERFORMED HERE = NONE`

`ENG-ONB-1H-P1-C STARTED = NO`

---

## Appendix A — local target proof

| Property | Value |
| --- | --- |
| Database container | `d81506dfc04a` `supabase_db_project_ai_cursus_verkopers` |
| Image | `public.ecr.aws/supabase/postgres:17.6.1.141` |
| PostgreSQL | `17.6` |
| DB port | `54442` → `5432` |
| Kong | `0cae9f996c3b` `supabase_kong_project_ai_cursus_verkopers` `54441` → `8000` |
| Migration files | 128 |
| Ledger rows | 128 |
| Pending migrations | **0** |
| P1 authorities present | `list_organization_onboarding_frozen_team_invite_intents`, `execute_organization_onboarding_invite_intent`, `reconcile_organization_onboarding_invite_intent`, `ensure_organization_onboarding_completion_run`, `mark_organization_onboarding_setup_ready` |
| Remote Supabase hosts contacted | **0** |
| Application Supabase env | injected `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54441` + local anon JWT only; repository `.env.local` still points at `dmctinrcjvsgmoxwwodw.supabase.co` and was **not** modified |

`.env.local` without injection resolves a **remote** host. Process-scoped injection plus the egress guard are what kept the run local. The guard never wrote a block file.

---

## Appendix B — final canonical-LF hashes (implementation set)

| Path | canonical-LF SHA-256 |
| --- | --- |
| `src/app/onboarding/page.tsx` | `07032ea1fa62ae0c6a86c0b61fc0eaada3756aed0f5278b6a4c2d811ad1f2898` |
| `src/app/onboarding/team/page.tsx` | `8db4db02d8014c6523e794d6095c9b81fce150c313b427885efc96a61f1cbf42` |
| `src/app/onboarding/creating/page.tsx` | `0f96843e0dc1f880e6e4c81b8557e87ad6d26145acf0accf31b80ee0c23ddb00` |
| `src/features/onboarding/domain/onboarding-routes.ts` | `5ead4764cb0b0dd1cb2188af80659e66ad7f546382251c96980a18f5824c312d` |
| `src/features/onboarding/domain/onboarding-invite-execution.ts` | `c5a537aafebb42ebf37685d8485f1a7b4733c22899be332def342fd9ab7ff0c9` |
| `src/features/onboarding/server/onboarding-invite-execution.ts` | `2d4d01393b3c04607eb270e82a5a9ba8ef247314beff7a9cb7bdd29ef1761177` |
| `src/features/onboarding/actions/onboarding-invite-execution-actions.ts` | `c77d35840178dae56b3a6b83a55f17c2135164d5325909a97741bc181c0e8a4f` |
| `src/features/onboarding/ui/onboarding-creating.tsx` | `2ed491fa65b4d369f3ea14661788fb3da6e2ebfe5acc1270ed55c4f3b593841b` |
| `src/features/onboarding/ui/onboarding-creating.module.css` | `95baa1e3497a454abfaebf0c07be102487d07f729d81fb1a523dea9ece1d61d6` |
| `src/features/onboarding/ui/team-foundation.tsx` | `b98e3fce2d72fc3412752c6c9e9e3980579885ecd1b1bc43c80497090f2babf7` |
| `tests/onboarding/governed-invitation-execution.test.tsx` | `7867e564dc67c675a32523d1259033d07449957dac4bc9b06a3faf43cf9c4b2c` |
| `tests/onboarding/creating-route.test.tsx` | `58b78af7371c20245e3b78e232ee7d88e7a1e599753c31ec127442023c2643f5` |
| `src/types/database.generated.ts` | `68dc7981247fc4da05008c237ec74faa422b85b9996b752a166e32effd693f01` |
