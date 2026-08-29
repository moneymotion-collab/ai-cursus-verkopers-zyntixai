-- ZyntixAI DATA-1F — Governed semantic source mapping foundation.
--
-- Uses existing data_intake_mappings. No ninth DATA table.
-- No staging. No import plans. No Customer writer change. No Production apply.

alter table public.data_intake_mappings
  drop constraint if exists data_intake_mappings_decision_shape_check;

alter table public.data_intake_mappings
  add constraint data_intake_mappings_decision_shape_check check (
    (status = 'rejected' and target_field is null)
    or (
      status in ('proposed', 'confirmed')
      and target_field in ('display_name', 'email', 'phone', 'first_name', 'last_name')
    )
    or (status in ('unmapped', 'needs_review'))
  );

create unique index if not exists data_intake_mappings_one_target_per_source_idx
  on public.data_intake_mappings (source_id, target_field)
  where target_field is not null
    and status in ('proposed', 'confirmed');

create or replace function public.apply_data_intake_mapping_mutation(
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
  v_source_field_key text;
  v_source_header text;
  v_target_field text;
  v_existing public.data_intake_mappings%rowtype;
  v_conflict public.data_intake_mappings%rowtype;
  v_event_id uuid;
  v_event_type text;
  v_replayed boolean := false;
  v_required_mapped boolean;
  v_mapping_hash text;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'DATA mutation requires the privileged database role'
    );
  end if;

  if p_operation is distinct from 'upsert_mapping'
    and p_operation is distinct from 'ignore_source_column'
    and p_operation is distinct from 'confirm_mapping'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Unknown DATA mapping operation'
    );
  end if;

  if p_payload is null
    or jsonb_typeof(p_payload) <> 'object'
    or p_payload ? 'storage_path'
    or p_payload ? 'records'
    or p_payload ? 'bytes'
    or p_payload ? 'rows'
    or p_payload ? 'cells'
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
    872016,
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
      'message', 'DATA-1F mapping supports customer only'
    );
  end if;

  if v_session.status = 'cancelled' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Cancelled sessions cannot accept mapping'
    );
  end if;

  if v_session.status not in ('parsed', 'mapping_required', 'mapped') then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Mapping requires a parsed or mapping session'
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

  if v_source.header_row_index is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Mapping requires completed structure discovery'
    );
  end if;

  if v_session.status = 'mapped' and p_operation is distinct from 'confirm_mapping' then
    update public.data_intake_sessions
    set status = 'mapping_required'
    where organization_id = p_organization_id
      and id = v_session.id
    returning * into v_session;

    update public.data_intake_mappings
    set
      status = case when status = 'confirmed' then 'proposed' else status end,
      confirmed_at = null,
      confirmed_by_user_id = null
    where organization_id = p_organization_id
      and source_id = v_source.id
      and status = 'confirmed';
  end if;

  if p_operation = 'confirm_mapping' then
    if v_session.status = 'mapped' then
      select e.id
        into v_event_id
      from public.data_intake_events as e
      where e.organization_id = p_organization_id
        and e.session_id = v_session.id
        and e.event_type = 'mapping_confirmed'
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
        'event_type', 'mapping_confirmed',
        'replayed', true
      );
    end if;

    select exists (
      select 1
      from public.data_intake_mappings as m
      where m.organization_id = p_organization_id
        and m.source_id = v_source.id
        and m.target_field = 'display_name'
        and m.status in ('proposed', 'confirmed')
    )
      into v_required_mapped;

    if not v_required_mapped then
      return jsonb_build_object(
        'ok', false,
        'code', 'MAPPING_INCOMPLETE',
        'message', 'Required customer import fields are not mapped'
      );
    end if;

    if v_session.status = 'parsed' then
      update public.data_intake_sessions
      set status = 'mapping_required'
      where organization_id = p_organization_id
        and id = v_session.id
      returning * into v_session;
    end if;

    update public.data_intake_mappings
    set
      status = 'confirmed',
      confirmed_at = pg_catalog.now(),
      confirmed_by_user_id = p_actor_user_id
    where organization_id = p_organization_id
      and source_id = v_source.id
      and status = 'proposed'
      and target_field is not null;

    update public.data_intake_sessions
    set status = 'mapped'
    where organization_id = p_organization_id
      and id = v_session.id
    returning * into v_session;

    v_mapping_hash := nullif(btrim(coalesce(p_payload->>'mapping_hash', '')), '');

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
      'mapping_confirmed',
      p_actor_user_id,
      jsonb_build_object(
        'source_id', v_source.id,
        'adapter_version', 'customer.v1',
        'target_domain', 'customer',
        'mapping_hash', v_mapping_hash
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
      'event_type', 'mapping_confirmed',
      'replayed', false
    );
  end if;

  v_source_field_key := nullif(btrim(coalesce(p_payload->>'source_field_key', '')), '');
  v_source_header := coalesce(p_payload->>'source_header', '');
  v_target_field := nullif(btrim(coalesce(p_payload->>'target_field', '')), '');

  if v_source_field_key is null
    or char_length(v_source_field_key) > 200
    or v_source_field_key not like 'csv:%' and v_source_field_key not like 'xlsx:%'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_COLUMN_UNKNOWN',
      'message', 'Source column is not in the frozen discovery'
    );
  end if;

  if p_operation = 'upsert_mapping' then
    if v_target_field is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'TARGET_FIELD_UNKNOWN',
        'message', 'targetField is required'
      );
    end if;
    if v_target_field not in ('display_name', 'email', 'phone', 'first_name', 'last_name') then
      return jsonb_build_object(
        'ok', false,
        'code', case
          when v_target_field in (
            'id', 'organization_id', 'status', 'owner_member_id', 'created_by_member_id',
            'metadata', 'started_at', 'ended_at', 'archived_at', 'created_at', 'updated_at'
          ) then 'TARGET_FIELD_FORBIDDEN'
          else 'TARGET_FIELD_UNKNOWN'
        end,
        'message', 'Target field is not an approved customer import field'
      );
    end if;

    select m.*
      into v_conflict
    from public.data_intake_mappings as m
    where m.organization_id = p_organization_id
      and m.source_id = v_source.id
      and m.target_field = v_target_field
      and m.source_field_key is distinct from v_source_field_key
      and m.status in ('proposed', 'confirmed');

    if v_conflict.id is not null then
      return jsonb_build_object(
        'ok', false,
        'code', 'DUPLICATE_TARGET_MAPPING',
        'message', 'Each customer field may be mapped from at most one source column'
      );
    end if;
  end if;

  if v_session.status = 'parsed' then
    update public.data_intake_sessions
    set status = 'mapping_required'
    where organization_id = p_organization_id
      and id = v_session.id
    returning * into v_session;
  end if;

  select m.*
    into v_existing
  from public.data_intake_mappings as m
  where m.organization_id = p_organization_id
    and m.source_id = v_source.id
    and m.source_field_key = v_source_field_key;

  if p_operation = 'upsert_mapping' then
    if v_existing.id is not null
      and v_existing.target_field is not distinct from v_target_field
      and v_existing.status in ('proposed', 'confirmed')
    then
      v_replayed := true;
      v_event_type := 'mapping_proposed';
    else
      if v_existing.id is null then
        insert into public.data_intake_mappings (
          organization_id,
          session_id,
          source_id,
          source_field_key,
          source_header,
          target_domain,
          target_field,
          status,
          proposal_source,
          confidence,
          transform_kind
        )
        values (
          p_organization_id,
          v_session.id,
          v_source.id,
          v_source_field_key,
          v_source_header,
          'customer',
          v_target_field,
          'proposed',
          'user',
          'none',
          'identity'
        );
      else
        update public.data_intake_mappings
        set
          source_header = v_source_header,
          target_field = v_target_field,
          status = 'proposed',
          proposal_source = 'user',
          confirmed_at = null,
          confirmed_by_user_id = null
        where organization_id = p_organization_id
          and id = v_existing.id;
      end if;
      v_event_type := 'mapping_proposed';
    end if;
  else
    if v_existing.id is not null
      and v_existing.status = 'rejected'
      and v_existing.target_field is null
    then
      v_replayed := true;
      v_event_type := 'mapping_proposed';
    else
      if v_existing.id is null then
        insert into public.data_intake_mappings (
          organization_id,
          session_id,
          source_id,
          source_field_key,
          source_header,
          target_domain,
          target_field,
          status,
          proposal_source,
          confidence,
          transform_kind
        )
        values (
          p_organization_id,
          v_session.id,
          v_source.id,
          v_source_field_key,
          v_source_header,
          'customer',
          null,
          'rejected',
          'user',
          'none',
          'identity'
        );
      else
        update public.data_intake_mappings
        set
          source_header = v_source_header,
          target_field = null,
          status = 'rejected',
          proposal_source = 'user',
          confirmed_at = null,
          confirmed_by_user_id = null
        where organization_id = p_organization_id
          and id = v_existing.id;
      end if;
      v_event_type := 'mapping_proposed';
    end if;
  end if;

  if not v_replayed then
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
        'source_field_key', v_source_field_key,
        'decision', case
          when p_operation = 'ignore_source_column' then 'ignored'
          else 'mapped'
        end
      )
    )
    returning id into v_event_id;
  else
    select e.id
      into v_event_id
    from public.data_intake_events as e
    where e.organization_id = p_organization_id
      and e.session_id = v_session.id
      and e.event_type = v_event_type
      and e.metadata->>'source_id' = v_source.id::text
      and e.metadata->>'source_field_key' = v_source_field_key
    order by e.created_at desc
    limit 1;
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
    'replayed', v_replayed
  );
end;
$$;

comment on function public.apply_data_intake_mapping_mutation(text, uuid, uuid, uuid, jsonb) is
  'DATA-1F service_role-only semantic mapping mutation. Human Owner/Admin identity is required. No staging. No import. No Customer writes. No source rows.';

revoke all on function public.apply_data_intake_mapping_mutation(text, uuid, uuid, uuid, jsonb) from public;
revoke all on function public.apply_data_intake_mapping_mutation(text, uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_data_intake_mapping_mutation(text, uuid, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_data_intake_mapping_mutation(text, uuid, uuid, uuid, jsonb) from service_role;

grant execute on function public.apply_data_intake_mapping_mutation(text, uuid, uuid, uuid, jsonb) to service_role;
