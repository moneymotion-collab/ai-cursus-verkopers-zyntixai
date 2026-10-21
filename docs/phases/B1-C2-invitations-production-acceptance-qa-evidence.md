# B1-C2 — Invitations Production Acceptance QA — Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C2 — Invitations Production Acceptance QA** (+ **B1-C2-R1** verification recovery) |
| Date | 2026-08-20 |
| Formal status | `B1-C2 CLOSED WITH EVIDENCE — PRODUCTION INVITATION DELIVERY, VERIFICATION & ACCEPTANCE VERIFIED` |
| Branch | `core/platform-readiness-20260707` |
| Implementation (R1 + delivery copy) | `f7b3745` |
| Evidence commits | through this closure commit |
| Invitation | `008aa279-c18d-4c7b-97cf-5b90d09a7737` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Role | `viewer` |
| Cleanup disposition | **A** — temporary Viewer retained |
| Migrations | **NONE** |
| Real emails | **1** |
| Acceptances | **1** |
| Memberships created | **1** |
| Delivery gate | **OFF** |
| Acceptance gate | **OFF** |
| Social publishing | **OFF** |
| Final resting deploy | `dpl_EN6cgHzS8JafpWkHzvFp9uhfZGZe` |

```text
B1-C2 CLOSED WITH EVIDENCE — PRODUCTION INVITATION DELIVERY, VERIFICATION & ACCEPTANCE VERIFIED
```

---

## 1. Executive verdict

Controlled Production invitation lifecycle completed end-to-end for ZyntixAI Production QA:

Owner invite → one Resend delivery → Owner-confirmed inbox → invite-gated registration → B1-C2-R1 verification recovery → acceptance → Viewer membership exactly once → gates restored OFF.

Temporary Viewer membership remains per disposition **A**.

---

## 2. Baseline

| Metric | Pre-test | Post-accept resting |
| --- | --- | --- |
| Active members | 6 | **7** |
| Target memberships | 0 | **1** (viewer/active) |
| Pending invitations | 0 | **0** |
| Accepted invitations (org) | 3 | **4** |
| Delivery attempts (org) | 2 | **3** |
| Auth users for recipient | 0 | **1** (`user_prefix=80352a2f`) |
| Social publishing | OFF | **OFF** |
| Controlled windows | closed=1, consumed=2 | unchanged |

---

## 3. Invitation architecture

Unchanged Product path: `InviteMemberForm` → `createInvitationAction` → RPC `create_organization_invitation` → post-mutation `orchestrateInvitationDelivery` (Resend) → `/invite/accept/exchange` continuation → `acceptInvitationAction` → RPC `accept_organization_invitation`.

---

## 4. Controlled recipient

| Field | Value |
| --- | --- |
| `email_fp` | `dc8bd0d9c066` |
| Role | `viewer` |
| Allowlist | sole-recipient Production Encrypted allowlist |
| Cleanup | **A** leave temporary Viewer |

---

## 5. Initial delivery

| Field | Value |
| --- | --- |
| Owner submits | **1** |
| Attempt | operation=`create` · provider=`resend` · status=`submitted` · message id present |
| Org attempts | **2 → 3** |
| Automatic retry/resend | **none** |

---

## 6. Real inbox receipt

**OWNER-CONFIRMED REAL INBOX DELIVERY = YES** (not inferred solely from provider status).

---

## 7. Verification failure (preserved)

Owner observed: verification email click returned to resend screen; resend then rate-limited.

---

## 8. Root cause (B1-C2-R1)

**Classification B:** auth user **was** email-confirmed (`email_confirmed_at` present) but **no app session** (`last_sign_in_at` null). `/register/check-email` only inspected session confirmation → stuck on Resend. Rate-limit was secondary.

---

## 9. Verification fix

| Item | Value |
| --- | --- |
| Commit | `f7b3745` |
| Deploy | `dpl_CquK7fCNz61z5AmfzUu5nQbx11vg` |
| Changes | `/auth/callback` `token_hash`+`type` `verifyOtp`; invite `emailRedirectTo` `next=/invite/accept`; check-email already-verified / rate-limit sign-in guidance; gate-aware Members delivery copy |
| Resume | Owner signed in → accepted existing pending invite (no second invite/email) |

---

## 10. Acceptance success

| Field | Value |
| --- | --- |
| Invitation | `008aa279-c18d-4c7b-97cf-5b90d09a7737` |
| Status | **accepted** |
| `accepted_at` | `2026-08-20T04:14:32.808182+00` |
| `revoked_at` | null |
| Before expiry | **yes** |
| `accepted_by` | `80352a2f-…` |

---

## 11. Membership creation

| Field | Value |
| --- | --- |
| Membership id | `04c1e397-f36c-4683-88da-75c8386478b7` |
| Org | exact target |
| Role | **viewer** |
| Status | **active** |
| Created at | same timestamp as `accepted_at` |
| Duplicates | **0** |
| Escalation | **none** |

---

## 12. Viewer role proof

Domain permissions: Viewer cannot create/manage invitations. Owner Members UI shows Viewer role labels; target membership is viewer/active. Live Viewer Playwright session not required for closure (contract + durable membership proof). Temporary Viewer retained (A).

---

## 13. Replay protection

Security/fixture contracts: terminal `accepted` / `already_member`; no second Production acceptance performed. Membership remains **1** for target. Delivery attempts unchanged after accept.

---

## 14. Audit

| Event | Count |
| --- | --- |
| `invitation_created` | 1 |
| delivery attempt (create/submitted) | 1 |
| `invitation_accepted` | 1 |

No duplicate acceptance event.

---

## 15. Delivery-copy fix

Hardcoded “delivery is not enabled yet” replaced with gate-aware copy via `isInvitationEmailDeliveryEnabled()` (`f7b3745`). Live resting UI shows delivery **currently disabled** with acceptance disabled notice.

---

## 16. Browser QA

| Check | Result |
| --- | --- |
| Accept route gates OFF | feature-disabled copy |
| Owner Members desktop | PASS (refreshed auth) |
| Owner Members mobile | PASS · no overflow · no page errors |
| Org context | ZyntixAI Production QA |
| Pending recipient leak | none |
| Create form still present | yes (create allowed; delivery/accept OFF — expected) |

---

## 17. Responsive QA

Desktop + mobile Chromium Members: `scrollWidth <= clientWidth`; no hydration/page errors observed.

---

## 18. Gate shutdown

| Gate | Resting |
| --- | --- |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | **OFF** (after single send) |
| `INVITATIONS_ENABLED` | **OFF** (after single accept) |
| Deploy | `dpl_EN6cgHzS8JafpWkHzvFp9uhfZGZe` READY → `www.zyntixai.com` |
| Social | **OFF** · R1-F paused |

---

## 19. Production deltas

| Item | Before → After |
| --- | --- |
| Members | 6 → **7** |
| Target memberships | 0 → **1** |
| Pending invitations | 0 → **0** |
| Accepted invitations | 3 → **4** |
| Delivery attempts | 2 → **3** (no post-accept write) |
| Auth users (recipient) | 0 → **1** |
| Acceptance successes | +1 |
| Extra emails after initial | **0** |

---

## 20. Security assertions

- Recipient binding / org binding / role viewer preserved  
- One-time acceptance; no privilege escalation  
- Fail-closed gates restored  
- No Social mutation  
- Secrets/tokens/URLs not published  

---

## 21. Social safety

`SOCIAL_PUBLISHING_ENABLED=false`; windows closed=1, consumed=2; enrollments `publishing_allowed`=1 unchanged; R1-F remains paused.

---

## 22. Known limitations

- Live Viewer Playwright storageState not bootstrapped (optional; Viewer deny-matrix covered by domain/security tests).  
- Temporary Viewer membership left in place until later cleanup authorization.  
- Invite create UI remains available while delivery/acceptance gates OFF (by design of restricted rollout).

---

## 23. Git state

Reported after evidence publication push (see closure report). Never committed: `playwright/.auth/`, tokens, credentials, `.vercel`.

---

## 24. Closure verdict

All B1-C2 Definition of Done items satisfied with evidence above.

```text
B1-C2 CLOSED WITH EVIDENCE — PRODUCTION INVITATION DELIVERY, VERIFICATION & ACCEPTANCE VERIFIED
```

**Do not start B1-C3 in this pass.** Temporary Viewer remains (disposition A).
