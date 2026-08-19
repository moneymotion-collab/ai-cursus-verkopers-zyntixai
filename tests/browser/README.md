# Authenticated Production browser QA

## Authoritative architecture (B1-C1-R1)

| Layer | Tool |
| --- | --- |
| Unit / composition / role / tenant | Vitest |
| Authenticated Production desktop/mobile/tablet | Playwright (`@playwright/test`) |
| Historical evidence browsers | Cursor IDE browser (manual/agent) |

Playwright is a **QA harness only** (devDependency). It is not an application runtime dependency.

## Security

- Auth storage: `playwright/.auth/production-owner.json` (**gitignored**)
- Never commit cookies, tokens, passwords, or storage state
- Never paste credentials into Cursor chat
- Production B1-C1 tests are **read-only**

## One-time Owner bootstrap

```bash
npm run browser:auth:bootstrap
```

1. Chromium opens Production login.
2. Sign in as Owner in that window (not in chat).
3. Wait until `/home?org=<control-org>` shows **Today**.
4. Script writes gitignored storage state and exits.

## Run B1-C1 Production browser suite

```bash
npm run test:browser:b1-c1
```

Without auth state, specs skip with:

`OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP`

## Environment overrides (optional)

| Variable | Default |
| --- | --- |
| `BROWSER_QA_BASE_URL` | `https://www.zyntixai.com` |
| `BROWSER_QA_ORG_ID` | control org `2fc07699-…` |

## Evidence classes

Keep separate in phase evidence:

1. **AUTOMATED AUTHENTICATED PRODUCTION QA** (Playwright + storage state)
2. **FIXTURE / TEST ENVIRONMENT QA** (Vitest)
3. **HUMAN UX OBSERVATION** (visual polish)
