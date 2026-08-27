# DATA-1E — Secure Parser + Source Structure Discovery

| Field | Value |
| --- | --- |
| Phase | **DATA-1E — SECURE PARSER + FILE STRUCTURE DISCOVERY FOUNDATION** |
| Parent | DATA-1D |
| Document type | Implementation evidence |
| Date | 2026-08-27 |
| Formal status | `DATA-1E IMPLEMENTATION COMPLETE WITH EVIDENCE — SECURE PARSER + STRUCTURE DISCOVERY READY FOR CONTROLLED PRODUCTION QA` |
| Governing 1D implementation | `docs/phases/DATA-1D-private-file-upload-object-verification-evidence.md` |
| DATA-1D-FV | `docs/phases/DATA-1D-FV-controlled-production-private-file-upload-verification-evidence.md` |
| Governing contract | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `55f6afea200baebbe2ec1142325d5f5ccd4495a9` |
| Implementation commit | `d1814931b942b481ed02f8e9ad9dc4d95060b37e` |
| Production apply | **NOT PERFORMED** |
| Production discovery | **NOT AUTHORIZED** |

**SECURE CSV STRUCTURE DISCOVERY = IMPLEMENTED**

**SECURE XLSX STRUCTURE DISCOVERY = IMPLEMENTED**

**SEMANTIC MAPPING = NOT IMPLEMENTED**

**STAGING = NOT IMPLEMENTED**

**CUSTOMER IMPORT = NOT IMPLEMENTED**

**DATA-1E PRODUCTION DISCOVERY = NOT YET AUTHORIZED**

---

## 1. Executive verdict

DATA-1E implementation is complete with evidence. A verified private DATA-1D source object can now be read server-side and transformed into a bounded, typed structural discovery result (CSV or XLSX). Parsing is Owner/Admin only, requires `object_verified_at`, never accepts a client Storage path, never evaluates spreadsheet formulas, never writes staging/mappings/plans/Customers, and never ran against Production.

Targeted DATA tests: **73 / 73 = 100%**. Full suite: **3239 passed, 2 failed, 3241 total**. The two failures are the same historical tracked debt as DATA-1D-FV. `NEW REGRESSIONS = 0`.

---

## 2. DATA-1D dependency

Authoritative prior verdict:

`DATA-1D-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION PRIVATE FILE UPLOAD + OBJECT INTEGRITY VERIFIED`

`DATA-1D RELEASE READY WITH EVIDENCE`

Closure HEAD: `55f6afea200baebbe2ec1142325d5f5ccd4495a9`

DATA-1D proved authenticated Owner/Admin → governed session → source metadata → private Storage object → server-side readback → size/SHA-256 verification → immutable verification evidence → safe cancellation.

Retained DATA-1D-FV Production fixture (session `5414aa0d-b113-4a95-8553-9c4e62201133`, source `47c7ad4e-3731-419c-aa59-cd9e2472c306`, cancelled) was **not** parsed in this phase.

---

## 3. Starting Git state

Proven before DATA-1E files were added:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `55f6afea200baebbe2ec1142325d5f5ccd4495a9` |
| Subject | `docs(data): verify controlled Production private source upload` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `55f6afea200baebbe2ec1142325d5f5ccd4495a9` |
| Divergence | `0 0` |
| `git status` | clean |
| Staged / unstaged / untracked | none |
| `git diff --check` | clean |

---

## 4. Frozen scope

In scope:

- read of an already DATA-1D-verified private source object
- CSV parser foundation (hand-rolled RFC 4180)
- XLSX parser foundation (`exceljs`, server/domain only)
- structural/file discovery, headers, row/column/sheet counts
- UTF-8 + optional BOM; frozen delimiters `,` / `;` / tab
- malformed-file detection and named resource limits
- typed discovery result and parser error taxonomy
- Owner/Admin authorization before object access
- in-memory bounded byte handling (no original-filename OS paths)
- automated parser, auth, privacy, and non-effect tests
- this evidence document

Out of scope (not implemented):

- semantic field mapping / AI mapping / “this column is Customer Email”
- business validation, transformation, deduplication
- staging writes, `data_intake_mappings`, import plans/row results
- Customer create/update / canonical Customer writer
- external-record links, import approval/execution, mass update
- Production parser execution

---

## 5. Parser architecture

Flow:

1. Authenticated Owner/Admin
2. Active organization membership (`authorizeDataIntakeCaller`)
3. Role check (`canPerformDataIntakeFoundationCommand` → Owner/Admin)
4. Session belongs to the org and is `source_ready` or `parsed` (not `cancelled`)
5. Active source belongs to that session; `object_verified_at IS NOT NULL`
6. Server reads the exact private `data-intake` object (canonical path from the source row)
7. Independent size + SHA-256 re-check
8. Kind-dispatched parser (`parseSourceStructure`)
9. Persist structural metadata via `apply_data_intake_source_structure_mutation` / `confirm_source_structure`
10. Return typed discovery (headers + counts + warnings). **No business rows.**

| Item | Decision |
| --- | --- |
| Runtime | Next.js server / Node trusted process. Domain parsers are unit-testable without Production. |
| Memory | In-memory `Uint8Array` for ≤10 MB. No temp files. No original filename as OS path. |
| Max input | `DATA_MAX_FILE_BYTES` = 10 MiB (upload already enforces this). |
| Timeout | Same request as other DATA commands; workload caps prevent unbounded CPU/memory. |
| CSV | Hand-rolled RFC 4180 in `csv-structure.ts`. No `csv-parse` / `papaparse`. |
| XLSX | `exceljs` after ZIP central-directory inspection in `xlsx-zip-safety.ts`. No SheetJS `xlsx`. |
| Client | No public DATA API, no `"use client"`, no browser Storage URL, no service-role in the browser. |

`service_role` remains infrastructure for Storage download and the RPC. Human authority is the Owner/Admin actor identity passed into the RPC.

---

## 6. Parser dependency decision

Inspected `package.json` before adding libraries. No CSV/XLSX parser was already present. DATA-1C isolation previously forbade `csv-parse`, `papaparse`, and SheetJS.

| Package | Decision |
| --- | --- |
| `csv-parse` / `papaparse` | **Not added.** Frozen v1 CSV is small enough for a deterministic in-repo parser with explicit delimiter/encoding/limit behavior. |
| SheetJS `xlsx` | **Not added.** Historical isolation forbids it; community/license and formula-eval risk. |
| `exceljs` `^4.4.0` | **Added (server/domain only).** Purpose: load modern `.xlsx` workbooks after ZIP safety checks; expose sheet names, visibility, cell stored values/formula text; do not evaluate formulas. Standard libraries cannot unzip OOXML. MIT license. Not imported from `src/app` or any client module. Isolation test requires any `exceljs` import under `src/features/data-intake` to be exactly `xlsx-structure.ts`. |
| ETL frameworks | **Not added.** |

---

## 7. Authorization path

`discoverDataIntakeSourceStructure` reuses `authorizeCommand`:

- unauthenticated → `UNAUTHORIZED`
- Staff / Viewer → `FORBIDDEN_ROLE`
- suspended member / missing active membership → `ORG_NOT_FOUND` (service lookup miss)
- foreign Owner/Admin targeting another org → `ORG_NOT_FOUND`
- client Storage path / bucket / generated object id → `SOURCE_INVALID` before lookup
- unverified source → `SOURCE_NOT_VERIFIED`
- cancelled session → `INVALID_STATE`

RPC additionally requires `auth.role() = service_role`, active Owner/Admin membership, and rejects payload keys `storage_path` / `path` / `bucket` / `rows` / `records` / `bytes`.

---

## 8. Private object read path

Source identity resolves the canonical verified object. The server uses `source.storageBucket` + `source.storagePath` from the tenant-scoped row, then `objectStore.getObject`. Path must match `storagePathMatchesTenant`. Bytes are re-hashed. Mismatch → `SOURCE_HASH_INVALID`. Arbitrary client path is impossible (`clientAttemptedStorageAuthority`). No public object access. No signed URL is required for discovery.

---

## 9. CSV contract

Hand-rolled RFC 4180:

- quoted fields, embedded delimiters, escaped `""` quotes
- empty fields and trailing empty fields
- LF / CRLF / CR
- header row = first parsed record
- raw headers are not renamed
- formula-like cells (`=` prefix) remain text + warning `FORMULA_LIKE_CELL`
- duplicate / empty / whitespace / control-character headers → warnings, not silent rewrite
- inconsistent field counts → `INCONSISTENT_COLUMN_COUNT`
- empty data rows counted + `EMPTY_ROWS`
- unclosed quotes → `MALFORMED_CSV`
- zero useful rows → `HEADER_INVALID`

---

## 10. CSV encoding contract

Frozen v1: **UTF-8 only** via `TextDecoder({ fatal: true })`. UTF-8 BOM is accepted and recorded as `bom: true`. Invalid bytes → `UNSUPPORTED_ENCODING`. No legacy encoding guess. No silent replacement of invalid bytes.

---

## 11. Delimiter contract

Supported: `,` `;` tab. Detection probes the first 5 non-empty physical lines (`DATA_CSV_DELIMITER_PROBE_LINES`), scores unquoted delimiter counts, and **ties break to comma**. Deterministic and tested. Not an open-ended guessing engine. Persisted `delimiter` CHECK: `,` / `;` / tab.

---

## 12. XLSX contract

Modern `.xlsx` / `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` only. Legacy `.xls` / OLE → `UNSUPPORTED_FILE`.

Discovery:

- workbook validity (ZIP + `[Content_Types].xml` + `xl/workbook.xml`)
- sheet names, count, hidden/veryHidden
- default selected sheet = first **visible** sheet, else first sheet
- header row = first non-empty row (1-based)
- ordered raw headers, column/row counts, empty-row warning
- date/number/string cells as structural text only
- blank cells trimmed from trailing empties for width

---

## 13. XLSX security model

Untrusted ZIP:

- EOCD + central-directory inspection **before** `exceljs` load
- encrypted entries → `UNSUPPORTED_FILE`
- ZIP64 / entry count > 256 / uncompressed > 32 MiB / compression ratio > 100 → `PARSER_LIMIT_EXCEEDED`
- missing OOXML markers → `MALFORMED_XLSX`
- sheet/row/column caps
- no remote relationship fetch
- no macros/scripts execution (exceljs load of XML; formulas not computed)

---

## 14. Formula policy

**Formulas are never evaluated.** If a cell value object contains `formula`, discovery stores the formula text as `=<formula>` internally for header/width counting and emits `FORMULA_CELL`. Cached `result` is **not** used when a formula is present. CSV `=` prefixes are text + `FORMULA_LIKE_CELL`. Formula text is not placed in audit events or logs.

---

## 15. Resource limits

Centralized in `src/features/data-intake/domain/constants.ts`:

| Constant | Value |
| --- | --- |
| `DATA_MAX_FILE_BYTES` | 10 × 1024 × 1024 (10 MiB) |
| `DATA_MAX_DATA_ROWS` | 10_000 |
| `DATA_MAX_COLUMNS` | 50 |
| `DATA_MAX_HEADER_LENGTH` | 256 |
| `DATA_MAX_FIELD_LENGTH` | 4_096 |
| `DATA_MAX_XLSX_SHEETS` | 32 |
| `DATA_MAX_ZIP_ENTRIES` | 256 |
| `DATA_MAX_ZIP_UNCOMPRESSED_BYTES` | 32 MiB |
| `DATA_MAX_ZIP_COMPRESSION_RATIO` | 100 |
| `DATA_CSV_DELIMITER_PROBE_LINES` | 5 |
| `parse_metadata` JSON text | ≤ 32_768 characters (CHECK) |

Exceeding a cap returns a named error (`TOO_MANY_ROWS`, `TOO_MANY_COLUMNS`, `TOO_MANY_SHEETS`, `FIELD_TOO_LARGE`, `HEADER_INVALID`, `PARSER_LIMIT_EXCEEDED`, `FILE_TOO_LARGE`).

Tradeoff: CSV is streamed as a single UTF-8 string of ≤10 MB (acceptable). XLSX is loaded by exceljs after ZIP caps; uncompressed cap is 32 MiB so a 10 MB zip cannot expand without bound.

---

## 16. Normalized discovery contract

Discriminated union `DataSourceStructureDiscovery`:

CSV: `format: "csv"`, `encoding: "utf-8"`, `bom`, `delimiter`, `headers`, `columnCount`, `rowCount`, `emptyRowCount`, `warnings`, `parserVersion`, `headerRowIndex`.

XLSX: `format: "xlsx"`, `encoding: "utf-8"`, `sheets[]`, `selectedSheet`, same header/count/warning fields.

Client payload includes headers (structure) and **does not** include data rows. Tests assert `"1,2"` / data cell values are absent from the success JSON.

---

## 17. Persistence decision

**Option B — existing DATA-1B columns. No ninth table.**

Persisted on `data_intake_sources`: `encoding`, `delimiter`, `sheet_name`, `header_row_index`, `row_count`, `column_count`, `parse_metadata`.

`parse_metadata` holds parser version, warnings, empty-row count, header names, CSV BOM / XLSX sheet list. Forbidden keys `rows` / `records` / `cells` / `values` (integrity trigger). Headers are structural metadata on the source row, not audit-event payload and not logs.

---

## 18. Source / session state decision

Existing DATA-1B status `parsed` is used. Transition: `source_ready` → `parsed`. Discovery may replay on `parsed`. **Does not** auto-advance to `mapping_required`.

DATA-1C `cancel_session` still allows only `created` / `source_ready`. Cancel of `parsed` was **not** added (would replace the frozen foundation RPC). Tests cancel **before** discovery. Residual: a `parsed` session cannot be cancelled through the current RPC until a later governed cancel extension.

---

## 19. Error taxonomy

Added to `DATA_INTAKE_ERROR_CODES` (stable string codes, no stack traces to callers):

`SOURCE_NOT_FOUND`, `SOURCE_NOT_VERIFIED`, `UNSUPPORTED_ENCODING`, `MALFORMED_CSV`, `MALFORMED_XLSX`, `TOO_MANY_ROWS`, `TOO_MANY_COLUMNS`, `TOO_MANY_SHEETS`, `FIELD_TOO_LARGE`, `HEADER_INVALID`, `PARSER_LIMIT_EXCEEDED`

Existing: `UNAUTHORIZED`, `FORBIDDEN_ROLE`, `ORG_NOT_FOUND`, `INVALID_STATE`, `UNSUPPORTED_FILE`, `SOURCE_INVALID`, `SOURCE_HASH_INVALID`, `FILE_TOO_LARGE`, `DATABASE_WRITE_ERROR`.

---

## 20. Privacy / logging controls

- No `console.log` of bytes, headers, or rows in the parser/service path (privacy test spies `console.log` / `console.error`).
- Audit event metadata: `source_id`, `format`, `parser_version`, `column_count`, `row_count`, `sheet_count` — **no headers, no rows**.
- Parser errors use generic messages (`CSV must be valid UTF-8`, `CSV quoting is not closed`) without echoing field contents.
- Evidence and tests use synthetic headers only (`qa`, `col`, `label`, `id`).
- No analytics hook.

---

## 21. Idempotency

Same object hash + `data-parser-v1` recomputes the same structure. If `header_row_index` is already set, the RPC compares encoding/delimiter/sheet/counts/`parse_metadata` and returns `replayed: true` without a second `source_parsed` event. Fingerprint mismatch → `SOURCE_INVALID`. Tested.

---

## 22. Parser versioning

`DATA_PARSER_VERSION = "data-parser-v1"`. Stored in `parse_metadata.parser_version` and event metadata. Replay requires this exact version. Not a plugin framework.

---

## 23. Audit-event decision

Uses existing DATA-1B event type **`source_parsed`** (does not invent `source_structure_discovered`). One event on first confirmation; replay is silent.

---

## 24. Database changes

One additive migration, no new table:

`supabase/migrations/20260827160000_add_data_intake_source_structure_discovery.sql`

- tighter CHECKs on encoding / delimiter / `parse_metadata` size
- integrity trigger freeze of discovered structure
- `public.apply_data_intake_source_structure_mutation` (`confirm_source_structure` only)
- no Storage policy change, no RLS grant broadening, no Customer/BQA/CTX edits

Generated `Database` types include the new function key so `satisfies keyof Database["public"]["Functions"]` remains bound. Production typegen is deferred until a later FV apply.

---

## 25. Migration hash

File: `supabase/migrations/20260827160000_add_data_intake_source_structure_discovery.sql`

SHA-256: `561fe546c1376257194917544786c1a02b92cdfc931ea7de3168ce087ccb499b`

**Not applied to Production.** Do not `supabase db push`. DB-MIGRATION-DRIFT-01 remains binding.

---

## 26. RLS / grant effects

RPC: `SECURITY DEFINER`, `search_path = ''`, `REVOKE ALL` from `public` / `anon` / `authenticated`, `GRANT EXECUTE` to `service_role` only. Integrity function remains non-executable by roles (trigger-only). Storage policies unchanged. Eight DATA tables unchanged. No authenticated DATA write grants added.

---

## 27. DATA targeted tests

Prior DATA-1D baseline: **52 passed / 52**.

DATA-1E targeted command (features + DATA security files including the new structure-migration test): **73 passed / 73**.

Added coverage: CSV structure, XLSX structure, discovery/auth/privacy/non-effect, structure-migration security, isolation updates (`202608271600*`, exceljs allow-list, fifth DATA migration filename).

---

## 28. CSV test matrix

Covered: simple UTF-8; BOM; LF; CRLF; quoted commas; escaped quotes; empty/trailing empty fields; duplicate/empty/whitespace/control headers; inconsistent columns; empty rows; one-column; max columns success; too many columns/rows; field/header limits; invalid encoding; malformed quoting; zero useful rows; formula-like text.

---

## 29. XLSX test matrix

Covered: valid workbook; multiple sheets; hidden sheet + visible default; headers; blank/empty rows; date/number cells as text; formula cells without evaluation; empty sheet → `HEADER_INVALID`; max sheets/columns/rows; fake xlsx; truncated ZIP; OLE `.xls`; ZIP bomb via central-directory uncompressed size.

---

## 30. Authorization tests

Owner success; Admin success; Staff `FORBIDDEN_ROLE`; Viewer `FORBIDDEN_ROLE`; suspended `ORG_NOT_FOUND`; foreign Owner `ORG_NOT_FOUND`; unverified `SOURCE_NOT_VERIFIED`; cancelled `INVALID_STATE`; client `storagePath` `SOURCE_INVALID`.

---

## 31. Privacy tests

Discovery JSON omits data rows; events omit header CSV line; console spies see neither headers nor row bytes; no browser Storage URL; no public object access; tenant lookup remains org-scoped.

---

## 32. Non-effect tests

Replay assertion: `mappings`, `staging`, `plans`, `rowResults`, `links` length 0. Migration SQL must not insert mappings/staging or call `private.create_customer_record`. Isolation continues to forbid Customer writer, BQA, and org-context mutations in DATA modules.

---

## 33. Typecheck

`npx tsc --noEmit` — PASS

---

## 34. Lint

`npx next lint` — PASS (0 warnings)

---

## 35. Build

`next build` is **not** part of DATA-1C/1D/1E closure convention (same as DATA-1D).

---

## 36. Full-suite result

`npx vitest run`: **3239 passed, 2 failed, 3241 total**

Previous DATA-1D-FV baseline: 3218 passed, 2 failed, 3220 total. The +21 tests are DATA-1E coverage.

---

## 37. Targeted success percentage

`73 / 73 = 100%`

---

## 38. Full-suite success percentage

`3239 / 3241 = 99.94%`

Do not hide the two failures inside the percentage.

---

## 39. Historical failures

Unchanged; not treated as a desired permanent baseline:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

Neither was modified to go green.

---

## 40. New regressions

`NEW REGRESSIONS = 0`

---

## 41. Residual risks

- Cancel of `parsed` sessions is not in the DATA-1C foundation RPC; document for a later cancel-extension phase.
- exceljs still parses OOXML after ZIP caps; extreme hostile XML could consume CPU within those caps.
- CSV delimiter probe is deterministic among three delimiters; exotic separators fail as a single-column or inconsistent-column structure rather than a dedicated `UNSUPPORTED_DELIMITER` code.
- `FORCE RLS` remains false; deny-by-default is still zero policies + revoked grants (DATA-1C).
- Generated types include a function that Production does not have until FV apply.
- Headers persisted in `parse_metadata` are structural and potentially sensitive; they are not logged or placed on events.

---

## 42. Production verification proposal

Do **not** parse the retained DATA-1D-FV object from this close-out.

Required future owner string (do not manufacture):

`DATA-1E-FV CONTROLLED PRODUCTION SOURCE STRUCTURE DISCOVERY = AUTHORIZED`

Prefer a **fresh dedicated synthetic fixture**:

| Field | Proposed value |
| --- | --- |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (`ZyntixAI Production QA`) |
| Session | **fresh** Customer-target session |
| File | tiny synthetic CSV, e.g. `qa,col\n1,2\n` — no names, emails, phones |
| Later XLSX | optional second synthetic workbook, non-PII headers only |
| Do not reuse | DATA-1D-FV source `47c7ad4e-3731-419c-aa59-cd9e2472c306` unless a later FV plan proves reuse is safer |
| Mapping / staging / Customers | none; those deltas must remain 0 |
| Apply | targeted MCP apply of the frozen DATA-1E SQL/hash only — no `db push`, repair, or reset |

---

## 43. Explicit mapping / staging / import boundary

`SECURE CSV STRUCTURE DISCOVERY = IMPLEMENTED`

`SECURE XLSX STRUCTURE DISCOVERY = IMPLEMENTED`

`SEMANTIC MAPPING = NOT IMPLEMENTED`

`STAGING = NOT IMPLEMENTED`

`CUSTOMER IMPORT = NOT IMPLEMENTED`

`DATA-1E PRODUCTION DISCOVERY = NOT YET AUTHORIZED`

Do not start DATA-1F from this close-out.

---

## 44. Final Git state

Recorded after the evidence commit in the closing response. Required: branch `core/platform-readiness-20260707`, normal push, divergence `0 0`, clean worktree. No amend of published commits. No force-push.

---

## 45. Recommended DATA-1E-FV gate

DATA-1E implementation is complete and locally verified. The next phase is a **controlled Production structure-discovery QA** under a new owner authorization string, using a fresh synthetic non-PII CSV (not the historical DATA-1D evidence object), proving parser behavior only.

Do not start semantic mapping. Do not start staging. Do not start Customer import. Do not start DATA-1F automatically.
