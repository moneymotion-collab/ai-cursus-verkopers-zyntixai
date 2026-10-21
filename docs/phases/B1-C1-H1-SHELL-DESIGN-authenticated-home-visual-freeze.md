# B1-C1-H1-SHELL-DESIGN — Authenticated Today Home Visual Freeze

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-SHELL-DESIGN** |
| Date | 2026-09-13 |
| Document status | `PASS — B1-C1-H1-SHELL-DESIGN FROZEN, IMPLEMENTATION NOT STARTED` |
| Parent authority | B1-C1 Daily Operating Composition — CLOSED WITH EVIDENCE |
| Hardening authority | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` |
| Completed prerequisites | B1-C1-H1-ADMISSION, B1-C1-H1-TRUTH |
| Start SHA | `6082c866c09c0688fa7116fcc6736eafc9fda854` |
| Branch | `core/platform-readiness-20260707` |
| Implementation | **NOT STARTED** |

This document freezes visual and interaction design for the existing shared
Today shell at `/home`. It does not implement SHELL, does not close
B1-C1-H1, and is not Production evidence.

---

## 1. Authorities and frozen product truth

B1-C1 remains owner of `/home`. Home is a bounded daily-operating brief, not a
dashboard.

TRUTH remains frozen and must not be redesigned:

```text
No priority attention or due work is showing in today’s brief.
```

```text
This page lists priority Attention and due work in today’s brief. Other items may exist elsewhere.
```

```text
Priority Attention and due work in today’s brief.
```

Calm only when Attention and Tasks both succeed and `hasAnyActionable === false`.

Action mapping (visibility-derived, max three, no operating-model IDs in
product code):

| Context | Actions |
| --- | --- |
| `course_seller` | Attention, Tasks, Leads |
| `service` | Attention, Tasks, Projects |
| `field_operations` | Attention, Tasks, Work orders |
| `product_operations` | Attention, Tasks, Orders |
| unresolved / Home-only | none |

“Open Leads” is not universal. Hidden modules get no action and no view-all
link. Matching rows become non-navigating text. Visibility is presentation;
destination loaders remain authorization.

Forbidden in this design: sidebar, command palette, activity feed, charts,
KPI tiles, AI summary, greetings, health scores, separate target-group
dashboards, new routes, mock data.

---

## 2. Visual inventory (read-only)

Inspected: Home page and CSS, Home `loading.tsx`, `DailyOperatingBriefPanel`
and module CSS, organization-required panel, AppShell + CSS, `globals.css`
tokens, `Alert` / `Surface` / `Badge` / `Button` / `EmptyState`,
`OrgAwareLink`, H1 contract §9–§10, ADMISSION and TRUTH evidence, B1-C1 and
B1-C5 evidence.

### 2.1 Current DOM hierarchy (success)

```text
AppShell
  header.header
    brand “ZyntixAI”
    nav[aria-label="Primary"]   ← server moduleNavVisibility
    org selector (only if organizationOptions.length > 1)
    Log out
  main#main-content
    .page
      header.pageHeader
        h1 Today
        p.subtitle  {org displayName} · {Owner|Admin|Staff|Viewer}
        p.subtitle  frozen Today subtitle
      DailyOperatingBriefPanel.root
        [optional] .partialWarning role="status"
        [optional] .calmState role="status"
          p.calmTitle
          p.calmDescription
          [optional] .calmLinks (0–3 Open … links)
        section “Organization attention”          owner/admin only
        section “Assigned to me — Attention”
        section “Overdue work”
        section “Due today”
  [optional] footer support mailto
```

There is **no skip-link**. `main id="main-content"` already exists.

Non-success Home headings remain: “Sign in required”, “Organization required”,
“Organization selection required”, “Unable to load today’s brief”.

### 2.2 Width, spacing, type, color

| Token / fact | Value | Source |
| --- | --- | --- |
| Page canvas | `body` background `#f8fafc` | `globals.css` |
| Text | `--text-color: #0f172a` | `globals.css` |
| Muted | `--muted-text: #475569` | `globals.css` |
| Surface | `--surface-color: #ffffff` | `globals.css` |
| Border | `--border-color: #cbd5e1` | `globals.css` |
| Link | `--link-color: #1d4ed8` | `globals.css` |
| Focus | `--focus-color: #2563eb`; `outline: 2px solid`; offset `2px` | `globals.css` |
| Control height | `--control-min-height: 2.75rem` (44px) | `globals.css` |
| Action height | `--action-control-min-height: 3rem` | `globals.css` |
| Control radius | `--control-radius: 0.5rem` | `globals.css` |
| Surface radius | `--surface-radius: 0.75rem` | `globals.css` |
| Motion | `--motion-duration-micro: 120ms` | `globals.css` |
| Font | `system-ui, -apple-system, Segoe UI, Roboto, sans-serif` | `globals.css` |
| Line-height | `1.5` | `globals.css` |
| Shell max width | `72rem` (1152px) centered | `app-shell.module.css` `.main` / `.headerInner` |
| Shell padding | `1.25rem 1rem 2rem`; `1.5rem` horizontal from `768px` | AppShell |
| Home page gap | `1rem` | `page.module.css` |
| Header stack gap | `0.375rem` | `page.module.css` |
| Today `h1` | `1.75rem`, margin 0 | `page.module.css` |
| Brief root gap | `1.25rem` | brief CSS |
| Section padding | `1rem`; radius `0.75rem`; 1px border | brief CSS |
| Section `h2` | `1.05rem` | brief CSS |
| Row min-height | `2.75rem`; padding `0.75rem`; radius `0.5rem` | brief CSS |
| Calm / view-all min-height | **`2.5rem`** (40px) — below token | brief CSS |
| Shadows | **none** on Home or AppShell | inventory |
| Home inner max-width | none (inherits 72rem) | `page.module.css` |
| Loading inner max-width | **`56rem`** (inconsistent with 72rem) | `loading.module.css` |
| Brief mobile breakpoint | `max-width: 640px` stacks row + severity | brief CSS |
| AppShell desktop padding | `min-width: 768px` | AppShell |

### 2.3 Focus, loading, partial, primitives

- Global `:focus-visible` on `a, button, select, input`.
- Rows add a local 2px `--focus-color` outline.
- Loading: AppShell + `h1` Today + **stale** subtitle `What needs attention and what you need to do next.` + `Loading today’s brief…` + four skeleton blocks. `aria-busy="true"` `aria-live="polite"`. Skeleton animation gated by `prefers-reduced-motion`.
- Loading AppShell omits `moduleNavVisibility`, so AppShell defaults to `FAIL_CLOSED_MODULE_NAV_VISIBILITY` (**Home-only nav presented as if it were the product**).
- Partial: custom amber box (`#fffbeb` / `#b45309` / `#92400e`), `role="status"`. Failed sections use `role="alert"` text, not empty-zero copy.
- Page-level loader errors already use `Alert variant="error"`.
- Reusable primitives: `AppShell`, `Alert`, `Surface` (unused on Home), `Badge` (unused on Home), `Button` (unused on Home), `EmptyState` (unused; would inject a second `h2`), `OrgAwareLink` (client; used in AppShell nav, not in the brief).

### 2.4 Workspace identity data that actually exists

On **success** only:

| Data | Available | Currently shown |
| --- | --- | --- |
| `organizationOptions[].displayName` | yes; empty names already become `Organization {n}` in `buildOrganizationOptions` | yes, selected org |
| `result.role` / option role | yes; `owner \| admin \| staff \| viewer` | yes, via `formatDailyOperatingRoleLabel` |
| `selectedOrganizationId` | yes | selector + links |
| `brief.organizationId` | yes | `?org=` |
| `moduleAccess.navVisibility` | yes | AppShell + panel |
| `moduleAccess.terminology` | yes | AppShell nav only |
| `result.timeZone` | yes on success (`UTC` if resolver lookup failed) | **not shown** |

Not available on `loading.tsx`: org name, role, timezone, visibility. Next.js
`loading.tsx` cannot receive the Home loader payload. Inventing them is
forbidden.

### 2.5 Design inconsistencies to close in SHELL

1. Loading subtitle still uses pre-TRUTH copy.
2. Loading inner width `56rem` vs success `72rem` causes layout shift.
3. Loading presents FAIL_CLOSED Home-only nav as a completed primary nav.
4. No skip-link to `#main-content`.
5. Calm/view-all targets are `2.5rem`, below `--control-min-height`.
6. Workspace identity sits under `h1` as a second muted line, equal weight to the brief subtitle.
7. Operational sections are a single column at all widths; 1440px wastes scan width.
8. Partial styling is a one-off palette instead of `Alert` warning.
9. Quick actions are underlined text, not the existing secondary control language.

---

## 3. Design principles

1. Quiet high-end SaaS: white surfaces on `#f8fafc`, 1px `--border-color`,
   `--surface-radius`, **no shadow, no gradient hero, no decorative illustration**.
2. One shared Today shell for all four operating models and unresolved context.
3. Priority is communicated by heading order, severity **text**, and overdue
   labels — not by saturating the page with color.
4. TRUTH copy and action mapping are content; SHELL only restyles and places
   them.
5. Existing tokens first. Home-specific custom properties are allowed only as
   aliases of this palette.
6. Server-rendered Home panel stays a server component. No client-only
   visibility.

---

## 4. Frozen product structure

### A. Product shell

Keep `AppShell`. Keep server-resolved primary nav, org selector when
`organizationOptions.length > 1`, Log out, optional support footer.

- No sidebar, drawer, hamburger, or command palette.
- Nav items must not be `display: none`’d by CSS; wrapping is the mobile
  strategy.
- Unresolved Home-only nav remains the **resolved** FAIL_CLOSED presentation,
  distinct from loading (see §10).

### B. Workspace context header (success)

Visible, non-heading kicker then one `h1`:

1. Workspace kicker (not a heading): `{displayName} · {role label}`.
2. `h1` **Today** — only `h1` on the success page.
3. Frozen subtitle `Priority Attention and due work in today’s brief.`

**Calendar date: omit in SHELL.** `result.timeZone` exists, but the resolver
already substitutes `"UTC"` when lookup fails. SHELL cannot tell a real UTC
organization from a failed lookup without changing the organization resolver
(forbidden). Fallback for unavailable/unsafe timezone: **show no date**.

| Condition | Presentation |
| --- | --- |
| Missing display name | Keep `Organization {n}` from `buildOrganizationOptions`; do not invent a trade name |
| Very long name | Wrap with `overflow-wrap: anywhere`; no ellipsis that hides the accessible name |
| Unknown role | Omit ` · {role}`; show name only. Do not invent a job title |
| One organization | Name + role; selector stays hidden (existing AppShell rule) |
| Multiple organizations | Show **selected** name; existing selector remains the switcher |
| Loading / error / org required / auth required | Do not display another organization’s name |

No greeting, persona, health, revenue, trend, or AI line.

### C. Quick actions

TRUTH mapping only. Placement:

- **Calm / truthful empty:** up to three `Open …` actions inside the calm
  status card, visually secondary to the title/supporting copy.
- **Populated:** no second global action bar. View-all + row links are the next
  steps.
- **Zero actions:** render no action container.
- Style: secondary control (see §8), wrap, `--control-min-height`, focus ring.
- Do not convert the panel to `OrgAwareLink` (client). Keep server `?org=` hrefs.

### D. Operational brief — exactly four sections

1. Organization attention — owner/admin only.
2. Assigned to me — Attention.
3. Overdue work.
4. Due today.

No fifth KPI, planning, or activity section. Section cap remains 5 items
(`DAILY_OPERATING_SECTION_LIMIT`). Completeness of the fetch window is
COMPOSITION, not SHELL.

---

## 5. Desktop contract — 1440px

Viewport: **1440px** wide. Shell content column is **72rem (1152px)** centered.
Horizontal padding inside the column: **1.5rem** (`768px+` AppShell rule).
Usable Home canvas ≈ `1152px - 3rem ≈ 1104px`.

Do not add a second inner max-width on success Home. Loading must use the
same full `main` width (remove `56rem`).

### 5.1 Vertical rhythm

| Block | Gap after |
| --- | --- |
| Workspace kicker → Today | `0.25rem` |
| Today → subtitle | `0.375rem` |
| Header block → brief | `1.25rem` |
| Partial/calm → sections | `1.25rem` |
| Section grid gap | `1rem` |
| Inside section | `0.75rem` |
| List rows | `0.5rem` |

### 5.2 Header

```
[kicker: org · role]     muted, 0.875rem, wrap
Today                    h1 1.75rem / 700, --text-color
[frozen subtitle]        muted, 1rem
```

Kicker is visually first; `h1` remains the first heading.

### 5.3 Quick actions (calm only)

Inside the calm card, below supporting copy:

- `display: flex; flex-wrap: wrap; gap: 0.75rem`
- Each control: min-height `var(--control-min-height)`, padding
  `0.375rem 0.875rem`, radius `var(--control-radius)`, border
  `1px solid var(--control-border-color)`, background `--surface-color`,
  color `--text-color`, font-weight 600, no underline.
- Hover: `border-color: var(--focus-color)` without a heavy fill.
- Focus-visible: global 2px `--focus-color` offset 2px.
- Max three. Deterministic TRUTH order.

### 5.4 Operational grid

From **`min-width: 960px`**:

```css
grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
gap: 1rem;
```

Owner/admin:

| Column 1 | Column 2 |
| --- | --- |
| Organization attention | Assigned to me — Attention |
| Overdue work | Due today |

Staff/viewer (no org section): the three remaining cards fill the same 2-column
auto-flow. The third card sits left on the second row. Do not stretch a card
across both columns.

Below 960px: one column, existing DOM order.

Card:

- `min-width: 0` (prevent overflow)
- No max-width beyond the grid cell
- Border `1px solid var(--border-color)`
- Radius `var(--surface-radius)`
- Background `--surface-color`
- **Shadow: none**
- Padding `1rem`

Section header: `h2` left, view-all right, `flex-wrap`, baseline. View-all
min-height `--control-min-height`, `--link-color`, underline.

Empty section: local title + muted description; no `EmptyState` (that
component’s `h2` would collide with section `h2`).

Partial banner: full width above the grid.

### 5.5 Rows

See §7. Desktop rows stay horizontal: title/meta left, severity/due chip
right.

---

## 6. Mobile contract — 390px

Viewport: **390px**. Shell horizontal padding: **1rem**. Usable canvas
≈ **358px**. Document `scrollWidth` must not exceed `clientWidth`.

| Element | Behavior |
| --- | --- |
| Side margins | inherit AppShell `1rem`; no extra Home bleed |
| Header | stack kicker → Today → subtitle; wrap long org name |
| Role label | same line as name when it fits; wrap as a unit, never overflow |
| Quick actions | wrap; each control full min-height 2.75rem; may grow to 100% width if a label would overflow |
| Brief | **one column**; section order unchanged |
| Card padding | `1rem` |
| Rows | existing `max-width: 640px` stack: title then chip |
| View-all | wrap under `h2`; min-height 2.75rem |
| Empty / partial / error / loading | same components, stacked |
| Touch | all interactive Home and shell controls ≥ `2.75rem` |
| Primary nav | existing `flex-wrap`; do not hide items; no new drawer |

Unresolved Home-only nav: still only Home, as a **resolved** FAIL_CLOSED set,
not as a loading placeholder.

---

## 7. Item-row contract

Attention rows:

| Slot | Content | Rules |
| --- | --- | --- |
| Primary | `item.title` | `font-weight: 600`; `overflow-wrap: anywhere` |
| Meta | `contextLabel` if present | muted `0.9rem`; wrap; omit if null |
| Chip | `getAttentionSeverityLabel` plus existing `sr-only` prefix `Severity ` | text + color; never color alone |
| Link | whole row if `moduleNavVisibility.attention`; else non-navigating `.row` | href already includes `?org=` |

Task rows:

| Slot | Content |
| --- | --- |
| Primary | `item.title` |
| Meta | `Overdue` or `Due today` only |
| Chip | none |
| Link | whole row if `moduleNavVisibility.tasks`; else text |

Do **not** add formatted `dueAt` timestamps in SHELL. `dueAt` exists on the
row model but is not currently rendered; showing it would require a timezone
presentation SHELL is not freezing (see §4.B).

Max metadata: title + one context/due line + one severity chip. No assignee
avatar, no KPI, no hover-only control.

Hover (navigating rows only): 1px `--border-color` and
`color-mix(in srgb, var(--surface-color) 88%, var(--focus-color) 12%)`.
Non-navigating rows: no hover affordance that looks like a link.

Accessible name: visible title is the name; severity remains in the name via
visible + `sr-only` text.

---

## 8. Visual hierarchy and token mapping

Scan order:

1. Workspace kicker (org · role)
2. Today (`h1`)
3. Frozen subtitle
4. Partial/error status if any
5. Calm card + quick actions when lawful
6. Operational sections (`h2`)
7. Items
8. Metadata / chips

| Role | Element | Token |
| --- | --- | --- |
| Page `h1` | Today | `1.75rem`, `--text-color` |
| Section `h2` | four brief titles | `1.05rem`, `--text-color` |
| Supporting | subtitle, calm supporting, empty description | `--muted-text` |
| Labels | kicker, view-all, Open … | 0.875–1rem |
| Badges/chips | severity text | existing `.severity` + `sr-only`; do not replace with color-only `Badge` |
| Links | view-all, Open … | `--link-color` or secondary control border |
| Status | calm/partial `role="status"`; section/page errors `role="alert"` | Alert tokens below |

Optional Home aliases (must equal existing values, not a second palette):

```css
--home-section-gap: 1rem;
--home-grid-min: 960px;
```

Partial banner: reuse `Alert` `warning` (`#fffbeb` / `#fde68a` / `#78350f`)
instead of the one-off `#b45309` box. Page errors keep `Alert` `error`.

Severity colors (keep; they already accompany text):

| Severity | Border / text |
| --- | --- |
| critical | `#991b1b` |
| high | `#c2410c` |
| medium | `#a16207` |
| low | `#334155` |

---

## 9. State-specific design

| State | Visible | Headings | Status | Actions | Responsive |
| --- | --- | --- | --- | --- | --- |
| **Loading** | Brand, pending nav slot (§10), Log out, Today, frozen subtitle, `Loading today’s brief…`, four inert skeleton blocks. No org name, no calm, no items, no fake counts | `h1` Today only | `aria-busy` `aria-live="polite"` | none | skeletons stack; width = main |
| **Populated** | kicker, Today, subtitle, four/three sections, rows | Today + section `h2`s | no calm | view-all + row links per visibility | 2-col ≥960px |
| **Empty (calm)** | kicker, Today, subtitle, calm card with frozen copy, 0–3 actions, local empty sections | Today + section `h2`s | `role="status"` on calm | TRUTH set or omit container | actions wrap |
| **Partial** | warning Alert, successful sections, failed sections as alert text | Today + `h2`s | `role="status"` + section `role="alert"` | no calm; view-all only if module visible | banner full width |
| **Error (page)** | AppShell (likely FAIL_CLOSED), `h1` Unable to load today’s brief, `Alert` error | that `h1` | `role="alert"` | no brief actions | `statePanel` max-width `40rem` |
| **No org selection** | existing list of org names | Organization selection required | none | existing org links via `buildDailyOperatingHomePath` | stack |
| **Unresolved** | Home-only **resolved** nav, kicker, Today, brief without module links | Today + `h2`s | calm if both queries succeed and empty | **no** Open/view-all | same grid |
| **Owner/admin** | org attention + personal queues | four `h2`s | as data | TRUTH | 2×2 grid |
| **Staff/viewer** | no org-attention section | three `h2`s | as data | TRUTH | 2-col with 3 cards |

Focus order (success): skip-link → brand/nav → org selector if present → Log out
→ main (kicker, Today, status, actions, sections, rows).

Unknown data is never shown as zero: failed sections keep `Unable to load …`.
Empty sections keep local empty copy only when that query succeeded.

---

## 10. Accessibility freeze

Required:

- Skip-link as the first focusable node in `AppShell`, `href="#main-content"`,
  visually hidden until focus, label **Skip to main content**.
- One visible `h1` per Home state (existing titles).
- Section `h2` order: Organization attention (if shown) → Assigned to me —
  Attention → Overdue work → Due today.
- Existing 2px `--focus-color` focus-visible. Do not invent a third ring.
- Full keyboard reachability; no hover-only activation.
- Calm/partial: `role="status"`. Errors: `role="alert"`. Do not assert
  `getByRole('alert')` count 0 (H1 contract / B1-C1-R1).
- Severity always includes the word (Critical/High/Medium/Low).
- Contrast: keep `--text-color` on white; muted `#475569` on white; do not
  lighten further.
- Accessible names: `Open Attention` etc.; view-all labels unchanged.
- No empty `<nav>` or empty action container.
- Skeleton motion already respects `prefers-reduced-motion`. No new required
  animation.

### Skip-link impact (AppShell)

| Item | Freeze |
| --- | --- |
| Change | One visually-hidden-until-focus link before `.header` |
| Other authenticated pages | All `AppShell` pages gain the same skip-link |
| Tests | AppShell render test: link present, `href="#main-content"`; Home UI: first heading still Today |
| Rollback | Revert AppShell skip-link CSS/markup; Home layout can remain |

Do not move `id="main-content"`.

---

## 11. Loading honesty

**Problem:** `home/loading.tsx` renders `<AppShell activeNav="home">` without
`moduleNavVisibility`. AppShell defaults to FAIL_CLOSED, so the user sees a
completed **Home-only** primary nav, then a resolved Course Seller (or other)
nav after load.

**Forbidden solutions:** predict full Course Seller nav; client-side
visibility; passing fake org into `loading.tsx`.

**Frozen SHELL solution (Home-scoped, explicit prop):**

Add `navigationPresentation?: "resolved" | "pending"` to `AppShell`.

- Default **`resolved`** — current pages, including unresolved Home success and
  auth/org-required Home, unchanged.
- `home/loading.tsx` passes **`pending`**.
- Pending chrome: brand + Log out remain. **Do not render**
  `nav aria-label="Primary"`. In that slot, a non-interactive
  `role="status"` text: `Loading workspace…`. No links, no `aria-current`.
- Main column: Today + **frozen** subtitle + `Loading today’s brief…` +
  skeletons. No org kicker.
- Skeleton count stays four (one per possible section). Blocks are
  `aria-hidden`. Width matches success main.

This does **not** rewrite every other route `loading.tsx`. Those files still
default FAIL_CLOSED. That remaining product-wide loading flash is **outside
H1-SHELL** unless a later authority expands it. It is an explicit residual
gate for **full-product** loading honesty, not a reason to invent Home nav.

If SHELL cannot add the pending prop without breaking existing AppShell tests,
stop and do not ship Home with the current misleading Home-only loading nav.

---

## 12. Component reuse matrix

| Visual part | Existing | Reuse | Adapt | Reason |
| --- | --- | --- | --- | --- |
| Product chrome | `AppShell` | yes | skip-link; optional `navigationPresentation` | Required by H1 §10; default resolved preserves other pages |
| Page/section error | `Alert` | yes | none for page error; partial uses `warning` | Already authoritative; replaces one-off amber box |
| Section/calm cards | Home `.section` / `.calmState` | yes | grid + tokenized radius | Matches `Surface` tokens already; swapping to `Surface` is optional and not required |
| `Surface` | unused on Home | optional | no | Same border/radius as sections; wrapping would add DOM without behavior |
| `Badge` | unused on Home | **no** | — | Color-only risk; current chip already has text + `sr-only` |
| `Button` | unused on Home | **no** as `<button>` | copy secondary **visual** onto `<a>` | Actions are navigations, not extra POSTs |
| `EmptyState` | unused on Home | **no** | — | Injects `h2#empty-state-title`; collides with section `h2` |
| Home loading blocks | `loading.module.css` | yes | width + frozen subtitle; pending nav | B1-C5 skeleton retained |
| Severity chip | `.severity` | yes | none | Text + color already |
| Org-aware nav | `OrgAwareLink` | AppShell only | none | Brief stays server `Link` + TRUTH href helper |
| Org required list | existing panel | yes | none | Existing selection UI |

---

## 13. Implementation allowlist proposal

Proposal only. This document must not be used as a license to start SHELL
in the same change set.

| Path | Change | Risk | Tests | Rollback |
| --- | --- | --- | --- | --- |
| `src/app/(authenticated)/home/page.tsx` | Kicker above `h1`; keep frozen subtitle; pass visibility as today | Low | Home UI source-lock | Revert page |
| `src/app/(authenticated)/home/page.module.css` | Kicker type, wrap, header rhythm | Low | visual/source assertions | Revert CSS |
| `src/features/daily-operating/ui/daily-operating-brief.tsx` | Optional `Alert` for partial; action class names | Medium if Alert copy changes | existing UI tests + one new | Revert panel |
| `src/features/daily-operating/ui/daily-operating-brief.module.css` | 2-col grid ≥960px; control heights 2.75rem; secondary action style | Overflow if `minmax(0,1fr)` omitted | UI + CSS source-lock | Revert CSS |
| `src/app/(authenticated)/home/loading.tsx` | Frozen subtitle; `navigationPresentation="pending"` | Medium (AppShell API) | loading source-lock | Revert loading |
| `src/app/(authenticated)/home/loading.module.css` | Drop `56rem`; match main width | Low | layout source-lock | Revert |
| `src/components/app-shell.tsx` | Skip-link; pending nav slot | **Cross-page** | AppShell tests must stay green for default resolved | Revert AppShell |
| `src/components/app-shell.module.css` | Skip-link visually hidden until focus | Cross-page | skip-link visible on focus | Revert CSS |
| Tests (max three) | (1) Home UI: copy, grid class presence, action min-height, no empty action box, kicker; (2) AppShell: skip-link + pending hides Primary nav; (3) loading source-lock frozen subtitle / no stale copy | — | do not skip existing tests | revert tests |
| Evidence (later SHELL) | `docs/phases/B1-C1-H1-SHELL-…-evidence.md` | — | after PASS | additive |

Not in SHELL: ADMISSION resolver, TRUTH mapping code except presentation,
migrations, `globals.css` token rewrite, other routes’ `loading.tsx`,
onboarding, Production fixtures.

---

## 14. Visual acceptance checklist

### 1440px and 390px (both required)

- [ ] No document horizontal overflow (`scrollWidth <= clientWidth`)
- [ ] Primary nav not clipped; items wrap rather than vanish
- [ ] No overlapping text
- [ ] Long organization name wraps
- [ ] Populated / calm empty / partial / page error / loading
- [ ] `course_seller`, `service`, `field_operations`, `product_operations`
- [ ] Unresolved: Home-only **resolved** nav, no module actions
- [ ] Owner/admin shows org attention; staff/viewer does not
- [ ] Keyboard reaches skip-link, nav, selector, logout, rows, view-all, calm actions
- [ ] Focus-visible 2px `--focus-color`
- [ ] Contrast: body text on white; severity not color-only
- [ ] Touch / click targets ≥ 2.75rem on 390px
- [ ] Loading → success: no 56rem→72rem jump; no Home-only nav claimed as final
- [ ] Partial warning visible; successful section still usable; no calm
- [ ] Real data or truthful empty; **no mock KPI**
- [ ] No console errors in R1 browser pass

### R1 screenshot set (required later, not this phase)

Capture 1440 and 390 for:

1. Loading (pending nav + Today + skeletons)
2. Calm empty with course_seller actions
3. Populated owner (org + assigned + overdue + due)
4. Partial (Attention failed, Tasks present or empty-success)
5. Unresolved Home-only
6. Staff (no org attention)
7. Product operations (no Open Leads)
8. Organization selection required
9. Skip-link focused

Redact org UUIDs and personal names in evidence if needed. No Production IDs
in git.

---

## 15. Explicitly out of scope

- Sidebar, command palette, notification center, global search
- Activity feed, charts, new KPIs, AI summary, agenda
- New data modules or routes
- Separate target-group dashboards
- Database, RLS, RPC, migrations
- Onboarding, Production fixtures, public marketing site
- Full AppShell visual rebuild
- H1-COMPOSITION fetch-window work
- Showing a calendar date that cannot be proven to be the organization zone
- Rewriting every non-Home `loading.tsx` (residual, not Home SHELL)

---

## 16. Rollback, stop conditions, design gates

**Rollback:** revert only SHELL allowlisted files. Do not restore
`You are clear for now.` Do not restore universal Open Leads. Skip-link
revert is independent of Home CSS.

**Stop / do not implement if:**

- a sidebar or new nav IA is required to pass 390px;
- loading honesty needs client-side module visibility;
- skip-link requires moving `main-content` or a layout rewrite;
- two-column grid cannot be done without overflowing 390px;
- design demands new tokens outside the existing palette;
- TRUTH copy or mapping would change.

**Design gates (this document):**

| Gate | Frozen decision |
| --- | --- |
| G1 | One shared Today shell; no four dashboards |
| G2 | TRUTH copy and action mapping unchanged |
| G3 | Shell width 72rem; no Home hero; no card shadow |
| G4 | 2-column brief from 960px; 1-column below |
| G5 | Skip-link in AppShell, default nav resolved |
| G6 | Home loading `pending`: no Primary nav, no invented org |
| G7 | Control min-height 2.75rem on Home actions |
| G8 | Calendar date omitted |
| G9 | Other routes’ loading FAIL_CLOSED flash is residual, documented |
| G10 | Implementation not started by this document |

---

## 17. Claims

Allowed:

```text
PASS — B1-C1-H1-SHELL-DESIGN FROZEN, IMPLEMENTATION NOT STARTED
```

Not claimed: SHELL implemented; B1-C1-H1 CLOSED; Production verified;
website live; onboarding completed.
