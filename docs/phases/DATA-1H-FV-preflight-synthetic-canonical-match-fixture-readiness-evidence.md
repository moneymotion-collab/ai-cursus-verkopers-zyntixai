# DATA-1H-FV-PREFLIGHT — Synthetic Canonical Match Fixture Readiness

| Field | Value |
| --- | --- |
| Phase | **DATA-1H-FV-PREFLIGHT — SYNTHETIC CANONICAL MATCH FIXTURE + PRODUCTION READINESS INVESTIGATION** |
| Parent | DATA-1H |
| Document type | Read-only Production preflight evidence |
| Date | 2026-08-30 |
| Formal status | `DATA-1H-FV PREFLIGHT CLOSED WITH EVIDENCE — SYNTHETIC CANONICAL MATCH FIXTURE PREPARATION REQUIRED` |
| Governing DATA-1H | `docs/phases/DATA-1H-deterministic-customer-matching-identity-resolution-foundation-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `ca47c9767ae17c78a2cdd5a30a230223219a750d` |
| Production apply | **NOT PERFORMED** |
| Production matching | **NOT PERFORMED** |
| Customer writes | **0** |

**DATA-1H-FV SYNTHETIC CANONICAL MATCH FIXTURE = OWNER FIXTURE PREPARATION REQUIRED**

**DATA-1H-FV PREFLIGHT = BLOCKED ON SYNTHETIC CANONICAL FIXTURE ONLY**

**DATA-1H IMPLEMENTATION REMAINS HEALTHY**

**PRODUCTION MUTATIONS ATTRIBUTABLE TO PREFLIGHT = 0**

---

## 1. Executive verdict

This preflight is read-only. Production identity, DATA-1H frozen migration hash, canonical Customer uniqueness, and DATA security baseline are healthy. DATA-1H matching is unapplied, as expected.

The QA organization contains one authoritatively synthetic Customer (`B1.5.6 Lifecycle QA Customer`). That Customer was created with display name only. Its email remains null. DATA-1H v1 matches **exact normalized email**, not name. Therefore it cannot serve as the future exact-match fixture.

No other QA Customer has authoritative synthetic provenance plus a usable reserved email. One QA Customer has an email; it is **not** proven synthetic and is not documented here.

Future DATA-1H-FV therefore requires a separately governed `DATA-1H-FIXTURE-PREP` phase before controlled Production matching.

---

## 2. Purpose

Determine whether an already-existing, authoritatively synthetic QA Customer can be reused for DATA-1H-FV exact-match case A without creating a Customer.

This preflight does not authorize matching, migration apply, or Customer mutation.

---

## 3. DATA-1H dependency

Authoritative DATA-1H:

- implementation: `a80e940` — `feat(data): add deterministic customer identity resolution`
- evidence HEAD: `ca47c9767ae17c78a2cdd5a30a230223219a750d`
- evidence: `docs/phases/DATA-1H-deterministic-customer-matching-identity-resolution-foundation-evidence.md`

Code truth: `customer-matcher-v1` uses persisted `normalized_values.email` and same-organization Customer email only.

---

## 4. Repository start state

- worktree: `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1`
- branch: `core/platform-readiness-20260707`
- HEAD: `ca47c9767ae17c78a2cdd5a30a230223219a750d`
- subject: `docs(data): record customer identity resolution evidence`
- upstream: `origin/core/platform-readiness-20260707` at the same SHA
- divergence: `0 0`
- worktree: clean
- `git diff --check`: clean

---

## 5. Production identity

| Item | Verified value |
| --- | --- |
| Supabase project | `dmctinrcjvsgmoxwwodw` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Application | `https://www.zyntixai.com` |
| QA organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| QA name / status | `ZyntixAI Production QA` / `active` |

Identity matches the authorized target.

---

## 6. DATA-1H frozen migration

Local file: `supabase/migrations/20260830200000_add_data_intake_customer_identity_resolution.sql`

Not applied to Production.

---

## 7. Migration hash

Recalculated SHA-256:

`e745e566918b76c436d92c5333fa49d0ad32fad1c06534a2f6ebbd3bce412b1d`

Exact match to the frozen DATA-1H evidence. No stop condition.

---

## 8. Remote migration state

Latest DATA ledger stamps remain DATA-1G-FV:

- `20260830113709` `add_data_intake_value_validation_staging`
- `20260830113944` `create_apply_data_intake_staging_mutation`
- `20260830114056` `align_data_intake_session_cancellation_for_1g`

`20260830200000_add_data_intake_customer_identity_resolution` is **absent**.

Unrelated Social/BQA/TAX/CAP/CTX history is present and was not repaired.

Future targeted DATA-1H-FV apply appears safe from catalog inspection. It is **not** authorized here.

---

## 9. DATA security baseline

- DATA tables = 8
- RLS = 8/8 enabled
- Staging resolution columns `resolution`, `target_operation`, `target_record_id` present
- Private `data-intake` bucket: `public=false`, 10 MiB limit
- Staging RPC present
- Matching RPC absent
- `matching_completed` event type absent

No unexpected Customer/DATA security change since DATA-1G-FV.

---

## 10. Canonical Customer identity contract

Unchanged. Matching reads `id`, `organization_id`, `email`, `archived_at`. Writes are forbidden.

---

## 11. Customer unique index

Production:

```text
CREATE UNIQUE INDEX customers_org_email_unique_idx
  ON public.customers USING btree (organization_id, lower(btrim(email)))
  WHERE (email IS NOT NULL)
```

Matches repository migration `20260705160001_create_customers.sql`.

---

## 12. Normalization contract

`private.normalize_customer_email` = `nullif(lower(btrim(p_email)), '')`.

DATA-1H uses already-staged DATA-1G normalized email. No second algorithm.

---

## 13. Archived eligibility

DATA-1H includes archived Customers because the unique index includes them. No archive mutation was performed.

---

## 14. Synthetic classification criteria

A Customer is FV-safe only with authoritative evidence (A–D in the preflight brief). Looking fake, containing “test”/“qa”, or belonging to the QA org is not enough.

---

## 15. Repository evidence search

Evidence-first search found one governed synthetic Customer:

- `docs/phases/B1.5.6-R1-FIXTURE-controlled-qa-eligibility-preparation.md`
- display name: `B1.5.6 Lifecycle QA Customer`
- created through `/customers/new` as Path A fixture preparation
- **Fields set: display name only. Optional fields left empty.**

DATA-1F/1G FV documents use `synthetic@example.invalid` / `valid@example.invalid` only as **staged source values**. Those phases explicitly did not create Customers.

No repository evidence records a synthetic canonical Customer email.

---

## 16. Candidate discovery process

1. Search evidence for fixture IDs/emails.
2. Query only the evidence-backed display name in the QA org.
3. Count QA emails / `.invalid` emails without listing non-synthetic identities.
4. Do not export the remaining QA Customers.

---

## 17. Candidate PII minimization

Queried only: `id`, `organization_id`, `display_name`, email-null / `.invalid` booleans, `archived_at` presence, `status`, `created_at`.

No phone, notes, or unrelated metadata. No non-synthetic emails printed.

---

## 18. Safe candidate result

**SAFE EXISTING SYNTHETIC QA CUSTOMER FOUND = YES (identity only)**

**SAFE EXISTING EXACT-MATCH FIXTURE = NO**

Reason: the proven synthetic Customer has `email IS NULL`. DATA-1H cannot match it.

Other QA Customers: **NOT SAFE FOR FV** (no authoritative synthetic+email provenance). Their identities are not printed.

---

## 19. Synthetic provenance

`B1.5.6 Lifecycle QA Customer` satisfies criteria A and B: governed fixture-preparation evidence explicitly created it as a QA Customer.

It does **not** satisfy exact-match requirements 3–6 (non-null usable email).

---

## 20. Candidate Customer ID if safe

Identity-safe, match-unusable:

`8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921`

QA org bound. Status `onboarding`. Not archived. Created `2026-07-26`.

Do not use this ID as `target_record_id` in DATA-1H-FV until a reserved email exists on a governed synthetic Customer.

---

## 21. Synthetic normalized email if safe

**None.** Email is null. No normalized match key exists.

---

## 22. Same-org uniqueness proof

Not applicable for exact-match (no email).

Display-name count for the evidence label in QA org = 1.

QA Customers with any `.invalid` email = 0.

---

## 23. Eligibility proof

Under DATA-1H, a null-email Customer is never an exact match. A staged row with that name and no email would classify `no_key`, not `duplicate`.

---

## 24. No-match future email proposal

Proposed reserved address (not persisted):

`data-1h-fv-no-match-20260830@example.invalid`

---

## 25. No-match count proof

Same-org canonical count for that address: **0**

Known DATA-1F/1G staged addresses `valid@example.invalid` and `synthetic@example.invalid` also have same-org count **0**.

---

## 26. Future exact-match FV design

Blocked until fixture-prep. After a governed synthetic Customer with a unique `.invalid` email exists:

- ROW A: validated staged email = that exact normalized email → `duplicate` / `link` / server-computed `target_record_id`
- ROW B: `data-1h-fv-no-match-20260830@example.invalid` → `create` / null target
- OPTIONAL ROW C: blocked validation row → matching skipped

No Customer write. Client must not submit `target_record_id`.

---

## 27. Blocked-row FV policy

A blocked staged row needs no Customer mutation. It may be included in a future synthetic source.

Not created in this preflight.

---

## 28. Ambiguous-match Production policy

`AMBIGUOUS CANONICAL MATCH PRODUCTION FIXTURE = NOT REQUIRED`

Canonical uniqueness exists. Duplicate-canonical behavior remains automated-test coverage only. Do not manufacture duplicate Customers.

---

## 29. Customer count before/after

| Scope | Before | After | Delta |
| --- | --- | --- | --- |
| Global Customers | 116 | 116 | 0 |
| QA Customers | 6 | 6 | 0 |

---

## 30. DATA counts before/after

| Object | Before | After | Delta |
| --- | --- | --- | --- |
| sessions | 6 | 6 | 0 |
| sources | 6 | 6 | 0 |
| mappings | 6 | 6 | 0 |
| staging rows | 2 | 2 | 0 |
| import plans | 0 | 0 | 0 |
| row results | 0 | 0 | 0 |
| external links | 0 | 0 | 0 |
| `data-intake` storage objects | 5 | 5 | 0 |

Historical DATA-1C–1G-FV leftovers are unchanged.

---

## 31. Zero-mutation proof

SELECT-only MCP `execute_sql` and `list_migrations` / `list_projects` / `get_project`.

No INSERT/UPDATE/DELETE/UPSERT. No session, upload, stage, match, or plan.

`PRODUCTION MUTATIONS ATTRIBUTABLE TO PREFLIGHT = 0`

---

## 32. Customer writer non-effect

`CUSTOMER WRITER INVOKED = NO`

`CUSTOMER WRITER MODIFIED = NO`

No `create_customer`, `update_customer`, `archive_customer`, or `private.create_customer_record` call.

---

## 33. DATA-1H RPC Production status

`DATA-1H MATCHING RPC PRODUCTION STATUS = ABSENT`

Expected. Not invoked.

---

## 34. Migration readiness

`DATA-1H MIGRATION PREFLIGHT = READY`

No function conflict (`apply_data_intake_matching_mutation` count = 0). Prerequisites present: eight DATA tables, staging RPC, staging resolution columns, Customer unique index, event table (without `matching_completed` yet). Additive apply is the future FV concern, not this preflight.

---

## 35. Security readiness

Local automated DATA-1H evidence remains:

- Owner/Admin allowed
- Staff/Viewer/suspended/unauthenticated denied
- foreign org/session/source denied
- `target_record_id` server-computed
- foreign Customer target impossible
- `service_role` executor only

No Production negative tests against real Customer data were performed.

---

## 36. Targeted DATA tests

`npx vitest run tests/features/data-intake tests/security/data-intake`

**143 passed / 143 total**

---

## 37. Targeted percentage

`143 / 143 = 100%`

---

## 38. Typecheck

`npx tsc --noEmit` — PASS

---

## 39. Lint

`npx next lint` — PASS (0 warnings)

---

## 40. Full suite

`npx vitest run`: **3309 passed, 2 failed, 3311 total**

---

## 41. Full-suite percentage

`3309 / 3311 = 99.9396%`

---

## 42. Historical failures

Exactly:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

---

## 43. New regressions

`NEW REGRESSIONS = 0`

---

## 44. Future owner gate

Do not start DATA-1H-FV yet.

Required later, in order:

1. `DATA-1H-FIXTURE-PREP` owner authorization (create or assign a reserved `.invalid` email on a synthetic QA Customer)
2. Then, separately: `DATA-1H-FV CONTROLLED PRODUCTION CUSTOMER MATCHING = AUTHORIZED`

---

## 45. Fixture-preparation requirement

Minimum future fixture (not created here):

- QA org `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` only
- clearly synthetic display name
- unique reserved email, preferred form `data-1h-fv-exact-match-<token>@example.invalid`
- same-org match count = 1 after create
- no real-person PII
- no uniqueness-constraint change
- optional: add email to existing `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921` **only** if a later fixture-prep phase explicitly authorizes that Customer UPDATE

Do not create the Customer in DATA-1H-FV itself.

---

## 46. Residual risks

- QA org has other Customers, including one with an email. They are not proven synthetic and must not be used as match targets.
- Matching remains TOCTOU after any later fixture-prep.
- DATA-1H migration is still unapplied; FV must apply it under its own gate.
- Historical invitations + Programs/Enrollments copy failures remain tracked debt.

---

## 47. Final Git state

Recorded after the evidence-only commit and normal push.

Expected:

- branch `core/platform-readiness-20260707`
- upstream `origin/core/platform-readiness-20260707`
- divergence `0 0`
- clean worktree

---

## 48. Final verdict

`DATA-1H-FV PREFLIGHT CLOSED WITH EVIDENCE — SYNTHETIC CANONICAL MATCH FIXTURE PREPARATION REQUIRED`

`DATA-1H-FV SYNTHETIC CANONICAL MATCH FIXTURE = OWNER FIXTURE PREPARATION REQUIRED`

`DATA-1H-FV PREFLIGHT = BLOCKED ON SYNTHETIC CANONICAL FIXTURE ONLY`
