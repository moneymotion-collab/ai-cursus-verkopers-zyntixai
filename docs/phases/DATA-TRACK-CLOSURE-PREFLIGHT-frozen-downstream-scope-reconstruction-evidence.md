# DATA-TRACK-CLOSURE-PREFLIGHT — Frozen Downstream Scope Reconstruction

| Field | Value |
| --- | --- |
| Phase | **DATA-TRACK-CLOSURE-PREFLIGHT — FROZEN DOWNSTREAM SCOPE RECONSTRUCTION + BETA-1 CLOSURE DECISION** |
| Parent | DATA-1J-FV |
| Document type | Scope reconstruction / closure decision (no implementation) |
| Date | 2026-08-31 |
| Formal status | `DATA-TRACK-CLOSURE-PREFLIGHT CLOSED WITH EVIDENCE — FROZEN BETA-1 DATA CORE SCOPE COMPLETE` |
| Governing architecture | `docs/phases/DATA-1A-universal-business-data-intake-discovery.md` |
| Governing contract | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Governing last FV | `docs/phases/DATA-1J-FV-controlled-production-customer-import-execution-verification-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `e715d79abf7467cdb67cd896a496286940f9bd9f` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Production region | `eu-central-1` |
| Production status | `ACTIVE_HEALTHY` |
| Production QA organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Implementation / migration / Production writes | **none** |

This phase reconstructs the original frozen DATA v1 / Beta-1 core contract from repository evidence and decides whether another DATA implementation phase is required.

It does **not** implement DATA-1K, add a migration, change DATA behavior, or mutate Production.

**DATA BETA-1 FROZEN CORE SCOPE = COMPLETE**

**CUSTOMER CSV IMPORT CORE = END-TO-END PRODUCTION VERIFIED**

**DATA-1K = NOT REQUIRED BY FROZEN BETA-1 CONTRACT**

**PRE-EXISTING FROZEN DATA-1K DEFINITION = NONE**

**DATA TRACK = READY FOR FINAL CLOSURE VERIFICATION**

**PRODUCTION MUTATIONS ATTRIBUTABLE TO PREFLIGHT = 0**

---

## 1. Executive verdict

Decision **A**.

The original DATA-1A / DATA-1B frozen v1 contract required one governed engine that can take CSV/XLSX source material, map it, validate it, resolve Customer identity, freeze an immutable plan, obtain Owner/Admin approval, and execute create/link through existing domain writers with audit and idempotency. Customer is the only v1 executable adapter. UI, connectors, other domains, update/merge, and onboarding were explicitly later or out of DATA core.

That core is now implemented and Production-verified through DATA-1J-FV. The original planned `DATA-1-FV` “Controlled Production E2E” was delivered as a sequence of per-stage Production FVs ending in Customer create/link execution + replay.

No evidence-backed frozen DATA-core capability remains open. Remaining items are deferred by the frozen contract, belong to UX/onboarding/privacy/other tracks, or are Beta-2 / backlog. Unused schema (external links, lease columns, TTL eligibility) is future-compatible capacity, not invented scope.

This preflight does **not** start final DATA closure and does **not** start ONBOARDING-1A.

---

## 2. Purpose

Distinguish REQUIRED BETA-1 DATA CORE from optional hardening, Beta-2 / backlog, and new product ideas. Stop creating numbered DATA phases unless a frozen requirement remains.

---

## 3. DATA-1J-FV dependency

Authoritative prior verdict:

`DATA-1J-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION GOVERNED CUSTOMER IMPORT EXECUTION + ROW RESULTS VERIFIED`

`DATA-1J RELEASE READY WITH EVIDENCE`

`AUTHORIZED PRODUCTION CUSTOMER CREATE = EXACTLY 1`

`UNAUTHORIZED PRODUCTION CUSTOMER WRITES = 0`

Closure HEAD: `e715d79abf7467cdb67cd896a496286940f9bd9f`.

Implementation: `2c31b795689dd289cf3aac262cc879e71fb44982`.

---

## 4. Repository start state

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `e715d79abf7467cdb67cd896a496286940f9bd9f` |
| Subject | `docs(data): verify controlled Production customer import execution` |
| Upstream | `origin/core/platform-readiness-20260707` at the same SHA |
| Divergence | `0 0` |
| Status | clean |
| Staged / unstaged / untracked | none |
| `git diff --check` | clean |

---

## 5. Original DATA-1A scope

Source: `docs/phases/DATA-1A-universal-business-data-intake-discovery.md`.

DATA imports operational data into an already BQA-governed environment. Source data is not canonical until an approved plan executes through existing writers.

Frozen pipeline (§4): Source → session → artifact → parse → discover → propose map → human confirm → validate → normalize → resolve → detect duplicates/conflicts → review → immutable plan → explicit approval → canonical write → audit / reconciliation.

MVP DATA-1 before onboarding (§71):

**In:** CSV + XLSX, Customer adapter, mapping, validation, preview, duplicates, Owner/Admin approval, execution, audit, idempotency, tenant security.

**Out:** live connectors, two-way sync, mass overwrite, AI-autonomous import, universal undo, Party, Service/Field/Product entities, enrollment/progress import, invitation/member import.

Programs may follow as a later adapter, not a requirement to close the first FV.

Onboarding is future product/UI orchestration that *invokes* DATA primitives (§5, §72). Preview is a **read model** (“no UI now”, §26–27).

---

## 6. Original DATA-1B frozen contract

Source: `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md`.

v1 executable adapter: **Customers only** (§1). Eight tables. Customer sessions must have `business_activity_id IS NULL`. Operations: create / link / skip. **No update.** No silent merge. CSV may leave `data_external_record_links` empty. TTL is eligibility timestamps; a later worker performs cleanup, “not a legal policy” (§11). Worker vendor is **DEFERRED IMPLEMENTATION DETAIL** (§62). Staff prepare is **DEFERRED PRODUCT POLICY**. Programs adapter is **DEFERRED**.

Original recommended implementation sequence (§59) bundled later work into fewer phase numbers than the track actually used. That is sequencing, not missing capability.

---

## 7. Original Beta-1 acceptance criteria

The repository never uses a separate document titled “DATA Beta 1 acceptance.” The binding acceptance language is DATA-1A §71 (MVP In/Out), DATA-1A §73 (onboarding entry after Production verification of the engine), DATA-1B §1 / §64 (Customers only; create/link/skip), and DATA-1B §59 (`DATA-1-FV` = Controlled Production E2E).

DATA-1A §73: premium onboarding may consume DATA only after Production verification of:

intake session · safe parse · mapping confirmation · validation · preview · approval · canonical execution · audit · idempotency · tenant security.

That list is the closest original “done” definition for DATA core. It is backend/engine scope. It does not require mapping pages, approval pages, dashboards, other domains, or XLSX-specific Customer writes.

---

## 8. Authoritative DATA phase chain

DATA-1A/1B recommended: 1C foundation → 1D parse/map → 1E validate/duplicates → 1F plan/approve/execute → 1G Customer writer → 1-FV E2E.

Actual delivered chain (capabilities complete; numbers finer):

| Phase | Purpose | Frozen requirement | Impl | Production | Residual later superseded? |
| --- | --- | --- | --- | --- | --- |
| DATA-1A | Architecture discovery | pipeline + MVP In/Out | docs | n/a | no |
| DATA-1B | Schema/security contract | eight tables, Customer v1 | docs | n/a | no |
| DATA-1C | DB / RLS / Storage / session+source metadata | 1B §59 1C | yes | 1C-FV | parse/upload later |
| DATA-1C-FV | Production foundation | eight tables, RLS, private bucket, session/source | yes | yes | — |
| DATA-1D | Private upload + object verify | 1A storage + hash | yes | 1D-FV | parse later |
| DATA-1D-FV | Production upload/integrity | private object + SHA | yes | yes | — |
| DATA-1E | Secure CSV/XLSX parser + discovery | 1A/1B parse | yes | 1E-FV | mapping later |
| DATA-1E-R1 | Parsed-state cancel | 1A cancel | yes | 1E-FV | — |
| DATA-1E-FV | Production CSV+XLSX discovery | safe parse | yes | yes | — |
| DATA-1F | Semantic mapping + confirm | 1A map | yes | 1F-FV | validate later |
| DATA-1F-R1 | Mapping-state cancel | 1A cancel | yes | 1F-FV | — |
| DATA-1F-FV | Production mapping | confirmed mapping hash | yes | yes | — |
| DATA-1G | Value validation + staging | 1A validate/normalize; 1B staging | yes | 1G-FV | matching later |
| DATA-1G-FV | Production staging | validated rows | yes | yes | — |
| DATA-1H | Customer matching | 1A duplicates/resolution | yes | 1H-FV | plan later |
| DATA-1H-FV-PREFLIGHT | Fixture readiness | email-match fixture | docs | n/a | fixture prep |
| DATA-1H-FIXTURE-PREP | Synthetic match Customer | exact-email fixture | yes | yes (read) | — |
| DATA-1H-FV | Production matching | exact match + create candidate | yes | yes | — |
| DATA-1I | Plan + approval | 1A plan/approve | yes | 1I-FV | execute later |
| DATA-1I-FV | Production plan/approve/pre-exec cancel | immutable plan | yes | yes | — |
| DATA-1J | Execute create/link + row results | 1A execution/audit/idempotency; 1B writer | yes | 1J-FV | — |
| DATA-1J-FV | Production execution | canonical write + replay | yes | yes | — |

The original single `DATA-1-FV` is **SUPERSEDED** by the per-stage FV sequence. No capability from the original 1C–1G+FV plan remains unimplemented in DATA core.

---

## 9. DATA-1C coverage

Eight DATA tables, composite tenant FKs, RLS 8/8, private `data-intake`, session create + source metadata, service_role foundation RPC. Production: DATA-1C-FV. Residual parse/upload completed by 1D/1E.

---

## 10. DATA-1D coverage

Governed private upload, server-generated path, SHA-256 / size verification, no public access. Production: DATA-1D-FV.

---

## 11. DATA-1E coverage

Deterministic CSV/XLSX parser, structure discovery, formula/macro rejection, frozen limits. DATA-1E-R1 parsed cancellation. Production: DATA-1E-FV — **CSV and XLSX discovery**.

---

## 12. DATA-1F coverage

Code-owned Customer field registry, map/ignore/confirm, mapping snapshot hash, unresolved=0 gate. DATA-1F-R1 mapping-state cancel. Production: DATA-1F-FV.

---

## 13. DATA-1G coverage

Deterministic validation, normalized values, staging fingerprints, `ready_for_approval`. Production: DATA-1G-FV. Original 1B “DATA-1G Customer writer” landed in DATA-1J.

---

## 14. DATA-1H coverage

`customer-matcher-v1`, exact email duplicate→link, no-match→create, no merge, no Customer write. Fixture prep + Production: DATA-1H-FV.

---

## 15. DATA-1I coverage

Server-computed immutable plan + hash, Owner/Admin approval, approval replay, approved pre-execution cancel. Production: DATA-1I-FV. Execution excluded by design.

---

## 16. DATA-1J coverage

Execution-time revalidation, claim before effect, create via `private.create_customer_record(..., 'import')`, link = row result only, unique `(plan_id, row_fingerprint)`, replay. Production: DATA-1J-FV.

---

## 17. Production verification matrix

| Capability | Evidence | Production verified? |
| --- | --- | --- |
| Metadata intake (session/source) | DATA-1C-FV | YES |
| Private upload | DATA-1D-FV | YES |
| Object integrity | DATA-1D-FV / 1J-FV | YES |
| CSV discovery | DATA-1E-FV | YES |
| XLSX discovery | DATA-1E-FV | YES |
| Semantic mapping | DATA-1F-FV | YES |
| Validation | DATA-1G-FV | YES |
| Staging | DATA-1G-FV | YES |
| Exact match | DATA-1H-FV | YES |
| No match / create candidate | DATA-1H-FV | YES |
| Planning | DATA-1I-FV | YES |
| Approval | DATA-1I-FV | YES |
| Approved pre-execution cancel | DATA-1I-FV | YES |
| Execution-time revalidation | DATA-1J-FV | YES |
| Customer link | DATA-1J-FV | YES |
| Customer create | DATA-1J-FV | YES |
| Row results | DATA-1J-FV | YES |
| Execution replay | DATA-1J-FV | YES |

---

## 18. Current end-to-end Customer CSV capability

`CUSTOMER CSV IMPORT CORE = END-TO-END PRODUCTION VERIFIED`

Proven on Production by DATA-1J-FV session `860a5d20-1b55-4ef9-bbe4-9f2536071a9c`: verified CSV → map → stage → match → plan → approve → execute (1 link + 1 create) → two row results → replay with no second Customer.

---

## 19. XLSX scope analysis

DATA-1A §10 / §71 and DATA-1B §3 / §51 require **csv and xlsx as v1 source kinds** and a safe parser. They do not require a second Production Customer write via XLSX.

DATA-1E-FV Production-verified XLSX structure discovery. After parse, mapping/staging/matching/planning/execution consume discovered columns and fingerprints, not workbook bytes. Automated XLSX parser tests exist (`xlsx-structure.test.ts`). DATA-1J-FV executed CSV.

Classification: XLSX intake/discovery = **REQUIRED + COMPLETE**. Dedicated XLSX execution FV = **DEFERRED BY FROZEN CONTRACT** (shared pipeline; no separate frozen acceptance for a second canonical write).

---

## 20. Import-history / UI scope analysis

DATA-1A §26–27: preview **read model, no UI now**. Audit is reconstructable from plans + events + row results without permanent raw PII (§33–36). DATA-1B §2: those tables are the history foundation. No DATA phase was assigned import-history pages, plan-review pages, or failed-row UI.

Classification: audit/read-model = **REQUIRED + COMPLETE**. User-facing history/detail/error-download = **NOT IN FROZEN BETA-1 SCOPE** (UX / ONBOARDING-1A).

---

## 21. Retry / failure scope analysis

DATA-1B §42 freezes retry semantics on the same approved plan. DATA-1J implements and automates failure-before-claim, claim rollback, create/result rollback, retry preservation, and `completed_with_errors`. DATA-1J-FV did not induce Production failures (by contract). No operator retry UI is specified.

Classification: automated retry semantics = **REQUIRED + COMPLETE**. Production destructive failure FV and retry UI = **DEFERRED BY FROZEN CONTRACT** / UX backlog. BETA-1 BLOCKER = NO.

---

## 22. Batch / scale scope analysis

Frozen limits (DATA-1B §34; `src/features/data-intake/domain/constants.ts`): 10 MB, 10,000 rows, 50 columns, batch 100, sync constants 500 rows / 2 MB. DATA-1A §74 listed worker implementation as a **non-blocking** 1A decision. DATA-1B §62 deferred the worker vendor. DATA-1B §11 cleanup worker is later. DATA-1J batches in-process; no background worker.

Classification: frozen limits + batch model + small-import sync path = **REQUIRED + COMPLETE**. Background worker for medium files and 10k-row Production stress = **DEFERRED BY FROZEN CONTRACT**. No performance SLO exists in the frozen contract.

---

## 23. External-link scope analysis

DATA-1A §25 / DATA-1B §2: table is v1 schema; **may be empty for CSV**. DATA-1J: CSV create/link does not write links. No CRM/`source_system` integration is in MVP Out (connectors).

Classification: table present = **REQUIRED + COMPLETE** (schema capacity). External-source reimport identity = **NOT IN FROZEN BETA-1 SCOPE**.

---

## 24. Reconciliation / reimport scope

DATA-1A Out: two-way sync. External links “enable” re-import later. Deterministic email matching is not reconciliation, upsert, import diff, or historical dedupe.

Classification: **NOT IN FROZEN BETA-1 SCOPE** / **BETA-2 / BACKLOG**.

---

## 25. Customer-update import scope

DATA-1A §22–24: no mass UPDATE; `update-safe-fields` is a later capability. DATA-1B §45: **No update.**

Classification: **DEFERRED BY FROZEN CONTRACT**.

---

## 26. Dedupe / merge scope

DATA-1A: exact email = duplicate; name-only never auto-merge; v1 = CREATE or LINK or SKIP. DATA-1B §44–45: no merge.

Classification: duplicate detection/prevention = **REQUIRED + COMPLETE**. Customer merge = **NOT IN FROZEN BETA-1 SCOPE**.

---

## 27. Other target-domain scope

DATA-1B §1: not executable — leads, tasks, programs, enrollments, connectors, Party. DATA-1A: Customer first; Programs later, not required to close first FV.

Classification: **DEFERRED BY FROZEN CONTRACT** (programs) / **NOT IN FROZEN BETA-1 SCOPE** (others).

---

## 28. business_activity scope

DATA-1B §5: Customer v1 `business_activity_id` **MUST be NULL**. QA fixtures correctly used NULL.

Classification: **REQUIRED + COMPLETE** (null binding). Activity-scoped import = future adapter, not v1.

---

## 29. Mapping UX ownership

Backend mapping + confirm is DATA core and Production-verified. DATA-1B §60 excluded mapping UI from 1C and never assigned a mapping UI phase. DATA-1A: onboarding later; AI may label headers in a future UI.

Owner: **UX/UI / ONBOARDING-1A**. DATA core is not open for this.

---

## 30. Approval UI ownership

Human approval is a governed backend contract (real auth user, Owner/Admin, immutable hash). Production-verified in DATA-1I-FV. No approval-page phase exists in DATA-1A/1B.

Owner: **UX/UI / ONBOARDING-1A**.

---

## 31. Result visibility ownership

Durable `data_import_row_results` + events satisfy audit. Surfacing them in product UI is not a DATA-1A/1B page requirement.

Owner: **UX/UI**. DATA core remains complete.

---

## 32. Storage retention scope

DATA-1B §11: TTL is eligibility, later worker/cron, not a legal policy. Approved/importing sources are not eligible. Session delete is not a v1 product path. Eligibility columns exist.

Classification: eligibility contract = **REQUIRED + COMPLETE** (schema). Automatic delete worker = **DEFERRED BY FROZEN CONTRACT**. Do not treat retained QA objects as debt.

---

## 33. Synthetic fixture retention

Customer `30a496a3-6d0e-440c-bea1-479ca4acef1b` is intentional DATA-1J-FV evidence. No frozen requirement to clean it up. Cleanup would be an extra Customer mutation.

Classification: **NOT IN FROZEN BETA-1 SCOPE**. Do not invent DATA-1K cleanup.

---

## 34. Observability scope

DATA-1A §58–62 lists non-PII metrics conceptually. DATA-1B §57 allows metric labels. Events exist. No dashboard/alerting/stuck-import UI was assigned.

Classification: append-only events = **REQUIRED + COMPLETE**. Operational dashboard = **NOT IN FROZEN BETA-1 SCOPE**.

---

## 35. Security remaining scope

Frozen security (tenant RLS, Owner/Admin, service_role executor, private Storage, bounded RPCs, hashes, stale-plan protection, allowlist, no public storage) is implemented and Production-verified through 1C–1J-FV. DATA-1A malware scanning is **future, not v1 blocker**. No evidence-backed remaining DATA-core security requirement.

Classification: **REQUIRED + COMPLETE**. Generic “more security” is not a phase.

---

## 36. Privacy / compliance scope

DATA-1A: export/portability is out of DATA-1; provenance must not block it. TTL is not a legal policy (DATA-1B §11). GDPR erasure, export workflows, and PII masking products are not DATA-1 acceptance.

Owner: **Privacy/compliance** (separate track).

---

## 37. Multi-source scope

DATA-1B §9: at most one active source per session. Replacement supersedes; it does not attach many files.

Classification: **NOT IN FROZEN BETA-1 SCOPE**.

---

## 38. Parser-format parity

CSV and XLSX share discovery → mapping → staging → match → plan → execute. Format-specific work is the parser. CSV parser + XLSX parser are implemented; both discoveries are Production-verified; execution-domain tests and Production execution used CSV because that is the canonical Customer write path.

Classification: format parser verification = **REQUIRED + COMPLETE**. Duplicate XLSX execution Production test = not required.

---

## 39. Limits / performance scope

Current constants match DATA-1B §34. They satisfy the frozen contract. This phase does not raise limits. No SLO was frozen.

---

## 40. DATA core vs UX ownership

| Layer | Owner | Status |
| --- | --- | --- |
| DATA CORE FOUNDATION | DATA 1A–1J-FV | complete + Production verified |
| DATA USER EXPERIENCE | UX / ONBOARDING-1A | not started; not a DATA-core blocker |
| OTHER MODULE INTEGRATION | Customer module already used; Programs later | deferred |
| POST-BETA HARDENING | Beta 2 / backlog | listed below |

---

## 41. Open TODO / FIXME review

Searched `src/features/data-intake` and DATA phase docs for TODO, FIXME, DATA-1K, DATA-1L, deferred, not implemented, Beta 2, post-Beta.

Results: no TODO/FIXME in DATA intake source. Remaining “not implemented / future / DATA-1K” notes are phase-boundary leftovers (1J §95 later worker/mid-import cancel/external-id/TTL snapshots; 1A Out list; 1B deferred programs/worker/Staff). None is an authoritative open Beta-1 DATA-core requirement.

---

## 42. Pre-existing DATA-1K search

Repository hits:

- DATA-1J evidence §95 “Future DATA-1K boundary” — later workers, mid-import cancel, external-id links, staging-TTL snapshots; **out of DATA-1J**
- DATA-1J-FV — DATA-1K not started / not authorized

No prior phase defined DATA-1K as a frozen required capability.

`PRE-EXISTING FROZEN DATA-1K DEFINITION = NONE`

Do not fabricate one to continue numbering.

---

## 43. Original final acceptance criteria

Priority wording:

1. DATA-1A §71 MVP In/Out  
2. DATA-1A §73 onboarding-entry engine list  
3. DATA-1B §1 Customers-only executable surface  
4. DATA-1B §59 `DATA-1-FV` Controlled Production E2E  
5. DATA-1B §64 behavior rules  

The per-stage FVs through DATA-1J-FV satisfy (2) and (4). UI/onboarding is after DATA, not inside it.

---

## 44. Capability matrix

| Capability | Source | Beta-1 required? | Impl | Automated | Production | Evidence | Residual | Classification | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Session + source metadata | 1A/1B/1C | yes | yes | yes | yes | 1C-FV | none | REQUIRED + COMPLETE | close |
| Private Storage + verify | 1A/1D | yes | yes | yes | yes | 1D-FV | none | REQUIRED + COMPLETE | close |
| CSV discovery | 1A/1E | yes | yes | yes | yes | 1E-FV | none | REQUIRED + COMPLETE | close |
| XLSX discovery | 1A/1E | yes | yes | yes | yes | 1E-FV | none | REQUIRED + COMPLETE | close |
| Semantic mapping | 1A/1F | yes | yes | yes | yes | 1F-FV | none | REQUIRED + COMPLETE | close |
| Preview read model | 1A §26 | yes (no UI) | yes | yes | yes | 1G/1I-FV summaries | UI later | REQUIRED + COMPLETE | close |
| Validation + staging | 1A/1G | yes | yes | yes | yes | 1G-FV | none | REQUIRED + COMPLETE | close |
| Customer exact match | 1A/1H | yes | yes | yes | yes | 1H-FV | none | REQUIRED + COMPLETE | close |
| Create/link resolution | 1A/1B | yes | yes | yes | yes | 1H/1J-FV | none | REQUIRED + COMPLETE | close |
| Immutable plan + hash | 1A/1I | yes | yes | yes | yes | 1I-FV | none | REQUIRED + COMPLETE | close |
| Owner/Admin approval | 1A/1I | yes | yes | yes | yes | 1I-FV | none | REQUIRED + COMPLETE | close |
| Approved pre-exec cancel | 1A/1I | yes | yes | yes | yes | 1I-FV | none | REQUIRED + COMPLETE | close |
| Execution revalidation | 1B §52 | yes | yes | yes | yes | 1J-FV | none | REQUIRED + COMPLETE | close |
| Customer create | 1A/1J | yes | yes | yes | yes | 1J-FV | none | REQUIRED + COMPLETE | close |
| Customer link (no update) | 1A/1J | yes | yes | yes | yes | 1J-FV | none | REQUIRED + COMPLETE | close |
| Row results + uniqueness | 1B §2 | yes | yes | yes | yes | 1J-FV | none | REQUIRED + COMPLETE | close |
| Execution replay | 1A/1B | yes | yes | yes | yes | 1J-FV | none | REQUIRED + COMPLETE | close |
| Audit events | 1A/1B | yes | yes | yes | yes | 1J-FV | none | REQUIRED + COMPLETE | close |
| Tenant/RPC security | 1A/1B | yes | yes | yes | yes | 1C–1J-FV | none | REQUIRED + COMPLETE | close |
| Eight tables + RLS | 1B | yes | yes | yes | yes | 1C-FV/1J-FV | none | REQUIRED + COMPLETE | close |
| External-link **table** | 1B §2 | yes (may be empty) | yes | yes | yes (empty) | 1C/1J | unused CSV | REQUIRED + COMPLETE | keep unused |
| Customer `activity` NULL | 1B §5 | yes | yes | yes | yes | all FVs | none | REQUIRED + COMPLETE | close |
| Frozen file/row limits | 1B §34 | yes | yes | yes | n/a | constants | none | REQUIRED + COMPLETE | keep |
| Automated retry semantics | 1B §42 | yes | yes | yes | architectural | 1J tests | no Prod crash | REQUIRED + COMPLETE | close |
| XLSX Customer execute FV | inferred only | no | shared pipe | parser yes | discovery only | 1E-FV | none required | DEFERRED BY FROZEN CONTRACT | backlog |
| Background worker | 1A/1B deferred | no | no | n/a | no | 1B §62 | medium files | DEFERRED BY FROZEN CONTRACT | backlog |
| Mid-import `cancel_requested` | 1B §41 / 1J §95 | no for small sync | no | importing denied | pre-claim yes | 1I-FV/1J | worker-tied | DEFERRED BY FROZEN CONTRACT | backlog |
| TTL cleanup worker | 1B §11 | no (later worker) | timestamps only | n/a | no | 1B §11 | PII warehouse later | DEFERRED BY FROZEN CONTRACT | backlog |
| Mapping / approval / results UI | 1A “no UI now” | no | no | n/a | no | 1A §5/§26 | product UX | NOT IN FROZEN BETA-1 SCOPE | ONBOARDING-1A |
| Customer UPDATE import | 1A/1B no update | no | no | n/a | no | 1B §45 | — | DEFERRED BY FROZEN CONTRACT | Beta 2 |
| Merge / dedupe write | 1A never auto-merge | no | detect only | yes | detect yes | 1H-FV | — | NOT IN FROZEN BETA-1 SCOPE | Customer module / Beta 2 |
| Reimport / sync | 1A Out | no | no | n/a | no | 1A §71 | — | NOT IN FROZEN BETA-1 SCOPE | Beta 2 |
| External-id integration | 1A connectors Out | no | table only | n/a | no | 1B §2 | — | NOT IN FROZEN BETA-1 SCOPE | Beta 2 |
| Programs/other domains | 1B §1 | no | no | n/a | no | 1B §62 | — | DEFERRED BY FROZEN CONTRACT | later adapter |
| Observability dashboard | metrics labels only | no | events only | n/a | no | 1B §57 | — | NOT IN FROZEN BETA-1 SCOPE | platform |
| GDPR/export/erasure | 1A export out | no | no | n/a | no | 1A §42–46 | — | NOT IN FROZEN BETA-1 SCOPE | privacy track |
| Multi-file session | 1B one active source | no | no | n/a | no | 1B §9 | — | NOT IN FROZEN BETA-1 SCOPE | backlog |
| Fixture cleanup | 1J-FV retain | no | no | n/a | no | 1J-FV | keep | NOT IN FROZEN BETA-1 SCOPE | do not cleanup |
| Malware scanning | 1A future | no | no | n/a | no | 1A §40 | — | DEFERRED BY FROZEN CONTRACT | backlog |
| DATA-1K as a phase | none frozen | no | no | n/a | n/a | 1J §95 note | — | SUPERSEDED / NO LONGER REQUIRED | do not invent |

`REQUIRED + OPEN` rows: **none**.  
`AMBIGUOUS — CONTRACT REVIEW REQUIRED` rows: **none**.

---

## 45. Required-complete items

All rows classified **REQUIRED + COMPLETE** in §44. That is the entire DATA-1A §71 / §73 engine plus DATA-1B Customer executable surface.

---

## 46. Required-open items

**None.**

No item met the evidence bar for REQUIRED + OPEN.

---

## 47. Deferred items

| Item | Why deferred | Track | Beta-1 blocker |
| --- | --- | --- | --- |
| XLSX execution FV | shared pipeline; discovery already Production-verified | optional hardening | NO |
| Background worker | 1B worker vendor deferred | Beta 2 / platform | NO |
| Mid-import cancel | tied to multi-batch worker; 1J future note | Beta 2 | NO |
| TTL cleanup worker | 1B later cron; not legal policy | platform | NO |
| Customer UPDATE import | 1A/1B later | Beta 2 | NO |
| Programs adapter | 1B deferred; not needed to close first FV | later DATA adapter | NO |
| Staff prepare mappings | deferred product policy | product | NO |
| Malware scan | 1A future, not v1 blocker | security backlog | NO |

---

## 48. Backlog

Discovered from repository evidence only. Each: BETA-1 BLOCKER = NO.

| Item | Why deferred | Recommended future track |
| --- | --- | --- |
| Mapping / plan / result UI | “no UI now”; onboarding later | ONBOARDING-1A / UX |
| Import history pages | audit tables exist; pages not specified | UX |
| Operator retry UI | retry is RPC/automated | UX |
| External-id CRM reimport | connectors Out; table capacity only | Beta 2 |
| Reconciliation / sync / upsert / diff | 1A Out | Beta 2 |
| Customer merge | never auto-merge | Customer module / Beta 2 |
| Other domains | 1B not executable | later adapters |
| High-volume / async execution | worker deferred | platform |
| Observability dashboard | labels only | platform |
| Privacy erasure/export | out of DATA-1 | privacy/compliance |
| Multi-source sessions | one active source | backlog |
| Synthetic fixture cleanup | intentional retention | do not schedule as DATA-1K |

---

## 49. Residual risks

Known acceptable Beta-1 residual risk (not missing requirements):

- operational scale above the small-import Production path
- failure-path coverage is automated, not a Production crash test
- long-term raw/staging retention until a later TTL worker
- execution is manually/server triggered, not a product UI
- future multi-domain adapters
- XLSX execution shares the CSV-proven domain path without a second Production create

---

## 50. Contract conflicts

| A | B | Conflict | Authority | Resolution |
| --- | --- | --- | --- | --- |
| DATA-1A §59 phase numbers (1D parse, 1F plan+execute, 1G writer) | Actual 1D upload / 1E parse / 1F map / 1G stage / 1H match / 1I plan / 1J execute | numbering only | later phase evidence + 1B capabilities still delivered | **SUPERSEDED** sequencing; not missing scope |
| DATA-1A medium files “background execution” | DATA-1B §62 worker deferred; 1A §74 worker non-blocking | how medium files run | DATA-1B freeze + 1A open decision | worker **DEFERRED**; not REQUIRED + OPEN |
| DATA-1A §25 external links “enables re-import” | DATA-1B “may be empty for CSV”; 1J no CSV links | usage vs table | 1B + 1J | table required; CSV usage optional |

No material unresolved ambiguity. Closure preflight is not blocked.

---

## 51. Production read-only status

| Check | Actual |
| --- | --- |
| Project | `dmctinrcjvsgmoxwwodw` / `eu-central-1` / `ACTIVE_HEALTHY` |
| DATA tables | 8, RLS 8/8 |
| DATA RPCs | 8 SECURITY DEFINER `apply_data_intake_*` functions present |
| Latest DATA ledger | `20260831044911` / `add_data_intake_customer_import_execution` once |
| Prior DATA-1I | `20260830165242` / `add_data_intake_import_planning_approval` |
| Customers global / QA | 117 / 7 |
| Created fixture | `30a496a3-6d0e-440c-bea1-479ca4acef1b` present |
| Link fixture | `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921` present |
| Sessions / sources / mappings / staging | 9 / 9 / 15 / 9 |
| Plans / row results / links / events / storage | 2 / 2 / 0 / 75 / 8 |

Counts match DATA-1J-FV after-state. DB-MIGRATION-DRIFT-01: remote versions are Management-API timestamps, not local filenames. Not repaired.

---

## 52. Production mutation non-effect

Read-only `get_project`, `list_migrations`, and SELECT counts only.

`PRODUCTION MUTATIONS ATTRIBUTABLE TO PREFLIGHT = 0`  
`CUSTOMER WRITES = 0`  
`DATA WORKFLOW WRITES = 0`  
`STORAGE WRITES = 0`  
`MIGRATION APPLIES = 0`

---

## 53. Targeted DATA tests

`npx vitest run tests/features/data-intake tests/security/data-intake`

**183 / 183 = 100%**

A first concurrent run timed out at 5s in `data-intake-runtime-isolation` while typecheck/lint also walked `src`. Isolated re-run: 183 passed. No code change.

`DATA TARGETED TEST SUCCESS RATE = 100%`

---

## 54. Typecheck

`npx tsc --noEmit` — PASS

---

## 55. Lint

`npx next lint` — PASS (0 warnings, 0 errors)

---

## 56. Full suite

`npx vitest run`

**3349 passed, 2 failed, 3351 total**

---

## 57. Historical failures

Unchanged:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Not repaired in this investigation.

---

## 58. New regressions

`NEW REGRESSIONS = 0`

---

## 59. Closure decision

**DECISION A — DATA CORE BETA-1 COMPLETE**

`DATA BETA-1 FROZEN CORE SCOPE = COMPLETE`

`CUSTOMER CSV IMPORT CORE = END-TO-END PRODUCTION VERIFIED`

`DATA-1K = NOT REQUIRED BY FROZEN BETA-1 CONTRACT`

`DATA TRACK = READY FOR FINAL CLOSURE VERIFICATION`

Final closure is **not** started in this phase.

---

## 60. Recommended next phase

Dedicated **DATA TRACK FINAL CLOSURE VERIFICATION** (docs/gates only), consolidating:

- contract coverage
- Production evidence chain
- migrations
- tests / security
- residual deferred scope
- release-readiness verdict

Do **not** invent DATA-1K or DATA-1L.  
Do **not** start ONBOARDING-1A automatically (DATA-1A §72).  
Do **not** run that closure in this phase.

---

## 61. Final Git state

Evidence-only commit. No implementation, migration, type, or Production change.

Expected after push: branch `core/platform-readiness-20260707`, upstream `origin/core/platform-readiness-20260707`, divergence `0 0`, clean worktree.

---

## 62. Final verdict

DATA-TRACK-CLOSURE-PREFLIGHT CLOSED WITH EVIDENCE — FROZEN BETA-1 DATA CORE SCOPE COMPLETE

DATA BETA-1 FROZEN CORE SCOPE = COMPLETE

CUSTOMER CSV IMPORT CORE = END-TO-END PRODUCTION VERIFIED

DATA-1K = NOT REQUIRED BY FROZEN BETA-1 CONTRACT

DATA TRACK = READY FOR FINAL CLOSURE VERIFICATION
