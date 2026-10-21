-- ZyntixAI B1.7.3 Attention RPC Foundation:
-- private helpers and controlled Attention mutation RPCs

create or replace function private.get_attention_actor_membership(
  p_organization_id uuid
)
returns table (
  membership_id uuid,
  member_role text
)
language sql
stable
security definer
set search_path = ''
as $$
  select om.id, om.role
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.user_id = auth.uid()
    and om.status = 'active'
  limit 1;
$$;

revoke all on function private.get_attention_actor_membership(uuid) from public;
revoke all on function private.get_attention_actor_membership(uuid) from anon;
revoke all on function private.get_attention_actor_membership(uuid) from authenticated;

create or replace function private.assert_active_attention_organization(
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
  end if;
end;
$$;

revoke all on function private.assert_active_attention_organization(uuid) from public;
revoke all on function private.assert_active_attention_organization(uuid) from anon;
revoke all on function private.assert_active_attention_organization(uuid) from authenticated;

create or replace function private.require_attention_actor(
  p_organization_id uuid,
  p_allowed_roles text[]
)
returns table (
  membership_id uuid,
  member_role text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_attention_actor_membership(p_organization_id) as actor;

  if v_membership_id is null
     or v_member_role is null
     or v_member_role <> all (p_allowed_roles)
  then
    raise exception 'insufficient role';
  end if;

  perform private.assert_active_attention_organization(p_organization_id);

  membership_id := v_membership_id;
  member_role := v_member_role;
  return next;
end;
$$;

revoke all on function private.require_attention_actor(uuid, text[]) from public;
revoke all on function private.require_attention_actor(uuid, text[]) from anon;
revoke all on function private.require_attention_actor(uuid, text[]) from authenticated;

create or replace function private.validate_attention_member_assignment(
  p_organization_id uuid,
  p_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_member_id is null then
    return;
  end if;

  if not exists (
    select 1
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.id = p_member_id
      and om.status = 'active'
  ) then
    raise exception 'invalid member assignment for organization';
  end if;
end;
$$;

revoke all on function private.validate_attention_member_assignment(uuid, uuid) from public;
revoke all on function private.validate_attention_member_assignment(uuid, uuid) from anon;
revoke all on function private.validate_attention_member_assignment(uuid, uuid) from authenticated;

create or replace function private.is_allowed_attention_status_transition(
  p_from_status text,
  p_to_status text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from_status = 'open'
      and p_to_status in ('acknowledged', 'resolved', 'dismissed', 'expired') then true
    when p_from_status = 'acknowledged'
      and p_to_status in ('resolved', 'dismissed', 'expired') then true
    else false
  end;
$$;

revoke all on function private.is_allowed_attention_status_transition(text, text) from public;
revoke all on function private.is_allowed_attention_status_transition(text, text) from anon;
revoke all on function private.is_allowed_attention_status_transition(text, text) from authenticated;

create or replace function private.insert_attention_item_event(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_event_type text,
  p_from_status text,
  p_to_status text,
  p_from_severity text,
  p_to_severity text,
  p_from_assignee_member_id uuid,
  p_to_assignee_member_id uuid,
  p_reason text,
  p_source text,
  p_actor_member_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.attention_item_events (
    organization_id,
    attention_item_id,
    event_type,
    from_status,
    to_status,
    from_severity,
    to_severity,
    from_assignee_member_id,
    to_assignee_member_id,
    reason,
    source,
    actor_member_id,
    payload
  )
  values (
    p_organization_id,
    p_attention_item_id,
    p_event_type,
    p_from_status,
    p_to_status,
    p_from_severity,
    p_to_severity,
    p_from_assignee_member_id,
    p_to_assignee_member_id,
    p_reason,
    p_source,
    p_actor_member_id,
    coalesce(p_payload, '{}'::jsonb)
  );
$$;

revoke all on function private.insert_attention_item_event(
  uuid, uuid, text, text, text, text, text, uuid, uuid, text, text, uuid, jsonb
) from public;
revoke all on function private.insert_attention_item_event(
  uuid, uuid, text, text, text, text, text, uuid, uuid, text, text, uuid, jsonb
) from anon;
revoke all on function private.insert_attention_item_event(
  uuid, uuid, text, text, text, text, text, uuid, uuid, text, text, uuid, jsonb
) from authenticated;

create or replace function private.validate_attention_signal_evidence(
  p_evidence jsonb
)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_kind text;
begin
  if p_evidence is null or jsonb_typeof(p_evidence) <> 'object' then
    raise exception 'invalid attention signal evidence';
  end if;

  v_kind := nullif(btrim(coalesce(p_evidence ->> 'kind', '')), '');
  if v_kind is null or v_kind not in ('manual_note', 'stale_progress', 'generic') then
    raise exception 'invalid attention signal evidence';
  end if;

  return p_evidence;
end;
$$;

revoke all on function private.validate_attention_signal_evidence(jsonb) from public;
revoke all on function private.validate_attention_signal_evidence(jsonb) from anon;
revoke all on function private.validate_attention_signal_evidence(jsonb) from authenticated;

create or replace function private.build_attention_dedupe_key(
  p_organization_id uuid,
  p_enrollment_id uuid,
  p_signal_key text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'attention:enrollment:'
    || p_organization_id::text
    || ':'
    || p_enrollment_id::text
    || ':'
    || p_signal_key;
$$;

revoke all on function private.build_attention_dedupe_key(uuid, uuid, text) from public;
revoke all on function private.build_attention_dedupe_key(uuid, uuid, text) from anon;
revoke all on function private.build_attention_dedupe_key(uuid, uuid, text) from authenticated;

create or replace function private.lock_attention_item(
  p_organization_id uuid,
  p_attention_item_id uuid
)
returns public.attention_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.attention_items;
begin
  select ai.*
  into v_item
  from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.id = p_attention_item_id
  for update;

  if not found then
    raise exception 'attention item not found';
  end if;

  return v_item;
end;
$$;

revoke all on function private.lock_attention_item(uuid, uuid) from public;
revoke all on function private.lock_attention_item(uuid, uuid) from anon;
revoke all on function private.lock_attention_item(uuid, uuid) from authenticated;

create or replace function private.append_attention_signal(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_enrollment_id uuid,
  p_signal_origin text,
  p_rule_key text,
  p_explanation text,
  p_evidence jsonb,
  p_detected_at timestamptz,
  p_created_by_member_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_explanation text;
  v_evidence jsonb;
  v_signal_id uuid;
begin
  v_explanation := btrim(coalesce(p_explanation, ''));
  if char_length(v_explanation) = 0 or char_length(v_explanation) > 2000 then
    raise exception 'invalid attention signal explanation';
  end if;

  v_evidence := private.validate_attention_signal_evidence(p_evidence);

  if p_signal_origin = 'manual' then
    if p_rule_key is not null then
      raise exception 'invalid attention signal origin/rule combination';
    end if;
  elsif p_signal_origin = 'rule' then
    if p_rule_key is distinct from 'enrollment_no_recent_progress' then
      raise exception 'invalid attention rule key';
    end if;
  else
    raise exception 'invalid attention signal origin';
  end if;

  insert into public.attention_signals (
    organization_id,
    attention_item_id,
    enrollment_id,
    signal_origin,
    rule_key,
    explanation,
    evidence,
    detected_at,
    created_by_member_id
  )
  values (
    p_organization_id,
    p_attention_item_id,
    p_enrollment_id,
    p_signal_origin,
    p_rule_key,
    v_explanation,
    v_evidence,
    coalesce(p_detected_at, pg_catalog.now()),
    p_created_by_member_id
  )
  returning id into v_signal_id;

  return v_signal_id;
end;
$$;

revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from public;
revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from anon;
revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from authenticated;

create or replace function private.expire_attention_item(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_expired_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.attention_items;
  v_expired_at timestamptz;
begin
  v_item := private.lock_attention_item(p_organization_id, p_attention_item_id);

  if v_item.archived_at is not null then
    raise exception 'attention item is archived';
  end if;

  if v_item.status = 'expired' then
    return;
  end if;

  if not private.is_allowed_attention_status_transition(v_item.status, 'expired') then
    raise exception 'invalid attention status transition';
  end if;

  v_expired_at := coalesce(p_expired_at, pg_catalog.now());

  update public.attention_items as ai
  set
    status = 'expired',
    expired_at = v_expired_at,
    updated_by_member_id = null
  where ai.organization_id = p_organization_id
    and ai.id = p_attention_item_id;

  perform private.insert_attention_item_event(
    p_organization_id,
    p_attention_item_id,
    'status_changed',
    v_item.status,
    'expired',
    null,
    null,
    null,
    null,
    null,
    'system',
    null,
    jsonb_build_object('expired_at', v_expired_at)
  );
end;
$$;

revoke all on function private.expire_attention_item(uuid, uuid, timestamptz) from public;
revoke all on function private.expire_attention_item(uuid, uuid, timestamptz) from anon;
revoke all on function private.expire_attention_item(uuid, uuid, timestamptz) from authenticated;

create or replace function private.enrollment_stale_progress_reference_at(
  p_organization_id uuid,
  p_enrollment_id uuid
)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_ref timestamptz;
  v_created_at timestamptz;
begin
  select max(epf.occurred_at)
  into v_ref
  from public.enrollment_progress_facts as epf
  where epf.organization_id = p_organization_id
    and epf.enrollment_id = p_enrollment_id
    and epf.voided_at is null;

  if v_ref is not null then
    return v_ref;
  end if;

  select e.created_at
  into v_created_at
  from public.enrollments as e
  where e.organization_id = p_organization_id
    and e.id = p_enrollment_id;

  return v_created_at;
end;
$$;

revoke all on function private.enrollment_stale_progress_reference_at(uuid, uuid) from public;
revoke all on function private.enrollment_stale_progress_reference_at(uuid, uuid) from anon;
revoke all on function private.enrollment_stale_progress_reference_at(uuid, uuid) from authenticated;

create or replace function private.is_enrollment_stale_for_attention(
  p_organization_id uuid,
  p_enrollment_id uuid,
  p_as_of timestamptz default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_as_of timestamptz;
  v_ref timestamptz;
  v_age_days integer;
begin
  v_as_of := coalesce(p_as_of, pg_catalog.now());
  v_ref := private.enrollment_stale_progress_reference_at(
    p_organization_id,
    p_enrollment_id
  );

  if v_ref is null then
    return false;
  end if;

  v_age_days := (v_as_of at time zone 'UTC')::date
    - (v_ref at time zone 'UTC')::date;

  return v_age_days >= 14;
end;
$$;

revoke all on function private.is_enrollment_stale_for_attention(uuid, uuid, timestamptz) from public;
revoke all on function private.is_enrollment_stale_for_attention(uuid, uuid, timestamptz) from anon;
revoke all on function private.is_enrollment_stale_for_attention(uuid, uuid, timestamptz) from authenticated;

-- Public RPCs

create or replace function public.create_manual_attention_item(
  p_organization_id uuid,
  p_enrollment_id uuid,
  p_title text,
  p_explanation text,
  p_summary text default null,
  p_severity text default 'medium',
  p_evidence_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_title text;
  v_summary text;
  v_severity text;
  v_explanation text;
  v_customer_id uuid;
  v_program_id uuid;
  v_dedupe_key text;
  v_existing_id uuid;
  v_item_id uuid;
  v_signal_id uuid;
  v_evidence jsonb;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_title := btrim(coalesce(p_title, ''));
  if char_length(v_title) = 0 or char_length(v_title) > 200 then
    raise exception 'invalid attention title';
  end if;

  v_summary := nullif(btrim(coalesce(p_summary, '')), '');
  if v_summary is not null and char_length(v_summary) > 2000 then
    raise exception 'invalid attention summary';
  end if;

  v_severity := coalesce(nullif(btrim(p_severity), ''), 'medium');
  if v_severity not in ('low', 'medium', 'high', 'critical') then
    raise exception 'invalid attention severity';
  end if;

  v_explanation := btrim(coalesce(p_explanation, ''));
  if char_length(v_explanation) = 0 or char_length(v_explanation) > 2000 then
    raise exception 'invalid attention signal explanation';
  end if;

  select e.customer_id, e.program_id
  into v_customer_id, v_program_id
  from public.enrollments as e
  where e.organization_id = p_organization_id
    and e.id = p_enrollment_id
    and e.archived_at is null;

  if not found then
    raise exception 'enrollment not found';
  end if;

  v_dedupe_key := private.build_attention_dedupe_key(
    p_organization_id,
    p_enrollment_id,
    'manual'
  );

  select ai.id
  into v_existing_id
  from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.enrollment_id = p_enrollment_id
    and ai.dedupe_key = v_dedupe_key
    and ai.status in ('open', 'acknowledged')
  for update;

  if found then
    raise exception 'attention item already open for dedupe key';
  end if;

  v_evidence := jsonb_build_object('kind', 'manual_note');
  if nullif(btrim(coalesce(p_evidence_note, '')), '') is not null then
    v_evidence := v_evidence || jsonb_build_object(
      'note',
      btrim(p_evidence_note)
    );
  end if;

  insert into public.attention_items (
    organization_id,
    enrollment_id,
    customer_id,
    program_id,
    title,
    summary,
    status,
    severity,
    dedupe_key,
    created_by_member_id,
    updated_by_member_id
  )
  values (
    p_organization_id,
    p_enrollment_id,
    v_customer_id,
    v_program_id,
    v_title,
    v_summary,
    'open',
    v_severity,
    v_dedupe_key,
    v_membership_id,
    v_membership_id
  )
  returning id into v_item_id;

  v_signal_id := private.append_attention_signal(
    p_organization_id,
    v_item_id,
    p_enrollment_id,
    'manual',
    null,
    v_explanation,
    v_evidence,
    pg_catalog.now(),
    v_membership_id
  );

  perform private.insert_attention_item_event(
    p_organization_id,
    v_item_id,
    'created',
    null,
    'open',
    null,
    v_severity,
    null,
    null,
    null,
    'manual',
    v_membership_id,
    jsonb_build_object('signal_id', v_signal_id, 'dedupe_key', v_dedupe_key)
  );

  return v_item_id;
end;
$$;

create or replace function public.record_attention_signal(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_explanation text,
  p_evidence jsonb default '{"kind":"manual_note"}'::jsonb,
  p_detected_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_item public.attention_items;
  v_signal_id uuid;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_item := private.lock_attention_item(p_organization_id, p_attention_item_id);

  if v_item.archived_at is not null then
    raise exception 'attention item is archived';
  end if;

  if v_item.status in ('resolved', 'dismissed', 'expired') then
    raise exception 'attention item is terminal';
  end if;

  v_signal_id := private.append_attention_signal(
    p_organization_id,
    v_item.id,
    v_item.enrollment_id,
    'manual',
    null,
    p_explanation,
    coalesce(p_evidence, '{"kind":"manual_note"}'::jsonb),
    coalesce(p_detected_at, pg_catalog.now()),
    v_membership_id
  );

  update public.attention_items as ai
  set
    detection_count = ai.detection_count + 1,
    last_detected_at = coalesce(p_detected_at, pg_catalog.now()),
    updated_by_member_id = v_membership_id
  where ai.organization_id = p_organization_id
    and ai.id = v_item.id;

  perform private.insert_attention_item_event(
    p_organization_id,
    v_item.id,
    'signal_recorded',
    v_item.status,
    v_item.status,
    null,
    null,
    null,
    null,
    null,
    'manual',
    v_membership_id,
    jsonb_build_object('signal_id', v_signal_id)
  );

  perform private.insert_attention_item_event(
    p_organization_id,
    v_item.id,
    'detection_updated',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    'manual',
    v_membership_id,
    jsonb_build_object(
      'detection_count',
      v_item.detection_count + 1
    )
  );

  return v_signal_id;
end;
$$;

create or replace function public.acknowledge_attention_item(
  p_organization_id uuid,
  p_attention_item_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_item public.attention_items;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_item := private.lock_attention_item(p_organization_id, p_attention_item_id);

  if v_item.archived_at is not null then
    raise exception 'attention item is archived';
  end if;

  if v_item.status = 'acknowledged' then
    return;
  end if;

  if not private.is_allowed_attention_status_transition(v_item.status, 'acknowledged') then
    raise exception 'invalid attention status transition';
  end if;

  update public.attention_items as ai
  set
    status = 'acknowledged',
    acknowledged_at = pg_catalog.now(),
    updated_by_member_id = v_membership_id
  where ai.organization_id = p_organization_id
    and ai.id = p_attention_item_id;

  perform private.insert_attention_item_event(
    p_organization_id,
    p_attention_item_id,
    'status_changed',
    v_item.status,
    'acknowledged',
    null,
    null,
    null,
    null,
    null,
    'manual',
    v_membership_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.assign_attention_item(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_assignee_member_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_item public.attention_items;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_item := private.lock_attention_item(p_organization_id, p_attention_item_id);

  if v_item.archived_at is not null then
    raise exception 'attention item is archived';
  end if;

  if v_item.status in ('resolved', 'dismissed', 'expired') then
    raise exception 'attention item is terminal';
  end if;

  perform private.validate_attention_member_assignment(
    p_organization_id,
    p_assignee_member_id
  );

  if v_item.assignee_member_id is not distinct from p_assignee_member_id then
    return;
  end if;

  update public.attention_items as ai
  set
    assignee_member_id = p_assignee_member_id,
    updated_by_member_id = v_membership_id
  where ai.organization_id = p_organization_id
    and ai.id = p_attention_item_id;

  perform private.insert_attention_item_event(
    p_organization_id,
    p_attention_item_id,
    'assigned',
    null,
    null,
    null,
    null,
    v_item.assignee_member_id,
    p_assignee_member_id,
    null,
    'manual',
    v_membership_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.update_attention_severity(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_severity text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_item public.attention_items;
  v_severity text;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_severity := btrim(coalesce(p_severity, ''));
  if v_severity not in ('low', 'medium', 'high', 'critical') then
    raise exception 'invalid attention severity';
  end if;

  v_item := private.lock_attention_item(p_organization_id, p_attention_item_id);

  if v_item.archived_at is not null then
    raise exception 'attention item is archived';
  end if;

  if v_item.status in ('resolved', 'dismissed', 'expired') then
    raise exception 'attention item is terminal';
  end if;

  if v_item.severity = v_severity then
    return;
  end if;

  update public.attention_items as ai
  set
    severity = v_severity,
    updated_by_member_id = v_membership_id
  where ai.organization_id = p_organization_id
    and ai.id = p_attention_item_id;

  perform private.insert_attention_item_event(
    p_organization_id,
    p_attention_item_id,
    'severity_changed',
    null,
    null,
    v_item.severity,
    v_severity,
    null,
    null,
    null,
    'manual',
    v_membership_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.resolve_attention_item(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_resolution_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_item public.attention_items;
  v_reason text;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_reason := btrim(coalesce(p_resolution_reason, ''));
  if char_length(v_reason) = 0 or char_length(v_reason) > 2000 then
    raise exception 'resolution reason required';
  end if;

  v_item := private.lock_attention_item(p_organization_id, p_attention_item_id);

  if v_item.archived_at is not null then
    raise exception 'attention item is archived';
  end if;

  if v_item.status = 'resolved' then
    return;
  end if;

  if not private.is_allowed_attention_status_transition(v_item.status, 'resolved') then
    raise exception 'invalid attention status transition';
  end if;

  update public.attention_items as ai
  set
    status = 'resolved',
    resolved_at = pg_catalog.now(),
    resolution_reason = v_reason,
    updated_by_member_id = v_membership_id
  where ai.organization_id = p_organization_id
    and ai.id = p_attention_item_id;

  perform private.insert_attention_item_event(
    p_organization_id,
    p_attention_item_id,
    'status_changed',
    v_item.status,
    'resolved',
    null,
    null,
    null,
    null,
    v_reason,
    'manual',
    v_membership_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.dismiss_attention_item(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_dismissal_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_item public.attention_items;
  v_reason text;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin', 'staff']::text[]
  ) as actor;

  v_reason := btrim(coalesce(p_dismissal_reason, ''));
  if char_length(v_reason) = 0 or char_length(v_reason) > 2000 then
    raise exception 'dismissal reason required';
  end if;

  v_item := private.lock_attention_item(p_organization_id, p_attention_item_id);

  if v_item.archived_at is not null then
    raise exception 'attention item is archived';
  end if;

  if v_item.status = 'dismissed' then
    return;
  end if;

  if not private.is_allowed_attention_status_transition(v_item.status, 'dismissed') then
    raise exception 'invalid attention status transition';
  end if;

  update public.attention_items as ai
  set
    status = 'dismissed',
    dismissed_at = pg_catalog.now(),
    dismissal_reason = v_reason,
    updated_by_member_id = v_membership_id
  where ai.organization_id = p_organization_id
    and ai.id = p_attention_item_id;

  perform private.insert_attention_item_event(
    p_organization_id,
    p_attention_item_id,
    'status_changed',
    v_item.status,
    'dismissed',
    null,
    null,
    null,
    null,
    v_reason,
    'manual',
    v_membership_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.archive_attention_item(
  p_organization_id uuid,
  p_attention_item_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_item public.attention_items;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin']::text[]
  ) as actor;

  v_item := private.lock_attention_item(p_organization_id, p_attention_item_id);

  if v_item.archived_at is not null then
    raise exception 'attention item already archived';
  end if;

  if v_item.status not in ('resolved', 'dismissed', 'expired') then
    raise exception 'only terminal attention items can be archived';
  end if;

  update public.attention_items as ai
  set
    archived_at = pg_catalog.now(),
    updated_by_member_id = v_membership_id
  where ai.organization_id = p_organization_id
    and ai.id = p_attention_item_id
    and ai.archived_at is null;

  perform private.insert_attention_item_event(
    p_organization_id,
    p_attention_item_id,
    'archived',
    v_item.status,
    v_item.status,
    null,
    null,
    null,
    null,
    null,
    'manual',
    v_membership_id,
    '{}'::jsonb
  );
end;
$$;

create or replace function public.evaluate_attention_rules(
  p_organization_id uuid,
  p_enrollment_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_as_of timestamptz := pg_catalog.now();
  v_created integer := 0;
  v_updated integer := 0;
  v_expired integer := 0;
  v_enrollment record;
  v_dedupe_key text;
  v_item public.attention_items;
  v_item_id uuid;
  v_signal_id uuid;
  v_ref timestamptz;
  v_age_days integer;
  v_evidence jsonb;
  v_explanation text;
  v_has_item boolean;
  v_is_stale boolean;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin']::text[]
  ) as actor;

  for v_enrollment in
    select e.id, e.customer_id, e.program_id, e.status, e.created_at
    from public.enrollments as e
    where e.organization_id = p_organization_id
      and e.archived_at is null
      and e.status in ('active', 'paused')
      and (p_enrollment_id is null or e.id = p_enrollment_id)
  loop
    v_dedupe_key := private.build_attention_dedupe_key(
      p_organization_id,
      v_enrollment.id,
      'enrollment_no_recent_progress'
    );

    select ai.*
    into v_item
    from public.attention_items as ai
    where ai.organization_id = p_organization_id
      and ai.enrollment_id = v_enrollment.id
      and ai.dedupe_key = v_dedupe_key
      and ai.status in ('open', 'acknowledged')
    for update;

    v_has_item := found;

    v_is_stale := private.is_enrollment_stale_for_attention(
      p_organization_id,
      v_enrollment.id,
      v_as_of
    );

    if v_is_stale then
      v_ref := private.enrollment_stale_progress_reference_at(
        p_organization_id,
        v_enrollment.id
      );
      v_age_days := (v_as_of at time zone 'UTC')::date
        - (v_ref at time zone 'UTC')::date;
      v_evidence := jsonb_build_object(
        'kind', 'stale_progress',
        'referenceOccurredAt', v_ref,
        'evaluationOccurredAt', v_as_of,
        'ageCalendarDays', v_age_days
      );
      v_explanation := 'No recent progress for '
        || v_age_days::text
        || ' calendar days (UTC).';

      if v_has_item then
        v_signal_id := private.append_attention_signal(
          p_organization_id,
          v_item.id,
          v_enrollment.id,
          'rule',
          'enrollment_no_recent_progress',
          v_explanation,
          v_evidence,
          v_as_of,
          null
        );

        update public.attention_items as ai
        set
          detection_count = ai.detection_count + 1,
          last_detected_at = v_as_of,
          updated_by_member_id = v_membership_id
        where ai.organization_id = p_organization_id
          and ai.id = v_item.id;

        perform private.insert_attention_item_event(
          p_organization_id,
          v_item.id,
          'signal_recorded',
          v_item.status,
          v_item.status,
          null,
          null,
          null,
          null,
          null,
          'rule',
          v_membership_id,
          jsonb_build_object('signal_id', v_signal_id)
        );

        perform private.insert_attention_item_event(
          p_organization_id,
          v_item.id,
          'detection_updated',
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          'rule',
          v_membership_id,
          jsonb_build_object('detection_count', v_item.detection_count + 1)
        );

        v_updated := v_updated + 1;
      else
        insert into public.attention_items (
          organization_id,
          enrollment_id,
          customer_id,
          program_id,
          title,
          summary,
          status,
          severity,
          dedupe_key,
          first_detected_at,
          last_detected_at,
          created_by_member_id,
          updated_by_member_id
        )
        values (
          p_organization_id,
          v_enrollment.id,
          v_enrollment.customer_id,
          v_enrollment.program_id,
          'No recent enrollment progress',
          'Enrollment has no qualifying progress within the stale threshold.',
          'open',
          'medium',
          v_dedupe_key,
          v_as_of,
          v_as_of,
          v_membership_id,
          v_membership_id
        )
        returning id into v_item_id;

        v_signal_id := private.append_attention_signal(
          p_organization_id,
          v_item_id,
          v_enrollment.id,
          'rule',
          'enrollment_no_recent_progress',
          v_explanation,
          v_evidence,
          v_as_of,
          null
        );

        perform private.insert_attention_item_event(
          p_organization_id,
          v_item_id,
          'created',
          null,
          'open',
          null,
          'medium',
          null,
          null,
          null,
          'rule',
          v_membership_id,
          jsonb_build_object(
            'signal_id', v_signal_id,
            'rule_key', 'enrollment_no_recent_progress'
          )
        );

        v_created := v_created + 1;
      end if;
    else
      if v_has_item then
        perform private.expire_attention_item(
          p_organization_id,
          v_item.id,
          v_as_of
        );
        v_expired := v_expired + 1;
      end if;
    end if;
  end loop;

  if p_enrollment_id is not null and v_created = 0 and v_updated = 0 and v_expired = 0 then
    if not exists (
      select 1
      from public.enrollments as e
      where e.organization_id = p_organization_id
        and e.id = p_enrollment_id
    ) then
      raise exception 'enrollment not found';
    end if;
  end if;

  return jsonb_build_object(
    'created', v_created,
    'updated', v_updated,
    'expired', v_expired,
    'evaluatedAt', v_as_of
  );
end;
$$;

comment on function public.create_manual_attention_item(uuid, uuid, text, text, text, text, text) is
  'Creates a manual Attention Item and initial Signal for an Enrollment.';
comment on function public.record_attention_signal(uuid, uuid, text, jsonb, timestamptz) is
  'Appends a manual Attention Signal to a non-terminal Item.';
comment on function public.acknowledge_attention_item(uuid, uuid) is
  'Acknowledges an open Attention Item.';
comment on function public.assign_attention_item(uuid, uuid, uuid) is
  'Assigns or unassigns a single active organization member.';
comment on function public.update_attention_severity(uuid, uuid, text) is
  'Updates Attention Item severity with audit.';
comment on function public.resolve_attention_item(uuid, uuid, text) is
  'Resolves an Attention Item with required reason.';
comment on function public.dismiss_attention_item(uuid, uuid, text) is
  'Dismisses an Attention Item with required reason (Staff allowed).';
comment on function public.archive_attention_item(uuid, uuid) is
  'Soft-archives a terminal Attention Item (Owner/Admin only).';
comment on function public.evaluate_attention_rules(uuid, uuid) is
  'Owner/Admin re-evaluation of enrollment_no_recent_progress (no scheduler).';

revoke all on function public.create_manual_attention_item(uuid, uuid, text, text, text, text, text) from public;
revoke all on function public.create_manual_attention_item(uuid, uuid, text, text, text, text, text) from anon;
grant execute on function public.create_manual_attention_item(uuid, uuid, text, text, text, text, text) to authenticated;

revoke all on function public.record_attention_signal(uuid, uuid, text, jsonb, timestamptz) from public;
revoke all on function public.record_attention_signal(uuid, uuid, text, jsonb, timestamptz) from anon;
grant execute on function public.record_attention_signal(uuid, uuid, text, jsonb, timestamptz) to authenticated;

revoke all on function public.acknowledge_attention_item(uuid, uuid) from public;
revoke all on function public.acknowledge_attention_item(uuid, uuid) from anon;
grant execute on function public.acknowledge_attention_item(uuid, uuid) to authenticated;

revoke all on function public.assign_attention_item(uuid, uuid, uuid) from public;
revoke all on function public.assign_attention_item(uuid, uuid, uuid) from anon;
grant execute on function public.assign_attention_item(uuid, uuid, uuid) to authenticated;

revoke all on function public.update_attention_severity(uuid, uuid, text) from public;
revoke all on function public.update_attention_severity(uuid, uuid, text) from anon;
grant execute on function public.update_attention_severity(uuid, uuid, text) to authenticated;

revoke all on function public.resolve_attention_item(uuid, uuid, text) from public;
revoke all on function public.resolve_attention_item(uuid, uuid, text) from anon;
grant execute on function public.resolve_attention_item(uuid, uuid, text) to authenticated;

revoke all on function public.dismiss_attention_item(uuid, uuid, text) from public;
revoke all on function public.dismiss_attention_item(uuid, uuid, text) from anon;
grant execute on function public.dismiss_attention_item(uuid, uuid, text) to authenticated;

revoke all on function public.archive_attention_item(uuid, uuid) from public;
revoke all on function public.archive_attention_item(uuid, uuid) from anon;
grant execute on function public.archive_attention_item(uuid, uuid) to authenticated;

revoke all on function public.evaluate_attention_rules(uuid, uuid) from public;
revoke all on function public.evaluate_attention_rules(uuid, uuid) from anon;
grant execute on function public.evaluate_attention_rules(uuid, uuid) to authenticated;
