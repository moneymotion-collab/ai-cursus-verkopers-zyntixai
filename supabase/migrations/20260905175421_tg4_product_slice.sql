-- TG4-PRODUCT-SLICE
-- Internal Product Operations only: no storefront, prices, payments, Projects,
-- warehouses, carriers, marketplaces, returns, or supplier domains.

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  sku text not null,
  description text,
  created_by_member_id uuid not null,
  archived_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint products_org_id_unique unique (organization_id, id),
  constraint products_org_sku_unique unique (organization_id, sku),
  constraint products_name_check check (char_length(btrim(name)) between 1 and 200),
  constraint products_sku_check check (
    char_length(sku) between 1 and 80 and sku = upper(btrim(sku))
  ),
  constraint products_description_check check (
    description is null or char_length(description) <= 4000
  ),
  constraint products_created_by_member_fk foreign key (
    organization_id, created_by_member_id
  ) references public.organization_members (organization_id, id) on delete restrict
);

create table public.inventory_balances (
  organization_id uuid not null,
  product_id uuid not null,
  on_hand integer not null default 0,
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (organization_id, product_id),
  constraint inventory_balances_nonnegative_check check (on_hand >= 0),
  constraint inventory_balances_product_fk foreign key (organization_id, product_id)
    references public.products (organization_id, id) on delete restrict
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null,
  reference text not null,
  fulfillment_status text not null default 'pending',
  idempotency_key text not null,
  request_items jsonb not null,
  created_by_member_id uuid not null,
  status_changed_at timestamptz not null default pg_catalog.now(),
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint orders_org_id_unique unique (organization_id, id),
  constraint orders_org_reference_unique unique (organization_id, reference),
  constraint orders_org_idempotency_unique unique (organization_id, idempotency_key),
  constraint orders_reference_check check (char_length(btrim(reference)) between 1 and 120),
  constraint orders_idempotency_check check (
    char_length(idempotency_key) between 8 and 128 and idempotency_key = btrim(idempotency_key)
  ),
  constraint orders_request_items_array_check check (
    jsonb_typeof(request_items) = 'array' and jsonb_array_length(request_items) > 0
  ),
  constraint orders_fulfillment_status_check check (
    fulfillment_status in ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  constraint orders_terminal_timestamps_check check (
    (fulfillment_status = 'completed' and completed_at is not null and cancelled_at is null)
    or (fulfillment_status = 'cancelled' and cancelled_at is not null and completed_at is null)
    or (fulfillment_status in ('pending', 'in_progress') and completed_at is null and cancelled_at is null)
  ),
  constraint orders_customer_fk foreign key (organization_id, customer_id)
    references public.customers (organization_id, id) on delete restrict,
  constraint orders_created_by_member_fk foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  product_id uuid not null,
  quantity integer not null,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint order_items_org_id_unique unique (organization_id, id),
  constraint order_items_order_product_unique unique (organization_id, order_id, product_id),
  constraint order_items_quantity_check check (quantity > 0),
  constraint order_items_order_fk foreign key (organization_id, order_id)
    references public.orders (organization_id, id) on delete cascade,
  constraint order_items_product_fk foreign key (organization_id, product_id)
    references public.products (organization_id, id) on delete restrict
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product_id uuid not null,
  order_id uuid,
  movement_type text not null,
  quantity_delta integer not null,
  resulting_on_hand integer not null,
  reason text not null,
  idempotency_key text not null,
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint inventory_movements_org_id_unique unique (organization_id, id),
  constraint inventory_movements_org_idempotency_unique unique (
    organization_id, idempotency_key
  ),
  constraint inventory_movements_type_check check (
    movement_type in ('adjustment', 'order_deduction', 'order_restoration')
  ),
  constraint inventory_movements_delta_check check (quantity_delta <> 0),
  constraint inventory_movements_result_check check (resulting_on_hand >= 0),
  constraint inventory_movements_reason_check check (
    char_length(btrim(reason)) between 1 and 500
  ),
  constraint inventory_movements_idempotency_check check (
    char_length(idempotency_key) between 8 and 128 and idempotency_key = btrim(idempotency_key)
  ),
  constraint inventory_movements_product_fk foreign key (organization_id, product_id)
    references public.products (organization_id, id) on delete restrict,
  constraint inventory_movements_order_fk foreign key (organization_id, order_id)
    references public.orders (organization_id, id) on delete restrict,
  constraint inventory_movements_created_by_member_fk foreign key (
    organization_id, created_by_member_id
  ) references public.organization_members (organization_id, id) on delete restrict
);

create unique index inventory_movements_order_product_type_uidx
  on public.inventory_movements (organization_id, order_id, product_id, movement_type)
  where order_id is not null;

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  from_status text,
  to_status text not null,
  reason text,
  idempotency_key text not null,
  changed_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint order_status_history_org_idempotency_unique unique (
    organization_id, idempotency_key
  ),
  constraint order_status_history_status_check check (
    (from_status is null or from_status in ('pending', 'in_progress', 'completed', 'cancelled'))
    and to_status in ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  constraint order_status_history_order_fk foreign key (organization_id, order_id)
    references public.orders (organization_id, id) on delete cascade,
  constraint order_status_history_member_fk foreign key (
    organization_id, changed_by_member_id
  ) references public.organization_members (organization_id, id) on delete restrict
);

create index products_org_active_idx
  on public.products (organization_id, updated_at desc) where archived_at is null;
create index orders_org_status_idx
  on public.orders (organization_id, fulfillment_status, status_changed_at);
create index orders_org_customer_idx
  on public.orders (organization_id, customer_id, created_at desc);
create index order_items_org_product_idx
  on public.order_items (organization_id, product_id, created_at desc);
create index inventory_movements_org_product_idx
  on public.inventory_movements (organization_id, product_id, created_at desc);
create index order_status_history_order_idx
  on public.order_status_history (organization_id, order_id, created_at desc);

create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger inventory_balances_set_updated_at before update on public.inventory_balances
  for each row execute function public.set_updated_at();

create or replace function private.require_product_actor(
  p_organization_id uuid,
  p_allowed_roles text[]
)
returns table (membership_id uuid, member_role text)
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  return query
  select om.id, om.role
  from public.organization_members as om
  join public.organizations as o on o.id = om.organization_id
  where om.organization_id = p_organization_id
    and om.user_id = auth.uid()
    and om.status = 'active'
    and o.status = 'active'
    and om.role = any(p_allowed_roles)
  limit 1;
  if not found then raise exception 'active organization membership with sufficient role required'; end if;
end;
$$;

create or replace function private.is_allowed_order_transition(
  p_from_status text, p_to_status text
)
returns boolean language sql immutable set search_path = ''
as $$
  select case
    when p_from_status = 'pending' and p_to_status in ('in_progress', 'completed', 'cancelled') then true
    when p_from_status = 'in_progress' and p_to_status in ('completed', 'cancelled') then true
    else false
  end;
$$;

revoke all on function private.require_product_actor(uuid, text[]) from public, anon, authenticated;
revoke all on function private.is_allowed_order_transition(text, text) from public, anon, authenticated;

create or replace function public.create_product(
  p_organization_id uuid,
  p_name text,
  p_sku text,
  p_description text default null
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_member_id uuid;
  v_product_id uuid;
  v_sku text := upper(btrim(p_sku));
begin
  select membership_id into v_member_id
  from private.require_product_actor(p_organization_id, array['owner', 'admin', 'staff']);
  insert into public.products (
    organization_id, name, sku, description, created_by_member_id
  ) values (
    p_organization_id, btrim(p_name), v_sku,
    nullif(btrim(p_description), ''), v_member_id
  ) returning id into v_product_id;
  insert into public.inventory_balances (organization_id, product_id, on_hand)
  values (p_organization_id, v_product_id, 0);
  return v_product_id;
end;
$$;

create or replace function public.update_product(
  p_organization_id uuid,
  p_product_id uuid,
  p_name text,
  p_sku text,
  p_description text default null
)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_product_actor(p_organization_id, array['owner', 'admin', 'staff']);
  update public.products as p set
    name = btrim(p_name),
    sku = upper(btrim(p_sku)),
    description = nullif(btrim(p_description), '')
  where p.organization_id = p_organization_id
    and p.id = p_product_id
    and p.archived_at is null;
  if not found then raise exception 'product not found or archived'; end if;
end;
$$;

create or replace function public.archive_product(
  p_organization_id uuid, p_product_id uuid
)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_product_actor(p_organization_id, array['owner', 'admin']);
  update public.products as p set archived_at = pg_catalog.now()
  where p.organization_id = p_organization_id
    and p.id = p_product_id and p.archived_at is null;
  if not found then raise exception 'product not found or already archived'; end if;
end;
$$;

create or replace function public.restore_product(
  p_organization_id uuid, p_product_id uuid
)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_product_actor(p_organization_id, array['owner', 'admin']);
  update public.products as p set archived_at = null
  where p.organization_id = p_organization_id
    and p.id = p_product_id and p.archived_at is not null;
  if not found then raise exception 'archived product not found'; end if;
end;
$$;

create or replace function public.adjust_product_inventory(
  p_organization_id uuid,
  p_product_id uuid,
  p_quantity_delta integer,
  p_reason text,
  p_idempotency_key text
)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  v_member_id uuid;
  v_balance public.inventory_balances;
  v_existing public.inventory_movements;
  v_result integer;
begin
  select membership_id into v_member_id
  from private.require_product_actor(p_organization_id, array['owner', 'admin', 'staff']);
  if p_quantity_delta = 0 then raise exception 'inventory adjustment must not be zero'; end if;
  if char_length(btrim(p_reason)) = 0 then raise exception 'inventory reason is required'; end if;
  if char_length(btrim(p_idempotency_key)) not between 8 and 128 then
    raise exception 'invalid idempotency key';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':inventory:' || btrim(p_idempotency_key), 0)
  );

  select m.* into v_existing from public.inventory_movements as m
  where m.organization_id = p_organization_id and m.idempotency_key = btrim(p_idempotency_key);
  if found then
    if v_existing.product_id <> p_product_id
      or v_existing.quantity_delta <> p_quantity_delta
      or v_existing.reason <> btrim(p_reason) then
      raise exception 'idempotency key payload mismatch';
    end if;
    return v_existing.resulting_on_hand;
  end if;

  select b.* into v_balance from public.inventory_balances as b
  join public.products as p
    on p.organization_id = b.organization_id and p.id = b.product_id
  where b.organization_id = p_organization_id
    and b.product_id = p_product_id
    and p.archived_at is null
  for update of b;
  if not found then raise exception 'active product inventory not found'; end if;
  v_result := v_balance.on_hand + p_quantity_delta;
  if v_result < 0 then raise exception 'insufficient stock'; end if;

  update public.inventory_balances as b set on_hand = v_result
  where b.organization_id = p_organization_id and b.product_id = p_product_id;
  insert into public.inventory_movements (
    organization_id, product_id, movement_type, quantity_delta,
    resulting_on_hand, reason, idempotency_key, created_by_member_id
  ) values (
    p_organization_id, p_product_id, 'adjustment', p_quantity_delta,
    v_result, btrim(p_reason), btrim(p_idempotency_key), v_member_id
  );
  return v_result;
end;
$$;

create or replace function public.create_inventory_order(
  p_organization_id uuid,
  p_customer_id uuid,
  p_reference text,
  p_items jsonb,
  p_idempotency_key text
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_member_id uuid;
  v_order_id uuid;
  v_existing public.orders;
  v_items jsonb;
  v_item record;
  v_product public.products;
  v_balance integer;
begin
  select membership_id into v_member_id
  from private.require_product_actor(p_organization_id, array['owner', 'admin', 'staff']);
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'at least one order item is required';
  end if;
  if char_length(btrim(p_idempotency_key)) not between 8 and 128 then
    raise exception 'invalid idempotency key';
  end if;

  select jsonb_agg(
    jsonb_build_object(
      'product_id', (item->>'product_id')::uuid,
      'quantity', (item->>'quantity')::integer
    ) order by (item->>'product_id')::uuid
  ) into v_items
  from jsonb_array_elements(p_items) as item;

  if exists (
    select 1 from jsonb_array_elements(v_items) as item
    where (item->>'quantity')::integer <= 0
  ) then raise exception 'order quantities must be positive integers'; end if;
  if jsonb_array_length(v_items) <> (
    select count(distinct (item->>'product_id')::uuid)
    from jsonb_array_elements(v_items) as item
  ) then raise exception 'duplicate products are not allowed'; end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':order:' || btrim(p_idempotency_key), 0)
  );

  select o.* into v_existing from public.orders as o
  where o.organization_id = p_organization_id
    and o.idempotency_key = btrim(p_idempotency_key);
  if found then
    if v_existing.customer_id <> p_customer_id
      or v_existing.reference <> btrim(p_reference)
      or v_existing.request_items <> v_items then
      raise exception 'idempotency key payload mismatch';
    end if;
    return v_existing.id;
  end if;

  if not exists (
    select 1 from public.customers as c
    where c.organization_id = p_organization_id
      and c.id = p_customer_id and c.archived_at is null
  ) then raise exception 'active customer not found'; end if;

  -- Deterministic row order plus FOR UPDATE prevents concurrent overselling
  -- and minimizes deadlocks for multi-item orders.
  perform 1
  from public.inventory_balances as b
  where b.organization_id = p_organization_id
    and b.product_id in (
      select (item->>'product_id')::uuid from jsonb_array_elements(v_items) as item
    )
  order by b.product_id
  for update;

  for v_item in
    select (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(v_items) as item
    order by (item->>'product_id')::uuid
  loop
    select p.* into v_product from public.products as p
    where p.organization_id = p_organization_id
      and p.id = v_item.product_id and p.archived_at is null;
    if not found then raise exception 'active product not found'; end if;
    select b.on_hand into v_balance from public.inventory_balances as b
    where b.organization_id = p_organization_id and b.product_id = v_item.product_id;
    if v_balance is null or v_balance < v_item.quantity then
      raise exception 'insufficient stock for product %', v_product.sku;
    end if;
  end loop;

  insert into public.orders (
    organization_id, customer_id, reference, fulfillment_status,
    idempotency_key, request_items, created_by_member_id
  ) values (
    p_organization_id, p_customer_id, btrim(p_reference), 'pending',
    btrim(p_idempotency_key), v_items, v_member_id
  ) returning id into v_order_id;

  for v_item in
    select (item->>'product_id')::uuid as product_id,
      (item->>'quantity')::integer as quantity
    from jsonb_array_elements(v_items) as item
    order by (item->>'product_id')::uuid
  loop
    select p.* into v_product from public.products as p
    where p.organization_id = p_organization_id and p.id = v_item.product_id;
    update public.inventory_balances as b
    set on_hand = b.on_hand - v_item.quantity
    where b.organization_id = p_organization_id and b.product_id = v_item.product_id
    returning b.on_hand into v_balance;
    insert into public.order_items (
      organization_id, order_id, product_id, quantity,
      product_name_snapshot, sku_snapshot
    ) values (
      p_organization_id, v_order_id, v_item.product_id, v_item.quantity,
      v_product.name, v_product.sku
    );
    insert into public.inventory_movements (
      organization_id, product_id, order_id, movement_type, quantity_delta,
      resulting_on_hand, reason, idempotency_key, created_by_member_id
    ) values (
      p_organization_id, v_item.product_id, v_order_id, 'order_deduction',
      -v_item.quantity, v_balance, 'Order ' || btrim(p_reference),
      'order:' || v_order_id::text || ':' || v_item.product_id::text, v_member_id
    );
  end loop;

  insert into public.order_status_history (
    organization_id, order_id, from_status, to_status, reason,
    idempotency_key, changed_by_member_id
  ) values (
    p_organization_id, v_order_id, null, 'pending', 'Order created',
    'created:' || v_order_id::text, v_member_id
  );
  return v_order_id;
end;
$$;

create or replace function public.transition_order_fulfillment(
  p_organization_id uuid,
  p_order_id uuid,
  p_to_status text,
  p_reason text,
  p_idempotency_key text
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  v_member_id uuid;
  v_order public.orders;
  v_existing public.order_status_history;
  v_item record;
  v_balance integer;
begin
  select membership_id into v_member_id
  from private.require_product_actor(p_organization_id, array['owner', 'admin', 'staff']);
  if char_length(btrim(p_reason)) = 0 then raise exception 'transition reason is required'; end if;
  if char_length(btrim(p_idempotency_key)) not between 8 and 128 then
    raise exception 'invalid idempotency key';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_organization_id::text || ':fulfillment:' || btrim(p_idempotency_key), 0)
  );
  select h.* into v_existing from public.order_status_history as h
  where h.organization_id = p_organization_id
    and h.idempotency_key = btrim(p_idempotency_key);
  if found then
    if v_existing.order_id <> p_order_id or v_existing.to_status <> p_to_status then
      raise exception 'idempotency key payload mismatch';
    end if;
    return;
  end if;

  select o.* into v_order from public.orders as o
  where o.organization_id = p_organization_id and o.id = p_order_id for update;
  if not found then raise exception 'order not found'; end if;
  if not private.is_allowed_order_transition(v_order.fulfillment_status, p_to_status) then
    raise exception 'fulfillment status transition not allowed';
  end if;

  if p_to_status = 'cancelled' then
    for v_item in
      select oi.product_id, oi.quantity from public.order_items as oi
      where oi.organization_id = p_organization_id and oi.order_id = p_order_id
      order by oi.product_id
    loop
      update public.inventory_balances as b set on_hand = b.on_hand + v_item.quantity
      where b.organization_id = p_organization_id and b.product_id = v_item.product_id
      returning b.on_hand into v_balance;
      insert into public.inventory_movements (
        organization_id, product_id, order_id, movement_type, quantity_delta,
        resulting_on_hand, reason, idempotency_key, created_by_member_id
      ) values (
        p_organization_id, v_item.product_id, p_order_id, 'order_restoration',
        v_item.quantity, v_balance, btrim(p_reason),
        'restore:' || p_order_id::text || ':' || v_item.product_id::text, v_member_id
      );
    end loop;
  end if;

  update public.orders as o set
    fulfillment_status = p_to_status,
    status_changed_at = pg_catalog.now(),
    completed_at = case when p_to_status = 'completed' then pg_catalog.now() else null end,
    cancelled_at = case when p_to_status = 'cancelled' then pg_catalog.now() else null end
  where o.organization_id = p_organization_id and o.id = p_order_id;
  insert into public.order_status_history (
    organization_id, order_id, from_status, to_status, reason,
    idempotency_key, changed_by_member_id
  ) values (
    p_organization_id, p_order_id, v_order.fulfillment_status, p_to_status,
    btrim(p_reason), btrim(p_idempotency_key), v_member_id
  );
end;
$$;

alter table public.products enable row level security;
alter table public.inventory_balances enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.order_status_history enable row level security;

revoke all on table public.products from public, anon, authenticated;
revoke all on table public.inventory_balances from public, anon, authenticated;
revoke all on table public.orders from public, anon, authenticated;
revoke all on table public.order_items from public, anon, authenticated;
revoke all on table public.inventory_movements from public, anon, authenticated;
revoke all on table public.order_status_history from public, anon, authenticated;
grant select on table public.products, public.inventory_balances, public.orders,
  public.order_items, public.inventory_movements, public.order_status_history to authenticated;

create policy products_select_admin on public.products for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));
create policy products_select_member on public.products for select to authenticated
  using (private.is_org_member(organization_id) and archived_at is null);
create policy inventory_balances_select_member on public.inventory_balances
  for select to authenticated using (private.is_org_member(organization_id));
create policy orders_select_member on public.orders for select to authenticated
  using (private.is_org_member(organization_id));
create policy order_items_select_member on public.order_items for select to authenticated
  using (private.is_org_member(organization_id));
create policy inventory_movements_select_member on public.inventory_movements
  for select to authenticated using (private.is_org_member(organization_id));
create policy order_status_history_select_member on public.order_status_history
  for select to authenticated using (private.is_org_member(organization_id));

revoke all on function public.create_product(uuid, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.update_product(uuid, uuid, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.archive_product(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.restore_product(uuid, uuid)
  from public, anon, authenticated, service_role;
revoke all on function public.adjust_product_inventory(uuid, uuid, integer, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.create_inventory_order(uuid, uuid, text, jsonb, text)
  from public, anon, authenticated, service_role;
revoke all on function public.transition_order_fulfillment(uuid, uuid, text, text, text)
  from public, anon, authenticated, service_role;
grant execute on function public.create_product(uuid, text, text, text) to authenticated;
grant execute on function public.update_product(uuid, uuid, text, text, text) to authenticated;
grant execute on function public.archive_product(uuid, uuid) to authenticated;
grant execute on function public.restore_product(uuid, uuid) to authenticated;
grant execute on function public.adjust_product_inventory(uuid, uuid, integer, text, text) to authenticated;
grant execute on function public.create_inventory_order(uuid, uuid, text, jsonb, text) to authenticated;
grant execute on function public.transition_order_fulfillment(uuid, uuid, text, text, text) to authenticated;

-- Product Operations Attention. Product and Order are independent source types.
alter table public.attention_items add column product_id uuid;
alter table public.attention_items add column order_id uuid;

alter table public.attention_items drop constraint attention_items_source_type_chk;
alter table public.attention_items add constraint attention_items_source_type_chk check (
  source_type in (
    'enrollment', 'social_publication', 'social_connection', 'project',
    'work_order', 'product', 'order'
  )
);

alter table public.attention_items drop constraint attention_items_source_shape_chk;
alter table public.attention_items add constraint attention_items_source_shape_chk check (
  (
    source_type = 'enrollment'
    and enrollment_id is not null and customer_id is not null and program_id is not null
    and source_entity_id = enrollment_id
    and social_publication_id is null and social_connection_id is null
    and project_id is null and task_id is null and work_order_id is null
    and product_id is null and order_id is null
  ) or (
    source_type = 'social_publication'
    and enrollment_id is null and customer_id is null and program_id is null
    and social_publication_id is not null and source_entity_id = social_publication_id
    and social_connection_id is null and project_id is null and task_id is null
    and work_order_id is null and product_id is null and order_id is null
  ) or (
    source_type = 'social_connection'
    and enrollment_id is null and customer_id is null and program_id is null
    and social_publication_id is null and social_connection_id is not null
    and source_entity_id = social_connection_id
    and project_id is null and task_id is null and work_order_id is null
    and product_id is null and order_id is null
  ) or (
    source_type = 'project'
    and enrollment_id is null and customer_id is null and program_id is null
    and social_publication_id is null and social_connection_id is null
    and project_id is not null and source_entity_id = project_id
    and work_order_id is null and product_id is null and order_id is null
  ) or (
    source_type = 'work_order'
    and enrollment_id is null and customer_id is null and program_id is null
    and social_publication_id is null and social_connection_id is null
    and project_id is not null and task_id is null and work_order_id is not null
    and source_entity_id = work_order_id and product_id is null and order_id is null
  ) or (
    source_type = 'product'
    and enrollment_id is null and customer_id is null and program_id is null
    and social_publication_id is null and social_connection_id is null
    and project_id is null and task_id is null and work_order_id is null
    and product_id is not null and source_entity_id = product_id and order_id is null
  ) or (
    source_type = 'order'
    and enrollment_id is null and customer_id is not null and program_id is null
    and social_publication_id is null and social_connection_id is null
    and project_id is null and task_id is null and work_order_id is null
    and product_id is null and order_id is not null and source_entity_id = order_id
  )
);

alter table public.attention_items add constraint attention_items_product_fk
  foreign key (organization_id, product_id)
  references public.products (organization_id, id) on delete restrict;
alter table public.attention_items add constraint attention_items_order_fk
  foreign key (organization_id, order_id)
  references public.orders (organization_id, id) on delete restrict;
create index attention_items_organization_product_idx
  on public.attention_items (organization_id, product_id) where product_id is not null;
create index attention_items_organization_order_idx
  on public.attention_items (organization_id, order_id) where order_id is not null;

alter table public.attention_signals drop constraint attention_signals_rule_key_check;
alter table public.attention_signals add constraint attention_signals_rule_key_check check (
  rule_key is null or rule_key in (
    'enrollment_no_recent_progress',
    'scheduled_publication_missed', 'publication_result_unknown',
    'social_account_reauthorization_required', 'provider_permission_missing',
    'scheduled_publication_failed',
    'project_overdue_active', 'project_task_overdue', 'project_no_owner',
    'work_order_overdue', 'work_order_unassigned',
    'inventory_out_of_stock', 'fulfillment_stalled'
  )
);
alter table public.attention_signals drop constraint attention_signals_origin_rule_consistency_check;
alter table public.attention_signals add constraint attention_signals_origin_rule_consistency_check check (
  (signal_origin = 'manual' and rule_key is null)
  or (
    signal_origin = 'rule' and rule_key in (
      'enrollment_no_recent_progress',
      'scheduled_publication_missed', 'publication_result_unknown',
      'social_account_reauthorization_required', 'provider_permission_missing',
      'scheduled_publication_failed',
      'project_overdue_active', 'project_task_overdue', 'project_no_owner',
      'work_order_overdue', 'work_order_unassigned',
      'inventory_out_of_stock', 'fulfillment_stalled'
    )
  )
);

create or replace function private.append_attention_signal(
  p_organization_id uuid,
  p_attention_item_id uuid,
  p_enrollment_id uuid,
  p_signal_origin text,
  p_rule_key text,
  p_explanation text,
  p_evidence jsonb,
  p_detected_at timestamptz,
  p_created_by_member_id uuid
)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_explanation text;
  v_evidence jsonb;
  v_signal_id uuid;
begin
  v_explanation := btrim(coalesce(p_explanation, ''));
  if char_length(v_explanation) = 0 or char_length(v_explanation) > 2000 then
    raise exception 'invalid attention signal explanation';
  end if;
  v_evidence := private.validate_attention_signal_evidence(p_evidence);
  if p_signal_origin = 'manual' then
    if p_rule_key is not null then raise exception 'invalid attention signal origin/rule combination'; end if;
  elsif p_signal_origin = 'rule' then
    if p_rule_key is null or p_rule_key not in (
      'enrollment_no_recent_progress',
      'scheduled_publication_missed', 'publication_result_unknown',
      'social_account_reauthorization_required', 'provider_permission_missing',
      'scheduled_publication_failed',
      'project_overdue_active', 'project_task_overdue', 'project_no_owner',
      'work_order_overdue', 'work_order_unassigned',
      'inventory_out_of_stock', 'fulfillment_stalled'
    ) then raise exception 'invalid attention rule key'; end if;
  else
    raise exception 'invalid attention signal origin';
  end if;
  insert into public.attention_signals (
    organization_id, attention_item_id, enrollment_id, signal_origin, rule_key,
    explanation, evidence, detected_at, created_by_member_id
  ) values (
    p_organization_id, p_attention_item_id, p_enrollment_id, p_signal_origin,
    p_rule_key, v_explanation, v_evidence, coalesce(p_detected_at, pg_catalog.now()),
    p_created_by_member_id
  ) returning id into v_signal_id;
  return v_signal_id;
end;
$$;
revoke all on function private.append_attention_signal(
  uuid, uuid, uuid, text, text, text, jsonb, timestamptz, uuid
) from public, anon, authenticated;

create or replace function private.upsert_product_attention_item(
  p_organization_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_customer_id uuid,
  p_rule_key text,
  p_severity text,
  p_title text,
  p_summary text,
  p_explanation text,
  p_actor_member_id uuid
)
returns table (result_code text, attention_item_id uuid, created boolean)
language plpgsql security definer set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.now();
  v_dedupe text;
  v_item public.attention_items;
  v_item_id uuid;
  v_signal_id uuid;
begin
  if p_source_type not in ('product', 'order') then raise exception 'invalid product attention source'; end if;
  v_dedupe := private.build_attention_source_dedupe_key(
    p_organization_id, p_source_type, p_source_id, p_rule_key
  );
  select ai.* into v_item from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.source_type = p_source_type
    and ai.source_entity_id = p_source_id
    and ai.dedupe_key = v_dedupe
    and ai.status in ('open', 'acknowledged')
  for update;
  if found then
    v_item_id := v_item.id;
    v_signal_id := private.append_attention_signal(
      p_organization_id, v_item_id, null, 'rule', p_rule_key,
      p_explanation, jsonb_build_object('kind', 'generic'), v_now, null
    );
    update public.attention_items as ai set
      detection_count = ai.detection_count + 1,
      last_detected_at = v_now,
      updated_by_member_id = p_actor_member_id
    where ai.organization_id = p_organization_id and ai.id = v_item_id;
    perform private.insert_attention_item_event(
      p_organization_id, v_item_id, 'detection_updated',
      v_item.status, v_item.status, null, null, null, null, null,
      'rule', p_actor_member_id, jsonb_build_object('signal_id', v_signal_id)
    );
    return query select 'updated'::text, v_item_id, false;
    return;
  end if;
  insert into public.attention_items (
    organization_id, source_type, source_entity_id, customer_id, product_id, order_id,
    title, summary, status, severity, dedupe_key,
    first_detected_at, last_detected_at, created_by_member_id, updated_by_member_id
  ) values (
    p_organization_id, p_source_type, p_source_id, p_customer_id,
    case when p_source_type = 'product' then p_source_id end,
    case when p_source_type = 'order' then p_source_id end,
    p_title, p_summary, 'open', p_severity, v_dedupe,
    v_now, v_now, p_actor_member_id, p_actor_member_id
  ) returning id into v_item_id;
  v_signal_id := private.append_attention_signal(
    p_organization_id, v_item_id, null, 'rule', p_rule_key,
    p_explanation, jsonb_build_object('kind', 'generic'), v_now, null
  );
  perform private.insert_attention_item_event(
    p_organization_id, v_item_id, 'created', null, 'open',
    null, p_severity, null, null, null, 'rule', p_actor_member_id,
    jsonb_build_object('signal_id', v_signal_id, 'rule_key', p_rule_key)
  );
  return query select 'created'::text, v_item_id, true;
end;
$$;

create or replace function private.expire_product_attention_item(
  p_organization_id uuid,
  p_source_type text,
  p_source_id uuid,
  p_rule_key text,
  p_expired_at timestamptz default null
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_item_id uuid;
begin
  select ai.id into v_item_id from public.attention_items as ai
  where ai.organization_id = p_organization_id
    and ai.source_type = p_source_type and ai.source_entity_id = p_source_id
    and ai.dedupe_key = private.build_attention_source_dedupe_key(
      p_organization_id, p_source_type, p_source_id, p_rule_key
    )
    and ai.status in ('open', 'acknowledged')
  for update;
  if not found then return false; end if;
  perform private.expire_attention_item(p_organization_id, v_item_id, p_expired_at);
  return true;
end;
$$;
revoke all on function private.upsert_product_attention_item(
  uuid, text, uuid, uuid, text, text, text, text, text, uuid
) from public, anon, authenticated;
revoke all on function private.expire_product_attention_item(
  uuid, text, uuid, text, timestamptz
) from public, anon, authenticated;

create or replace function public.evaluate_product_attention_rules(
  p_organization_id uuid
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_member_id uuid;
  v_now timestamptz := pg_catalog.now();
  v_row record;
  v_result record;
  v_created integer := 0;
  v_updated integer := 0;
  v_expired integer := 0;
begin
  select membership_id into v_member_id
  from private.require_attention_actor(p_organization_id, array['owner', 'admin']);

  for v_row in
    select p.id, p.name, p.sku, p.archived_at, b.on_hand
    from public.products as p
    join public.inventory_balances as b
      on b.organization_id = p.organization_id and b.product_id = p.id
    where p.organization_id = p_organization_id
  loop
    if v_row.archived_at is null and v_row.on_hand = 0 then
      select * into v_result from private.upsert_product_attention_item(
        p_organization_id, 'product', v_row.id, null,
        'inventory_out_of_stock', 'high', 'Product is out of stock',
        v_row.name || ' (' || v_row.sku || ') has no inventory on hand.',
        'Adjust inventory before accepting another order for this product.', v_member_id
      );
      if v_result.created then v_created := v_created + 1; else v_updated := v_updated + 1; end if;
    elsif private.expire_product_attention_item(
      p_organization_id, 'product', v_row.id, 'inventory_out_of_stock', v_now
    ) then v_expired := v_expired + 1;
    end if;
  end loop;

  for v_row in
    select o.id, o.customer_id, o.reference, o.fulfillment_status, o.status_changed_at
    from public.orders as o where o.organization_id = p_organization_id
  loop
    if v_row.fulfillment_status in ('pending', 'in_progress')
      and v_row.status_changed_at < v_now - interval '48 hours' then
      select * into v_result from private.upsert_product_attention_item(
        p_organization_id, 'order', v_row.id, v_row.customer_id,
        'fulfillment_stalled', 'high', 'Fulfillment is stalled',
        'Order ' || v_row.reference || ' has not progressed for more than 48 hours.',
        'Open the order and progress or cancel its fulfillment.', v_member_id
      );
      if v_result.created then v_created := v_created + 1; else v_updated := v_updated + 1; end if;
    elsif private.expire_product_attention_item(
      p_organization_id, 'order', v_row.id, 'fulfillment_stalled', v_now
    ) then v_expired := v_expired + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'created', v_created, 'updated', v_updated, 'expired', v_expired,
    'evaluated_at', v_now
  );
end;
$$;
revoke all on function public.evaluate_product_attention_rules(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.evaluate_product_attention_rules(uuid) to authenticated;
