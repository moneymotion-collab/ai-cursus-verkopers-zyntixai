# DATA-1H-FIXTURE-PREP — Synthetic Canonical Customer Exact-Match Fixture

| Field | Value |
| --- | --- |
| Phase | **DATA-1H-FIXTURE-PREP — GOVERNED SYNTHETIC CANONICAL CUSTOMER MATCH FIXTURE PREPARATION** |
| Parent | DATA-1H / DATA-1H-FV-PREFLIGHT |
| Document type | Fixture-preparation evidence |
| Date | 2026-08-30 |
| Formal status | `DATA-1H-FIXTURE-PREP CLOSED WITH EVIDENCE — SYNTHETIC CANONICAL CUSTOMER EXACT-MATCH FIXTURE READY` |
| Governing preflight | `docs/phases/DATA-1H-FV-preflight-synthetic-canonical-match-fixture-readiness-evidence.md` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `3264dc977cc771d1924b7ec457cf0cd0166a739f` |
| DATA-1H migration apply | **NOT PERFORMED** |
| DATA-1H matching executed | **NO** |
| DATA-1H-FV started | **NO** |

**DATA-1H-FV EXACT-MATCH FIXTURE = READY**

**FIXTURE RETENTION = INTENTIONAL**

**CUSTOMER ROWS UPDATED = 1**

**CUSTOMERS CREATED = 0**

**CUSTOMERS DELETED = 0**

**BUSINESS FIELD DELTA = EMAIL ONLY**

**CANONICAL MATCH COUNT = 1**

**CUSTOMER COUNT DELTA = 0**

**DATA-1H PRODUCTION APPLY = NOT PERFORMED**

**DATA-1H PRODUCTION MATCHING EXECUTED = NO**

---

## 1. Executive verdict

The already-existing synthetic QA Customer `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921` now has the reserved `.invalid` email required for a later DATA-1H-FV exact match. Exactly one governed profile update ran. No Customer was created or deleted. DATA-1H was not applied and matching was not executed.

---

## 2. Strategic purpose

DATA-1H-FV-PREFLIGHT found a synthetic Customer with `email = NULL`. DATA-1H matches exact normalized email only. This phase assigned one reserved synthetic email so a later FV can prove exact-match without creating a Customer.

---

## 3. DATA-1H dependency

Implementation: `a80e940` — `feat(data): add deterministic customer identity resolution`

Evidence HEAD: `ca47c9767ae17c78a2cdd5a30a230223219a750d`

v1 rule remains: exact same-organization normalized email (`customer-matcher-v1`).

---

## 4. Preflight dependency

`DATA-1H-FV PREFLIGHT CLOSED WITH EVIDENCE — SYNTHETIC CANONICAL MATCH FIXTURE PREPARATION REQUIRED`

Preflight HEAD: `3264dc977cc771d1924b7ec457cf0cd0166a739f`

That phase correctly refused to invent a Customer or use a non-synthetic QA identity.

---

## 5. Owner authorization

`DATA-1H-FIXTURE-PREP OWNER AUTHORIZATION = PROVEN`

Exact string supplied for this run:

`DATA-1H-FIXTURE-PREP SYNTHETIC CANONICAL CUSTOMER EMAIL ASSIGNMENT = AUTHORIZED`

Scope used: only Customer `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921` in organization `2fc07699-ece5-44b9-bbb3-abbc23e9fffb`, email assignment only.

---

## 6. Repository start state

- worktree: `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1`
- branch: `core/platform-readiness-20260707`
- HEAD: `3264dc977cc771d1924b7ec457cf0cd0166a739f`
- subject: `docs(data): preflight Production customer matching fixture`
- upstream: same SHA
- divergence: `0 0`
- worktree: clean
- `git diff --check`: clean

---

## 7. Production identity

- project: `dmctinrcjvsgmoxwwodw`
- region: `eu-central-1`
- application: `https://www.zyntixai.com`
- QA organization: `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (`ZyntixAI Production QA`, active)

---

## 8. Synthetic Customer provenance

`SYNTHETIC CUSTOMER PROVENANCE = VERIFIED`

Originating phase: B1.5.6-R1-FIXTURE Path A Customer create via Owner UI (`docs/phases/B1.5.6-R1-FIXTURE-controlled-qa-eligibility-preparation.md`).

Identity reconfirmed by DATA-1H-FV-PREFLIGHT and live readback: display name `B1.5.6 Lifecycle QA Customer`, created `2026-07-26` by Owner membership `6d8c8c91-39ff-4f26-86c8-5ec712b8c4f0`.

---

## 9. Target Customer ID

`8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921`

---

## 10. QA organization binding

`organization_id = 2fc07699-ece5-44b9-bbb3-abbc23e9fffb`

---

## 11. Pre-state email

`NULL`

---

## 12. Reserved email

`data-1h-fv-existing-match-8f05d5dd@example.invalid`

---

## 13. Normalization contract

Canonical: `private.normalize_customer_email` / `customers_canonicalize_email` trigger = `nullif(lower(btrim(email)), '')`.

Writer schema also lowercases/trims before persist.

`private.normalize_customer_email('data-1h-fv-existing-match-8f05d5dd@example.invalid')` = same string.

---

## 14. Uniqueness precheck

Same-org reserved-email count before mutation: **0**

---

## 15. Customer count pre-state

- global: 116
- QA org: 6

---

## 16. DATA count pre-state

| Object | Count |
| --- | ---: |
| sessions | 6 |
| sources | 6 |
| mappings | 6 |
| staging rows | 2 |
| import plans | 0 |
| row results | 0 |
| external links | 0 |
| data-intake Storage objects | 5 |

---

## 17. Canonical Customer mutation path

Established product path: `updateCustomerProfileAction` → `updateCustomerProfileMutation` → authenticated `customers` UPDATE of profile columns under RLS.

There is no `update_customer` RPC. Authenticated Owner/Admin may UPDATE `display_name`, `first_name`, `last_name`, `email`, `phone`, `owner_member_id`, `metadata`.

This phase used that same column contract as QA Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9` / membership `6d8c8c91-39ff-4f26-86c8-5ec712b8c4f0` (`owner`/`active`), with JWT claims + `authenticated` role. Not a service-role table shortcut and not a new DATA mutation path.

---

## 18. Actor authorization

Verified live: QA Owner user `928bbcaf-6117-4fef-84a3-d1d8611373e9`, membership `6d8c8c91-39ff-4f26-86c8-5ec712b8c4f0`, role `owner`, status `active`.

Owner/Admin `canEditCustomer` is true for non-archived Customers.

---

## 19. Exact mutation

One profile update. Payload preserved current `display_name`, `first_name`, `last_name`, `phone`, `owner_member_id` and set only:

`email = data-1h-fv-existing-match-8f05d5dd@example.invalid`

Filter: exact ID + QA org + `email IS NULL`.

---

## 20. Mutation accounting

- CUSTOMER UPDATE ATTEMPTS = 1
- CUSTOMER ROWS INTENDED = 1
- CUSTOMER ROWS UPDATED = 1
- CUSTOMERS CREATED = 0
- CUSTOMERS DELETED = 0

---

## 21. Canonical readback

Independent SELECT after mutation:

- id: `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921`
- organization: QA org
- display_name: `B1.5.6 Lifecycle QA Customer`
- email: `data-1h-fv-existing-match-8f05d5dd@example.invalid`
- status: `onboarding`
- owner: null
- archived_at: null
- first/last/phone: null
- metadata hash unchanged (`99914b932bd37a50b983c5e7c90ae93b`)
- created_at / started_at unchanged
- created_by_member_id unchanged

---

## 22. Business field diff

**EMAIL ONLY** (`NULL` → reserved `.invalid` address).

---

## 23. System-maintained field diff

`updated_at`: `2026-07-26 07:45:53.472619+00` → `2026-08-30 15:47:22.105784+00` via `customers_set_updated_at`. Expected.

---

## 24. Normalized email verification

Stored email = `private.normalize_customer_email(email)` = `data-1h-fv-existing-match-8f05d5dd@example.invalid`

DATA-1G staging would persist the same lowercase trimmed value. Matcher input key equals stored key.

---

## 25. Same-org post-match count

`CANONICAL MATCH COUNT = 1`

---

## 26. Exact Customer-ID match

The one row is `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921`.

---

## 27. DATA-1H matcher compatibility

`classifyIdentityResolutions` matches `stagedMatchEmail` to same-org `candidate.email`. One candidate with this email yields `resolution=duplicate`, `target_operation=link`, `target_record_id=8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921`.

Not executed in Production.

---

## 28. DATA-1H migration status

`20260830200000` absent. Latest DATA stamps remain DATA-1G-FV (`20260830113709` / `20260830113944` / `20260830114056`).

`apply_data_intake_matching_mutation` absent.

---

## 29. DATA-session non-effect

sessions = 6 → 6. Delta 0.

---

## 30. Staging non-effect

staging = 2 → 2. Delta 0.

---

## 31. Matching non-execution

Matching RPC absent and not invoked.

---

## 32. Import-system non-effect

plans / row results / links = 0 → 0.

---

## 33. Fixture retention

`FIXTURE RETENTION = INTENTIONAL`

Future DATA-1H-FV may read this Customer. It must not modify it. Do not revert the email.

---

## 34. Future no-match email

`data-1h-fv-no-match-20260830@example.invalid`

Same-org count = **0**. No Customer created.

---

## 35. Audit / activity evidence

Profile update uses the Customer table path; no DATA event was created. `updated_at` is the system audit stamp. Actor was the verified QA Owner.

---

## 36. Customer security non-regression

Local Customer mutation/authorization/tenant tests passed. Permissions were not broadened. Staff/Viewer still cannot use the app mutation path for unauthorized edits. RLS still requires same-org Owner/Admin/Staff for profile UPDATE; this run used Owner.

---

## 37. Unrelated Production non-effects

No Social, BQA, TAX, CAP, CTX, Programs, Enrollments, Tasks, Attention, invitations, memberships, billing, onboarding, or DATA workflow mutation.

---

## 38. Customer count post-state

- global: 116 (delta 0)
- QA: 6 (delta 0)

---

## 39. DATA count post-state

sessions 6, sources 6, mappings 6, staging 2, plans 0, results 0, links 0, Storage 5. All deltas 0.

---

## 40. Targeted DATA tests

`npx vitest run tests/features/data-intake tests/security/data-intake`

**143 / 143 = 100%**

---

## 41. Customer regression tests

Passed: `tests/server/customer-mutations.test.ts`, `tests/security/customer-mutation-security-boundary.test.ts`, `tests/security/customer-read-security-boundary.test.ts`, `tests/security/customer-ui-mutation-boundary.test.ts`, `tests/validation/customer-mutation-schemas.test.ts`.

---

## 42. Typecheck

`npx tsc --noEmit` — PASS

---

## 43. Lint

`npx next lint` — PASS (0 warnings)

---

## 44. Full suite

`npx vitest run`: **3309 passed, 2 failed, 3311 total**

Unchanged from the DATA-1H-FV-PREFLIGHT baseline.

---

## 45. Full-suite percentage

`3309 / 3311 = 99.9396%`

---

## 46. Historical failures

Exactly:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

---

## 47. New regressions

`NEW REGRESSIONS = 0`

---

## 48. DATA-1H-FV readiness

`DATA-1H-FV EXACT-MATCH FIXTURE = READY`

Proposed future rows (not created here):

- A: valid staged email = reserved fixture → exact `duplicate`/`link` to `8f05d5dd-0f6a-4d5d-8d4a-0718cfe15921`
- B: `data-1h-fv-no-match-20260830@example.invalid` → create candidate
- C optional: blocked validation row → matching skipped

`DATA-1H-FV CONTROLLED PRODUCTION CUSTOMER MATCHING = OWNER AUTHORIZATION REQUIRED`

---

## 49. Residual risks

- Matching remains TOCTOU until DATA-1H-FV re-reads this Customer.
- DATA-1H migration is still unapplied; FV must apply it under a separate owner gate.
- The reserved email is intentionally retained. Do not treat it as residue.

---

## 50. Final Git state

Evidence-only commit on `core/platform-readiness-20260707`. Expected after push: divergence `0 0`, clean worktree.

---

## 51. Final verdict

`DATA-1H-FIXTURE-PREP CLOSED WITH EVIDENCE — SYNTHETIC CANONICAL CUSTOMER EXACT-MATCH FIXTURE READY`

`DATA-1H-FV EXACT-MATCH FIXTURE = READY`

`DATA-1H-FV CONTROLLED PRODUCTION CUSTOMER MATCHING = OWNER AUTHORIZATION REQUIRED`
