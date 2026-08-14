# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-E1-D — Resend Provider / Domain / DNS / Secrets + Controlled Deployment Readiness

### CB-E1-D OWNER ACTION REQUIRED — RESEND DOMAIN + HOSTNET DNS + PRODUCTION SECRETS/ALLOWLIST BEFORE DEPLOY

| Field | Value |
| --- | --- |
| Official scope | **CB-E1-D — Resend Provider / Domain / DNS / Secrets + Controlled Deployment Readiness** |
| Document type | Preflight + owner-action gate evidence (deployment **not** performed) |
| Official phase number | **NONE ASSIGNED** |
| Date | 2026-08-14 |
| Formal status | `CB-E1-D OWNER ACTION REQUIRED` |
| Owner authorization | `OWNER APPROVED — AUTHORIZE CB-E1-D RESEND PROVIDER / DOMAIN / DNS / SECRETS + CONTROLLED DEPLOYMENT READINESS` |
| Starting HEAD | `9f9a037665cc935a6c358e0b8af8e6e7bb044882` |
| Branch | `core/platform-readiness-20260707` |
| Real email | **NOT SENT** |
| Deploy | **NOT PERFORMED** (blocked on owner external actions) |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | Must remain **false** (not flipped ON) |
| `INVITATIONS_ENABLED` | Must remain **false** (not flipped ON) |

```text
CB-E1-D — PREFLIGHT COMPLETE; EXTERNAL MANUAL GATES OPEN
DEPLOY / REAL EMAIL / ACCEPTANCE ON: NOT STARTED
```

---

## 1. Owner authorization (FACT)

**OWNER APPROVED — AUTHORIZE CB-E1-D RESEND PROVIDER / DOMAIN / DNS / SECRETS + CONTROLLED DEPLOYMENT READINESS**

Covered (subject to gates): Resend readiness; MFA/account security; sender domain; DNS from Resend; secrets; allowlist; tracking review; controlled deploy with both gates OFF; evidence.

**Not** covered: real invitation email; delivery ON; acceptance ON; CB-E1-E; CB-G1; CB-Q1; CB-PUB; webhooks; unrelated DNS/product work.

---

## 2. Verified starting Git baseline (FACT / VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `9f9a037665cc935a6c358e0b8af8e6e7bb044882` |
| Upstream / origin | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

---

## 3. Inherited closed / production state (FACT)

| Slice | Verdict |
| --- | --- |
| CB-R1 | `CLOSED AND PRODUCTION VERIFIED` — create 10/3600; resend 3/3600 |
| CB-E1-A | `CLOSED WITH EVIDENCE` — delivery core + Resend adapter + fail-closed gates |
| CB-E1-B | `CLOSED WITH EVIDENCE` — template + secure acceptance URL |
| CB-E1-C | `CLOSED AND PRODUCTION VERIFIED` — DB attempt/idempotency foundation active; **app not live** |

---

## 4. Current production application baseline (VERIFIED)

| Item | Result |
| --- | --- |
| Production deployment ID | `dpl_CRe4rhPk2gjNcMB7vh9izMnJEq96` |
| Status | Ready |
| Primary alias | `https://zyntixai.vercel.app` |
| Created | 2026-08-13 |
| Contains CB-R1 `rate_limited` UX mapping? | **NO** (undeployed) |
| Contains CB-E1-A/B/C application code? | **NO** (undeployed) |
| Production DB latest migration | `20260814150000` (aligned; dry-run up to date) |

---

## 5. Reconstructed production env contract (FACT)

From `.env.example` + `src/features/invitations/server/delivery/config.ts` + invitations feature gate:

| Variable | Required when | Server-only? | Missing / OFF behavior |
| --- | --- | --- | --- |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | always present as control | yes (not `NEXT_PUBLIC_`) | fail-closed; only exact `true` enables |
| `RESEND_API_KEY` | delivery ON | **yes** | when ON → `configuration_error`; when OFF may be absent |
| `INVITATION_EMAIL_FROM` | delivery ON | **yes** | when ON → `configuration_error`; when OFF may be absent |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | delivery ON | **yes** | empty → fail closed when ON |
| `INVITATIONS_ENABLED` | acceptance control | yes | fail-closed; remains OFF |
| `NEXT_PUBLIC_SITE_URL` | production origin | public | trusted acceptance/auth origin |
| `INVITE_CONTINUATION_SECRET` | acceptance continuation | **yes** | fail-closed if short/missing (acceptance path) |

**No** `NEXT_PUBLIC_RESEND_API_KEY`. Resend SDK import is under `server-only` modules.

---

## 6. Official Resend provider requirements used (FACT)

Sources (official docs, 2026-08-14):

- https://resend.com/docs/add-a-domain
- https://resend.com/docs/dashboard/domains/introduction
- https://resend.com/docs/dashboard/domains/tracking
- https://resend.com/docs/dashboard/domains/dmarc
- https://resend.com/docs/knowledge-base/what-if-my-domain-is-not-verifying

Key provider facts:

- Must verify an owned domain before sending.
- Prefer a **subdomain** for transactional reputation segmentation.
- DNS records must be **copied exactly from Resend** (DKIM TXT + SPF TXT/MX on Resend return-path host, typically `send.<domain>`).
- Do not invent SPF/DKIM values.
- Open/click tracking **disabled by default**; click tracking rewrites links → **must stay OFF** for invitation credential URLs.
- DMARC is recommended after domain verification; do not blindly change existing strict policies.

---

## 7. Sender domain decision (FACT / RECOMMENDATION)

| Item | Result |
| --- | --- |
| Owner-controlled domain proven | **`zyntixai.com`** (Vercel team domain inventory + public DNS) |
| DNS provider | **Hostnet** (`ns01.hostnet.nl`, `ns02.hostnet.nl`) |
| Vercel intended NS | `ns1/ns2.vercel-dns.com` (**not** active; Hostnet remains authoritative) |
| Apex A | `76.76.21.21` (Vercel anycast) |
| Production app host today | `https://zyntixai.vercel.app` (not custom-domain primary) |
| Recommended transactional send domain | **`invites.zyntixai.com`** |
| Recommended From identity | **`ZyntixAI <invites@invites.zyntixai.com>`** |

**Why subdomain (not apex):**

- Apex already has Hostnet SPF: `v=spf1 a mx include:_spf.hostnet.nl -all`
- Apex already has **strict DMARC**: `v=DMARC1; p=reject`
- Resend return-path SPF typically lives under `send.<sending-domain>` — avoids merging/replacing apex SPF
- Reputation segmentation for transactional invites

**Owner confirmation still required** for the exact subdomain/From string before DNS mutation.

---

## 8. Existing DNS / mail posture (VERIFIED — public)

| Record | Observed | Action for CB-E1-D |
| --- | --- | --- |
| Apex SPF TXT | `v=spf1 a mx include:_spf.hostnet.nl -all` | **DO NOT MODIFY** (conflict risk if a second SPF were added) |
| Apex MX | none observed | leave alone |
| `_dmarc.zyntixai.com` | `v=DMARC1; p=reject` | **DO NOT CHANGE** without separate owner awareness |
| `send.zyntixai.com` | absent | will be created only if Resend domain is apex (not recommended) |
| `invites.zyntixai.com` | absent | intended Resend sending domain (pending) |
| Resend DKIM | absent | pending Resend-generated values only |

**STOP condition satisfied for speculative DNS:** no Resend-generated record values are available yet → **no DNS mutations performed**.

---

## 9. SPF (STATUS)

| Item | Status |
| --- | --- |
| Apex SPF | existing Hostnet policy — **unchanged** |
| Resend SPF | **PENDING** — must use Resend dashboard values for chosen send domain only |
| Conflict risk if apex SPF edited | **HIGH** — forbidden in this phase without merge design |

---

## 10. DKIM (STATUS)

**PENDING** — wait for Resend-generated `resend._domainkey…` (or equivalent) for `invites.zyntixai.com`. No cryptographic values invented.

---

## 11. DMARC (STATUS)

| Item | Status |
| --- | --- |
| Existing | **YES** — `p=reject` on `_dmarc.zyntixai.com` |
| Changed this phase | **NO** |
| Recommendation | **leave unchanged**; verify Resend DKIM/SPF alignment under `invites.zyntixai.com` before CB-E1-E |
| If future change needed | separate owner-aware decision (strict policy can affect other Hostnet mail) |

---

## 12. Tracking (STATUS)

| Item | Status |
| --- | --- |
| Official default | open/click tracking **OFF** |
| Required for invites | **click tracking MUST be OFF** |
| Preferred | open tracking OFF |
| Account verified in Resend | **MANUAL OWNER ACTION REQUIRED** (no Resend dashboard access from this agent session) |

---

## 13. Resend account security (STATUS)

**MANUAL OWNER ACTION REQUIRED**

Cannot verify from Cursor:

- account owner identity
- MFA enabled
- recovery methods
- team membership hygiene
- API key naming / least privilege

Do not fabricate completion.

---

## 14. API key / Vercel secrets (STATUS)

| Item | Status |
| --- | --- |
| Production `RESEND_API_KEY` | **not configured by this phase** |
| Production `INVITATION_EMAIL_FROM` | **not configured by this phase** |
| Production allowlist | **not configured** — no owner-approved QA recipient email is established in evidence (`*.example.test` aliases are not real inboxes) |
| Gates | must be set/kept `INVITATION_EMAIL_DELIVERY_ENABLED=false`, `INVITATIONS_ENABLED=false` |
| Secret handling | **do not paste keys into chat/git** |

---

## 15. QA recipient policy (STATUS)

**OWNER/QA RECIPIENT INPUT REQUIRED**

Historical invitation QA used synthetic `…@example.test` addresses (not deliverable). Controlled Production QA org exists, but no authoritative real allowlist recipient is published in repository evidence.

---

## 16. Pre-deploy verification performed without deploy (VERIFIED)

| Check | Result |
| --- | --- |
| Migration alignment | remote up to date at `20260814150000` |
| `npm run typecheck` | **PASS** |
| Client/server boundary (static) | Resend adapter + delivery modules use `import "server-only"`; no `NEXT_PUBLIC_RESEND_*` |
| Lint / full Vitest / production build | **deferred** until owner external gates clear and deploy is re-entered |
| Deploy | **not started** |

---

## 17. Deployment (NOT PERFORMED)

| Item | Result |
| --- | --- |
| Rollback target retained | `dpl_CRe4rhPk2gjNcMB7vh9izMnJEq96` |
| New deployment | **none** |
| Reason | provider domain/DNS/API key/allowlist gates incomplete; preferred sequence places these before deploy |

---

## 18. Rollback / kill-switch plan (DOCUMENTED — ready when deploy proceeds)

1. **Email kill switch:** keep/set `INVITATION_EMAIL_DELIVERY_ENABLED=false` (Production).
2. **Acceptance kill switch:** keep/set `INVITATIONS_ENABLED=false` (Production).
3. **App rollback:** promote previous Ready deployment `dpl_CRe4rhPk2gjNcMB7vh9izMnJEq96` (or later known-good).
4. **Provider compromise:** revoke/rotate Resend API key in Resend + remove/replace Vercel Production secret.
5. **Bad sender/domain:** leave delivery OFF; do not rely on DNS deletion as primary incident response.

---

## 19. Exact owner manual checklist (MANUAL OWNER ACTION REQUIRED)

Complete in order. Do **not** paste secrets into chat or commit them.

### A. Confirm sender identity

1. Confirm send domain: **`invites.zyntixai.com`** (recommended) or owner-chosen alternative under `zyntixai.com`.
2. Confirm From: **`ZyntixAI <invites@invites.zyntixai.com>`** (or owner-approved equivalent on that domain).

### B. Resend account security

1. Sign in to Resend as the production owner.
2. Enable MFA; secure recovery.
3. Remove unnecessary team members.
4. Confirm click tracking remains **OFF** for the invitation domain (do not enable tracking subdomain for invites).

### C. Add domain in Resend

1. Domains → Add **`invites.zyntixai.com`** (region per owner preference; document choice).
2. Open **Records** tab.
3. Copy the **exact** Resend-generated DNS table (Type / Name / Value).
4. Do **not** invent records.

### D. Hostnet DNS (authoritative)

1. Log into Hostnet DNS for `zyntixai.com`.
2. Add **only** the Resend-provided records for the invites send domain / return-path / DKIM.
3. **Do not** create a second apex SPF TXT.
4. **Do not** modify `_dmarc` `p=reject` in this phase.
5. Wait for propagation; use Resend verify + public DNS checks.

### E. API key (Production only)

1. Create a production Resend API key with a clear name (e.g. `zyntixai-prod-invitations`).
2. In Vercel project `zyntixai` → Production env only:
   - `RESEND_API_KEY` = (secret; Production scope)
   - `INVITATION_EMAIL_FROM` = confirmed From string
   - `INVITATION_EMAIL_DELIVERY_ENABLED` = `false`
   - `INVITATIONS_ENABLED` = `false`
   - `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` = owner-approved QA recipient(s)
   - Confirm `NEXT_PUBLIC_SITE_URL` = intended production origin (`https://zyntixai.vercel.app` unless custom host is promoted)
3. Do **not** put the production key in Preview/Development unless explicitly required later.

### F. Re-authorize continuation

After A–E are done, authorize Cursor to:

1. verify DNS/provider status (no real send);
2. run lint/tests/build;
3. perform one controlled production deploy with **both gates OFF**;
4. run no-send smoke;
5. close CB-E1-D with evidence.

---

## 20. Real-email safety (FACT)

- Zero Resend invitation sends performed.
- Zero DNS mutations performed.
- Zero Vercel production env secret writes performed by this agent.
- CB-E1-E **not** started.

---

## 21. Scope confirmation (FACT)

Did **not**: enable delivery/acceptance; invite external users; configure webhooks; alter apex SPF/DMARC; deploy app; start CB-E1-E/G1/Q1/PUB; redesign CB-E1-A/B/C; change CB-R1.

---

## 22. CB-E1-D closure status

```text
CB-E1-D OWNER ACTION REQUIRED — RESEND DOMAIN + HOSTNET DNS FOR invites.zyntixai.com + PRODUCTION API KEY / ALLOWLIST (THEN RE-ENTER DEPLOY)
```

---

## 23. Remaining roadmap (DEFERRED)

1. Finish CB-E1-D owner actions + controlled deploy (delivery OFF)
2. **CB-E1-E** — Controlled Production Invitation Email Delivery Verification
3. CB-G1 → CB-Q1 → CB-PUB

---

## 24. Owner decision required

```text
OWNER ACTION REQUIRED — CONFIRM invites.zyntixai.com + COMPLETE RESEND/HOSTNET/VERCEL SECRET STEPS; RE-AUTHORIZE CB-E1-D DEPLOY CONTINUATION
```

---

## 25. Evidence / publication

| Item | Value |
| --- | --- |
| Evidence file | `docs/phases/Invitations-closed-beta-CB-E1-D-resend-domain-dns-secrets-controlled-deployment-readiness-evidence.md` |
| Preferred commit | `docs(invitations): record CB-E1-D owner-action readiness gate` |

*(Hash filled after publication.)*
