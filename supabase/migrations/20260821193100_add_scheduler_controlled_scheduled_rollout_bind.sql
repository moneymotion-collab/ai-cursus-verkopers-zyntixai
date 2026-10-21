-- SMM-B1.11-E PRE-LIVE — Fail-closed scheduled window consume + scheduler_start bind.
-- Reuses social_controlled_publish_windows. Does not create a second queue.
-- Production worker never sets zyntix.social_scheduler_unrestricted.

do $$
declare
  v_name text;
begin
  select c.conname into v_name
  from pg_constraint c
  where c.conrelid = 'public.social_controlled_publish_window_events'::regclass
    and c.contype = 'c'
    and pg_get_constraintdef(c.oid) ilike '%event_type in%';
  if v_name is not null then
    execute format(
      'alter table public.social_controlled_publish_window_events drop constraint %I',
      v_name
    );
  end if;
end $$;

alter table public.social_controlled_publish_window_events
  add constraint social_controlled_publish_window_events_type_chk
    check (event_type in (
      'window_authorized',
      'execute_consumed',
      'window_closed',
      'execute_denied_mismatch',
      'execute_denied_rollout_required',
      'execute_denied_expired',
      'window_expired'
    ));

update public.social_controlled_publish_windows as w
set
  workspace_id = p.workspace_id,
  connection_id = p.connection_id,
  updated_at = w.updated_at
from public.social_publications as p
where p.id = w.publication_id
  and p.organization_id = w.organization_id
  and (w.workspace_id is null or w.connection_id is null);

create or replace function private.social_scheduler_requires_controlled_window()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return coalesce(current_setting('zyntix.social_scheduler_unrestricted', true), '')
    is distinct from 'true';
end;
$$;

revoke all on function private.social_scheduler_requires_controlled_window() from public;
revoke all on function private.social_scheduler_requires_controlled_window() from anon;
revoke all on function private.social_scheduler_requires_controlled_window() from authenticated;

comment on function private.social_scheduler_requires_controlled_window() is
  'B1.11-E: scheduled provider write requires a matching controlled window unless zyntix.social_scheduler_unrestricted is exactly true.';

create or replace function private.assert_and_consume_scheduled_controlled_publish_window(
  p_organization_id uuid,
  p_publication_id uuid,
  p_workspace_id uuid,
  p_connection_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window public.social_controlled_publish_windows;
  v_required boolean;
begin
  v_required := private.social_scheduler_requires_controlled_window();

  select w.* into v_window
  from public.social_controlled_publish_windows as w
  where w.organization_id = p_organization_id
    and w.status = 'active'
  for update;

  if not found then
    if not v_required then
      return 'ok';
    end if;
    return 'controlled_scheduled_rollout_required';
  end if;

  if v_window.expires_at is not null and v_window.expires_at <= pg_catalog.now() then
    update public.social_controlled_publish_windows as w
    set
      status = 'expired',
      expired_at = pg_catalog.now(),
      updated_at = pg_catalog.now()
    where w.id = v_window.id
      and w.status = 'active';

    perform private.insert_social_controlled_publish_window_event(
      p_organization_id,
      v_window.id,
      'window_expired',
      v_window.publication_id,
      p_publication_id,
      'system',
      null,
      jsonb_build_object(
        'expires_at', v_window.expires_at,
        'requested_publication_id', p_publication_id
      )
    );
    return 'controlled_window_expired';
  end if;

  if v_window.publication_id is distinct from p_publication_id
     or (
       v_window.workspace_id is not null
       and p_workspace_id is not null
       and v_window.workspace_id is distinct from p_workspace_id
     )
     or (
       v_window.connection_id is not null
       and p_connection_id is not null
       and v_window.connection_id is distinct from p_connection_id
     )
  then
    perform private.insert_social_controlled_publish_window_event(
      p_organization_id,
      v_window.id,
      'execute_denied_mismatch',
      v_window.publication_id,
      p_publication_id,
      'system',
      null,
      jsonb_build_object(
        'authorized_publication_id', v_window.publication_id,
        'requested_publication_id', p_publication_id,
        'authorized_workspace_id', v_window.workspace_id,
        'requested_workspace_id', p_workspace_id,
        'authorized_connection_id', v_window.connection_id,
        'requested_connection_id', p_connection_id
      )
    );
    return 'publication_not_authorized_for_window';
  end if;

  if v_window.consumed_execute_count >= v_window.max_execute_count then
    return 'controlled_window_exhausted';
  end if;

  update public.social_controlled_publish_windows as w
  set
    consumed_execute_count = w.consumed_execute_count + 1,
    status = case
      when w.consumed_execute_count + 1 >= w.max_execute_count then 'consumed'
      else w.status
    end,
    consumed_at = case
      when w.consumed_execute_count + 1 >= w.max_execute_count then pg_catalog.now()
      else w.consumed_at
    end,
    updated_at = pg_catalog.now()
  where w.id = v_window.id;

  perform private.insert_social_controlled_publish_window_event(
    p_organization_id,
    v_window.id,
    'execute_consumed',
    p_publication_id,
    p_publication_id,
    'system',
    null,
    jsonb_build_object(
      'max_execute_count', v_window.max_execute_count,
      'consumed_execute_count', v_window.consumed_execute_count + 1,
      'source', 'scheduler'
    )
  );

  return 'ok';
end;
$$;

revoke all on function private.assert_and_consume_scheduled_controlled_publish_window(uuid, uuid, uuid, uuid) from public;
revoke all on function private.assert_and_consume_scheduled_controlled_publish_window(uuid, uuid, uuid, uuid) from anon;
revoke all on function private.assert_and_consume_scheduled_controlled_publish_window(uuid, uuid, uuid, uuid) from authenticated;

comment on function private.assert_and_consume_scheduled_controlled_publish_window(uuid, uuid, uuid, uuid) is
  'B1.11-E scheduler one-shot consume. Fail-closed when no active matching window. Lock order: window then publication.';
