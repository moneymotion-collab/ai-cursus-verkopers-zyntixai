# SMM-R1-A-R1 — Production Schema Apply & Entitlement Defense-in-Depth — Evidence

**Verdict:** `SMM-R1-A-R1 CLOSED WITH EVIDENCE — PRODUCTION ENTITLEMENT SCHEMA & DATABASE DEFENSE VERIFIED`

---

## 1. Executive verdict

R1-A enrollment foundation and R1-A-R1 SQL entitlement defense-in-depth are applied to Production. Enrollment count remains **0**. Historical Social rows are unchanged. Database prepare/execute paths now enforce closed-beta entitlement; composed write-gate helper proves **GLOBAL GUC OFF > any org entitlement**. No Meta writes. No org enrolled. Operator UX (R1-B) not started.

---

## 2. Baseline

| Item | Value |
| --- | --- |
| Starting HEAD | `a6ba5ea` |
| Branch | `core/platform-readiness-20260707` |
| Divergence at start | `0 0` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Pre-apply remote tip | `20260818151333_add_b19_publishing_lifecycle_hardening` |
| Pre-apply enrollment tables | absent |
| Pre-apply Social inventory | connections 7 / connected IG 1 / auth_pending 6 / publications 4 / succeeded 1 / queued 3 / attempts 1 |

Note: local B1.8/B1.9 migration version timestamps differ from remote (`20260818130747`/`20260818145249` local vs `20260818131727`/`20260818151333` remote). Apply used targeted SQL execution of the two new migrations only (no `db push` of mismatched history).

---

## 3. Authorization-boundary audit

| Boundary | Path | Bypass risk before R1-A-R1 |
| --- | --- | --- |
| Prepare | app action → `create_social_publication` RPC | Authenticated Owner/Admin could call RPC directly and skip app entitlement |
| Execute | app action → `b18_start` → private.start → adapter | Same: direct `b18_start` skipped app entitlement |
| Operator enroll | platform_* RPCs | Already service_role + operator GUC (R1-A) |

---

## 4. App vs SQL enforcement

| Layer | Prepare | Execute |
| --- | --- | --- |
| App | `assertClosedBetaPrepareAllowed` | env kill switch + `assertClosedBetaPublishAllowed` |
| SQL | `private.social_closed_beta_prepare_result_code` inside `create_social_publication` | `private.social_closed_beta_publish_result_code` **before** in-transaction publishing GUC arm in `b18_start` |
| Composed probe | — | `private.social_provider_write_gate_result_code` / `evaluate_social_provider_write_gates` (GUC first, then enrollment; does not arm) |

`set_config(..., is_local=true)` is transaction-scoped, so a separate “arm” RPC cannot span PostgREST calls. B1.8/B1.9 in-transaction GUC arming is preserved **after** entitlement.

Operational global kill switch remains app `SOCIAL_PUBLISHING_ENABLED`. SQL proves GUC-off denies via composed gate without arming.

---

## 5. Prepare contract (SQL)

| Status | Result |
| --- | --- |
| absent | `closed_beta_not_enrolled` |
| approved | allow (`ok`) |
| publishing_allowed | allow |
| paused | `closed_beta_paused` |
| revoked | `closed_beta_revoked` |

---

## 6. Execute contract (SQL)

| Condition | Result |
| --- | --- |
| absent / approved / paused / revoked | deny (`closed_beta_*`) before GUC arm |
| publishing_allowed + GUC not armed in composed probe | `feature_disabled` |
| publishing_allowed + in-transaction arm after entitlement | may claim/start per B1.9 (app must still keep env OFF in Production) |

---

## 7. Global kill-switch precedence

Production probe:

- `private.social_publishing_execution_enabled()` → **false**
- `social_provider_write_gate_result_code(<absent-org>)` → **`feature_disabled`** (GUC checked before enrollment)

Invariant: GLOBAL OFF > entitlement.

---

## 8. Operator security

- `authenticated` execute on `platform_enroll_*` → **false**
- `service_role` execute on `platform_enroll_*` → **true**
- Operator mutations still require `zyntix.social_closed_beta_operator=on`
- No self-promotion path for Owner/Admin

---

## 9. Migration changes

| File | Role |
| --- | --- |
| `20260818190346_add_social_closed_beta_enrollment_foundation.sql` | R1-A tables/events/operator RPCs/asserts (applied) |
| `20260818191706_add_social_closed_beta_entitlement_defense_in_depth.sql` | R1-A-R1 create/b18 entitlement + composed gate (applied) |

Apply method: `supabase db query --linked -f …` then recorded in `supabase_migrations.schema_migrations`.

---

## 10. Tests

| Suite | Result |
| --- | --- |
| Social + R1-A + R1-A-R1 security/domain | **30 files / 173 passed** |
| typecheck | PASS |
| lint | PASS |
| production build | PASS |

---

## 11. Production apply

| Step | Status |
| --- | --- |
| Additive proven | PASS |
| Zero auto-enrollment | PASS |
| Publishing OFF | PASS (app policy + GUC false) |
| Foundation apply | PASS |
| Defense apply | PASS |
| Migration history rows | `20260818190346`, `20260818191706` |

---

## 12. Production row verification (post-apply)

| Check | Value |
| --- | --- |
| enrollments table | present, RLS on |
| events table | present, RLS on |
| enrollment_count | **0** |
| enrollment_event_count | **0** |
| helpers/RPCs | present |
| connections | 7 |
| connected Instagram | 1 |
| auth_pending | 6 |
| publications | 4 |
| succeeded | 1 |
| queued | 3 |
| attempts | 1 |
| b18 entitlement before GUC arm | true |
| create prepare entitlement | true |

---

## 13. Historical-data preservation

No change vs pre-apply inventory for connections, publications, attempts, leftovers.

---

## 14. Provider-write verification

- No new publication attempts beyond historical 1
- No Meta calls performed by this slice
- GUC publishing execution remains false at rest

---

## 15. Known limitations

1. Local vs remote B1.8/B1.9 migration version timestamp drift remains (pre-existing); not repaired in this slice.
2. App env remains the operational emergency kill switch for authenticated `b18_start` (in-transaction GUC arm after entitlement). Keep Production **unenrolled** until R1-E.
3. Residual: an enrolled Owner could still call `b18_start` via PostgREST even if Vercel env is OFF; mitigate with pause/revoke + zero enrollments until authorized windows.

---

## 16. Next slice

`SMM-R1-B — PLATFORM OPERATOR ENROLLMENT CONTROLS & SOCIAL READ MODEL`  
Requires separate owner authorization. **Do not start automatically.**

---

## 17. Git state

| Item | Value |
| --- | --- |
| Implementation | `af214e4` |
| Evidence / HEAD | `11fb62b` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |
