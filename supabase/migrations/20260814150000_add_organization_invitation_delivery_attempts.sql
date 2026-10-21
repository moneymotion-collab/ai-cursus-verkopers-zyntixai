-- ZyntixAI Invitations CB-E1-C:
-- Invitation email delivery-attempt observability + application-side idempotency.
--
-- Delivery attempts are separate from invitation lifecycle (pending/accepted/revoked/expired).
-- No raw tokens, acceptance URLs, email bodies, API keys, or provider payloads.
--
-- Production apply is NOT authorized in CB-E1-C implementation; local migration only.

create table if not exists private.organization_invitation_delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  invitation_id uuid not null,
  operation text not null,
  generation_key text not null,
  idempotency_key text not null,
  provider text not null default 'resend',
  status text not null,
  provider_message_id text,
  failure_category text,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint organization_invitation_delivery_attempts_operation_chk
    check (operation in ('create', 'resend')),
  constraint organization_invitation_delivery_attempts_status_chk
    check (status in ('pending', 'submitted', 'failed')),
  constraint organization_invitation_delivery_attempts_provider_chk
    check (provider = 'resend'),
  constraint organization_invitation_delivery_attempts_generation_chk
    check (
      char_length(generation_key) > 0
      and char_length(generation_key) <= 128
    ),
  constraint organization_invitation_delivery_attempts_idempotency_chk
    check (
      char_length(idempotency_key) > 0
      and char_length(idempotency_key) <= 256
    ),
  constraint organization_invitation_delivery_attempts_failure_chk
    check (
      failure_category is null
      or failure_category in (
        'provider_error',
        'configuration_error',
        'template_error'
      )
    ),
  constraint organization_invitation_delivery_attempts_message_id_chk
    check (
      provider_message_id is null
      or (
        char_length(provider_message_id) > 0
        and char_length(provider_message_id) <= 128
      )
    ),
  constraint organization_invitation_delivery_attempts_org_fk
    foreign key (organization_id)
      references public.organizations (id)
      on delete cascade,
  constraint organization_invitation_delivery_attempts_invitation_fk
    foreign key (organization_id, invitation_id)
      references public.organization_invitations (organization_id, id)
      on delete cascade,
  constraint organization_invitation_delivery_attempts_generation_uidx
    unique (organization_id, invitation_id, operation, generation_key),
  constraint organization_invitation_delivery_attempts_idempotency_uidx
    unique (idempotency_key)
);

comment on table private.organization_invitation_delivery_attempts is
  'CB-E1-C invitation email delivery attempts. No tokens, URLs, bodies, or secrets.';

create index if not exists organization_invitation_delivery_attempts_org_invite_updated_idx
  on private.organization_invitation_delivery_attempts (
    organization_id,
    invitation_id,
    updated_at desc
  );

revoke all on table private.organization_invitation_delivery_attempts from public;
revoke all on table private.organization_invitation_delivery_attempts from anon;
revoke all on table private.organization_invitation_delivery_attempts from authenticated;
revoke all on table private.organization_invitation_delivery_attempts from service_role;

-- Resolve an attempt for a logical delivery generation.
-- already_submitted → skip provider; proceed → caller may submit (pending/failed).
create or replace function public.resolve_organization_invitation_delivery_attempt(
  p_organization_id uuid,
  p_invitation_id uuid,
  p_operation text,
  p_generation_key text,
  p_idempotency_key text
)
returns table (
  outcome text,
  attempt_id uuid,
  status text,
  provider_message_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_attempt private.organization_invitation_delivery_attempts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required'
      using errcode = 'P0001';
  end if;

  if p_operation is distinct from 'create' and p_operation is distinct from 'resend' then
    raise exception 'invalid delivery operation'
      using errcode = 'P0001';
  end if;

  if p_generation_key is null
     or char_length(btrim(p_generation_key)) = 0
     or char_length(p_generation_key) > 128 then
    raise exception 'invalid generation key'
      using errcode = 'P0001';
  end if;

  if p_idempotency_key is null
     or char_length(btrim(p_idempotency_key)) = 0
     or char_length(p_idempotency_key) > 256 then
    raise exception 'invalid idempotency key'
      using errcode = 'P0001';
  end if;

  perform private.assert_active_organization_for_invitation_mutation(p_organization_id);

  select actor.member_role
  into v_actor_role
  from private.get_organization_invitation_actor_membership(p_organization_id) as actor;

  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then
    raise exception 'forbidden'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.organization_invitations as oi
    where oi.organization_id = p_organization_id
      and oi.id = p_invitation_id
  ) then
    raise exception 'invitation not found'
      using errcode = 'P0001';
  end if;

  insert into private.organization_invitation_delivery_attempts (
    organization_id,
    invitation_id,
    operation,
    generation_key,
    idempotency_key,
    provider,
    status
  )
  values (
    p_organization_id,
    p_invitation_id,
    p_operation,
    p_generation_key,
    p_idempotency_key,
    'resend',
    'pending'
  )
  on conflict on constraint organization_invitation_delivery_attempts_generation_uidx
  do nothing;

  select da.*
  into v_attempt
  from private.organization_invitation_delivery_attempts as da
  where da.organization_id = p_organization_id
    and da.invitation_id = p_invitation_id
    and da.operation = p_operation
    and da.generation_key = p_generation_key
  for update;

  if v_attempt.id is null then
    raise exception 'delivery attempt missing after resolve'
      using errcode = 'P0001';
  end if;

  if v_attempt.idempotency_key is distinct from p_idempotency_key then
    raise exception 'idempotency key mismatch for generation'
      using errcode = 'P0001';
  end if;

  if v_attempt.status = 'submitted' then
    return query
    select
      'already_submitted'::text,
      v_attempt.id,
      v_attempt.status,
      v_attempt.provider_message_id;
    return;
  end if;

  if v_attempt.status = 'failed' then
    update private.organization_invitation_delivery_attempts as da
    set
      status = 'pending',
      failure_category = null,
      provider_message_id = null,
      updated_at = pg_catalog.now()
    where da.id = v_attempt.id;
  end if;

  return query
  select
    'proceed'::text,
    v_attempt.id,
    'pending'::text,
    null::text;
end;
$$;

comment on function public.resolve_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) is
  'CB-E1-C: claim or load a delivery attempt for one invitation credential generation.';

revoke all on function public.resolve_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) from public;
revoke all on function public.resolve_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) from anon;
revoke all on function public.resolve_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) from service_role;
grant execute on function public.resolve_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) to authenticated;

create or replace function public.complete_organization_invitation_delivery_attempt(
  p_organization_id uuid,
  p_attempt_id uuid,
  p_status text,
  p_provider_message_id text default null,
  p_failure_category text default null
)
returns table (
  outcome text,
  attempt_id uuid,
  status text,
  provider_message_id text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_role text;
  v_attempt private.organization_invitation_delivery_attempts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required'
      using errcode = 'P0001';
  end if;

  if p_status is distinct from 'submitted' and p_status is distinct from 'failed' then
    raise exception 'invalid delivery completion status'
      using errcode = 'P0001';
  end if;

  if p_status = 'submitted' then
    if p_failure_category is not null then
      raise exception 'submitted attempts cannot include failure category'
        using errcode = 'P0001';
    end if;
  else
    if p_failure_category is null
       or p_failure_category not in (
         'provider_error',
         'configuration_error',
         'template_error'
       ) then
      raise exception 'invalid failure category'
        using errcode = 'P0001';
    end if;
    if p_provider_message_id is not null then
      raise exception 'failed attempts cannot include provider message id'
        using errcode = 'P0001';
    end if;
  end if;

  if p_provider_message_id is not null
     and (
       char_length(btrim(p_provider_message_id)) = 0
       or char_length(p_provider_message_id) > 128
     ) then
    raise exception 'invalid provider message id'
      using errcode = 'P0001';
  end if;

  perform private.assert_active_organization_for_invitation_mutation(p_organization_id);

  select actor.member_role
  into v_actor_role
  from private.get_organization_invitation_actor_membership(p_organization_id) as actor;

  if v_actor_role is null or v_actor_role not in ('owner', 'admin') then
    raise exception 'forbidden'
      using errcode = 'P0001';
  end if;

  select da.*
  into v_attempt
  from private.organization_invitation_delivery_attempts as da
  where da.id = p_attempt_id
    and da.organization_id = p_organization_id
  for update;

  if v_attempt.id is null then
    raise exception 'delivery attempt not found'
      using errcode = 'P0001';
  end if;

  if v_attempt.status = 'submitted' then
    return query
    select
      'already_submitted'::text,
      v_attempt.id,
      v_attempt.status,
      v_attempt.provider_message_id;
    return;
  end if;

  update private.organization_invitation_delivery_attempts as da
  set
    status = p_status,
    provider_message_id = case
      when p_status = 'submitted' then p_provider_message_id
      else null
    end,
    failure_category = case
      when p_status = 'failed' then p_failure_category
      else null
    end,
    updated_at = pg_catalog.now()
  where da.id = v_attempt.id
  returning da.* into v_attempt;

  return query
  select
    'completed'::text,
    v_attempt.id,
    v_attempt.status,
    v_attempt.provider_message_id;
end;
$$;

comment on function public.complete_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) is
  'CB-E1-C: finalize a delivery attempt as submitted or failed without storing secrets.';

revoke all on function public.complete_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) from public;
revoke all on function public.complete_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) from anon;
revoke all on function public.complete_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) from service_role;
grant execute on function public.complete_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) to authenticated;
