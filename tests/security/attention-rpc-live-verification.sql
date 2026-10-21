-- B1.7.3 Attention RPC live verification (LOCAL / SAFE DB ONLY).
-- Synthetic UUIDs only. BEGIN/ROLLBACK. Never run against production.
--
-- Opt-in:
--   select set_config('zyntix.allow_attention_rpc_live_verify', 'on', true);

begin;

select set_config('zyntix.allow_attention_rpc_live_verify', 'on', true);

do $$
declare
  v_org_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  v_org_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
  v_user_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
  v_user_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa22';
  v_user_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa32';
  v_user_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';
  v_member_owner uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3';
  v_member_staff uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa23';
  v_member_viewer uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa33';
  v_member_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3';
  v_customer_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa4';
  v_customer_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb4';
  v_program_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa5';
  v_program_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb5';
  v_enrollment_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa6';
  v_enrollment_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6';
  v_item_id uuid;
  v_signal_id uuid;
  v_eval jsonb;
  v_err text;
begin
  if current_setting('zyntix.allow_attention_rpc_live_verify', true)
    is distinct from 'on'
  then
    raise exception
      'Refusing Attention RPC live verification: set zyntix.allow_attention_rpc_live_verify=on. Never run against production.';
  end if;

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values
    (
      v_user_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'attention-owner@example.test', crypt('not-a-real-secret', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_staff, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'attention-staff@example.test', crypt('not-a-real-secret', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_viewer, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'attention-viewer@example.test', crypt('not-a-real-secret', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    ),
    (
      v_user_b, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      'attention-b@example.test', crypt('not-a-real-secret', gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now()
    );

  insert into public.organizations (id, name, slug, created_at, updated_at)
  values
    (v_org_a, 'Attention Org A', 'attention-rpc-org-a', now(), now()),
    (v_org_b, 'Attention Org B', 'attention-rpc-org-b', now(), now());

  insert into public.organization_members (
    id, organization_id, user_id, role, status, created_at, updated_at
  ) values
    (v_member_owner, v_org_a, v_user_owner, 'owner', 'active', now(), now()),
    (v_member_staff, v_org_a, v_user_staff, 'staff', 'active', now(), now()),
    (v_member_viewer, v_org_a, v_user_viewer, 'viewer', 'active', now(), now()),
    (v_member_b, v_org_b, v_user_b, 'owner', 'active', now(), now());

  insert into public.customers (
    id, organization_id, display_name, status, created_by_member_id, created_at, updated_at
  ) values
    (v_customer_a, v_org_a, 'Customer A', 'active', v_member_owner, now(), now()),
    (v_customer_b, v_org_b, 'Customer B', 'active', v_member_b, now(), now());

  insert into public.programs (
    id, organization_id, name, status, delivery_mode, created_by_member_id, created_at, updated_at
  ) values
    (v_program_a, v_org_a, 'Program A', 'active', 'self_paced', v_member_owner, now(), now()),
    (v_program_b, v_org_b, 'Program B', 'active', 'self_paced', v_member_b, now(), now());

  insert into public.enrollments (
    id, organization_id, customer_id, program_id, status, created_by_member_id,
    source, created_at, updated_at, started_at
  ) values
    (
      v_enrollment_a, v_org_a, v_customer_a, v_program_a, 'active', v_member_owner,
      'manual', now() - interval '30 days', now(), now() - interval '30 days'
    ),
    (
      v_enrollment_b, v_org_b, v_customer_b, v_program_b, 'active', v_member_b,
      'manual', now() - interval '30 days', now(), now() - interval '30 days'
    );

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  v_item_id := public.create_manual_attention_item(
    v_org_a,
    v_enrollment_a,
    'Manual follow-up',
    'Needs review',
    'Summary',
    'high',
    'note from owner'
  );

  if v_item_id is null then
    raise exception 'expected manual item id';
  end if;

  -- Duplicate non-terminal manual create denied
  begin
    perform public.create_manual_attention_item(
      v_org_a,
      v_enrollment_a,
      'Duplicate',
      'Again',
      null,
      'medium',
      null
    );
    raise exception 'expected duplicate manual create denial';
  exception when raise_exception then
    get stacked diagnostics v_err = message_text;
    if v_err not like '%already open for dedupe key%' then
      raise;
    end if;
  end;

  -- Foreign enrollment denied
  begin
    perform public.create_manual_attention_item(
      v_org_a,
      v_enrollment_b,
      'Cross',
      'Cross',
      null,
      'low',
      null
    );
    raise exception 'expected foreign enrollment denial';
  exception when raise_exception then
    get stacked diagnostics v_err = message_text;
    if v_err not like '%enrollment not found%' then
      raise;
    end if;
  end;

  perform public.acknowledge_attention_item(v_org_a, v_item_id);
  perform public.assign_attention_item(v_org_a, v_item_id, v_member_staff);
  perform public.update_attention_severity(v_org_a, v_item_id, 'critical');

  v_signal_id := public.record_attention_signal(
    v_org_a,
    v_item_id,
    'Second note',
    '{"kind":"manual_note","note":"follow-up"}'::jsonb,
    now()
  );

  -- Signal UPDATE immutability trigger (runs as DB owner / postgres)
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

  -- Authenticated app role has no UPDATE privilege on Signals
  begin
    execute 'set local role authenticated';
    begin
      update public.attention_signals
      set explanation = 'mutated-by-auth'
      where id = v_signal_id;
      raise exception 'expected authenticated signal update privilege denial';
    exception
      when insufficient_privilege then
        null;
      when raise_exception then
        get stacked diagnostics v_err = message_text;
        if v_err like '%expected authenticated signal update privilege denial%' then
          raise;
        end if;
        -- immutability trigger is also acceptable if privileges allow reach
        if v_err not like '%attention signals are immutable%' then
          raise;
        end if;
    end;
    execute 'reset role';
  end;

  -- Staff may dismiss; may not archive
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);

  perform public.dismiss_attention_item(
    v_org_a,
    v_item_id,
    'Not actionable this cycle'
  );

  begin
    perform public.archive_attention_item(v_org_a, v_item_id);
    raise exception 'expected staff archive denial';
  exception when raise_exception then
    get stacked diagnostics v_err = message_text;
    if v_err not like '%insufficient role%' then
      raise;
    end if;
  end;

  -- Owner archives terminal item
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);
  perform public.archive_attention_item(v_org_a, v_item_id);

  -- Viewer cannot mutate
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_viewer::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_viewer::text, true);
  begin
    perform public.create_manual_attention_item(
      v_org_a,
      v_enrollment_a,
      'Viewer create',
      'Nope',
      null,
      'low',
      null
    );
    raise exception 'expected viewer create denial';
  exception when raise_exception then
    get stacked diagnostics v_err = message_text;
    if v_err not like '%insufficient role%' then
      raise;
    end if;
  end;

  -- Evaluate stale rule creates/updates/expires
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_owner::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_owner::text, true);

  v_eval := public.evaluate_attention_rules(v_org_a, v_enrollment_a);
  if coalesce((v_eval ->> 'created')::int, 0) < 1 then
    raise exception 'expected evaluate to create stale attention item: %', v_eval;
  end if;

  -- Staff cannot evaluate
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_user_staff::text, 'role', 'authenticated')::text,
    true
  );
  perform set_config('request.jwt.claim.sub', v_user_staff::text, true);
  begin
    perform public.evaluate_attention_rules(v_org_a, v_enrollment_a);
    raise exception 'expected staff evaluate denial';
  exception when raise_exception then
    get stacked diagnostics v_err = message_text;
    if v_err not like '%insufficient role%' then
      raise;
    end if;
  end;

  -- Events table exists and has rows
  if not exists (
    select 1 from public.attention_item_events
    where organization_id = v_org_a
  ) then
    raise exception 'expected attention item events';
  end if;

  -- SELECT policies present; no mutation policies
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'attention_items'
      and policyname = 'attention_items_select_member'
  ) then
    raise exception 'missing attention select policy';
  end if;

  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in ('attention_items', 'attention_signals', 'attention_item_events')
      and cmd <> 'SELECT'
  ) then
    raise exception 'unexpected non-select attention policy';
  end if;

  raise notice 'B1.7.3 Attention RPC live verification PASS';
end;
$$;

rollback;
