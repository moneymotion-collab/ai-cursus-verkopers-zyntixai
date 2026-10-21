# ENG-ONB-1H-P1-A - Setup Ready Application Integration Evidence

## Executive verdict

`PASS - ENG-ONB-1H-P1-A CLOSED WITH EVIDENCE AND PUBLISHED (R1 TYPE AUTHORITY, GATE 7 RUNTIME EVIDENCE, PHASE DOCUMENT AND PUBLICATION)`

The `ENG-ONB-1H-P1-A` application slice wires the durable Setup Ready
transition to the governed completion-run authority and presents the minimum
honest Setup Ready status. Nothing else is implemented.

- **Static evidence.** 44 focused behavioral Vitest-expanded test cases in
  `tests/onboarding/completion-run-integration.test.tsx`; `tests/onboarding`
  plus `tests/security` at 1,014 passing; serial full Vitest at 3,938 passing
  with exactly the two accepted `BETA1-4TG-MASTER-FV` baseline failures and no
  third; `npm run typecheck`, `npm run lint` and `npm run build` all clean.
- **Runtime evidence.** Re-executed locally against the real application and a
  real browser: **205 Gate 7 checks** across 4 operating models x 3 viewports
  with **0 failures**, a **32-check application-runtime matrix** with **0
  failures**, and a **10-check database-authority closeout** with **0
  failures**.
- **Isolation.** Zero Supabase requests reached a remote host (3,503
  Supabase-classified requests, all to `127.0.0.1`). No repository environment
  file was modified and no key value was printed or persisted.
- **Closure.** Zero fixture residue, zero invitation/delivery/event/rate-limit
  side effects, zero retained advisory locks, zero open transactions, baseline
  table fingerprints restored byte-for-byte, port `3457` free and no surviving
  application or harness process.

`GATE 7 = PASS (205/205)`

`APPLICATION RUNTIME MATRIX = PASS (32/32)`

`DATABASE AUTHORITY CLOSEOUT = PASS (10/10)`

`GATE 10 PUBLICATION = PASS (satisfied by the commit and push that contain this document)`

`MANDATORY GATES PASSED = 9 of 9`

`ENG-ONB-1H-P1-A = CLOSED WITH EVIDENCE`

`PRODUCTION = UNVERIFIED AND DEFERRED (ENG-ONB-1H-PROD, ENG-ONB-1H-FV)`

`NEXT PHASE = ENG-ONB-1H-P1-B (NOT STARTED)`

---

## 1. Phase identifier and verdict

| Property | Value |
| --- | --- |
| Phase | `ENG-ONB-1H-P1-A` |
| Revision | `ENG-ONB-1H-P1-A-R1` (type correction, runtime evidence recovery, phase authority) |
| Slice name | Completion Run Integration |
| Governing contract | `ENG-ONB-1H-P1-CONTRACT` §9.1 |
| Verdict | `PASS - ENG-ONB-1H-P1-A CLOSED WITH EVIDENCE AND PUBLISHED (R1 TYPE AUTHORITY, GATE 7 RUNTIME EVIDENCE, PHASE DOCUMENT AND PUBLICATION)` |
| Gates 1-7, 9 | **PASS** |
| Gate 8 | `NOT_REQUIRED_WITH_JUSTIFICATION` (§14.2) |
| Gate 10 | **PASS** - satisfied by `ENG-ONB-1H-P1-A-PUB`, the commit and push containing this document |
| Mandatory gates | **9 of 9 PASS** (§25) |
| Publication phase | `ENG-ONB-1H-P1-A-PUB` - staged, committed and pushed exactly the nine §27 paths, including this document; documentation wording only, no implementation or test change |
| Phase status | **CLOSED WITH EVIDENCE** |
| Production | **unverified and deferred** to `ENG-ONB-1H-PROD` and `ENG-ONB-1H-FV` (§24, §25 gate 8) |
| Next phase | `ENG-ONB-1H-P1-B` - **not started** (§28) |

This revision closed three deterministic TypeScript diagnostics, replaced two
weak assertions identified by independent review with behavioral evidence on
the real review surface, and re-executed the local runtime matrix because the
recovered predecessor evidence was incomplete (§21.1).

---

## 2. Published contract authority

| Property | Value |
| --- | --- |
| Contract document | `docs/phases/ENG-ONB-1H-P1-CONTRACT-v2-onboarding-application-integration-and-completion.md` |
| Slice section | §9.1 `ENG-ONB-1H-P1-A` - Completion Run Integration |
| Security invariants claimed | §8 invariants 1, 2, 3, 6, 12, 13, 16, 17 |
| Gate 7 obligation | §9.1 *Browser requirements*: journeys `J1`, `J2`, `J13`-`J15` of §13.1, on desktop, tablet and mobile, for all four operating models |
| Gate matrix | §14.2 column `P1-A` |
| Prerequisite rule | §10.4 - `ENG-ONB-1H-P0-RV-EVIDENCE` must be closed before P1-A closure |
| Baseline-failure parity rule | §14.2 *Regression protection*, referencing `BETA1-4TG-MASTER-FV` |

The contract freezes P1-A to the durable Setup Ready transition, the
server-controlled invocation of
`ensure_organization_onboarding_completion_run`, the minimum honest Setup Ready
status presentation, and coverage for that path. Every exclusion recorded in
§16 of this document is a contract exclusion, not a local choice.

---

## 3. Published prerequisite commits

| Prerequisite | Commit | Subject / artifact | Status |
| --- | --- | --- | --- |
| `ENG-ONB-1H-P0-RV-EVIDENCE` publication | `878a561ddf85b31ab5e8684a8ae34578dc6a566c` | `docs(onboarding): publish completion runtime evidence` | **CLOSED** |
| Runtime verification artifact | `33fcdf528cd23029de70cbcfcf83aba8bb042c6f` | `tests/security/onboarding-completion-authority-live-verification.sql` | **PUBLISHED** |
| `ENG-ONB-1H-C` and `ENG-ONB-1H-P0-A` | `22721fad` | recorded in contract §9.1 *Prerequisites* | **COMMITTED** |

The prerequisite evidence document
`docs/phases/ENG-ONB-1H-P0-RV-EVIDENCE-onboarding-completion-authority-runtime-verification-evidence.md`
is clean in the working tree at canonical-LF SHA-256
`020bf3eccf279291beaf840205848d6e2229f73792b5e7cbbbecaccdb2d2bcfb`.

`P0-RV-EVIDENCE CLOSED = YES`

`§10.4 P1-A CLOSURE PREREQUISITE = SATISFIED`

**Scope note.** The P0 evidence proves the *database* authority at runtime. It
does not prove the *application* layer. The application-layer proof is
§20-§23 of this document and was obtained independently.

---

## 4. Exact implementation paths

Five paths, all published by the `ENG-ONB-1H-P1-A-PUB` commit that contains this
document:

| # | Path | Change | Canonical-LF SHA-256 |
| --- | --- | --- | --- |
| 1 | `src/features/onboarding/domain/onboarding-completion-run.ts` | new (added) | `6e26985dabe96c6f83f23d20f702d899326bd5bae6138b7aba44fcea83b09196` |
| 2 | `src/features/onboarding/server/onboarding-completion-run.ts` | new (added) | `304ad7dd1b37f8080d3d1b802de2f2171cdc29b14ca1ea0c609c3147259a4863` |
| 3 | `src/features/onboarding/actions/onboarding-actions.ts` | modified | `d10e7018fdcceec91fb89f3b5f0cc13530ec29694ff150e70fb7210703037da5` |
| 4 | `src/features/onboarding/ui/team-foundation.tsx` | modified | `820c26c3f3c420480081cff075d3c7f1f59ffa6ee912841c250f2f70e3420aec` |
| 5 | `src/features/onboarding/ui/team-foundation.module.css` | modified | `6a47fedf3ceed55b6676412b5d9183ca4efd197cc8654e61d4e81a1eb2f0ef2a` |

All five fall inside the §9.1 *Exact allowed source areas*
(`src/features/onboarding/domain/`, `src/features/onboarding/server/`,
`src/features/onboarding/actions/onboarding-actions.ts`,
`src/features/onboarding/ui/`).

No new route was added. `src/app/globals.css`, `V2YouCompanyForm` and
`OperatingModelSelector` are untouched, as §9.1 *Prohibited changes* and §13.3
require.

**This revision changed none of these five files.** The five hashes above are
identical to the values recorded before the revision began and were recomputed
after every test edit and after runtime verification (§32 of the phase report).

---

## 5. Exact test paths

| Path | Change | Tests | Canonical-LF SHA-256 |
| --- | --- | --- | --- |
| `tests/onboarding/completion-run-integration.test.tsx` | new (added) | 44 Vitest-expanded cases (36 single-case declarations + 8 parameterized boundary cases) | `23dc9497a9b2c3488a8d8ce69536f6dd45aa19bb143394a2ad1903e2ff545f09` |
| `tests/onboarding/team-configuration-review.test.tsx` | modified | - | `dd5573d25cbf14b65e5f963b9f4dd86c192bb812e28af4d2c8a017f4419e3600` |
| `tests/onboarding/team-foundation-route.test.tsx` | modified | - | `ff81797da475a8bb285e507e9f10043ce31b72004ca210dfc45c92bcd1c5e931` |

`tests/onboarding/completion-run-integration.test.tsx` is the only file this
revision modified. The other two retain their pre-revision hashes exactly.

Named test groups in the focused file. Two different quantities are reported
separately rather than mixed: *source-level declarations* are the `it` and
`it.each` statements written in the file, and *Vitest-expanded cases* are the
individual cases Vitest actually executes and reports. They differ only in the
boundary group, whose single `it.each` declaration is parameterized over eight
prohibited successor-phase call sites.

| Group | Source-level declarations | Vitest-expanded cases | Covers |
| --- | --- | --- | --- |
| `governed completion-run reader` | 11 | 11 | RPC argument shape, server-derived identity, Owner gate, foreign-org refusal, error mapping, payload validation |
| `ensure completion run server action` | 3 | 3 | input validation before client construction, extra-field rejection, governed resolution |
| `Setup Ready transition ordering` | 4 | 4 | mark-then-ensure ordering, refusal short-circuit, recoverable ensure failure, replay yielding one run |
| `Team review Setup Ready affordance` | 4 | 4 | honest copy, accessible announcement, no raw run value, semantic tokens |
| `real P1-A review surface` | 4 | 4 | review-branch reachability, exclusion detector sensitivity, single-flight, ensure-failure recovery |
| `P1-A boundary is not widened into later slices` | 7 (6 single-case + 1 parameterized) | 14 (6 + 8 parameterized cases) | completion action, product cutover, lifecycle columns, client-supplied values, locking/queue, service-role client, plus the eight parameterized *introduces no ... call site* cases |
| `V1 and NULL-version compatibility` | 4 | 4 | identical governed call across V2/V1/NULL, no ensure on refusal, no version branching, legacy surface untouched |
| **Total** | **37 declarations - 36 single-case plus 1 parameterized** | **44** | |

`SOURCE-LEVEL SINGLE-CASE TEST DECLARATIONS = 36`

`PARAMETERIZED BOUNDARY DECLARATION = 1, EXPANDING TO 8 CASES`

`VITEST-EXPANDED PASSING CASES = 44 (36 + 8)`

The executed total reported by Vitest in §18 is unchanged: 44 passing cases.
The 36/44 difference is `it.each` expansion, not a discrepancy in results.

---

## 6. Server-action and RPC flow

One deliberate user action produces exactly two governed server actions, in a
fixed order:

```
Team review surface
  -> markV2OnboardingSetupReadyAction(organizationId)
       -> public.mark_organization_onboarding_setup_ready(p_organization_id)
          [durably records onboarding_setup_ready_at]
  -> ensureOnboardingCompletionRunAction({ organizationId })
       -> ensureOrganizationOnboardingCompletionRun(supabase, organizationId)
            -> public.ensure_organization_onboarding_completion_run(p_organization_id)
               [returns the single durable run]
```

Properties proven:

- `mark_organization_onboarding_setup_ready` is the only lifecycle RPC
  invoked; the ensure RPC receives `{ p_organization_id }` and nothing else
  (test: *passes only p_organization_id to the governed RPC*);
- the ensure call is issued **only after** durable Setup Ready succeeds
  (test: *ensures the completion run only after durable Setup Ready succeeds*);
- a refused Setup Ready never reaches the ensure call
  (test: *never ensures a run when Setup Ready is refused*);
- at runtime, one Setup Ready action issued exactly two governed server
  actions (matrix check 3: *Setup Ready issues exactly two governed server
  actions*).

This satisfies contract invariant 6 (no execute call before Setup Ready is
durably recorded) and invariant 1 (no client write path to a lifecycle column).

---

## 7. Authentication boundary

| Evidence | Result |
| --- | --- |
| Unauthenticated visitor navigating the governed route | redirected to login (matrix check 19) |
| Unauthenticated Server Action POST to the ensure action | never reaches the P1-A path; returns an opaque redirect before execution (matrix check 20, closeout check 8) |
| Completion state after an unauthenticated attempt | unchanged, compared row-for-row before and after (matrix check 21, closeout check 9) |
| Unauthenticated caller invoking the RPC directly through the local API | HTTP `401`, `permission denied for function ensure_organization_onboarding_completion_run` (closeout check 6) |
| Application-level mapping of a missing actor | `NOT_AUTHENTICATED` with no database detail (test: *maps an unauthenticated caller without leaking database detail*) |

The application never assumes an actor. `ensureOrganizationOnboardingCompletionRun`
re-derives the actor through `resolveOnboardingOrganizationId` before
any read, and the RPC's `execute` grant is restricted to `authenticated`
(closeout check 5: `anon=false`, `authenticated=true`, `service_role=false`).

`UNAUTHENTICATED ACCESS TO THE P1-A PATH = REFUSED`

---

## 8. Owner authority

| Evidence | Result |
| --- | --- |
| Non-Owner (viewer) observing the Owner governed team route | refused (matrix check 16) |
| Non-Owner executing the ensure path | `NOT_AUTHORIZED` (matrix check 17) |
| Non-Owner member receiving run data | none; refused before the database is reached (test: *refuses a non-Owner member before reaching the database*) |
| Outsider creating or observing the Owner completion state | refused, and no state created (matrix check 18) |
| Authorized Owner on an eligible V2 organization | obtains exactly one durable run (Gate 7 checks 10-13, matrix checks 5-7) |

The Owner check happens in the server module before the RPC call, and again
inside the `SECURITY DEFINER` authority via
`private.resolve_organization_onboarding_completion_actor`. A non-Owner
therefore receives a safe state containing no completion-run data, as
invariant 2 requires.

`OWNER-ONLY MUTATION AUTHORITY = PRESERVED`

---

## 9. Server-side organization re-derivation

`organizationId` is never trusted from a query string or form field. The
server module re-derives the organization from active membership and then
passes the **derived** identifier to the RPC:

- the RPC is called with `actor.organizationId`, not with the caller's input
  (test: *ensures the run with the organization identity resolved on the
  server*);
- the action schema is strict and rejects extra client-supplied fields rather
  than forwarding them (test: *rejects extra client-supplied fields rather
  than forwarding them*);
- malformed input is rejected before a Supabase client is even constructed
  (test: *rejects malformed input before creating a server client*);
- at runtime, a foreign organization identifier supplied by the caller could
  not cross the server-derived boundary (matrix checks 22-24).

`SERVER-SIDE ORGANIZATION RE-DERIVATION = ENFORCED`

---

## 10. Organization isolation

Runtime evidence with two distinct synthetic organizations:

| Check | Result |
| --- | --- |
| Cross-organization execution attempt | refused (matrix check 22) |
| The other organization's existing run after the attempt | untouched (matrix check 23) |
| A run created for the caller's own ineligible organization | none (matrix check 24) |
| Foreign organization existence disclosure | none; the refusal is indistinguishable from an authorization failure (test: *refuses a foreign organization without disclosing its existence*) |

The underlying tables carry RLS with zero policies plus revoked grants
(contract invariant 3), so the application has no direct-table path to another
tenant's rows even if a boundary check were bypassed.

`CROSS-ORGANIZATION LEAKAGE = NONE OBSERVED`

---

## 11. Error and information-leak handling

Every failure is mapped to a closed application vocabulary before it reaches
the UI: `NOT_AUTHENTICATED`, `NOT_AUTHORIZED`, `INVALID_LIFECYCLE`,
`TRANSPORT_ERROR`, `INVALID_RESPONSE`.

| Evidence | Result |
| --- | --- |
| Raw database error message reaching the user | never (test: *never surfaces a raw database error message*) |
| Internal diagnostic detail projected into the application type | none (test: *does not project internal diagnostic detail into the application type*) |
| Unrecognised RPC payload | rejected rather than trusted (test: *rejects an unrecognised payload shape rather than trusting it*) |
| Pre-Setup-Ready call | `INVALID_LIFECYCLE` (test: *maps a pre-Setup-Ready INVALID_LIFECYCLE refusal*; matrix check 14) |
| Raw authoritative run value rendered to the user | none (test: *renders no raw authoritative run value to the user*) |
| Ensure-call failure | recoverable message, action stays available, no automatic replay (tests: *surfaces a recoverable message when only the ensure call fails*, *keeps the action available and creates no run when the ensure call fails*) |

The RPC response is parsed by a strict Zod schema
(`ensureCompletionRunRpcSchema`), so an unexpected shape becomes
`INVALID_RESPONSE` rather than a partially trusted object.

---

## 12. Database authority and advisory-lock preservation

P1-A adds no locking of its own and does not weaken the database's. Verified
directly against the governed function definition in the local database:

| Check | Result |
| --- | --- |
| Governed RPC still takes a transactional advisory lock | **PASS** (closeout check 1) |
| Advisory lock namespace `872004` preserved | **PASS** (closeout check 2) |
| Lock key remains organization-scoped | **PASS** (closeout check 3) |
| Governed RPC remains `SECURITY DEFINER` | **PASS** (closeout checks 4, matrix check 26) |
| `execute` grants unchanged (`authenticated` only) | **PASS** (closeout check 5) |
| Advisory lock in namespace `872004` held after the run | none (matrix check 27) |
| Advisory lock retained after closeout | none (closeout check 10) |

The lock is
`pg_catalog.pg_advisory_xact_lock(872004, pg_catalog.hashtext(coalesce(p_organization_id::text, '')))`,
the same namespace used by all five completion RPCs. Contract invariant 12
prohibits application-level locking, queueing or retry loops that defeat or
duplicate it; §13 and §14 record that none was added.

`DATABASE ADVISORY-LOCK AUTHORITY = PRESERVED`

---

## 13. Component single-flight boundary

The Team review surface prevents a second submission while the first is
pending. This is a **local user-experience guard**, and this document states
its limits precisely.

Proven by the behavioral test *admits exactly one server action while the first
is pending, then confirms*, which reaches the real review branch, holds the
first action unresolved with a controlled deferred promise, attempts a second
activation, and asserts:

- exactly one `markV2OnboardingSetupReadyAction` call;
- exactly one `ensureOnboardingCompletionRunAction` call, with
  `{ organizationId }`;
- the control renders `Finishing setup...` and is `disabled` while pending;
- re-activating the disabled control adds no call;
- after resolution the status reaches `confirmed` and renders
  `Setup confirmed`;
- no router refresh is triggered.

Determinism is achieved with a deferred promise and a microtask drain. **No
arbitrary sleep is used** anywhere in the test file.

**What this does and does not prove.**

| Claim | Status |
| --- | --- |
| Component-local double-submission protection | **PROVEN** |
| Distributed idempotency | **NOT PROVEN by this test** |
| Cross-tab, refresh and genuinely concurrent activation | remain **database authority** through `ensure_organization_onboarding_completion_run` |
| Application locking, retry loop or queue introduced | **NONE** |

This distinction is written into the test file itself so it cannot drift from
the code, and it is the reason §14 exists as a separate section.

---

## 14. Database idempotency boundary

Idempotency is a database guarantee, not an application one. The application
merely refrains from defeating it.

| Evidence | Result |
| --- | --- |
| Repeated authorized execution | returns `ok` each time (matrix check 11) |
| Runs after repeated execution | exactly one; `started_at` preserved (matrix check 12) |
| Invitation attempts added by repeated execution | none (matrix check 13) |
| Repeated activation in the browser | creates no second run (Gate 7 check 12, all 12 cells) |
| Repeated navigation and refresh in the browser | create no duplicate run (Gate 7 check 17, all 12 cells) |
| Application replay across repeated submissions | one run (test: *replays safely, producing one run across repeated submissions*) |
| `started_at` on an existing run | preserved (test: *preserves started_at when the run already exists*) |
| One user action to ensure-RPC calls | exactly one; no retry or queue loop (matrix check 8) |

The mechanism is the migration's
`on conflict (organization_id) do nothing` plus the organization-scoped
advisory lock, exactly as contract invariant 13 specifies. P1-A constructs no
idempotency key (invariant 5).

`RUNS PER ELIGIBLE ORGANIZATION = 1`

---

## 15. UI and accessibility behavior

| Requirement | Evidence |
| --- | --- |
| States plainly that no invitation is sent by this step | test: *states plainly that no invitation is sent by this step*; the surface renders `No invitations have been sent yet.` |
| Accessible status announcement | test: *announces its status accessibly* - `role="status"` with `aria-live="polite"` |
| No raw authoritative value shown | test: *renders no raw authoritative run value to the user* |
| Semantic tokens rather than a hard-coded brand accent | test: *uses semantic tokens rather than a hard-coded brand accent* (§13.2 token requirement) |
| Honest progress only | the status has exactly three states - `idle`, pending (`Finishing setup...`), `confirmed` - each corresponding to a real resolved outcome; no simulated progress animation |
| Setup Ready visible within the viewport on mobile | Gate 7 check 9 (*Setup Ready action visible in viewport*) passed in all 12 cells, including the three mobile cells, satisfying the §13.2 sticky-action requirement |
| Permitted controls on the review surface | exactly `Back to edit` and `Finish setup` before confirmation; exactly `Back to edit` after confirmation |

The review surface was asserted against an **exact allowlist** of both
clickable labels and rendered components. An unrecognised component surfaces as
`UNEXPECTED_COMPONENT` and fails the assertion, so the exclusion is not
vacuous.

**Detector sensitivity is proven, not assumed.** Because production code may
not be modified to demonstrate a failure, the test
*detects a prohibited successor-phase control if one is added to the review
branch* clones the real review element with an added `Enter ZyntixAI` button
and asserts the detector reports it and that the permitted set no longer
matches. The exclusion assertions therefore genuinely fail if a prohibited
control is added.

---

## 16. P1-B, P1-C and P1-D exclusions

P1-A is contract-narrow. Each exclusion below is asserted both statically and
in the browser.

| Excluded capability | Owning slice | Static evidence | Runtime evidence |
| --- | --- | --- | --- |
| `list_organization_onboarding_frozen_team_invite_intents` consumption | P1-B | boundary group | forbidden-marker scan (`frozen`) |
| `list_organization_onboarding_invitation_results` consumption | P1-B | boundary group | forbidden-marker scan (`Invitation results`) |
| Invitation execution or reconciliation from the UI | P1-B | boundary group; no invitation RPC referenced | matrix checks 9, 10; Gate 7 checks 15, 16 |
| Creating-state completion UI | P1-B | exact component and label allowlist | Gate 7 check 8 (*no Creating/Ready completion UI before Setup Ready*) |
| Ready-state completion UI | P1-C | exact component and label allowlist | Gate 7 check 8; forbidden-marker scan (`ready_for_cutover`) |
| Enter ZyntixAI / explicit completion | P1-C | test: *does not invoke the completion action from any P1-A surface* | forbidden-marker scan (`Enter ZyntixAI`) |
| Product-route cutover | P1-D | test: *does not cut over to a product route* | forbidden-marker scan (`/home`) |
| Lifecycle-column writes and private completion tables | - | test: *writes no lifecycle column and touches no private completion table* | matrix check 28 (*no completion result mutated outside P1-A authority*) |
| Client-supplied authoritative values | - | test: *accepts no client-supplied authoritative value* | strict schema rejects extra fields |
| Application lock, queue or polling loop | - | test: *adds no application-level lock, queue or polling loop* | matrix check 8 |
| Service-role client or unsafe cast | - | test: *uses no service-role client and no unsafe cast* | - |
| New migration or generated-type change | - | `supabase/**` and `src/types/database.generated.ts` unmodified (§27) | - |

Additionally, `P1-A writes no completed_at` was asserted in every one of the 12
Gate 7 cells (check 14): the run is left at a non-terminal status for the
successor slices to advance.

`P1-B, P1-C, P1-D WORK PERFORMED = NONE`

---

## 17. Registration and provisioning non-interference

Contract invariant 17 requires that P1 touch no registration, authentication or
provisioning path.

| Check | Result |
| --- | --- |
| Registration route still responds | **PASS** (matrix check 29) |
| Registration route widened by P1-A | **NO** (matrix check 30) |
| Registration, auth or provisioning source modified | **NONE** - the five implementation paths in §4 contain no registration, auth or provisioning file |
| `complete_owner_self_registration` behavior | unchanged; no migration modified |
| Social publishing capability granted by this slice | **NONE** - P1-A grants no entitlement; invariant 18 remains separately governed |

---

## 18. Test results

Executed sequentially, in the order the phase requires.

| # | Suite | Result |
| --- | --- | --- |
| 1 | `tests/onboarding/completion-run-integration.test.tsx` | **44 passed / 44** |
| 2 | `tests/security/onboarding-completion-authority-migration-security.test.ts` + `tests/security/onboarding-v2-transition-authority.test.ts` | **90 passed / 90** |
| 3 | `tests/onboarding` + `tests/security` (120 files) | **1,014 passed / 1,014** |
| 4 | serial full Vitest (`--no-file-parallelism`) | **3,938 passed / 3,940**; 521 of 523 files passed; duration 203.68 s |

An earlier draft of this section also reported a supplemental *onboarding
lifecycle and authorization* subset as "8 files / 71 tests". That subset was
never enumerated by file in the preserved command evidence, so it could not be
reproduced exactly and has been removed rather than restated. Nothing depends on
it: the binding onboarding-and-security result is row 3 above - **120 files and
1,014 passing tests** - which strictly contains every lifecycle and
authorization file that subset would have named.

`SUPPLEMENTAL UNENUMERATED SUBSET CLAIM = REMOVED`

`BINDING ONBOARDING/SECURITY RESULT = 120 FILES, 1,014 PASSED / 1,014`

### 18.1 Full-suite failure classification

The serial full run produced exactly two failures, both pre-existing and both
recorded as accepted baseline failures in `BETA1-4TG-MASTER-FV`:

| Failing file | Failing test | Classification |
| --- | --- | --- |
| `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` | *Progress no longer claims deferred tracking; Progress workspace language is present* | accepted baseline failure - unrelated Programs/Enrollments copy; no onboarding path involved |
| `tests/features/invitations/load-member-administration-page.test.ts` | *does not trust a foreign org id outside active memberships* | accepted baseline failure - member-administration page loader; not a P1-A path |

`NEW FAILURES INTRODUCED = 0`

`THIRD FAILURE = NONE`

`BASELINE PARITY = PROVEN`

---

## 19. Typecheck, lint and build

| Command | Result |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | **exit 0** |
| `npm run lint` | **exit 0** - `No ESLint warnings or errors` |
| `npm run build` | **exit 0** (72,634 ms) |

Typecheck and build were run separately, never concurrently.

### 19.1 Type correction recorded

Three `TS2345` diagnostics existed in
`tests/onboarding/completion-run-integration.test.tsx` at lines 363, 429 and
434 of the pre-revision file. Root cause: the mocked ensure functions returned
an object literal whose `ok` property TypeScript widened to `boolean`, so the
mock no longer matched the `ok: true` branch of the discriminated union
`OnboardingCompletionRunResult`.

Correction: an explicit
`async (): Promise<OnboardingCompletionRunResult>` return-type annotation on
each of the two mock factories, which pins the discriminant at its literal
type at the point of construction.

| Prohibited technique | Used |
| --- | --- |
| `any` | **NO** |
| `@ts-ignore` | **NO** |
| `@ts-expect-error` | **NO** |
| Weakened production type | **NO** |
| `tsconfig` exclusion | **NO** |
| Broad cast whose only purpose is hiding the diagnostic | **NO** |

`TS2345 DIAGNOSTICS REMAINING = 0`

---

## 20. Gate 7 browser journeys

Executed through a real Chromium browser driving the real local Next.js
application at `http://127.0.0.1:3457`.

### 20.1 Matrix shape

Contract §9.1 requires journeys `J1`, `J2` and `J13`-`J15` for all four
operating models. `J13`-`J15` are the viewport journeys, so the P1-A obligation
is `{J1, J2}` executed at each of the three `J13`-`J15` viewports, for each of
the four operating models: **12 cells**.

| Operating model | Foundation pack | `J13` desktop | `J14` tablet | `J15` mobile |
| --- | --- | --- | --- | --- |
| TG1 `course_seller` | `foundation.knowledge` | 17/17 | 17/17 | 17/17 |
| TG2 `service` | `foundation.service` | 17/17 | 17/17 | 17/17 |
| TG3 `field_operations` | `foundation.field-operations` | 17/17 | 17/17 | 17/17 |
| TG4 `product_operations` | `foundation.product-operations` | 17/17 | 17/17 | 17/17 |

All four models were built over `niche.online-course-business` per
`V2_ONBOARDING_CONTEXT_PACKS`, as §13.1 specifies.

`CELLS = 12`  `CHECKS PER CELL = 17`  `PLUS HOST CHECK = 1`

`GATE 7 CHECKS = 205`  `FAILED = 0`

### 20.2 The 17 checks executed in every cell

| # | Check | Result in all 12 cells |
| --- | --- | --- |
| 1 | precondition not Setup Ready | PASS |
| 2 | precondition zero completion runs | PASS |
| 3 | `J1` authorized Owner reaches governed workspace route | PASS |
| 4 | `J1` workspace step renders | PASS |
| 5 | `J1` proceeds to Team step | PASS |
| 6 | `J2` team step renders | PASS |
| 7 | `J2` invite intents reviewed | PASS |
| 8 | no Creating/Ready completion UI before Setup Ready | PASS |
| 9 | Setup Ready action visible in viewport | PASS |
| 10 | `J2` Setup Ready taken through the application | PASS |
| 11 | durable Setup Ready recorded | PASS |
| 12 | exactly one durable completion run | PASS |
| 13 | run status governed | PASS |
| 14 | P1-A writes no `completed_at` | PASS |
| 15 | no invitation created | PASS |
| 16 | no delivery, event or rate-limit side effect | PASS |
| 17 | repeated navigation and refresh create no duplicate run | PASS |

### 20.3 Mandatory journey coverage

| Required journey element | Where proven |
| --- | --- |
| Authorized Owner reaches the governed route | Gate 7 checks 3-6 |
| Eligible V2 organization obtains or reuses exactly one durable run | Gate 7 checks 10-13; matrix checks 5-7, 11-12 |
| Repeated activation creates no second run | Gate 7 check 12; matrix checks 11-13 |
| Refresh and repeat navigation remain coherent | Gate 7 check 17 |
| Ineligible organization gets no run | matrix checks 14-15 |
| Unauthorized actor cannot create or observe another organization's run | matrix checks 16-18 |
| Foreign organization identifier cannot cross the server-derived boundary | matrix checks 22-24 |
| Existing onboarding navigation remains available | matrix checks 1-2 |
| No Creating surface | Gate 7 check 8; §16 |
| No Ready completion surface | Gate 7 check 8; §16 |
| No Enter ZyntixAI action | §16 forbidden-marker scan |
| Registration and provisioning not widened | matrix checks 29-30 |

### 20.4 Browser network confinement

`every browser request host is loopback` = **PASS**. Recorded browser request
hosts: `["127.0.0.1"]` over **645 requests**.

---

## 21. Local application-runtime matrix

Executed against the real P1-A application path, then compared with the final
local database state.

`MATRIX CHECKS = 32`  `FAILED = 0`  `REQUESTS = 162`  `HOSTS = ["127.0.0.1", "localhost"]`

| # | Check | Result |
| --- | --- | --- |
| 1 | existing pre-P1-A team-intent creation still available through the app | PASS |
| 2 | review/edit navigation outside P1-A boundary still available | PASS |
| 3 | Setup Ready issues exactly two governed server actions | PASS |
| 4 | ensure Server Action identifier captured | PASS |
| 5 | M1 eligible Setup Ready state yields one run | PASS |
| 6 | M1 run status reflects one non-terminal intent | PASS |
| 7 | M1 result snapshot seeded as `not_attempted` with zero attempts | PASS |
| 8 | M8 one user action performs exactly one ensure RPC (no retry or queue loop) | PASS |
| 9 | M9/M10 no invitation, delivery, event or rate-limit side effect | PASS |
| 10 | M10 no email delivered by the P1-A path | PASS |
| 11 | M5 repeated authorized execution returns `ok` each time | PASS |
| 12 | M5 idempotent: one run, `started_at` preserved | PASS |
| 13 | M5 repeated execution adds no invitation attempt | PASS |
| 14 | M2 ineligible organization is refused with `INVALID_LIFECYCLE` | PASS |
| 15 | M2 ineligible organization receives no completion run | PASS |
| 16 | M4 non-owner cannot observe the Owner governed team route | PASS |
| 17 | M4 non-owner execution is refused with `NOT_AUTHORIZED` | PASS |
| 18 | M4 outsider cannot create or observe the Owner completion state | PASS |
| 19 | M4 unauthenticated visitor is redirected to login | PASS |
| 20 | M4 unauthenticated execution never reaches the governed P1-A path | PASS |
| 21 | M4 unauthenticated attempt mutates no completion state | PASS |
| 22 | M6 cross-organization execution is refused | PASS |
| 23 | M6 the other organization's run is untouched | PASS |
| 24 | M6 no run created for the caller's own ineligible organization | PASS |
| 25 | M7 database advisory-lock authority preserved in the governed RPC | PASS |
| 26 | M7 governed RPC remains `SECURITY DEFINER` | PASS |
| 27 | M7 no advisory lock in namespace `872004` is held after the run | PASS |
| 28 | M11 no completion result mutated outside P1-A authority | PASS |
| 29 | registration route still responds | PASS |
| 30 | registration route is not widened by P1-A | PASS |
| 31 | no open fixture transaction remains | PASS |
| 32 | every matrix browser request host is loopback | PASS |

A further **10-check closeout** re-verified the M7 advisory-lock family
directly against `pg_get_functiondef`, plus unauthenticated denial at both the
RPC and the application, and the absence of any retained advisory lock: **10/10
PASS**.

### 21.1 Runtime evidence attribution - why re-execution was performed

Recoverable evidence from the completed predecessor phase
`ENG-ONB-1H-P1-A-RV` was searched for **read-only** before any database or
browser work, in local temporary harness output clearly associated with that
phase. 23 artifacts were found and preserved unmodified.

| Recovered artifact | Content | Sufficient? |
| --- | --- | --- |
| `gate7-results.json` | 205 results, 0 failed, hosts `["127.0.0.1"]` | complete for Gate 7 |
| `matrix-results.json` | 31 results, **3 recorded `ok: false`** | **incomplete** |
| `closeout-results.json` | 10 results, 0 failed | partial remediation only |
| `baseline.json`, `fixtures.json`, `runtime-request-hosts.jsonl`, `action-shape.json` | supporting records | supporting only |
| cleanup artifact | **absent** - the predecessor teardown wrote to stdout only | **missing** |
| shutdown artifact | **absent** - the predecessor guard/shutdown wrote to stdout only | **missing** |

The recovered set was therefore judged **insufficient**: the runtime matrix
contained three recorded failures, and, decisively, **no persisted cleanup or
shutdown evidence existed at all**. The phase rule is that recovered evidence
is sufficient only if it proves the complete matrix *including final cleanup
and shutdown*. It did not.

The three predecessor matrix failures were diagnosed as harness defects rather
than application defects, and both were corrected before re-execution:

1. two M7 checks parsed `pg_get_functiondef` output that spans multiple lines
   and were split on newlines; the query now flattens newlines before matching;
2. one M4 check expected an unauthenticated Server Action POST to return an
   application error code, when the request is in fact redirected before the
   action executes; the check now asserts the stronger property - that the
   request never reaches the P1-A path and mutates no completion state.

Consequently the **entire runtime matrix was re-executed fresh**. Every runtime
number in §20-§23 of this document comes from that fresh execution, not from
recovered output. Independent corroboration: the freshly captured pre-run
baseline is byte-identical to the recovered predecessor `baseline.json`,
showing the predecessor run also left zero residue even though it never
persisted proof of it.

Prohibited shortcuts were not taken: shell history was not treated as proof of
runtime behavior; no missing evidence was fabricated; and the published P0
database-runtime evidence is **not** claimed to prove the P1-A application
layer (§3, §24).

`RECOVERED EVIDENCE SUFFICIENT = NO`

`RUNTIME RE-EXECUTED = YES`

### 21.2 Local target proof

All work was confined to the local Docker Supabase stack. No Production or
linked Supabase access was used, and no linked Supabase CLI command was
issued.

| Property | Value |
| --- | --- |
| Database container | `d81506dfc04a` `supabase_db_project_ai_cursus_verkopers` |
| Database image | `public.ecr.aws/supabase/postgres:17.6.1.141` |
| PostgreSQL version | `PostgreSQL 17.6` |
| Database port | `54442` -> `5432` |
| API gateway container | `0cae9f996c3b` `supabase_kong_project_ai_cursus_verkopers` |
| API gateway port | `54441` -> `8000` |
| Migration files in `supabase/migrations` | 128 |
| Rows in `supabase_migrations.schema_migrations` | 128 |
| Pending migrations | **0** |
| Governed migrations applied | `20260907140829`, `20260907230410`, `20260908111356`, `20260908131955` |

### 21.3 Environment isolation

The P1-A client constructors consume exactly two public environment variable
**names**: `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

| Control | Status |
| --- | --- |
| Local key values obtained without printing or persisting them | **YES** |
| Local values injected only into the child application process | **YES** |
| `.env`, `.env.local` or any repository environment file modified | **NO** |
| Every configured Supabase endpoint verified loopback before launch | **YES** - 9 of 9 endpoints `LOOPBACK` |
| Abort-on-non-local-URL guard armed | **YES** |

This isolation is load-bearing rather than decorative: a probe confirmed that
**without** process-scoped injection, the repository's own `.env.local`
resolves `NEXT_PUBLIC_SUPABASE_URL` to a **remote** Supabase host. The
injection plus the egress guard are what kept the run local.

### 21.4 Remote-request prevention

A runtime egress guard was loaded into the application process and every child
process via `NODE_OPTIONS --require`. It wraps `globalThis.fetch` and
`net.Socket.prototype.connect`, records **destination hostname, method and
path only** - never headers, keys or tokens - and aborts the application
immediately if a Supabase request targets a non-loopback host.

| Property | Value |
| --- | --- |
| Guard-armed processes | 4 (pids `16768`, `15404`, `2016`, `15460`) |
| Guard-block file produced | **NO** (the guard never had to abort) |
| Recorded outbound requests | 3,507 |
| Requests to `127.0.0.1` | 3,505 |
| Supabase-classified requests | 3,503 - **all** to `127.0.0.1` |
| **Remote Supabase hosts contacted** | **0** |
| `ensure_organization_onboarding_completion_run` calls observed | 18, all to `127.0.0.1` |
| `mark_organization_onboarding_setup_ready` calls observed | 14, all to `127.0.0.1` |
| Non-loopback hosts of any kind | `registry.npmjs.org` (2 socket connections) |

The two `registry.npmjs.org` connections are the npm launcher's own package
metadata lookups when starting `next dev`. They are not Supabase requests,
carried no application data, and are reported here rather than omitted.

`REMOTE SUPABASE ACCESS = ZERO`

---

## 22. Fixture and cleanup evidence

### 22.1 Synthetic fixture identities

Only synthetic local identities were used. No real user, organization or
invitation data was touched. All fixture email identities carry the
unmistakable `example.test` marker.

| Role | Organization |
| --- | --- |
| TG1 eligible | `d483913e-6ade-4004-9641-f63ffe52f238` |
| TG2 eligible | `fdfeb7f2-23d9-4990-9191-03f18fa45c0c` |
| TG3 eligible | `a2b2f342-5127-4245-b562-0dc67683fa35` |
| TG4 eligible | `4f5073a1-20b1-4efb-81cc-b77f45364a92` |
| ineligible (pre-Setup-Ready) | `48137953-8b98-45e4-b20e-b698c3e7b51c` |

Seven synthetic users were created, including a non-Owner viewer
(`2c24b10a-7b26-4285-b2f8-af4074d0c160`) and an outsider
(`ef2cb41c-65d5-4827-9c9d-c8c4681695f4`) used for the authorization checks.

Before fixture creation, all relevant tables were fingerprinted, the local
migration-ledger state was recorded, open transactions and advisory locks were
captured, and the proposed fixture identifiers were proven absent: **0
pre-existing collisions**.

### 22.2 Cleanup boundary

Cleanup ran as a single transaction bounded by an explicit list of the exact
fixture organization and user identifiers recorded at bootstrap. **No broad
delete predicate was used.**

`public.organization_context_assignment_events` is a deliberately append-only
audit trail with `ON DELETE RESTRICT` foreign keys, so the transaction used
`SET LOCAL session_replication_role = 'replica'`, which is transaction-scoped
and reverts at `COMMIT`. No schema object was altered and no trigger was
permanently disabled - verified after commit:

- trigger `organization_context_assignment_events_guard_immutable` is
  `enabled = 'O'` (enabled for origin);
- `session_replication_role` in a fresh session is `origin`.

### 22.3 Residue verification

| Table | Fixture residue |
| --- | --- |
| `assignment_events` | 0 |
| `auth_identities` | 0 |
| `auth_sessions` | 0 |
| `auth_users` | 0 |
| `business_activities` | 0 |
| `completion_runs` | 0 |
| `context_assignments` | 0 |
| `invitation_results` | 0 |
| `invitations` | 0 |
| `members` | 0 |
| `organizations` | 0 |
| `profiles` | 0 |
| `registration_intents` | 0 |
| `team_intents` | 0 |
| **Total** | **0** |

| Side-effect table | Rows |
| --- | --- |
| `public.organization_onboarding_completion_runs` | 0 |
| `public.organization_onboarding_invitation_results` | 0 |
| `public.organization_invitations` | 0 |
| `public.organization_invitation_events` | 0 |
| `private.organization_invitation_delivery_attempts` | 0 |
| `private.organization_invitation_mutation_rate_limits` | 0 |

| Closure condition | Result |
| --- | --- |
| Advisory locks in namespace `872004` held | **0** |
| Open `idle in transaction` sessions | **0** |
| Invitation-token column anywhere in the schema | **0** |
| Fixture-owned token rows | **0** |
| Baseline table fingerprints restored | **YES** - all counts and identity rows identical |

**Plaintext-token marker, stated precisely.** The teardown check reported
`plaintextTokenMarkers = 1`. That counter counts token-named **column
definitions**, not persisted values, and was resolved rather than accepted: the
only token-named column in the entire local database is GoTrue's
`auth.refresh_tokens.token`, which is unrelated to onboarding invitation
tokens. **No invitation-token column exists**, and the single row in that table
belongs to the pre-existing baseline user
`zyntix-team-owner-qa@example.test` (`e7da34f0-339a-4f0c-b68c-0265eeb43109`) -
the one user present in the pre-run baseline - not to any fixture.

`FIXTURE RESIDUE = ZERO`  `SIDE-EFFECT RESIDUE = ZERO`  `BASELINE RESTORED = YES`

---

## 23. Process shutdown evidence

| Property | Value |
| --- | --- |
| Application port | `3457` |
| Port free before launch | **YES** (proven before starting `next dev`) |
| Launch | `next dev` with process-scoped local environment variables only |
| Startup | Ready in 3.2 s on `http://127.0.0.1:3457` |
| Shutdown order | orderly signal first, forced `taskkill /T /F` only for survivors |
| Forced-stop exit codes | informational - shutdown was deliberate and final |
| Port `3457` after shutdown | **FREE** |
| Surviving `next dev` or verification-harness Node processes | **0** |
| Total Node processes remaining | **0** |

The first shutdown pass terminated the application tree; some of its
`taskkill` exit codes were non-zero purely because the targeted pids had
already exited, which is informational under the phase rule since the shutdown
was deliberate and final and the port/process checks pass. A verification pass
then recorded the closed state: `portFreeAfterShutdown = true`,
`survivingNextDevOrHarnessProcesses = []`, `noProcessResidue = true`.

`PORT 3457 FREE = YES`  `PROCESS RESIDUE = 0`

---

## 24. Static, runtime and Production distinction

This document deliberately separates three different kinds of claim and does
not let a stronger-sounding one stand in for a weaker one.

| Claim class | What it proves here | What it does not prove |
| --- | --- | --- |
| **Static** (Vitest, typecheck, lint, build) | the application's code shape, call graph, argument shape, error mapping, component allowlist and single-flight behavior | that a real browser and a real database agree with it |
| **Runtime, local** (Gate 7 + matrix + closeout) | that the real application, driven by a real browser against a real PostgreSQL instance carrying all governed migrations, behaves as contracted | anything about Production data, Production configuration, Production scale, or Production identity providers |
| **Production** | **nothing - not attempted** | Production acceptance is not waived; §14.2 relocates it to `ENG-ONB-1H-PROD` and `ENG-ONB-1H-FV` |

Two further distinctions are stated explicitly rather than blurred:

1. the published `ENG-ONB-1H-P0-RV-EVIDENCE` runtime evidence proves the
   **database** authority; it is not evidence for the **application** layer
   (§3);
2. the component single-flight guard proves **local double-submission
   protection**; distributed idempotency remains **database authority** (§13,
   §14).

---

## 25. `B1-GATE.1` gate mapping

Dispositions taken from contract §14.2, column `P1-A`. `Y` = mandatory PASS.
`J` = `NOT_REQUIRED_WITH_JUSTIFICATION`.

| Gate | Contract disposition | Result | Evidence |
| --- | --- | --- | --- |
| 1 - Baseline and ownership | `Y` | **PASS** | §3 - predecessor `ENG-ONB-1H-P0-RV-EVIDENCE` proven closed at `878a561d` with repository evidence; §27 exact repository state |
| 2 - Scope freeze | `Y` | **PASS** | §4, §5 - changes confined to the §9.1 allowed source areas; §16 every successor capability excluded and asserted |
| 3 - Implementation completeness | `Y` | **PASS** | §6 - the full Setup Ready to completion-run flow is implemented and reachable; §15 the minimum honest status is presented |
| 4 - Automated tests | `Y` | **PASS** | §18 - named behavioral tests for each §9.1 *Tests* obligation; 1,014 onboarding+security passing; serial full run at baseline parity |
| 5 - Static quality | `Y` | **PASS** | §19 - typecheck, lint, build clean; §19.1 zero suppressed diagnostics; §27 `git diff --check` clean, no secret, no temp file in the repository |
| 6 - Security and tenant isolation | `Y` | **PASS** | §7-§12 - authentication, Owner authority, server-side re-derivation, cross-organization isolation, leak handling and advisory-lock preservation, each with runtime evidence |
| 7 - Browser and visual | `Y` | **PASS** | §20 - 205/205 checks across 4 operating models x 3 viewports through a real browser |
| 8 - Production verification | `J` | `NOT_REQUIRED_WITH_JUSTIFICATION` | **Justification.** No Production deployment occurs in this slice. Publication commits and pushes the nine §27 paths to the working branch `core/platform-readiness-20260707` only; nothing was released, no deployment was triggered, and no Production or linked Supabase credential was used (§21.2, §21.4). §14.2 permits `J` for P1-A precisely while no Production deployment occurs, and relocates Production acceptance to `ENG-ONB-1H-PROD` and `ENG-ONB-1H-FV` rather than waiving it. |
| 9 - Documentation and evidence | `Y` | **PASS** | this document |
| 10 - Publication and closure | `Y` | **PASS** | `ENG-ONB-1H-P1-A-PUB` staged, committed and pushed exactly the nine §27 paths, including this document, to `origin/core/platform-readiness-20260707` as an ordinary fast-forward; §27 records the resulting repository state |

`MANDATORY GATES PASSED = 9 of 9`

`GATES JUSTIFIED = 1 (gate 8)`

---

## 26. Residual risks and deferred work

| # | Item | Disposition |
| --- | --- | --- |
| 1 | Completion run is left non-terminal (`completed_at` never written by P1-A) | **By contract.** Advancing the run is P1-B/P1-C authority. Asserted in every Gate 7 cell (check 14). |
| 2 | Distributed idempotency is not proven by the component guard | **Accepted and stated.** Cross-tab, refresh and genuinely concurrent activation rest on the database advisory lock and `on conflict do nothing`, both re-verified unmodified (§12). |
| 3 | Two accepted baseline test failures remain red | **Pre-existing.** Recorded in `BETA1-4TG-MASTER-FV`; neither is on a P1-A path (§18.1). Remediation belongs to their owning units. |
| 4 | No Production verification | **Deferred by §14.2** to `ENG-ONB-1H-PROD` and `ENG-ONB-1H-FV` (§24, §25 gate 8). |
| 5 | The runtime harness itself lives in local harness output, not in a committed artifact | **Partially closed, remainder deferred.** §9.1 asks for the runtime matrix in a committed artifact. This document is now that committed artifact and records the results, counts, hosts and closure conditions; committing the harness sources was outside the authorized change set of both this slice and its publication phase (only one test file and this document were writable). |
| 6 | Gate 7 covers `J1`, `J2`, `J13`-`J15` only | **By contract.** `J3`-`J12` are owned by P1-B/P1-C/P1-D; the full `J1`-`J15` matrix is contracted at P1-D and FV. |
| 7 | Predecessor `ENG-ONB-1H-P1-A-RV` never persisted cleanup or shutdown proof | **Corrected.** The harness now persists teardown, guard and shutdown reports; this phase re-executed rather than inheriting (§21.1). |
| 8 | Invariant 18 (social publishing) has no implementation source | **Separately governed.** P1-A grants no entitlement (§17). |

---

## 27. Exact repository state

| Property | Value |
| --- | --- |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Parent commit published before this phase | `878a561ddf85b31ab5e8684a8ae34578dc6a566c` (`docs(onboarding): publish completion runtime evidence`) |
| Publication commit | the single commit that **contains this document**, whose subject is `feat(onboarding): integrate Setup Ready completion authority` and whose parent is `878a561ddf85b31ab5e8684a8ae34578dc6a566c`. Its own hash cannot be embedded here, because embedding it would change the document and therefore change the hash; it is identified by parent and subject instead, and is unique on this branch. |
| HEAD after publication | the publication commit above |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence after push | `0 0` |
| Push mode | ordinary fast-forward; no force, no force-with-lease, no alternate refspec, no tag |
| Staging area after publication | **empty** |
| Worktree after publication | **clean** |
| `git diff --check` | **clean** (exit 0) |
| No-index whitespace check | **clean** for all **four** untracked paths, verified with a live positive control |
| `supabase/**` | **unmodified** |
| `src/types/database.generated.ts` | **unmodified** |
| `.env`, `.env.local` | **unmodified** |

The published scope is exactly nine paths. Statuses below are the pre-publication
worktree status and the status in the publication commit:

| # | Path | Worktree status before publication | Committed status | Canonical-LF SHA-256 |
| --- | --- | --- | --- | --- |
| 1 | `src/features/onboarding/actions/onboarding-actions.ts` | ` M` | `M` | `d10e7018fdcceec91fb89f3b5f0cc13530ec29694ff150e70fb7210703037da5` |
| 2 | `src/features/onboarding/ui/team-foundation.module.css` | ` M` | `M` | `6a47fedf3ceed55b6676412b5d9183ca4efd197cc8654e61d4e81a1eb2f0ef2a` |
| 3 | `src/features/onboarding/ui/team-foundation.tsx` | ` M` | `M` | `820c26c3f3c420480081cff075d3c7f1f59ffa6ee912841c250f2f70e3420aec` |
| 4 | `tests/onboarding/team-configuration-review.test.tsx` | ` M` | `M` | `dd5573d25cbf14b65e5f963b9f4dd86c192bb812e28af4d2c8a017f4419e3600` |
| 5 | `tests/onboarding/team-foundation-route.test.tsx` | ` M` | `M` | `ff81797da475a8bb285e507e9f10043ce31b72004ca210dfc45c92bcd1c5e931` |
| 6 | `src/features/onboarding/domain/onboarding-completion-run.ts` | `??` | `A` | `6e26985dabe96c6f83f23d20f702d899326bd5bae6138b7aba44fcea83b09196` |
| 7 | `src/features/onboarding/server/onboarding-completion-run.ts` | `??` | `A` | `304ad7dd1b37f8080d3d1b802de2f2171cdc29b14ca1ea0c609c3147259a4863` |
| 8 | `tests/onboarding/completion-run-integration.test.tsx` | `??` | `A` | `23dc9497a9b2c3488a8d8ce69536f6dd45aa19bb143394a2ad1903e2ff545f09` |
| 9 | `docs/phases/ENG-ONB-1H-P1-A-setup-ready-application-integration-evidence.md` | `??` | `A` | this document |

Exactly five `M` and four `A`: the four untracked paths in the left column are
paths 6, 7, 8 and 9, and all four passed the explicit no-index whitespace check.

Paths 1-3 and 6-7 are the five production implementation files and paths 4-5
are the two previously modified test files. **All seven retain the exact
canonical-LF hashes they held before this revision began**, and all eight
non-document paths were byte-unchanged by the publication phase, which edited
only path 9.

`PATHS STAGED = 9`  `PATHS COMMITTED = 9`  `PATHS PUSHED = 9`

`GATE 10 = PASS`

---

## 28. Successor phase

Publication was the only remaining P1-A gate, and `ENG-ONB-1H-P1-A-PUB`
performed it: the nine paths in §27 were staged with explicit pathspecs,
committed as a single trailer-free commit whose parent is
`878a561ddf85b31ab5e8684a8ae34578dc6a566c`, and pushed to
`origin/core/platform-readiness-20260707` as an ordinary fast-forward, leaving
divergence `0 0`. Gate 10 is therefore **PASS** and P1-A is **closed with
evidence**.

Production remains **unverified and deferred**: no Production deployment,
release, credential or endpoint was involved in this slice or its publication,
and §14.2 relocates Production acceptance to `ENG-ONB-1H-PROD` and
`ENG-ONB-1H-FV` (§24, §25 gate 8).

The next phase is `ENG-ONB-1H-P1-B` (Governed Invitation Execution and Creating
State), per contract §9.1 *Successor*. It owns journeys `J3`-`J7`, the
frozen-intent and invitation-result listing surfaces, and the Creating-state UI -
all of which this slice deliberately excluded (§16). **P1-B is not started.**

`ENG-ONB-1H-P1-B WORK PERFORMED HERE = NONE`

`ENG-ONB-1H-P1-B STARTED = NO`

## End of ENG-ONB-1H-P1-A
