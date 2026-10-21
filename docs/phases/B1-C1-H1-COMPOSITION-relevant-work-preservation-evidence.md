# B1-C1-H1-COMPOSITION — Relevant Daily-Brief Work Preservation Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1-H1-COMPOSITION** |
| Date | 2026-09-13 |
| Parent authority | B1-C1 Daily Operating Composition — CLOSED WITH EVIDENCE |
| Hardening contract | `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md` |
| Completed prerequisites | B1-C1-H1-ADMISSION, B1-C1-H1-TRUTH, B1-C1-H1-SHELL |
| Start SHA | `44e25f634417219762f1aabbb83629dad4be1a1b` |
| Branch | `core/platform-readiness-20260707` |
| Migrations | **NONE** |
| Production / browser QA | **NOT DONE** |
| Next phase | **B1-C1-H1-R1 — NOT STARTED** |

```text
PASS — B1-C1-H1-COMPOSITION RELEVANT WORK PRESERVATION ESTABLISHED
```

This evidence closes **only** `B1-C1-H1-COMPOSITION`. It does not close
B1-C1-H1 as a whole. SHELL was not reopened. R1, PROD and FV have not started.
No browser or Production verification occurred. No Production mutation
occurred. No migration or schema change occurred. No onboarding change
occurred. No UI redesign occurred.

---

## 1. Phase authority

Governing contract: `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md`
§11 and §12.4.

Frozen sequence:

`ADMISSION → TRUTH → SHELL → COMPOSITION → R1 → PROD → FV`

Only COMPOSITION was implemented. Required principle:

`database eligibility → section relevance → deterministic order → bounded section result → brief composition`

Forbidden pattern (removed):

`broad mixed result → arbitrary/general cap 25 → section filtering`

Contract PASS line in §12.4 is
`PASS — B1-C1-H1-COMPOSITION RELEVANT HOME ITEMS ARE NOT LOST BEFORE COMPOSE`.
This assignment’s allowed evidence status is the line in the title block
above.

---

## 2. Start SHA

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD | `44e25f634417219762f1aabbb83629dad4be1a1b` |
| Upstream | `origin/core/platform-readiness-20260707` @ same SHA |
| Ahead / behind | `0 0` |
| Worktree at start | clean |
| Staging at start | empty |

`git fetch origin` was run at assignment preflight. Fetch updated remote
metadata only. No pull, merge, rebase, reset, restore, checkout or stash.

---

## 3. Preflight

Commands run at assignment start and re-checked before evidence:

| Command | Result |
| --- | --- |
| `git status --short` | empty at start; COMPOSITION files unstaged at evidence time |
| `git status -sb` | `## core/platform-readiness-20260707...origin/core/platform-readiness-20260707` |
| `git rev-list --left-right --count HEAD...@{upstream}` | `0 0` |
| `git rev-parse HEAD` | `44e25f634417219762f1aabbb83629dad4be1a1b` |
| `git rev-parse @{upstream}` | `44e25f634417219762f1aabbb83629dad4be1a1b` |
| `git diff --check` | clean |
| `git diff --cached --check` | clean |

Expected branch, SHA relationship, clean start worktree and empty staging
matched. This run did not stage, commit or push.

---

## 4. Root-cause matrix

Proven from current code before the edit. The unsafe cap was the Home
Attention read in `loadDailyOperatingPage`, not the Task reads.

| Source | Current database filter (before) | Current order | Current cap | Post-fetch filter | Section affected | Loss scenario |
| --- | --- | --- | ---: | --- | --- | --- |
| Attention | org + open/acknowledged + not archived; **no assignee; no severity** | `severity` **text** desc, then `id` | **25 mixed** | org / role / assignee / severity in compose | Organization attention + Assigned to me | **Yes** |
| Tasks overdue | org + open + not archived + assignee + `due_at < now` | `due_at` asc, `created_at`, `id` | 5 after eligibility | compose re-checks overdue | Overdue work | **No** |
| Tasks due today | org + open + not archived + assignee + org-TZ day bounds | same | 5 | compose re-checks dueToday | Due today | **No** |

Explicit answers:

1. The broad query capped at 25 was the single Home `listAttentionItems` call (`pageSize: DAILY_OPERATING_ATTENTION_FETCH_LIMIT`).
2. Organization critical/high and assigned-to-me (all severities) shared that mixed result.
3. Irrelevant or lower-relevance rows could consume the cap. DB sort was lexical `severity` desc (`medium`/`low` can precede `high`/`critical`). Even with rank sort, 25 newer unassigned rows could drop an older assigned item.
4. A qualifying database row could disappear before composition because it was never returned in the 25.
5. That could cause an incorrect calm state: both source flags ok, brief empty, qualifying row never fetched.
6. That could cause an incomplete populated state without error: `hasAnyActionable` from the truncated set, no `query_error`.
7. Intentional UI / presentation limits: `DAILY_OPERATING_SECTION_LIMIT = 5` after the correct candidate set.
8. Unsafe pre-composition limit: Attention `pageSize: 25` on a mixed pool.

---

## 5. Exact changed-file register

| Path | Role | Justification |
| --- | --- | --- |
| `src/features/daily-operating/server/load-daily-operating-page.ts` | Product | Replace the mixed Attention `pageSize` 25 with targeted bounded `listAttentionItems` calls per governed section. |
| `src/features/daily-operating/domain/compose-daily-operating-brief.ts` | Product | Compose re-sorts Attention. Assignment requires a stable id tie-breaker. Retired unused `DAILY_OPERATING_ATTENTION_FETCH_LIMIT = 25`. |
| `tests/features/daily-operating/load-daily-operating-page.test.ts` | Tests | Adversarial `>25` runtime proof, failure aggregation, role/org isolation. |
| `tests/features/daily-operating/compose-daily-operating-brief.test.ts` | Tests | Direct proof of id tie-break, section cap 5, overdue/due-today mutual exclusion. |
| `docs/phases/B1-C1-H1-COMPOSITION-relevant-work-preservation-evidence.md` | Evidence | This file. |

The second product file is required: compose already re-sorted Attention by
severity rank and `lastDetectedAt` with no id tie-break. Targeted fetches
still merge into that sort. Equal timestamps would be non-deterministic
without `id`.

No UI/CSS, no shared `listAttentionItems` / `listTasks` helper edits, no
schema, no RLS, no auth/onboarding, no dependencies.

---

## 6. Query-before / query-after mapping

### Attention — before

| Field | Value |
| --- | --- |
| Table | `attention_items` via existing `listAttentionItems` |
| Organization predicate | `organization_id = resolved org` |
| User predicate | none |
| Status predicate | `open`, `acknowledged`; `archived_at is null` |
| Date/time predicate | none |
| Order | `severity` text desc, `id` asc |
| Limit | **25 mixed** |
| Failure | one `ok: false` → `attentionQueryFailed`; items `[]` |

### Attention — after

Owner/Admin (6 bounded queries):

- org critical, no assignee filter, `pageSize` 5
- org high, no assignee filter, `pageSize` 5
- assigned × critical/high/medium/low, `assigneeMemberId = membershipId`, `pageSize` 5 each

Staff/Viewer: assigned queries only (4). No org-wide critical/high read.

| Field | Value |
| --- | --- |
| Table | `attention_items` via existing `listAttentionItems` |
| Organization predicate | unchanged `organization_id` |
| User predicate | assigned queries: `assignee_member_id = membershipId` |
| Status predicate | unchanged open/acknowledged, not archived |
| Date/time predicate | none |
| Order | `last_detected_at` desc, helper `id` asc |
| Limit | **5 per targeted query** |
| Merge | unique by `id`; any `ok: false` → `attentionQueryFailed` |
| Why the limit cannot hide a displayed item | Compose displays at most 5 per section. Org section is critical then high. Fetching 5 critical and 5 high cannot hide a displayed critical behind highs. Assigned is 5 per severity, then compose ranks and slices 5. A displayed assigned critical cannot be displaced by mediums in the fetch window. The 6th qualifying item of the same bucket is the intentional display cap. |

### Tasks — unchanged (already targeted)

| Query | Filter | Order | Limit |
| --- | --- | --- | --- |
| Overdue | org + open + not archived + assignee + `due_at < now` | `due_at` asc, `created_at`, `id` | 5 |
| Due today | org + open + not archived + assignee + org calendar day via `getUtcBoundsForOrgCalendarDay` | same | 5 |

---

## 7. Per-section eligibility and ordering

| Section | Eligibility | Fetch order | Compose order | Display cap |
| --- | --- | --- | --- | --- |
| Organization attention | Owner/Admin; open/acknowledged; not archived; severity critical or high; same org | `last_detected_at` desc, `id` asc per severity | severity rank desc, `lastDetectedAt` desc, `id` asc | 5 |
| Assigned to me — Attention | assignee = current membership; open/acknowledged; not archived; all severities | same per severity | same, then critical/high before medium/low | 5 |
| Overdue work | assignee = current membership; open; not archived; `derived.overdue` | `due_at` asc, `created_at`, `id` | preserves fetch order after filter | 5 |
| Due today | assignee = current membership; open; not archived; `derived.dueToday` | same | same | 5 |

Staff/Viewer never receive organization Attention. Cross-org rows remain
dropped by compose.

---

## 8. Boundedness and performance reasoning

Home now issues at most six Attention list queries and two Task list queries.
Each uses `pageSize` 5. No unbounded organization dump. The former mixed 25
was not replaced by a larger mixed cap.

Index compatibility from existing migrations (not `EXPLAIN`):

| Table | Existing indexes used as compatible | Gap |
| --- | --- | --- |
| `attention_items` | `organization_id_status_idx`, `organization_id_severity_idx`, `organization_id_assignee_member_id_idx` (assignee not null), `organization_id_last_detected_at_idx` | No dedicated covering `(organization_id, status, severity, last_detected_at, id)` index. Same filters already exist on the Attention list page. Not treated as a COMPOSITION blocker. |
| `tasks` | `organization_id_status_idx`, `organization_id_assignee_member_id_idx`, `tasks_open_due_at_idx` | Unchanged queries. |

No latency was measured. This phase does not claim a production performance
number. No migration was added.

---

## 9. RLS and organization-isolation preservation

Reads still use the caller `supabase` client passed into
`loadDailyOperatingPage`. No service-role path. `listAttentionItems` and
`listTasks` still call `resolveOrganizationContext` / permission gates inside
the existing helpers.

Loader always passes the resolver-bound `organizationId`, not the raw client
`org` string, into list queries. Compose still drops foreign `organizationId`
rows. Tests prove other-org tasks and other-assignee Attention do not enter
personal sections. Staff does not issue org-wide Attention queries.

---

## 10. Timezone behavior

The loader does not compute due-day bounds and does not import
`getUtcBoundsForOrgCalendarDay`. Due-today eligibility remains inside
`listTasks`, which uses `resolveOrganizationTimezone` and
`getUtcBoundsForOrgCalendarDay(timeZone, now)`.

Loader tests assert separate `dueState: "overdue"` and `dueState: "due_today"`
calls with `pageSize` 5. Domain suite `tests/domain/due-state.test.ts`
covers org-TZ day start/end and a DST day. This COMPOSITION run did not
change those helpers.

---

## 11. Failure aggregation

| Event | `attentionQueryFailed` | `tasksQueryFailed` | Result |
| --- | --- | --- | --- |
| All required Attention queries ok; both Task queries ok; empty brief | false | false | success; calm allowed |
| Any required Attention query `ok: false` | true | as observed | success unless Tasks also failed; calm forbidden |
| Overdue or due-today Task query `ok: false` | as observed | true | success unless Attention also failed; calm forbidden |
| Attention family failed **and** Tasks family failed | true | true | `query_error` with the existing safe message |

Successful independent **source families** remain: Attention vs Tasks.
Existing UI uses one fail flag per family, so one failed Attention query
still marks both Attention sections failed in the panel. Successful Task
sections remain visible. Failed queries are not converted to silent `[]`
without the fail flag. Successful Attention rows from other targeted queries
are still merged into the brief. Internal error values (`boom` in tests) are
not copied onto the page result.

Existing copy is unchanged: `Unable to load today’s operating brief. Please try again.`
and the existing partial warning titles.

---

## 12. Calm-state proof

`isDailyOperatingCalmState` is unchanged:

- `hasAnyActionable === false`
- `attentionQueryFailed === false`
- `tasksQueryFailed === false`

A qualifying row beyond the former mixed 25 now reaches compose and sets
`hasAnyActionable`. A true empty success still permits calm. One targeted
query failure prevents calm.

---

## 13. Adversarial `>25` test matrix

Runtime assertions in
`tests/features/daily-operating/load-daily-operating-page.test.ts`
unless noted.

| # | Requirement | Proof |
| --- | ---: | --- |
| 1 | >25 Attention; org item outside former mixed cap | 26 newer unassigned mediums + older unassigned critical; former mixed window omits it; org section contains it |
| 2 | >25 Attention; assigned item outside former mixed cap | 26 newer unassigned lows + older assigned medium; `myAttention` contains it |
| 3 | Other users do not displace/leak assigned | 26 other-assignee criticals + mine low; assigned section is only mine |
| 4 | Org attention remains role-governed | Staff: 4 assigned queries only; unassigned critical not queried; org section empty |
| 5 | Stable Attention order on ties | equal severity + `lastDetectedAt`; `id` asc |
| 6 | Busy org section does not drop assigned | 6 org criticals (display cap 5) + assigned low still present |
| 7 | >25 task rows; overdue preserved | >25 ineligible/other-user/other-org rows + one mine overdue |
| 8 | >25 task rows; due today preserved | 20 overdue + 8 upcoming + one due today |
| 9 | Ineligible tasks do not consume budget | completed, future, other-assignee filtered before the section cap |
| 10 | Other user tasks do not leak | other `assigneeMemberId` excluded |
| 11 | Other org tasks do not leak | foreign `organizationId` excluded; queries use resolver org |
| 12 | Due-today uses org timezone authority | loader delegates `dueState: "due_today"`; no local UTC-day math |
| 13 | Stable task order on equal due | equal `dueAt` + `createdAt`; `id` asc |
| 14 | Overdue vs due today mutually correct | compose test plus loader due-today not listed as overdue |
| 15 | Qualifying beyond cap prevents calm | org critical beyond mixed 25 → `hasAnyActionable` |
| 16 | True empty success permits calm | empty mocks, both flags false |
| 17 | One targeted query failure prevents calm | assigned `low` query fails; flag true; calm false |
| 18 | Independent success during partial | Attention all-fail + overdue item still in brief |
| 19 | No internal error value exposed | `JSON.stringify(result)` does not contain `boom` |
| 20 | Display cap remains 5 | 8 assigned criticals → 5 newest after eligibility |

---

## 14. Full command / test register

`tests/features/attention` **does not exist**. Closest relevant suites run:
`tests/server/attention-read-queries.test.ts`,
`tests/server/task-read-queries.test.ts`,
`tests/domain/due-state.test.ts`.

Skipped counts below are 0 unless stated. Vitest did not report skipped tests.

| Command | Exit | Files | Passed | Failed | Skipped | Duration |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `npx vitest run tests/features/daily-operating/load-daily-operating-page.test.ts --reporter=verbose` | 0 | 1 | 34 | 0 | 0 | 1.06s |
| `npx vitest run tests/features/daily-operating/compose-daily-operating-brief.test.ts --reporter=verbose` | 0 | 1 | 21 | 0 | 0 | 1.07s |
| `npx vitest run tests/features/daily-operating --reporter=verbose` | 0 | 3 | 81 | 0 | 0 | 2.97s |
| `npx vitest run tests/features/tasks --reporter=verbose` | 0 | 2 | 9 | 0 | 0 | 697ms |
| `npx vitest run tests/features/attention --reporter=verbose` | n/a | **directory missing** | — | — | — | — |
| `npx vitest run tests/onboarding/product-admission-app-shell.test.ts --reporter=verbose` | 0 | 1 | 5 | 0 | 0 | 721ms |
| `npx vitest run tests/features/product-access/beta1-4tg-appshell-gating.test.ts --reporter=verbose` | 0 | 1 | 9 | 0 | 0 | 1.52s |
| `npx vitest run tests/server/attention-read-queries.test.ts tests/server/task-read-queries.test.ts tests/domain/due-state.test.ts --reporter=verbose` | 0 | 3 | 29 | 0 | 0 | 1.57s |

After a typecheck fix in the loader test mock, the two focused daily-operating
files were re-run: exit 0, 55 passed, 0 failed, 1.64s.

---

## 15. Typecheck / lint / build results

| Command | Exit | Duration | Notes |
| --- | --- | ---: | --- |
| `npm run typecheck` | 0 | 7.95s | First run failed on an incomplete mock error object; after fix, clean |
| `npx next lint --file` (four changed TS files, quoted paths) | 0 | 4.74s | Final run: `No ESLint warnings or errors` |
| `npm run build` | 0 | 75.6s | Compiled successfully |

Lint deprecation (tool, not a COMPOSITION defect):

```text
`next lint` is deprecated and will be removed in Next.js 16.
```

Build warnings (pre-existing Social CSS / webpack cache; not COMPOSITION files):

```text
./src/features/social-media/ui/platform-closed-beta-operator-list.module.css
Warning
(38:3) autoprefixer: end value has mixed support, consider using flex-end instead
```

```text
[webpack.cache.PackFileCacheStrategy] Skipped not serializable cache item ... platform-closed-beta-operator-list.module.css ... No serializer registered for Warning
```

These warnings were not suppressed or reclassified as COMPOSITION failures.

---

## 16. Diff and security review

Unstaged at evidence time (expected; this run does not commit):

```text
M src/features/daily-operating/domain/compose-daily-operating-brief.ts
M src/features/daily-operating/server/load-daily-operating-page.ts
M tests/features/daily-operating/compose-daily-operating-brief.test.ts
M tests/features/daily-operating/load-daily-operating-page.test.ts
```

plus this evidence file after it is written.

`git diff --stat` before evidence: `4 files changed, 980 insertions(+), 14 deletions(-)`.
`git diff --cached --stat` empty. Staging empty.

Confirmations:

- only justified allowlisted paths
- no unrelated formatting beyond the compose id tie-break / retired 25-cap constant and a test helper unused-binding fix
- no UI/CSS drift
- no migration
- no auth/onboarding modification
- no RLS bypass / no service-role path
- no dependency change
- no generated output
- no temporary file
- no credentials, email addresses, tokens, cookies or passwords
- no Production project reference
- no Production organization UUID
- no absolute personal-machine path in product or test source

Test fixtures use synthetic UUIDs
`11111111-1111-4111-8111-111111111111` and `aaaaaaaa-aaaa-4aaa-8aaa-…`.

Markdown of this evidence: headings, lists and tables are intact; pipe
counts are consistent; backticks and bold markers are balanced; no
unsupported final-closure claim.

---

## 17. Evidence limitations

- Attention and Task reads are mocked at the existing list-query boundary.
  Postgres `EXPLAIN` was not run.
- Index compatibility is from committed migrations, not live catalog
  inspection.
- Timezone day bounds are proven by delegation plus existing domain tests,
  not a live Home query against a clock-controlled database.
- No authenticated browser pass.
- No Production project, fixture or mutation.
- Existing UI still treats Attention as one fail flag and Tasks as one fail
  flag. Intra-family partial rows can be composed but the panel still shows
  the family error when that flag is set. Independent **family** success is
  preserved.

---

## 18. Rollback scope

Revert the five allowlisted files. Do not restore the mixed Attention
`pageSize` 25 as an accepted design. Shared Attention/Task list helpers,
UI, CSS, admissions and schema are unchanged and need no rollback.

---

## 19. Closure boundary

COMPOSITION is complete for this assignment. Explicitly **not** claimed:

- browser or Production verification
- Production mutation
- migration or schema change
- onboarding change
- UI redesign
- SHELL reopened
- R1 started
- PROD started
- FV started
- B1-C1-H1 as a whole CLOSED
- RELEASE READY
- PRODUCTION VERIFIED

---

## 20. Next phase

```text
B1-C1-H1-R1 — NOT STARTED
```
