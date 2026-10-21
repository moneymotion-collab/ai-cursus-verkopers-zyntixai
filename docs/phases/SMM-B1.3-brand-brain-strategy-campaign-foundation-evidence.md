# SMM-B1.3 — Brand Brain, Strategy & Campaign Foundation — Evidence

| Field | Value |
| --- | --- |
| Phase slice | **SMM-B1.3 — Brand Brain + Strategy + Campaign Foundation** |
| Document type | Closure evidence |
| Date | 2026-08-15 |
| Formal status | `SMM-B1.3 CLOSED WITH EVIDENCE — BRAND BRAIN, STRATEGY AND CAMPAIGN FOUNDATION READY` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `107bc7949148a3e93dbad65cc1afb22f37afa81f` |
| Production project | `dmctinrcjvsgmoxwwodw` |

```text
SMM-B1.3 PRODUCTION SCHEMA VERIFIED — PROVIDER-NEUTRAL BRAND AND CAMPAIGN FOUNDATION ACTIVE WITH SOCIAL FEATURE GATES OFF
SMM-B1.4 NOT YET AUTHORIZED
```

---

## 1. Executive verdict

```text
SMM-B1.3 CLOSED WITH EVIDENCE — BRAND BRAIN, STRATEGY AND CAMPAIGN FOUNDATION READY
```

Provider-neutral Brand Brain (profile, rules, audiences, pillars, goals, platform strategies) and Campaign foundation (multi-audience / multi-planned-provider / multi-pillar) are persisted with tenant-safe Brand↔Workspace integrity. No Master Content, media, calendar, approval, publishing, analytics, or provider runtime.

---

## 2. Verified Git baseline

HEAD/upstream/origin `107bc7949148a3e93dbad65cc1afb22f37afa81f`; divergence `0 0`; clean; subject `docs(smm): close B1.2 social workspace foundation`.

---

## 3. Binding A/B/C/D/B1.2

Preserved. Historical migrations/evidence not rewritten. Connection provider CHECKs remain Instagram-only.

---

## 4. Preflight findings

B1.2 had Brand/Workspace identity only. Brand Brain child concepts missing. D assigns Brand Brain + Campaigns to B1.3. Production Social rows were 0.

---

## 5. Brand vs Workspace source-of-truth

| Object | Owns |
| --- | --- |
| **Social Brand** | Canonical brand identity + Brand Profile fields + Brand Brain children |
| **Social Workspace** | Operational container (1:1 Brand); connections/OAuth bind here |

Brand Brain tables store `(organization_id, brand_id, workspace_id)` with composite FK to `social_workspaces (organization_id, brand_id, id)` so Brand A cannot pair with Workspace B.

---

## 6. B1.3 scope

**In:** profile fields, rules, audiences, pillars, goals, platform strategies, campaigns + joins, events, RPCs, typed contracts, tests, Production schema.

**Out:** Master Content, media, calendar, approval, publishing, analytics, community/CRM/Attention, AI engine, other provider runtime, UI shell, offers catalog.

---

## 7. Files changed

- `supabase/migrations/20260815182703_add_social_brand_brain_campaign_foundation.sql`
- `src/features/social-media/domain/brand-brain.ts` (+ exports)
- Tests: migration security, live SQL script, inventory updates
- This evidence

Generated DB types not regenerated (cast adapters pattern retained).

---

## 8. Migration

`20260815182703_add_social_brand_brain_campaign_foundation.sql` — applied via `supabase db push --linked`. Remote latest aligned. No new no-op stub.

---

## 9–18. Models (summary)

| Area | Implementation |
| --- | --- |
| Brand Profile | Columns on `social_brands`: summary, positioning, primary_language, website_url, voice_config (bounded JSON object), profile_source_kind |
| Audiences | `social_audiences` soft-archive |
| Offers | **Deferred** — `SOCIAL_OFFERS_B13_DECISION = deferred_no_duplicate_product_catalog` |
| Voice/Tone | `voice_config` structured object (not prompt dump) |
| Rules | `social_brand_rules` with controlled `rule_kind` including CTA restrictions |
| Pillars | `social_content_pillars` |
| Goals | `social_goals` + `success_criteria` JSON planning intent (not analytics) |
| Platform Strategy | `social_platform_strategies` planned_provider allowlist; ≠ runtime |
| Provenance | Canonical kinds exclude `ai_inferred` |

---

## 19. Planned vs implemented

Platform strategy / campaign platforms accept planned providers (incl. TikTok). `IMPLEMENTED_SOCIAL_PROVIDERS` remains `['instagram']`. Connection DB CHECKs unchanged.

---

## 20–24. Campaign model

`social_campaigns`: org+brand+workspace, goal FK, status `draft|active|completed`, dates, soft `archived_at`. Joins: audiences, platforms, pillars. Atomic `set_social_campaign_assignments`.

---

## 25–31. Security / RLS / RPC / audit / archive

Owner/Admin via workspace manage helpers; member SELECT; RPC-only mutations; SECURITY DEFINER + empty search_path; service_role EXECUTE revoked; append-only `social_brand_brain_events`; archived Brand Brain objects blocked for new campaign assignment; historical joins RESTRICT.

---

## 32. AI truth boundary

Canonical Brand Brain `source_kind` / `profile_source_kind` allow only `user_entered|imported|system_derived|manually_verified`. `ai_inferred` remains in universal provenance catalog for future AI tables only.

---

## 33–35. Client-safe / provider-neutral / target-market

No secrets in Brand Brain tables. No Instagram-specific Brand Brain tables. One schema for all target markets.

---

## 36–43. Tests

Migration security + domain contracts + inventory; live SQL script with BEGIN/ROLLBACK; B1.2/B1.1 regressions in full suite.

### Targeted

```text
Test Files  17 passed (17)
     Tests  100 passed (100)
```

### Full Vitest

```text
Test Files  321 passed (321)
     Tests  2262 passed (2262)
```

### Typecheck / lint / build

PASS / PASS / PASS

---

## 44–50. Reviews

Security PASS (tenant FKs, roles, RLS, search_path, AI boundary). Data-model: offers deferred; voice_config bounded JSON justified. Anti-chaos smells ABSENT for Instagram-specific Brand Brain/campaign tables, unrestricted JSON dumps, content/publication leakage, service-role shortcut, provider CHECK broadening.

---

## 51–55. Production

| Check | Result |
| --- | --- |
| Preflight latest | `20260815162306` |
| Social counts | all 0 |
| Applied | `20260815182703` |
| Post tables/RPCs | present |
| Brand Brain / Campaign rows | **0** |
| Gates / secrets | unchanged OFF / unconfigured |

---

## 56. External-effect statement

```text
PRODUCTION DATABASE MIGRATIONS APPLIED: 1 (20260815182703)
0 OAUTH AUTHORIZATIONS
0 INSTAGRAM/FACEBOOK/THREADS/TIKTOK/LINKEDIN/YOUTUBE/PINTEREST/X ACCOUNTS CONNECTED
0 REAL PROVIDER TOKENS / LIVE API CALLS / MUTATIONS
0 SOCIAL POSTS / STORIES / WEBHOOKS
0 SMM FEATURE GATES ENABLED
0 REAL BRAND BRAIN / CAMPAIGN FIXTURE ROWS
```

---

## 57–63. Closure

Residual: generated types lag; live Docker SQL prepared not required beyond Production verify. Closure criteria met.

Evidence path: this file.

Commits recorded at close:

| Full hash | Subject |
| --- | --- |
| `761f543b831a68a5b23f78a16e0c30392eb8e4f6` | `feat(smm): add brand brain and campaign foundation` |
| *(this evidence commit)* | `docs(smm): close B1.3 brand strategy campaign foundation` |

```text
SMM-B1.3 CLOSED WITH EVIDENCE — BRAND BRAIN, STRATEGY AND CAMPAIGN FOUNDATION READY
SMM-B1.3 PRODUCTION SCHEMA VERIFIED — PROVIDER-NEUTRAL BRAND AND CAMPAIGN FOUNDATION ACTIVE WITH SOCIAL FEATURE GATES OFF
```

```text
SMM-B1.4 NOT YET AUTHORIZED
```
