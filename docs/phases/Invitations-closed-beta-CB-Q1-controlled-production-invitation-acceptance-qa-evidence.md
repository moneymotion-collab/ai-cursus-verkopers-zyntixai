# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-Q1 — Controlled Production Invitation Acceptance QA

### CB-Q1 OWNER ACTION REQUIRED — OPTION B SELECTED; UPDATE ALLOWLIST TO EXISTING NON-MEMBER QA AUTH ACCOUNT

| Field | Value |
| --- | --- |
| Official scope | **CB-Q1 — Controlled Production Invitation Acceptance QA** |
| Document type | Pre-QA Phase A verification + Option B checkpoint |
| Date | 2026-08-14 |
| Owner authorization | `OWNER APPROVED — AUTHORIZE CB-Q1 CONTROLLED PRODUCTION INVITATION ACCEPTANCE QA` |
| Auth-path decision | **Option B** — existing non-member QA auth account |
| Prior decision HEAD | `8a698c744ec4c63ded7eb148e29bb9f9be9f3250` |
| Formal status | **STOPPED — OWNER ACTION REQUIRED** (no Production gate mutation performed) |
| Real emails during CB-Q1 so far | **0** |
| Invitation creates | **0** |
| Acceptances | **0** |

```text
CB-Q1 OWNER ACTION REQUIRED — OPTION B SELECTED; UPDATE ALLOWLIST TO EXISTING NON-MEMBER QA AUTH ACCOUNT AND CONFIRM READY
```

---

## 1. Owner authorization (FACT)

**OWNER APPROVED — AUTHORIZE CB-Q1 CONTROLLED PRODUCTION INVITATION ACCEPTANCE QA**

Phase A read-only verification completed. No delivery/acceptance gate changes. No invitation created.

---

## 2. Verified starting Git baseline (VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD / upstream | `a2806dc907e110a7903adb52ce93a0d888135f38` |
| Divergence | `0 0` |
| Worktree | clean |

---

## 3. Starting production deployment (VERIFIED)

| Item | Value |
| --- | --- |
| Deployment ID | `dpl_8pSbXBHpcTyPPASAwWaEFBdQ7xtr` READY |
| Deployed SHA | `5d7486b8fa00e6efd3f1ec7108cc8387abd9b87d` (CB-G1 hardened app) |
| Alias | `https://zyntixai.vercel.app` |
| Rollback candidate | `dpl_G3U17mUBayC8s4DCPooNRg2UbuGd` |

---

## 4. Production DB alignment (VERIFIED)

| Item | Result |
| --- | --- |
| Project | `dmctinrcjvsgmoxwwodw` |
| Latest migration | `20260814150000` |
| Drift | none observed (latest matches expected) |

---

## 5. Starting gate state (VERIFIED)

| Gate | Evidence |
| --- | --- |
| `INVITATIONS_ENABLED` | OFF — Members UI: “Invitation acceptance is currently disabled…”; `/invite/accept` title **Invitation unavailable** |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | OFF — Members UI: “…invitation email delivery is not enabled yet” |
| Env presence | Encrypted Production vars present (values not decrypted) |

---

## 6. Starting QA organization baseline (VERIFIED)

| Metric | Value |
| --- | --- |
| Organization | ZyntixAI Production QA (`2fc07699-…`) |
| Active members | **6** |
| Pending invitations | **0** |
| Submitted delivery attempts (historical CB-E1-E retained) | **2** |

---

## 7. Controlled QA recipient / auth readiness (VERIFIED → STOP)

### Recipient policy

- Controlled allowlisted QA inbox from CB-E1-E remains the intended closed-beta delivery recipient (allowlist Encrypted; full address not read / not published).
- Email fingerprint of CB-E1-E successful invite (`573da95d…`): `8359c74f65e0` (sha256 prefix of `email_normalized`).
- That recipient is **not** an active member of ZyntixAI Production QA (no pending invite; prior invites revoked).

### Auth-account precondition

Preferred CB-Q1 fixture: **existing ZyntixAI auth account that is NOT a member of ZyntixAI Production QA**.

Machine check against `auth.users` for the CB-E1-E invitation `email_normalized`:

| Match mode | Count |
| --- | --- |
| exact | **0** |
| lower | **0** |
| lower(trim) | **0** |

**FACT:** The current controlled QA inbox used for CB-E1-E delivery has **no** corresponding Supabase Auth user.

Therefore CB-Q1 cannot isolate acceptance from new-account provisioning without owner choice.

### Secondary note (not the stop reason)

Member Administration UI currently exposes invite create/revoke only; automated boundary tests assert no `suspendMembership` / `removeMembership` UI. Post-accept cleanup path will need confirmation after acceptance succeeds (section 41), but is not the current blocker.

---

## 8. Owner decision — Option B recorded (FACT)

Owner selected **Option B** (existing non-member QA auth account).

Do **not** use suspended QA memberships as the invite target (`19db8e29…`, `f3ceb423…` remain `viewer/suspended` in ZyntixAI Production QA). Acceptance must not reactivate/override suspension; those are unsafe CB-Q1 fixtures.

Prefer a confirmed `auth.users` identity with **no** `organization_members` row for ZyntixAI Production QA (or at least not suspended/removed collision), that the owner can log into.

---

## 9. Owner action required before Stage 1

1. In Vercel Production, set Encrypted `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` to the chosen existing non-member QA account email (exact invite recipient).
2. Confirm in chat (masked only) that allowlist was updated, e.g. `user_prefix=xxxxxxxx` and/or `email_fp=xxxxxxxxxxxx`, and that login credentials for that account are available.
3. Optionally leave the email entered (unsubmitted) in `/settings/members` Invite form for the controlled create step.

Do **not** paste raw invitation tokens or full email if avoidable.

Until that confirmation:

- keep both gates OFF;
- do not create an invitation;
- do not send email.

---

## 10. Mutations performed

None.

- Delivery not enabled
- Acceptance not enabled
- No invitation created
- No email sent
- No membership created

---

## 11. Next step after allowlist confirmation

Resume from the published HEAD after owner confirms Option B allowlist + account readiness, then continue Stage 1 (delivery ON only / acceptance OFF).

Do **not** set `INVITATIONS_ENABLED=true` until after delivery OFF restoration following the single invitation email.
