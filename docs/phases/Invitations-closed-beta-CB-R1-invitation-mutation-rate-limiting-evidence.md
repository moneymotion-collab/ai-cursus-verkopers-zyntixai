# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-R1 — Invitation Mutation Abuse Protection (Rate Limiting)

### CB-R1 IMPLEMENTATION PASS — INVITATION MUTATION ABUSE PROTECTION READY FOR OWNER-APPROVED PRODUCTION APPLY

| Field | Value |
| --- | --- |
| Official scope | **CB-R1 — Invitation Mutation Abuse Protection (Rate Limiting)** |
| Document type | Implementation + local verification evidence |
| Official phase number | **NONE ASSIGNED** — unnumbered closed-beta readiness slice (no B1.x invented) |
| Date | 2026-08-14 |
| Formal status | `CB-R1 IMPLEMENTATION PASS` — production apply **not** performed |
| Owner authorization | `OWNER APPROVED — AUTHORIZE CB-R1 INVITATION MUTATION ABUSE PROTECTION (RATE LIMITING) IMPLEMENTATION` |
| Closed-beta ready | **NO** (email, gate, live matrices remain) |
| General-launch ready | **NO** |
| Parent design contract | `docs/phases/Invitations-member-administration-design-security-and-readiness-contract.md` §27 |
| Prior Slice 7 closure | `docs/phases/Invitations-member-administration-operator-ui-production-verification-closure-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `948ff6f9877a78e5ddf9b00cc3f5b83ffc349dd3` |
| Governing standard | `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` |
| Course Sellers Beta 1 | Remains **CLOSED AND PUBLISHED** — not reopened |
| Production mutation | **NOT AUTHORIZED / NOT PERFORMED** |

```text
CB-R1 — INVITATION MUTATION ABUSE PROTECTION
IMPLEMENTATION PASS (LOCAL)
PRODUCTION APPLY: PENDING OWNER APPROVAL
EMAIL / GATE / EXTERNAL INVITES: NOT STARTED
```

---

## 1. Owner authorization (FACT)

Owner authorized exactly:

**OWNER APPROVED — AUTHORIZE CB-R1 INVITATION MUTATION ABUSE PROTECTION (RATE LIMITING) IMPLEMENTATION**

Authorized: implementation, local verification, evidence, and publication of CB-R1 code/docs.

**Not** authorized: production migration apply, email delivery, `INVITATIONS_ENABLED=true`, acceptance gate activation, external closed-beta invitations, Member Admin expansion, Coaching, reopening Beta 1 / Attention / NBA.

---

## 2. Verified starting Git baseline (FACT / VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `948ff6f9877a78e5ddf9b00cc3f5b83ffc349dd3` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

Baseline matched authorization. Implementation proceeded.

---

## 3. Problem statement (FACT)

Preflight established create/resend rate limiting as absent and required before normal-user invitation production readiness.

Mutation surfaces reachable by authenticated callers:

| Path | Surface |
| --- | --- |
| UI | `/settings/members` → Invite Member form / Pending Resend |
| Server actions | `createInvitationAction` / `resendInvitationAction` |
| Adapters | `createOrganizationInvitation` / `resendOrganizationInvitation` |
| Direct RPC | `public.create_organization_invitation` / `public.resend_organization_invitation` (EXECUTE to `authenticated`) |

**FACT:** UI/server-action-only limiting would be bypassable by direct RPC. CB-R1 therefore enforces inside the SECURITY DEFINER RPCs.

Revoke remains protective and is **not** rate-limited in CB-R1 (DEFERRED unless future owner authorization).

Acceptance rate limiting is **DEFERRED** (CB-G1 / later); CB-R1 does not weaken acceptance.

---

## 4. Chosen rate-limit architecture (IMPLEMENTED)

### Enforcement layer

**Database / RPC-native** fail-closed counters:

1. Private table `private.organization_invitation_mutation_rate_limits`
2. Private helper `private.consume_organization_invitation_mutation_rate_limit(...)`
3. Consumed inside `public.create_organization_invitation` and `public.resend_organization_invitation` after authorization and before mutation

### Why selected

- Direct-RPC resistant (YES — FAIL CLOSED)
- Atomic / concurrency-safe (`INSERT … ON CONFLICT` + `FOR UPDATE`)
- Tenant- and actor-scoped primary key
- No Redis / Upstash / Cloudflare KV / other external provider
- Matches existing Supabase SECURITY DEFINER invitation architecture
- Minimal dependencies

### Alternatives rejected

| Alternative | Reason rejected |
| --- | --- |
| UI-only / client throttle | Bypassable |
| Server-action-only limiter | Bypassable via direct RPC |
| External Redis/Upstash | Requires new infra + owner approval; unnecessary |
| Counting only `organization_invitation_events` | Race-prone; couples abuse control to audit events |

### External infrastructure

**None introduced.**

---

## 5. Rate-limit contract (IMPLEMENTED)

### Protected actions

- `create` invitation
- `resend` invitation

### Dimensions

| Action | Bucket key | Window |
| --- | --- | --- |
| Create | `(organization_id, actor_user_id, 'create', '')` | fixed 1 hour |
| Resend | `(organization_id, actor_user_id, 'resend', invitation_id)` | fixed 1 hour |

Aligned with design contract §27: create per actor/org; resend per invite/actor/org.

### Thresholds (CB-R1 closed-beta defaults)

**INFERENCE / DOCUMENTED DEFAULTS — not previously owner-approved numerics:**

| Action | Max attempts / window | Window seconds |
| --- | --- | --- |
| Create | **10** | **3600** |
| Resend | **3** | **3600** |

Rationale: conservative closed-beta allowance for legitimate Owner/Admin workflows while blocking spam loops and direct-RPC flood. Values live as literals in migration (easy to adjust in a future additive migration).

### Behavior

- At/under limit: consume + continue mutation path
- Above limit: return `result_code = 'rate_limited'`; **no** invitation insert/update; **no** token rotation; **no** `invitation_created` / `invitation_resent` event
- Window reset: when `now >= window_started_at + window`, counter resets to 1
- Retention: opportunistic delete of same actor/org rows with `updated_at` older than 7 days

### Operation order (create)

1. Authenticated (`auth.uid()`)
2. Input validation
3. Active membership / org active / target-role matrix
4. **Rate limit**
5. Collision / pending uniqueness / lifecycle
6. Insert + `invitation_created`
7. Return success (raw_token discarded by app)

### Operation order (resend)

1. Authenticated
2. Membership / org active
3. Load invitation + manage matrix + pending/expiry checks
4. **Rate limit**
5. Token rotate + expiry update + `invitation_resent`

Unauthorized callers still receive authorization/unavailable denials **before** rate-limit consume (no privilege via limiter state).

---

## 6. Security properties

| Property | Status |
| --- | --- |
| Server enforced | **IMPLEMENTED** — RPC/DB |
| Direct-RPC resistance | **IMPLEMENTED** / **VERIFIED** (local live SQL) |
| Authorization preserved | **IMPLEMENTED** — rate limit after authz |
| Tenant isolation | **IMPLEMENTED** / **VERIFIED** (org B create succeeds while org A create limited) |
| Actor aware | **IMPLEMENTED** — actor_user_id in PK |
| Concurrency safe | **IMPLEMENTED** — row lock path |
| No email enumeration via limiter | **IMPLEMENTED** — neutral `rate_limited` message |
| No raw token in limiter state/logs | **IMPLEMENTED** — scope_key is invitation UUID text only for resend |
| No secret leakage | **IMPLEMENTED** — structured `RAISE LOG` uses org/actor/action/scope only |
| Revoke unconstrained by CB-R1 | **FACT** — intentional |

---

## 7. Database / migration changes (IMPLEMENTED)

| Object | Detail |
| --- | --- |
| Migration | `supabase/migrations/20260814140000_add_organization_invitation_mutation_rate_limits.sql` |
| Table | `private.organization_invitation_mutation_rate_limits` |
| Helper | `private.consume_organization_invitation_mutation_rate_limit` |
| RPCs replaced | `public.create_organization_invitation`, `public.resend_organization_invitation` |
| Grants | Table/helper: revoke from public/anon/authenticated/service_role; RPCs: authenticated EXECUTE only |

**LOCAL VERIFIED:** `supabase db reset` applied migration successfully.

**PRODUCTION APPLY:** not performed.

---

## 8. Application changes (IMPLEMENTED)

| File | Change |
| --- | --- |
| `src/features/invitations/server/create-invitation-result.ts` | `rate_limited` code + message |
| `src/features/invitations/server/resend-invitation-result.ts` | `rate_limited` code + message |
| UI forms/actions | unchanged structurally — already surface `result.message` / recover pending state |

User-facing message:

**Too many invitation attempts. Try again later.**

---

## 9. Error and UX behavior

| Layer | Behavior |
| --- | --- |
| DB/RPC | `result_code = 'rate_limited'`; null invitation_id/token |
| Adapter | `{ kind: 'rate_limited' }` — discards any raw_token |
| Action | `{ ok: false, code: 'rate_limited', message: … }` — no revalidate |
| UI | Error alert; buttons recover; no false success |

---

## 10. Audit / observability

| Captured | Not captured |
| --- | --- |
| Postgres `RAISE LOG` on deny: action, organization_id, actor_user_id, scope_key | Invitation lifecycle events for denials |
| Rate-limit counter rows (no email/token) | Remaining counts to clients |
| Existing invitation events only on real mutations | Secrets / cookies / OTPs |

Denial is **not** recorded as `invitation_created` / `invitation_resent`.

---

## 11. Automated test evidence (VERIFIED)

### Targeted / invitation / security

- `tests/security/invitation-rate-limit-security.test.ts` — **5 passed**
- Invitation + security suites — **44 files, 348 passed**
- Full vitest suite — recorded in §12

### Local live SQL (LOCAL ONLY)

`tests/security/invitation-rpc-live-verification.sql` → **NOTICE: INVITATION_RPC_LIVE_VERIFY_PASS** (transaction rolled back)

Verified deny semantics include:

- resend over limit → `rate_limited`; token_hash/expires_at unchanged; no extra `invitation_resent`
- create over limit → `rate_limited`; no invitation row; no token
- org B create not blocked by org A counters
- authenticated cannot execute private consume helper

Harness note: obsolete “accept must not exist” guard removed so operator live verify matches current schema (acceptance foundation already closed separately).

---

## 12. Static / local verification (VERIFIED)

| Check | Result |
| --- | --- |
| TypeScript `npm run typecheck` | PASS |
| Lint `npm run lint` | PASS (0 warnings/errors) |
| Local `supabase db reset` | PASS — CB-R1 migration applied |
| Invitation + security vitest | 348 passed / 44 files |
| Full vitest | **2057 passed / 289 files** |

---

## 13. Authorization regression matrix

| Actor / case | Expected | CB-R1 impact |
| --- | --- | --- |
| Owner create/resend under limit | allow | preserved |
| Admin create/resend permitted roles under limit | allow | preserved |
| Staff | deny | before rate limit |
| Viewer | deny | before rate limit |
| Suspended/non-active | deny | before rate limit |
| Cross-tenant | deny / unavailable | before rate limit |
| Direct RPC authorized flood | `rate_limited` | **new** fail-closed |
| Admin escalate to admin/owner target | deny | preserved |

Automated coverage: prior invitation action/security tests remain green; new rate-limit mapping + migration contract + local live SQL.

---

## 14. Scope confirmation (FACT)

CB-R1 did **NOT** implement:

- invitation email delivery (CB-E1)
- `INVITATIONS_ENABLED=true` / acceptance gate ON (CB-G1)
- external closed-beta invitations (CB-Q1)
- new audience / Coaching
- unrelated Member Administration features
- revoke rate limiting
- production DB apply / deploy / env secrets

---

## 15. Remaining closed-beta roadmap (DEFERRED)

1. **CB-E1 — Production Invitation Email Delivery**
2. **CB-G1 — Acceptance Gate Activation Hardening + Runbook**
3. **CB-Q1 — Controlled Live Closed-Beta Verification Matrices**
4. **CB-PUB — Closed-Beta Readiness Closure Evidence**

Do not start these without separate owner authorization.

---

## 16. Production impact

| Item | Required? |
| --- | --- |
| Migration `20260814140000_add_organization_invitation_mutation_rate_limits.sql` | **YES** — production apply pending |
| Env change | **NO** |
| Deploy | Recommended after production apply (runtime mapping already safe; DB enforcement needs apply) |
| Secrets | **NO** |
| External service | **NO** |

Until production apply, production create/resend remain **without** CB-R1 limiter (existing authorization only).

---

## 17. Owner decision required

```text
OWNER APPROVAL REQUIRED — AUTHORIZE CB-R1 CONTROLLED PRODUCTION APPLY
```

Exact next production step (not performed here):

1. Apply migration `20260814140000_add_organization_invitation_mutation_rate_limits.sql` to linked production Supabase under separate authorization
2. Verify RPC returns `rate_limited` under seeded counters / controlled probes
3. Confirm create/resend authorization matrix unchanged
4. Do **not** enable email or gate as part of that apply

Do **not** request CB-E1 until CB-R1 production apply is closed per governance.

---

## 18. Commits / publication

| Item | Value |
| --- | --- |
| Implementation commit | `2b11250783eaae0b9082a4a0177d28b8288a4cd8` — `feat(invitations): add create/resend mutation rate limiting` |
| Evidence commit | `560528bf34f7a7fe13b4138f19c4b1d1021a06cb` — `docs(invitations): publish CB-R1 rate limiting evidence` |
| Push | **DONE** — `origin/core/platform-readiness-20260707` |
| Divergence after push | `0 0` |
| Production apply | **NOT DONE** |

---

## 19. Final Git state

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Final HEAD | `560528bf34f7a7fe13b4138f19c4b1d1021a06cb` |
| Upstream | `origin/core/platform-readiness-20260707` @ same SHA |
| Divergence | `0 0` |
| Worktree | clean after publication (except any follow-up evidence hygiene commit) |

---

## Evidence language legend used above

- **FACT** — proven by code/Git/docs
- **IMPLEMENTED** — changed in CB-R1
- **VERIFIED** — observed via tests/local DB
- **INFERENCE** — reasoned (threshold numerics)
- **DEFERRED** — intentionally outside slice
