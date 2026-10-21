# SMM-B1.9 — Publishing Lifecycle & Operational Hardening — Evidence

## 1. Executive verdict

**`SMM-B1.9 CLOSED WITH EVIDENCE — PUBLISHING LIFECYCLE & OPERATIONAL HARDENING VERIFIED`**

Publishing lifecycle contracts, database-backed idempotency/abandon/reclaim/resolve RPCs, Owner/Admin operator inventory UI, and Production-safe schema verification are complete. **Zero Instagram provider writes** were performed. `SOCIAL_PUBLISHING_ENABLED` remained OFF. Historical leftovers were **not** mutated.

## 2. Authoritative baseline

| Item | Value |
| --- | --- |
| Baseline HEAD (pre-B1.9) | `ca946b816f6aeea1f7c832cd6f7b9f695d64f89c` |
| Baseline milestone | SMM-B1.8 CLOSED — controlled Instagram IMAGE publish verified |
| Branch | `core/platform-readiness-20260707` |
| Upstream/origin | `origin/core/platform-readiness-20260707` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Host | `www.zyntixai.com` |

Baseline opaque Production counts (unchanged by B1.9 mutations):

| Kind | Status | Count |
| --- | --- | --- |
| connections | connected | 1 |
| connections | authorization_pending | 6 |
| credentials | present | 1 |
| publications | succeeded | 1 |
| publications | queued | 3 |
| attempts | succeeded | 1 |

## 3. Existing lifecycle analysis

### Connections

Statuses in use: `initiated`, `authorization_pending`, `connected`, `reauthorization_required`, `permission_missing`, `revoked`, `disconnected`.  
Health overlay: `healthy` / `degraded` / `provider_unavailable`.  
R1 leftovers leave `authorization_pending` shells when OAuth fails after intent consume. Disconnect RPC existed but had no operator UI. Pending shells must not count as healthy connected accounts.

### OAuth intents

Table: `private.social_oauth_authorization_intents`.  
Statuses: `pending` \| `consumed` \| `expired` \| `abandoned`.  
Single-use consume + fingerprint replay protection preserved. Lazy expiry on consume already existed; `abandoned` was unused until B1.9.

### Publications

Statuses: `pending`, `queued`, `claimed`, `processing`, `succeeded`, `cancelled`, `failed_retryable`, `failed_terminal`, `manual_intervention`, `unknown_external_outcome`.  
Create → `queued`. Org-scoped unique `idempotency_key`. Claim uses lease + generation. Stuck `processing` had no operator reclaim path before B1.9.

### Attempts

Created on start; terminal outcomes immutable. `unknown_external_outcome` must not auto-retry provider writes.

## 4. Final lifecycle contract

| Object | Operational terminal / cleanup | Notes |
| --- | --- | --- |
| Pending connection shell | → `disconnected` via `abandon_authorization_pending_social_connection` | Never touches `connected` |
| Pending OAuth intent | → `expired` or `abandoned` | Never reopens `consumed` |
| Queued/pending publication | → `cancelled` via `abandon_queued_social_publication` | Audit event `social_publication_abandoned` |
| Expired `claimed` lease | → `failed_retryable` | Provider write not yet confirmed |
| Expired `processing` lease | → `unknown_external_outcome` | Fail-closed; no auto provider retry |
| `unknown_external_outcome` | operator resolve → `failed_terminal` / `manual_intervention` / `succeeded` | Succeeded only if opaque external id already present |

Hard deletion of Social audit rows is **out of scope**. Prefer operational state transitions.

## 5. Idempotency model

Database guarantees:

- Unique `(organization_id, idempotency_key)` on publications; create RPC returns existing row on conflict.
- B1.8 prepare now uses content fingerprint + connection-derived stable key; reuses non-terminal publication.
- `b18_start` refuses `succeeded`, `cancelled`, `unknown_external_outcome`, `manual_intervention`, `failed_terminal`, `processing`, and concurrent `processing` attempts.
- Claim generation + lease + `FOR UPDATE` prevent double execution under concurrent Execute.
- UI pending ref remains a secondary guard only.

## 6. Retry model

| Class | Policy |
| --- | --- |
| rate_limit, provider_temporary, network | safely retryable |
| timeout (pre-provider / claimed reclaim) | conditionally retryable → `failed_retryable` |
| timeout/network after provider call ambiguity | operator — `unknown_external_outcome` |
| authorization, credential, capability, validation, media, provider_permanent, feature_disabled, conflict, etc. | permanent / intervention |
| unknown_external_outcome | never auto provider-write retry |

Retries create auditable attempt rows via existing start/complete model. `request_social_publication_retry` only re-queues eligible failed statuses (no Meta call).

## 7. Ambiguous-provider-write model

If ZyntixAI cannot prove whether Instagram created the post:

1. Persist `unknown_external_outcome`.
2. Block further provider writes.
3. Operator UI exposes: known status, attempt timeline stage `ambiguous`, safe-retry = false.
4. Resolve via Owner/Admin without Meta: confirm not published / retain manual / confirm published only with existing opaque external id.

## 8. Stale/cleanup model

- **Operational cleanup**: abandon pending shells, abandon queued pubs, reclaim expired leases, abandon/expire intents.
- **Data deletion**: not introduced.
- Historical leftovers remain queryable until explicit owner action.

## 9. Connection health model

Derived without live Meta probes:

`healthy` \| `pending_shell` \| `reauthorization_required` \| `permission_missing` \| `degraded` \| `provider_unavailable` \| `disconnected` \| `revoked` \| `ineligible`.

`authorization_pending` ⇒ `pending_shell` (not healthy).

## 10. Database/RPC changes

Migration: `supabase/migrations/20260818145249_add_b19_publishing_lifecycle_hardening.sql`

Additive:

- Event-type CHECK expansions
- `abandon_authorization_pending_social_connection`
- `abandon_stale_social_oauth_intent` (targets `private.social_oauth_authorization_intents`)
- `abandon_queued_social_publication`
- `reclaim_stale_social_publication_execution`
- `resolve_unknown_external_social_publication`
- Hardened `b18_start_controlled_publication_attempt`

**Rollback risk:** drop/replace functions; CHECK constraints revert to prior allowlists. No destructive data migration.

**Production apply note:** remote migration history already contained an empty placeholder version name `add_b19_publishing_lifecycle_hardening` from an earlier MCP apply attempt; function bodies were applied via linked `supabase db query` with the corrected SQL. RPC presence verified.

## 11. Operator UX

Route: `/social/lifecycle` (Owner/Admin).

Shows connections (health, pending-shell abandon), publications (status, attempt count, external-id presence, blocked reasons), opaque attempt timeline stages. Link from B1.8 publish page. No tokens/codes/provider bodies.

## 12. Security analysis

Preserved:

- Encrypted credentials at rest; server-only secrets; no `NEXT_PUBLIC_` credentials
- Tenant/workspace isolation; Owner/Admin for lifecycle mutations
- Single-use OAuth intent/state model unchanged
- Fail-closed publishing gate; app still requires `SOCIAL_PUBLISHING_ENABLED=true` for execute
- No cross-tenant execution; audit events retained; external ids opaque in UI

## 13. Test evidence

| Suite | Result |
| --- | --- |
| Targeted B1.9 + related | 27/27 passed |
| Full Social (`tests/domain/social-*`, `tests/security/social-*`, `tests/features/social-media/`) | **40 files / 237 tests passed** |
| `npm run typecheck` | passed |
| `npm run lint` | passed (0 warnings/errors) |
| `npm run build` | passed (includes `/social/lifecycle`) |

## 14. Production verification

Allowed checks performed:

- Schema/RPC presence for all B1.9 public lifecycle functions
- Opaque row counts (leftovers unchanged)
- No Meta provider write
- Publishing gate not enabled by this phase

Not performed (intentionally):

- Mutating the 6 pending connections
- Mutating the 3 queued publications
- Disconnecting the verified R1 account
- Enabling `SOCIAL_PUBLISHING_ENABLED`

## 15. Historical leftovers disposition

| Fixture | Disposition |
| --- | --- |
| 6 × `authorization_pending` | **Retained**. Eligible for owner-triggered abandon → `disconnected` |
| 3 × `queued` publications | **Retained**. Eligible for owner-triggered abandon → `cancelled` |
| 1 × `succeeded` B1.8 publication | **Immutable** — do not mutate |
| 1 × connected IG Business + credential | **Untouched** |

### OWNER ACTION REQUIRED (optional cleanup)

After reviewing `/social/lifecycle`, owner may explicitly:

1. Abandon selected pending connection shells (not the connected account).
2. Abandon selected queued leftover publications.
3. Leave leftovers as durable evidence (acceptable).

No automatic mutation will be performed by deployment.

## 16. Known limitations

- No live Meta health probe (by design).
- Stuck `processing` with active (non-expired) lease still blocks until lease expires or owner waits.
- Prepare idempotency reuses publication metadata; media asset id may show opaque reuse sentinel when short-circuiting.
- Remote migration version naming for B1.8/B1.9 differs slightly from local filenames (historical MCP apply pattern).

## 17. Remaining risks

- Operator may abandon leftovers prematurely (mitigated: explicit Owner/Admin action only).
- Confirm-published resolve without Meta verification is gated on existing opaque external id only.
- Concurrent worker productization beyond B1.8 controlled path remains future work.

## 18. Explicit non-goals

Stories, carousel, video, scheduling expansion, analytics, AI optimization, repurposing, App Review, Advanced Access expansion, credential rotation, disconnect of verified R1 account, enabling publishing gate.

## 19. Final gate status

| Gate | Status |
| --- | --- |
| Lifecycle contract implemented | PASS |
| Idempotency / ambiguous fail-closed | PASS |
| Operator UX | PASS |
| Tests / typecheck / lint / build | PASS |
| Production schema RPCs | PASS |
| Leftovers retained (no auto-delete) | PASS |
| Publishing gate OFF | PASS |
| Zero Instagram provider writes | PASS |
| Optional leftover abandon | OWNER ACTION (optional) |

## 20. Git hashes / divergence / worktree status

| Item | Value |
| --- | --- |
| Implementation commit | `f98656187e5bccab6185f7c9d5fd756c0ad7c482` |
| Evidence commit | _(this commit)_ |
| Authoritative HEAD | see post-evidence `git rev-parse HEAD` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence at evidence time | recorded in evidence commit notes |
| Worktree | clean except ignored/untracked `.vercel/` |

---

**Critical invariant confirmed:** no Instagram provider write authorized or executed in SMM-B1.9. Publishing remains OFF.
