# B1-FV — Course Sellers Beta-1 Final End-to-End Release Verification — Evidence

## 1. Executive verdict

**COURSE SELLERS BETA 1 RELEASE READY WITH EVIDENCE**

The complete Course Sellers Beta-1 product was re-verified on Production as one integrated system: Owner journeys, domain chains (via prior closed-phase evidence + fixtures + live read-only Production), role/tenant contracts, migration confidence, feature-gate resting state, desktop/mobile/tablet browser packs, and Git/evidence authority. One HIGH tenant-honesty defect discovered during B1-FV (silent single-org fallback under a foreign `org` query) was corrected with the smallest durable selection-contract fix, redeployed, and re-verified. Social remains OFF / parallel. No external provider writes. B1-FV did not start later roadmap work.

## 2. Authoritative baseline

| Field | Value |
|---|---|
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `6b51a8e` |
| Divergence at start | `0 0` |
| Worktree at start | clean |
| Start www deploy | `dpl_9Vze4Fwh4ZAmKdqVv9q28pUNgUa8` |
| Final www deploy | `dpl_89FSF8D5pKuJYuCuQnGvsw1PRscd` → `https://www.zyntixai.com` |
| Closed phases | B1-MA · B1-C1 · B1-C2 · B1-C3 · B1-C4 · B1-C5 |

Authoritative evidence present for B1-MA and B1-C1…C5 under `docs/phases/`.

## 3. Frozen Beta-1 scope

| Module | Beta-1 required? | Status | Prod verified? | Security verified? | FV requirement |
|---|---|---|---|---|---|
| Authentication | Yes | Complete | Yes (session) | Yes | PASS |
| Organization | Yes | Complete | Yes | Yes (+ FV foreign-org fix) | PASS |
| Onboarding | Yes | Complete | Prior + routes | Yes | PASS |
| Home (DOC) | Yes | Complete | Yes | Yes | PASS |
| Leads | Yes | Complete | Yes (read) | Yes | PASS |
| Customers | Yes | Complete | Yes (read) | Yes | PASS |
| Tasks | Yes | Complete | Yes (read) | Yes | PASS |
| Programs | Yes | Complete | Yes | Yes | PASS |
| Enrollments | Yes | Complete (+C4 metadata) | Yes | Yes | PASS |
| Progress | Yes | Complete | Yes (read) + fixtures | Yes | PASS |
| Attention / NBA | Yes | Complete (+C3) | Yes | Yes | PASS |
| Members / Invitations | Yes | Complete (+C2) | Yes (resting) | Yes | PASS |
| Settings | Supporting | Complete | Yes | Yes | PASS |
| Navigation / Mobile | Yes | Complete (+C5) | Yes | n/a | PASS |
| Social | **HORIZONTAL / PARALLEL** | Dogfood only | Safe OFF | Separate | Non-blocking |

## 4. Definition of Done

All Stage C criteria 1–29 satisfied. No open P0. No required P1 remaining after FV foreign-org fix.

## 5. Route inventory

Critical CS routes (authenticated): `/home`, `/leads` (+detail/create/edit/lifecycle), `/customers` (+…), `/tasks` (+…), `/programs` (+…), `/enrollments` (+…), `/progress` (+…), `/attention` (+detail), `/settings/members`, auth/onboarding entry.

Social `/social` (+operator) = NOT Beta-1 customer blocker.

No dead critical CS routes; no customer-visible CS placeholder pages found in FV crawl.

## 6. Owner master journey

Playwright Owner storageState (gitignored):

Home → Leads → Customers → Tasks → Programs → Enrollments → Enrollment detail (natural stale) → Progress → Attention → Home Attention → Attention detail + NBA → Members → Home

Org preserved; no auth loss; no 5xx; health collector clean. Deep-link/refresh/back covered separately.

## 7. Lead/customer flow

Production read-only lists/details load. Mutation durability/permissions covered by existing lead/customer security + feature suites (FV regression pack). No Production fabrication.

## 8. Task/work flow

Tasks list/detail load on Production. Home overdue/due-today composition verified (C1 + FV). Lifecycle durability via existing task suites/fixtures. No Production task mutation required.

## 9. Program flow

Programs list/detail operational on Production; linked enrollment navigation verified in journey. Permissions/isolation via existing program suites.

## 10. Enrollment flow

Natural stale enrollment `e405c5c8-…` shows Progress / Attention / Next action (B1-C4). List operational columns verified (C4 browser).

## 11. Progress flow

Progress list loads. Mutation → Attention re-eval contracts covered by B1-C3 evidence + progress/attention suites. No Production progress mutation in FV.

## 12. Attention/NBA flow

Live Production: Organization Attention shows `No recent enrollment progress` (High); detail exposes Next Best Action; C3 evaluate/dedup browser pack re-run PASS during FV pack. Lifecycle mutations covered by Attention suites/fixtures (no Production lifecycle mutation in FV).

## 13. Member/invitation state

Reused B1-C2 Production proof. Current durable state:

- pending invitations (control org): **0**
- accepted invitations present; temporary Viewer disposition A retained
- Members UI: restricted rollout; acceptance OFF + delivery OFF (truthful dual-gate copy)
- No new email sends; no new invitations

Viewer browser storageState not required: domain/security deny-matrix remains authoritative (same posture as B1-C2/C5).

## 14. Start-of-day experience

Home loads with Today shell; Organization Attention populated with Course Seller signals; assigned/overdue/due-today honest empty copy; loading skeleton AppShell-aligned (C5); org preserved.

## 15. Role matrix

| Operation | Owner | Admin | Staff | Viewer |
|---|---|---|---|---|
| Home read | ✓ | ✓ | ✓ | ✓ |
| CRM/Tasks/Programs/Enrollments/Progress read | ✓ | ✓ | ✓ (ops) | ✓ (read) |
| Privileged writes (domain-specific) | ✓ | ✓ (per contract) | limited | deny |
| Attention evaluate / privileged lifecycle | Owner/Admin | Owner/Admin | deny | deny |
| Members / invitations | Owner/Admin | Owner/Admin | deny | deny |

Server/domain authority proven by invitation/member/attention/CRM security suites. UI visibility is not treated as security proof.

## 16. Tenant isolation

Cross-tenant read/mutate denial covered by existing security suites. **FV defect found & fixed:** single-membership operators previously could silently receive their own brief while the URL carried a foreign `org` UUID. Selection now requires explicit organization selection on invalid org params (including single-org). Production re-verified: foreign org home shows **Organization selection required**, brief count for stale Attention = 0.

## 17. Deep-link/refresh/back

Critical routes: direct URL, hard refresh, back/forward — PASS (B1-FV desktop pack).

## 18. Data durability

Covered by prior phase evidence + fixture suites for Program/Enrollment/Progress/Task/Attention/Invitation. No UI-only success patterns introduced.

## 19. Lifecycle integrity

Existing domain lifecycle suites + prior phase evidence. No FV regressions observed.

## 20. Identity/session regression

B1-C2 verification/session recovery remains closed; no new verification email. Confirmed-user / resend trap not reopened.

## 21. Mobile

B1-FV mobile critical-route pack PASS (no document overflow). C1/C3/C4/C5 mobile packs also PASS in combined release run.

## 22. Tablet

B1-FV tablet pack PASS (Home/Enrollments/Attention/Members).

## 23. Accessibility

Landmarks, labelled Primary nav, headings, loading announcements retained. No material keyboard/a11y blocker found on Owner critical crawl.

## 24. State matrix

Critical modules: loading/empty/populated/error/forbidden/not-found patterns remain honest (errors ≠ empty). Foreign-org now denied rather than silent fallback.

## 25. Form matrix

Onboarding/CRM/tasks/programs/enrollments/progress/invitation forms covered by existing suites; no FV form blocker.

## 26. Performance

No RELEASE BLOCKER waterfalls/unbounded lists/request loops observed in Production crawl. Social nav CLS remains accepted P2 polish.

## 27. Console/network

Playwright health collectors: no unexplained pageerrors / critical 401/403/5xx on Owner packs.

## 28. Migration confidence

**MIGRATION STATE SAFE FOR BETA**

- Course Sellers foundation migrations present locally and on Production
- Known intentional Social local-filename vs remote multi-part timestamp divergence remains documented (P2/P4/P5 / B1-MA) and does not block CS runtime
- Stale Social migration-list expectations updated in FV (same class as C5) so CI inventory matches repo files
- No unapplied CS migration required for current code

## 29. Feature-gate resting state

| Gate | Resting state |
|---|---|
| Invitation acceptance | OFF (UI truthful) |
| Invitation email delivery | OFF (UI truthful) |
| Social publishing | OFF (`SOCIAL_PUBLISHING_ENABLED=false` not mutated) |
| Controlled publish windows open | **0** |

## 30. Production mutation / external-write statement

| Class | Count |
|---|---|
| New email provider writes | **0** |
| Instagram provider writes | **0** |
| Destructive Production CRM mutations | **0** |
| Attention evaluate (existing C3 browser pack re-run) | read/eval only; no new domain data fabricated |
| Controlled FV Production mutation authorization | not required beyond deploy of org-selection fix |

## 31. Automated regression

| Layer | Result |
|---|---|
| typecheck | PASS |
| lint | PASS |
| production build | PASS |
| Targeted vitest (invitations, daily-operating, attention, enrollments, progress, programs, tasks, leads, customers, security, social-universal, org-aware) | **67 files / 513 tests PASS** (after inventory/boundary test alignment) |
| FV org-selection unit | PASS |

Failure classification during FV:

| Failure | Class | Action |
|---|---|---|
| Stale Social migration inventory expects | TEST DEFECT / Social parallel | Fixed expectations |
| Blunt `SERVICE_ROLE` source scan vs server-only Social operator | TEST DEFECT (allowed server modules) | Narrowed allowlist |
| Silent single-org foreign `org` fallback | **HIGH Beta contract** | Product fix + deploy + retest |

## 32. Playwright release pack

| Pack | Result |
|---|---|
| B1-FV desktop (journey + deep-link + wrong-org) | **3/3 PASS** |
| B1-FV mobile | **1/1 PASS** |
| B1-FV tablet | **1/1 PASS** |
| Combined C1–C5 browser pack (earlier FV run) | **16/18** then FV specs fixed; final FV-only **5/5 PASS** |

Viewer browser: not required (security suites + B1-C2 disposition).

## 33. Product coherence review

| Question | Rating |
|---|---|
| Purpose understandable | PASS |
| Onboarding useful | PASS |
| Home answers what matters | PASS |
| Manage customers/work/programs/enrollments | PASS |
| Progress understandable | PASS |
| Attention useful | PASS |
| NBA useful | PASS |
| Team management | PASS (gates resting) |
| Critical states understandable | PASS |
| Mobile usable | PASS |
| Operational stuck points | PASS (none found) |

## 34. Manual DB intervention assessment

Normal Owner workflows do **not** require manual Production DB edits. Operator recovery tooling remains separate.

## 35. Support/recovery readiness

Auth/onboarding/membership/invitation/program/enrollment/Attention/gate diagnostics remain via structured UI errors, invitation events, Attention events, and operator Social tooling (parallel). No secrets exposed in customer UI.

## 36. Known Beta-1 limitations

| Limitation | Class |
|---|---|
| Social publishing OFF / parallel dogfood | P2 |
| Social nav client reveal CLS | P2 (accepted C5) |
| Home calm multi-section presentation | P2 (accepted C5) |
| No Attention scheduler (on-demand evaluate) | P2 (approved C3) |
| Temporary B1-C2 QA Viewer retained (disposition A) | P2 |
| Advanced analytics / AI / Stories / multi-provider Social | P3 |

## 37. Explicit non-scope

Not part of Course Sellers Beta 1:

- Stories / Reels / Social scheduling expansion
- Commercial Ad Architect
- AI Video Studio advanced generation
- Broad multi-provider Social
- R1-F real customer cohort expansion
- Top-10 vertical rollout
- Advanced analytics / billing / enterprise features

## 38. Release scorecard

| Area | Rating |
|---|---|
| Authentication | RELEASE READY |
| Organization | RELEASE READY |
| Onboarding | RELEASE READY |
| Home | RELEASE READY |
| Leads | BETA ACCEPTABLE |
| Customers | BETA ACCEPTABLE |
| Tasks | RELEASE READY |
| Programs | RELEASE READY |
| Enrollments | RELEASE READY |
| Progress | RELEASE READY |
| Attention | RELEASE READY |
| NBA | RELEASE READY |
| Members | RELEASE READY |
| Invitations | RELEASE READY |
| Settings | BETA ACCEPTABLE |
| Navigation | RELEASE READY |
| Desktop | RELEASE READY |
| Mobile | RELEASE READY |
| Accessibility | BETA ACCEPTABLE |
| Role security | RELEASE READY |
| Tenant isolation | RELEASE READY |
| Lifecycle | RELEASE READY |
| Data durability | RELEASE READY |
| Error handling | BETA ACCEPTABLE |
| Performance | BETA ACCEPTABLE |
| Supportability | BETA ACCEPTABLE |
| Production readiness | RELEASE READY |

No BLOCKED ratings.

## 39. P0/P1 closure

| Class | Open |
|---|---|
| P0 | **0** |
| Required P1 | **0** (foreign-org silent fallback fixed in FV) |

## 40. Social safety

- Publishing gate OFF
- Open controlled windows: **0**
- No Instagram writes during FV
- R1-F remains paused
- Social classified parallel/non-blocking for CS Beta 1

## 41. Production deployment

| Field | Value |
|---|---|
| Deployment | `dpl_89FSF8D5pKuJYuCuQnGvsw1PRscd` |
| Status | Ready |
| Alias | `https://www.zyntixai.com` |
| Contains | C1–C5 + FV org-selection fix |
| External write delta | 0 |

## 42. Git state

| Field | Value |
|---|---|
| FV implementation | `f559001` (org selection + migration/boundary test alignment + FV browser pack) |
| FV test harden | `5c08406` |
| Evidence SHA | *(this commit)* |
| Branch | `core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean |

## 43. Final release verdict

**COURSE SELLERS BETA 1 RELEASE READY WITH EVIDENCE**

Stop. Do not start Social Stories, enable publishing, reopen R1-F, start Commercial Ad Architect, begin top-10 verticalization, or start Beta 2 without separate Owner authorization.
