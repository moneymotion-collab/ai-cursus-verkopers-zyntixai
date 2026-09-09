-- ENG-ONB-1H-P0-RV-EVIDENCE
-- Repository-native local PostgreSQL runtime verification for the committed
-- V2 onboarding completion authority.
--
-- Covered phase IDs
--   ENG-ONB-1H-P0-A  supabase/migrations/20260908111356_onboarding_completion_authority.sql
--   ENG-ONB-1H-P0-B4 supabase/migrations/20260908131955_reconcile_stale_onboarding_invitation_proof.sql
--
-- This artifact verifies behavior only. It creates no persistent schema object,
-- alters no migration, weakens no constraint, and disables no trigger or RLS
-- policy. Every governed CHECK, ACL, RLS and Owner boundary stays in force for
-- every assertion below.
--
-- ---------------------------------------------------------------------------
-- LOCAL ONLY - NO PRODUCTION AUTHORIZATION
-- ---------------------------------------------------------------------------
-- Authorized for a local, disposable PostgreSQL database only. Never
-- authorized against Production, a remote or linked Supabase project, or the
-- primary local `postgres` database. Section 2 must commit synthetic fixtures
-- in order to obtain two genuinely concurrent backend sessions, so the whole
-- artifact is fail-closed to a database carrying the reserved prefix:
--
--   zyntixai_onb_completion_rv_
--
-- Guard 1 aborts before any fixture exists if that is not satisfied.
--
-- No connection string, host, port, password, token, service-role key, project
-- reference, or real email address appears anywhere in this file. Connection
-- parameters are supplied by the operator at run time. The two concurrent
-- sessions are opened by `dblink` from `pg_catalog.current_database()` and
-- `current_user` only - never from a literal credential.
--
-- ---------------------------------------------------------------------------
-- REQUIRED POSTGRESQL / SUPABASE STATE
-- ---------------------------------------------------------------------------
--   * PostgreSQL 17.x local Supabase stack.
--   * The full committed migration ledger applied, and specifically both
--     governed P0 migrations recorded in
--     `supabase_migrations.schema_migrations`:
--       20260908111356  ENG-ONB-1H-P0-A
--       20260908131955  ENG-ONB-1H-P0-B4
--   * The committed taxonomy and Context-pack seed registry present, because
--     `public.mark_organization_onboarding_setup_ready` requires a configured
--     active primary Activity bound to a published, readiness-accepted pack.
--   * `dblink` installed IN THE DISPOSABLE CLONE ONLY. It must not be
--     installed in the primary local `postgres` database.
--   * Execution identity: a local superuser. The Supabase local stack provides
--     `supabase_admin` over the Unix socket. Superuser is required to seed
--     synthetic `auth.users` rows, to read the `private` schema, and to let
--     `dblink` open a password-free local session under the stack's own `trust`
--     pg_hba rule for local/loopback connections.
--
-- ---------------------------------------------------------------------------
-- EXACT EXECUTION COMMAND
-- ---------------------------------------------------------------------------
-- Create the disposable clone, run this artifact, then destroy the clone. The
-- clone is populated from the local primary by a read-only schema dump plus the
-- committed seed registry only: no tenant rows are copied, and
-- `pg_restore --create` is not used.
--
--   RV_DB=zyntixai_onb_completion_rv_$(date -u +%Y%m%dt%H%M)
--
--   pg_dump -U supabase_admin -d postgres --schema-only --no-subscriptions \
--     > /tmp/rv_schema.sql
--   pg_dump -U supabase_admin -d postgres --data-only \
--     --table=public.taxonomy_releases --table=public.taxonomy_foundations \
--     --table=public.taxonomy_industries --table=public.taxonomy_niches \
--     --table=public.taxonomy_specializations \
--     --table=public.taxonomy_deep_specializations \
--     --table=public.taxonomy_aliases --table=public.context_packs \
--     --table=public.context_pack_versions \
--     --table=public.context_pack_readiness \
--     --table=public.context_capability_mappings \
--     --table=public.context_terminology \
--     --table=supabase_migrations.schema_migrations > /tmp/rv_seed.sql
--
--   psql -U supabase_admin -d postgres -c "create database $RV_DB"
--   psql -U supabase_admin -d "$RV_DB" -f /tmp/rv_schema.sql
--   psql -U supabase_admin -d "$RV_DB" -f /tmp/rv_seed.sql
--   psql -U supabase_admin -d "$RV_DB" -c "create extension if not exists dblink"
--
--   psql -U supabase_admin -d "$RV_DB" \
--     -f tests/security/onboarding-completion-authority-live-verification.sql
--
--   psql -U supabase_admin -d postgres -c "drop database $RV_DB"
--
-- The drop names the exact resolved database. No wildcard and no unresolved
-- database name is ever used in cleanup.
--
-- ---------------------------------------------------------------------------
-- SYNTHETIC FIXTURE POLICY
-- ---------------------------------------------------------------------------
-- Every identity is synthetic and local. All fixture addresses use the
-- reserved `@example.test` domain (RFC 6761). Every fixture organization slug
-- carries the `zyntixai-rv-` marker and every fixture name carries
-- `ZyntixAI RV`, so residue is detectable by a single predicate. Fixture actor
-- context is injected only through `pg_catalog.set_config` on
-- `request.jwt.claims` / `request.jwt.claim.sub`, which is exactly how the
-- committed `auth.uid()` resolves an actor locally. No real person, tenant,
-- invitation token, or credential is used anywhere.
--
-- ---------------------------------------------------------------------------
-- TRANSACTION, ROLLBACK, AND DISPOSABLE-CLONE BEHAVIOR
-- ---------------------------------------------------------------------------
-- Section 1 (Phases 2-8) follows the repository precedent established by
-- `tests/security/onboarding-team-invite-intent-live-verification.sql`: one
-- `begin; ... rollback;` transaction whose every assertion is discarded, so it
-- leaves zero residue by construction.
--
-- Section 2 (Phase 9) cannot use that form, for a reason that is a property of
-- PostgreSQL and not a relaxation of the contract. The published contract
-- requires "at least two genuinely concurrent sessions contending on the same
-- organization_id" and records that "a single-session simulation does not
-- satisfy this requirement". No backend session can observe another session's
-- uncommitted rows at any isolation level, so data-bearing contention requires
-- committed fixtures. Section 2 therefore runs in autocommit, and the two
-- requirements are reconciled exactly as the governing instruction directs:
-- committed concurrency fixtures exist only inside a uniquely named disposable
-- clone, are deleted explicitly, and the resulting zero-residue state is
-- asserted count by count before the operator drops the clone.
--
-- `\set ON_ERROR_STOP on` fixes the failure semantics. The first violated
-- assertion raises, psql stops immediately with a non-zero exit status, the
-- open Section 1 transaction is discarded, and the terminal PASS notice is not
-- emitted. A partially completed Section 2 leaves its fixtures confined to the
-- clone, which the operator then drops.
--
-- ---------------------------------------------------------------------------
-- CLEANUP PROCEDURE
-- ---------------------------------------------------------------------------
--   1. Section 1 ends in `rollback`; nothing it creates is ever committed.
--   2. Section 2 disconnects every `dblink` session it opened, including on the
--      failure path, and asserts that no advisory lock remains on namespace
--      872004 and no `idle in transaction` backend remains in this database.
--   3. Section 2 deletes its committed fixtures in dependency order and then
--      asserts that organizations, members, auth users, intents, runs, results,
--      invitations, invitation events, delivery attempts and rate-limit rows
--      have all returned to the baseline captured before the fixtures existed.
--   4. The operator drops the exact disposable database by name.
--
-- ---------------------------------------------------------------------------
-- PASS / BLOCKED SEMANTICS
-- ---------------------------------------------------------------------------
-- PASS    - the script runs to completion and emits the terminal notice below
--           as its last output. Every assertion passed and residue is zero.
-- BLOCKED - any raised exception. `ON_ERROR_STOP` aborts psql with a non-zero
--           exit status, the terminal PASS notice is absent, and the raised
--           message names the exact failing check. A failure is never repaired
--           by editing product SQL.
--
-- Expected notice sequence. The per-phase counts are pinned in `rv_evidence`
-- and asserted, not merely printed, so a silent loss of coverage fails the run
-- instead of reporting a smaller number:
--
--   GUARD 1 PASS: disposable clone "..."
--   PHASE 2A complete: 164 catalog/ACL checks
--   PHASE 3-4 complete: 57 authorization checks, 52 P0-A runtime checks
--   PHASE 2B complete: 27 constraint checks (11 valid pairings,
--     16 proven rejections)
--   PHASE 5-7 complete: 61 P0-B4 checks, 47 timestamp/idempotency checks,
--     21 side-effect boundaries
--   PHASE 8 complete: 8 failure-atomicity checks
--   SECTION 1 PASS: 437 checks (...)
--   PHASE 9 fixtures committed: 4 disposable-clone organizations
--   PHASE 9 scenario race-stale PASS: sessions .../... contended on
--     872004/..., B waited ..., resumed ... after A commit, one effective
--     transition to invitation_proof_lost / historical_invitation
--   PHASE 9 scenario race-reentry PASS: ... invite_already_pending /
--     pending_invitation
--   PHASE 9 scenario race-conflict PASS: ... already_member /
--     active_membership
--   PHASE 9 scenario race-wait PASS: ... after A rollback ...
--     invitation_proof_lost / historical_invitation
--   PHASE 9 complete: 4 genuine two-session races
--   CLEANUP PASS: committed estate deleted; every count and fingerprint
--     restored to the pre-test baseline; no advisory lock, backend or dblink
--     session remains
--
-- Expected terminal PASS notice, which is the last line of a passing run:
--
--   PASS - ENG-ONB-1H-P0-RV-EVIDENCE onboarding completion authority runtime
--   verification: 437 single-session checks and 4 genuine two-session races
--   passed against clone "<resolved clone name>"; ENG-ONB-1H-P0-A and
--   ENG-ONB-1H-P0-B4 runtime behavior confirmed; zero residue.
--
-- ===========================================================================

\set ON_ERROR_STOP on

-- Session-local evidence ledger and pinned check-count contract. Temporary, so
-- it cannot survive the session and can never become residue. Created before
-- the Section 1 transaction so its rows remain readable inside that
-- transaction and survive the closing rollback.
create temporary table rv_evidence (
  metric text primary key,
  value bigint not null
);

insert into rv_evidence (metric, value) values
  ('expected_catalog', 164),
  ('expected_constraint', 27),
  ('expected_authz', 57),
  ('expected_p0a', 52),
  ('expected_p0b4', 61),
  ('expected_stamp', 47),
  ('expected_side', 21),
  ('expected_atomic', 8),
  ('expected_concurrency_scenarios', 4),
  ('expected_total', 437);

-- ===========================================================================
-- GUARD 1 - fail-closed environment validation
-- ===========================================================================
-- Refuses Production, an unidentified database, the primary local `postgres`
-- database, a standby, a database missing either governed migration or any
-- governed object, an incompatible pre-P0-B4 schema, and a database that
-- already holds this artifact's fixture markers.

do $guard$
declare
  v_db text := pg_catalog.current_database();
  v_prefix text := 'zyntixai_onb_completion_rv_';
  v_item text;
  v_n integer;
begin
  if v_db !~ ('^' || v_prefix || '[a-z0-9_]{1,40}$') then
    raise exception
      'BLOCKED - ENG-ONB-1H-P0-RV-EVIDENCE refuses database "%". This artifact '
      'commits two-session concurrency fixtures, so it runs only in a uniquely '
      'named disposable local clone matching ^%[a-z0-9_]{1,40}$. The primary '
      'local postgres database and Production are never authorized.',
      v_db, v_prefix;
  end if;

  if v_db = 'postgres' then
    raise exception 'BLOCKED - the primary local database is never authorized';
  end if;

  if pg_catalog.pg_is_in_recovery() then
    raise exception 'BLOCKED - database is in recovery; refusing to write';
  end if;

  if pg_catalog.inet_server_addr() is not null
    and pg_catalog.inet_server_addr() not in ('127.0.0.1'::inet, '::1'::inet)
  then
    raise exception
      'BLOCKED - non-local server address %; this artifact is local-only',
      pg_catalog.inet_server_addr();
  end if;

  if pg_catalog.current_setting('is_superuser') <> 'on' then
    raise exception
      'BLOCKED - execution identity "%" is not a local superuser; seeding '
      'synthetic auth.users fixtures and opening credential-free dblink '
      'sessions both require it', current_user;
  end if;

  foreach v_item in array array['20260908111356', '20260908131955'] loop
    if not exists (
      select 1
      from supabase_migrations.schema_migrations as m
      where m.version = v_item
    ) then
      raise exception
        'BLOCKED - governed onboarding migration % is not applied', v_item;
    end if;
  end loop;

  foreach v_item in array array[
    'public.organization_onboarding_completion_runs',
    'public.organization_onboarding_invitation_results',
    'public.organization_onboarding_team_invite_intents',
    'public.organization_invitations',
    'public.organization_invitation_events',
    'public.organization_members',
    'public.organizations',
    'private.organization_invitation_delivery_attempts',
    'private.organization_invitation_mutation_rate_limits'
  ] loop
    if pg_catalog.to_regclass(v_item) is null then
      raise exception 'BLOCKED - required table % is absent', v_item;
    end if;
  end loop;

  foreach v_item in array array[
    'public.ensure_organization_onboarding_completion_run(uuid)',
    'public.list_organization_onboarding_frozen_team_invite_intents(uuid)',
    'public.list_organization_onboarding_invitation_results(uuid)',
    'public.execute_organization_onboarding_invite_intent(uuid,uuid)',
    'public.reconcile_organization_onboarding_invite_intent(uuid,uuid)',
    'public.mark_organization_onboarding_setup_ready(uuid)',
    'public.create_organization_invitation(uuid,text,text)',
    'public.resend_organization_invitation(uuid,uuid)',
    'public.accept_organization_invitation(text)',
    'private.resolve_organization_onboarding_completion_actor(uuid)',
    'private.resolve_organization_onboarding_invite_intent_evidence(uuid,uuid)',
    'private.persist_organization_onboarding_invite_intent_result(uuid,uuid,text,text,uuid,boolean)',
    'private.advance_organization_onboarding_completion_run(uuid)'
  ] loop
    begin
      perform v_item::regprocedure;
    exception
      when undefined_function or invalid_text_representation
        or undefined_object then
        raise exception
          'BLOCKED - required governed function % is absent', v_item;
    end;
  end loop;

  -- Incompatible-schema guard: without the P0-B4 forward allowlists in force,
  -- this artifact would be asserting against pre-B4 SQL.
  if not exists (
    select 1
    from pg_catalog.pg_constraint as c
    where c.conname
      = 'organization_onboarding_invitation_results_result_code_check'
      and pg_catalog.pg_get_constraintdef(c.oid) like '%invitation_proof_lost%'
  ) then
    raise exception
      'BLOCKED - incompatible schema: result_code allowlist lacks '
      'invitation_proof_lost, so ENG-ONB-1H-P0-B4 is not in force';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_constraint as c
    where c.conname
      = 'organization_onboarding_invitation_results_evidence_kind_check'
      and pg_catalog.pg_get_constraintdef(c.oid) like '%historical_invitation%'
  ) then
    raise exception
      'BLOCKED - incompatible schema: evidence_kind allowlist lacks '
      'historical_invitation, so ENG-ONB-1H-P0-B4 is not in force';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_extension as e where e.extname = 'dblink'
  ) then
    raise exception
      'BLOCKED - dblink is not installed in this disposable clone. Genuine '
      'two-session concurrency cannot be proven and simulation is prohibited.';
  end if;

  select pg_catalog.count(*)::integer
  into v_n
  from public.organizations as o
  where o.slug like 'zyntixai-rv-%';

  if v_n <> 0 then
    raise exception
      'BLOCKED - % pre-existing zyntixai-rv fixture organizations present; '
      'refusing to run against prior fixture residue', v_n;
  end if;

  raise notice
    'GUARD 1 PASS: disposable clone "%"; local; superuser identity; both P0 '
    'migrations applied; governed objects present; P0-B4 allowlists in force; '
    'dblink available; zero prior fixture residue', v_db;
end;
$guard$;

-- ===========================================================================
-- SECTION 1 - transactional verification (Phases 2 through 8)
-- ===========================================================================

-- Single side-effect surface for the Phase 7 and Phase 9 boundaries. A
-- temporary view, so it lives only in this session's temporary schema and can
-- never become residue. One fingerprint covers invitation creation, resend,
-- status mutation, token-hash creation or reconstruction, plaintext-token
-- persistence, delivery attempts, invitation events, rate-limit consumption
-- and membership mutation.
create temporary view rv_side_effects as
select
  (select pg_catalog.count(*) from public.organization_invitations)
    as n_invitations,
  (select pg_catalog.count(*) from public.organization_invitation_events)
    as n_events,
  (
    select pg_catalog.count(*)
    from private.organization_invitation_delivery_attempts
  ) as n_deliveries,
  (
    select pg_catalog.count(*)
    from private.organization_invitation_mutation_rate_limits
  ) as n_rate_rows,
  (
    select coalesce(pg_catalog.sum(rl.attempt_count), 0)
    from private.organization_invitation_mutation_rate_limits as rl
  ) as n_rate_attempts,
  (select pg_catalog.count(*) from public.organization_members) as n_members,
  (select pg_catalog.count(*) from public.organizations) as n_orgs,
  (select pg_catalog.count(*) from auth.users) as n_users,
  (select pg_catalog.count(*) from public.profiles) as n_profiles,
  (
    select pg_catalog.count(*)
    from public.organization_onboarding_team_invite_intents
  ) as n_intents,
  (
    select pg_catalog.count(*)
    from public.organization_business_activities
  ) as n_activities,
  (
    select pg_catalog.count(*)
    from public.organization_context_assignments
  ) as n_assignments,
  (
    select pg_catalog.count(*)
    from public.organization_onboarding_invitation_results
  ) as n_results,
  (
    select pg_catalog.count(*)
    from public.organization_onboarding_completion_runs
  ) as n_runs,
  (
    select pg_catalog.md5(coalesce(pg_catalog.string_agg(f.line, '|'), ''))
    from (
      select 'INV:' || i.id::text || ':' || i.status || ':'
             || coalesce(i.token_hash, '~') || ':'
             || coalesce(i.expires_at::text, '~') || ':'
             || coalesce(i.accepted_at::text, '~') || ':'
             || coalesce(i.revoked_at::text, '~') || ':'
             || i.email_normalized || ':' || i.role || ':'
             || i.updated_at::text as line
      from public.organization_invitations as i
      union all
      select 'EVT:' || e.id::text || ':' || e.event_type || ':'
             || e.invitation_id::text
      from public.organization_invitation_events as e
      union all
      select 'DEL:' || d.id::text || ':' || d.operation || ':' || d.status
      from private.organization_invitation_delivery_attempts as d
      union all
      select 'RL:' || rl.organization_id::text || ':'
             || rl.actor_user_id::text || ':' || rl.action || ':'
             || rl.scope_key || ':' || rl.attempt_count::text
      from private.organization_invitation_mutation_rate_limits as rl
      union all
      select 'MEM:' || m.id::text || ':' || m.status || ':' || m.role
      from public.organization_members as m
      order by line
    ) as f
  ) as fingerprint;

-- Pre-test estate snapshot. Every count and fingerprint here must be restored
-- exactly before the terminal verdict is allowed, which is what makes the
-- zero-residue claim a measurement rather than an assertion.
create temporary table rv_baseline as select * from rv_side_effects;

begin;

do $section1$
declare
  -- ---- pinned check-count contract ------------------------------------
  c_catalog bigint;
  c_constraint bigint;
  c_authz bigint;
  c_p0a bigint;
  c_p0b4 bigint;
  c_stamp bigint;
  c_side bigint;
  c_atomic bigint;

  -- ---- live counters ---------------------------------------------------
  n_catalog integer := 0;
  n_constraint integer := 0;
  n_authz integer := 0;
  n_p0a integer := 0;
  n_p0b4 integer := 0;
  n_stamp integer := 0;
  n_side integer := 0;
  n_atomic integer := 0;

  -- ---- shared reference data ------------------------------------------
  v_foundation uuid;
  v_version uuid;

  -- ---- primary fixture organization -----------------------------------
  v_org uuid := pg_catalog.gen_random_uuid();
  v_owner uuid := pg_catalog.gen_random_uuid();
  v_owner_member uuid;
  v_staff uuid := pg_catalog.gen_random_uuid();
  v_outsider uuid := pg_catalog.gen_random_uuid();
  v_activity uuid;

  v_intent_success uuid;
  v_intent_member uuid;
  v_intent_collision uuid;
  v_intent_rate uuid;
  v_member_user uuid := pg_catalog.gen_random_uuid();
  v_collision_user uuid := pg_catalog.gen_random_uuid();

  -- ---- foreign organization -------------------------------------------
  v_org_b uuid := pg_catalog.gen_random_uuid();
  v_owner_b uuid := pg_catalog.gen_random_uuid();
  v_intent_b uuid;

  -- ---- zero-intent, V1 and NULL-version organizations -----------------
  v_org_zero uuid := pg_catalog.gen_random_uuid();
  v_org_v1 uuid := pg_catalog.gen_random_uuid();
  v_org_null uuid := pg_catalog.gen_random_uuid();
  v_v1_member uuid;
  v_v1_invitation uuid;
  v_v1_raw text;
  v_v2_invitation uuid;
  v_v2_raw text;

  -- ---- constraint laboratory ------------------------------------------
  v_lab uuid := pg_catalog.gen_random_uuid();
  v_lab_owner uuid := pg_catalog.gen_random_uuid();
  v_lab_member uuid;
  v_lab_invitation uuid := pg_catalog.gen_random_uuid();
  v_lab_intent uuid;
  v_lab_spare uuid;

  -- ---- scratch ---------------------------------------------------------
  v_res jsonb;
  v_row public.organization_onboarding_invitation_results%rowtype;
  v_run public.organization_onboarding_completion_runs%rowtype;
  v_case jsonb;
  v_cases jsonb;
  v_txt text;
  v_txt2 text;
  v_item text;
  v_priv text;
  v_conname text;
  v_sql text;
  v_n integer;
  v_i integer;
  v_uuid uuid;
  v_ts timestamptz;
  v_ts2 timestamptz;
  v_ready_at timestamptz;
  v_started_at timestamptz;
  v_bool boolean;
  v_oid oid;
  v_before rv_side_effects%rowtype;
  v_after rv_side_effects%rowtype;
  v_lock_key bigint;

  -- ---- P0-B4 scenario estate -------------------------------------------
  v_fx jsonb := '{}'::jsonb;
  v_labels text[];
  v_org_x uuid;
  v_owner_x uuid;
  v_member_x uuid;
  v_intent_x uuid;
  v_inv_x uuid;
  v_inv_y uuid;
  v_target text;
  v_pre public.organization_onboarding_invitation_results%rowtype;
  v_pre_run public.organization_onboarding_completion_runs%rowtype;
begin
  select value into c_catalog from rv_evidence where metric = 'expected_catalog';
  select value into c_constraint from rv_evidence
    where metric = 'expected_constraint';
  select value into c_authz from rv_evidence where metric = 'expected_authz';
  select value into c_p0a from rv_evidence where metric = 'expected_p0a';
  select value into c_p0b4 from rv_evidence where metric = 'expected_p0b4';
  select value into c_stamp from rv_evidence where metric = 'expected_stamp';
  select value into c_side from rv_evidence where metric = 'expected_side';
  select value into c_atomic from rv_evidence where metric = 'expected_atomic';

  -- =====================================================================
  -- PHASE 2A - live catalog verification
  -- =====================================================================

  foreach v_item in array array[
    'organization_onboarding_completion_runs',
    'organization_onboarding_invitation_results'
  ] loop
    if not exists (
      select 1
      from pg_catalog.pg_class as c
      inner join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_item
        and c.relkind = 'r'
        and c.relrowsecurity
    ) then
      raise exception
        'RV-CAT: public.% is absent or has row level security disabled', v_item;
    end if;
    n_catalog := n_catalog + 1;

    select pg_catalog.count(*)::integer
    into v_n
    from pg_catalog.pg_policy as p
    where p.polrelid = ('public.' || v_item)::regclass;

    if v_n <> 0 then
      raise exception
        'RV-CAT: public.% carries % RLS policies; a zero-policy deny-all is '
        'the governed contract', v_item, v_n;
    end if;
    n_catalog := n_catalog + 1;

    select pg_catalog.pg_get_userbyid(c.relowner)
    into v_txt
    from pg_catalog.pg_class as c
    where c.oid = ('public.' || v_item)::regclass;

    if v_txt <> 'postgres' then
      raise exception
        'RV-CAT: public.% is owned by % rather than postgres', v_item, v_txt;
    end if;
    n_catalog := n_catalog + 1;

    foreach v_txt2 in array array['anon', 'authenticated', 'service_role'] loop
      foreach v_priv in array array['SELECT', 'INSERT', 'UPDATE', 'DELETE']
      loop
        if pg_catalog.has_table_privilege(
          v_txt2, 'public.' || v_item, v_priv
        ) then
          raise exception
            'RV-ACL: role % unexpectedly holds % on public.%',
            v_txt2, v_priv, v_item;
        end if;
        n_catalog := n_catalog + 1;
      end loop;
    end loop;

    -- No grant to PUBLIC either.
    select c.relacl::text
    into v_txt
    from pg_catalog.pg_class as c
    where c.oid = ('public.' || v_item)::regclass;

    if coalesce(v_txt, '') ~ '(^|,|\{)=[a-zA-Z]*/' then
      raise exception
        'RV-ACL: public.% grants privileges to PUBLIC (%)', v_item, v_txt;
    end if;
    n_catalog := n_catalog + 1;
  end loop;

  -- Exact constraints present and validated. Two governed names exceed the
  -- 63-byte identifier limit, so PostgreSQL stores them truncated; the live
  -- catalog form is the authoritative one and is what is asserted here.
  v_cases := pg_catalog.jsonb_build_object(
    'organization_onboarding_completion_runs',
      pg_catalog.jsonb_build_array(
        'organization_onboarding_completion_runs_status_check',
        'organization_onboarding_completion_runs_ready_timestamp_check',
        'organization_onboarding_completion_runs_completed_timestamp_che',
        'organization_onboarding_completion_runs_timestamp_order_check',
        'organization_onboarding_completion_runs_completed_order_check'
      ),
    'organization_onboarding_invitation_results',
      pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_org_id_unique',
        'organization_onboarding_invitation_results_org_intent_unique',
        'organization_onboarding_invitation_results_idempotency_unique',
        'organization_onboarding_invitation_results_organization_fk',
        'organization_onboarding_invitation_results_intent_fk',
        'organization_onboarding_invitation_results_invitation_fk',
        'organization_onboarding_invitation_results_attempt_count_check',
        'organization_onboarding_invitation_results_attempt_timestamp_ch',
        'organization_onboarding_invitation_results_target_role_check',
        'organization_onboarding_invitation_results_email_check',
        'organization_onboarding_invitation_results_idempotency_check',
        'organization_onboarding_invitation_results_result_code_check',
        'organization_onboarding_invitation_results_evidence_kind_check',
        'organization_onboarding_invitation_results_proof_check'
      )
  );

  for v_item in select pg_catalog.jsonb_object_keys(v_cases) loop
    for v_conname in
      select pg_catalog.jsonb_array_elements_text(v_cases -> v_item)
    loop
      if not exists (
        select 1
        from pg_catalog.pg_constraint as c
        where c.conrelid = ('public.' || v_item)::regclass
          and c.conname = v_conname
          and c.convalidated
      ) then
        raise exception
          'RV-CAT: constraint % on public.% is absent or NOT VALID',
          v_conname, v_item;
      end if;
      n_catalog := n_catalog + 1;
    end loop;
  end loop;

  -- result_code allowlist: the exact 11 governed values, and only those.
  select pg_catalog.pg_get_constraintdef(c.oid)
  into v_txt
  from pg_catalog.pg_constraint as c
  where c.conname
    = 'organization_onboarding_invitation_results_result_code_check';

  foreach v_item in array array[
    'not_attempted', 'success', 'invite_already_pending', 'already_member',
    'existing_membership_requires_admin_action', 'invalid_input',
    'invitation_proof_lost', 'forbidden', 'rate_limited', 'unexpected',
    'transport_error'
  ] loop
    if pg_catalog.strpos(v_txt, '''' || v_item || '''') = 0 then
      raise exception 'RV-CAT: result_code allowlist is missing %', v_item;
    end if;
    n_catalog := n_catalog + 1;
  end loop;

  select pg_catalog.count(*)::integer
  into v_n
  from pg_catalog.regexp_matches(v_txt, '''([a-z_]+)''', 'g');

  if v_n <> 11 then
    raise exception
      'RV-CAT: result_code allowlist holds % literals; exactly 11 expected',
      v_n;
  end if;
  n_catalog := n_catalog + 1;

  -- evidence_kind allowlist: the exact 8 governed values, and only those.
  select pg_catalog.pg_get_constraintdef(c.oid)
  into v_txt
  from pg_catalog.pg_constraint as c
  where c.conname
    = 'organization_onboarding_invitation_results_evidence_kind_check';

  foreach v_item in array array[
    'created_invitation', 'pending_invitation', 'active_membership',
    'membership_collision', 'frozen_intent_invalid', 'historical_invitation',
    'rate_limited', 'none'
  ] loop
    if pg_catalog.strpos(v_txt, '''' || v_item || '''') = 0 then
      raise exception 'RV-CAT: evidence_kind allowlist is missing %', v_item;
    end if;
    n_catalog := n_catalog + 1;
  end loop;

  select pg_catalog.count(*)::integer
  into v_n
  from pg_catalog.regexp_matches(v_txt, '''([a-z_]+)''', 'g');

  if v_n <> 8 then
    raise exception
      'RV-CAT: evidence_kind allowlist holds % literals; exactly 8 expected',
      v_n;
  end if;
  n_catalog := n_catalog + 1;

  -- Exact function signatures, return types, SECURITY DEFINER, empty
  -- search_path, ownership, absence of overloads, and execution ACLs.
  v_cases := pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object(
      'schema', 'public',
      'name', 'ensure_organization_onboarding_completion_run',
      'args', 'p_organization_id uuid',
      'result', 'jsonb',
      'authenticated', true
    ),
    pg_catalog.jsonb_build_object(
      'schema', 'public',
      'name', 'list_organization_onboarding_frozen_team_invite_intents',
      'args', 'p_organization_id uuid',
      'result', 'jsonb',
      'authenticated', true
    ),
    pg_catalog.jsonb_build_object(
      'schema', 'public',
      'name', 'list_organization_onboarding_invitation_results',
      'args', 'p_organization_id uuid',
      'result', 'jsonb',
      'authenticated', true
    ),
    pg_catalog.jsonb_build_object(
      'schema', 'public',
      'name', 'execute_organization_onboarding_invite_intent',
      'args', 'p_organization_id uuid, p_intent_id uuid',
      'result', 'jsonb',
      'authenticated', true
    ),
    pg_catalog.jsonb_build_object(
      'schema', 'public',
      'name', 'reconcile_organization_onboarding_invite_intent',
      'args', 'p_organization_id uuid, p_intent_id uuid',
      'result', 'jsonb',
      'authenticated', true
    ),
    pg_catalog.jsonb_build_object(
      'schema', 'private',
      'name', 'resolve_organization_onboarding_completion_actor',
      'args', 'p_organization_id uuid',
      'result', 'TABLE(result_code text, actor_member_id uuid)',
      'authenticated', false
    ),
    pg_catalog.jsonb_build_object(
      'schema', 'private',
      'name', 'resolve_organization_onboarding_invite_intent_evidence',
      'args', 'p_organization_id uuid, p_intent_id uuid',
      'result',
        'TABLE(result_code text, evidence_kind text, invitation_id uuid)',
      'authenticated', false
    ),
    pg_catalog.jsonb_build_object(
      'schema', 'private',
      'name', 'persist_organization_onboarding_invite_intent_result',
      'args', 'p_organization_id uuid, p_intent_id uuid, p_result_code text, '
        || 'p_evidence_kind text, p_invitation_id uuid, '
        || 'p_increment_attempt boolean',
      'result', 'organization_onboarding_invitation_results',
      'authenticated', false
    ),
    pg_catalog.jsonb_build_object(
      'schema', 'private',
      'name', 'advance_organization_onboarding_completion_run',
      'args', 'p_organization_id uuid',
      'result', 'organization_onboarding_completion_runs',
      'authenticated', false
    )
  );

  for v_case in select pg_catalog.jsonb_array_elements(v_cases) loop
    v_item := (v_case ->> 'schema') || '.' || (v_case ->> 'name');

    select pg_catalog.count(*)::integer
    into v_n
    from pg_catalog.pg_proc as p
    inner join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = v_case ->> 'schema'
      and p.proname = v_case ->> 'name';

    if v_n <> 1 then
      raise exception
        'RV-CAT: % has % overloads; exactly one governed signature expected',
        v_item, v_n;
    end if;
    n_catalog := n_catalog + 1;

    select
      pg_catalog.pg_get_function_identity_arguments(p.oid),
      pg_catalog.pg_get_function_result(p.oid),
      p.prosecdef,
      coalesce(pg_catalog.array_to_string(p.proconfig, ','), ''),
      pg_catalog.pg_get_userbyid(p.proowner),
      coalesce(p.proacl::text, ''),
      p.oid
    into v_txt, v_txt2, v_bool, v_sql, v_conname, v_priv, v_oid
    from pg_catalog.pg_proc as p
    inner join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
    where n.nspname = v_case ->> 'schema'
      and p.proname = v_case ->> 'name';

    if v_txt <> (v_case ->> 'args') then
      raise exception
        'RV-CAT: % signature is (%) but (%) is the governed contract',
        v_item, v_txt, v_case ->> 'args';
    end if;
    n_catalog := n_catalog + 1;

    if v_txt2 <> (v_case ->> 'result') then
      raise exception
        'RV-CAT: % returns % but % is the governed contract',
        v_item, v_txt2, v_case ->> 'result';
    end if;
    n_catalog := n_catalog + 1;

    if not v_bool then
      raise exception 'RV-CAT: % is not SECURITY DEFINER', v_item;
    end if;
    n_catalog := n_catalog + 1;

    if v_sql <> 'search_path=""' then
      raise exception
        'RV-CAT: % has search_path configuration "%" instead of an empty '
        'search_path', v_item, v_sql;
    end if;
    n_catalog := n_catalog + 1;

    if v_conname <> 'postgres' then
      raise exception
        'RV-CAT: % is owned by % rather than postgres', v_item, v_conname;
    end if;
    n_catalog := n_catalog + 1;

    -- PUBLIC must never hold EXECUTE.
    if v_priv ~ '(^|,|\{)=X/' then
      raise exception 'RV-ACL: % grants EXECUTE to PUBLIC (%)', v_item, v_priv;
    end if;
    n_catalog := n_catalog + 1;

    -- anon and service_role must never hold EXECUTE.
    foreach v_txt2 in array array['anon', 'service_role'] loop
      if pg_catalog.has_function_privilege(v_txt2, v_oid, 'EXECUTE') then
        raise exception
          'RV-ACL: role % unexpectedly holds EXECUTE on %', v_txt2, v_item;
      end if;
      n_catalog := n_catalog + 1;
    end loop;

    -- authenticated holds EXECUTE on the five public RPCs and nothing else.
    if pg_catalog.has_function_privilege('authenticated', v_oid, 'EXECUTE')
      <> (v_case ->> 'authenticated')::boolean then
      raise exception
        'RV-ACL: authenticated EXECUTE on % is % but % is the governed contract',
        v_item,
        pg_catalog.has_function_privilege('authenticated', v_oid, 'EXECUTE'),
        v_case ->> 'authenticated';
    end if;
    n_catalog := n_catalog + 1;
  end loop;

  -- No public batch or bulk completion RPC exists.
  select pg_catalog.count(*)::integer
  into v_n
  from pg_catalog.pg_proc as p
  inner join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname ~ '(batch|bulk)'
    and p.proname ~ '(onboarding|invitation|completion|invite)';

  if v_n <> 0 then
    raise exception
      'RV-CAT: % public batch/bulk onboarding invitation RPC(s) exist; P0-A '
      'explicitly declines a batch operation', v_n;
  end if;
  n_catalog := n_catalog + 1;

  -- No table anywhere persists a plaintext invitation token column.
  select pg_catalog.count(*)::integer
  into v_n
  from information_schema.columns as c
  where c.table_schema in ('public', 'private')
    and c.column_name in ('raw_token', 'plaintext_token', 'token_plaintext');

  if v_n <> 0 then
    raise exception
      'RV-CAT: % plaintext invitation token column(s) exist', v_n;
  end if;
  n_catalog := n_catalog + 1;

  raise notice 'PHASE 2A complete: % catalog/ACL checks', n_catalog;

  -- =====================================================================
  -- Shared fixture construction
  -- =====================================================================

  select f.id
  into v_foundation
  from public.taxonomy_foundations as f
  where f.key = 'service' and f.lifecycle_status = 'active';

  if v_foundation is null then
    raise exception
      'RV-FIXTURE: the committed taxonomy seed registry is absent from this '
      'clone; mark_organization_onboarding_setup_ready cannot be exercised';
  end if;

  select cv.id
  into v_version
  from public.context_packs as cp
  inner join public.context_pack_versions as cv
    on cv.pack_id = cp.id and cv.publication_status = 'published'
  inner join public.context_pack_readiness as cr
    on cr.version_id = cv.id
    and cr.readiness_status in (
      'context_ready', 'beta_supported', 'production_verified'
    )
  where cp.pack_key = 'foundation.service' and cp.lifecycle_status = 'active'
  order by cv.version_number desc
  limit 1;

  if v_version is null then
    raise exception
      'RV-FIXTURE: no published readiness-accepted foundation.service Context '
      'pack version is present in this clone';
  end if;

  -- Synthetic users. The committed profile trigger materializes public.profiles.
  foreach v_item in array array['owner', 'staff', 'outsider', 'owner-b',
    'member', 'collision', 'lab-owner']
  loop
    v_uuid := case v_item
      when 'owner' then v_owner
      when 'staff' then v_staff
      when 'outsider' then v_outsider
      when 'owner-b' then v_owner_b
      when 'member' then v_member_user
      when 'collision' then v_collision_user
      else v_lab_owner
    end;

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uuid, 'authenticated',
      'authenticated', 'rv-' || v_item || '@example.test', '',
      pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb, pg_catalog.now(), pg_catalog.now()
    );

    update public.profiles
    set display_name = 'ZyntixAI RV Synthetic ' || v_item
    where id = v_uuid;
  end loop;

  -- V2 configured organizations: primary, foreign, zero-intent, constraint lab.
  foreach v_item in array array['primary', 'foreign', 'zero', 'lab'] loop
    v_uuid := case v_item
      when 'primary' then v_org
      when 'foreign' then v_org_b
      when 'zero' then v_org_zero
      else v_lab
    end;

    insert into public.organizations (
      id, name, slug, created_by, onboarding_flow_version, team_size_band
    ) values (
      v_uuid,
      'ZyntixAI RV ' || v_item,
      'zyntixai-rv-' || pg_catalog.replace(v_uuid::text, '-', ''),
      case v_item when 'foreign' then v_owner_b
        when 'lab' then v_lab_owner else v_owner end,
      2,
      '2_5'
    );

    insert into public.organization_members (
      organization_id, user_id, role, status, joined_at
    ) values (
      v_uuid,
      case v_item when 'foreign' then v_owner_b
        when 'lab' then v_lab_owner else v_owner end,
      'owner', 'active', pg_catalog.now()
    );

    insert into public.organization_business_activities (
      organization_id, activity_key, display_name, status, is_primary,
      classification_kind, foundation_id
    ) values (
      v_uuid, 'primary_operating_model', 'Agency & Business Services',
      'active', true, 'foundation', v_foundation
    )
    returning id into v_activity;

    insert into public.organization_context_assignments (
      organization_id, business_activity_id, context_pack_version_id, status,
      source, actor_user_id, actor_member_id, reason
    )
    select
      v_uuid, v_activity, v_version, 'active', 'onboarding',
      om.user_id, om.id, 'ENG-ONB-1H-P0-RV-EVIDENCE synthetic verification'
    from public.organization_members as om
    where om.organization_id = v_uuid and om.role = 'owner';
  end loop;

  select om.id into v_owner_member
  from public.organization_members as om
  where om.organization_id = v_org and om.user_id = v_owner;

  select om.id into v_lab_member
  from public.organization_members as om
  where om.organization_id = v_lab and om.user_id = v_lab_owner;

  -- Non-Owner member on the primary organization.
  insert into public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) values (v_org, v_staff, 'staff', 'active', pg_catalog.now());

  -- Legacy V1 and NULL-version organizations owned by the same Owner.
  insert into public.organizations (
    id, name, slug, created_by, onboarding_flow_version,
    business_type, primary_audience, primary_offering, primary_goal
  ) values (
    v_org_v1, 'ZyntixAI RV legacy v1',
    'zyntixai-rv-' || pg_catalog.replace(v_org_v1::text, '-', ''),
    v_owner, 1, 'course_seller', 'beginners', 'online_course', 'save_time'
  );

  insert into public.organizations (
    id, name, slug, created_by, onboarding_flow_version
  ) values (
    v_org_null, 'ZyntixAI RV grandfathered',
    'zyntixai-rv-' || pg_catalog.replace(v_org_null::text, '-', ''),
    v_owner, null
  );

  foreach v_item in array array['v1', 'null'] loop
    insert into public.organization_members (
      organization_id, user_id, role, status, joined_at
    ) values (
      case v_item when 'v1' then v_org_v1 else v_org_null end,
      v_owner, 'owner', 'active', pg_catalog.now()
    );
  end loop;

  select om.id into v_v1_member
  from public.organization_members as om
  where om.organization_id = v_org_v1 and om.user_id = v_owner;

  -- Owner actor context for every governed call below.
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_owner::text, 'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', v_owner::text, true);

  -- Frozen Team invite intents, created through committed ENG-ONB-1G-A1
  -- authority while the organization is still v2_configured.
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org, 'rv-target-success@example.test', 'staff'
  );
  if v_res ->> 'code' <> 'OK' then
    raise exception 'RV-FIXTURE: success intent creation failed: %', v_res;
  end if;
  v_intent_success := (v_res #>> '{intent,id}')::uuid;

  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org, 'rv-member@example.test', 'staff'
  );
  if v_res ->> 'code' <> 'OK' then
    raise exception 'RV-FIXTURE: member intent creation failed: %', v_res;
  end if;
  v_intent_member := (v_res #>> '{intent,id}')::uuid;

  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org, 'rv-collision@example.test', 'staff'
  );
  if v_res ->> 'code' <> 'OK' then
    raise exception 'RV-FIXTURE: collision intent creation failed: %', v_res;
  end if;
  v_intent_collision := (v_res #>> '{intent,id}')::uuid;

  insert into public.organization_onboarding_team_invite_intents (
    organization_id, email_normalized, role
  ) values (v_org_b, 'rv-foreign-target@example.test', 'viewer')
  returning id into v_intent_b;

  -- Membership discovered only after the intent list was frozen. ENG-ONB-1G-A1
  -- refuses intents for existing members, so these rows must land after the
  -- freeze; that is also exactly the drift P0-A must resolve as membership
  -- evidence rather than as a new invitation.
  insert into public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) values (v_org, v_member_user, 'viewer', 'active', pg_catalog.now());

  insert into public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) values (v_org, v_collision_user, 'viewer', 'suspended', pg_catalog.now());

  -- =====================================================================
  -- PHASE 3 - authorization and lifecycle guards (pre-Setup-Ready portion)
  -- =====================================================================

  -- V2 before durable Setup Ready: the Owner's own completion authority is
  -- refused with INVALID_LIFECYCLE, not with a leaked authorization code.
  foreach v_item in array array['ensure', 'frozen', 'results'] loop
    v_res := case v_item
      when 'ensure' then
        public.ensure_organization_onboarding_completion_run(v_org)
      when 'frozen' then
        public.list_organization_onboarding_frozen_team_invite_intents(v_org)
      else public.list_organization_onboarding_invitation_results(v_org)
    end;
    if v_res ->> 'code' <> 'INVALID_LIFECYCLE' then
      raise exception
        'RV-AUTHZ: % before Setup Ready returned % rather than '
        'INVALID_LIFECYCLE', v_item, v_res;
    end if;
    n_authz := n_authz + 1;
  end loop;

  v_res := public.execute_organization_onboarding_invite_intent(
    v_org, v_intent_success
  );
  if v_res ->> 'code' <> 'INVALID_LIFECYCLE' then
    raise exception
      'RV-AUTHZ: execute before Setup Ready returned % rather than '
      'INVALID_LIFECYCLE', v_res;
  end if;
  n_authz := n_authz + 1;

  v_res := public.reconcile_organization_onboarding_invite_intent(
    v_org, v_intent_success
  );
  if v_res ->> 'code' <> 'INVALID_LIFECYCLE' then
    raise exception
      'RV-AUTHZ: reconcile before Setup Ready returned % rather than '
      'INVALID_LIFECYCLE', v_res;
  end if;
  n_authz := n_authz + 1;

  if exists (
    select 1 from public.organization_onboarding_completion_runs as r
    where r.organization_id = v_org
  ) then
    raise exception
      'RV-AUTHZ: a completion run exists before Setup Ready was recorded';
  end if;
  n_authz := n_authz + 1;

  -- R2: every public invitation path denies V2 before Setup Ready.
  select c.result_code into v_txt
  from public.create_organization_invitation(
    v_org, 'rv-direct-create@example.test', 'staff'
  ) as c;
  if v_txt <> 'setup_not_ready' then
    raise exception
      'RV-AUTHZ: create_organization_invitation on V2 before Setup Ready '
      'returned % rather than setup_not_ready', v_txt;
  end if;
  n_authz := n_authz + 1;

  -- A synthetic pending invitation with a known synthetic raw token lets the
  -- opaque acceptance denial be exercised without any real token material.
  v_v2_raw := pg_catalog.md5('rv-v2-token-a') || pg_catalog.md5('rv-v2-token-b');
  insert into public.organization_invitations (
    organization_id, email_normalized, role, status, invited_by_member_id,
    token_hash, expires_at
  ) values (
    v_org, 'rv-v2-accept@example.test', 'staff', 'pending', v_owner_member,
    private.hash_organization_invitation_raw_token(v_v2_raw),
    pg_catalog.now() + interval '7 days'
  )
  returning id into v_v2_invitation;

  select r.result_code into v_txt
  from public.resend_organization_invitation(v_org, v_v2_invitation) as r;
  if v_txt <> 'setup_not_ready' then
    raise exception
      'RV-AUTHZ: resend_organization_invitation on V2 before Setup Ready '
      'returned % rather than setup_not_ready', v_txt;
  end if;
  n_authz := n_authz + 1;

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_outsider::text, 'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config(
    'request.jwt.claim.sub', v_outsider::text, true
  );

  select a.result_code into v_txt
  from public.accept_organization_invitation(v_v2_raw) as a;
  if v_txt <> 'invite_not_found_or_unavailable' then
    raise exception
      'RV-AUTHZ: accept_organization_invitation on V2 before Setup Ready '
      'returned % rather than the opaque invite_not_found_or_unavailable',
      v_txt;
  end if;
  n_authz := n_authz + 1;

  if exists (
    select 1 from public.organization_members as om
    where om.organization_id = v_org and om.user_id = v_outsider
  ) then
    raise exception
      'RV-AUTHZ: the denied acceptance still created a membership';
  end if;
  n_authz := n_authz + 1;

  -- V1 and NULL-version compatibility: no setup_not_ready gate applies.
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_owner::text, 'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', v_owner::text, true);

  foreach v_item in array array['v1', 'null'] loop
    select c.result_code, c.invitation_id
    into v_txt, v_uuid
    from public.create_organization_invitation(
      case v_item when 'v1' then v_org_v1 else v_org_null end,
      'rv-legacy-' || v_item || '@example.test',
      'staff'
    ) as c;

    if v_txt = 'setup_not_ready' then
      raise exception
        'RV-COMPAT: % organization was gated by the V2 Setup Ready rule',
        v_item;
    end if;
    n_authz := n_authz + 1;

    if v_txt <> 'success' or v_uuid is null then
      raise exception
        'RV-COMPAT: % invitation create returned % rather than success',
        v_item, v_txt;
    end if;
    n_authz := n_authz + 1;

    if v_item = 'v1' then
      v_v1_invitation := v_uuid;
    end if;
  end loop;

  -- V1 resend keeps working, and V1 acceptance still activates a membership.
  select r.result_code into v_txt
  from public.resend_organization_invitation(v_org_v1, v_v1_invitation) as r;
  if v_txt = 'setup_not_ready' then
    raise exception 'RV-COMPAT: V1 resend was gated by the V2 rule';
  end if;
  n_authz := n_authz + 1;

  -- V1 and NULL organizations may not be enrolled in the V2 completion
  -- authority at all.
  foreach v_item in array array['v1', 'null'] loop
    v_res := public.ensure_organization_onboarding_completion_run(
      case v_item when 'v1' then v_org_v1 else v_org_null end
    );
    if v_res ->> 'code' <> 'INVALID_LIFECYCLE' then
      raise exception
        'RV-COMPAT: ensure on the % organization returned % rather than '
        'INVALID_LIFECYCLE', v_item, v_res;
    end if;
    n_authz := n_authz + 1;
  end loop;

  -- =====================================================================
  -- PHASE 4 - P0-A runtime matrix
  -- =====================================================================

  -- Durable Setup Ready through server authority.
  v_res := public.mark_organization_onboarding_setup_ready(v_org);
  if (v_res ->> 'ok')::boolean is not true
    or v_res ->> 'state' <> 'ready'
    or (v_res ->> 'idempotent')::boolean is not false then
    raise exception 'RV-P0A: Setup Ready did not succeed durably: %', v_res;
  end if;
  v_ready_at := (v_res ->> 'onboarding_setup_ready_at')::timestamptz;
  n_p0a := n_p0a + 1;

  v_res := public.mark_organization_onboarding_setup_ready(v_org);
  if (v_res ->> 'idempotent')::boolean is not true
    or (v_res ->> 'onboarding_setup_ready_at')::timestamptz <> v_ready_at then
    raise exception 'RV-P0A: Setup Ready replay was not idempotent: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  if exists (
    select 1 from public.organizations as o
    where o.id = v_org and o.onboarding_completed_at is not null
  ) then
    raise exception
      'RV-P0A: Setup Ready granted product completion prematurely';
  end if;
  n_p0a := n_p0a + 1;

  -- Non-Owner, outsider and foreign-organization actors are all refused now
  -- that the lifecycle gate would otherwise pass.
  foreach v_item in array array['staff', 'outsider', 'anonymous'] loop
    if v_item = 'anonymous' then
      perform pg_catalog.set_config('request.jwt.claims', '', true);
      perform pg_catalog.set_config('request.jwt.claim.sub', '', true);
    else
      v_uuid := case v_item when 'staff' then v_staff else v_outsider end;
      perform pg_catalog.set_config(
        'request.jwt.claims',
        pg_catalog.json_build_object(
          'sub', v_uuid::text, 'role', 'authenticated'
        )::text,
        true
      );
      perform pg_catalog.set_config(
        'request.jwt.claim.sub', v_uuid::text, true
      );
    end if;

    v_txt := case v_item
      when 'anonymous' then 'NOT_AUTHENTICATED' else 'NOT_AUTHORIZED' end;

    foreach v_txt2 in array array[
      'ensure', 'frozen', 'results', 'execute', 'reconcile'
    ] loop
      v_res := case v_txt2
        when 'ensure' then
          public.ensure_organization_onboarding_completion_run(v_org)
        when 'frozen' then
          public.list_organization_onboarding_frozen_team_invite_intents(v_org)
        when 'results' then
          public.list_organization_onboarding_invitation_results(v_org)
        when 'execute' then
          public.execute_organization_onboarding_invite_intent(
            v_org, v_intent_success
          )
        else
          public.reconcile_organization_onboarding_invite_intent(
            v_org, v_intent_success
          )
      end;

      if v_res ->> 'code' <> v_txt then
        raise exception
          'RV-AUTHZ: % actor calling % returned % rather than %',
          v_item, v_txt2, v_res, v_txt;
      end if;
      n_authz := n_authz + 1;

      if v_res ? 'result' or v_res ? 'intents' or v_res ? 'results'
        or v_res ? 'status' then
        raise exception
          'RV-AUTHZ: % actor calling % leaked completion data: %',
          v_item, v_txt2, v_res;
      end if;
      n_authz := n_authz + 1;
    end loop;
  end loop;

  -- Foreign-organization Owner is refused on the primary organization.
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_owner_b::text, 'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', v_owner_b::text, true);

  v_res := public.ensure_organization_onboarding_completion_run(v_org);
  if v_res ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception
      'RV-AUTHZ: foreign-organization Owner was not refused: %', v_res;
  end if;
  n_authz := n_authz + 1;

  -- Governed ACLs are enforced by PostgreSQL, not only by the catalog: the
  -- anon role is genuinely denied EXECUTE, and authenticated is genuinely
  -- denied every direct table write.
  begin
    execute 'set local role anon';
    execute 'select public.reconcile_organization_onboarding_invite_intent('
      || pg_catalog.quote_literal(v_org) || '::uuid, '
      || pg_catalog.quote_literal(v_intent_success) || '::uuid)';
    execute 'reset role';
    raise exception
      'RV-ACL: the anon role executed a governed completion RPC';
  exception
    when insufficient_privilege then
      execute 'reset role';
      n_authz := n_authz + 1;
  end;

  foreach v_item in array array[
    'organization_onboarding_completion_runs',
    'organization_onboarding_invitation_results'
  ] loop
    foreach v_txt2 in array array['authenticated', 'anon', 'service_role'] loop
      begin
        execute 'set local role ' || pg_catalog.quote_ident(v_txt2);
        execute 'select 1 from public.' || pg_catalog.quote_ident(v_item)
          || ' limit 1';
        execute 'reset role';
        raise exception
          'RV-ACL: role % read public.% directly', v_txt2, v_item;
      exception
        when insufficient_privilege then
          execute 'reset role';
          n_authz := n_authz + 1;
      end;
    end loop;
  end loop;

  begin
    execute 'set local role authenticated';
    execute 'insert into public.organization_onboarding_completion_runs '
      || '(organization_id, status) values ('
      || pg_catalog.quote_literal(v_org) || '::uuid, ''setup_ready'')';
    execute 'reset role';
    raise exception
      'RV-ACL: authenticated wrote a completion run row directly';
  exception
    when insufficient_privilege then
      execute 'reset role';
      n_authz := n_authz + 1;
  end;

  -- Private proof persistence is unreachable from the API roles.
  begin
    execute 'set local role authenticated';
    execute
      'select private.persist_organization_onboarding_invite_intent_result('
      || pg_catalog.quote_literal(v_org) || '::uuid, '
      || pg_catalog.quote_literal(v_intent_success)
      || '::uuid, ''success'', ''created_invitation'', null::uuid, true)';
    execute 'reset role';
    raise exception
      'RV-ACL: authenticated reached private proof persistence';
  exception
    when insufficient_privilege then
      execute 'reset role';
      n_authz := n_authz + 1;
  end;

  -- Back to the governed Owner for the behavioral matrix.
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_owner::text, 'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', v_owner::text, true);

  -- Ensure the completion run and the per-intent frozen snapshot.
  v_res := public.ensure_organization_onboarding_completion_run(v_org);
  if v_res ->> 'code' <> 'OK' or v_res ->> 'status' <> 'setup_ready' then
    raise exception 'RV-P0A: ensure did not return setup_ready: %', v_res;
  end if;
  v_started_at := (v_res ->> 'started_at')::timestamptz;
  n_p0a := n_p0a + 1;

  if v_res ->> 'ready_for_cutover_at' is not null
    or v_res ->> 'completed_at' is not null then
    raise exception
      'RV-P0A: a fresh setup_ready run already carries readiness or completion '
      'timestamps: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  select pg_catalog.count(*)::integer
  into v_n
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org;

  if v_n <> 3 then
    raise exception
      'RV-P0A: ensure seeded % result rows for 3 frozen intents', v_n;
  end if;
  n_p0a := n_p0a + 1;

  if exists (
    select 1
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org
      and not (
        r.result_code = 'not_attempted' and r.evidence_kind = 'none'
        and r.invitation_id is null and r.attempt_count = 0
        and r.last_attempt_at is null
        and r.idempotency_key = 'onboarding-invite/' || r.organization_id::text
          || '/' || r.intent_id::text
      )
  ) then
    raise exception
      'RV-P0A: a seeded result row is not a clean server-owned not_attempted '
      'snapshot';
  end if;
  n_p0a := n_p0a + 1;

  -- Idempotent replay: one run, preserved started_at, no duplicate rows.
  v_res := public.ensure_organization_onboarding_completion_run(v_org);
  if (v_res ->> 'started_at')::timestamptz <> v_started_at then
    raise exception 'RV-P0A: ensure replay rewrote started_at: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  select pg_catalog.count(*)::integer
  into v_n
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = v_org;

  if v_n <> 1 then
    raise exception 'RV-P0A: ensure replay produced % runs', v_n;
  end if;
  n_p0a := n_p0a + 1;

  select pg_catalog.count(*)::integer
  into v_n
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org;

  if v_n <> 3 then
    raise exception 'RV-P0A: ensure replay produced % result rows', v_n;
  end if;
  n_p0a := n_p0a + 1;

  -- Zero frozen intents advance straight to ready_for_cutover.
  v_res := public.mark_organization_onboarding_setup_ready(v_org_zero);
  if (v_res ->> 'ok')::boolean is not true then
    raise exception 'RV-P0A: zero-intent Setup Ready failed: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  v_res := public.ensure_organization_onboarding_completion_run(v_org_zero);
  if v_res ->> 'code' <> 'OK'
    or v_res ->> 'status' <> 'ready_for_cutover'
    or v_res ->> 'ready_for_cutover_at' is null then
    raise exception
      'RV-P0A: a zero-intent organization did not advance directly to '
      'ready_for_cutover: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  if exists (
    select 1 from public.organizations as o
    where o.id = v_org_zero and o.onboarding_completed_at is not null
  ) then
    raise exception
      'RV-P0A: ready_for_cutover granted product completion prematurely';
  end if;
  n_p0a := n_p0a + 1;

  -- Authoritative frozen-intent read.
  v_res := public.list_organization_onboarding_frozen_team_invite_intents(
    v_org
  );
  if v_res ->> 'code' <> 'OK'
    or pg_catalog.jsonb_array_length(v_res -> 'intents') <> 3 then
    raise exception 'RV-P0A: frozen intent list is wrong: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  -- Execute one eligible intent. This is the only path that may create an
  -- invitation, and it must produce server-owned provenance.
  select * into v_before from rv_side_effects;

  v_res := public.execute_organization_onboarding_invite_intent(
    v_org, v_intent_success
  );
  if v_res ->> 'code' <> 'OK'
    or (v_res ->> 'fresh_create')::boolean is not true
    or v_res #>> '{result,result_code}' <> 'success'
    or v_res #>> '{result,evidence_kind}' <> 'created_invitation'
    or v_res #>> '{result,invitation_id}' is null
    or (v_res #>> '{result,attempt_count}')::integer <> 1
    or v_res #>> '{result,last_attempt_at}' is null
    or v_res ->> 'run_status' <> 'inviting' then
    raise exception 'RV-P0A: eligible execute did not succeed: %', v_res;
  end if;
  n_p0a := n_p0a + 4;

  if v_res ->> 'raw_token' !~ '^[0-9a-f]{64}$' then
    raise exception
      'RV-P0A: a fresh create did not return a transient opaque raw token';
  end if;
  n_p0a := n_p0a + 1;

  select * into v_after from rv_side_effects;

  if v_after.n_invitations <> v_before.n_invitations + 1
    or v_after.n_events <> v_before.n_events + 1
    or v_after.n_rate_attempts <> v_before.n_rate_attempts + 1
    or v_after.n_deliveries <> v_before.n_deliveries then
    raise exception
      'RV-P0A: execute side effects were not exactly one invitation, one '
      'event, one rate-limit attempt and zero deliveries (before %, after %)',
      pg_catalog.to_jsonb(v_before), pg_catalog.to_jsonb(v_after);
  end if;
  n_p0a := n_p0a + 4;

  select r.* into v_row
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org and r.intent_id = v_intent_success;

  if v_row.email_normalized <> 'rv-target-success@example.test'
    or v_row.target_role <> 'staff' then
    raise exception
      'RV-P0A: the result row does not carry the frozen intent identity';
  end if;
  n_p0a := n_p0a + 1;

  if v_row.idempotency_key <> 'onboarding-invite/' || v_org::text || '/'
    || v_intent_success::text then
    raise exception
      'RV-P0A: the idempotency key is not server generated: %',
      v_row.idempotency_key;
  end if;
  n_p0a := n_p0a + 1;

  if not exists (
    select 1 from public.organization_invitations as oi
    where oi.id = v_row.invitation_id
      and oi.organization_id = v_org
      and oi.email_normalized = v_row.email_normalized
      and oi.role = v_row.target_role
      and oi.status = 'pending'
      and oi.expires_at > pg_catalog.now()
      and oi.token_hash is not null
  ) then
    raise exception
      'RV-P0A: the recorded invitation_id is not a durable same-organization '
      'pending invitation';
  end if;
  n_p0a := n_p0a + 1;

  v_ts := v_row.last_attempt_at;
  v_ts2 := v_row.updated_at;

  -- Retry idempotency: the terminal-result skip path adds no attempt and no
  -- duplicate row.
  select * into v_before from rv_side_effects;
  v_res := public.execute_organization_onboarding_invite_intent(
    v_org, v_intent_success
  );
  select * into v_after from rv_side_effects;

  if v_res ->> 'code' <> 'OK'
    or (v_res ->> 'fresh_create')::boolean is not false
    or (v_res #>> '{result,attempt_count}')::integer <> 1
    or (v_res #>> '{result,last_attempt_at}')::timestamptz <> v_ts then
    raise exception 'RV-P0A: execute retry was not idempotent: %', v_res;
  end if;
  n_stamp := n_stamp + 3;

  if v_after.n_invitations <> v_before.n_invitations
    or v_after.n_events <> v_before.n_events
    or v_after.n_rate_attempts <> v_before.n_rate_attempts
    or v_after.fingerprint <> v_before.fingerprint then
    raise exception
      'RV-P0A: execute retry produced an invitation side effect';
  end if;
  n_side := n_side + 4;

  select pg_catalog.count(*)::integer
  into v_n
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org and r.intent_id = v_intent_success;

  if v_n <> 1 then
    raise exception 'RV-P0A: execute retry produced % result rows', v_n;
  end if;
  n_stamp := n_stamp + 1;

  if v_res ->> 'raw_token' is not null then
    raise exception
      'RV-P0A: a non-fresh execute reconstructed a raw token: %', v_res;
  end if;
  n_side := n_side + 1;

  -- Active membership and non-active membership evidence through execute.
  v_res := public.execute_organization_onboarding_invite_intent(
    v_org, v_intent_member
  );
  if v_res #>> '{result,result_code}' <> 'already_member'
    or v_res #>> '{result,evidence_kind}' <> 'active_membership'
    or v_res #>> '{result,invitation_id}' is not null then
    raise exception
      'RV-P0A: active membership did not resolve to already_member with no '
      'invitation evidence: %', v_res;
  end if;
  n_p0a := n_p0a + 3;

  v_res := public.execute_organization_onboarding_invite_intent(
    v_org, v_intent_collision
  );
  if v_res #>> '{result,result_code}'
      <> 'existing_membership_requires_admin_action'
    or v_res #>> '{result,evidence_kind}' <> 'membership_collision'
    or v_res #>> '{result,invitation_id}' is not null then
    raise exception
      'RV-P0A: a suspended membership did not resolve to a membership '
      'collision: %', v_res;
  end if;
  n_p0a := n_p0a + 3;

  -- All three intents now carry durable terminal proof.
  select r.* into v_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = v_org;

  if v_run.status <> 'ready_for_cutover' or v_run.ready_for_cutover_at is null
  then
    raise exception
      'RV-P0A: the run did not reach ready_for_cutover: %',
      pg_catalog.to_jsonb(v_run);
  end if;
  v_ready_at := v_run.ready_for_cutover_at;
  n_p0a := n_p0a + 2;

  if v_run.completed_at is not null or v_run.last_error_code is not null then
    raise exception
      'RV-P0A: ready_for_cutover carries a completion timestamp or a stale '
      'error code: %', pg_catalog.to_jsonb(v_run);
  end if;
  n_p0a := n_p0a + 2;

  v_res := public.list_organization_onboarding_invitation_results(v_org);
  if v_res ->> 'code' <> 'OK'
    or pg_catalog.jsonb_array_length(v_res -> 'results') <> 3 then
    raise exception 'RV-P0A: authoritative result list is wrong: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  -- invite_partial: a governed retryable outcome downgrades the run, and
  -- clearing the cause restores readiness. A fourth frozen intent is added as
  -- a synthetic fixture because the pre-ready intent RPC is correctly closed
  -- once the organization is Setup Ready.
  insert into public.organization_onboarding_team_invite_intents (
    organization_id, email_normalized, role
  ) values (v_org, 'rv-target-rate@example.test', 'staff')
  returning id into v_intent_rate;

  -- The earlier successful execution already opened this actor's create window,
  -- so exhaust the existing row rather than assuming a fresh one.
  insert into private.organization_invitation_mutation_rate_limits (
    organization_id, actor_user_id, action, scope_key, window_started_at,
    attempt_count
  ) values (v_org, v_owner, 'create', '', pg_catalog.now(), 10)
  on conflict (organization_id, actor_user_id, action, scope_key) do update
  set window_started_at = pg_catalog.now(), attempt_count = 10;

  v_res := public.ensure_organization_onboarding_completion_run(v_org);
  if v_res ->> 'status' <> 'inviting' then
    raise exception
      'RV-P0A: a new unattempted intent did not move the run back to '
      'inviting: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  if (v_res ->> 'ready_for_cutover_at')::timestamptz <> v_ready_at then
    raise exception
      'RV-P0A: the readiness timestamp was rewritten by a downgrade: %', v_res;
  end if;
  n_stamp := n_stamp + 1;

  v_res := public.execute_organization_onboarding_invite_intent(
    v_org, v_intent_rate
  );
  if v_res #>> '{result,result_code}' <> 'rate_limited'
    or v_res #>> '{result,evidence_kind}' <> 'rate_limited'
    or v_res #>> '{result,invitation_id}' is not null
    or v_res ->> 'run_status' <> 'invite_partial' then
    raise exception
      'RV-P0A: a rate-limited execute did not produce invite_partial: %',
      v_res;
  end if;
  n_p0a := n_p0a + 4;

  select r.* into v_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = v_org;

  if v_run.last_error_code <> 'rate_limited' then
    raise exception
      'RV-P0A: invite_partial did not record the retryable error code: %',
      pg_catalog.to_jsonb(v_run);
  end if;
  n_p0a := n_p0a + 1;

  delete from private.organization_invitation_mutation_rate_limits as rl
  where rl.organization_id = v_org and rl.actor_user_id = v_owner;

  v_res := public.execute_organization_onboarding_invite_intent(
    v_org, v_intent_rate
  );
  if v_res #>> '{result,result_code}' <> 'success'
    or v_res ->> 'run_status' <> 'ready_for_cutover' then
    raise exception
      'RV-P0A: retry after clearing the rate limit did not restore '
      'ready_for_cutover: %', v_res;
  end if;
  n_p0a := n_p0a + 2;

  if (v_res #>> '{result,attempt_count}')::integer <> 2 then
    raise exception
      'RV-P0A: a genuine second attempt did not increment attempt_count: %',
      v_res;
  end if;
  n_stamp := n_stamp + 1;

  select r.* into v_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = v_org;

  if v_run.ready_for_cutover_at <> v_ready_at then
    raise exception
      'RV-P0A: ready_for_cutover_at did not retain its first value across a '
      'downgrade and recovery cycle';
  end if;
  n_stamp := n_stamp + 1;

  if v_run.last_error_code is not null then
    raise exception
      'RV-P0A: recovery to ready_for_cutover did not clear last_error_code';
  end if;
  n_p0a := n_p0a + 1;

  -- Organization isolation.
  v_res := public.execute_organization_onboarding_invite_intent(
    v_org, v_intent_b
  );
  if v_res ->> 'code' <> 'INTENT_NOT_FOUND' then
    raise exception
      'RV-P0A: a foreign intent id was accepted under the primary '
      'organization: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  v_res := public.reconcile_organization_onboarding_invite_intent(
    v_org, v_intent_b
  );
  if v_res ->> 'code' <> 'INTENT_NOT_FOUND' then
    raise exception
      'RV-P0A: reconcile accepted a foreign intent id: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  v_res := public.execute_organization_onboarding_invite_intent(
    v_org_b, v_intent_b
  );
  if v_res ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception
      'RV-P0A: the primary Owner reached the foreign organization: %', v_res;
  end if;
  n_p0a := n_p0a + 1;

  if exists (
    select 1 from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_b
  ) then
    raise exception
      'RV-P0A: cross-organization calls created foreign result rows';
  end if;
  n_p0a := n_p0a + 1;

  -- Product completion is still not granted by any P0 path.
  if exists (
    select 1 from public.organizations as o
    where o.id in (v_org, v_org_zero) and o.onboarding_completed_at is not null
  ) then
    raise exception
      'RV-P0A: a P0 path granted product completion';
  end if;
  n_p0a := n_p0a + 1;

  if exists (
    select 1 from public.organization_onboarding_completion_runs as r
    where r.completed_at is not null or r.status = 'completed'
  ) then
    raise exception
      'RV-P0A: a P0 path invented a completed completion-run transition';
  end if;
  n_p0a := n_p0a + 1;

  raise notice
    'PHASE 3-4 complete: % authorization checks, % P0-A runtime checks',
    n_authz, n_p0a;

  -- =====================================================================
  -- PHASE 2B - runtime constraint behavior
  -- =====================================================================

  insert into public.organization_invitations (
    organization_id, id, email_normalized, role, status,
    invited_by_member_id, token_hash, expires_at
  ) values (
    v_lab, v_lab_invitation, 'rv-lab-invitation@example.test', 'staff',
    'pending', v_lab_member,
    private.hash_organization_invitation_raw_token(
      pg_catalog.md5('rv-lab-a') || pg_catalog.md5('rv-lab-b')
    ),
    pg_catalog.now() + interval '7 days'
  );

  -- One frozen intent per valid pairing, plus one spare for the rejections.
  for v_i in 1 .. 12 loop
    insert into public.organization_onboarding_team_invite_intents (
      organization_id, email_normalized, role
    ) values (
      v_lab,
      'rv-lab-' || pg_catalog.lpad(v_i::text, 2, '0') || '@example.test',
      'staff'
    )
    returning id into v_lab_intent;

    if v_i = 12 then
      v_lab_spare := v_lab_intent;
    else
      -- collected implicitly through the ordered read below
      null;
    end if;
  end loop;

  -- Every valid result/evidence pairing permitted by the P0-B4 proof check.
  v_cases := pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object(
      'code', 'not_attempted', 'evidence', 'none',
      'invitation', false, 'attempt', 0, 'stamp', false
    ),
    pg_catalog.jsonb_build_object(
      'code', 'success', 'evidence', 'created_invitation',
      'invitation', true, 'attempt', 1, 'stamp', true
    ),
    pg_catalog.jsonb_build_object(
      'code', 'invite_already_pending', 'evidence', 'pending_invitation',
      'invitation', true, 'attempt', 1, 'stamp', true
    ),
    pg_catalog.jsonb_build_object(
      'code', 'already_member', 'evidence', 'active_membership',
      'invitation', false, 'attempt', 1, 'stamp', true
    ),
    pg_catalog.jsonb_build_object(
      'code', 'existing_membership_requires_admin_action',
      'evidence', 'membership_collision',
      'invitation', false, 'attempt', 1, 'stamp', true
    ),
    pg_catalog.jsonb_build_object(
      'code', 'invalid_input', 'evidence', 'frozen_intent_invalid',
      'invitation', false, 'attempt', 1, 'stamp', true
    ),
    pg_catalog.jsonb_build_object(
      'code', 'invitation_proof_lost', 'evidence', 'historical_invitation',
      'invitation', true, 'attempt', 1, 'stamp', true
    ),
    pg_catalog.jsonb_build_object(
      'code', 'rate_limited', 'evidence', 'rate_limited',
      'invitation', false, 'attempt', 1, 'stamp', true
    ),
    pg_catalog.jsonb_build_object(
      'code', 'forbidden', 'evidence', 'none',
      'invitation', false, 'attempt', 1, 'stamp', true
    ),
    pg_catalog.jsonb_build_object(
      'code', 'unexpected', 'evidence', 'none',
      'invitation', false, 'attempt', 1, 'stamp', true
    ),
    pg_catalog.jsonb_build_object(
      'code', 'transport_error', 'evidence', 'none',
      'invitation', false, 'attempt', 1, 'stamp', true
    )
  );

  v_i := 0;
  for v_case in select pg_catalog.jsonb_array_elements(v_cases) loop
    v_i := v_i + 1;

    select i.id into v_lab_intent
    from public.organization_onboarding_team_invite_intents as i
    where i.organization_id = v_lab
      and i.email_normalized
        = 'rv-lab-' || pg_catalog.lpad(v_i::text, 2, '0') || '@example.test';

    insert into public.organization_onboarding_invitation_results (
      organization_id, intent_id, email_normalized, target_role,
      invitation_id, result_code, evidence_kind, attempt_count,
      last_attempt_at, idempotency_key
    ) values (
      v_lab, v_lab_intent, 'rv-lab-target@example.test', 'staff',
      case when (v_case ->> 'invitation')::boolean
        then v_lab_invitation else null end,
      v_case ->> 'code',
      v_case ->> 'evidence',
      (v_case ->> 'attempt')::integer,
      case when (v_case ->> 'stamp')::boolean
        then pg_catalog.now() else null end,
      'onboarding-invite/' || v_lab::text || '/' || v_lab_intent::text
    );
    n_constraint := n_constraint + 1;
  end loop;

  if n_constraint <> 11 then
    raise exception
      'RV-CONSTRAINT: % valid pairings were accepted; exactly 11 expected',
      n_constraint;
  end if;

  -- Every rejection must be the expected named PostgreSQL CHECK violation.
  v_cases := pg_catalog.jsonb_build_array(
    pg_catalog.jsonb_build_object(
      'label', 'success paired with pending_invitation evidence',
      'code', 'success', 'evidence', 'pending_invitation',
      'invitation', true, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'success without an invitation id',
      'code', 'success', 'evidence', 'created_invitation',
      'invitation', false, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'historical result paired with created_invitation evidence',
      'code', 'invitation_proof_lost', 'evidence', 'created_invitation',
      'invitation', true, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'historical evidence without the required invitation id',
      'code', 'invitation_proof_lost', 'evidence', 'historical_invitation',
      'invitation', false, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'historical evidence without a positive attempt count',
      'code', 'invitation_proof_lost', 'evidence', 'historical_invitation',
      'invitation', true, 'attempt', 0, 'stamp', false,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'active membership evidence carrying an invitation id',
      'code', 'already_member', 'evidence', 'active_membership',
      'invitation', true, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'membership collision mislabelled as active membership',
      'code', 'existing_membership_requires_admin_action',
      'evidence', 'active_membership',
      'invitation', false, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'active membership mislabelled as a collision',
      'code', 'already_member', 'evidence', 'membership_collision',
      'invitation', false, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'not_attempted carrying an attempt',
      'code', 'not_attempted', 'evidence', 'none',
      'invitation', false, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'positive attempt count without an attempt timestamp',
      'code', 'success', 'evidence', 'created_invitation',
      'invitation', true, 'attempt', 1, 'stamp', false,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_attempt_timestamp_ch')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'negative attempt count',
      'code', 'success', 'evidence', 'created_invitation',
      'invitation', true, 'attempt', -1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_attempt_count_check',
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'result code outside the governed allowlist',
      'code', 'rv_not_a_result_code', 'evidence', 'none',
      'invitation', false, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_result_code_check',
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'evidence kind outside the governed allowlist',
      'code', 'success', 'evidence', 'rv_not_an_evidence_kind',
      'invitation', true, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_evidence_kind_check',
        'organization_onboarding_invitation_results_proof_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'owner target role',
      'code', 'success', 'evidence', 'created_invitation',
      'invitation', true, 'attempt', 1, 'stamp', true,
      'role', 'owner', 'email', 'rv-lab-target@example.test', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_target_role_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'non-normalized email',
      'code', 'success', 'evidence', 'created_invitation',
      'invitation', true, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', '  RV-Lab-Target@Example.Test  ', 'idem', 'ok',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_email_check')
    ),
    pg_catalog.jsonb_build_object(
      'label', 'caller-shaped idempotency key',
      'code', 'success', 'evidence', 'created_invitation',
      'invitation', true, 'attempt', 1, 'stamp', true,
      'role', 'staff', 'email', 'rv-lab-target@example.test', 'idem', 'bad',
      'constraints', pg_catalog.jsonb_build_array(
        'organization_onboarding_invitation_results_idempotency_check')
    )
  );

  for v_case in select pg_catalog.jsonb_array_elements(v_cases) loop
    v_sql := pg_catalog.format(
      'insert into public.organization_onboarding_invitation_results ('
      || 'organization_id, intent_id, email_normalized, target_role, '
      || 'invitation_id, result_code, evidence_kind, attempt_count, '
      || 'last_attempt_at, idempotency_key) '
      || 'values (%L, %L, %L, %L, %L, %L, %L, %s, %L, %L)',
      v_lab,
      v_lab_spare,
      v_case ->> 'email',
      v_case ->> 'role',
      case when (v_case ->> 'invitation')::boolean
        then v_lab_invitation else null end,
      v_case ->> 'code',
      v_case ->> 'evidence',
      v_case ->> 'attempt',
      case when (v_case ->> 'stamp')::boolean then pg_catalog.now()
        else null end,
      case when v_case ->> 'idem' = 'ok'
        then 'onboarding-invite/' || v_lab::text || '/' || v_lab_spare::text
        else 'rv-caller-supplied-key' end
    );

    begin
      execute v_sql;
      raise exception
        'RV-CONSTRAINT: "%" was accepted but PostgreSQL must reject it via %',
        v_case ->> 'label', v_case ->> 'constraints';
    exception
      when check_violation then
        get stacked diagnostics v_conname = constraint_name;
        if not (v_case -> 'constraints') ? v_conname then
          raise exception
            'RV-CONSTRAINT: "%" was rejected by % but the governed contract '
            'admits only %', v_case ->> 'label', v_conname,
            v_case ->> 'constraints';
        end if;
        n_constraint := n_constraint + 1;
    end;
  end loop;

  if n_constraint <> 27 then
    raise exception
      'RV-CONSTRAINT: % total constraint checks; 11 pairings plus 16 '
      'rejections expected', n_constraint;
  end if;

  raise notice
    'PHASE 2B complete: % constraint checks (11 valid pairings, 16 proven '
    'rejections)', n_constraint;

  -- =====================================================================
  -- PHASE 5 - P0-B4 runtime matrix, carrying the Phase 6 timestamp and
  -- idempotency assertions and the Phase 7 side-effect boundary inline
  -- =====================================================================

  -- One single-intent organization per scenario. Every scenario starts from a
  -- genuine terminal proof produced by governed authority, never from a row
  -- written by hand, so the invalidation that follows is real drift.
  v_labels := array[
    'expired', 'revoked', 'accepted', 'lapsed', 'pending-stale',
    'membership-active', 'membership-nonactive', 'membership-foreign',
    'membership-email', 'reentry', 'completed', 'atomic'
  ];

  foreach v_item in array v_labels loop
    v_org_x := pg_catalog.gen_random_uuid();
    v_owner_x := pg_catalog.gen_random_uuid();
    v_target := 'rv-' || v_item || '-target@example.test';

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_owner_x, 'authenticated',
      'authenticated', 'rv-' || v_item || '-owner@example.test', '',
      pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb, pg_catalog.now(), pg_catalog.now()
    );

    update public.profiles
    set display_name = 'ZyntixAI RV Synthetic ' || v_item
    where id = v_owner_x;

    insert into public.organizations (
      id, name, slug, created_by, onboarding_flow_version, team_size_band
    ) values (
      v_org_x, 'ZyntixAI RV ' || v_item,
      'zyntixai-rv-' || pg_catalog.replace(v_org_x::text, '-', ''),
      v_owner_x, 2, '2_5'
    );

    insert into public.organization_members (
      organization_id, user_id, role, status, joined_at
    ) values (v_org_x, v_owner_x, 'owner', 'active', pg_catalog.now())
    returning id into v_member_x;

    insert into public.organization_business_activities (
      organization_id, activity_key, display_name, status, is_primary,
      classification_kind, foundation_id
    ) values (
      v_org_x, 'primary_operating_model', 'Agency & Business Services',
      'active', true, 'foundation', v_foundation
    )
    returning id into v_activity;

    insert into public.organization_context_assignments (
      organization_id, business_activity_id, context_pack_version_id, status,
      source, actor_user_id, actor_member_id, reason
    ) values (
      v_org_x, v_activity, v_version, 'active', 'onboarding',
      v_owner_x, v_member_x,
      'ENG-ONB-1H-P0-RV-EVIDENCE synthetic verification'
    );

    perform pg_catalog.set_config(
      'request.jwt.claims',
      pg_catalog.json_build_object(
        'sub', v_owner_x::text, 'role', 'authenticated'
      )::text,
      true
    );
    perform pg_catalog.set_config(
      'request.jwt.claim.sub', v_owner_x::text, true
    );

    v_res := public.create_organization_onboarding_team_invite_intent(
      v_org_x, v_target, 'staff'
    );
    if v_res ->> 'code' <> 'OK' then
      raise exception 'RV-P0B4[%]: intent creation failed: %', v_item, v_res;
    end if;
    v_intent_x := (v_res #>> '{intent,id}')::uuid;

    -- The stale-pending scenario needs a durable pending invitation that the
    -- governed execution discovers instead of creating one, so that its proof
    -- is invite_already_pending / pending_invitation rather than success.
    if v_item = 'pending-stale' then
      v_inv_x := pg_catalog.gen_random_uuid();
      insert into public.organization_invitations (
        organization_id, id, email_normalized, role, status,
        invited_by_member_id, token_hash, expires_at
      ) values (
        v_org_x, v_inv_x, v_target, 'staff', 'pending', v_member_x,
        private.hash_organization_invitation_raw_token(
          pg_catalog.md5(v_item || '-a') || pg_catalog.md5(v_item || '-b')
        ),
        pg_catalog.now() + interval '7 days'
      );
    end if;

    v_res := public.mark_organization_onboarding_setup_ready(v_org_x);
    if v_res ->> 'code' <> 'OK' then
      raise exception 'RV-P0B4[%]: Setup Ready failed: %', v_item, v_res;
    end if;

    v_res := public.ensure_organization_onboarding_completion_run(v_org_x);
    if v_res ->> 'code' <> 'OK' then
      raise exception 'RV-P0B4[%]: ensure failed: %', v_item, v_res;
    end if;

    v_res := public.execute_organization_onboarding_invite_intent(
      v_org_x, v_intent_x
    );

    if v_item = 'pending-stale' then
      if v_res #>> '{result,result_code}' <> 'invite_already_pending'
        or v_res #>> '{result,evidence_kind}' <> 'pending_invitation'
        or (v_res #>> '{result,invitation_id}')::uuid <> v_inv_x then
        raise exception
          'RV-P0B4[%]: execution did not adopt the durable pending '
          'invitation: %', v_item, v_res;
      end if;
    else
      if v_res #>> '{result,result_code}' <> 'success'
        or v_res #>> '{result,evidence_kind}' <> 'created_invitation' then
        raise exception
          'RV-P0B4[%]: execution did not produce a created_invitation proof: %',
          v_item, v_res;
      end if;
      v_inv_x := (v_res #>> '{result,invitation_id}')::uuid;
    end if;

    select r.* into v_run
    from public.organization_onboarding_completion_runs as r
    where r.organization_id = v_org_x;

    if v_run.status <> 'ready_for_cutover'
      or v_run.ready_for_cutover_at is null then
      raise exception
        'RV-P0B4[%]: a single proven intent did not reach ready_for_cutover: %',
        v_item, pg_catalog.to_jsonb(v_run);
    end if;

    v_fx := v_fx || pg_catalog.jsonb_build_object(
      v_item,
      pg_catalog.jsonb_build_object(
        'org', v_org_x, 'owner', v_owner_x, 'member', v_member_x,
        'intent', v_intent_x, 'invitation', v_inv_x, 'target', v_target,
        'ready_at', v_run.ready_for_cutover_at
      )
    );
    n_p0b4 := n_p0b4 + 1;
  end loop;

  -- ---- Stale created proof and stale pending proof ---------------------
  -- Four independent invalidations of a success / created_invitation proof
  -- plus one invalidation of an invite_already_pending / pending_invitation
  -- proof. All five must converge on the same non-terminal historical state.
  foreach v_item in array array[
    'expired', 'revoked', 'accepted', 'lapsed', 'pending-stale'
  ] loop
    v_org_x := (v_fx #>> array[v_item, 'org'])::uuid;
    v_owner_x := (v_fx #>> array[v_item, 'owner'])::uuid;
    v_intent_x := (v_fx #>> array[v_item, 'intent'])::uuid;
    v_inv_x := (v_fx #>> array[v_item, 'invitation'])::uuid;

    perform pg_catalog.set_config(
      'request.jwt.claims',
      pg_catalog.json_build_object(
        'sub', v_owner_x::text, 'role', 'authenticated'
      )::text,
      true
    );
    perform pg_catalog.set_config(
      'request.jwt.claim.sub', v_owner_x::text, true
    );

    select r.* into v_pre
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_x and r.intent_id = v_intent_x;

    -- Invalidate exactly the way the real lifecycle would, honouring every
    -- governed CHECK on the invitation row. Nothing is disabled or relaxed.
    if v_item = 'expired' then
      update public.organization_invitations
      set status = 'expired', token_hash = null
      where id = v_inv_x;
    elsif v_item in ('revoked', 'pending-stale') then
      update public.organization_invitations
      set status = 'revoked', revoked_at = pg_catalog.now(), token_hash = null
      where id = v_inv_x;
    elsif v_item = 'accepted' then
      update public.organization_invitations
      set status = 'accepted', accepted_at = pg_catalog.now(),
          token_hash = null
      where id = v_inv_x;
    else
      -- Still pending, but the window has closed. created_at moves back so the
      -- governed expires_at >= created_at ordering stays satisfied.
      update public.organization_invitations
      set created_at = pg_catalog.now() - interval '30 days',
          expires_at = pg_catalog.now() - interval '1 day'
      where id = v_inv_x;
    end if;

    select * into v_before from rv_side_effects;
    v_res := public.reconcile_organization_onboarding_invite_intent(
      v_org_x, v_intent_x
    );
    select * into v_after from rv_side_effects;

    if v_res ->> 'code' <> 'OK' then
      raise exception 'RV-P0B4[%]: reconcile was refused: %', v_item, v_res;
    end if;

    if v_res #>> '{result,result_code}' <> 'invitation_proof_lost'
      or v_res #>> '{result,evidence_kind}' <> 'historical_invitation' then
      raise exception
        'RV-P0B4[%]: an invalidated proof was not converted to '
        'invitation_proof_lost / historical_invitation: %', v_item, v_res;
    end if;
    n_p0b4 := n_p0b4 + 1;

    if (v_res #>> '{result,invitation_id}')::uuid <> v_inv_x then
      raise exception
        'RV-P0B4[%]: the historical invitation id was not preserved: %',
        v_item, v_res;
    end if;
    n_p0b4 := n_p0b4 + 1;

    if (v_res #>> '{result,attempt_count}')::integer
      <> v_pre.attempt_count then
      raise exception
        'RV-P0B4[%]: false preservation mode changed attempt_count from % to %',
        v_item, v_pre.attempt_count, v_res #>> '{result,attempt_count}';
    end if;
    n_stamp := n_stamp + 1;

    if (v_res #>> '{result,last_attempt_at}')::timestamptz
      <> v_pre.last_attempt_at then
      raise exception
        'RV-P0B4[%]: false preservation mode moved last_attempt_at from % to %',
        v_item, v_pre.last_attempt_at, v_res #>> '{result,last_attempt_at}';
    end if;
    n_stamp := n_stamp + 1;

    -- Historical evidence is not terminal, so readiness is withdrawn.
    if v_res ->> 'run_status' <> 'inviting' then
      raise exception
        'RV-P0B4[%]: historical evidence did not downgrade the run to '
        'inviting: %', v_item, v_res;
    end if;
    n_p0b4 := n_p0b4 + 1;

    select r.* into v_run
    from public.organization_onboarding_completion_runs as r
    where r.organization_id = v_org_x;

    if v_run.ready_for_cutover_at
      <> (v_fx #>> array[v_item, 'ready_at'])::timestamptz then
      raise exception
        'RV-P0B4[%]: the historical downgrade rewrote ready_for_cutover_at',
        v_item;
    end if;
    n_stamp := n_stamp + 1;

    if v_run.completed_at is not null or v_run.status = 'completed' then
      raise exception
        'RV-P0B4[%]: the downgrade invented a completed transition', v_item;
    end if;
    n_p0b4 := n_p0b4 + 1;

    if v_after.fingerprint <> v_before.fingerprint
      or v_after.n_invitations <> v_before.n_invitations
      or v_after.n_events <> v_before.n_events
      or v_after.n_deliveries <> v_before.n_deliveries
      or v_after.n_rate_rows <> v_before.n_rate_rows
      or v_after.n_rate_attempts <> v_before.n_rate_attempts
      or v_after.n_members <> v_before.n_members then
      raise exception
        'RV-SIDE[%]: reconciliation produced an invitation, a resend, an '
        'invitation status mutation, a token, a delivery attempt, an event, a '
        'rate-limit consumption or a membership change', v_item;
    end if;
    n_side := n_side + 1;

    select pg_catalog.count(*) into v_n
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_x and r.intent_id = v_intent_x;
    if v_n <> 1 then
      raise exception
        'RV-P0B4[%]: % authoritative rows exist for one frozen intent',
        v_item, v_n;
    end if;
    n_p0b4 := n_p0b4 + 1;

    -- Replaying historical reconciliation must not rewrite anything at all,
    -- including updated_at, because the stored evidence already matches.
    select r.* into v_pre
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_x and r.intent_id = v_intent_x;

    select * into v_before from rv_side_effects;
    v_res := public.reconcile_organization_onboarding_invite_intent(
      v_org_x, v_intent_x
    );
    select * into v_after from rv_side_effects;

    select r.* into v_row
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_x and r.intent_id = v_intent_x;

    if v_row.updated_at <> v_pre.updated_at
      or v_row.attempt_count <> v_pre.attempt_count
      or v_row.last_attempt_at <> v_pre.last_attempt_at
      or v_row.result_code <> v_pre.result_code
      or v_row.evidence_kind <> v_pre.evidence_kind
      or v_row.invitation_id is distinct from v_pre.invitation_id then
      raise exception
        'RV-P0B4[%]: a replayed historical reconciliation rewrote the '
        'authoritative row', v_item;
    end if;
    n_stamp := n_stamp + 1;

    if v_after.fingerprint <> v_before.fingerprint then
      raise exception
        'RV-SIDE[%]: a replayed reconciliation mutated invitation state',
        v_item;
    end if;
    n_side := n_side + 1;
  end loop;

  -- ---- Membership evidence precedence ----------------------------------
  foreach v_item in array array[
    'membership-active', 'membership-nonactive', 'membership-foreign',
    'membership-email'
  ] loop
    v_org_x := (v_fx #>> array[v_item, 'org'])::uuid;
    v_owner_x := (v_fx #>> array[v_item, 'owner'])::uuid;
    v_intent_x := (v_fx #>> array[v_item, 'intent'])::uuid;
    v_inv_x := (v_fx #>> array[v_item, 'invitation'])::uuid;
    v_target := v_fx #>> array[v_item, 'target'];

    perform pg_catalog.set_config(
      'request.jwt.claims',
      pg_catalog.json_build_object(
        'sub', v_owner_x::text, 'role', 'authenticated'
      )::text,
      true
    );
    perform pg_catalog.set_config(
      'request.jwt.claim.sub', v_owner_x::text, true
    );

    -- Withdraw the current invitation proof so durable membership facts are
    -- the only thing left that can decide the outcome.
    update public.organization_invitations
    set status = 'revoked', revoked_at = pg_catalog.now(), token_hash = null
    where id = v_inv_x;

    -- A synthetic identity that either does or does not match the frozen
    -- intent's normalized email, in the same or a foreign organization.
    v_uuid := pg_catalog.gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_uuid, 'authenticated',
      'authenticated',
      case v_item
        when 'membership-email' then 'rv-' || v_item || '-other@example.test'
        else v_target
      end,
      '', pg_catalog.now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      pg_catalog.now(), pg_catalog.now()
    );

    update public.profiles
    set display_name = 'ZyntixAI RV Synthetic ' || v_item || ' target'
    where id = v_uuid;

    insert into public.organization_members (
      organization_id, user_id, role, status, joined_at
    ) values (
      case v_item when 'membership-foreign' then v_org_b else v_org_x end,
      v_uuid, 'viewer',
      case v_item when 'membership-nonactive' then 'suspended' else 'active' end,
      pg_catalog.now()
    );

    select r.* into v_pre
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_x and r.intent_id = v_intent_x;

    select * into v_before from rv_side_effects;
    v_res := public.reconcile_organization_onboarding_invite_intent(
      v_org_x, v_intent_x
    );
    select * into v_after from rv_side_effects;

    if v_item = 'membership-active' then
      if v_res #>> '{result,result_code}' <> 'already_member'
        or v_res #>> '{result,evidence_kind}' <> 'active_membership' then
        raise exception
          'RV-P0B4[%]: a matching active membership did not win over the '
          'stale invitation proof: %', v_item, v_res;
      end if;
      if v_res #>> '{result,invitation_id}' is not null then
        raise exception
          'RV-P0B4[%]: membership evidence did not clear the invitation '
          'reference: %', v_item, v_res;
      end if;
      if v_res ->> 'run_status' <> 'ready_for_cutover' then
        raise exception
          'RV-P0B4[%]: proven active membership did not restore readiness: %',
          v_item, v_res;
      end if;
    elsif v_item = 'membership-nonactive' then
      if v_res #>> '{result,result_code}'
          <> 'existing_membership_requires_admin_action'
        or v_res #>> '{result,evidence_kind}' <> 'membership_collision' then
        raise exception
          'RV-P0B4[%]: a matching non-active membership did not become '
          'collision evidence: %', v_item, v_res;
      end if;
      if v_res #>> '{result,invitation_id}' is not null then
        raise exception
          'RV-P0B4[%]: collision evidence did not clear the invitation '
          'reference: %', v_item, v_res;
      end if;
      if v_res ->> 'run_status' <> 'ready_for_cutover' then
        raise exception
          'RV-P0B4[%]: proven collision evidence is not terminal: %',
          v_item, v_res;
      end if;
    else
      -- Foreign-organization membership and a different normalized email are
      -- both rejected as membership evidence, so the stale proof stays
      -- historical and the run stays non-terminal.
      if v_res #>> '{result,result_code}' <> 'invitation_proof_lost'
        or v_res #>> '{result,evidence_kind}' <> 'historical_invitation' then
        raise exception
          'RV-P0B4[%]: an unrelated membership was accepted as evidence: %',
          v_item, v_res;
      end if;
      if (v_res #>> '{result,invitation_id}')::uuid <> v_inv_x then
        raise exception
          'RV-P0B4[%]: the historical invitation id was lost: %', v_item, v_res;
      end if;
      if v_res ->> 'run_status' <> 'inviting' then
        raise exception
          'RV-P0B4[%]: an unrelated membership restored readiness: %',
          v_item, v_res;
      end if;
    end if;
    n_p0b4 := n_p0b4 + 3;

    if (v_res #>> '{result,attempt_count}')::integer
      <> v_pre.attempt_count then
      raise exception
        'RV-P0B4[%]: membership reconciliation changed attempt_count from % '
        'to %', v_item, v_pre.attempt_count,
        v_res #>> '{result,attempt_count}';
    end if;
    n_stamp := n_stamp + 1;

    if (v_res #>> '{result,last_attempt_at}')::timestamptz
      <> v_pre.last_attempt_at then
      raise exception
        'RV-P0B4[%]: membership reconciliation moved last_attempt_at', v_item;
    end if;
    n_stamp := n_stamp + 1;

    select r.* into v_run
    from public.organization_onboarding_completion_runs as r
    where r.organization_id = v_org_x;

    if v_run.ready_for_cutover_at
      <> (v_fx #>> array[v_item, 'ready_at'])::timestamptz then
      raise exception
        'RV-P0B4[%]: membership reconciliation rewrote ready_for_cutover_at',
        v_item;
    end if;
    n_stamp := n_stamp + 1;

    if v_after.fingerprint <> v_before.fingerprint then
      raise exception
        'RV-SIDE[%]: membership reconciliation mutated invitation, delivery, '
        'event, token, rate-limit or membership state', v_item;
    end if;
    n_side := n_side + 1;

    select pg_catalog.count(*) into v_n
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_x and r.intent_id = v_intent_x;
    if v_n <> 1 then
      raise exception
        'RV-P0B4[%]: % authoritative rows exist for one frozen intent',
        v_item, v_n;
    end if;
    n_p0b4 := n_p0b4 + 1;

    -- Replaying current-evidence reconciliation is idempotent.
    select r.* into v_pre
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_x and r.intent_id = v_intent_x;

    v_res := public.reconcile_organization_onboarding_invite_intent(
      v_org_x, v_intent_x
    );

    select r.* into v_row
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_x and r.intent_id = v_intent_x;

    if v_row.updated_at <> v_pre.updated_at
      or v_row.result_code <> v_pre.result_code
      or v_row.evidence_kind <> v_pre.evidence_kind
      or v_row.invitation_id is distinct from v_pre.invitation_id
      or v_row.attempt_count <> v_pre.attempt_count
      or v_row.last_attempt_at <> v_pre.last_attempt_at then
      raise exception
        'RV-P0B4[%]: a replayed current-evidence reconciliation rewrote the '
        'authoritative row', v_item;
    end if;
    n_stamp := n_stamp + 1;
  end loop;

  -- ---- Re-entry: historical proof plus valid current evidence ----------
  v_item := 'reentry';
  v_org_x := (v_fx #>> array[v_item, 'org'])::uuid;
  v_owner_x := (v_fx #>> array[v_item, 'owner'])::uuid;
  v_member_x := (v_fx #>> array[v_item, 'member'])::uuid;
  v_intent_x := (v_fx #>> array[v_item, 'intent'])::uuid;
  v_inv_x := (v_fx #>> array[v_item, 'invitation'])::uuid;
  v_target := v_fx #>> array[v_item, 'target'];

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_owner_x::text, 'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config(
    'request.jwt.claim.sub', v_owner_x::text, true
  );

  update public.organization_invitations
  set status = 'revoked', revoked_at = pg_catalog.now(), token_hash = null
  where id = v_inv_x;

  v_res := public.reconcile_organization_onboarding_invite_intent(
    v_org_x, v_intent_x
  );
  if v_res #>> '{result,result_code}' <> 'invitation_proof_lost'
    or v_res ->> 'run_status' <> 'inviting' then
    raise exception
      'RV-P0B4[reentry]: the historical starting state was not reached: %',
      v_res;
  end if;
  n_p0b4 := n_p0b4 + 1;

  select r.* into v_pre
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org_x and r.intent_id = v_intent_x;

  -- A fresh, valid, durable invitation for the same normalized email and role.
  v_inv_y := pg_catalog.gen_random_uuid();
  insert into public.organization_invitations (
    organization_id, id, email_normalized, role, status,
    invited_by_member_id, token_hash, expires_at
  ) values (
    v_org_x, v_inv_y, v_target, 'staff', 'pending', v_member_x,
    private.hash_organization_invitation_raw_token(
      pg_catalog.md5('rv-reentry-a') || pg_catalog.md5('rv-reentry-b')
    ),
    pg_catalog.now() + interval '7 days'
  );

  select * into v_before from rv_side_effects;
  v_res := public.reconcile_organization_onboarding_invite_intent(
    v_org_x, v_intent_x
  );
  select * into v_after from rv_side_effects;

  if v_res #>> '{result,result_code}' <> 'invite_already_pending'
    or v_res #>> '{result,evidence_kind}' <> 'pending_invitation' then
    raise exception
      'RV-P0B4[reentry]: valid current evidence did not take precedence over '
      'the historical proof: %', v_res;
  end if;
  n_p0b4 := n_p0b4 + 1;

  if (v_res #>> '{result,invitation_id}')::uuid <> v_inv_y
    or (v_res #>> '{result,invitation_id}')::uuid = v_inv_x then
    raise exception
      'RV-P0B4[reentry]: the historical invitation id was not replaced by the '
      'current one: %', v_res;
  end if;
  n_p0b4 := n_p0b4 + 1;

  if v_res ->> 'run_status' <> 'ready_for_cutover' then
    raise exception
      'RV-P0B4[reentry]: readiness was not restored through valid current '
      'evidence: %', v_res;
  end if;
  n_p0b4 := n_p0b4 + 1;

  if (v_res #>> '{result,attempt_count}')::integer <> v_pre.attempt_count
    or (v_res #>> '{result,last_attempt_at}')::timestamptz
      <> v_pre.last_attempt_at then
    raise exception
      'RV-P0B4[reentry]: re-entry rewrote the attempt provenance: %', v_res;
  end if;
  n_stamp := n_stamp + 2;

  select r.* into v_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = v_org_x;

  if v_run.ready_for_cutover_at
    <> (v_fx #>> array[v_item, 'ready_at'])::timestamptz then
    raise exception
      'RV-P0B4[reentry]: restored readiness minted a new '
      'ready_for_cutover_at instead of retaining the first one';
  end if;
  n_stamp := n_stamp + 1;

  if v_after.fingerprint <> v_before.fingerprint then
    raise exception
      'RV-SIDE[reentry]: re-entry reconciliation mutated invitation state';
  end if;
  n_side := n_side + 1;

  select pg_catalog.count(*) into v_n
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org_x and r.intent_id = v_intent_x;
  if v_n <> 1 then
    raise exception
      'RV-P0B4[reentry]: % authoritative rows exist for one frozen intent',
      v_n;
  end if;
  n_p0b4 := n_p0b4 + 1;

  -- ---- Completed boundary ----------------------------------------------
  v_item := 'completed';
  v_org_x := (v_fx #>> array[v_item, 'org'])::uuid;
  v_owner_x := (v_fx #>> array[v_item, 'owner'])::uuid;
  v_intent_x := (v_fx #>> array[v_item, 'intent'])::uuid;
  v_inv_x := (v_fx #>> array[v_item, 'invitation'])::uuid;

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_owner_x::text, 'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config(
    'request.jwt.claim.sub', v_owner_x::text, true
  );

  -- No P0 path writes completed_at, so the only way to reach the governed
  -- early boundary is to place the run there as a synthetic fixture. The row
  -- is written as table owner and still satisfies every governed CHECK.
  update public.organization_onboarding_completion_runs
  set status = 'completed', completed_at = pg_catalog.now()
  where organization_id = v_org_x;

  select r.* into v_pre_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = v_org_x;

  update public.organization_invitations
  set status = 'revoked', revoked_at = pg_catalog.now(), token_hash = null
  where id = v_inv_x;

  select * into v_before from rv_side_effects;
  v_res := public.reconcile_organization_onboarding_invite_intent(
    v_org_x, v_intent_x
  );
  select * into v_after from rv_side_effects;

  if v_res ->> 'run_status' <> 'completed' then
    raise exception
      'RV-P0B4[completed]: the governed early boundary did not hold: %', v_res;
  end if;
  n_p0b4 := n_p0b4 + 1;

  select r.* into v_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = v_org_x;

  if v_run.status <> 'completed'
    or v_run.completed_at <> v_pre_run.completed_at
    or v_run.ready_for_cutover_at <> v_pre_run.ready_for_cutover_at
    or v_run.started_at <> v_pre_run.started_at
    or v_run.updated_at <> v_pre_run.updated_at then
    raise exception
      'RV-P0B4[completed]: a completed run was recomputed instead of returning '
      'through the early boundary: % vs %',
      pg_catalog.to_jsonb(v_run), pg_catalog.to_jsonb(v_pre_run);
  end if;
  n_p0b4 := n_p0b4 + 1;

  if v_run.completed_at < v_run.ready_for_cutover_at
    or v_run.ready_for_cutover_at < v_run.started_at then
    raise exception
      'RV-P0B4[completed]: the completed run timestamps are not coherent';
  end if;
  n_stamp := n_stamp + 1;

  if exists (
    select 1 from public.organizations as o
    where o.id = v_org_x and o.onboarding_completed_at is not null
  ) then
    raise exception
      'RV-P0B4[completed]: a completed run granted product completion';
  end if;
  n_p0b4 := n_p0b4 + 1;

  if v_after.fingerprint <> v_before.fingerprint then
    raise exception
      'RV-SIDE[completed]: reconciliation against a completed run mutated '
      'invitation state';
  end if;
  n_side := n_side + 1;

  raise notice
    'PHASE 5-7 complete: % P0-B4 checks, % timestamp/idempotency checks, '
    '% side-effect boundaries', n_p0b4, n_stamp, n_side;

  -- =====================================================================
  -- PHASE 8 - controlled post-conversion failure and atomicity
  -- =====================================================================

  v_item := 'atomic';
  v_org_x := (v_fx #>> array[v_item, 'org'])::uuid;
  v_owner_x := (v_fx #>> array[v_item, 'owner'])::uuid;
  v_intent_x := (v_fx #>> array[v_item, 'intent'])::uuid;
  v_inv_x := (v_fx #>> array[v_item, 'invitation'])::uuid;

  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object(
      'sub', v_owner_x::text, 'role', 'authenticated'
    )::text,
    true
  );
  perform pg_catalog.set_config(
    'request.jwt.claim.sub', v_owner_x::text, true
  );

  update public.organization_invitations
  set status = 'revoked', revoked_at = pg_catalog.now(), token_hash = null
  where id = v_inv_x;

  select r.* into v_pre
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org_x and r.intent_id = v_intent_x;

  select r.* into v_pre_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = v_org_x;

  select * into v_before from rv_side_effects;

  select pg_catalog.count(*)::integer into v_n
  from pg_catalog.pg_locks as l
  where l.locktype = 'advisory'
    and l.classid = 872004
    and l.pid = pg_catalog.pg_backend_pid()
    and l.granted;

  begin
    v_res := public.reconcile_organization_onboarding_invite_intent(
      v_org_x, v_intent_x
    );
    if v_res #>> '{result,result_code}' <> 'invitation_proof_lost' then
      raise exception
        'RV-ATOMIC: the conversion under test did not happen: %', v_res;
    end if;

    -- The conversion and the advancement are both durable at this point, so
    -- the rollback below is genuinely undoing observed writes.
    select r.* into v_row
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org_x and r.intent_id = v_intent_x;

    select r.* into v_run
    from public.organization_onboarding_completion_runs as r
    where r.organization_id = v_org_x;

    if v_row.result_code <> 'invitation_proof_lost'
      or v_row.evidence_kind <> 'historical_invitation'
      or v_run.status <> 'inviting' then
      raise exception
        'RV-ATOMIC: the pre-failure state was not the converted state: % / %',
        pg_catalog.to_jsonb(v_row), pg_catalog.to_jsonb(v_run);
    end if;

    raise exception using
      errcode = 'RV001',
      message = 'RV-ATOMIC induced post-conversion failure';
  exception
    when sqlstate 'RV001' then
      n_atomic := n_atomic + 1;
  end;

  select r.* into v_row
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org_x and r.intent_id = v_intent_x;

  if v_row.result_code <> v_pre.result_code
    or v_row.evidence_kind <> v_pre.evidence_kind
    or v_row.invitation_id is distinct from v_pre.invitation_id
    or v_row.attempt_count <> v_pre.attempt_count
    or v_row.last_attempt_at <> v_pre.last_attempt_at
    or v_row.updated_at <> v_pre.updated_at then
    raise exception
      'RV-ATOMIC: the conversion did not roll back: % vs %',
      pg_catalog.to_jsonb(v_row), pg_catalog.to_jsonb(v_pre);
  end if;
  n_atomic := n_atomic + 1;

  select r.* into v_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = v_org_x;

  if v_run.status <> v_pre_run.status
    or v_run.ready_for_cutover_at <> v_pre_run.ready_for_cutover_at
    or v_run.started_at <> v_pre_run.started_at
    or v_run.updated_at <> v_pre_run.updated_at
    or v_run.completed_at is distinct from v_pre_run.completed_at
    or v_run.last_error_code is distinct from v_pre_run.last_error_code then
    raise exception
      'RV-ATOMIC: the advancement did not roll back: % vs %',
      pg_catalog.to_jsonb(v_run), pg_catalog.to_jsonb(v_pre_run);
  end if;
  n_atomic := n_atomic + 1;

  select pg_catalog.count(*) into v_n
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org_x and r.intent_id = v_intent_x;
  if v_n <> 1 then
    raise exception
      'RV-ATOMIC: % partial result rows survived the rollback', v_n;
  end if;
  n_atomic := n_atomic + 1;

  select * into v_after from rv_side_effects;
  if v_after.fingerprint <> v_before.fingerprint
    or v_after.n_results <> v_before.n_results
    or v_after.n_runs <> v_before.n_runs
    or v_after.n_deliveries <> v_before.n_deliveries
    or v_after.n_rate_rows <> v_before.n_rate_rows
    or v_after.n_rate_attempts <> v_before.n_rate_attempts then
    raise exception
      'RV-ATOMIC: delivery, rate-limit, token or invitation residue survived '
      'the rollback';
  end if;
  n_atomic := n_atomic + 1;

  -- Genuine release-on-abort proof. The constraint laboratory organization has
  -- never entered the governed advisory namespace in this transaction, so a
  -- lock seen inside the subtransaction can only come from the call under test
  -- and its disappearance can only come from the abort. Section 2 proves the
  -- same property across real, separate backend sessions.
  v_lock_key := pg_catalog.hashtext(v_lab::text);
  if v_lock_key < 0 then
    v_lock_key := v_lock_key + 4294967296;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_locks as l
    where l.locktype = 'advisory'
      and l.classid = 872004
      and l.objid::bigint = v_lock_key
      and l.objsubid = 2
  ) then
    raise exception
      'RV-ATOMIC: the release probe namespace was already held before the test';
  end if;
  n_atomic := n_atomic + 1;

  begin
    perform public.ensure_organization_onboarding_completion_run(v_lab);

    if not exists (
      select 1
      from pg_catalog.pg_locks as l
      where l.locktype = 'advisory'
        and l.classid = 872004
        and l.objid::bigint = v_lock_key
        and l.objsubid = 2
        and l.pid = pg_catalog.pg_backend_pid()
        and l.granted
    ) then
      raise exception
        'RV-ATOMIC: the governed advisory lock was never taken on 872004';
    end if;

    raise exception using
      errcode = 'RV001',
      message = 'RV-ATOMIC induced abort while holding 872004';
  exception
    when sqlstate 'RV001' then
      n_atomic := n_atomic + 1;
  end;

  if exists (
    select 1
    from pg_catalog.pg_locks as l
    where l.locktype = 'advisory'
      and l.classid = 872004
      and l.objid::bigint = v_lock_key
      and l.objsubid = 2
  ) then
    raise exception
      'RV-ATOMIC: the governed advisory lock survived the aborted work';
  end if;
  n_atomic := n_atomic + 1;

  raise notice 'PHASE 8 complete: % failure-atomicity checks', n_atomic;

  -- The pinned contract is asserted, not merely printed, so any silent loss of
  -- coverage in this section is a hard failure instead of a smaller number.
  if n_catalog <> c_catalog or n_constraint <> c_constraint
    or n_authz <> c_authz or n_p0a <> c_p0a or n_p0b4 <> c_p0b4
    or n_stamp <> c_stamp or n_side <> c_side or n_atomic <> c_atomic then
    raise exception
      'RV-COVERAGE: section 1 executed catalog=%/% constraint=%/% authz=%/% '
      'p0a=%/% p0b4=%/% stamp=%/% side=%/% atomic=%/% against the pinned '
      'contract',
      n_catalog, c_catalog, n_constraint, c_constraint, n_authz, c_authz,
      n_p0a, c_p0a, n_p0b4, c_p0b4, n_stamp, c_stamp, n_side, c_side,
      n_atomic, c_atomic;
  end if;

  raise notice
    'SECTION 1 PASS: % checks (catalog=% constraint=% authz=% p0a=% p0b4=% '
    'stamp=% side=% atomic=%)',
    n_catalog + n_constraint + n_authz + n_p0a + n_p0b4 + n_stamp + n_side
      + n_atomic,
    n_catalog, n_constraint, n_authz, n_p0a, n_p0b4, n_stamp, n_side, n_atomic;
end;
$section1$;

rollback;

-- ===========================================================================
-- SECTION 2 - genuine two-session concurrency (Phase 9)
-- ===========================================================================
-- Two real PostgreSQL backends cannot see each other's uncommitted rows, so
-- contention over shared authority state cannot be reproduced inside one
-- rolled-back transaction. This section therefore commits its fixtures. That
-- is precisely why GUARD 1 refuses every database except a uniquely named
-- disposable clone, why the estate is deleted again below, and why the
-- terminal verdict is withheld until zero residue has been re-proven.
--
-- The second and third sessions are opened with `dblink`, which GUARD 1 has
-- already proven is installed in this clone. `dblink` is the portable choice
-- here: it ships with the standard PostgreSQL contrib set that Supabase local
-- development already provides, it is reachable from inside the artifact so
-- the required concurrency stays repository-native instead of hiding in an
-- external harness, and it needs no credentials because the loopback
-- connection is made by the same local superuser over the same cluster.
-- No password, host or port is embedded anywhere below.

create temporary table rv_conc (
  label text primary key,
  organization_id uuid not null,
  owner_id uuid not null,
  member_id uuid not null,
  intent_id uuid not null,
  invitation_id uuid not null,
  fresh_invitation_id uuid,
  ready_at timestamptz not null,
  attempt_count integer not null,
  last_attempt_at timestamptz not null,
  lock_key bigint not null,
  pid_a integer,
  pid_b integer,
  waited interval,
  resumed interval
);

-- ---------------------------------------------------------------------------
-- Committed synthetic estate, one single-intent organization per scenario
-- ---------------------------------------------------------------------------

do $conc_fixture$
declare
  v_foundation uuid;
  v_version uuid;
  v_item text;
  v_org uuid;
  v_owner uuid;
  v_member uuid;
  v_activity uuid;
  v_intent uuid;
  v_inv uuid;
  v_fresh uuid;
  v_target text;
  v_res jsonb;
  v_row public.organization_onboarding_invitation_results%rowtype;
  v_run public.organization_onboarding_completion_runs%rowtype;
  v_key bigint;
  v_uuid uuid;
begin
  select f.id
  into v_foundation
  from public.taxonomy_foundations as f
  where f.key = 'service' and f.lifecycle_status = 'active';

  select cv.id
  into v_version
  from public.context_packs as cp
  inner join public.context_pack_versions as cv
    on cv.pack_id = cp.id and cv.publication_status = 'published'
  inner join public.context_pack_readiness as cr
    on cr.version_id = cv.id
    and cr.readiness_status in (
      'context_ready', 'beta_supported', 'production_verified'
    )
  where cp.pack_key = 'foundation.service' and cp.lifecycle_status = 'active'
  order by cv.version_number desc
  limit 1;

  if v_foundation is null or v_version is null then
    raise exception
      'RV-CONC: the committed seed registry is missing from this clone';
  end if;

  foreach v_item in array array[
    'race-stale', 'race-reentry', 'race-conflict', 'race-wait'
  ] loop
    v_org := pg_catalog.gen_random_uuid();
    v_owner := pg_catalog.gen_random_uuid();
    v_fresh := null;
    v_target := 'rv-' || v_item || '-target@example.test';

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000', v_owner, 'authenticated',
      'authenticated', 'rv-' || v_item || '-owner@example.test', '',
      pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb, pg_catalog.now(), pg_catalog.now()
    );

    update public.profiles
    set display_name = 'ZyntixAI RV Synthetic ' || v_item
    where id = v_owner;

    insert into public.organizations (
      id, name, slug, created_by, onboarding_flow_version, team_size_band
    ) values (
      v_org, 'ZyntixAI RV ' || v_item,
      'zyntixai-rv-' || pg_catalog.replace(v_org::text, '-', ''),
      v_owner, 2, '2_5'
    );

    insert into public.organization_members (
      organization_id, user_id, role, status, joined_at
    ) values (v_org, v_owner, 'owner', 'active', pg_catalog.now())
    returning id into v_member;

    insert into public.organization_business_activities (
      organization_id, activity_key, display_name, status, is_primary,
      classification_kind, foundation_id
    ) values (
      v_org, 'primary_operating_model', 'Agency & Business Services',
      'active', true, 'foundation', v_foundation
    )
    returning id into v_activity;

    insert into public.organization_context_assignments (
      organization_id, business_activity_id, context_pack_version_id, status,
      source, actor_user_id, actor_member_id, reason
    ) values (
      v_org, v_activity, v_version, 'active', 'onboarding',
      v_owner, v_member, 'ENG-ONB-1H-P0-RV-EVIDENCE synthetic concurrency'
    );

    perform pg_catalog.set_config(
      'request.jwt.claims',
      pg_catalog.json_build_object(
        'sub', v_owner::text, 'role', 'authenticated'
      )::text,
      true
    );
    perform pg_catalog.set_config('request.jwt.claim.sub', v_owner::text, true);

    v_res := public.create_organization_onboarding_team_invite_intent(
      v_org, v_target, 'staff'
    );
    if v_res ->> 'code' <> 'OK' then
      raise exception 'RV-CONC[%]: intent creation failed: %', v_item, v_res;
    end if;
    v_intent := (v_res #>> '{intent,id}')::uuid;

    v_res := public.mark_organization_onboarding_setup_ready(v_org);
    if v_res ->> 'code' <> 'OK' then
      raise exception 'RV-CONC[%]: Setup Ready failed: %', v_item, v_res;
    end if;

    perform public.ensure_organization_onboarding_completion_run(v_org);

    v_res := public.execute_organization_onboarding_invite_intent(
      v_org, v_intent
    );
    if v_res #>> '{result,result_code}' <> 'success' then
      raise exception 'RV-CONC[%]: execution failed: %', v_item, v_res;
    end if;
    v_inv := (v_res #>> '{result,invitation_id}')::uuid;

    -- Real drift: the governed proof is invalidated exactly as the lifecycle
    -- would invalidate it.
    update public.organization_invitations
    set status = 'revoked', revoked_at = pg_catalog.now(), token_hash = null
    where id = v_inv;

    -- The re-entry and conflicting-evidence races start from an already
    -- historical proof, so the contended decision is evidence precedence
    -- rather than the first conversion.
    if v_item in ('race-reentry', 'race-conflict') then
      v_res := public.reconcile_organization_onboarding_invite_intent(
        v_org, v_intent
      );
      if v_res #>> '{result,result_code}' <> 'invitation_proof_lost' then
        raise exception
          'RV-CONC[%]: the historical starting state was not reached: %',
          v_item, v_res;
      end if;

      v_fresh := pg_catalog.gen_random_uuid();
      insert into public.organization_invitations (
        organization_id, id, email_normalized, role, status,
        invited_by_member_id, token_hash, expires_at
      ) values (
        v_org, v_fresh, v_target, 'staff', 'pending', v_member,
        private.hash_organization_invitation_raw_token(
          pg_catalog.md5(v_item || '-a') || pg_catalog.md5(v_item || '-b')
        ),
        pg_catalog.now() + interval '7 days'
      );
    end if;

    -- The conflicting-evidence race additionally carries a matching active
    -- membership, so a valid pending invitation and a durable membership both
    -- describe the same frozen intent at the same time.
    if v_item = 'race-conflict' then
      v_uuid := pg_catalog.gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at
      ) values (
        '00000000-0000-0000-0000-000000000000', v_uuid, 'authenticated',
        'authenticated', v_target, '', pg_catalog.now(),
        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
        pg_catalog.now(), pg_catalog.now()
      );

      update public.profiles
      set display_name = 'ZyntixAI RV Synthetic ' || v_item || ' target'
      where id = v_uuid;

      insert into public.organization_members (
        organization_id, user_id, role, status, joined_at
      ) values (v_org, v_uuid, 'viewer', 'active', pg_catalog.now());
    end if;

    select r.* into v_row
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_org and r.intent_id = v_intent;

    select r.* into v_run
    from public.organization_onboarding_completion_runs as r
    where r.organization_id = v_org;

    v_key := pg_catalog.hashtext(v_org::text);
    if v_key < 0 then
      v_key := v_key + 4294967296;
    end if;

    insert into rv_conc (
      label, organization_id, owner_id, member_id, intent_id, invitation_id,
      fresh_invitation_id, ready_at, attempt_count, last_attempt_at, lock_key
    ) values (
      v_item, v_org, v_owner, v_member, v_intent, v_inv, v_fresh,
      v_run.ready_for_cutover_at, v_row.attempt_count, v_row.last_attempt_at,
      v_key
    );
  end loop;

  raise notice
    'PHASE 9 fixtures committed: % disposable-clone organizations',
    (select pg_catalog.count(*) from rv_conc);
end;
$conc_fixture$;

-- ---------------------------------------------------------------------------
-- The four required races, each on two genuine backend sessions
-- ---------------------------------------------------------------------------

do $conc_races$
declare
  -- Loopback, same cluster, same local superuser, no password, no host, no
  -- port. Nothing here is a credential.
  v_conn text := 'dbname=' || pg_catalog.current_database()
    || ' user=' || current_user;
  v_specs jsonb;
  v_spec jsonb;
  v_fx rv_conc%rowtype;
  v_label text;
  v_release text;
  v_writer text;
  v_exp_inv uuid;
  v_call text;
  v_claims text;
  v_pid_a integer;
  v_pid_b integer;
  v_waiters integer;
  v_started timestamptz;
  v_waited interval;
  v_resumed interval;
  v_a jsonb;
  v_b jsonb;
  v_win jsonb;
  v_row public.organization_onboarding_invitation_results%rowtype;
  v_run public.organization_onboarding_completion_runs%rowtype;
  v_before rv_side_effects%rowtype;
  v_after rv_side_effects%rowtype;
  v_conns text[];
  v_item text;
  v_n integer;
  v_i integer;
  v_scenarios integer := 0;
begin
  -- Never inherit a session from an interrupted earlier attempt.
  v_conns := coalesce(dblink_get_connections(), array[]::text[]);
  foreach v_item in array v_conns loop
    perform dblink_disconnect(v_item);
  end loop;

  v_specs := pg_catalog.jsonb_build_array(
    -- 1. Stale-proof conversion race: both sessions try to convert the same
    --    invalidated created_invitation proof.
    pg_catalog.jsonb_build_object(
      'label', 'race-stale', 'release', 'commit', 'writer', 'a',
      'code', 'invitation_proof_lost', 'evidence', 'historical_invitation',
      'invitation', 'original', 'run_status', 'inviting'
    ),
    -- 2. Valid-evidence re-entry race: both sessions try to adopt the same
    --    fresh pending invitation over the historical proof.
    pg_catalog.jsonb_build_object(
      'label', 'race-reentry', 'release', 'commit', 'writer', 'a',
      'code', 'invite_already_pending', 'evidence', 'pending_invitation',
      'invitation', 'fresh', 'run_status', 'ready_for_cutover'
    ),
    -- 3. Conflicting-evidence race: a matching active membership and a valid
    --    pending invitation describe the same frozen intent at once, and the
    --    governed precedence must resolve identically in both sessions.
    pg_catalog.jsonb_build_object(
      'label', 'race-conflict', 'release', 'commit', 'writer', 'a',
      'code', 'already_member', 'evidence', 'active_membership',
      'invitation', 'none', 'run_status', 'ready_for_cutover'
    ),
    -- 4. Session A rolls back while Session B waits, so the waiting session
    --    must perform the single effective transition itself.
    pg_catalog.jsonb_build_object(
      'label', 'race-wait', 'release', 'rollback', 'writer', 'b',
      'code', 'invitation_proof_lost', 'evidence', 'historical_invitation',
      'invitation', 'original', 'run_status', 'inviting'
    )
  );

  for v_spec in select pg_catalog.jsonb_array_elements(v_specs) loop
    v_label := v_spec ->> 'label';
    v_release := v_spec ->> 'release';
    v_writer := v_spec ->> 'writer';

    select * into v_fx from rv_conc where label = v_label;

    v_exp_inv := case v_spec ->> 'invitation'
      when 'original' then v_fx.invitation_id
      when 'fresh' then v_fx.fresh_invitation_id
      else null
    end;

    v_call := pg_catalog.format(
      'select public.reconcile_organization_onboarding_invite_intent('
      || '%L::uuid, %L::uuid)::text',
      v_fx.organization_id, v_fx.intent_id
    );
    v_claims := pg_catalog.json_build_object(
      'sub', v_fx.owner_id::text, 'role', 'authenticated'
    )::text;

    select * into v_before from rv_side_effects;

    perform dblink_connect('rv_sess_a', v_conn);
    perform dblink_connect('rv_sess_b', v_conn);

    select r.p into v_pid_a
    from dblink('rv_sess_a', 'select pg_catalog.pg_backend_pid()') as r(p integer);
    select r.p into v_pid_b
    from dblink('rv_sess_b', 'select pg_catalog.pg_backend_pid()') as r(p integer);

    if v_pid_a = v_pid_b
      or v_pid_a = pg_catalog.pg_backend_pid()
      or v_pid_b = pg_catalog.pg_backend_pid() then
      raise exception
        'RV-CONC[%]: the sessions are not distinct backends (a=% b=% self=%)',
        v_label, v_pid_a, v_pid_b, pg_catalog.pg_backend_pid();
    end if;

    update rv_conc set pid_a = v_pid_a, pid_b = v_pid_b where label = v_label;

    perform dblink_exec('rv_sess_a', 'begin');
    perform dblink_exec('rv_sess_b', 'begin');

    foreach v_item in array array['rv_sess_a', 'rv_sess_b'] loop
      perform dblink_exec(
        v_item,
        pg_catalog.format('set local request.jwt.claims to %L', v_claims)
      );
      perform dblink_exec(
        v_item,
        pg_catalog.format(
          'set local request.jwt.claim.sub to %L', v_fx.owner_id::text
        )
      );
    end loop;

    -- Session A enters the governed advisory namespace and does the work.
    select r.j::jsonb into v_a from dblink('rv_sess_a', v_call) as r(j text);

    if not exists (
      select 1
      from pg_catalog.pg_locks as l
      where l.locktype = 'advisory'
        and l.classid = 872004
        and l.objid::bigint = v_fx.lock_key
        and l.objsubid = 2
        and l.granted
        and l.pid = v_pid_a
    ) then
      raise exception
        'RV-CONC[%]: Session A does not hold advisory 872004/%',
        v_label, v_fx.lock_key;
    end if;

    -- Session B asks for exactly the same organization, asynchronously so the
    -- controlling session stays free to observe the wait.
    perform dblink_send_query('rv_sess_b', v_call);

    v_started := pg_catalog.clock_timestamp();
    v_waiters := 0;
    for v_i in 1 .. 750 loop
      select pg_catalog.count(*)::integer
      into v_waiters
      from pg_catalog.pg_locks as l
      where l.locktype = 'advisory'
        and l.classid = 872004
        and l.objid::bigint = v_fx.lock_key
        and l.objsubid = 2
        and not l.granted
        and l.pid = v_pid_b;
      exit when v_waiters > 0;
      perform pg_catalog.pg_sleep(0.02);
    end loop;
    v_waited := pg_catalog.clock_timestamp() - v_started;

    if v_waiters < 1 then
      raise exception
        'RV-CONC[%]: Session B was never observed waiting on advisory '
        '872004/% within %', v_label, v_fx.lock_key, v_waited;
    end if;

    if dblink_is_busy('rv_sess_b') <> 1 then
      raise exception
        'RV-CONC[%]: Session B is not blocked while A holds the namespace',
        v_label;
    end if;

    -- Nothing has been decided twice while B is parked.
    select pg_catalog.count(*) into v_n
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_fx.organization_id;
    if v_n <> 1 then
      raise exception
        'RV-CONC[%]: % authoritative rows exist mid-race', v_label, v_n;
    end if;

    -- Release Session A through this scenario's required verb, then prove B
    -- resumes rather than being starved.
    v_started := pg_catalog.clock_timestamp();
    perform dblink_exec('rv_sess_a', v_release);

    select r.j::jsonb into v_b
    from dblink_get_result('rv_sess_b') as r(j text);
    perform * from dblink_get_result('rv_sess_b') as r(j text);
    v_resumed := pg_catalog.clock_timestamp() - v_started;

    if dblink_is_busy('rv_sess_b') <> 0 then
      raise exception
        'RV-CONC[%]: Session B never resumed after A released', v_label;
    end if;

    if v_b is null then
      raise exception
        'RV-CONC[%]: Session B returned no governed result after resuming',
        v_label;
    end if;

    perform dblink_exec('rv_sess_b', 'commit');
    perform dblink_disconnect('rv_sess_a');
    perform dblink_disconnect('rv_sess_b');

    update rv_conc set waited = v_waited, resumed = v_resumed
    where label = v_label;

    -- ---- final committed state -------------------------------------------
    v_win := case v_writer when 'a' then v_a else v_b end;

    select r.* into v_row
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_fx.organization_id
      and r.intent_id = v_fx.intent_id;

    select r.* into v_run
    from public.organization_onboarding_completion_runs as r
    where r.organization_id = v_fx.organization_id;

    if v_row.result_code <> (v_spec ->> 'code')
      or v_row.evidence_kind <> (v_spec ->> 'evidence')
      or v_row.invitation_id is distinct from v_exp_inv then
      raise exception
        'RV-CONC[%]: the committed decision is % / % / % instead of % / % / %',
        v_label, v_row.result_code, v_row.evidence_kind, v_row.invitation_id,
        v_spec ->> 'code', v_spec ->> 'evidence', v_exp_inv;
    end if;

    if v_run.status <> (v_spec ->> 'run_status')
      or v_run.ready_for_cutover_at <> v_fx.ready_at then
      raise exception
        'RV-CONC[%]: the committed run is % with readiness % instead of % '
        'with readiness %', v_label, v_run.status, v_run.ready_for_cutover_at,
        v_spec ->> 'run_status', v_fx.ready_at;
    end if;

    -- Exactly one effective transition: the surviving row is the version the
    -- winning session wrote, and no second write followed it.
    if v_row.updated_at <> (v_win #>> '{result,updated_at}')::timestamptz then
      raise exception
        'RV-CONC[%]: the committed row version % is not the one session % '
        'wrote (%)', v_label, v_row.updated_at, v_writer,
        v_win #>> '{result,updated_at}';
    end if;

    if v_release = 'commit'
      and (v_a #>> '{result,updated_at}')::timestamptz
        <> (v_b #>> '{result,updated_at}')::timestamptz then
      raise exception
        'RV-CONC[%]: the waiting session produced a second conversion (% vs %)',
        v_label, v_a #>> '{result,updated_at}',
        v_b #>> '{result,updated_at}';
    end if;

    if v_b #>> '{result,result_code}' <> (v_spec ->> 'code')
      or v_b #>> '{result,evidence_kind}' <> (v_spec ->> 'evidence') then
      raise exception
        'RV-CONC[%]: the resumed session disagreed with the committed '
        'decision: %', v_label, v_b;
    end if;

    -- Attempt provenance is never touched by reconciliation, under contention
    -- or otherwise.
    if v_row.attempt_count <> v_fx.attempt_count
      or v_row.last_attempt_at <> v_fx.last_attempt_at then
      raise exception
        'RV-CONC[%]: contention rewrote the attempt provenance % / % into '
        '% / %', v_label, v_fx.attempt_count, v_fx.last_attempt_at,
        v_row.attempt_count, v_row.last_attempt_at;
    end if;

    -- No duplicate or conflicting authority anywhere in the organization.
    select pg_catalog.count(*) into v_n
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = v_fx.organization_id;
    if v_n <> 1 then
      raise exception
        'RV-CONC[%]: % authoritative rows survived the race', v_label, v_n;
    end if;

    select pg_catalog.count(*) into v_n
    from public.organization_onboarding_completion_runs as r
    where r.organization_id = v_fx.organization_id;
    if v_n <> 1 then
      raise exception
        'RV-CONC[%]: % completion runs survived the race', v_label, v_n;
    end if;

    -- No delivery, token, event or rate-limit side effect from either session.
    select * into v_after from rv_side_effects;
    if v_after.fingerprint <> v_before.fingerprint
      or v_after.n_invitations <> v_before.n_invitations
      or v_after.n_events <> v_before.n_events
      or v_after.n_deliveries <> v_before.n_deliveries
      or v_after.n_rate_rows <> v_before.n_rate_rows
      or v_after.n_rate_attempts <> v_before.n_rate_attempts
      or v_after.n_members <> v_before.n_members
      or v_after.n_results <> v_before.n_results
      or v_after.n_runs <> v_before.n_runs then
      raise exception
        'RV-CONC[%]: the race produced an invitation, resend, status mutation, '
        'token, delivery attempt, event, rate-limit consumption or membership '
        'change', v_label;
    end if;

    -- Both sessions and both advisory locks are gone.
    for v_i in 1 .. 250 loop
      select pg_catalog.count(*)::integer into v_n
      from pg_catalog.pg_stat_activity as a
      where a.pid in (v_pid_a, v_pid_b);
      exit when v_n = 0;
      perform pg_catalog.pg_sleep(0.02);
    end loop;

    if v_n <> 0 then
      raise exception
        'RV-CONC[%]: % test backend(s) survived the scenario', v_label, v_n;
    end if;

    if exists (
      select 1
      from pg_catalog.pg_locks as l
      where l.locktype = 'advisory'
        and l.classid = 872004
        and l.objid::bigint = v_fx.lock_key
    ) then
      raise exception
        'RV-CONC[%]: an advisory lock on 872004/% survived the scenario',
        v_label, v_fx.lock_key;
    end if;

    v_scenarios := v_scenarios + 1;

    raise notice
      'PHASE 9 scenario % PASS: sessions %/% contended on 872004/%, B waited '
      '%, resumed % after A %, one effective transition to % / %',
      v_label, v_pid_a, v_pid_b, v_fx.lock_key, v_waited, v_resumed,
      v_release, v_row.result_code, v_row.evidence_kind;
  end loop;

  if v_scenarios
    <> (select value from rv_evidence where metric = 'expected_concurrency_scenarios')
    then
    raise exception
      'RV-CONC: % scenarios executed against the pinned contract of %',
      v_scenarios,
      (select value from rv_evidence
       where metric = 'expected_concurrency_scenarios');
  end if;

  if pg_catalog.array_length(
    coalesce(dblink_get_connections(), array[]::text[]), 1
  ) is not null then
    raise exception 'RV-CONC: a dblink session was left open';
  end if;

  raise notice 'PHASE 9 complete: % genuine two-session races', v_scenarios;
end;
$conc_races$;

-- ---------------------------------------------------------------------------
-- Cleanup and measured zero-residue verification
-- ---------------------------------------------------------------------------
-- Every identifier below is resolved from this run's own ledger. There is no
-- wildcard drop, no unresolved database name and no cross-organization delete.

do $conc_cleanup$
declare
  v_base rv_baseline%rowtype;
  v_now rv_baseline%rowtype;
  v_item text;
  v_conns text[];
  v_n integer;
begin
  v_conns := coalesce(dblink_get_connections(), array[]::text[]);
  foreach v_item in array v_conns loop
    perform dblink_disconnect(v_item);
  end loop;

  -- Explicit dependency order. Several governed references are RESTRICT
  -- rather than CASCADE, so nothing here relies on cascade behavior and no
  -- constraint or trigger is disabled to make the delete succeed.
  delete from private.organization_invitation_delivery_attempts as d
  where d.invitation_id in (
    select i.id
    from public.organization_invitations as i
    where i.organization_id in (select c.organization_id from rv_conc as c)
  );

  delete from private.organization_invitation_mutation_rate_limits as rl
  where rl.organization_id in (select c.organization_id from rv_conc as c);

  delete from public.organization_onboarding_invitation_results as r
  where r.organization_id in (select c.organization_id from rv_conc as c);

  delete from public.organization_onboarding_completion_runs as r
  where r.organization_id in (select c.organization_id from rv_conc as c);

  delete from public.organization_invitation_events as e
  where e.invitation_id in (
    select i.id
    from public.organization_invitations as i
    where i.organization_id in (select c.organization_id from rv_conc as c)
  );

  delete from public.organization_invitations as i
  where i.organization_id in (select c.organization_id from rv_conc as c);

  delete from public.organization_onboarding_team_invite_intents as t
  where t.organization_id in (select c.organization_id from rv_conc as c);

  delete from public.organization_context_assignments as a
  where a.organization_id in (select c.organization_id from rv_conc as c);

  delete from public.organization_business_activities as b
  where b.organization_id in (select c.organization_id from rv_conc as c);

  delete from public.organization_members as m
  where m.organization_id in (select c.organization_id from rv_conc as c);

  delete from public.organizations as o
  where o.id in (select c.organization_id from rv_conc as c);

  delete from auth.users as u
  where u.email like 'rv-%@example.test';

  select * into v_base from rv_baseline;
  select * into v_now from rv_side_effects;

  if v_now.n_orgs <> v_base.n_orgs
    or v_now.n_users <> v_base.n_users
    or v_now.n_profiles <> v_base.n_profiles
    or v_now.n_members <> v_base.n_members
    or v_now.n_intents <> v_base.n_intents
    or v_now.n_activities <> v_base.n_activities
    or v_now.n_assignments <> v_base.n_assignments
    or v_now.n_invitations <> v_base.n_invitations
    or v_now.n_events <> v_base.n_events
    or v_now.n_deliveries <> v_base.n_deliveries
    or v_now.n_rate_rows <> v_base.n_rate_rows
    or v_now.n_rate_attempts <> v_base.n_rate_attempts
    or v_now.n_results <> v_base.n_results
    or v_now.n_runs <> v_base.n_runs
    or v_now.fingerprint <> v_base.fingerprint then
    raise exception
      'RV-RESIDUE: the estate was not restored. before=% after=%',
      pg_catalog.to_jsonb(v_base), pg_catalog.to_jsonb(v_now);
  end if;

  select pg_catalog.count(*)::integer into v_n
  from public.organizations as o
  where o.slug like 'zyntixai-rv-%';
  if v_n <> 0 then
    raise exception
      'RV-RESIDUE: % zyntixai-rv fixture organizations remain', v_n;
  end if;

  select pg_catalog.count(*)::integer into v_n
  from public.profiles as p
  where p.display_name like 'ZyntixAI RV Synthetic%';
  if v_n <> 0 then
    raise exception
      'RV-RESIDUE: % ZyntixAI RV Synthetic profiles remain', v_n;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_locks as l
    where l.locktype = 'advisory'
      and l.classid = 872004
      and l.objid::bigint in (select c.lock_key from rv_conc as c)
  ) then
    raise exception 'RV-RESIDUE: an advisory lock on 872004 remains held';
  end if;

  select pg_catalog.count(*)::integer into v_n
  from pg_catalog.pg_stat_activity as a
  where a.pid in (
    select c.pid_a from rv_conc as c
    union all
    select c.pid_b from rv_conc as c
  );
  if v_n <> 0 then
    raise exception 'RV-RESIDUE: % concurrency backend(s) remain', v_n;
  end if;

  if pg_catalog.array_length(
    coalesce(dblink_get_connections(), array[]::text[]), 1
  ) is not null then
    raise exception 'RV-RESIDUE: a dblink session remains open';
  end if;

  raise notice
    'CLEANUP PASS: committed estate deleted; every count and fingerprint '
    'restored to the pre-test baseline; no advisory lock, backend or dblink '
    'session remains';
end;
$conc_cleanup$;

-- ===========================================================================
-- TERMINAL VERDICT
-- ===========================================================================

do $verdict$
declare
  v_total bigint;
  v_scenarios bigint;
begin
  select value into v_total from rv_evidence where metric = 'expected_total';
  select value into v_scenarios from rv_evidence
    where metric = 'expected_concurrency_scenarios';

  raise notice ' ';
  raise notice
    'PASS - ENG-ONB-1H-P0-RV-EVIDENCE onboarding completion authority '
    'runtime verification: % single-session checks and % genuine two-session '
    'races passed against clone "%"; ENG-ONB-1H-P0-A and ENG-ONB-1H-P0-B4 '
    'runtime behavior confirmed; zero residue.',
    v_total, v_scenarios, pg_catalog.current_database();
end;
$verdict$;

-- Explicitly release the session-local ledger rather than relying on session
-- teardown, so an interactive psql session is left clean as well.
drop table if exists rv_conc;
drop table if exists rv_baseline;
drop view if exists rv_side_effects;
drop table if exists rv_evidence;
