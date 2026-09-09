-- ENG-ONB-1H-P0-A / GATE-07 Option C:
-- durable V2 onboarding completion orchestration and invitation-result authority.
--
-- R1: callers never supply authoritative invitation outcomes or invitation ids.
-- R2: every public invitation create/resend/accept path denies V2 before Setup Ready.
-- This migration does not complete onboarding, grant product access, send email, store
-- plaintext invitation tokens, or introduce a batch invitation operation.

-- ---------------------------------------------------------------------------
-- Durable completion run
-- ---------------------------------------------------------------------------

create table public.organization_onboarding_completion_runs (
  organization_id uuid primary key
    references public.organizations (id) on delete cascade,
  status text not null,
  started_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  ready_for_cutover_at timestamptz,
  completed_at timestamptz,
  last_error_code text,
  constraint organization_onboarding_completion_runs_status_check check (
    status in (
      'setup_ready',
      'inviting',
      'invite_partial',
      'ready_for_cutover',
      'completed'
    )
  ),
  constraint organization_onboarding_completion_runs_ready_timestamp_check check (
    status not in ('ready_for_cutover', 'completed')
    or ready_for_cutover_at is not null
  ),
  constraint organization_onboarding_completion_runs_completed_timestamp_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  constraint organization_onboarding_completion_runs_timestamp_order_check check (
    ready_for_cutover_at is null
    or ready_for_cutover_at >= started_at
  ),
  constraint organization_onboarding_completion_runs_completed_order_check check (
    completed_at is null
    or (
      ready_for_cutover_at is not null
      and completed_at >= ready_for_cutover_at
    )
  )
);

comment on table public.organization_onboarding_completion_runs is
  'GATE-07 V2 onboarding orchestration/recovery state. Never grants product access; organizations.onboarding_completed_at remains authoritative.';
comment on column public.organization_onboarding_completion_runs.started_at is
  'First durable completion-run start; governed functions preserve this timestamp on replay.';
comment on column public.organization_onboarding_completion_runs.ready_for_cutover_at is
  'First database-derived transition to ready_for_cutover.';
comment on column public.organization_onboarding_completion_runs.completed_at is
  'Reserved for a later governed completion transition; P0-A never writes it.';

create trigger set_organization_onboarding_completion_runs_updated_at
  before update on public.organization_onboarding_completion_runs
  for each row
  execute function public.set_updated_at();

alter table public.organization_onboarding_completion_runs
  enable row level security;

revoke all on table public.organization_onboarding_completion_runs from public;
revoke all on table public.organization_onboarding_completion_runs from anon;
revoke all on table public.organization_onboarding_completion_runs from authenticated;
revoke all on table public.organization_onboarding_completion_runs from service_role;

-- ---------------------------------------------------------------------------
-- Per-intent database-derived result authority
-- ---------------------------------------------------------------------------

create table public.organization_onboarding_invitation_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  intent_id uuid not null,
  email_normalized text not null,
  target_role text not null,
  invitation_id uuid,
  result_code text not null default 'not_attempted',
  evidence_kind text not null default 'none',
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  idempotency_key text not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint organization_onboarding_invitation_results_org_id_unique
    unique (organization_id, id),
  constraint organization_onboarding_invitation_results_org_intent_unique
    unique (organization_id, intent_id),
  constraint organization_onboarding_invitation_results_idempotency_unique
    unique (idempotency_key),
  constraint organization_onboarding_invitation_results_organization_fk
    foreign key (organization_id)
      references public.organizations (id)
      on delete cascade,
  constraint organization_onboarding_invitation_results_intent_fk
    foreign key (organization_id, intent_id)
      references public.organization_onboarding_team_invite_intents (
        organization_id,
        id
      )
      on delete cascade,
  constraint organization_onboarding_invitation_results_invitation_fk
    foreign key (organization_id, invitation_id)
      references public.organization_invitations (organization_id, id)
      on delete restrict,
  constraint organization_onboarding_invitation_results_attempt_count_check
    check (attempt_count >= 0),
  constraint organization_onboarding_invitation_results_attempt_timestamp_check
    check (
      (attempt_count = 0 and last_attempt_at is null)
      or (attempt_count > 0 and last_attempt_at is not null)
    ),
  constraint organization_onboarding_invitation_results_target_role_check
    check (target_role in ('admin', 'staff', 'viewer')),
  constraint organization_onboarding_invitation_results_email_check check (
    email_normalized = pg_catalog.lower(pg_catalog.btrim(email_normalized))
    and pg_catalog.char_length(email_normalized) between 3 and 254
  ),
  constraint organization_onboarding_invitation_results_idempotency_check check (
    idempotency_key =
      'onboarding-invite/' || organization_id::text || '/' || intent_id::text
  ),
  constraint organization_onboarding_invitation_results_result_code_check check (
    result_code in (
      'not_attempted',
      'success',
      'invite_already_pending',
      'already_member',
      'existing_membership_requires_admin_action',
      'invalid_input',
      'forbidden',
      'rate_limited',
      'unexpected',
      'transport_error'
    )
  ),
  constraint organization_onboarding_invitation_results_evidence_kind_check check (
    evidence_kind in (
      'created_invitation',
      'pending_invitation',
      'active_membership',
      'membership_collision',
      'frozen_intent_invalid',
      'rate_limited',
      'none'
    )
  ),
  constraint organization_onboarding_invitation_results_proof_check check (
    (
      result_code = 'not_attempted'
      and evidence_kind = 'none'
      and invitation_id is null
      and attempt_count = 0
    )
    or (
      result_code = 'success'
      and evidence_kind = 'created_invitation'
      and invitation_id is not null
      and attempt_count > 0
    )
    or (
      result_code = 'invite_already_pending'
      and evidence_kind = 'pending_invitation'
      and invitation_id is not null
      and attempt_count > 0
    )
    or (
      result_code = 'already_member'
      and evidence_kind = 'active_membership'
      and invitation_id is null
      and attempt_count > 0
    )
    or (
      result_code = 'existing_membership_requires_admin_action'
      and evidence_kind = 'membership_collision'
      and invitation_id is null
      and attempt_count > 0
    )
    or (
      result_code = 'invalid_input'
      and evidence_kind = 'frozen_intent_invalid'
      and invitation_id is null
      and attempt_count > 0
    )
    or (
      result_code = 'rate_limited'
      and evidence_kind = 'rate_limited'
      and invitation_id is null
      and attempt_count > 0
    )
    or (
      result_code in ('forbidden', 'unexpected', 'transport_error')
      and evidence_kind = 'none'
      and invitation_id is null
      and attempt_count > 0
    )
  )
);

comment on table public.organization_onboarding_invitation_results is
  'GATE-07 database-derived disposition for one frozen Team invite intent. No caller supplies authoritative result, evidence, invitation id, email, role, or idempotency key.';
comment on column public.organization_onboarding_invitation_results.invitation_id is
  'Database-proven invitation in the same organization; never accepted from an RPC caller.';
comment on column public.organization_onboarding_invitation_results.idempotency_key is
  'SQL-generated onboarding-invite/{organization_id}/{intent_id} replay key.';

create trigger set_organization_onboarding_invitation_results_updated_at
  before update on public.organization_onboarding_invitation_results
  for each row
  execute function public.set_updated_at();

alter table public.organization_onboarding_invitation_results
  enable row level security;

revoke all on table public.organization_onboarding_invitation_results from public;
revoke all on table public.organization_onboarding_invitation_results from anon;
revoke all on table public.organization_onboarding_invitation_results from authenticated;
revoke all on table public.organization_onboarding_invitation_results from service_role;

-- ---------------------------------------------------------------------------
-- Private completion authorization and proof helpers
-- ---------------------------------------------------------------------------

create or replace function private.resolve_organization_onboarding_completion_actor(
  p_organization_id uuid
)
returns table (
  result_code text,
  actor_member_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_actor_member_id uuid;
  v_org public.organizations%rowtype;
begin
  if v_user_id is null then
    return query select 'NOT_AUTHENTICATED'::text, null::uuid;
    return;
  end if;

  if p_organization_id is null then
    return query select 'NOT_AUTHORIZED'::text, null::uuid;
    return;
  end if;

  select om.id
  into v_actor_member_id
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.user_id = v_user_id
    and om.status = 'active'
    and om.role = 'owner'
  limit 1
  for update;

  if v_actor_member_id is null then
    return query select 'NOT_AUTHORIZED'::text, null::uuid;
    return;
  end if;

  select o.*
  into v_org
  from public.organizations as o
  where o.id = p_organization_id
    and o.status = 'active'
  for update;

  if not found then
    return query select 'NOT_AUTHORIZED'::text, null::uuid;
    return;
  end if;

  if v_org.onboarding_flow_version is distinct from 2
    or v_org.onboarding_setup_ready_at is null then
    return query select 'INVALID_LIFECYCLE'::text, null::uuid;
    return;
  end if;

  return query select 'OK'::text, v_actor_member_id;
end;
$$;

comment on function private.resolve_organization_onboarding_completion_actor(uuid) is
  'Locks and resolves the authenticated active Owner plus active V2 Setup Ready organization.';

revoke all on function private.resolve_organization_onboarding_completion_actor(uuid)
  from public;
revoke all on function private.resolve_organization_onboarding_completion_actor(uuid)
  from anon;
revoke all on function private.resolve_organization_onboarding_completion_actor(uuid)
  from authenticated;
revoke all on function private.resolve_organization_onboarding_completion_actor(uuid)
  from service_role;

create or replace function private.resolve_organization_onboarding_invite_intent_evidence(
  p_organization_id uuid,
  p_intent_id uuid
)
returns table (
  result_code text,
  evidence_kind text,
  invitation_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_intent public.organization_onboarding_team_invite_intents%rowtype;
  v_result public.organization_onboarding_invitation_results%rowtype;
  v_invitation_id uuid;
  v_membership_status text;
begin
  select i.*
  into v_intent
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
    and i.id = p_intent_id;

  if not found then
    return;
  end if;

  select r.*
  into v_result
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = p_organization_id
    and r.intent_id = p_intent_id;

  if found and v_result.result_code = 'success'
    and v_result.evidence_kind = 'created_invitation'
    and exists (
      select 1
      from public.organization_invitations as oi
      where oi.organization_id = p_organization_id
        and oi.id = v_result.invitation_id
        and oi.email_normalized = v_intent.email_normalized
        and oi.role = v_intent.role
        and oi.status = 'pending'
        and oi.expires_at > pg_catalog.now()
    ) then
    return query
      select 'success'::text, 'created_invitation'::text, v_result.invitation_id;
    return;
  end if;

  if found and v_result.result_code = 'invite_already_pending'
    and v_result.evidence_kind = 'pending_invitation'
    and exists (
      select 1
      from public.organization_invitations as oi
      where oi.organization_id = p_organization_id
        and oi.id = v_result.invitation_id
        and oi.email_normalized = v_intent.email_normalized
        and oi.role = v_intent.role
        and oi.status = 'pending'
        and oi.expires_at > pg_catalog.now()
    ) then
    return query
      select 'invite_already_pending'::text,
             'pending_invitation'::text,
             v_result.invitation_id;
    return;
  end if;

  select om.status
  into v_membership_status
  from public.organization_members as om
  inner join auth.users as u on u.id = om.user_id
  where om.organization_id = p_organization_id
    and private.normalize_onboarding_team_invite_intent_email(u.email)
      = v_intent.email_normalized
  order by om.created_at, om.id
  limit 1;

  if v_membership_status = 'active' then
    return query
      select 'already_member'::text, 'active_membership'::text, null::uuid;
    return;
  end if;

  if v_membership_status in ('invited', 'suspended', 'removed') then
    return query
      select 'existing_membership_requires_admin_action'::text,
             'membership_collision'::text,
             null::uuid;
    return;
  end if;

  select oi.id
  into v_invitation_id
  from public.organization_invitations as oi
  where oi.organization_id = p_organization_id
    and oi.email_normalized = v_intent.email_normalized
    and oi.role = v_intent.role
    and oi.status = 'pending'
    and oi.expires_at > pg_catalog.now()
  order by oi.created_at, oi.id
  limit 1;

  if v_invitation_id is not null then
    return query
      select 'invite_already_pending'::text,
             'pending_invitation'::text,
             v_invitation_id;
    return;
  end if;

  if private.normalize_onboarding_team_invite_intent_email(
      v_intent.email_normalized
    ) is null
    or v_intent.role not in ('admin', 'staff', 'viewer') then
    return query
      select 'invalid_input'::text, 'frozen_intent_invalid'::text, null::uuid;
    return;
  end if;
end;
$$;

comment on function private.resolve_organization_onboarding_invite_intent_evidence(uuid, uuid) is
  'Derives one frozen intent disposition from durable invitation, membership, or frozen-input facts.';

revoke all on function private.resolve_organization_onboarding_invite_intent_evidence(uuid, uuid)
  from public;
revoke all on function private.resolve_organization_onboarding_invite_intent_evidence(uuid, uuid)
  from anon;
revoke all on function private.resolve_organization_onboarding_invite_intent_evidence(uuid, uuid)
  from authenticated;
revoke all on function private.resolve_organization_onboarding_invite_intent_evidence(uuid, uuid)
  from service_role;

create or replace function private.persist_organization_onboarding_invite_intent_result(
  p_organization_id uuid,
  p_intent_id uuid,
  p_result_code text,
  p_evidence_kind text,
  p_invitation_id uuid,
  p_increment_attempt boolean default true
)
returns public.organization_onboarding_invitation_results
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_intent public.organization_onboarding_team_invite_intents%rowtype;
  v_result public.organization_onboarding_invitation_results%rowtype;
  v_proven boolean := false;
  v_now timestamptz := pg_catalog.now();
begin
  select i.*
  into v_intent
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
    and i.id = p_intent_id
  for update;

  if not found then
    raise exception 'frozen onboarding invite intent not found'
      using errcode = 'P0001';
  end if;

  if p_result_code = 'success'
    and p_evidence_kind = 'created_invitation'
    and p_invitation_id is not null then
    select exists (
      select 1
      from public.organization_invitations as oi
      where oi.organization_id = p_organization_id
        and oi.id = p_invitation_id
        and oi.email_normalized = v_intent.email_normalized
        and oi.role = v_intent.role
        and oi.status = 'pending'
        and oi.expires_at > v_now
    ) into v_proven;
  elsif p_result_code = 'invite_already_pending'
    and p_evidence_kind = 'pending_invitation'
    and p_invitation_id is not null then
    select exists (
      select 1
      from public.organization_invitations as oi
      where oi.organization_id = p_organization_id
        and oi.id = p_invitation_id
        and oi.email_normalized = v_intent.email_normalized
        and oi.role = v_intent.role
        and oi.status = 'pending'
        and oi.expires_at > v_now
    ) into v_proven;
  elsif p_result_code = 'already_member'
    and p_evidence_kind = 'active_membership'
    and p_invitation_id is null then
    select exists (
      select 1
      from public.organization_members as om
      inner join auth.users as u on u.id = om.user_id
      where om.organization_id = p_organization_id
        and om.status = 'active'
        and private.normalize_onboarding_team_invite_intent_email(u.email)
          = v_intent.email_normalized
    ) into v_proven;
  elsif p_result_code = 'existing_membership_requires_admin_action'
    and p_evidence_kind = 'membership_collision'
    and p_invitation_id is null then
    select exists (
      select 1
      from public.organization_members as om
      inner join auth.users as u on u.id = om.user_id
      where om.organization_id = p_organization_id
        and om.status in ('invited', 'suspended', 'removed')
        and private.normalize_onboarding_team_invite_intent_email(u.email)
          = v_intent.email_normalized
    ) into v_proven;
  elsif p_result_code = 'invalid_input'
    and p_evidence_kind = 'frozen_intent_invalid'
    and p_invitation_id is null then
    v_proven :=
      private.normalize_onboarding_team_invite_intent_email(
        v_intent.email_normalized
      ) is null
      or v_intent.role not in ('admin', 'staff', 'viewer');
  elsif p_result_code = 'rate_limited'
    and p_evidence_kind = 'rate_limited'
    and p_invitation_id is null then
    select exists (
      select 1
      from private.organization_invitation_mutation_rate_limits as rl
      where rl.organization_id = p_organization_id
        and rl.actor_user_id = auth.uid()
        and rl.action = 'create'
        and rl.scope_key = ''
        and rl.attempt_count >= 10
        and pg_catalog.now()
          < rl.window_started_at + pg_catalog.make_interval(secs => 3600)
    ) into v_proven;
  elsif p_result_code in ('forbidden', 'unexpected', 'transport_error')
    and p_evidence_kind = 'none'
    and p_invitation_id is null then
    -- These outcomes never count toward cutover. They may only be written by
    -- this private ownership chain for truthful retry/recovery display.
    v_proven := true;
  end if;

  if not v_proven then
    raise exception 'onboarding invitation result lacks durable proof'
      using errcode = 'P0001';
  end if;

  insert into public.organization_onboarding_invitation_results (
    organization_id,
    intent_id,
    email_normalized,
    target_role,
    invitation_id,
    result_code,
    evidence_kind,
    attempt_count,
    last_attempt_at,
    idempotency_key
  )
  values (
    p_organization_id,
    p_intent_id,
    v_intent.email_normalized,
    v_intent.role,
    p_invitation_id,
    p_result_code,
    p_evidence_kind,
    1,
    v_now,
    'onboarding-invite/' || p_organization_id::text || '/' || p_intent_id::text
  )
  on conflict (organization_id, intent_id)
  do update set
    email_normalized = excluded.email_normalized,
    target_role = excluded.target_role,
    invitation_id = excluded.invitation_id,
    result_code = excluded.result_code,
    evidence_kind = excluded.evidence_kind,
    attempt_count = case
      when coalesce(p_increment_attempt, true)
        then public.organization_onboarding_invitation_results.attempt_count + 1
      else greatest(
        public.organization_onboarding_invitation_results.attempt_count,
        1
      )
    end,
    last_attempt_at = case
      when coalesce(p_increment_attempt, true)
        then v_now
      else coalesce(
        public.organization_onboarding_invitation_results.last_attempt_at,
        v_now
      )
    end,
    idempotency_key = excluded.idempotency_key
  returning * into v_result;

  return v_result;
end;
$$;

comment on function private.persist_organization_onboarding_invite_intent_result(uuid, uuid, text, text, uuid, boolean) is
  'Persists only database-verified per-intent evidence. Not a client result-recording API.';

revoke all on function private.persist_organization_onboarding_invite_intent_result(uuid, uuid, text, text, uuid, boolean)
  from public;
revoke all on function private.persist_organization_onboarding_invite_intent_result(uuid, uuid, text, text, uuid, boolean)
  from anon;
revoke all on function private.persist_organization_onboarding_invite_intent_result(uuid, uuid, text, text, uuid, boolean)
  from authenticated;
revoke all on function private.persist_organization_onboarding_invite_intent_result(uuid, uuid, text, text, uuid, boolean)
  from service_role;

create or replace function private.advance_organization_onboarding_completion_run(
  p_organization_id uuid
)
returns public.organization_onboarding_completion_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.organization_onboarding_completion_runs%rowtype;
  v_total integer;
  v_proven_terminal integer;
  v_attempted integer;
  v_retryable integer;
  v_status text;
  v_last_error text;
  v_now timestamptz := pg_catalog.now();
begin
  select r.*
  into v_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = p_organization_id
  for update;

  if not found then
    raise exception 'onboarding completion run required'
      using errcode = 'P0001';
  end if;

  select pg_catalog.count(*)::integer
  into v_total
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id;

  select pg_catalog.count(*)::integer
  into v_proven_terminal
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
    and exists (
      select 1
      from public.organization_onboarding_invitation_results as r
      where r.organization_id = i.organization_id
        and r.intent_id = i.id
        and (
          (
            r.result_code = 'success'
            and r.evidence_kind = 'created_invitation'
            and r.invitation_id is not null
            and exists (
              select 1
              from public.organization_invitations as oi
              where oi.organization_id = r.organization_id
                and oi.id = r.invitation_id
                and oi.email_normalized = i.email_normalized
                and oi.role = i.role
                and oi.status = 'pending'
                and oi.expires_at > pg_catalog.now()
            )
          )
          or (
            r.result_code = 'invite_already_pending'
            and r.evidence_kind = 'pending_invitation'
            and r.invitation_id is not null
            and exists (
              select 1
              from public.organization_invitations as oi
              where oi.organization_id = r.organization_id
                and oi.id = r.invitation_id
                and oi.email_normalized = i.email_normalized
                and oi.role = i.role
                and oi.status = 'pending'
                and oi.expires_at > pg_catalog.now()
            )
          )
          or (
            r.result_code = 'already_member'
            and r.evidence_kind = 'active_membership'
            and exists (
              select 1
              from public.organization_members as om
              inner join auth.users as u on u.id = om.user_id
              where om.organization_id = r.organization_id
                and om.status = 'active'
                and private.normalize_onboarding_team_invite_intent_email(u.email)
                  = i.email_normalized
            )
          )
          or (
            r.result_code = 'existing_membership_requires_admin_action'
            and r.evidence_kind = 'membership_collision'
            and exists (
              select 1
              from public.organization_members as om
              inner join auth.users as u on u.id = om.user_id
              where om.organization_id = r.organization_id
                and om.status in ('invited', 'suspended', 'removed')
                and private.normalize_onboarding_team_invite_intent_email(u.email)
                  = i.email_normalized
            )
          )
          or (
            r.result_code = 'invalid_input'
            and r.evidence_kind = 'frozen_intent_invalid'
            and (
              private.normalize_onboarding_team_invite_intent_email(
                i.email_normalized
              ) is null
              or i.role not in ('admin', 'staff', 'viewer')
            )
          )
        )
    );

  select
    pg_catalog.count(*) filter (
      where r.result_code <> 'not_attempted'
    )::integer,
    pg_catalog.count(*) filter (
      where r.result_code in (
        'forbidden',
        'rate_limited',
        'unexpected',
        'transport_error'
      )
    )::integer
  into v_attempted, v_retryable
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = p_organization_id;

  if v_run.status = 'completed' then
    return v_run;
  elsif v_total = 0 or v_proven_terminal = v_total then
    v_status := 'ready_for_cutover';
  elsif v_retryable > 0 then
    v_status := 'invite_partial';
  elsif v_attempted > 0 then
    v_status := 'inviting';
  else
    v_status := 'setup_ready';
  end if;

  select r.result_code
  into v_last_error
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = p_organization_id
    and r.result_code in (
      'forbidden',
      'rate_limited',
      'unexpected',
      'transport_error'
    )
  order by r.updated_at desc, r.id
  limit 1;

  update public.organization_onboarding_completion_runs as r
  set
    status = v_status,
    ready_for_cutover_at = case
      when v_status = 'ready_for_cutover'
        then coalesce(r.ready_for_cutover_at, v_now)
      else r.ready_for_cutover_at
    end,
    last_error_code = case
      when v_status = 'ready_for_cutover' then null
      else v_last_error
    end
  where r.organization_id = p_organization_id
  returning * into v_run;

  return v_run;
end;
$$;

comment on function private.advance_organization_onboarding_completion_run(uuid) is
  'Recomputes run state from frozen intents and durable terminal proof; zero intents become ready_for_cutover.';

revoke all on function private.advance_organization_onboarding_completion_run(uuid)
  from public;
revoke all on function private.advance_organization_onboarding_completion_run(uuid)
  from anon;
revoke all on function private.advance_organization_onboarding_completion_run(uuid)
  from authenticated;
revoke all on function private.advance_organization_onboarding_completion_run(uuid)
  from service_role;

-- ---------------------------------------------------------------------------
-- R2: preserve invitation internals behind lifecycle-aware public wrappers
-- ---------------------------------------------------------------------------

alter function public.create_organization_invitation(uuid, text, text)
  set schema private;
alter function private.create_organization_invitation(uuid, text, text)
  rename to create_organization_invitation_core;

revoke all on function private.create_organization_invitation_core(uuid, text, text)
  from public;
revoke all on function private.create_organization_invitation_core(uuid, text, text)
  from anon;
revoke all on function private.create_organization_invitation_core(uuid, text, text)
  from authenticated;
revoke all on function private.create_organization_invitation_core(uuid, text, text)
  from service_role;

create or replace function public.create_organization_invitation(
  p_organization_id uuid,
  p_email text,
  p_target_role text
)
returns table (
  result_code text,
  invitation_id uuid,
  expires_at timestamptz,
  raw_token text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_member_id uuid;
  v_flow_version integer;
  v_setup_ready_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null then
    return query
      select 'invalid_input'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  select actor.membership_id
  into v_actor_member_id
  from private.get_organization_invitation_actor_membership(
    p_organization_id
  ) as actor;

  if v_actor_member_id is null then
    return query
      select 'forbidden'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  select o.onboarding_flow_version, o.onboarding_setup_ready_at
  into v_flow_version, v_setup_ready_at
  from public.organizations as o
  where o.id = p_organization_id
    and o.status = 'active'
  for share;

  if not found then
    return query
      select 'forbidden'::text, null::uuid, null::timestamptz, null::text;
    return;
  end if;

  if v_flow_version = 2 and v_setup_ready_at is null then
    return query
      select 'setup_not_ready'::text,
             null::uuid,
             null::timestamptz,
             null::text;
    return;
  end if;

  return query
  select core.result_code, core.invitation_id, core.expires_at, core.raw_token
  from private.create_organization_invitation_core(
    p_organization_id,
    p_email,
    p_target_role
  ) as core;
end;
$$;

comment on function public.create_organization_invitation(uuid, text, text) is
  'Lifecycle-aware individual invitation create. V2 requires durable Setup Ready; V1 and NULL-version behavior is preserved.';

revoke all on function public.create_organization_invitation(uuid, text, text)
  from public;
revoke all on function public.create_organization_invitation(uuid, text, text)
  from anon;
revoke all on function public.create_organization_invitation(uuid, text, text)
  from service_role;
grant execute on function public.create_organization_invitation(uuid, text, text)
  to authenticated;

alter function public.resend_organization_invitation(uuid, uuid)
  set schema private;
alter function private.resend_organization_invitation(uuid, uuid)
  rename to resend_organization_invitation_core;

revoke all on function private.resend_organization_invitation_core(uuid, uuid)
  from public;
revoke all on function private.resend_organization_invitation_core(uuid, uuid)
  from anon;
revoke all on function private.resend_organization_invitation_core(uuid, uuid)
  from authenticated;
revoke all on function private.resend_organization_invitation_core(uuid, uuid)
  from service_role;

create or replace function public.resend_organization_invitation(
  p_organization_id uuid,
  p_invitation_id uuid
)
returns table (
  result_code text,
  invitation_id uuid,
  expires_at timestamptz,
  raw_token text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_member_id uuid;
  v_flow_version integer;
  v_setup_ready_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null or p_invitation_id is null then
    return query
      select 'invite_not_found_or_unavailable'::text,
             null::uuid,
             null::timestamptz,
             null::text;
    return;
  end if;

  select actor.membership_id
  into v_actor_member_id
  from private.get_organization_invitation_actor_membership(
    p_organization_id
  ) as actor;

  if v_actor_member_id is null then
    return query
      select 'invite_not_found_or_unavailable'::text,
             null::uuid,
             null::timestamptz,
             null::text;
    return;
  end if;

  select o.onboarding_flow_version, o.onboarding_setup_ready_at
  into v_flow_version, v_setup_ready_at
  from public.organizations as o
  where o.id = p_organization_id
    and o.status = 'active'
  for share;

  if not found then
    return query
      select 'invite_not_found_or_unavailable'::text,
             null::uuid,
             null::timestamptz,
             null::text;
    return;
  end if;

  if v_flow_version = 2 and v_setup_ready_at is null then
    return query
      select 'setup_not_ready'::text,
             null::uuid,
             null::timestamptz,
             null::text;
    return;
  end if;

  return query
  select core.result_code, core.invitation_id, core.expires_at, core.raw_token
  from private.resend_organization_invitation_core(
    p_organization_id,
    p_invitation_id
  ) as core;
end;
$$;

comment on function public.resend_organization_invitation(uuid, uuid) is
  'Lifecycle-aware individual invitation resend. V2 requires durable Setup Ready; V1 and NULL-version behavior is preserved.';

revoke all on function public.resend_organization_invitation(uuid, uuid)
  from public;
revoke all on function public.resend_organization_invitation(uuid, uuid)
  from anon;
revoke all on function public.resend_organization_invitation(uuid, uuid)
  from service_role;
grant execute on function public.resend_organization_invitation(uuid, uuid)
  to authenticated;

alter function public.accept_organization_invitation(text)
  set schema private;
alter function private.accept_organization_invitation(text)
  rename to accept_organization_invitation_core;

revoke all on function private.accept_organization_invitation_core(text)
  from public;
revoke all on function private.accept_organization_invitation_core(text)
  from anon;
revoke all on function private.accept_organization_invitation_core(text)
  from authenticated;
revoke all on function private.accept_organization_invitation_core(text)
  from service_role;

create or replace function public.accept_organization_invitation(
  p_raw_token text
)
returns table (
  result_code text,
  invitation_id uuid,
  organization_id uuid,
  membership_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_computed_hash text;
  v_flow_version integer;
  v_setup_ready_at timestamptz;
begin
  if auth.uid() is null then
    return query
      select 'invite_not_found_or_unavailable'::text,
             null::uuid,
             null::uuid,
             null::uuid;
    return;
  end if;

  if coalesce(p_raw_token, '') ~ '^[0-9a-f]{64}$' then
    v_computed_hash :=
      private.hash_organization_invitation_raw_token(p_raw_token);

    select o.onboarding_flow_version, o.onboarding_setup_ready_at
    into v_flow_version, v_setup_ready_at
    from public.organization_invitations as oi
    inner join public.organizations as o
      on o.id = oi.organization_id
      and o.status = 'active'
    where oi.token_hash = v_computed_hash
      and oi.status = 'pending'
      and oi.expires_at > pg_catalog.now()
    limit 1
    for share of o;

    if found and v_flow_version = 2 and v_setup_ready_at is null then
      return query
        select 'invite_not_found_or_unavailable'::text,
               null::uuid,
               null::uuid,
               null::uuid;
      return;
    end if;
  end if;

  return query
  select core.result_code,
         core.invitation_id,
         core.organization_id,
         core.membership_id
  from private.accept_organization_invitation_core(p_raw_token) as core;
end;
$$;

comment on function public.accept_organization_invitation(text) is
  'Opaque lifecycle-aware invitation acceptance. V2 activation is denied until durable Setup Ready; V1 and NULL-version behavior is preserved.';

revoke all on function public.accept_organization_invitation(text) from public;
revoke all on function public.accept_organization_invitation(text) from anon;
revoke all on function public.accept_organization_invitation(text) from service_role;
grant execute on function public.accept_organization_invitation(text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- Public completion authority
-- ---------------------------------------------------------------------------

create or replace function public.ensure_organization_onboarding_completion_run(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gate record;
  v_run public.organization_onboarding_completion_runs%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    872004,
    pg_catalog.hashtext(coalesce(p_organization_id::text, ''))
  );

  select *
  into v_gate
  from private.resolve_organization_onboarding_completion_actor(
    p_organization_id
  );

  if v_gate.result_code <> 'OK' then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', v_gate.result_code
    );
  end if;

  insert into public.organization_onboarding_completion_runs (
    organization_id,
    status
  )
  values (p_organization_id, 'setup_ready')
  on conflict (organization_id) do nothing;

  insert into public.organization_onboarding_invitation_results (
    organization_id,
    intent_id,
    email_normalized,
    target_role,
    idempotency_key
  )
  select
    i.organization_id,
    i.id,
    i.email_normalized,
    i.role,
    'onboarding-invite/' || i.organization_id::text || '/' || i.id::text
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
  on conflict (organization_id, intent_id) do nothing;

  v_run :=
    private.advance_organization_onboarding_completion_run(p_organization_id);

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'code', 'OK',
    'organization_id', v_run.organization_id,
    'status', v_run.status,
    'started_at', v_run.started_at,
    'ready_for_cutover_at', v_run.ready_for_cutover_at,
    'completed_at', v_run.completed_at,
    'last_error_code', v_run.last_error_code
  );
end;
$$;

comment on function public.ensure_organization_onboarding_completion_run(uuid) is
  'Idempotently creates the V2 Setup Ready completion run and frozen result snapshots; zero intents advance to ready_for_cutover.';

revoke all on function public.ensure_organization_onboarding_completion_run(uuid)
  from public;
revoke all on function public.ensure_organization_onboarding_completion_run(uuid)
  from anon;
revoke all on function public.ensure_organization_onboarding_completion_run(uuid)
  from service_role;
grant execute on function public.ensure_organization_onboarding_completion_run(uuid)
  to authenticated;

create or replace function public.list_organization_onboarding_frozen_team_invite_intents(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gate record;
  v_intents jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    872004,
    pg_catalog.hashtext(coalesce(p_organization_id::text, ''))
  );

  select *
  into v_gate
  from private.resolve_organization_onboarding_completion_actor(
    p_organization_id
  );

  if v_gate.result_code <> 'OK' then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', v_gate.result_code
    );
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', i.id,
        'organization_id', i.organization_id,
        'email_normalized', i.email_normalized,
        'role', i.role,
        'revision', i.revision,
        'created_at', i.created_at,
        'updated_at', i.updated_at
      )
      order by i.created_at, i.id
    ),
    '[]'::jsonb
  )
  into v_intents
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'code', 'OK',
    'organization_id', p_organization_id,
    'intents', v_intents
  );
end;
$$;

comment on function public.list_organization_onboarding_frozen_team_invite_intents(uuid) is
  'Owner-only deterministic read of frozen Team intents after V2 Setup Ready. Does not weaken pre-ready Team RPCs.';

revoke all on function public.list_organization_onboarding_frozen_team_invite_intents(uuid)
  from public;
revoke all on function public.list_organization_onboarding_frozen_team_invite_intents(uuid)
  from anon;
revoke all on function public.list_organization_onboarding_frozen_team_invite_intents(uuid)
  from service_role;
grant execute on function public.list_organization_onboarding_frozen_team_invite_intents(uuid)
  to authenticated;

create or replace function public.list_organization_onboarding_invitation_results(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gate record;
  v_results jsonb;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    872004,
    pg_catalog.hashtext(coalesce(p_organization_id::text, ''))
  );

  select *
  into v_gate
  from private.resolve_organization_onboarding_completion_actor(
    p_organization_id
  );

  if v_gate.result_code <> 'OK' then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', v_gate.result_code
    );
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'id', r.id,
        'organization_id', r.organization_id,
        'intent_id', r.intent_id,
        'email_normalized', r.email_normalized,
        'target_role', r.target_role,
        'invitation_id', r.invitation_id,
        'result_code', r.result_code,
        'evidence_kind', r.evidence_kind,
        'attempt_count', r.attempt_count,
        'last_attempt_at', r.last_attempt_at,
        'idempotency_key', r.idempotency_key,
        'created_at', r.created_at,
        'updated_at', r.updated_at
      )
      order by r.created_at, r.id
    ),
    '[]'::jsonb
  )
  into v_results
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = p_organization_id;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'code', 'OK',
    'organization_id', p_organization_id,
    'results', v_results
  );
end;
$$;

comment on function public.list_organization_onboarding_invitation_results(uuid) is
  'Owner-only deterministic read of database-derived onboarding invitation results.';

revoke all on function public.list_organization_onboarding_invitation_results(uuid)
  from public;
revoke all on function public.list_organization_onboarding_invitation_results(uuid)
  from anon;
revoke all on function public.list_organization_onboarding_invitation_results(uuid)
  from service_role;
grant execute on function public.list_organization_onboarding_invitation_results(uuid)
  to authenticated;

create or replace function public.execute_organization_onboarding_invite_intent(
  p_organization_id uuid,
  p_intent_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gate record;
  v_intent public.organization_onboarding_team_invite_intents%rowtype;
  v_existing public.organization_onboarding_invitation_results%rowtype;
  v_evidence record;
  v_result public.organization_onboarding_invitation_results%rowtype;
  v_run public.organization_onboarding_completion_runs%rowtype;
  v_create_code text;
  v_create_invitation_id uuid;
  v_create_expires_at timestamptz;
  v_raw_token text;
  v_evidence_kind text;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    872004,
    pg_catalog.hashtext(coalesce(p_organization_id::text, ''))
  );

  select *
  into v_gate
  from private.resolve_organization_onboarding_completion_actor(
    p_organization_id
  );

  if v_gate.result_code <> 'OK' then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', v_gate.result_code
    );
  end if;

  perform public.ensure_organization_onboarding_completion_run(
    p_organization_id
  );

  select i.*
  into v_intent
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
    and i.id = p_intent_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'INTENT_NOT_FOUND'
    );
  end if;

  select r.*
  into v_existing
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = p_organization_id
    and r.intent_id = p_intent_id
  for update;

  select *
  into v_evidence
  from private.resolve_organization_onboarding_invite_intent_evidence(
    p_organization_id,
    p_intent_id
  );

  if v_evidence.result_code is not null then
    if v_existing.id is not null
      and v_existing.result_code = v_evidence.result_code
      and v_existing.evidence_kind = v_evidence.evidence_kind
      and v_existing.invitation_id is not distinct from v_evidence.invitation_id
      and v_existing.result_code in (
        'success',
        'invite_already_pending',
        'already_member',
        'existing_membership_requires_admin_action',
        'invalid_input'
      ) then
      v_result := v_existing;
    else
      v_result :=
        private.persist_organization_onboarding_invite_intent_result(
          p_organization_id,
          p_intent_id,
          v_evidence.result_code,
          v_evidence.evidence_kind,
          v_evidence.invitation_id,
          true
        );
    end if;

    v_run :=
      private.advance_organization_onboarding_completion_run(
        p_organization_id
      );

    return pg_catalog.jsonb_build_object(
      'ok', true,
      'code', 'OK',
      'fresh_create', false,
      'result', pg_catalog.to_jsonb(v_result),
      'run_status', v_run.status
    );
  end if;

  select
    c.result_code,
    c.invitation_id,
    c.expires_at,
    c.raw_token
  into
    v_create_code,
    v_create_invitation_id,
    v_create_expires_at,
    v_raw_token
  from public.create_organization_invitation(
    p_organization_id,
    v_intent.email_normalized,
    v_intent.role
  ) as c;

  if v_create_code = 'success' then
    v_evidence_kind := 'created_invitation';
  elsif v_create_code = 'invite_already_pending' then
    v_evidence_kind := 'pending_invitation';
  elsif v_create_code = 'already_member' then
    v_evidence_kind := 'active_membership';
  elsif v_create_code = 'existing_membership_requires_admin_action' then
    v_evidence_kind := 'membership_collision';
  elsif v_create_code = 'invalid_input' then
    v_evidence_kind := 'frozen_intent_invalid';
  elsif v_create_code = 'rate_limited' then
    v_evidence_kind := 'rate_limited';
  else
    v_create_code := case
      when v_create_code = 'forbidden' then 'forbidden'
      else 'unexpected'
    end;
    v_evidence_kind := 'none';
    v_create_invitation_id := null;
  end if;

  if v_create_code in ('success', 'invite_already_pending')
    and not exists (
      select 1
      from public.organization_invitations as oi
      where oi.organization_id = p_organization_id
        and oi.id = v_create_invitation_id
        and oi.email_normalized = v_intent.email_normalized
        and oi.role = v_intent.role
        and oi.status = 'pending'
        and oi.expires_at > pg_catalog.now()
    ) then
    raise exception 'invitation result failed organization/email/status proof'
      using errcode = 'P0001';
  end if;

  if v_create_code = 'already_member'
    or v_create_code = 'existing_membership_requires_admin_action'
    or v_create_code = 'invalid_input' then
    select *
    into v_evidence
    from private.resolve_organization_onboarding_invite_intent_evidence(
      p_organization_id,
      p_intent_id
    );

    if v_evidence.result_code is distinct from v_create_code then
      raise exception 'invitation collision result failed durable proof'
        using errcode = 'P0001';
    end if;
  end if;

  v_result :=
    private.persist_organization_onboarding_invite_intent_result(
      p_organization_id,
      p_intent_id,
      v_create_code,
      v_evidence_kind,
      v_create_invitation_id,
      true
    );

  v_run :=
    private.advance_organization_onboarding_completion_run(
      p_organization_id
    );

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'code', 'OK',
    'fresh_create', v_create_code = 'success',
    'expires_at', v_create_expires_at,
    'raw_token', case
      when v_create_code = 'success' then v_raw_token
      else null
    end,
    'result', pg_catalog.to_jsonb(v_result),
    'run_status', v_run.status
  );
end;
$$;

comment on function public.execute_organization_onboarding_invite_intent(uuid, uuid) is
  'Executes exactly one frozen invite intent after V2 Setup Ready. Caller supplies no email, role, result, evidence, invitation id, or idempotency key.';

revoke all on function public.execute_organization_onboarding_invite_intent(uuid, uuid)
  from public;
revoke all on function public.execute_organization_onboarding_invite_intent(uuid, uuid)
  from anon;
revoke all on function public.execute_organization_onboarding_invite_intent(uuid, uuid)
  from service_role;
grant execute on function public.execute_organization_onboarding_invite_intent(uuid, uuid)
  to authenticated;

create or replace function public.reconcile_organization_onboarding_invite_intent(
  p_organization_id uuid,
  p_intent_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gate record;
  v_intent public.organization_onboarding_team_invite_intents%rowtype;
  v_existing public.organization_onboarding_invitation_results%rowtype;
  v_evidence record;
  v_result public.organization_onboarding_invitation_results%rowtype;
  v_run public.organization_onboarding_completion_runs%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    872004,
    pg_catalog.hashtext(coalesce(p_organization_id::text, ''))
  );

  select *
  into v_gate
  from private.resolve_organization_onboarding_completion_actor(
    p_organization_id
  );

  if v_gate.result_code <> 'OK' then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', v_gate.result_code
    );
  end if;

  perform public.ensure_organization_onboarding_completion_run(
    p_organization_id
  );

  select i.*
  into v_intent
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
    and i.id = p_intent_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'INTENT_NOT_FOUND'
    );
  end if;

  select r.*
  into v_existing
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = p_organization_id
    and r.intent_id = p_intent_id
  for update;

  select *
  into v_evidence
  from private.resolve_organization_onboarding_invite_intent_evidence(
    p_organization_id,
    p_intent_id
  );

  if v_evidence.result_code is not null then
    if v_existing.id is not null
      and v_existing.result_code = v_evidence.result_code
      and v_existing.evidence_kind = v_evidence.evidence_kind
      and v_existing.invitation_id is not distinct from v_evidence.invitation_id
      then
      v_result := v_existing;
    else
      v_result :=
        private.persist_organization_onboarding_invite_intent_result(
          p_organization_id,
          p_intent_id,
          v_evidence.result_code,
          v_evidence.evidence_kind,
          v_evidence.invitation_id,
          false
        );
    end if;
  else
    v_result := v_existing;
  end if;

  v_run :=
    private.advance_organization_onboarding_completion_run(
      p_organization_id
    );

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'code', 'OK',
    'result', pg_catalog.to_jsonb(v_result),
    'run_status', v_run.status
  );
end;
$$;

comment on function public.reconcile_organization_onboarding_invite_intent(uuid, uuid) is
  'Reconciles one frozen intent from durable facts without creating an invitation, consuming create rate limit, or reconstructing raw tokens.';

revoke all on function public.reconcile_organization_onboarding_invite_intent(uuid, uuid)
  from public;
revoke all on function public.reconcile_organization_onboarding_invite_intent(uuid, uuid)
  from anon;
revoke all on function public.reconcile_organization_onboarding_invite_intent(uuid, uuid)
  from service_role;
grant execute on function public.reconcile_organization_onboarding_invite_intent(uuid, uuid)
  to authenticated;
