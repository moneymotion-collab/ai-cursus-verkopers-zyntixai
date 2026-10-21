# SMM-R1-A — Closed Beta Enrollment Foundation — Evidence

**Verdict:** `SMM-R1-A CLOSED WITH EVIDENCE — CLOSED BETA ENTITLEMENT FOUNDATION VERIFIED`

---

## 1. Executive verdict

Additive closed-beta enrollment schema, append-only audit events, platform-operator mutation RPCs (service_role + operator GUC; not authenticated), and prepare/execute entitlement asserts are implemented under the global `SOCIAL_PUBLISHING_ENABLED` kill switch.

- No Production organizations enrolled
- No Meta/provider writes
- `SOCIAL_PUBLISHING_ENABLED` remains OFF
- Migration prepared; **not applied to Production** in this slice (governance apply is separate)

---

## 2. Authoritative baseline

| Item | Value |
| --- | --- |
| Pre-implementation HEAD | `f03a75e` (B1.10 evidence) |
| Design-doc commit | `3c5d985` |
| Branch | `core/platform-readiness-20260707` |
| Upstream at start | divergence `0 0` |

---

## 3. Approved owner decisions (honored)

1. Platform operator only for enroll/promote/pause/resume/revoke — no customer self-promotion
2. Non-enrolled UX deferred to R1-C (not built here)
3. `approved` may prepare; execute requires `publishing_allowed` + global ON
4. Org-level entitlement only (workspace inherits)
5. Entitlement never bypasses Meta access
6. Global kill switch stays OFF for R1-A

---

## 4. Enrollment schema

Table: `public.social_closed_beta_enrollments`

- One row per organization (`organization_id` UNIQUE)
- Row absent = not enrolled
- Statuses: `approved | publishing_allowed | paused | revoked`
- `status_before_pause` for resume
- Optional safe `reason` (≤500 chars)
- RLS: Owner/Admin SELECT only; no customer INSERT/UPDATE/DELETE

Migration: `supabase/migrations/20260818190346_add_social_closed_beta_enrollment_foundation.sql`

---

## 5. Event / audit schema

Table: `public.social_closed_beta_enrollment_events` (append-only)

Event types:

- `social_beta_enrolled_approved`
- `social_beta_publishing_allowed`
- `social_beta_paused`
- `social_beta_resumed`
- `social_beta_revoked`

Actor source: `platform_operator | system`  
Immutable guard trigger blocks UPDATE/DELETE  
Payload rejects secret keys

---

## 6. State transition contract

| From | Action | To |
| --- | --- | --- |
| absent | enroll_approved | approved |
| approved | allow_publishing | publishing_allowed |
| approved / publishing_allowed | pause | paused (stores prior) |
| paused | resume | prior approved / publishing_allowed |
| approved / publishing_allowed / paused | revoke | revoked (terminal) |

Illegal transitions → `invalid_transition` / `conflict`  
Revoked cannot silently reactivate

---

## 7. Global kill-switch precedence

Proven in domain + execute unit tests:

| Case | Result |
| --- | --- |
| Global OFF + `publishing_allowed` | DENIED (`feature_disabled` / `publishing_globally_disabled`) |
| Global ON + absent | DENIED |
| Global ON + `approved` | DENIED |
| Global ON + `paused` / `revoked` | DENIED |
| Global ON + `publishing_allowed` + mocked other gates | may call `b18_start` mock only — **no Meta** |

---

## 8. Prepare authorization

Allowed: `approved`, `publishing_allowed`  
Denied: absent, `paused`, `revoked`  

Wired in `prepare-b18-instagram-image-publication-action.ts` via `assertClosedBetaPrepareAllowed`  
Does not require `SOCIAL_PUBLISHING_ENABLED`

---

## 9. Execute authorization

Requires: global ON ∧ `publishing_allowed` ∧ Owner/Admin ∧ (existing connection/lifecycle layers)

Wired in:

- `execute-b18-instagram-image-publication-action.ts`
- `b18-execute-image-publication.ts` (re-check before `b18_start`)

User-safe codes: `feature_disabled`, `closed_beta_*`, `forbidden`, lifecycle/connection codes

---

## 10. Operator mutation contract

Public RPCs (granted to **service_role only**, revoked from authenticated):

- `platform_enroll_social_closed_beta_organization`
- `platform_allow_social_closed_beta_publishing`
- `platform_pause_social_closed_beta_enrollment`
- `platform_resume_social_closed_beta_enrollment`
- `platform_revoke_social_closed_beta_enrollment`

Require session GUC `zyntix.social_closed_beta_operator=on`  
Atomic transition + audit event  
Never deletes Social evidence

Customer read: `get_social_closed_beta_enrollment_status` (Owner/Admin)  
Asserts: `assert_social_closed_beta_prepare_allowed`, `assert_social_closed_beta_publish_allowed`

---

## 11. RLS / tenancy analysis

- Enrollment/events SELECT scoped by `private.has_org_role(..., owner|admin)`
- No authenticated mutation grants on tables or operator RPCs
- Self-promotion impossible via session client
- Narrow service_role EXECUTE on operator RPCs only (+ operator GUC)

---

## 12. B1.9 preservation

- Did **not** REPLACE `b18_start` / `create_social_publication` bodies in this migration (avoids regressing claim/start semantics)
- App-layer entitlement is authoritative for R1-A; private SQL helpers ready for later defense-in-depth wiring
- B1.9 lifecycle domain + migration security tests remain passing

---

## 13. Historical evidence preservation

No Production enrollment/abandon/execute/delete against:

- pending connection leftovers
- queued publication leftovers
- succeeded B1.8 publication

---

## 14. Migration

| Property | Status |
| --- | --- |
| Additive | Yes |
| Auto-enroll | No |
| Auto publishing_allowed | No |
| Applied to Production | **No** (prepare only) |
| Rollback risk | Drop new functions/tables; Social evidence untouched |

---

## 15. Tests

| Suite | Result |
| --- | --- |
| Targeted R1-A + Social feature/domain/security inventory | **29 files / 167 passed** |
| ESLint (`next lint`) | PASS (prior run) |
| `tsc --noEmit` | PASS (prior run with build) |
| `next build` | PASS |

---

## 16. Production boundary

Authorized: implementation + local tests + migration file  
Not authorized / not done: Production enroll, publishing ON, Meta write, credential/history mutation

---

## 17. Known limitations

1. SQL defense-in-depth inside `create_social_publication` / `b18_start` deferred (private helpers exist; app asserts enforce)
2. Operator UX is R1-B (RPCs only here)
3. Non-enrolled nav hide is R1-C
4. Migration not yet applied to Production

---

## 18. Next required slice

`SMM-R1-B — PLATFORM OPERATOR ENROLLMENT CONTROLS & SOCIAL READ MODEL`  
Requires separate owner authorization. **Do not start automatically.**

---

## 19. Git status

| Item | Value |
| --- | --- |
| Design commit | `3c5d985` |
| Implementation commit | `8874fde` |
| Evidence commit / HEAD | `88307e0` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence after push | `0 0` |
| Worktree | clean |

*(Exact SHAs recorded in chat closure; this evidence file was committed as `88307e0`.)*

