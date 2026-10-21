# B1-C1-H1-PROD-C1 — Authoritative Browser Contract Reconciliation Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-PROD-C1 — Authoritative Browser Contract Reconciliation** |
| Date | 2026-09-14 |
| Branch | `core/platform-readiness-20260707` |
| Start SHA | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Upstream SHA | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Canonical domain | `https://www.zyntixai.com` |
| Parent | `B1-C1-H1-PROD` (authenticated Production Home already verified) |
| Product / CSS / config / dependency / migration edits | **NONE** |
| Commit / push / tag | **NOT DONE** |
| Deploy / promote / rollback | **NOT DONE** |
| Next phase | **B1-C1-H1-FV — NOT STARTED** |

```text
PASS — B1-C1-H1-PROD-C1 AUTHORITATIVE BROWSER CONTRACT RECONCILED
```

This evidence closes **only** the uncommitted test-contract correction. It does
not close B1-C1-H1 as a whole, does not start FV, and does not change
Production.

H1 contract §12.6 remains:

```text
PASS — B1-C1-H1-PROD AUTHENTICATED PRODUCTION HOME HARDENING VERIFIED
```

---

## 1. Preflight

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Upstream | same SHA |
| Ahead/behind | `0 0` |
| `git fetch origin` | metadata only |
| Staging | empty |
| `git diff --check` | clean |
| Process `NEXT_PUBLIC_SITE_URL` | `UNSET` |

Allowed local worktree at C1 start: helper, C5 desktop subtitle, helper
contract test, PROD evidence. Product `src/**` unchanged.

---

## 2. Start SHA

`d110b6e3da5c690b31a68a0b145b7b6521c10828`

Deployed Production SHA is the same. Subject of that commit is the closed R1
evidence commit; product/C1 parent remains `f7f2d65accd10d6ae6af6eb8d00c8d6b1d0c8c5f`.

---

## 3. Original subtitle-helper defect

`tests/browser/helpers/daily-operating.ts` `expectDailyOperatingShell` still
expected pre-TRUTH copy `What needs attention and what you need to do next.`

Live Production and TRUTH/SHELL freeze:

`Priority Attention and due work in today’s brief.`

That helper is the T15 / `npm run test:browser:b1-c1` authority, not a
Vitest/CI default gate.

---

## 4. C5 inline duplicate

`tests/browser/b1-c5-production-product-polish.desktop.spec.ts` repeated the
same stale subtitle inline. Corrected to the frozen string. Other C1/C3/C4/C5/FV
callers inherit the helper.

---

## 5. Mobile Primary-nav failure

After the subtitle helper was restored, `npm run test:browser:b1-c1` collected
3, passed desktop and tablet, and failed mobile:

| Field | Value |
| --- | --- |
| Spec | `tests/browser/b1-c1-production-home.mobile.spec.ts` |
| Test | `authenticated Owner mobile composition stacks without overflow` |
| Locator | `getByRole("navigation", { name: "Primary" }).toBeVisible()` |
| Menu | closed |
| Actual | 0 accessible Primary navs (`element(s) not found`) |
| Follow-on Home link | not reached |

This was a pre-SHELL testaanname (spec commit ancestor of SHELL
`44e25f634417219762f1aabbb83629dad4be1a1b`).

---

## 6. Read-only diagnosis

`B1-C1-H1-PROD-C1-D1` classified:

```text
READY FOR TEST-ONLY CORRECTION — B1-C1-H1-PROD-C1 MOBILE PRIMARY NAV CONTRACT
```

---

## 7. Product regression excluded

On 390px Production: brand + Menu visible; desktop cluster `display: none`;
closed `<details>` hides mobile Primary from the accessibility tree; `Today`
visible; overflowdelta 0. Same-SHA SHELL/R1/PROD keyboard evidence: closed
descendants are not in the tab order. Not a product regression.

---

## 8. Sealed mobile contract

Closed: `ZyntixAI` + `Menu`; both DOM Primary copies hidden; no accessible
Primary; hidden links not tabbable; `Today`; no horizontal overflow.

Open: exactly one accessible Primary; Course Seller Owner order; Home
`aria-current="page"`; Log out visible and below nav; unauthorized modules
absent; desktop copy remains hidden.

DOM may contain two `nav[aria-label="Primary"]` presentation copies.

---

## 9. Exact changed-file scope

1. `tests/browser/helpers/daily-operating.ts`
2. `tests/browser/b1-c5-production-product-polish.desktop.spec.ts`
3. `tests/browser/b1-c1-production-home.mobile.spec.ts`
4. `tests/ui/daily-operating-browser-helper-contract.test.ts`
5. `docs/phases/B1-C1-H1-PROD-production-home-verification-evidence.md`
6. this file

No `src/**`, CSS, Playwright config, package, lockfile, or Vercel config.

---

## 10. Old mobile assertions

```ts
await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
```

---

## 11. New closed-Menu assertions

Native `summary` filtered to exact text `Menu`. Closed `<details>`
`open === false`. Header brand `ZyntixAI` visible.

---

## 12. DOM-copy visibility checks

```ts
const copies = page.locator('nav[aria-label="Primary"]');
await expect(copies).toHaveCount(2);
for (let index = 0; index < 2; index += 1) {
  await expect(copies.nth(index)).toBeHidden();
}
await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
```

Each copy is asserted separately. `toHaveCount(0)` is used only on the
accessibility-tree locator, not as proof that presentation copies are absent
from the DOM.

---

## 13. Keyboard tab order (closed)

Fresh blur, then real Tab: `Skip to main content`, next Tab: `Menu` focused,
disclosure still closed, no hidden Home link focused.

---

## 14. Open-Menu assertions

Enter on focused Menu. `<details open>`. Accessibility Primary count 1 and
visible. DOM nth(0) remains hidden; nth(1) visible.

---

## 15. Authorized order

Visible Primary links, exact:

Home → Leads → Customers → Programs → Enrollments → Progress → Attention →
Tasks → Members

No duplicate visible item.

---

## 16. Home current

Visible Home link has `aria-current="page"`.

---

## 17. Unauthorized-item checks

Scoped to the open disclosure and visible Primary: Projects, Sites, Work
orders, Orders, and Social have count 0. Log out is visible below the nav.

Enter on still-focused Menu closes the disclosure; both copies hidden again.

---

## 18. Assertion-strength comparison

| Old | New |
| --- | --- |
| Assumes inline Primary on 390px | Measures sealed closed Menu |
| Ignores dual presentation copies | Asserts both DOM copies hidden |
| Confuses a11y absence with missing nav | Distinguishes DOM vs a11y |
| No keyboard | Skip → Menu; hidden links not focused |
| No open/close | Keyboard open, authorized order, keyboard close |
| No unauthorized check | Scoped negatives on the open disclosure |

Mutations that still fail: missing Menu; Primary visible while closed; hidden
Home in tab order; two visible Primaries; keyboard does not open; Home not
current; wrong order; unauthorized item; missing Log out; overflow.

---

## 19. Helper contract test

```text
npx vitest run tests/ui/daily-operating-browser-helper-contract.test.ts --reporter=verbose
```

| Field | After browser PASS |
| --- | --- |
| Tests | 2 passed |
| Failed | 0 |
| Skipped | 0 |
| Duration | 2.26s |
| Exit | 0 |

---

## 20. Relevant Vitest results

```text
npx vitest run tests/features/daily-operating tests/ui/appshell-customers-terminology.test.tsx tests/ui/tasks-ui-accessibility.test.tsx tests/ui/tasks-ui-responsive-contract.test.ts --reporter=verbose
```

| Field | After browser PASS |
| --- | --- |
| Test files | 6 passed |
| Tests | 115 passed |
| Failed | 0 |
| Skipped | 0 |
| Duration | 5.38s |
| Exit | 0 |

Helper + this suite = 117 passed. Same command before the browser rerun was
also 115 / 0 / 0.

---

## 21. Typecheck

`npm run typecheck` → `tsc --noEmit` exit 0.

---

## 22. Lint

```text
npx next lint --file tests/browser/helpers/daily-operating.ts --file tests/browser/b1-c5-production-product-polish.desktop.spec.ts --file tests/browser/b1-c1-production-home.mobile.spec.ts --file tests/ui/daily-operating-browser-helper-contract.test.ts
```

Exit 0. No ESLint warnings or errors. Known Next.js deprecation: `next lint`
will be removed in Next.js 16.

---

## 23. Fresh bootstrap

Existing `npm run browser:auth:bootstrap` against canonical Production.
Playwright 1.62.1 Chromium. Headed. Owner completed login in that window.
Bootstrap exit 0 after Home heading `Today`.

---

## 24. Auth-state safety

Path: `playwright/.auth/production-owner.json`

| Check | Result |
| --- | --- |
| Gitignored | yes (`/playwright/.auth/`) |
| Tracked | no |
| Staged | no |
| Reparse point | no |
| Length | 3218 (contents never printed) |
| mtime | after this bootstrap start |

---

## 25. Authoritative browser result 3/3

```text
npm run test:browser:b1-c1
```

| Field | Result |
| --- | --- |
| Collected | 3 |
| Passed | 3 |
| Failed | 0 |
| Skipped | 0 |
| Exit | 0 |
| Duration | 47.7s |
| Browser | Chromium Playwright 1.62.1 |
| Desktop | 1280×720, 26.6s, pass |
| Mobile | iPhone 13 390×664, 12.7s, pass |
| Tablet | iPad Mini 768×1024, 5.9s, pass |

Mobile width 390 is below the 960px shell breakpoint. Height 664 vs SHELL
evidence 844 does not change the closed-Menu contract.

---

## 26. Canonical Production origin

`https://www.zyntixai.com`

Existing Playwright config. `BROWSER_QA_BASE_URL` not used to retarget.

---

## 27. No Production write

Allowed: Home GET, keyboard Menu open/close, read-only Attention view-all,
back. No acknowledge, task mutation, invite, org switch, upload, billing, or
social action. Health collector recorded no 401/403/5xx on the run.

---

## 28. Auth-state cleanup

After gates: Playwright contexts closed. Exact gitignored auth file
re-validated and deleted. File absent afterwards. Contents never read.

---

## 29. Report cleanup

`playwright-report/` and `test-results/` from this run removed after
gitignore / untracked / not-reparse checks. Earlier PROD screenshots outside
the repository were not deleted. Chromium cache retained.

---

## 30. Product-byte integrity

```text
git diff --exit-code -- src
git diff --exit-code -- package.json package-lock.json vercel.json
```

Both clean. No CSS or Playwright-config diff.

---

## 31. No deploy / promote / rollback

Production remains `dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz`. Rollback candidate
`dpl_8Kc8zLWW9xJfhAN6BR451cwBN46g` was not promoted.

---

## 32. Current Production deployment / SHA

| Field | Value |
| --- | --- |
| Deployment ID | `dpl_BK6ZHRGjpSQVibt439AqhkG9WhBz` |
| SHA | `d110b6e3da5c690b31a68a0b145b7b6521c10828` |
| Canonical host | `https://www.zyntixai.com` |
| Project | `zyntixai` |

---

## 33. Contractual PROD status

Unchanged from H1 §12.6:

```text
PASS — B1-C1-H1-PROD AUTHENTICATED PRODUCTION HOME HARDENING VERIFIED
```

---

## 34. FV not started

```text
B1-C1-H1-FV — NOT STARTED
```

B1-C1-H1 as a whole is **not** `CLOSED`.

---

## 35. Security / privacy

| Check | Result |
| --- | --- |
| Credentials / cookies / JWT / storage payload | Not printed; auth file deleted |
| Email addresses in this correction | None added |
| Personal Windows paths | Not recorded |
| Organization UUIDs | Redacted in evidence |
| Service-role / Supabase refs | None |
| Synthetic QA kicker only | `ZyntixAI Production QA · Owner` |
| Cross-org data | Not observed |
| Production writes | None |
