# ZYNTIXAI — Invitations Closed-Beta Readiness

## CB-E1-A — Delivery Core + Resend Adapter + Env/Gates

### CB-E1-A CLOSED WITH EVIDENCE — DELIVERY CORE, RESEND ADAPTER, AND FAIL-CLOSED DELIVERY GATES READY

| Field | Value |
| --- | --- |
| Official scope | **CB-E1-A — Delivery Core + Resend Adapter + Env/Gates** |
| Document type | Implementation + local verification evidence |
| Official phase number | **NONE ASSIGNED** — unnumbered closed-beta readiness slice (no B1.x invented) |
| Date | 2026-08-14 |
| Formal status | `CB-E1-A CLOSED WITH EVIDENCE` — production delivery **not** activated |
| Owner authorization | `OWNER APPROVED — APPROVE RESEND FOR CB-E1 AND AUTHORIZE CB-E1-A (DELIVERY CORE + RESEND ADAPTER + ENV/GATES) IMPLEMENTATION` |
| Provider decision | **Resend** (owner-approved for CB-E1) |
| Closed-beta ready | **NO** (real email, DNS, secrets, acceptance gate remain) |
| General-launch ready | **NO** |
| Prior CB-R1 closure | `docs/phases/Invitations-closed-beta-CB-R1-production-verification-closure-evidence.md` |
| Prior CB-E1 preflight | Preflight PASS — provider/roadmap ready for owner review |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `ec26aeba7d94a5a8bee196dc62fa80b5c5abf9df` |
| Course Sellers Beta 1 | Remains **CLOSED AND PUBLISHED** — not reopened |
| Production mutation / deploy | **NOT AUTHORIZED / NOT PERFORMED** |
| Real email | **NOT SENT** |

```text
CB-E1-A — DELIVERY CORE + RESEND ADAPTER + ENV/GATES
IMPLEMENTATION CLOSED (LOCAL)
REAL EMAIL / DNS / PROD SECRETS / DELIVERY ON: NOT STARTED
INVITATIONS_ENABLED: REMAINS OFF
```

---

## 1. Owner authorization (FACT)

Owner authorized exactly:

**OWNER APPROVED — APPROVE RESEND FOR CB-E1 AND AUTHORIZE CB-E1-A (DELIVERY CORE + RESEND ADAPTER + ENV/GATES) IMPLEMENTATION**

Authorized: provider-neutral delivery contracts; Resend server adapter; secure raw-token handoff; fail-closed delivery gate; recipient allowlist; env/config validation; create/resend orchestration to delivery abstraction; mock/test delivery; security/error normalization; automated verification; evidence; commit/publication per governance.

**Not** authorized: production email sending; DNS; sender-domain verification; Resend account configuration; production API-key creation; Vercel production secret changes; production delivery activation; `INVITATIONS_ENABLED=true`; invitation acceptance rollout; external beta invitations; CB-E1-B template polish beyond minimum interface; CB-E1-C observability/idempotency persistence beyond architecture hooks; CB-E1-D/E ops/controlled sends; CB-G1; CB-Q1; CB-PUB; reopening CB-R1; unrelated Member Admin / product work.

---

## 2. Verified starting Git baseline (FACT / VERIFIED)

| Check | Result |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `ec26aeba7d94a5a8bee196dc62fa80b5c5abf9df` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

Baseline matched authorization. Implementation proceeded.

---

## 3. Architecture before CB-E1-A (FACT)

Create path:

`InviteMemberForm` → `createInvitationAction` → `createOrganizationInvitation` → `public.create_organization_invitation` → mapper **discarded** `raw_token` (`void row.raw_token`).

Resend path:

`PendingInvitationActions` → `resendInvitationAction` → `resendOrganizationInvitation` → `public.resend_organization_invitation` → mapper **discarded** `raw_token`.

No application transactional email stack existed. `INVITATIONS_ENABLED` remained OFF (acceptance). CB-R1 rate limits active in production DB/RPC (create 10/3600 org+actor; resend 3/3600 org+actor+invitation).

---

## 4. Implemented delivery architecture (IMPLEMENTED)

### Provider-neutral contract

`src/features/invitations/server/delivery/`

| Module | Role |
| --- | --- |
| `config.ts` | Fail-closed gate, allowlist parse, runtime config |
| `types.ts` | `DeliverInvitationInput` / `DeliverInvitationResult` / injectable provider |
| `acceptance-url.ts` | Trusted URL via `resolveSiteOrigin` + `/invite/accept/exchange?token=` |
| `deliver-invitation.ts` | `deliverInvitation(...)` + minimal body (CB-E1-B owns polish) |
| `orchestrate-invitation-delivery.ts` | Post-mutation orchestration; gates before provider |
| `resend-adapter.ts` | Official `resend` SDK adapter |
| `load-organization-display-name.ts` | Trusted org `name` re-read (not client payload) |

### Orchestration order (create/resend)

1. Authenticate + trusted org context + permission checks  
2. Invitation RPC (CB-R1 inside RPC)  
3. On success only: hold `rawToken` transiently → `orchestrateInvitationDelivery`  
4. Gate / allowlist / config → build acceptance URL → provider abstraction  
5. Discard token from action return via public mapper  
6. Truthful split result (DB success vs delivery outcome)

Rate-limited / unauthorized / invalid mutations: **zero provider calls** (orchestration never reached).

### Delivery ≠ invitation lifecycle

No `email_failed` / `sent` / `delivered` invitation statuses. Invitation remains `pending` when delivery is disabled/blocked/fails.

---

## 5. Raw-token security model (IMPLEMENTED / VERIFIED)

| Rule | Status |
| --- | --- |
| Exists only in trusted server success mapping (`rawToken`) | IMPLEMENTED |
| Shape-gated (`^[0-9a-f]{64}$`) via `domain/raw-token-shape.ts` | IMPLEMENTED |
| Used to build acceptance URL then not returned on action results | IMPLEMENTED |
| Absent from `CreateInvitationActionResult` / `ResendInvitationActionResult` | VERIFIED (tests + boundary scans) |
| Not logged; orchestration comments forbid URL/token logging | IMPLEMENTED |
| Not persisted in delivery tables (no migration) | FACT |
| Client components never receive `rawToken` | VERIFIED |

Trusted vs public separation:

- `CreateInvitationTrustedAdapterResult` / `ResendInvitationTrustedAdapterResult` may carry `rawToken`
- `toPublic*AdapterResult` strips before client-facing mapping

---

## 6. Resend provider integration (IMPLEMENTED)

| Item | Value |
| --- | --- |
| Package | `resend@^6.20.0` (+ `server-only@^0.0.1`) |
| Integration | Server-only adapter `createResendInvitationEmailProvider` |
| Network in tests | **None** — injectable `InvitationEmailProvider` mock |
| Live API | **Not called** during CB-E1-A |
| Click/open tracking | Resend SDK `emails.send` has **no per-send tracking disable** in this integration; domain/account tracking disable is **DEFERRED to CB-E1-D** as provider configuration requirement. Code does not claim tracking is enforced. |

---

## 7. Environment contract (IMPLEMENTED)

| Variable | Behavior |
| --- | --- |
| `RESEND_API_KEY` | Server-only; required only when delivery ON |
| `INVITATION_EMAIL_FROM` | Server-only; required only when delivery ON |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | Fail-closed; only exact normalized `true` enables |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | Comma-separated; empty/missing fails closed when delivery ON |

Documented in `.env.example` with safe defaults (`INVITATION_EMAIL_DELIVERY_ENABLED=false`). No secrets committed.

Delivery OFF: missing Resend vars do **not** break app startup.

---

## 8. Feature-gate behavior (IMPLEMENTED / VERIFIED)

| Gate | Value in CB-E1-A |
| --- | --- |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | Defaults OFF; exact `true` required |
| `INVITATIONS_ENABLED` | **Untouched**; remains OFF (acceptance) |
| Allowlist | Server-side case/whitespace normalized; no wildcards |

---

## 9. Create orchestration (IMPLEMENTED / VERIFIED)

| Case | Behavior |
| --- | --- |
| Mutation success + delivery OFF | Invitation pending; `delivery: "disabled"`; message “Invitation created. It is pending.” |
| Mutation success + eligible mock submit | `delivery: "submitted"`; still no “email sent” claim |
| Mutation success + provider/config/allowlist fail | Invitation remains; `success_delivery_unavailable` message |
| `rate_limited` | No delivery orchestration |
| Staff/Viewer/forbidden | No RPC / no delivery |

---

## 10. Resend orchestration (IMPLEMENTED / VERIFIED)

| Case | Behavior |
| --- | --- |
| Success | New generation credential passed to orchestration once |
| Delivery failure | No DB rollback; no automatic second resend RPC; truthful message notes previous link invalid |
| `rate_limited` | Zero delivery calls |

---

## 11. Error/result contract (IMPLEMENTED)

Delivery kinds:

- `submitted`
- `delivery_disabled`
- `delivery_recipient_not_allowed`
- `delivery_configuration_error`
- `delivery_provider_error`

Client UI status: `submitted` | `disabled` | `recipient_not_allowed` | `configuration_error` | `provider_error`

CB-R1 `rate_limited` mapping preserved.

---

## 12. Authorization / tenant-isolation regression (VERIFIED)

Existing action/security matrix tests remain green. Delivery only after successful mutation. Staff/Viewer/cross-tenant denials still short-circuit before RPC/delivery.

---

## 13. Provider-call suppression evidence (VERIFIED)

Automated coverage proves provider/orchestration not invoked for:

- delivery disabled
- non-allowlisted recipient
- invalid/missing config while ON
- rate-limited create/resend
- Staff forbidden create
- orchestration disabled before org-name load

---

## 14. Real-email safety (FACT / VERIFIED)

- No real email sent
- No live Resend API called
- No production/provider credentials used
- `npm test` / Vitest require no Resend network

---

## 15. Database impact (FACT)

**none** — no migration in CB-E1-A.

CB-R1 migration remains as previously closed; not reopened.

---

## 16. Dependency changes (IMPLEMENTED)

| Package | Change |
| --- | --- |
| `resend` | added `^6.20.0` |
| `server-only` | added `^0.0.1` |
| lockfile | updated for those packages only (no Next/React/Supabase upgrades) |

Vitest aliases `server-only` → `tests/shims/server-only.ts` so Node tests can import server modules.

---

## 17. Automated test evidence (VERIFIED)

New:

- `tests/features/invitations/invitation-email-delivery.test.ts` (11)
- `tests/features/invitations/invitation-delivery-orchestration.test.ts` (7)

Updated create/resend/manage/security-matrix tests for trusted token + `delivery` field.

Targeted invitation + invitation security: **297 passed** (33 files).

Full Vitest: **2077 passed** (291 files).

---

## 18. Static / regression verification (VERIFIED)

| Check | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass (0 warnings/errors) |
| Targeted invitation suites | 297/297 |
| Full Vitest | 2077/2077 |

---

## 19. Scope confirmation (FACT)

CB-E1-A did **not**:

- send production/real mail
- create Resend account / API keys
- alter DNS / SPF / DKIM / DMARC
- add Vercel production secrets
- enable `INVITATIONS_ENABLED`
- deploy / promote production
- start CB-E1-B/C/D/E or CB-G1
- reopen CB-R1

---

## 20. Implementation evidence (FACT)

This document:

`docs/phases/Invitations-closed-beta-CB-E1-A-delivery-core-resend-adapter-evidence.md`

---

## 21. Production/deployment impact (DEFERRED)

Before real send (later slices), owner/ops still need:

- Resend account
- verified sender/domain + DNS
- API key in server-only env
- `INVITATION_EMAIL_FROM`
- non-empty allowlist for controlled QA
- controlled deployment of app code
- explicit `INVITATION_EMAIL_DELIVERY_ENABLED=true`
- CB-E1-D/E controlled verification

Acceptance still requires separate `INVITATIONS_ENABLED` decision (CB-G1).

---

## 22. Recommended next slice (INFERENCE)

**CB-E1-B — Invitation Email Template + Secure Acceptance URL Construction**

E1-A already includes a minimal trusted URL builder and minimal HTML/text body sufficient for the delivery interface. Remaining CB-E1-B work should polish template copy/layout and finalize URL/template ownership without expanding delivery gates.

Do **not** start without owner authorization.

---

## 23. Owner decision required

`OWNER ROADMAP DECISION REQUIRED — CB-E1-A CLOSED; NEXT CB-E1 SLICE NOT YET AUTHORIZED`

Do not request production sending yet.

---

## 24. Commits / publication

Recorded after commit/push in final report section of the closing chat response.

---

## 25. Evidence language legend

| Label | Meaning |
| --- | --- |
| FACT | Proven before / outside this slice |
| IMPLEMENTED | Changed in CB-E1-A |
| VERIFIED | Actually tested locally |
| INFERENCE | Reasoned recommendation |
| DEFERRED | Intentionally later |
| BLOCKED | Cannot safely continue |

**INFERENCE:** Mocked provider success does **not** prove live Resend delivery.

---

## End of CB-E1-A evidence
