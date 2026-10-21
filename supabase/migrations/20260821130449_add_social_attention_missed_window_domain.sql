-- SMM-B1.11-D — Missed window + Social Attention on the existing Attention tables.
-- No social_attention_items. No provider write. Enrollment evaluate_attention_rules
-- remains the enrollment scanner. Scheduler mutations are service_role only.

-- ---------------------------------------------------------------------------
-- 0) Publication last_failure_class: schedule_missed
-- ---------------------------------------------------------------------------

alter table public.social_publications
  drop constraint if exists social_publications_last_failure_class_chk;

alter table public.social_publications
  add constraint social_publications_last_failure_class_chk
  check (
    last_failure_class is null
    or last_failure_class in (
      'authorization',
      'credential',
      'capability',
      'validation',
      'media',
      'rate_limit',
      'provider_temporary',
      'provider_permanent',
      'network',
      'timeout',
      'conflict',
      'internal',
      'adapter_unavailable',
      'feature_disabled',
      'unknown_external_outcome',
      'workflow_not_ready',
      'connection_ineligible',
      'schedule_missed'
    )
  );

-- ---------------------------------------------------------------------------
-- 1) Attention source generalization (keep enrollment rows valid)
-- ---------------------------------------------------------------------------

alter table public.attention_items
  add column if not exists source_type text,
  add column if not exists source_entity_id uuid,
  add column if not exists social_publication_id uuid,
  add column if not exists social_connection_id uuid;

update public.attention_items
set
  source_type = coalesce(source_type, 'enrollment'),
  source_entity_id = coalesce(source_entity_id, enrollment_id)
where source_type is null
   or source_entity_id is null;

alter table public.attention_items
  alter column source_type set default 'enrollment',
  alter column source_type set not null,
  alter column source_entity_id set not null;

alter table public.attention_items
  alter column enrollment_id drop not null,
  alter column customer_id drop not null,
  alter column program_id drop not null;

alter table public.attention_items
  drop constraint if exists attention_items_source_type_chk;

alter table public.attention_items
  add constraint attention_items_source_type_chk
  check (source_type in ('enrollment', 'social_publication', 'social_connection'));

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
    )
    or (
      source_type = 'social_publication'
      and enrollment_id is null
      and customer_id is null
      and program_id is null
      and social_publication_id is not null
      and source_entity_id = social_publication_id
    )
    or (
      source_type = 'social_connection'
      and enrollment_id is null
      and customer_id is null
      and program_id is null
      and social_connection_id is not null
      and source_entity_id = social_connection_id
    )
  );

alter table public.attention_items
  drop constraint if exists attention_items_social_publication_fk;

alter table public.attention_items
  add constraint attention_items_social_publication_fk
  foreign key (organization_id, social_publication_id)
  references public.social_publications (organization_id, id)
  on delete restrict;

alter table public.attention_items
  drop constraint if exists attention_items_social_connection_fk;

alter table public.attention_items
  add constraint attention_items_social_connection_fk
  foreign key (organization_id, social_connection_id)
  references public.social_account_connections (organization_id, id)
  on delete restrict;

drop index if exists public.attention_items_nonterminal_dedupe_uidx;

create unique index attention_items_nonterminal_source_dedupe_uidx
  on public.attention_items (organization_id, source_type, source_entity_id, dedupe_key)
  where status in ('open', 'acknowledged');

create or replace function private.attention_items_fill_source_defaults()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source_type is null or btrim(new.source_type) = '' then
    new.source_type := 'enrollment';
  end if;
  if new.source_type = 'enrollment' and new.source_entity_id is null then
    new.source_entity_id := new.enrollment_id;
  end if;
  return new;
end;
$$;

revoke all on function private.attention_items_fill_source_defaults() from public;
revoke all on function private.attention_items_fill_source_defaults() from anon;
revoke all on function private.attention_items_fill_source_defaults() from authenticated;

drop trigger if exists attention_items_fill_source_defaults on public.attention_items;

create trigger attention_items_fill_source_defaults
  before insert or update on public.attention_items
  for each row
  execute function private.attention_items_fill_source_defaults();

-- Signals: enrollment_id optional; item FK no longer requires enrollment tuple.
alter table public.attention_signals
  alter column enrollment_id drop not null;

alter table public.attention_signals
  drop constraint if exists attention_signals_item_enrollment_fk;

alter table public.attention_signals
  drop constraint if exists attention_signals_enrollment_fk;

alter table public.attention_signals
  drop constraint if exists attention_signals_item_fk;

alter table public.attention_signals
  add constraint attention_signals_item_fk
  foreign key (organization_id, attention_item_id)
  references public.attention_items (organization_id, id)
  on delete cascade;

alter table public.attention_signals
  add constraint attention_signals_enrollment_fk
  foreign key (organization_id, enrollment_id)
  references public.enrollments (organization_id, id)
  on delete restrict;

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
      'scheduled_publication_failed'
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
        'scheduled_publication_failed'
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Dedupe + Social Attention upsert (machine/scheduler)
-- ---------------------------------------------------------------------------

create or replace function private.build_attention_source_dedupe_key(
  p_organization_id uuid,
  p_source_type text,
  p_source_entity_id uuid,
  p_signal_key text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'attention:'
    || p_source_type
    || ':'
    || p_organization_id::text
    || ':'
    || p_source_entity_id::text
    || ':'
    || p_signal_key;
$$;

revoke all on function private.build_attention_source_dedupe_key(uuid, text, uuid, text) from public;
revoke all on function private.build_attention_source_dedupe_key(uuid, text, uuid, text) from anon;
revoke all on function private.build_attention_source_dedupe_key(uuid, text, uuid, text) from authenticated;

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

create or replace function private.upsert_social_rule_attention_item(
  p_organization_id uuid,
  p_source_type text,
  p_source_entity_id uuid,
  p_rule_key text,
  p_severity text,
  p_title text,
  p_summary text,
  p_explanation text,
  p_social_publication_id uuid default null,
  p_social_connection_id uuid default null
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
  v_created boolean := false;
begin
  if p_organization_id is null
     or p_source_entity_id is null
     or p_source_type not in ('social_publication', 'social_connection')
     or p_rule_key is null
     or p_severity not in ('high', 'critical')
  then
    return query select 'invalid_input'::text, null::uuid, false;
    return;
  end if;

  if p_source_type = 'social_publication' then
    if p_social_publication_id is distinct from p_source_entity_id then
      return query select 'invalid_input'::text, null::uuid, false;
      return;
    end if;
    if not exists (
      select 1
      from public.social_publications as p
      where p.organization_id = p_organization_id
        and p.id = p_source_entity_id
    ) then
      return query select 'not_found'::text, null::uuid, false;
      return;
    end if;
  elsif p_source_type = 'social_connection' then
    if p_social_connection_id is distinct from p_source_entity_id then
      return query select 'invalid_input'::text, null::uuid, false;
      return;
    end if;
    if not exists (
      select 1
      from public.social_account_connections as c
      where c.organization_id = p_organization_id
        and c.id = p_source_entity_id
    ) then
      return query select 'not_found'::text, null::uuid, false;
      return;
    end if;
  end if;

  v_dedupe := private.build_attention_source_dedupe_key(
    p_organization_id,
    p_source_type,
    p_source_entity_id,
    p_rule_key
  );

  select ai.*
  into v_item
  from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.source_type = p_source_type
    and ai.source_entity_id = p_source_entity_id
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
      jsonb_build_object('kind', 'generic'),
      v_now,
      null
    );
    update public.attention_items as ai
    set
      detection_count = ai.detection_count + 1,
      last_detected_at = v_now,
      title = p_title,
      summary = p_summary
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
      null,
      jsonb_build_object('signal_id', v_signal_id, 'source', 'scheduler')
    );
    return query select 'success'::text, v_item_id, false;
    return;
  end if;

  insert into public.attention_items (
    organization_id,
    enrollment_id,
    customer_id,
    program_id,
    source_type,
    source_entity_id,
    social_publication_id,
    social_connection_id,
    title,
    summary,
    status,
    severity,
    dedupe_key,
    first_detected_at,
    last_detected_at
  )
  values (
    p_organization_id,
    null,
    null,
    null,
    p_source_type,
    p_source_entity_id,
    p_social_publication_id,
    p_social_connection_id,
    p_title,
    p_summary,
    'open',
    p_severity,
    v_dedupe,
    v_now,
    v_now
  )
  returning id into v_item_id;
  v_created := true;

  v_signal_id := private.append_attention_signal(
    p_organization_id,
    v_item_id,
    null,
    'rule',
    p_rule_key,
    p_explanation,
    jsonb_build_object('kind', 'generic'),
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
    null,
    jsonb_build_object('signal_id', v_signal_id, 'source', 'scheduler')
  );

  return query select 'success'::text, v_item_id, v_created;
end;
$$;

revoke all on function private.upsert_social_rule_attention_item(
  uuid, text, uuid, text, text, text, text, text, uuid, uuid
) from public;
revoke all on function private.upsert_social_rule_attention_item(
  uuid, text, uuid, text, text, text, text, text, uuid, uuid
) from anon;
revoke all on function private.upsert_social_rule_attention_item(
  uuid, text, uuid, text, text, text, text, text, uuid, uuid
) from authenticated;

create or replace function private.resolve_social_attention_for_dedupe(
  p_organization_id uuid,
  p_source_type text,
  p_source_entity_id uuid,
  p_rule_key text,
  p_reason text,
  p_actor_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.attention_items;
  v_dedupe text;
  v_reason text := btrim(coalesce(p_reason, 'Resolved'));
begin
  v_dedupe := private.build_attention_source_dedupe_key(
    p_organization_id,
    p_source_type,
    p_source_entity_id,
    p_rule_key
  );

  select ai.*
  into v_item
  from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.source_type = p_source_type
    and ai.source_entity_id = p_source_entity_id
    and ai.dedupe_key = v_dedupe
    and ai.status in ('open', 'acknowledged')
  for update;

  if not found then
    return;
  end if;

  if not private.is_allowed_attention_status_transition(v_item.status, 'resolved') then
    return;
  end if;

  update public.attention_items as ai
  set
    status = 'resolved',
    resolved_at = pg_catalog.now(),
    resolution_reason = v_reason,
    updated_by_member_id = p_actor_member_id
  where ai.organization_id = p_organization_id
    and ai.id = v_item.id;

  perform private.insert_attention_item_event(
    p_organization_id,
    v_item.id,
    'status_changed',
    v_item.status,
    'resolved',
    null,
    null,
    null,
    null,
    v_reason,
    'system',
    p_actor_member_id,
    jsonb_build_object('rule_key', p_rule_key)
  );
end;
$$;

revoke all on function private.resolve_social_attention_for_dedupe(
  uuid, text, uuid, text, text, uuid
) from public;
revoke all on function private.resolve_social_attention_for_dedupe(
  uuid, text, uuid, text, text, uuid
) from anon;
revoke all on function private.resolve_social_attention_for_dedupe(
  uuid, text, uuid, text, text, uuid
) from authenticated;

-- ---------------------------------------------------------------------------
-- 3) Missed transition (atomic publication + Attention)
-- ---------------------------------------------------------------------------

create or replace function public.scheduler_mark_scheduled_publication_missed(
  p_organization_id uuid,
  p_publication_id uuid
)
returns table (
  result_code text,
  publication_id uuid,
  attention_item_id uuid,
  attention_created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pub public.social_publications;
  v_due timestamptz;
  v_att record;
  v_title text;
  v_summary text;
  v_explanation text;
begin
  perform private.assert_social_scheduler_service_role();

  if p_organization_id is null or p_publication_id is null then
    return query select 'invalid_input'::text, null::uuid, null::uuid, false;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  for update skip locked;

  if not found then
    if exists (
      select 1 from public.social_publications as p
      where p.organization_id = p_organization_id and p.id = p_publication_id
    ) then
      return query select 'skipped_locked'::text, p_publication_id, null::uuid, false;
      return;
    end if;
    return query select 'not_found'::text, null::uuid, null::uuid, false;
    return;
  end if;

  if v_pub.organization_id is distinct from p_organization_id then
    return query select 'forbidden'::text, v_pub.id, null::uuid, false;
    return;
  end if;

  v_title := 'Scheduled Instagram publication missed';
  v_summary := 'This publication was more than 15 minutes late and was not posted automatically. Review it and reschedule if you still want it published.';
  v_explanation := 'Scheduled Instagram publication was missed because it was more than 15 minutes late. It was not posted automatically. Review and reschedule it.';

  if v_pub.status = 'manual_intervention'
     and v_pub.last_failure_class = 'schedule_missed'
  then
    select u.result_code, u.attention_item_id, u.created
    into v_att
    from private.upsert_social_rule_attention_item(
      v_pub.organization_id,
      'social_publication',
      v_pub.id,
      'scheduled_publication_missed',
      'high',
      v_title,
      v_summary,
      v_explanation,
      v_pub.id,
      null
    ) as u
    limit 1;
    return query select 'already_missed'::text, v_pub.id, v_att.attention_item_id, false;
    return;
  end if;

  if v_pub.status in ('succeeded', 'cancelled', 'unknown_external_outcome', 'failed_terminal', 'processing') then
    return query select 'conflict'::text, v_pub.id, null::uuid, false;
    return;
  end if;

  if v_pub.execution_mode is distinct from 'scheduled' then
    return query select 'not_scheduled'::text, v_pub.id, null::uuid, false;
    return;
  end if;

  if v_pub.status not in ('pending', 'queued', 'failed_retryable')
     and not (
       v_pub.status = 'claimed'
       and v_pub.claim_lease_expires_at is not null
       and v_pub.claim_lease_expires_at < pg_catalog.now()
     )
  then
    return query select 'conflict'::text, v_pub.id, null::uuid, false;
    return;
  end if;

  v_due := coalesce(v_pub.next_attempt_at, v_pub.intended_execute_at);
  if v_due is null or v_due > pg_catalog.now() then
    return query select 'not_missed'::text, v_pub.id, null::uuid, false;
    return;
  end if;

  if extract(epoch from (pg_catalog.now() - v_due)) <= 900 then
    return query select 'not_missed'::text, v_pub.id, null::uuid, false;
    return;
  end if;

  update public.social_publications as p
  set
    status = 'manual_intervention',
    last_failure_class = 'schedule_missed',
    claimed_at = null,
    claim_lease_expires_at = null,
    claimed_by = null,
    completed_at = pg_catalog.now(),
    updated_at = pg_catalog.now()
  where p.organization_id = v_pub.organization_id
    and p.id = v_pub.id
  returning p.* into v_pub;

  perform private.insert_social_publication_event(
    v_pub.organization_id,
    v_pub.brand_id,
    v_pub.workspace_id,
    v_pub.id,
    null,
    'social_publication_manual_intervention',
    'system',
    null,
    jsonb_build_object(
      'source', 'scheduler',
      'safe_error_code', 'schedule_missed',
      'intended_execute_at', v_pub.intended_execute_at,
      'seconds_late', floor(extract(epoch from (pg_catalog.now() - v_due)))::integer
    )
  );

  select u.result_code, u.attention_item_id, u.created
  into v_att
  from private.upsert_social_rule_attention_item(
    v_pub.organization_id,
    'social_publication',
    v_pub.id,
    'scheduled_publication_missed',
    'high',
    v_title,
    v_summary,
    v_explanation,
    v_pub.id,
    null
  ) as u
  limit 1;

  if v_att.result_code is distinct from 'success' then
    raise exception 'social attention upsert failed after missed transition'
      using errcode = 'P0001';
  end if;

  return query select 'success'::text, v_pub.id, v_att.attention_item_id, v_att.created;
end;
$$;

revoke all on function public.scheduler_mark_scheduled_publication_missed(uuid, uuid) from public;
revoke all on function public.scheduler_mark_scheduled_publication_missed(uuid, uuid) from anon;
revoke all on function public.scheduler_mark_scheduled_publication_missed(uuid, uuid) from authenticated;
grant execute on function public.scheduler_mark_scheduled_publication_missed(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 4) Intervention Attention upsert (UEO / reauth / permission / terminal)
-- ---------------------------------------------------------------------------

create or replace function public.scheduler_upsert_social_intervention_attention(
  p_organization_id uuid,
  p_publication_id uuid,
  p_hint_code text
)
returns table (
  result_code text,
  attention_item_id uuid,
  rule_key text,
  created boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pub public.social_publications;
  v_conn public.social_account_connections;
  v_rule text;
  v_source_type text;
  v_source_id uuid;
  v_severity text := 'high';
  v_title text;
  v_summary text;
  v_explanation text;
  v_att record;
  v_pub_id uuid;
  v_conn_id uuid;
begin
  perform private.assert_social_scheduler_service_role();

  if p_organization_id is null or p_publication_id is null or p_hint_code is null then
    return query select 'invalid_input'::text, null::uuid, null::text, false;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id;

  if not found then
    return query select 'not_found'::text, null::uuid, null::text, false;
    return;
  end if;

  select c.* into v_conn
  from public.social_account_connections as c
  where c.organization_id = v_pub.organization_id
    and c.id = v_pub.connection_id;

  if p_hint_code in ('unknown_external_outcome', 'publication_result_unknown')
     or v_pub.status = 'unknown_external_outcome'
  then
    v_rule := 'publication_result_unknown';
    v_severity := 'critical';
    v_source_type := 'social_publication';
    v_source_id := v_pub.id;
    v_pub_id := v_pub.id;
    v_title := 'Instagram publish result could not be confirmed';
    v_summary := 'ZyntixAI could not confirm whether this Instagram post was published. Do not retry automatically. Inspect the account before taking further action.';
    v_explanation := 'The external publish result could not be confirmed. Blind retry could duplicate a post. Inspect Instagram before any further action.';
  elsif p_hint_code in ('capability_missing', 'provider_permission_missing') then
    v_rule := 'provider_permission_missing';
    v_source_type := 'social_connection';
    v_source_id := v_pub.connection_id;
    v_conn_id := v_pub.connection_id;
    v_title := 'Instagram account is missing publish permission';
    v_summary := 'The connected Instagram account no longer has the permission required to publish this image. It was not posted automatically.';
    v_explanation := 'Required capability publish_image is missing. The scheduled publication was not posted.';
  elsif p_hint_code in ('connection_reauthorization_required', 'connection_ineligible')
        and v_conn.reauthorization_required_at is not null
  then
    v_rule := 'social_account_reauthorization_required';
    v_source_type := 'social_connection';
    v_source_id := v_pub.connection_id;
    v_conn_id := v_pub.connection_id;
    v_title := 'Instagram account needs reconnection';
    v_summary := 'The bound Instagram account requires reauthorization. Scheduled publishing cannot continue until the account is reconnected.';
    v_explanation := 'The bound Social account requires reauthorization. No provider write was attempted.';
  elsif p_hint_code in (
      'failed_terminal',
      'scheduled_publication_failed',
      'connection_ineligible',
      'format_unsupported',
      'credential_unavailable'
    )
  then
    v_rule := 'scheduled_publication_failed';
    v_source_type := 'social_publication';
    v_source_id := v_pub.id;
    v_pub_id := v_pub.id;
    v_title := 'Scheduled Instagram publication needs review';
    v_summary := 'Automatic publishing stopped because this publication needs owner action. It was not posted.';
    v_explanation := 'A terminal scheduled-publication condition requires human intervention. No automatic retry will run.';
  else
    return query select 'skipped'::text, null::uuid, null::text, false;
    return;
  end if;

  select u.result_code, u.attention_item_id, u.created
  into v_att
  from private.upsert_social_rule_attention_item(
    v_pub.organization_id,
    v_source_type,
    v_source_id,
    v_rule,
    v_severity,
    v_title,
    v_summary,
    v_explanation,
    v_pub_id,
    v_conn_id
  ) as u
  limit 1;

  return query select coalesce(v_att.result_code, 'unexpected'), v_att.attention_item_id, v_rule, coalesce(v_att.created, false);
end;
$$;

revoke all on function public.scheduler_upsert_social_intervention_attention(uuid, uuid, text) from public;
revoke all on function public.scheduler_upsert_social_intervention_attention(uuid, uuid, text) from anon;
revoke all on function public.scheduler_upsert_social_intervention_attention(uuid, uuid, text) from authenticated;
grant execute on function public.scheduler_upsert_social_intervention_attention(uuid, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 5) Narrow missed recovery (Owner/Admin) — not generic manual_intervention reopen
-- ---------------------------------------------------------------------------

create or replace function public.reschedule_missed_social_publication(
  p_organization_id uuid,
  p_publication_id uuid,
  p_intended_execute_at timestamptz
)
returns table (
  result_code text,
  publication_id uuid,
  intended_execute_at timestamptz,
  next_attempt_at timestamptz,
  execution_mode text,
  variant_version_id uuid,
  connection_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor record;
  v_pub public.social_publications;
begin
  select * into v_actor
  from private.assert_social_publication_schedule_actor(p_organization_id);

  if v_actor.result_code is distinct from 'ok' then
    return query select v_actor.result_code, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  if p_publication_id is null or p_intended_execute_at is null then
    return query select 'invalid_input'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  if p_intended_execute_at <= pg_catalog.now() then
    return query select 'invalid_time'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid, null::timestamptz, null::timestamptz, null::text, null::uuid, null::uuid;
    return;
  end if;

  if v_pub.status is distinct from 'manual_intervention'
     or v_pub.last_failure_class is distinct from 'schedule_missed'
     or v_pub.execution_mode is distinct from 'scheduled'
  then
    return query select 'conflict'::text, v_pub.id, v_pub.intended_execute_at, v_pub.next_attempt_at, v_pub.execution_mode, v_pub.variant_version_id, v_pub.connection_id;
    return;
  end if;

  update public.social_publications as p
  set
    status = 'queued',
    last_failure_class = null,
    intended_execute_at = p_intended_execute_at,
    next_attempt_at = p_intended_execute_at,
    claimed_at = null,
    claim_lease_expires_at = null,
    claimed_by = null,
    completed_at = null,
    updated_at = pg_catalog.now()
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  returning p.* into v_pub;

  perform private.insert_social_publication_event(
    v_pub.organization_id,
    v_pub.brand_id,
    v_pub.workspace_id,
    v_pub.id,
    null,
    'social_publication_rescheduled',
    'member',
    v_actor.membership_id,
    jsonb_build_object(
      'source', 'missed_recovery',
      'intended_execute_at', p_intended_execute_at
    )
  );

  perform private.resolve_social_attention_for_dedupe(
    v_pub.organization_id,
    'social_publication',
    v_pub.id,
    'scheduled_publication_missed',
    'Missed publication rescheduled.',
    v_actor.membership_id
  );

  return query select
    'success'::text,
    v_pub.id,
    v_pub.intended_execute_at,
    v_pub.next_attempt_at,
    v_pub.execution_mode,
    v_pub.variant_version_id,
    v_pub.connection_id;
end;
$$;

revoke all on function public.reschedule_missed_social_publication(uuid, uuid, timestamptz) from public;
revoke all on function public.reschedule_missed_social_publication(uuid, uuid, timestamptz) from anon;
revoke all on function public.reschedule_missed_social_publication(uuid, uuid, timestamptz) from service_role;
grant execute on function public.reschedule_missed_social_publication(uuid, uuid, timestamptz) to authenticated;

create or replace function public.cancel_missed_social_publication(
  p_organization_id uuid,
  p_publication_id uuid
)
returns table (
  result_code text,
  publication_id uuid,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor record;
  v_pub public.social_publications;
begin
  select * into v_actor
  from private.assert_social_publication_schedule_actor(p_organization_id);

  if v_actor.result_code is distinct from 'ok' then
    return query select v_actor.result_code, null::uuid, null::text;
    return;
  end if;

  if p_publication_id is null then
    return query select 'invalid_input'::text, null::uuid, null::text;
    return;
  end if;

  select p.* into v_pub
  from public.social_publications as p
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  for update;

  if not found then
    return query select 'not_found'::text, null::uuid, null::text;
    return;
  end if;

  if v_pub.status is distinct from 'manual_intervention'
     or v_pub.last_failure_class is distinct from 'schedule_missed'
  then
    return query select 'conflict'::text, v_pub.id, v_pub.status;
    return;
  end if;

  update public.social_publications as p
  set
    status = 'cancelled',
    cancelled_at = pg_catalog.now(),
    completed_at = pg_catalog.now(),
    claimed_at = null,
    claim_lease_expires_at = null,
    claimed_by = null,
    updated_at = pg_catalog.now()
  where p.organization_id = p_organization_id
    and p.id = p_publication_id
  returning p.* into v_pub;

  perform private.insert_social_publication_event(
    v_pub.organization_id,
    v_pub.brand_id,
    v_pub.workspace_id,
    v_pub.id,
    null,
    'social_publication_cancelled',
    'member',
    v_actor.membership_id,
    jsonb_build_object('source', 'missed_recovery')
  );

  perform private.resolve_social_attention_for_dedupe(
    v_pub.organization_id,
    'social_publication',
    v_pub.id,
    'scheduled_publication_missed',
    'Missed publication cancelled.',
    v_actor.membership_id
  );

  return query select 'success'::text, v_pub.id, v_pub.status;
end;
$$;

revoke all on function public.cancel_missed_social_publication(uuid, uuid) from public;
revoke all on function public.cancel_missed_social_publication(uuid, uuid) from anon;
revoke all on function public.cancel_missed_social_publication(uuid, uuid) from service_role;
grant execute on function public.cancel_missed_social_publication(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 6) Resolve reauth Attention when the connection becomes healthy again
-- ---------------------------------------------------------------------------

create or replace function private.resolve_social_reauth_attention_on_connection_healthy()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reauthorization_required_at is null
     and old.reauthorization_required_at is not null
     and new.status = 'connected'
     and new.health = 'healthy'
  then
    perform private.resolve_social_attention_for_dedupe(
      new.organization_id,
      'social_connection',
      new.id,
      'social_account_reauthorization_required',
      'Instagram account reauthorized.',
      null
    );
  end if;
  return new;
end;
$$;

revoke all on function private.resolve_social_reauth_attention_on_connection_healthy() from public;
revoke all on function private.resolve_social_reauth_attention_on_connection_healthy() from anon;
revoke all on function private.resolve_social_reauth_attention_on_connection_healthy() from authenticated;

drop trigger if exists social_account_connections_resolve_reauth_attention
  on public.social_account_connections;

create trigger social_account_connections_resolve_reauth_attention
  after update on public.social_account_connections
  for each row
  execute function private.resolve_social_reauth_attention_on_connection_healthy();
