-- ZyntixAI DATA-1I — Governed import planning + review/approval foundation.
--
-- Reuses existing data_import_plans. No ninth DATA table.
-- No Production apply. No Customer writes. No import execution.
-- No data_import_row_results. No data_external_record_links.

create or replace function public.apply_data_intake_planning_mutation(
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
  v_current public.data_import_plans%rowtype;
  v_session_id uuid;
  v_source_id uuid;
  v_plan_id uuid;
  v_mapping_hash text;
  v_source_sha256 text;
  v_matcher_version text;
  v_plan_hash text;
  v_adapter_version text;
  v_mapping_snapshot jsonb;
  v_fingerprints jsonb;
  v_summary jsonb;
  v_replayed boolean := false;
  v_event_id uuid;
  v_event_type text;
  v_last_meta jsonb;
  v_next_version integer;
  v_link jsonb;
  v_target_id uuid;
  v_customer_id uuid;
  v_customer_email text;
  v_staged_email text;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'DATA mutation requires the privileged database role'
    );
  end if;

  if p_operation not in ('create_import_plan', 'approve_import_plan') then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Unknown DATA planning operation'
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
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'Client plan targets and source rows are not accepted'
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

  perform pg_catalog.pg_advisory_xact_lock(
    872019,
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
      'message', 'DATA-1I planning supports customer only'
    );
  end if;

  if v_session.status = 'cancelled' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Cancelled sessions cannot accept import planning'
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
      'message', 'Planning is bound to the current immutable snapshot'
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
      'message', 'Import planning requires current matching completion'
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
    into v_current
  from public.data_import_plans as p
  where p.organization_id = p_organization_id
    and p.session_id = v_session.id
    and p.status in ('approved', 'executing')
  order by p.version desc
  limit 1;

  if v_current.id is null then
    select p.*
      into v_current
    from public.data_import_plans as p
    where p.organization_id = p_organization_id
      and p.session_id = v_session.id
      and p.status = 'draft'
    order by p.version desc
    limit 1;
  end if;

  if p_operation = 'create_import_plan' then
    if v_session.status = 'review_required' then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_STATE',
        'message', 'Import-plan creation is denied until review blockers are resolved'
      );
    end if;

    if v_session.status not in ('ready_for_approval', 'approved') then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_STATE',
        'message', 'Import planning requires ready_for_approval and current matching'
      );
    end if;

    if v_current.id is not null and v_current.plan_hash is not distinct from v_plan_hash then
      v_replayed := true;
      select e.id
        into v_event_id
      from public.data_intake_events as e
      where e.organization_id = p_organization_id
        and e.session_id = v_session.id
        and e.event_type = 'plan_created'
        and e.plan_id = v_current.id
      order by e.created_at desc
      limit 1;
      v_plan := v_current;
      v_event_type := 'plan_created';
    else
      if v_current.id is not null and v_current.status = 'approved' then
        return jsonb_build_object(
          'ok', false,
          'code', 'PLAN_STALE',
          'message', 'An approved plan cannot be rewritten in place'
        );
      end if;

      v_adapter_version := nullif(btrim(p_payload->>'adapter_version'), '');
      v_mapping_snapshot := p_payload->'mapping_snapshot';
      v_fingerprints := p_payload->'included_fingerprints';
      v_summary := p_payload->'summary';

      if v_adapter_version is distinct from 'customer.v1'
        or v_mapping_snapshot is null
        or jsonb_typeof(v_mapping_snapshot) is distinct from 'object'
        or v_fingerprints is null
        or jsonb_typeof(v_fingerprints) is distinct from 'array'
        or v_summary is null
        or jsonb_typeof(v_summary) is distinct from 'object'
      then
        return jsonb_build_object(
          'ok', false,
          'code', 'SOURCE_INVALID',
          'message', 'Plan snapshot is incomplete'
        );
      end if;

      if v_summary ? 'operations' and jsonb_typeof(v_summary->'operations') = 'array' then
        for v_link in
          select value
          from jsonb_array_elements(v_summary->'operations') as t(value)
          where value->>'target_operation' = 'link'
        loop
          begin
            v_target_id := (v_link->>'target_record_id')::uuid;
          exception
            when others then
              return jsonb_build_object(
                'ok', false,
                'code', 'PLAN_STALE',
                'message', 'Link target Customer is no longer valid for this plan'
              );
          end;

          select c.id, c.email
            into v_customer_id, v_customer_email
          from public.customers as c
          where c.organization_id = p_organization_id
            and c.id = v_target_id;

          if v_customer_id is null then
            return jsonb_build_object(
              'ok', false,
              'code', 'PLAN_STALE',
              'message', 'Link target Customer is no longer valid for this plan'
            );
          end if;
        end loop;
      end if;

      if v_current.id is not null and v_current.status = 'draft' then
        update public.data_import_plans
        set
          status = 'superseded',
          superseded_at = pg_catalog.now()
        where organization_id = p_organization_id
          and id = v_current.id
        returning * into v_current;

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
          'plan_superseded',
          p_actor_user_id,
          v_current.id,
          jsonb_build_object(
            'plan_id', v_current.id,
            'plan_hash', v_current.plan_hash,
            'version', v_current.version
          )
        );
      end if;

      select coalesce(max(p.version), 0) + 1
        into v_next_version
      from public.data_import_plans as p
      where p.organization_id = p_organization_id
        and p.session_id = v_session.id;

      insert into public.data_import_plans (
        organization_id,
        session_id,
        version,
        source_id,
        source_sha256,
        target_domain,
        adapter_version,
        business_activity_id,
        mapping_snapshot,
        included_fingerprints,
        summary,
        plan_hash,
        status,
        created_by_user_id
      )
      values (
        p_organization_id,
        v_session.id,
        v_next_version,
        v_source.id,
        v_source_sha256,
        'customer',
        v_adapter_version,
        null,
        v_mapping_snapshot,
        v_fingerprints,
        v_summary,
        v_plan_hash,
        'draft',
        p_actor_user_id
      )
      returning * into v_plan;

      update public.data_intake_sessions
      set current_plan_id = v_plan.id
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
        'plan_created',
        p_actor_user_id,
        v_plan.id,
        jsonb_build_object(
          'plan_id', v_plan.id,
          'plan_hash', v_plan.plan_hash,
          'version', v_plan.version,
          'create_candidates', v_summary->'create_candidates',
          'link_candidates', v_summary->'link_candidates',
          'executable_rows', v_summary->'executable_rows'
        )
      )
      returning id into v_event_id;
      v_event_type := 'plan_created';
    end if;
  else
    begin
      v_plan_id := (p_payload->>'plan_id')::uuid;
    exception
      when invalid_text_representation then
        v_plan_id := null;
    end;

    if v_plan_id is not null then
      select p.*
        into v_plan
      from public.data_import_plans as p
      where p.organization_id = p_organization_id
        and p.session_id = v_session.id
        and p.id = v_plan_id;
    else
      v_plan := v_current;
    end if;

    if v_plan.id is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_STATE',
        'message', 'Approval requires a current import plan'
      );
    end if;

    if v_plan.plan_hash is distinct from v_plan_hash
      or v_plan.source_sha256 is distinct from v_source_sha256
    then
      return jsonb_build_object(
        'ok', false,
        'code', 'PLAN_STALE',
        'message', 'Approval is bound to the exact current plan snapshot'
      );
    end if;

    if v_plan.status = 'approved' then
      v_replayed := true;
      select e.id
        into v_event_id
      from public.data_intake_events as e
      where e.organization_id = p_organization_id
        and e.session_id = v_session.id
        and e.event_type = 'plan_approved'
        and e.plan_id = v_plan.id
      order by e.created_at desc
      limit 1;
      v_event_type := 'plan_approved';
    else
      if v_plan.status is distinct from 'draft' then
        return jsonb_build_object(
          'ok', false,
          'code', 'INVALID_STATE',
          'message', 'Only a draft plan can be approved'
        );
      end if;

      if v_session.status is distinct from 'ready_for_approval' then
        return jsonb_build_object(
          'ok', false,
          'code', 'INVALID_STATE',
          'message', 'Approval requires a current ready_for_approval plan'
        );
      end if;

      update public.data_import_plans
      set
        status = 'approved',
        approved_at = pg_catalog.now(),
        approved_by_user_id = p_actor_user_id
      where organization_id = p_organization_id
        and id = v_plan.id
      returning * into v_plan;

      update public.data_intake_sessions
      set
        status = 'approved',
        current_plan_id = v_plan.id,
        approved_at = v_plan.approved_at,
        approved_by_user_id = p_actor_user_id
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
        'plan_approved',
        p_actor_user_id,
        v_plan.id,
        jsonb_build_object(
          'plan_id', v_plan.id,
          'plan_hash', v_plan.plan_hash,
          'version', v_plan.version,
          'approved_by_user_id', p_actor_user_id
        )
      )
      returning id into v_event_id;
      v_event_type := 'plan_approved';
    end if;
  end if;

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
    'summary', jsonb_build_object(
      'source_data_rows', v_plan.summary->'source_data_rows',
      'validated_rows', v_plan.summary->'validated_rows',
      'create_candidates', v_plan.summary->'create_candidates',
      'link_candidates', v_plan.summary->'link_candidates',
      'blocked_rows', v_plan.summary->'blocked_rows',
      'conflicts', v_plan.summary->'conflicts',
      'no_key_rows', v_plan.summary->'no_key_rows',
      'excluded_rows', v_plan.summary->'excluded_rows',
      'executable_rows', v_plan.summary->'executable_rows',
      'mapping_hash', v_plan.summary->'mapping_hash',
      'matcher_version', v_plan.summary->'matcher_version'
    )
  );
end;
$$;

comment on function public.apply_data_intake_planning_mutation(text, uuid, uuid, uuid, jsonb) is
  'DATA-1I service_role-only import-plan create/approve mutation. Human Owner/Admin identity is required. No Customer writes. No row results. No external links. No import execution.';

revoke all on function public.apply_data_intake_planning_mutation(text, uuid, uuid, uuid, jsonb) from public;
revoke all on function public.apply_data_intake_planning_mutation(text, uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_data_intake_planning_mutation(text, uuid, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_data_intake_planning_mutation(text, uuid, uuid, uuid, jsonb) from service_role;

grant execute on function public.apply_data_intake_planning_mutation(text, uuid, uuid, uuid, jsonb) to service_role;


-- DATA-1I aligns cancel_session with the frozen DATA-1B approved -> cancelled
-- pre-execution abort path. Importing and failed remain excluded.

create or replace function public.apply_data_intake_foundation_mutation(
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
  v_session_id uuid;
  v_source_id uuid;
  v_object_id uuid;
  v_source_kind text;
  v_target_domain text;
  v_activity_id uuid;
  v_filename text;
  v_mime text;
  v_byte_size integer;
  v_sha256 text;
  v_ext text;
  v_path text;
  v_event_type text;
  v_event_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'DATA mutation requires the privileged database role'
    );
  end if;

  if p_organization_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORG_NOT_FOUND',
      'message', 'organizationId is required'
    );
  end if;

  if p_actor_user_id is null or p_actor_member_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'Authenticated tenant actor identity is required'
    );
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    return jsonb_build_object(
      'ok', false,
      'code', 'DATABASE_WRITE_ERROR',
      'message', 'Mutation payload must be a JSON object'
    );
  end if;

  if p_operation not in ('create_session', 'register_source', 'cancel_session') then
    return jsonb_build_object(
      'ok', false,
      'code', 'DATABASE_WRITE_ERROR',
      'message', 'Unknown DATA foundation operation'
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

  if p_operation = 'create_session' then
    v_target_domain := nullif(btrim(p_payload->>'target_domain'), '');
    v_source_kind := nullif(btrim(p_payload->>'source_kind'), '');

    if p_payload ? 'business_activity_id'
      and jsonb_typeof(p_payload->'business_activity_id') <> 'null'
      and nullif(btrim(p_payload->>'business_activity_id'), '') is not null
    then
      if v_target_domain is not distinct from 'customer' then
        return jsonb_build_object(
          'ok', false,
          'code', 'ACTIVITY_NOT_ALLOWED_FOR_TARGET',
          'message', 'Customer intake must not bind a Business Activity'
        );
      end if;
      begin
        v_activity_id := (p_payload->>'business_activity_id')::uuid;
      exception
        when invalid_text_representation then
          return jsonb_build_object(
            'ok', false,
            'code', 'ACTIVITY_NOT_FOUND',
            'message', 'businessActivityId is invalid'
          );
      end;
    end if;

    if v_target_domain is distinct from 'customer' then
      return jsonb_build_object(
        'ok', false,
        'code', 'TARGET_NOT_SUPPORTED',
        'message', 'DATA-1C executable target_domain is customer'
      );
    end if;

    if v_source_kind is null or v_source_kind not in ('csv', 'xlsx') then
      return jsonb_build_object(
        'ok', false,
        'code', 'UNSUPPORTED_FILE',
        'message', 'sourceKind must be csv or xlsx'
      );
    end if;

    insert into public.data_intake_sessions (
      organization_id,
      business_activity_id,
      target_domain,
      source_kind,
      status,
      created_by_user_id
    )
    values (
      p_organization_id,
      null,
      v_target_domain,
      v_source_kind,
      'created',
      p_actor_user_id
    )
    returning * into v_session;

    insert into public.data_intake_events (
      organization_id,
      session_id,
      event_type,
      actor_user_id,
      metadata
    )
    values (
      p_organization_id,
      v_session.id,
      'intake_created',
      p_actor_user_id,
      jsonb_build_object(
        'target_domain', v_session.target_domain,
        'source_kind', v_session.source_kind
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'session_id', v_session.id,
      'status', v_session.status,
      'target_domain', v_session.target_domain,
      'source_kind', v_session.source_kind,
      'source_id', null,
      'storage_path', null,
      'event_id', v_event_id,
      'event_type', 'intake_created'
    );
  end if;

  begin
    v_session_id := (p_payload->>'session_id')::uuid;
  exception
    when invalid_text_representation then
      v_session_id := null;
  end;

  if v_session_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'SESSION_NOT_FOUND',
      'message', 'sessionId is required'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872013,
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

  if p_operation = 'cancel_session' then
    if v_session.status not in ('created', 'source_ready', 'parsed', 'mapping_required', 'mapped', 'validating', 'review_required', 'ready_for_approval', 'approved') then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_STATE',
        'message', 'DATA can cancel only created, source_ready, parsed, mapping_required, mapped, validating, review_required, ready_for_approval, or approved sessions'
      );
    end if;

    update public.data_intake_sessions
    set
      status = 'cancelled',
      cancelled_at = pg_catalog.now(),
      cancel_requested = false
    where organization_id = p_organization_id
      and id = v_session.id
    returning * into v_session;

    insert into public.data_intake_events (
      organization_id,
      session_id,
      event_type,
      actor_user_id,
      metadata
    )
    values (
      p_organization_id,
      v_session.id,
      'import_cancelled',
      p_actor_user_id,
      jsonb_build_object('status', 'cancelled')
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'session_id', v_session.id,
      'status', v_session.status,
      'target_domain', v_session.target_domain,
      'source_kind', v_session.source_kind,
      'source_id', null,
      'storage_path', null,
      'event_id', v_event_id,
      'event_type', 'import_cancelled'
    );
  end if;

  if v_session.status not in ('created', 'source_ready') then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Source metadata can be registered only before parse'
    );
  end if;

  v_source_kind := coalesce(
    nullif(btrim(p_payload->>'source_kind'), ''),
    v_session.source_kind
  );
  if v_source_kind is distinct from v_session.source_kind then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNSUPPORTED_FILE',
      'message', 'sourceKind must match the session'
    );
  end if;

  v_filename := coalesce(nullif(btrim(p_payload->>'original_filename'), ''), 'upload');
  v_filename := regexp_replace(v_filename, '.*[\\/]', '', 'g');
  v_filename := left(v_filename, 255);

  if v_filename ~* '\.xls$' and v_filename !~* '\.xlsx$' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNSUPPORTED_FILE',
      'message', '.xls is not supported'
    );
  end if;

  v_mime := nullif(lower(btrim(p_payload->>'mime_type')), '');
  if v_session.source_kind = 'csv' then
    if v_mime is distinct from 'text/csv' then
      return jsonb_build_object(
        'ok', false,
        'code', 'UNSUPPORTED_FILE',
        'message', 'CSV mime_type must be text/csv'
      );
    end if;
    v_ext := '.csv';
  else
    if v_mime is distinct from 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' then
      return jsonb_build_object(
        'ok', false,
        'code', 'UNSUPPORTED_FILE',
        'message', 'XLSX mime_type is required'
      );
    end if;
    v_ext := '.xlsx';
  end if;

  begin
    v_byte_size := (p_payload->>'byte_size')::integer;
  exception
    when others then
      v_byte_size := null;
  end;

  if v_byte_size is null or v_byte_size <= 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'byteSize is required'
    );
  end if;

  if v_byte_size > 10485760 then
    return jsonb_build_object(
      'ok', false,
      'code', 'FILE_TOO_LARGE',
      'message', 'File exceeds the 10 MB DATA-1 v1 limit'
    );
  end if;

  v_sha256 := lower(btrim(coalesce(p_payload->>'sha256', '')));
  if v_sha256 !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_HASH_INVALID',
      'message', 'sha256 must be a 64-character lowercase hex digest'
    );
  end if;

  v_source_id := gen_random_uuid();
  v_object_id := gen_random_uuid();
  v_path := p_organization_id::text
    || '/'
    || v_session.id::text
    || '/'
    || v_source_id::text
    || '/'
    || v_object_id::text
    || v_ext;

  if v_session.status = 'source_ready' then
    update public.data_intake_sources
    set superseded_at = pg_catalog.now()
    where organization_id = p_organization_id
      and session_id = v_session.id
      and superseded_at is null;
    v_event_type := 'source_replaced';
  else
    v_event_type := 'source_uploaded';
  end if;

  insert into public.data_intake_sources (
    id,
    organization_id,
    session_id,
    source_kind,
    storage_bucket,
    storage_path,
    original_filename,
    mime_type,
    byte_size,
    sha256,
    parse_metadata
  )
  values (
    v_source_id,
    p_organization_id,
    v_session.id,
    v_session.source_kind,
    'data-intake',
    v_path,
    v_filename,
    v_mime,
    v_byte_size,
    v_sha256,
    '{}'::jsonb
  )
  returning * into v_source;

  if v_session.status = 'created' then
    update public.data_intake_sessions
    set status = 'source_ready'
    where organization_id = p_organization_id
      and id = v_session.id
    returning * into v_session;
  end if;

  insert into public.data_intake_events (
    organization_id,
    session_id,
    event_type,
    actor_user_id,
    metadata
  )
  values (
    p_organization_id,
    v_session.id,
    v_event_type,
    p_actor_user_id,
    jsonb_build_object(
      'source_id', v_source.id,
      'source_kind', v_source.source_kind,
      'byte_size', v_source.byte_size,
      'mime_type', v_source.mime_type,
      'sha256', v_source.sha256
    )
  )
  returning id into v_event_id;

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
    'event_type', v_event_type
  );
end;
$$;

comment on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) is
  'DATA-1C/1E-R1/1F-R1/1G service_role-only foundation mutations. Human Owner/Admin identity is required. cancel_session allows created through approved before execution. No import. No Customer writes.';

revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from public;
revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from service_role;

grant execute on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) to service_role;
