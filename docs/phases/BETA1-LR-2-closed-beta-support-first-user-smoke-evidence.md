# BETA1-LR-2 — Closed-Beta Support + First-User Smoke Evidence

## A. Phase Verdict

```text
BETA1-LR-2 IMPLEMENTED AND DEPLOYED — OWNER VISUAL VERIFICATION REQUIRED
```

This is **not** a close. Support/feedback is implemented and deployed. Public registration remains OFF. Invite-only admission remains ON. Social scheduling/publishing remain OFF.

Owner support-contact visual confirmation is now recorded. Authenticated first-user desktop smoke and ~390px mobile smoke remain outstanding and are **not** inferred from the support PASS.

Do not treat the following as true until the owner checkpoint in §P is PASSed:

```text
BETA1-LR-2 CLOSED WITH EVIDENCE — CLOSED-BETA SUPPORT + FIRST-USER EXPERIENCE PRODUCTION VERIFIED
```

This phase does **not** prove Beta 1 final launch readiness, Social enrollment, Social publishing, or a full Course Sellers re-FV.

---

## B. Repository State

| Check | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start HEAD | `e95bd7bab75f7a2b68acda2f0ce074e19c83c3e6` |
| Start message | `docs(beta): close invite-only admission` |
| Implementation commit | `0c38e608c98843c0199d29989455a4baa0b03458` |
| Implementation message | `feat(beta): add closed beta support contact` |
| Evidence commit | this commit |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Final HEAD | this evidence commit |

No reset or discard. LR-1 and R1 were not reopened.

---

## C. Starting Production State

| Check | At LR-2 start |
| --- | --- |
| Deployment | `dpl_7EJKLuNFxcWTZXSqUWTpEwkbgpQd` Ready |
| Alias | `https://www.zyntixai.com` |
| Public registration | OFF |
| Invitation delivery | ON |
| Invitation acceptance | ON |
| Social scheduling | OFF |
| Social publishing | OFF |
| Admission | `BETA1-LR-1 CLOSED WITH EVIDENCE — INVITE-ONLY CLOSED-BETA ADMISSION PRODUCTION VERIFIED` |
| R1 | `BETA1-LR-1-R1 CLOSED WITH EVIDENCE — INVITE REGISTRATION CONTINUATION PRODUCTION VERIFIED` |

---

## D. Support / Feedback Gap

LR-0 classified in-product feedback and support contact as one P1 gap:

* no in-product feedback form
* no support page
* no terms/privacy route
* no authenticated-shell contact line

Repository search before implementation found **no** canonical `mailto:`, `support@`, Help route, or legal contact page. Invitation mail uses transactional sender `invites@invites.zyntixai.com` (send-only). That address was **not** reused as a support inbox.

Canonical destination established from repository authorship (owner commit email), configured as Production env `CLOSED_BETA_SUPPORT_EMAIL`. The mailbox value is **not** published in this evidence.

---

## E. Support / Feedback Implementation

| Item | Value |
| --- | --- |
| Location | Authenticated `AppShell` footer (all product routes that use the shell) |
| User-facing label | `Support & feedback` |
| Destination | `mailto:` from `CLOSED_BETA_SUPPORT_EMAIL` |
| Subject | `ZyntixAI Closed Beta feedback` |
| Body prompt | What happened / what they expected / page or feature / steps to reproduce |
| Fail-closed | Link hidden when env is unset or not a valid mailbox |
| Mobile | Footer wraps; link min-height `2.75rem`; visible text label; focus-visible outline |
| Privacy | No tokens, cookies, org IDs, or provider data are appended |

Staff testers do not see Members (Owner/Admin). The footer is the single contact surface for every authenticated role.

Not built: ticketing, chatbot, feedback schema, legal pages.

---

## F. First-User Journey

Intended closed-beta path after LR-1 admission:

```text
https://www.zyntixai.com/login
  → authenticated landing /home?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb
  → Home (Today)
  → primary nav (Home, Leads, Customers, Programs, Enrollments, Progress, Attention, Tasks)
  → one core action (CRM or Programs)
  → footer Support & feedback → mail composer
```

Members (`/settings/members`) is Owner/Admin only. Staff should not expect that nav item.

Social nav may appear for this org because Production QA already has a prior Social enrollment. LR-2 does not enroll Social and does not require the tester to open it.

Unauthenticated Production smoke of login is complete. Authenticated walk remains owner visual (§P).

---

## G. Desktop Smoke

| Surface | Automated / code | Owner visual |
| --- | --- | --- |
| Login | PASS — live `200`; copy “Sign in”; no Create-account / Sign-up CTA | PENDING |
| Public register CTA | PASS — live `GET /register` → `307 /login?registration=disabled` | n/a |
| Authenticated landing / correct org | Prior LR-1 owner PASS; not re-walked here | PENDING |
| Home / primary nav | Existing AppShell + Home loader; no new runtime error introduced | PENDING |
| CRM / Programs / Tasks / Attention | Existing empty/error panels; no deep re-FV | PENDING spot-check |
| Members | Hidden for Staff; route still authorized separately | Owner/Admin only |
| Support & feedback | Unit: footer + mailto when env set | PASS — exact owner line in §P |

---

## H. Mobile ~390px Smoke

| Check | Result |
| --- | --- |
| Shell CSS | Wrap header/nav/footer; no `position: fixed`; no 900px min-width (existing responsive contract still PASS) |
| Support link | Text label, `2.75rem` min-height, wraps in footer |
| Login | Live page is a simple stacked form (no signup CTA) |
| Authenticated 390px walk | **PENDING** owner |

No hamburger was added. B1-C5 wrap navigation remains the mobile pattern. Cosmetic wrap density is residual polish, not a blocker, unless the owner finds a primary action unreachable.

---

## I. Empty-State Review

Reviewed in code. No rewrite. None looked broken or leaked implementation details.

| Surface | Empty copy | Next action |
| --- | --- | --- |
| Leads | “No leads are available.” | “Add your first lead” only if create permitted |
| Tasks | “No open tasks are available.” | None required |
| Programs | “No programs yet” | Create when permitted |
| Enrollments / Progress | Existing filtered/empty resolvers | Existing |
| Attention | “No attention items yet” | Honest wait copy |
| Social | Not-enrolled / disabled / org-required panels already honest | No publish implication |
| Members | Owner/Admin; Staff denied by nav + route | n/a |

Residual (non-blocking): Home `no_organizations` still says “Join or create an organization…”. PATH B testers with membership do not see it. Not fixed in this phase.

---

## J. Error / Denied-State Review

| State | Handling | Verdict |
| --- | --- | --- |
| Unauthorized / unauthenticated | Product routes → login with safe `next` | PASS |
| Disabled public registration | `307 /login?registration=disabled` + “Public registration is currently unavailable.” | PASS |
| Invalid invite | UnavailableState, no FeatureDisabledState | PASS (live) |
| Missing / foreign org | Organization selection required; no silent fallback | PASS (prior LR-1/B1-FV) |
| Route error boundaries | “Something went wrong” + retry; no `error.message` / stack in tasks error | PASS |
| Generic not-found | Next default `/_not-found` | Acceptable |
| Social disabled / not entitled | Honest disabled / not-enrolled copy; publishing remains off | PASS |

No raw secrets or stack traces in the reviewed launch-critical panels.

---

## K. Role / Tenant Honesty

Tester role remains **Staff** on `2fc07699-ece5-44b9-bbb3-abbc23e9fffb`.

* Members nav fail-closed for Staff.
* Support footer is role-neutral.
* Invite continuation / canonical-host fix from R1 was not touched.
* No new tenant selector or org-trust change.

---

## L. Social Boundary

| Check | State |
| --- | --- |
| Scheduling | OFF — latest tick `2026-08-22 12:10:00+00` `scheduling=false` `mode=dry-run` |
| Publishing | OFF — `publishing=false` `providerWriteAttempted=false` |
| Enrollment | Not performed in LR-2 |
| Instagram write | None |

Visible Social label remains `Social — Closed Beta`. No “publish automatically” copy was added.

---

## M. Public Registration Boundary

| Check | After LR-2 deploy |
| --- | --- |
| `PUBLIC_REGISTRATION_ENABLED` | Still absent from Production env inventory |
| Live `/register` | `307 /login?registration=disabled` |
| Live `/login` | No Create-account / Sign-up CTA |

---

## N. Automated Verification

| Command | Result |
| --- | --- |
| Focused vitest (support + AppShell-adjacent, 10 files) | **49 passed / 10 files** |
| `npx tsc --noEmit` | PASS |
| Targeted ESLint (`src/features/support`, `src/components/app-shell.tsx`) | 0 errors |
| `npx next build` | PASS (pre-existing Social operator CSS warning; unrelated) |

Known historical global failures were not re-run and are not reclassified:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

---

## O. Production Deployment

| Item | Value |
| --- | --- |
| Deployment ID | `dpl_6mJFRdGUDFfmMyutk9EwQaM47BDX` |
| Ready state | READY |
| Alias | `https://www.zyntixai.com` (also `zyntixai.com`, `zyntixai.vercel.app`) |
| Created | `2026-08-22 12:10:16 UTC` (`14:10:16` local GMT+0200) |
| Deployed commit | `0c38e608c98843c0199d29989455a4baa0b03458` |
| New env | `CLOSED_BETA_SUPPORT_EMAIL` Present Encrypted (Production). Value not dumped. |
| Rollback | Promote `dpl_7EJKLuNFxcWTZXSqUWTpEwkbgpQd`; optional unset of `CLOSED_BETA_SUPPORT_EMAIL` |

Post-deploy live checks:

* `/register` still disabled
* `/login` 200, no public signup CTA
* `/invite/accept` UnavailableState (gate ON)
* Social last tick dry-run, no provider write

---

## P. Owner Visual Verification

Recorded `2026-08-22` (owner message timestamp `14:30` local / `12:30 UTC` class).

Received:

```text
BETA1-LR-2 SUPPORT + FEEDBACK CONTACT VISUAL CONFIRMATION = PASS
```

Still outstanding (not inferred):

```text
BETA1-LR-2 FIRST-USER DESKTOP VISUAL SMOKE = PASS
BETA1-LR-2 ~390PX MOBILE VISUAL SMOKE = PASS
```

Minimum remaining owner checkpoint. Use `https://www.zyntixai.com` only. Tester: `testtest34567810@gmail.com`. Do not enroll Social. Do not publish.

### Desktop

1. Log in as the closed-beta tester.
2. Confirm landing in org **ZyntixAI Production QA** (`/home?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb`).
3. Open Home → Programs or Leads → confirm the page renders.
4. Find footer **Support & feedback**.
5. Open it and confirm the mail composer/link uses subject `ZyntixAI Closed Beta feedback`.

### Mobile (~390px)

1. Open Home.
2. Confirm primary nav can be used (wrap is expected).
3. Open one core route.
4. Open Support & feedback.
5. Confirm no blocking overflow or inaccessible primary action.

### Required PASS wording

```text
BETA1-LR-2 FIRST-USER DESKTOP VISUAL SMOKE = PASS
BETA1-LR-2 ~390PX MOBILE VISUAL SMOKE = PASS
BETA1-LR-2 SUPPORT + FEEDBACK CONTACT VISUAL CONFIRMATION = PASS
```

---

## Q. Defects Found / Remediation

```text
None.
```

Planned support gap only. R1 invite-continuation code was not modified.

---

## R. Residual Non-Blocking Polish

* Home `no_organizations` still mentions “create an organization” while PATH B public registration is OFF.
* Wrapped mobile nav can look dense; not a blocker unless a control is unreachable.
* No dedicated Settings home for Staff (Members is Owner/Admin).
* Default Next not-found page (no branded 404).
* In-product ticketing / legal pages remain out of scope.

---

## S. Final LR-2 Gate Matrix

| Gate | Result | Evidence |
| --- | --- | --- |
| Support contact exists | PASS | AppShell footer mailto when env set; Production env present |
| Feedback path exists | PASS | Same control; owner visual confirmation recorded in §P |
| Desktop first-user journey | PENDING | Login smoke PASS; authenticated walk still needs owner |
| ~390px mobile smoke | PENDING | CSS contract PASS; authenticated 390px still needs owner |
| Critical empty states | PASS | Reviewed; truthful; no rewrite required |
| Critical error/denied states | PASS | Register/invite/org/error panels fail closed and honest |
| Tenant honesty | PASS | No new org trust; R1 continuation untouched |
| Public registration remains OFF | PASS | Env absent; live `307 /login?registration=disabled` |
| Invite-only path preserved | PASS | Delivery/acceptance unchanged; invite UnavailableState |
| Social scheduling remains OFF | PASS | Tick `2026-08-22 12:10:00+00` dry-run |
| Social publishing remains OFF | PASS | `providerWriteAttempted=false` |
| Typecheck | PASS | `npx tsc --noEmit` |
| Lint | PASS | Targeted ESLint |
| Build | PASS | Local + Production Ready |
| Owner visual checkpoint | PENDING | Support contact PASS; desktop + ~390px lines still required |

Do not close LR-2 while any required row is PENDING or FAIL.

---

## Publication

| Item | Value |
| --- | --- |
| Evidence path | `docs/phases/BETA1-LR-2-closed-beta-support-first-user-smoke-evidence.md` |
| Implementation commit | `0c38e608c98843c0199d29989455a4baa0b03458` |
| Prior evidence commit | `e739f2ddca53e38d9f3c0ede2155f4581d40b707` |
| This evidence commit | this commit |
| Branch | `core/platform-readiness-20260707` |
