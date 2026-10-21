# SMM-R1-C — Closed Beta Customer Access & Onboarding UX Evidence

**Phase:** `SMM-R1-C — CLOSED BETA CUSTOMER ACCESS & ONBOARDING UX`  
**Date:** 2026-08-18  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw`

---

## 1. Executive verdict

```text
SMM-R1-C CLOSED WITH EVIDENCE — CLOSED BETA CUSTOMER ACCESS & ONBOARDING UX VERIFIED
```

Customer Social UX is enrollment-state aware. Not-enrolled organizations get an honest closed-beta gate without Connect/Prepare/Execute CTAs and without Social primary-nav discovery. Enrolled states surface customer-safe copy and action gating while server/SQL authorization remains authoritative. Production remains at **0 enrollments / 0 events**, global publishing OFF, zero provider writes.

---

## 2. Authoritative baseline

| Item | Value |
| --- | --- |
| Prior milestone | `SMM-R1-B CLOSED WITH EVIDENCE` |
| Prior HEAD | `afdbf28` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Production migration tip | `20260818194719` |
| Enrollments / events | `0` / `0` |
| Publishing GUC | unset/false |
| Historical Social inventory | 1 connected IG, 6 pending, 1 succeeded, 3 queued, 1 attempt |

---

## 3. Enrollment-state UX contract

| State | Nav | Direct `/social` | Connect | Prepare | Execute |
| --- | --- | --- | --- | --- | --- |
| Not enrolled | Hidden | Honest closed-beta gate | No | No | No |
| Approved | Visible | Workspace + beta status | Yes* | Yes | No |
| Publishing allowed | Visible | Workspace + platform-unavailable copy when global OFF | Yes* | Yes | Only if global + existing checks |
| Paused | Visible | Read-only status + history | No | No | No |
| Revoked | Visible | Read-only status + history | No | No | No |

`*` still subject to `SOCIAL_CONNECTIONS_ENABLED` / Instagram connection gates and Owner/Admin role.

**Revoked/paused nav decision:** show Social nav so customers can reach honest status and historical read-only evidence. Not enrolled remains hidden.

---

## 4. Navigation behavior

* `SocialPrimaryNavLink` is a client component (AppShell is shared with client error boundaries).
* Starts **hidden**, then reveals only after `getSocialClosedBetaNavVisibleAction` resolves enrollment for `selectedOrganizationId` (or explicit `socialNavVisible`).
* Never briefly exposes Social for not-enrolled orgs (no unauthorized flash).
* Label: `Social — Closed Beta`.
* Explicit `socialNavVisible` AppShell override supported (`/social` passes derived value).
* `/social` loader still server-gates CTAs before panel render.

---

## 5. Direct-route behavior

`/social` remains canonical. Outcomes:

* auth / no org / org required / feature disabled / forbidden / query error (existing)
* **`closed_beta_not_enrolled`** — dedicated panel, no inventory CTAs
* **`success`** — enrolled states with `closedBeta` read model

Does not 404 for absent enrollment. Does not leak other orgs’ enrollment.

---

## 6. First-run onboarding

Overview next-steps for `approved` / `publishing_allowed`:

1. What Social Beta is (badge + status copy)
2. Connect Instagram when allowed
3. Prepare when eligible
4. Why publishing is blocked (org entitlement vs platform availability)

Reuses existing Accounts / Publish / Activity sections. No new content/calendar systems.

---

## 7. Role behavior

Unchanged from Beta 1:

* Owner/Admin: may use enrolled Social capabilities
* Member/Staff/Viewer: still forbidden from Social management (`canManageSocialConnections`)
* Enrollment does not expand Staff/read-only Social privileges

---

## 8. Multi-org behavior

Enrollment resolved per selected `?org=` / active organization in loader and nav link. Org switcher on `/social` reloads with new org. No cross-org entitlement bleed in server paths (org-scoped RPC + asserts).

---

## 9. Connect eligibility

UI hides Connect when not allowed. Server `assertClosedBetaConnectAllowed` on `startR1InstagramConnectAction` (approved / publishing_allowed only). Connection env gates remain dominant.

---

## 10. Prepare eligibility

UI disables prepare when denied. Existing `assertClosedBetaPrepareAllowed` remains authoritative. Customer-safe closed-beta error mapping in Publish panel.

---

## 11. Publish eligibility

Separates:

1. enrollment
2. org publishing entitlement
3. platform publishing availability
4. connection readiness
5. lifecycle eligibility

Customer reasons avoid env/GUC/RPC terminology. Global OFF → “Publishing is temporarily unavailable.”

---

## 12. Safe customer read model

Refined `buildSocialClosedBetaCustomerReadModel`:

* `isEnrolled`, action flags, nav/historical flags
* `customerHeadline` / `customerBody` / `betaBadgeLabel` / `nextRecommendedAction`
* Informational only — mutations still server/SQL enforced

---

## 13. Closed-beta copy

Professional restrained labeling: `Social — Closed Beta`. No GA / Stories / Reels / multi-provider / analytics claims.

---

## 14. Feedback/support disposition

No existing support/feedback module found. R1-C does not invent a waitlist/feedback backend. Rollout ops may use existing owner contact patterns outside product UI.

---

## 15. Accessibility/responsive smoke

State panels and status regions use headings + `role="status"` / `role="alert"` where appropriate. Section nav remains keyboard-link based. Mobile-width flex wrap retained from B1.10 shell/panels.

---

## 16. Security review

* Customer cannot self-enroll or call operator mutations
* Operator allowlist/service-role not in customer surfaces
* Hidden nav is presentation-only; `/social` + action asserts enforce
* Prepare/execute/connect asserts remain server-side
* Global publishing kill switch remains dominant for execute

---

## 17. Operator/customer boundary

R1-B operator routes unchanged. R1-C does not configure Production operator allowlist or enroll anyone. Customer not-enrolled UX does not depend on operator UI being enabled.

---

## 18. Tests

| Suite | Result |
| --- | --- |
| Social + domain + security | **49 files / 282 passed** |
| typecheck | PASS |
| lint | PASS |
| isolated production build | PASS |

Focused R1-C coverage: nav matrix, action matrix, customer copy safety, loader/page wiring, connect assert, operator/secret non-leakage, B1.10 redirect regression.

---

## 19. Production-safe verification

Read-only Production checks (no enrollment mutations):

* enrollments `0`, events `0`
* historical Social inventory unchanged
* GUC unset/false
* Expected customer experience after deploy: not-enrolled gate + Social nav hidden for ordinary orgs

Approved/paused/revoked/publishing_allowed verified via fixtures/tests only (STOP for Production enrollment).

---

## 20. Production enrollment/event counts

| Metric | Value |
| --- | --- |
| enrollments | **0** |
| enrollment events | **0** |

---

## 21. Historical-data preservation

| Metric | Preserved |
| --- | --- |
| connected Instagram | 1 |
| authorization_pending | 6 |
| succeeded publications | 1 |
| queued leftovers | 3 |
| attempts | 1 |
| provider-write delta | **0** |

Note: with Production enrollment absent, historical Social rows are not exposed through normal customer `/social` success workspace until R1-D enrollment. Operator/history evidence remains authoritative.

---

## 22. Known limitations

* Staff/Viewer Social management remains out of scope (B1.10)
* No in-product feedback destination
* Production operator UI may remain fail-closed until separate env configuration
* Residual R1-A-R1 note: keep Production unenrolled and global publishing OFF

---

## 23. Next phase

```text
SMM-R1-D — FIRST CONTROLLED PRODUCTION ENROLLMENT
```

Do not begin automatically. R1-D is the first phase authorized to enroll exactly one approved internal/test organization via the operator path. It does not automatically authorize a provider write.

---

## 24. Git status

| Item | Value |
| --- | --- |
| Implementation | `72ed9b6` |
| Evidence | `fe54e0d` |
| Branch | `core/platform-readiness-20260707` |

### Database/migration

No new migration (R1-C is route/UI/read-model only).
