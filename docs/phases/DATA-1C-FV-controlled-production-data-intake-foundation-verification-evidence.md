# DATA-1C-FV — Controlled Production Data Intake Foundation Verification

| Field | Value |
| --- | --- |
| Phase | **DATA-1C-FV — CONTROLLED PRODUCTION QA DATA INTAKE METADATA FIXTURE** |
| Parent | DATA-1C |
| Document type | Production verification evidence |
| Date | 2026-08-27 |
| Formal status | `DATA-1C-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION DATA INTAKE METADATA + SECURITY FOUNDATION VERIFIED` |
| Governing implementation | `docs/phases/DATA-1C-universal-business-data-intake-database-security-foundation-evidence.md` |
| Governing contract | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Architecture | `docs/phases/DATA-1A-universal-business-data-intake-discovery.md` |
| Branch | `core/platform-readiness-20260707` |
| Fixture start HEAD | `a554eedbeb76c39313f4822f936d70c0fa4a9df3` |
| Production schema | **APPLIED** (targeted MCP apply of the three frozen DATA-1C SQL files only; no `db push`, no repair; not reapplied this fixture run) |
| Production DATA tenant rows | **1 session / 1 source / 3 events** retained as durable QA evidence; session **cancelled** |

This phase verifies **only** the universal business data intake database + security foundation plus one controlled Production QA metadata fixture. It does **not** implement a parser, mapping engine, validation engine, import-plan approval, import execution, Customer writer changes, Customer creation through DATA, onboarding, or connectors.

**DATA INTAKE DATABASE FOUNDATION: PRODUCTION VERIFIED**

**DATA TABLES: 8 / 8 PRODUCTION VERIFIED**

**DATA RLS: 8 / 8 PRODUCTION VERIFIED**

**DATA STORAGE BUCKET: PRIVATE / PRODUCTION VERIFIED**

**OWNER/ADMIN GOVERNED DATA SESSION AUTHORITY: PRODUCTION VERIFIED**

**AUTHENTICATED DIRECT DATA DML: DENIED**

**SERVICE_ROLE AS HUMAN AUTHORITY: DENIED**

**CONTROLLED QA METADATA FIXTURE: PRODUCTION VERIFIED**

**CUSTOMER IMPORT: NOT IMPLEMENTED**

**PARSER: NOT IMPLEMENTED**

**OBJECT VERIFICATION / REAL FILE UPLOAD = NOT IMPLEMENTED — DATA-1D**

**PARSER / CUSTOMER IMPORT = NOT IMPLEMENTED**

**CANONICAL CUSTOMER MUTATION: 0**

**BQA MUTATION: 0**

**CONTEXT MUTATION: 0**

**ENTITLEMENT MUTATION: 0**

**SOCIAL EXECUTION: 0**

---

## 1. Owner authorization

Printed before any fixture mutation in this run:

`DATA-1C-FV CONTROLLED QA DATA INTAKE METADATA FIXTURE = AUTHORIZED`

This exact owner authorization applies **only** to the controlled DATA-1C-FV Production QA metadata fixture specified below:

- one session + one source metadata row;
- synthetic non-PII filename/size/SHA-256;
- no Storage upload;
- no CSV/XLSX parse;
- no Customer import;
- no canonical Customer writer change;
- governed `create_session` → `register_source` → `cancel_session` only.

Authorization was **not** inferred from DATA-1C implementation, typegen, or the earlier catalog/security close-out that retained zero DATA rows (`a554eedbeb76c39313f4822f936d70c0fa4a9df3`). That earlier close-out did not carry this fixture authorization string.

If this string had been absent, required blocker:

`DATA-1C-FV CONTROLLED QA DATA INTAKE METADATA FIXTURE = BLOCKED — OWNER AUTHORIZATION NOT PROVEN`

---

## 2. Repository start state

Proven immediately before fixture creation.

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `a554eedbeb76c39313f4822f936d70c0fa4a9df3` |
| Subject | `docs(data): record Production intake foundation verification` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `a554eedbeb76c39313f4822f936d70c0fa4a9df3` |
| Divergence | `0 0` |
| `git status` | clean |
| Staged | none |
| Unstaged | none |
| Untracked | none |
| `git diff --check` | clean |

Expected preflight HEAD `59f30d308b2dcb32b1bec69fd82404972cf50da1` (`chore(data): sync Production intake foundation types`) remains the last non-docs commit. The one subsequent commit `a554eedbeb76c39313f4822f936d70c0fa4a9df3` is the catalog/security evidence document written before this authorized fixture run. No unexpected repository mutation.

DATA-1C implementation files were not edited this run.

Remote migration latest unchanged: `20260827120815` `add_data_intake_storage_bucket`. No migration apply this phase.

---

## 3. Production project identity

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Postgres | `17.6.1.141` |
| Canonical app | `https://www.zyntixai.com` |
| QA organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Organization label | `ZyntixAI Production QA` |

No service-role JWT, database password, cookie, or access token is recorded here.

---

## 4. Pre-fixture DATA counts

Expected and observed before `create_session`:

| Table | Count |
| --- | --- |
| `data_intake_sessions` | 0 |
| `data_intake_sources` | 0 |
| `data_intake_mappings` | 0 |
| `data_intake_staging_rows` | 0 |
| `data_import_plans` | 0 |
| `data_import_row_results` | 0 |
| `data_intake_events` | 0 |
| `data_external_record_links` | 0 |

Shape: `0 / 0 / 0 / 0 / 0 / 0 / 0 / 0`. No unexpected pre-existing DATA rows. Exactly one fixture was created.

Eight DATA tables exist. No ninth DATA table (`data_import_jobs`, `data_import_plan_rows`, `data_mapping_templates`, `customer_import_staging` absent).

---

## 5. Pre-fixture Customer counts

| Scope | Count |
| --- | --- |
| Global `customers` | **116** |
| QA organization Customers | **6** |

---

## 6. Pre-fixture Storage counts

| Check | Value |
| --- | --- |
| Bucket | `data-intake` |
| `public` | **false** |
| File size limit | 10485760 (10 MB) |
| Objects | **0** |

No file was uploaded before, during, or after the fixture.

---

## 7. Actor identity / role evidence

Legitimate active Owner of the QA organization used as human authority. The executor JWT role was set to `service_role` so `auth.role()` matches the frozen RPC executor. The actor identity remained the real membership user, not `service_role`.

| Field | Value |
| --- | --- |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Membership | `6d8c8c91-39ff-4f26-86c8-5ec712b8c4f0` |
| User | `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| Role | `owner` |
| Membership status | `active` |

An Admin membership `dcfd1e22-c1fc-4179-9e9d-ca3e44a4ec77` exists in the same org. It was **not** used to create a second session.

No email, name, or other PII is recorded here.

---

## 8. Session creation

Governed operation `create_session` via `public.apply_data_intake_foundation_mutation`. Payload: `target_domain=customer`, `source_kind=csv`, **no** Business Activity.

| Field | Value |
| --- | --- |
| Result | `ok=true` |
| Session ID | `b9ee53d7-b2a1-46c6-92e7-9f44a41a3dc9` |
| Status after create | `created` |
| Target domain | `customer` |
| `business_activity_id` | **NULL** |
| Source kind | `csv` |
| Created by | `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| Created at | `2026-08-27 12:42:22.136321+00` |
| Event | `intake_created` `f6a59f49-ffc6-4c2a-94c0-104602ff200a` |
| Event metadata | `{source_kind, target_domain}` only |

Actor is the Owner user, not the service-role executor.

---

## 9. Source registration

Governed operation `register_source`. Metadata only. **No Storage upload.** Filename is metadata, not a security boundary. Product API / RPC does not accept a client-supplied Storage path; the RPC generated `v_path`.

Synthetic file metadata (not a real customer file):

- original filename: `qa_data_intake_foundation_v1.csv`
- MIME: `text/csv`
- byte size: `29`
- SHA-256 of synthetic payload `qa_data_intake_foundation_v1\n`: `9044f8ae07c68ecaaadeebe01c45134c6cf80581a7baf36b0fcbeadd87f281d6`

| Field | Value |
| --- | --- |
| Result | `ok=true` |
| Source ID | `0b1fca8d-7bb7-4be3-815b-cca3008aa231` |
| Session status after register | `source_ready` |
| Storage bucket metadata | `data-intake` |
| Generated object ID | `62ae3794-6286-4ba5-9577-b2db6364c851` |
| Generated storage path | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb/b9ee53d7-b2a1-46c6-92e7-9f44a41a3dc9/0b1fca8d-7bb7-4be3-815b-cca3008aa231/62ae3794-6286-4ba5-9577-b2db6364c851.csv` |
| `superseded_at` / `expires_at` | NULL |
| Event | `source_uploaded` `a484b9a0-c203-44d5-aa8c-6086f596efd9` |
| Storage objects after register | **0** |

Path matches frozen `{organization_id}/{session_id}/{source_id}/{generated_object_id}.csv`.

---

## 10. Generated IDs

| Kind | ID |
| --- | --- |
| Session | `b9ee53d7-b2a1-46c6-92e7-9f44a41a3dc9` |
| Source | `0b1fca8d-7bb7-4be3-815b-cca3008aa231` |
| Generated object ID (metadata only) | `62ae3794-6286-4ba5-9577-b2db6364c851` |
| Event `intake_created` | `f6a59f49-ffc6-4c2a-94c0-104602ff200a` |
| Event `source_uploaded` | `a484b9a0-c203-44d5-aa8c-6086f596efd9` |
| Event `import_cancelled` | `e0774276-5971-46f6-9e73-91c3f7032cb4` |

---

## 11. Customer Activity NULL verification

Hard Production contract: `target_domain = customer` requires `business_activity_id IS NULL`. Activity is not silently erased.

| Layer | Proof |
| --- | --- |
| Live fixture session | `business_activity_id IS NULL` |
| CHECK | `data_intake_sessions_customer_activity_null_check` |
| RPC LIVE (Owner + QA Activity `3612fd93-d1a1-491f-ba29-56fba767c55b`) | `ACTIVITY_NOT_ALLOWED_FOR_TARGET` — `Customer intake must not bind a Business Activity` |
| Session delta from the failed probe | **0** (sessions remained **1**, the authorized fixture only) |

No failed Customer+Activity session row was left behind.

---

## 12. Negative actor checks

All executed through the governed RPC with `service_role` as executor and the named human actor. No extra DATA rows.

| Actor | Result |
| --- | --- |
| Staff `158f8c4c-096b-4a30-9221-f661e22d8f27` | `FORBIDDEN_ROLE` |
| Viewer `000a32a0-7b77-40f2-9341-0d1590e9cf19` | `FORBIDDEN_ROLE` |
| Suspended Viewer `432b7c51-7c0b-4347-9fe5-305a41731498` | `UNAUTHORIZED` |
| Foreign Owner (org `02016e91-7237-4a20-aec3-6275d2e8a67f`) targeting QA org | `UNAUTHORIZED` |
| Owner + Customer + non-NULL Activity | `ACTIVITY_NOT_ALLOWED_FOR_TARGET` |

`service_role` is executor infrastructure. Staff + executor JWT still returned `FORBIDDEN_ROLE`. Executor ≠ authority.

---

## 13. Event verification

Exactly three foundation events were created by the governed operations. No synthetic extra events.

| When (UTC) | Type | Event ID | Actor |
| --- | --- | --- | --- |
| 2026-08-27 12:42:22.136321 | `intake_created` | `f6a59f49-ffc6-4c2a-94c0-104602ff200a` | Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| 2026-08-27 12:42:52.937118 | `source_uploaded` | `a484b9a0-c203-44d5-aa8c-6086f596efd9` | same Owner |
| 2026-08-27 12:44:02.921232 | `import_cancelled` | `e0774276-5971-46f6-9e73-91c3f7032cb4` | same Owner |

Chronology matches create → register → cancel. All events belong to QA org + session `b9ee53d7-b2a1-46c6-92e7-9f44a41a3dc9`.

Payloads contain only foundation metadata (`source_kind`, `target_domain`, sha256/size/mime/source_id, cancelled status). No names, emails, phones, addresses, or financial data.

Immutability:

- triggers `data_intake_events_immutable_update` / `data_intake_events_immutable_delete` enabled;
- `service_role` has INSERT/SELECT on events, not UPDATE/DELETE;
- `authenticated`/`anon` have no event DML;
- LIVE probe UPDATE/DELETE on `intake_created` was caught by the immutability guard; event count remained **3**; payloads unchanged after the probe.

No UPDATE/DELETE capability was introduced.

---

## 14. Source metadata verification

Exactly one source row for the fixture session.

| Field | Live value |
| --- | --- |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Session | `b9ee53d7-b2a1-46c6-92e7-9f44a41a3dc9` |
| Kind | `csv` |
| Original filename | `qa_data_intake_foundation_v1.csv` |
| MIME | `text/csv` |
| Byte size | 29 |
| SHA-256 | `9044f8ae07c68ecaaadeebe01c45134c6cf80581a7baf36b0fcbeadd87f281d6` |
| Storage path | generated four-segment path above |
| PII in metadata | none |

Tenant relationships LIVE: session org FK ok; source org matches session org; source session FK ok; events org match; foreign-org events **0**; foreign-org sources **0**. Composite tenant FKs make a child row pointing at another org’s session structurally impossible.

No file was uploaded. No source content exists in Storage.

---

## 15. Storage non-effect

| Moment | `data-intake` objects |
| --- | --- |
| Before fixture | 0 |
| After session + source metadata | 0 |
| After cancellation / final state | 0 |

Bucket remains `public=false`. Path is metadata only. **No object appeared.**

`OBJECT VERIFICATION / REAL FILE UPLOAD = NOT IMPLEMENTED — DATA-1D`

---

## 16. Customer non-effect

| Scope | Before | After | Delta |
| --- | --- | --- | --- |
| Global Customers | 116 | 116 | **0** |
| QA organization Customers | 6 | 6 | **0** |

No Customer writer invocation. No Customer import operation exists in DATA-1C. No DATA FK to `customers`. No `data_external_record_links` row. Canonical Customer writer was not modified.

---

## 17. Cancellation

Governed `cancel_session` (not raw SQL status update) with the same Owner actor.

| Field | Value |
| --- | --- |
| Result | `ok=true` |
| Status | `cancelled` |
| Event | `import_cancelled` `e0774276-5971-46f6-9e73-91c3f7032cb4` |
| `cancelled_at` | `2026-08-27 12:44:02.921232+00` |
| `cancel_requested` | `false` (immediate governed cancel, not a pending request) |

Session and source rows were **retained** as durable Production evidence. They were not deleted to restore zero counts.

Post-cancel `register_source` on the same session: `INVALID_STATE` — `Source metadata can be registered only before parse`. Sources remained **1**. The cancelled session cannot incorrectly continue into parser/import states (parser/import RPCs do not exist in DATA-1C).

---

## 18. Final session state

| Field | Value |
| --- | --- |
| Session ID | `b9ee53d7-b2a1-46c6-92e7-9f44a41a3dc9` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Target domain | `customer` |
| Business Activity | **NULL** |
| Source kind | `csv` |
| Status | **`cancelled`** |
| Created by | Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| Created at | `2026-08-27 12:42:22.136321+00` |
| Updated / cancelled at | `2026-08-27 12:44:02.921232+00` |
| Parser state/results | none |
| Mapping | none |
| Staging rows | none |
| Import plan | none |
| Row results | none |
| External links | none |

---

## 19. Final DATA counts

| Table | Before | After |
| --- | --- | --- |
| `data_intake_sessions` | 0 | **1** |
| `data_intake_sources` | 0 | **1** |
| `data_intake_mappings` | 0 | **0** |
| `data_intake_staging_rows` | 0 | **0** |
| `data_import_plans` | 0 | **0** |
| `data_import_row_results` | 0 | **0** |
| `data_intake_events` | 0 | **3** |
| `data_external_record_links` | 0 | **0** |

Events = 3 (`intake_created`, `source_uploaded`, `import_cancelled`) generated only by governed operations.

---

## 20. Final Customer counts

| Scope | Before | After | Delta |
| --- | --- | --- | --- |
| Global | 116 | 116 | 0 |
| QA org | 6 | 6 | 0 |

No unrelated concurrent Customer activity observed.

---

## 21. Final Storage counts

`data-intake` objects: **0**.

---

## 22. Unrelated domain non-effects

Inspected after fixture cancellation. No DATA-attributable mutation.

| Domain | Value | Delta vs previous snapshot |
| --- | --- | --- |
| TAX | `1 / 4 / 22 / 1 / 0 / 0 / 2` | 0 |
| CAP | `13 / 7 / 13` | 0 |
| CTX | `2 / 2 / 10 / 4 / 2` | 0 |
| Memberships | 22 | 0 |
| Invitations | 16 | 0 |
| Path B `/register` | fail-closed: “Public registration is currently unavailable” | unchanged |
| Social publishing | `private.social_publishing_execution_enabled()` = **false** | 0 |
| Social scheduling GUC | unset / OFF | 0 |
| Cron | `zyntixai_social_publication_scheduler_5m` `*/5 * * * *` active | unchanged |

None of these were mutated by this phase.

---

## 23. Targeted tests

`npx vitest run` on DATA domain/security files:

**33 passed / 33 total.**

Files:

- `tests/security/data-intake-foundation-migration-security.test.ts` (schema, constraints, RLS SQL)
- `tests/security/data-intake-storage-migration-security.test.ts` (Storage privacy)
- `tests/security/data-intake-service-role-separation.test.ts` (bounded executor)
- `tests/security/data-intake-1c-server-isolation.test.ts` (no public API / parser / import executor)
- `tests/security/data-intake-runtime-isolation.test.ts`
- `tests/features/data-intake/foundation-commands.test.ts` (RPC auth, actor defense, Customer Activity NULL, tenant isolation, source metadata, cancel)
- `tests/features/data-intake/domain.test.ts`

Coverage includes DATA schema, constraints, RLS, RPC authorization, actor defense, Customer Activity NULL invariant, tenant isolation, event immutability (SQL/triggers), source metadata, Storage privacy, service-role bounded execution, and absence of Customer import functionality.

---

## 24. Full-suite results

`npx vitest run`:

**3199 passed, 2 failed, 3201 total.**

The only failures are the accepted historical pair:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No third failure.

---

## 25. Typecheck / lint / build

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (0 warnings) |
| `git diff --check` | clean |
| `next build` | not part of DATA-1C / DATA-1C-FV closure convention |

---

## 26. Risks / residual limitations

No Production defect requiring DATA-1C-FV-R1 was found during the fixture. No silent implementation fix was made inside FV.

Accepted residual risks (not defects):

- FORCE RLS is **false**; deny-by-default relies on zero policies + revoked grants.
- `data_external_record_links.target_record_id` is polymorphic; same-tenant target proof is DATA-1F/1G.
- Source SHA-256 is internal metadata; object-bytes verification is DATA-1D.
- `sources.expires_at` may remain NULL until a later worker.
- Generated Storage path exists as metadata without a corresponding object (intentional for this metadata-only fixture).
- `cancel_requested` remains `false` after immediate `cancel_session` (governed command completes cancel rather than parking a request flag).

---

## 27. Explicit DATA-1D boundary

The following remain **NOT IMPLEMENTED** and were not started:

- real file upload
- Storage object verification using a real upload
- CSV parser
- XLSX parser
- workbook/sheet discovery
- header detection
- schema inference
- field mapping
- validation engine
- duplicate resolution
- Customer import
- Customer writer integration
- import execution
- external record linking
- mass update
- autonomous AI import

`OBJECT VERIFICATION / REAL FILE UPLOAD = NOT IMPLEMENTED — DATA-1D`

`PARSER / CUSTOMER IMPORT = NOT IMPLEMENTED`

Do **not** start DATA-1D from this close-out.

---

## 28. Final Git state

Evidence-only commit after fixture verification. Implementation files unchanged.

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD (this fixture run) | `a554eedbeb76c39313f4822f936d70c0fa4a9df3` |
| Evidence commit | recorded after commit/push in the closing response |
| Required | divergence `0 0`, clean worktree, normal push only |

No amend of published commits. No force-push. No reset. No rebase of authoritative history.

---

## 29. Final verdict

Catalog, RLS, RPC, Storage privacy, actor matrix, Customer Activity NULL, Customer non-effect, Storage non-effect, and one cancelled QA metadata fixture are Production-verified.

**DATA-1C-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION DATA INTAKE METADATA + SECURITY FOUNDATION VERIFIED**

**DATA-1C RELEASE READY WITH EVIDENCE**

---

## Appendix A — Security foundation reconfirm (unchanged this run)

REMOTE CATALOG. Exact DATA-1B names.

| Table | Exists | RLS enabled | FORCE RLS | Policies |
| --- | --- | --- | --- | --- |
| `data_intake_sessions` | yes | true | **false** | 0 |
| `data_intake_sources` | yes | true | **false** | 0 |
| `data_intake_mappings` | yes | true | **false** | 0 |
| `data_intake_staging_rows` | yes | true | **false** | 0 |
| `data_import_plans` | yes | true | **false** | 0 |
| `data_intake_events` | yes | true | **false** | 0 |
| `data_external_record_links` | yes | true | **false** | 0 |
| `data_import_row_results` | yes | true | **false** | 0 |

`anon` / `authenticated` / `public`: no broad DATA SELECT/DML. `service_role` remains bounded executor. Events: INSERT/SELECT only for `service_role`; no UPDATE/DELETE grant.

Live `public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb)`:

| Check | Live value |
| --- | --- |
| `SECURITY DEFINER` | true |
| `search_path` | `''` |
| PUBLIC / anon / authenticated EXECUTE | **false** |
| service_role EXECUTE | **true** |
| Operations | `create_session`, `register_source`, `cancel_session` only |

No schema mutation this phase. Latest remote migration remains `20260827120815` `add_data_intake_storage_bucket`.

Frozen local hashes (unchanged):

| Local file | SHA-256 |
| --- | --- |
| `supabase/migrations/20260827140000_create_data_intake_foundation.sql` | `ad37fdbfb24fb4c1bd8038c9aede550ed7f4b07abac0f5a1ba8cf0042d3a0276` |
| `supabase/migrations/20260827140010_enable_data_intake_rls.sql` | `85b306b85cc9c66b9d6af4eb70d0b6042e040f23215f771d5c9f07a099d91a4a` |
| `supabase/migrations/20260827140020_add_data_intake_storage_bucket.sql` | `7f8fa5e7e442647bfeff0f6d56c4bb21432b821c1a8ea636dd442ad25e5cff54` |

Targeted apply mapping (completed before this fixture; not reapplied):

| Local filename | Remote version | Remote name |
| --- | --- | --- |
| `20260827140000_create_data_intake_foundation.sql` | `20260827115833` … `20260827120403` | split foundation ledger |
| `20260827140010_enable_data_intake_rls.sql` | `20260827120430` / `20260827120758` | RLS + RPC |
| `20260827140020_add_data_intake_storage_bucket.sql` | `20260827120815` | bucket |

DB-MIGRATION-DRIFT-01 remains binding. No `db push`, reset, repair, or blind pull.

---

## Appendix B — Linked phase identity

| Phase | Evidence | Commit | Status |
| --- | --- | --- | --- |
| DATA-1A | `docs/phases/DATA-1A-universal-business-data-intake-discovery.md` | `1a6aa6d8382bb5a315eb801246a50838f1fe3d04` | CLOSED |
| DATA-1B | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` | `9078c9a9a6c93890227e4c6d3bbb071789ff0a7d` | CLOSED — contract frozen |
| DATA-1C | `docs/phases/DATA-1C-universal-business-data-intake-database-security-foundation-evidence.md` | `f3aa7b187b04d7da6cce95cb945aaaa148a6a260` | IMPLEMENTED AND FROZEN |
| DATA-1C typegen | linked Production types + `keyof Database["public"]["Functions"]` | `59f30d308b2dcb32b1bec69fd82404972cf50da1` | pushed before catalog close-out |
| DATA-1C-FV catalog | this document (zero-row close-out) | `a554eedbeb76c39313f4822f936d70c0fa4a9df3` | superseded on fixture retention by this update |

No credentials, JWTs, raw uploaded customer data, or customer PII are stored here.
