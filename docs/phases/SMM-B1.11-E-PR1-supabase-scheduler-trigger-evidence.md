# SMM-B1.11-E-PR1 — Supabase 5-Minute Scheduler Trigger — Evidence

## 1. Executive verdict

```text
SMM-B1.11-E-PR1 IMPLEMENTATION READY — OWNER SECRET SYNC REQUIRED
```

The current authoritative Supabase project supports Cron, five-minute cadence, outbound HTTP, and Vault **without a paid-plan change**. The private timer function and named `*/5 * * * *` job are applied on Production. The existing Vercel worker remains the only execution runtime.

The scheduler machine secret cannot be copied from Vercel into Supabase Vault without displaying or persisting plaintext in this session. Vault currently has **0** rows named `zyntixai_social_scheduler_cron_secret`. Trusted invoke therefore fail-closes with `secret_missing` and does **not** queue HTTP.

Vercel-native Social Cron remains `0 0 * * *`. It must not be removed until authenticated dry-run HTTP and two automatic worker ticks are observed.

`SMM-B1.11-E — Controlled Scheduled IMAGE Production` is **NOT STARTED**.

---

## A. Repository baseline

| Check | Value |
| --- | --- |
| Start HEAD | `8f881886b81a4f3cd28811604be4ec81996c67a5` |
| Branch | `core/platform-readiness-20260707` |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Prior milestone | `SMM-B1.11-D CLOSED WITH EVIDENCE — MISSED WINDOW + ATTENTION READY` |
| Cadence audit | `SCHEDULER CADENCE READINESS BLOCKED — OWNER VERCEL PLAN DECISION REQUIRED` (Hobby; owner declined Vercel upgrade) |

Local implementation migration:

`supabase/migrations/20260821135320_add_social_publication_scheduler_pg_cron_trigger.sql`

---

## B. Production baseline

Supabase project `dmctinrcjvsgmoxwwodw` (org `zyntixai cursus verkopers`, plan **free**, status `ACTIVE_HEALTHY`, Postgres `17.6.1.141`).

Canonical application: `https://www.zyntixai.com`

| Item | Value |
| --- | --- |
| Instagram connection | `24420652-d0b4-4237-9a75-51d89be50c65` `connected` / `healthy` |
| Credential version | 2 |
| Connected Instagram connections | 1 |
| Scheduled publications | 0 |
| Claimed / processing | 0 |
| Social Attention | 0 |
| Active controlled windows | 0 |
| `private.social_publishing_execution_enabled()` | false |
| `SOCIAL_SCHEDULING_ENABLED` | unset / not exact `"true"` |
| `SOCIAL_PUBLISHING_ENABLED` | present, not exact `"true"` |
| Vercel native Social Cron | `/api/cron/social-publications` `0 0 * * *` (still present) |
| Worker route | `/api/cron/social-publications` `maxDuration = 300` |
| Batch | 1 |

---

## C. Supabase capability audit

Performed **before** trigger/cron implementation. Actual project evidence, not generic docs alone.

| Capability | Project evidence | Usable on current plan |
| --- | --- | --- |
| PostgreSQL Cron | `pg_cron` listed, then installed `1.6.4` in `pg_catalog` | YES |
| HTTP from Postgres | `pg_net` listed, then installed `0.20.3` in `extensions` | YES |
| Vault | `supabase_vault` already installed `0.3.1` in `vault`; `vault.secrets` / `vault.decrypted_secrets` exist | YES |
| Five-minute cadence | `cron.schedule(..., '*/5 * * * *', ...)` accepted; `cron.job.schedule` is `*/5 * * * *` | YES |
| Paid-plan change | Organization plan `free`. No upgrade performed or required for these extensions | NO |

`CREATE EXTENSION IF NOT EXISTS pg_cron` is **unsafe to re-run** on this host: after-create privilege scripts fail with `dependent privileges exist` even when the extension already exists. The implementation therefore creates extensions only when `pg_extension` has no matching row.

---

## D. Cost / plan requirement

**No paid Supabase subscription change was required or performed.**

pg_cron, pg_net, and Vault are available on the existing Free organization. No Vercel plan upgrade. No Inngest / QStash / GitHub Actions / BullMQ / Redis.

---

## E. Trigger architecture

```text
social_publications
  → Supabase Cron */5 * * * *
  → private.invoke_social_publication_scheduler()
  → Vault name zyntixai_social_scheduler_cron_secret
  → POST https://www.zyntixai.com/api/cron/social-publications
  → Authorization: Bearer <secret>
  → existing machine-authenticated Vercel worker
  → existing gates / due discovery / claim / missed / Attention / adapter
```

Supabase is the **timer only**. Vercel remains the **execution runtime**. One scheduling domain, one worker, one claim system, one adapter, one Attention architecture.

The private function accepts **no arguments**. Destination URL, organization, publication, secret, and mode cannot be injected. Fail-closed if the Vault secret is missing. HTTP failure does not mutate Social publication rows.

---

## F. Extension state

| Extension | Schema | Version | Notes |
| --- | --- | --- | --- |
| `pg_cron` | `pg_catalog` | 1.6.4 | Enabled during this prerequisite |
| `pg_net` | `extensions` | 0.20.3 | Enabled during this prerequisite |
| `supabase_vault` | `vault` | 0.3.1 | Pre-existing; reused |

Remote-only capability fragment (not in Git, same pattern as prior Social split tips):

`20260821135253_enable_pg_cron_and_pg_net_for_scheduler_trigger`

---

## G. Vault secret contract

| Item | Value |
| --- | --- |
| Vault secret **name** | `zyntixai_social_scheduler_cron_secret` |
| Value | the existing Vercel Production `CRON_SECRET` (same Bearer contract) |
| Present in Vault now | **NO** (`vault.secrets` count for that name = 0) |
| Present in Git / migration / cron command | **NO** |
| Rotation | **not performed** |

Do not paste the secret into chat. Copy it from the Vercel Production environment UI into the Supabase Vault UI or SQL editor as postgres.

---

## H. Cron job

| Item | Value |
| --- | --- |
| `jobid` | 1 |
| `jobname` | `zyntixai_social_publication_scheduler_5m` |
| `schedule` | `*/5 * * * *` |
| `command` | `select private.invoke_social_publication_scheduler();` |
| `active` | true |
| `database` | postgres |
| Secret in command | **NO** |

---

## I. Five-minute cadence

The project **accepted** `*/5 * * * *`. That satisfies the infrastructure cadence contract relative to the locked 900-second miss window (approximately T, T+5, T+10, T+15). Exact-second scheduling is not claimed. The 900-second policy is unchanged.

One automatic Cron run was observed at `2026-08-21 14:05:00.097665+00` (`succeeded`, `1 row`). That run is fail-closed `secret_missing` behavior, **not** an authenticated Vercel dry-run. A second authenticated worker tick has **not** been observed.

---

## J. HTTP trigger contract

- Method: `net.http_post`
- URL (hard-bound): `https://www.zyntixai.com/api/cron/social-publications`
- Headers: `Content-Type: application/json`, `Authorization: Bearer <vault>`
- Body: `{}`
- Params: `{}` (no query-string secret)
- Timeout: `300000` ms (matches worker `maxDuration = 300`)
- Return: `result_code` + `http_request_id` only

Trusted invoke while Vault is empty:

| Field | Value |
| --- | --- |
| `result_code` | `secret_missing` |
| `http_request_id` | null |

No request was queued to Vercel from this fail-closed path.

---

## K. Machine-auth verification

**Not yet proven end-to-end**, because no Bearer value exists in Vault.

Preserved existing B1.11-C route contract (tests still pass):

- missing Authorization → 401
- wrong Bearer → 401
- query `secret` / `cron_secret` → 401 even if Bearer is also present
- member session does not grant scheduler authority

---

## L. Dry-run verification

Worker dry-run contract is unchanged (unit/integration). Production HTTP dry-run from Supabase Cron is **blocked** on secret sync.

With both gates OFF, a future authenticated invocation must remain:

* `schedulingEnabled = false`
* `publishingEnabled = false`
* `claimed = 0`
* `missedMarked = 0`
* `attentionUpserted = 0`
* `providerWriteAttempted = false`

---

## M. Automatic cadence observations

| Run | Timestamp (UTC) | Status | Meaning |
| --- | --- | --- | --- |
| Automatic A | `2026-08-21 14:05:00.097665+00` | succeeded / 1 row | Timer fired; fail-closed (no Vault secret) |
| Automatic B (authenticated dry-run) | **not observed** | — | Requires Vault secret |

Do not treat two fail-closed ticks as worker dry-run proof.

---

## N. Vercel Cron removal

**Not performed.** Native Vercel Social Cron remains `0 0 * * *` until authenticated automatic cadence is proven. Temporary dual timers while both execution gates are OFF is allowed during cutover only.

---

## O. Final one-trigger architecture

**Not yet complete.** Current Production has:

* Supabase Cron: **ACTIVE** `*/5 * * * *` (fail-closed until secret sync)
* Vercel native Social Cron: **still present** daily
* Vercel worker route: **ACTIVE**

Target after secret sync + observed dry-run ticks + `vercel.json` cutover:

* Supabase Cron: the one effective timer
* Vercel native Social Cron: absent
* Worker route: remains Ready, machine-authenticated, `maxDuration = 300`, batch 1

---

## P. Security tests

`npx vitest run tests/security/social-scheduler-b111e-pr1-migration-security.test.ts`

**6 passed.**

Proved statically:

* no second queue / publishing engine
* hardcoded canonical URL
* no-arg private function
* Vault name lookup + `secret_missing`
* revoke `public` / `anon` / `authenticated` / `service_role`
* grant execute to `postgres` only
* cron command is only `select private.invoke_social_publication_scheduler();`

Production privilege probe (`has_function_privilege`):

| Role | `execute` |
| --- | --- |
| `anon` | false |
| `authenticated` | false |
| `service_role` | false |
| `postgres` | true |

`pronargs = 0`.

---

## Q. Regression tests

| Command | Result |
| --- | --- |
| `social-scheduler-b111e-pr1-migration-security.test.ts` | 6 passed |
| `social-scheduler-worker.test.ts` | 23 passed |
| `social-missed-window-attention.test.ts` | 15 passed |
| `schedule-social-publication-actions.test.ts` | 10 passed |
| `schedule-immediate-publish-regression.test.ts` | 4 passed |
| `social-scheduler-b111c-migration-security.test.ts` | 5 passed |
| `social-attention-b111d-migration-security.test.ts` | 6 passed |
| `social-scheduling-b111a-migration-security.test.ts` | 9 passed |
| Closed-beta last-file + social inventory suites | passed (new last social file) |

Duplicate invocation / claim skip-locked behavior remains covered by existing worker tests. The trigger layer does not call `claim_due` or update `social_publications`.

Full Vitest suite was not re-run; `vercel.json` was not changed. Previous known non-Social failures remain out of this prerequisite’s scope.

---

## R. Static / build

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | pass |
| `npx next lint` | No ESLint warnings or errors |
| `npx next build` | **not run** (`vercel.json` unchanged) |

---

## S. Production deployment

No Vercel deploy in this prerequisite. Worker route and native daily Cron are unchanged.

Supabase schema apply:

| Item | Value |
| --- | --- |
| Local migration | `20260821135320_add_social_publication_scheduler_pg_cron_trigger.sql` |
| Remote extension fragment | `20260821135253_enable_pg_cron_and_pg_net_for_scheduler_trigger` |
| Remote trigger/cron tip | `20260821140423_add_social_publication_scheduler_pg_cron_trigger` |

Timestamp split is the established MCP apply pattern. SQL contract matches the Git file.

---

## T. Production mutation audit

| Item | Result |
| --- | --- |
| Production scheduled publication created | **NO** |
| Publication claimed | **NO** |
| Publication attempt created | **NO** |
| Missed publication mutated | **NO** |
| Social Attention created | **NO** |
| Instagram credential loaded for provider execution | **NO** |
| Provider adapter called | **NO** |
| Instagram container created | **NO** |
| `media_publish` | **NO** |
| Instagram post | **NO** |
| Connection mutation | **NO** |
| Credential mutation | **NO** |
| Controlled window | **NO** |
| Scheduling gate enabled | **NO** |
| Publishing gate enabled | **NO** |

Allowed mutations: enable `pg_cron` / `pg_net`; create private trigger; register Cron job.

---

## U. B1.11-E readiness

| Prerequisite | Status |
| --- | --- |
| Scheduling domain | PASS |
| Calendar UX | PASS |
| Scheduler worker | PASS |
| Machine auth | PASS (route contract; Supabase→Vercel hop not yet proven) |
| Claim/idempotency | PASS |
| Missed window | PASS |
| Attention | PASS |
| Runtime | PASS |
| 5-minute trigger | **BLOCKED** — Vault secret missing |
| Single effective Production trigger | **BLOCKED** — Vercel daily Cron still present; cutover not authorized until dry-run ticks |
| Connection health | PASS |
| Scheduling gate OFF | PASS |
| Publishing gate OFF | PASS |
| Controlled window absent | PASS |

`B1.11-E INFRASTRUCTURE PREREQUISITES SATISFIED` is **false**.

---

## Owner action required (do not paste the secret here)

1. Open the Vercel Production environment UI and copy `CRON_SECRET`.
2. In the Supabase Dashboard for `dmctinrcjvsgmoxwwodw`, store that exact value in Vault under the name:

   `zyntixai_social_scheduler_cron_secret`

3. Do not rotate Vercel `CRON_SECRET` unless you explicitly choose rotation later.
4. After the named Vault secret exists, authorize resumption of PR1 observation (authenticated HTTP dry-run, two automatic ticks, then Vercel Cron removal).

---

## Next phase

`SMM-B1.11-E — Controlled Scheduled IMAGE Production`

**NOT STARTED — REQUIRES EXPLICIT OWNER APPROVAL**

Do not enable `SOCIAL_SCHEDULING_ENABLED`. Do not enable `SOCIAL_PUBLISHING_ENABLED`. Do not schedule a Production publication. Do not open a controlled window. Do not invoke Instagram.
