-- SMM-B1.11-E PRE-LIVE — Controlled window binding columns + expired lifecycle.
-- Reuses social_controlled_publish_windows. Does not create a second queue.

alter table public.social_controlled_publish_windows
  add column if not exists workspace_id uuid null
    references public.social_workspaces (id) on delete restrict,
  add column if not exists connection_id uuid null
    references public.social_account_connections (id) on delete restrict,
  add column if not exists expires_at timestamptz null,
  add column if not exists expired_at timestamptz null;

do $$
declare
  v_name text;
begin
  select c.conname into v_name
  from pg_constraint c
  where c.conrelid = 'public.social_controlled_publish_windows'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%status in%';
  if v_name is not null then
    execute format(
      'alter table public.social_controlled_publish_windows drop constraint %I',
      v_name
    );
  end if;
end $$;

alter table public.social_controlled_publish_windows
  add constraint social_controlled_publish_windows_status_chk
    check (status in ('active', 'consumed', 'closed', 'expired'));

alter table public.social_controlled_publish_windows
  drop constraint if exists social_controlled_publish_windows_expired_shape_chk;

alter table public.social_controlled_publish_windows
  add constraint social_controlled_publish_windows_expired_shape_chk
    check (
      (status = 'expired' and expired_at is not null)
      or (status <> 'expired')
    );
