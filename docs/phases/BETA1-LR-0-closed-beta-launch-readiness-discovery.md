# BETA1-LR-0 — Closed Beta Launch Readiness Discovery & Master Plan

## A. Executive Verdict

```text
BETA1-LR-0 DISCOVERY COMPLETE — READY FOR CONTROLLED LAUNCH READINESS EXECUTION
```

This is **not** a launch verdict. Course Sellers Beta 1 and Social Media Management Beta 1 remain closed and Production-verified. ZyntixAI **cannot yet admit arbitrary closed-beta testers** because both admission paths are fail-closed OFF by design.

The shortest safe path is: choose one admission path → activate it with the existing invitation/registration runbooks → walk one tester to `/home` → optionally enroll that org for Social (publishing stays OFF) → then final launch verification.

No Course Sellers or Social product track was reopened. No implementation was changed. No Production gate was mutated. No Instagram write.

---

## B. Repository State

| Check | Value |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `cd125f81e02fb7b829f69de35277b95e6616c4d0` |
| Start message | `docs(smm): close beta 1 final verification` |
| Final HEAD | this planning commit |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Implementation commit | none |

HEAD matched the authoritative Social B1-FV close SHA. No reset or discard.

---

## C. Authoritative Closed Beta 1 Baseline

### Course Sellers

Evidence: `docs/phases/B1-FV-course-sellers-beta-1-final-release-verification-evidence.md`

Verdict: `COURSE SELLERS BETA 1 RELEASE READY WITH EVIDENCE`

Proven: auth, org/tenant (including the HIGH foreign-`org` silent-fallback fix), onboarding, Home, Leads, Customers, Tasks, Programs, Enrollments, Progress, Attention/NBA, Members/Invitations, Settings, navigation/mobile. Social was **horizontal / non-blocking** at CS close.

Resting invitation gates at CS close: acceptance OFF, delivery OFF. Social publishing OFF.

### Social Media Management

Evidence: `docs/phases/SMM-B1-FV-social-media-management-beta-1-final-verification-evidence.md`

Verdict: `SMM-B1-FV CLOSED WITH EVIDENCE — SOCIAL MEDIA MANAGEMENT BETA 1 PRODUCTION VERIFIED`

Proven: Instagram connection, tenant/security, Stories IMAGE, scheduling, fail-closed gates, idempotency, Owner/Admin journey. Timer: `Supabase Cron */5` → Vercel worker; 1 active Social Cron; 0 Vercel-native Social Cron. Scheduling and publishing execution **OFF**.

Social customer access is a **separate entitlement** (`social_closed_beta_enrollments`) from Course Sellers membership. Not-enrolled orgs do not discover Social in primary nav (SMM-R1-C).

R1-F (3–5 real customer orgs) remains **paused** — not a CS launch blocker; it only limits a multi-org Social cohort.

---

## D. End-to-End User Lifecycle

Reconstructed from current routes and server gates (not assumed from module existence).

```text
Public visitor
  → https://www.zyntixai.com  →  /login  (no marketing homepage)
  → unauthorized deep link → /login?next=<safe path>
  → foreign ?org= → Organization selection required (no silent fallback)

PATH A — Owner self-registration (PUBLIC_REGISTRATION_ENABLED exact "true")
  /register → email verify → /register/complete → org create
  → /onboarding?org= → /home?org=

PATH B — Invite-only (INVITATIONS_ENABLED + delivery + allowlist)
  Owner /settings/members → create invitation
  → email (if INVITATION_EMAIL_DELIVERY_ENABLED)
  → /invite/accept/exchange?token= → /invite/accept
  → /login or /register (invite mode) → acceptInvitationAction
  → correct org membership + role → product

PATH C — Social (parallel; not Course Sellers admission)
  Platform operator /operator/social-beta → enroll_approved
  → enrolled Owner/Admin sees “Social — Closed Beta”
  → /social → Accounts / Publish / Calendar / Activity
  → publishing/scheduling remain OFF unless separately authorized

Unauthorized / gate OFF
  → honest unavailable / closed-beta / forbidden panels
  → not a fully entitled user
```

**Resting Production today:** PATH A OFF, PATH B OFF. Existing Owner sessions can still use Course Sellers. New external testers cannot complete admission without a gate change + deploy. Social testers additionally need operator enrollment.

Arbitrary public visitors **cannot** become fully entitled users while registration and invitations remain fail-closed. Enforcement is server-side, not UI-only.

---

## E. Launch Readiness Matrix

| Area | Existing implementation | Automated evidence | Production evidence | Manual verification needed | Blocker? | Next action | Class |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public/entry surface | `/` → login or authenticated landing | auth/middleware tests | unauth → Sign in | None beyond first-run if admission opens | No | Keep | PROVEN |
| Closed-beta access restriction | Fail-closed `PUBLIC_REGISTRATION_ENABLED` + `INVITATIONS_ENABLED` + Social enrollment | parsers + register/invite tests | gates OFF at last FV | Owner must choose and activate one path | **Operational yes** | LR-1 | PROVEN + MANUAL |
| Registration | Invite-gated or public-owner; server reject when OFF | `public-registration.ts` + auth tests | register hidden/disabled | Only if PATH A chosen | No (code) | LR-1 if PATH A | PROVEN |
| Login/logout | `/login`, session, post-login resolver | B1-FV + auth tests | Sign in works | First-run visual after admission | No | Keep | PROVEN |
| Password/session | `/forgot-password`, `/reset-password`, session_expired | auth tests | prior CS FV | None | No | Keep | PROVEN |
| Organization create/select | Explicit create on public-reg; selection required; no silent fallback | B1-FV foreign-org fix + tests | deployed | None | No | Do not regress | PROVEN |
| Onboarding | Owner wizard; product routes redirect incomplete Owners | onboarding tests + CS FV | prior | Visual first-run after admission | No | LR-2 visual | PROVEN |
| First-run experience | Overview next-steps; Social not-enrolled panel | SMM-R1-C tests | enrollment UX | **Yes** — human clarity | No | LR-2 | MANUAL |
| Course Sellers master journey | Home→CRM→Tasks→Programs→Enrollments→Progress→Attention→Members | B1-FV Playwright + 2645 suite | CS FV Production | None (already proven) | No | Do not rerun CS FV | PROVEN |
| Social entry | Enrollment-gated nav + `/social` | SMM-R1-C + B1-FV | SMM-B1-FV | Discoverability after enroll | No | LR-2 if Social testers | PROVEN |
| Instagram account management | Connect/reauth/disconnect | OAuth tests + SMM-B1-FV | healthy connection | None; no new live write | No | Keep publishing OFF | PROVEN |
| Social calendar/activity | `/social?section=calendar\|activity` | B1.11-B/FV tests | SMM-B1-FV | None | No | Keep | PROVEN |
| Members | `/settings/members` Owner/Admin | B1-C2 + invitation tests | CS FV | None | No | Keep | PROVEN |
| Invitations | Create/resend/revoke; rate limits | CB-* + B1-C2 | delivery+accept proven then OFF | **Yes** if PATH B | Operational if PATH B | LR-1 | PROVEN + MANUAL |
| Invitation email delivery | Resend adapter + allowlist | CB-E1-E | 2 real emails; then OFF | Inbox render if PATH B | No | LR-1/2 | PROVEN + MANUAL |
| Invitation acceptance | Cookie seal + accept RPC | CB-G1 + B1-C2 | once proven; CB-Q1 not re-run | One controlled accept if PATH B | No | Use CB-G1 runbook | PROVEN + MANUAL |
| Role/permission behavior | Owner/Admin/Staff/Viewer; Social Owner/Admin only | domain + security tests | CS FV | Visual deny copy only if desired | No | No per-role browser bootstrap | PROVEN |
| Tenant isolation | RLS + server org; no silent fallback | security suites | CS FV + SMM-B1-FV | None | No | Do not regress | PROVEN |
| Settings | Members + org context | CS FV | yes | None | No | Keep | PROVEN |
| Navigation | AppShell CS + conditional Social | B1-C5 + B1-FV | yes | None | No | Keep | PROVEN |
| Mobile/responsive | Playwright mobile/tablet packs | b1-fv + b1-c5 specs | CS FV | Admission-path screens if new | No | LR-2 only if PATH opens | PROVEN + MANUAL |
| Empty states | Gate OFF, not enrolled, no org, forbidden | UI + FV §24 | yes | None | No | Keep | PROVEN |
| User-facing errors | Structured panels; no stack traces on launch surfaces | CS FV | yes | Watch first-run only | No | Keep | PROVEN |
| Observability/admin | Members UI; `/operator/social-beta` | SMM-R1-B | operator list | None for launch | No | Keep | PROVEN |
| Feedback collection | None (in-product) | n/a | n/a | After P1 if built | P1 | LR-3 | IMPLEMENTATION GAP |
| Support/contact path | None in-app | n/a | n/a | Owner email out-of-band until P1 | P1 | LR-3 | IMPLEMENTATION GAP |
| Privacy/legal/terms | No routes | n/a | n/a | Only if launch model requires | No | Backlog unless counsel requires | NOT REQUIRED FOR BETA 1 |
| Production gate safety | Dual Social + invitation + registration fail-closed | worker dry-run + tests | `2026-08-22 10:30:00` Social dry-run | Confirm still OFF before testers | No | Do not enable publish/schedule | PROVEN |
| Offboarding/deactivation | Instagram disconnect; invite revoke; Social pause/revoke | SMM-R1 + disconnect tests | prior | None | No | Keep | PROVEN |
| Data cleanup/deletion | No customer self-serve delete-all | n/a | n/a | Owner ops if tester leaves | No | NOT REQUIRED | NOT REQUIRED FOR BETA 1 |

---

## F. Access Control Readiness

Current model:

* **Invite-only by default** (`INVITATIONS_ENABLED` fail-closed).
* **Public owner registration** opt-in (`PUBLIC_REGISTRATION_ENABLED` fail-closed).
* **Social** separately operator-enrolled (`SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED` + email allowlist).
* Invitation **email** additionally gated (`INVITATION_EMAIL_DELIVERY_ENABLED` + recipient allowlist).

UI restrictions match server rejects. An arbitrary visitor hitting `/register` cannot provision an org while the gate is OFF.

Admission **can** be handled from the website once gates are ON (Members UI or `/register`). Routine testers do **not** require SQL. Social enrollment is UI at `/operator/social-beta`, not SQL, but is a per-org operator action.

Substantial manual DB work is **not** required for Course Sellers admission after LR-1.

---

## G. Authentication & Onboarding

Proven by Course Sellers B1-FV. Incomplete Owner onboarding redirects to `/onboarding`. Invite cookie takes precedence to `/invite/accept`. Foreign `org` does not silently load the only membership. Protected routes redirect to login. No launch-blocking redirect loop found in code review.

---

## H. Course Sellers Integration

Social additions are additive in AppShell. CS nav items unchanged. Shared org-selection leak was fixed in CS B1-FV and remains in place.

Current regression (`2645 passed / 2 failed / 2647 total`) is the same Social-FV baseline. The two failures remain the known unrelated invitation-spy and enrollments-copy tests — **not** new, **not** Social, **not** a CS reopen.

No CS module needs re-certification from zero.

---

## I. Social Integration

Do not reopen SMM-B1-FV.

Launch-level: enrolled Owner/Admin can discover Social; not-enrolled users get an honest closed-beta panel and no Connect/Prepare/Execute. Disabled publishing/scheduling must remain honest (existing copy). No new Instagram write is required.

If closed-beta testers are **Course Sellers only**, Social enrollment is optional. If they should use Social Prepare/Calendar (still no live publish), operator-enroll that org.

---

## J. Invitations & Members

Proven end-to-end once (B1-C2 / CB-E1-E), then gates restored OFF. CB-G1 left a controlled **activation/rollback runbook** with acceptance still OFF. CB-Q1 re-QA is blocked by cleanup disposition and is **not** required if B1-C2 remains the authority and LR-1 performs one controlled live admission.

Idempotency: delivery keys + attempt store. Create/resend rate-limited. Accept rate-limit deferred (known, not P0).

Do **not** enable delivery/acceptance in LR-0.

---

## K. Roles & Tenant Safety

Roles in repo: Owner, Admin, Staff, Viewer.

| Role | Course Sellers | Members | Social |
| --- | --- | --- | --- |
| Owner | full | yes | if enrolled |
| Admin | full | yes | if enrolled |
| Staff | ops (no Members nav) | no | `/social` forbidden |
| Viewer | read-mostly | no | `/social` forbidden |

Deny matrix is automated. No additional per-role Production browser bootstrap is required for launch.

Tenant isolation: PROVEN. Do not reintroduce silent single-org fallback.

---

## L. Mobile / Responsive Readiness

Authenticated Owner CS mobile/tablet Playwright packs already passed in B1-C5 / B1-FV.

Not covered by those packs: unauthenticated admission, invite email, Social workspace. After LR-1 opens a path, LR-2 should visually smoke **only** that new path at mobile width. Do not redo the entire CS mobile FV.

---

## M. Empty / Error / Loading States

Launch-critical honest states exist: registration unavailable, invitation unavailable, Social not enrolled, organization selection required, forbidden, auth required, publishing/scheduling disabled.

No stack-trace / secret leakage found on those surfaces in prior FVs.

---

## N. Feedback & Support

There is **no** in-product feedback form, support page, or terms/privacy route.

Prior Social R1-C treated in-product feedback as out of scope. For admitting **external** testers, that is a **P1 launchability gap**, not a P0 security/product-track defect.

**Smallest safe launch-ready solution (do not build in LR-0):**

* One visible support line in the authenticated shell footer, e.g. `Need help? Email <owner support address>` (`mailto:`).
* Owner tells each invited tester the same address in the invite note.
* No ticketing system.

Legal/terms: **NOT REQUIRED FOR BETA 1** unless counsel later requires it.

---

## O. Owner Operations / Observability

Without SQL, Owner/Admin can operate:

* Members and pending invitations (`/settings/members`)
* Invitation gate truth (rollout notice)
* Course Sellers operational Attention
* Social operator list/detail (`/operator/social-beta`) if allowlisted

No global “all registrations / all orgs” dashboard. That is optional, not launch-critical.

Routine closed-beta ops do **not** require DB inspection.

---

## P. Production Gate Inventory

Values below are last authoritative evidence + this-phase Social dry-run. Invitation/registration Production env values were **not** re-listed (sensitive). Treat CS B1-FV §29 and CB-G1 as current intended resting state unless the owner later activates LR-1.

| Gate | Current / intended resting | Purpose | Required for admitting testers | Risk if enabled | Owner action |
| --- | --- | --- | --- | --- | --- |
| `PUBLIC_REGISTRATION_ENABLED` | OFF (example + fail-closed default) | Owner self-signup + org create | **ON only if PATH A** | Open org creation on the internet | Choose XOR PATH B |
| `INVITATIONS_ENABLED` | OFF (B1-FV / CB-G1) | Accept + invite-mode register | **ON if PATH B** | Invitees can join allowlisted orgs | CB-G1 runbook |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | OFF (CB-E1-E) | Send Resend emails | **ON if PATH B uses email** | Real mail to allowlist only | Allowlist first |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | configured when delivery historically ON | Fail-closed recipients | Required if delivery ON | Empty = no send | Set tester inbox |
| `SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED` | fail-closed; used for operator | Operator enroll UI | ON for Social testers | Operator-only if allowlist tight | Keep allowlist |
| `SOCIAL_CONNECTIONS_ENABLED` / `SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED` | fail-closed defaults; Production connection already exists | OAuth | Only if testers must connect IG | New OAuth | Do not casually enable |
| `SOCIAL_SCHEDULING_ENABLED` | OFF (`2026-08-22 10:30:00` dry-run) | Auto execute | **OFF** for launch | Live scheduled publishes | Do not enable |
| `SOCIAL_PUBLISHING_ENABLED` | OFF (same tick) | Execute publish | **OFF** for launch | Live Instagram writes | Do not enable |

Social execution gates must remain OFF unless a later owner-authorized controlled write is separately approved.

---

## Q. Automated Verification

| Command | Result |
| --- | --- |
| `npx vitest run --reporter=dot` | `2 failed / 2645 passed / 2647 total` — **same identities/reasons as SMM-B1-FV** |
| `npx tsc --noEmit` | PASS |
| `npx eslint` auth/invitations/onboarding/social + security tests | 0 errors; 1 pre-existing unused-var warning in `load-pending-organization-invitations.test.ts` |
| `npx next build` | Not rerun; last PASS on SMM-B1-FV with **no implementation change** since |

Known unrelated failures (unchanged):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

If LR-1 changes Production gates, re-run invitation/auth unit tests and the existing Playwright admission/members packs — do not invent a new suite.

---

## R. Required Manual Owner Verification

### R1. Choose admission path (required before any tester)

1. Why not automated: product/policy decision.
2. URL: n/a (roadmap).
3. Role: Owner.
4. Prerequisites: this document.
5. Steps: pick **exactly one** — PATH A public owner registration **or** PATH B invite-only.
6. Expected: written choice.
7. PASS: `ADMISSION PATH = A` or `ADMISSION PATH = B`.
8. Mutates Production? No.
9. Cleanup: none.

### R2. Controlled gate activation (required; not in LR-0)

1. Why not automated: Production env + deploy is owner-authorized.
2. URL: Vercel Production env; then `https://www.zyntixai.com`.
3. Role: Owner / platform operator.
4. Prerequisites: R1; CB-G1 runbook if PATH B; allowlist + Resend if email.
5. Steps: set only the gates for the chosen path to exact `"true"`; deploy; confirm the other path remains OFF.
6. Expected: Members or `/register` becomes usable; opposite path still denied.
7. PASS: `CLOSED-BETA ADMISSION PATH ACTIVE — OPPOSITE PATH REMAINS OFF`.
8. Mutates Production? Yes (env + deploy).
9. Cleanup: keep Social publish/schedule OFF; do not leave both A and B open unless explicitly intended.

**Do not perform R2 in this discovery phase.**

### R3. One tester through to Home (required after R2)

1. Why not automated: real email/browser/session.
2. PATH A: `https://www.zyntixai.com/register` → `/home?org=`. PATH B: `https://www.zyntixai.com/settings/members` → invite email → `https://www.zyntixai.com/invite/accept`.
3. Role: Owner sender + one tester.
4. Prerequisites: R2.
5. Steps: complete the chosen path once.
6. Expected: tester lands in the **correct org** with the **intended role**, sees Home, no foreign-org fallback.
7. PASS: `CLOSED-BETA TESTER ADMISSION = PASS`.
8. Mutates Production? Yes (user/membership/email).
9. Cleanup: revoke unused invites; do not delete the successful tester unless retiring them.

### R4. First-run visual + mobile-width smoke (required after R3)

1. Why not automated: clarity and overflow.
2. URLs: `/home`, `/onboarding` (if shown), `/leads`, `/settings/members`; if Social enrolled: `/social`.
3. Role: the new tester (Owner or invited role).
4. Prerequisites: R3.
5. Steps: walk the surfaces at desktop and ~390px width. Confirm primary actions visible; no dead end.
6. Expected: usable first session without owner sitting next to them, except the support email.
7. PASS: `CLOSED-BETA FIRST-RUN VISUAL = PASS`.
8. Mutates Production? No if read-only walk.
9. Cleanup: none.

### R5. Social enroll (only if testers must use Social)

1. Why not automated: operator policy + UX.
2. URL: `https://www.zyntixai.com/operator/social-beta`.
3. Role: platform operator allowlist.
4. Prerequisites: tester org exists; publishing/scheduling OFF.
5. Steps: enroll_approved that org only. Tester opens Social. Confirm Connect/Prepare visible if allowed; Execute still blocked.
6. Expected: honest closed-beta Social; no live publish.
7. PASS: `SOCIAL CLOSED-BETA ENROLLMENT = PASS — PUBLISHING REMAINS OFF`.
8. Mutates Production? Yes (enrollment row).
9. Cleanup: pause/revoke if tester leaves.

### Not required

* Another Instagram `media_publish`.
* Full Course Sellers FV rerun.
* Per-role browser bootstrap.
* R1-F 3–5 org Social cohort.
* Legal pages (unless counsel requires).

`No additional manual verification required` for already-closed CS and SMM product tracks themselves.

---

## S. Actual Implementation Gaps

### P0 closed-beta blockers

**None in product code.**

**Operational P0 (blocks admitting users until LR-1):** both PATH A and PATH B are OFF. This is intentional fail-closed, not a missing feature.

### P1 should-fix before broader Beta

* Minimal support/feedback path (mailto in shell + invite note). Smallest safe solution in §N.
* One controlled live admission after gates ON (process, not new code).

### P2 backlog / improvements

* In-product feedback form / ticketing.
* Global registration dashboard.
* Staff view-only Social.
* Invitation accept rate-limit (deferred).
* Terms/privacy pages.
* R1-F multi-org Social cohort.
* Unused-var warning in `load-pending-organization-invitations.test.ts`.
* Known unrelated Vitest failures (invitations spy; enrollments copy).

---

## T. Recommended Execution Order

Shortest safe sequence (do not invent extra phases):

1. **`BETA1-LR-1` — Closed-beta admission activation**  
   Owner path choice. Controlled enable of PATH A **xor** PATH B using existing CB-G1 / registration parsers. Deploy. Opposite path stays OFF. Social publish/schedule stay OFF.

2. **`BETA1-LR-2` — First tester admission + first-run smoke**  
   Execute R3–R4 (and R5 only if Social is in the tester brief). No product expansion.

3. **`BETA1-LR-3` — Minimal support/feedback**  
   Footer `mailto` (or equivalent one-liner). No ticketing.

4. **`BETA1-FV` — Closed-beta launch Production verification**  
   Confirm testers can enter, gates match the chosen model, Social execution still OFF, no tenant regression. Then — and only then — consider admitting a small real cohort.

Do not start Analytics, Story VIDEO, grid builders, or other Beta 2 work.

---

## U. Final Discovery Verdict

**ZyntixAI cannot safely begin admitting closed-beta users right now.**

The product tracks are Production-verified. What remains is **admission operations**, not rebuilding Course Sellers or Social:

1. Owner chooses PATH A or PATH B.
2. LR-1 activates that path only.
3. LR-2 walks one tester to Home (optional Social enroll, publishing OFF).
4. LR-3 adds a one-line support path before a wider cohort.
5. BETA1-FV certifies the live admission model.

Until LR-1, keep `PUBLIC_REGISTRATION_ENABLED`, `INVITATIONS_ENABLED`, `INVITATION_EMAIL_DELIVERY_ENABLED`, `SOCIAL_SCHEDULING_ENABLED`, and `SOCIAL_PUBLISHING_ENABLED` fail-closed.

```text
BETA1-LR-0 DISCOVERY COMPLETE — READY FOR CONTROLLED LAUNCH READINESS EXECUTION
NEXT PHASE: BETA1-LR-1 — CLOSED-BETA ADMISSION ACTIVATION
```
