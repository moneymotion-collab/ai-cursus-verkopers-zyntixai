# ENG-ONB-1H-P1-D — Completed Onboarding Product Admission and Explicit Entry Evidence

## Executive verdict

`PASS — ENG-ONB-1H-P1-D AUTHENTICATED PRODUCT ADMISSION AND EXPLICIT ENTRY CLOSED WITH EVIDENCE`

This is the **post-publication** P1-D status. It is true only after the Owner trailer-free commit and ordinary fast-forward were independently verified (§24). It does not mean Gate 10 was already factually complete during pre-publication staging.

Independent review:

`PASS — ENG-ONB-1H-P1-D-R1-FR AUTHENTICATED PRODUCT-SHELL AUTHORITY INDEPENDENTLY VERIFIED`

Independent review `ENG-ONB-1H-P1-D-FR` blocked publication because completed product-shell rendering required a locally signed service-role credential in the Next.js application child. R1 removed that application-process dependency. R1-FR independently verified the correction. Implementation and review evidence therefore passed before publication. Gate 10 remained pending until the Owner commit and ordinary fast-forward were independently verified after publication.

**Historical pre-publication wording (retained; premature at that time):** this file already contained wording equivalent to Gate 10 PASS, 9/9 mandatory gates, and publication completed before commit `2c4befa73f5b71b2b2a63732ca3885c7e356479c` existed. That earlier wording is retained as chronology. It is not the factual basis for Gate 10. The factual basis is the independent post-publication verification in §24.

This document is the repository-native evidence for P1-D, R1, and R1-FR. Production remains unverified and unauthorized.

`P1-D and the local/product application implementation are closed. The complete ENG-ONB-1H program remains open until ENG-ONB-1H-PROD and ENG-ONB-1H-FV both pass.`

- Product admission is a single server-side decision: `redirectIfOrganizationOnboardingIncomplete` admits only `kind: "v2_completed"` (plus the contracted grandfathered / completed-legacy paths).
- Incomplete `/home` cannot show the product. Direct product URLs are pushed to the current onboarding stage.
- Enter ZyntixAI still completes onboarding only. Product entry is a separate **Open ZyntixAI** gesture after a coherent completed Ready snapshot.
- No migration. Generated types unchanged. Publication scope is exactly the 41 governed paths.
- Completed `/home` renders with the authenticated session client and membership-scoped Organization Context reads. The Next.js child receives an empty `SUPABASE_SERVICE_ROLE_KEY` and a mutation-sensitive elevated-credential guard. Unrelated governed systems may still contain service-role constructors; those are outside the P1-D `/home` request path.

`GATE 7 = PASS (372/372)` (R1-FR rerun; Next child has no service-role credential)

`APPLICATION RUNTIME MATRIX = PASS (63/63)`

`GATE 8 PRODUCTION = NOT_REQUIRED_WITH_JUSTIFICATION`

`GATE 10 PUBLICATION = PASS`
Owner trailer-free commit and ordinary fast-forward publication independently verified after publication.

`MANDATORY P1-D GATES = 9/9 PASS`

`PRODUCTION = UNVERIFIED`

`SUCCESSOR PHASES NOT STARTED = ENG-ONB-1H-PROD, ENG-ONB-1H-FV`

`COMPLETE ENG-ONB-1H PROGRAM = OPEN` until `ENG-ONB-1H-PROD` and `ENG-ONB-1H-FV` both pass.

---

## 1. Phase identifier

| Property | Value |
| --- | --- |
| Phase | `ENG-ONB-1H-P1-D` |
| Slice name | Product Route Cutover and Recovery |
| Governing contract | `docs/phases/ENG-ONB-1H-P1-CONTRACT-v2-onboarding-application-integration-and-completion.md` §9.4 |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Publication parent | `666165a2a075cc89d68a264a9099c2272c005d9e` |
| Parent subject | `feat(onboarding): add Ready reconstruction and completion` |
| Publication subject | `feat(onboarding): enforce authenticated product admission` |
| Published commit (post-publication) | `2c4befa73f5b71b2b2a63732ca3885c7e356479c` |
| Publication scope | exactly the 41 governed paths in §4 |
| Upstream | `origin/core/platform-readiness-20260707` |
| Production | unverified |

---

## 2. Contract interpretation

Published contract §9.4 is authoritative. The implementation slice task restated P1-C’s separation (Enter ZyntixAI completes only; no automatic product entry). Those statements are reconciled as follows. They are not a silent choice of a looser rule.

### 2.1 Purpose

Integrate completed V2 onboarding with the existing product-route enforcement path, recover refresh and direct navigation at every onboarding stage, handle completed-user re-entry, add a safe onboarding error boundary, and preserve four-target operating-model context after cutover.

### 2.2 Prerequisites

`ENG-ONB-1H-P1-C` closed at `666165a2a075cc89d68a264a9099c2272c005d9e`. Ancestors of HEAD also include the P1 contract, P0 runtime SQL, P0 runtime evidence, P1-A, and P1-B.

### 2.3 Owned journeys

Gate 7 `J1`–`J15` of contract §13.1, on desktop, tablet, and mobile, for all four operating models. This is the complete matrix. P1-D newly owns `J10` and `J11`, and shares `J12` with P1-C.

### 2.4 Permitted UI and routes

Allowed source: `src/features/onboarding/server/enforce-product-onboarding.ts`; `src/features/onboarding/domain/onboarding-routes.ts`; `src/features/onboarding/domain/onboarding-lifecycle.ts` (destination mapping only); `src/app/onboarding/**`; `src/features/onboarding/ui/` (error boundary and Ready entry); `tests/onboarding/`; `tests/features/`; `tests/security/`.

Canonical product destination remains `/home?org=<organizationId>` via `buildProductDestination`. No second admission system. Middleware, authenticated layout, `globals.css`, `supabase/**`, and generated types are unchanged.

### 2.5 Product-admission authority

Fail-closed: any state that is not `kind: "v2_completed"` denies product access, except the contracted grandfathered and completed-legacy compatibility paths already present in `resolveOnboardingLifecycleDestination`.

Admission is organization lifecycle authority (`onboarding_completed_at` / `v2_completed`), re-read on every server request. It is not a query-string organization, client flag, cookie, presentation label, invitation result, completion-run status alone, client role, or service-role bypass.

`RedirectType.push` is required on the product-gate `redirect()` calls. Next.js `replace` (the non-action default) rendered the onboarding stage as the `/home` document body without changing the URL. `push` makes the browser land on the onboarding pathname.

### 2.6 Ready after completion — Owner acknowledgement surface

Contract §9.4 says a completed organization is redirected off every onboarding route. P1-C and the slice task require:

1. Enter ZyntixAI completes only.
2. The completed Ready acknowledgement remains visible.
3. A separate explicit product-entry action becomes available.
4. Only that gesture navigates to the product.
5. No automatic redirect on completion click, Ready load, or Ready refresh.

**Binding interpretation used here:**

| Route after `v2_completed` | Owner | Other qualifying member |
| --- | --- | --- |
| `/onboarding/ready` | Stay. Show **Open ZyntixAI** when the snapshot is coherent. | Redirect to `/home?org=…` |
| `/onboarding`, `/onboarding/team`, `/onboarding/creating`, `/onboarding/workspace-confirmation`, `/onboarding/operating-model` | Redirect to `/home?org=…` (`J11`) | Redirect to `/home?org=…` |
| `/home` and other protected product resolvers | Admit | Admit |

Ready is the P1-C acknowledgement surface, not a dead end. It is the only onboarding route that may remain after completion, and only for Owners, so the explicit entry gesture exists. Non-Owners never complete and are not kept on Ready.

If this interpretation is rejected, the alternative (redirect Ready too) would auto-enter the product on Ready load/refresh and would contradict P1-C’s explicit-completion separation.

### 2.7 Actor and organization rules

- Authenticated actor required.
- Organization is derived from authenticated membership via `resolveOnboardingOrganizationId` / `resolveOrganizationOnboardingLifecycle`. A query-string `org` may select among the actor’s memberships; it cannot mint a foreign organization.
- Owners administer and complete onboarding (Creating, Ready, Enter ZyntixAI).
- After Owner completion, qualifying active members may enter the product. They cannot administer onboarding.
- Suspended / non-active membership cannot inherit completion.
- Outsiders cannot observe another organization’s Creating or Ready.

### 2.8 Required failure behavior

| State | Outcome |
| --- | --- |
| Unauthenticated | Login (or fail-closed RPC) |
| No qualifying membership | Organization unavailable / setup required |
| Non-Owner on Owner-only Creating/Ready actions | Denied; no Enter ZyntixAI |
| Incomplete V2 (`v2_core_incomplete`, `v2_context_required`, `v2_configured`, `v2_ready`, `v2_owner_required`) | Current onboarding stage, never `/home` product |
| `setup_ready` / `inviting` / `invite_partial` | Creating (or status panel); not product |
| `ready_for_cutover` | Ready; Enter ZyntixAI; not product |
| Coherent completed org+run | Product admitted; Ready shows Open ZyntixAI |
| Incoherent completed snapshot | Ready withholds Open ZyntixAI; copy says the record must be consistent; no repair from the browser |
| Run `completed` but organization not completed | Creating fail-closed status panel |
| Stale / historical invitation proof | Completion refused (P1-C authority preserved) |
| Foreign organization query | Ignored or selection required; cannot widen access |
| Direct product URL before completion | Pushed to current onboarding stage |
| Direct onboarding URL after completion (except Owner Ready) | Product |
| Refresh before completion | Same onboarding stage |
| Refresh after completion on Ready | Stay; no auto-entry |
| Multi-tab / stale request | Each request re-reads lifecycle |

### 2.9 Security invariants

Contract §8 invariants 3, 15, 16, 18. Four-target module gating (`HIDDEN MODULE = DIRECT ROUTE DENIED`, `UNKNOWN CONTEXT = FAIL CLOSED`) is not modified. No service-role client in onboarding application source. No direct reads of protected Organization Context tables from new P1-D paths. Ready operating-model label continues to use `OrganizationContextRepository`.

### 2.10 Required tests and evidence

Contract: `npx vitest run tests/onboarding tests/features tests/security`, including destination mapping for every `OnboardingLifecycleState.kind`, the 15 `redirectIfOrganizationOnboardingIncomplete` call sites, completed organizations leaving onboarding routes (Ready Owner exception as §2.6), four operating models after cutover, and full-suite parity with the two `BETA1-4TG-MASTER-FV` baseline failures.

### 2.11 B1-GATE.1

Contract §14.2 column `P1-D`: gates 1–7, 9, 10 mandatory; Gate 8 `J`. This evidence file is Gate 9. Gate 10 is the dedicated Owner publication commit. During pre-publication staging that commit did not yet exist, so Gate 10 was not yet factually complete. After ordinary fast-forward publication it is `2c4befa73f5b71b2b2a63732ca3885c7e356479c` (§24).

### 2.12 Exclusions and successors

No Production configuration, Production migration, registration/login redesign, provisioning, invitation-delivery authority, email, billing, social publishing, target-group modules, dashboard expansion, unrelated app-shell redesign, generated types, or FV work.

Successor: `ENG-ONB-1H-PROD`, then `ENG-ONB-1H-FV`. Not started.

---

## 3. Authority call graph

```
Protected product page (example: /home)
  → loadDailyOperatingPage
    → resolveTaskPageOrganization
      → listActiveOrganizationMemberships
      → resolveSelectedOrganization (membership-scoped; foreign org cannot inherit)
      → resolveOrganizationContext
      → redirectIfOrganizationOnboardingIncomplete
           → resolveOrganizationOnboardingLifecycle
                → resolveOnboardingOrganizationId (membership)
                → organizations row (flow version, timestamps)
                → resolveOnboardingLifecycle
           → if kind === "v2_completed": return (admit)
           → if v2_* or invalid: redirect(stagePath, RedirectType.push)
           → grandfathered / completed-legacy: return (admit)
      → loadProductModuleAccess (after admission only; authenticated session client)
           → resolveOrganizationContext (active membership; foreign org fail-closed)
           → OrganizationContextRepository.getPrimaryBusinessActivity
           → operatingModelFromTenantActivity
           → buildOperatingModelProductModuleAccess (four-target maps)

Ready page
  → resolveOnboardingOrganizationId
  → resolveOrganizationOnboardingLifecycle
  → v2_completed non-Owner → buildProductDestination
  → v2_completed Owner → loadOnboardingReadySnapshot → OnboardingReady
       → Open ZyntixAI → router.push(buildProductDestination) [no completion RPC]

Enter ZyntixAI
  → completeV2OnboardingAction → complete_organization_v2_onboarding
  → router.refresh()  [does not navigate to /home]
```

Fifteen committed product resolvers still call the same helper. Middleware and `(authenticated)/layout.tsx` do not contain a second gate.

---

## 4. Files changed

Modified:

1. `src/app/onboarding/creating/page.tsx`
2. `src/app/onboarding/operating-model/page.tsx`
3. `src/app/onboarding/ready/page.tsx`
4. `src/app/onboarding/team/page.tsx`
5. `src/app/onboarding/workspace-confirmation/page.tsx`
6. `src/features/onboarding/domain/onboarding-lifecycle.ts`
7. `src/features/onboarding/domain/onboarding-ready.ts`
8. `src/features/onboarding/domain/onboarding-routes.ts`
9. `src/features/onboarding/server/enforce-product-onboarding.ts`
10. `src/features/onboarding/ui/onboarding-ready.tsx`
11. `tests/onboarding/creating-route.test.tsx`
12. `tests/onboarding/onboarding-lifecycle-enforcement.test.ts`
13. `tests/onboarding/onboarding-lifecycle.test.ts`
14. `tests/onboarding/operating-model-ui.test.tsx`
15. `tests/onboarding/ready-reconstruction.test.tsx`
16. `tests/onboarding/ready-route.test.tsx`
17. `tests/onboarding/workspace-confirmation.test.tsx`

Untracked:

18. `src/app/onboarding/error.tsx`
19. `src/features/onboarding/ui/onboarding-error-fallback.tsx`
20. `src/features/onboarding/ui/onboarding-error-fallback.module.css`
21. `tests/onboarding/product-admission-routing.test.ts`
22. `tests/onboarding/product-admission-enforcement.test.ts`
23. `tests/onboarding/product-admission-app-shell.test.ts`
24. `tests/security/onboarding-product-admission-boundary.test.ts`
25. `docs/phases/ENG-ONB-1H-P1-D-completed-onboarding-product-admission-and-explicit-entry-evidence.md` (this file)

R1 additional modified:

26. `src/features/onboarding/domain/operating-model.ts` (tenant display-name map only; no Organization Context table token)
27. `src/features/product-access/server/load-product-module-access.ts`
28. `src/features/tasks/ui/resolve-task-page-organization.ts`
29. `src/features/attention/server/resolve-attention-page-organization.ts`
30. `src/features/customers/server/resolve-customer-page-organization.ts`
31. `src/features/leads/server/resolve-lead-page-organization.ts`
32. `src/features/enrollments/server/resolve-enrollment-page-organization.ts`
33. `src/features/programs/server/resolve-program-page-organization.ts`
34. `src/features/progress/server/resolve-progress-page-organization.ts`
35. `src/features/projects/server/resolve-project-page-context.ts`
36. `src/features/field-operations/server/resolve-field-page-context.ts`
37. `src/features/product-operations/server/resolve-product-operations-context.ts`

R1 additional untracked:

38. `src/features/product-access/domain/operating-model-module-access.ts`
39. `tests/onboarding/product-shell-authenticated-authority.test.ts`
40. `tests/onboarding/product-shell-loader-authority.test.ts`
41. `tests/onboarding/product-shell-elevated-env-guard.cjs`

Not changed: `src/middleware.ts`, `src/app/(authenticated)/layout.tsx`, `src/app/globals.css`, `supabase/**`, `src/types/database.generated.ts`. No new migration. Member administration still calls `loadProductModuleAccess(organizationId)` with one argument so the governed historical mock assertion remains intact; the loader then constructs `createSupabaseServerClient`.

---

## 5. Admission matrix

| Lifecycle kind | Product `/home` | Notes |
| --- | --- | --- |
| `v2_owner_required` | Deny → `/onboarding` | Non-Owner before Setup Ready |
| `v2_core_incomplete` | Deny → `/onboarding` | You & Company |
| `v2_context_required` | Deny → operating model | |
| `v2_configured` | Deny → workspace confirmation | |
| `v2_ready` | Deny → Creating (Owner) or `/onboarding` (non-Owner) | Includes `setup_ready`, `inviting`, `invite_partial`, `ready_for_cutover` |
| `v2_completed` | Admit | Organization completion timestamp set |
| `invalid` | Deny → `/onboarding` | Impossible timestamps / unsupported context |
| `grandfathered` | Admit | `onboarding_flow_version` NULL |
| `legacy` completed | Admit | V1 compatibility |
| `legacy` incomplete Owner | Deny → `/onboarding` then V1 questionnaire path | Unchanged |

`availableRoute` for landing/auth remains `home | onboarding | operating_model`. Incomplete users are not sent to product by `resolve-authenticated-landing.ts`. `stageRoute` is the P1-D stage mapping used by onboarding pages and the product gate.

---

## 6. Routing matrix

| Situation | Destination |
| --- | --- |
| Unauthenticated `/home` or Ready/Creating | `/login` |
| Authenticated, no membership | Status panel, not product |
| Incomplete Owner, Team/workspace after Setup Ready | Creating or Ready (`J1`/`J2` recover to current stage, never `/home`) |
| Incomplete Owner, `/home` | Push to Creating then Ready (`J10`) |
| Ready `ready_for_cutover` | Stay; Enter ZyntixAI |
| After Enter ZyntixAI | Stay on Ready; Open ZyntixAI; no auto `/home` |
| Ready refresh after completion | Stay; Open ZyntixAI (`J12`) |
| Completed Owner, Team/Creating/workspace/onboarding root | `/home?org=` (`J11`) |
| Completed Owner, Ready | Stay |
| Completed member, Ready | `/home?org=` |
| Completed, `/home` | Stay; Today |
| Foreign `org` query | Cannot select a non-membership organization |
| Creating when run is `completed` but org is not | Status panel, no product, no Ready loop |
| Onboarding render failure | `src/app/onboarding/error.tsx` → “Setup needs attention”; no SQL/stack |

No redirect loop: `shouldEnterReadySurface` is only `ready_for_cutover`. Status `completed` does not send Creating to Ready. Completed Creating goes to product. Ready does not send completed Owners to Creating.

---

## 7. Role and organization isolation

| Actor | Complete onboarding | Enter product after Owner completion | Ready Open ZyntixAI |
| --- | --- | --- | --- |
| Owner, active | Yes | Yes | Yes, if snapshot coherent |
| Staff/admin member, active | No | Yes (`v2_completed` is org-level) | N/A (redirected off Ready) |
| Suspended / non-active | No | No | No |
| Outsider | No | No | No |

Foreign organization IDs cannot reuse another organization’s `onboarding_completed_at`. Query-string `org` is only a selector among the actor’s memberships.

---

## 8. Inconsistent-state handling

| Condition | Application outcome |
| --- | --- |
| Org completed, run missing / timestamps mismatch / run not `completed` | `isCoherentCompletedReadySnapshot` is false. Open ZyntixAI withheld. Copy: workspace cannot be opened from this screen until the record is consistent. No browser repair. |
| Run `completed`, org timestamp absent | Creating status panel. Not Ready, not product. |
| Stale current evidence | P1-C refusal vocabulary; completion blocked. |
| Membership revoked after completion | Next request: membership derivation fails; product and Ready fail closed. |

No new migration. No UI that writes organization/run rows to “fix” inconsistency.

---

## 9. Explicit-gesture behavior

- Enter ZyntixAI: Owner-only; server `complete_organization_v2_onboarding`; `router.refresh()`; no `router.push` to product.
- Open ZyntixAI: visible only when `canOfferExplicitProductEntry` (coherent completed snapshot). `router.push(buildProductDestination)`. Single-flight lock; success does not release the lock (no double navigation). Failure copy returns focus. No `useEffect`, `setTimeout`, or `setInterval` navigation.
- Copy does not claim email delivery, provisioning, billing, or Production readiness.

---

## 10. No-auto-entry proof

- Ready UI has no `useEffect` navigation.
- Completion handler does not call `buildProductDestination`.
- Gate 7: after Enter ZyntixAI, pathname remains `/onboarding/ready` with “Setup is complete”.
- Gate 7 `J12`: completed Ready revisit remains Ready with Open ZyntixAI, not `/home`.
- Product entry occurs only after the Open ZyntixAI click, then `/home` + Today.

---

## 11. Direct protected-route enforcement

Hiding Open ZyntixAI is not the security boundary. `/home` always goes through `resolveTaskPageOrganization` → `redirectIfOrganizationOnboardingIncomplete`. Incomplete `v2_ready` is pushed to the onboarding stage. Completed `v2_completed` remains. The 15 committed call sites still contain the helper and do not contain `createServiceRoleClient`.

---

## 12. Browser Gate 7

Harness: `%TEMP%\p1d-product\run.mjs` (not a repository file). Next child on `http://127.0.0.1:3457`.

| Item | Result |
| --- | --- |
| Cells | 12 / 12 (4 operating models × 3 viewports) |
| Checks | **372 / 372 PASS** |
| `J10` incomplete `/home` | Onboarding stage; no Today |
| `J11` completed Team | `/home` |
| Completion without auto-entry | PASS |
| Open ZyntixAI | `/home` + Today; no invitation mutation |
| `J12` completed Ready revisit | Stay on Ready |
| Viewports J13/J14/J15 | 1280 / 768 / 390 |

---

## 13. Application runtime matrix

| Item | Result |
| --- | --- |
| Checks | **63 / 63 PASS** |
| Completed staff member `/home` | Admitted |
| Suspended member | Cannot inherit product |
| Unauthenticated `/home`, Creating, Ready | Fail closed |
| Non-Owner cannot execute Creating or complete Ready | PASS |
| Foreign organization | Cannot cross membership |
| P1-C completion/listing/stale/partial matrix | Preserved |
| Invitation / delivery / rate-limit side effects from admission | Zero |
| Advisory lock `872004` after run | 0 |
| Idle-in-transaction | 0 |

Synthetic identities: `p1d-*@example.test`. Fixtures restored to baseline (1 organization, 1 user, 0 P1-D orgs, 0 P1-D users).

---

## 14. Local-target and egress

- Local API override: `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54441`.
- Auth JWT secret taken from the local Auth container; anon JWT signed in memory for the Next child. Fixture administration may sign a service_role JWT **in the parent harness process only**. No Production key material in the harness files.
- Original P1-D implementation: Next child received the **local docker-signed** `SUPABASE_SERVICE_ROLE_KEY` so `loadProductModuleAccess` → Control Plane catalog readers could run after onboarding admission. Independent review `ENG-ONB-1H-P1-D-FR` blocked on that application-process dependency.
- R1: Next child `SUPABASE_SERVICE_ROLE_KEY` is explicitly empty. `preload.cjs` loads the egress guard and a mutation-sensitive elevated-credential guard (`tests/onboarding/product-shell-elevated-env-guard.cjs`). Completed product-shell module access uses the authenticated session client, `resolveOrganizationContext` (active membership only), and `OrganizationContextRepository` tenant reads. Four-target gating uses the existing operating-model capability maps. CONTROL-PLANE-READ-1B remains unchanged: authenticated still has no SELECT on the 15 catalog tables; no new RLS, RPC, or migration.
- `VERCEL_OIDC_TOKEN` / `VERCEL_URL` deleted from the child.
- Egress guard `guard.cjs`: abort on non-loopback `*supabase*` hosts.
- R1 child hosts observed: `127.0.0.1`, `registry.npmjs.org`, `telemetry.nextjs.org`. **No `*.supabase.co`.**
- R1 browser hosts: `127.0.0.1`, `localhost`.
- Endpoint proof: Auth/API/DB ports on `127.0.0.1`; Auth container `supabase_auth_project_ai_cursus_verkopers`.
- Local catalog: `has_table_privilege('authenticated','public.context_packs','SELECT') = false`; authenticated SELECT remains true for `organization_business_activities` and `tasks`.

**Historical linked-command disclosure:** the original P1-D implementation performed one unauthorized unqualified `npx supabase migration list`. It caused one read-only linked metadata request. No known remote mutation occurred. No migration push, reset, repair, or remote type generation occurred. Subsequent ledger inspection used `docker exec … psql` on local port 54442 only. R1 and R1-FR did not repeat that command. The complete P1-D history therefore had one read-only linked metadata contact, not zero remote access. Publication uses local Docker/PostgreSQL inspection only.

---

## 15. Automated tests

Focused P1-D files passed in R1: product-admission routing (7), enforcement (7), app-shell (5), Ready reconstruction (41), Ready route (12), workspace-confirmation (23), product-shell authenticated authority (9), product-shell loader authority (4), onboarding-product-admission-boundary (2).

P1-C Ready/completion, P1-A/P1-B onboarding, organization-context isolation, and invitation/security suites are included in `tests/onboarding` and `tests/security` and in the serial full Vitest run recorded in §16.

---

## 16. Serial full Vitest, typecheck, lint, build

| Command | Result |
| --- | --- |
| Original P1-D `tests/onboarding tests/security` | 129 files, 1182 passed |
| R1 `npx vitest run --fileParallelism false tests/onboarding tests/security` | **131 files, 1195 passed, 0 failed** |
| R1 `npx vitest run --fileParallelism false --maxWorkers 1` | **4119 passed / 2 failed / 4121 total**; 534 files (532 passed / 2 failed). Failures are only the two accepted historical files. |
| `npx tsc --noEmit` | pass |
| `npm run lint` | pass |
| `npm run build` | pass (`ƒ /home`, `ƒ /onboarding/ready` present) |
| `git diff --check` | clean on tracked diffs; untracked files clean after R1 evidence newline fix |

Accepted historical failures only:

- `tests/features/invitations/load-member-administration-page.test.ts` (foreign-org spy assertion; not modified)
- `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No third failure. Historical tests were not modified.

---

## 17. Migration and generated types

| Item | Status |
| --- | --- |
| Repository / ledger | 129 / 129 |
| `20260911144302` | Applied exactly once |
| Pending migrations | 0 |
| Completion function MD5 | `21b7e4a637752a0acebb399211e70c63` |
| New migration this phase | **none** |
| `src/types/database.generated.ts` SHA-256 | `68DC7981247FC4DA05008C237EC74FAA422B85B9996B752A166E32EFFD693F01` (unchanged) |

---

## 18. Cleanup

- Test Next process stopped; port **3457** free after harness (`portFreeAfter: true`).
- P1-D organizations `P1D%` = 0; users `p1d-%@example.test` = 0.
- Baseline fingerprint equal to restored fingerprint.
- Advisory locks classid `872004` = 0.
- Idle-in-transaction = 0.
- No `zyntixai_onb_*` databases.
- No `pg_dump` / `pg_restore` this phase.
- Original P1-D harness remains in `%TEMP%\p1d-product\` (not a repository path).
- R1 harness `%TEMP%\p1d-r1-product\` is not a repository path; leftover R1 fixture rows were restored to baseline before this record.

---

## 19. Static-versus-runtime boundary

Vitest proves destination mapping, helper call sites, Ready UI rules, and source isolation. Gate 7 / runtime prove real local sessions, four operating models, viewports, `J10`/`J11`/`J12`, member vs Owner, and fixture restoration. Production is not in that set.

---

## 20. Adversarial self-review

| Question | Answer |
| --- | --- |
| Incomplete org enter via product URL? | No. Helper pushes to onboarding; body is not Today. |
| Completed org trapped in onboarding? | No, except Owner Ready by design. Team/Creating/workspace go to `/home`. |
| Foreign org widen access? | No. Membership-scoped selection. |
| Client mint completion? | No. No localStorage/cookie completion flag. |
| Stale tab after membership loss? | Next request re-derives `status = 'active'` membership. A first-request suspended member is denied. An R1-FR extra probe that suspended one org for a staff user who remained active in other shared fixture orgs is confounded and is not treated as a product defect. |
| Inconsistent org/run fail open? | No. Open withheld; Creating fail-closed. |
| Entry mutate invitations? | Gate 7 asserts invitation count unchanged. |
| Double-click duplicate side effects? | Single-flight; completion idempotent; Open does not release on success. |
| Service-role in onboarding app path? | No. R1 also removed service-role from the product-shell module-access loader and from the Next child environment. Unrelated governed systems may still contain service-role code. |
| Service-role required to render completed `/home`? | No after R1. Authenticated session + active membership + tenant activity labels. |
| P1-C weakened? | Enter ZyntixAI still completes only. |
| Scope exceeded? | No migration, no types, no middleware. Product resolvers now pass the session client into `loadProductModuleAccess`. Control-plane GRANT contract unchanged. |
| Tests fail if the helper is removed? | Enforcement and app-shell tests assert the helper and `v2_completed` / `RedirectType.push`. |
| Tests fail if the loader constructs service-role? | Product-shell authority tests assert `createSupabaseServerClient`, `OrganizationContextRepository`, and the absence of `createSupabaseServiceRoleClient` / `createControlPlaneReaders`. |

---

## 21. `B1-GATE.1` Gate 1–10

| Gate | Contract | Result | Evidence |
| --- | --- | --- | --- |
| 1 Baseline | Y | **PASS** | Root, branch, HEAD `666165a2`, P1-C ancestor, clean start |
| 2 Scope freeze | Y | **PASS** | §2 and §4; allowlist only |
| 3 Implementation completeness | Y | **PASS** | Enforcement, stage mapping, explicit Open ZyntixAI, error boundary |
| 4 Automated tests | Y | **PASS** | §15–§16 |
| 5 Static quality | Y | **PASS** | typecheck, lint, build, `git diff --check` |
| 6 Security / tenant isolation | Y | **PASS** | §3, §7, §11, runtime matrix |
| 7 Browser / visual | Y | **PASS** | §12 372/372 |
| 8 Production verification | J | `NOT_REQUIRED_WITH_JUSTIFICATION` | No Production deployment. Contract relocates Production to `PROD`/`FV`. |
| 9 Documentation / evidence | Y | **PASS** | this file |
| 10 Publication / closure | Y | **PASS** | Owner trailer-free commit `2c4befa73f5b71b2b2a63732ca3885c7e356479c` and ordinary fast-forward independently verified after publication (§24). Pre-publication staging had already recorded this row as PASS before that commit existed; that earlier claim was not yet factual. |

Mandatory P1-D gates 1–7, 9, and 10 are **9/9 PASS** after post-publication verification. Gate 8 remains `NOT_REQUIRED_WITH_JUSTIFICATION`. During pre-publication staging, gates 1–7 and 9 had passed; Gate 10 was not yet factually complete.

---

## 22. Recommended next action

`ENG-ONB-1H-PROD` is next and is not started. `ENG-ONB-1H-FV` follows Production and is not started. Do not deploy from this phase. Do not treat the complete ENG-ONB-1H program as closed.

`P1-D and the local/product application implementation are closed. The complete ENG-ONB-1H program remains open until ENG-ONB-1H-PROD and ENG-ONB-1H-FV both pass.`

`ENG-ONB-1H-PROD WORK PERFORMED HERE = NONE`

`ENG-ONB-1H-FV STARTED = NO`

---

## 23. ENG-ONB-1H-P1-D-R1 — authenticated product-shell authority

### 23.1 Independent-review blocker

`BLOCKED — ENG-ONB-1H-P1-D-FR COMPLETED PRODUCT SHELL RENDERING REQUIRES SERVICE-ROLE IN THE NEXT APPLICATION CHILD`

After `v2_completed` admission, `/home` called `loadProductModuleAccess` → `resolvePrimaryBusinessActivityContext` → `createControlPlaneReaders()` → `createSupabaseServiceRoleClient()`. With `SUPABASE_SERVICE_ROLE_KEY` absent, that constructor threw `SUPABASE_SERVICE_ROLE_KEY is not configured`. Incomplete `/home` still redirected without the key.

### 23.2 Root cause

Not a missing onboarding helper and not a missing import under `src/features/onboarding/**`. The completed product-shell call graph used a privileged Control Plane catalog client after membership was already proven. CONTROL-PLANE-READ-1B grants SELECT on the 15 TAX/CAP/CTX tables to `service_role` only. Authenticated RLS already permits the tenant reads required for `/home`: active membership, organizations, `organization_business_activities`, tasks, and attention.

### 23.3 Correction

`loadProductModuleAccess` now:

1. uses `createSupabaseServerClient` or the caller’s authenticated session client;
2. proves active membership through `resolveOrganizationContext`;
3. reads the primary Business Activity through `OrganizationContextRepository`;
4. maps that tenant-visible activity to one of the four operating models;
5. builds module access from the existing four-target capability maps.

Product resolvers pass the same session client except member administration, which keeps the historical one-argument call; the loader then uses `createSupabaseServerClient`. Query-string `org` still cannot mint a foreign organization. Suspended / non-active membership remains excluded (`status = 'active'`). No new RLS policy, RPC, `SECURITY DEFINER` function, or migration.

### 23.4 Fixture / application separation

Harness: `%TEMP%\p1d-r1-product\` (not a repository path). Fixture user/org SQL and Auth admin calls remain in the parent process. The Next child gets `SUPABASE_SERVICE_ROLE_KEY=""`, `P1D_R1_ENV_GUARD=1`, and `preload.cjs` (egress guard + elevated-credential guard). Report: `nextChildServiceRoleKeyEmpty: true`, `fixtureServiceKeyIsolated: true`.

### 23.5 R1 local results

| Item | Result |
| --- | --- |
| Gate 7 rerun | **372 / 372 PASS** |
| Application runtime matrix | **63 / 63 PASS** |
| Completed Owner `/home` | Today rendered; no service-role in the Next child |
| Completed staff member `/home` | Admitted |
| Incomplete `/home` (J10) | Onboarding stage; no Today |
| Open ZyntixAI required | PASS |
| Suspended member | Denied |
| Outsider / foreign organization | Isolated |
| Invitation / delivery / rate-limit side effects | Unchanged (matrix + Gate 7) |
| Baseline restored | true |
| Port 3457 after run | free |
| Linked/remote/Production access during R1 | none |
| Onboarding/security | 131 files, 1195 passed |
| Serial full Vitest | 4119 passed / 2 failed / 4121 total |
| Typecheck / lint / build | pass / pass / pass |

R1 did not repeat the earlier unqualified `npx supabase migration list`. R1-FR did not repeat it.

Independent R1-FR: `PASS — ENG-ONB-1H-P1-D-R1-FR AUTHENTICATED PRODUCT-SHELL AUTHORITY INDEPENDENTLY VERIFIED`. Gate 7 372/372 and runtime 63/63 were reproduced locally with an empty Next-child service-role key. A first-request suspended member remains denied. An extra shared-user one-org suspension probe was confounded by remaining active memberships in other fixture organizations and is not overstated here.

### 23.6 Publication (pre-publication record, retained)

Parent: `666165a2a075cc89d68a264a9099c2272c005d9e`. Subject: `feat(onboarding): enforce authenticated product admission`. Scope: the 41 governed paths in §4. At the time this paragraph was first written, the commit hash was assigned at commit time and was not invented here.

That pre-publication record is retained. It does not by itself prove Gate 10. The Owner commit and ordinary fast-forward were still pending, so Gate 10 was not yet factually complete.

Historical wording in this same paragraph already said P1-D was closed with repository evidence. Implementation/review closure was true at that time; publication/Gate 10 closure was not yet factual. P1-A through P1-D local application integration is complete with repository evidence. Production remained unverified. `ENG-ONB-1H-PROD` and `ENG-ONB-1H-FV` were not started.

The program-level statement that remains binding:

`The complete ENG-ONB-1H program remains open until ENG-ONB-1H-PROD and ENG-ONB-1H-FV both pass.`

---

## 24. Publication chronology and post-publication verification

This section exists because earlier wording in this file stated Gate 10 PASS, 9/9 mandatory gates, and publication completed before the Owner commit and push existed. That historical wording is not deleted. It is corrected here by chronology. Gate 10 is PASS **now**, not because the pre-publication document said so.

### 24.1 Pre-publication staging (Gate 10 not yet factual)

During pre-publication staging:

- implementation, R1, and independent R1-FR review evidence had passed;
- Gate 7 was 372/372; runtime matrix 63/63; focused P1-D files in §15; onboarding/security 131 files / 1195 passed; serial Vitest 4119 passed / 2 failed / 4121 total; typecheck PASS; lint PASS; build PASS;
- the 41-path tree in §4 was staged for Owner publication;
- the Owner commit and ordinary fast-forward push were still pending;
- therefore Gate 10 was **not yet factually complete**.

### 24.2 Owner trailer-free commit

The Owner subsequently created the exact trailer-free commit:

| Field | Value |
| --- | --- |
| Hash | `2c4befa73f5b71b2b2a63732ca3885c7e356479c` |
| Subject | `feat(onboarding): enforce authenticated product admission` |
| Body | none |
| Trailers | none |
| Parent | `666165a2a075cc89d68a264a9099c2272c005d9e` |
| Statistics | 41 files changed, 2367 insertions(+), 114 deletions(-) |
| Changed paths | exactly the 41 governed paths in §4; no 42nd path |

This evidence-finalization edit does not amend that commit.

### 24.3 Ordinary fast-forward publication

The commit was subsequently published through an ordinary fast-forward to `origin/core/platform-readiness-20260707`. No force push, reset, rebase, or rewrite of `2c4befa73f5b71b2b2a63732ca3885c7e356479c` occurred.

### 24.4 Independent post-publication verification

Fresh `git fetch origin` was performed during this evidence-finalization step. Independent verification then observed:

| Check | Result |
| --- | --- |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| `git rev-parse HEAD` | `2c4befa73f5b71b2b2a63732ca3885c7e356479c` |
| `git rev-parse origin/core/platform-readiness-20260707` | `2c4befa73f5b71b2b2a63732ca3885c7e356479c` |
| `git rev-list --left-right --count origin/core/platform-readiness-20260707...HEAD` | `0 0` |
| `git status --short` | empty (before this evidence-only edit) |
| Commit subject | `feat(onboarding): enforce authenticated product admission` |
| Commit body / trailers | none |

Local HEAD and origin are the same commit. Divergence is `0 0`. The worktree was clean after publication.

### 24.5 Gate 10 after verification

`Gate 10 — PASS`
Owner trailer-free commit and ordinary fast-forward publication independently verified after publication.

`9/9 mandatory P1-D gates — PASS`

`PASS — ENG-ONB-1H-P1-D AUTHENTICATED PRODUCT ADMISSION AND EXPLICIT ENTRY CLOSED WITH EVIDENCE`

P1-D and the local/product application implementation are closed.

The complete ENG-ONB-1H program remains open until ENG-ONB-1H-PROD and ENG-ONB-1H-FV both pass.

Remaining phases:

1. `ENG-ONB-1H-PROD` — NOT STARTED
2. `ENG-ONB-1H-FV` — NOT STARTED

This evidence-finalization step does not start PROD or FV. It records publication facts only. The complete ENG-ONB-1H program is not closed. Production has not been verified. Final Verification has not been performed.
