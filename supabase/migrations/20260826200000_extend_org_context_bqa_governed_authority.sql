-- ZyntixAI ORG-CONTEXT-1X-B — additive BQA governed mutation authority.
--
-- Does not edit 1B/1C applied migrations. No backfill. No Production apply in 1X-B.
-- One canonical state-transition implementation. Two fixed-source wrappers.
-- p_payload.source is never trusted. service_role is executor only.
-- Future cross-domain handoff lock order: 872011 (this writer) then 872012 (BQA).
-- Nested calls share the caller transaction. jsonb ok=false does not roll back
-- prior DML; a future outer orchestrator must RAISE to abort.

alter table public.organization_context_assignment_events
  drop constraint organization_context_assignment_events_event_type_check;

alter table public.organization_context_assignment_events
  add constraint organization_context_assignment_events_event_type_check
  check (
    event_type in (
      'business_activity_created',
      'business_activity_classified',
      'business_activity_activated',
      'context_version_assigned',
      'context_version_changed',
      'primary_activity_changed',
      'business_activity_archived'
    )
  );

create or replace function private.apply_organization_context_mutation(
  p_source text,
  p_operation text,
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_status text;
  v_actor_member_id uuid;
  v_activity_id uuid;
  v_assignment_id uuid;
  v_event_id uuid;
  v_reason text;
  v_display_name text;
  v_activity_key text;
  v_status text;
  v_is_primary boolean;
  v_kind text;
  v_target_id uuid;
  v_foundation_id uuid;
  v_industry_id uuid;
  v_niche_id uuid;
  v_specialization_id uuid;
  v_deep_specialization_id uuid;
  v_tax_status text;
  v_activity public.organization_business_activities%rowtype;
  v_existing_primary public.organization_business_activities%rowtype;
  v_active public.organization_context_assignments%rowtype;
  v_version_id uuid;
  v_publication_status text;
  v_pack_kind text;
  v_pack_foundation_id uuid;
  v_pack_industry_id uuid;
  v_pack_niche_id uuid;
  v_pack_specialization_id uuid;
  v_pack_deep_specialization_id uuid;
  v_pack_target uuid;
  v_activity_target uuid;
  v_now timestamptz := pg_catalog.now();
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'ORG-CONTEXT mutation requires the privileged database role',
      'operation', p_operation
    );
  end if;

  if p_source is distinct from 'platform_operator'
    and p_source is distinct from 'bqa_confirmed'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'Unknown ORG-CONTEXT mutation source',
      'operation', p_operation
    );
  end if;

  if p_organization_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORG_NOT_FOUND',
      'message', 'organizationId is required',
      'operation', p_operation
    );
  end if;

  if p_actor_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', case
        when p_source = 'bqa_confirmed' then 'ACTOR_NOT_AUTHORIZED'
        else 'UNAUTHORIZED'
      end,
      'message', case
        when p_source = 'bqa_confirmed' then 'Authenticated Owner or Admin actor is required'
        else 'Authenticated platform operator identity is required'
      end,
      'operation', p_operation
    );
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    return jsonb_build_object(
      'ok', false,
      'code', 'MUTATION_FAILED',
      'message', 'Mutation payload must be a JSON object',
      'operation', p_operation
    );
  end if;

  if p_source = 'bqa_confirmed'
    and p_operation not in (
      'classify_activity',
      'activate_activity',
      'assign_context_version'
    )
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'FORBIDDEN_OPERATION',
      'message', 'Operation is not allowed for bqa_confirmed',
      'operation', p_operation
    );
  end if;

  if p_operation not in (
    'create_activity',
    'classify_activity',
    'activate_activity',
    'set_primary',
    'assign_context_version',
    'change_context_version',
    'archive_activity'
  ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'MUTATION_FAILED',
      'message', 'Unknown ORG-CONTEXT platform mutation operation',
      'operation', p_operation
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872011,
    pg_catalog.hashtext(p_organization_id::text)
  );

  select o.status
    into v_org_status
  from public.organizations as o
  where o.id = p_organization_id;

  if v_org_status is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORG_NOT_FOUND',
      'message', 'Organization not found',
      'operation', p_operation
    );
  end if;

  if v_org_status is distinct from 'active' then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORG_NOT_FOUND',
      'message', 'Organization is not active',
      'operation', p_operation
    );
  end if;

  if p_source = 'bqa_confirmed' then
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
        'code', 'ACTOR_NOT_AUTHORIZED',
        'message', 'bqa_confirmed requires an active Owner or Admin membership',
        'operation', p_operation
      );
    end if;
  else
    select om.id
      into v_actor_member_id
    from public.organization_members as om
    where om.organization_id = p_organization_id
      and om.user_id = p_actor_user_id
      and om.status = 'active'
    limit 1;
  end if;

  v_reason := nullif(btrim(coalesce(p_payload->>'reason', '')), '');

  if p_operation = 'create_activity' then
    v_display_name := nullif(btrim(coalesce(p_payload->>'display_name', '')), '');
    v_activity_key := nullif(btrim(coalesce(p_payload->>'activity_key', '')), '');
    v_status := coalesce(nullif(p_payload->>'status', ''), 'draft');
    v_is_primary := coalesce((p_payload->>'is_primary')::boolean, false);
    v_kind := nullif(p_payload->>'classification_kind', '');
    v_foundation_id := nullif(p_payload->>'foundation_id', '')::uuid;
    v_industry_id := nullif(p_payload->>'industry_id', '')::uuid;
    v_niche_id := nullif(p_payload->>'niche_id', '')::uuid;
    v_specialization_id := nullif(p_payload->>'specialization_id', '')::uuid;
    v_deep_specialization_id := nullif(p_payload->>'deep_specialization_id', '')::uuid;

    if v_kind is not null then
      v_target_id := case v_kind
        when 'foundation' then v_foundation_id
        when 'industry' then v_industry_id
        when 'niche' then v_niche_id
        when 'specialization' then v_specialization_id
        when 'deep_specialization' then v_deep_specialization_id
        else null
      end;
      if v_target_id is null then
        return jsonb_build_object(
          'ok', false,
          'code', 'CLASSIFICATION_NOT_FOUND',
          'message', 'Classification target is required',
          'operation', p_operation
        );
      end if;
      if v_kind = 'foundation' then
        select tf.lifecycle_status into v_tax_status from public.taxonomy_foundations as tf where tf.id = v_target_id;
      elsif v_kind = 'industry' then
        select ti.lifecycle_status into v_tax_status from public.taxonomy_industries as ti where ti.id = v_target_id;
      elsif v_kind = 'niche' then
        select tn.lifecycle_status into v_tax_status from public.taxonomy_niches as tn where tn.id = v_target_id;
      elsif v_kind = 'specialization' then
        select ts.lifecycle_status into v_tax_status from public.taxonomy_specializations as ts where ts.id = v_target_id;
      elsif v_kind = 'deep_specialization' then
        select td.lifecycle_status into v_tax_status from public.taxonomy_deep_specializations as td where td.id = v_target_id;
      else
        return jsonb_build_object(
          'ok', false,
          'code', 'CLASSIFICATION_NOT_FOUND',
          'message', 'Unknown classification kind',
          'operation', p_operation
        );
      end if;
      if v_tax_status is null or v_tax_status is distinct from 'active' then
        return jsonb_build_object(
          'ok', false,
          'code', 'CLASSIFICATION_NOT_FOUND',
          'message', 'TAX classification target is missing or not active',
          'operation', p_operation
        );
      end if;
    end if;

    if v_is_primary then
      update public.organization_business_activities as a
        set is_primary = false
      where a.organization_id = p_organization_id
        and a.is_primary = true;
    end if;

    insert into public.organization_business_activities (
      organization_id,
      activity_key,
      display_name,
      status,
      is_primary,
      classification_kind,
      foundation_id,
      industry_id,
      niche_id,
      specialization_id,
      deep_specialization_id
    )
    values (
      p_organization_id,
      v_activity_key,
      v_display_name,
      v_status,
      v_is_primary,
      v_kind,
      v_foundation_id,
      v_industry_id,
      v_niche_id,
      v_specialization_id,
      v_deep_specialization_id
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
      p_source,
      v_reason,
      jsonb_build_object(
        'display_name', v_display_name,
        'activity_key', v_activity_key,
        'status', v_status,
        'is_primary', v_is_primary,
        'classification_kind', v_kind,
        'foundation_id', v_foundation_id,
        'industry_id', v_industry_id,
        'niche_id', v_niche_id,
        'specialization_id', v_specialization_id,
        'deep_specialization_id', v_deep_specialization_id
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'activity_id', v_activity_id,
      'assignment_id', null,
      'event_id', v_event_id,
      'event_type', 'business_activity_created',
      'operation', p_operation
    );
  end if;

  v_activity_id := nullif(p_payload->>'activity_id', '')::uuid;
  if v_activity_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ACTIVITY_NOT_FOUND',
      'message', 'activityId is required',
      'operation', p_operation
    );
  end if;

  select a.*
    into v_activity
  from public.organization_business_activities as a
  where a.organization_id = p_organization_id
    and a.id = v_activity_id;

  if not found then
    if exists (
      select 1
      from public.organization_business_activities as foreign_activity
      where foreign_activity.id = v_activity_id
    ) then
      return jsonb_build_object(
        'ok', false,
        'code', 'ACTIVITY_NOT_OWNED_BY_ORG',
        'message', 'Business Activity is not owned by the requested Organization',
        'operation', p_operation
      );
    end if;
    return jsonb_build_object(
      'ok', false,
      'code', 'ACTIVITY_NOT_FOUND',
      'message', 'Business Activity not found',
      'operation', p_operation
    );
  end if;

  if p_operation = 'classify_activity' then
    if v_activity.status = 'archived' then
      return jsonb_build_object(
        'ok', false,
        'code', 'MUTATION_FAILED',
        'message', 'Archived Business Activity cannot be reclassified',
        'operation', p_operation
      );
    end if;

    v_kind := nullif(p_payload->>'classification_kind', '');
    v_target_id := nullif(p_payload->>'target_id', '')::uuid;
    if v_kind is null or v_target_id is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'CLASSIFICATION_NOT_FOUND',
        'message', 'Classification kind and target are required',
        'operation', p_operation
      );
    end if;

    v_foundation_id := case when v_kind = 'foundation' then v_target_id else null end;
    v_industry_id := case when v_kind = 'industry' then v_target_id else null end;
    v_niche_id := case when v_kind = 'niche' then v_target_id else null end;
    v_specialization_id := case when v_kind = 'specialization' then v_target_id else null end;
    v_deep_specialization_id := case when v_kind = 'deep_specialization' then v_target_id else null end;

    if v_kind = 'foundation' then
      select tf.lifecycle_status into v_tax_status from public.taxonomy_foundations as tf where tf.id = v_target_id;
    elsif v_kind = 'industry' then
      select ti.lifecycle_status into v_tax_status from public.taxonomy_industries as ti where ti.id = v_target_id;
    elsif v_kind = 'niche' then
      select tn.lifecycle_status into v_tax_status from public.taxonomy_niches as tn where tn.id = v_target_id;
    elsif v_kind = 'specialization' then
      select ts.lifecycle_status into v_tax_status from public.taxonomy_specializations as ts where ts.id = v_target_id;
    elsif v_kind = 'deep_specialization' then
      select td.lifecycle_status into v_tax_status from public.taxonomy_deep_specializations as td where td.id = v_target_id;
    else
      return jsonb_build_object(
        'ok', false,
        'code', 'CLASSIFICATION_NOT_FOUND',
        'message', 'Unknown classification kind',
        'operation', p_operation
      );
    end if;

    if v_tax_status is null or v_tax_status is distinct from 'active' then
      return jsonb_build_object(
        'ok', false,
        'code', 'CLASSIFICATION_NOT_FOUND',
        'message', 'TAX classification target is missing or not active',
        'operation', p_operation
      );
    end if;

    if
      v_activity.classification_kind is not distinct from v_kind
      and v_activity.foundation_id is not distinct from v_foundation_id
      and v_activity.industry_id is not distinct from v_industry_id
      and v_activity.niche_id is not distinct from v_niche_id
      and v_activity.specialization_id is not distinct from v_specialization_id
      and v_activity.deep_specialization_id is not distinct from v_deep_specialization_id
    then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'activity_id', v_activity.id,
        'assignment_id', null,
        'event_id', null,
        'event_type', null,
        'operation', p_operation
      );
    end if;

    if p_source = 'bqa_confirmed' and v_activity.classification_kind is not null then
      return jsonb_build_object(
        'ok', false,
        'code', 'ACTIVITY_CLASSIFICATION_MISMATCH',
        'message', 'bqa_confirmed cannot overwrite an existing Activity classification',
        'operation', p_operation
      );
    end if;

    select c.*
      into v_active
    from public.organization_context_assignments as c
    where c.organization_id = p_organization_id
      and c.business_activity_id = v_activity.id
      and c.status = 'active';

    if found then
      return jsonb_build_object(
        'ok', false,
        'code', 'CONTEXT_INCOMPATIBLE',
        'message', 'Cannot reclassify a Business Activity that already has an active Context pin',
        'operation', p_operation
      );
    end if;

    update public.organization_business_activities as a
      set
        classification_kind = v_kind,
        foundation_id = v_foundation_id,
        industry_id = v_industry_id,
        niche_id = v_niche_id,
        specialization_id = v_specialization_id,
        deep_specialization_id = v_deep_specialization_id
    where a.organization_id = p_organization_id
      and a.id = v_activity.id;

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
      v_activity.id,
      null,
      'business_activity_classified',
      p_actor_user_id,
      v_actor_member_id,
      p_source,
      v_reason,
      jsonb_build_object(
        'old_classification_kind', v_activity.classification_kind,
        'new_classification_kind', v_kind,
        'target_id', v_target_id
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'activity_id', v_activity.id,
      'assignment_id', null,
      'event_id', v_event_id,
      'event_type', 'business_activity_classified',
      'operation', p_operation
    );
  end if;

  if p_operation = 'activate_activity' then
    if v_activity.status = 'archived' then
      return jsonb_build_object(
        'ok', false,
        'code', 'ACTIVITY_ARCHIVED',
        'message', 'Archived Business Activity cannot be activated',
        'operation', p_operation
      );
    end if;

    if v_activity.status = 'active' then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'activity_id', v_activity.id,
        'assignment_id', null,
        'event_id', null,
        'event_type', null,
        'operation', p_operation
      );
    end if;

    if v_activity.classification_kind is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'ACTIVITY_NOT_CLASSIFIED',
        'message', 'Unclassified Business Activity cannot be activated',
        'operation', p_operation
      );
    end if;

    update public.organization_business_activities as a
      set status = 'active'
    where a.organization_id = p_organization_id
      and a.id = v_activity.id;

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
      v_activity.id,
      null,
      'business_activity_activated',
      p_actor_user_id,
      v_actor_member_id,
      p_source,
      v_reason,
      jsonb_build_object(
        'old_status', v_activity.status,
        'new_status', 'active'
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'activity_id', v_activity.id,
      'assignment_id', null,
      'event_id', v_event_id,
      'event_type', 'business_activity_activated',
      'operation', p_operation
    );
  end if;

  if p_operation = 'set_primary' then
    if v_activity.status is distinct from 'active' then
      return jsonb_build_object(
        'ok', false,
        'code', 'PRIMARY_ACTIVITY_CONFLICT',
        'message', 'Primary Business Activity must be active',
        'operation', p_operation
      );
    end if;

    if v_activity.is_primary then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'activity_id', v_activity.id,
        'assignment_id', null,
        'event_id', null,
        'event_type', null,
        'operation', p_operation
      );
    end if;

    select a.*
      into v_existing_primary
    from public.organization_business_activities as a
    where a.organization_id = p_organization_id
      and a.is_primary = true
      and a.status = 'active'
    limit 1;

    update public.organization_business_activities as a
      set is_primary = false
    where a.organization_id = p_organization_id
      and a.is_primary = true
      and a.id is distinct from v_activity.id;

    update public.organization_business_activities as a
      set is_primary = true
    where a.organization_id = p_organization_id
      and a.id = v_activity.id;

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
      v_activity.id,
      null,
      'primary_activity_changed',
      p_actor_user_id,
      v_actor_member_id,
      p_source,
      v_reason,
      jsonb_build_object(
        'old_primary_activity_id', v_existing_primary.id,
        'new_primary_activity_id', v_activity.id
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'activity_id', v_activity.id,
      'assignment_id', null,
      'event_id', v_event_id,
      'event_type', 'primary_activity_changed',
      'operation', p_operation
    );
  end if;

  if p_operation = 'archive_activity' then
    if v_activity.status = 'archived' then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'activity_id', v_activity.id,
        'assignment_id', null,
        'event_id', null,
        'event_type', null,
        'operation', p_operation
      );
    end if;

    select c.*
      into v_active
    from public.organization_context_assignments as c
    where c.organization_id = p_organization_id
      and c.business_activity_id = v_activity.id
      and c.status = 'active';

    if found then
      update public.organization_context_assignments as c
        set
          status = 'superseded',
          superseded_at = v_now
      where c.organization_id = p_organization_id
        and c.id = v_active.id
        and c.status = 'active';
      v_assignment_id := v_active.id;
    end if;

    update public.organization_business_activities as a
      set
        status = 'archived',
        is_primary = false
    where a.organization_id = p_organization_id
      and a.id = v_activity.id;

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
      v_activity.id,
      v_assignment_id,
      'business_activity_archived',
      p_actor_user_id,
      v_actor_member_id,
      p_source,
      v_reason,
      jsonb_build_object(
        'superseded_assignment_id', v_assignment_id,
        'was_primary', v_activity.is_primary
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'activity_id', v_activity.id,
      'assignment_id', v_assignment_id,
      'event_id', v_event_id,
      'event_type', 'business_activity_archived',
      'operation', p_operation
    );
  end if;

  v_version_id := nullif(p_payload->>'context_pack_version_id', '')::uuid;
  if v_version_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONTEXT_NOT_AVAILABLE',
      'message', 'contextPackVersionId is required',
      'operation', p_operation
    );
  end if;

  if v_activity.classification_kind is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONTEXT_VERSION_NOT_ASSIGNABLE',
      'message', 'Unclassified Business Activity cannot receive a Context pin',
      'operation', p_operation
    );
  end if;

  select
      v.publication_status,
      p.pack_kind,
      p.foundation_id,
      p.industry_id,
      p.niche_id,
      p.specialization_id,
      p.deep_specialization_id
    into
      v_publication_status,
      v_pack_kind,
      v_pack_foundation_id,
      v_pack_industry_id,
      v_pack_niche_id,
      v_pack_specialization_id,
      v_pack_deep_specialization_id
  from public.context_pack_versions as v
  inner join public.context_packs as p
    on p.id = v.pack_id
  where v.id = v_version_id;

  if v_publication_status is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONTEXT_NOT_AVAILABLE',
      'message', 'Context pack version not found',
      'operation', p_operation
    );
  end if;

  if v_publication_status is distinct from 'published' then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONTEXT_VERSION_NOT_ASSIGNABLE',
      'message', 'New Context pin requires a published version',
      'operation', p_operation
    );
  end if;

  v_activity_target := case v_activity.classification_kind
    when 'foundation' then v_activity.foundation_id
    when 'industry' then v_activity.industry_id
    when 'niche' then v_activity.niche_id
    when 'specialization' then v_activity.specialization_id
    when 'deep_specialization' then v_activity.deep_specialization_id
    else null
  end;

  v_pack_target := case v_pack_kind
    when 'foundation' then v_pack_foundation_id
    when 'industry' then v_pack_industry_id
    when 'niche' then v_pack_niche_id
    when 'specialization' then v_pack_specialization_id
    when 'deep_specialization' then v_pack_deep_specialization_id
    else null
  end;

  if
    v_pack_kind is distinct from v_activity.classification_kind
    or v_activity_target is null
    or v_pack_target is null
    or v_activity_target is distinct from v_pack_target
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONTEXT_INCOMPATIBLE',
      'message', 'Context pack TAX target does not exactly match activity classification',
      'operation', p_operation
    );
  end if;

  select c.*
    into v_active
  from public.organization_context_assignments as c
  where c.organization_id = p_organization_id
    and c.business_activity_id = v_activity.id
    and c.status = 'active';

  if p_operation = 'assign_context_version' then
    if found then
      if v_active.context_pack_version_id = v_version_id then
        return jsonb_build_object(
          'ok', true,
          'idempotent', true,
          'activity_id', v_activity.id,
          'assignment_id', v_active.id,
          'event_id', null,
          'event_type', null,
          'operation', p_operation
        );
      end if;
      return jsonb_build_object(
        'ok', false,
        'code', case
          when p_source = 'bqa_confirmed' then 'CONTEXT_REPIN_REQUIRED'
          else 'MUTATION_FAILED'
        end,
        'message', 'Activity already has a different active Context pin',
        'operation', p_operation
      );
    end if;

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
      v_activity.id,
      v_version_id,
      'active',
      p_source,
      p_actor_user_id,
      v_actor_member_id,
      v_reason
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
      v_activity.id,
      v_assignment_id,
      'context_version_assigned',
      p_actor_user_id,
      v_actor_member_id,
      p_source,
      v_reason,
      jsonb_build_object(
        'context_pack_version_id', v_version_id,
        'pack_kind', v_pack_kind
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'activity_id', v_activity.id,
      'assignment_id', v_assignment_id,
      'event_id', v_event_id,
      'event_type', 'context_version_assigned',
      'operation', p_operation
    );
  end if;

  if p_operation = 'change_context_version' then
    if not found then
      return jsonb_build_object(
        'ok', false,
        'code', 'MUTATION_FAILED',
        'message', 'No active Context pin exists to change',
        'operation', p_operation
      );
    end if;

    if v_active.context_pack_version_id = v_version_id then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'activity_id', v_activity.id,
        'assignment_id', v_active.id,
        'event_id', null,
        'event_type', null,
        'operation', p_operation
      );
    end if;

    update public.organization_context_assignments as c
      set
        status = 'superseded',
        superseded_at = v_now
    where c.organization_id = p_organization_id
      and c.id = v_active.id
      and c.status = 'active';

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
      v_activity.id,
      v_version_id,
      'active',
      p_source,
      p_actor_user_id,
      v_actor_member_id,
      v_reason
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
      v_activity.id,
      v_assignment_id,
      'context_version_changed',
      p_actor_user_id,
      v_actor_member_id,
      p_source,
      v_reason,
      jsonb_build_object(
        'old_assignment_id', v_active.id,
        'old_context_pack_version_id', v_active.context_pack_version_id,
        'new_context_pack_version_id', v_version_id
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'activity_id', v_activity.id,
      'assignment_id', v_assignment_id,
      'event_id', v_event_id,
      'event_type', 'context_version_changed',
      'operation', p_operation
    );
  end if;

  return jsonb_build_object(
    'ok', false,
    'code', 'MUTATION_FAILED',
    'message', 'ORG-CONTEXT mutation was not applied',
    'operation', p_operation
  );
exception
  when unique_violation then
    return jsonb_build_object(
      'ok', false,
      'code', 'MUTATION_FAILED',
      'message', 'ORG-CONTEXT unique constraint rejected the mutation',
      'operation', p_operation
    );
  when foreign_key_violation then
    return jsonb_build_object(
      'ok', false,
      'code', 'MUTATION_FAILED',
      'message', 'ORG-CONTEXT referential integrity rejected the mutation',
      'operation', p_operation
    );
  when check_violation then
    return jsonb_build_object(
      'ok', false,
      'code', 'MUTATION_FAILED',
      'message', 'ORG-CONTEXT check constraint rejected the mutation',
      'operation', p_operation
    );
  when sqlstate 'P0001' then
    return jsonb_build_object(
      'ok', false,
      'code', 'MUTATION_FAILED',
      'message', sqlerrm,
      'operation', p_operation
    );
end;
$$;

comment on function private.apply_organization_context_mutation(text, text, uuid, uuid, jsonb) is
  'ORG-CONTEXT-1X-B canonical Activity/Context state transition. Not PostgREST-facing. Source is an internal argument, never a product payload field. Nested calls share the caller transaction; ok=false does not roll back prior DML.';

revoke all on function private.apply_organization_context_mutation(text, text, uuid, uuid, jsonb) from public;
revoke all on function private.apply_organization_context_mutation(text, text, uuid, uuid, jsonb) from anon;
revoke all on function private.apply_organization_context_mutation(text, text, uuid, uuid, jsonb) from authenticated;
revoke all on function private.apply_organization_context_mutation(text, text, uuid, uuid, jsonb) from service_role;

create or replace function public.apply_organization_context_platform_mutation(
  p_operation text,
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'ORG-CONTEXT platform mutation requires the privileged database role',
      'operation', p_operation
    );
  end if;

  return private.apply_organization_context_mutation(
    'platform_operator',
    p_operation,
    p_organization_id,
    p_actor_user_id,
    p_payload
  );
end;
$$;

comment on function public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb) is
  'ORG-CONTEXT platform wrapper. Source fixed to platform_operator. Not tenant self-service, resolver, entitlement, or Social execution.';

revoke all on function public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb) from public;
revoke all on function public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb) from service_role;
grant execute on function public.apply_organization_context_platform_mutation(text, uuid, uuid, jsonb) to service_role;

create or replace function public.apply_organization_context_bqa_mutation(
  p_operation text,
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_member_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'ORG-CONTEXT confirmed mutation requires the privileged database role',
      'operation', p_operation
    );
  end if;

  if p_actor_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ACTOR_NOT_AUTHORIZED',
      'message', 'Authenticated Owner or Admin actor is required',
      'operation', p_operation
    );
  end if;

  if p_organization_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORG_NOT_FOUND',
      'message', 'organizationId is required',
      'operation', p_operation
    );
  end if;

  if p_operation not in (
    'classify_activity',
    'activate_activity',
    'assign_context_version'
  ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'FORBIDDEN_OPERATION',
      'message', 'Operation is not allowed for bqa_confirmed',
      'operation', p_operation
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
      'code', 'ACTOR_NOT_AUTHORIZED',
      'message', 'bqa_confirmed requires an active Owner or Admin membership',
      'operation', p_operation
    );
  end if;

  return private.apply_organization_context_mutation(
    'bqa_confirmed',
    p_operation,
    p_organization_id,
    p_actor_user_id,
    p_payload
  );
end;
$$;

comment on function public.apply_organization_context_bqa_mutation(text, uuid, uuid, jsonb) is
  'ORG-CONTEXT confirmed-admission wrapper. Source fixed to bqa_confirmed. Owner/Admin only. classify/activate/assign only. Not a BQA admission engine.';

revoke all on function public.apply_organization_context_bqa_mutation(text, uuid, uuid, jsonb) from public;
revoke all on function public.apply_organization_context_bqa_mutation(text, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_organization_context_bqa_mutation(text, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_organization_context_bqa_mutation(text, uuid, uuid, jsonb) from service_role;
grant execute on function public.apply_organization_context_bqa_mutation(text, uuid, uuid, jsonb) to service_role;
