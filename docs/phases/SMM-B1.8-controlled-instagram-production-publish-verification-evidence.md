# SMM-B1.8 — Controlled Instagram Production Publish Verification — Evidence

**Phase:** `SMM-B1.8 — Controlled Instagram Production Publish Verification`  
**Date opened:** 2026-08-18  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw`  
**Scope note:** This phase is the **deferred B1.7 live Instagram provider-write verification**, owner-authorized after R1 OAuth connect success. It is **not** Analytics / AI Optimization / Cross-Platform Repurposing.

---

## 1. Executive verdict (this stop)

```text
SMM-B1.8 CLOSED WITH EVIDENCE
CONTROLLED INSTAGRAM IMAGE PUBLISH VERIFIED
PUBLISHING GATE OFF (OWNER-ATTESTED)
NO FURTHER PROVIDER WRITES AUTHORIZED
```

### Final Production verification (opaque)

| Check | Result |
| --- | --- |
| Succeeded publications | **1** (`640009e7-ca0e-4a6c-822c-f72d9e512569`) |
| Succeeded attempts | **1** (no additional attempts after gate-off) |
| Queued leftovers retained | 3 |
| Connected Instagram | 1 |
| R1 `authorization_pending` leftovers | **6 retained** (not deleted) |
| External publication id on success | present (value not logged) |
| Provider / format | `instagram` / `image` |

### Owner gate-off attestation (2026-08-18)

```text
B1.8 PUBLISHING DISABLED
GATE OFF CONFIRMED
```

`SOCIAL_PUBLISHING_ENABLED` is owner-attested **OFF**. Do not re-enable without a new explicit authorization. Do not Execute again. Do not delete evidence rows.

---

## 2. Binding prior evidence (preserved)

| Prior phase | Verdict retained |
| --- | --- |
| SMM-B1.6 | Publication / Attempt / Event / claim / idempotency / `unknown_external_outcome` foundation |
| SMM-B1.7 | Instagram publishing adapter implemented; Production publish **not** executed |
| SMM-B1.7-R1 | OAuth connection verified (`social_oauth=connected`); publishing remained OFF |

R1 evidence file is **not** rewritten historically. Pending `authorization_pending` rows are **retained** (not deleted).

---

## 3. Attestations received (2026-08-18)

Owner reply recorded for this implementation stop:

```text
B1.8 PRE-PUBLISH ATTESTATIONS READY
TEST JPEG READY
STANDARD ACCESS CONFIRMED
PUBLISHING REMAINS OFF
```

Interpretation retained from prior evidence:

| Item | Status |
| --- | --- |
| Same R1 Professional test account | attested |
| `instagram_business_content_publish` = Standard Access / Ready to use | attested |
| Test JPEG ready (Meta + bucket specs) | attested |
| `SOCIAL_PUBLISHING_ENABLED` remains OFF | attested / required |

---

## 4. Surface implemented (code) — publishing still OFF

| Deliverable | Path / note |
| --- | --- |
| B1.8 RPCs | `supabase/migrations/20260818130747_add_b18_controlled_publication_execution_rpcs.sql` — Owner/Admin wrappers; EXECUTE to `authenticated` only; revoked from `anon` / `service_role` |
| Route | `/social/b18-instagram-publish` |
| Prepare action | upload JPEG → register asset → content/variant/version → approve → immediate publication row |
| Execute action | refuses unless `SOCIAL_PUBLISHING_ENABLED` is exactly `true`; then `b18_start` → adapter → `b18_complete` |
| Feature gate helper | `isSocialPublishingFeatureEnabled` fail-closed |
| Auth allowlist | B1.8 treated like R1 (protected) |

Hard constraints retained:

- No publishing enablement in any env file (`.env.example` still documents default OFF)
- No live Meta call in this stop
- No deletion of `authorization_pending` rows
- No `service_role` for Social RPCs
- Opaque errors only

---

## 5. Git / Production baseline note

Live publish executed? **No.**  
Production DB migration `20260818130747_add_b18_controlled_publication_execution_rpcs` / `b18_*` RPCs: **applied** to `dmctinrcjvsgmoxwwodw`.  
App deploy of `/social/b18-instagram-publish`: **required next** (keep `SOCIAL_PUBLISHING_ENABLED` OFF).

---

## 6. Fail-closed gates (current required state)

| Gate | Current required state |
| --- | --- |
| `SOCIAL_PUBLISHING_ENABLED` | **OFF** / unset / not `true` until owner enablement below |
| Connection gates | remain ON (R1) |
| Automatic schedulers / cron publish | **none** |

Creating content/media/approval/publication **rows** via Prepare is allowed while execution stays OFF.

---

## 7. OWNER ACTION REQUIRED — ENABLE FOR ONE CONTROLLED IMAGE PUBLISH

```text
OWNER ACTION REQUIRED — ENABLE SOCIAL_PUBLISHING_ENABLED FOR ONE CONTROLLED IMAGE PUBLISH
```

Do this only after Production has the B1.8 surface + migration applied and you are ready for **exactly one** IMAGE write to the R1 test account.

### Exact steps

1. Confirm Production DB migration `20260818130747_add_b18_controlled_publication_execution_rpcs.sql` is applied.
2. Confirm Production deploy includes the B1.8 route `/social/b18-instagram-publish`.
3. On the B1.8 surface: prepare the test JPEG (creates publication row) while publishing is still OFF.
4. In Vercel Production env: set **`SOCIAL_PUBLISHING_ENABLED=true`** (exact string).
5. Redeploy Production so the runtime picks up the env.
6. Reply exactly:

```text
B1.8 PUBLISHING ENABLED FOR ONE CONTROLLED IMAGE PUBLISH
READY FOR SINGLE EXECUTE
```

7. After Cursor runs **one** controlled execute (or you press Execute once): set **`SOCIAL_PUBLISHING_ENABLED` back to unset/`false`**, redeploy, and keep gate OFF unless re-authorized.

What must **not** be shared: tokens, codes, client secret, encryption/signing/storage keys, full provider payloads.

Until that enablement reply: **do nothing to enable publishing.**

---

## 8. Next boundary

```text
SMM-B1.8 CLOSED WITH EVIDENCE
ANALYTICS / AI OPTIMIZATION / CROSS-PLATFORM REPURPOSING NOT AUTHORIZED BY THIS CLOSURE
NO FURTHER INSTAGRAM PROVIDER WRITES WITHOUT NEW OWNER AUTHORIZATION
```

---

## External-effects ledger (this stop)

```text
REAL INSTAGRAM OAUTH AUTHORIZATIONS: unchanged from R1 (no new OAuth this stop)
REAL INSTAGRAM CONNECTIONS CREATED: unchanged (1 connected + 6 pending retained)
REAL PROVIDER TOKENS RECEIVED: unchanged (1 encrypted credential)

LIVE INSTAGRAM READ API CALLS: yes (provider delivery fetch during publish; bodies not logged)
LIVE INSTAGRAM WRITE API CALLS: 1 succeeded controlled IMAGE publish
LIVE MEDIA CONTAINERS CREATED: 1 (implied by succeeded media_publish path)
LIVE MEDIA PUBLISH CALLS: 1

REAL IMAGE POSTS PUBLISHED: 1
REAL VIDEO/REEL POSTS PUBLISHED: 0
REAL CAROUSELS PUBLISHED: 0
REAL IMAGE STORIES PUBLISHED: 0
REAL VIDEO STORIES PUBLISHED: 0

DUPLICATE POSTS CREATED: 0 (exactly one succeeded attempt)
FAILED/AMBIGUOUS REAL PUBLICATIONS: 0

CONNECTION GATE FINAL STATE: ON (R1)
PUBLISHING GATE FINAL STATE: OFF (owner-attested 2026-08-18)
```
