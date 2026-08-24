-- ZyntixAI TAX-1B — Canonical Taxonomy Registry (schema + deny-by-default security).
--
-- Global platform control-plane catalog. Not tenant-owned. Not Organization
-- business data. Not product readiness. Not runtime permissions.
-- Writes v1: platform migration owner only. No policies. No RPCs. No grants
-- to anon/authenticated/service_role (service_role bypasses RLS).
-- Intentionally NOT FORCE ROW LEVEL SECURITY so the migration owner can seed.
--
-- alias_normalized is a STORED generated column: lower(btrim(alias_label)).
-- Duplicate identical mappings are blocked by class-specific partial unique
-- indexes; the same locale+normalized text may still target multiple nodes.

-- ---------------------------------------------------------------------------
-- Releases
-- ---------------------------------------------------------------------------

create table public.taxonomy_releases (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  lifecycle_status text not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint taxonomy_releases_key_unique unique (key),
  constraint taxonomy_releases_key_format_check check (
    key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(key) between 1 and 80
  ),
  constraint taxonomy_releases_label_check check (
    char_length(btrim(label)) > 0
    and char_length(label) <= 200
  ),
  constraint taxonomy_releases_lifecycle_status_check check (
    lifecycle_status in ('draft', 'active', 'superseded')
  )
);

comment on table public.taxonomy_releases is
  'Global taxonomy release/provenance registry. Not tenant-owned. Not product readiness. TAX-1 v1 is migration-managed.';
comment on column public.taxonomy_releases.key is
  'Immutable stable machine identity. Not a URL slug.';
comment on column public.taxonomy_releases.lifecycle_status is
  'Catalog release lifecycle (draft|active|superseded). Not product readiness. active != supported product.';
comment on column public.taxonomy_releases.label is
  'Mutable governance label. Not identity.';

create trigger taxonomy_releases_set_updated_at
  before update on public.taxonomy_releases
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Foundations
-- ---------------------------------------------------------------------------

create table public.taxonomy_foundations (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  lifecycle_status text not null,
  catalog_visibility text not null,
  introduced_in_release_id uuid not null,
  superseded_by_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint taxonomy_foundations_key_unique unique (key),
  constraint taxonomy_foundations_key_format_check check (
    key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(key) between 1 and 80
  ),
  constraint taxonomy_foundations_label_check check (
    char_length(btrim(label)) > 0
    and char_length(label) <= 200
  ),
  constraint taxonomy_foundations_lifecycle_status_check check (
    lifecycle_status in ('draft', 'active', 'superseded')
  ),
  constraint taxonomy_foundations_catalog_visibility_check check (
    catalog_visibility in ('internal', 'listed')
  ),
  constraint taxonomy_foundations_introduced_release_fk
    foreign key (introduced_in_release_id)
    references public.taxonomy_releases (id)
    on delete restrict,
  constraint taxonomy_foundations_superseded_by_fk
    foreign key (superseded_by_id)
    references public.taxonomy_foundations (id)
    on delete restrict,
  constraint taxonomy_foundations_supersession_check check (
    (
      lifecycle_status = 'superseded'
      and superseded_by_id is not null
      and superseded_by_id <> id
    )
    or (
      lifecycle_status <> 'superseded'
      and superseded_by_id is null
    )
  )
);

comment on table public.taxonomy_foundations is
  'Global Foundation registry (data, not an enum). Not tenant-owned. Not product readiness. TAX-1 v1 is migration-managed.';
comment on column public.taxonomy_foundations.key is
  'Immutable stable machine identity.';
comment on column public.taxonomy_foundations.label is
  'Mutable English governance label. Not identity.';
comment on column public.taxonomy_foundations.lifecycle_status is
  'draft|active|superseded. active taxonomy != supported product.';
comment on column public.taxonomy_foundations.catalog_visibility is
  'internal|listed. listed taxonomy != client/public runtime access.';
comment on column public.taxonomy_foundations.introduced_in_release_id is
  'Taxonomy release that introduced this node. Future classification provenance.';
comment on column public.taxonomy_foundations.superseded_by_id is
  'Same-table successor when superseded. Null otherwise. No self-supersession.';

create trigger taxonomy_foundations_set_updated_at
  before update on public.taxonomy_foundations
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Industries
-- ---------------------------------------------------------------------------

create table public.taxonomy_industries (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  foundation_id uuid not null,
  lifecycle_status text not null,
  catalog_visibility text not null,
  introduced_in_release_id uuid not null,
  superseded_by_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint taxonomy_industries_key_unique unique (key),
  constraint taxonomy_industries_key_format_check check (
    key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(key) between 1 and 80
  ),
  constraint taxonomy_industries_label_check check (
    char_length(btrim(label)) > 0
    and char_length(label) <= 200
  ),
  constraint taxonomy_industries_lifecycle_status_check check (
    lifecycle_status in ('draft', 'active', 'superseded')
  ),
  constraint taxonomy_industries_catalog_visibility_check check (
    catalog_visibility in ('internal', 'listed')
  ),
  constraint taxonomy_industries_foundation_fk
    foreign key (foundation_id)
    references public.taxonomy_foundations (id)
    on delete restrict,
  constraint taxonomy_industries_introduced_release_fk
    foreign key (introduced_in_release_id)
    references public.taxonomy_releases (id)
    on delete restrict,
  constraint taxonomy_industries_superseded_by_fk
    foreign key (superseded_by_id)
    references public.taxonomy_industries (id)
    on delete restrict,
  constraint taxonomy_industries_supersession_check check (
    (
      lifecycle_status = 'superseded'
      and superseded_by_id is not null
      and superseded_by_id <> id
    )
    or (
      lifecycle_status <> 'superseded'
      and superseded_by_id is null
    )
  )
);

comment on table public.taxonomy_industries is
  'Global Industry registry. Exactly one Foundation parent. Identity is independent of parent path. Not tenant-owned. TAX-1 v1 is migration-managed.';
comment on column public.taxonomy_industries.foundation_id is
  'Typed parent Foundation. Re-parenting later must not change Industry id/key.';
comment on column public.taxonomy_industries.lifecycle_status is
  'draft|active|superseded. active taxonomy != supported product.';
comment on column public.taxonomy_industries.catalog_visibility is
  'internal|listed. listed taxonomy != client/public runtime access.';

create trigger taxonomy_industries_set_updated_at
  before update on public.taxonomy_industries
  for each row
  execute function public.set_updated_at();

create index taxonomy_industries_foundation_id_idx
  on public.taxonomy_industries (foundation_id);

-- ---------------------------------------------------------------------------
-- Niches
-- ---------------------------------------------------------------------------

create table public.taxonomy_niches (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  industry_id uuid not null,
  lifecycle_status text not null,
  catalog_visibility text not null,
  introduced_in_release_id uuid not null,
  superseded_by_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint taxonomy_niches_key_unique unique (key),
  constraint taxonomy_niches_key_format_check check (
    key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(key) between 1 and 80
  ),
  constraint taxonomy_niches_label_check check (
    char_length(btrim(label)) > 0
    and char_length(label) <= 200
  ),
  constraint taxonomy_niches_lifecycle_status_check check (
    lifecycle_status in ('draft', 'active', 'superseded')
  ),
  constraint taxonomy_niches_catalog_visibility_check check (
    catalog_visibility in ('internal', 'listed')
  ),
  constraint taxonomy_niches_industry_fk
    foreign key (industry_id)
    references public.taxonomy_industries (id)
    on delete restrict,
  constraint taxonomy_niches_introduced_release_fk
    foreign key (introduced_in_release_id)
    references public.taxonomy_releases (id)
    on delete restrict,
  constraint taxonomy_niches_superseded_by_fk
    foreign key (superseded_by_id)
    references public.taxonomy_niches (id)
    on delete restrict,
  constraint taxonomy_niches_supersession_check check (
    (
      lifecycle_status = 'superseded'
      and superseded_by_id is not null
      and superseded_by_id <> id
    )
    or (
      lifecycle_status <> 'superseded'
      and superseded_by_id is null
    )
  )
);

comment on table public.taxonomy_niches is
  'Global Niche registry. Exactly one Industry parent. Presence != product support. Not tenant-owned. TAX-1 v1 is migration-managed.';
comment on column public.taxonomy_niches.industry_id is
  'Typed parent Industry. Identity is independent of parent path.';
comment on column public.taxonomy_niches.lifecycle_status is
  'draft|active|superseded. active taxonomy != supported product.';
comment on column public.taxonomy_niches.catalog_visibility is
  'internal|listed. listed taxonomy != client/public runtime access.';

create trigger taxonomy_niches_set_updated_at
  before update on public.taxonomy_niches
  for each row
  execute function public.set_updated_at();

create index taxonomy_niches_industry_id_idx
  on public.taxonomy_niches (industry_id);

create index taxonomy_niches_visibility_lifecycle_idx
  on public.taxonomy_niches (catalog_visibility, lifecycle_status);

-- ---------------------------------------------------------------------------
-- Specializations
-- ---------------------------------------------------------------------------

create table public.taxonomy_specializations (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  niche_id uuid not null,
  lifecycle_status text not null,
  catalog_visibility text not null,
  introduced_in_release_id uuid not null,
  superseded_by_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint taxonomy_specializations_key_unique unique (key),
  constraint taxonomy_specializations_key_format_check check (
    key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(key) between 1 and 80
  ),
  constraint taxonomy_specializations_label_check check (
    char_length(btrim(label)) > 0
    and char_length(label) <= 200
  ),
  constraint taxonomy_specializations_lifecycle_status_check check (
    lifecycle_status in ('draft', 'active', 'superseded')
  ),
  constraint taxonomy_specializations_catalog_visibility_check check (
    catalog_visibility in ('internal', 'listed')
  ),
  constraint taxonomy_specializations_niche_fk
    foreign key (niche_id)
    references public.taxonomy_niches (id)
    on delete restrict,
  constraint taxonomy_specializations_introduced_release_fk
    foreign key (introduced_in_release_id)
    references public.taxonomy_releases (id)
    on delete restrict,
  constraint taxonomy_specializations_superseded_by_fk
    foreign key (superseded_by_id)
    references public.taxonomy_specializations (id)
    on delete restrict,
  constraint taxonomy_specializations_supersession_check check (
    (
      lifecycle_status = 'superseded'
      and superseded_by_id is not null
      and superseded_by_id <> id
    )
    or (
      lifecycle_status <> 'superseded'
      and superseded_by_id is null
    )
  )
);

comment on table public.taxonomy_specializations is
  'Global Specialization registry: a kind of work within one Niche. Not a capability, channel, Work Area, or Organization attribute. TAX-1 v1 is migration-managed.';
comment on column public.taxonomy_specializations.niche_id is
  'Typed parent Niche. Cannot parent to Industry or Foundation.';
comment on column public.taxonomy_specializations.lifecycle_status is
  'draft|active|superseded. active taxonomy != supported product.';
comment on column public.taxonomy_specializations.catalog_visibility is
  'internal|listed. listed taxonomy != client/public runtime access.';

create trigger taxonomy_specializations_set_updated_at
  before update on public.taxonomy_specializations
  for each row
  execute function public.set_updated_at();

create index taxonomy_specializations_niche_id_idx
  on public.taxonomy_specializations (niche_id);

-- ---------------------------------------------------------------------------
-- Deep specializations
-- ---------------------------------------------------------------------------

create table public.taxonomy_deep_specializations (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  label text not null,
  specialization_id uuid not null,
  lifecycle_status text not null,
  catalog_visibility text not null,
  introduced_in_release_id uuid not null,
  superseded_by_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint taxonomy_deep_specializations_key_unique unique (key),
  constraint taxonomy_deep_specializations_key_format_check check (
    key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(key) between 1 and 80
  ),
  constraint taxonomy_deep_specializations_label_check check (
    char_length(btrim(label)) > 0
    and char_length(label) <= 200
  ),
  constraint taxonomy_deep_specializations_lifecycle_status_check check (
    lifecycle_status in ('draft', 'active', 'superseded')
  ),
  constraint taxonomy_deep_specializations_catalog_visibility_check check (
    catalog_visibility in ('internal', 'listed')
  ),
  constraint taxonomy_deep_specializations_specialization_fk
    foreign key (specialization_id)
    references public.taxonomy_specializations (id)
    on delete restrict,
  constraint taxonomy_deep_specializations_introduced_release_fk
    foreign key (introduced_in_release_id)
    references public.taxonomy_releases (id)
    on delete restrict,
  constraint taxonomy_deep_specializations_superseded_by_fk
    foreign key (superseded_by_id)
    references public.taxonomy_deep_specializations (id)
    on delete restrict,
  constraint taxonomy_deep_specializations_supersession_check check (
    (
      lifecycle_status = 'superseded'
      and superseded_by_id is not null
      and superseded_by_id <> id
    )
    or (
      lifecycle_status <> 'superseded'
      and superseded_by_id is null
    )
  )
);

comment on table public.taxonomy_deep_specializations is
  'Global Deep Specialization registry: a refinement of one Specialization. Depth stops here. TAX-1 v1 is migration-managed.';
comment on column public.taxonomy_deep_specializations.specialization_id is
  'Typed parent Specialization. Cannot parent to Niche or another Deep Specialization.';
comment on column public.taxonomy_deep_specializations.lifecycle_status is
  'draft|active|superseded. active taxonomy != supported product.';
comment on column public.taxonomy_deep_specializations.catalog_visibility is
  'internal|listed. listed taxonomy != client/public runtime access.';

create trigger taxonomy_deep_specializations_set_updated_at
  before update on public.taxonomy_deep_specializations
  for each row
  execute function public.set_updated_at();

create index taxonomy_deep_specializations_specialization_id_idx
  on public.taxonomy_deep_specializations (specialization_id);

-- ---------------------------------------------------------------------------
-- Aliases (not a hierarchy node)
-- ---------------------------------------------------------------------------

create table public.taxonomy_aliases (
  id uuid primary key default gen_random_uuid(),
  alias_label text not null,
  alias_normalized text generated always as (lower(btrim(alias_label))) stored,
  locale text not null,
  foundation_id uuid,
  industry_id uuid,
  niche_id uuid,
  specialization_id uuid,
  deep_specialization_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint taxonomy_aliases_label_check check (
    char_length(btrim(alias_label)) > 0
    and char_length(alias_label) <= 120
  ),
  constraint taxonomy_aliases_normalized_not_empty_check check (
    char_length(alias_normalized) > 0
  ),
  constraint taxonomy_aliases_locale_check check (
    locale = lower(btrim(locale))
    and char_length(locale) between 2 and 16
    and locale ~ '^[a-z]{2}(-[a-z]{2})?$'
  ),
  constraint taxonomy_aliases_foundation_fk
    foreign key (foundation_id)
    references public.taxonomy_foundations (id)
    on delete restrict,
  constraint taxonomy_aliases_industry_fk
    foreign key (industry_id)
    references public.taxonomy_industries (id)
    on delete restrict,
  constraint taxonomy_aliases_niche_fk
    foreign key (niche_id)
    references public.taxonomy_niches (id)
    on delete restrict,
  constraint taxonomy_aliases_specialization_fk
    foreign key (specialization_id)
    references public.taxonomy_specializations (id)
    on delete restrict,
  constraint taxonomy_aliases_deep_specialization_fk
    foreign key (deep_specialization_id)
    references public.taxonomy_deep_specializations (id)
    on delete restrict,
  constraint taxonomy_aliases_exactly_one_target_check check (
    (
      (foundation_id is not null)::integer
      + (industry_id is not null)::integer
      + (niche_id is not null)::integer
      + (specialization_id is not null)::integer
      + (deep_specialization_id is not null)::integer
    ) = 1
  )
);

comment on table public.taxonomy_aliases is
  'Non-canonical lookup terms. Not a taxonomy node. No lifecycle, visibility, readiness, or Context Pack. Ambiguous aliases may map to multiple targets as separate rows. TAX-1 v1 is migration-managed.';
comment on column public.taxonomy_aliases.alias_normalized is
  'STORED generated as lower(btrim(alias_label)). Findability only; not identity.';
comment on column public.taxonomy_aliases.locale is
  'Lookup locale metadata (BCP-47-like). Not CTX terminology.';

create trigger taxonomy_aliases_set_updated_at
  before update on public.taxonomy_aliases
  for each row
  execute function public.set_updated_at();

create index taxonomy_aliases_locale_normalized_idx
  on public.taxonomy_aliases (locale, alias_normalized);

create unique index taxonomy_aliases_foundation_mapping_uidx
  on public.taxonomy_aliases (locale, alias_normalized, foundation_id)
  where foundation_id is not null;

create unique index taxonomy_aliases_industry_mapping_uidx
  on public.taxonomy_aliases (locale, alias_normalized, industry_id)
  where industry_id is not null;

create unique index taxonomy_aliases_niche_mapping_uidx
  on public.taxonomy_aliases (locale, alias_normalized, niche_id)
  where niche_id is not null;

create unique index taxonomy_aliases_specialization_mapping_uidx
  on public.taxonomy_aliases (locale, alias_normalized, specialization_id)
  where specialization_id is not null;

create unique index taxonomy_aliases_deep_specialization_mapping_uidx
  on public.taxonomy_aliases (locale, alias_normalized, deep_specialization_id)
  where deep_specialization_id is not null;

-- ---------------------------------------------------------------------------
-- RLS deny-by-default + revoke runtime/service grants
-- ---------------------------------------------------------------------------

alter table public.taxonomy_releases enable row level security;
alter table public.taxonomy_foundations enable row level security;
alter table public.taxonomy_industries enable row level security;
alter table public.taxonomy_niches enable row level security;
alter table public.taxonomy_specializations enable row level security;
alter table public.taxonomy_deep_specializations enable row level security;
alter table public.taxonomy_aliases enable row level security;

revoke all on table public.taxonomy_releases from public;
revoke all on table public.taxonomy_releases from anon;
revoke all on table public.taxonomy_releases from authenticated;
revoke all on table public.taxonomy_releases from service_role;

revoke all on table public.taxonomy_foundations from public;
revoke all on table public.taxonomy_foundations from anon;
revoke all on table public.taxonomy_foundations from authenticated;
revoke all on table public.taxonomy_foundations from service_role;

revoke all on table public.taxonomy_industries from public;
revoke all on table public.taxonomy_industries from anon;
revoke all on table public.taxonomy_industries from authenticated;
revoke all on table public.taxonomy_industries from service_role;

revoke all on table public.taxonomy_niches from public;
revoke all on table public.taxonomy_niches from anon;
revoke all on table public.taxonomy_niches from authenticated;
revoke all on table public.taxonomy_niches from service_role;

revoke all on table public.taxonomy_specializations from public;
revoke all on table public.taxonomy_specializations from anon;
revoke all on table public.taxonomy_specializations from authenticated;
revoke all on table public.taxonomy_specializations from service_role;

revoke all on table public.taxonomy_deep_specializations from public;
revoke all on table public.taxonomy_deep_specializations from anon;
revoke all on table public.taxonomy_deep_specializations from authenticated;
revoke all on table public.taxonomy_deep_specializations from service_role;

revoke all on table public.taxonomy_aliases from public;
revoke all on table public.taxonomy_aliases from anon;
revoke all on table public.taxonomy_aliases from authenticated;
revoke all on table public.taxonomy_aliases from service_role;
