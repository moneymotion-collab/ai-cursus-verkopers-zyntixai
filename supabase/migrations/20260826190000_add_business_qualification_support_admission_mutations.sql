-- ZyntixAI BQA-1E — Support, admission, and demand atomic mutation operations.
--
-- Additive CREATE OR REPLACE of public.apply_business_qualification_mutation.
-- Does not edit 20260826180000. Does not alter BQA-1C table semantics.
-- Does not INSERT/UPDATE public.organization_business_activities.
-- Does not INSERT/UPDATE public.organization_context_assignments.
-- Does not write taxonomy_*, context_packs, context_pack_versions,
-- context_pack_readiness, or capability_* tables.
-- EXECUTE remains revoked from public/anon/authenticated.

create or replace function public.apply_business_qualification_mutation(
  p_operation text,
  p_organization_id uuid,
  p_business_activity_id uuid,
  p_actor_user_id uuid,
  p_actor_member_id uuid,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_status text;
  v_activity_status text;
  v_qualification public.business_activity_qualifications%rowtype;
  v_inserted boolean := false;
  v_answer public.business_activity_qualification_answers%rowtype;
  v_existing_answer public.business_activity_qualification_answers%rowtype;
  v_decision public.business_activity_classification_decisions%rowtype;
  v_confirmed public.business_activity_classification_decisions%rowtype;
  v_proposed public.business_activity_classification_decisions%rowtype;
  v_event_id uuid;
  v_event_type text;
  v_now timestamptz := pg_catalog.now();
  v_question_key text;
  v_value_kind text;
  v_value_text text;
  v_value_code text;
  v_source text;
  v_required_count integer;
  v_line_structure text;
  v_split boolean;
  v_progress text;
  v_review text;
  v_outcome text;
  v_confidence text;
  v_proposal_source text;
  v_decision_source text;
  v_release_id uuid;
  v_target_id uuid;
  v_target_kind text;
  v_target_key text;
  v_review_required boolean;
  v_idempotency_key text;
  v_assessment public.business_activity_support_assessments%rowtype;
  v_admission public.business_activity_admission_decisions%rowtype;
  v_demand public.business_activity_demand_signals%rowtype;
  v_rollout text;
  v_support_status text;
  v_support_reason text;
  v_admission_status text;
  v_admission_reason text;
  v_architecture_gap boolean;
  v_pack_id uuid;
  v_version_id uuid;
  v_readiness text;
  v_classification_decision_id uuid;
  v_support_assessment_id uuid;
begin
  if auth.role() is distinct from 'service_role' then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'BQA mutation requires the privileged database role'
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

  if p_actor_user_id is null or p_actor_member_id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'UNAUTHORIZED',
      'message', 'Authenticated tenant actor identity is required'
    );
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    return jsonb_build_object(
      'ok', false,
      'code', 'DATABASE_WRITE_ERROR',
      'message', 'Mutation payload must be a JSON object'
    );
  end if;

  if p_operation not in (
    'ensure_qualification',
    'save_answer',
    'record_proposal',
    'confirm_classification',
    'begin_requalification',
    'request_review',
    'record_support_assessment',
    'record_admission_decision',
    'join_demand_waitlist',
    'withdraw_demand_waitlist'
  ) then
    return jsonb_build_object(
      'ok', false,
      'code', 'DATABASE_WRITE_ERROR',
      'message', 'Unknown BQA mutation operation'
    );
  end if;

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
      'message', 'Organization not found'
    );
  end if;

  select a.status
    into v_activity_status
  from public.organization_business_activities as a
  where a.organization_id = p_organization_id
    and a.id = p_business_activity_id;

  if v_activity_status is null or v_activity_status = 'archived' then
    return jsonb_build_object(
      'ok', false,
      'code', 'ACTIVITY_NOT_FOUND',
      'message', 'Business Activity not found'
    );
  end if;

  select q.*
    into v_qualification
  from public.business_activity_qualifications as q
  where q.organization_id = p_organization_id
    and q.business_activity_id = p_business_activity_id;

  if p_operation = 'ensure_qualification' then
    if v_qualification.id is not null then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'qualification_id', v_qualification.id,
        'decision_id', null,
        'answer_id', null,
        'event_id', null,
        'event_type', null
      );
    end if;

    insert into public.business_activity_qualifications (
      organization_id,
      business_activity_id,
      progress_status,
      review_status
    )
    values (
      p_organization_id,
      p_business_activity_id,
      'unstarted',
      'none'
    )
    returning * into v_qualification;

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
      'qualification_started',
      p_actor_user_id,
      p_actor_member_id,
      '{}'::jsonb,
      'qstart:' || p_business_activity_id::text
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'decision_id', null,
      'answer_id', null,
      'event_id', v_event_id,
      'event_type', 'qualification_started'
    );
  end if;

  if v_qualification.id is null and p_operation = 'save_answer' then
    insert into public.business_activity_qualifications (
      organization_id,
      business_activity_id,
      progress_status,
      review_status
    )
    values (
      p_organization_id,
      p_business_activity_id,
      'unstarted',
      'none'
    )
    returning * into v_qualification;

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
      'qualification_started',
      p_actor_user_id,
      p_actor_member_id,
      '{}'::jsonb,
      'qstart:' || p_business_activity_id::text
    );
    v_inserted := true;
  end if;

  if v_qualification.id is null then
    return jsonb_build_object(
      'ok', false,
      'code', 'QUALIFICATION_NOT_FOUND',
      'message', 'Qualification has not been started'
    );
  end if;

  if p_operation = 'save_answer' then
    v_question_key := p_payload ->> 'question_key';
    v_value_kind := p_payload ->> 'value_kind';
    v_value_text := p_payload ->> 'value_text';
    v_value_code := p_payload ->> 'value_code';
    v_source := p_payload ->> 'source';

    if v_question_key is null or v_value_kind is null or v_source is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'INVALID_ANSWER',
        'message', 'Answer payload is incomplete'
      );
    end if;

    select a.*
      into v_existing_answer
    from public.business_activity_qualification_answers as a
    where a.qualification_id = v_qualification.id
      and a.question_key = v_question_key;

    if v_existing_answer.id is not null
      and v_existing_answer.value_kind is not distinct from v_value_kind
      and v_existing_answer.value_text is not distinct from v_value_text
      and v_existing_answer.value_code is not distinct from v_value_code
    then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'qualification_id', v_qualification.id,
        'decision_id', null,
        'answer_id', v_existing_answer.id,
        'event_id', null,
        'event_type', null
      );
    end if;

    insert into public.business_activity_qualification_answers (
      organization_id,
      business_activity_id,
      qualification_id,
      question_key,
      value_kind,
      value_text,
      value_code,
      source,
      actor_user_id
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      v_question_key,
      v_value_kind,
      v_value_text,
      v_value_code,
      v_source,
      p_actor_user_id
    )
    on conflict on constraint business_activity_qualification_answers_current_unique
    do update set
      value_kind = excluded.value_kind,
      value_text = excluded.value_text,
      value_code = excluded.value_code,
      source = excluded.source,
      actor_user_id = excluded.actor_user_id,
      updated_at = pg_catalog.now()
    returning * into v_answer;

    select count(*)
      into v_required_count
    from public.business_activity_qualification_answers as a
    where a.qualification_id = v_qualification.id
      and a.question_key in (
        'activity_description',
        'primary_value_delivered',
        'line_structure'
      );

    select a.value_code
      into v_line_structure
    from public.business_activity_qualification_answers as a
    where a.qualification_id = v_qualification.id
      and a.question_key = 'line_structure';

    v_split := v_line_structure is not distinct from 'several_lines';

    if v_qualification.progress_status in ('confirmed', 'requalifying') then
      v_progress := v_qualification.progress_status;
      v_review := v_qualification.review_status;
    elsif v_qualification.review_status in ('required', 'requested') then
      v_progress := 'needs_review';
      v_review := v_qualification.review_status;
    elsif v_required_count = 0 then
      v_progress := 'unstarted';
      v_review := v_qualification.review_status;
    elsif v_required_count < 3 then
      v_progress := 'collecting';
      v_review := v_qualification.review_status;
    else
      v_progress := 'collecting';
      v_review := v_qualification.review_status;
    end if;

    update public.business_activity_qualifications
    set
      progress_status = v_progress,
      review_status = v_review,
      split_recommended = v_split,
      updated_at = v_now
    where id = v_qualification.id
      and organization_id = p_organization_id;

    insert into public.business_activity_qualification_events (
      organization_id,
      business_activity_id,
      qualification_id,
      event_type,
      actor_user_id,
      actor_member_id,
      payload
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      'answer_saved',
      p_actor_user_id,
      p_actor_member_id,
      jsonb_build_object(
        'question_key', v_question_key,
        'change', case when v_existing_answer.id is null then 'created' else 'updated' end
      )
    )
    returning id into v_event_id;

    if v_split and v_qualification.split_recommended is distinct from true then
      insert into public.business_activity_qualification_events (
        organization_id,
        business_activity_id,
        qualification_id,
        event_type,
        actor_user_id,
        actor_member_id,
        payload
      )
      values (
        p_organization_id,
        p_business_activity_id,
        v_qualification.id,
        'split_recommended',
        p_actor_user_id,
        p_actor_member_id,
        jsonb_build_object('question_key', 'line_structure')
      );
    end if;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'decision_id', null,
      'answer_id', v_answer.id,
      'event_id', v_event_id,
      'event_type', 'answer_saved'
    );
  end if;

  if p_operation = 'record_proposal' then
    if v_qualification.progress_status = 'confirmed' then
      return jsonb_build_object(
        'ok', false,
        'code', 'REQUALIFICATION_REQUIRED',
        'message', 'A confirmed classification requires requalification before a new proposal'
      );
    end if;

    v_outcome := p_payload ->> 'classification_outcome';
    v_confidence := p_payload ->> 'confidence_band';
    v_proposal_source := p_payload ->> 'proposal_source';
    v_release_id := nullif(p_payload ->> 'taxonomy_release_id', '')::uuid;
    v_target_id := nullif(p_payload ->> 'taxonomy_target_id', '')::uuid;
    v_target_kind := nullif(p_payload ->> 'taxonomy_target_kind', '');
    v_target_key := nullif(p_payload ->> 'taxonomy_target_key', '');
    v_review_required := coalesce((p_payload ->> 'review_required')::boolean, false);

    if v_outcome is null or v_confidence is null or v_proposal_source is null or v_release_id is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'CLASSIFICATION_NOT_READY',
        'message', 'Classification proposal payload is incomplete'
      );
    end if;

    insert into public.business_activity_classification_decisions (
      organization_id,
      business_activity_id,
      qualification_id,
      taxonomy_release_id,
      taxonomy_target_kind,
      taxonomy_target_id,
      taxonomy_target_key,
      classification_outcome,
      confidence_band,
      decision_status,
      proposal_source,
      alternative_target_ids,
      unresolved_dimension_codes,
      evidence_snapshot
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      v_release_id,
      v_target_kind,
      v_target_id,
      v_target_key,
      v_outcome,
      v_confidence,
      'proposed',
      v_proposal_source,
      coalesce(
        (
          select array_agg(value::uuid)
          from jsonb_array_elements_text(coalesce(p_payload -> 'alternative_target_ids', '[]'::jsonb)) as value
        ),
        '{}'::uuid[]
      ),
      coalesce(
        (
          select array_agg(value)
          from jsonb_array_elements_text(coalesce(p_payload -> 'unresolved_dimension_codes', '[]'::jsonb)) as value
        ),
        '{}'::text[]
      ),
      coalesce(p_payload -> 'evidence_snapshot', '{}'::jsonb)
    )
    returning * into v_decision;

    v_review := v_qualification.review_status;
    v_progress := v_qualification.progress_status;
    if v_qualification.split_recommended or v_review_required or v_outcome in ('ambiguous', 'unknown', 'architecture_gap') then
      v_progress := 'needs_review';
      if v_review = 'none' then
        v_review := 'required';
      end if;
    elsif v_qualification.progress_status = 'requalifying' then
      v_progress := 'requalifying';
    elsif v_outcome = 'classified' and v_confidence = 'high' then
      v_progress := 'awaiting_confirmation';
    end if;

    update public.business_activity_qualifications
    set
      progress_status = v_progress,
      review_status = v_review,
      updated_at = v_now
    where id = v_qualification.id
      and organization_id = p_organization_id;

    insert into public.business_activity_qualification_events (
      organization_id,
      business_activity_id,
      qualification_id,
      event_type,
      actor_user_id,
      actor_member_id,
      payload
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      'classification_proposed',
      p_actor_user_id,
      p_actor_member_id,
      jsonb_build_object(
        'decision_id', v_decision.id,
        'classification_outcome', v_outcome,
        'confidence_band', v_confidence,
        'taxonomy_target_id', v_target_id,
        'taxonomy_target_key', v_target_key
      )
    )
    returning id into v_event_id;

    if v_review = 'required' and v_qualification.review_status = 'none' then
      insert into public.business_activity_qualification_events (
        organization_id,
        business_activity_id,
        qualification_id,
        event_type,
        actor_user_id,
        actor_member_id,
        payload
      )
      values (
        p_organization_id,
        p_business_activity_id,
        v_qualification.id,
        'review_requested',
        p_actor_user_id,
        p_actor_member_id,
        jsonb_build_object('reason', 'classification_review_required')
      );
    end if;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'decision_id', v_decision.id,
      'answer_id', null,
      'event_id', v_event_id,
      'event_type', 'classification_proposed'
    );
  end if;

  if p_operation = 'confirm_classification' then
    v_target_id := nullif(p_payload ->> 'taxonomy_target_id', '')::uuid;
    v_target_kind := p_payload ->> 'taxonomy_target_kind';
    v_target_key := p_payload ->> 'taxonomy_target_key';
    v_release_id := nullif(p_payload ->> 'taxonomy_release_id', '')::uuid;
    v_decision_source := p_payload ->> 'decision_source';

    if v_target_id is null or v_release_id is null or v_decision_source is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'CLASSIFICATION_NOT_READY',
        'message', 'Confirmation payload is incomplete'
      );
    end if;

    if v_decision_source = 'ai_proposal' then
      return jsonb_build_object(
        'ok', false,
        'code', 'FORBIDDEN_ROLE',
        'message', 'AI proposal cannot confirm classification'
      );
    end if;

    select d.*
      into v_confirmed
    from public.business_activity_classification_decisions as d
    where d.organization_id = p_organization_id
      and d.business_activity_id = p_business_activity_id
      and d.decision_status = 'confirmed';

    if v_confirmed.id is not null
      and v_confirmed.taxonomy_target_id is not distinct from v_target_id
      and v_confirmed.taxonomy_release_id is not distinct from v_release_id
    then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'qualification_id', v_qualification.id,
        'decision_id', v_confirmed.id,
        'answer_id', null,
        'event_id', null,
        'event_type', null
      );
    end if;

    if v_confirmed.id is not null
      and v_confirmed.taxonomy_target_id is distinct from v_target_id
      and v_qualification.progress_status = 'confirmed'
    then
      return jsonb_build_object(
        'ok', false,
        'code', 'REQUALIFICATION_REQUIRED',
        'message', 'A different confirmed classification requires requalification'
      );
    end if;

    select d.*
      into v_proposed
    from public.business_activity_classification_decisions as d
    where d.organization_id = p_organization_id
      and d.business_activity_id = p_business_activity_id
      and d.decision_status = 'proposed'
      and d.classification_outcome = 'classified'
      and d.taxonomy_target_id = v_target_id
    order by d.created_at desc
    limit 1;

    if v_proposed.id is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'CLASSIFICATION_NOT_READY',
        'message', 'A confirmable classified proposal is required'
      );
    end if;

    if v_qualification.split_recommended then
      return jsonb_build_object(
        'ok', false,
        'code', 'CLASSIFICATION_REVIEW_REQUIRED',
        'message', 'Unresolved hybrid split cannot be confirmed'
      );
    end if;

    if v_confirmed.id is not null then
      update public.business_activity_classification_decisions
      set
        decision_status = 'superseded',
        superseded_at = v_now
      where id = v_confirmed.id
        and organization_id = p_organization_id;

      insert into public.business_activity_qualification_events (
        organization_id,
        business_activity_id,
        qualification_id,
        event_type,
        actor_user_id,
        actor_member_id,
        payload
      )
      values (
        p_organization_id,
        p_business_activity_id,
        v_qualification.id,
        'classification_superseded',
        p_actor_user_id,
        p_actor_member_id,
        jsonb_build_object(
          'superseded_decision_id', v_confirmed.id,
          'taxonomy_target_id', v_confirmed.taxonomy_target_id
        )
      );
    end if;

    insert into public.business_activity_classification_decisions (
      organization_id,
      business_activity_id,
      qualification_id,
      taxonomy_release_id,
      taxonomy_target_kind,
      taxonomy_target_id,
      taxonomy_target_key,
      classification_outcome,
      confidence_band,
      decision_status,
      proposal_source,
      decision_source,
      confirmed_by_user_id,
      confirmed_at,
      alternative_target_ids,
      unresolved_dimension_codes,
      evidence_snapshot,
      supersedes_decision_id
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      v_proposed.taxonomy_release_id,
      v_proposed.taxonomy_target_kind,
      v_proposed.taxonomy_target_id,
      v_proposed.taxonomy_target_key,
      'classified',
      v_proposed.confidence_band,
      'confirmed',
      v_proposed.proposal_source,
      v_decision_source,
      p_actor_user_id,
      v_now,
      v_proposed.alternative_target_ids,
      v_proposed.unresolved_dimension_codes,
      v_proposed.evidence_snapshot,
      v_confirmed.id
    )
    returning * into v_decision;

    update public.business_activity_qualifications
    set
      current_classification_decision_id = v_decision.id,
      progress_status = 'confirmed',
      updated_at = v_now
    where id = v_qualification.id
      and organization_id = p_organization_id;

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
      'classification_confirmed',
      p_actor_user_id,
      p_actor_member_id,
      jsonb_build_object(
        'decision_id', v_decision.id,
        'taxonomy_target_id', v_decision.taxonomy_target_id,
        'taxonomy_target_key', v_decision.taxonomy_target_key,
        'confidence_band', v_decision.confidence_band
      ),
      'confirm:' || p_business_activity_id::text || ':' || v_decision.id::text
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'decision_id', v_decision.id,
      'answer_id', null,
      'event_id', v_event_id,
      'event_type', 'classification_confirmed'
    );
  end if;

  if p_operation = 'begin_requalification' then
    if v_qualification.progress_status = 'requalifying' then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'qualification_id', v_qualification.id,
        'decision_id', v_qualification.current_classification_decision_id,
        'answer_id', null,
        'event_id', null,
        'event_type', null
      );
    end if;

    if v_qualification.progress_status is distinct from 'confirmed' then
      return jsonb_build_object(
        'ok', false,
        'code', 'CLASSIFICATION_NOT_READY',
        'message', 'Requalification requires a confirmed classification'
      );
    end if;

    if v_qualification.current_support_assessment_id is not null then
      update public.business_activity_support_assessments
      set superseded_at = v_now
      where organization_id = p_organization_id
        and id = v_qualification.current_support_assessment_id
        and superseded_at is null;
    end if;

    if v_qualification.current_admission_decision_id is not null then
      update public.business_activity_admission_decisions
      set superseded_at = v_now
      where organization_id = p_organization_id
        and id = v_qualification.current_admission_decision_id
        and superseded_at is null;
    end if;

    update public.business_activity_qualifications
    set
      progress_status = 'requalifying',
      current_support_assessment_id = null,
      current_admission_decision_id = null,
      updated_at = v_now
    where id = v_qualification.id
      and organization_id = p_organization_id;

    insert into public.business_activity_qualification_events (
      organization_id,
      business_activity_id,
      qualification_id,
      event_type,
      actor_user_id,
      actor_member_id,
      payload
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      'requalify_started',
      p_actor_user_id,
      p_actor_member_id,
      jsonb_build_object(
        'current_classification_decision_id',
        v_qualification.current_classification_decision_id
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'decision_id', v_qualification.current_classification_decision_id,
      'answer_id', null,
      'event_id', v_event_id,
      'event_type', 'requalify_started'
    );
  end if;

  if p_operation = 'request_review' then
    if v_qualification.review_status in ('required', 'requested') then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'qualification_id', v_qualification.id,
        'decision_id', null,
        'answer_id', null,
        'event_id', null,
        'event_type', null
      );
    end if;

    update public.business_activity_qualifications
    set
      review_status = 'requested',
      progress_status = 'needs_review',
      updated_at = v_now
    where id = v_qualification.id
      and organization_id = p_organization_id;

    insert into public.business_activity_qualification_events (
      organization_id,
      business_activity_id,
      qualification_id,
      event_type,
      actor_user_id,
      actor_member_id,
      payload
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      'review_requested',
      p_actor_user_id,
      p_actor_member_id,
      jsonb_build_object('transition', 'requested')
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'decision_id', null,
      'answer_id', null,
      'event_id', v_event_id,
      'event_type', 'review_requested'
    );
  end if;

  if p_operation = 'record_support_assessment' then
    v_rollout := p_payload ->> 'rollout_mode';
    v_support_status := p_payload ->> 'support_status';
    v_support_reason := p_payload ->> 'reason_code';
    v_architecture_gap := coalesce((p_payload ->> 'architecture_gap')::boolean, false);
    v_classification_decision_id := nullif(p_payload ->> 'classification_decision_id', '')::uuid;
    v_pack_id := nullif(p_payload ->> 'context_pack_id', '')::uuid;
    v_version_id := nullif(p_payload ->> 'context_pack_version_id', '')::uuid;
    v_readiness := nullif(p_payload ->> 'context_readiness', '');

    if v_rollout is null or v_support_status is null or v_support_reason is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'SUPPORT_ASSESSMENT_NOT_READY',
        'message', 'Support assessment payload is incomplete'
      );
    end if;

    if v_qualification.current_support_assessment_id is not null then
      select s.*
        into v_assessment
      from public.business_activity_support_assessments as s
      where s.organization_id = p_organization_id
        and s.id = v_qualification.current_support_assessment_id;

      if v_assessment.id is not null
        and v_assessment.superseded_at is null
        and v_assessment.rollout_mode is not distinct from v_rollout
        and v_assessment.support_status is not distinct from v_support_status
        and v_assessment.reason_code is not distinct from v_support_reason
        and v_assessment.architecture_gap is not distinct from v_architecture_gap
        and v_assessment.classification_decision_id is not distinct from v_classification_decision_id
        and v_assessment.context_pack_id is not distinct from v_pack_id
        and v_assessment.context_pack_version_id is not distinct from v_version_id
        and v_assessment.context_readiness is not distinct from v_readiness
      then
        return jsonb_build_object(
          'ok', true,
          'idempotent', true,
          'qualification_id', v_qualification.id,
          'assessment_id', v_assessment.id,
          'decision_id', null,
          'answer_id', null,
          'event_id', null,
          'event_type', null
        );
      end if;

      if v_assessment.id is not null and v_assessment.superseded_at is null then
        update public.business_activity_support_assessments
        set superseded_at = v_now
        where organization_id = p_organization_id
          and id = v_assessment.id;
      end if;
    end if;

    insert into public.business_activity_support_assessments (
      organization_id,
      business_activity_id,
      qualification_id,
      classification_decision_id,
      rollout_mode,
      support_status,
      reason_code,
      context_pack_id,
      context_pack_version_id,
      context_readiness,
      architecture_gap,
      assessed_at
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      v_classification_decision_id,
      v_rollout,
      v_support_status,
      v_support_reason,
      v_pack_id,
      v_version_id,
      v_readiness,
      v_architecture_gap,
      v_now
    )
    returning * into v_assessment;

    update public.business_activity_qualifications
    set
      current_support_assessment_id = v_assessment.id,
      updated_at = v_now
    where id = v_qualification.id
      and organization_id = p_organization_id;

    insert into public.business_activity_qualification_events (
      organization_id,
      business_activity_id,
      qualification_id,
      event_type,
      actor_user_id,
      actor_member_id,
      payload
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      'support_assessed',
      p_actor_user_id,
      p_actor_member_id,
      jsonb_build_object(
        'assessment_id', v_assessment.id,
        'rollout_mode', v_rollout,
        'support_status', v_support_status,
        'reason_code', v_support_reason,
        'classification_decision_id', v_classification_decision_id,
        'context_pack_id', v_pack_id,
        'context_pack_version_id', v_version_id,
        'context_readiness', v_readiness,
        'existing_pin_assignment_id', nullif(p_payload ->> 'existing_pin_assignment_id', ''),
        'existing_pin_version_id', nullif(p_payload ->> 'existing_pin_version_id', ''),
        'upgrade_may_exist', coalesce((p_payload ->> 'upgrade_may_exist')::boolean, false)
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'assessment_id', v_assessment.id,
      'decision_id', null,
      'answer_id', null,
      'event_id', v_event_id,
      'event_type', 'support_assessed'
    );
  end if;

  if p_operation = 'record_admission_decision' then
    v_support_assessment_id := nullif(p_payload ->> 'support_assessment_id', '')::uuid;
    v_rollout := p_payload ->> 'rollout_mode';
    v_admission_status := p_payload ->> 'admission_status';
    v_admission_reason := p_payload ->> 'reason_code';
    v_decision_source := p_payload ->> 'decision_source';

    if v_rollout is null or v_admission_status is null or v_admission_reason is null or v_decision_source is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'ADMISSION_NOT_ELIGIBLE',
        'message', 'Admission decision payload is incomplete'
      );
    end if;

    if v_decision_source = 'ai_proposal' then
      return jsonb_build_object(
        'ok', false,
        'code', 'FORBIDDEN_ROLE',
        'message', 'AI cannot decide admission'
      );
    end if;

    if v_qualification.current_admission_decision_id is not null then
      select a.*
        into v_admission
      from public.business_activity_admission_decisions as a
      where a.organization_id = p_organization_id
        and a.id = v_qualification.current_admission_decision_id;

      if v_admission.id is not null
        and v_admission.superseded_at is null
        and v_admission.rollout_mode is not distinct from v_rollout
        and v_admission.admission_status is not distinct from v_admission_status
        and v_admission.reason_code is not distinct from v_admission_reason
        and v_admission.support_assessment_id is not distinct from v_support_assessment_id
      then
        return jsonb_build_object(
          'ok', true,
          'idempotent', true,
          'qualification_id', v_qualification.id,
          'admission_id', v_admission.id,
          'assessment_id', v_admission.support_assessment_id,
          'decision_id', null,
          'answer_id', null,
          'event_id', null,
          'event_type', null
        );
      end if;

      if v_admission.id is not null and v_admission.superseded_at is null then
        update public.business_activity_admission_decisions
        set superseded_at = v_now
        where organization_id = p_organization_id
          and id = v_admission.id;
      end if;
    end if;

    insert into public.business_activity_admission_decisions (
      organization_id,
      business_activity_id,
      qualification_id,
      support_assessment_id,
      rollout_mode,
      admission_status,
      reason_code,
      decision_source,
      actor_user_id,
      decided_at
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      v_support_assessment_id,
      v_rollout,
      v_admission_status,
      v_admission_reason,
      v_decision_source,
      p_actor_user_id,
      v_now
    )
    returning * into v_admission;

    update public.business_activity_qualifications
    set
      current_admission_decision_id = v_admission.id,
      updated_at = v_now
    where id = v_qualification.id
      and organization_id = p_organization_id;

    insert into public.business_activity_qualification_events (
      organization_id,
      business_activity_id,
      qualification_id,
      event_type,
      actor_user_id,
      actor_member_id,
      payload
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      'admission_decided',
      p_actor_user_id,
      p_actor_member_id,
      jsonb_build_object(
        'admission_id', v_admission.id,
        'support_assessment_id', v_support_assessment_id,
        'rollout_mode', v_rollout,
        'admission_status', v_admission_status,
        'reason_code', v_admission_reason
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'admission_id', v_admission.id,
      'assessment_id', v_support_assessment_id,
      'decision_id', null,
      'answer_id', null,
      'event_id', v_event_id,
      'event_type', 'admission_decided'
    );
  end if;

  if p_operation = 'join_demand_waitlist' then
    v_target_kind := p_payload ->> 'taxonomy_target_kind';
    v_target_id := nullif(p_payload ->> 'taxonomy_target_id', '')::uuid;
    v_target_key := p_payload ->> 'taxonomy_target_key';
    v_rollout := p_payload ->> 'requested_rollout';

    if v_target_kind is null or v_target_id is null or v_target_key is null or v_rollout is null then
      return jsonb_build_object(
        'ok', false,
        'code', 'CLASSIFICATION_NOT_CONFIRMED',
        'message', 'Demand waitlist requires a confirmed TAX target'
      );
    end if;

    select d.*
      into v_demand
    from public.business_activity_demand_signals as d
    where d.organization_id = p_organization_id
      and d.business_activity_id = p_business_activity_id
      and d.taxonomy_target_id = v_target_id
      and d.status = 'active';

    if v_demand.id is not null then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'qualification_id', v_qualification.id,
        'demand_signal_id', v_demand.id,
        'decision_id', null,
        'answer_id', null,
        'event_id', null,
        'event_type', null
      );
    end if;

    insert into public.business_activity_demand_signals (
      organization_id,
      business_activity_id,
      taxonomy_target_kind,
      taxonomy_target_id,
      taxonomy_target_key,
      requested_rollout,
      status,
      created_at,
      last_confirmed_at
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_target_kind,
      v_target_id,
      v_target_key,
      v_rollout,
      'active',
      v_now,
      v_now
    )
    returning * into v_demand;

    insert into public.business_activity_qualification_events (
      organization_id,
      business_activity_id,
      qualification_id,
      event_type,
      actor_user_id,
      actor_member_id,
      payload
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      'waitlist_joined',
      p_actor_user_id,
      p_actor_member_id,
      jsonb_build_object(
        'demand_signal_id', v_demand.id,
        'taxonomy_target_id', v_target_id,
        'taxonomy_target_key', v_target_key,
        'requested_rollout', v_rollout
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'demand_signal_id', v_demand.id,
      'decision_id', null,
      'answer_id', null,
      'event_id', v_event_id,
      'event_type', 'waitlist_joined'
    );
  end if;

  if p_operation = 'withdraw_demand_waitlist' then
    select d.*
      into v_demand
    from public.business_activity_demand_signals as d
    where d.organization_id = p_organization_id
      and d.business_activity_id = p_business_activity_id
      and d.status = 'active'
    order by d.last_confirmed_at desc
    limit 1;

    if v_demand.id is null then
      return jsonb_build_object(
        'ok', true,
        'idempotent', true,
        'qualification_id', v_qualification.id,
        'demand_signal_id', null,
        'decision_id', null,
        'answer_id', null,
        'event_id', null,
        'event_type', null
      );
    end if;

    update public.business_activity_demand_signals
    set
      status = 'withdrawn',
      withdrawn_at = v_now
    where organization_id = p_organization_id
      and id = v_demand.id
    returning * into v_demand;

    insert into public.business_activity_qualification_events (
      organization_id,
      business_activity_id,
      qualification_id,
      event_type,
      actor_user_id,
      actor_member_id,
      payload
    )
    values (
      p_organization_id,
      p_business_activity_id,
      v_qualification.id,
      'waitlist_withdrawn',
      p_actor_user_id,
      p_actor_member_id,
      jsonb_build_object(
        'demand_signal_id', v_demand.id,
        'taxonomy_target_id', v_demand.taxonomy_target_id
      )
    )
    returning id into v_event_id;

    return jsonb_build_object(
      'ok', true,
      'idempotent', false,
      'qualification_id', v_qualification.id,
      'demand_signal_id', v_demand.id,
      'decision_id', null,
      'answer_id', null,
      'event_id', v_event_id,
      'event_type', 'waitlist_withdrawn'
    );
  end if;

  return jsonb_build_object(
    'ok', false,
    'code', 'DATABASE_WRITE_ERROR',
    'message', 'Unhandled BQA mutation operation'
  );
end;
$$;

revoke all on function public.apply_business_qualification_mutation(text, uuid, uuid, uuid, uuid, jsonb) from public;
revoke all on function public.apply_business_qualification_mutation(text, uuid, uuid, uuid, uuid, jsonb) from anon;
revoke all on function public.apply_business_qualification_mutation(text, uuid, uuid, uuid, uuid, jsonb) from authenticated;
revoke all on function public.apply_business_qualification_mutation(text, uuid, uuid, uuid, uuid, jsonb) from service_role;
grant execute on function public.apply_business_qualification_mutation(text, uuid, uuid, uuid, uuid, jsonb) to service_role;

comment on function public.apply_business_qualification_mutation(text, uuid, uuid, uuid, uuid, jsonb) is
  'BQA-1E atomic qualification/classification/support/admission/demand mutations. Privileged execute only. Not caller authorization. Does not mutate Activity, Context assignment, readiness, or Path B.';
