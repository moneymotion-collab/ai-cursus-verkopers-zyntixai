# Invitations / Member Administration — Design, Security and Readiness Contract

| Field | Value |
| --- | --- |
| Capability | **Invitations / Member Administration** (shared platform foundation) |
| Document type | Design, security and readiness contract (**documentation only**) |
| Official phase number | **NONE ASSIGNED** — unnumbered shared-platform track (no B1.x invented) |
| Date | 2026-08-09 |
| Formal status | `OWNER REVIEW PASSED — APPROVED FOR DOCS-ONLY PUBLICATION` |
| Program context | **Post–Course Sellers Beta 1** shared-platform work |
| Course Sellers Beta 1 | `PRODUCTION VERIFIED, CLOSED AND PUBLISHED` — **not reopened** |
| Governing standard | `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` |
| Discovery predecessor | Invitations / Member Administration Design / Security / Readiness Preflight |
| Owner design decisions | Affirmed (`APPROVE INVITATIONS / MEMBER ADMINISTRATION OWNER DESIGN DECISIONS`) |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Contract baseline HEAD | `3a4b8bff93deaf45178128e6c937c5b7a4757677` |
| Parallel | `PARALLEL BLOCKED` |

**This document is the owner-reviewed design/security/readiness contract.** It is **not** published until docs-only publication succeeds, **not** implementation-ready, and **not** production-ready until a **separate** implementation authorization and later production gates succeed.

**IMPLEMENTATION IS NOT AUTHORIZED BY THIS CONTRACT OR BY DOCS-ONLY PUBLICATION ALONE.**

---

## 1. Purpose

Define the authoritative design, security and readiness contract for the next shared platform capability:

```text
Invitations / Member Administration (MVP)
```

Goals:

- enable multi-user Organizations beyond owner self-registration
- preserve generic membership architecture for future audiences
- reuse existing auth / org / membership / RLS foundations
- avoid Course-Seller-specific invitation semantics
- avoid premature universal-platform rewrite
- keep invitation domain separate from membership access

---

## 2. Authoritative baseline

| Field | Value |
| --- | --- |
| HEAD / upstream | `3a4b8bff93deaf45178128e6c937c5b7a4757677` |
| Subject | `docs(beta1): close Course Sellers Beta 1 program` |
| Divergence at preparation | `0 0` |
| Worktree at preparation | clean |

Course Sellers Beta 1 remains closed. This capability is **post-Beta-1** shared-platform work.

---

## 3. Current architecture (repository truth)

### Auth / profile / organization / membership

| Layer | Truth |
| --- | --- |
| Auth | Supabase Auth (`auth.users`) |
| Profile | `public.profiles` PK = `auth.users.id` |
| Organization | `public.organizations` |
| Membership | `public.organization_members` |
| Roles | `owner` \| `admin` \| `staff` \| `viewer` |
| Membership statuses | `invited` \| `active` \| `suspended` \| `removed` |
| Active-access helpers | require `status = 'active'` (`private.is_org_member` / `has_org_role`) |
| Product member-admin UI/API | **ABSENT** |
| Primary production membership create | owner self-registration / `complete_owner_self_registration` |
| App service-role client | **ABSENT** (publishable-key SSR clients only) |

### Existing invitation primitives — PARTIAL ONLY

Present:

- membership status `invited` (default)
- RLS `organization_members_insert_admin` (active owner/admin insert)
- RLS `organization_members_accept_invite` (self `invited` → `active`)
- trigger `private.guard_org_member_update` for that self-transition

Absent:

- email-first invitation object
- token model
- invitation application API / UI
- product invite email flow
- `inviteUserByEmail` usage

**Do not overstate existing functionality.** Partial RLS does not equal an invitation product.

---

## 4. Scope (MVP)

In scope for the first Invitations / Member Administration MVP:

- active member list
- pending invitation list
- create invitation (allowed roles only)
- secure invitation lifecycle (pending / accepted / revoked / expired)
- resend pending invitation
- revoke pending invitation
- expiration (7 days)
- existing-user acceptance
- new-user acceptance (join existing org; **no** owner-org creation)
- invitation audit/events
- `/settings/members` minimum operator surface
- secure acceptance UX

---

## 5. Non-goals (MVP)

Out of first MVP:

- suspend / reactivate / change role / remove member
- ownership transfer
- invite `owner`
- admin inviting `admin`
- billing seats / SSO / SCIM / bulk CSV / domain auto-join
- public invite links
- custom roles
- notification center
- audience-specific invitation columns
- adding an email provider without separate owner approval
- introducing a general-purpose app service-role client for invitation domain writes
- Coaching / other audience implementation
- inventing a B1.x phase number

---

## 6. Locked owner decisions

| # | Decision | Locked value |
| --- | --- | --- |
| 1 | Primary model | Separate email-first Invitation object |
| 2 | Inviter matrix | Owner→admin/staff/viewer; Admin→staff/viewer only |
| 3 | Admin→admin / owner | **DENIED** |
| 4 | Suspended/removed collision | No normal invite; requires later Member Admin |
| 5 | TTL | **7 days**; not user-configurable |
| 6 | Email delivery | Domain-first; delivery adapter separate |
| 7 | MVP boundary | Invite lifecycle only (no destructive member admin) |
| 8 | Acceptance identity | Authenticated + normalized email exact match |
| 9 | Resend | Same row + token rotate + refresh expiry |
| 10 | Audit | Dedicated append-only invitation events |
| 11 | Operator route | `/settings/members` (minimum surface) |
| 12 | Service-role | No general-purpose app service-role for first domain writes |
| 13 | Cross-audience | Audience-agnostic invitation data |
| 14 | Coaching | Design-only later; no parallel membership redesign |

---

## 7. Invitation ≠ Membership (invariant)

```text
INVITATION ≠ MEMBERSHIP
```

| Concept | Meaning |
| --- | --- |
| **Invitation** | Proposed organization access for an **email identity** |
| **Membership** | Recognized organization access for an **authenticated user** |

Primary MVP architecture uses a separate email-first Invitation domain object.

`organization_members.status = 'invited'` is **not** the email-first source of truth (membership requires `user_id`). Classify existing `invited` membership status as:

```text
LEGACY / INTERNAL COMPATIBILITY STATE
```

It must not be destructively removed by this track. It may later support known-user internal provisioning only. No new email-first flow depends on it.

---

## 8. Conceptual data model

### `organization_invitations` (conceptual name)

| Field | Meaning | Nullability | Lifecycle / security |
| --- | --- | --- | --- |
| `id` | Invitation id | NOT NULL | Public opaque id for authorized ops; not a secret |
| `organization_id` | Target org | NOT NULL | Tenant scope |
| `email_normalized` | Invitee email after trim+lowercase | NOT NULL | Privacy-sensitive; identity key |
| `role` | Snapshot target role | NOT NULL | Must be invite-allowed role |
| `status` | `pending` \| `accepted` \| `revoked` \| `expired` | NOT NULL | Persisted lifecycle; see §9 |
| `invited_by_member_id` | Actor membership id | NOT NULL | Audit / authority provenance |
| `token_hash` | Hash of raw token | NOT NULL while credential valid; cleared/rotated on resend/revoke/accept/expire-materialize | **Never selectable via ordinary list/read projections** |
| `expires_at` | Absolute expiry timestamp | NOT NULL while pending | 7-day window |
| `accepted_at` | Acceptance time | NULL until accepted | Terminal |
| `accepted_by_user_id` | Accepting auth user | NULL until accepted | Bound to `auth.uid()` |
| `revoked_at` | Revocation time | NULL until revoked | Terminal |
| `created_at` / `updated_at` | Row timestamps | NOT NULL | Audit |
| `last_sent_at` | Last resend/create delivery attempt marker | NULL allowed | Optional; domain ≠ delivery success |

No speculative audience/profile fields.

### `organization_invitation_events` (conceptual name)

Append-only event rows referencing invitation + org, with safe structured metadata. Pattern follows Attention event immutability intent without reusing Attention tables.

---

## 9. Invitation status / lifecycle

Persisted statuses: **`pending` \| `accepted` \| `revoked` \| `expired`**

```text
pending → accepted (terminal)
pending → revoked (terminal)
pending → expired (terminal; materialized when needed — see uniqueness)
```

### Effective vs persisted expiry

| Concept | Rule |
| --- | --- |
| **Effective expired** | `status = pending` AND `current_time >= expires_at` |
| **Acceptance / resend of effective-expired** | **DENIED** (treat as unavailable / require new invite) |
| **Persisted `expired`** | Materialized lazily inside a transactional operation when a new invite must replace an effectively expired pending row |

**No scheduler / background job** is required solely to expire invitations.

### Uniqueness / expiry coexistence (locked — publication-critical)

PostgreSQL cannot safely enforce “one pending unless expired” with a volatile `now()` predicate in a unique index.

Therefore the implementable model is:

```text
PARTIAL UNIQUE on (organization_id, email_normalized)
WHERE status = 'pending'
```

And create-invite MUST, in one transaction when an effectively expired pending row exists:

1. lock that row
2. set `status = 'expired'` (and invalidate token credential)
3. insert the new `pending` invitation

This guarantees:

- never two `status = pending` credentials for the same org+email
- expired historical rows retained
- no scheduler
- concurrent creates serialize on the locked row / unique constraint
- acceptance of a still-`pending` but time-expired row fails closed (`now < expires_at` required)

No reopen in MVP. After revoke/expiry, create a **new** invitation when collision rules permit.

---

## 10. TTL

| Rule | Value |
| --- | --- |
| Default validity | **7 days** |
| Create | `expires_at = created_at + 7 days` |
| Resend | `expires_at = resend_time + 7 days` |
| User-configurable TTL | **NO** |

**Deterministic boundary (locked) — used by create validation, resend eligibility, accept, and pending-list “effective status”:**

```text
CREDENTIAL VALID IFF status = pending AND current_time < expires_at
```

At/after `expires_at`: **DENIED** for accept/resend; create of a replacement invite materializes `expired` first (§9).

---

## 11. Identity / email contract

Normalization (locked):

```text
email_normalized = lowercase(trim(raw_email))
```

Acceptance requires:

1. authenticated session
2. server-derived authenticated email from Supabase auth user/session
3. `normalize(auth_email) == invitation.email_normalized`
4. where current registration policy requires verification, acceptance must **not** weaken verification

Invariant:

```text
AN AUTHENTICATED USER WITH A DIFFERENT EMAIL IDENTITY MUST NEVER BE ABLE TO
CLAIM ANOTHER PERSON'S INVITATION.
```

Never trust client-submitted `email`, `user_id`, `organization_id`, or `role` as authority.

| Case | Result |
| --- | --- |
| Missing auth email | fail closed |
| Unverified email when verification required | fail closed |
| Normalized mismatch | `email_mismatch` |
| Case-only / whitespace-only difference after normalize | treated equal (match) |

---

## 12. Duplicate / uniqueness semantics

Invariant:

```text
AT MOST ONE status=pending INVITATION PER (organization_id, email_normalized)
```

Same email may have pending invites to **different** organizations.

Historical `accepted` / `revoked` / `expired` rows may coexist.

| Collision | Result |
| --- | --- |
| Duplicate create while **valid** pending | Idempotent return of existing pending **or** deterministic `invite_already_pending` — never second valid credential |
| Duplicate create while **effective-expired** pending | Transactionally materialize `expired`, then insert new pending (§9) |
| Active membership | `already_member` — no invite |
| Suspended membership | `existing_membership_requires_admin_action` — no invite |
| Removed membership | `existing_membership_requires_admin_action` — no invite |
| Revoked / persisted expired | New invite allowed if membership state permits |

Concurrency enforced by **row lock + partial unique constraint**, not UI alone.

---

## 12A. Email → membership collision resolution boundary (locked)

Memberships key by `user_id`; emails live on `auth.users`. Create-invite collision checks therefore need a **server-side email→user→membership** resolution path.

**Locked architecture:**

- Resolution occurs **only** inside SECURITY DEFINER invitation RPCs (create; accept also derives `auth.uid()` email).
- Narrow privileged DB function may read `auth.users.email` for collision checks **scoped to the authorized actor’s organization operation**.
- **No** general-purpose application service-role client.
- **No** browser/client access to `auth.users`.
- **No** client-supplied `user_id` as authority.
- Results returned to the authorized Owner/Admin are domain codes only (`already_member`, `existing_membership_requires_admin_action`, …) — not raw auth dumps.
- Unauthenticated / foreign callers must not receive an account-existence oracle.

If no matching auth user exists for the email: treat as **no membership collision** and allow invite creation (new-user path).

---

## 13. Inviter authority matrix (binding)

| Actor | May invite | May resend/revoke |
| --- | --- | --- |
| Owner (active) | `admin`, `staff`, `viewer` | invitations whose target role is `admin`, `staff`, or `viewer` |
| Admin (active) | `staff`, `viewer` | invitations whose target role is `staff` or `viewer` only |
| Admin | **NOT** `admin`, **NOT** `owner` | **NOT** Owner-created `admin` invitations |
| Staff / Viewer / Suspended | **DENIED** | **DENIED** |
| Anyone | **NOT** `owner` | — |

Explicit examples:

| Question | Answer |
| --- | --- |
| Can Admin revoke/resend an Owner-created **STAFF** invitation? | **YES** |
| Can Admin revoke/resend an Owner-created **VIEWER** invitation? | **YES** |
| Can Admin revoke/resend an Owner-created **ADMIN** invitation? | **NO** |

Authority is based on **current actor class vs invitation target role**, not merely original inviter identity.

Ownership transfer is a **separate future security-sensitive workflow**.

---

## 14. Actor authorization

Every mutate operation re-derives:

- `auth.uid()`
- active membership in target org
- actor role
- organization usability (**org must be `active`** for create/resend/accept/revoke — §38)
- requested/target role against matrix

Defense in depth:

```text
Application capability checks
+ authenticated server boundary
+ SECURITY DEFINER RPC with explicit actor re-derivation
+ database constraints / RLS / grants
```

**SECURITY DEFINER does not inherit caller RLS.** RPCs MUST re-derive actor membership/role and MUST use repository-hardened function conventions (including fixed `search_path` / schema qualification consistent with existing secure RPCs). RLS alone is insufficient protection for DEFINER functions.

---

## 15. Suspended / removed / active collisions

| Existing membership | Invite create | Accept |
| --- | --- | --- |
| Active | Deny — `already_member` | Safe idempotent already-member / no duplicate access |
| Suspended | Deny — `existing_membership_requires_admin_action` | Deny — no silent reactivation |
| Removed | Deny — `existing_membership_requires_admin_action` | Deny — no silent reactivation |

No silent reactivation via invitation MVP. No unauthorized email/account enumeration outside authorized org context.

---

## 16. Token security

App-managed invitation token:

- CSPRNG high-entropy raw token
- store **cryptographic hash only** (SHA-256 or platform-equivalent of the raw token; high-entropy token → keyed lookup by hash is acceptable; do **not** invent weak custom crypto)
- unique indexable `token_hash`
- single-use; expiry; revoke; replay denied
- resend rotates token and replaces hash immediately
- raw token never in DB plaintext, events, logs, analytics, localStorage, list APIs, Members UI, or error messages

Lookup: hash incoming raw token → query by `token_hash`.

**Token-hash visibility (locked):** ordinary invitation list/read mappers and RLS-selected projections **MUST NOT** expose `token_hash` to Owner/Admin UI or general APIs. Enforce via projection exclusion and/or column privileges / RPC-only credential access.

---

## 17. Raw token exposure boundary

| Allowed | Forbidden |
| --- | --- |
| Immediate server generation | Database plaintext |
| One-time acceptance URL construction inside server boundary | Audit/event payloads |
| Later email-delivery adapter | Logs / analytics |
| Controlled QA retrieval if separately authorized | Browser persistence / list APIs / Members workspace / error messages |

---

## 18. Resend contract

Resend **reuses the same pending invitation row** that is still **credential-valid** (`status = pending` AND `now < expires_at`).

Atomic effects (row lock required):

1. verify still valid pending
2. rotate token / replace hash (old token fails immediately)
3. refresh `expires_at` to now + 7 days
4. update `last_sent_at` if present
5. append `invitation_resent`

Concurrent resends: serialize on invitation row lock so exactly one authoritative `token_hash` remains; prior competing tokens invalid.

Must **not**: create second pending; resurrect accepted; reopen revoked; silently reopen expired.

**Effective-expired / revoked / accepted:** not resendable. Create a **new** invitation if otherwise allowed (materialize `expired` first when replacing effective-expired pending — §9).

Rate-limited per invite/actor/org.

---

## 19. Revocation contract

`pending` → `revoked` (terminal), including effective-expired pending rows that have not yet been materialized as `expired` (optional cleanup path) — or deny if already terminal.

- retain row for audit
- invalidate credential immediately
- acceptance afterward denied
- no hard delete as normal lifecycle

**Authority:** §13 target-role class rules.

Idempotent second revoke: safe terminal result. No deletion.

**Revoke vs accept race (locked):** invitation row is locked; exactly one of accept or revoke wins. Forbidden outcomes: active membership with revoked invitation credential still usable; membership created after successful revoke.

---

## 20. Acceptance contract (atomic)

Input authoritative value: **raw token only**.

Server derives auth user + email. DB derives invitation org/role.

Conceptual transaction (invitation row locked):

1. hash/lookup invitation
2. lock invitation
3. validate `status = pending`
4. validate `now < expires_at`
5. validate not revoked/expired
6. derive `auth.uid()` + authenticated email
7. normalize + exact match
8. validate org `active`
9. revalidate role against current invitation policy
10. evaluate membership collision
11. create membership `active` with `joined_at = now`
12. mark invitation `accepted`; set `accepted_at`, `accepted_by_user_id`
13. invalidate token credential
14. append `invitation_accepted`
15. commit

Any failure → **no partial write**.

Invariants:

- never: membership active while invitation credential remains reusable
- never: invitation accepted without membership creation (unless already-member idempotent path)
- double accept by same user: safe idempotent success
- concurrent accepts: at most one membership; unique `(organization_id, user_id)` + invite lock

---

## 21. Acceptance role revalidation

Invitation role is a creation-time snapshot. At acceptance:

| Check | Rule |
| --- | --- |
| Organization | Must be **`active`** |
| Target role | Must still be an invite-permitted role under current matrix |
| Target role `admin` | Must still satisfy owner-only invite privilege rules for fulfillment |
| Original inviter | **Need not** remain active/authorized (locked) |
| Inviter suspended/removed | Does **not** by itself invalidate a still-valid invitation |
| Privilege escalation | Denied if policy no longer permits that role fulfillment |

If org suspended/archived → acceptance denied.

---

## 22. Existing-user acceptance

| Situation | Behavior |
| --- | --- |
| Signed-out matching user | login → accept |
| Signed-in matching email | accept |
| Signed-in non-matching email | deny (`email_mismatch`) |
| Already active target-org member | safe deterministic already-member / idempotent |
| Suspended/removed target-org membership | deny — no silent reactivation |
| Double accept | safe/idempotent |

```text
Invite link → authenticate if needed → email match → accept RPC
→ membership active → redirect to invited Organization
```

Must **not** run owner self-registration / new-org provisioning.

---

## 23. New-user acceptance

```text
Invite link → sign-up/auth → verification if required → retain invite continuation
→ accept → join existing Organization → enter workspace
```

**Critical invariant:**

```text
INVITED NEW USER MUST NOT TRIGGER OWNER ORGANIZATION CREATION
```

Must bypass / branch away from `complete_owner_self_registration` and owner-first-run org creation. Owner onboarding checklist flows must not auto-run as if the user owns a new org.

Continuation across signup / email verification / login redirects uses **server-only** state (not editable client `organization_id`).

---

## 24. Acceptance route contract

**Locked pattern:**

1. Dedicated App Router route: `/invite/accept`
2. Initial landing may carry the raw token **once** into a server handler.
3. Server **immediately** exchanges it for a short-lived **server-only** continuation (httpOnly cookie / server session binding) and redirects to a **token-free** URL before auth round-trips.
4. Final accept consumes continuation / token via POST (or equivalent non-logged long-lived query) inside the atomic accept boundary.
5. Preserve continuation across login/signup redirects via server-only state.

Long-lived raw tokens in browser history, referrer, analytics, or logs are **forbidden**. Query-string-only long-lived tokens are **not** the MVP design.

---

## 25. Email delivery boundary

```text
DOMAIN-FIRST
EMAIL DELIVERY SEPARATE
```

Core invitation domain may be built/tested without adding Resend/SendGrid/Postmark/SMTP. Email-provider absence is **not** a blocker for first domain implementation.

**Complete Invitations capability may not be declared production-ready for normal users until a real delivery path is owner-approved and verified** (controlled QA, token secrecy, no uncontrolled recipients).

Provider-neutral conceptual interface later: `deliverInvitation({ organizationId, email, acceptanceUrl, … })`.

Existing Supabase Auth verification/reset email remains unchanged and is **not** the invitation mailer.

Invitation creation success ≠ email delivery success.

---

## 26. Email delivery event semantics

Domain events remain lifecycle events. Optional future delivery outcomes (`delivery_attempted` / `succeeded` / `failed`) are adapter concerns and must **not** mutate invitation lifecycle solely due to provider failure.

---

## 27. Rate limit / abuse

| Control | Requirement |
| --- | --- |
| Create invite | Rate-limit per actor/org |
| Resend | Rate-limit per invite/actor/org |
| Token entropy | High |
| Enumeration | No public account-existence oracle |
| Cross-tenant | Deny |
| Role/org tampering | Deny server-side |
| Replay | Deny |

**Classification (locked):**

- First internal/domain implementation slice: may proceed without public delivery.
- **Before any normal-user production readiness declaration:** create + resend rate limiting **MUST** exist.
- No Invitations capability may be declared production-ready without abuse protection.

---

## 28. Privacy / data minimisation

Store only: org, normalized email, role, inviter membership ref, lifecycle timestamps, token hash.

Do **not** store pre-acceptance phone, arbitrary profile, or audience-specific metadata.

---

## 29. Audit / event model

Dedicated append-only `organization_invitation_events` (conceptual).

MVP required types:

- `invitation_created`
- `invitation_resent`
- `invitation_revoked`
- `invitation_accepted`

Requirements: immutable after insert; org/invitation association; safe actor reference; timestamp; safe structured metadata if any.

Forbidden in events: raw token; passwords; session/cookies; unnecessary duplicated target email when invitation relation already identifies target.

**No `invitation_expired` event / no scheduler** for MVP. Expiry is effective via `expires_at` and materialized to `expired` only when transactional replacement requires it (§9).

Do **not** reuse Attention events. Do **not** rely solely on application logs. Audit write participates in the same transaction as the lifecycle mutation.

---

## 30. Member Administration MVP boundary

“Member Administration” in this contract means the **invite-centric MVP** above — **not** full membership mutation suite.

Allowed: read **active** members; manage invitations.

Not allowed in first MVP:

- suspend / reactivate / change role / remove
- ownership transfer

Do not implement merely because current RLS permits some updates/deletes. Existing DB policies that currently permit more than future UI are **not** product authorization.

---

## 31. Reserved owner-protection invariants

Future mandatory (reserved):

- ≥1 active owner always
- admin cannot modify/remove owner authority
- sole owner cannot suspend/remove/demote self
- invitation cannot produce owner
- ownership transfer explicit and separate

No first-MVP invitation path may create/transfer/demote/remove/suspend owner.

---

## 32. Operator workspace

Route: **`/settings/members`**

Minimum surface:

| Section | Content |
| --- | --- |
| Members | Active members only |
| Pending Invitations | Credential-valid pending only (default); effective-expired excluded or shown as unavailable for resend |
| Invite Member | Email + allowed role selector |

Pending fields: email, target role, status, invited by, created, expires.
Actions: resend, revoke.
No destructive member mutation controls in MVP.

Org URL-state must follow existing organization-context resolution conventions (membership-resolved org; never trust browser org id alone).

---

## 33. Workspace authorization / email visibility

**Locked:**

| Role | Access `/settings/members` | See member emails | See invitation emails | Invite mutate |
| --- | --- | --- | --- | --- |
| Owner | YES | YES (business-necessary minimum) | YES | YES (matrix) |
| Admin | YES | YES (business-necessary minimum) | YES | YES (matrix) |
| Staff | **NO** | — | — | NO |
| Viewer | **NO** | — | — | NO |
| Suspended | NO | — | — | NO |

**Why route-level email privacy is enforceable even though active members can SELECT membership rows under RLS:**

- `organization_members` rows contain **no email column**
- emails live on `auth.users` and are **not** exposed by ordinary membership/profile list patterns (assignee UIs use `display_name` / Team-member fallback)
- Members workspace email resolution uses the same narrow privileged server/RPC boundary as collision checks (§12A), available only to Owner/Admin on this route

---

## 34. Server result / error contract

Safe categories (repository Result-style):

| Code | Meaning |
| --- | --- |
| `success` | Completed |
| `already_member` | Active membership exists |
| `existing_membership_requires_admin_action` | Suspended/removed collision |
| `invite_already_pending` | Valid pending exists |
| `invite_not_found_or_unavailable` | Uniform fail-closed (foreign/unauth/malformed) |
| `invite_expired` | Expired (authorized contexts may use; public accept prefers unavailable where needed) |
| `invite_revoked` | Revoked |
| `email_mismatch` | Authenticated email ≠ invite |
| `forbidden` | Unauthorized actor |
| `invalid_input` | Validation |
| `unexpected` | Fail closed |

Authorized Owner/Admin within their org may receive useful domain codes. Unauthenticated/foreign/public acceptance flows must not provide an account/email/organization existence oracle — prefer `invite_not_found_or_unavailable`.

---

## 35. RLS contract (conceptual)

- Org A cannot read Org B invitations
- Owner/Admin may read invitation **metadata** within org
- `token_hash` never in ordinary selectable projections
- Staff/Viewer: no Members workspace access in MVP
- Mutations via SECURITY DEFINER RPCs with explicit actor checks; RLS/grants as defense in depth

No policy SQL in this document.

---

## 36. RPC / server boundaries (conceptual)

| RPC | Purpose |
| --- | --- |
| `create_organization_invitation` | Collision resolve (§12A); maybe materialize expired; create pending + hash + event; one-time link material server-side only |
| `resend_organization_invitation` | Row lock; rotate token; refresh expiry; event |
| `revoke_organization_invitation` | Row lock; pending → revoked; event |
| `accept_organization_invitation` | Token-only input; atomic accept |

List/read: server helpers under RLS for authorized Owner/Admin (no token hash).

Every RPC must remain safe against direct invocation without UI: forged org/role/email, foreign invitation id, suspended actor, repeated request.

---

## 37. Create invitation RPC (summary)

Inputs: `organization_id`, `email`, `target_role`
Server derives actor membership/role.
Validates org `active`, matrix, normalization, collisions via §12A, rate limit.
If effective-expired pending exists: materialize `expired` then insert.
Writes invitation + hash + `invitation_created`.
Returns safe invitation view; raw token only within authorized server delivery/QA boundary.

---

## 38. Organization state

| Org status | Create | Resend | Accept | Revoke |
| --- | --- | --- | --- | --- |
| `active` | YES | YES | YES | YES |
| `suspended` | **NO** | **NO** | **NO** | **NO** (fail closed) |
| `archived` | **NO** | **NO** | **NO** | **NO** (fail closed) |

Rationale: authorization depends on active membership resolution and org usability; suspended/archived cleanup revoke is deferred rather than inventing a privileged bypass in MVP.

---

## 39. Routing / onboarding interaction

Invite continuation must survive login/signup/verification redirects via server-only state.

Must avoid:

- `complete_owner_self_registration`
- accidental new Organization creation
- treating invitee as new owner for first-run checklist ownership flows

Invited members land in the **invited** Organization workspace after acceptance.

---

## 40. Cross-tenant failure contract

Org A actor + Org B invitation/member ids → no unauthorized data.
Foreign/malformed token → no org/email/name leak before proper identity boundary; uniform unavailable/invalid.
No URL/token existence oracle.

---

## 41. Test strategy

Automated matrix MUST cover at minimum:

Owner: admin/staff/viewer allowed · Admin: staff/viewer allowed; admin/owner denied · Staff/Viewer/Suspended denied · Foreign tenant denied · Duplicate + concurrent duplicate safe · Active/suspended/removed member collisions · Wrong email denied · Expired/revoked/old-token-after-resend/replay denied · Double accept safe · Revoke/accept race safe · Role/org parameter tampering denied · Malformed token/ID fail closed · Org suspended/archived denied · New invited user: **NO** owner-org creation · Effective-expired create materializes `expired` then new pending.

Layers: domain · DB/security · application · UI.

---

## 42. Production security matrix (later)

Same gates as §41 / §50, executed in controlled production QA after fixtures are owner-approved.

---

## 43. Production QA fixture plan

Reuse where safe: Org A Owner / Staff / Viewer · suspended actor · Org B isolation.

**Admin production QA actor:** not established as a standard Attention/NBA fixture identity. Future Admin invite tests require **explicit owner approval** to create/control an Admin fixture — do not invent one.

Likely later fixtures (not created now): controlled invitee mailbox · pending/expired/revoked invites.

Domain QA may use controlled acceptance-link retrieval. Email delivery QA is a separate gate: controlled recipient, no real customers, no persistent raw-token logs, known provider/test environment. No uncontrolled recipients.

---

## 44. Migration contract (future)

Additive-first. No destructive rewrite of `organization_members` or removal of legacy `invited` membership status enum value.

Likely package: invitation table · indexes · **partial unique pending** · event table · RLS · grants · RPCs · append-only event protections · hardened `search_path`.

Production backup/readiness before eventual schema apply. Actual migrations require **implementation authorization**.

---

## 45. Rollback / disable strategy

Prefer application/navigation feature gate to disable invitation UI without destructive schema rollback.

Pending invites may be revoked or left unavailable.

**Invariant:** accepted memberships are legitimate Membership records and MUST NOT be deleted simply because Invitations UI is rolled back/disabled.

---

## 46. Cross-audience reuse

Reusable for Course Sellers, Coaching/Mentoring, Communities/Memberships, Customer Success, and later families.

Invitation architecture remains:

```text
Organization + identity/email + role + invitation lifecycle
```

No Course Seller / Coaching / Membership / Customer Success / Agency / Fitness business fields on invitations.

---

## 47. Coaching dependency

```text
COACHING READINESS DESIGN: MAY PROCEED LATER IN PARALLEL AS DESIGN-ONLY
COACHING IMPLEMENTATION: NOT AUTHORIZED
```

Coaching must not redefine membership, roles, Invitation schema, or acceptance security. Coaching must not create a parallel invitation system.

---

## 48. Implementation slices (conceptual only — not official phase IDs)

```text
INV-T   typed domain + schemas + permissions/results
INV-DB  invitation/event schema + RLS + constraints (+ pending uniqueness)
INV-RPC create/resend/revoke/accept RPCs (+ email→user collision helper)
INV-I   server/application integration
INV-U   /settings/members + invite lifecycle UI
INV-A   acceptance/auth continuation UX (before/with INV-U as needed)
INV-E   email delivery adapter — SEPARATE OWNER APPROVAL if new provider/privilege
INV-R1  controlled browser/security verification
INV-PUB production publication closure
```

These names are **conceptual sequencing labels only**. No official phase numbering assigned.

---

## 49. Implementation dependencies

| Dependency | Class |
| --- | --- |
| Crypto/token primitive | REQUIRED BEFORE FIRST IMPLEMENTATION |
| Invitation + event schema/RLS/RPCs | REQUIRED BEFORE FIRST IMPLEMENTATION |
| Narrow email→user collision helper (DEFINER) | REQUIRED BEFORE FIRST IMPLEMENTATION (create path) |
| Acceptance route + auth continuation | REQUIRED BEFORE ACCEPTANCE UX |
| Owner-registration bypass for invitees | REQUIRED BEFORE ACCEPTANCE UX |
| Rate limiting | REQUIRED BEFORE PRODUCTION |
| Email delivery adapter | REQUIRED BEFORE NORMAL-USER PRODUCTION READINESS |
| Admin QA fixture | OPTIONAL / OWNER APPROVAL IF NEEDED FOR R1 |

---

## 50. Mandatory security gates

Owner/admin matrix · admin→admin denied · staff/viewer/suspended denied · tenant isolation · wrong-email · normalization · active/suspended/removed collisions · expiration · revocation · resend old-token invalidation · replay · duplicate concurrency · double acceptance · revoke/accept race · direct RPC invoke · client role/org tampering · RLS bypass attempts · raw-token secrecy · token-hash non-exposure · audit immutability · new-user no-owner-org creation · org suspended/archived fail closed · DEFINER actor re-derivation / search_path hardening.

---

## 51. Remaining decisions

```text
OWNER DECISIONS REQUIRED BEFORE CONTRACT APPROVAL / DOCS-ONLY PUBLICATION:
NONE
```

All previously open implementation-detail items are locked in this reviewed contract (expiry materialization, email→user collision boundary, org-state fail closed, token transport, visibility, rate-limit gate).

---

## 52. Approval gates

1. Contract preparation
2. Owner review (**this gate**)
3. Required owner decisions resolved (**none**)
4. Contract approved for docs-only publication
5. Docs-only publication
6. **Separate implementation authorization** (still required afterward)

---

## 53. Implementation authorization boundary

```text
CONTRACT APPROVAL / DOCS-ONLY PUBLICATION DOES NOT AUTHORIZE IMPLEMENTATION.

This contract is:
OWNER REVIEW PASSED — APPROVED FOR DOCS-ONLY PUBLICATION

Not:
IMPLEMENTATION READY
PRODUCTION READY
PUBLISHED (until docs-only publication succeeds)

No implied permission to create migrations, RPCs, UI, routes, email integration,
tests, or production fixtures.
```

Implementation may begin only after docs-only publication **and** a separate implementation authorization.

---

## 54. Design readiness verdict

```text
INVITATIONS / MEMBER ADMINISTRATION
DESIGN / SECURITY / READINESS CONTRACT —
OWNER REVIEW PASSED
APPROVED FOR DOCS-ONLY PUBLICATION

IMPLEMENTATION STILL NOT AUTHORIZED
```
