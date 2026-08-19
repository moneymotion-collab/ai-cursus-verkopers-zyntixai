# SMM-R1-E-R2-P4 — Instagram Container Readiness Polling Hardening — Evidence

| Field | Value |
| --- | --- |
| Phase | **SMM-R1-E-R2-P4 — Instagram Container Readiness Polling Hardening** |
| Date | 2026-08-19 |
| Formal status | `SMM-R1-E-R2-P4 CLOSED WITH EVIDENCE — INSTAGRAM CONTAINER READINESS POLLING HARDENED` |
| Parent | **SMM-R1-E-R2** remains **ACTIVE / NOT CLOSED** |
| Grandparent | **SMM-R1-E** remains **BLOCKED** |
| Production project | `dmctinrcjvsgmoxwwodw` |

```text
SMM-R1-E-R2-P4 CLOSED WITH EVIDENCE — INSTAGRAM CONTAINER READINESS POLLING HARDENED
SMM-R1-E-R2 ACTIVE / NOT CLOSED — final controlled retry still required
SMM-R1-E BLOCKED — CONTROLLED PROVIDER WRITE NOT YET VERIFIED
```

---

## 1. Executive verdict

Root cause of the P3 `media_publish` Graph **9007 / 2207027** (“Media ID is not available”) was proven in code: **feed IMAGE publications skipped container readiness polling** and called `media_publish` immediately after `create_container`.

P4 makes `waitForInstagramContainerFinished` the authoritative gate for **all** formats (including IMAGE and carousel children/parent). `media_publish` runs only after provider status **FINISHED** (or **PUBLISHED**). Bounded polling; no fixed-sleep-only hack. No migration. Production deployed with publishing **OFF**. Zero Meta writes in P4.

---

## 2. Incident baseline

| Field | Value |
| --- | --- |
| organization_id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| publication_id | `cd493386-f7e9-4b87-8243-76e80cb7009f` |
| window_id | `93833c67-06be-4e5b-a590-8a25e09f569a` |
| attempt_id | `13b87e93-ca12-458c-a982-7ff229acf1fa` |
| provider_step | `media_publish` |
| HTTP | 400 |
| Graph | code **9007** · subcode **2207027** · type `oauthexception` |
| safe message | Media ID is not available |
| binding | correct authorized UUID; window consumed once |

---

## 3. Meta readiness contract

Instagram Content Publishing requires the created container/media object to be ready before `media_publish`. Status is exposed via container `status_code`. Publish only after **FINISHED**. Documented adapter vocabulary: `IN_PROGRESS`, `FINISHED`, `ERROR`, `EXPIRED`, `PUBLISHED`.

---

## 4. Existing adapter sequence (pre-P4)

1. Mint signed delivery URL  
2. `create_container`  
3. **If video/reel/story-video (or carousel video child):** `waitForInstagramContainerFinished`  
4. **If IMAGE / story image / carousel image child / carousel parent:** **skip wait**  
5. `media_publish`

Answers to discovery questions:

| # | Answer |
| --- | --- |
| 1 | Status polling existed, but **not for feed images** |
| 2 | Videos: up to 5 polls; images: **0** |
| 3 | Accepted ready: FINISHED / PUBLISHED |
| 4 | Wait path required FINISHED/PUBLISHED; image path bypassed wait |
| 5 | **Yes** — images could `media_publish` immediately |
| 6 | N/A for images (no poll); videos handled IN_PROGRESS |
| 7 | **Yes** — race between create and media availability |
| 8 | **Yes** — polling primarily for videos/reels |
| 9 | When used: maxAttempts 5 |
| 10 | Timeout → fail closed without publish (on wait path) |

Also: `waitReady` defaulted `pollIntervalMs ?? 0`, which overrode the client’s 60s Meta-aligned interval when deps omitted the value.

---

## 5. Exact root cause

```text
ROOT CAUSE PROVEN — INSTAGRAM MEDIA_PUBLISH CALLED BEFORE CONFIRMED CONTAINER READINESS
```

Feed IMAGE set `needsProcessingWait = false`, so Production Execute for `cd493386-…` went create → publish without `container_status`, matching Graph 9007/2207027.

---

## 6. Readiness polling design

`waitForInstagramContainerFinished` remains the single typed gate. Adapter now **always** calls `waitReady` after:

- every single-item container create (image / story / reel / video)
- every carousel child (image and video)
- carousel parent create

Only then: exactly one `media_publish`.

---

## 7. Status taxonomy

| Status | Behavior |
| --- | --- |
| FINISHED / PUBLISHED | proceed to media_publish |
| IN_PROGRESS | poll again within bound |
| ERROR | stop; no media_publish (`container_error`) |
| EXPIRED | stop; no media_publish (`container_expired`) |
| unknown / malformed | fail closed; no media_publish (`invalid_payload`) |
| status HTTP 4xx/401/429/5xx | fail closed; no media_publish; no uncontrolled retry |

---

## 8. Poll bounds / backoff

| Constant | Value | Rationale |
| --- | --- | --- |
| `INSTAGRAM_CONTAINER_POLL_INTERVAL_MS` | **60_000** | Meta ~1 poll/minute |
| `INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS` | **5** | ≤ ~5 minutes soft bound |
| Max sleep span | **240_000** ms (4 × 60s) | between first and last poll |
| Initial delay | **none** | immediate first status check |
| Backoff | fixed interval | no busy loop; no infinite poll |

Production adapter defaults now use these constants (not `?? 0`).

---

## 9. Media-publish gate

`media_publish` executes only after `waitReady` returns success (`finishedConfirmed: true`). Timeout/ERROR/EXPIRED/transport/unknown → **zero** `media_publish`. At most one publish call per Execute.

---

## 10. Diagnostics

`provider_step = container_status` on readiness failures. R1-E-R1 fields retained (HTTP, codes, sanitized type/message, dispatched/received). Wait result now includes `pollCount`, `elapsedMs`, `finalStatusCode`, `finishedConfirmed` for tests/evidence (not a DB migration). Secrets / signed URLs still sanitized.

---

## 11. Lifecycle classification

| Path | Classification |
| --- | --- |
| Historical attempt `13b87e93-…` | **immutable** — remains `failed_terminal` / `provider_permanent` / `instagram_http_4xx` |
| Future readiness timeout | `failed_retryable` / `timeout` / `instagram_container_poll_timeout` (existing) |
| Future ERROR/EXPIRED | existing terminal container codes |
| Future 9007 **after** FINISHED | still maps as HTTP 4xx permanent (content/provider rejection after readiness) |

No historical rewrite. No casual remapping of past 9007 semantics.

---

## 12. One-shot authorization preservation

P2 binding unchanged. Polling is internal to one Execute lifecycle. Mismatch still zero attempt. `max_execute_count=1` unchanged. Global OFF still blocks app Execute path.

---

## 13. Tests

Added/updated adapter + R1-E-R1 diagnostics coverage for:

- FINISHED immediately → one publish  
- IN_PROGRESS → FINISHED → one publish  
- timeout / ERROR / EXPIRED / unknown → zero publish  
- status HTTP 400/401/429/5xx → zero publish  
- malformed status → zero publish  
- carousel/story image wait  
- media_publish max once  

---

## 14. Regression

| Suite | Result |
| --- | --- |
| Social + publishing/lifecycle security | **29 files / 170 tests** pass |
| typecheck | pass |
| lint | pass |
| `npm run build` | pass (exit 0) |

---

## 15. Migration status

**No migration.** Adapter/client-only change.

---

## 16. Production deployment

| Item | Value |
| --- | --- |
| Deploy id | `dpl_H5ou7jyJ7kuQpPUrW3dAs3DSMmza` |
| URL | `https://zyntixai-no16yqqw7-guus-projects-ai.vercel.app` |
| Alias | `https://www.zyntixai.com` |
| readyState | **READY** |
| Git SHA | `e1c30b9` |
| `SOCIAL_PUBLISHING_ENABLED` | **false** (env pull verified) |
| Controlled window opened | **no** |

---

## 17. Global OFF proof

Preflight and post-deploy: env false · GUC unset · `exec_at_rest=false` · active windows = 0.

---

## 18. Provider-write delta

**0** during P4. Org attempts remain **4** (incident baseline).

---

## 19. Historical preservation

Untouched: `cd493386-…`, attempt `13b87e93-…`, window `93833c67-…`, plus `1f1fa14e-…`, `ae6caf94-…`, `bdd8a0dc-…`, `0ffb466f-…`, siblings/leftovers.

---

## 20. Recommendation for final controlled retry

Do **not** retry `cd493386-…`. Prefer:

1. NEW Prepare → exact UUID  
2. NEW controlled window (`max_execute_count=1`)  
3. Verify binding with global OFF  
4. Separate owner ON → Execute once → OFF  

Then evaluate R1-E-R2 / R1-E closure.

---

## 21. Git state

| Item | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Implementation SHA | `e1c30b95d8073e5d3a935dd3264834024650807d` |
| Evidence SHA | $ev |
| Authoritative HEAD | after evidence push |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence at start | `0 0` |
| Migration | none |
