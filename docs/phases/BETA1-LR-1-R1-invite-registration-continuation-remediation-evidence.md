# BETA1-LR-1-R1 — Invite Registration Continuation Remediation

## M. Final Remediation Verdict

```text
BETA1-LR-1-R1 IMPLEMENTED AND DEPLOYED — OWNER REVERIFICATION REQUIRED
```

Parent phase `BETA1-LR-1` remains **not closed**. Do not treat owner invitation PASS as complete until the two R1 PASS lines exist.

---

## A. Defect

Observed during the real PATH B tester journey after invite-mode registration:

| Item | Value |
| --- | --- |
| Tester | `testtest34567810@gmail.com` |
| Authorized org | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (ZyntixAI Production QA) |
| Failing URL | `https://zyntixai.vercel.app/register/complete` |
| User-facing copy | `Workspace creation unavailable` |

Intended: invite → exchange → invite-bound register/auth → accept → existing org → `/home?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb`.

Observed: invite → registration → `/register/complete` on the Vercel alias → dead-end owner workspace UI.

---

## B. Severity

```text
HIGH — closed-beta admission blocker
```

The invite path created an auth user but lost invite context and attempted generic workspace creation, which is intentionally disabled.

---

## C. Root Cause

Two cooperating defects:

1. **Host hop drops host-only invite cookies.**  
   Auth callback `finalize()` redirected using `request.url` origin. Production aliases include `zyntixai.vercel.app`. Invite continuation cookies (`zyntix_invite_continuation`, registration-origin) are host-only (no `Domain`). Crossing `www.zyntixai.com` → `zyntixai.vercel.app` drops them.

2. **Zero-membership post-auth routing preferred owner completion.**  
   `resolvePostAuthDestination` / `resolvePostLoginDestination` / `resolveAuthenticatedLanding` sent a verified user with **no memberships** and **no remaining invite cookies** to `/register/complete`. With `PUBLIC_REGISTRATION_ENABLED` OFF, that page renders `Workspace creation unavailable` instead of resuming `/invite/accept`.

The callback already honors `next=/invite/accept` when present. The observed `/register/complete` URL means the session landed without that `next` **and** without cookies (login after verify, default callback next, or Vercel-host callback). `register/complete` then stayed on that dead end.

Root-cause numbers from the mission list: **2 + 3 + 4 + 5 + 6 + 8 + 10**.

Not causal: invitation RPC, recipient binding, or public registration accidentally turning ON.

---

## D. Reproduction

Pre-fix:

1. PATH B ON; public registration OFF.
2. Owner invites new email; tester opens exchange on `www.zyntixai.com` (cookie sealed).
3. Invite-mode register succeeds; verification email / later login is processed on `zyntixai.vercel.app` or without invite cookies.
4. Resolver chooses `/register/complete`.
5. Page shows Workspace creation unavailable. Invite remains pending. No membership.

---

## E. Fix

Smallest resume-invite fix. Public registration stays OFF. No auto-accept. No workspace auto-create. No Owner grant.

| File | Change |
| --- | --- |
| `src/features/invitations/server/invitations-feature.ts` | `shouldResumeInvitationAdmissionBeforeOwnerCompletion()` — invitations ON and public registration not exact `true` |
| `src/features/auth/server/resolve-registration-destination.ts` | Zero-membership PATH B → `{ kind: "invite_accept", path: "/invite/accept" }` |
| `src/features/auth/server/resolve-authenticated-landing.ts` | Same for login / default landing |
| `src/lib/env/site-origin.ts` | `resolveCanonicalRedirectOrigin()` prefers `NEXT_PUBLIC_SITE_URL` |
| `src/app/auth/callback/route.ts` | Redirects use canonical origin, not request host |

`/register/complete` already calls `resolvePostAuthDestination`, so a logged-in zero-membership tester hitting that URL now redirects to `/invite/accept`. Acceptance still requires a valid sealed token (reopen the email link). Org/role still come from the invitation RPC only.

Implementation commit: `7bf4f1363ebab2267f3083ff2291e169d261c5c3`

---

## F. Security Invariants

| Invariant | Result |
| --- | --- |
| Public registration remains OFF | PASS — env unchanged; live `/register` → `307 /login?registration=disabled` |
| Invitation validation remains server-side | PASS — accept still cookie + RPC; no client org/role |
| Tenant binding intact | PASS — membership org from invitation / verified membership list |
| No silent foreign-org fallback | PASS — zero-membership foreign `?org=` cannot select an org; landing uses verified membership |
| No workspace auto-creation | PASS — `tryProvisionAndLand` still flag-gated; this fix never provisions |
| No role escalation | PASS — accept still uses invitation role; already-member does not rewrite role |

---

## G. Regression Coverage

New: `tests/features/invitations/invite-registration-continuation-r1.test.ts`

| Test | Coverage |
| --- | --- |
| A | PATH B zero-membership without cookies → `/invite/accept`, not `/register/complete`; foreign `?org=` cannot hijack |
| B | Invitations OFF → `/register/complete` remains (no invite bypass) |
| C | Invalid continuation on PATH B → invite surface, not owner completion |
| D | `resolveCanonicalRedirectOrigin` + callback test: `zyntixai.vercel.app` → `https://www.zyntixai.com` |
| E | Already-member → `/home?org=<verified org>`, no new workspace |
| F | Default landing uses verified membership org, not a foreign id |

Also updated: `invite-auth-continuation-b.test.ts`, `site-origin.test.ts`, `auth-callback.test.ts`.

---

## H. Test Results

| Command | Result |
| --- | --- |
| Focused R1 + auth/invite/landing/callback (10 files) | **111 passed** |
| Additional invitation/security/org (10 files) | **91 passed** |
| Combined this remediation | **202 passed / 20 files** |
| `npx tsc --noEmit` | PASS |
| Targeted ESLint on changed files | PASS (0 errors) |
| `npx next build` | PASS (pre-existing Social CSS warning) |

No new failures. Known unrelated historical failures were not re-run as new.

---

## I. Deployment

| Item | Value |
| --- | --- |
| Implementation commit | `7bf4f1363ebab2267f3083ff2291e169d261c5c3` |
| Deployment ID | `dpl_7EJKLuNFxcWTZXSqUWTpEwkbgpQd` |
| Ready state | READY |
| Production alias | `https://www.zyntixai.com` (also `zyntixai.com`, `zyntixai.vercel.app`) |
| Deployment URL | `https://zyntixai-kafgk1q0l-guus-projects-ai.vercel.app` |
| Created | `2026-08-22 11:50:39 UTC` (`2026-08-22 13:50:39 GMT+0200`) |
| Prior deploy (rollback) | `dpl_2bdTfkX851mJiJZzJngtzqY3hdGH` |

---

## J. Production Gate State

No invitation/Social/registration env mutation in R1.

| Gate | Before R1 | After R1 |
| --- | --- | --- |
| `PUBLIC_REGISTRATION_ENABLED` | OFF / absent | OFF — live `/register` still disabled |
| `INVITATIONS_ENABLED` | `true` | `true` — `/invite/accept` still UnavailableState (gate ON, no token) |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | `true` | `true` (unchanged) |
| Allowlist | exactly `testtest34567810@gmail.com` | unchanged (not rewritten) |
| Social scheduling | OFF | OFF — tick `2026-08-22 11:50:00+00` dry-run |
| Social publishing | OFF | OFF — `providerWriteAttempted=false` |

---

## K. Tester / Invitation State

No secrets. No second invite created.

| Check | State |
| --- | --- |
| Auth user | exists |
| Email confirmed | yes (`2026-08-22 11:30:23+00`) |
| Any membership | **no** |
| Target-org membership | **no** |
| Latest invite | **pending**, role `staff`, org `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Invite rows for tester | 1 |

Safest retry: **reuse the existing pending invite**. Do not create another. Resend once only if the original email CTA is lost (resend rotates the token).

---

## L. Owner Retry Procedure

Use `https://www.zyntixai.com` only. Do **not** use `zyntixai.vercel.app`.

Tester window: **private/incognito**.

1. Do not create a new invitation.
2. Tester opens the **existing** Staff invite email CTA  
   (`https://www.zyntixai.com/invite/accept/exchange?token=…`).
3. If asked to sign in: use the **existing** `testtest34567810@gmail.com` account. Do not register again.
4. Confirm **Invitation ready** (not Workspace creation unavailable).
5. Accept once.
6. Confirm workspace **ZyntixAI Production QA** (`2fc07699-ece5-44b9-bbb3-abbc23e9fffb`).
7. Confirm `/home?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb`.
8. If the original CTA is missing: Owner resends **once** from  
   `https://www.zyntixai.com/settings/members?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb`, then repeat from step 2.
9. If the tester is already signed in and hits `/register/complete` on www, it should now redirect to `/invite/accept`; they still need the email CTA to accept.
10. Do not enroll Social. Do not publish.

### Required PASS wording

```text
BETA1-LR-1-R1 INVITE REGISTRATION CONTINUATION VISUAL CONFIRMATION = PASS
BETA1-LR-1 TESTER REACHED /HOME IN CORRECT ORG = PASS
```

---

## Publication

| Item | Value |
| --- | --- |
| Evidence path | `docs/phases/BETA1-LR-1-R1-invite-registration-continuation-remediation-evidence.md` |
| Implementation commit | `7bf4f1363ebab2267f3083ff2291e169d261c5c3` |
| Evidence commit | this commit |
| Branch | `core/platform-readiness-20260707` |
