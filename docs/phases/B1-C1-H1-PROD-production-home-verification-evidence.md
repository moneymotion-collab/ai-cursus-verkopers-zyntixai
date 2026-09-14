# B1-C1-H1-PROD — Production Home Verification Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-PROD — Governed Production Deployment and Authenticated Home Verification** |
| Date | 2026-09-14 |
| Branch | `core/platform-readiness-20260707` |
| Start SHA | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Upstream SHA | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Canonical domain | `https://www.zyntixai.com` |
| Contract | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` §12.6 |
| Product / CSS / test / config / dependency / migration edits | **NONE** |
| Commit / push / tag | **NOT DONE in this slice** |
| Next phase | **B1-C1-H1-FV — NOT STARTED** |

```text
PASS — B1-C1-H1-PROD AUTHENTICATED PRODUCTION HOME HARDENING VERIFIED
```

This evidence closes **only** `B1-C1-H1-PROD`. It does not close B1-C1-H1 as a
whole, does not start FV, and is not onboarding, public-web, or general
release-readiness verification.

H1 contract §12.6 requires the PASS line above. The earlier assignment phrasing
`PASS — B1-C1-H1-PROD PRODUCTION HOME VERIFIED` is not used. Uncommitted
`B1-C1-H1-PROD-C1` reconciles the stale Playwright helper and the pre-SHELL
mobile Primary-nav assertion; product source and the deployed runtime remain
SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828`. No redeploy was performed for
that test-only correction.

---

## 1. Preflight

Read-only preflight before any Production change:

```powershell
git status --short
git branch --show-current
git rev-parse --show-toplevel
git rev-parse HEAD
git rev-parse "@{upstream}"
git fetch origin
git rev-parse "@{upstream}"
git rev-list --left-right --count "HEAD...@{upstream}"
git diff --check
git diff --cached --check
git ls-files --others --exclude-standard
```

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Repository root | expected worktree |
| HEAD | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Ahead/behind | `0 0` |
| `git fetch origin` | remote metadata only |
| Worktree | clean |
| Staging | empty |
| Untracked | none |
| `git diff --check` | clean |
| `git diff --cached --check` | clean |
| Process `NEXT_PUBLIC_SITE_URL` | `UNSET` |

No pull, merge, rebase, reset, restore, checkout, stash, cherry-pick, or
force operation was used.

---

## 2. Start SHA

| Ref | SHA |
| --- | --- |
| Local HEAD | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| `@{upstream}` | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |

Subject: `test(home): verify integrated home hardening regression` (R1 evidence
only). Parent product/C1 SHA remains `f7f2d65accd10d6ae6af6eb8d00c8d6b1d0c8c5f`.

---

## 3. Authority chain

Read before deploy, not reopened:

| Artifact | Role |
| --- | --- |
| `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` | H1 contract; §12.6 PROD |
| `docs/phases/B1-C1-H1-ADMISSION-independent-home-admission-evidence.md` | Closed ADMISSION |
| `docs/phases/B1-C1-H1-TRUTH-truthful-home-actions-evidence.md` | Closed TRUTH; frozen subtitle |
| `docs/phases/B1-C1-H1-SHELL-DESIGN-authenticated-home-visual-freeze.md` | SHELL design freeze |
| `docs/phases/B1-C1-H1-SHELL-responsive-authenticated-home-evidence.md` | Closed SHELL |
| `docs/phases/B1-C1-H1-COMPOSITION-relevant-work-preservation-evidence.md` | Closed COMPOSITION |
| `docs/phases/B1-C1-H1-R1-C1-skip-link-responsive-contract-reconciliation-evidence.md` | Closed R1-C1 |
| `docs/phases/B1-C1-H1-R1-integrated-home-hardening-regression-evidence.md` | Closed R1 |
| `docs/phases/B1.5-DEPLOY-programs-and-enrollments-controlled-production-deployment.md` | Authoritative candidate-then-promote workflow |
| `vercel.json` | `{ "crons": [] }` only; no new deploy method |
| Home / AppShell / daily-operating implementation at HEAD | Verified as already sealed |
| `tests/browser/b1-c1-production-home.*.spec.ts` and `playwright.config.ts` | Existing Production browser harness |

Authoritative Production workflow remains B1.5 candidate-then-promote:

1. `npx vercel deploy --prod --yes --skip-domain --project zyntixai --scope guus-projects-ai` with git metadata
2. `npx vercel inspect` / API metadata
3. `npx vercel promote <deploymentId> --scope guus-projects-ai --yes`

No new deployment method was introduced.

---

## 4. Deployment authority

| Field | Result |
| --- | --- |
| CLI | Cached Vercel CLI `56.3.1` via `npx --no-install` (not installed or updated) |
| Scope | `guus-projects-ai` |
| Project | `zyntixai` |
| Local `.vercel` project name | `zyntixai` (already linked; not rewritten) |
| Canonical hostname inspect | `https://www.zyntixai.com` resolved on project `zyntixai` |
| Session | Existing authenticated Vercel session; sufficient to deploy that exact project |
| Other project with the worktree name | Observed and **not used** |

Tokens, personal account names, and credentials are omitted.

---

## 5. Pre-deployment Production reference

Inspect of `https://www.zyntixai.com` and `https://zyntixai.vercel.app` before
mutate (same deployment):

| Field | Value |
| --- | --- |
| Deployment ID | `dpl_8Kc8zLWW9xJfhAN6BR451cwBN46g` |
| Immutable URL | `https://zyntixai-3geienqpe-guus-projects-ai.vercel.app` |
| Project | `zyntixai` |
| Target | production |
| Status | Ready |
| Created | Sat Sep 12 2026 20:09:14 GMT+0200 |
| Git SHA | `427e3b5d35b744959eb83c8b68f2dff196f68802` |
| Git ref | `core/platform-readiness-20260707` |
| Canonical aliases then | `www.zyntixai.com`, `zyntixai.com`, `zyntixai.vercel.app` |

---

## 6. Rollback candidate

| Field | Value |
| --- | --- |
| Rollback deployment ID | `dpl_8Kc8zLWW9xJfhAN6BR451cwBN46g` |
| Rollback immutable URL | `https://zyntixai-3geienqpe-guus-projects-ai.vercel.app` |
| Rollback Git SHA | `427e3b5d35b744959eb83c8b68f2dff196f68802` |
| Status at capture | Ready |
| Executed in this slice | **NO** |

Safe rollback command, **not executed**:

```text
npx vercel promote dpl_8Kc8zLWW9xJfhAN6BR451cwBN46g --scope guus-projects-ai --yes
```

---

## 7. Pre-deployment typecheck, focused tests, and build

| Gate | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| Focused Vitest | exit 0; **43 passed**, 0 failed, 0 skipped |
| `tests/ui/tasks-ui-responsive-contract.test.ts` | **13 passed** |
| AppShell + accessibility (`appshell-customers-terminology` + `tasks-ui-accessibility`) | **21 passed** |
| `tests/auth/auth-callback.test.ts` | **9 passed** |
| `npm run build` | exit 0 |

Known historical warnings, not suppressed:

- Social CSS autoprefixer `end` / `flex-end`
- webpack cache serialization of that Warning

Post-build git remained clean. `.next` was left in place as gitignored
generated output.

---

## 8. Deployment method

Established candidate-then-promote on project `zyntixai`, scope
`guus-projects-ai`, from exact HEAD, with `--yes` and `--skip-domain` on the
candidate. No env, domain, project-link, protection, or config mutation.

Candidate command (metadata only; no secrets):

```text
npx --no-install vercel deploy --prod --yes --skip-domain --project zyntixai --scope guus-projects-ai
  -m gitCommitSha=d110b6e3da5c690b31a68a0b145b7b6521c10828
  -m gitCommitRef=core/platform-readiness-20260707
  -m gitCommitMessage=test(home): verify integrated home hardening regression
```

Promote:

```text
npx --no-install vercel promote dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz --scope guus-projects-ai --yes
```

---

## 9. Deployment result

| Step | Result |
| --- | --- |
| Candidate upload / build | exit 0; Next.js 15.5.20 Production build Ready |
| Candidate target | production |
| Candidate Ready | YES |
| Team-alias side-effect before promote | `zyntixai-guus-projects-ai.vercel.app` on the candidate (same class as B1.5); primary public hostnames unchanged until promote |
| Promote | Success in ~4s |
| Env / project / domain relink / force | none |

---

## 10. Deployment ID and immutable URL

| Field | Value |
| --- | --- |
| Deployment ID | `dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz` |
| Immutable URL | `https://zyntixai-d6el9vl1s-guus-projects-ai.vercel.app` |
| Status | Ready |
| Target | production |
| Created | Mon Sep 14 2026 14:56:51 GMT+0200 |

---

## 11. Local / origin / deployed SHA comparison

| Source | SHA |
| --- | --- |
| Local HEAD | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Origin upstream | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Vercel deployment `meta.gitCommitSha` | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Vercel `meta.gitCommitRef` | `core/platform-readiness-20260707` |

Match: **YES**.

---

## 12. Canonical alias verification

After promote, `vercel inspect` of all three public hostnames fetched the new
deployment `zyntixai-d6el9vl1s-guus-projects-ai.vercel.app`
(`dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz`):

- `https://www.zyntixai.com`
- `https://zyntixai.com`
- `https://zyntixai.vercel.app`

The end target used for QA is the canonical Production domain, not a preview
hostname.

---

## 13. HTTPS and redirect smokecheck

Unauthenticated HTTP (no cookies, tokens, or authorization headers logged):

| URL | Result |
| --- | --- |
| `https://zyntixai.com/` | **308** → `https://www.zyntixai.com/` |
| `https://www.zyntixai.com/` | **307** → `/login` |
| `https://www.zyntixai.com/login` | **200** HTML login |
| `https://www.zyntixai.com/home` | **307** → `/login?next=%2Fhome` |
| Candidate immutable `/` and `/login` | **302** Vercel Deployment Protection SSO (expected; not the canonical end target; same class as B1.5) |

Login HTML scan: HTTPS valid; HSTS present; login form present; no deployment
protection page on `www`; no localhost; no mixed `http://` assets; no
token-like or `service_role` material; no server error; no development overlay.

---

## 14. Authenticated QA boundary

| Control | Result |
| --- | --- |
| Account | Existing synthetic Production QA Owner storage state (`playwright/.auth/production-owner.json`, gitignored) |
| Workspace | Synthetic Production QA organization; kicker `ZyntixAI Production QA · Owner` |
| Writes | None (no create/edit/complete/acknowledge/invite/billing/social/upload) |
| Org switch | Not submitted |
| New account / reset / MFA / service role / fixtures | Not used |
| Credentials | Never printed |
| Logout | Performed as the last authenticated step; subsequent storage-state navigation reached `/login` |

`npm run test:browser:b1-c1` is the authoritative manual Production/FV browser
script (package.json; H1 contract T15; `tests/browser/README.md`). It was not
executed during the original PROD slice because
`tests/browser/helpers/daily-operating.ts` still expected the retired subtitle
`What needs attention and what you need to do next.` H1 live Production
assertions were used instead. That skip is not a durable solution.

Uncommitted `B1-C1-H1-PROD-C1` restores the helper (and the one inline C5
duplicate) to the frozen subtitle and adds
`tests/ui/daily-operating-browser-helper-contract.test.ts`. Product code and
deployment `dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz` are unchanged. No redeploy.

Authenticated `npm run test:browser:b1-c1` on this SHA used a fresh gitignored
Owner storage state (Playwright 1.62.1 Chromium; canonical
`https://www.zyntixai.com`; existing config; no product change).

An earlier helper-only rerun collected 3, passed desktop and tablet, and
failed mobile on the pre-SHELL assertion that Primary must be visible while
Menu is closed. Read-only diagnosis classified that as a browser-contract
defect, not a product regression. C2 replaced that assertion with the sealed
Menu contract. The later authoritative run:

| Check | Result |
| --- | --- |
| Command | `npm run test:browser:b1-c1` |
| Collected | 3 |
| Passed | 3 (desktop, mobile, tablet) |
| Failed | 0 |
| Skipped | 0 |
| Exit | 0 |
| Duration | 47.7s |
| Login redirect | None |
| Frozen subtitle | Helper exact match on all three viewports |
| Mobile closed Menu | Visible; both DOM Primary copies hidden; a11y Primary count 0 |
| Mobile keyboard | Tab → Skip to main content → Menu; hidden Home not focused |
| Mobile open Menu | One accessible Primary; authorized Owner order; Home current |
| Unauthorized items | Absent from the open disclosure |
| Mobile close | Enter closes `<details>`; Primary again inaccessible |
| Writes | None |

Desktop completed the read-only Attention view-all round-trip. The temporary
storage state was deleted after the run. Product code and deployment
`dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz` remain unchanged. No redeploy.

```text
PASS — B1-C1-H1-PROD-C1 AUTHORITATIVE BROWSER CONTRACT RECONCILED
```

---

## 15. Admission verification

Observed on canonical `https://www.zyntixai.com/home?org=[ORG-ID-REDACTED]`:

| Check | Result |
| --- | --- |
| Admitted user reaches `/home` | YES; H1 `Today` |
| Home authority independent | Home loaded without inventing extra capabilities |
| Tasks capability invented | NO; Tasks appears only as an authorized Primary destination |
| Authorized modules only | Home, Leads, Customers, Programs, Enrollments, Progress, Attention, Tasks, Members |
| Hidden modules | No Projects / Sites / Social / commerce Primary items |
| Organization context | Selected synthetic QA workspace; `?org=` retained on Home and Attention view-all |
| Cross-org rows | None observed |
| Direct `/home` | Loads Today; no redirect loop; not bounced to login while the session was valid |

---

## 16. Truth verification

Live Production state was **populated Organization attention**, not calm,
partial, or error. Those other states were not forced.

| Check | Result |
| --- | --- |
| Subtitle | Exact frozen copy: `Priority Attention and due work in today’s brief.` |
| Retired calm title `You are clear for now.` | Absent |
| Retired C1 subtitle | Absent |
| Calm title | Absent (correct: org Attention items are visible) |
| Unable-to-load / query failure copy | Absent |
| Quick / section actions | Section chrome only (`View all Attention`, `View overdue tasks`, `View today’s tasks`); no invented Leads/social actions |
| View-all for hidden modules | None |
| Organization-aware links | `View all Attention` retains `?org=` |

Calm / partial / error rendering remains covered by closed TRUTH, COMPOSITION,
and R1 test/browser evidence on this SHA.

---

## 17. Shell verification

| Check | Result |
| --- | --- |
| H1 count | 1; text `Today` |
| Kicker | `ZyntixAI Production QA · Owner` only |
| Desktop 1440 | Centered shell; inline Primary; Home `aria-current="page"` |
| Mobile 390 closed | `ZyntixAI` + `Menu`; Primary hidden |
| Mobile 390 open | Authorized destinations only; Home current; Log out separated below nav |
| Pending chrome | Not shown; Primary is the completed set |
| Sidebar / dashboard KPIs / new shadows | Absent |
| Horizontal overflow | 0 at both viewports |

---

## 18. Composition verification

UI-only; no database queries; no data mutation.

| Section | Visible items |
| --- | --- |
| Organization attention | 3 High QA fixture rows (≤ 5) |
| Assigned to me — Attention | Empty truthful empty-state |
| Overdue work | Empty truthful empty-state |
| Due today | Empty truthful empty-state |

Two Organization rows share the title “No recent enrollment progress” but have
distinct supporting lines (different QA programs). This is not a merge
duplicate of one Attention item. Overflow / adversarial query proofs remain in
COMPOSITION and R1.

---

## 19. Desktop measurements (1440×1000)

| Metric | Value |
| --- | --- |
| `window.innerWidth` | 1440 |
| `document.documentElement.scrollWidth` | 1440 |
| overflowDelta | **0** |
| H1 count | 1 |
| `main#main-content` count | 1 |
| `main#main-content.tabIndex` | -1 |
| Current nav | Home |
| Visible Primary | Home, Leads, Customers, Programs, Enrollments, Progress, Attention, Tasks, Members |
| Menu | Present in DOM, not the desktop presentation |
| Header height | 73px |
| Main start | 73px |
| Header/main overlap | 0 |
| Visible focused skip-link | 181×44; `position: fixed`; `z-index: 50` |
| Unfocused skip-link | 1×1 visually hidden (not a visible control) |
| Elements clipped horizontally | none |

---

## 20. Mobile measurements (390×844)

| Metric | Value |
| --- | --- |
| `window.innerWidth` | 390 |
| `scrollWidth` | 390 |
| overflowDelta | **0** |
| H1 count | 1 |
| `main#main-content` count | 1 |
| Closed Menu | Visible name `Menu`; Primary not shown |
| Open Menu | `menuOpen = true`; overflowDelta 0 |
| Header height / main start | 73 / 73; overlap 0 |
| Focused skip-link | 181×44; fixed; z-index 50; sits above the header chrome |
| Below-fold section links | Present after scroll; not horizontal overflow |

---

## 21. Keyboard and focus

Fresh authenticated Home, real key events:

### Desktop

1. `activeElement` starts on `BODY`.
2. First Tab focuses `Skip to main content`.
3. Skip-link becomes visible at the top of the viewport (`position: fixed`).
4. Enter sets `location.hash` to `#main-content`.
5. `activeElement` is `MAIN` with `id === "main-content"`.
6. Next Tab reaches the first main control: `View all Attention`.

### Mobile

1. Same skip sequence: `BODY` → skip-link → `#main-content` / `main-content` → `View all Attention`.
2. First Tab from a fresh page is the skip-link, not a closed-menu Home descendant.
3. Menu accessible name `Menu`.
4. Enter opens (`menuOpen = true`); focus remains on `SUMMARY` Menu.
5. Space opens (`menuOpen = true`); focus remains on Menu.
6. Open tab order: Home (current) → Leads → Customers → Programs → Enrollments → Progress → Attention → Tasks → Members → Log out, then main content.
7. Visible 2px solid focus outline on Menu.
8. Log out is separated under the authorized items.
9. After open, the close control is still Menu. A later Tab-exploration Enter was not used as the close proof; native `details` toggle from the still-focused Menu is the governed close path. Same-SHA R1 already recorded close returning focus to Menu.

Logout was the last authenticated action.

---

## 22. Console and network

| Signal | Result |
| --- | --- |
| Page errors | none |
| Hydration / CSP / Next runtime / Supabase auth errors | none observed |
| Localhost requests | none |
| Mixed content | none |
| External origins during Home | only `https://www.zyntixai.com` |
| Favicon | **`GET /favicon.ico` → 404** (also `/apple-touch-icon.png` 404). Reported; not hidden. Historical host-level gap, not an H1 Home regression. |
| Console 404 text without URL | Matches the favicon miss; no other failed Home document/API responses recorded |

No cookies, authorization headers, tokens, or auth payloads are included.

---

## 23. Screenshot register

Stored only under `[LOCAL-QA-DIRECTORY-REDACTED]`. Not committed.

| Evidence ID | State | Viewport | Pixels | Bytes | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| B1-C1-H1-PROD-SS-01 | authenticated Home | 1440×1000 | 1440×1000 | 65442 | `8e75b2e6f0ab62d06cff956f686bf0ec2c018df72c13be0f62255c9b5679a23d` |
| B1-C1-H1-PROD-SS-02 | Home, Menu closed | 390×844 | 390×844 | 33133 | `4a2602234ad42815c917fb9525b85909fe6168d2c58c81b1a13b3faf59ae595d` |
| B1-C1-H1-PROD-SS-03 | Home, Menu open | 390×844 | 390×844 | 22692 | `ffc064b0156614efe376599cd9bd3230edf0e4c806943d4878d062572300b9f1` |
| B1-C1-H1-PROD-SS-04 | focused skip-link | 1440×1000 | 1440×1000 | 67862 | `0eb833728318c682c8c789976f7f229fd3aee251ec1d25cf79d10d12684f41aa` |
| B1-C1-H1-PROD-SS-05 | focused skip-link | 390×844 | 390×844 | 35010 | `9736105c380269a93aa987702f5774769f9a972d7b2708449fb190ba8643c5b2` |
| B1-C1-H1-PROD-SS-06 | Menu keyboard-focused | 390×844 | 390×844 | 33765 | `40b1f19b9cdfac1a86aea1b7f345c5aa3950935499c106eec051863f1731c01c` |

Visible data are synthetic QA fixtures only. No email addresses or personal
identifiers.

---

## 24. Security and privacy

| Check | Result |
| --- | --- |
| Intended fictional QA organization only | YES (`ZyntixAI Production QA`) |
| Cross-org data | Not observed |
| Hidden modules leaked via Home | No |
| Console internal DB errors / SQL / stack | No |
| Screenshots PII | No |
| Evidence tokens / keys / personal paths | None |
| Service-role flow | Not used |
| Production writes | None |

---

## 25. Cleanup

- Logged out as the last authenticated step of the original PROD slice; a
  later storage-state navigation reached the official login route.
- C1/C2 used a new gitignored Owner storage state, then deleted only
  `playwright/.auth/production-owner.json` after the 3/3 browser run.
- Playwright `test-results/` and `playwright-report/` from that run were
  removed after confirming they were gitignored and untracked.
- Browser contexts closed.
- No Production data deleted or created.
- Temporary local runners removed after use.
- Screenshots and QA JSON remain outside the repository.
- No server or extra local port left running for this slice.
- `.next` retained as gitignored build output.
- Installed Playwright 1.62.1 Chromium remains in the local browser cache.

---

## 26. Git scope

The original PROD slice added only this evidence document. Uncommitted
PROD-C1/C2 later adds the helper, C5 inline subtitle, mobile Primary-nav
spec, helper contract test, and C1 evidence. No screenshots, runners, or QA
JSON were added to the repository.

---

## 27. Rollback procedure (not executed)

If a later reviewer requires restore of the pre-PROD Production alias:

```text
npx vercel promote dpl_8Kc8zLWW9xJfhAN6BR451cwBN46g --scope guus-projects-ai --yes
```

That candidate remained Ready when captured. This slice did **not** roll back.

---

## 28. Explicit non-claims

- B1-C1-H1 as a whole is **not** `CLOSED`.
- `B1-C1-H1-FV` is **NOT STARTED**.
- This is not onboarding verification, public-web redesign, design freeze, or
  general release readiness.
- This is not `RELEASE READY`.
- The original PROD slice did not run `npm run test:browser:b1-c1` because the
  helper copy was stale. That helper is authoritative for the manual
  Production/FV browser chain. Uncommitted PROD-C1/C2 restores the frozen
  subtitle and the sealed mobile Menu contract; the later authenticated run
  is 3 collected / 3 passed / 0 failed / 0 skipped. It is not a Vitest/CI
  default gate.
- Calm / partial / error Home states were not forced in Production.
- Favicon 404 is not claimed fixed.

---

## 29. Next phase

```text
B1-C1-H1-FV — NOT STARTED
```
