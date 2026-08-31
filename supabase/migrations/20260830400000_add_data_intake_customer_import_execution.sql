-- ZyntixAI DATA-1J — Governed Customer import execution + row results foundation.
--
-- Reuses data_import_plans and data_import_row_results. No ninth DATA table.
-- No Production apply. No Production execution. No Production Customer writes.
-- link is not update. CSV v1 does not write data_external_record_links.

create or replace function private.create_customer_record(
  p_organization_id uuid,
  p_display_name text,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_owner_member_id uuid,
  p_created_by_member_id uuid,
  p_source text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_display_name text;
  v_email text;
begin
  if p_source not in ('manual', 'lead_conversion', 'import') then
    raise exception 'invalid customer history source';
  end if;

  if p_owner_member_id is not null then
    if not exists (
      select 1
      from public.organization_members as om
      where om.organization_id = p_organization_id
        and om.id = p_owner_member_id
        and om.status = 'active'
    ) then
      raise exception 'invalid owner_member_id for organization';
    end if;
  end if;

  v_display_name := btrim(p_display_name);
  if char_length(v_display_name) = 0 then
    raise exception 'display_name is required';
  end if;

  v_email := private.normalize_customer_email(p_email);

  insert into public.customers (
    organization_id,
    display_name,
    first_name,
    last_name,
    email,
    phone,
    status,
    owner_member_id,
    created_by_member_id,
    started_at,
    ended_at,
    archived_at
  )
  values (
    p_organization_id,
    v_display_name,
    nullif(btrim(p_first_name), ''),
    nullif(btrim(p_last_name), ''),
    v_email,
    nullif(btrim(p_phone), ''),
    'onboarding',
    p_owner_member_id,
    p_created_by_member_id,
    pg_catalog.now(),
    null,
    null
  )
  returning id into v_customer_id;

  perform private.insert_customer_status_history(
    p_organization_id,
    v_customer_id,
    null,
    'onboarding',
    p_created_by_member_id,
    null,
    p_source
  );

  return v_customer_id;
end;
$$;

comment on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) is
  'Internal atomic customer insert with initial onboarding history. Import source is allowed only for governed DATA execution. Not client-callable.';

revoke all on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) from public;
revoke all on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) from anon;
revoke all on function private.create_customer_record(uuid, text, text, text, text, text, uuid, uuid, text) from authenticated;

create or replace function public.apply_data_intake_execution_mutation(
  p_operation text,
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_actor_member_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_status text;
  v_member_role text;
  v_member_status text;
  v_member_user uuid;
  v_session public.data_intake_sessions%rowtype;
  v_source public.data_intake_sources%rowtype;
  v_plan public.data_import_plans%rowtype;
  v_session_id uuid;
  v_source_id uuid;
  v_plan_id uuid;
  v_mapping_hash text;
  v_source_sha256 text;
  v_matcher_version text;
  v_plan_hash text;
  v_last_meta jsonb;
  v_op jsonb;
  v_fingerprint text;
  v_row_number integer;
  v_operation text;
  v_target_id uuid;
  v_existing public.data_import_row_results%rowtype;
  v_staged public.data_intake_staging_rows%rowtype;
  v_customer_id uuid;
  v_customer_email text;
  v_staged_email text;
  v_display text;
  v_first text;
  v_last text;
  v_phone text;
  v_event_id uuid;
  v_event_type text;
  v_replayed boolean := false;
  v_batch_index integer;
  v_batch_size integer := 100;
  v_processed integer := 0;
  v_remaining integer := 0;
  v_failed integer := 0;
  v_imported integer := 0;
  v_skipped integer := 0;
  v_created integer := 0;
  v_linked integer := 0;
  v_done boolean := false;
  v_results jsonb := '[]'::jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'DATA mutation requires the privileged database role'
    );
  end if;

  if p_operation is distinct from 'execute_import_plan' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Unknown DATA execution operation'
    );
  end if;

  if p_payload is null
    or jsonb_typeof(p_payload) <> 'object'
    or p_payload ? 'storage_path'
    or p_payload ? 'records'
    or p_payload ? 'bytes'
    or p_payload ? 'rows'
    or p_payload ? 'cells'
    or p_payload ? 'target_record_id'
    or p_payload ? 'target_operation'
    or p_payload ? 'targetRecordId'
    or p_payload ? 'targetOperation'
    or p_payload ? 'display_name'
    or p_payload ? 'email'
    or p_payload ? 'customers'
    or p_payload ? 'normalized_values'
    or p_payload ? 'raw_values'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'Client execution targets and Customer fields are not accepted'
    );
  end if;

  select o.status
    into v_org_status
  from public.organizations as o
  where o.id = p_organization_id;

  if v_org_status is null or v_org_status is distinct from 'active' then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORG_NOT_FOUND',
      'message', 'Organization not found or not active'
    );
  end if;

  select om.role, om.status, om.user_id
    into v_member_role, v_member_status, v_member_user
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.id = p_actor_member_id
    and om.user_id = p_actor_user_id;

  if v_member_user is null or v_member_status is distinct from 'active' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'Active organization membership is required'
    );
  end if;

  if v_member_role not in ('owner', 'admin') then
    return jsonb_build_object(
      'ok', false,
      'code', 'FORBIDDEN_ROLE',
      'message', 'Owner or Admin role is required'
    );
  end if;

  begin
    v_session_id := (p_payload->>'session_id')::uuid;
  exception
    when invalid_text_representation then
      v_session_id := null;
  end;

  begin
    v_source_id := (p_payload->>'source_id')::uuid;
  exception
    when invalid_text_representation then
      v_source_id := null;
  end;

  begin
    v_plan_id := (p_payload->>'plan_id')::uuid;
  exception
    when invalid_text_representation then
      v_plan_id := null;
  end;

  if v_session_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'SESSION_NOT_FOUND',
      'message', 'sessionId is required'
    );
  end if;

  if v_source_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_NOT_FOUND',
      'message', 'sourceId is required'
    );
  end if;

  if v_plan_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'planId is required'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872020,
    pg_catalog.hashtext(p_organization_id::text || ':' || v_session_id::text)
  );

  select s.*
    into v_session
  from public.data_intake_sessions as s
  where s.organization_id = p_organization_id
    and s.id = v_session_id;

  if v_session.id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'SESSION_NOT_FOUND',
      'message', 'Intake session not found'
    );
  end if;

  if v_session.target_domain is distinct from 'customer' then
    return jsonb_build_object(
      'ok', false,
      'code', 'TARGET_NOT_SUPPORTED',
      'message', 'DATA-1J execution supports customer only'
    );
  end if;

  if v_session.status = 'cancelled' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Cancelled sessions cannot be executed'
    );
  end if;

  if v_session.status not in ('approved', 'importing', 'failed', 'completed', 'completed_with_errors') then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Import execution requires an approved plan'
    );
  end if;

  select src.*
    into v_source
  from public.data_intake_sources as src
  where src.organization_id = p_organization_id
    and src.id = v_source_id
    and src.session_id = v_session.id;

  if v_source.id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_NOT_FOUND',
      'message', 'Intake source not found for this session'
    );
  end if;

  v_mapping_hash := lower(btrim(coalesce(p_payload->>'mapping_hash', '')));
  v_source_sha256 := lower(btrim(coalesce(p_payload->>'source_sha256', '')));
  v_matcher_version := nullif(btrim(p_payload->>'matcher_version'), '');
  v_plan_hash := lower(btrim(coalesce(p_payload->>'plan_hash', '')));

  if v_mapping_hash !~ '^[0-9a-f]{64}$'
    or v_source_sha256 !~ '^[0-9a-f]{64}$'
    or v_plan_hash !~ '^[0-9a-f]{64}$'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLAN_STALE',
      'message', 'Execution is bound to the current immutable snapshot'
    );
  end if;

  if v_source.sha256 is distinct from v_source_sha256 then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_HASH_INVALID',
      'message', 'Stored object no longer matches the verified source'
    );
  end if;

  if v_matcher_version is distinct from 'customer-matcher-v1' then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'Unknown matcher version'
    );
  end if;

  select e.metadata
    into v_last_meta
  from public.data_intake_events as e
  where e.organization_id = p_organization_id
    and e.session_id = v_session.id
    and e.event_type = 'matching_completed'
  order by e.created_at desc
  limit 1;

  if v_last_meta is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Import execution requires current matching completion'
    );
  end if;

  if v_last_meta->>'source_id' is distinct from v_source.id::text
    or v_last_meta->>'mapping_hash' is distinct from v_mapping_hash
    or v_last_meta->>'matcher_version' is distinct from v_matcher_version
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLAN_STALE',
      'message', 'Matching completion is not current for this source and mapping'
    );
  end if;

  select p.*
    into v_plan
  from public.data_import_plans as p
  where p.organization_id = p_organization_id
    and p.session_id = v_session.id
    and p.id = v_plan_id;

  if v_plan.id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Import execution requires an approved plan'
    );
  end if;

  if v_plan.plan_hash is distinct from v_plan_hash
    or v_plan.source_sha256 is distinct from v_source_sha256
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLAN_STALE',
      'message', 'Execution is bound to the exact current plan snapshot'
    );
  end if;

  if v_plan.status = 'draft' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Only an approved plan can be executed'
    );
  end if;

  if v_plan.status = 'superseded' then
    return jsonb_build_object(
      'ok', false,
      'code', 'PLAN_STALE',
      'message', 'A superseded plan cannot be executed'
    );
  end if;

  if v_plan.approved_by_user_id is null or v_plan.approved_at is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Execution requires a human-approved plan'
    );
  end if;

  select coalesce(jsonb_agg(to_jsonb(r) order by r.source_row_number), '[]'::jsonb)
    into v_results
  from public.data_import_row_results as r
  where r.organization_id = p_organization_id
    and r.plan_id = v_plan.id;

  select count(*)
    into v_remaining
  from jsonb_array_elements(coalesce(v_plan.summary->'operations', '[]'::jsonb)) as e(value)
  where not exists (
    select 1
    from public.data_import_row_results as r
    where r.plan_id = v_plan.id
      and r.row_fingerprint = e.value->>'row_fingerprint'
      and r.outcome in ('imported', 'skipped', 'failed')
  );

  if v_remaining = 0
    and v_plan.status = 'executed'
    and v_session.status in ('completed', 'completed_with_errors')
  then
    v_replayed := true;
    v_done := true;
    select e.id
      into v_event_id
    from public.data_intake_events as e
    where e.organization_id = p_organization_id
      and e.session_id = v_session.id
      and e.event_type = 'import_completed'
    order by e.created_at desc
    limit 1;
    v_event_type := 'import_completed';
  else
    for v_op in
      select e.value
      from jsonb_array_elements(coalesce(v_plan.summary->'operations', '[]'::jsonb)) as e(value)
      order by (e.value->>'source_row_number')::integer
    loop
      v_fingerprint := v_op->>'row_fingerprint';
      v_operation := v_op->>'target_operation';

      select r.*
        into v_existing
      from public.data_import_row_results as r
      where r.plan_id = v_plan.id
        and r.row_fingerprint = v_fingerprint;

      if v_existing.id is not null and v_existing.outcome in ('imported', 'skipped') then
        continue;
      end if;

      select s.*
        into v_staged
      from public.data_intake_staging_rows as s
      where s.organization_id = p_organization_id
        and s.source_id = v_source.id
        and s.row_fingerprint = v_fingerprint;

      if v_staged.id is null or v_staged.lifecycle is distinct from 'validated' then
        return jsonb_build_object(
          'ok', false,
          'code', 'PLAN_STALE',
          'message', 'Executable plan row is no longer valid'
        );
      end if;

      if v_operation = 'link' then
        begin
          v_target_id := (v_op->>'target_record_id')::uuid;
        exception
          when others then
            v_target_id := null;
        end;
        v_staged_email := private.normalize_customer_email(v_staged.normalized_values->>'email');
        select c.id, c.email
          into v_customer_id, v_customer_email
        from public.customers as c
        where c.organization_id = p_organization_id
          and c.id = v_target_id;
        if v_customer_id is null or v_staged_email is null or v_customer_email is distinct from v_staged_email then
          return jsonb_build_object(
            'ok', false,
            'code', 'PLAN_STALE',
            'message', 'Link target Customer is no longer valid for this plan'
          );
        end if;
      elsif v_operation = 'create' then
        v_staged_email := private.normalize_customer_email(v_staged.normalized_values->>'email');
        if v_staged_email is not null and exists (
          select 1
          from public.customers as c
          where c.organization_id = p_organization_id
            and c.email = v_staged_email
        ) then
          return jsonb_build_object(
            'ok', false,
            'code', 'PLAN_STALE',
            'message', 'Create target Customer already exists for this plan'
          );
        end if;
      elsif v_operation is distinct from 'skip' then
        return jsonb_build_object(
          'ok', false,
          'code', 'PLAN_STALE',
          'message', 'Blocked or conflict rows cannot be executed'
        );
      end if;
    end loop;

    if v_session.status = 'approved' and v_plan.status = 'approved' then
      update public.data_intake_sessions
      set
        status = 'importing',
        execution_attempt = execution_attempt + 1,
        execution_started_at = pg_catalog.now()
      where organization_id = p_organization_id
        and id = v_session.id
      returning * into v_session;

      update public.data_import_plans
      set status = 'executing'
      where organization_id = p_organization_id
        and id = v_plan.id
      returning * into v_plan;

      insert into public.data_intake_events (
        organization_id,
        session_id,
        event_type,
        actor_user_id,
        plan_id,
        metadata
      )
      values (
        p_organization_id,
        v_session.id,
        'import_started',
        p_actor_user_id,
        v_plan.id,
        jsonb_build_object(
          'plan_id', v_plan.id,
          'plan_hash', v_plan.plan_hash,
          'version', v_plan.version
        )
      );
    elsif v_session.status = 'failed' and v_plan.status = 'executing' then
      update public.data_intake_sessions
      set
        status = 'importing',
        execution_attempt = execution_attempt + 1
      where organization_id = p_organization_id
        and id = v_session.id
      returning * into v_session;

      insert into public.data_intake_events (
        organization_id,
        session_id,
        event_type,
        actor_user_id,
        plan_id,
        metadata
      )
      values (
        p_organization_id,
        v_session.id,
        'import_started',
        p_actor_user_id,
        v_plan.id,
        jsonb_build_object(
          'plan_id', v_plan.id,
          'plan_hash', v_plan.plan_hash,
          'retry', true
        )
      );
    elsif not (v_session.status = 'importing' and v_plan.status = 'executing') then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_STATE',
        'message', 'Import execution requires an approved plan'
      );
    end if;

    v_batch_index := coalesce(v_session.last_completed_batch_index, -1) + 1;

    for v_op in
      select e.value
      from jsonb_array_elements(coalesce(v_plan.summary->'operations', '[]'::jsonb)) as e(value)
      order by (e.value->>'source_row_number')::integer
    loop
      if v_processed >= v_batch_size then
        exit;
      end if;

      v_fingerprint := v_op->>'row_fingerprint';
      v_row_number := (v_op->>'source_row_number')::integer;
      v_operation := v_op->>'target_operation';

      select r.*
        into v_existing
      from public.data_import_row_results as r
      where r.plan_id = v_plan.id
        and r.row_fingerprint = v_fingerprint;

      if v_existing.id is not null then
        continue;
      end if;

      select s.*
        into v_staged
      from public.data_intake_staging_rows as s
      where s.organization_id = p_organization_id
        and s.source_id = v_source.id
        and s.row_fingerprint = v_fingerprint;

      if v_operation = 'create' then
        v_display := btrim(coalesce(v_staged.normalized_values->>'display_name', ''));
        v_first := nullif(btrim(coalesce(v_staged.normalized_values->>'first_name', '')), '');
        v_last := nullif(btrim(coalesce(v_staged.normalized_values->>'last_name', '')), '');
        v_phone := nullif(btrim(coalesce(v_staged.normalized_values->>'phone', '')), '');
        v_staged_email := v_staged.normalized_values->>'email';
        if char_length(v_display) < 1 or char_length(v_display) > 200 then
          insert into public.data_import_row_results (
            organization_id,
            session_id,
            plan_id,
            row_fingerprint,
            source_row_number,
            operation,
            outcome,
            target_domain,
            target_record_id,
            error_code
          )
          values (
            p_organization_id,
            v_session.id,
            v_plan.id,
            v_fingerprint,
            v_row_number,
            'create',
            'failed',
            'customer',
            null,
            'CUSTOMER_CREATE_FAILED'
          );
          v_processed := v_processed + 1;
          continue;
        end if;

        begin
          v_customer_id := private.create_customer_record(
            p_organization_id,
            v_display,
            v_first,
            v_last,
            v_staged_email,
            v_phone,
            null,
            p_actor_member_id,
            'import'
          );

          insert into public.data_import_row_results (
            organization_id,
            session_id,
            plan_id,
            row_fingerprint,
            source_row_number,
            operation,
            outcome,
            target_domain,
            target_record_id,
            error_code
          )
          values (
            p_organization_id,
            v_session.id,
            v_plan.id,
            v_fingerprint,
            v_row_number,
            'create',
            'imported',
            'customer',
            v_customer_id,
            null
          );
        exception
          when unique_violation then
            insert into public.data_import_row_results (
              organization_id,
              session_id,
              plan_id,
              row_fingerprint,
              source_row_number,
              operation,
              outcome,
              target_domain,
              target_record_id,
              error_code
            )
            values (
              p_organization_id,
              v_session.id,
              v_plan.id,
              v_fingerprint,
              v_row_number,
              'create',
              'failed',
              'customer',
              null,
              'CUSTOMER_CONFLICT'
            );
        end;
      elsif v_operation = 'link' then
        v_target_id := (v_op->>'target_record_id')::uuid;
        insert into public.data_import_row_results (
          organization_id,
          session_id,
          plan_id,
          row_fingerprint,
          source_row_number,
          operation,
          outcome,
          target_domain,
          target_record_id,
          error_code
        )
        values (
          p_organization_id,
          v_session.id,
          v_plan.id,
          v_fingerprint,
          v_row_number,
          'link',
          'imported',
          'customer',
          v_target_id,
          null
        );
      else
        insert into public.data_import_row_results (
          organization_id,
          session_id,
          plan_id,
          row_fingerprint,
          source_row_number,
          operation,
          outcome,
          target_domain,
          target_record_id,
          error_code
        )
        values (
          p_organization_id,
          v_session.id,
          v_plan.id,
          v_fingerprint,
          v_row_number,
          'skip',
          'skipped',
          'customer',
          null,
          null
        );
      end if;

      v_processed := v_processed + 1;
    end loop;

    update public.data_intake_sessions
    set last_completed_batch_index = v_batch_index
    where organization_id = p_organization_id
      and id = v_session.id
    returning * into v_session;

    select count(*)
      into v_remaining
    from jsonb_array_elements(coalesce(v_plan.summary->'operations', '[]'::jsonb)) as e(value)
    where not exists (
      select 1
      from public.data_import_row_results as r
      where r.plan_id = v_plan.id
        and r.row_fingerprint = e.value->>'row_fingerprint'
    );

    select
      count(*) filter (where r.outcome = 'imported'),
      count(*) filter (where r.outcome = 'failed'),
      count(*) filter (where r.outcome = 'skipped'),
      count(*) filter (where r.operation = 'create' and r.outcome = 'imported'),
      count(*) filter (where r.operation = 'link' and r.outcome = 'imported')
      into v_imported, v_failed, v_skipped, v_created, v_linked
    from public.data_import_row_results as r
    where r.plan_id = v_plan.id;

    insert into public.data_intake_events (
      organization_id,
      session_id,
      event_type,
      actor_user_id,
      plan_id,
      metadata
    )
    values (
      p_organization_id,
      v_session.id,
      'import_batch_completed',
      p_actor_user_id,
      v_plan.id,
      jsonb_build_object(
        'plan_id', v_plan.id,
        'plan_hash', v_plan.plan_hash,
        'batch_index', v_batch_index,
        'imported', v_imported,
        'failed', v_failed
      )
    )
    returning id into v_event_id;
    v_event_type := 'import_batch_completed';

    if v_remaining = 0 then
      v_done := true;
      update public.data_intake_sessions
      set
        status = case when v_failed > 0 then 'completed_with_errors' else 'completed' end,
        completed_at = pg_catalog.now()
      where organization_id = p_organization_id
        and id = v_session.id
      returning * into v_session;

      update public.data_import_plans
      set status = 'executed'
      where organization_id = p_organization_id
        and id = v_plan.id
      returning * into v_plan;

      insert into public.data_intake_events (
        organization_id,
        session_id,
        event_type,
        actor_user_id,
        plan_id,
        metadata
      )
      values (
        p_organization_id,
        v_session.id,
        'import_completed',
        p_actor_user_id,
        v_plan.id,
        jsonb_build_object(
          'plan_id', v_plan.id,
          'plan_hash', v_plan.plan_hash,
          'imported', v_imported,
          'failed', v_failed
        )
      )
      returning id into v_event_id;
      v_event_type := 'import_completed';
    end if;

    select coalesce(jsonb_agg(to_jsonb(r) order by r.source_row_number), '[]'::jsonb)
      into v_results
    from public.data_import_row_results as r
    where r.organization_id = p_organization_id
      and r.plan_id = v_plan.id;
  end if;

  select
    count(*) filter (where (value->>'outcome') = 'imported'),
    count(*) filter (where (value->>'outcome') = 'failed'),
    count(*) filter (where (value->>'outcome') = 'skipped'),
    count(*) filter (where (value->>'operation') = 'create' and (value->>'outcome') = 'imported'),
    count(*) filter (where (value->>'operation') = 'link' and (value->>'outcome') = 'imported')
    into v_imported, v_failed, v_skipped, v_created, v_linked
  from jsonb_array_elements(coalesce(v_results, '[]'::jsonb)) as t(value);

  return jsonb_build_object(
    'ok', true,
    'session_id', v_session.id,
    'status', v_session.status,
    'target_domain', v_session.target_domain,
    'source_kind', v_session.source_kind,
    'source_id', v_source.id,
    'storage_path', v_source.storage_path,
    'storage_bucket', v_source.storage_bucket,
    'event_id', v_event_id,
    'event_type', v_event_type,
    'replayed', v_replayed,
    'plan_id', v_plan.id,
    'plan_hash', v_plan.plan_hash,
    'plan_status', v_plan.status,
    'version', v_plan.version,
    'approved_at', v_plan.approved_at,
    'approved_by_user_id', v_plan.approved_by_user_id,
    'mapping_hash', v_mapping_hash,
    'batch_index', v_batch_index,
    'last_completed_batch_index', v_session.last_completed_batch_index,
    'done', v_done or v_replayed,
    'summary', jsonb_build_object(
      'imported', v_imported,
      'failed', v_failed,
      'skipped', v_skipped,
      'created', v_created,
      'linked', v_linked
    ),
    'results', v_results
  );
end;
$$;

comment on function public.apply_data_intake_execution_mutation(text, uuid, uuid, uuid, jsonb) is
  'DATA-1J service_role-only governed Customer import execution. Human Owner/Admin identity is required. Create uses private.create_customer_record(import). Link writes a row result only. No Customer UPDATE. No external record links.';

revoke all on function public.apply_data_intake_execution_mutation(text, uuid, uuid, uuid, jsonb) from public;
revoke all on function public.apply_data_intake_execution_mutation(text, uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_data_intake_execution_mutation(text, uuid, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_data_intake_execution_mutation(text, uuid, uuid, uuid, jsonb) from service_role;

grant execute on function public.apply_data_intake_execution_mutation(text, uuid, uuid, uuid, jsonb) to service_role;
