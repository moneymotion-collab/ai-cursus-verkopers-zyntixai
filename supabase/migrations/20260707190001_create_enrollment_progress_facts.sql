-- ZyntixAI D2 Progress Core M2: enrollment_progress_facts table, constraints, and indexes

create table public.enrollment_progress_facts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  enrollment_id uuid not null,
  customer_id uuid not null,
  program_id uuid not null,
  fact_type text not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default pg_catalog.now(),
  recorded_by_member_id uuid not null,
  source text not null,
  idempotency_key text,
  title text,
  description text,
  numeric_value numeric,
  numeric_unit text,
  is_complete boolean,
  sequence_number integer,
  corrected_from_fact_id uuid,
  voided_at timestamptz,
  voided_by_member_id uuid,
  void_reason text,
  constraint enrollment_progress_facts_org_enrollment_id_unique unique (organization_id, enrollment_id, id),
  constraint enrollment_progress_facts_fact_type_check check (
    fact_type in (
      'milestone_reached',
      'unit_completed',
      'session_attended',
      'assessment_completed',
      'manual_observation'
    )
  ),
  constraint enrollment_progress_facts_source_check check (
    source in ('manual', 'correction')
  ),
  constraint enrollment_progress_facts_source_correction_consistency_check check (
    (source = 'correction' and corrected_from_fact_id is not null)
    or (source = 'manual' and corrected_from_fact_id is null)
  ),
  constraint enrollment_progress_facts_sequence_positive_check check (
    sequence_number is null or sequence_number > 0
  ),
  constraint enrollment_progress_facts_numeric_unit_consistency_check check (
    numeric_unit is null or numeric_value is not null
  ),
  constraint enrollment_progress_facts_void_consistency_check check (
    (
      voided_at is null
      and voided_by_member_id is null
      and void_reason is null
    )
    or (
      voided_at is not null
      and voided_by_member_id is not null
      and nullif(btrim(void_reason), '') is not null
    )
  ),
  constraint enrollment_progress_facts_no_self_correction_check check (
    corrected_from_fact_id is null or corrected_from_fact_id <> id
  ),
  constraint enrollment_progress_facts_minimum_payload_check check (
    nullif(btrim(title), '') is not null
    or nullif(btrim(description), '') is not null
    or numeric_value is not null
    or is_complete is not null
    or sequence_number is not null
  ),
  constraint enrollment_progress_facts_organization_fk foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint enrollment_progress_facts_enrollment_tuple_fk foreign key (
    organization_id,
    enrollment_id,
    customer_id,
    program_id
  )
    references public.enrollments (organization_id, id, customer_id, program_id)
    on delete restrict,
  constraint enrollment_progress_facts_recorded_by_member_fk foreign key (
    organization_id,
    recorded_by_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint enrollment_progress_facts_voided_by_member_fk foreign key (
    organization_id,
    voided_by_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint enrollment_progress_facts_corrected_from_fk foreign key (
    organization_id,
    enrollment_id,
    corrected_from_fact_id
  )
    references public.enrollment_progress_facts (organization_id, enrollment_id, id)
    on delete restrict
);

comment on table public.enrollment_progress_facts is
  'Append-oriented canonical enrollment progress facts; mutations are RPC-only.';

create or replace function private.guard_enrollment_progress_lineage_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source is distinct from old.source
     or new.corrected_from_fact_id is distinct from old.corrected_from_fact_id then
    raise exception 'progress fact lineage is immutable';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_enrollment_progress_lineage_immutable() from public;

create or replace function private.guard_enrollment_progress_correction_acyclic()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cursor uuid;
  v_depth integer := 0;
begin
  if new.source <> 'correction' or new.corrected_from_fact_id is null then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.organization_id::text || ':' || new.enrollment_id::text, 0)
  );

  v_cursor := new.corrected_from_fact_id;
  while v_cursor is not null loop
    if v_cursor = new.id then
      raise exception 'correction cycle detected';
    end if;
    v_depth := v_depth + 1;
    if v_depth > 100000 then
      raise exception 'correction ancestry depth exceeded';
    end if;
    select epf.corrected_from_fact_id
    into v_cursor
    from public.enrollment_progress_facts as epf
    where epf.organization_id = new.organization_id
      and epf.enrollment_id = new.enrollment_id
      and epf.id = v_cursor;
  end loop;

  return new;
end;
$$;

revoke all on function private.guard_enrollment_progress_correction_acyclic() from public;

create trigger enrollment_progress_facts_guard_lineage_immutable
  before update on public.enrollment_progress_facts
  for each row
  execute function private.guard_enrollment_progress_lineage_immutable();

create constraint trigger enrollment_progress_facts_guard_correction_acyclic
  after insert or update of corrected_from_fact_id, source on public.enrollment_progress_facts
  deferrable initially deferred
  for each row
  execute function private.guard_enrollment_progress_correction_acyclic();

create index enrollment_progress_facts_enrollment_tuple_fk_idx
  on public.enrollment_progress_facts (organization_id, enrollment_id, customer_id, program_id);

create index enrollment_progress_facts_correction_parent_fk_idx
  on public.enrollment_progress_facts (organization_id, enrollment_id, corrected_from_fact_id);

create index enrollment_progress_facts_active_enrollment_timeline_idx
  on public.enrollment_progress_facts (organization_id, enrollment_id, occurred_at desc)
  where voided_at is null;

create index enrollment_progress_facts_active_enrollment_fact_type_idx
  on public.enrollment_progress_facts (organization_id, enrollment_id, fact_type)
  where voided_at is null;

create index enrollment_progress_facts_active_customer_rollup_idx
  on public.enrollment_progress_facts (organization_id, customer_id, occurred_at desc)
  where voided_at is null;

create index enrollment_progress_facts_active_program_rollup_idx
  on public.enrollment_progress_facts (organization_id, program_id, occurred_at desc)
  where voided_at is null;

create unique index enrollment_progress_facts_idempotency_uidx
  on public.enrollment_progress_facts (organization_id, enrollment_id, source, idempotency_key)
  where idempotency_key is not null;

create unique index enrollment_progress_facts_active_correction_from_uidx
  on public.enrollment_progress_facts (organization_id, corrected_from_fact_id)
  where corrected_from_fact_id is not null
    and voided_at is null;

grant select on public.enrollment_progress_facts to authenticated;
