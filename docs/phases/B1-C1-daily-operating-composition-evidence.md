# B1-C1 — Daily Operating Composition — Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1 — Daily Operating Composition** (+ **B1-C1-R1** browser automation) |
| Date | 2026-08-19 |
| Formal status | `B1-C1 CLOSED WITH EVIDENCE — AUTHENTICATED PRODUCTION BROWSER AUTOMATION VERIFIED` |
| Branch | `core/platform-readiness-20260707` |
| Product implementation | `fbc9e0c29c25ee7dedc4b36c0cf1337e89b34a19` |
| Browser harness foundation | `0b4c936` |
| Harness + nav wrap fix | `fb7b7ae` |
| Evidence commit | *(this commit)* |
| Production deploy (composition) | `dpl_3PyraG19nn8pdfZymNzJbbBEKJhH` |
| Production deploy (nav wrap fix) | `dpl_3qCR3y7dSkGniCwMwFRZ8KG9a1MH` |
| www alias | `https://www.zyntixai.com` |
| Migrations | **NONE** |

```text
B1-C1 CLOSED WITH EVIDENCE — AUTHENTICATED PRODUCTION BROWSER AUTOMATION VERIFIED
```

---

## 1. Executive verdict

Authenticated Owner Production browser automation for `/home` now **PASSes** on desktop, mobile, and tablet after:

1. Owner local storageState bootstrap (gitignored)
2. Harness corrections for real Production empty/partial state + Chromium device emulation
3. Minimal AppShell primary-nav wrap fix for real mobile/tablet horizontal overflow

---

## 2. Authoritative baseline

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Control org | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Auth state path | `playwright/.auth/production-owner.json` (**gitignored**, never committed) |

---

## 3. Product problem

Start-of-day Owner question answered by `/home` composition over Attention + Tasks.

---

## 4–13. Domain reuse / architecture / contracts

Unchanged from B1-C1 product implementation: thin server composition, deterministic priority, Owner/Admin org Attention visibility, tenant-bound reads, no migration, no AI ranking, no enrollment metadata UI, no activity feed.

---

## 14–15. UX / mobile

Loading flash (`home/loading.tsx` “Loading today’s brief…”) remains **B1-C5 POLISH** (bounded, resolves).

AppShell `.nav` now `flex-wrap: wrap` so primary navigation does not force document horizontal overflow on narrow viewports.

---

## 16–18. Fixture / regression

| Suite | Result |
| --- | --- |
| daily-operating Vitest + AppShell login UI | PASS (32 targeted after fix) |
| typecheck / lint / build | PASS (post-nav fix) |

---

## 19. Browser QA — initial 3 failures (retained)

Authenticated Owner storageState was present. Suite initially failed **3/3**.

### Shared vs distinct causes

| Failure | Classification | Exact root cause |
| --- | --- | --- |
| desktop | **A. TEST/HARNESS DEFECT** + **C. PRODUCTION EXPECTATION MISMATCH** | Asserted `getByRole('alert')` count 0, but Next.js App Router injects invisible route announcer with `role="alert"`. Also required full calm empty banner while Production **Organization attention** correctly shows a High Attention fixture item. Auth/session/URL were healthy. |
| mobile | **A. TEST/HARNESS DEFECT** (first), then **D. REAL PRODUCT DEFECT** (after harness fixed) | First: `devices['iPhone 13']` defaults to **webkit** (not installed). After forcing Chromium: real overflow `scrollWidth=847` / `clientWidth=390` from `.nav` / `.brandBlock` without wrap. |
| tablet | same as mobile | `devices['iPad Mini']` → webkit; then real overflow `855` vs `769` from same nav. |

### Desktop failure diagnostics (evidence)

| Field | Value |
| --- | --- |
| Project | desktop-chromium |
| Spec | `b1-c1-production-home.desktop.spec.ts` |
| Assertion | `expect(page.getByRole('alert')).toHaveCount(0)` |
| Expected | 0 |
| Actual | 1 |
| Final URL | `/home?org=2fc07699-…` (authenticated; not login) |
| Visible UI | Today shell; Organization attention with High item; Assigned/Overdue/Due today empty |
| Screenshot | `test-results/...desktop.../test-failed-1.png` |
| Trace | retained on failure |
| Console/network product failure | none observed for composition |
| Auth | valid Owner session; org bound |

### Mobile/tablet first failure (harness)

| Field | Value |
| --- | --- |
| Error | `browserType.launch` missing WebKit executable |
| Cause | device preset `defaultBrowserType: webkit` |

### Mobile overflow (product, measured)

| Field | Value |
| --- | --- |
| documentElement.clientWidth | 390 |
| documentElement.scrollWidth | 847 (before fix) / **390** (after fix) |
| Offending elements | `NAV.app-shell_nav`, `DIV.app-shell_brandBlock` (~831px) |
| CSS | `.nav { display:flex; }` lacked `flex-wrap` |

---

## 19b. AUTOMATED AUTHENTICATED PRODUCTION QA (after correction)

| Check | Result |
| --- | --- |
| Framework | Playwright Chromium |
| Auth strategy | local gitignored storageState |
| Desktop | **PASS** |
| Mobile | **PASS** (no horizontal overflow) |
| Tablet | **PASS** |
| Org context | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Reload / back | PASS (desktop) |
| Console/network health | PASS (desktop/mobile health collector) |
| Final suite | **`npm run test:browser:b1-c1` → 3 passed** |

Current Production semantics asserted:

- Organization attention may be populated (High Attention present)
- Assigned Attention empty
- Overdue empty
- Due today empty
- No product failure copy (“Unable to load …”)

---

## 19c. FIXTURE / TEST ENVIRONMENT QA

Populated Attention/Task composition, priority, tenant/role, honest failure ≠ empty: Vitest PASS (not claimed as Production data).

---

## 19d. HUMAN UX OBSERVATION

| Observation | Class |
| --- | --- |
| Brief loading transition | B1-C5 polish |
| Natural assigned/overdue/due-today empty | expected |

---

## 20. Production verification

| Check | Result |
| --- | --- |
| Deploy after nav wrap | `dpl_3qCR3y7dSkGniCwMwFRZ8KG9a1MH` Ready |
| Alias | `https://www.zyntixai.com` |
| Authenticated `/home` | verified by Playwright |
| Application code changed | **YES** — AppShell `.nav` wrap only (minimal) |
| Harness changed | **YES** — assertions + force Chromium |

---

## 21. Social safety

| Check | Result |
| --- | --- |
| `SOCIAL_PUBLISHING_ENABLED` | `"false"` |
| Enrollments | 1 (`publishing_allowed`) |
| Windows | closed=1, consumed=2; **no active** |
| R1-F | untouched |
| Provider write / window create by this phase | **NONE** |

---

## 22. Known limitations

1. Populated Attention/Task click-through on Production not required (fixture covers links; Production currently has org Attention only).
2. Loading transition polish remains B1-C5.
3. Auth storageState is local-only and expires; rebootstrap if session dies.

---

## 23. Git state

After evidence push: HEAD = upstream = origin, divergence `0 0`, clean worktree (except ignored auth state).

---

## 24. Closure verdict

```text
B1-C1 CLOSED WITH EVIDENCE — AUTHENTICATED PRODUCTION BROWSER AUTOMATION VERIFIED
```

**STOP before B1-C2.**
