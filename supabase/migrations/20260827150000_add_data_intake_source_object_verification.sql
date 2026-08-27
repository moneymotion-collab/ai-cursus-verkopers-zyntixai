-- ZyntixAI DATA-1D — Private source-object verification.
--
-- Adds object_verified_at on existing sources (no ninth table), one additive
-- event type, and a purpose-specific service_role RPC. Bytes never enter SQL.
-- Parser, mapping, import, and Customer writers are not implemented.
-- Storage policies are unchanged: anon/authenticated remain denied on data-intake.

alter table public.data_intake_sources
  add column if not exists object_verified_at timestamptz,
  add column if not exists object_verified_by_user_id uuid;

alter table public.data_intake_sources
  drop constraint if exists data_intake_sources_object_verified_pair_check;

alter table public.data_intake_sources
  add constraint data_intake_sources_object_verified_pair_check check (
    (object_verified_at is null and object_verified_by_user_id is null)
    or (object_verified_at is not null and object_verified_by_user_id is not null)
  );

comment on column public.data_intake_sources.object_verified_at is
  'Set once after the server independently hashed and read back the private Storage object. Null means metadata-only (DATA-1C).';
comment on column public.data_intake_sources.object_verified_by_user_id is
  'Human Owner/Admin actor who completed object verification. Never service_role.';

create or replace function private.enforce_data_intake_source_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_kind text;
  v_session_org uuid;
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.organization_id is distinct from new.organization_id
      or old.session_id is distinct from new.session_id
      or old.sha256 is distinct from new.sha256
      or old.storage_bucket is distinct from new.storage_bucket
      or old.storage_path is distinct from new.storage_path
      or old.byte_size is distinct from new.byte_size
      or old.source_kind is distinct from new.source_kind
      or old.original_filename is distinct from new.original_filename
      or old.mime_type is distinct from new.mime_type
    then
      raise exception 'DATA: source artifact identity and content metadata are immutable'
        using errcode = 'P0001';
    end if;

    if old.object_verified_at is not null
      and (
        old.object_verified_at is distinct from new.object_verified_at
        or old.object_verified_by_user_id is distinct from new.object_verified_by_user_id
      )
    then
      raise exception 'DATA: verified source object identity is immutable'
        using errcode = 'P0001';
    end if;
  end if;

  select s.organization_id, s.source_kind
    into v_session_org, v_session_kind
  from public.data_intake_sessions as s
  where s.organization_id = new.organization_id
    and s.id = new.session_id;

  if not found or v_session_org is distinct from new.organization_id then
    raise exception 'DATA: source session tenant mismatch'
      using errcode = 'P0001';
  end if;

  if v_session_kind is distinct from new.source_kind then
    raise exception 'DATA: source_kind must match the session'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function private.enforce_data_intake_source_integrity() is
  'DATA-1C/1D: freeze source hash/path/mime and object_verified_at once set.';

revoke all on function private.enforce_data_intake_source_integrity() from public;
revoke all on function private.enforce_data_intake_source_integrity() from anon;
revoke all on function private.enforce_data_intake_source_integrity() from authenticated;
revoke all on function private.enforce_data_intake_source_integrity() from service_role;

alter table public.data_intake_events
  drop constraint if exists data_intake_events_event_type_check;

alter table public.data_intake_events
  add constraint data_intake_events_event_type_check check (
    event_type in (
      'intake_created',
      'source_uploaded',
      'source_replaced',
      'source_object_verified',
      'source_parsed',
      'mapping_proposed',
      'mapping_confirmed',
      'validation_completed',
      'plan_created',
      'plan_approved',
      'plan_superseded',
      'import_started',
      'import_batch_completed',
      'import_completed',
      'import_failed',
      'import_cancelled'
    )
  );

create or replace function public.apply_data_intake_source_object_mutation(
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
  v_sha256 text;
  v_byte_size integer;
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

  if p_operation is distinct from 'confirm_source_object' then
    return jsonb_build_object(
      'ok', false,
      'code', 'DATABASE_WRITE_ERROR',
      'message', 'Unknown DATA source-object operation'
    );
  end if;

  if p_payload ? 'storage_path'
    or p_payload ? 'storagePath'
    or p_payload ? 'path'
    or p_payload ? 'bucket'
    or p_payload ? 'generated_object_id'
    or p_payload ? 'generatedObjectId'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'Client storage path is not accepted'
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
      'code', 'SOURCE_INVALID',
      'message', 'sourceId is required'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872014,
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

  if v_session.status is distinct from 'source_ready' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Source object can be verified only on an active source_ready session'
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
      'code', 'SOURCE_INVALID',
      'message', 'Intake source not found for this session'
    );
  end if;

  if v_source.superseded_at is not null then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Superseded source objects cannot be verified'
    );
  end if;

  if v_source.deleted_at is not null then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Deleted source objects cannot be verified'
    );
  end if;

  v_sha256 := lower(btrim(coalesce(p_payload->>'sha256', '')));
  if v_sha256 is distinct from v_source.sha256 then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_HASH_INVALID',
      'message', 'Verified digest must match registered source sha256'
    );
  end if;

  begin
    v_byte_size := (p_payload->>'byte_size')::integer;
  exception
    when others then
      v_byte_size := null;
  end;

  if v_byte_size is null or v_byte_size is distinct from v_source.byte_size then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'Verified size must match registered source byte_size'
    );
  end if;

  if v_source.object_verified_at is not null then
    select e.id
      into v_event_id
    from public.data_intake_events as e
    where e.organization_id = p_organization_id
      and e.session_id = v_session.id
      and e.event_type = 'source_object_verified'
      and e.metadata->>'source_id' = v_source.id::text
    order by e.created_at desc
    limit 1;

    return jsonb_build_object(
      'ok', true,
      'session_id', v_session.id,
      'status', v_session.status,
      'target_domain', v_session.target_domain,
      'source_kind', v_session.source_kind,
      'source_id', v_source.id,
      'storage_path', v_source.storage_path,
      'storage_bucket', v_source.storage_bucket,
      'object_verified_at', v_source.object_verified_at,
      'event_id', v_event_id,
      'event_type', 'source_object_verified',
      'replayed', true
    );
  end if;

  update public.data_intake_sources
  set
    object_verified_at = pg_catalog.now(),
    object_verified_by_user_id = p_actor_user_id
  where organization_id = p_organization_id
    and id = v_source.id
  returning * into v_source;

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
    'source_object_verified',
    p_actor_user_id,
    jsonb_build_object(
      'source_id', v_source.id,
      'source_kind', v_source.source_kind,
      'byte_size', v_source.byte_size,
      'sha256', v_source.sha256,
      'storage_bucket', v_source.storage_bucket
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
    'object_verified_at', v_source.object_verified_at,
    'event_id', v_event_id,
    'event_type', 'source_object_verified',
    'replayed', false
  );
end;
$$;

comment on function public.apply_data_intake_source_object_mutation(text, uuid, uuid, uuid, jsonb) is
  'DATA-1D service_role-only source object confirmation. Human Owner/Admin identity is required. No parser. No import. No client Storage path authority.';

revoke all on function public.apply_data_intake_source_object_mutation(text, uuid, uuid, uuid, jsonb) from public;
revoke all on function public.apply_data_intake_source_object_mutation(text, uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_data_intake_source_object_mutation(text, uuid, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_data_intake_source_object_mutation(text, uuid, uuid, uuid, jsonb) from service_role;

grant execute on function public.apply_data_intake_source_object_mutation(text, uuid, uuid, uuid, jsonb) to service_role;
