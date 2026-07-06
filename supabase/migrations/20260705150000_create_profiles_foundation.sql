-- ZyntixAI foundation: profiles (identity layer)
-- Email lives on auth.users only; profiles holds application-facing identity fields.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  locale text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application identity profile; id matches auth.users.id. Email is read from auth.users.';
comment on column public.profiles.id is 'Primary key; equals auth.users.id.';

grant select, insert, update on public.profiles to authenticated;
