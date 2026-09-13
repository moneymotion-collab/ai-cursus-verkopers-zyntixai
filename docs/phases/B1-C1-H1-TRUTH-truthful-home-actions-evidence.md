# B1-C1-H1-TRUTH — Truthful Home Actions Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-TRUTH** |
| Date | 2026-09-13 |
| Parent authority | B1-C1 Daily Operating Composition — CLOSED WITH EVIDENCE |
| Contract | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` |
| Completed prerequisite | B1-C1-H1-ADMISSION — `5f501befbbfc95e5491b048861de229dd3e82ae1` |
| Start SHA | `5f501befbbfc95e5491b048861de229dd3e82ae1` |
| Branch | `core/platform-readiness-20260707` |
| Migrations | **NONE** |
| Commit / push | **NOT DONE in this slice** |

```text
PASS — B1-C1-H1-TRUTH PRODUCT-TRUTHFUL HOME ACTIONS ESTABLISHED
```

This evidence closes **only** TRUTH. It does not close B1-C1-H1, does not
claim Home is fully professional, and is not RELEASE READY or PRODUCTION
VERIFIED.

---

## 1. Root cause

Home already composed a bounded Today brief, but the calm banner over-claimed
and the next-step links were not context-safe.

| Finding | Location |
| --- | --- |
| Calm state | `DailyOperatingBriefPanel` when `!hasAnyActionable && !attentionQueryFailed && !tasksQueryFailed` |
| Calm copy | Same panel; title was `You are clear for now.` |
| “Open Leads” | Hardcoded calm links to `/attention`, `/tasks`, `/leads` |
| `moduleNavVisibility` | Reached AppShell, **not** the panel |
| Active `organizationId` | Present on `brief.organizationId`; panel built `?org=` locally |
| Org-aware URLs | `?org=${encodeURIComponent(brief.organizationId)}` on server-rendered `Link`s; `OrgAwareLink` unused (client) |
| Error/partial flags | `attentionQueryFailed`, `tasksQueryFailed` from the Home loader |
| Panel | Server component (no `"use client"`) |

Partial failure already suppressed calm. The remaining defects were dishonest
copy, universal Leads, and missing server visibility on the panel.

---

## 2. Exact allowlist

| Category | Path |
| --- | --- |
| A | `src/features/daily-operating/domain/compose-daily-operating-brief.ts` |
| B | `src/features/daily-operating/ui/daily-operating-brief.tsx` |
| C | `src/app/(authenticated)/home/page.tsx` |
| D | `tests/features/daily-operating/compose-daily-operating-brief.test.ts` |
| D | `tests/features/daily-operating/daily-operating-brief-ui.test.tsx` |
| E | this file |

Three product files, two test files, one evidence file. ADMISSION files were not
modified.

---

## 3. Frozen copy

Exact contract §4.2 strings (U+2019 apostrophe):

```text
No priority attention or due work is showing in today’s brief.
```

```text
This page lists priority Attention and due work in today’s brief. Other items may exist elsewhere.
```

```text
Priority Attention and due work in today’s brief.
```

Removed:

- `You are clear for now.`
- `Nothing urgent needs your attention and no assigned work is due today.`
- `What needs attention and what you need to do next.`

Section-local empty rows (`No work is due today.` and similar) remain local.

Workspace identity uses the existing loader `organizationOptions` display name
and the existing role enum labels `Owner` / `Admin` / `Staff` / `Viewer`.
No greeting, job title, or operating-model marketing line.

---

## 4. Calm-state conditions

`isDailyOperatingCalmState` is true only when:

- `hasAnyActionable === false`
- `attentionQueryFailed === false`
- `tasksQueryFailed === false`

Otherwise the existing partial/error warning is shown, successful sections
remain, and unknown data is not presented as a full calm claim. No retry
infrastructure was added.

---

## 5. Action mapping from real visibility

`resolveDailyOperatingCalmActions` reads server `ModuleNavVisibility` and the
existing module registry routes. It does **not** hardcode operating-model IDs
in product code. Candidate order matches contract §8.3 once visibility is
applied: Attention, Tasks, then Work orders, Orders, Projects, Leads. Cap: 3.
Duplicates are impossible because each module ID is considered once.

| Context | Visibility authority | Actions shown | Forbidden |
| --- | --- | --- | --- |
| `course_seller` | `operatingModelNavVisibility("course_seller")` | Attention, Tasks, Leads | Projects / Work orders / Orders |
| `service` | same helper | Attention, Tasks, Projects | Leads (third slot is Projects) |
| `field_operations` | same helper | Attention, Tasks, Work orders | Leads even though Leads can be visible |
| `product_operations` | same helper | Attention, Tasks, Orders | Leads (`leads === false`) |
| unresolved | `FAIL_CLOSED` via `buildUnresolvedProductModuleAccess()` | none | any module CTA, including view-all |

Hidden modules also suppress section “view all” links and render matching
rows as non-navigating text. Visibility remains presentation; destination
loaders still authorize.

---

## 6. Organization-aware URLs

`buildDailyOperatingOrgQuery` / `buildDailyOperatingModuleHref` keep the
existing `?org=` contract:

- valid `organizationId` → `?org=<id>`
- empty `organizationId` → no `org=` and no invented fallback
- extra params (`dueState`) sit beside `org` via `URLSearchParams`
- `&` / `=` in a value are encoded; no extra query keys
- no foreign-org fallback
- organization resolver unchanged

The panel stays a server component, so there is no client-only visibility flash.

---

## 7. Test results (executed)

No browser or Production tests. No test skipped, removed, or weakened.

| Command | Exit | Passed | Failed | Skipped | Duration | Warnings |
| --- | --- | --- | --- | --- | --- | --- |
| `npx vitest run tests/features/daily-operating/compose-daily-operating-brief.test.ts` | 0 | 18 | 0 | 0 | 843ms | none |
| `npx vitest run tests/features/daily-operating/daily-operating-brief-ui.test.tsx` | 0 | 21 | 0 | 0 | 1.17s | none |
| `npx vitest run tests/features/daily-operating` | 0 | 57 | 0 | 0 | 939ms | none |
| `npx vitest run tests/features/product-access/beta1-4tg-appshell-gating.test.ts tests/onboarding/product-shell-authenticated-authority.test.ts` | 0 | 18 | 0 | 0 | 1.40s | none |
| `npx vitest run tests/ui/org-aware-link.test.tsx` | 0 | 2 | 0 | 0 | 1.15s | none |
| `npx vitest run tests/features/daily-operating/load-daily-operating-page.test.ts tests/onboarding/product-admission-app-shell.test.ts` | 0 | 23 | 0 | 0 | 1.54s | none |
| `npm run typecheck` | 0 | — | 0 | 0 | 16.7s | none |
| `npx next lint --file` (five changed product/test paths) | 0 | — | 0 | 0 | 11.6s | 2 pre-existing unused `_o`/`_d` in the Tasks factory, unchanged by this slice |

`next lint` reports itself deprecated in Next.js 16. No new product warning.

The daily-operating suite total includes the composition, UI, and ADMISSION
loader files already listed. Counts are per-command, not unique tests to add
together.

Covered: frozen calm title; old all-clear copy absent; subtitle source-lock;
empty success → calm; Attention failure / Tasks failure / both failures → no
calm; partial success keeps the successful section; non-empty priority/due
data → no calm; visibility-derived actions for four operating models +
unresolved; hidden module omitted; Open Leads not universal; max three unique
deterministic actions; `?org=` retained; accessible `Open …` names; empty
action set renders no container; no `"use client"` on Home or the panel.

---

## 8. Diff / security

| Check | Result |
| --- | --- |
| `git status --short` | 5 modified paths before this evidence file |
| `git diff --name-status` | those 5 paths |
| `git diff --check` | clean |
| Secrets / PII / Production IDs | none |
| Database / migration / RLS / RPC | none |
| Auth / onboarding / admission resolver | none |
| ADMISSION product files | intact |
| Dependencies / generated output | none |
| AppShell / CSS rebuild | none |
| Format churn | confined to allowlisted files |

---

## 9. Out of scope (not done)

AppShell skip-link and loading honesty (SHELL). Query-limit / composition
density (COMPOSITION). Browser 1440/390 and Production (R1 / PROD). Schema,
onboarding, KPIs, charts, activity feed, AI, new routes, four dashboards,
mock data, dependency changes.

---

## 10. Rollback and remaining evidence boundaries

Rollback: revert the three product files, two test files, and this evidence
file. After rollback, do **not** restore `You are clear for now.` as accepted
truth. No database or Production rollback is required.

This file is not Production evidence. It does not prove viewport overflow,
keyboard chrome, or live operating-model fixtures.

Next phase: **`B1-C1-H1-SHELL`**.

---

## 11. Forbidden claims (not made)

- B1-C1-H1 CLOSED
- Home fully professional
- RELEASE READY
- PRODUCTION VERIFIED
- onboarding completed
- all business information visible
- four target groups fully finished
