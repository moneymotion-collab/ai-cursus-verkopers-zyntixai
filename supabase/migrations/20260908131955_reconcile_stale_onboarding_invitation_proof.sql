-- ENG-ONB-1H-P0-B4:
-- Forward-only correction for stale invitation-bearing onboarding proof.
--
-- invitation_proof_lost / historical_invitation means:
-- a previously proven invitation result still has an auditable invitation
-- reference, but that invitation is no longer current pending/unexpired proof
-- and no current membership or replacement invitation evidence exists.
-- This state is non-terminal and preserves attempt history.

alter table public.organization_onboarding_invitation_results
  drop constraint organization_onboarding_invitation_results_result_code_check,
  drop constraint organization_onboarding_invitation_results_evidence_kind_check,
  drop constraint organization_onboarding_invitation_results_proof_check;

alter table public.organization_onboarding_invitation_results
  add constraint organization_onboarding_invitation_results_result_code_check
    check (
      result_code in (
        'not_attempted',
        'success',
        'invite_already_pending',
        'already_member',
        'existing_membership_requires_admin_action',
        'invalid_input',
        'invitation_proof_lost',
        'forbidden',
        'rate_limited',
        'unexpected',
        'transport_error'
      )
    ),
  add constraint organization_onboarding_invitation_results_evidence_kind_check
    check (
      evidence_kind in (
        'created_invitation',
        'pending_invitation',
        'active_membership',
        'membership_collision',
        'frozen_intent_invalid',
        'historical_invitation',
        'rate_limited',
        'none'
      )
    ),
  add constraint organization_onboarding_invitation_results_proof_check
    check (
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
        result_code = 'invitation_proof_lost'
        and evidence_kind = 'historical_invitation'
        and invitation_id is not null
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
    );

comment on column public.organization_onboarding_invitation_results.result_code is
  'Database-derived intent disposition. invitation_proof_lost is non-terminal and records that prior invitation proof is no longer current.';

comment on column public.organization_onboarding_invitation_results.evidence_kind is
  'Current evidence class. historical_invitation preserves the referenced invitation for audit but never grants cutover readiness.';

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
  elsif p_result_code = 'invitation_proof_lost'
    and p_evidence_kind = 'historical_invitation'
    and p_invitation_id is not null then
    select exists (
      select 1
      from public.organization_onboarding_invitation_results as prior
      inner join public.organization_invitations as oi
        on oi.organization_id = prior.organization_id
        and oi.id = prior.invitation_id
      where prior.organization_id = p_organization_id
        and prior.intent_id = p_intent_id
        and prior.invitation_id = p_invitation_id
        and (
          (
            prior.result_code = 'success'
            and prior.evidence_kind = 'created_invitation'
          )
          or (
            prior.result_code = 'invite_already_pending'
            and prior.evidence_kind = 'pending_invitation'
          )
        )
        and not (
          oi.email_normalized = v_intent.email_normalized
          and oi.role = v_intent.role
          and oi.status = 'pending'
          and oi.expires_at > v_now
        )
        and not exists (
          select 1
          from public.organization_members as om
          inner join auth.users as u on u.id = om.user_id
          where om.organization_id = p_organization_id
            and om.status in ('active', 'invited', 'suspended', 'removed')
            and private.normalize_onboarding_team_invite_intent_email(u.email)
              = v_intent.email_normalized
        )
        and not exists (
          select 1
          from public.organization_invitations as current_invitation
          where current_invitation.organization_id = p_organization_id
            and current_invitation.email_normalized = v_intent.email_normalized
            and current_invitation.role = v_intent.role
            and current_invitation.status = 'pending'
            and current_invitation.expires_at > v_now
        )
        and private.normalize_onboarding_team_invite_intent_email(
          v_intent.email_normalized
        ) is not null
        and v_intent.role in ('admin', 'staff', 'viewer')
    ) into v_proven;
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
  'Persists only database-verified current evidence or an explicitly proven non-terminal historical invitation reference.';

revoke all on function private.persist_organization_onboarding_invite_intent_result(uuid, uuid, text, text, uuid, boolean)
  from public;
revoke all on function private.persist_organization_onboarding_invite_intent_result(uuid, uuid, text, text, uuid, boolean)
  from anon;
revoke all on function private.persist_organization_onboarding_invite_intent_result(uuid, uuid, text, text, uuid, boolean)
  from authenticated;
revoke all on function private.persist_organization_onboarding_invite_intent_result(uuid, uuid, text, text, uuid, boolean)
  from service_role;

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
  elsif v_existing.id is not null
    and v_existing.invitation_id is not null
    and (
      (
        v_existing.result_code = 'success'
        and v_existing.evidence_kind = 'created_invitation'
      )
      or (
        v_existing.result_code = 'invite_already_pending'
        and v_existing.evidence_kind = 'pending_invitation'
      )
    ) then
    v_result :=
      private.persist_organization_onboarding_invite_intent_result(
        p_organization_id,
        p_intent_id,
        'invitation_proof_lost',
        'historical_invitation',
        v_existing.invitation_id,
        false
      );
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
  'Reconciles one frozen intent from durable facts, converts invalidated invitation proof to a non-terminal historical state, and never creates invitations or tokens.';

revoke all on function public.reconcile_organization_onboarding_invite_intent(uuid, uuid)
  from public;
revoke all on function public.reconcile_organization_onboarding_invite_intent(uuid, uuid)
  from anon;
revoke all on function public.reconcile_organization_onboarding_invite_intent(uuid, uuid)
  from service_role;
grant execute on function public.reconcile_organization_onboarding_invite_intent(uuid, uuid)
  to authenticated;
