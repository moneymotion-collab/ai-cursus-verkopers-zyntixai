# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-G1 — Acceptance Gate Activation Hardening + Controlled Activation Runbook

### CB-G1 CLOSED WITH EVIDENCE — INVITATION ACCEPTANCE GATE HARDENED AND CONTROLLED ACTIVATION RUNBOOK READY

| Field | Value |
| --- | --- |
| Official scope | **CB-G1 — Acceptance Gate Activation Hardening + Runbook** |
| Document type | Hardening + deployment + activation/rollback runbook evidence |
| Date | 2026-08-14 |
| Owner authorization | `OWNER APPROVED — AUTHORIZE CB-G1 ACCEPTANCE GATE ACTIVATION HARDENING + CONTROLLED ACTIVATION RUNBOOK` |
| Starting HEAD | `c20b73db7588a1d73006d2a87480d2ac6fd44042` |
| Implementation HEAD | `5d7486b8fa00e6efd3f1ec7108cc8387abd9b87d` |
| Formal status | **CLOSED WITH EVIDENCE** |
| Real emails during CB-G1 | **0** |
| Invitation-derived memberships during CB-G1 | **0** |
| Production acceptance | remained **OFF** |
| Production delivery | remained **OFF** |
| Database migration | **NO MIGRATION REQUIRED** |

```text
CB-G1 CLOSED WITH EVIDENCE — INVITATION ACCEPTANCE GATE HARDENED AND CONTROLLED ACTIVATION RUNBOOK READY
INVITATIONS_ENABLED=false
INVITATION_EMAIL_DELIVERY_ENABLED=false
0 REAL INVITATION EMAILS SENT DURING CB-G1
0 INVITATION-DERIVED MEMBERSHIPS CREATED
OWNER ROADMAP DECISION REQUIRED — CB-G1 CLOSED; CB-Q1 NOT YET AUTHORIZED
```

---

## 1. Owner authorization (FACT)

**OWNER APPROVED — AUTHORIZE CB-G1 ACCEPTANCE GATE ACTIVATION HARDENING + CONTROLLED ACTIVATION RUNBOOK**

Covered: acceptance architecture hardening, tests, deploy with acceptance OFF, activation/kill-switch/incident runbooks, evidence.

**Not** covered: `INVITATIONS_ENABLED=true`; real acceptance; real emails; CB-Q1; CB-PUB.

---

## 2. Starting baselines (VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `c20b73db7588a1d73006d2a87480d2ac6fd44042` |
| Divergence | `0 0` |
| Worktree | clean |
| Prior CB-E1-E | CLOSED AND PRODUCTION VERIFIED |
| Starting deploy | `dpl_G3U17mUBayC8s4DCPooNRg2UbuGd` READY |
| Alias | `https://zyntixai.vercel.app` |
| Delivery / acceptance | both **OFF** |
| DB | `dmctinrcjvsgmoxwwodw` / `20260814150000` aligned |
| Membership baseline (QA org) | **6** active |
| Pending invites | **0** |
| Submitted delivery attempts | **2** (CB-E1-E retained evidence) |

---

## 3. Existing acceptance architecture (MAPPED)

```text
Email CTA
  → GET /invite/accept/exchange?token=<64-hex>
      gate OFF → 303 /invite/accept (no seal)
      gate ON + shape OK → seal HttpOnly continuation → 303 /invite/accept
  → GET /invite/accept (token-free confirm surface)
  → auth continuation (login/register) when needed
  → explicit Accept server action (no client args)
  → public.accept_organization_invitation(p_raw_token)
  → membership + invitation_accepted
```

Key paths:

- `src/app/invite/accept/exchange/route.ts`
- `src/app/invite/accept/page.tsx`
- `src/features/invitations/actions/accept-invitation-action.ts`
- `src/features/invitations/server/continuation.ts`
- `src/features/invitations/server/invitations-feature.ts`
- `src/features/invitations/server/accept-invitation.ts`
- RPC: `20260810143000` + hardening `20260810143010`

---

## 4. Security findings before CB-G1 delta (FACT)

Prior slices already provided:

- scanner-safe GET (seal/redirect only; no RPC);
- argument-free Accept mutation;
- server gate at exchange/page/action;
- server-side org/role/email authority from invitation row;
- continuation rejects org/role/email authority fields;
- open-redirect protections (`resolveSafeReturnPath`, exchange ignores client redirects);
- FOR UPDATE + post-lock token revalidation;
- wrong-email / suspended / already-member matrix in RPC;
- same-origin Accept defense.

CB-G1 residual gaps addressed without migration:

1. Gate-OFF Accept UI code previously collapsed to `invitation_unavailable` (message differed) — **hardened** to distinct `feature_disabled` UI code.
2. CB-G1 architecture lock tests added.
3. Activation / kill-switch / incident runbooks published (this document).

Accept rate limiting remains **deferred** (explicit CB-R1 note); not required for CB-G1 closure criteria; would need separate migration authorization.

---

## 5. Implemented hardening (IMPLEMENTED)

| Change | Detail |
| --- | --- |
| `feature_disabled` UI code | `accept-invitation-result.ts` maps gate-OFF distinctly from unavailable invitation |
| CB-G1 lock tests | `tests/features/invitations/cb-g1-acceptance-hardening-locks.test.ts` |
| Gate test update | asserts `code === "feature_disabled"` |

Commit: `5d7486b8fa00e6efd3f1ec7108cc8387abd9b87d` — `feat(invitations): harden acceptance gate UX and CB-G1 locks`

---

## 6–18. Hardening verification summary (VERIFIED)

| Topic | Result |
| --- | --- |
| Scanner-safe GET | GET exchange never calls Accept RPC; production smoke 303→`/invite/accept` for bad + 64-hex tokens while gate OFF |
| Mutation boundary | `acceptInvitationAction()` only; POST/server-action path |
| Gate | fail-closed exact `"true"`; checked before RPC; missing/false OFF |
| Token | `^[0-9a-f]{64}$`; hash storage; revalidated at mutation via RPC |
| Lifecycle | pending eligible; revoked/expired/accepted/old-hash fail closed |
| Identity | auth.users email vs invitation email_normalized; mismatch retains cookies |
| Role/org | from invitation row only; no client params |
| Auth continuation | trusted cookies + allowlisted `/invite/accept` return |
| Double-submit | UI pendingRef + RPC FOR UPDATE / terminalize |
| Audit | `invitation_accepted` only on success path |
| Failure UX | FeatureDisabledState; UnavailableState; ReadyState; email_mismatch switch-account |
| DB migration | **NO MIGRATION REQUIRED** |

---

## 19–24. Verification suites (VERIFIED)

| Suite | Result |
| --- | --- |
| Targeted accept/security subset | **100** tests PASS (7 files including CB-G1 locks) |
| Typecheck | **PASS** |
| Lint | **PASS** (no warnings/errors) |
| Full Vitest | **295 files / 2109 tests PASS** |
| Production build | **PASS** (`/invite/accept`, `/invite/accept/exchange` present) |

---

## 25–27. Production deployment (DEPLOYED)

| Item | Result |
| --- | --- |
| Rollback candidate | `dpl_G3U17mUBayC8s4DCPooNRg2UbuGd` |
| CB-G1 deploy | `dpl_8pSbXBHpcTyPPASAwWaEFBdQ7xtr` READY |
| Deployed SHA | `5d7486b8fa00e6efd3f1ec7108cc8387abd9b87d` |
| Alias | `https://zyntixai.vercel.app` |
| Env changed | **no** (gates left OFF) |

Post-deploy gates:

`INVITATION_EMAIL_DELIVERY_ENABLED=false`  
`INVITATIONS_ENABLED=false`

---

## 28–30. Production no-acceptance smoke (VERIFIED)

| Check | Result |
| --- | --- |
| Home | 307 auth redirect |
| `/invite/accept` | 200; unavailable/gate-off copy present |
| Exchange malformed token | 303 → `/invite/accept` |
| Exchange shape-valid token (gate OFF) | 303 → `/invite/accept` (no acceptance) |
| `/settings/members` | healthy; restricted rollout; acceptance disabled notice |
| Active members | **6** unchanged |
| Pending invites | **0** |
| Submitted delivery attempts | **2** unchanged |
| Real emails in CB-G1 | **0** |
| Invitation-derived memberships | **0** |

---

## 31. Controlled activation runbook for CB-Q1 (READY — NOT EXECUTED)

### Pre-activation

1. Git clean on intended SHA; divergence `0 0`.
2. Confirm production deploy READY; note rollback ID.
3. Confirm DB `20260814150000` aligned.
4. Confirm `INVITATION_EMAIL_DELIVERY_ENABLED=false` unless separately authorized.
5. Confirm QA membership baseline and pending invite inventory.
6. Prepare one controlled pending QA invitation + current token (owner-held; not logged).

### Activation

1. Set Production `INVITATIONS_ENABLED=true` (Sensitive).
2. Redeploy same reviewed app SHA to Production (`vercel deploy --prod --project zyntixai --scope guus-projects-ai`).
3. Verify deploy READY + alias.
4. Prove acceptance ON via controlled smoke (not scanner).
5. Keep delivery OFF unless separately authorized.

### Controlled acceptance

1. Use current token only (open exchange → ReadyState → Sign in/register if needed → Accept once).
2. Verify membership org/role; invitation accepted; `invitation_accepted` event; no duplicate.

### Negative checks (controlled)

Revoked/old/wrong-account/scanner GET/double-submit as fixtures allow.

### Restoration

1. Set `INVITATIONS_ENABLED=false`.
2. Redeploy OFF state.
3. Prove gate OFF; cleanup QA membership/invite per policy; health check.

Do **not** execute this runbook in CB-G1.

---

## 32. Kill-switch / rollback runbook

### Primary acceptance kill switch

1. Vercel Project `zyntixai` → Production env `INVITATIONS_ENABLED=false`.
2. Redeploy Production (env is deployment-tied; not instantaneous).
3. Verify `/invite/accept` shows unavailable; Accept mutation returns feature_disabled; no seal on exchange.

### Break-glass application rollback

Promote/rollback to prior READY deployment (CB-G1 rollback candidate at start: `dpl_G3U17mU…`; after CB-G1: retain `dpl_8pSbXBH…` as current, keep prior IDs listed).

### Effects while OFF

- Pending invites remain pending.
- Received email links open exchange → token-free unavailable surface; **no membership**.
- Delivery remains independently controlled by `INVITATION_EMAIL_DELIVERY_ENABLED`.

---

## 33. Incident runbook (summary)

| Incident | Immediate actions |
| --- | --- |
| Wrong-role membership | Acceptance OFF + redeploy; stop QA; revoke/adjust via admin policy; preserve audit |
| Cross-tenant acceptance | Acceptance OFF immediately; rollback; preserve evidence; stop |
| Token leak | Acceptance OFF; revoke invitation; investigate logs; later resend if appropriate |
| Duplicate membership/event | Acceptance OFF; inspect idempotency/atomicity; stop |
| Unexpected external acceptance | Acceptance OFF; identify org/user; preserve audit |

---

## 34–35. Closure criteria / verdict

All CB-G1 closure criteria **PASS**.

```text
CB-G1 CLOSED WITH EVIDENCE — INVITATION ACCEPTANCE GATE HARDENED AND CONTROLLED ACTIVATION RUNBOOK READY
```

---

## 36–37. Roadmap / owner decision

Remaining:

1. CB-Q1 — Controlled Production Invitation Acceptance QA  
2. CB-PUB

```text
OWNER ROADMAP DECISION REQUIRED — CB-G1 CLOSED; CB-Q1 NOT YET AUTHORIZED
```

Do **not** set `INVITATIONS_ENABLED=true` without CB-Q1 authorization.

---

## 38–40. Publication

| Item | Value |
| --- | --- |
| Evidence path | `docs/phases/Invitations-closed-beta-CB-G1-acceptance-gate-hardening-runbook-evidence.md` |
| Implementation commit | `5d7486b8fa00e6efd3f1ec7108cc8387abd9b87d` |
| Evidence commit | `47b70ea05a025f52760b81c2e22e13a8c3c5fc99` |
| Branch | `origin/core/platform-readiness-20260707` |
| Divergence after publish | `0 0` clean |
