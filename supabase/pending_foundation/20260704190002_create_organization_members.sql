-- ZyntixAI foundation: organization_members (user ↔ organization membership)

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'viewer'
    check (role in ('owner', 'admin', 'staff', 'viewer')),
  status text not null default 'invited'
    check (status in ('invited', 'active', 'suspended', 'removed')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_members_org_user_unique unique (organization_id, user_id)
);

comment on table public.organization_members is 'Links profiles to organizations with role and membership status.';
comment on column public.organization_members.role is 'Launch 1 roles: owner, admin, staff, viewer.';
comment on column public.organization_members.status is 'Membership lifecycle: invited, active, suspended, removed.';

create index organization_members_organization_id_idx
  on public.organization_members (organization_id);

create index organization_members_user_id_idx
  on public.organization_members (user_id);

grant select, insert, update, delete on public.organization_members to authenticated;
