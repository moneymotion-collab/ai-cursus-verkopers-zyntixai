# B1-GATE.1 — 100% Phase Completion and Evidence Standard

| Field | Value |
| --- | --- |
| Document | B1-GATE.1 — 100% Phase Completion and Evidence Standard |
| Type | Repository-wide governance standard |
| Date | 2026-07-28 |
| Branch baseline | `core/platform-readiness-20260707` @ `9ca3b298981c085ed9039a6e5513d5a4247b83fa` |
| Effective from | **B1.6.2 and all later technical phases, subphases, QA slices, browser verification, and publication** |
| Owner | Desktop authoritative publication workspace |

---

## 1. Purpose

A phase may be treated as fully complete only when:

1. 100% of the pre-agreed **required** scope is executed;  
2. all required gates pass;  
3. zero open blockers remain;  
4. zero open **mandatory** conditions remain;  
5. browser and production verification are completed when required;  
6. evidence is present in repository documentation;  
7. the phase is controlled-published;  
8. Git ends clean with `HEAD = upstream` and divergence `0 0`.

This does **not** claim future software is forever bug-free. It claims every **contractually required** gate for that phase has been demonstrated.

---

## 2. Applicability

| Applies to | Rule |
| --- | --- |
| B1.6.2 and later technical phases | **Mandatory** |
| Subphases, QA, R1, PUB, PROD-R1, PROD-PUB, STAB slices from B1.6.2 forward | **Mandatory** |
| B1.0–B1.5 historical phases | **Not** re-audited under this standard by default (see §12) |
| B1-STAB.1 (already closed) | Remains closed; not reopened without new concrete evidence |

---

## 3. Terminology

| Term | Meaning |
| --- | --- |
| Required gate | A gate listed as mandatory for the phase contract |
| Mandatory condition | A condition that must be RESOLVED, RECLASSIFIED as polish, or MOVED before closure |
| Accepted polish | Non-blocking improvement with no functional/security/data/tenant impact |
| Blocker | Item that forces `BLOCKS PHASE CLOSURE` |
| Evidence | Repository docs + commands/results that prove a gate |

---

## 4. Official closure status

A phase may be **definitively closed** only with:

```text
CLOSED WITH EVIDENCE — 100% REQUIRED GATES PASSED
```

The following mean the phase is **not** definitively closed:

```text
PASS WITH CONDITIONS
PASS WITH CONDITIONS — BROWSER VERIFICATION REQUIRED
PASS WITH CONDITIONS — PRODUCTION VERIFICATION REQUIRED
PARTIAL PASS
BLOCKED
FAILED
IMPLEMENTED — NOT VERIFIED
READY FOR PUBLICATION
```

`READY FOR PUBLICATION` means implementation and local gates may succeed. It does **not** mean the phase is published or finally closed.

---

## 5. Gate catalog

### Gate 1 — Baseline and ownership

- Correct worktree, branch, HEAD  
- Upstream established; divergence explained  
- Dirty inventory recorded before changes  
- Ownership and parallel-work boundaries established  
- No deletion/overwrite of unexplained existing work  

### Gate 2 — Scope contract

Before implementation: exact goal; user result; in/out of scope; allowlist/denylist; roles; data/DB contract; security/tenant rules; tests; browser; production verification; rollback; exit criteria.

### Gate 3 — Implementation completeness

All required scope done; no temporary bypass; no hidden placeholder for required UX; no debug leftovers; no uncontracted feature; no large unrelated refactor; no deferral of required function without formal decision.

### Gate 4 — Automated tests

Targeted tests; regressions that would meaningfully fail before the change; role/tenant/not-found/edge cases as relevant; **full regression suite** before publication closure.

### Gate 5 — Code quality

`typecheck`; lint; production build; `git diff --check`; no secrets; no temp files; no unexpected paths.

### Gate 6 — Security and tenant isolation

Where relevant: owner/admin/staff/viewer/unauthenticated; cross-tenant IDs; missing/inactive/archived membership or records; safe not-found; no privilege escalation; no data leak; no RLS weakening without explicit security contract.

### Gate 7 — Browser verification

**Required for every user-visible change.** Contract journeys; correct roles; success/empty/error/not-found/permission-denied; relevant edges; no user-visible regression.

### Gate 8 — Production verification

**Required when** the change is user-visible; production config/auth/RLS/routing/deploy matters; the original defect was production-observed; or the phase activates/changes a production flow.

`NOT REQUIRED` only with concrete written justification in the phase report.

### Gate 9 — Documentation and evidence

Phase contract; implementation report; test results; security assessment; browser evidence; production evidence; commits; deployment data; rollback assessment; final verdict; remaining polish.

### Gate 10 — Publication

Targeted commits; no amend of published history; no rebase of published history; push to authoritative branch; `HEAD = upstream`; divergence `0 0`; clean worktree; published commit matches tested code.

---

## 6. Conditions rules

Every condition must receive exactly one status before definitive phase closure:

```text
RESOLVED AND VERIFIED
RECLASSIFIED AS ACCEPTED POLISH
MOVED TO SEPARATE OWNER-APPROVED PHASE
BLOCKS PHASE CLOSURE
```

No vague or unclassified leftovers.

### RESOLVED AND VERIFIED

Cause fixed; tests pass; browser/production done when required; evidence recorded.

### ACCEPTED POLISH

Only for: copy polish; visual polish; optional extra tests beyond required matrix; enhancements without functional/security/data/tenant impact; future work not needed for the agreed user result.

Accepted polish does **not** count as an open defect and does **not** block closure, but must be registered and must **not** hide a real defect.

### MOVED TO SEPARATE OWNER-APPROVED PHASE

Only when: clearly outside current scope; current agreed user result works safely; no security/tenant/data/primary-flow issue remains; a named follow-up phase or backlog ID is cited; move does not dodge required verification.

### BLOCKS PHASE CLOSURE

Mandatory when: security or tenant isolation unproven; primary journey broken; data unreliable; user information wrong/misleading; required tests fail; required browser missing; required production missing; published result not proven to match tested code.

---

## 7. Browser and production rules

1. User-visible work without browser evidence cannot close.  
2. Production-required work without production evidence cannot close.  
3. Justifying `NOT REQUIRED` for Gates 7–8 must be phase-specific and auditable.  
4. Mask credentials; never publish secrets, tokens, emails, or raw PII in reports.

---

## 8. Mandatory phase-end dashboard

Every future phase-end report must include:

```text
PHASE COMPLETION: <percentage>%

Required scope: PASS / FAIL
Implementation completeness: PASS / FAIL
Targeted tests: PASS / FAIL
Relevant regression tests: PASS / FAIL
Full regression suite: PASS / FAIL
Typecheck: PASS / FAIL
Lint: PASS / FAIL
Production build: PASS / FAIL
Security: PASS / FAIL / NOT REQUIRED WITH JUSTIFICATION
Tenant isolation: PASS / FAIL / NOT REQUIRED WITH JUSTIFICATION
Browser verification: PASS / FAIL / NOT REQUIRED WITH JUSTIFICATION
Production verification: PASS / FAIL / NOT REQUIRED WITH JUSTIFICATION
Documentation: PASS / FAIL
Publication: PASS / FAIL
Open blockers: <number>
Open mandatory conditions: <number>
Accepted polish items: <number>
Final verdict: <verdict>
```

`PHASE COMPLETION: 100%` is allowed only when:

```text
Open blockers = 0
Open mandatory conditions = 0
all required gates = PASS
```

A `NOT REQUIRED WITH JUSTIFICATION` gate counts as passed only when the justification is contractually correct.

---

## 9. Publication and rollback rules

- Prefer small, subject-accurate commits.  
- No amend/rebase/force-push of published history unless a separate emergency procedure is owner-approved (default: forbidden).  
- Push only to the authoritative branch named in the phase contract.  
- Rollback assessment required for production-affecting phases (prior Ready deployment ID when deploy occurred).

---

## 10. Zero open critical defects gate

Before any beta or production milestone that claims readiness:

```text
ZERO OPEN CRITICAL DEFECTS
```

Requires at minimum:

- zero open security defects  
- zero open tenant-isolation defects  
- zero open data-integrity defects  
- zero open broken primary journeys  
- zero open misleading user-information defects  
- zero unresolved production-visible defects  
- zero mandatory verification gaps  

Non-critical accepted polish may remain only with proven zero functional/security/data/tenant impact.

---

## 11. Example of a complete 100% closure

```text
PHASE COMPLETION: 100%

Required scope: PASS
Implementation completeness: PASS
Targeted tests: PASS
Relevant regression tests: PASS
Full regression suite: PASS
Typecheck: PASS
Lint: PASS
Production build: PASS
Security: PASS
Tenant isolation: PASS
Browser verification: PASS
Production verification: PASS
Documentation: PASS
Publication: PASS
Open blockers: 0
Open mandatory conditions: 0
Accepted polish items: 2
Final verdict: CLOSED WITH EVIDENCE — 100% REQUIRED GATES PASSED
```

---

## 12. Rules for earlier phases (B1.0–B1.5)

1. Do **not** re-run a broad historical audit by default.  
2. Already closed and evidenced items remain closed.  
3. Reopen an older phase only with **new concrete evidence**.  
4. A truly open mandatory condition gets a targeted **B1-STAB** slice.  
5. Accepted polish is not presented as a defect.  
6. Missing historical evidence is not invented or backfilled as if executed.

---

## 13. Rules for new phases from B1.6.2

1. This standard is binding.  
2. Implementation may start only after a scope/readiness contract that maps every gate to concrete PASS criteria.  
3. Intermediate statuses (`PASS WITH CONDITIONS`, `READY FOR PUBLICATION`, etc.) are allowed mid-flow but **not** as final closure.  
4. Parallel laptop work requires renewed overlap preflight when shared paths are involved.  
5. AI / NBA / health / Attention remain out of Progress B1.6 productization unless a new owner-approved contract says otherwise.

---

## 14. Consistency checks (self-audit)

- Does not weaken existing Git safety (no amend/rebase/force defaults).  
- Does not allow skipping required browser/production via vague polish.  
- Does not reopen B1.0–B1.5 without new evidence.  
- Aligns with fail-closed security and tenant isolation norms already used in B1.4/B1.5/B1.6.0.

---

## 15. B1-GATE.1 verdict for this publication

```text
B1-GATE.1 CLOSED WITH EVIDENCE — 100% REQUIRED GATES DEFINED
```

(Definition publication only; no product code changed.)

---

## End of B1-GATE.1
