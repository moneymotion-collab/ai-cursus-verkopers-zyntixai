-- ONBOARDING-1A — atomic first operating-model assignment.
--
-- The browser submits only one of four product-facing operating-model IDs.
-- This service-role RPC owns the mapping to TAX/CTX identifiers, verifies the
-- authenticated actor's active Owner/Admin membership, and writes only to the
-- existing ORG-CONTEXT model. Existing or ambiguous Activity state is never
-- overwritten. Repeating the same successful request is idempotent.

create or replace function public.assign_organization_operating_model(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_operating_model text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_status text;
  v_actor_member_id uuid;
  v_activity_count integer;
  v_existing_activity_id uuid;
  v_existing_assignment_id uuid;
  v_existing_pack_key text;
  v_target_kind text;
  v_target_key text;
  v_pack_key text;
  v_display_name text;
  v_target_id uuid;
  v_context_version_id uuid;
  v_activity_id uuid;
  v_assignment_id uuid;
  v_event_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'Operating-model assignment requires the privileged database role'
    );
  end if;

  if p_organization_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_NOT_FOUND',
      'message', 'Organization is required'
    );
  end if;

  if p_actor_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_AUTHORIZED',
      'message', 'An authenticated Owner or Admin is required'
    );
  end if;

  if p_operating_model not in (
    'course_seller',
    'service',
    'field_operations',
    'product_operations'
  ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'INVALID_OPERATING_MODEL',
      'message', 'Select an available operating model'
    );
  end if;

  select
    case p_operating_model
      when 'course_seller' then 'niche'
      else 'foundation'
    end,
    case p_operating_model
      when 'course_seller' then 'online-course-business'
      when 'service' then 'service'
      when 'field_operations' then 'field-operations'
      when 'product_operations' then 'product-operations'
    end,
    case p_operating_model
      when 'course_seller' then 'niche.online-course-business'
      when 'service' then 'foundation.service'
      when 'field_operations' then 'foundation.field-operations'
      when 'product_operations' then 'foundation.product-operations'
    end,
    case p_operating_model
      when 'course_seller' then 'Courses & Coaching'
      when 'service' then 'Agency & Business Services'
      when 'field_operations' then 'Construction & Field Service'
      when 'product_operations' then 'E-commerce & Product Operations'
    end
  into v_target_kind, v_target_key, v_pack_key, v_display_name;

  perform pg_catalog.pg_advisory_xact_lock(
    872011,
    pg_catalog.hashtext(p_organization_id::text)
  );

  select o.status
    into v_org_status
  from public.organizations as o
  where o.id = p_organization_id;

  if v_org_status is null or v_org_status is distinct from 'active' then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_NOT_FOUND',
      'message', 'Organization was not found or is unavailable'
    );
  end if;

  select om.id
    into v_actor_member_id
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.user_id = p_actor_user_id
    and om.status = 'active'
    and om.role in ('owner', 'admin')
  limit 1;

  if v_actor_member_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'NOT_AUTHORIZED',
      'message', 'An active Owner or Admin membership is required'
    );
  end if;

  select
    a.id,
    c.id,
    p.pack_key
  into
    v_existing_activity_id,
    v_existing_assignment_id,
    v_existing_pack_key
  from public.organization_business_activities as a
  inner join public.organization_context_assignments as c
    on c.organization_id = a.organization_id
    and c.business_activity_id = a.id
    and c.status = 'active'
  inner join public.context_pack_versions as v
    on v.id = c.context_pack_version_id
  inner join public.context_packs as p
    on p.id = v.pack_id
  where a.organization_id = p_organization_id
    and a.status = 'active'
    and a.is_primary = true
  limit 1;

  if v_existing_activity_id is not null then
    if v_existing_pack_key = v_pack_key
      or (
        p_operating_model = 'course_seller'
        and v_existing_pack_key = 'foundation.knowledge'
      )
    then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'organization_id', p_organization_id,
        'activity_id', v_existing_activity_id,
        'assignment_id', v_existing_assignment_id,
        'operating_model', p_operating_model,
        'resolved_pack', v_existing_pack_key
      );
    end if;

    return jsonb_build_object(
      'ok', false,
      'code', 'ALREADY_CONFIGURED',
      'message', 'This organization already has an operating model'
    );
  end if;

  select count(*)
    into v_activity_count
  from public.organization_business_activities as a
  where a.organization_id = p_organization_id;

  if v_activity_count > 0 then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONFIGURATION_REVIEW_REQUIRED',
      'message', 'Existing organization configuration requires review'
    );
  end if;

  if v_target_kind = 'niche' then
    select n.id
      into v_target_id
    from public.taxonomy_niches as n
    where n.key = v_target_key
      and n.lifecycle_status = 'active';
  else
    select f.id
      into v_target_id
    from public.taxonomy_foundations as f
    where f.key = v_target_key
      and f.lifecycle_status = 'active';
  end if;

  if v_target_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONFIGURATION_UNAVAILABLE',
      'message', 'The selected operating model is not available'
    );
  end if;

  select v.id
    into v_context_version_id
  from public.context_packs as p
  inner join public.context_pack_versions as v
    on v.pack_id = p.id
  where p.pack_key = v_pack_key
    and p.pack_kind = v_target_kind
    and p.lifecycle_status = 'active'
    and v.publication_status = 'published'
    and exists (
      select 1
      from public.context_pack_readiness as r
      where r.version_id = v.id
        and r.readiness_status in (
          'context_ready',
          'beta_supported',
          'production_verified'
        )
    )
    and (
      (v_target_kind = 'niche' and p.niche_id = v_target_id)
      or (v_target_kind = 'foundation' and p.foundation_id = v_target_id)
    )
  order by v.version_number desc
  limit 1;

  if v_context_version_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONFIGURATION_UNAVAILABLE',
      'message', 'The selected operating model is not available'
    );
  end if;

  insert into public.organization_business_activities (
    organization_id,
    activity_key,
    display_name,
    status,
    is_primary,
    classification_kind,
    foundation_id,
    niche_id
  )
  values (
    p_organization_id,
    'primary_operating_model',
    v_display_name,
    'active',
    true,
    v_target_kind,
    case when v_target_kind = 'foundation' then v_target_id else null end,
    case when v_target_kind = 'niche' then v_target_id else null end
  )
  returning id into v_activity_id;

  insert into public.organization_context_assignment_events (
    organization_id,
    business_activity_id,
    assignment_id,
    event_type,
    actor_user_id,
    actor_member_id,
    source,
    reason,
    payload
  )
  values (
    p_organization_id,
    v_activity_id,
    null,
    'business_activity_created',
    p_actor_user_id,
    v_actor_member_id,
    'onboarding',
    'ONBOARDING-1A operating-model selection',
    jsonb_build_object(
      'activity_key', 'primary_operating_model',
      'display_name', v_display_name,
      'status', 'active',
      'is_primary', true,
      'classification_kind', v_target_kind,
      'taxonomy_target_key', v_target_key,
      'operating_model', p_operating_model
    )
  );

  insert into public.organization_context_assignments (
    organization_id,
    business_activity_id,
    context_pack_version_id,
    status,
    source,
    actor_user_id,
    actor_member_id,
    reason
  )
  values (
    p_organization_id,
    v_activity_id,
    v_context_version_id,
    'active',
    'onboarding',
    p_actor_user_id,
    v_actor_member_id,
    'ONBOARDING-1A operating-model selection'
  )
  returning id into v_assignment_id;

  insert into public.organization_context_assignment_events (
    organization_id,
    business_activity_id,
    assignment_id,
    event_type,
    actor_user_id,
    actor_member_id,
    source,
    reason,
    payload
  )
  values (
    p_organization_id,
    v_activity_id,
    v_assignment_id,
    'context_version_assigned',
    p_actor_user_id,
    v_actor_member_id,
    'onboarding',
    'ONBOARDING-1A operating-model selection',
    jsonb_build_object(
      'context_pack_version_id', v_context_version_id,
      'pack_key', v_pack_key,
      'operating_model', p_operating_model
    )
  )
  returning id into v_event_id;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'organization_id', p_organization_id,
    'activity_id', v_activity_id,
    'assignment_id', v_assignment_id,
    'event_id', v_event_id,
    'operating_model', p_operating_model,
    'resolved_pack', v_pack_key
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONFIGURATION_REVIEW_REQUIRED',
      'message', 'Existing organization configuration requires review'
    );
  when foreign_key_violation or check_violation then
    return jsonb_build_object(
      'ok', false,
      'code', 'ASSIGNMENT_FAILED',
      'message', 'The operating model could not be saved'
    );
end;
$$;

comment on function public.assign_organization_operating_model(uuid, uuid, text) is
  'ONBOARDING-1A first-assignment-only operating-model writer. The four-value input is mapped server-side to TAX/CTX. Active Owner/Admin membership is mandatory. Existing configuration is never switched.';

revoke all on function public.assign_organization_operating_model(uuid, uuid, text) from public;
revoke all on function public.assign_organization_operating_model(uuid, uuid, text) from anon;
revoke all on function public.assign_organization_operating_model(uuid, uuid, text) from authenticated;
revoke all on function public.assign_organization_operating_model(uuid, uuid, text) from service_role;
grant execute on function public.assign_organization_operating_model(uuid, uuid, text) to service_role;
