# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-E1-E — Controlled Production Invitation Email Delivery Verification

### CB-E1-E OWNER ACTION REQUIRED — PROVIDE CONTROLLED QA ALLOWLIST RECIPIENT (DELIVERY RESTORED OFF; ZERO EMAILS SENT)

| Field | Value |
| --- | --- |
| Official scope | **CB-E1-E — Controlled Production Invitation Email Delivery Verification** |
| Document type | Pre-send checkpoint / safe stop evidence |
| Date | 2026-08-14 |
| Owner authorization | `OWNER APPROVED — AUTHORIZE CB-E1-E CONTROLLED PRODUCTION INVITATION EMAIL DELIVERY VERIFICATION` |
| Starting HEAD | `c24d28625fb3082d697e95a92eb653f1e828025c` |
| Formal status | **OWNER ACTION REQUIRED** before first real send |
| Real emails sent | **0** |
| Acceptance gate | remained **OFF** |
| Final delivery gate | restored **OFF** |

```text
CB-E1-E OWNER ACTION REQUIRED — PROVIDE CONTROLLED QA ALLOWLIST RECIPIENT
DELIVERY RESTORED OFF
ZERO REAL INVITATION EMAILS SENT
```

---

## 1. Owner authorization (FACT)

**OWNER APPROVED — AUTHORIZE CB-E1-E CONTROLLED PRODUCTION INVITATION EMAIL DELIVERY VERIFICATION**

Covered: controlled delivery ON window; allowlisted QA recipient only; create/resend verification; cleanup; restore delivery OFF.

**Not** covered: acceptance ON; external recipients; CB-G1.

---

## 2. Starting Git baseline (VERIFIED)

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `c24d28625fb3082d697e95a92eb653f1e828025c` |
| Divergence | `0 0` |
| Worktree | clean |

---

## 3. Preflight (VERIFIED)

| Check | Result |
| --- | --- |
| Starting deployment | `dpl_9r6GuMKiEdSQjg5NpWzgyYvtbnAx` READY |
| Supabase | `dmctinrcjvsgmoxwwodw`; latest `20260814150000`; up to date |
| DNS invites domain | DKIM/MX/SPF present; apex SPF/DMARC untouched |
| Tracking | CB-E1-D OWNER-VERIFIED OFF / not configured |
| Env presence | Resend key, From, allowlist, both gates present (Production, Encrypted) |
| QA pending invitations | **0** |
| QA delivery attempts | **0** |
| Acceptance UI | restricted-rollout notice present (**OFF**) |

---

## 4. Delivery activation attempt (CONFIGURED / DEPLOYED)

| Step | Result |
| --- | --- |
| Set `INVITATION_EMAIL_DELIVERY_ENABLED=true` | **done** (Production) |
| `INVITATIONS_ENABLED` | **not changed** (remains false) |
| Temporary ON deploy | `dpl_BFzosXE85XJq45ankQ98xXLPR55h` READY → aliased to `https://zyntixai.vercel.app` |
| Invitation create during ON window | **not executed** |

---

## 5. Stop reason (BLOCKED)

Production allowlist is Encrypted/Sensitive. Vercel agent `env pull` returns placeholder `[sensitive]`, so the controlled QA recipient address **cannot be machine-read** for the Members create form without owner disclosure.

Per CB-E1-E hard gate: recipient must be conclusively the configured allowlisted inbox before first send.

```text
OWNER ACTION REQUIRED — PROVIDE CONTROLLED QA ALLOWLIST RECIPIENT FOR CREATE FORM
(or type it into production /settings/members yourself and authorize Cursor to continue)
```

Do **not** paste secrets. The allowlist email alone is sufficient for continuation.

---

## 6. Safe restore (CONFIGURED / DEPLOYED)

| Step | Result |
| --- | --- |
| Set `INVITATION_EMAIL_DELIVERY_ENABLED=false` | **done** |
| OFF redeploy | `dpl_u7sAPqF52xeB99Fweot4yrXGv3Nw` READY |
| Alias | `https://zyntixai.vercel.app` |
| Acceptance | still **OFF** |
| Real emails | **0** |
| Pending invites / submitted attempts | unchanged baseline (**0** pending observed) |

---

## 7. Rollback targets retained

| Role | Deployment |
| --- | --- |
| CB-E1-D baseline | `dpl_9r6GuMKiEdSQjg5NpWzgyYvtbnAx` |
| Temporary delivery-ON | `dpl_BFzosXE85XJq45ankQ98xXLPR55h` |
| Current safe OFF | `dpl_u7sAPqF52xeB99Fweot4yrXGv3Nw` |

---

## 8. Next continuation

After owner provides the allowlisted QA recipient (or enters it in the form):

1. re-enable delivery ON + redeploy;
2. one controlled create (viewer);
3. owner inbox confirmation;
4. one controlled resend;
5. cleanup;
6. restore delivery OFF;
7. close CB-E1-E with evidence.

Do not start CB-G1.
