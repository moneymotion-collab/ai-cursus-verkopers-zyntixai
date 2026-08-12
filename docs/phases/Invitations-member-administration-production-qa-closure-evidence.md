# ZYNTIXAI — Invitations / Member Administration

## Production QA Closure Evidence

### Current foundation scope — CLOSED WITH EVIDENCE

| Field | Value |
| --- | --- |
| Capability | **Invitations / Member Administration** (shared platform foundation) |
| Document type | Final production QA closure evidence (**documentation only**) |
| Official phase number | **NONE ASSIGNED** — unnumbered shared-platform track (no B1.x invented) |
| Date | 2026-08-12 |
| Formal status | `PRODUCTION QA CLOSED WITH EVIDENCE` |
| Current foundation / authorized QA scope | **CLOSED** |
| Closed-beta ready | **NO** |
| General-launch ready | **NO** |
| Design contract | `docs/phases/Invitations-member-administration-design-security-and-readiness-contract.md` |
| Governing standard | `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` |
| Course Sellers Beta 1 | Remains **PRODUCTION VERIFIED, CLOSED AND PUBLISHED** — not reopened |
| Branch | `core/platform-readiness-20260707` |
| Application source (unchanged) | `feb2e06723933bca6041a14a620d338661be6220` |
| Application subject | `feat(invitations): add production rollout gate` |
| Canonical production deployment | `dpl_59TLzaPKM9fjrGrKxEyfAA1UGSnE` |
| Canonical alias | `https://zyntixai.vercel.app` |
| Gate | **OFF** (`INVITATIONS_ENABLED=false`) |
| Pending invitations | **0** |

```text
INVITATIONS / MEMBER ADMINISTRATION
PRODUCTION QA CLOSED WITH EVIDENCE

CURRENT FOUNDATION / AUTHORIZED QA SCOPE: CLOSED
CLOSED-BETA READY: NO
GENERAL-LAUNCH READY: NO
GATE: OFF
PENDING: 0
```

No additional production Invitation mutation QA is required for the **CURRENT** authorized foundation scope.

This document does **not** claim closed-beta readiness, general-launch readiness, Owner live-matrix PASS, brand-new signup PASS, or complete Member Administration UX.

---

## 1. Purpose

This document is the repository evidence record that formally marks the currently authorized Invitations / Member Administration production-QA foundation as **CLOSED WITH EVIDENCE**.

It separates:

| Classification | Status |
| --- | --- |
| Current foundation / authorized production-QA scope | **CLOSED WITH EVIDENCE** |
| Closed-beta launch readiness | **NO** |
| General-launch readiness | **NO** |

---

## 2. Git / publication baseline

| Field | Value |
| --- | --- |
| Pre-publication application HEAD / upstream / origin | `feb2e06723933bca6041a14a620d338661be6220` |
| Divergence before docs publication | `0 0` |
| Worktree before docs publication | clean |
| Subject | `feat(invitations): add production rollout gate` |
| Application source already pushed/published | **YES** |
| Production QA executed from that source | **YES** |
| Application-code remediation required by closure review | **NO** |
| This publication | **DOCS ONLY** |

---

## 3. Final production state

| Field | Value |
| --- | --- |
| Deployment | `dpl_59TLzaPKM9fjrGrKxEyfAA1UGSnE` · Ready |
| Canonical | `https://zyntixai.vercel.app` |
| Gate | **OFF** |
| `INVITATIONS_ENABLED` | `false` |
| Invitations | **8** |
| Events | **21** |
| Pending | **0** |
| Accepted | **3** |
| Revoked | **5** |

No secrets are recorded in this document.

---

## 4. Automated validation evidence

Latest exact-HEAD evidence for `feb2e067…`:

| Check | Result |
| --- | --- |
| Test files | **268** |
| Tests | **1919** |
| `npm run test:run` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** |
| `npm run build` | **PASS** |
| Git after validation | **CLEAN** |

---

## 5. Core Acceptance evidence (existing-user success)

Production-verified normal existing-user Acceptance:

- Admin-created viewer Invitation
- raw-token exchange
- `303` redirect
- token-free `/invite/accept`
- continuation cookie
- normal existing verified Invitee login
- one explicit same-origin Accept
- Invitation accepted
- `token_hash` cleared
- active viewer membership
- `invitation_accepted` event
- trusted product landing
- continuation cookie cleanup
- no owner auto-provision
- post-OFF membership access remains valid

Surviving sanitized evidence row: **`6609e482`** (accepted).

---

## 6. OD-PR-Q14 controlled deviation

| Field | Value |
| --- | --- |
| Decision | **ACCEPTED AS CONTROLLED EXECUTION DEVIATION / NO PRECEDENT** |
| Facts | First core E2E required **3** same-row recovery resends for handoff recovery; only one physical Invitation; final accepted; `token_hash` NULL; audit events retained; no pending bearer |
| Stale-token proof? | **NO** — not counted as stale-token evidence |
| Closure impact | **NON-BLOCKING FOR CLOSURE** |

---

## 7. Operator RPC evidence (Admin production matrix)

| Operation | Result |
| --- | --- |
| Admin viewer create | **PASS** |
| Admin viewer resend | **PASS** |
| Admin viewer revoke | **PASS** |
| Admin staff create | **PASS** |
| Admin staff revoke | **PASS** |
| Admin admin-role create | **DENIED AS DESIGNED** |
| Foreign-org create | **DENIED AS DESIGNED** |
| Active-member create collision | `already_member` |
| Suspended-member create collision | `existing_membership_requires_admin_action` |

---

## 8. Email mismatch / account-switch evidence

Verified production flow:

1. Wrong authenticated account → `email_mismatch`
2. No DB Acceptance mutation; continuation retained
3. Switch account → Auth logout while continuation retained
4. Correct invited account login → **same** Invitation resumed
5. No second exchange; **zero** resend
6. Successful Accept → active viewer · accepted event · trusted landing
7. Post-OFF access **PASS**

Durable semantic consequence: former Wrong Account **`3a81f180`** is now intentionally an **active viewer** QA fixture.

---

## 9. Token-lifecycle evidence

### T1 — stale after resend

- TOKEN A → exactly one resend → TOKEN B
- Same physical Invitation; hash rotated
- Stale A browser Acceptance rejected
- Zero membership; zero accepted event
- TOKEN B never accepted
- Admin revoke → revoked / `token_hash` NULL

### T2 — revoke before exchange

- TOKEN C created then revoked **before** exchange
- Hash NULL
- Exchange may still seal because GET is DB-independent
- Explicit Acceptance rejected
- Zero membership; zero accepted event
- Row remains revoked

Token-lifecycle target **`83c7af57`**: QA membership **0**.

B2 totals: resends **1** · Accept attempts **2** · successful Accepts **0**.

---

## 10. Already-member Acceptance evidence

**Plant boundary (explicit):** controlled planted pending Invitation used for Acceptance only. Normal `create_organization_invitation` was **NOT** used to create the planted row.

| Field | Value |
| --- | --- |
| Planted Invitation | `38942d48` |
| Target | `71760c93` |
| Existing membership | `000a32a0` · viewer / active |
| Acceptance result | `already_member` |
| Invitation final | accepted |
| `token_hash` | NULL |
| `invitation_accepted` | exactly **1** |
| Membership row | reused |
| Membership row delta | **0** |
| Role | viewer → viewer |
| Status | active → active |

Normal active-member CREATE collision remains separately verified as `already_member` with zero Invitation/event/token row.

---

## 11. Admin-action Acceptance evidence

| Field | Value |
| --- | --- |
| Fixture | `f3ceb423` |
| Membership | `e5dc9d13` · viewer / suspended |
| Planted Invitation | `e72b38ab` |
| Acceptance result | `existing_membership_requires_admin_action` |

After Accept:

- Invitation remained **pending**
- `token_hash` **PRESENT**
- accepted event **0**
- membership unchanged · viewer / suspended · active count **0**
- continuation **retained**

Cleanup (ordered):

1. Admin revoke **PASS** → revoked · `token_hash` NULL · `invitation_revoked` ×1
2. Abandon **after** revoke proof → continuation cleared

No membership mutation.

---

## 12. Post-Abandon `/register/complete` follow-up

| Field | Value |
| --- | --- |
| Observed redirect | `/register/complete` |
| Classification | **NON-BLOCKING UX FOLLOW-UP** |

Reason (verified):

- Abandon clears continuation
- GET `/register/complete` does not provision Owner
- `PUBLIC_REGISTRATION_ENABLED` remains absent / fail-closed
- no Owner Organization created
- suspended membership remains suspended
- no Invitation secret exposed
- no unauthorized privilege transition

Future UX/routing cleanup candidate. Not a security or foundation-closure blocker.

---

## 13. Membership safety

| Scenario | Verified behavior |
| --- | --- |
| First-time Accept | Creates correct active viewer membership |
| `email_mismatch` | No membership mutation |
| `already_member` | Reuses existing active membership; no duplicate; role/status preserved |
| Admin-action | No suspended-member reactivation; no duplicate row |
| Stale token | No membership |
| Revoked token | No membership |
| Owner auto-provision | Not observed in tested flows |

---

## 14. Token security

| Property | Verified |
| --- | --- |
| Raw token | Not product-persisted |
| Pending bearer | Hash persisted |
| Resend | Rotates hash |
| Old raw token | Rejected |
| Successful Acceptance | Clears hash |
| Revoke | Clears hash |
| Revoked token | Rejected |
| Terminal QA rows | No live DB bearer |

No raw token, hash, email, password, cookie, or env secret values are recorded here.

---

## 15. Same-origin

Same-origin explicit Acceptance behavior was production-observed in the executed relevant flows (core Accept, email-mismatch, already_member, admin-action, token-lifecycle negatives).

This document does **not** claim browser/CSRF coverage outside those scenarios.

---

## 16. Audit evidence

| Metric | Value |
| --- | --- |
| Final event total | **21** |
| `invitation_created` | **8** |
| `invitation_resent` | **5** |
| `invitation_accepted` | **3** |
| `invitation_revoked` | **5** |
| Pending | **0** |

Audit evidence retained. No audit deletion.

---

## 17. Planted-fixture boundary

Controlled SQL fixture planting was used **ONLY** for Acceptance result branches that normal CREATE intentionally cannot reach:

- `already_member` Accept
- `existing_membership_requires_admin_action` Accept

The plant:

- recreated valid Invitation token/hash semantics
- recreated valid schema
- created required `invitation_created` audit event
- used controlled Admin actor semantics
- did **NOT** prove normal operator CREATE support
- was fully terminalized (accepted or revoked)
- left **zero** pending bearer

---

## 18. Schema / migration status

Live Invitations foundation migrations (repository filenames):

| Migration | Role |
| --- | --- |
| `supabase/migrations/20260809224000_create_organization_invitations.sql` | Schema |
| `supabase/migrations/20260809224010_create_organization_invitation_events.sql` | Events |
| `supabase/migrations/20260809224020_enable_organization_invitation_operational_rls.sql` | RLS |
| `supabase/migrations/20260810121000_add_organization_invitation_operator_helpers_and_rpcs.sql` | Operator RPC foundation |
| `supabase/migrations/20260810121010_organization_invitation_operator_rpc_security_hardening.sql` | Operator RPC security hardening |
| `supabase/migrations/20260810143000_add_organization_invitation_acceptance_helpers_and_rpc.sql` | Acceptance RPC foundation |
| `supabase/migrations/20260810143010_organization_invitation_acceptance_rpc_security_hardening.sql` | Acceptance RPC security hardening |

---

## 19. Durable QA fixture inventory

| Prefix | Semantic role | Durable state |
| --- | --- | --- |
| `77c7a60b` | Invitations QA Admin | active admin |
| `71760c93` | Invitations QA Invitee | active viewer |
| `3a81f180` | Former Wrong Account | active viewer (intentional) |
| `83c7af57` | Token-lifecycle target | QA membership **0** |
| `f3ceb423` | Admin-action target | viewer / suspended |
| `19db8e29` | Historical suspended reference | viewer / suspended |
| `928bbcaf` | QA Owner | active owner · credential limitation retained |

No emails or passwords.

---

## 20. Deferred coverage (not production-verified)

| Item | Status |
| --- | --- |
| Owner live matrix | **DEFERRED** |
| Owner-created admin invite vs Admin manage denial | **DEFERRED** |
| Staff actor live denial | **DEFERRED** |
| Viewer actor live denial | **DEFERRED** |
| Suspended/non-active actor live denial | **DEFERRED** |
| Brand-new Invitation signup | **DEFERRED** |
| Verification-email path | **DEFERRED** |
| Callback path | **UNKNOWN / unchanged** |
| Custom Invitation email delivery | **NOT IMPLEMENTED / NOT VERIFIED** |
| Rate limiting | **DEFERRED / REQUIRED before normal-user readiness** |
| Normal operator/member UI (`/settings/members`) | **NOT DELIVERED** |

No fake PASS claims.

---

## 21. Closed-beta blockers

Current foundation closure does **NOT** mean closed-beta ready.

Closed-beta blockers include:

- custom Invitation email delivery
- Invitation rate limiting (required before normal-user production readiness; **not waived**)
- minimum operator/member UI such as `/settings/members`
- Owner live matrix production evidence
- complete live denial actor coverage
- brand-new signup / callback / verification path

---

## 22. General-launch blockers

**GENERAL LAUNCH: NOT READY.**

General launch inherits all closed-beta blockers and remaining broader product / operational launch work. None of those are marked resolved by this closure.

---

## 23. Operator UI

Controlled RPC Production QA is complete for the verified Admin scope.

Human-facing `/settings/members` minimum operator surface is **not** delivered.

```text
RPC QA ≠ Member Administration UX completion
```

Classification: **NEXT PRODUCT PHASE / CLOSED-BETA BLOCKER**.

---

## 24. Rate limits

Rate limits remain **REQUIRED** before normal-user production readiness.

They are **NOT** waived by foundation closure.

---

## 25. Callback / brand-new user

| Item | Status |
| --- | --- |
| Callback | **UNKNOWN / unchanged** |
| Brand-new Invitation signup | **NOT production verified** |
| Verification email | **NOT production verified** |

Classification: deferred from current foundation QA closure; blocks broader closed-beta / general invite readiness.

---

## 26. Owner matrix

| Item | Status |
| --- | --- |
| Owner live production matrix | **DEFERRED** |
| Reason | Authorized QA credentials were not prepared |

Do **not** claim PASS.

Current foundation closure relies on:

- published authorization contract
- SQL/local security evidence
- Admin production matrix

---

## 27. Staff / Viewer / non-active live denial

| Item | Status |
| --- | --- |
| Live actor denial flows | **DEFERRED** |
| Reason | Credentials were intentionally not created/reset solely for QA |

Existing local/SQL evidence remains interim. No production PASS claim.

---

## 28. Closure classification

| Question | Answer |
| --- | --- |
| Current foundation / authorized production-QA scope | **CLOSED WITH EVIDENCE** |
| Closed-beta ready | **NO** |
| General-launch ready | **NO** |

No further current-scope mutation QA:

- No additional production Invitation mutation QA is required for the CURRENT authorized foundation scope
- Gate remains **OFF**
- Pending remains **0**
- Further Invitations work belongs to deferred coverage, launch readiness, or next product phase

No new application-code push:

- No application-code change was required after QA
- Application source remains `feb2e06723933bca6041a14a620d338661be6220`
- This publication is evidence/documentation only

---

## 29. Formal closure verdict

```text
ZYNTIXAI — INVITATIONS / MEMBER ADMINISTRATION
PRODUCTION QA CLOSED WITH EVIDENCE

CURRENT FOUNDATION SCOPE: CLOSED
APPLICATION SOURCE: UNCHANGED
CLOSURE PUBLICATION: DOCS-ONLY
PRODUCTION GATE: OFF
FINAL PRODUCTION QA DATA: 8 Invitations / 21 Events / 0 Pending
AUTOMATED: 268 files / 1919 tests / PASS
CLOSED-BETA READY: NO
GENERAL-LAUNCH READY: NO
ACTIVE DEVELOPMENT SLOT: INVITATIONS FOUNDATION MAY EXIT
```

Invitations foundation is cleared to leave the active development slot. The next roadmap phase must be **owner-selected/authorized** from authoritative roadmap documentation. This document does not invent or start that phase.
