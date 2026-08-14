# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-E1-B — Invitation Email Template + Secure Acceptance URL Construction

### CB-E1-B CLOSED WITH EVIDENCE — INVITATION EMAIL TEMPLATE AND SECURE ACCEPTANCE URL READY

| Field | Value |
| --- | --- |
| Official scope | **CB-E1-B — Invitation Email Template + Secure Acceptance URL Construction** |
| Document type | Implementation + local verification evidence |
| Official phase number | **NONE ASSIGNED** — unnumbered closed-beta readiness slice |
| Date | 2026-08-14 |
| Formal status | `CB-E1-B CLOSED WITH EVIDENCE` — production delivery **not** activated |
| Owner authorization | `OWNER APPROVED — AUTHORIZE CB-E1-B INVITATION EMAIL TEMPLATE + SECURE ACCEPTANCE URL CONSTRUCTION IMPLEMENTATION` |
| Prior CB-E1-A | `docs/phases/Invitations-closed-beta-CB-E1-A-delivery-core-resend-adapter-evidence.md` |
| Starting HEAD | `8e504751d6cd4793f15c4f5686c61de20435db7e` |
| Branch | `core/platform-readiness-20260707` |
| Real email | **NOT SENT** |
| Production deploy | **NOT PERFORMED** |
| `INVITATIONS_ENABLED` | Remains **OFF** |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | Remains fail-closed / not activated |

```text
CB-E1-B — EMAIL TEMPLATE + SECURE ACCEPTANCE URL
IMPLEMENTATION CLOSED (LOCAL)
REAL EMAIL / DNS / PROD SECRETS / DELIVERY ON: NOT STARTED
```

---

## 1. Owner authorization (FACT)

**OWNER APPROVED — AUTHORIZE CB-E1-B INVITATION EMAIL TEMPLATE + SECURE ACCEPTANCE URL CONSTRUCTION IMPLEMENTATION**

Authorized: transactional email content contract; secure acceptance URL construction; trusted origin; HTML/text; escaping; CTA; expiry/role presentation; a11y basics; tracking-safe options where enforceable; tests; evidence; commit/push.

**Not** authorized: real sends; live Resend; DNS; production env; delivery/acceptance activation; CB-E1-C/D/E; CB-G1; unrelated UI.

---

## 2. Verified starting Git baseline (FACT / VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `8e504751d6cd4793f15c4f5686c61de20435db7e` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

---

## 3. Inherited CB-E1-A architecture (FACT)

Provider-neutral delivery under `src/features/invitations/server/delivery/` with Resend adapter, fail-closed gates, allowlist, trusted raw-token orchestration after create/resend, CB-R1 preserved, no DB migration.

---

## 4. Existing template / URL state before CB-E1-B (FACT)

CB-E1-A already included:

* `buildInvitationAcceptanceUrl` via `resolveSiteOrigin` + `/invite/accept/exchange?token=`
* `buildMinimalInvitationEmailContent` — minimal escaped HTML/text (explicitly deferred polish to E1-B)

---

## 5. Implemented email template architecture (IMPLEMENTED)

New module: `invitation-email-template.ts`

| Piece | Behavior |
| --- | --- |
| Subject | `You're invited to join {organizationName} on ZyntixAI` (newline-sanitized) |
| Preheader | Hidden preview text; no token |
| HTML | Brand, heading, org (+ optional role), CTA button link, URL fallback, expiry, ignore copy |
| Text | Same meaning; single acceptance URL occurrence; no HTML tags |
| Renderer | Simple escaped string builder — **no React Email** |
| Failure | Invalid URL/org → `delivery_configuration_error` (no provider call) |

`deliverInvitation` now consumes `buildInvitationEmailContent` (replaces minimal builder).

---

## 6. Secure acceptance URL construction (IMPLEMENTED / VERIFIED)

| Property | Value |
| --- | --- |
| Origin | `resolveSiteOrigin(env)` |
| Origin validation | http(s) only; no credentials/path/query/hash |
| Path | `/invite/accept/exchange` |
| Query | only `token` |
| Token | must match `^[0-9a-f]{64}$` |
| Encoding | `URLSearchParams` |
| Rejects | malformed token; untrusted origin; extra params |

`isTrustedInvitationAcceptanceUrl` re-validates before render.

---

## 7. Raw-token security (VERIFIED)

- Transient server-only; appears only in CTA URL / plain-text link inside provider payload
- Absent from action results, metadata/tags/headers, logs
- Synthetic tokens only in tests

---

## 8. Dynamic content escaping (VERIFIED)

HTML escapes: `& < > " '` for org, role labels, URL, expiry, preheader.

Subject fragment strips CR/LF/NUL.

Malicious org name `<script>alert(1)</script>` rendered escaped — **VERIFIED**.

---

## 9. Role / organization / expiry (IMPLEMENTED)

| Field | Behavior |
| --- | --- |
| Organization | Trusted server re-read name (E1-A); escaped in HTML |
| Role | Display-only Admin/Staff/Viewer from authoritative enum; omitted if unknown |
| Inviter | Not included (no new data dependency) |
| Expiry | From `expires_at` via `en-GB` UTC date label |

---

## 10. Email content contract (IMPLEMENTED)

- Subject: transactional invite to org on ZyntixAI
- CTA: `Accept invitation` → trusted exchange URL
- Expiry: `This invitation expires on {date} (UTC).` or may-expire fallback
- Ignore: `If you weren't expecting this invitation, you can ignore this email.`
- HTML/text parity for core meaning

---

## 11. Link-scanner / referrer security (FACT / VERIFIED)

Exchange route unchanged:

- GET does **not** accept membership
- When `INVITATIONS_ENABLED` OFF: redirect only, no seal
- `Referrer-Policy: no-referrer`
- `Cache-Control: no-store, private`

CB-E1-B did not modify the exchange route.

---

## 12. Provider tracking boundary (FACT / DEFERRED)

Code does not enable click/open tracking fields on `emails.send`.

Per-message tracking disable is **not** available in current Resend send API usage → account/domain tracking disable remains **CB-E1-D**.

Adapter payload limited to: from, to, subject, html, text (+ optional idempotency).

---

## 13–14. Create / resend integration (IMPLEMENTED)

Unchanged orchestration order from E1-A; template/URL hardening sits after eligibility and before provider. Template failure leaves invitation pending; resend does not roll back rotation.

---

## 15. Provider-call suppression (VERIFIED)

Zero provider calls for: disabled gate, allowlist miss, malformed token, untrusted acceptance URL, rate-limited/unauthorized paths (existing orchestration tests).

---

## 16. Client-boundary verification (VERIFIED)

Action results exclude `rawToken`, acceptance URL path, and email bodies.

---

## 17. Database impact

**none**

---

## 18. Dependency impact

**none** (no new packages)

---

## 19. Automated tests (VERIFIED)

| File | Notes |
| --- | --- |
| `tests/features/invitations/invitation-email-template.test.ts` | **new** (7) |
| `tests/features/invitations/invitation-email-delivery.test.ts` | expanded URL/payload/origin cases (16) |
| `tests/features/invitations/invitation-delivery-orchestration.test.ts` | client URL leak assertion |

Targeted invitation + security: **309 passed** (34 files).  
Full Vitest: **2089 passed** (292 files).

---

## 20. Static verification (VERIFIED)

| Check | Result |
| --- | --- |
| typecheck | pass |
| lint | pass |
| targeted | 309/309 |
| full | 2089/2089 |

---

## 21. Real-email safety (FACT)

No real email; no live Resend; no real key; no DNS; no production env changes.

---

## 22. Scope confirmation (FACT)

Did not start CB-E1-C/D/E; did not activate delivery or acceptance; did not deploy; no unrelated UI redesign.

---

## 23. Evidence path

`docs/phases/Invitations-closed-beta-CB-E1-B-email-template-secure-acceptance-url-evidence.md`

---

## 24. Recommended next slice (INFERENCE)

`CB-E1-C — DELIVERY OBSERVABILITY + IDEMPOTENCY + FAILURE UX`

Do not start without owner authorization.

---

## 25. Owner decision required

`OWNER ROADMAP DECISION REQUIRED — CB-E1-B CLOSED; CB-E1-C NOT YET AUTHORIZED`

---

## Evidence language

FACT / IMPLEMENTED / VERIFIED / INFERENCE / DEFERRED / BLOCKED as labeled above.

**INFERENCE:** Mocked provider payloads do not prove production mailbox delivery.

---

## End of CB-E1-B evidence
