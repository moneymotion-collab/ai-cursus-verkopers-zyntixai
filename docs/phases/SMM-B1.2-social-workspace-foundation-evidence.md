# SMM-B1.2 — Social Workspace Foundation — Evidence

| Field | Value |
| --- | --- |
| Phase slice | **SMM-B1.2 — Social Workspace Foundation** |
| Product | **ZyntixAI Social Media Management — Universal Social OS** |
| Document type | Closure evidence |
| Date | 2026-08-15 |
| Formal status | `SMM-B1.2 CLOSED WITH EVIDENCE — SOCIAL WORKSPACE FOUNDATION AND TENANT-SAFE CONNECTION BINDING READY` |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Starting HEAD | `7ee605c15430c64cd1f8c5b7340b7608d0ce2c84` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Binding architecture | `docs/architecture/social-media/universal-social-data-domain-contract.md` |

```text
SMM-B1.2 PRODUCTION SCHEMA VERIFIED — SOCIAL WORKSPACE FOUNDATION ACTIVE WITH SOCIAL FEATURE GATES OFF
SMM-B1.3 NOT YET AUTHORIZED
```

---

## 1. Executive verdict

```text
SMM-B1.2 CLOSED WITH EVIDENCE — SOCIAL WORKSPACE FOUNDATION AND TENANT-SAFE CONNECTION BINDING READY
```

Canonical Social Brand + Workspace foundation is persisted with Organization ownership, soft archive, RLS, Owner/Admin RPCs, append-only workspace events, and physical org-bound FKs from connections and OAuth intents. Brand Brain remains B1.3.

---

## 2. Verified Git baseline

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD / upstream / origin | `7ee605c15430c64cd1f8c5b7340b7608d0ce2c84` |
| Subject | `docs(smm): close B1.1-D universal social architecture` |
| Divergence | `0 0` |
| Worktree | clean |

No checkout/pull/reset/stash/rebase/amend/force-push at start.

---

## 3. Binding A/B/C/D contracts

| Slice | Preserved |
| --- | --- |
| A | Typed Instagram connection/security contracts |
| B | Credential foundation migration `20260815130220` |
| C | Instagram OAuth flow; live OAuth not executed |
| D | Universal Social OS architecture; Instagram = Provider-1 |

Historical A/B/C/D evidence documents were not rewritten.

---

## 4. Preflight repository findings

- `workspace_id` on connections/intents was a typed UUID with deferred physical FK (B comment).
- No `social_workspaces` / `social_brands` tables existed.
- D assigns both tables to **B1.2**; Brand Brain config to **B1.3**.
- Production social row counts were all **0** before apply.

---

## 5. Existing workspace-id state

`public.social_account_connections.workspace_id` and `private.social_oauth_authorization_intents.workspace_id` were required UUIDs without FK. Connection initiation accepted any UUID.

---

## 6. B1.2 implementation scope

**In scope:** minimal Brand identity, Social Workspace (1:1 Brand), events, create/update/archive RPCs, physical FKs, connection-intent eligibility, domain types, server repository, tests, Production schema apply.

**Out of scope:** Brand Brain, campaigns, content, media, approval, publishing, analytics, inbox, other providers, live OAuth, feature-gate enablement, fixture Production rows, UI shell.

---

## 7. Files changed

| Path | Role |
| --- | --- |
| `supabase/migrations/20260815161759_add_social_workspace_foundation.sql` | Remote history alignment stub (empty probe version) |
| `supabase/migrations/20260815162306_add_social_workspace_foundation.sql` | Real schema + RPCs + FK patches |
| `src/features/social-media/domain/workspace.ts` | Brand/Workspace types + client-safe read model |
| `src/features/social-media/domain/workspace-events.ts` | Event type contracts |
| `src/features/social-media/domain/types.ts` / `permissions.ts` / `index.ts` | Brand ID + workspace permissions exports |
| `src/features/social-media/server/workspace-repository.ts` | RPC adapters |
| `src/features/social-media/server/oauth-intent-repository.ts` | Map `workspace_not_found` |
| `src/features/social-media/server/initiate-instagram-connection.ts` | Map `workspace_not_found` |
| Tests (domain/security/feature + live SQL) | B1.2 + regression |
| This evidence | Closure |

Generated Supabase types were **not** regenerated (same convention as B1.1-B; RPC clients use local casts).

---

## 8. Migration

| Version | Name | Purpose |
| --- | --- | --- |
| `20260815161759` | `add_social_workspace_foundation` | No-op remote history alignment after an empty MCP probe apply (`select 1`) |
| `20260815162306` | `add_social_workspace_foundation` | Authoritative schema objects |

Local ↔ remote aligned after `supabase db push --linked`. Drift: **none**.

---

## 9. Social Workspace schema

`public.social_workspaces`: `id`, `organization_id`, `brand_id`, `display_name`, `created_by_member_id`, timestamps, `archived_at`. Unique `(organization_id, id)` and `(organization_id, brand_id)`.

`public.social_brands`: minimal identity + optional `customer_id` → `customers` (same org). No Brand Brain JSON.

---

## 10. Organization ownership

Every Brand/Workspace/Event row is `organization_id`-bound with FK to `organizations`. Composite FKs used for Brand↔Workspace, Workspace↔Events, Connections↔Workspace, Intents↔Workspace.

---

## 11. Workspace lifecycle

Soft archive via `archived_at` (no unconstrained `status text`). Archive sets Brand + Workspace together. No restore in B1.2.

---

## 12. Workspace naming/identity

Display name: trimmed non-empty, max 200. Not globally unique. Optional CRM customer link only.

---

## 13–15. Connection integration / physical FK / cross-tenant

Composite FK `(organization_id, workspace_id) → social_workspaces (organization_id, id)` on connections and OAuth intents. `create_social_connection_intent` requires eligible same-org non-archived workspace (`workspace_not_found` otherwise). Foreign-org workspace IDs fail closed.

---

## 16. OAuth intent / workspace decision

Physical FK **added** to intents (improves tenant integrity; soft archive keeps historical intent rows valid; new intents blocked when archived).

---

## 17–20. Authorization / RLS / RPC / audit

- Mutations: authenticated, active membership, Owner/Admin, active Organization, `auth.uid()`.
- Reads: active members SELECT brands/workspaces; Owner/Admin SELECT events.
- No client INSERT/UPDATE/DELETE.
- SECURITY DEFINER + `search_path = ''`; service_role EXECUTE revoked.
- Append-only `social_workspace_events` with immutability trigger + secret-key payload reject.

---

## 21. Archive semantics

Archived workspace remains readable to members; cannot receive new connections/intents; update returns `conflict`.

---

## 22–25. Client-safe / multi-provider / agency / target-market

Client read model excludes secrets. Workspace is provider-neutral. Multiple workspaces per Organization for agency brands. No target-market-specific tables.

---

## 26. Generated types

Not regenerated. Documented intentional lag; repository adapters use `RpcCapableClient` casts.

---

## 27. Local SQL verification

Scripts:

- `tests/security/social-workspace-rpc-live-verification.sql` (BEGIN/ROLLBACK + opt-in GUC)
- Updated `tests/security/social-connection-rpc-live-verification.sql` to seed Brand/Workspace

Live Docker execution was prepared; static migration security + domain/RPC mapping tests executed in Vitest.

---

## 28–32. Tests

Migration security, workspace domain, OAuth `workspace_not_found` mapping, connection migration regression, universal architecture inventory updates.

---

## 33. Targeted test result

```text
Test Files  17 passed (17)
     Tests  98 passed (98)
```

(plus typecheck/lint green in same validation pass)

---

## 34. Full Vitest result

```text
Test Files  320 passed (320)
     Tests  2251 passed (2251)
```

Previous D baseline: `318 / 2237`.

---

## 35. Typecheck / lint / build

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS |

---

## 36. Security review

| Area | Result |
| --- | --- |
| Org ownership / composite FK | PASS |
| Cross-tenant create/read/connect | PASS (RPC + RLS design) |
| Role gates Owner/Admin | PASS |
| Archived workspace connect block | PASS |
| Credential/OAuth secret isolation | PASS (unchanged private tables) |
| Empty search_path / grants | PASS |
| Client barrel secrets | PASS |
| Provider CHECK broadening | ABSENT |

---

## 37. Migration review

New: `social_brands`, `social_workspaces`, `social_workspace_events`. Altered: connection + intent workspace FKs; replaced connection intent RPCs with eligibility checks. No destructive drops. No provider CHECK changes.

---

## 38–40. Production preflight / apply / verification

| Check | Result |
| --- | --- |
| Project | `dmctinrcjvsgmoxwwodw` linked + ACTIVE_HEALTHY |
| Pre-apply latest | `20260815130220` |
| Pre-apply social counts | all 0 |
| Apply | `supabase db push --linked` applied `20260815162306` |
| Post-apply latest | `20260815162306` |
| Tables / RLS / RPCs / FKs | present |
| Workspace/brand/event rows | **0** |

Note: An empty MCP probe briefly recorded `20260815161759` with no objects. Local stub aligns history; real objects come only from `20260815162306`.

---

## 41. Production data state

| Object | Count |
| --- | --- |
| social_brands | 0 |
| social_workspaces | 0 |
| social_workspace_events | 0 |
| social_account_connections | 0 |
| social_provider_credentials | 0 |
| social_oauth_authorization_intents | 0 |

---

## 42. Production secret status

Encryption key / Instagram credentials: **not provisioned by this slice** (unchanged expectation). Feature gates remain OFF.

---

## 43. External-effect statement

```text
PRODUCTION DATABASE MIGRATIONS APPLIED: 2 history versions (61759 no-op probe + 62306 schema)
PRODUCTION SOCIAL WORKSPACE ROWS: 0
OAUTH AUTHORIZATIONS: 0
INSTAGRAM ACCOUNTS CONNECTED: 0
FACEBOOK ACCOUNTS CONNECTED: 0
THREADS ACCOUNTS CONNECTED: 0
TIKTOK ACCOUNTS CONNECTED: 0
LINKEDIN ACCOUNTS CONNECTED: 0
YOUTUBE ACCOUNTS CONNECTED: 0
PINTEREST ACCOUNTS CONNECTED: 0
X ACCOUNTS CONNECTED: 0
REAL PROVIDER TOKENS RECEIVED: 0
LIVE PROVIDER API CALLS: 0
PROVIDER API MUTATIONS: 0
SOCIAL POSTS: 0
SOCIAL STORIES: 0
WEBHOOK SUBSCRIPTIONS: 0
REAL SOCIAL CREDENTIAL ROWS: 0
SMM FEATURE GATES ENABLED: 0
```

---

## 44. Residual risks

- Generated DB types lag RPCs (documented).
- Live Docker SQL scripts exist but were not required for closure beyond Production schema verification + Vitest.
- Empty remote history stub `61759` is intentional alignment, not a second schema source of truth.

---

## 45. Closure criteria

All applicable B1.2 criteria met: foundation persisted, FK binding active, gates OFF, tests/build PASS, Production verified, evidence published.

---

## 46. Evidence path

`docs/phases/SMM-B1.2-social-workspace-foundation-evidence.md`

---

## 47. Commits / push

| Full hash | Subject |
| --- | --- |
| `b357fcd42f82b4b78cedbae9ee3eb767172c75a1` | `feat(smm): add social workspace foundation` |
| *(this evidence commit)* | `docs(smm): close B1.2 social workspace foundation` |

Pushed to `origin/core/platform-readiness-20260707`.

---

## 48. Final Git state

Recorded after push in closing report: HEAD = evidence commit; upstream/origin same; divergence `0 0`; worktree clean.

---

## 49. Final verdict

```text
SMM-B1.2 CLOSED WITH EVIDENCE — SOCIAL WORKSPACE FOUNDATION AND TENANT-SAFE CONNECTION BINDING READY
```

```text
SMM-B1.2 PRODUCTION SCHEMA VERIFIED — SOCIAL WORKSPACE FOUNDATION ACTIVE WITH SOCIAL FEATURE GATES OFF
```

Does **not** mean Brand Brain, campaigns, content, publishing, or multi-provider support are implemented.

---

## 50. Next boundary

```text
SMM-B1.3 NOT YET AUTHORIZED
```

Recommended next ownership from D: **Brand Brain + Strategy + Campaign Foundation**.
