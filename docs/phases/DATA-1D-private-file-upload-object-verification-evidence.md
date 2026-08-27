# DATA-1D — Private File Upload + Storage Object Verification

| Field | Value |
| --- | --- |
| Phase | **DATA-1D — PRIVATE FILE UPLOAD + STORAGE OBJECT VERIFICATION** |
| Parent | DATA-1C |
| Document type | Implementation evidence |
| Date | 2026-08-27 |
| Formal status | `DATA-1D IMPLEMENTATION COMPLETE WITH EVIDENCE — PRIVATE FILE UPLOAD + OBJECT VERIFICATION READY FOR CONTROLLED PRODUCTION QA` |
| Governing implementation | `docs/phases/DATA-1C-universal-business-data-intake-database-security-foundation-evidence.md` |
| DATA-1C-FV | `docs/phases/DATA-1C-FV-controlled-production-data-intake-foundation-verification-evidence.md` |
| Governing contract | `docs/phases/DATA-1B-universal-business-data-intake-domain-schema-contract.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `f17cf06e376515b6a5e8f9a3fbbffda1445cf725` |
| Production apply | **NOT PERFORMED** |
| Production upload | **NOT AUTHORIZED** |

**REAL PRIVATE FILE UPLOAD IMPLEMENTATION = READY FOR CONTROLLED PRODUCTION VERIFICATION**

**PARSER = NOT IMPLEMENTED**

**CUSTOMER IMPORT = NOT IMPLEMENTED**

**DATA-1D PRODUCTION UPLOAD = NOT YET AUTHORIZED**

`OBJECT VERIFICATION / REAL FILE UPLOAD` is implemented locally and frozen for a later DATA-1D-FV gate. It is **not** live on Production.

---

## 1. Purpose

DATA-1D adds the governed **real private source-file upload and Storage object verification layer** on the DATA-1C foundation.

A supported CSV or XLSX file can be uploaded only after Owner/Admin authorization, only to a server-generated `data-intake` path, and only becomes verified after the server independently hashes the bytes, confirms size, and read back the stored object.

This phase stops before parsing, mapping, validation, duplicate resolution, Customer import, or canonical Customer mutation.

---

## 2. Prior DATA-1C dependency

Authoritative prior verdict:

`DATA-1C-FV CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION DATA INTAKE METADATA + SECURITY FOUNDATION VERIFIED`

`DATA-1C RELEASE READY WITH EVIDENCE`

Closure HEAD: `f17cf06e376515b6a5e8f9a3fbbffda1445cf725`

DATA-1C proved session creation, source metadata registration, tenant isolation, actor authorization, private `data-intake` bucket, generated object paths, event immutability, and zero Customer side effects. DATA-1C-FV retained cancelled metadata-only fixture:

- session `b9ee53d7-b2a1-46c6-92e7-9f44a41a3dc9`
- source `0b1fca8d-7bb7-4be3-815b-cca3008aa231`

That fixture is **not** reused as an active DATA-1D upload session (`cancelled` is terminal). Historical verification rows were not mutated.

---

## 3. Starting Git state

Proven before DATA-1D files were added:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `f17cf06e376515b6a5e8f9a3fbbffda1445cf725` |
| Subject | `docs(data): verify controlled Production intake metadata fixture` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `f17cf06e376515b6a5e8f9a3fbbffda1445cf725` |
| Divergence | `0 0` |
| `git status` | clean |
| Staged / unstaged / untracked | none |
| `git diff --check` | clean |

---

## 4. Frozen scope

In scope:

- governed upload preparation
- private object upload via server/service_role Storage
- generated Storage object identity (DATA-1C path, unchanged)
- object existence / metadata / size / SHA-256 verification
- MIME + signature enforcement
- tenant/session/source path enforcement
- bounded signed read after verification
- replacement provenance (supersede row, never rewrite hash/path)
- cleanup of failed uploads
- Production-verification plan using a tiny synthetic non-PII file

Out of scope (not implemented):

- CSV/XLSX parsing, sheet discovery, header detection, schema inference
- field mapping, validation, duplicate matching
- import planning/approval/execution
- Customer import / canonical Customer writer
- external record linking, mass update, autonomous AI import

DATA-1B originally listed parser ownership under “DATA-1D”. This track’s owner prompt **reassigns** DATA-1D to upload/object verification and keeps parser outside. Parser remains **NOT IMPLEMENTED**.

---

## 5. Architecture decision

**Chosen: direct server upload (≤10 MB) + a separate purpose-specific RPC for confirmation.**

| Option | Decision |
| --- | --- |
| Bytes through the DATA-1C JSON RPC | Rejected. jsonb is not a file transport. |
| Signed upload URL to authenticated Storage | Rejected. Would require broadening Storage policies. |
| Overload `apply_data_intake_foundation_mutation` | Rejected. Avoids irresponsible overload of the frozen 1C function. |
| Direct server `storage.upload` with `upsert: false` | **Accepted.** Smallest path for the frozen 10 MB limit. |
| Separate RPC `apply_data_intake_source_object_mutation` | **Accepted.** Confirms verification after the server hashed and read back the object. |

Flow:

1. Authenticated Owner/Admin
2. Active organization membership
3. Session `source_ready` (metadata already registered by DATA-1C)
4. Active source row; server derives canonical Storage key from DB identities
5. Validate filename/MIME/extension/signature/size
6. Server SHA-256 of the provided bytes; must equal registered `sha256` and `byte_size`
7. Upload to exact path, `upsert: false`, bucket `data-intake` only
8. Download and independently re-hash
9. RPC `confirm_source_object` sets `object_verified_at` and appends `source_object_verified`
10. On any post-upload failure, delete the object and leave the source unverified

The client never supplies organization/session/source/object path segments, bucket, or generated object UUID.

`service_role` remains executor. Human actor identity is the Owner/Admin user id.

---

## 6. Threat model

Mitigated:

- path traversal / prefix escape
- foreign org/session/source substitution
- Social-bucket escape
- overwrite of another source object (`upsert: false`; path contains source id)
- client-declared hash as sole integrity proof
- MIME/extension mismatch and `.xls` / OLE disguise
- zip bytes presented as CSV
- zero-byte and >10 MB
- cancelled-session upload
- superseded-source upload
- authenticated/anon Storage list/select/upload/update/delete on `data-intake`
- public URL

Residual (accepted):

- Confirm RPC does not inspect Storage (bytes never enter SQL). It is `service_role`-only and is called only after server readback. A misbehaving privileged caller could confirm without an object; product code does not expose that path to browsers.
- CSV has no unique magic; v1 rejects NUL and zip/OLE disguises but cannot prove “this is tabular CSV” without parsing (parser is out of scope).
- Superseded objects are not deleted in 1D (provenance). TTL cleanup is a later worker.

---

## 7. Authorization model

Only active Owner/Admin of the target organization may upload, confirm, or mint a signed read URL.

| Actor | Result |
| --- | --- |
| Unauthenticated | `UNAUTHORIZED` |
| Suspended member | `ORG_NOT_FOUND` (no active membership) |
| Staff | `FORBIDDEN_ROLE` |
| Viewer | `FORBIDDEN_ROLE` |
| Foreign Owner | `ORG_NOT_FOUND` |
| Wrong session/source | `SESSION_NOT_FOUND` / `SOURCE_INVALID` |
| Cancelled session | `INVALID_STATE` |
| Superseded source | `INVALID_STATE` |

`service_role` as JWT executor is required for the confirm RPC and does **not** replace human membership checks. Staff + service_role still returns `FORBIDDEN_ROLE`.

---

## 8. Storage path model

Unchanged from DATA-1C:

`{organization_id}/{session_id}/{source_id}/{generated_object_id}.csv|.xlsx`

- Original filename is metadata only.
- Product command types do not include path/bucket/object id.
- RPC rejects payloads containing `storage_path`, `storagePath`, `path`, `bucket`, `generated_object_id`, or `generatedObjectId`.
- Object store refuses any bucket other than `data-intake` and any key that fails `parseDataIntakeStoragePath`.

---

## 9. MIME / type model

Canonical v1:

| Kind | Extension | MIME | Signature |
| --- | --- | --- | --- |
| CSV | `.csv` | `text/csv` | not OLE, not ZIP, no NUL |
| XLSX | `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | ZIP local/empty/spanned header |

Explicit CSV charset parameter `text/csv; charset=utf-8` is stripped to `text/csv`. `text/plain`, `application/csv`, `application/vnd.ms-excel`, `application/octet-stream`, and `.xls` are rejected. Extension/MIME/kind mismatch fails closed. Legacy OLE `D0 CF 11 E0` is rejected even when named `.csv`.

Bytes are inspected only for hashing and these signatures. No CSV rows, headers, or workbook sheets are read.

---

## 10. Size model

- Application checks `0 < size <= 10485760` **before** upload.
- Registered `byte_size` must equal uploaded byte length.
- Bucket limit (10 MB) is defense in depth, not the only check.
- Zero-byte rejected. Oversized rejected. No truncation. No multipart.

---

## 11. SHA-256 integrity model

**Contract:** `data_intake_sources.sha256` is the **intended** digest declared at `register_source` (immutable). It is **not** proof of stored bytes until DATA-1D verification.

After upload the server:

1. hashes the caller-provided bytes with Node `crypto.createHash("sha256")`
2. requires equality with the registered digest and size
3. downloads the stored object
4. hashes the stored bytes independently
5. only then calls `confirm_source_object` with the verified digest/size, which must match the row

A client-declared digest is never treated as final proof. Confirm payload cannot change `sha256`/`byte_size`/`storage_path`.

---

## 12. Source lifecycle

No new session statuses. Frozen DATA-1C machine is reused.

| Fact | Encoding |
| --- | --- |
| Metadata registered | session `source_ready`; event `source_uploaded` (DATA-1C semantic; no object yet) |
| Object verified | `sources.object_verified_at` set; event `source_object_verified` |
| Failed upload | source remains unverified; object deleted if present |
| Cancelled | session `cancelled`; upload/finalize denied |

Parser states are not added. Parser (later) must require `object_verified_at IS NOT NULL`.

---

## 13. Failure / cleanup behavior

| Failure | Behavior |
| --- | --- |
| Metadata registered, no upload | Cancellable; not verified; no fake success |
| Upload then confirm RPC fails | Object deleted; source unverified |
| Wrong size/hash before upload | No object created |
| Readback hash mismatch | Object deleted; source unverified |
| Duplicate upload of matching verified object | Idempotent confirm (`replayed: true`); no second event |
| Unverified leftover object that does not match | Deleted, then intended bytes uploaded |
| Cancelled session | Fail closed |
| Source replacement | New row + new path; old hash/path preserved; only active source can verify |

---

## 14. RPC / API changes

New bounded RPC:

`public.apply_data_intake_source_object_mutation(text, uuid, uuid, uuid, jsonb)`

- `SECURITY DEFINER`, `search_path = ''`
- EXECUTE `service_role` only
- Operation: `confirm_source_object` only
- Args: organization, actor user, actor member, payload `{ session_id, source_id, sha256, byte_size }`
- Returns the same success envelope as DATA-1C plus `object_verified_at` and `replayed`

Server methods (server-only, no public route, no browser service-role):

- `uploadAndVerifyDataIntakeSource`
- `createDataIntakeSourceReadUrl` (60s, exact object, verified sources only)

DATA-1C commands are unchanged: `createDataIntakeSession`, `registerDataIntakeSource`, `cancelDataIntakeSession`.

---

## 15. Schema changes

One additive migration after the frozen DATA-1C ledger:

`supabase/migrations/20260827150000_add_data_intake_source_object_verification.sql`

SHA-256 (lowercase hex): `ba3fab563b6c4a518163ecc1808af66e4aaf68670988cbe01dfb2b038d4993d5`

`supabase migration new` originally emitted `20260827131739_...`, which would sort **before** DATA-1C (`20260827140000`). The file was ordered as `20260827150000` so it cannot apply before the eight tables exist. Frozen 1C files were not edited.

Schema:

- `data_intake_sources.object_verified_at timestamptz` (nullable)
- `data_intake_sources.object_verified_by_user_id uuid` (nullable)
- CHECK: both null or both non-null
- Integrity trigger: once `object_verified_at` is set, it cannot change
- Event CHECK adds `source_object_verified` (additive; no history rewrite)
- No ninth table
- No parser/import columns

---

## 16. RLS / grants / policies

DATA tables remain: RLS enabled, zero policies, authenticated/anon/public revoked. `service_role` grants unchanged (events still INSERT/SELECT only).

New RPC: EXECUTE granted to `service_role` only; revoked from public/anon/authenticated.

---

## 17. Storage policies

**Unchanged.** DATA-1D migration does not touch `storage.objects`.

Restrictive 1C policies remain:

- `data_intake_no_anon_all`
- `data_intake_no_authenticated_all`
- `USING/CHECK (bucket_id IS DISTINCT FROM 'data-intake')`

No `authenticated USING (bucket_id = 'data-intake')`. Uploads use the service-role Storage client on the server. No public URL. Signed read is server-minted, 60 seconds, exact key.

---

## 18. Event semantics

DATA-1C-FV showed `source_uploaded` is emitted at **metadata registration**, not object upload. Production history is **not** rewritten.

Forward-looking correction: add `source_object_verified` for actual object readiness.

| Event | Meaning |
| --- | --- |
| `source_uploaded` / `source_replaced` | DATA-1C metadata + generated path |
| `source_object_verified` | Server hashed, stored, read back, confirmed |

Payloads contain source id, kind, size, sha256, bucket — **no filename, no bytes, no PII**. Events remain immutable.

---

## 19. Automated tests

Targeted DATA files: **52 passed**.

| Area | Coverage |
| --- | --- |
| Happy path | Owner CSV; Admin CSV; XLSX zip signature; path/size/hash; `source_object_verified` |
| Authorization | anon, Staff, Viewer, suspended, foreign Owner; Staff confirm RPC + service_role |
| Path security | client path rejected; foreign session/source; Social bucket; `../` |
| Type validation | extension, MIME, zero-byte, >10 MB, OLE, zip-as-CSV |
| Integrity | declared size/hash mismatch; mutated readback deletes object and refuses confirm |
| State | cancelled upload denied; replay idempotent; replacement provenance |
| Storage | private store refuses other buckets; signed read bound to exact verified path |
| Non-effects | zero mappings/staging/plans/row results/links; session stays `source_ready` |
| Isolation | no public API, no parser libraries, no Customer writer, no BQA/CTX mutation |
| Migration | additive 1D SQL; no ninth table; RPC grants; Storage policies untouched |

---

## 20. Cross-tenant results

- Lookup is `organization_id` + session/source id.
- Composite FKs from DATA-1C remain.
- Foreign Owner cannot target the QA org.
- Object keys include organization id; store parser rejects keys that do not match the four-UUID contract.
- Signed URL is minted only after same-org verified source lookup.

---

## 21. State-machine tests

- `created` cannot upload (requires `source_ready`)
- `source_ready` + unverified source can upload
- `cancelled` upload denied
- verified replay does not insert a second event
- superseded source cannot verify; active replacement can
- historical hash/path of superseded row unchanged

---

## 22. Object-integrity tests

- Server hash must match registered digest
- Stored byte length must match registered size
- Independent readback hash; mismatch deletes object
- Confirm RPC rejects digest/size that do not match the row
- Confirm RPC rejects client path fields

---

## 23. Non-effects

Implementation is confined to `src/features/data-intake/**`, DATA tests, one additive migration, generated Database types, and this evidence document.

No edits to BQA, TAX, CAP, CTX, admissions, Activities, Customers, Programs, Enrollments, Tasks, Attention, invitations, memberships, Path B, Social, billing, or onboarding product code. Isolation tests continue to forbid DATA table tokens in those surfaces.

Canonical Customer writer was not modified. No Customer import RPC exists.

---

## 24. Full-suite results

| Gate | Result |
| --- | --- |
| Targeted DATA | **52 passed** |
| `npx tsc --noEmit` | PASS |
| `npx next lint` | PASS (0 warnings) |
| `npx vitest run` | **3218 passed, 2 failed, 3220 total** |
| `git diff --check` | clean |
| `next build` | not part of DATA-1C/1D closure convention |

Historical failures only (unchanged):

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

No third failure. Previous DATA-1C-FV baseline was 3199/2/3201; the +19 tests are DATA-1D coverage.

---

## 25. Residual risks

- Confirm RPC is storage-blind by design (see §6).
- CSV signature is negative (not-binary / not-zip), not a parser.
- `FORCE RLS` remains false; deny-by-default is still zero policies + revoked grants.
- Generated types for the new RPC/columns were updated in-repo to keep `keyof Database["public"]["Functions"]` binding. Production typegen against the live project is deferred until DATA-1D-FV apply (the live catalog does not yet have this RPC).
- DATA-1C-FV cancelled fixture remains object-less; that is historical evidence, not a defect.

---

## 26. Production verification plan

Do **not** upload to Production from this implementation close-out.

Required future owner string (do not manufacture):

`DATA-1D-FV CONTROLLED PRODUCTION PRIVATE FILE UPLOAD = AUTHORIZED`

Proposed QA fixture (when authorized):

| Field | Proposed value |
| --- | --- |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (`ZyntixAI Production QA`) |
| Session | **fresh** Customer-target session; `business_activity_id` NULL |
| Do not reuse | cancelled 1C session `b9ee53d7-b2a1-46c6-92e7-9f44a41a3dc9` |
| File | tiny synthetic CSV, e.g. `qa,col\n1,2\n` — no names, emails, phones, addresses |
| Size | well under 10 MB |
| SHA-256 | server-computed from those exact bytes |
| Storage | exactly one private `data-intake` object at the generated path |
| Parser / staging / Customers | none; delta Customers must remain 0 |
| After proof | cancel the session via governed `cancel_session`; **retain** session + source + object as durable QA evidence (same policy as DATA-1C-FV metadata retention) unless FV later requires deletion |

Apply the local migration via targeted MCP `apply_migration` of the frozen SQL/hash only. No `db push`, repair, reset, or history rewrite. DB-MIGRATION-DRIFT-01 remains binding.

---

## 27. Explicit parser / import boundary

`PARSER = NOT IMPLEMENTED`

`CUSTOMER IMPORT = NOT IMPLEMENTED`

`DATA-1D PRODUCTION UPLOAD = NOT YET AUTHORIZED`

Do not start DATA-1E from this close-out.

---

## 28. Final Git state

Recorded after the implementation and evidence commits in the closing response. Required: branch `core/platform-readiness-20260707`, normal push, divergence `0 0`, clean worktree. No amend of published commits. No force-push.

---

## 29. Recommendation for DATA-1D-FV

DATA-1D implementation is complete and locally verified. The next phase is a **controlled Production QA upload** under a new owner authorization string, using a fresh session and a tiny synthetic non-PII CSV, then cancel-and-retain.

Do not start parser/import work. Do not start DATA-1E automatically.
