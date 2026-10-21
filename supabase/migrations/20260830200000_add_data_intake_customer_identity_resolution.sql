-- ZyntixAI DATA-1H — Deterministic Customer identity resolution foundation.
--
-- Reuses existing data_intake_staging_rows. No ninth DATA table.
-- No Production apply. No Customer writes. No import plans.
-- Matching is classification only: exact email within the same organization.

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
      'matching_completed',
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

create or replace function public.apply_data_intake_matching_mutation(
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
  v_mapping_hash text;
  v_source_sha256 text;
  v_matcher_version text;
  v_next_status text;
  v_rows jsonb;
  v_row jsonb;
  v_existing public.data_intake_staging_rows%rowtype;
  v_resolution text;
  v_target_operation text;
  v_target_id uuid;
  v_match_kind text;
  v_row_number integer;
  v_customer_id uuid;
  v_customer_email text;
  v_staged_email text;
  v_existing_count integer := 0;
  v_eligible integer := 0;
  v_exact integer := 0;
  v_no_match integer := 0;
  v_no_key integer := 0;
  v_ambiguous integer := 0;
  v_collisions integer := 0;
  v_blocked integer := 0;
  v_payload_eligible integer;
  v_payload_exact integer;
  v_payload_no_match integer;
  v_payload_no_key integer;
  v_payload_ambiguous integer;
  v_payload_collisions integer;
  v_payload_blocked integer;
  v_replayed boolean := false;
  v_event_id uuid;
  v_last_meta jsonb;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'DATA mutation requires the privileged database role'
    );
  end if;

  if p_operation is distinct from 'confirm_source_matching' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Unknown DATA matching operation'
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
      'message', 'Client matching targets and source rows are not accepted'
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
    872018,
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
      'message', 'DATA-1H matching supports customer only'
    );
  end if;

  if v_session.status = 'cancelled' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Cancelled sessions cannot accept matching'
    );
  end if;

  if v_session.status not in ('review_required', 'ready_for_approval') then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Matching requires a completed staging generation'
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
  v_next_status := nullif(btrim(p_payload->>'next_status'), '');
  v_rows := p_payload->'match_rows';

  begin
    v_payload_eligible := (p_payload->>'eligible_rows')::integer;
    v_payload_exact := (p_payload->>'exact_matches')::integer;
    v_payload_no_match := (p_payload->>'no_matches')::integer;
    v_payload_no_key := (p_payload->>'no_key_rows')::integer;
    v_payload_ambiguous := (p_payload->>'ambiguous_rows')::integer;
    v_payload_collisions := (p_payload->>'collisions')::integer;
    v_payload_blocked := (p_payload->>'blocked_skipped')::integer;
  exception
    when others then
      return jsonb_build_object(
        'ok', false,
        'code', 'SOURCE_INVALID',
        'message', 'Matching summary does not match row outcomes'
      );
  end;

  if v_mapping_hash !~ '^[0-9a-f]{64}$' or v_source_sha256 !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object(
      'ok', false,
      'code', 'MAPPING_HASH_MISMATCH',
      'message', 'Matching is bound to the current confirmed mapping hash'
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

  if v_next_status not in ('review_required', 'ready_for_approval') then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Unknown DATA matching completion status'
    );
  end if;

  if v_session.status = 'review_required' and v_next_status = 'ready_for_approval' then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Matching cannot leave review_required without revalidation'
    );
  end if;

  if v_rows is null or jsonb_typeof(v_rows) is distinct from 'array' then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'match_rows must be an array'
    );
  end if;

  select count(*)
    into v_existing_count
  from public.data_intake_staging_rows as r
  where r.organization_id = p_organization_id
    and r.source_id = v_source.id;

  if v_existing_count = 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_STATE',
      'message', 'Matching requires completed staging rows'
    );
  end if;

  if v_existing_count is distinct from jsonb_array_length(v_rows) then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'Matching rows must cover the current staging set'
    );
  end if;

  for v_row in
    select value
    from jsonb_array_elements(v_rows) as t(value)
  loop
    begin
      v_row_number := (v_row->>'source_row_number')::integer;
    exception
      when others then
        return jsonb_build_object(
          'ok', false,
          'code', 'SOURCE_INVALID',
          'message', 'Each match row must be an object'
        );
    end;

    v_resolution := nullif(btrim(v_row->>'resolution'), '');
    v_target_operation := nullif(btrim(v_row->>'target_operation'), '');
    v_match_kind := nullif(btrim(v_row->>'match_kind'), '');
    v_target_id := null;

    if v_row ? 'target_record_id' and v_row->>'target_record_id' is not null then
      begin
        v_target_id := (v_row->>'target_record_id')::uuid;
      exception
        when invalid_text_representation then
          return jsonb_build_object(
            'ok', false,
            'code', 'SOURCE_INVALID',
            'message', 'target_record_id is only valid for an exact link candidate'
          );
      end;
    end if;

    select r.*
      into v_existing
    from public.data_intake_staging_rows as r
    where r.organization_id = p_organization_id
      and r.source_id = v_source.id
      and r.source_row_number = v_row_number;

    if v_existing.id is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'SOURCE_INVALID',
        'message', 'Matching row is not part of the staged set'
      );
    end if;

    if v_resolution not in ('none', 'create', 'duplicate', 'conflict')
      or (
        v_target_operation is not null
        and v_target_operation not in ('create', 'link')
      )
    then
      return jsonb_build_object(
        'ok', false,
        'code', 'SOURCE_INVALID',
        'message', 'Matching row failed the frozen resolution contract'
      );
    end if;

    if v_existing.lifecycle = 'blocked' then
      if v_resolution is distinct from 'none'
        or v_target_operation is not null
        or v_target_id is not null
      then
        return jsonb_build_object(
          'ok', false,
          'code', 'SOURCE_INVALID',
          'message', 'Blocked rows cannot receive matching targets'
        );
      end if;
    end if;

    if v_target_id is not null then
      if v_resolution is distinct from 'duplicate' or v_target_operation is distinct from 'link' then
        return jsonb_build_object(
          'ok', false,
          'code', 'SOURCE_INVALID',
          'message', 'target_record_id is only valid for an exact link candidate'
        );
      end if;

      select c.id, c.email
        into v_customer_id, v_customer_email
      from public.customers as c
      where c.organization_id = p_organization_id
        and c.id = v_target_id;

      if v_customer_id is null then
        return jsonb_build_object(
          'ok', false,
          'code', 'SOURCE_INVALID',
          'message', 'target_record_id must resolve to a same-organization Customer'
        );
      end if;

      v_staged_email := nullif(btrim(v_existing.normalized_values->>'email'), '');
      if v_customer_email is null
        or v_staged_email is null
        or v_customer_email is distinct from v_staged_email
      then
        return jsonb_build_object(
          'ok', false,
          'code', 'SOURCE_INVALID',
          'message', 'target_record_id failed the deterministic email rule'
        );
      end if;
    end if;

    if v_match_kind = 'exact' then
      v_exact := v_exact + 1;
    elsif v_match_kind = 'no_match' then
      v_no_match := v_no_match + 1;
    elsif v_match_kind = 'no_key' then
      v_no_key := v_no_key + 1;
    elsif v_match_kind = 'ambiguous' then
      v_ambiguous := v_ambiguous + 1;
    elsif v_match_kind = 'collision' then
      v_collisions := v_collisions + 1;
    elsif v_match_kind = 'skipped' then
      v_blocked := v_blocked + 1;
    else
      return jsonb_build_object(
        'ok', false,
        'code', 'SOURCE_INVALID',
        'message', 'Matching summary does not match row outcomes'
      );
    end if;
  end loop;

  v_eligible := jsonb_array_length(v_rows) - v_blocked;

  if v_payload_eligible is distinct from v_eligible
    or v_payload_exact is distinct from v_exact
    or v_payload_no_match is distinct from v_no_match
    or v_payload_no_key is distinct from v_no_key
    or v_payload_ambiguous is distinct from v_ambiguous
    or v_payload_collisions is distinct from v_collisions
    or v_payload_blocked is distinct from v_blocked
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'SOURCE_INVALID',
      'message', 'Matching summary does not match row outcomes'
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

  if v_last_meta is not null
    and v_last_meta->>'mapping_hash' is not distinct from v_mapping_hash
    and v_last_meta->>'matcher_version' is not distinct from v_matcher_version
    and not exists (
      select 1
      from jsonb_array_elements(v_rows) as elem
      where not exists (
        select 1
        from public.data_intake_staging_rows as r
        where r.organization_id = p_organization_id
          and r.source_id = v_source.id
          and r.source_row_number = (elem->>'source_row_number')::integer
          and r.resolution is not distinct from elem->>'resolution'
          and r.target_operation is not distinct from nullif(elem->>'target_operation', '')
          and r.target_record_id::text is not distinct from nullif(elem->>'target_record_id', '')
      )
    )
  then
    v_replayed := true;
    select e.id
      into v_event_id
    from public.data_intake_events as e
    where e.organization_id = p_organization_id
      and e.session_id = v_session.id
      and e.event_type = 'matching_completed'
    order by e.created_at desc
    limit 1;
  else
    for v_row in
      select value
      from jsonb_array_elements(v_rows) as t(value)
    loop
      v_row_number := (v_row->>'source_row_number')::integer;
      v_resolution := nullif(btrim(v_row->>'resolution'), '');
      v_target_operation := nullif(btrim(v_row->>'target_operation'), '');
      v_target_id := null;
      if v_row ? 'target_record_id' and v_row->>'target_record_id' is not null then
        v_target_id := (v_row->>'target_record_id')::uuid;
      end if;

      update public.data_intake_staging_rows
      set
        resolution = v_resolution,
        target_operation = v_target_operation,
        target_record_id = v_target_id,
        updated_at = pg_catalog.now()
      where organization_id = p_organization_id
        and source_id = v_source.id
        and source_row_number = v_row_number
        and raw_values is not distinct from raw_values
        and normalized_values is not distinct from normalized_values
        and row_fingerprint is not distinct from row_fingerprint
        and error_codes is not distinct from error_codes;
    end loop;

    if v_session.status is distinct from v_next_status then
      update public.data_intake_sessions
      set status = v_next_status
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
      'matching_completed',
      p_actor_user_id,
      jsonb_build_object(
        'source_id', v_source.id,
        'mapping_hash', v_mapping_hash,
        'matcher_version', v_matcher_version,
        'eligible_rows', v_eligible,
        'exact_matches', v_exact,
        'no_matches', v_no_match,
        'no_key_rows', v_no_key,
        'ambiguous_rows', v_ambiguous,
        'collisions', v_collisions,
        'blocked_skipped', v_blocked
      )
    )
    returning id into v_event_id;
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
    'event_type', 'matching_completed',
    'replayed', v_replayed,
    'mapping_hash', v_mapping_hash,
    'summary', jsonb_build_object(
      'eligible_rows', v_eligible,
      'exact_matches', v_exact,
      'no_matches', v_no_match,
      'no_key_rows', v_no_key,
      'ambiguous_rows', v_ambiguous,
      'collisions', v_collisions,
      'blocked_skipped', v_blocked,
      'matcher_version', v_matcher_version
    )
  );
end;
$$;

comment on function public.apply_data_intake_matching_mutation(text, uuid, uuid, uuid, jsonb) is
  'DATA-1H service_role-only deterministic Customer matching mutation. Human Owner/Admin identity is required. No Customer writes. No import plans. Matching is a proposed identity classification only.';

revoke all on function public.apply_data_intake_matching_mutation(text, uuid, uuid, uuid, jsonb) from public;
revoke all on function public.apply_data_intake_matching_mutation(text, uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_data_intake_matching_mutation(text, uuid, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_data_intake_matching_mutation(text, uuid, uuid, uuid, jsonb) from service_role;

grant execute on function public.apply_data_intake_matching_mutation(text, uuid, uuid, uuid, jsonb) to service_role;
