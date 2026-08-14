# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-E1-E — Controlled Production Invitation Email Delivery Verification

### CB-E1-E CREATE AND RESEND PROVIDER SUBMISSION PASS — OWNER RESEND INBOX VERIFICATION REQUIRED

| Field | Value |
| --- | --- |
| Official scope | **CB-E1-E — Controlled Production Invitation Email Delivery Verification** |
| Document type | Resend provider checkpoint / owner inbox gate |
| Date | 2026-08-14 |
| Latest continuation authorization | `OWNER APPROVED — RESUME CB-E1-E AFTER FIRST QA EMAIL RECEIPT AND EXECUTE EXACTLY ONE CONTROLLED RESEND` |
| Starting HEAD | `9baa3233e03a89fb85332fd3102427db2628ffec` |
| Formal status | **OWNER RESEND INBOX VERIFICATION REQUIRED** before cleanup/closure |
| Real emails submitted | **2** (create + resend) |
| Create inbox | **OWNER-VERIFIED** receipt |
| Resend inbox | awaiting owner confirmation |
| Acceptance gate | remained **OFF** |
| Delivery gate during checkpoint | restored **OFF** |

```text
OWNER ACTION REQUIRED — CONFIRM CB-E1-E RESEND EMAIL RECEIVED EXACTLY ONCE IN QA INBOX
CB-E1-E CREATE AND RESEND PROVIDER SUBMISSION PASS — OWNER RESEND INBOX VERIFICATION REQUIRED
2 REAL INVITATION EMAIL SUBMISSIONS
DELIVERY RESTORED OFF FOR CHECKPOINT
ACCEPTANCE OFF
```

---

## 1. Continuation authorization (FACT)

**OWNER APPROVED — RESUME CB-E1-E USING THE NEW CONTROLLED NON-MEMBER QA ALLOWLIST RECIPIENT**

Owner replaced Production `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` with a new owner-controlled non-member QA inbox (Sensitive/Encrypted; value not read by Cursor).

---

## 2. Verified Git baseline (VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `4aa659fad8da24c89281630812303c4b1f454392` |
| Upstream | `origin/core/platform-readiness-20260707` @ same SHA |
| Divergence | `0 0` |
| Worktree | clean |

---

## 3. Safe production OFF baseline (VERIFIED)

| Check | Result |
| --- | --- |
| Deployment | `dpl_4iPddcZCQb3AZbrVq6JLCfNjtcj6` READY |
| Alias | `https://zyntixai.vercel.app` |
| Delivery | **OFF** (not changed this stop) |
| Acceptance | **OFF** (`INVITATIONS_ENABLED` unchanged; restricted-rollout notice live) |
| Env presence | allowlist / delivery / From / Resend key / acceptance gate present Encrypted |
| Real emails | **0** |

---

## 4. DB alignment (VERIFIED)

| Check | Result |
| --- | --- |
| Project | `dmctinrcjvsgmoxwwodw` |
| Latest migration | `20260814150000` |
| Local = remote | **yes** (`db push --linked --dry-run` → up to date) |
| Drift | **none** |

---

## 5. Material baseline deviation — STOP BEFORE SEND (FACT)

Expected from prior stop: pending QA invitations **0**, submitted attempts **0**.

Observed before any delivery activation:

| Metric | Expected | Observed |
| --- | --- | --- |
| Pending invitations (QA org) | 0 | **1** |
| Delivery attempts | 0 | **0** |
| Submitted attempts | 0 | **0** |

Pending invitation facts (masked):

| Field | Value |
| --- | --- |
| Invitation id | `34235e20-5e77-4087-a8d0-a301d5469299` |
| Status | `pending` |
| Role | `viewer` |
| Created | `2026-08-14 16:24:08+00` (after prior OFF restore) |
| Lifecycle | exactly one `invitation_created` |
| Delivery attempts | **0** |
| Provider submissions | **0** |

Interpretation: invitation was created while delivery was **OFF** (zero-send pending residue). Application create path for the same email returns `invite_already_pending` and cannot produce the authorized first **create** delivery generation without clearing this row first.

UI also shows Resend/Revoke for that pending invite; Email field contains the owner-controlled QA address; Role `Viewer`. Recipient address is **not** recorded here.

---

## 6. Actions NOT performed this continuation

- Did **not** set `INVITATION_EMAIL_DELIVERY_ENABLED=true`
- Did **not** redeploy
- Did **not** create / resend / revoke
- Did **not** call Resend
- Did **not** decrypt allowlist

---

## 7. Owner action required

```text
OWNER ACTION REQUIRED — REVOKE THE ZERO-SEND PENDING QA INVITATION ON /settings/members
THEN RE-ENTER THE NEW CONTROLLED QA ALLOWLIST RECIPIENT WITH ROLE Viewer AND LEAVE UNSUBMITTED
THEN AUTHORIZE RESUME OF CB-E1-E
```

Do **not** paste the allowlist address, API keys, or tokens into chat if avoidable.

After that, the authorized sequence remains:

delivery ON → redeploy → prove acceptance OFF → exactly one create → owner inbox confirm → exactly one resend → cleanup → delivery OFF.

---

## 8. Final safety state

| Item | Value |
| --- | --- |
| Delivery | **OFF** |
| Acceptance | **OFF** |
| Production deploy | `dpl_4iPddcZCQb3AZbrVq6JLCfNjtcj6` |
| Real emails | **0** |

---

## 9. Prior verdict (HISTORICAL — superseded below)

```text
CB-E1-E BLOCKED — ZERO-SEND PENDING QA INVITATION ALREADY EXISTS (CREATE PATH BLOCKED)
DELIVERY REMAINS OFF
ZERO REAL INVITATION EMAILS SENT
```

---

## 10. Continuation after cleanup authorization (2026-08-14)

**OWNER APPROVED — RESUME CB-E1-E AFTER ZERO-SEND PENDING QA INVITATION CLEANUP**

### 10.1 Git / OFF deploy / DB (VERIFIED)

| Check | Result |
| --- | --- |
| HEAD | `41893a765a3d7d77caa7166b99ca5c90788e1935` |
| Divergence | `0 0` |
| Worktree | clean |
| Production deploy | `dpl_4iPddcZCQb3AZbrVq6JLCfNjtcj6` READY → `https://zyntixai.vercel.app` |
| DB | `dmctinrcjvsgmoxwwodw` / `20260814150000` aligned |
| Delivery | **OFF** (not activated) |
| Acceptance | **OFF** (restricted-rollout notice live; `INVITATIONS_ENABLED` unchanged) |

### 10.2 Stale pending cleanup (VERIFIED PASS)

| Check | Result |
| --- | --- |
| Invitation `34235e20-5e77-4087-a8d0-a301d5469299` | status **`revoked`**; `revoked_at` set |
| Pending QA invitations | **0** |
| Delivery attempts / submitted | **0** / **0** |
| UI pending list | **0 invitations** |

### 10.3 Owner-prepared form (FAIL — STOP)

| Check | Result |
| --- | --- |
| Org | ZyntixAI Production QA |
| Role default | `Viewer` |
| Email field | **empty** (recipient not present) |
| Submitted | **no** |
| Recipient guessed | **no** (policy forbids) |

### 10.4 Actions NOT performed

- Did **not** enable delivery
- Did **not** redeploy
- Did **not** create / resend
- Did **not** call Resend
- Did **not** decrypt allowlist

### 10.5 Prior verdict at form-empty stop (HISTORICAL)

```text
CB-E1-E OWNER ACTION REQUIRED — RE-ENTER THE NEW CONTROLLED QA ALLOWLIST RECIPIENT IN /settings/members AND LEAVE UNSUBMITTED
STALE ZERO-SEND PENDING INVITATION REVOKED
DELIVERY REMAINS OFF
ZERO REAL INVITATION EMAILS SENT
```

---

## 11. First controlled create delivery (2026-08-14)

**OWNER APPROVED — RESUME CB-E1-E FROM PREPARED CONTROLLED QA RECIPIENT AND EXECUTE FIRST CONTROLLED PRODUCTION EMAIL DELIVERY TEST**

### 11.1 Pre-send baselines (VERIFIED)

| Check | Result |
| --- | --- |
| Starting HEAD | `5426a0af01011d2113ace0d21f9315f5b3c8e2f9` |
| Divergence / worktree | `0 0` / clean |
| Rollback OFF deploy | `dpl_4iPddcZCQb3AZbrVq6JLCfNjtcj6` READY |
| DB | `dmctinrcjvsgmoxwwodw` / `20260814150000` aligned |
| Pending / submitted attempts | **0** / **0** |
| Form | email present (masked); role `Viewer`; unsubmitted |
| Active-member conflict | **false** |
| Acceptance | **OFF** |
| Delivery before activation | **OFF** |
| Allowlist | present Encrypted (not decrypted) |

### 11.2 Temporary delivery ON (DONE)

| Step | Result |
| --- | --- |
| Set `INVITATION_EMAIL_DELIVERY_ENABLED=true` | done |
| `INVITATIONS_ENABLED` | unchanged (**false**) |
| Temporary ON deploy | `dpl_G3ZR6PXyzCUaJG9JLrC3YJufK7w7` READY → `https://zyntixai.vercel.app` |
| Post-deploy form | still populated (no navigation/reload; no recipient guess) |
| Acceptance after ON | still **OFF** (restricted-rollout notice) |

### 11.3 Controlled create (PASS)

| Item | Result |
| --- | --- |
| Path | `/settings/members` → Create invitation **once** |
| Org | ZyntixAI Production QA (`2fc07699-ece5-44b9-bbb3-abbc23e9fffb`) |
| Role | `viewer` |
| Invitation id | `573da95d-050d-42d7-8f01-4a600f944652` |
| Status | `pending` |
| Expiry | `2026-08-21 16:39:58+00` (~7d) |
| Lifecycle | exactly one `invitation_created` |
| Recipient in evidence | **masked** |

### 11.4 Create delivery attempt (PASS)

| Field | Result |
| --- | --- |
| Attempt id | `548e1f70-3e8b-4ca0-972c-3e499e77f5e0` |
| Operation | `create` |
| Status | `submitted` |
| Provider | `resend` |
| Provider message ID | present (prefix `3700d4f7…`, length 36) |
| Failure category | **null** |
| Generations / create ops | **1** / **1** |
| Resend ops | **0** |
| Distinct provider IDs | **1** |

### 11.5 Delivery-attempt privacy (PASS)

Attempt table columns are metadata-only (`operation`, `generation_key`, `idempotency_key`, `provider`, `status`, `provider_message_id`, `failure_category`, timestamps). No stored raw token, acceptance URL, HTML/text body, recipient email, API key, or auth secret. Idempotency key contains no `@`.

### 11.6 URL / tracking (STRUCTURAL — inherited + code contract)

Canonical builder: `https://{trusted-origin}/invite/accept/exchange?token=<64-hex>` via `buildInvitationAcceptanceUrl` (HTTPS production origin `https://zyntixai.vercel.app`, only `token` query). Tracking remains OFF/not configured per CB-E1-D. Live raw token not inspected/logged.

### 11.7 Checkpoint safety restore OFF (DONE)

| Step | Result |
| --- | --- |
| Set `INVITATION_EMAIL_DELIVERY_ENABLED=false` | done |
| Keep acceptance OFF | yes |
| Checkpoint OFF deploy | `dpl_FV1oMVkK73eJwRAy5iWZxKm8EJ5d` READY → `https://zyntixai.vercel.app` |
| Pending invite retained for resend | **yes** (`573da95d-…`) |
| Real emails | **1** |

### 11.8 Owner action required

```text
OWNER ACTION REQUIRED — CONFIRM CB-E1-E CREATE EMAIL RECEIVED IN QA INBOX AND PRESENTATION IS CORRECT
```

Confirm:

- exactly one create email;
- sender `ZyntixAI <invites@invites.zyntixai.com>`;
- subject/org/Viewer/CTA/expiry/security copy;
- no duplicate;
- no obvious tracking wrapper.

Do **not** paste the invitation token/URL.

Do **not** resend until this confirmation.

Do **not** start CB-G1.

### 11.9 Prior create-checkpoint verdict (HISTORICAL)

```text
CB-E1-E CREATE PROVIDER SUBMISSION PASS — OWNER INBOX VERIFICATION REQUIRED
1 REAL INVITATION EMAIL SENT
DELIVERY RESTORED OFF FOR CHECKPOINT
INVITATIONS_ENABLED=false
```

---

## 12. Controlled resend (2026-08-14)

**OWNER APPROVED — RESUME CB-E1-E AFTER FIRST QA EMAIL RECEIPT AND EXECUTE EXACTLY ONE CONTROLLED RESEND**

First create inbox receipt: **OWNER-VERIFIED** (`FIRST QA INVITATION EMAIL RECEIVED`). Presentation details beyond receipt are not overclaimed.

### 12.1 Pre-resend baselines (VERIFIED)

| Check | Result |
| --- | --- |
| Starting HEAD | `9baa3233e03a89fb85332fd3102427db2628ffec` |
| Divergence / worktree | `0 0` / clean |
| Starting OFF deploy | `dpl_FV1oMVkK73eJwRAy5iWZxKm8EJ5d` READY |
| DB | `dmctinrcjvsgmoxwwodw` / `20260814150000` aligned |
| Invitation `573da95d-…` | still `pending` / Viewer / QA org |
| Lifecycle before resend | exactly one `invitation_created` |
| Create attempt | `548e1f70-…` submitted / msg prefix `3700d4f7…` |
| Submitted attempts before | **1** |
| Active membership for invitee | **0** |
| Acceptance | **OFF** |
| Delivery before activation | **OFF** |
| Pre-resend token-hash fingerprint | `2cebb3b85ab5d528` (sha256 of hash; not raw token) |

### 12.2 Temporary delivery ON for resend (DONE)

| Step | Result |
| --- | --- |
| Set `INVITATION_EMAIL_DELIVERY_ENABLED=true` | done |
| `INVITATIONS_ENABLED` | unchanged (**false**) |
| Resend-ON deploy | `dpl_9WkQyshDHWNVxQ4WSTeA4BPEkcK2` READY → `https://zyntixai.vercel.app` |
| UI | pending invite present; Resend available; acceptance OFF |

### 12.3 Controlled resend (PASS)

| Item | Result |
| --- | --- |
| Path | `/settings/members` → Resend **once** |
| UI result | `Invitation refreshed and email submitted.` |
| Same invitation ID | `573da95d-050d-42d7-8f01-4a600f944652` |
| Status | remains `pending` |
| Expiry refreshed | `2026-08-21 16:52:26+00` |
| Lifecycle | added exactly one `invitation_resent` |
| Token-hash fingerprint | `7299154ad01fd6e4` (**changed** from pre-resend) |
| Membership created | **no** |

`OLD GENERATION INVALIDATION VERIFIED BY TOKEN-HASH ROTATION; LIVE RAW-TOKEN REPLAY OMITTED TO PRESERVE CREDENTIAL CONFIDENTIALITY`

### 12.4 Resend delivery attempt (PASS)

| Field | Result |
| --- | --- |
| Attempt id | `f5eb9561-1706-4d22-9c4a-0be7e88b9368` |
| Operation | `resend` |
| Status | `submitted` |
| Provider | `resend` |
| Provider message ID | present (prefix `a6303993…`, length 36) |
| Differs from create msg | **yes** (`3700d4f7…` ≠ `a6303993…`) |
| Failure category | **null** |

### 12.5 Provider / idempotency totals (PASS)

| Metric | Result |
| --- | --- |
| Submitted attempts | **2** |
| Create / resend ops | **1** / **1** |
| Distinct provider message IDs | **2** |
| Distinct generations | **2** |
| Distinct idempotency keys | **2** |
| Idempotency keys contain `@` | **no** |
| Extra emails to prove idempotency | **none** |

### 12.6 Delivery-attempt privacy (PASS)

Same metadata-only schema as create; no raw token/URL/body/recipient/API key/auth secret in attempt rows.

### 12.7 Tracking / URL (STRUCTURAL)

Canonical acceptance URL builder unchanged; click/open tracking remain OFF/not configured (CB-E1-D). Accept link not clicked. Acceptance remained OFF.

### 12.8 Checkpoint restore OFF (DONE)

| Step | Result |
| --- | --- |
| Set `INVITATION_EMAIL_DELIVERY_ENABLED=false` | done |
| Keep acceptance OFF | yes |
| Checkpoint OFF deploy | `dpl_G3U17mUBayC8s4DCPooNRg2UbuGd` READY → `https://zyntixai.vercel.app` |
| Pending invite retained pending cleanup | **yes** |

### 12.9 Owner action required

```text
OWNER ACTION REQUIRED — CONFIRM CB-E1-E RESEND EMAIL RECEIVED EXACTLY ONCE IN QA INBOX
```

Confirm:

- exactly one additional email;
- create + resend only (no duplicate resend);
- sender/readable/CTA OK;
- no obvious tracking wrapper.

Do **not** paste token/URL.

Do **not** revoke/cleanup until this confirmation (unless a later safety order).

Do **not** start CB-G1.

### 12.10 Current verdict

```text
CB-E1-E CREATE AND RESEND PROVIDER SUBMISSION PASS — OWNER RESEND INBOX VERIFICATION REQUIRED
2 REAL INVITATION EMAIL SUBMISSIONS
DELIVERY RESTORED OFF FOR CHECKPOINT
INVITATIONS_ENABLED=false
```
