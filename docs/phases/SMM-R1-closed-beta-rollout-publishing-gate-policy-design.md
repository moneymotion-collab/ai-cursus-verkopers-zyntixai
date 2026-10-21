# SMM-R1 — Closed Beta Rollout & Publishing Gate Policy — Design Evidence

**Status:** `SMM-R1 DESIGN READY — OWNER REVIEW REQUIRED`  
**Mode:** Discovery / design only. No implementation. No migrations. No Production mutations. No provider writes.  
**`SOCIAL_PUBLISHING_ENABLED`:** remains OFF throughout this design phase.

---

## A. Authoritative baseline

| Item | Value |
| --- | --- |
| HEAD | `f03a75e1c44142a8d5b6bb17d16ed2553f096744` |
| B1.10 implementation | `483bbf8` |
| B1.10 evidence | `f03a75e` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |
| Publishing gate | OFF (policy invariant) |

Production facts (from B1.10, not re-mutated here): 1 healthy connected Instagram Business account; 1 encrypted credential; 1 succeeded IMAGE publication/attempt; 6 pending shells + 3 queued leftovers retained as evidence.

---

## B. Existing reusable platform mechanisms

### What exists

| Mechanism | Nature | Reusable for per-tenant publish? |
| --- | --- | --- |
| `SOCIAL_CONNECTIONS_ENABLED` | Global env fail-closed | Keep as connection product gate |
| `SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED` | Global env AND with connections | Keep as Instagram connect gate |
| `SOCIAL_PUBLISHING_ENABLED` | Global env fail-closed | **Must remain global kill switch** |
| `zyntix.social_publishing_enabled` GUC | Session/worker DB kill switch | Keep under app kill switch |
| Owner/Admin `canManageSocialConnections` | Role authorization | Required layer; not entitlement |
| B1.9 lifecycle / idempotency / ambiguous fail-closed | Publication execution safety | Authoritative; do not fork |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | Global email allowlist | **Pattern only** — not org entitlement |
| `organizations.status` | Tenant lifecycle | Soft health only |
| `social_workspaces.*_approval_required` | Workflow policy | **Do not overload** |
| Onboarding questionnaire columns | First-run UX | **Do not overload** |

### Verdict on reuse

**No existing DB entitlements / feature-flag / per-org rollout table exists.**  
Closed-beta publishing eligibility requires a **new, narrow, Social-scoped entitlement model**, composed under the existing global env kill switches — not a second parallel auth system for roles, and not env-only allowlists for multi-member orgs.

Invitation email allowlist remains useful for **ops hygiene** (who may receive invites) but must **not** be the publishing entitlement authority.

---

## C. Proposed rollout architecture

### Hierarchy (fail-closed, top wins)

```
1. GLOBAL PROVIDER WRITE KILL SWITCH
   SOCIAL_PUBLISHING_ENABLED === "true"  (env)
   AND private.social_publishing_execution_enabled() (GUC for RPC path)

2. TENANT / ORG CLOSED-BETA ENTITLEMENT
   DB: organization Social beta enrollment status allows publishing

3. WORKSPACE SOCIAL PUBLISHING ELIGIBILITY
   DB: workspace inherits org entitlement OR has explicit override
   (recommended default: org-level enrollment covers its Social workspace)

4. CONNECTED ACCOUNT HEALTH / CAPABILITY
   status=connected, healthy (or non-blocking degraded policy),
   reauthorization not required, credential present, publish_image capability

5. OWNER / ADMIN AUTHORIZATION
   active membership + Owner/Admin (existing permission model)

6. PUBLICATION LIFECYCLE ELIGIBILITY
   B1.9: claimable status, lease, idempotency, not terminal/ambiguous/processing

7. PROVIDER WRITE
   Instagram adapter publish (only after 1–6)
```

Any false layer blocks provider write. Layer 1 false blocks **all** tenants even if entitlement is approved.

### Gate interaction with connection env vars

| Goal | Connections gates | Publishing kill switch | Org entitlement |
| --- | --- | --- | --- |
| Ordinary customer (not enrolled) | ON (product visible) or OFF | OFF or ON+no entitlement | not enrolled |
| Closed-beta tester connect | ON | OFF or ON | enrolled ≥ connections_allowed |
| Closed-beta tester publish | ON | **ON** | enrolled = publishing_allowed |
| Emergency | any | **OFF** | irrelevant |

**Recommended Production closed-beta posture during early R1 ops:**

- Keep `SOCIAL_CONNECTIONS_ENABLED=true` and `SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED=true` so `/social` works for enrolled orgs (and shows honest empty/not-enrolled UX for others if product is generally visible).
- Keep `SOCIAL_PUBLISHING_ENABLED=OFF` until owner authorizes a controlled window **and** at least one org entitlement is `publishing_allowed`.
- Prefer: turn global publishing ON only when ≥1 enrolled publisher exists; entitlement still scopes who may execute.

Alternative (stricter): keep Social nav visible only when org is enrolled — still requires DB entitlement for UX gating, separate from execute.

---

## D. Rollout state model

Prefer a **small explicit state machine** over many overlapping booleans.

### Organization Social beta enrollment status

| Status | Meaning | Connect Instagram | Prepare publication | Execute provider write |
| --- | --- | --- | --- | --- |
| `not_enrolled` | Default for all orgs | Allowed only if global connection gates ON (product policy) | No (or prepare-only if desired; recommend No for clarity) | No |
| `approved` | Closed-beta approved; connections OK | Yes (gates ON) | Yes | No |
| `publishing_allowed` | Approved + publish entitlement | Yes | Yes | Yes **iff** global kill switch ON |
| `paused` | Temporary hold; retain data | Optional read-only / reconnect policy | No | No |
| `revoked` | Removed from beta; retain audit | No new connects (policy) | No | No |

**Smaller equivalent (if owner prefers fewer states):**

- `inactive` | `connections_only` | `publishing` | `paused` | `revoked`

Mapping: `not_enrolled→inactive`, `approved→connections_only`, `publishing_allowed→publishing`.

### Workspace scope

**Recommended R1:** entitlement is **organization-scoped**. The org’s single Social workspace inherits it.  
Optional later: workspace override table if multi-workspace orgs appear.

Do **not** invent per-connection entitlement in R1; connection health remains a separate layer.

### Reversibility

Pause/revoke **never** deletes connections, credentials, content, publications, attempts, or events.  
Only blocks new privileged actions.

---

## E. Authorization hierarchy

Execute path (conceptual):

1. App: `parseSocialPublishingEnabled(env)` → else `feature_disabled`
2. App: load org Social entitlement → else `entitlement_denied` / `beta_paused` / `not_enrolled`
3. App: Owner/Admin + active membership + org `active`
4. App: connection eligible (connected, capability, credential, not reauth-required)
5. App/RPC: B1.9 claim/start protections
6. RPC: GUC worker + `social_publishing_execution_enabled`
7. Adapter: provider write

Prepare path may allow `approved` without `publishing_allowed` **or** require `publishing_allowed` — **recommendation:** prepare allowed from `approved` upward so testers can stage content while global kill switch stays OFF; execute still blocked by kill switch + entitlement.

---

## F. Database impact if later implemented

**Additive only. Not applied in this design phase.**

### Proposed tables (illustrative)

`public.social_closed_beta_enrollments`

- `id uuid PK`
- `organization_id uuid UNIQUE NOT NULL` → organizations
- `status text NOT NULL` CHECK (`not_enrolled` unused as row; row absent = not enrolled; or store only enrolled+)
- Prefer: **row exists ⇒ enrolled**; statuses `approved | publishing_allowed | paused | revoked`
- `notes_internal text` (ops only; no secrets)
- `approved_at`, `publishing_enabled_at`, `paused_at`, `revoked_at` timestamptz null
- `created_by_user_id` / `updated_by_user_id` (platform operator identity — define carefully; may be service/ops RPC)
- `created_at`, `updated_at`

`public.social_closed_beta_enrollment_events` (append-only)

- enrollment_id, organization_id, event_type, actor_source, actor identifiers, payload jsonb (no secrets), created_at

### Helpers / RPCs (later)

- `private.assert_social_publishing_entitlement(org_id)` → result_code
- Owner-facing: none required for self-enable (ops-only enrollment)
- Platform-ops RPC or controlled Owner RPC for pause (see operator UX) — **recommendation:** initial enrollment mutations are **platform operator / service-controlled**, not self-serve by customer Owner, to prevent self-enrollment into publishing.

### Rollback / risk

- Drop functions; leave enrollment rows (or soft-revoke).
- Never cascade-delete Social evidence.

---

## G. Operator UX proposal

### Platform / internal operator (enrollment authority)

Surface (later implementation): internal settings or documented SQL/ops runbook initially.

Actions:

- Enroll org → `approved`
- Promote → `publishing_allowed`
- Pause → `paused`
- Resume → previous non-revoked status (store `status_before_pause`)
- Revoke → `revoked`

Show: org id/name opaque, status, timestamps, last event — **no tokens**.

### Customer Owner/Admin (enrolled)

`/social` Overview shows:

- “Closed beta: connections enabled” / “Publishing eligible” / “Publishing paused by operator”
- Publish execute disabled reasons: global OFF vs entitlement vs connection health vs lifecycle

### Customer not enrolled

If Social product globally visible:

- `/social` shows honest empty: “Social Media Management is available to closed-beta organizations. Contact ZyntixAI if you were invited.”
- No publish execute
- Optionally hide connect CTA when not enrolled (recommended for R1 clarity)

If connection gates OFF globally: existing feature_disabled page.

---

## H. Tester onboarding proposal

```
Invite (existing invitations; optional email allowlist)
→ Owner completes org onboarding (existing)
→ Operator enrolls org (approved)
→ Owner opens Social
→ Connect Instagram Business
→ Connection healthy + publish_image
→ (optional) Prepare IMAGE while global publishing OFF
→ Owner authorizes global SOCIAL_PUBLISHING_ENABLED=true window
→ Operator promotes org to publishing_allowed (order flexible; both required)
→ Owner Execute once / controlled
→ On incident: pause entitlement and/or flip global OFF
```

**Order recommendation for first wave:**

1. Enroll org `approved`
2. Tester connects Instagram
3. Verify health/capability
4. Promote `publishing_allowed`
5. Owner enables global kill switch only for a short controlled window
6. Single execute / limited executes
7. Return global OFF; leave entitlement as-is or pause

---

## I. Emergency / rollback model

| Scenario | Action | Effect |
| --- | --- | --- |
| Suspected duplicate/ambiguous Meta write | Global `SOCIAL_PUBLISHING_ENABLED` unset/false immediately | All provider writes stop |
| One tester misbehaving / credential issue | Pause or revoke that org entitlement | Only that org blocked |
| Instagram API outage | Pause all `publishing_allowed` → `paused` OR global OFF | Prefer global OFF for speed |
| Bad deploy | Global OFF | Instant |

**Rollback does not** disconnect accounts, rotate credentials, or delete publications.

Ambiguous outcomes continue under B1.9: `unknown_external_outcome` → no auto retry.

---

## J. Audit / evidence model

Enrollment events (examples):

- `social_beta_enrolled_approved`
- `social_beta_publishing_allowed`
- `social_beta_paused`
- `social_beta_resumed`
- `social_beta_revoked`

Payload: organization_id, prior_status, next_status, actor class (`platform_operator` | `system`), reason code — **no secrets**.

Correlate with existing `social_publication_events` / connection events for incident review.

---

## K. Security review

| Requirement | Design stance |
| --- | --- |
| No client secrets | Entitlement status may be read by Owner/Admin via RPC; never credentials |
| No NEXT_PUBLIC_ kill switch bypass | Kill switch server-only env |
| Tenant isolation | Enrollment row org FK + membership checks |
| No self-serve publishing enable | Platform operator enrolls; customer cannot self-promote to publishing_allowed in R1 |
| Idempotency / ambiguous | Unchanged B1.9 authority |
| Fail-closed defaults | Missing enrollment row = not enrolled; missing env = OFF |
| Unhealthy credential | Block execute; surface reauthorization; do not auto provider write |

---

## L. Closed-beta operating policy

### Initial tester count

**3–5 organizations** (not 3–5 random users). Prefer 1 workspace each, Owner-operated Instagram Business accounts under Meta App roles / Standard Access constraints as already documented in B1.8.

### Qualification criteria

- Active paying/trusted partner org OR internal test org
- Owner available for live ops window
- Owns Instagram Professional Business account eligible under current Meta access
- Accepts: publishing may be paused; no guarantee of Advanced Access / third-party accounts
- Willing to use `/social` Activity for ambiguous outcomes

### Rollout stages

1. **Design approved** (this document)
2. **R1-A implement entitlement schema + assert helpers** (no global ON)
3. **R1-B operator enrollment UX/runbook**
4. **R1-C enroll 1 internal org → connect only**
5. **R1-D promote publishing_allowed + short global ON window → 1 controlled publish**
6. **R1-E expand to 3 orgs** after incident-free window
7. **R1-F expand to 5** after feedback loop
8. Exit criteria review for post-closed-beta

### Feedback collection

- Structured form: connect friction, prepare UX, execute confidence, error clarity
- Capture safe error codes only
- Weekly 15-min sync for first 2 weeks

### Incident response

1. Global OFF
2. Pause affected entitlement(s)
3. Freeze retries on ambiguous publications
4. Review Activity timeline + enrollment events
5. Owner decision before any re-enable

### Emergency pause

Primary: unset `SOCIAL_PUBLISHING_ENABLED`.  
Secondary: bulk pause enrollments.

### Expand beyond 3–5 when

- ≥2 weeks with zero P0 (duplicate write, secret leak, cross-tenant)
- Ambiguous-outcome path exercised or explicitly dry-run documented
- Support burden acceptable
- Meta access model still valid for tester accounts

### Leave closed beta when

- Entitlement system stable
- Support playbooks proven
- Decision on Advanced Access / App Review path for non-owner accounts
- Explicit product decision to open enrollments or keep invite-only

---

## M. Implementation slices (recommended order)

| Slice | Scope | Provider write? | Global publishing ON? |
| --- | --- | --- | --- |
| **R1-A** | Migration: enrollment + events + assert helper; wire execute/prepare checks; tests | No | No |
| **R1-B** | Operator enrollment actions (platform-controlled) + audit; read model on `/social` | No | No |
| **R1-C** | Not-enrolled UX; enrolled connections-only UX | No | No |
| **R1-D** | Production enroll 1 org; connect verify | No | No |
| **R1-E** | Owner-authorized: promote publishing_allowed + short global ON + controlled execute | **Yes (owner-gated)** | **Yes (window)** |
| **R1-F** | Expand 3→5; ops policy hardening | Controlled | Controlled windows |

**Do not start R1-A until owner approves this design.**

---

## N. Risks / open questions

1. **Who is the platform operator identity?** Service role runbook vs internal admin role — needs owner decision.
2. **Should non-enrolled orgs see `/social` at all?** Recommend yes with clear CTA, or hide nav unless enrolled.
3. **Prepare without publishing entitlement?** Recommend allow from `approved` to reduce pressure to leave kill switch ON.
4. **Multi-workspace future:** org-level entitlement may need workspace overrides later.
5. **Standard Access limits:** closed beta still constrained to Meta-eligible accounts; not solved by entitlement.
6. **Env allowlist temptation:** do not use Vercel org id lists as long-term model; DB entitlement is auditable/reversible.
7. **B1.8 wrappers set GUC publishing true in-session:** app must still check env + entitlement before calling start — preserve that order.

---

## O. Exact proposed SMM-R1 implementation contract

When implementation is authorized, SMM-R1 shall:

1. Keep `SOCIAL_PUBLISHING_ENABLED` as the **global fail-closed emergency kill switch**.
2. Add **additive** `social_closed_beta_enrollments` (+ append-only events).
3. Treat **absent enrollment row** as `not_enrolled`.
4. Enforce execute only when:  
   `global kill switch ON` ∧ `enrollment.status = publishing_allowed` ∧ `Owner/Admin` ∧ `connection eligible` ∧ `B1.9 lifecycle allows claim/start`.
5. Not create a parallel role system; reuse Owner/Admin.
6. Not delete Social evidence on pause/revoke.
7. Not enable publishing in Production without explicit owner action.
8. Ship tests for: not enrolled; approved without publish; publishing_allowed with kill switch OFF; kill switch ON without entitlement; pause/revoke; wrong org; non-Owner.
9. Update `/social` Overview to show entitlement state with safe copy.
10. Preserve B1.9 idempotency and `unknown_external_outcome` fail-closed behavior unchanged.

---

## Design gate status

| Gate | Status |
| --- | --- |
| Baseline verified | PASS |
| Existing mechanism survey | PASS — invent-new entitlement under global kill switch |
| Architecture hierarchy | PASS (design) |
| Operating policy | PASS (design) |
| Implementation | **NOT STARTED** (owner review required) |
| Production mutation | NONE |
| Provider write | NONE |
| Publishing gate | OFF |

---

**`SMM-R1 DESIGN READY — OWNER REVIEW REQUIRED`**
