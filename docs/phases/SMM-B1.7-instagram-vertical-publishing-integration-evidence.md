# SMM-B1.7 — Instagram Complete Vertical Publishing Integration — Evidence

## 1. Executive verdict

```text
SMM-B1.7 CLOSED WITH EVIDENCE — INSTAGRAM VERTICAL PUBLISHING INTEGRATION IMPLEMENTED
INSTAGRAM PUBLISHING ADAPTER READY BEHIND FAIL-CLOSED PRODUCTION GATES
CONTROLLED PRODUCTION INSTAGRAM PUBLISH VERIFICATION NOT EXECUTED
```

## 2. Verified Git baseline

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `d85f5e55f2c1da2bc08921cee86743b21c0b44a6` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Prior tip | `docs(smm): close B1.6 publishing infrastructure` |

## 3. Binding prior SMM contracts

A–D / B1.2–B1.6 preserved. B1.6 Publication/Attempt/Event, claim/lease, idempotency, `unknown_external_outcome`, and segmented adapter contract unchanged. No service-role shortcut.

## 4–8. Official Meta documentation verification

Authoritative source reviewed (updated **2026-06-30**):

`https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/`

| Item | Verified |
| --- | --- |
| Login product | **Instagram API with Instagram Login** (Business Login for Instagram) |
| Host | `graph.instagram.com` |
| Token | Instagram User access token |
| Permissions | `instagram_business_basic` + `instagram_business_content_publish` |
| Graph version in docs examples | `v26.0` (pinned in code) |
| Endpoints | `POST /{ig-user-id}/media`, `POST /{ig-user-id}/media_publish`, `GET /{container-id}?fields=status_code`, `GET /{ig-user-id}/content_publishing_limit` |
| Media hosting | Provider cURL — public HTTPS URL required at publish time |
| Container status | `EXPIRED` / `ERROR` / `FINISHED` / `IN_PROGRESS` / `PUBLISHED` |
| Polling guidance | ~1/minute, ≤5 minutes |
| Quota | 100 API-published posts / 24h moving window (carousel = 1); enforce on `media_publish` |
| App Review | Advanced Access required for production publishing permissions |

Resumable `rupload.facebook.com` path is documented primarily for Facebook Login for Business; Instagram Login path uses `video_url` HTTPS delivery (implemented).

## 9–10. Supported / unsupported formats

**Implemented:** `image`, `video`→`VIDEO`, `short_video`→`REELS`, `carousel`, `story` (image `STORIES` + video `STORIES`).

**Explicit unsupported/deferred:** `text`, `pin`, `thread`, `long_video`; Trial Reels; product/location/collaborator tags; comments/DMs/insights; cross-posting; Story Autopilot; AI repurposing.

## 11–12. Scope / files

Instagram publishing lives under `src/features/social-media/server/instagram-publishing/` + media-delivery route. Core Publication engine not filled with `if (provider === 'instagram')`.

## 13. Migration decision

```text
NO DATABASE MIGRATION REQUIRED FOR SMM-B1.7
```

B1.6 already provides `external_publication_id`, attempt lifecycle, claim/lease, failure classes. Crash recovery uses in-process container IDs; after `media_publish` dispatch → `unknown_external_outcome` (no blind retry).

## 14–16. OAuth / reauthorization / capability evidence

| Prior scopes | `instagram_business_basic` only |
| B1.7 scopes | `instagram_business_basic,instagram_business_content_publish` |
| Reauth | Existing reauthorization flow; new authorize URL requests publish scope |
| Evidence | Token-exchange `permissions` → `deriveInstagramCapabilitiesFromGrantedPermissions`; missing publish permission → empty capability snapshot → preflight `unsupported_capability` / `reauthorization_required` |

No messages/comments/insights scopes.

## 17–20. Adapter architecture / registry / credentials

`createInstagramPublishingAdapter(deps)` implements `SocialPublishingAdapter`. Registry factory `createSocialPublishingAdapterRegistry().createInstagram(deps)`. Credentials: load envelope + AES-256-GCM decrypt server-only; plaintext token only in adapter request boundary; never logged/persisted on Publication/Attempt.

## 21–23. Media delivery

Private-by-default. Temporary HMAC-signed HTTPS URLs (`SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET`) via `GET /api/social/media-delivery/[token]`. No public Social media bucket. Byte source defaults unavailable (fail-closed) until private storage is wired — **OWNER ACTION** for Production media bytes.

## 24–35. Publishing flows

Image: create container → `media_publish` → external media id.  
Video/Reel/Story-video: create → poll `status_code` → `FINISHED` → publish.  
Carousel: ordered children (exact snapshot sort) → parent `CAROUSEL` → publish.  
Story image: `image_url` + `media_type=STORIES`, no caption.  
Quota preflight via `content_publishing_limit` when enabled.  
Success only after proven `media_publish` media id.

## 36–42. Failure / retry / ambiguity / crash

Normalized B1.6 failure classes. Ambiguous final publish (timeout/network after request dispatched) → `unknown_external_outcome` (no auto-retry). Crash before publish: safe recreate containers. Crash after publish may have reached Meta: ambiguous. No durable container persistence table (documented residual).

## 43–47. Gates / system execution / client safety

`SOCIAL_PUBLISHING_ENABLED` fail-closed. Connection gates unchanged OFF. Browser cannot call adapter / complete attempts (B1.6 private RPCs). No service-role client.

## 48. Static secret scan

No literal tokens/secrets committed. Tests use ephemeral fixtures (`test-access-token-not-real`, random encryption keys).

## 49–64. Tests

`tests/features/social-media/instagram-publishing-adapter.test.ts` — image, reel+poll, carousel order, story, ambiguous publish, capability/reauth, host rejection, signed delivery, scopes. OAuth URL/callback/provider regressions updated for publish scope + capabilities. B1.6 publishing domain/security tests updated for `implemented_b17_gated`.

## 65–67. Results

| Gate | Result |
| --- | --- |
| Targeted Instagram + OAuth + B1.6 publishing | PASS |
| Full Vitest | **328 files / 2310 PASS** (prior 327 / 2297) |
| typecheck | PASS |
| lint | PASS |
| build | PASS (gates OFF; secrets absent OK) |

## 68–69. Security / anti-chaos

Adversarial items mitigated: least-privilege scopes; capability from granted permissions; signed media URLs; official host allowlist; ambiguous publish non-retry; no browser success; no token on Publication; no public bucket; no analytics/community; no second engine; Instagram logic in adapter package.

Anti-chaos: Instagram-specific Publication table ABSENT; raw Meta payload SoT ABSENT; token logged ABSENT; production gate enabled ABSENT; real provider mutation ABSENT.

## 70–77. Production

| Item | Status |
| --- | --- |
| Schema migration | **Not required / not applied** — tip remains `20260815202145` |
| App deployment | Code push to branch; Vercel deploy follows repo governance (gates OFF) — no live publish path without gate+secrets+worker |
| Publications/attempts/connections/content rows | **0** |
| Instagram client id/secret | Not provisioned by this phase (masked absent as prior) |
| Encryption key | Not configured (prior) |
| Media delivery signing secret | Not configured |
| Connection / publishing gates | **OFF** |
| App Review | `PROVIDER VERIFICATION / OWNER ACTION REQUIRED` |
| Controlled live publish | **NOT EXECUTED** |

## 78. Residual risks / owner actions

1. Provision Instagram App credentials + App Review Advanced Access for `instagram_business_content_publish`.  
2. Configure `SOCIAL_CREDENTIAL_ENCRYPTION_KEY`.  
3. Configure `SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET` + private media byte source/storage.  
4. Enable connection + publishing gates only with explicit owner authorization.  
5. Explicit owner authorization before any controlled Production publish verification.  
6. Existing connections (if any later) need reauthorization for publish permission.

## 79–84. Closure / Git / next

| Field | Value |
| --- | --- |
| Implementation | `ebc6745be7d8dc7540fd7dbb1b47b400e5878957` — `feat(smm): add instagram vertical publishing adapter` |
| Evidence | _(this commit)_ — `docs(smm): close B1.7 instagram publishing integration` |
| Migration | `NO DATABASE MIGRATION REQUIRED FOR SMM-B1.7` |

Evidence path: this file.

```text
SMM-B1.8 NOT YET AUTHORIZED
```
