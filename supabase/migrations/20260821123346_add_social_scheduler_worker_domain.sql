-- SMM-B1.11-C — Fail-closed scheduler worker database contract.
-- Reuses public.social_publications as the execution source of truth.
-- Does NOT grant private.claim_due_social_publications to any role.
-- Does NOT create a second queue/schedule table.
-- Browser/authenticated members cannot invoke these RPCs.
-- service_role-only wrappers; org/publication identity comes from DB rows.

-- ---------------------------------------------------------------------------
-- 0) Service-role assertion (machine worker, not member authorization)
-- ---------------------------------------------------------------------------

create or replace function private.assert_social_scheduler_service_role()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'social scheduler requires service_role'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on function private.assert_social_scheduler_service_role() from public;
revoke all on function private.assert_social_scheduler_service_role() from anon;
revoke all on function private.assert_social_scheduler_service_role() from authenticated;
revoke all on function private.assert_social_scheduler_service_role() from service_role;

-- ---------------------------------------------------------------------------
-- 1) Worker-safe editorial readiness (no auth.uid() / is_org_member)
-- ---------------------------------------------------------------------------

create or replace function private.social_variant_version_is_workflow_ready(
  p_organization_id uuid,
  p_variant_version_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_version public.social_content_variant_versions;
  v_ws public.social_workspaces;
  v_variant_archived timestamptz;
  v_content_archived timestamptz;
  v_internal_req boolean;
  v_client_req boolean;
  v_has_internal boolean := false;
  v_has_client boolean := false;
  v_media_ok boolean := true;
  v_elem jsonb;
  v_asset_id uuid;
  v_asset_archived timestamptz;
begin
  if p_organization_id is null or p_variant_version_id is null then
    return false;
  end if;

  select vv.* into v_version
  from public.social_content_variant_versions as vv
  where vv.organization_id = p_organization_id
    and vv.id = p_variant_version_id;
  if not found then
    return false;
  end if;

  select w.* into v_ws
  from public.social_workspaces as w
  where w.organization_id = p_organization_id
    and w.id = v_version.workspace_id;
  if not found then
    return false;
  end if;

  select v.archived_at into v_variant_archived
  from public.social_content_variants as v
  where v.organization_id = p_organization_id
    and v.id = v_version.variant_id;

  select c.archived_at into v_content_archived
  from public.social_content_items as c
  where c.organization_id = p_organization_id
    and c.id = v_version.content_id;

  v_internal_req := coalesce(v_ws.internal_approval_required, true);
  v_client_req := coalesce(v_ws.client_approval_required, false);

  select exists (
    select 1 from public.social_approval_decisions as d
    where d.organization_id = p_organization_id
      and d.variant_version_id = p_variant_version_id
      and d.approval_context = 'internal'
      and d.decision = 'approved'
  ) into v_has_internal;

  select exists (
    select 1 from public.social_approval_decisions as d
    where d.organization_id = p_organization_id
      and d.variant_version_id = p_variant_version_id
      and d.approval_context = 'client'
      and d.decision = 'approved'
  ) into v_has_client;

  for v_elem in
    select value from jsonb_array_elements(coalesce(v_version.media_snapshot, '[]'::jsonb))
  loop
    begin
      v_asset_id := (v_elem->>'asset_id')::uuid;
    exception when others then
      v_media_ok := false;
      exit;
    end;
    select a.archived_at into v_asset_archived
    from public.social_media_assets as a
    where a.organization_id = p_organization_id and a.id = v_asset_id;
    if not found or v_asset_archived is not null then
      v_media_ok := false;
      exit;
    end if;
  end loop;

  return
    v_ws.archived_at is null
    and v_variant_archived is null
    and v_content_archived is null
    and v_media_ok
    and (not v_internal_req or v_has_internal)
    and (not v_client_req or v_has_client);
end;
$$;

revoke all on function private.social_variant_version_is_workflow_ready(uuid, uuid) from public;
revoke all on function private.social_variant_version_is_workflow_ready(uuid, uuid) from anon;
revoke all on function private.social_variant_version_is_workflow_ready(uuid, uuid) from authenticated;
revoke all on function private.social_variant_version_is_workflow_ready(uuid, uuid) from service_role;

-- ---------------------------------------------------------------------------
-- 2) Read-only due discovery (no claim, no events, no credentials)
-- ---------------------------------------------------------------------------

create or replace function public.scheduler_list_due_scheduled_social_publications(
  p_limit integer default 5
)
returns table (
  result_code text,
  organization_id uuid,
  publication_id uuid,
  status text,
  execution_mode text,
  intended_execute_at timestamptz,
  next_attempt_at timestamptz,
  due_at timestamptz,
  seconds_late integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit, 5), 20));
begin
  perform private.assert_social_scheduler_service_role();

  return query
  select
    'success'::text,
    p.organization_id,
    p.id,
    p.status,
    p.execution_mode,
    p.intended_execute_at,
    p.next_attempt_at,
    coalesce(p.next_attempt_at, p.intended_execute_at),
    greatest(
      0,
      floor(
        extract(
          epoch from (
            pg_catalog.now() - coalesce(p.next_attempt_at, p.intended_execute_at)
          )
        )
      )::integer
    )
  from public.social_publications as p
  where p.execution_mode = 'scheduled'
    and (
      p.status in ('pending', 'queued', 'failed_retryable')
      or (
        p.status = 'claimed'
        and p.claim_lease_expires_at is not null
        and p.claim_lease_expires_at < pg_catalog.now()
      )
    )
    and coalesce(p.next_attempt_at, p.intended_execute_at) is not null
    and coalesce(p.next_attempt_at, p.intended_execute_at) <= pg_catalog.now()
  order by coalesce(p.next_attempt_at, p.intended_execute_at) asc, p.id asc
  limit v_limit;
end;
$$;

revoke all on function public.scheduler_list_due_scheduled_social_publications(integer) from public;
revoke all on function public.scheduler_list_due_scheduled_social_publications(integer) from anon;
revoke all on function public.scheduler_list_due_scheduled_social_publications(integer) from authenticated;
revoke all on function public.scheduler_list_due_scheduled_social_publications(integer) from service_role;
grant execute on function public.scheduler_list_due_scheduled_social_publications(integer) to service_role;

comment on function public.scheduler_list_due_scheduled_social_publications(integer) is
  'B1.11-C read-only due discovery for scheduled social_publications. service_role only. Does not claim, mutate, load credentials, or call providers. Immediate execution_mode rows are excluded.';

-- ---------------------------------------------------------------------------
-- 3) Claim + start with claim-time revalidation (scheduled only)
-- ---------------------------------------------------------------------------

create or replace function public.scheduler_start_scheduled_publication_attempt(
  p_organization_id uuid,
  p_publication_id uuid
)
returns table (
  result_code text,
  publication_id uuid,
  attempt_id uuid,
  attempt_number integer,
  claim_generation integer,
  worker_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pub public.social_publications;
  v_connection public.social_account_connections;
  v_version public.social_content_variant_versions;
  v_ws_archived timestamptz;
  v_worker text;
  v_lease integer := 360;
  v_claim_gen integer;
  v_start_code text;
  v_attempt_id uuid;
  v_attempt_number integer;
  v_beta text;
  v_required_cap text;
  v_due_at timestamptz;
  v_claimable boolean := false;
begin
  perform private.assert_social_scheduler_service_role();

  if p_organization_id is null or p_publication_id is null then
    return query select
      'invalid_input'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  -- Organization identity is taken from the locked row, not from a client binding.
  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  for update skip locked;

  if not found then
    -- Missing or locked by another worker/manual execute.
    if exists (
      select 1
      from public.social_publications as p
      where p.organization_id = p_organization_id
        and p.id = p_publication_id
    ) then
      return query select
        'skipped_locked'::text, p_publication_id, null::uuid, null::integer, null::integer, null::text;
      return;
    end if;
    return query select
      'not_found'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if v_pub.organization_id is distinct from p_organization_id then
    return query select
      'forbidden'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if v_pub.execution_mode is distinct from 'scheduled' then
    return query select
      'not_scheduled'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if v_pub.status in (
    'succeeded',
    'cancelled',
    'unknown_external_outcome',
    'manual_intervention',
    'failed_terminal',
    'processing'
  ) then
    return query select
      'conflict'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if v_pub.status in ('pending', 'queued', 'failed_retryable') then
    v_claimable := true;
  elsif v_pub.status = 'claimed'
     and v_pub.claim_lease_expires_at is not null
     and v_pub.claim_lease_expires_at < pg_catalog.now()
  then
    v_claimable := true;
  end if;

  if not v_claimable then
    return query select
      'conflict'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  v_due_at := coalesce(v_pub.next_attempt_at, v_pub.intended_execute_at);
  if v_due_at is null or v_due_at > pg_catalog.now() then
    return query select
      'none_due'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  -- C safety refuse for obviously stale work. Full missed-window Attention is B1.11-D.
  if extract(epoch from (pg_catalog.now() - v_due_at)) > 900 then
    return query select
      'missed_window'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if exists (
    select 1 from public.social_publication_attempts as a
    where a.organization_id = v_pub.organization_id
      and a.publication_id = v_pub.id
      and a.outcome = 'processing'
  ) then
    return query select
      'conflict'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  v_beta := private.social_closed_beta_publish_result_code(v_pub.organization_id);
  if v_beta <> 'ok' then
    return query select
      v_beta, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  select w.archived_at into v_ws_archived
  from public.social_workspaces as w
  where w.organization_id = v_pub.organization_id
    and w.id = v_pub.workspace_id;
  if not found or v_ws_archived is not null then
    return query select
      'conflict'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if not private.social_variant_version_is_workflow_ready(
    v_pub.organization_id,
    v_pub.variant_version_id
  ) then
    return query select
      'workflow_not_ready'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  select vv.* into v_version
  from public.social_content_variant_versions as vv
  where vv.organization_id = v_pub.organization_id
    and vv.id = v_pub.variant_version_id;
  if not found then
    return query select
      'not_found'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if v_version.content_format is distinct from 'image' then
    return query select
      'format_unsupported'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  select c.* into v_connection
  from public.social_account_connections as c
  where c.organization_id = v_pub.organization_id
    and c.id = v_pub.connection_id;
  if not found then
    return query select
      'connection_ineligible'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  if v_connection.status is distinct from 'connected'
     or v_connection.health is distinct from 'healthy'
     or v_connection.reauthorization_required_at is not null
     or v_connection.credential_ref_id is null
  then
    return query select
      'connection_ineligible'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  v_required_cap := private.capability_required_for_social_content_format(v_version.content_format);
  if v_required_cap is null
     or v_required_cap is distinct from 'publish_image'
     or not exists (
       select 1
       from jsonb_array_elements_text(coalesce(v_connection.capability_snapshot, '[]'::jsonb)) as cap(value)
       where cap.value = v_required_cap
     )
  then
    return query select
      'capability_missing'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  -- Arm worker context only after revalidation passed. Does not consume a controlled window.
  perform set_config('zyntix.social_publication_worker', 'on', true);
  perform set_config('zyntix.social_publishing_enabled', 'true', true);

  v_worker := 'sched_' || left(replace(gen_random_uuid()::text, '-', ''), 16);

  update public.social_publications as p
  set
    status = 'claimed',
    claimed_at = pg_catalog.now(),
    claim_lease_expires_at = pg_catalog.now() + make_interval(secs => v_lease),
    claimed_by = v_worker,
    claim_generation = p.claim_generation + 1,
    updated_at = pg_catalog.now()
  where p.organization_id = v_pub.organization_id
    and p.id = v_pub.id
    and p.execution_mode = 'scheduled'
    and (
      p.status in ('pending', 'queued', 'failed_retryable')
      or (
        p.status = 'claimed'
        and p.claim_lease_expires_at is not null
        and p.claim_lease_expires_at < pg_catalog.now()
      )
    )
  returning p.claim_generation into v_claim_gen;

  if not found then
    return query select
      'conflict'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  perform private.insert_social_publication_event(
    v_pub.organization_id,
    v_pub.brand_id,
    v_pub.workspace_id,
    v_pub.id,
    null,
    'social_publication_claimed',
    'system',
    null,
    jsonb_build_object(
      'publication_id', v_pub.id,
      'worker_id', v_worker,
      'claim_generation', v_claim_gen,
      'source', 'scheduler'
    )
  );

  select s.result_code, s.attempt_id, s.attempt_number
  into v_start_code, v_attempt_id, v_attempt_number
  from private.start_social_publication_attempt(
    v_pub.organization_id,
    v_pub.id,
    v_worker,
    v_claim_gen
  ) as s;

  if v_start_code is distinct from 'success' then
    return query select
      coalesce(v_start_code, 'unexpected')::text,
      v_pub.id,
      null::uuid,
      null::integer,
      v_claim_gen,
      v_worker;
    return;
  end if;

  return query select
    'success'::text,
    v_pub.id,
    v_attempt_id,
    v_attempt_number,
    v_claim_gen,
    v_worker;
end;
$$;

revoke all on function public.scheduler_start_scheduled_publication_attempt(uuid, uuid) from public;
revoke all on function public.scheduler_start_scheduled_publication_attempt(uuid, uuid) from anon;
revoke all on function public.scheduler_start_scheduled_publication_attempt(uuid, uuid) from authenticated;
revoke all on function public.scheduler_start_scheduled_publication_attempt(uuid, uuid) from service_role;
grant execute on function public.scheduler_start_scheduled_publication_attempt(uuid, uuid) to service_role;

comment on function public.scheduler_start_scheduled_publication_attempt(uuid, uuid) is
  'B1.11-C scheduler claim+start. service_role only. Scheduled execution_mode, due clock, SKIP LOCKED, claim-time revalidation. Does not consume controlled windows. Does not grant private.claim_due_social_publications.';

-- ---------------------------------------------------------------------------
-- 4) Execution context load (no credentials / no tokens)
-- ---------------------------------------------------------------------------

create or replace function public.scheduler_load_social_publication_execution_context(
  p_organization_id uuid,
  p_publication_id uuid
)
returns table (
  result_code text,
  publication_id uuid,
  organization_id uuid,
  workspace_id uuid,
  connection_id uuid,
  variant_version_id uuid,
  provider text,
  publication_status text,
  content_format text,
  caption text,
  alt_text text,
  media_snapshot jsonb,
  connection_status text,
  connection_health text,
  external_account_id text,
  capability_snapshot jsonb,
  reauthorization_required_at timestamptz,
  operation_id text,
  attempt_id uuid,
  worker_id text,
  claim_generation integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pub public.social_publications;
  v_version public.social_content_variant_versions;
  v_connection public.social_account_connections;
  v_attempt public.social_publication_attempts;
begin
  perform private.assert_social_scheduler_service_role();

  if p_organization_id is null or p_publication_id is null then
    return query select
      'invalid_input'::text,
      null::uuid, null::uuid, null::uuid, null::uuid, null::uuid, null::text, null::text,
      null::text, null::text, null::text, null::jsonb,
      null::text, null::text, null::text, null::jsonb, null::timestamptz,
      null::text, null::uuid, null::text, null::integer;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id;
  if not found then
    return query select
      'not_found'::text,
      null::uuid, null::uuid, null::uuid, null::uuid, null::uuid, null::text, null::text,
      null::text, null::text, null::text, null::jsonb,
      null::text, null::text, null::text, null::jsonb, null::timestamptz,
      null::text, null::uuid, null::text, null::integer;
    return;
  end if;

  select a.* into v_attempt
  from public.social_publication_attempts as a
  where a.organization_id = p_organization_id
    and a.publication_id = p_publication_id
    and a.outcome = 'processing'
  order by a.attempt_number desc
  limit 1;

  select vv.* into v_version
  from public.social_content_variant_versions as vv
  where vv.organization_id = p_organization_id
    and vv.id = v_pub.variant_version_id;

  select c.* into v_connection
  from public.social_account_connections as c
  where c.organization_id = p_organization_id
    and c.id = v_pub.connection_id;

  return query select
    'success'::text,
    v_pub.id,
    v_pub.organization_id,
    v_pub.workspace_id,
    v_pub.connection_id,
    v_pub.variant_version_id,
    v_pub.provider,
    v_pub.status,
    v_version.content_format,
    v_version.caption,
    v_version.alt_text,
    v_version.media_snapshot,
    v_connection.status,
    v_connection.health,
    v_connection.external_account_id,
    v_connection.capability_snapshot,
    v_connection.reauthorization_required_at,
    v_attempt.operation_id,
    v_attempt.id,
    v_pub.claimed_by,
    v_pub.claim_generation;
end;
$$;

revoke all on function public.scheduler_load_social_publication_execution_context(uuid, uuid) from public;
revoke all on function public.scheduler_load_social_publication_execution_context(uuid, uuid) from anon;
revoke all on function public.scheduler_load_social_publication_execution_context(uuid, uuid) from authenticated;
revoke all on function public.scheduler_load_social_publication_execution_context(uuid, uuid) from service_role;
grant execute on function public.scheduler_load_social_publication_execution_context(uuid, uuid) to service_role;

comment on function public.scheduler_load_social_publication_execution_context(uuid, uuid) is
  'B1.11-C scheduler execution context. service_role only. No credential ciphertext in this function.';

-- ---------------------------------------------------------------------------
-- 5) Credential envelope load (ciphertext only; never plaintext)
-- ---------------------------------------------------------------------------

create or replace function public.scheduler_load_social_provider_credential_envelope(
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
  v_connection public.social_account_connections;
  v_existing private.social_provider_credentials;
begin
  perform private.assert_social_scheduler_service_role();

  if p_connection_id is null then
    return query select
      'invalid_input'::text,
      null::uuid, null::uuid, null::uuid, null::text,
      null::integer, null::text, null::integer,
      null::text, null::text, null::text, null::integer;
    return;
  end if;

  select sac.* into v_connection
  from public.social_account_connections as sac
  where sac.id = p_connection_id;
  if not found then
    return query select
      'not_found'::text,
      null::uuid, null::uuid, null::uuid, null::text,
      null::integer, null::text, null::integer,
      null::text, null::text, null::text, null::integer;
    return;
  end if;

  select cred.* into v_existing
  from private.social_provider_credentials as cred
  where cred.connection_id = v_connection.id
    and cred.organization_id = v_connection.organization_id;
  if not found then
    return query select
      'not_found'::text,
      null::uuid, null::uuid, null::uuid, null::text,
      null::integer, null::text, null::integer,
      null::text, null::text, null::text, null::integer;
    return;
  end if;

  return query select
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

revoke all on function public.scheduler_load_social_provider_credential_envelope(uuid) from public;
revoke all on function public.scheduler_load_social_provider_credential_envelope(uuid) from anon;
revoke all on function public.scheduler_load_social_provider_credential_envelope(uuid) from authenticated;
revoke all on function public.scheduler_load_social_provider_credential_envelope(uuid) from service_role;
grant execute on function public.scheduler_load_social_provider_credential_envelope(uuid) to service_role;

comment on function public.scheduler_load_social_provider_credential_envelope(uuid) is
  'B1.11-C scheduler ciphertext envelope load. service_role only. Never returns plaintext tokens. Must not be mapped to UI.';

-- ---------------------------------------------------------------------------
-- 6) Attempt completion wrapper (same private complete as B1.8)
-- ---------------------------------------------------------------------------

create or replace function public.scheduler_complete_scheduled_publication_attempt(
  p_organization_id uuid,
  p_attempt_id uuid,
  p_worker_id text,
  p_claim_generation integer,
  p_outcome text,
  p_failure_class text default null,
  p_safe_error_code text default null,
  p_external_publication_id text default null,
  p_provider_step text default null,
  p_provider_http_status integer default null,
  p_provider_error_code integer default null,
  p_provider_error_subcode integer default null,
  p_provider_error_type text default null,
  p_safe_provider_message text default null,
  p_provider_request_dispatched boolean default null,
  p_provider_response_received boolean default null,
  p_external_container_id_present boolean default null
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_complete_code text;
begin
  perform private.assert_social_scheduler_service_role();

  if p_organization_id is null
     or p_attempt_id is null
     or p_claim_generation is null
     or nullif(btrim(coalesce(p_worker_id, '')), '') is null
  then
    return query select 'invalid_input'::text;
    return;
  end if;

  perform set_config('zyntix.social_publication_worker', 'on', true);

  select c.result_code
  into v_complete_code
  from private.complete_social_publication_attempt(
    p_organization_id,
    p_attempt_id,
    p_worker_id,
    p_claim_generation,
    p_outcome,
    p_failure_class,
    p_safe_error_code,
    p_external_publication_id,
    p_provider_step,
    p_provider_http_status,
    p_provider_error_code,
    p_provider_error_subcode,
    p_provider_error_type,
    p_safe_provider_message,
    p_provider_request_dispatched,
    p_provider_response_received,
    p_external_container_id_present
  ) as c;

  return query select coalesce(v_complete_code, 'unexpected')::text;
end;
$$;

revoke all on function public.scheduler_complete_scheduled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from public;
revoke all on function public.scheduler_complete_scheduled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from anon;
revoke all on function public.scheduler_complete_scheduled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from authenticated;
revoke all on function public.scheduler_complete_scheduled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from service_role;
grant execute on function public.scheduler_complete_scheduled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) to service_role;

comment on function public.scheduler_complete_scheduled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) is
  'B1.11-C scheduler completion wrapper around private.complete_social_publication_attempt. service_role only. Authenticated/browser cannot mark success.';
