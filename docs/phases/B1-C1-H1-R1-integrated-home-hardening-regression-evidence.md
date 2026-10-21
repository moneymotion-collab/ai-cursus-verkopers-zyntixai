# B1-C1-H1-R1 — Integrated Home Hardening Regression Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-R1 — Integrated Home Hardening Regression** |
| Date | 2026-09-14 |
| Branch | `core/platform-readiness-20260707` |
| Start SHA | `f7f2d65accd10d6ae6af6eb8d00c8d6b1d0c8c5f` |
| Upstream SHA | `f7f2d65accd10d6ae6af6eb8d00c8d6b1d0c8c5f` |
| Contract | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` |
| Product / CSS / test / config edits | **NONE in this slice** |
| Migrations | **NONE** |
| Commit / push | **NOT DONE** |
| Production browser QA | **NOT DONE** |
| Next phase | **B1-C1-H1-PROD**, not started |

```text
PASS — B1-C1-H1-R1 INTEGRATED HOME HARDENING VERIFIED
```

This evidence closes **only** R1. It does not close B1-C1-H1 as a whole, does
not start PROD or FV, and is not Production, onboarding, or public-web
verification.

---

## 1. Preflight

Read-only preflight on the pushed R1-C1 HEAD:

```powershell
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse "@{upstream}"
git fetch origin
git rev-list --left-right --count "HEAD...@{upstream}"
git diff --check
git diff --cached --check
```

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `f7f2d65accd10d6ae6af6eb8d00c8d6b1d0c8c5f` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Ahead/behind | `0 0` |
| `git fetch origin` | remote metadata only |
| Worktree | clean |
| Staging | empty |
| Untracked | none |
| `git diff --check` | clean |
| `git diff --cached --check` | clean |

No pull, merge, rebase, reset, restore, checkout, stash, cherry-pick, or
force operation was used.

---

## 2. Start SHA and upstream SHA

| Ref | SHA |
| --- | --- |
| Local HEAD | `f7f2d65accd10d6ae6af6eb8d00c8d6b1d0c8c5f` |
| `@{upstream}` | `f7f2d65accd10d6ae6af6eb8d00c8d6b1d0c8c5f` |

That commit is the pushed C1 correction:
`test(ui): reconcile skip-link responsive contract`.

---

## 3. Phase boundary

This slice verified only:

`B1-C1-H1-R1 — Integrated Home Hardening Regression`

Already closed and not reopened:

- B1-C1-H1-ADMISSION
- B1-C1-H1-TRUTH
- B1-C1-H1-SHELL
- B1-C1-H1-COMPOSITION
- B1-C1-H1-R1-C1

Not started and not closed:

- B1-C1-H1-PROD
- B1-C1-H1-FV
- onboarding
- public website
- Production deployment
- Production browser verification
- release readiness

B1-C1-H1 as a whole is **not** `CLOSED`.

---

## 4. Governing contracts and evidence read

Read from the repository before execution:

- `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md`
- `docs/phases/B1-C1-H1-ADMISSION-independent-home-admission-evidence.md`
- `docs/phases/B1-C1-H1-TRUTH-truthful-home-actions-evidence.md`
- `docs/phases/B1-C1-H1-SHELL-DESIGN-authenticated-home-visual-freeze.md`
- `docs/phases/B1-C1-H1-SHELL-responsive-authenticated-home-evidence.md`
- `docs/phases/B1-C1-H1-COMPOSITION-relevant-work-preservation-evidence.md`
- `docs/phases/B1-C1-H1-R1-C1-skip-link-responsive-contract-reconciliation-evidence.md`
- `src/app/(authenticated)/home/page.tsx`
- `src/app/(authenticated)/home/loading.tsx`
- `src/components/app-shell.tsx`
- `src/components/app-shell.module.css`
- `src/features/daily-operating/domain/compose-daily-operating-brief.ts`
- `src/features/daily-operating/server/load-daily-operating-page.ts`
- `src/features/daily-operating/ui/daily-operating-brief.tsx`
- `src/features/daily-operating/ui/daily-operating-organization-required-panel.tsx`
- `src/features/tasks/ui/resolve-task-page-organization.ts`
- `src/features/product-access/domain/module-registry.ts`
- `src/features/product-access/domain/module-access.ts`
- `tests/ui/tasks-ui-responsive-contract.test.ts`
- existing Vitest / Next lint / typecheck / build scripts in `package.json`

Named path `tests/features/attention` does not exist. Stage E used the
existing server, domain, and task paths specified in the assignment.

---

## 5. Integrated contract matrix

| Area | Contract | Integrated result |
| --- | --- | --- |
| Admission | `/home` uses independent Home admission | `HomePage` → `createSupabaseServerClient` → `loadDailyOperatingPage` → `resolveTaskPageOrganization(..., "home")`. |
| Admission | Tasks remains a separate module authority | Resolver default remains `moduleId = "tasks"`. Task list/detail/workflow omit the Home override. |
| Admission | Home admission does not invent a Tasks capability | `"home"` in `module-registry.ts` has `capabilityRequirement: null`. |
| Admission | Unresolved / fail-closed chrome | Unresolved visibility is Home-only (`FAIL_CLOSED_MODULE_NAV_VISIBILITY`). Synthetic unresolved QA showed Home + Log out. |
| Admission | No auth / membership / org / resolver regression | Focused admission and AppShell gating tests passed; auth-callback 9/9. |
| Truth | Calm only when Attention and Tasks succeed and nothing qualifies | `isDailyOperatingCalmState` requires both query flags false and `hasAnyActionable === false`. |
| Truth | Partial failure warns and never claims calm | Partial panel uses a warning Alert; the calm title is absent when either query failed. |
| Truth | Module actions from server-side visibility, max three | `resolveDailyOperatingCalmActions` from `moduleNavVisibility`; cap `DAILY_OPERATING_CALM_ACTION_LIMIT = 3`. |
| Truth | Hidden modules get no action or view-all | View-all hrefs are null when Attention/Tasks visibility is false. |
| Truth | `?org=` stays organization-aware | `buildDailyOperatingOrgQuery` appends `org` only when `organizationId` is non-empty. |
| Truth | Frozen copy exact | U+2019 subtitle, calm title, and supporting sentence unchanged. |
| Shell | One `h1` | Product Home chrome uses a single `Today` heading; synthetic QA counted `h1Count = 1` in every state. |
| Shell | Quiet centered `72rem` shell | Unchanged AppShell shell CSS. |
| Shell | Desktop Primary inline, existing order | Desktop cluster visible at 1440px; course-seller order Home → Leads → Customers → Programs → Enrollments → Progress → Attention → Tasks. |
| Shell | Mobile native `Menu` disclosure | `details`/`summary` Menu at 390px; desktop cluster `display: none` below 960px. |
| Shell | Authorized nav only | Course-seller populated nav; unresolved Home-only; pending no Primary. |
| Shell | Home `aria-current="page"` only on Home | Synthetic Home states: visible `aria-current` is Home. Pending has none. |
| Shell | Pending hides rounded Primary and Menu | Pending: `visibleNavItems = []`, `menuPresent = false`, copy `Loading workspace…`. |
| Shell | Skip-link first; focuses `main#main-content`; `tabIndex={-1}` | Keyboard: BODY → skip-link → Enter `#main-content` / `activeElement.id = main-content`. |
| Shell | No horizontal overflow at 390px or 1440px | `overflowDelta = 0` on both viewports for all measured states. |
| Shell | Controls ≥ 44px | Visible chrome and open-menu links met 44px height. Closed-disclosure descendants can report a 40×44 layout box while remaining out of tab order. |
| Shell | No sidebar, dashboard KPIs, shadows, or new product claims | Unchanged; brief remains section lists plus frozen copy. |
| Composition | Mixed Attention fetch cap of 25 must not return | Loader uses targeted `listAttentionItems` with `pageSize: DAILY_OPERATING_SECTION_LIMIT` (5). |
| Composition | DB eligibility before relevance/order/cap | Existing Attention/Task read queries remain the fetch boundary. |
| Composition | Section queries capped at 5 | `pagination: { page: 1, pageSize: DAILY_OPERATING_SECTION_LIMIT }`. |
| Composition | Owner/Admin org Attention critical/high | `ORGANIZATION_ATTENTION_SEVERITIES`; Staff/Viewer get `organizationAttentionQueries = []`. |
| Composition | Assigned-to-me allowed severities | critical/high/medium/low for admitted roles. |
| Composition | Staff/Viewer do not org-wide Attention-read | `canSeeOrganizationAttention` is owner/admin only. |
| Composition | Sort severity rank → `lastDetectedAt` → `id` | `compareAttentionRows` unchanged. |
| Composition | Tasks/timezone unchanged | `listTasks` overdue/due_today still membership-scoped; due-state tests passed. |
| Composition | Cross-org rows removed | Composer filters `item.organizationId === input.organizationId`. |
| Composition | Any required query error blocks calm | Merge `ok: false` sets `attentionQueryFailed`; task `ok: false` sets `tasksQueryFailed`. |
| Composition | User-scoped Supabase client; no service role | Home loader receives the request-scoped server client. No service-role usage in daily-operating. |
| R1-C1 | Responsive contract 13/13 | Stage A and the full suite include 13 passing responsive-contract tests. |
| R1-C1 | Only governed skip-link focus rule may use `position: fixed` | Selector set `{.skipLink:focus, .skipLink:focus-visible}` after brace-walk. Task CSS has no exception. |
| R1-C1 | `min-width`/`width` 900–999px declarations remain forbidden | Body-scoped regex after removing the validated skip-link rule. Nested `@media`/`@supports` still walked. |
| R1-C1 | AppShell product CSS not edited to make tests pass | Product CSS unchanged in C1 and unchanged in this R1. |

---

## 6. Environment hygiene

Process-level `NEXT_PUBLIC_SITE_URL` was **UNSET** before focused tests, before
the memory-safe full suite (`CHILD_NEXT_PUBLIC_SITE_URL=UNSET`), and after
visual QA.

The earlier loopback `SITE_URL` pollution was not present in this restart.

`.env.local` was not modified. No Production URL was assigned. No credentials,
cookies, storage state, or recovery tokens were loaded. Auth tests were not
edited.

The local visual-QA Next child used a dummy loopback Supabase URL so
middleware `getUser()` would not contact an external origin. Those child
variables were removed from the PowerShell process after the server stopped.
`NEXT_PUBLIC_SITE_URL` remained unset in that child.

---

## 7. Focused test results

Shared warning on npm-invoked commands: `Unknown env config "devdir"` (npmrc).
Not suppressed.

### Stage A — Responsive contract

```powershell
npx vitest run tests/ui/tasks-ui-responsive-contract.test.ts --reporter=verbose
```

| Field | Result |
| --- | --- |
| Exit | 0 |
| Passed | 13 |
| Failed | 0 |
| Skipped | 0 |
| Duration | 683ms |

### Stage B — AppShell and accessibility

```powershell
npx vitest run tests/ui/appshell-customers-terminology.test.tsx tests/ui/tasks-ui-accessibility.test.tsx --reporter=verbose
```

| Field | Result |
| --- | --- |
| Exit | 0 |
| Passed | 21 |
| Failed | 0 |
| Skipped | 0 |
| Duration | 3.31s |

### Stage C — Daily operating

```powershell
npx vitest run tests/features/daily-operating --reporter=verbose
```

| Field | Result |
| --- | --- |
| Exit | 0 |
| Files | 3 passed |
| Passed | 81 |
| Failed | 0 |
| Skipped | 0 |
| Duration | 1.81s |

### Stage D — Admission and product access

```powershell
npx vitest run tests/onboarding/product-admission-app-shell.test.ts tests/features/product-access/beta1-4tg-appshell-gating.test.ts --reporter=verbose
```

| Field | Result |
| --- | --- |
| Exit | 0 |
| Files | 2 passed |
| Passed | 14 |
| Failed | 0 |
| Skipped | 0 |
| Duration | 865ms (wall 2393ms) |

### Stage E — Attention, Tasks, and due-state

`tests/features/attention` does not exist. Command used:

```powershell
npx vitest run tests/server/attention-read-queries.test.ts tests/server/task-read-queries.test.ts tests/domain/due-state.test.ts tests/features/tasks --reporter=verbose
```

| Field | Result |
| --- | --- |
| Exit | 0 |
| Files | 5 passed |
| Passed | 38 |
| Failed | 0 |
| Skipped | 0 |
| Duration | 1.05s (wall 2668ms) |

### Stage F — Auth callback

```powershell
npx vitest run tests/auth/auth-callback.test.ts --reporter=verbose
```

| Field | Result |
| --- | --- |
| Exit | 0 |
| Passed | 9 |
| Failed | 0 |
| Skipped | 0 |
| Duration | 1.12s (wall 2678ms) |

---

## 8. Full-suite results

```powershell
npx vitest run --fileParallelism false --maxWorkers 1
```

| Field | Result |
| --- | --- |
| Exit | 1 |
| Test files | 2 failed / 532 passed (534) |
| Tests | 2 failed / 4194 passed (4196) |
| Skipped | 0 |
| Duration | 204.51s |

Order of magnitude matches the expected current suite: 534 files, 4196 tests,
4194 passed, two historical failures, zero skipped.

---

## 9. Historical-failure classification

Only the two already governed historical failures occurred. File names, test
names, and error signatures match the frozen historical records.

### Historical 1 — outside H1

- File: `tests/features/invitations/load-member-administration-page.test.ts`
- Test: `does not trust a foreign org id outside active memberships`
- Signature: spy expected `resolveOrgContextMock` with `{ supabase, organizationId }`; `Number of calls: 0`
- Classification: governed historical member-administration mismatch. Not an H1 regression.

### Historical 2 — outside H1

- File: `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`
- Test: `Progress no longer claims deferred tracking; Progress workspace language is present`
- Signature: expected enrollment detail source to contain `Progress for this enrollment is recorded and reviewed in the Progress workspace.`
- Classification: governed historical Progress stale-copy mismatch. Not an H1 regression.

No other failure. Signatures were not silently widened.

---

## 10. Responsive contract 13/13

Stage A: 13 passed / 0 failed / 0 skipped.

The C1 matcher still:

- walks nested `@media` / `@supports`;
- allows exactly one rule whose selector set is `{.skipLink:focus, .skipLink:focus-visible}` and that contains the required overlay declarations including `position: fixed`;
- runs the original regex on remaining style-rule bodies;
- scans all six original CSS targets;
- gives Task CSS no exception.

AppShell product CSS was not modified in this R1.

---

## 11. Auth callback 9/9

Stage F: 9 passed / 0 failed / 0 skipped, including the SITE_URL
canonical-origin case, with process `NEXT_PUBLIC_SITE_URL` unset.

---

## 12. Typecheck

```powershell
npm run typecheck
```

| Field | Result |
| --- | --- |
| Script | `tsc --noEmit` |
| Exit | 0 |
| Errors | none |
| Duration | ~7.6s |

---

## 13. Lint

Existing Next lint method, H1 TypeScript and related tests only:

```powershell
npx next lint --file "src/app/(authenticated)/home/page.tsx" --file "src/app/(authenticated)/home/loading.tsx" --file src/components/app-shell.tsx --file src/features/daily-operating/server/load-daily-operating-page.ts --file src/features/daily-operating/domain/compose-daily-operating-brief.ts --file src/features/daily-operating/ui/daily-operating-brief.tsx --file src/features/daily-operating/ui/daily-operating-organization-required-panel.tsx --file src/features/tasks/ui/resolve-task-page-organization.ts --file tests/features/daily-operating/compose-daily-operating-brief.test.ts --file tests/features/daily-operating/load-daily-operating-page.test.ts --file tests/features/daily-operating/daily-operating-brief-ui.test.tsx --file tests/ui/tasks-ui-responsive-contract.test.ts --file tests/ui/appshell-customers-terminology.test.tsx --file tests/ui/tasks-ui-accessibility.test.tsx --file tests/onboarding/product-admission-app-shell.test.ts
```

| Field | Result |
| --- | --- |
| Exit | 0 |
| ESLint | `No ESLint warnings or errors` |
| Existing warning | `next lint` is deprecated and will be removed in Next.js 16. Not suppressed or migrated in R1. |

---

## 14. Build

```powershell
npm run build
```

| Field | Result |
| --- | --- |
| Exit | 0 |
| Duration | 82.0s |
| Next.js | 15.5.20 |

Existing warnings, not suppressed and not repaired in R1:

1. Next lint deprecation (lint step above).
2. Autoprefixer on `src/features/social-media/ui/platform-closed-beta-operator-list.module.css` line 38: `end` value has mixed support, consider using `flex-end`.
3. webpack `PackFileCacheStrategy` skipped serializing that same `Warning` (`No serializer registered for Warning`).

These are historical Social-operator warnings, outside H1 product CSS.

---

## 15. Browser setup

Local synthetic authenticated-component QA only.

| Item | Value |
| --- | --- |
| Origin | `http://127.0.0.1:43128` |
| Bind | `127.0.0.1` only |
| Flag | `B1_C1_H1_VISUAL_QA=1` |
| Route | temporary encoded App Router folder mapping to `/__b1-c1-h1-visual?state=…` |
| Data | fictional Harbor Workshop fixtures only |
| Production credentials / cookies / storage / recovery | **not loaded** |
| External origins | **none observed** |
| Production | **forbidden and not used** |

The harness rendered existing `AppShell`, Home loading, Home page chrome, and
`DailyOperatingBriefPanel` behind the explicit QA flag. It is not
authenticated Production E2E admission.

Viewports: 1440×1000 and 390×844.

---

## 16. Browser state matrix

| State | Desktop 1440 | Mobile 390 |
| --- | --- | --- |
| populated | HTTP 200; one `h1`; Home current; full course-seller Primary inline | HTTP 200; Menu present, closed; same current Home |
| empty / calm | HTTP 200; frozen calm copy in brief; no overflow | HTTP 200; Menu collapsed |
| partial failure | HTTP 200; Attention warning; no calm title | HTTP 200 |
| error | HTTP 200; fail-closed Home-only Primary; error `h1` | HTTP 200; Menu present |
| pending | HTTP 200; `Loading workspace…`; no Primary; no Menu | HTTP 200; no Menu |
| unresolved / Home-only | HTTP 200; Primary = Home | HTTP 200; open Menu Primary = Home (Log out remains in disclosure actions) |
| desktop navigation | Inline Primary; Menu not presented | n/a |
| mobile Menu collapsed | n/a | `menuOpen = false`; closed descendants not in tab order |
| mobile Menu open | n/a | `menuOpen = true`; course-seller items + Home current |
| active Home | `aria-current="page"` on Home | same |
| focused skip-link | First Tab / explicit focus: “Skip to main content” | First Tab same |
| keyboard focus on Menu | n/a | Space/Enter open; close returns focus to `SUMMARY` Menu |

---

## 17. Viewport and overflow measurements

All measured states:

| Viewport | innerWidth | scrollWidth | overflowDelta |
| --- | --- | --- | --- |
| 1440×1000 | 1440 | 1440 | 0 |
| 390×844 | 390 | 390 | 0 |

Every measured state: `h1Count = 1`, `#main-content` count = 1,
`main#main-content.tabIndex = -1`.

Visible desktop populated navigation: Home (current), Leads, Customers,
Programs, Enrollments, Progress, Attention, Tasks.

Visible pending navigation: none.

Visible unresolved Primary: Home only.

Controls:

- Desktop: no undersized visible chrome or document controls.
- Mobile open Menu: no undersized chrome.
- Mobile closed disclosure: collapsed Primary links can still expose a 40×44
  layout box in a naive measurement. They are not in the tab order
  (`hiddenDescendantsInTabOrder = false`). Visible Menu / Log out / open-menu
  links remain 44px tall. This is not a new H1 product change.

---

## 18. Keyboard and focus results

### Desktop 1440×1000, populated

1. Fresh page: `activeElement` is `BODY`.
2. First Tab: skip-link (“Skip to main content”).
3. Enter: `location.hash = #main-content`.
4. `activeElement.id = main-content` (`MAIN`).
5. Next Tab: first interactive control in main = “View all Attention”.

### Mobile 390×844, populated

Skip sequence identical: BODY → skip-link → `#main-content` / `main-content` →
“View all Attention”.

Menu:

1. Closed tab order: Skip → Menu → first main controls. No closed-`details`
   descendants in the tab order.
2. Enter on Menu opens (`menuOpen = true`).
3. Space on Menu opens (`menuOpen = true`).
4. Next Tab from open Menu lands on Home; `aria-current="page"`; visible focus
   on the Home nav link.
5. Closing Menu keeps focus on `SUMMARY` Menu.
6. Unresolved open Primary shows only Home; Log out remains the disclosure
   action control.
7. Pending shows no Menu (`menuPresent = false`).

---

## 19. Console and network results

| Check | Result |
| --- | --- |
| Page errors | 0 |
| Failed Playwright request events | 0 |
| External resource origins | none |
| Console errors | 1: Chromium `Failed to load resource: … 404` for local `/favicon.ico` |

The favicon 404 is a local missing static asset on the loopback harness. It is
not an H1 product regression and not an external origin.

Dummy loopback Supabase was configured so middleware would not call an
external host. No Production project ref was used in this QA.

---

## 20. Screenshot register

Stored locally outside the repository at `[LOCAL-QA-DIRECTORY-REDACTED]`.
Sixteen PNG files. SHA-256:

| File | SHA-256 |
| --- | --- |
| `desktop-1440-populated.png` | `7b5501ae0393616229f4e823f06a835f2bbae8eb97892448c2e0692b89cb40c0` |
| `desktop-1440-skip-link-focused.png` | `f19970cb02c0eedc197a3f00b5bf8a777b42dcfae8281416bdaa01519744851b` |
| `desktop-1440-empty.png` | `74566ebbec1270005bf499e98050233c7066825650777c36d8650068aa59db38` |
| `desktop-1440-partial.png` | `4b560591fbca4e83c44eb0239990f608ce53bf6cd7c7ea56930555bd67433b67` |
| `desktop-1440-error.png` | `76f81e8a164575fc22210ec0af9ebd62a3fba5362ef4b71164ac6e617038f816` |
| `desktop-1440-pending.png` | `f8916f921a78fc725cd7f0d8001333e49132ce805cd8794821952488d6c2846d` |
| `desktop-1440-unresolved.png` | `4240bd404ad95c062ab373c9194da9c9183f391e4b4c5418e03f3e2a935faa45` |
| `mobile-390-populated.png` | `d8d50670f5247051f5971a041de84ba0d7af95ce82147bfa5d41c3db4f746c04` |
| `mobile-390-populated-menu-open.png` | `6dad3b34068f13d620fc4b3a75a7f089979d43603be95430af484baa0f6f3ae9` |
| `mobile-390-empty.png` | `3bfb47cc2bb3a1611aa1f5e551012742512074709504cadbe5bd0382b1a75ccb` |
| `mobile-390-partial.png` | `bda9ef46eb659c1581f48688485f512b8887c2ca6688b009b1f67447e7ca0a7f` |
| `mobile-390-error.png` | `64772c450d8881000dcce791632a9db421f5616e1e8fce14750e64969dc97d07` |
| `mobile-390-pending.png` | `fd11ac48fb6f17e389400f6e4ce44f72779a62ab8f3e1ca7b14f0a25fb10bb74` |
| `mobile-390-unresolved.png` | `99110e73fe2b3bebd43cb3079916b487411ad1913bca3674e44ee4e2321cba5c` |
| `mobile-390-menu-keyboard.png` | `0da48c0a22f4541a74be4ca0806b2ed96d1a40f3fe5ce127863e639058f77821` |
| `mobile-390-unresolved-menu-open.png` | `4e3390830aae647a999b9029043e0fb24079e14a78087a89aa2c97db8aa2dc66` |

These screenshots are objective local synthetic records. They are not a new
human visual-review close of SHELL and not Production browser evidence.

---

## 21. Cleanup

| Step | Result |
| --- | --- |
| Stop Next visual-QA server | stopped |
| Port 43128 | free |
| Temporary harness directory | removed |
| Temporary Playwright runner | remained outside the repository only |
| Process `NEXT_PUBLIC_SITE_URL` | UNSET |
| Dummy visual-QA Supabase process vars | removed |
| Worktree after cleanup, before evidence | clean |

No harness, generated output, or Playwright runner remains in the repository.

---

## 22. Diff / security review

This R1 slice changed no product, test, CSS, config, dependency, or migration.
The only repository file added after verification is this evidence document.

Reviewed H1 range `5f501be..f7f2d65` plus C1 `f7f2d65`:

| Commit | Subject | Security note |
| --- | --- | --- |
| `5f501be` | independent Home admission | Home uses `moduleId: "home"`; Tasks default remains `"tasks"`. |
| `6082c86` | truthful Home actions | Actions derived from server visibility; no invented org fallback. |
| `ee5e7f9` | SHELL design freeze | Docs only. |
| `44e25f6` | responsive authenticated shell | Skip-link + `main#main-content` `tabIndex={-1}`; no new auth surface. |
| `6b6cfcb` | relevant brief composition | User-scoped client; targeted queries; no service role; cap 5. |
| `f7f2d65` | skip-link responsive contract | Test-only C1; product CSS unchanged. |

No new public endpoint, no credential handling change, no RLS/migration, no
Production cookie/storage use, and no weakening of fail-closed unresolved
chrome.

---

## 23. Rollback

R1 itself is evidence-only. Discarding this file restores the pre-R1
worktree at `f7f2d65`.

Product rollback of closed H1 slices, if ever required, remains revert of
the H1 implementation commits listed above. This slice did not amend those
commits.

---

## 24. Explicit non-claims

- B1-C1-H1 as a whole is not `CLOSED`.
- B1-C1-H1-PROD was not started.
- B1-C1-H1-FV was not started.
- Onboarding was not started or reopened.
- Public website work was not started.
- Production deployment was not performed.
- Production browser verification was not performed.
- Release readiness is not claimed.
- Local synthetic harness QA is not authenticated Production E2E admission.
- The two historical suite failures remain outside H1 and are not fixed here.
- Historical Next lint deprecation and Social CSS autoprefixer/webpack cache
  warnings remain and were not suppressed.

---

## 25. Next phase

`B1-C1-H1-PROD`, not started.
