# B1-C1-H1-R1-C1 — Skip-Link Responsive Contract Reconciliation Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-R1-C1 — SKIP-LINK RESPONSIVE CONTRACT RECONCILIATION** |
| Date | 2026-09-14 |
| Branch | `core/platform-readiness-20260707` |
| Start SHA | `6b6cfcb7cd80fc6f176fbfa7216cb7c2e2717b74` |
| Parent | Blocked B1-C1-H1-R1 (integrated Home hardening regression) |
| Contract | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` |
| Product / CSS edits | **NONE** |
| Commit / push | **NOT DONE** |

```text
PASS — B1-C1-H1-R1-C1 SKIP-LINK RESPONSIVE CONTRACT RECONCILED
```

This correction closes **only** C1. It does not close R1, B1-C1-H1, PROD, FV,
onboarding, public-web work, or Production verification.

---

## 1. Correction authority

R1 was correctly blocked because
`tests/ui/tasks-ui-responsive-contract.test.ts` treated the governed focused
skip-link overlay as a fixed viewport-blocking application layout.

SHELL evidence already required that overlay:

- skip-link is first focusable and clipped while unfocused;
- focused skip-link uses `position: fixed` and `z-index: 50` above the header;
- it must remain visible after the document has been scrolled;
- it must not create permanent layout space or an unfocused hitbox.

Product CSS is correct. C1 narrows the test without removing AppShell from the
scan and without globally permitting `position: fixed`.

---

## 2. Start SHA

`6b6cfcb7cd80fc6f176fbfa7216cb7c2e2717b74`

Upstream matched. Ahead/behind `0 0`.

---

## 3. Clean preflight

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `6b6cfcb7cd80fc6f176fbfa7216cb7c2e2717b74` |
| Upstream | same SHA |
| Ahead/behind | `0 0` |
| `git fetch origin` | metadata only |
| Worktree before edits | clean |
| Staging | empty |
| `git diff --check` | clean |

Not `BLOCKED — B1-C1-H1-R1-C1 PREFLIGHT MISMATCH`.

---

## 4. Original R1 blocker

Reproduced before any C1 edit:

```text
npx vitest run tests/ui/tasks-ui-responsive-contract.test.ts --reporter=verbose
```

| Field | Result |
| --- | --- |
| Exit | 1 |
| Passed | 4 |
| Failed | 1 |
| Skipped | 0 |
| Duration | 737ms |
| Exact test | `tasks UI responsive CSS contract > avoids fixed viewport-blocking widths in task UI modules` |
| Exact assertion | `expect(readCss(modulePath)).not.toMatch(/position:\s*fixed\|min-width:\s*9\d{2}px\|width:\s*9\d{2}px/)` |
| Exact CSS match | `.skipLink:focus, .skipLink:focus-visible { position: fixed; … }` in `src/components/app-shell.module.css` |

No other AppShell selector used `position: fixed`. Header, Primary navigation,
mobile navigation, main, Task cards and state panels were `relative` / `absolute`
/ static. The match was the governed focused skip-link overlay only.

A secondary false-positive of the same whole-file regex is
`@media (min-width: 960px)`, which is a contracted SHELL breakpoint, not a
layout `min-width: 960px` on a structural box. After removing the overlay, the
prohibition is applied to **style-rule bodies** so that media-query preludes
are not mistaken for viewport-blocking widths. Layout declarations such as
`.header { min-width: 960px; }` remain rejected.

---

## 5. Exact conflicting contracts

### Responsive-layout contract

Application layout must not use fixed viewport-blocking positioning or fixed
900–999px widths that cover content, cause overflow, freeze desktop-only Task
layouts, prevent reflow, or trap the user behind persistent chrome.

This remains active for AppShell header, Primary navigation, mobile navigation,
main, cards, Task UI containers, state panels, and other structural selectors.

### Accessibility skip-link contract

The skip-link may use `position: fixed` **only** while focused
(`.skipLink:focus` and `.skipLink:focus-visible`) so it stays visible after
scroll, above the header, without permanent layout space or an unfocused
hitbox.

A focused skip-link overlay is not a fixed application layout.

---

## 6. Root cause

The Tasks responsive contract scanned whole CSS files, including AppShell, with
one regex. SHELL added a lawful focused skip-link overlay. The test could not
distinguish that overlay from a fixed header or other structural chrome.

---

## 7. Exact changed-file scope

| Path | Role |
| --- | --- |
| `tests/ui/tasks-ui-responsive-contract.test.ts` | Narrow matcher + positive/negative assertions |
| `docs/phases/B1-C1-H1-R1-C1-skip-link-responsive-contract-reconciliation-evidence.md` | This evidence |

No product, CSS, Home, daily-operating, admission, navigation, dependency,
migration, configuration, or existing-evidence edits.

---

## 8. Matcher/assertion before and after

**Before:** for each of six CSS files, the entire file string must not match
`position: fixed` / `min-width: 9xxpx` / `width: 9xxpx`.

**After:**

1. Parse style rules with a deterministic brace walker (fail-closed on
   mismatch, missing selector, unterminated comment, or leftover selector).
2. Find exactly one rule whose selector set is `{.skipLink:focus, .skipLink:focus-visible}`.
3. Require the governed overlay declarations, including `position: fixed`.
4. Remove **only** that validated raw rule once.
5. Apply the original regex to remaining **style-rule bodies**.

`src/components/app-shell.module.css` remains in the scan. The global
`position: fixed` ban is not removed. `.skipLink` as a family is not excluded.
Arbitrary pseudo-classes are not permitted.

---

## 9. Narrow exception proof

Real AppShell CSS:

- exactly one governed focused skip-link rule;
- selectors limited to `.skipLink:focus` and `.skipLink:focus-visible`;
- overlay contains `position: fixed`, `left: 0.75rem`, `top: 0.75rem`,
  `z-index: 50`, clip removal, `width/height: auto`, `overflow: visible`,
  `pointer-events: auto`, and visible focus outline;
- remainder still contains `.header`, `.nav`, `.navCluster`, `.main`, and base
  `.skipLink`;
- remainder style-rule bodies do not match the original prohibition.

Helper fail-closed:

- no matching rule → throw;
- more than one matching rule → throw;
- broader selector such as `.skipLink:focus, .skipLink:focus-visible, .header`
  → not accepted as the overlay.

---

## 10. Negative responsive protection proof

Synthetic matcher tests:

- safe focused skip-link overlay is accepted;
- `.header { position: fixed; }` remains rejected beside a valid overlay;
- a second fixed structural rule remains rejected;
- a broader skip-link selector is rejected;
- a duplicate governed overlay is rejected;
- `.shell`, `.header`, `.desktopCluster`, `.nav`, `.navCluster`, `.main`,
  `.card`, `.statePanel` with `position: fixed` remain rejected;
- `.header { min-width: 960px; }` and `.card { width: 960px; }` remain rejected.

Task CSS modules are still scanned with **no** skip-link exception.

---

## 11. Unfocused skip-link contract

Base `.skipLink` rule in real CSS:

- `position: absolute` (not fixed);
- `clip: rect(0 0 0 0)` and `clip-path: inset(50%)`;
- `width: 1px` / `height: 1px`;
- `overflow: hidden`;
- `pointer-events: none`;
- no `pointer-events: auto`.

No permanent layout footprint and no large invisible hitbox.

---

## 12. Focused skip-link contract

Focused rule uses only the two governed selectors, `position: fixed`, existing
placement `0.75rem`, `z-index: 50` above header `z-index: 1`, clipping removed,
overflow visible, pointer-events restored, content-driven width/height, and
visible outline.

Existing AppShell tests continue to prove `href="#main-content"`,
`main#main-content`, `tabIndex={-1}`, and skip-link before Primary navigation.
Those tests were not duplicated here.

---

## 13. Environment-contamination handling

At C1 start, process-level `NEXT_PUBLIC_SITE_URL` was **UNSET**. It did not
point at a loopback test origin in this process.

Ignored `.env.local` was not read for reporting, not printed, and not edited.

The full suite was launched from a child command that attempted to clear
`NEXT_PUBLIC_SITE_URL` if present. A PowerShell quoting glitch printed
`IsNullOrEmpty` with zero arguments; it did **not** assign a value. The child
inherited the unset parent variable. `tests/auth/auth-callback.test.ts` passed
(9/9), confirming the previous `127.0.0.1:43127` contamination was absent.

No secrets were printed.

---

## 14. Focused test chronology

| Command | Exit | Files | Passed | Failed | Skipped | Duration | Warnings |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| `npx vitest run tests/ui/tasks-ui-responsive-contract.test.ts --reporter=verbose` (before edit) | 1 | 1 | 4 | 1 | 0 | 737ms | npm `devdir`; none in tests |
| same command after correction | 0 | 1 | 13 | 0 | 0 | 543ms | npm `devdir` |
| `npx vitest run tests/ui/appshell-customers-terminology.test.tsx tests/ui/tasks-ui-accessibility.test.tsx --reporter=verbose` | 0 | 2 | 21 | 0 | 0 | 2.61s | npm `devdir` |
| `npx vitest run tests/features/daily-operating --reporter=verbose` | 0 | 3 | 81 | 0 | 0 | 1.79s | npm `devdir` |

No test was removed, skipped, marked todo, or weakened. The previous failing
test still runs and now passes because the matcher distinguishes the overlay.

The file grew from 5 tests to 13 tests (+8 assertions).

---

## 15. Full-suite chronology

Authoritative command:

```text
npx vitest run --fileParallelism false --maxWorkers 1
```

Run in a child process with process-level `NEXT_PUBLIC_SITE_URL` absent.

| Run | Result |
| --- | --- |
| C1 full suite | exit 1; **534 files** (532 passed / 2 failed); **4196 tests**; **4194 passed / 2 failed / 0 skipped**; 181.89s |
| `tests/ui/tasks-ui-responsive-contract.test.ts` | **13 passed** |
| `tests/auth/auth-callback.test.ts` | **9 passed** |

Blocked R1 final clean-env baseline was 534 files / 4188 tests / 4185 passed /
3 failed. C1 added 8 assertions (`4188 + 8 = 4196`) and converted the former
H1-scoped failure into a pass (`3 - 1 = 2` remaining failures).

---

## 16. Exact historical-failure classification

| File | Test | Signature | Classification |
| --- | --- | --- | --- |
| `tests/features/invitations/load-member-administration-page.test.ts` | `does not trust a foreign org id outside active memberships` | spy `Number of calls: 0` | Governed historical (ENG-ONB-1H-P1-D / DATA-TRACK-FV). Outside H1. Unchanged. |
| `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` | `Progress no longer claims deferred tracking; Progress workspace language is present` | expects `Progress for this enrollment is recorded and reviewed in the Progress workspace.` | Governed historical. Outside H1. Unchanged. |

No H1-scoped file failed. No new failure appeared. Focused required suites
passed. Historical tests were not edited.

---

## 17. Product/CSS byte-integrity confirmation

```text
git diff --exit-code -- src/components/app-shell.module.css
git diff --exit-code -- src/components/app-shell.tsx
```

Both exit 0. Working-tree AppShell CSS and TSX are identical to HEAD.
No Home UI/CSS, daily-operating, admission, or navigation diffs.

Build and local browser were not required inside C1 because product/CSS are
byte-identical, focused AppShell/a11y tests passed, and the full suite has no
new H1 failure. They remain mandatory when R1 restarts after C1 is committed.

---

## 18. Security/privacy scan

C1 diff contains only a Vitest CSS-contract helper and this evidence file. No
credentials, emails, tokens, cookies, JWTs, Authorization headers, Production
project refs, recovery links, real organization UUIDs, absolute personal
paths, harness files, screenshots, QA JSON, migrations, lockfiles, or
environment-file changes.

---

## 19. Evidence limitations

- C1 does not rerun Production or a local visual harness.
- C1 does not close R1.
- Synthetic matcher fixtures are not a second CSS codebase; they prove
  fail-closed behaviour of the helper.
- Historical invitation and Programs/Enrollments failures remain open outside
  this correction.

---

## 20. Rollback scope

Revert `tests/ui/tasks-ui-responsive-contract.test.ts` and delete this
evidence file. Product CSS is unchanged, so no CSS rollback is required.
After revert, R1 would again fail the skip-link overlay against the Tasks
responsive contract.

---

## 21. Closure boundary

- Product code was not changed.
- AppShell CSS was not changed.
- Responsive protection was not globally weakened.
- Only the focused skip-link receives the exception.
- R1 is still not closed.
- B1-C1-H1 is not closed.
- Production is not verified.
- PROD and FV have not started.
- Onboarding is not closed.
- Public-web work is outside this correction.
- R1 must restart after this correction is reviewed, committed and pushed.

---

## 22. Next step

Independent review, then a single commit of the two C1 paths, then push, then
restart `B1-C1-H1-R1` including `npm run build` and the local synthetic
browser pass. Do not treat this document as R1 PASS.

```text
PASS — B1-C1-H1-R1-C1 SKIP-LINK RESPONSIVE CONTRACT RECONCILED
```
