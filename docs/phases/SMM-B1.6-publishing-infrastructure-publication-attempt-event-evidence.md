# SMM-B1.6 — Publishing Infrastructure + Publication Job / Attempt / Event Model — Evidence

## 1. Executive verdict

```text
SMM-B1.6 CLOSED WITH EVIDENCE — PROVIDER-NEUTRAL PUBLISHING INFRASTRUCTURE AND PUBLICATION EXECUTION MODEL READY
SMM-B1.6 PRODUCTION SCHEMA VERIFIED — PUBLICATION, ATTEMPT, IDEMPOTENCY AND EXECUTION FOUNDATION ACTIVE WITH SOCIAL PUBLISHING GATES OFF
NO LIVE SOCIAL PROVIDER PUBLISHING EXECUTED
INSTAGRAM PUBLISHING ADAPTER NOT YET IMPLEMENTED
```

## 2. Verified Git baseline

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `b2328033de0c9e533fc59239f8fc2c2299e47837` |
| Upstream / origin | aligned `0 0` at start |
| Worktree | clean at start |
| Prior tip | `docs(smm): close B1.5 review approval calendar foundation` |

## 3. Binding prior SMM state

A–D / B1.2–B1.5 preserved. Immutable versions, workflow readiness ≠ provider publishability, Instagram-only connection CHECK, Staff content mutation, Brand Brain Owner/Admin, no service-role shortcut.

## 4. Preflight repository findings

Inspected Universal Social contract §14, B1.5 migration/evidence, schedule slots, workflow readiness RPC, variant versions/`media_snapshot`, connections/capabilities/credentials, Instagram OAuth adapter segmentation, Attention patterns (reference only), RLS/RPC conventions, existing Social migration tip `20260815185612`.

Remote tip before apply: `20260815185612`. Only pending local migration: `20260815202145`. No unrelated drift.

## 5. B1.6 scope

**In:** Publication / Attempt / Event tables; create/cancel/retry human RPCs; private claim/start/complete system RPCs; idempotency; claim/lease; retry/backoff; failure taxonomy; `unknown_external_outcome`; publishing adapter contract + empty registry; capability/connection/workflow preflight; feature gate fail-closed; RLS; tests; production schema.

**Out:** Live Instagram/Meta Graph publish; media containers; other providers; analytics; Attention; polished UI; production worker activation; gate enablement; secrets.

## 6. Publication source-of-truth definition

Publication = operational intent to execute an **exact** Variant Version against an **exact** Social Account Connection. Distinct from content, version, approval, and schedule slot.

## 7. Publication creation / materialization model

| Decision | Choice |
| --- | --- |
| A. Sources | Both: `scheduled` (optional `schedule_slot_id`) and `immediate` |
| B. Targets | Exact `variant_version_id` + `connection_id` (mandatory) |
| C. Repeat publish | Allowed via new Publication + new idempotency key; retry stays same Publication |
| D. Queue | Publication row is the job (claim fields on row) — smallest safe model |
| E. Worker identity | Private RPCs + GUC `zyntix.social_publication_worker=on`; no service-role client |

Materialization does not call providers.

## 8. Exact variant-version binding

FK `(organization_id, variant_version_id) → social_content_variant_versions`. No publish from mutable variants. Newer versions require a new Publication.

## 9. Media snapshot binding

Execution input reuses B1.5 frozen `media_snapshot` on the bound version. Domain contract exposes `SocialPublicationMediaReference`; no mutable join reconstruction.

## 10. Schedule-slot relationship

Optional `schedule_slot_id`. Must be active, same workspace, same `variant_version_id`. Unique one active Publication per slot (`social_publications_one_active_schedule_uidx` where status ≠ cancelled). Post-materialization schedule moves do not retarget an existing Publication.

## 11. Target connection binding

FK `(organization_id, connection_id)`. Workspace must match version workspace. Cross-workspace rejected (`workspace_mismatch`).

## 12. Provider consistency

`variant.planned_provider == connection.provider == publication.provider`. Mismatch → `provider_mismatch`. Runtime CHECK remains `provider = 'instagram'`.

## 13. Runtime-provider distinction

| Layer | Status |
| --- | --- |
| Planning providers | Multi-provider planned variants (prior phases) |
| Infrastructure contract | Provider-neutral publishing adapter segment |
| Adapter implemented | **None** (`not_implemented_b16`) |
| Execution enabled | Gate OFF (`SOCIAL_PUBLISHING_ENABLED` / GUC fail-closed) |

## 14. Publication lifecycle

Finite statuses: `pending|queued|claimed|processing|succeeded|cancelled|failed_retryable|failed_terminal|manual_intervention|unknown_external_outcome`.

## 15. Publication vs Attempt state

Publication = overall operational state. Attempt = one execution cycle. Retry creates a new Attempt under the same Publication.

## 16–18. Attempt model / numbering / immutability

`social_publication_attempts`: attempt_number unique per publication; numbering under row lock (`attempt_count + 1`); completed attempts immutable (trigger); no DELETE; no tokens/raw provider bodies.

## 19–22. Failure taxonomy / retry / backoff / manual intervention

Normalized failure classes (authorization, credential, capability, validation, media, rate_limit, provider_temporary/permanent, network, timeout, conflict, internal, adapter_unavailable, feature_disabled, unknown_external_outcome, workflow_not_ready, connection_ineligible).

Retryability server-owned. Backoff: `min(1h, 30s * 2^(attempt-1))` via `next_attempt_at`. Exhausted retries → terminal / `manual_intervention` where classified. No separate dead-letter system.

## 23. Idempotency model

Unique `(organization_id, idempotency_key)`. Server generates if omitted. Duplicate create returns same Publication. Not keyed solely on `variant_version_id`.

## 24. Duplicate materialization protection

Partial unique index on active schedule-slot materialization; unique violation → `conflict` or idempotent success by key.

## 25–26. Queue / claim / lease / recovery

`private.claim_due_social_publications` uses `FOR UPDATE SKIP LOCKED`, sets `claimed_by`, `claim_generation`, `claim_lease_expires_at`. Stale lease reclaimable. Start/complete require matching worker + claim_generation → `stale_claim` otherwise.

## 27. Unknown external outcome

Explicit status/outcome `unknown_external_outcome` — not auto-retried as normal failure. B1.7 must reconcile provider-side ambiguity.

## 28–29. Provider adapter publishing contract / fail-closed

Typed `SocialPublishingAdapter` (`preflight`/`publish`, segment `publishing` only). `createEmptySocialPublishingAdapterRegistry()` → `provider_adapter_unavailable`. No production fake success adapter. No Instagram network adapter.

## 30–33. Capability / workflow / connection-health / credential preflight

Capability from format → `publish_*` via helper (not hard-coded Instagram/format branches in core). Workflow readiness reused from B1.5 RPC. Connection must be `connected`, not reauth-required, credential_ref present. No production token decryption in B1.6.

## 34. Media-resolution boundary

Domain input carries snapshot storage keys/metadata only. No permanent public media; no browser storage signing credentials.

## 35. Feature-gate model

| Concern | Rule |
| --- | --- |
| Intent creation | Allowed when workflow/connection preflight pass (editorial path) |
| Execution (claim/start) | Requires `zyntix.social_publishing_enabled=true` |
| Env contract | `SOCIAL_PUBLISHING_ENABLED` — missing/false fail-closed |
| Production | Gate remains **OFF** |

## 36–37. Background / system execution; human vs system

Human RPCs (`authenticated`): create / cancel / retry with Staff+ mutation context. System RPCs (`private`, not granted to authenticated/anon): claim / start / complete. Worker GUC required. Events use `actor_source=system` without fabricating a human member. No `createClient(SERVICE_ROLE)`.

## 38. Role matrix

| Action | Owner | Admin | Staff | Viewer |
| --- | --- | --- | --- | --- |
| Create / cancel / retry Publication | ✓ | ✓ | ✓ | ✗ |
| Read publications/attempts | ✓ | ✓ | ✓ | ✓ |
| Read publication events | ✓ | ✓ | ✗ | ✗ |
| Complete attempt / set external id | system only | | | |

## 39–40. RLS / SECURITY DEFINER

RLS enabled; SELECT member (events Owner/Admin); INSERT/UPDATE/DELETE revoked for authenticated/anon; service_role revoked on tables. Human RPCs: SECURITY DEFINER, `search_path=''`, schema-qualified, membership re-check.

## 41–42. Events / cancellation

Append-only `social_publication_events` with secret-key payload reject. Cancel allowed for pending/queued/failed_* / manual_intervention; blocked for claimed/processing/succeeded/unknown_external_outcome. Cancellation ≠ deletion.

## 43–44. Observability / client-safe boundary

Safe IDs/status/failure_class only. Forbidden client keys listed in domain. No tokens/ciphertext/provider payloads on Publication objects.

## 45–48. No-live-provider / no-Instagram / no-Attention / no-analytics

Migration/static tests assert no Graph URLs, no `instagram_publications` table, no Attention/analytics mutation. Adapter status `not_implemented_b16`.

## 49. Local SQL verification

`tests/security/social-publishing-rpc-live-verification.sql` — BEGIN/ROLLBACK + opt-in GUC.

```text
NOTICE: SMM-B1.6 publishing live verification PASS
ROLLBACK
```

Covered: create + idempotent recreate, viewer forbidden, authenticated cannot EXECUTE complete, worker GUC required, gate OFF blocks claim, claim/start, stale claim, terminal fail without external id.

## 50–56. Test coverage

Domain publishing contracts; migration security; inventory updates across Social suites; live SQL concurrency/idempotency/lifecycle/stale-claim paths above.

## 57–60. Results

| Gate | Result |
| --- | --- |
| Targeted Social/publishing | 8 files / 51 PASS |
| Full Vitest | **327 files / 2297 PASS** (prior 325 / 2287) |
| typecheck | PASS |
| lint | PASS |
| build | PASS |
| Local SQL | PASS |

## 61. Security review

| Threat | Mitigation |
| --- | --- |
| Duplicate publication / double-submit | Org-scoped idempotency unique + schedule active unique |
| Cross-tenant / cross-workspace | Composite FKs + workspace check |
| Provider mismatch | Explicit equality check |
| Approval bypass | Workflow readiness RPC required |
| Browser success / external id | Private complete RPC; no authenticated EXECUTE |
| Claim race / stale claim | SKIP LOCKED + claim_generation |
| Retry storm | next_attempt_at + max_attempts + claim lock |
| Unknown provider outcome | Explicit terminal-ish class (not blind retry) |
| Capability / connection / gate bypass | Fail-closed preflight + execution GUC |
| Credential leakage | No token columns; payload key deny-list |
| Service-role shortcut | Not introduced |
| RLS / search_path | Enabled; empty search_path verified in Production |

No unexplained FAIL.

## 62. Anti-chaos review

| Item | Status |
| --- | --- |
| `instagram_publications` core table | ABSENT |
| Provider-specific job tables | ABSENT |
| Mutable-version publishing | ABSENT |
| Provider raw payload SoT | ABSENT |
| Access token on Publication | ABSENT |
| Browser mark success | ABSENT (proven) |
| Duplicate Publication per retry | ABSENT |
| Approval bypass | ABSENT |
| Calendar as execution state | ABSENT |
| Service-role publishing client | ABSENT |
| Test adapter in Production | ABSENT |
| Live provider HTTP | ABSENT |
| Instagram publishing | ABSENT |
| Attention / analytics / B1.7 early | ABSENT |

## 63. Migration review

`20260815202145_add_social_publishing_infrastructure_foundation.sql` — additive tables, indexes, RLS, human/public RPCs, private worker RPCs. No historical rewrite. No provider CHECK broadening.

## 64–68. Production

| Check | Result |
| --- | --- |
| Project | `dmctinrcjvsgmoxwwodw` ACTIVE_HEALTHY linked |
| Dry-run | Only `20260815202145` pending |
| Apply | PASS (`npx supabase db push --linked --yes`) |
| Remote tip | `20260815202145_add_social_publishing_infrastructure_foundation` |
| Drift | none (local==remote) |
| Tables + RLS | present / true |
| Publication/Attempt/Event rows | **0 / 0 / 0** |
| Prior Social rows | brands/workspaces/campaigns/content/variants/media/versions/reviews/approvals/slots/connections/credentials = **0** |
| Indexes | idempotency + one_active_schedule + claim_due present |
| RPC grants | human public EXECUTE to authenticated; private worker EXECUTE false for authenticated/anon |
| search_path | `""` on DEFINER RPCs |
| Provider CHK | `provider = 'instagram'` |
| Secret columns | none |
| Gates / secrets | publishing gate OFF; no Social encryption/Instagram secrets configured by this phase |

## 69. External-effect statement

```text
0 OAUTH AUTHORIZATIONS
0 INSTAGRAM ACCOUNTS CONNECTED
0 FACEBOOK / THREADS / TIKTOK / LINKEDIN / YOUTUBE / PINTEREST / X CONNECTIONS
0 REAL PROVIDER TOKENS RECEIVED
0 LIVE PROVIDER API CALLS
0 PROVIDER API MUTATIONS
0 SOCIAL POSTS / STORIES
0 WEBHOOK SUBSCRIPTIONS
SOCIAL PUBLISHING GATES: OFF
```

## 70. Residual risks

Ambiguous provider success after network loss remains a B1.7 reconciliation problem (explicitly modeled, not “solved” by DB idempotency alone). Worker principal beyond GUC + private schema is intentional Beta-1 minimal boundary.

## 71. Closure criteria

All §132 criteria met: infrastructure, security, tests, production schema, evidence, Git.

## 72. Evidence path

`docs/phases/SMM-B1.6-publishing-infrastructure-publication-attempt-event-evidence.md`

## 73–74. Commits / final Git

| Field | Value |
| --- | --- |
| Implementation | `6baf3d864b6385ad3396c9aeabf78a4da4582962` — `feat(smm): add provider-neutral publishing infrastructure` |
| Evidence | _(this commit)_ — `docs(smm): close B1.6 publishing infrastructure` |
| Final HEAD | _(post-push)_ |
| Divergence | `0 0` expected after push |
| Worktree | clean after push |

## 75. Final verdict

```text
SMM-B1.6 CLOSED WITH EVIDENCE — PROVIDER-NEUTRAL PUBLISHING INFRASTRUCTURE AND PUBLICATION EXECUTION MODEL READY
SMM-B1.6 PRODUCTION SCHEMA VERIFIED — PUBLICATION, ATTEMPT, IDEMPOTENCY AND EXECUTION FOUNDATION ACTIVE WITH SOCIAL PUBLISHING GATES OFF
NO LIVE SOCIAL PROVIDER PUBLISHING EXECUTED
INSTAGRAM PUBLISHING ADAPTER NOT YET IMPLEMENTED
```

## 76. Next boundary

```text
SMM-B1.7 NOT YET AUTHORIZED
```

Expected ownership: Instagram Complete Vertical Publishing Integration (live adapter, media preparation, Graph writes, external IDs, credential decryption under controlled gates).
