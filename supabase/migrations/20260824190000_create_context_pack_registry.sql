-- ZyntixAI CTX-1B — Canonical Context Pack Registry (schema + deny-by-default security).
--
-- Global platform Context catalog. Not tenant-owned. Not Organization assignment.
-- Not permissions. Not entitlement. Not execution gates. Not canonical TAX/CAP truth.
-- CONTEXT CONTROLS RELEVANCE. PERMISSIONS CONTROL AUTHORITY.
-- Writes v1: platform migration owner only. No policies. No RPCs. No grants
-- to anon/authenticated/service_role (service_role bypasses RLS).
-- Intentionally NOT FORCE ROW LEVEL SECURITY so the migration owner can seed.
--
-- published != production_verified.
-- context_ready != production_verified.
-- listed/active taxonomy != Context assignment.
-- Internal integrity triggers are not a runtime Context surface.

-- ---------------------------------------------------------------------------
-- Integrity: pack identity freeze (pack_key / kind / TAX target)
-- ---------------------------------------------------------------------------

create or replace function public.context_packs_protect_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.pack_key is distinct from new.pack_key
    or old.pack_kind is distinct from new.pack_kind
    or old.foundation_id is distinct from new.foundation_id
    or old.industry_id is distinct from new.industry_id
    or old.niche_id is distinct from new.niche_id
    or old.specialization_id is distinct from new.specialization_id
    or old.deep_specialization_id is distinct from new.deep_specialization_id
  then
    raise exception
      'CTX: context_packs identity (pack_key, pack_kind, taxonomy target) is immutable';
  end if;
  return new;
end;
$$;

comment on function public.context_packs_protect_identity() is
  'Internal integrity trigger only. Not a Context RPC. Frozen pack identity.';

revoke all on function public.context_packs_protect_identity() from public;
revoke all on function public.context_packs_protect_identity() from anon;
revoke all on function public.context_packs_protect_identity() from authenticated;
revoke all on function public.context_packs_protect_identity() from service_role;

-- ---------------------------------------------------------------------------
-- Integrity: version kind/completeness, parent publication, published immutability
-- ---------------------------------------------------------------------------

create or replace function public.context_pack_versions_enforce_integrity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_pack_kind text;
  v_parent_status text;
begin
  select p.pack_kind
    into v_pack_kind
  from public.context_packs as p
  where p.id = new.pack_id;

  if v_pack_kind is null then
    raise exception 'CTX: context_packs row not found for pack_id';
  end if;

  if v_pack_kind in ('foundation', 'niche') and new.completeness <> 'full' then
    raise exception
      'CTX: pack_kind foundation or niche requires completeness full';
  end if;

  if v_pack_kind in ('industry', 'specialization', 'deep_specialization')
    and new.completeness <> 'delta'
  then
    raise exception
      'CTX: pack_kind industry/specialization/deep_specialization requires completeness delta';
  end if;

  if new.parent_version_id is not null then
    if new.parent_version_id = new.id then
      raise exception 'CTX: context_pack_versions cannot parent itself';
    end if;

    select v.publication_status
      into v_parent_status
    from public.context_pack_versions as v
    where v.id = new.parent_version_id;

    if v_parent_status is null then
      raise exception 'CTX: parent_version_id not found';
    end if;

    if v_parent_status not in ('published', 'superseded') then
      raise exception
        'CTX: parent version must be published or superseded';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    if old.publication_status in ('published', 'superseded') then
      -- Allowed lifecycle transition: published → superseded only.
      -- published → draft forbidden. superseded → published forbidden.
      -- superseded → draft forbidden. Semantic fields stay frozen.
      if old.publication_status = 'published'
        and new.publication_status = 'superseded'
        and old.id = new.id
        and old.pack_id = new.pack_id
        and old.version_number = new.version_number
        and old.completeness = new.completeness
        and old.parent_version_id is not distinct from new.parent_version_id
        and old.change_impact = new.change_impact
        and old.impact_note is not distinct from new.impact_note
        and old.definition_summary = new.definition_summary
        and old.intended_operator is not distinct from new.intended_operator
        and old.primary_exchange is not distinct from new.primary_exchange
        and old.created_at = new.created_at
      then
        return new;
      end if;

      raise exception
        'CTX: published or superseded context_pack_versions row is immutable';
    end if;

    if old.publication_status = 'draft'
      and new.publication_status = 'superseded'
    then
      raise exception 'CTX: draft cannot transition to superseded';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.context_pack_versions_enforce_integrity() is
  'Internal integrity trigger only. Not a Context RPC. Published/superseded versions are semantically immutable except published → superseded.';

revoke all on function public.context_pack_versions_enforce_integrity() from public;
revoke all on function public.context_pack_versions_enforce_integrity() from anon;
revoke all on function public.context_pack_versions_enforce_integrity() from authenticated;
revoke all on function public.context_pack_versions_enforce_integrity() from service_role;

-- ---------------------------------------------------------------------------
-- Integrity: published/superseded child semantics (mappings + terminology)
-- ---------------------------------------------------------------------------

create or replace function public.context_pack_version_protect_children()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_status text;
  v_old_status text;
  v_completeness text;
begin
  if tg_op = 'DELETE' then
    select v.publication_status
      into v_old_status
    from public.context_pack_versions as v
    where v.id = old.version_id;

    if v_old_status in ('published', 'superseded') then
      raise exception
        'CTX: cannot mutate semantic children of a published or superseded context version';
    end if;

    return old;
  end if;

  select v.publication_status, v.completeness
    into v_new_status, v_completeness
  from public.context_pack_versions as v
  where v.id = new.version_id;

  if v_new_status in ('published', 'superseded') then
    raise exception
      'CTX: cannot mutate semantic children of a published or superseded context version';
  end if;

  if tg_op = 'UPDATE' and old.version_id is distinct from new.version_id then
    select v.publication_status
      into v_old_status
    from public.context_pack_versions as v
    where v.id = old.version_id;

    if v_old_status in ('published', 'superseded') then
      raise exception
        'CTX: cannot mutate semantic children of a published or superseded context version';
    end if;
  end if;

  if tg_table_name = 'context_capability_mappings'
    and new.mapping_op = 'remove'
    and v_completeness = 'full'
  then
    raise exception 'CTX: FULL versions may only SET capability mappings';
  end if;

  return new;
end;
$$;

comment on function public.context_pack_version_protect_children() is
  'Internal integrity trigger only. Not a Context RPC. Blocks INSERT/UPDATE/DELETE of mappings and terminology for published/superseded versions. Draft child rows remain writable by the migration owner. Does not protect context_pack_readiness.';

revoke all on function public.context_pack_version_protect_children() from public;
revoke all on function public.context_pack_version_protect_children() from anon;
revoke all on function public.context_pack_version_protect_children() from authenticated;
revoke all on function public.context_pack_version_protect_children() from service_role;

-- ---------------------------------------------------------------------------
-- context_packs
-- ---------------------------------------------------------------------------

create table public.context_packs (
  id uuid primary key default gen_random_uuid(),
  pack_key text not null,
  label text not null,
  pack_kind text not null,
  default_locale text not null default 'en',
  lifecycle_status text not null,
  foundation_id uuid,
  industry_id uuid,
  niche_id uuid,
  specialization_id uuid,
  deep_specialization_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint context_packs_key_unique unique (pack_key),
  constraint context_packs_key_format_check check (
    pack_key ~ '^[a-z][a-z0-9_]*(\.[a-z0-9]+(-[a-z0-9]+)*)+$'
    and char_length(pack_key) between 3 and 160
  ),
  constraint context_packs_label_check check (
    char_length(btrim(label)) > 0
    and char_length(label) <= 200
  ),
  constraint context_packs_kind_check check (
    pack_kind in (
      'foundation',
      'industry',
      'niche',
      'specialization',
      'deep_specialization'
    )
  ),
  constraint context_packs_default_locale_check check (
    char_length(btrim(default_locale)) between 2 and 35
  ),
  constraint context_packs_lifecycle_status_check check (
    lifecycle_status in ('draft', 'active', 'superseded')
  ),
  constraint context_packs_foundation_fk
    foreign key (foundation_id)
    references public.taxonomy_foundations (id)
    on delete restrict,
  constraint context_packs_industry_fk
    foreign key (industry_id)
    references public.taxonomy_industries (id)
    on delete restrict,
  constraint context_packs_niche_fk
    foreign key (niche_id)
    references public.taxonomy_niches (id)
    on delete restrict,
  constraint context_packs_specialization_fk
    foreign key (specialization_id)
    references public.taxonomy_specializations (id)
    on delete restrict,
  constraint context_packs_deep_specialization_fk
    foreign key (deep_specialization_id)
    references public.taxonomy_deep_specializations (id)
    on delete restrict,
  constraint context_packs_exactly_one_target_check check (
    (
      (foundation_id is not null)::integer
      + (industry_id is not null)::integer
      + (niche_id is not null)::integer
      + (specialization_id is not null)::integer
      + (deep_specialization_id is not null)::integer
    ) = 1
  ),
  constraint context_packs_kind_target_check check (
    (
      pack_kind = 'foundation'
      and foundation_id is not null
    )
    or (
      pack_kind = 'industry'
      and industry_id is not null
    )
    or (
      pack_kind = 'niche'
      and niche_id is not null
    )
    or (
      pack_kind = 'specialization'
      and specialization_id is not null
    )
    or (
      pack_kind = 'deep_specialization'
      and deep_specialization_id is not null
    )
  )
);

comment on table public.context_packs is
  'Global Context Pack identity. Not tenant-owned. Not Organization assignment. Not permissions. CTX-1B v1 is migration-managed.';
comment on column public.context_packs.pack_key is
  'Immutable machine identity. Label is not identity. Does not encode TAX parent path.';
comment on column public.context_packs.label is
  'Mutable English governance label. Not identity.';
comment on column public.context_packs.pack_kind is
  'foundation|industry|niche|specialization|deep_specialization. Must match the single TAX target FK.';
comment on column public.context_packs.default_locale is
  'BCP-47-compatible default locale. Machine keys stay locale-independent.';
comment on column public.context_packs.lifecycle_status is
  'draft|active|superseded. Pack identity lifecycle. Not Context readiness. Not publication.';
comment on column public.context_packs.foundation_id is
  'TAX-1 Foundation FK when pack_kind=foundation. ON DELETE RESTRICT.';
comment on column public.context_packs.industry_id is
  'TAX-1 Industry FK when pack_kind=industry. ON DELETE RESTRICT.';
comment on column public.context_packs.niche_id is
  'TAX-1 Niche FK when pack_kind=niche. ON DELETE RESTRICT.';
comment on column public.context_packs.specialization_id is
  'TAX-1 Specialization FK when pack_kind=specialization. ON DELETE RESTRICT.';
comment on column public.context_packs.deep_specialization_id is
  'TAX-1 Deep Specialization FK when pack_kind=deep_specialization. ON DELETE RESTRICT.';

create trigger context_packs_protect_identity
  before update on public.context_packs
  for each row
  execute function public.context_packs_protect_identity();

create trigger context_packs_set_updated_at
  before update on public.context_packs
  for each row
  execute function public.set_updated_at();

create unique index context_packs_foundation_id_uidx
  on public.context_packs (foundation_id)
  where foundation_id is not null;

create unique index context_packs_industry_id_uidx
  on public.context_packs (industry_id)
  where industry_id is not null;

create unique index context_packs_niche_id_uidx
  on public.context_packs (niche_id)
  where niche_id is not null;

create unique index context_packs_specialization_id_uidx
  on public.context_packs (specialization_id)
  where specialization_id is not null;

create unique index context_packs_deep_specialization_id_uidx
  on public.context_packs (deep_specialization_id)
  where deep_specialization_id is not null;

-- ---------------------------------------------------------------------------
-- context_pack_versions
-- No updated_at / set_updated_at: published rows must not be rewritten.
-- Allowed UPDATE after publish: publication_status published → superseded only.
-- ---------------------------------------------------------------------------

create table public.context_pack_versions (
  id uuid primary key default gen_random_uuid(),
  pack_id uuid not null,
  version_number integer not null,
  publication_status text not null,
  completeness text not null,
  parent_version_id uuid,
  change_impact text not null,
  impact_note text,
  definition_summary text not null,
  intended_operator text,
  primary_exchange text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint context_pack_versions_pack_version_unique unique (pack_id, version_number),
  constraint context_pack_versions_pack_fk
    foreign key (pack_id)
    references public.context_packs (id)
    on delete restrict,
  constraint context_pack_versions_parent_fk
    foreign key (parent_version_id)
    references public.context_pack_versions (id)
    on delete restrict,
  constraint context_pack_versions_version_number_check check (
    version_number > 0
  ),
  constraint context_pack_versions_publication_status_check check (
    publication_status in ('draft', 'published', 'superseded')
  ),
  constraint context_pack_versions_completeness_check check (
    completeness in ('full', 'delta')
  ),
  constraint context_pack_versions_change_impact_check check (
    change_impact in ('low', 'medium', 'high')
  ),
  constraint context_pack_versions_no_self_parent_check check (
    parent_version_id is null
    or parent_version_id <> id
  ),
  constraint context_pack_versions_impact_note_check check (
    impact_note is null
    or (
      char_length(btrim(impact_note)) > 0
      and char_length(impact_note) <= 1000
    )
  ),
  constraint context_pack_versions_definition_summary_check check (
    char_length(btrim(definition_summary)) > 0
    and char_length(definition_summary) <= 2000
  ),
  constraint context_pack_versions_intended_operator_check check (
    intended_operator is null
    or (
      char_length(btrim(intended_operator)) > 0
      and char_length(intended_operator) <= 400
    )
  ),
  constraint context_pack_versions_primary_exchange_check check (
    primary_exchange is null
    or (
      char_length(btrim(primary_exchange)) > 0
      and char_length(primary_exchange) <= 400
    )
  )
);

comment on table public.context_pack_versions is
  'Immutable published Context snapshots. Pack identity is separate. publication_status is not Context readiness.';
comment on column public.context_pack_versions.version_number is
  'Positive integer unique per pack. Not a TAX release key.';
comment on column public.context_pack_versions.publication_status is
  'draft|published|superseded. published != production_verified. Semantic fields freeze at published.';
comment on column public.context_pack_versions.completeness is
  'full|delta. FULL means the resolved Context at this layer is complete, not that inherited rows are duplicated. foundation/niche require full; industry/specialization/deep_specialization require delta.';
comment on column public.context_pack_versions.parent_version_id is
  'Nearest available governed ancestor Context version. Must be published or superseded. Null for Foundation v1.';
comment on column public.context_pack_versions.change_impact is
  'low|medium|high. Classification only. Not an approval workflow.';
comment on column public.context_pack_versions.definition_summary is
  'Versioned business definition. Not a workflow engine. Not an AI prompt blob.';
comment on column public.context_pack_versions.created_at is
  'Insert timestamp. No updated_at: published semantic rows are not rewritten.';

create trigger context_pack_versions_enforce_integrity
  before insert or update on public.context_pack_versions
  for each row
  execute function public.context_pack_versions_enforce_integrity();

create index context_pack_versions_parent_version_id_idx
  on public.context_pack_versions (parent_version_id)
  where parent_version_id is not null;

-- ---------------------------------------------------------------------------
-- context_capability_mappings
-- ---------------------------------------------------------------------------

create table public.context_capability_mappings (
  version_id uuid not null,
  capability_id uuid not null,
  mapping_op text not null,
  relevance text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint context_capability_mappings_pkey
    primary key (version_id, capability_id),
  constraint context_capability_mappings_version_fk
    foreign key (version_id)
    references public.context_pack_versions (id)
    on delete restrict,
  constraint context_capability_mappings_capability_fk
    foreign key (capability_id)
    references public.capabilities (id)
    on delete restrict,
  constraint context_capability_mappings_op_check check (
    mapping_op in ('set', 'remove')
  ),
  constraint context_capability_mappings_op_relevance_check check (
    (
      mapping_op = 'set'
      and relevance in ('required', 'recommended', 'optional')
    )
    or (
      mapping_op = 'remove'
      and relevance is null
    )
  )
);

comment on table public.context_capability_mappings is
  'Per-version Context relevance to CAP-1. Not a copy of capability_dependencies. Not entitlement. Not a feature gate.';
comment on column public.context_capability_mappings.mapping_op is
  'set|remove. SET writes relevance. REMOVE has relevance NULL and may only suppress inherited optional/recommended. Absent row = inherit.';
comment on column public.context_capability_mappings.relevance is
  'required|recommended|optional when mapping_op=set. NULL when mapping_op=remove. Not a CAP requires edge.';

create trigger context_capability_mappings_protect_children
  before insert or update or delete on public.context_capability_mappings
  for each row
  execute function public.context_pack_version_protect_children();

create index context_capability_mappings_capability_id_idx
  on public.context_capability_mappings (capability_id);

-- ---------------------------------------------------------------------------
-- context_terminology
-- ---------------------------------------------------------------------------

create table public.context_terminology (
  version_id uuid not null,
  locale text not null,
  term_key text not null,
  singular_label text not null,
  plural_label text not null,
  short_label text,
  help_text text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint context_terminology_version_locale_key_unique
    unique (version_id, locale, term_key),
  constraint context_terminology_version_fk
    foreign key (version_id)
    references public.context_pack_versions (id)
    on delete restrict,
  constraint context_terminology_locale_check check (
    char_length(btrim(locale)) between 2 and 35
  ),
  constraint context_terminology_term_key_check check (
    term_key ~ '^[a-z][a-z0-9_]*$'
    and char_length(term_key) between 1 and 80
  ),
  constraint context_terminology_singular_label_check check (
    char_length(btrim(singular_label)) > 0
    and char_length(singular_label) <= 200
  ),
  constraint context_terminology_plural_label_check check (
    char_length(btrim(plural_label)) > 0
    and char_length(plural_label) <= 200
  ),
  constraint context_terminology_short_label_check check (
    short_label is null
    or (
      char_length(btrim(short_label)) > 0
      and char_length(short_label) <= 80
    )
  ),
  constraint context_terminology_help_text_check check (
    help_text is null
    or (
      char_length(btrim(help_text)) > 0
      and char_length(help_text) <= 1000
    )
  )
);

comment on table public.context_terminology is
  'Versioned professional labels for governed term_key values. Does not change canonical entity identity. Not TAX aliases.';
comment on column public.context_terminology.term_key is
  'Locale-independent semantic key. Label is presentation. Not a capability_key.';
comment on column public.context_terminology.locale is
  'BCP-47-compatible locale. v1 seed uses en.';

create trigger context_terminology_protect_children
  before insert or update or delete on public.context_terminology
  for each row
  execute function public.context_pack_version_protect_children();

-- ---------------------------------------------------------------------------
-- context_pack_readiness
-- Evidence about a version. MAY advance later. Not covered by child immutability.
-- ---------------------------------------------------------------------------

create table public.context_pack_readiness (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null,
  readiness_status text not null,
  supported_scope jsonb not null,
  evidence_phase text,
  verified_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint context_pack_readiness_version_unique unique (version_id),
  constraint context_pack_readiness_version_fk
    foreign key (version_id)
    references public.context_pack_versions (id)
    on delete restrict,
  constraint context_pack_readiness_status_check check (
    readiness_status in (
      'planned',
      'context_ready',
      'beta_supported',
      'production_verified'
    )
  ),
  constraint context_pack_readiness_scope_object_check check (
    jsonb_typeof(supported_scope) = 'object'
  ),
  constraint context_pack_readiness_scope_nonempty_unless_planned_check check (
    readiness_status = 'planned'
    or supported_scope <> '{}'::jsonb
  ),
  constraint context_pack_readiness_evidence_integrity_check check (
    (
      readiness_status in ('beta_supported', 'production_verified')
      and evidence_phase is not null
      and char_length(btrim(evidence_phase)) > 0
      and char_length(evidence_phase) <= 80
      and verified_at is not null
      and supported_scope <> '{}'::jsonb
    )
    or (
      readiness_status in ('planned', 'context_ready')
      and verified_at is null
      and (
        evidence_phase is null
        or (
          char_length(btrim(evidence_phase)) > 0
          and char_length(evidence_phase) <= 80
        )
      )
    )
  )
);

comment on table public.context_pack_readiness is
  'Context Pack version readiness evidence. Not publication. Not CAP readiness. context_ready != production_verified.';
comment on column public.context_pack_readiness.readiness_status is
  'planned|context_ready|beta_supported|production_verified. published != production_verified.';
comment on column public.context_pack_readiness.supported_scope is
  'JSON object journey evidence. Not a copy of capability_readiness.supported_scope. Not a policy language.';
comment on column public.context_pack_readiness.evidence_phase is
  'Implementation provenance. Allowed on context_ready. Required when beta_supported or production_verified.';
comment on column public.context_pack_readiness.verified_at is
  'Evidence-derived timestamp. Not migration now(). Null for planned and context_ready.';

create trigger context_pack_readiness_set_updated_at
  before update on public.context_pack_readiness
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS deny-by-default + revoke runtime/service grants
-- ---------------------------------------------------------------------------

alter table public.context_packs enable row level security;
alter table public.context_pack_versions enable row level security;
alter table public.context_capability_mappings enable row level security;
alter table public.context_terminology enable row level security;
alter table public.context_pack_readiness enable row level security;

revoke all on table public.context_packs from public;
revoke all on table public.context_packs from anon;
revoke all on table public.context_packs from authenticated;
revoke all on table public.context_packs from service_role;

revoke all on table public.context_pack_versions from public;
revoke all on table public.context_pack_versions from anon;
revoke all on table public.context_pack_versions from authenticated;
revoke all on table public.context_pack_versions from service_role;

revoke all on table public.context_capability_mappings from public;
revoke all on table public.context_capability_mappings from anon;
revoke all on table public.context_capability_mappings from authenticated;
revoke all on table public.context_capability_mappings from service_role;

revoke all on table public.context_terminology from public;
revoke all on table public.context_terminology from anon;
revoke all on table public.context_terminology from authenticated;
revoke all on table public.context_terminology from service_role;

revoke all on table public.context_pack_readiness from public;
revoke all on table public.context_pack_readiness from anon;
revoke all on table public.context_pack_readiness from authenticated;
revoke all on table public.context_pack_readiness from service_role;
