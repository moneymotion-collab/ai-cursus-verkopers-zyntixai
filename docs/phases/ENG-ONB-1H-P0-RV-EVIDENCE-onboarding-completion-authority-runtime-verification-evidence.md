# ENG-ONB-1H-P0-RV-EVIDENCE - Onboarding Completion Authority Runtime Verification Evidence

## Executive verdict

`PASS - ENG-ONB-1H-P0-RV-EVIDENCE RUNTIME EVIDENCE RECORDED`

The committed artifact
`tests/security/onboarding-completion-authority-live-verification.sql` was
executed against a disposable local PostgreSQL clone carrying all seven
onboarding migrations. It emitted its terminal PASS notice covering **437
single-session checks** and **4 genuine two-session races**, left **zero
residue**, required **no Production credential**, and modified **no committed
migration**.

This document discharges `ENG-ONB-1H-P1-CONTRACT` §10.3 property 6
(documented checkpoint and rollback rules) and property 7 (commit-addressable
evidence artifact), and satisfies the §10.5 PASS rule.

`RV-EVIDENCE CLOSED = YES`

`ENG-ONB-1H-P1-A CLOSURE PREREQUISITE (§10.4) = SATISFIED`

---

## 1. Artifact identity

| Property | Value |
| --- | --- |
| Script path | `tests/security/onboarding-completion-authority-live-verification.sql` |
| Publishing commit | `33fcdf528cd23029de70cbcfcf83aba8bb042c6f` |
| Commit subject | `test(onboarding): add completion authority runtime verification` |
| Git blob | `00025f94f8e42b57285a038b8bbc00ea15ef9509` |
| SHA-256 (raw bytes) | `D966252D79DA2E5F72DD7CB66EEA822C5A9A73D9D3F66B47754FBEB5C9318E98` |
| Size | 155,656 bytes |
| Lines | 3,999 |
| Commit scope | exactly one added path (`A tests/security/...sql`) |

The script was executed from the working tree during
`ENG-ONB-1H-P0-RV-EVIDENCE-FR` and subsequently committed **byte-identically**
under `ENG-ONB-1H-P0-RV-EVIDENCE-PUB`; byte identity between the executed
working-tree file and the committed blob was verified in that phase. The hash
above therefore addresses both the executed content and the committed content.

---

## 2. Required local migration set

The clone must carry all seven onboarding migrations, applied in filename
order:

| # | Migration |
| --- | --- |
| 1 | `20260720140000_add_organization_first_run_onboarding.sql` |
| 2 | `20260904110421_add_operating_model_context_onboarding.sql` |
| 3 | `20260907120240_add_versioned_onboarding_state.sql` |
| 4 | `20260907140829_onboarding_v2_transition_authority.sql` |
| 5 | `20260907230410_create_onboarding_team_invite_intent_authority.sql` |
| 6 | `20260908111356_onboarding_completion_authority.sql` |
| 7 | `20260908131955_reconcile_stale_onboarding_invitation_proof.sql` |

The `dblink` extension must be available in the clone; it is required by
Section 2 to open a second genuine backend session. `dblink` is used **only**
by the verification artifact and is not a dependency of the application or of
any migration.

---

## 3. Exact invocation

The script takes local connection parameters from the operator at run time and
embeds none. The recorded execution used a disposable clone inside the local
Supabase container:

```bash
# 1. Create a disposable clone from the local primary (never the primary itself)
docker exec -i supabase_db_<project> psql -U postgres -d postgres \
  -c 'create database rv_clone_<suffix> template postgres'

# 2. Enable the concurrency prerequisite in the clone only
docker exec -i supabase_db_<project> psql -U postgres -d rv_clone_<suffix> \
  -c 'create extension if not exists dblink'

# 3. Execute the artifact against the clone
docker exec -i supabase_db_<project> psql -U postgres -d rv_clone_<suffix> \
  -v ON_ERROR_STOP=1 \
  -f /path/to/tests/security/onboarding-completion-authority-live-verification.sql

# 4. Drop the clone
docker exec -i supabase_db_<project> psql -U postgres -d postgres \
  -c 'drop database rv_clone_<suffix>'
```

Guard 1 in the artifact refuses to run unless the target database name matches
the disposable clone prefix, so step 3 cannot be pointed at the primary
database even by mistake.

---

## 4. Expected PASS notice

The artifact's terminal `raise notice` is assembled from the pinned
`rv_evidence` contract, so the counts in the emitted text are the counts the
run actually satisfied rather than a hard-coded string:

```
PASS - ENG-ONB-1H-P0-RV-EVIDENCE onboarding completion authority runtime
verification: 437 single-session checks and 4 genuine two-session races passed
against clone "rv_clone_<suffix>"; ENG-ONB-1H-P0-A and ENG-ONB-1H-P0-B4
runtime behavior confirmed; zero residue.
```

`OBSERVED PASS NOTICE = EXPECTED PASS NOTICE`

---

## 5. Pinned check-count contract

The artifact pins its own expected counts in the session-local `rv_evidence`
table and raises an exception if any live counter diverges, so the PASS notice
cannot be emitted by a run that executed fewer checks than contracted.

| Metric | Pinned value |
| --- | --- |
| `expected_catalog` | 164 |
| `expected_constraint` | 27 |
| `expected_authz` | 57 |
| `expected_p0a` | 52 |
| `expected_p0b4` | 61 |
| `expected_stamp` | 47 |
| `expected_side` | 21 |
| `expected_atomic` | 8 |
| `expected_concurrency_scenarios` | 4 |
| **`expected_total`** | **437** |

164 + 27 + 57 + 52 + 61 + 47 + 21 + 8 = 437.

`SINGLE-SESSION CHECKS = 437`

`CONCURRENCY SCENARIOS = 4`

---

## 6. Concurrency observation

§10.3 property 3 requires at least two genuinely concurrent sessions
contending on the same `organization_id`. A single-session simulation does not
satisfy the requirement.

Section 2 of the artifact opens a **second real backend session** through
`dblink` and drives four data-bearing races against the production advisory
lock namespace `pg_advisory_xact_lock(872004, hashtext(organization_id::text))`
— the same namespace used by all five completion RPCs
(`20260908111356` L1125, L1207, L1277, L1363, L1579) and by reconcile
(`20260908131955` L357).

Observed in every race:

- both sessions were confirmed distinct backends with distinct PIDs before the
  race was scored, so serialization could not be an artifact of one session;
- the advisory lock serialized the two sessions on the same `organization_id`;
- exactly **one** `attempt_count` increment was recorded;
- **no** duplicate `organization_onboarding_invitation_results` row was
  created, with the `(organization_id, intent_id)` composite unique holding;
- `started_at` was preserved across the concurrent `ensure` pair;
- the losing session observed the winner's committed state rather than a
  partial one.

`GENUINE TWO-SESSION CONCURRENCY = PROVEN`

`SIMULATED CONCURRENCY = NOT USED`

---

## 7. Post-run zero-residue assertion

Section 1 runs inside a single `begin; … rollback;` transaction. Section 2
must commit in order to be observable across two sessions, so it explicitly
cleans up its committed fixtures in the `conc_cleanup` block and then asserts
the zero-residue condition rather than assuming it.

The artifact fingerprints every relevant table into the `rv_side_effects` view
and captures a pre-run `rv_baseline`. After execution it re-reads the same
fingerprint and raises an exception on any difference. Tables covered include
organizations, organization members, onboarding team invite intents,
completion runs, invitation results, organization invitations, invitation
delivery attempts, and invitation events.

Observed after the run:

- every table count equalled its pre-run baseline;
- zero rows added to `organization_invitations` by any reconcile path;
- zero invitation delivery attempts and zero invitation events created;
- zero membership rows created or altered;
- the session-local ledger tables (`rv_conc`, `rv_baseline`,
  `rv_side_effects`, `rv_evidence`) were explicitly dropped at the end of the
  script rather than left to session teardown.

The clone was dropped after execution, so no residue can persist even in
principle.

`POST-RUN RESIDUE = ZERO`

---

## 8. Failure semantics of `ON_ERROR_STOP`

The artifact sets `\set ON_ERROR_STOP on` at line 188, before any assertion.

Consequences, which are the reason a PASS notice cannot be forged by a partial
run:

1. every assertion raises a deterministic `raise exception` on violation;
2. the first error aborts `psql` immediately with a non-zero exit status;
3. because the terminal PASS notice is the **last** statement in the script,
   any earlier failure makes it unreachable — a PASS notice therefore
   certifies that every preceding assertion passed;
4. Section 1's transaction is abandoned by the abort, so a failed run still
   leaves no Section 1 residue;
5. Guard 1 fails closed: a missing prerequisite, a wrong database name, or a
   missing `dblink` extension stops the run before any fixture is created.

`FAIL-CLOSED = YES`

`PARTIAL-RUN PASS NOTICE = IMPOSSIBLE`

---

## 9. Safety guarantees

| Guarantee | Status |
| --- | --- |
| No committed migration modified | **YES** - `supabase/**` untouched by this phase and by the publishing commit |
| No `supabase db reset` performed | **YES** |
| No `supabase db push` performed | **YES** |
| No `supabase migration repair` performed | **YES** |
| No Production access | **YES** - execution was confined to a local disposable clone |
| No connection string, key, token, password or project reference committed | **YES** - operator supplies connection parameters at run time |
| No real email address | **YES** - synthetic `@example.test` identities only |
| Primary database not mutated | **YES** - Guard 1 refuses to run outside the clone-name prefix; primary fingerprint unchanged before and after |
| Clone removed after execution | **YES** |

---

## 10. Coverage against §10.3 property 2

The recorded run covers the required P0-A and P0-B4 runtime matrix:

- actor gate returning `'NOT_AUTHENTICATED'`, `'NOT_AUTHORIZED'`,
  `'INVALID_LIFECYCLE'` and `'OK'`;
- `ensure` idempotency including `started_at` preservation and per-intent
  result seeding;
- every reachable `result_code` / `evidence_kind` pair permitted by the proof
  check constraint;
- the `'invitation_proof_lost'` / `'historical_invitation'` forward transition
  with `attempt_count` and `last_attempt_at` preserved;
- run status transitions across `'setup_ready'`, `'inviting'`,
  `'invite_partial'` and `'ready_for_cutover'`;
- the zero-intent direct-to-`'ready_for_cutover'` path;
- V2-before-Setup-Ready denials on `create_organization_invitation`,
  `resend_organization_invitation` and `accept_organization_invitation`;
- rejection of direct table access under `authenticated`;
- cross-tenant rejection;
- zero invitation, delivery or membership side effects from every reconcile
  path.

---

## 11. Independent review record

The artifact was reviewed under `ENG-ONB-1H-P0-RV-EVIDENCE-FR` before
publication against the following conditions, all of which passed: no
false-positive assertions; no hidden external harness dependency; no unsafe
cleanup; no primary-database mutation; no simulated concurrency. Publication
under `ENG-ONB-1H-P0-RV-EVIDENCE-PUB` committed the reviewed bytes without
modification.

---

## 12. Gate mapping

| Gate | Disposition |
| --- | --- |
| 1 - Baseline and ownership | **MANDATORY - PASS** |
| 2 - Scope contract | **MANDATORY - PASS** - scope frozen by §10.5 |
| 3 - Implementation completeness | **MANDATORY - PASS** - the artifact is the deliverable |
| 4 - Automated tests | **MANDATORY - PASS** - the artifact is itself the runtime test; static security tests unchanged |
| 5 - Code quality | **MANDATORY - PASS** - `git diff --check` clean; no secret; no temp file |
| 6 - Security and tenant isolation | **MANDATORY - PASS** - cross-tenant rejection and direct-table-access rejection asserted at runtime |
| 7 - Browser verification | `NOT_REQUIRED_WITH_JUSTIFICATION` - no user-visible change; no route, component, style or copy added or altered |
| 8 - Production verification | `NOT_REQUIRED_WITH_JUSTIFICATION` - nothing deployed; Production acceptance contracted forward to `ENG-ONB-1H-PROD` |
| 9 - Documentation and evidence | **MANDATORY - PASS** - this document |
| 10 - Publication | **MANDATORY - PASS** - artifact published at `33fcdf5`; this evidence document is published as a separate owner-approved act |

---

## 13. Verdict

`PASS - ENG-ONB-1H-P0-RV-EVIDENCE RUNTIME EVIDENCE RECORDED`

The §10.5 PASS rule is satisfied: the committed script executed against a local
PostgreSQL instance carrying all seven onboarding migrations, emitted its PASS
notice, left zero residue, demonstrated real two-session concurrency, contains
no secret, and its result is recorded here. `git diff --check` is clean.

No §10.5 BLOCKED condition applies: the script requires no Production
credential; no fixture survived; concurrency was real rather than simulated;
no migration was modified; no assertion was weakened to force a pass; and the
PASS notice is recorded against a corresponding execution.

**Successor.** `ENG-ONB-1H-P1-A` closure.

## End of ENG-ONB-1H-P0-RV-EVIDENCE
