-- ZyntixAI BETA1-4TG-CONTEXT-PACKS — additive CTX foundation packs for TG2/TG3/TG4.
-- Parent TAX/CAP IDs resolve by stable key. UUIDs are not hardcoded.
-- ON CONFLICT DO NOTHING does not rewrite frozen CTX-1 semantic versions.
-- New packs remain context_ready — not beta_supported.
--
-- evidence_phase = BETA1-4TG-CONTEXT-PACKS
-- verified_at remains NULL. Catalog contract present; product features not implemented.

do $$
declare
  missing text;
begin
  if not exists (
    select 1
    from public.taxonomy_foundations
    where key = 'service'
      and lifecycle_status = 'active'
  ) then
    raise exception 'CTX-4TG seed: taxonomy foundation service missing';
  end if;

  if not exists (
    select 1
    from public.taxonomy_foundations
    where key = 'field-operations'
      and lifecycle_status = 'active'
  ) then
    raise exception 'CTX-4TG seed: taxonomy foundation field-operations missing';
  end if;

  if not exists (
    select 1
    from public.taxonomy_foundations
    where key = 'product-operations'
      and lifecycle_status = 'active'
  ) then
    raise exception 'CTX-4TG seed: taxonomy foundation product-operations missing';
  end if;

  select string_agg(v.capability_key, ', ' order by v.capability_key)
    into missing
  from (
    values
      ('shared.crm.customers'),
      ('shared.crm.leads'),
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
  );
  if missing is not null then
    raise exception 'CTX-4TG seed: missing capabilities: %', missing;
  end if;
end $$;

insert into public.context_packs (
  pack_key,
  label,
  pack_kind,
  default_locale,
  lifecycle_status,
  foundation_id
)
select
  v.pack_key,
  v.label,
  'foundation',
  'en',
  'active',
  f.id
from (
  values
    ('foundation.service', 'Service', 'service'),
    ('foundation.field-operations', 'Field Operations', 'field-operations'),
    ('foundation.product-operations', 'Product Operations', 'product-operations')
) as v(pack_key, label, foundation_key)
inner join public.taxonomy_foundations as f
  on f.key = v.foundation_key
on conflict (pack_key) do nothing;

do $$
declare
  pack record;
  pack_id uuid;
  version_id uuid;
  version_status text;
begin
  for pack in
    select *
    from (
      values
        (
          'foundation.service',
          'service',
          'An agency or professional-services business pursues leads, converts clients, and delivers work through projects, tasks, and attention-driven follow-up.',
          'Agency / professional-services operator',
          'Client delivery engagements'
        ),
        (
          'foundation.field-operations',
          'field-operations',
          'A field-operations business manages customer jobs, sites, work orders, technician assignment, and lightweight dispatch through completion.',
          'Construction / installation / field-service operator',
          'Jobs, sites, and field work orders'
        ),
        (
          'foundation.product-operations',
          'product-operations',
          'A product-operations business defines products, takes orders, tracks inventory impact, and moves fulfillment status to completion.',
          'E-commerce / product / fulfillment operator',
          'Products, orders, and fulfillment'
        )
    ) as v(pack_key, foundation_key, definition_summary, intended_operator, primary_exchange)
  loop
    select p.id
      into pack_id
    from public.context_packs as p
    inner join public.taxonomy_foundations as f
      on f.id = p.foundation_id
    where p.pack_key = pack.pack_key
      and p.pack_kind = 'foundation'
      and p.lifecycle_status = 'active'
      and f.key = pack.foundation_key
      and p.industry_id is null
      and p.niche_id is null
      and p.specialization_id is null
      and p.deep_specialization_id is null;

    if pack_id is null then
      raise exception 'CTX-4TG seed: % missing or taxonomy target conflict', pack.pack_key;
    end if;

    insert into public.context_pack_versions (
      pack_id,
      version_number,
      publication_status,
      completeness,
      parent_version_id,
      change_impact,
      impact_note,
      definition_summary,
      intended_operator,
      primary_exchange
    )
    values (
      pack_id,
      1,
      'draft',
      'full',
      null,
      'high',
      'Initial four-target-group foundation context baseline establishing capability relevance and operating definition.',
      pack.definition_summary,
      pack.intended_operator,
      pack.primary_exchange
    )
    on conflict (pack_id, version_number) do nothing;

    select v.id, v.publication_status
      into version_id, version_status
    from public.context_pack_versions as v
    where v.pack_id = pack_id
      and v.version_number = 1;

    if version_id is null then
      raise exception 'CTX-4TG seed: % v1 missing', pack.pack_key;
    end if;

    if version_status not in ('draft', 'published') then
      raise exception
        'CTX-4TG seed: % v1 has unexpected publication_status %',
        pack.pack_key,
        version_status;
    end if;

    if version_status = 'draft' then
      if pack.pack_key = 'foundation.service' then
        insert into public.context_capability_mappings (
          version_id,
          capability_id,
          mapping_op,
          relevance
        )
        select
          version_id,
          c.id,
          'set',
          v.relevance
        from (
          values
            ('shared.crm.customers', 'required'),
            ('shared.crm.leads', 'required'),
            ('shared.projects', 'required')
        ) as v(capability_key, relevance)
        inner join public.capabilities as c
          on c.capability_key = v.capability_key
        on conflict (version_id, capability_id) do nothing;

        insert into public.context_terminology (
          version_id,
          locale,
          term_key,
          singular_label,
          plural_label
        )
        select
          version_id,
          'en',
          v.term_key,
          v.singular_label,
          v.plural_label
        from (
          values
            ('customer', 'Client', 'Clients'),
            ('project', 'Project', 'Projects')
        ) as v(term_key, singular_label, plural_label)
        on conflict (version_id, locale, term_key) do nothing;
      elsif pack.pack_key = 'foundation.field-operations' then
        insert into public.context_capability_mappings (
          version_id,
          capability_id,
          mapping_op,
          relevance
        )
        select
          version_id,
          c.id,
          'set',
          v.relevance
        from (
          values
            ('shared.crm.customers', 'required'),
            ('shared.crm.leads', 'recommended'),
            ('shared.projects', 'required'),
            ('field.locations', 'required'),
            ('field.work-orders', 'required'),
            ('field.dispatch', 'required')
        ) as v(capability_key, relevance)
        inner join public.capabilities as c
          on c.capability_key = v.capability_key
        on conflict (version_id, capability_id) do nothing;

        insert into public.context_terminology (
          version_id,
          locale,
          term_key,
          singular_label,
          plural_label
        )
        select
          version_id,
          'en',
          v.term_key,
          v.singular_label,
          v.plural_label
        from (
          values
            ('customer', 'Customer', 'Customers'),
            ('project', 'Job', 'Jobs'),
            ('site', 'Site', 'Sites'),
            ('work_order', 'Work order', 'Work orders'),
            ('technician', 'Technician', 'Technicians')
        ) as v(term_key, singular_label, plural_label)
        on conflict (version_id, locale, term_key) do nothing;
      elsif pack.pack_key = 'foundation.product-operations' then
        insert into public.context_capability_mappings (
          version_id,
          capability_id,
          mapping_op,
          relevance
        )
        select
          version_id,
          c.id,
          'set',
          v.relevance
        from (
          values
            ('shared.crm.customers', 'required'),
            ('product.products', 'required'),
            ('product.orders', 'required'),
            ('product.inventory', 'required'),
            ('product.fulfillment', 'required')
        ) as v(capability_key, relevance)
        inner join public.capabilities as c
          on c.capability_key = v.capability_key
        on conflict (version_id, capability_id) do nothing;

        insert into public.context_terminology (
          version_id,
          locale,
          term_key,
          singular_label,
          plural_label
        )
        select
          version_id,
          'en',
          v.term_key,
          v.singular_label,
          v.plural_label
        from (
          values
            ('customer', 'Customer', 'Customers'),
            ('product', 'Product', 'Products'),
            ('order', 'Order', 'Orders'),
            ('inventory', 'Inventory', 'Inventory'),
            ('fulfillment', 'Fulfillment', 'Fulfillment')
        ) as v(term_key, singular_label, plural_label)
        on conflict (version_id, locale, term_key) do nothing;
      else
        raise exception 'CTX-4TG seed: unexpected pack %', pack.pack_key;
      end if;

      update public.context_pack_versions
      set publication_status = 'published'
      where id = version_id
        and publication_status = 'draft';
    end if;

    insert into public.context_pack_readiness (
      version_id,
      readiness_status,
      supported_scope,
      evidence_phase,
      verified_at
    )
    values (
      version_id,
      'context_ready',
      '{"journey": "four-target-group-beta1", "runtime": "catalog-only", "resolver": true}'::jsonb,
      'BETA1-4TG-CONTEXT-PACKS',
      null
    )
    on conflict (version_id) do nothing;
  end loop;
end $$;

do $$
declare
  missing text;
  n_packs integer;
  n_versions integer;
  n_published integer;
  n_mappings integer;
  n_terms integer;
  n_readiness integer;
  n_niches integer;
  n_beta_supported integer;
  n_product_projects integer;
begin
  select count(*) into n_packs from public.context_packs;
  if n_packs <> 5 then
    raise exception 'CTX-4TG seed: expected 5 context_packs, found %', n_packs;
  end if;

  select count(*) into n_versions from public.context_pack_versions;
  if n_versions <> 5 then
    raise exception 'CTX-4TG seed: expected 5 context_pack_versions, found %', n_versions;
  end if;

  select count(*)
    into n_published
  from public.context_pack_versions
  where publication_status = 'published'
    and completeness = 'full';
  if n_published <> 5 then
    raise exception 'CTX-4TG seed: expected 5 published full versions, found %', n_published;
  end if;

  select count(*) into n_mappings from public.context_capability_mappings;
  if n_mappings <> 24 then
    raise exception 'CTX-4TG seed: expected 24 context_capability_mappings, found %', n_mappings;
  end if;

  select count(*) into n_terms from public.context_terminology;
  if n_terms <> 16 then
    raise exception 'CTX-4TG seed: expected 16 context_terminology rows, found %', n_terms;
  end if;

  select count(*) into n_readiness from public.context_pack_readiness;
  if n_readiness <> 5 then
    raise exception 'CTX-4TG seed: expected 5 context_pack_readiness rows, found %', n_readiness;
  end if;

  select count(*)
    into n_niches
  from public.context_packs
  where pack_kind = 'niche';
  if n_niches <> 1 then
    raise exception 'CTX-4TG seed: expected exactly 1 niche pack, found %', n_niches;
  end if;

  select count(*)
    into n_beta_supported
  from public.context_pack_readiness
  where readiness_status = 'beta_supported';
  if n_beta_supported <> 0 then
    raise exception 'CTX-4TG seed: new foundation packs must not be beta_supported';
  end if;

  select count(*)
    into n_product_projects
  from public.context_capability_mappings as m
  inner join public.context_pack_versions as ver
    on ver.id = m.version_id
  inner join public.context_packs as p
    on p.id = ver.pack_id
  inner join public.capabilities as c
    on c.id = m.capability_id
  where p.pack_key = 'foundation.product-operations'
    and c.capability_key = 'shared.projects';
  if n_product_projects <> 0 then
    raise exception 'CTX-4TG seed: product-operations must not map shared.projects';
  end if;

  select string_agg(v.pack_key, ', ' order by v.pack_key)
    into missing
  from (
    values
      ('foundation.service'),
      ('foundation.field-operations'),
      ('foundation.product-operations')
  ) as v(pack_key)
  where not exists (
    select 1
    from public.context_packs as p
    where p.pack_key = v.pack_key
      and p.pack_kind = 'foundation'
      and p.lifecycle_status = 'active'
  );
  if missing is not null then
    raise exception 'CTX-4TG seed: missing foundation packs: %', missing;
  end if;

  select string_agg(v.pack_key || ':' || v.readiness_status, ', ' order by v.pack_key)
    into missing
  from (
    values
      ('foundation.service', 'context_ready'),
      ('foundation.field-operations', 'context_ready'),
      ('foundation.product-operations', 'context_ready')
  ) as v(pack_key, readiness_status)
  where not exists (
    select 1
    from public.context_pack_readiness as r
    inner join public.context_pack_versions as ver
      on ver.id = r.version_id
    inner join public.context_packs as p
      on p.id = ver.pack_id
    where p.pack_key = v.pack_key
      and ver.version_number = 1
      and r.readiness_status = v.readiness_status
      and r.evidence_phase = 'BETA1-4TG-CONTEXT-PACKS'
      and r.verified_at is null
  );
  if missing is not null then
    raise exception 'CTX-4TG seed: missing context_ready readiness: %', missing;
  end if;
end $$;
