# NBA-R1 — Controlled Browser and Security Verification

| Field | Value |
| --- | --- |
| Capability | **Next Best Action (NBA)** |
| Gate | **NBA-R1 — Controlled Browser & Security Verification** |
| Document type | Controlled browser, security, regression, and production QA evidence |
| Official phase number | **NONE ASSIGNED** — unnumbered NBA track (no B1.x invented) |
| Date | 2026-08-09 |
| Formal status | `NBA-R1 PASS — CLOSED WITH EVIDENCE` |
| Predecessor | NBA-Q deploy + Viewer smoke + fixture preparation/verification (VERIFIED AND FROZEN) |
| Design contract | `docs/phases/NBA-design-security-and-readiness-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Runtime / R1 verification HEAD | `79af4cfd14f17f593cd74b5f4492e8a29228a0c2` |
| Parallel | `PARALLEL BLOCKED` |

**This document does not invent a B1.x number.**

**This document does not claim NBA-PUB completion.**

**This document does not declare Course Sellers Beta 1 complete.**

**This documentation file was created after R1 runtime PASS; it was not part of commit `79af4cf…`.**

---

## 1. Formal R1 verdict

```text
NBA-R1 PASS —
CONTROLLED PRODUCTION BROWSER / SECURITY / REGRESSION VERIFICATION COMPLETE

READ-ONLY R1 VERIFIED

NBA PRODUCTION BROWSER / SECURITY VERIFICATION COMPLETE FOR:

ATTENTION → NEXT BEST ACTION
```

```text
NBA-PUB NOT STARTED
COURSE SELLERS BETA 1 NOT YET DECLARED COMPLETE
```

---

## 2. Authoritative Git baseline (at R1 verification)

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD / upstream | `79af4cfd14f17f593cd74b5f4492e8a29228a0c2` |
| Divergence | `0 0` |
| Worktree before evidence-document creation | clean |
| Subject | `feat(nba): add Attention detail Next Best Action UX` |

No product code, schema, RPC, RLS, package, or lockfile changes were introduced by R1 execution. R1 was read-only against the already-deployed NBA runtime.

**Write-boundary note:** controlled Attention fixtures were created earlier during **NBA-Q fixture preparation** (authorized production writes outside R1). Those writes are **not** part of the NBA-R1 zero-write claim. NBA-R1 itself performed no fixture, lifecycle, or Attention writes.

---

## 3. Production baseline

| Field | Value |
| --- | --- |
| Alias | `https://zyntixai.vercel.app` |
| Deployment | `dpl_HMjddXSMVe1b1XL3ZFywm6ZCKrVs` |
| Status | Ready |
| Runtime SHA | `79af4cfd14f17f593cd74b5f4492e8a29228a0c2` |

No NBA-R1 redeploy occurred. No DB/schema migration occurred during R1.

---

## 4. Frozen fixture inventory

### 4.1 Counts (start = end)

| Org | Items | Signals | Events |
| --- | ---: | ---: | ---: |
| A (`2fc07699-ece5-44b9-bbb3-abbc23e9fffb`) | 7 | 8 | 25 |
| B (`fec38060-15b1-4de8-974c-29cefe7764e1`) | 1 | 1 | 1 |

**R1 read-only event delta: `0`**

### 4.2 Controlled aliases / purpose

| Alias | Purpose / expected NBA | Notes |
| --- | --- | --- |
| F1-SEVERITY | `acknowledge_attention` | open · high · unassigned |
| F1-ACK | `assign_attention_owner` | acknowledged · unassigned |
| F1-RESOLVE | NBA null | resolved |
| F1-DISMISS | NBA null | dismissed |
| F1-ARCHIVE | NBA null | resolved · archived |
| NBA-Q Review Progress | `review_progress` | acknowledged · assigned · stale evidence · id `9da62a4e-843b-40bb-945a-56189f4511fa` |
| NBA-Q Open Enrollment | `open_enrollment` | acknowledged · assigned · non-stale · id `63094bb4-2948-4cf4-9f6a-85bd5988f771` |
| Org B Isolation | foreign-tenant isolation | id `aed0f3dd-cef6-44dd-93b4-2db39f2b10f8` |

Credentials remained operator-controlled. No passwords, tokens, cookies, or session secrets are recorded here.

---

## 5. R1 evidence history (session model)

R1 completed through controlled **read-only** sessions and several resumptions because Cursor IDE browser tabs shared one authenticated session context (role drift across tabs).

Important sequence:

1. Initial R1 execution began (anonymous + Viewer landed).
2. Staff session initially unavailable → hard stop.
3. Owner checks landed; shared auth later drifted roles between tabs.
4. Sequential-role approach adopted (Owner then Staff in one shared auth context).
5. Staff role re-proved after **full hydration** (not loading skeleton).
6. Staff Phase B completed.
7. Final Owner tenant-isolation spot completed.
8. R1 closed.

Every stop respected the hard-stop policy. No unauthorized mutation was used to work around session availability. This is a **tooling/session-management** issue, not a product authorization failure.

Evidence classes:

| Class | Source |
| --- | --- |
| Reused | NBA-Q deploy gate, Viewer smoke, fixture verify/freeze, automated NBA-T/I/U where noted |
| New R1 | Staff Phase B, Owner foreign-tenant spot, refresh/desktop/mobile/a11y smoke under R1 |
| Preserved Owner | Acknowledge / Assign / terminal / archive null from authenticated Owner reads |

---

## 6. Anonymous auth

| Check | Result |
| --- | --- |
| `GET /attention` unauthenticated | `307` → login with protected `next` |
| Anonymous NBA/data exposure | none |

**Verdict: PASS**

---

## 7. Owner evidence

| Gate | Result |
| --- | --- |
| Acknowledge recommendation | PASS |
| Assign recommendation | PASS |
| Review Progress | PASS |
| Open Enrollment | PASS |
| Terminal suppression | PASS |
| Archive suppression (readable, no NBA) | PASS |
| Tenant isolation | PASS |
| Automatic mutation | NO |

### Final Owner tenant proof

Org A Owner opened Org B Attention:

`/attention/aed0f3dd-cef6-44dd-93b4-2db39f2b10f8`

Observed: **Attention unavailable**

Not exposed: NBA, title, signals, recommendation explanation, destination, foreign context.

Production write: **NO**

---

## 8. Staff evidence

### Role proof (hydrated)

| Evidence | Result |
| --- | --- |
| Workspace | ZyntixAI Production QA |
| `New program` | ABSENT |
| F1-SEVERITY | Acknowledge control + NBA present |
| F1-ACK | Assign control + NBA present |
| F1-ARCHIVE | Attention unavailable |
| Role stability after hydration / end-of-phase Programs revisit | PASS |

### Staff closure

| Gate | Result |
| --- | --- |
| Acknowledge NBA | PASS |
| Acknowledge fragment `#attention-acknowledge-heading` | PASS |
| Assign NBA | PASS |
| Assign fragment `#attention-assign-heading` | PASS |
| Review Progress navigation | PASS |
| Open Enrollment navigation | PASS |
| Archive restriction | PASS |
| Tenant isolation | PASS |
| Mutation escalation | NO |

---

## 9. Viewer evidence

| Gate | Result |
| --- | --- |
| Recommendation visibility | YES |
| Mutation recommendation title/explanation | VISIBLE |
| Read-only message | VISIBLE — `View only — you cannot perform this action.` |
| Executable mutation NBA CTA | NO |
| Unauthorized lifecycle control | NO |
| Archive escalation | NO |
| Tenant leak | NO |
| Production write | NO |

Viewer recommendation visibility did not increase mutation authority.

---

## 10. Acknowledge handoff

| Field | Value |
| --- | --- |
| Fixture | F1-SEVERITY |
| Expected type | `acknowledge_attention` |
| Production title | Acknowledge this attention item |
| Owner/Staff CTA | Go to Acknowledge → `#attention-acknowledge-heading` |
| Fragment handoff | PASS |
| Lifecycle submit | NOT performed |
| Item remained | open |
| Viewer | recommendation visible · mutation CTA absent |

---

## 11. Assign handoff

| Field | Value |
| --- | --- |
| Fixture | F1-ACK |
| Expected type | `assign_attention_owner` |
| Production title | Assign an owner |
| Owner/Staff CTA | Go to Assign → `#attention-assign-heading` |
| Fragment handoff | PASS |
| Assignment submit | NOT performed |
| Item remained | unassigned |
| Viewer | recommendation visible · mutation CTA absent |

---

## 12. `review_progress` production evidence

| Field | Value |
| --- | --- |
| Fixture title | B1.7/NBA QA — Review Progress |
| Fixture ID | `9da62a4e-843b-40bb-945a-56189f4511fa` |
| State | acknowledged · assigned · non-archived · qualifying stale-progress evidence |
| Expected NBA | `review_progress` |
| Production UI | Review progress |
| Destination | `/progress?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb&enrollmentId=e405c5c8-8b26-4768-bc74-67c7d52224e0` |
| Owner | PASS |
| Staff | PASS |
| Authorized Progress context | PASS |
| Attention mutation from navigation | NO |

**Tooling note:** Cursor browser did not always follow in-page navigation clicks. Evidence used rendered CTA `href` + authorized direct destination navigation. Non-blocking; destination authorization/content independently verified.

---

## 13. `open_enrollment` production evidence

| Field | Value |
| --- | --- |
| Fixture title | B1.7/NBA QA — Open Enrollment |
| Fixture ID | `63094bb4-2948-4cf4-9f6a-85bd5988f771` |
| State | acknowledged · assigned · non-archived · non-stale |
| Expected NBA | `open_enrollment` |
| Production UI | Open enrollment |
| Destination | `/enrollments/1bd8138a-19f3-419d-98e4-e17d5dbe7616?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Owner | PASS |
| Staff | PASS |
| Cancelled enrollment history | rendered safely |
| Attention mutation from navigation | NO |

Same Cursor CTA-navigation tooling note applies where relevant.

---

## 14. `open_customer` assurance

| Field | Value |
| --- | --- |
| Production fixture | **NONE** / not required |
| Assurance basis | NBA-T automated domain · NBA-I authorized-context/application · NBA-U SSR/UI |
| R1 decision | automated-only coverage **ACCEPTED** for NBA-R1 / NBA-PUB readiness |

Does **not** imply production browser fixture coverage for `open_customer`.

---

## 15. Terminal / archive suppression

| Fixture / role | Result |
| --- | --- |
| F1-RESOLVE | no NBA |
| F1-DISMISS | no NBA |
| F1-ARCHIVE Owner | no NBA (item readable) |
| F1-ARCHIVE Staff | Attention unavailable |
| F1-ARCHIVE Viewer | Attention unavailable / no visibility escalation |

**Verdict: PASS** — NBA does not reactivate terminal or archived workflow.

---

## 16. Tenant isolation

| Actor | Org B item | Result |
| --- | --- | --- |
| Org A Owner | `aed0f3dd-…` | PASS — Attention unavailable |
| Org A Staff | same | PASS — Attention unavailable |
| Org A Viewer | same | PASS — Attention unavailable |

No NBA title, recommendation, signals, destination, or foreign context exposed. Tenant existence/context leakage through NBA: **NO**.

---

## 17. URL / failure safety

| Case | Result |
| --- | --- |
| Malformed Attention ID | PASS fail-closed |
| Valid-shaped nonexistent ID | PASS fail-closed |
| Foreign valid ID | PASS fail-closed |
| Archived inaccessible ID (Staff/Viewer) | PASS fail-closed |
| Missing destination | accepted via automated evidence |

No differentiated NBA existence leak observed.

---

## 18. Determinism (refresh)

| Fixture | NBA after refresh |
| --- | --- |
| F1-SEVERITY | `acknowledge_attention` |
| F1-ACK | `assign_attention_owner` |
| NBA-Q Review Progress | `review_progress` |
| NBA-Q Open Enrollment | `open_enrollment` |

**PASS** — exactly one primary NBA where active; no duplicate; no render-time persistence.

---

## 19. Desktop / mobile

| Viewport | Result |
| --- | --- |
| ~1280×800 desktop | PASS |
| ~390×844 mobile | PASS |

Recommendation readable; CTA/note usable; section order intact; no NBA-specific overflow regression.

Known historical Attention horizontal overflow remains present — **pre-existing / non-blocking / not caused or worsened by NBA based on R1 evidence**. Not claimed fixed.

---

## 20. Accessibility

Production smoke: **PASS**

- semantic NBA region/section
- heading structure
- meaningful native links
- fragment handoff
- keyboard-reachable links
- no autofocus / no obvious focus trap
- Viewer restriction conveyed as text (not color only)

Deeper assurance: existing NBA-U automated accessibility tests.

---

## 21. Data minimisation

NBA presentation limited to safe fields: recommendation title, explanation, CTA, Viewer read-only note.

No presentation leak of: raw signal JSON, stale-progress evidence note, rule key, evidence kind, assignee UUID, private notes.

**PASS**

---

## 22. Zero-automatic-execution (NBA-R1 scope)

This section applies to **NBA-R1 only**. Fixture-creation writes from earlier **NBA-Q fixture preparation** are out of R1 scope and are not denied by this claim.

| Action (during R1) | Attention writes |
| --- | --- |
| Detail render | 0 |
| Refresh | 0 |
| Fragment handoff | 0 |
| Navigation CTA / authorized direct nav | 0 |
| Browser back | 0 |
| Viewer render | 0 |

NBA remains **recommendation / handoff only** — not Decision and not autonomous Execution.

---

## 23. Event / audit invariant

| Moment | Org A | Org B |
| --- | --- | --- |
| R1 start | 7 / 8 / 25 | 1 / 1 / 1 |
| R1 end | 7 / 8 / 25 | 1 / 1 / 1 |
| Delta | **0** | **0** |

No NBA-specific viewed / clicked / accepted / followed events created.

**PASS**

---

## 24. External side-effect invariant

No observed: email, SMS, notification, webhook, AI invocation, billing, Task creation, Progress/Enrollment/Customer/membership mutation.

**PASS**

---

## 25. Regression evidence

```text
npm run test:run
PASS — 254 files / 1744 tests
```

Typecheck / lint / build were not unnecessarily rerun during R1 because:

- deployed/source SHA unchanged
- worktree clean
- NBA-Q deployment gate already passed them for the exact deployed SHA

Recorded as evidence reuse, not missing validation.

---

## 26. Final catalog assurance

| Catalog entry | Production / assurance |
| --- | --- |
| `acknowledge_attention` | Production **PASS** |
| `assign_attention_owner` | Production **PASS** |
| `review_progress` | Production **PASS** |
| `open_enrollment` | Production **PASS** |
| `open_customer` | Production fixture **NO** · Automated assurance **PASS / accepted** |
| terminal null | Production **PASS** |
| archived null | Production **PASS** |
| tenant isolation | Production **PASS** |

---

## 27. Final security matrix

| Check | Result |
| --- | --- |
| Viewer mutation recommendation safety | PASS |
| Staff capability preservation | PASS |
| Owner capability preservation | PASS |
| Unauthorized archive | PASS |
| Foreign tenant — Owner | PASS |
| Foreign tenant — Staff | PASS |
| Foreign tenant — Viewer | PASS |
| Malformed ID | PASS |
| Nonexistent ID | PASS |
| Missing destination fail-closed | PASS |
| Raw data leakage | PASS |
| Wrong recommendation priority | PASS |
| Duplicate recommendation | PASS |
| Automatic execution | PASS |
| Refresh determinism | PASS |
| Navigation authorization | PASS |
| Event invariant | PASS |
| External side effects | PASS |

---

## 28. Limitations / non-blocking deviations

1. **Cursor shared browser authentication** caused session-role drift during early R1 attempts.
   Mitigation: roles re-proved from fully hydrated live capability state and executed sequentially.
   Classification: tooling/session-management — not product authorization failure.

2. **Cursor browser** sometimes did not follow an in-page navigation CTA.
   Mitigation: CTA `href` verified + authorized direct destination navigation verified.
   Classification: non-blocking browser-tool deviation.

3. **Org B Owner own-tenant smoke** was optional and not required for R1 closure because Owner/Staff/Viewer cross-tenant denial was proven.

---

## 29. Production / Git closure state

| Field | Value |
| --- | --- |
| HEAD / upstream (runtime verified) | `79af4cfd14f17f593cd74b5f4492e8a29228a0c2` |
| Divergence at R1 verification | `0 0` |
| Worktree before this doc creation | clean |
| Alias | `https://zyntixai.vercel.app` |
| Deployment | `dpl_HMjddXSMVe1b1XL3ZFywm6ZCKrVs` · Ready |
| Runtime SHA | `79af4cfd14f17f593cd74b5f4492e8a29228a0c2` |

No R1 redeploy. No R1 DB/schema change.

---

## 30. Formal closing statement

```text
NBA-R1 PASS —
CONTROLLED PRODUCTION BROWSER / SECURITY / REGRESSION VERIFICATION COMPLETE

READ-ONLY R1 VERIFIED

ORG A:
7 ITEMS / 8 SIGNALS / 25 EVENTS

ORG B:
1 ITEM / 1 SIGNAL / 1 EVENT

EVENT DELTA:
0

NBA PRODUCTION BROWSER / SECURITY VERIFICATION COMPLETE FOR:

ATTENTION → NEXT BEST ACTION

NBA-PUB NOT STARTED

COURSE SELLERS BETA 1 NOT YET DECLARED COMPLETE
```

---

## 31. Next gate

```text
NEXT SAFE STEP:
OWNER APPROVAL FOR NBA-R1 DOCS-ONLY PUBLICATION

then, only after that separate approval:
NBA-R1 EVIDENCE PUBLICATION (docs-only commit/push)

then:
NBA-PUB PREPARATION / FINAL PRODUCTION GATE
```

None of the later gates are marked complete by this document. NBA-PUB remains unstarted. Course Sellers Beta 1 remains not declared complete.
