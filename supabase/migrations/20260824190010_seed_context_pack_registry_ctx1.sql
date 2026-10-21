-- ZyntixAI CTX-1B — frozen Context Pack catalog seed.
-- Parent TAX/CAP IDs resolve by stable key. UUIDs are not hardcoded.
-- ON CONFLICT DO NOTHING does not rewrite published semantic versions.
-- Conflicting existing semantic content fails via explicit RAISE.
--
-- Seed order respects published-child immutability:
--   1. pack identity
--   2. version as draft
--   3. mappings / terminology
--   4. draft → published
--   5. readiness (not frozen by child-semantic trigger)
-- Knowledge Foundation v1 is published before Niche v1 is created.
--
-- Context readiness is context_ready, not production_verified.
-- verified_at remains NULL. evidence_phase CTX-1B is implementation provenance.

do $$
begin
  if not exists (
    select 1
    from public.taxonomy_foundations
    where key = 'knowledge'
      and lifecycle_status = 'active'
  ) then
    raise exception 'CTX-1 seed: taxonomy foundation knowledge missing';
  end if;

  if not exists (
    select 1
    from public.taxonomy_niches
    where key = 'online-course-business'
      and lifecycle_status = 'active'
  ) then
    raise exception 'CTX-1 seed: taxonomy niche online-course-business missing';
  end if;
end $$;

do $$
declare
  missing text;
begin
  select string_agg(v.capability_key, ', ' order by v.capability_key)
    into missing
  from (
    values
      ('shared.crm.customers'),
      ('shared.crm.leads'),
      ('knowledge.programs'),
      ('knowledge.enrollments'),
      ('knowledge.progress'),
      ('horizontal.social.connection'),
      ('horizontal.social.content'),
      ('horizontal.social.approval'),
      ('horizontal.social.scheduling'),
      ('horizontal.social.publishing')
  ) as v(capability_key)
  where not exists (
    select 1
    from public.capabilities as c
    where c.capability_key = v.capability_key
      and c.lifecycle_status = 'active'
  );
  if missing is not null then
    raise exception 'CTX-1 seed: missing capabilities: %', missing;
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
  'foundation.knowledge',
  'Knowledge',
  'foundation',
  'en',
  'active',
  f.id
from public.taxonomy_foundations as f
where f.key = 'knowledge'
on conflict (pack_key) do nothing;

insert into public.context_packs (
  pack_key,
  label,
  pack_kind,
  default_locale,
  lifecycle_status,
  niche_id
)
select
  'niche.online-course-business',
  'Online Course Business',
  'niche',
  'en',
  'active',
  n.id
from public.taxonomy_niches as n
where n.key = 'online-course-business'
on conflict (pack_key) do nothing;

do $$
declare
  knowledge_pack_id uuid;
  niche_pack_id uuid;
  knowledge_version_id uuid;
  niche_version_id uuid;
  knowledge_status text;
  niche_status text;
  n_wrong integer;
begin
  select p.id
    into knowledge_pack_id
  from public.context_packs as p
  inner join public.taxonomy_foundations as f
    on f.id = p.foundation_id
  where p.pack_key = 'foundation.knowledge'
    and p.pack_kind = 'foundation'
    and p.lifecycle_status = 'active'
    and f.key = 'knowledge'
    and p.industry_id is null
    and p.niche_id is null
    and p.specialization_id is null
    and p.deep_specialization_id is null;

  if knowledge_pack_id is null then
    raise exception
      'CTX-1 seed: foundation.knowledge missing or taxonomy target conflict';
  end if;

  select p.id
    into niche_pack_id
  from public.context_packs as p
  inner join public.taxonomy_niches as n
    on n.id = p.niche_id
  where p.pack_key = 'niche.online-course-business'
    and p.pack_kind = 'niche'
    and p.lifecycle_status = 'active'
    and n.key = 'online-course-business'
    and p.foundation_id is null
    and p.industry_id is null
    and p.specialization_id is null
    and p.deep_specialization_id is null;

  if niche_pack_id is null then
    raise exception
      'CTX-1 seed: niche.online-course-business missing or taxonomy target conflict';
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
    knowledge_pack_id,
    1,
    'draft',
    'full',
    null,
    'high',
    'Initial governed Context baseline establishing capability relevance and operating definition.',
    'A Knowledge business creates and delivers structured learning programs to enrolled customers and records their progress.',
    'Knowledge / education operator',
    'Structured learning programs'
  )
  on conflict (pack_id, version_number) do nothing;

  select v.id, v.publication_status
    into knowledge_version_id, knowledge_status
  from public.context_pack_versions as v
  where v.pack_id = knowledge_pack_id
    and v.version_number = 1;

  if knowledge_version_id is null then
    raise exception 'CTX-1 seed: Knowledge Foundation v1 missing';
  end if;

  if knowledge_status not in ('draft', 'published') then
    raise exception
      'CTX-1 seed: Knowledge Foundation v1 has unexpected publication_status %',
      knowledge_status;
  end if;

  if knowledge_status = 'draft' then
    insert into public.context_capability_mappings (
      version_id,
      capability_id,
      mapping_op,
      relevance
    )
    select
      knowledge_version_id,
      c.id,
      'set',
      v.relevance
    from (
      values
        ('shared.crm.customers', 'required'),
        ('knowledge.programs', 'required'),
        ('knowledge.enrollments', 'required'),
        ('knowledge.progress', 'required')
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
      knowledge_version_id,
      'en',
      v.term_key,
      v.singular_label,
      v.plural_label
    from (
      values
        ('customer', 'Customer', 'Customers'),
        ('program', 'Program', 'Programs'),
        ('enrollment', 'Enrollment', 'Enrollments'),
        ('progress', 'Progress', 'Progress')
    ) as v(term_key, singular_label, plural_label)
    on conflict (version_id, locale, term_key) do nothing;

    update public.context_pack_versions
    set publication_status = 'published'
    where id = knowledge_version_id
      and publication_status = 'draft';
  end if;

  select v.publication_status
    into knowledge_status
  from public.context_pack_versions as v
  where v.id = knowledge_version_id;

  if knowledge_status <> 'published' then
    raise exception
      'CTX-1 seed: Knowledge Foundation v1 must be published before Niche v1';
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
    niche_pack_id,
    1,
    'draft',
    'full',
    knowledge_version_id,
    'high',
    'Initial governed Context baseline establishing capability relevance and operating definition.',
    'An Online Course Business sells and delivers structured educational programs online, typically generating leads, converting them to customers, enrolling those customers in programs, and tracking progress.',
    'Online course creator / course-seller operator',
    'Online courses sold as programs'
  )
  on conflict (pack_id, version_number) do nothing;

  select v.id, v.publication_status
    into niche_version_id, niche_status
  from public.context_pack_versions as v
  where v.pack_id = niche_pack_id
    and v.version_number = 1;

  if niche_version_id is null then
    raise exception 'CTX-1 seed: Online Course Business Niche v1 missing';
  end if;

  if niche_status not in ('draft', 'published') then
    raise exception
      'CTX-1 seed: Niche v1 has unexpected publication_status %',
      niche_status;
  end if;

  select count(*)
    into n_wrong
  from public.context_pack_versions as v
  where v.id = niche_version_id
    and (
      v.parent_version_id is distinct from knowledge_version_id
      or v.completeness <> 'full'
    );
  if n_wrong <> 0 then
    raise exception
      'CTX-1 seed: Niche v1 parent/completeness conflict with governed baseline';
  end if;

  if niche_status = 'draft' then
    insert into public.context_capability_mappings (
      version_id,
      capability_id,
      mapping_op,
      relevance
    )
    select
      niche_version_id,
      c.id,
      'set',
      v.relevance
    from (
      values
        ('shared.crm.leads', 'recommended'),
        ('horizontal.social.connection', 'optional'),
        ('horizontal.social.content', 'optional'),
        ('horizontal.social.approval', 'optional'),
        ('horizontal.social.scheduling', 'optional'),
        ('horizontal.social.publishing', 'optional')
    ) as v(capability_key, relevance)
    inner join public.capabilities as c
      on c.capability_key = v.capability_key
    on conflict (version_id, capability_id) do nothing;

    update public.context_pack_versions
    set publication_status = 'published'
    where id = niche_version_id
      and publication_status = 'draft';
  end if;

  insert into public.context_pack_readiness (
    version_id,
    readiness_status,
    supported_scope,
    evidence_phase,
    verified_at
  )
  select
    v.id,
    'context_ready',
    '{"journey": "closed-beta-course-sellers", "runtime": "inert", "resolver": false}'::jsonb,
    'CTX-1B',
    null
  from public.context_pack_versions as v
  where v.id in (knowledge_version_id, niche_version_id)
  on conflict (version_id) do nothing;
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
  n_foundation_required integer;
  n_niche_mappings integer;
  n_core integer;
  n_remove integer;
  n_industry integer;
  n_niche_terms integer;
  n_context_ready integer;
  unresolved text;
begin
  select count(*) into n_packs from public.context_packs;
  if n_packs <> 2 then
    raise exception 'CTX-1 seed: expected 2 context_packs, found %', n_packs;
  end if;

  select count(*) into n_versions from public.context_pack_versions;
  if n_versions <> 2 then
    raise exception
      'CTX-1 seed: expected 2 context_pack_versions, found %',
      n_versions;
  end if;

  select count(*)
    into n_published
  from public.context_pack_versions
  where publication_status = 'published'
    and completeness = 'full'
    and change_impact = 'high';
  if n_published <> 2 then
    raise exception
      'CTX-1 seed: expected 2 published full high-impact versions, found %',
      n_published;
  end if;

  select count(*) into n_mappings from public.context_capability_mappings;
  if n_mappings <> 10 then
    raise exception
      'CTX-1 seed: expected 10 context_capability_mappings, found %',
      n_mappings;
  end if;

  select count(*) into n_terms from public.context_terminology;
  if n_terms <> 4 then
    raise exception
      'CTX-1 seed: expected 4 context_terminology rows, found %',
      n_terms;
  end if;

  select count(*) into n_readiness from public.context_pack_readiness;
  if n_readiness <> 2 then
    raise exception
      'CTX-1 seed: expected 2 context_pack_readiness rows, found %',
      n_readiness;
  end if;

  select count(*)
    into n_industry
  from public.context_packs
  where pack_kind <> 'foundation'
    and pack_kind <> 'niche';
  if n_industry <> 0 then
    raise exception 'CTX-1 seed: unexpected non Foundation/Niche packs';
  end if;

  select string_agg(v.capability_key, ', ' order by v.capability_key)
    into missing
  from (
    values
      ('shared.crm.customers'),
      ('knowledge.programs'),
      ('knowledge.enrollments'),
      ('knowledge.progress')
  ) as v(capability_key)
  where not exists (
    select 1
    from public.context_capability_mappings as m
    inner join public.context_pack_versions as ver
      on ver.id = m.version_id
    inner join public.context_packs as p
      on p.id = ver.pack_id
    inner join public.capabilities as c
      on c.id = m.capability_id
    where p.pack_key = 'foundation.knowledge'
      and ver.version_number = 1
      and c.capability_key = v.capability_key
      and m.mapping_op = 'set'
      and m.relevance = 'required'
  );
  if missing is not null then
    raise exception
      'CTX-1 seed: missing Foundation required mappings: %',
      missing;
  end if;

  select count(*)
    into n_foundation_required
  from public.context_capability_mappings as m
  inner join public.context_pack_versions as ver
    on ver.id = m.version_id
  inner join public.context_packs as p
    on p.id = ver.pack_id
  where p.pack_key = 'foundation.knowledge'
    and ver.version_number = 1;
  if n_foundation_required <> 4 then
    raise exception
      'CTX-1 seed: Foundation v1 must have exactly 4 mappings, found %',
      n_foundation_required;
  end if;

  select string_agg(v.capability_key || ':' || v.relevance, ', ' order by v.capability_key)
    into missing
  from (
    values
      ('shared.crm.leads', 'recommended'),
      ('horizontal.social.connection', 'optional'),
      ('horizontal.social.content', 'optional'),
      ('horizontal.social.approval', 'optional'),
      ('horizontal.social.scheduling', 'optional'),
      ('horizontal.social.publishing', 'optional')
  ) as v(capability_key, relevance)
  where not exists (
    select 1
    from public.context_capability_mappings as m
    inner join public.context_pack_versions as ver
      on ver.id = m.version_id
    inner join public.context_packs as p
      on p.id = ver.pack_id
    inner join public.capabilities as c
      on c.id = m.capability_id
    where p.pack_key = 'niche.online-course-business'
      and ver.version_number = 1
      and c.capability_key = v.capability_key
      and m.mapping_op = 'set'
      and m.relevance = v.relevance
  );
  if missing is not null then
    raise exception 'CTX-1 seed: missing Niche mappings: %', missing;
  end if;

  select count(*)
    into n_niche_mappings
  from public.context_capability_mappings as m
  inner join public.context_pack_versions as ver
    on ver.id = m.version_id
  inner join public.context_packs as p
    on p.id = ver.pack_id
  where p.pack_key = 'niche.online-course-business'
    and ver.version_number = 1;
  if n_niche_mappings <> 6 then
    raise exception
      'CTX-1 seed: Niche v1 must have exactly 6 mappings, found %',
      n_niche_mappings;
  end if;

  if exists (
    select 1
    from public.context_capability_mappings as m
    inner join public.context_pack_versions as ver
      on ver.id = m.version_id
    inner join public.context_packs as p
      on p.id = ver.pack_id
    inner join public.capabilities as c
      on c.id = m.capability_id
    where p.pack_key = 'niche.online-course-business'
      and c.capability_key in (
        'shared.crm.customers',
        'knowledge.programs',
        'knowledge.enrollments',
        'knowledge.progress'
      )
  ) then
    raise exception
      'CTX-1 seed: Niche v1 must inherit Foundation required mappings, not duplicate them';
  end if;

  select count(*)
    into n_core
  from public.context_capability_mappings as m
  inner join public.capabilities as c
    on c.id = m.capability_id
  where c.capability_key like 'core.%';
  if n_core <> 0 then
    raise exception
      'CTX-1 seed: Core capabilities must not appear in context_capability_mappings';
  end if;

  select count(*)
    into n_remove
  from public.context_capability_mappings
  where mapping_op = 'remove';
  if n_remove <> 0 then
    raise exception 'CTX-1 seed: v1 must not contain REMOVE mappings';
  end if;

  select string_agg(v.term_key, ', ' order by v.term_key)
    into missing
  from (
    values
      ('customer'),
      ('program'),
      ('enrollment'),
      ('progress')
  ) as v(term_key)
  where not exists (
    select 1
    from public.context_terminology as t
    inner join public.context_pack_versions as ver
      on ver.id = t.version_id
    inner join public.context_packs as p
      on p.id = ver.pack_id
    where p.pack_key = 'foundation.knowledge'
      and ver.version_number = 1
      and t.locale = 'en'
      and t.term_key = v.term_key
  );
  if missing is not null then
    raise exception 'CTX-1 seed: missing Foundation terminology: %', missing;
  end if;

  select count(*)
    into n_niche_terms
  from public.context_terminology as t
  inner join public.context_pack_versions as ver
    on ver.id = t.version_id
  inner join public.context_packs as p
    on p.id = ver.pack_id
  where p.pack_key = 'niche.online-course-business';
  if n_niche_terms <> 0 then
    raise exception
      'CTX-1 seed: Niche v1 must have 0 terminology rows, found %',
      n_niche_terms;
  end if;

  select count(*)
    into n_context_ready
  from public.context_pack_readiness
  where readiness_status = 'context_ready'
    and verified_at is null
    and evidence_phase = 'CTX-1B'
    and supported_scope =
      '{"journey": "closed-beta-course-sellers", "runtime": "inert", "resolver": false}'::jsonb;
  if n_context_ready <> 2 then
    raise exception
      'CTX-1 seed: expected 2 context_ready inert readiness rows, found %',
      n_context_ready;
  end if;

  -- Resolved Niche required set = Foundation required SET rows (inherited).
  -- CAP hard-dependency closure must also be required.
  select string_agg(dep.capability_key, ', ' order by dep.capability_key)
    into unresolved
  from public.context_capability_mappings as m
  inner join public.context_pack_versions as ver
    on ver.id = m.version_id
  inner join public.context_packs as p
    on p.id = ver.pack_id
  inner join public.capability_dependencies as d
    on d.capability_id = m.capability_id
  inner join public.capabilities as dep
    on dep.id = d.depends_on_capability_id
  where p.pack_key = 'foundation.knowledge'
    and ver.version_number = 1
    and m.mapping_op = 'set'
    and m.relevance = 'required'
    and not exists (
      select 1
      from public.context_capability_mappings as req
      inner join public.capabilities as req_cap
        on req_cap.id = req.capability_id
      where req.version_id = ver.id
        and req.mapping_op = 'set'
        and req.relevance = 'required'
        and req_cap.id = dep.id
    );
  if unresolved is not null then
    raise exception
      'CTX-1 seed: Foundation required set missing CAP hard dependency closure: %',
      unresolved;
  end if;
end $$;
