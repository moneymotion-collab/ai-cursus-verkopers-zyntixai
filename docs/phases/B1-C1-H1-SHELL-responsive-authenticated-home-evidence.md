# B1-C1-H1-SHELL — Responsive Authenticated Home Shell Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-SHELL** |
| Date | 2026-09-13 |
| Parent authority | B1-C1 Daily Operating Composition — CLOSED WITH EVIDENCE |
| Hardening contract | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` |
| Design freeze | `docs/phases/B1-C1-H1-SHELL-DESIGN-authenticated-home-visual-freeze.md` |
| Completed prerequisites | B1-C1-H1-ADMISSION, B1-C1-H1-TRUTH, B1-C1-H1-SHELL-DESIGN |
| Start SHA | `ee5e7f94c246439eb292624f7812ae74167440e3` |
| Branch | `core/platform-readiness-20260707` |
| Migrations | **NONE** |
| Production browser QA | **NOT DONE** |
| Next phase | **B1-C1-H1-COMPOSITION — not started** |

```text
PASS — B1-C1-H1-SHELL RESPONSIVE AUTHENTICATED HOME SHELL ESTABLISHED
```

This evidence closes **only** `B1-C1-H1-SHELL`. It does not close B1-C1-H1,
does not start COMPOSITION, and is not RELEASE READY or PRODUCTION VERIFIED.

---

## 1. Title and authority

B1-C1 remains the owner of `/home`. H1 is subordinate hardening of that same
shared Today shell. SHELL implements the frozen visual and accessibility
contract: skip-link, loading honesty, 72rem chrome, 960px two-column brief,
44px controls, and a compact mobile navigation disclosure.

ADMISSION and TRUTH product mapping were not reopened. COMPOSITION, R1, PROD
and FV have not started. Onboarding remains a separate parked program.

---

## 2. Scope

In scope: the existing authenticated Home shell, shared AppShell chrome, Home
loading honesty, and the presentation of the already-frozen Today brief.

Out of scope: a new dashboard or navigation architecture; sidebar or bottom
navigation; capability or route-authorization expansion; query-window
completeness (COMPOSITION); authenticated Production browser QA; onboarding;
schema, RLS, RPC, migrations, fixtures, and dependency changes.

---

## 3. Start SHA

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD before this commit | `ee5e7f94c246439eb292624f7812ae74167440e3` |
| Upstream at start | same SHA |
| Ahead / behind | `0 0` |
| Staging at start | empty |
| Untracked files at start | none |
| Post-R3 ten-file `git diff --binary` SHA-256 | `62b004f7a4020ff5aa1c2218b432fb5bd254d542a052733200ce8812d948991a` |
| Post-R3 binary-diff size | 35487 bytes |
| `git diff --check` | clean |

---

## 4. Final pre-commit tree state

Exactly eleven paths enter the SHELL commit: the original ten implementation
and test files plus this evidence document. No harness, screenshot, QA JSON,
generated output or dependency file is included.

---

## 5. Frozen contract mapping

| Freeze | Result |
| --- | --- |
| B1-C1 owns `/home` | Preserved. Home remains a bounded daily-operating brief. |
| One `h1` Today | Success, loading, and calm/partial/populated states use `Today`. Error/org-required headings remain the existing safe titles. |
| Frozen subtitle | `Priority Attention and due work in today’s brief.` |
| Frozen calm title | `No priority attention or due work is showing in today’s brief.` |
| Frozen calm supporting | `This page lists priority Attention and due work in today’s brief. Other items may exist elsewhere.` |
| Calm only when both queries succeed and `hasAnyActionable === false` | Unchanged. Partial and page-error never show calm. |
| Actions from server visibility, cap 3 | Unchanged TRUTH mapping. Hidden modules receive no action or view-all. |
| `?org=` | Unchanged TRUTH helper behavior. |
| Shell width | Centred `72rem`. Loading no longer uses a `56rem` inner max-width. |
| Two-column brief | `minmax(0, 1fr)` grid from `960px`; one column below. |
| Skip-link | First focusable control; `href="#main-content"`; visible on focus above header. |
| `main#main-content` | Unmoved; `tabIndex={-1}`. |
| Loading honesty | `navigationPresentation="pending"`; `Loading workspace…`; no Primary nav; no org/role. |
| No sidebar / four dashboards / KPI / feed / AI | Confirmed absent. |
| Control height | `--control-min-height` (2.75rem / 44px). |

---

## 6. Exact changed-file register

| Path | Role |
| --- | --- |
| `src/app/(authenticated)/home/page.tsx` | Kicker above one Today `h1`; display-only role labels |
| `src/app/(authenticated)/home/page.module.css` | Kicker wrap; header rhythm; `overflow-wrap` |
| `src/app/(authenticated)/home/loading.tsx` | Pending AppShell; frozen subtitle |
| `src/app/(authenticated)/home/loading.module.css` | Match main width; 960px skeleton grid |
| `src/components/app-shell.tsx` | Skip-link; pending slot; mobile `details`/`summary`; desktop presentation copy |
| `src/components/app-shell.module.css` | Skip-link focus; compact mobile header; desktop cluster; active-page styling |
| `src/features/daily-operating/ui/daily-operating-brief.tsx` | Partial uses warning `Alert`; calm still `role="status"` |
| `src/features/daily-operating/ui/daily-operating-brief.module.css` | 960px grid; 44px controls; wrap |
| `tests/features/daily-operating/daily-operating-brief-ui.test.tsx` | Home header, grid, loading honesty; existing TRUTH assertions kept |
| `tests/ui/appshell-customers-terminology.test.tsx` | Skip-link, pending, Menu, active Home, CSS contract |
| this file | SHELL evidence |

ADMISSION resolver, TRUTH domain mapping, middleware, onboarding, product-access
registry and logout server action were not redesigned. Logout remains
`logoutAction`.

---

## 7. Desktop shell result

At 1440×1000:

- centred 72rem header and main;
- ZyntixAI identity;
- Primary order unchanged for authorized items;
- Log out remains the existing server-action form;
- Home uses truthful `aria-current="page"` with a light current-page
  background;
- Menu trigger is `display: none`;
- two-column brief from 960px;
- no sidebar, shadow, or dashboard chrome.

Desktop and mobile markup are presentation copies of the same
server-authorized `moduleNavVisibility`. They are not separate authorization
sources. Organization-selector IDs stay unique.

---

## 8. Mobile shell result

At 390×844 the collapsed header is one compact 73px row: ZyntixAI and a
visible **Menu** trigger. Closed `<details>` descendants are not
keyboard-focusable. The wrapped multi-row desktop link list is not shown.

Open menu:

- only server-authorized items;
- unchanged order;
- Home visibly current when Home is the destination;
- Log out separated on the same surface;
- Menu remains the close control.

Unresolved open menu: Home and Log out only. Pending: no Menu and no Primary
nav.

The earlier R2 blocker — multi-row wrapped desktop navigation at 390px — is
resolved by this compact disclosure.

---

## 9. Active-route truth

`aria-current="page"` is set only when `activeNav` matches that destination.
Home pages pass `activeNav="home"`. Default `activeNav` remains `"tasks"`.
Unrelated routes are not marked Home-active. Tests lock Home current, Leads
current, and omitted `activeNav`.

---

## 10. Populated / calm / partial / error / pending / unresolved matrix

| State | Shell | Brief / main | Calm | Nav honesty |
| --- | --- | --- | --- | --- |
| Populated | Compact mobile or inline desktop Primary | Kicker, Today, subtitle, sections, rows | No | Authorized items only |
| Calm / empty | Same | Frozen calm card; 0–3 visibility actions | Yes, only when both queries succeed and empty | Unchanged TRUTH |
| Partial Attention failure | Same | Warning `Alert`; failed sections `role="alert"`; successful Tasks remain | **No** | Unchanged |
| Full page error | Fail-closed AppShell | `Unable to load today’s brief` + error `Alert` | **No** | No expansion |
| Pending / loading | Brand + `Loading workspace…` + Log out | Today, frozen subtitle, `Loading today’s brief…`, four skeletons | No | No Primary, no Menu, no org/role |
| Unresolved / Home-only | Home only | No module actions or view-all | Calm if empty and both queries succeed | Home + Log out only |

---

## 11. Accessibility and keyboard evidence

Source and tests:

- skip-link is the first focusable control;
- `href="#main-content"`;
- `main#main-content` has `tabIndex={-1}`;
- focused skip-link is `position: fixed`, `z-index: 50`, above header;
- Enter updates the hash and focuses main;
- next Tab reaches the first interactive control inside main;
- native `summary` accessible name is **Menu**;
- Enter and Space open the disclosure;
- Enter on Menu closes it without navigation;
- focus remains on Menu after close;
- collapsed tab order at 390px: Skip → Menu → first main control;
- desktop Menu is not in the tab order;
- focus-visible outline remains `2px solid var(--focus-color)`;
- no conflicting ARIA on native `details`.

The focused skip-link temporarily overlays the brand. This is an accepted
accessibility presentation and causes no permanent layout shift.

Objective local Chromium measurements (synthetic harness, later removed):

| Viewport | Initial | First Tab | Enter | Next Tab |
| --- | --- | --- | --- | --- |
| 390×844 | `BODY` | Skip visible | `#main-content`; `activeId=main-content` | `View all Attention` inside main |
| 1440×1000 | `BODY` | Skip visible | same | first control in main |

390px second Tab (fresh page): Menu, `detailsOpen=false`. After Enter: first
open link Home with `aria-current="page"` and outline `rgb(37, 99, 235) solid
2px`. Space opens. Close returns focus to Menu.

1440px second Tab (fresh page): Home, not Menu.

Control heights: Menu, Primary links, Log out and skip-link ≥ 44px.
`overflowDelta` 0. Zero page errors. Zero failed requests. Zero external
resource origins.

---

## 12. Test-command register

No test was skipped, deleted or weakened.

| Command | Exit | Passed | Failed | Skipped |
| --- | --- | --- | --- | --- |
| `npx vitest run tests/ui/appshell-customers-terminology.test.tsx tests/features/daily-operating tests/features/product-access/beta1-4tg-appshell-gating.test.ts --reporter=verbose` | 0 | 88 | 0 | 0 |
| `npx vitest run tests/ui/tasks-ui-accessibility.test.tsx --reporter=verbose` | 0 | 4 | 0 | 0 |

---

## 13. Build / typecheck / lint register

| Command | Exit | Notes |
| --- | --- | --- |
| `npm run typecheck` | 0 | no output |
| `npx next lint --file` on AppShell, Home page, Home loading, brief, and the two SHELL test files | 0 | `next lint` deprecation notice (Next.js 16). No ESLint warnings in the scanned files. |
| `npm run build` | 0 | Pre-existing Social CSS autoprefixer warning: `end value has mixed support, consider using flex-end instead` in `src/features/social-media/ui/platform-closed-beta-operator-list.module.css`. Possible webpack cache serialization warning for that same CSS Warning object. Not introduced by SHELL. |

---

## 14. Screenshot register

Classification for every row:

`LOCAL SYNTHETIC VISUAL EVIDENCE — NOT PRODUCTION EVIDENCE`

Artifacts remain outside the repository at `[LOCAL-QA-DIRECTORY-REDACTED]`.
PNG files and QA JSON reports are not committed. Data were synthetic and
fictional. No Production credentials, cookies, storage state or sessions were
used.

Human visual-review verdict for the set:

`PASS — B1-C1-H1-SHELL HUMAN VISUAL REVIEW COMPLETED`

`SHELL-R3-02` and `SHELL-R3-03` intentionally share the same open-menu
rendering and SHA-256. R3-02 records the open menu; R3-03 records the visible
active Home treatment in that same state. This is not a blocker.

| ID | State | Viewport | PNG | SHA-256 | Overflow | Navigation | Human review |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SHELL-R3-01 | populated, collapsed | 390×844 | 390×844 | `386a83cb02c28eb3ff6344e8d935b9b4567ece7753db6060dd4271b88f385d7a` | none | Menu visible; Today visible | PASS |
| SHELL-R3-02 | populated, open | 390×844 | 390×844 | `5abc01bc389050ccc8e21950f3893ad3da51c4fdfdf34719aa91fe8a4deedcbb` | none | authorized Primary + Log out; Home current | PASS |
| SHELL-R3-03 | active Home | 390×844 | 390×844 | `5abc01bc389050ccc8e21950f3893ad3da51c4fdfdf34719aa91fe8a4deedcbb` | none | Home current-page treatment | PASS |
| SHELL-R3-04 | empty/calm | 390×844 | 390×844 | `23bcb2a52c39627c3a1363880529d9f5bde12f987be47185d8cfe93feca80f87` | none | collapsed Menu | PASS |
| SHELL-R3-05 | partial | 390×844 | 390×844 | `50f87a19217d69dbd4fcec1b1316fe06569ea7c1401115fbad66d9cecd99ebb8` | none | collapsed Menu; warning visible | PASS |
| SHELL-R3-06 | pending | 390×844 | 390×844 | `662359a17554df464a079307ef65b4f60ce85bf723e6cf819a45d6752316655c` | none | no Menu; Loading workspace… + Log out | PASS |
| SHELL-R3-07 | unresolved | 390×844 | 390×844 | `2cfe49b8b77bf440b1fc9904364098b2cf22d3bc24b817033299b277cf5f6c15` | none | Home + Log out only | PASS |
| SHELL-R3-08 | skip-link focused | 390×844 | 390×844 | `6ec3eb3af228ab21f9e9771e48082353dd68a6df83beaa1b2747e4da8ec065a9` | none | skip visible above header | PASS |
| SHELL-R3-09 | Menu keyboard-focused | 390×844 | 390×844 | `926a44ba9440146ca9ad14e170d9df12718be7cd6d5068df40340eed00433eaa` | none | Menu outline visible | PASS |
| SHELL-R3-10 | populated desktop | 1440×1000 | 1440×1000 | `e1e58e36837f65c7e0a200f324d118a3d0fcbc5ca9023a7a40f5937d4ee712f2` | none | inline Primary; Home current | PASS |
| SHELL-R3-11 | empty desktop | 1440×1000 | 1440×1000 | `7259922a53782858295d312557c8e16dc68e3a64bc47c78fb5bdc2f5e4e1629b` | none | inline Primary; calm | PASS |
| SHELL-R3-12 | desktop skip-link | 1440×1000 | 1440×1000 | `fe1eedd0e2d4a2e00839e9cd3f708d7320aafa458292ed42bd7ef1cb8712b67f` | none | skip focused | PASS |

Long organization-name wrapping, 44px controls, single-column mobile cards and
two-column desktop brief were included in that human review.

---

## 15. Human visual-review verdict

```text
PASS — B1-C1-H1-SHELL HUMAN VISUAL REVIEW COMPLETED
```

Confirmed PASS: mobile collapsed header; mobile open menu; active Home;
populated; empty/calm; partial; pending; unresolved; desktop regression;
skip-link and visible focus; overflow and readability.

---

## 16. Console / network findings

Local synthetic Chromium context: zero page errors, zero failed requests,
zero external resource origins. Bind address was loopback only. The
temporary feature-flagged harness imported real AppShell, Home components and
production CSS. It made no Production requests.

---

## 17. Security / privacy review

| Check | Result |
| --- | --- |
| Email addresses / tokens / cookies / JWT / passwords | none in the SHELL diff or this evidence |
| Authorization headers | none |
| Supabase project references | none |
| Organization UUIDs / recovery links | none in evidence; fictional harness UUIDs were not committed |
| Absolute local paths / usernames | redacted as `[LOCAL-QA-DIRECTORY-REDACTED]` |
| Production identifiers | none |
| Capability / route-authority expansion | none |
| Dual nav markup | presentation copies of the same server visibility |
| Temporary harness / runner | removed; loopback port released |
| Screenshots / QA JSON in git | **not committed** |

Historical commit SHAs and screenshot SHA-256 values are retained as evidence
identifiers.

---

## 18. Cleanup confirmation

The temporary unauthenticated visual harness and runner were removed after
screenshot capture. The loopback port used for that run was released. No
untracked repository files remained from that run. Staging of this SHELL
commit does not include harness, screenshots or QA JSON.

---

## 19. Rollback scope

Revert the eleven paths listed in §6. After rollback, do **not** restore
`You are clear for now.` or universal Open Leads. Do not restore the
Home-only loading Primary as accepted honesty. No database or Production
rollback is required. Skip-link revert is independent of Home brief CSS.

---

## 20. Explicit evidence limitations

- Screenshots used synthetic fictional local data.
- No authenticated Production browser QA occurred.
- No Production mutation occurred.
- Screenshot artifacts remain outside the repository.
- This file is not Production evidence and not Final Verification.
- Query-window completeness is **not** proven (COMPOSITION).
- Other routes’ loading files still default FAIL_CLOSED; that residual is
  outside Home SHELL, as frozen in SHELL-DESIGN G9.
- Onboarding is not closed by this work.

---

## 21. Closure decision

```text
PASS — B1-C1-H1-SHELL RESPONSIVE AUTHENTICATED HOME SHELL ESTABLISHED
```

The contract chrome goal in H1 §12.3 (skip-link, loading honesty, 1440/390,
keyboard/focus, no overflow) is met for this SHELL slice. B1-C1-H1 as a
whole remains open.

---

## 22. Next frozen phase

**`B1-C1-H1-COMPOSITION`**. Do not start it from this evidence.

Then, as applicable and still open: `B1-C1-H1-R1`, `B1-C1-H1-PROD`,
`B1-C1-H1-FV`.

---

## 23. Forbidden claims (not made)

- B1-C1-H1 CLOSED
- PRODUCTION VERIFIED
- RELEASE READY
- onboarding complete
- Final Verification complete
- Home fully professional for all remaining H1 slices
