# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-E1-D — Resend Provider / Domain / DNS / Secrets + Controlled Deployment Readiness

### CB-E1-D DEPLOYMENT PASS — OWNER ACTION REQUIRED BEFORE CLOSURE — CONFIRM RESEND CLICK TRACKING OFF

| Field | Value |
| --- | --- |
| Official scope | **CB-E1-D — Resend Provider / Domain / DNS / Secrets + Controlled Deployment Readiness** |
| Document type | Controlled production deployment continuation + readiness evidence |
| Official phase number | **NONE ASSIGNED** |
| Date | 2026-08-14 |
| Formal status | `CB-E1-D DEPLOYMENT PASS` — full closure blocked on Resend click-tracking confirmation |
| Initial owner authorization | `OWNER APPROVED — AUTHORIZE CB-E1-D RESEND PROVIDER / DOMAIN / DNS / SECRETS + CONTROLLED DEPLOYMENT READINESS` |
| Continuation authorization | `OWNER APPROVED — RE-AUTHORIZE CB-E1-D CONTROLLED DEPLOY CONTINUATION WITH EMAIL DELIVERY OFF AND INVITATION ACCEPTANCE OFF` |
| Continuation starting HEAD | `c53004e8d21a9311d734e870d889b4d870859137` |
| Branch | `core/platform-readiness-20260707` |
| Production deployment | `dpl_9r6GuMKiEdSQjg5NpWzgyYvtbnAx` (**READY**) |
| Rollback target | `dpl_CRe4rhPk2gjNcMB7vh9izMnJEq96` |
| Production alias | `https://zyntixai.vercel.app` |
| Deployed from Git HEAD | `c53004e8d21a9311d734e870d889b4d870859137` (clean worktree upload) |
| Real email | **ZERO SENT** |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | **OWNER-CONFIRMED `false`** + Production var present |
| `INVITATIONS_ENABLED` | **OWNER-CONFIRMED `false`** + Production var present + live UI restricted-rollout notice |

```text
CB-E1-D DEPLOYMENT PASS
RESEND DOMAIN/DNS/SECRETS/APP DEPLOYED WITH GATES OFF
CLICK TRACKING: MANUAL OWNER CONFIRMATION STILL REQUIRED BEFORE CB-E1-E
REAL EMAIL: NOT SENT
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

## 5. Resend tracking state

| Item | Status |
| --- | --- |
| Click tracking | **MANUAL OWNER ACTION REQUIRED — CONFIRM RESEND CLICK TRACKING OFF** |
| Open tracking | preferred OFF; same manual confirmation |
| Agent Resend dashboard access | not available this session |
| Blocks full CB-E1-D closure for CB-E1-E? | **YES** |
| Blocks deploy while delivery OFF? | **NO** (deploy completed with delivery OFF) |

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

## 28. CB-E1-D closure status

```text
CB-E1-D DEPLOYMENT PASS — OWNER ACTION REQUIRED BEFORE CLOSURE — CONFIRM RESEND CLICK TRACKING OFF
```

Meaning:

- Resend domain/DNS public records verified;
- Production secrets/allowlist/gates present (values owner-confirmed for gates);
- Application CB-R1 + CB-E1-A/B/C **deployed** with delivery/acceptance OFF;
- Full “ready for first QA email” closure still requires **click tracking OFF** confirmation in Resend (and preferably open tracking OFF + MFA attestation).

---

## 29. Remaining roadmap (DEFERRED)

1. Owner confirms Resend click tracking OFF → then CB-E1-D can be fully closed
2. **CB-E1-E** — Controlled Production Invitation Email Delivery Verification
3. CB-G1 → CB-Q1 → CB-PUB

---

## 30. Owner decision required

```text
OWNER ACTION REQUIRED — CONFIRM RESEND CLICK TRACKING OFF (AND PREFER OPEN TRACKING OFF) BEFORE AUTHORIZING CB-E1-E
```

Optional attestation: Resend account MFA enabled.

Do **not** enable delivery or send email until CB-E1-E is separately authorized.

---

## 31. Evidence / publication

| Item | Value |
| --- | --- |
| Evidence file | `docs/phases/Invitations-closed-beta-CB-E1-D-resend-domain-dns-secrets-controlled-deployment-readiness-evidence.md` |
| Preferred commit | `docs(invitations): close CB-E1-D controlled deployment readiness` |

*(Hash filled after publication.)*

---

## 32. Account security note

Resend MFA/team hygiene: **MANUAL OWNER ACTION REQUIRED / OWNER-ATTESTED** — not independently visible to Cursor this session.
