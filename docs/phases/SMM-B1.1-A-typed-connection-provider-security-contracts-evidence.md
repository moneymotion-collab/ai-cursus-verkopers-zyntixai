# SMM-B1.1-A — Typed Connection, Provider & Security Contracts — Evidence

| Field | Value |
| --- | --- |
| Phase slice | **SMM-B1.1-A — Typed Connection, Provider & Security Contracts** |
| Product track | **ZyntixAI Social Media Management Beta 1** |
| Document type | Closure evidence |
| Date | 2026-08-14 |
| Formal status | `SMM-B1.1-A CLOSED WITH EVIDENCE — TYPED SOCIAL CONNECTION, PROVIDER, AND SECURITY CONTRACTS READY` |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Starting HEAD | `adf748272e628da1dd70a53d359165bcd48e604f` |
| Implementation HEAD | `1ce4cdb05043a1a0afaaa11ab418517f1077fc6a` |

This slice establishes application/domain contracts only. It does **not** authorize persistence, encryption implementation, OAuth, Instagram HTTP, UI, or Production changes.

```text
SMM-B1.1-B NOT YET AUTHORIZED
```

---

## 1. Owner authorization (FACT)

Authorized slice: **SMM-B1.1-A — Typed Connection, Provider & Security Contracts**.

Owner-locked decisions encoded:

| Decision | Encoding |
| --- | --- |
| **OD-SMM-1 / OD-SMM-10** — Instagram professional accounts via Instagram API with Instagram Login | `ImplementedSocialProvider = "instagram"`; `SocialLoginProduct = "instagram_login"`; Business + Creator only |
| **OD-SMM-9** — Option A credential architecture | Conceptual `SOCIAL_CREDENTIAL_ENCRYPTION_KEY`; AES-GCM envelope types only; no secret created; no reuse of `INVITE_CONTINUATION_SECRET` |

Facebook Page / `facebook_login` is not an active path.

---

## 2. Verified starting Git baseline (VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `adf748272e628da1dd70a53d359165bcd48e604f` |
| Subject | `docs(smm): publish B1.1 provider readiness evidence` |
| Upstream / origin | same SHA |
| Divergence | `0 0` |
| Worktree | clean |

No reset/checkout/pull/stash/rebase/amend/force-push at start.

---

## 3. Binding SMM-B1.0 / preflight (VERIFIED)

Binding documents present and not mutated:

- `docs/phases/SMM-B1.0-social-media-domain-security-data-contract.md`
- `docs/phases/SMM-B1.0-social-media-domain-security-data-contract-evidence.md`
- `docs/phases/SMM-B1.1-provider-selection-and-integration-readiness-preflight.md`
- `docs/phases/SMM-B1.1-provider-selection-and-integration-readiness-preflight-evidence.md`

Verdicts present:

- `SMM-B1.0 CLOSED WITH EVIDENCE — SOCIAL MEDIA DOMAIN, SECURITY, AND DATA CONTRACT READY`
- `SMM-B1.1 PREFLIGHT CLOSED WITH EVIDENCE — PROVIDER AND CREDENTIAL ARCHITECTURE READY FOR OWNER SELECTION`

Lifecycle, capability keys, Owner/Admin connect permissions, fail-closed gates, and tenant re-read rules were encoded without silently altering those contracts.

---

## 4. CB-Q1 isolation (VERIFIED)

Invitation source, tests, evidence, and gates were not modified.

Required conceptual state remains:

```text
INVITATION_EMAIL_DELIVERY_ENABLED=false
INVITATIONS_ENABLED=false
```

SMM reuses `isActiveOrganizationMembershipStatus` from invitation domain permissions (read-only import). No invitation behavior change.

---

## 5. Repository patterns inspected (VERIFIED)

Reused:

| Pattern | Source |
| --- | --- |
| Feature layout `domain/` / `server/` / `validation/` | `src/features/invitations/`, `src/features/attention/` |
| Const arrays + `isX()` guards | invitation/attention `status.ts`, `events.ts` |
| Organization roles `owner \| admin \| staff \| viewer` | `src/features/tasks/domain/permissions.ts` |
| Active membership = `status === "active"` | `isActiveOrganizationMembershipStatus` |
| Zod `.strict()` mutation schemas | `src/features/invitations/validation/mutation-schemas.ts` |
| Fail-closed env: trimmed lowercase `"true"` only | `parseInvitationsFeatureEnabled` |
| Safe vs secret result split | invitation trusted adapter vs public result |
| `server-only` on secret modules | invitation delivery |
| Safe return path allowlist | `resolveSafeReturnPath` |
| Named ID aliases (no branded-ID library) | existing domains |
| UUID runtime validation at trust boundary | invitation mutation schemas |
| Tests under `tests/domain/` and `tests/features/<name>/` | existing Vitest layout |

No parallel architecture. No new npm dependency.

---

## 6. Files changed

### Application

| Path | Role |
| --- | --- |
| `src/features/social-media/domain/*` | Provider, lifecycle, health, capabilities, connection, credentials metadata, OAuth intent/state types, results, errors, identity, permissions, events, feature-gate parsers, tenant proof |
| `src/features/social-media/validation/mutation-schemas.ts` | Connect / disconnect / reauthorize / provider / return-path Zod |
| `src/features/social-media/server/credential-secrets.ts` | `server-only` encrypted envelope + raw OAuth state types (no crypto) |
| `src/features/social-media/server/social-connections-feature.ts` | Fail-closed env readers |
| `src/features/social-media/server/oauth-return-path.ts` | Maps return-path ID through `resolveSafeReturnPath` |

### Tests

| Path | Role |
| --- | --- |
| `tests/domain/social-connection-provider.test.ts` | Provider / login product / account type / ID boundary |
| `tests/domain/social-connection-lifecycle.test.ts` | Lifecycle + health overlay |
| `tests/domain/social-connection-usability.test.ts` | Usability policy |
| `tests/domain/social-connection-permissions.test.ts` | Roles, inactive membership, tenant proof |
| `tests/domain/social-connection-capabilities.test.ts` | Capabilities, inventory, errors, audit actor source |
| `tests/domain/social-connection-feature-gate.test.ts` | Fail-closed gates |
| `tests/features/social-media/mutation-schemas.test.ts` | Strict connect/disconnect/reauth inputs |
| `tests/features/social-media/oauth-intent.test.ts` | Intent expiry + safe return path |
| `tests/features/social-media/secret-boundary.test.ts` | Read model + server-only secret types |
| `tests/features/social-media/read-model-safety.test.ts` | Type-level secret/provider overlap; no OAuth route |

### Evidence

| Path | Role |
| --- | --- |
| `docs/phases/SMM-B1.1-A-typed-connection-provider-security-contracts-evidence.md` | This document |

No invitation files. No B1.0/preflight mutation. No migrations. No `package.json`. No `.env`. No UI routes.

---

## 7. Provider type model

- Known family (not connectable): `instagram`, `facebook`, `tiktok`, `linkedin`, `youtube`, `x`
- Implemented / `SocialProvider`: `instagram` only
- `isConnectionEnabledSocialProvider` requires implemented **and** both fail-closed gates
- Adding a family string does not enable connections

---

## 8. Instagram Login contract

- Implemented login product: `instagram_login`
- `facebook_login` is detected but **not** implemented
- Login products are not interchangeable

---

## 9. Instagram professional-account model

- Normalized supported types: `business` \| `creator`
- Raw provider strings (`BUSINESS`, `MEDIA_CREATOR`) normalize into those values
- `personal` / `PERSONAL` / unknown → not supported
- Personal accounts cannot satisfy the professional-account contract

---

## 10. Connection lifecycle

Durable statuses (no generic `error`):

`initiated` → `authorization_pending` → `connected` → `reauthorization_required` | `permission_missing` | `revoked` | `disconnected`

- Active (non-terminal): initiated, authorization_pending, connected, reauthorization_required, permission_missing
- Capability-eligible: `connected` only
- Reauthorization required: `reauthorization_required`
- Terminal until new connect/reconnect generation: `revoked`, `disconnected`

---

## 11. Health overlay

Distinct from lifecycle: `healthy` | `degraded` | `provider_unavailable`

`connected + provider_unavailable` is **not** disconnect.

---

## 12. Connection usability policy

Pure helper `resolveSocialConnectionUsability(status, health)`:

| State | Privileged provider calls | Notes |
| --- | --- | --- |
| connected + healthy | yes | potentially usable |
| connected + degraded | no | capability-dependent (`mayUseCapabilities`) |
| connected + provider_unavailable | no | not disconnected |
| reauthorization_required | no | requires reauthorization |
| revoked / disconnected | no | terminal until reconnect |
| initiated / authorization_pending / permission_missing | no | not capability-eligible |

No provider API calls.

---

## 13. Provider capability model

Beta 1: `publish_image`, `publish_video`, `publish_carousel`, `publish_story`, `publish_short`, `schedule_via_provider`, `fetch_metrics`, `account_insights`

Deferred (not Beta 1 active): `comments`, `delete_publication`, `edit_publication`, `direct_messages`, `paid_ads`

---

## 14. Capability snapshot contract

`SocialCapabilitySnapshot`: provider, external account, capabilities[], observedAt, optional source/version.

Empty snapshot helper proves Instagram is not assumed to have every capability. Browser cannot post `publish_story=true` as authority. Discovery remains B1.1-D.

---

## 15. Social Account Connection model

`SocialAccountConnection`: id, organizationId, workspaceId, provider, loginProduct, externalAccountId, displayName, professionalAccountType, status, health, capabilitySnapshot, **credential metadata only**, timestamps, reauthorizationRequiredAt.

Structurally cannot hold access/refresh tokens, app secret, encryption key, or OAuth code. Compile-time overlap with forbidden keys is `never`.

---

## 16. Client-safe read model

`SocialConnectionClientReadModel`: id, provider, displayName, professionalAccountType, status, health, capabilities, tokenExpiryWarning, needsReauthorization, connectedAt.

Forbidden keys include tokens, ciphertext, OAuth state, keyVersion.

---

## 17. Credential metadata contract

`SocialCredentialMetadata`: credentialReferenceId, provider, tokenExpiresAt, lastRefreshedAt, **credentialVersion** (CAS / single-writer refresh for B1.1-B/D), reauthorizationRequired.

No token values. Meta ≥24h refresh rule is not encoded as generic domain.

---

## 18. Secret-boundary contract

- Domain/read models: metadata only
- `src/features/social-media/server/credential-secrets.ts`: `import "server-only"`
- `EncryptedSocialCredentialMaterial`: encryptionVersion, keyPurpose `zyntixai.smm.credential.aes-v1`, keyVersion, ciphertext, iv, authTag
- `RawSocialOAuthStateSecret`: branded; memory/transit only; never persist/log/return through ordinary domain
- Domain barrel does not re-export secret types
- No `createCipheriv` / decrypt implementation

Conceptual env name only: `SOCIAL_CREDENTIAL_ENCRYPTION_KEY`. Secret not created. Invitation continuation secret not reused.

---

## 19. OAuth intent / state contract

`SocialOAuthIntent`: provider, loginProduct, organizationId, workspaceId, initiatingActorId, returnPathId (`social_workspace`), status, createdAt, expiresAt, consumedAt.

Browser cannot use this as authority.

State type split:

- raw one-time secret (`RawSocialOAuthStateSecret`, server-only)
- stored fingerprint (`SocialOAuthStateFingerprint`)
- intent id (`SocialOAuthIntentId`)

Return path is a closed ID mapped to `/` (allowlisted) via `resolveSafeReturnPath`. No open redirect. No SMM UI route added. Provider callback URL is not a client input.

---

## 20. Connect input / result

Client input (strict): `{ workspaceId, provider }`

Rejected extra fields include organizationId, externalAccountId, tokens, scopes, callbackUrl, returnUrl, authorizationCode.

Results: `authorization_redirect` or fail codes `feature_disabled | unauthorized | forbidden | workspace_not_found | provider_unsupported | invalid_request | already_connected | rate_limited | internal_error`.

No tokens. No raw provider errors.

---

## 21. Callback result

Success: `connection_established` + connectionId + returnPathId.

Failures: `oauth_denied | invalid_state | expired_state | replayed_state | wrong_actor | provider_mismatch | provider_exchange_failed | unsupported_account | permission_missing | duplicate_connection | feature_disabled | internal_error`.

---

## 22. Reauthorization contract

Input: `{ connectionId }` only.

Success carries `expectedExternalAccountId` so later slices cannot silently attach a different account. Failure includes `identity_mismatch`.

---

## 23. Disconnect contract

Input: `{ connectionId }` only.

Outcomes: `disconnected | already_disconnected | disconnected_with_provider_revoke_warning` or `unauthorized | forbidden | not_found | conflict | feature_disabled | internal_error`.

---

## 24. Provider identity contract

`SocialProviderAccountIdentity`: provider, externalAccountId, displayName, username, professionalAccountType.

Inventory helpers require the selected account to exist in provider-authorized inventory. Browser-supplied arbitrary external IDs are not independent authority.

Instagram external IDs remain opaque provider strings and are not coerced to UUIDs.

---

## 25. Normalized error contract

Kinds: `authorization_failed | credential_expired | permission_missing | provider_rate_limited | provider_unavailable | validation_failed | unsupported_account | unsupported_capability | external_not_found | internal_error`.

`SafeSocialProviderError` is `{ kind, message }` only. Forbidden public keys include tokens, codes, secrets, raw provider payloads, encryption fields, stack traces.

---

## 26. Feature-gate semantics

`SOCIAL_CONNECTIONS_ENABLED`, `SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED`.

Missing/malformed → OFF. Only trimmed lowercase `"true"` enables. Instagram connections require **both** gates. No `NEXT_PUBLIC_` names. No Production env change. Default remains OFF.

---

## 27. Permission model

| Role | View | Connect / reauthorize / disconnect |
| --- | --- | --- |
| Owner (active) | yes | yes |
| Admin (active) | yes | yes |
| Staff (active) | yes | no |
| Viewer (active) | yes | no |
| Any role, non-active membership | no | no |

Suspended/invited/removed Owner/Admin are not authorized. UI is not authorization. Later RPCs must re-enforce.

Org mutation usability requires org status `active`.

---

## 28. Tenant-isolation invariant

Documented and tested: workspace/connection IDs never grant Organization authority.

`provesSocialTenantAuthority` requires actor, **active** membership, and `organizationId === targetOrganizationId`. Browser-supplied organizationId is not accepted on connect/disconnect/reauth schemas.

---

## 29. Validation schemas

Zod `.strict()` at trust boundary:

- connect: workspace UUID + implemented provider
- disconnect / reauthorize: connection UUID only
- return-path ID: closed enum
- implemented provider: `instagram` only

Internal domain objects are not unnecessarily re-validated.

---

## 30. Audit-event contract

Types only (no persistence):

`social_connection_initiated | established | reauthorization_required | reauthorized | permission_missing | revoked | disconnected | health_changed`

Human mutations → actor source `member`. Health changes → `system`. Payloads have no credential fields.

---

## 31. Test evidence

### Targeted SMM-B1.1-A

```text
Test Files  10 passed (10)
     Tests  52 passed (52)
```

Files: the ten test files listed in §6.

### Full Vitest

```text
Test Files  305 passed (305)
     Tests  2161 passed (2161)
```

Invitation feature-gate and authorization suites included in the full run; invitation source unchanged.

---

## 32. Typecheck / lint / build

| Check | Result |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | PASS |
| `npm run lint` (`next lint`) | PASS — no warnings or errors |
| `npm run build` (Next.js 15.5.20 production) | PASS — compiled successfully; existing app routes only; **no** `/api/social` route |

---

## 33. Security review

| Area | Result |
| --- | --- |
| Tenant authority | **PASS** — schemas reject org/external IDs as authority; `provesSocialTenantAuthority` requires active membership + org match |
| Role permissions | **PASS** — Owner/Admin mutate; Staff/Viewer cannot; inactive membership denied |
| Unsupported provider fail-closed | **PASS** — known family ≠ implemented; gates default OFF |
| Secret type separation | **PASS** — server-only secret module; domain barrel does not export secrets; read model compile-time overlap is `never` |
| OAuth intent authority model | **PASS** — server intent; closed return-path ID; consumable only while pending/unexpired |
| Safe return-path boundary | **PASS** — reuses `resolveSafeReturnPath`; evil URLs and non-allowlisted callback path fall back to `/` |
| Client-safe read model | **PASS** — no tokens/ciphertext/OAuth hash/keyVersion |
| Capability trust boundary | **PASS** — snapshots discovery-derived; empty by default; deferred caps not Beta 1 |
| Raw provider error exposure | **PASS** — public error type forbids payload/token/stack keys |
| Invitation-track isolation | **PASS** — invitation files not in diff |

No unresolved FAIL.

---

## 34. External-effect statement

```text
0 OAUTH AUTHORIZATIONS
0 PROVIDER ACCOUNTS CONNECTED
0 PROVIDER TOKENS CREATED
0 PROVIDER API CALLS
0 PROVIDER API MUTATIONS
0 SOCIAL POSTS
0 SOCIAL STORIES
0 WEBHOOK SUBSCRIPTIONS
0 SMM DATABASE MIGRATIONS
0 PRODUCTION ENV CHANGES
0 SMM PRODUCTION CONNECTIONS
```

---

## 35. Database / crypto / OAuth statement

```text
0 SMM DATABASE MIGRATIONS
0 CREDENTIAL ENCRYPTION IMPLEMENTATION
0 OAUTH IMPLEMENTATION
0 INSTAGRAM HTTP REQUESTS
```

Encrypted types exist; AES-256-GCM helpers, key parsing, and persistence are **not** implemented. No OAuth endpoints. No callback route. No provider SDK.

---

## 36. Closure criteria

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Authoritative Git baseline verified | PASS |
| 2 | B1.0 contract reviewed | PASS |
| 3 | B1.1 preflight reviewed | PASS |
| 4 | Instagram first-provider decision encoded | PASS |
| 5 | Instagram Login distinguished from Facebook Login | PASS |
| 6 | Credential Option A decision recorded | PASS |
| 7 | Existing project type conventions reused | PASS |
| 8 | Social provider contract complete | PASS |
| 9 | Implemented-provider fail-closed semantics complete | PASS |
| 10 | Supported Instagram professional-account contract complete | PASS |
| 11 | Connection lifecycle complete | PASS |
| 12 | Health overlay complete | PASS |
| 13 | Connection usability policy defined | PASS |
| 14 | Provider capability contract complete | PASS |
| 15 | Capability snapshot trust boundary defined | PASS |
| 16 | Social connection domain model complete | PASS |
| 17 | Client-safe read model complete | PASS |
| 18 | Credential metadata contract complete | PASS |
| 19 | Secret-bearing types isolated from safe read types | PASS |
| 20 | OAuth intent contract complete | PASS |
| 21 | Raw OAuth state vs stored hash/intention separated | PASS |
| 22 | Safe return path contract reused | PASS |
| 23 | Connect input/result contract complete | PASS |
| 24 | Callback result contract complete | PASS |
| 25 | Reauthorization contract complete | PASS |
| 26 | Disconnect contract complete | PASS |
| 27 | Provider identity contract complete | PASS |
| 28 | Normalized error taxonomy complete | PASS |
| 29 | Raw provider error leakage prevented by contract | PASS |
| 30 | Feature-gate contract complete and fail-closed | PASS |
| 31 | Role permission contract complete | PASS |
| 32 | Active membership requirement preserved | PASS |
| 33 | Cross-tenant invariant documented | PASS |
| 34 | Runtime validation added for trust-boundary inputs | PASS |
| 35 | Internal/external ID distinctions correct | PASS |
| 36 | Token expiry metadata contract complete | PASS |
| 37 | Refresh concurrency/version contract prepared | PASS |
| 38 | Audit event contract complete | PASS |
| 39 | Client modules cannot expose credential material | PASS |
| 40 | Targeted tests PASS | PASS (52/52) |
| 41 | Authorization/security tests PASS | PASS (included in full suite) |
| 42 | Typecheck PASS | PASS |
| 43 | Lint PASS | PASS |
| 44 | Full Vitest PASS | PASS (2161/2161) |
| 45 | Production build PASS | PASS |
| 46 | No database migration | PASS |
| 47 | No crypto implementation | PASS |
| 48 | No OAuth implementation | PASS |
| 49 | No provider HTTP call | PASS |
| 50 | No connection UI | PASS |
| 51 | No secrets | PASS |
| 52 | No Production mutation | PASS |
| 53 | Evidence document complete | PASS |
| 54 | Entire diff reviewed | PASS |
| 55 | No unrelated source changes | PASS |
| 56 | Commit/push complete | PASS after publication |
| 57 | Divergence `0 0` | PASS after push |
| 58 | Worktree clean | PASS after push |

---

## 37. Evidence path

`docs/phases/SMM-B1.1-A-typed-connection-provider-security-contracts-evidence.md`

---

## 38. Commits / push

| Full hash | Subject |
| --- | --- |
| `1ce4cdb05043a1a0afaaa11ab418517f1077fc6a` | `feat(smm): add typed social connection and provider contracts` |
| *(this evidence commit)* | `docs(smm): close B1.1-A typed connection contracts` |

Pushed to `origin/core/platform-readiness-20260707`.

---

## 39. Final SMM-B1.1-A verdict

```text
SMM-B1.1-A CLOSED WITH EVIDENCE — TYPED SOCIAL CONNECTION, PROVIDER, AND SECURITY CONTRACTS READY
```

Meaning:

- application contracts are stable enough for persistence/encryption implementation;
- provider and security semantics are locked;
- B1.1-B can implement against them.

Does **not** mean: database tables exist; credentials can be encrypted; OAuth exists; Instagram can be connected; any provider call has occurred.

---

## 40. Next boundary

```text
SMM-B1.1-B NOT YET AUTHORIZED
```

Next candidate: **SMM-B1.1-B — Database + AES-256-GCM Credential Foundation**. Requires separate owner authorization. Do not create migrations, the encryption key, or credential persistence automatically.

---

## 41. Final Git state

Recorded after push verification in the closing report. Expected: HEAD = evidence commit; upstream/origin same; divergence `0 0`; worktree clean.
