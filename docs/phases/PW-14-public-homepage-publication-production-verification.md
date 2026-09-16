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
