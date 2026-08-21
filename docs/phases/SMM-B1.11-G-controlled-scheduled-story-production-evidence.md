# SMM-B1.11-G — Controlled Scheduled Instagram Story IMAGE Production — Evidence

Current status:

```text
INSTAGRAM CONTROLLED AUTOMATIC SCHEDULED STORY PUBLISH PASS
SMM-B1.11-G CLOSED WITH EVIDENCE
```

PRE-LIVE chronology is preserved below. LIVE / POST sections follow after section X. Owner visual confirmation is recorded in **FINAL CLOSURE**.

---

## PRE-LIVE

Highest permitted verdict for the PRE-LIVE prompt:

```text
SMM-B1.11-G PRE-LIVE READY — OWNER EXACT STORY PUBLISH APPROVAL REQUIRED
```

At PRE-LIVE close: no Instagram Story container, `media_publish`, or Instagram Story existed. Both global execution gates were OFF.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Start HEAD | `67f9199a34f9c8808fa315577d65652ae3e1e615` |
| Start message | `docs(smm): record B1.11-F Story IMAGE domain and provider evidence` |
| B1.11-F implementation | `b97f1e29a82dd24704e2c773ed3616f95e92b2b4` |
| B1.11-F evidence | `67f9199a34f9c8808fa315577d65652ae3e1e615` |
| Divergence at start | `0 0` |
| Worktree at start | clean |

Precheck matched the expected G start SHA. No unrelated dirty files. No application code was changed in this PRE-LIVE step.

---

## B. Owner phase authorization

Quoted owner approval (this prompt only):

```text
Ik approve SMM-B1.11-G controlled scheduled Instagram Story IMAGE Production verification.
```

Authorized: repository and Production readiness audit; read-only Production verification; selection/preparation of exactly one safe Story IMAGE test publication; Story-specific PRE-LIVE validation; Calendar/scheduling readiness; controlled-window readiness; tests/evidence; application fixes only if a concrete G blocker is discovered.

**Not** authorized and **not** performed: enabling `SOCIAL_SCHEDULING_ENABLED`; enabling `SOCIAL_PUBLISHING_ENABLED`; opening a live one-shot Story execution window; scheduling the Story into an imminent Production execution time; Production scheduler claim; Instagram Story container creation; `media_publish`; creation of an Instagram Story.

---

## C. Production gate baseline

Recorded from the latest automatic worker HTTP response **before** and **after** local Story Prepare (Prepare did not mutate env):

| Tick (UTC) | HTTP id | mode | schedulingEnabled | publishingEnabled | claimed | providerWriteAttempted |
| --- | --- | --- | --- | --- | --- | --- |
| `2026-08-21 19:25:00+00` | 33 | dry-run | false | false | 0 | false |
| `2026-08-21 19:30:00+00` | 34 | dry-run | false | false | 0 | false |
| `2026-08-21 19:35:00+00` | 35 | dry-run | false | false | 0 | false |

Required PRE-LIVE condition: both gates OFF / not exact `"true"`. **PASS.**

---

## D. Timer state

| Item | Value |
| --- | --- |
| Architecture | `Supabase Cron */5 * * * *` → machine-authenticated Vercel worker |
| Job | `zyntixai_social_publication_scheduler_5m` |
| Active count | 1 |
| Expression | `*/5 * * * *` |
| Vercel native Social Cron | 0 (`vercel crons list` = none) |
| Worker | `/api/cron/social-publications` |
| `maxDuration` | 300 |
| Execute batch | 1 (`SOCIAL_SCHEDULER_EXECUTE_BATCH_LIMIT`) |
| Sequential | yes |
| Miss grace | `seconds_late <= 900` may auto-execute; `> 900` → `schedule_missed` / Attention |
| Scheduler mode while gates OFF | dry-run |
| Claim while gates OFF | none |
| Provider write while gates OFF | none |

No Story-specific scheduler or queue was added. No timer architecture change.

---

## E. Instagram connection

Read-only Production state. No reconnect, OAuth, or credential rotation.

| Field | Value |
| --- | --- |
| Connection | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Type | Instagram Business |
| Account label | `zyntixai` |
| Status / health | connected / healthy |
| Fingerprint | `eefce660bad5c0ad` |
| Credential version | 2 |
| Reauthorization required | no |
| Connected Instagram count | 1 |
| `publish_image` | present |
| `publish_story` | present |

Matches the authoritative G connection. **PASS.**

---

## F. Story provider contract inherited from F

Re-checked 2026-08-21 against current Meta IG User Media documentation. No material change versus B1.11-F.

| Topic | Contract |
| --- | --- |
| Host (this product) | `graph.instagram.com` (Instagram Login). Official Facebook Login examples also show `graph.facebook.com`; ZyntixAI remains Instagram Login. |
| API | `v26.0` |
| Scopes | `instagram_business_basic`, `instagram_business_content_publish` |
| Account | Instagram Professional / Business |
| Story IMAGE container | `POST /{ig-user-id}/media` with `image_url` + `media_type=STORIES` |
| Caption / `alt_text` | **not** sent for Story container create |
| Media | JPEG; ≤ 8 MB; readable dimensions > 0; 9:16 recommended, not a hard provider reject |
| Flow | container create → poll → `FINISHED` → exactly one `media_publish` |
| Story VIDEO | fail-closed (`unsupported_format` / `format_unsupported`) before delivery URL and before Graph |

No provider-contract code was changed in G.

---

## G. Story target creation/selection

No existing repository/storage asset was Story-semantic 9:16 test media. Existing private-bucket JPEGs are square B1.8 feed test images (1080×1080 or 1254×1254). They were **not** reused.

A dedicated Story verification JPEG was created with local System.Drawing tooling (no external copyrighted assets, no AI generation):

| Visible copy | `ZYNTIXAI` / `Scheduled Story verification` / `Safe to delete` / `SMM-B1.11-G technical test` |
| --- | --- |
| Dimensions | 1080×1920 (9:16) |
| MIME | `image/jpeg` |
| Bytes | 60777 |
| SHA-256 | `e2aedb816e2f8f1aeae59fd1c669cdac48748617f009c55309003d02de73f36e` |

Uploaded to the private bucket `zyntix-social-media` (bucket `public=false`; anon/authenticated denied) via linked Supabase Storage CLI. Object:

`2fc07699-ece5-44b9-bbb3-abbc23e9fffb/b18/71ba1df3-6eb7-4640-93c6-3cd3112b51c4.jpg`

Then the established Prepare RPC chain was executed as the **Owner** member (`auth.uid() = 928bbcaf-6117-4fef-84a3-d1d8611373e9`, membership `6d8c8c91-39ff-4f26-86c8-5ec712b8c4f0`, role `owner`):

`register_social_media_asset` → `create_social_content_item` → `create_social_content_variant` (`content_format=story`) → `set_social_variant_media_attachments` → `create_social_content_variant_version` → `submit_social_approval_decision(approved)` → `evaluate_social_variant_version_workflow_readiness` (`workflow_ready=true`) → `create_social_publication(execution_mode=immediate)`.

All step result codes: `success`.

No Meta call. No container. No `media_publish`.

B1.11-E feed publication `ae6caf94-2fc7-4653-a085-0228d32e0c53` was **not** reused.

---

## H. Story content / version / media

| Item | UUID / value |
| --- | --- |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Workspace | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` |
| Brand | `75c299c2-dae2-4b76-8ad9-f92308d7440a` |
| Connection | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Content | `2d4efa69-504a-4981-b0b8-5f48231df532` |
| Variant | `44cf4943-4cb0-40c9-beeb-2809d10ead5b` |
| Version | `6d5547a9-c6ed-4556-8ade-62798019ea8c` (version_number `1`) |
| Approval decision | `9f83f400-2348-4cf4-997b-95e536a0e8a8` `approved` |
| Workflow ready | true |
| Media asset | `25981f38-bba2-40e5-9e29-749190dacf45` |
| Storage object | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb/b18/71ba1df3-6eb7-4640-93c6-3cd3112b51c4.jpg` |
| MIME / category | `image/jpeg` / `image` |
| Width × height | 1080 × 1920 |
| Size | 60777 bytes |
| Processing | `ready` |
| Content format | `story` |
| Planned provider | `instagram` |
| Publication | **`93ea15e8-f2bb-4ce3-b8af-c090dea49bd2`** |
| Idempotency key | `b18story_24420652d0b4_e2aedb816e2f8f1aeae59fd1c669cdac48748617` |
| Created by | Owner membership `6d8c8c91-39ff-4f26-86c8-5ec712b8c4f0` |

Editorial caption exists on the variant (B1.8 controlled copy). Adapter Story path does **not** send caption/`alt_text` to Graph. Version is immutable snapshot v1; replacement after scheduling remains domain-enforced.

---

## I. Story validation

| Check | Result |
| --- | --- |
| Content format | `story` |
| Media category | `image` |
| MIME | JPEG |
| Dimensions known | 1080×1920 > 0 |
| Size ≤ 8 MB | 60777 bytes |
| Story IMAGE validation | PASS (JPEG, size, positive pixels). 9:16 is quality preference only; validation was **not** tightened to require it. |
| Story VIDEO | not involved |
| Required capability | `publish_story` (not substitutable by `publish_image`) |

---

## J. Capability / readiness validation

| Check | Result |
| --- | --- |
| Connection connected + healthy | yes |
| Reauthorization required | no |
| `publish_story` on connection | yes |
| Workflow ready | yes (approved immutable v1 + media) |
| Closed-beta prepare | allowed (`create_social_publication` succeeded) |

---

## K. Provider request mock proof

No live Graph request. Regression evidence (B1.11-F tests re-run in G):

`tests/features/social-media/instagram-publishing-adapter.test.ts`

- Story IMAGE container: `image_url` + `media_type=STORIES`
- Host: `https://graph.instagram.com/v26.0/`
- `caption` undefined even when editorial caption is present
- `alt_text` undefined
- Exactly one mocked `media_publish` after `FINISHED`
- Story VIDEO: zero Graph writes
- Missing `publish_story`: no Meta call
- Feed IMAGE path still uses `publish_image` semantics (caption/`alt_text` unchanged)

Scheduler mock: `tests/features/social-media/instagram-story-image-b111f.test.ts` executes Story IMAGE once with `publish_story` and refuses the second tick (`controlled_window_exhausted`, `providerWriteAttempted=false`).

---

## L. Controlled-window readiness

| Current active Story windows | 0 |
| --- | --- |
| Windows for publication `93ea15e8-…` | 0 |
| Preferred PRE-LIVE | no executable window |

**Do not open the window in this PRE-LIVE step.**

Future one-shot command (after UUID approval, gates still OFF, **before** enabling publishing):

```sql
select *
from public.operator_open_social_controlled_publish_window(
  '2fc07699-ece5-44b9-bbb3-abbc23e9fffb'::uuid,
  '93ea15e8-f2bb-4ce3-b8af-c090dea49bd2'::uuid,
  1,
  'SMM-B1.11-G one-shot scheduled Story IMAGE',
  '928bbcaf-6117-4fef-84a3-d1d8611373e9'::uuid
);

select *
from public.operator_set_social_controlled_publish_window_expiry(
  '2fc07699-ece5-44b9-bbb3-abbc23e9fffb'::uuid,
  '<window_id from open>'::uuid,
  pg_catalog.now() + interval '25 minutes',
  '928bbcaf-6117-4fef-84a3-d1d8611373e9'::uuid
);
```

Required future window: exact org, workspace (stamped from publication), connection `24420652-d0b4-4237-9a75-51d89be50c65`, exact Story publication, `max_execute_count = 1`, `consumed = 0`, finite expiry.

Scheduler consume is wired into `scheduler_start_scheduled_publication_attempt` **before** claim. Worker never sets `zyntix.social_scheduler_unrestricted`.

---

## M. Scheduler readiness

Claim-time Story IMAGE can pass (`content_format in ('image','story')`, image media, `publish_story`). Story non-image media → `format_unsupported`. Applied F migration `20260821194000_allow_scheduler_story_image_format.sql` was **not** modified.

Pre-due scheduled invocation does not claim. Immediate mode is **not** scheduler-eligible.

Mocked complete path (no Meta):

Story IMAGE → approved immutable version → future scheduled state → pre-due = no claim → due → exact controlled window → one scheduler owner → Story claim-time validation → `publish_story` → signed image URL (TTL 3600s) → mocked container `media_type=STORIES` → processing → `FINISHED` → exactly one mocked `media_publish` → provider ID → succeeded → controlled budget 0 → second invocation → no second provider write.

---

## N. Other-publication isolation

At PRE-LIVE snapshot:

| Publication | Format | Mode | Status | Automatically scheduler-eligible now? |
| --- | --- | --- | --- | --- |
| `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` | story | immediate | queued | **NO** (not `scheduled`) |
| `040e15f3-22f7-4b94-a16a-d30ee7ce24d4` | image | immediate | queued | **NO** |
| `1714161a-29dd-4070-a1f0-6e2411ff363b` | image | immediate | queued | **NO** |
| `9dd4f6ed-5d99-4cb9-9297-1051a5ed8564` | image | immediate | queued | **NO** |
| `f584f4bb-c90b-4f19-865b-c066408368c6` | image | immediate | queued | **NO** |
| `ae6caf94-2fc7-4653-a085-0228d32e0c53` | image | scheduled | succeeded | **NO** |

Scheduled count: 0 eligible. Due/claimed/processing: 0. Active windows: 0.

Live choreography that preserves the guarantee “only the exact Story UUID may become automatically provider-executable”:

1. Keep gates OFF.
2. Open the one-shot window for `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2`.
3. Schedule that UUID ~12–15 minutes into the future (fresh UTC).
4. Enable both gates.
5. Wait only for automatic Supabase `*/5`.

While that window is active, any other publication’s execute is `publication_not_authorized_for_window`. Scheduler never picks `immediate` rows.

---

## O. Calendar readiness

Canonical route: `/social?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb&section=calendar`

`contentFormatDisplayLabel("story")` = `Story`. Org `timezone` is **null** → Calendar display fallback **UTC** (`source=unconfigured`). Account label `zyntixai`. After the future schedule (not done in PRE-LIVE), the item should show Story, account, day, UTC time, queued/scheduled state.

The Story was **not** scheduled merely to capture UI evidence.

---

## P. Missed-window / Attention

Unchanged 900-second policy. `seconds_late <= 900` may auto-execute. `seconds_late > 900` must not publish; expected `schedule_missed` + Attention + manual intervention. Story grace was **not** modified.

Open Social Attention (`scheduled_publication_missed` / `scheduled_publication_failed` / `social_account_reauthorization_required` / `provider_permission_missing`): **0**.

Unrelated enrollment QA Attention rows exist and are out of scope.

---

## Q. UEO

If Story final `media_publish` is externally uncertain → `unknown_external_outcome` → no automatic retry. Controlled window is already consumed. Next Cron: zero additional provider writes. Re-proved by Story scheduler UEO mock and the existing missed/Attention UEO matrix.

Signed media: private bucket → temporary HMAC delivery URL, TTL **3600 seconds**. Bucket remains private. No live URL minting in PRE-LIVE.

---

## R. Tenant / role security

| Actor | Prepare / schedule / execute mutations |
| --- | --- |
| Owner / Admin | Authorized per current Social policies. This Prepare used Owner. |
| Staff | Content mutate/approve allowed in Beta 1; **scheduling is Owner/Admin-only** (`canScheduleSocialPublication`). View-only for scheduling under locked Beta 1 policy. |
| Viewer | No mutation. |
| Foreign org/workspace/connection/version/media | Denied by RPC membership/workspace checks. |
| `?org=` URL | Does not override server tenant context. |

Prepare RPCs ran as Owner `auth.uid()`; `created_by_member_id` is the Owner membership.

---

## S. Story VIDEO fail-closed

Story VIDEO cannot be chosen in the Publish UI (IMAGE radios only). Adapter returns `unsupported_format` before minting a delivery URL and before Graph. Scheduler claim-time non-image Story → `format_unsupported`. G did not broaden into VIDEO.

---

## T. Feed IMAGE regression

Feed still uses `publish_image`. Feed container caption/`alt_text` behavior unchanged. Controlled scheduler still works conceptually. No Story `media_type=STORIES` leak into feed. B1.11-E succeeded feed publication was not mutated. Adapter + controlled-rollout tests re-run. **PASS.** No live feed provider write.

---

## U. Tests

Targeted G PRE-LIVE Vitest (no application code change; full suite not required):

| Batch | Result |
| --- | --- |
| Story domain/provider/scheduler/calendar/miss/UEO/prepare | 8 files, **84 passed** |
| Schedule actions + window binding + E rollout security | 3 files, **20 passed** |
| **Total targeted** | **104 passed / 0 failed** |

Known unrelated full-suite failures (not re-run; cited from F, not classified as new):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

F full baseline remains `2645 passed / 2 failed / 2647 total`.

---

## V. Static / build

No application code change. F evidence remains valid:

- `npx tsc --noEmit` PASS
- Social lint PASS
- `npx next build` PASS

No ceremonial Production redeploy.

---

## W. Production mutations

| Mutation | Done? |
| --- | --- |
| Story publication prepared | **YES** — `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` |
| Private JPEG uploaded | **YES** — dedicated 1080×1920 test asset |
| Content / variant / version / approval / media chain | **YES** |
| Story scheduled imminently | **NO** |
| Story claimed | **NO** |
| Story attempt | **NO** (`attempt_count = 0`) |
| Story controlled window opened | **NO** |
| Instagram Story container | **NO** |
| `media_publish` | **NO** |
| Instagram Story created | **NO** |
| Scheduling gate | **OFF** |
| Publishing gate | **OFF** |
| Connection mutation | **NO** |
| Credential mutation | **NO** |
| New migration | **NO** |
| Application deploy | **NO** |

Prepare `create_social_publication` used `execution_mode=immediate` and therefore stamped `intended_execute_at = 2026-08-21 19:35:39.397718+00` (Prepare clock). That is **not** a successful live schedule. The scheduler does not pick `immediate` rows.

Local publication events: `social_publication_created`, `social_publication_queued`. Provider/Graph events: none. `external_publication_id`: none.

---

## X. Exact owner-approval package

### Story publication

`93ea15e8-f2bb-4ce3-b8af-c090dea49bd2`

### Instagram connection

`24420652-d0b4-4237-9a75-51d89be50c65`

Safe account label: `zyntixai`

Fingerprint: `eefce660bad5c0ad`

### Story content

Technical test Story IMAGE. Visible text: **ZYNTIXAI** / **Scheduled Story verification** / **Safe to delete**. Footer: **SMM-B1.11-G technical test**. Dark navy portrait canvas. Safe to delete after visual confirmation.

### Media

JPEG. 1080×1920. 60777 bytes.

### Provider placement

`STORIES`

### Attempts

0

### Provider content ID

none (`external_publication_id` null)

### Controlled window

Current: none.

Future: max 1, consumed 0, finite expiry, exact UUID above.

### Execution mode

`immediate` / `queued` (Prepare default). **Not imminently live.** Not scheduled.

### Proposed live schedule

After UUID approval: keep gates OFF; open the one-shot window; call `scheduleSocialPublicationAction` / `public.schedule_social_publication` with a **fresh** UTC instant approximately 12–15 minutes after final approval. Do not use a stale pre-committed timestamp.

### Timer

Supabase: `*/5 * * * *`

### Other automatically executable publications

0

### Global gates

OFF / OFF

### Expected live external effect

Exactly ONE Instagram Story IMAGE test Story on `zyntixai`.

### Story lifetime

Instagram Stories are temporary platform content. Visual confirmation is still required after provider success. Do not infer owner confirmation automatically.

---

# LIVE AUTHORIZATION

Quoted owner authorization:

```text
Ik approve publication 93ea15e8-f2bb-4ce3-b8af-c090dea49bd2 voor één controlled automatic scheduled Instagram Story IMAGE publish binnen SMM-B1.11-G.
```

Scope: exactly that Story UUID, connection `24420652-d0b4-4237-9a75-51d89be50c65`, one controlled window, max execute 1, one fresh future schedule, one automatic Supabase Cron execution, one final `media_publish`, one resulting Instagram Story IMAGE test Story, zero other provider writes.

LIVE start HEAD: `817522fc4bd2e22331f4b9c989560c84cecf0a8b`. Divergence `0 0`. Worktree clean. No application code change.

Prechecks matched PRE-LIVE: Story queued/immediate, attempts 0, provider ID none, window none, connection ready, timer `*/5` with Vercel native Social Cron 0, both gates OFF, scheduler-eligible scheduled count 0.

---

# LIVE SETUP

### Controlled window

Opened while both gates were OFF via `operator_open_social_controlled_publish_window` + `operator_set_social_controlled_publish_window_expiry`.

| Field | Value |
| --- | --- |
| window_id | `d5c81d3d-c7e3-4d08-8595-bb137ae2b66d` |
| organization_id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| workspace_id | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` |
| connection_id | `24420652-d0b4-4237-9a75-51d89be50c65` |
| publication_id | `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` |
| status at open | `active` |
| max_execute_count | 1 |
| consumed | 0 |
| remaining | 1 |
| created_at | `2026-08-21 19:48:30.143864+00` |
| expires_at | `2026-08-21 20:43:44.615649+00` (~55 minutes) |

Read-back matched. Gates still OFF.

### Fresh UTC schedule

DB now at schedule step: `2026-08-21 19:48:54.372188+00`. Chosen instant **13 minutes** out.

Authoritative RPC `schedule_social_publication` as Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9`.

| Field | Value |
| --- | --- |
| result_code | `success` |
| publication_id | `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` |
| execution_mode | `scheduled` |
| intended_execute_at | `2026-08-21 20:01:54.372188+00` |
| next_attempt_at | `2026-08-21 20:01:54.372188+00` |
| variant_version_id | `6d5547a9-c6ed-4556-8ade-62798019ea8c` (unchanged) |
| connection_id | `24420652-d0b4-4237-9a75-51d89be50c65` (unchanged) |
| status | `queued` |
| attempts | 0 |
| provider content ID | none |
| event | `social_publication_scheduled` |

No attempt. No provider call.

Expected automatic ticks: `19:55` and `20:00` pre-due; first due tick `20:05`; later `20:10` still inside 900s and window expiry.

### Calendar evidence

Canonical: `/social?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb&section=calendar`

Org timezone unset → display **UTC**.

| Field | Value |
| --- | --- |
| UUID | `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` |
| Label | Story |
| Account | `zyntixai` |
| UTC instant | `2026-08-21 20:01:54` |
| Calendar day (UTC) | `2026-08-21` |
| Calendar time (UTC) | `20:01` |
| State | scheduled / queued |

Authenticated screenshot was not required; server/data contract is authoritative.

### Isolation assertion immediately before gates ON

```text
ONLY AUTHORIZED STORY UUID 93ea15e8-f2bb-4ce3-b8af-c090dea49bd2 CAN BECOME AUTOMATICALLY PROVIDER-EXECUTABLE
```

Scheduled queued publications: **1** (the authorized Story UUID only). Due-now: 0. Claimed/processing: 0. Active windows: 1, remaining 1, bound to that UUID. Four leftover B1.8 immediate IMAGE rows were left untouched and are not scheduler-eligible.

### Gate activation + Production ON deployment

- `SOCIAL_SCHEDULING_ENABLED=true`
- `SOCIAL_PUBLISHING_ENABLED=true`

No other feature gates changed. Values not printed.

| Field | Value |
| --- | --- |
| ON deployment | `dpl_PDJEPmjvZER7d1x1uMmBJJM7CNgX` |
| URL | `https://zyntixai-n3amrh6fd-guus-projects-ai.vercel.app` |
| Target | production |
| Ready | yes |
| Canonical alias | `https://www.zyntixai.com` |
| Code HEAD | `817522fc4bd2e22331f4b9c989560c84cecf0a8b` |
| Worker route | `/api/cron/social-publications` present |
| Vercel native Social Cron | **0** |
| Supabase Social Cron | 1 × `*/5 * * * *` |

### Pre-due automatic ticks (gates ON, no claim)

| UTC | http id | cron runid | mode | scheduling | publishing | claimed | providerWriteAttempted |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 19:50:00 | 38 | 70 | dry-run | false | false | 0 | false |
| 19:55:00 | 39 | 71 | execute | true | true | 0 | false |
| 20:00:00 | 40 | 72 | execute | true | true | 0 | false |

19:55/20:00: target still queued, attempts 0, window remaining 1. No manual scheduler call.

---

# AUTOMATIC EXECUTION

Due: `2026-08-21 20:01:54.372188+00`. First automatic eligible tick: `20:05:00`.

| Correlation | Value |
| --- | --- |
| Supabase cron | runid **73**, start `2026-08-21 20:05:00.095104+00`, succeeded |
| pg_net / HTTP response id | **41**, status 200, created `2026-08-21 20:05:00.11085+00` |
| Vercel invocationId | `e84f47b1-3390-4a2e-a2a5-85ac303e2aa5` |
| Worker id | `sched_6449e91f206b4c7d` |
| durationMs | 73419 |
| mode | execute |
| dueDiscovered | 1 |
| dueWithinGrace | 1 |
| claimed | 1 |
| succeeded | 1 |
| unknownOutcome | 0 |
| publicationIds | `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` only |
| attentionUpserted | 0 |
| providerWriteAttempted | true |
| Claim timestamp | `2026-08-21 20:05:01.781807+00` |
| Seconds late at claim | **187.41** (`<= 900`) |

No Execute button. No `vercel crons run`. No manual `invoke_social_publication_scheduler`. No direct adapter call.

### Claim / attempt

| Field | Value |
| --- | --- |
| Window consume | consumed 1 → remaining 0 at `2026-08-21 20:05:01.781807+00` |
| Window event | `execute_consumed` |
| Publication event | `social_publication_claimed` `source=scheduler` `claim_generation=1` |
| Attempt UUID | `afba243d-4e60-49b0-9b02-c59aebfb8af7` |
| Attempt number | 1 |
| operation_id | `op_7c117c78849f491a8119d30c61c22f94` |
| started_at | `2026-08-21 20:05:01.781807+00` |
| finished_at | `2026-08-21 20:06:13.727638+00` |
| duration | ~72.0 s |
| outcome | `succeeded` |

Second Cron `20:10:00` (http 42) still saw gates ON (OFF alias not yet live) but **claimed=0** and **providerWriteAttempted=false** because the one-shot window was already consumed.

### Story provider stages

This was a **Story** execution, not a feed IMAGE:

- Bound `content_format = story`
- Claim-time shape: Story IMAGE JPEG
- Required capability: `publish_story` (`requiredCapabilityForContentFormat("story")`)
- Adapter Story branch: `image_url` + `mediaType: "STORIES"`; caption and `alt_text` omitted
- Private JPEG → HMAC signed delivery (TTL 3600s; URL not logged here)
- Container create → poll until `FINISHED` (wall time ~73 s matches wait + one publish)
- Exactly one `media_publish`
- Provider content ID persisted: `18111265202036012` (distinct from B1.11-E feed IMAGE `18116980474912030`)

Success diagnostics are not persisted on the attempt row (`provider_step` remains null on healthy success, same as B1.11-E). `media_publish` count = **1**. No UEO.

---

# SAFE GATE CLOSURE

Terminal result observed at `2026-08-21 20:06:13.727638+00`. Both Production gates restored to exact `"false"` immediately, then Production redeployed. Visual confirmation was **not** waited on.

| Field | Value |
| --- | --- |
| OFF deployment | `dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa` |
| URL | `https://zyntixai-6twmdspqm-guus-projects-ai.vercel.app` |
| Target | production |
| Ready | yes |
| Canonical alias | `https://www.zyntixai.com` |
| Code HEAD | `817522fc4bd2e22331f4b9c989560c84cecf0a8b` |
| Scheduling gate | false |
| Publishing gate | false |

Post-OFF automatic tick:

| UTC | http id | cron runid | mode | scheduling | publishing | claimed | providerWriteAttempted |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 20:15:00 | 43 | 75 | dry-run | false | false | 0 | false |

Scheduler returned to fail-closed operation. Supabase Cron remains 1 × `*/5 * * * *`. Vercel native Social Cron remains 0.

---

# POST

### Publication / attempt / provider

Same UUID `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2`. Status `succeeded`. `completed_at` present. Provider content ID `18111265202036012`. `last_failure_class` null. Attempts PRE 0 / POST **1**. Execution mode remains `scheduled`. `intended_execute_at` preserved. Window max 1 / consumed 1 / remaining 0 / status `consumed`.

### Isolation

Other publications claimed / attempted / succeeded during the gate-ON period: **0**. Worker `publicationIds` contained only the authorized Story UUID. Four historical immediate B1.8 queued IMAGE rows remain `queued` / `immediate` / attempt_count 0.

### Connection

Unchanged: `24420652-d0b4-4237-9a75-51d89be50c65`, connected, healthy, fingerprint `eefce660bad5c0ad`, credential version **2**, `publish_story` present, one connected Instagram. No reconnect / OAuth / identity change / credential rotation.

### Attention

Open Social Attention for missed / unknown / reauth / permission / failed: **0**.

---

## LIVE verdict (prior stop)

```text
SMM-B1.11-G PROVIDER PASS — OWNER STORY VISUAL CONFIRMATION REQUIRED
```

That stop recorded provider success with gates restored OFF. Owner visual confirmation was still required. The owner has now supplied it. See **FINAL CLOSURE** below.

---

# OWNER VISUAL CONFIRMATION

Prior recorded state after LIVE provider pass:

```text
PENDING
```

Owner has now explicitly confirmed:

```text
INSTAGRAM SCHEDULED STORY VISUAL CONFIRMATION = PASS
```

The owner visually inspected the intended Instagram Business account. The controlled scheduled Story was visibly present. This completes the final owner-side acceptance requirement for B1.11-G.

Do not infer this from publication `succeeded`, provider ID `18111265202036012`, or Graph success. The PASS above is owner-supplied, not inferred.

`OWNER POST-VERIFICATION CLEANUP: not recorded / not required for closure`

Instagram Story expiry/deletion is not required for B1.11-G closure.

---

# PRE / POST

| Field | PRE | POST |
| --- | --- | --- |
| Publication UUID | `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` | same |
| Content format | Story | Story |
| Media | JPEG 1080×1920, 60777 bytes | same |
| Status | queued | succeeded |
| Execution mode | immediate (Prepare clock) | scheduled |
| Intended execute time | Prepare clock only | `2026-08-21 20:01:54.372188+00` |
| Attempts | 0 | 1 |
| Provider content ID | none | `18111265202036012` |
| Story container count | 0 | 1 (then one `media_publish`) |
| `media_publish` count | 0 | 1 |
| Window remaining | 1 after live setup | 0 |
| Other publications executed | 0 | 0 |
| Connection UUID | `24420652-d0b4-4237-9a75-51d89be50c65` | same |
| Fingerprint | `eefce660bad5c0ad` | same |
| Credential version | 2 | 2 |
| Failure Attention | 0 baseline | 0 |
| Scheduling gate | false | false |
| Publishing gate | false | false |
| Timer | Supabase `*/5` | Supabase `*/5` |
| Story visual confirmation | pending | PASS |

---

# FINAL CLOSURE

## Owner visual verification

```text
INSTAGRAM SCHEDULED STORY VISUAL CONFIRMATION = PASS
```

The owner visually inspected the intended Instagram Business account. The controlled scheduled Story was visibly present. This completes the final owner-side acceptance requirement for B1.11-G.

No screenshots, UI placement, impression counts, Story analytics, viewers, or engagement are recorded. The owner did not state that the Story was manually deleted.

`OWNER POST-VERIFICATION CLEANUP: not recorded / not required for closure`

Instagram Story expiry/deletion is not required for B1.11-G closure.

## Automatic scheduling verification

- Fresh future Story schedule: `2026-08-21 20:01:54.372188+00`
- Automatic Supabase Cron runid `73` at `2026-08-21 20:05:00.095104+00` (HTTP request ID `41`, Vercel invocation `e84f47b1-3390-4a2e-a2a5-85ac303e2aa5`)
- No manual Execute
- Claim inside 900-second grace: **187.41** seconds late — PASS

## Story provider verification

- `publish_story` present on connection `24420652-d0b4-4237-9a75-51d89be50c65`
- Story IMAGE (JPEG `1080×1920`, `60777` bytes)
- Instagram container used `media_type=STORIES`
- No Story `caption`; no Story `alt_text`
- Provider processing reached `FINISHED`
- Exactly one `media_publish`
- Provider content ID persisted: `18111265202036012`
- Publication `93ea15e8-f2bb-4ce3-b8af-c090dea49bd2` `succeeded` at `2026-08-21 20:06:13.727638+00`
- Exactly one attempt: `afba243d-4e60-49b0-9b02-c59aebfb8af7` (`succeeded`, claim generation 1, worker `sched_6449e91f206b4c7d`)
- No retry. No UEO.

## Controlled rollout verification

- Exact one-shot window `d5c81d3d-c7e3-4d08-8595-bb137ae2b66d`
- max execute count = `1`
- consumed = `1`
- remaining = `0`
- status = `consumed`
- Other publications executed = `0`

## Connection integrity

- Same connection `24420652-d0b4-4237-9a75-51d89be50c65`
- connected
- healthy
- fingerprint `eefce660bad5c0ad` unchanged
- credential version `2`
- `publish_story` present
- one active Instagram connection
- No reconnect / OAuth / identity replacement / credential rotation during G

## Safety closure

- Scheduling gate OFF: `SOCIAL_SCHEDULING_ENABLED=false`
- Publishing gate OFF: `SOCIAL_PUBLISHING_ENABLED=false`
- Production Ready: OFF deployment `dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa`, canonical alias `https://www.zyntixai.com`
- Subsequent automatic scheduler tick `2026-08-21 20:15:00`: Cron run `75`, HTTP `43`, `mode=dry-run`, claimed `0`, `providerWriteAttempted=false`
- Supabase Cron remains the authoritative timer: 1 active `*/5 * * * *` → Vercel worker
- Vercel native Social Cron: `0`

No implementation, schema, config, gate, timer, or Production mutation in this evidence-only closure.

## Tests (unchanged)

No Vitest, TypeScript, lint, or build rerun. B1.11-F / G technical evidence already recorded. No code changed. No runtime implementation validation is needed beyond evidence integrity.

## Final conclusion

```text
INSTAGRAM CONTROLLED AUTOMATIC SCHEDULED STORY PUBLISH PASS
SMM-B1.11-G CLOSED WITH EVIDENCE
```

Next planned phase, **not started**:

`SMM-B1.11-FV — Stories + Scheduling Final Verification`

`NOT STARTED — REQUIRES OWNER APPROVAL`

Do not start Analytics, Story VIDEO, Story sequencing, or recurring daily Story automation.
