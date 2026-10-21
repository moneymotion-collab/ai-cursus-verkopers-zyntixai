-- ZyntixAI DATA-1E-R1 — Allow parsed DATA intake session cancellation.
--
-- Smallest exact fix: existing cancel_session operation now accepts parsed.
-- The DATA-1B/1C status graph already allowed parsed → cancelled.
-- The foundation RPC allowlist did not. No new tables, RLS, grants, Storage,
-- parser schema, mapping, staging, or Customer changes.

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
    if v_session.status not in ('created', 'source_ready', 'parsed') then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_STATE',
        'message', 'DATA can cancel only created, source_ready, or parsed sessions'
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
  'DATA-1C/1E-R1 service_role-only foundation mutations. Human Owner/Admin identity is required. cancel_session allows created, source_ready, and parsed. No mapping. No import.';

revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from public;
revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) from service_role;

grant execute on function public.apply_data_intake_foundation_mutation(text, uuid, uuid, uuid, jsonb) to service_role;
