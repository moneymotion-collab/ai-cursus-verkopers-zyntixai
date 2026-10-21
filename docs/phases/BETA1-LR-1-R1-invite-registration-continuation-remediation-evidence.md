# BETA1-LR-1-R1 — Invite Registration Continuation Remediation

## M. Final Remediation Verdict

```text
BETA1-LR-1-R1 CLOSED WITH EVIDENCE — INVITE REGISTRATION CONTINUATION PRODUCTION VERIFIED
```

This closes **only** the R1 remediation. The parent `/home` line was later supplied separately and is recorded in `docs/phases/BETA1-LR-1-closed-beta-admission-activation-evidence.md`.

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

## Owner Reverification

Recorded `2026-08-22` during this closure run (owner message timestamp `13:57` local / `11:57 UTC` class).

Exact owner confirmation:

```text
BETA1-LR-1-R1 INVITE REGISTRATION CONTINUATION VISUAL CONFIRMATION = PASS
```

This is visual confirmation that the repaired invitation flow no longer dead-ended on `Workspace creation unavailable` and that invitation registration continuation behaved correctly in Production.

The parent line `BETA1-LR-1 TESTER REACHED /HOME IN CORRECT ORG = PASS` was later supplied separately and is recorded on the parent evidence, not as an R1-only claim.

---

## Production Post-Reverification State

Read-only recheck after owner PASS. No Production mutation.

| Check | State |
| --- | --- |
| Deployment | `dpl_7EJKLuNFxcWTZXSqUWTpEwkbgpQd` Ready |
| Alias | `https://www.zyntixai.com` (also `zyntixai.com`, `zyntixai.vercel.app`) |
| Public registration | OFF — `GET /register` → `307 /login?registration=disabled` |
| Invitation delivery | ON (`INVITATION_EMAIL_DELIVERY_ENABLED=true`; unchanged) |
| Invitation acceptance | ON — unauthenticated `/invite/accept` still UnavailableState (gate ON, no token) |
| Allowlist | exactly `testtest34567810@gmail.com` (not rewritten in this closure) |
| Social scheduling | OFF — latest tick `2026-08-22 11:55:00+00` dry-run |
| Social publishing | OFF — `providerWriteAttempted=false` |

---

## K. Tester / Invitation State

Supporting DB state after the owner flow. No secrets. State was **not** altered to clean evidence.

| Check | After owner R1 verification |
| --- | --- |
| Auth user | exists; email confirmed |
| Membership count | **1** (no duplicate) |
| Target org | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (ZyntixAI Production QA) |
| Membership | **1 active** `staff` |
| Latest invite | **accepted**, role `staff` |
| Invite rows for tester | 1 |

This supports that the continuation path reached invitation acceptance and created exactly one intended membership. It is **not** treated as the parent `/home` visual PASS.

---

## Final Remediation Gate Matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Implementation deployed | PASS | `7bf4f13` on `dpl_7EJKLuNFxcWTZXSqUWTpEwkbgpQd` |
| Focused regression valid | PASS | 202 passed / 20 files at implement; no code change since |
| TypeScript | PASS | prior `npx tsc --noEmit` |
| Lint | PASS | prior targeted ESLint |
| Build | PASS | prior `npx next build` + Production Ready |
| Public registration OFF | PASS | live `307 /login?registration=disabled` |
| Invite-only gates controlled | PASS | delivery ON, acceptance ON, allowlist single tester |
| Social gates OFF | PASS | dry-run tick; no provider write |
| No new tenant/security defect | PASS | one staff membership on authorized org; no duplicate |
| Owner visual confirmation | PASS | exact R1 line recorded above |
| Remediation-specific blocker | PASS | none |

---

## K-pre-retry (historical)

Pre-retry snapshot (kept for audit; superseded by post-reverification §K):

| Check | State |
| --- | --- |
| Auth user | exists |
| Email confirmed | yes (`2026-08-22 11:30:23+00`) |
| Any membership | **no** |
| Target-org membership | **no** |
| Latest invite | **pending**, role `staff` |
| Invite rows | 1 |

---

## L. Owner Retry Procedure

Retry was executed by the owner. R1 visual continuation is PASS. The parent `/home` confirmation remains outstanding for BETA1-LR-1.

Historical retry steps (for audit): use `https://www.zyntixai.com` only; reopen the existing Staff invite; sign in as the existing tester; Accept once; do not enroll Social.

---

## Publication

| Item | Value |
| --- | --- |
| Evidence path | `docs/phases/BETA1-LR-1-R1-invite-registration-continuation-remediation-evidence.md` |
| Implementation commit | `7bf4f1363ebab2267f3083ff2291e169d261c5c3` |
| Prior evidence commit | `b2e0de2d4f80743e4fcb1b856fb82597b97191a5` |
| Closure evidence commit | this commit |
| Branch | `core/platform-readiness-20260707` |
