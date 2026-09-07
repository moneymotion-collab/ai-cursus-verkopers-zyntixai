-- ENG-ONB-1G-A1: durable, non-actionable onboarding Team invite intents.
-- These rows are not organization invitations and intentionally contain no
-- token, expiry, delivery, invitation lifecycle, or membership authority.

create table public.organization_onboarding_team_invite_intents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null
    references public.organizations (id) on delete cascade,
  email_normalized text not null,
  role text not null,
  revision bigint not null default 1,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint organization_onboarding_team_invite_intents_org_id_unique
    unique (organization_id, id),
  constraint organization_onboarding_team_invite_intents_org_email_unique
    unique (organization_id, email_normalized),
  constraint organization_onboarding_team_invite_intents_email_check check (
    email_normalized = pg_catalog.lower(pg_catalog.btrim(email_normalized))
    and pg_catalog.char_length(email_normalized) between 3 and 254
    and email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint organization_onboarding_team_invite_intents_role_check
    check (role in ('admin', 'staff', 'viewer')),
  constraint organization_onboarding_team_invite_intents_revision_check
    check (revision >= 1)
);

comment on table public.organization_onboarding_team_invite_intents is
  'Non-actionable onboarding Team invite intent. Structurally separate from organization invitations.';
comment on column public.organization_onboarding_team_invite_intents.email_normalized is
  'Canonical lower-cased, trimmed intended teammate email; never an invitation token target by itself.';
comment on column public.organization_onboarding_team_invite_intents.revision is
  'Optimistic-concurrency revision. Starts at 1 and increments after each successful update.';

create trigger set_organization_onboarding_team_invite_intents_updated_at
  before update on public.organization_onboarding_team_invite_intents
  for each row
  execute function public.set_updated_at();

alter table public.organization_onboarding_team_invite_intents enable row level security;

revoke all on table public.organization_onboarding_team_invite_intents
  from public, anon, authenticated;

-- Canonical email normalization and database validation for every RPC mutation.
create or replace function private.normalize_onboarding_team_invite_intent_email(
  p_email text
)
returns text
language sql
immutable
security invoker
set search_path = ''
as $$
  select case
    when p_email is null then null
    when pg_catalog.char_length(pg_catalog.lower(pg_catalog.btrim(p_email)))
      not between 3 and 254 then null
    when pg_catalog.lower(pg_catalog.btrim(p_email))
      !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then null
    else pg_catalog.lower(pg_catalog.btrim(p_email))
  end;
$$;

comment on function private.normalize_onboarding_team_invite_intent_email(text) is
  'Normalizes and validates Team invite-intent email input without creating invitation authority.';

revoke all on function private.normalize_onboarding_team_invite_intent_email(text)
  from public, anon, authenticated;

-- Shared owner/lifecycle gate used by LIST and all mutations. The configured
-- predicate mirrors the governed V2 lifecycle and Setup Ready prerequisites
-- without invoking or changing the Setup Ready transition.
create or replace function private.resolve_onboarding_team_invite_intent_actor(
  p_organization_id uuid
)
returns table (
  result_code text,
  actor_member_id uuid,
  actor_email_normalized text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_actor_member_id uuid;
  v_actor_email_normalized text;
  v_org public.organizations%rowtype;
  v_display_name text;
  v_has_configured_context boolean;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return query select 'NOT_AUTHENTICATED'::text, null::uuid, null::text;
    return;
  end if;

  if p_organization_id is null then
    return query select 'NOT_AUTHORIZED'::text, null::uuid, null::text;
    return;
  end if;

  select
    om.id,
    private.normalize_onboarding_team_invite_intent_email(u.email)
  into
    v_actor_member_id,
    v_actor_email_normalized
  from public.organization_members as om
  inner join auth.users as u on u.id = om.user_id
  where om.organization_id = p_organization_id
    and om.user_id = v_user_id
    and om.status = 'active'
    and om.role = 'owner'
  limit 1
  for share of om;

  if v_actor_member_id is null or v_actor_email_normalized is null then
    return query select 'NOT_AUTHORIZED'::text, null::uuid, null::text;
    return;
  end if;

  select *
  into v_org
  from public.organizations as o
  where o.id = p_organization_id
    and o.status = 'active'
  for share;

  if not found then
    return query select 'NOT_AUTHORIZED'::text, null::uuid, null::text;
    return;
  end if;

  if v_org.onboarding_flow_version is distinct from 2
    or v_org.onboarding_setup_ready_at is not null
    or v_org.onboarding_completed_at is not null then
    return query select 'INVALID_LIFECYCLE'::text, null::uuid, null::text;
    return;
  end if;

  select nullif(pg_catalog.btrim(coalesce(p.display_name, '')), '')
  into v_display_name
  from public.profiles as p
  where p.id = v_user_id;

  if v_display_name is null
    or nullif(pg_catalog.btrim(coalesce(v_org.name, '')), '') is null
    or v_org.team_size_band is null
    or v_org.team_size_band not in ('solo', '2_5', '6_20', '21_plus') then
    return query select 'INVALID_LIFECYCLE'::text, null::uuid, null::text;
    return;
  end if;

  select exists (
    select 1
    from public.organization_business_activities as a
    inner join public.organization_context_assignments as c
      on c.organization_id = a.organization_id
      and c.business_activity_id = a.id
      and c.status = 'active'
    inner join public.context_pack_versions as v
      on v.id = c.context_pack_version_id
      and v.publication_status = 'published'
    inner join public.context_packs as p
      on p.id = v.pack_id
      and p.lifecycle_status = 'active'
    inner join public.context_pack_readiness as r
      on r.version_id = v.id
      and r.readiness_status in (
        'context_ready',
        'beta_supported',
        'production_verified'
      )
    where a.organization_id = p_organization_id
      and a.status = 'active'
      and a.is_primary = true
      and p.pack_key in (
        'niche.online-course-business',
        'foundation.knowledge',
        'foundation.service',
        'foundation.field-operations',
        'foundation.product-operations'
      )
  )
  into v_has_configured_context;

  if not v_has_configured_context then
    return query select 'INVALID_LIFECYCLE'::text, null::uuid, null::text;
    return;
  end if;

  return query
    select 'OK'::text, v_actor_member_id, v_actor_email_normalized;
end;
$$;

comment on function private.resolve_onboarding_team_invite_intent_actor(uuid) is
  'Owner-only active-organization and exact V2 configured lifecycle gate for Team invite-intent RPCs.';

revoke all on function private.resolve_onboarding_team_invite_intent_actor(uuid)
  from public, anon, authenticated;

-- Read-only eligibility collision resolver. Expired-by-clock pending rows and
-- explicit expired/revoked invitations do not block, matching real invitation
-- re-creation eligibility without mutating invitation status.
create or replace function private.resolve_onboarding_team_invite_intent_collision(
  p_organization_id uuid,
  p_email_normalized text,
  p_excluded_intent_id uuid default null
)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.organization_members as om
    inner join auth.users as u on u.id = om.user_id
    where om.organization_id = p_organization_id
      and private.normalize_onboarding_team_invite_intent_email(u.email)
        = p_email_normalized
  ) then
    return 'EXISTING_MEMBER';
  end if;

  if exists (
    select 1
    from public.organization_invitations as oi
    where oi.organization_id = p_organization_id
      and oi.email_normalized = p_email_normalized
      and oi.status = 'pending'
      and oi.expires_at > pg_catalog.now()
  ) then
    return 'PENDING_INVITATION';
  end if;

  if exists (
    select 1
    from public.organization_onboarding_team_invite_intents as i
    where i.organization_id = p_organization_id
      and i.email_normalized = p_email_normalized
      and (p_excluded_intent_id is null or i.id <> p_excluded_intent_id)
  ) then
    return 'DUPLICATE_INTENT';
  end if;

  return 'OK';
end;
$$;

comment on function private.resolve_onboarding_team_invite_intent_collision(uuid, text, uuid) is
  'Read-only member, active pending invitation, and duplicate Team intent collision authority.';

revoke all on function private.resolve_onboarding_team_invite_intent_collision(uuid, text, uuid)
  from public, anon, authenticated;

create or replace function public.list_organization_onboarding_team_invite_intents(
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
  select *
  into v_gate
  from private.resolve_onboarding_team_invite_intent_actor(p_organization_id);

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

comment on function public.list_organization_onboarding_team_invite_intents(uuid) is
  'Lists only the authorized Owner organization Team invite intents in deterministic order while V2 configured.';

revoke all on function public.list_organization_onboarding_team_invite_intents(uuid)
  from public, anon;
grant execute on function public.list_organization_onboarding_team_invite_intents(uuid)
  to authenticated;

create or replace function public.create_organization_onboarding_team_invite_intent(
  p_organization_id uuid,
  p_email text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gate record;
  v_email_normalized text;
  v_collision_code text;
  v_intent public.organization_onboarding_team_invite_intents%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    872003,
    pg_catalog.hashtext(coalesce(p_organization_id::text, ''))
  );

  select *
  into v_gate
  from private.resolve_onboarding_team_invite_intent_actor(p_organization_id);

  if v_gate.result_code <> 'OK' then
    return pg_catalog.jsonb_build_object('ok', false, 'code', v_gate.result_code);
  end if;

  v_email_normalized :=
    private.normalize_onboarding_team_invite_intent_email(p_email);
  if v_email_normalized is null then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'INVALID_EMAIL');
  end if;

  if p_role is null or p_role not in ('admin', 'staff', 'viewer') then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'INVALID_ROLE');
  end if;

  if v_email_normalized = v_gate.actor_email_normalized then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'SELF_INVITE');
  end if;

  v_collision_code :=
    private.resolve_onboarding_team_invite_intent_collision(
      p_organization_id,
      v_email_normalized,
      null
    );
  if v_collision_code <> 'OK' then
    return pg_catalog.jsonb_build_object('ok', false, 'code', v_collision_code);
  end if;

  begin
    insert into public.organization_onboarding_team_invite_intents (
      organization_id,
      email_normalized,
      role
    )
    values (
      p_organization_id,
      v_email_normalized,
      p_role
    )
    returning * into v_intent;
  exception
    when unique_violation then
      return pg_catalog.jsonb_build_object(
        'ok', false,
        'code', 'DUPLICATE_INTENT'
      );
  end;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'code', 'OK',
    'intent', pg_catalog.jsonb_build_object(
      'id', v_intent.id,
      'organization_id', v_intent.organization_id,
      'email_normalized', v_intent.email_normalized,
      'role', v_intent.role,
      'revision', v_intent.revision,
      'created_at', v_intent.created_at,
      'updated_at', v_intent.updated_at
    )
  );
end;
$$;

comment on function public.create_organization_onboarding_team_invite_intent(uuid, text, text) is
  'Creates one non-actionable Team invite intent after Owner, V2 lifecycle, email, role, self, member, invitation, and duplicate checks.';

revoke all on function public.create_organization_onboarding_team_invite_intent(uuid, text, text)
  from public, anon;
grant execute on function public.create_organization_onboarding_team_invite_intent(uuid, text, text)
  to authenticated;

create or replace function public.update_organization_onboarding_team_invite_intent(
  p_organization_id uuid,
  p_intent_id uuid,
  p_expected_revision bigint,
  p_email text,
  p_role text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gate record;
  v_email_normalized text;
  v_collision_code text;
  v_intent public.organization_onboarding_team_invite_intents%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    872003,
    pg_catalog.hashtext(coalesce(p_organization_id::text, ''))
  );

  select *
  into v_gate
  from private.resolve_onboarding_team_invite_intent_actor(p_organization_id);

  if v_gate.result_code <> 'OK' then
    return pg_catalog.jsonb_build_object('ok', false, 'code', v_gate.result_code);
  end if;

  select *
  into v_intent
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
    and i.id = p_intent_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  if p_expected_revision is null
    or p_expected_revision <> v_intent.revision then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'STALE_REVISION',
      'current_revision', v_intent.revision
    );
  end if;

  v_email_normalized :=
    private.normalize_onboarding_team_invite_intent_email(p_email);
  if v_email_normalized is null then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'INVALID_EMAIL');
  end if;

  if p_role is null or p_role not in ('admin', 'staff', 'viewer') then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'INVALID_ROLE');
  end if;

  if v_email_normalized = v_gate.actor_email_normalized then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'SELF_INVITE');
  end if;

  v_collision_code :=
    private.resolve_onboarding_team_invite_intent_collision(
      p_organization_id,
      v_email_normalized,
      p_intent_id
    );
  if v_collision_code <> 'OK' then
    return pg_catalog.jsonb_build_object('ok', false, 'code', v_collision_code);
  end if;

  begin
    update public.organization_onboarding_team_invite_intents as i
    set email_normalized = v_email_normalized,
        role = p_role,
        revision = i.revision + 1
    where i.organization_id = p_organization_id
      and i.id = p_intent_id
      and i.revision = p_expected_revision
    returning * into v_intent;
  exception
    when unique_violation then
      return pg_catalog.jsonb_build_object(
        'ok', false,
        'code', 'DUPLICATE_INTENT'
      );
  end;

  if not found then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'STALE_REVISION');
  end if;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'code', 'OK',
    'intent', pg_catalog.jsonb_build_object(
      'id', v_intent.id,
      'organization_id', v_intent.organization_id,
      'email_normalized', v_intent.email_normalized,
      'role', v_intent.role,
      'revision', v_intent.revision,
      'created_at', v_intent.created_at,
      'updated_at', v_intent.updated_at
    )
  );
end;
$$;

comment on function public.update_organization_onboarding_team_invite_intent(uuid, uuid, bigint, text, text) is
  'Updates only Team invite-intent email and role when the expected revision is current.';

revoke all on function public.update_organization_onboarding_team_invite_intent(uuid, uuid, bigint, text, text)
  from public, anon;
grant execute on function public.update_organization_onboarding_team_invite_intent(uuid, uuid, bigint, text, text)
  to authenticated;

create or replace function public.delete_organization_onboarding_team_invite_intent(
  p_organization_id uuid,
  p_intent_id uuid,
  p_expected_revision bigint
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_gate record;
  v_intent public.organization_onboarding_team_invite_intents%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    872003,
    pg_catalog.hashtext(coalesce(p_organization_id::text, ''))
  );

  select *
  into v_gate
  from private.resolve_onboarding_team_invite_intent_actor(p_organization_id);

  if v_gate.result_code <> 'OK' then
    return pg_catalog.jsonb_build_object('ok', false, 'code', v_gate.result_code);
  end if;

  select *
  into v_intent
  from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
    and i.id = p_intent_id
  for update;

  if not found then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  end if;

  if p_expected_revision is null
    or p_expected_revision <> v_intent.revision then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'STALE_REVISION',
      'current_revision', v_intent.revision
    );
  end if;

  delete from public.organization_onboarding_team_invite_intents as i
  where i.organization_id = p_organization_id
    and i.id = p_intent_id
    and i.revision = p_expected_revision;

  if not found then
    return pg_catalog.jsonb_build_object('ok', false, 'code', 'STALE_REVISION');
  end if;

  return pg_catalog.jsonb_build_object(
    'ok', true,
    'code', 'OK',
    'intent_id', p_intent_id,
    'deleted_revision', p_expected_revision
  );
end;
$$;

comment on function public.delete_organization_onboarding_team_invite_intent(uuid, uuid, bigint) is
  'Deletes only the selected unexecuted Team invite intent when the expected revision is current.';

revoke all on function public.delete_organization_onboarding_team_invite_intent(uuid, uuid, bigint)
  from public, anon;
grant execute on function public.delete_organization_onboarding_team_invite_intent(uuid, uuid, bigint)
  to authenticated;
