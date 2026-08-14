# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-R1 — Invitation Mutation Abuse Protection — Production Verification Closure

### CB-R1 CLOSED AND PRODUCTION VERIFIED — INVITATION MUTATION ABUSE PROTECTION ACTIVE

| Field | Value |
| --- | --- |
| Official scope | **CB-R1 — Controlled Production Apply + Verification** |
| Document type | Production apply + controlled QA closure evidence |
| Official phase number | **NONE ASSIGNED** — unnumbered closed-beta readiness slice |
| Date | 2026-08-14 |
| Formal status | `CB-R1 CLOSED AND PRODUCTION VERIFIED` |
| Owner authorization | `OWNER APPROVED — AUTHORIZE CB-R1 CONTROLLED PRODUCTION APPLY AND VERIFICATION` |
| Implementation evidence | `docs/phases/Invitations-closed-beta-CB-R1-invitation-mutation-rate-limiting-evidence.md` |
| Closed-beta ready | **NO** (email / gate / live matrices remain) |
| General-launch ready | **NO** |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `da8b1c66b52f7b801f475285f5ac1bb240891971` |
| Supabase project | `dmctinrcjvsgmoxwwodw` |
| Migration applied | `20260814140000_add_organization_invitation_mutation_rate_limits.sql` |
| Canonical production app | `https://zyntixai.vercel.app` → `dpl_CRe4rhPk2gjNcMB7vh9izMnJEq96` (Slice 7; unchanged) |
| Gate | **OFF** |
| Email delivery | **NOT IMPLEMENTED** |

```text
CB-R1 CLOSED AND PRODUCTION VERIFIED
INVITATION MUTATION ABUSE PROTECTION ACTIVE

MIGRATION APPLIED: 20260814140000
DIRECT-RPC LIMITER: VERIFIED
AUTHORIZATION: PRESERVED
EMAIL / GATE / EXTERNAL INVITES: NOT STARTED
```

---

## 1. Owner authorization (FACT)

**OWNER APPROVED — AUTHORIZE CB-R1 CONTROLLED PRODUCTION APPLY AND VERIFICATION**

Covered: preflight, dry-run, exact CB-R1 migration apply, schema/security verification, controlled QA, cleanup, evidence publication.

Not covered: CB-E1 email, gate ON, `INVITATIONS_ENABLED=true`, external invites, unrelated deploys/refactors, threshold changes.

---

## 2. Verified starting Git baseline (FACT / VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `da8b1c66b52f7b801f475285f5ac1bb240891971` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |
| CB-R1 commits present | `2b11250…` feat; `560528b…` docs; `da8b1c6…` finalize |

---

## 3. Production project verification (FACT / VERIFIED)

| Check | Result |
| --- | --- |
| Supabase CLI | `2.109.0` (via `npx supabase`) |
| Linked project ref | `dmctinrcjvsgmoxwwodw` (`linked: true`) |
| Project status | `ACTIVE_HEALTHY` |
| Region | `eu-central-1` |
| Matches historical production evidence | **YES** (B1.x / invitations docs + `.env.local` host ref) |
| Secrets | not printed |

---

## 4. Migration history preflight (VERIFIED)

| Item | Result |
| --- | --- |
| Remote latest before apply | `20260810143010` |
| Local latest | `20260814140000` |
| Local-only pending | **exactly** `20260814140000_add_organization_invitation_mutation_rate_limits.sql` |
| Remote-only | **none** |
| Order/drift | **PASS** — no unexplained drift |

---

## 5. Dry-run evidence (VERIFIED)

Command: `npx supabase db push --linked --dry-run`

Result:

```text
Would push these migrations:
 • 20260814140000_add_organization_invitation_mutation_rate_limits.sql
```

No other migrations. No destructive drift reported.

---

## 6. Production pre-apply state (VERIFIED)

| Object | Before |
| --- | --- |
| `private.organization_invitation_mutation_rate_limits` | **absent** (`to_regclass` null) |
| `private.consume_organization_invitation_mutation_rate_limit` | **absent** |
| `create_organization_invitation` | SECURITY DEFINER; `search_path=''`; **no** consume / rate_limited |
| `resend_organization_invitation` | SECURITY DEFINER; `search_path=''`; **no** consume / rate_limited |

---

## 7. Production apply (APPLIED)

| Item | Result |
| --- | --- |
| Command | `npx supabase db push --linked` |
| Migration | `20260814140000_add_organization_invitation_mutation_rate_limits.sql` |
| Result | **Finished supabase db push** — migration applied |
| Unrelated migrations | **none** |
| Note | Non-blocking CLI warning about pg-delta catalog cache / missing temp CA file; apply still completed |

---

## 8. Production migration state after apply (VERIFIED)

| Check | Result |
| --- | --- |
| `schema_migrations` contains `20260814140000` | **YES** (`add_organization_invitation_mutation_rate_limits`) |
| Local/remote list | both show `20260814140000` |
| Post-apply dry-run | **Remote database is up to date** |

---

## 9. Production schema/security verification (VERIFIED)

### Limiter table

Columns: `organization_id`, `actor_user_id`, `action`, `scope_key`, `window_started_at`, `attempt_count`, `updated_at` — **no email / raw token columns**.

Privileges: `authenticated` / `anon` / `service_role` **SELECT/INSERT/UPDATE/DELETE = false**.

### Helper

- SECURITY DEFINER; `search_path=''`
- EXECUTE: anon/authenticated/service_role = **false**
- `auth_can_consume` / table select/update for authenticated = **false**

### Create / resend RPCs

| RPC | auth EXECUTE | uses consume | threshold evidence | rate_limited |
| --- | --- | --- | --- | --- |
| create | true | true | create **10** / **3600** | true |
| resend | true | true | resend **3** / **3600** | true |

service_role EXECUTE on create/resend remains **false**.

---

## 10. Production rate-limit contract (VERIFIED)

| Action | Dimensions | Max | Window |
| --- | --- | --- | --- |
| Create | org + actor | **10** | **3600s** |
| Resend | org + actor + invitation | **3** | **3600s** |

Thresholds unchanged from CB-R1 implementation defaults (accepted for this apply).

---

## 11. Positive create verification (VERIFIED)

Controlled org: **ZyntixAI Production QA** (`2fc07699…`).

| Actor | Result |
| --- | --- |
| Admin `77c7a60b…` create viewer (`…cbr1.20260814@example.test`) | `success` + `invitation_created` |
| Owner `928bbcaf…` create staff then later viewer for bound test | `success` |

Raw tokens returned by RPC were **not** logged in evidence (boolean presence only). No email sent (CB-E1 absent).

---

## 12. Create rate-limit boundary verification (VERIFIED)

Method: seed Admin create counter to **10** (necessary to avoid creating 10 invitation rows), then direct RPC create.

| Check | Result |
| --- | --- |
| Result code | `rate_limited` |
| Row created for limit probe emails | **false** (`cbr1_limit_rows = 0`) |
| Direct RPC | **YES** — same path as app bypass |

Reconfirmed after cleanup window: Admin create still returns `rate_limited` with `row_created=false`.

---

## 13. Positive resend verification (VERIFIED)

| Check | Result |
| --- | --- |
| Owner resend of pending `d208f969…` | `success` |
| `invitation_resent` count | **1** |
| Raw token | returned by RPC (boolean true); **not** printed |

---

## 14. Resend rate-limit boundary verification (VERIFIED)

Method: seed Owner resend counter to **3** for invitation `d208f969…`, then direct RPC resend.

| Check | Result |
| --- | --- |
| Result code | `rate_limited` |
| `raw_token` null | **true** |
| Hash unchanged | **true** (SHA-256 digest compare) |
| Expiry unchanged | **true** |
| `invitation_resent` still 1 | **true** (no false event) |

---

## 15. Direct RPC bypass verification (VERIFIED)

All create/resend limit proofs used `public.create_organization_invitation` / `public.resend_organization_invitation` with JWT `sub` claims — **not** UI-only.

**FACT:** UI/action bypass cannot evade the limiter.

---

## 16. Authorization regression matrix (VERIFIED)

| Actor / case | Result |
| --- | --- |
| Owner create/resend under limit | **ALLOW VERIFIED** |
| Admin create under limit (first batch) | **ALLOW VERIFIED** |
| Admin escalate to `admin` target | **DENY VERIFIED** (`forbidden`) |
| Staff create | **DENY VERIFIED** (`forbidden`) |
| Staff resend | **DENY VERIFIED** (`invite_not_found_or_unavailable`) |
| Viewer create | **DENY VERIFIED** (`forbidden`) |
| Viewer resend | **DENY VERIFIED** (`invite_not_found_or_unavailable`) |
| Suspended create | **DENY VERIFIED** (`forbidden`) |
| Cross-tenant (isolation org owner → QA org) | **DENY VERIFIED** (`forbidden`) |
| Direct RPC | same rules **VERIFIED** |

---

## 17. Lifecycle / audit integrity (VERIFIED)

| Case | Events |
| --- | --- |
| Successful create | `invitation_created` present |
| Successful resend | `invitation_resent` present |
| Denied create | no limit-probe invitation rows |
| Denied resend | resent event count unchanged |
| Cleanup revoke | `invitation_revoked` for controlled rows |

Rate-limit denials do **not** masquerade as lifecycle mutations.

---

## 18. Privacy / secret verification (VERIFIED)

| Check | Result |
| --- | --- |
| Limiter columns store email | **NO** |
| Limiter stores raw token | **NO** |
| Evidence prints raw tokens | **NO** |
| Authenticated can read/update counters | **NO** |
| Authenticated can execute consume helper | **NO** |

QA emails used controlled `zyntixai.invitations.cbr1.*@example.test` aliases only.

---

## 19. QA cleanup (APPLIED / VERIFIED)

| Item | Result |
| --- | --- |
| CB-R1 pending invitations | **0** |
| CB-R1 rows retained | **3 revoked** (audit-preserving revoke, not hard-delete) |
| Limit-probe rows | **0** |
| Org pending overall | **0** |
| Limiter counters for QA actors | **retained** (security state; fixed 1h window reset) |

No real-customer invitations mutated. No limiter rows deleted.

---

## 20. Production health after verification (VERIFIED)

| Check | Result |
| --- | --- |
| Migration drift | none (up to date) |
| Schema errors | none observed |
| Grant breakage | none observed |
| Unexpected email delivery | none (CB-E1 absent) |
| Gate / env changes | none |

---

## 21. Deployment state (FACT)

| Item | Result |
| --- | --- |
| Canonical production deployment | `dpl_CRe4rhPk2gjNcMB7vh9izMnJEq96` (Slice 7 source `00caf3d…`) |
| Contains CB-R1 app `rate_limited` mapping? | **NO** — app still pre-CB-R1 mapping |
| DB enforcement active? | **YES** |
| Deploy performed in this task? | **NO** (not authorized / not required for protection ACTIVE) |

**INFERENCE:** Until a controlled app deploy including `2b11250…`, UI/server-action may map unknown `rate_limited` RPC codes to generic `unexpected` messaging. **Security enforcement remains active at RPC/DB.** Exact UX string requires a future owner-authorized deploy (separate from CB-E1).

---

## 22. CB-R1 closure status

```text
CB-R1 CLOSED AND PRODUCTION VERIFIED — INVITATION MUTATION ABUSE PROTECTION ACTIVE
```

---

## 23. Remaining closed-beta roadmap (DEFERRED)

1. **CB-E1 — Production Invitation Email Delivery**
2. **CB-G1 — Acceptance Gate Activation Hardening + Runbook**
3. **CB-Q1 — Controlled Live Closed-Beta Verification Matrices**
4. **CB-PUB — Closed-Beta Readiness Closure Evidence**

Optional non-roadmap note: controlled production app deploy for `rate_limited` UX mapping (not started).

---

## 24. Owner decision required

```text
OWNER ROADMAP DECISION REQUIRED — CB-R1 CLOSED; CB-E1 NOT YET AUTHORIZED
```

---

## 25. Commits / publication

| Item | Value |
| --- | --- |
| Closure evidence file | `docs/phases/Invitations-closed-beta-CB-R1-production-verification-closure-evidence.md` |
| Closure commit | `586c05dbaf2be6601f4e9279dc45dbf6dbd4f064` — `docs(invitations): close CB-R1 production verification` |
| Push | **DONE** → `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |

---

## 26. Final Git state

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Final HEAD | `586c05dbaf2be6601f4e9279dc45dbf6dbd4f064` (+ optional hygiene commit if sections updated) |
| Upstream / origin | same |
| Divergence | `0 0` |
| Worktree | clean after publication |
