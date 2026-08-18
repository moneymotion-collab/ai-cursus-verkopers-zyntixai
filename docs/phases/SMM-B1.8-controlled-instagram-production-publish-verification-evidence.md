# SMM-B1.8 — Controlled Instagram Production Publish Verification — Evidence

**Phase:** `SMM-B1.8 — Controlled Instagram Production Publish Verification`  
**Date opened:** 2026-08-18  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw`  
**Scope note:** This phase is the **deferred B1.7 live Instagram provider-write verification**, owner-authorized after R1 OAuth connect success. It is **not** Analytics / AI Optimization / Cross-Platform Repurposing.

---

## 1. Executive verdict (this stop)

```text
SMM-B1.8 OPENED — PRE-PUBLISH GATE ONLY
NO LIVE INSTAGRAM PROVIDER WRITE EXECUTED
SOCIAL_PUBLISHING_ENABLED MUST REMAIN OFF
OWNER ACTION REQUIRED — PRE-PUBLISH ATTESTATIONS + TEST ASSET
```

This stop defines the smallest safe single-publication test and the owner steps that must complete **before** any publishing-gate enablement. Cursor must **not** perform a live publish in this stop.

---

## 2. Binding prior evidence (preserved)

| Prior phase | Verdict retained |
| --- | --- |
| SMM-B1.6 | Publication / Attempt / Event / claim / idempotency / `unknown_external_outcome` foundation |
| SMM-B1.7 | Instagram publishing adapter implemented; Production publish **not** executed |
| SMM-B1.7-R1 | OAuth connection verified (`social_oauth=connected`); publishing remained OFF |

R1 evidence file is **not** rewritten historically. Pending `authorization_pending` rows are **retained** (not deleted).

---

## 3. Git / Production baseline (pre-publish)

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD / upstream | `b2dba714ac01cc80f542e5fc58b6b2fadfb44428` (aligned) |
| Production runtime SHA (alias tip) | `ff49a9a54f3d24f33febd6ba70c9a976d2562e8c` (OAuth identity fix; docs-only `b2dba71` not required for publish runtime) |
| Worktree | clean except ignored `.vercel/` |
| Live publish executed? | **No** |

---

## 4. Production DB / connection / credential / capability verification (opaque)

Verified 2026-08-18 against Production `dmctinrcjvsgmoxwwodw` (no tokens, codes, secrets, or provider bodies logged):

| Object | Count / status |
| --- | --- |
| Brands | 1 |
| Workspaces | 1 |
| Connections total | 7 |
| Connections `connected` | **1** (`instagram` / `instagram_login`) |
| Connections `authorization_pending` | **6** (historical R1 evidence — **do not delete**) |
| Credentials (private ciphertext present) | **1** |
| Connected professional account type | `business` |
| Connected health | `healthy` |
| Token expiry in future | yes |
| Reauthorization flagged | no |
| Capability snapshot | `publish_image`, `publish_video`, `publish_carousel`, `publish_short`, `publish_story` |
| Content items | **0** |
| Media assets | **0** |
| Publications | **0** |
| Publication attempts | **0** |

```text
TARGET ACCOUNT RULE: use the single verified connected Instagram Professional test account only.
Do not reconnect, do not target pending rows, do not use any other Instagram account.
```

---

## 5. Smallest safe single-publication test (defined; not executed)

### 5.1 Chosen format

| Decision | Choice | Why |
| --- | --- | --- |
| Format | **Single feed IMAGE** | Simplest Instagram Login path; capability `publish_image` present |
| Out of first write | Stories, carousel, video, Reel/short | Higher container/poll complexity; not required for first provider-write proof |
| Materialization | `immediate` Publication (no schedule slot) | Smallest path; avoids calendar coupling |
| Volume | **Exactly one** Publication / one Attempt | Controlled verification |
| Caption | Short fixed test caption (no tags/products/location) | Least privilege / least surprise |

### 5.2 Provider path (Instagram Login / `graph.instagram.com` / pinned `v26.0`)

1. Preflight connection + `publish_image` + media snapshot  
2. Mint short-lived HMAC media-delivery URL from private bucket  
3. `POST /{IG_ID}/media` with `image_url` (+ optional caption)  
4. `POST /{IG_ID}/media_publish` with `creation_id`  
5. Persist opaque external media id on success only  

Official refs:

- [Content Publishing (Instagram Login)](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/)
- [IG User Media](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/)

### 5.3 Required domain objects (must exist before gate ON)

| Object | Required for first test |
| --- | --- |
| Org + Owner/Admin actor | yes (existing) |
| Brand + Workspace | yes (existing R1) |
| Connected Instagram connection + encrypted credential | yes (existing R1) |
| Content item + Instagram `image` variant | **missing — must create** |
| Immutable variant version + frozen `media_snapshot` | **missing — must create** |
| Media asset in private bucket `zyntix-social-media` | **missing — must create** |
| Workflow approval → `workflow_ready` | **missing — must create** (workspace default requires approval) |
| Publication row (`immediate`) | create only after objects ready; **execution** only after gate ON |
| Controlled executor (claim → adapter → complete) | **missing in Production surface** — must be implemented before live write |

### 5.4 Honest implementation gap (blocking live write)

B1.6/B1.7 provide RPCs + Instagram adapter, but Production currently has:

- **no** Owner/Admin controlled single-publish UI/action for B1.8  
- **no** checked-in worker loop that sets Postgres GUCs and runs claim/start/adapter/complete  

```text
NO AUTOMATIC PUBLISHING
NO LIVE PUBLISH IN THIS STOP
SOCIAL_PUBLISHING_ENABLED STAYS OFF UNTIL EXPLICIT FINAL OWNER ACTION
```

Cursor next implementation (after owner pre-publish attestations) must add a **minimal, fail-closed, Owner/Admin-gated** controlled publish path for this single IMAGE test — still without enabling the Production publishing env until the final owner action below.

---

## 6. Exact test asset requirements

Prefer one JPEG that satisfies **both** Meta Instagram image specs and Zyntix private-bucket allowlisting.

### 6.1 Meta Instagram feed image (provider)

| Requirement | Value |
| --- | --- |
| Format | **JPEG only** (no MPO/JPS; PNG/WebP not for provider publish) |
| Max file size | **≤ 8 MB** |
| Aspect ratio | between **4:5** and **1.91:1** |
| Width | **320–1440 px** (recommended ~1080 px wide) |
| Color space | sRGB |
| Hosting at publish time | HTTPS URL Meta can fetch (Zyntix HMAC media-delivery URL; bucket stays private) |

Recommended safe asset: **1080×1350** (4:5) or **1080×1080** (1:1) baseline JPEG, sRGB, &lt; 2 MB.

### 6.2 Zyntix private storage

| Requirement | Value |
| --- | --- |
| Bucket | `zyntix-social-media` (`public=false`) |
| MIME for this test | `image/jpeg` (or `image/jpg`) |
| Object key | `{organizationId}/...` path-safe |
| Bucket size limit | ≤ 100 MB (Meta 8 MB is the tighter limit for this test) |
| Delivery | `GET /api/social/media-delivery/[token]` only; TTL 3600s; purpose `instagram_provider_fetch` |

### 6.3 Content / caption constraints for first write

| Field | Value |
| --- | --- |
| Content format | `image` |
| Media category in snapshot | `image` |
| Caption | e.g. `ZYNTIXAI B1.8 controlled publish verification — safe to delete` |
| Not included | Stories, carousel children, video, product/location/user tags, paid partnership |

---

## 7. Fail-closed gates (must stay OFF until final owner action)

| Gate | Current required state until final owner action |
| --- | --- |
| `SOCIAL_PUBLISHING_ENABLED` | **OFF** / unset / not `true` |
| Postgres `zyntix.social_publishing_enabled` | not enabled for live claim/start |
| Postgres `zyntix.social_publication_worker` | not enabled for live claim/start |
| Connection gates | remain ON (already verified for R1) |
| Automatic schedulers / cron publish | **none** / do not add silent auto-publish |

Creating content/media/approval/publication **rows** may occur while the publishing execution gate stays OFF. Provider HTTP write must not occur until the final owner enablement reply.

---

## 8. Rollback / failure handling (defined before any write)

| Situation | Handling |
| --- | --- |
| Preflight / validation / media delivery failure | Fail closed; no `media_publish`; Publication/Attempt marked failed class; **no** Instagram post |
| Container create fails | Fail closed; safe to stop; no publish |
| Ambiguous outcome after `media_publish` dispatched (timeout/network) | Status/outcome **`unknown_external_outcome`**; **no automatic retry**; owner inspects Instagram test account manually |
| Hard provider error before proven media id | Terminal/retryable per B1.6 taxonomy; no blind duplicate publish |
| Success | Exactly one Publication `succeeded` + Attempt success; opaque external id stored; **no** second publish in B1.8 unless re-authorized |
| Instagram-side cleanup | Owner may delete the test post in Instagram UI; Zyntix does **not** auto-delete provider media |
| Evidence rows | Keep R1 pending connections + B1.8 publication/attempt rows; **do not delete** the 6 `authorization_pending` rows |
| Abort mid-phase | Leave `SOCIAL_PUBLISHING_ENABLED` OFF; stop; record opaque evidence |

There is **no** true provider undo API in this path. Rollback = stop further writes + gate OFF + retain audit rows.

---

## 9. Opaque audit / evidence rules

Do **not** log or share:

- access tokens, refresh material, authorization codes  
- client secrets, encryption/signing/storage keys  
- full Meta request/response bodies  
- raw media bytes in chat  

Do record:

- publication / attempt counts and statuses  
- failure class / opaque codes  
- whether external id present (boolean)  
- capability/connection health flags  
- gate state before/after  

---

## 10. Pre-publish readiness matrix

| Gate | Status |
| --- | --- |
| R1 OAuth connected on dedicated Professional test account | **PASS** |
| Encrypted credential present | **PASS** |
| `publish_image` capability present | **PASS** |
| Historical pending rows retained | **PASS** (6) |
| Publications / attempts still zero | **PASS** |
| Publishing execution gate OFF | **REQUIRED / PASS until final owner action** |
| Test JPEG prepared to Meta + bucket specs | **OWNER ACTION** |
| Meta App Review / Advanced Access for publish permission | **OWNER ATTEST** |
| Content + media + approval objects | **NOT READY** (0/0) |
| Controlled single-publish executor surface | **NOT READY** |
| Live provider write | **NOT AUTHORIZED YET** |

---

## 11. OWNER ACTION REQUIRED — PRE-PUBLISH (no gate enablement yet)

```text
OWNER ACTION REQUIRED — B1.8 PRE-PUBLISH ATTESTATIONS
```

Complete **all** of the following. Do **not** set `SOCIAL_PUBLISHING_ENABLED=true` yet.

1. Confirm the Instagram account that will receive the post is the **same** Professional Business test account already connected in R1 (no new OAuth unless Cursor later requests reauth for a documented reason).  
2. Confirm Meta App Dashboard: Instagram Login app has **Advanced Access** (or otherwise Production-eligible access) for `instagram_business_content_publish` for this test app/user path.  
3. Prepare **one** test JPEG meeting §6 (prefer 1080×1080 or 1080×1350, sRGB, ≤8 MB). Keep the file ready for upload via the forthcoming B1.8 controlled surface (do not paste bytes/secrets into chat).  
4. Confirm Production secrets remain configured (names only; do not paste values):
   - `SOCIAL_CREDENTIAL_ENCRYPTION_KEY`
   - `SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET`
   - `SOCIAL_PRIVATE_MEDIA_STORAGE_KEY`
   - Instagram client id/secret/redirect (already used for R1)
5. Keep **`SOCIAL_PUBLISHING_ENABLED` OFF**.  
6. Reply exactly:

```text
B1.8 PRE-PUBLISH ATTESTATIONS READY
TEST JPEG READY
PUBLISHING REMAINS OFF
```

What must **not** be shared: passwords, tokens, codes, client secret, encryption/signing/storage keys, full provider payloads.

### What Cursor will do after that reply (still no live publish until final gate action)

1. Implement the minimal Owner/Admin-gated B1.8 controlled IMAGE publish surface + fail-closed executor wiring.  
2. Seed/upload path for the single test JPEG into private storage + content/version/approval/publication materialization.  
3. Run targeted tests + typecheck/lint/build; commit/push; give Production deploy instructions.  
4. Re-verify opaque DB state; keep publishing OFF.  
5. Only then issue **`OWNER ACTION REQUIRED — ENABLE SOCIAL_PUBLISHING_ENABLED FOR ONE CONTROLLED IMAGE PUBLISH`** with exact Vercel/GUC steps.  
6. After owner enables + redeploys and replies with the enablement attestation, execute **exactly one** controlled IMAGE publish and record opaque evidence.

---

## 12. Final owner enablement (preview only — do not do this yet)

Future exact action (issued later, not now):

1. Set Production `SOCIAL_PUBLISHING_ENABLED=true`.  
2. Ensure worker/runtime sets `zyntix.social_publishing_enabled=true` and `zyntix.social_publication_worker=on` only for the controlled executor path.  
3. Redeploy Production.  
4. Reply with the enablement attestation string Cursor will specify.  
5. Cursor runs **one** IMAGE publish verification, then instructs gate **OFF** again unless owner re-authorizes.

Until that future instruction is issued: **do nothing to enable publishing.**

---

## 13. Next boundary

```text
SMM-B1.8 PRE-PUBLISH GATE PUBLISHED — AWAITING OWNER ATTESTATIONS
NO LIVE PROVIDER WRITE
ANALYTICS / AI OPTIMIZATION / REPURPOSING STILL OUT OF SCOPE
```

---

## External-effects ledger (this stop)

```text
REAL INSTAGRAM OAUTH AUTHORIZATIONS: unchanged from R1 (no new OAuth this stop)
REAL INSTAGRAM CONNECTIONS CREATED: unchanged (1 connected + 6 pending retained)
REAL PROVIDER TOKENS RECEIVED: unchanged (1 encrypted credential)

LIVE INSTAGRAM READ API CALLS: 0 this stop
LIVE INSTAGRAM WRITE API CALLS: 0
LIVE MEDIA CONTAINERS CREATED: 0
LIVE MEDIA PUBLISH CALLS: 0

REAL IMAGE POSTS PUBLISHED: 0
REAL VIDEO/REEL POSTS PUBLISHED: 0
REAL CAROUSELS PUBLISHED: 0
REAL IMAGE STORIES PUBLISHED: 0
REAL VIDEO STORIES PUBLISHED: 0

DUPLICATE POSTS CREATED: 0
FAILED/AMBIGUOUS REAL PUBLICATIONS: 0

CONNECTION GATE FINAL STATE: ON (R1)
PUBLISHING GATE FINAL STATE: OFF
```
