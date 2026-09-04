# BETA1-4TG-APPSHELL-GATING — Context-Driven Navigation and Route Access

| Field | Value |
| --- | --- |
| Phase | **BETA1-4TG-APPSHELL-GATING — CONTEXT-DRIVEN NAVIGATION, MODULE VISIBILITY & FAIL-CLOSED ROUTE ACCESS** |
| Parent | BETA1-4TG-CONTEXT-PACKS |
| Document type | Shared productization / access-control evidence |
| Date | 2026-09-01 |
| Formal status | `BETA1-4TG-APPSHELL-GATING CLOSED WITH EVIDENCE — APPSHELL NAVIGATION AND EXISTING TARGET ROUTE ACCESS ARE CONTEXT-DRIVEN AND FAIL CLOSED` |
| Scope freeze authority | `docs/phases/BETA1-4TG-SCOPE-FREEZE-four-target-group-product-acceptance-contract-evidence.md` |
| Context packs authority | `docs/phases/BETA1-4TG-CONTEXT-PACKS-additive-cap-ctx-productization-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `7ef172f7289432602c8080fdf3b35aaa541e0745` |
| Production mutations | **none** |

This phase replaces Course-Seller-hardcoded AppShell visibility with authoritative context/capability-driven module access using the existing context resolver.

It does **not** promote TG2/TG3/TG4 to `beta_supported`, implement ONBOARDING-1A, implement terminology broadly, or create domain features (Projects, Field, Product modules).

**BETA-1 CORE = 100% CLOSED WITH EVIDENCE**

**FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE**

**CAPABILITY DECLARED ≠ MODULE IMPLEMENTED**

**UNRESOLVED CONTEXT ≠ COURSE-SELLER FALLBACK**

**NEXT REQUIRED PHASE = BETA1-4TG-TERMINOLOGY**

---

## 1. Executive verdict

`BETA1-4TG-APPSHELL-GATING CLOSED WITH EVIDENCE — APPSHELL NAVIGATION AND EXISTING TARGET ROUTE ACCESS ARE CONTEXT-DRIVEN AND FAIL CLOSED`

AppShell primary navigation and representative Knowledge-only route loaders now derive visibility and access from resolved organization context via a centralized product module registry. TG1 Knowledge/OCB preserves the accepted Course Seller nav matrix. TG2/TG3/TG4 receive only lawful shared modules for implemented routes. Unresolved context fail-closes to Home-only nav. No database migration. No production writes.

---

## 2. Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `7ef172f7289432602c8080fdf3b35aaa541e0745` |
| Final HEAD | `2cef79fb069b0f9b6c0f56f1d2afd37f6c02ee36` |
| Implementation commit | `2edf4276492435e8a791517daa0a5035d0adfb42` — `feat(beta1): gate app shell by resolved context` |
| Evidence HEAD commit | `2cef79f` — `docs(beta1): record appshell-gating closure HEAD` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | *(verified after push)* |
| Worktree | clean after commit |

---

## 3. Investigation

### 3.1 Before state

| Finding | Evidence |
| --- | --- |
| AppShell hardcoded CS nav | `PROGRAMS_NAV_VISIBLE`, `ENROLLMENTS_NAV_VISIBLE`, `PROGRESS_NAV_VISIBLE`, `ATTENTION_NAV_VISIBLE` all `true` in domain navigation files |
| No resolver consumer in shell | Context resolver existed under `src/features/context-resolver/` with zero AppShell wiring |
| Authenticated layout | Passthrough only (`src/app/(authenticated)/layout.tsx`) |
| Org resolution | Per-feature `resolve*PageOrganization` helpers; membership via `resolveOrganizationContext` |
| RBAC | Members fail-closed via `resolveMembersNavVisible` + route loader `canAccessMemberAdministration` |
| Access denial UX | Social/Members use in-page “Access denied” panels |
| Implemented routes | Home, Leads, Customers, Programs, Enrollments, Progress, Tasks, Attention, Members, Social |

### 3.2 Integration point

Server-side `loadProductModuleAccess(organizationId)` calls `resolvePrimaryBusinessActivityContext` with mode `internal_qa` (admits `context_ready` packs without CTX promotion). Loaded from all `resolve*PageOrganization` ready paths and passed to AppShell via `moduleNavVisibility`.

### 3.3 Server/client boundary

Authorization decisions occur in server loaders. AppShell receives pre-resolved `moduleNavVisibility` only (presentation). Route loaders enforce access via shared `evaluateProductModuleRouteAccess`.

---

## 4. Implemented architecture

### 4.1 Central module registry

`src/features/product-access/domain/module-registry.ts` — single source of truth for **implemented** modules only:

| Module | Route | Capability gate |
| --- | --- | --- |
| home | `/home` | none (baseline) |
| leads | `/leads` | `shared.crm.leads` (min recommended) |
| customers | `/customers` | `shared.crm.customers` (required) |
| programs | `/programs` | `knowledge.programs` (required) |
| enrollments | `/enrollments` | `knowledge.enrollments` (required) |
| progress | `/progress` | `knowledge.progress` (required) |
| attention | `/attention` | `core.attention` (required) |
| tasks | `/tasks` | `core.tasks` (required) |
| members | `/settings/members` | `core.member-administration` (required) + RBAC |

### 4.2 Access helper

`src/features/product-access/domain/module-access.ts`:

- `buildModuleNavVisibility(relevantCapabilities)`
- `canAccessModule({ moduleId, access })`
- `FAIL_CLOSED_MODULE_NAV_VISIBILITY` — Home only

### 4.3 Route enforcement

`src/features/product-access/server/enforce-product-module-access.ts` — shared guard used by Programs, Enrollments, and Progress page loaders (list + workflow routes).

---

## 5. Navigation matrix (implemented modules only)

| Module | Knowledge/OCB | Service | Field | Product | Unresolved |
| --- | --- | --- | --- | --- | --- |
| Home | visible | visible | visible | visible | visible |
| Leads | visible | visible | visible (recommended) | hidden | hidden |
| Customers | visible | visible | visible | visible | hidden |
| Programs | visible | hidden | hidden | hidden | hidden |
| Enrollments | visible | hidden | hidden | hidden | hidden |
| Progress | visible | hidden | hidden | hidden | hidden |
| Attention | visible | visible | visible | visible | hidden |
| Tasks | visible | visible | visible | visible | hidden |
| Members | role-gated | role-gated | role-gated | role-gated | hidden |

Social nav unchanged (closed-beta enrollment gate). Members combines context capability **and** Owner/Admin RBAC.

---

## 6. Capability vs module distinction

Examples enforced by registry (implemented flag + capability gate):

| Declared capability | Nav link created? |
| --- | --- |
| `shared.projects` | **No** — no Projects route exists |
| `field.work-orders` | **No** |
| `product.orders` | **No** |
| `knowledge.programs` | **Yes** — when context maps capability |

---

## 7. Direct-route protection

Server loaders deny with `kind: "forbidden"` and user-facing message *“This area is not available for your organization.”*

Protected modules (representative + extended):

- Programs (all program loaders)
- Enrollments (all enrollment loaders)
- Progress (all progress loaders)

Tests: `tests/features/product-access/beta1-4tg-appshell-gating.test.ts` (route bypass section).

---

## 8. Fail-closed behavior

| Condition | Nav behavior |
| --- | --- |
| Resolver failure | Home only |
| Missing/unassigned context | Home only |
| Malformed/unsupported context | Home only |
| No Course Seller fallback | Programs/Leads/Customers hidden unless capabilities resolve |

Default AppShell prop when omitted: `FAIL_CLOSED_MODULE_NAV_VISIBILITY`.

---

## 9. TG1 preservation

Knowledge/OCB (`qaSemanticInput` / resolver integration test) receives full Course Seller nav: Home, Leads, Customers, Programs, Enrollments, Progress, Tasks, Attention, Members (subject to RBAC).

---

## 10. RBAC / organization isolation

- Existing `canAccessMemberAdministration` preserved for Members route and nav
- Organization membership verification unchanged in all resolvers
- Context gating **adds** capability relevance; does not replace role checks
- BQA/resolver authority untouched

---

## 11. Explicitly not implemented

- ONBOARDING-1A / operating-model selection
- BETA1-4TG-TERMINOLOGY consumption
- Projects, Field UI, Product UI modules or routes
- CTX promotion to `beta_supported`
- Database migrations
- Social execution gate changes

TG2/TG3/TG4 remain **`context_ready`** only.

---

## 12. Tests and quality

| Gate | Result |
| --- | --- |
| Targeted gating tests | 9 passed (`beta1-4tg-appshell-gating.test.ts`) |
| Programs nav tests | 2 passed (updated for context-driven visibility) |
| Full Vitest | **3372 passed / 2 failed / 3374 total** |
| Historical failures (unchanged) | `load-member-administration-page.test.ts`, `programs-enrollments-stale-copy-remediation.test.ts` |
| NEW REGRESSIONS | **0** |
| typecheck | PASS |
| lint | PASS |
| build | PASS |

New tests vs baseline: +12 (3374 − 3362).

---

## 13. Production non-effects

| Metric | Value |
| --- | --- |
| PRODUCTION DB writes | 0 |
| CUSTOMER writes | 0 |
| PRODUCTION migrations | 0 |
| DEPLOYMENTS | 0 |
| CTX beta_supported promotion | NO |
| SOCIAL execution gates changed | NO |

---

## 14. Scope compliance

| Requirement | Met |
| --- | --- |
| No Course-Seller hardcoding as target selection | Yes — `*_NAV_VISIBLE` fail-closed; AppShell uses `moduleNavVisibility` |
| Context participates in nav | Yes |
| TG1 preserved | Yes |
| TG2/TG3/TG4 Knowledge isolation | Yes |
| No fake future-capability links | Yes |
| Direct-route enforcement | Yes |
| RBAC intact | Yes |
| No migration | Yes |
| No domain implementation | Yes |

---

## 15. Final verdict

`BETA1-4TG-APPSHELL-GATING CLOSED WITH EVIDENCE — APPSHELL NAVIGATION AND EXISTING TARGET ROUTE ACCESS ARE CONTEXT-DRIVEN AND FAIL CLOSED`

Retained:

- `BETA-1 CORE = 100% CLOSED WITH EVIDENCE`
- `FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE`
- `CAPABILITY DECLARED ≠ MODULE IMPLEMENTED`
- `UNRESOLVED CONTEXT ≠ COURSE-SELLER FALLBACK`

---

## 16. Next phase

`NEXT REQUIRED PHASE = BETA1-4TG-TERMINOLOGY`

Context packs exist and AppShell/access is context-aware. The next shared productization step wires target-aware terminology into navigation and selected shared pages without mixing terminology with security logic.
