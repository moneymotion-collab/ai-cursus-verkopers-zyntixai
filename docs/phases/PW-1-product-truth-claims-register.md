# PW-1 — Product Truth & Claims Register

## 1. Document Control

| Field | Value |
| --- | --- |
| Phase ID | **PW-1** |
| Title | Product Truth & Claims Register |
| Status | `PASS — PW-1 PRODUCT TRUTH & CLAIMS REGISTER ESTABLISHED WITH EVIDENCE` |
| R1 status | `PASS — PW-1-R1 PRODUCT TRUTH REVIEW CLOSED WITH EVIDENCE` |
| Date | 2026-09-14 |
| R1 review date | 2026-09-14 |
| Branch | `core/platform-readiness-20260707` |
| Baseline HEAD | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| Ahead / behind | `0 0` |
| Governing PW-0 authority | `docs/phases/PW-0-public-web-charter-boundary-freeze.md` |
| PW-0 closure | `CLOSED WITH EVIDENCE — PW-0 PUBLIC WEB CHARTER & BOUNDARY FREEZE` at `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| Authenticated Home | Closed and protected. Closure SHA `49cd5773976143139a154f9b8ddf36535a4dd914`. Production product-code SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828`. Route `/home`. |
| Document type | Additive documentation only |
| Allowed mutation | This file only |
| Product / test / config edits | **NONE** |
| Commit / push / deploy | **NOT AUTHORIZED by this phase** |

**Purpose.** Establish a repository-grounded source of truth for every material claim that may later appear on the public ZyntixAI website. Determine, for each proposition, the exact scope, evidence tier, factual status, availability, public decision, mandatory qualifier, approved factual wording, prohibited implication, and reverification trigger.

**Scope.** Documentation-and-audit only. Covers product identity, Beta-1/core status, access model, target groups, core capabilities, AI, integrations, trust, commercial language, traction, CTAs, and prohibited overclaims.

**Non-goals.** This phase does not design the homepage, sitemap, or wireframes; does not write final marketing or hero/CTA copy; does not implement public routes; does not change `/`, `/login`, `/home`, middleware, auth, onboarding, features, tests, metadata, or assets; does not make credentialed production requests; does not use customer or personal data; does not commit, push, deploy, or start PW-2 or PW-3.

**Repository instructions inspected.** No `AGENTS.md`, nested `AGENTS.md`, `.cursor/rules`, or `CONTRIBUTING.md` was present. Binding authorities actually found: this PW-1 governing prompt; PW-0; `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md`; existing `docs/phases/` evidence convention. The most specific applicable instruction is: create exactly this file and do not modify any existing file.

PW-0 remains binding. Authenticated Home remains closed. P0 and controlled P1 surfaces are not modified. PW-0 implementation questions (dual-use `/`, apex host ownership, middleware path-set gap, login visual ownership) are **not** resolved here.

---

## 2. Executive Decision

The repository currently supports saying, in later copy phases, that **ZyntixAI** is hosted at `https://www.zyntixai.com`, that a logged-out visitor hitting `/` is sent to **sign-in**, that the product name appears on the sign-in page, and that the authenticated product Home is **`/home`** (not a marketing page). It also supports a **qualified** statement that ZyntixAI is **not only an AI chatbot**, because Home composition is non-generative and no LLM dependency is present — that is **not** a Production-verified product-category proof by itself.

What must be **qualified**: closed-beta / invite-only as **last governed Production policy**, not a re-probed live flag; Business Operating System as **intended** category (not live UI; not autonomous operation); Course Sellers as a **Beta-1 operator product** whose Home is Production-verified at SHA `d110b6e3…` while CRM/programs/members were last Production-walked on an **earlier** B1-FV deploy with **read/fixture** limits; thin Agency / Field / Product slices as **in-repository** slices **not** proven available for beta participation; Social; invitations; support; infrastructure; organization isolation.

R1 correction: **do not** describe Course Sellers as a complete Production-verified edition. H1-FV did **not** run a new authenticated login and does **not** elevate CRM, programs, or LMS claims. Live `PUBLIC_REGISTRATION_ENABLED` is **unknown** until re-smoked; public copy may only say that governed evidence and repository defaults do not offer open signup.

What must be **withheld**: general availability; open signup; “all four target groups fully available”; complete Agency / Field / Commerce editions; storefront, Stripe, GPS/routing, client portal; generative or autonomous AI; customer counts, testimonials, logos; certifications, AVG/GDPR legal conclusions, uptime/SLA; free/unlimited/trial pricing; Social publishing as generally on.

```text
PRODUCT VISION  ≠  IMPLEMENTATION
IMPLEMENTATION  ≠  PRODUCTION AVAILABILITY
CLOSED BETA    ≠  GENERAL AVAILABILITY
PRODUCT ACCEPTANCE CLOSED  ≠  PUBLIC CLAIM ALLOWED
```

Four-target-group **product** evidence exists (`BETA1-4TG-MASTER-FV`). That does **not** authorize a public claim that all four groups are available to visitors. PW-0 `PW0-RQ-011` is confirmed: product-closed and public-claim-allowed are different questions. This register answers the public-claim question conservatively.

This section is not marketing copy.

---

## 3. Evidence Hierarchy

Conflicts are resolved by the **more conservative public conclusion**. Document titles do not upgrade evidence. Scope, exclusions, blockers, and final status of each cited authority were read.

| Tier | Name | Meaning for public claims |
| --- | --- | --- |
| **E5** | Current production verification | Exact capability verified in production and still applicable to the current product state (known SHA/date). |
| **E4** | Closed release evidence | Completed FV / release-ready dossier with gates and a known SHA. Proves release status **inside documented scope only**. Does not automatically prove current public availability. |
| **E3** | Integrated implementation evidence | Current source plus relevant integration / browser / e2e evidence in the tested environment. |
| **E2** | Isolated implementation evidence | Source plus unit/feature tests without complete integration or production verification. |
| **E1** | Contract, scope, design, or roadmap | Intent or governance. Not implementation or availability. |
| **E0** | Unsupported or contradictory | Missing, conflicting, stale, or out-of-scope evidence. |

**Conflict rule.** When a later authority narrows or parks an earlier PASS (example: `ENG-ONB-1H-PROD` parked after earlier onboarding production claims), the later, more specific limitation governs public wording. When MASTER-FV records L5 while also recording `PRODUCTION MIGRATIONS APPLIED = 0` and `DEPLOYMENTS = 0`, that is a **scope difference** (in-repo product acceptance vs Production rollout), not a license to claim Production availability.

For every claim, the strongest **valid** tier is recorded, plus lower-tier support. A high tier does not automatically yield `ALLOW`.

---

## 4. Product-Truth Rules

The following rules are binding on this register and on later PW copy, design, and implementation phases:

1. Scope frozen does not mean implemented.
2. Implemented does not mean production-deployed.
3. Production-deployed does not automatically mean generally available.
4. A route existing does not mean the feature is usable end to end.
5. A visible navigation item does not prove functional completeness.
6. A passing unit test does not prove integrated availability.
7. A passing integration test does not prove production availability.
8. A closed phase proves only its documented acceptance scope.
9. A disabled feature remains unavailable even if code exists.
10. A feature flag, role gate, organization gate, target-group gate, or environment gate must be reflected in the claim.
11. Closed beta is not general availability.
12. Invite-only access is not public self-service availability.
13. A registration route does not by itself prove open public registration policy.
14. Internal fixtures, QA organizations, seeded rows, imports, or database record counts are not customers, users, traction, or adoption evidence.
15. Product plans and problem catalogues are not implemented modules.
16. Proposed integrations are not active integrations.
17. Provider-ready architecture is not an active provider connection.
18. AI-assisted behavior is not autonomous business operation.
19. Human review requirements must not be hidden.
20. Security controls do not justify absolute “secure” claims.
21. Privacy-oriented design does not by itself prove full legal compliance.
22. No certification, audit, SLA, uptime, accuracy, savings, growth, or performance claim is permitted without direct evidence.
23. “Free”, “unlimited”, “enterprise”, “all-in-one”, and equivalent claims require precise supporting authority.
24. Absence of evidence must be recorded as unknown or prohibited, not converted into optimistic wording.
25. When evidence conflicts, use the more conservative public conclusion and record the conflict.

---

## 5. Evidence Sources Reviewed

Inspected without modifying. No secret or environment values were copied.

### 5.1 Governance and PW-0

- `docs/phases/PW-0-public-web-charter-boundary-freeze.md`
- `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md`
- `README.md` (title only)

### 5.2 Release and phase authorities (non-exhaustive of older CS slices)

- `docs/phases/BETA1-4TG-SCOPE-FREEZE-four-target-group-product-acceptance-contract-evidence.md`
- `docs/phases/BETA1-4TG-CONTEXT-PACKS-additive-cap-ctx-productization-evidence.md`
- `docs/phases/BETA1-4TG-APPSHELL-GATING-context-driven-navigation-and-route-access-evidence.md`
- `docs/phases/BETA1-4TG-TERMINOLOGY-target-aware-navigation-and-shared-page-language-evidence.md`
- `docs/phases/BETA1-4TG-MASTER-FV-four-target-group-beta1-master-final-verification-evidence.md`
- `docs/phases/BETA1-MASTER-FV-frozen-beta1-program-final-closure-verification-evidence.md`
- `docs/phases/BETA1-FV-zyntixai-closed-beta-final-verification-evidence.md`
- `docs/phases/BETA1-LR-0-closed-beta-launch-readiness-discovery.md`
- `docs/phases/BETA1-LR-1-closed-beta-admission-activation-evidence.md`
- `docs/phases/BETA1-LR-2-closed-beta-support-first-user-smoke-evidence.md`
- `docs/phases/B1-FV-course-sellers-beta-1-final-release-verification-evidence.md`
- `docs/phases/TG2-AGENCY-SLICE-agency-business-services-e2e-beta1-evidence.md`
- `docs/phases/TG2-FV-agency-business-services-final-verification-evidence.md`
- `docs/phases/TG3-FIELD-SLICE-construction-installation-field-service-e2e-beta1-evidence.md`
- `docs/phases/TG3-FV-construction-installation-field-service-final-verification-evidence.md`
- `docs/phases/TG4-PRODUCT-SLICE-ecommerce-product-fulfillment-e2e-beta1-evidence.md`
- `docs/phases/TG4-FV-ecommerce-product-fulfillment-final-verification-evidence.md`
- `docs/phases/SHARED-PROJECTS-FOUNDATION-generic-delivery-project-domain-evidence.md`
- `docs/phases/ONBOARDING-1A-operating-model-selection-and-context-assignment-evidence.md`
- `docs/phases/ENG-ONB-1H-PROD-production-onboarding-verification-evidence.md`
- `docs/phases/B1-C1-H1-daily-operating-home-hardening-acceptance-contract.md`
- `docs/phases/B1-C1-H1-FV-final-verification-evidence.md`
- `docs/phases/B1-C1-daily-operating-composition-evidence.md`
- `docs/phases/DATA-TRACK-FV-final-beta1-data-core-closure-verification-evidence.md`
- `docs/phases/SMM-B1-FV-social-media-management-beta-1-final-verification-evidence.md`
- `docs/phases/SMM-publishing-reactivation-FV-controlled-production-provider-write-evidence.md`

### 5.3 Source surfaces and gates

- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/register/page.tsx`
- `src/features/auth/ui/login-form.tsx`, `src/features/auth/server/public-registration.ts`
- `src/app/(authenticated)/home/page.tsx`
- `src/features/product-access/domain/module-registry.ts`, `src/features/product-access/domain/module-access.ts`
- `src/features/onboarding/domain/operating-model.ts`
- `src/features/support/closed-beta-support-contact.ts`
- `src/features/nba/domain/evaluate-next-best-action.ts`
- `src/features/daily-operating/domain/compose-daily-operating-brief.ts`
- `src/features/business-qualification/domain/admission.ts` (demand waitlist is internal BQA, not a public App Router)
- `package.json`, `.env.example` (flag **names** and documented defaults only)
- Authenticated App Router inventory under `src/app/(authenticated)/`

### 5.4 Tests (inspected as evidence of what is proven, not re-run)

Named packs cited by PW-0 and H1 remain the Home/auth regression authorities: `tests/auth/entry-routing-and-login-ui.test.tsx`, `tests/auth/middleware-auth-redirects.test.ts`, `tests/auth/public-registration.test.ts`, `tests/onboarding/product-admission-app-shell.test.ts`, `tests/features/product-access/beta1-4tg-appshell-gating.test.ts`, `tests/browser/b1-c1-production-home.*.spec.ts`. MASTER-FV recorded a large targeted 4TG suite. PW-1 did not run `npm install` or broad test suites.

### 5.5 Production evidence used

- H1-FV (2026-09-14 class): unauthenticated `www` `/` → `307 /login`; `/login` 200; `/home` → `/login?next=/home`; deployed product SHA `d110b6e3da5c690b31a68a0b145b7b6521c10828`.
- BETA1-FV / LR-1 / LR-2: invite-only PATH B; public registration OFF; Social publishing/scheduling OFF at those checkpoints.
- ENG-ONB-1H-PROD: parked `BLOCKED`; `/register` historically `307 /login?registration=disabled`; TG2–TG4 **NOT VERIFIED IN PROD**; V2 onboarding not live-proven.
- B1-FV Course Sellers: CS Beta-1 production re-verify (historical deploy; later Home SHA supersedes runtime for Home).
- DATA-TRACK-FV: Customer CSV import core production-verified on a **QA** organization; not public traction.
- SMM publishing reactivation FV: one controlled Instagram write, then `PUBLISHING EXECUTION = OFF` / `SCHEDULING EXECUTION = OFF`.

PW-1 did **not** issue new credentialed production requests.

---

## 6. Product Status Reconciliation

| Topic | What is true | What it is not |
| --- | --- | --- |
| Shared / Core | `BETA1-MASTER-FV` closed the frozen Beta-1 **Core** program (11/11 tracks) on 2026-08-31. Later 4TG Layer B and H1 sit on that core. | Not “every future target group complete”; not public GA. |
| 4TG product acceptance | `BETA1-4TG-MASTER-FV` closed TG1–TG4 **product acceptance** in-repo at the master L5 gate, with explicit `PRODUCT ACCEPTANCE CLOSED ≠ PRODUCTION DEPLOYED` and `TARGET FINAL VERIFICATION DOES NOT IMPLY AUTOMATIC BETA_SUPPORTED PROMOTION`. SCOPE-FREEZE froze **thin E2E slices** for TG2–TG4, not complete editions. CTX packs remain `context_ready`, not `beta_supported`. | Not public availability of four editions. MASTER “L5” is in-repo acceptance; MASTER itself recorded zero Production migrations/deployments at close. |
| Schema vs product Production | ENG-ONB-1H-PROD later recorded Production migrations including 4TG slice schema. That is **schema presence**, not TG2–TG4 product Production verification. | Do not treat migrated schema as a live Agency/Field/Commerce offering. |
| Closed beta | `BETA1-FV`: Closed Beta 1 production verified; **not** public commercial launch or open signup. LR-1: PATH B invite-only Production-verified. Public registration fail-closed in source (`PUBLIC_REGISTRATION_ENABLED` exact `true` only; `.env.example` `false`). | Not PATH A / open owner registration. Not GA. |
| Production runtime | Latest **Home** governed Production product-code SHA is `d110b6e3…` (H1-FV). `427e3b5…` is an ancestor used in parked ENG-ONB-PROD notes. PW-1 did not re-probe live deploy. | Do not assume HEAD (`40ab024…`, PW-0 docs) is Production product code. |
| Current access model | **Technical:** `/register` exists and fail-closes unless exact `PUBLIC_REGISTRATION_ENABLED=true` or trusted invite continuation. **Policy (last governed Production):** PATH B invite-only (BETA1-FV / LR-1; ENG-ONB historical `/register` 307). **Live flag:** not re-probed in PW-1 or R1 (PW1-RQ-002). Unauthenticated `/` → `/login` (H1-FV). `/home` protected. | Do not treat source default, historical Production, and unknown live env as one ALLOW fact. No public marketing homepage. |
| Course Sellers (TG1) | **Decomposed.** Home Today shell Production-verified at SHA `d110b6e3…` (H1-PROD/H1-FV). CS operator modules last Production-walked in B1-FV on an earlier deploy: leads/customers/tasks/progress **read** (mutations via tests/fixtures); members **resting**; not learner-facing LMS. V2 onboarding **not** Production-verified. | Not a complete current-SHA Production-verified edition. Not an LMS. Not GA. H1 Home does not prove CRM/programs. |
| TG2–TG4 | Thin slices implemented and master-tested. ENG-ONB: **NOT VERIFIED IN PROD**. Packs `context_ready`. AppShell fail-closed. | Not complete business editions; not GA. |
| Social | Architecture and gated Instagram path exist. Resting execution gates OFF in SMM reactivation FV and LR/BETA1-FV. Enrollment separate from CS admission. | Not always-on social publishing. |
| DATA import | Frozen Customer CSV core production-verified on QA org. **No** App Router data-intake UI. Not a public website feature. | Import row counts are not customers. |
| Onboarding V2 | Local P1 work exists. `ENG-ONB-1H-PROD` is **BLOCKED / PAUSED**. Zero `v2_completed` Production orgs recorded there. | Do not claim V2 onboarding Production verified. |
| Disabled / absent | Stripe; LLM providers; public pricing/trial; analytics/consent; `(marketing)` group; public waitlist page. | Must not be claimed as live. |

**L5 wording note.** SCOPE-FREEZE defines L5 as including Production verification. MASTER-FV uses “L5” while stating product acceptance ≠ Production deployed. Public copy must use the MASTER limitation, not the freeze’s L5 label, when talking to visitors.

---

## 7. Master Claim Register

Factual status and public decision each have **exactly one** primary value per row. Approved wording is a factual building block for later copy phases, **not** final homepage copy.

| Claim ID | Domain | Candidate proposition | Exact scope | Evidence tier | Evidence references | Factual status | Availability/gating | Public decision | Mandatory qualifier | Approved factual wording | Prohibited wording/implication | Reverification trigger | Owner/later phase |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW1-CLM-001 | Product identity | The product name is ZyntixAI | Live brand on login and root metadata; production host | E5 | `src/app/login/page.tsx`; `src/features/auth/ui/login-form.tsx`; `src/app/layout.tsx`; H1-FV §22 | PRODUCTION VERIFIED | Public unauthenticated pages show the name; product use is gated | ALLOW | None for the name itself | ZyntixAI is the product name shown on the current sign-in page. | Implying a different public brand, or that the name proves a marketing site exists | Login/metadata change; production smokecheck | PW-3 may style; must not rename without new evidence |
| PW1-CLM-002 | Business Operating System category | ZyntixAI is a Business Operating System | Governance/intended category for public-web; **not** current UI copy | E1 | PW-0 §3 / §10; this register’s governing context; no `Business Operating System` string in `src/` | SCOPED OR DESIGNED | Intended category; closed-beta product, not GA | ALLOW WITH QUALIFIER | Intended category only; not live UI copy; not GA; not an all-in-one OS; **not autonomous operation**; not chatbot-only | ZyntixAI is intended as a Business Operating System for operators, not only a chatbot. | “The complete OS for every business”; “all-in-one platform now available”; “the OS runs itself” | PW-3 positioning decision; new product-category authority | PW-3; may narrow, not broaden |
| PW1-CLM-003 | Product identity | ZyntixAI is not only an AI chatbot | Combined: H1 Home is a Today brief; NBA is rule-based in source; no LLM package | E3 | H1 contract “No AI ranking”; `compose-daily-operating-brief.ts`; `evaluate-next-best-action.ts`; `package.json` (no openai/anthropic/ai-sdk). H1-FV proves Home is not a chatbot **page**, not the whole product-category claim. | IMPLEMENTED AND INTEGRATION TESTED | Authenticated product; not a public chatbot | ALLOW WITH QUALIFIER | Rule-based Home/NBA; no generative provider in dependencies; not a Production-verified slogan; not an AI feature launch | ZyntixAI is not only an AI chatbot. | “No AI at all in any future”; “AI runs the company”; treating BOS as autonomy | Adding an LLM provider or AI ranking on Home | PW-3; AI claims §10 |
| PW1-CLM-004 | Product identity | Production public host is www.zyntixai.com | Canonical www host recorded in H1-FV and PW-0 | E5 | H1-FV; PW-0; `playwright.config.ts` default cited in PW-0 | PRODUCTION VERIFIED | Host exists; product behind auth | ALLOW | Distinguishes host from repository-owned apex 308 (PW-0 U) | The current production site is https://www.zyntixai.com. | Claiming apex-host rules are app-owned; claiming a public marketing homepage lives there today | Host/deploy change | PW-13 for host U items |
| PW1-CLM-005 | Overall Beta-1/core | Frozen Beta-1 Core program is closed in-repo | `BETA1-MASTER-FV` 11/11 tracks; 2026-08-31 | E4 | `BETA1-MASTER-FV-frozen-beta1-program-final-closure-verification-evidence.md` | RELEASE VERIFIED | Closed-beta product core, not public GA | ALLOW WITH QUALIFIER | In-repository Core closure; later 4TG/H1/onboarding layers exist; not public launch | ZyntixAI’s frozen Beta-1 Core program is closed with evidence in the repository. | “Beta-1 is a public commercial launch” | New core-track reopen | Later core FV |
| PW1-CLM-006 | Overall Beta-1/core | Four-target-group Beta-1 product acceptance is closed in-repo | MASTER-FV TG1–TG4 acceptance; thin-slice contracts | E4 | `BETA1-4TG-MASTER-FV-…`; SCOPE-FREEZE; CONTEXT-PACKS | RELEASE VERIFIED | `context_ready`; not `beta_supported`; not Production TG2–4 proof | ALLOW WITH QUALIFIER | Product acceptance ≠ Production deployed ≠ public availability | Repository product acceptance for four target-group Beta-1 slices is closed with evidence. | “All four target groups are fully available to customers/visitors” | CTX promotion; TG Production FV | PW-3 must not flatten |
| PW1-CLM-007 | Closed-beta status | Closed Beta 1 was production-verified as invite-only at the BETA1-FV / LR-1 checkpoint | BETA1-FV 2026-08-22 deploy `e7db52c…`; not a live-flag re-probe at H1 SHA `d110b6e3…` | E5 | `docs/phases/BETA1-FV-zyntixai-closed-beta-final-verification-evidence.md`; `BETA1-LR-1-…`; `BETA1-LR-2-…` | PRODUCTION VERIFIED | PATH B at that checkpoint; later SHAs exist | ALLOW WITH QUALIFIER | Historical governed Production policy (invite-only, not public commercial launch). Later product SHA not re-checked for admission flags. Not GA. | Closed Beta 1 was production-verified as invite-only, not as a public commercial launch. | “Currently live for everyone”; treating 2026-08-22 as an un-dated present-tense GA | Registration-policy change; `/register` smokecheck at current SHA | Before any public CTA copy freeze |
| PW1-CLM-008 | Public access model | The product is generally available | No GA authority; closed-beta authorities explicitly exclude public launch | E0 | BETA1-FV “not public commercial launch”; PW-0 | NOT PRESENT | Closed beta | PROHIBIT | n/a | (none) | “Generally available”; “now live for all businesses” | Dedicated GA authority + production verification | Not before a named GA program |
| PW1-CLM-009 | Public access model | Unauthenticated `/` currently sends visitors to sign-in | Root Server Component redirect; H1-FV 307 | E5 | `src/app/page.tsx`; H1-FV; `tests/auth/entry-routing-and-login-ui.test.tsx` | PRODUCTION VERIFIED | Dual-use `/` remains an entry resolver, not a marketing page | ALLOW | This is current behavior, not a future homepage architecture | Today, opening the production root URL redirects a logged-out visitor to sign-in. | “There is already a public marketing homepage at /” | Change to `src/app/page.tsx` or production `/` behavior | PW-13 |
| PW1-CLM-010 | Sign-in availability | Existing accounts can use the sign-in page; authenticated Home was verified with a session | H1-FV `/login` 200 (page, **no new login**); H1-PROD/PROD-C1 authenticated Home at SHA `d110b6e3…` | E5 | H1-FV (“New authenticated login = NOT DONE”); H1-PROD/PROD-C1; `src/app/login/page.tsx` | PRODUCTION VERIFIED | Existing/test accounts; not signup | ALLOW WITH QUALIFIER | Existing accounts only; H1-FV did not perform a new interactive login; not account creation | People with an existing ZyntixAI account can sign in. | “Anyone can create an account from this page” | Auth routing change; new login Production check | PW-2 CTA map |
| PW1-CLM-011 | Registration availability | Public self-registration is not available as an open visitor path | Source fail-closed; last Production `/register` 307 is historical (ENG-ONB / BETA1-FV); **live flag unknown** | E3 | `public-registration.ts`; `src/app/register/page.tsx`; `.env.example=false`; ENG-ONB-PROD historical 307 (parked dossier); PW1-RQ-002 | UNKNOWN | Disabled unless exact `true`; trusted-invite continuation is an exception | ALLOW WITH QUALIFIER | Repository default and last governed Production checks deny open signup. Live `PUBLIC_REGISTRATION_ENABLED` was not re-verified in PW-1-R1. Trusted invite continuation can still open `/register`. Not a “coming soon” promise. | Governed evidence does not offer open public self-registration. | “Register now”; “create a free account”; asserting the live flag with certainty | `GET /register` at current Production SHA | Before PW-3 CTA copy |
| PW1-CLM-012 | Registration governance | A `/register` route means signup is open | Route exists but policy denies public use | E3 | `src/app/register/page.tsx`; PW-0 | DISABLED OR INACTIVE | Fail-closed | PROHIBIT | n/a | (none) | Using the existence of `/register` as proof of open registration | Public registration enablement with new authority | Not a copy building block |
| PW1-CLM-013 | Organization/workspace model | Admitted users work in organizations (membership), not public self-serve workspaces | CS/H1 org admission and membership; **not** V2 operating-model Production proof | E5 | B1-FV organization; H1 org admission; `src/app/(authenticated)/home/page.tsx` org handling | PRODUCTION VERIFIED | Closed-beta membership; invite-only admission historically | ALLOW WITH QUALIFIER | Authenticated closed-beta workspaces; not public self-serve org creation; operating-model assignment is a separate claim (PW1-CLM-069) | Admitted organizations work in an isolated workspace. | “Create a workspace instantly from the public site”; implying four-industry picker is Production-verified | Onboarding/admission policy change | PW-2 |
| PW1-CLM-014 | Authenticated Home | Authenticated product Home is `/home` (Today brief) | Closed H1 only; SHA `d110b6e3…`; does **not** prove other CS modules | E5 | H1 contract/FV/PROD; `src/app/(authenticated)/home/page.tsx`; module `home` → `/home` | PRODUCTION VERIFIED | Protected; unauthenticated `/home` → login | ALLOW WITH QUALIFIER | Authenticated closed-beta Home, not the public site; not a Course Sellers edition proof | After sign-in, the accepted product Home is `/home`. | Presenting `/home` as the public website; using Home Production to claim CRM/LMS | H1 reopen; Home route change | PW-0 P0; not PW copy of Home UI |
| PW1-CLM-015 | Customer/CRM | Course-seller operators can use leads and customers | B1-FV Production **read** of lists/details on earlier deploy; mutations via tests/fixtures; not H1 SHA | E4 | B1-FV §7 “Production read-only”; module `leads`/`customers`; fail-closed until caps resolve | RELEASE VERIFIED | CS context; closed beta; not all TGs | ALLOW WITH QUALIFIER | Closed-beta Course Sellers operator CRM; last Production walk was read-only on a pre-H1 SHA; not a public CRM; not current-SHA Production verified | Admitted Course Seller operators can work with leads and customers in the Beta-1 product. | “ZyntixAI is a CRM for every business type, publicly”; “Production-verified CRM at the current Home SHA” | CS Production re-FV at current SHA | PW-3 TG wording |
| PW1-CLM-016 | Programs and enrollments | Course-seller operators can manage programs, enrollments, and progress | B1-FV operator surfaces; progress **read + fixtures**; **not** learner-facing course delivery | E4 | B1-FV §§9–11; `programs`/`enrollments`/`progress` registry | RELEASE VERIFIED | `knowledge.*` caps; CS pack | ALLOW WITH QUALIFIER | Closed-beta Course Sellers operator tools; not a public course marketplace; **no learner-facing LMS**; not current-SHA Production verified | Admitted Course Seller operators can manage programs, enrollments, and progress. | “Sell courses to the public on zyntixai.com”; consumer LMS; “students take courses on the website” | Knowledge-module Production re-FV; learner-delivery program | PW-3 |
| PW1-CLM-017 | Members | Members administration exists for admitted orgs | B1-FV members **resting**; invitation delivery historically allowlisted | E4 | B1-FV members resting; `members` module; invitation flags default OFF in `.env.example` | RELEASE VERIFIED | Invitation product gated; not public signup | ALLOW WITH QUALIFIER | Closed-beta member admin; invitations gated and historically allowlisted; not a public signup; not current-SHA Production verified | Admitted organizations can administer members inside the product. | “Invite anyone from the public website”; open team signup | Invitation flag change; members re-FV at current SHA | PW-2 |
| PW1-CLM-018 | Authenticated Home | Home composes a Today brief from Attention + assigned tasks | H1 Home only; SHA `d110b6e3…`; section cap; no AI ranking | E5 | H1-FV/PROD; B1-C1; `compose-daily-operating-brief.ts` | PRODUCTION VERIFIED | Authenticated closed-beta Home | ALLOW WITH QUALIFIER | Home Today overview only; not standalone Tasks/Attention edition proof (see PW1-CLM-070); not AI | After sign-in, Home shows a Today brief composed from Attention and assigned tasks. | “AI operating overview that runs the business”; claiming full Tasks app from Home alone | Home/Attention contract change | H1 protected |
| PW1-CLM-019 | Projects foundation | Shared projects support service projects and field jobs | Shared domain; TG2+TG3; TG4 does not use projects | E3 | SHARED-PROJECTS-FOUNDATION; TG2/TG3 slices; module `projects` | IMPLEMENTED AND INTEGRATION TESTED | `shared.projects` cap; not TG4; TG2/TG3 not positively Production-verified | ALLOW WITH QUALIFIER | Implemented in-repository for Agency and Field **thin slices**; not Production-verified; **not closed-beta-eligible as a live TG2/TG3 offering**; not a complete PSA | A shared project/job foundation is implemented for Agency and Field slices. | “Projects for every target group including e-commerce”; “complete project suite”; “available to agency/field beta customers” | TG2/TG3 Production FV | PW-3 |
| PW1-CLM-020 | Agency context | Agency/business-services Beta-1 is a frozen thin workflow slice | Lead → Client → Project → Tasks → Attention | E4 | TG2-AGENCY-SLICE; TG2-FV; SCOPE-FREEZE; MASTER-FV | IMPLEMENTED AND INTEGRATION TESTED | `foundation.service` `context_ready`; ENG-ONB **NOT VERIFIED IN PROD** | ALLOW WITH QUALIFIER | Thin Beta-1 slice, not a complete Agency edition; **not Production-proven**; **not proven available for closed-beta participation** | A thin Agency & Business Services workflow slice is implemented and accepted in-repository. | Complete agency OS; client portal; billing; “agencies can join the beta for this edition” | TG2 Production verification + admission | PW-3 |
| PW1-CLM-021 | Construction/field context | Field Beta-1 is a frozen thin workflow slice | Customer → Job → Site → Work order → Dispatch → Attention | E4 | TG3-FIELD-SLICE; TG3-FV; MASTER “lightweight dispatch ≠ route optimization” | IMPLEMENTED AND INTEGRATION TESTED | `foundation.field-operations` `context_ready`; not Production-proven | ALLOW WITH QUALIFIER | Thin slice; lightweight dispatch; **no GPS/route optimization**; **not Production-proven**; **not proven available for closed-beta participation** | A thin Construction & Field Operations workflow slice is implemented and accepted in-repository. | Full field-service suite; route optimization; GPS; mobile offline app; live field beta edition | TG3 Production verification + admission | PW-3 |
| PW1-CLM-022 | E-commerce/fulfillment context | Product-operations Beta-1 is a frozen thin workflow slice | Product → Inventory → Order → Fulfillment → Attention | E4 | TG4-PRODUCT-SLICE; TG4-FV; MASTER insufficient-stock fail-closed | IMPLEMENTED AND INTEGRATION TESTED | `foundation.product-operations` `context_ready`; TG4-FV Production fulfillment writes = 0 | ALLOW WITH QUALIFIER | Internal operator slice; **no storefront or checkout**; no payments; **not Production-proven as a customer offering**; **not proven available for closed-beta participation** | A thin Product & Fulfillment workflow slice is implemented and accepted in-repository. | Live storefront; checkout; Stripe; marketplaces; WMS | TG4 Production verification + admission | PW-3 |
| PW1-CLM-023 | Course-seller/coaching context | Coach is not a second TG1 product | SCOPE-FREEZE: coach is not a separate TG | E1+E4 | SCOPE-FREEZE; `course_seller` operating model title “Courses & Coaching” | RELEASE VERIFIED | One CS operating model | ALLOW WITH QUALIFIER | Wording may say courses and coaching as one operating model | Course selling and coaching share one Course Seller operating model in Beta-1. | Separate “Coach edition” as a fourth-plus product | New TG authority | PW-3 |
| PW1-CLM-024 | Social-media capabilities | Social/Instagram capability exists as a separately gated closed-beta track | SMM track; not in module-registry nav modules | E4+E5 (controlled) | SMM-B1-FV; SMM-publishing-reactivation-FV; social routes under `src/app/(authenticated)/social` | PARTIALLY IMPLEMENTED | Connections/publishing/scheduling env gates default OFF; enrollment separate | ALLOW WITH QUALIFIER | Gated closed-beta social; publishing/scheduling not generally on | Social media management exists as a separately gated closed-beta capability, not as a default public feature. | “Publish to Instagram from zyntixai.com”; “social included for all users” | Social gate flip; new SMM FV | PW-3 |
| PW1-CLM-025 | Social-media capabilities | Social publishing and scheduling are generally on | Resting OFF after controlled write | E5 (resting state at last SMM FV) | SMM-publishing-reactivation-FV `PUBLISHING EXECUTION = OFF`; LR-2 Social OFF; `.env.example` | DISABLED OR INACTIVE | Exact `"true"` env gates | PROHIBIT | n/a | (none) | Always-on publishing; “schedule posts automatically for all customers” | Governed gate-on Production FV | Not public until then |
| PW1-CLM-026 | Data import | Customer CSV import core was production-verified as a governed DATA track | Frozen DATA core; QA organization; no public UI | E5 | DATA-TRACK-FV; `src/features/data-intake/**`; no `src/app` data-intake page | PRODUCTION VERIFIED | Operator DATA track; not website; QA org | HOLD | If ever mentioned, must say governed operator import on authorized orgs, not a public tool | (no current public wording approved) | “Upload your customers on the website”; treating import rows as ZyntixAI customers | DATA UI or public intake decision | Later DATA/public-web implementation, not PW-3 copy |
| PW1-CLM-027 | AI capabilities | Home composition and NBA copy are deterministic/rule-based, not generative models | H1 forbids AI ranking; NBA fixed copy in source; not a Production observation of “no LLM in runtime” beyond dependencies | E3 | `evaluate-next-best-action.ts`; H1 “No AI ranking”; B1-C1; `package.json` | IMPLEMENTED AND INTEGRATION TESTED | Authenticated product | ALLOW WITH QUALIFIER | **Rule-based** next actions; **not generative**; **human-operated**; not LLM-backed; not autonomous | Attention next actions are rule-based. Home does not rank work with AI. | “AI-powered insights”; “generative summaries”; hiding human operation | LLM introduction; Home ranking change | §10 |
| PW1-CLM-028 | AI-provider connectivity | Users can connect any AI provider | No OpenAI/Anthropic/ai-sdk dependency; no AI enablement flag | E0 | `package.json`; src grep; no AI flags in `.env.example` | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | “Connect ChatGPT/Claude”; “bring your own model”; “any AI provider” | New provider architecture + Production FV | Future AI program |
| PW1-CLM-029 | Integrations | Stripe billing/checkout is a live product capability | No Stripe package or routes | E0 | `package.json`; TG4 exclusions; no pricing pages | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | Payments live; subscriptions; “buy now” | Stripe program + Production FV | Not PW-1 |
| PW1-CLM-030 | Integrations | The authenticated app uses a user-scoped Supabase client and is served at the recorded www host | Host is E5 (H1-FV); named vendor stack is source/dependency evidence, not a Production vendor audit | E3 | `@supabase/ssr` / `supabase-js`; H1-FV host (see also PW1-CLM-004) | IMPLEMENTED AND INTEGRATION TESTED | Infrastructure, not a public API product | ALLOW WITH QUALIFIER | Factual hosting/auth stack; not “Supabase-powered” marketing unless later approved; host URL is a separate ALLOW claim | The authenticated product uses a user-scoped backend client and is served at the recorded www host. | Public data API; “your database is public”; vendor slogans | Platform change | PW-3 should usually omit vendor slogans |
| PW1-CLM-031 | Integrations | Invitation email can be delivered via Resend when invitation delivery is enabled and allowlisted | LR-1 Production delivery ON for allowlisted tester; earlier SHA than H1 | E4 | `resend` dependency; invitations Resend adapter; LR-1 | RELEASE VERIFIED | Delivery flag + allowlist; not a public mail product | ALLOW WITH QUALIFIER | Closed-beta invitation mail; historically allowlisted; **disabled by default** in example env; not open transactional email; not re-verified at H1 SHA | Closed-beta invitation email is a gated capability, not a public mailing product. | “We email all visitors”; newsletter | Delivery-flag or provider change; re-FV at current SHA | PW-2 |
| PW1-CLM-032 | Authentication and authorization | Unauthenticated `/home` is protected; product use requires a session | H1-FV `/home` → `/login?next=/home`; H1-PROD authenticated Home | E5 | `src/middleware.ts`; `src/lib/supabase/middleware.ts`; H1-FV §22 | PRODUCTION VERIFIED | Session required for `/home`; not every `(authenticated)` path is middleware-listed (PW-0 U) | ALLOW WITH QUALIFIER | Session auth for the product Home; **not** a claim that every authenticated route is middleware-protected; not bank-grade/SSO | Product pages are for signed-in users. `/home` is protected. | “Bank-grade auth”; “SSO for all IdPs”; “all authenticated routes are middleware-protected” | Auth architecture change | PW-0 P1 |
| PW1-CLM-033 | Privacy and data handling | Authenticated Home is implemented to read via the user-scoped client, not service-role | Source lock + H1 ADMISSION tests; not Production telemetry of service-role absence | E3 | H1 ADMISSION; PW-0 P0; Home loader tests | IMPLEMENTED AND INTEGRATION TESTED | Control, not a legal privacy policy | ALLOW WITH QUALIFIER | Technical access pattern for Home; **not GDPR/AVG legal compliance**; not a universal isolation guarantee | Authenticated Home is implemented to use the user-scoped client, not the service-role client. | “AVG compliant”; “your data never leaves Europe”; “fully isolated in production by observation” | Service-role policy change; new privacy authority | Trust §11 |
| PW1-CLM-034 | Security controls | Tenant/role security tests and RLS exist as product controls | Security test packs; fail-closed nav | E3 | `tests/security/*` cited by MASTER-FV; `FAIL_CLOSED_MODULE_NAV_VISIBILITY`; AppShell gating | IMPLEMENTED AND INTEGRATION TESTED | Controls; not certifications | ALLOW WITH QUALIFIER | Describe controls, not “fully secure” | Module navigation is fail-closed until capability resolution. Tenant isolation is enforced in product loaders and tests. | “Enterprise-grade”; “SOC 2”; “unhackable”; “fully secure” | Security incident or control change | Trust §11 |
| PW1-CLM-035 | Accessibility | Some surfaces have accessibility-oriented tests; no WCAG certification | Scope-limited a11y notes in historical UX FVs | E2 | B1.6.5 / B1.7.5 docs disclaim full WCAG; H1 skip-link contract | IMPLEMENTED WITH LIMITED EVIDENCE | Not a certified a11y program | HOLD | If mentioned, only “selected authenticated surfaces have accessibility tests”; not homepage a11y | (no current public wording approved) | “WCAG 2.2 AA certified”; “fully accessible website” | Public-page a11y audit | Later public implementation |
| PW1-CLM-036 | Performance and reliability | Specific uptime, latency, or savings figures may be published | No SLA/uptime measurement authority | E0 | TG3 notes SLA engine out of scope; no SLA docs | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | “99.9% uptime”; “faster than X”; “save N hours” | Measured Production SLO program | Not PW-1 |
| PW1-CLM-037 | Pricing and “free” claims | Pricing, plans, or “free” access are published | No pricing routes or Stripe | E0 | No pricing pages; commercial surfaces absent | NOT PRESENT | Closed beta is not a published price | PROHIBIT | n/a | (none) | “Free”; “free forever”; “start free”; listed prices | Pricing authority + implementation | PW-3 must not invent prices |
| PW1-CLM-038 | Pricing and “free” claims | Closed beta implies a free or trial product | No trial UX; no quota product | E0 | No trial/quota UI | UNKNOWN | Closed beta ≠ free claim | PROHIBIT | n/a | (none) | “Start trial”; “unlimited”; “free while in beta” without a commercial authority | Commercial policy document | Commercial owner |
| PW1-CLM-039 | Customer/user counts | Any specific customer, user, company, or usage count | Only QA/fixture orgs in evidence | E0 | DATA-TRACK QA org; BETA1-FV tester memberships are QA; no traction metrics in UI | NOT PRESENT | QA ≠ customers | PROHIBIT | n/a | (none) | Any numeric traction; “used by N companies” | Independent customer-count authority | Never from fixtures |
| PW1-CLM-040 | Testimonials / logos / reviews | Testimonials, customer logos, or review scores | None in product UI | E0 | No testimonial/logo/review widgets in `src/app` | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | Quotes, logos, star ratings, “as used by” | Permissioned relationship evidence + PW-1 update | PW-3 |
| PW1-CLM-041 | Compliance and certification | SOC 2, ISO 27001, or similar certification | None found | E0 | No certification artifacts | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | Named certifications | Actual certificate + date + scope | Legal/security owner |
| PW1-CLM-042 | Compliance and certification | AVG/GDPR compliant as a legal conclusion | Privacy/export/erasure called future/out of scope in DATA/Beta docs | E0 | DATA/Beta roadmap exclusions | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | “AVG-proof”; “fully GDPR compliant” | Legal review + product privacy program | Legal owner |
| PW1-CLM-043 | Support or SLA | Public SLA or 24/7 support | No SLA; closed-beta support mailto for admitted users | E5 (support link) | LR-2; `closed-beta-support-contact.ts`; env `CLOSED_BETA_SUPPORT_EMAIL` fail-closed | PARTIALLY IMPLEMENTED | Authenticated AppShell; not a public contact page | HOLD | Public site must not invent Contact/SLA; admitted-user support is env-gated | (no public SLA wording) | “24/7 support”; “enterprise SLA”; public contact form that does not exist | Support policy + public destination | PW-2 |
| PW1-CLM-044 | Roadmap and future-direction | Roadmap items may be stated as current capabilities | Problem catalogues and deferred TG lists are exclusions | E1 | SCOPE-FREEZE deferred lists; PW-0 deferred phases | PLANNED OR ENVISIONED | Future only if labeled | PROHIBIT | Future language must be explicit and not look like availability | (none as current capability) | Present tense for deferred suites | New implementation + FV | PW-3 future section only with HOLD items |
| PW1-CLM-045 | Public CTAs | “Sign in” is an accurate public CTA to the sign-in page | `/login` 200 on Production (H1-FV); existing accounts only | E5 | Login page; H1-FV | PRODUCTION VERIFIED | Existing accounts | ALLOW WITH QUALIFIER | Existing accounts only; destination is the sign-in page, not account creation | Sign in | “Sign in” presented as account creation | Registration-policy change | PW-2 |
| PW1-CLM-046 | Public CTAs | “Create account” / “Register” as public CTAs | `/register` exists but public policy fail-closes; live flag unknown | E3 | Register page redirect; `public-registration.ts`; PW1-RQ-002 | DISABLED OR INACTIVE | Public visitors must not be treated as eligible | PROHIBIT | n/a | (none) | Create account; Register; Join now | Public registration enablement + live smokecheck | PW-2 |
| PW1-CLM-047 | Public CTAs | “Request beta access” as a public CTA | No public intake route or governed visitor workflow | E0 | No App Router waitlist/request page; BQA waitlist is internal | NOT PRESENT | HOLD rather than invent | HOLD | Do not invent a form | (none until a destination exists) | Fake request-access form; “apply on this page” | New intake implementation | PW-2 |
| PW1-CLM-048 | Public CTAs | “Join waitlist” as a public CTA | BQA demand waitlist is internal support-admission, not public | E2 | `src/features/business-qualification/**`; no public page | IMPLEMENTED WITH LIMITED EVIDENCE | Internal BQA only | HOLD | Not a website waitlist | (none) | Public waitlist that writes BQA without a public UI | Public waitlist implementation | PW-2 |
| PW1-CLM-049 | Public CTAs | “Contact” as a public CTA | No public contact page; authenticated support mailto only | E3 | `closed-beta-support-contact.ts`; no `/contact` | PARTIALLY IMPLEMENTED | Authenticated, env-gated | HOLD | Do not publish a contact destination that does not exist | (none for public page) | Public contact page; exposing support mailbox in copy | Public contact destination | PW-2 |
| PW1-CLM-050 | Public CTAs | “View product” / marketing product tour | No public product pages | E0 | PW-0: no `(marketing)` / `(public)` group | NOT PRESENT | Current journey is login | HOLD | Current truthful journey is sign-in, not a tour | (none) | Product tour / screenshots implying a public app demo | Isolated public surface after design freeze | PW-2 / PW-13 |
| PW1-CLM-051 | Public CTAs | “Watch demo” | No demo route or video surface found | E0 | App Router inventory | NOT PRESENT | n/a | HOLD | Do not invent | (none) | Demo video CTA without a destination | Demo asset + hosting | PW-2 |
| PW1-CLM-052 | Public CTAs | “Start free” / “Start trial” | No trial or free-plan UX | E0 | No commercial surfaces | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | Start free; start trial; no credit card | Commercial authority | PW-3 |
| PW1-CLM-053 | Public CTAs | “Connect AI provider” | No provider-connect product | E0 | No AI provider adapters | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | Connect OpenAI/Anthropic/etc. | AI program | §10 |
| PW1-CLM-054 | Authenticated Home | Home uses AI ranking or AI summaries | Explicitly forbidden by H1 | E5 | H1 contract invariants; COMPOSITION | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | AI daily briefing; generative Home | H1 reopen | Protected P0 |
| PW1-CLM-055 | Agency/field/e-com completeness | TG2/TG3/TG4 are Production-verified customer offerings | ENG-ONB-PROD TG2–TG4 NOT VERIFIED IN PROD | E0 (positive prod) | ENG-ONB-1H-PROD | UNKNOWN | Schema may exist; product not positively verified | PROHIBIT | n/a | (none) | “Live for agencies/field/e-commerce customers in production” | Dedicated TG Production FV | Before any such copy |
| PW1-CLM-056 | Onboarding | V2 onboarding completion is Production verified | ENG-ONB-1H-PROD BLOCKED/PAUSED | E0 as PASS | `ENG-ONB-1H-PROD-…` | CONTRADICTORY | Local P1 vs parked Production gate | HOLD | Do not claim Production-verified V2 onboarding | (none) | “Guided onboarding is live in production” as V2 PASS | ENG-ONB-1H-PROD PASS | Onboarding owner |
| PW1-CLM-057 | E-commerce/fulfillment | Public storefront, checkout, or consumer ordering exists | TG4 is operator slice; Stripe absent | E1+E0 | TG4-FV exclusions; no storefront routes | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | Shop on ZyntixAI; checkout; pay online | Storefront program | PW-3 |
| PW1-CLM-058 | Construction/field | GPS, maps, route optimization, or mobile offline field app | Explicitly out of TG3 slice | E1 | TG3-FV / SCOPE-FREEZE deferred list | NOT PRESENT | Lightweight dispatch only | PROHIBIT | n/a | (none) | Route optimization; live GPS; offline field app | New field program | PW-3 |
| PW1-CLM-059 | Agency | Client portal, invoicing, retainers, timesheets as available | Deferred by TG2 freeze | E1 | TG2-FV exclusions | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | Client portal; invoicing; retainers as current | New agency program | PW-3 |
| PW1-CLM-060 | Integrations | Analytics, consent, or visitor tracking is present | PW-0 found none in `src` | E3 | PW-0 §5.1; no gtag/posthog in package.json | NOT PRESENT | n/a | PROHIBIT | Adding tracking would be new shared P1 scope | (none) | “We measure visitors with X”; implying a mature analytics product | New analytics authority | PW-0 P1 |
| PW1-CLM-061 | Closed-beta support | Admitted users may have an in-app support/feedback mailto when configured | LR-2 Production-verified on earlier SHA; fail-closed if env invalid | E4 | LR-2; `closed-beta-support-contact.ts` | RELEASE VERIFIED | Authenticated; env must be valid; mailbox value not published here | ALLOW WITH QUALIFIER | Closed-beta admitted users; **not a public contact page**; do not publish the address; not re-verified at H1 SHA | Closed-beta admitted users can use an in-app support & feedback contact when it is configured. | Public support SLA; publishing the address as marketing | Support env/policy change | PW-2 |
| PW1-CLM-062 | Shared platform foundation | One shared Core, one Home, one capability model, fail-closed nav | 4TG architecture | E4 | MASTER-FV; AppShell gating; module-registry | RELEASE VERIFIED | Unresolved context → Home-only nav | ALLOW WITH QUALIFIER | Shared foundation ≠ four complete editions available | Target groups share one product core and one Home; unused modules stay hidden. | Four separate products / four public dashboards | Gating change | PW-3 |
| PW1-CLM-063 | Public access model | Manufacturing is a supported target group | BQA `architecture_gap` (not TG4 admission) | E1 | SCOPE-FREEZE / 4TG notes | SCOPED OR DESIGNED | Not TG4 | PROHIBIT | n/a | (none) | Manufacturing edition available | New operating-model authority | PW-3 |
| PW1-CLM-064 | Traction | DATA import execution metrics are customer traction | QA execution metrics are not customers | E5 | DATA-TRACK-FV; DATA-1J (QA organization, not customers) | NOT PRESENT | QA org only | PROHIBIT | n/a | (none) | “We imported N customers for clients” | Real customer dataset with permission | Traction §14 |
| PW1-CLM-065 | AI capabilities | Brand Brain `ai_inferred` means live generative AI | Canonical truth excludes `ai_inferred` | E2 | SMM Brand Brain domain (canonical excludes ai_inferred) | SCOPED OR DESIGNED | Social domain architecture | PROHIBIT | n/a | (none) | “AI writes your brand strategy” | Live LLM pipeline + human-review UX evidence | §10 |
| PW1-CLM-066 | Trust | “Your data never leaves Europe” | Production region notes exist in some FVs; not a legal/data-residency contract for all processors | E1 | DATA-TRACK-FV region note is infrastructure observation, not a public residency guarantee | UNKNOWN | Multiple processors (host, email, Instagram when enabled) | PROHIBIT | n/a | (none) | Data-residency guarantees | Legal + processor map | Trust §11 |
| PW1-CLM-067 | Performance | Accuracy, savings, growth, or guaranteed results | No measurement evidence | E0 | None | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | Guaranteed results; “increase revenue”; “100% accurate” | Measurement program | PW-3 |
| PW1-CLM-068 | Documents / reporting | General document management or reporting dashboards are product modules | No DMS/reporting module in registry | E0 | module-registry; App Router | NOT PRESENT | Private storage exists for social/data-intake only | PROHIBIT | n/a | (none) | “Document OS”; “analytics dashboards” | New module + FV | PW-3 |
| PW1-CLM-069 | Organization/workspace model | Four operating-model selection is Production-verified for new orgs | ONBOARDING-1A implements `course_seller` / `service` / `field_operations` / `product_operations`; ENG-ONB-PROD V2 **BLOCKED**; zero `v2_completed` Production orgs | E3 | `operating-model.ts`; ONBOARDING-1A; ENG-ONB-1H-PROD | IMPLEMENTED AND INTEGRATION TESTED | Product onboarding; not public signup | ALLOW WITH QUALIFIER | Implemented in-repository; **V2 onboarding not Production-verified**; not a public industry picker | Operators can be assigned one of four operating-model contexts in the product. | “Choose your industry on the public website”; “all four models are live in Production onboarding” | `PASS — ENG-ONB-1H-PROD` | Onboarding owner |
| PW1-CLM-070 | Tasks, attention | Standalone Tasks and Attention modules exist for admitted operators | B1-FV Production **read** of Tasks/Attention on earlier SHA; Home composition is PW1-CLM-018 | E4 | B1-FV §§8 and Attention/NBA; `attention`/`tasks` modules | RELEASE VERIFIED | Capability-gated; closed beta | ALLOW WITH QUALIFIER | Closed-beta operator queues; last Production walk on pre-H1 SHA; **rule-based NBA, not generative**; not an AI command center | Admitted operators can use Tasks and Attention modules in the Beta-1 product. | “AI operating system”; claiming current-SHA Production verification from Home alone | Tasks/Attention re-FV at current SHA | PW-3 |
| PW1-CLM-071 | Course-seller/coaching context | ZyntixAI is a learner-facing LMS or public course catalog | Operator programs/enrollments/progress only; no consumer course-taking public surface | E0 | B1-FV scope; no public learn/catalog routes | NOT PRESENT | n/a | PROHIBIT | n/a | (none) | “Take a course on ZyntixAI”; public LMS; student marketplace | Learner-delivery program + Production FV | PW-3 |

**Register counts (master):** 71 claims (R1: +3 split/added rows; original 68).

| Factual status | Count |
| --- | --- |
| PRODUCTION VERIFIED | 11 |
| RELEASE VERIFIED | 10 |
| IMPLEMENTED AND INTEGRATION TESTED | 10 |
| IMPLEMENTED WITH LIMITED EVIDENCE | 2 |
| PARTIALLY IMPLEMENTED | 3 |
| SCOPED OR DESIGNED | 3 |
| PLANNED OR ENVISIONED | 1 |
| DISABLED OR INACTIVE | 3 |
| CONTRADICTORY | 1 |
| UNKNOWN | 4 |
| NOT PRESENT | 23 |
| **Total** | **71** |

| Public decision | Count |
| --- | --- |
| ALLOW | 3 |
| ALLOW WITH QUALIFIER | 30 |
| HOLD | 9 |
| PROHIBIT | 29 |
| **Total** | **71** |

ALLOW rows after R1: PW1-CLM-001, 004, 009. Each is a current Production-observed visitor fact that needs no beta/gating qualifier. CLM-011 was moved to ALLOW WITH QUALIFIER because the live registration flag was not re-probed.

---

## 8. Target-Group Truth Matrix

Do not flatten TG1–TG4 into one availability status.

| Target group | Scope authority | Implementation evidence | Test evidence | Production evidence | Gating | Known exclusions | Current truthful status | Allowed public treatment | Mandatory qualifier | Prohibited implication |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Course sellers / coaches (TG1, `course_seller`) | SCOPE-FREEZE; B1-FV; MASTER `TG1 = CLOSED WITH EVIDENCE`; H1 Home | CS operator CRM + Knowledge operator tools + Core Home/Tasks/Attention/Members | B1-FV packs; MASTER TG1 suite; H1 Home | **Home:** SHA `d110b6e3…` (H1-PROD). **Other CS modules:** B1-FV earlier deploy; leads/customers/tasks/progress **read** / fixtures; members **resting**. H1-FV did **not** new-login or re-walk CRM. | Knowledge/OCB packs; closed-beta PATH B historically; fail-closed nav | Not four dashboards; Social optional/OFF; DATA UI not CS product UI; **not learner-facing LMS**; V2 onboarding not Production-verified | **RELEASE VERIFIED closed-beta Course Sellers operator product; Home PRODUCTION VERIFIED at `d110b6e3…`; not a complete current-SHA Production-verified edition** | ALLOW WITH QUALIFIER | Invite-only closed beta (last governed policy); operator product, **not an LMS**; coaching is the same operating model; Home Production does not prove CRM/programs | “Course platform for the public”; “complete Production-verified CS edition”; all four TGs equally live |
| Agencies / business services (TG2, `service`) | SCOPE-FREEZE thin E2E; TG2-FV L5 **acceptance** | `src/features/projects/**`; leads/clients terminology; AppShell | TG2-FV; MASTER TG2 suite | ENG-ONB **NOT VERIFIED IN PROD**; MASTER deployments 0 at close | `foundation.service` = `context_ready` (not `beta_supported`) | Client portal, billing, retainers, SOW, capacity, marketplace, timesheets | **IMPLEMENTED AND INTEGRATION TESTED thin slice; not Production-proven; not proven closed-beta-eligible** | ALLOW WITH QUALIFIER | Thin Beta-1 workflow slice only; **not an available agency beta edition** | Complete agency edition; live for agency customers |
| Construction / installation / field service (TG3, `field_operations`) | SCOPE-FREEZE; TG3-FV | Sites, work orders, lightweight dispatch | TG3-FV; MASTER TG3 suite | ENG-ONB **NOT VERIFIED IN PROD** | `foundation.field-operations` `context_ready` | GPS/maps/routing, vehicles, materials, payroll, photos/signatures, mobile/offline, subcontractors | **IMPLEMENTED AND INTEGRATION TESTED thin slice; not Production-proven; not proven closed-beta-eligible** | ALLOW WITH QUALIFIER | Thin slice; lightweight dispatch ≠ route optimization; **not an available field beta edition** | Full field suite; GPS; route optimization |
| E-commerce / product / fulfillment (TG4, `product_operations`) | SCOPE-FREEZE; TG4-FV | Products, inventory, orders, fulfillment | TG4-FV; MASTER TG4 suite | ENG-ONB **NOT VERIFIED IN PROD**; TG4-FV fulfillment writes 0 | `foundation.product-operations` `context_ready`; **no Projects** | Storefront, checkout, payments, tax, marketplaces, WMS, returns, manufacturing (`architecture_gap`) | **IMPLEMENTED AND INTEGRATION TESTED thin slice; not a live storefront; not proven closed-beta-eligible** | ALLOW WITH QUALIFIER | Operator inventory/order slice, not consumer e-commerce; **not an available commerce beta edition** | “Sell online with ZyntixAI”; Stripe shop |

**Shared vs slice vs complete vs GA**

| Layer | TG1 | TG2 | TG3 | TG4 |
| --- | --- | --- | --- | --- |
| Shared platform foundation | Yes | Yes | Yes | Yes |
| Terminology/context adaptation | Yes | Yes | Yes | Yes |
| Thin workflow slice | CS Beta-1 operator edition (still Beta-1; not LMS) | Yes (defining scope) | Yes | Yes |
| Complete target-group experience | No (Beta-1 CS, not a full commercial suite or LMS) | No | No | No |
| Production verification | Home at `d110b6e3…`; other CS modules at earlier B1-FV SHA (read/fixture mix) | No positive | No | No |
| Closed-beta eligibility | Invite-only historically; CS tester/org in BETA1-FV/B1-FV | Not proven as live TG2 beta customers | No | No |
| General availability | No | No | No | No |

### 8.1 Course Sellers capability decomposition (R1)

H1 Production of `/home` does **not** elevate unrelated CS capabilities.

| Capability | Strongest tier | Factual status | Production status | Gating | Exclusions | Public decision |
| --- | --- | --- | --- | --- | --- | --- |
| Authentication / sign-in page | E5 | PRODUCTION VERIFIED | Login 200; H1-FV no new login; Home session via PROD-C1 | Existing accounts | Not signup | ALLOW WITH QUALIFIER |
| Closed-beta admission | E5 dated | PRODUCTION VERIFIED (checkpoint) | BETA1-FV/LR-1; later SHA unprobed | PATH B historically | Not GA | ALLOW WITH QUALIFIER |
| Organization membership | E5 | PRODUCTION VERIFIED | B1-FV/H1 org | Closed beta | Not public org create | ALLOW WITH QUALIFIER |
| Operating-model selection | E3 | IMPLEMENTED AND INTEGRATION TESTED | V2 not Production-verified | Onboarding | Not public picker | ALLOW WITH QUALIFIER |
| Authenticated Home | E5 | PRODUCTION VERIFIED | SHA `d110b6e3…` | Protected `/home` | Not public site | ALLOW WITH QUALIFIER |
| CRM / customers | E4 | RELEASE VERIFIED | B1-FV read-only, earlier SHA | CS caps | Not public CRM | ALLOW WITH QUALIFIER |
| Programs / enrollments / progress | E4 | RELEASE VERIFIED | B1-FV mixed read/fixtures | Knowledge caps | **No learner LMS** | ALLOW WITH QUALIFIER |
| Members | E4 | RELEASE VERIFIED | B1-FV resting | Invitation flags | Not public signup | ALLOW WITH QUALIFIER |
| Tasks / Attention modules | E4 | RELEASE VERIFIED | B1-FV read, earlier SHA | Caps | Not generative AI | ALLOW WITH QUALIFIER |
| Data import | E5 QA | PRODUCTION VERIFIED (DATA track) | QA org; no public UI | Operator DATA | Not website | HOLD |
| Social | E4/E5 resting OFF | PARTIALLY IMPLEMENTED | Separate enrollment | Gates default OFF | Not CS default | ALLOW WITH QUALIFIER / PROHIBIT always-on |
| Learner-facing LMS | E0 | NOT PRESENT | None | n/a | No catalog/take-course | PROHIBIT |

---

## 9. Access and CTA Truth Matrix

A route existing is not enough for `ALLOW`.

| CTA | Destination exists | Technical behavior | Governance/policy evidence | User eligibility | End-to-end evidence | Public decision | Required wording | Risk or blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sign in | Yes — `/login` | Renders Sign in; H1-FV 200 (no new login in FV) | H1-FV; middleware bounce for authenticated users | Existing accounts | E5 page + PROD-C1 Home session | ALLOW WITH QUALIFIER | Sign in (existing accounts) | Must not double as signup. PW-2 may use this CTA. |
| Create account | `/register` exists | Redirects unless public flag or trusted invite | **Technical** implementation exists; **policy** fail-closed; **live flag unknown** | Public visitors: do not treat as eligible | Historical 307 + source | PROHIBIT | Do not use | PW-2 must not ship this CTA. Requires admission owner + live smokecheck before any reconsideration. |
| Register | Same as above | Same | Same | Same | Same | PROHIBIT | Do not use | Same. PW-13 public release blocked on this remaining PROHIBIT unless policy changes. |
| Request beta access | No public page | None | No governed visitor intake | Unknown public | None | HOLD | None until a real workflow exists | PW-2 may **design** the job-to-be-done; **implementation** required before public release |
| Join waitlist | No public page | Internal BQA demand waitlist only | BQA support commands, not App Router | Internal support roles | Not a public e2e | HOLD | None | PW-2 may design; do not reuse BQA as a public waitlist without a new destination |
| Contact | No `/contact` | Authenticated mailto when env valid | LR-2; fail-closed email parse | Admitted users if configured | E4 in-app, not public | HOLD | None on public page | PW-2 may design public contact only with a non-authenticated destination |
| View product | No public product IA | Current `/` → login | PW-0 | Unauthenticated visitors see login | E5 current journey | HOLD | Do not claim a product tour | PW-2 may map a future tour; PW-13 required to isolate a public page |
| Watch demo | No | None | None | n/a | None | HOLD | None | PW-2 may design; asset + hosting required before public release |
| Start free | No | None | No pricing authority | n/a | None | PROHIBIT | Do not use | Commercial falsehood |
| Start trial | No | None | None | n/a | None | PROHIBIT | Do not use | Same |
| Connect AI provider | No | None | No provider adapters | n/a | None | PROHIBIT | Do not use | AI overclaim |

---

## 10. AI Claims Register

### What the repository proves

- **AI surfaces in production product UX:** Home explicitly **no AI ranking / no AI summaries** (H1). Attention **NBA** evaluates **fixed reason codes** with **fixed copy** (`evaluate-next-best-action.ts`).
- **AI-provider architecture:** No `openai`, `anthropic`, or `ai-sdk` dependency in `package.json`. No AI enablement env flag found.
- **User-supplied provider connections:** Not present.
- **Automation:** Social scheduling/publishing are gated and resting OFF; `SOCIAL_CALENDAR_AUTOMATIC_EXECUTION_ENABLED` is hardcoded `false` in `src/features/social-media/domain/calendar.ts`. This is not “AI automation of the company.”
- **Generated content:** Social docs mention review states; that is **not** a live LLM pipeline in dependencies.
- **Summaries / recommendations:** NBA recommendations are deterministic rules. Home composition is deterministic with a section cap.
- **Attention signals:** Domain rules + human operator queues.
- **Human review:** Operators act on tasks/attention; Social review architecture exists for publications. Human operation must not be hidden.
- **Cost or usage visibility:** Not present for AI.
- **Data sent to external AI providers:** Not evidenced (no LLM client).
- **Production enablement of generative AI:** **Not enabled.**

Public positioning for later PW-3: treat any AI mention as a **supporting, non-generative** capability inside a broader operator product / intended Business Operating System, unless a later authority adds evidence.

| Class | Decision | Notes |
| --- | --- | --- |
| Rule-based next-best-action / no AI ranking on Home | ALLOW WITH QUALIFIER | PW1-CLM-027 |
| “AI runs your company” | PROHIBIT | No evidence |
| “Fully autonomous” / “zero human input” | PROHIBIT | Operators required |
| “Guaranteed accurate” | PROHIBIT | PW1-CLM-067 |
| “Connect any AI provider” | PROHIBIT | PW1-CLM-028 |
| “Unlimited AI” / “AI included free” | PROHIBIT | No AI product metering or commercial AI SKU |
| Brand Brain as live generative AI | PROHIBIT | PW1-CLM-065 |
| LLM chatbot as the product | PROHIBIT | Contradicts PW-0 and this register |

---

## 11. Trust, Privacy, Security and Compliance Register

| Topic | Kind | Public decision | Allowed factual building block | Prohibited overstatement |
| --- | --- | --- | --- | --- |
| Authentication | Verified technical control | ALLOW WITH QUALIFIER | Signed-in sessions; login exists | Bank-level auth; unnamed SSO |
| Authorization / roles | Verified technical control | ALLOW WITH QUALIFIER | Role-aware product surfaces in tests | “Perfect access control” |
| Organization isolation | Verified technical control | ALLOW WITH QUALIFIER | Org-scoped loaders; foreign org does not silently fall back (H1) | Absolute isolation guarantee |
| RLS | Verified technical control (tests/migrations) | ALLOW WITH QUALIFIER | RLS policies exist and are tested | “RLS means you are compliant” |
| Private uploads | Verified technical control in DATA/social tracks | HOLD for public homepage | Not a public-site feature | “Secure cloud drive for everyone” |
| Encryption | Partial (e.g. invitation tokens hashed; social credential encryption in SMM docs) | HOLD | Do not specify algorithms in marketing | “Bank-level encryption” |
| Privacy policy / GDPR-AVG legal | Legal conclusion | PROHIBIT | None | “AVG compliant”; “GDPR certified” |
| Security (absolute) | Unsupported assumption | PROHIBIT | Describe named controls only | “Fully secure”; “enterprise-grade security” |
| Backups | Ops notes in some PROD docs | PROHIBIT as customer SLA | None | Backup SLA |
| Monitoring / availability | No SLO authority | PROHIBIT | None | 99.9% uptime |
| Certifications | Not present | PROHIBIT | None | SOC 2; ISO 27001 |
| Accessibility | Tests/contracts, not certification | HOLD | None on public site yet | WCAG certified |
| Data never leaves Europe | Unknown / multi-processor | PROHIBIT | None | Residency guarantee |

---

## 12. Integration and External-Service Register

| Service | Installed | Adapter | Configured (contract) | Enabled by default | Tested | Production verified | Public |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Supabase | Yes | Yes | Required public env names | Core runtime | Extensive | Yes (many FVs) | Auth product, not a public API |
| Vercel | Host | `vercel.json` crons empty | Site origin | Production www | Browser packs | Yes (www evidence) | Host yes; not a marketing claim required |
| Resend | Yes | Invitation delivery | Key/from/allowlist **names** | Delivery default OFF in example | Invitation tests | Historical allowlisted | Not a public mail product |
| Stripe | No | No | No | n/a | Out of TG4 | No | PROHIBIT |
| Instagram / Meta | Code | OAuth/publish | Env gates | Default OFF | Heavy social tests | Controlled write, then OFF | Gated closed-beta only |
| Storage | Via Supabase | DATA + social media | Private buckets | Fail-closed without keys | DATA-1D etc. | QA | Not a public CDN product |
| Analytics (gtag/PostHog/etc.) | No | No | No | n/a | n/a | n/a | NOT PRESENT |
| LLM providers | No | No | No | n/a | Anti-LLM boundary tests in some suites | No | PROHIBIT |

Never expose credentials. Flag names only.

---

## 13. Pricing and Commercial Claims

| Topic | Finding | Public decision |
| --- | --- | --- |
| Public pricing page | NOT PRESENT | PROHIBIT prices |
| Subscriptions / Stripe | NOT PRESENT | PROHIBIT |
| “Free” / “free forever” | No commercial authority | PROHIBIT |
| Trial | NOT PRESENT | PROHIBIT |
| Quotas / usage limits as a sold plan | NOT PRESENT | PROHIBIT |
| Waitlist (public) | NOT PRESENT | HOLD |
| Invite-only closed beta | Evidenced | ALLOW WITH QUALIFIER (access model, not a price) |
| Public registration | Fail-closed | ALLOW that it is unavailable; PROHIBIT signup CTAs |

Closed beta is **not** automatically “free.” Absence of a price is not permission to say “free.”

---

## 14. Traction and Social-Proof Register

| Candidate | What it actually is | Public use |
| --- | --- | --- |
| Production QA organizations | Synthetic/QA tenants in FVs | PROHIBIT as customers |
| DATA import row counts | QA execution metrics | PROHIBIT as traction |
| Seeded/fixture users | Test fixtures | PROHIBIT as active users |
| Beta invitation / allowlisted tester | Admission test, not a customer base | PROHIBIT as “customers” |
| Internal quotes | Not found as testimonials | PROHIBIT invented quotes |
| Logos | None + no permission evidence | PROHIBIT |
| Outcome metrics (time saved, revenue) | None | PROHIBIT |

**Rule restated:** database rows, imported contacts, and QA orgs are not ZyntixAI customers.

---

## 15. Prohibited-Claims Register

| ID | Prohibited claim | Why prohibited | Current contradictory or missing evidence | Evidence required to reconsider | Earliest reconsideration |
| --- | --- | --- | --- | --- | --- |
| PW1-PRH-001 | All four target groups are fully available | Thin slices + no TG2–4 Production proof; CTX not `beta_supported` | MASTER acceptance ≠ public availability; ENG-ONB TG2–4 NOT VERIFIED IN PROD | Per-TG Production FV + admission policy + PW-1 update | After those FVs; not PW-3 |
| PW1-PRH-002 | Works for every type of business | Only four frozen contexts; manufacturing gap | SCOPE-FREEZE | New TG authority | Later TG program |
| PW1-PRH-003 | Complete all-in-one platform | Deferred suites (portal, storefront, GPS, billing, DMS, reporting) | Slice exclusions | Complete-edition contracts + FV | Not before those programs |
| PW1-PRH-004 | Fully autonomous AI | No LLM; Home forbids AI ranking; operators required | NBA rules; H1 | LLM + autonomy evidence (unlikely) | Future AI program |
| PW1-PRH-005 | Any AI provider can be connected | No adapters | `package.json` | Provider program + Production FV | Future AI program |
| PW1-PRH-006 | Free forever / unlimited usage | No commercial authority | No pricing | Pricing + quota policy | Commercial owner |
| PW1-PRH-007 | Specific customer or user counts | Only QA/fixtures | DATA/BETA1-FV QA | Independent customer census | Never from fixtures |
| PW1-PRH-008 | Testimonials or logos without permission | None present | No widgets | Relationship + permission evidence | PW-3 after PW-1 update |
| PW1-PRH-009 | Guaranteed results | No outcomes measurement | None | Measurement program | Not PW-1 |
| PW1-PRH-010 | Guaranteed accuracy | No accuracy authority | None | Evaluation program | AI/quality owner |
| PW1-PRH-011 | Complete legal compliance (AVG/GDPR) | Legal conclusion without program | Exclusions in DATA/Beta docs | Legal review + product privacy | Legal owner |
| PW1-PRH-012 | Unverified security certifications | None found | None | Certificate artifacts | Security owner |
| PW1-PRH-013 | Unverified uptime or SLA | No SLO | None | SLO program | Platform owner |
| PW1-PRH-014 | Integrations that are planned or disabled (Stripe, always-on Social, LLM) | Disabled or absent | Stripe absent; Social OFF; no LLM | Enablement FV | Matching track FV |
| PW1-PRH-015 | Open public self-registration | Policy fail-closed | `/register` redirect | Flag + Production smokecheck + this register update | Admission owner |
| PW1-PRH-016 | Chatbot-only positioning | Contradicts product architecture and PW-0 | H1; NBA; no LLM | None — prohibited as primary positioning | PW-3 must not reverse |
| PW1-PRH-017 | `/home` is the public website | Closed authenticated Home | H1; PW-0 P0 | Formal H1 reopen (not expected) | Never via public-web |
| PW1-PRH-018 | Social publishing is on for all closed-beta orgs | Resting OFF; separate enrollment | SMM FV; LR-2 | Gate-on Production FV | SMM owner |
| PW1-PRH-019 | Live consumer storefront / checkout | TG4 is operator slice; no Stripe | TG4-FV | Storefront + payments FV | TG/commerce owner |
| PW1-PRH-020 | V2 onboarding is Production verified | ENG-ONB-PROD BLOCKED | Parked dossier | `PASS — ENG-ONB-1H-PROD` | Onboarding owner |
| PW1-PRH-021 | Public “request beta access” / waitlist without a real intake destination | No public intake route | HOLD CTAs; BQA is internal | Named public workflow + PW-1 update | After PW-2 destination + implementation |
| PW1-PRH-022 | Complete Production-verified Course Sellers edition (inheriting Home Production) | H1 proves Home only; B1-FV CS modules are earlier SHA and often read-only | H1-FV no new login; B1-FV read/fixtures | Current-SHA CS module Production FV | After that FV; not PW-3 slogans |
| PW1-PRH-023 | Business Operating System implies autonomous operation | BOS is intended category (E1); Home forbids AI ranking; operators required | PW-0; H1; NBA rules | None for autonomy | PW-3 must not reverse |

---

## 16. Open Truth Questions

| ID | Question | Why unresolved | Public default | Evidence required | Resolution owner/phase | Latest blocking gate | Blocks PW-2 | Blocks PW-3 | Blocks design freeze | Blocks PW-13 | Blocks public deploy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW1-RQ-001 | Exact live Production deploy SHA vs H1 `d110b6e3…` at homepage publication | PW-1/R1 did not re-query the host | Use last governed Home SHA `d110b6e3…`; do not imply HEAD is live product | Fresh production SHA check | Release owner | Public-web implementation publication | No | No | No | No | **Yes** |
| PW1-RQ-002 | Exact live `PUBLIC_REGISTRATION_ENABLED` | Source defaults OFF; last prod 307 historical; not re-probed | Do not claim live flag; PROHIBIT Register/Create account CTAs | `GET /register` smokecheck without dumping secrets | Admission owner | Before any Register CTA | No (may not ship those CTAs) | No | No | No | **Yes** if copy asserts live unavailability as probed |
| PW1-RQ-003 | Whether “Business Operating System” is the public headline | Governance intent only; not in UI | ALLOW WITH QUALIFIER only; PW-3 may narrow | PW-3 decision vs this register | PW-3 | PW-3 copy freeze | No | **Yes** (must decide/narrow) | No | No | **Yes** if headline exceeds CLM-002 |
| PW1-RQ-004 | Public visitor intake (request access / waitlist / contact) | No destination | HOLD all such CTAs | Named route + workflow | PW-2 then implementation | PW-2 / PW-13 | No (may design) | No | No | **Yes** if those CTAs are in the public surface | **Yes** if those CTAs ship |
| PW1-RQ-005 | TG2–TG4 Production product verification | ENG-ONB parked; no positive live TG proof | PROHIBIT live TG2–4 availability | Dedicated Production FV per TG | TG owners | Before TG availability copy | No | **Yes** if copy implies availability | No | No | **Yes** if TG availability claimed |
| PW1-RQ-006 | Social publishing resting state on the **current** deploy | Last SMM FV OFF; later Home deploy | PROHIBIT always-on publishing | Current env-gate check (names only) | SMM owner | Before social copy | No | **Yes** if social-on copy | No | No | **Yes** if social-on claimed |
| PW1-RQ-007 | Commercial price of closed beta | No policy | PROHIBIT free/trial/price | Written commercial authority | Commercial owner | Before pricing sentences | No | **Yes** if prices invented | No | No | **Yes** if prices ship |
| PW1-RQ-008 | GDPR/AVG legal public statements | No legal dossier | PROHIBIT | Legal review | Legal owner | Before trust page | No | **Yes** if legal claims | No | No | **Yes** if trust page ships those claims |
| PW1-RQ-009 | Login page as future public brand surface | PW-0 U PW0-PB-037 | Treat login as P1; do not restyle via this register | PW-3 yes/no | PW-3 / design freeze | Design freeze | No | No | **Yes** for login restyle | **Yes** if login restyle implemented | **Yes** if restyle ships without freeze |
| PW1-RQ-010 | Dual-use `/` vs isolated public homepage | PW-0 U PW0-PB-036 | Current truth: `/` is not a marketing page | Architecture decision | PW-13 | PW-13 | No (journey of current `/` is known) | No | No | **Yes** | **Yes** if `/` replaced unsafely |
| PW1-RQ-011 | Whether closed-beta support mailto should be a public CTA | In-app only today | HOLD public Contact | Public destination that is not the authenticated shell | PW-2 | PW-2 | No (may design) | No | No | **Yes** if public Contact is in scope | **Yes** if Contact ships without destination |
| PW1-RQ-012 | ENG-ONB-1H-PROD unpark outcome | Tester unavailable; V2 not live-proven | HOLD V2 onboarding Production claims | `PASS — ENG-ONB-1H-PROD` | Onboarding owner | Onboarding Production FV | No | **Yes** if V2 onboarding claimed live | No | No | **Yes** if V2 claimed live |
| PW1-RQ-013 | Whether B1-FV CS module Production reads still hold at H1 SHA `d110b6e3…` | B1-FV used an earlier deploy; H1 did not re-walk CRM/programs/members | Treat CS modules as RELEASE VERIFIED, not current-SHA Production verified | CS module Production re-FV at current SHA | CS / Home owner | Before “Production-verified CRM/programs” copy | No | **Yes** if copy claims current-SHA CS Production | No | No | **Yes** if such copy ships |

Public defaults are conservative. Unresolved items do not block **this** PW-1 documentation freeze. They block **broader public wording** and, where marked, later copy freeze or public-web deployment. PW-2 may design HOLD journeys; it may not invent destinations.

---

## 17. Reverification Policy

Reverify affected claim rows (and this document’s counts) when any of the following occurs:

- Production deployment or product-code SHA change
- Feature-flag or env-gate change (registration, invitations, social, operator UI)
- Target-group `beta_supported` promotion or new TG FV
- Production-verification expiry or parked gate unparked
- Pricing or commercial-policy change
- Registration-policy change
- Integration enablement (Stripe, LLM, analytics, Social publishing)
- Security/control or RLS change
- New certification or legal opinion
- Homepage-copy or CTA change (must map to claim IDs)
- Evidence contradiction between a new FV and this register
- Authenticated Home reopen (would also violate PW-0)

Stale E5 claims must not be copied into final public sentences without a SHA/date check.

---

## 18. Handoff Contract

| Later phase | Must consume this register as |
| --- | --- |
| PW-2 Visitor Goals & Journey Map | CTA matrix and access truths; may not invent destinations marked HOLD/PROHIBIT |
| PW-3 Positioning & Messaging | Claim IDs for every public sentence; may **narrow** approved wording; may not broaden ALLOW or convert HOLD/PROHIBIT to ALLOW without new PW-1 evidence |
| PW-5 / PW-6 content and IA | Map each block to claim IDs |
| PW-8 trust/legal copy | Trust register; no legal overclaims |
| PW-12 pre-implementation checks | Reverify changeable E5 claims |
| PW-13 implementation planning | Must not implement CTAs or pages that this register PROHIBITs; HOLD items need a new destination authority |
| Production verification of public-web | Claim status reverified against live SHA before publication |

Binding rules:

1. Later phases may **narrow** approved wording.
2. Later phases may **not broaden** a claim without new PW-1 evidence (update this register first).
3. Every final public sentence must map to one or more claim IDs.
4. Claim status must be reverified before deployment.
5. Chatbot-only positioning remains prohibited (PW1-PRH-016).
6. Four-target-group availability remains prohibited until PW1-PRH-001 is formally reconsidered.
7. Authenticated Home remains out of public-web mutation (PW-0).

---

## 19. Acceptance Gate

PW-1 uses AND logic. One failed mandatory condition means PW-1 is not closed.

| # | Mandatory condition | Result |
| --- | --- | --- |
| 1 | Preflight matched expected baseline | **PASS** — root, branch `core/platform-readiness-20260707`, HEAD/upstream `40ab024…`, ahead/behind `0 0`, clean worktree |
| 2 | PW-0 found and remains binding | **PASS** — closed at `40ab024…` |
| 3 | Evidence hierarchy documented | **PASS** — §3 |
| 4 | Relevant release authorities inspected | **PASS** — §5.2 |
| 5 | Current code surfaces and gates inspected | **PASS** — §5.3 |
| 6 | Product vision separated from implementation | **PASS** — §2, §6, BOS as E1 |
| 7 | Implementation separated from production availability | **PASS** — TG2–4; MASTER limitation |
| 8 | Closed beta separated from GA | **PASS** — CLM-007 vs CLM-008 |
| 9 | All four target groups have separate evidence-based statuses | **PASS** — §8 |
| 10 | Core capabilities have individual claim entries | **PASS** — Home, CRM, programs, tasks/attention, projects, members |
| 11 | AI claims reviewed | **PASS** — §10 |
| 12 | Integrations reviewed | **PASS** — §12 |
| 13 | Trust, privacy, security, compliance reviewed | **PASS** — §11 |
| 14 | Access and CTA claims reviewed | **PASS** — §9 |
| 15 | Commercial and free-access claims reviewed | **PASS** — §13 |
| 16 | Traction and social-proof reviewed | **PASS** — §14 |
| 17 | Internal/QA/import data not represented as traction | **PASS** — CLM-039/064; PRH-007 |
| 18 | Prohibited claims explicit | **PASS** — §15 |
| 19 | Open questions have conservative defaults and gates | **PASS** — §16 |
| 20 | Every approved factual statement has evidence | **PASS** — ALLOW/ALLOW WITH QUALIFIER rows cite paths |
| 21 | Contradictions and exclusions visible | **PASS** — L5 vs Production; ENG-ONB parked; Social OFF |
| 22 | No final marketing copy created | **PASS** — building-block wording only |
| 23 | No PW-2 or PW-3 started | **PASS** |
| 24 | No existing file changed; only this file created | **PASS** — see appendix |
| 25 | No product, test, config, dependency, or infrastructure code changed | **PASS** |
| 26 | No secret or sensitive value recorded | **PASS** — flag names only; no mailbox/org UUID dump |
| 27 | No commit, push, or deployment | **PASS** — not authorized |

---

## 20. Final Status

```text
PASS — PW-1 PRODUCT TRUTH & CLAIMS REGISTER ESTABLISHED WITH EVIDENCE
PASS — PW-1-R1 PRODUCT TRUTH REVIEW CLOSED WITH EVIDENCE
```

R1 hardened Production vs release vs source, Course Sellers decomposition, ALLOW safety, and CTA/policy separation. No implementation is authorized. Do not start PW-2 or PW-3 without a separate governing prompt. Do not commit or push unless a later prompt explicitly authorizes it. Authenticated Home remains closed.

---

## 21. Evidence Appendix

### 21.1 Preflight commands and results

PowerShell-safe (`HEAD@{upstream}` quoted).

| Check | Result |
| --- | --- |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| Upstream SHA | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| Ahead / behind | `0 0` |
| Staged | none |
| Unstaged tracked | none |
| Untracked before this file | none |
| Worktree | clean |

`git log --oneline -5` (abridged): `40ab024 docs(public-web): freeze PW-0 charter and boundaries`; `49cd577 docs(home): close daily operating home hardening`; `f799389 test(home): reconcile production browser contract`; `d110b6e test(home): verify integrated home hardening regression`.

SHA chronology used in reconciliation: `427e3b5` (ENG-ONB P1-D docs) is an **ancestor** of `d110b6e3` (H1 product SHA).

### 21.2 Classification / ID counts

| Register | Original PW-1 | After R1 | ID range |
| --- | --- | --- | --- |
| Master claims | 68 | **71** | PW1-CLM-001 … PW1-CLM-071 |
| Prohibited-claims | 20 | **23** | PW1-PRH-001 … PW1-PRH-023 |
| Open questions | 12 | **13** | PW1-RQ-001 … PW1-RQ-013 |
| Target groups in matrix | 4 | 4 | TG1–TG4 |
| CTA rows | 12 | 12 | §9 list |

### 21.3 Commands not run

Per PW-1 non-goals: no `npm install`, formatter, build, or broad test run. No credentialed production API calls. No commit. No push. No deploy.

### 21.4 Changed-file proof

| Check | Result |
| --- | --- |
| Tracked modifications | none (expected) |
| Staged files | none |
| Untracked files | this file only: `docs/phases/PW-1-product-truth-claims-register.md` |
| Product / test / config / lockfiles | unchanged |
| Existing tracked documentation | unmodified |
| PW-0 file | unmodified |

### 21.5 Confirmation

No product code changed. No test code changed. No configuration changed. No existing tracked file was modified. PW-2 and PW-3 were not started. No implementation instructions or code patches are included. No secrets were recorded. Authenticated Home was not reopened.

---

## 22. R1 Independent Product-Truth Review Evidence

| Field | Value |
| --- | --- |
| Review date | 2026-09-14 |
| Baseline SHA | `40ab024f028f33a7aeeecc995e3b7996d4e7a9e8` |
| File reviewed | `docs/phases/PW-1-product-truth-claims-register.md` (untracked) |
| Product / test / config edits in R1 | **NONE** |
| Commit / push / deploy | **NOT DONE** |

### Authorities inspected

PW-1 register; PW-0; B1-GATE.1; H1-FV (including “New authenticated login = NOT DONE”); B1-FV Course Sellers (read/fixture mix; earlier www deploy); BETA1-FV / LR-1 / LR-2; ENG-ONB-1H-PROD (parked); BETA1-4TG-MASTER-FV / SCOPE-FREEZE; TG2–TG4 FVs; DATA-TRACK-FV; SMM publishing-reactivation FV; current source for login, register fail-closed, module-registry, NBA, calendar gate, operating-model.

### Totals reviewed

| Item | Original PW-1 | After R1 |
| --- | --- | --- |
| Master claims reviewed | 68 | 71 |
| Production-verified claims reviewed | 21 | 11 retained |
| Production claims retained | — | 11: PW1-CLM-001, 004, 007, 009, 010, 013, 014, 018, 026, 032, 045 |
| Production claims downgraded | — | 10: PW1-CLM-003, 011, 015, 016, 017, 027, 030, 031, 033, 061 |
| ALLOW reviewed | 4 | 3 retained (001, 004, 009); 011 changed |
| ALLOW WITH QUALIFIER | 27 | 30 |
| HOLD | 9 | 9 |
| PROHIBIT | 28 | 29 |
| Prohibited-register | 20 | 23 |
| Open questions | 12 | 13 |

### Production downgrades (reason)

| ID | From | To | Reason |
| --- | --- | --- | --- |
| PW1-CLM-003 | PRODUCTION VERIFIED | IMPLEMENTED AND INTEGRATION TESTED | Combined Home/NBA/package.json; H1-FV does not prove a product-category slogan in Production |
| PW1-CLM-011 | PRODUCTION VERIFIED | UNKNOWN | Live registration flag not re-probed; historical 307 ≠ current SHA certainty |
| PW1-CLM-015 | PRODUCTION VERIFIED | RELEASE VERIFIED | B1-FV Production **read** on earlier deploy; not H1 SHA |
| PW1-CLM-016 | PRODUCTION VERIFIED | RELEASE VERIFIED | B1-FV mixed read/fixtures; not LMS; not current SHA |
| PW1-CLM-017 | PRODUCTION VERIFIED | RELEASE VERIFIED | B1-FV members **resting**; earlier SHA |
| PW1-CLM-027 | PRODUCTION VERIFIED | IMPLEMENTED AND INTEGRATION TESTED | Rule-based NBA is source; not Production LLM-absence telemetry |
| PW1-CLM-030 | PRODUCTION VERIFIED | IMPLEMENTED AND INTEGRATION TESTED | Named vendor stack is dependency evidence; host remains CLM-004 E5 |
| PW1-CLM-031 | PRODUCTION VERIFIED | RELEASE VERIFIED | LR-1 earlier SHA; flags not re-verified at H1 |
| PW1-CLM-033 | PRODUCTION VERIFIED | IMPLEMENTED AND INTEGRATION TESTED | Source lock / tests, not Production service-role observation |
| PW1-CLM-061 | PRODUCTION VERIFIED | RELEASE VERIFIED | LR-2 earlier SHA; env-gated; not re-verified at H1 |

Retained Production claims were narrowed where needed (CLM-007 past-tense checkpoint; CLM-010 no new H1 login; CLM-013 membership only; CLM-018 Home composition only; CLM-032 `/home` protection).

### ALLOW change

PW1-CLM-011 ALLOW → ALLOW WITH QUALIFIER: open-signup unavailability is policy/source plus historical Production, not a re-probed live flag. A material qualifier is required.

### Course Sellers

Corrected from “PRODUCTION VERIFIED closed-beta edition” to **RELEASE VERIFIED operator product** with **Home PRODUCTION VERIFIED** at `d110b6e3…`. Not an LMS. H1 Home does not prove CRM/programs/members.

### TG2–TG4

Remain IMPLEMENTED AND INTEGRATION TESTED thin slices. Qualifiers now state **not proven available for closed-beta participation**.

### CTA

Sign in remains ALLOW WITH QUALIFIER. Create account / Register remain PROHIBIT (technical route ≠ policy; live flag unknown). HOLD CTAs may be designed in PW-2; they require implementation before public release.

### AI / trust / commercial / traction

No generative/autonomous/provider claims ALLOWED. BOS must not imply autonomy. Trust wording narrowed to tested controls. Pricing/free/trial remain PROHIBIT. QA/import rows remain non-traction.

### Rows added (no renumber of 001–068)

- PW1-CLM-069 operating-model selection (split from 013)
- PW1-CLM-070 Tasks/Attention modules (split from 018)
- PW1-CLM-071 learner-facing LMS prohibition

### Confirmation

No product code changed. Only this untracked PW-1 document was modified.

### R1 conclusion

```text
PASS — PW-1-R1 PRODUCT TRUTH REVIEW CLOSED WITH EVIDENCE
```
