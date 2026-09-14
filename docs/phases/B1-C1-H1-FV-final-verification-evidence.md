# B1-C1-H1-FV — Authenticated Home Hardening Final Verification Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-FV — Authenticated Home Hardening Final Verification** |
| Date | 2026-09-14 |
| Branch | `core/platform-readiness-20260707` |
| Local / origin HEAD | `f799389452a6b597cf5cabad3d83bd3e567a5308` |
| Deployed product SHA | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Production deployment | `dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz` |
| Canonical host | `https://www.zyntixai.com` |
| Contract | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` §12.7 |
| Product / CSS / test / config edits in this slice | **NONE** |
| Commit / push / tag | **NOT DONE in this slice** |
| Deploy / promote / rollback | **NOT DONE** |
| New authenticated login | **NOT DONE** |

```text
PASS — B1-C1-H1-FV DAILY OPERATING HOME HARDENING CLOSED WITH EVIDENCE
```

This evidence closes **only** the FV verification dossier. It does **not** yet
declare:

```text
CLOSED WITH EVIDENCE — B1-C1-H1 AUTHENTICATED HOME HARDENING
```

That parent-program line is allowed only after independent review and a
separate commit/push of this file. Onboarding, public website, and general
release readiness are not closed.

FV did not run a new headed bootstrap or authenticated Playwright gate. The
authoritative 3/3 `npm run test:browser:b1-c1` result is the committed
PROD-C1 record.

---

## 1. Preflight

| Check | Result |
| --- | --- |
| Root | expected worktree |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `f799389452a6b597cf5cabad3d83bd3e567a5308` |
| Upstream | same SHA |
| Ahead/behind | `0 0` |
| `git fetch origin` | metadata only |
| Worktree | clean |
| Staging | empty |
| Untracked | none before this file |
| Process `NEXT_PUBLIC_SITE_URL` | `UNSET` |

---

## 2. Governing authority

H1 contract §12.7: final verification that §18 AND-gates pass; evidence
dossier; no new product scope; `HEAD = upstream` `0 0`. PASS line as above.

T15 remaining authority for authenticated Production Home is
`npm run test:browser:b1-c1`, already reconciled and recorded in PROD-C1.

---

## 3. Complete authority-chain matrix

| Slice | Governing requirement | Commit SHA | Evidence | Status |
| --- | --- | --- | --- | --- |
| Contract | Slice allowlists; §12; T15 | `be7f537bfcbb5dc22922b94b642e31e057c56046` | this contract | frozen |
| ADMISSION | `moduleId: "home"`; Tasks default preserved | `5f501befbbfc95e5491b048861de229dd3e82ae1` | ADMISSION evidence | PASS |
| TRUTH | Frozen subtitle/calm; server-visible actions ≤ 3 | `6082c866c09c0688fa7116fcc6736eafc9fda854` | TRUTH evidence | PASS |
| SHELL-DESIGN | Visual freeze | `ee5e7f94c246439eb292624f7812ae74167440e3` | SHELL-DESIGN | frozen |
| SHELL | Responsive AppShell; Menu; skip-link | `44e25f634417219762f1aabbb83629dad4be1a1b` | SHELL evidence | PASS |
| COMPOSITION | No mixed cap 25; eligibility before compose | `6b6cfcb7cd80fc6f176fbfa7216cb7c2e2717b74` | COMPOSITION evidence | PASS |
| R1-C1 | Skip-link overlay exception only | `f7f2d65accd10d6ae6af6eb8d00c8d6b1d0c8c5f` | R1-C1 evidence | PASS |
| R1 | Integrated regression | `d110b6e3da5c690b31a68a0b145b7b6521c10828` | R1 evidence | PASS |
| PROD | Authenticated Production Home | product SHA `d110b6e3…`; evidence in `f799389…` | PROD evidence | PASS |
| PROD-C1 | Helper + mobile Menu contract | `f799389452a6b597cf5cabad3d83bd3e567a5308` | PROD-C1 evidence | PASS |
| FV | This dossier | uncommitted this file | this file | PASS pending review/commit |

Chain: ADMISSION → TRUTH → SHELL-DESIGN → SHELL → COMPOSITION → R1-C1 → R1 →
PROD → PROD-C1 → FV. No closed slice reopened.

---

## 4. Commit- and evidence-register per slice

Implementation areas and principal tests remain those recorded in each
closed evidence file. Non-claims common to all slices: not onboarding
closure; not public-web redesign; not `RELEASE READY`; H1 program not
`CLOSED` until this FV file is independently reviewed and committed.

Open warnings carried forward: icon 404s; Social CSS autoprefixer `end`;
webpack cache serialization of that Warning; Next lint deprecation; two
historical full-suite failures outside H1.

---

## 5. Current local and upstream SHA

Local HEAD and `origin/core/platform-readiness-20260707`:
`f799389452a6b597cf5cabad3d83bd3e567a5308`. Ahead/behind `0 0`.

---

## 6. Current Production deployment and deployed SHA

| Field | Value |
| --- | --- |
| Deployment ID | `dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz` |
| Status | Ready |
| Target | production |
| Immutable URL | `https://zyntixai-d6el9vl1s-guus-projects-ai.vercel.app` |
| Canonical | `https://www.zyntixai.com` inspects to that deployment |
| Deployed product SHA | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |

`f799389…` is **not** claimed deployed.

---

## 7. Test/docs-only SHA-equivalence analysis

Range `d110b6e3…..f799389…`:

```text
A  docs/phases/B1-C1-H1-PROD-C1-authoritative-browser-contract-reconciliation-evidence.md
A  docs/phases/B1-C1-H1-PROD-production-home-verification-evidence.md
M  tests/browser/b1-c1-production-home.mobile.spec.ts
M  tests/browser/b1-c5-production-product-polish.desktop.spec.ts
M  tests/browser/helpers/daily-operating.ts
A  tests/ui/daily-operating-browser-helper-contract.test.ts
```

`git diff --exit-code` clean for `src`, `package.json`, `package-lock.json`,
`playwright.config.ts`, `vercel.json`, `supabase/migrations`, and Next/TS
config. Productcode and runtime configuration are equivalent. A redeploy of
HEAD would not change product runtime; **this FV slice does not redeploy**.

---

## 8. ADMISSION verification

HEAD still calls `resolveTaskPageOrganization(supabase, orgParam, "home")`.
Shared resolver default remains `moduleId: ProductModuleId = "tasks"`. Fail-closed
module visibility unchanged. No invented Tasks capability on Home. Admission
tests 14/14 passed.

---

## 9. TRUTH verification

Frozen subtitle `Priority Attention and due work in today’s brief.` remains
the only active Today subtitle in product and helper. Retired
`What needs attention and what you need to do next.` and
`You are clear for now.` are absent from `src/features/daily-operating`.
Calm still requires successful empty sources. Action cap 3. Daily-operating
suite 81/81.

---

## 10. SHELL verification

`AppShell` has no `"use client"`. Dual presentation copies; mobile native
`<details>`/`Menu`; desktop cluster `display: none` below 960px; pending hides
Primary and Menu; skip-link precedes header and focuses `#main-content`.
AppShell/a11y tests 21/21. Overflowdelta 0 and 1440/390 measurements remain in
SHELL/R1/PROD evidence.

---

## 11. COMPOSITION verification

No mixed Attention query capped at 25. Separate severity queries; section
limit `DAILY_OPERATING_SECTION_LIMIT = 5`. Owner/Admin org critical/high;
assigned Attention per allowed severity; Staff/Viewer skip org-wide query.
User-scoped Supabase client; no service-role in the Home loader. COMPOSITION
tests remain in the 81 daily-operating set.

---

## 12. R1-C1 verification

Only `.skipLink:focus` and `.skipLink:focus-visible` use `position: fixed`.
Responsive contract 13/13. Task CSS has no overlay exception.

---

## 13. R1 verification

R1 recorded integrated gates, the two historical full-suite failures, and
honest cleanup. FV reproduced the same two failures (see §18). No new H1
failure.

---

## 14. PROD verification

Authenticated Production Home on canonical `https://www.zyntixai.com` was
verified on product SHA `d110b6e3…`, deployment `dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz`.
No Production write or service-role. Icon 404s recorded. Rollback candidate
documented, not executed.

---

## 15. PROD-C1 verification

Helper and C5 inline subtitle restored to the frozen string. Mobile spec
follows sealed closed/open Menu. Product remained byte-identical.
`npm run test:browser:b1-c1`: 3 collected / 3 passed / 0 failed / 0 skipped.
Temporary auth-state deleted. No redeploy.

---

## 16. Focused test matrix

Process `NEXT_PUBLIC_SITE_URL`: `UNSET`. No config changes.

| ID | Command | Files | Passed | Failed | Skipped | Duration | Exit |
| --- | --- | ---: | ---: | ---: | ---: | --- | ---: |
| A | `tasks-ui-responsive-contract.test.ts` | 1 | 13 | 0 | 0 | 1.13s | 0 |
| B | AppShell + tasks a11y | 2 | 21 | 0 | 0 | 4.39s | 0 |
| C | helper contract | 1 | 2 | 0 | 0 | 2.13s | 0 |
| D | `tests/features/daily-operating` | 3 | 81 | 0 | 0 | 3.83s | 0 |
| E | admission + AppShell gating | 2 | 14 | 0 | 0 | 1.79s | 0 |
| F | Attention/Tasks/due-state (see note) | 5 | 38 | 0 | 0 | 1.58s | 0 |
| G | `tests/auth/auth-callback.test.ts` | 1 | 9 | 0 | 0 | 1.42s | 0 |

`tests/features/attention` does not exist. F used
`tests/server/attention-read-queries.test.ts`,
`tests/server/task-read-queries.test.ts`,
`tests/domain/due-state.test.ts`, and `tests/features/tasks`.

---

## 17. Full-suite result

```text
npx vitest run --fileParallelism false --maxWorkers 1
```

| Field | Result |
| --- | --- |
| Exit | 1 |
| Test files | 2 failed / 533 passed (535) |
| Tests | 2 failed / 4196 passed (4198) |
| Skipped | 0 |
| Duration | 198.75s |

Relative to R1 (534 files / 4196 tests): +1 file and +2 tests from the
PROD-C1 helper contract. No third failure. No H1 suite file failed.

---

## 18. Historical-failure classification

Exact match to R1:

1. `tests/features/invitations/load-member-administration-page.test.ts` —
   `does not trust a foreign org id outside active memberships` —
   spy `Number of calls: 0`. Outside H1.
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` —
   `Progress no longer claims deferred tracking; Progress workspace language is present` —
   missing `Progress for this enrollment is recorded and reviewed in the Progress workspace.`
   Outside H1.

Not skipped or todo’d. Not H1 blockers.

---

## 19. Typecheck result

`npm run typecheck` (`tsc --noEmit`) exit 0.

---

## 20. Lint result

Quoted `npx next lint --file …` on Home loader, compose domain, AppShell,
Home page/loading, helper, mobile spec, helper contract, responsive contract,
AppShell tests, and daily-operating loader tests: exit 0, no ESLint errors.
Known Next deprecation: `next lint` will be removed in Next.js 16.

---

## 21. Build result

`npm run build` exit 0. Compiled successfully. Known warnings only:

- Autoprefixer `end` vs `flex-end` in
  `src/features/social-media/ui/platform-closed-beta-operator-list.module.css`.
- Webpack cache: skipped not-serializable Warning for that same CSS module.

`.next` remains gitignored. Not staged.

---

## 22. Production read-only smokecheck

Unauthenticated `curl -sI --max-redirs 0`:

| URL | Result |
| --- | --- |
| `https://zyntixai.com/` | 308 → `https://www.zyntixai.com/`; HSTS |
| `https://www.zyntixai.com/` | 307 → `/login`; HSTS |
| `https://www.zyntixai.com/login` | 200 HTML; HSTS |
| `https://www.zyntixai.com/home` | 307 → `/login?next=%2Fhome`; HSTS |
| `/favicon.ico` | 404 (historical) |
| `/apple-touch-icon.png` | 404 (historical) |

No 5xx, no redirect loop, no localhost Location. `vercel inspect` of
`https://www.zyntixai.com`: Ready production `dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz`.

---

## 23. Accessibility and responsive evidence assessment

Committed SHELL/R1/PROD evidence already records 1440×1000 and 390×844,
overflowdelta 0, one `h1` Today, one `main#main-content`, skip-link focus,
closed/open Menu, Home current, authorized order, pending without Menu/Primary,
unresolved Home-only, keyboard flow. Local screenshot files were not required
for this FV; hashes remain in PROD/R1/SHELL registers outside Git.

---

## 24. Authenticated browser evidence assessment

PROD-C1: `npm run test:browser:b1-c1` 3/3 on canonical Production with Playwright
1.62.1 Chromium after a fresh gitignored Owner storage state, then deleted.
Desktop Attention view-all read-only; mobile sealed Menu; tablet readable.
FV did not repeat login.

---

## 25. Security/privacy assessment

No service-role in Home loader. No migration, schema, dependency, auth-surface,
capability-ID, route-authority, or deploy-config change in H1 or the
`d110b6e3…..f799389…` range. No cookies, tokens, JWTs, passwords, org UUIDs,
Supabase keys, storage-state, screenshots, or traces in Git. Cross-org and
hidden-module protections remain in admission/composition tests.

---

## 26. Open-item classification

| Finding | Classification | H1 blocker | Later owner |
| --- | --- | --- | --- |
| `/favicon.ico` 404 | Historical public-web/brand | No | public-web / brand follow-up |
| `/apple-touch-icon.png` 404 | Same | No | public-web / brand follow-up |
| Social CSS autoprefixer `end` | Pre-existing build warning | No | Social CSS, not H1 |
| Webpack cache Warning serialization | Same CSS Warning object | No | tooling |
| Next lint deprecation | Tooling | No | lint migration |
| Member-admin spy-calls-0 | Historical full-suite, outside H1 | No | invitations |
| Progress workspace copy test | Historical full-suite, outside H1 | No | enrollments/Progress copy |
| Production SHA `d110b6e3…` vs HEAD `f799389…` | Test/docs-only; product equivalent | No | no redeploy in FV |

---

## 27. Git diff and repository-scope review

Before this file: worktree clean, staging empty, HEAD `f799389…` `0 0`.
This slice adds only this untracked evidence file. No screenshots, reports,
auth-state, or generated output in Git.

---

## 28. Cleanup

No new auth-state created. Playwright reports not generated. `.next` leftover
from the FV build is gitignored and unstaged. Browser contexts not opened for
login.

---

## 29. Exact phase boundary

```text
PASS — B1-C1-H1-FV DAILY OPERATING HOME HARDENING CLOSED WITH EVIDENCE
```

Not used in this execution:

```text
CLOSED WITH EVIDENCE — B1-C1-H1 AUTHENTICATED HOME HARDENING
```

H1 as a program remains open until this file is independently reviewed,
committed, and pushed. FV did not start other product phases.

---

## 30. Next governed action

Independent read-only review of this FV evidence, then a separate
commit/push of **only**
`docs/phases/B1-C1-H1-FV-final-verification-evidence.md`.
No product change, login, or Production deploy in that follow-on unless a
later governing prompt explicitly authorizes it.
