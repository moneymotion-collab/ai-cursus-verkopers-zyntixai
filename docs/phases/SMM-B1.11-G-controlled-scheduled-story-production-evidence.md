# SMM-B1.11-G — Controlled Scheduled Instagram Story IMAGE Production — Evidence

## PRE-LIVE

Highest permitted verdict for this prompt:

```text
SMM-B1.11-G PRE-LIVE READY — OWNER EXACT STORY PUBLISH APPROVAL REQUIRED
```

This file does **not** record a LIVE PASS. No Instagram Story container, `media_publish`, or Instagram Story was created. Both global execution gates remain OFF.

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
