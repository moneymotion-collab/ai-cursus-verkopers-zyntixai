-- ZyntixAI B1.7.3 Attention RPC Foundation:
-- operational SELECT RLS for Attention tables (mutations remain RPC-only)

revoke insert, update, delete on table public.attention_items from authenticated;
grant select on table public.attention_items to authenticated;

revoke insert, update, delete on table public.attention_signals from authenticated;
grant select on table public.attention_signals to authenticated;

revoke insert, update, delete on table public.attention_item_events from authenticated;
grant select on table public.attention_item_events to authenticated;

create policy attention_items_select_admin
  on public.attention_items
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

create policy attention_items_select_member
  on public.attention_items
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and archived_at is null
  );

create policy attention_signals_select_admin
  on public.attention_signals
  for select
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin'])
    and exists (
      select 1
      from public.attention_items as ai
      where ai.organization_id = attention_signals.organization_id
        and ai.id = attention_signals.attention_item_id
    )
  );

create policy attention_signals_select_member
  on public.attention_signals
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and exists (
      select 1
      from public.attention_items as ai
      where ai.organization_id = attention_signals.organization_id
        and ai.id = attention_signals.attention_item_id
        and ai.archived_at is null
    )
  );

create policy attention_item_events_select_admin
  on public.attention_item_events
  for select
  to authenticated
  using (
    private.has_org_role(organization_id, array['owner', 'admin'])
    and exists (
      select 1
      from public.attention_items as ai
      where ai.organization_id = attention_item_events.organization_id
        and ai.id = attention_item_events.attention_item_id
    )
  );

create policy attention_item_events_select_member
  on public.attention_item_events
  for select
  to authenticated
  using (
    private.is_org_member(organization_id)
    and exists (
      select 1
      from public.attention_items as ai
      where ai.organization_id = attention_item_events.organization_id
        and ai.id = attention_item_events.attention_item_id
        and ai.archived_at is null
    )
  );

comment on table public.attention_items is
  'Organization-scoped Attention Items. Mutations via SECURITY DEFINER RPCs only; SELECT via membership RLS.';
comment on table public.attention_signals is
  'Append-only Attention Signals. Mutations via SECURITY DEFINER RPCs only; UPDATE blocked by immutability trigger.';
comment on table public.attention_item_events is
  'Append-only Attention audit events. Written via private helpers inside RPCs; SELECT via membership RLS.';
