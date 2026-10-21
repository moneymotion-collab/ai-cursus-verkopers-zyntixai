-- ZyntixAI DATA-1E — Secure source structure discovery.
--
-- Persists structural metadata onto existing source columns (no ninth table).
-- Adds a purpose-specific service_role RPC. Bytes never enter SQL.
-- Mapping, staging, import, and Customer writers are not implemented.
-- Storage policies are unchanged.

alter table public.data_intake_sources
  drop constraint if exists data_intake_sources_parse_metadata_size_check;

alter table public.data_intake_sources
  add constraint data_intake_sources_parse_metadata_size_check check (
    pg_catalog.char_length(parse_metadata::text) <= 32768
  );

alter table public.data_intake_sources
  drop constraint if exists data_intake_sources_encoding_check;

alter table public.data_intake_sources
  add constraint data_intake_sources_encoding_check check (
    encoding is null or encoding = 'utf-8'
  );

alter table public.data_intake_sources
  drop constraint if exists data_intake_sources_delimiter_check;

alter table public.data_intake_sources
  add constraint data_intake_sources_delimiter_check check (
    delimiter is null
    or delimiter in (',', ';', E'\t')
  );

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

    if old.header_row_index is not null
      and (
        old.encoding is distinct from new.encoding
        or old.delimiter is distinct from new.delimiter
        or old.sheet_name is distinct from new.sheet_name
        or old.header_row_index is distinct from new.header_row_index
        or old.row_count is distinct from new.row_count
        or old.column_count is distinct from new.column_count
        or old.parse_metadata is distinct from new.parse_metadata
      )
    then
      raise exception 'DATA: discovered source structure is immutable'
        using errcode = 'P0001';
    end if;
  end if;

  if new.parse_metadata ? 'rows'
    or new.parse_metadata ? 'records'
    or new.parse_metadata ? 'cells'
    or new.parse_metadata ? 'values'
  then
    raise exception 'DATA: parse_metadata must not contain source rows'
      using errcode = 'P0001';
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
  'DATA-1C/1D/1E: freeze source hash/path/mime, object verification, and discovered structure.';

revoke all on function private.enforce_data_intake_source_integrity() from public;
revoke all on function private.enforce_data_intake_source_integrity() from anon;
revoke all on function private.enforce_data_intake_source_integrity() from authenticated;
revoke all on function private.enforce_data_intake_source_integrity() from service_role;

create or replace function public.apply_data_intake_source_structure_mutation(
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
  v_encoding text;
  v_delimiter text;
  v_sheet text;
  v_header_row integer;
  v_row_count integer;
  v_column_count integer;
  v_metadata jsonb;
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

  if p_operation is distinct from 'confirm_source_structure' then
    return jsonb_build_object(
      'ok', false,
      'code', 'DATABASE_WRITE_ERROR',
      'message', 'Unknown DATA source-structure operation'
    );
  end if;

  if p_payload ? 'storage_path'
    or p_payload ? 'storagePath'
    or p_payload ? 'path'
    or p_payload ? 'bucket'
    or p_payload ? 'generated_object_id'
    or p_payload ? 'generatedObjectId'
    or p_payload ? 'rows'
    or p_payload ? 'records'
    or p_payload ? 'bytes'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'Client storage path and source rows are not accepted'
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
    872015,
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

  if v_session.status = 'cancelled' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Cancelled sessions cannot accept structure discovery'
    );
  end if;

  if v_session.status not in ('source_ready', 'parsed') then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Structure discovery requires a source_ready or parsed session'
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

  if v_source.object_verified_at is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_NOT_VERIFIED',
      'message', 'Source object must be verified before structure discovery'
    );
  end if;

  if v_source.superseded_at is not null or v_source.deleted_at is not null then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Superseded or deleted sources cannot be parsed'
    );
  end if;

  v_sha256 := lower(btrim(coalesce(p_payload->>'sha256', '')));
  if v_sha256 is distinct from v_source.sha256 then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_HASH_INVALID',
      'message', 'Discovery digest must match registered source sha256'
    );
  end if;

  v_encoding := nullif(btrim(coalesce(p_payload->>'encoding', '')), '');
  v_delimiter := p_payload->>'delimiter';
  v_sheet := nullif(btrim(coalesce(p_payload->>'sheet_name', '')), '');
  v_metadata := coalesce(p_payload->'parse_metadata', '{}'::jsonb);

  begin
    v_header_row := (p_payload->>'header_row_index')::integer;
    v_row_count := (p_payload->>'row_count')::integer;
    v_column_count := (p_payload->>'column_count')::integer;
  exception
    when others then
      return jsonb_build_object(
        'ok', false,
        'code', 'SOURCE_INVALID',
        'message', 'Discovery counts must be integers'
      );
  end;

  if v_encoding is distinct from 'utf-8'
    or v_header_row is null or v_header_row < 1
    or v_row_count is null or v_row_count < 0
    or v_column_count is null or v_column_count < 0
    or jsonb_typeof(v_metadata) <> 'object'
    or v_metadata ? 'rows'
    or v_metadata ? 'records'
    or v_metadata ? 'cells'
    or coalesce(v_metadata->>'parser_version', '') is distinct from 'data-parser-v1'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'Discovery payload is not a bounded structural result'
    );
  end if;

  if v_source.header_row_index is not null then
    if v_source.encoding is distinct from v_encoding
      or v_source.delimiter is distinct from v_delimiter
      or v_source.sheet_name is distinct from v_sheet
      or v_source.header_row_index is distinct from v_header_row
      or v_source.row_count is distinct from v_row_count
      or v_source.column_count is distinct from v_column_count
      or v_source.parse_metadata is distinct from v_metadata
    then
      return jsonb_build_object(
        'ok', false,
        'code', 'SOURCE_INVALID',
        'message', 'Replay discovery does not match persisted structure'
      );
    end if;

    select e.id
      into v_event_id
    from public.data_intake_events as e
    where e.organization_id = p_organization_id
      and e.session_id = v_session.id
      and e.event_type = 'source_parsed'
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
      'event_id', v_event_id,
      'event_type', 'source_parsed',
      'replayed', true
    );
  end if;

  if v_session.status is distinct from 'source_ready' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'First structure discovery requires a source_ready session'
    );
  end if;

  update public.data_intake_sources
  set
    encoding = v_encoding,
    delimiter = v_delimiter,
    sheet_name = v_sheet,
    header_row_index = v_header_row,
    row_count = v_row_count,
    column_count = v_column_count,
    parse_metadata = v_metadata
  where organization_id = p_organization_id
    and id = v_source.id
  returning * into v_source;

  update public.data_intake_sessions
  set status = 'parsed'
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
    'source_parsed',
    p_actor_user_id,
    jsonb_build_object(
      'source_id', v_source.id,
      'format', v_source.source_kind,
      'parser_version', 'data-parser-v1',
      'column_count', v_source.column_count,
      'row_count', v_source.row_count,
      'sheet_count', case
        when jsonb_typeof(v_metadata->'sheets') = 'array' then jsonb_array_length(v_metadata->'sheets')
        else null
      end
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
    'event_type', 'source_parsed',
    'replayed', false
  );
end;
$$;

comment on function public.apply_data_intake_source_structure_mutation(text, uuid, uuid, uuid, jsonb) is
  'DATA-1E service_role-only source structure confirmation. Human Owner/Admin identity is required. No mapping. No staging. No import. No client Storage path authority. No source rows.';

revoke all on function public.apply_data_intake_source_structure_mutation(text, uuid, uuid, uuid, jsonb) from public;
revoke all on function public.apply_data_intake_source_structure_mutation(text, uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_data_intake_source_structure_mutation(text, uuid, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_data_intake_source_structure_mutation(text, uuid, uuid, uuid, jsonb) from service_role;

grant execute on function public.apply_data_intake_source_structure_mutation(text, uuid, uuid, uuid, jsonb) to service_role;
