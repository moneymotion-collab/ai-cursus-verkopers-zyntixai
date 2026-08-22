# BETA1-LR-1 — Closed-Beta Admission Activation Evidence

## A. Phase Verdict

```text
BETA1-LR-1 PROVIDER/OWNER VERIFICATION REQUIRED
```

PATH B (invite-only) is the chosen admission strategy. Repository architecture, server-side public-registration denial, invitation security, tenant binding, and abuse/idempotency remain verified. Production invitation **acceptance** and **email delivery** are now ON for exactly one allowlisted tester. Public owner registration remains OFF. Social scheduling/publishing remain OFF.

No implementation defect required a code change.

Remediation `BETA1-LR-1-R1` is **closed** (`docs/phases/BETA1-LR-1-R1-invite-registration-continuation-remediation-evidence.md`). Owner confirmed:

```text
BETA1-LR-1-R1 INVITE REGISTRATION CONTINUATION VISUAL CONFIRMATION = PASS
```

Parent LR-1 stays open. The remaining owner confirmation is still:

```text
BETA1-LR-1 TESTER REACHED /HOME IN CORRECT ORG = PASS
```

That parent line has **not** been supplied and is not inferred from the R1 close.

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
| Activation baseline HEAD | `15a6331419021c5965a72e3bcef7ce984b3d575b` |
| Current Production deploy | `dpl_2bdTfkX851mJiJZzJngtzqY3hdGH` Ready (aliases `www.zyntixai.com`, `zyntixai.com`, `zyntixai.vercel.app`) |
| Prior Production deploy (rollback candidate) | `dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa` |

HEAD matched `15a6331` (clean, `0 0`) before this activation. No reset or discard. No implementation commit.

---

## C. Admission Strategy

```text
PATH B — INVITE-ONLY
```

Public owner registration remains OFF so a non-invited visitor cannot provision a new closed-beta workspace from `/register`. Existing authenticated users can still sign in. Invitation acceptance is the only intended admission path and is now Production-enabled for the single allowlisted tester.

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
| `PUBLIC_REGISTRATION_ENABLED` | **Absent** before and after. Live `GET /register` still `307 /login?registration=disabled` | Remain OFF / unset | Owner self-signup + org create | **No** — not added |
| `INVITATIONS_ENABLED` | Before: not exact `true` (FeatureDisabledState). After: exact `true` + deploy `dpl_2bdTfkX851mJiJZzJngtzqY3hdGH` | exact `true` | Accept, invite-mode register, exchange seal | **Done** |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | Before: not exact `true`. After: exact `true` | exact `true` with bound tester allowlist | Resend send | **Done** |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | Before: Present Encrypted (CB-E1-E era). Value not dumped. After: overwritten to exactly `testtest34567810@gmail.com` | **Exactly that mailbox** | Fail-closed recipients | **Done** — historical recipients not preserved |
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

Live Production before and after activation (`https://www.zyntixai.com`):

| Request | Before (`dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa`) | After (`dpl_2bdTfkX851mJiJZzJngtzqY3hdGH`) |
| --- | --- | --- |
| `GET /register` | `307 Location: /login?registration=disabled` | **same** `307 /login?registration=disabled` |
| `GET /login` | `200` | `200` |
| `GET /settings/members` (unauthenticated) | `307 /login?next=%2Fsettings%2Fmembers` | unchanged contract (auth required) |

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

Authorized organization (verified before send):

| Check | Result |
| --- | --- |
| ID | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Name | ZyntixAI Production QA |
| Status | `active` |
| Active Owner/Admin memberships | 2 |
| Active members | 7 |
| Pending invites on this org | 0 |
| Tester already a member | no |
| Tester existing auth user | no |
| Members URL | `https://www.zyntixai.com/settings/members?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Org selection | `resolveSelectedOrganization` — foreign/`org` mismatch → `organization_required`, no silent fallback |
| Create bind | `createInvitationAction` re-resolves via `resolveOrganizationContext`; RPC uses that org only |

Production invitation inventory after activation (still no Cursor-created invite):

| Invitation status | Count |
| --- | --- |
| pending | **0** |
| accepted | 4 |
| revoked | 11 |

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

Ledger before activation: **3** rows, all `submitted` (historical CB delivery). Cursor did **not** create an invitation or send mail in this activation. The first LR-1 Production email is the owner-created Staff invite in §O.

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

Live Production after activation (acceptance ON):

| Request | Result |
| --- | --- |
| `GET /invite/accept` (no cookie) | `200` — UnavailableState: “This invitation link is unavailable. Request a new invitation from your organization administrator if you still need access.” (not FeatureDisabledState) |
| `GET /invite/accept/exchange?token=not-a-token` | `303` `/invite/accept?cleared=1`; `Set-Cookie` **clears** `zyntix_invite_continuation` (empty, Max-Age=0) |
| `GET /invite/accept/exchange?token=<64-hex unknown>` | `303` `/invite/accept`; HttpOnly continuation cookie **sealed** (Max-Age=1800). This is shape-only seal, **not** a valid invitation. Accept RPC fail-closes unknown tokens. Cookie value is not recorded here. |

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

Live gate is ON (UnavailableState vs FeatureDisabledState). Live acceptance of the authorized tester invite is **PENDING** owner email + browser confirmation. Cursor did not create or accept the invitation.

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

Post-activation focused rerun (code unchanged; 18 files: prior 16 auth/invite + org context + task org selection):

**181 passed / 18 files.** No new failures.

Full `2647` suite was not required; no new failure was introduced by this phase (no code change).

---

## N. Production Configuration Changes

| Gate | Before | After | Rollback |
| --- | --- | --- | --- |
| `PUBLIC_REGISTRATION_ENABLED` | Absent / OFF | Absent / OFF (not added) | Leave absent |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | Present Encrypted; historical CB-E1-E value **not dumped** | exact `testtest34567810@gmail.com` (overwrite; no other recipients) | empty (fail-closed) or owner-specified; then redeploy |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | not exact `true` | exact `true` | empty / not `true` + redeploy |
| `INVITATIONS_ENABLED` | not exact `true` | exact `true` | empty / not `true` + redeploy |
| `SOCIAL_SCHEDULING_ENABLED` | OFF | OFF (untouched; env created 15h ago unchanged) | n/a |
| `SOCIAL_PUBLISHING_ENABLED` | OFF | OFF (untouched) | n/a |

Deploy: `npx vercel deploy --prod --yes --project zyntixai --scope guus-projects-ai`

Application rollback candidate: promote `dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa` **and** restore invitation gates to not-`true` (env is deployment-tied).

---

## O. Manual Owner Verification

```text
PENDING
```

O1 (tester identity) is complete. Gates are ON. Cursor did **not** send the invitation. Stop for the owner/tester browser path.

Use a private/incognito window for the **tester**. Keep the Owner session in a normal window.

1. Log in as Owner/Admin: `https://www.zyntixai.com/login`
2. Open `https://www.zyntixai.com/settings/members?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb`
3. Confirm org **ZyntixAI Production QA** and that the restricted-rollout warning is **gone**
4. Invite exactly `testtest34567810@gmail.com`
5. Role: **Staff** (`staff` — product cannot grant Owner)
6. Do not resend repeatedly
7. Open `testtest34567810@gmail.com`
8. Confirm receipt. Expected subject: `You're invited to join ZyntixAI Production QA on ZyntixAI`. Expected historical sender: `ZyntixAI <invites@invites.zyntixai.com>` (confirm against the received mail)
9. Open the invite CTA in a clean incognito/private session (`https://www.zyntixai.com/invite/accept/exchange?token=…`)
10. Authenticate through invite-mode register if required (this mailbox is not an existing auth user)
11. Accept exactly once
12. Confirm organization `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (ZyntixAI Production QA)
13. Confirm route `/home?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb`
14. Do not enroll Social
15. Do not publish anything

### Required PASS wording

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

* Parent owner line still outstanding: `BETA1-LR-1 TESTER REACHED /HOME IN CORRECT ORG = PASS`
* R1 continuation defect is closed and is no longer an LR-1 remediation blocker

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
| Email delivery | PENDING | Gate ON + allowlist bound; no LR-1 send until owner creates the invite |
| Token security | PASS | Live malformed token clears cookie; unknown 64-hex seals shape-only; accept RPC still fail-closed |
| Acceptance | PENDING | Live FeatureDisabledState gone; real tester accept not yet walked |
| Correct org membership | PENDING | Org `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` verified; live membership not yet created |
| Tenant isolation | PASS | Org re-resolved on create; accept has no org arg; members `?org=` uses `resolveSelectedOrganization` (no silent fallback) |
| Abuse/idempotency | PASS | CB-R1/G1 tests + pending still 0 |
| Auth regression | PASS | 181 focused tests after deploy; `/register` still disabled; `/login` 200 |
| Production config | PASS | Only PATH B invitation gates + allowlist; Social untouched dry-run |
| Owner manual verification | PENDING | R1 visual continuation PASS recorded; parent `/home` line still required |

Do not close LR-1 while any required row is PENDING.

---

## S. Authorized Production activation continuation

Owner named tester + org. This subsection is the activation record requested for the live PATH B flip. Historical §A–§R above remain; values here supersede resting-OFF statements where they conflict.

### A. Production Configuration Before

| Gate | Before (classified; secrets not dumped) |
| --- | --- |
| `PUBLIC_REGISTRATION_ENABLED` | UNSET / absent. Live `/register` → `307 /login?registration=disabled` |
| `INVITATIONS_ENABLED` | Present Encrypted; not exact `true`. Live FeatureDisabledState + exchange no Set-Cookie |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | Present Encrypted; not exact `true` |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | Present Encrypted (CB-E1-E era). Contents not dumped; not preserved |
| `SOCIAL_SCHEDULING_ENABLED` | OFF. Scheduler `2026-08-22 11:00:00+00` dry-run |
| `SOCIAL_PUBLISHING_ENABLED` | OFF. Same tick `providerWriteAttempted=false` |

### B. Authorized Recipient

`testtest34567810@gmail.com`

### C. Authorized Organization

`2fc07699-ece5-44b9-bbb3-abbc23e9fffb` — ZyntixAI Production QA (`active`; 2 Owner/Admin; tester not a member)

### D. Production Configuration After

| Gate | After |
| --- | --- |
| Public registration | OFF / absent. Live `/register` still `307 /login?registration=disabled` |
| Invitation delivery | `INVITATION_EMAIL_DELIVERY_ENABLED=true` |
| Invitation acceptance | `INVITATIONS_ENABLED=true`. Live `/invite/accept` = UnavailableState (gate ON, no token) |
| Allowlist | exactly `testtest34567810@gmail.com` |
| Social scheduling | OFF. Latest tick `2026-08-22 11:20:00+00` dry-run |
| Social publishing | OFF. `providerWriteAttempted=false` |

### E. Deployment

| Item | Value |
| --- | --- |
| Deployment ID | `dpl_2bdTfkX851mJiJZzJngtzqY3hdGH` |
| Ready state | READY |
| Production alias | `https://www.zyntixai.com` (also `zyntixai.com`, `zyntixai.vercel.app`) |
| Deployment URL | `https://zyntixai-obbrjwddp-guus-projects-ai.vercel.app` |
| Deployed commit | `15a6331419021c5965a72e3bcef7ce984b3d575b` (docs-only vs last app SHA; env change is the material delta) |
| Created | `2026-08-22 11:22:54 UTC` (`2026-08-22 13:22:54 GMT+0200`) |
| Rollback deploy | `dpl_Ad6mqFNp3YRhs6XrPQbr3RPhuyCa` plus invitation gates not-`true` |

### F. Automated Verification

| Check | Result |
| --- | --- |
| Focused vitest after deploy | **181 passed / 18 files** |
| `/register` | still disabled |
| `/login` | 200 |
| `/invite/accept` | gate ON (UnavailableState copy) |
| Exchange malformed | cookie cleared |
| Exchange unknown 64-hex | shape-only seal; not a valid invitation |
| Pending invites | still 0 |
| Social last tick | dry-run, no provider write |

### G. Owner Verification

R1 continuation:

```text
BETA1-LR-1-R1 INVITE REGISTRATION CONTINUATION VISUAL CONFIRMATION = PASS
```

Parent `/home` confirmation:

```text
PENDING
```

### H. Final Gate Matrix

R1 is closed. Parent manual `/home` row remains PENDING. See §R.

---

## Publication

| Item | Value |
| --- | --- |
| Evidence path | `docs/phases/BETA1-LR-1-closed-beta-admission-activation-evidence.md` |
| Implementation commit | none |
| Prior evidence commit | `15a6331419021c5965a72e3bcef7ce984b3d575b` |
| This evidence commit | this commit |
| Branch | `core/platform-readiness-20260707` |
