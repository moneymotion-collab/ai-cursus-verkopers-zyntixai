-- SMM-R1-E-R1 — Instagram provider 4xx diagnostic hardening
-- Additive nullable columns + complete RPC diagnostics. No lifecycle semantics change.
-- Does not mutate historical attempts. Publishing gate unchanged.

alter table public.social_publication_attempts
  add column if not exists provider_step text,
  add column if not exists provider_http_status integer,
  add column if not exists provider_error_code integer,
  add column if not exists provider_error_subcode integer,
  add column if not exists provider_error_type text,
  add column if not exists safe_provider_message text,
  add column if not exists provider_request_dispatched boolean,
  add column if not exists provider_response_received boolean,
  add column if not exists external_container_id_present boolean;

alter table public.social_publication_attempts
  drop constraint if exists social_publication_attempts_provider_step_chk;

alter table public.social_publication_attempts
  add constraint social_publication_attempts_provider_step_chk
  check (
    provider_step is null
    or provider_step in ('create_container', 'container_status', 'media_publish')
  );

alter table public.social_publication_attempts
  drop constraint if exists social_publication_attempts_provider_http_status_chk;

alter table public.social_publication_attempts
  add constraint social_publication_attempts_provider_http_status_chk
  check (
    provider_http_status is null
    or (provider_http_status >= 100 and provider_http_status <= 599)
  );

alter table public.social_publication_attempts
  drop constraint if exists social_publication_attempts_provider_error_type_chk;

alter table public.social_publication_attempts
  add constraint social_publication_attempts_provider_error_type_chk
  check (
    provider_error_type is null
    or (
      char_length(provider_error_type) <= 64
      and provider_error_type ~ '^[a-z][a-z0-9_.-]{0,63}$'
    )
  );

alter table public.social_publication_attempts
  drop constraint if exists social_publication_attempts_safe_provider_message_chk;

alter table public.social_publication_attempts
  add constraint social_publication_attempts_safe_provider_message_chk
  check (
    safe_provider_message is null
    or char_length(safe_provider_message) <= 240
  );

comment on column public.social_publication_attempts.provider_step is
  'R1-E-R1 safe Instagram provider operation that failed (create_container|container_status|media_publish).';
comment on column public.social_publication_attempts.provider_http_status is
  'R1-E-R1 Graph HTTP status when a response was received.';
comment on column public.social_publication_attempts.provider_error_code is
  'R1-E-R1 Meta Graph error.code when present.';
comment on column public.social_publication_attempts.provider_error_subcode is
  'R1-E-R1 Meta Graph error.error_subcode when present.';
comment on column public.social_publication_attempts.provider_error_type is
  'R1-E-R1 sanitized Meta Graph error.type when present.';
comment on column public.social_publication_attempts.safe_provider_message is
  'R1-E-R1 sanitized Meta Graph error.message when proven safe; never tokens/URLs.';
comment on column public.social_publication_attempts.provider_request_dispatched is
  'R1-E-R1 true when the provider HTTP request left this runtime.';
comment on column public.social_publication_attempts.provider_response_received is
  'R1-E-R1 true when an HTTP response (including non-2xx) was received.';
comment on column public.social_publication_attempts.external_container_id_present is
  'R1-E-R1 presence-only: whether a container id was obtained before failure.';

-- Replace private complete with additive diagnostic params (drop old 8-arg signature).
drop function if exists private.complete_social_publication_attempt(uuid, uuid, text, integer, text, text, text, text);

create or replace function private.complete_social_publication_attempt(
  p_organization_id uuid,
  p_attempt_id uuid,
  p_worker_id text,
  p_claim_generation integer,
  p_outcome text,
  p_failure_class text default null,
  p_safe_error_code text default null,
  p_external_publication_id text default null,
  p_provider_step text default null,
  p_provider_http_status integer default null,
  p_provider_error_code integer default null,
  p_provider_error_subcode integer default null,
  p_provider_error_type text default null,
  p_safe_provider_message text default null,
  p_provider_request_dispatched boolean default null,
  p_provider_response_received boolean default null,
  p_external_container_id_present boolean default null
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_attempt public.social_publication_attempts;
  v_pub public.social_publications;
  v_worker text := btrim(coalesce(p_worker_id, ''));
  v_outcome text := btrim(coalesce(p_outcome, ''));
  v_failure text := nullif(btrim(coalesce(p_failure_class, '')), '');
  v_error text := nullif(btrim(coalesce(p_safe_error_code, '')), '');
  v_ext text := nullif(btrim(coalesce(p_external_publication_id, '')), '');
  v_step text := nullif(btrim(coalesce(p_provider_step, '')), '');
  v_err_type text := nullif(btrim(coalesce(p_provider_error_type, '')), '');
  v_safe_msg text := nullif(btrim(coalesce(p_safe_provider_message, '')), '');
  v_retryable boolean := false;
  v_pub_status text;
  v_event text;
begin
  perform private.assert_social_publication_worker();

  select a.* into v_attempt from public.social_publication_attempts as a
  where a.organization_id = p_organization_id and a.id = p_attempt_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;
  if v_attempt.outcome <> 'processing' then return query select 'conflict'::text; return; end if;

  select p.* into v_pub from public.social_publications as p
  where p.organization_id = p_organization_id and p.id = v_attempt.publication_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;

  if v_pub.claimed_by is distinct from v_worker
     or v_pub.claim_generation is distinct from p_claim_generation
     or v_attempt.claim_generation is distinct from p_claim_generation
  then
    return query select 'stale_claim'::text; return;
  end if;

  if v_outcome not in (
    'succeeded', 'failed_retryable', 'failed_terminal', 'cancelled', 'unknown_external_outcome'
  ) then
    return query select 'invalid_input'::text; return;
  end if;

  if v_step is not null
     and v_step not in ('create_container', 'container_status', 'media_publish')
  then
    return query select 'invalid_input'::text; return;
  end if;

  if p_provider_http_status is not null
     and (p_provider_http_status < 100 or p_provider_http_status > 599)
  then
    return query select 'invalid_input'::text; return;
  end if;

  if v_err_type is not null
     and (
       char_length(v_err_type) > 64
       or v_err_type !~ '^[a-z][a-z0-9_.-]{0,63}$'
     )
  then
    return query select 'invalid_input'::text; return;
  end if;

  if v_safe_msg is not null and char_length(v_safe_msg) > 240 then
    return query select 'invalid_input'::text; return;
  end if;

  -- Reject obvious unsafe message content at the DB boundary.
  if v_safe_msg is not null and (
    v_safe_msg ~* 'bearer\\s'
    or v_safe_msg ~* 'access[_-]?token'
    or v_safe_msg ~* 'authorization'
    or v_safe_msg ~* 'https?://'
    or v_safe_msg ~* '[?&](sig|signature|token|key|secret)='
  ) then
    v_safe_msg := null;
  end if;

  if v_outcome = 'succeeded' then
    if v_ext is null or char_length(v_ext) > 256 then
      return query select 'invalid_input'::text; return;
    end if;
    v_pub_status := 'succeeded';
    v_event := 'social_publication_attempt_succeeded';
  elsif v_outcome = 'unknown_external_outcome' then
    v_pub_status := 'unknown_external_outcome';
    v_failure := coalesce(v_failure, 'unknown_external_outcome');
    v_event := 'social_publication_unknown_external_outcome';
  elsif v_outcome = 'cancelled' then
    v_pub_status := 'cancelled';
    v_event := 'social_publication_cancelled';
  elsif v_outcome = 'failed_retryable' then
    v_retryable := true;
    if v_pub.attempt_count >= v_pub.max_attempts then
      v_pub_status := 'failed_terminal';
      v_outcome := 'failed_terminal';
      v_retryable := false;
      v_event := 'social_publication_manual_intervention';
    else
      v_pub_status := 'failed_retryable';
      v_event := 'social_publication_attempt_failed';
    end if;
  else
    v_pub_status := case
      when v_failure in ('authorization', 'credential', 'capability', 'validation', 'media', 'provider_permanent', 'adapter_unavailable', 'feature_disabled', 'workflow_not_ready', 'connection_ineligible')
        then 'manual_intervention'
      else 'failed_terminal'
    end;
    v_event := case
      when v_pub_status = 'manual_intervention' then 'social_publication_manual_intervention'
      else 'social_publication_attempt_failed'
    end;
  end if;

  update public.social_publication_attempts
  set
    outcome = v_outcome,
    failure_class = v_failure,
    retryable = case when v_outcome = 'succeeded' then false else v_retryable end,
    safe_error_code = v_error,
    finished_at = pg_catalog.now(),
    provider_step = v_step,
    provider_http_status = p_provider_http_status,
    provider_error_code = p_provider_error_code,
    provider_error_subcode = p_provider_error_subcode,
    provider_error_type = v_err_type,
    safe_provider_message = v_safe_msg,
    provider_request_dispatched = p_provider_request_dispatched,
    provider_response_received = p_provider_response_received,
    external_container_id_present = p_external_container_id_present
  where organization_id = p_organization_id and id = p_attempt_id and outcome = 'processing';

  update public.social_publications
  set
    status = v_pub_status,
    completed_at = case when v_pub_status in ('succeeded', 'cancelled', 'failed_terminal', 'manual_intervention', 'unknown_external_outcome') then pg_catalog.now() else completed_at end,
    external_publication_id = case when v_outcome = 'succeeded' then v_ext else external_publication_id end,
    last_failure_class = case when v_outcome = 'succeeded' then null else v_failure end,
    next_attempt_at = case
      when v_pub_status = 'failed_retryable' then pg_catalog.now() + private.compute_social_publication_backoff(v_pub.attempt_count)
      else null
    end,
    claimed_by = null,
    claim_lease_expires_at = null
  where organization_id = p_organization_id and id = v_attempt.publication_id;

  perform private.insert_social_publication_event(
    p_organization_id, v_pub.brand_id, v_pub.workspace_id, v_attempt.publication_id, p_attempt_id,
    v_event, 'system', null,
    jsonb_strip_nulls(
      jsonb_build_object(
        'attempt_id', p_attempt_id,
        'outcome', v_outcome,
        'failure_class', v_failure,
        'publication_status', v_pub_status,
        'provider_step', v_step,
        'provider_http_status', p_provider_http_status,
        'provider_error_code', p_provider_error_code,
        'provider_error_subcode', p_provider_error_subcode,
        'provider_error_type', v_err_type,
        'safe_provider_message', v_safe_msg,
        'provider_request_dispatched', p_provider_request_dispatched,
        'provider_response_received', p_provider_response_received,
        'external_container_id_present', p_external_container_id_present
      )
    )
  );

  return query select 'success'::text;
end;
$$;

revoke all on function private.complete_social_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from public;
revoke all on function private.complete_social_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from anon;
revoke all on function private.complete_social_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from authenticated;
revoke all on function private.complete_social_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from service_role;

drop function if exists public.b18_complete_controlled_publication_attempt(uuid, uuid, text, integer, text, text, text, text);

create or replace function public.b18_complete_controlled_publication_attempt(
  p_organization_id uuid,
  p_attempt_id uuid,
  p_worker_id text,
  p_claim_generation integer,
  p_outcome text,
  p_failure_class text default null,
  p_safe_error_code text default null,
  p_external_publication_id text default null,
  p_provider_step text default null,
  p_provider_http_status integer default null,
  p_provider_error_code integer default null,
  p_provider_error_subcode integer default null,
  p_provider_error_type text default null,
  p_safe_provider_message text default null,
  p_provider_request_dispatched boolean default null,
  p_provider_response_received boolean default null,
  p_external_container_id_present boolean default null
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_complete_code text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated'
      using errcode = 'P0001';
  end if;

  if p_organization_id is null
     or p_attempt_id is null
     or p_claim_generation is null
     or nullif(btrim(coalesce(p_worker_id, '')), '') is null
  then
    return query select 'invalid_input'::text;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_connection_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_connection_mutation(p_organization_id);
  exception
    when raise_exception then
      return query select 'forbidden'::text;
      return;
  end;

  if not private.can_manage_social_connections(v_member_role) then
    return query select 'forbidden'::text;
    return;
  end if;

  perform set_config('zyntix.social_publication_worker', 'on', true);

  select c.result_code
  into v_complete_code
  from private.complete_social_publication_attempt(
    p_organization_id,
    p_attempt_id,
    p_worker_id,
    p_claim_generation,
    p_outcome,
    p_failure_class,
    p_safe_error_code,
    p_external_publication_id,
    p_provider_step,
    p_provider_http_status,
    p_provider_error_code,
    p_provider_error_subcode,
    p_provider_error_type,
    p_safe_provider_message,
    p_provider_request_dispatched,
    p_provider_response_received,
    p_external_container_id_present
  ) as c;

  return query select coalesce(v_complete_code, 'unexpected')::text;
end;
$$;

revoke all on function public.b18_complete_controlled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from public;
revoke all on function public.b18_complete_controlled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from anon;
revoke all on function public.b18_complete_controlled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from authenticated;
revoke all on function public.b18_complete_controlled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) from service_role;
grant execute on function public.b18_complete_controlled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) to authenticated;

comment on function private.complete_social_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) is
  'System-only publication attempt completion with optional R1-E-R1 provider diagnostics. Not granted to authenticated.';

comment on function public.b18_complete_controlled_publication_attempt(
  uuid, uuid, text, integer, text, text, text, text,
  text, integer, integer, integer, text, text, boolean, boolean, boolean
) is
  'B1.8 controlled Owner/Admin completion wrapper with optional R1-E-R1 provider diagnostics.';
