-- ZyntixAI BQA-1F-R — atomic governed Activity + Context assignment handoff.
--
-- Additive. Does not edit BQA-1C/1D/1E or ORG-CONTEXT 1X-B SQL.
-- Does not INSERT/UPDATE Activity or Context-assignment rows directly.
-- Nested ORG-CONTEXT transitions go only through
-- public.apply_organization_context_bqa_mutation.
-- Nested jsonb ok=false MUST RAISE so the outer transaction aborts.
-- Lock order: 872011 (ORG-CONTEXT organization) then 872012 (BQA org:activity).
-- No eighth BQA table. No Production apply in 1F-R.

create or replace function public.apply_business_qualification_assignment_handoff(
  p_organization_id uuid,
  p_business_activity_id uuid,
  p_actor_user_id uuid,
  p_admission_decision_id uuid,
  p_rollout_mode text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_status text;
  v_actor_member_id uuid;
  v_activity public.organization_business_activities%rowtype;
  v_qualification public.business_activity_qualifications%rowtype;
  v_admission public.business_activity_admission_decisions%rowtype;
  v_support public.business_activity_support_assessments%rowtype;
  v_decision public.business_activity_classification_decisions%rowtype;
  v_version_pack_id uuid;
  v_publication_status text;
  v_activity_target uuid;
  v_completed public.business_activity_qualification_events%rowtype;
  v_requested_id uuid;
  v_completed_id uuid;
  v_classify jsonb;
  v_activate jsonb;
  v_assign jsonb;
  v_assignment_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'BQA assignment handoff requires the privileged database role'
    );
  end if;

  if p_organization_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORG_NOT_FOUND',
      'message', 'organizationId is required'
    );
  end if;

  if p_business_activity_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ACTIVITY_NOT_FOUND',
      'message', 'businessActivityId is required'
    );
  end if;

  if p_actor_user_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'Authenticated Owner or Admin actor is required'
    );
  end if;

  if p_admission_decision_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'ADMISSION_NOT_FOUND',
      'message', 'admissionDecisionId is required'
    );
  end if;

  if p_rollout_mode is null or p_rollout_mode not in (
    'internal_qa',
    'closed_beta',
    'production',
    'open_beta'
  ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'ROLLOUT_MISMATCH',
      'message', 'rolloutMode is required'
    );
  end if;

  if p_rollout_mode = 'open_beta' then
    return jsonb_build_object(
      'ok', false,
      'code', 'ROLLOUT_POLICY_UNDEFINED',
      'message', 'Open Beta has no handoff policy'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872011,
    pg_catalog.hashtext(p_organization_id::text)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    872012,
    pg_catalog.hashtext(p_organization_id::text || ':' || p_business_activity_id::text)
  );

  select o.status
    into v_org_status
  from public.organizations as o
  where o.id = p_organization_id;

  if v_org_status is null or v_org_status is distinct from 'active' then
    return jsonb_build_object(
      'ok', false,
      'code', 'ORG_NOT_FOUND',
      'message', 'Organization not found or access denied'
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
      'code', 'FORBIDDEN_ROLE',
      'message', 'Assignment handoff requires an active Owner or Admin membership'
    );
  end if;

  select a.*
    into v_activity
  from public.organization_business_activities as a
  where a.organization_id = p_organization_id
    and a.id = p_business_activity_id;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'ACTIVITY_NOT_FOUND',
      'message', 'Business Activity not found or access denied'
    );
  end if;

  if v_activity.status = 'archived' then
    return jsonb_build_object(
      'ok', false,
      'code', 'ACTIVITY_ARCHIVED',
      'message', 'Archived Business Activity cannot be handed off'
    );
  end if;

  select q.*
    into v_qualification
  from public.business_activity_qualifications as q
  where q.organization_id = p_organization_id
    and q.business_activity_id = p_business_activity_id;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'QUALIFICATION_NOT_FOUND',
      'message', 'Qualification has not been started'
    );
  end if;

  if v_qualification.progress_status = 'requalifying' then
    return jsonb_build_object(
      'ok', false,
      'code', 'REQUALIFICATION_REQUIRED',
      'message', 'Requalifying qualification cannot be handed off'
    );
  end if;

  if v_qualification.review_status in ('required', 'requested')
    or v_qualification.split_recommended
    or v_qualification.progress_status is distinct from 'confirmed'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'CLASSIFICATION_NOT_CONFIRMED',
      'message', 'Qualification is not in a confirmed handoff-ready state'
    );
  end if;

  select d.*
    into v_admission
  from public.business_activity_admission_decisions as d
  where d.id = p_admission_decision_id;

  if not found then
    return jsonb_build_object(
      'ok', false,
      'code', 'ADMISSION_NOT_FOUND',
      'message', 'Admission decision was not found'
    );
  end if;

  if v_admission.organization_id is distinct from p_organization_id
    or v_admission.business_activity_id is distinct from p_business_activity_id
    or v_admission.qualification_id is distinct from v_qualification.id
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'ADMISSION_NOT_FOUND',
      'message', 'Admission decision was not found'
    );
  end if;

  if v_admission.rollout_mode is distinct from p_rollout_mode then
    return jsonb_build_object(
      'ok', false,
      'code', 'ROLLOUT_MISMATCH',
      'message', 'Admission decision rollout does not match the requested rollout'
    );
  end if;

  if v_admission.admission_status is distinct from 'admitted'
    or v_admission.reason_code is distinct from 'eligible'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'ADMISSION_NOT_ELIGIBLE',
      'message', 'Admission decision is not eligible for handoff'
    );
  end if;

  if v_admission.support_assessment_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'SUPPORT_ASSESSMENT_NOT_READY',
      'message', 'Admission decision is missing its support assessment'
    );
  end if;

  select s.*
    into v_support
  from public.business_activity_support_assessments as s
  where s.id = v_admission.support_assessment_id;

  if not found
    or v_support.organization_id is distinct from p_organization_id
    or v_support.business_activity_id is distinct from p_business_activity_id
    or v_support.qualification_id is distinct from v_qualification.id
    or v_support.rollout_mode is distinct from p_rollout_mode
    or v_support.superseded_at is not null
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'SUPPORT_ASSESSMENT_NOT_READY',
      'message', 'Linked support assessment is not ready for handoff'
    );
  end if;

  if v_support.support_status is distinct from 'supported_for_requested_rollout'
    or v_support.reason_code is distinct from 'eligible'
    or v_support.context_pack_id is null
    or v_support.context_pack_version_id is null
    or v_support.classification_decision_id is null
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'SUPPORT_ASSESSMENT_NOT_READY',
      'message', 'Linked support assessment is not eligible for handoff'
    );
  end if;

  select c.*
    into v_decision
  from public.business_activity_classification_decisions as c
  where c.id = v_support.classification_decision_id;

  if not found
    or v_decision.organization_id is distinct from p_organization_id
    or v_decision.business_activity_id is distinct from p_business_activity_id
    or v_decision.qualification_id is distinct from v_qualification.id
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'CLASSIFICATION_NOT_CONFIRMED',
      'message', 'Linked classification decision was not found'
    );
  end if;

  if v_qualification.current_classification_decision_id is distinct from v_decision.id
    or v_decision.decision_status is distinct from 'confirmed'
    or v_decision.classification_outcome is distinct from 'classified'
    or v_decision.taxonomy_target_kind is null
    or v_decision.taxonomy_target_id is null
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'ADMISSION_STALE',
      'message', 'Admission no longer matches the current confirmed classification'
    );
  end if;

  select v.pack_id, v.publication_status
    into v_version_pack_id, v_publication_status
  from public.context_pack_versions as v
  where v.id = v_support.context_pack_version_id;

  if v_version_pack_id is null
    or v_version_pack_id is distinct from v_support.context_pack_id
    or v_publication_status is distinct from 'published'
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'CONTEXT_VERSION_INVALID',
      'message', 'Admitted Context version is missing, unpublished, or not on the expected pack'
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

  select e.*
    into v_completed
  from public.business_activity_qualification_events as e
  where e.organization_id = p_organization_id
    and e.idempotency_key = 'handoff-completed:' || p_admission_decision_id::text
  limit 1;

  if found then
    if v_activity.status is distinct from 'active'
      or v_activity.classification_kind is distinct from v_decision.taxonomy_target_kind
      or v_activity_target is distinct from v_decision.taxonomy_target_id
      or not exists (
        select 1
        from public.organization_context_assignments as c
        where c.organization_id = p_organization_id
          and c.business_activity_id = p_business_activity_id
          and c.status = 'active'
          and c.context_pack_version_id = v_support.context_pack_version_id
      )
    then
      return jsonb_build_object(
        'ok', false,
        'code', 'HANDOFF_FAILED',
        'message', 'Prior handoff completion no longer matches canonical Activity state'
      );
    end if;

    select c.id
      into v_assignment_id
    from public.organization_context_assignments as c
    where c.organization_id = p_organization_id
      and c.business_activity_id = p_business_activity_id
      and c.status = 'active'
    limit 1;

    return jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'organization_id', p_organization_id,
      'business_activity_id', p_business_activity_id,
      'admission_decision_id', p_admission_decision_id,
      'qualification_id', v_qualification.id,
      'classification_applied', false,
      'activation_applied', false,
      'assignment_applied', false,
      'assignment_id', v_assignment_id,
      'context_pack_version_id', v_support.context_pack_version_id,
      'event_id', v_completed.id,
      'event_type', 'assignment_handoff_completed'
    );
  end if;

  if v_activity.classification_kind is not null
    and (
      v_activity.classification_kind is distinct from v_decision.taxonomy_target_kind
      or v_activity_target is distinct from v_decision.taxonomy_target_id
    )
  then
    return jsonb_build_object(
      'ok', false,
      'code', 'ACTIVITY_CLASSIFICATION_MISMATCH',
      'message', 'Business Activity classification does not match the confirmed BQA target'
    );
  end if;

  insert into public.business_activity_qualification_events (
    organization_id,
    business_activity_id,
    qualification_id,
    event_type,
    actor_user_id,
    actor_member_id,
    payload,
    idempotency_key
  )
  values (
    p_organization_id,
    p_business_activity_id,
    v_qualification.id,
    'assignment_handoff_requested',
    p_actor_user_id,
    v_actor_member_id,
    jsonb_build_object(
      'admission_decision_id', p_admission_decision_id,
      'support_assessment_id', v_support.id,
      'classification_decision_id', v_decision.id,
      'rollout_mode', p_rollout_mode,
      'taxonomy_target_id', v_decision.taxonomy_target_id,
      'context_pack_version_id', v_support.context_pack_version_id,
      'business_activity_id', p_business_activity_id
    ),
    'handoff-requested:' || p_admission_decision_id::text
  )
  returning id into v_requested_id;

  v_classify := public.apply_organization_context_bqa_mutation(
    'classify_activity',
    p_organization_id,
    p_actor_user_id,
    jsonb_build_object(
      'activity_id', p_business_activity_id,
      'classification_kind', v_decision.taxonomy_target_kind,
      'target_id', v_decision.taxonomy_target_id
    )
  );
  if v_classify is null
    or jsonb_typeof(v_classify) <> 'object'
    or (v_classify->>'ok') is distinct from 'true'
  then
    raise exception using
      errcode = 'P0001',
      message = 'HANDOFF_NESTED:' || coalesce(v_classify->>'code', 'HANDOFF_FAILED');
  end if;

  v_activate := public.apply_organization_context_bqa_mutation(
    'activate_activity',
    p_organization_id,
    p_actor_user_id,
    jsonb_build_object(
      'activity_id', p_business_activity_id
    )
  );
  if v_activate is null
    or jsonb_typeof(v_activate) <> 'object'
    or (v_activate->>'ok') is distinct from 'true'
  then
    raise exception using
      errcode = 'P0001',
      message = 'HANDOFF_NESTED:' || coalesce(v_activate->>'code', 'HANDOFF_FAILED');
  end if;

  v_assign := public.apply_organization_context_bqa_mutation(
    'assign_context_version',
    p_organization_id,
    p_actor_user_id,
    jsonb_build_object(
      'activity_id', p_business_activity_id,
      'context_pack_version_id', v_support.context_pack_version_id
    )
  );
  if v_assign is null
    or jsonb_typeof(v_assign) <> 'object'
    or (v_assign->>'ok') is distinct from 'true'
  then
    raise exception using
      errcode = 'P0001',
      message = 'HANDOFF_NESTED:' || coalesce(v_assign->>'code', 'HANDOFF_FAILED');
  end if;

  v_assignment_id := nullif(v_assign->>'assignment_id', '')::uuid;

  insert into public.business_activity_qualification_events (
    organization_id,
    business_activity_id,
    qualification_id,
    event_type,
    actor_user_id,
    actor_member_id,
    payload,
    idempotency_key
  )
  values (
    p_organization_id,
    p_business_activity_id,
    v_qualification.id,
    'assignment_handoff_completed',
    p_actor_user_id,
    v_actor_member_id,
    jsonb_build_object(
      'admission_decision_id', p_admission_decision_id,
      'support_assessment_id', v_support.id,
      'classification_decision_id', v_decision.id,
      'rollout_mode', p_rollout_mode,
      'taxonomy_target_id', v_decision.taxonomy_target_id,
      'context_pack_version_id', v_support.context_pack_version_id,
      'business_activity_id', p_business_activity_id,
      'assignment_id', v_assignment_id,
      'requested_event_id', v_requested_id,
      'classification_applied', (v_classify->>'idempotent') is distinct from 'true',
      'activation_applied', (v_activate->>'idempotent') is distinct from 'true',
      'assignment_applied', (v_assign->>'idempotent') is distinct from 'true'
    ),
    'handoff-completed:' || p_admission_decision_id::text
  )
  returning id into v_completed_id;

  return jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'organization_id', p_organization_id,
    'business_activity_id', p_business_activity_id,
    'admission_decision_id', p_admission_decision_id,
    'qualification_id', v_qualification.id,
    'classification_applied', (v_classify->>'idempotent') is distinct from 'true',
    'activation_applied', (v_activate->>'idempotent') is distinct from 'true',
    'assignment_applied', (v_assign->>'idempotent') is distinct from 'true',
    'assignment_id', v_assignment_id,
    'context_pack_version_id', v_support.context_pack_version_id,
    'event_id', v_completed_id,
    'event_type', 'assignment_handoff_completed'
  );
end;
$$;

comment on function public.apply_business_qualification_assignment_handoff(uuid, uuid, uuid, uuid, text) is
  'BQA-1F-R atomic governed Activity/Context handoff. Nested ORG-CONTEXT results must be ok=true or the transaction aborts. Nested source is wrapper-fixed bqa_confirmed. service_role executor only. Not a bearer token for persisted admission.';

revoke all on function public.apply_business_qualification_assignment_handoff(uuid, uuid, uuid, uuid, text) from public;
revoke all on function public.apply_business_qualification_assignment_handoff(uuid, uuid, uuid, uuid, text) from anon;
revoke all on function public.apply_business_qualification_assignment_handoff(uuid, uuid, uuid, uuid, text) from authenticated;
revoke all on function public.apply_business_qualification_assignment_handoff(uuid, uuid, uuid, uuid, text) from service_role;
grant execute on function public.apply_business_qualification_assignment_handoff(uuid, uuid, uuid, uuid, text) to service_role;
