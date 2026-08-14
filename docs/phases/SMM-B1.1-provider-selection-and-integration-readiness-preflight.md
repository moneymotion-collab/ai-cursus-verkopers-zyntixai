# SMM-B1.1-PREFLIGHT — Provider Selection & Integration Readiness

| Field | Value |
| --- | --- |
| Phase | **SMM-B1.1-PREFLIGHT — Provider Selection & Integration Readiness** |
| Parent | **SMM-B1.1 — Social Account Connections & Credential Foundation** |
| Document type | Readiness preflight (**documentation only**) |
| Research date | **2026-08-14** |
| Formal status | `SMM-B1.1 PREFLIGHT CLOSED WITH EVIDENCE — PROVIDER AND CREDENTIAL ARCHITECTURE READY FOR OWNER SELECTION` |
| Owner authorization | `OWNER APPROVED — SMM-B1.1 PROVIDER SELECTION AND INTEGRATION READINESS PREFLIGHT` |
| Binding predecessor | SMM-B1.0 `CLOSED WITH EVIDENCE` |
| B1.0 contract | `docs/phases/SMM-B1.0-social-media-domain-security-data-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `b2d9f9c83877c8df4ecac57475ba2b4c5888a26f` |
| Implementation | **Not authorized** |

This preflight **recommends**. It does **not** select. Recommendation ≠ owner authorization.

```text
SMM-B1.1 PREFLIGHT CLOSED WITH EVIDENCE — PROVIDER AND CREDENTIAL ARCHITECTURE READY FOR OWNER SELECTION
OWNER PROVIDER SELECTION REQUIRED BEFORE SMM-B1.1 IMPLEMENTATION
OWNER CREDENTIAL STORAGE APPROVAL REQUIRED BEFORE SMM-B1.1 IMPLEMENTATION
```

---

## 1. Executive verdict

**Recommended first provider:** Instagram professional accounts using **Instagram API with Instagram Login** (Meta), not Facebook Page posting as the first adapter.

**Runner-up:** YouTube Data API v3 (strong OAuth/analytics; cannot prove Story Continuity).

**Why Instagram Login wins:** it is the only evaluated first-party API that officially documents organic **image, video, carousel, Reels, and Stories** publishing plus long-lived refreshable tokens, container status lookup (B1.0 `submission_unknown` reconciliation), and account/media insights — without requiring a Facebook Page.

**This preflight does not start B1.1 implementation.**

Statuses used below:

| Status | Meaning |
| --- | --- |
| Provider feature exists | Official docs describe it |
| ZyntixAI is permitted to use it | Least-privilege + B1.0 scope (organic; no ads/DMs/comments product) |
| Closed-beta accessible | Realistic without full Advanced Access / partner audit |
| ZyntixAI has implemented it | Always **no** in this preflight |

---

## 2. Starting Git baseline (VERIFIED)

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD / upstream / origin | `b2d9f9c83877c8df4ecac57475ba2b4c5888a26f` |
| Subject | `docs(smm): close SMM-B1.0 domain security contract` |
| Divergence | `0 0` |
| Worktree | clean |

CB-Q1 remains paused. Invitation gates were not touched.

---

## 3. Binding SMM-B1.0 contract

B1.0 remains binding. This preflight does not change:

- approval-first publishing;
- Owner/Admin-only connect/disconnect;
- Viewer read-only;
- provider-neutral adapter architecture;
- Publication Job / Attempt / External Publication;
- `submission_unknown` / no blind retry;
- Story Continuity in Beta 1;
- paid ads, listening, DMs, comment inbox **out**.

OD-SMM-1 (first provider) and OD-SMM-9 (credential vault) remain owner decisions. This document supplies evidence for those decisions.

---

## 4. Research method / date

| Item | Value |
| --- | --- |
| Date | 2026-08-14 |
| Method | First-party developer documentation only for binding capability claims |
| Allowed sources | Meta for Developers; TikTok for Developers; Microsoft Learn LinkedIn API; Google YouTube developer docs; X developer docs |
| Disallowed for binding claims | Blogs, unofficial pricing posts, tutorials |
| Gaps | Marked `NOT VERIFIED FROM OFFICIAL PROVIDER DOCUMENTATION` or `UNKNOWN — OFFICIAL DOCS INSUFFICIENT` |
| Meta fetch note | Several `developers.facebook.com` HTML fetches timed out; binding Meta claims below are taken from official Meta documentation pages that were retrieved as search-indexed official snippets / markdown titles with canonical `developers.facebook.com` URLs, plus pages that did return (IG Container, App Review, Insights, Webhooks, Content Publishing Limit, Access Token, Refresh Token, Platform Overview). Where a full page body was not retrieved, the claim is labeled accordingly. |
| X fetch note | `docs.x.com` and `developer.x.com` returned **HTTP 403** to this research client. X pricing/capability is therefore **not** used as a binding first-provider argument. |

No OAuth, no provider developer-app creation, no secrets, no API calls were performed.

---

## 5. Official provider sources

### 5.1 Meta / Instagram

| Title | URL | Notes |
| --- | --- | --- |
| Content Publishing | https://developers.facebook.com/docs/instagram-platform/content-publishing | Image/video/carousel/Reels/Stories; two login types |
| Instagram Platform Overview | https://developers.facebook.com/documentation/instagram-platform/overview | Instagram Login vs Facebook Login comparison |
| Business Login for Instagram | https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/ | Code → short-lived → 60-day long-lived |
| Access Token (IG) | https://developers.facebook.com/docs/instagram-platform/reference/access_token/ | Short-lived (~1h) → long-lived 60d; server-side secret |
| Refresh Access Token | https://developers.facebook.com/docs/instagram-platform/reference/refresh_access_token/ | Refresh if ≥24h old and unexpired; another 60d |
| IG Container | https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-container/ | `status_code`: EXPIRED, ERROR, FINISHED, IN_PROGRESS, PUBLISHED |
| IG User Media | https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/media | `media_type` CAROUSEL / REELS / STORIES |
| Content Publishing Limit | https://developers.facebook.com/documentation/instagram-platform/instagram-graph-api/reference/ig-user/content_publishing_limit | `quota_total` currently 50 / 86400s |
| App Review for Instagram API | https://developers.facebook.com/docs/instagram-platform/app-review/ | Advanced Access; Instagram Login permission names |
| Insights | https://developers.facebook.com/docs/instagram-platform/insights/ | Media + account insights; available for Instagram Login |
| Instagram Media Insights | https://developers.facebook.com/docs/instagram-platform/reference/instagram-media/insights/ | Story metrics 24h; webhook caveat |
| Webhooks for Instagram | https://developers.facebook.com/docs/instagram-platform/webhooks/ | comments/mentions/messages/story_insights |
| Instagram Graph API Webhooks (Page) | https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-instagram/ | Page-connected field subscriptions |

**Not treated as identical:** Facebook Page Graph publishing vs Instagram professional publishing. Facebook Page posting is **not** the recommended first adapter.

### 5.2 TikTok

| Title | URL |
| --- | --- |
| Content Posting API Get Started | https://developers.tiktok.com/doc/content-posting-api-get-started |
| Content Posting product | https://developers.tiktok.com/products/content-posting-api |
| OAuth token management | https://developers.tiktok.com/doc/oauth-user-access-token-management |
| Get Post Status | https://developers.tiktok.com/doc/content-posting-api-reference-get-video-status |
| Display API Get Started | https://developers.tiktok.com/doc/display-api-get-started/ |
| Rate Limits | https://developers.tiktok.com/doc/tiktok-api-v2-rate-limit |
| API v2 introduction | https://developers.tiktok.com/doc/tiktok-api-v2-introduction |

### 5.3 LinkedIn

| Title | URL | Version |
| --- | --- | --- |
| Posts API | https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api?view=li-lms-2026-07 | Marketing `li-lms-2026-07`; 202507 sunset warning |
| Community Management Overview | https://learn.microsoft.com/en-us/linkedin/marketing/community-management/community-management-overview?view=li-lms-2026-07 | Vetted product; Dev/Standard tiers |
| Integration requirements | https://learn.microsoft.com/en-us/linkedin/marketing/community-management/integration-requirements-community-management?view=li-lms-2026-06 | Technical sign-off checklist |
| Authorization code flow | https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow | Access token ~60 days |
| Programmatic refresh tokens | https://learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens | MDP partners; refresh ~1 year |

### 5.4 YouTube / Google

| Title | URL |
| --- | --- |
| Videos: insert | https://developers.google.com/youtube/v3/docs/videos/insert |
| Resumable uploads | https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol |
| Quota and Compliance Audits | https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits |
| OAuth server-side web apps | https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps |
| YouTube Analytics reports.query | https://developers.google.com/youtube/analytics/reference/reports/query |
| YouTube Analytics data model | https://developers.google.com/youtube/analytics/data_model |
| Analytics/Reporting authorization | https://developers.google.com/youtube/reporting/guides/authorization |

### 5.5 X

Official `docs.x.com` / `developer.x.com` fetches returned **403**. Binding X capability/pricing: **`NOT VERIFIED FROM OFFICIAL PROVIDER DOCUMENTATION`**. X is **not** on the first-provider shortlist.

---

## 6. Provider capability matrix

Legend: **S** = SUPPORTED (official). **C** = SUPPORTED WITH CONDITIONS. **N** = NOT SUPPORTED. **U** = UNKNOWN — OFFICIAL DOCS INSUFFICIENT.

| Capability | Instagram / Meta (IG Login) | TikTok | LinkedIn (org) | YouTube | X |
| --- | --- | --- | --- | --- | --- |
| OAuth available | S | S | S | S | U (403) |
| Server-side code exchange | S (required; app secret) | S | S | S | U |
| Long-lived / refresh | S (60d IG user token; refresh ≥24h) | S (24h access / 365d refresh; refresh may rotate) | C (60d access; programmatic refresh for MDP partners) | S (Google refresh tokens) | U |
| Image publishing | S | S (photo Direct Post) | S | N | U |
| Video publishing | S | S | S | S | U |
| Carousel | S (`CAROUSEL`) | U / N (photo set is not IG carousel) | N organic carousel; **S MultiImage**; carousel **sponsored only** | N | U |
| Story | S (`STORIES`) | N (not in Content Posting get-started) | N | N | N expected; U official |
| Reel / Short equivalent | S (`REELS`) | S (native short video) | N | C (Shorts = format heuristics, no dedicated API) | N |
| Native scheduling | N (publish is immediate `media_publish`; ZyntixAI owns schedule) | N documented | U | S (`status.publishAt` + privacy) | U |
| Publication-status lookup | S (container `status_code`) | S (`publish_id` status fetch) | C (GET post by id) | S (video resource / processing) | U |
| Account analytics | S (IG user insights) | U (Display API lists videos; not IG-style insights) | S if Community Management access | S (Analytics API) | U |
| Post analytics | S (media insights; Story 24h) | C (video.list/query metadata, not marketing insights) | S (share/page statistics) | S | U |
| Webhook / events | C (comments/messages/story_insights; **not** publish-complete as primary) | S (post.publish.*) | C (org social-action notifications) | C (separate PubSub; not fetched in full here) | U |
| App review | C (Advanced Access for non-role users) | C (audit to lift private restriction) | S (vetted apply + tiers + screencast) | C (unverified = private uploads; OAuth verification) | U |
| Business verification | C (may be required for some Advanced Access; **not fully enumerated from retrieved pages**) | N/U | C (company page + program apply) | C (Google Cloud OAuth verification) | U |
| Sandbox / test mode | C (app roles / Standard Access testers; professional IG account required) | C (unaudited = **private** posts) | C (Development tier limited QPS) | C (private uploads pre-audit) | U |
| Practical closed-beta viability | **C — highest among evaluated** | C (private until audit) | **Weak** (vetted access gate) | C (private until audit) | **Not shortlisted** |

---

## 7. Product-fit scoring

Weights locked to B1.0 (Story Continuity in Beta 1). Score 0–weight. Higher complexity scores **lower**.

| Category | Weight | Instagram Login | TikTok | LinkedIn org | YouTube |
| --- | --- | --- | --- | --- | --- |
| Core publishing coverage | 25 | **22** | 16 | 17 | 12 |
| Story / short-form relevance | 20 | **20** | 12 | 0 | 10 |
| OAuth / credential maturity | 15 | **14** | 14 | 11 | 15 |
| Analytics usefulness | 15 | **13** | 5 | 12 | 15 |
| Webhook / reconciliation | 10 | **7** | 9 | 6 | 6 |
| Closed-beta feasibility | 10 | **7** | 4 | 3 | 5 |
| Engineering complexity (higher = simpler) | 5 | **3** | 3 | 2 | 3 |
| **Total** | **100** | **86** | **63** | **51** | **66** |

### Score notes

**Instagram:** Core almost complete; native schedule absent (acceptable: B1.0 ZyntixAI scheduler). Story officially `STORIES`. Container statuses map to B1.0 attempt states. Insights exist for Instagram Login. Webhooks are not the primary publish-reconcile path (polling is). App Review needed for public third-party Advanced Access; closed beta can start on app roles.

**TikTok:** Excellent Direct Post + `publish_id` + webhooks + rotating refresh. Unaudited clients **restricted to private**. No Story Continuity proof. Display API is not a substitute for IG insights.

**LinkedIn:** Organic image/video/MultiImage yes; **organic carousel no** (carousel is sponsored — paid ads **out of SMM Beta 1**). Community Management is a **vetted** product. `r_member_social` is **closed**. No Stories. Weak first-provider.

**YouTube:** Best OAuth + analytics + native `publishAt`. Video-only. No image/carousel/Story. Shorts are not a first-class API. Strong **later** adapter; weaker first adapter for B1.0 domain proof.

**X:** Not scored for selection. Official docs not retrieved (403).

---

## 8. Provider-specific findings

### 8.1 Instagram / Meta (recommended path: Instagram Login)

**Products required (B1.1 connect + later publish):**

- Meta App with **Instagram API with Instagram Login** / Business Login for Instagram.
- Permissions (Instagram Login names from official App Review + publishing tables): `instagram_business_basic`, `instagram_business_content_publish`; later insights: `instagram_manage_insights` equivalent on the Instagram Login family (`instagram_business_*` set — App Review lists `instagram_business_basic`, `instagram_business_content_publishing`, `instagram_business_manage_comments`, `instagram_business_manage_messages`). Exact insights permission string for Instagram Login: confirm in App Dashboard during owner app setup (`NOT VERIFIED` as a single canonical insights scope name beyond the Insights guide stating insights **are available** for Instagram Login).

**Facebook Login path (not first):** `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`, often `pages_show_list`. **Facebook Page linkage required.** Extra: hashtag search, product tagging, partnership ads — **out of Beta 1**.

**Account type:** Instagram **professional** (Business or Creator). Personal accounts are not this API.

**Page linkage:** **Not required** for Instagram Login. Required for Facebook Login.

**Content types (official publishing guide + IG User Media):** single image, video, carousel, Reels (`REELS`), Stories (`STORIES`).

**Media hosting:** Meta retrieves `image_url` / `video_url` by fetching a **publicly reachable** URL (or resumable upload on Facebook Login / `rupload.facebook.com`). B1.3 storage must eventually produce a fetchable URL or use the documented upload path. B1.1 does not publish.

**Tokens:** authorization code → short-lived IG user token (~1 hour) → long-lived 60-day token via `graph.instagram.com/access_token` with **app secret (server-only)**. Refresh via `graph.instagram.com/refresh_access_token` (`ig_refresh_token`) if token is **at least 24 hours old and not expired**. Refreshed token valid 60 days.

**Idempotency:** no client idempotency-key documented on `media_publish`. ZyntixAI **must** own generation/idempotency (already B1.0). Reconciliation: poll container `status_code` (`IN_PROGRESS` / `FINISHED` / `PUBLISHED` / `ERROR` / `EXPIRED`). Maps to B1.0 `submitting` / `submission_unknown` / `published` / `failed`.

**Native schedule:** not documented on Instagram Content Publishing. **ZyntixAI scheduler publishes immediately at due time.**

**Rate limit:** `GET /{ig-user-id}/content_publishing_limit` documents `quota_total` currently **50** / 24h. The Content Publishing guide also mentions **100** API-published posts in one paragraph. Treat as **provider-enforced quota; do not invent a ZyntixAI number**; persist provider `quota_usage`. Documented discrepancy: **do not collapse 50 vs 100**.

**Webhooks:** comments, mentions, messages, story_insights. **Comment/DM inbox out of Beta 1.** Publish-state reconciliation should **not** wait on webhooks in B1.1. Story insights webhook: Facebook Login oriented in several pages; Insights guide says story_insights webhook **Facebook Login only**. B1.8 should not assume Instagram Login story webhooks.

**App review:** Advanced Access required to request permissions from arbitrary users. Closed-beta testers can be App Roles / Standard Access (`SUPPORTED WITH CONDITIONS`).

**Business verification:** may apply for some Meta Advanced Access; exact current trigger **not fully retrieved**. Surface as owner prerequisite to confirm in App Dashboard.

**Test:** professional IG account owned by testers; no personal-account workaround.

**Facebook Pages:** separate later adapter. Do not implement Page posting in B1.1.

### 8.2 TikTok

- Login Kit / OAuth 2.0 at `open.tiktokapis.com`; code exchange `POST /v2/oauth/token/`; access **24h**; refresh **365d**; **new refresh_token may replace old — must persist rotation**.
- Revoke: `POST /v2/oauth/revoke/`.
- Content Posting: Direct Post (`video.publish`) vs Upload-to-inbox (`video.upload`).
- **Unaudited clients: all posted content private.** Audit required for public.
- Photo Direct Post supported (`media_type=PHOTO`, `post_mode=DIRECT_POST`).
- Status: `publish_id` + fetch + webhooks (`post.publish.complete/failed/publicly_available/...`).
- Moderation may delay `post_id`.
- Display API: profile/video list — **not** IG-equivalent insights.
- Rate limits documented for Display endpoints (600/min); posting status fetch **30/min per access token**.
- No Story Continuity API in official get-started.
- `PULL_FROM_URL` requires verified domain/URL prefix.

### 8.3 LinkedIn

- OAuth 2 authorization code; access ~60 days; programmatic refresh for **MDP partners**.
- Organization posting: `w_organization_social` **and** member role ADMINISTRATOR / DIRECT_SPONSORED_CONTENT_POSTER / CONTENT_ADMIN.
- Member posting: `w_member_social`; **`r_member_social` closed** (not accepting requests).
- Organic: text, images, videos, documents, article, MultiImage. **Organic carousel = No; sponsored carousel = Yes.** Paid ads remain out of SMM Beta 1.
- Community Management API = **vetted**; Development then Standard (screencast). Development: 12-month expectation; 500/app and 100/member request limits (FAQ).
- Agency model: client **Page admin** must authorize. Feasible later, not first.
- No Stories.

### 8.4 YouTube

- OAuth 2 server-side; `youtube.upload` for insert; analytics scopes separate (`yt-analytics.readonly` + `youtube.readonly` now required on reports.query).
- Unverified projects after 2020-07-28: uploads **private** until audit.
- Default quota: 100 `videos.insert`/day and 10,000 units other.
- `status.publishAt` + `privacyStatus` = native schedule.
- Shorts: **no dedicated API**; vertical/short duration (+ optional `#Shorts` in unofficial sources — **do not treat hashtag as official required field**; official insert docs do not define a Shorts flag).
- No image posts, no carousel, no Stories.
- Strong later adapter.

### 8.5 X

Official documentation **not retrieved** (403). **Not shortlisted.** Do not let unofficial pay-per-use pricing change ZyntixAI architecture.

---

## 9. First-provider recommendation

**Instagram professional account via Instagram API with Instagram Login (Meta).**

Provider catalog value (design candidate): `instagram`.

Login product: `instagram_login` (not `facebook_login`) for B1.1.

---

## 10. Runner-up

**YouTube Data API v3** — best credential/analytics maturity; cannot prove Story Continuity or image/carousel.

**Next after Instagram (not runner-up):** TikTok Content Posting API (short-form + webhooks; public posting blocked until audit).

---

## 11. Provider limitations (Instagram Login)

- Professional account required.
- App Review / Advanced Access for non-role users.
- No native IG schedule; ZyntixAI must execute at due time.
- Public media URL or documented upload path needed later for publish (B1.3/B1.6).
- Containers expire (24h) if unpublished — B1.6 must not leave FINISHED containers idle.
- Quota 50 vs 100 discrepancy in Meta docs — persist provider quota, do not hardcode.
- Story insights webhook may be Facebook Login-only.
- Comments/DMs exist on platform — **must not** be productized in Beta 1.
- Facebook Page features (ads, hashtag search, product tagging) must not leak into this adapter.

---

## 12. Credential-storage analysis

### Current stack (FACT)

| Layer | Truth |
| --- | --- |
| Runtime | Next.js server actions; Vercel Production `zyntixai.vercel.app` |
| DB | Supabase/Postgres; RLS + SECURITY DEFINER RPCs |
| App service-role client | **ABSENT** |
| Existing crypto | AES-256-GCM, purpose-bound SHA-256 key from `INVITE_CONTINUATION_SECRET` (invitation cookies only) |
| Env | Server-only fail-closed flags; **no** `NEXT_PUBLIC_` secrets |
| Per-customer env vars | Must **not** be used for social tokens |

### Options

| Option | Description | Fit |
| --- | --- | --- |
| **A** | App-side AES-256-GCM; ciphertext in `private` table; decrypt only in Node with env key | Matches existing crypto; Postgres never sees plaintext; browser cannot decrypt ciphertext |
| **B** | External vault (cloud KSM / third-party) | Extra vendor; no existing vault in repo |
| **C** | Hybrid metadata in DB + secret in vault | Correct long-term; premature for Beta 1 |

**Supabase:** do **not** enable pgsodium/Vault in this preflight. SQL-side decrypt would make secrets decryptable inside the database — worse given SECURITY DEFINER breadth.

**Vercel:** store **one** encryption key + **one** Instagram app client id/secret as env. Never one env var per connected account.

---

## 13. Vault / encryption recommendation

### Recommended Beta 1 architecture: **Option A**

- Table (candidate): `private.social_provider_credentials` — `organization_id`, `connection_id`, `key_version`, `ciphertext`, `nonce/iv`, `auth_tag` or combined sealed blob, `token_kind`, `expires_at`, `refresh_expires_at`, `rotated_at`, `row_version`.
- **No GRANT SELECT** to `authenticated` / `anon`.
- RPC may return **ciphertext** to Owner/Admin server actions only if unavoidable; plaintext **never** crosses to the browser. Preferred: plaintext only in memory inside the server module that calls the provider, after decrypt.
- **Do not reuse** `INVITE_CONTINUATION_SECRET`. New purpose: `zyntixai.smm.credential.aes-v1` + env `SOCIAL_CREDENTIAL_ENCRYPTION_KEY` (min length fail-closed, same spirit as invitation secret).
- App client id/secret: `SOCIAL_INSTAGRAM_CLIENT_ID` / `SOCIAL_INSTAGRAM_CLIENT_SECRET` (server-only). Not `NEXT_PUBLIC_`.

**Why:** proven Node AES-GCM pattern; no service-role; ciphertext useless without Vercel key; multi-tenant rows; scalable.

**Threats mitigated:** browser token theft; PostgREST SELECT of plaintext; accidental log of DB dumps as usable tokens; SQL `SELECT` by authenticated role.

**Remaining risks:** Vercel env + DB dump together recover tokens (accepted for Beta 1; rotate key + re-seal). Compromised Owner JWT plus a leaky RPC that returns **plaintext** would be a defect — B1.1 tests must forbid plaintext in RPC results.

**Key management:** generate 32+ byte secret; Production/Preview/Development **separate** keys; Preview must not use Production Instagram app secret if Preview callback is enabled (prefer Production-only Instagram app for closed beta).

**Rotation:** `key_version`; decrypt with old, encrypt with new; never overwrite refresh token without CAS/`row_version`.

**Backup:** ciphertext restores with the matching key version. Losing the env key = all connections `reauthorization_required`.

**B1.1 boundary:** implement abstraction + persist/decrypt for **connection** only. No publish decrypt path required until B1.6 — but the same module must be the only decryptor.

**Owner choice still required:** OD-SMM-9.

---

## 14. OAuth architecture (future, not implemented)

```text
Owner/Admin clicks Connect
  → server establishes intent (org, workspace, actor, provider=instagram)
  → cryptographically strong OAuth state (hashed at rest)
  → redirect to Instagram Business Login authorize URL
  → trusted callback (allowlisted origin)
  → validate state, actor, org, workspace, unused, unexpired, provider
  → server code → short-lived token (app secret never in browser)
  → server exchange long-lived token
  → persist ciphertext + metadata
  → fetch IG professional identity (server)
  → capability snapshot
  → create Connection
  → audit (no tokens)
  → token-free browser redirect to allowlisted return path
```

### 14.1 OAuth state intent fields (conceptual)

`state_public` (sent to provider), `state_hash` (stored), `organization_id`, `workspace_id`, `actor_user_id`, `actor_membership_id`, `provider`, `return_path_id` (allowlisted key, **not** raw URL), `created_at`, `expires_at`, `consumed_at`, `code_verifier` if PKCE used.

No raw provider token in state.

### 14.2 Return security

Reuse `safe-return-path` allowlist pattern; add future SMM paths only as explicit allowlist entries. No open redirect. Do not put tokens or codes in the **final** app URL. Consume `code` server-side; redirect to `?social_connect=success|denied|error` without secrets. Do not log `code` or tokens.

---

## 15. Connection data model (no SQL)

### Social Account Connection

`organization_id`, `workspace_id`, `provider` (`instagram`), `login_product` (`instagram_login`), `external_account_id` (IG user id from provider, **server-derived**), `external_account_name`, `external_account_type` (`business` \| `creator`), `connection_status`, `health_overlay`, `granted_scopes[]`, `capability_snapshot` JSON, `capability_snapshot_at`, `credential_ref_id`, `connected_by_member_id`, timestamps, `archived_at` unused (use `disconnected`).

### OAuth Authorization Intent

Private table; single-use; hashed state; TTL.

### Provider Credential

Private encrypted row 1:1 connection; `row_version` for refresh CAS.

### Connection events

`account_connected` / `account_reauthorized` / `account_disconnected` on `social_events` (B1.0 names).

### Uniqueness

- One **non-disconnected** connection per `(organization_id, provider, external_account_id)`.
- Unique `state_hash`.
- Unique `credential` per `connection_id`.
- Callback: `consumed_at` CAS; replay denied.
- Concurrent callbacks: unique constraint + consumed flag.

---

## 16. Token lifecycle

| Event | Behavior |
| --- | --- |
| Issue | Store long-lived + expiry |
| Proactive refresh | Refresh when age ≥24h and remaining TTL below a threshold (e.g. 7 days) — threshold is implementation detail, must respect Meta 24h-minimum |
| Reactive refresh | On `credential_expired` from provider **if** token still theoretically refreshable |
| Failed refresh | `reauthorization_required`; Attention later (B1.9); **no endless retry** |
| Revoked | `revoked`; destroy secrets |
| Concurrency | `SELECT … FOR UPDATE` or `row_version` CAS in the decrypt/refresh module; stale refresh **must not** overwrite a newer sealed blob |
| TikTok note (later adapter) | Must save rotated refresh_token |

---

## 17. Connection health

Do **not** call Instagram on every page render.

Persist `health_overlay` + `health_checked_at`. Refresh health on connect, reconnect, explicit “check connection”, and controlled interval from a future job (B1.6+). Map:

| Observed | Stored |
| --- | --- |
| Token valid + scopes present | `connected` + `healthy` |
| Token valid, missing publish scope | `permission_missing` |
| Refresh failed / expired | `reauthorization_required` |
| Provider 5xx | overlay `provider_unavailable` (do not flip to revoked) |
| User/app deauthorized | `revoked` |
| Operator disconnect | `disconnected` |

---

## 18. Provider identity validation

After token exchange, **server** calls provider “me”/IG user endpoint. `external_account_id` comes from that response.

Browser must not supply `external_account_id` as authority.

If a future Facebook Login path lists multiple Pages, selection must be validated against **server-fetched** Page/IG inventory for that token.

---

## 19. Disconnect / revoke

| Kind | Action |
| --- | --- |
| Local disconnect | Destroy ciphertext; status `disconnected`; keep publications/audit; block publish |
| Provider revocation | Detect via API error; status `revoked`; destroy secrets |
| Provider revoke API | Instagram Login revoke endpoint: **confirm during B1.1 adapter spike from official docs**; TikTok official revoke exists (`/v2/oauth/revoke/`). If IG revoke is documented, call it best-effort after local destroy; failure must not restore secrets |

No cascade-delete of historical rows.

---

## 20. Rate limits

**Separate:**

1. **ZyntixAI abuse:** connect/callback/reconnect/refresh/disconnect per actor/org (follow invitation mutation rate-limit pattern). Exact numeric caps: **do not invent** in this preflight; set in B1.1-B with tests.
2. **Provider:** IG publishing quota via `content_publishing_limit` (B1.6). B1.1 OAuth/identity calls are low volume.

---

## 21. Webhooks

**B1.1:** do **not** implement Instagram webhooks. Connection proof does not need them.

**B1.6:** optional; publish reconcile is **container polling** first.

**B1.8:** insights polling; story_insights webhook only if Instagram Login actually supports it (official pages currently tie several insight webhooks to Facebook Login).

If implemented later: signature verification, replay protection, tenant from Connection, never from payload org fields.

---

## 22. Feature gates

Fail-closed, server-only, exact `"true"`:

| Gate | Phase |
| --- | --- |
| `SOCIAL_CONNECTIONS_ENABLED` | B1.1 |
| `SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED` | B1.1 (provider-specific) |
| `SOCIAL_PUBLISHING_ENABLED` | B1.6 |
| `SOCIAL_AUTOMATED_PUBLISHING_ENABLED` | B1.6 |
| `SOCIAL_STORY_AUTOMATION_ENABLED` | B1.7 |

Missing/malformed = OFF. UI hide is insufficient. RPC re-check required.

---

## 23. Environment / callback strategy

| Env | Instagram app | Callback |
| --- | --- | --- |
| Local | Dev Meta app | `http://127.0.0.1:3000/api/social/instagram/callback` (exact URI registered) |
| Vercel Preview | **Do not share Production client secret.** Default: Preview connections **disabled** (`SOCIAL_CONNECTIONS_ENABLED=false`) | Avoid URI confusion |
| Production | Production Meta app | `https://zyntixai.vercel.app/api/social/instagram/callback` (or canonical `NEXT_PUBLIC_SITE_URL`) |

Production provider credentials must not automatically be readable by Preview deployments.

Conceptual env (do not create now):

```text
SOCIAL_CONNECTIONS_ENABLED=false
SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED=false
SOCIAL_INSTAGRAM_CLIENT_ID=
SOCIAL_INSTAGRAM_CLIENT_SECRET=
SOCIAL_CREDENTIAL_ENCRYPTION_KEY=
```

No `NEXT_PUBLIC_` for any of these. Gate ≠ credential presence: missing secret with gate ON → `configuration_error` (invitation delivery pattern).

---

## 24. SDK vs HTTP

**Recommend direct HTTPS** to `graph.instagram.com` / `api.instagram.com` for B1.1.

Reasons: official Graph is REST; pin API version in adapter; smaller dependency than Meta Business SDK; error bodies visible; matches B1.0 “adapter not hardcoded SDK”. Invitation email used Resend SDK because Resend’s product **is** that SDK; Instagram Graph is HTTP-native.

**SDK is not a security boundary.** Tenant isolation, role checks, secret handling, and lifecycle remain ZyntixAI application responsibilities.

---

## 25. Testing strategy

| Layer | Prove |
| --- | --- |
| Unit | state hash/TTL/single-use; return-path allowlist; role matrix; capability mapping; error normalization; encrypt/decrypt roundtrip; refresh CAS |
| Integration | mocked token exchange; credential persist; decrypt isolation; duplicate connection |
| Database | RLS deny; unique `(org, provider, external_account_id)` active; no SELECT on ciphertext for `authenticated`; intent consumed-once |
| Browser (later) | Owner/Admin connect; Staff denied; Viewer denied; cancel; provider error; disconnect; reconnect |
| Production QA | Connection only; **no posts** |

---

## 26. Negative security matrix (B1.1 must later prove)

| Case | Expected |
| --- | --- |
| Cross-tenant workspace id | forbidden / unavailable |
| State tamper | deny |
| Expired state | deny |
| Reused state | deny |
| Wrong actor on callback | deny |
| Wrong provider | deny |
| Malicious return URL | ignore; allowlisted only |
| Account not in provider inventory | deny |
| Duplicate connection | conflict; no second active row |
| Revoked/expired token | status mapping; no publish |
| Refresh race | one winner; no stale overwrite |
| Staff connect | deny at RPC |
| Viewer mutation | deny |
| Secret SELECT as authenticated | no rows / no grant |
| Secret logging | tests that log helpers never include token fields |

---

## 27. Provider-app owner prerequisites (Instagram Login)

Owner must eventually create **manually** (not in this preflight):

1. Meta developer account + Meta App.
2. Instagram product: Instagram API with Instagram Login / Business Login.
3. OAuth redirect URIs (local + Production only by default).
4. App mode (Development for closed beta testers as App Roles).
5. Professional Instagram account(s) for testers.
6. Privacy policy URL, terms URL, data-deletion instructions (Meta App Review typically requires these — **owner must confirm current App Dashboard checklist**; ZyntixAI repo currently has **no** `/privacy` or `/terms` routes).
7. Screencast for Advanced Access when leaving role-only testers.
8. Requested permissions: start with `instagram_business_basic` (+ content publish only when B1.6, not required to **prove B1.1 connection** if basic identity works — **prefer requesting only basic for B1.1 connect proof**, add publish permission in B1.6). Least privilege: B1.1 should request the minimum that returns IG user id + account type. If official Login config requires grouping permissions in the embed URL, document the actual set at implementation time without adding comments/messages.
9. Confirm whether Meta Business Verification is required for the chosen permissions.

---

## 28. Costs

| Provider | Finding |
| --- | --- |
| Instagram / Meta Graph | **FREE / NO DIRECT API COST IDENTIFIED** on retrieved publishing/login docs (quota exists; no paywall stated) |
| TikTok Content Posting | **FREE / NO DIRECT API COST IDENTIFIED** on official get-started/product pages |
| LinkedIn Community Management | **UNKNOWN** (program application; no public price on retrieved overview) |
| YouTube | **FREE / NO DIRECT API COST IDENTIFIED** within default quota; quota extension requires audit |
| X | **UNKNOWN** — official pricing page not retrieved (403) |

Do not guess prices.

---

## 29. Policy requirements

Technical/product readiness — **not legal advice**.

| Requirement | Instagram | Repo today |
| --- | --- | --- |
| Privacy policy URL | Expected for App Review | **Missing** |
| Terms URL | Expected | **Missing** |
| Data deletion / user data handling | Expected | **Missing** public page |
| App Review | Advanced Access | N/A |
| Prohibited automation | Must not add comment/DM bots | Already deferred in B1.0 |
| Retention | Do not log tokens; disconnect destroys secrets | Contracted |

---

## 30. B1.1 slicing plan

Adjusted to this repo (no job runner; no service-role; AES-GCM already exists).

| Slice | Scope | Close with evidence |
| --- | --- | --- |
| **SMM-B1.1-A** | Typed provider/connection/capability/error/permission contracts; no I/O | Yes |
| **SMM-B1.1-B** | Migrations: connection, oauth intent, private encrypted credentials, RLS, unique invariants, RPCs; encryption module using new env key | Yes |
| **SMM-B1.1-C** | OAuth intent + callback route + state machine + return-path; **mocked** token exchange tests; gates | Yes |
| **SMM-B1.1-D** | Direct HTTP Instagram adapter: token exchange, identity, capability snapshot; still no Production connect | Yes |
| **SMM-B1.1-E** | Owner/Admin Connect/Disconnect/Reauth UI; Staff/Viewer denied | Yes |
| **SMM-B1.1-F** | Security/regression: tenant, unique, secret exposure, refresh CAS, logging | Yes |
| **SMM-B1.1-G** | Controlled Production **connection** QA only | Yes |

Every slice needs separate owner authorization. **Do not start SMM-B1.1-A now.**

---

## 31. Production QA boundary

Prove connection only:

- Owner/Admin initiate connect
- OAuth completes
- Server-derived IG id stored
- Secret ciphertext only
- Capability snapshot present
- Staff/Viewer denied
- Cross-tenant denied
- Disconnect destroys secrets, keeps metadata
- Reauthorize if safe

**No social publication** unless a future owner explicitly requires a non-public connectivity post — default **0 posts**.

---

## 32. Owner decision register

| ID | Decision | Preflight recommendation | Status |
| --- | --- | --- | --- |
| **OD-SMM-1** | First provider | Instagram professional via **Instagram Login** | **OWNER DECISION REQUIRED** |
| **OD-SMM-9** | Credential storage | **Option A** app-side AES-GCM + private ciphertext | **OWNER DECISION REQUIRED** |
| **OD-SMM-10** | Instagram Login vs Facebook Login | Instagram Login first (no Page required) | **OWNER DECISION REQUIRED** (bundled with OD-SMM-1) |
| **OD-SMM-11** | Meta App + professional test accounts | Owner creates manually | Required before B1.1-G |
| **OD-SMM-12** | Privacy/terms/data-deletion URLs | Must exist before App Review | Required before Advanced Access |
| **OD-SMM-13** | Meta Business Verification | Confirm in App Dashboard | Confirm before Advanced Access |
| **OD-SMM-14** | Preview OAuth | Default **disabled** | Recommend lock |
| **OD-SMM-7/8** | Storage / jobs | Unchanged; not B1.1 | Deferred |

---

## 33. External-effect statement

```text
0 OAUTH AUTHORIZATIONS
0 PROVIDER ACCOUNTS CONNECTED
0 PROVIDER TOKENS CREATED
0 PROVIDER API MUTATIONS
0 SOCIAL POSTS
0 SOCIAL STORIES
0 WEBHOOK SUBSCRIPTIONS
0 SMM DATABASE MIGRATIONS
0 SMM APPLICATION CHANGES
```

---

## 34. Recommended next owner action

1. Approve or reject **OD-SMM-1**: Instagram Login as first provider.
2. Approve or reject **OD-SMM-9**: Option A encryption.
3. If both approved, issue a **separate** authorization: `OWNER APPROVED — AUTHORIZE SMM-B1.1-A …` (typed contracts only, or a named slice).
4. Do **not** treat this preflight as implementation authorization.

```text
SMM-B1.1 IMPLEMENTATION NOT YET AUTHORIZED
```
