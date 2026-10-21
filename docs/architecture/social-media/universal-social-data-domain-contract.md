# ZyntixAI Universal Social OS — Data & Domain Contract

| Field | Value |
| --- | --- |
| Document type | Durable architecture / data / domain contract |
| Product | **ZyntixAI Social Media Management — Universal Social OS** |
| Authoritative phase | **SMM-B1.1-D** |
| Date | 2026-08-15 |
| Status | `AUTHORITATIVE FOR FUTURE SMM IMPLEMENTATION` |
| Binding prior contracts | SMM-B1.0; SMM-B1.1-A/B/C (Instagram Provider-1 reference) |
| Implementation | **Not authorized by this document** |

```text
INSTAGRAM A/B/C FOUNDATION PRESERVED AS PROVIDER-1 REFERENCE IMPLEMENTATION
```

This contract makes later SMM phases predictable, secure, reusable, provider-neutral, and non-chaotic.  
It does **not** implement providers, migrations, OAuth, publishing, or Production changes.

---

## 1. Why this exists

SMM-B1.1-A/B/C correctly delivered an Instagram-scoped connection and credential foundation.

Without an explicit Universal Social architecture, later phases risk:

- cloning Instagram tables per provider;
- embedding `if (provider === "instagram")` throughout core logic;
- mixing content, approval, publication, analytics, and AI truth;
- duplicating Attention or CRM;
- target-market-specific schemas;
- destructive rewriting of A/B/C.

**D locks the Universal Social OS before additional product implementation continues.**

---

## 2. Core principle

```text
One Social OS
  → many Brands / Workspaces
  → many provider adapters
  → capability-driven behavior
```

Not eight separate social products.

Provider-specific logic belongs behind narrow adapters.  
Business logic (workspace, brand, campaign, content, approval, calendar, analytics projections, automation) remains provider-neutral.

---

## 3. Binding A/B/C preservation

| Slice | Remains true |
| --- | --- |
| A | Typed Instagram connection/security contracts |
| B | DB + AES-256-GCM credential foundation; Instagram CHECKs; workspace FK deferred |
| C | Instagram OAuth callback + encrypted credential flow |

Historical evidence is **not** rewritten to pretend A/B/C were multi-provider.

Generalization occurs only through **additive** later phases/migrations.

Current Production constraints remain:

```text
provider = instagram
login_product = instagram_login
```

until a later authorized additive migration deliberately expands them.

---

## 4. Provider model

### 4.1 Distinctions (mandatory)

| Concept | Meaning | Current |
| --- | --- | --- |
| **Planned provider** | Roadmap family | Instagram, Facebook, Threads, TikTok, LinkedIn, YouTube, Pinterest, X |
| **Known family** | A-era catalog name | Instagram, Facebook, TikTok, LinkedIn, YouTube, X |
| **Implemented provider** | Typed + runtime connectable | **Instagram only** |
| **Enabled provider** | Implemented + fail-closed gates ON | None in Production (gates OFF) |

Planned ≠ implemented ≠ enabled.

### 4.2 Rollout waves

| Wave | Providers |
| --- | --- |
| Provider 1 | Instagram |
| Wave 2 | Facebook + Threads |
| Wave 3 | TikTok |
| Wave 4 | LinkedIn |
| Wave 5 | YouTube |
| Wave 6 | Pinterest + X |

Wave order may be refined only with documented dependency/compliance justification.

### 4.3 Login / authorization product

Keep `provider` and authorization-product separate.

- Instagram Provider-1: `instagram_login`
- Future providers may use `facebook_login`, provider-native OAuth, API keys, or other products
- Do **not** force every provider into Instagram Login semantics

### 4.4 Account identity

Generic connection identity fields:

| Field | Role |
| --- | --- |
| `external_account_id` | Provider-stable account key |
| `display_name` / handle | Safe display |
| `provider_account_kind` | Provider-specific typed extension (page, channel, profile, business, creator, …) |

Instagram `business | creator` remains **Instagram-specific**.  
Do not force all providers into that enum.

### 4.5 Compliance matrix posture

Provider capability/compliance entries must use:

- `verified-current`
- `requires-provider-verification`
- `unknown`

Do not invent unsupported capabilities. Mark unresolved items explicitly before the phase that needs them.

---

## 5. Capability architecture

### 5.1 Principle

Core logic asks capability questions, not provider-name branches.

Existing Beta 1 capability IDs remain authoritative for Instagram snapshot CHECKs:

```text
publish_image
publish_video
publish_carousel
publish_story
publish_short
schedule_via_provider
fetch_metrics
account_insights
```

### 5.2 Availability states

```text
supported
unsupported
unavailable
requires_permission
requires_reauthorization
temporarily_unavailable
```

Unsupported/unavailable must **fail explicitly** — never silent no-op or fake success.

### 5.3 Resolution sources (ordered)

1. Provider capability defaults (documented)
2. Connection-granted scopes / permissions
3. Account-specific discovery snapshot
4. Feature gates
5. Connection lifecycle/health overlays

Browser input cannot grant capabilities.

### 5.4 Snapshot behavior

Atomic snapshot replacement; observed timestamp; provider/account binding; unknown capability strings rejected at trust boundary (as B CHECK already does for Beta 1 allowlist).

---

## 6. Tenant & ownership

Binding from B1.0 + B:

```text
Organization (tenant root)
  └── Brand (optional customer_id → existing customers)
        └── Social Workspace (1:1 Brand in Beta 1)
              └── Social Account Connections
              └── Campaigns / Content / Publications / …
```

Rules:

- Client = UI synonym for existing `customers` — **no second client table**
- Every operational row org-bound directly or via provable ownership chain
- Prefer composite FKs `(organization_id, foreign_id)` where repository patterns support them
- Browser-supplied IDs never grant authority; RPCs re-read membership/role

Target markets (agency, fitness, consultancy, …) share one schema; differences live in templates, presets, workflows, prompts, dashboards — not duplicate core tables.

---

## 7. Social Workspace

| Aspect | Contract |
| --- | --- |
| Purpose | Operational container for one Brand’s social management |
| Cardinality | Exactly 1 Workspace per Brand in Beta 1 |
| Ownership | Brand → Organization; optional Customer link on Brand |
| Existing `workspace_id` | Typed UUID on connections today; **physical FK added in SMM-B1.2** when `social_workspaces` exists |
| Agency | Multiple Brands/Workspaces per Organization; one Brand per client brand context |
| Lifecycle | Follows Brand archive; settings mutable |

Do not invent unsafe dangling FKs before B1.2.

---

## 8. Brand Brain

Relational where stable; structured validated JSON for configuration clusters.

| Concept | Representation | Scope |
| --- | --- | --- |
| Brand profile | Relational (`social_brands`) | **BETA 1 REQUIRED** |
| Tone / positioning / visual rules / CTA / prohibited topics | Structured config (validated JSON or child tables) | **BETA 1 REQUIRED** (minimal) |
| Audiences | Relational or structured | **BETA 1 OPTIONAL** |
| Content pillars | Relational | **BETA 1 REQUIRED** |
| Competitors | Relational/light | **POST-BETA 1** or optional |
| Offers/products | Prefer link to existing product concepts where possible | **BETA 1 OPTIONAL** |

Brand truth (user-entered / verified) ≠ AI interpretation.

---

## 9. Strategy & Campaign

Provider-neutral campaigns may span multiple providers/accounts.

| Object | Notes | Scope |
| --- | --- | --- |
| `social_campaigns` | Goals, dates, status, ownership, workspace | **BETA 1 REQUIRED** |
| Campaign platform targeting | Which providers/accounts in scope | **BETA 1 REQUIRED** |
| Strategy templates | Workspace/brand configuration | **BETA 1 OPTIONAL** |

No per-provider campaign table clones.

---

## 10. Master Content → Variant → Publication

Critical separation:

```text
Master Content Item
  └── Platform Variant(s)
        └── Publication(s)
              ├── Attempts
              └── Events
```

### Master Content

Owns idea-level truth: campaign link, pillar, origin (human/AI-assisted), workspace ownership, current version pointer.

Does **not** own provider publication state.

### Platform Variant

Provider/account-oriented expression: caption, title, CTA, hashtags, media selection, aspect, format, hooks.

Common fields relational; provider-specific knobs via typed extension or controlled JSON — not one giant `provider_data jsonb`.

### Publication

Scheduled/immediate delivery of a variant to a connection.

Separate from content lifecycle and approval lifecycle.

---

## 11. Media assets

Shared asset library:

```text
social_media_assets
social_content_media (join / attachment)
```

One asset may attach to many content items/variants/publications.

Store storage references, mime, dimensions, duration, checksum, processing state, rights, alt text — **not** large binaries in Postgres rows.

Scope: **BETA 1 REQUIRED** (foundation).

---

## 12. Versioning & approval

### Versions

Immutable historical versions for agency/review flows. Current version pointer on master/variant as designed. No silent overwrite of approved content.

### Approvals

Distinct domain from content and publication.

Beta 1: **internal staff approval only** (B1.0 lock). Client portal approval deferred.

Approving a version; content change after approval invalidates approval for publish.

Audit approval decisions append-only.

Scope: **BETA 1 REQUIRED**.

---

## 13. Calendar & scheduling

Calendar is a **projection** over scheduled publications/content — not a second scheduling source of truth.

Scheduling requires lifecycle reasoning (not only `scheduled_at`): timezone (workspace IANA), edit-after-schedule rules, approval invalidation, DST.

Workers/jobs are later phases; D defines boundaries only.

---

## 14. Publishing, attempts, idempotency

```text
Publication
  └── Publication Attempt (immutable operational trail)
  └── Publication Event (append-only where needed)
```

Failed provider calls must not corrupt content state.

Idempotency required for create/retry publication, webhook ingest, analytics ingest, interaction ingest, CRM lead creation, automation execution.

Never store tokens/secret payloads on attempts/events.

Suggested publication lifecycle (refine in B1.6 if needed):

```text
draft → ready → scheduled → queued → processing → published | failed | cancelled
```

### B1.6 implementation refinement (additive)

B1.6 implements provider-neutral Publication / Attempt / Event infrastructure with lifecycle:

```text
pending | queued | claimed | processing
→ succeeded | cancelled | failed_retryable | failed_terminal
| manual_intervention | unknown_external_outcome
```

Publication binds exact `variant_version_id` + `social_account_connection_id`. Attempts are race-safe and immutable after completion. System claim/complete RPCs live in `private` (not granted to `authenticated`). Empty publishing adapter registry fails closed (`provider_adapter_unavailable`). Instagram live publishing remains **not implemented** (B1.7).

### B1.7 Instagram vertical (additive)

B1.7 attaches the first real `SocialPublishingAdapter` for Instagram Login (`graph.instagram.com`, pinned Graph version in server config). OAuth least-privilege scopes include `instagram_business_content_publish`. Media delivery uses short-lived HMAC-signed HTTPS URLs (no public bucket). Production publishing gate remains OFF; controlled live publish verification is separately authorized.---

## 15. Provider extension strategy

| Pattern | When |
| --- | --- |
| Universal relational field | Shared semantics across providers |
| Provider-specific typed extension | Operationally important differences |
| Controlled validated JSONB | Truly variable provider metadata, bounded, runtime-validated |

Reject dumping arbitrary provider response blobs.

---

## 16. Analytics

Two layers:

1. **Provider-native observations** — exact provider semantics (do not falsely equate)
2. **Normalized metrics** — only where genuinely comparable

Metric definition registry + snapshots/observations with window, entity, timestamps, dedupe, retention.

No giant analytics JSON blob as truth.

AI insights are **not** analytics observations.

Scope: foundation **BETA 1 REQUIRED** (B1.8); advanced multi-touch attribution **POST-BETA 1**.

---

## 17. Operational vs analytical vs AI

| Layer | Examples |
| --- | --- |
| Operational | connection, campaign, content, approval, publication, interaction |
| Analytical | metric snapshots, aggregates, attribution results |
| Intelligence | hypothesis, recommendation, pattern, experiment, insight |

Provenance kinds: `provider_observed`, `user_entered`, `system_derived`, `ai_inferred`, `manually_verified`.

AI output must not overwrite measured/provider/user truth.

---

## 18. Interactions, inbox, classification

Provider-neutral interaction model (comment/reply/mention/message where APIs exist).

Social Inbox = **projection** over interactions + assignment/status + Attention/CRM links — not necessarily a duplicate `social_inbox` truth table.

AI classification is separate from raw interaction evidence.

Private messaging may require stricter access than public comments.

Scope: **BETA 1 OPTIONAL** / foundation in B1.9; full DM parity **FUTURE / PROVIDER DEPENDENT**.

---

## 19. Story Autopilot & repurposing

### Story Autopilot (architecture only)

```text
coverage rule → gap → candidate → draft → approval/explicit autopilot → publication
```

Distinguish suggestion / draft / approved / authorized autopilot / published.

### Repurposing

Preserve provenance: source content → derived variants across providers. Always approval-gated unless explicit autopilot class allows otherwise.

---

## 20. Cross-domain integrations

### Attention

Do **not** create `social_attention_items`.

```text
Social evidence/event → Attention Signal → existing Attention Item lifecycle
```

Social `source_type` / rules owned by SMM-B1.9 (+ Attention contract extension).

### CRM

Reuse `customers` / `leads`. Social stores references; CRM remains source of commercial truth. Prevent duplicate lead creation via idempotency keys.

### Revenue attribution

Future analytical layer. Distinguish observed source, tracked conversion, inferred attribution, multi-touch, manual. Do not claim deterministic attribution when only correlation exists.

### Automation / autopilot governance

Trigger → condition → proposed action → authorization class → execution → audit.

Action classes: `observe_only`, `recommend`, `draft`, `approval_required`, `explicit_autopilot_allowed`, `never_autonomous`.

---

## 21. Provider adapter architecture

Target code shape (future refactor plan — no mass move in D):

```text
src/features/social-media/
  domain/          # universal contracts (growing)
  providers/
    instagram/     # current modules migrate here later
    facebook/
    …
  server/          # shared security (crypto, intents, gates)
```

Capability-segmented seams:

```text
connection | publishing | analytics | community | messaging
```

No God-interface requiring every provider to stub unsupported operations.

Current Instagram modules remain in place as Provider-1 reference until a later authorized refactor phase.

---

## 22. Security, RLS, audit, privacy

### Security per object

Document for each Beta 1 table: org ownership, workspace ownership, read/mutation roles, browser readability, secret sensitivity, audit need.

Preserve B patterns: SECURITY DEFINER + empty `search_path`; no casual application service-role client.

Background jobs must prove tenant context without casually introducing broad service-role access — options to evaluate in worker phases: narrow SECURITY DEFINER job RPCs, scoped job tokens, or owner-approved service-role with minimal grants. **D does not add service-role.**

### RLS philosophy

| Class | Examples |
| --- | --- |
| Member-readable | workspace, safe connection metadata, campaigns, content, calendar projections |
| Restricted admin | some audit/admin surfaces |
| Private/server-only | credentials, OAuth intents, limiter internals, secret provider config |

### Audit high-value actions

Connection lifecycle; approvals; publication transitions; provider mutations; autopilot executions; destructive/archive; security config. Not every metric ingest.

### Privacy

Store only product-necessary provider data; retention; sensitive interaction handling; credential isolation; export/delete considerations — without overclaiming compliance.

---

## 23. Feature gates

Conceptual hierarchy (exact env names finalized per phase):

```text
SOCIAL_ENABLED / SOCIAL_CONNECTIONS_ENABLED
SOCIAL_PUBLISHING_ENABLED
SOCIAL_ANALYTICS_ENABLED
SOCIAL_COMMUNITY_ENABLED
+ provider-specific gates where required (e.g. SOCIAL_INSTAGRAM_*)
```

Fail closed. Production remains OFF until owner-authorized enablement.

---

## 24. Failure & observability

Failure classes: authorization, expired credential, missing permission, rate limited, invalid media, provider rejected, temporary outage, unsupported capability, duplicate publication, approval missing, configuration missing.

Observability: operation id, org/workspace, provider, object id, safe status — never tokens/state/code/secrets.

---

## 25. Relationship diagram

```text
Organization
└── Brand (optional customer_id → customers)
    └── Social Workspace
        ├── Social Account Connections → private credentials / oauth intents / events
        ├── Brand Brain config / pillars / rules
        ├── Campaigns
        │     └── Master Content Items
        │           ├── Versions
        │           ├── Variants ── Media attachments
        │           ├── Approvals / review events
        │           └── Publications
        │                 ├── Attempts / events
        │                 └── Metric observations
        ├── Interactions → AI classifications (separate)
        └── AI insights / recommendations (separate)

Social ──→ Attention (signals)
Social ──→ CRM (leads/customers references)
Social ──→ Attribution (analytical, later)
```

---

## 26. Proposed database object catalog

| Object | Scope | Phase |
| --- | --- | --- |
| `social_brands` | BETA 1 REQUIRED | B1.2 |
| `social_workspaces` | BETA 1 REQUIRED | B1.2 |
| Connection tables (existing) | BETA 1 REQUIRED | B1.1 done |
| Brand rules/pillars/config | BETA 1 REQUIRED | B1.3 |
| `social_campaigns` (+ platforms) | BETA 1 REQUIRED | B1.3 |
| `social_content_items` | BETA 1 REQUIRED | B1.4 |
| `social_content_variants` | BETA 1 REQUIRED | B1.4 |
| `social_content_versions` | BETA 1 REQUIRED | B1.5 |
| `social_media_assets` / joins | BETA 1 REQUIRED | B1.4 |
| Approvals / review events | BETA 1 REQUIRED | B1.5 |
| `social_publications` / attempts / events | BETA 1 REQUIRED | B1.6 |
| Metric definitions / observations | BETA 1 REQUIRED | B1.8 |
| Interactions / classifications | BETA 1 OPTIONAL | B1.9 |
| AI insights / recommendations | BETA 1 OPTIONAL | B1.8 |
| Automation rules | BETA 1 OPTIONAL | B1.9+ |
| Ads / listening / influencer | FUTURE | deferred |

Names are candidates; phases own exact SQL.

---

## 27. Provider CHECK generalization plan

Current: hard Instagram CHECKs.

Future additive transition:

1. Introduce expanded allowlist only when Wave N is authorized
2. Keep existing Instagram rows valid
3. Preserve typed TS `ImplementedSocialProvider` expansion in lockstep
4. Never switch to unconstrained free text
5. No destructive rewrite of A/B/C evidence or data

---

## 28. Migration dependency roadmap (future only)

| Phase | Purpose | Risk |
| --- | --- | --- |
| B1.2 | brands, workspaces; add connection workspace FK | Medium — backfill/typed IDs |
| B1.3 | brand brain + campaigns | Low–medium |
| B1.4 | content, variants, media | Medium |
| B1.5 | versions, approvals | Medium |
| B1.6 | publications, attempts, events | Medium–high |
| B1.7 | Instagram publishing vertical (adapter + scopes) | High (provider) |
| B1.8 | metrics + intelligence tables | Medium |
| B1.9 | interactions + Attention source extension + CRM refs | Medium |
| B1.10 | multi-provider CHECK expansion foundation + prod verification | High |

`NO DATABASE MIGRATION AUTHORIZED` in D itself.

---

## 29. Beta 1 product loop

```text
Connect account (Provider-1 Instagram)
→ Configure Workspace / Brand Brain
→ Campaign
→ Master content + variant + media
→ Review / approve
→ Schedule
→ Publish (controlled)
→ Collect performance
→ Analyze / recommend next action
```

Community/CRM/attribution: foundation in B1.9 if feasible; not unbounded.

---

## 30. Recommended SMM-B1.2–B1.10 ownership

| Phase | Owns |
| --- | --- |
| **SMM-B1.2** | Social Workspace + Brand foundation; physical workspace FK; settings/UI shell |
| **SMM-B1.3** | Brand Brain + Strategy + Campaign foundation |
| **SMM-B1.4** | Master Content + Platform Variants + Media foundation |
| **SMM-B1.5** | Calendar projection + Versioning + Review/Approval |
| **SMM-B1.6** | Publishing infrastructure (publication/attempt/event/idempotency) |
| **SMM-B1.7** | Instagram complete vertical publishing integration (Provider-1 depth) |
| **SMM-B1.8** | Analytics + AI optimization + repurposing foundation |
| **SMM-B1.9** | Community/Inbox foundation + CRM/Attention integration |
| **SMM-B1.10** | Multi-provider expansion foundation + Beta 1 integrated Production verification |

This **refines** B1.0’s titles for Universal Social OS clarity while preserving B1.0 Brand/Workspace/Client locks and approval-first publishing philosophy.

---

## 31. Testing strategy for later phases

Domain typed tests; migration static security; live local SQL; RLS/RPC/cross-tenant; provider adapter contract tests with mocked HTTP; idempotency/concurrency/lifecycle; client-safe static scans; route tests; typecheck/lint/build; Production verification only when separately authorized.

---

## 32. Scale assumptions (Beta 1)

Single-region Postgres; org/workspace listing indexes; publication due-time indexes; content/campaign filters; metric/interaction lookups. No premature distributed systems.

---

## 33. Explicitly deferred

Paid ads manager; influencer marketplace; public-internet social listening; competitor scraping; browser automation; unsupported/private APIs; auto-DM spam; mass outreach; follower/engagement manipulation; account farming.

Use supported integration models only.

---

## 34. Anti-chaos checklist

| Smell | Status |
| --- | --- |
| Provider names in core business logic | Mitigated by capability-driven design |
| Separate content/campaign/analytics tables per provider | ABSENT (forbidden) |
| Target-market-specific core tables | ABSENT (forbidden) |
| Arbitrary provider JSON dumping | Mitigated by extension strategy |
| God provider interface | Mitigated by segmented adapters |
| Duplicated Attention/CRM | ABSENT (reuse) |
| Publication mixed with content/approval | Separated by contract |
| Analytics mixed with AI inference | Separated by provenance |
| Open-ended status strings | Finite contracts required |
| Tenant only in UI | DB ownership + RPC re-read |
| Destructive A/B/C rewrite | Forbidden |
| Casual service-role | Forbidden without owner decision |

---

## 35. Open decisions (`PROVIDER VERIFICATION REQUIRED`)

| Topic | Before phase | Safe default |
| --- | --- | --- |
| Exact Facebook/Threads connection model & scopes | Wave 2 | Unimplemented; fail closed |
| TikTok Direct Post vs inbox modes for Beta | Wave 3 | Unimplemented |
| LinkedIn org vs personal page semantics | Wave 4 | Unimplemented |
| YouTube quota/audit requirements | Wave 5 | Unimplemented |
| Pinterest/X publishing support depth | Wave 6 | Unimplemented |
| Instagram insights permission exact string beyond basic | B1.7/B1.8 | Request least privilege; mark unknown |
| Instagram Story Autopilot automation legality/UX | B1.7+ | Approval-required default |
| Webhook field availability per provider | B1.6–B1.9 | Polling-first where uncertain |

---

## 36. Source-of-truth map

| Concern | Owner |
| --- | --- |
| Connection status | Social connection domain |
| Credentials | Private credential domain |
| Content | Content domain |
| Approval | Approval domain |
| Publication result | Publication domain |
| Provider performance | Analytics observations |
| AI hypothesis | Intelligence domain |
| Lead/customer | CRM (`leads`/`customers`) |
| Attention lifecycle | Attention domain |

---

## 37. Architecture decisions (ADR summary)

1. **Universal Social core** — one OS, many adapters  
2. **Capability-driven behavior** — not provider-name branching  
3. **Master → Variant → Publication** — separated lifecycles  
4. **Shared media assets** — reuse across variants/publications  
5. **Raw vs normalized analytics** — no false equivalence  
6. **Operational / analytical / AI separation** — provenance enforced  
7. **Reuse Attention & CRM** — no parallel products  
8. **Provider-neutral DB** — Instagram CHECKs remain until additive expansion  
9. **Target-market-independent schema** — configuration, not table forks  
10. **Migration-safe** — A/B/C preserved as Provider-1 reference  

---

## 38. Non-goals of this document

No SQL applied; no Production mutation; no OAuth; no gate enablement; no fake multi-provider runtime; no SMM-B1.2 start.
