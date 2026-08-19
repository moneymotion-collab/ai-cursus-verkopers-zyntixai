# SMM-R1-E-R1 — Instagram Provider 4xx Diagnostic Hardening — Evidence

| Field | Value |
| --- | --- |
| Phase | **SMM-R1-E-R1 — Instagram Provider 4xx Diagnostic Hardening** |
| Date | 2026-08-19 |
| Formal status | `SMM-R1-E-R1 CLOSED WITH EVIDENCE — INSTAGRAM PROVIDER 4XX DIAGNOSTIC HARDENING VERIFIED` |
| Parent phase | **SMM-R1-E** remains **BLOCKED** |
| Production project | `dmctinrcjvsgmoxwwodw` |

```text
SMM-R1-E-R1 CLOSED WITH EVIDENCE — INSTAGRAM PROVIDER 4XX DIAGNOSTIC HARDENING VERIFIED
SMM-R1-E BLOCKED — CONTROLLED PROVIDER WRITE NOT YET VERIFIED
```

---

## 1. Incident baseline

| Field | Value |
| --- | --- |
| organization_id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| publication_id | `bdd8a0dc-936d-419a-ac35-4a5d8801fc27` |
| attempt_id | `c2d3cef0-9e22-4595-bb02-64ec3b76adfc` |
| publication status | `manual_intervention` |
| attempt outcome | `failed_terminal` |
| failure_class | `provider_permanent` |
| retryable | `false` |
| safe_error_code | `instagram_http_4xx` |
| unknown_external_outcome | `false` |
| external publication id | absent |
| provider boundary | reached (definitive Graph rejection) |
| failing step | **unknown at incident time** |
| Graph code/subcode | **unknown at incident time** |

Safety at phase start/end:

- `SOCIAL_PUBLISHING_ENABLED` remains **false** (Production)
- publishing GUC unset · `private.social_publishing_execution_enabled()` = **false**
- enrollment = `publishing_allowed` · enrollments = **1**
- no automatic retry
- historical queued publications untouched
- **zero** Meta publishing writes during R1-E-R1

---

## 2. Current observability gap (pre-hardening)

Both `createInstagramMediaContainer` and `publishInstagramMediaContainer` failures flowed through a shared mapper (`mapCreateFailure` → `mapInstagramHttpFailure` reason `non_2xx`) that collapsed generic Graph 4xx (not 401/403/429) into a single safe code:

`instagram_http_4xx`

Client already extracted `providerErrorCode` / `providerErrorSubcode` on non-2xx, but:

- no `provider_step` was attached;
- codes were dropped before adapter result / attempt persistence;
- attempt table only stored `safe_error_code`;
- no sanitized message/type;
- no request-dispatched / response-received / container-id-presence flags.

Therefore R1-E could not answer: *which Instagram operation failed, with which Graph status/code?*

---

## 3. Provider execution sequence (IMAGE)

1. Preflight (capability, connection, optional quota GET — not a publish mutation)
2. Mint signed media delivery URL (local; never logged)
3. **`create_container`** — `POST /{ig-user-id}/media`
4. (video/reel/story video only) **`container_status`** — poll `status_code`
5. **`media_publish`** — `POST /{ig-user-id}/media_publish`
6. Persist attempt completion via `b18_complete_controlled_publication_attempt` → `private.complete_social_publication_attempt`

Lifecycle mapping for definitive `provider_permanent` remains: attempt `failed_terminal` → publication `manual_intervention`.

---

## 4. Provider-step taxonomy

Typed steps (only those that exist):

| Step | External operation |
| --- | --- |
| `create_container` | Graph media container create |
| `container_status` | Graph container status poll |
| `media_publish` | Graph media_publish |

---

## 5. Safe diagnostic contract

Persistable / loggable fields:

- `provider_step`
- `provider_http_status`
- `provider_error_code`
- `provider_error_subcode`
- `provider_error_type` (sanitized)
- `safe_provider_message` (sanitized or null)
- `provider_request_dispatched`
- `provider_response_received`
- `external_container_id_present` (presence-only)
- boundary state: `never_attempted` \| `dispatched` \| `response_received` \| `definitive_rejection` \| `ambiguous_transport` \| `external_id_returned`

Adapter failure result optionally includes `providerDiagnostics` (`SocialPublishingProviderDiagnostics`).

---

## 6. Secret-redaction guarantees

Never persist or log:

- access tokens / Authorization headers
- client secrets / encryption keys / Supabase secrets
- signed media delivery URLs or query signatures
- raw provider response bodies
- complete request bodies with credentials

Message sanitizer rejects tokens, bearer material, URLs, query credential patterns, and oversized/control-character text. Prefer numeric Graph codes over messages.

Server log event: `instagram_provider_diagnostic` (JSON, safe fields only).

---

## 7. Persistence / data model

Additive nullable columns on `public.social_publication_attempts`:

- `provider_step`, `provider_http_status`, `provider_error_code`, `provider_error_subcode`
- `provider_error_type`, `safe_provider_message`
- `provider_request_dispatched`, `provider_response_received`, `external_container_id_present`

Migration:

`supabase/migrations/20260819101500_add_social_instagram_provider_4xx_diagnostic_hardening.sql`

Extended completion RPCs (optional diagnostic params with defaults):

- `private.complete_social_publication_attempt(...)`
- `public.b18_complete_controlled_publication_attempt(...)`

Safe diagnostic keys also appended to lifecycle event JSON on completion (strip-nulls).

Historical rows remain readable with **null** diagnostics.

---

## 8. Failure mapping preservation

No lifecycle classification changes:

| Condition | Unchanged outcome |
| --- | --- |
| Graph 400 (generic 4xx) | `failed_terminal` / `provider_permanent` / `instagram_http_4xx` / non-retryable |
| Graph 401/403 | `instagram_http_unauthorized` |
| Graph 429 | retryable rate limit |
| Graph 5xx | retryable provider_temporary |
| media_publish timeout/network after dispatch | `unknown_external_outcome` (ambiguous) |

No classification bug found that required semantic change.

---

## 9. Tests

| Suite | Result |
| --- | --- |
| `instagram-provider-4xx-diagnostics.test.ts` | **11 passed** |
| `instagram-publishing-adapter.test.ts` | **13 passed** |
| `social-publishing-migration-security.test.ts` | **8 passed** |
| `social-lifecycle-b19-migration-security.test.ts` | **7 passed** |
| R1 closed-beta surface/domain/security tests | **25 passed** |
| `npm run typecheck` | **pass** |
| `npm run lint` | **pass** (0 warnings/errors) |
| `npm run build` (isolated) | **pass** |

Diagnostic coverage includes: create 400/403, publish 400/403, unauthorized, rate-limit, 5xx, malformed JSON, secret/URL non-persistence, step identity, non-retryable terminal, ambiguous transport, historical-shaped failures without invented diagnostics.

---

## 10. Production safety verification

| Check | Result |
| --- | --- |
| `SOCIAL_PUBLISHING_ENABLED` | remains Production env (value **false**; not re-enabled this phase) |
| `private.social_publishing_execution_enabled()` | **false** |
| GUC `app.social_publishing_execution_enabled` | unset |
| Meta provider write this phase | **0** |
| Execute on `bdd8a0dc-…` | **not performed** |
| Enrollment count | **1** · `publishing_allowed` |
| Incident publication | still `manual_intervention` |
| Incident attempt diagnostics | all new columns **null** (honest history) |
| Diagnostics deploy (gate still OFF) | `zyntixai-awl3rmhv2…` **Ready** → `www.zyntixai.com` |

Production schema verified: diagnostic columns present; complete RPCs accept additive diagnostic args.

---

## 11. Read-only root-cause findings

Local evidence for incident publication (no signed URL exposure, no provider mutation):

| Check | Observation |
| --- | --- |
| MIME | `image/jpeg` |
| Dimensions | 1254×1254 |
| Byte size | 460410 |
| processing_state | `ready` |
| media_snapshot | length 1, image, asset bound |
| caption length | 62 |
| connection | `connected` + `healthy`, reauth **false** |
| capability | `publish_image` present |
| Delivery URL contract | HMAC-signed `/api/social/media-delivery` (structurally valid in code) |

```text
ROOT CAUSE NOT YET PROVEN — NEXT CONTROLLED ATTEMPT WILL PROVIDE STRUCTURED PROVIDER DIAGNOSTICS
```

---

## 12. Migration status

| Item | Status |
| --- | --- |
| Local migration file | present |
| Production columns | applied |
| Production complete RPCs | applied (additive diagnostics) |
| Historical attempt rewrite | **none** |

---

## 13. Git state

| Item | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Implementation SHA | `e82eff9c8406bb7afc8924b426d949ed56227780` |
| Evidence SHA | 88cd93da4cf42680491fcb6466d97618f2a087f0 |
| Upstream | `origin/core/platform-readiness-20260707` |
| Worktree | clean after push |

---

## 14. Recommendation for resuming R1-E

```text
NEXT: SMM-R1-E-R2 — CONTROLLED PROVIDER FAILURE ROOT-CAUSE VERIFICATION
```

Requires:

- a **new** publication (do not retry `bdd8a0dc-…`);
- new explicit owner authorization;
- `max_execute_count=1`;
- global gate OFF before and after;
- Production app deploy containing R1-E-R1 diagnostics already live (`zyntixai-awl3rmhv2…` aliased to www; confirm before Execute).

Do **not** start R1-F.
