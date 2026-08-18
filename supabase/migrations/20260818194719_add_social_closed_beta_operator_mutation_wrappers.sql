-- SMM-R1-B: Platform operator mutation wrappers + cross-org read RPCs
-- Additive. No enrollment seeds. service_role + operator GUC only.
-- Arms zyntix.social_closed_beta_operator in-transaction (PostgREST-safe).

-- ---------------------------------------------------------------------------
-- Mutation wrappers (set operator GUC then transition)
-- ---------------------------------------------------------------------------

create or replace function public.operator_enroll_social_closed_beta_organization(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'enroll_approved', p_reason, p_actor_user_id
  );
end;
$$;

create or replace function public.operator_allow_social_closed_beta_publishing(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'allow_publishing', p_reason, p_actor_user_id
  );
end;
$$;

create or replace function public.operator_pause_social_closed_beta_enrollment(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'pause', p_reason, p_actor_user_id
  );
end;
$$;

create or replace function public.operator_resume_social_closed_beta_enrollment(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'resume', p_reason, p_actor_user_id
  );
end;
$$;

create or replace function public.operator_revoke_social_closed_beta_enrollment(
  p_organization_id uuid,
  p_reason text default null,
  p_actor_user_id uuid default null
)
returns table (
  result_code text,
  enrollment_id uuid,
  previous_status text,
  next_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  return query
  select *
  from private.transition_social_closed_beta_enrollment(
    p_organization_id, 'revoke', p_reason, p_actor_user_id
  );
end;
$$;

do $$
declare
  r record;
begin
  for r in
    select unnest(array[
      'operator_enroll_social_closed_beta_organization(uuid, text, uuid)',
      'operator_allow_social_closed_beta_publishing(uuid, text, uuid)',
      'operator_pause_social_closed_beta_enrollment(uuid, text, uuid)',
      'operator_resume_social_closed_beta_enrollment(uuid, text, uuid)',
      'operator_revoke_social_closed_beta_enrollment(uuid, text, uuid)'
    ]) as sig
  loop
    execute format('revoke all on function public.%s from public', r.sig);
    execute format('revoke all on function public.%s from anon', r.sig);
    execute format('revoke all on function public.%s from authenticated', r.sig);
    execute format('revoke all on function public.%s from service_role', r.sig);
    execute format('grant execute on function public.%s to service_role', r.sig);
  end loop;
end;
$$;

comment on function public.operator_enroll_social_closed_beta_organization(uuid, text, uuid) is
  'SMM-R1-B: service_role operator enroll wrapper. Arms operator GUC in-transaction. Not granted to authenticated.';

-- ---------------------------------------------------------------------------
-- Cross-org operator list (safe aggregates only)
-- ---------------------------------------------------------------------------

create or replace function public.operator_list_social_closed_beta_organizations()
returns table (
  organization_id uuid,
  organization_name text,
  organization_status text,
  enrollment_status text,
  enrollment_updated_at timestamptz,
  has_social_workspace boolean,
  instagram_connection_count integer,
  healthy_instagram_connection_count integer,
  credential_present_count integer,
  publish_image_capability_count integer,
  active_publication_count integer,
  queued_publication_count integer,
  has_owner_or_admin boolean,
  last_social_activity_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  perform private.assert_social_closed_beta_operator_context();

  return query
  select
    o.id,
    o.name,
    o.status,
    coalesce(e.status, 'not_enrolled')::text,
    e.updated_at,
    exists (
      select 1 from public.social_workspaces as w
      where w.organization_id = o.id and w.archived_at is null
    ),
    (
      select count(*)::integer
      from public.social_account_connections as c
      where c.organization_id = o.id
        and c.provider = 'instagram'
        and c.status = 'connected'
    ),
    (
      select count(*)::integer
      from public.social_account_connections as c
      where c.organization_id = o.id
        and c.provider = 'instagram'
        and c.status = 'connected'
        and c.health = 'healthy'
        and c.reauthorization_required_at is null
    ),
    (
      select count(*)::integer
      from public.social_account_connections as c
      where c.organization_id = o.id
        and c.provider = 'instagram'
        and c.status = 'connected'
        and c.credential_ref_id is not null
    ),
    (
      select count(*)::integer
      from public.social_account_connections as c
      where c.organization_id = o.id
        and c.provider = 'instagram'
        and c.status = 'connected'
        and exists (
          select 1
          from jsonb_array_elements_text(coalesce(c.capability_snapshot, '[]'::jsonb)) as cap(value)
          where cap.value = 'publish_image'
        )
    ),
    (
      select count(*)::integer
      from public.social_publications as p
      where p.organization_id = o.id
        and p.status in ('pending', 'queued', 'claimed', 'processing', 'failed_retryable')
    ),
    (
      select count(*)::integer
      from public.social_publications as p
      where p.organization_id = o.id
        and p.status = 'queued'
    ),
    exists (
      select 1 from public.organization_members as m
      where m.organization_id = o.id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
    ),
    greatest(
      e.updated_at,
      (
        select max(c.updated_at)
        from public.social_account_connections as c
        where c.organization_id = o.id
      ),
      (
        select max(p.updated_at)
        from public.social_publications as p
        where p.organization_id = o.id
      )
    )
  from public.organizations as o
  left join public.social_closed_beta_enrollments as e
    on e.organization_id = o.id
  where o.status = 'active'
  order by o.name asc, o.id asc;
end;
$$;

revoke all on function public.operator_list_social_closed_beta_organizations() from public;
revoke all on function public.operator_list_social_closed_beta_organizations() from anon;
revoke all on function public.operator_list_social_closed_beta_organizations() from authenticated;
revoke all on function public.operator_list_social_closed_beta_organizations() from service_role;
grant execute on function public.operator_list_social_closed_beta_organizations() to service_role;

-- ---------------------------------------------------------------------------
-- Organization detail + enrollment events
-- ---------------------------------------------------------------------------

create or replace function public.operator_get_social_closed_beta_organization(
  p_organization_id uuid
)
returns table (
  result_code text,
  organization_id uuid,
  organization_name text,
  organization_status text,
  enrollment_status text,
  status_before_pause text,
  enrollment_reason text,
  enrollment_created_at timestamptz,
  enrollment_updated_at timestamptz,
  approved_at timestamptz,
  publishing_allowed_at timestamptz,
  paused_at timestamptz,
  revoked_at timestamptz,
  has_social_workspace boolean,
  instagram_connection_count integer,
  healthy_instagram_connection_count integer,
  credential_present_count integer,
  publish_image_capability_count integer,
  reauthorization_required_count integer,
  active_publication_count integer,
  queued_publication_count integer,
  succeeded_publication_count integer,
  has_owner_or_admin boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org public.organizations;
  v_enr public.social_closed_beta_enrollments;
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  perform private.assert_social_closed_beta_operator_context();

  if p_organization_id is null then
    return query select
      'invalid_input'::text, null::uuid, null::text, null::text, null::text, null::text,
      null::text, null::timestamptz, null::timestamptz, null::timestamptz, null::timestamptz,
      null::timestamptz, null::timestamptz, false, 0, 0, 0, 0, 0, 0, 0, 0, false;
    return;
  end if;

  select * into v_org from public.organizations as o where o.id = p_organization_id;
  if not found then
    return query select
      'not_found'::text, null::uuid, null::text, null::text, null::text, null::text,
      null::text, null::timestamptz, null::timestamptz, null::timestamptz, null::timestamptz,
      null::timestamptz, null::timestamptz, false, 0, 0, 0, 0, 0, 0, 0, 0, false;
    return;
  end if;

  select * into v_enr
  from public.social_closed_beta_enrollments as e
  where e.organization_id = p_organization_id;

  return query select
    'success'::text,
    v_org.id,
    v_org.name,
    v_org.status,
    coalesce(v_enr.status, 'not_enrolled')::text,
    v_enr.status_before_pause,
    v_enr.reason,
    v_enr.created_at,
    v_enr.updated_at,
    v_enr.approved_at,
    v_enr.publishing_allowed_at,
    v_enr.paused_at,
    v_enr.revoked_at,
    exists (
      select 1 from public.social_workspaces as w
      where w.organization_id = v_org.id and w.archived_at is null
    ),
    (
      select count(*)::integer from public.social_account_connections as c
      where c.organization_id = v_org.id and c.provider = 'instagram' and c.status = 'connected'
    ),
    (
      select count(*)::integer from public.social_account_connections as c
      where c.organization_id = v_org.id and c.provider = 'instagram' and c.status = 'connected'
        and c.health = 'healthy' and c.reauthorization_required_at is null
    ),
    (
      select count(*)::integer from public.social_account_connections as c
      where c.organization_id = v_org.id and c.provider = 'instagram' and c.status = 'connected'
        and c.credential_ref_id is not null
    ),
    (
      select count(*)::integer from public.social_account_connections as c
      where c.organization_id = v_org.id and c.provider = 'instagram' and c.status = 'connected'
        and exists (
          select 1 from jsonb_array_elements_text(coalesce(c.capability_snapshot, '[]'::jsonb)) as cap(value)
          where cap.value = 'publish_image'
        )
    ),
    (
      select count(*)::integer from public.social_account_connections as c
      where c.organization_id = v_org.id and c.provider = 'instagram'
        and c.reauthorization_required_at is not null
    ),
    (
      select count(*)::integer from public.social_publications as p
      where p.organization_id = v_org.id
        and p.status in ('pending', 'queued', 'claimed', 'processing', 'failed_retryable')
    ),
    (
      select count(*)::integer from public.social_publications as p
      where p.organization_id = v_org.id and p.status = 'queued'
    ),
    (
      select count(*)::integer from public.social_publications as p
      where p.organization_id = v_org.id and p.status = 'succeeded'
    ),
    exists (
      select 1 from public.organization_members as m
      where m.organization_id = v_org.id and m.status = 'active' and m.role in ('owner', 'admin')
    );
end;
$$;

revoke all on function public.operator_get_social_closed_beta_organization(uuid) from public;
revoke all on function public.operator_get_social_closed_beta_organization(uuid) from anon;
revoke all on function public.operator_get_social_closed_beta_organization(uuid) from authenticated;
revoke all on function public.operator_get_social_closed_beta_organization(uuid) from service_role;
grant execute on function public.operator_get_social_closed_beta_organization(uuid) to service_role;

create or replace function public.operator_list_social_closed_beta_enrollment_events(
  p_organization_id uuid
)
returns table (
  result_code text,
  event_id uuid,
  event_type text,
  previous_status text,
  next_status text,
  actor_source text,
  actor_user_id uuid,
  reason text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform set_config('zyntix.social_closed_beta_operator', 'on', true);
  perform private.assert_social_closed_beta_operator_context();

  if p_organization_id is null then
    return query select
      'invalid_input'::text, null::uuid, null::text, null::text, null::text,
      null::text, null::uuid, null::text, null::timestamptz;
    return;
  end if;

  if not exists (
    select 1 from public.organizations as o where o.id = p_organization_id
  ) then
    return query select
      'not_found'::text, null::uuid, null::text, null::text, null::text,
      null::text, null::uuid, null::text, null::timestamptz;
    return;
  end if;

  return query
  select
    'success'::text,
    ev.id,
    ev.event_type,
    ev.previous_status,
    ev.next_status,
    ev.actor_source,
    ev.actor_user_id,
    ev.reason,
    ev.created_at
  from public.social_closed_beta_enrollment_events as ev
  where ev.organization_id = p_organization_id
  order by ev.created_at desc, ev.id desc
  limit 100;
end;
$$;

revoke all on function public.operator_list_social_closed_beta_enrollment_events(uuid) from public;
revoke all on function public.operator_list_social_closed_beta_enrollment_events(uuid) from anon;
revoke all on function public.operator_list_social_closed_beta_enrollment_events(uuid) from authenticated;
revoke all on function public.operator_list_social_closed_beta_enrollment_events(uuid) from service_role;
grant execute on function public.operator_list_social_closed_beta_enrollment_events(uuid) to service_role;
