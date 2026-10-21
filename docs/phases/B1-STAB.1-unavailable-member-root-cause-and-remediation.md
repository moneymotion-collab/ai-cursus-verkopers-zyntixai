# B1-STAB.1 — Unavailable Member Root-Cause and Remediation

| Field | Value |
| --- | --- |
| Phase | B1-STAB.1 — Unavailable Member Root-Cause and Remediation |
| Document type | Stabilization root-cause, remediation and evidence report |
| Date | 2026-07-27 |
| Branch | `core/platform-readiness-20260707` |
| Desktop worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Start baseline | `e1c67536d0b4b08802e36acbb12866d88ab3ddb4` (`docs(progress): define B1.6 workspace contract`) |
| Laptop parallel work | `parallel/laptop-b1.6.1-typed-progress-foundation-20260727` (not modified by this phase) |
| Audit source | Existing B1.5 PROD-R1 / PROD-PUB / B1.5.6-R1-R2 / B1.5.7 conditions + repository code/DB contracts (no new broad historical audit) |

---

## 1. Git baseline (preflight)

| Item | Result |
| --- | --- |
| Worktree | `D:/project ai cursus verkopers.worktrees/parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `e1c67536d0b4b08802e36acbb12866d88ab3ddb4` |
| Upstream | same SHA |
| Divergence | `0 0` |
| Dirty inventory | empty |
| Worktrees | main checkout on `parallel/laptop-product-track-20260707`; this worktree on core branch |
| Laptop branch visibility | `remotes/origin/parallel/laptop-b1.6.1-typed-progress-foundation-20260727` present; no local B1.6.1 worktree on this machine |
| Last commit | `docs(progress): define B1.6 workspace contract` |

Preflight **PASS**. No reset/stash/clean/rebase/amend used.

---

## 2. Original production observation

From B1.5-PROD-R1 / B1.5-PROD-PUB:

```text
CONTROLLED PRODUCTION ENROLLMENT OWNER LABEL OBSERVED AS "UNAVAILABLE MEMBER" — CAUSE NOT DETERMINED IN B1.5-PROD-R1
```

Exact UI string: **`Unavailable member`**.

Context: controlled Enrolment (Customer × active Program), status Cancelled, not archived, source Manual; expected QA Staff display identity; record otherwise intact.

B1.5.6-R1-R2 already noted: selects often show **Team member** while detail shows **Unavailable member** for Staff/Viewer memberships without readable display names.

---

## 3. Expected vs actual behavior

### Expected

For a same-organization Enrollment `owner_member_id` that resolves to an existing `organization_members` row:

1. If the caller can read a non-empty `profiles.display_name` → show that name.  
2. If the membership is known but the profile name is empty **or not readable** → show the product convention **`Team member`** (already used by Enrollment create options and Tasks).  
3. If `owner_member_id` is null → **`Unassigned`**.  
4. If the membership id is not resolved inside the organization filter → **`Unavailable member`** (safe unresolved identity; no UUID leak).

### Actual (before fix)

Enrollment list/detail owner labels used `resolve-enrollment-labels.ts`, which mapped **both** “known membership without readable name” and “unresolved membership” to **`Unavailable member`**.

---

## 4. Reproduceerbaarheid

| Item | Detail |
| --- | --- |
| Route | `/enrollments/[enrollmentId]` (also list owner column via `/enrollments`) |
| Component | `enrollment-detail.tsx` / `enrollment-list.tsx` via loaders |
| Roles | Any role that can view the enrollment (Owner/Admin/Staff/Viewer per PE matrix) |
| Record | Enrollment with non-null `owner_member_id` pointing at Staff (or any co-member) |
| Tenant | Same org as viewer (QA org in production evidence) |
| Local / tests | Modeled in unit tests by returning membership rows and empty `profiles` result |
| Production | Observed in B1.5-PROD-R1 |

---

## 5. Bewezen root cause

### Primary (data visibility)

File: `supabase/migrations/20260705150004_enable_foundation_rls.sql`  
Policy: `profiles_select_own` — `using (id = auth.uid())`.

Authenticated users may select **only their own** profile. Co-member `display_name` values are not readable through ordinary `from("profiles")` queries.

### Presentation defect (Enrollment-specific)

File: `src/features/enrollments/server/resolve-enrollment-labels.ts`  
Functions: `resolveMemberLabels`, `resolveMemberLabel`, `normalizeLabel`.

Flow:

1. Load `organization_members` filtered by `organization_id` + ids.  
2. Load `profiles` for those `user_id`s.  
3. Before fix: missing profile row **or** empty `display_name` → **`Unavailable member`**.  
4. UI: `load-enrollment-detail-page.ts` / `load-enrollments-page.ts` → `ownerLabel`.

Meanwhile `load-enrollment-create-options.ts` already used **`Team member`** for the same membership/profile gap — causing the select-vs-detail inconsistency documented in B1.5.6-R1-R2.

### Not the cause

- Wrong owner UUID type (membership id is correct; assignment workflows worked).  
- Cross-tenant owner id on the controlled record (record remained intact in same QA org).  
- Enrollment RPC failure (detail otherwise correct).  
- Laptop/Progress code (untouched; denylist respected).

---

## 6. Impact

| Dimension | Assessment |
| --- | --- |
| Functional | Owner assignment and lifecycle worked; label resolution only |
| User | Misleading “Unavailable member” for known teammates |
| Security | No privilege escalation; profiles RLS intentionally restrictive |
| Tenant | Membership query remains org-scoped; no cross-tenant label leak found |
| Data integrity | Enrollment `owner_member_id` intact; issue is read/label mapping |

### Defect category (pre-fix)

```text
OPEN NON-BLOCKING
```

---

## 7. Scope contract

### Exact problem

Enrollment owner (and history actor) labels treat unreadable/empty co-member profiles as **`Unavailable member`**, conflicting with create-option **`Team member`** convention and B1.5 production observation.

### In-scope

- Correct Enrollment member-label fallback semantics.  
- Regression tests for the production-shaped empty-profile case.  
- This report.

### Out-of-scope

- Org-wide `profiles` SELECT policy or SECURITY DEFINER member-label RPC (schema).  
- Backfilling QA `display_name` data.  
- Customers/Leads label helpers (same RLS pattern; not the B1.5 production Enrollment observation).  
- Progress / B1.6.1 / nav / safe-return / generated types / migrations.  
- AI / NBA / health / Attention.

### Exact file allowlist (this remediation)

1. `src/features/enrollments/server/resolve-enrollment-labels.ts`  
2. `tests/server/enrollment-member-labels.test.ts` (new)  
3. `docs/phases/B1-STAB.1-unavailable-member-root-cause-and-remediation.md`

### Denylist (unchanged)

- `src/features/progress/**`  
- `src/components/app-shell.tsx`  
- `src/features/auth/server/safe-return-path.ts`  
- `tests/auth/safe-return-path.test.ts`  
- migrations / generated types / package files  

### Tests / browser / production / rollback / exit

- Tests: membership+name, empty name, RLS-empty profiles → Team member, missing membership → Unavailable, org scoping, null → Unassigned, no UUID leak.  
- Browser: required for full user-visible closure after deploy; not claimed executed here without QA session.  
- Production: required on `https://zyntixai.vercel.app` after controlled deploy; not executed in this phase (no deploy).  
- Rollback: revert the single Enrollment label commit.  
- Exit: targeted+full tests, typecheck, lint, build green; docs published; denylist clean; parallel safety recorded.

---

## 8. Remediation implemented

Smallest directed change in `resolve-enrollment-labels.ts`:

- Introduce `MEMBER_LABEL_TEAM = "Team member"`.  
- Found membership + missing/empty readable name → **`Team member`**.  
- Unresolved membership id → keep **`Unavailable member`**.  
- Null owner → **`Unassigned`**.  
- Preserve org-scoped membership query (no RLS weakening).

True co-member display-name resolution remains **blocked by `profiles_select_own`** until a separate schema/RPC contract.

---

## 9. Changed files

| Path | Change |
| --- | --- |
| `src/features/enrollments/server/resolve-enrollment-labels.ts` | Fallback semantics fix |
| `tests/server/enrollment-member-labels.test.ts` | New regression suite (7 tests) |
| `docs/phases/B1-STAB.1-unavailable-member-root-cause-and-remediation.md` | This report |

---

## 10. Validation evidence

| Check | Command / scope | Result |
| --- | --- | --- |
| Targeted tests | `npm run test:run -- tests/server/enrollment-member-labels.test.ts tests/server/enrollment-create-options.test.ts tests/ui/enrollment-page-loaders.test.ts` | **39 passed** |
| Typecheck | `npm run typecheck` | **exit 0** |
| ESLint (touched files) | `npx eslint src/features/enrollments/server/resolve-enrollment-labels.ts tests/server/enrollment-member-labels.test.ts` | **exit 0** |
| Diff check | `git diff --check` | **clean** |
| Full regression | `npm run test:run` | **195 files / 1392 tests passed** |
| Lint | `npm run lint` | **No ESLint warnings or errors** |
| Production build | `npm run build` | **exit 0** |

---

## 11. Browser evidence

Completed in follow-on phase **B1-STAB.1-R1-PROD** (2026-07-28) on `https://zyntixai.vercel.app` after controlled deploy/promote of `3df5519…` as `dpl_B4oArrKiKKbtPpqJSZ1UF3WKrCHU`.

| Journey | Result |
| --- | --- |
| Controlled cancelled Enrollment list owner | **`Team member`** (no longer **`Unavailable member`**) |
| Controlled cancelled Enrollment detail owner + history actors | **`Team member`** |
| Pending Enrollment null owner | **`Unassigned`** |
| Programs list | Loads for Production QA |
| Enrollments list | Loads; 2 records visible |

Details: `docs/phases/B1-STAB.1-R1-PROD-unavailable-member-production-verification.md`.

---

## 12. Production evidence

| Item | Result |
| --- | --- |
| Deployed SHA | `3df5519e744d6e7668e9ab8aa63e5f449a62495e` |
| Deployment | `dpl_B4oArrKiKKbtPpqJSZ1UF3WKrCHU` Ready |
| Alias | `https://zyntixai.vercel.app` → that deployment |
| Rollback | `dpl_GTK1vF4ERAuC7RC6ziDZke5btQ5M` remains Ready |
| Original observation | Remediated for known co-member owner (**Team member**) |

---

## 13. Rollback assessment

Low risk, documentation + single label helper + tests. Rollback = revert publication commit(s). No migration/data mutation to undo.

---

## 14. Parallel-safety assessment

| Check | Result |
| --- | --- |
| Progress paths touched | **No** |
| app-shell / safe-return touched | **No** |
| Laptop branch modified | **No** |
| Merge/rebase/cherry-pick of B1.6.1 | **No** |
| Overlap with laptop allowlist | **None** for changed files |

Desktop may continue publication of this stab slice. Laptop remains on start baseline `e1c6753…` for B1.6.1 until the later controlled integration window defined by the operator brief.

Earliest B1.6.1 integration remains **after** this stab is pushed, laptop finishes B1.6.1, and a new read-only overlap preflight passes.

---

## 15. Remaining conditions

1. **C-STAB-1:** Org-scoped readable co-member `display_name` requires a separate schema/RLS or SECURITY DEFINER label contract — not done here.  
2. **C-STAB-2:** Authenticated browser verification of Enrollment owner label after local/prod deploy.  
3. **C-STAB-3:** Production verification on primary alias after controlled deployment.  
4. **C-STAB-4:** Customers/Leads still use the older “Unavailable member” empty-profile fallback; out of this Enrollment stab scope.

---

## 16. Commits / push

| Item | Value |
| --- | --- |
| Commit SHA | `410fc89d16eb5d81acca27d847a8dfb366b0ef84` |
| Subject | `fix(enrollments): resolve unavailable owner labels` |
| Parent | `e1c67536d0b4b08802e36acbb12866d88ab3ddb4` |
| Push target | `origin/core/platform-readiness-20260707` |
| Push result | success (`e1c6753..410fc89`) |
| Post-push divergence | `0 0` |
| Post-push worktree | clean |

---

## 17. Final verdict

```text
B1-STAB.1 CLOSED WITH EVIDENCE
```

Root cause proven; Enrollment misleading fallback remediated and regression-tested; full automated gates green; controlled production deploy + authenticated Enrollment/Programs verification completed in B1-STAB.1-R1-PROD. Residual non-blocking conditions: schema-level co-member display names; Customers/Leads label helpers out of scope; Unavailable dangling-owner path covered by automated tests (no live dangling fixture).

---

## End of B1-STAB.1 report
