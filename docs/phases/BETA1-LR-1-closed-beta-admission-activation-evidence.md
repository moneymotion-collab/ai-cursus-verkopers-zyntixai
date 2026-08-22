# BETA1-LR-1 — Closed-Beta Admission Activation Evidence

## A. Phase Verdict

```text
BETA1-LR-1 PROVIDER/OWNER VERIFICATION REQUIRED
```

PATH B (invite-only) is the chosen admission strategy. Repository architecture, server-side public-registration denial, invitation security, tenant binding, and abuse/idempotency are verified in current code and focused tests. Live Production still has invitation acceptance and invitation email delivery fail-closed OFF.

No implementation defect required a code change. No Production gate was mutated in this phase.

The remaining launch-admission blocker is operational, not a product-code defect:

* the intended tester mailbox has not been named;
* invitation delivery must not be enabled against an unknown or leftover allowlist;
* owner email + browser confirmation of `receive invite → accept → correct org → /home` has not occurred.

This phase is therefore **not closed**. Do not treat the following as true until the owner checkpoint below is PASSed:

```text
BETA1-LR-1 CLOSED WITH EVIDENCE — INVITE-ONLY CLOSED-BETA ADMISSION PRODUCTION VERIFIED
ZYNTIXAI CLOSED-BETA ADMISSION PATH B READY
```

---

## B. Repository State

| Check | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start HEAD | `6a6baba89ead8be5c5653299e83370806a710c7c` |
| Start message | `docs(beta): map closed beta launch readiness` |
| Final HEAD | this evidence commit |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Implementation commit | none |
| Evidence commit | this commit |
| Canonical Production app | `https://www.zyntixai.com` |
| Current Production deploy | `dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa` Ready (aliases `www.zyntixai.com`, `zyntixai.com`, `zyntixai.vercel.app`) |

HEAD matched the authoritative LR-0 SHA before this evidence commit. No reset or discard. Later documentation commits after last Social implementation remain docs-only; the live Production alias is unchanged.

---

## C. Admission Strategy

```text
PATH B — INVITE-ONLY
```

Public owner registration remains OFF so a non-invited visitor cannot provision a new closed-beta workspace from `/register`. Existing authenticated users can still sign in. Invitation acceptance is the only intended admission path, and it stays fail-closed until the owner names a tester mailbox and the delivery allowlist is bound to that mailbox.

PATH A (`PUBLIC_REGISTRATION_ENABLED=true`) was not activated.

Social enrollment is optional and separate. This phase does not enroll the tester in Social.

---

## D. Admission Architecture

Reconstructed from current code (not assumed from older CB evidence).

```text
Owner/Admin @ /settings/members
  → createInvitationAction
  → resolveOrganizationContext (org never trusted from the client alone)
  → canCreateOrganizationInvitation (Owner: admin|staff|viewer; Admin: staff|viewer; never owner)
  → public.create_organization_invitation
       pending row + SHA-256(token) + 7-day expires_at
       raw token = encode(gen_random_bytes(32), 'hex')  — 64 hex, transient
  → orchestrateInvitationDelivery (Resend; only if delivery gate + allowlist ready)
  → email CTA: {NEXT_PUBLIC_SITE_URL}/invite/accept/exchange?token=<64-hex>
  → GET /invite/accept/exchange
       shape-check token; AES-GCM seal into HttpOnly zyntix_invite_continuation (1800s)
       303 → /invite/accept  (no RPC, no DB accept)
  → GET /invite/accept
       if INVITATIONS_ENABLED !== exact "true" → FeatureDisabledState
       else ReadyState → /login or /register (invite mode) if needed
  → acceptInvitationAction()  (no client token/org/role args)
       same-origin check; session required; email confirmed
       unseal cookie → public.accept_organization_invitation(p_raw_token)
       email_normalized must match invitation; org/role from invitation row
       insert organization_members once, or already_member idempotent fulfill
       invitation status → accepted; token_hash cleared; invitation_accepted event
  → redirect /home?org=<invitation organizationId>
```

| Concern | Implementation |
| --- | --- |
| DB tables | `public.organization_invitations`, `public.organization_invitation_events`, `public.organization_members`; delivery ledger `private.organization_invitation_delivery_attempts` |
| Status model | `pending` / `accepted` / `revoked` (expired treated as unavailable on accept) |
| Token | 64-hex raw; SHA-256 stored; raw never returned after create to the browser action result |
| Continuation | `zyntix_invite_continuation` HttpOnly AES-GCM; secret `INVITE_CONTINUATION_SECRET` ≥ 32 chars; cookie is not org/role/email authority |
| Expiry | invitation 7 days; continuation 1800s |
| Invitable roles | `admin`, `staff`, `viewer` only — never Owner |
| Org ownership | create scoped by `resolveOrganizationContext`; accept binds to invitation.organization_id |
| Recipient binding | exact normalized email vs `auth.users` email after token proof |
| Email provider | Resend (`RESEND_API_KEY`, `INVITATION_EMAIL_FROM`) |
| Acceptance | `acceptInvitationAction` → `accept_organization_invitation` |
| Auth | session + confirmed email; invite-mode `/register` only with trusted continuation **and** `INVITATIONS_ENABLED` |
| Redirect | `/home?org=<accepted org>` via `buildProductDestination` |
| Idempotency | pending reuse on create; accept `already_member` terminalizes without role rewrite; delivery generation/idempotency unique indexes |
| Audit | `invitation_created` / `resent` / `revoked` / `accepted` events |
| Abuse | create 10/hour; resend 3/hour; empty allowlist fail-closed when delivery ON |
| Gates | `INVITATIONS_ENABLED` (accept + invite-mode register + exchange seal); `INVITATION_EMAIL_DELIVERY_ENABLED` + allowlist (mail only); `PUBLIC_REGISTRATION_ENABLED` independent |

Create / resend / revoke remain available on `/settings/members` even while acceptance is OFF. The Members UI shows `MemberAdministrationRolloutNotice` and does not hide the form. Invites created while acceptance is OFF are unusable until `INVITATIONS_ENABLED=true` and a current token exists.

Operator class:

* Routine tester admission after gates are ON: **SELF-SERVICE FROM PRODUCT** (`/settings/members`).
* Gate activation: **RUNBOOK-ASSISTED** (Vercel Production env + redeploy).
* **Not `MANUAL DB REQUIRED`** for normal onboarding.

---

## E. Gate Inventory

Live Production values for Sensitive env contents were **not** dumped. Classification uses: Vercel env *names* present on Production, live HTTP behavior of the current alias, and fail-closed parsers.

| Gate | Current Production | Desired LR-1 | Purpose | Production mutation required? |
| --- | --- | --- | --- | --- |
| `PUBLIC_REGISTRATION_ENABLED` | **Absent** from Production env list → parser OFF. Live `GET /register` → `307 /login?registration=disabled` | Remain OFF / unset | Owner self-signup + org create | **No** |
| `INVITATIONS_ENABLED` | Present (Sensitive). Live `/invite/accept` renders **Invitation unavailable**. Shape-valid exchange `303 /invite/accept` with **no Set-Cookie** (no seal) | exact `true` after tester mailbox is known + redeploy | Accept, invite-mode register, exchange seal | **Yes, later** — not in this commit |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | Present (Sensitive). Resting intended OFF (CB-E1-E / CB-G1 / LR-0). Delivery not exercised this phase | exact `true` only with a bound tester allowlist | Resend send | **Yes, later** — not until tester email exists |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | Present (Sensitive, created with historical CB-E1-E). Value not re-read | **Exactly the intended tester mailbox** (comma-separated normalized emails). Empty allowlist + delivery ON = `configuration_error` (no send) | Fail-closed recipients | **Yes, later** — owner must name the address first |
| `INVITATION_EMAIL_FROM` / `RESEND_API_KEY` | Present | Keep (required when delivery ON) | Sender + provider | No (already provisioned) |
| `INVITE_CONTINUATION_SECRET` | Present | Keep, ≥ 32 chars | Seal continuation cookie | No |
| `NEXT_PUBLIC_SITE_URL` | Present | Production origin (`https://www.zyntixai.com`) | Invite URL origin; never client-supplied | No |
| `SOCIAL_SCHEDULING_ENABLED` | OFF. Latest scheduler tick: `scheduling=false`, `mode=dry-run` | Stay OFF | Auto execute | **No** |
| `SOCIAL_PUBLISHING_ENABLED` | OFF. Same tick: `publishing=false`, `providerWriteAttempted=false` | Stay OFF | Provider write | **No** |
| `BILLING_ENABLED` | Present; unused for admission | Unchanged | Billing | No |

`INVITATIONS_ENABLED` does **not** open public owner registration. `registerAction` and `completeRegistrationAction` still require `PUBLIC_REGISTRATION_ENABLED` exact `true` for owner-mode signup / org provision. Invite-mode `/register` additionally requires a trusted continuation **and** invitations enabled.

Rollback for a later activation:

* `INVITATIONS_ENABLED` → not `true` (empty/`false`) + redeploy
* `INVITATION_EMAIL_DELIVERY_ENABLED` → not `true` + redeploy
* Leave `PUBLIC_REGISTRATION_ENABLED` unset/OFF
* Do not touch Social scheduling/publishing

---

## F. Public Registration Verification

Server enforcement (not UI-only):

* `src/features/auth/server/public-registration.ts` — only exact normalized `"true"` enables.
* `src/app/register/page.tsx` — without public ON **and** without trusted invite continuation → redirect `/login?registration=disabled`.
* `registerAction` — `registration_disabled` unless invite-mode or public-owner mode.
* `completeRegistrationAction` — refuses owner provision when public registration is OFF (`OWNER_ONBOARDING_UNAVAILABLE_MESSAGE`). Invite cookies, if present while invitations are ON, divert to `/invite/accept` instead of creating a workspace.

Live Production (`https://www.zyntixai.com`, deploy `dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa`):

| Request | Result |
| --- | --- |
| `GET /register` | `307 Location: /login?registration=disabled` |
| `GET /login` | `200` (normal sign-in remains available) |
| `GET /settings/members` (unauthenticated) | `307 Location: /login?next=%2Fsettings%2Fmembers` |

`PUBLIC_REGISTRATION_ENABLED` is not present in the Production env inventory. Missing → fail-closed OFF.

No secondary public admission route was found. Password recovery is explicitly **not** gated by public registration (correct — must not break login recovery).

---

## G. Invitation Creation Verification

`createInvitationAction`:

* Re-resolves org via `resolveOrganizationContext` — Org A cannot invite into Org B by posting another org id.
* Role matrix: Owner may invite admin/staff/viewer; Admin may invite staff/viewer; Staff/Viewer cannot create.
* Email validated; target role enum excludes `owner`.
* Duplicate pending for the same org+email reuses the pending row (RPC) rather than unbounded inserts.
* Already-member collision is handled in the create RPC (`resolve_organization_invitation_membership_collision`) — no silent extra membership.
* Rate limit: 10 creates / hour / actor (migration `20260814140000`).
* Raw token never appears on the public action result type.
* Delivery is orchestrated only after a successful mutation (denied creates → zero provider calls).

Production inventory at this checkpoint (no PII):

| Invitation status | Count |
| --- | --- |
| pending | **0** |
| accepted | 4 |
| revoked | 11 |

No leftover pending token can be accepted if acceptance is later enabled before a new invite is created.

---

## H. Delivery Verification

Mechanism: `orchestrateInvitationDelivery` → Resend adapter. Runtime `resolveInvitationEmailDeliveryRuntimeConfig`:

* delivery OFF → `{ kind: "disabled" }` (no send; secrets may be absent)
* delivery ON + missing API key / From / **empty allowlist** → `{ kind: "configuration_error" }` (fail closed)
* delivery ON + ready → send only if recipient is on the allowlist

Email contract (template):

* Subject: `You're invited to join {org} on ZyntixAI`
* Historical Production sender (CB-E1-E): `ZyntixAI <invites@invites.zyntixai.com>`
* CTA origin from `resolveSiteOrigin()` / `NEXT_PUBLIC_SITE_URL` only
* URL path: `/invite/accept/exchange?token=` + 64-hex; rejected unless `isTrustedInvitationAcceptanceUrl`
* No remote assets; token only in the CTA URL
* Delivery ledger: `private.organization_invitation_delivery_attempts` (generation + idempotency unique indexes)

Current ledger: **3** rows, all `submitted` (historical CB delivery; none sent in LR-1).

**No Production email was sent in this phase.** Delivery was not enabled. Allowlist value was not re-opened.

---

## I. Token / Link Security

* Entropy: `gen_random_bytes(32)` → 64 hex; unguessable.
* Storage: SHA-256 hash only; accept clears `token_hash`.
* Exchange GET does not accept; it only seals a shape-valid token (and only when invitations are ON).
* Client-controlled redirect parameters on exchange are ignored.
* Continuation cookie is AES-GCM; payload is token + timestamps + nonce — not org/role/email authority.
* Same-origin required on `acceptInvitationAction`.
* Expired invitation → `invite_not_found_or_unavailable` / expired branch in RPC (fail closed).
* Revoked / missing / invalid token → unavailable; no membership.
* Accepted replay: token hash cleared; subsequent accept cannot prove the token.
* Wrong logged-in email → `email_mismatch`; invitation remains pending (cookies retained per OD-APP-C1).
* Foreign org cannot be injected: accept has no org argument; RPC uses the invitation row.

Live Production (acceptance OFF):

| Request | Result |
| --- | --- |
| `GET /invite/accept` | `200` — **Invitation unavailable** / “Invitations are currently unavailable. Please try again later.” |
| `GET /invite/accept/exchange?token=<64-hex>` | `303` `https://www.zyntixai.com/invite/accept` — `Cache-Control: no-store, private`, `Referrer-Policy: no-referrer`, **no Set-Cookie** |

---

## J. Acceptance Verification

Code path covers:

| Case | Expected (current implementation) |
| --- | --- |
| Valid new user | invite-mode register (when invitations ON) → accept → membership → `/home?org=` |
| Existing user | login → accept → membership or `already_member` → `/home?org=` |
| Wrong logged-in user | `email_mismatch`; invite not consumed |
| Expired / revoked / invalid | safe denial; no membership |
| Already accepted | no duplicate membership; token unusable |
| Foreign org manipulation | fail closed (no client org field) |
| Feature OFF | `feature_disabled` / FeatureDisabledState; exchange does not seal |

Live acceptance of a real invite is **PENDING** owner mailbox + browser confirmation.

---

## K. Membership / Tenant Verification

On success, RPC inserts exactly one active `organization_members` row for `auth.uid()` + invitation org + invitation role, or fulfills `already_member` without changing an existing active role.

Post-accept redirect prefers a **verified** membership whose `organizationId` equals `rpcResult.organizationId`, then `buildProductDestination` → `/home?org=<id>`.

`acceptInvitationAction` does **not** use `resolve-task-organization-selection`. It does not trust a client `org` query as authority.

Residual (not a HIGH foreign-tenant leak): if accept RPC succeeds but the subsequent membership list does not include that org, and the user has exactly one *other* active membership, the action redirects to that other membership. That is the user’s own org, not a silent foreign-org fallback. Documented in §Q. Not treated as an LR-1 code blocker.

Course Sellers HIGH silent single-org fallback is not reintroduced on the invitation org-resolution path.

---

## L. Abuse / Idempotency Verification

Preserved in current migrations + tests (CB-R1 / CB-G1 / delivery idempotency):

* create 10/hour; resend 3/hour
* denied creates do not call the mail provider
* pending reuse / already-member
* accept does not update an existing active role
* suspended/removed/invited membership → `existing_membership_requires_admin_action` (fail closed)
* delivery generation + idempotency unique indexes
* exchange GET cannot accept
* accept action takes no client token

Production pending count 0 prevents replay of historical tokens if acceptance is later enabled before a new invite exists.

---

## M. Automated Regression Results

No implementation change. Focused suites rerun against current HEAD.

| Command | Result |
| --- | --- |
| Focused invite/auth (16 files listed in this phase) | **165 passed / 16 files** |
| Additional invitation unit files (13 files; excluded known-failing members-page spy) | **87 passed / 13 files** |
| Org context + members loaders (5 files) | **33 passed / 5 files** |
| Combined focused | **285 passed / 34 files** |
| `npx tsc --noEmit` | PASS |
| Targeted ESLint (`src/features/invitations`, `src/features/auth`, `src/app/register`, `src/app/invite`, `src/app/login`) | 0 errors |
| `npx next build` | PASS (pre-existing CSS warning in Social operator list; unrelated) |

The known pre-existing global failures were **not** re-labeled as new:

1. `tests/features/invitations/load-member-administration-page.test.ts` (foreign-org spy) — excluded from this focused run
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` (Progress copy string) — not in this focused run

Full `2647` suite was not required; no new failure was introduced by this phase (no code change).

---

## N. Production Configuration Changes

```text
None.
```

Invitation acceptance and delivery remain fail-closed. Public registration remains OFF. Social scheduling and publishing remain OFF.

Reason no invitation gate was flipped: the intended tester mailbox is not specified in this phase authorization. Enabling delivery against an unread/historical allowlist could send mail to a leftover CB-E1-E recipient. Enabling `INVITATIONS_ENABLED` alone does not complete PATH B (`receive invite`) and still requires a redeploy.

---

## O. Manual Owner Verification

Stop here. Do **not** invent a tester address. Do **not** edit the database for routine admission.

### O1. Name the tester mailbox (required before any Production mutation)

1. Why not automated: recipient binding + allowlist is an owner identity decision.
2. Reply in this conversation with the **exact** closed-beta tester email and the organization the Owner will invite into (the org visible on `/settings/members` while signed in as Owner/Admin).
3. Confirm that mailbox may receive a real Production invitation from ZyntixAI.
4. After that reply, the next controlled mutation is only:

   * keep `PUBLIC_REGISTRATION_ENABLED` unset/OFF
   * set `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` to that mailbox only
   * set `INVITATION_EMAIL_DELIVERY_ENABLED=true`
   * set `INVITATIONS_ENABLED=true`
   * redeploy the same reviewed app to Production
   * leave `SOCIAL_SCHEDULING_ENABLED` and `SOCIAL_PUBLISHING_ENABLED` OFF

### O2. After gates are ON — owner visual path (do not perform until O1 + deploy)

Use a private/incognito window for the **tester**. Keep the Owner session in a normal window.

1. Sign in to Production as Owner/Admin of the intended org: `https://www.zyntixai.com/login`
2. Open `https://www.zyntixai.com/settings/members`
3. Confirm the restricted-rollout warning is **gone** (acceptance + delivery both ON)
4. Invite the allowlisted tester as **Staff** or **Viewer** (do not invite as Owner; product cannot grant Owner)
5. Tester inbox should receive subject `You're invited to join {organization name} on ZyntixAI` from `ZyntixAI <invites@invites.zyntixai.com>` (historical From; confirm against the received mail)
6. In a clean private window, open the email CTA (must be `/invite/accept/exchange?token=…` on `https://www.zyntixai.com`)
7. Authenticate: existing user → Sign in; new user → invite-mode register / verify email if asked
8. On Invitation ready state, Accept once
9. Confirm the workspace name/org is the invited organization
10. Confirm the browser lands on `/home?org=<that organization id>` and Home loads

Do not enroll the tester in Social during this test. Do not publish or schedule.

### Required PASS wording

After O2 succeeds, reply exactly:

```text
BETA1-LR-1 INVITE DELIVERY + ACCEPTANCE VISUAL CONFIRMATION = PASS
BETA1-LR-1 TESTER REACHED /HOME IN CORRECT ORG = PASS
```

Until those two lines exist, LR-1 stays `PROVIDER/OWNER VERIFICATION REQUIRED`.

---

## P. Defects Found / Remediation

```text
None.
```

No implementation commit.

---

## Q. Residual Risks

Launch blockers for *this* phase (operational):

* Tester mailbox not named → delivery must stay OFF
* Owner visual PASS not yet recorded

Not launch blockers (leave for later):

* In-product feedback/support contact (LR-0 P1 → LR-2)
* Post-accept fallback to the user’s only other membership if the accepted org is missing from the just-loaded membership list (own-org only; see §K)
* Historical CB-Q1 “do not enable without QA” is superseded by this LR-1 authorization **once** the tester mailbox is bound
* R1-F multi-org Social cohort remains paused; not an admission blocker
* Known unrelated vitest failures (members-page spy; Progress copy)

---

## R. Final Gate Matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Invite-only strategy enforced | PASS | PATH B chosen; PATH A remains OFF; no other admission route found |
| Public registration remains OFF | PASS | Env absent; live `/register` → `307 /login?registration=disabled`; server actions fail-closed |
| Invitation creation | PASS | Tenant-scoped action + RPC + role matrix + rate limit; Members UI exists |
| Email delivery | PENDING | Adapter/allowlist/fail-closed proven in tests; no LR-1 Production send |
| Token security | PASS | 64-hex / SHA-256 / cookie seal / same-origin / no client accept args; live exchange does not seal while OFF |
| Acceptance | PENDING | Code + tests PASS; live accept still FeatureDisabledState until owner mailbox + gate ON |
| Correct org membership | PENDING | RPC + `/home?org=` contract verified in code; live membership not yet walked |
| Tenant isolation | PASS | Org re-resolved on create; accept has no org arg; no foreign silent fallback on this path |
| Abuse/idempotency | PASS | CB-R1/G1 tests + delivery unique indexes + pending=0 |
| Auth regression | PASS | 165 focused auth/invite tests + register/login live 200 / register disabled |
| Production config | PASS | No mutation this phase; Social gates unchanged dry-run |
| Owner manual verification | PENDING | §O — tester email + visual PASS wording required |

Do not close LR-1 while any required row is PENDING.

---

## Publication

| Item | Value |
| --- | --- |
| Evidence path | `docs/phases/BETA1-LR-1-closed-beta-admission-activation-evidence.md` |
| Implementation commit | none |
| Evidence commit | this commit |
| Branch | `core/platform-readiness-20260707` |
