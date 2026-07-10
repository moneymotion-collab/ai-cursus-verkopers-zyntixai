-- ZyntixAI D2 Progress Core M3: record_progress_fact and void_progress_fact RPCs

create or replace function public.record_progress_fact(
  p_organization_id uuid,
  p_enrollment_id uuid,
  p_fact_type text,
  p_occurred_at timestamptz,
  p_title text default null,
  p_description text default null,
  p_numeric_value numeric default null,
  p_numeric_unit text default null,
  p_is_complete boolean default null,
  p_sequence_number integer default null,
  p_idempotency_key text default null,
  p_corrected_from_fact_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_key text;
  v_enrollment_status text;
  v_enrollment_archived_at timestamptz;
  v_enrollment_customer_id uuid;
  v_enrollment_program_id uuid;
  v_enrollment_enrolled_at timestamptz;
  v_existing_id uuid;
  v_existing_voided_at timestamptz;
  v_replacement_id uuid;
  v_replacement_key text;
  v_replacement_enrollment_id uuid;
  v_predecessor_voided_at timestamptz;
  v_predecessor_enrollment_id uuid;
  v_new_id uuid;
  v_constraint text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_key := nullif(btrim(p_idempotency_key), '');

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null or v_member_role is null then
    raise exception 'active organization membership required';
  end if;

  if v_member_role = 'viewer' then
    raise exception 'insufficient role';
  end if;

  if v_member_role not in ('owner', 'admin', 'staff') then
    raise exception 'insufficient role';
  end if;

  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
  end if;

  if p_fact_type not in (
    'milestone_reached',
    'unit_completed',
    'session_attended',
    'assessment_completed',
    'manual_observation'
  ) then
    raise exception 'invalid fact type';
  end if;

  if nullif(btrim(p_title), '') is null
     and nullif(btrim(p_description), '') is null
     and p_numeric_value is null
     and p_is_complete is null
     and p_sequence_number is null then
    raise exception 'invalid progress payload for fact type';
  end if;

  if p_numeric_unit is not null and p_numeric_value is null then
    raise exception 'invalid progress payload for fact type';
  end if;

  if p_sequence_number is not null and p_sequence_number <= 0 then
    raise exception 'invalid progress payload for fact type';
  end if;

  if p_occurred_at > pg_catalog.now() + interval '5 minutes' then
    raise exception 'invalid progress payload for fact type';
  end if;

  if p_corrected_from_fact_id is not null then
    if v_key is null then
      raise exception 'correction idempotency key is required';
    end if;

    select epf.id, epf.voided_at
    into v_existing_id, v_existing_voided_at
    from public.enrollment_progress_facts as epf
    where epf.organization_id = p_organization_id
      and epf.enrollment_id = p_enrollment_id
      and epf.source = 'correction'
      and epf.idempotency_key = v_key
    limit 1;

    if found then
      if v_existing_voided_at is null then
        return v_existing_id;
      end if;

      raise exception 'idempotency key already consumed';
    end if;

    select e.status, e.archived_at, e.customer_id, e.program_id, e.enrolled_at
    into v_enrollment_status, v_enrollment_archived_at, v_enrollment_customer_id, v_enrollment_program_id, v_enrollment_enrolled_at
    from public.enrollments as e
    where e.organization_id = p_organization_id
      and e.id = p_enrollment_id
    for update;

    if not found then
      raise exception 'enrollment not found';
    end if;

    select epf.voided_at, epf.enrollment_id
    into v_predecessor_voided_at, v_predecessor_enrollment_id
    from public.enrollment_progress_facts as epf
    where epf.organization_id = p_organization_id
      and epf.id = p_corrected_from_fact_id
    for update;

    if not found then
      raise exception 'invalid correction reference';
    end if;

    select epf.id, epf.voided_at
    into v_existing_id, v_existing_voided_at
    from public.enrollment_progress_facts as epf
    where epf.organization_id = p_organization_id
      and epf.enrollment_id = p_enrollment_id
      and epf.source = 'correction'
      and epf.idempotency_key = v_key
    limit 1;

    if found then
      if v_existing_voided_at is null then
        return v_existing_id;
      end if;

      raise exception 'idempotency key already consumed';
    end if;

    select epf.id, epf.idempotency_key
    into v_replacement_id, v_replacement_key
    from public.enrollment_progress_facts as epf
    where epf.organization_id = p_organization_id
      and epf.enrollment_id = p_enrollment_id
      and epf.corrected_from_fact_id = p_corrected_from_fact_id
      and epf.voided_at is null
    limit 1;

    if found then
      if v_replacement_key = v_key then
        return v_replacement_id;
      end if;

      raise exception 'progress fact already has an active correction';
    end if;

    if v_predecessor_enrollment_id <> p_enrollment_id then
      raise exception 'invalid correction reference';
    end if;

    if v_predecessor_voided_at is not null then
      raise exception 'invalid correction reference';
    end if;

    if v_enrollment_archived_at is not null then
      raise exception 'enrollment not found';
    end if;

    if v_member_role in ('owner', 'admin') then
      if v_enrollment_status not in ('active', 'paused', 'completed', 'cancelled') then
        raise exception 'enrollment status does not allow progress';
      end if;
    elsif v_member_role = 'staff' then
      if v_enrollment_status not in ('active', 'paused') then
        raise exception 'enrollment status does not allow progress';
      end if;
    end if;

    if p_occurred_at < v_enrollment_enrolled_at then
      raise exception 'invalid progress payload for fact type';
    end if;

    begin
      update public.enrollment_progress_facts as epf
      set
        voided_at = pg_catalog.now(),
        voided_by_member_id = v_membership_id,
        void_reason = 'superseded by correction'
      where epf.organization_id = p_organization_id
        and epf.id = p_corrected_from_fact_id
        and epf.voided_at is null;

      insert into public.enrollment_progress_facts (
        organization_id,
        enrollment_id,
        customer_id,
        program_id,
        fact_type,
        occurred_at,
        recorded_by_member_id,
        source,
        idempotency_key,
        title,
        description,
        numeric_value,
        numeric_unit,
        is_complete,
        sequence_number,
        corrected_from_fact_id
      )
      values (
        p_organization_id,
        p_enrollment_id,
        v_enrollment_customer_id,
        v_enrollment_program_id,
        p_fact_type,
        p_occurred_at,
        v_membership_id,
        'correction',
        v_key,
        nullif(btrim(p_title), ''),
        nullif(btrim(p_description), ''),
        p_numeric_value,
        nullif(btrim(p_numeric_unit), ''),
        p_is_complete,
        p_sequence_number,
        p_corrected_from_fact_id
      )
      returning id into v_new_id;

      return v_new_id;
    exception
      when unique_violation then
        get stacked diagnostics v_constraint = constraint_name;

        if v_constraint = 'enrollment_progress_facts_idempotency_uidx' then
          select epf.id, epf.voided_at
          into v_existing_id, v_existing_voided_at
          from public.enrollment_progress_facts as epf
          where epf.organization_id = p_organization_id
            and epf.enrollment_id = p_enrollment_id
            and epf.source = 'correction'
            and epf.idempotency_key = v_key
          limit 1;

          if found and v_existing_voided_at is null then
            return v_existing_id;
          end if;

          raise exception 'idempotency key already consumed';
        elsif v_constraint = 'enrollment_progress_facts_active_correction_from_uidx' then
          select epf.id, epf.idempotency_key, epf.enrollment_id
          into v_replacement_id, v_replacement_key, v_replacement_enrollment_id
          from public.enrollment_progress_facts as epf
          where epf.organization_id = p_organization_id
            and epf.corrected_from_fact_id = p_corrected_from_fact_id
            and epf.voided_at is null
          limit 1;

          if not found then
            raise;
          end if;

          if v_replacement_enrollment_id <> p_enrollment_id then
            raise exception 'invalid correction reference';
          end if;

          if v_replacement_key = v_key then
            return v_replacement_id;
          end if;

          raise exception 'progress fact already has an active correction';
        else
          raise;
        end if;
    end;
  end if;

  if v_key is not null then
    select epf.id, epf.voided_at
    into v_existing_id, v_existing_voided_at
    from public.enrollment_progress_facts as epf
    where epf.organization_id = p_organization_id
      and epf.enrollment_id = p_enrollment_id
      and epf.source = 'manual'
      and epf.idempotency_key = v_key
    limit 1;

    if found then
      if v_existing_voided_at is null then
        return v_existing_id;
      end if;

      raise exception 'idempotency key already consumed';
    end if;
  end if;

  select e.status, e.archived_at, e.customer_id, e.program_id, e.enrolled_at
  into v_enrollment_status, v_enrollment_archived_at, v_enrollment_customer_id, v_enrollment_program_id, v_enrollment_enrolled_at
  from public.enrollments as e
  where e.organization_id = p_organization_id
    and e.id = p_enrollment_id
  for update;

  if not found then
    raise exception 'enrollment not found';
  end if;

  if v_key is not null then
    select epf.id, epf.voided_at
    into v_existing_id, v_existing_voided_at
    from public.enrollment_progress_facts as epf
    where epf.organization_id = p_organization_id
      and epf.enrollment_id = p_enrollment_id
      and epf.source = 'manual'
      and epf.idempotency_key = v_key
    limit 1;

    if found then
      if v_existing_voided_at is null then
        return v_existing_id;
      end if;

      raise exception 'idempotency key already consumed';
    end if;
  end if;

  if v_enrollment_archived_at is not null then
    raise exception 'enrollment not found';
  end if;

  if v_enrollment_status not in ('active', 'paused') then
    raise exception 'enrollment status does not allow progress';
  end if;

  if p_occurred_at < v_enrollment_enrolled_at then
    raise exception 'invalid progress payload for fact type';
  end if;

  begin
    insert into public.enrollment_progress_facts (
      organization_id,
      enrollment_id,
      customer_id,
      program_id,
      fact_type,
      occurred_at,
      recorded_by_member_id,
      source,
      idempotency_key,
      title,
      description,
      numeric_value,
      numeric_unit,
      is_complete,
      sequence_number
    )
    values (
      p_organization_id,
      p_enrollment_id,
      v_enrollment_customer_id,
      v_enrollment_program_id,
      p_fact_type,
      p_occurred_at,
      v_membership_id,
      'manual',
      v_key,
      nullif(btrim(p_title), ''),
      nullif(btrim(p_description), ''),
      p_numeric_value,
      nullif(btrim(p_numeric_unit), ''),
      p_is_complete,
      p_sequence_number
    )
    returning id into v_new_id;

    return v_new_id;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;

      if v_constraint = 'enrollment_progress_facts_idempotency_uidx' and v_key is not null then
        select epf.id, epf.voided_at
        into v_existing_id, v_existing_voided_at
        from public.enrollment_progress_facts as epf
        where epf.organization_id = p_organization_id
          and epf.enrollment_id = p_enrollment_id
          and epf.source = 'manual'
          and epf.idempotency_key = v_key
        limit 1;

        if found and v_existing_voided_at is null then
          return v_existing_id;
        end if;

        raise exception 'idempotency key already consumed';
      else
        raise;
      end if;
  end;
end;
$$;

create or replace function public.void_progress_fact(
  p_organization_id uuid,
  p_progress_fact_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_reason text;
  v_fact_enrollment_id uuid;
  v_fact_voided_at timestamptz;
  v_enrollment_status text;
  v_enrollment_archived_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_reason := nullif(btrim(p_reason), '');
  if v_reason is null then
    raise exception 'invalid progress payload for fact type';
  end if;

  select membership_id, member_role
  into v_membership_id, v_member_role
  from private.get_program_enrollment_actor_membership(p_organization_id);

  if v_membership_id is null or v_member_role is null then
    raise exception 'active organization membership required';
  end if;

  if v_member_role = 'viewer' then
    raise exception 'insufficient role';
  end if;

  if v_member_role not in ('owner', 'admin', 'staff') then
    raise exception 'insufficient role';
  end if;

  if not exists (
    select 1
    from public.organizations as o
    where o.id = p_organization_id
      and o.status = 'active'
  ) then
    raise exception 'organization not found or not active';
  end if;

  select epf.enrollment_id, epf.voided_at
  into v_fact_enrollment_id, v_fact_voided_at
  from public.enrollment_progress_facts as epf
  where epf.organization_id = p_organization_id
    and epf.id = p_progress_fact_id;

  if not found then
    raise exception 'progress fact not found';
  end if;

  select e.status, e.archived_at
  into v_enrollment_status, v_enrollment_archived_at
  from public.enrollments as e
  where e.organization_id = p_organization_id
    and e.id = v_fact_enrollment_id
  for update;

  if not found then
    raise exception 'progress fact not found';
  end if;

  select epf.enrollment_id, epf.voided_at
  into v_fact_enrollment_id, v_fact_voided_at
  from public.enrollment_progress_facts as epf
  where epf.organization_id = p_organization_id
    and epf.id = p_progress_fact_id
  for update;

  if not found then
    raise exception 'progress fact not found';
  end if;

  if v_fact_voided_at is not null then
    raise exception 'progress fact already voided';
  end if;

  if v_enrollment_archived_at is not null then
    raise exception 'enrollment not found';
  end if;

  if v_member_role in ('owner', 'admin') then
    if v_enrollment_status not in ('active', 'paused', 'completed', 'cancelled') then
      raise exception 'enrollment status does not allow progress';
    end if;
  elsif v_member_role = 'staff' then
    if v_enrollment_status not in ('active', 'paused') then
      raise exception 'enrollment status does not allow progress';
    end if;
  end if;

  update public.enrollment_progress_facts as epf
  set
    voided_at = pg_catalog.now(),
    voided_by_member_id = v_membership_id,
    void_reason = v_reason
  where epf.organization_id = p_organization_id
    and epf.id = p_progress_fact_id
    and epf.voided_at is null;
end;
$$;

comment on function public.record_progress_fact(
  uuid, uuid, text, timestamptz, text, text, numeric, text, boolean, integer, text, uuid
) is
  'Records a manual progress fact or atomically supersedes a predecessor with a correction fact.';

comment on function public.void_progress_fact(uuid, uuid, text) is
  'Revokes a progress fact without inserting a replacement.';

revoke all on function public.record_progress_fact(
  uuid, uuid, text, timestamptz, text, text, numeric, text, boolean, integer, text, uuid
) from public;
revoke all on function public.record_progress_fact(
  uuid, uuid, text, timestamptz, text, text, numeric, text, boolean, integer, text, uuid
) from anon;
grant execute on function public.record_progress_fact(
  uuid, uuid, text, timestamptz, text, text, numeric, text, boolean, integer, text, uuid
) to authenticated;

revoke all on function public.void_progress_fact(uuid, uuid, text) from public;
revoke all on function public.void_progress_fact(uuid, uuid, text) from anon;
grant execute on function public.void_progress_fact(uuid, uuid, text) to authenticated;
