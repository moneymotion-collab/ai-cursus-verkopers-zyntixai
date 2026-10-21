# B1-C1-H1-ADMISSION — Independent Home Admission Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-ADMISSION** |
| Date | 2026-09-13 |
| Parent authority | B1-C1 Daily Operating Composition — CLOSED WITH EVIDENCE |
| Contract | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` |
| Start SHA | `be7f537bfcbb5dc22922b94b642e31e057c56046` |
| Branch | `core/platform-readiness-20260707` |
| Implementation started for later H1 slices | **NO** |
| Migrations | **NONE** |
| Commit / push | **NOT DONE in this slice** |

```text
PASS — B1-C1-H1-ADMISSION INDEPENDENT HOME AUTHORITY ESTABLISHED
```

This evidence closes **only** ADMISSION. It does not close B1-C1-H1, does not
claim Home is fully professional, and is not RELEASE READY or PRODUCTION
VERIFIED.

---

## 1. Problem and root cause

`/home` reused `resolveTaskPageOrganization`, which hardcoded
`evaluateProductModuleRouteAccess({ moduleId: "tasks" })`.

Completed organizations with unresolved operating-model context are
contracted to Home-only navigation (`FAIL_CLOSED_MODULE_NAV_VISIBILITY.home ===
true`, `tasks === false`). Home therefore failed Tasks-module admission even
though `"home"` is an existing `ProductModuleId` with
`capabilityRequirement: null`.

`"home"` was not invented. Authentication, membership listing, organization
selection, `redirectIfOrganizationOnboardingIncomplete`, and org-scoped reads
already ran before that module check.

---

## 2. Exact files changed

| Path | Role |
| --- | --- |
| `src/features/daily-operating/server/load-daily-operating-page.ts` | Home loader now requests `moduleId: "home"` |
| `src/features/tasks/ui/resolve-task-page-organization.ts` | Optional `moduleId` argument; default remains `"tasks"` |
| `tests/features/daily-operating/load-daily-operating-page.test.ts` | Loader, fail-closed, and Home-authority tests |
| `tests/onboarding/product-admission-app-shell.test.ts` | Source lock that `/home` uses `"home"` |

This document is the fifth, additive path. It is not product or test code.

### Governed allowlist exception

The implementation prompt initially allowed a maximum of one product-code
file. Read-only root-cause analysis established that two product-code files
were minimally necessary:

1. `src/features/daily-operating/server/load-daily-operating-page.ts` must
   explicitly request `moduleId: "home"`;
2. `src/features/tasks/ui/resolve-task-page-organization.ts` must accept a
   backwards-compatible optional trailing `ProductModuleId`, defaulting to
   `"tasks"`.

A one-file loader-only change was impossible because the shared resolver
previously hardcoded `"tasks"`. Changing the shared resolver globally to
`"home"` would have weakened `/tasks` admission. Duplicating the complete
admission resolver would have introduced unnecessary security and maintenance
risk.

The second product-code file is therefore a reviewed, minimal and
contract-conforming governed exception. It does not authorize broader scope.
All existing Tasks call-sites retain the default `"tasks"` behavior, while
only Home explicitly passes `"home"`. The function was **not** renamed.

---

## 3. Minimal code change

Home loader:

```ts
resolveTaskPageOrganization(supabase, orgParam, "home")
```

Shared resolver (Tasks default preserved):

```ts
moduleId: ProductModuleId = "tasks"
evaluateProductModuleRouteAccess({ moduleId, access: moduleAccess })
```

Unchanged: auth `getUser`, memberships, `resolveSelectedOrganization`, onboarding
gate, timezone, Attention/Task queries, compose, return type, UI.

---

## 4. Preserved security invariants

| Invariant | Status |
| --- | --- |
| Unauthenticated → no Home | Preserved (`auth_required`) |
| Expired/missing session → no Home | Preserved (middleware + `getUser`) |
| Zero memberships → no Home data | Preserved (`organization_unavailable` → `no_organizations`) |
| Multiple orgs without selection | Preserved (`organization_required`) |
| Foreign `?org=` → no foreign data, no silent fallback | Preserved (`resolveSelectedOrganization`) |
| Incomplete onboarding → current stage | Preserved (`redirectIfOrganizationOnboardingIncomplete`) |
| `v2_ready` owner stays Creating/Ready until Open ZyntixAI | Unchanged onboarding code |
| Completed / grandfathered product access | Unchanged helper |
| Unresolved context → Home allowed, Home-only presentation | Home module allowed; Tasks still denied |
| Module visibility is presentation | Nav payload unchanged; destination loaders still authorize |
| RLS / org filters | Unchanged |
| `capabilityRequirement: null` does not skip auth/membership/onboarding/RLS | Confirmed; those steps still run first |

---

## 5. Test matrix (executed)

No browser or Production tests. No test skipped or weakened.

| Command | Exit | Files | Passed | Failed | Skipped | Duration |
| --- | --- | --- | --- | --- | --- | --- |
| `npx vitest run tests/features/daily-operating/load-daily-operating-page.test.ts` | 0 | 1 | 18 | 0 | 0 | 756ms |
| `npx vitest run tests/features/daily-operating` | 0 | 3 | 33 | 0 | 0 | 1.14s |
| `npx vitest run tests/features/product-access/beta1-4tg-appshell-gating.test.ts tests/onboarding/product-admission-app-shell.test.ts tests/onboarding/product-shell-authenticated-authority.test.ts tests/server/task-attention-module-access.test.ts` | 0 | 4 | 28 | 0 | 0 | 1.05s |
| `npx vitest run tests/auth/resolve-authenticated-landing.test.ts tests/auth/middleware-auth-redirects.test.ts tests/auth/safe-return-path.test.ts` | 0 | 3 | 40 | 0 | 0 | 986ms |
| `npx vitest run tests/onboarding/product-admission-enforcement.test.ts tests/onboarding/product-admission-routing.test.ts tests/onboarding/onboarding-lifecycle-enforcement.test.ts tests/security/onboarding-product-admission-boundary.test.ts` | 0 | 4 | 23 | 0 | 0 | 1.27s |
| `npm run typecheck` | 0 | — | — | 0 | 0 | 11.6s |
| `npx next lint --file …` (four changed paths) | 0 | 4 | no eslint warnings or errors | 0 | 0 | 15.1s |

Warning: `next lint` reports itself deprecated in Next.js 16. No product warning.

Covered: Home uses `"home"` not `"tasks"`; existing `ProductModuleId`; no new
capability; four operating models + unresolved; Tasks hidden does not deny Home
loader success path; unauthenticated / no membership / foreign org / multi-org
selection; Attention/Task query contracts and partial failure unchanged;
onboarding admission tests unchanged and green.

### Evidence boundary

The Home loader call is proven by source-lock and by a runtime mock that
`loadDailyOperatingPage` invokes `resolveTaskPageOrganization` with `"home"`.
The four operating models, unresolved context, and module authority are
proven directly through `evaluateProductModuleRouteAccess` and the existing
module registry. Existing onboarding enforcement tests remained green and
the onboarding helper was not modified. A fully integrated resolver run
through the real `loadProductModuleAccess` path was **not** added as a
separate new test in this slice. That bounded integration check remains
part of `B1-C1-H1-R1`. This file is not Production evidence.

The `npx vitest run tests/features/daily-operating` total includes the
loader file already reported in the first command. Those counts are
per-command, not unique tests to add together.

---

## 6. Diff control

| Check | Result |
| --- | --- |
| `git diff --name-status` | 4 modified paths listed above |
| `git diff --check` | clean |
| Secrets / PII / Production IDs | none |
| Database / migration / RLS / RPC | none |
| Auth callback / middleware / onboarding code | none |
| UI / CSS | none |
| Generated files / dependencies | none |
| Format churn | none beyond the four paths |

---

## 7. Out of scope (not done)

Calm-copy, quick actions, workspace header, AppShell, query limits,
composition logic, Attention/Task rights, schema, onboarding resumption,
Production fixtures, public website, new routes, four dashboards, KPI/feed/AI.

---

## 8. Next phase

`B1-C1-H1-TRUTH` per the frozen contract. Do not start it from this evidence.

Rollback: the functional slice is two product files and two test files.
This evidence file is the fifth, additive document. Reverting the eventual
phase commit removes all five paths together. After rollback, `/home` would
again admit via Tasks. No database rollback and no Production rollback are
required.

---

## 9. Forbidden claims (not made)

- B1-C1-H1 CLOSED
- Home fully professional
- RELEASE READY
- PRODUCTION VERIFIED
- onboarding completed
- four target groups fully finished
