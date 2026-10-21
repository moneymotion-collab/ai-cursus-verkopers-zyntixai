-- TG3-FIELD-SLICE
-- Minimum Field Operations domains layered on the shared Project foundation.
-- Job is display terminology for projects; Technician is an organization member.

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null,
  project_id uuid not null,
  name text not null,
  address_line_1 text not null,
  address_line_2 text,
  postal_code text not null,
  city text not null,
  country text not null,
  operational_note text,
  created_by_member_id uuid not null,
  archived_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint sites_org_id_unique unique (organization_id, id),
  constraint sites_name_check check (char_length(btrim(name)) between 1 and 200),
  constraint sites_address_line_1_check check (char_length(btrim(address_line_1)) between 1 and 300),
  constraint sites_address_line_2_check check (
    address_line_2 is null or char_length(btrim(address_line_2)) between 1 and 300
  ),
  constraint sites_postal_code_check check (char_length(btrim(postal_code)) between 1 and 40),
  constraint sites_city_check check (char_length(btrim(city)) between 1 and 120),
  constraint sites_country_check check (char_length(btrim(country)) between 1 and 120),
  constraint sites_operational_note_check check (
    operational_note is null or char_length(operational_note) <= 4000
  ),
  constraint sites_customer_fk foreign key (organization_id, customer_id)
    references public.customers (organization_id, id) on delete restrict,
  constraint sites_project_fk foreign key (organization_id, project_id)
    references public.projects (organization_id, id) on delete restrict,
  constraint sites_created_by_member_fk foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

comment on table public.sites is
  'Field execution locations belonging to one Customer and one shared Project/Job.';

create index sites_organization_id_project_id_idx
  on public.sites (organization_id, project_id, updated_at desc);
create index sites_organization_id_customer_id_idx
  on public.sites (organization_id, customer_id, updated_at desc);
create index sites_organization_active_idx
  on public.sites (organization_id, updated_at desc) where archived_at is null;

create trigger sites_set_updated_at
  before update on public.sites
  for each row execute function public.set_updated_at();

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null,
  site_id uuid not null,
  title text not null,
  instructions text,
  technician_member_id uuid,
  scheduled_for timestamptz,
  status text not null default 'planned',
  completed_at timestamptz,
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint work_orders_org_id_unique unique (organization_id, id),
  constraint work_orders_title_check check (char_length(btrim(title)) between 1 and 200),
  constraint work_orders_instructions_check check (
    instructions is null or char_length(instructions) <= 4000
  ),
  constraint work_orders_status_check check (
    status in ('planned', 'scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  constraint work_orders_schedule_status_check check (
    status not in ('scheduled', 'in_progress', 'completed') or scheduled_for is not null
  ),
  constraint work_orders_completion_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  constraint work_orders_project_fk foreign key (organization_id, project_id)
    references public.projects (organization_id, id) on delete restrict,
  constraint work_orders_site_fk foreign key (organization_id, site_id)
    references public.sites (organization_id, id) on delete restrict,
  constraint work_orders_technician_member_fk foreign key (
    organization_id,
    technician_member_id
  ) references public.organization_members (organization_id, id) on delete restrict,
  constraint work_orders_created_by_member_fk foreign key (
    organization_id,
    created_by_member_id
  ) references public.organization_members (organization_id, id) on delete restrict
);

comment on table public.work_orders is
  'Executable Field work under one shared Project/Job and Site. Technician is an organization member.';

create index work_orders_organization_id_project_id_idx
  on public.work_orders (organization_id, project_id, scheduled_for);
create index work_orders_organization_id_site_id_idx
  on public.work_orders (organization_id, site_id, scheduled_for);
create index work_orders_dispatch_idx
  on public.work_orders (organization_id, status, scheduled_for);
create index work_orders_unassigned_idx
  on public.work_orders (organization_id, scheduled_for)
  where technician_member_id is null and status in ('scheduled', 'in_progress');
create index work_orders_technician_idx
  on public.work_orders (organization_id, technician_member_id, scheduled_for)
  where technician_member_id is not null;

create trigger work_orders_set_updated_at
  before update on public.work_orders
  for each row execute function public.set_updated_at();

create table public.work_order_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  work_order_id uuid not null,
  from_status text,
  to_status text not null,
  changed_by_member_id uuid not null,
  reason text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint work_order_status_history_status_check check (
    (from_status is null or from_status in ('planned', 'scheduled', 'in_progress', 'completed', 'cancelled'))
    and to_status in ('planned', 'scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  constraint work_order_status_history_work_order_fk foreign key (
    organization_id,
    work_order_id
  ) references public.work_orders (organization_id, id) on delete cascade,
  constraint work_order_status_history_member_fk foreign key (
    organization_id,
    changed_by_member_id
  ) references public.organization_members (organization_id, id) on delete restrict
);

create index work_order_status_history_order_idx
  on public.work_order_status_history (organization_id, work_order_id, created_at desc);

create or replace function private.require_field_actor(
  p_organization_id uuid,
  p_allowed_roles text[]
)
returns table (membership_id uuid, member_role text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  return query
  select om.id, om.role
  from public.organization_members as om
  join public.organizations as o on o.id = om.organization_id
  where om.organization_id = p_organization_id
    and om.user_id = auth.uid()
    and om.status = 'active'
    and o.status = 'active'
    and om.role = any(p_allowed_roles)
  limit 1;

  if not found then
    raise exception 'active organization membership with sufficient role required';
  end if;
end;
$$;

create or replace function private.validate_site_relations(
  p_organization_id uuid,
  p_customer_id uuid,
  p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.projects as p
    join public.customers as c
      on c.organization_id = p.organization_id and c.id = p.customer_id
    where p.organization_id = p_organization_id
      and p.id = p_project_id
      and p.customer_id = p_customer_id
      and p.archived_at is null
      and c.archived_at is null
  ) then
    raise exception 'project and customer relationship is invalid or archived';
  end if;
end;
$$;

create or replace function private.validate_work_order_relations(
  p_organization_id uuid,
  p_project_id uuid,
  p_site_id uuid,
  p_technician_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.sites as s
    join public.projects as p
      on p.organization_id = s.organization_id and p.id = s.project_id
    where s.organization_id = p_organization_id
      and s.id = p_site_id
      and s.project_id = p_project_id
      and s.archived_at is null
      and p.archived_at is null
  ) then
    raise exception 'site and project relationship is invalid or archived';
  end if;

  if p_technician_member_id is not null and not exists (
    select 1 from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.id = p_technician_member_id
      and om.status = 'active'
  ) then
    raise exception 'technician must be an active organization member';
  end if;
end;
$$;

create or replace function private.is_allowed_work_order_status_transition(
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
    when p_from_status = 'planned' and p_to_status in ('scheduled', 'cancelled') then true
    when p_from_status = 'scheduled' and p_to_status in ('planned', 'in_progress', 'cancelled') then true
    when p_from_status = 'in_progress' and p_to_status in ('scheduled', 'completed', 'cancelled') then true
    when p_from_status = 'completed' and p_to_status = 'in_progress' then true
    when p_from_status = 'cancelled' and p_to_status = 'planned' then true
    else false
  end;
$$;

revoke all on function private.require_field_actor(uuid, text[]) from public, anon, authenticated;
revoke all on function private.validate_site_relations(uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function private.validate_work_order_relations(uuid, uuid, uuid, uuid) from public, anon, authenticated;
revoke all on function private.is_allowed_work_order_status_transition(text, text) from public, anon, authenticated;

create or replace function public.create_site(
  p_organization_id uuid,
  p_customer_id uuid,
  p_project_id uuid,
  p_name text,
  p_address_line_1 text,
  p_postal_code text,
  p_city text,
  p_country text,
  p_address_line_2 text default null,
  p_operational_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_site_id uuid;
begin
  select membership_id into v_member_id
  from private.require_field_actor(p_organization_id, array['owner', 'admin', 'staff']);
  perform private.validate_site_relations(p_organization_id, p_customer_id, p_project_id);

  insert into public.sites (
    organization_id, customer_id, project_id, name, address_line_1,
    address_line_2, postal_code, city, country, operational_note, created_by_member_id
  ) values (
    p_organization_id, p_customer_id, p_project_id, btrim(p_name), btrim(p_address_line_1),
    nullif(btrim(p_address_line_2), ''), btrim(p_postal_code), btrim(p_city), btrim(p_country),
    nullif(btrim(p_operational_note), ''), v_member_id
  ) returning id into v_site_id;
  return v_site_id;
end;
$$;

create or replace function public.update_site(
  p_organization_id uuid,
  p_site_id uuid,
  p_customer_id uuid,
  p_project_id uuid,
  p_name text,
  p_address_line_1 text,
  p_postal_code text,
  p_city text,
  p_country text,
  p_address_line_2 text default null,
  p_operational_note text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_site public.sites;
begin
  perform private.require_field_actor(p_organization_id, array['owner', 'admin', 'staff']);
  select s.* into v_site from public.sites as s
  where s.organization_id = p_organization_id
    and s.id = p_site_id
    and s.archived_at is null
  for update;
  if not found then raise exception 'site not found or archived'; end if;
  if (v_site.project_id <> p_project_id or v_site.customer_id <> p_customer_id)
    and exists (
      select 1 from public.work_orders as wo
      where wo.organization_id = p_organization_id and wo.site_id = p_site_id
    ) then
    raise exception 'site job cannot change after work orders exist';
  end if;
  perform private.validate_site_relations(p_organization_id, p_customer_id, p_project_id);

  update public.sites as s set
    customer_id = p_customer_id,
    project_id = p_project_id,
    name = btrim(p_name),
    address_line_1 = btrim(p_address_line_1),
    address_line_2 = nullif(btrim(p_address_line_2), ''),
    postal_code = btrim(p_postal_code),
    city = btrim(p_city),
    country = btrim(p_country),
    operational_note = nullif(btrim(p_operational_note), '')
  where s.organization_id = p_organization_id
    and s.id = p_site_id
    and s.archived_at is null;
end;
$$;

create or replace function public.archive_site(p_organization_id uuid, p_site_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_field_actor(p_organization_id, array['owner', 'admin']);
  if exists (
    select 1 from public.work_orders as wo
    where wo.organization_id = p_organization_id and wo.site_id = p_site_id
      and wo.status in ('planned', 'scheduled', 'in_progress')
  ) then
    raise exception 'site has active work orders';
  end if;
  update public.sites as s set archived_at = pg_catalog.now()
  where s.organization_id = p_organization_id and s.id = p_site_id and s.archived_at is null;
  if not found then raise exception 'site not found or already archived'; end if;
end;
$$;

create or replace function public.restore_site(p_organization_id uuid, p_site_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_site public.sites;
begin
  perform private.require_field_actor(p_organization_id, array['owner', 'admin']);
  select s.* into v_site from public.sites as s
  where s.organization_id = p_organization_id and s.id = p_site_id for update;
  if not found or v_site.archived_at is null then raise exception 'archived site not found'; end if;
  perform private.validate_site_relations(
    p_organization_id, v_site.customer_id, v_site.project_id
  );
  update public.sites as s set archived_at = null
  where s.organization_id = p_organization_id and s.id = p_site_id;
end;
$$;

create or replace function public.create_work_order(
  p_organization_id uuid,
  p_project_id uuid,
  p_site_id uuid,
  p_title text,
  p_instructions text default null,
  p_technician_member_id uuid default null,
  p_scheduled_for timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_work_order_id uuid;
  v_status text := case when p_scheduled_for is null then 'planned' else 'scheduled' end;
begin
  select membership_id into v_member_id
  from private.require_field_actor(p_organization_id, array['owner', 'admin', 'staff']);
  perform private.validate_work_order_relations(
    p_organization_id, p_project_id, p_site_id, p_technician_member_id
  );

  insert into public.work_orders (
    organization_id, project_id, site_id, title, instructions,
    technician_member_id, scheduled_for, status, created_by_member_id
  ) values (
    p_organization_id, p_project_id, p_site_id, btrim(p_title),
    nullif(btrim(p_instructions), ''), p_technician_member_id,
    p_scheduled_for, v_status, v_member_id
  ) returning id into v_work_order_id;

  insert into public.work_order_status_history (
    organization_id, work_order_id, from_status, to_status, changed_by_member_id
  ) values (p_organization_id, v_work_order_id, null, v_status, v_member_id);
  return v_work_order_id;
end;
$$;

create or replace function public.update_work_order(
  p_organization_id uuid,
  p_work_order_id uuid,
  p_project_id uuid,
  p_site_id uuid,
  p_title text,
  p_instructions text default null,
  p_technician_member_id uuid default null,
  p_scheduled_for timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_work_order public.work_orders;
begin
  perform private.require_field_actor(p_organization_id, array['owner', 'admin', 'staff']);
  select wo.* into v_work_order from public.work_orders as wo
  where wo.organization_id = p_organization_id and wo.id = p_work_order_id for update;
  if not found then raise exception 'work order not found'; end if;
  if v_work_order.status in ('completed', 'cancelled') then
    raise exception 'completed or cancelled work order cannot be edited';
  end if;
  if v_work_order.project_id <> p_project_id or v_work_order.site_id <> p_site_id then
    raise exception 'work order job and site cannot change after creation';
  end if;
  if v_work_order.status in ('scheduled', 'in_progress') and p_scheduled_for is null then
    raise exception 'scheduled work order requires a date';
  end if;
  perform private.validate_work_order_relations(
    p_organization_id, p_project_id, p_site_id, p_technician_member_id
  );
  update public.work_orders as wo set
    project_id = p_project_id,
    site_id = p_site_id,
    title = btrim(p_title),
    instructions = nullif(btrim(p_instructions), ''),
    technician_member_id = p_technician_member_id,
    scheduled_for = p_scheduled_for
  where wo.organization_id = p_organization_id and wo.id = p_work_order_id;
end;
$$;

create or replace function public.transition_work_order_status(
  p_organization_id uuid,
  p_work_order_id uuid,
  p_to_status text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_work_order public.work_orders;
begin
  select membership_id into v_member_id
  from private.require_field_actor(p_organization_id, array['owner', 'admin', 'staff']);
  select wo.* into v_work_order from public.work_orders as wo
  where wo.organization_id = p_organization_id and wo.id = p_work_order_id for update;
  if not found then raise exception 'work order not found'; end if;
  if not private.is_allowed_work_order_status_transition(v_work_order.status, p_to_status) then
    raise exception 'work order status transition not allowed';
  end if;
  if p_to_status in ('scheduled', 'in_progress', 'completed')
    and v_work_order.scheduled_for is null then
    raise exception 'scheduled date is required for this status';
  end if;

  update public.work_orders as wo set
    status = p_to_status,
    completed_at = case when p_to_status = 'completed' then pg_catalog.now() else null end
  where wo.organization_id = p_organization_id and wo.id = p_work_order_id;

  insert into public.work_order_status_history (
    organization_id, work_order_id, from_status, to_status,
    changed_by_member_id, reason
  ) values (
    p_organization_id, p_work_order_id, v_work_order.status, p_to_status,
    v_member_id, nullif(btrim(p_reason), '')
  );
end;
$$;

alter table public.sites enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_status_history enable row level security;

revoke all on table public.sites from public, anon, authenticated;
revoke all on table public.work_orders from public, anon, authenticated;
revoke all on table public.work_order_status_history from public, anon, authenticated;
grant select on table public.sites to authenticated;
grant select on table public.work_orders to authenticated;
grant select on table public.work_order_status_history to authenticated;

create policy sites_select_admin on public.sites for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));
create policy sites_select_member on public.sites for select to authenticated
  using (private.is_org_member(organization_id) and archived_at is null);
create policy work_orders_select_member on public.work_orders for select to authenticated
  using (private.is_org_member(organization_id));
create policy work_order_status_history_select_member
  on public.work_order_status_history for select to authenticated
  using (private.is_org_member(organization_id));

revoke all on function public.create_site(uuid, uuid, uuid, text, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.update_site(uuid, uuid, uuid, uuid, text, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.archive_site(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.restore_site(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.create_work_order(uuid, uuid, uuid, text, text, uuid, timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.update_work_order(uuid, uuid, uuid, uuid, text, text, uuid, timestamptz)
  from public, anon, authenticated, service_role;
revoke all on function public.transition_work_order_status(uuid, uuid, text, text)
  from public, anon, authenticated, service_role;

grant execute on function public.create_site(uuid, uuid, uuid, text, text, text, text, text, text, text)
  to authenticated;
grant execute on function public.update_site(uuid, uuid, uuid, uuid, text, text, text, text, text, text, text)
  to authenticated;
grant execute on function public.archive_site(uuid, uuid) to authenticated;
grant execute on function public.restore_site(uuid, uuid) to authenticated;
grant execute on function public.create_work_order(uuid, uuid, uuid, text, text, uuid, timestamptz)
  to authenticated;
grant execute on function public.update_work_order(uuid, uuid, uuid, uuid, text, text, uuid, timestamptz)
  to authenticated;
grant execute on function public.transition_work_order_status(uuid, uuid, text, text)
  to authenticated;

-- Preserve shared Project lifecycle while preventing a Field Job from being
-- archived out from under active Sites. Service Projects have no Sites and
-- retain their existing behavior.
create or replace function public.archive_project(
  p_organization_id uuid,
  p_project_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.require_project_actor(
    p_organization_id,
    array['owner', 'admin']::text[]
  );
  if exists (
    select 1 from public.sites as s
    where s.organization_id = p_organization_id
      and s.project_id = p_project_id
      and s.archived_at is null
  ) then
    raise exception 'archive active sites before archiving this field project';
  end if;
  update public.projects as p set archived_at = pg_catalog.now()
  where p.organization_id = p_organization_id
    and p.id = p_project_id
    and p.archived_at is null;
  if not found then raise exception 'project not found or already archived'; end if;
end;
$$;
revoke all on function public.archive_project(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.archive_project(uuid, uuid) to authenticated;

-- Field Attention: Work Order is its own source; Project is denormalized context.
alter table public.attention_items add column work_order_id uuid;

alter table public.attention_items drop constraint attention_items_source_type_chk;
alter table public.attention_items add constraint attention_items_source_type_chk check (
  source_type in (
    'enrollment', 'social_publication', 'social_connection', 'project', 'work_order'
  )
);

alter table public.attention_items drop constraint attention_items_source_shape_chk;
alter table public.attention_items add constraint attention_items_source_shape_chk check (
  (
    source_type = 'enrollment'
    and enrollment_id is not null and customer_id is not null and program_id is not null
    and source_entity_id = enrollment_id
    and social_publication_id is null and social_connection_id is null
    and project_id is null and task_id is null and work_order_id is null
  ) or (
    source_type = 'social_publication'
    and enrollment_id is null and customer_id is null and program_id is null
    and social_publication_id is not null and source_entity_id = social_publication_id
    and social_connection_id is null and project_id is null and task_id is null
    and work_order_id is null
  ) or (
    source_type = 'social_connection'
    and enrollment_id is null and customer_id is null and program_id is null
    and social_publication_id is null and social_connection_id is not null
    and source_entity_id = social_connection_id
    and project_id is null and task_id is null and work_order_id is null
  ) or (
    source_type = 'project'
    and enrollment_id is null and customer_id is null and program_id is null
    and social_publication_id is null and social_connection_id is null
    and project_id is not null and source_entity_id = project_id
    and work_order_id is null
  ) or (
    source_type = 'work_order'
    and enrollment_id is null and customer_id is null and program_id is null
    and social_publication_id is null and social_connection_id is null
    and project_id is not null and task_id is null and work_order_id is not null
    and source_entity_id = work_order_id
  )
);

alter table public.attention_items add constraint attention_items_work_order_fk
  foreign key (organization_id, work_order_id)
  references public.work_orders (organization_id, id) on delete restrict;
create index attention_items_organization_work_order_idx
  on public.attention_items (organization_id, work_order_id)
  where work_order_id is not null;

alter table public.attention_signals drop constraint attention_signals_rule_key_check;
alter table public.attention_signals add constraint attention_signals_rule_key_check check (
  rule_key is null or rule_key in (
    'enrollment_no_recent_progress',
    'scheduled_publication_missed', 'publication_result_unknown',
    'social_account_reauthorization_required', 'provider_permission_missing',
    'scheduled_publication_failed',
    'project_overdue_active', 'project_task_overdue', 'project_no_owner',
    'work_order_overdue', 'work_order_unassigned'
  )
);

alter table public.attention_signals drop constraint attention_signals_origin_rule_consistency_check;
alter table public.attention_signals add constraint attention_signals_origin_rule_consistency_check check (
  (signal_origin = 'manual' and rule_key is null)
  or (
    signal_origin = 'rule' and rule_key in (
      'enrollment_no_recent_progress',
      'scheduled_publication_missed', 'publication_result_unknown',
      'social_account_reauthorization_required', 'provider_permission_missing',
      'scheduled_publication_failed',
      'project_overdue_active', 'project_task_overdue', 'project_no_owner',
      'work_order_overdue', 'work_order_unassigned'
    )
  )
);

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
    if p_rule_key is null or p_rule_key not in (
      'enrollment_no_recent_progress',
      'scheduled_publication_missed', 'publication_result_unknown',
      'social_account_reauthorization_required', 'provider_permission_missing',
      'scheduled_publication_failed',
      'project_overdue_active', 'project_task_overdue', 'project_no_owner',
      'work_order_overdue', 'work_order_unassigned'
    ) then
      raise exception 'invalid attention rule key';
    end if;
  else
    raise exception 'invalid attention signal origin';
  end if;

  insert into public.attention_signals (
    organization_id, attention_item_id, enrollment_id, signal_origin, rule_key,
    explanation, evidence, detected_at, created_by_member_id
  ) values (
    p_organization_id, p_attention_item_id, p_enrollment_id, p_signal_origin,
    p_rule_key, v_explanation, v_evidence, coalesce(p_detected_at, pg_catalog.now()),
    p_created_by_member_id
  ) returning id into v_signal_id;
  return v_signal_id;
end;
$$;
revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from public, anon, authenticated;

create or replace function private.upsert_work_order_attention_item(
  p_organization_id uuid,
  p_work_order_id uuid,
  p_project_id uuid,
  p_rule_key text,
  p_severity text,
  p_title text,
  p_summary text,
  p_explanation text,
  p_actor_member_id uuid
)
returns table (result_code text, attention_item_id uuid, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_dedupe text;
  v_item public.attention_items;
  v_item_id uuid;
  v_signal_id uuid;
begin
  v_dedupe := private.build_attention_source_dedupe_key(
    p_organization_id, 'work_order', p_work_order_id, p_rule_key
  );
  select ai.* into v_item from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.source_type = 'work_order'
    and ai.source_entity_id = p_work_order_id
    and ai.dedupe_key = v_dedupe
    and ai.status in ('open', 'acknowledged')
  for update;

  if found then
    v_item_id := v_item.id;
    v_signal_id := private.append_attention_signal(
      p_organization_id, v_item_id, null, 'rule', p_rule_key,
      p_explanation, jsonb_build_object('kind', 'generic'), v_now, null
    );
    update public.attention_items as ai set
      detection_count = ai.detection_count + 1,
      last_detected_at = v_now,
      updated_by_member_id = p_actor_member_id
    where ai.organization_id = p_organization_id and ai.id = v_item_id;
    perform private.insert_attention_item_event(
      p_organization_id, v_item_id, 'detection_updated',
      v_item.status, v_item.status, null, null, null, null, null,
      'rule', p_actor_member_id, jsonb_build_object('signal_id', v_signal_id)
    );
    return query select 'updated'::text, v_item_id, false;
    return;
  end if;

  insert into public.attention_items (
    organization_id, source_type, source_entity_id, project_id, work_order_id,
    title, summary, status, severity, dedupe_key,
    first_detected_at, last_detected_at, created_by_member_id, updated_by_member_id
  ) values (
    p_organization_id, 'work_order', p_work_order_id, p_project_id, p_work_order_id,
    p_title, p_summary, 'open', p_severity, v_dedupe,
    v_now, v_now, p_actor_member_id, p_actor_member_id
  ) returning id into v_item_id;
  v_signal_id := private.append_attention_signal(
    p_organization_id, v_item_id, null, 'rule', p_rule_key,
    p_explanation, jsonb_build_object('kind', 'generic'), v_now, null
  );
  perform private.insert_attention_item_event(
    p_organization_id, v_item_id, 'created', null, 'open',
    null, p_severity, null, null, null, 'rule', p_actor_member_id,
    jsonb_build_object('signal_id', v_signal_id, 'rule_key', p_rule_key)
  );
  return query select 'created'::text, v_item_id, true;
end;
$$;

create or replace function private.expire_work_order_attention_item(
  p_organization_id uuid,
  p_work_order_id uuid,
  p_rule_key text,
  p_expired_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item_id uuid;
begin
  select ai.id into v_item_id from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.source_type = 'work_order'
    and ai.source_entity_id = p_work_order_id
    and ai.dedupe_key = private.build_attention_source_dedupe_key(
      p_organization_id, 'work_order', p_work_order_id, p_rule_key
    )
    and ai.status in ('open', 'acknowledged')
  for update;
  if not found then return false; end if;
  perform private.expire_attention_item(p_organization_id, v_item_id, p_expired_at);
  return true;
end;
$$;

revoke all on function private.upsert_work_order_attention_item(
  uuid, uuid, uuid, text, text, text, text, text, uuid
) from public, anon, authenticated;
revoke all on function private.expire_work_order_attention_item(
  uuid, uuid, text, timestamptz
) from public, anon, authenticated;

create or replace function public.evaluate_work_order_attention_rules(
  p_organization_id uuid,
  p_work_order_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member_id uuid;
  v_now timestamptz := pg_catalog.now();
  v_work_order record;
  v_result record;
  v_created integer := 0;
  v_updated integer := 0;
  v_expired integer := 0;
begin
  select membership_id into v_member_id
  from private.require_attention_actor(p_organization_id, array['owner', 'admin']);

  if p_work_order_id is not null and not exists (
    select 1 from public.work_orders as wo
    where wo.organization_id = p_organization_id and wo.id = p_work_order_id
  ) then
    raise exception 'work order not found';
  end if;

  for v_work_order in
    select wo.id, wo.project_id, wo.title, wo.status,
      wo.scheduled_for, wo.technician_member_id
    from public.work_orders as wo
    join public.projects as p
      on p.organization_id = wo.organization_id and p.id = wo.project_id
    where wo.organization_id = p_organization_id
      and (p_work_order_id is null or wo.id = p_work_order_id)
      and p.archived_at is null
  loop
    if v_work_order.status = 'scheduled'
      and v_work_order.scheduled_for < v_now then
      select * into v_result from private.upsert_work_order_attention_item(
        p_organization_id, v_work_order.id, v_work_order.project_id,
        'work_order_overdue', 'high',
        'Scheduled work order is overdue',
        v_work_order.title || ' has not started after its scheduled time.',
        'The work order is still scheduled after ' || v_work_order.scheduled_for::text || '.',
        v_member_id
      );
      if v_result.created then v_created := v_created + 1; else v_updated := v_updated + 1; end if;
    elsif private.expire_work_order_attention_item(
      p_organization_id, v_work_order.id, 'work_order_overdue', v_now
    ) then
      v_expired := v_expired + 1;
    end if;

    if v_work_order.status in ('scheduled', 'in_progress')
      and v_work_order.scheduled_for <= v_now + interval '24 hours'
      and v_work_order.technician_member_id is null then
      select * into v_result from private.upsert_work_order_attention_item(
        p_organization_id, v_work_order.id, v_work_order.project_id,
        'work_order_unassigned', 'high',
        'Work order needs a technician',
        v_work_order.title || ' is due within 24 hours and has no technician.',
        'Assign an active organization member before field execution.',
        v_member_id
      );
      if v_result.created then v_created := v_created + 1; else v_updated := v_updated + 1; end if;
    elsif private.expire_work_order_attention_item(
      p_organization_id, v_work_order.id, 'work_order_unassigned', v_now
    ) then
      v_expired := v_expired + 1;
    end if;
  end loop;

  for v_work_order in
    select ai.source_entity_id as id, s.rule_key
    from public.attention_items as ai
    join public.attention_signals as s on s.attention_item_id = ai.id
    where ai.organization_id = p_organization_id
      and ai.source_type = 'work_order'
      and ai.status in ('open', 'acknowledged')
      and s.rule_key in ('work_order_overdue', 'work_order_unassigned')
      and (p_work_order_id is null or ai.source_entity_id = p_work_order_id)
      and not exists (
        select 1 from public.work_orders as wo
        join public.projects as p
          on p.organization_id = wo.organization_id and p.id = wo.project_id
        where wo.organization_id = p_organization_id
          and wo.id = ai.source_entity_id
          and p.archived_at is null
          and (
            (s.rule_key = 'work_order_overdue'
              and wo.status = 'scheduled' and wo.scheduled_for < v_now)
            or
            (s.rule_key = 'work_order_unassigned'
              and wo.status in ('scheduled', 'in_progress')
              and wo.scheduled_for <= v_now + interval '24 hours'
              and wo.technician_member_id is null)
          )
      )
    group by ai.source_entity_id, s.rule_key
  loop
    if private.expire_work_order_attention_item(
      p_organization_id, v_work_order.id, v_work_order.rule_key, v_now
    ) then
      v_expired := v_expired + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'created', v_created, 'updated', v_updated, 'expired', v_expired,
    'evaluated_at', v_now
  );
end;
$$;

revoke all on function public.evaluate_work_order_attention_rules(uuid, uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.evaluate_work_order_attention_rules(uuid, uuid)
  to authenticated;
