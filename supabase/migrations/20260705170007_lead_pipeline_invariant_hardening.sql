-- ZyntixAI Leads Core: pipeline stage invariant hardening (Model A — controlled management)

-- Deterministic active position ordering (controlled writes use two-phase reorder).
create unique index if not exists lead_pipeline_stages_org_active_position_unique_idx
  on public.lead_pipeline_stages (organization_id, position)
  where archived_at is null;

create or replace function private.validate_pipeline_stage_category(p_stage_category text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_stage_category in ('new', 'active', 'qualified', 'proposal');
$$;

revoke all on function private.validate_pipeline_stage_category(text) from public;
revoke all on function private.validate_pipeline_stage_category(text) from anon;
revoke all on function private.validate_pipeline_stage_category(text) from authenticated;

create or replace function private.assert_active_pipeline_default_invariant(
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active_count int;
  v_default_count int;
begin
  select count(*)
  into v_active_count
  from public.lead_pipeline_stages as lps
  where lps.organization_id = p_organization_id
    and lps.archived_at is null;

  if v_active_count = 0 then
    return;
  end if;

  select count(*)
  into v_default_count
  from public.lead_pipeline_stages as lps
  where lps.organization_id = p_organization_id
    and lps.is_default = true
    and lps.archived_at is null;

  if v_default_count <> 1 then
    raise exception 'pipeline invariant violated: active stages exist without exactly one default stage';
  end if;
end;
$$;

revoke all on function private.assert_active_pipeline_default_invariant(uuid) from public;
revoke all on function private.assert_active_pipeline_default_invariant(uuid) from anon;
revoke all on function private.assert_active_pipeline_default_invariant(uuid) from authenticated;

create or replace function public.ensure_default_pipeline_stages(
  p_organization_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lock_key bigint;
begin
  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
  end if;

  v_lock_key := pg_catalog.hashtextextended(p_organization_id::text, 0);
  perform pg_catalog.pg_advisory_xact_lock(v_lock_key);

  if exists (
    select 1
    from public.lead_pipeline_stages as lps
    where lps.organization_id = p_organization_id
      and lps.archived_at is null
  ) then
    perform private.assert_active_pipeline_default_invariant(p_organization_id);
    return;
  end if;

  insert into public.lead_pipeline_stages (
    organization_id,
    name,
    position,
    stage_category,
    is_default
  )
  values
    (p_organization_id, 'New', 1, 'new', true),
    (p_organization_id, 'Contacted', 2, 'active', false),
    (p_organization_id, 'Replied', 3, 'active', false),
    (p_organization_id, 'Qualified', 4, 'qualified', false),
    (p_organization_id, 'Call Booked', 5, 'qualified', false),
    (p_organization_id, 'Offer Sent', 6, 'proposal', false);
end;
$$;

create or replace function public.create_lead(
  p_organization_id uuid,
  p_display_name text,
  p_first_name text default null,
  p_last_name text default null,
  p_email text default null,
  p_phone text default null,
  p_owner_member_id uuid default null,
  p_source_type text default 'manual',
  p_source_detail text default null,
  p_pursuit_label text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_lead_id uuid;
  v_display_name text;
  v_email text;
  v_default_stage_id uuid;
  v_source_type text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_lead_actor_membership(p_organization_id);

  if v_membership_id is null then
    raise exception 'active organization membership required';
  end if;

  if v_member_role not in ('owner', 'admin', 'staff') then
    raise exception 'insufficient role to create leads';
  end if;

  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
  end if;

  perform public.ensure_default_pipeline_stages(p_organization_id);

  select lps.id
  into v_default_stage_id
  from public.lead_pipeline_stages as lps
  where lps.organization_id = p_organization_id
    and lps.is_default = true
    and lps.archived_at is null
  limit 1;

  if v_default_stage_id is null then
    raise exception 'pipeline invariant violated: no active default stage available for new leads';
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

  v_email := private.normalize_lead_email(p_email);

  v_source_type := btrim(p_source_type);
  if char_length(v_source_type) = 0 then
    raise exception 'source_type is required';
  end if;

  insert into public.leads (
    organization_id,
    display_name,
    first_name,
    last_name,
    email,
    phone,
    status,
    stage_id,
    owner_member_id,
    created_by_member_id,
    source_type,
    source_detail,
    pursuit_label,
    metadata
  )
  values (
    p_organization_id,
    v_display_name,
    nullif(btrim(p_first_name), ''),
    nullif(btrim(p_last_name), ''),
    v_email,
    nullif(btrim(p_phone), ''),
    'open',
    v_default_stage_id,
    p_owner_member_id,
    v_membership_id,
    v_source_type,
    nullif(btrim(p_source_detail), ''),
    nullif(btrim(p_pursuit_label), ''),
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_lead_id;

  perform private.insert_lead_status_history(
    p_organization_id,
    v_lead_id,
    null,
    'open',
    v_membership_id,
    null,
    'manual'
  );

  perform private.insert_lead_stage_history(
    p_organization_id,
    v_lead_id,
    null,
    v_default_stage_id,
    v_membership_id,
    null,
    'manual'
  );

  return v_lead_id;
end;
$$;

create or replace function public.create_pipeline_stage(
  p_organization_id uuid,
  p_name text,
  p_stage_category text,
  p_position integer default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
  v_stage_id uuid;
  v_name text;
  v_position int;
  v_lock_key bigint;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_lead_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to create pipeline stages';
  end if;

  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
  end if;

  v_name := btrim(p_name);
  if char_length(v_name) = 0 then
    raise exception 'stage name is required';
  end if;

  if not private.validate_pipeline_stage_category(p_stage_category) then
    raise exception 'invalid stage category';
  end if;

  v_lock_key := pg_catalog.hashtextextended(p_organization_id::text, 0);
  perform pg_catalog.pg_advisory_xact_lock(v_lock_key);

  if not exists (
    select 1
    from public.lead_pipeline_stages as lps
    where lps.organization_id = p_organization_id
      and lps.archived_at is null
  ) then
    raise exception 'pipeline not initialized; create a lead to seed default pipeline stages';
  end if;

  perform private.assert_active_pipeline_default_invariant(p_organization_id);

  if p_position is null then
    select coalesce(max(lps.position), 0) + 1
    into v_position
    from public.lead_pipeline_stages as lps
    where lps.organization_id = p_organization_id
      and lps.archived_at is null;
  else
    if p_position <= 0 then
      raise exception 'stage position must be greater than zero';
    end if;
    v_position := p_position;
  end if;

  insert into public.lead_pipeline_stages (
    organization_id,
    name,
    position,
    stage_category,
    is_default
  )
  values (
    p_organization_id,
    v_name,
    v_position,
    p_stage_category,
    false
  )
  returning id into v_stage_id;

  return v_stage_id;
exception
  when unique_violation then
    raise exception 'pipeline stage name or position already exists in organization';
end;
$$;

create or replace function public.update_pipeline_stage(
  p_organization_id uuid,
  p_stage_id uuid,
  p_name text,
  p_stage_category text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
  v_name text;
  v_lock_key bigint;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_lead_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to update pipeline stages';
  end if;

  v_name := btrim(p_name);
  if char_length(v_name) = 0 then
    raise exception 'stage name is required';
  end if;

  if not private.validate_pipeline_stage_category(p_stage_category) then
    raise exception 'invalid stage category';
  end if;

  v_lock_key := pg_catalog.hashtextextended(p_organization_id::text, 0);
  perform pg_catalog.pg_advisory_xact_lock(v_lock_key);

  update public.lead_pipeline_stages as lps
  set
    name = v_name,
    stage_category = p_stage_category
  where lps.organization_id = p_organization_id
    and lps.id = p_stage_id
    and lps.archived_at is null;

  if not found then
    raise exception 'pipeline stage not found or archived';
  end if;
exception
  when unique_violation then
    raise exception 'pipeline stage name already exists in organization';
end;
$$;

create or replace function public.set_default_pipeline_stage(
  p_organization_id uuid,
  p_stage_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
  v_lock_key bigint;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_lead_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to set default pipeline stage';
  end if;

  v_lock_key := pg_catalog.hashtextextended(p_organization_id::text, 0);
  perform pg_catalog.pg_advisory_xact_lock(v_lock_key);

  perform 1
  from public.lead_pipeline_stages as lps
  where lps.organization_id = p_organization_id
    and lps.archived_at is null
  for update;

  if not exists (
    select 1
    from public.lead_pipeline_stages as lps
    where lps.organization_id = p_organization_id
      and lps.id = p_stage_id
      and lps.archived_at is null
  ) then
    raise exception 'pipeline stage not found or archived';
  end if;

  update public.lead_pipeline_stages as lps
  set is_default = false
  where lps.organization_id = p_organization_id
    and lps.is_default = true
    and lps.archived_at is null
    and lps.id <> p_stage_id;

  update public.lead_pipeline_stages as lps
  set is_default = true
  where lps.organization_id = p_organization_id
    and lps.id = p_stage_id
    and lps.archived_at is null;

  perform private.assert_active_pipeline_default_invariant(p_organization_id);
end;
$$;

create or replace function public.archive_pipeline_stage(
  p_organization_id uuid,
  p_stage_id uuid,
  p_replacement_stage_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
  v_membership_id uuid;
  v_is_default boolean;
  v_open_lead_count int;
  v_lock_key bigint;
  v_lead record;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_lead_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to archive pipeline stages';
  end if;

  select membership_id
  into v_membership_id
  from private.get_lead_actor_membership(p_organization_id);

  v_lock_key := pg_catalog.hashtextextended(p_organization_id::text, 0);
  perform pg_catalog.pg_advisory_xact_lock(v_lock_key);

  select lps.is_default
  into v_is_default
  from public.lead_pipeline_stages as lps
  where lps.organization_id = p_organization_id
    and lps.id = p_stage_id
    and lps.archived_at is null
  for update;

  if not found then
    raise exception 'pipeline stage not found or already archived';
  end if;

  if v_is_default then
    raise exception 'cannot archive default pipeline stage; set another default first';
  end if;

  select count(*)
  into v_open_lead_count
  from public.leads as l
  where l.organization_id = p_organization_id
    and l.stage_id = p_stage_id
    and l.status = 'open'
    and l.archived_at is null;

  if v_open_lead_count > 0 then
    if p_replacement_stage_id is null then
      raise exception 'replacement stage required for stages with open leads';
    end if;

    if p_replacement_stage_id is not distinct from p_stage_id then
      raise exception 'replacement stage must differ from archived stage';
    end if;

    if not exists (
      select 1
      from public.lead_pipeline_stages as lps
      where lps.organization_id = p_organization_id
        and lps.id = p_replacement_stage_id
        and lps.archived_at is null
    ) then
      raise exception 'replacement pipeline stage not found or archived';
    end if;

    for v_lead in
      select l.id, l.stage_id
      from public.leads as l
      where l.organization_id = p_organization_id
        and l.stage_id = p_stage_id
        and l.status = 'open'
        and l.archived_at is null
      for update
    loop
      update public.leads as l
      set stage_id = p_replacement_stage_id
      where l.organization_id = p_organization_id
        and l.id = v_lead.id;

      perform private.insert_lead_stage_history(
        p_organization_id,
        v_lead.id,
        v_lead.stage_id,
        p_replacement_stage_id,
        v_membership_id,
        'stage archived with explicit replacement',
        'system'
      );
    end loop;
  end if;

  update public.lead_pipeline_stages as lps
  set
    archived_at = pg_catalog.now(),
    is_default = false
  where lps.organization_id = p_organization_id
    and lps.id = p_stage_id
    and lps.archived_at is null;

  perform private.assert_active_pipeline_default_invariant(p_organization_id);
end;
$$;

create or replace function public.restore_pipeline_stage(
  p_organization_id uuid,
  p_stage_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
  v_next_position int;
  v_lock_key bigint;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_lead_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to restore pipeline stages';
  end if;

  v_lock_key := pg_catalog.hashtextextended(p_organization_id::text, 0);
  perform pg_catalog.pg_advisory_xact_lock(v_lock_key);

  if not exists (
    select 1
    from public.lead_pipeline_stages as lps
    where lps.organization_id = p_organization_id
      and lps.id = p_stage_id
      and lps.archived_at is not null
  ) then
    raise exception 'pipeline stage not found or not archived';
  end if;

  select coalesce(max(lps.position), 0) + 1
  into v_next_position
  from public.lead_pipeline_stages as lps
  where lps.organization_id = p_organization_id
    and lps.archived_at is null;

  update public.lead_pipeline_stages as lps
  set
    archived_at = null,
    is_default = false,
    position = v_next_position
  where lps.organization_id = p_organization_id
    and lps.id = p_stage_id
    and lps.archived_at is not null;

  perform private.assert_active_pipeline_default_invariant(p_organization_id);
exception
  when unique_violation then
    raise exception 'pipeline stage name already exists in organization';
end;
$$;

create or replace function public.reorder_pipeline_stages(
  p_organization_id uuid,
  p_stage_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
  v_active_count int;
  v_input_count int;
  v_distinct_count int;
  v_idx int;
  v_stage_id uuid;
  v_lock_key bigint;
  v_position_offset int;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_lead_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to reorder pipeline stages';
  end if;

  if p_stage_ids is null or array_length(p_stage_ids, 1) is null then
    raise exception 'stage order is required';
  end if;

  v_input_count := array_length(p_stage_ids, 1);

  select count(distinct s)
  into v_distinct_count
  from unnest(p_stage_ids) as s;

  if v_distinct_count <> v_input_count then
    raise exception 'duplicate stage ids in reorder input';
  end if;

  v_lock_key := pg_catalog.hashtextextended(p_organization_id::text, 0);
  perform pg_catalog.pg_advisory_xact_lock(v_lock_key);

  perform 1
  from public.lead_pipeline_stages as lps
  where lps.organization_id = p_organization_id
    and lps.archived_at is null
  for update;

  select count(*)
  into v_active_count
  from public.lead_pipeline_stages as lps
  where lps.organization_id = p_organization_id
    and lps.archived_at is null;

  if v_active_count <> v_input_count then
    raise exception 'reorder must include all active stages exactly once';
  end if;

  for v_idx in 1..v_input_count loop
    v_stage_id := p_stage_ids[v_idx];

    if not exists (
      select 1
      from public.lead_pipeline_stages as lps
      where lps.organization_id = p_organization_id
        and lps.id = v_stage_id
        and lps.archived_at is null
    ) then
      raise exception 'invalid or archived stage in reorder input';
    end if;
  end loop;

  v_position_offset := v_active_count + 1000;

  update public.lead_pipeline_stages as lps
  set position = lps.position + v_position_offset
  where lps.organization_id = p_organization_id
    and lps.archived_at is null;

  for v_idx in 1..v_input_count loop
    update public.lead_pipeline_stages as lps
    set position = v_idx
    where lps.organization_id = p_organization_id
      and lps.id = p_stage_ids[v_idx];
  end loop;
end;
$$;

comment on function public.create_pipeline_stage(uuid, text, text, integer) is
  'Controlled pipeline stage creation; new stages are never default.';
comment on function public.update_pipeline_stage(uuid, uuid, text, text) is
  'Controlled pipeline stage rename/category update.';
comment on function public.set_default_pipeline_stage(uuid, uuid) is
  'Controlled default stage assignment; enforces exactly one active default.';
comment on function public.archive_pipeline_stage(uuid, uuid, uuid) is
  'Controlled pipeline stage archive with explicit replacement for open leads.';
comment on function public.restore_pipeline_stage(uuid, uuid) is
  'Controlled pipeline stage restore; does not auto-promote to default.';

revoke insert, update, delete on public.lead_pipeline_stages from authenticated;
grant select on public.lead_pipeline_stages to authenticated;

drop policy if exists lead_pipeline_stages_insert_admin on public.lead_pipeline_stages;
drop policy if exists lead_pipeline_stages_update_admin on public.lead_pipeline_stages;

revoke all on function public.create_pipeline_stage(uuid, text, text, integer) from public;
revoke all on function public.create_pipeline_stage(uuid, text, text, integer) from anon;
grant execute on function public.create_pipeline_stage(uuid, text, text, integer) to authenticated;

revoke all on function public.update_pipeline_stage(uuid, uuid, text, text) from public;
revoke all on function public.update_pipeline_stage(uuid, uuid, text, text) from anon;
grant execute on function public.update_pipeline_stage(uuid, uuid, text, text) to authenticated;

revoke all on function public.set_default_pipeline_stage(uuid, uuid) from public;
revoke all on function public.set_default_pipeline_stage(uuid, uuid) from anon;
grant execute on function public.set_default_pipeline_stage(uuid, uuid) to authenticated;

revoke all on function public.archive_pipeline_stage(uuid, uuid, uuid) from public;
revoke all on function public.archive_pipeline_stage(uuid, uuid, uuid) from anon;
grant execute on function public.archive_pipeline_stage(uuid, uuid, uuid) to authenticated;

revoke all on function public.restore_pipeline_stage(uuid, uuid) from public;
revoke all on function public.restore_pipeline_stage(uuid, uuid) from anon;
grant execute on function public.restore_pipeline_stage(uuid, uuid) to authenticated;

revoke all on function private.validate_pipeline_stage_category(text) from public;
revoke all on function private.validate_pipeline_stage_category(text) from anon;
revoke all on function private.validate_pipeline_stage_category(text) from authenticated;

revoke all on function private.assert_active_pipeline_default_invariant(uuid) from public;
revoke all on function private.assert_active_pipeline_default_invariant(uuid) from anon;
revoke all on function private.assert_active_pipeline_default_invariant(uuid) from authenticated;
