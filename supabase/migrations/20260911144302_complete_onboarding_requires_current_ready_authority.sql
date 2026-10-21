-- ENG-ONB-1H-P1-C-R1 — Database-atomic Ready completion authority.
--
-- Forward-only replacement of public.complete_organization_v2_onboarding(uuid).
-- The previous function completed a V2 Setup Ready organization without proving
-- that the completion run is currently ready_for_cutover from current evidence.
-- This replacement serializes on the completion-run advisory lock, revalidates
-- every frozen intent against current invitation and membership rows, and writes
-- organization and run completion atomically with one database-authored timestamp.
--
-- Canonical advisory-lock order (never invert):
--   1. 872002 + hashtext(p_organization_id::text)
--      lifecycle namespace already used by Setup Ready and legacy apply
--   2. 872004 + hashtext(coalesce(p_organization_id::text, ''))
--      completion-run reconciliation namespace used by ensure/list/execute/reconcile
-- Invitation revoke/accept/create do not take 872004; this function therefore also
-- row-locks invitations and memberships so those mutations serialize with the
-- Ready decision. 872004 alone is not claimed to cover those paths.

create or replace function public.complete_organization_v2_onboarding(
  p_organization_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_actor_member_id uuid;
  v_org public.organizations%rowtype;
  v_run public.organization_onboarding_completion_runs%rowtype;
  v_intent public.organization_onboarding_team_invite_intents%rowtype;
  v_existing public.organization_onboarding_invitation_results%rowtype;
  v_evidence record;
  v_completed_at timestamptz;
  v_run_updated integer;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'NOT_AUTHENTICATED'
    );
  end if;

  if p_organization_id is null then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_NOT_FOUND'
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    872002,
    pg_catalog.hashtext(p_organization_id::text)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    872004,
    pg_catalog.hashtext(coalesce(p_organization_id::text, ''))
  );

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
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'NOT_AUTHORIZED'
    );
  end if;

  select *
    into v_org
  from public.organizations as o
  where o.id = p_organization_id
    and o.status = 'active'
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'ORGANIZATION_NOT_FOUND'
    );
  end if;

  if v_org.onboarding_flow_version is distinct from 2 then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'WRONG_FLOW_VERSION'
    );
  end if;

  if v_org.onboarding_setup_ready_at is null then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'SETUP_NOT_READY'
    );
  end if;

  if v_org.onboarding_completed_at is not null then
    return pg_catalog.jsonb_build_object(
      'ok', true,
      'idempotent', true,
      'state', 'completed',
      'organization_id', v_org.id,
      'onboarding_setup_ready_at', v_org.onboarding_setup_ready_at,
      'onboarding_completed_at', v_org.onboarding_completed_at
    );
  end if;

  select r.*
    into v_run
  from public.organization_onboarding_completion_runs as r
  where r.organization_id = p_organization_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'NOT_READY'
    );
  end if;

  perform 1
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
  order by i.id
  for update;

  perform 1
  from public.organization_onboarding_invitation_results as r
  where r.organization_id = p_organization_id
  order by r.id
  for update;

  perform 1
  from public.organization_invitations as oi
  where oi.organization_id = p_organization_id
  order by oi.id
  for update;

  perform 1
  from public.organization_members as om
  where om.organization_id = p_organization_id
    and om.id is distinct from v_actor_member_id
  order by om.id
  for update;

  for v_intent in
    select i.*
    from public.organization_onboarding_team_invite_intents as i
    where i.organization_id = p_organization_id
    order by i.id
  loop
    select r.*
      into v_existing
    from public.organization_onboarding_invitation_results as r
    where r.organization_id = p_organization_id
      and r.intent_id = v_intent.id;

    select *
      into v_evidence
    from private.resolve_organization_onboarding_invite_intent_evidence(
      p_organization_id,
      v_intent.id
    );

    if v_evidence.result_code is not null then
      if v_existing.id is not null
        and v_existing.result_code = v_evidence.result_code
        and v_existing.evidence_kind = v_evidence.evidence_kind
        and v_existing.invitation_id is not distinct from v_evidence.invitation_id
      then
        null;
      else
        perform private.persist_organization_onboarding_invite_intent_result(
          p_organization_id,
          v_intent.id,
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
      perform private.persist_organization_onboarding_invite_intent_result(
        p_organization_id,
        v_intent.id,
        'invitation_proof_lost',
        'historical_invitation',
        v_existing.invitation_id,
        false
      );
    end if;
  end loop;

  v_run := private.advance_organization_onboarding_completion_run(
    p_organization_id
  );

  if v_run.status is distinct from 'ready_for_cutover' then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'NOT_READY'
    );
  end if;

  v_completed_at := pg_catalog.now();

  update public.organizations as o
  set onboarding_completed_at = v_completed_at
  where o.id = p_organization_id
    and o.onboarding_completed_at is null;

  if not found then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'NOT_READY'
    );
  end if;

  update public.organization_onboarding_completion_runs as r
  set
    status = 'completed',
    completed_at = v_completed_at
  where r.organization_id = p_organization_id
    and r.status = 'ready_for_cutover'
    and r.completed_at is null
    and r.ready_for_cutover_at is not null
  returning * into v_run;

  get diagnostics v_run_updated = row_count;
  if v_run_updated <> 1 or v_run.completed_at is distinct from v_completed_at then
    raise exception 'onboarding completion run could not complete atomically'
      using errcode = 'P0001';
  end if;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'idempotent', false,
    'state', 'completed',
    'organization_id', v_org.id,
    'onboarding_setup_ready_at', v_org.onboarding_setup_ready_at,
    'onboarding_completed_at', v_completed_at
  );
end;
$$;

comment on function public.complete_organization_v2_onboarding(uuid) is
  'Owner-only atomic V2 completion. Requires current Ready authority from completion-run evidence; writes organization and run completion together; preserves first-Ready and first-success timestamps.';

revoke all on function public.complete_organization_v2_onboarding(uuid) from public;
revoke all on function public.complete_organization_v2_onboarding(uuid) from anon;
grant execute on function public.complete_organization_v2_onboarding(uuid) to authenticated;
