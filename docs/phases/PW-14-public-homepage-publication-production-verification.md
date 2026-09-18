# PW-14 — Public Homepage Publication Readiness, Production Deployment and Final Verification

| Field | Value |
| --- | --- |
| Document | PW-14 — Public Homepage Publication, Production Deployment and Final Verification |
| Type | Publication-admission and Production-release authority |
| Date | 2026-09-16 |
| Branch | `core/platform-readiness-20260707` |
| Source commit under review | `146c9ea19a9491a1b07389ac0281b8a13ed68541` |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Production hostname | `https://www.zyntixai.com` |
| Current status | `BLOCKED — PW-14 PUBLICATION ADMISSION FAILED` |
| Deployment | `DO NOT DEPLOY` |

```text
IMPLEMENTED ≠ PUBLICATION READY
LOCAL BROWSER PASS ≠ PRODUCTION PASS
AUTOMATED ACCESSIBILITY CHECK ≠ SCREEN-READER PASS
PRODUCTION DEPLOYED ≠ CLOSED WITH EVIDENCE
SKIPPED ≠ PASSED
PRE-EXISTING FAILURE ≠ PUBLICATION PASS
OWNER AUTHORITY ≠ PERMISSION TO BYPASS A FAILED GATE
```

---

## 1. Document Control

This file records PW-14 publication admission. It does not reopen PW-0 through PW-13. It does not modify product code. It does not deploy. It does not start a post-PW-14 feature trajectory.

Authenticated Home closures `49cd5773976143139a154f9b8ddf36535a4dd914` and `d110b6e3da5c690b31a68a0b145b7b6521c10828` remain protected.

---

## 2. Executive Decision

Commit `146c9ea19a9491a1b07389ac0281b8a13ed68541` is **not** admissible for public Production publication.

The primary release blocker is B1-GATE.1 Gate 4: the complete regression suite is not clean. Independent additional blockers would also fail the pre-deployment AND-gate even if the suite were later greened: authenticated Production routing evidence is unavailable; the planned NVDA+Chromium session is not executed; visitor-comprehension research required by `PW12-DEFER-020` is not executed.

No Production deployment was performed. Live Production still serves the pre-PW-13 logged-out `/` → `/login` bounce.

```text
BLOCKED — PW-14 PUBLICATION ADMISSION FAILED
DO NOT DEPLOY
RELEASE BLOCKER — FULL REGRESSION SUITE NOT CLEAN
```

---

## 3. Authority Chain

| Authority | Role |
| --- | --- |
| B1-GATE.1 | 100% required gates; Gate 4 full regression suite before publication closure |
| PW-0 | Charter, dual-use `/`, canonical-host U item, favicon/legal external |
| PW-1 | Public-truth ceiling |
| PW-6 | Frozen Route A2 copy |
| PW-7–PW-12 | Responsive, a11y, composition, visual, high-fidelity, freeze |
| PW-12 deferred register | Publication-blocker column |
| PW-13 / commit `146c9ea1` | Implemented source; R1 and FV evidence; not publication |
| This phase | Publication admission only |

---

## 4. Preflight

| Check | Result |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `146c9ea19a9491a1b07389ac0281b8a13ed68541` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Ahead / behind after `git fetch origin` | `0 0` |
| Starting worktree | completely clean |
| PW-13 nine-file commit | confirmed |
| Later product commit | none |
| Existing PW-14 file at start | none |
| Merge / rebase / cherry-pick / bisect | none |
| Instructions | no `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules` |

---

## 5. Current Production Baseline

Read-only inspection at **2026-09-16T14:45:51Z**. No authenticated cookies were sent. Response bodies were not copied into this file.

| URL | Result |
| --- | --- |
| `https://www.zyntixai.com/` | 307 `Location: /login`; `Cache-Control: private, no-cache, no-store`; `Server: Vercel`; `X-Matched-Path: /` |
| `https://zyntixai.com/` | 308 `Location: https://www.zyntixai.com/`; `Server: Vercel`; not expressed in repo `vercel.json` |
| `https://www.zyntixai.com/login` | 200 |
| `https://www.zyntixai.com/home` | 307 `Location: /login?next=%2Fhome` |

Current homepage identity: **old login-entry bounce**, not the public homepage. Commit `146c9ea1` is **not** live. Apex-to-www remains externally owned (`PW0-PB-034`). Automatic publication of the PW-13 commit was not observed.

---

## 6. Deployment Ownership and Workflow

| Check | Result |
| --- | --- |
| `vercel.json` | cron-empty only; no host redirects |
| Vercel CLI on PATH | present |
| Local `.vercel` project link | present (IDs not printed) |
| GitHub Actions in this worktree | not present |
| `package.json` deploy script | none |
| Auth storage `playwright/.auth/production-owner.json` | absent |

Existing Production host is Vercel (`Server: Vercel`). This phase did not inspect or print project identifiers, tokens, or environment values. No deploy, relink, `--force`, or environment change was performed.

---

## 7. Publication-Admission Matrix

| Item | Classification | Authority | Status |
| --- | --- | --- | --- |
| Exact HEAD `146c9ea1` on authorized branch | REQUIRED BEFORE DEPLOYMENT | PW-14 preflight | PASS |
| Clean starting worktree / no upstream drift | REQUIRED BEFORE DEPLOYMENT | PW-14 preflight | PASS |
| Full regression suite clean | REQUIRED BEFORE DEPLOYMENT | B1-GATE.1 Gate 4 | FAIL |
| Focused public / routing / Home tests | REQUIRED BEFORE DEPLOYMENT | PW-13 / PW-14 | NOT EXECUTED IN PW-14 (stopped at Gate 4) |
| Lint / typecheck / build | REQUIRED BEFORE DEPLOYMENT | B1-GATE.1 Gate 5 | NOT EXECUTED IN PW-14 (stopped at Gate 4) |
| Authenticated Production `/` resolver evidence | REQUIRED BEFORE DEPLOYMENT | PW-14 §7; `PW12-RSK-014`; `PW12-DEFER-018` | FAIL — storage absent |
| Local production browser matrix | REQUIRED BEFORE DEPLOYMENT | PW-12 DEFER-002–009, 011–014, 021; PW-14 §8 | NOT EXECUTED IN PW-14 (stopped at Gate 4) |
| NVDA+Chromium session | REQUIRED BEFORE DEPLOYMENT | `PW12-DEFER-010`; `PW8-OD-015` | FAIL — not executed; environment-unavailable not formally recorded |
| Instrumented contrast numbers | REQUIRED BEFORE DEPLOYMENT | `PW12-DEFER-015` | FAIL — not executed in this phase |
| Target-size numbers | REQUIRED BEFORE DEPLOYMENT | `PW12-DEFER-016` | FAIL — not executed in this phase |
| Visitor comprehension research | REQUIRED BEFORE DEPLOYMENT | `PW12-DEFER-020` | FAIL — not executed |
| Access-panel meaning research | REQUIRED BEFORE DEPLOYMENT | `PW12-DEFER-022` | FAIL — not executed |
| Production public smoke after deploy | REQUIRED AFTER DEPLOYMENT | PW-14 §16 | NOT APPLICABLE — no deploy |
| Production authenticated verification | REQUIRED AFTER DEPLOYMENT | PW-14 §17 | NOT APPLICABLE — no deploy |
| Legal / privacy footer | EXTERNALLY GATED — NON-BLOCKING FOR THIS RELEASE | `PW12-FREEZE-027`; `PW0` legal omit | Omitted with authority; not invented |
| Favicon / apple-touch-icon | EXTERNALLY GATED — NON-BLOCKING FOR THIS RELEASE if not invented | `PW0-PB-033`; `PW12-ISO-006` | Shared-chrome; not implemented in PW-13/14 |
| Canonical-host configuration | EXTERNALLY GATED — NON-BLOCKING FOR THIS RELEASE | `PW0-PB-034` | Live 308 observed; ownership remains external |
| Public metadata / robots / sitemap / OG | DEFERRED — NON-BLOCKING WITH AUTHORITY | PW-6 metadata candidate-only; `PW12-ISO-005` | Not implemented |
| Analytics / consent / waitlist / signup | PROHIBITED | PW-1; PW-6; PW-13 | Not added |
| Authenticated Home / AppShell / login restyle | PROHIBITED | Home closures; PW-0 | Not opened |
| Screen-reader PASS / WCAG conformance claim | PROHIBITED without execution | PW-8; PW-12 | Not claimed |
| Baseline-proven unrelated suite failures as PASS | PROHIBITED | B1-GATE.1 Gate 4; PW-14 §5 | Not relabelled PASS |

---

## 8. Full-Suite Result

Command: `npm run test:run`

| Field | Value |
| --- | --- |
| Exit code | 1 |
| Files | 2 failed / 534 passed (536) |
| Tests | 2 failed / 4211 passed / 0 skipped (4213) |
| Duration | 54.59s |
| Target | local worktree at `146c9ea1` |

Failing tests (unchanged names and assertions versus PW-13-FV baseline):

1. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` — `Progress no longer claims deferred tracking; Progress workspace language is present` — expected `"Progress for this enrollment is recorded and reviewed in the Progress workspace."` at line 74.
2. `tests/features/invitations/load-member-administration-page.test.ts` — `does not trust a foreign org id outside active memberships` — `resolveOrgContextMock` spy call count 0 at line 225.

These files are outside the PW-13 nine-file commit. PW-13-FV proved the same failures at `b49b6ac9`. Baseline proof was sufficient for implementation closure and is **not** sufficient for publication closure.

Governing rule: B1-GATE.1 Gate 4 — full regression suite before publication closure. No governing authority allows publication with these exact failures. The tests were not changed, skipped, deleted, weakened, quarantined, or repaired.

```text
RELEASE BLOCKER — FULL REGRESSION SUITE NOT CLEAN
```

---

## 9. Local Release Verification

Not executed in PW-14. Section 6 of the phase contract runs only if the full-suite gate passes.

---

## 10. Authenticated Routing Verification

`playwright/.auth/production-owner.json` is absent. No Production account was created. No session was invented. `npm run test:browser:b1-c1` was not used as a pass.

Because PW-13 changed `/` into dual-use public/authenticated entry, source/integration tests are not sufficient for publication. Default from the phase contract:

```text
BLOCKED — AUTHENTICATED PRODUCTION ROUTING EVIDENCE UNAVAILABLE
```

This is an independent admission failure. It was not used to bypass Gate 4; Gate 4 already failed first.

---

## 11. Responsive Browser Verification

Not re-executed in PW-14. Local Chromium matrix exists only as historical PW-13-R1/FV source-worktree evidence. That is not Production evidence.

---

## 12. Accessibility Evidence and Limitations

| Class | Result |
| --- | --- |
| Automated axe | not run; axe is not an authorized added dependency |
| Manual keyboard (this phase) | not executed |
| Screen reader | not executed; NVDA+Chromium session not recorded |
| WCAG conformance | not claimed |
| `PW12-DEFER-010` | publication blocker remains open |

---

## 13. Security, Privacy and Cache Verification

Local logged-out Production baseline: `/` 307 to `/login` with `private, no-store`. `/home` remains protected. No PW-14 product change. No cookies, tokens, or environment values are recorded here.

Post-deployment Production security checks were not applicable because no deployment occurred.

---

## 14. Performance Evidence

Not measured in PW-14. Historical PW-13 build reported `ƒ /` 1.07 kB page / 104 kB first load. That is source-build evidence, not a live Production measurement. Lighthouse was not run.

---

## 15. Metadata, Indexation, Legal and Canonical Status

| Item | Status |
| --- | --- |
| Public title / description / OG / robots / sitemap | not implemented; PW-6 candidate-only; `PW12-ISO-005` |
| Favicon | not implemented; shared-chrome `PW0-PB-033` |
| Legal / privacy footer | omitted; `PW12-FREEZE-027` |
| Apex → www 308 | live; Vercel-owned; not in repo config; `PW0-PB-034` |
| Root `lang` | remains English layout; public Dutch wrapper is source-only until deploy |

No metadata, robots, sitemap, favicon, legal page, or canonical-host configuration was added in this phase.

---

## 16. Preview Evidence

No preview deployment was created. Admission failed before preview or Production promotion.

---

## 17. Production Deployment Evidence

No deployment command was run. No deployment ID exists. Live hostname remains `https://www.zyntixai.com` on the pre-PW-13 login-entry behaviour.

---

## 18. Production Public Verification

Not applicable. Current live logged-out `/` is still 307 `/login`.

---

## 19. Production Authenticated Verification

Not applicable. No authorized Production session was available or used.

---

## 20. Authenticated Home Regression

No Production Home restyle was performed. Product code of authenticated Home was not modified in PW-13 or PW-14. Live `/home` still redirects logged-out visitors to `/login?next=/home`.

---

## 21. Deferred and Externally Gated Items

| ID | Owner | Publication consequence |
| --- | --- | --- |
| Full-suite platform test hygiene | Platform test owner | Blocks publication until suite is clean or a new owner-approved exception exists |
| Authenticated Production browser bootstrap | Owner bootstrap | Blocks publication while storage is absent |
| `PW12-DEFER-010` NVDA+Chromium | Accessibility preview | Blocks publication until executed or formally environment-unavailable |
| `PW12-DEFER-015` / `016` measured contrast and targets | PW-14 / a11y measurement | Blocks publication until numbered evidence exists |
| `PW12-DEFER-020` / `022` visitor/access research | Research | Blocks publication until executed |
| Legal footer / favicon / canonical ownership | External / platform | Do not invent; host 308 remains external |

---

## 22. Risks and Residual Limitations

| Risk | Status |
| --- | --- |
| Publishing with a red full suite | Blocked |
| Authenticated user trapped on marketing (`PW12-RSK-014`) | Unproven in Production; blocks deploy |
| Treating PW-13 local browser as Production | Rejected |
| Inventing legal/canonical/favicon | Not done |
| Auto-deploy of `146c9ea1` | Not observed at baseline time |

---

## 23. Traceability

| Area | Mapping |
| --- | --- |
| Publication suite | B1-GATE.1 Gate 4 |
| Dual-use `/` | PW-13 Model A; `PW12-DEFER-018` |
| Authenticated trap | `PW12-RSK-014`; PW-14 §7 |
| Screen reader | `PW12-DEFER-010`; `PW8-OD-015` |
| Visitor research | `PW12-DEFER-020` |
| Canonical host | `PW0-PB-034` |
| Legal/favicon | `PW12-FREEZE-027`; `PW0-PB-033` |
| Source commit | `146c9ea19a9491a1b07389ac0281b8a13ed68541` |

Missing IDs: 0. HOLD/PROHIBIT not used as positive ship authority.

---

## 24. Acceptance Gate

AND logic. Failed conditions:

- full regression suite not clean;
- authenticated Production routing evidence unavailable;
- NVDA+Chromium not executed;
- visitor-comprehension research not executed;
- measured contrast and target-size numbers not collected in this phase.

Deployment, evidence commit, and push of a closure document are not authorized.

---

## 25. Final Status

```text
BLOCKED — PW-14 PUBLICATION ADMISSION FAILED
DO NOT DEPLOY
RELEASE BLOCKER — FULL REGRESSION SUITE NOT CLEAN
```

This document is admission evidence only. It is not staged, committed, or pushed. It does not claim Production verification, accessibility PASS, WCAG conformance, user validation, or publication readiness.

Required separate correction authority: platform test hygiene for the two failing suites, plus a later PW-14 retry that still must satisfy authenticated Production routing and remaining publication-blocking PW-12 deferred validations.

---

## 26. Evidence Appendix

```text
git fetch origin
git rev-parse HEAD
git rev-parse origin/core/platform-readiness-20260707
npm run test:run
curl.exe --max-redirs 0 https://www.zyntixai.com/
curl.exe --max-redirs 0 https://zyntixai.com/
curl.exe --max-redirs 0 https://www.zyntixai.com/login
curl.exe --max-redirs 0 https://www.zyntixai.com/home
```

No secrets, cookies, tokens, session files, or Vercel project identifiers are included.

End of PW-14 publication-admission evidence.

---

# PW-14-C1 — Full Regression Suite Release-Blocker Remediation Evidence

The preceding sections remain historical PW-14 admission truth. They are not rewritten. C1 remediates only the two full-suite failures. C1 does not deploy, does not reopen remaining publication blockers, and does not make the public homepage publication-ready.

```text
PW-14-C1 CLOSED ≠ PW-14 PUBLICATION READY
PW-14-C1 CLOSED ≠ DEPLOYMENT AUTHORITY
TEST PASS ≠ CORRECT PRODUCT BEHAVIOUR
STALE ASSERTION ≠ PERMISSION TO DELETE COVERAGE
```

## C1.1 Document control

| Field | Value |
| --- | --- |
| Phase | PW-14-C1 — Full Regression Suite Release-Blocker Remediation |
| Date | 2026-09-16 |
| Starting HEAD | `146c9ea19a9491a1b07389ac0281b8a13ed68541` |
| Branch | `core/platform-readiness-20260707` |
| Ahead / behind | `0 0` |
| Initial untracked file | `docs/phases/PW-14-public-homepage-publication-production-verification.md` |
| Deployment | none |
| Staging / commit / push | none |

## C1.2 Authorization and boundaries

Authorized: the two failing tests, production source they govern if proven wrong, narrowly related fixtures, and this evidence file.

Unchanged and not opened: public homepage, Route A2 copy, `src/app/page.tsx`, authenticated Home, AppShell, `/login`, middleware, dependencies, lockfiles, deployment configuration.

No test was deleted, skipped, quarantined, retried, or reduced to a mere source-presence check without current behavioural meaning.

## C1.3 Reproduction evidence

Recorded before any C1 edit.

| Command | Exit | Files | Tests |
| --- | ---: | --- | --- |
| `npm run test:run -- tests/ui/programs-enrollments-stale-copy-remediation.test.ts` | 1 | 1 failed | 1 failed / 7 passed (8); 0 skipped |
| `npm run test:run -- tests/features/invitations/load-member-administration-page.test.ts` | 1 | 1 failed | 1 failed / 11 passed (12); 0 skipped |
| both files together | 1 | 2 failed | 2 failed / 18 passed (20); 0 skipped |

Together versus isolated: same two failures; no isolation-only defect.

Failure 1 name: `Progress no longer claims deferred tracking; Progress workspace language is present`. Assertion: `enrollmentDetail` must contain `Progress for this enrollment is recorded and reviewed in the Progress workspace.` Location: line 74. Received: enrollment-detail source without that sentence.

Failure 2 name: `does not trust a foreign org id outside active memberships`. Assertion: `resolveOrgContextMock` called with `{ supabase, organizationId: ORG_ID }`. Received: spy call count 0.

## C1.4 Root cause — failure 1

| Field | Value |
| --- | --- |
| ID | PW14-C1-F1 |
| Test | `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` |
| Governed behaviour | B1.5.8 stale-copy lock: Progress is not “later-phase”; Progress remains a live workspace |
| Class | STALE TEST EXPECTATION / TEST TARGET DRIFT |
| Production or test | Test expectation is stale. Production enrollment detail is the later B1-C4 surface. |
| Source | `src/features/enrollments/ui/enrollment-detail.tsx` shows operational Progress (`id="enrollment-progress-title"`, last meaningful progress, gated `progressLinks` / View progress). Deferred phrases are absent. |
| History | B1.5.8 kept Progress deferred. B1.6.4 (`e1789b1`) replaced deferral with the Progress-workspace sentence and View/Record links. B1-C4 (`8b65b83`) replaced that sentence with operational Progress metadata. `tests/ui/enrollment-detail-presentation.test.tsx` already asserts the current surface. Program detail still carries the B1.6.4 sentence. |
| Correction | Update the source lock to the current required meaning. Do not restore unreachable copy. Do not drop the no-deferral lock or Progress-workspace entry. |

## C1.5 Root cause — failure 2

| Field | Value |
| --- | --- |
| ID | PW14-C1-F2 |
| Test | `tests/features/invitations/load-member-administration-page.test.ts` |
| Governed behaviour | Foreign `?org=` must not yield foreign data and must not silently substitute another organization |
| Class | STALE IMPLEMENTATION-DETAIL ASSERTION |
| Production or test | Production fail-closed path is correct. The spy/success assertion is the old silent-fallback contract. |
| Source | `resolveSelectedOrganization` (`f559001`) returns `requiresSelection: true`, `organizationId: null` for a single membership plus a foreign org id. `loadMemberAdministrationPage` then returns `organization_required` before `resolveOrganizationContext`. |
| History | Pre-`f559001` single-org ignored a foreign query and served the only membership. `tests/ui/task-organization-selection.test.ts` and PW0-INV-008 require no silent substitution. Member UI already renders the organization-required panel. |
| Correction | Assert `organization_required`, membership-only options, no resolver call, and no privileged member/invitation load. Do not add a fake `resolveOrganizationContext` call. |

## C1.6 Corrections performed

Test-only. No production source changed.

Failure 1: enrollment assertions now lock Progress heading, last meaningful progress, `viewProgressHref`, `View progress`, and conditional `progressLinks`. Deferred-language absence remains. Program-detail Progress-workspace sentence remains.

Failure 2: foreign-org case now expects `organization_required`, options containing only the membership org, `resolveOrgContextMock` not called, and member/invitation loaders not called.

## C1.7 Changed files

| File | Justification |
| --- | --- |
| `tests/ui/programs-enrollments-stale-copy-remediation.test.ts` | PW14-C1-F1 |
| `tests/features/invitations/load-member-administration-page.test.ts` | PW14-C1-F2 |
| `docs/phases/PW-14-public-homepage-publication-production-verification.md` | this C1 appendix; remains untracked |

## C1.8 Targeted-test results

| Command | Exit | Result |
| --- | ---: | --- |
| copy test alone | 0 | 8 passed / 0 skipped |
| member-admin test alone | 0 | 12 passed / 0 skipped |
| both together | 0 | 2 files, 20 passed / 0 skipped |

## C1.9 Related regression results

| Batch | Exit | Result |
| --- | ---: | --- |
| Programs / Enrollments / Progress presentation and loaders (9 files) | 0 | 81 passed / 0 skipped |
| Member administration, members loaders, org-selection (8 files) | 0 | 63 passed / 0 skipped |

## C1.10 Public homepage and Home protection

| Batch | Exit | Result |
| --- | ---: | --- |
| Public homepage, root/middleware/landing, AppShell, Home loaders (11 files) | 0 | 165 passed / 0 skipped |

`git diff --name-only HEAD` after correction lists only the two test files. Public-web, `src/app/page.tsx`, authenticated Home, AppShell, `/login`, middleware, `package.json`, and lockfile are unchanged versus `146c9ea1`.

## C1.11 Lint, typecheck, build

| Command | Exit | Result |
| --- | ---: | --- |
| `npm run lint` | 0 | No ESLint warnings or errors |
| `npm run typecheck` | 0 | `tsc --noEmit` clean |
| `npm run build` | 0 | compiled; `ƒ /` 1.07 kB / 104 kB first load |
| `git diff --check` | 0 | clean |

Build warning is the pre-existing autoprefixer `flex-end` note on operator social CSS. Not introduced by C1.

## C1.12 Complete-suite result

`npm run test:run`

| Field | Value |
| --- | --- |
| Exit | 0 |
| Files | 536 passed (536) |
| Tests | 4213 passed (4213) |
| Failed | 0 |
| Skipped | 0 |
| Duration | 59.92s |
| Former failure 1 | passed (8 tests in file) |
| Former failure 2 | passed (12 tests in file) |

Skipped is not passed. This run had zero skipped tests.

## C1.13 Diff and scope audit

Two test hunks only, each mapped to one root cause. No public-web, Home, AppShell, login, middleware, dependency, lockfile, snapshot, skip, retry, or generated artifact change. No secrets. Coverage preserved and strengthened: no-deferral plus operational Progress/workspace entry; foreign org fail-closed plus no privileged reads.

## C1.14 Protected-boundary confirmation

Authenticated Home remains closed at `49cd5773976143139a154f9b8ddf36535a4dd914` / `d110b6e3da5c690b31a68a0b145b7b6521c10828`. AppShell and `/login` were not restyled. Frozen Route A2 copy is unchanged. No deployment occurred.

## C1.15 Remaining PW-14 blockers

These remain open after C1:

- authenticated Production routing evidence;
- authorized Production browser session/storage;
- NVDA + Chromium (`PW12-DEFER-010`);
- visitor/access-meaning validation (`PW12-DEFER-020`, `PW12-DEFER-022`);
- measured contrast and target-size (`PW12-DEFER-015`, `PW12-DEFER-016`);
- Production deployment and live verification;
- metadata, legal, favicon, and canonical-host items remain gated or external.

Parent PW-14 status remains:

```text
BLOCKED — PW-14 PUBLICATION ADMISSION FAILED
DO NOT DEPLOY
```

The previous `RELEASE BLOCKER — FULL REGRESSION SUITE NOT CLEAN` is remediated by C1. It is not a remaining publication blocker.

## C1.16 C1 gate result

```text
PASS — PW-14-C1 FULL REGRESSION RELEASE BLOCKERS REMEDIATED WITH EVIDENCE
PW-14 REMAINS BLOCKED — AUTHENTICATED PRODUCTION, ACCESSIBILITY AND VISITOR-VALIDATION EVIDENCE OUTSTANDING
PW-14-C1 READY FOR INDEPENDENT REVIEW
```

## C1.17 Next authorized phase

Independent review of PW-14-C1. After that, a separately authorized PW-14 retry may continue remaining publication gates. This phase does not authorize deploy, commit, or push.

End of PW-14-C1 evidence.

---

# PW-14-C1-R1 — Independent Regression-Blocker Remediation Review Evidence

The blocked PW-14 admission and the C1 appendix remain historical truth. This section is an independent review. C1 PASS statements were treated as hypotheses. R1 did not deploy, did not reopen publication admission, and did not change either corrected test.

```text
GREEN TEST ≠ CORRECT TEST
ABSENCE ASSERTION ≠ POSITIVE BEHAVIOURAL COVERAGE
MOCK NOT CALLED ≠ PROOF OF FAIL-CLOSED SECURITY
SOURCE STRING PRESENT ≠ USER-VISIBLE BEHAVIOUR
PW-14-C1-R1 PASS ≠ PW-14 PUBLICATION READY
PW-14-C1-R1 PASS ≠ DEPLOYMENT AUTHORITY
```

## R1.1 Preflight

| Check | Result |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD / upstream after fetch | `146c9ea19a9491a1b07389ac0281b8a13ed68541` |
| Ahead / behind | `0 0` |
| Unstaged tracked | the two C1 test files |
| Untracked | this PW-14 document |
| Staged | none |
| Product source | unchanged versus HEAD |
| Merge / rebase / cherry-pick / revert / bisect | none |
| Instructions | no `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules` |
| Original blocked admission present | yes, through “End of PW-14 publication-admission evidence.” |
| C1 appendix present | yes, through “End of PW-14-C1 evidence.” |
| Deployment | none |

## R1.2 Independence statement

R1 re-read HEAD originals, the complete current tests, production loaders and enrollment/program detail sources, `resolveSelectedOrganization`, PW0-INV-008, B1.5.8 / B1.6.4 / B1-C4 evidence, and commits `e1789b1`, `8b65b83`, and `f559001`. Related presentation tests were used as independent rendered-behaviour evidence, not as a substitute for the source lock.

## R1.3 Reviewed authorities

B1-GATE.1; PW-0 including PW0-INV-008; B1.5.8 stale-copy contract; B1.6.4 PE↔Progress integration; B1-C4 operational enrollment metadata (`8b65b83`); org-selection fail-closed commit `f559001`; `tests/ui/task-organization-selection.test.ts`; `tests/ui/enrollment-detail-presentation.test.tsx`; Home closures `49cd5773` / `d110b6e3`; PW-13 commit `146c9ea1`.

## R1.4 Original regression intent

Failure 1 originally prevented Progress from remaining “later-phase” copy and required Progress-workspace language on the B1.5.8/B1.6.4 source surfaces.

Failure 2 originally prevented a client-supplied foreign `?org=` from being trusted as organization context for member administration. The HEAD assertion encoded the later-superseded silent single-org fallback.

Both intents remain required.

## R1.5 Independent failure 1 assessment

Classification of the C1 correction: **CORRECT AND STRONGER**.

R1 agrees with C1: **STALE TEST EXPECTATION / TEST TARGET DRIFT**.

The file is a source lock over `enrollment-create-form.tsx`, `enrollment-detail.tsx`, `program-create-form.tsx`, and `program-detail.tsx`. Those remain the authoritative surfaces. Enrollment detail at HEAD contains operational Progress (`id="enrollment-progress-title"`, last meaningful progress, gated View progress). It does not contain the B1.6.4 sentence or deferred-phase language. Program detail still contains `Progress for enrollments in this program is recorded and reviewed in the Progress workspace.`

B1.6.4 (`e1789b1`) introduced the enrollment Progress-workspace sentence. B1-C4 (`8b65b83`) replaced it with operational Progress. Restoring the sentence would be unauthorized copy invention.

Positive coverage is not only absence: heading, last-progress label, and the `View progress` JSX remain. Rendered behaviour is independently locked by `enrollment-detail-presentation.test.tsx`. R1 did not treat source presence as WCAG or screen-reader proof.

## R1.6 Independent failure 2 assessment

Classification of the C1 correction: **CORRECT AND STRONGER**.

R1 agrees with C1: **STALE IMPLEMENTATION-DETAIL ASSERTION**.

`OTHER_ORG` is a UUID outside the fixture membership. `resolveSelectedOrganization` returns `requiresSelection: true` / `organizationId: null` for a single membership plus a mismatched org query (`f559001`). The loader then returns `organization_required` with membership-built options before `resolveOrganizationContext`. PW0-INV-008 requires no foreign data and no silent substitution.

The C1 test asserts the returned kind, membership-only options, no foreign option, no resolver call, and no privileged member/invitation loads. Adjacent Owner success still loads members/invitations for `ORG_ID`. Adjacent multi-org missing-org still returns `organization_required` without resolver; valid selection still calls `resolveOrganizationContext` with `ORG_ID`. A disconnected mock cannot produce `organization_required` with the membership option list unless the real selection branch ran.

## R1.7 Assertion-quality review

Changed assertions can fail for the regressions they name. Result-kind and option assertions are exact, not any-non-empty. Negative loader assertions are paired with positive adjacent success paths. No skip, only, todo, retry, or quarantine was added. Test names still match the required behaviour.

Residual: `viewProgressHref` and `/progressLinks\s*\?/` also match TypeScript type text in the same file. They are not the sole positive coverage. See PW14-C1-R1-FND-001.

## R1.8 Positive and negative tenant-boundary evidence

Negative: foreign `?org=` → `organization_required`; options contain `ORG_ID` owner only; `OTHER_ORG` absent; resolver not called; member and invitation loaders not called.

Positive: valid `org=ORG_ID` Owner path still succeeds and calls member/invitation loaders with `ORG_ID`; multi-org explicit selection still calls `resolveOrganizationContext` with `ORG_ID`. If the resolver were never invoked on any authorized path, that multi-org assertion would fail.

## R1.9 Authority and history reconciliation

| Item | Independent evidence | Agreement |
| --- | --- | --- |
| Enrollment Progress sentence removed | `8b65b83` enrollment-detail diff; current HEAD source | agrees with C1 |
| Operational Progress required | B1-C4 subject; current JSX section | agrees |
| Program-detail workspace sentence retained | current `program-detail.tsx` | agrees |
| Silent single-org fallback denied | `f559001`; PW0-INV-008; selector unit test | agrees |
| Git history vs phase authority | no contradiction found | no blocker |

## R1.10 Corrections performed during R1

None. No P0 or P1 was found inside the two authorized tests. Production code was not changed.

## R1.11 Findings register

| ID | Severity | Subject | Evidence | Impact | Required action | Status | Verification | Owner / later gate |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW14-C1-R1-FND-001 | P2 | Assertion quality: two source-lock strings overlap type text | `viewProgressHref` and `progressLinks?` exist on `EnrollmentProgressLinks` / props as well as JSX | Those two asserts could pass if JSX links were removed but types remained; heading, last-progress, and `View progress` would still fail | Do not change in R1; optional later copy-lock tightening to JSX-only or rendered assertions | Open — non-blocking | Related presentation tests still lock rendered View progress | Programs/Enrollments copy-lock owner at next copy-lock revision |
| PW14-C1-R1-FND-002 | P2 | Source string ≠ user-visible behaviour | The stale-copy file remains a source lock by B1.5.8 design | Source lock cannot prove rendered HTML by itself | Keep; rendered coverage already exists | Open — non-blocking | `enrollment-detail-presentation.test.tsx` | Existing presentation-test owner; not a PW-14 publication gate |

Reviewed subjects with no remaining defect:

| Subject | Result |
| --- | --- |
| Copy-authority correctness | Confirmed |
| Source-target correctness | Confirmed |
| Obsolete-language absence | Confirmed on enrollment and program detail |
| Operational Progress positive coverage | Confirmed |
| Program/enrollment separation | Confirmed |
| Foreign-org branch validity | Confirmed |
| `organization_required` result | Confirmed |
| Allowed organization options | Confirmed |
| Privileged loader non-execution | Confirmed |
| Valid-org positive path | Confirmed |
| Tenant-boundary strength | Strengthened versus HEAD |
| Mock relevance | Confirmed; mock is the imported module and is exercised on authorized paths |
| Full-suite cleanliness | Confirmed |
| Protected-boundary integrity | Confirmed |

P0 remaining: 0. P1 remaining: 0. Remaining P2: 2, both assigned and non-blocking for C1 remediation.

## R1.12 Targeted-test results

| Command | Exit | Files | Tests | Failed | Skipped | Duration |
| --- | ---: | --- | --- | ---: | ---: | --- |
| copy-lock file | 0 | 1 passed | 8 passed | 0 | 0 | 523ms |
| member-admin file | 0 | 1 passed | 12 passed | 0 | 0 | 698ms |
| both together | 0 | 2 passed | 20 passed | 0 | 0 | 723ms |

## R1.13 Related-regression results

| Batch | Exit | Result |
| --- | ---: | --- |
| Programs / Enrollments / Progress (9 files) | 0 | 81 passed / 0 skipped |
| Member admin / invitations loaders / org selection (8 files) | 0 | 63 passed / 0 skipped |

## R1.14 Protected-boundary results

11-file public homepage, root/middleware/landing, AppShell, and Home batch: exit 0, 165 passed, 0 skipped.

Byte-for-byte versus HEAD: `src/app/page.tsx`, public-web copy/CSS/hash-focus/homepage, authenticated Home, AppShell, login, middleware, `package.json`, and lockfile are unchanged. `git diff --name-only HEAD` lists only the two test files.

## R1.15 Lint, typecheck, build

| Command | Exit | Result |
| --- | ---: | --- |
| `npm run lint` | 0 | No ESLint warnings or errors |
| `npm run typecheck` after build | 0 | `tsc --noEmit` clean |
| `npm run build` | 0 | compiled successfully |
| `git diff --check` | 0 | clean |

A concurrent typecheck started while `next build` was rewriting `.next/types` failed with TS6053 missing generated files. That is a harness race, not a product-type defect. Sequential typecheck after the build passed. R1 does not treat the raced failure as a remaining P1.

## R1.16 Full-suite result

`npm run test:run`

| Field | Value |
| --- | --- |
| Exit | 0 |
| Files | 536 passed (536) |
| Tests | 4213 passed (4213) |
| Failed | 0 |
| Skipped | 0 |
| Duration | 69.31s |
| Copy-lock in suite | passed (8) |
| Member-admin in suite | passed (12) |

Skipped is not passed. This run had zero skipped tests.

## R1.17 Changed-file reconciliation

R1 added only this appendix to the existing untracked PW-14 document. The two C1 tests are unchanged by R1. No production, public-web, Home, AppShell, login, middleware, dependency, lockfile, snapshot, or generated artifact change.

## R1.18 Residual P2 findings

PW14-C1-R1-FND-001 and PW14-C1-R1-FND-002 remain assigned as above. They do not undermine fail-closed tenant coverage or the current operational Progress contract.

## R1.19 R1 gate

```text
PASS — PW-14-C1-R1 INDEPENDENT REGRESSION REMEDIATION REVIEW CLOSED WITH EVIDENCE
PW-14-C1 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
PW-14 REMAINS BLOCKED — AUTHENTICATED PRODUCTION, ACCESSIBILITY AND VISITOR-VALIDATION EVIDENCE OUTSTANDING
```

Parent PW-14 status remains `BLOCKED — PW-14 PUBLICATION ADMISSION FAILED` / `DO NOT DEPLOY`. Remaining publication blockers are unchanged from C1.15.

## R1.20 Next authorized step

PW-14-C1 final verification and commit of the two tests plus this evidence document, under a separately authorized FV/commit phase. This R1 does not stage, commit, push, or deploy.

End of PW-14-C1-R1 evidence.

---

# PW-14-C1-FV — Full Regression Release-Blocker Remediation Final Verification Evidence

Earlier sections remain historical. This section closes only the C1 correction package. It does not close PW-14 and does not authorize deployment.

```text
PW-14-C1 CLOSED ≠ PW-14 CLOSED
TEST REMEDIATION COMMITTED ≠ PUBLICATION READY
PUSHED ≠ DEPLOYED
CLEAN FULL SUITE ≠ AUTHENTICATED PRODUCTION EVIDENCE
SKIPPED ≠ PASSED
```

## FV.1 Preflight

| Check | Result |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD before commit | `146c9ea19a9491a1b07389ac0281b8a13ed68541` |
| Upstream after `git fetch origin` | same SHA |
| Ahead / behind | `0 0` |
| Staged | none |
| Unstaged tracked | the two C1 tests |
| Untracked | this PW-14 document |
| Changed-file count | 3 |
| Product / lockfile / public-web | unchanged versus HEAD |
| Merge / rebase / cherry-pick / revert / bisect | none |
| Instructions | no `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules` |
| Original blocked admission | present |
| C1 PASS | present |
| C1-R1 PASS | present |
| Parent status | `BLOCKED — PW-14 PUBLICATION ADMISSION FAILED` / `DO NOT DEPLOY` |

Live Production at **2026-09-16T18:49:23Z**, no cookies: `https://www.zyntixai.com/` still 307 `Location: /login`. Apex still 308 to www. No post-block deployment of `146c9ea1` was observed.

## FV.2 Authority review

C1 changed two stale tests only. R1 independently agreed with both root-cause classes, found no product defect, and left P0=0, P1=0, P2=2 non-blocking. Full-suite cleanliness removes only the first publication-admission blocker. Authenticated Production, NVDA, visitor validation, and deployment evidence remain outstanding. C1 is not publication authorization.

## FV.3 Exact changed-file scope

1. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`
2. `tests/features/invitations/load-member-administration-page.test.ts`
3. `docs/phases/PW-14-public-homepage-publication-production-verification.md`

## FV.4 Final diff review

Copy-lock: removes the obsolete enrollment Progress-workspace sentence; keeps deferred-language prohibition; positively locks Progress heading, last meaningful progress, gated `progressLinks`, `View progress`, and `viewProgressHref`; keeps program-detail Progress-workspace copy separate. Strings are in production JSX/source, not comments or fixtures.

Member-admin: `OTHER_ORG` is outside memberships; expects `organization_required`; membership-only options; foreign org excluded; resolver and privileged loaders not called; result kind asserted. Owner success and multi-org selected-org paths still require authorized resolution and downstream loaders.

Neither test was weakened.

## FV.5 Source and authority cross-check

Enrollment detail at HEAD has operational Progress and no deferred-phase language. Program detail retains the Progress-workspace sentence. `resolveSelectedOrganization` (`f559001`) fail-closes single-org foreign queries. `loadMemberAdministrationPage` returns `organization_required` before `resolveOrganizationContext`. PW0-INV-008, B1.5.8, B1.6.4 (`e1789b1`), and B1-C4 (`8b65b83`) agree with the tests. No production correction is required.

## FV.6 Targeted-test results

| Command | Exit | Files | Tests | Failed | Skipped | Duration |
| --- | ---: | --- | --- | ---: | ---: | --- |
| copy-lock | 0 | 1 | 8 passed | 0 | 0 | 474ms |
| member-admin | 0 | 1 | 12 passed | 0 | 0 | 625ms |
| both together | 0 | 2 | 20 passed | 0 | 0 | 844ms |

## FV.7 Related-regression results

| Batch | Exit | Result |
| --- | ---: | --- |
| Programs / Enrollments / Progress (9 files) | 0 | 81 passed / 0 skipped |
| Member admin / org selection / invitation loaders (8 files) | 0 | 63 passed / 0 skipped |

Rejected path: `organization_required`, membership-only options, no privileged loaders. Authorized path: Owner success still loads members/invitations for the membership org; multi-org explicit selection still calls `resolveOrganizationContext`.

## FV.8 Public homepage and Home protection

11-file batch: exit 0, 165 passed, 0 skipped.

Byte-for-byte versus HEAD: `src/app/page.tsx`, public-web files, authenticated Home, AppShell, login, middleware, `package.json`, and lockfile unchanged. Public homepage remains the PW-13 source. Authenticated Home remains closed. No route or deployment-config change.

## FV.9 Lint, typecheck, build

Run sequentially.

| Command | Exit |
| --- | ---: |
| `npm run lint` | 0 |
| `npm run typecheck` | 0 |
| `npm run build` | 0 |

Pre-existing autoprefixer warning on operator social CSS is unchanged and outside C1 scope.

## FV.10 Complete-suite result

`npm run test:run`

| Field | Value |
| --- | --- |
| Exit | 0 |
| Files | 536 passed (536) |
| Tests | 4213 passed (4213) |
| Failed | 0 |
| Skipped | 0 |
| Duration | 53.37s |
| Copy-lock in suite | passed (8) |
| Member-admin in suite | passed (12) |

Skipped is not passed. This run had zero skipped tests.

## FV.11 R1 findings reconciliation

| ID | Severity | FV status |
| --- | --- | --- |
| PW14-C1-R1-FND-001 | P2 | Remains open, non-blocking; type-overlapping source strings; later copy-lock hygiene |
| PW14-C1-R1-FND-002 | P2 | Remains open, non-blocking; source lock is not rendered-browser proof; presentation tests own rendered coverage |

Neither finding undermines the correction. Neither is marked resolved. No new P0 or P1. P0 remaining 0. P1 remaining 0. P2 remaining 2.

## FV.12 Deployment-trigger safety check

Read-only. No project identifiers, tokens, or environment values are recorded here.

| Evidence | Result |
| --- | --- |
| Established Production workflow | Explicit CLI candidate (`--skip-domain`) then `vercel promote`, documented in B1.5-DEPLOY / B1.4; not git-push promotion |
| `vercel.json` | cron-empty only |
| GitHub Actions | none in this worktree |
| Package deploy script | none |
| Recent Vercel listing | newest Production age about 2 days; no listing matching the same-day PW-13 push of `146c9ea1` |
| Live Production | still 307 `/login` while origin already holds PW-13 product `146c9ea1` |

Conclusion: a normal push of this documentation-and-test commit to `origin/core/platform-readiness-20260707` is not an unauthorized Production deployment. If a Preview were created, it must not be promoted. This check is not publication authority.

## FV.13 File-integrity verification

Three authorized files only. No trailing whitespace. One terminating newline. No extra EOF blank line. Markdown fences balanced. No conflict markers. No deferred-work labels or unresolved-edit markers. No secrets. No generated artifacts. No snapshot regeneration. No lockfile change. `git diff --check` passes.

## FV.14 Final AND-gate

All required FV conditions passed together: baseline and branch; no upstream drift; three-file scope; C1 and R1 PASS; coverage preserved or strengthened; positive and negative org paths; targeted, related, and protection suites; lint; typecheck; build; complete suite 536/4213/0/0; P0=0; P1=0; P2=2 assigned; no product or public-web change; Home closed; integrity; deployment-trigger known; no deployment; PW-14 remains blocked.

## FV.15 Staging plan

Stage exactly the three authorized files. Confirm staged count 3, no unstaged tracked, no other untracked, cached diff-check clean.

## FV.16 Commit plan

One commit, no amend, exact subject:

`test(platform): clear PW-14 regression blockers`

Parent expected: `146c9ea19a9491a1b07389ac0281b8a13ed68541`.

## FV.17 Continuing PW-14 blockers

- authenticated Production routing evidence and authorized session storage;
- NVDA + Chromium (`PW12-DEFER-010`);
- visitor / access-meaning validation (`PW12-DEFER-020`, `PW12-DEFER-022`);
- measured contrast and target size (`PW12-DEFER-015`, `PW12-DEFER-016`);
- Production deployment and live verification;
- metadata, legal, favicon, and canonical-host items remain gated or external.

```text
BLOCKED — PW-14 PUBLICATION ADMISSION FAILED
DO NOT DEPLOY
```

This commit does not authorize preview or Production deployment. PW-14 is not publication-ready. Authenticated Production, NVDA, and visitor validation remain outstanding.

## FV.18 Explicit no-deploy statement

No preview or Production deployment was performed in PW-14, C1, R1, or FV. Push of this package is not a Production promotion.

End of PW-14-C1-FV evidence.

---

# PW-14-C2-C1 — Preview Environment Alignment and Middleware Recovery Evidence

| Field | Value |
| --- | --- |
| Document section | PW-14-C2-C1 |
| Type | Preview environment-name alignment and middleware recovery |
| Date | 2026-09-17 |
| Branch | `core/platform-readiness-20260707` |
| Source commit | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Vercel team | `guus-projects-ai` |
| Vercel project | `zyntixai` |
| GitHub organization (not a Vercel team) | `moneymotion-collab` |
| C1 gate result | `PASS — PW-14-C2-C1 PREVIEW ENVIRONMENT ALIGNMENT AND MIDDLEWARE RECOVERY CLOSED WITH EVIDENCE` |
| Parent PW-14 status | `PW-14 REMAINS BLOCKED` |
| Production | unchanged; not promoted |

```text
PREVIEW CONFIGURATION ≠ PRODUCTION CONFIGURATION
PUBLISHABLE KEY ≠ PERMISSION TO PRINT THE VALUE
VARIABLE NAME PRESENT ≠ VALUE CORRECT
PREVIEW RECOVERED ≠ AUTHENTICATED ROUTING VERIFIED
PREVIEW PASS ≠ PRODUCTION PASS
REDEPLOYED PREVIEW ≠ PROMOTED DEPLOYMENT
PW-14-C2-C1 PASS ≠ PW-14-C2 CLOSED
PW-14-C2-C1 PASS ≠ PW-14 CLOSED
```

This section does not reopen PW-0 through PW-13. It does not modify product code. It does not authorize Production deployment. It does not close PW-14-C2 authenticated routing. It does not close PW-14.

## C2-C1.1 Preflight

| Check | Result |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD before correction | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Upstream after `git fetch origin` | same SHA |
| Ahead / behind | `0 0` |
| Worktree | completely clean |
| Merge / rebase / cherry-pick / bisect | none |
| Vercel CLI | `56.3.1` |
| Linked project | `zyntixai` |
| Accessible Vercel team | `guus-projects-ai` only |
| Scope `moneymotion-collab` | not used; not a Vercel team |
| In-progress deployments | none |
| Production `www /` before correction | 307 `Location: /login` (`2026-09-16T21:33:22+02:00` diagnostic baseline; reconfirmed `2026-09-17T14:03:04+02:00`) |
| Broken Preview | `https://zyntixai-9lib0ua4j-guus-projects-ai.vercel.app` Ready, `target=preview` |

## C2-C1.2 Vercel identity correction

`moneymotion-collab` is the GitHub organization. The Vercel CLI team for this project is `guus-projects-ai`. No command in this correction used `--scope moneymotion-collab`.

## C2-C1.3 Established root cause

Prior diagnostic classified:

```text
VARIABLE TARGETED TO PRODUCTION ONLY
```

Runtime exception on the broken Preview:

```text
[Error: Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY]
```

Thrown from `getPublicSupabaseEnv()` in `src/lib/env/public.ts` during Routing Middleware client construction. `NEXT_PUBLIC_SUPABASE_ANON_KEY` does not satisfy that helper. `NEXT_PUBLIC_SITE_URL` was not the cause and was not changed.

## C2-C1.4 Manual configuration method

The publishable-key value was not copied through the CLI, Cursor chat, terminal, Git, or this document.

Owner action in the Vercel dashboard only:

1. Team `guus-projects-ai`, project `zyntixai`
2. Settings → Environment Variables
3. Existing `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Preserve Production targeting
5. Add general Preview targeting (not a branch-only entry)
6. Do not change the stored value
7. Do not substitute `NEXT_PUBLIC_SUPABASE_ANON_KEY`
8. Do not modify `NEXT_PUBLIC_SITE_URL`

Owner confirmation (no value):

```text
Preview target added to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
```

**The environment value was never shown, printed, logged, exported, downloaded, or stored in this phase.** `vercel env pull` was not used. No local env file was created. No value was passed through a shell command.

## C2-C1.5 Before / after environment-name targeting

Names and targets only. Values Encrypted / not retrieved.

| Name | Before C2-C1 | After owner confirmation |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production only | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | Preview present | Preview present (unchanged) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Preview present; unused by middleware | Preview present; unused by middleware |
| `NEXT_PUBLIC_SITE_URL` | Production only | Production only (unchanged) |
| Branch-specific Preview on `core/platform-readiness-20260707` | none | none |

Post-configuration `vercel env ls preview` listed `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with targets `Production, Preview`. Production targeting remained. Unrelated names/targets were unchanged as far as metadata can establish.

## C2-C1.6 Source and worktree integrity before redeploy

HEAD remained `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e`. Worktree clean. No source, lockfile, or `.vercel` linkage change. No credential file created. Pre-existing gitignored `.env.local` was not read, edited, or written.

## C2-C1.7 New Preview deployment

Command structure (no secrets, no `--prod`, no `--force`, no `--env`):

```text
npx vercel deploy --yes --target=preview --project zyntixai --scope guus-projects-ai --format json
```

Metadata: `gitCommitSha=a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e`, `gitCommitMessage=pw14-c2-c1-preview-env-alignment`, `gitCommitRef=core/platform-readiness-20260707`.

| Field | Value |
| --- | --- |
| Start | `2026-09-17T14:00:17+02:00` |
| End | `2026-09-17T14:02:54+02:00` |
| Status | Ready |
| Target | preview |
| New Preview URL | `https://zyntixai-enbdvqx07-guus-projects-ai.vercel.app` |
| Deployment ID (non-secret) | `dpl_7hrQFMyTFhFCNE9j2GJ5DjfsmSu2` |
| Source HEAD | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| `/` in candidate build | dynamic (`ƒ`) |

The broken Preview `https://zyntixai-9lib0ua4j-guus-projects-ai.vercel.app` was not reused. It remains Ready and is superseded in evidence only. It was not deleted.

## C2-C1.8 Production non-change evidence

Immediately after Preview creation (`2026-09-17T14:03:04+02:00`):

| URL | Result |
| --- | --- |
| `https://www.zyntixai.com/` | 307 `Location: /login` |
| `https://www.zyntixai.com/login` | 200 |
| `https://www.zyntixai.com/home` | 307 `Location: /login?next=%2Fhome` |
| `https://zyntixai.com/` | 308 `Location: https://www.zyntixai.com/` |

Newest Production listing remained about 3 days old. Newest Preview listing is the C2-C1 candidate (about 3 minutes). No Production alias was assigned to the new Preview. No `vercel promote` and no `--prod`.

## C2-C1.9 Deployment Protection handling

The Preview remains behind Vercel Deployment Protection. Protection settings were not changed. No bypass token was used. Protection cookies were not printed.

A headed Cursor IDE browser already authenticated to the authorized Vercel account opened the new Preview. That is Vercel account access to a protected Preview, not ZyntixAI application authentication.

ZyntixAI application login was **not** attempted.

## C2-C1.10 Middleware recovery

After passing Deployment Protection, logged-out Preview `/` returned HTTP 200 with `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`. Header `x-vercel-error` was absent. Page title was `ZyntixAI`, not `500: INTERNAL_SERVER_ERROR`. Body did not contain `MIDDLEWARE_INVOCATION_FAILED` or `Missing required environment variable`.

Routing Middleware completed for `GET /`, `GET /login`, and `GET /home` (info-level edge-middleware logs).

## C2-C1.11 Logged-out public-page evidence

Browser, logged-out ZyntixAI visitor, new Preview host only:

| Check | Result |
| --- | --- |
| Frozen H1 | `Houd zicht op klanten, werk en voortgang.` |
| Route A2 sections | Over ZyntixAI; Hoe het werkt; Today qualifier; opleidingen/coaching; toegang; closed-beta statements |
| Skip link | `Ga naar de hoofdinhoud` → `main#hoofdinhoud` |
| Dutch wrapper | `lang="nl"` present |
| App auth cookie | absent |
| Email / UUID in page text or query | absent |
| `/login` | reachable; Sign-in form; no ZyntixAI credentials entered |
| Logged-out `/home` | redirected to `/login?next=%2Fhome` |
| First-party CSS/JS | loaded (`/_next/static` link and script) |
| Client auth flash | none observed on public `/` |
| Console / uncaught page error | none observed for the application document |

`vercel.live` `/_next-live/feedback/` script and iframe did not load. That is Vercel live-feedback on a protected Preview, not a required first-party public-homepage asset. No application third-party analytics host was observed.

## C2-C1.12 Runtime-log verification

New Preview only (`https://zyntixai-enbdvqx07-guus-projects-ai.vercel.app`):

| Query | Result |
| --- | --- |
| `--level error` last 15 minutes | no logs |
| `--status-code 500` | no logs |
| `--query PUBLISHABLE` | no logs |
| `--source edge-middleware` | info `ε GET /`, `ε GET /login`, `ε GET /home` |

No environment value appeared in retrieved logs. Historical missing-key errors remain on the superseded Preview host and were not queried as a pass for this candidate.

## C2-C1.13 Preview environment gap register

| Name | Status |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | PRESENT FOR PREVIEW — VERIFIED |
| `NEXT_PUBLIC_SUPABASE_URL` | PRESENT FOR PREVIEW — PRE-EXISTING |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | LEGACY NAME — NOT USED BY CURRENT MIDDLEWARE |
| `NEXT_PUBLIC_SITE_URL` | STILL PRODUCTION-ONLY — SEPARATE DECISION REQUIRED |
| Production environment | UNCHANGED |

`NEXT_PUBLIC_SITE_URL` is not resolved. It was not added to Preview in this phase.

## C2-C1.14 Candidate retention

The working Preview `https://zyntixai-enbdvqx07-guus-projects-ai.vercel.app` is retained temporarily for PW-14-C2 authenticated routing verification. It is not promoted. It has no Production alias. Lifecycle owner: the existing `guus-projects-ai` / `zyntixai` operator. The broken Preview is superseded in evidence only and was not deleted.

## C2-C1.15 File and security integrity

Only this PW-14 evidence document is intended to change in the Git worktree. No product or test source, dependency, lockfile, env file, auth-storage, HAR, trace, screenshot, or video was added. No secret, key value, cookie, token, email, user ID, organization ID, or environment value is recorded here. Vercel project and team IDs are omitted. No deferred-work labels or unresolved-edit markers were introduced.

## C2-C1.16 C1 gate result

All C2-C1 acceptance conditions passed together: correct team/project; publishable-key name present for Preview; Production targeting intact; value never exposed; `NEXT_PUBLIC_SITE_URL` unchanged; new deployment Preview only; exact clean HEAD; build Ready; Deployment Protection still enabled; root no longer middleware 500 after protection; public homepage renders; `/login` reachable; logged-out `/home` protected; Runtime Logs show no missing publishable-key error; Production unchanged; candidate retained not promoted; nothing staged, committed, pushed, or promoted.

```text
PASS — PW-14-C2-C1 PREVIEW ENVIRONMENT ALIGNMENT AND MIDDLEWARE RECOVERY CLOSED WITH EVIDENCE
PW-14-C2 UNBLOCKED FOR AUTHENTICATED PREVIEW ROUTING VERIFICATION
PW-14 REMAINS BLOCKED — AUTHENTICATED ROUTING, ACCESSIBILITY, VISITOR VALIDATION AND PRODUCTION VERIFICATION OUTSTANDING
```

## C2-C1.17 Next authorized step

PW-14-C2 authenticated Preview dual-use root routing verification against the retained candidate `https://zyntixai-enbdvqx07-guus-projects-ai.vercel.app`, using an authorized existing QA account via headed manual ZyntixAI sign-in. Not started here. Not PW-14-C2-R1. Not PW-14-C3. Not Production.

End of PW-14-C2-C1 evidence.

---

# PW-14-C2-B1 — Authenticated Preview Sign-In Blocker Diagnosis

| Field | Value |
| --- | --- |
| Document section | PW-14-C2-B1 |
| Type | Diagnostic only — authenticated Preview sign-in blocker |
| Date | 2026-09-17 |
| Branch | `core/platform-readiness-20260707` |
| Source commit | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Vercel team | `guus-projects-ai` |
| Vercel project | `zyntixai` |
| Retained Preview | `https://zyntixai-enbdvqx07-guus-projects-ai.vercel.app` |
| Preview deployment ID | `dpl_7hrQFMyTFhFCNE9j2GJ5DjfsmSu2` |
| Parent PW-14 status | `PW-14 REMAINS BLOCKED` |
| C2 authenticated routing | not completed |
| Production | unchanged; not promoted |

This section does not modify product code, tests, environment values, Vercel settings, or Supabase settings. It does not close PW-14-C2.

## B1.1 Preflight

| Check | Result |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Upstream | same SHA after `git fetch origin` |
| Ahead / behind | `0 0` |
| Staged | none |
| Unstaged tracked | this PW-14 evidence document only |
| Untracked | none |
| Merge / rebase / cherry-pick / bisect / revert | none |
| Root `AGENTS.md` / `CONTRIBUTING.md` / `.cursor/rules` | absent |
| Nested `AGENTS.md` | vendor copies under `node_modules` only; not project instructions |
| Vercel CLI | `56.3.1` |
| CLI identity | authenticated |
| Accessible team | `guus-projects-ai` |
| Linked project | `zyntixai` |
| Scope `moneymotion-collab` | not used |

## B1.2 Authority and scope

Binding: B1-GATE.1; closed PW-0 through PW-13; this PW-14 document including C1, C1-R1, C1-FV, C2 middleware diagnosis, and C2-C1 recovery. Dual-use `/` remains implemented and unpublished. Authenticated Home remains closed. Diagnostic only.

## B1.3 Retained Preview identity

Inspected Ready, `target=preview`, URL and deployment ID match the authorized C2-C1 candidate. Source remains `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e`. Created after Preview targeting was added to `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Deployment Protection remained enabled. No new deployment was created in B1.

## B1.4 Production non-change

Logged-out checks at `2026-09-17T14:33:47+02:00`:

| URL | Result |
| --- | --- |
| `https://www.zyntixai.com/` | 307 `Location: /login` |
| `https://www.zyntixai.com/login` | 200 |
| `https://www.zyntixai.com/home` | 307 `Location: /login?next=%2Fhome` |
| `https://zyntixai.com/` | 308 `Location: https://www.zyntixai.com/` |

No Production login was attempted. No `--prod`. No promote.

## B1.5 Generic sign-in failure

Headed Preview `/login` showed product copy:

```text
Unable to sign in. Please try again.
```

That string is not a diagnosis by itself.

## B1.6 Source auth-flow analysis

| Question | Finding |
| --- | --- |
| Submit handler | Client `LoginForm.handleSubmit` calls server action `loginAction` |
| Mechanism | Server `supabase.auth.signInWithPassword` via `createSupabaseServerClient` |
| Browser-to-Supabase | No. The browser does not call `/auth/v1/token` for password login |
| Generic message sources | (1) `normalizeLoginError` for unmapped provider errors; (2) `loginAction` `catch` returning the same copy for any thrown exception |
| Mapped separately | invalid credentials → `Invalid email or password.`; unconfirmed email → `Verify your email to continue.`; rate limit → `Too many attempts. Try again later.` |
| Observed UI copy | generic catch/unmapped path, **not** the invalid-credentials product sentence |
| `NEXT_PUBLIC_SITE_URL` | imported in `auth-actions.ts` for registration/recovery only; **not used** by `loginAction` |
| Success navigation | `router.replace(result.redirectTo)` where `redirectTo` is `resolvePostLoginDestination` (often `/home?org=…` for a completed single org; org not recorded here) |
| 17.8s password-field render | login form re-renders on `onChange` only; no 17s loop in source. Observation is not explained by application login logic |

A thrown `TypeError` from `signInWithPassword` is swallowed by `loginAction` `catch` and becomes the generic UI message. Successful auth followed by resolver throw would also hit that `catch`; B1 runtime evidence shows the throw occurred during fetch, before a session was issued.

## B1.7 Environment-name and target audit

Names and targets only. Values not pulled or printed.

| Name | Targets | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | separate Development, Preview, and Production records | Preview record age ~84d |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production, Preview on one record | Production-age record (~61d) later given Preview targeting |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Development, Preview, Production | unused by `getPublicSupabaseEnv()` |
| `NEXT_PUBLIC_SITE_URL` | Production only | unchanged; not used by password login |
| Branch-specific Preview on `core/platform-readiness-20260707` | none | no shadowing |

Both required names are present for general Preview. They are **not** the same configuration record. Value identity across those records was not proven and is not claimed. The Preview URL host is evidenced only via the sanitized DNS error below, not by printing the stored value.

## B1.8 Focused local tests

| Command | Exit | Result |
| --- | --- | --- |
| `npm run test:run -- tests/auth/auth-actions.test.ts tests/auth/normalize-auth-error.test.ts tests/auth/entry-routing-and-login-ui.test.tsx tests/auth/safe-return-path.test.ts tests/auth/middleware-auth-redirects.test.ts tests/auth/resolve-authenticated-landing.test.ts tests/public-web/public-homepage.test.tsx tests/onboarding/product-admission-routing.test.ts tests/onboarding/onboarding-routing.test.ts tests/features/invitations/invite-registration-continuation-r1.test.ts` | 0 | 10 files, 97 passed, 0 failed, 0 skipped |
| `npm run typecheck` | 0 | pass |
| `git diff --check` | 0 | pass |

Local tests prove mapping and routing contracts. They do not prove Preview DNS or live Auth.

C1 full suite 536/4213/0/0 remains the last complete-suite evidence; no source or test file changed.

## B1.9 Sanitized Vercel runtime evidence

Retained Preview only. `--level error --since 2h`. Seven `POST /login` errors. Representative sanitized form:

| Field | Value |
| --- | --- |
| Times (local) | 14:15:28 through 14:24:13 on 2026-09-17 |
| Path | `POST /login` |
| Runtime | edge-middleware/edge (`ε`) and one serverless (`λ`) |
| Exception class | `TypeError` / `Error` |
| Sanitized message | `fetch failed` caused by `getaddrinfo ENOTFOUND` for a Preview-configured `*.supabase.co` hostname |
| HTTP auth status from Supabase | none — DNS failed before a response |
| Session issued | no |

Absence of a mapped Auth JSON error is expected: the TCP/DNS lookup never succeeded. Vercel logs **do** contain this failure because password login is a server action, not a browser-direct Auth call.

No environment value, token, cookie, email, or UUID is copied here. The unresolved hostname is redacted.

## B1.10 Secure headed-browser method

Password authentication is server-side. A browser observer on `/auth/v1/token` would not see the failing fetch. B1 therefore used sanitized Preview Runtime Logs from the owner’s already submitted headed login attempts on the retained Preview. No additional credential submission was requested. No trace, video, HAR, screenshot, or storage state was saved. Fields were not read.

## B1.11 Sanitized auth result

| Field | Result |
| --- | --- |
| Auth request created | yes — server action `POST /login` |
| Browser `/auth/v1/token` | not used by this flow |
| HTTP method | POST |
| Supabase HTTP status | not obtained (DNS failure) |
| Sanitized error | `TypeError: fetch failed` / `ENOTFOUND` |
| Session issued | no |
| Page navigated away from `/login` | no |
| Generic UI message | yes |
| Post-auth resolver error | no — fetch failed before `getUser` / `resolvePostLoginDestination` |
| Storage artifacts | none |

## B1.12 Performance observation

Vercel Toolbar reported ~17,768 ms total on one password-field interaction. Application login source has no matching 17s render loop. Classify as **Vercel Toolbar / injected Preview tooling**, not the authentication root cause. It does not explain `ENOTFOUND`.

## B1.13 Root-cause classification

```text
E. PREVIEW SUPABASE URL AND PUBLISHABLE-KEY PROJECT MISMATCH
```

Supported by:

- Preview `NEXT_PUBLIC_SUPABASE_URL` is an older separate Preview record, not the Production URL record.
- Preview `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the Production-age record later targeted to Preview.
- `loginAction` fetch to the Preview-configured Auth hostname fails with `ENOTFOUND`.
- `loginAction` `catch` maps that throw to `Unable to sign in. Please try again.`
- The UI was **not** `Invalid email or password.`, so this is not established as invalid credentials.

Unresolved without printing values: whether the Preview URL record is a deleted project, a typo, or merely a different live project from the publishable key. DNS failure already proves the Preview URL host is not a reachable Auth endpoint.

Not A, C, D, F, G, or H as the primary cause.

## B1.14 Correction boundary

Do not implement here.

Smallest separately authorized next action: Vercel/Supabase owner aligns Preview `NEXT_PUBLIC_SUPABASE_URL` in the dashboards with the live project that owns the governed publishable key, without exposing values, then creates a new Preview after that alignment. Do not substitute `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Do not change `NEXT_PUBLIC_SITE_URL` in that alignment unless separately authorized. Do not promote.

## B1.15 Remaining PW-14 blockers

- PW-14-C2 authenticated Preview routing still not completed
- accessibility / NVDA
- visitor validation
- Production publication and live verification
- `NEXT_PUBLIC_SITE_URL` remains Production-only (separate from this sign-in DNS failure)

## B1.16 Security confirmation

No credential, email, token, cookie, key value, UUID, request body, or private page content recorded. `vercel env pull` not used. No Playwright auth storage. No HAR/trace/video. No additional login requested after the logged failures. No session to sign out. Headed browser not left in an authenticated ZyntixAI state by this diagnostic.

## B1.17 Git and file-integrity state

Only this evidence document is modified. No source, test, lockfile, env file, or configuration change. Nothing staged.

## B1.18 Gate result

```text
DIAGNOSED — PW-14-C2 AUTHENTICATED PREVIEW SIGN-IN BLOCKER ROOT CAUSE ESTABLISHED
PW-14-C2 AUTHENTICATED ROUTING VERIFICATION NOT COMPLETED
DO NOT PROMOTE
PRODUCTION UNCHANGED
PW-14 REMAINS BLOCKED
```

## B1.19 Next authorized step

Separately authorized Preview environment-name alignment for `NEXT_PUBLIC_SUPABASE_URL` (dashboard only, values not printed), then a new non-Production Preview. Not C2-R1. Not C3. Not Production.

End of PW-14-C2-B1 evidence.

---

# PW-14-C2-C2 — Preview Supabase URL Alignment and Candidate Replacement

| Field | Value |
| --- | --- |
| Document section | PW-14-C2-C2 |
| Type | Preview URL alignment and non-Production candidate replacement |
| Date | 2026-09-17 |
| Source commit | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Vercel team | `guus-projects-ai` |
| Vercel project | `zyntixai` |
| New Preview | `https://zyntixai-nyq6lslaz-guus-projects-ai.vercel.app` |
| New deployment ID | `dpl_8NTNzaoKWvk8iAKkfGL5aEuM8ncc` |
| Superseded Preview | `https://zyntixai-enbdvqx07-guus-projects-ai.vercel.app` |
| Parent PW-14 status | `PW-14 REMAINS BLOCKED` |
| Authenticated C2 | not completed |

Owner confirmation (no value):

```text
Preview NEXT_PUBLIC_SUPABASE_URL aligned to the governed Supabase project.
```

Values were not pulled, printed, or stored. `vercel env pull` was not used. `NEXT_PUBLIC_SITE_URL` was not changed. `NEXT_PUBLIC_SUPABASE_ANON_KEY` was not substituted.

## C2-C2.1 Name-target audit after confirmation

Names and targets only.

| Name | After confirmation |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | still present as a distinct Preview record (created-age metadata unchanged; value not inspected) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | still Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | still Production only |
| Branch-specific Preview | none |

Value identity between Preview URL and Production URL cannot be proven from names. Recovery of DNS is proven only by a later `POST /login` without `ENOTFOUND`.

## C2-C2.2 New Preview deployment

Command (no `--prod`, no `--force`, no `--env`):

```text
npx vercel deploy --yes --target=preview --project zyntixai --scope guus-projects-ai --format json
```

| Field | Value |
| --- | --- |
| Start | `2026-09-17T15:34:19+02:00` |
| End | `2026-09-17T15:36:13+02:00` |
| Status | Ready |
| Target | preview |
| Local tree | product HEAD `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e`; only this evidence document dirty |

The DNS-failing C2-C1 Preview was not reused. It was not deleted.

## C2-C2.3 Production non-change

At `2026-09-17T15:36:24+02:00`: `www /` 307 `/login`; `/login` 200; `/home` 307 `/login?next=%2Fhome`; apex 308 to www. Newest Production listing still about 3 days old. No promote.

## C2-C2.4 Logged-out Preview checks

After Deployment Protection, new Preview `/` renders frozen H1 `Houd zicht op klanten, werk en voortgang.` `/login` shows Sign in. Logged-out `/home` redirects to `/login?next=/home`. GET routes on this candidate produced no error logs before sign-in.

## C2-C2.5 Post-alignment sign-in observation

Owner confirmed sign-in submission complete. Credentials were not read, logged, or stored.

Sanitized result on `https://zyntixai-nyq6lslaz-guus-projects-ai.vercel.app`:

| Field | Result |
| --- | --- |
| Final path | `/login` |
| H1 | Sign in |
| Generic UI copy | `Unable to sign in. Please try again.` present |
| Invalid-credentials copy | absent |
| App auth cookie | absent |
| Session issued | no |
| Runtime | three `POST /login` errors at 15:38:19, 15:38:51, 15:39:05 local |
| Exception | `TypeError: fetch failed` / `getaddrinfo ENOTFOUND` for a Preview-configured `*.supabase.co` host (hostname redacted) |

The unresolved host is the same class as PW-14-C2-B1. The new candidate is still using a non-resolving Auth hostname. Owner confirmation that Preview `NEXT_PUBLIC_SUPABASE_URL` was aligned is **not** reflected in runtime DNS.

Likely dashboard pitfall (names only, values not inspected): a distinct Preview-only `NEXT_PUBLIC_SUPABASE_URL` record still exists alongside a Production URL record. Editing Production, or adding Preview targeting to Production, does not remove or replace the Preview-only record that `loginAction` continues to resolve.

Production `www /` at `2026-09-17T15:41:26+02:00` remained 307 `/login`. No promote.

## C2-C2.6 Retention

Retain the new Preview only as the current C2 candidate host. Do not promote. Do not treat sign-in as recovered.

## C2-C2.7 Gate

```text
BLOCKED — PW-14-C2 PREVIEW SUPABASE URL STILL UNRESOLVABLE AFTER ALIGNMENT CONFIRMATION
PW-14-C2 AUTHENTICATED ROUTING VERIFICATION NOT COMPLETED
DO NOT PROMOTE
PRODUCTION UNCHANGED
PW-14 REMAINS BLOCKED
```

Required next dashboard action (no values in chat): edit the **Preview-targeted** `NEXT_PUBLIC_SUPABASE_URL` record itself so its host is the live governed project; do not assume a Production-row edit covers Preview; then authorize another non-Production Preview. Do not substitute `ANON_KEY`. Do not change `NEXT_PUBLIC_SITE_URL` unless separately authorized.

End of PW-14-C2-C2 evidence.

---

# PW-14-C2-C3 — Preview-Only Supabase URL Record Replacement

| Field | Value |
| --- | --- |
| Document section | PW-14-C2-C3 |
| Date | 2026-09-17 |
| Source commit | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| New Preview | `https://zyntixai-bsr5cxad5-guus-projects-ai.vercel.app` |
| New deployment ID | `dpl_HiRrHXQCdDUJjWQ493nEXTzfhGse` |
| Superseded Preview | `https://zyntixai-nyq6lslaz-guus-projects-ai.vercel.app` |
| Parent status | `PW-14 REMAINS BLOCKED` |

Owner confirmation (no value):

```text
The Preview-only Secret NEXT_PUBLIC_SUPABASE_URL record was replaced by a Preview-only Config record using the governed Supabase Project URL. Production and Development were not changed.
```

## C3.1 Name-target audit

Names only. Values not pulled.

| Name | Result |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` Preview | new Preview-only record, created age ~30s at audit |
| `NEXT_PUBLIC_SUPABASE_URL` Production | still Production, ~61d (unchanged metadata) |
| `NEXT_PUBLIC_SUPABASE_URL` Development | still Development, ~84d (unchanged metadata) |
| Prior 84d Preview URL record | no longer listed |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | still Production, Preview |
| `NEXT_PUBLIC_SITE_URL` | still Production only |

## C3.2 New Preview

`npx vercel deploy --yes --target=preview --project zyntixai --scope guus-projects-ai` (no `--prod`). Start `2026-09-17T15:50:55+02:00`, end `2026-09-17T15:52:49+02:00`. Ready, target preview. Product HEAD `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e`. Evidence document was the only local dirty file.

## C3.3 Production non-change

`2026-09-17T15:53:01+02:00`: www `/` 307 `/login`; `/login` 200; `/home` 307 `/login?next=%2Fhome`; apex 308 to www. Newest Production still ~3d. No promote.

## C3.4 Logged-out Preview

New host `/` shows frozen H1. `/login` shows Sign in.

## C3.5 Gate (candidate created; sign-in then executed)

```text
PASS — PW-14-C2-C3 PREVIEW URL RECORD REPLACED AND CANDIDATE CREATED
PW-14-C2 AUTHENTICATED SIGN-IN VERIFICATION OUTSTANDING
DO NOT PROMOTE
PRODUCTION UNCHANGED
PW-14 REMAINS BLOCKED
```

## C3.6 Post-replacement sign-in observation

Owner confirmed sign-in submission complete on `https://zyntixai-bsr5cxad5-guus-projects-ai.vercel.app`. Credentials were not read, logged, or stored. No extra credential retry was requested after this inspection.

Sanitized result:

| Field | Result |
| --- | --- |
| Final path | `/login` |
| H1 | Sign in |
| Generic UI copy | `Unable to sign in. Please try again.` present |
| Invalid-credentials copy | absent |
| Unconfirmed-email copy | absent |
| Rate-limit copy | absent |
| App auth cookie (non-httpOnly probe) | absent |
| Authenticated `/` | still logged-out public homepage (frozen H1; Inloggen) |
| `GET /home` after login | not observed in runtime logs |
| Session issued | no |
| Runtime | `POST /login` at 15:54:01, 15:54:58, and 15:56:30 local; all `info` / HTTP 200 |
| `--level error` / `--level warning` | none for this candidate in the observation window |
| `TypeError: fetch failed` / `getaddrinfo ENOTFOUND` | not reproduced |

Name-target audit after sign-in (values not pulled): Preview `NEXT_PUBLIC_SUPABASE_URL` still the new Preview-only Config record (~8m); `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` still the 61d Production+Preview record. Leftover Preview-only `NEXT_PUBLIC_SUPABASE_ANON_KEY` (~84d) remains listed and was not used by `loginAction`.

Production at `2026-09-17T15:59:20+02:00`: www `/` 307 `/login`; `/login` 200; `/home` 307 `/login?next=%2Fhome`; apex 308 to www. No promote.

## C3.7 Classification

PW-14-C2-B1 class **E** (unresolvable Auth hostname) is **not reproduced** on this candidate.

Remaining class **I**: `loginAction` returned the generic product copy without a Vercel error/warning stream. That is consistent with `signInWithPassword` reaching a live host and returning an Auth error that `normalizeLoginError` does not map (for example a key/project mismatch), or with a thrown failure that the action `catch` swallowed without an error-level log. It is not class A/B/C (mapped copy absent), not class D (logged-out `/` 200), and not class G/H (no session, public `/`).

`NEXT_PUBLIC_SITE_URL` remains unused by password login and was not changed.

## C3.8 Retention and gate

Retain this Preview only as the current C2 candidate host. Do not promote. Do not treat authenticated routing as started. Do not retry credentials until Preview URL identity with the governed project is confirmed in the dashboard (no values in chat).

```text
BLOCKED — PW-14-C2 PREVIEW AUTH REACHABLE BUT SIGN-IN STILL GENERIC AFTER URL RECORD REPLACEMENT
PW-14-C2 AUTHENTICATED ROUTING VERIFICATION NOT COMPLETED
DO NOT PROMOTE
PRODUCTION UNCHANGED
PW-14 REMAINS BLOCKED
```

Required next dashboard action (no values in chat): compare the Preview-only `NEXT_PUBLIC_SUPABASE_URL` Config value to the Production `NEXT_PUBLIC_SUPABASE_URL` value and to the project that issued the 61d `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. They must be the same governed project. If they differ, edit the Preview URL record and authorize another non-Production Preview. If they already match, do not substitute `ANON_KEY`; stop and wait for a separately authorized diagnostic. Not C2-R1. Not C3. Not Production.

End of PW-14-C2-C3 evidence.

---

# PW-14-C2-C4 — Confirmed URL Match; Generic Sign-In Remains

| Field | Value |
| --- | --- |
| Document section | PW-14-C2-C4 |
| Date | 2026-09-17 |
| Source commit | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Candidate | `https://zyntixai-bsr5cxad5-guus-projects-ai.vercel.app` |
| Deployment ID | `dpl_HiRrHXQCdDUJjWQ493nEXTzfhGse` |
| Parent status | `PW-14 REMAINS BLOCKED` |
| Authenticated C2 | not completed |

Owner confirmation (no value):

```text
Preview and Production NEXT_PUBLIC_SUPABASE_URL values match.
```

Values were not pulled, printed, or stored. `vercel env pull` was not used. Credentials were not retried. `NEXT_PUBLIC_SUPABASE_ANON_KEY` was not substituted. `NEXT_PUBLIC_SITE_URL` was not changed.

## C4.1 Login-relevant name delta

Names, targets, and created-age metadata only.

| Name | Production listing | Preview listing | Used by `loginAction` |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production-only, ~61d | Preview-only Config, ~15m | yes (same value per owner) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | one record, Production+Preview, ~61d | same record | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production-only, ~61d | Preview-only, ~84d (distinct record) | no |
| `NEXT_PUBLIC_SITE_URL` | Production-only, ~59d | absent | no |
| `SUPABASE_SERVICE_ROLE_KEY` | Production-only, ~22d | Preview-only, ~84d (distinct record) | no |

`getPublicSupabaseEnv()` has required `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` since that helper was introduced. Production (still unpublished dual-use `/`) uses that helper. Preview leftover 84d `ANON_KEY` / service-role records are historical drift and are not on the password-login path.

## C4.2 Why class I is not split further from runtime

C2-C3 already showed: generic UI copy; no mapped invalid-credentials / unconfirmed / rate-limit copy; no session; public `/` after submit; `POST /login` HTTP 200 `info`; no `ENOTFOUND`.

Additional source facts for this confirmation:

- `LoginForm.handleSubmit` has no client `catch`; the generic sentence is the server action result, not a browser fetch mapping.
- `resolvePostLoginDestination` returns a path (including `/register/complete` or `/invite/accept`) instead of throwing on missing memberships. A post-auth resolver miss would navigate, not show generic copy.
- Therefore the remaining split is only: **I1** `signInWithPassword` returned an Auth error `normalizeLoginError` does not map, versus **I2** a thrown failure inside `loginAction` `catch` that Vercel did not emit at error/warning level.

That split is not visible from current Vercel logs.

## C4.3 Production non-change

`2026-09-17T16:06:49+02:00`: www `/` 307 `/login`; `/home` 307 `/login?next=%2Fhome`. No `--prod`. No promote.

## C4.4 Retention and gate

Retain `bsr5cxad5` as the C2 candidate. Do not promote. Do not retry credentials on this candidate until a discriminator for I1 versus I2 is authorized. Do not add Preview `SITE_URL` as a login fix. Do not substitute `ANON_KEY`.

```text
BLOCKED — PW-14-C2 URL MATCH CONFIRMED; GENERIC SIGN-IN STILL UNCLASSIFIED
PW-14-C2 AUTHENTICATED ROUTING VERIFICATION NOT COMPLETED
DO NOT PROMOTE
PRODUCTION UNCHANGED
PW-14 REMAINS BLOCKED
```

Smallest next diagnostic (no product edit): governed-project Auth logs for `2026-09-17T13:54:00Z`–`2026-09-17T13:57:00Z`. Report a code token only (no email, user id, IP, token, or host). Not C2-R1 unless Auth logs are unavailable. Not C3. Not Production.

End of PW-14-C2-C4 evidence.

---

# PW-14-C2-C5 — Governed Auth Logs Show No Password Grant

| Field | Value |
| --- | --- |
| Document section | PW-14-C2-C5 |
| Date | 2026-09-17 |
| Source commit | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Candidate | `https://zyntixai-bsr5cxad5-guus-projects-ai.vercel.app` |
| Parent status | `PW-14 REMAINS BLOCKED` |
| Authenticated C2 | not completed |

Owner confirmation (code token only):

```text
Auth log: none
```

No email, user id, IP, token, or host was reported. Credentials were not retried. No product file was edited. `vercel env pull` was not used.

## C5.1 Interpretation

The C2-C3 `POST /login` attempts at 15:54:01, 15:54:58, and 15:56:30 local (`13:54:01Z`, `13:54:58Z`, `13:56:30Z`) sit inside the requested Auth-log window. If those calls had completed an HTTP password grant against the governed project, a log row would be expected.

**I1** (Auth returned an unmapped error object) is **disconfirmed** for this window and project, with one caveat: some dashboard Auth views omit raw `/auth/v1/token` failures. Combined with no Vercel `ENOTFOUND` and no session, the stronger remaining class is **I2**: `loginAction` `catch` swallowed a throw before GoTrue accepted an HTTP grant (connect/TLS/timeout/other `fetch failed` whose `message` is not currently logged).

`loginAction` `catch` currently discards the exception, which matches empty Vercel error logs and empty Auth logs together.

## C5.2 Production non-change

`2026-09-17T16:15:26+02:00`: www `/` 307 `/login`. No `--prod`. No promote.

## C5.3 Proposed PW-14-C2-R1 (not started)

Diagnostic-only, separately authorized. Not started in this section.

| Constraint | Rule |
| --- | --- |
| Where | `loginAction` only |
| When | `process.env.VERCEL_ENV === "preview"` |
| Auth-error branch | log `code` and `status` only |
| `catch` branch | log `name` and `cause.code` / `cause.errno` only |
| Forbidden | `error.message`, URLs, hostnames, emails, tokens, cookies, user ids |
| Deploy | new non-Production Preview of exact HEAD plus this diagnostic; no `--prod` |
| Sign-in | one headed QA sign-in after that Preview |
| After | classify I2 cause token; do not keep the log line as a product feature unless separately authorized |
| Tests | assert generic UI copy unchanged; assert log payload has no `message` field |

Do not add Preview `SITE_URL`. Do not substitute `ANON_KEY`. Do not treat this as publication.

## C5.4 Gate

```text
BLOCKED — PW-14-C2 GOVERNED AUTH LOGS SHOW NO PASSWORD GRANT
I1 DISCONFIRMED FOR THE REQUESTED WINDOW (DASHBOARD CAVEAT NOTED)
REMAINING CLASS I2
PW-14-C2 AUTHENTICATED ROUTING VERIFICATION NOT COMPLETED
DO NOT PROMOTE
PRODUCTION UNCHANGED
PW-14 REMAINS BLOCKED
```

Next: authorize **PW-14-C2-R1** as specified in C5.3. Not C3. Not Production.

End of PW-14-C2-C5 evidence.

---

# PW-14-C2-C6 — Bare Project URL Correction Check and New Preview

| Field | Value |
| --- | --- |
| Document section | PW-14-C2-C6 |
| Date | 2026-09-17 |
| Source commit | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` (unchanged; no instrumentation) |
| New Preview | `https://zyntixai-5ndpuk7lf-guus-projects-ai.vercel.app` |
| New deployment ID | `dpl_4eR1xj97vEbfexDKyqMtpedgEPX7` |
| Inspect | `target=preview`, Ready |
| Superseded Preview | `https://zyntixai-bsr5cxad5-guus-projects-ai.vercel.app` |
| Parent status | `PW-14 REMAINS BLOCKED` |
| Authenticated C2 | not started on this candidate |

Owner confirmation (no value):

```text
The Preview-only NEXT_PUBLIC_SUPABASE_URL is now saved as the bare governed Supabase Project URL ending at .supabase.co, with no /rest/v1 or /auth/v1 suffix. The previous Preview was built before this correction. Production and Development were not changed.
```

PW-14-C2-R1 was not started.

## C6.1 Deploy

`npx vercel deploy --yes --target=preview --project zyntixai --scope guus-projects-ai` (no `--prod`). Start `2026-09-17T16:21:42+02:00`, end `2026-09-17T16:23:36+02:00`. Product HEAD unchanged. Evidence document was the only local dirty file. Build cache restored from `dpl_HiRrHXQCdDUJjWQ493nEXTzfhGse`; Next still compiled.

Preview `NEXT_PUBLIC_SUPABASE_URL` remained the same Preview-only Config record (created-age metadata unchanged: in-place save, not a new name). Production and Development URL rows were not retargeted.

## C6.2 Production non-change

`2026-09-17T16:23:52+02:00`: www `/` 307 `/login`; `/login` 200; `/home` 307 `/login?next=%2Fhome`; apex 308 to www. No promote.

## C6.3 Logged-out Preview

After Deployment Protection, new host `/` renders frozen H1 `Houd zicht op klanten, werk en voortgang.` `/login` shows Sign in with no generic error. Logged-out `/home` redirects to `/login?next=/home`. Public client assets contain no `supabase.co` URL (password login remains a server action).

## C6.4 Effective Auth URL path class

Client JS cannot show the server Auth base URL. Path class was taken from the current Preview environment record (temporary local file, value never printed, file deleted). No hostname, project ref, or full URL is recorded here.

| Check | Result |
| --- | --- |
| Name `NEXT_PUBLIC_SUPABASE_URL` present | yes |
| Protocol | https |
| Host ends with `.supabase.co` | yes |
| Path class | **`rest_v1_suffix`** |
| `/auth/v1` suffix | no |
| Query/hash | no |

The effective Preview Auth base is **not** origin-only. `signInWithPassword` will call `{url}/auth/v1/token`, which on a `/rest/v1` base is not GoTrue. That matches C2-C5 `Auth log: none` with live DNS and generic UI copy.

This candidate was built while that path class was still `rest_v1_suffix`. Sign-in is not requested.

## C6.5 Gate

```text
BLOCKED — PW-14-C2 PREVIEW SUPABASE URL STILL HAS /rest/v1 PATH
PW-14-C2 AUTHENTICATED ROUTING VERIFICATION NOT STARTED ON 5ndpuk7lf
DO NOT PROMOTE
PRODUCTION UNCHANGED
PW-14 REMAINS BLOCKED
```

Required dashboard action (no values in chat): set Preview-only `NEXT_PUBLIC_SUPABASE_URL` to the Project URL origin that ends at `.supabase.co` with an empty path. Do not use the Data API / REST URL. Leave Production and Development unchanged. Then authorize another non-Production Preview. Do not substitute `ANON_KEY`. Do not start C2-R1. Not C3. Not Production.

End of PW-14-C2-C6 evidence.

---

# PW-14-C2-C7 — Origin-Only Preview URL and New Candidate

| Field | Value |
| --- | --- |
| Document section | PW-14-C2-C7 |
| Date | 2026-09-17 |
| Source commit | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| New Preview | `https://zyntixai-ecbqshegd-guus-projects-ai.vercel.app` |
| New deployment ID | `dpl_CPp7EasM3VWQXFUP7AWV4qcnQefQ` |
| Inspect | `target=preview`, Ready |
| Superseded Preview | `https://zyntixai-5ndpuk7lf-guus-projects-ai.vercel.app` |
| Parent status | `PW-14 REMAINS BLOCKED` |
| Authenticated C2 | outstanding |

Owner confirmation (no value):

```text
Preview NEXT_PUBLIC_SUPABASE_URL is origin-only ending at .supabase.co
```

PW-14-C2-R1 was not started. Values were not printed. Temporary classification file was deleted.

## C7.1 Path class before deploy

| Check | Result |
| --- | --- |
| Protocol | https |
| Host ends with `.supabase.co` | yes |
| Path class | **`bare_project_url`** |
| `/rest/v1` suffix | no |
| `/auth/v1` suffix | no |
| Query/hash | no |

Same Preview-only Config record (created-age ~1h; in-place save). Production and Development URL rows were not changed.

## C7.2 Deploy

`npx vercel deploy --yes --target=preview --project zyntixai --scope guus-projects-ai` (no `--prod`). Start `2026-09-17T17:18:48+02:00`, end `2026-09-17T17:20:37+02:00`. Product HEAD unchanged. Evidence document was the only local dirty file.

## C7.3 Production non-change

`2026-09-17T17:21:15+02:00`: www `/` 307 `/login`. No promote.

## C7.4 Logged-out Preview

After Deployment Protection: `/` frozen H1; `/login` Sign in, no generic error; logged-out `/home` → `/login?next=/home`.

## C7.5 Gate (candidate created; sign-in then executed on this host)

```text
PASS — PW-14-C2-C7 ORIGIN-ONLY PREVIEW URL VERIFIED AND CANDIDATE CREATED
PW-14-C2 AUTHENTICATED SIGN-IN VERIFICATION OUTSTANDING
DO NOT PROMOTE
PRODUCTION UNCHANGED
PW-14 REMAINS BLOCKED
```

Sign in only on `https://zyntixai-ecbqshegd-guus-projects-ai.vercel.app/login` as the authorized existing Home-eligible QA owner. Do not use superseded Previews. Do not paste credentials.

## C7.6 Wrong-host sign-in (not counted)

Owner confirmed sign-in submission complete. The current candidate `ecbqshegd` had **no** `POST /login` in the observation window. Two `POST /login` info rows landed on superseded `bsr5cxad5` at 17:21:55 and 17:22:27 local; that tab remained `/login` with generic copy; no error-level `ENOTFOUND`. That host is not origin-only baked. This is not a C7 candidate result.

## C7.7 Origin-only host sign-in (logs)

Second owner confirmation. On `ecbqshegd`:

| Time local | Event | Result |
| --- | --- | --- |
| 17:24:58 | `POST /login` | info / HTTP 200; no error log |
| 17:25:04 | `GET /home` | 200 (authenticated; not 307 login) |
| 17:25:08 | `GET /onboarding/operating-model` | 200 |
| 17:25:11 | `GET /home` | 200 |

Session was issued. Destination category: authenticated product (`/home` then `/onboarding/operating-model`). Organization query values are not recorded. This disconfirms generic/ENOTFOUND on the origin-only URL.

## C7.8 Headed dual-use matrix not yet observed

The sign-in tab was closed before headed checks. A new headed context on the same host rendered the logged-out public homepage (no shared app session across that context). Authenticated `/`, `/login` bounce, AppShell isolation, and cache headers still require a live session in the headed tab. Not a Production check. Not C2-R1.

## C7.9 Headed session recovered

A later sign-in in a kept headed tab on `ecbqshegd` recovered the session. Dual-use matrix is recorded in **PW-14-C2 — Authenticated Preview and Dual-Use Root Routing Evidence** below.

End of PW-14-C2-C7 evidence.

---

# PW-14-C2 — Authenticated Preview and Dual-Use Root Routing Evidence

| Field | Value |
| --- | --- |
| Phase | PW-14-C2 |
| Date | 2026-09-17 |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Ahead / behind | `0 0` |
| Candidate | `https://zyntixai-ecbqshegd-guus-projects-ai.vercel.app` |
| Deployment ID | `dpl_CPp7EasM3VWQXFUP7AWV4qcnQefQ` |
| Inspect | `target=preview`, Ready |
| Account | AUTHORIZED EXISTING HOME-ELIGIBLE QA OWNER |
| Parent PW-14 | `BLOCKED — PW-14 PUBLICATION ADMISSION FAILED` / `DO NOT DEPLOY` |

C2 PASS ≠ PW-14 closed. C2 PASS ≠ Production verified. C2 PASS ≠ published.

## 1. Preflight

Worktree: only this evidence file dirty. Product HEAD unchanged. No product, test, or env file edited in C2. No `AGENTS.md`. Home remains closed. PW-13 dual-use `/` is implemented in source, not live on Production.

## 2. Authority Review

C2 is Preview-only dual-use routing evidence. No `--prod`, no promote, no NVDA, no visitor research, no C3, no C2-R1 (not started). Authenticated Home is observed only as a routing/isolation surface.

## 3. Routing-State Matrix

| State | Expected | Observed on candidate |
| --- | --- | --- |
| Logged-out `/` | PublicHomepage, frozen H1 | PASS |
| Logged-out `/login` | Sign in | PASS |
| Logged-out `/home` | 307 `/login?next=/home` | PASS |
| Authenticated `/` | `resolveAuthenticatedEntryPath`, not public H1 | PASS — headed `/` → `/onboarding/operating-model` (org query redacted) |
| Authenticated `/login` | bounce via `resolvePostLoginDestination` | PASS — Sign in not shown |
| Authenticated `/home` | product admission, not public homepage | PASS — 200 then lifecycle rewrite to operating-model attention |

## 4. Local Focused Tests

Not re-run in this closing pass. Last C1 full suite remains 536/4213/0/0. No source change since `a8e359bc`.

## 5. Production Baseline

`2026-09-17T17:32:06+02:00`: www `/` 307 `/login`; `Cache-Control: private, no-cache, no-store`. Dual-use `/` is not live.

## 6. Logged-Out Preview Baseline

Recorded in C2-C7.4 on this candidate after Deployment Protection.

## 7. Authorized Account

Existing Home-eligible QA owner. Credentials never stored. No new user or org created.

## 8. Secure Manual Sign-In

Headed password submit on `ecbqshegd` `/login` only. Wrong-host submits on `bsr5cxad5` were not counted (C7.6).

## 9. Post-Login Result

`POST /login` 200 info at 17:29:05 local (and earlier 17:24:58). No error-level `ENOTFOUND`. Session issued. Destination category: authenticated product (`/home` and `/onboarding/operating-model`). Not generic UI copy.

## 10. Authenticated Root

Headed GET `/` with session did **not** render frozen public H1 or Inloggen. It resolved to `/onboarding/operating-model` (org redacted). Dual-use Model A holds.

## 11. Authenticated Login Bounce

Headed GET `/login` with session did not keep Sign in. Same authenticated landing as root.

## 12. Authenticated Home

Credentialed `GET /home` returned 200, `x-matched-path: /home`, `Cache-Control: private, no-cache, no-store`. Headed follow-through for this org is operating-model attention (`Workspace configuration needs attention`), not the public homepage and not a Today AppShell screenshot. Home product code was not modified.

## 13. AppShell and CSS Isolation

Authenticated surfaces showed product onboarding chrome (`Back to workspace`; no public Inloggen; no frozen public H1). Public homepage chrome was absent. Today AppShell skip-link was **not** observed because this org never stayed on `/home`. Public homepage chrome and copy isolation were observed on the onboarding surface only. Today AppShell CSS isolation against the actual Today surface was not visually re-proven in C2 and remains **SKIPPED**, not passed. R1 later qualified this sentence; the C2 gate already recorded the skip.

## 14. Cache and Session Separation

Authenticated `/home` and followed `/` responses: `private, no-cache, no-store, max-age=0, must-revalidate`. A separate headed context without this session still saw the public homepage (C7.8). Logged-out and authenticated trees are not shared as a public cache.

## 15. Logout or Context Cleanup

The operating-model attention screen has no logout control. Logout was **SKIPPED**. Owner should close the headed Preview tab. No Production logout.

## 16. Source-Only Lifecycle States

`src/app/page.tsx`: no user → `PublicHomepage`; user → `redirect(resolveAuthenticatedEntryPath)`. `login/page.tsx`: user → `resolvePostLoginDestination`. Matches observations. Incomplete operating-model lifecycle explains Home rewrite.

## 17. Runtime Logs

Candidate error stream empty for the successful sign-in window. `POST /login` info 200; authenticated `GET /home` 200; `GET /onboarding/operating-model` 200.

## 18. Production Non-Change

No `--prod`. No promote. www `/` still 307 `/login`. Newest Production listing was not replaced.

## 19. Findings Register

| ID | Finding |
| --- | --- |
| PW14-C2-FND-001 | Preview `NEXT_PUBLIC_SUPABASE_URL` with a `/rest/v1` path never reaches GoTrue (`Auth log: none`; generic copy). Origin-only Project URL is required. |
| PW14-C2-FND-002 | Distinct Preview-only URL records / in-place suffix edits require a **new** Preview; owner confirmation is not bake-in. |
| PW14-C2-FND-003 | Cursor headed tab contexts do not share Preview auth cookies; closing the sign-in tab loses headed session. |
| PW14-C2-FND-004 | This QA org’s operating-model attention state intercepts `/`, `/login`, and headed `/home` away from Today AppShell. Dual-use still holds. |
| PW14-C2-FND-005 | Production remains pre-PW-13 logged-out `/` → `/login`. C2 does not publish. |

## 20. Evidence Document

This section plus C2-C1 through C2-C7. Unstaged. Not committed.

## 21. File and Security Integrity

No secrets, tokens, emails, org UUIDs, or Supabase hostnames recorded. No `env pull` values retained. Temp classification files deleted. No product diff.

## 22. Remaining PW-14 Blockers

Production publication admission remains blocked: live `/` is still 307 `/login`; PW-13 is not on Production; NVDA/visitor/Production verification not started.

## 23. Gate Result

```text
PASS — PW-14-C2 AUTHENTICATED PREVIEW AND DUAL-USE ROOT ROUTING CLOSED WITH EVIDENCE
PREVIEW PASS ≠ PRODUCTION PASS
TODAY APPSHELL VISUAL CHECK SKIPPED (OPERATING-MODEL LIFECYCLE)
LOGOUT SKIPPED
DO NOT PROMOTE
PRODUCTION UNCHANGED
PW-14 REMAINS BLOCKED
```

## 24. Git State

Branch `core/platform-readiness-20260707` tracks origin, `0 0`. HEAD `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e`. Only `docs/phases/PW-14-public-homepage-publication-production-verification.md` modified, unstaged.

## 25. Commit/Push/Deploy Status

No commit. No push. No deploy. No promote.

End of PW-14-C2 evidence.

---

# PW-14-C2-R1 — Independent Authenticated Preview and Dual-Use Root Routing Review Evidence

| Field | Value |
| --- | --- |
| Phase | PW-14-C2-R1 |
| Date | 2026-09-17 |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Ahead / behind | `0 0` |
| Reviewer posture | Independent. C2 PASS treated as an unverified hypothesis until reconstructed. |
| Parent PW-14 | `BLOCKED — PW-14 PUBLICATION ADMISSION FAILED` / `DO NOT DEPLOY` |

C2-R1 PASS ≠ PW-14 closed. C2-R1 PASS ≠ publication ready. C2-R1 PASS ≠ Production verified. C2-R1 PASS ≠ Today AppShell verified.

## 1. Preflight

| Check | Result |
| --- | --- |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` tracking origin |
| Local HEAD | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Upstream SHA | same |
| Ahead / behind | `0 0` after `git fetch origin` |
| Staged files | none |
| Unstaged tracked files | this evidence document only |
| Untracked files | none |
| Exact changed-file set | `docs/phases/PW-14-public-homepage-publication-production-verification.md` |
| Product / test / config Git changes | none versus HEAD |
| Merge / rebase / cherry-pick / revert / bisect | none |
| Instruction files | no `AGENTS.md`, no `CONTRIBUTING.md`, no `.cursor/rules` |
| Vercel CLI | `56.3.1` |
| Authenticated Vercel identity | `guusvermolen-6030` |
| Accessible team | `guus-projects-ai` |
| Linked project | `zyntixai` |
| Retained Preview | same host token and deployment ID as C2-C7 / C2 header; `npx vercel inspect` → `name=zyntixai`, `target=preview`, `status=Ready`, created `2026-09-17 17:18:58 +02` |
| Newest Preview listing | the retained C2-C7 candidate (age ~33m at inspect) |
| Newest Production listing | unchanged 3-day Ready deployment; not the retained Preview |
| Current Production baseline | `2026-09-17T17:50:58+02:00`: www `/` 307 `/login`; `/login` 200; `/home` 307 `/login?next=%2Fhome`; apex 308 to www |

No drift stop-condition fired. R1 did not repair, deploy, promote, or authenticate.

## 2. Review independence

Every material C2 conclusion was reclassified as source, runtime, browser, configuration, or inference, then checked against current Git, current inspect/listing metadata, sanitized retained-Preview logs, logged-out Production headers, source, tests, and the preserved C2/C7 headed record.

R1 did not sign in, did not recreate a headed auth campaign, did not request another password, did not use Production authentication, and did not `vercel env pull`.

A leftover IDE-browser cookie from C2 caused one accidental authenticated navigation of retained Preview `/` during the attempted logged-out recheck. That tab was closed without logout, screenshot, HAR, storage dump, or further product clicks. It is not a new sign-in. It is recorded as a limitation and as independent confirmation that authenticated `/` still does not render the public homepage.

## 3. Authority review

Read and applied: B1-GATE.1; PW-0 through PW-13; the complete PW-14 evidence file including blocked admission, C1, C1-R1, C1-FV, C2-C1 through C2-C7, and the C2 authenticated appendix; dual-use root, login action, middleware, membership, onboarding, invitation, Home, AppShell, and public-web source and tests.

PW-1 remains the public-truth ceiling. PW-13 remains the implementation authority and does not authorize Production publication. Authenticated Home remains closed. SKIPPED ≠ PASSED. Preview ≠ Production.

## 4. Complete C2 incident-chain review

The evidence document preserves distinct failed candidates. Earlier hosts are not treated as the passing candidate.

| Stage | Documented class | Independent check |
| --- | --- | --- |
| 1. First Preview middleware failure | Missing Preview targeting for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; middleware invocation 500 | Source: `getPublicSupabaseEnv()` throws if the publishable key is absent. C2-C1 recovered on a **new** Preview. |
| 2–4. Dashboard-only Preview targeting; middleware recovered | Configuration, then runtime on the next Preview | No product code change. Production targeting was not removed in C2-C1. |
| 5–6. Authenticated login failure; DNS `ENOTFOUND` | Runtime class E on a dead Preview URL host | Distinct from later REST-path failure. Vercel error stream had `fetch failed` / `ENOTFOUND` before a Supabase HTTP status. |
| 7–8. Obsolete Preview URL; alignment attempt did not bake | Configuration + runtime still `ENOTFOUND` on C2-C2 | C2-C2 correctly refused to count that candidate as passed. |
| 9–11. Live DNS, generic copy, Auth log none | Path class `rest_v1_suffix`; Data API URL invalid as `createClient` base | Source concatenates `{url}/auth/v1/token`. A `/rest/v1` base cannot reach GoTrue. **No sanitized runtime line recording `POST /rest/v1/auth/v1/token` 404 exists in this file.** Absence of an Auth dashboard row is inference that GoTrue was not reached, not an observed 404. |
| 12–13. Origin-only Project URL; retained Preview created after that save | C2-C7.1 `bare_project_url`, then C7.2 deploy `17:18:48–17:20:37 +02` | Inspect created `17:18:58 +02` on the retained candidate. The superseded REST-suffixed Preview remains a separate listing and is not the C2 passer. |
| 14–15. Successful `POST /login` and authenticated routing | Runtime + headed browser on the retained candidate only | Wrong-host submits were recorded as not counted (C7.6). |

Confirmations:

- DNS `ENOTFOUND` and REST-prefixed miss are distinct failure classes.
- A Data API endpoint is not a valid `createClient` base.
- The Supabase client base must be the project origin only.
- The retained Preview was created after the origin-only correction.
- No application code change was required for either configuration defect.
- Production and Development URL rows were not modified in this phase (C2 historical + current Production listing/header baseline).

No material conflation that would treat a failed candidate as passed. A reconstructed Auth 404 on `/rest/v1/auth/v1/token` is stronger than the preserved evidence; R1 does not upgrade that inference into an observation.

## 5. Source-routing review

Read-only:

- Logged-out `/` is **not** a protected path. `src/app/page.tsx` returns `<PublicHomepage />` when `getUser()` has no user.
- Authenticated `/` calls `redirect(resolveAuthenticatedEntryPath(...))` with invitation cookies. That is the existing membership/onboarding/invitation resolver, not a hard-coded `/home`.
- `export const dynamic = "force-dynamic"` on root prevents a static public snapshot from being reused across logged-out and logged-in visitors.
- `PublicHomepage` takes no session, membership, or organization props; copy comes from frozen public-web constants; styles are `public-homepage.module.css` only.
- Authenticated `/login` is middleware-bounced to `/` (`user && isLogin` → `/`), then the root resolver runs. `login/page.tsx` also redirects via `resolvePostLoginDestination` if a user is present.
- `/home` is `isProtectedApplicationPath` via `isDailyOperatingHomePathname`. Logged-out visitors are sent to `/login?next=...`. Authenticated `/home` still runs `redirectIfOrganizationOnboardingIncomplete` through `loadDailyOperatingPage` → `resolveTaskPageOrganization`.
- `availableRoute === "operating_model"` → `buildOperatingModelOnboardingPath`. `/onboarding/operating-model` is itself protected.
- Reaching operating-model does **not** render Today AppShell. Home Today is `src/app/(authenticated)/home/page.tsx` + `AppShell`.
- Login uses `signInWithPassword` through `createSupabaseServerClient()` → `getPublicSupabaseEnv()` (URL + publishable key). Catch maps throws to generic copy. HTTP `POST /login` can be 200 on logical failure; session issuance is a separate fact.
- `NEXT_PUBLIC_SITE_URL` / `resolveSiteOrigin` is unused by password login.
- Service-role client is not referenced by middleware, login, or the public homepage.

## 6. Environment/configuration review

Names, targets, ages, and path-class metadata only. Values were not pulled or printed.

| Name | R1 metadata | Use |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | present, Preview-only, created-age ~2h | required `createClient` base; C7.1 classified origin-only **before** the retained deploy |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | present, Production+Preview, ~61d | required; no `ANON_KEY` substitute in source |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | leftover Preview name ~84d | unused by `getPublicSupabaseEnv()` |
| `NEXT_PUBLIC_SITE_URL` | not listed on Preview | unused by password login |
| Branch-specific override on this branch | none listed | none superseded the origin-only URL |
| Service-role name | exists on Preview as an unused-by-login name | not used by middleware/login/public homepage |

Inspect JSON still does not independently print `gitCommitSha` for this deploy format. Bake-in of `a8e359bc` remains deploy-command / C2-C7 metadata, not inspect-proven. Timing still supports “built after origin-only correction.”

R1 did not change Production or Development configuration.

## 7. Runtime-log review

Retained Preview only. Sanitized. No hostnames, query values, cookies, headers, tokens, or identifiers.

`--level error --since 3h`: no error rows.

JSON window (`--since 4h --limit 250`) independently re-read:

| Local time +02 | Method | Path | Status | Source | Note |
| --- | --- | --- | --- | --- | --- |
| 17:26:53 | GET | `/login` | 200 | serverless | logged-out Sign-in page still served after C7.8 context split |
| 17:28:16 | GET | `/login` | 307 | edge-middleware | authenticated bounce; not Sign in |
| 17:28:17 | GET | `/` | 307 | edge-middleware | authenticated root resolver redirect; not a 200 public homepage |
| 17:29:05 | POST | `/login` | 200 | edge-middleware | info; empty message; matches C2 later successful submit |
| 17:29:09–17:29:19 | GET | `/home` | 200 | edge-middleware | session present; not 307 `/login` |
| 17:29:16 | GET | `/onboarding/operating-model` | 200 | edge-middleware | lifecycle destination; query redacted |
| 17:30:49 / 17:32:06 | GET | `/login` | 307 | edge-middleware | still not remaining on Sign in |
| 17:46:51 | GET | `/` | 307 | edge-middleware | leftover-cookie R1 hit; still not public homepage |

Not present in this newest-250 window:

- C7.7 `POST /login` at 17:24:58 (older than the flooded later window; preserved in C7.7, not independently re-listed here)
- logged-out `GET /` 200 (public homepage). After session issuance, `GET /` is 307. Logged-out `/` 200 remains C7.4 browser evidence plus C2-C1-style force-dynamic headers on earlier recovered Previews.

Absent on the retained candidate in this window: `ENOTFOUND`, `/rest/v1/auth/v1/token`, middleware-invocation failure, HTTP 500, generic error-level login failure.

`OPTIONS /` 400 rows are CDP/CORS preflight, not login failures.

Authenticated `/` is represented by **307 to the resolver destination**, not by an explicit 200 root body.

## 8. Logged-out Preview review

Deployment Protection: unauthenticated `curl` of retained Preview `/` returns 302 to Vercel SSO (`Cache-Control: no-store`). That is platform SSO, not ZyntixAI login.

Headed logged-out recheck of `/` in this IDE browser was **not** possible: leftover C2 application cookies resolved `/` to protected onboarding. R1 did not sign in, did not log out, and did not store artifacts.

Preserved C7.4 on this same candidate, after Deployment Protection and before counted sign-in: frozen public H1; `/login` Sign in; logged-out `/home` → `/login?next=/home`. Independently re-read: `GET /login` 200 at 17:26:53 on the retained Preview.

Limitation: R1 did not newly screenshot or re-measure the Dutch H1. Same source HEAD; same Ready Preview.

## 9. Authenticated evidence review

| Claim | Evidence class | Independent result |
| --- | --- | --- |
| `POST /login` 200 | Runtime (re-read 17:29:05; preserved 17:24:58) | Confirmed. HTTP 200 alone does not prove routing. |
| Auth reached governed project | Inference from origin-only path class + session + no `ENOTFOUND`/generic error-level failure. No Auth dashboard success row. | Accepted as inference, not dashboard-observed. |
| Session issued | Runtime (`GET /home` 200 not login bounce) + C2 headed leave-`/login` | Confirmed. |
| Left `/login` | Runtime `GET /login` 307 + C2 headed | Confirmed. |
| Authenticated `/` not PublicHomepage | C2 headed (no frozen H1) + runtime `GET /` 307 + source Model A | Confirmed. |
| Resolver selected `/onboarding/operating-model` | C2 headed + runtime 200 on that path + source `operating_model` | Confirmed. Query values not recorded. |
| Authenticated `/login` not Sign in | Runtime 307 + C2 headed | Confirmed. |
| `/home` 200 then private/no-store | Runtime 200 (middleware allow) + **C2 headed Cache-Control observation** | Routing/protection confirmed. Header not independently re-read in R1. |
| No hard-coded `/home` shortcut | Source `resolveAuthenticatedEntryPath` / lifecycle | Confirmed. |
| Membership/onboarding/invitation assertions not weakened | Git: no source/test change versus C1-FV HEAD | Confirmed. |

## 10. Resolver and onboarding assessment

This QA organization is operating-model-bound (`v2_context_required` → `availableRoute: "operating_model"`). Root, login bounce, and product `/home` admission all converge on `/onboarding/operating-model` by existing helpers. That is a valid governed outcome, not a dual-use defect, and not proof of Today.

## 11. AppShell/visual-isolation disposition

| Check | Disposition |
| --- | --- |
| Today AppShell visually observed | **SKIPPED** — not observed |
| Home Today rendered in C2 | **SKIPPED** — org did not remain on `/home` |
| AppShell screenshot | none; none created in R1 |
| Public CSS vs actual Today AppShell | **SKIPPED / DEFERRED** — source/tests still lock the boundary (`public-homepage.test.tsx` isolation lock) |
| C2 wording | §13 qualified so CSS isolation is not a visual Today PASS |

This skip does not invalidate dual-use root routing. Later publication evidence must not convert it into PASS without executing Today.

## 12. Cache/session/privacy assessment

| Item | Class | Result |
| --- | --- | --- |
| Logged-out public page private data | Source + C7.4 | PublicHomepage has no private props. |
| Authenticated pages private | Source `force-dynamic` + C2 headers | Required. |
| Authenticated `/home` `private, no-cache, no-store` | C2 headed observation | Not independently re-read in R1 (P2). |
| Cross-user public cache | C7.8 logged-out context still saw public homepage; Production www `/` remains `private, no-cache, no-store` | No evidence of shared public cache of auth HTML. |
| Service-role on public page | Source | Not used. |
| Session cookie/token in evidence | File scan | None. |
| Authenticated HTML/screenshot persisted | Workspace scan | None. |
| Headed session closed | C2 asked to close tab; R1 found leftover cookies in the same IDE browser | Tab close ≠ cookie clear (P2). Tabs closed again in R1. No logout (no control; not requested). |
| Browser storage-state artifact | Glob | `playwright/.auth/production-owner.json` absent; no HAR/webm/mp4/trace |

## 13. Production non-change

Logged-out only. No Production auth. No `--prod`. No promote. No alias edit.

`2026-09-17T17:50:58+02:00`:

- www `/` 307 `/login`, `Cache-Control: private, no-cache, no-store`
- `/login` 200
- `/home` 307 `/login?next=%2Fhome`
- apex 308 to www

Newest Production deployment remains the pre-existing 3-day Ready row, not the retained Preview. Preview listing shows the C2 candidate as Preview, not Production.

PW-13 public homepage is still not live on Production.

## 14. Focused test results

Commands sequential where required. No snapshot update. No skip/retry/only/todo.

| Command | Exit | Result |
| --- | ---: | --- |
| `npm run test:run --` 16 focused files (auth actions/error mapping/entry UI/safe-return/middleware/landing; public homepage; onboarding routing/lifecycle/admission/enforcement/AppShell boundary; invitation continuation; AppShell terminology; product-access gating) | 0 | 16 files, **146 passed**, 0 failed, **0 skipped** |
| `npm run lint` | 0 | No ESLint warnings or errors |
| `npm run typecheck` | 0 | pass |
| `npm run build` | 0 | pass; pre-existing autoprefixer warning on operator social CSS unchanged and out of scope |
| `git diff --check` | 0 | pass (after documentary edit) |

Skipped is not passed. Full Vitest suite was **not** re-executed. Last complete suite remains C1-FV on this same source HEAD: 536 files / 4213 passed / 0 failed / 0 skipped. Source and test files remain byte-for-byte unchanged versus HEAD; that suite is **not** newly claimed as an R1 run.

## 15. Findings register

| ID | Severity | Evidence | Impact | Required correction | Owner/gate | Status |
| --- | --- | --- | --- | --- | --- | --- |
| PW14-C2-R1-FND-001 | P2 | C2 §13 originally said public CSS isolation “holds” while Today was unobserved | Could be misread as a visual AppShell PASS | Qualify §13; keep SKIPPED | Evidence | **Corrected in this document** |
| PW14-C2-R1-FND-002 | P2 | Inspect listing has no `gitCommitSha` field for this deploy format | Bake-in of HEAD is deploy-command metadata, not inspect-proven | None in R1; later FV may note the same | Evidence | Open limitation |
| PW14-C2-R1-FND-003 | P2 | No recorded `POST /rest/v1/auth/v1/token` 404 line | REST-prefix miss remains inferred from path class + Auth-log-none | Do not invent a 404 observation | Evidence | Documented |
| PW14-C2-R1-FND-004 | P2 | R1 headed logged-out `/` blocked by leftover cookies; curl hits SSO | Independent visual recheck of frozen H1 not repeated | None; use C7.4 on this candidate | Evidence | Open limitation |
| PW14-C2-R1-FND-005 | P2 | Authenticated `/home` Cache-Control not re-read in R1 | Header proof remains C2 headed | None in R1; do not invent | Evidence | Open limitation |
| PW14-C2-R1-FND-006 | P2 | No Auth dashboard success log for the passing window | Auth reach is inferred from session + origin-only + clean error stream | None | Evidence | Documented inference |
| PW14-C2-R1-FND-007 | P2 | Authenticated `GET /` appears as 307, not 200 | Root success is resolver redirect, not a public 200 | Record precisely | Evidence | Documented |
| PW14-C2-R1-FND-008 | P2 | C2-FND-003 “closing the sign-in tab loses headed session” overstates cookie-clear; same IDE profile reused the session | Logged-out recheck contaminated; tab close ≠ logout | Do not rewrite C2 history; record here | Evidence | Documented |
| PW14-C2-R1-FND-009 | P2 | Newest-250 log window omitted 17:24:58 `POST /login` and logged-out `GET /` 200 | Those facts remain in C7.4 / C7.7 | None | Evidence | Documented |
| PW14-C2-R1-FND-010 | P2 | NVDA, contrast, targets, visitor meaning, Production publication still open | C2 routing PASS is not PW-14 closure | Keep parent BLOCKED | PW-14 | Open |
| PW14-C2-R1-FND-011 | P2 | `OPTIONS /` 400 from CDP | Not a product login defect | Ignore as CORS preflight | Evidence | Documented |

No P0. No unresolved P1.

## 16. Corrections performed

Documentary only, inside this file:

- C2 §13 qualified so public-web CSS isolation is not a Today AppShell visual PASS.
- This R1 appendix added.

No historical C2 timestamps, candidate identities, or failure classes were rewritten. No product, test, or configuration change.

## 17. Remaining PW-14 blockers

Still open; C2/C2-R1 do not close them:

- NVDA + Chromium (`PW12-DEFER-010`)
- Measured rendered contrast (`PW12-DEFER-015`)
- Measured target sizes (`PW12-DEFER-016`)
- Visitor comprehension / access-meaning (`PW12-DEFER-020`, `PW12-DEFER-022`)
- Final publication admission
- Production deployment
- Public Production verification
- Authenticated Production verification
- Gated metadata / legal / favicon / canonical-host items per their authorities
- Authenticated Production browser bootstrap / storage still absent

Parent remains `BLOCKED — PW-14 PUBLICATION ADMISSION FAILED` / `DO NOT DEPLOY`.

## 18. File/security integrity

Only this evidence document changed during R1. No source, test, config, env file, dependency, or lockfile change. No browser storage-state, auth-state, trace, HAR, video, authenticated screenshot, generated test report, temp credential file, or running log stream left in the worktree. No secret, hostname, project reference, email, UUID, cookie, or token added by this appendix.

## 19. Gate result

```text
PASS — PW-14-C2-R1 INDEPENDENT AUTHENTICATED PREVIEW AND DUAL-USE ROOT ROUTING REVIEW CLOSED WITH EVIDENCE
PW-14-C2 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
PW-14 REMAINS BLOCKED — ACCESSIBILITY, VISITOR VALIDATION AND PRODUCTION VERIFICATION OUTSTANDING
DO NOT PROMOTE
PRODUCTION UNCHANGED
```

## 20. Git state

Branch `core/platform-readiness-20260707` tracks origin, `0 0`. HEAD `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e`. Only this evidence document modified, unstaged. Nothing staged.

## 21. Commit/push/deploy status

No stage. No commit. No push. No deploy. No redeploy. No promote. C2-FV not started.

End of PW-14-C2-R1 evidence.

---

# PW-14-C2-FV — Authenticated Preview Dual-Use Routing Final Verification Evidence

| Field | Value |
| --- | --- |
| Phase | PW-14-C2-FV |
| Date | 2026-09-17 |
| Branch | `core/platform-readiness-20260707` |
| Parent HEAD | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Authorized file | `docs/phases/PW-14-public-homepage-publication-production-verification.md` |
| Parent PW-14 | `BLOCKED — PW-14 PUBLICATION ADMISSION FAILED` / `DO NOT DEPLOY` |

C2-FV CLOSED ≠ PW-14 closed. C2-FV CLOSED ≠ publication ready. C2-FV CLOSED ≠ Production verified. C2-FV CLOSED ≠ Today AppShell verified. C2-FV CLOSED ≠ accessibility PASS.

## FV.1 Preflight

| Check | Result |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD before commit | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Upstream | same SHA after `git fetch origin` |
| Ahead / behind | `0 0` |
| Staged | none |
| Unstaged tracked | this evidence document only |
| Untracked | none |
| Product / test / config / lockfile | unchanged versus HEAD |
| Merge / rebase / cherry-pick / revert / bisect | none |
| Instruction files | none |
| Last commit | `test(platform): clear PW-14 regression blockers` parent `146c9ea19a9491a1b07389ac0281b8a13ed68541` |
| Vercel CLI | `56.3.1` identity `guusvermolen-6030` |
| Team / project | `guus-projects-ai` / `zyntixai` |
| Retained Preview | same C2-C7 host; `target=preview`; Ready; created `2026-09-17 17:18:58 +02` |
| Newest Production listing | unchanged 3-day Ready row; not the retained Preview |

No drift stop-condition fired.

## FV.2 Authority review

B1-GATE.1, PW-0–PW-13, original PW-14 blocked admission, C1 / C1-R1 / C1-FV, C2-C1 through C2-C7, C2 authenticated appendix, and C2-R1 were re-read. PW-1 remains the public-truth ceiling. PW-13 remains implementation authority and does not authorize Production publication. Authenticated Home remains closed.

## FV.3 Complete C2 history reconciliation

Historical states remain labelled as their original results:

1. Initial PW-14 publication admission **failed**; `DO NOT DEPLOY` remains the parent decision.
2. Full-suite blocker remediated in C1; C1-R1 agreed; C1-FV committed and pushed at `a8e359bc`.
3. PW-14 remained blocked after C1-FV.
4. First Preview middleware failed for missing Preview publishable-key targeting; targeting was added without exposing the value; middleware recovered on a **new** Preview.
5. Sign-in then failed. DNS `ENOTFOUND` and the REST-prefixed client-base miss are distinct classes. A Data API `/rest/v1` URL is not a valid `createClient` base. No 404 Auth log line was invented.
6. Final retained Preview used an origin-only Project URL and was created after that correction.
7. Authentication succeeded on that candidate only. Authenticated `/` did not render the public homepage. Authenticated `/login` did not remain on Sign in. `/home` remained protected. The QA organization resolved to `/onboarding/operating-model`.
8. Today AppShell remained **SKIPPED / DEFERRED**, not passed.
9. Production remained unchanged. PW-14 publication remained blocked.

No historical failed candidate was rewritten as successful.

## FV.4 C2 and R1 substantive reconciliation

| Claim | Class | FV result |
| --- | --- | --- |
| Logged-out `/` frozen Route A2 homepage | C7.4 browser on retained Preview | Confirmed; R1 headed recheck limited |
| Logged-out `/login` Sign in | C7.4 browser + R1 `GET /login` 200 | Confirmed |
| Logged-out `/home` → `/login?next=/home` | C7.4 browser | Confirmed |
| `POST /login` 200 | Runtime (17:29:05 re-read; 17:24:58 preserved) | Confirmed |
| Session issued | Runtime `/home` 200 + C2 headed | Confirmed |
| Authenticated `/` resolver redirect | Runtime `GET /` 307; not public body | Confirmed |
| Authenticated `/login` left Sign in | Runtime 307 + C2 headed | Confirmed |
| Authenticated `/home` 200 private/no-store | Runtime 200 + **C2 headed headers** | Confirmed; header not re-read in R1/FV |
| Resolver `/onboarding/operating-model` | Headed + runtime + source | Confirmed |
| No hard-coded `/home` shortcut | Source unchanged | Confirmed |
| Membership / onboarding / invitation intact | Focused tests 146/0/0 | Confirmed |
| No `ENOTFOUND` / REST-prefixed Auth / middleware 500 on final candidate | R1 logs | Confirmed |
| Today AppShell visual | SKIPPED | Still skipped |
| Public CSS isolation | Source/test lock, not visual Today PASS | Confirmed |
| Production unchanged / not promoted | FV logged-out headers + listing | Confirmed |

Observed versus inferred remains labelled. Preview ≠ Production. Authentication success ≠ complete PW-14 publication PASS. Skipped ≠ passed.

## FV.5 R1 findings reconciliation

P0 remaining: **0**. P1 remaining: **0**. P2 remaining: **11**.

| ID | FV disposition |
| --- | --- |
| FND-001 CSS/AppShell wording | Corrected; visual Today check **not** closed |
| FND-002 inspect `gitCommitSha` | Open limitation |
| FND-003 REST-prefix 404 not logged | Documented; not upgraded to observation |
| FND-004 logged-out headed recheck | Open limitation |
| FND-005 `/home` Cache-Control reread | Open limitation |
| FND-006 Auth reach inferred | Documented inference |
| FND-007 authenticated `GET /` is 307 | Documented |
| FND-008 tab close ≠ cookie-clear | Documented |
| FND-009 newest-log-window | Documented |
| FND-010 remaining publication blockers | **Open** |
| FND-011 CDP `OPTIONS /` 400 | Documented noise |

No P2 was silently marked resolved without evidence. AppShell visual limitation remains SKIPPED.

## FV.6 Security and privacy audit

Count-only scan of the evidence document: email-like 0; JWT-like 0; bearer 0; UUID-v4 0; Supabase project host 0; service-role values 0; password assignments 0; cookie header values 0; authorization headers 0. **PASS**.

## FV.7 File-integrity verification

No trailing whitespace. One terminating newline. No extra EOF blank line. 76 Markdown fences (balanced). No conflict markers. No leftover TODO/FIXME editing markers introduced by C2. Historical `BLOCKED` states remain historical. Current C2/R1/FV status is unambiguous. Parent PW-14 remains blocked. `git diff --check` passes.

## FV.8 Focused regression

Product source and tests remain byte-for-byte unchanged versus `a8e359bc`.

Exact R1 file list re-run:

`npm run test:run -- tests/auth/auth-actions.test.ts tests/auth/normalize-auth-error.test.ts tests/auth/entry-routing-and-login-ui.test.tsx tests/auth/safe-return-path.test.ts tests/auth/middleware-auth-redirects.test.ts tests/auth/resolve-authenticated-landing.test.ts tests/public-web/public-homepage.test.tsx tests/onboarding/product-admission-routing.test.ts tests/onboarding/onboarding-routing.test.ts tests/features/invitations/invite-registration-continuation-r1.test.ts tests/onboarding/onboarding-lifecycle.test.ts tests/onboarding/product-admission-enforcement.test.ts tests/onboarding/product-admission-app-shell.test.ts tests/security/onboarding-product-admission-boundary.test.ts tests/ui/appshell-customers-terminology.test.tsx tests/features/product-access/beta1-4tg-appshell-gating.test.ts`

Exit 0. 16 files. **146 passed**. 0 failed. **0 skipped**.

Full suite was **not** re-executed. C1-FV 536/4213/0/0 remains valid on the same source/test baseline.

## FV.9 Lint, typecheck, build

Run sequentially.

| Command | Exit |
| --- | ---: |
| `npm run lint` | 0 |
| `npm run typecheck` | 0 |
| `npm run build` | 0 |
| `git diff --check` | 0 |

Pre-existing autoprefixer warning on operator social CSS is unchanged and outside C2 scope.

## FV.10 Preview and Production safety

`2026-09-17T19:47:14+02:00` logged-out only. No application sign-in.

- Retained Preview: `target=preview`, Ready, not Production, not promoted.
- Newest Production listing remains the pre-existing 3-day Ready row.
- www `/` 307 `/login`, `private, no-cache, no-store`.
- `/login` 200.
- `/home` 307 `/login?next=%2Fhome`.
- apex 308 to www.
- No `--prod`, promote, or alias change in this phase.

Deployment Protection is not application authentication.

## FV.11 Deployment-trigger safety

Established Production workflow remains explicit CLI candidate then `vercel promote`, not git-push promotion. `vercel.json` is cron-empty. No GitHub Actions. No package deploy script. A normal push of this documentation commit is not Production promotion. If a non-Production Preview appears from the push, it must not be promoted and is not new C2 evidence.

## FV.12 Final AND-gate

All C2-FV conditions passed together: expected Git baseline; upstream unchanged; only this evidence document modified; C2 history reconciles; C2-R1 PASS present; P0=0; P1=0; eleven P2 transparent; dual-use routing supported on the retained Preview; Today AppShell skipped; no publication-readiness overclaim; Production unchanged; no promotion; focused tests; lint; typecheck; build; integrity; sensitive-data audit; PW-14 remains explicitly blocked.

## FV.13 Staging and commit plan

Stage exactly this file. One non-amended commit. Exact subject:

`docs(public-web): close PW-14-C2 preview routing evidence`

Expected parent: `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e`. Then `git push origin HEAD` without force.

## FV.14 Remaining PW-14 blockers

Unchanged and still open:

- NVDA + Chromium (`PW12-DEFER-010`)
- Measured contrast and target sizes (`PW12-DEFER-015`, `PW12-DEFER-016`)
- Visitor / access-meaning validation (`PW12-DEFER-020`, `PW12-DEFER-022`)
- Final publication admission
- Production deployment
- Public Production verification
- Authenticated Production verification
- Gated metadata / legal / favicon / canonical-host items
- Authenticated Production browser bootstrap / storage

```text
BLOCKED — PW-14 PUBLICATION ADMISSION FAILED
DO NOT DEPLOY
```

## FV.15 Explicit no-promote statement

This commit does not authorize Preview promotion, Production deployment, publication closure, accessibility PASS, WCAG conformance, visitor-validation PASS, or Production verification.

End of PW-14-C2-FV evidence.

---

# PW-14-C3 — Preview Accessibility and Rendered Measurement Evidence

| Field | Value |
| --- | --- |
| Phase | PW-14-C3 |
| Date | 2026-09-18 |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Application source baseline | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Parent PW-14 | `BLOCKED — PW-14 PUBLICATION ADMISSION FAILED` / `DO NOT DEPLOY` |
| C2 status | Closed with evidence; dual-use routing only |

C3 does not authorize publication, Production, visitor validation, WCAG certification, or Today AppShell accessibility.

## 1. Phase purpose and boundary

C3 was to validate the retained non-Production Preview logged-out public homepage with headed Chromium, actual NVDA, rendered measurements, and related public interaction states.

Mandatory headed public-page execution and actual NVDA did **not** complete. C3 is therefore **BLOCKED**. Source and local test evidence below is not converted into rendered or NVDA PASS.

## 2. Preflight

| Check | Result |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Upstream | same SHA after `git fetch origin` |
| Ahead / behind | `0 0` |
| Staged / untracked | none at preflight |
| Product/test/style diff vs Preview baseline `a8e359bc` | **none** (documentation-only child commit) |
| Git operations | none |
| Instruction files | none |
| Current commit | `docs(public-web): close PW-14-C2 preview routing evidence` parent `a8e359bc` |
| OS | Windows 11 Pro, NT 10.0.26200 |
| NVDA | **not found** (`nvda.exe` absent from Program Files, LocalAppData, Uninstall registry, PATH) |
| Headed Chromium | Cursor IDE browser available |
| Forced-colours | OS Contrast Themes **not** activated; CDP emulation available but not equivalent |
| Reduced-motion | CDP/emulation available; not executed on a logged-out public page |
| axe-core in lockfile | transitive `4.12.1`; no repo script; **not installed as a project tool** |

## 3. Authority review

B1-GATE.1, PW-0–PW-13, PW-14 blocked admission, C1/C1-R1/C1-FV, complete C2 chain, C2-R1, C2-FV, public homepage source/CSS, root layout, middleware, and `tests/public-web/public-homepage.test.tsx`.

PW-1 remains the public-truth ceiling. PW-13 remains implementation authority. PW-14-C2 proves Preview dual-use routing only. `PW12-DEFER-010`, `015`, and `016` remain publication blockers unless C3 executes them.

## 4. Retained Preview identity

| Property | Result | Class |
| --- | --- | --- |
| Host | same retained C2-C7 Preview | deployment metadata |
| Inspect | `name=zyntixai`, `target=preview`, Ready, created `2026-09-17 17:18:58 +02` | deployment metadata |
| Production listing newest | unchanged multi-day Ready row; not this Preview | deployment metadata |
| Promoted | no | deployment metadata |

Inspect still has no `gitCommitSha`. Application baseline remains the C2 deploy-command / C7 metadata for `a8e359bc`. Current HEAD differs from that baseline only by this evidence file’s C2 commit.

## 5. Source and test baseline

| Fact | Class | Result |
| --- | --- | --- |
| Logged-out `/` returns `<PublicHomepage />` | source | `src/app/page.tsx` |
| No session/membership/org props on PublicHomepage | source | component takes no props |
| Public CSS module-scoped; isolation tests lock AppShell/Home/login | source + test | 9/9 local tests passed |
| Skip link `Ga naar de hoofdinhoud` → `#hoofdinhoud` | source | present; `main` `tabIndex={-1}` |
| Compact nav is native `details`/`summary`, not a dialog | source | `role="dialog"` absent |
| `html lang="en"`; public wrapper `lang="nl"` | source | layout vs public-web |
| Focus `:focus-visible` 2px+2px teal; skip revealed on focus | source | CSS |
| `@media (forced-colors: active)` and `prefers-reduced-motion: reduce` | source | present |
| No `overflow-x: clip/hidden` on public CSS | test lock | PW-13 contract |
| `force-dynamic` on root | source + test | present |

Source correctness is **not** a rendered PASS.

## 6. Test environment

| Item | Record |
| --- | --- |
| Local timestamp | 2026-09-18 ~11:19 +02 |
| UTC | 2026-09-18 ~09:19Z |
| Chromium | Cursor IDE headed browser (version not independently printed) |
| NVDA | unavailable |
| Viewport / zoom / DPR / forced-colours / reduced-motion on public page | **not recorded** — public page not loaded logged-out |
| Input | aborted after authenticated landing |
| Preview classification | non-Production Ready |
| ZyntixAI session | leftover C2 cookies still present in this IDE browser; **not** a fresh logged-out context |
| Cookie/storage CDP | `Network.clearBrowserCookies` and `Storage.clearDataForOrigin` denied |
| Application sign-in | not performed |
| Tab disposition | authenticated landing left immediately via `about:blank`; tab closed |

Deployment Protection was already passable in this browser. That is not ZyntixAI login. Leftover **application** cookies made `/` resolve to authenticated onboarding. C3 did not inventory that private page.

Logged-out `/home` on Preview was **not** rechecked in a clean application context. Production logged-out `/home` still 307 `/login?next=%2Fhome` at `2026-09-18T11:19:54+02:00`.

## 7. Evidence-classification rules

Skipped ≠ passed. Automated ≠ NVDA. Source tokens ≠ rendered computed contrast. CSS min-height ≠ measured bounding box. Emulated forced-colours ≠ OS Contrast Themes. Accessibility-tree snapshots ≠ NVDA speech.

## 8. Rendered page inventory

**BLOCKED — LOGGED-OUT PUBLIC HOMEPAGE NOT RENDERED IN HEADED CHROMIUM**

Intended inventory from **source** (not headed observation):

| Item | Source value | Headed |
| --- | --- | --- |
| Title | layout `"ZyntixAI"` | not observed on public `/` |
| Document language | `html` en; wrapper nl | not observed |
| H1 | frozen Route A2 Dutch H1 | not observed |
| H2 count | 6 | not observed |
| Landmarks | header, `nav` named Navigatie, `main#hoofdinhoud`, footer | not observed |
| Skip | link, Dutch name | not observed |
| Disclosure | `details` initially closed in markup | not observed |
| Images / SVG / forms / live regions | none in PublicHomepage | N/A at source |
| Motion | skip `transform`; reduced-motion kills animation/transition | not observed |

## 9. Automated accessibility results

| Item | Result |
| --- | --- |
| axe / Lighthouse / pa11y on Preview | **SKIPPED — TOOL UNAVAILABLE** as a project script; no packages installed; transitive axe-core not invoked against the Preview |
| `npm run test:run -- tests/public-web/public-homepage.test.tsx` | exit 0; 1 file; **9 passed**; 0 failed; 0 skipped |
| Full Vitest suite | **not** re-executed; last complete run remains C1-FV 536/4213/0/0 on unchanged product/test HEAD |

Automated zero-run does not prove WCAG.

## 10. Keyboard and focus results

**BLOCKED — ACTUAL KEYBOARD SEQUENCE ON LOGGED-OUT PUBLIC PAGE NOT COMPLETED**

No Tab/Shift+Tab/Enter/Space/Escape sequence was recorded on the public homepage. No compact disclosure keyboard test. No focus-visibility screenshot or computed outline measurement.

## 11. Skip-link and structural navigation

**BLOCKED** as headed browser evidence.

Source: skip is first control, off-screen until `:focus`/`:focus-visible`, href `#hoofdinhoud`, `main` is tabbable. Hash-focus helper focuses `main` for skip and headings for other fragments. Not converted to PASS.

## 12. NVDA + Chromium results

```text
BLOCKED — ACTUAL NVDA + CHROMIUM EXECUTION NOT COMPLETED
```

NVDA was not running. Speech was not observed. An accessibility snapshot of an authenticated surface is not NVDA evidence and was not used as a public-page inventory.

Unresolved **P1**. Prevents C3 PASS.

## 13. Text contrast measurements

**Rendered computed-style measurement: NOT EXECUTED.**

Source-token arithmetic (sRGB relative luminance, WCAG 2.x formula). Class: **source evidence / inference**, not rendered PASS.

| Pair | Ratio | Large text? | AA 4.5:1 (normal) | Class |
| --- | ---: | --- | --- | --- |
| ink `#1A1916` on canvas `#F4F1EA` | 15.585 | H1 2rem/700 may qualify | source-only | source |
| secondary `#3F3C36` on canvas | 9.742 | support 1.125rem/400 is not large | source-only | source |
| muted `#5C574E` on canvas (footer) | 6.357 | 0.9375rem/600 not large | source-only | source |
| teal `#1F5C57` on canvas (body link) | 6.827 | no | source-only | source |
| teal on surface `#FFFFFF` | 7.701 | no | source-only | source |
| ink on today `#EBE6DC` | 14.135 | no | source-only | source |
| secondary on today | 8.836 | qualifier 0.9375rem/400 | source-only | source |
| teal-hover on canvas | 9.106 | no | source-only | source |

These numbers are **not** a C3 contrast PASS. Anti-aliasing, compositing, and actual computed backgrounds were not measured.

## 14. Non-text and focus-indicator measurements

**Rendered: NOT EXECUTED.**

Source: focus outline `2px solid #1F5C57` offset 2px. Teal vs canvas 6.827; teal vs surface 7.701 (both ≥ 3:1 as token arithmetic). Forced-colours outline uses `Highlight` in CSS. Header/footer borders are decorative at source; `#C9C2B4` on white is 1.771 and is **not** claimed as a required 1.4.11 boundary.

Not a focus-appearance PASS.

## 15. Target-size measurements

**Rendered bounding boxes: NOT EXECUTED.**

Source CSS: skip and nav/sign-in/disclosure controls `min-height: 2.75rem` (44px at 16px root); nav/sign-in/disclosure `min-width: 1.5rem` (24px at 16px root). Compact vs desktop states not measured. No exception path documented from geometry.

Not a target-size PASS.

## 16. 320 CSS-pixel results

**BLOCKED — NOT EXECUTED** on the retained Preview. Source has `@media (max-width: 24.375rem)` type scale and `@media (max-width: 45rem)` plus `@container` disclosure swap. Not rendered evidence.

## 17. 200% zoom results

**BLOCKED — NOT EXECUTED.**

## 18. Text-spacing results

**BLOCKED — NOT EXECUTED.** No temporary override was applied to the Preview. None remains.

## 19. Forced-colours results

Actual OS Contrast Themes: **not used**.

Emulation: **not applied** to a logged-out public page.

```text
EMULATED FORCED-COLOURS EVIDENCE
```

was **not** produced. Source `@media (forced-colors: active)` exists (Today `CanvasText` border, underlined links, `Highlight` focus). C3 requires actual OS testing where the contract demands it. Unavailable actual OS test is unresolved **P1**.

## 20. Reduced-motion results

**BLOCKED — NOT EXECUTED** as rendered.

Source: `@media (prefers-reduced-motion: reduce)` sets `animation`, `transition`, and `scroll-behavior` to none on `.publicWeb *`. Skip uses `transform` without a declared transition. No carousel or auto-moving content in source. Rendered confirmation missing, so not `NOT APPLICABLE` as a headed result.

## 21. Responsive state matrix

| State | Result |
| --- | --- |
| Desktop default | BLOCKED — public page not loaded logged-out |
| Desktop 200% zoom | BLOCKED |
| 320 CSS pixels | BLOCKED |
| Mobile navigation closed | BLOCKED |
| Mobile navigation open | BLOCKED |
| Text-spacing override | BLOCKED |
| Forced colours | BLOCKED |
| Reduced motion | BLOCKED |

Skipped/blocked is not passed.

## 22. Error, status, and dynamic-content review

| Feature | Presence (source) | Headed |
| --- | --- | --- |
| Forms / validation | absent | N/A |
| Live counters / carousels / auto-update | absent | N/A |
| Expandable region | compact `details` nav | not tested |
| Loading states | none dedicated | N/A |
| Hash-focus client helper | present | not tested |

Absent features: **NOT APPLICABLE**. Disclosure: **BLOCKED**.

## 23. Privacy and isolation review

| Check | Result |
| --- | --- |
| Intended C3 surface | logged-out public homepage — **not reached** |
| Application sign-in | not performed |
| Leftover C2 cookies | present in IDE browser; caused authenticated `/` bounce |
| Private page inventory | **not** recorded; no org/query values copied into this appendix |
| Authenticated HTML/screenshot/HAR/trace/video/storage-state | none added to the repo |
| Production | unchanged (see §2 Production headers) |
| Temporary a11y scripts / packages | none retained |
| Chat-only C2-FV-C1 wording issue | **not** added here |

## 24. Findings register

| ID | Sev | Affected check | Class | Observation | Impact | Follow-up | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| PW14-C3-FND-001 | P1 | NVDA + Chromium | environment | NVDA not installed; speech not observed | Mandatory C3 check missing | Complete actual NVDA + headed Chromium on logged-out public `/` | C3 | **Open** |
| PW14-C3-FND-002 | P1 | Logged-out headed Preview | browser | `/` in IDE browser reused leftover application cookies; cookie-clear CDP denied | Public homepage keyboard, skip, inventory, measurements blocked | Fresh logged-out context (no app session) on retained Preview | C3 | **Open** |
| PW14-C3-FND-003 | P1 | Keyboard / focus / skip | browser | Not executed on public page | Mandatory C3 checks missing | Execute after FND-002 | C3 | **Open** |
| PW14-C3-FND-004 | P1 | Rendered contrast, non-text, targets | measurement | Not executed | `PW12-DEFER-015`/`016` still open | Measure computed colours and boxes on Preview | C3 | **Open** |
| PW14-C3-FND-005 | P1 | 320 / 200% / text-spacing | browser | Not executed | Reflow unproven | Execute on logged-out public `/` | C3 | **Open** |
| PW14-C3-FND-006 | P1 | Forced-colours | environment | OS Contrast Themes not used; emulation not run on public page | Required C3 forced-colours missing | Actual OS mode on logged-out public `/` | C3 | **Open** |
| PW14-C3-FND-007 | P1 | Reduced-motion | browser | Not executed on public page | Motion adaptation unproven | `prefers-reduced-motion: reduce` on Preview | C3 | **Open** |
| PW14-C3-FND-008 | P2 | Automated scan | tool | No project axe/Lighthouse command; none run | Coverage gap only if manual complete | Optional later | C3 | Open |
| PW14-C3-FND-009 | P2 | `html lang` vs wrapper `lang=nl` | source | Root layout English; public wrapper Dutch | AT page-language unproven without NVDA | Observe in NVDA session | C3 | Open |
| PW14-C3-FND-010 | P2 | C4 visitor validation | scope | Not in C3 | Publication still blocked | PW-14-C4 | PW-14 | Open |
| PW14-C3-FND-011 | P2 | Production verification | scope | Production still pre-PW-13 `/` → `/login` | Not a C3 substitute | Later Production phases | PW-14 | Open |

P0 remaining: **0**. P1 remaining: **7**. P2 remaining: **4**.

No product defect was proven on the public page because the page was not tested headed logged-out. No product code was changed.

## 25. C3 AND-gate

Failed. Missing: logged-out public load in headed Chromium; NVDA; keyboard; skip; rendered semantics observation; rendered contrast; non-text/focus contrast; target-size measurement; 320; 200% zoom; text-spacing; forced-colours; reduced-motion headed result; complete responsive matrix.

## 26. Remaining PW-14 blockers

- Complete the missing C3 manual validation (NVDA, logged-out headed measurements) before C3-R1
- PW-14-C3 independent review (not started)
- PW-14-C3 final verification and evidence commit (not authorized while C3 is BLOCKED)
- PW-14-C4 visitor comprehension / access-meaning
- Final publication admission
- Production deployment authorization
- Public and authenticated Production verification
- Gated metadata / legal / favicon / canonical-host items
- `PW12-DEFER-010`, `015`, `016` remain open

Parent remains `BLOCKED — PW-14 PUBLICATION ADMISSION FAILED` / `DO NOT DEPLOY`.

## 27. File and security integrity

Only this evidence document is modified in C3. No source, test, style, config, env, dependency, lockfile, screenshot, HAR, trace, video, or storage-state change. No org UUID, cookie, token, or credential recorded.

## 28. Git state

HEAD remains `2daff99f5f8336dc4a455484ec3ced413a834f8d`. Upstream same. `0 0`. This file unstaged after C3 recording. Nothing staged.

## 29. Commit, push, deploy, and promotion status

No stage. No commit. No push. No Preview created. No promote. No `--prod`. No Vercel/Supabase settings change.

## 30. Gate result

```text
BLOCKED — PW-14-C3 PREVIEW ACCESSIBILITY AND RENDERED MEASUREMENT EVIDENCE FAILED
PW-14 REMAINS BLOCKED
DO NOT COMMIT
DO NOT PROMOTE
PRODUCTION UNCHANGED
```

## 31. Next authorized step

The missing manual validation must be completed before C3-R1: actual NVDA + headed Chromium on a **logged-out** retained Preview public homepage, plus rendered measurements, 320/200%/text-spacing, actual OS forced-colours, and reduced-motion. Do not start C3-R1, C3-FV, C4, publication, or Production verification from this BLOCKED result.

End of PW-14-C3 evidence.

# PW-14-C3-C1 — Logged-Out Accessibility Evidence Recovery and Completion

| Field | Value |
| --- | --- |
| Phase | PW-14-C3-C1 |
| Date | 2026-09-18 |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Application source baseline | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Retained Preview | `https://zyntixai-ecbqshegd-guus-projects-ai.vercel.app` (`dpl_CPp7EasM3VWQXFUP7AWV4qcnQefQ`, target Preview, Ready, created 2026-09-17 17:18:58 +02) |
| Parent C3 | Historical **BLOCKED** — not rewritten |

C3-C1 is evidence recovery and completion only. It does not authorize product remediation, publication, Production, visitor validation, WCAG certification, or Today AppShell accessibility.

## 1. Purpose and recovery boundary

Recover a clean logged-out headed Chromium context on the retained non-Production Preview, execute the mandatory C3 checks that were missing, reconcile the seven initial C3 P1s, and record actual results. The initial C3 BLOCKED appendix remains historical fact. Product code, tests, styles, configuration, dependencies, lockfiles, and environment variables were not modified.

## 2. Preflight and drift check

Performed read-only after `git fetch origin` at C3-C1 resume.

| Check | Result |
| --- | --- |
| Root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Ahead / behind | `0 0` |
| Staged | none |
| Unstaged tracked | this evidence document only (initial C3 appendix, then this C3-C1 appendix) |
| Untracked | none |
| Git operations | none (no merge/rebase/cherry-pick/revert/bisect) |
| Instruction files | none (`AGENTS.md`, `CONTRIBUTING.md`, `.cursor/rules` absent) |
| Current commit | `docs(public-web): close PW-14-C2 preview routing evidence`; parent `a8e359bc` |
| Product/test/style diff vs `a8e359bc` | none |
| Retained Preview | Ready, target Preview, identity unchanged |
| Production listing | unchanged older Ready Production row; not this Preview |
| NVDA (resume) | running; product 2026.2 |
| Headed Chromium | Google Chrome 152.0.7977.84 |
| Windows | 11 Pro 25H2, 10.0.26200.9457 |
| Contrast Themes baseline | high-contrast bit **off** (flags 126) |
| Animation baseline | `MinAnimate=1`; `prefers-reduced-motion` false |

No drift stop condition applied.

## 3. Initial C3 evidence preservation

The initial C3 appendix remains in this file above this section. It still records: contaminated IDE-browser cookies; authenticated onboarding landing; no public-page inventory; NVDA absent at that time; blocked keyboard/skip/contrast/target/reflow/spacing/forced-colours/reduced-motion; seven P1s; four P2s; no code change; no deployment. Gate text remains `BLOCKED — PW-14-C3 PREVIEW ACCESSIBILITY AND RENDERED MEASUREMENT EVIDENCE FAILED`. That appendix was not deleted or rewritten.

## 4. NVDA prerequisite

Owner provided official NVDA after the C3-C1 pause. Observed at resume:

| Item | Result |
| --- | --- |
| Running processes | NVDA 2026.2 launcher plus `nvda_noUIAccess` |
| Product version | 2026.2 (file 2026.2.0.57664) |
| Synth | OneCore |
| Speech Viewer | Owner stated it was open; this session **did not enumerate** a Speech Viewer / Spraakweergavevenster window |
| Extra-menu attempt | Opened `NVDA logboek lezer` (log viewer); closed it; subsequent Extra toggle did not produce a Speech Viewer window |

NVDA was therefore available to run with headed Chromium. Full Speech Viewer announcement capture was **not** obtained. Accessibility-tree, DOM, and NVDA log language warnings are supporting evidence only and do not replace Speech Viewer summaries.

## 5. Clean logged-out browser establishment

The contaminated IDE browser profile was not reused.

| Step | Result |
| --- | --- |
| Profile | New directory `%TEMP%\pw14-c3-c1-chromium` (OS temp; not the repository; not the default Chrome profile) |
| Launch | Headed Chrome 152.0.7977.84, `--remote-debugging-port=9333`, no imported cookies/history/passwords |
| First document | Vercel Deployment Protection → GitHub SSO interstitial (not ZyntixAI `/login`) |
| Owner-assisted DP | Permitted; completed in this isolated window |
| Landing after DP | Retained Preview `/`, title `ZyntixAI`, Dutch H1 visible |
| ZyntixAI `/login` form | Not used; no application credentials entered |

The earlier C3 authenticated-onboarding landing remains classified as leftover application cookies in the IDE profile, not as a product defect.

## 6. Application-auth isolation proof

Counts only. No cookie names, values, tokens, headers, or storage keys are recorded.

| Check | Count / result |
| --- | --- |
| Application-auth cookies | **0** |
| Other cookies (Deployment Protection / host chrome) | 33 present; not treated as application authentication |
| `localStorage` auth entries | **0** (total keys 0, then 2 non-auth after later reloads) |
| `sessionStorage` auth entries | **0** (non-auth keys present) |
| Observed `Authorization` headers intentionally created | **0** |
| `/` | Public homepage; H1 `Houd zicht op klanten, werk en voortgang.` |
| `/home` (same isolated profile) | Redirected to `/login` with `next` length 13 (`?next=/home`); login H1 `Sign in`; form not filled; returned to `/` |
| Private / onboarding content | **none** |
| Vercel Preview chrome | Custom `VERCEL-LIVE-FEEDBACK` element appeared in tab order; treated as environment, not product |

## 7. Test environment

Frozen after the clean public homepage was confirmed. Browser not updated during testing. Same retained Preview throughout. Production not used for accessibility.

| Item | Value |
| --- | --- |
| Local | 2026-09-18, session ~11:58–12:19 +02 |
| UTC | 2026-09-18 ~09:58–10:19 Z |
| Windows | 11 Pro 25H2 (10.0.26200.9457) |
| Chromium | Chrome 152.0.7977.84 |
| NVDA | 2026.2 |
| Speech Viewer used | **No** (window not enumerable) |
| Baseline viewport | 1280×805 CSS px (also 1264×805 content inner before metrics override) |
| Device-pixel ratio | 1 |
| Browser zoom | 100% after restore (`outer/inner` ~100–113% depending on window chrome) |
| Colour scheme | light (except during forced-colours test: dark) |
| Forced-colours baseline | inactive |
| Reduced-motion baseline | false |
| Input | keyboard + headed mouse for disclosure targeting only where CDP default-activation needed a focused control |
| Preview | non-Production, Ready, `ecbqshegd` |
| Application-auth | absent (counts above) |

## 8. Rendered public-page inventory

Class: **rendered browser observation** unless noted. Supporting accessibility tree is labelled separately. Source is not converted into rendered PASS.

| Item | Rendered observation |
| --- | --- |
| Document title | `ZyntixAI` |
| Document language | `html lang="en"` |
| Public wrapper | `div lang="nl"` (one `lang="nl"` node; parent `BODY`) |
| Visible H1 | `Houd zicht op klanten, werk en voortgang.` (one H1) |
| Heading hierarchy | H1 then six H2: Over ZyntixAI; Hoe het werkt; Today als voorbeeld in het product; Als je opleidingen of coaching geeft; Hoe toegang in het product werkt; Toegang |
| Landmarks | `header`; `nav` name `Navigatie`; `main#hoofdinhoud`; `footer` |
| Skip | `Ga naar de hoofdinhoud` → `#hoofdinhoud`; off-screen until focus (`translateY` ≈ −88 px; box 205×44) |
| Keyboard-order controls (desktop) | skip; wordmark; Over ZyntixAI; Hoe het werkt; Gesloten bèta; header Inloggen; access Inloggen; then Preview chrome |
| Compact disclosure | native `details`/`summary` name `Navigatie`; hidden at 1280; visible at 320 and at CSS 200% zoom |
| Footer | text `ZyntixAI`; no footer links |
| Images / SVG | **NOT APPLICABLE** (none) |
| Forms | **NOT APPLICABLE** (none on the public homepage) |
| Live regions | **NOT APPLICABLE** for product (no `aria-live`; empty `alert` node in AX tree belonged to Preview chrome) |
| Motion | `document.getAnimations()` length **0** |
| Sticky / fixed | none |
| AX tree (supporting) | title `ZyntixAI`; skip link; banner; navigation `Navigatie`; main; contentinfo; H1/H2 names as above; `button` `Vercel Toolbar` (environment) |

## 9. Document-language assessment

| Question | Result | Class |
| --- | --- | --- |
| Language exposed for the document | `html lang="en"` | rendered + source |
| Language exposed for main public content | wrapper `lang="nl"` | rendered + source |
| NVDA language behaviour | OneCore synth `nl_nl`; repeated log warning `Language en not supported ({'nl_nl'})` while the headed public page was the focused Chrome document | **actual NVDA engine**, not Speech Viewer |
| Title / landmarks / headings / body announcements | **Not captured** (Speech Viewer absent) | gap |
| Default human language programmatically accurate? | **No.** Default page language is English; visible public copy is Dutch | rendered + WCAG 2.2 3.1.1-oriented / PW8-LANG-001 |
| Is the wrapper sufficient under project authority? | **Not as Model A.** PW-8 froze Model A (public document `lang="nl"`) and rejected Model C (Dutch clusters inside an English document) as the preferred final solution because AT may still treat the page as English. PW-13 kept shared root `en` plus wrapper `nl` as isolation. C3-C1 observed NVDA attempting English language changes against a Dutch voice | assessment |
| Initial P2 FND-009 | **Escalated to P1** product finding `PW14-C3-C1-FND-001` | see register |

No WCAG-conformance claim is made. This is not auto-failed from source alone; NVDA engine warnings were observed on the live Preview.

## 10. Keyboard validation

NVDA remained running. Focusable native Tab order was observed via headed CDP key events (`rawKeyDown`/`char` required for `summary` activation). Desktop and compact states both executed.

Desktop (1280 CSS px), product controls:

1. Skip `Ga naar de hoofdinhoud`
2. Link `ZyntixAI` (`/`)
3. Link `Over ZyntixAI`
4. Link `Hoe het werkt`
5. Link `Gesloten bèta`
6. Link `Inloggen` (header)
7. Link `Inloggen` (access sentence)

Hidden compact `summary` and its closed panel links **did not** receive focus at desktop. No pointer-only product function. No hover-only essential information. After skip activation, next product Tab was the access `Inloggen` (header repetition bypassed). Shift+Tab from the wordmark returned to the skip link. Escape does not close native `details` (no enhanced overlay). Environment `VERCEL-LIVE-FEEDBACK` also sits in the tab cycle; not a product control.

Compact 320 CSS px, disclosure **closed**: skip → wordmark → `Navigatie` → header `Inloggen` → access `Inloggen`. Closed panel links not in order.

Compact 320, disclosure **open** (Space opens, Enter closes while focused on `summary`): `Navigatie` → `Over ZyntixAI` → `Hoe het werkt` → `Gesloten bèta` → header `Inloggen` → access `Inloggen`. No keyboard trap. Cycle returned to skip then wordmark then `Navigatie`.

## 11. Focus validation

Keyboard-focused product controls showed `outline: solid 2px rgb(31, 92, 87)` (`#1F5C57`) with `outline-offset: 2px`. Focus was not obscured. Programmatic `.focus()` without a user key is **not** treated as `:focus-visible` evidence. Skip on keyboard/scripted focus that matches `:focus` became visible (transform identity; in-view). Main `#hoofdinhoud` after skip activation: outline teal, `top: 0`, not obscured.

## 12. Skip-link validation

| Check | Result |
| --- | --- |
| Visible on focus | Yes |
| Accessible name | `Ga naar de hoofdinhoud` |
| Activation | Enter moved focus to `main#hoofdinhoud`; hash `#hoofdinhoud` |
| Target effective focus | `activeId=hoofdinhoud`; outline visible |
| Target not obscured | Yes |
| Subsequent Tab | Access `Inloggen` (repeated header nav bypassed) |
| Shift+Tab | Wordmark → skip |

## 13. NVDA + Chromium validation

| # | Check | Result |
| --- | --- | --- |
| 1 | Page title announcement | **NOT CAPTURED** (no Speech Viewer text) |
| 2 | Document and content language | Engine: Dutch OneCore; English language-change commands rejected (`en` vs `nl_nl`). Speech of title/body **not captured** |
| 3 | Landmark navigation | **NOT CAPTURED** as speech; AX tree has banner / navigation `Navigatie` / main / contentinfo |
| 4 | Heading navigation | **NOT CAPTURED** as speech; AX headings match rendered H1/H2 |
| 5 | Reading order | **NOT CAPTURED** as speech; DOM/reading order is skip, header, main sections, footer |
| 6 | Links list | **NOT CAPTURED** as speech |
| 7 | Button names | Product has no `button`; disclosure is native `summary` `Navigatie`. Speech **not captured** |
| 8–9 | Disclosure name/role/state | Keyboard proved open/close; NVDA state-change speech **not captured** |
| 10–12 | Skip discovery / activation / focus | Browser skip PASS; NVDA speech **not captured** |
| 13–15 | Compact nav / hidden / decorative | Compact keyboard PASS; speech **not captured**. No product images |
| 16–17 | Duplicate / unlabelled | Two `Inloggen` links (header + access) with the same name and destination; not unlabelled. Speech **not captured** |
| 18 | Public/private isolation | Rendered public homepage only; no private content |

NVDA+Chromium **ran**. Mandatory Speech Viewer announcement summaries were **not** obtained. Initial P1 FND-001 therefore remains open on the speech-observation limb.

## 14. Rendered text-contrast measurements

WCAG 2.x AA floors: normal 4.5:1; large 3:1. Ratios are computed from rendered `getComputedStyle` sRGB relative luminance. Unique meaningful product combinations (least-favourable opaque ancestor background):

| Component | State | Foreground | Background | Size / weight | Large? | Ratio | Floor | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| H1 | default | `#1A1916` | `#F4F1EA` | 32px / 700 | yes | 15.585 | 3 | PASS |
| H2 on canvas | default | `#1A1916` | `#F4F1EA` | 22px / 600 | no | 15.585 | 4.5 | PASS |
| H2 on Today band | default | `#1A1916` | `#EBE6DC` | 22px / 600 | no | 14.135 | 4.5 | PASS |
| H2 on access panel | default | `#1A1916` | `#FFFFFF` | 22px / 600 | no | 17.580 | 4.5 | PASS |
| Support / secondary | default | `#3F3C36` | `#F4F1EA` | 18px / 400 | no | 9.742 | 4.5 | PASS |
| Body ink | default | `#1A1916` | `#F4F1EA` | 16px / 400 | no | 15.585 | 4.5 | PASS |
| Qualifier on Today | default | `#3F3C36` | `#EBE6DC` | 15px / 400 | no | 8.836 | 4.5 | PASS |
| Footer muted | default | `#5C574E` | `#F4F1EA` | 15px / 600 | no | 6.357 | 4.5 | PASS |
| Wordmark | default | `#1A1916` | `#FFFFFF` | 20px / 700 | yes | 17.580 | 3 | PASS |
| Nav links | default | `#1A1916` | `#FFFFFF` | 15px / 600 | no | 17.580 | 4.5 | PASS |
| Header Inloggen | default | `#1F5C57` | `#FFFFFF` | 15px / 600 | no | 7.701 | 4.5 | PASS |
| Access Inloggen | default | `#1F5C57` | `#FFFFFF` | 16px / 400 | no | 7.701 | 4.5 | PASS |
| Skip (when shown) | default | `#1A1916` | `#FFFFFF` | 16px / 600 | no | 17.580 | 4.5 | PASS |
| Wordmark | hover | `#1A1916` | `#FFFFFF` | 20px / 700 | yes | 17.580 | 3 | PASS |
| Nav link | hover | `#1A1916` | `#FFFFFF` | 15px / 600 | no | 17.580 | 4.5 | PASS |
| Header Inloggen | hover | `#174843` | `#FFFFFF` | 15px / 600 | no | 10.272 | 4.5 | PASS |
| Header Inloggen | active | `#123833` | `#FFFFFF` | 15px / 600 | no | 12.811 | 4.5 | PASS |
| Access Inloggen | hover | `#174843` | `#FFFFFF` | 16px / 400 | no | 10.272 | 4.5 | PASS |

Root `body` computed colour `#0F172A` on `#F8FAFC` (17.063) is application chrome behind the public wrapper, not public-copy measurement. No text-over-image. Gradients: none on measured text.

## 15. Non-text and focus-indicator measurements

| Component | State | Indicator | Adjacent | Ratio | Floor | Exception | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Skip / links / summary (keyboard) | `:focus-visible` | `#1F5C57` 2px solid | `#FFFFFF` header | 7.701 | 3 | — | PASS |
| Same outline | `:focus-visible` | `#1F5C57` | `#F4F1EA` canvas | 6.827 | 3 | — | PASS |
| Access panel edge | default | `#8A8376` | `#FFFFFF` | 3.758 | 3 | identifies the access cluster | PASS |
| Header rule | default | `#C9C2B4` | `#FFFFFF` | 1.771 | 3 | decorative separator; not a control | **NOT APPLICABLE** |
| Today band vs canvas | default | `#EBE6DC` | page canvas | ~1.19 | 3 | decorative band; not a control | **NOT APPLICABLE** |
| Skip under OS forced colours | focus | Highlight 2px (`rgb(142, 227, 240)` observed) | Canvas | system | 3 | OS Highlight | PASS (perceivable) |

JS `.focus()` without a key previously reported `outline: none` and must not be used as a fail. Keyboard Tab is the focus-appearance evidence.

## 16. Target-size measurements

WCAG 2.2 AA 2.5.8: 24×24 CSS px or a valid exception. Product 44px preference is not treated as the AA floor.

Desktop 1264×805 (visible product targets):

| Name | Box (CSS px) | 24×24 | Spacing | Result |
| --- | --- | --- | --- | --- |
| Skip | 205.48×44 | yes | 44 to wordmark | PASS |
| Wordmark | 103.42×48 | yes | 44 | PASS |
| Over ZyntixAI | 100.58×44 | yes | 16 to neighbour | PASS |
| Hoe het werkt | 104.31×44 | yes | 16 | PASS |
| Gesloten bèta | 102.22×44 | yes | 16 | PASS |
| Header Inloggen | 68.81×44 | yes | 16 | PASS |
| Access Inloggen | 62.83×21 | **no** | inline in a sentence | PASS — **2.5.8 inline/block-of-text exception** |

320 CSS px compact closed:

| Name | Box | Result |
| --- | --- | --- |
| Skip | 205.48×44 | PASS |
| Wordmark | 103.42×48 | PASS |
| Navigatie | 77.38×44 | PASS |
| Header Inloggen | 72.86×44 | PASS |
| Access Inloggen | 62.83×21 | PASS — same inline exception |

320 compact **open** exploration links: 106.8×44, 110.7×44, 108.5×44 — PASS.

## 17. 320 CSS-pixel results

Viewport forced to 320×700, DPR 1, zoom 1.

Closed: `scrollWidth` 305–320; no unintended horizontal overflow; no clipped text; no overlapping product blocks; H1 visible; two Inloggen controls visible; disclosure visible and operable; footer visible; skip usable on focus.

Open: same overflow result; three exploration links visible (44 px tall); Tab order complete; no off-screen product control; no obscured keyboard focus on product targets.

## 18. 200% zoom results

Chrome UI zoom keystrokes (`Ctrl++` / `Ctrl+0`) did not reliably change `innerWidth` from this agent while device metrics had been used. **Executed separately** from the 320 test using CSS `document.documentElement.style.zoom = "2"` on a 1280×805 CSS-pixel viewport (same method class as PW-13 zoom equivalent), then removed.

At 200% CSS zoom: layout reflowed to compact (`Navigatie` visible); H1 remained; two Inloggen controls remained; no `overflowingX`; no clipped product text; skip focus box 411×88, in-view, teal outline; Tab moved to wordmark then `Navigatie`. Function not lost. Zoom restored to `1`.

This is labelled CSS zoom, not Chrome settings-zoom UI. It is not inferred from the 320-width run.

## 19. Text-spacing results

Temporary injected style (not repository source): line-height 1.5; paragraph margin-bottom 2em; letter-spacing 0.12em; word-spacing 0.16em. Then removed.

Under the override at 1280×805: no horizontal overflow; no clipped text; H1 readable; two Inloggen controls present; footer visible; skip still focusable (box widened to 255×44 from letter-spacing). No lost control label. Style element removed after the check.

## 20. Actual Windows forced-colours results

| Item | Result |
| --- | --- |
| Baseline | flags 126, high-contrast **off** |
| Theme used | Actual OS high contrast; SPI enable; Windows reported scheme `Zwart - hoog contrast` (High Contrast Black); flags 127 |
| Chromium | `forced-colors: active` **true**; `prefers-color-scheme: dark` |
| Text | White CanvasText on dark Canvas; H1 still the Dutch public heading |
| Links | Link-coloured (`rgb(117, 233, 252)`) **and underlined** |
| Focus | Skip showed 2px Highlight outline under forced colours |
| Buttons / disclosure | Native `summary` present (compact hidden at 1280); links remain identifiable |
| Access / Today | Forced-colours CSS borders 2px / 1px `CanvasText`; content remains visible |
| Custom backgrounds | Brand fills replaced by Canvas; did not hide text |
| Restoration | flags 126, high-contrast **off**; Chrome `forced-colors` **false**; light scheme |

User-assisted SPI activation. DevTools emulation was **not** used as the forced-colours evidence.

## 21. Reduced-motion results

Source: public stylesheet sets `animation/transition/scroll-behavior` none under `prefers-reduced-motion: reduce`. Rendered: `document.getAnimations()` length 0 in the default state (no product animation running). Skip uses a transform snap without an observed animation. Disclosure open/close is instant.

Method: **labelled Chromium emulation** `Emulation.setEmulatedMedia` `prefers-reduced-motion: reduce` (project authority allows OS or clearly labelled emulation). `matchMedia` became true. Skip activation still moved focus to `#hoofdinhoud` with visible outline; no information disappeared; no flashing introduced. Emulation cleared afterward; `prefers-reduced-motion` false.

Meaningful motion: none observed. Result: **NOT APPLICABLE** for motion removal, with source + rendered + emulated-preference execution recorded. Not skipped.

## 22. Responsive state matrix

| State | Viewport | Zoom | Preference | Browser | Keyboard | NVDA | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Desktop default | 1280×805 | 100% | default | inventory + contrast + targets | full product order; skip; focus visible | speech not captured | PASS (browser/keyboard); NVDA speech **BLOCKED** |
| Desktop with NVDA | same | 100% | default | NVDA process attached to Chrome | Tab order as above | engine language warnings only | **BLOCKED** (speech) |
| Compact nav closed | 320×700 | 100% | default | disclosure visible, panel hidden | skip → wordmark → Navigatie → Inloggen | speech not captured | PASS (browser/keyboard) |
| Compact nav open | 320×700 | 100% | default | three links visible; no overflow | Space/Enter toggle; Tab through links | speech not captured | PASS (browser/keyboard) |
| 320 CSS pixels | 320×700 | 100% | default | no unintended x-scroll | operable | speech not captured | PASS (browser/keyboard) |
| 200% zoom | 1280×805 | CSS 200% | default | compact reflow; no x-scroll | skip + nav operable | speech not captured | PASS (browser/keyboard; CSS zoom method) |
| Text-spacing override | 1280×805 | 100% | injected 1.4.12 | no clip/overflow | skip usable | n/a | PASS |
| Actual Windows forced colours | 1280×805 | 100% | OS HC Black | text/links/focus/borders perceivable | skip Tab continued | n/a | PASS |
| Reduced motion | 1280×805 | 100% | emulated reduce | no running animations | skip still understandable | n/a | NOT APPLICABLE (no meaningful motion) with execution |

Skipped is not passed. NVDA speech rows remain blocked.

## 23. Automated and local test evidence

Automated accessibility package: **SKIPPED — TOOL UNAVAILABLE** (no project axe/Lighthouse command; none installed). Remains P2 because this gap does not replace the incomplete NVDA speech matrix.

Local command:

```text
npx vitest run tests/public-web/public-homepage.test.tsx
```

Result: 9 passed, 0 failed, 0 skipped. Exit code 0. Duration 825 ms. Snapshots not updated. Tests not edited. Full suite not re-executed.

## 24. Initial P1 reconciliation

| Original ID | Original | New evidence | Class | Current | Disposition |
| --- | --- | --- | --- | --- | --- |
| PW14-C3-FND-001 | P1 Open — NVDA unavailable | NVDA 2026.2 ran with headed Chrome; Speech Viewer not enumerable; announcement summaries missing | environment / incomplete AT capture | **Open P1** | Not resolved |
| PW14-C3-FND-002 | P1 Open — no clean logged-out context | Isolated temp Chrome profile; app-auth cookie/storage counts 0; Dutch H1; `/home` logged-out bounce | browser | **Resolved** | Environment recovery |
| PW14-C3-FND-003 | P1 Open — keyboard/skip missing | Desktop + compact keyboard, skip, focus visibility executed | browser | **Resolved** | — |
| PW14-C3-FND-004 | P1 Open — contrast/targets missing | Rendered text, non-text/focus, and target boxes measured | measurement | **Resolved** | — |
| PW14-C3-FND-005 | P1 Open — 320 / 200% / spacing missing | All three executed | browser | **Resolved** | — |
| PW14-C3-FND-006 | P1 Open — OS forced-colours missing | Actual `Zwart - hoog contrast`; Chrome `forced-colors: active`; restored | environment | **Resolved** | — |
| PW14-C3-FND-007 | P1 Open — reduced-motion missing | Source + rendered + labelled emulation | browser | **Resolved** (N/A for motion, executed) | — |

## 25. P2 reconciliation

| Original ID | Original | Reassessment | Current |
| --- | --- | --- | --- |
| PW14-C3-FND-008 | Automated scan unavailable | Still no project tool | Open P2 |
| PW14-C3-FND-009 | Root `en` vs wrapper `nl` | NVDA engine English language-change vs Dutch voice; 3.1.1 default language mismatch | **Escalated to P1** as `PW14-C3-C1-FND-001` |
| PW14-C3-FND-010 | C4 visitor validation | Out of C3-C1 scope | Open P2 |
| PW14-C3-FND-011 | Production verification | Production still `/` → `/login`; not tested for accessibility | Open P2 |

## 26. Updated findings register

| ID | Sev | Area | Evidence class | Finding | Gate effect | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW14-C3-FND-001 | P1 | NVDA speech | environment | NVDA runs, but Speech Viewer announcements were not observed | Blocks C3-C1 | C3-C1 / owner Speech Viewer | **Open** |
| PW14-C3-C1-FND-001 | P1 | Language of page | NVDA engine + rendered | Document default `lang="en"`; Dutch public content; wrapper `lang="nl"`; OneCore `Language en not supported ({'nl_nl'})` | Blocks C3-C1 as product finding; do not fix in C3-C1 | Separate remediation authority | **Open** |
| PW14-C3-FND-002 | P1 | Logged-out context | browser | — | — | C3-C1 | **Resolved** |
| PW14-C3-FND-003 | P1 | Keyboard / skip | browser | — | — | C3-C1 | **Resolved** |
| PW14-C3-FND-004 | P1 | Contrast / targets | measurement | — | — | C3-C1 | **Resolved** |
| PW14-C3-FND-005 | P1 | 320 / 200% / spacing | browser | — | — | C3-C1 | **Resolved** |
| PW14-C3-FND-006 | P1 | Forced-colours | environment | — | — | C3-C1 | **Resolved** |
| PW14-C3-FND-007 | P1 | Reduced-motion | browser | — | — | C3-C1 | **Resolved** |
| PW14-C3-FND-008 | P2 | Automated scan | tool | Unavailable | Non-blocking if manual complete; manual NVDA speech still open | later | Open |
| PW14-C3-FND-009 | P2→P1 | Language | see C3-C1-FND-001 | Escalated | — | — | **Superseded by C3-C1-FND-001** |
| PW14-C3-FND-010 | P2 | C4 | scope | Outstanding | Blocks PW-14, not closable here | PW-14-C4 | Open |
| PW14-C3-FND-011 | P2 | Production | scope | Outstanding | Blocks PW-14 | later Production phases | Open |

P0 remaining: **0**. P1 remaining: **2**. P2 remaining: **3**.

## 27. C3-C1 AND-gate

| Condition | Met? |
| --- | --- |
| Expected Git state | Yes |
| Initial C3 evidence preserved | Yes |
| Retained Preview identity | Yes |
| Clean logged-out application state | Yes |
| Public homepage rendered | Yes |
| No private content | Yes |
| Actual NVDA + Chromium **speech** testing completed | **No** |
| Keyboard / focus / skip | Yes |
| Rendered structure / names | Yes |
| Language explicitly assessed | Yes (product P1 opened) |
| Rendered text contrast | Yes |
| Non-text / focus contrast | Yes |
| Target sizes / exceptions | Yes |
| 320 / 200% / text-spacing | Yes |
| Actual OS forced-colours | Yes |
| Reduced-motion executed or N/A | Yes |
| State matrix complete (no silent skip) | Yes, with NVDA speech blocked |
| Every initial P1 reconciled | Yes (audit trail; two remain open) |
| No P0 | Yes |
| No unresolved P1 | **No** |
| P2 transparent | Yes |
| No code/test change | Yes |
| Production unchanged | Yes |
| No Preview created / no promote | Yes |
| No WCAG-conformance claim | Yes |

AND-gate **fails**.

## 28. Remaining PW-14 blockers

Publication admission, visitor validation (C4), Production verification, and independent C3 review remain outstanding. C3-C1 itself remains BLOCKED on NVDA speech capture and the language-of-page product finding. Today AppShell accessibility remains out of scope. Authenticated Home remains closed.

## 29. Privacy and security integrity

No credentials, cookie values, tokens, Authorization headers, environment values, Supabase identifiers, email addresses, UUIDs, private authenticated content, full Speech Viewer transcripts, or private query values were written. Deployment Protection was not weakened. Application login was not used.

## 30. File integrity

Only this evidence document is intended to change. No source, test, style, config, env, dependency, lockfile, report, binary, or browser profile was added to the repository.

## 31. Git state

HEAD `2daff99f5f8336dc4a455484ec3ced413a834f8d`. Upstream same. Ahead/behind `0 0`. Nothing staged. Unstaged: this file only. Untracked: none. No conflicting Git operation.

## 32. Commit, push, deploy, and promotion status

No stage. No commit. No push. No Preview created. No promote. No `--prod`. No Vercel or Supabase settings change. No aliases changed.

## 33. Gate result

```text
BLOCKED — PW-14-C3-C1 LOGGED-OUT ACCESSIBILITY EVIDENCE RECOVERY AND COMPLETION FAILED
PW-14 REMAINS BLOCKED
DO NOT COMMIT
DO NOT PROMOTE
PRODUCTION UNCHANGED
```

The initial C3 BLOCKED result remains a historical fact. C3-C1 recovered logged-out headed measurements and closed five of seven original environment P1s, but did not close C3. This does not close PW-14. C3 is not ready for independent review.

## 34. Next authorized step

1. Complete actual NVDA Speech Viewer announcement capture on the same clean logged-out retained Preview (resume this C3-C1 phase once the Speech Viewer window is visible to the tester).
2. A separately authorized targeted C3 remediation would be required for `PW14-C3-C1-FND-001` (document language). Do not fix it inside C3-C1.

Do not start PW-14-C3-R1, C3-FV, C4, publication admission, or Production verification from this BLOCKED result.

End of PW-14-C3-C1 evidence.

# PW-14-C3-C2 — Document Language Remediation and Accessibility Evidence Correction

| Field | Value |
| --- | --- |
| Phase | PW-14-C3-C2 |
| Date | 2026-09-18 |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD (unchanged) | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Parent | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Commit subject | `docs(public-web): close PW-14-C2 preview routing evidence` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Ahead/behind | `0 0` |
| Staging | none |
| Commit / push / deploy / Preview / promote | none |

## 1. Purpose and phase boundary

C3-C2 is a targeted product-remediation and documentary-correction phase. It:

1. implements the smallest safe server-rendered document-language architecture for WCAG 2.2 SC 3.1.1;
2. adds regression tests for that architecture;
3. corrects the current accessibility findings reconciliation from two open P1s to three open P1s;
4. preserves the historical PW-14-C3 and PW-14-C3-C1 appendices;
5. runs complete local verification.

C3-C2 does **not** execute final NVDA Speech Viewer validation. C3-C2 does **not** execute actual 200% browser/user-agent zoom. Those checks require a new Preview after this remediation is independently reviewed, committed, and pushed. C3-C2 does not create a Preview, does not authenticate to ZyntixAI, and does not authorize publication.

C3-C2 local PASS is not PW-14-C3 PASS and is not a WCAG-conformance claim.

## 2. Preflight and drift verification

Read-only preflight, then `git fetch origin`. After fetch:

| Check | Result |
| --- | --- |
| Repository root | matches the authorized worktree |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Upstream SHA | identical |
| Ahead/behind | `0 0` |
| Staged files | none |
| Entry unstaged tracked file | `docs/phases/PW-14-public-homepage-publication-production-verification.md` only |
| Entry untracked files | none |
| Merge / rebase / cherry-pick / revert / bisect | none (`MERGE_HEAD`, `REBASE_HEAD`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, `BISECT_LOG` absent) |
| Instruction files | no project `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules` |
| Existing evidence diff | C3 BLOCKED appendix and C3-C1 BLOCKED recovery appendix present; not reset, stashed, rewritten, or normalized |
| Retained Preview | non-Production; Deployment Protection SSO still present; no C3-C2 deployment created |
| Production | unchanged logged-out pre-PW-13 `/` → `/login` |

No conflicting Git operation was active. Drift-repair was not required and was not performed.

## 3. Authority review

Applied: B1-GATE.1 (100% required gates; this subphase is local remediation + evidence correction, not parent C3 closure); PW-0 through PW-13; the complete PW-14 evidence chain including C1 / C1-R1 / C1-FV and C2 / C2-R1 / C2-FV; the initial C3 BLOCKED appendix; C3-C1; PW-8 Language Model A (`PW8-LANG-001` / `PW8-OD-002`); WCAG 2.2 SC 3.1.1, SC 1.4.4, and SC 1.4.10.

PW-1 remains the public-truth ceiling. PW-13 remains the public-homepage implementation authority. PW-14-C2 remains routing evidence only. C3-C2 does not authorize publication.

PW-8 frozen Language Model A: the public homepage document language must be Dutch; English authenticated surfaces and `/login` keep English. Model B (global root `lang="nl"`) and Model C (Dutch clusters inside an English document as the final remedy) remain rejected. A Dutch wrapper inside an English `<html lang="en">` is not accepted as the final remedy.

## 4. Historical C3 / C3-C1 preservation

The initial C3 appendix and the later C3-C1 appendix remain above this section and were not rewritten. They continue to record:

- contaminated IDE-browser cookies sending headed `/` to authenticated onboarding;
- initial missing logged-out evidence;
- initial seven P1 findings;
- later clean isolated-browser recovery and application-auth isolation;
- completed keyboard, focus, skip-link, contrast, target, 320 CSS-pixel, text-spacing, forced-colours, and reduced-motion checks;
- incomplete NVDA Speech Viewer announcement capture;
- the language finding (`html lang="en"` vs predominantly Dutch public copy);
- CSS `zoom: 2` labelled as CSS zoom in the C3-C1 narrative;
- no product code change during C3 / C3-C1;
- no commit, push, deployment, or promotion.

C3-C1’s historical findings register still shows P1 remaining **2**. That register is left as a historical snapshot. The current three-P1 correction is recorded only in this C3-C2 appendix as an evidence-classification correction, not as a claim that the earlier report was dishonest.

## 5. Route-language inventory

Inspected before implementation: logged-out `/`, `/login`, public homepage source, authenticated root resolver, onboarding headings, `/home` / Today / AppShell, invitation accept, organization-selection via `/home`, register and recovery forms, onboarding error fallback, Home loading, and the default Next.js not-found document. No `next-intl` / `i18next` document-locale stack exists. Organization `default_locale` fields are private product data and were **not** used for `<html lang>`.

| Route or class | Rendered state | Predominant visible language | Inherited `<html lang>` before C3-C2 | Nested `lang` | Expected document language | Evidence source | HTML or redirect |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Logged-out `/` | PublicHomepage | Dutch | `en` | wrapper `lang="nl"` | `nl` | C3-C1 Preview + source + local `next start` | HTML 200 |
| Authenticated `/` | `resolveAuthenticatedEntryPath` | n/a (no page body) | n/a | n/a | n/a for the redirect response; destination page owns language | `src/app/page.tsx`; entry-routing tests | Redirect only |
| `/login` | Sign-in form | English (`Sign in`, `Email`, `Password`) | `en` | none | `en` | source + local `next start` | HTML 200 |
| Public homepage fragment | same as logged-out `/` | Dutch | inherited from root | wrapper `nl` | document `nl` (wrapper may remain) | `public-homepage.tsx` | HTML via `/` |
| `/home` logged-out | n/a | n/a | n/a | n/a | destination `/login` is `en` | middleware tests + local 307 | Redirect |
| `/home` authenticated | Today / AppShell | English (`Today`, `Skip to main content`) | `en` | none | `en` | Home / AppShell source | HTML when admitted |
| Onboarding HTML | operating-model, team, ready, creating, errors | English | `en` | none | `en` | onboarding headings (`How does your business operate?`, `Setup needs attention`) | HTML when admitted |
| `/onboarding` logged-out | n/a | n/a | n/a | n/a | destination `/login` is `en` | local 307 | Redirect |
| `/invite/accept` | invitation continuation / unavailable | English (`Invitation unavailable`, `Sign in`) | `en` | none | `en` | source + local `next start` | HTML 200 (no token) |
| `/register` | create-account form when rendered | English (`Create your account`) | `en` | none | `en` | register form source | HTML when enabled; local production server followed existing registration-disabled redirect to `/login?registration=disabled` |
| `/forgot-password` | reset form | English (`Reset password`) | `en` | none | `en` | source + local `next start` | HTML 200 |
| `/reset-password` | choose-password / expired | English | `en` | none | `en` | reset-password form source | HTML |
| Organization selection | `/home` membership states | English (`Organization required`) | `en` | none | `en` | Home page source | HTML when admitted |
| Default not-found | Next.js 404 | English (`404`, `This page could not be found.`) | `en` | none | `en` | local `GET /this-path-does-not-exist` | HTML 404 |
| Home loading | AppShell pending | English (`Today`) | `en` | none | `en` | `home/loading.tsx` | HTML when loading |
| Metadata | title / description | English (`ZyntixAI`, `ZyntixAI application foundation`) | n/a | n/a | unchanged | root `metadata` + local HTML `<title>` | present on HTML pages |

Not every application route is Dutch. Global `<html lang="nl">` would mislabel `/login`, AppShell, onboarding, invitations, register, recovery, and the default 404.

## 6. Architecture assessment

Evaluated:

- **Option A — Global Dutch root language.** Rejected. Inventory proves English HTML pages inherit the same root layout.
- **Option B — Language-specific route groups with separate root layouts.** Rejected for C3-C2. Dual-use `/` cannot gain a second root layout without URL or auth-tree migration. Authenticated `/` is redirect-only, but `/login` and the rest of the app would still need a broad restructure to isolate `html`. Risk exceeds the smallest safe change.
- **Option C — Governed server-side route-language resolution.** Accepted. Pathname-only allowlisted resolver; middleware overwrites any client-supplied internal language header; root layout is an async Server Component that reads the trusted header before render.
- **Option D — Other framework mechanism.** Nested layouts cannot change the root `<html>` element. Client `document.documentElement.lang` mutation is prohibited. Query, cookie, `Accept-Language`, and organization locale negotiation were rejected.

No broad route-tree migration was required. Implementation continued.

## 7. Selected design and rejected alternatives

Selected: Option C, pathname-only.

`/` → `nl`. Every other pathname → `en`. Query, hash, trailing slashes, `Accept-Language`, cookies, and client `x-document-language` do not control the value. Invalid or missing parsed values fall back to allowlisted `en`. Authenticated `/` remains redirect-only and does not emit the Dutch public document.

Why correct: it implements PW-8 Model A without announcing English product chrome as Dutch, and it puts the language on the server-rendered `<html>` element before JavaScript runs.

Why smallest: one helper module, root layout `lang={lang}`, and reuse of the existing middleware `NextResponse.next({ request: { headers } })` path. No route-group move, no auth rewrite, no copy change.

Rejected alternatives: Option A, Option B, Model C wrapper-only, client `useEffect` patching, `Accept-Language` personalization, cookie-controlled language, query `?lang=`, and organization `default_locale`.

Impact:

| Surface | Impact |
| --- | --- |
| Public `/` | Initial HTML `<html lang="nl">`; wrapper `lang="nl"` retained; copy unchanged |
| `/login` | Remains `<html lang="en">` |
| Authenticated routes | Remain `en` when they render HTML; redirects unchanged |
| Middleware | Request-header overwrite only; redirect branches unchanged |
| Caching | `/` already `force-dynamic`; build remains all-dynamic `ƒ`; public responses stay `private, no-store`; language header is not a client cache key |
| Metadata | Unchanged title and description |
| Hydration | Server `lang` matches RSC payload `{"lang":"nl"}` / `{"lang":"en"}`; no client patch |
| Route transitions | Language follows the destination pathname on the next server render |

## 8. Acceptance contract

Established before editing:

1. Logged-out public `/` initial HTML is Dutch on `<html lang>`.
2. Predominant language is on the `<html>` element.
3. No post-hydration correction.
4. JavaScript-disabled initial HTML remains correct.
5. `/login` is English.
6. Other rendered classes keep English.
7. Redirect-only root behaviour unchanged.
8. Authenticated root routing unchanged.
9. `/home` protection unchanged.
10. Membership, onboarding, invitation, and organization-selection behaviour unchanged.
11. PublicHomepage still receives no private props.
12. Public CSS isolation unchanged.
13. No caching or cross-user privacy regression.
14. No arbitrary client-controlled language value reaches `<html lang>`.
15. Only allowlisted `en` \| `nl` are emitted.
16. Existing metadata remains correct.
17. No hydration mismatch.
18. Historical accessibility findings remain historically accurate.
19. Current findings corrected to three open P1s.
20. Actual NVDA and actual 200% browser zoom remain outstanding.

## 9. Implementation

Source changes:

- `src/lib/i18n/document-language.ts` — allowlist, pathname resolver, header overwrite, `nextWithTrustedDocumentLanguage`.
- `src/app/layout.tsx` — async Server Component; `headers()` + `parseDocumentLanguage`; `<html lang={lang}>`.
- `src/lib/supabase/middleware.ts` — both previous `NextResponse.next({ request })` sites now call `nextWithTrustedDocumentLanguage(request)`. Redirect responses are unchanged.

Not changed: public copy, public CSS, `src/app/page.tsx`, `/login` UI, AppShell, onboarding, invitations, metadata strings, `src/middleware.ts` matcher, dependencies, lockfile, Vercel, Supabase, environment files.

The public wrapper `lang="nl"` remains as a nested language mark. It is no longer the only language signal and is not treated as the final 3.1.1 remedy.

No `useEffect` or `document.documentElement.lang` mutation was added.

## 10. Security and privacy review

- Client-supplied `x-document-language` is deleted and overwritten from the pathname before the layout reads headers.
- Accepted values are exactly `en` and `nl`.
- Invalid / missing parsed values fall back to `en`.
- Query `?lang=en` on `/` still yields document `nl`.
- Path, query, cookie, email, organization, membership, and session values are not written into `<html lang>` or into public HTML.
- PublicHomepage still receives no private props (`src/app/page.tsx` unchanged).
- Logged-out `/home` and `/onboarding` still 307 to `/login`.
- No service-role key is used.
- No environment value is exposed in HTML.
- The internal header is a request-overwrite (`x-middleware-request-x-document-language`). Local HTML responses did not echo `x-document-language` to the client.
- Cache-Control for public HTML remains `private, no-cache, no-store, max-age=0, must-revalidate`.
- Organization locale / membership data are not a language input.
- Negative tests cover spoofed `en` on `/`, spoofed `nl` on `/login`, spoofed `fr` on `/home` (still 307), and invalid parse fallback.

## 11. Test additions

New:

- `tests/lib/i18n/document-language.test.ts` — pathname matrix, query stripping, allowlist, overwrite, spoof resistance.
- `tests/app/root-document-language.test.tsx` — server-rendered root markup for `nl`, `en`, and invalid/missing fallback.

Strengthened:

- `tests/public-web/public-homepage.test.tsx` — isolation lock now requires the resolver + `<html lang={lang}>` and forbids hardcoded root `lang`, `useEffect`, and `document.documentElement` in the root layout; wrapper `lang="nl"` remains on the fragment and is not treated as a substitute for the document root.
- `tests/auth/middleware-auth-redirects.test.ts` — logged-out `/` forwards `nl`; spoof overwrite; `/home` protection preserved.
- `tests/auth/entry-routing-and-login-ui.test.tsx` — public fragment has wrapper `lang="nl"` but not `<html>`; login fragment has `Sign in` and not `<html>`.

No snapshots updated. No skips, todo, only, quarantine, or retries.

## 12. Focused regression results

Language / public / middleware / login:

```text
npx vitest run tests/lib/i18n/document-language.test.ts tests/app/root-document-language.test.tsx tests/public-web/public-homepage.test.tsx tests/auth/middleware-auth-redirects.test.ts tests/auth/entry-routing-and-login-ui.test.tsx
```

Exit code 0. Test files 5 passed. Tests 45 passed. Failed 0. Skipped 0.

Routing / `/home` / AppShell / onboarding / invitation / safe-return:

```text
npx vitest run tests/auth/safe-return-path.test.ts tests/auth/public-registration.test.ts tests/features/daily-operating/load-daily-operating-page.test.ts tests/onboarding/onboarding-routing.test.ts tests/onboarding/product-admission-routing.test.ts tests/features/invitations/load-member-administration-page.test.ts tests/ui/appshell-customers-terminology.test.tsx tests/onboarding/product-admission-app-shell.test.ts
```

Exit code 0. Test files 8 passed. Tests 117 passed. Failed 0. Skipped 0.

Skipped is not passed. Evidence scope: document language, public homepage isolation, logged-out root, authenticated root resolver, `/login`, middleware, safe return, membership/onboarding/invitation routing, `/home` protection, public/AppShell boundary.

## 13. Full-suite result

```text
npx vitest run
```

Exit code 0. Test files **538** passed. Tests **4225** passed. Failed **0**. Skipped **0**. Duration 53.40s.

Previous baseline was 536 files / 4213 tests. The increase is the two new test files plus one new middleware example; existing assertions were not weakened.

## 14. Lint result

```text
npm run lint
```

Exit code 0. `No ESLint warnings or errors`.

## 15. Typecheck result

```text
npm run typecheck
```

Exit code 0 (`tsc --noEmit`). Not run concurrently with build.

## 16. Build result

```text
npm run build
```

Exit code 0. Next.js 15.5.20. Routes remain `ƒ` dynamic. Pre-existing autoprefixer warning in social-beta operator CSS is unchanged and unrelated. No new static generation of `/`.

## 17. Static initial-HTML verification

Local production server: `npx next start -H 127.0.0.1 -p 4314` against the C3-C2 build. Bound to loopback only. Stopped before phase completion (listener PID terminated; subsequent fetch failed closed). No browser profile, trace, video, or HAR was saved.

| Request | Status | `<html lang>` | Visible H1 / note |
| --- | --- | --- | --- |
| `GET /` | 200 | `nl` | Dutch public H1; wrapper `lang="nl"` also present |
| `GET /?lang=en` | 200 | `nl` | Query does not switch language |
| `GET /` + `x-document-language: fr` | 200 | `nl` | Spoof ignored |
| `GET /` + `x-document-language: en` | 200 | `nl` | Spoof ignored |
| `GET /login` | 200 | `en` | `Sign in` |
| `GET /login` + `x-document-language: nl` | 200 | `en` | Spoof ignored |
| `GET /home` | 307 | n/a (no HTML document) | `Location` `/login?next=%2Fhome` |
| `GET /forgot-password` | 200 | `en` | `Reset password` |
| `GET /register` | 307 | n/a | Existing registration-disabled redirect to `/login?registration=disabled` |
| `GET /invite/accept` | 200 | `en` | `Invitation unavailable`; no invitation identifier in the recorded summary |
| `GET /onboarding` | 307 | n/a | `/login?next=%2Fonboarding` |
| `GET /this-path-does-not-exist` | 404 | `en` | Default Next.js 404 |

Initial `/` bytes begin `<!DOCTYPE html><html lang="nl">`. Initial `/login` bytes begin `<!DOCTYPE html><html lang="en">`. Language is present before any client script executes. Curl is JavaScript-disabled; disabling JavaScript is not required to correct the language. RSC payload repeats `{"lang":"nl"}` for `/` and `{"lang":"en"}` for `/login`. No `documentElement.lang` patch. No hydration warning text. No private-content leak markers in the recorded public HTML. Metadata title remains `ZyntixAI`. Public `/` Cache-Control remains `private, no-store`. Client responses did not include `x-document-language`.

This is local production-mode HTML, not Preview evidence and not Production evidence.

## 18. Three-P1 evidence correction

C3-C1 current-entry remainder of **P1 remaining: 2** is a historical snapshot and is not rewritten. Corrected **current** entry state for C3-C2:

- P0 remaining: **0**
- P1 remaining: **3**
- P2 remaining: **3**

The three open P1 findings are:

1. Actual NVDA Speech Viewer announcements were not captured.
2. The public page’s default document language was incorrect (now locally remediated; Preview verification outstanding).
3. Actual 200% browser/user-agent zoom was not executed.

The third P1 is recorded as: actual 200% browser/user-agent zoom was not executed; temporary CSS `zoom: 2` was supporting layout evidence only and did not resolve the browser-zoom requirement.

## 19. Zoom / reflow finding reconciliation

Original combined C3 finding `PW14-C3-FND-005` covered 320 CSS pixels, 200% zoom, and text-spacing. C3-C1 executed 320, text-spacing, and a CSS `zoom: 2` layout observation, then marked the combined finding resolved.

This C3-C2 correction reclassifies that combined finding as **only partially resolved**:

| Limb | Evidence | Current |
| --- | --- | --- |
| 320 CSS-pixel reflow (SC 1.4.10) | C3-C1 executed | Resolved by executed evidence |
| text-spacing (SC 1.4.12) | C3-C1 executed | Resolved by executed evidence |
| CSS `zoom: 2` layout observation | C3-C1 supporting evidence | Completed as supporting evidence only |
| Actual 200% browser/user-agent zoom (SC 1.4.4 evidence required by C3) | Not executed; Chrome UI zoom was not reliably obtained | **Open P1** (`PW14-C3-C2-FND-001`) |

This is an evidence-classification correction. It does not state that the C3-C1 report was dishonest. CSS zoom must not be treated as equivalent to browser zoom. C3-C2 did not fabricate browser-zoom evidence and did not re-run CSS zoom as a substitute.

## 20. Language-finding reconciliation

| Item | Result |
| --- | --- |
| Defect | Confirmed: predominantly Dutch public `/` was served under `<html lang="en">` |
| Local source remediation | Implemented (Option C) |
| Local tests | Passed (focused + full suite) |
| Local initial HTML | `<html lang="nl">` on `/`; `<html lang="en">` on `/login` and other inspected HTML classes |
| Runtime Preview verification | **Outstanding** — no new Preview in C3-C2 |
| NVDA language behaviour | **Outstanding** — not re-run |
| Status | `REMEDIATED LOCALLY — AWAITING NEW PREVIEW VERIFICATION` |

The finding is not fully resolved for C3.

## 21. NVDA finding disposition

`PW14-C3-FND-001` remains **OPEN**. NVDA running without captured Speech Viewer announcements remains incomplete evidence. C3-C2 did not run NVDA, did not substitute the accessibility tree, source, browser logs, Narrator, axe, or Lighthouse, and does not claim NVDA PASS.

## 22. Updated findings register

Historical C3 and C3-C1 registers are unchanged. Current C3-C2 classifications:

| ID | Sev | Finding | Status |
| --- | --- | --- | --- |
| PW14-C3-FND-001 | P1 | NVDA Speech Viewer announcements not captured | **OPEN** |
| PW14-C3-C1-FND-001 | P1 | Document-language defect on public `/` | **REMEDIATED LOCALLY — AWAITING NEW PREVIEW VERIFICATION** |
| PW14-C3-C2-FND-001 | P1 | Actual 200% browser/user-agent zoom not executed; CSS `zoom: 2` is supporting only | **OPEN** |
| PW14-C3-FND-008 | P2 | Automated axe/Lighthouse scan unavailable | Open |
| PW14-C3-FND-010 | P2 | PW-14-C4 visitor validation outstanding | Open |
| PW14-C3-FND-011 | P2 | Production verification outstanding | Open |

P0 remaining: **0**. P1 remaining: **3**. P2 remaining: **3**.

No additional product defect was discovered inside the local remediation scope. A locally remediated finding remains unresolved for C3 until verified on a new governed Preview.

## 23. Remaining C3 blockers

- New governed Preview after independent review, commit, and push.
- NVDA Speech Viewer announcement capture on that Preview.
- Actual 200% Chrome/browser zoom on that Preview.
- Preview verification of the document-language remediation, including NVDA language behaviour.

C3-C2 local PASS does not close PW-14-C3.

## 24. Remaining PW-14 blockers

Parent PW-14 remains BLOCKED. Outstanding beyond C3: C3 independent review / later C3 chain, C4 visitor validation, publication admission, and Production verification. Production still serves pre-PW-13 logged-out `/` → `/login`. Authenticated Home remains closed. Today AppShell visual accessibility remains out of C3-C2 scope.

## 25. File and security integrity

Changed tracked files:

- `docs/phases/PW-14-public-homepage-publication-production-verification.md`
- `src/app/layout.tsx`
- `src/lib/supabase/middleware.ts`
- `tests/auth/entry-routing-and-login-ui.test.tsx`
- `tests/auth/middleware-auth-redirects.test.ts`
- `tests/public-web/public-homepage.test.tsx`

New untracked files (unstaged by instruction):

- `src/lib/i18n/document-language.ts`
- `tests/app/root-document-language.test.tsx`
- `tests/lib/i18n/document-language.test.ts`

No unrelated source or tests. No visual style change. No config, environment, dependency, or lockfile change. No generated artifact, browser profile, HAR, trace, video, screenshot, or report added. No temporary script remains. Local server stopped. No secret or private identifier added.

`git diff --check` on tracked changes: clean.

## 26. Git state

HEAD `2daff99f5f8336dc4a455484ec3ced413a834f8d`. Upstream same. Ahead/behind `0 0`. Staged: none. Unstaged tracked: the six files listed above. Untracked: the three new source/test files. Untracked remainder is not empty solely because staging is forbidden for new files. No conflicting Git operation.

## 27. Commit, push, deploy, and promotion status

No stage. No commit. No push. No amend. No Preview created. No promote. No `--prod`. No Vercel or Supabase configuration change. No aliases changed.

## 28. Gate result

```text
PASS — PW-14-C3-C2 DOCUMENT LANGUAGE REMEDIATION AND ACCESSIBILITY EVIDENCE CORRECTION CLOSED LOCALLY WITH EVIDENCE
PW-14-C3-C2 READY FOR INDEPENDENT REVIEW
PW-14-C3 REMAINS BLOCKED — NEW PREVIEW, NVDA SPEECH AND ACTUAL 200 PERCENT BROWSER ZOOM VERIFICATION OUTSTANDING
DO NOT COMMIT
DO NOT PROMOTE
PRODUCTION UNCHANGED
```

## 29. Next authorized step

`PW-14-C3-C2-R1 — Independent Document-Language Remediation and Evidence Review`

Do not start C3-C2-FV, C3-C3, C3-R1, C3-FV, C4, publication admission, or Production verification from this local result.

End of PW-14-C3-C2 evidence.

# PW-14-C3-C2-R1 — Independent Document-Language Remediation and Evidence Review Evidence

| Field | Value |
| --- | --- |
| Phase | PW-14-C3-C2-R1 |
| Date | 2026-09-18 |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD (unchanged) | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Parent | `a8e359bc8b549ec8a6f53c1a2236ce794b84dc8e` |
| Commit subject | `docs(public-web): close PW-14-C2 preview routing evidence` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Ahead/behind | `0 0` |
| Staging | none |
| Product/test edits in R1 | none |
| Commit / push / deploy / Preview / promote | none |

## 1. Preflight

Read-only preflight, then `git fetch origin`. After fetch:

| Check | Result |
| --- | --- |
| Repository root | authorized worktree |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Upstream SHA | identical |
| Ahead/behind | `0 0` |
| Staged files | none |
| Modified tracked files | exactly the six expected files |
| Untracked files | exactly the three expected files |
| Total changed/new set | exactly nine files |
| Merge / rebase / cherry-pick / revert / bisect | none |
| Instruction files | no project `AGENTS.md`, `CONTRIBUTING.md`, or `.cursor/rules` |
| C3 / C3-C1 / C3-C2 appendices | present |
| C3-C2 gate text | present as local PASS, C3 still blocked |
| Retained Preview | non-Production; Deployment Protection SSO still present |
| Production | unchanged logged-out pre-PW-13 `/` → `/login` |

No drift repair was required or performed.

## 2. Review independence

Every material C3-C2 claim was treated as an unverified hypothesis. This review independently inspected source, complete diffs, complete new-file contents, Next.js 15.5.20 middleware header-override behaviour, tests, focused and full suites, lint, typecheck, build, and a new local production-mode HTTP pass on `127.0.0.1:4315`. C3-C2 statements were not accepted solely because they appear in the evidence document.

Evidence classes used below: source, test, local production-mode HTTP, Next.js framework source, historical appendix, Production HTTP headers.

## 3. Authority review

Applied B1-GATE.1; PW-0 through PW-13; the PW-14 chain including C1 / C1-R1 / C1-FV and C2 / C2-R1 / C2-FV; C3; C3-C1; C3-C2; PW-8 Language Model A (`PW8-LANG-001` / `PW8-OD-002`); WCAG 2.2 SC 3.1.1, SC 1.4.4, and SC 1.4.10; the repository’s existing Next.js App Router and Supabase SSR middleware contracts.

PW-1 remains the public-truth ceiling. PW-13 remains the public-homepage implementation authority. PW-14-C2 remains routing evidence only. C3-C2 does not authorize publication or deployment. R1 local confirmation is not PW-14-C3 PASS and is not a WCAG-conformance claim.

## 4. Complete diff review

Independently reviewed the complete tracked diffs and the complete contents of the three new files. Line classification:

| File | Classification |
| --- | --- |
| `src/lib/i18n/document-language.ts` | document-language implementation + trusted request metadata handling |
| `src/app/layout.tsx` | root-layout rendering |
| `src/lib/supabase/middleware.ts` | trusted request metadata handling (two `NextResponse.next` construction sites) |
| `tests/lib/i18n/document-language.test.ts` | relevant regression test |
| `tests/app/root-document-language.test.tsx` | relevant regression test |
| `tests/public-web/public-homepage.test.tsx` | relevant regression test |
| `tests/auth/middleware-auth-redirects.test.ts` | relevant regression test |
| `tests/auth/entry-routing-and-login-ui.test.tsx` | relevant regression test |
| PW-14 evidence document | evidence documentation |

No public copy change, visual redesign, authentication/authorization/membership/onboarding/invitation/Home/AppShell change, unrelated middleware refactor, dependency/lockfile/environment/Vercel/Supabase change, hidden deployment behaviour, debug code, temporary instrumentation, or broad formatting rewrite was found.

Middleware still uses `getPublicSupabaseEnv()` publishable values only. Redirect branches, `applyCookies`, and `getUser()` remain the pre-C3-C2 control flow.

## 5. Historical evidence review

Independently reread C3, C3-C1, and C3-C2.

| Claim | Independent result |
| --- | --- |
| C3 historically BLOCKED | Confirmed; seven P1s recorded |
| C3-C1 historically BLOCKED | Confirmed |
| C3-C1 then-current snapshot P1 remaining 2 | Confirmed at C3-C1 register; not rewritten |
| C3-C2 later corrects current state to three P1s | Confirmed; described as evidence-classification correction, not dishonesty |
| CSS `zoom: 2` labelled supporting | Confirmed in C3-C1 narrative and C3-C2 reconciliation |
| 320 CSS-pixel reflow separately valid | Confirmed executed in C3-C1 §17 |
| Actual browser zoom open | Confirmed as `PW14-C3-C2-FND-001` |
| NVDA speech open | Confirmed; Speech Viewer announcements not captured |
| Language locally remediated, not Preview-verified | Confirmed |
| PW-14-C3 remains blocked | Confirmed in C3-C2 gate text |
| Production unchanged | Confirmed historically and by this R1 Production header pass |

Historical vs current, local vs Preview vs Production, passed vs skipped vs open vs locally remediated remain distinguished.

## 6. Route-language inventory assessment

Independent source inspection of visible copy, plus logged-out local HTML where reachable:

| Route / class | Predominant language | Expected `<html lang>` | HTML or redirect | Independent support |
| --- | --- | --- | --- | --- |
| Logged-out `/` | Dutch public H1 and body | `nl` | HTML 200 | source + local HTTP |
| Authenticated `/` | n/a | n/a | Redirect only | source (`redirect(resolveAuthenticatedEntryPath)`); **authenticated runtime not executed in R1** |
| `/login` | English `Sign in` | `en` | HTML 200 | source + local HTTP |
| `/home` logged-out | n/a | destination `/login` `en` | 307 | middleware tests + local HTTP |
| `/home` / Today / AppShell admitted | English (`Today`, `Skip to main content`, `Sign in required`) | `en` | HTML when admitted | source; **authenticated runtime not executed in R1** |
| Onboarding HTML | English (`How does your business operate?`, `Setup needs attention`) | `en` | HTML when admitted | source |
| `/onboarding` logged-out | n/a | `/login` `en` | 307 | local HTTP |
| `/invite/accept` | English (`Invitation unavailable`, metadata `Invitation \| ZyntixAI`) | `en` | HTML 200 | source + local HTTP |
| `/register` when rendered | English (`Create your account`) | `en` | HTML when enabled | source; local prod followed existing registration-disabled redirect |
| `/forgot-password` | English `Reset password` | `en` | HTML 200 | source + local HTTP |
| `/reset-password` | English `Reset link expired` without a token | `en` | HTML 200 | source + local HTTP |
| Default 404 | English `404` | `en` | HTML 404 | local HTTP |
| Loading / error states | English product chrome | `en` | HTML when those files render | source (Home loading `Today`; product errors `Something went wrong`) |

The `/` → `nl`, everything-else → `en` mapping is supported by the current rendered inventory. No rendered route contradicted it.

## 7. Language-resolver assessment

Inspected complete `src/lib/i18n/document-language.ts`.

- Allowlist is exact `'en' \|\| 'nl'` at runtime; TypeScript union cannot bypass `parseDocumentLanguage`.
- `normalizePathname` strips query/hash before comparison; `/` and empty/all-slash paths become `/` → `nl`; `/login/` and `/home/` → `en`.
- Resolver uses pathname only. No cookie, `Accept-Language`, organization locale, session, or query input.
- Missing, empty, `fr`, `NL`, `en-US`, and other malformed values fall back to `en`.
- Layout never writes a raw header string into `lang`; it writes the parsed allowlisted value.
- Helper names (`applyTrustedDocumentLanguageHeaders`, `nextWithTrustedDocumentLanguage`, `parseDocumentLanguage`) communicate the trust boundary.
- Application has no `basePath` and no locale-prefix routing. Unknown routes resolve `en`, matching the English default 404.

## 8. Middleware trust-boundary assessment

Inspected complete `src/lib/supabase/middleware.ts` and `src/middleware.ts`, not only the changed lines, plus Next.js 15.5.20 `NextResponse.next` / `x-middleware-override-headers` handling.

- Both `NextResponse.next` construction sites now call `nextWithTrustedDocumentLanguage`.
- That helper clones inbound headers, deletes `x-document-language`, and sets the pathname-derived allowlisted value. Fetch `Headers` delete/get is case-insensitive.
- Next.js override semantics delete request headers not listed in the override set. The helper copies **all** inbound headers before setting language, so `Cookie` and other request headers remain in the override list. This is the safe pattern; setting only the language header would have been a P1 cookie-loss risk. That unsafe pattern is **not** present.
- After `request.cookies.set` in `setAll`, the helper re-reads `request.headers` (RequestCookies mutate the Cookie header) and `applyCookies` still copies refresh cookies onto the response, including redirect branches.
- Redirect control flow is unchanged. Logged-out `/home` still 307s to `/login?next=/home`. Language cannot change destination routing.
- Matcher still excludes `_next/static`, `_next/image`, favicon, and image extensions; HTML routes including `/` are included. Unknown HTML routes still pass middleware and receive `en`.
- No service-role usage. No private identifiers added to headers. Local HTML responses did not echo `x-document-language`.
- No redirect-loop mechanism was introduced.

Authenticated cookie-refresh **runtime** was not executed in R1 (no session). Classification: source + framework review, not live session proof.

## 9. Root-layout assessment

`src/app/layout.tsx` remains a Server Component (no `"use client"`). It awaits `headers()`, parses through the allowlisted helper, and renders `<html lang={lang}>`. Metadata export is unchanged. Body still contains only `{children}`. No `useEffect`, inline script, or `document.documentElement` mutation exists in the layout. `src/app/page.tsx` is unchanged (PublicHomepage still receives no props; authenticated `/` still redirects).

`headers()` keeps the root layout dynamic. The C3-C2 build and this R1 rebuild both list every App Router route as `ƒ` dynamic; `/` already had `export const dynamic = "force-dynamic"`. Dynamic rendering is therefore not a new cache-class change. A safe dynamic route is not a defect.

## 10. Server-rendered initial-HTML verification

Independent local production-mode pass: `npx next start -H 127.0.0.1 -p 4315` after this R1 rebuild. Loopback only. Server stopped afterward; no listener remained on 4315. No HAR, trace, video, or browser profile was saved.

| Request | Status | `<html lang>` | Note |
| --- | --- | --- | --- |
| `GET /` | 200 | `nl` | prefix `<!DOCTYPE html><html lang="nl">`; Dutch H1 |
| `GET /?lang=en` | 200 | `nl` | query does not switch language |
| `GET /` + `x-document-language: en` | 200 | `nl` | spoof ignored |
| `GET /` + `x-document-language: fr` | 200 | `nl` | spoof ignored |
| `GET /` + empty language header | 200 | `nl` | spoof ignored |
| `GET /` + 400-character unsupported value | 200 | `nl` | spoof ignored |
| `GET /login` | 200 | `en` | `Sign in` |
| `GET /login` + `nl` | 200 | `en` | spoof ignored |
| `GET /login` + `fr` | 200 | `en` | spoof ignored |
| `GET /home` | 307 | n/a | `/login?next=%2Fhome` |
| `GET /forgot-password` | 200 | `en` | `Reset password` |
| `GET /reset-password` | 200 | `en` | `Reset link expired` |
| `GET /invite/accept` | 200 | `en` | `Invitation unavailable` |
| `GET /onboarding` | 307 | n/a | `/login?next=%2Fonboarding` |
| unknown path | 404 | `en` | default Next.js 404 |
| `GET /register` | 307 | n/a | existing registration-disabled redirect |

Public HTML Cache-Control: `private, no-cache, no-store, max-age=0, must-revalidate`. Response did not include `x-document-language`. Escaped RSC payload contains `lang":"nl"` for `/` and `lang":"en"` for `/login`, matching the HTML root. No `documentElement` patch. No hydration-warning text. No private-content leak markers in the recorded public HTML.

This is local production-mode evidence, not Preview evidence.

## 11. Test-quality assessment

| Acceptance criterion | Independent proof |
| --- | --- |
| Public `/` document language Dutch | resolver tests + layout `renderToStaticMarkup` + local HTTP |
| Language on `<html>` | layout tests assert `startsWith('<html lang=…')`; local HTTP prefix |
| Wrapper is not a substitute for the document root | entry-routing asserts public fragment contains `lang="nl"` and **not** `<html`; layout owns `<html>` |
| `/login` English | login fragment `Sign in` without `<html`; local HTTP `html lang="en"` |
| Spoof overwrite | middleware + `nextWithTrustedDocumentLanguage` tests; local HTTP spoof matrix |
| Invalid/missing fallback | `parseDocumentLanguage` + layout fallback tests |
| `/home` protection | existing + spoofed `/home` still 307; local HTTP |
| Redirect-only authenticated `/` | entry-routing redirect tests; **runtime session not executed** |
| Public isolation / no private props | public-homepage isolation lock + `PublicHomepage` takes no props |
| No client lang patch | layout source assertions + no `documentElement` in local HTML |
| Allowlist | parse tests reject `fr`, `NL`, `en-US` |

Source-string isolation assertions exist but are not the sole proof. No skips, todo, only, quarantine, retries, or weakened snapshots.

Limitations recorded as P2: the middleware suite does not invoke the cookie `setAll` reconstruction path; one resolver example titled “ignores query strings” does not itself pass a query (coverage exists elsewhere).

## 12. Focused test results

Batch 1:

```text
npx vitest run tests/lib/i18n/document-language.test.ts tests/app/root-document-language.test.tsx tests/public-web/public-homepage.test.tsx tests/auth/middleware-auth-redirects.test.ts tests/auth/entry-routing-and-login-ui.test.tsx
```

Exit 0. Files 5. Passed 45. Failed 0. Skipped 0.

Batch 2:

```text
npx vitest run tests/auth/safe-return-path.test.ts tests/auth/public-registration.test.ts tests/features/daily-operating/load-daily-operating-page.test.ts tests/onboarding/onboarding-routing.test.ts tests/onboarding/product-admission-routing.test.ts tests/features/invitations/load-member-administration-page.test.ts tests/ui/appshell-customers-terminology.test.tsx tests/onboarding/product-admission-app-shell.test.ts
```

Exit 0. Files 8. Passed 117. Failed 0. Skipped 0.

## 13. Full-suite result

```text
npx vitest run
```

Exit 0. Files **538** passed. Tests **4225** passed. Failed **0**. Skipped **0**.

## 14. Lint, typecheck, and build

| Command | Exit |
| --- | --- |
| `npm run lint` | 0 |
| `npm run typecheck` | 0 |
| `npm run build` | 0 |
| `git diff --check` | 0 |

Typecheck and build were not concurrent. Pre-existing unrelated social-beta autoprefixer warning only. All App Router routes remain `ƒ` dynamic.

## 15. Authentication and routing regression review

Source and tests, not a new authenticated session:

- Logged-out `/` still returns `<PublicHomepage />` (`src/app/page.tsx` unchanged; entry-routing test).
- Authenticated `/` still `redirect(await resolveAuthenticatedEntryPath(…))` and does not render marketing. **Authenticated runtime not executed in R1.**
- `/login` authenticated bounce to `/` remains in middleware; search stripped.
- `/home` remains protected.
- Safe-return, registration, onboarding, invitation, and product-admission focused tests passed.
- No hard-coded `/home` shortcut was added.
- Language selection cannot change middleware destinations; pathname language is applied only on `NextResponse.next` construction, not on redirect URL building.

## 16. Cache, privacy, and security review

Observed (local production-mode HTTP): public `/`, `/login`, recovery, invite, and 404 responses use `private, no-store`. Language is pathname-derived, not user-derived, so a `Vary` on language is not required. Internal language header was not echoed. No client-controlled value reached `<html lang>`. No service-role, secret, or environment addition exists in the nine-file scope.

Inference / limitation: authenticated HTML Cache-Control was not re-read in R1 because no session was created. Invite accept already declares `force-dynamic` and `revalidate = 0` in source. Recorded as P2 cache-evidence limitation, not an identified unsafe behaviour.

## 17. Three-P1 reconciliation

Independently confirmed against C3-C1 executed evidence and C3-C2 classification:

| Item | R1 result |
| --- | --- |
| 320 CSS-pixel reflow executed in C3-C1 | Yes (historical executed evidence) |
| Text-spacing executed | Yes |
| CSS `zoom: 2` labelled supporting | Yes |
| Actual browser/user-agent zoom executed | No |
| Combined zoom/reflow finding only partially resolved | Yes |
| Actual 200% browser zoom | remains OPEN |
| NVDA running vs announcements captured | ran; Speech Viewer summaries not captured; remains OPEN |
| Language defect on old Preview | historically confirmed (`html lang="en"` vs Dutch copy) |
| Local remediation proves new Preview | No |
| Language status | `REMEDIATED LOCALLY — AWAITING NEW PREVIEW VERIFICATION` |
| P0 | 0 |
| Current P1 count | 3 |
| Current P2 count | 3 |

R1 did not reduce the P1 count. R1 did not run NVDA. R1 did not treat CSS zoom as browser zoom.

## 18. Findings register

Parent C3 findings remain as currently classified. They do not fail R1 when accurately deferred.

R1-owned findings:

| ID | Sev | Evidence | Class | Impact | Required correction | Owner/gate | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PW14-C3-C2-R1-FND-001 | P2 | Middleware tests do not invoke cookie `setAll` reconstruction; both source `next()` sites use the trusted helper and copy full headers | test clarity | Does not contradict source/framework review that cookies remain listed for override | Optional later test of the `setAll` path | later test hygiene | Open — non-blocking |
| PW14-C3-C2-R1-FND-002 | P2 | One resolver example titled “ignores query strings” does not pass a query in that `it`; query immunity is proven by other tests and local HTTP `/?lang=en` | test clarity | None on product behaviour | Optional rename/assert later | later test hygiene | Open — non-blocking |
| PW14-C3-C2-R1-FND-003 | P2 | `/` is the only Dutch HTML pathname; additional future Dutch pages would need a new inventory | architecture | Current inventory is correct; mapping is not a general i18n system | Later localization phase if needed | future localization | Open — non-blocking |
| PW14-C3-C2-R1-FND-004 | P2 | Authenticated HTML Cache-Control not observed in R1 (no session) | evidence limitation | No unsafe public cache identified | None in R1; do not invent PASS | C3/later authenticated surfaces | Open — non-blocking |

R1 P0 remaining: **0**. R1 P1 remaining: **0**.

Current parent C3 accessibility register unchanged:

| ID | Sev | Status |
| --- | --- | --- |
| PW14-C3-FND-001 | P1 | OPEN — NVDA speech |
| PW14-C3-C1-FND-001 | P1 | REMEDIATED LOCALLY — AWAITING NEW PREVIEW VERIFICATION |
| PW14-C3-C2-FND-001 | P1 | OPEN — actual 200% browser zoom |
| PW14-C3-FND-008 | P2 | Open — axe/Lighthouse unavailable |
| PW14-C3-FND-010 | P2 | Open — C4 visitor validation |
| PW14-C3-FND-011 | P2 | Open — Production verification |

## 19. Corrections performed

None. No product source, test, style, config, dependency, or lockfile change. No rewrite of historical C3 / C3-C1 / C3-C2 facts. This appendix only.

## 20. Remaining C3 blockers

- Independent C3-C2 final verification, evidence commit, and push (next authorized step).
- New governed Preview after that commit.
- NVDA Speech Viewer announcement capture on that Preview.
- Actual 200% browser/user-agent zoom on that Preview.
- Preview verification of document language, including NVDA language behaviour.

C3-C2-R1 PASS does not close PW-14-C3.

## 21. Remaining PW-14 blockers

Parent PW-14 remains BLOCKED. Outstanding beyond C3: C4 visitor validation, publication admission, and Production verification. Live Production still serves pre-PW-13 logged-out `/` → `/login`. Authenticated Home remains closed.

## 22. File and security integrity

R1 changed only this evidence document. The eight product/test files remain SHA-256-identical to R1 entry. No generated report, browser profile, HAR, trace, video, screenshot, or temporary script was added. Local server on 4315 was stopped; no listener remained.

## 23. Git state

HEAD `2daff99f5f8336dc4a455484ec3ced413a834f8d`. Upstream same. Ahead/behind `0 0`. Staged: none. Unstaged tracked: the same six files, with this document now containing the R1 appendix. Untracked: the same three new files. No conflicting Git operation.

## 24. Commit, push, deploy, and promotion status

No stage. No commit. No push. No amend. No Preview created. No promote. No `--prod`. No Vercel or Supabase configuration change. No aliases changed.

## 25. Gate result

```text
PASS — PW-14-C3-C2-R1 INDEPENDENT DOCUMENT-LANGUAGE REMEDIATION AND EVIDENCE REVIEW CLOSED WITH EVIDENCE
PW-14-C3-C2 CONFIRMED — READY FOR FINAL VERIFICATION AND COMMIT
PW-14-C3 REMAINS BLOCKED — NEW PREVIEW, NVDA SPEECH AND ACTUAL 200 PERCENT BROWSER ZOOM VERIFICATION OUTSTANDING
DO NOT PROMOTE
PRODUCTION UNCHANGED
```

## 26. Next authorized step

`PW-14-C3-C2-FV — Final Verification, Evidence Commit, and Push`

Do not start C3-C3, C3-R1, C3-FV, C4, publication admission, or Production verification from this result.

End of PW-14-C3-C2-R1 evidence.

# PW-14-C3-C2-FV — Final Verification, Evidence Commit, and Push Authorization

| Field | Value |
| --- | --- |
| Phase | PW-14-C3-C2-FV |
| Date | 2026-09-18 |
| Repository root | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Pre-commit HEAD | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Expected parent | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Expected subject | `fix(public-web): govern document language by route` |
| Vercel CLI | 56.3.1 |
| Vercel team / project | `guus-projects-ai` / `zyntixai` (names only) |

This appendix is pre-commit authorization evidence. It does not invent a future commit SHA and does not claim that a new Preview already exists.

## 1. Phase purpose and boundary

FV performs final verification of the nine-file document-language remediation, appends this evidence, and authorizes one normal commit and a normal branch push. It closes PW-14-C3-C2 only. It does not close PW-14-C3, authorize Preview promotion, Production deployment, publication, WCAG conformance, NVDA PASS, or actual 200% browser-zoom PASS. No Preview is created manually. No ZyntixAI authentication is performed.

## 2. Preflight

| Check | Result |
| --- | --- |
| Root | authorized worktree |
| Branch | `core/platform-readiness-20260707` |
| Local HEAD | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |
| Upstream | same SHA |
| Ahead/behind | `0 0` |
| Staged | none |
| Modified tracked | exactly the six expected files |
| Untracked | exactly the three expected files |
| Total scope | exactly nine files |
| Git operations | none |
| Instruction files | none |
| C3-C2 local PASS | present |
| C3-C2-R1 PASS | present |
| Retained old Preview | non-Production |
| Production | unchanged logged-out `/` → `/login` |

## 3. Fetch and drift verification

`git fetch origin` completed. HEAD, upstream, and `0 0` remained unchanged. Nothing was staged. The nine-file set matched. No conflicting Git operation. Drift was not repaired. No merge, rebase, reset, stash, amend, or discard was used.

## 4. Authority review

Applied B1-GATE.1, PW-0 through PW-13, the PW-14 chain including C1/C1-R1/C1-FV and C2/C2-R1/C2-FV, C3, C3-C1, C3-C2, C3-C2-R1, PW-8 Language Model A, and WCAG 2.2 SC 3.1.1 / 1.4.4 / 1.4.10. PW-1 remains the public-truth ceiling. PW-13 remains implementation authority. C3-C2 does not authorize publication.

## 5. Historical evidence reconciliation

Independently confirmed:

1. Initial C3 BLOCKED.
2. Initial C3 seven P1 evidence gaps.
3. C3-C1 recovered logged-out browser checks.
4. C3-C1 remained BLOCKED.
5. C3-C1 two-P1 snapshot remains historical (`P1 remaining: 2`).
6. C3-C2 corrected the current count to three P1s.
7. The correction did not rewrite history as dishonest.
8. CSS `zoom: 2` remains supporting only.
9. 320 CSS-pixel reflow remains separately executed.
10. Actual browser zoom remains open.
11. NVDA speech remains open.
12. Old Preview language defect remains historical.
13. Language is remediated locally only.
14. C3-C2 local verification passed.
15. C3-C2-R1 independently passed (R1 P0=0, R1 P1=0, R1 P2=4).
16. PW-14-C3 remains blocked.
17. Production remains unchanged.

No wording in this phase implies NVDA PASS, actual browser-zoom PASS, Preview language verification, complete accessibility PASS, WCAG conformance, publication readiness, or Production verification.

## 6. Complete final diff review

The nine-file set remains limited to trusted document-language resolution, middleware request-header propagation, root-layout `lang`, relevant tests, and PW-14 evidence.

Confirmed: `/` → `nl`; other current rendered routes → `en`; only `en`/`nl` accepted; invalid fallback `en`; client `x-document-language` overwritten; both `NextResponse.next` sites use `nextWithTrustedDocumentLanguage` and copy full headers; Supabase cookie `getAll`/`setAll`/`applyCookies` remain; redirect branches and `/home` protection unchanged; root layout is a Server Component; `<html lang>` is server-rendered; no client language patch; no query/cookie/`Accept-Language`/org locale/session control; no public copy, visual style, dependency, lockfile, debug, or temporary code.

## 7. Test-quality review

Resolver, root document language, public Dutch `/`, English `/login`, spoof overwrite, invalid fallback, query immunity (`/?lang=en` middleware + HTML), wrapper-not-root, root routing, `/home` protection, login/safe-return, and public/private isolation remain covered. No skips, todo, only, retry, quarantine, or weakened snapshots. The four R1 P2 findings remain open and are not silently reclassified.

## 8. Focused test results

Batch 1: `npx vitest run tests/lib/i18n/document-language.test.ts tests/app/root-document-language.test.tsx tests/public-web/public-homepage.test.tsx tests/auth/middleware-auth-redirects.test.ts tests/auth/entry-routing-and-login-ui.test.tsx` — exit 0; files 5; passed 45; failed 0; skipped 0.

Batch 2: `npx vitest run tests/auth/safe-return-path.test.ts tests/auth/public-registration.test.ts tests/features/daily-operating/load-daily-operating-page.test.ts tests/onboarding/onboarding-routing.test.ts tests/onboarding/product-admission-routing.test.ts tests/features/invitations/load-member-administration-page.test.ts tests/ui/appshell-customers-terminology.test.tsx tests/onboarding/product-admission-app-shell.test.ts` — exit 0; files 8; passed 117; failed 0; skipped 0.

## 9. Full-suite result

`npx vitest run` — exit 0. Files **538** passed. Tests **4225** passed. Failed **0**. Skipped **0**.

## 10. Lint result

`npm run lint` — exit 0. No ESLint warnings or errors.

## 11. Typecheck result

`npm run typecheck` — exit 0. Not concurrent with build.

## 12. Build result

`npm run build` — exit 0. Routes remain `ƒ` dynamic. Pre-existing unrelated social-beta autoprefixer warning only.

## 13. Final local initial-HTML verification

`npx next start -H 127.0.0.1 -p 4316` after this rebuild. Loopback only. Stopped afterward; no listener remained.

| Request | Result |
| --- | --- |
| `GET /` | 200, `<!DOCTYPE html><html lang="nl">`, Dutch H1, RSC `lang":"nl"` |
| `GET /?lang=en` | still `nl` |
| spoofed `en` / `fr` / empty / long on `/` | still `nl` |
| `GET /login` | 200, `<html lang="en">`, `Sign in`, RSC `lang":"en"` |
| spoofed `nl` / `fr` on `/login` | still `en` |
| `GET /home` | 307 `/login?next=%2Fhome` |
| `GET /onboarding` | 307 `/login?next=%2Fonboarding` |
| `/forgot-password` | 200 `en` `Reset password` |
| `/reset-password` | 200 `en` `Reset link expired` |
| `/invite/accept` | 200 `en` `Invitation unavailable` |
| unknown path | 404 `en` |

No echoed `x-document-language`. No `documentElement` patch. No hydration-warning text. No private-content leak markers. Public HTML `Cache-Control: private, no-store`. Local production-mode evidence only; not Preview evidence.

## 14. Security and privacy audit

Count-only scan of the nine-file candidate: email addresses 0; JWT 0; `sb-access` 0; Authorization Bearer 0; Set-Cookie 0; forbidden org UUID 0. Environment-variable **names** and historical `.supabase.co` suffix / `example.supabase.co` mock remain; no live project hostname, cookie value, token, or private HTML was added. Result: PASS.

## 15. File-integrity verification

Exactly nine files. No style, config, env, dependency, lockfile, generated report, browser profile, HAR, trace, video, or temporary script. `git diff --check` clean. Trailing-whitespace 0. EOF present. Markdown fences even. Conflict markers 0. Historical C3/C3-C1/C3-C2/R1 intact. Current parent C3 P1 count remains 3.

## 16. Findings reconciliation

Parent C3: P0=0; P1=3; P2=3. NVDA OPEN. Language `REMEDIATED LOCALLY — AWAITING NEW PREVIEW VERIFICATION`. Actual 200% browser zoom OPEN. R1 P0=0; R1 P1=0; R1 P2=4 remain transparent (setAll test gap; query-test name; mapping is not general i18n; authenticated cache headers unobserved).

## 17. Remaining C3 blockers

New governed Preview after this commit is pushed; Preview language verification; NVDA Speech Viewer capture; actual 200% browser zoom. C3-C2-FV does not start C3-C3.

## 18. Remaining PW-14 blockers

C4 visitor validation, publication admission, Production verification. Live `/` still 307 `/login`. Authenticated Home remains closed.

## 19. Final AND-gate

All pre-staging conditions held: expected Git baseline; upstream unchanged; nine-file scope; C3-C2 PASS; R1 PASS; R1 P0/P1 zero; four R1 P2s transparent; parent P0=0 and P1=3; language implementation safe; spoof ineffective; routing intact; focused/full/lint/typecheck/build/HTML/security/integrity passed; Production unchanged; no manual Preview; no promote; PW-14-C3 remains blocked.

## 20. Authorized staging scope

Exactly:

- `docs/phases/PW-14-public-homepage-publication-production-verification.md`
- `src/app/layout.tsx`
- `src/lib/supabase/middleware.ts`
- `src/lib/i18n/document-language.ts`
- `tests/public-web/public-homepage.test.tsx`
- `tests/auth/middleware-auth-redirects.test.ts`
- `tests/auth/entry-routing-and-login-ui.test.tsx`
- `tests/app/root-document-language.test.tsx`
- `tests/lib/i18n/document-language.test.ts`

## 21. Expected commit subject and parent

| Item | Value |
| --- | --- |
| Subject | `fix(public-web): govern document language by route` |
| Parent | `2daff99f5f8336dc4a455484ec3ced413a834f8d` |

Commit SHA is not invented here.

## 22. Deployment and promotion boundary

Normal branch push only. No `vercel --prod`, alias promotion, deployment-ID promotion, workflow mutation, or force push. An automatic non-Production Preview, if created by hosting, is not C3 evidence in this phase and must not be tested here.

## 23. Gate result

```text
FINAL VERIFICATION PASSED — STAGING AND COMMIT AUTHORIZED
PW-14-C3 REMAINS BLOCKED — NEW PREVIEW, NVDA SPEECH AND ACTUAL 200 PERCENT BROWSER ZOOM VERIFICATION OUTSTANDING
DO NOT PROMOTE
PRODUCTION UNCHANGED
```

End of PW-14-C3-C2-FV pre-commit evidence.
