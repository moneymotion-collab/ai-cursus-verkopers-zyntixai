-- ZyntixAI CAP-1B — frozen CAP-1 catalog seed.
-- Parent IDs resolve by stable key. UUIDs are not hardcoded.
-- ON CONFLICT (capability_key) DO NOTHING does not rewrite labels or owners.
-- Missing Knowledge Foundation or incomplete graph fails via explicit RAISE.
--
-- verified_at is evidence-derived, not migration now():
--   Core/CRM/Knowledge: BETA1-FV document "Verification UTC" = 2026-08-22 13:50:00+00
--   Social: SMM-B1-FV evidence commit cd125f81 = 2026-08-22 10:27:28+00
--     (git committer 2026-08-22T12:27:28+02:00)

do $$
begin
  if not exists (
    select 1
    from public.taxonomy_foundations
    where key = 'knowledge'
      and lifecycle_status = 'active'
  ) then
    raise exception 'CAP-1 seed: taxonomy foundation knowledge missing';
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
      'core.tasks',
      'Tasks',
      'Canonical Core ability to manage organization tasks.',
      'core',
      'platform'
    ),
    (
      'core.attention',
      'Attention',
      'Canonical Core next-best-action and attention ability.',
      'core',
      'platform'
    ),
    (
      'core.member-administration',
      'Member administration',
      'Canonical Core ability to administer organization membership.',
      'core',
      'platform'
    ),
    (
      'shared.crm.leads',
      'Leads',
      'Canonical shared commercial ability to pursue leads.',
      'shared',
      'crm'
    ),
    (
      'shared.crm.customers',
      'Customers',
      'Canonical shared commercial ability to manage customer relationships.',
      'shared',
      'crm'
    ),
    (
      'knowledge.programs',
      'Programs',
      'Canonical Knowledge ability to manage learning programs.',
      'foundation',
      'knowledge'
    ),
    (
      'knowledge.enrollments',
      'Enrollments',
      'Canonical Knowledge ability to enroll customers in programs.',
      'foundation',
      'knowledge'
    ),
    (
      'knowledge.progress',
      'Progress',
      'Canonical Knowledge ability to record enrollment progress facts.',
      'foundation',
      'knowledge'
    ),
    (
      'horizontal.social.connection',
      'Social account connection',
      'Canonical horizontal ability to connect social provider accounts.',
      'horizontal',
      'social'
    ),
    (
      'horizontal.social.content',
      'Social content management',
      'Canonical horizontal ability to manage social content and media.',
      'horizontal',
      'social'
    ),
    (
      'horizontal.social.approval',
      'Social review and approval',
      'Canonical horizontal ability to review and approve social content.',
      'horizontal',
      'social'
    ),
    (
      'horizontal.social.scheduling',
      'Social calendar and scheduling',
      'Canonical horizontal ability to calendar and schedule social publications.',
      'horizontal',
      'social'
    ),
    (
      'horizontal.social.publishing',
      'Social publishing',
      'Canonical horizontal ability to publish social content to a provider.',
      'horizontal',
      'social'
    )
) as v(capability_key, label, description, owner_class, owner_key)
left join public.taxonomy_foundations as f
  on f.key = 'knowledge'
  and v.owner_class = 'foundation'
on conflict (capability_key) do nothing;

insert into public.capability_dependencies (
  capability_id,
  depends_on_capability_id
)
select dependent.id, required.id
from (
  values
    ('knowledge.enrollments', 'knowledge.programs'),
    ('knowledge.enrollments', 'shared.crm.customers'),
    ('knowledge.progress', 'knowledge.enrollments'),
    ('horizontal.social.approval', 'horizontal.social.content'),
    ('horizontal.social.scheduling', 'horizontal.social.content'),
    ('horizontal.social.publishing', 'horizontal.social.connection'),
    ('horizontal.social.publishing', 'horizontal.social.content')
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
  'production_verified',
  v.supported_scope,
  v.evidence_phase,
  v.verified_at
from (
  values
    (
      'core.tasks',
      '{"workspace": "closed-beta-course-sellers"}'::jsonb,
      'BETA1-FV',
      timestamptz '2026-08-22 13:50:00+00'
    ),
    (
      'core.attention',
      '{"workspace": "closed-beta-course-sellers"}'::jsonb,
      'BETA1-FV',
      timestamptz '2026-08-22 13:50:00+00'
    ),
    (
      'core.member-administration',
      '{"workspace": "closed-beta-course-sellers"}'::jsonb,
      'BETA1-FV',
      timestamptz '2026-08-22 13:50:00+00'
    ),
    (
      'shared.crm.leads',
      '{"workspace": "closed-beta-course-sellers"}'::jsonb,
      'BETA1-FV',
      timestamptz '2026-08-22 13:50:00+00'
    ),
    (
      'shared.crm.customers',
      '{"workspace": "closed-beta-course-sellers"}'::jsonb,
      'BETA1-FV',
      timestamptz '2026-08-22 13:50:00+00'
    ),
    (
      'knowledge.programs',
      '{"workspace": "closed-beta-course-sellers"}'::jsonb,
      'BETA1-FV',
      timestamptz '2026-08-22 13:50:00+00'
    ),
    (
      'knowledge.enrollments',
      '{"workspace": "closed-beta-course-sellers"}'::jsonb,
      'BETA1-FV',
      timestamptz '2026-08-22 13:50:00+00'
    ),
    (
      'knowledge.progress',
      '{"workspace": "closed-beta-course-sellers"}'::jsonb,
      'BETA1-FV',
      timestamptz '2026-08-22 13:50:00+00'
    ),
    (
      'horizontal.social.connection',
      '{"provider": "instagram"}'::jsonb,
      'SMM-B1-FV',
      timestamptz '2026-08-22 10:27:28+00'
    ),
    (
      'horizontal.social.content',
      '{"provider": "instagram"}'::jsonb,
      'SMM-B1-FV',
      timestamptz '2026-08-22 10:27:28+00'
    ),
    (
      'horizontal.social.approval',
      '{"provider": "instagram"}'::jsonb,
      'SMM-B1-FV',
      timestamptz '2026-08-22 10:27:28+00'
    ),
    (
      'horizontal.social.scheduling',
      '{"provider": "instagram", "media": ["feed-image", "story-image"]}'::jsonb,
      'SMM-B1-FV',
      timestamptz '2026-08-22 10:27:28+00'
    ),
    (
      'horizontal.social.publishing',
      '{"provider": "instagram", "media": ["feed-image", "story-image"]}'::jsonb,
      'SMM-B1-FV',
      timestamptz '2026-08-22 10:27:28+00'
    )
) as v(capability_key, supported_scope, evidence_phase, verified_at)
inner join public.capabilities as c
  on c.capability_key = v.capability_key
on conflict (capability_id) do nothing;

do $$
declare
  missing text;
  n_capabilities integer;
  n_dependencies integer;
  n_readiness integer;
  n_knowledge_foundation integer;
  n_non_foundation_with_fk integer;
  n_production_verified integer;
begin
  select string_agg(v.capability_key, ', ' order by v.capability_key)
    into missing
  from (
    values
      ('core.tasks'),
      ('core.attention'),
      ('core.member-administration'),
      ('shared.crm.leads'),
      ('shared.crm.customers'),
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
      and c.catalog_visibility = 'listed'
  );
  if missing is not null then
    raise exception 'CAP-1 seed: missing capabilities: %', missing;
  end if;

  select count(*) into n_capabilities from public.capabilities;
  if n_capabilities <> 13 then
    raise exception 'CAP-1 seed: expected 13 capabilities, found %', n_capabilities;
  end if;

  select count(*)
    into n_knowledge_foundation
  from public.capabilities as c
  inner join public.taxonomy_foundations as f
    on f.id = c.foundation_id
  where c.owner_class = 'foundation'
    and c.owner_key = 'knowledge'
    and f.key = 'knowledge'
    and c.capability_key in (
      'knowledge.programs',
      'knowledge.enrollments',
      'knowledge.progress'
    );
  if n_knowledge_foundation <> 3 then
    raise exception
      'CAP-1 seed: Knowledge Foundation FK mismatch (expected 3, found %)',
      n_knowledge_foundation;
  end if;

  select count(*)
    into n_non_foundation_with_fk
  from public.capabilities
  where owner_class <> 'foundation'
    and foundation_id is not null;
  if n_non_foundation_with_fk <> 0 then
    raise exception
      'CAP-1 seed: non-foundation capabilities must not have foundation_id';
  end if;

  select string_agg(v.dependent_key || ' -> ' || v.required_key, ', ' order by v.dependent_key, v.required_key)
    into missing
  from (
    values
      ('knowledge.enrollments', 'knowledge.programs'),
      ('knowledge.enrollments', 'shared.crm.customers'),
      ('knowledge.progress', 'knowledge.enrollments'),
      ('horizontal.social.approval', 'horizontal.social.content'),
      ('horizontal.social.scheduling', 'horizontal.social.content'),
      ('horizontal.social.publishing', 'horizontal.social.connection'),
      ('horizontal.social.publishing', 'horizontal.social.content')
  ) as v(dependent_key, required_key)
  where not exists (
    select 1
    from public.capability_dependencies as d
    inner join public.capabilities as dependent
      on dependent.id = d.capability_id
    inner join public.capabilities as required
      on required.id = d.depends_on_capability_id
    where dependent.capability_key = v.dependent_key
      and required.capability_key = v.required_key
  );
  if missing is not null then
    raise exception 'CAP-1 seed: missing dependency edges: %', missing;
  end if;

  select count(*) into n_dependencies from public.capability_dependencies;
  if n_dependencies <> 7 then
    raise exception 'CAP-1 seed: expected 7 dependency edges, found %', n_dependencies;
  end if;

  select count(*) into n_readiness from public.capability_readiness;
  if n_readiness <> 13 then
    raise exception 'CAP-1 seed: expected 13 readiness rows, found %', n_readiness;
  end if;

  select count(*)
    into n_production_verified
  from public.capability_readiness
  where readiness_status = 'production_verified'
    and evidence_phase is not null
    and btrim(evidence_phase) <> ''
    and verified_at is not null
    and jsonb_typeof(supported_scope) = 'object'
    and supported_scope <> '{}'::jsonb;
  if n_production_verified <> 13 then
    raise exception
      'CAP-1 seed: expected 13 production_verified readiness rows with evidence, found %',
      n_production_verified;
  end if;
end $$;
