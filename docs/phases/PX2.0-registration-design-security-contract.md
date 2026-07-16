# PX2.0 — Registration Design & Security Contract

| Field | Value |
| --- | --- |
| Phase | PX2.0 — Registration Design & Security Contract |
| Parent track | PX2 — Account Provisioning and Onboarding |
| Status | Contract only — **no implementation** |
| Baseline commit | `06aca085262fe59a9493da923d3229346d00b869` (`feat(auth): add platform entry and authentication`) |
| Branch | `core/platform-readiness-20260707` |
| Verdict target | `PASS / READY FOR PX2.1` when all acceptance criteria in §26 are met |

This document is the authoritative PX2.0 contract. PX2.1 may implement only what this contract allows. Invitation flows, billing, social login, and public release are out of scope.

---

## 1. Executive summary

PX1 delivered platform entry, password login, cookie SSR sessions, membership-scoped organization resolution, protected product routes, and logout. There is **no** `/register` route, signup action, auth callback, or invitation flow.

The foundation database already supports owner bootstrap via:

- `public.handle_new_user` — creates a `profiles` row on `auth.users` insert
- `public.create_organization_with_owner(p_name, p_slug, …)` — atomically creates one organization and one active `owner` membership for `auth.uid()`

**Recommended PX2.1 architecture:** controlled **server-side registration orchestration** (Option A) that:

1. validates and normalizes registration input;
2. creates the Supabase Auth user (`signUp`);
3. requires **email verification before product access**;
4. provisions organization + owner membership only through a **trusted server call** to a hardened `create_organization_with_owner` (or successor RPC) (Option C);
5. resumes incomplete provisioning idempotently using a **registration intent** stored for recovery (lightweight Option D), never trusting client-supplied role or organization ID.

Hard invariants: one successful public owner registration creates exactly one organization; that organization has exactly one initial owner membership for the registering user; public registration cannot attach to an existing organization; staff/viewer join only via a later invitation design.

---

## 2. Scope

PX2.0 documents and freezes:

- Current auth, organization, membership, RLS, middleware, and test architecture as verified in this repository
- The future `/register` process as a full state machine
- Provisioning architecture selection and rejection rationale
- Atomicity, rollback/recovery, idempotency, concurrency
- Email verification order and callback/redirect rules
- Authorization and role assignment rules
- Input validation / normalization / slug identity
- Threat model, rate limits, abuse controls
- Error, observability, routing/session contracts
- Test matrix and PX2.1 allow/deny lists
- Acceptance criteria and readiness verdict

---

## 3. Non-scope

PX2.0 does **not**:

- Implement `/register`, UI, server actions, RPCs, or migrations
- Mutate Supabase local/remote state, Vercel, env/secrets, or Git history
- Design the full invitation UX (only the hard separation from public registration)
- Add billing, subscriptions, multi-org purchasing, social login, or public release
- Change Leads / Customers / Tasks product behavior beyond documenting regression requirements

---

## 4. Current-state architecture findings

All findings below were verified against the repository at HEAD `06aca085…`.

### 4.1 Authentication

| Area | Location | Finding |
| --- | --- | --- |
| Browser client | `src/lib/supabase/client.ts` | `createSupabaseBrowserClient()` exists; **unused** by login UI (security tests prefer server actions) |
| Server client | `src/lib/supabase/server.ts` | Cookie SSR via `@supabase/ssr` `createServerClient` + Next `cookies()` |
| Middleware | `src/middleware.ts`, `src/lib/supabase/middleware.ts` | `updateSession` → `auth.getUser()` refresh; unauth protected → `/login?next=…`; auth on `/login` → `/` |
| Login | `src/features/auth/actions/auth-actions.ts` | `loginAction` → `signInWithPassword`; returns `{ ok, redirectTo }` |
| Logout | same + `src/components/app-shell.tsx` | `logoutAction` → `signOut()` → `redirect("/login")` |
| Schemas | `src/features/auth/server/login-schema.ts` | Zod: trim email, require password; optional `next` |
| Error mapping | `src/features/auth/server/normalize-auth-error.ts` | No raw provider messages; invalid credentials vs generic failure |
| Safe redirects | `src/features/auth/server/safe-return-path.ts` | Allowlist `/`, `/leads*`, `/customers*`, `/tasks*`; open-redirect hardened |
| Landing | `src/features/auth/server/resolve-authenticated-landing.ts` | 0 or N orgs → `/leads`; 1 org → `/leads?org=<id>` |
| Routes | `src/app/login/page.tsx`, `src/app/page.tsx` | Login + home entry; **no** `/register`, **no** `/auth/callback` |
| Email confirm | `supabase/config.toml` | Local `[auth.email] enable_confirmations = false`; `enable_signup = true`; `minimum_password_length = 6` |
| Magic/reset | — | **Not implemented** in app code |

### 4.2 Organizations and memberships

| Area | Location | Finding |
| --- | --- | --- |
| Profiles | `…50000_create_profiles_foundation.sql` | `profiles.id` = `auth.users.id` ON DELETE CASCADE; `display_name` nullable |
| Organizations | `…50001_create_organizations.sql` | `name`, **unique** `slug`, status `active\|suspended\|archived`; grants SELECT/UPDATE only (no INSERT) |
| Members | `…50002_create_organization_members.sql` | Roles `owner\|admin\|staff\|viewer`; status `invited\|active\|suspended\|removed`; UNIQUE `(organization_id, user_id)`; CASCADE from org/user |
| Tenant anchor | `…60000_…` | UNIQUE `(organization_id, id)` for composite FKs |
| Bootstrap RPC | `…50003_add_foundation_helpers.sql` | `create_organization_with_owner` SECURITY DEFINER, `search_path = ''`, EXECUTE to **`authenticated`** |
| Profile trigger | same | `on_auth_user_created` → `handle_new_user` inserts profile `ON CONFLICT DO NOTHING` |
| RLS | `…50004_enable_foundation_rls.sql` | Org SELECT via `private.is_org_member`; no org INSERT policy; member INSERT requires owner/admin |
| App resolution | `src/features/organizations/server/resolve-organization-context.ts` | Active membership only; rejects wrong/missing org |

**Critical security gap for registration:** any authenticated JWT can invoke `create_organization_with_owner` via PostgREST today and create **unlimited** organizations. The current RPC is **not** automatically safe to reuse for public registration.

**PX2.1 mandatory RPC / orchestration hardening (before exposing `/register`):**

1. Re-inspect the function body, grants, and EXECUTE privileges (`authenticated` today).
2. Prevent uncontrolled direct client/PostgREST use for multi-org creation (harden the function and/or replace with a registration-specific successor; do **not** rely on TypeScript-only checks).
3. Enforce authorization and provisioning intent server/database-side (caller = `auth.uid()`, reject active memberships, never accept client `organization_id` / role).
4. Enforce idempotency (natural key = Auth user id; second call must not create a second org).
5. Re-confirm `SECURITY DEFINER` + `search_path = ''` remain correct after changes.
6. Explicitly assess RLS-bypass risk of SECURITY DEFINER (bootstrap must create org+owner atomically without weakening other tenant boundaries).
7. Cover grants, direct-call denial, and multi-org prevention in automated tests.

**Product-access gap:** `resolveAuthenticatedLanding` sends users with **zero** memberships to `/leads`. Middleware allows authenticated access to `/leads`. Org-scoped loaders then fail with org-context errors. Incomplete provisioning must get an explicit recovery path, not silent product entry.

### 4.3 Database / helpers

- Helpers use `set search_path = ''` and fully qualified names.
- `private.is_org_member` / `private.has_org_role` are SECURITY DEFINER for RLS.
- Org creation is only intended via the SECURITY DEFINER RPC (bypasses missing INSERT RLS).
- No registration intent table exists.
- No live DB test suite; schema is exercised via migrations + mocked Vitest.

### 4.4 Testing and quality gates

| Area | Finding |
| --- | --- |
| Runner | Vitest (`npm run test` / `test:run`); also `typecheck`, `lint`, `build` |
| Auth tests | `tests/auth/*` |
| Org tests | `tests/organizations/resolve-organization-context.test.ts` |
| Security | `tests/security/*` source-boundary scans (no service role, no direct table writes for mutations) |
| Playwright | **Absent**; leads QA asserts package must not depend on Playwright |
| Docs convention | No prior `docs/` phase contracts; contracts historically live as executable tests + D-phase comments. This file establishes `docs/phases/` for PX track contracts. |
| CI | No `.github/workflows` in this worktree |

### 4.5 Documentation convention decision

No existing phase-contract folder existed. PX2.0 introduces:

```text
docs/phases/PX2.0-registration-design-security-contract.md
```

as the single authoritative contract for this phase (aligned with PX naming, parallel to D*-tagged executable contracts).

---

## 5. Registration state machine

### 5.1 States

| ID | State | Validity |
| --- | --- | --- |
| S0 | Anonymous on `/register` | Valid |
| S1 | Validating input (client) | Transient |
| S2 | Validating input (server) | Transient |
| S3 | Auth user created; email unverified; intent stored; **no** usable org | Temporarily valid |
| S4 | Awaiting email verification | Temporarily valid |
| S5 | Email verified; session present; provisioning not started | Temporarily valid |
| S6 | Provisioning in progress | Transient |
| S7 | Organization + owner membership complete | Valid terminal success |
| S8 | Product access granted (verified + provisioned) | Valid terminal success |
| F_DUP | Duplicate / replay blocked | Safe terminal (user-facing soft) |
| F_RATE | Rate limited | Safe terminal |
| F_AUTH | Auth signup failed | Safe terminal |
| F_PROV | Provisioning failed after Auth exists | Recoverable incomplete |
| F_ORPHAN | Auth exists, intent missing/corrupt, no membership | Recoverable with support path |
| F_DENIED | Authenticated user with membership tried `/register` | Redirect / deny |

### 5.2 Numbered process flow

For each step: trust boundary (TB), layer, inputs, outputs, authz, errors, safe client response, rollback/compensation, audit.

#### Step 1 — User opens `/register`

| Field | Contract |
| --- | --- |
| TB | Public internet → Next.js |
| Layer | App route `src/app/register/page.tsx` (future) |
| Input | None |
| Output | Registration form |
| Authz | Unauthenticated only for form; see Step 2 |
| Errors | Config / render failure |
| Safe response | Generic error page |
| Rollback | N/A |
| Audit | Optional `registration_page_viewed` (non-security) |

#### Step 2 — Authenticated-user behavior on `/register`

| Field | Contract |
| --- | --- |
| TB | Session cookie → middleware / page |
| Layer | Middleware + server page |
| Input | Session from `auth.getUser()` |
| Output | Redirect away from form |
| Authz | If **any active membership** → redirect to `resolveAuthenticatedLanding` (must **not** create another org). If authenticated, **email unverified** → verification pending screen. If authenticated, verified, **zero memberships** → resume provisioning UI (not a blank second registration). |
| Errors | Session parse failure → treat as anonymous |
| Safe response | Redirect; never show create-org form to provisioned users |
| Rollback | N/A |
| Audit | `register_blocked_authenticated` (security) |

#### Step 3 — Input: name, email, password, company name

| Field | Contract |
| --- | --- |
| TB | Browser → server action |
| Layer | Form + `registerAction` (future) |
| Input | `displayName`, `email`, `password`, `companyName` only |
| Output | Payload to validation |
| Authz | **Forbidden client fields:** `role`, `organizationId`, `slug` (user-chosen), `userId`, any service key |
| Errors | Extra fields ignored or rejected as invalid input |
| Safe response | Field errors only for allowlisted fields |
| Rollback | N/A |
| Audit | `registration_started` (no password, redact email) |

#### Step 4 — Client-side validation

| Field | Contract |
| --- | --- |
| TB | Untrusted |
| Layer | UI only |
| Input | Form fields |
| Output | UX hints |
| Authz | N/A |
| Rule | **Never authoritative** — always revalidated server-side |
| Errors | Inline UX |
| Rollback | N/A |
| Audit | None |

#### Step 5 — Server-side validation

| Field | Contract |
| --- | --- |
| TB | Trusted app server |
| Layer | Zod schema (mirror login pattern) |
| Input | Unknown JSON/FormData |
| Output | Normalized DTO or field errors |
| Authz | Reject if session already has active membership |
| Errors | `invalid_input`, `weak_password`, `authenticated_user_cannot_self_register` |
| Safe response | Mapped messages; no provider text |
| Rollback | N/A |
| Audit | Validation failure counts (no raw PII dumps) |

#### Step 6 — Field normalization

See §14. Apply before Auth signup and before RPC.

#### Step 7 — Create Supabase Auth user

| Field | Contract |
| --- | --- |
| TB | App server → Supabase Auth |
| Layer | Server action using **server** Supabase client (publishable key + cookie jar), **not** browser client, **not** service role for signup |
| Input | email, password; optional `options.data` with **only** `display_name`, `company_name` (non-authz) |
| Output | Auth user id; may or may not return session depending on confirmations |
| Authz | Public signup allowed only through this orchestrated action |
| Errors | Map to `email_unavailable`, `weak_password`, `rate_limited`, `temporary_service_failure` |
| Safe response | Enumeration-safe messaging (§10, §13) |
| Compensation | If signup succeeds but later steps fail → resumable (no Auth delete by default) |
| Audit | `signup_accepted` with user id when known |

Profile row: created by existing trigger `handle_new_user`.

#### Step 8 — Email verification handling

| Field | Contract |
| --- | --- |
| TB | Email provider → user → `/auth/callback` |
| Layer | Supabase Auth + future callback route |
| Input | Verification token/code |
| Output | Confirmed email; session established via code exchange |
| Authz | Token proves email control |
| Errors | `verification_expired`, `temporary_service_failure` |
| Safe response | “Link expired — request a new email” |
| Rollback | N/A |
| Audit | `verification_sent`, `verification_completed` |

**Product rule:** `email_confirmed_at` must be present before product routes are usable (see §10).

#### Step 9 — Create organization

| Field | Contract |
| --- | --- |
| TB | Trusted DB SECURITY DEFINER |
| Layer | Hardened `create_organization_with_owner` (or successor) |
| Input | Server-normalized `name`, server-generated `slug`; optional timezone/locale |
| Output | `organization.id` |
| Authz | Caller = `auth.uid()`; **reject** if user already has an active membership; **never** accept client `organization_id` |
| Errors | Slug unique violation → retry with new slug suffix (bounded); then `organization_creation_failed` |
| Safe response | Generic provisioning failure |
| Compensation | Same transaction as membership (Step 10) |
| Audit | `organization_created` |

#### Step 10 — Create owner membership

| Field | Contract |
| --- | --- |
| TB | Same DB transaction as Step 9 |
| Layer | Inside RPC — `role='owner'`, `status='active'`, `joined_at=now()` |
| Input | None from client |
| Output | Membership row |
| Authz | Role assigned **only** inside trusted function body |
| Errors | Unique `(organization_id, user_id)` → treat as success if already owner of that org (idempotent) |
| Safe response | Same as provisioning failure if unexpected |
| Compensation | Transaction rolls back org insert if membership insert fails |
| Audit | `owner_membership_created` |

#### Step 11 — Profile creation / update

| Field | Contract |
| --- | --- |
| TB | Trigger + optional app update |
| Layer | `handle_new_user` then `profiles` UPDATE own row |
| Input | Normalized `display_name` |
| Output | Profile with display name |
| Authz | `profiles_update_own` / own id only |
| Errors | Non-fatal if display name update fails after membership exists — retry on next login |
| Safe response | Do not block success if org+membership committed |
| Audit | Optional |

#### Step 12 — Session behavior after registration

| Field | Contract |
| --- | --- |
| After signup (confirmations on) | Prefer **no product session** until verified; show “check email” |
| After callback + provision | Cookie session via SSR; middleware refresh continues |
| After signup (confirmations off — local only) | Still gate product on `email_confirmed_at` **or** treat local as special-case for tests only; production must enable confirmations |

#### Step 13 — Redirect behavior

| Condition | Redirect |
| --- | --- |
| Signup accepted, unverified | Stay on `/register/check-email` (or equivalent) — **not** product |
| Verified + provisioned | `resolveAuthenticatedLanding` → `/leads?org=<new>` |
| Verified + incomplete | `/register/complete` resume |
| Authenticated + already member | Landing; never second org |
| Unsafe `next` | Ignore; use landing allowlist extended for `/register*` only as **sources**, not as open redirect targets into external URLs |

Extend `resolveSafeReturnPath` allowlist carefully: post-auth product targets remain `/`, `/leads*`, `/customers*`, `/tasks*`. Callback `next` must use the same helper.

#### Step 14 — Before email verification

- No access to `/leads`, `/customers`, `/tasks` (middleware or page gate on confirmed email **and** membership).
- May access `/login`, `/register/check-email`, resend verification.
- Organization **may** be created only after verification (recommended order — §10).

#### Step 15 — After email verification

- Callback exchanges code → session.
- Orchestrator runs provisioning if zero active memberships and intent present.
- On success → product landing.
- On failure → incomplete provisioning page with retry.

#### Step 16 — Per-step error handling

Map all provider/DB errors through a registration error normalizer (pattern: `normalize-auth-error.ts`). Categories in §17.

#### Step 17 — Retry behavior

| Situation | Behavior |
| --- | --- |
| Validation failure | User corrects fields; new submit |
| Auth signup duplicate | Enumeration-safe message; offer login |
| Network timeout after signup | Resume path on login/callback — do not create second Auth user |
| Provisioning failure | Idempotent retry of RPC only |
| Verification resend | Rate-limited; same safe messaging |

#### Step 18 — Rollback / compensation

Auth and Postgres are **not** one transaction.

| Failure | Compensation |
| --- | --- |
| Auth created, provision fails | **Keep** Auth user; mark/resume intent; do **not** auto-delete Auth user |
| Org+member RPC fails mid-function | DB transaction aborts — no orphan org |
| Intent write fails before signup | Abort; no Auth user |
| Rollback of Auth user | **Admin-only** manual cleanup; not automatic in PX2.1 |

#### Step 19 — Duplicate submit

Client: disable submit while pending (`pendingRef` / `aria-busy` pattern from leads contracts). Server: idempotency via email uniqueness + membership existence check + optional request idempotency key.

#### Step 20 — Concurrency

Two parallel register requests same email → Auth enforces one user; second maps to `email_unavailable` / safe duplicate. Two parallel provision calls same user → hardened RPC allows only first org; second raises “already a member” → map to success if membership already exists.

#### Step 21 — Same email re-registration

Treat as: if user exists → do not reveal; if unverified → offer resend; if verified → offer login. Never create second Auth user.

#### Step 22 — Same company name

**Allowed.** Organizations are unique by **slug**, not display name. Slug collision handled by suffix algorithm (§15).

#### Step 23 — Abandoned registration

Auth user may exist without org. Detection: authenticated, confirmed (or not), zero active memberships, intent present or absent. UX: resume or support. Cleanup of abandoned Auth users: **admin/ops**, not automatic delete in PX2.1.

#### Step 24 — Auth exists, provisioning incomplete

Login / callback / `/register/complete` must call `ensureOwnerProvisioning` (future): if active membership exists → land; else if intent usable → call RPC; else show safe failure / support.

#### Step 25 — Recover partial registration

Resumable model (not destructive rollback). Idempotent provision. Never attach to an existing foreign organization.

---

## 6. Recommended provisioning architecture

### Chosen model: **Option A + Option C (+ lightweight Option D intent)**

**Name:** Server-orchestrated Auth signup → email verification → SECURITY DEFINER owner bootstrap RPC.

**Order (production):**

1. Validate / normalize input (server)
2. Persist **registration intent** (company name + display name + correlation id) keyed by future user id or by signup metadata + server-side re-validation
3. `signUp` (Auth user) → profile via `handle_new_user`
4. Send / require email verification
5. On verified session: call hardened `create_organization_with_owner(name, slug)` → atomic org + owner membership
6. Update `profiles.display_name`
7. Redirect to membership-scoped landing

**Why this fits the repository:**

- Matches existing split: Auth (Supabase) + app DB bootstrap RPC already designed for owner creation
- Reuses `handle_new_user` profile bootstrap
- Keeps role assignment inside SECURITY DEFINER (never client)
- Aligns with current server-action auth style (`loginAction`)
- Avoids Auth-trigger org creation that would break future invitations

**Transaction boundaries:**

- Auth signup: Auth service boundary
- Org + membership: single Postgres transaction inside RPC
- Intent record: app DB (if table) or carefully scoped Auth `raw_user_meta_data` **non-authz fields only**, always re-validated

**Rollback / recovery:** Resumable provisioning (Option D light). Do not auto-delete Auth users on provision failure.

**Idempotency:** Natural key = Auth `user_id`. Precondition: zero active memberships. RPC returns existing org if already owner of the sole self-created org, or rejects second create.

---

## 7. Rejected alternatives

### Option B — Database trigger on new Auth user creates organization

**Rejected.**

| Criterion | Assessment |
| --- | --- |
| Reliability | Trigger errors are hard to surface to UX |
| Metadata | Would rely on `raw_user_meta_data` for company name — spoofable for content, dangerous if ever used for role/org |
| Invitation conflict | Future invited users also insert into `auth.users` → would incorrectly create orgs |
| Exactly one org | Difficult to gate vs later multi-tenant product needs |
| Debuggability | Poor vs server action logs |

### Pure Option A without RPC hardening

**Rejected as insufficient.** Client-callable `create_organization_with_owner` allows unlimited orgs today. App-only guards are bypassable with a user JWT + PostgREST.

### Service-role provisioning from the Next.js client bundle

**Rejected.** Service role must never appear in browser env. Existing security tests forbid service-role leakage.

### Creating membership via direct table INSERT from the browser

**Rejected.** RLS requires existing owner/admin to insert members — chicken-and-egg for first owner. Correct path is SECURITY DEFINER bootstrap only.

### Full pending-org row as tenant before Auth

**Rejected for PX2.1 complexity.** Intent without a real `organizations` row is enough; creating real orgs before email verification increases spam/orphan risk.

---

## 8. Data model contract

### 8.1 Effects of one successful registration

| Entity | Effect |
| --- | --- |
| `auth.users` | Exactly one new user; email unique; password hashed by Auth |
| `public.profiles` | Exactly one row (`id` = user id); `display_name` set |
| `public.organizations` | Exactly one new row; `status='active'`; `created_by` = user id (audit only) |
| `public.organization_members` | Exactly one row; `role='owner'`; `status='active'`; `joined_at` set |
| Email verification | `email_confirmed_at` set before product access |
| Intent / pending | Cleared or marked completed |

### 8.2 Before / after state table

| Phase | Auth user | Profile | Intent | Org | Owner membership | Product access | Validity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 Before | — | — | — | — | — | No | Valid |
| 1 After Auth signup | Yes | Yes (trigger) | Yes | No | No | No | Temp valid |
| 2 After email verification | Yes confirmed | Yes | Yes | No | No | No until provision | Temp valid |
| 3 After org provision | Yes | Yes | — | Yes | Yes (same txn) | Yes if confirmed | Valid |
| 4 After membership | Same as 3 | | | | | | Valid |
| 5 Full success | Yes confirmed | Named | Done | 1 | 1 owner | Yes | Valid |
| F Auth fail | — | — | Optional | — | — | No | Valid |
| F Auth yes / org fail | Yes | Yes | Yes | No | No | No | Temp valid / recoverable |
| F Org without owner | — | — | — | Yes | No | — | **Invalid — must not occur** (RPC txn) |
| F Membership without org | — | — | — | No | Yes | — | **Invalid — FK prevents** |
| F Second org same user via public register | — | — | — | 2+ | — | — | **Invalid — hardened RPC + UX** |

### 8.3 Constraints to preserve / harden

| Constraint | Purpose |
| --- | --- |
| `organizations_slug_unique` | Identity collision control |
| `organization_members_org_user_unique` | One membership per user per org |
| **New RPC guard** | Reject create if `auth.uid()` already has `status='active'` membership in any org |
| Optional unique partial index (future) | Not required if RPC guard + slug unique suffice |

### 8.4 Delete / cascade

- Delete Auth user → profile CASCADE → memberships CASCADE; orgs remain if `created_by` SET NULL (org not auto-deleted).
- Delete org → memberships CASCADE.
- **Invariant:** public registration must not leave an org without an owner; RPC transaction enforces create pairing. Post-hoc owner removal is outside PX2 (separate admin rules).

### 8.5 RLS expectations after registration

- New owner sees own org via `is_org_member`.
- Cannot see other orgs.
- Cannot insert into foreign orgs.
- Direct `organizations` INSERT still denied by RLS; only RPC path.

---

## 9. Organization and membership invariants

Hard guarantees for public owner self-registration:

```text
Eén succesvolle publieke ownerregistratie creëert exact één nieuwe organisatie.

De registratie creëert exact één initiële owner-membership.

De registrerende Auth-user wordt owner van uitsluitend de tijdens die registratie gecreëerde organisatie.

Publieke registratie accepteert geen bestaande organization-ID.

Publieke registratie accepteert geen clientgekozen rol.

Een retry creëert geen tweede organisatie of tweede initiële owner-membership.

Een failure laat geen bruikbare organisatie zonder geldige owner achter.

Staff en viewer kunnen niet via publieke self-registration worden aangemaakt.
```

Additional:

- Client cannot select or inject `owner|admin|staff|viewer`.
- Client cannot supply `organization_id` to join.
- Staff/viewer onboarding is **invitation-only** (post-PX2.1 design).
- Registration is not an organization switcher for multi-membership users.

---

## 10. Email verification contract

### Recommendation (required for PX2.1 production)

**Verify email before organization provisioning and before product access.**

| Topic | Decision |
| --- | --- |
| Mandatory before product? | **Yes** — gate on `user.email_confirmed_at` |
| Org/membership timing | **After** successful verification (in callback / complete step) |
| Why not provision first? | Reduces spam orgs, abandoned tenants, and abuse; matches “no product without verified owner” |
| UX cost | Extra step; mitigated by clear check-email page + resend |
| Security benefit | Attacker cannot lock a real company name/slug permanently without mailbox control as easily; still need rate limits |
| Redirect URL | App callback e.g. `/auth/callback` registered in Supabase `additional_redirect_urls` / `site_url` |
| Callback protection | After `exchangeCodeForSession`, redirect only via `resolveSafeReturnPath` (extend allowlist for `/register/complete` if needed as intermediate, then to product allowlist) |
| Allowed targets | Same product allowlist as login; never external |
| Expired link | `verification_expired` + resend |
| Resend | Rate-limited; enumeration-safe response always |
| Login while unverified | Deny product; show verify/resend; do not reveal whether password was correct beyond normal login mapping **or** if login succeeds with session, immediately route to verify wall (prefer confirmations enabled so login fails until confirmed — align with hosted Auth config) |
| Verified but not provisioned | Auto-resume provisioning |
| Provisioned but unverified | Must not happen in recommended order; if local config has confirmations off, still enforce app-level gate or enable confirmations for non-local |
| Resume | `/login` or `/register/complete` with same email ownership |

**Local note:** `supabase/config.toml` currently has `enable_confirmations = false`. Local `config.toml` is **not** proof of remote production Auth settings.

**PX2.1 / pre–PX2-R1 requirement:** before live browser verification (PX2-R1), prove the target staging/production Auth configuration matches this contract (email confirmations enabled, password minimum ≥ 8, redirect URL allowlist includes `/auth/callback`, SMTP/resend limits sane). Document evidence in PX2.1 notes; do not treat local defaults as production truth.

---

## 11. Atomicity and rollback contract

| Question | Answer |
| --- | --- |
| Auth ok, org fails? | Keep Auth; retain intent; show resume; no auto Auth delete |
| Org ok, membership fails? | Impossible if using single RPC transaction — both commit or neither |
| Org create fails? | No org row; resume with same Auth user + intent |
| RPC succeeds but client loses response? | Treat as success on retry: detect existing active membership for `auth.uid()` and land; do not create a second org |
| Verification callback opened multiple times? | Idempotent exchange/provision; land if already complete |
| Org without valid owner? | **Forbidden**; RPC must insert owner in same transaction |
| Membership without org? | **Forbidden** by FK |
| Multiple orgs from one registration? | **Forbidden**; hardened guard + idempotent retry |
| Same Auth user provisioned twice? | Second call no-ops or errors mapped to success if already active owner of one org |
| Auth + DB one transaction? | **Impossible** across Supabase Auth and Postgres — use resume, not cross-system txn |
| Idempotent retry? | Key = `auth.uid()`; check existing active membership first |
| Required uniques | Slug unique; `(organization_id, user_id)` unique; Auth email unique |
| Natural idempotency key | Auth user id (optional server-generated registration intent as secondary) |
| Who may recover incomplete? | The same authenticated user (self-serve resume); ops/admin for orphan without intent |
| Rollback vs resume? | **Resume** preferred; destructive Auth rollback = admin only; **no** automatic Auth-delete as default rollback |
| Detect orphaned Auth user | Confirmed or unconfirmed user with zero memberships after signup age threshold (ops query) |
| Detect orphaned organization | Org with zero `owner` active memberships (ops query; should not occur from RPC) |
| Automatic cleanup | Clear/complete intent flags; **not** auto-delete users/orgs in PX2.1 |
| Admin cleanup | Orphan Auth users, stuck intents, rare bad rows |
| User-visible errors | Stable categories §17 only |
| Server-only logs | Provider codes, SQLSTATE, stack, emails at debug with redaction policy |

---

## 12. Idempotency and concurrency contract

| Scenario | Required behavior |
| --- | --- |
| Double-click submit | Single in-flight client; server safe if duplicated |
| Two parallel identical requests | One Auth user; one org |
| Same email two browsers | Auth uniqueness; safe messages |
| Network loss after server success | Client retry must resume deterministically from Auth user + membership state |
| Retry after timeout | Resume provision; no second org |
| Retry after Auth created | Skip signup; provision |
| Retry after org created | Detect membership; land |
| Callback opened twice | Second exchange/provision idempotent |
| Verification link reused | Supabase behavior + app idempotent land |
| Client-only submit disable | **Insufficient alone** — server/RPC idempotency is mandatory |
| Request idempotency key | Optional header/body UUID stored hashed with intent (nice-to-have PX2.1; user id remains primary) |

---

## 13. Authorization contract

| Rule | Requirement |
| --- | --- |
| Public registration creates | Only a **new** org + **owner** for the new user |
| Role from client | **Rejected** — ignore or hard-fail |
| Organization ID from client | **Rejected** |
| Metadata | May carry `display_name`, `company_name` only; **never** trust `role`, `organization_id`, `is_admin` |
| Role assignment code | SQL body of bootstrap RPC only |
| Server-generated | `slug`, `organization.id`, `membership.id`, `role`, `status`, timestamps |
| Invitations | Explicitly **out of PX2.1**; public register must not become join-by-code |
| Browser org/membership inserts | Forbidden for bootstrap |
| Service role | Server-only if ever introduced; **prefer** authenticated SECURITY DEFINER with hardened guards over service role |
| Existing RLS | Preserved; do not weaken `is_org_member` boundaries |
| Privilege escalation | Prevented by ignoring client role/org and by RPC assigning fixed `owner` |

**Responsible code (PX2.1):**

- Orchestration: future `src/features/auth/actions/register-actions.ts` (name indicative)
- DB: hardened `create_organization_with_owner` or `complete_owner_self_registration`
- Middleware/page gates: email confirmed + membership for product paths

---

## 14. Validation and normalization contract

### 14.1 Display name

| Rule | Value |
| --- | --- |
| Min / max | 1–80 chars after trim |
| Trim | Leading/trailing whitespace stripped |
| Whitespace-only | Reject |
| Unicode | Allow letters/marks/spaces/hyphen/apostrophe; reject control chars |
| Storage | `profiles.display_name` plain text |
| XSS | React text escaping; never `dangerouslySetInnerHTML`; store raw text not HTML |

### 14.2 Email

| Rule | Value |
| --- | --- |
| Trim | Yes |
| Case | Lowercase for comparison/storage canonicalization in app validation; Auth stores per provider rules |
| Validation | Server Zod `.email()` + length cap (e.g. 254) |
| Duplicate | Enumeration-safe message |
| Uniqueness | Auth enforces |

### 14.3 Password

| Rule | Value |
| --- | --- |
| Minimum | **≥ 8** for product (stricter than local `minimum_password_length = 6`; align hosted Auth config to ≥ 8 in PX2.1) |
| Maximum | 72–128 (reject absurd lengths; bcrypt practical limits) |
| Whitespace-only | Reject |
| Logging | **Never** |
| Analytics | **Never** |
| Storage | Auth only |
| Errors | `weak_password` without policy details that help attackers beyond minimum length hint |

### 14.4 Company name

| Rule | Value |
| --- | --- |
| Min / max | 2–100 chars after trim |
| Trim | Yes |
| Duplicates | Allowed for display name |
| Display vs slug | Display = user-facing name; slug = server-generated identity |
| Unicode | Allow; slug transliterates / falls back (§15) |
| Impersonation | Reserved names/slugs block system impersonation (`admin`, `login`, `register`, `zyntix`, etc.) |
| Rename later | Out of PX2.1; slug stability policy in §15 |

Client validation = UX only; server always revalidates.

---

## 15. Slug and organization identity contract

| Topic | Contract |
| --- | --- |
| Created at registration? | **Yes**, server-side |
| User chooses slug? | **No** in PX2.1 |
| Algorithm | 1) NFKC normalize company name 2) lowercase 3) replace non `[a-z0-9]` with `-` 4) collapse hyphens 5) trim hyphens 6) max length 48 7) if empty → `org` 8) if reserved → prefix `org-` 9) on unique violation append `-` + 4–8 char from random/nanoid 10) bounded retries (e.g. 5) |
| Canonicalization | Store final slug only |
| Allowed chars | `[a-z0-9-]` |
| Unique constraint | Existing `organizations_slug_unique` |
| Reserved | At least: `admin`, `api`, `auth`, `callback`, `login`, `logout`, `register`, `settings`, `support`, `system`, `zyntix`, `www`, `null`, `undefined` |
| Non-Latin names | Transliteration best-effort; else `org-<suffix>` |
| Stability after rename | Slug remains stable unless explicit future admin tool; org **id** is the authorization key |
| Trust | **organization UUID** is tenant key in app (`?org=`); slug is secondary identity, **never** a security decision for membership |
| Slug availability API | **Do not** expose public slug-check that enables enumeration without rate limits; prefer silent suffixing |

---

## 16. Routing and session contract

### Unauthenticated

- `/register`, `/login` allowed
- Success path → check-email (not product)
- Unverified → no product

### Authenticated with valid membership

- `/register` → redirect landing
- Cannot create second org via public register

### Authenticated without membership

- Distinguish: incomplete (intent present) vs corrupt (no intent)
- Incomplete → `/register/complete`
- Corrupt → safe error + support; **no** product data access
- **Change from current PX1 behavior:** zero-membership users must **not** be sent into `/leads` as a happy path

### Multiple memberships

- Existing resolution rules remain; registration is irrelevant

### Callback

- Params: Supabase code/hash only + optional safe `next`
- Refresh session cookies
- Run provisioning check
- Fail closed to `/login` or `/register/check-email` with safe error

### Middleware updates (PX2.1)

- Treat `/register` like `/login` for “already provisioned → home”
- Protect product paths requiring: user + confirmed email + (membership resolved at page layer)

---

## 17. Error contract

| Category | Internal cause | User message (EN) | Representation | Log | Retry | Details to client | Enum risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `invalid_input` | Zod fail | Correct highlighted fields | 400 / action fail | info | Fix input | Field errors only | Low |
| `email_unavailable` | Auth duplicate | If an account exists for this email, sign in or reset access | 200 soft / fail | info | Login | No | Mitigated |
| `weak_password` | Policy | Choose a stronger password (min 8 characters) | fail | info | Fix | Min hint OK | Low |
| `rate_limited` | Auth/app limit | Too many attempts. Try again later | 429 / fail | warn | Later | No | Low |
| `email_verification_required` | Unconfirmed | Verify your email to continue | fail/redirect | info | Resend | No | Low |
| `verification_expired` | Token TTL | Link expired. Request a new email | fail | info | Resend | No | Low |
| `provisioning_failed` | RPC/transient | Could not finish setup. Try again | fail | error | Yes | No | Low |
| `provisioning_incomplete` | Partial | Finish setting up your account | redirect | warn | Resume | No | Low |
| `duplicate_request` | Idempotency | Already processing / already registered | soft success | info | Land | No | Low |
| `organization_creation_failed` | RPC | Could not finish setup | fail | error | Yes | No | Low |
| `membership_creation_failed` | Should be rare | Could not finish setup | fail | error | Yes | No | Low |
| `unauthorized` | No session for resume | Sign in to continue | fail | info | Login | No | Low |
| `authenticated_user_cannot_self_register` | Has membership | Already signed in | redirect | info | N/A | No | Low |
| `configuration_error` | Missing env | Service temporarily unavailable | fail | error | No | No | Low |
| `temporary_service_failure` | 5xx/network | Try again | fail | error | Yes | No | Low |
| `unknown_internal_failure` | Catch-all | Try again | fail | error | Maybe | No | Low |

**Never** return raw Supabase/PostgREST messages to the client (same rule as login).

---

## 18. Threat model

| Threat | Impact | Likely attack | Prevent | Detect | Test | Residual |
| --- | --- | --- | --- | --- | --- | --- |
| Mass account creation | Cost, spam orgs | Scripted signup | Rate limit, captcha (staging+), verify-before-provision | Signup velocity logs | Rate-limit tests | Low-volume manual abuse |
| Bots | Same | Headless forms | Captcha required before PX2-PUB; honeypot optional | Same | Bot suite later | Medium until captcha ships |
| Credential stuffing | Account takeover | Password lists on login | Existing login limits; registration separate | Failed login spikes | Login regression | Residual on reused passwords |
| Email enumeration | Privacy | Probe signup/login | Uniform messages; timing care | Enum attempt patterns | Enum tests | Minor timing residual |
| Org/slug enumeration | Competitive intel | Slug probe API | No public slug check | 404 metrics | Ensure no endpoint | Low |
| Duplicate submit | Double org | Double click | UI pending + RPC guard | Duplicate blocked events | Concurrency tests | Low |
| Replay | Duplicate provision | Retry tokens | Idempotent provision | Replay blocked | Callback twice | Low |
| CSRF | Unwanted signup | Cross-site POST | SameSite cookies; Next server actions origin checks | Odd Origin logs | CSRF attempt test | Low |
| Open redirect | Phishing | `next=` / callback | `resolveSafeReturnPath` | Redirect deny logs | Existing + register tests | Low |
| XSS via name/company | Session theft | Script in fields | Escape; CSP later; store text | CSP reports later | Render tests | Low |
| SQLi | Data loss | Input to SQL | Parameterized RPC | DB errors | Fuzz validation | Low |
| Metadata manipulation | Priv-esc | `role=owner` in metadata | Ignore for authz; RPC fixed role | Authz tests | Inject role test | Low if followed |
| Role injection | Priv-esc | Form field | Schema strip | Same | Same | Low |
| Org ID injection | Tenant join | Hidden field | Reject | Same | Same | Low |
| Service role exposure | Full DB | Bundle leak | Never ship key; security tests | Secret scanning | Existing security tests | Low |
| Verification email abuse | Spam | Resend loops | `max_frequency` + app limit | Resend metrics | Resend tests | Medium |
| Race parallel register | Two orgs | Parallel RPC | DB guard | — | Parallel tests | Low |
| DoS | Outage | Flood | Rate limits / edge | Infra | Load later | Medium |
| Sensitive logging | Credential leak | Log password | Redaction policy | Log review | Lint/tests | Low |
| Error message abuse | Enum/info leak | Read errors | Stable catalog | — | Message tests | Low |
| Session fixation | Hijack | Fixate cookie | Auth issues new session on login/signup | — | Session tests | Low |
| Stale sessions | Confused access | Old cookie | Middleware `getUser` refresh | — | Middleware tests | Low |
| Email change takeover | Account steal | Change email | Out of PX2; `double_confirm_changes` already true in config | — | Future | N/A |
| Orphaned provisioning | Support load | Kill mid-flow | Resume path | Incomplete detected events | Failure injection | Medium |

### PX2.1 mandatory vs later hardening

**Mandatory for safe PX2.1:** email verification gate, RPC hardening (including grants / direct-call prevention / multi-org guard), server validation, enumeration-safe errors, safe redirects, idempotent provision, no service role in client, rate limit at least via Supabase Auth defaults + app-level submit throttle, middleware/register routing rules.

**May defer within PX2.1 implementation, but not past PX2-PUB:** captcha provider wiring (required before controlled public release).

**May defer further (without removing mandatory controls):** advanced anomaly detection, automatic orphan Auth purge, public slug availability API (should stay absent), social login.

---

## 19. Rate-limit and abuse controls

| Control | PX2.1 |
| --- | --- |
| Supabase `sign_in_sign_ups` | Rely on project config; document production values |
| Email send frequency | Align `auth.email.max_frequency` away from local `1s` for prod |
| App-level registration action throttle | Per-IP / per-email soft limit in action (best effort) |
| Resend verification throttle | Mandatory |
| Captcha | Required before PX2-PUB (controlled public release); may be implemented late in PX2.1 or as a PUB gate, but must not ship publicly without it |
| Disable anonymous signup | Already `enable_anonymous_sign_ins = false` |

---

## 20. Observability and audit contract

| Event | Security? | Fields |
| --- | --- | --- |
| `registration_started` | Op | request_id, env, ts |
| `signup_accepted` | Sec | request_id, user_id, env, ts |
| `verification_sent` | Sec | request_id, user_id?, env, ts |
| `verification_completed` | Sec | request_id, user_id, env, ts |
| `provisioning_started` | Op | request_id, user_id, env, ts |
| `organization_created` | Sec | request_id, user_id, organization_id, env, ts |
| `owner_membership_created` | Sec | request_id, user_id, organization_id, env, ts |
| `provisioning_completed` | Sec | same |
| `provisioning_failed` | Sec | request_id, user_id, safe_error_code, env, ts |
| `duplicate_replay_blocked` | Sec | request_id, user_id?, code, env, ts |
| `rate_limit_triggered` | Sec | request_id, env, ts |
| `rollback_attempted` / `rollback_failed` | Sec | Only if admin tooling added |
| `incomplete_provisioning_detected` | Sec | request_id, user_id, env, ts |
| `recovery_completed` | Sec | request_id, user_id, organization_id, env, ts |

**Forbidden in logs:** password, access/refresh tokens, full verification links, service-role secrets. Email: prefer hash or domain-only in security logs.

---

## 21. Test matrix

### Happy paths

- Valid new owner registration end-to-end (mocked Auth + RPC)
- Exactly one org created
- Exactly one owner membership
- Email verification success path
- Login after registration
- Correct redirects
- Product access only when verified + provisioned

### Validation

- Missing name / email / password / company
- Invalid email
- Weak password
- Whitespace-only fields
- Max lengths
- Unicode company/name
- Reserved slug sources
- Extra role/org fields rejected

### Security

- Inject `role=admin` / `role=owner`
- Inject `organizationId`
- Manipulate metadata role
- Unauthenticated direct RPC call denied meaningfully
- Authenticated member cannot re-register
- CSRF / open redirect attempts
- Email enumeration responses equalized
- Rate limit behavior
- Service role absent from client/bundle (existing security tests remain green)
- RPC grant / SECURITY DEFINER / `search_path` / multi-org guard / direct-call prevention
- No raw DB/Auth errors to client

### Idempotency / concurrency

- Double submit
- Parallel identical requests
- Same email concurrent
- Retry after Auth-only
- Retry after org
- Retry after membership
- Callback twice
- Verify link twice
- Assert single org / single initial membership

### Failure injection

- Auth signup fail
- Email send fail
- Org create fail
- Membership fail (RPC abort)
- Network fail after server success
- Callback fail
- Resume after incomplete
- Recovery fail path

### Authorization / tenant isolation

- New owner sees only new org
- No access to other orgs
- Cannot select existing org at register
- Cannot create staff/viewer via public register
- Org resolution remains membership-scoped
- Leads/Customers/Tasks boundaries intact

### Regression

- `/login`, logout, redirects, session refresh
- Auth error mapping stable
- Protected routes remain protected
- `npm run test:run`, `typecheck`, `lint`, `build` green

### Live browser verification (PX2-R1)

Repo currently forbids Playwright as a dependency in leads QA scope tests. PX2-R1 must either:

- use **manual** live browser verification checklist, or
- introduce an explicitly approved e2e harness under a governance change

Checklist items: `/register` render, keyboard nav / accessibility basics (labels, focus, errors), password managers, loading, duplicate-submit block, verification screen, resend, callback, callback replay, onboarding land, auth redirect from `/register`, mobile viewport, refresh, back button, incomplete provisioning recovery.

---

## 22. PX2.1 implementation allowlist

Confirmed by research — PX2.1 **may** include:

- `src/app/register/**` UI routes (form, check-email, complete)
- `src/app/auth/callback/**` (or equivalent) for email verification
- Registration Zod schemas + normalizers + slug helper
- Server action orchestration (`registerAction`, resend, complete)
- Migration to **harden** `create_organization_with_owner` (or add successor RPC + revoke/replace grants)
- Optional `registration_intents` (or equivalent) table migration **if** metadata-only intent is judged insufficient in PX2.1 design review
- Middleware updates for `/register` and email/membership gates
- Error mapping module for registration
- Idempotency/resume helpers
- Vitest unit/integration/security tests per §21
- Updates to this doc / README pointers
- Hosted Auth config notes: confirmations on, password min ≥ 8, redirect URL allowlist
- Rate-limit / captcha wiring as required for safe public use

---

## 23. PX2.1 implementation denylist

PX2.1 **must not** include:

- Invitation flows for staff/viewer/admin
- Open organization joining / join codes
- User-selectable roles
- Attaching registrants to existing organizations
- Multi-organization purchasing / second org via `/register`
- Billing / subscriptions
- Broad onboarding wizards beyond account + org bootstrap
- Social login (not required by current architecture)
- Deploy / PX2-PUB release activities
- Weakening RLS or exposing service role
- Public slug oracle endpoint
- Automatic destructive deletion of Auth users on failure

### Later phases

| Phase | Owns |
| --- | --- |
| PX2-QA | Security & regression closure of implemented PX2.1 |
| PX2-R1 | Live browser verification |
| PX2-PUB | Controlled publication |
| Future | Invitations, rename org, captcha ops polish, orphan cleanup tooling |

---

## 24. Open questions (cannot be resolved from repository alone)

1. **Hosted Supabase Auth settings** for staging/production (`enable_confirmations`, password length, SMTP, rate limits, redirect URLs) — local `config.toml` is not production truth.
2. **Captcha provider choice** (hCaptcha vs Turnstile) and credential availability — captcha is **required before PX2-PUB**; only the vendor/timing within PX2.1 vs PUB gate is open.
3. **Support process** for orphaned Auth users without intent (human ops channel).
4. **Whether organization display names** must be globally unique for business reasons (schema currently allows duplicates).
5. **PX2-R1 harness governance** — manual checklist vs approved exception to Playwright ban in leads QA scope tests.

These do **not** block the architectural contract: defaults above are mandatory unless humans explicitly override in writing before PX2.1.

---

## 25. Risks and required mitigations

| Risk | Mitigation in PX2.1 / QA |
| --- | --- |
| Unlimited org creation via existing RPC | **Must harden RPC** before exposing registration |
| Zero-membership users enter `/leads` | Change landing/middleware gates |
| Confirmations off locally ≠ prod | Explicit config checklist; app-level confirmed gate |
| Partial Auth without org | Resume path + observability |
| Email enumeration | Uniform responses |
| Invitation future clash | Never use Auth insert trigger for org creation |
| Metadata trust mistakes | Schema allowlist; authz ignore metadata |

---

## 26. Acceptance criteria (PX2.0)

| Criterion | Met? |
| --- | --- |
| Auth architecture researched | Yes §4.1 |
| Organizations/memberships researched | Yes §4.2 |
| Migrations/RLS researched | Yes §4.2–4.3 |
| One provisioning architecture chosen | Yes §6 (A+C+D-light) |
| Auth / verify / org / membership order fixed | Yes §6, §10 |
| Partial failures handled | Yes §11, §5 |
| Rollback/resume defined | Yes §11 |
| Idempotency defined | Yes §12 |
| Concurrency defined | Yes §12 |
| Owner role trusted-only | Yes §13 |
| No join existing org | Yes §9, §13 |
| Staff/viewer → invitations | Yes §3, §13, §23 |
| Email verification contract | Yes §10 |
| Safe redirects | Yes §5 step 13, §16 |
| Email enumeration | Yes §17–18 |
| Rate limit / abuse | Yes §18–19 |
| Logging without secrets | Yes §20 |
| Data model invariants | Yes §8–9 |
| Test matrix complete | Yes §21 |
| PX2.1 allow/deny lists | Yes §22–23 |
| No production/migration code in PX2.0 | Yes (docs only) |

---

## 27. Final readiness verdict

```text
PX2.0 VERDICT: PASS / READY FOR PX2.1
```

PX2.1 may start only after explicit human authorization. This phase adds documentation only.

---

## Appendix A — Key repository references

```text
src/lib/supabase/client.ts
src/lib/supabase/server.ts
src/lib/supabase/middleware.ts
src/middleware.ts
src/features/auth/actions/auth-actions.ts
src/features/auth/server/login-schema.ts
src/features/auth/server/normalize-auth-error.ts
src/features/auth/server/safe-return-path.ts
src/features/auth/server/resolve-authenticated-landing.ts
src/features/organizations/server/resolve-organization-context.ts
supabase/migrations/20260705150000_create_profiles_foundation.sql
supabase/migrations/20260705150001_create_organizations.sql
supabase/migrations/20260705150002_create_organization_members.sql
supabase/migrations/20260705150003_add_foundation_helpers.sql
supabase/migrations/20260705150004_enable_foundation_rls.sql
supabase/config.toml
tests/auth/*
tests/organizations/resolve-organization-context.test.ts
tests/security/*
```

## Appendix B — Existing RPC contract (as of PX1)

`public.create_organization_with_owner(p_name, p_slug, p_timezone?, p_locale?) → uuid`

- Requires `auth.uid()` and existing profile
- Inserts org + owner/active membership in one transaction
- On slug unique violation raises `organization slug already exists`
- **Missing for PX2.1:** reject when user already has an active membership; no idempotent “return existing” path

PX2.1 must close that gap in SQL, not only in TypeScript.
