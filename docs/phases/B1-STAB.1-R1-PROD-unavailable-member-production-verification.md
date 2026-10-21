# B1-STAB.1-R1-PROD — Unavailable Member Production Verification

| Field | Value |
| --- | --- |
| Phase | B1-STAB.1-R1-PROD |
| Parent | B1-STAB.1 — Unavailable Member Root-Cause and Remediation |
| Date | 2026-07-28 |
| Branch | `core/platform-readiness-20260707` |
| Deployed Git SHA | `3df5519e744d6e7668e9ab8aa63e5f449a62495e` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |

---

## 1. Deployment evidence

| Item | Result |
| --- | --- |
| Workflow | Candidate `--skip-domain` then `vercel promote` (B1.4/B1.5 pattern) |
| Project / scope | `zyntixai` / `guus-projects-ai` |
| Candidate deployment | `dpl_B4oArrKiKKbtPpqJSZ1UF3WKrCHU` |
| Candidate URL | `https://zyntixai-fhmntsi6k-guus-projects-ai.vercel.app` |
| Candidate Ready | YES |
| Promote | Success onto primary alias |
| Primary alias | `https://zyntixai.vercel.app` → `dpl_B4oArrKiKKbtPpqJSZ1UF3WKrCHU` (Ready) |
| Rollback deployment | Previous production `dpl_GTK1vF4ERAuC7RC6ziDZke5btQ5M` remains Ready |
| Application mutations during verify | None (read-only browser journeys) |

---

## 2. Authenticated browser environment

| Item | Result |
| --- | --- |
| Alias | `https://zyntixai.vercel.app` |
| Organization display | **ZyntixAI Production QA** |
| Session | Existing authenticated Production QA session (masked; no credentials published) |
| Role evidence | Owner-capable session (Programs/Enrollments mutation CTAs historically Owner-aligned; no forms submitted) |
| Nav | Home → Leads → Customers → Programs → Enrollments → Tasks (no Progress nav) |

No emails, passwords, cookies, tokens, user IDs, or organization IDs are published in this report.

---

## 3. Journey results

### 3.1 Original controlled Enrollment (list)

| Field | Result |
| --- | --- |
| Environment | Production primary alias |
| Record | `B1.5.6 Lifecycle QA Customer` × `B1.5.2 QA Test Program`, status **Cancelled** |
| Expected | Known co-member owner without readable profile name → **`Team member`** |
| Actual | List item owner label **`Team member`** |
| Verdict | **PASS** — previous production string **`Unavailable member`** no longer appears for this known owner |

### 3.2 Original controlled Enrollment (detail + history)

| Field | Result |
| --- | --- |
| Expected | Owner and history actor labels use **`Team member`** for known memberships without readable co-member names |
| Actual | Detail **Owner: Team member**; status-history actors render **Team member** |
| Wrong identity | Not observed |
| Verdict | **PASS** |

### 3.3 Null owner case

| Field | Result |
| --- | --- |
| Record | Pending enrollment `zynrtix` × `B1.5.2 QA Test Program` |
| Actual | Owner **`Unassigned`** |
| Verdict | **PASS** |

### 3.4 Unresolvable membership → Unavailable member

| Field | Result |
| --- | --- |
| Production fixture with dangling owner id | **Not present** in current QA Enrollment set |
| Evidence | Automated regression `tests/server/enrollment-member-labels.test.ts` still proves unresolved in-org membership id → **`Unavailable member`** without UUID leak |
| Verdict | **PASS WITH AUTOMATED EVIDENCE** (no live dangling-owner fixture required to close the original observation) |

### 3.5 Programs regression

| Field | Result |
| --- | --- |
| `/programs` | Loads; org **ZyntixAI Production QA**; shows known QA programs including `B1.5.2 QA Test Program` |
| Verdict | **PASS** |

### 3.6 Enrollments regression

| Field | Result |
| --- | --- |
| `/enrollments` | Loads; showing 2 enrollments; filters and list intact |
| Verdict | **PASS** |

### 3.7 Cross-tenant / wrong identity

| Field | Result |
| --- | --- |
| Observation | Session remained on Production QA; no foreign-org labels or unexpected identity strings observed on Enrollments/Programs journeys |
| Verdict | **PASS** (spot-check; no destructive cross-tenant probing) |

---

## 4. Residual conditions (non-blocking for STAB closure)

1. True co-member `display_name` resolution still requires a separate schema/RPC contract (`profiles_select_own`).  
2. Customers/Leads label helpers were out of B1-STAB.1 Enrollment scope.  
3. No live production dangling-owner fixture was available; Unavailable path remains covered by automated regression.

---

## 5. STAB closure verdict

```text
B1-STAB.1 CLOSED WITH EVIDENCE
```

Original production observation remediated on the primary alias after controlled deploy of `3df5519…`, with authenticated Enrollment list/detail proof that known Staff/co-member ownership renders **`Team member`** instead of **`Unavailable member`**.

---

## End of B1-STAB.1-R1-PROD
