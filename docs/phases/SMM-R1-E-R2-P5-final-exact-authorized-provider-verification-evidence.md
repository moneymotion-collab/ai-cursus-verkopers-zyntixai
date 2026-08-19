# SMM-R1-E-R2-P5 — Final Exact-Authorized Provider Verification — Evidence

| Field | Value |
| --- | --- |
| Phase | **SMM-R1-E-R2-P5 — Final Exact-Authorized Provider Verification** |
| Date | 2026-08-19 |
| Formal status | `SMM-R1-E-R2-P5 CLOSED WITH EVIDENCE — FINAL EXACT AUTHORIZED INSTAGRAM PROVIDER WRITE VERIFIED` |
| Parent | **SMM-R1-E-R2** → **CLOSED** (see §18) |
| Grandparent | **SMM-R1-E** → **CLOSED** (see §19) |
| R1-F | **MUST NOT START** |
| Production project | `dmctinrcjvsgmoxwwodw` |

```text
SMM-R1-E-R2-P5 CLOSED WITH EVIDENCE — FINAL EXACT AUTHORIZED INSTAGRAM PROVIDER WRITE VERIFIED
SMM-R1-E-R2 CLOSED WITH EVIDENCE — CONTROLLED PROVIDER FAILURE ROOT-CAUSE VERIFICATION COMPLETE; READINESS-HARDENED EXACT AUTHORIZED WRITE SUCCEEDED
ROOT CAUSE PROVEN AND FIXED — MEDIA_PUBLISH WAS CALLED BEFORE CONFIRMED CONTAINER READINESS
SMM-R1-E CLOSED WITH EVIDENCE — FIRST CLOSED-BETA PUBLISHING ENTITLEMENT & EXACT SINGLE PROVIDER-WRITE CONTROL VERIFIED
```

---

## 1. Authoritative baseline

### Git (Stage 1 start)

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `420dba2f1493a797a946f27e46ca5405aa548519` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| P4 implementation | `e1c30b9` |
| P4 evidence | `4f67a04` (+ docs through `420dba2`) |

### Phase state entering P5

| Phase | Status |
| --- | --- |
| R1-E-R1 | CLOSED |
| R1-E-R2-P2 | CLOSED |
| R1-E-R2-P4 | CLOSED |
| R1-E-R2 | ACTIVE |
| R1-E | BLOCKED |

### Pre-Execute Production

| Check | Result |
| --- | --- |
| P4 OFF deploy | `dpl_H5ou7jyJ7kuQpPUrW3dAs3DSMmza` Ready on www |
| `SOCIAL_PUBLISHING_ENABLED` | false (until Stage 2 ON window) |
| publishing GUC | null/unset |
| `exec_at_rest` | false |
| enrollments | 1 · `publishing_allowed` |
| Instagram | connected / healthy / credential / `publish_image` / no reauth |
| provider-write delta before P5 Execute | 0 (attempts **4**) |

---

## 2. Fresh P5 publication

| Field | Value |
| --- | --- |
| publication_id | `23821fb0-81e9-42a8-b1fe-96a91b7a8e3f` |
| organization_id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| workspace_id | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` |
| provider | `instagram` |
| format | `image` |
| created_at | `2026-08-19 11:01:56.801808+00` |
| pre-Execute status | `queued` · attempts **0** · external id absent · no lease |
| media | JPEG 1254×1254 · `ready` · byte_size 293906 · org/workspace match |
| UI = DB = Activity UUID | exact match; not a historical reuse |

---

## 3. P4 readiness fix live

| Check | Result |
| --- | --- |
| Deployed code | IMAGE path uses `waitReady` / `waitForInstagramContainerFinished` before `media_publish` |
| Bounds | 60s interval · max 5 attempts · no infinite loop · no fixed-sleep-only |
| `media_publish` max | **1** per Execute |
| Pre-Execute live proof | deploy `dpl_H5ou7jy…` / later ON `dpl_6BqGs4yx…` include P4 |

---

## 4. Controlled window (Stage 1 bind)

| Field | Value |
| --- | --- |
| path | `operator_open_social_controlled_publish_window` |
| controlled_window_id | `3c1d9f10-e291-44d8-97aa-de32e1131586` |
| authorized publication | `23821fb0-81e9-42a8-b1fe-96a91b7a8e3f` |
| max_execute_count | 1 |
| pre-Execute | `active` · `consumed_execute_count=0` |
| authorized_at | `2026-08-19 11:35:35.914238+00` |

---

## 5. Exact UUID binding

| Layer | UUID |
| --- | --- |
| Owner-authorized / UI | `23821fb0-81e9-42a8-b1fe-96a91b7a8e3f` |
| Window `publication_id` | `23821fb0-81e9-42a8-b1fe-96a91b7a8e3f` |
| Executed publication | `23821fb0-81e9-42a8-b1fe-96a91b7a8e3f` |
| `execute_consumed` requested | `23821fb0-81e9-42a8-b1fe-96a91b7a8e3f` |

**PASS** — requested == server-authorized == successfully executed.

Domain bind pre-Execute: A → `ok_authorized_match`.

---

## 6. Mismatch proof (Stage 1)

| Check | Result |
| --- | --- |
| B | `ae6caf94-2fc7-4653-a085-0228d32e0c53` |
| DB | `publication_not_authorized_for_window` |
| B attempts delta | 0 |
| window after deny | still active · consumed 0 · authorized UUID unchanged |
| audit | `execute_denied_mismatch` |

---

## 7. Prepare lock (Stage 1)

| Check | Result |
| --- | --- |
| domain | Prepare blocked while window active |
| action | `controlled_window_prepare_blocked` |
| org_pubs during bind | unchanged (11) |
| retarget | impossible (DB authoritative) |

---

## 8. Owner authorization

| Field | Value |
| --- | --- |
| authorization | R1-E-R2-P5 FINAL EXACT SINGLE PROVIDER-WRITE EXECUTION |
| organization_id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| publication_id | `23821fb0-81e9-42a8-b1fe-96a91b7a8e3f` |
| controlled_window_id | `3c1d9f10-e291-44d8-97aa-de32e1131586` |
| max_execute_count | 1 |
| owner_will_click_execute | true |
| owner_execute_count | **1** |
| owner visible | Outcome **succeeded** · external id present · Publication ID exact |

Agent did **not** Execute.

---

## 9. ON deployment

| Field | Value |
| --- | --- |
| env change | Production **only** `SOCIAL_PUBLISHING_ENABLED=true` |
| ON deploy | `dpl_6BqGs4yxUmiB7dSZFGBD9jXvgpYm` |
| URL | `https://zyntixai-7zqh1oyuv-guus-projects-ai.vercel.app` |
| alias | `https://www.zyntixai.com` |
| readyState | READY |
| post-ON window | still active · consumed 0 · UUID unchanged |
| post-ON target | still queued · attempts 0 |
| provider write from enable alone | **0** |

---

## 10. Single owner Execute

| Field | Value |
| --- | --- |
| attempt_id | `b18e6579-c7a0-432d-b687-57c872cd3577` |
| attempt_number | 1 |
| started_at | `2026-08-19 11:43:20.72354+00` |
| finished_at | `2026-08-19 11:44:32.7778+00` |
| duration | **~72.05 s** |
| outcome | `succeeded` |
| failure_class | null |
| retryable | false |
| publication status | `succeeded` |
| target attempts | **exactly 1** |
| external publication id | **present** (value not printed) |
| unknown_external_outcome | false |
| second attempt / auto retry | **none** |

Success-path R1-E-R1 diagnostic columns remain null (failure-only persistence); Graph error fields empty/null as expected.

Window audit `execute_consumed`:

- `publication_id` = `23821fb0-…`
- `requested_publication_id` = `23821fb0-…`
- `consumed_execute_count` = 1
- timestamp equals attempt `started_at`

---

## 11. Readiness polling sequence (P4)

Deployed IMAGE adapter sequence (authoritative code on ON deploy):

1. `create_container`
2. poll `container_status` via `waitForInstagramContainerFinished`
3. require **FINISHED** / **PUBLISHED** (`finishedConfirmed=true`) before proceed
4. `media_publish` exactly once

Durable runtime evidence for this successful attempt:

| Observation | Evidence |
| --- | --- |
| Wall-clock duration | **~72 s** (11:43:20 → 11:44:32) |
| Poll interval | **60 s** |
| Inference | First status was **not** immediately FINISHED; ≥1 inter-poll sleep occurred → **≥2** `container_status` polls |
| FINISHED/PUBLISHED before `media_publish` | **Required** for success under P4; success + ~72 s timing corroborates confirmed readiness before publish |
| `media_publish` call count | **exactly 1** (single succeeded attempt; no duplicate attempt; adapter invokes publish once after wait) |
| Contrast with P3 | P3 skipped wait → fast `media_publish` 4xx (9007/2207027); P5 waited then succeeded |

Structured failure diagnostics N/A on success (null provider_step fields).

---

## 12. Provider result

| Field | Value |
| --- | --- |
| outcome | succeeded |
| external id present | yes (value withheld) |
| provider Graph errors | null |
| request/response diagnostic columns | null on success path (by design) |
| provider-write delta | **+1** |

---

## 13. One-shot consumption

| Field | Value |
| --- | --- |
| window_id | `3c1d9f10-e291-44d8-97aa-de32e1131586` |
| authorized UUID | unchanged `23821fb0-…` |
| max_execute_count | 1 |
| consumed_execute_count | **1** |
| status | **consumed** |
| consumed_at | `2026-08-19 11:43:20.72354+00` |
| second Execute | not permitted (window exhausted) |
| auto-reopen | none · `active_windows=0` |

---

## 14. Immediate OFF restoration

| Field | Value |
| --- | --- |
| action | `SOCIAL_PUBLISHING_ENABLED=false` + Production redeploy **before** extended docs |
| OFF deploy | `dpl_GG5cBX3DL5nUqU1A8Tbf4Qj2kct7` |
| URL | `https://zyntixai-r7evq2luj-guus-projects-ai.vercel.app` |
| alias | `https://www.zyntixai.com` |
| readyState | READY |
| env pull | `SOCIAL_PUBLISHING_ENABLED="false"` |
| publishing GUC | null/unset |
| `exec_at_rest` | false |
| Execute | unavailable again (global OFF) |

---

## 15. Production deltas

| Metric | Before (Stage 1 gate) | After Execute + OFF |
| --- | --- | --- |
| org publications | 11 | 11 |
| queued | 7 | 6 |
| succeeded | 2 | 3 |
| manual_intervention | 2 | 2 |
| total attempts | 4 | **5** |
| target attempts | 0 | **1** |
| publications with external id | 2 | **3** |
| provider-write delta | 0 | **+1** |
| active controlled windows | 1 | **0** |
| consumed controlled windows | 1 | **2** |
| enrollments | 1 | 1 |
| enrollment events | 2 | 2 |

Target: `queued` → `succeeded`; external id absent → present; window consumed 0 → 1. No duplicate write.

---

## 16. Unauthorized-publication preservation

Zero new attempts for non-targets (attempt_count unchanged):

| Publication | Status / attempts |
| --- | --- |
| `cd493386-…` | manual_intervention / 1 (historical P3) |
| `0ffb466f-…` | queued / 0 |
| `ae6caf94-…` | queued / 0 |
| `1f1fa14e-…` | succeeded / 1 (incidental historical) |
| `bdd8a0dc-…` | manual_intervention / 1 |
| `f584f4bb-…` | queued / 0 |
| `040e15f3-…` | queued / 0 |
| `1714161a-…` | queued / 0 |
| `9dd4f6ed-…` | queued / 0 |

**ONLY** `23821fb0-81e9-42a8-b1fe-96a91b7a8e3f` received the new Execute attempt (`b18e6579-…`).

---

## 17. Security assertions

| Assertion | Result |
| --- | --- |
| enrollment | remains `publishing_allowed` |
| enrollments count | exactly **1** |
| Owner/Admin Execute authority | preserved |
| Prepare blocked during active window | PASS (Stage 1) |
| mismatch protection | PASS (Stage 1 deny B) |
| server-authoritative UUID bind | PASS (exact match on consume + success) |
| global gate after Execute | **OFF** proven |
| publishing GUC at rest | false/unset |
| `exec_at_rest` | false |
| no secrets printed | PASS (no tokens / signed URLs / external id values) |

---

## 18. R1-E-R2 closure assessment

All durable conditions met:

- exact authorized target succeeded
- target attempts = exactly 1
- exactly one provider write (+1)
- readiness wait observed (~72 s; FINISHED/PUBLISHED required before `media_publish`)
- controlled window consumed exactly once
- no other publication executed
- no duplicate / no auto-retry
- binding held; Prepare locked during window
- global publishing restored OFF

```text
SMM-R1-E-R2 CLOSED WITH EVIDENCE — CONTROLLED PROVIDER FAILURE ROOT-CAUSE VERIFICATION COMPLETE; READINESS-HARDENED EXACT AUTHORIZED WRITE SUCCEEDED
```

Historical 9007/2207027 conclusion:

```text
ROOT CAUSE PROVEN AND FIXED — MEDIA_PUBLISH WAS CALLED BEFORE CONFIRMED CONTAINER READINESS
```

---

## 19. R1-E closure assessment

Closed-beta entitlement + exact single provider-write control verified end-to-end (enrollment, global gate, controlled window, exact UUID, one-shot consume, OFF restore).

```text
SMM-R1-E CLOSED WITH EVIDENCE — FIRST CLOSED-BETA PUBLISHING ENTITLEMENT & EXACT SINGLE PROVIDER-WRITE CONTROL VERIFIED
```

---

## 20. Git state

| Field | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Implementation SHA (P4; no P5 code change) | `e1c30b95d8073e5d3a935dd3264834024650807d` |
| Evidence commit | `5dd026b0b5c3305382e5b5cf7bbf23efdfdbef35` |
| Authoritative HEAD | `cddfeafb71bcc4d83cbec10ab283f9ec26663a80` |
| Upstream/origin | `origin/core/platform-readiness-20260707` |
| Governance | no reset / rebase / amend / force-push; `.vercel` not committed |

**STOP BEFORE R1-F.** Do not enroll another org. Do not open another provider-write window. Do not expand formats/providers.

---

## Immutable historical IDs (unchanged)

P3 fail `cd493386-…` / `13b87e93-…` / `93833c67-…` · incidental `1f1fa14e-…` · authorized-not-executed `ae6caf94-…` · earlier fail `bdd8a0dc-…` / `c2d3cef0-…` · leftovers `f584f4bb-…`, `040e15f3-…`, `1714161a-…`, `9dd4f6ed-…`, `0ffb466f-…`.
