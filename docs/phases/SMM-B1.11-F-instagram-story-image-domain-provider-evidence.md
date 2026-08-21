# SMM-B1.11-F — Instagram Story IMAGE Domain + Provider

Status: **CLOSED WITH EVIDENCE**

Date: 2026-08-21

Verdict: **SMM-B1.11-F CLOSED WITH EVIDENCE — INSTAGRAM STORY IMAGE PROVIDER PATH READY**

B1.11-G implementation prerequisites: **SATISFIED**

This does **not** authorize SMM-B1.11-G. No live Instagram Story write occurred.

---

## A. Repository baseline

| Item | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `9f6316687b5056bde8d42ae4efa9c625335eb6b7` |
| Start message | `docs(smm): close B1.11-E scheduled publish verification` |
| Start divergence | `0 0` |
| Start worktree | clean |

Precheck matched the B1.11-E close SHA. No unrelated dirty files.

---

## B. Production safety baseline

Recorded read-only before implementation.

| Item | Value |
| --- | --- |
| Instagram connection | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Account type | Business |
| Status / health | connected / healthy |
| Fingerprint | `eefce660bad5c0ad` |
| Credential version | 2 |
| Connected Instagram count | 1 |
| Reauthorization required | no |
| `publish_image` | present |
| `publish_story` | present |
| Supabase Cron | 1 active, `*/5 * * * *` |
| Vercel native Social Cron | 0 |
| Worker | `/api/cron/social-publications`, `maxDuration = 300`, batch 1 |
| `SOCIAL_SCHEDULING_ENABLED` | OFF / not exact `"true"` |
| `SOCIAL_PUBLISHING_ENABLED` | OFF / not exact `"true"` |
| Latest tick at precheck | `2026-08-21 18:35:00+00` `mode=dry-run` `claimed=0` `providerWriteAttempted=false` |
| Scheduled / due / claimed | 0 / 0 / 0 |
| Active controlled windows | 0 |
| Latest attempt | `2026-08-21 18:05:01.911292+00` (B1.11-E feed IMAGE) |
| Story attempts | 0 |

Both execution gates were OFF. Implementation proceeded.

---

## C. Official Instagram Story IMAGE contract

Verified 2026-08-21 against current Meta developer documentation. Historical repository pins (`graph.instagram.com`, `v26.0`, `instagram_business_basic` + `instagram_business_content_publish`, `media_type=STORIES`) were treated as hypotheses and confirmed, not assumed.

### Sources

| Source | URL | Page updated |
| --- | --- | --- |
| Instagram API with Instagram Login — Content Publishing | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/ | current at verification |
| IG User Media (container create) | https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media | 2026-08-12 |
| IG User Media Publish | https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media_publish/ | current at verification |

Repository pin (unchanged): `INSTAGRAM_GRAPH_BASE_URL = https://graph.instagram.com`, `INSTAGRAM_GRAPH_API_VERSION = v26.0`.

### Implementation-relevant facts

| Topic | Verified fact |
| --- | --- |
| Host for this product | Instagram Login uses `graph.instagram.com`. Facebook Login examples use `graph.facebook.com`. ZyntixAI remains Instagram Login. |
| API version in official examples | `v26.0` |
| Professional account | Instagram professional (Business/Creator) required |
| Instagram Login permissions | `instagram_business_basic`, `instagram_business_content_publish` |
| Story IMAGE create | `POST /{ig-user-id}/media` with `image_url` and `media_type=STORIES` |
| `media_type=STORIES` | Current and required for Story containers |
| Caption / alt_text | Image Story container example has no `caption`. `alt_text` is documented as unsupported for Reels and Stories (2025-03-24). |
| Image format | JPEG |
| File size | 8 MB maximum |
| Aspect | Recommended 9:16 to avoid cropping or blank space. **Not** a hard 4:5–1.91 feed range. **Not** a mandatory 1080×1920 pixel size. |
| Public media URL | Provider cURLs `image_url`; the object must be reachable by Meta. ZyntixAI continues to use private storage + signed delivery. |
| Container lifecycle | Create container → poll status until publishable (`FINISHED`) → `POST /{ig-user-id}/media_publish?creation_id=` |
| Containers expire | 24 hours |
| Account publishing limit | Material: 50 published posts / 24 hours; 400 containers / 24 hours |
| Stickers / polls / music | Not supported on this publishing path |

Signed delivery TTL remains 3600 seconds. Story IMAGE uses the same container poll as feed IMAGE; no TTL change was justified.

---

## D. Previous Story support audit

| Layer | Before B1.11-F |
| --- | --- |
| Domain | `content_format` already includes `story`. Capability `publish_story` already exists. |
| Prepare | Hardcoded feed IMAGE (`p_content_format: "image"`, feed JPEG 320–1440 / 4:5–1.91). |
| Validation | Feed IMAGE rules only. |
| Capability | Domain mapped `story` → `publish_story`. Prepare/scheduler execution required `publish_image`. SQL `scheduler_start` required `content_format = image` **and** hardcoded `v_required_cap is distinct from 'publish_image'`. |
| Adapter | Story IMAGE already sent `media_type=STORIES` and omitted caption. Story VIDEO was also implemented. |
| Execute | Scheduler and B1.8 execute rejected anything except `content_format === "image"`. Scheduler `executionInput.contentFormat` was hardcoded `"image"`. |
| Scheduling | B1.11-A schedule RPCs already publication-UUID generic. Claim-time SQL blocked Story. |
| Calendar | `contentFormatDisplayLabel("story")` already returned `Story`. |
| Attention | Existing B1.11-D rules; no Story-specific duplicates. |
| Tests | Adapter had one Story IMAGE success test. No Prepare/scheduler/security Story IMAGE suite. |
| Production | Feed IMAGE Production-verified in B1.11-E. Story never written. |

No second Story aggregate existed. F generalized the existing path.

---

## E. Domain representation

Story IMAGE uses the existing chain:

`social_content_items` → `social_content_variants` (`content_format = story`) → `social_content_variant_versions` → `social_publications`.

No `social_stories`, `social_story_publications`, or Story queue table.

Placement is domain `story` / `image`. Provider `media_type=STORIES` stays in the Instagram adapter.

---

## F. Prepare path

`prepareB18ImagePublication` gained `placement: "feed" | "story"` (default `feed`).

Story Prepare:

- authenticates through existing Owner/Admin Social policy
- binds org/workspace from server context
- requires the exact Instagram connection with `publish_story`
- validates Story JPEG (not feed aspect)
- creates the normal local content/version/approval/publication chain
- does **not** call Meta

Idempotency prefix `b18story_` keeps Story distinct from a feed prepare of the same JPEG.

---

## G. Media validation

Official Story IMAGE constraints implemented:

- MIME `image/jpeg`
- size ≤ 8 MB
- readable positive integer width/height
- `mediaCategory = image`

Rejected:

- PNG / non-JPEG
- Story VIDEO
- oversize buffers

Not invented as hard rejects: 1080×1920, mandatory 9:16. 9:16 is recommended UI copy only. Feed IMAGE still uses 320–1440 / 4:5–1.91.

---

## H. Capability validation

| Placement | Required capability |
| --- | --- |
| Feed IMAGE | `publish_image` |
| Story IMAGE | `publish_story` |

One does not substitute for the other. Checked at Prepare, claim-time SQL, execute-time connection revalidation, and adapter preflight. Missing `publish_story` produces no provider write.

---

## I. Provider adapter

One Instagram adapter. Feed IMAGE unchanged: `image_url` + caption/alt_text, no `media_type=STORIES`.

Story IMAGE: `image_url` + `media_type=STORIES`. No caption, no alt_text.

Story VIDEO: `unsupported_format` **before** minting a delivery URL and **before** any Graph call.

Processing: poll until `FINISHED`, then exactly one `media_publish`. Timeout/UEO classification unchanged.

---

## J. Scheduler integration

`execute-scheduled-social-publication` now accepts feed IMAGE **or** Story IMAGE via `isScheduledInstagramImagePublicationShape`.

SQL `scheduler_start_scheduled_publication_attempt` now allows `content_format in ('image','story')`, requires Story media_category `image`, and checks `publish_image` or `publish_story` according to format.

Same claim, attempt, events, 900-second miss, gates, idempotency, UEO.

---

## K. Controlled rollout integration

B1.11-E one-shot window is unchanged:

- exact org / workspace / connection / publication UUID
- max execute 1
- finite expiry
- atomic consume
- both gates true
- no window → no scheduler provider write

Story inherits this. F did not open a Story window.

---

## L. Scheduling / Calendar

Story publications use B1.11-A `execution_mode=scheduled`, future `intended_execute_at`, same UUID for reschedule/cancel.

Calendar already labeled `Story`. A regression test now asserts Story vs feed IMAGE distinction (format, account, time, lifecycle).

Publish UI: finite Feed / Story selector. Story VIDEO is not selectable. Copy: Story IMAGE implemented; Production Story publishing remains in controlled rollout. Does **not** claim Stories are Production verified.

---

## M. Attention / missed / UEO

No Story-specific Attention rules. Missed >900s, UEO, reauth, permission missing, and scheduled failure reuse B1.11-D.

Story UEO mocked: complete `unknown_external_outcome`; second tick cannot start another write (`controlled_window_exhausted` / no adapter retry).

---

## N. Tenant / role security

Prepare still uses `resolveOrganizationContext` + `canManageSocialConnections` (Owner/Admin). Staff/Viewer remain denied. Foreign org/workspace/connection cannot be granted by URL.

Scheduling remains Owner/Admin-only (`canScheduleSocialPublication`). No Story permission bypass.

Scheduler SQL remains `service_role` only; authenticated/anon revoked.

---

## O. Feed IMAGE regression

Feed Prepare default remains `placement=feed`. Adapter feed tests still require caption on the feed container and `publish_image`. Scheduler success mock for publication `ae6caf94-…` remains green.

Feed 4:5–1.91 / 320–1440 validation is unchanged.

---

## P. Story VIDEO fail-closed evidence

| Layer | Proof |
| --- | --- |
| Domain | `evaluateInstagramStoryImageConstraints` returns `unsupported_story_video` |
| Adapter | Story + `mediaCategory=video` → `instagram_unsupported_format`, `fetch` not called |
| Execute | Story video snapshot → `publication_shape_invalid`, adapter not called |
| SQL | Story with non-image `media_category` → `format_unsupported` |
| UI | No Story VIDEO option |

---

## Q. Tests

Narrow B1.11-F related files: **13 passed / 133 tests**.

Full Vitest:

```text
npx vitest run --reporter=dot
Test Files  2 failed | 375 passed (377)
Tests       2 failed | 2645 passed (2647)
```

Known unrelated failures (same two as B1.11-E baseline 2626/2/2628; no new failure classes):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Net new passing tests vs E close: **+19**.

Covered: Story domain/validation, adapter STORIES params, Story VIDEO fail-closed, missing `publish_story`, processing→FINISHED then one `media_publish`, mocked scheduler success + second-tick zero writes, UEO, controlled window, Calendar Story label, Prepare Story format binding, feed IMAGE regression, Owner/Admin vs Staff/Viewer, SQL security.

---

## R. Static / build

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx eslint` on F-touched files | PASS |
| `npx next build` | PASS (existing autoprefixer warning on operator CSS) |
| Production Vercel build | PASS |

---

## S. Migration status

**YES** — required. Claim-time SQL previously blocked Story and hardcoded `publish_image`.

| Local file | `supabase/migrations/20260821194000_allow_scheduler_story_image_format.sql` |
| --- | --- |
| Production apply | MCP `apply_migration` name `allow_scheduler_story_image_format` |
| Production schema_migrations version | `20260821185013` |
| Applied | 2026-08-21 |
| Function comment | `B1.11-F scheduler claim+start... Feed IMAGE and Story IMAGE only.` |
| Second Story table | NO |
| Feed behavior | preserved |

Forward-only `CREATE OR REPLACE` of `public.scheduler_start_scheduled_publication_attempt`. Grants remain service_role only.

---

## T. Production deployment

| Item | Value |
| --- | --- |
| Implementation commit | `b97f1e29a82dd24704e2c773ed3616f95e92b2b4` |
| Deployment ID | `dpl_GD363qPpZAqaQvsfxX6a3XA3utzv` |
| Target | production |
| Ready | yes |
| URL | `https://zyntixai-g1hnfbbzp-guus-projects-ai.vercel.app` |
| Canonical alias | `https://www.zyntixai.com` |
| Also aliased | `https://zyntixai.com` |

---

## U. Production read-only / dry-run verification

Post-deploy tick after Ready + alias:

| Field | Value |
| --- | --- |
| HTTP id | 30 |
| Created | `2026-08-21 19:10:00.092774+00` |
| status | 200 |
| mode | dry-run |
| schedulingEnabled | false |
| publishingEnabled | false |
| claimed | 0 |
| providerWriteAttempted | false |
| Supabase Cron | 1 active `*/5 * * * *` |
| Vercel native Social Cron | 0 (`No cron jobs found`) |
| Canonical `/social` | loads (unauthenticated → Sign in) |
| Instagram `publish_story` | still present |
| Story publications | 0 |

No Story provider activity.

---

## V. Production mutation statement

| Mutation | Occurred |
| --- | --- |
| Story Production publication created | **NO** |
| Story Production publication scheduled | **NO** |
| Story Production claim | **NO** |
| Story Production attempt | **NO** |
| Story controlled window | **NO** |
| Story provider adapter called against Meta | **NO** |
| Instagram Story container | **NO** |
| `media_publish` | **NO** |
| Instagram Story created | **NO** |
| Feed publication created | **NO** |
| Scheduling gate | **OFF** |
| Publishing gate | **OFF** |
| Connection mutation | **NO** |
| Credential mutation | **NO** |
| Schema/function replace | YES — scheduler_start Story IMAGE allowlist only |
| Application deploy | YES — gates remained OFF |

---

## W. B1.11-G readiness

| Requirement | Status |
| --- | --- |
| Official Story IMAGE contract | PASS |
| Story domain | PASS |
| Story Prepare | PASS |
| Story validation | PASS |
| `publish_story` capability | PASS |
| Provider adapter | PASS |
| Scheduler path | PASS |
| Controlled window | PASS |
| Missed-window safety | PASS |
| Attention | PASS |
| UEO protection | PASS |
| Feed regression | PASS |
| Production gates OFF | PASS |
| Timer healthy | PASS |
| Instagram connection healthy | PASS |

**B1.11-G IMPLEMENTATION PREREQUISITES SATISFIED**

Not started. Requires explicit owner approval. Do not prepare a live Story, open a Story window, or enable either gate from this phase.
