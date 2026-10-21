# SMM-B1.11-B — Calendar + Scheduling UX — Evidence

## 1. Executive verdict

```text
SMM-B1.11-B CLOSED WITH EVIDENCE — CALENDAR + SCHEDULING UX READY
```

Canonical `/social` now includes a Calendar section driven by `social_publications.intended_execute_at`. Owner/Admin can schedule, reschedule, and cancel through the existing B1.11-A actions. Staff/Viewer remain denied at the server action. No worker, cron, provider write, or Production scheduled row was created. Publishing remains fail-closed OFF.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Start HEAD | `fb36d422005549dc1a8fd54b73ffb2462c3e86df` |
| Branch | `core/platform-readiness-20260707` |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Implementation commit | `8f01120aaae47c4e17a32c65aa257801817c3bfb` |
| Prior milestone | `SMM-B1.11-A CLOSED WITH EVIDENCE — SCHEDULING DOMAIN READY` |

Production safety at phase start (read-only):

| Item | Value |
| --- | --- |
| Instagram connection | `connected` / `healthy` |
| Credential version | 2 |
| Active Instagram connections | 1 |
| Active controlled windows | 0 |
| `private.social_publishing_execution_enabled()` | false |
| Scheduled publications | 0 |
| Attempts after R2 `2026-08-21T11:05:55.829837+00` | 0 |

---

## B. B1.11-A dependency

Reused without a second scheduling aggregate:

- Source of truth: `social_publications.execution_mode` / `intended_execute_at` / `next_attempt_at`
- Actions: `scheduleSocialPublicationAction` / `rescheduleSocialPublicationAction` / `cancelScheduledSocialPublicationAction`
- RPCs: `schedule_social_publication` / `reschedule_social_publication` / `cancel_scheduled_social_publication`
- Eligibility: pending / queued / failed_retryable; claimed / processing / succeeded / cancelled / UEO blocked
- Permissions: `canScheduleSocialPublication` = Owner/Admin only

No new migration. Slot `planned_at` is not queried and is not treated as execution time.

---

## C. Calendar architecture

Canonical surface: `/social?section=calendar`

Existing `SOCIAL_SECTIONS` + `buildSocialWorkspaceHref` gained `calendar`, plus view-only query params `week`, `day`, and `tz`. Those parameters never authorize organization access. `resolveSelectedOrganization` + `resolveOrganizationContext` remain authoritative. Page load remains Owner/Admin (`canManageSocialConnections`), matching the locked Social workspace gate. Staff/Viewer mutation denial is enforced on the server actions.

UI: `SocialCalendarPanel` inside `SocialWorkspacePanel`. Week view (Monday start), selected-day detail, schedule form, reschedule, two-step cancel confirmation. No drag-and-drop. No month-grid planner. No Stories. No Attention. No Analytics.

Copy explicitly states automatic execution is not enabled in this rollout.

---

## D. View model / data loading

`loadSocialCalendar` range-loads `execution_mode = 'scheduled'` rows with `intended_execute_at` in `[visibleStart, visibleEnd)` scoped by `organization_id`. Eligible immediate rows (`pending` / `queued` / `failed_retryable`) are loaded separately for the schedule picker (capped). Variant versions supply title/caption/format; `media_snapshot` is reduced to `hasMedia` and is not sent to the client. Credentials and storage keys are not returned.

Typed view models: `SocialCalendarItemView`, `SocialCalendarEligiblePublication`.

Existing claim index was not duplicated. No new index.

---

## E. Timezone contract

Execution remains UTC. Display and form entry use an explicit IANA zone.

1. Valid organization `organizations.timezone` → used.
2. Otherwise the Calendar requires a selected IANA zone before scheduling (`tz` is view state only).
3. Never uses the Vercel/server local timezone.
4. Display always names the zone (for example `Europe/Amsterdam`).

Production organization timezone is unset, so Production Calendar shows the timezone-required notice and UTC as the labeled display fallback until the user selects a zone. Conversion of local wall time:

- unique match → ISO-8601 with offset
- DST gap → `invalid_local_time`
- DST overlap → `ambiguous_local_time`
- missing/invalid zone → `missing_timezone` / `invalid_timezone`

The browser conversion is not authorization. The server action still requires an unambiguous future instant.

---

## F. Schedule UX

Owner/Admin (and only those roles on this page) can pick an eligible publication, date, time, and timezone. Local wall time is converted to UTC and submitted to `scheduleSocialPublicationAction`. Past/now maps to “Schedule must be in the future.” DST-invalid and ambiguous times fail clearly. Success keeps the same publication UUID.

---

## G. Reschedule UX

Scheduled items show **Reschedule**. Same publication UUID, version, account, provider, and media; only the execution clock changes. UI refreshes; the loader returns one row per publication id, so the old timestamp cannot remain as a duplicate calendar item.

---

## H. Cancel UX

**Cancel schedule** then **Confirm cancel** / **Keep scheduled** (keyboard-accessible buttons, no pointer-only dialog). Uses `cancelScheduledSocialPublicationAction`. Status becomes `cancelled`; the row is not deleted. Second cancel maps to a safe conflict message.

---

## I. Role matrix

| Actor | Page Calendar | Schedule / reschedule / cancel |
| --- | --- | --- |
| Owner | YES | YES (UI + action + RPC) |
| Admin | YES | YES (UI + action + RPC) |
| Staff | Social workspace still forbidden at page load | Action `forbidden` before RPC |
| Viewer | Social workspace still forbidden at page load | Action `forbidden` before RPC |

UI hiding is not authorization. Direct server-action tests cover Staff/Viewer deny.

---

## J. Tenant safety

- Calendar loader `.eq("organization_id", input.organizationId)` plus a second row-level org check.
- Foreign org query parameter cannot override `resolveOrganizationContext`.
- Unauthenticated Production `GET /social?section=calendar&org=<foreign>` → 307 login; no tenant payload.
- Schedule actions already reject foreign org via org context.

---

## K. Accessibility

Labeled date, time, timezone, and publication controls. Week navigation is links (`Previous week`, `Next week`, `Today`). Focus outlines on controls. Status is text, not color alone. Cancel confirmation is two buttons. Error messages associate to date/time/timezone via `aria-invalid` / `aria-describedby`.

---

## L. Responsive behavior

Desktop: seven-column week grid. `max-width: 48rem`: week grid hides; stacked day links + selected-day detail remain. Form fields collapse to one column. No forced seven-column cards on narrow screens.

---

## M. Tests

Targeted Calendar + scheduling + Social regression:

```text
npx vitest run tests/features/social-media tests/domain/social-calendar-timezone.test.ts tests/domain/social-calendar-view-model.test.ts tests/domain/social-scheduling-b111a.test.ts tests/security/social-scheduling-b111a-migration-security.test.ts
Test Files  40 passed (40)
Tests       234 passed (234)
```

Full Vitest:

```text
npx vitest run
Test Files  2 failed | 365 passed (367)
Tests       2 failed | 2540 passed (2542)
```

Pre-existing non-Social failures (unchanged identity, not fixed in B1.11-B):

1. `tests/features/invitations/load-member-administration-page.test.ts` — `does not trust a foreign org id outside active memberships`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — `Progress no longer claims deferred tracking; Progress workspace language is present`

Prior full-suite baseline was `2512 passed / 2 failed / 2514 total`. This phase added 28 passing tests.

Coverage includes: week bounds, in/out of range, local day projection, UTC conversion, cancelled status, foreign org exclusion, Owner/Admin/Staff/Viewer flags and actions, past time, invalid timezone, DST gap, DST ambiguous hour, reschedule/cancel conflicts, publishing regression (gate unused; adapter not called).

---

## N. Static / build

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (0 warnings/errors) |
| `npx next build` | PASS (`/social` 13.9 kB) |

No migration. No `/api/cron`. No `vercel.json` cron. No scheduler worker.

---

## O. Production deployment

| Item | Value |
| --- | --- |
| Candidate | `npx vercel deploy --prod --yes --skip-domain --project zyntixai --scope guus-projects-ai` |
| Deployment id | `dpl_GWfGmjE76cgG1h1UA6oNwhkHAaqi` |
| URL | `https://zyntixai-f3o7902wu-guus-projects-ai.vercel.app` |
| Target | production |
| Ready | YES |
| Promote | `npx vercel promote dpl_GWfGmjE76cgG1h1UA6oNwhkHAaqi --scope guus-projects-ai --yes` |
| Canonical alias | `https://www.zyntixai.com` inspects to `dpl_GWfGmjE76cgG1h1UA6oNwhkHAaqi` |
| Also | `https://zyntixai.vercel.app` |

Production gate remained OFF during deploy.

---

## P. Production UX verification

Read-only. No login session was available in the verification browser.

| Check | Result |
| --- | --- |
| `GET https://www.zyntixai.com/social?section=calendar` | 307 → `/login?next=%2Fsocial%3Fsection%3Dcalendar` |
| Known-org Calendar URL | login; `next` preserves `section=calendar` and org |
| Foreign-org Calendar URL | login only; no Social payload |
| Scheduled Production rows | 0 (empty Calendar is the expected Production data) |
| Authenticated Owner Calendar screenshot | not available without a live session; mutation UX covered by automated tests |

No schedule / reschedule / cancel was performed against Production.

---

## Q. Production mutation statement

| Item | Result |
| --- | --- |
| Calendar UI deployed | **YES** |
| Production scheduling row created | **NO** |
| Production publication rescheduled | **NO** |
| Production publication cancelled | **NO** |
| Automatic worker | **NO** |
| Cron | **NO** |
| Publishing enabled | **NO** |
| Provider write | **NO** |
| Instagram post | **NO** |
| Controlled window | **NO** (active windows 0) |
| Instagram connection changed | **NO** (`connected` / `healthy`) |
| Credential changed | **NO** (version 2) |

---

## R. Remaining next phase

Exactly:

`SMM-B1.11-C — Fail-Closed Scheduler Worker`

Do not implement it in this phase.
