# SMM-B1.1-B — Database + AES-256-GCM Credential Foundation — Evidence

| Field | Value |
| --- | --- |
| Phase slice | **SMM-B1.1-B — Database + AES-256-GCM Credential Foundation** |
| Product track | **ZyntixAI Social Media Management Beta 1** |
| Document type | Closure evidence |
| Date | 2026-08-15 |
| Formal status | `SMM-B1.1-B CLOSED WITH EVIDENCE — DATABASE AND AES-256-GCM CREDENTIAL FOUNDATION READY` |
| Production schema status | `SMM-B1.1-B PRODUCTION SCHEMA VERIFIED — SOCIAL CONNECTION AND PRIVATE CREDENTIAL STORAGE FOUNDATION ACTIVE WITH FEATURE GATES OFF` |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Starting HEAD | `1b06486da6f52c0e0baa4eac291e00efb635ab8b` |
| Implementation HEAD | `163e29365c496f4a5dba601982003d9db1fe9c3f` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Production migration | `20260815130220_add_social_connection_credential_foundation` |

This slice establishes persistence, tenant-security, AES-256-GCM credential encryption, OAuth-intent persistence, concurrency, audit, and abuse-protection foundations. It does **not** authorize real Instagram OAuth, token exchange, provider HTTP, connection UI, or enabling social feature gates.

```text
SMM-B1.1-C NOT YET AUTHORIZED
```

---

## 1. Owner authorization (FACT)

Authorized slice: **SMM-B1.1-B — Database + AES-256-GCM Credential Foundation**.

```text
OWNER APPROVED — IMPLEMENT SMM-B1.1-B DATABASE AND AES-256-GCM CREDENTIAL FOUNDATION
```

Authorized: repository/database discovery; additive SMM migration; Social Account Connection persistence; OAuth Authorization Intent persistence; private encrypted credential persistence; social connection audit/event persistence; RLS; grants/revokes; SECURITY DEFINER RPCs; organization/role authorization; uniqueness/idempotency; OAuth-state fingerprint persistence; single-use intent lifecycle; AES-256-GCM; dedicated social credential key parsing; AAD; credential version/CAS; key-version model; credential repository/server boundary; abuse-protection persistence; tests; regression; Production apply after gates; Production schema/grant/RLS verification; evidence; commit/push.

Not authorized and not started: real Instagram OAuth; Meta developer credentials; Instagram client ID/secret configuration; OAuth authorization URL execution; callback route handling; token exchange; Instagram account discovery; provider capability discovery; Instagram HTTP; social publishing; Stories; webhooks; connection UI; enabling social connection gates; changing invitation gates; CB-Q1; CB-PUB; SMM-B1.1-C.

---

## 2. Verified starting Git baseline (VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `1b06486da6f52c0e0baa4eac291e00efb635ab8b` |
| Subject | `docs(smm): close B1.1-A typed connection contracts` |
| Upstream / origin | same SHA |
| Divergence | `0 0` |
| Worktree | clean |

No reset/checkout/pull/stash/rebase/amend/force-push at start.

---

## 3. Verified starting database baseline (VERIFIED)

| Check | Result |
| --- | --- |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Previously known latest | `20260814150000_add_organization_invitation_delivery_attempts` |
| Local latest before this slice | `20260814150000` |
| Remote latest before this slice | `20260814150000` |
| Local/remote alignment | aligned; no unexplained drift |
| Migrations added since known baseline | none until this slice's `20260815130220` |

`social_workspaces` did not exist. Physical workspace FK is deferred to SMM-B1.2. Typed `workspace_id uuid NOT NULL` is stored without a dangling FK.

---

## 4. Binding B1.1-A contracts (VERIFIED)

Binding evidence: `docs/phases/SMM-B1.1-A-typed-connection-provider-security-contracts-evidence.md`.

Preserved without silent redefinition:

| Contract | Encoding in B |
| --- | --- |
| Implemented provider | DB `provider = 'instagram'` |
| Login product | DB `login_product = 'instagram_login'` |
| Account types | `business` / `creator`; `personal` rejected; null only while `initiated` / `authorization_pending` |
| Lifecycle | `initiated`, `authorization_pending`, `connected`, `reauthorization_required`, `permission_missing`, `revoked`, `disconnected` — no generic `error` |
| Health overlay | `healthy`, `degraded`, `provider_unavailable` |
| Encryption purpose | `zyntixai.smm.credential.aes-v1` |
| Feature gates | fail-closed names unchanged; not enabled |
| Dedicated key name | `SOCIAL_CREDENTIAL_ENCRYPTION_KEY`; invitation secret not reused |
| Owner/Admin mutations | Staff/Viewer denied; inactive membership denied |
| Client-safe connection | no tokens/ciphertext/IV/auth tag/OAuth state |

---

## 5. Repository / database patterns reused (VERIFIED)

| Pattern | Source reused |
| --- | --- |
| `private` schema for secrets | invitation delivery-attempt / continuation material |
| RLS deny-by-default + SELECT-only public tables | invitation / attention |
| SECURITY DEFINER + `search_path = ''` | invitation operator RPCs |
| `private.is_org_member` / active membership / role | existing org helpers |
| Composite `(organization_id, id)` unique + FKs | organization_members / invitation events |
| Invitation rate-limiter lock + fail-closed `when others then return false` | `organization_invitation_mutation_rate_limits` |
| Append-only event trigger | invitation / attention events |
| `server-only` crypto modules | invitation continuation secret boundary |
| Session client + SECURITY DEFINER (no application service-role client) | invitation trusted adapters |
| Generated types left stale | invitation RPCs use local types; `npm run supabase:types` not run |

No broad service-role Supabase client was introduced.

---

## 6. CB-Q1 isolation / feature-gate state (VERIFIED)

Invitation migrations, tables, RPCs, evidence, environment variables, and QA data were not modified.

Required conceptual invitation state remains:

```text
INVITATION_EMAIL_DELIVERY_ENABLED=false
INVITATIONS_ENABLED=false
```

Social gates were not added or enabled in Production:

```text
SOCIAL_CONNECTIONS_ENABLED != true
SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED != true
```

Absence remains equivalent to OFF. Production application deployment was not required to close this database slice.

```text
PRODUCTION APPLICATION DEPLOYMENT NOT REQUIRED FOR SMM-B1.1-B
```

---

## 7. Files changed

### Implementation commit `163e29365c496f4a5dba601982003d9db1fe9c3f`

| Path | Role |
| --- | --- |
| `supabase/migrations/20260815130220_add_social_connection_credential_foundation.sql` | Additive schema, RLS, grants, RPCs, rate limits |
| `src/features/social-media/server/credential-key.ts` | Strict 32-byte base64 key parser; lazy; fail-closed |
| `src/features/social-media/server/credential-aad.ts` | Canonical JSON AAD |
| `src/features/social-media/server/credential-payload.ts` | Narrow plaintext payload |
| `src/features/social-media/server/credential-crypto.ts` | AES-256-GCM encrypt/decrypt |
| `src/features/social-media/server/credential-repository.ts` | Session RPC adapters; no service-role |
| `src/features/social-media/server/credential-secrets.ts` | Envelope types remain `server-only` |
| `src/features/social-media/domain/oauth-state.ts` | Fingerprint validator `^[0-9a-f]{64}$` |
| `src/features/social-media/domain/index.ts` | Export fingerprint helper only; no crypto re-export |
| `tests/features/social-media/credential-crypto.test.ts` | Crypto matrix |
| `tests/features/social-media/client-safe-persistence.test.ts` | Client-safe / barrel proof |
| `tests/security/social-connection-migration-security.test.ts` | Migration security contract |
| `tests/security/social-connection-rpc-security.test.ts` | RPC authorization contract |
| `tests/security/social-connection-rate-limit-security.test.ts` | Abuse-limit contract |
| `tests/security/social-connection-rpc-live-verification.sql` | Local BEGIN/ROLLBACK live SQL |

### Evidence commit (this document)

| Path | Role |
| --- | --- |
| `docs/phases/SMM-B1.1-B-database-aes256gcm-credential-foundation-evidence.md` | Closure evidence |

Generated `src/types/database.generated.ts` was **not** regenerated (repository convention: generated types lag later features; invitation RPCs already use local types).

---

## 8. Migration(s)

One additive migration:

```text
20260815130220_add_social_connection_credential_foundation.sql
```

SQL review before Production apply confirmed:

- only intended SMM objects;
- private credential and OAuth-intent tables protected;
- constraints/indexes justified;
- functions use `search_path = ''`;
- grants minimal;
- RLS enabled;
- no secrets;
- no destructive unrelated statements;
- no invitation object mutation.

Local apply: `npx supabase migration up --local` succeeded before Production.

Production dry-run showed **only** this pending migration. Applied with `npx supabase db push --linked --yes`.

Resulting remote latest: `20260815130220` (local and remote aligned).

---

## 9. Social Account Connection schema

Table: `public.social_account_connections`

Columns include: `id`, `organization_id`, `workspace_id` (typed identity; physical FK deferred to B1.2), `provider`, `login_product`, `external_account_id`, `display_name`, `professional_account_type`, `status`, `health`, `capability_snapshot`, `capability_snapshot_at`, `credential_ref_id` (UUID reference only), `connected_by_member_id`, `token_expires_at`, `last_refreshed_at`, `reauthorization_required_at`, `connected_at`, `created_at`, `updated_at`.

No plaintext provider secrets. No ciphertext columns.

RLS: SELECT for active organization members. No INSERT/UPDATE/DELETE policies. Mutations only through SECURITY DEFINER RPCs.

---

## 10. Provider / login / account constraints

| Constraint | Rule |
| --- | --- |
| Provider | `instagram` only |
| Login product | `instagram_login` only |
| Provider+login pair | both must match |
| Account type | `business` or `creator`, or null |
| Null account type | allowed only in `initiated` / `authorization_pending` (identity not yet bound) |
| Bound statuses | `connected`, `reauthorization_required`, `permission_missing`, `revoked` require external id + professional type; `disconnected` may retain historical identity |
| Status | locked Beta 1 lifecycle; no `error` |
| Health | `healthy` / `degraded` / `provider_unavailable` |

Facebook, TikTok, LinkedIn, YouTube, and X are not connectable. Later providers require a deliberate CHECK evolution.

---

## 11. Connection uniqueness

Partial unique index `social_account_connections_active_external_uidx`:

```text
UNIQUE (organization_id, provider, external_account_id)
WHERE status <> 'disconnected' AND external_account_id IS NOT NULL
```

Two concurrent OAuth callbacks cannot create two active connections to the same Instagram account in the same Organization.

Disconnected historical rows may exist; reconnecting the same account in the same org is a new non-disconnected row and is blocked while an active row remains.

---

## 12. Tenant ownership / cross-org rule

Every operational row uses `organization_id`. Composite FKs bind members, events, intents, and credentials to `(organization_id, connection_id)` or `(organization_id, member_id)`.

**Authoritative Beta 1 uniqueness (SMM-B1.0 §5.3):** one **non-disconnected** connection per `(organization_id, provider, external_account_id)`.

This is **organization-scoped**, not a global exclusive lock. The same external Instagram account is not globally forbidden across Organizations. Cross-tenant object association is still impossible: a row cannot attach to another org's connection/member.

RPCs derive actor from `auth.uid()`, re-read membership, and never trust a browser-supplied organization as authority for consume/callback.

---

## 13. Capability persistence

`capability_snapshot jsonb` validated by `private.social_beta1_capabilities_are_valid`:

Allowed strings only: `publish_image`, `publish_video`, `publish_carousel`, `publish_story`, `publish_short`, `schedule_via_provider`, `fetch_metrics`, `account_insights`.

Unknown strings fail the CHECK. Snapshots are replaced atomically by `finalize_social_connection` (Owner/Admin RPC). Browser input cannot grant capabilities.

---

## 14. OAuth Intent persistence

Table: `private.social_oauth_authorization_intents`

Fields: `id`, `organization_id`, `workspace_id`, `connection_id`, `initiating_actor_user_id`, `initiating_member_id`, `provider`, `login_product`, `intent_kind` (`connect` / `reauthorize`), `state_fingerprint` (`^[0-9a-f]{64}$`), `return_path_id` (`social_workspace`), `expected_external_account_id`, `status` (`pending` / `consumed` / `expired` / `abandoned`), `created_at`, `expires_at`, `consumed_at`.

Raw OAuth state is never persisted. Hashing of future raw state belongs to SMM-B1.1-C; B accepts a validated fingerprint only.

Unique fingerprint index prevents reuse of the same stored fingerprint.

No ordinary authenticated SELECT/INSERT/UPDATE/DELETE grants. RLS enabled with no client policies.

---

## 15. OAuth Intent single-use / expiry security

`public.consume_social_oauth_intent(intent_id, fingerprint)`:

- `SELECT … FOR UPDATE` on the intent row;
- requires pending status, matching fingerprint, `consumed_at IS NULL`, and `expires_at > pg_catalog.now()`;
- binds to the persisted initiating actor (`auth.uid()` must match);
- rate-limit identity comes from the **persisted** intent organization/actor/provider, not a client-supplied org;
- sets `status = consumed` and `consumed_at = now()` in the same transaction.

Expired intents cannot be consumed. Two concurrent callbacks cannot both consume the same intent.

Live local SQL (`tests/security/social-connection-rpc-live-verification.sql`) proved single-use under `BEGIN/ROLLBACK`.

---

## 16. Private credential schema

Table: `private.social_provider_credentials`

Bound to one Organization, one Connection, and provider `instagram`. Unique `(connection_id)` and `(organization_id, connection_id)` enforce **one current envelope per connection**. Rotation updates the same row and increments `credential_version`. No history table in Beta 1.

Envelope columns: `encryption_version` (1), `key_purpose` (`zyntixai.smm.credential.aes-v1`), `key_version`, `ciphertext`, `iv`, `auth_tag`, `credential_version` (>= 1).

Safe metadata `token_expires_at` lives on the public connection row, not inside ciphertext.

---

## 17. Credential DB access controls

| Control | Production verification |
| --- | --- |
| Schema | `private` |
| RLS | enabled |
| Policies | none (deny for table roles) |
| Grants to `anon` / `authenticated` / `service_role` | none |
| Table ACL | `postgres` owner only |
| Ordinary SELECT/INSERT/UPDATE/DELETE | denied |
| Load path | `load_social_provider_credential_envelope` SECURITY DEFINER, Owner/Admin, returns opaque envelope fields only |
| Write path | `upsert_social_provider_credential` SECURITY DEFINER, Owner/Admin, CAS |

**Residual (documented, not solved with service-role):** an active Owner/Admin JWT can invoke the load RPC and receive ciphertext. Decryption still requires the server-only `SOCIAL_CREDENTIAL_ENCRYPTION_KEY`. No application service-role client was added.

---

## 18. AES-256-GCM implementation

Module: `src/features/social-media/server/credential-crypto.ts` (`server-only`).

| Property | Implementation |
| --- | --- |
| Algorithm | Node `aes-256-gcm` via `createCipheriv` / `createDecipheriv` |
| Key length | exactly 32 bytes |
| IV | `randomBytes(12)` (96-bit GCM IV) |
| Auth tag | 16 bytes; `setAuthTag` on decrypt |
| AAD | canonical JSON buffer |
| Fail closed | malformed envelope, auth failure, missing/invalid key, unsupported version |
| No fallback | no default key; no SHA-256 derivation of a passphrase |

Dedicated conceptual secret: `SOCIAL_CREDENTIAL_ENCRYPTION_KEY`. `INVITE_CONTINUATION_SECRET` is not read.

---

## 19. Key format / validation

Canonical encoding: **standard base64 with padding** of exactly 32 bytes.

Parser rejects missing, empty, non-base64, non-canonical padding, and decoded lengths other than 32. It does not truncate, hash, or pad a weak string.

Lazy resolution: `readSocialCredentialEncryptionKey` runs only on encrypt/decrypt. Missing Production key does not break unrelated pages while gates are OFF. Crypto request with missing/malformed key returns `configuration_error`.

Tests inject ephemeral 32-byte keys. No Production key is committed.

---

## 20. IV / auth-tag handling

IV and auth tag are stored separately as canonical base64. Decrypt requires exact 12-byte IV and 16-byte tag. Tampering of ciphertext, IV, or tag fails authentication.

Identical plaintext encrypts to different envelopes because IV is random per call.

---

## 21. AAD design

Canonical JSON with alphabetical keys:

`connectionId`, `credentialId`, `encryptionVersion`, `keyVersion`, `organizationId`, `provider`, `purpose`

Purpose is `zyntixai.smm.credential.aes-v1`. Encrypt uses a server-generated credential UUID so AAD `credentialId` matches the persisted row (`p_credential_id` on upsert). Ciphertext encrypted for Organization A / Connection A cannot decrypt under Organization B / Connection B.

---

## 22. Plaintext credential contract

```ts
{ payloadVersion: 1, accessToken: string, refreshToken: string | null }
```

Empty access token rejected. Empty refresh token string rejected (`null` allowed). Arbitrary provider JSON blobs rejected.

Plaintext is never returned to the browser, logged, serialized to evidence, inserted into audit events, thrown in error messages, or attached to client-safe connection reads. Crypto failures return reason codes only (`configuration_error`, `malformed_envelope`, `authentication_failed`, `version_unsupported`, `invalid_payload`).

---

## 23. Key-version model

`key_version` is persisted separately from ciphertext. Current application version is `1`. Decrypt requires `envelope.keyVersion === 1` and matching AAD. Unknown versions fail closed. B1.1-B does **not** claim live dual-key rotation is supported.

Future rotation procedure:

1. Provision a new dedicated key as version N+1 in the approved secret store (never in chat).
2. Extend the key provider to resolve version N and N+1.
3. Re-encrypt existing envelopes via CAS (`expected_credential_version`) onto N+1.
4. Stop resolving version N only after all rows report N+1.
5. Never decrypt “with whichever key happens to exist.”

---

## 24. CredentialVersion / CAS

`credential_version` starts at 1 on insert (`expected_version = 0`). Update requires `expected_version` to match the stored version and the same `credential_id`; success increments to N+1. Stale N fails with `stale_version` and leaves the N+1 envelope in place.

Proven in local live SQL: version N → update expecting N succeeds as N+1; stale update expecting N fails; stored envelope remains N+1.

---

## 25. RPC / SECURITY DEFINER model

Public RPCs (EXECUTE `authenticated` only; `service_role` revoked; `search_path = ''`):

| RPC | Purpose |
| --- | --- |
| `create_social_connection_intent` | Owner/Admin connect shell + pending OAuth intent |
| `create_social_reauthorization_intent` | Owner/Admin reauth intent; preserves expected external account |
| `consume_social_oauth_intent` | Atomic single-use consume |
| `finalize_social_connection` | Bind external id / account type / capabilities |
| `upsert_social_provider_credential` | CAS encrypted envelope write |
| `load_social_provider_credential_envelope` | Owner/Admin ciphertext load |
| `disconnect_social_connection` | Delete private credential; mark disconnected |
| `mark_social_connection_reauthorization_required` | Lifecycle overlay |

Private helpers are granted to `postgres` only.

Every SECURITY DEFINER function uses empty `search_path`, qualified objects, actor from `auth.uid()`, active membership, Owner/Admin role check, and constrained result codes.

---

## 26. Role authorization

Only active Owner/Admin may perform connection-management mutations. Active Staff/Viewer denied. Suspended/invited/removed denied regardless of stored role. Cross-tenant actor denied. Inactive organization denied.

---

## 27. RLS / grants (Production verified)

| Object | RLS | Client grants | Policies |
| --- | --- | --- | --- |
| `public.social_account_connections` | on | `authenticated` SELECT | member SELECT |
| `public.social_connection_events` | on | `authenticated` SELECT | Owner/Admin SELECT |
| `private.social_oauth_authorization_intents` | on | none | none |
| `private.social_provider_credentials` | on | none | none |
| `private.social_connection_mutation_rate_limits` | on | none | none |

Public RPCs: `authenticated=EXECUTE` only. Private functions: `postgres=EXECUTE` only.

---

## 28. Audit-event persistence

Table: `public.social_connection_events`

Kinds: `social_connection_initiated`, `social_connection_established`, `social_connection_reauthorization_required`, `social_connection_reauthorized`, `social_connection_permission_missing`, `social_connection_revoked`, `social_connection_disconnected`, `social_connection_health_changed`.

Append-only: UPDATE/DELETE trigger `private.guard_social_connection_event_immutable` raises. Inserts only from `private.insert_social_connection_event` used by RPCs. Payload is a JSON object without token/ciphertext fields. Browser cannot fabricate `social_connection_established`.

---

## 29. Abuse-protection limits

Invitation-like private table + `FOR UPDATE` consume helper. Limiter exceptions fail closed (`return false`).

| Action | Key | Limit |
| --- | --- | --- |
| Connect initiation | organization + actor | 10 / 3600s |
| Reauthorization initiation | organization + actor | 10 / 3600s |
| Disconnect | organization + actor | 10 / 3600s |
| OAuth callback consumption | organization + **persisted** actor + provider as `scope_key` | 20 / 3600s |
| Credential refresh | connection (`scope_key = connection_id`) + sentinel actor `00000000-0000-4000-8000-000000000001` | 6 / 3600s |

Refresh uses a connection-scoped sentinel actor UUID so the existing (org, actor, action, scope) unique key can express per-connection limits without inventing a second limiter architecture. The sentinel is not a user.

Callback buckets never use a browser-supplied organization id.

---

## 30. Client-safe read proof

Public connection table has no ciphertext/IV/auth-tag/token columns. Domain barrel does not re-export crypto modules. `load_social_provider_credential_envelope` is not a UI read API. Client-safe tests search forbidden names (`token`, `secret`, `ciphertext`, `auth tag`, `IV`, `OAuth state`) on the public table and domain barrel.

---

## 31. Crypto security tests

File: `tests/features/social-media/credential-crypto.test.ts` — **11 passed**.

Covered: valid round trip; unique IV; wrong key; AAD transplant; modified ciphertext/IV/tag; malformed envelope; invalid key length; missing key fail-closed; unsupported encryption version; unsupported key version; empty token payload; envelope contains no plaintext token; purpose mismatch; no passphrase hashing.

No test logs plaintext secrets.

---

## 32. Database security tests

| File | Tests passed |
| --- | --- |
| `tests/security/social-connection-migration-security.test.ts` | 9 |
| `tests/security/social-connection-rpc-security.test.ts` | 6 |
| `tests/security/social-connection-rate-limit-security.test.ts` | 3 |
| `tests/features/social-media/client-safe-persistence.test.ts` | 2 |
| Local live SQL `social-connection-rpc-live-verification.sql` | PASS (`DO` / `ROLLBACK`) |

Contract coverage includes: unauthenticated/cross-tenant isolation in SQL; Viewer/Staff cannot manage; Owner/Admin authorized; suspended/inactive denied; credential table SELECT/mutation denied; OAuth intent not client-listable; unsupported provider rejected; duplicate active connection protected; OAuth single-use; expired intent not consumed; stale CAS rejected; event fabrication denied; rate-limit encoded; limiter fail-closed.

---

## 33. Targeted test result

SMM-B1.1-A + B targeted suite:

```text
Test Files  15 passed (15)
     Tests  83 passed (83)
```

B1.1-A's 52 tests remained green. New B tests: 31.

---

## 34. Full Vitest result

```text
Test Files  310 passed (310)
     Tests  2192 passed (2192)
```

Previous baseline: `305 files / 2161 tests PASS`. All tests PASS. No skipped security failure treated as closure.

---

## 35. Typecheck / lint / build

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — compiled successfully; **no** `/api/social` route |

---

## 36. Security review

| Area | Result |
| --- | --- |
| AES-256-GCM implementation | **PASS** |
| Key validation | **PASS** |
| IV uniqueness/randomness | **PASS** |
| AAD binding | **PASS** |
| Decryption tamper detection | **PASS** |
| Secret logging | **PASS** |
| Server-only import boundary | **PASS** |
| Credential DB isolation | **PASS** |
| Tenant isolation | **PASS** |
| Role authorization | **PASS** |
| OAuth intent single-use | **PASS** |
| CAS refresh foundation | **PASS** |
| Event integrity | **PASS** |
| Abuse protection | **PASS** |
| Unsupported provider fail-closed | **PASS** |

No unresolved FAIL.

Static secret search of implementation modules/migration/tests: no literal access token, refresh token, Meta app secret, encryption key value, OAuth code, or real credential. Field/type names only.

---

## 37. Migration review

Exact SQL inspected. Additive only. No Course Sellers / Invitations destructive change. No unrelated `CASCADE`. No RLS weakening. No security disable. Unexpected statements: none.

---

## 38. Production migration apply

Executed after pre-apply gates (local migration, targeted tests, full Vitest, typecheck, lint, build, SQL review, single pending migration).

| Field | Value |
| --- | --- |
| Command | `npx supabase db push --linked --yes` |
| Project | `dmctinrcjvsgmoxwwodw` |
| Applied | `20260815130220_add_social_connection_credential_foundation.sql` |
| Result | Finished successfully |
| Remote latest after apply | `20260815130220` |
| Local/remote | aligned |
| Reset/reseed/delete | not used |

A non-blocking CLI warning occurred (`failed to cache migrations catalog` / missing pg-delta CA file). Apply itself completed and remote history lists `20260815130220`.

---

## 39. Production schema verification (read-only)

Verified after apply:

- expected public and private tables exist;
- RLS on for all five SMM tables;
- private credential/intent/limiter ACLs are postgres-only;
- public connection SELECT for authenticated members; events SELECT for Owner/Admin;
- eight public RPCs exist, SECURITY DEFINER, `search_path=""`, authenticated EXECUTE only;
- unique indexes including active external-account uniqueness and one-credential-per-connection;
- CHECKs for provider/login/lifecycle/health/account type/fingerprint/purpose;
- invitation counts unchanged: **14** invitations, **37** invitation events, **20** members.

---

## 40. Production key status

`SOCIAL_CREDENTIAL_ENCRYPTION_KEY` was **not** provisioned. Vault secret names matching social/credential/instagram were empty. No key value was printed, committed, or requested in chat.

If encryption is invoked without the key, the application fail-closes with `configuration_error`.

Actual Production key provisioning is deferred until before the first real token in B1.1-C/G:

```text
OWNER ACTION REQUIRED BEFORE FIRST REAL TOKEN — PROVISION DEDICATED SOCIAL_CREDENTIAL_ENCRYPTION_KEY IN THE APPROVED PRODUCTION SECRET STORE
```

Required format (for that later action, not this slice): standard base64 with padding of exactly 32 bytes. Verify masked presence only. Never paste the raw value into chat.

---

## 41. Production data state

| Object | Count |
| --- | --- |
| `public.social_account_connections` | **0** |
| `public.social_connection_events` | **0** |
| `private.social_oauth_authorization_intents` | **0** |
| `private.social_provider_credentials` | **0** |
| `private.social_connection_mutation_rate_limits` | **0** |

```text
0 REAL SOCIAL CREDENTIAL ROWS
```

Crypto correctness is proven by automated fixtures, not live provider credentials.

---

## 42. External-effect statement

```text
0 OAUTH AUTHORIZATIONS
0 INSTAGRAM ACCOUNTS CONNECTED
0 REAL PROVIDER TOKENS RECEIVED
0 INSTAGRAM HTTP REQUESTS
0 PROVIDER API CALLS
0 PROVIDER API MUTATIONS
0 SOCIAL POSTS
0 SOCIAL STORIES
0 WEBHOOK SUBSCRIPTIONS
0 REAL SOCIAL CREDENTIAL ROWS
0 SOCIAL CONNECTIONS CREATED IN PRODUCTION
0 SMM CONNECTION FEATURE GATES ENABLED
```

---

## 43. Closure criteria

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Git baseline verified | PASS |
| 2 | DB baseline verified | PASS |
| 3 | B1.1-A contract preserved | PASS |
| 4 | Additive schema design complete | PASS |
| 5 | Connection persistence complete | PASS |
| 6 | Provider/login constraints correct | PASS |
| 7 | Lifecycle constraints correct | PASS |
| 8 | Health constraints correct | PASS |
| 9 | Tenant ownership enforced | PASS |
| 10 | Connection uniqueness enforced | PASS |
| 11 | Capability persistence trust boundary correct | PASS |
| 12 | OAuth intent persistence complete | PASS |
| 13 | Raw OAuth state not persisted | PASS |
| 14 | OAuth intent expiry modeled | PASS |
| 15 | OAuth intent single-use concurrency safe | PASS |
| 16 | Private credential persistence complete | PASS |
| 17 | Ordinary authenticated credential SELECT denied | PASS |
| 18 | Ordinary credential mutation denied | PASS |
| 19 | Credential ownership bound to org/connection/provider | PASS |
| 20 | AES-256-GCM implemented | PASS |
| 21 | Exactly 256-bit key requirement enforced | PASS |
| 22 | Random unique IV generated | PASS |
| 23 | Authentication tag verified | PASS |
| 24 | Dedicated social key only | PASS |
| 25 | No invitation key reuse | PASS |
| 26 | Key resolution fail-closed | PASS |
| 27 | Test-key injection safe | PASS |
| 28 | Encryption purpose/version correct | PASS |
| 29 | AAD implemented | PASS |
| 30 | Cross-context/AAD transplant fails | PASS |
| 31 | Plaintext payload narrowly typed | PASS |
| 32 | Plaintext excluded from logs/errors/client | PASS |
| 33 | Key-version model implemented | PASS |
| 34 | Unsupported key version fails | PASS |
| 35 | CredentialVersion persisted | PASS |
| 36 | CAS stale update denied | PASS |
| 37 | Role permissions enforced | PASS |
| 38 | Suspended/inactive denied | PASS |
| 39 | Cross-tenant denied | PASS |
| 40 | RPCs safe/search path fixed | PASS |
| 41 | Audit event integrity established | PASS |
| 42 | Event payload secrets absent | PASS |
| 43 | Abuse limits implemented | PASS |
| 44 | Limiter fail-closed | PASS |
| 45 | Unsupported providers fail closed | PASS |
| 46 | Client-safe reads contain no credentials | PASS |
| 47 | No service-role expansion without approval | PASS |
| 48 | Crypto test matrix PASS | PASS (11/11) |
| 49 | DB security test matrix PASS | PASS |
| 50 | Existing B1.1-A tests PASS | PASS (52/52) |
| 51 | All targeted tests PASS | PASS (83/83) |
| 52 | Full Vitest PASS | PASS (2192/2192) |
| 53 | Typecheck PASS | PASS |
| 54 | Lint PASS | PASS |
| 55 | Production build PASS | PASS |
| 56 | Migration SQL reviewed | PASS |
| 57 | Production migration apply PASS | PASS |
| 58 | Production schema verification PASS | PASS |
| 59 | Zero real credential rows | PASS |
| 60 | Zero OAuth/provider activity | PASS |
| 61 | No social gates enabled | PASS |
| 62 | No Production secret exposed | PASS |
| 63 | No unrelated source change | PASS |
| 64 | Evidence complete | PASS |
| 65 | Commit/push complete | PASS after publication |
| 66 | Origin aligned | PASS after push |
| 67 | Divergence `0 0` | PASS after push |
| 68 | Worktree clean | PASS after push |

---

## 44. Evidence path

`docs/phases/SMM-B1.1-B-database-aes256gcm-credential-foundation-evidence.md`

---

## 45. Commits / push

| Full hash | Subject |
| --- | --- |
| `163e29365c496f4a5dba601982003d9db1fe9c3f` | `feat(smm): add encrypted social credential database foundation` |
| *(this evidence commit)* | `docs(smm): close B1.1-B credential foundation` |

Pushed to `origin/core/platform-readiness-20260707`.

---

## 46. Final SMM-B1.1-B verdict

```text
SMM-B1.1-B CLOSED WITH EVIDENCE — DATABASE AND AES-256-GCM CREDENTIAL FOUNDATION READY
```

```text
SMM-B1.1-B PRODUCTION SCHEMA VERIFIED — SOCIAL CONNECTION AND PRIVATE CREDENTIAL STORAGE FOUNDATION ACTIVE WITH FEATURE GATES OFF
```

Meaning:

- persistence, RLS, RPCs, AES-256-GCM, AAD, CAS, audit, and abuse limits exist;
- Production schema is applied with zero connection/credential rows;
- social feature gates remain OFF;
- no real OAuth or provider token has been exercised.

Does **not** mean: Instagram can be connected; OAuth works; a Production encryption key exists; crypto has been exercised with a real token.

---

## 47. Next boundary

```text
SMM-B1.1-C NOT YET AUTHORIZED
```

Next candidate: **SMM-B1.1-C — OAuth Intent + Secure Instagram Login Callback**. Requires separate owner authorization. Do not generate raw OAuth state, authorization URLs, callback routes, or token exchange automatically.
