# SMM-R1-F — Controlled 3→5 Organization Closed-Beta Rollout — Evidence (Stage 1)

| Field | Value |
| --- | --- |
| Phase | **SMM-R1-F — Controlled 3→5 Organization Closed-Beta Rollout** |
| Stage | **Stage 1 only** — Production cohort discovery (read-only) |
| Date | 2026-08-19 |
| Formal status | `R1-F BLOCKED — REAL CLOSED-BETA COHORT NOT YET AVAILABLE` |
| R1-F closed? | **NO** |
| Parent | R1-E **CLOSED** (via R1-E-R2-P5 evidence) |
| Production project | `dmctinrcjvsgmoxwwodw` |

```text
R1-F BLOCKED — REAL CLOSED-BETA COHORT NOT YET AVAILABLE
```

R1-F remains paused. Do not enroll audit fixtures or fabricate organizations.

No enrollments. No promotions. No provider writes. No implementation/migration in Stage 1.

---

## 1. Executive status

Production currently contains **6** active organizations total. After excluding audit/fixture tenants and treating the internal QA org as the **existing control** (not a new enrollment), **zero** suitable real closed-beta customer candidates remain for a first wave of **+2**.

Even counting the internal isolation sibling as an optional Tier B companion would yield only **+1**, still short of the preferred first-wave cohort of **3 total** (1 control + 2 new).

Stage 1 therefore **cannot** recommend Stage-2 `approved` enrollments without fabricating orgs (forbidden) or enrolling audit fixtures (excluded).

---

## 2. Authoritative baseline

### Git

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `8fd4b8f9f2351dcf19f96f2ed335dac2ca86efaf` |
| Upstream/origin | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean (evidence draft may be untracked) |

### Binding R1 evidence (present under `docs/phases/`)

| Phase | Evidence file |
| --- | --- |
| R1 policy design | `SMM-R1-closed-beta-rollout-publishing-gate-policy-design.md` |
| R1-A | `SMM-R1-A-closed-beta-enrollment-foundation-evidence.md` |
| R1-A-R1 | `SMM-R1-A-R1-production-schema-entitlement-defense-evidence.md` |
| R1-B | `SMM-R1-B-platform-operator-enrollment-controls-social-read-model-evidence.md` |
| R1-C | `SMM-R1-C-closed-beta-customer-access-onboarding-ux-evidence.md` |
| R1-D | `SMM-R1-D-first-production-enrollment-evidence.md` |
| R1-E / R1-E-R2 / P5 | closed inside `SMM-R1-E-R2-P5-final-exact-authorized-provider-verification-evidence.md` |
| R1-E-R1 | `SMM-R1-E-R1-instagram-provider-4xx-diagnostic-hardening-evidence.md` |
| R1-E-R2 | `SMM-R1-E-R2-controlled-provider-failure-root-cause-verification-evidence.md` |
| R1-E-R2-P2 | `SMM-R1-E-R2-P2-authorized-publication-binding-execute-lock-hardening-evidence.md` |
| R1-E-R2-P4 | `SMM-R1-E-R2-P4-instagram-container-readiness-polling-hardening-evidence.md` |
| R1-E-R2-P5 | `SMM-R1-E-R2-P5-final-exact-authorized-provider-verification-evidence.md` |

### Production deployment

| Field | Value |
| --- | --- |
| www deploy | `dpl_GG5cBX3DL5nUqU1A8Tbf4Qj2kct7` (`zyntixai-r7evq2luj-…`) Ready |
| Includes | closed-beta UX · operator enrollment · exact UUID binding · one-shot windows · Prepare lock · readiness polling · R1-E-R1 diagnostics |
| P4 implementation | `e1c30b9` (on lineage; OFF redeploy after P5) |

---

## 3. Production safety state

| Check | Result |
| --- | --- |
| `SOCIAL_PUBLISHING_ENABLED` | **false** |
| publishing GUC | null/unset |
| `exec_at_rest` | **false** |
| active controlled windows | **0** |
| enrollments | **1** |
| org attempts (control) | **5** (unchanged since R1-E closure → provider-write delta **0**) |

---

## 4. Existing control organization

| Field | Value |
| --- | --- |
| Name | ZyntixAI Production QA |
| UUID | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Org status | active · onboarding complete |
| Enrollment | `publishing_allowed` |
| Audit events | **2** (intact) |
| Social workspace | yes (1) |
| Members | Owner 1 · Admin 1 · Staff 1 · Viewer 3 |
| Instagram connected/healthy | 1 / 1 · credential · `publish_image` · no reauth |
| Publications / attempts | 11 / 5 |
| Succeeded pubs | ≥1 (P5 exact authorized success) |
| Stage 1 mutation | **none** |

Listed as **Existing control organization** — not a new enrollment candidate.

---

## 5. Candidate discovery

Authoritative operator read model: `public.operator_list_social_closed_beta_organizations()` (active orgs only).

Production inventory: **6** active organizations (100% of `organizations` rows).

| Organization | UUID | Enrollment | Workspace | IG connected/healthy | Owner/Admin | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| ZyntixAI Production QA | `2fc07699-…` | publishing_allowed | yes | 1/1 | yes | **Control** |
| ZyntixAI Production QA Isolation | `fec38060-…` | not_enrolled | no | 0/0 | Owner only | Internal isolation sibling |
| __AUDIT_4_4G_R1 Org | `9e5970ff-…` | not_enrolled | no | 0/0 | Owner only | Audit fixture |
| __AUDIT_4_4G_R1 Org | `da55eebf-…` | not_enrolled | no | 0/0 | Owner only | Audit fixture (duplicate name) |
| PE Audit Org A pe44-fixed-audit | `02016e91-…` | not_enrolled | no | 0/0 | Owner+Admin+Staff+Viewer | PE audit fixture |
| PE Audit Org B pe44-fixed-audit | `e6e4c376-…` | not_enrolled | no | 0/0 | Owner+Admin+Staff+Viewer | PE audit fixture |

No secrets / emails / external IDs printed.

---

## 6. Eligibility model (applied)

Strong candidates need: active tenant · Owner authority · clear ownership · operational suitability for closed beta · preferably real customer (not audit) identity · Social onboarding feasible (workspace can be created during approved onboarding).

Diversity preference (existing vs fresh IG) is secondary to safety and legitimacy.

---

## 7. Exclusions

| Org | Tier | Reason |
| --- | --- | --- |
| `__AUDIT_4_4G_R1 Org` ×2 | **Excluded** | Platform audit fixtures; stale QA naming; would invalidate clean beta observations |
| `PE Audit Org A/B` | **Excluded** | Explicit PE audit tenants; not closed-beta customers |
| Fabricated orgs | **Forbidden** | Phase forbids creating fake customers to fill the cohort |

---

## 8. Candidate ranking (new enrollments only)

| Rank | Organization | UUID | Enrollment | Mgmt | Workspace | Instagram | Risk | Tier | Stage-2 action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| — | *(no suitable customer candidates)* | — | — | — | — | — | — | — | **Do not enroll** |
| Optional note | ZyntixAI Production QA Isolation | `fec38060-15b1-4de8-974c-29cefe7764e1` | not_enrolled | Owner only (no Admin backup) | none yet | none (good for fresh OAuth test) | Medium — internal sibling, not a real customer | **Tier B / not first-wave substitute** | Hold; only if owner explicitly wants internal isolation companion **after** real customers exist |

Suitable real closed-beta candidates found: **0**  
Still required for preferred first wave (3 total = control + 2 new): **2**

---

## 9. Recommended first wave

**Cannot recommend** Stage-2 enrollments of 2 additional orgs from current Production inventory without violating exclusion/fabrication rules.

Desired future state (once real orgs exist):

1. ZyntixAI Production QA — `publishing_allowed` (unchanged)
2. New org A — `approved`
3. New org B — `approved`

Provider writes for new orgs: **0** until separate Stage 5–6 gates.

Second wave (orgs 4–5): only after 3-org cohort proves isolation/onboarding/operator paths.

---

## 10. Initial enrollment policy

New orgs: `not_enrolled → approved` only (not `publishing_allowed`).

`approved` = Social onboarding + Instagram connect + Prepare allowed; Execute remains unavailable until later per-org promotion **and** global ON + controlled window.

---

## 11. Promotion criteria (`approved → publishing_allowed`)

Require all of: approved enrollment · active org · Owner/Admin · healthy Social workspace · IG connected/healthy · credential · no reauth · `publish_image` · durable Prepare · Activity UUID consistency · no severe Social incident · customer understands beta limits · **explicit operator/owner promotion** (never automatic).

---

## 12. Pause / revoke criteria

**Pause:** repeated provider failure · tenant mismatch · credential health · duplicates · permission restrictions · lifecycle inconsistency · investigation · user temporary stop.

**Revoke:** security/abuse · permanent non-participation · cannot meet beta requirements · contract violation (terminal per R1).

Stage 1: no pause/revoke mutations.

---

## 13. Publishing policy (document only)

Retain: global kill switch · per-org `publishing_allowed` · server-authoritative controlled window · exact UUID · max_execute_count · one-shot consume · B1.9 lifecycle · readiness polling · immediate OFF after controlled writes when policy requires.

Do **not** leave global publishing permanently ON for R1-F.

---

## 14. Incident response

- Pre-provider deterministic fail → no auto retry; diagnose  
- Provider 4xx → R1-E-R1 diagnostics; no blind retry  
- Ambiguous → `unknown_external_outcome`; no retry; operator review  
- Duplicate/concurrency → fail closed; pause if warranted  
- Auth mismatch → zero provider write; investigate before reopen  

---

## 15. Observability

R1-B operator list/detail already covers: enrollment · workspace · IG counts/health/credential/`publish_image` · active/queued pubs · Owner/Admin presence · last Social activity · enrollment events · available actions.

Stage 1 gap (non-blocking): no dedicated multi-org cohort “attention required” rollup dashboard — list+detail sufficient to start once candidates exist. Optional later: cohort-level counts of manual_intervention / unknown_external_outcome / active windows.

---

## 16. Tenant isolation review

Existing contracts: org-scoped workspaces, connections, publications, attempts, controlled windows, enrollments, Activity, customer RLS, operator service-role reads.

No RLS change proposed. Recommend targeted multi-org regression tests before Stage 2 (see §17).

---

## 17. Test coverage review

Present: enrollment domain gates · R1-A/R1-A-R1 entitlement · R1-B operator RPC security · R1-C UX states · P2 binding/Prepare lock · global OFF precedence · migration security.

Gaps before Stage 2 (define; implement if missing when Stage 2 is authorized):

1–5. Cross-org connection/publication/Activity/Execute/window bind denial  
6. Enrollment A does not affect B  
7–10. approved / publishing_allowed+OFF / not_enrolled / paused|revoked Execute blocks  
11–12. Member and Owner cannot self-promote  
13–15. Operator enroll exact org · single audit event · duplicate enroll fail-safe  
16–18. No provider write from enrollment/onboarding; global OFF dominates  

---

## 18. Known limitations

- Production lacks ≥2 legitimate non-audit customer organizations for first wave  
- Isolation sibling is internal-only and Owner-only (no Admin backup)  
- Audit tenants must not be enrolled to “fill the number”  
- No Stage 1 code/migration change required for multi-org **management** capability — blocker is **cohort supply**, not platform contracts  

---

## 19. Owner decision required

```text
R1-F BLOCKED — REAL CLOSED-BETA COHORT NOT YET AVAILABLE
```

| Metric | Value |
| --- | --- |
| Suitable real candidates found | **0** |
| Still required for first-wave cohort of 3 | **2** |
| Optional internal companion (not a substitute) | Isolation `fec38060-…` (Tier B) |

Exact next owner action: provision or identify **2 real Production organizations** (legitimate customers/partners), then re-run Stage 1 discovery / authorize Stage 2 enrollments to `approved`.

Do **not** fabricate orgs. Do **not** enroll audit fixtures.

---

## 20. Git state

| Field | Value |
| --- | --- |
| HEAD | `8fd4b8f9f2351dcf19f96f2ed335dac2ca86efaf` |
| Upstream/origin | identical |
| Divergence | `0 0` |
| Worktree | clean aside from this evidence draft if uncommitted |
| Evidence draft | this file — Stage 1; **R1-F not closed** |
| Commits | none required for Stage 1 discovery |

**STOP BEFORE ANY ENROLLMENT MUTATION. STOP BEFORE R1-F Stage 2.**
