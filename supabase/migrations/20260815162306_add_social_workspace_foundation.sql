-- SMM-B1.2 — Social Workspace Foundation
-- Additive: social_brands (minimal identity), social_workspaces (1:1 Brand),
-- append-only workspace events, physical org-bound FKs from connections/intents,
-- workspace RPCs, and connection-intent eligibility checks.
--
-- Brand Brain (tone, pillars, audiences, etc.) remains SMM-B1.3.
-- No provider CHECK broadening. No service-role client. No fixture data.

-- ---------------------------------------------------------------------------
-- public.social_brands (minimal Brand identity — not Brand Brain)
-- ---------------------------------------------------------------------------

create table public.social_brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  display_name text not null,
  customer_id uuid,
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_brands_org_id_unique unique (organization_id, id),
  constraint social_brands_display_name_not_empty_chk
    check (char_length(btrim(display_name)) > 0),
  constraint social_brands_display_name_length_chk
    check (char_length(display_name) <= 200),
  constraint social_brands_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_brands_customer_fk
    foreign key (organization_id, customer_id)
    references public.customers (organization_id, id)
    on delete restrict,
  constraint social_brands_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_brands is
  'Minimal Social Brand identity (SMM-B1.2). Brand Brain configuration belongs to SMM-B1.3. Optional customer_id links existing CRM customers — no duplicate client table.';

comment on column public.social_brands.customer_id is
  'Optional same-Organization reference to public.customers. Null when the Brand is not tied to a CRM customer.';

comment on column public.social_brands.archived_at is
  'Soft archive. Orthogonal to future Brand Brain state. Archiving a Brand archives its Workspace.';

create index social_brands_org_active_idx
  on public.social_brands (organization_id)
  where archived_at is null;

create index social_brands_org_customer_idx
  on public.social_brands (organization_id, customer_id)
  where customer_id is not null;

create trigger social_brands_set_updated_at
  before update on public.social_brands
  for each row
  execute function public.set_updated_at();

alter table public.social_brands enable row level security;

revoke all on table public.social_brands from public;
revoke all on table public.social_brands from anon;
revoke all on table public.social_brands from authenticated;
revoke all on table public.social_brands from service_role;

grant select on table public.social_brands to authenticated;

create policy social_brands_select_member
  on public.social_brands
  for select
  to authenticated
  using (private.is_org_member(organization_id));

revoke insert, update, delete on table public.social_brands from authenticated;
revoke insert, update, delete on table public.social_brands from anon;

-- ---------------------------------------------------------------------------
-- public.social_workspaces
-- ---------------------------------------------------------------------------

create table public.social_workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  display_name text not null,
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_workspaces_org_id_unique unique (organization_id, id),
  constraint social_workspaces_org_brand_unique unique (organization_id, brand_id),
  constraint social_workspaces_display_name_not_empty_chk
    check (char_length(btrim(display_name)) > 0),
  constraint social_workspaces_display_name_length_chk
    check (char_length(display_name) <= 200),
  constraint social_workspaces_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_workspaces_brand_fk
    foreign key (organization_id, brand_id)
    references public.social_brands (organization_id, id)
    on delete restrict,
  constraint social_workspaces_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_workspaces is
  'Canonical Social Workspace (SMM-B1.2). Provider-neutral operational container under an Organization Brand. Exactly one Workspace per Brand in Beta 1.';

comment on column public.social_workspaces.archived_at is
  'Soft archive. New Social connections/intents must not target an archived Workspace.';

create index social_workspaces_org_active_idx
  on public.social_workspaces (organization_id)
  where archived_at is null;

create index social_workspaces_org_brand_idx
  on public.social_workspaces (organization_id, brand_id);

create trigger social_workspaces_set_updated_at
  before update on public.social_workspaces
  for each row
  execute function public.set_updated_at();

alter table public.social_workspaces enable row level security;

revoke all on table public.social_workspaces from public;
revoke all on table public.social_workspaces from anon;
revoke all on table public.social_workspaces from authenticated;
revoke all on table public.social_workspaces from service_role;

grant select on table public.social_workspaces to authenticated;

create policy social_workspaces_select_member
  on public.social_workspaces
  for select
  to authenticated
  using (private.is_org_member(organization_id));

revoke insert, update, delete on table public.social_workspaces from authenticated;
revoke insert, update, delete on table public.social_workspaces from anon;

-- ---------------------------------------------------------------------------
-- public.social_workspace_events (append-only)
-- ---------------------------------------------------------------------------

create table public.social_workspace_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  workspace_id uuid not null,
  event_type text not null,
  actor_source text not null,
  actor_member_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_workspace_events_org_id_unique unique (organization_id, id),
  constraint social_workspace_events_event_type_chk
    check (
      event_type in (
        'social_workspace_created',
        'social_workspace_updated',
        'social_workspace_archived'
      )
    ),
  constraint social_workspace_events_actor_source_chk
    check (actor_source in ('member', 'system')),
  constraint social_workspace_events_payload_object_chk
    check (jsonb_typeof(payload) = 'object'),
  constraint social_workspace_events_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_workspace_events_workspace_fk
    foreign key (organization_id, workspace_id)
    references public.social_workspaces (organization_id, id)
    on delete cascade,
  constraint social_workspace_events_actor_member_fk
    foreign key (organization_id, actor_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_workspace_events is
  'Append-only Social Workspace audit events. No tokens, credentials, or OAuth state.';

create or replace function private.guard_social_workspace_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social workspace events are immutable'
    using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_workspace_event_immutable() from public;
revoke all on function private.guard_social_workspace_event_immutable() from anon;
revoke all on function private.guard_social_workspace_event_immutable() from authenticated;
revoke all on function private.guard_social_workspace_event_immutable() from service_role;

create trigger social_workspace_events_guard_immutable
  before update or delete on public.social_workspace_events
  for each row
  execute function private.guard_social_workspace_event_immutable();

create index social_workspace_events_org_workspace_created_idx
  on public.social_workspace_events (
    organization_id,
    workspace_id,
    created_at desc
  );

alter table public.social_workspace_events enable row level security;

revoke all on table public.social_workspace_events from public;
revoke all on table public.social_workspace_events from anon;
revoke all on table public.social_workspace_events from authenticated;
revoke all on table public.social_workspace_events from service_role;

grant select on table public.social_workspace_events to authenticated;

create policy social_workspace_events_select_owner_admin
  on public.social_workspace_events
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

revoke insert, update, delete on table public.social_workspace_events from authenticated;
revoke insert, update, delete on table public.social_workspace_events from anon;

-- ---------------------------------------------------------------------------
-- Physical FKs for existing Social workspace_id columns (0-row safe)
-- ---------------------------------------------------------------------------

alter table public.social_account_connections
  add constraint social_account_connections_workspace_fk
  foreign key (organization_id, workspace_id)
  references public.social_workspaces (organization_id, id)
  on delete restrict;

comment on column public.social_account_connections.workspace_id is
  'Social Workspace identity. Physical org-bound FK to public.social_workspaces (SMM-B1.2).';

alter table private.social_oauth_authorization_intents
  add constraint social_oauth_authorization_intents_workspace_fk
  foreign key (organization_id, workspace_id)
  references public.social_workspaces (organization_id, id)
  on delete restrict;

comment on column private.social_oauth_authorization_intents.workspace_id is
  'Social Workspace identity bound at OAuth intent creation. Physical org-bound FK to public.social_workspaces (SMM-B1.2).';

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create or replace function private.get_social_workspace_actor_membership(
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

revoke all on function private.get_social_workspace_actor_membership(uuid) from public;
revoke all on function private.get_social_workspace_actor_membership(uuid) from anon;
revoke all on function private.get_social_workspace_actor_membership(uuid) from authenticated;
revoke all on function private.get_social_workspace_actor_membership(uuid) from service_role;

create or replace function private.assert_active_organization_for_social_workspace_mutation(
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
    raise exception 'organization not found or not active'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.assert_active_organization_for_social_workspace_mutation(uuid) from public;
revoke all on function private.assert_active_organization_for_social_workspace_mutation(uuid) from anon;
revoke all on function private.assert_active_organization_for_social_workspace_mutation(uuid) from authenticated;
revoke all on function private.assert_active_organization_for_social_workspace_mutation(uuid) from service_role;

create or replace function private.can_manage_social_workspaces(p_actor_role text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_actor_role in ('owner', 'admin');
$$;

revoke all on function private.can_manage_social_workspaces(text) from public;
revoke all on function private.can_manage_social_workspaces(text) from anon;
revoke all on function private.can_manage_social_workspaces(text) from authenticated;
revoke all on function private.can_manage_social_workspaces(text) from service_role;

create or replace function private.is_social_workspace_eligible_for_connection(
  p_organization_id uuid,
  p_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.social_workspaces as sw
    where sw.organization_id = p_organization_id
      and sw.id = p_workspace_id
      and sw.archived_at is null
  );
$$;

revoke all on function private.is_social_workspace_eligible_for_connection(uuid, uuid) from public;
revoke all on function private.is_social_workspace_eligible_for_connection(uuid, uuid) from anon;
revoke all on function private.is_social_workspace_eligible_for_connection(uuid, uuid) from authenticated;
revoke all on function private.is_social_workspace_eligible_for_connection(uuid, uuid) from service_role;

create or replace function private.insert_social_workspace_event(
  p_organization_id uuid,
  p_workspace_id uuid,
  p_event_type text,
  p_actor_source text,
  p_actor_member_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
begin
  if jsonb_typeof(v_payload) is distinct from 'object' then
    raise exception 'invalid social workspace event payload'
      using errcode = 'P0001';
  end if;

  if v_payload ?| array[
    'access_token',
    'refresh_token',
    'token',
    'ciphertext',
    'iv',
    'auth_tag',
    'authorization_code',
    'client_secret',
    'raw_state',
    'state'
  ] then
    raise exception 'social workspace event payload contains forbidden secret keys'
      using errcode = 'P0001';
  end if;

  insert into public.social_workspace_events (
    organization_id,
    workspace_id,
    event_type,
    actor_source,
    actor_member_id,
    payload
  )
  values (
    p_organization_id,
    p_workspace_id,
    p_event_type,
    p_actor_source,
    p_actor_member_id,
    v_payload
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function private.insert_social_workspace_event(uuid, uuid, text, text, uuid, jsonb) from public;
revoke all on function private.insert_social_workspace_event(uuid, uuid, text, text, uuid, jsonb) from anon;
revoke all on function private.insert_social_workspace_event(uuid, uuid, text, text, uuid, jsonb) from authenticated;
revoke all on function private.insert_social_workspace_event(uuid, uuid, text, text, uuid, jsonb) from service_role;

-- ---------------------------------------------------------------------------
-- Workspace RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_social_workspace(
  p_organization_id uuid,
  p_display_name text,
  p_customer_id uuid default null
)
returns table (
  result_code text,
  brand_id uuid,
  workspace_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_display_name text;
  v_brand_id uuid;
  v_workspace_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  v_display_name := btrim(coalesce(p_display_name, ''));

  if p_organization_id is null
     or char_length(v_display_name) = 0
     or char_length(v_display_name) > 200
  then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_workspace_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text, null::uuid, null::uuid;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_workspace_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid, null::uuid;
      return;
  end;

  if not private.can_manage_social_workspaces(v_member_role) then
    return query select 'forbidden'::text, null::uuid, null::uuid;
    return;
  end if;

  if p_customer_id is not null then
    if not exists (
      select 1
      from public.customers as c
      where c.organization_id = p_organization_id
        and c.id = p_customer_id
        and c.archived_at is null
    ) then
      return query select 'invalid_input'::text, null::uuid, null::uuid;
      return;
    end if;
  end if;

  insert into public.social_brands (
    organization_id,
    display_name,
    customer_id,
    created_by_member_id
  )
  values (
    p_organization_id,
    v_display_name,
    p_customer_id,
    v_membership_id
  )
  returning id into v_brand_id;

  insert into public.social_workspaces (
    organization_id,
    brand_id,
    display_name,
    created_by_member_id
  )
  values (
    p_organization_id,
    v_brand_id,
    v_display_name,
    v_membership_id
  )
  returning id into v_workspace_id;

  perform private.insert_social_workspace_event(
    p_organization_id,
    v_workspace_id,
    'social_workspace_created',
    'member',
    v_membership_id,
    jsonb_build_object(
      'brand_id', v_brand_id,
      'display_name', v_display_name,
      'customer_id', p_customer_id
    )
  );

  return query select 'success'::text, v_brand_id, v_workspace_id;
end;
$$;

revoke all on function public.create_social_workspace(uuid, text, uuid) from public;
revoke all on function public.create_social_workspace(uuid, text, uuid) from anon;
revoke all on function public.create_social_workspace(uuid, text, uuid) from authenticated;
revoke all on function public.create_social_workspace(uuid, text, uuid) from service_role;
grant execute on function public.create_social_workspace(uuid, text, uuid) to authenticated;

create or replace function public.update_social_workspace(
  p_organization_id uuid,
  p_workspace_id uuid,
  p_display_name text
)
returns table (
  result_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_display_name text;
  v_brand_id uuid;
  v_archived_at timestamptz;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  v_display_name := btrim(coalesce(p_display_name, ''));

  if p_organization_id is null
     or p_workspace_id is null
     or char_length(v_display_name) = 0
     or char_length(v_display_name) > 200
  then
    return query select 'invalid_input'::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_workspace_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_workspace_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text;
      return;
  end;

  if not private.can_manage_social_workspaces(v_member_role) then
    return query select 'forbidden'::text;
    return;
  end if;

  select sw.brand_id, sw.archived_at
  into v_brand_id, v_archived_at
  from public.social_workspaces as sw
  where sw.organization_id = p_organization_id
    and sw.id = p_workspace_id;

  if not found then
    return query select 'not_found'::text;
    return;
  end if;

  if v_archived_at is not null then
    return query select 'conflict'::text;
    return;
  end if;

  update public.social_workspaces as sw
  set display_name = v_display_name
  where sw.organization_id = p_organization_id
    and sw.id = p_workspace_id
    and sw.archived_at is null;

  update public.social_brands as sb
  set display_name = v_display_name
  where sb.organization_id = p_organization_id
    and sb.id = v_brand_id
    and sb.archived_at is null;

  perform private.insert_social_workspace_event(
    p_organization_id,
    p_workspace_id,
    'social_workspace_updated',
    'member',
    v_membership_id,
    jsonb_build_object(
      'brand_id', v_brand_id,
      'display_name', v_display_name
    )
  );

  return query select 'success'::text;
end;
$$;

revoke all on function public.update_social_workspace(uuid, uuid, text) from public;
revoke all on function public.update_social_workspace(uuid, uuid, text) from anon;
revoke all on function public.update_social_workspace(uuid, uuid, text) from authenticated;
revoke all on function public.update_social_workspace(uuid, uuid, text) from service_role;
grant execute on function public.update_social_workspace(uuid, uuid, text) to authenticated;

create or replace function public.archive_social_workspace(
  p_organization_id uuid,
  p_workspace_id uuid
)
returns table (
  result_code text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_brand_id uuid;
  v_archived_at timestamptz;
  v_now timestamptz := pg_catalog.now();
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null or p_workspace_id is null then
    return query select 'invalid_input'::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_workspace_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_workspace_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text;
      return;
  end;

  if not private.can_manage_social_workspaces(v_member_role) then
    return query select 'forbidden'::text;
    return;
  end if;

  select sw.brand_id, sw.archived_at
  into v_brand_id, v_archived_at
  from public.social_workspaces as sw
  where sw.organization_id = p_organization_id
    and sw.id = p_workspace_id;

  if not found then
    return query select 'not_found'::text;
    return;
  end if;

  if v_archived_at is not null then
    return query select 'conflict'::text;
    return;
  end if;

  update public.social_workspaces as sw
  set archived_at = v_now
  where sw.organization_id = p_organization_id
    and sw.id = p_workspace_id
    and sw.archived_at is null;

  update public.social_brands as sb
  set archived_at = v_now
  where sb.organization_id = p_organization_id
    and sb.id = v_brand_id
    and sb.archived_at is null;

  perform private.insert_social_workspace_event(
    p_organization_id,
    p_workspace_id,
    'social_workspace_archived',
    'member',
    v_membership_id,
    jsonb_build_object('brand_id', v_brand_id)
  );

  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_workspace(uuid, uuid) from public;
revoke all on function public.archive_social_workspace(uuid, uuid) from anon;
revoke all on function public.archive_social_workspace(uuid, uuid) from authenticated;
revoke all on function public.archive_social_workspace(uuid, uuid) from service_role;
grant execute on function public.archive_social_workspace(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Patch connection intent RPCs: require eligible same-org workspace
-- ---------------------------------------------------------------------------

create or replace function public.create_social_connection_intent(
  p_organization_id uuid,
  p_workspace_id uuid,
  p_provider text,
  p_return_path_id text,
  p_state_fingerprint text,
  p_expires_at timestamptz
)
returns table (
  result_code text,
  connection_id uuid,
  intent_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_connection_id uuid;
  v_intent_id uuid;
  v_now timestamptz := pg_catalog.now();
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null
     or p_workspace_id is null
     or p_provider is null
     or p_return_path_id is null
     or p_state_fingerprint is null
     or p_expires_at is null
     or p_state_fingerprint !~ '^[0-9a-f]{64}$'
     or p_return_path_id <> 'social_workspace'
     or p_expires_at <= v_now
     or p_expires_at > v_now + interval '30 minutes'
  then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
    return;
  end if;

  if p_provider <> 'instagram' then
    return query select 'provider_unsupported'::text, null::uuid, null::uuid;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text, null::uuid, null::uuid;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid, null::uuid;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid, null::uuid;
    return;
  end if;

  if not private.is_social_workspace_eligible_for_connection(
    p_organization_id,
    p_workspace_id
  ) then
    return query select 'workspace_not_found'::text, null::uuid, null::uuid;
    return;
  end if;

  if not private.try_consume_social_connection_rate_limit(
    p_organization_id,
    v_actor_user_id,
    'connect',
    '',
    10,
    3600
  ) then
    return query select 'rate_limited'::text, null::uuid, null::uuid;
    return;
  end if;

  insert into public.social_account_connections (
    organization_id,
    workspace_id,
    provider,
    login_product,
    status,
    health,
    connected_by_member_id
  )
  values (
    p_organization_id,
    p_workspace_id,
    'instagram',
    'instagram_login',
    'authorization_pending',
    'healthy',
    v_membership_id
  )
  returning id into v_connection_id;

  insert into private.social_oauth_authorization_intents (
    organization_id,
    workspace_id,
    connection_id,
    initiating_actor_user_id,
    initiating_member_id,
    provider,
    login_product,
    return_path_id,
    state_fingerprint,
    intent_kind,
    status,
    expected_external_account_id,
    expires_at
  )
  values (
    p_organization_id,
    p_workspace_id,
    v_connection_id,
    v_actor_user_id,
    v_membership_id,
    'instagram',
    'instagram_login',
    'social_workspace',
    p_state_fingerprint,
    'connect',
    'pending',
    null,
    p_expires_at
  )
  returning id into v_intent_id;

  perform private.insert_social_connection_event(
    p_organization_id,
    v_connection_id,
    'social_connection_initiated',
    'member',
    v_membership_id,
    jsonb_build_object('provider', 'instagram', 'intent_kind', 'connect')
  );

  return query select 'success'::text, v_connection_id, v_intent_id;
end;
$$;

create or replace function public.create_social_reauthorization_intent(
  p_connection_id uuid,
  p_return_path_id text,
  p_state_fingerprint text,
  p_expires_at timestamptz
)
returns table (
  result_code text,
  connection_id uuid,
  intent_id uuid,
  expected_external_account_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_connection public.social_account_connections;
  v_intent_id uuid;
  v_now timestamptz := pg_catalog.now();
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_connection_id is null
     or p_return_path_id is null
     or p_state_fingerprint is null
     or p_expires_at is null
     or p_state_fingerprint !~ '^[0-9a-f]{64}$'
     or p_return_path_id <> 'social_workspace'
     or p_expires_at <= v_now
     or p_expires_at > v_now + interval '30 minutes'
  then
    return query select 'invalid_input'::text, null::uuid, null::uuid, null::text;
    return;
  end if;

  select sac.*
  into v_connection
  from public.social_account_connections as sac
  where sac.id = p_connection_id;

  if not found then
    return query select 'not_found'::text, null::uuid, null::uuid, null::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(v_connection.organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'not_found'::text, null::uuid, null::uuid, null::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(
      v_connection.organization_id
    );
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid, null::uuid, null::text;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid, null::uuid, null::text;
    return;
  end if;

  if v_connection.status = 'disconnected' then
    return query select 'conflict'::text, v_connection.id, null::uuid, null::text;
    return;
  end if;

  if v_connection.external_account_id is null then
    return query select 'conflict'::text, v_connection.id, null::uuid, null::text;
    return;
  end if;

  if not private.is_social_workspace_eligible_for_connection(
    v_connection.organization_id,
    v_connection.workspace_id
  ) then
    return query select 'conflict'::text, v_connection.id, null::uuid, null::text;
    return;
  end if;

  if not private.try_consume_social_connection_rate_limit(
    v_connection.organization_id,
    v_actor_user_id,
    'reauthorize',
    '',
    10,
    3600
  ) then
    return query select 'rate_limited'::text, null::uuid, null::uuid, null::text;
    return;
  end if;

  insert into private.social_oauth_authorization_intents (
    organization_id,
    workspace_id,
    connection_id,
    initiating_actor_user_id,
    initiating_member_id,
    provider,
    login_product,
    return_path_id,
    state_fingerprint,
    intent_kind,
    status,
    expected_external_account_id,
    expires_at
  )
  values (
    v_connection.organization_id,
    v_connection.workspace_id,
    v_connection.id,
    v_actor_user_id,
    v_membership_id,
    v_connection.provider,
    v_connection.login_product,
    'social_workspace',
    p_state_fingerprint,
    'reauthorize',
    'pending',
    v_connection.external_account_id,
    p_expires_at
  )
  returning id into v_intent_id;

  return query
    select
      'success'::text,
      v_connection.id,
      v_intent_id,
      v_connection.external_account_id;
end;
$$;
