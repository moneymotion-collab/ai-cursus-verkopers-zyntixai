-- ZyntixAI TAX-1B — frozen TAX-1 catalog seed.
-- Parent IDs resolve by stable key. UUIDs are not hardcoded.
-- ON CONFLICT (key) DO NOTHING does not rewrite labels or parents.
-- Missing parents fail the migration via explicit RAISE (not silent 0-row inserts).

insert into public.taxonomy_releases (key, label, lifecycle_status)
values ('ucf-tax-1', 'UCF Taxonomy v1', 'active')
on conflict (key) do nothing;

insert into public.taxonomy_foundations (
  key,
  label,
  lifecycle_status,
  catalog_visibility,
  introduced_in_release_id
)
select v.key, v.label, 'active', 'listed', r.id
from (
  values
    ('knowledge', 'Knowledge'),
    ('service', 'Service'),
    ('field-operations', 'Field Operations'),
    ('product-operations', 'Product Operations')
) as v(key, label)
cross join public.taxonomy_releases as r
where r.key = 'ucf-tax-1'
on conflict (key) do nothing;

insert into public.taxonomy_industries (
  key,
  label,
  foundation_id,
  lifecycle_status,
  catalog_visibility,
  introduced_in_release_id
)
select v.key, v.label, f.id, 'active', 'listed', r.id
from (
  values
    ('education-and-learning', 'Education & Learning', 'knowledge'),
    ('coaching-and-mentoring', 'Coaching & Mentoring', 'knowledge'),
    ('communities-and-memberships', 'Communities & Memberships', 'knowledge'),
    ('marketing-creative-and-media-services', 'Marketing, Creative & Media Services', 'service'),
    ('consulting-and-advisory', 'Consulting & Advisory', 'service'),
    ('technology-and-it-services', 'Technology & IT Services', 'service'),
    ('recruitment-hr-and-talent-services', 'Recruitment, HR & Talent Services', 'service'),
    ('finance-legal-and-administrative-services', 'Finance, Legal & Administrative Services', 'service'),
    ('business-support-and-outsourcing', 'Business Support & Outsourcing', 'service'),
    ('property-and-real-estate-services', 'Property & Real Estate Services', 'service'),
    ('construction-and-installation', 'Construction & Installation', 'field-operations'),
    ('property-and-facility-services', 'Property & Facility Services', 'field-operations'),
    ('cleaning-and-hygiene-services', 'Cleaning & Hygiene Services', 'field-operations'),
    ('landscaping-and-outdoor-services', 'Landscaping & Outdoor Services', 'field-operations'),
    ('technical-maintenance-and-repair', 'Technical Maintenance & Repair', 'field-operations'),
    ('security-safety-and-inspection-services', 'Security, Safety & Inspection Services', 'field-operations'),
    ('ecommerce-and-online-retail', 'E-commerce & Online Retail', 'product-operations'),
    ('brands-and-consumer-products', 'Brands & Consumer Products', 'product-operations'),
    ('retail-and-omnichannel', 'Retail & Omnichannel', 'product-operations'),
    ('wholesale-and-distribution', 'Wholesale & Distribution', 'product-operations'),
    ('warehousing-and-fulfillment', 'Warehousing & Fulfillment', 'product-operations'),
    ('manufacturing-and-production', 'Manufacturing & Production', 'product-operations')
) as v(key, label, foundation_key)
inner join public.taxonomy_foundations as f
  on f.key = v.foundation_key
cross join public.taxonomy_releases as r
where r.key = 'ucf-tax-1'
on conflict (key) do nothing;

insert into public.taxonomy_niches (
  key,
  label,
  industry_id,
  lifecycle_status,
  catalog_visibility,
  introduced_in_release_id
)
select
  'online-course-business',
  'Online Course Business',
  i.id,
  'active',
  'listed',
  r.id
from public.taxonomy_industries as i
cross join public.taxonomy_releases as r
where i.key = 'education-and-learning'
  and r.key = 'ucf-tax-1'
on conflict (key) do nothing;

insert into public.taxonomy_aliases (alias_label, locale, niche_id)
select v.alias_label, 'en', n.id
from (
  values
    ('Course Seller'),
    ('Course Sellers')
) as v(alias_label)
inner join public.taxonomy_niches as n
  on n.key = 'online-course-business';

do $$
declare
  missing text;
  n_releases integer;
  n_foundations integer;
  n_industries integer;
  n_niches integer;
  n_specializations integer;
  n_deep integer;
  n_aliases integer;
  manufacturing_foundation text;
begin
  if not exists (
    select 1
    from public.taxonomy_releases
    where key = 'ucf-tax-1'
      and lifecycle_status = 'active'
  ) then
    raise exception 'TAX-1 seed: taxonomy release ucf-tax-1 missing or not active';
  end if;

  select string_agg(v.key, ', ' order by v.key)
    into missing
  from (
    values
      ('knowledge'),
      ('service'),
      ('field-operations'),
      ('product-operations')
  ) as v(key)
  where not exists (
    select 1 from public.taxonomy_foundations as f where f.key = v.key
  );
  if missing is not null then
    raise exception 'TAX-1 seed: missing foundations: %', missing;
  end if;

  select string_agg(v.key, ', ' order by v.key)
    into missing
  from (
    values
      ('education-and-learning'),
      ('coaching-and-mentoring'),
      ('communities-and-memberships'),
      ('marketing-creative-and-media-services'),
      ('consulting-and-advisory'),
      ('technology-and-it-services'),
      ('recruitment-hr-and-talent-services'),
      ('finance-legal-and-administrative-services'),
      ('business-support-and-outsourcing'),
      ('property-and-real-estate-services'),
      ('construction-and-installation'),
      ('property-and-facility-services'),
      ('cleaning-and-hygiene-services'),
      ('landscaping-and-outdoor-services'),
      ('technical-maintenance-and-repair'),
      ('security-safety-and-inspection-services'),
      ('ecommerce-and-online-retail'),
      ('brands-and-consumer-products'),
      ('retail-and-omnichannel'),
      ('wholesale-and-distribution'),
      ('warehousing-and-fulfillment'),
      ('manufacturing-and-production')
  ) as v(key)
  where not exists (
    select 1 from public.taxonomy_industries as i where i.key = v.key
  );
  if missing is not null then
    raise exception 'TAX-1 seed: missing industries: %', missing;
  end if;

  select string_agg(v.key || ' expected ' || v.foundation_key, ', ' order by v.key)
    into missing
  from (
    values
      ('education-and-learning', 'knowledge'),
      ('coaching-and-mentoring', 'knowledge'),
      ('communities-and-memberships', 'knowledge'),
      ('marketing-creative-and-media-services', 'service'),
      ('consulting-and-advisory', 'service'),
      ('technology-and-it-services', 'service'),
      ('recruitment-hr-and-talent-services', 'service'),
      ('finance-legal-and-administrative-services', 'service'),
      ('business-support-and-outsourcing', 'service'),
      ('property-and-real-estate-services', 'service'),
      ('construction-and-installation', 'field-operations'),
      ('property-and-facility-services', 'field-operations'),
      ('cleaning-and-hygiene-services', 'field-operations'),
      ('landscaping-and-outdoor-services', 'field-operations'),
      ('technical-maintenance-and-repair', 'field-operations'),
      ('security-safety-and-inspection-services', 'field-operations'),
      ('ecommerce-and-online-retail', 'product-operations'),
      ('brands-and-consumer-products', 'product-operations'),
      ('retail-and-omnichannel', 'product-operations'),
      ('wholesale-and-distribution', 'product-operations'),
      ('warehousing-and-fulfillment', 'product-operations'),
      ('manufacturing-and-production', 'product-operations')
  ) as v(key, foundation_key)
  where not exists (
    select 1
    from public.taxonomy_industries as i
    inner join public.taxonomy_foundations as f
      on f.id = i.foundation_id
    where i.key = v.key
      and f.key = v.foundation_key
  );
  if missing is not null then
    raise exception 'TAX-1 seed: industry parent mismatch: %', missing;
  end if;

  if not exists (
    select 1
    from public.taxonomy_niches as n
    inner join public.taxonomy_industries as i
      on i.id = n.industry_id
    inner join public.taxonomy_releases as r
      on r.id = n.introduced_in_release_id
    where n.key = 'online-course-business'
      and n.label = 'Online Course Business'
      and i.key = 'education-and-learning'
      and r.key = 'ucf-tax-1'
      and n.lifecycle_status = 'active'
      and n.catalog_visibility = 'listed'
  ) then
    raise exception 'TAX-1 seed: reference niche online-course-business missing or mis-parented';
  end if;

  if not exists (
    select 1
    from public.taxonomy_aliases as a
    inner join public.taxonomy_niches as n
      on n.id = a.niche_id
    where a.alias_label = 'Course Seller'
      and a.alias_normalized = 'course seller'
      and a.locale = 'en'
      and n.key = 'online-course-business'
  ) then
    raise exception 'TAX-1 seed: alias Course Seller missing or mis-targeted';
  end if;

  if not exists (
    select 1
    from public.taxonomy_aliases as a
    inner join public.taxonomy_niches as n
      on n.id = a.niche_id
    where a.alias_label = 'Course Sellers'
      and a.alias_normalized = 'course sellers'
      and a.locale = 'en'
      and n.key = 'online-course-business'
  ) then
    raise exception 'TAX-1 seed: alias Course Sellers missing or mis-targeted';
  end if;

  select count(*) into n_releases from public.taxonomy_releases;
  select count(*) into n_foundations from public.taxonomy_foundations;
  select count(*) into n_industries from public.taxonomy_industries;
  select count(*) into n_niches from public.taxonomy_niches;
  select count(*) into n_specializations from public.taxonomy_specializations;
  select count(*) into n_deep from public.taxonomy_deep_specializations;
  select count(*) into n_aliases from public.taxonomy_aliases;

  if n_releases <> 1
     or n_foundations <> 4
     or n_industries <> 22
     or n_niches <> 1
     or n_specializations <> 0
     or n_deep <> 0
     or n_aliases <> 2
  then
    raise exception
      'TAX-1 seed: unexpected counts releases=% foundations=% industries=% niches=% specializations=% deep=% aliases=%',
      n_releases, n_foundations, n_industries, n_niches, n_specializations, n_deep, n_aliases;
  end if;

  select f.key
    into manufacturing_foundation
  from public.taxonomy_industries as i
  inner join public.taxonomy_foundations as f
    on f.id = i.foundation_id
  where i.key = 'manufacturing-and-production';

  if manufacturing_foundation is distinct from 'product-operations' then
    raise exception
      'TAX-1 seed: manufacturing-and-production must remain under product-operations, found %',
      manufacturing_foundation;
  end if;

  if exists (
    select 1
    from public.taxonomy_foundations
    where key = 'manufacturing-operations'
  ) then
    raise exception 'TAX-1 seed: must not create a fifth Manufacturing Operations Foundation';
  end if;
end
$$;
