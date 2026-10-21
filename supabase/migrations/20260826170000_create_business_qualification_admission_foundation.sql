-- ZyntixAI BQA-1C — Business Qualification & Admission database foundation.
--
-- Additive tenant schema only. No backfill. No Production apply.
-- Does not alter organizations, TAX, CAP, CTX, onboarding, invitations, or Social.
-- Does not mutate organization_business_activities or organization_context_assignments.
-- Does not call apply_organization_context_platform_mutation.
-- Does not encode Open Beta readiness policy beyond forbidding admitted+open_beta.
-- CAP readiness is not a v1 admission gate: no capability columns.

create or replace function private.guard_business_activity_qualification_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'business activity qualification events are immutable'
    using errcode = 'P0001';
end;
$$;

comment on function private.guard_business_activity_qualification_event_immutable() is
  'BQA-1C: append-only protection for qualification events. Not a public RPC.';

revoke all on function private.guard_business_activity_qualification_event_immutable() from public;
revoke all on function private.guard_business_activity_qualification_event_immutable() from anon;
revoke all on function private.guard_business_activity_qualification_event_immutable() from authenticated;
revoke all on function private.guard_business_activity_qualification_event_immutable() from service_role;

create or replace function private.lookup_bqa_taxonomy_target_key(
  p_kind text,
  p_id uuid
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_key text;
begin
  if p_kind is null or p_id is null then
    return null;
  end if;

  if p_kind = 'foundation' then
    select t.key into v_key
    from public.taxonomy_foundations as t
    where t.id = p_id;
  elsif p_kind = 'industry' then
    select t.key into v_key
    from public.taxonomy_industries as t
    where t.id = p_id;
  elsif p_kind = 'niche' then
    select t.key into v_key
    from public.taxonomy_niches as t
    where t.id = p_id;
  elsif p_kind = 'specialization' then
    select t.key into v_key
    from public.taxonomy_specializations as t
    where t.id = p_id;
  elsif p_kind = 'deep_specialization' then
    select t.key into v_key
    from public.taxonomy_deep_specializations as t
    where t.id = p_id;
  else
    return null;
  end if;

  return v_key;
end;
$$;

comment on function private.lookup_bqa_taxonomy_target_key(text, uuid) is
  'BQA-1C: structural TAX id/kind/key existence lookup. Does not duplicate parent-path or lifecycle policy. Not a public RPC.';

revoke all on function private.lookup_bqa_taxonomy_target_key(text, uuid) from public;
revoke all on function private.lookup_bqa_taxonomy_target_key(text, uuid) from anon;
revoke all on function private.lookup_bqa_taxonomy_target_key(text, uuid) from authenticated;
revoke all on function private.lookup_bqa_taxonomy_target_key(text, uuid) from service_role;

create or replace function private.enforce_business_activity_qualification_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_activity_id uuid;
  v_qualification_id uuid;
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id then
      raise exception 'BQA: qualification id is immutable'
        using errcode = 'P0001';
    end if;
    if old.organization_id is distinct from new.organization_id then
      raise exception 'BQA: qualification organization_id is immutable'
        using errcode = 'P0001';
    end if;
    if old.business_activity_id is distinct from new.business_activity_id then
      raise exception 'BQA: qualification business_activity_id is immutable'
        using errcode = 'P0001';
    end if;
  end if;

  if new.current_classification_decision_id is not null then
    select d.business_activity_id, d.qualification_id
      into v_activity_id, v_qualification_id
    from public.business_activity_classification_decisions as d
    where d.organization_id = new.organization_id
      and d.id = new.current_classification_decision_id;

    if not found
      or v_activity_id is distinct from new.business_activity_id
      or v_qualification_id is distinct from new.id
    then
      raise exception 'BQA: current classification pointer must belong to this qualification'
        using errcode = 'P0001';
    end if;
  end if;

  if new.current_support_assessment_id is not null then
    select s.business_activity_id, s.qualification_id
      into v_activity_id, v_qualification_id
    from public.business_activity_support_assessments as s
    where s.organization_id = new.organization_id
      and s.id = new.current_support_assessment_id;

    if not found
      or v_activity_id is distinct from new.business_activity_id
      or v_qualification_id is distinct from new.id
    then
      raise exception 'BQA: current support pointer must belong to this qualification'
        using errcode = 'P0001';
    end if;
  end if;

  if new.current_admission_decision_id is not null then
    select a.business_activity_id, a.qualification_id
      into v_activity_id, v_qualification_id
    from public.business_activity_admission_decisions as a
    where a.organization_id = new.organization_id
      and a.id = new.current_admission_decision_id;

    if not found
      or v_activity_id is distinct from new.business_activity_id
      or v_qualification_id is distinct from new.id
    then
      raise exception 'BQA: current admission pointer must belong to this qualification'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.enforce_business_activity_qualification_identity() is
  'BQA-1C: freeze qualification identity and current-pointer same-aggregate integrity. Not a public RPC.';

revoke all on function private.enforce_business_activity_qualification_identity() from public;
revoke all on function private.enforce_business_activity_qualification_identity() from anon;
revoke all on function private.enforce_business_activity_qualification_identity() from authenticated;
revoke all on function private.enforce_business_activity_qualification_identity() from service_role;

create or replace function private.enforce_business_activity_qualification_answer_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.organization_id is distinct from new.organization_id
      or old.business_activity_id is distinct from new.business_activity_id
      or old.qualification_id is distinct from new.qualification_id
      or old.question_key is distinct from new.question_key
    then
      raise exception 'BQA: answer identity is immutable'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.enforce_business_activity_qualification_answer_identity() is
  'BQA-1C: freeze answer identity. Current values remain mutable. Not a public RPC.';

revoke all on function private.enforce_business_activity_qualification_answer_identity() from public;
revoke all on function private.enforce_business_activity_qualification_answer_identity() from anon;
revoke all on function private.enforce_business_activity_qualification_answer_identity() from authenticated;
revoke all on function private.enforce_business_activity_qualification_answer_identity() from service_role;

create or replace function private.enforce_business_activity_classification_decision_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
  v_activity_id uuid;
  v_qualification_id uuid;
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.organization_id is distinct from new.organization_id
      or old.business_activity_id is distinct from new.business_activity_id
      or old.qualification_id is distinct from new.qualification_id
      or old.taxonomy_release_id is distinct from new.taxonomy_release_id
      or old.taxonomy_target_kind is distinct from new.taxonomy_target_kind
      or old.taxonomy_target_id is distinct from new.taxonomy_target_id
      or old.taxonomy_target_key is distinct from new.taxonomy_target_key
      or old.classification_outcome is distinct from new.classification_outcome
      or old.confidence_band is distinct from new.confidence_band
      or old.proposal_source is distinct from new.proposal_source
      or old.decision_source is distinct from new.decision_source
      or old.confirmed_by_user_id is distinct from new.confirmed_by_user_id
      or old.confirmed_at is distinct from new.confirmed_at
      or old.alternative_target_ids is distinct from new.alternative_target_ids
      or old.unresolved_dimension_codes is distinct from new.unresolved_dimension_codes
      or old.evidence_snapshot is distinct from new.evidence_snapshot
      or old.created_at is distinct from new.created_at
      or old.supersedes_decision_id is distinct from new.supersedes_decision_id
    then
      raise exception 'BQA: classification decision identity is immutable'
        using errcode = 'P0001';
    end if;

    if old.decision_status = 'superseded' then
      raise exception 'BQA: superseded classification decisions cannot change'
        using errcode = 'P0001';
    end if;

    if not (
      new.decision_status = 'superseded'
      and old.decision_status in ('proposed', 'confirmed')
    ) then
      raise exception 'BQA: classification decision_status may only move to superseded'
        using errcode = 'P0001';
    end if;

    return new;
  end if;

  if new.taxonomy_target_id is not null then
    v_key := private.lookup_bqa_taxonomy_target_key(
      new.taxonomy_target_kind,
      new.taxonomy_target_id
    );

    if v_key is null then
      raise exception 'BQA: taxonomy target does not exist for kind'
        using errcode = 'P0001';
    end if;

    if new.taxonomy_target_key is distinct from v_key then
      raise exception 'BQA: taxonomy_target_key snapshot must match canonical TAX key'
        using errcode = 'P0001';
    end if;
  end if;

  if new.supersedes_decision_id is not null then
    if new.supersedes_decision_id = new.id then
      raise exception 'BQA: classification decision cannot supersede itself'
        using errcode = 'P0001';
    end if;

    select d.business_activity_id, d.qualification_id
      into v_activity_id, v_qualification_id
    from public.business_activity_classification_decisions as d
    where d.organization_id = new.organization_id
      and d.id = new.supersedes_decision_id;

    if not found
      or v_activity_id is distinct from new.business_activity_id
      or v_qualification_id is distinct from new.qualification_id
    then
      raise exception 'BQA: supersedes_decision_id must belong to the same qualification'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.enforce_business_activity_classification_decision_integrity() is
  'BQA-1C: freeze classification identity except supersede; structural TAX id/kind/key check. Does not mutate Activities. Not a public RPC.';

revoke all on function private.enforce_business_activity_classification_decision_integrity() from public;
revoke all on function private.enforce_business_activity_classification_decision_integrity() from anon;
revoke all on function private.enforce_business_activity_classification_decision_integrity() from authenticated;
revoke all on function private.enforce_business_activity_classification_decision_integrity() from service_role;

create or replace function private.enforce_business_activity_support_assessment_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pack_id uuid;
  v_activity_id uuid;
  v_qualification_id uuid;
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.organization_id is distinct from new.organization_id
      or old.business_activity_id is distinct from new.business_activity_id
      or old.qualification_id is distinct from new.qualification_id
      or old.classification_decision_id is distinct from new.classification_decision_id
      or old.rollout_mode is distinct from new.rollout_mode
      or old.support_status is distinct from new.support_status
      or old.reason_code is distinct from new.reason_code
      or old.context_pack_id is distinct from new.context_pack_id
      or old.context_pack_version_id is distinct from new.context_pack_version_id
      or old.context_readiness is distinct from new.context_readiness
      or old.architecture_gap is distinct from new.architecture_gap
      or old.assessed_at is distinct from new.assessed_at
    then
      raise exception 'BQA: support assessment identity is immutable'
        using errcode = 'P0001';
    end if;

    if old.superseded_at is not null then
      raise exception 'BQA: superseded support assessments cannot change'
        using errcode = 'P0001';
    end if;

    if new.superseded_at is null then
      raise exception 'BQA: support assessments may only be superseded'
        using errcode = 'P0001';
    end if;

    return new;
  end if;

  if new.classification_decision_id is not null then
    select d.business_activity_id, d.qualification_id
      into v_activity_id, v_qualification_id
    from public.business_activity_classification_decisions as d
    where d.organization_id = new.organization_id
      and d.id = new.classification_decision_id;

    if not found
      or v_activity_id is distinct from new.business_activity_id
      or v_qualification_id is distinct from new.qualification_id
    then
      raise exception 'BQA: support classification_decision_id must belong to the same qualification'
        using errcode = 'P0001';
    end if;
  end if;

  if new.context_pack_version_id is not null then
    select v.pack_id
      into v_pack_id
    from public.context_pack_versions as v
    where v.id = new.context_pack_version_id;

    if v_pack_id is null then
      raise exception 'BQA: context pack version not found'
        using errcode = 'P0001';
    end if;

    if new.context_pack_id is distinct from v_pack_id then
      raise exception 'BQA: context_pack_id must match the observed version pack'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.enforce_business_activity_support_assessment_integrity() is
  'BQA-1C: freeze support snapshots except supersede; pack/version coherence. Does not assign Context. Not a public RPC.';

revoke all on function private.enforce_business_activity_support_assessment_integrity() from public;
revoke all on function private.enforce_business_activity_support_assessment_integrity() from anon;
revoke all on function private.enforce_business_activity_support_assessment_integrity() from authenticated;
revoke all on function private.enforce_business_activity_support_assessment_integrity() from service_role;

create or replace function private.enforce_business_activity_admission_decision_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_activity_id uuid;
  v_qualification_id uuid;
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.organization_id is distinct from new.organization_id
      or old.business_activity_id is distinct from new.business_activity_id
      or old.qualification_id is distinct from new.qualification_id
      or old.support_assessment_id is distinct from new.support_assessment_id
      or old.rollout_mode is distinct from new.rollout_mode
      or old.admission_status is distinct from new.admission_status
      or old.reason_code is distinct from new.reason_code
      or old.decision_source is distinct from new.decision_source
      or old.actor_user_id is distinct from new.actor_user_id
      or old.decided_at is distinct from new.decided_at
    then
      raise exception 'BQA: admission decision identity is immutable'
        using errcode = 'P0001';
    end if;

    if old.superseded_at is not null then
      raise exception 'BQA: superseded admission decisions cannot change'
        using errcode = 'P0001';
    end if;

    if new.superseded_at is null then
      raise exception 'BQA: admission decisions may only be superseded'
        using errcode = 'P0001';
    end if;

    return new;
  end if;

  if new.support_assessment_id is not null then
    select s.business_activity_id, s.qualification_id
      into v_activity_id, v_qualification_id
    from public.business_activity_support_assessments as s
    where s.organization_id = new.organization_id
      and s.id = new.support_assessment_id;

    if not found
      or v_activity_id is distinct from new.business_activity_id
      or v_qualification_id is distinct from new.qualification_id
    then
      raise exception 'BQA: admission support_assessment_id must belong to the same qualification'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.enforce_business_activity_admission_decision_integrity() is
  'BQA-1C: freeze admission snapshots except supersede. Does not grant identity, membership, or entitlement. Not a public RPC.';

revoke all on function private.enforce_business_activity_admission_decision_integrity() from public;
revoke all on function private.enforce_business_activity_admission_decision_integrity() from anon;
revoke all on function private.enforce_business_activity_admission_decision_integrity() from authenticated;
revoke all on function private.enforce_business_activity_admission_decision_integrity() from service_role;

create or replace function private.enforce_business_activity_demand_signal_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_key text;
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.organization_id is distinct from new.organization_id
      or old.business_activity_id is distinct from new.business_activity_id
      or old.taxonomy_target_kind is distinct from new.taxonomy_target_kind
      or old.taxonomy_target_id is distinct from new.taxonomy_target_id
      or old.taxonomy_target_key is distinct from new.taxonomy_target_key
      or old.requested_rollout is distinct from new.requested_rollout
      or old.created_at is distinct from new.created_at
    then
      raise exception 'BQA: demand signal identity is immutable'
        using errcode = 'P0001';
    end if;

    return new;
  end if;

  v_key := private.lookup_bqa_taxonomy_target_key(
    new.taxonomy_target_kind,
    new.taxonomy_target_id
  );

  if v_key is null then
    raise exception 'BQA: demand signal taxonomy target does not exist for kind'
      using errcode = 'P0001';
  end if;

  if new.taxonomy_target_key is distinct from v_key then
    raise exception 'BQA: demand taxonomy_target_key snapshot must match canonical TAX key'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function private.enforce_business_activity_demand_signal_integrity() is
  'BQA-1C: freeze demand identity except lifecycle fields; structural TAX check. Not a public RPC.';

revoke all on function private.enforce_business_activity_demand_signal_integrity() from public;
revoke all on function private.enforce_business_activity_demand_signal_integrity() from anon;
revoke all on function private.enforce_business_activity_demand_signal_integrity() from authenticated;
revoke all on function private.enforce_business_activity_demand_signal_integrity() from service_role;

create table public.business_activity_qualifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid not null,
  progress_status text not null default 'unstarted',
  review_status text not null default 'none',
  split_recommended boolean not null default false,
  current_classification_decision_id uuid,
  current_support_assessment_id uuid,
  current_admission_decision_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint business_activity_qualifications_org_id_unique unique (
    organization_id,
    id
  ),
  constraint business_activity_qualifications_activity_unique unique (
    organization_id,
    business_activity_id
  ),
  constraint business_activity_qualifications_progress_status_check check (
    progress_status in (
      'unstarted',
      'collecting',
      'awaiting_confirmation',
      'needs_review',
      'confirmed',
      'requalifying'
    )
  ),
  constraint business_activity_qualifications_review_status_check check (
    review_status in (
      'none',
      'required',
      'requested',
      'resolved_proceed',
      'resolved_reject'
    )
  ),
  constraint business_activity_qualifications_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint business_activity_qualifications_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict
);

comment on table public.business_activity_qualifications is
  'One long-lived BQA aggregate per Business Activity. Owns progress and review only. Not classification, support, admission, entitlement, or Context assignment.';
comment on column public.business_activity_qualifications.progress_status is
  'Qualification workflow only. Not a combined classification/support/admission status.';
comment on column public.business_activity_qualifications.review_status is
  'Risk-based review state. No ReviewRequest table in v1.';
comment on column public.business_activity_qualifications.current_classification_decision_id is
  'Mutable pointer. Historical truth stays on classification decision rows.';

create table public.business_activity_qualification_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid not null,
  qualification_id uuid not null,
  question_key text not null,
  value_kind text not null,
  value_text text,
  value_code text,
  source text not null,
  actor_user_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint business_activity_qualification_answers_org_id_unique unique (
    organization_id,
    id
  ),
  constraint business_activity_qualification_answers_current_unique unique (
    qualification_id,
    question_key
  ),
  constraint business_activity_qualification_answers_question_key_check check (
    question_key = lower(btrim(question_key))
    and char_length(question_key) between 2 and 80
    and question_key ~ '^[a-z][a-z0-9_]*$'
  ),
  constraint business_activity_qualification_answers_value_kind_check check (
    value_kind in ('text', 'code')
  ),
  constraint business_activity_qualification_answers_value_xor_check check (
    (
      value_kind = 'text'
      and value_text is not null
      and char_length(btrim(value_text)) between 1 and 8000
      and value_code is null
    )
    or (
      value_kind = 'code'
      and value_code is not null
      and value_code = lower(btrim(value_code))
      and char_length(value_code) between 2 and 80
      and value_code ~ '^[a-z][a-z0-9_]*$'
      and value_text is null
    )
  ),
  constraint business_activity_qualification_answers_frozen_keys_check check (
    (
      question_key <> 'activity_description'
      or value_kind = 'text'
    )
    and (
      question_key <> 'primary_value_delivered'
      or (
        value_kind = 'code'
        and value_code in (
          'structured_programs',
          'individualized_service',
          'physical_product',
          'digital_product',
          'field_work'
        )
      )
    )
    and (
      question_key <> 'line_structure'
      or (
        value_kind = 'code'
        and value_code in ('one_line', 'several_lines')
      )
    )
  ),
  constraint business_activity_qualification_answers_source_check check (
    source in (
      'user_self',
      'organization_admin',
      'support_assisted',
      'ai_proposal'
    )
  ),
  constraint business_activity_qualification_answers_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint business_activity_qualification_answers_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict,
  constraint business_activity_qualification_answers_qualification_fk foreign key (
    organization_id,
    qualification_id
  )
    references public.business_activity_qualifications (organization_id, id)
    on delete restrict,
  constraint business_activity_qualification_answers_actor_user_fk foreign key (
    actor_user_id
  )
    references public.profiles (id)
    on delete set null
);

comment on table public.business_activity_qualification_answers is
  'Current answer truth by stable semantic question_key. No question CMS. Mutation history lives in BQA events.';
comment on column public.business_activity_qualification_answers.question_key is
  'Domain-owned machine key. Unknown keys are rejected by later server commands; adaptive keys remain expandable.';

create table public.business_activity_classification_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid not null,
  qualification_id uuid not null,
  taxonomy_release_id uuid not null,
  taxonomy_target_kind text,
  taxonomy_target_id uuid,
  taxonomy_target_key text,
  classification_outcome text not null,
  confidence_band text not null,
  decision_status text not null,
  proposal_source text not null,
  decision_source text,
  confirmed_by_user_id uuid,
  confirmed_at timestamptz,
  alternative_target_ids uuid[] not null default '{}'::uuid[],
  unresolved_dimension_codes text[] not null default '{}'::text[],
  evidence_snapshot jsonb not null default '{}'::jsonb,
  supersedes_decision_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  superseded_at timestamptz,
  constraint business_activity_classification_decisions_org_id_unique unique (
    organization_id,
    id
  ),
  constraint business_activity_classification_decisions_outcome_check check (
    classification_outcome in (
      'classified',
      'ambiguous',
      'unknown',
      'architecture_gap'
    )
  ),
  constraint business_activity_classification_decisions_confidence_check check (
    confidence_band in ('high', 'medium', 'low', 'none')
  ),
  constraint business_activity_classification_decisions_status_check check (
    decision_status in ('proposed', 'confirmed', 'superseded')
  ),
  constraint business_activity_classification_decisions_proposal_source_check check (
    proposal_source in (
      'ai_proposal',
      'user_self',
      'organization_admin',
      'support_assisted',
      'platform_review',
      'migration'
    )
  ),
  constraint business_activity_classification_decisions_decision_source_check check (
    decision_source is null
    or decision_source in (
      'user_self',
      'organization_admin',
      'support_assisted',
      'platform_review',
      'migration'
    )
  ),
  constraint business_activity_classification_decisions_kind_check check (
    taxonomy_target_kind is null
    or taxonomy_target_kind in (
      'foundation',
      'industry',
      'niche',
      'specialization',
      'deep_specialization'
    )
  ),
  constraint business_activity_classification_decisions_target_pair_check check (
    (
      taxonomy_target_id is null
      and taxonomy_target_kind is null
      and taxonomy_target_key is null
    )
    or (
      taxonomy_target_id is not null
      and taxonomy_target_kind is not null
      and taxonomy_target_key is not null
      and char_length(btrim(taxonomy_target_key)) between 1 and 80
    )
  ),
  constraint business_activity_classification_decisions_classified_target_check check (
    classification_outcome <> 'classified'
    or (
      taxonomy_target_id is not null
      and taxonomy_target_kind is not null
      and taxonomy_target_key is not null
    )
  ),
  constraint business_activity_classification_decisions_confirmed_fields_check check (
    decision_status <> 'confirmed'
    or (
      classification_outcome = 'classified'
      and decision_source is not null
      and confirmed_by_user_id is not null
      and confirmed_at is not null
      and taxonomy_target_id is not null
    )
  ),
  constraint business_activity_classification_decisions_superseded_fields_check check (
    (
      decision_status = 'superseded'
      and superseded_at is not null
    )
    or (
      decision_status <> 'superseded'
      and superseded_at is null
    )
  ),
  constraint business_activity_classification_decisions_self_supersede_check check (
    supersedes_decision_id is distinct from id
  ),
  constraint business_activity_classification_decisions_evidence_object_check check (
    jsonb_typeof(evidence_snapshot) = 'object'
  ),
  constraint business_activity_classification_decisions_evidence_keys_check check (
    not (
      evidence_snapshot ?| array[
        'chain_of_thought',
        'prompt',
        'reasoning',
        'raw_model_output'
      ]
    )
  ),
  constraint business_activity_classification_decisions_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint business_activity_classification_decisions_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict,
  constraint business_activity_classification_decisions_qualification_fk foreign key (
    organization_id,
    qualification_id
  )
    references public.business_activity_qualifications (organization_id, id)
    on delete restrict,
  constraint business_activity_classification_decisions_release_fk foreign key (
    taxonomy_release_id
  )
    references public.taxonomy_releases (id)
    on delete restrict,
  constraint business_activity_classification_decisions_confirmed_by_fk foreign key (
    confirmed_by_user_id
  )
    references public.profiles (id)
    on delete restrict,
  constraint business_activity_classification_decisions_supersedes_fk foreign key (
    organization_id,
    supersedes_decision_id
  )
    references public.business_activity_classification_decisions (organization_id, id)
    on delete restrict
);

comment on table public.business_activity_classification_decisions is
  'Historical TAX classification decisions. Confirmed rows are never silently overwritten. Not ORG-CONTEXT Activity mutation.';
comment on column public.business_activity_classification_decisions.taxonomy_target_id is
  'Canonical TAX node id. Kind/id/key coherence is checked structurally; parent-path and lifecycle policy remain Control Plane / later server validation.';
comment on column public.business_activity_classification_decisions.taxonomy_target_key is
  'Audit snapshot of the canonical TAX key. Not an alternate identity.';
comment on column public.business_activity_classification_decisions.proposal_source is
  'How the candidate appeared. AI may be ai_proposal.';
comment on column public.business_activity_classification_decisions.decision_source is
  'Confirmation authority. Never ai_proposal. Null until confirmed.';
comment on column public.business_activity_classification_decisions.confidence_band is
  'Canonical band only. No numeric AI score. AI score is not confirmation.';

create table public.business_activity_support_assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid not null,
  qualification_id uuid not null,
  classification_decision_id uuid,
  rollout_mode text not null,
  support_status text not null,
  reason_code text not null,
  context_pack_id uuid,
  context_pack_version_id uuid,
  context_readiness text,
  architecture_gap boolean not null default false,
  assessed_at timestamptz not null default pg_catalog.now(),
  superseded_at timestamptz,
  constraint business_activity_support_assessments_org_id_unique unique (
    organization_id,
    id
  ),
  constraint business_activity_support_assessments_rollout_mode_check check (
    rollout_mode in (
      'internal_qa',
      'closed_beta',
      'production',
      'open_beta'
    )
  ),
  constraint business_activity_support_assessments_status_check check (
    support_status in (
      'supported_for_requested_rollout',
      'not_yet_supported',
      'unsupported',
      'unknown',
      'needs_review'
    )
  ),
  constraint business_activity_support_assessments_reason_check check (
    reason_code in (
      'eligible',
      'missing_context_pack',
      'no_published_context_version',
      'context_readiness_insufficient',
      'architecture_gap',
      'classification_unknown',
      'classification_ambiguous',
      'review_required',
      'open_beta_policy_undefined'
    )
  ),
  constraint business_activity_support_assessments_readiness_check check (
    context_readiness is null
    or context_readiness in (
      'planned',
      'context_ready',
      'beta_supported',
      'production_verified'
    )
  ),
  constraint business_activity_support_assessments_eligible_context_check check (
    support_status <> 'supported_for_requested_rollout'
    or (
      reason_code = 'eligible'
      and context_pack_id is not null
      and context_pack_version_id is not null
      and context_readiness is not null
    )
  ),
  constraint business_activity_support_assessments_open_beta_check check (
    reason_code <> 'open_beta_policy_undefined'
    or support_status <> 'supported_for_requested_rollout'
  ),
  constraint business_activity_support_assessments_missing_pack_check check (
    reason_code <> 'missing_context_pack'
    or context_pack_version_id is null
  ),
  constraint business_activity_support_assessments_superseded_fields_check check (
    superseded_at is null
    or superseded_at >= assessed_at
  ),
  constraint business_activity_support_assessments_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint business_activity_support_assessments_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict,
  constraint business_activity_support_assessments_qualification_fk foreign key (
    organization_id,
    qualification_id
  )
    references public.business_activity_qualifications (organization_id, id)
    on delete restrict,
  constraint business_activity_support_assessments_classification_fk foreign key (
    organization_id,
    classification_decision_id
  )
    references public.business_activity_classification_decisions (organization_id, id)
    on delete restrict,
  constraint business_activity_support_assessments_pack_fk foreign key (
    context_pack_id
  )
    references public.context_packs (id)
    on delete restrict,
  constraint business_activity_support_assessments_version_fk foreign key (
    context_pack_version_id
  )
    references public.context_pack_versions (id)
    on delete restrict
);

comment on table public.business_activity_support_assessments is
  'Observed catalog support snapshot at assessed_at. Not the active organization_context_assignment. Pack/version may be null when missing.';
comment on column public.business_activity_support_assessments.context_pack_version_id is
  'Observed exact Context version when present. Never an auto-upgrade or assignment pin.';
comment on column public.business_activity_support_assessments.context_readiness is
  'Observed readiness snapshot. Closed Beta customer eligibility is later server policy, not an assignment trigger.';

create table public.business_activity_admission_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid not null,
  qualification_id uuid not null,
  support_assessment_id uuid,
  rollout_mode text not null,
  admission_status text not null,
  reason_code text not null,
  decision_source text not null,
  actor_user_id uuid,
  decided_at timestamptz not null default pg_catalog.now(),
  superseded_at timestamptz,
  constraint business_activity_admission_decisions_org_id_unique unique (
    organization_id,
    id
  ),
  constraint business_activity_admission_decisions_rollout_mode_check check (
    rollout_mode in (
      'internal_qa',
      'closed_beta',
      'production',
      'open_beta'
    )
  ),
  constraint business_activity_admission_decisions_status_check check (
    admission_status in (
      'incomplete',
      'needs_review',
      'waitlisted',
      'not_yet_supported',
      'unsupported',
      'admitted',
      'rejected',
      'blocked'
    )
  ),
  constraint business_activity_admission_decisions_reason_check check (
    reason_code in (
      'eligible',
      'incomplete_answers',
      'confirmation_required',
      'review_required',
      'waitlisted_not_eligible',
      'not_yet_supported',
      'unsupported',
      'blocked_integrity',
      'blocked_policy',
      'rejected_by_review',
      'path_b_independent'
    )
  ),
  constraint business_activity_admission_decisions_decision_source_check check (
    decision_source in (
      'user_self',
      'organization_admin',
      'support_assisted',
      'platform_review',
      'migration'
    )
  ),
  constraint business_activity_admission_decisions_admitted_fields_check check (
    admission_status <> 'admitted'
    or (
      reason_code = 'eligible'
      and support_assessment_id is not null
      and actor_user_id is not null
    )
  ),
  constraint business_activity_admission_decisions_open_beta_not_admitted_check check (
    not (
      admission_status = 'admitted'
      and rollout_mode = 'open_beta'
    )
  ),
  constraint business_activity_admission_decisions_superseded_fields_check check (
    superseded_at is null
    or superseded_at >= decided_at
  ),
  constraint business_activity_admission_decisions_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint business_activity_admission_decisions_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict,
  constraint business_activity_admission_decisions_qualification_fk foreign key (
    organization_id,
    qualification_id
  )
    references public.business_activity_qualifications (organization_id, id)
    on delete restrict,
  constraint business_activity_admission_decisions_support_fk foreign key (
    organization_id,
    support_assessment_id
  )
    references public.business_activity_support_assessments (organization_id, id)
    on delete restrict,
  constraint business_activity_admission_decisions_actor_user_fk foreign key (
    actor_user_id
  )
    references public.profiles (id)
    on delete restrict
);

comment on table public.business_activity_admission_decisions is
  'Orthogonal admission_status + rollout_mode + reason_code. Not login, membership, invitation, permission, entitlement, or capability execution.';
comment on column public.business_activity_admission_decisions.rollout_mode is
  'Requested/decided rollout. open_beta is representable; v1 cannot admit it because policy is undefined.';

create table public.business_activity_qualification_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid not null,
  qualification_id uuid not null,
  event_type text not null,
  actor_user_id uuid,
  actor_member_id uuid,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint business_activity_qualification_events_org_id_unique unique (
    organization_id,
    id
  ),
  constraint business_activity_qualification_events_event_type_check check (
    event_type in (
      'qualification_started',
      'answer_saved',
      'classification_proposed',
      'classification_confirmed',
      'classification_superseded',
      'review_requested',
      'review_resolved',
      'support_assessed',
      'admission_decided',
      'waitlist_joined',
      'waitlist_withdrawn',
      'split_recommended',
      'assignment_handoff_requested',
      'assignment_handoff_completed',
      'requalify_started'
    )
  ),
  constraint business_activity_qualification_events_payload_object_check check (
    jsonb_typeof(payload) = 'object'
  ),
  constraint business_activity_qualification_events_payload_keys_check check (
    not (
      payload ?| array[
        'chain_of_thought',
        'prompt',
        'reasoning',
        'raw_model_output'
      ]
    )
  ),
  constraint business_activity_qualification_events_idempotency_key_check check (
    idempotency_key is null
    or (
      char_length(btrim(idempotency_key)) between 8 and 128
      and idempotency_key = btrim(idempotency_key)
    )
  ),
  constraint business_activity_qualification_events_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint business_activity_qualification_events_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict,
  constraint business_activity_qualification_events_qualification_fk foreign key (
    organization_id,
    qualification_id
  )
    references public.business_activity_qualifications (organization_id, id)
    on delete restrict,
  constraint business_activity_qualification_events_actor_user_fk foreign key (
    actor_user_id
  )
    references public.profiles (id)
    on delete set null,
  constraint business_activity_qualification_events_actor_member_fk foreign key (
    organization_id,
    actor_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.business_activity_qualification_events is
  'Append-only BQA audit. No ordinary-read events. UPDATE/DELETE blocked. Activity archive does not cascade-delete this history.';

create table public.business_activity_demand_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid not null,
  taxonomy_target_kind text not null,
  taxonomy_target_id uuid not null,
  taxonomy_target_key text not null,
  requested_rollout text not null,
  status text not null,
  created_at timestamptz not null default pg_catalog.now(),
  last_confirmed_at timestamptz not null default pg_catalog.now(),
  withdrawn_at timestamptz,
  constraint business_activity_demand_signals_org_id_unique unique (
    organization_id,
    id
  ),
  constraint business_activity_demand_signals_kind_check check (
    taxonomy_target_kind in (
      'foundation',
      'industry',
      'niche',
      'specialization',
      'deep_specialization'
    )
  ),
  constraint business_activity_demand_signals_target_key_check check (
    char_length(btrim(taxonomy_target_key)) between 1 and 80
  ),
  constraint business_activity_demand_signals_rollout_check check (
    requested_rollout in (
      'internal_qa',
      'closed_beta',
      'production',
      'open_beta'
    )
  ),
  constraint business_activity_demand_signals_status_check check (
    status in ('active', 'withdrawn')
  ),
  constraint business_activity_demand_signals_withdrawn_fields_check check (
    (
      status = 'active'
      and withdrawn_at is null
    )
    or (
      status = 'withdrawn'
      and withdrawn_at is not null
    )
  ),
  constraint business_activity_demand_signals_organization_fk foreign key (
    organization_id
  )
    references public.organizations (id)
    on delete restrict,
  constraint business_activity_demand_signals_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict
);

comment on table public.business_activity_demand_signals is
  'Minimal tenant-scoped waitlist/demand. One active signal per Activity + TAX target. No votes, TAX creation, Context creation, or admission.';

alter table public.business_activity_qualifications
  add constraint business_activity_qualifications_current_classification_fk
  foreign key (
    organization_id,
    current_classification_decision_id
  )
    references public.business_activity_classification_decisions (organization_id, id)
    on delete restrict;

alter table public.business_activity_qualifications
  add constraint business_activity_qualifications_current_support_fk
  foreign key (
    organization_id,
    current_support_assessment_id
  )
    references public.business_activity_support_assessments (organization_id, id)
    on delete restrict;

alter table public.business_activity_qualifications
  add constraint business_activity_qualifications_current_admission_fk
  foreign key (
    organization_id,
    current_admission_decision_id
  )
    references public.business_activity_admission_decisions (organization_id, id)
    on delete restrict;

create unique index business_activity_classification_decisions_one_confirmed_uidx
  on public.business_activity_classification_decisions (business_activity_id)
  where decision_status = 'confirmed';

create unique index business_activity_demand_signals_one_active_uidx
  on public.business_activity_demand_signals (
    business_activity_id,
    taxonomy_target_id
  )
  where status = 'active';

create unique index business_activity_qualification_events_idempotency_uidx
  on public.business_activity_qualification_events (
    organization_id,
    idempotency_key
  )
  where idempotency_key is not null;

create index business_activity_qualifications_organization_id_idx
  on public.business_activity_qualifications (organization_id);

create index business_activity_qualification_answers_organization_id_idx
  on public.business_activity_qualification_answers (organization_id);

create index business_activity_classification_decisions_qualification_id_idx
  on public.business_activity_classification_decisions (qualification_id);

create index business_activity_classification_decisions_organization_id_idx
  on public.business_activity_classification_decisions (organization_id);

create index business_activity_classification_decisions_taxonomy_target_idx
  on public.business_activity_classification_decisions (taxonomy_target_id)
  where taxonomy_target_id is not null;

create index business_activity_support_assessments_qualification_id_idx
  on public.business_activity_support_assessments (qualification_id);

create index business_activity_support_assessments_organization_id_idx
  on public.business_activity_support_assessments (organization_id);

create index business_activity_admission_decisions_qualification_id_idx
  on public.business_activity_admission_decisions (qualification_id);

create index business_activity_admission_decisions_organization_id_idx
  on public.business_activity_admission_decisions (organization_id);

create index business_activity_qualification_events_org_created_at_idx
  on public.business_activity_qualification_events (
    organization_id,
    created_at desc
  );

create index business_activity_qualification_events_qualification_id_idx
  on public.business_activity_qualification_events (qualification_id);

create index business_activity_demand_signals_organization_id_idx
  on public.business_activity_demand_signals (organization_id);

create index business_activity_demand_signals_taxonomy_target_idx
  on public.business_activity_demand_signals (taxonomy_target_id);

create trigger business_activity_qualifications_set_updated_at
  before update on public.business_activity_qualifications
  for each row
  execute function public.set_updated_at();

create trigger business_activity_qualification_answers_set_updated_at
  before update on public.business_activity_qualification_answers
  for each row
  execute function public.set_updated_at();

create trigger business_activity_qualifications_enforce_identity
  before insert or update on public.business_activity_qualifications
  for each row
  execute function private.enforce_business_activity_qualification_identity();

create trigger business_activity_qualification_answers_enforce_identity
  before insert or update on public.business_activity_qualification_answers
  for each row
  execute function private.enforce_business_activity_qualification_answer_identity();

create trigger business_activity_classification_decisions_enforce_integrity
  before insert or update on public.business_activity_classification_decisions
  for each row
  execute function private.enforce_business_activity_classification_decision_integrity();

create trigger business_activity_support_assessments_enforce_integrity
  before insert or update on public.business_activity_support_assessments
  for each row
  execute function private.enforce_business_activity_support_assessment_integrity();

create trigger business_activity_admission_decisions_enforce_integrity
  before insert or update on public.business_activity_admission_decisions
  for each row
  execute function private.enforce_business_activity_admission_decision_integrity();

create trigger business_activity_demand_signals_enforce_integrity
  before insert or update on public.business_activity_demand_signals
  for each row
  execute function private.enforce_business_activity_demand_signal_integrity();

create trigger business_activity_qualification_events_guard_immutable
  before update or delete on public.business_activity_qualification_events
  for each row
  execute function private.guard_business_activity_qualification_event_immutable();

alter table public.business_activity_qualifications enable row level security;
alter table public.business_activity_qualification_answers enable row level security;
alter table public.business_activity_classification_decisions enable row level security;
alter table public.business_activity_support_assessments enable row level security;
alter table public.business_activity_admission_decisions enable row level security;
alter table public.business_activity_qualification_events enable row level security;
alter table public.business_activity_demand_signals enable row level security;

revoke all on table public.business_activity_qualifications from public;
revoke all on table public.business_activity_qualifications from anon;
revoke all on table public.business_activity_qualifications from authenticated;
revoke all on table public.business_activity_qualifications from service_role;

revoke all on table public.business_activity_qualification_answers from public;
revoke all on table public.business_activity_qualification_answers from anon;
revoke all on table public.business_activity_qualification_answers from authenticated;
revoke all on table public.business_activity_qualification_answers from service_role;

revoke all on table public.business_activity_classification_decisions from public;
revoke all on table public.business_activity_classification_decisions from anon;
revoke all on table public.business_activity_classification_decisions from authenticated;
revoke all on table public.business_activity_classification_decisions from service_role;

revoke all on table public.business_activity_support_assessments from public;
revoke all on table public.business_activity_support_assessments from anon;
revoke all on table public.business_activity_support_assessments from authenticated;
revoke all on table public.business_activity_support_assessments from service_role;

revoke all on table public.business_activity_admission_decisions from public;
revoke all on table public.business_activity_admission_decisions from anon;
revoke all on table public.business_activity_admission_decisions from authenticated;
revoke all on table public.business_activity_admission_decisions from service_role;

revoke all on table public.business_activity_qualification_events from public;
revoke all on table public.business_activity_qualification_events from anon;
revoke all on table public.business_activity_qualification_events from authenticated;
revoke all on table public.business_activity_qualification_events from service_role;

revoke all on table public.business_activity_demand_signals from public;
revoke all on table public.business_activity_demand_signals from anon;
revoke all on table public.business_activity_demand_signals from authenticated;
revoke all on table public.business_activity_demand_signals from service_role;
