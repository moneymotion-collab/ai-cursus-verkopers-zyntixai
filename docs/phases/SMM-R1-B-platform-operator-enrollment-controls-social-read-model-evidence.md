# SMM-R1-B — Platform Operator Enrollment Controls & Social Read Model Evidence

**Phase:** `SMM-R1-B — PLATFORM OPERATOR ENROLLMENT CONTROLS & SOCIAL READ MODEL`  
**Date:** 2026-08-18  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw`

---

## 1. Executive verdict

```text
SMM-R1-B CLOSED WITH EVIDENCE — PLATFORM OPERATOR ENROLLMENT CONTROLS VERIFIED
```

Internal ZyntixAI operator control plane for Social closed-beta enrollment is implemented and Production-safe verified **without** enrolling any Production organization, without enabling `SOCIAL_PUBLISHING_ENABLED`, and without Meta/provider writes.

---

## 2. Authoritative baseline

| Item | Value |
| --- | --- |
| Prior milestone | `SMM-R1-A-R1 CLOSED WITH EVIDENCE` |
| Prior HEAD | `aa755a3` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Prior Production migrations | `20260818190346`, `20260818191706` |
| Prior enrollments / events | `0` / `0` |
| Publishing GUC at rest | unset/false |
| Connected Instagram | 1 |
| Succeeded publication | 1 |
| Queued leftovers | 3 |
| Authorization-pending shells | 6 |
| Publication attempts | 1 |

---

## 3. Platform operator identity model

No broad platform-admin role existed. R1-B uses a **narrow fail-closed server allowlist**:

| Control | Mechanism |
| --- | --- |
| UI gate | `SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED=true` (exact) |
| Identity | `SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST` comma-separated emails |
| Verification | Authenticated Supabase user email normalized and matched server-side |
| Not sufficient | Organization Owner / Admin / Member alone |
| Revocation | Remove email from allowlist and/or set UI gate ≠ `true` |

Who can access:

* Authenticated users whose email is on the allowlist **and** UI gate is ON **and** `SUPABASE_SERVICE_ROLE_KEY` is configured server-side.

Why tenants cannot satisfy it:

* Org role checks are never consulted for this surface.
* Empty allowlist fails closed.
* UI disabled fails closed.

Route hiding alone is not the control — server session resolution denies before read models load.

---

## 4. Route authorization

Routes:

* `/operator/social-beta`
* `/operator/social-beta/[organizationId]`

Behavior:

* Unauthenticated / non-allowlisted / UI-disabled → fail-closed denial panel (no org list/detail data)
* Valid operator → list/detail load via service-role RPCs only
* Not present in customer AppShell navigation
* Registered in safe-return-path protected allowlist

---

## 5. Operator information architecture

Internal operator namespace under authenticated app shell, labeled “Internal operator”. Customer Social routes remain unchanged (no R1-C UX).

---

## 6. Organization list read model

RPC: `operator_list_social_closed_beta_organizations()` (service_role + operator GUC)

Safe fields only:

* org name/id/status
* enrollment status (`not_enrolled` when absent)
* workspace presence (non-archived)
* Instagram connected/healthy counts
* credential present count (boolean-usable)
* `publish_image` capability count
* active/queued publication counts
* Owner/Admin presence
* last Social activity timestamp aggregate

No tokens, ciphertext, Meta bodies, or secrets.

Client filters: search by name/id; status filters.

---

## 7. Organization detail read model

RPC: `operator_get_social_closed_beta_organization(uuid)` + `operator_list_social_closed_beta_enrollment_events(uuid)`

Shows enrollment timestamps/reason, readiness booleans, publishing diagnostic (informational), append-only audit timeline.

Viewing does **not** create enrollment rows.

---

## 8. Enrollment actions

UI actions map to in-transaction wrappers that arm `zyntix.social_closed_beta_operator=on` then call `private.transition_social_closed_beta_enrollment`:

| From | Actions |
| --- | --- |
| not enrolled | Enroll / Approve → `approved` |
| approved | Allow Publishing / Pause / Revoke |
| publishing_allowed | Pause / Revoke |
| paused | Resume (to `status_before_pause`) / Revoke |
| revoked | none (terminal) |

---

## 9. Confirmation / reason handling

Confirm required for Allow Publishing, Pause, Revoke.

Reason: optional plain text, max 500 chars, recorded when provided.

Revoke copy explicitly states data/credentials/publications/audit are retained.

---

## 10. Server mutation architecture

```text
Browser
→ mutateSocialClosedBetaEnrollmentAction (server action)
→ resolvePlatformClosedBetaOperatorSession (allowlist + service role)
→ mutateOperatorClosedBetaEnrollment
→ service_role RPC wrappers
→ private.transition_social_closed_beta_enrollment
```

Service role key never sent to client. Operator GUC is transaction-local via wrappers.

---

## 11. Operator RPC reuse

R1-A private transition + assert remain authoritative. R1-B adds PostgREST-safe wrappers because `set_config` cannot span separate PostgREST calls.

Original `platform_*` RPCs remain; UI uses `operator_*` wrappers.

---

## 12. Concurrency behavior

DB `FOR UPDATE` + illegal-transition / conflict codes remain authoritative. UI maps stale transitions to refresh guidance; `router.refresh()` after success.

---

## 13. Customer-safe Social read model

`buildSocialClosedBetaCustomerReadModel` answers enrolled/state/prepare/publish entitlement/global gate/execute-blocked reason for later R1-C. Informational only; no authority grant. No R1-C UX shipped.

---

## 14. Global kill-switch presentation

Operator UI banners:

* `Global Social publishing is currently OFF`
* When tenant `publishing_allowed` and global OFF: clarifies entitlement ≠ provider execution

No global kill-switch toggle in R1-B.

---

## 15. Security analysis

| Actor | Operator route | Mutations |
| --- | --- | --- |
| Unauthenticated | denied | denied |
| Owner/Admin/Member (non-allowlisted) | denied | denied |
| Allowlisted operator + UI ON | allowed | allowed via service_role wrappers |
| Direct authenticated execute on operator RPCs | **not granted** | N/A |

Privileges verified on Production: `operator_*` EXECUTE for `service_role` (+ postgres), not authenticated/anon.

---

## 16. Secret-exposure review

Scanned surfaces do not serialize:

* `SUPABASE_SERVICE_ROLE_KEY`
* operator GUC capability
* OAuth tokens / credential ciphertext
* Meta response bodies

Credential presence is boolean/count only.

---

## 17. Tests

| Suite | Result |
| --- | --- |
| Social + R1-B targeted/domain/security | **48 files / 276 passed** |
| typecheck | PASS |
| lint | PASS |
| production build | PASS (routes `/operator/social-beta`, detail) |

Focused R1-B coverage includes identity fail-closed, route protection, read-model diagnostics, mutation RPC mapping, confirmation gate, stale transition mapping, migration grants inventory.

---

## 18. Production-safe verification

Performed **read-only** on Production:

* Operator wrapper/list/detail/event RPCs present
* EXECUTE limited to service_role
* No enrollment mutations executed
* Historical Social inventory unchanged

Operator UI remains fail-closed in Production until owner configures allowlist + UI gate + service role on the deployment (expected).

---

## 19. Production enrollment/event counts

| Metric | Value |
| --- | --- |
| enrollments | **0** |
| enrollment events | **0** |

---

## 20. Historical-data preservation

| Metric | Value |
| --- | --- |
| connected Instagram | 1 |
| authorization_pending shells | 6 |
| succeeded publications | 1 |
| queued publications | 3 |
| publication attempts | 1 |
| provider-write delta | **none** (no Meta calls from R1-B) |

---

## 21. Known limitations

* Production operator UI requires explicit Vercel env allowlist/UI enablement; until then access fails closed.
* Residual R1-A-R1 note remains: enrolled tenants could still call DB execute path if publishing GUC were armed independently of Vercel env — Production stays unenrolled; global env stays OFF.
* CSS webpack cache warning observed for operator list CSS module; build succeeded.
* Local migration file version aligned to Production apply timestamp `20260818194719` (MCP `apply_migration` naming).

---

## 22. Next recommended slice

```text
SMM-R1-C — CLOSED BETA CUSTOMER ACCESS & ONBOARDING UX
```

Do **not** begin R1-D Production enrollment without owner authorization.

---

## 23. Git status

| Item | Value |
| --- | --- |
| Implementation | `8b332b6` |
| Evidence | *(this commit)* |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |

### Migration tip

| Version | Name |
| --- | --- |
| `20260818190346` | add_social_closed_beta_enrollment_foundation |
| `20260818191706` | add_social_closed_beta_entitlement_defense_in_depth |
| `20260818194719` | add_social_closed_beta_operator_mutation_wrappers |
