-- B1.7.2 Attention schema live verification (LOCAL / SAFE DB ONLY).
-- Uses synthetic UUIDs only. No production data. No secrets.
--
-- HARD GUARDS:
-- 1) Run only after local `supabase db reset` against the local Docker DB.
-- 2) Never run against a linked/production project.
-- 3) Entire script is wrapped in BEGIN/ROLLBACK (no durable writes).
-- 4) Requires an explicit per-transaction opt-in before the DO block:
--      select set_config('zyntix.allow_attention_schema_live_verify', 'on', true);
--
-- Example local invocation (psql against local DB URL only):
--   \i tests/security/attention-schema-live-verification.sql

begin;

-- Explicit local opt-in (transaction-local). Remove or omit this line and the DO block refuses.
select set_config('zyntix.allow_attention_schema_live_verify', 'on', true);

do $$
declare
  v_org_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  v_org_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
  v_user_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  v_member_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';
  v_member_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';
  v_customer_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4';
  v_customer_a2 uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14';
  v_customer_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4';
  v_program_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5';
  v_program_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5';
  v_enrollment_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6';
  v_enrollment_a2 uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa16';
  v_enrollment_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6';
  v_item_open uuid;
  v_item_terminal uuid;
  v_item_other_org uuid;
  v_item_cascade uuid;
  v_signal_id uuid;
  v_signal_cascade uuid;
  v_err text;
begin
  if current_setting('zyntix.allow_attention_schema_live_verify', true)
    is distinct from 'on'
  then
    raise exception
      'Refusing Attention live verification: set zyntix.allow_attention_schema_live_verify=on in this transaction only. Never run against production.';
  end if;

  -- Minimal tenant fixtures (auth.users + org graph) via existing tables.
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (
      v_user_a, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'attention-a@example.test', crypt('not-a-real-secret', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'attention-b@example.test', crypt('not-a-real-secret', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    );

  insert into public.organizations (id, name, slug, created_at, updated_at)
  values
    (v_org_a, 'Attention Org A', 'attention-org-a', now(), now()),
    (v_org_b, 'Attention Org B', 'attention-org-b', now(), now());

  insert into public.organization_members (
    id, organization_id, user_id, role, status, created_at, updated_at
  ) values
    (v_member_a, v_org_a, v_user_a, 'owner', 'active', now(), now()),
    (v_member_b, v_org_b, v_user_b, 'owner', 'active', now(), now());

  insert into public.customers (
    id, organization_id, display_name, status, created_by_member_id, created_at, updated_at
  ) values
    (v_customer_a, v_org_a, 'Customer A', 'active', v_member_a, now(), now()),
    (v_customer_a2, v_org_a, 'Customer A2', 'active', v_member_a, now(), now()),
    (v_customer_b, v_org_b, 'Customer B', 'active', v_member_b, now(), now());

  insert into public.programs (
    id, organization_id, name, status, delivery_mode, created_by_member_id, created_at, updated_at
  ) values
    (v_program_a, v_org_a, 'Program A', 'active', 'self_paced', v_member_a, now(), now()),
    (v_program_b, v_org_b, 'Program B', 'active', 'self_paced', v_member_b, now(), now());

  insert into public.enrollments (
    id, organization_id, customer_id, program_id, status, created_by_member_id,
    source, created_at, updated_at, started_at
  ) values
    (v_enrollment_a, v_org_a, v_customer_a, v_program_a, 'active', v_member_a, 'manual', now(), now(), now()),
    (v_enrollment_a2, v_org_a, v_customer_a2, v_program_a, 'paused', v_member_a, 'manual', now(), now(), now()),
    (v_enrollment_b, v_org_b, v_customer_b, v_program_b, 'active', v_member_b, 'manual', now(), now(), now());

  -- Tables exist with expected columns
  perform 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'attention_items';
  if not found then raise exception 'missing attention_items'; end if;

  perform 1 from information_schema.tables
  where table_schema = 'public' and table_name = 'attention_signals';
  if not found then raise exception 'missing attention_signals'; end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attention_items' and column_name = 'priority'
  ) then
    raise exception 'priority column must not exist';
  end if;

  -- Valid open item
  insert into public.attention_items (
    organization_id, enrollment_id, customer_id, program_id,
    title, status, severity, dedupe_key, created_by_member_id
  ) values (
    v_org_a, v_enrollment_a, v_customer_a, v_program_a,
    'Stale progress', 'open', 'medium',
    'attention:enrollment:' || v_org_a::text || ':' || v_enrollment_a::text || ':enrollment_no_recent_progress',
    v_member_a
  ) returning id into v_item_open;

  -- Invalid status denied
  begin
    insert into public.attention_items (
      organization_id, enrollment_id, customer_id, program_id,
      title, status, severity, dedupe_key
    ) values (
      v_org_a, v_enrollment_a, v_customer_a, v_program_a,
      'Bad status', 'archived', 'medium', 'bad-status-key'
    );
    raise exception 'expected invalid status denial';
  exception when check_violation then
    null;
  end;

  -- Dismissed without reason denied
  begin
    insert into public.attention_items (
      organization_id, enrollment_id, customer_id, program_id,
      title, status, severity, dedupe_key, dismissed_at
    ) values (
      v_org_a, v_enrollment_a2, v_customer_a2, v_program_a,
      'Dismissed bad', 'dismissed', 'low', 'dismiss-bad', now()
    );
    raise exception 'expected dismissed without reason denial';
  exception when check_violation then
    null;
  end;

  -- Archive non-terminal denied
  begin
    update public.attention_items
    set archived_at = now()
    where id = v_item_open;
    raise exception 'expected archive non-terminal denial';
  exception when check_violation then
    null;
  end;

  -- Foreign-org enrollment denied
  begin
    insert into public.attention_items (
      organization_id, enrollment_id, customer_id, program_id,
      title, status, severity, dedupe_key
    ) values (
      v_org_a, v_enrollment_b, v_customer_b, v_program_b,
      'Cross tenant', 'open', 'medium', 'cross-tenant'
    );
    raise exception 'expected foreign enrollment denial';
  exception when foreign_key_violation then
    null;
  end;

  -- Duplicate non-terminal denied
  begin
    insert into public.attention_items (
      organization_id, enrollment_id, customer_id, program_id,
      title, status, severity, dedupe_key
    ) values (
      v_org_a, v_enrollment_a, v_customer_a, v_program_a,
      'Duplicate open', 'open', 'high',
      'attention:enrollment:' || v_org_a::text || ':' || v_enrollment_a::text || ':enrollment_no_recent_progress'
    );
    raise exception 'expected duplicate non-terminal denial';
  exception when unique_violation then
    null;
  end;

  -- Open + acknowledged same key denied
  begin
    insert into public.attention_items (
      organization_id, enrollment_id, customer_id, program_id,
      title, status, severity, dedupe_key, acknowledged_at
    ) values (
      v_org_a, v_enrollment_a, v_customer_a, v_program_a,
      'Duplicate ack', 'acknowledged', 'high',
      'attention:enrollment:' || v_org_a::text || ':' || v_enrollment_a::text || ':enrollment_no_recent_progress',
      now()
    );
    raise exception 'expected open+ack duplicate denial';
  exception when unique_violation then
    null;
  end;

  -- Valid signal
  insert into public.attention_signals (
    organization_id, attention_item_id, enrollment_id,
    signal_origin, rule_key, explanation, evidence, created_by_member_id
  ) values (
    v_org_a, v_item_open, v_enrollment_a,
    'rule', 'enrollment_no_recent_progress', 'No recent progress',
    '{"kind":"stale_progress","ageCalendarDays":14}'::jsonb,
    null
  ) returning id into v_signal_id;

  -- Invalid signal/rule combo denied
  begin
    insert into public.attention_signals (
      organization_id, attention_item_id, enrollment_id,
      signal_origin, rule_key, explanation, evidence
    ) values (
      v_org_a, v_item_open, v_enrollment_a,
      'manual', 'enrollment_no_recent_progress', 'Bad combo', '{}'::jsonb
    );
    raise exception 'expected invalid signal/rule combo denial';
  exception when check_violation then
    null;
  end;

  -- Unknown signal origin denied
  begin
    insert into public.attention_signals (
      organization_id, attention_item_id, enrollment_id,
      signal_origin, rule_key, explanation, evidence
    ) values (
      v_org_a, v_item_open, v_enrollment_a,
      'ai', null, 'Bad origin', '{}'::jsonb
    );
    raise exception 'expected unknown origin denial';
  exception when check_violation then
    null;
  end;

  -- Signal update denied (immutability trigger)
  begin
    update public.attention_signals
    set explanation = 'mutated'
    where id = v_signal_id;
    raise exception 'expected signal update denial';
  exception when raise_exception then
    get stacked diagnostics v_err = message_text;
    if v_err not like '%attention signals are immutable%' then
      raise;
    end if;
  end;

  -- Application roles must have no table privileges (deny-by-default)
  if has_table_privilege('anon', 'public.attention_items', 'select')
    or has_table_privilege('anon', 'public.attention_signals', 'select')
    or has_table_privilege('authenticated', 'public.attention_items', 'select')
    or has_table_privilege('authenticated', 'public.attention_signals', 'select')
    or has_table_privilege('authenticated', 'public.attention_signals', 'insert')
    or has_table_privilege('authenticated', 'public.attention_signals', 'update')
    or has_table_privilege('authenticated', 'public.attention_signals', 'delete')
  then
    raise exception 'anon/authenticated must not have Attention table privileges';
  end if;

  -- Disposable Item+Signal: parent DELETE must CASCADE (admin/reset path)
  insert into public.attention_items (
    organization_id, enrollment_id, customer_id, program_id,
    title, status, severity, dedupe_key, created_by_member_id
  ) values (
    v_org_a, v_enrollment_a2, v_customer_a2, v_program_a,
    'Cascade probe', 'open', 'low',
    'attention:enrollment:' || v_org_a::text || ':' || v_enrollment_a2::text || ':manual',
    v_member_a
  ) returning id into v_item_cascade;

  insert into public.attention_signals (
    organization_id, attention_item_id, enrollment_id,
    signal_origin, rule_key, explanation, evidence, created_by_member_id
  ) values (
    v_org_a, v_item_cascade, v_enrollment_a2,
    'manual', null, 'Cascade probe signal',
    '{"kind":"manual_note"}'::jsonb,
    v_member_a
  ) returning id into v_signal_cascade;

  delete from public.attention_items where id = v_item_cascade;

  if exists (
    select 1 from public.attention_signals where id = v_signal_cascade
  ) then
    raise exception 'expected signal row removed by parent Item CASCADE delete';
  end if;

  -- Foreign-org signal/item denied
  insert into public.attention_items (
    organization_id, enrollment_id, customer_id, program_id,
    title, status, severity, dedupe_key, created_by_member_id
  ) values (
    v_org_b, v_enrollment_b, v_customer_b, v_program_b,
    'Org B item', 'open', 'medium',
    'attention:enrollment:' || v_org_b::text || ':' || v_enrollment_b::text || ':manual',
    v_member_b
  ) returning id into v_item_other_org;

  begin
    insert into public.attention_signals (
      organization_id, attention_item_id, enrollment_id,
      signal_origin, rule_key, explanation, evidence
    ) values (
      v_org_a, v_item_other_org, v_enrollment_a,
      'manual', null, 'Cross item', '{"kind":"manual_note"}'::jsonb
    );
    raise exception 'expected foreign signal/item denial';
  exception when foreign_key_violation then
    null;
  end;

  -- Terminal item allows new open with same dedupe key
  update public.attention_items
  set
    status = 'resolved',
    resolved_at = now(),
    resolution_reason = 'Handled'
  where id = v_item_open
  returning id into v_item_terminal;

  insert into public.attention_items (
    organization_id, enrollment_id, customer_id, program_id,
    title, status, severity, dedupe_key
  ) values (
    v_org_a, v_enrollment_a, v_customer_a, v_program_a,
    'New incident', 'open', 'medium',
    'attention:enrollment:' || v_org_a::text || ':' || v_enrollment_a::text || ':enrollment_no_recent_progress'
  );

  -- Other enrollment / other key allowed
  insert into public.attention_items (
    organization_id, enrollment_id, customer_id, program_id,
    title, status, severity, dedupe_key
  ) values (
    v_org_a, v_enrollment_a2, v_customer_a2, v_program_a,
    'Other enrollment', 'open', 'low',
    'attention:enrollment:' || v_org_a::text || ':' || v_enrollment_a2::text || ':enrollment_no_recent_progress'
  );

  insert into public.attention_items (
    organization_id, enrollment_id, customer_id, program_id,
    title, status, severity, dedupe_key
  ) values (
    v_org_a, v_enrollment_a, v_customer_a, v_program_a,
    'Manual key', 'open', 'low',
    'attention:enrollment:' || v_org_a::text || ':' || v_enrollment_a::text || ':manual'
  );

  -- Archive terminal allowed
  update public.attention_items
  set archived_at = now()
  where id = v_item_terminal;

  -- Partial unique index exists
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'attention_items_nonterminal_dedupe_uidx'
  ) then
    raise exception 'missing nonterminal dedupe index';
  end if;

  -- RLS enabled; no policies
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'attention_items' and c.relrowsecurity
  ) then
    raise exception 'attention_items RLS not enabled';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('attention_items', 'attention_signals')
  ) then
    raise exception 'unexpected Attention RLS policies present';
  end if;

  raise notice 'B1.7.2 Attention live schema verification PASS';
end;
$$;

rollback;
