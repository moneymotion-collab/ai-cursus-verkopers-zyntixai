# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-E1-D — Resend Provider / Domain / DNS / Secrets + Controlled Deployment Readiness

### CB-E1-D CLOSED WITH EVIDENCE — RESEND INFRASTRUCTURE AND CONTROLLED PRODUCTION DEPLOYMENT READY FOR FIRST QA EMAIL

| Field | Value |
| --- | --- |
| Official scope | **CB-E1-D — Resend Provider / Domain / DNS / Secrets + Controlled Deployment Readiness** |
| Document type | Controlled production deployment + tracking-off closure evidence |
| Official phase number | **NONE ASSIGNED** |
| Date | 2026-08-14 |
| Formal status | `CB-E1-D CLOSED WITH EVIDENCE` |
| Initial owner authorization | `OWNER APPROVED — AUTHORIZE CB-E1-D RESEND PROVIDER / DOMAIN / DNS / SECRETS + CONTROLLED DEPLOYMENT READINESS` |
| Continuation authorization | `OWNER APPROVED — RE-AUTHORIZE CB-E1-D CONTROLLED DEPLOY CONTINUATION WITH EMAIL DELIVERY OFF AND INVITATION ACCEPTANCE OFF` |
| Closure authorization | `OWNER APPROVED — COMPLETE CB-E1-D CLOSURE AFTER RESEND TRACKING-OFF VERIFICATION` |
| Closure starting HEAD | `9cfef1a89b5390d031052bde4c6efc8a1545ce01` |
| Branch | `core/platform-readiness-20260707` |
| Production deployment | `dpl_9r6GuMKiEdSQjg5NpWzgyYvtbnAx` (**READY**; unchanged — no redeploy for docs closure) |
| Rollback target | `dpl_CRe4rhPk2gjNcMB7vh9izMnJEq96` |
| Production alias | `https://zyntixai.vercel.app` |
| Deployed from Git HEAD | `c53004e8d21a9311d734e870d889b4d870859137` (clean worktree upload) |
| Real email | **ZERO SENT** |
| Click / open tracking | **OWNER-VERIFIED OFF / NOT CONFIGURED** |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | **OWNER-CONFIRMED `false`** + Production var present |
| `INVITATIONS_ENABLED` | **OWNER-CONFIRMED `false`** + Production var present + live UI restricted-rollout notice |

```text
CB-E1-D CLOSED WITH EVIDENCE
RESEND INFRASTRUCTURE AND CONTROLLED PRODUCTION DEPLOYMENT READY FOR FIRST QA EMAIL

DELIVERY GATE: OFF
ACCEPTANCE GATE: OFF
TRACKING: OFF / NOT CONFIGURED
REAL EMAIL: NOT SENT
CB-E1-E: NOT AUTHORIZED
```

---

## 0. Prior stop → continuation (FACT)

Previous verdict (`c53004e` evidence):

`CB-E1-D OWNER ACTION REQUIRED — RESEND DOMAIN + HOSTNET DNS + PRODUCTION SECRETS/ALLOWLIST BEFORE DEPLOY`

Owner then completed Resend domain verify, Hostnet DNS, Production env vars, and re-authorized deploy continuation with both gates OFF.

---

## 1. Owner re-authorization (FACT)

**OWNER APPROVED — RE-AUTHORIZE CB-E1-D CONTROLLED DEPLOY CONTINUATION WITH EMAIL DELIVERY OFF AND INVITATION ACCEPTANCE OFF**

Covered: Git/Supabase re-verify; env presence (no secret exposure); DNS verify-only; tests/build; one controlled production deploy; health/no-send smoke; evidence.

**Not** covered: delivery ON; acceptance ON; first real email; CB-E1-E; webhooks; DNS mutation; new migrations; new features.

---

## 2. Verified continuation Git baseline (FACT / VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `c53004e8d21a9311d734e870d889b4d870859137` |
| Upstream / origin | aligned |
| Divergence | `0 0` |
| Worktree | clean |

---

## 3. Owner-completed external setup (OWNER-CONFIRMED + partial VERIFIED)

| Item | Status |
| --- | --- |
| Sending domain | `invites.zyntixai.com` |
| Resend domain verified | **OWNER-CONFIRMED** (“Domain verified: ready to send”) |
| Sender identity | `ZyntixAI <invites@invites.zyntixai.com>` (**OWNER-CONFIRMED**) |
| DNS provider | Hostnet |
| Production `RESEND_API_KEY` | present, Encrypted, Production-only (**VERIFIED presence**; value not read) |
| Production `INVITATION_EMAIL_FROM` | present, Production-only |
| Production allowlist | present, Production-only, non-empty asserted by owner |
| Gates | owner states both `false` |

---

## 4. Resend domain / DNS readiness (VERIFIED public DNS; no mutation)

| Check | Result |
| --- | --- |
| DKIM TXT `resend._domainkey.invites.zyntixai.com` | **present** (Resend public key material observed) |
| MX `send.invites.zyntixai.com` | **present** — priority `10` → `feedback-smtp.eu-west-1.amazonses.com` |
| SPF TXT `send.invites.zyntixai.com` | **present** — `v=spf1 include:amazonses.com ~all` |
| Apex SPF `zyntixai.com` | **unchanged** — `v=spf1 a mx include:_spf.hostnet.nl -all` |
| Apex DMARC `_dmarc.zyntixai.com` | **unchanged** — `v=DMARC1; p=reject` |
| DNS mutations this continuation | **none** |

---

## 5. Resend tracking state (OWNER-VERIFIED — 2026-08-14)

Owner opened **Resend → Domains → `invites.zyntixai.com` → Configuration**.

Observed:

* section **Enable tracking metrics**;
* UI showed a **Configure** button;
* **no** configured tracking subdomain;
* **no** active tracking configuration.

| Item | Status |
| --- | --- |
| Tracking metrics configured? | **NO** (**OWNER-VERIFIED**) |
| Click tracking | **OFF / NOT CONFIGURED** |
| Open tracking | **OFF / NOT CONFIGURED** |
| Owner clicked Configure? | **NO** |
| Resend configuration mutation this closure | **NONE** |

**Rationale:** invitation acceptance URLs carry a bearer-like credential. Click tracking would rewrite links through a provider redirector; open tracking adds pixels/metadata. CB-E1 requires click tracking OFF; open tracking OFF is preferred and now owner-verified as not configured.

---

## 6. Production environment state (VERIFIED presence / OWNER-CONFIRMED values)

`vercel env list production` (names/scope only; values Encrypted):

| Variable | Production state |
| --- | --- |
| `RESEND_API_KEY` | configured (Encrypted, Production) |
| `INVITATION_EMAIL_FROM` | configured (Encrypted, Production) |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | configured (Encrypted, Production) — **OWNER-CONFIRMED `false`** |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | configured (Encrypted, Production) |
| `INVITATIONS_ENABLED` | configured (Encrypted, Production) — **OWNER-CONFIRMED `false`** |
| `NEXT_PUBLIC_SITE_URL` | configured (Encrypted, Production) — historical/intended `https://zyntixai.vercel.app` |
| `NEXT_PUBLIC_RESEND_API_KEY` | **absent** |

**Tooling note:** Vercel CLI `env pull` / agent context returns Encrypted values as the placeholder `[sensitive]`, so gate strings cannot be machine-decrypted here. Presence + owner authorization + live acceptance-off UI are the evidence basis.

---

## 7. Production Supabase alignment (VERIFIED)

| Item | Result |
| --- | --- |
| Linked project | `dmctinrcjvsgmoxwwodw` (`linked: true`, `ACTIVE_HEALTHY`) |
| Remote latest | `20260814150000_add_organization_invitation_delivery_attempts` |
| Local latest | same |
| Pending / remote-only / drift | **none** (`Remote database is up to date.`) |
| DB apply this phase | **none** |

---

## 8. Application source readiness (FACT)

Authoritative HEAD includes published CB-R1 app `rate_limited` mapping + CB-E1-A/B/C application code (commits through `514d729` / docs `c53004e`).

---

## 9. Server/client security verification (VERIFIED static)

| Check | Result |
| --- | --- |
| Resend SDK | `server-only` adapter only |
| `NEXT_PUBLIC_RESEND_API_KEY` | absent |
| Client components referencing `RESEND_API_KEY` / `resend` | none found |
| Delivery modules | `import "server-only"` |

---

## 10. Typecheck (VERIFIED)

`npm run typecheck` → **PASS**

---

## 11. Lint (VERIFIED)

`npm run lint` → **PASS** (`✔ No ESLint warnings or errors`)

---

## 12. Targeted invitation/security tests (VERIFIED)

`npx vitest run tests/features/invitations tests/security`

| Metric | Result |
| --- | --- |
| Files | **49 passed** |
| Tests | **390 passed** |

---

## 13. Full Vitest (VERIFIED)

`npm run test:run`

| Metric | Result |
| --- | --- |
| Files | **294 passed** |
| Tests | **2099 passed** |

---

## 14. Production build (VERIFIED)

`npm run build` → **PASS** (includes `/settings/members`)

---

## 15. Pre-deploy production baseline (VERIFIED)

| Item | Value |
| --- | --- |
| Prior production deployment | `dpl_CRe4rhPk2gjNcMB7vh9izMnJEq96` |
| Alias | `https://zyntixai.vercel.app` |
| Rollback target | **same** (retained Ready) |

---

## 16. Controlled production deployment (DEPLOYED)

| Item | Value |
| --- | --- |
| Command | `npx vercel deploy --prod --yes --project zyntixai --scope guus-projects-ai` with metadata `gitCommitSha=c53004e8d21a9311d734e870d889b4d870859137` |
| Deployment ID | `dpl_9r6GuMKiEdSQjg5NpWzgyYvtbnAx` |
| Ready state | **READY** |
| Deployment URL | `https://zyntixai-2mntpr6pe-guus-projects-ai.vercel.app` |
| Production alias | **Aliased** `https://zyntixai.vercel.app` |
| Source | clean worktree at `c53004e…` |

---

## 17. Post-deploy gate verification

| Gate | Evidence |
| --- | --- |
| `INVITATIONS_ENABLED=false` | **VERIFIED live** — Members page shows “Invitations are in restricted rollout” / acceptance disabled copy (Acceptance OFF drives notice) |
| `INVITATION_EMAIL_DELIVERY_ENABLED=false` | **OWNER-CONFIRMED** + Production var present + fail-closed code path; agent cannot decrypt Encrypted value |

---

## 18. Production health smoke (VERIFIED)

Authenticated browser on `https://zyntixai.vercel.app/settings/members` (ZyntixAI Production QA):

| Check | Result |
| --- | --- |
| AppShell / nav | present |
| Members page | loads |
| Invite form | present |
| Active members | renders (6) |
| Pending invitations | 0 |
| Broad 500 / Resend import crash | **not observed** |
| Org context | ZyntixAI Production QA |

Unauthenticated `HEAD` to `/settings/members` → `307` → `/login` (expected).

---

## 19. Zero-send verification (VERIFIED)

| Check | Result |
| --- | --- |
| Invitation mutations this phase | **none** (read-only smoke) |
| QA org delivery-attempt rows | **0** |
| Submitted attempt rows | **0** |
| Real Resend invitation submissions | **0** |

---

## 20. CB-R1 application deployment state (DEPLOYED)

Friendly `rate_limited` mapping is now in the live production bundle (**DEPLOYED CODE VERIFIED**). Live threshold UX not re-exercised (no limiter spam).

---

## 21. CB-E1-A deployment state (DEPLOYED)

Delivery core, Resend adapter, fail-closed gate, allowlist, server-only boundary are live. **No live provider submission verified** (delivery OFF).

---

## 22. CB-E1-B deployment state (DEPLOYED)

Hardened template + acceptance URL builder are in the deployed app. **No real token/email rendered for evidence.**

---

## 23. CB-E1-C deployment state (DEPLOYED + DB compatible)

Production DB foundation (`20260814150000`) remains aligned. Deployed app includes attempt/idempotency orchestration. With delivery OFF: no false `submitted` attempts created. Provider idempotency live proof → **DEFERRED to CB-E1-E**.

---

## 24. QA allowlist state

Configured, Production-only, Encrypted, server-side. Address **not disclosed**. Send-to-allowlist **not tested**.

---

## 25. Privacy / secret verification

No API key, raw token, invitation URL, email body, or continuation secret printed in evidence. Encrypted env values not decrypted into the report.

---

## 26. Rollback / kill-switch readiness

| Control | State |
| --- | --- |
| Email kill switch | keep `INVITATION_EMAIL_DELIVERY_ENABLED=false` |
| Acceptance kill switch | keep `INVITATIONS_ENABLED=false` |
| App rollback | promote `dpl_CRe4rhPk2gjNcMB7vh9izMnJEq96` |
| Provider compromise | revoke/rotate Production `RESEND_API_KEY` |
| Domain issue | leave delivery OFF (DNS removal not first response) |

---

## 27. Real-email safety

```text
ZERO REAL INVITATION EMAILS SENT
```

CB-E1-E not started.

---

## 28. CB-E1-D closure criteria reconciliation (PASS)

| # | Criterion | Status |
| --- | --- | --- |
| 1 | Git authoritative baseline | **PASS** |
| 2 | Production Supabase migrations aligned (`20260814150000`) | **PASS** (rechecked dry-run up to date) |
| 3 | Resend sending domain verified | **PASS** |
| 4 | Required DNS verified | **PASS** |
| 5 | Production Resend API key configured server-side | **PASS** (presence) |
| 6 | Sender identity configured | **PASS** |
| 7 | QA allowlist configured | **PASS** (presence; address not disclosed) |
| 8 | Email delivery gate OFF | **PASS** (OWNER-CONFIRMED + presence + fail-closed) |
| 9 | Invitation acceptance gate OFF | **PASS** (OWNER-CONFIRMED + live UI) |
| 10 | Click tracking OFF | **PASS** (**OWNER-VERIFIED** not configured) |
| 11 | Open tracking OFF | **PASS** (**OWNER-VERIFIED** not configured) |
| 12 | Typecheck PASS | **PASS** |
| 13 | Lint PASS | **PASS** |
| 14 | Targeted tests PASS (49/390) | **PASS** |
| 15 | Full Vitest PASS (294/2099) | **PASS** |
| 16 | Production build PASS | **PASS** |
| 17 | Controlled production deployment READY | **PASS** (`dpl_9r6GuMKiEdSQjg5NpWzgyYvtbnAx`) |
| 18 | Deployed app includes CB-R1 + CB-E1-A/B/C | **PASS** |
| 19 | Production health smoke PASS | **PASS** |
| 20 | CB-E1-C DB compatibility PASS | **PASS** |
| 21 | Zero real invitation emails sent | **PASS** |
| 22 | Rollback / kill switches ready | **PASS** |

---

## 29. CB-E1-D closure status

```text
CB-E1-D CLOSED WITH EVIDENCE — RESEND INFRASTRUCTURE AND CONTROLLED PRODUCTION DEPLOYMENT READY FOR FIRST QA EMAIL
```

Narrow meaning:

- Resend infrastructure prepared;
- sending domain + DNS verified;
- production secrets/allowlist/gates prepared;
- CB-R1 + CB-E1-A/B/C application **deployed**;
- tracking OFF / not configured (**OWNER-VERIFIED**);
- delivery remains **OFF**;
- acceptance remains **OFF**;
- first QA email is the next **separately authorized** operation (CB-E1-E).

Does **not** mean: live email verified; inbox proven; provider idempotency live-proven; acceptance enabled; external users invited.

---

## 30. Remaining roadmap (DEFERRED)

1. **CB-E1-E** — Controlled Production Invitation Email Delivery Verification
2. CB-G1
3. CB-Q1
4. CB-PUB

Do **not** start these here. No delivery ON. No real email.

---

## 31. Owner decision required

```text
OWNER ROADMAP DECISION REQUIRED — CB-E1-D CLOSED; CB-E1-E NOT YET AUTHORIZED
```

---

## 32. Evidence / publication

| Item | Value |
| --- | --- |
| Evidence file | `docs/phases/Invitations-closed-beta-CB-E1-D-resend-domain-dns-secrets-controlled-deployment-readiness-evidence.md` |
| Deploy evidence commit | `9cfef1a` — `docs(invitations): close CB-E1-D controlled deployment readiness` |
| Tracking closure commit | *(filled after publication)* — `docs(invitations): finalize CB-E1-D tracking verification closure` |
| New deployment for docs closure | **NONE** |

---

## 33. Account security note

Resend MFA/team hygiene remains **OWNER-ATTESTED / not independently visible** to Cursor this session. Not treated as an open CB-E1-D blocker after tracking-off verification; continue as owner operational hygiene into CB-E1-E.

---

## 34. Final production state at CB-E1-D closure (FACT / DEPLOYED / OWNER-VERIFIED)

| Surface | State |
| --- | --- |
| Production application | CB-R1 + CB-E1-A/B/C deployed (`dpl_9r6GuMKiEdSQjg5NpWzgyYvtbnAx`) |
| Production DB | CB-R1 + CB-E1-C foundations active through `20260814150000` |
| Resend domain | `invites.zyntixai.com` verified |
| Tracking | click/open **OFF / not configured** |
| Delivery gate | **OFF** |
| Acceptance gate | **OFF** |
| Real emails under CB-E1-D | **ZERO** |
| External beta users | **NONE** authorized through this phase |
