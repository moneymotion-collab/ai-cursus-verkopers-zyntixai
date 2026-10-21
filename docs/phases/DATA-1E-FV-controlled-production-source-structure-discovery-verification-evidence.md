# DATA-1E-FV — Controlled Production Source Structure Discovery Verification

| Field | Value |
| --- | --- |
| Phase | **DATA-1E-FV — CONTROLLED PRODUCTION SECURE PARSER + STRUCTURE DISCOVERY VERIFICATION** |
| Parent | DATA-1E + DATA-1E-R1 |
| Document type | Production verification evidence |
| Date | 2026-08-28 |
| Formal status | `DATA-1E-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION CSV + XLSX STRUCTURE DISCOVERY VERIFIED` |
| Governing implementation | `docs/phases/DATA-1E-secure-parser-structure-discovery-evidence.md` |
| Governing R1 | `docs/phases/DATA-1E-R1-parsed-session-cancellation-hardening-evidence.md` |
| Governing 1D-FV | `docs/phases/DATA-1D-FV-controlled-production-private-file-upload-verification-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| DATA-1E implementation commit | `d1814931b942b481ed02f8e9ad9dc4d95060b37e` |
| DATA-1E evidence HEAD | `62af75f4ce25320b289d49d9facd63c4c72c145a` |
| DATA-1E-R1 implementation commit | `052ac0ce8cbb1288fc14b7efc07db2a92f456ef3` |
| Start HEAD | `4b68c319baa79fb19b3d3fe4dade48ef25e71117` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Production region | `eu-central-1` |
| Production status | `ACTIVE_HEALTHY` |
| Production app | `https://www.zyntixai.com` |
| Production QA organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Private bucket | `data-intake` |

This phase verifies **only** the already implemented DATA-1E parser/discovery architecture and DATA-1E-R1 parsed cancellation on Production: exact frozen migrations, catalog/RPC/RLS/Storage, two fresh synthetic QA fixtures (CSV + XLSX), object integrity, structure discovery, replay, governed `parsed → cancelled`, authorization negatives, and non-effects.

It does **not** authorize semantic mapping, staging, validation, import planning, Customer import, Customer writer modification, external-record linking, or DATA-1F.

**CSV STRUCTURE DISCOVERY = PRODUCTION VERIFIED**

**XLSX STRUCTURE DISCOVERY = PRODUCTION VERIFIED**

**PARSED SESSION CANCELLATION = PRODUCTION VERIFIED**

**SEMANTIC MAPPING = NOT IMPLEMENTED**

**STAGING = NOT IMPLEMENTED**

**CUSTOMER IMPORT = NOT IMPLEMENTED**

**DATA-1F = NOT STARTED**

---

## 1. Executive verdict

Controlled Production DATA-1E final verification passed with evidence.

Exact owner authorization was proven before Production mutation. Git start state was clean at `4b68c319baa79fb19b3d3fe4dade48ef25e71117` with divergence `0 0`. Production identity is `dmctinrcjvsgmoxwwodw` / `eu-central-1` / `ACTIVE_HEALTHY`. Both frozen migration hashes matched exactly. Both migrations were absent on Production before this FV, then applied once each by targeted MCP `apply_migration` (not `db push`, not repair). Remote catalog still has exactly eight DATA tables, RLS 8/8, private `data-intake`, and service-role-only execution of the structure and foundation RPCs.

Two fresh Owner-authorized QA fixtures completed the governed lifecycle: create → register → private upload → object verification → structure discovery → `parsed` → idempotent replay → `cancel_session` → `cancelled`. CSV and XLSX runtime paths both succeeded. Customer delta is 0. Mapping/staging/plan/row-result/link attributable delta is 0. DATA targeted tests: **81 / 81 = 100%**. Full suite: **3247 passed, 2 failed, 3249 total**. Same two historical failures. `NEW REGRESSIONS = 0`.

Historical DATA-1C-FV and DATA-1D-FV fixtures were not reused.

---

## 2. Owner authorization

Printed before the first Production mutation of this run and again immediately before the governed fixture runner:

`DATA-1E-FV OWNER AUTHORIZATION = PROVEN`

Exact authorization string supplied in the DATA-1E-FV owner prompt:

`DATA-1E-FV CONTROLLED PRODUCTION SOURCE STRUCTURE DISCOVERY = AUTHORIZED`

Authorization was **not** inferred from DATA-1C or DATA-1D.

Authorized mutations only:

- exact DATA-1E migration apply if required;
- exact DATA-1E-R1 migration apply if required;
- two fresh QA sessions;
- two fresh synthetic source rows;
- one tiny synthetic CSV;
- one tiny synthetic XLSX;
- private Storage upload;
- object verification;
- source structure discovery;
- replay verification;
- governed cancellation;
- evidence gathering.

Not authorized: mapping, staging, validation, import planning, Customer import, Customer writer, external record linking, DATA-1F, `db push`, migration repair, Production reset, or reuse of historical fixtures.

---

## 3. Starting Git state

Proven before Production mutation:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `4b68c319baa79fb19b3d3fe4dade48ef25e71117` |
| Subject | `docs(data): verify parsed session cancellation hardening` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `4b68c319baa79fb19b3d3fe4dade48ef25e71117` |
| Divergence | `0 0` |
| `git status` | clean |
| Staged / unstaged / untracked | none |
| `git diff --check` | clean |

---

## 4. DATA-1E dependency

| Item | Value |
| --- | --- |
| Implementation commit | `d1814931b942b481ed02f8e9ad9dc4d95060b37e` |
| Evidence commit | `62af75f4ce25320b289d49d9facd63c4c72c145a` |
| Evidence | `docs/phases/DATA-1E-secure-parser-structure-discovery-evidence.md` |
| Local targeted baseline | `73 / 73 = 100%` before R1 |

DATA-1E implements server-side CSV and XLSX structure discovery against a DATA-1D-verified private object. Persistence uses existing DATA-1B source columns. Session transition is `source_ready → parsed`. Immutable event is `source_parsed`. Operation is bounded `confirm_source_structure`.

---

## 5. DATA-1E-R1 dependency

| Item | Value |
| --- | --- |
| Implementation commit | `052ac0ce8cbb1288fc14b7efc07db2a92f456ef3` |
| Evidence HEAD / start HEAD | `4b68c319baa79fb19b3d3fe4dade48ef25e71117` |
| Evidence | `docs/phases/DATA-1E-R1-parsed-session-cancellation-hardening-evidence.md` |
| Local targeted baseline | `81 / 81 = 100%` |

R1 only expands governed `cancel_session` from `created`, `source_ready` to `created`, `source_ready`, `parsed`. Arbitrary-state cancellation remains forbidden.

---

## 6. Production identity

| Check | Value |
| --- | --- |
| Project ID | `dmctinrcjvsgmoxwwodw` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Postgres | `17.6.1.141` |
| App | `https://www.zyntixai.com` |
| QA organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Bucket | `data-intake` (private) |
| Linked apply method | MCP `apply_migration` against this project only |
| Typegen | `npm run supabase:types` (`supabase gen types typescript --linked`) |

Project identity matched the expected Production project. No stop.

---

## 7. DATA-1E migration hash

File:

`supabase/migrations/20260827160000_add_data_intake_source_structure_discovery.sql`

| Source | SHA-256 |
| --- | --- |
| Expected | `561fe546c1376257194917544786c1a02b92cdfc931ea7de3168ce087ccb499b` |
| Recalculated from current file | `561fe546c1376257194917544786c1a02b92cdfc931ea7de3168ce087ccb499b` |

Exact equality. The frozen SQL only adds the bounded `public.apply_data_intake_source_structure_mutation` (`confirm_source_structure` only), `source_parsed` event type, and uses existing DATA-1B persistence columns. No ninth DATA table. No mapping engine. No staging. No Customer import.

---

## 8. DATA-1E-R1 migration hash

File:

`supabase/migrations/20260827161658_allow_parsed_data_intake_session_cancellation.sql`

| Source | SHA-256 |
| --- | --- |
| Expected | `b94a445e8a0a57285089f172ad778b4e1b4a70d52fe2cbd9313a6d00cfcd6b9e` |
| Recalculated from current file | `b94a445e8a0a57285089f172ad778b4e1b4a70d52fe2cbd9313a6d00cfcd6b9e` |

Exact equality. The only meaningful state-machine change is `cancel_session` allowlist `created`, `source_ready`, `parsed`.

---

## 9. Migration pre-state

Before this FV apply:

| Check | Value |
| --- | --- |
| Remote latest | `20260827151721` `add_data_intake_source_object_verification` (DATA-1D) |
| DATA-1E present | **no** |
| DATA-1E-R1 present | **no** |
| Unrelated pending apply | none performed |

Known DATA-1C/1D filename vs remote timestamp split remains `DB-MIGRATION-DRIFT-01`. Timestamp skew alone was not treated as permission to repair history.

---

## 10. Targeted migration apply

### DATA-1E

Printed before apply:

- Production project ID `dmctinrcjvsgmoxwwodw`
- local filename `20260827160000_add_data_intake_source_structure_discovery.sql`
- frozen SHA-256 `561fe546c1376257194917544786c1a02b92cdfc931ea7de3168ce087ccb499b`
- intended changes: bounded structure-confirmation RPC + `source_parsed` event type on existing persistence
- required because Production catalog lacked DATA-1E
- no unrelated migration
- `db push` not used
- migration repair not used

Apply method: targeted MCP `apply_migration` of the **exact frozen SQL**. `success: true`.

### DATA-1E-R1

Printed before apply:

- Production project ID `dmctinrcjvsgmoxwwodw`
- local filename `20260827161658_allow_parsed_data_intake_session_cancellation.sql`
- frozen SHA-256 `b94a445e8a0a57285089f172ad778b4e1b4a70d52fe2cbd9313a6d00cfcd6b9e`
- intended change: `cancel_session` allowlist includes `parsed`
- required because Production still had the pre-R1 foundation RPC
- no unrelated migration

Apply method: targeted MCP `apply_migration` of the **exact frozen SQL**. `success: true`. Applied after DATA-1E.

Neither migration was reapplied.

---

## 11. Remote migration post-state

| Migration | Local filename | Remote version | Remote name | Post-state |
| --- | --- | --- | --- | --- |
| DATA-1E | `20260827160000_add_data_intake_source_structure_discovery.sql` | `20260827162939` | `add_data_intake_source_structure_discovery` | present once |
| DATA-1E-R1 | `20260827161658_allow_parsed_data_intake_session_cancellation.sql` | `20260827163158` | `allow_parsed_data_intake_session_cancellation` | present once |

Remote latest after this FV: `20260827163158` `allow_parsed_data_intake_session_cancellation`.

Filename timestamp difference vs MCP-assigned remote version is expected under `DB-MIGRATION-DRIFT-01`. Do not reconcile timestamps.

---

## 12. Catalog verification

Inspected on Production after both applies, not from SQL source alone.

### DATA schema

Exactly eight public DATA tables:

`data_intake_sessions`, `data_intake_sources`, `data_intake_mappings`, `data_intake_staging_rows`, `data_import_plans`, `data_intake_events`, `data_external_record_links`, `data_import_row_results`

No ninth workflow table.

### RLS / grants

RLS enabled on all eight DATA tables. No `anon` / `authenticated` / `public` table grants on DATA tables.

### Source persistence used by DATA-1E

Existing DATA-1B columns remain: `encoding`, `delimiter`, `sheet_name`, `header_row_index`, `row_count`, `column_count`, `parse_metadata`. DATA-1D verification pair remains: `object_verified_at`, `object_verified_by_user_id`.

Session status CHECK still includes `parsed`. Event type CHECK includes `source_parsed`.

### Storage

| Check | Value |
| --- | --- |
| Bucket | `data-intake` |
| `public` | `false` |
| Size limit | `10485760` |
| Allowed MIME | `text/csv`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| Policies | `data_intake_no_anon_all`, `data_intake_no_authenticated_all` only |
| Broad authenticated DATA/Storage policy | **none added** |

Default Storage table grants on `storage.objects` / `storage.buckets` remain the platform defaults. Object access is still denied by the `data-intake` deny-all policies. Public object URLs for both FV objects returned HTTP **400**. Credential-less list POST returned HTTP **400**.

---

## 13. RPC security

### `public.apply_data_intake_source_structure_mutation(text, uuid, uuid, uuid, jsonb)`

| Property | Production |
| --- | --- |
| `SECURITY DEFINER` | yes (`prosecdef`) |
| `search_path` | `""` |
| Operation boundary | `confirm_source_structure` only |
| Dynamic SQL / `EXECUTE format` | none |
| Client path/rows/bytes in payload | rejected (`SOURCE_INVALID`) |
| EXECUTE `service_role` | **true** |
| EXECUTE `anon` | **false** |
| EXECUTE `authenticated` | **false** |
| Human actor | required Owner/Admin membership; never `service_role` as actor |

### Foundation RPC after R1

`public.apply_data_intake_foundation_mutation` remains `SECURITY DEFINER`, `search_path=""`, EXECUTE `service_role` only. `cancel_session` allowlist is `created`, `source_ready`, `parsed`. Register remains blocked after parse (`INVALID_STATE`).

Object-verification RPC was unchanged and remains service-role-only.

---

## 14. Type synchronization

Established procedure: `npm run supabase:types` (`supabase gen types typescript --linked`).

Generated types already included `apply_data_intake_source_structure_mutation` from DATA-1E implementation. Post-apply typegen produced **no repository type diff**. No type-sync commit.

RPC access remains `keyof Database["public"]["Functions"]` via `DATA_INTAKE_SOURCE_STRUCTURE_RPC`. No unsafe string-cast RPC.

---

## 15. Pre-fixture counts

Measured immediately before the fresh fixtures (not assumed from DATA-1D-FV):

| Surface | Count |
| --- | --- |
| sessions | 2 |
| sources | 2 |
| mappings | 0 |
| staging | 0 |
| plans | 0 |
| row results | 0 |
| events | 7 |
| external links | 0 |
| `data-intake` objects | 1 |
| Customers global | 116 |
| Customers QA org | 6 |

Matches retained DATA-1C-FV metadata fixture + DATA-1D-FV verified object fixture.

---

## 16. CSV fixture definition

Fresh session. Not reused.

| Field | Value |
| --- | --- |
| Filename | `qa_data_1e_structure_discovery_v1.csv` |
| MIME | `text/csv` |
| Encoding | UTF-8 |
| Trailing newline | yes (`\n`) |
| Org | QA `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Target | `customer` |
| Activity | `NULL` |
| Actor | Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9` / membership `6d8c8c91-39ff-4f26-86c8-5ec712b8c4f0` / `owner`/`active` |

Logical content:

```csv
alpha,beta,gamma
one,2,true
three,4,false
```

No real PII. No Customer mapping semantics.

---

## 17. CSV exact bytes / hash

Computed from the exact uploaded bytes before registration:

| Check | Value |
| --- | --- |
| Byte size | **42** |
| SHA-256 | `adfaa9477e36b65479499a2cc0ac24a999b1df78dc3eaf2aa92bd07e653db1ed` |
| Hex | `616c7068612c626574612c67616d6d610a6f6e652c322c747275650a74687265652c342c66616c73650a` |

---

## 18. CSV session / source / object IDs

| Field | Value |
| --- | --- |
| Session | `666270e6-a774-44ef-8a23-3bb62138d9f6` |
| Source | `d66f3a28-f75b-4752-a07a-6911f2da4830` |
| Generated object ID | `6466b4db-6eef-4bdb-ab64-5fb27930a411` |
| Path | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb/666270e6-a774-44ef-8a23-3bb62138d9f6/d66f3a28-f75b-4752-a07a-6911f2da4830/6466b4db-6eef-4bdb-ab64-5fb27930a411.csv` |
| Bucket | `data-intake` |

---

## 19. CSV upload verification

Governed `uploadAndVerifyDataIntakeSource` after `registerDataIntakeSource`.

| Check | Value |
| --- | --- |
| Stored size | 42 |
| Stored SHA-256 | `adfaa9477e36b65479499a2cc0ac24a999b1df78dc3eaf2aa92bd07e653db1ed` |
| `object_verified_at` | `2026-08-28T08:29:24.007129+00:00` |
| `object_verified_by_user_id` | Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| Event | `source_object_verified` `07971c3b-b31a-4c6b-b1f8-5b32ba9d51e4` |
| `replayed` | false on first confirm |

Discovery attempted after register and **before** verification returned `SOURCE_NOT_VERIFIED`.

---

## 20. CSV discovery result

Measured Production parser output:

| Field | Value |
| --- | --- |
| format | `csv` |
| parser version | `data-parser-v1` |
| delimiter | `,` |
| encoding | `utf-8` |
| BOM | false |
| headers | `alpha`, `beta`, `gamma` |
| column count | 3 |
| data row count | 2 |
| empty row count | 0 |
| warnings | `[]` |
| session status | `parsed` |
| event | `source_parsed` `cdafaa6f-32bb-41d8-b1a6-e9553cdcfadd` |
| `replayed` | false |

Raw rows were not returned. No Customer field inference. No mapping rows. No staging writes. Persisted `parse_metadata` contains structural facts only (`parser_version`, `format`, `header_names`, `warnings`, `bom`, `empty_row_count`).

---

## 21. CSV replay result

Second governed `discoverDataIntakeSourceStructure` on the same verified immutable object:

| Check | Result |
| --- | --- |
| `ok` | true |
| `replayed` | **true** |
| Event ID | same `cdafaa6f-32bb-41d8-b1a6-e9553cdcfadd` |
| Second `source_parsed` row | **no** |
| Session/source/object | unchanged |
| Hash / path | unchanged |
| Structure fingerprint | equivalent |

---

## 22. CSV cancellation

Governed `cancelDataIntakeSession` / `cancel_session` from `parsed`.

| Field | Value |
| --- | --- |
| Transition | `parsed → cancelled` |
| `cancelled_at` | `2026-08-28T08:29:25.501986+00:00` (once) |
| Actor | Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| Event | `import_cancelled` `a2c917df-9c54-49c7-aa2c-e492fdd668d6` |
| Structure metadata | retained |
| Object verification | retained |
| Private object | retained |
| History deleted | **no** |

After cancel:

- discovery → `INVALID_STATE`
- register → `INVALID_STATE`

---

## 23. XLSX fixture definition

Fresh session/source. Not the CSV fixture.

| Field | Value |
| --- | --- |
| Filename | `qa_data_1e_structure_discovery_v1.xlsx` |
| MIME | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| Generator | repository `buildSimpleXlsx` |
| Sheet 1 | `Primary` — `alpha,beta,gamma` / `one,2,true` / `three,4,false` |
| Sheet 2 | `Secondary` — `x,y` / `1,2` |
| Formulas / macros / external links | none |
| PII | none |

---

## 24. XLSX hash / size

Computed from the actual generated bytes before registration:

| Check | Value |
| --- | --- |
| Byte size | **7110** |
| SHA-256 | `247d8fc32b4a0600090c009dd97d689880ec6b19833733692df069aa095a29a6` |

---

## 25. XLSX session / source / object IDs

| Field | Value |
| --- | --- |
| Session | `ce7c20e4-fb24-49e6-8b22-5ceed49f1c19` |
| Source | `6969ccee-75b4-4f56-898c-5e49b203e460` |
| Generated object ID | `c22caf89-644a-401a-8666-7520b2079724` |
| Path | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb/ce7c20e4-fb24-49e6-8b22-5ceed49f1c19/6969ccee-75b4-4f56-898c-5e49b203e460/c22caf89-644a-401a-8666-7520b2079724.xlsx` |
| Bucket | `data-intake` |

---

## 26. XLSX upload verification

| Check | Value |
| --- | --- |
| Stored size | 7110 |
| Stored SHA-256 | `247d8fc32b4a0600090c009dd97d689880ec6b19833733692df069aa095a29a6` |
| MIME | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| `object_verified_at` | `2026-08-28T08:29:27.65971+00:00` |
| Verified by | Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| Event | `source_object_verified` `3b685e53-e1db-46e7-91cf-9472af261b79` |

Workbook recognized as valid OOXML/ZIP by the Production parser path (`exceljs` after ZIP safety). No formula execution in this fixture.

---

## 27. XLSX discovery result

Measured Production parser output:

| Field | Value |
| --- | --- |
| format | `xlsx` |
| parser version | `data-parser-v1` |
| encoding | `utf-8` |
| sheet count | 2 |
| sheet names | `Primary` (visible), `Secondary` (visible) |
| selected / default sheet | `Primary` (first visible sheet) |
| Primary headers | `alpha`, `beta`, `gamma` |
| Primary columns | 3 |
| Primary data rows | 2 |
| Secondary metadata | `row_count` **1**, `column_count` **2** (header `x,y` + one data row `1,2`) |
| warnings | `[]` |
| session status | `parsed` |
| event | `source_parsed` `f6f49d2e-7086-48b0-abc8-03ed4dbe0681` |
| `replayed` | false |

No mapping rows. No staging rows. No Customer writes. Headers are structural only.

---

## 28. XLSX replay result

| Check | Result |
| --- | --- |
| `ok` | true |
| `replayed` | **true** |
| Event ID | same `f6f49d2e-7086-48b0-abc8-03ed4dbe0681` |
| Second `source_parsed` row | **no** |
| Hash / path / selected sheet | unchanged |

---

## 29. XLSX cancellation

| Field | Value |
| --- | --- |
| Transition | `parsed → cancelled` |
| `cancelled_at` | `2026-08-28T08:29:29.122005+00:00` |
| Actor | Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| Event | `import_cancelled` `b9bbc577-e55b-4a18-8d49-fdee4ee39fe8` |

After cancel: discovery `INVALID_STATE`; register `INVALID_STATE`. Structure evidence and private object remain intact.

---

## 30. Authorization negatives

Performed on live parsed sessions before cancel, plus RPC actor substitution. No extra junk sessions.

### Service layer

| Actor | CSV / XLSX result |
| --- | --- |
| Staff user `0844191e-a699-4aaf-beb3-24cfda2ddff2` | `FORBIDDEN_ROLE` |
| Viewer user `71760c93-595b-4d5d-a315-faae5453bd31` | `FORBIDDEN_ROLE` |
| Suspended Viewer `19db8e29-2e6f-4033-89a5-548bcf2ed41e` | `ORG_NOT_FOUND` (fail closed) |
| Foreign Owner `f834c070-d1f9-46d4-b91d-1975fd7c352a` targeting QA org | `ORG_NOT_FOUND` (fail closed) |
| Foreign Owner targeting own org with QA session | `SESSION_NOT_FOUND` |
| Client `storagePath` | `SOURCE_INVALID` |
| Unverified source | `SOURCE_NOT_VERIFIED` |
| Cancelled session | `INVALID_STATE` |

### RPC `confirm_source_structure` (service_role executor, real membership actors)

| Actor | Code |
| --- | --- |
| Staff | `FORBIDDEN_ROLE` |
| Viewer | `FORBIDDEN_ROLE` |
| Suspended | `UNAUTHORIZED` |
| Foreign Owner targeting QA org | `UNAUTHORIZED` |

Staff/Viewer match `FORBIDDEN_ROLE`. Suspended/foreign match the expected RPC `UNAUTHORIZED` class. Service-layer suspended/foreign remain fail-closed via `ORG_NOT_FOUND` / `SESSION_NOT_FOUND` because active in-org membership is required before command authorization.

---

## 31. Parser safety negatives

### Production behavioral proof

Safe synthetic fixtures only. No pathological payloads uploaded to Production.

### Local automated safety proof

CSV structure tests (`tests/features/data-intake/csv-structure.test.ts`, 8 tests) cover invalid UTF-8, malformed quotes, unsupported/limit cases, and formula-like text-as-text.

XLSX structure tests (`tests/features/data-intake/xlsx-structure.test.ts`, 6 tests) cover fake `.xlsx`, invalid OOXML/ZIP, legacy OLE `.xls`, hidden sheets, formula cells without evaluation, and ZIP/sheet/column/row limits.

Both files passed in the DATA targeted run. Limits were not modified.

Active centralized limits in `src/features/data-intake/domain/constants.ts`:

- `DATA_MAX_FILE_BYTES = 10 MiB`
- `DATA_MAX_DATA_ROWS = 10_000`
- `DATA_MAX_COLUMNS = 50`
- `DATA_MAX_HEADER_LENGTH = 256`
- `DATA_MAX_FIELD_LENGTH = 4_096`
- `DATA_MAX_XLSX_SHEETS = 32`
- `DATA_MAX_ZIP_ENTRIES = 256`
- `DATA_MAX_ZIP_UNCOMPRESSED_BYTES = 32 MiB`
- `DATA_MAX_ZIP_COMPRESSION_RATIO = 100`

---

## 32. Privacy / logging

| Check | Result |
| --- | --- |
| Source bytes in generic logs | not present; DATA server modules have no `console.log/info/debug` |
| Raw rows in discovery JSON | absent (`containsCsvRows = false`) |
| Raw workbook cell dump | absent |
| `source_parsed` metadata | `source_id`, `format`, `parser_version`, `column_count`, `row_count`, `sheet_count` only |
| Service-role secret | process-local only (`name=service_role`, `type=legacy`, length 219); not written to the repository |
| Signed URL | **not created** for this FV |
| Public object URL | HTTP **400** |
| Parser stack trace to user | fail-closed codes only |
| Synthetic headers in evidence | recorded only as structural metadata, per existing evidence policy |

---

## 33. Audit events

Each successful fixture emitted exactly five immutable events. Replay added zero events. Historical DATA-1C-FV / DATA-1D-FV events were not rewritten.

CSV chronology:

1. `intake_created` `99ac460d-3f09-4ee6-9966-b75d794fe133`
2. `source_uploaded` `38395c21-bd92-48b8-8ad1-34ace45a984d`
3. `source_object_verified` `07971c3b-b31a-4c6b-b1f8-5b32ba9d51e4`
4. `source_parsed` `cdafaa6f-32bb-41d8-b1a6-e9553cdcfadd`
5. `import_cancelled` `a2c917df-9c54-49c7-aa2c-e492fdd668d6`

XLSX chronology:

1. `intake_created` `384a4e56-0cf0-4bc0-9791-21204eb5b9e8`
2. `source_uploaded` `33fa9e99-99ba-4ed7-8b81-a979a6e05c1b`
3. `source_object_verified` `3b685e53-e1db-46e7-91cf-9472af261b79`
4. `source_parsed` `f6f49d2e-7086-48b0-abc8-03ed4dbe0681`
5. `import_cancelled` `b9bbc577-e55b-4a18-8d49-fdee4ee39fe8`

Actor, organization, and session IDs match the Owner/QA fixture on every event.

---

## 34. Customer non-effect

| Scope | Before | After | Delta |
| --- | --- | --- | --- |
| Global | 116 | 116 | **0** |
| QA org | 6 | 6 | **0** |

No Customer inserted, updated, or deleted. Customer writer not invoked. No external record link created.

---

## 35. Mapping / staging / import non-effect

| Surface | Before | After | Attributable delta |
| --- | --- | --- | --- |
| mappings | 0 | 0 | 0 |
| staging | 0 | 0 | 0 |
| plans | 0 | 0 | 0 |
| row results | 0 | 0 | 0 |
| external links | 0 | 0 | 0 |

`SEMANTIC MAPPING EXECUTED = NO`

`STAGING ROWS CREATED = 0`

`IMPORT PLANS CREATED = 0`

`ROW RESULTS CREATED = 0`

`EXTERNAL LINKS CREATED = 0`

`CUSTOMER IMPORT EXECUTED = NO`

Parsed structural headers/row counts are not staging.

---

## 36. Storage final state

`data-intake` objects: **3**

| Object | Origin |
| --- | --- |
| DATA-1D-FV CSV | retained historical evidence |
| DATA-1E-FV CSV | this phase |
| DATA-1E-FV XLSX | this phase |

DATA-1E-FV Storage delta: **+2 objects**. Verified synthetic evidence objects were not deleted.

---

## 37. Unrelated Production non-effects

Measured after both fixtures. No DATA-attributable mutation.

| Domain | After | Delta vs DATA-1D-FV snapshot |
| --- | --- | --- |
| TAX | `1 / 4 / 22 / 1 / 0 / 0 / 2` | 0 |
| CAP | `13 / 7 / 13` | 0 |
| CTX | `2 / 2 / 10 / 4 / 2` (packs / versions / capability maps / terminology / readiness) | 0 |
| Memberships | 22 | 0 |
| Invitations | 16 | 0 |
| Path B `/register` | HTTP **307** `Location: /login?registration=disabled` | unchanged |
| Social publishing | `private.social_publishing_execution_enabled()` = **false**; GUC unset / NULL | 0 |
| Cron | `zyntixai_social_publication_scheduler_5m` `*/5 * * * *` `select private.invoke_social_publication_scheduler();` active | unchanged |

---

## 38. Targeted tests

`npx vitest run` on DATA feature + DATA security files:

**81 passed / 81 total.**

Coverage included DATA-1C foundation, DATA-1D upload/object verification, CSV parser, XLSX parser, discovery, R1 cancellation, authorization, tenant isolation, privacy, replay/idempotency, and migration/static SQL tests.

---

## 39. DATA success rate

`DATA TARGETED TEST SUCCESS RATE = 100%`

Previous targeted count: 81. Final targeted count: 81. Percentage: `81 / 81 = 100%`.

---

## 40. Typecheck / lint / build

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (0 warnings / 0 errors) |
| `git diff --check` | clean |
| `next build` | not required by DATA closure convention |

---

## 41. Full suite

`npx vitest run`

**3247 passed, 2 failed, 3249 total.**

Identical to the previous accepted DATA-1E-R1 baseline. No third failure.

---

## 42. Full-suite percentage

`3247 / 3249 = 99.94%`

Do not call this 100%.

`FULL REPOSITORY 100% RESTORATION REMAINS A SEPARATE QUALITY OBJECTIVE`

---

## 43. Historical failures

Unchanged; not accepted as new:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

`HISTORICAL FAILURES = 2`

---

## 44. New regressions

`NEW REGRESSIONS = 0`

---

## 45. Residual risks

- `DB-MIGRATION-DRIFT-01` remains: remote DATA-1E version `20260827162939` vs local `20260827160000`; remote R1 version `20260827163158` vs local `20260827161658`. Do not repair.
- Service-layer suspended/foreign actors return `ORG_NOT_FOUND` / `SESSION_NOT_FOUND` while the RPC returns `UNAUTHORIZED`. Both fail closed; codes differ by layer.
- Two additional synthetic private objects are retained as durable evidence and must not be deleted merely to restore the previous Storage count.
- Semantic mapping, staging, and Customer import remain unimplemented. A future DATA-1F must not treat `source_parsed` as mapping-complete or import-complete.

No material defect was found in parser behavior, authorization, tenant isolation, state machine, privacy, Storage access, Production migration, or CSV/XLSX runtime.

---

## 46. DATA-1F boundary

DATA-1F was **not** started.

`CSV STRUCTURE DISCOVERY = PRODUCTION VERIFIED`

`XLSX STRUCTURE DISCOVERY = PRODUCTION VERIFIED`

`PARSED SESSION CANCELLATION = PRODUCTION VERIFIED`

`SEMANTIC MAPPING = NOT IMPLEMENTED`

`STAGING = NOT IMPLEMENTED`

`CUSTOMER IMPORT = NOT IMPLEMENTED`

`DATA-1F = NOT STARTED`

The next DATA phase must be separately designed and authorized.

---

## 47. Final Git state

| Check | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `4b68c319baa79fb19b3d3fe4dade48ef25e71117` |
| Type-sync commit | none (no generated-type diff) |
| Evidence commit | this document, `docs(data): verify controlled Production source structure discovery` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Required close-out | divergence `0 0` after normal push; worktree clean |

No amend, no force-push, no rebase, no reset. Ephemeral Production runner was not committed.

---

## 48. Final verdict

`DATA-1E-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION CSV + XLSX STRUCTURE DISCOVERY VERIFIED`

`DATA-1E RELEASE READY WITH EVIDENCE`

`DATA-1E TARGETED TEST SUCCESS RATE = 100%`
