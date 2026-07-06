-- ZyntixAI foundation: profiles (identity layer)
-- Remote apply: review against baseline before running on linked project.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  locale text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Application identity profile; id matches auth.users.id.';
comment on column public.profiles.email is 'Denormalized from auth for convenience; not used for authorization.';

grant select, insert, update on public.profiles to authenticated;
