# ENG-ONB-1H-PROD — Production Onboarding Verification

## Executive verdict (current parked status, 2026-09-13)

`BLOCKED — ENG-ONB-1H-PROD`

`PAUSED — DESIGNATED TESTER TEMPORARILY UNAVAILABLE`

This is **not** a technical Production defect and **not** final verification. The required manual QA A-login has **not** been executed. `ENG-ONB-1H-PROD` is therefore **BLOCKED/PAUSED**. Do not write `PASS`, `CLOSED`, `RELEASE READY`, or `PRODUCTION VERIFIED` for this gate.

Canonical Production still serves the required candidate (`dpl_7QKLdfvSYboEehBCr79pwYnaVmoF`, Git SHA `427e3b5d35b744959eb83c8b68f2dff196f68802`). The Production database still has all 13 governed migrations and the required onboarding objects.

A 2026-09-12 authenticated rerun against a **legacy-completed** Production QA Owner is **VERIFIED HISTORICAL** only. That rerun used an existing Playwright session. It is **not** the open manual QA A-login and **not** proof that the V2 onboarding flow completed.

`PARTIAL — LEGACY QA PLAYWRIGHT SESSION, 2026-09-12`

`MANUAL QA A LOGIN = OPEN`

Live Product behaviour observed on 2026-09-12 for that legacy-completed tenant matches the published compatibility contract: product-shell admission succeeds, onboarding routes do not return the Owner to an earlier V2 step, foreign org query strings do not mint another tenant, and course-seller module gating holds. Those results remain historical, limited sub-results.

A factual `PASS — ENG-ONB-1H-PROD` remains forbidden. Production contains **zero** `onboarding_flow_version = 2` organizations. There is therefore no governed incomplete V2 QA state and no `v2_completed` Ready tenant on which to live-prove:

- authenticated incomplete onboarding gate / product-shell denial;
- V2 Ready reconstruction with **Open ZyntixAI**;
- the mandatory P1-D separation of completion versus explicit product entry.

Those gaps are QA-state availability plus an unexecuted manual QA A-login and an unresumed governed single-V2-fixture flow. They are not a contradiction of the live legacy-completed path. They still block PROD PASS because the phase standard forbids “PASS with assumptions”.

A separate 2026-09-13 mail gate is recorded below: custom SMTP via Resend on `auth.zyntixai.com` works in Production, and a password-recovery e-mail was received and used. That is `PASS — SMTP/RECOVERY ONLY`. It does **not** complete onboarding, provisioning, or `ENG-ONB-1H-PROD`. No e-mail address, recovery link, token, cookie, or password is recorded here.

This file did not deploy, redeploy, migrate, mutate Production rows, or start `ENG-ONB-1H-FV`.

`ENG-ONB-1H-FV STARTED = NO`

---

## Evidence chronology (do not rewrite A–D; E is current)

| Stage | When | Result |
| --- | --- | --- |
| **A. First PROD run** | 2026-09-12, before migrate/deploy | `BLOCKED` because canonical Production served `e7db52c` / `dpl_987D3AXjtukGydaSk9z5HCMHrgH7`. That finding was correct at the time. **VERIFIED HISTORICAL**. |
| **B. Migration phase** | `ENG-ONB-1H-PROD-MIGRATE` | `PASS` — 13 governed Production migrations applied. Tip `20260912144059 complete_onboarding_requires_current_ready_authority`. The local pre-migrate backup was not modified. **VERIFIED HISTORICAL**. |
| **C. Deployment phase** | `ENG-ONB-1H-PROD-DEPLOY` | `PASS` — candidate `427e3b5d` promoted as `dpl_7QKLdfvSYboEehBCr79pwYnaVmoF`. **VERIFIED HISTORICAL**. |
| **D. Authenticated PROD rerun** | 2026-09-12 | Deployment and DB contract reconfirmed. Authenticated **legacy-completed** QA behaviour verified live via Playwright session. **PARTIAL**. This is **not** manual QA A and **not** V2-fixture proof. **PROD remained BLOCKED** because no governed V2 incomplete / `v2_completed` Ready QA state exists. **VERIFIED HISTORICAL**. |
| **E. Parked Production status** | 2026-09-13 | `PASS — SMTP/RECOVERY ONLY`. `MANUAL QA A LOGIN = OPEN`. Governed single-V2-fixture provisioning `NOT STARTED/PAUSED`. QA B `OUT OF SCOPE` / `UNPROVISIONED`. Overall `ENG-ONB-1H-PROD` `BLOCKED/PAUSED`. `ENG-ONB-1H-FV` `NOT STARTED`. Designated tester temporarily unavailable. |

The old BLOCKED record in **A** is retained below. Later stages resolved the **deployment** blocker. They did not make Production “always passing”. Stage **E** does not close the onboarding gate.

---

## Evidence classes used in the current parked record (E) and historical rerun (D)

| Class | Meaning |
| --- | --- |
| A. Reused prior/local evidence | Published P1-D implementation, tests, and evidence at HEAD |
| B. Live Production evidence | Vercel inspect/API, read-only DB catalog, public HTTP, authenticated legacy QA HTTP (2026-09-12); SMTP/password-recovery mail delivery (2026-09-13) |
| C. Not safely/live verifiable here | Manual QA A-login, V2 incomplete gate, V2 Ready / Open ZyntixAI, governed single-V2-fixture provisioning, invitation mutation, error-boundary fault injection, TG2–TG4 live orgs, QA B |
| D. Blockers | No governed V2 QA states in Production; manual QA A-login OPEN; V2-fixture NOT STARTED/PAUSED; designated tester unavailable |
| E. Final verdict | `BLOCKED — ENG-ONB-1H-PROD` / `PAUSED — DESIGNATED TESTER TEMPORARILY UNAVAILABLE` |

Do not read any C-class row as “verified in Production”.
Do not read SMTP/recovery PASS as onboarding PASS.
Do not read the 2026-09-12 legacy Playwright session as QA A or V2-fixture evidence.

---

# D. Authenticated Production rerun (2026-09-12 — VERIFIED HISTORICAL)

All LIVE / PASS rows in this section are **VERIFIED HISTORICAL** sub-results of a legacy-completed Playwright session on 2026-09-12. They do **not** replace `MANUAL QA A LOGIN = OPEN` and do **not** prove V2 onboarding or fixture provisioning.

## D1. Repository preflight

| Check | Result |
| --- | --- |
| Root | `[WORKTREE-PATH-REDACTED]` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| `git fetch origin` | performed |
| `git rev-parse HEAD` | `427e3b5d35b744959eb83c8b68f2dff196f68802` |
| `git rev-parse origin/core/platform-readiness-20260707` | `427e3b5d35b744959eb83c8b68f2dff196f68802` |
| Divergence | `0 0` |
| Worktree besides this evidence file | clean |
| Known extra path | this file only (`docs/phases/ENG-ONB-1H-PROD-production-onboarding-verification-evidence.md`) |
| HEAD subject | `docs(onboarding): finalize P1-D publication evidence` |

`BLOCKED — PRODUCTION VERIFICATION PREFLIGHT FAILED` does not apply.

---

## D2. Canonical Production identity (reverified before authenticated tests)

| Field | Value |
| --- | --- |
| Canonical app | `https://www.zyntixai.com` |
| Inspection | read-only `vercel inspect https://www.zyntixai.com` and `vercel api /v13/deployments/dpl_7QKLdfvSYboEehBCr79pwYnaVmoF` |
| Deployment id | `dpl_7QKLdfvSYboEehBCr79pwYnaVmoF` |
| Deployment URL | `[VERCEL-PREVIEW-URL-REDACTED]` — non-canonical preview host omitted; use deployment id above |
| Target | `production` |
| Ready state | Vercel `readyState=READY` (`readySubstate` `PROMOTED`) — **not** a product-verification PASS |
| Created | `2026-09-12T14:52:44+02:00` |
| `meta.gitCommitSha` | `427e3b5d35b744959eb83c8b68f2dff196f68802` |
| `meta.gitCommitMessage` | `docs(onboarding): finalize P1-D publication evidence` |
| `meta.p1dAncestor` | `2c4befa73f5b71b2b2a63732ca3885c7e356479c` |
| Aliases | `www.zyntixai.com`, `zyntixai.com`, `zyntixai.vercel.app` |
| Deploy / env mutation this phase | none |

`BLOCKED — PRODUCTION DEPLOYMENT CHANGED BEFORE VERIFICATION` does not apply.

---

## D3. Production database contract (read-only)

| Field | Value |
| --- | --- |
| Project | `[PRODUCTION-PROJECT-REDACTED]` |
| Region | `eu-central-1` |
| Health | `ACTIVE_HEALTHY` |
| Migration tip | `20260912144059 complete_onboarding_requires_current_ready_authority` |
| Governed 13 present | **13 / 13** |

Governed names confirmed present:

1. `20260912143104 seed_capability_registry_4tg_cap2`
2. `20260912143158 seed_context_pack_registry_4tg_ctx2`
3. `20260912143241 add_operating_model_context_onboarding`
4. `20260912143451 shared_projects_foundation`
5. `20260912143842 tg2_agency_slice`
6. `20260912143938 tg3_field_slice`
7. `20260912143952 tg4_product_slice`
8. `20260912144004 add_versioned_onboarding_state`
9. `20260912144016 onboarding_v2_transition_authority`
10. `20260912144028 create_onboarding_team_invite_intent_authority`
11. `20260912144039 onboarding_completion_authority`
12. `20260912144048 reconcile_stale_onboarding_invitation_proof`
13. `20260912144059 complete_onboarding_requires_current_ready_authority`

Critical objects confirmed present: `projects`, `sites`, `products`, `organization_onboarding_completion_runs`, `organization_onboarding_team_invite_intents`, `organization_onboarding_invitation_results`, `assign_organization_operating_model`, `complete_organization_v2_onboarding`, `organizations.onboarding_flow_version`, `organizations.onboarding_setup_ready_at`.

No SQL mutation. `BLOCKED — PRODUCTION DATABASE CONTRACT CHANGED` does not apply.

---

## D4. Contract matrix derived from current published code

Authorities: `enforce-product-onboarding.ts`, `onboarding-lifecycle.ts`, `onboarding-routes.ts`, `src/app/onboarding/ready/page.tsx`, `onboarding-ready.tsx`, `load-product-module-access.ts`, `resolveSelectedOrganization`, product-admission / product-shell / security tests.

| ID | STATE | ENTRY ROUTE | EXPECTED RESULT | AUTHORITY | LIVE PROBE |
| --- | --- | --- | --- | --- | --- |
| P1 | Anonymous | `/` | Redirect toward login | middleware / landing | **VERIFIED HISTORICAL** — 307 `/login` |
| P2 | Anonymous | `/home` | Login with `next=/home` | auth boundary | **VERIFIED HISTORICAL** — 307 `/login?next=%2Fhome`; follow 200 login |
| P3 | Anonymous | `/onboarding` | Login | auth boundary | **VERIFIED HISTORICAL** — 307 `/login?next=%2Fonboarding` |
| P4 | Anonymous | `/onboarding/ready` | Login (page-level) | Ready page auth | **VERIFIED HISTORICAL** — 307 `/login?next=%2Fonboarding` (route exists; `X-Matched-Path: /onboarding/ready`) |
| P5 | Anonymous | `/register` | Registration disabled | closed-beta admission | **VERIFIED HISTORICAL** — 307 `/login?registration=disabled` |
| A | Authenticated, V2 incomplete | `/home` | Push to current onboarding stage; never Today | `redirectIfOrganizationOnboardingIncomplete` | **NOT LIVE** — no governed V2 incomplete QA org; QA A OPEN; fixture NOT STARTED/PAUSED |
| B | Authenticated, `v2_completed` Owner | `/onboarding/ready` | Stay; reconstruct Ready; Open ZyntixAI if coherent | Ready page + `canOfferExplicitProductEntry` | **NOT LIVE** — zero `flow_version = 2` orgs |
| C | Authenticated completed Ready | explicit Open ZyntixAI | Navigate to `/home?org=[QA-ORG-REDACTED]`; completion is a separate Enter ZyntixAI action | Ready UI; no auto-entry | **NOT LIVE** |
| D-legacy | Authenticated legacy completed Owner | `/home`, onboarding routes, refresh | Admit product; leave onboarding routes; no earlier-step trap | `kind: "legacy"` + `completed` → `stageRoute: "home"` | **VERIFIED HISTORICAL** — 2026-09-12 Playwright session only |
| E | Authenticated | foreign `org` query | Membership-scoped; no foreign org | `resolveSelectedOrganization` | **VERIFIED HISTORICAL** — Isolation/fake UUID required selection; Isolation name absent |
| F | Authenticated completed `/home` | product shell modules | Session client + operating-model maps | `loadProductModuleAccess` | **VERIFIED HISTORICAL** for course-seller QA org |
| G | Onboarding render failure | error boundary | “Setup needs attention”; no SQL/stack | `src/app/onboarding/error.tsx` | **NOT LIVE** — not fault-injected |

---

## D5. Public baseline (live)

User-Agent: `ENG-ONB-1H-PROD-verify`. `--max-redirs 0` unless noted. No cookies. Timestamp `2026-09-12T15:03:31Z`.

| Requested URL | Status | Redirect / matched path | Final classification |
| --- | --- | --- | --- |
| `https://www.zyntixai.com/` | 307 | `Location: /login`; `X-Matched-Path: /` | auth boundary |
| `https://www.zyntixai.com/login` | 200 | `X-Matched-Path: /login` | login reachable |
| `https://www.zyntixai.com/home` | 307 | `Location: /login?next=%2Fhome` | anonymous product denied |
| `https://www.zyntixai.com/home` followed (`-L`) | 307 then 200 | final `/login?next=%2Fhome` | no loop; no anonymous product shell |
| `https://www.zyntixai.com/onboarding` | 307 | `Location: /login?next=%2Fonboarding` | auth boundary |
| `https://www.zyntixai.com/onboarding/ready` | 307 | `Location: /login?next=%2Fonboarding`; `X-Matched-Path: /onboarding/ready` | **P1-D Ready present** (was 404 on `e7db52c`) |
| `https://www.zyntixai.com/onboarding/creating` | 307 | `X-Matched-Path: /onboarding/creating` | P1-D Creating present |
| `https://www.zyntixai.com/onboarding/team` | 307 | `Location: /login?next=%2Fonboarding%2Fteam` | auth boundary |
| `https://www.zyntixai.com/onboarding/operating-model` | 307 | `Location: /login?next=%2Fonboarding%2Foperating-model` | auth boundary |
| `https://www.zyntixai.com/onboarding/workspace-confirmation` | 307 | `Location: /login?next=%2Fonboarding%2Fworkspace-confirmation` | auth boundary |
| `https://www.zyntixai.com/register` | 307 | `Location: /login?registration=disabled` | registration remains disabled |
| `https://zyntixai.vercel.app/login` | 200 | `X-Matched-Path: /login` | Production alias |
| `https://zyntixai.com/login` | 308 | `Location: https://www.zyntixai.com/login` | apex → www |

No 5xx. No redirect loop. `next` values contain only internal paths.

This is the factual opposite of run A, where Ready/Creating/Team/operating-model/workspace-confirmation returned **404**.

Classification for this subsection: **VERIFIED HISTORICAL** (anonymous HTTP only, 2026-09-12).

---

## D6. Authenticated QA method

| Field | Value |
| --- | --- |
| Identity type | Governed Production QA Owner (masked; email not published) |
| QA organization | `ZyntixAI Production QA` (`[QA-ORG-REDACTED]`) |
| Membership | single active Owner membership (Isolation org is **not** a membership of this identity) |
| Onboarding state | `flow_version = 1`, completed, no `setup_ready_at` → lifecycle `kind: "legacy"` with `completed: true` |
| Suitability | Suitable for **completed / legacy product-shell** probes. **Not** suitable for V2 incomplete or V2 Ready / Open ZyntixAI. **Not** a substitute for manual QA A. |
| Primary activity | `qa_online_course_business` (course-seller / knowledge OCB) |
| Authentication | Existing gitignored Playwright QA Owner storage restored via Auth refresh against the public Supabase URL; subsequent application HTTP used the session cookie. Password was not requested, printed, or stored in this document. No cookie, token, or password value is recorded here. |
| Service-role | not used to mint users, orgs, or onboarding rows |
| Customer accounts | not used |
| New Production user/org | not created |

`PARTIAL — LEGACY QA PLAYWRIGHT SESSION, 2026-09-12`

`MANUAL QA A LOGIN = OPEN`

The 2026-09-12 Playwright session must not be read as QA A completion or as V2-fixture evidence.

Census (read-only, no customer names):

| Population | Count |
| --- | --- |
| `flow_version` null, incomplete | 4, all non-QA-named — **not used** |
| `flow_version` 1 completed | 2 (Production QA + Isolation QA) |
| `flow_version` 2 any | **0** |
| QA-named incomplete | **0** |

QA B is **OUT OF SCOPE** and **UNPROVISIONED**. Isolation QA was used only as a foreign-org negative probe, not as QA B provisioning.

---

## D7. Authenticated incomplete-onboarding contract

**NOT LIVE-PROBED.**

No governed incomplete QA identity/state exists. Manufacturing incomplete state with SQL/service_role is forbidden. Using the four non-QA incomplete organizations would be using unrelated Production tenants.

Anonymous `/home` denial is not a substitute for the authenticated incomplete gate.
The 2026-09-12 legacy Playwright session is not a substitute for manual QA A.
The governed single-V2-fixture provisioning-flow is **NOT STARTED/PAUSED**.

This mandatory item is **not demonstrated**. It blocks PROD PASS.

---

## D8. Authenticated onboarding lifecycle / route progression

For the live legacy-completed QA Owner (`2026-09-12T15:08:33Z` authenticated probes) — **VERIFIED HISTORICAL** only:

| Entry | Hops | Final | Classification |
| --- | --- | --- | --- |
| `/` | 307 → `/home?org=[QA-ORG-REDACTED]` then 200 | product Today | completed admission |
| `/login` | 307 `/` → 307 `/home?org=[QA-ORG-REDACTED]` then 200 | product | session recognized |
| `/onboarding` | 307 `/home?org=[QA-ORG-REDACTED]` then 200 | product | not returned to You & Company |
| `/onboarding/ready` | 307 `/home?org=[QA-ORG-REDACTED]` then 200 | product | Ready is not a V2 stay-surface for legacy |
| `/onboarding/ready?org=[QA-ORG-REDACTED]` | same | product | same |
| `/onboarding/creating` | 307 `/home?org=[QA-ORG-REDACTED]` then 200 | product | Creating skipped |
| `/onboarding/team` | 307 `/home?org=[QA-ORG-REDACTED]` then 200 | product | Team skipped |
| `/onboarding/operating-model` | 307 `/onboarding?org=[QA-ORG-REDACTED]` → 307 `/home?org=[QA-ORG-REDACTED]` then 200 | product | no loop |
| `/onboarding/workspace-confirmation` | 307 `/home?org=[QA-ORG-REDACTED]` then 200 | product | skipped |

No 5xx. No loop. Direct navigation does not keep a completed legacy Owner on V2 onboarding steps. That matches `resolveOnboardingLifecycleDestination` for `legacy` + completed.

V2 stage-to-stage progression (`v2_core_incomplete` → operating-model → workspace → creating → ready) is **NOT LIVE**.

---

## D9. Ready / completed contract

Live for **legacy completed** on 2026-09-12 (**VERIFIED HISTORICAL**):

- Server authority admits `/home` and `/home?org=[QA-ORG-REDACTED]` with Today + course-seller nav.
- Completed Owner is **not** kept on `/onboarding/ready` (expected: only `v2_completed` Owners stay).
- Refresh of `/home?org=[QA-ORG-REDACTED]` remained 200 product (second GET in the same session).
- Direct `/onboarding/*` remains consistent with server state (product, not an earlier step).

V2 Ready reconstruction (Stay + **Open ZyntixAI**, coherent snapshot, Enter ZyntixAI withheld after completion) is **NOT LIVE**. There is no `v2_completed` organization.

---

## D10. Explicit product entry

**NOT LIVE-PROBED.**

HTML of Ready never loaded for this QA state because Ready redirected to product. Markers `Open ZyntixAI` and `Enter ZyntixAI` were absent on every authenticated response.

This is a mandatory P1-D item. Absence of a safe `v2_completed` QA tenant blocks PROD PASS. Source inspection of `canOfferExplicitProductEntry` is not live proof. Manual QA A and the governed single-V2-fixture flow remain **OPEN** / **NOT STARTED/PAUSED**.

---

## D11. Product-shell admission

Completed (legacy) direction, **VERIFIED HISTORICAL** (2026-09-12):

| Route | Result |
| --- | --- |
| `/home` | 200, `X-Matched-Path: /home`, Today, Programs/Customers/Leads/Enrollments |
| `/home?org=[QA-ORG-REDACTED]` | 200, same |
| `/` | 307 into `/home?org=[QA-ORG-REDACTED]` |
| `/programs`, `/customers`, `/leads`, `/enrollments`, `/progress` | 200; QA org name present |

Incomplete direction, **NOT LIVE** (no incomplete QA state; fixture NOT STARTED/PAUSED).

Product-shell HTML used the authenticated session. No service-role key appeared in bodies/URLs. No cookie, token, or password value is recorded here.

---

## D12. Direct navigation / refresh / session

| Probe | Result |
| --- | --- |
| Direct `/home` after auth | 200 product |
| Direct onboarding after completion | product (see D8) |
| Repeat `/home?org=[QA-ORG-REDACTED]` | 200, same body class (refresh-equivalent) |
| Authenticated `/login` | bounced to product, not anonymous login form |
| Lost session / anonymous fallback after valid navigation | not observed |
| Redirect loop | none |
| `session_expired` reason | not observed on these probes |

Logout was **not** executed (would revoke the governed QA refresh token). No token value is recorded here.

Classification: **VERIFIED HISTORICAL** for the 2026-09-12 legacy session only.

---

## D13. Organization context

| Probe | Result |
| --- | --- |
| Canonical product URL | `/home?org=[QA-ORG-REDACTED]` |
| QA display name on product modules | present (`ZyntixAI Production QA`) |
| Isolation org query `/home?org=[ISOLATION-ORG-REDACTED]` | 200, **no Isolation name**, no Programs/Customers product nav, QA name listed as selectable membership |
| Fake UUID org query | same fail-closed selection behaviour |
| Silent serve of Isolation data | **not observed** |

This matches `resolveSelectedOrganization`: a foreign/invalid `org` on a single-membership actor sets `requiresSelection: true` / `invalidSelection: true` rather than minting the foreign tenant.

Isolation QA is **not** QA B. QA B remains **OUT OF SCOPE** / **UNPROVISIONED**.

---

## D14. Operating model / module gating

QA org operating model: course-seller (`qa_online_course_business`).

| Target group | Classification | Live evidence |
| --- | --- | --- |
| Courses & Coaching (`course_seller`) | **VERIFIED HISTORICAL** | `/programs`, `/customers`, `/leads`, `/enrollments`, `/progress` 200 with QA name; nav includes Programs/Customers/Leads/Enrollments; `/projects`, `/products`, `/sites`, `/work-orders`, `/dispatch` 200 with `This area is not available` |
| Agency & Business Services (`service`) | **NOT VERIFIED IN PROD** | no governed service QA org exercised |
| Construction & Field Operations | **NOT VERIFIED IN PROD** | negative `/sites` `/work-orders` `/dispatch` on the course-seller tenant is denial, not a field-tenant positive |
| Product Operations | **NOT VERIFIED IN PROD** | negative `/products` on the course-seller tenant is denial, not a product-tenant positive |

Four-target **positive** coverage is not claimed. Partial live course-seller coverage is not restated as full 4TG coverage.

---

## D15. Team / invitation authority

`NOT LIVE-PROBED — PRIOR GOVERNED EVIDENCE ONLY`

No invitation was sent. No uncontrolled Production invite traffic. The formal Production contract for this phase does not require a live invitation mutation when a dedicated QA recipient/fixture is not safely in play.

---

## D16. Session / cookie / redirect quality

Observable only (no cookie/token values recorded):

- login-equivalent (already authenticated `/login`) → product;
- onboarding refresh not applicable as a stay-on-stage (legacy completed leaves onboarding);
- Ready refresh not applicable as a stay-on-Ready (legacy redirects home);
- product-shell refresh authorized;
- direct protected routes authorized for completed state;
- no bounce between onboarding and product after admission;
- no endless loader/5xx in HTTP bodies (`Application error`, `Hydration`, `Internal Server Error` absent);
- no secret-looking material in HTML (`service_role`, JWT-shaped `eyJ…`, `postgres://` absent).

---

## D17. Security negative probes

| Probe | Result | Class |
| --- | --- | --- |
| Anonymous `/home` cannot obtain product | 307 login | **VERIFIED HISTORICAL** |
| Anonymous P1-D onboarding routes cannot obtain UI | 307 login | **VERIFIED HISTORICAL** |
| Incomplete onboarding cannot bypass product gate | **NOT LIVE** | no incomplete QA state; QA A OPEN; fixture NOT STARTED/PAUSED |
| Completed user receives only authorized modules | course-seller positives + field/product/project denials | **VERIFIED HISTORICAL** |
| Foreign org query cannot widen access | Isolation name absent; selection required | **VERIFIED HISTORICAL** |
| Redirect URLs | internal paths only | **VERIFIED HISTORICAL** |
| Secrets in errors/URLs | none observed | **VERIFIED HISTORICAL** |
| Ordinary product admission used service-role | not used in this phase’s application probes | **VERIFIED HISTORICAL** |

No brute force, enumeration, privilege-escalation, or penetration testing.

---

## D18. Error / failure handling

`PRIOR GOVERNED EVIDENCE ONLY — NOT LIVE-FAULT-INJECTED`

No naturally occurring recoverable onboarding error was observed on the probed routes.

---

## D19. UX correctness

On live authenticated product and module pages: `<main>` present, substantial HTML, no blank 200, no crash/hydration/5xx strings. Primary product surface (Today) loaded. Explicit Ready action was not on-screen because Ready redirected (correct for this state, so “unusable Ready action” is not a live Ready UX fail; it is the missing V2 Ready state).

No subjective styling fail.

Classification: **VERIFIED HISTORICAL** for the 2026-09-12 legacy session.

---

## D20. Application-level QA mutations performed

None against organizations, onboarding columns, invitations, or customers.

The governed gitignored Playwright QA session was refresh-rotated so the existing QA Owner storage would not be left with a consumed refresh token. That is session continuity, not an onboarding-state change. No token value is recorded here.

---

## D21. Items not live verified

| Item | Classification | Why |
| --- | --- | --- |
| Manual QA A-login | OPEN | designated tester unavailable; not executed |
| Governed single-V2-fixture provisioning | NOT STARTED/PAUSED | resume only after QA A-login |
| QA B | OUT OF SCOPE | unprovisioned; do not start |
| Authenticated V2 incomplete → current stage | C | zero `flow_version = 2` orgs; incomplete QA not available |
| Incomplete product-shell denial | C | same |
| V2 Ready reconstruction + Open ZyntixAI | C | no `v2_completed` org |
| Enter ZyntixAI completion click | C | would complete a V2 org that does not exist; not manufactured |
| TG2 / TG3 / TG4 positive module access | C | would require additional governed orgs |
| Team invitation send | C | no safe QA recipient flow executed |
| Onboarding error boundary | C | not fault-injected |
| Browser-visible click-path of Open ZyntixAI | C | Ready never rendered |
| Logout/login round-trip | C | logout would revoke the QA refresh token |

---

## D22. Required PROD PASS checklist

Historical 2026-09-12 rows are **VERIFIED HISTORICAL** or **PARTIAL**. Current open gates are listed explicitly. No overall `PASS` while a required subgate is OPEN.

| Item | Result |
| --- | --- |
| correct Production SHA deployed | **VERIFIED HISTORICAL** `PASS` (2026-09-12 reconfirm) |
| required Production DB contract present | **VERIFIED HISTORICAL** `PASS` (2026-09-12 reconfirm) |
| authenticated QA verification performed | **PARTIAL** — `PARTIAL — LEGACY QA PLAYWRIGHT SESSION, 2026-09-12` only; not QA A; not V2 fixture |
| manual QA A-login | **OPEN** |
| governed single-V2-fixture provisioning | **NOT STARTED/PAUSED** |
| SMTP / password-recovery mail delivery | **PASS — SMTP/RECOVERY ONLY** (2026-09-13; does not close onboarding) |
| incomplete onboarding gate correct | **NOT DEMONSTRATED** |
| lifecycle authority correct | **PARTIAL** — legacy completed **VERIFIED HISTORICAL**; V2 progression **NOT LIVE** |
| completed/Ready state correct | **PARTIAL** — legacy completed **VERIFIED HISTORICAL**; V2 Ready **NOT LIVE** |
| explicit product entry correct | **NOT DEMONSTRATED** |
| completed product-shell admission correct | **VERIFIED HISTORICAL** `PASS` (legacy, 2026-09-12) |
| incomplete product-shell denial correct | **NOT DEMONSTRATED** |
| refresh/direct navigation correct | **VERIFIED HISTORICAL** `PASS` for available completed state |
| organization context correct | **VERIFIED HISTORICAL** `PASS` |
| applicable module gating correct | **VERIFIED HISTORICAL** `PASS` for course-seller QA; other TGs not claimed |
| no blocking session/redirect issue | **VERIFIED HISTORICAL** `PASS` on probed paths |
| no blocker-level 5xx/runtime defect | **VERIFIED HISTORICAL** `PASS` on probed paths |
| unsupported-claim hygiene | **PARTIAL** — 2026-09-12 gaps were classified; 2026-09-13 parked/open gates are now listed. Not an overall Production PASS. |
| QA B | **OUT OF SCOPE** / **UNPROVISIONED** |

---

## D23. Exact current PROD verdict

`BLOCKED — ENG-ONB-1H-PROD`

`PAUSED — DESIGNATED TESTER TEMPORARILY UNAVAILABLE`

Primary remaining blockers:

- `BLOCKED — GOVERNED V2 INCOMPLETE AND V2-COMPLETED READY QA STATE UNAVAILABLE`
- `OPEN` — manual QA A-login not executed
- `NOT STARTED/PAUSED` — governed single-V2-fixture provisioning-flow not resumed
- designated tester temporarily unavailable (not a technical defect)

The deployment blocker from run A is **resolved**. The 2026-09-12 rerun’s blocker remains the absence of safe Production V2 QA states. Stage E adds that the next governed step cannot proceed until the designated tester is available.

A PASS is forbidden. Do not write `CLOSED`, `RELEASE READY`, or `PRODUCTION VERIFIED`.

---

## D24. Overall program status

| Item | Status |
| --- | --- |
| `ENG-ONB-1H-P1-D` | closed with repository evidence (published) — **not** Production-verified |
| `ENG-ONB-1H-PROD-MIGRATE` | **PASS** (prior phase; DB reconfirmed) |
| `ENG-ONB-1H-PROD-DEPLOY` | **PASS** (prior phase; deployment reconfirmed) |
| SMTP / password recovery | **PASS — SMTP/RECOVERY ONLY** (2026-09-13) |
| Manual QA A-login | **OPEN** |
| Governed single-V2-fixture provisioning | **NOT STARTED/PAUSED** |
| QA B | **OUT OF SCOPE** / **UNPROVISIONED** |
| `ENG-ONB-1H-PROD` | **BLOCKED/PAUSED** |
| `ENG-ONB-1H-FV` | **NOT STARTED** |
| Complete `ENG-ONB-1H` program | **OPEN** |

`The complete ENG-ONB-1H program remains open until ENG-ONB-1H-PROD and ENG-ONB-1H-FV both pass.`

Do not write `ENG-ONB-1H CLOSED`.
Do not start `ENG-ONB-1H-FV` while `ENG-ONB-1H-PROD` is BLOCKED/PAUSED.

---

## D25. Next action

Governed sequence. Do not skip steps. Do not treat SMTP/recovery PASS or the 2026-09-12 Playwright session as completion of this sequence.

1. Wait until the designated tester is available.
2. Perform the manual QA A-login.
3. Resume the governed single-V2-fixture provisioning-flow only after that.
4. Verify the agreed V2 states with evidence.
5. Keep QA B out of scope and unprovisioned.
6. Open `ENG-ONB-1H-FV` only when all required Production gates are demonstrably PASS.

This evidence file is a factual BLOCKED/PAUSED record. It is not a PASS publication candidate. It is **not staged**.

---

# E. Parked Production status (2026-09-13)

Current record. This section does not invent new HTTP, database, user, or evidence IDs. It records the parked operator state against the historical D-rerun.

| Gate | Status | Notes |
| --- | --- | --- |
| Custom SMTP via Resend on `auth.zyntixai.com` | `PASS — SMTP/RECOVERY ONLY` | Works in Production. |
| Password-recovery e-mail received and used | `PASS — SMTP/RECOVERY ONLY` | No e-mail address, recovery link, token, cookie, or password recorded. |
| Onboarding | **not completed** | SMTP/recovery is not onboarding completion. |
| Provisioning | **not completed** | SMTP/recovery is not provisioning completion. |
| Manual QA A-login | `OPEN` | Must be performed later by the designated tester. Not executed. |
| Governed single-V2-fixture provisioning-flow | `NOT STARTED/PAUSED` | Resume only after QA A-login. |
| QA B | `OUT OF SCOPE` / `UNPROVISIONED` | Do not provision. |
| `ENG-ONB-1H-PROD` | `BLOCKED/PAUSED` | Designated tester temporarily unavailable. Not a technical defect. Not final verification. |
| `ENG-ONB-1H-FV` | `NOT STARTED` | Must not start while PROD is BLOCKED/PAUSED. |

Do not write `PASS`, `CLOSED`, `RELEASE READY`, or `PRODUCTION VERIFIED` for `ENG-ONB-1H-PROD` on the basis of this section.

---

# A. First PROD run (historical BLOCKED — retained)

The following record is the earlier verification-only run. It remains true as history. Canonical Production **at that time** served `e7db52c`. That is no longer the live deployment (see C and D2).

## Executive verdict (run A)

`BLOCKED — ENG-ONB-1H-PROD`

`BLOCKED — REQUIRED P1-D IMPLEMENTATION NOT DEPLOYED TO PRODUCTION`

Canonical Production (`https://www.zyntixai.com`) was serving deployment `dpl_987D3AXjtukGydaSk9z5HCMHrgH7` whose Git SHA was `e7db52c59bb187e059be7739dd20dc54b5897b3a` (`fix(tasks): disambiguate assignee labels`, 2026-08-22). That SHA was **140 commits behind** then-current published HEAD and was **not** a descendant of the closed P1-D implementation commit.

P1-D implementation commit `2c4befa73f5b71b2b2a63732ca3885c7e356479c` was **not** an ancestor of that Production deployment SHA. Live Production therefore could not demonstrate authenticated product admission, Ready reconstruction, or explicit product entry.

That phase did not deploy, redeploy, migrate, mutate Production data, or start `ENG-ONB-1H-FV`.

## Run A — repository preflight

| Check | Result |
| --- | --- |
| Root | `[WORKTREE-PATH-REDACTED]` |
| Branch | `core/platform-readiness-20260707` |
| `git rev-parse HEAD` | `427e3b5d35b744959eb83c8b68f2dff196f68802` |
| Divergence | `0 0` |
| HEAD subject | `docs(onboarding): finalize P1-D publication evidence` |

## Run A — deployment identity

| Field | Value |
| --- | --- |
| Deployment id | `dpl_987D3AXjtukGydaSk9z5HCMHrgH7` |
| Target | `production` |
| Ready state | Vercel `readyState=READY` — **not** a product-verification PASS |
| Deployed Git SHA | `e7db52c59bb187e059be7739dd20dc54b5897b3a` |
| P1-D ancestor of that SHA | **no** |
| `/onboarding/ready` and sibling P1-D routes | **404** |

`DEPLOYED COMMIT MATCHES P1-D = NO`

Authenticated P1-D verification was **not** performed in run A because the implementation was not deployed. That was a consequence of the deployment blocker, not a substitute PASS.

---

# B. Migration phase (historical PASS — not re-executed here)

`PASS — ENG-ONB-1H-PROD-MIGRATE`

Current read-only reconfirm (D3) still shows tip `20260912144059 complete_onboarding_requires_current_ready_authority` and all 13 governed migrations. This rerun did not apply, repair, or roll back migrations. The local pre-migrate backup (`[LOCAL-BACKUP-REDACTED]`) was not modified.

---

# C. Deployment phase (historical PASS — identity reconfirmed)

`PASS — ENG-ONB-1H-PROD-DEPLOY`

Live inspect in D2 still reports `dpl_7QKLdfvSYboEehBCr79pwYnaVmoF` / SHA `427e3b5d35b744959eb83c8b68f2dff196f68802` / Vercel `readyState=READY` / aliases `www.zyntixai.com`, `zyntixai.com`, `zyntixai.vercel.app`. This rerun did not deploy, promote, or roll back.
