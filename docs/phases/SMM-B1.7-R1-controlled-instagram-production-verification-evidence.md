# SMM-B1.7-R1 — Controlled Instagram Production Verification Evidence

**Phase:** `SMM-B1.7-R1 — Controlled Instagram Production Verification`  
**Date:** 2026-08-15  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw`

---

## 1. Executive verdict

```text
SMM-B1.7-R1 OWNER ACTION REQUIRED — DEPLOY OAUTH STAGE DIAGNOSTICS THEN ONE RETRY
```

Retry 2 again returned `social_oauth=connection_failed` with no credential persistence.
Opaque post-consume failure-stage diagnostics added (`social_oauth_stage=…` allowlisted query only; no secret logging).

### Production row state after retry 2 (safe)

| Object | Count / status |
| --- | --- |
| Brands | 1 |
| Workspaces | 1 |
| Connections | 3 × `authorization_pending` |
| Intents | 3 × `consumed` |
| Credentials | 0 |
| Connection events | 3 × `social_connection_initiated` |
| Publications | 0 |

Publishing remains OFF. No live publish authorized.

Diagnostic commit: `544ad29` — `fix(smm): add opaque instagram oauth failure stage diagnostics`

---

## 2. Git baseline (R1 start)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `5b05475c690fc3b36dfb5bebdaa86e5ac437f766` |
| Upstream / origin tip | `5b05475c690fc3b36dfb5bebdaa86e5ac437f766` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Latest commit at start | `docs(smm): close B1.7 instagram publishing integration` |

---

## 3. B1.7 implementation baseline

| Item | Value |
| --- | --- |
| B1.7 implementation | `ebc6745be7d8dc7540fd7dbb1b47b400e5878957` |
| B1.7 evidence / prior tip | `5b05475c690fc3b36dfb5bebdaa86e5ac437f766` |
| Prior verdict | `SMM-B1.7 CLOSED WITH EVIDENCE` — controlled Production publish **not** executed |
| B1.7 evidence rewritten? | **No** |

---

## 4. Official Meta contract re-verification

Sources (first-party only; checked 2026-08-15):

- [Content Publishing](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/) (updated 2026-06-30)
- [Business Login for Instagram](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/)
- [App Review for Instagram API](https://developers.facebook.com/docs/instagram-platform/app-review/) (updated 2026-06-30)
- [Instagram Platform Overview](https://developers.facebook.com/documentation/instagram-platform/overview)

| Topic | Current official contract | Matches B1.7? |
| --- | --- | --- |
| API path | Instagram API with Instagram Login | Yes |
| Host | `graph.instagram.com` | Yes |
| Login | Business Login for Instagram | Yes |
| Account type | Instagram Professional (Business/Creator) | Yes |
| Permissions | `instagram_business_basic`, `instagram_business_content_publish` | Yes (OAuth scope string) |
| App Review table naming | sometimes `instagram_business_content_publishing` | Naming variance only; B1.7 uses Login scope `…_publish` |
| Flow | create container (`/<IG_ID>/media`) → status → `media_publish` | Yes |
| Media delivery | Meta cURLs publicly reachable HTTPS URL at publish time | Yes — signed route satisfies “reachable”, not public bucket |
| Formats | image, video/REELS, CAROUSEL, STORIES | Yes (adapter-gated) |
| Quota | 100 API-published posts / 24h moving; carousel = 1 | Yes |
| Standard Access | Own/managed Professional accounts added to App Dashboard | Yes for R1 test path |
| Advanced Access | Required for external/customer accounts (Tech Provider) | Customer rollout still blocked |

**Provider-contract delta vs B1.7:** none material. No implementation correction required before real provider mutation.

---

## 5. Meta app access level

| Item | State |
| --- | --- |
| App Dashboard access level | **OWNER ACTION** — Cursor cannot inspect Meta App Dashboard |
| Expected R1 path | Standard Access for owner-managed test Professional account with App Dashboard role |
| Advanced Access / App Review | **Not required** for own/managed R1 test account; **still required** before customer multi-tenant rollout |

---

## 6. Standard / Advanced Access decision

```text
R1 TEST PATH: STANDARD ACCESS ELIGIBLE (OWNER-MANAGED PROFESSIONAL ACCOUNT + APP ROLE)
CUSTOMER ROLLOUT: ADVANCED ACCESS / APP REVIEW STILL REQUIRED
```

If the selected test account is not owned/managed / not added to the App Dashboard:

```text
R1 BLOCKED — META ADVANCED ACCESS / APP REVIEW REQUIRED
```

---

## 7. Test-account eligibility

| Requirement | State |
| --- | --- |
| Dedicated Professional (Business/Creator) test account | **OWNER ACTION** |
| Owned/managed by owner; no customer account | **OWNER ACTION** |
| Added to Meta App Dashboard (roles) under Standard Access | **OWNER ACTION** |
| Password / login credentials recorded in evidence | **Never** |

---

## 8. Pre-test Production row state

Verified via Production SQL (`dmctinrcjvsgmoxwwodw`):

| Relation | Count |
| --- | --- |
| `public.social_account_connections` | 0 |
| `private.social_provider_credentials` | 0 |
| `public.social_publications` | 0 |
| `public.social_publication_attempts` | 0 |
| `public.social_publication_events` | 0 |

Real Instagram connections / credentials / publications / attempts / provider effects: **0**.

---

## 9. Production config masked state (local inspectable env)

`.vercel/project.json`: **ABSENT** in this worktree (Vercel Production env not inspectable from here).

Local `.env.local` masked presence only:

| Key | State |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | CONFIGURED |
| `NEXT_PUBLIC_SUPABASE_URL` | CONFIGURED |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | CONFIGURED |
| `SOCIAL_CONNECTIONS_ENABLED` | NOT CONFIGURED |
| `SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED` | NOT CONFIGURED |
| `SOCIAL_PUBLISHING_ENABLED` | NOT CONFIGURED |
| `SOCIAL_INSTAGRAM_CLIENT_ID` | NOT CONFIGURED |
| `SOCIAL_INSTAGRAM_CLIENT_SECRET` | NOT CONFIGURED |
| `SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI` | NOT CONFIGURED |
| `SOCIAL_CREDENTIAL_ENCRYPTION_KEY` | NOT CONFIGURED |
| `SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET` | NOT CONFIGURED |
| `SOCIAL_PRIVATE_MEDIA_STORAGE_KEY` | NOT CONFIGURED |

Gates treated as **OFF** (fail-closed).

---

## 10. Secret readiness

```text
PRE-OAUTH SECRET READINESS: FAIL — REQUIRED PRODUCTION SECRETS NOT CONFIGURED
```

Owner must provision Production (Vercel) secrets without pasting values into Cursor chat.

---

## 11. Callback verification

| Item | State |
| --- | --- |
| Expected redirect env | `SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI` |
| Production callback URL verified against Meta App Dashboard | **BLOCKED** — client id/secret/redirect not configured |

---

## 12. Media-byte-source implementation / readiness

R1 enablement correction implemented:

- Private Storage bucket migration: `20260815212000_add_social_private_media_bucket_r1.sql`
  - bucket `zyntix-social-media`, `public=false`
  - restrictive deny policies for `anon` / `authenticated` scoped to that bucket only
- Claims v2: signed delivery token binds `storageObjectKey` + hash + org prefix
- Narrow download via `SOCIAL_PRIVATE_MEDIA_STORAGE_KEY` (no `SERVICE_ROLE` string in `src/` — security-boundary compliant)
- Fail-closed when key/URL missing
- Route: `GET /api/social/media-delivery/[token]`

Production after `supabase db push --linked`:

| Check | Result |
| --- | --- |
| Migration `20260815212000` | Applied |
| Bucket `zyntix-social-media` | Present, `public=false`, 100MB limit |

---

## 13. Signed media-delivery verification

Automated (unit/route):

| Case | Result |
| --- | --- |
| Valid signature → exact bytes + MIME + Content-Length | PASS |
| Tampered token | PASS (403) |
| Unavailable byte source | PASS (503) |
| Path traversal / cross-org key rejection (adapter/media-delivery tests) | PASS |

Live Production media-delivery proof against real Storage object: **NOT YET** (requires Production secrets + deployed enablement + test object).

---

## 14. Deployment status

| Item | State |
| --- | --- |
| Code enablement | Implemented locally; commit pending/in this R1 commit set |
| Production DB private bucket | Applied |
| Production app deploy with R1 code + secrets | **OWNER / CI ACTION REQUIRED** |
| Gates during deploy | Must remain **OFF** |

---

## 15. Pre-OAuth gate

| Gate | Status |
| --- | --- |
| Git start aligned | PASS |
| Production application correct (R1 code live) | FAIL — deploy pending |
| Production database aligned (bucket) | PASS for R1 media migration |
| Callback URL verified | FAIL |
| App ID configured | FAIL |
| App secret configured | FAIL |
| Encryption key configured | FAIL |
| Media delivery signing secret | FAIL |
| Private media storage key | FAIL |
| Media delivery ready in Production | FAIL until secrets + deploy |
| OAuth CSRF/state tests (automated suite) | PASS (repo tests) |
| Provider permission set verified vs Meta docs | PASS |
| Selected account eligible | OWNER ACTION |
| No unexpected Social rows | PASS (all 0) |
| Publishing gate OFF | PASS (not configured / fail-closed) |

```text
PRE-OAUTH GATE: FAIL
```

---

## 16. Owner OAuth action

**Not started.** Do not begin OAuth until Pre-OAuth gate PASSes.

When ready, Cursor will re-issue:

```text
OWNER ACTION REQUIRED — CONTROLLED INSTAGRAM OAUTH
```

---

## 17–21. Real connection / permission / capability / credential / reauthorization

```text
NOT EXECUTED — BLOCKED ON PRE-OAUTH GATE
```

---

## 22–34. Test content / publish suite / visual checks

```text
NOT EXECUTED — NO OWNER PUBLISH AUTHORIZATION; PUBLISHING GATE OFF
```

---

## 35–39. Failure / idempotency / unknown-outcome

```text
NOT EXECUTED (live). Mocked B1.7 suite remains authoritative for safety-model unit proof.
```

---

## 40. Provider quota observation

```text
NOT OBSERVED — no live Instagram Graph calls in this stop
```

---

## 41–43. Manual QA / reconciliation / row counts

Pre-test counts recorded in §8. Post-test N/A at this stop.

---

## 44. Visible-provider artifact cleanup

```text
N/A — no live posts created
```

---

## 45. Automated tests

Baseline at B1.7 close: `328 files / 2310 tests PASS`  
After R1 enablement:

```text
329 files / 2312 tests PASS
```

---

## 46. Typecheck / lint / build

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |

---

## 47. Code changes required during R1

- Private bucket migration `20260815212000_add_social_private_media_bucket_r1.sql`
- `storage-paths.ts`, `supabase-byte-source.ts`
- media-delivery claims/org binding; route byte-source wiring
- `.env.example` Social secret names (including `SOCIAL_PRIVATE_MEDIA_STORAGE_KEY`)
- Migration inventory + media-delivery route tests

---

## 48. Implementation / evidence commits

| Commit | Subject |
| --- | --- |
| `5cc823a` | `fix(smm): enable controlled instagram production verification` |
| (this docs commit) | `docs(smm): record B1.7-R1 owner-action gate` |

Final PASS evidence commit is deferred until live verification completes.

---

## 49. Residual Meta / App Review requirements

- Customer/multi-tenant Instagram accounts: Advanced Access + App Review still required
- Owner must confirm Standard Access + App Dashboard role for the dedicated test Professional account

---

## 50. Customer-rollout blockers

1. Advanced Access / App Review for external accounts  
2. Production secrets not yet provisioned  
3. Connection + publishing gates intentionally OFF  
4. Live OAuth / publish not executed  
5. Controlled visual publish suite not executed  

---

## 51. Final verdict (this stop)

```text
SMM-B1.7-R1 OWNER ACTION REQUIRED — CONNECTION GATE ACTIVATION
```

### Owner attestation received (2026-08-17) — connection gates

```text
R1 CONNECTION GATES ON; PUBLISHING OFF; PRODUCTION REDEPLOYED
```

### Post-connection-gate automated check

| Check | Result |
| --- | --- |
| Git HEAD | `7892e17` (local evidence doc dirty, uncommitted) |
| `social_account_connections` | 0 |
| `social_provider_credentials` | 0 |
| `social_oauth_authorization_intents` | 0 |
| `social_connection_events` | 0 |
| `social_publications` | 0 |
| `social_brands` | 0 |
| `social_workspaces` | 0 |
| Publishing gate | OFF (owner-attested; do not turn ON) |
| Connection gates | ON (owner-attested) |

### OAuth start blocker (discovered before issuing OAuth owner gate)

```text
SMM-B1.7-R1 OWNER ACTION REQUIRED — MINIMAL CONNECT SURFACE MISSING
```

Findings:

1. Server path exists: `initiateInstagramConnectionAction` + `/api/social/instagram/callback`.
2. **No Production App Router page/UI** imports or calls the connect action (B1.1-E Connect UI was never shipped).
3. Production has **0** Social Brands and **0** Social Workspaces; connection initiation requires a real `workspaceId` under an Owner/Admin session.
4. Issuing “open ZyntixAI and Start Instagram connection” would be false — there is no controlled UI entrypoint yet.

Exact next human decision (choose one; do not paste secrets):

**A (preferred for R1):** Authorize a narrowly scoped R1 enablement UI/page (Owner/Admin only) that can:
- create Brand + Workspace via existing RPCs if none exist;
- call `initiateInstagramConnectionAction` and redirect to Meta;
- keep publishing gate OFF.

**B:** Confirm an already-approved alternate controlled initiation path (if any exists outside this repo UI).

Reply with:

```text
R1 AUTHORIZE MINIMAL INSTAGRAM CONNECT SURFACE
```

or describe alternate path **B**.

### Resolution (2026-08-17)

Owner replied:

```text
R1 AUTHORIZE MINIMAL INSTAGRAM CONNECT SURFACE
```

Implemented:

- Route `/social/r1-instagram-connect` (Owner/Admin, connection gates required)
- `startR1InstagramConnectAction` → `create_social_workspace` if needed → existing Instagram OAuth initiation
- OAuth return path `social_workspace` → `/social/r1-instagram-connect`
- Publishing gate untouched / remains OFF
- Tests: **330 files / 2315 PASS**; typecheck/lint/build PASS

---

## OWNER ACTION REQUIRED — CONTROLLED INSTAGRAM OAUTH

```text
OWNER ACTION REQUIRED — CONTROLLED INSTAGRAM OAUTH
```

1. Confirm Production redeploy includes the R1 connect-surface commit.
2. Keep `SOCIAL_PUBLISHING_ENABLED` **OFF**.
3. Open Production: `/social/r1-instagram-connect` (add `?org=<org-uuid>` if multi-org).
4. Sign in as authorized Owner/Admin.
5. Click **Connect Instagram test account**.
6. Sign into the dedicated Professional (Business/Creator) test account.
7. Review requested permissions (`instagram_business_basic`, `instagram_business_content_publish`).
8. Approve only the expected permissions.
9. Return to ZyntixAI (`/social/r1-instagram-connect?social_oauth=connected` expected on success).
10. Reply exactly:

```text
R1 INSTAGRAM OAUTH COMPLETED
```

What must **NOT** be shared:

- password, access token, authorization code, app secret, encryption/signing/storage keys

What Cursor will verify next:

- exactly one expected Social connection (where inspectable);
- provider `instagram`; encrypted credential presence (no plaintext);
- publish permission / capability evidence;
- no Publication / provider write occurred;
- then stop before any live publish.

What Cursor will do after A:
- implement minimal Owner/Admin connect surface only;
- tests + typecheck/lint/build;
- commit/push/deploy with publishing still OFF;
- then re-issue `OWNER ACTION REQUIRED — CONTROLLED INSTAGRAM OAUTH`.

---

## 51b. Prior stop (secrets ready) — superseded by § above

```text
SMM-B1.7-R1 OWNER ACTION REQUIRED — CONNECTION GATE ACTIVATION
```

### Owner attestation received (2026-08-17)

```text
R1 PRODUCTION SECRETS + META TEST ACCOUNT READY
```

### Re-check after attestation

| Check | Result |
| --- | --- |
| Git HEAD / upstream / origin | `7892e17` / divergence `0 0` / clean |
| Production Social rows | still 0 (connections, credentials, intents, publications, attempts) |
| Private bucket `zyntix-social-media` | present, `public=false` |
| Vercel Production env mask-inspect from worktree | **NOT POSSIBLE** (`.vercel/project.json` ABSENT; CLI unlinked) |
| Local `.env.local` Social secrets | NOT CONFIGURED (expected — Production is Vercel) |
| Secret presence | **OWNER-ATTESTED** (values never requested/shown) |
| Meta dedicated Professional test account | **OWNER-ATTESTED** |
| Publishing gate | must remain **OFF** |
| Connection gates | still **OFF** until this owner step |

### Pre-OAuth gate (post-attestation)

Treated as **PASS for progression to connection-gate stage** on owner attestation + automated Production DB/git checks. Cursor could not independently list Vercel Production env names from this worktree.

Completed automated gates:

- Git aligned at `7892e17`  
- Production Social rows = 0  
- Private media bucket present  
- Media enablement committed/pushed earlier  
- Gates still OFF in code defaults  

Exact next human action (do **not** paste secret values into Cursor):

1. Confirm Production deployment includes commit `7892e17` (or later on this branch).  
2. In **Vercel → Project → Settings → Environment Variables → Production**, set **only**:
   - `SOCIAL_CONNECTIONS_ENABLED` = `true`
   - `SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED` = `true`
3. Leave **`SOCIAL_PUBLISHING_ENABLED` unset or `false`** (must stay OFF for OAuth verification).  
4. Redeploy Production so the gate env takes effect.  
5. Reply exactly:

```text
R1 CONNECTION GATES ON; PUBLISHING OFF; PRODUCTION REDEPLOYED
```

What must **NOT** be shared:

- passwords, access tokens, authorization codes, app secret, encryption keys, signing secrets, storage keys

What Cursor will verify next:

- Production Social rows still 0  
- then issue `OWNER ACTION REQUIRED — CONTROLLED INSTAGRAM OAUTH` (still no publish)  

---

## 52. Next boundary

```text
SMM-B1.8 NOT YET AUTHORIZED
```

Do not start Analytics / AI Optimization / Cross-Platform Repurposing until R1 closes.

---

## External-effects ledger (this stop)

```text
REAL INSTAGRAM OAUTH AUTHORIZATIONS: 0
REAL INSTAGRAM CONNECTIONS CREATED: 0
REAL PROVIDER TOKENS RECEIVED: 0

LIVE INSTAGRAM READ API CALLS: 0
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

CONNECTION GATE FINAL STATE: OFF
PUBLISHING GATE FINAL STATE: OFF
```

Production DB mutation performed (non-Instagram): private bucket migration `20260815212000` only.
