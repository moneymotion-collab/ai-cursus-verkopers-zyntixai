# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-Q1 — Controlled Production Invitation Acceptance QA

### CB-Q1 OWNER DECISION REQUIRED — NO APPROVED QA MEMBERSHIP CLEANUP PATH EXISTS

| Field | Value |
| --- | --- |
| Official scope | **CB-Q1 — Controlled Production Invitation Acceptance QA** |
| Document type | Auth readiness + cleanup preflight (gates remain OFF) |
| Date | 2026-08-14 |
| Owner continuation | `OWNER APPROVED — RESUME CB-Q1 WITH EXISTING-AUTH-ACCOUNT VERIFICATION, MEMBERSHIP-CLEANUP PREFLIGHT, AND CONTROLLED ACCEPTANCE QA ONLY IF ALL HARD GATES PASS` |
| Auth-path decision | **Option B** — existing non-member QA auth account |
| Resume-from HEAD | `b2a86ba9d81df7f9d4ee91aae19cae990c1c2925` |
| Formal status | **STOPPED — OWNER DECISION REQUIRED** (cleanup disposition unresolved; no gate mutation) |
| Real emails during CB-Q1 so far | **0** |
| Invitation creates | **0** |
| Acceptances | **0** |

```text
CB-Q1 OWNER DECISION REQUIRED — NO APPROVED QA MEMBERSHIP CLEANUP PATH EXISTS
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

## 11. Next step after allowlist confirmation (superseded by §12–§14)

Historical Option B allowlist action remained open; see §12 for current masked auth verification of the prepared Members form target.

Do **not** set `INVITATIONS_ENABLED=true` until after delivery OFF restoration following the single invitation email.

---

## 12. Resume verification — Git / Production / gates (VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | authoritative path |
| Branch | `core/platform-readiness-20260707` |
| HEAD / upstream | `b2a86ba9d81df7f9d4ee91aae19cae990c1c2925` |
| Divergence | `0 0` clean |
| Deploy | `dpl_8pSbXBHpcTyPPASAwWaEFBdQ7xtr` READY · SHA `5d7486b…` |
| DB | `dmctinrcjvsgmoxwwodw` · latest `20260814150000` |
| Delivery / Acceptance | both **OFF** (Members restricted-rollout copy) |
| QA org baseline | **6** active · **0** pending · **2** submitted attempts |

---

## 13. Auth-account readiness (PARTIAL — machine PASS; owner confirms still needed)

Owner-prepared Members form email (not published) was checked against Production auth:

| Check | Result |
| --- | --- |
| Matching `auth.users` | exactly **1** |
| `user_prefix` | `b7be51ce` |
| `email_fp` | `c221bfd439a3` |
| Email confirmed | **yes** |
| Banned / deleted | **no** |
| QA org active membership | **none** |
| QA org suspended membership | **none** |
| QA pending invitation | **0** |
| Other org memberships | **none** |
| Form role | Viewer |
| Form submitted | **no** |

Classification:

- Machine: `AUTH ACCOUNT EXISTS + QA ORG MEMBERSHIP = NONE`
- Login capability: `OWNER CONFIRMATION REQUIRED — LOGIN CAPABLE` (not yet owner-confirmed in this continuation)
- UI org context when inspected: **ZyntixAI Production QA Isolation** (wrong org for CB-Q1 create). Owner must switch to **ZyntixAI Production QA** before Stage 1.
- Allowlist correspondence: Encrypted; not decrypted. Owner must ensure Production allowlist matches this same existing account before Stage 1.

Auth readiness is **not** the current hard stop by itself, but Stage 1 still requires login confirmation + correct org + allowlist match.

---

## 14. Membership cleanup preflight (FAIL — hard stop)

Searched read-only:

- `/settings/members` UI (`ActiveMembersSection` read-only; no member row actions)
- invitation server actions (create/resend/revoke/accept only)
- migrations for membership lifecycle RPCs
- RLS foundation policies
- design contract §5 / §30 / §32
- boundary tests asserting absence of `suspendMembership` / `removeMembership`

| Candidate path | Verdict |
| --- | --- |
| UI remove/suspend | **absent** (MVP non-goal) |
| Public RPC suspend/remove member | **absent** |
| Server action membership mutation | **absent** |
| Invitation revoke | invitation-only; does **not** remove accepted membership |
| Direct `organization_members` UPDATE/DELETE | RLS may permit Owner/Admin technically; design contract says **not product authorization** |

```text
CB-Q1 OWNER DECISION REQUIRED — NO APPROVED QA MEMBERSHIP CLEANUP PATH EXISTS
```

Why direct DB deletion is not used: Member Administration MVP explicitly excludes destructive member admin; CB-Q1 authorization forbids unapproved/direct table deletion.

### Owner options

1. Authorize leaving the temporary QA Viewer membership after successful acceptance (cleanup-pending closure path).
2. Authorize a separate Member Administration cleanup capability (new scoped implementation phase; not CB-Q1).
3. Pause CB-Q1; keep both gates OFF.

Until one option is chosen:

- do **not** enable delivery;
- do **not** enable acceptance;
- do **not** create an invitation;
- do **not** send email.

---

## 15. Stage 1 proceed decision

**NO — Stage 1 blocked.**

Hard pre-Stage-1 gate fails on cleanup disposition (#12 in continuation prompt). Auth candidate looks suitable once login/org/allowlist are confirmed, but invitation creation remains unauthorized until cleanup disposition is resolved.
