-- ZyntixAI BETA1-4TG-CONTEXT-PACKS — additive CAP catalog for TG2/TG3/TG4.
-- Parent IDs resolve by stable key. UUIDs are not hardcoded.
-- ON CONFLICT DO NOTHING does not rewrite frozen CAP-1 rows.
-- New capabilities are context_ready catalog contracts only — not product features.
--
-- evidence_phase = BETA1-4TG-CONTEXT-PACKS
-- verified_at remains NULL for new rows (catalog declared, not production_verified).

do $$
begin
  if not exists (
    select 1
    from public.taxonomy_foundations
    where key = 'service'
      and lifecycle_status = 'active'
  ) then
    raise exception 'CAP-4TG seed: taxonomy foundation service missing';
  end if;

  if not exists (
    select 1
    from public.taxonomy_foundations
    where key = 'field-operations'
      and lifecycle_status = 'active'
  ) then
    raise exception 'CAP-4TG seed: taxonomy foundation field-operations missing';
  end if;

  if not exists (
    select 1
    from public.taxonomy_foundations
    where key = 'product-operations'
      and lifecycle_status = 'active'
  ) then
    raise exception 'CAP-4TG seed: taxonomy foundation product-operations missing';
  end if;
end $$;

insert into public.capabilities (
  capability_key,
  label,
  description,
  owner_class,
  owner_key,
  foundation_id,
  lifecycle_status,
  catalog_visibility
)
select
  v.capability_key,
  v.label,
  v.description,
  v.owner_class,
  v.owner_key,
  case
    when v.owner_class = 'foundation' then f.id
    else null
  end,
  'active',
  'listed'
from (
  values
    (
      'shared.projects',
      'Projects',
      'Canonical shared ability to manage delivery engagements and jobs.',
      'shared',
      'projects'
    ),
    (
      'field.locations',
      'Locations',
      'Canonical Field Operations ability to manage customer sites and locations.',
      'foundation',
      'field-operations'
    ),
    (
      'field.work-orders',
      'Work orders',
      'Canonical Field Operations ability to manage planned field work orders.',
      'foundation',
      'field-operations'
    ),
    (
      'field.dispatch',
      'Dispatch',
      'Canonical Field Operations ability to assign and schedule field work.',
      'foundation',
      'field-operations'
    ),
    (
      'product.products',
      'Products',
      'Canonical Product Operations ability to manage sellable products and SKUs.',
      'foundation',
      'product-operations'
    ),
    (
      'product.orders',
      'Orders',
      'Canonical Product Operations ability to manage customer orders.',
      'foundation',
      'product-operations'
    ),
    (
      'product.inventory',
      'Inventory',
      'Canonical Product Operations ability to track on-hand stock levels.',
      'foundation',
      'product-operations'
    ),
    (
      'product.fulfillment',
      'Fulfillment',
      'Canonical Product Operations ability to manage order fulfillment status.',
      'foundation',
      'product-operations'
    )
) as v(capability_key, label, description, owner_class, owner_key)
left join public.taxonomy_foundations as f
  on f.key = v.owner_key
  and v.owner_class = 'foundation'
on conflict (capability_key) do nothing;

insert into public.capability_dependencies (
  capability_id,
  depends_on_capability_id
)
select dependent.id, required.id
from (
  values
    ('shared.projects', 'shared.crm.customers'),
    ('field.work-orders', 'shared.projects'),
    ('field.work-orders', 'field.locations'),
    ('field.dispatch', 'field.work-orders'),
    ('product.orders', 'shared.crm.customers'),
    ('product.orders', 'product.products'),
    ('product.fulfillment', 'product.orders'),
    ('product.inventory', 'product.products')
) as v(dependent_key, required_key)
inner join public.capabilities as dependent
  on dependent.capability_key = v.dependent_key
inner join public.capabilities as required
  on required.capability_key = v.required_key
on conflict (capability_id, depends_on_capability_id) do nothing;

insert into public.capability_readiness (
  capability_id,
  readiness_status,
  supported_scope,
  evidence_phase,
  verified_at
)
select
  c.id,
  'context_ready',
  v.supported_scope,
  'BETA1-4TG-CONTEXT-PACKS',
  null
from (
  values
    (
      'shared.projects',
      '{"journey": "four-target-group-beta1", "runtime": "catalog-only", "feature": "projects"}'::jsonb
    ),
    (
      'field.locations',
      '{"journey": "four-target-group-beta1", "runtime": "catalog-only", "feature": "locations"}'::jsonb
    ),
    (
      'field.work-orders',
      '{"journey": "four-target-group-beta1", "runtime": "catalog-only", "feature": "work-orders"}'::jsonb
    ),
    (
      'field.dispatch',
      '{"journey": "four-target-group-beta1", "runtime": "catalog-only", "feature": "dispatch"}'::jsonb
    ),
    (
      'product.products',
      '{"journey": "four-target-group-beta1", "runtime": "catalog-only", "feature": "products"}'::jsonb
    ),
    (
      'product.orders',
      '{"journey": "four-target-group-beta1", "runtime": "catalog-only", "feature": "orders"}'::jsonb
    ),
    (
      'product.inventory',
      '{"journey": "four-target-group-beta1", "runtime": "catalog-only", "feature": "inventory"}'::jsonb
    ),
    (
      'product.fulfillment',
      '{"journey": "four-target-group-beta1", "runtime": "catalog-only", "feature": "fulfillment"}'::jsonb
    )
) as v(capability_key, supported_scope)
inner join public.capabilities as c
  on c.capability_key = v.capability_key
on conflict (capability_id) do nothing;

do $$
declare
  missing text;
  n_new_capabilities integer;
  n_total_capabilities integer;
  n_cap1_capabilities integer;
  n_new_readiness integer;
  n_new_dependencies integer;
  n_beta_supported integer;
  n_production_verified_new integer;
begin
  select string_agg(v.capability_key, ', ' order by v.capability_key)
    into missing
  from (
    values
      ('shared.projects'),
      ('field.locations'),
      ('field.work-orders'),
      ('field.dispatch'),
      ('product.products'),
      ('product.orders'),
      ('product.inventory'),
      ('product.fulfillment')
  ) as v(capability_key)
  where not exists (
    select 1
    from public.capabilities as c
    where c.capability_key = v.capability_key
      and c.lifecycle_status = 'active'
      and c.catalog_visibility = 'listed'
  );
  if missing is not null then
    raise exception 'CAP-4TG seed: missing capabilities: %', missing;
  end if;

  select count(*)
    into n_new_capabilities
  from public.capabilities as c
  where c.capability_key in (
    'shared.projects',
    'field.locations',
    'field.work-orders',
    'field.dispatch',
    'product.products',
    'product.orders',
    'product.inventory',
    'product.fulfillment'
  );
  if n_new_capabilities <> 8 then
    raise exception 'CAP-4TG seed: expected 8 new capabilities, found %', n_new_capabilities;
  end if;

  select count(*)
    into n_cap1_capabilities
  from public.capabilities as c
  where c.capability_key in (
    'core.tasks',
    'core.attention',
    'core.member-administration',
    'shared.crm.leads',
    'shared.crm.customers',
    'knowledge.programs',
    'knowledge.enrollments',
    'knowledge.progress',
    'horizontal.social.connection',
    'horizontal.social.content',
    'horizontal.social.approval',
    'horizontal.social.scheduling',
    'horizontal.social.publishing'
  );
  if n_cap1_capabilities <> 13 then
    raise exception 'CAP-4TG seed: CAP-1 capability inventory drift (expected 13, found %)', n_cap1_capabilities;
  end if;

  select count(*) into n_total_capabilities from public.capabilities;
  if n_total_capabilities <> 21 then
    raise exception 'CAP-4TG seed: expected 21 total capabilities, found %', n_total_capabilities;
  end if;

  select count(*)
    into n_new_readiness
  from public.capability_readiness as r
  inner join public.capabilities as c
    on c.id = r.capability_id
  where c.capability_key in (
    'shared.projects',
    'field.locations',
    'field.work-orders',
    'field.dispatch',
    'product.products',
    'product.orders',
    'product.inventory',
    'product.fulfillment'
  )
    and r.readiness_status = 'context_ready'
    and r.evidence_phase = 'BETA1-4TG-CONTEXT-PACKS'
    and r.verified_at is null;
  if n_new_readiness <> 8 then
    raise exception 'CAP-4TG seed: expected 8 context_ready readiness rows, found %', n_new_readiness;
  end if;

  select count(*)
    into n_beta_supported
  from public.capability_readiness as r
  inner join public.capabilities as c
    on c.id = r.capability_id
  where c.capability_key in (
    'shared.projects',
    'field.locations',
    'field.work-orders',
    'field.dispatch',
    'product.products',
    'product.orders',
    'product.inventory',
    'product.fulfillment'
  )
    and r.readiness_status = 'beta_supported';
  if n_beta_supported <> 0 then
    raise exception 'CAP-4TG seed: new capabilities must not be beta_supported';
  end if;

  select count(*)
    into n_production_verified_new
  from public.capability_readiness as r
  inner join public.capabilities as c
    on c.id = r.capability_id
  where c.capability_key in (
    'shared.projects',
    'field.locations',
    'field.work-orders',
    'field.dispatch',
    'product.products',
    'product.orders',
    'product.inventory',
    'product.fulfillment'
  )
    and r.readiness_status = 'production_verified';
  if n_production_verified_new <> 0 then
    raise exception 'CAP-4TG seed: new capabilities must not be production_verified';
  end if;

  select count(*)
    into n_new_dependencies
  from public.capability_dependencies as d
  inner join public.capabilities as dependent
    on dependent.id = d.capability_id
  where dependent.capability_key in (
    'shared.projects',
    'field.work-orders',
    'field.dispatch',
    'product.orders',
    'product.fulfillment',
    'product.inventory'
  );
  if n_new_dependencies <> 8 then
    raise exception 'CAP-4TG seed: expected 8 new dependency edges, found %', n_new_dependencies;
  end if;
end $$;
