# SMM-B1.11-E — Controlled Scheduled IMAGE Production — Evidence

## PRE-LIVE

Highest permitted verdict for this prompt:

```text
SMM-B1.11-E PRE-LIVE READY — OWNER SCHEDULED PUBLISH APPROVAL REQUIRED
```

This file does **not** record a Production scheduled publish PASS. The LIVE / POST section remains empty until the owner approves the exact publication UUID and one controlled automatic Instagram IMAGE write.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `04af9b589f93641b10a3a522568aca88f8cefc56` |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Prior milestone | `SMM-B1.11-E-PR1 CLOSED WITH EVIDENCE — SUPABASE 5-MINUTE TRIGGER READY` |

---

## B. Infrastructure baseline

Canonical application: `https://www.zyntixai.com`

| Item | Value |
| --- | --- |
| PR1 Production deployment at closure | `dpl_8BYmiQ3RHrby2cgJX8oRXcZopjiY` |
| Timer architecture | Supabase Cron `*/5 * * * *` → Vault-backed `private.invoke_social_publication_scheduler()` → machine-authenticated `POST https://www.zyntixai.com/api/cron/social-publications` |
| Worker | `maxDuration = 300`, execute batch = 1, sequential, existing claim/idempotency, 900-second miss policy |

No timer architecture change in this PRE-LIVE step.

---

## C. Timer state

| Timer | Count | Expression |
| --- | --- | --- |
| Supabase Social | 1 active (`zyntixai_social_publication_scheduler_5m`) | `*/5 * * * *` |
| Vercel native Social | 0 | `vercel.json` crons `[]` |

Latest authenticated automatic ticks observed during PRE-LIVE (gates OFF):

| UTC | mode | claimed | providerWriteAttempted |
| --- | --- | --- | --- |
| 2026-08-21 17:20:00 | dry-run | 0 | false |
| 2026-08-21 17:25:00 | dry-run | 0 | false |

---

## D. Gate state

| Gate | PRE-LIVE |
| --- | --- |
| `SOCIAL_SCHEDULING_ENABLED` | OFF / not exact `"true"` (worker JSON `schedulingEnabled=false`) |
| `SOCIAL_PUBLISHING_ENABLED` | OFF / not exact `"true"` (worker JSON `publishingEnabled=false`) |
| `private.social_publishing_execution_enabled()` | false |
| `private.social_scheduler_requires_controlled_window()` | **true** (fail-closed default; Production worker never sets `zyntix.social_scheduler_unrestricted`) |

Neither execution gate was turned ON during this prompt.

---

## E. Instagram connection

| Field | Value |
| --- | --- |
| Connection UUID | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Provider | Instagram |
| Professional account | Business |
| Status | connected |
| Health | healthy |
| Display label | `zyntixai` |
| Identity fingerprint | `eefce660bad5c0ad` (SHA-256 prefix of external account id) |
| Credential version | 2 |
| Reauthorization required | false |
| Connected Instagram count | 1 |
| Capabilities | includes `publish_image` |

No reconnect. No OAuth. No credential mutation.

---

## F. Controlled-execution architecture

Historical C/R2 window (`social_controlled_publish_windows`) remains the one-shot table. Manual Execute still uses `private.assert_and_consume_controlled_publish_window` (permissive when no window exists).

B1.11-C scheduler previously **did not** consume that window. This PRE-LIVE step adds a scheduler-specific fail-closed helper:

`private.assert_and_consume_scheduled_controlled_publish_window(org, publication, workspace, connection)`

Wired into `public.scheduler_start_scheduled_publication_attempt` **before** `FOR UPDATE SKIP LOCKED` claim, matching b18 lock order (window then publication).

| Condition | Scheduler result |
| --- | --- |
| No active window | `controlled_scheduled_rollout_required` — **no claim, no provider write** |
| Wrong publication / workspace / connection | `publication_not_authorized_for_window` |
| Expired (`expires_at <= now()`) | status → `expired`, `controlled_window_expired` |
| Consumed / quota exhausted | `controlled_window_exhausted` |
| Exact match + remaining budget | consume one slot, then claim |

Future unrestricted scheduler mode is **not** Production default. It requires GUC `zyntix.social_scheduler_unrestricted = 'true'`. The worker never sets that GUC. Normal fully-enabled scheduling after E verification is a later explicit phase.

No publication UUID is hardcoded. No second queue table.

Local migrations:

- `supabase/migrations/20260821193000_add_scheduler_controlled_scheduled_rollout.sql`
- `supabase/migrations/20260821193100_add_scheduler_controlled_scheduled_rollout_bind.sql`
- `supabase/migrations/20260821193200_add_scheduler_controlled_window_operator_expiry.sql`
- `supabase/migrations/20260821193300_add_scheduler_start_controlled_window_consume.sql`

---

## G. Security analysis

Provider write for the controlled scheduled rollout requires all of:

1. Machine-authenticated worker
2. `execution_mode = scheduled`
3. Due clock
4. `seconds_late <= 900`
5. Eligible lifecycle
6. Exact organization / workspace / connection (publication row + window stamps)
7. Workflow-ready approved version
8. Media ready
9. Connection connected / healthy
10. No reauthorization requirement
11. `publish_image`
12. Closed-beta `publishing_allowed`
13. `SOCIAL_SCHEDULING_ENABLED === "true"`
14. `SOCIAL_PUBLISHING_ENABLED === "true"`
15. Matching active controlled window
16. Remaining one-shot budget
17. Successful concurrency-safe claim

Any failure: no Instagram adapter call.

Dry-run ticks do not call `scheduler_start`, so they cannot consume the window.

---

## H. Concurrency analysis

**Ordering:** consume window (one-shot) **then** claim publication. Duplicate-write protection is the consumed budget, not a delayed consume-after-success.

| Scenario | Expected |
| --- | --- |
| Cron A + Cron B | Window `FOR UPDATE` serializes. One consume. Second `controlled_window_exhausted`. One execution owner. |
| Manual Execute + scheduler | Same window lock order as b18. One consume. Loser mismatch/exhausted/`skipped_locked`. One execution owner. |
| Worker crash after consume, before provider write | Window spent. Reclaim cannot consume again. No second provider write. Test must be re-prepared. |
| Worker crash around `media_publish` | Existing UEO / `unknown_external_outcome` remains terminal for automatic retry. Window already consumed. No second `media_publish`. |

If `seconds_late > 900` before claim: missed handling. Do **not** manually Execute to save the test.

---

## I. Target selection / preparation

No suitable unused **scheduled** publication existed (`scheduled_count = 0`).

Five unused B1.8 IMAGE queued immediates exist for the same verified test Instagram Business account, attempt_count = 0, no provider content id, workflow-ready JPEG, caption `ZYNTIXAI B1.8 controlled publish verification — safe to delete`.

Selected the newest unused artifact rather than creating another asset:

`ae6caf94-2fc7-4653-a085-0228d32e0c53`

Not reused: succeeded R2 rows, `manual_intervention` rows, or customer content.

No fresh Prepare was required. Publication was **not** scheduled. Controlled window was **not** opened during PRE-LIVE (opening it while `intended_execute_at` is already in the past would make the target immediately manually executable if publishing were flipped).

---

## J. Target PRE snapshot

| Field | Value |
| --- | --- |
| Publication UUID | `ae6caf94-2fc7-4653-a085-0228d32e0c53` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Workspace | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` |
| Connection | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Provider | instagram |
| Content format | image |
| Version | `7a114018-50ab-4a4b-b53e-6b702079c4d5` |
| Caption | `ZYNTIXAI B1.8 controlled publish verification — safe to delete` |
| Media | JPEG 1254×1254, 460410 bytes, `processing_state=ready`, asset `679c7c07-15ac-4cf1-b81d-1750353f8c64` |
| Status | `queued` |
| Execution mode | `immediate` (pre-schedule) |
| Intended execute at | historical prepare clock `2026-08-19 09:33:21+00` — **not a live schedule** |
| Attempt count | 0 |
| Attempt rows | 0 |
| Provider content ID | none |
| Publication events | 2 (`created` + `queued`) |

---

## K. Other-publication isolation

**If both execution gates were turned ON at this PRE-LIVE snapshot:**

### Automatic scheduler

**Zero publications** can reach provider execution.

- No row has `execution_mode = 'scheduled'`.
- Even if a row were due, `scheduler_start` now fail-closes with `controlled_scheduled_rollout_required` unless an exact matching active window exists.

### Manual Execute residual

Five unused B1.8 queued **immediate** test publications remain theoretically clickable if an Owner uses the manual Execute path, because b18 is still permissive when no window exists. They are the same safe test copy, not customer content. The scheduler will not pick them.

**Live choreography required before enabling gates:**

1. Keep both gates OFF.
2. Open one-shot window bound to `ae6caf94-2fc7-4653-a085-0228d32e0c53`, `max_execute_count = 1`, finite `expires_at`.
3. `schedule_social_publication` to a **fresh** future UTC instant ~10–15 minutes out (so due clock is not already in the past).
4. Confirm Calendar.
5. Then enable both gates.
6. After success, restore both gates OFF.

Until steps 2–3 happen, do **not** enable publishing. Enabling publishing while the target remains immediate-with-past-due would allow manual Execute of that UUID immediately.

After steps 2–3: only that UUID can become provider-executable, and only after its new due time, inside the 900-second grace.

---

## L. Mocked scheduled success

Covered in `tests/features/social-media/social-scheduler-controlled-rollout.test.ts` with the Instagram adapter mocked (no Meta HTTP):

- Correct publication eligible when gates hypothetically ON
- Wrong publication / workspace / connection denied
- Expired / consumed / missing window denied in rollout mode
- Not due → no adapter
- Due + claim + mocked publish → exactly one `publish` → succeeded with provider id
- Second start → `controlled_window_exhausted` → no second provider write
- Adapter exception → `unknown_external_outcome` → complete UEO → no retry publish

---

## M. Mocked failure / UEO paths

| Path | Coverage |
| --- | --- |
| Container failure / poll timeout / no `media_publish` | existing `instagram-publishing-adapter.test.ts` |
| Ambiguous `media_publish` timeout → UEO | existing adapter test |
| Missing capability / reauth | scheduler start classification + domain matrix |
| Missed >900 | existing B1.11-D tests; start returns `missed_window` **after** window consume only if a window matched — live test must remain inside grace |
| Second invocation after UEO | window already consumed; start exhausted; no second write |
| Worker timeout classification | existing C/D worker tests |

900-second miss policy is unchanged.

---

## N. Tests

Full Vitest:

`2626 passed / 2 failed / 2628 total`

Known unrelated failures (unchanged identity):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

New PRE-LIVE coverage:

- `tests/features/social-media/social-scheduler-controlled-rollout.test.ts`
- `tests/security/social-scheduler-b111e-controlled-rollout-migration-security.test.ts`

Baseline at PR1 close was `2598 passed / 2 failed / 2600 total`.

---

## O. Static / build

| Check | Result |
| --- | --- |
| `tsc --noEmit` | pass |
| `next lint` (social + related tests) | no warnings or errors |
| `next build` | pass (Next.js 15.5.20; existing autoprefixer warning on operator CSS unchanged) |

---

## P. Production deployment

| Item | Value |
| --- | --- |
| Implementation commit | `0ea9133f36f74f43b481a5486d855bca2aa1816d` |
| Production deployment | `dpl_3djunk5tZzP476JjiA7f8wvsuoyJ` |
| Ready | yes |
| Canonical alias | `https://www.zyntixai.com` |
| Vercel native Social Cron | 0 (`vercel crons list`: none) |
| Supabase Cron | still 1 × `*/5 * * * *` → canonical worker |

Gates remain OFF. Fail-closed window consume is live in Postgres. The app deploy classifies the new start codes.

---

## Q. Production dry-run

Observed automatic ticks, including around app deploy:

| UTC | mode | schedulingEnabled | publishingEnabled | claimed | providerWriteAttempted |
| --- | --- | --- | --- | --- | --- |
| 2026-08-21 17:20:00 | dry-run | false | false | 0 | false |
| 2026-08-21 17:25:00 | dry-run | false | false | 0 | false |
| 2026-08-21 17:30:00 | dry-run | false | false | 0 | false |
| 2026-08-21 17:35:00 | dry-run | false | false | 0 | false |

Post-alias tick `17:35:00` is after `dpl_3djunk5tZzP476JjiA7f8wvsuoyJ` Ready + `www.zyntixai.com` alias. No controlled execution budget consumed (`active_windows = 0`).

---

## R. Exact owner-approval target

See the compact approval package in the assistant PRE-LIVE report. Exact publication UUID:

`ae6caf94-2fc7-4653-a085-0228d32e0c53`

---

## LIVE / POST

_Reserved. Do not fill until the owner-approved controlled automatic Production write has completed._
