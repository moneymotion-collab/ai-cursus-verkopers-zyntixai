-- SMM-B1.11-E PRE-LIVE — Operator window stamps + scheduler_start consume.
-- Does not create a second queue. Does not enable execution gates.

create or replace function public.operator_open_social_controlled_publish_window(
  p_organization_id uuid,
  p_publication_id uuid,
  p_max_execute_count integer default 1,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  window_id uuid,
  publication_id uuid,
  max_execute_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pub public.social_publications;
  v_id uuid;
  v_max integer := coalesce(p_max_execute_count, 1);
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);

  if p_organization_id is null or p_publication_id is null then
    return query select 'invalid_input'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;
  if v_max < 1 or v_max > 5 then
    return query select 'invalid_input'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;

  if exists (
    select 1 from public.social_controlled_publish_windows w
    where w.organization_id = p_organization_id and w.status = 'active'
  ) then
    return query select 'conflict'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications p
  where p.organization_id = p_organization_id and p.id = p_publication_id;
  if not found then
    return query select 'not_found'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;
  if v_pub.status not in ('pending', 'queued', 'failed_retryable') then
    return query select 'conflict'::text, null::uuid, null::uuid, null::integer;
    return;
  end if;

  insert into public.social_controlled_publish_windows (
    organization_id,
    publication_id,
    workspace_id,
    connection_id,
    status,
    max_execute_count,
    reason,
    created_by_actor_user_id
  ) values (
    p_organization_id,
    p_publication_id,
    v_pub.workspace_id,
    v_pub.connection_id,
    'active',
    v_max,
    nullif(btrim(coalesce(p_reason, '')), ''),
    p_actor_user_id
  ) returning id into v_id;

  perform private.insert_social_controlled_publish_window_event(
    p_organization_id, v_id, 'window_authorized', p_publication_id, null,
    'platform_operator', p_actor_user_id,
    jsonb_build_object(
      'max_execute_count', v_max,
      'workspace_id', v_pub.workspace_id,
      'connection_id', v_pub.connection_id
    )
  );

  return query select 'success'::text, v_id, p_publication_id, v_max;
end;
$$;

create or replace function public.operator_set_social_controlled_publish_window_expiry(
  p_organization_id uuid,
  p_window_id uuid,
  p_expires_at timestamptz,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  window_id uuid,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window public.social_controlled_publish_windows;
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);

  if p_organization_id is null or p_window_id is null or p_expires_at is null then
    return query select 'invalid_input'::text, null::uuid, null::timestamptz;
    return;
  end if;
  if p_expires_at <= pg_catalog.now() then
    return query select 'invalid_input'::text, null::uuid, null::timestamptz;
    return;
  end if;

  select w.* into v_window
  from public.social_controlled_publish_windows as w
  where w.organization_id = p_organization_id
    and w.id = p_window_id
  for update;
  if not found then
    return query select 'not_found'::text, null::uuid, null::timestamptz;
    return;
  end if;
  if v_window.status is distinct from 'active' then
    return query select 'conflict'::text, v_window.id, v_window.expires_at;
    return;
  end if;

  update public.social_controlled_publish_windows as w
  set
    expires_at = p_expires_at,
    updated_at = pg_catalog.now()
  where w.id = v_window.id;

  perform private.insert_social_controlled_publish_window_event(
    p_organization_id,
    v_window.id,
    'window_authorized',
    v_window.publication_id,
    null,
    'platform_operator',
    p_actor_user_id,
    jsonb_build_object('expires_at', p_expires_at)
  );

  return query select 'success'::text, v_window.id, p_expires_at;
end;
$$;

revoke all on function public.operator_set_social_controlled_publish_window_expiry(uuid, uuid, timestamptz, uuid) from public;
revoke all on function public.operator_set_social_controlled_publish_window_expiry(uuid, uuid, timestamptz, uuid) from anon;
revoke all on function public.operator_set_social_controlled_publish_window_expiry(uuid, uuid, timestamptz, uuid) from authenticated;
grant execute on function public.operator_set_social_controlled_publish_window_expiry(uuid, uuid, timestamptz, uuid) to service_role;
