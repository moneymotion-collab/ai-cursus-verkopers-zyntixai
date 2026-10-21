# ORG-CONTEXT-1C-R1A — Platform Operator Authorization Boundary

| Field | Value |
| --- | --- |
| Phase | **ORG-CONTEXT-1C-R1A — Platform Operator Authorization Boundary Audit & Hardening** |
| Parent | ORG-CONTEXT-1C |
| Document type | Pre-Production security gate evidence |
| Date | 2026-08-25 |
| Formal status | `ORG-CONTEXT-1C-R1A CLOSED WITH EVIDENCE — PLATFORM OPERATOR AUTHORIZATION BOUNDARY VERIFIED AND ISOLATED` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `294002b1f039b3b746cbaa2444c1f7f84e974a80` |
| Mutation RPC | **NOT APPLIED TO PRODUCTION** |
| ORG-CONTEXT data | **0 / 0 / 0** |

**CLOSED BETA ADMISSION ≠ PLATFORM OPERATOR AUTHORIZATION**

**ORG-CONTEXT MUTATION RPC: NOT APPLIED TO PRODUCTION**

**PRODUCTION ORG-CONTEXT DATA: 0 / 0 / 0**

**ALL EXISTING ORGANIZATIONS: UNASSIGNED**

No real operator or tester emails are recorded in this document.

---

## A. Starting state

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `294002b1f039b3b746cbaa2444c1f7f84e974a80` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

Live Production at R1A start (SELECT only):

| Metric | Value |
| --- | --- |
| activities | 0 |
| assignments | 0 |
| events | 0 |
| organizations | 6 |
| `apply_organization_context_platform_mutation` exists | **false** |

---

## B. Exact current authorization chain (as found in 1C)

Traced from `src/features/org-context/server/platform-operator-authorization.ts`:

1. **Authenticated identity source:** `authClient.auth.getUser()`. Missing user → `UNAUTHORIZED`.
2. **Feature/operator enablement source:** `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED`, exact fail-closed parse (`trim` + lowercase === `"true"`). Missing / false / invalid → `operator_disabled`.
3. **Allowlist source (1C):** env key `SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST`, parsed by ORG-CONTEXT's own helper. Empty → `allowlist_empty`. Email not listed → `email_not_allowlisted`.
4. **Environment variable names involved in 1C:**
   - `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED`
   - `SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST`
5. **Shared with invitations?** No. Invitations use `INVITATION_EMAIL_RECIPIENT_ALLOWLIST`. ORG-CONTEXT only reused invitation **email normalization** (`trim` + lowercase), not the invitation recipient set.
6. **Shared with Closed Beta admission?** Not the admission env itself. Closed Beta invitation delivery eligibility is `INVITATION_EMAIL_RECIPIENT_ALLOWLIST`. 1C did **not** read that key. It did share a **different** env with Social operator tooling.
7. **Shared with Social operator tooling?** **Yes.** Same env key as SMM-R1-B `/operator/social-beta`.
8. **Dedicated to platform operations?** **No.** The env is Social closed-beta operator UI identity.
9. **Organization membership?** Not consulted for operator yes/no. After authorization, mutations still require an explicit Organization id. Non-member operators keep `actor_member_id` null.
10. **Can tenant owner/admin satisfy operator auth?** No. Tenant roles are never read. Owner/admin emails are denied unless independently present on the operator allowlist.
11. **Final 1C decision:** authenticated user **AND** flag true **AND** non-empty Social operator allowlist **AND** email on that allowlist → operator identity returned. Then service requires `actorUserId` before RPC. Privileged client construction is a later step and is not itself authorization.

1C did **not** import Social's `resolveSocialClosedBetaPlatformOperatorAccess` (Social UI gate not required). It independently **read the same Social operator env key**.

---

## C. Allowlist semantic classification

Inspected consumers of `SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST`:

| Consumer | Semantic |
| --- | --- |
| `src/features/social-media/domain/platform-operator-identity.ts` | Social closed-beta **operator UI** identity |
| `src/features/social-media/server/platform-operator-session.ts` | Loads `/operator/social-beta` after UI gate + allowlist + privileged client |
| SMM-R1-B evidence | “Internal ZyntixAI operator control plane for **Social closed-beta enrollment**”; “No broad platform-admin role existed” |
| `.env.example` | Documented as Social closed-beta platform operator UI |

Inspected **admission** allowlist (different key):

| Consumer | Semantic |
| --- | --- |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | Invitation email delivery recipients / Closed Beta tester mailbox gate |

**Classification of the 1C ORG-CONTEXT authority source:**

**D. SOCIAL_SPECIFIC_OPERATOR_ALLOWLIST**

Not A (dedicated platform-operator allowlist). Not B (general Closed Beta admission). Not C (invitation recipient). Not F (unresolved).

It was **not** a general admission list, but it was also **not** a dedicated cross-domain platform-operator authority set.

---

## D. Whether it was dedicated or shared

**Shared / feature-specific reuse.** Unsafe for ORG-CONTEXT operator authority under R1A:

> SOCIAL_SPECIFIC_OPERATOR_ALLOWLIST is potentially safe **only if** evidence proves it already represents trusted ZyntixAI platform operators **across platform-level operations**, not merely Social participants.

SMM-R1-B evidence proves the opposite: the list exists because **no broad platform-admin role existed**, and it gates **Social enrollment UI** only.

A person trusted to operate Social closed-beta enrollment is not automatically trusted to mutate tenant Business Activity / Context pins.

---

## E. Security impact

Before R1A, enabling `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED=true` would have treated every email on the Social operator allowlist as an ORG-CONTEXT platform operator.

Impact was latent: mutation RPC is still unapplied, no product caller exists, Production rows remain 0. The coupling was still an authorization-domain defect that had to be removed before Production activation.

Closed Beta invitation recipients were **not** automatically operators in 1C (different env). That separation is now also locked by regression test.

---

## F. Chosen final platform-operator authority model

Dedicated ORG-CONTEXT server-side allowlist. Smallest blast radius. Social unchanged.

Final decision:

```
authenticated actor
AND ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED = true
AND email ∈ ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST (non-empty)
AND explicit Organization target
AND explicit requested operation
→ platform mutation service permitted
```

Insufficient (remain denied):

- Closed Beta invitation eligibility (`INVITATION_EMAIL_RECIPIENT_ALLOWLIST`)
- Closed Beta admission / tester mailbox membership
- Social operator allowlist / Social operator UI enablement
- Organization Owner / Admin / Staff / Viewer
- Social entitlement / connection ownership
- Context relevance / CAP readiness
- `createSupabaseServiceRoleClient()` availability

No database operator-role table was added.

---

## G. Feature flag semantics

`ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED`

| Value | Result |
| --- | --- |
| missing | denied |
| `false` | denied |
| invalid (`yes`, etc.) | denied |
| exact `true` (trim + lowercase) | gate open; **does not authorize any actor** |

Empty dedicated allowlist still fails closed (`allowlist_empty`). Flag true + random authenticated user still fails (`email_not_allowlisted`).

---

## H. service_role separation

`createSupabaseServiceRoleClient()` remains only in `org-context-client.ts`.

`resolveOrgContextPlatformOperator` never constructs a privileged client. A user id without allowlisted email is `UNAUTHORIZED`. Service mutations still require `operator.actorUserId` even if a mutate client is injected.

Order remains: authenticate → authorize dedicated operator → validate Organization/operation → privileged RPC.

---

## I. Admission-vs-operator regression

Synthetic identities only:

1. Email on `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` and **not** on `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST` → ORG-CONTEXT operator **denied**.
2. Email on `SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST` with Social UI enabled and **not** on the dedicated ORG-CONTEXT allowlist → **denied**.
3. Dedicated allowlist omitted while Social operator allowlist contains the actor → `allowlist_empty` (Social env is not read).

---

## J. Social dependency analysis

ORG-CONTEXT does not import Social operator helpers.

Social continues to use `SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST` + `SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED` for `/operator/social-beta`. That is a **feature-specific** operator gate, not Closed Beta product admission (`INVITATION_EMAIL_RECIPIENT_ALLOWLIST`).

R1A does **not** refactor Social. Follow-up (not blocking ORG-CONTEXT-1C-FV): if a genuine **cross-domain** `PLATFORM_OPERATOR_ALLOWLIST` is ever introduced, Social and ORG-CONTEXT should opt in explicitly rather than silently sharing one feature env.

---

## K. Files changed

| Path | Change |
| --- | --- |
| `src/features/org-context/domain/operator-identity.ts` | Dedicated `ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST` |
| `tests/features/org-context/operator-authorization.test.ts` | Flag / tenant-role / Social / admission / service_role tests |
| `tests/security/organization-context-1c-server-isolation.test.ts` | Server-only + public-env contract |
| `.env.example` | Commented server-only keys; no real values |
| this evidence document | R1A record |

Unchanged:

- `supabase/migrations/20260825130000_add_organization_context_platform_mutations.sql` (SHA-256 `A2F35C87BD84DE5D887271DCA76DAC36299418F400FECF00A73F85251329F205`)
- 1B migrations
- invitations / PATH B / admission runtime
- Social execution and Social operator helpers
- TAX/CAP/CTX / readiness
- Home / AppShell / onboarding

---

## L. Tests

Operator authorization, admission-vs-operator regression, ORG-CONTEXT service, server-only isolation, 1C mutation migration security, 1B tests, CONTROL-PLANE security, invitations/PATH B, Social R1-B/R1-C, `npx tsc --noEmit`, `npx next lint`, full `npx vitest run`.

Pre-R1A baseline: 2914 passed / 2 failed / 2916 total.

Full suite after R1A: **2918 passed / 2 failed / 2920 total** (+4 passing tests).

Historical non-blocking failures unchanged:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

---

## M. Production status

| Check | Value |
| --- | --- |
| Mutation RPC applied | **false** |
| activities / assignments / events | **0 / 0 / 0** |
| Organizations | 6, all unassigned |
| Production env changed | **no** (operator enablement is a later controlled plan) |
| Production writes | **none** |

---

## Next phase

**ORG-CONTEXT-1C-FV** may proceed: apply the frozen RPC; inspect live function body/EXECUTE; keep tenant rows 0 / 0 / 0; regenerate linked function types; do **not** create a QA assignment (that is ORG-CONTEXT-1D).
