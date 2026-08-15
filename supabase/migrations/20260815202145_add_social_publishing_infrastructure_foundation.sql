-- SMM-B1.6 — Publishing Infrastructure + Publication / Attempt / Event Model
-- Provider-neutral orchestration only. No live provider HTTP. No Instagram publish.
-- Human intent RPCs: authenticated Owner/Admin/Staff.
-- System execution RPCs: private schema (not granted to authenticated/anon).
-- Feature gate SOCIAL_PUBLISHING_ENABLED fails closed (execution blocked when unset).

-- ---------------------------------------------------------------------------
-- social_publications
-- ---------------------------------------------------------------------------

create table public.social_publications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  content_id uuid not null,
  variant_id uuid not null,
  variant_version_id uuid not null,
  connection_id uuid not null,
  provider text not null,
  schedule_slot_id uuid,
  execution_mode text not null,
  status text not null default 'pending',
  idempotency_key text not null,
  intended_execute_at timestamptz not null,
  queued_at timestamptz,
  claimed_at timestamptz,
  claim_lease_expires_at timestamptz,
  claimed_by text,
  claim_generation integer not null default 0,
  first_started_at timestamptz,
  completed_at timestamptz,
  next_attempt_at timestamptz,
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  last_failure_class text,
  external_publication_id text,
  created_by_member_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  cancelled_at timestamptz,
  constraint social_publications_org_id_unique unique (organization_id, id),
  constraint social_publications_provider_chk
    check (provider = 'instagram'),
  constraint social_publications_execution_mode_chk
    check (execution_mode in ('scheduled', 'immediate')),
  constraint social_publications_status_chk
    check (
      status in (
        'pending',
        'queued',
        'claimed',
        'processing',
        'succeeded',
        'cancelled',
        'failed_retryable',
        'failed_terminal',
        'manual_intervention',
        'unknown_external_outcome'
      )
    ),
  constraint social_publications_idempotency_key_chk
    check (
      char_length(btrim(idempotency_key)) >= 8
      and char_length(idempotency_key) <= 128
    ),
  constraint social_publications_attempt_count_chk
    check (attempt_count >= 0 and attempt_count <= max_attempts),
  constraint social_publications_max_attempts_chk
    check (max_attempts >= 1 and max_attempts <= 20),
  constraint social_publications_claim_generation_chk
    check (claim_generation >= 0),
  constraint social_publications_external_id_chk
    check (
      external_publication_id is null
      or (
        char_length(btrim(external_publication_id)) > 0
        and char_length(external_publication_id) <= 256
      )
    ),
  constraint social_publications_claimed_by_chk
    check (claimed_by is null or char_length(claimed_by) <= 128),
  constraint social_publications_last_failure_class_chk
    check (
      last_failure_class is null
      or last_failure_class in (
        'authorization',
        'credential',
        'capability',
        'validation',
        'media',
        'rate_limit',
        'provider_temporary',
        'provider_permanent',
        'network',
        'timeout',
        'conflict',
        'internal',
        'adapter_unavailable',
        'feature_disabled',
        'unknown_external_outcome',
        'workflow_not_ready',
        'connection_ineligible'
      )
    ),
  constraint social_publications_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_publications_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id) on delete restrict,
  constraint social_publications_content_fk
    foreign key (organization_id, content_id)
    references public.social_content_items (organization_id, id) on delete restrict,
  constraint social_publications_variant_fk
    foreign key (organization_id, variant_id)
    references public.social_content_variants (organization_id, id) on delete restrict,
  constraint social_publications_version_fk
    foreign key (organization_id, variant_version_id)
    references public.social_content_variant_versions (organization_id, id) on delete restrict,
  constraint social_publications_connection_fk
    foreign key (organization_id, connection_id)
    references public.social_account_connections (organization_id, id) on delete restrict,
  constraint social_publications_schedule_slot_fk
    foreign key (organization_id, schedule_slot_id)
    references public.social_content_schedule_slots (organization_id, id) on delete restrict,
  constraint social_publications_created_by_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

comment on table public.social_publications is
  'Provider-neutral Publication: operational intent to execute an exact Variant Version against an exact Connection. Not live provider publishing.';

comment on column public.social_publications.external_publication_id is
  'Provider external ID reserved for B1.7+. Browser cannot set. Null in B1.6 production.';

comment on column public.social_publications.idempotency_key is
  'Server-scoped operation identity. Distinct from variant_version_id so intentional republish is allowed.';

create unique index social_publications_org_idempotency_uidx
  on public.social_publications (organization_id, idempotency_key);

create unique index social_publications_one_active_schedule_uidx
  on public.social_publications (organization_id, schedule_slot_id)
  where schedule_slot_id is not null and status not in ('cancelled');

create index social_publications_org_workspace_status_idx
  on public.social_publications (organization_id, workspace_id, status);

create index social_publications_claim_due_idx
  on public.social_publications (organization_id, status, next_attempt_at, intended_execute_at)
  where status in ('pending', 'queued', 'failed_retryable');

create trigger social_publications_set_updated_at
  before update on public.social_publications
  for each row execute function public.set_updated_at();

alter table public.social_publications enable row level security;
revoke all on table public.social_publications from public;
revoke all on table public.social_publications from anon;
revoke all on table public.social_publications from authenticated;
revoke all on table public.social_publications from service_role;
grant select on table public.social_publications to authenticated;
create policy social_publications_select_member
  on public.social_publications for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_publications from authenticated;
revoke insert, update, delete on table public.social_publications from anon;

-- ---------------------------------------------------------------------------
-- social_publication_attempts
-- ---------------------------------------------------------------------------

create table public.social_publication_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  publication_id uuid not null,
  attempt_number integer not null,
  outcome text not null default 'processing',
  failure_class text,
  retryable boolean,
  safe_error_code text,
  operation_id text not null,
  worker_id text,
  claim_generation integer not null,
  started_at timestamptz not null default pg_catalog.now(),
  finished_at timestamptz,
  constraint social_publication_attempts_org_id_unique unique (organization_id, id),
  constraint social_publication_attempts_pub_number_unique unique (organization_id, publication_id, attempt_number),
  constraint social_publication_attempts_number_chk check (attempt_number >= 1),
  constraint social_publication_attempts_outcome_chk
    check (
      outcome in (
        'processing',
        'succeeded',
        'failed_retryable',
        'failed_terminal',
        'cancelled',
        'unknown_external_outcome'
      )
    ),
  constraint social_publication_attempts_failure_class_chk
    check (
      failure_class is null
      or failure_class in (
        'authorization',
        'credential',
        'capability',
        'validation',
        'media',
        'rate_limit',
        'provider_temporary',
        'provider_permanent',
        'network',
        'timeout',
        'conflict',
        'internal',
        'adapter_unavailable',
        'feature_disabled',
        'unknown_external_outcome',
        'workflow_not_ready',
        'connection_ineligible'
      )
    ),
  constraint social_publication_attempts_safe_error_chk
    check (safe_error_code is null or char_length(safe_error_code) <= 128),
  constraint social_publication_attempts_operation_id_chk
    check (char_length(btrim(operation_id)) > 0 and char_length(operation_id) <= 128),
  constraint social_publication_attempts_worker_id_chk
    check (worker_id is null or char_length(worker_id) <= 128),
  constraint social_publication_attempts_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_publication_attempts_publication_fk
    foreign key (organization_id, publication_id)
    references public.social_publications (organization_id, id) on delete restrict
);

comment on table public.social_publication_attempts is
  'One execution attempt for a Publication. No tokens, no raw provider payloads.';

create index social_publication_attempts_org_pub_idx
  on public.social_publication_attempts (organization_id, publication_id, attempt_number desc);

alter table public.social_publication_attempts enable row level security;
revoke all on table public.social_publication_attempts from public;
revoke all on table public.social_publication_attempts from anon;
revoke all on table public.social_publication_attempts from authenticated;
revoke all on table public.social_publication_attempts from service_role;
grant select on table public.social_publication_attempts to authenticated;
create policy social_publication_attempts_select_member
  on public.social_publication_attempts for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_publication_attempts from authenticated;
revoke insert, update, delete on table public.social_publication_attempts from anon;

create or replace function private.guard_social_publication_attempt_terminal_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'social publication attempts cannot be deleted' using errcode = 'P0001';
  end if;
  if old.outcome is distinct from 'processing' then
    raise exception 'completed social publication attempts are immutable' using errcode = 'P0001';
  end if;
  if new.organization_id is distinct from old.organization_id
     or new.publication_id is distinct from old.publication_id
     or new.attempt_number is distinct from old.attempt_number
     or new.operation_id is distinct from old.operation_id
  then
    raise exception 'social publication attempt identity is immutable' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_social_publication_attempt_terminal_immutable() from public;
revoke all on function private.guard_social_publication_attempt_terminal_immutable() from anon;
revoke all on function private.guard_social_publication_attempt_terminal_immutable() from authenticated;
revoke all on function private.guard_social_publication_attempt_terminal_immutable() from service_role;

create trigger social_publication_attempts_guard_immutable
  before update or delete on public.social_publication_attempts
  for each row execute function private.guard_social_publication_attempt_terminal_immutable();

-- ---------------------------------------------------------------------------
-- social_publication_events
-- ---------------------------------------------------------------------------

create table public.social_publication_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  publication_id uuid not null,
  attempt_id uuid,
  event_type text not null,
  actor_source text not null,
  actor_member_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_publication_events_org_id_unique unique (organization_id, id),
  constraint social_publication_events_event_type_chk
    check (
      event_type in (
        'social_publication_created',
        'social_publication_queued',
        'social_publication_claimed',
        'social_publication_attempt_started',
        'social_publication_attempt_failed',
        'social_publication_attempt_succeeded',
        'social_publication_cancelled',
        'social_publication_manual_intervention',
        'social_publication_unknown_external_outcome',
        'social_publication_retry_requested'
      )
    ),
  constraint social_publication_events_actor_source_chk
    check (actor_source in ('member', 'system')),
  constraint social_publication_events_payload_object_chk
    check (jsonb_typeof(payload) = 'object'),
  constraint social_publication_events_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_publication_events_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id) on delete cascade,
  constraint social_publication_events_publication_fk
    foreign key (organization_id, publication_id)
    references public.social_publications (organization_id, id) on delete cascade,
  constraint social_publication_events_attempt_fk
    foreign key (organization_id, attempt_id)
    references public.social_publication_attempts (organization_id, id) on delete cascade,
  constraint social_publication_events_actor_member_fk
    foreign key (organization_id, actor_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

create or replace function private.guard_social_publication_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social publication events are immutable' using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_publication_event_immutable() from public;
revoke all on function private.guard_social_publication_event_immutable() from anon;
revoke all on function private.guard_social_publication_event_immutable() from authenticated;
revoke all on function private.guard_social_publication_event_immutable() from service_role;

create trigger social_publication_events_guard_immutable
  before update or delete on public.social_publication_events
  for each row execute function private.guard_social_publication_event_immutable();

create index social_publication_events_org_pub_created_idx
  on public.social_publication_events (organization_id, publication_id, created_at desc);

alter table public.social_publication_events enable row level security;
revoke all on table public.social_publication_events from public;
revoke all on table public.social_publication_events from anon;
revoke all on table public.social_publication_events from authenticated;
revoke all on table public.social_publication_events from service_role;
grant select on table public.social_publication_events to authenticated;
create policy social_publication_events_select_owner_admin
  on public.social_publication_events for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));
revoke insert, update, delete on table public.social_publication_events from authenticated;
revoke insert, update, delete on table public.social_publication_events from anon;
-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.social_publishing_execution_enabled()
returns boolean
language sql
stable
set search_path = ''
as $$
  -- Fail-closed: only explicit 'true' enables execution. Creation of intent is separate.
  select coalesce(current_setting('zyntix.social_publishing_enabled', true), '') = 'true';
$$;

revoke all on function private.social_publishing_execution_enabled() from public;
revoke all on function private.social_publishing_execution_enabled() from anon;
revoke all on function private.social_publishing_execution_enabled() from authenticated;
revoke all on function private.social_publishing_execution_enabled() from service_role;

create or replace function private.assert_social_publication_worker()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('zyntix.social_publication_worker', true), '') is distinct from 'on' then
    raise exception 'social publication worker context required' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.assert_social_publication_worker() from public;
revoke all on function private.assert_social_publication_worker() from anon;
revoke all on function private.assert_social_publication_worker() from authenticated;
revoke all on function private.assert_social_publication_worker() from service_role;

create or replace function private.insert_social_publication_event(
  p_organization_id uuid,
  p_brand_id uuid,
  p_workspace_id uuid,
  p_publication_id uuid,
  p_attempt_id uuid,
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
    raise exception 'invalid social publication event payload' using errcode = 'P0001';
  end if;
  if v_payload ?| array[
    'access_token','refresh_token','token','ciphertext','iv','auth_tag',
    'authorization_code','client_secret','raw_state','state','encryption_key'
  ] then
    raise exception 'social publication event payload contains forbidden secret keys' using errcode = 'P0001';
  end if;

  insert into public.social_publication_events (
    organization_id, brand_id, workspace_id, publication_id, attempt_id,
    event_type, actor_source, actor_member_id, payload
  ) values (
    p_organization_id, p_brand_id, p_workspace_id, p_publication_id, p_attempt_id,
    p_event_type, p_actor_source, p_actor_member_id, v_payload
  ) returning id into v_event_id;
  return v_event_id;
end;
$$;

revoke all on function private.insert_social_publication_event(uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from public;
revoke all on function private.insert_social_publication_event(uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from anon;
revoke all on function private.insert_social_publication_event(uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from authenticated;
revoke all on function private.insert_social_publication_event(uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from service_role;

create or replace function private.capability_required_for_social_content_format(p_format text)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_format
    when 'image' then 'publish_image'
    when 'carousel' then 'publish_carousel'
    when 'video' then 'publish_video'
    when 'short_video' then 'publish_short'
    when 'story' then 'publish_story'
    when 'long_video' then 'publish_video'
    else null
  end;
$$;

revoke all on function private.capability_required_for_social_content_format(text) from public;
revoke all on function private.capability_required_for_social_content_format(text) from anon;
revoke all on function private.capability_required_for_social_content_format(text) from authenticated;
revoke all on function private.capability_required_for_social_content_format(text) from service_role;

create or replace function private.compute_social_publication_backoff(
  p_attempt_count integer
)
returns interval
language sql
immutable
set search_path = ''
as $$
  select least(
    interval '1 hour',
    (interval '30 seconds') * power(2, greatest(p_attempt_count - 1, 0))
  );
$$;

revoke all on function private.compute_social_publication_backoff(integer) from public;
revoke all on function private.compute_social_publication_backoff(integer) from anon;
revoke all on function private.compute_social_publication_backoff(integer) from authenticated;
revoke all on function private.compute_social_publication_backoff(integer) from service_role;

-- ---------------------------------------------------------------------------
-- Human: create / cancel / retry
-- ---------------------------------------------------------------------------

create or replace function public.create_social_publication(
  p_organization_id uuid,
  p_variant_version_id uuid,
  p_connection_id uuid,
  p_execution_mode text,
  p_schedule_slot_id uuid default null,
  p_intended_execute_at timestamptz default null,
  p_idempotency_key text default null
)
returns table (result_code text, publication_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.social_content_variant_versions;
  v_connection public.social_account_connections;
  v_slot public.social_content_schedule_slots;
  v_ctx record;
  v_ready record;
  v_mode text := btrim(coalesce(p_execution_mode, ''));
  v_key text := nullif(btrim(coalesce(p_idempotency_key, '')), '');
  v_execute_at timestamptz;
  v_required_cap text;
  v_id uuid;
  v_existing uuid;
begin
  select vv.* into v_version from public.social_content_variant_versions as vv
  where vv.organization_id = p_organization_id and vv.id = p_variant_version_id;
  if not found then return query select 'not_found'::text, null::uuid; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_version.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;

  if v_mode not in ('scheduled', 'immediate') then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  if v_key is null then
    v_key := 'pub_' || replace(gen_random_uuid()::text, '-', '');
  end if;
  if char_length(v_key) < 8 or char_length(v_key) > 128 then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  select p.id into v_existing
  from public.social_publications as p
  where p.organization_id = p_organization_id and p.idempotency_key = v_key;
  if found then
    return query select 'success'::text, v_existing;
    return;
  end if;

  select c.* into v_connection from public.social_account_connections as c
  where c.organization_id = p_organization_id and c.id = p_connection_id;
  if not found then return query select 'not_found'::text, null::uuid; return; end if;

  -- Workspace + provider consistency
  if v_connection.workspace_id is distinct from v_version.workspace_id then
    return query select 'workspace_mismatch'::text, null::uuid; return;
  end if;
  if v_connection.provider is distinct from v_version.planned_provider then
    return query select 'provider_mismatch'::text, null::uuid; return;
  end if;
  if v_version.planned_provider <> 'instagram' or v_connection.provider <> 'instagram' then
    return query select 'provider_unsupported'::text, null::uuid; return;
  end if;

  if p_schedule_slot_id is not null then
    select s.* into v_slot from public.social_content_schedule_slots as s
    where s.organization_id = p_organization_id and s.id = p_schedule_slot_id;
    if not found then return query select 'not_found'::text, null::uuid; return; end if;
    if v_slot.status <> 'active' then return query select 'conflict'::text, null::uuid; return; end if;
    if v_slot.variant_version_id is distinct from p_variant_version_id then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
    if v_slot.workspace_id is distinct from v_version.workspace_id then
      return query select 'workspace_mismatch'::text, null::uuid; return;
    end if;
    if v_mode <> 'scheduled' then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
    v_execute_at := coalesce(p_intended_execute_at, v_slot.planned_at);
  else
    if v_mode <> 'immediate' then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
    v_execute_at := coalesce(p_intended_execute_at, pg_catalog.now());
  end if;

  select * into v_ready
  from public.evaluate_social_variant_version_workflow_readiness(p_organization_id, p_variant_version_id);
  if v_ready.result_code <> 'success' or v_ready.workflow_ready is not true then
    return query select 'workflow_not_ready'::text, null::uuid; return;
  end if;

  if v_connection.status <> 'connected'
     or v_connection.health = 'provider_unavailable'
     or v_connection.reauthorization_required_at is not null
  then
    return query select 'connection_ineligible'::text, null::uuid; return;
  end if;

  if v_connection.credential_ref_id is null then
    return query select 'credential_unavailable'::text, null::uuid; return;
  end if;

  v_required_cap := private.capability_required_for_social_content_format(v_version.content_format);
  if v_required_cap is null then
    return query select 'capability_missing'::text, null::uuid; return;
  end if;
  if not exists (
    select 1
    from jsonb_array_elements_text(coalesce(v_connection.capability_snapshot, '[]'::jsonb)) as cap(value)
    where cap.value = v_required_cap
  ) then
    return query select 'capability_missing'::text, null::uuid; return;
  end if;

  insert into public.social_publications (
    organization_id, brand_id, workspace_id, content_id, variant_id, variant_version_id,
    connection_id, provider, schedule_slot_id, execution_mode, status, idempotency_key,
    intended_execute_at, queued_at, next_attempt_at, created_by_member_id
  ) values (
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_version.content_id,
    v_version.variant_id, p_variant_version_id, p_connection_id, v_connection.provider,
    p_schedule_slot_id, v_mode, 'queued', v_key, v_execute_at, pg_catalog.now(),
    v_execute_at, v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_id, null,
    'social_publication_created', 'member', v_ctx.membership_id,
    jsonb_build_object('publication_id', v_id, 'execution_mode', v_mode)
  );
  perform private.insert_social_publication_event(
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_id, null,
    'social_publication_queued', 'member', v_ctx.membership_id,
    jsonb_build_object('publication_id', v_id)
  );

  return query select 'success'::text, v_id;
exception
  when unique_violation then
    select p.id into v_existing
    from public.social_publications as p
    where p.organization_id = p_organization_id and p.idempotency_key = v_key;
    if found then
      return query select 'success'::text, v_existing;
    else
      return query select 'conflict'::text, null::uuid;
    end if;
end;
$$;

revoke all on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) from public;
revoke all on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) from anon;
revoke all on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) from authenticated;
revoke all on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) from service_role;
grant execute on function public.create_social_publication(uuid, uuid, uuid, text, uuid, timestamptz, text) to authenticated;

create or replace function public.cancel_social_publication(
  p_organization_id uuid,
  p_publication_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pub public.social_publications;
  v_ctx record;
begin
  select p.* into v_pub from public.social_publications as p
  where p.organization_id = p_organization_id and p.id = p_publication_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_pub.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  if v_pub.status in ('succeeded', 'cancelled', 'processing', 'claimed', 'unknown_external_outcome') then
    return query select 'conflict'::text; return;
  end if;
  if v_pub.status not in ('pending', 'queued', 'failed_retryable', 'failed_terminal', 'manual_intervention') then
    return query select 'conflict'::text; return;
  end if;

  update public.social_publications
  set status = 'cancelled', cancelled_at = pg_catalog.now(), claimed_by = null, claim_lease_expires_at = null
  where organization_id = p_organization_id and id = p_publication_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_pub.brand_id, v_pub.workspace_id, p_publication_id, null,
    'social_publication_cancelled', 'member', v_ctx.membership_id,
    jsonb_build_object('publication_id', p_publication_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.cancel_social_publication(uuid, uuid) from public;
revoke all on function public.cancel_social_publication(uuid, uuid) from anon;
revoke all on function public.cancel_social_publication(uuid, uuid) from authenticated;
revoke all on function public.cancel_social_publication(uuid, uuid) from service_role;
grant execute on function public.cancel_social_publication(uuid, uuid) to authenticated;

create or replace function public.request_social_publication_retry(
  p_organization_id uuid,
  p_publication_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pub public.social_publications;
  v_ctx record;
begin
  select p.* into v_pub from public.social_publications as p
  where p.organization_id = p_organization_id and p.id = p_publication_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_pub.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  if v_pub.status not in ('failed_retryable', 'failed_terminal', 'manual_intervention') then
    return query select 'conflict'::text; return;
  end if;
  if v_pub.attempt_count >= v_pub.max_attempts and v_pub.status = 'failed_terminal' then
    return query select 'retry_exhausted'::text; return;
  end if;

  update public.social_publications
  set
    status = 'queued',
    next_attempt_at = pg_catalog.now(),
    queued_at = coalesce(queued_at, pg_catalog.now()),
    claimed_by = null,
    claim_lease_expires_at = null
  where organization_id = p_organization_id and id = p_publication_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_pub.brand_id, v_pub.workspace_id, p_publication_id, null,
    'social_publication_retry_requested', 'member', v_ctx.membership_id,
    jsonb_build_object('publication_id', p_publication_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.request_social_publication_retry(uuid, uuid) from public;
revoke all on function public.request_social_publication_retry(uuid, uuid) from anon;
revoke all on function public.request_social_publication_retry(uuid, uuid) from authenticated;
revoke all on function public.request_social_publication_retry(uuid, uuid) from service_role;
grant execute on function public.request_social_publication_retry(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- System / worker RPCs (private schema — NOT granted to authenticated/anon)
-- ---------------------------------------------------------------------------

create or replace function private.claim_due_social_publications(
  p_organization_id uuid,
  p_worker_id text,
  p_limit integer default 1,
  p_lease_seconds integer default 120
)
returns table (
  result_code text,
  publication_id uuid,
  claim_generation integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_worker text := btrim(coalesce(p_worker_id, ''));
  v_limit integer := greatest(1, least(coalesce(p_limit, 1), 20));
  v_lease integer := greatest(30, least(coalesce(p_lease_seconds, 120), 900));
  v_pub_id uuid;
  v_claim_gen integer;
  v_brand_id uuid;
  v_workspace_id uuid;
  v_claimed boolean := false;
begin
  perform private.assert_social_publication_worker();
  if not private.social_publishing_execution_enabled() then
    return query select 'feature_disabled'::text, null::uuid, null::integer;
    return;
  end if;
  if char_length(v_worker) = 0 or char_length(v_worker) > 128 or p_organization_id is null then
    return query select 'invalid_input'::text, null::uuid, null::integer;
    return;
  end if;

  for v_pub_id in
    select p.id
    from public.social_publications as p
    where p.organization_id = p_organization_id
      and (
        p.status in ('pending', 'queued', 'failed_retryable')
        or (
          p.status = 'claimed'
          and p.claim_lease_expires_at is not null
          and p.claim_lease_expires_at < pg_catalog.now()
        )
      )
      and coalesce(p.next_attempt_at, p.intended_execute_at) <= pg_catalog.now()
    order by coalesce(p.next_attempt_at, p.intended_execute_at) asc
    for update skip locked
    limit v_limit
  loop
    update public.social_publications as p
    set
      status = 'claimed',
      claimed_at = pg_catalog.now(),
      claim_lease_expires_at = pg_catalog.now() + make_interval(secs => v_lease),
      claimed_by = v_worker,
      claim_generation = p.claim_generation + 1
    where p.organization_id = p_organization_id and p.id = v_pub_id
    returning p.claim_generation, p.brand_id, p.workspace_id
    into v_claim_gen, v_brand_id, v_workspace_id;

    perform private.insert_social_publication_event(
      p_organization_id, v_brand_id, v_workspace_id,
      v_pub_id, null, 'social_publication_claimed', 'system', null,
      jsonb_build_object('publication_id', v_pub_id, 'worker_id', v_worker, 'claim_generation', v_claim_gen)
    );

    v_claimed := true;
    return query select 'success'::text, v_pub_id, v_claim_gen;
  end loop;

  if not v_claimed then
    return query select 'none_due'::text, null::uuid, null::integer;
  end if;
end;
$$;

revoke all on function private.claim_due_social_publications(uuid, text, integer, integer) from public;
revoke all on function private.claim_due_social_publications(uuid, text, integer, integer) from anon;
revoke all on function private.claim_due_social_publications(uuid, text, integer, integer) from authenticated;
revoke all on function private.claim_due_social_publications(uuid, text, integer, integer) from service_role;

create or replace function private.start_social_publication_attempt(
  p_organization_id uuid,
  p_publication_id uuid,
  p_worker_id text,
  p_claim_generation integer
)
returns table (result_code text, attempt_id uuid, attempt_number integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pub public.social_publications;
  v_worker text := btrim(coalesce(p_worker_id, ''));
  v_number integer;
  v_id uuid;
  v_op text;
begin
  perform private.assert_social_publication_worker();
  if not private.social_publishing_execution_enabled() then
    return query select 'feature_disabled'::text, null::uuid, null::integer;
    return;
  end if;

  select p.* into v_pub from public.social_publications as p
  where p.organization_id = p_organization_id and p.id = p_publication_id
  for update;
  if not found then return query select 'not_found'::text, null::uuid, null::integer; return; end if;

  if v_pub.status <> 'claimed'
     or v_pub.claimed_by is distinct from v_worker
     or v_pub.claim_generation is distinct from p_claim_generation
     or v_pub.claim_lease_expires_at is null
     or v_pub.claim_lease_expires_at < pg_catalog.now()
  then
    return query select 'stale_claim'::text, null::uuid, null::integer; return;
  end if;

  if exists (
    select 1 from public.social_publication_attempts as a
    where a.organization_id = p_organization_id
      and a.publication_id = p_publication_id
      and a.outcome = 'processing'
  ) then
    return query select 'conflict'::text, null::uuid, null::integer; return;
  end if;

  v_number := v_pub.attempt_count + 1;
  if v_number > v_pub.max_attempts then
    return query select 'retry_exhausted'::text, null::uuid, null::integer; return;
  end if;

  v_op := 'op_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.social_publication_attempts (
    organization_id, publication_id, attempt_number, outcome, operation_id,
    worker_id, claim_generation
  ) values (
    p_organization_id, p_publication_id, v_number, 'processing', v_op,
    v_worker, p_claim_generation
  ) returning id into v_id;

  update public.social_publications
  set
    status = 'processing',
    attempt_count = v_number,
    first_started_at = coalesce(first_started_at, pg_catalog.now())
  where organization_id = p_organization_id and id = p_publication_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_pub.brand_id, v_pub.workspace_id, p_publication_id, v_id,
    'social_publication_attempt_started', 'system', null,
    jsonb_build_object('attempt_id', v_id, 'attempt_number', v_number, 'operation_id', v_op)
  );

  return query select 'success'::text, v_id, v_number;
end;
$$;

revoke all on function private.start_social_publication_attempt(uuid, uuid, text, integer) from public;
revoke all on function private.start_social_publication_attempt(uuid, uuid, text, integer) from anon;
revoke all on function private.start_social_publication_attempt(uuid, uuid, text, integer) from authenticated;
revoke all on function private.start_social_publication_attempt(uuid, uuid, text, integer) from service_role;

create or replace function private.complete_social_publication_attempt(
  p_organization_id uuid,
  p_attempt_id uuid,
  p_worker_id text,
  p_claim_generation integer,
  p_outcome text,
  p_failure_class text default null,
  p_safe_error_code text default null,
  p_external_publication_id text default null
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.social_publication_attempts;
  v_pub public.social_publications;
  v_worker text := btrim(coalesce(p_worker_id, ''));
  v_outcome text := btrim(coalesce(p_outcome, ''));
  v_failure text := nullif(btrim(coalesce(p_failure_class, '')), '');
  v_error text := nullif(btrim(coalesce(p_safe_error_code, '')), '');
  v_ext text := nullif(btrim(coalesce(p_external_publication_id, '')), '');
  v_retryable boolean := false;
  v_pub_status text;
  v_event text;
begin
  perform private.assert_social_publication_worker();
  -- Completing an attempt still requires worker context; feature gate already checked at claim/start.
  -- If gate flipped mid-flight, still allow terminal recording of known outcomes.

  select a.* into v_attempt from public.social_publication_attempts as a
  where a.organization_id = p_organization_id and a.id = p_attempt_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;
  if v_attempt.outcome <> 'processing' then return query select 'conflict'::text; return; end if;

  select p.* into v_pub from public.social_publications as p
  where p.organization_id = p_organization_id and p.id = v_attempt.publication_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;

  if v_pub.claimed_by is distinct from v_worker
     or v_pub.claim_generation is distinct from p_claim_generation
     or v_attempt.claim_generation is distinct from p_claim_generation
  then
    return query select 'stale_claim'::text; return;
  end if;

  if v_outcome not in (
    'succeeded', 'failed_retryable', 'failed_terminal', 'cancelled', 'unknown_external_outcome'
  ) then
    return query select 'invalid_input'::text; return;
  end if;

  if v_outcome = 'succeeded' then
    if v_ext is null or char_length(v_ext) > 256 then
      return query select 'invalid_input'::text; return;
    end if;
    v_pub_status := 'succeeded';
    v_event := 'social_publication_attempt_succeeded';
  elsif v_outcome = 'unknown_external_outcome' then
    v_pub_status := 'unknown_external_outcome';
    v_failure := coalesce(v_failure, 'unknown_external_outcome');
    v_event := 'social_publication_unknown_external_outcome';
  elsif v_outcome = 'cancelled' then
    v_pub_status := 'cancelled';
    v_event := 'social_publication_cancelled';
  elsif v_outcome = 'failed_retryable' then
    v_retryable := true;
    if v_pub.attempt_count >= v_pub.max_attempts then
      v_pub_status := 'failed_terminal';
      v_outcome := 'failed_terminal';
      v_retryable := false;
      v_event := 'social_publication_manual_intervention';
    else
      v_pub_status := 'failed_retryable';
      v_event := 'social_publication_attempt_failed';
    end if;
  else
    v_pub_status := case
      when v_failure in ('authorization', 'credential', 'capability', 'validation', 'media', 'provider_permanent', 'adapter_unavailable', 'feature_disabled', 'workflow_not_ready', 'connection_ineligible')
        then 'manual_intervention'
      else 'failed_terminal'
    end;
    v_event := case
      when v_pub_status = 'manual_intervention' then 'social_publication_manual_intervention'
      else 'social_publication_attempt_failed'
    end;
  end if;

  update public.social_publication_attempts
  set
    outcome = v_outcome,
    failure_class = v_failure,
    retryable = case when v_outcome = 'succeeded' then false else v_retryable end,
    safe_error_code = v_error,
    finished_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_attempt_id and outcome = 'processing';

  update public.social_publications
  set
    status = v_pub_status,
    completed_at = case when v_pub_status in ('succeeded', 'cancelled', 'failed_terminal', 'manual_intervention', 'unknown_external_outcome') then pg_catalog.now() else completed_at end,
    external_publication_id = case when v_outcome = 'succeeded' then v_ext else external_publication_id end,
    last_failure_class = case when v_outcome = 'succeeded' then null else v_failure end,
    next_attempt_at = case
      when v_pub_status = 'failed_retryable' then pg_catalog.now() + private.compute_social_publication_backoff(v_pub.attempt_count)
      else null
    end,
    claimed_by = null,
    claim_lease_expires_at = null
  where organization_id = p_organization_id and id = v_attempt.publication_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_pub.brand_id, v_pub.workspace_id, v_attempt.publication_id, p_attempt_id,
    v_event, 'system', null,
    jsonb_build_object(
      'attempt_id', p_attempt_id,
      'outcome', v_outcome,
      'failure_class', v_failure,
      'publication_status', v_pub_status
    )
  );

  return query select 'success'::text;
end;
$$;

revoke all on function private.complete_social_publication_attempt(uuid, uuid, text, integer, text, text, text, text) from public;
revoke all on function private.complete_social_publication_attempt(uuid, uuid, text, integer, text, text, text, text) from anon;
revoke all on function private.complete_social_publication_attempt(uuid, uuid, text, integer, text, text, text, text) from authenticated;
revoke all on function private.complete_social_publication_attempt(uuid, uuid, text, integer, text, text, text, text) from service_role;

-- Explicitly no public wrappers for worker completion — browser must not mark success.
comment on function private.complete_social_publication_attempt(uuid, uuid, text, integer, text, text, text, text) is
  'System-only publication attempt completion. Not granted to authenticated. Requires zyntix.social_publication_worker=on.';

comment on function private.claim_due_social_publications(uuid, text, integer, integer) is
  'System-only claim with FOR UPDATE SKIP LOCKED. Requires worker GUC + publishing gate. No live provider calls.';

