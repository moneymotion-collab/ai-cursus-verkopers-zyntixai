# B1-C5 — Course Sellers Beta-1 UX, Mobile & Product Polish — Evidence

## 1. Executive verdict

**B1-C5 CLOSED WITH EVIDENCE — COURSE SELLERS BETA-1 UX, MOBILE & PRODUCT POLISH PRODUCTION VERIFIED**

Course Sellers Beta-1 critical routes were inventoried, polished for loading/nav/copy honesty, verified on desktop/mobile/tablet via authenticated Production browser automation, and deployed to `www.zyntixai.com`. No new business domain. Social remains OFF. Invitation gates remain resting. B1-FV was not started.

## 2. Authoritative baseline

| Field | Value |
|---|---|
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `4dc1482` (B1-C4 evidence) |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Prior phases | B1-MA · B1-C1 · B1-C2 · B1-C3 · B1-C4 ✅ |
| Start www deploy | `dpl_CEABHUAj2np7LDS4LymsjxmwjsBQ` |
| Final www deploy | `dpl_9Vze4Fwh4ZAmKdqVv9q28pUNgUa8` → `https://www.zyntixai.com` |
| Final HEAD | `4bd101a` |
| Evidence commit | `4bd101a` |

## 3. Scope / non-scope

**In scope:** UX, responsive, accessibility blockers, misleading copy, nav/org context, loading/empty/error honesty, stale UI, dead actions, migration-list test drift classification.

**Out of scope / not introduced:** new CRM domains, task systems, enrollment lifecycle states, Attention signals, AI, analytics, Social providers/Stories, billing, reporting, verticalization. R1-F remains paused.

## 4. Route inventory

| Route | Purpose | Roles | Beta-1 | Notes |
|---|---|---|---|---|
| `/login` + auth flows | Sign-in / invite continuation | all | CRITICAL | Existing; not rebuilt |
| onboarding | First-value setup | Owner/Admin | CRITICAL | Existing |
| `/home` | Daily Operating Composition | membership | CRITICAL | Loading shell polished |
| `/leads` (+ detail/create/edit) | Pipeline | membership | CRITICAL | Org-aware nav |
| `/customers` (+ detail/…) | Customer ops | membership | CRITICAL | Org-aware nav |
| `/programs` (+ detail/…) | Program catalog | membership | CRITICAL | Org-aware nav |
| `/enrollments` (+ detail/…) | Enrollment ops + B1-C4 metadata | membership | CRITICAL | Loading shell + org nav |
| `/progress` (+ detail/…) | Progress facts | membership | CRITICAL | Org-aware nav |
| `/attention` (+ detail) | Attention + evaluate | membership / Owner-Admin mutate | CRITICAL | Soft-nav org preserved |
| `/tasks` (+ detail/…) | Work | membership | CRITICAL | Org-aware nav |
| `/settings/members` | Members + invitations | Owner/Admin | CRITICAL | Gate-aware rollout notice |
| `/social` (+ operator) | Social closed beta | enrolled | NOT BETA-1 CUSTOMER FLOW | Parallel; OFF publishing |
| Settings misc | org selector / logout | membership | SUPPORTING | |

Desktop/mobile: critical routes load; mobile no document overflow (browser matrix). Empty/populated/error handled by existing domain panels; no false-empty regressions found on Production control org.

## 5. Owner journey

Automated Production Owner journey (read-only):

login (storageState) → Home → Attention → Enrollments → Progress → Programs → Customers → Tasks → Members → Home

Org query preserved on every hop after soft-nav fix. No dead-end traps observed on critical hops.

## 6. Navigation audit

- Desktop primary nav: flex-wrap retained (B1-C1 regression check OK).
- Mobile/tablet: nav usable; no horizontal overflow on critical routes.
- Active state preserved.
- Members visibility remains role-derived (fail-closed).
- **Fix:** primary links now carry `org` (server selection) and `OrgAwareLink` falls back to URL `org` so `loading.tsx` shells cannot drop tenant context during soft navigation.

## 7. Terminology audit

User-facing labels remain coherent: Customer, Lead, Enrollment, Program, Progress, Task, Attention, Member, Invitation, Owner/Admin/Staff/Viewer. Internal “Student” appears only in onboarding option taxonomy — not conflicting CS shell labels. No casual DB renames.

## 8. Copy audit

| Finding | Action |
|---|---|
| Members rollout notice hard-coded delivery-disabled regardless of acceptance-only cases | **Fixed** — independent acceptance + delivery gate copy |
| Invitation “coming soon” / placeholder customer copy | Not found on CS critical surfaces |
| Generic transport errors | Accepted Beta pattern where no safer domain message exists |

## 9. Loading states

| Surface | Change |
|---|---|
| `/home/loading` | AppShell + Today title/subtitle + skeleton (no bare intermediate page) |
| `/enrollments/loading` | AppShell + enrollments skeleton (aligned with programs/progress pattern) |
| Other critical list loadings | Already AppShell-aligned |

No arbitrary fixed delays. `aria-busy` / `aria-live` retained.

## 10. Empty states

Existing domain empty copy retained (e.g. “No work is due today.” vs create-first guidance). Home calm state only when nothing actionable — unchanged B1-C1 contract.

## 11. Error states

Query failures continue to use error panels (not empty lists) on Attention/Members/etc. No SQL/stack leakage observed in Production crawl.

## 12. Success states

No Production mutations performed in B1-C5. Existing pending/disabled patterns for invitations/Attention/progress left intact from prior phases.

## 13. Forbidden/not-found

Prior tenant/role security coverage retained. Browser crawl: no unexpected 401/403/5xx on authorized Owner critical routes. Viewer browser session not required (domain/security automation already covers Viewer boundaries; temporary B1-C2 QA Viewer role unchanged).

## 14. Forms

Critical forms (invite, filters, create/edit) already labelled; no Beta-blocking form defects found requiring C5 changes.

## 15. Actions / dead-end audit

Placeholder/dead customer actions not found on critical CS routes. Social “publishing temporarily unavailable” is truthful given gate OFF (non CS-blocking).

## 16. Desktop QA

Critical routes load + refresh + org persistence — Playwright desktop project **passed**.

## 17. Mobile QA

iPhone 13 Chromium project: critical routes + `scrollWidth <= clientWidth` — **passed**.

## 18. Tablet QA

iPad Mini Chromium project: home + enrollments + members — **passed**.

## 19. Accessibility

Landmarks (`main`, labelled Primary nav), headings, focus-visible contracts retained. Loading regions announce politely. No keyboard-trap blockers found on critical Owner crawl.

## 20. Role UX

Owner browser matrix verified. Admin/Staff/Viewer contracts remain server-authoritative from prior phases; UI Members nav fail-closed for Staff/Viewer. No Viewer storageState bootstrap required.

## 21. Tenant UX

Wrong-org / cross-tenant denial remains prior-phase verified. Org query preservation reduces accidental multi-org confusion.

## 22. Cross-module context

Owner journey asserts `org=<control>` across Home ↔ Attention ↔ Enrollments ↔ Progress ↔ Programs ↔ Customers ↔ Tasks ↔ Members ↔ Home.

## 23. Refresh/back/deep-link

Critical routes: direct load + hard reload covered in desktop matrix. Soft-nav org regression fixed and retested.

## 24. Stale-state audit

No new mutation staleness defects found in read-only C5 sweep. Prior revalidation contracts (Attention evaluate, progress) unchanged.

## 25. Performance

| Class | Finding |
|---|---|
| P1 | None for Beta |
| P2 | Social nav client reveal CLS (fail-closed) — accepted |
| P3 | Broader list virtualization — later |

## 26. List/pagination review

Existing pagination/filters on Leads/Customers/Tasks/Programs/Enrollments/Attention/Progress remain; no unbounded-list Beta blockers observed on control org.

## 27. Detail consistency

Enrollment operational metadata (B1-C4) + Attention detail + Task detail patterns remain recognizable; no forced identical layouts.

## 28. Design-system consistency

Reused Alert, AppShell, existing loading skeletons. No design-system rewrite.

## 29. Historical finding reassessment

| Item | Verdict |
|---|---|
| `/home` loading flash | **Fixed** (AppShell Today skeleton) |
| Invitation delivery copy | **Fixed** (dual-gate notice); B1-C2 root cause not reopened |
| Mobile primary nav wrap | **No regression** |
| Already-verified user pushed to resend | **No regression** (B1-C2 remains closed) |

## 30. Placeholder/dead-end scan

Customer-reachable CS surfaces: no actionable `coming soon` / `href="#"` defects. Social/operator placeholders remain Social-parallel.

## 31. Console/network health

Playwright page-health collector asserted no unexpected product 401/403/5xx during matrix. Hydration/product exceptions: none blocking.

## 32. Migration-drift assessment

| Item | Detail |
|---|---|
| Test | `tests/domain/social-universal-architecture.test.ts` social migration list |
| Drift | Expected list lagged two existing Social migrations already in repo |
| Classification | **A — stale test expectation** |
| Product/schema impact | None |
| Action | Updated expected list to include `20260819101500_…4xx_diagnostic…` and `20260819120000_…publish_window_binding…` |
| B1-FV | **SAFE TO DEFER PAST B1-FV** was incorrect once classified as stale metadata — **fixed in C5** without schema change |

**MUST FIX BEFORE B1-FV?** No remaining migration uncertainty for Course Sellers runtime.

## 33. Issue inventory

| ID | Route | Viewport | Role | Category | Description | Severity | Action |
|---|---|---|---|---|---|---|---|
| C5-01 | `/home` | all | Owner | loading | Bare loading page / layout jump | HIGH | Fixed |
| C5-02 | `/settings/members` | all | Owner | copy | Rollout notice not dual-gate aware | HIGH | Fixed |
| C5-03 | primary nav | all | multi-org | navigation | Soft-nav dropped `org` via loading shells | HIGH | Fixed |
| C5-04 | primary nav | all | multi-org | navigation | Several nav hrefs omitted `org` even on SSR | HIGH | Fixed |
| C5-05 | CI | n/a | n/a | tests | Social migration list drift | MEDIUM | Fixed (stale expect) |
| C5-06 | Social nav | all | enrolled | polish | Client reveal CLS | POLISH | Deferred accepted |
| C5-07 | Home calm | desktop | Owner | IA | Four empty sections when calm | POLISH | Accepted (B1-C1 contract) |

No unresolved BLOCKER/HIGH remaining.

## 34. Implemented fixes

1. Home loading AppShell + Today skeleton (`loading.tsx` + `loading.module.css`)
2. Enrollments loading AppShell skeleton
3. Members dual-gate rollout notice + members page wiring
4. Org-aware primary nav + `OrgAwareLink` URL fallback
5. Social migration expectation alignment
6. B1-C5 Playwright desktop/mobile/tablet matrix

## 35. Deferred non-blocking polish

- Social primary-nav client reveal CLS
- Home calm multi-section verbosity (contractual)
- Formal a11y certification beyond Beta blockers
- Tablet pixel perfection beyond usability

## 36. Automated tests

| Layer | Result |
|---|---|
| typecheck | pass |
| lint | pass |
| vitest (invitations + daily-operating + nav/a11y + social-universal + org-aware-link) | **309** related invitations/daily-operating suite earlier; targeted nav suites pass; org-aware-link **2** pass |
| Playwright B1-C5 matrix | **5 passed / 0 failed** |

Pre-existing unrelated failures: none newly introduced; social-universal drift resolved.

## 37. Browser QA

| Project | Spec | Result |
|---|---|---|
| desktop-chromium | critical routes + Owner journey + home chrome | pass |
| mobile-chromium | critical routes overflow | pass |
| tablet-chromium | home/enrollments/members | pass |

Auth: existing gitignored `playwright/.auth/production-owner.json` (never committed).

## 38. Production verification

| Check | Result |
|---|---|
| Deploy Ready | `dpl_9Vze4Fwh4ZAmKdqVv9q28pUNgUa8` |
| www alias | exact `https://www.zyntixai.com` |
| Course Sellers flows | present (matrix) |
| Social open windows | **0** |
| Invitation Members notice | restricted-rollout / gate-aware UI present |
| Destructive Production mutation | **none** |

## 39. Beta-1 quality scorecard

| Area | Rating |
|---|---|
| Authentication | RELEASE QUALITY |
| Onboarding | STRONG |
| Home | STRONG |
| Leads | ACCEPTABLE FOR BETA |
| Customers | ACCEPTABLE FOR BETA |
| Tasks | STRONG |
| Programs | ACCEPTABLE FOR BETA |
| Enrollments | STRONG |
| Progress | STRONG |
| Attention | STRONG |
| Members | STRONG |
| Settings | ACCEPTABLE FOR BETA |
| Navigation | STRONG |
| Mobile | STRONG |
| Accessibility | ACCEPTABLE FOR BETA |
| Errors | ACCEPTABLE FOR BETA |
| Loading | STRONG |
| Performance | ACCEPTABLE FOR BETA |
| Role UX | STRONG |
| Tenant UX | STRONG |

No NEEDS FIX / BLOCKED remaining for C5 closure.

## 40. B1-FV readiness

### ALLOWED TO ENTER B1-FV

- Auth, onboarding, Home DOC, Leads/Customers/Tasks/Programs/Enrollments/Progress/Attention/Members as verified
- Invitation delivery/acceptance resting gates
- Social OFF / parallel
- Accepted polish items in §35

### MUST NOT ENTER B1-FV

- None unresolved from C5 inventory

B1-FV must remain verification-only — not started here.

## 41. Social safety

- `SOCIAL_PUBLISHING_ENABLED` present in Production env inventory (not mutated this phase)
- Open controlled publish windows: **0**
- No Instagram provider writes
- R1-F not resumed
- Stories not started

## 42. Known limitations

- Social nav may briefly resolve visibility client-side (fail-closed)
- Viewer authenticated browser storageState not created (not required)
- Subjective visual hierarchy polish remains optional human judgment

## 43. Git state

| Field | Value |
|---|---|
| Implementation commits | `9a88008` · `e70e46b` · `168a48f` |
| Evidence SHA | `4bd101a` |
| Final HEAD | `4bd101a` |
| Branch | `core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |
| Secrets | no `.vercel` / auth / tokens committed |

## 44. Closure verdict

**B1-C5 CLOSED WITH EVIDENCE — COURSE SELLERS BETA-1 UX, MOBILE & PRODUCT POLISH PRODUCTION VERIFIED**

Definition of Done (1–30): satisfied. Stop before B1-FV.
