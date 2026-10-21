-- TG2-AGENCY-SLICE: Agency / Business Services end-to-end Beta-1 workflow.
--
-- Additive only. Reuses the existing Attention item/signal architecture
-- (introduced in B1.7.2/B1.7.3, generalized for Social in SMM-B1.11-D) to add
-- a "project" Attention source. This is a SHARED improvement: the same rules
-- apply to any shared Project (Agency Project or Field Job), not an
-- Agency-only concept, so the shared Project/Attention foundations stay
-- uncontaminated by target-specific UI.
--
-- Minimal, high-value signal set (deliberately not the full candidate list):
--   1. project_overdue_active  - active project past its planned end date
--   2. project_task_overdue    - active project has an overdue open task
--   3. project_no_owner        - active project has no assigned owner
--
-- No new tables. No new roles. No Client Portal, billing, files, or capacity
-- scope. Evaluation is on-demand (Owner/Admin), mirroring the existing
-- enrollment_no_recent_progress pattern (no scheduler).

-- ---------------------------------------------------------------------------
-- 1) attention_items: add project_id / task_id + widen source generalization
-- ---------------------------------------------------------------------------

alter table public.attention_items
  add column if not exists project_id uuid,
  add column if not exists task_id uuid;

alter table public.attention_items
  drop constraint if exists attention_items_source_type_chk;

alter table public.attention_items
  add constraint attention_items_source_type_chk
  check (
    source_type in (
      'enrollment',
      'social_publication',
      'social_connection',
      'project'
    )
  );

alter table public.attention_items
  drop constraint if exists attention_items_source_shape_chk;

alter table public.attention_items
  add constraint attention_items_source_shape_chk
  check (
    (
      source_type = 'enrollment'
      and enrollment_id is not null
      and customer_id is not null
      and program_id is not null
      and source_entity_id = enrollment_id
      and social_publication_id is null
      and social_connection_id is null
      and project_id is null
      and task_id is null
    )
    or (
      source_type = 'social_publication'
      and enrollment_id is null
      and customer_id is null
      and program_id is null
      and social_publication_id is not null
      and source_entity_id = social_publication_id
      and project_id is null
      and task_id is null
    )
    or (
      source_type = 'social_connection'
      and enrollment_id is null
      and customer_id is null
      and program_id is null
      and social_connection_id is not null
      and source_entity_id = social_connection_id
      and project_id is null
      and task_id is null
    )
    or (
      source_type = 'project'
      and enrollment_id is null
      and customer_id is null
      and program_id is null
      and social_publication_id is null
      and social_connection_id is null
      and project_id is not null
      and source_entity_id = project_id
    )
  );

alter table public.attention_items
  drop constraint if exists attention_items_project_fk;

alter table public.attention_items
  add constraint attention_items_project_fk
  foreign key (organization_id, project_id)
  references public.projects (organization_id, id)
  on delete restrict;

alter table public.attention_items
  drop constraint if exists attention_items_task_fk;

alter table public.attention_items
  add constraint attention_items_task_fk
  foreign key (organization_id, task_id)
  references public.tasks (organization_id, id)
  on delete restrict;

create index if not exists attention_items_organization_id_project_id_idx
  on public.attention_items (organization_id, project_id)
  where project_id is not null;

comment on column public.attention_items.project_id is
  'Set only when source_type = project. References the shared Project foundation (Agency Project or Field Job).';
comment on column public.attention_items.task_id is
  'Optional evidence link to a specific overdue Task when source_type = project.';

-- ---------------------------------------------------------------------------
-- 2) attention_signals: widen rule_key allow-list for Project rules
-- ---------------------------------------------------------------------------

alter table public.attention_signals
  drop constraint if exists attention_signals_rule_key_check;

alter table public.attention_signals
  add constraint attention_signals_rule_key_check
  check (
    rule_key is null
    or rule_key in (
      'enrollment_no_recent_progress',
      'scheduled_publication_missed',
      'publication_result_unknown',
      'social_account_reauthorization_required',
      'provider_permission_missing',
      'scheduled_publication_failed',
      'project_overdue_active',
      'project_task_overdue',
      'project_no_owner'
    )
  );

alter table public.attention_signals
  drop constraint if exists attention_signals_origin_rule_consistency_check;

alter table public.attention_signals
  add constraint attention_signals_origin_rule_consistency_check
  check (
    (signal_origin = 'manual' and rule_key is null)
    or (
      signal_origin = 'rule'
      and rule_key in (
        'enrollment_no_recent_progress',
        'scheduled_publication_missed',
        'publication_result_unknown',
        'social_account_reauthorization_required',
        'provider_permission_missing',
        'scheduled_publication_failed',
        'project_overdue_active',
        'project_task_overdue',
        'project_no_owner'
      )
    )
  );

-- private.append_attention_signal must accept the same widened rule_key set
-- (same signature as B1.7.3 / SMM-B1.11-D; full replace, not a new overload).
create or replace function private.append_attention_signal(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_enrollment_id uuid,
  p_signal_origin text,
  p_rule_key text,
  p_explanation text,
  p_evidence jsonb,
  p_detected_at timestamptz,
  p_created_by_member_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_explanation text;
  v_evidence jsonb;
  v_signal_id uuid;
begin
  v_explanation := btrim(coalesce(p_explanation, ''));
  if char_length(v_explanation) = 0 or char_length(v_explanation) > 2000 then
    raise exception 'invalid attention signal explanation';
  end if;

  v_evidence := private.validate_attention_signal_evidence(p_evidence);

  if p_signal_origin = 'manual' then
    if p_rule_key is not null then
      raise exception 'invalid attention signal origin/rule combination';
    end if;
  elsif p_signal_origin = 'rule' then
    if p_rule_key is distinct from 'enrollment_no_recent_progress'
       and p_rule_key is distinct from 'scheduled_publication_missed'
       and p_rule_key is distinct from 'publication_result_unknown'
       and p_rule_key is distinct from 'social_account_reauthorization_required'
       and p_rule_key is distinct from 'provider_permission_missing'
       and p_rule_key is distinct from 'scheduled_publication_failed'
       and p_rule_key is distinct from 'project_overdue_active'
       and p_rule_key is distinct from 'project_task_overdue'
       and p_rule_key is distinct from 'project_no_owner'
    then
      raise exception 'invalid attention rule key';
    end if;
  else
    raise exception 'invalid attention signal origin';
  end if;

  insert into public.attention_signals (
    organization_id,
    attention_item_id,
    enrollment_id,
    signal_origin,
    rule_key,
    explanation,
    evidence,
    detected_at,
    created_by_member_id
  )
  values (
    p_organization_id,
    p_attention_item_id,
    p_enrollment_id,
    p_signal_origin,
    p_rule_key,
    v_explanation,
    v_evidence,
    coalesce(p_detected_at, pg_catalog.now()),
    p_created_by_member_id
  )
  returning id into v_signal_id;

  return v_signal_id;
end;
$$;

revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from public;
revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from anon;
revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from authenticated;

-- ---------------------------------------------------------------------------
-- 3) Project rule evaluation helpers + public RPC (Owner/Admin, on-demand)
-- ---------------------------------------------------------------------------

create or replace function private.upsert_project_rule_attention_item(
  p_organization_id uuid,
  p_project_id uuid,
  p_rule_key text,
  p_severity text,
  p_title text,
  p_summary text,
  p_explanation text,
  p_task_id uuid default null,
  p_actor_member_id uuid default null
)
returns table (
  result_code text,
  attention_item_id uuid,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_dedupe text;
  v_item public.attention_items;
  v_item_id uuid;
  v_signal_id uuid;
  v_evidence jsonb := jsonb_build_object('kind', 'generic');
begin
  v_dedupe := private.build_attention_source_dedupe_key(
    p_organization_id,
    'project',
    p_project_id,
    p_rule_key
  );

  select ai.*
  into v_item
  from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.source_type = 'project'
    and ai.source_entity_id = p_project_id
    and ai.dedupe_key = v_dedupe
    and ai.status in ('open', 'acknowledged')
  for update;

  if found then
    v_item_id := v_item.id;

    v_signal_id := private.append_attention_signal(
      p_organization_id,
      v_item_id,
      null,
      'rule',
      p_rule_key,
      p_explanation,
      v_evidence,
      v_now,
      null
    );

    update public.attention_items as ai
    set
      detection_count = ai.detection_count + 1,
      last_detected_at = v_now,
      task_id = p_task_id,
      updated_by_member_id = p_actor_member_id
    where ai.organization_id = p_organization_id
      and ai.id = v_item_id;

    perform private.insert_attention_item_event(
      p_organization_id,
      v_item_id,
      'detection_updated',
      v_item.status,
      v_item.status,
      null,
      null,
      null,
      null,
      null,
      'rule',
      p_actor_member_id,
      jsonb_build_object('signal_id', v_signal_id)
    );

    return query select 'updated'::text, v_item_id, false;
    return;
  end if;

  insert into public.attention_items (
    organization_id,
    source_type,
    source_entity_id,
    project_id,
    task_id,
    title,
    summary,
    status,
    severity,
    dedupe_key,
    first_detected_at,
    last_detected_at,
    created_by_member_id,
    updated_by_member_id
  )
  values (
    p_organization_id,
    'project',
    p_project_id,
    p_project_id,
    p_task_id,
    p_title,
    p_summary,
    'open',
    p_severity,
    v_dedupe,
    v_now,
    v_now,
    p_actor_member_id,
    p_actor_member_id
  )
  returning id into v_item_id;

  v_signal_id := private.append_attention_signal(
    p_organization_id,
    v_item_id,
    null,
    'rule',
    p_rule_key,
    p_explanation,
    v_evidence,
    v_now,
    null
  );

  perform private.insert_attention_item_event(
    p_organization_id,
    v_item_id,
    'created',
    null,
    'open',
    null,
    p_severity,
    null,
    null,
    null,
    'rule',
    p_actor_member_id,
    jsonb_build_object('signal_id', v_signal_id, 'rule_key', p_rule_key)
  );

  return query select 'created'::text, v_item_id, true;
end;
$$;

revoke all on function private.upsert_project_rule_attention_item(
  uuid, uuid, text, text, text, text, text, uuid, uuid
) from public;
revoke all on function private.upsert_project_rule_attention_item(
  uuid, uuid, text, text, text, text, text, uuid, uuid
) from anon;
revoke all on function private.upsert_project_rule_attention_item(
  uuid, uuid, text, text, text, text, text, uuid, uuid
) from authenticated;

create or replace function private.expire_project_rule_attention_item_if_present(
  p_organization_id uuid,
  p_project_id uuid,
  p_rule_key text,
  p_expired_at timestamptz default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_dedupe text;
  v_item_id uuid;
begin
  v_dedupe := private.build_attention_source_dedupe_key(
    p_organization_id,
    'project',
    p_project_id,
    p_rule_key
  );

  select ai.id
  into v_item_id
  from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.source_type = 'project'
    and ai.source_entity_id = p_project_id
    and ai.dedupe_key = v_dedupe
    and ai.status in ('open', 'acknowledged')
  for update;

  if not found then
    return false;
  end if;

  perform private.expire_attention_item(p_organization_id, v_item_id, p_expired_at);
  return true;
end;
$$;

revoke all on function private.expire_project_rule_attention_item_if_present(
  uuid, uuid, text, timestamptz
) from public;
revoke all on function private.expire_project_rule_attention_item_if_present(
  uuid, uuid, text, timestamptz
) from anon;
revoke all on function private.expire_project_rule_attention_item_if_present(
  uuid, uuid, text, timestamptz
) from authenticated;

create or replace function public.evaluate_project_attention_rules(
  p_organization_id uuid,
  p_project_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id uuid;
  v_member_role text;
  v_as_of timestamptz := pg_catalog.now();
  v_created integer := 0;
  v_updated integer := 0;
  v_expired integer := 0;
  v_project record;
  v_task record;
  v_has_task boolean;
  v_stale_item record;
  v_upsert record;
begin
  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.require_attention_actor(
    p_organization_id,
    array['owner', 'admin']::text[]
  ) as actor;

  for v_project in
    select pr.id, pr.owner_member_id, pr.planned_end, pr.name
    from public.projects as pr
    where pr.organization_id = p_organization_id
      and pr.archived_at is null
      and pr.status = 'active'
      and (p_project_id is null or pr.id = p_project_id)
  loop
    -- Rule: project_overdue_active
    if v_project.planned_end is not null
       and v_project.planned_end < (v_as_of at time zone 'UTC')::date
    then
      select * into v_upsert from private.upsert_project_rule_attention_item(
        p_organization_id,
        v_project.id,
        'project_overdue_active',
        'high',
        'Project past planned end date',
        'The planned end date has passed while the project is still active.',
        'Planned end date ' || v_project.planned_end::text
          || ' has passed while status remains active.',
        null,
        v_membership_id
      );
      if v_upsert.created then
        v_created := v_created + 1;
      else
        v_updated := v_updated + 1;
      end if;
    else
      if private.expire_project_rule_attention_item_if_present(
        p_organization_id, v_project.id, 'project_overdue_active', v_as_of
      ) then
        v_expired := v_expired + 1;
      end if;
    end if;

    -- Rule: project_task_overdue
    select t.id, t.title, t.due_at
    into v_task
    from public.tasks as t
    where t.organization_id = p_organization_id
      and t.project_id = v_project.id
      and t.archived_at is null
      and t.status = 'open'
      and t.due_at < v_as_of
    order by t.due_at asc
    limit 1;
    v_has_task := found;

    if v_has_task then
      select * into v_upsert from private.upsert_project_rule_attention_item(
        p_organization_id,
        v_project.id,
        'project_task_overdue',
        'medium',
        'Project has an overdue task',
        'At least one open task on this project is past its due date.',
        'Task "' || v_task.title || '" was due ' || v_task.due_at::text || '.',
        v_task.id,
        v_membership_id
      );
      if v_upsert.created then
        v_created := v_created + 1;
      else
        v_updated := v_updated + 1;
      end if;
    else
      if private.expire_project_rule_attention_item_if_present(
        p_organization_id, v_project.id, 'project_task_overdue', v_as_of
      ) then
        v_expired := v_expired + 1;
      end if;
    end if;

    -- Rule: project_no_owner
    if v_project.owner_member_id is null then
      select * into v_upsert from private.upsert_project_rule_attention_item(
        p_organization_id,
        v_project.id,
        'project_no_owner',
        'medium',
        'Active project has no owner',
        'Assign an owner to keep this project accountable.',
        'Project "' || v_project.name || '" is active without an assigned owner.',
        null,
        v_membership_id
      );
      if v_upsert.created then
        v_created := v_created + 1;
      else
        v_updated := v_updated + 1;
      end if;
    else
      if private.expire_project_rule_attention_item_if_present(
        p_organization_id, v_project.id, 'project_no_owner', v_as_of
      ) then
        v_expired := v_expired + 1;
      end if;
    end if;
  end loop;

  -- Cleanup: expire project Attention items whose project left active scope
  -- entirely (on_hold/completed/cancelled/archived), so closure is visible
  -- without requiring the underlying condition to be re-checked per rule.
  for v_stale_item in
    select ai.id as item_id
    from public.attention_items as ai
    join public.projects as pr
      on pr.organization_id = ai.organization_id and pr.id = ai.project_id
    where ai.organization_id = p_organization_id
      and ai.source_type = 'project'
      and ai.status in ('open', 'acknowledged')
      and (p_project_id is null or ai.project_id = p_project_id)
      and (pr.status <> 'active' or pr.archived_at is not null)
  loop
    perform private.expire_attention_item(p_organization_id, v_stale_item.item_id, v_as_of);
    v_expired := v_expired + 1;
  end loop;

  if p_project_id is not null and v_created = 0 and v_updated = 0 and v_expired = 0 then
    if not exists (
      select 1
      from public.projects as pr
      where pr.organization_id = p_organization_id
        and pr.id = p_project_id
    ) then
      raise exception 'project not found';
    end if;
  end if;

  return jsonb_build_object(
    'created', v_created,
    'updated', v_updated,
    'expired', v_expired,
    'evaluatedAt', v_as_of
  );
end;
$$;

comment on function public.evaluate_project_attention_rules(uuid, uuid) is
  'Owner/Admin on-demand evaluation of shared Project Attention signals (overdue project, overdue task, no owner). Shared Project foundation; usable by any target context with shared.projects; no scheduler.';

revoke all on function public.evaluate_project_attention_rules(uuid, uuid) from public;
revoke all on function public.evaluate_project_attention_rules(uuid, uuid) from anon;
grant execute on function public.evaluate_project_attention_rules(uuid, uuid) to authenticated;
