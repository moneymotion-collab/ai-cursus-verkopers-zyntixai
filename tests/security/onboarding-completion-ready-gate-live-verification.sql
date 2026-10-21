-- ENG-ONB-1H-P1-C-R1
-- Local-only runtime verification that complete_organization_v2_onboarding
-- refuses without current Ready authority and completes atomically when Ready.
--
-- No credentials, tokens, connection strings, or real email addresses.
-- Synthetic identities use @example.test. Two-session races use dblink to the
-- current local database as the current superuser, with no password.
--
-- Exact invocation (disposable clone only):
--
--   CLONE=zyntixai_onb_p1c_r1_<suffix>
--   psql -U supabase_admin -d postgres -c "create database $CLONE"
--   pg_dump -U postgres -d postgres -Fc -f /tmp/p1cr1-clone-src.dump
--   pg_restore -U postgres --no-owner --no-acl -d "$CLONE" /tmp/p1cr1-clone-src.dump
--   psql -U supabase_admin -d "$CLONE" -c "create extension if not exists dblink"
--   psql -U supabase_admin -d "$CLONE" \
--     -f tests/security/onboarding-completion-ready-gate-live-verification.sql
--   psql -U supabase_admin -d postgres -c "drop database $CLONE"
--
-- Production, linked Supabase, and the primary local postgres database are
-- refused by Guard 1. Nested PL/pgSQL routines are not used: helpers live in
-- pg_temp for this session only.

\set ON_ERROR_STOP on

create extension if not exists dblink;

create temporary table p1cr1_evidence (
  metric text primary key,
  value bigint not null
);

insert into p1cr1_evidence (metric, value) values
  ('expected_catalog', 13),
  ('expected_refuse', 15),
  ('expected_success', 5),
  ('expected_clock', 1),
  ('expected_atomic', 2),
  ('expected_side', 4),
  ('expected_concurrency_scenarios', 8);

-- ===========================================================================
-- GUARD 1
-- ===========================================================================

do $guard$
declare
  v_db text := pg_catalog.current_database();
  v_prefix text := 'zyntixai_onb_p1c_r1_';
  v_item text;
  v_n integer;
begin
  if v_db !~ ('^' || v_prefix || '[a-z0-9_]{1,40}$') then
    raise exception
      'BLOCKED - ENG-ONB-1H-P1-C-R1 refuses database "%". This artifact runs only '
      'in a disposable local clone matching ^%. Production and the primary '
      'local postgres database are never authorized.',
      v_db, v_prefix;
  end if;

  if v_db = 'postgres' then
    raise exception 'BLOCKED - the primary local database is never authorized';
  end if;

  if pg_catalog.pg_is_in_recovery() then
    raise exception 'BLOCKED - database is in recovery';
  end if;

  if pg_catalog.inet_server_addr() is not null
    and pg_catalog.inet_server_addr() not in ('127.0.0.1'::inet, '::1'::inet)
  then
    raise exception
      'BLOCKED - non-local server address %', pg_catalog.inet_server_addr();
  end if;

  if pg_catalog.current_setting('is_superuser') <> 'on' then
    raise exception 'BLOCKED - local superuser is required';
  end if;

  foreach v_item in array array[
    '20260907140829', '20260908111356', '20260908131955', '20260911144302'
  ] loop
    if not exists (
      select 1 from supabase_migrations.schema_migrations as m
      where m.version = v_item
    ) then
      raise exception 'BLOCKED - governed migration % is not applied', v_item;
    end if;
  end loop;

  if to_regprocedure('public.complete_organization_v2_onboarding(uuid)') is null then
    raise exception 'BLOCKED - complete_organization_v2_onboarding(uuid) is absent';
  end if;

  if not exists (
    select 1 from pg_catalog.pg_extension as e where e.extname = 'dblink'
  ) then
    raise exception 'BLOCKED - dblink is not installed in this disposable clone';
  end if;

  select pg_catalog.count(*)::integer into v_n
  from public.organizations as o
  where o.slug like 'zyntixai-p1cr1-%';
  if v_n <> 0 then
    raise exception
      'BLOCKED - % pre-existing zyntixai-p1cr1 fixture organizations present', v_n;
  end if;

  raise notice 'GUARD 1 PASS: disposable clone "%"', v_db;
end;
$guard$;

-- Clone restores used --no-acl, so replay the governed completion RPC grants
-- before catalog assertions. This does not change Production or the primary
-- local postgres database.
revoke all on function public.complete_organization_v2_onboarding(uuid) from public;
revoke all on function public.complete_organization_v2_onboarding(uuid) from anon;
grant execute on function public.complete_organization_v2_onboarding(uuid) to authenticated;

-- Session-local helpers. DO blocks cannot declare nested procedures here.
create function pg_temp.set_actor(p_user uuid)
returns void
language plpgsql
as $fn$
begin
  perform pg_catalog.set_config(
    'request.jwt.claims',
    pg_catalog.json_build_object('sub', p_user::text, 'role', 'authenticated')::text,
    true
  );
  perform pg_catalog.set_config('request.jwt.claim.sub', p_user::text, true);
end;
$fn$;

create function pg_temp.clear_actor()
returns void
language plpgsql
as $fn$
begin
  perform pg_catalog.set_config('request.jwt.claims', '', true);
  perform pg_catalog.set_config('request.jwt.claim.sub', '', true);
end;
$fn$;

create function pg_temp.complete_as(p_user uuid, p_org uuid)
returns jsonb
language plpgsql
as $fn$
declare
  v_res jsonb;
begin
  perform pg_temp.set_actor(p_user);
  execute 'set local role authenticated';
  v_res := public.complete_organization_v2_onboarding(p_org);
  execute 'reset role';
  return v_res;
exception
  when others then
    execute 'reset role';
    raise;
end;
$fn$;

create function pg_temp.seed_configured_org(p_org uuid, p_owner uuid, p_name text)
returns void
language plpgsql
as $fn$
declare
  v_activity uuid;
  v_member uuid;
  v_foundation uuid;
  v_version uuid;
begin
  select f.id into v_foundation
  from public.taxonomy_foundations as f
  where f.key = 'service' and f.lifecycle_status = 'active';

  select cv.id into v_version
  from public.context_packs as cp
  inner join public.context_pack_versions as cv
    on cv.pack_id = cp.id and cv.publication_status = 'published'
  inner join public.context_pack_readiness as cr
    on cr.version_id = cv.id
    and cr.readiness_status in ('context_ready', 'beta_supported', 'production_verified')
  where cp.pack_key = 'foundation.service' and cp.lifecycle_status = 'active'
  order by cv.version_number desc
  limit 1;

  insert into public.organizations (
    id, name, slug, created_by, onboarding_flow_version, team_size_band
  ) values (
    p_org, p_name,
    'zyntixai-p1cr1-' || pg_catalog.replace(p_org::text, '-', ''),
    p_owner, 2, '2_5'
  );

  insert into public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) values (p_org, p_owner, 'owner', 'active', pg_catalog.now())
  returning id into v_member;

  insert into public.organization_business_activities (
    organization_id, activity_key, display_name, status, is_primary,
    classification_kind, foundation_id
  ) values (
    p_org, 'primary_operating_model', 'Agency & Business Services',
    'active', true, 'foundation', v_foundation
  ) returning id into v_activity;

  insert into public.organization_context_assignments (
    organization_id, business_activity_id, context_pack_version_id, status,
    source, actor_user_id, actor_member_id, reason
  ) values (
    p_org, v_activity, v_version, 'active', 'onboarding',
    p_owner, v_member, 'ENG-ONB-1H-P1-C-R1 synthetic'
  );
end;
$fn$;

create function pg_temp.seed_ready(p_org uuid, p_owner uuid, p_email text)
returns void
language plpgsql
as $fn$
declare
  v_intent uuid;
  v_res jsonb;
begin
  perform pg_temp.seed_configured_org(p_org, p_owner, 'ZyntixAI P1C-R1 conc');
  perform pg_temp.set_actor(p_owner);
  v_res := public.create_organization_onboarding_team_invite_intent(p_org, p_email, 'staff');
  v_intent := (v_res #>> '{intent,id}')::uuid;
  v_res := public.mark_organization_onboarding_setup_ready(p_org);
  perform public.ensure_organization_onboarding_completion_run(p_org);
  v_res := public.execute_organization_onboarding_invite_intent(p_org, v_intent);
  if v_res #>> '{result,result_code}' <> 'success' then
    raise exception 'P1C-R1-CONC fixture execute failed: %', v_res;
  end if;
end;
$fn$;

create function pg_temp.dblink_take_json(p_conn text)
returns jsonb
language plpgsql
as $fn$
declare
  v_res jsonb;
begin
  select r.j::jsonb into v_res from dblink_get_result(p_conn) as r(j text);
  perform * from dblink_get_result(p_conn) as r(j text);
  return v_res;
end;
$fn$;

create function pg_temp.wait_advisory_waiter(p_pid integer, p_classid integer, p_key integer)
returns integer
language plpgsql
as $fn$
declare
  v_waiters integer := 0;
  v_i integer;
begin
  for v_i in 1 .. 750 loop
    select pg_catalog.count(*)::integer into v_waiters
    from pg_catalog.pg_locks as l
    where l.locktype = 'advisory'
      and l.classid = p_classid
      and l.objid = p_key::oid
      and l.objsubid = 2
      and not l.granted
      and (p_pid is null or l.pid = p_pid);
    exit when v_waiters > 0;
    perform pg_catalog.pg_sleep(0.02);
  end loop;
  return v_waiters;
end;
$fn$;

create function pg_temp.disconnect_dblink()
returns void
language plpgsql
as $fn$
declare
  v_conns text[];
  v_item text;
begin
  v_conns := coalesce(dblink_get_connections(), array[]::text[]);
  foreach v_item in array v_conns loop
    perform dblink_disconnect(v_item);
  end loop;
end;
$fn$;

-- ===========================================================================
-- SECTION 1 — catalog, authenticated RPC matrix, clock expiry, atomicity
-- ===========================================================================

begin;

do $section1$
declare
  n_catalog integer := 0;
  n_refuse integer := 0;
  n_success integer := 0;
  n_clock integer := 0;
  n_atomic integer := 0;
  n_side integer := 0;
  v_n integer;
  v_oid oid;
  v_fn_owner text;
  v_definer boolean;
  v_config text;
  v_acl text;
  v_args text;
  v_result text;
  v_foundation uuid;
  v_owner uuid := '11111111-1111-4111-8111-111111111111';
  v_staff uuid := '22222222-2222-4222-8222-222222222222';
  v_outsider uuid := '33333333-3333-4333-8333-333333333333';
  v_owner_b uuid := '44444444-4444-4444-8444-444444444444';
  v_member uuid := '55555555-5555-4555-8555-555555555555';
  v_collision uuid := '66666666-6666-4666-8666-666666666666';
  v_org uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  v_org_b uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
  v_org_zero uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';
  v_org_absent uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4';
  v_org_setup uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5';
  v_org_clock uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6';
  v_org_atomic uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa7';
  v_org_mix uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa8';
  v_org_member uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa9';
  v_org_foreign uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa0a';
  v_org_unrelated uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa0b';
  v_intent uuid;
  v_org_intent uuid;
  v_intent_b uuid;
  v_inv uuid;
  v_res jsonb;
  v_run public.organization_onboarding_completion_runs%rowtype;
  v_org_row public.organizations%rowtype;
  v_before_inv integer;
  v_before_del integer;
  v_before_rl integer;
  v_completed_at timestamptz;
  v_ready_at timestamptz;
  v_item text;
begin
  select p.oid,
         pg_catalog.pg_get_function_identity_arguments(p.oid),
         pg_catalog.pg_get_function_result(p.oid),
         pg_catalog.pg_get_userbyid(p.proowner),
         p.prosecdef,
         coalesce(pg_catalog.array_to_string(p.proconfig, ','), ''),
         coalesce(p.proacl::text, '')
    into v_oid, v_args, v_result, v_fn_owner, v_definer, v_config, v_acl
  from pg_catalog.pg_proc as p
  inner join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'complete_organization_v2_onboarding';

  select pg_catalog.count(*)::integer into v_n
  from pg_catalog.pg_proc as p
  inner join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'complete_organization_v2_onboarding';
  if v_n <> 1 then
    raise exception 'P1C-R1-CAT: % overloads', v_n;
  end if;
  n_catalog := n_catalog + 1;

  if v_args <> 'p_organization_id uuid' or v_result <> 'jsonb' then
    raise exception 'P1C-R1-CAT: signature drift % / %', v_args, v_result;
  end if;
  n_catalog := n_catalog + 1;

  if v_fn_owner <> 'postgres' or not v_definer or v_config <> 'search_path=""' then
    raise exception 'P1C-R1-CAT: owner/definer/search_path % % %', v_fn_owner, v_definer, v_config;
  end if;
  n_catalog := n_catalog + 3;

  if v_acl ~ '(^|,|\{)=X/' then
    raise exception 'P1C-R1-ACL: PUBLIC holds EXECUTE';
  end if;
  n_catalog := n_catalog + 1;

  if pg_catalog.has_function_privilege('anon', v_oid, 'EXECUTE') then
    raise exception 'P1C-R1-ACL: anon holds EXECUTE';
  end if;
  n_catalog := n_catalog + 1;

  if not pg_catalog.has_function_privilege('authenticated', v_oid, 'EXECUTE') then
    raise exception 'P1C-R1-ACL: authenticated lacks EXECUTE';
  end if;
  n_catalog := n_catalog + 1;

  if pg_catalog.has_column_privilege(
    'authenticated', 'public.organizations', 'onboarding_completed_at', 'UPDATE'
  ) then
    raise exception 'P1C-R1-ACL: authenticated can UPDATE onboarding_completed_at';
  end if;
  n_catalog := n_catalog + 1;

  select pg_catalog.count(*)::integer into v_n
  from pg_catalog.pg_proc as p
  inner join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname ~ '(batch|bulk)'
    and p.proname ~ '(onboarding|completion)';
  if v_n <> 0 then
    raise exception 'P1C-R1-CAT: batch/bulk completion RPC exists';
  end if;
  n_catalog := n_catalog + 1;

  if pg_catalog.pg_get_functiondef(v_oid) !~ '872004' then
    raise exception 'P1C-R1-CAT: live definition lost 872004';
  end if;
  n_catalog := n_catalog + 1;
  if pg_catalog.pg_get_functiondef(v_oid) !~ 'ready_for_cutover' then
    raise exception 'P1C-R1-CAT: live definition lost Ready validation';
  end if;
  n_catalog := n_catalog + 1;
  if pg_catalog.pg_get_functiondef(v_oid) !~ 'NOT_READY' then
    raise exception 'P1C-R1-CAT: live definition lost NOT_READY';
  end if;
  n_catalog := n_catalog + 1;

  select f.id into v_foundation
  from public.taxonomy_foundations as f
  where f.key = 'service' and f.lifecycle_status = 'active';
  if v_foundation is null then
    raise exception 'P1C-R1-FIXTURE: taxonomy seed absent';
  end if;

  foreach v_item in array array['owner', 'staff', 'outsider', 'owner-b', 'member', 'collision']
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      case v_item
        when 'owner' then v_owner
        when 'staff' then v_staff
        when 'outsider' then v_outsider
        when 'owner-b' then v_owner_b
        when 'member' then v_member
        else v_collision
      end,
      'authenticated', 'authenticated',
      'p1cr1-' || v_item || '@example.test', '',
      pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb, pg_catalog.now(), pg_catalog.now()
    );
    update public.profiles
    set display_name = 'ZyntixAI P1C-R1 ' || v_item
    where id = case v_item
      when 'owner' then v_owner
      when 'staff' then v_staff
      when 'outsider' then v_outsider
      when 'owner-b' then v_owner_b
      when 'member' then v_member
      else v_collision
    end;
  end loop;

  perform pg_temp.seed_configured_org(v_org, v_owner, 'ZyntixAI P1C-R1 primary');
  perform pg_temp.seed_configured_org(v_org_b, v_owner_b, 'ZyntixAI P1C-R1 foreign');
  perform pg_temp.seed_configured_org(v_org_zero, v_owner, 'ZyntixAI P1C-R1 zero');
  perform pg_temp.seed_configured_org(v_org_absent, v_owner, 'ZyntixAI P1C-R1 absent');
  perform pg_temp.seed_configured_org(v_org_setup, v_owner, 'ZyntixAI P1C-R1 setup');
  perform pg_temp.seed_configured_org(v_org_clock, v_owner, 'ZyntixAI P1C-R1 clock');
  perform pg_temp.seed_configured_org(v_org_atomic, v_owner, 'ZyntixAI P1C-R1 atomic');
  perform pg_temp.seed_configured_org(v_org_mix, v_owner, 'ZyntixAI P1C-R1 mix');
  perform pg_temp.seed_configured_org(v_org_member, v_owner, 'ZyntixAI P1C-R1 member');
  perform pg_temp.seed_configured_org(v_org_foreign, v_owner, 'ZyntixAI P1C-R1 foreign-ev');
  perform pg_temp.seed_configured_org(v_org_unrelated, v_owner, 'ZyntixAI P1C-R1 unrelated');

  insert into public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) values (v_org, v_staff, 'staff', 'active', pg_catalog.now());

  perform pg_temp.set_actor(v_owner);
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org, 'p1cr1-pending@example.test', 'staff'
  );
  v_org_intent := (v_res #>> '{intent,id}')::uuid;
  v_intent := v_org_intent;
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org_setup, 'p1cr1-setup-unexecuted@example.test', 'staff'
  );
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org_clock, 'p1cr1-clock@example.test', 'staff'
  );
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org_atomic, 'p1cr1-atomic@example.test', 'staff'
  );
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org_mix, 'p1cr1-mix-pending@example.test', 'staff'
  );
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org_mix, 'p1cr1-member@example.test', 'staff'
  );
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org_mix, 'p1cr1-collision@example.test', 'staff'
  );
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org_member, 'p1cr1-outsider@example.test', 'staff'
  );
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org_foreign, 'p1cr1-owner-b@example.test', 'staff'
  );
  v_res := public.create_organization_onboarding_team_invite_intent(
    v_org_unrelated, 'p1cr1-unrelated-intent@example.test', 'staff'
  );

  insert into public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) values
    (v_org_mix, v_member, 'viewer', 'active', pg_catalog.now()),
    (v_org_mix, v_collision, 'viewer', 'suspended', pg_catalog.now()),
    (v_org_member, v_outsider, 'viewer', 'active', pg_catalog.now()),
    (v_org_unrelated, v_collision, 'viewer', 'active', pg_catalog.now());

  foreach v_item in array array[
    v_org::text, v_org_zero::text, v_org_absent::text, v_org_setup::text,
    v_org_clock::text, v_org_atomic::text, v_org_mix::text,
    v_org_member::text, v_org_foreign::text, v_org_unrelated::text
  ] loop
    v_res := public.mark_organization_onboarding_setup_ready(v_item::uuid);
    if v_res ->> 'state' is distinct from 'ready' then
      raise exception 'P1C-R1-FIXTURE: Setup Ready failed for %: %', v_item, v_res;
    end if;
  end loop;

  perform public.ensure_organization_onboarding_completion_run(v_org);
  perform public.ensure_organization_onboarding_completion_run(v_org_zero);
  perform public.ensure_organization_onboarding_completion_run(v_org_setup);
  perform public.ensure_organization_onboarding_completion_run(v_org_clock);
  perform public.ensure_organization_onboarding_completion_run(v_org_atomic);
  perform public.ensure_organization_onboarding_completion_run(v_org_mix);
  perform public.ensure_organization_onboarding_completion_run(v_org_member);
  perform public.ensure_organization_onboarding_completion_run(v_org_foreign);
  perform public.ensure_organization_onboarding_completion_run(v_org_unrelated);

  v_res := public.execute_organization_onboarding_invite_intent(v_org, v_org_intent);
  if v_res #>> '{result,result_code}' <> 'success' then
    raise exception 'P1C-R1-FIXTURE: execute failed %', v_res;
  end if;
  v_inv := (v_res #>> '{result,invitation_id}')::uuid;

  select i.id into v_intent_b
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = v_org_clock;
  v_res := public.execute_organization_onboarding_invite_intent(v_org_clock, v_intent_b);
  v_res := public.execute_organization_onboarding_invite_intent(
    v_org_atomic,
    (select i.id from public.organization_onboarding_team_invite_intents as i
     where i.organization_id = v_org_atomic)
  );

  for v_intent in
    select i.id from public.organization_onboarding_team_invite_intents as i
    where i.organization_id in (v_org_mix, v_org_member)
  loop
    perform public.execute_organization_onboarding_invite_intent(
      (select i.organization_id from public.organization_onboarding_team_invite_intents as i
       where i.id = v_intent),
      v_intent
    );
  end loop;

  select count(*) into v_before_inv from public.organization_invitations;
  select count(*) into v_before_del from private.organization_invitation_delivery_attempts;
  select count(*) into v_before_rl from private.organization_invitation_mutation_rate_limits;

  perform pg_temp.clear_actor();
  execute 'set local role authenticated';
  v_res := public.complete_organization_v2_onboarding(v_org);
  execute 'reset role';
  if v_res ->> 'code' <> 'NOT_AUTHENTICATED' then
    raise exception 'P1C-R1-REFUSE unauthenticated: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  v_res := pg_temp.complete_as(v_staff, v_org);
  if v_res ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception 'P1C-R1-REFUSE non-Owner: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  v_res := pg_temp.complete_as(v_outsider, v_org);
  if v_res ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception 'P1C-R1-REFUSE outsider: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  v_res := pg_temp.complete_as(v_owner_b, v_org);
  if v_res ->> 'code' <> 'NOT_AUTHORIZED' then
    raise exception 'P1C-R1-REFUSE foreign Owner: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  v_res := pg_temp.complete_as(v_owner, v_org_absent);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE absent run: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  v_res := pg_temp.complete_as(v_owner, v_org_setup);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE setup_ready: %', v_res;
  end if;
  select status into v_item from public.organization_onboarding_completion_runs
    where organization_id = v_org_setup;
  if v_item <> 'setup_ready' then
    raise exception 'P1C-R1-REFUSE setup_ready mutated run to %', v_item;
  end if;
  n_refuse := n_refuse + 1;

  update public.organization_onboarding_completion_runs
  set status = 'inviting'
  where organization_id = v_org_setup;
  v_res := pg_temp.complete_as(v_owner, v_org_setup);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE inviting: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  update public.organization_onboarding_completion_runs
  set status = 'invite_partial'
  where organization_id = v_org_setup;
  v_res := pg_temp.complete_as(v_owner, v_org_setup);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE invite_partial: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  update public.organization_invitations
  set created_at = pg_catalog.now() - interval '2 days',
      expires_at = pg_catalog.now() - interval '1 second'
  where organization_id = v_org_clock and status = 'pending';
  update public.organization_onboarding_completion_runs
  set status = 'ready_for_cutover',
      ready_for_cutover_at = coalesce(ready_for_cutover_at, pg_catalog.now())
  where organization_id = v_org_clock;
  v_res := pg_temp.complete_as(v_owner, v_org_clock);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-CLOCK stored Ready after expiry: %', v_res;
  end if;
  select * into v_org_row from public.organizations where id = v_org_clock;
  if v_org_row.onboarding_completed_at is not null then
    raise exception 'P1C-R1-CLOCK completed the organization';
  end if;
  n_clock := n_clock + 1;
  n_refuse := n_refuse + 1;

  update public.organization_invitations
  set status = 'revoked', revoked_at = pg_catalog.now(), token_hash = null
  where id = v_inv;
  v_res := pg_temp.complete_as(v_owner, v_org);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE revoked: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  update public.organization_invitations
  set status = 'pending', revoked_at = null,
      token_hash = coalesce(token_hash, repeat('ab', 32)),
      expires_at = pg_catalog.now() + interval '7 days'
  where id = v_inv;
  perform pg_temp.set_actor(v_owner);
  v_res := public.reconcile_organization_onboarding_invite_intent(v_org, v_org_intent);

  update public.organization_invitations
  set status = 'expired', token_hash = null
  where id = v_inv;
  v_res := pg_temp.complete_as(v_owner, v_org);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE expired/historical: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  update public.organization_invitations
  set status = 'pending',
      token_hash = coalesce(token_hash, repeat('ab', 32)),
      expires_at = pg_catalog.now() + interval '7 days'
  where id = v_inv;
  perform pg_temp.set_actor(v_owner);
  v_res := public.reconcile_organization_onboarding_invite_intent(v_org, v_org_intent);

  update public.organization_invitations
  set status = 'accepted', accepted_at = pg_catalog.now(), token_hash = null
  where id = v_inv;
  v_res := pg_temp.complete_as(v_owner, v_org);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE accepted without membership: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  update public.organization_invitations
  set status = 'pending', accepted_at = null,
      token_hash = coalesce(token_hash, repeat('ab', 32)),
      expires_at = pg_catalog.now() + interval '7 days'
  where id = v_inv;
  perform pg_temp.set_actor(v_owner);
  v_res := public.reconcile_organization_onboarding_invite_intent(v_org, v_org_intent);

  delete from public.organization_onboarding_invitation_results
  where organization_id = v_org_setup;
  v_res := pg_temp.complete_as(v_owner, v_org_setup);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE missing result: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  v_res := pg_temp.complete_as(v_owner, v_org_foreign);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE foreign membership: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  v_res := pg_temp.complete_as(v_owner, v_org_unrelated);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-REFUSE unrelated membership: %', v_res;
  end if;
  n_refuse := n_refuse + 1;

  select ready_for_cutover_at into v_ready_at
  from public.organization_onboarding_completion_runs where organization_id = v_org;
  v_res := pg_temp.complete_as(v_owner, v_org);
  if v_res ->> 'ok' <> 'true' or v_res ->> 'state' <> 'completed' or (v_res ->> 'idempotent')::boolean then
    raise exception 'P1C-R1-SUCCESS pending invitation: %', v_res;
  end if;
  select * into v_org_row from public.organizations where id = v_org;
  select * into v_run from public.organization_onboarding_completion_runs where organization_id = v_org;
  if v_org_row.onboarding_completed_at is null
    or v_run.status <> 'completed'
    or v_run.completed_at is null
    or v_run.completed_at <> v_org_row.onboarding_completed_at
    or v_run.ready_for_cutover_at is distinct from v_ready_at
  then
    raise exception 'P1C-R1-SUCCESS incoherent completion';
  end if;
  v_completed_at := v_org_row.onboarding_completed_at;
  n_success := n_success + 1;

  v_res := pg_temp.complete_as(v_owner, v_org);
  if v_res ->> 'ok' <> 'true' or not (v_res ->> 'idempotent')::boolean then
    raise exception 'P1C-R1-SUCCESS idempotent: %', v_res;
  end if;
  select onboarding_completed_at into v_org_row.onboarding_completed_at
  from public.organizations where id = v_org;
  if v_org_row.onboarding_completed_at <> v_completed_at then
    raise exception 'P1C-R1-SUCCESS replay mutated organization timestamp';
  end if;
  select * into v_run from public.organization_onboarding_completion_runs where organization_id = v_org;
  if v_run.completed_at <> v_completed_at or v_run.ready_for_cutover_at is distinct from v_ready_at then
    raise exception 'P1C-R1-SUCCESS replay mutated run timestamps';
  end if;
  n_success := n_success + 1;

  v_res := pg_temp.complete_as(v_owner, v_org_zero);
  if v_res ->> 'ok' <> 'true' then
    raise exception 'P1C-R1-SUCCESS zero-intent: %', v_res;
  end if;
  n_success := n_success + 1;

  v_res := pg_temp.complete_as(v_owner, v_org_mix);
  if v_res ->> 'ok' <> 'true' then
    raise exception 'P1C-R1-SUCCESS mixed terminal: %', v_res;
  end if;
  n_success := n_success + 1;

  v_res := pg_temp.complete_as(v_owner, v_org_member);
  if v_res ->> 'ok' <> 'true' then
    raise exception 'P1C-R1-SUCCESS matching membership: %', v_res;
  end if;
  n_success := n_success + 1;

  update public.organization_onboarding_completion_runs
  set ready_for_cutover_at = pg_catalog.now() + interval '1 day'
  where organization_id = v_org_atomic;
  begin
    v_res := pg_temp.complete_as(v_owner, v_org_atomic);
    raise exception 'P1C-R1-ATOMIC expected exception, got %', v_res;
  exception
    when others then
      if sqlerrm like 'P1C-R1-ATOMIC expected exception%' then
        raise;
      end if;
  end;
  select onboarding_completed_at into v_org_row.onboarding_completed_at
  from public.organizations where id = v_org_atomic;
  select * into v_run from public.organization_onboarding_completion_runs
    where organization_id = v_org_atomic;
  if v_org_row.onboarding_completed_at is not null or v_run.status = 'completed' then
    raise exception 'P1C-R1-ATOMIC split state after forced failure';
  end if;
  n_atomic := n_atomic + 1;

  update public.organization_onboarding_completion_runs
  set ready_for_cutover_at = pg_catalog.now()
  where organization_id = v_org_atomic;
  v_res := pg_temp.complete_as(v_owner, v_org_atomic);
  if v_res ->> 'ok' <> 'true' then
    raise exception 'P1C-R1-ATOMIC coherent retry: %', v_res;
  end if;
  select o.onboarding_completed_at, r.completed_at, r.status
    into v_org_row.onboarding_completed_at, v_run.completed_at, v_run.status
  from public.organizations as o
  inner join public.organization_onboarding_completion_runs as r
    on r.organization_id = o.id
  where o.id = v_org_atomic;
  if v_run.status <> 'completed'
    or v_run.completed_at is distinct from v_org_row.onboarding_completed_at then
    raise exception 'P1C-R1-ATOMIC coherent retry split';
  end if;
  n_atomic := n_atomic + 1;

  if (select count(*) from public.organization_invitations) <> v_before_inv
    or (select count(*) from private.organization_invitation_delivery_attempts) <> v_before_del
    or (select count(*) from private.organization_invitation_mutation_rate_limits) <> v_before_rl
  then
    raise exception 'P1C-R1-SIDE completion created invitation/delivery/rate residue';
  end if;
  n_side := n_side + 4;

  if n_catalog <> 13 or n_refuse <> 15 or n_success <> 5 or n_clock <> 1
    or n_atomic <> 2 or n_side <> 4 then
    raise exception
      'P1C-R1-COUNT mismatch catalog=% refuse=% success=% clock=% atomic=% side=%',
      n_catalog, n_refuse, n_success, n_clock, n_atomic, n_side;
  end if;

  raise notice
    'SECTION 1 PASS: % catalog, % refusals, % successes, % clock, % atomic, % side-effect',
    n_catalog, n_refuse, n_success, n_clock, n_atomic, n_side;
end;
$section1$;

rollback;

-- ===========================================================================
-- SECTION 2 — genuine two-session concurrency (committed clone fixtures)
-- Seed commits first so the controller does not hold 872004 xact locks.
-- ===========================================================================

do $section2_seed$
declare
  v_owner uuid := '77777777-7777-4777-8777-777777777777';
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', v_owner, 'authenticated',
    'authenticated', 'p1cr1-conc-owner@example.test', '',
    pg_catalog.now(), '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, pg_catalog.now(), pg_catalog.now()
  );
  update public.profiles set display_name = 'ZyntixAI P1C-R1 conc' where id = v_owner;

  perform pg_temp.seed_ready('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'::uuid, v_owner, 'p1cr1-conc-1@example.test');
  perform pg_temp.seed_ready('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'::uuid, v_owner, 'p1cr1-conc-2@example.test');
  perform pg_temp.seed_ready('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3'::uuid, v_owner, 'p1cr1-conc-3@example.test');
  perform pg_temp.seed_ready('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4'::uuid, v_owner, 'p1cr1-conc-4@example.test');
  perform pg_temp.seed_ready('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5'::uuid, v_owner, 'p1cr1-conc-5@example.test');
  perform pg_temp.seed_ready('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6'::uuid, v_owner, 'p1cr1-conc-6@example.test');
  perform pg_temp.seed_ready('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7'::uuid, v_owner, 'p1cr1-conc-7@example.test');
  perform pg_temp.seed_ready('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8'::uuid, v_owner, 'p1cr1-conc-8@example.test');
  perform pg_temp.set_actor(v_owner);
  perform public.complete_organization_v2_onboarding('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8'::uuid);
  raise notice 'SECTION 2 seed committed';
end;
$section2_seed$;

do $section2$
declare
  v_conn text := 'dbname=' || pg_catalog.current_database() || ' user=' || current_user;
  v_owner uuid := '77777777-7777-4777-8777-777777777777';
  v_org uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
  v_org2 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  v_org3 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';
  v_org4 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4';
  v_org5 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5';
  v_org6 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6';
  v_org7 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb7';
  v_org8 uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb8';
  v_intent uuid;
  v_inv uuid;
  v_res jsonb;
  v_claims text;
  v_call text;
  v_pid_a integer;
  v_pid_b integer;
  v_waiters integer;
  v_a jsonb;
  v_b jsonb;
  v_lock integer;
  v_run public.organization_onboarding_completion_runs%rowtype;
  v_org_row public.organizations%rowtype;
  v_scenarios integer := 0;
  v_i integer;
  v_before_inv integer;
  v_after_inv integer;
  v_orgs uuid[];
begin
  perform pg_temp.disconnect_dblink();

  v_orgs := array[v_org, v_org2, v_org3, v_org4, v_org5, v_org6, v_org7, v_org8];
  v_claims := pg_catalog.json_build_object('sub', v_owner::text, 'role', 'authenticated')::text;
  v_lock := pg_catalog.hashtext(coalesce(v_org::text, ''));
  select count(*) into v_before_inv from public.organization_invitations;

  -- 1. Two simultaneous valid completions
  v_call := format(
    'select public.complete_organization_v2_onboarding(%L::uuid)::text', v_org
  );
  perform dblink_connect('p1c_a', v_conn);
  perform dblink_connect('p1c_b', v_conn);
  select r.p into v_pid_a from dblink('p1c_a', 'select pg_catalog.pg_backend_pid()') as r(p integer);
  select r.p into v_pid_b from dblink('p1c_b', 'select pg_catalog.pg_backend_pid()') as r(p integer);
  if v_pid_a = v_pid_b or v_pid_a = pg_backend_pid() or v_pid_b = pg_backend_pid() then
    raise exception 'P1C-R1-CONC sessions are not distinct';
  end if;
  perform dblink_exec('p1c_a', 'begin');
  perform dblink_exec('p1c_b', 'begin');
  perform dblink_exec('p1c_a', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_a', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_a', 'set local role authenticated');
  perform dblink_exec('p1c_b', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_b', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_b', 'set local role authenticated');
  select r.j::jsonb into v_a from dblink('p1c_a', v_call) as r(j text);
  perform dblink_send_query('p1c_b', v_call);
  v_waiters := pg_temp.wait_advisory_waiter(v_pid_b, 872002, v_lock);
  if v_waiters = 0 then
    raise exception 'P1C-R1-CONC[two-complete]: B did not wait on 872002';
  end if;
  perform dblink_exec('p1c_a', 'commit');
  v_b := pg_temp.dblink_take_json('p1c_b');
  perform dblink_exec('p1c_b', 'commit');
  perform pg_temp.disconnect_dblink();
  select * into v_org_row from public.organizations where id = v_org;
  select * into v_run from public.organization_onboarding_completion_runs where organization_id = v_org;
  if v_org_row.onboarding_completed_at is null or v_run.status <> 'completed'
    or v_run.completed_at is distinct from v_org_row.onboarding_completed_at then
    raise exception 'P1C-R1-CONC[two-complete] split state';
  end if;
  if not ((v_a ->> 'ok')::boolean) then
    raise exception 'P1C-R1-CONC[two-complete] A failed: %', v_a;
  end if;
  if v_b ->> 'ok' <> 'true' or v_b ->> 'idempotent' <> 'true' then
    raise exception 'P1C-R1-CONC[two-complete] B not idempotent: %', v_b;
  end if;
  v_scenarios := v_scenarios + 1;
  raise notice 'PHASE 9 scenario two-complete PASS: A=% B waited then idempotent', v_a ->> 'idempotent';

  -- 2. Reconcile/downgrade commits before completion
  select i.id, r.invitation_id into v_intent, v_inv
  from public.organization_onboarding_invitation_results as r
  inner join public.organization_onboarding_team_invite_intents as i
    on i.organization_id = r.organization_id and i.id = r.intent_id
  where r.organization_id = v_org2;
  update public.organization_invitations
  set status = 'revoked', revoked_at = pg_catalog.now(), token_hash = null
  where id = v_inv;
  perform pg_temp.set_actor(v_owner);
  v_res := public.reconcile_organization_onboarding_invite_intent(v_org2, v_intent);
  v_res := public.complete_organization_v2_onboarding(v_org2);
  if v_res ->> 'code' <> 'NOT_READY' then
    raise exception 'P1C-R1-CONC[reconcile-before-complete]: %', v_res;
  end if;
  v_scenarios := v_scenarios + 1;

  -- 3. Completion holds 872004 while reconcile waits
  v_lock := pg_catalog.hashtext(coalesce(v_org3::text, ''));
  select i.id into v_intent from public.organization_onboarding_team_invite_intents as i
    where i.organization_id = v_org3;
  v_call := format(
    'select public.complete_organization_v2_onboarding(%L::uuid)::text', v_org3
  );
  perform dblink_connect('p1c_a', v_conn);
  perform dblink_connect('p1c_b', v_conn);
  select r.p into v_pid_b from dblink('p1c_b', 'select pg_catalog.pg_backend_pid()') as r(p integer);
  perform dblink_exec('p1c_a', 'begin');
  perform dblink_exec('p1c_b', 'begin');
  perform dblink_exec('p1c_a', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_a', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_a', 'set local role authenticated');
  perform dblink_exec('p1c_b', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_b', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_b', 'set local role authenticated');
  select r.j::jsonb into v_a from dblink('p1c_a', v_call) as r(j text);
  perform dblink_send_query(
    'p1c_b',
    format(
      'select public.reconcile_organization_onboarding_invite_intent(%L::uuid, %L::uuid)::text',
      v_org3, v_intent
    )
  );
  v_waiters := pg_temp.wait_advisory_waiter(v_pid_b, 872004, v_lock);
  if v_waiters = 0 then
    raise exception 'P1C-R1-CONC[complete-holds]: reconcile did not wait';
  end if;
  perform dblink_exec('p1c_a', 'commit');
  v_b := pg_temp.dblink_take_json('p1c_b');
  perform dblink_exec('p1c_b', 'commit');
  perform pg_temp.disconnect_dblink();
  select * into v_run from public.organization_onboarding_completion_runs where organization_id = v_org3;
  if v_run.status <> 'completed' then
    raise exception 'P1C-R1-CONC[complete-holds] run=%', v_run.status;
  end if;
  v_scenarios := v_scenarios + 1;

  -- 4. Reconcile holds 872004 while completion waits
  v_lock := pg_catalog.hashtext(coalesce(v_org4::text, ''));
  select i.id into v_intent from public.organization_onboarding_team_invite_intents as i
    where i.organization_id = v_org4;
  perform dblink_connect('p1c_a', v_conn);
  perform dblink_connect('p1c_b', v_conn);
  select r.p into v_pid_b from dblink('p1c_b', 'select pg_catalog.pg_backend_pid()') as r(p integer);
  perform dblink_exec('p1c_a', 'begin');
  perform dblink_exec('p1c_b', 'begin');
  perform dblink_exec('p1c_a', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_a', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_a', 'set local role authenticated');
  perform dblink_exec('p1c_b', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_b', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_b', 'set local role authenticated');
  select r.j::jsonb into v_a from dblink(
    'p1c_a',
    format(
      'select public.reconcile_organization_onboarding_invite_intent(%L::uuid, %L::uuid)::text',
      v_org4, v_intent
    )
  ) as r(j text);
  perform dblink_send_query(
    'p1c_b',
    format('select public.complete_organization_v2_onboarding(%L::uuid)::text', v_org4)
  );
  v_waiters := pg_temp.wait_advisory_waiter(v_pid_b, 872004, v_lock);
  if v_waiters = 0 then
    raise exception 'P1C-R1-CONC[reconcile-holds]: complete did not wait';
  end if;
  perform dblink_exec('p1c_a', 'commit');
  v_b := pg_temp.dblink_take_json('p1c_b');
  perform dblink_exec('p1c_b', 'commit');
  perform pg_temp.disconnect_dblink();
  select * into v_run from public.organization_onboarding_completion_runs where organization_id = v_org4;
  if v_run.status <> 'completed' then
    raise exception 'P1C-R1-CONC[reconcile-holds] run=%', v_run.status;
  end if;
  v_scenarios := v_scenarios + 1;

  -- 5. Invitation revocation races completion (row lock, not 872004)
  select r.invitation_id into v_inv
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = v_org5;
  perform dblink_connect('p1c_a', v_conn);
  perform dblink_connect('p1c_b', v_conn);
  perform dblink_exec('p1c_a', 'begin');
  perform dblink_exec('p1c_b', 'begin');
  perform dblink_exec('p1c_a', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_a', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_a', 'set local role authenticated');
  perform dblink_exec('p1c_b', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_b', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_b', 'set local role authenticated');
  select r.j::jsonb into v_a from dblink(
    'p1c_a',
    format('select public.complete_organization_v2_onboarding(%L::uuid)::text', v_org5)
  ) as r(j text);
  perform dblink_send_query(
    'p1c_b',
    format(
      'select result_code from public.revoke_organization_invitation(%L::uuid, %L::uuid)',
      v_org5, v_inv
    )
  );
  perform pg_catalog.pg_sleep(0.2);
  perform dblink_exec('p1c_a', 'commit');
  begin
    perform * from dblink_get_result('p1c_b') as r(j text);
    perform * from dblink_get_result('p1c_b') as r(j text);
  exception
    when others then
      null;
  end;
  perform dblink_exec('p1c_b', 'commit');
  perform pg_temp.disconnect_dblink();
  select * into v_org_row from public.organizations where id = v_org5;
  if v_org_row.onboarding_completed_at is null then
    raise exception 'P1C-R1-CONC[invite-race] did not complete';
  end if;
  v_scenarios := v_scenarios + 1;

  -- 6. Membership status change races completion
  v_lock := pg_catalog.hashtext(coalesce(v_org6::text, ''));
  perform dblink_connect('p1c_a', v_conn);
  perform dblink_connect('p1c_b', v_conn);
  perform dblink_exec('p1c_a', 'begin');
  perform dblink_exec('p1c_b', 'begin');
  perform dblink_exec('p1c_a', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_a', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_a', 'set local role authenticated');
  select r.j::jsonb into v_a from dblink(
    'p1c_a',
    format('select public.complete_organization_v2_onboarding(%L::uuid)::text', v_org6)
  ) as r(j text);
  perform dblink_send_query(
    'p1c_b',
    format(
      'update public.organization_members set status = %L where organization_id = %L::uuid and role = %L',
      'suspended', v_org6, 'owner'
    )
  );
  perform pg_catalog.pg_sleep(0.2);
  perform dblink_exec('p1c_a', 'commit');
  begin
    perform * from dblink_get_result('p1c_b') as r(j text);
    perform * from dblink_get_result('p1c_b') as r(j text);
  exception
    when others then
      null;
  end;
  perform dblink_exec('p1c_b', 'rollback');
  perform pg_temp.disconnect_dblink();
  select * into v_org_row from public.organizations where id = v_org6;
  if v_org_row.onboarding_completed_at is null then
    raise exception 'P1C-R1-CONC[member-race] did not complete';
  end if;
  v_scenarios := v_scenarios + 1;

  -- 7. Controlled failure after org write, before run write
  update public.organization_onboarding_completion_runs
  set ready_for_cutover_at = pg_catalog.now() + interval '2 days'
  where organization_id = v_org7;
  begin
    v_res := pg_temp.complete_as(v_owner, v_org7);
    raise exception 'P1C-R1-CONC[atomic-fail] expected error, got %', v_res;
  exception
    when others then
      if sqlerrm like 'P1C-R1-CONC[atomic-fail] expected error%' then
        raise;
      end if;
  end;
  select * into v_org_row from public.organizations where id = v_org7;
  select * into v_run from public.organization_onboarding_completion_runs where organization_id = v_org7;
  if v_org_row.onboarding_completed_at is not null or v_run.status = 'completed' then
    raise exception 'P1C-R1-CONC[atomic-fail] split state';
  end if;
  v_scenarios := v_scenarios + 1;

  -- 8. Already-completed replay racing another replay
  select * into v_org_row from public.organizations where id = v_org8;
  if v_org_row.onboarding_completed_at is null then
    raise exception 'P1C-R1-CONC[replay] seed did not complete org8';
  end if;
  v_lock := pg_catalog.hashtext(coalesce(v_org8::text, ''));
  v_call := format(
    'select public.complete_organization_v2_onboarding(%L::uuid)::text', v_org8
  );
  perform dblink_connect('p1c_a', v_conn);
  perform dblink_connect('p1c_b', v_conn);
  select r.p into v_pid_b from dblink('p1c_b', 'select pg_catalog.pg_backend_pid()') as r(p integer);
  perform dblink_exec('p1c_a', 'begin');
  perform dblink_exec('p1c_b', 'begin');
  perform dblink_exec('p1c_a', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_a', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_a', 'set local role authenticated');
  perform dblink_exec('p1c_b', format('set local request.jwt.claims to %L', v_claims));
  perform dblink_exec('p1c_b', format('set local request.jwt.claim.sub to %L', v_owner::text));
  perform dblink_exec('p1c_b', 'set local role authenticated');
  select r.j::jsonb into v_a from dblink('p1c_a', v_call) as r(j text);
  perform dblink_send_query('p1c_b', v_call);
  v_waiters := pg_temp.wait_advisory_waiter(v_pid_b, 872002, v_lock);
  if v_waiters = 0 then
    raise exception 'P1C-R1-CONC[replay]: B did not wait on 872002';
  end if;
  perform dblink_exec('p1c_a', 'commit');
  v_b := pg_temp.dblink_take_json('p1c_b');
  perform dblink_exec('p1c_b', 'commit');
  perform pg_temp.disconnect_dblink();
  if v_a ->> 'idempotent' <> 'true' or v_b ->> 'idempotent' <> 'true' then
    raise exception 'P1C-R1-CONC[replay] not both idempotent: % / %', v_a, v_b;
  end if;
  select count(distinct onboarding_completed_at) into v_i
  from public.organizations where id = v_org8;
  if v_i <> 1 then
    raise exception 'P1C-R1-CONC[replay] timestamp split';
  end if;
  v_scenarios := v_scenarios + 1;

  if v_scenarios <> 8 then
    raise exception 'P1C-R1-CONC expected 8 scenarios, got %', v_scenarios;
  end if;

  select count(*) into v_after_inv from public.organization_invitations;
  if v_after_inv < v_before_inv then
    raise exception 'P1C-R1-CONC lost invitation rows';
  end if;

  -- Advisory-lock residue is checked after this DO commits.

  delete from public.organization_onboarding_invitation_results
  where organization_id = any (v_orgs);
  delete from public.organization_onboarding_completion_runs
  where organization_id = any (v_orgs);
  delete from public.organization_onboarding_team_invite_intents
  where organization_id = any (v_orgs);
  delete from public.organization_invitation_events
  where organization_id = any (v_orgs);
  delete from private.organization_invitation_delivery_attempts
  where organization_id = any (v_orgs);
  delete from private.organization_invitation_mutation_rate_limits
  where organization_id = any (v_orgs);
  delete from public.organization_invitations
  where organization_id = any (v_orgs);
  delete from public.organization_context_assignments
  where organization_id = any (v_orgs);
  delete from public.organization_business_activities
  where organization_id = any (v_orgs);
  delete from public.organization_members
  where organization_id = any (v_orgs);
  delete from public.organizations
  where id = any (v_orgs);
  delete from auth.users where id = v_owner;

  if exists (
    select 1 from public.organizations where slug like 'zyntixai-p1cr1-%'
  ) then
    raise exception 'P1C-R1-CLEANUP organizations remain';
  end if;

  if exists (
    select 1 from auth.users where email like '%@example.test'
      and email like 'p1cr1-%'
  ) then
    raise exception 'P1C-R1-CLEANUP users remain';
  end if;

  raise notice 'PHASE 9 complete: 8 genuine two-session races';
  raise notice 'CLEANUP PASS: committed concurrency fixtures deleted';
end;
$section2$;

do $residue$
begin
  if exists (
    select 1 from pg_catalog.pg_locks
    where locktype = 'advisory' and classid in (872002, 872004) and granted
  ) then
    raise exception 'P1C-R1-CONC leftover advisory locks after section 2 commit';
  end if;
  if coalesce(dblink_get_connections(), array[]::text[]) <> array[]::text[] then
    raise exception 'P1C-R1-CONC leftover dblink connections';
  end if;
  if exists (
    select 1 from pg_catalog.pg_stat_activity
    where datname = pg_catalog.current_database()
      and pid <> pg_backend_pid()
      and state = 'idle in transaction'
  ) then
    raise exception 'P1C-R1-CONC leftover idle-in-transaction backends';
  end if;
  raise notice 'RESIDUE PASS: no advisory locks, dblink sessions, or idle-in-transaction backends';
end;
$residue$;

do $pass$
begin
  raise notice
    'PASS - ENG-ONB-1H-P1-C-R1 onboarding completion Ready-gate runtime verification: catalog, authenticated RPC matrix, clock-expiry, atomicity, side-effect, and 8 genuine two-session races passed against clone "%"; zero residue.',
    pg_catalog.current_database();
end;
$pass$;
