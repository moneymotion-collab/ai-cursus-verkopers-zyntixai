# SMM-B1.0 — Social Media Management Domain, Security & Data Contract

| Field | Value |
| --- | --- |
| Phase | **SMM-B1.0 — Domain, Security & Data Contract** |
| Product track | **ZyntixAI Social Media Management Beta 1** |
| Document type | Design, security and data contract (**documentation only**) |
| Date | 2026-08-14 |
| Formal status | `AUTHORITATIVE — PUBLISHED` |
| Owner authorization | `OWNER APPROVED — AUTHORIZE SMM-B1.0 AGAINST CURRENT HEAD 5d59a205bc83f7cf998c21836b02eda550856046` |
| Prior stop | Previous SMM-B1.0 attempt correctly stopped on stale HEAD `b2a86ba9…`; no SMM docs existed |
| Governing standard | `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Design baseline | `5d59a205bc83f7cf998c21836b02eda550856046` |
| Location convention | `docs/phases/` — `docs/design/` does **not** exist; PX2.0 / B1.7.0 / NBA / Invitations contracts live here |
| Course Sellers Beta 1 | Closed and **not reopened**. Social Media Management was explicitly outside that program. |
| CB-Q1 | Intentionally paused. This track must not resume it. |

**Implementation is not authorized by this contract.** Names below are design candidates until a later phase is separately authorized to implement them.

```text
SMM-B1.0 CLOSED WITH EVIDENCE — SOCIAL MEDIA DOMAIN, SECURITY, AND DATA CONTRACT READY
```

This means: Beta 1 domain, security, and data semantics are locked for B1.1–B1.10.

This does **not** mean: OAuth exists, tokens exist, accounts are connected, or content can be published.

---

## 1. Executive scope

### 1.1 What ZyntixAI Social Media Management is

ZyntixAI Social Media Management Beta 1 is an **organization-scoped, approval-first, provider-neutral** operating system for planning, reviewing, scheduling, and **controlled** publishing of organic social content for Brands, then turning provider results into Attention, Next Best Action, and a Daily Command Center.

It is **not**:

- a paid-ads manager;
- a social-listening / scraping product;
- a DM/comment inbox or chatbot;
- an influencer marketplace;
- an autonomous publisher that bypasses human approval by default.

### 1.2 Authorized SMM-B1.0 work

Docs/design/security-contract only: discovery, reuse matrix, domain semantics, entities, tenant/permission/lifecycle contracts, provider-neutral security, publishing/idempotency, Story safety, AI/analytics evidence model, Attention/NBA integration contracts, threat model, B1.1–B1.10 boundaries, in-scope/deferred matrices, owner-decision register.

### 1.3 Explicitly not authorized in SMM-B1.0

Database migrations; provider SDKs; OAuth; token storage; provider API calls; account connection; publishing; Stories; analytics ingestion; webhooks; Production application changes; Production deployment; CB-Q1; CB-PUB; invitation-gate changes.

### 1.4 Official roadmap (locked)

| Phase | Title |
| --- | --- |
| SMM-B1.0 | Domain, Security & Data Contract (this document) |
| SMM-B1.1 | Social Account Connections & Credential Foundation |
| SMM-B1.2 | Client / Brand Social Workspace |
| SMM-B1.3 | Content Creation & AI Assistant |
| SMM-B1.4 | Content Calendar, Campaigns & Scheduling |
| SMM-B1.5 | Approval & Versioning Workflow |
| SMM-B1.6 | Controlled Publishing Engine |
| SMM-B1.7 | Story Continuity & Automation |
| SMM-B1.8 | Analytics & Performance Intelligence |
| SMM-B1.9 | Operations + Attention + NBA + Daily Command Center |
| SMM-B1.10 | Production Security, Closed-Beta QA & Publication |

Do not start SMM-B1.1 from this document.

### 1.5 Definition of “100% complete” for Social Media Management Beta 1

After SMM-B1.10 closes:

- no known open gap against the explicitly approved Beta 1 scope in §40–§41;
- every required capability is assigned to an authoritative phase;
- each phase has explicit acceptance/closure criteria;
- security boundaries defined before implementation;
- every external side effect has authorization + idempotency;
- every stateful object has lifecycle semantics;
- every tenant-bound object has Organization isolation;
- every role-sensitive operation has a permission contract;
- every deferred item is named and justified;
- all known blockers are resolved or recorded as owner decisions.

It does **not** mean unknown software defects can never exist.

---

## 2. Beta 1 workflow (locked)

### 2.1 Happy path

```text
Organization
  → Customer Account (optional) / Brand
  → Social Workspace
  → Social Account Connection
  → Content Planning
  → Content Creation
  → Review / Approval
  → Schedule
  → Controlled Publishing
  → Provider Result
  → Performance Data
  → Analysis
  → Attention
  → Next Best Action
  → Daily Command Center
```

### 2.2 Exceptional flows (first-class)

| Exception | Authoritative handling |
| --- | --- |
| Credentials expired | Connection → `reauthorization_required`; no publish; Attention signal `social_account_reauthorization_required` |
| Provider permission revoked | Connection → `revoked` or `permission_missing`; scheduled jobs do not execute; Attention |
| Content rejected / changes requested | Content Item → `changes_requested`; approval invalidated for that version; schedule not executable |
| Approval overdue | Content remains `in_review`; Attention `approval_overdue`; no publish |
| Scheduled post cancelled | Publication Job → `cancelled`; Content Item stays `approved` unless separately archived |
| Provider submission failed | Attempt terminal `failed` with normalized category; Job `failed` or retryable per taxonomy; no blind duplicate |
| Ambiguous provider timeout | Attempt `submission_unknown`; **no blind retry**; reconcile; Attention `publication_result_unknown` |
| Duplicate publish attempt | Same idempotency identity; additional attempts attach to the same Publication Job |
| Account disconnected | Connection `disconnected`; future jobs blocked; historical External Publications retained |
| Missing asset | Content cannot enter `in_review`/`approved` for variants that require the asset; Attention `missing_asset` |
| Missed content slot | Schedule Entry `missed`; Attention `schedule_risk`; no silent late publish unless late-execution policy allows |
| Story coverage gap | Derived Gap; Attention `story_coverage_gap`; Recovery Action is recommend-only unless automation mode + approval allow |
| Analytics unavailable | Metric Snapshot not invented; Performance Insight must not fabricate facts; Attention optional `analytics_unavailable` |

---

## 3. Existing-foundation reuse matrix

Inspected repository truth. Do not duplicate these subsystems.

| Capability | Existing ZyntixAI foundation | Reuse directly | Extend | New SMM object required | Reason |
| --- | --- | --- | --- | --- | --- |
| Organization | `public.organizations` | Yes | No | No | Tenant root. Every SMM object must FK to exactly one Organization. |
| Users / profiles | `auth.users` + `public.profiles` | Yes | No | No | Actor identity. Email remains on `auth.users`. |
| Members | `public.organization_members` | Yes | No | No | Authorization root: active membership. |
| Roles | `owner` \| `admin` \| `staff` \| `viewer` | Yes | No new global roles | No | Confirmed in membership CHECK + domain permissions. |
| Authentication | Supabase Auth; SSR publishable-key clients only; **no app service-role client** | Yes | No | No | Browser never holds provider secrets. |
| Customer / client | `public.customers` | Yes | Optional FK from Brand | No second client table | Canonical client object already exists. |
| Tasks | `public.tasks` | Optional later | No auto-create from NBA | No SMM-task duplicate | Follow-up work may deep-link later; NBA remains recommend-only. |
| Appointments | **Absent** | N/A | N/A | No | Not required for Beta 1 scheduling of social content. |
| Attention | `attention_items` + `attention_signals` + `attention_item_events` | Yes | New `source_type` / rule keys in B1.9 | No parallel queue | Do not invent a second Attention product. |
| NBA | Derived-first catalog; recommend-only; no NBA table | Yes | SMM catalog entries in B1.9 | No NBA persistence table | Recommendation ≠ execution. |
| Audit / events | Per-domain append-only `*_events` / `*_history` | Pattern | SMM events table | Yes: `social_events` (candidate) | Do not reuse Attention or Invitation events for SMM. |
| Attachments / media | **Absent** (except `profiles.avatar_url` text) | No | N/A | Yes: Media Asset + storage ref | Do not store binaries in operational tables. |
| Notifications | **Absent** (invitation email only) | No | N/A | No | Out of SMM Beta 1. |
| Approvals | **Absent** as product | Pattern of RPC + events | N/A | Yes: SMM Approval | First-class SMM object; not a generic platform module. |
| Calendar / scheduling | Task `due_at` + org timezone only | Timezone helpers | N/A | Yes: Schedule Entry + Publication Job | Tasks are not a content calendar. |
| AI execution | **Absent** | N/A | Introduce in B1.3 | Advisory AI session/result objects | No LLM in repo today. |
| Idempotency | Invitation delivery `generation_key` + `idempotency_key` | Pattern | Apply to publish | Yes: Publication Job/Attempt | Proven external-effect pattern. |
| Provider adapter | `InvitationEmailProvider` / Resend | Pattern only | N/A | Yes: Social Provider Adapter | Do not reuse Resend for social APIs. |
| Feature gates | Server-only fail-closed env (`INVITATIONS_ENABLED`, etc.) | Pattern | New SMM env gates | No | Exact `"true"` enables; missing → false. |
| RPC / RLS | SECURITY DEFINER RPCs; `private.is_org_member` / `has_org_role`; deny-by-default | Yes | Domain helpers | No | Browser IDs never establish tenant authority. |
| AppShell / nav | `src/components/app-shell.tsx` | Yes | SMM nav in later UI phases | No | Members-style fail-closed visibility. |
| Background jobs / cron | **Absent** | N/A | Required from B1.6 | Abstract executor contract | Do not pick infrastructure in B1.0. |
| Storage buckets | **Absent** | N/A | B1.3 | Media storage backend | Choose in B1.3, not B1.0. |
| Evidence / fact labels | Governance docs (`FACT` / `INFERENCE` / `DEFERRED`) | Practice | Product claim classes in B1.3/B1.8 | No Evidence Gate module | Align AI insights with Fact vs Hypothesis. |
| Production QA | `docs/phases/` evidence + B1-GATE.1 | Yes | SMM-B1.10 | No | Docs-only phases do not claim Production Verified. |
| Invitations | `organization_invitations` + gates OFF | Isolate | No | No | CB-Q1 remains paused. SMM must not touch invitation gates. |

---

## 4. Canonical terminology (locked)

One name per concept. Competing aliases are forbidden in schema, RPC, and later contracts.

| Canonical term | Meaning | Not this |
| --- | --- | --- |
| **Organization** | Existing ZyntixAI tenant (`organizations`). Root of all SMM authorization. | Workspace, Brand, account |
| **Customer Account** | Existing org-scoped customer (`customers`). The Organization’s client when social work is done for a client. | Brand; auth profile; “Client” as a separate table |
| **Client** | UI synonym for Customer Account only. | A second entity |
| **Brand** | The identity represented on social platforms. New SMM object. | Customer Account; Social Workspace; provider account |
| **Social Workspace** | Operational container for one Brand’s social management. | Organization; provider account |
| **Social Provider** | External platform family (catalog value, e.g. a future owner-approved provider). | Connection; credential |
| **Social Account Connection** | Authorized link between a Workspace and one external social account. | Brand; credential secret |
| **Provider Credential Reference** | Server-only pointer + metadata for secrets. Never the secret itself in app payloads. | Access token; browser session |
| **Media Asset** | Org-scoped image/video/document metadata + storage reference. | Binary blob in operational DB |
| **Content Item** | Canonical work item for a piece of social content. | Variant; Publication Job |
| **Content Version** | Immutable snapshot of a Content Item at a point of review/approval/publish. | Mutable draft row used as publish source |
| **Content Variant** | Provider- or format-specific rendering of a Content Version (caption/media/placement). | Separate unrelated post |
| **Campaign** | Coordinated organic content set with objective and time window. | Paid ad campaign |
| **Schedule Entry** | Planned timing for a Variant against a Connection. Calendar is the UI over Schedule Entries. | Publication Attempt |
| **Approval** | Auditable human decision on a specific Content Version. | NBA recommendation; AI suggestion |
| **Publication Job** | Desired external publication of one approved Variant to one Connection. | Attempt; External Publication |
| **Publication Attempt** | One actual provider interaction. | The logical job |
| **External Publication** | Confirmed provider-side result (post/story/reel/etc.). | Job; Attempt |
| **Story Continuity Rule** | Desired Story coverage configuration for a Brand/Workspace. | A scheduled Story post |
| **Story Coverage Gap** | Time window where desired Story coverage is not met by planned + published coverage. | A Content Item |
| **Metric Snapshot** | Point-in-time ingested provider metric evidence. | Insight |
| **Performance Insight** | Derived interpretation referencing Metric Snapshots. | Raw truth |
| **Social Attention Signal** | Attention Signal whose source is an SMM object. Reuses Attention. | A new queue |
| **Social NBA** | NBA recommendation generated from SMM Attention/context. Reuses NBA. | An autonomous action |

### 4.1 Client / Brand / Workspace model (locked)

```text
Organization
  └── Customer Account? (optional)
        └── Brand (0..n per Customer)
  └── Brand (0..n first-party, customer_id NULL)
        └── Social Workspace (exactly 1 per Brand in Beta 1)
              └── Social Account Connection (0..n)
              └── Campaign / Content / Schedule / Publication
```

| Rule | Contract |
| --- | --- |
| Client ≠ Brand | **Separate objects.** Customer Account is the commercial relationship. Brand is the public identity. |
| One Customer, many Brands | **Allowed.** An agency client may have multiple Brands. |
| One Brand, many provider accounts | **Allowed** via multiple Social Account Connections on that Brand’s Workspace. |
| Social Workspace ownership | Belongs to **Brand**. Brand belongs to **Organization**. Brand **may** reference a Customer Account. |
| First-party Brand | **Allowed.** An Organization may manage its own Brand with `customer_id` NULL. |
| Brand without Workspace | **Not allowed in Beta 1.** Creating a Brand creates its Workspace (1:1). |
| Workspace without Brand | **Not allowed.** |
| Cross-customer Brand move | **Out of Beta 1.** Brand remains on its original Customer or first-party until a later authorized change. |

---

## 5. Entity model (conceptual; no migrations)

Names are **design candidates**. Implementation phases may keep them if they remain coherent.

### 5.1 Candidate objects

| Candidate | Purpose | PK | Org scope | Important FKs | Unique / invariants | Lifecycle | Mutability | RLS expectation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `social_brands` | Public identity | `id` | `organization_id` required | optional `customer_id`; `created_by_member_id` | unique `(organization_id, id)`; unique active name per org recommended | `active` \| `archived` | Mutable profile; archive orthogonal | Deny-by-default; SELECT active members; mutations Owner/Admin (Staff brand edit: see §8) |
| `social_workspaces` | Operational container | `id` | `organization_id` | `brand_id`; 1:1 Brand | unique `(organization_id, brand_id)` | follows Brand archive | Settings mutable | Same org; no cross-tenant ID trust |
| `social_account_connections` | Provider account link | `id` | `organization_id` | `workspace_id`, `brand_id` | one **active** connection per `(organization_id, provider, external_account_id)` | §12 | Status via RPC | SELECT members; connect/disconnect Owner/Admin |
| `social_provider_credential_refs` | Secret pointer + expiry/scopes | `id` | `organization_id` | `connection_id` | 1:1 with connection | tied to connection | Secret **never** selected to `authenticated` | `private` schema or non-granted columns |
| `social_oauth_states` | One-time OAuth CSRF/intent | `id` | `organization_id` | actor `user_id`, `workspace_id` | `state_hash` unique; single use | pending/consumed/expired | Insert/consume only | `private`; no SELECT to browser |
| `social_media_assets` | Media metadata | `id` | `organization_id` | `workspace_id`; `created_by_member_id` | storage_ref unique per org | `active` \| `archived` + validation state | Metadata mutable; bytes in storage | Org members; no public bucket listing |
| `social_content_items` | Work identity | `id` | `organization_id` | `workspace_id`; optional `campaign_id`, `customer_id` | unique `(organization_id, id)` | editorial status §15 | Identity stable | Members read; mutate per §8 |
| `social_content_versions` | Immutable snapshot | `id` | `organization_id` | `content_item_id` | monotonic `version_n` per item | created → (approved) → (published_as) | **Immutable** after create | Insert-only after freeze |
| `social_content_variants` | Provider/format rendering | `id` | `organization_id` | `version_id`, `connection_id` optional until schedule | unique `(version_id, provider, format)` where applicable | follows version | Frozen with version | Same |
| `social_campaigns` | Organic campaign | `id` | `organization_id` | `workspace_id` | unique `(organization_id, id)` | `draft` \| `active` \| `completed` \| `archived` | Mutable until archive | Members; mutate Owner/Admin/Staff |
| `social_schedule_entries` | Planned time | `id` | `organization_id` | `workspace_id`, `version_id`, `variant_id`, `connection_id` | one open entry per `(variant_id, connection_id)` | `planned` \| `cancelled` \| `missed` \| `consumed` | Time mutable until consumed | Staff+; Viewer read |
| `social_approvals` | Decision record | `id` | `organization_id` | `version_id`; `requested_by_member_id`; `decided_by_member_id` | one **current** decision per version; history retained | requested/approved/changes_requested/invalidated | Decision immutable; new row on re-review | Insert via RPC |
| `social_publication_jobs` | Desired external action | `id` | `organization_id` | `version_id`, `variant_id`, `connection_id`, optional `schedule_entry_id` | unique logical job per generation (§18) | §17 | Intent immutable; status via RPC | Mutations Owner/Admin/Staff per §8 |
| `social_publication_attempts` | One provider call | `id` | `organization_id` | `job_id` | many per job; idempotency_key unique | §17 | Append-only result fields after terminal | No secret payloads |
| `social_external_publications` | Confirmed provider result | `id` | `organization_id` | `connection_id`, `job_id` | unique `(connection_id, provider_publication_id)` | confirmed/unavailable | Immutable identity; metrics separate | Read members |
| `social_story_continuity_rules` | Desired Story coverage | `id` | `organization_id` | `workspace_id` / `brand_id` | one active rule per workspace | enabled/disabled/archived | Owner/Admin | Fail closed if disabled |
| `social_metric_snapshots` | Raw metric evidence | `id` | `organization_id` | `connection_id`; optional `external_publication_id` | unique per source/metric/window/observed_at as designed in B1.8 | append-only | **No overwrite of history** | Read members; ingest system |
| `social_performance_insights` | Derived interpretation | `id` | `organization_id` | workspace; evidence refs | N/A | generated | Immutable after generate; not raw truth | Read; generate Owner/Admin/Staff |
| `social_events` | SMM audit | `id` | `organization_id` | object refs | append-only | N/A | **No UPDATE** | SELECT Owner/Admin (Staff limited); Viewer none or metadata-only |

### 5.2 Relationships

```text
Organization 1──* Brand
Customer Account 0..1──* Brand
Brand 1──1 Social Workspace
Social Workspace 1──* Social Account Connection
Social Account Connection 1──0..1 Provider Credential Reference
Social Workspace 1──* Campaign
Social Workspace 1──* Content Item
Content Item 1──* Content Version
Content Version 1──* Content Variant
Content Version 1──* Approval
Content Variant + Connection + time → Schedule Entry
Approved Content Version + Variant + Connection → Publication Job
Publication Job 1──* Publication Attempt
Publication Job 0..1──1 External Publication (when confirmed)
External Publication 1──* Metric Snapshot
Metric Snapshot *──* Performance Insight (evidence link)
SMM objects → Attention Item (B1.9 source extension)
Attention Item → Social NBA (derived)
```

### 5.3 Deduplication / unique invariants (future DB)

1. One **non-disconnected** Social Account Connection per `(organization_id, provider, external_account_id)`.
2. One Social Workspace per Brand.
3. One Provider Credential Reference per Connection.
4. One External Publication row per `(connection_id, provider_publication_id)`.
5. One logical Publication Job per `(approved_version_id, variant_id, connection_id, publication_generation)`.
6. `idempotency_key` unique globally (or per organization) for attempts/jobs.
7. OAuth `state_hash` unique; single-use.
8. Metric snapshots append; do not collapse history into one mutable cell.

Do not rely on UI-only deduplication.

---

## 6. Organization ownership model

| Object | `organization_id` | `customer_id` | `brand_id` | `social_workspace_id` | `social_account_connection_id` | creator/member |
| --- | --- | --- | --- | --- | --- | --- |
| Brand | required | optional | self | — | — | `created_by_member_id` |
| Social Workspace | required | denormalized optional | required | self | — | — |
| Connection | required | — | required | required | self | `connected_by_member_id` |
| Credential ref | required | — | — | — | required | — |
| Media Asset | required | optional | optional | required | — | `created_by_member_id` |
| Content Item | required | optional | required | required | — | `created_by_member_id` |
| Content Version | required | — | — | required | — | `created_by_member_id` |
| Variant | required | — | — | required | optional until bound | — |
| Campaign | required | optional | required | required | — | `owner_member_id` |
| Schedule Entry | required | — | — | required | required | — |
| Approval | required | — | — | required | — | requested_by / decided_by members |
| Publication Job | required | — | — | required | required | `requested_by_member_id` or `system` |
| Attempt | required | — | — | required | required | actor source §20 |
| External Publication | required | — | — | required | required | — |
| Story rule | required | — | required | required | optional default connection | — |
| Metric Snapshot | required | — | — | required | required | system ingest |
| Performance Insight | required | — | — | required | optional | generator actor |

**Rule:** every tenant-sensitive SMM object traces to exactly one Organization. No unscoped globally accessible operational content.

Composite FKs `(organization_id, parent_id)` must be used as in Tasks / Attention / Invitations so a child cannot attach to a parent in another tenant.

---

## 7. Tenant-isolation contract

### 7.1 Authorization root

Existing **active Organization membership** is the root boundary (`private.is_org_member` / `private.has_org_role`; `organization_members.status = 'active'`). Suspended, invited, and removed members have no SMM access.

### 7.2 Fail-closed rules

1. Every SMM read/mutation RPC re-resolves `auth.uid()` → active membership → role. Client-supplied `organization_id` is a hint that must **match** membership; mismatch → `forbidden`.
2. Browser-supplied Brand / Workspace / Connection / Content IDs **never** grant access. The RPC loads the row and checks `organization_id` against the actor’s membership.
3. Provider callback parameters (OAuth `state`, `code`, account ids) **never** select tenant authority. Tenant comes from the **server-stored OAuth state** bound at initiation.
4. Webhooks resolve tenant from the **stored Connection** after signature verification, not from spoofable payload org fields.
5. AI retrieval is Organization-scoped and additionally Workspace/Brand/Customer-scoped to the intended context. **No global retrieval across Organizations.**
6. Analytics, insights, assets, and unpublished content follow the same org boundary.
7. NULL role is insufficient (same fail-closed rule as the historical lead/customer RPC fix).

### 7.3 RLS / RPC expectations (later DB phases)

| Layer | Expectation |
| --- | --- |
| Enable RLS + REVOKE ALL from `anon`/`authenticated` on new tables | Deny-by-default (Attention/Invitations pattern) |
| SELECT | Active org members for non-secret tables; Owner/Admin for archived where matching existing domains; **no SELECT** on credential secret columns |
| Mutations | SECURITY DEFINER RPCs only; `search_path = ''`; re-check membership and role |
| Secrets | `private` schema and/or encrypted vault; never granted to PostgREST |
| Composite FKs | `(organization_id, id)` unique on parents; children FK both columns |
| Service-role app client | **Must not be introduced** for SMM browser paths |

Cross-tenant IDs in the URL or JSON body must yield `not_found` / `forbidden` shapes that do not leak existence across tenants (match existing Attention/Task unavailable patterns).

---

## 8. Permission matrix

Existing roles only: `owner` \| `admin` \| `staff` \| `viewer`.

No new global roles in Beta 1. Workspace-level extra roles are **deferred**.

Legend: **Y** = allowed when object is in a legal state; **—** = denied; **OA** = Owner/Admin only.

| Operation | Owner | Admin | Staff | Viewer |
| --- | --- | --- | --- | --- |
| View Social Workspace / Brand (non-archived) | Y | Y | Y | Y |
| View archived Brand/Workspace | Y | Y | — | — |
| Create / edit Brand profile & rules | Y | Y | Y | — |
| Archive Brand / Workspace | Y | Y | — | — |
| Connect social account | Y | Y | — | — |
| Disconnect / revoke connection | Y | Y | — | — |
| Rotate / re-authorize credentials | Y | Y | — | — |
| Create / edit Content Item (draft) | Y | Y | Y | — |
| Submit for review | Y | Y | Y | — |
| Approve content | Y | Y | — | — |
| Request changes | Y | Y | — | — |
| Self-approve own content | Y | Y | — | — |
| Schedule / unschedule (approved version) | Y | Y | Y | — |
| Publish now | Y | Y | Y* | — |
| Cancel publishing | Y | Y | Y | — |
| Retry failed publishing | Y | Y | Y | — |
| Change automation mode / Story continuity enablement | Y | Y | — | — |
| Configure Story continuity bounds | Y | Y | — | — |
| View analytics | Y | Y | Y | Y |
| Generate AI drafts / analysis | Y | Y | Y | — |
| Override / dismiss AI recommendation (content) | Y | Y | Y | — |
| Override NBA (does not execute) | n/a — NBA is non-mutating | | | |
| Archive content | Y | Y | — | — |
| Inspect SMM audit history | Y | Y | Y (own/workspace operational events; no secrets) | — |
| Change kill-switch env | Deployment Owner (ops), not in-app Viewer/Staff | | | |

\* Staff **Publish now** is allowed only when: Content Version is approved, Connection is `connected`, publishing kill switch is ON, and workspace automation policy does not require a further Owner/Admin step. Staff still cannot connect accounts or change automation policy.

**Viewer is read-only** for all SMM mutations.

Database RPC remains authoritative. UI matrices are hints (same pattern as Attention/Customers).

---

## 9. High-risk external-effect policy

| Operation | Class | Who may execute | Notes |
| --- | --- | --- | --- |
| Connect social provider | High-risk | Owner/Admin | OAuth; credential create |
| Disconnect / revoke provider | High-risk | Owner/Admin | Must not destroy historical publications |
| Publish / publish now | High-risk | Owner/Admin/Staff per §8 | Approval-first; kill switch |
| Delete/remove provider-side content | **Deferred** | n/a in Beta 1 | See §41 |
| Enable autonomous / approved-scheduled publishing | High-risk | Owner/Admin | Default remains Manual |
| Change approval bypass | High-risk | Owner/Admin | Beta 1 has **no** approval bypass |
| Change automation mode | High-risk | Owner/Admin | Audit required |
| Credential rotation | High-risk | Owner/Admin | |
| Webhook / provider subscription changes | High-risk | Owner/Admin or system under Owner/Admin-connected account | B1.1/B1.6 |

Viewer must never mutate. Staff must never connect/disconnect/rotate credentials or enable automation.

---

## 10. Approval-first policy

**CONTRACT:** Human approval is authoritative before any external publishing, unless the workspace is explicitly set to **Approved Scheduled Automation** (§11), which still requires a prior human Approval of the **exact Content Version** to be published.

| Question | Locked answer |
| --- | --- |
| Who may approve? | Owner or Admin with active membership. |
| May creator self-approve? | **Only if** the creator’s role is Owner or Admin. Staff cannot approve their own (or anyone’s) content. |
| Client approval in Beta 1? | **Deferred.** Internal staff approval only. No client portal, signed link, or Customer-as-reviewer identity in B1.0–B1.10 unless a later owner decision expands Beta 1. |
| Approved content mutable? | The **Content Version** is immutable. The Content Item may receive a new draft version. |
| Edit after approval? | Creates a new draft version; previous Approval does **not** apply to the new version; item editorial status returns to `draft` (or stays `approved` only with respect to the old version, which is no longer current). Current version is unapproved. |
| Caption or media change | **Invalidates** current approval (new version required). |
| Schedule-only change | Does **not** invalidate content approval. |
| Scheduled job after content change | Open Publication Jobs referencing a **superseded** version must move to `cancelled` or `superseded` and must not publish. A new job is required for the newly approved version. |
| What is published? | Only an immutable **approved** Content Version ID + Variant ID. |

There is **no** “approval bypass” mode in Beta 1.

---

## 11. Automation modes

| Mode | Code | Beta 1 | Behavior |
| --- | --- | --- | --- |
| Manual | `manual` | **In scope — default** | AI may assist. Human triggers publish now or confirms execution. Scheduler does not publish without this explicit human publish action **or** a later mode. |
| Approved Scheduled Automation | `approved_scheduled` | **In scope — opt-in per Workspace, Owner/Admin** | Human Approval of a Version is complete; system may publish that Version at the approved Schedule Entry automatically. Still no AI-initiated publish. |
| Higher Automation | `higher_automation` | **Deferred** | Pre-authorized rules generate/schedule/publish without per-item human approval. Not in Beta 1. |

Default for every new Workspace: `manual`. Missing/unknown mode → `manual` (fail closed).

AI must not publish because it “thinks it is time.”

---

## 12. Social Account Connection lifecycle

Durable **connection_status** (do not collapse failures into `error`):

| Status | Meaning |
| --- | --- |
| `initiated` | Operator started connect; no provider grant yet |
| `authorization_pending` | OAuth in flight; state exists and is unconsumed |
| `connected` | Usable grant; capabilities recorded |
| `reauthorization_required` | Refresh failed or token expired; human re-auth needed |
| `permission_missing` | Grant exists but required provider permission/scope is absent |
| `revoked` | Provider or user revoked at provider; not a ZyntixAI disconnect yet |
| `disconnected` | Operator disconnected in ZyntixAI; credentials destroyed; history kept |

**Health overlay** (observed, not a substitute for status):

| Overlay | Meaning |
| --- | --- |
| `healthy` | Provider reachable; capabilities match last discovery |
| `degraded` | Partial capability loss or elevated error rate; still `connected` |
| `provider_unavailable` | Temporary outage / rate limit storm; **do not** rewrite status to `revoked` |

| Distinction | Contract |
| --- | --- |
| User disconnect | Operator → `disconnected`; destroy secrets; keep External Publications and jobs history |
| Provider revocation | → `revoked`; secrets unusable; Attention; operator may later disconnect |
| Expired credentials | → `reauthorization_required` after refresh failure |
| Temporary outage | Overlay `provider_unavailable`; status stays `connected` unless refresh proves otherwise |

Terminal-from-operator: `disconnected`. `revoked` is provider-terminal until re-auth creates a **new** generation of the connection (same row re-authorized or new row per B1.1 unique invariant).

---

## 13. Provider capability model

Capabilities are **derived per Connection** after discovery. They are never assumed globally.

| Capability key | Meaning |
| --- | --- |
| `publish_image` | Single image post |
| `publish_video` | Video post |
| `publish_carousel` | Multi-image/video |
| `publish_story` | Story |
| `publish_short` | Reel / Short / equivalent |
| `schedule_via_provider` | Provider-native schedule API (optional; ZyntixAI scheduler may still own timing) |
| `fetch_metrics` | Publication-level metrics |
| `account_insights` | Account-level insights |
| `comments` | Comment read/write — **Beta 1: not used** even if present |
| `delete_publication` | Provider-side delete — **Beta 1: not used** |
| `edit_publication` | Provider-side edit — **Beta 1: not used** |

Unsupported capability → validation_failed at Variant/Job creation. Adapters **must not** expose fake no-op success for unsupported operations.

**Provider selection:** FACT — no owner-approved first Social Provider exists in the repository (Instagram/Facebook/LinkedIn appear only as Lead `source_type` values). SMM-B1.0 remains provider-neutral.

```text
OWNER PROVIDER SELECTION REQUIRED BEFORE SMM-B1.1 EXTERNAL INTEGRATION
```

Potential provider names in this document are **examples**, not implementation commitments.

---

## 14. Credential security contract

| Principle | Contract |
| --- | --- |
| Server-only secrets | Access/refresh tokens never sent to the browser, never in `localStorage`/`sessionStorage`/cookies as provider tokens |
| No tokens in logs | Log connection id, provider, status, expiry; **never** token values |
| No tokens in evidence | Evidence docs record hashes/ids only |
| Storage | Application stores a **Provider Credential Reference**. Secret material in encrypted column **or** secret store / vault. B1.1 selects the mechanism; both must be org- and connection-bound |
| Least privilege | Request only scopes required for authorized capabilities |
| Expiry awareness | Store `expires_at`; treat unknown expiry as needing refresh/reauth policy |
| Refresh | Server-side only; failure → `reauthorization_required` |
| Revocation / disconnect | Destroy secret material; retain metadata + history |
| Rotation | New secret generation; old secret destroyed; audit without payload |
| Binding | Credential bound to `organization_id` + `connection_id` + provider + `external_account_id` |
| Audit | Events `account_connected` / `reauthorized` / `disconnected` with actor; no secret fields |

OAuth `code` is exchanged **server-side only**.

---

## 15. OAuth / callback security contract

Future B1.1 connect flow **must**:

1. Generate cryptographically strong `state` (unpredictable; hashed at rest).
2. Bind state to `user_id` (authenticated actor), `organization_id`, `workspace_id`, intended `provider`, and timestamp.
3. Expire state (short TTL).
4. Single use (`used_at` set; replay denied).
5. CSRF: callback `state` must match stored hash.
6. Trusted callback URL: allowlist of app origins; **no open redirect**; return path must be a safe relative path (reuse `safe-return-path` pattern).
7. Revalidate session actor on callback = actor who initiated.
8. Organization on callback comes from stored state, **not** from query `org` / `workspace` chosen by the provider.
9. Server-only code→token exchange.
10. After token receipt, bind `external_account_id`; reject if the provider account is already actively connected in the same Organization (unique invariant).

---

## 16. Content lifecycle

Editorial status lives on **Content Item**. Publishing status lives on **Publication Job**. They are not collapsed.

### 16.1 Content Item editorial statuses

| Status | Meaning |
| --- | --- |
| `draft` | Mutable working content (ideas live here; no separate `idea` status) |
| `in_review` | Frozen version submitted; waiting Owner/Admin |
| `changes_requested` | Reviewer requested changes; new draft version expected |
| `approved` | Current version has a valid Approval |
| `archived` | Orthogonal operational hide (Owner/Admin); not a publish state |

Rejected as Content Item statuses: `scheduled`, `publishing`, `published`, `failed`, `cancelled` — those belong to Publication Job / Schedule Entry.

### 16.2 Transitions

| Source | Target | Actor | Required | Side effects | Audit |
| --- | --- | --- | --- | --- | --- |
| (new) | `draft` | Owner/Admin/Staff | workspace active | create item + version 1 mutable until submit | `content_created` |
| `draft` | `in_review` | Owner/Admin/Staff | freeze version; required variant fields; assets valid | Approval row `requested` | `approval_requested` |
| `in_review` | `approved` | Owner/Admin | version frozen | Approval `approved`; item `approved` | `approved` |
| `in_review` | `changes_requested` | Owner/Admin | reason required | Approval `changes_requested` | `changes_requested` |
| `changes_requested` | `draft` | Owner/Admin/Staff | new version created | previous version retained | `content_version_created` |
| `approved` | `draft` | Owner/Admin/Staff (edit) | new version; invalidate current approval | supersede open jobs for old current version | `content_version_created` + approval invalidated |
| `draft` \| `in_review` \| `changes_requested` \| `approved` | `archived` | Owner/Admin | cancel open jobs | no provider delete | `content_archived` |
| any non-archived | cannot jump to published | — | publish is a Job, not this status | — | — |

Impossible: `archived` → publish; Viewer transitions; Staff `approved` without Owner/Admin; `draft` → Job execute.

---

## 17. Content versioning

| Question | Contract |
| --- | --- |
| Mutable before approval? | Working draft version is mutable until `in_review`. Submit freezes it. |
| Approved revision versioned? | Yes. Each submit/approval freeze is a Content Version. |
| Caption/media change invalidates approval? | **Yes.** New version required. |
| Schedule change invalidates approval? | **No.** |
| Edit previously published content internally? | Yes, as a **new** version. Does not edit the provider-side post (deferred). Historical published version remains the evidence of what went out. |
| Preserve what was published? | Publication Job stores `content_version_id` + variant snapshot keys; External Publication stores provider ids. |

Publishing **must** reference an immutable approved Content Version. If that version is not the item’s current version, the job is not eligible unless it is an already-in-flight attempt in `submission_unknown` (must still not switch payload).

---

## 18. Publication architecture

### 18.1 Three objects (do not collapse)

| Object | Question it answers |
| --- | --- |
| Publication Job | What do we intend to publish, where, and with which generation identity? |
| Publication Attempt | What did we actually send, when, and what did we learn? |
| External Publication | What exists on the provider? |

### 18.2 Publication Job statuses

| Status | Terminal? |
| --- | --- |
| `created` | No |
| `scheduled` | No |
| `due` | No |
| `submitting` | No |
| `submission_unknown` | No (blocked retry) |
| `published` | Yes (success) |
| `failed` | Yes (unless Owner/Admin/Staff creates a **new generation** retry job — see idempotency) |
| `cancelled` | Yes |
| `superseded` | Yes |

### 18.3 Publication Attempt statuses

| Status | Meaning |
| --- | --- |
| `started` | Lease claimed |
| `submitted` | Request sent; awaiting known result |
| `succeeded` | Provider confirmed; may create External Publication |
| `failed` | Known failure; normalized category |
| `submission_unknown` | Request sent; result uncertain |

### 18.4 External side-effect pipeline (binding for SMM-B1.6)

```text
Application intent
  → authorization (session + org + role + kill switch)
  → state/lifecycle validation (approved version, connection connected, capabilities)
  → idempotent operation identity (generation_key + idempotency_key)
  → provider adapter
  → provider response
  → persist Attempt + Job result
  → audit (no secrets)
```

The browser **must not** call provider APIs with provider credentials.

---

## 19. Publishing idempotency

Reuse the invitation-delivery pattern: **generation key** + **idempotency key** + attempts table.

| Concept | Contract |
| --- | --- |
| Publication generation | Stable logical identity for “this approved variant to this connection at this intended slot / publish-now act” |
| Operation key | `publish` \| `reconcile` (not `delete` in Beta 1) |
| Idempotency key | Opaque server key derived from org + job + generation + operation — no tokens, no captions |
| Unique logical job | Unique `(organization_id, version_id, variant_id, connection_id, generation_key)` |
| Attempts | Many rows per job; each attempt has its own id; retries **reuse** the job’s idempotency identity toward the provider when the provider supports it |

Must survive: double click, worker retry, browser retry, scheduler retry, timeout, ambiguous response.

A retry **must not** create a second public post unless an operator explicitly starts a **new generation** (new Job).

---

## 20. Ambiguous provider result

When ZyntixAI has sent a publish request but does not know whether the provider accepted it:

| Rule | Contract |
| --- | --- |
| State | Attempt and Job → `submission_unknown` |
| Retry | **Forbidden** to send a new publish payload |
| Identity | Preserve original generation + idempotency keys |
| Recovery | Adapter `query_publication` / reconcile if capability exists; else human Attention |
| Attention | `publication_result_unknown` until resolved to `published` or `failed` |
| Duplicate protection | Reconcile must attach to the existing Job/External Publication if the post exists |

This is a first-class failure mode, not `internal_error`.

---

## 21. Scheduling / timezone contract

| Topic | Contract |
| --- | --- |
| Storage | All authoritative timestamps `timestamptz` UTC (existing system pattern) |
| Organization timezone | Existing `organizations.timezone`; fallback UTC (`DEFAULT_ORGANIZATION_TIMEZONE`) |
| Brand/Workspace timezone | Required on Workspace for Story-day boundaries and calendar display; IANA name; invalid → UTC |
| Display | Convert UTC → workspace timezone in UI; browser locale is **not** authority |
| Schedule modification | Staff+ may change unconsumed Schedule Entries; does not invalidate content approval |
| Cancellation | Job → `cancelled`; Entry → `cancelled` |
| Late execution | If executor starts after scheduled UTC time: follow workspace policy `publish_if_late_within` (duration) else mark `missed` + Attention; **do not** silently publish hours later without bound |
| Missing approval at execution | Do not publish; Job `failed` / `cancelled` with `validation_failed`; Attention |
| Disconnected / expired credential at execution | Do not publish; Attention |
| Provider outage | Do not blindly duplicate; may retry with same idempotency only if no request was sent; if sent → `submission_unknown` path |
| Missed schedule | Entry `missed`; not auto-recreated |

---

## 22. Story continuity contract

### 22.1 Five concepts (separate)

| Concept | Meaning |
| --- | --- |
| Desired Coverage | Rule: e.g. at least one Story per brand-local day, or a defined window |
| Planned Coverage | Schedule Entries for Story variants in that window |
| Published Coverage | External Publications confirmed in that window |
| Coverage Gap | Desired not met by Planned ∪ Published |
| Recovery Action | Proposed Content / Schedule / NBA to restore coverage |

Gaps are detected; they are **not** an infinite publish loop.

### 22.2 Story automation safety (binding for B1.7)

| Control | Contract |
| --- | --- |
| Per-brand enablement | Default **OFF** |
| Timezone | Workspace IANA timezone |
| Maximum publish frequency | Required numeric ceiling (exact numbers = owner decision in B1.7; must exist) |
| Maximum daily automatic actions | Required ceiling |
| Approval | Obeys workspace automation mode; default Manual → no auto Story publish |
| Duplicate-content prevention | Same asset+caption generation cannot auto-repost inside a cooldown |
| Provider failure | No tight retry loop; `submission_unknown` rules apply |
| Kill switch | `SOCIAL_STORY_AUTOMATION_ENABLED` (env, fail closed) **and** per-workspace disable |
| Quiet / blackout windows | Optional; if set, no automatic Story jobs in window |
| Archived campaign / brand | Rules do not fire |
| Kill switch / disable | Immediate; in-flight unknown attempts still reconcile, no new jobs |

“Always keep a Story active” is **forbidden** as an unbounded retry policy.

---

## 23. Media Asset contract

Metadata only in operational DB. Bytes live in a storage backend chosen in B1.3.

Required metadata: `organization_id`, `workspace_id`, file type, content type, byte size, storage reference, source (`upload` \| `generated` \| `imported`), `created_by_member_id`, archived_at, safety/validation state (`pending` \| `valid` \| `rejected` \| `unsupported`), optional width/height/duration, provider compatibility flags.

Do not persist massive binaries in operational tables.

Malicious metadata: validate MIME/size/duration server-side; never trust client-declared type alone.

---

## 24. Campaign contract

Organic campaign only. Not a Meta/Google ads campaign.

Fields: workspace, objective, start/end (timestamptz), status, owner_member_id, optional KPI **targets** (not paid spend), content associations, archive.

Campaign existence must not require a provider-side campaign object.

Paid Ads Management is **outside** SMM Beta 1.

---

## 25. AI content contract (B1.3)

AI is **advisory/preparatory** unless a later explicit automation policy (not in Beta 1 higher_automation) authorizes side effects.

May: propose topics; draft captions; generate hooks; suggest CTA; create variants; analyze gaps; check brand rules; identify missing information; suggest schedule; summarize performance.

Must not: invent authoritative customer/company facts; publish; connect accounts; silently change approvals.

Human review remains required before `in_review` content is treated as ready (operator may edit AI drafts as their own).

### 25.1 Brand context classes (do not collapse)

| Class | Meaning | Example |
| --- | --- | --- |
| **FACT** | Known brand/client fact recorded by humans | Legal name; approved product claim |
| **PREFERENCE** | Brand guideline | Tone of voice; emoji policy |
| **AI_SUGGESTION** | Generated recommendation | Draft caption |

AI prompt assembly: Organization + intended Workspace/Brand/Customer only. Hard invariant: **no cross-tenant retrieval**.

---

## 26. Evidence / Fact-vs-Hypothesis model

Aligns with existing Evidence Gate **labeling practice** (not a runtime module today).

| Class | Meaning | Allowed wording |
| --- | --- | --- |
| **METRIC_FACT** | Provider snapshot value | “Reach was 12,400 in window W” |
| **OBSERVED_PATTERN** | Comparison without cause | “Post A reach was 32% higher than Post B in the same window” |
| **HYPOTHESIS** | Causal or explanatory claim | “The hook caused the increase” |
| **RECOMMENDATION** | Suggested next action | “Try a similar hook in the next Reel” |

Performance Insight rows must store class, source snapshot ids, window, baseline, `generated_at`, and model/version if AI-derived.

Unsupported causality presented as fact is a **contract violation** for B1.8.

---

## 27. Analytics data contract

Metric Snapshot required fields: provider, connection, optional external publication, metric name/key, value, provider reporting window, `observed_at`, ingestion timestamp, raw provider metric identity.

- Do **not** overwrite history; ingest a new snapshot if the provider revises a window (retroactive changes are additional snapshots, optionally marked `supersedes_snapshot_id`).
- Raw Provider Metric remains authoritative.
- Normalized Metric is optional and only where semantics truly align. Do not map unlike metrics because names sound similar.
- Preserve provider/source metadata on every snapshot.

---

## 28. Attention integration (no implementation in B1.0)

Reuse Attention Item + Signal + events. **Do not** create `social_attention_items`.

FACT: current `AttentionSourceType` is `"enrollment"` only. B1.9 must extend source types/rule keys under a separate implementation authorization.

### 28.1 Candidate signals / rule keys

| Signal / rule key | Typical source | Dedupe |
| --- | --- | --- |
| `social_account_reauthorization_required` | Connection | One open Item per connection |
| `provider_permission_missing` | Connection | One open Item per connection + capability |
| `scheduled_publication_failed` | Publication Job | One open Item per job |
| `publication_result_unknown` | Publication Job | One open Item per job |
| `approval_overdue` | Content Item | One open Item per item; refresh signal on re-detect |
| `missing_asset` | Content Item / Variant | One open Item per item+asset |
| `schedule_risk` | Schedule Entry | One open Item per entry |
| `content_gap` | Workspace / Campaign | One open Item per workspace+window key |
| `story_coverage_gap` | Workspace + rule | One open Item per workspace+gap window |
| `unusual_performance_drop` | Insight + snapshots | One open Item per publication+metric window |
| `campaign_deadline_risk` | Campaign | One open Item per campaign |
| `analytics_unavailable` | Connection | One open Item per connection+period |

Dedupe: if an open/acknowledged Item exists for the same org+rule+source, **record a new Signal** on that Item (Attention R1 pattern); do not flood duplicate Items.

Severity: connection/publish unknown → `high` or `critical`; overdue approval → `medium`/`high`; performance → evidence-based, not health scores.

---

## 29. NBA integration (no implementation in B1.0)

Reuse derived-first, recommend-only NBA. Catalog extension in B1.9. NBA still performs **no** provider mutation.

Candidate `actionType` values (design; not implemented):

| actionType | Meaning | Execution owner |
| --- | --- | --- |
| `reconnect_social_account` | Re-auth CTA | Existing B1.1 connection UI |
| `approve_social_content` | Focus approval | B1.5 controls |
| `upload_missing_media` | Asset upload | B1.3 |
| `review_failed_publication` | Job detail | B1.6 |
| `reconcile_unknown_publication` | Unknown result | B1.6 |
| `fill_story_coverage_gap` | Create/schedule Story | B1.7 + approval rules |
| `review_performance_insight` | Insight detail | B1.8 |

```text
Recommendation ≠ Decision ≠ Execution
NBA recommendation must never bypass publishing authorization.
```

Do not add `publish_now` as an NBA-executed action.

---

## 30. Daily Command Center contract (B1.9)

A start-of-day operational view, reusing AppShell + Attention list patterns — not a second product.

Must show, organization-scoped:

- content due today (workspace TZ);
- content waiting approval;
- scheduled publications;
- publishing failures + `submission_unknown`;
- provider connection problems;
- Story gaps;
- missing assets;
- customer/brand blockers;
- performance alerts (from insights/Attention);
- today’s Social NBA recommendations (derived).

Viewer: read-only. No command-center action may skip RPC authorization.

---

## 31. Audit / actor contract

### 31.1 Required events (names locked unless a later phase proves a collision)

| Event |
| --- |
| `account_connected` |
| `account_reauthorized` |
| `account_disconnected` |
| `content_created` |
| `content_version_created` |
| `approval_requested` |
| `approved` |
| `changes_requested` |
| `approval_invalidated` |
| `scheduled` |
| `schedule_changed` |
| `publication_started` |
| `publication_submitted` |
| `publication_confirmed` |
| `publication_failed` |
| `publication_cancelled` |
| `publication_unknown` |
| `automation_enabled` |
| `automation_disabled` |
| `story_rule_changed` |

Avoid noisy per-keystroke draft events.

### 31.2 Actor / source classification

Every important mutation stores `actor_source`:

| Value | When |
| --- | --- |
| `owner` \| `admin` \| `staff` \| `viewer` | Human role (viewer should not appear on mutations) |
| `client` | Reserved; unused in Beta 1 |
| `system_scheduler` | Job executor |
| `ai_assisted` | Human saved an AI draft (human still the member; flag `ai_assisted=true`) |
| `provider_webhook` | Inbound provider event |
| `reconciliation` | Unknown-result recovery |

Do not attribute scheduler/webhook/reconciliation to a human user id as if they clicked publish. Optional `actor_member_id` is null for pure system sources.

Provider credentials **never** enter audit payloads.

---

## 32. Privacy, retention, archive, deletion

### 32.1 Data classes

| Class | Examples | Logging |
| --- | --- | --- |
| Normal operational | captions, schedules, campaign titles | OK |
| Customer confidential | unpublished content, brand plans, performance | Org-scoped; no cross-tenant logs |
| Security-sensitive | provider tokens, OAuth state, raw provider secret responses | **Never** in logs/audit/evidence |
| External public identifiers | provider account/post ids | OK |

### 32.2 Archive vs delete

| Object | Default | On disconnect | Notes |
| --- | --- | --- | --- |
| Brand / Workspace / Campaign / Content | Archive (`archived_at`) | Retain | History remains |
| Connection | `disconnected` | Secrets destroyed | Row retained |
| Credentials | Destroy secret material | Destroy | Metadata may remain (expiry, provider, last4-not-applicable) |
| External Publications + snapshots | Retain | Retain | Needed for audit/analytics |
| OAuth state | Expire/delete after TTL | Delete | |
| Audit events | Retain | Retain | High-value; no casual delete |
| Metric snapshots | Retain (B1.8 retention window may be owner-set later; default retain through Beta 1) | Retain | |

Disconnecting a provider **must not** erase historical publication evidence.

### 32.3 Deletion policy (Beta 1)

Hard delete of Content Items, Jobs, Attempts, External Publications, and audit events is **not** a Staff/Viewer operation. Owner hard-delete of operational history is **deferred** (requires a later privacy phase). Archive is the operational cleanup path.

No cascading delete of audit/publication history when a Brand is archived.

Provider-side deletion of already-public content is **deferred** (§41).

---

## 33. Failure taxonomy

Normalized `failure_category` for Attempts and safe UI:

| Category | Meaning |
| --- | --- |
| `authorization_failed` | Actor/org/role/kill-switch denied |
| `credential_expired` | Token expired / refresh failed |
| `permission_missing` | Provider scope/permission missing |
| `provider_rate_limited` | Provider quota |
| `provider_unavailable` | Outage / 5xx / timeout before send |
| `validation_failed` | Content/variant/schedule invalid |
| `unsupported_media` | Asset incompatible |
| `rejected_by_provider` | Provider explicitly refused |
| `submission_unknown` | Sent; result uncertain |
| `external_not_found` | Reconcile could not find publication |
| `internal_error` | ZyntixAI defect |

Raw provider bodies are **not** shown in ordinary UI. Safe diagnostic metadata (request id, category, HTTP class) may be stored internally.

### 33.1 Rate limiting

| Layer | Purpose |
| --- | --- |
| ZyntixAI abuse protection | Per actor/org operation limits (pattern: invitation mutation rate limits) |
| Provider API limits | Platform quotas; adapter normalizes to `provider_rate_limited` |

These are **not** the same control.

---

## 34. Feature gates / kill switches

Future **server-only**, fail-closed env flags (exact `"true"` enables; missing/false → off). **Not** `NEXT_PUBLIC_*`. **Not** implemented in SMM-B1.0.

| Gate | Controls |
| --- | --- |
| `SOCIAL_CONNECTIONS_ENABLED` | OAuth/connect surfaces |
| `SOCIAL_PUBLISHING_ENABLED` | External publish RPCs |
| `SOCIAL_AUTOMATED_PUBLISHING_ENABLED` | `approved_scheduled` executor |
| `SOCIAL_STORY_AUTOMATION_ENABLED` | Story auto jobs |

UI hiding is insufficient. RPCs must re-check gates.

Like invitations: env change requires a deployment that uses that state; break-glass is rollback. Document this honestly in B1.10.

---

## 35. Background-job contract

FACT: no `pg_cron`, Inngest, or product worker exists. Attention rules are on-demand. Invitation expiry is timestamp-based.

SMM-B1.0 does **not** select infrastructure.

B1.4/B1.6 executor requirements:

| Requirement | Contract |
| --- | --- |
| Uniqueness | One claim per Job generation |
| Scheduled time | UTC `timestamptz` |
| Lease/claim | Exclusive lease with timeout; expired lease may be reclaimed only if no request was sent |
| Retries | Only for failures that are retry-safe (not `submission_unknown`, not `rejected_by_provider`) |
| Dead / failure | Terminal Job `failed` + Attention |
| Idempotency | §19 |
| Unknown reconciliation | Separate `reconcile` operation, same generation |
| Audit | `system_scheduler` actor |

Infrastructure selection is an SMM-B1.6 (or earlier dedicated) owner-authorized implementation choice.

---

## 36. Webhook security contract

No webhook implementation in B1.0. Future inbound webhooks **must**:

- verify provider signatures;
- reject unsigned/mismatched;
- replay protection (timestamp skew + event id uniqueness);
- idempotent processing per provider event id;
- map to Connection → Organization after verification;
- store raw payload only in a private, access-restricted store with retention; never log full payloads if they may contain tokens;
- ignore/record unknown event types without failing closed the verified pipeline;
- never trust payload tenant ids.

---

## 37. Provider adapter contract

Application logic must not hardcode one vendor SDK.

Adapter surfaces (capability-specific; no fake universal methods):

- `connect` / `refresh_authorization` / `disconnect`
- `discover_capabilities`
- `validate_content`
- `publish`
- `query_publication`
- `fetch_metrics`
- `normalize_webhook_event`

Adapters return normalized failure categories. Unsupported operations are explicit errors, not silent success.

---

## 38. Time model

- Authoritative stored timestamps: UTC `timestamptz`.
- Organization timezone: existing field; fallback UTC.
- Workspace timezone: Story-day and calendar grouping.
- Server-local timezone is **not** business authority.
- `profiles.timezone` is user preference for display only, not schedule authority.

---

## 39. Threat model

| # | Threat | Preventative control | Verify in |
| --- | --- | --- | --- |
| 1 | Cross-tenant social account access | Org membership + composite FKs + RPC re-check | B1.1, B1.2, B1.10 |
| 2 | Provider credential theft | Server-only encrypted/vault; no browser tokens | B1.1, B1.10 |
| 3 | OAuth CSRF | Hashed single-use bound state | B1.1 |
| 4 | Callback open redirect | Allowlisted origin + safe relative path | B1.1 |
| 5 | Role escalation | No new roles; RPC role checks; NULL role deny | B1.2–B1.10 |
| 6 | Viewer mutation | Permission matrix + RPC | Every mutation phase |
| 7 | Unauthorized disconnect | Owner/Admin only | B1.1 |
| 8 | Unauthorized publish | Approval + role + kill switch | B1.5, B1.6 |
| 9 | Duplicate publish (UI) | Idempotency keys | B1.6 |
| 10 | Scheduler retry duplicate | Same generation; unique job | B1.6 |
| 11 | Provider-timeout duplicate | `submission_unknown`; no blind retry | B1.6 |
| 12 | Stale approved version published | Job pins version id; edit supersedes jobs | B1.5, B1.6 |
| 13 | Malicious webhook | Signature verify; ignore unsigned | B1.1/B1.6/B1.8 |
| 14 | Webhook replay | Event id unique + timestamp skew | same |
| 15 | Provider/account mismatch | Bind external_account_id at connect; re-check on publish | B1.1, B1.6 |
| 16 | Unpublished content leakage | RLS + unavailable shapes | B1.2, B1.3, B1.10 |
| 17 | Analytics leakage | Org-scoped snapshots | B1.8, B1.10 |
| 18 | Cross-tenant AI context | Org+workspace retrieval invariant | B1.3, B1.8, B1.10 |
| 19 | Malicious media metadata | Server MIME/size validation | B1.3 |
| 20 | Secrets in logs | Redaction contract; private schema | B1.1, B1.6, B1.10 |
| 21 | Story automation spam loop | Ceilings, cooldown, kill switch, default OFF | B1.7, B1.10 |
| 22 | Automation left ON accidentally | Owner/Admin only; audit; default Manual; env kill switch | B1.6, B1.7, B1.10 |

### 39.1 Security review verdicts (contract defined)

| Category | Verdict |
| --- | --- |
| Tenant isolation | `PASS — CONTRACT DEFINED` |
| Authorization | `PASS — CONTRACT DEFINED` |
| Credential secrecy | `PASS — CONTRACT DEFINED` |
| OAuth CSRF | `PASS — CONTRACT DEFINED` |
| Open redirect | `PASS — CONTRACT DEFINED` |
| Publishing authorization | `PASS — CONTRACT DEFINED` |
| Idempotency | `PASS — CONTRACT DEFINED` |
| Webhook security | `PASS — CONTRACT DEFINED` |
| AI isolation | `PASS — CONTRACT DEFINED` |
| Audit integrity | `PASS — CONTRACT DEFINED` |
| Automation abuse | `PASS — CONTRACT DEFINED` |
| Provider ambiguity | `PASS — CONTRACT DEFINED` |
| Privacy | `PASS — CONTRACT DEFINED` |

These are **not** Production Verified.

---

## 40. Beta 1 in-scope matrix

| Capability | Beta 1 | Phase | Notes |
| --- | --- | --- | --- |
| Brand Workspace | Yes | B1.2 | 1:1 Brand↔Workspace |
| Social Account Connection | Yes | B1.1 | Provider-neutral until owner selects provider |
| Credential lifecycle | Yes | B1.1 | No secrets in B1.0 |
| Content Items | Yes | B1.3 | Editorial lifecycle |
| Content Variants | Yes | B1.3 | Capability-checked |
| Media Assets | Yes | B1.3 | Metadata + storage ref |
| AI drafting | Yes | B1.3 | Advisory only |
| Campaigns | Yes | B1.4 | Organic only |
| Calendar | Yes | B1.4 | UI over Schedule Entries |
| Scheduling | Yes | B1.4 | No accidental publish |
| Approval | Yes | B1.5 | Owner/Admin; no client portal |
| Versioning | Yes | B1.5 | Immutable approved versions |
| Controlled publishing | Yes | B1.6 | Jobs/attempts/results |
| Story continuity | Yes | B1.7 | Safety ceilings required |
| Analytics | Yes | B1.8 | Snapshots; no overwrite |
| AI insights | Yes | B1.8 | Fact/hypothesis classes |
| Attention integration | Yes | B1.9 | Extend existing Attention |
| NBA integration | Yes | B1.9 | Recommend-only catalog |
| Daily Command Center | Yes | B1.9 | AppShell operational view |
| Audit | Yes | Cross-cutting; proven in B1.10 | `social_events` |
| Roles | Yes | Reuse; applied each phase | No new global roles |
| Connection health | Yes | B1.1 | Distinct statuses |
| Kill switches | Yes | Documented now; implemented when features land | Fail closed |
| Provider-neutral domain | Yes | B1.0 | This contract |

---

## 41. Deferred / out-of-scope matrix

| Capability | Classification | Reason |
| --- | --- | --- |
| Paid ads (Meta/Google Ads, spend, billing, conversion attribution) | **Out of SMM Beta 1** | Separate product; organic only |
| Broad social listening / mention monitoring / scraping | **Out** | Separate provider/legal contract |
| Competitor intelligence | **Out** | |
| Influencer marketplace | **Out** | |
| Autonomous DM sales bots | **Out** | |
| Automated comment bots / comment inbox | **Out** | Capability may exist on adapter later; unused |
| Unrestricted scraping | **Out** | |
| Complex multi-touch attribution | **Out** | |
| Provider-side post deletion/editing | **Deferred** (not Beta 1) | Separate external effect; not selected |
| Unlimited / higher AI auto-publishing | **Deferred** | `higher_automation` out |
| External client portal / signed client approval | **Deferred** | Not in B1.0–B1.10 unless owner expands |
| Content marketplace | **Out** | |
| Social-billing SKU | **Out** | |
| Community management inbox | **Out** | |
| Appointments product | **Out** | Absent; not required |
| Notification center | **Out** | Invitation email is unrelated |
| New global roles | **Out** | Reuse four roles |
| Course Sellers PE changes | **Out** | Do not reopen CS Beta 1 |
| CB-Q1 / CB-PUB / invitation gates | **Out** | Isolated paused track |

---

## 42. Downstream phase boundaries

Each later phase requires **separate owner authorization**. This section locks responsibilities so B1.1–B1.10 do not reinvent domain semantics.

### SMM-B1.1 — Social Account Connections & Credential Foundation

**Must:** owner-approved first provider(s); secure OAuth; credential lifecycle; least privilege; connection health; disconnect/revoke; capability discovery; tenant isolation; no secret leakage; production-controlled verification of **connection** only.

**Must not:** content publishing (except connectivity proof if owner explicitly requires a non-public test that still must not create customer-visible posts without approval); Story automation; analytics product; workspace UX beyond what connection needs; migrations beyond connection/credential/oauth-state.

### SMM-B1.2 — Client / Brand Social Workspace

**Must:** Brand; Workspace; optional Customer link; first-party Brand; brand rules/preferences; settings; permissions applied; UI.

**Must not:** reinvent Client as a new table; OAuth; publishing.

### SMM-B1.3 — Content Creation & AI Assistant

**Must:** Content Items; Versions (draft); Variants; Assets; AI drafting; brand context FACT/PREFERENCE/AI_SUGGESTION; human edit; no external publish.

**Must not:** provider publish; approval product (may prepare submit); calendar product.

### SMM-B1.4 — Calendar / Campaigns / Scheduling

**Must:** Campaign; Schedule Entry; calendar UI; timezone; gaps (planning-level); reschedule/cancel; **no accidental publish**.

**Must not:** execute provider publish; Story auto-loop.

### SMM-B1.5 — Approval & Versioning

**Must:** review; approve; changes requested; immutable approved output; audit; invalidation on edit; supersede jobs on version change.

**Must not:** client portal; approval bypass; provider publish.

### SMM-B1.6 — Controlled Publishing Engine

**Must:** Jobs; Attempts; adapter; idempotency; retry policy; `submission_unknown`; fail-closed side effects; kill switch; controlled Production verification of publish.

**Must not:** paid ads; provider-side delete (deferred); bypass approval.

### SMM-B1.7 — Story Continuity & Automation

**Must:** desired/planned/published/gap/recovery; approval-first automation; frequency/daily ceilings; kill switch; controlled Production verification.

**Must not:** unbounded “always on Story”; `higher_automation`.

### SMM-B1.8 — Analytics & Performance Intelligence

**Must:** raw snapshots; optional normalization; trends; evidence-backed insights; no false causal certainty.

**Must not:** overwrite metric history; invent metrics when provider unavailable.

### SMM-B1.9 — Operations / Attention / NBA / Daily Command Center

**Must:** extend Attention source/rules; extend NBA catalog; Command Center; reuse existing Attention/NBA foundations.

**Must not:** NBA executing publish; duplicate Attention product; notifications product.

### SMM-B1.10 — Production Security, Closed-Beta QA & Publication

**Must:** permission matrix proof; tenant isolation proof; OAuth/credential security; external-effect security; idempotency; automation bounds; real provider QA; rollback; incident response; full evidence; publication verdict.

**Must not:** silently expand into deferred scope; reopen CB-Q1.

---

## 43. Owner decision register

| ID | Decision | Status | Blocks B1.0? | Blocks |
| --- | --- | --- | --- | --- |
| OD-SMM-1 | First Social Provider(s) | **OWNER DECISION REQUIRED** | No | **SMM-B1.1 external integration** |
| OD-SMM-2 | Client approval in Beta 1 | Locked **deferred** (internal Owner/Admin only) | No | Future portal track |
| OD-SMM-3 | Staff connect/disconnect rights | Locked **Owner/Admin only** (conservative) | No | — |
| OD-SMM-4 | Approved scheduled auto-publish | Locked **opt-in mode** `approved_scheduled`; default `manual` | No | — |
| OD-SMM-5 | Provider-side delete/edit | Locked **deferred** (not Beta 1) | No | — |
| OD-SMM-6 | Exact Story frequency/daily numeric ceilings | **OWNER DECISION REQUIRED** at B1.7 (ceilings must exist; numbers not invented here) | No | SMM-B1.7 enablement |
| OD-SMM-7 | Media storage backend (Supabase Storage vs other) | **OWNER DECISION REQUIRED** at B1.3 | No | SMM-B1.3 asset persistence |
| OD-SMM-8 | Job runner infrastructure | **OWNER DECISION REQUIRED** at B1.6 (or dedicated infra phase) | No | SMM-B1.6 execution |
| OD-SMM-9 | Credential vault mechanism (encrypted column vs secret store) | **OWNER DECISION REQUIRED** at B1.1 | No | SMM-B1.1 secret persistence |

B1.0 remains coherent without OD-SMM-1/6/7/8/9 because the provider-neutral, approval-first, fail-closed contracts do not depend on a named vendor or numeric ceiling.

```text
OWNER PROVIDER SELECTION REQUIRED BEFORE SMM-B1.1 EXTERNAL INTEGRATION
```

---

## 44. Consistency review

| Check | Result |
| --- | --- |
| Every entity has one meaning | PASS — glossary locked |
| Every object has an Organization owner | PASS — §6 |
| Every mutation has authorization | PASS — §8–§9 |
| Every external side effect has idempotency | PASS — §19–§20 |
| Every lifecycle has terminal rules | PASS — content vs job separated |
| Approval/version align with schedule/publish | PASS — schedule does not approve; edit supersedes jobs |
| Provider capabilities align with variants | PASS — capability-checked validation |
| Analytics distinguish raw vs interpretation | PASS — §26–§27 |
| Story automation cannot runaway | PASS — §22 |
| Attention/NBA cannot bypass publish approval | PASS — §28–§29 |
| Deferred scope explicit | PASS — §41 |
| No competing names | PASS — Client is UI synonym only |
| Invitation track isolated | PASS |
| Paid ads excluded | PASS |

No contradictory contracts remain that block B1.0.

---

## 45. Production mutation statement (this phase)

```text
0 SOCIAL PROVIDER CONNECTIONS
0 PROVIDER API CALLS
0 SOCIAL POSTS
0 SOCIAL STORIES
0 SOCIAL WEBHOOKS
0 SMM DATABASE MIGRATIONS
0 SMM PRODUCTION APPLICATION MUTATIONS
```

---

## 46. Closure criteria (SMM-B1.0)

Addressed in this contract and the companion evidence document:

1. Git baseline verified  
2. Foundations mapped  
3. Reuse matrix complete  
4. Workflow locked  
5. Terminology locked  
6. Entity model complete  
7. Organization ownership explicit  
8. Tenant isolation complete  
9. Permission matrix complete  
10. High-risk mutation policy complete  
11. Content lifecycle complete  
12. Versioning complete  
13. Approval complete  
14. Connection lifecycle complete  
15. Provider capability model complete  
16. Credential security complete  
17. OAuth security complete  
18. External side-effect architecture complete  
19. Publishing idempotency complete  
20. Ambiguous provider result complete  
21. Scheduling/timezone complete  
22. Story continuity safety complete  
23. AI assistance boundary complete  
24. Fact/hypothesis/evidence complete  
25. Analytics data contract complete  
26. Attention integration complete  
27. NBA integration complete  
28. Daily Command Center complete  
29. Audit complete  
30. Privacy/retention complete  
31. Failure taxonomy complete  
32. Feature-gate strategy complete  
33. Background-job contract complete  
34. Webhook security complete  
35. Threat model complete  
36. B1.1–B1.10 boundaries complete  
37. In-scope matrix complete  
38. Deferred matrix complete  
39. Owner-decision register complete  
40. No contradictory contracts  
41. No provider integration performed  
42. No migration performed  
43. No Production mutation performed  
44. Evidence document complete  
45. Docs-only diff  
46. Commit/push complete  
47. Final Git divergence `0 0`  
48. Worktree clean  

Criteria 46–48 are completed by the evidence publication commit/push, not by this file alone.

---

## 47. Next authorized boundary

```text
SMM-B1.1 NOT YET AUTHORIZED
OWNER PROVIDER SELECTION REQUIRED BEFORE SMM-B1.1 EXTERNAL INTEGRATION
```

Do not install provider SDKs, create credential tables, or call social APIs until a separate owner authorization names the provider and authorizes SMM-B1.1.
