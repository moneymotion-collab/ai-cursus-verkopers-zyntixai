-- ZyntixAI Leads Core: triggers, private helpers, and controlled lead functions

create trigger lead_pipeline_stages_set_updated_at
  before update on public.lead_pipeline_stages
  for each row
  execute function public.set_updated_at();

create trigger leads_set_updated_at
  before update on public.leads
  for each row
  execute function public.set_updated_at();

create or replace function private.normalize_lead_email(p_email text)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(lower(btrim(p_email)), '');
$$;

revoke all on function private.normalize_lead_email(text) from public;
revoke all on function private.normalize_lead_email(text) from anon;
revoke all on function private.normalize_lead_email(text) from authenticated;

create or replace function private.canonicalize_lead_email_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := nullif(lower(btrim(new.email)), '');
  return new;
end;
$$;

revoke all on function private.canonicalize_lead_email_trigger() from public;
revoke all on function private.canonicalize_lead_email_trigger() from anon;
revoke all on function private.canonicalize_lead_email_trigger() from authenticated;

create trigger leads_canonicalize_email
  before insert or update of email on public.leads
  for each row
  execute function private.canonicalize_lead_email_trigger();

create or replace function private.is_allowed_lead_status_transition(
  p_from_status text,
  p_to_status text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from_status is not distinct from p_to_status then false
    when p_from_status = 'open' and p_to_status in ('lost', 'disqualified') then true
    when p_from_status in ('lost', 'disqualified') and p_to_status = 'open' then true
    else false
  end;
$$;

revoke all on function private.is_allowed_lead_status_transition(text, text) from public;
revoke all on function private.is_allowed_lead_status_transition(text, text) from anon;
revoke all on function private.is_allowed_lead_status_transition(text, text) from authenticated;

create or replace function private.get_lead_actor_membership(
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

revoke all on function private.get_lead_actor_membership(uuid) from public;
revoke all on function private.get_lead_actor_membership(uuid) from anon;
revoke all on function private.get_lead_actor_membership(uuid) from authenticated;

create or replace function private.insert_lead_stage_history(
  p_organization_id uuid,
  p_lead_id uuid,
  p_from_stage_id uuid,
  p_to_stage_id uuid,
  p_changed_by_member_id uuid,
  p_reason text,
  p_source text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.lead_stage_history (
    organization_id,
    lead_id,
    from_stage_id,
    to_stage_id,
    changed_by_member_id,
    reason,
    source
  )
  values (
    p_organization_id,
    p_lead_id,
    p_from_stage_id,
    p_to_stage_id,
    p_changed_by_member_id,
    p_reason,
    p_source
  );
$$;

revoke all on function private.insert_lead_stage_history(uuid, uuid, uuid, uuid, uuid, text, text) from public;
revoke all on function private.insert_lead_stage_history(uuid, uuid, uuid, uuid, uuid, text, text) from anon;
revoke all on function private.insert_lead_stage_history(uuid, uuid, uuid, uuid, uuid, text, text) from authenticated;

create or replace function private.insert_lead_status_history(
  p_organization_id uuid,
  p_lead_id uuid,
  p_from_status text,
  p_to_status text,
  p_changed_by_member_id uuid,
  p_reason text,
  p_source text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.lead_status_history (
    organization_id,
    lead_id,
    from_status,
    to_status,
    changed_by_member_id,
    reason,
    source
  )
  values (
    p_organization_id,
    p_lead_id,
    p_from_status,
    p_to_status,
    p_changed_by_member_id,
    p_reason,
    p_source
  );
$$;

revoke all on function private.insert_lead_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_lead_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_lead_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;

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

comment on function public.ensure_default_pipeline_stages(uuid) is
  'Idempotently seeds default pipeline stages for an organization. Internal use only.';

revoke all on function public.ensure_default_pipeline_stages(uuid) from public;
revoke all on function public.ensure_default_pipeline_stages(uuid) from anon;
revoke all on function public.ensure_default_pipeline_stages(uuid) from authenticated;

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
    raise exception 'default pipeline stage not found';
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

create or replace function public.transition_lead_stage(
  p_organization_id uuid,
  p_lead_id uuid,
  p_to_stage_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_from_stage_id uuid;
  v_status text;
  v_archived_at timestamptz;
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
    raise exception 'insufficient role to transition lead stage';
  end if;

  select l.stage_id, l.status, l.archived_at
  into v_from_stage_id, v_status, v_archived_at
  from public.leads as l
  where l.organization_id = p_organization_id
    and l.id = p_lead_id
  for update;

  if not found then
    raise exception 'lead not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived leads cannot transition stage';
  end if;

  if v_status <> 'open' then
    raise exception 'only open leads can transition stage';
  end if;

  if v_from_stage_id is not distinct from p_to_stage_id then
    raise exception 'stage transition is a no-op';
  end if;

  if not exists (
    select 1
    from public.lead_pipeline_stages as lps
    where lps.organization_id = p_organization_id
      and lps.id = p_to_stage_id
      and lps.archived_at is null
  ) then
    raise exception 'target stage not found or archived';
  end if;

  update public.leads as l
  set stage_id = p_to_stage_id
  where l.organization_id = p_organization_id
    and l.id = p_lead_id;

  perform private.insert_lead_stage_history(
    p_organization_id,
    p_lead_id,
    v_from_stage_id,
    p_to_stage_id,
    v_membership_id,
    p_reason,
    'manual'
  );
end;
$$;

create or replace function public.transition_lead_status(
  p_organization_id uuid,
  p_lead_id uuid,
  p_to_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_from_status text;
  v_archived_at timestamptz;
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
    raise exception 'insufficient role to transition lead status';
  end if;

  select l.status, l.archived_at
  into v_from_status, v_archived_at
  from public.leads as l
  where l.organization_id = p_organization_id
    and l.id = p_lead_id
  for update;

  if not found then
    raise exception 'lead not found';
  end if;

  if v_archived_at is not null then
    raise exception 'archived leads cannot transition status';
  end if;

  if v_from_status = 'converted' then
    raise exception 'converted leads cannot transition status';
  end if;

  if v_from_status is not distinct from p_to_status then
    raise exception 'status transition is a no-op';
  end if;

  if not private.is_allowed_lead_status_transition(v_from_status, p_to_status) then
    raise exception 'status transition not allowed';
  end if;

  update public.leads as l
  set status = p_to_status
  where l.organization_id = p_organization_id
    and l.id = p_lead_id;

  perform private.insert_lead_status_history(
    p_organization_id,
    p_lead_id,
    v_from_status,
    p_to_status,
    v_membership_id,
    p_reason,
    'manual'
  );
end;
$$;

create or replace function public.convert_lead_to_customer(
  p_organization_id uuid,
  p_lead_id uuid,
  p_existing_customer_id uuid default null,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_lead record;
  v_customer_id uuid;
  v_from_stage_id uuid;
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
    raise exception 'insufficient role to convert leads';
  end if;

  select
    l.id,
    l.display_name,
    l.first_name,
    l.last_name,
    l.email,
    l.phone,
    l.status,
    l.stage_id,
    l.owner_member_id,
    l.archived_at,
    l.converted_customer_id,
    l.converted_at
  into v_lead
  from public.leads as l
  where l.organization_id = p_organization_id
    and l.id = p_lead_id
  for update;

  if not found then
    raise exception 'lead not found';
  end if;

  if v_lead.archived_at is not null then
    raise exception 'archived leads cannot be converted';
  end if;

  if v_lead.status <> 'open' then
    raise exception 'only open leads can be converted';
  end if;

  if v_lead.converted_customer_id is not null or v_lead.converted_at is not null then
    raise exception 'lead already converted';
  end if;

  if p_existing_customer_id is not null then
    if not exists (
      select 1
      from public.customers as c
      where c.organization_id = p_organization_id
        and c.id = p_existing_customer_id
    ) then
      raise exception 'customer not found in organization';
    end if;

    v_customer_id := p_existing_customer_id;
  else
    begin
      v_customer_id := private.create_customer_record(
        p_organization_id,
        v_lead.display_name,
        v_lead.first_name,
        v_lead.last_name,
        v_lead.email,
        v_lead.phone,
        v_lead.owner_member_id,
        v_membership_id,
        'lead_conversion'
      );
    exception
      when unique_violation then
        raise exception 'existing_customer_match_requires_explicit_selection';
    end;
  end if;

  v_from_stage_id := v_lead.stage_id;

  update public.leads as l
  set
    status = 'converted',
    converted_customer_id = v_customer_id,
    converted_at = pg_catalog.now()
  where l.organization_id = p_organization_id
    and l.id = p_lead_id;

  perform private.insert_lead_status_history(
    p_organization_id,
    p_lead_id,
    'open',
    'converted',
    v_membership_id,
    p_reason,
    'conversion'
  );

  return v_customer_id;
end;
$$;

create or replace function public.archive_lead(
  p_organization_id uuid,
  p_lead_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_lead_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to archive leads';
  end if;

  update public.leads as l
  set archived_at = pg_catalog.now()
  where l.organization_id = p_organization_id
    and l.id = p_lead_id
    and l.archived_at is null;

  if not found then
    raise exception 'lead not found or already archived';
  end if;
end;
$$;

create or replace function public.restore_lead(
  p_organization_id uuid,
  p_lead_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_role text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  select member_role
  into v_member_role
  from private.get_lead_actor_membership(p_organization_id);

  if v_member_role not in ('owner', 'admin') then
    raise exception 'insufficient role to restore leads';
  end if;

  update public.leads as l
  set archived_at = null
  where l.organization_id = p_organization_id
    and l.id = p_lead_id
    and l.archived_at is not null;

  if not found then
    raise exception 'lead not found or not archived';
  end if;
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

  select count(*)
  into v_active_count
  from public.lead_pipeline_stages as lps
  where lps.organization_id = p_organization_id
    and lps.archived_at is null;

  if v_active_count <> v_input_count then
    raise exception 'reorder must include all active stages exactly once';
  end if;

  v_lock_key := pg_catalog.hashtextextended(p_organization_id::text, 0);
  perform pg_catalog.pg_advisory_xact_lock(v_lock_key);

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

  for v_idx in 1..v_input_count loop
    update public.lead_pipeline_stages as lps
    set position = v_idx
    where lps.organization_id = p_organization_id
      and lps.id = p_stage_ids[v_idx];
  end loop;
end;
$$;

comment on function public.create_lead(uuid, text, text, text, text, text, uuid, text, text, text, jsonb) is
  'Atomically creates a lead with default pipeline stage and initial histories.';
comment on function public.transition_lead_stage(uuid, uuid, uuid, text) is
  'Controlled pipeline stage transition for open non-archived leads.';
comment on function public.transition_lead_status(uuid, uuid, text, text) is
  'Controlled lifecycle status transition; conversion excluded.';
comment on function public.convert_lead_to_customer(uuid, uuid, uuid, text) is
  'Converts an open lead to a customer via new record or explicit existing link.';
comment on function public.archive_lead(uuid, uuid) is
  'Soft-archives a lead without changing status or stage.';
comment on function public.restore_lead(uuid, uuid) is
  'Restores an archived lead without changing status or stage.';
comment on function public.reorder_pipeline_stages(uuid, uuid[]) is
  'Atomically reorders all active pipeline stages for an organization.';

revoke all on function public.create_lead(uuid, text, text, text, text, text, uuid, text, text, text, jsonb) from public;
revoke all on function public.create_lead(uuid, text, text, text, text, text, uuid, text, text, text, jsonb) from anon;
grant execute on function public.create_lead(uuid, text, text, text, text, text, uuid, text, text, text, jsonb) to authenticated;

revoke all on function public.transition_lead_stage(uuid, uuid, uuid, text) from public;
revoke all on function public.transition_lead_stage(uuid, uuid, uuid, text) from anon;
grant execute on function public.transition_lead_stage(uuid, uuid, uuid, text) to authenticated;

revoke all on function public.transition_lead_status(uuid, uuid, text, text) from public;
revoke all on function public.transition_lead_status(uuid, uuid, text, text) from anon;
grant execute on function public.transition_lead_status(uuid, uuid, text, text) to authenticated;

revoke all on function public.convert_lead_to_customer(uuid, uuid, uuid, text) from public;
revoke all on function public.convert_lead_to_customer(uuid, uuid, uuid, text) from anon;
grant execute on function public.convert_lead_to_customer(uuid, uuid, uuid, text) to authenticated;

revoke all on function public.archive_lead(uuid, uuid) from public;
revoke all on function public.archive_lead(uuid, uuid) from anon;
grant execute on function public.archive_lead(uuid, uuid) to authenticated;

revoke all on function public.restore_lead(uuid, uuid) from public;
revoke all on function public.restore_lead(uuid, uuid) from anon;
grant execute on function public.restore_lead(uuid, uuid) to authenticated;

revoke all on function public.reorder_pipeline_stages(uuid, uuid[]) from public;
revoke all on function public.reorder_pipeline_stages(uuid, uuid[]) from anon;
grant execute on function public.reorder_pipeline_stages(uuid, uuid[]) to authenticated;
