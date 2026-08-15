-- ZyntixAI SMM-B1.1-B:
-- Social Account Connection persistence, private AES-GCM credential storage,
-- OAuth authorization-intent foundation, audit events, and abuse limits.
--
-- No provider HTTP. No OAuth execution. No plaintext tokens.
-- Workspace physical FK is deferred to SMM-B1.2 (social_workspaces does not exist).
-- Uniqueness is organization-scoped per SMM-B1.0 (not global exclusive).

-- ---------------------------------------------------------------------------
-- Capability validator (used by connection CHECK)
-- ---------------------------------------------------------------------------

create or replace function private.social_beta1_capabilities_are_valid(p_capabilities jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select
    p_capabilities is not null
    and jsonb_typeof(p_capabilities) = 'array'
    and not exists (
      select 1
      from jsonb_array_elements_text(p_capabilities) as elem
      where elem not in (
        'publish_image',
        'publish_video',
        'publish_carousel',
        'publish_story',
        'publish_short',
        'schedule_via_provider',
        'fetch_metrics',
        'account_insights'
      )
    );
$$;

comment on function private.social_beta1_capabilities_are_valid(jsonb) is
  'True when jsonb is a Beta 1 capability array with no unknown strings.';

revoke all on function private.social_beta1_capabilities_are_valid(jsonb) from public;
revoke all on function private.social_beta1_capabilities_are_valid(jsonb) from anon;
revoke all on function private.social_beta1_capabilities_are_valid(jsonb) from authenticated;
revoke all on function private.social_beta1_capabilities_are_valid(jsonb) from service_role;

-- ---------------------------------------------------------------------------
-- public.social_account_connections
-- ---------------------------------------------------------------------------

create table public.social_account_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  workspace_id uuid not null,
  provider text not null,
  login_product text not null,
  external_account_id text,
  display_name text,
  professional_account_type text,
  status text not null,
  health text not null default 'healthy',
  capability_snapshot jsonb not null default '[]'::jsonb,
  capability_snapshot_at timestamptz,
  credential_ref_id uuid,
  connected_by_member_id uuid not null,
  token_expires_at timestamptz,
  last_refreshed_at timestamptz,
  reauthorization_required_at timestamptz,
  connected_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint social_account_connections_org_id_unique unique (organization_id, id),
  constraint social_account_connections_provider_chk
    check (provider = 'instagram'),
  constraint social_account_connections_login_product_chk
    check (login_product = 'instagram_login'),
  constraint social_account_connections_provider_login_chk
    check (
      (provider = 'instagram' and login_product = 'instagram_login')
    ),
  constraint social_account_connections_status_chk
    check (
      status in (
        'initiated',
        'authorization_pending',
        'connected',
        'reauthorization_required',
        'permission_missing',
        'revoked',
        'disconnected'
      )
    ),
  constraint social_account_connections_health_chk
    check (health in ('healthy', 'degraded', 'provider_unavailable')),
  constraint social_account_connections_account_type_chk
    check (
      professional_account_type is null
      or professional_account_type in ('business', 'creator')
    ),
  constraint social_account_connections_external_id_chk
    check (
      external_account_id is null
      or (
        char_length(external_account_id) > 0
        and char_length(external_account_id) <= 128
        and external_account_id = btrim(external_account_id)
        and position(' ' in external_account_id) = 0
      )
    ),
  constraint social_account_connections_identity_by_status_chk
    check (
      (
        status in ('initiated', 'authorization_pending')
        and external_account_id is null
        and professional_account_type is null
      )
      or (
        status in (
          'connected',
          'reauthorization_required',
          'permission_missing',
          'revoked',
          'disconnected'
        )
        and (
          status = 'disconnected'
          or (
            external_account_id is not null
            and professional_account_type in ('business', 'creator')
          )
        )
      )
    ),
  constraint social_account_connections_capabilities_chk
    check (private.social_beta1_capabilities_are_valid(capability_snapshot)),
  constraint social_account_connections_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_account_connections_connected_by_fk
    foreign key (organization_id, connected_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_account_connections is
  'Social Account Connections. Client-safe operational state only. Mutations via SECURITY DEFINER RPCs. No plaintext or ciphertext credentials.';

comment on column public.social_account_connections.workspace_id is
  'Typed social workspace identity. Physical FK deferred until SMM-B1.2 creates social_workspaces.';

comment on column public.social_account_connections.professional_account_type is
  'Normalized Instagram professional type. Null only before provider discovery (initiated/authorization_pending) or when a disconnected row never completed discovery.';

comment on column public.social_account_connections.credential_ref_id is
  'Reference to private.social_provider_credentials.id. Not a browser-readable credential.';

create unique index social_account_connections_active_external_uidx
  on public.social_account_connections (
    organization_id,
    provider,
    external_account_id
  )
  where status <> 'disconnected'
    and external_account_id is not null;

create index social_account_connections_org_status_idx
  on public.social_account_connections (organization_id, status);

create index social_account_connections_org_workspace_idx
  on public.social_account_connections (organization_id, workspace_id);

create trigger social_account_connections_set_updated_at
  before update on public.social_account_connections
  for each row
  execute function public.set_updated_at();

alter table public.social_account_connections enable row level security;

revoke all on table public.social_account_connections from public;
revoke all on table public.social_account_connections from anon;
revoke all on table public.social_account_connections from authenticated;
revoke all on table public.social_account_connections from service_role;

-- ---------------------------------------------------------------------------
-- public.social_connection_events (append-only)
-- ---------------------------------------------------------------------------

create table public.social_connection_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  connection_id uuid not null,
  event_type text not null,
  actor_source text not null,
  actor_member_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_connection_events_org_id_unique unique (organization_id, id),
  constraint social_connection_events_event_type_chk
    check (
      event_type in (
        'social_connection_initiated',
        'social_connection_established',
        'social_connection_reauthorization_required',
        'social_connection_reauthorized',
        'social_connection_permission_missing',
        'social_connection_revoked',
        'social_connection_disconnected',
        'social_connection_health_changed'
      )
    ),
  constraint social_connection_events_actor_source_chk
    check (actor_source in ('member', 'system')),
  constraint social_connection_events_payload_object_chk
    check (jsonb_typeof(payload) = 'object'),
  constraint social_connection_events_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_connection_events_connection_fk
    foreign key (organization_id, connection_id)
    references public.social_account_connections (organization_id, id)
    on delete cascade,
  constraint social_connection_events_actor_member_fk
    foreign key (organization_id, actor_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_connection_events is
  'Append-only Social Connection audit events. No tokens, ciphertext, IVs, or OAuth state.';

create or replace function private.guard_social_connection_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social connection events are immutable'
    using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_connection_event_immutable() from public;
revoke all on function private.guard_social_connection_event_immutable() from anon;
revoke all on function private.guard_social_connection_event_immutable() from authenticated;
revoke all on function private.guard_social_connection_event_immutable() from service_role;

create trigger social_connection_events_guard_immutable
  before update or delete on public.social_connection_events
  for each row
  execute function private.guard_social_connection_event_immutable();

create index social_connection_events_org_connection_created_idx
  on public.social_connection_events (
    organization_id,
    connection_id,
    created_at desc
  );

alter table public.social_connection_events enable row level security;

revoke all on table public.social_connection_events from public;
revoke all on table public.social_connection_events from anon;
revoke all on table public.social_connection_events from authenticated;
revoke all on table public.social_connection_events from service_role;

-- ---------------------------------------------------------------------------
-- private.social_oauth_authorization_intents
-- ---------------------------------------------------------------------------

create table private.social_oauth_authorization_intents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  workspace_id uuid not null,
  connection_id uuid not null,
  initiating_actor_user_id uuid not null,
  initiating_member_id uuid not null,
  provider text not null,
  login_product text not null,
  return_path_id text not null,
  state_fingerprint text not null,
  intent_kind text not null,
  status text not null,
  expected_external_account_id text,
  created_at timestamptz not null default pg_catalog.now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  constraint social_oauth_authorization_intents_org_id_unique unique (organization_id, id),
  constraint social_oauth_authorization_intents_provider_chk
    check (provider = 'instagram'),
  constraint social_oauth_authorization_intents_login_product_chk
    check (login_product = 'instagram_login'),
  constraint social_oauth_authorization_intents_return_path_chk
    check (return_path_id = 'social_workspace'),
  constraint social_oauth_authorization_intents_kind_chk
    check (intent_kind in ('connect', 'reauthorize')),
  constraint social_oauth_authorization_intents_status_chk
    check (status in ('pending', 'consumed', 'expired', 'abandoned')),
  constraint social_oauth_authorization_intents_fingerprint_chk
    check (state_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint social_oauth_authorization_intents_expiry_chk
    check (expires_at > created_at),
  constraint social_oauth_authorization_intents_consumed_chk
    check (
      (status = 'consumed' and consumed_at is not null)
      or (status <> 'consumed' and consumed_at is null)
    ),
  constraint social_oauth_authorization_intents_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_oauth_authorization_intents_connection_fk
    foreign key (organization_id, connection_id)
    references public.social_account_connections (organization_id, id)
    on delete cascade,
  constraint social_oauth_authorization_intents_member_fk
    foreign key (organization_id, initiating_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint social_oauth_authorization_intents_actor_fk
    foreign key (initiating_actor_user_id)
    references public.profiles (id)
    on delete restrict
);

comment on table private.social_oauth_authorization_intents is
  'Single-use Social OAuth intents. Stores state fingerprint only — never raw OAuth state. No authenticated SELECT.';

create unique index social_oauth_authorization_intents_fingerprint_uidx
  on private.social_oauth_authorization_intents (state_fingerprint);

create index social_oauth_authorization_intents_org_status_idx
  on private.social_oauth_authorization_intents (organization_id, status);

alter table private.social_oauth_authorization_intents enable row level security;

revoke all on table private.social_oauth_authorization_intents from public;
revoke all on table private.social_oauth_authorization_intents from anon;
revoke all on table private.social_oauth_authorization_intents from authenticated;
revoke all on table private.social_oauth_authorization_intents from service_role;

-- ---------------------------------------------------------------------------
-- private.social_provider_credentials
-- ---------------------------------------------------------------------------

create table private.social_provider_credentials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  connection_id uuid not null,
  provider text not null,
  encryption_version integer not null,
  key_purpose text not null,
  key_version integer not null,
  ciphertext text not null,
  iv text not null,
  auth_tag text not null,
  credential_version integer not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint social_provider_credentials_org_id_unique unique (organization_id, id),
  constraint social_provider_credentials_org_connection_unique unique (
    organization_id,
    connection_id
  ),
  constraint social_provider_credentials_connection_unique unique (connection_id),
  constraint social_provider_credentials_provider_chk
    check (provider = 'instagram'),
  constraint social_provider_credentials_encryption_version_chk
    check (encryption_version = 1),
  constraint social_provider_credentials_key_purpose_chk
    check (key_purpose = 'zyntixai.smm.credential.aes-v1'),
  constraint social_provider_credentials_key_version_chk
    check (key_version >= 1),
  constraint social_provider_credentials_credential_version_chk
    check (credential_version >= 1),
  constraint social_provider_credentials_ciphertext_chk
    check (char_length(btrim(ciphertext)) > 0),
  constraint social_provider_credentials_iv_chk
    check (char_length(btrim(iv)) > 0),
  constraint social_provider_credentials_auth_tag_chk
    check (char_length(btrim(auth_tag)) > 0),
  constraint social_provider_credentials_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_provider_credentials_connection_fk
    foreign key (organization_id, connection_id)
    references public.social_account_connections (organization_id, id)
    on delete restrict
);

comment on table private.social_provider_credentials is
  'Private AES-256-GCM credential envelopes. One current envelope per connection. No authenticated SELECT/INSERT/UPDATE/DELETE.';

create trigger social_provider_credentials_set_updated_at
  before update on private.social_provider_credentials
  for each row
  execute function public.set_updated_at();

alter table private.social_provider_credentials enable row level security;

revoke all on table private.social_provider_credentials from public;
revoke all on table private.social_provider_credentials from anon;
revoke all on table private.social_provider_credentials from authenticated;
revoke all on table private.social_provider_credentials from service_role;

-- ---------------------------------------------------------------------------
-- private.social_connection_mutation_rate_limits
-- ---------------------------------------------------------------------------

create table private.social_connection_mutation_rate_limits (
  organization_id uuid not null,
  actor_user_id uuid not null,
  action text not null,
  scope_key text not null default '',
  window_started_at timestamptz not null,
  attempt_count integer not null,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint social_connection_mutation_rate_limits_pkey
    primary key (organization_id, actor_user_id, action, scope_key),
  constraint social_connection_mutation_rate_limits_action_chk
    check (
      action in (
        'connect',
        'reauthorize',
        'disconnect',
        'oauth_callback',
        'credential_refresh'
      )
    ),
  constraint social_connection_mutation_rate_limits_count_chk
    check (attempt_count >= 0),
  constraint social_connection_mutation_rate_limits_scope_chk
    check (char_length(scope_key) <= 64)
);

comment on table private.social_connection_mutation_rate_limits is
  'SMM-B1.1-B connection mutation rate-limit windows. No tokens, ciphertext, or OAuth state.';

create index social_connection_mutation_rate_limits_updated_idx
  on private.social_connection_mutation_rate_limits (updated_at);

alter table private.social_connection_mutation_rate_limits enable row level security;

revoke all on table private.social_connection_mutation_rate_limits from public;
revoke all on table private.social_connection_mutation_rate_limits from anon;
revoke all on table private.social_connection_mutation_rate_limits from authenticated;
revoke all on table private.social_connection_mutation_rate_limits from service_role;

create or replace function private.consume_social_connection_mutation_rate_limit(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_action text,
  p_scope_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scope text := coalesce(p_scope_key, '');
  v_now timestamptz := pg_catalog.now();
  v_window_started_at timestamptz;
  v_attempt_count integer;
begin
  if p_organization_id is null
     or p_actor_user_id is null
     or p_action is null
     or p_action not in (
       'connect',
       'reauthorize',
       'disconnect',
       'oauth_callback',
       'credential_refresh'
     )
     or p_max_attempts is null
     or p_max_attempts < 1
     or p_window_seconds is null
     or p_window_seconds < 1
     or char_length(v_scope) > 64
  then
    return false;
  end if;

  delete from private.social_connection_mutation_rate_limits as rl
  where rl.organization_id = p_organization_id
    and rl.actor_user_id = p_actor_user_id
    and rl.updated_at < v_now - interval '7 days';

  loop
    insert into private.social_connection_mutation_rate_limits (
      organization_id,
      actor_user_id,
      action,
      scope_key,
      window_started_at,
      attempt_count,
      updated_at
    )
    values (
      p_organization_id,
      p_actor_user_id,
      p_action,
      v_scope,
      v_now,
      1,
      v_now
    )
    on conflict do nothing
    returning attempt_count into v_attempt_count;

    if found then
      return true;
    end if;

    select rl.window_started_at, rl.attempt_count
    into v_window_started_at, v_attempt_count
    from private.social_connection_mutation_rate_limits as rl
    where rl.organization_id = p_organization_id
      and rl.actor_user_id = p_actor_user_id
      and rl.action = p_action
      and rl.scope_key = v_scope
    for update;

    if not found then
      continue;
    end if;

    if v_now >= v_window_started_at + make_interval(secs => p_window_seconds) then
      update private.social_connection_mutation_rate_limits as rl
      set
        window_started_at = v_now,
        attempt_count = 1,
        updated_at = v_now
      where rl.organization_id = p_organization_id
        and rl.actor_user_id = p_actor_user_id
        and rl.action = p_action
        and rl.scope_key = v_scope;
      return true;
    end if;

    if v_attempt_count >= p_max_attempts then
      raise log
        'zyntix.social_connection_mutation_rate_limited action=% organization_id=% actor_user_id=% scope_key=%',
        p_action,
        p_organization_id,
        p_actor_user_id,
        v_scope;
      return false;
    end if;

    update private.social_connection_mutation_rate_limits as rl
    set
      attempt_count = rl.attempt_count + 1,
      updated_at = v_now
    where rl.organization_id = p_organization_id
      and rl.actor_user_id = p_actor_user_id
      and rl.action = p_action
      and rl.scope_key = v_scope;

    return true;
  end loop;
end;
$$;

comment on function private.consume_social_connection_mutation_rate_limit(uuid, uuid, text, text, integer, integer) is
  'Atomic Social Connection mutation rate-limit consume. Invalid input and limiter failures return false (fail closed).';

revoke all on function private.consume_social_connection_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from public;
revoke all on function private.consume_social_connection_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from anon;
revoke all on function private.consume_social_connection_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from authenticated;
revoke all on function private.consume_social_connection_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from service_role;

-- ---------------------------------------------------------------------------
-- Private authorization / event helpers
-- ---------------------------------------------------------------------------

create or replace function private.get_social_connection_actor_membership(
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

revoke all on function private.get_social_connection_actor_membership(uuid) from public;
revoke all on function private.get_social_connection_actor_membership(uuid) from anon;
revoke all on function private.get_social_connection_actor_membership(uuid) from authenticated;
revoke all on function private.get_social_connection_actor_membership(uuid) from service_role;

create or replace function private.assert_active_organization_for_social_connection_mutation(
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

revoke all on function private.assert_active_organization_for_social_connection_mutation(uuid) from public;
revoke all on function private.assert_active_organization_for_social_connection_mutation(uuid) from anon;
revoke all on function private.assert_active_organization_for_social_connection_mutation(uuid) from authenticated;
revoke all on function private.assert_active_organization_for_social_connection_mutation(uuid) from service_role;

create or replace function private.can_manage_social_connections(p_actor_role text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_actor_role in ('owner', 'admin');
$$;

revoke all on function private.can_manage_social_connections(text) from public;
revoke all on function private.can_manage_social_connections(text) from anon;
revoke all on function private.can_manage_social_connections(text) from authenticated;
revoke all on function private.can_manage_social_connections(text) from service_role;

create or replace function private.insert_social_connection_event(
  p_organization_id uuid,
  p_connection_id uuid,
  p_event_type text,
  p_actor_source text,
  p_actor_member_id uuid,
  p_payload jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_event_type not in (
    'social_connection_initiated',
    'social_connection_established',
    'social_connection_reauthorization_required',
    'social_connection_reauthorized',
    'social_connection_permission_missing',
    'social_connection_revoked',
    'social_connection_disconnected',
    'social_connection_health_changed'
  ) then
    raise exception 'invalid social connection event type'
      using errcode = 'P0001';
  end if;

  if p_actor_source not in ('member', 'system') then
    raise exception 'invalid social connection event actor source'
      using errcode = 'P0001';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    raise exception 'invalid social connection event payload'
      using errcode = 'P0001';
  end if;

  if p_payload ? 'token'
     or p_payload ? 'accessToken'
     or p_payload ? 'access_token'
     or p_payload ? 'refreshToken'
     or p_payload ? 'refresh_token'
     or p_payload ? 'authorizationCode'
     or p_payload ? 'clientSecret'
     or p_payload ? 'ciphertext'
     or p_payload ? 'iv'
     or p_payload ? 'authTag'
     or p_payload ? 'auth_tag'
     or p_payload ? 'rawOAuthState'
     or p_payload ? 'state_secret'
  then
    raise exception 'social connection event payload must not contain secrets'
      using errcode = 'P0001';
  end if;

  insert into public.social_connection_events (
    organization_id,
    connection_id,
    event_type,
    actor_source,
    actor_member_id,
    payload
  )
  values (
    p_organization_id,
    p_connection_id,
    p_event_type,
    p_actor_source,
    p_actor_member_id,
    coalesce(p_payload, '{}'::jsonb)
  );
end;
$$;

revoke all on function private.insert_social_connection_event(uuid, uuid, text, text, uuid, jsonb) from public;
revoke all on function private.insert_social_connection_event(uuid, uuid, text, text, uuid, jsonb) from anon;
revoke all on function private.insert_social_connection_event(uuid, uuid, text, text, uuid, jsonb) from authenticated;
revoke all on function private.insert_social_connection_event(uuid, uuid, text, text, uuid, jsonb) from service_role;

create or replace function private.try_consume_social_connection_rate_limit(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_action text,
  p_scope_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.consume_social_connection_mutation_rate_limit(
    p_organization_id,
    p_actor_user_id,
    p_action,
    p_scope_key,
    p_max_attempts,
    p_window_seconds
  );
exception
  when others then
    return false;
end;
$$;

comment on function private.try_consume_social_connection_rate_limit(uuid, uuid, text, text, integer, integer) is
  'Fail-closed wrapper: limiter exceptions deny the mutation.';

revoke all on function private.try_consume_social_connection_rate_limit(uuid, uuid, text, text, integer, integer) from public;
revoke all on function private.try_consume_social_connection_rate_limit(uuid, uuid, text, text, integer, integer) from anon;
revoke all on function private.try_consume_social_connection_rate_limit(uuid, uuid, text, text, integer, integer) from authenticated;
revoke all on function private.try_consume_social_connection_rate_limit(uuid, uuid, text, text, integer, integer) from service_role;

-- ---------------------------------------------------------------------------
-- Public RPCs
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

revoke all on function public.create_social_connection_intent(uuid, uuid, text, text, text, timestamptz) from public;
revoke all on function public.create_social_connection_intent(uuid, uuid, text, text, text, timestamptz) from anon;
revoke all on function public.create_social_connection_intent(uuid, uuid, text, text, text, timestamptz) from authenticated;
revoke all on function public.create_social_connection_intent(uuid, uuid, text, text, text, timestamptz) from service_role;
grant execute on function public.create_social_connection_intent(uuid, uuid, text, text, text, timestamptz) to authenticated;

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

revoke all on function public.create_social_reauthorization_intent(uuid, text, text, timestamptz) from public;
revoke all on function public.create_social_reauthorization_intent(uuid, text, text, timestamptz) from anon;
revoke all on function public.create_social_reauthorization_intent(uuid, text, text, timestamptz) from authenticated;
revoke all on function public.create_social_reauthorization_intent(uuid, text, text, timestamptz) from service_role;
grant execute on function public.create_social_reauthorization_intent(uuid, text, text, timestamptz) to authenticated;

create or replace function public.consume_social_oauth_intent(
  p_intent_id uuid,
  p_state_fingerprint text
)
returns table (
  result_code text,
  connection_id uuid,
  organization_id uuid,
  workspace_id uuid,
  provider text,
  return_path_id text,
  intent_kind text,
  expected_external_account_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_intent private.social_oauth_authorization_intents;
  v_consumed private.social_oauth_authorization_intents;
  v_now timestamptz := pg_catalog.now();
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_intent_id is null
     or p_state_fingerprint is null
     or p_state_fingerprint !~ '^[0-9a-f]{64}$'
  then
    return query
      select
        'invalid_state'::text,
        null::uuid,
        null::uuid,
        null::uuid,
        null::text,
        null::text,
        null::text,
        null::text;
    return;
  end if;

  select i.*
  into v_intent
  from private.social_oauth_authorization_intents as i
  where i.id = p_intent_id
  for update;

  if not found then
    return query
      select
        'invalid_state'::text,
        null::uuid, null::uuid, null::uuid, null::text, null::text, null::text, null::text;
    return;
  end if;

  if v_intent.initiating_actor_user_id <> v_actor_user_id then
    return query
      select
        'wrong_actor'::text,
        null::uuid, null::uuid, null::uuid, null::text, null::text, null::text, null::text;
    return;
  end if;

  if v_intent.state_fingerprint <> p_state_fingerprint then
    return query
      select
        'invalid_state'::text,
        null::uuid, null::uuid, null::uuid, null::text, null::text, null::text, null::text;
    return;
  end if;

  if v_intent.status = 'consumed' or v_intent.consumed_at is not null then
    return query
      select
        'replayed_state'::text,
        v_intent.connection_id,
        v_intent.organization_id,
        v_intent.workspace_id,
        v_intent.provider,
        v_intent.return_path_id,
        v_intent.intent_kind,
        v_intent.expected_external_account_id;
    return;
  end if;

  if v_intent.status <> 'pending' or v_intent.expires_at <= v_now then
    if v_intent.status = 'pending' and v_intent.expires_at <= v_now then
      update private.social_oauth_authorization_intents as i
      set status = 'expired'
      where i.id = v_intent.id
        and i.status = 'pending'
        and i.consumed_at is null;
    end if;
    return query
      select
        'expired_state'::text,
        v_intent.connection_id,
        v_intent.organization_id,
        v_intent.workspace_id,
        v_intent.provider,
        v_intent.return_path_id,
        v_intent.intent_kind,
        v_intent.expected_external_account_id;
    return;
  end if;

  if not private.try_consume_social_connection_rate_limit(
    v_intent.organization_id,
    v_intent.initiating_actor_user_id,
    'oauth_callback',
    v_intent.provider,
    20,
    3600
  ) then
    return query
      select
        'rate_limited'::text,
        null::uuid, null::uuid, null::uuid, null::text, null::text, null::text, null::text;
    return;
  end if;

  update private.social_oauth_authorization_intents as i
  set
    status = 'consumed',
    consumed_at = v_now
  where i.id = v_intent.id
    and i.status = 'pending'
    and i.consumed_at is null
    and i.expires_at > v_now
    and i.state_fingerprint = p_state_fingerprint
    and i.initiating_actor_user_id = v_actor_user_id
  returning i.* into v_consumed;

  if not found then
    return query
      select
        'replayed_state'::text,
        v_intent.connection_id,
        v_intent.organization_id,
        v_intent.workspace_id,
        v_intent.provider,
        v_intent.return_path_id,
        v_intent.intent_kind,
        v_intent.expected_external_account_id;
    return;
  end if;

  return query
    select
      'success'::text,
      v_consumed.connection_id,
      v_consumed.organization_id,
      v_consumed.workspace_id,
      v_consumed.provider,
      v_consumed.return_path_id,
      v_consumed.intent_kind,
      v_consumed.expected_external_account_id;
end;
$$;

revoke all on function public.consume_social_oauth_intent(uuid, text) from public;
revoke all on function public.consume_social_oauth_intent(uuid, text) from anon;
revoke all on function public.consume_social_oauth_intent(uuid, text) from authenticated;
revoke all on function public.consume_social_oauth_intent(uuid, text) from service_role;
grant execute on function public.consume_social_oauth_intent(uuid, text) to authenticated;

create or replace function public.finalize_social_connection(
  p_connection_id uuid,
  p_external_account_id text,
  p_display_name text,
  p_professional_account_type text,
  p_capabilities jsonb
)
returns table (
  result_code text,
  connection_id uuid
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
  v_now timestamptz := pg_catalog.now();
  v_capabilities jsonb := coalesce(p_capabilities, '[]'::jsonb);
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_connection_id is null
     or p_external_account_id is null
     or char_length(btrim(p_external_account_id)) = 0
     or char_length(p_external_account_id) > 128
     or p_external_account_id <> btrim(p_external_account_id)
     or position(' ' in p_external_account_id) > 0
     or not private.social_beta1_capabilities_are_valid(v_capabilities)
  then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  if p_professional_account_type is null
     or p_professional_account_type not in ('business', 'creator')
  then
    return query select 'unsupported_account'::text, null::uuid;
    return;
  end if;

  select sac.*
  into v_connection
  from public.social_account_connections as sac
  where sac.id = p_connection_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(v_connection.organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(
      v_connection.organization_id
    );
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid;
    return;
  end if;

  if v_connection.status not in ('authorization_pending', 'reauthorization_required') then
    return query select 'conflict'::text, v_connection.id;
    return;
  end if;

  if v_connection.status = 'reauthorization_required'
     and v_connection.external_account_id is not null
     and v_connection.external_account_id <> p_external_account_id
  then
    return query select 'identity_mismatch'::text, v_connection.id;
    return;
  end if;

  if exists (
    select 1
    from public.social_account_connections as other
    where other.organization_id = v_connection.organization_id
      and other.provider = v_connection.provider
      and other.external_account_id = p_external_account_id
      and other.status <> 'disconnected'
      and other.id <> v_connection.id
  ) then
    return query select 'duplicate_connection'::text, v_connection.id;
    return;
  end if;

  update public.social_account_connections as sac
  set
    external_account_id = p_external_account_id,
    display_name = nullif(btrim(coalesce(p_display_name, '')), ''),
    professional_account_type = p_professional_account_type,
    status = 'connected',
    health = 'healthy',
    capability_snapshot = v_capabilities,
    capability_snapshot_at = v_now,
    connected_at = coalesce(sac.connected_at, v_now),
    reauthorization_required_at = null
  where sac.id = v_connection.id
    and sac.organization_id = v_connection.organization_id;

  perform private.insert_social_connection_event(
    v_connection.organization_id,
    v_connection.id,
    case
      when v_connection.status = 'reauthorization_required'
        then 'social_connection_reauthorized'
      else 'social_connection_established'
    end,
    'member',
    v_membership_id,
    jsonb_build_object('provider', v_connection.provider)
  );

  return query select 'success'::text, v_connection.id;
end;
$$;

revoke all on function public.finalize_social_connection(uuid, text, text, text, jsonb) from public;
revoke all on function public.finalize_social_connection(uuid, text, text, text, jsonb) from anon;
revoke all on function public.finalize_social_connection(uuid, text, text, text, jsonb) from authenticated;
revoke all on function public.finalize_social_connection(uuid, text, text, text, jsonb) from service_role;
grant execute on function public.finalize_social_connection(uuid, text, text, text, jsonb) to authenticated;

create or replace function public.upsert_social_provider_credential(
  p_connection_id uuid,
  p_credential_id uuid,
  p_expected_credential_version integer,
  p_encryption_version integer,
  p_key_purpose text,
  p_key_version integer,
  p_ciphertext text,
  p_iv text,
  p_auth_tag text,
  p_token_expires_at timestamptz
)
returns table (
  result_code text,
  credential_id uuid,
  credential_version integer
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
  v_existing private.social_provider_credentials;
  v_credential_id uuid;
  v_credential_version integer;
  v_now timestamptz := pg_catalog.now();
  v_iv_bytes bytea;
  v_tag_bytes bytea;
  v_ct_bytes bytea;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_connection_id is null
     or p_credential_id is null
     or p_expected_credential_version is null
     or p_expected_credential_version < 0
     or p_encryption_version is distinct from 1
     or p_key_purpose is distinct from 'zyntixai.smm.credential.aes-v1'
     or p_key_version is null
     or p_key_version < 1
     or p_ciphertext is null
     or p_iv is null
     or p_auth_tag is null
  then
    return query select 'invalid_input'::text, null::uuid, null::integer;
    return;
  end if;

  begin
    v_iv_bytes := decode(p_iv, 'base64');
    v_tag_bytes := decode(p_auth_tag, 'base64');
    v_ct_bytes := decode(p_ciphertext, 'base64');
  exception
    when others then
      return query select 'invalid_input'::text, null::uuid, null::integer;
      return;
  end;

  if octet_length(v_iv_bytes) <> 12
     or octet_length(v_tag_bytes) <> 16
     or octet_length(v_ct_bytes) < 1
  then
    return query select 'invalid_input'::text, null::uuid, null::integer;
    return;
  end if;

  select sac.*
  into v_connection
  from public.social_account_connections as sac
  where sac.id = p_connection_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid, null::integer;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(v_connection.organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'not_found'::text, null::uuid, null::integer;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(
      v_connection.organization_id
    );
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid, null::integer;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid, null::integer;
    return;
  end if;

  if v_connection.status = 'disconnected' then
    return query select 'conflict'::text, null::uuid, null::integer;
    return;
  end if;

  select cred.*
  into v_existing
  from private.social_provider_credentials as cred
  where cred.connection_id = v_connection.id
    and cred.organization_id = v_connection.organization_id
  for update;

  if p_expected_credential_version = 0 then
    if found then
      return query
        select 'stale_version'::text, v_existing.id, v_existing.credential_version;
      return;
    end if;

    insert into private.social_provider_credentials (
      id,
      organization_id,
      connection_id,
      provider,
      encryption_version,
      key_purpose,
      key_version,
      ciphertext,
      iv,
      auth_tag,
      credential_version
    )
    values (
      p_credential_id,
      v_connection.organization_id,
      v_connection.id,
      v_connection.provider,
      1,
      'zyntixai.smm.credential.aes-v1',
      p_key_version,
      p_ciphertext,
      p_iv,
      p_auth_tag,
      1
    )
    returning social_provider_credentials.id, social_provider_credentials.credential_version
      into v_credential_id, v_credential_version;
  else
    if not found
       or v_existing.credential_version <> p_expected_credential_version
       or v_existing.id <> p_credential_id
    then
      return query
        select
          'stale_version'::text,
          v_existing.id,
          v_existing.credential_version;
      return;
    end if;

    if not private.try_consume_social_connection_rate_limit(
      v_connection.organization_id,
      '00000000-0000-4000-8000-000000000001'::uuid,
      'credential_refresh',
      v_connection.id::text,
      6,
      3600
    ) then
      return query select 'rate_limited'::text, null::uuid, null::integer;
      return;
    end if;

    update private.social_provider_credentials as cred
    set
      encryption_version = 1,
      key_purpose = 'zyntixai.smm.credential.aes-v1',
      key_version = p_key_version,
      ciphertext = p_ciphertext,
      iv = p_iv,
      auth_tag = p_auth_tag,
      credential_version = cred.credential_version + 1
    where cred.id = v_existing.id
      and cred.organization_id = v_connection.organization_id
      and cred.connection_id = v_connection.id
      and cred.credential_version = p_expected_credential_version
    returning cred.id, cred.credential_version
      into v_credential_id, v_credential_version;

    if not found then
      return query
        select 'stale_version'::text, v_existing.id, v_existing.credential_version;
      return;
    end if;
  end if;

  update public.social_account_connections as sac
  set
    credential_ref_id = v_credential_id,
    token_expires_at = p_token_expires_at,
    last_refreshed_at = v_now
  where sac.id = v_connection.id
    and sac.organization_id = v_connection.organization_id;

  return query select 'success'::text, v_credential_id, v_credential_version;
end;
$$;

revoke all on function public.upsert_social_provider_credential(uuid, uuid, integer, integer, text, integer, text, text, text, timestamptz) from public;
revoke all on function public.upsert_social_provider_credential(uuid, uuid, integer, integer, text, integer, text, text, text, timestamptz) from anon;
revoke all on function public.upsert_social_provider_credential(uuid, uuid, integer, integer, text, integer, text, text, text, timestamptz) from authenticated;
revoke all on function public.upsert_social_provider_credential(uuid, uuid, integer, integer, text, integer, text, text, text, timestamptz) from service_role;
grant execute on function public.upsert_social_provider_credential(uuid, uuid, integer, integer, text, integer, text, text, text, timestamptz) to authenticated;

create or replace function public.load_social_provider_credential_envelope(
  p_connection_id uuid
)
returns table (
  result_code text,
  credential_id uuid,
  organization_id uuid,
  connection_id uuid,
  provider text,
  encryption_version integer,
  key_purpose text,
  key_version integer,
  ciphertext text,
  iv text,
  auth_tag text,
  credential_version integer
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
  v_existing private.social_provider_credentials;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_connection_id is null then
    return query
      select
        'invalid_input'::text,
        null::uuid, null::uuid, null::uuid, null::text,
        null::integer, null::text, null::integer,
        null::text, null::text, null::text, null::integer;
    return;
  end if;

  select sac.*
  into v_connection
  from public.social_account_connections as sac
  where sac.id = p_connection_id;

  if not found then
    return query
      select
        'not_found'::text,
        null::uuid, null::uuid, null::uuid, null::text,
        null::integer, null::text, null::integer,
        null::text, null::text, null::text, null::integer;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(v_connection.organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query
      select
        'not_found'::text,
        null::uuid, null::uuid, null::uuid, null::text,
        null::integer, null::text, null::integer,
        null::text, null::text, null::text, null::integer;
    return;
  end if;

  if not private.can_manage_social_connections(v_member_role) then
    return query
      select
        'forbidden'::text,
        null::uuid, null::uuid, null::uuid, null::text,
        null::integer, null::text, null::integer,
        null::text, null::text, null::text, null::integer;
    return;
  end if;

  select cred.*
  into v_existing
  from private.social_provider_credentials as cred
  where cred.connection_id = v_connection.id
    and cred.organization_id = v_connection.organization_id;

  if not found then
    return query
      select
        'not_found'::text,
        null::uuid, null::uuid, null::uuid, null::text,
        null::integer, null::text, null::integer,
        null::text, null::text, null::text, null::integer;
    return;
  end if;

  return query
    select
      'success'::text,
      v_existing.id,
      v_existing.organization_id,
      v_existing.connection_id,
      v_existing.provider,
      v_existing.encryption_version,
      v_existing.key_purpose,
      v_existing.key_version,
      v_existing.ciphertext,
      v_existing.iv,
      v_existing.auth_tag,
      v_existing.credential_version;
end;
$$;

comment on function public.load_social_provider_credential_envelope(uuid) is
  'Owner/Admin session retrieval of opaque AES-GCM envelope for server-side decrypt. Never returns plaintext. Must not be mapped to UI/read models.';

revoke all on function public.load_social_provider_credential_envelope(uuid) from public;
revoke all on function public.load_social_provider_credential_envelope(uuid) from anon;
revoke all on function public.load_social_provider_credential_envelope(uuid) from authenticated;
revoke all on function public.load_social_provider_credential_envelope(uuid) from service_role;
grant execute on function public.load_social_provider_credential_envelope(uuid) to authenticated;

create or replace function public.disconnect_social_connection(
  p_connection_id uuid
)
returns table (
  result_code text,
  connection_id uuid
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
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_connection_id is null then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  select sac.*
  into v_connection
  from public.social_account_connections as sac
  where sac.id = p_connection_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(v_connection.organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(
      v_connection.organization_id
    );
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid;
    return;
  end if;

  if v_connection.status = 'disconnected' then
    return query select 'already_disconnected'::text, v_connection.id;
    return;
  end if;

  if not private.try_consume_social_connection_rate_limit(
    v_connection.organization_id,
    v_actor_user_id,
    'disconnect',
    '',
    10,
    3600
  ) then
    return query select 'rate_limited'::text, null::uuid;
    return;
  end if;

  delete from private.social_provider_credentials as cred
  where cred.organization_id = v_connection.organization_id
    and cred.connection_id = v_connection.id;

  update public.social_account_connections as sac
  set
    status = 'disconnected',
    credential_ref_id = null,
    last_refreshed_at = null
  where sac.id = v_connection.id
    and sac.organization_id = v_connection.organization_id;

  perform private.insert_social_connection_event(
    v_connection.organization_id,
    v_connection.id,
    'social_connection_disconnected',
    'member',
    v_membership_id,
    jsonb_build_object('provider', v_connection.provider)
  );

  return query select 'disconnected'::text, v_connection.id;
end;
$$;

revoke all on function public.disconnect_social_connection(uuid) from public;
revoke all on function public.disconnect_social_connection(uuid) from anon;
revoke all on function public.disconnect_social_connection(uuid) from authenticated;
revoke all on function public.disconnect_social_connection(uuid) from service_role;
grant execute on function public.disconnect_social_connection(uuid) to authenticated;

create or replace function public.mark_social_connection_reauthorization_required(
  p_connection_id uuid
)
returns table (
  result_code text,
  connection_id uuid
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
  v_now timestamptz := pg_catalog.now();
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_connection_id is null then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  select sac.*
  into v_connection
  from public.social_account_connections as sac
  where sac.id = p_connection_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(v_connection.organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text, null::uuid;
    return;
  end if;

  if v_connection.status in ('disconnected', 'revoked') then
    return query select 'conflict'::text, v_connection.id;
    return;
  end if;

  update public.social_account_connections as sac
  set
    status = 'reauthorization_required',
    reauthorization_required_at = v_now
  where sac.id = v_connection.id
    and sac.organization_id = v_connection.organization_id;

  perform private.insert_social_connection_event(
    v_connection.organization_id,
    v_connection.id,
    'social_connection_reauthorization_required',
    'member',
    v_membership_id,
    jsonb_build_object('provider', v_connection.provider)
  );

  return query select 'success'::text, v_connection.id;
end;
$$;

revoke all on function public.mark_social_connection_reauthorization_required(uuid) from public;
revoke all on function public.mark_social_connection_reauthorization_required(uuid) from anon;
revoke all on function public.mark_social_connection_reauthorization_required(uuid) from authenticated;
revoke all on function public.mark_social_connection_reauthorization_required(uuid) from service_role;
grant execute on function public.mark_social_connection_reauthorization_required(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Operational RLS (SELECT only). Mutations remain RPC-only.
-- ---------------------------------------------------------------------------

grant select on table public.social_account_connections to authenticated;
grant select on table public.social_connection_events to authenticated;

create policy social_account_connections_select_member
  on public.social_account_connections
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy social_connection_events_select_owner_admin
  on public.social_connection_events
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

revoke insert, update, delete on table public.social_account_connections from authenticated;
revoke insert, update, delete on table public.social_account_connections from anon;
revoke insert, update, delete on table public.social_connection_events from authenticated;
revoke insert, update, delete on table public.social_connection_events from anon;


