-- SMM-B1.11-F — scheduler_start may claim Story IMAGE as well as feed IMAGE.
-- Story VIDEO remains format_unsupported. No second Story table.
-- Fail-closed without a window unless unrestricted GUC is set.

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
  v_window_code text;
  v_peek_workspace uuid;
  v_peek_connection uuid;
  v_peek_mode text;
begin
  perform private.assert_social_scheduler_service_role();

  if p_organization_id is null or p_publication_id is null then
    return query select
      'invalid_input'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  select p.workspace_id, p.connection_id, p.execution_mode
  into v_peek_workspace, v_peek_connection, v_peek_mode
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id;
  if not found then
    return query select
      'not_found'::text, null::uuid, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;
  if v_peek_mode is distinct from 'scheduled' then
    return query select
      'not_scheduled'::text, p_publication_id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  v_window_code := private.assert_and_consume_scheduled_controlled_publish_window(
    p_organization_id,
    p_publication_id,
    v_peek_workspace,
    v_peek_connection
  );
  if v_window_code is distinct from 'ok' then
    return query select
      v_window_code, p_publication_id, null::uuid, null::integer, null::integer, null::text;
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

  if v_version.content_format not in ('image', 'story') then
    return query select
      'format_unsupported'::text, v_pub.id, null::uuid, null::integer, null::integer, null::text;
    return;
  end if;

  -- B1.11-F: Story VIDEO is not implemented. Feed IMAGE remains image-only.
  if v_version.content_format = 'story'
     and (
       jsonb_typeof(coalesce(v_version.media_snapshot, '[]'::jsonb)) is distinct from 'array'
       or jsonb_array_length(v_version.media_snapshot) is distinct from 1
       or coalesce(v_version.media_snapshot->0->>'media_category', '') is distinct from 'image'
     )
  then
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
     or (
       v_version.content_format = 'image'
       and v_required_cap is distinct from 'publish_image'
     )
     or (
       v_version.content_format = 'story'
       and v_required_cap is distinct from 'publish_story'
     )
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

  -- Arm worker context only after revalidation and controlled-window consume passed.
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
  'B1.11-F scheduler claim+start. service_role only. Feed IMAGE and Story IMAGE only. Consumes the matching controlled window before claim. Fail-closed without a window unless unrestricted GUC is set. Does not grant private.claim_due_social_publications.';
