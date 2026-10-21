-- ZyntixAI CAP-1B — Canonical Capability Registry (schema + deny-by-default security).
--
-- Global platform ability catalog. Not tenant-owned. Not Organization
-- enablement. Not Context relevance. Not permissions. Not execution gates.
-- Writes v1: platform migration owner only. No policies. No RPCs. No grants
-- to anon/authenticated/service_role (service_role bypasses RLS).
-- Intentionally NOT FORCE ROW LEVEL SECURITY so the migration owner can seed.
--
-- production_verified != execution enabled.
-- catalog_visibility listed != runtime readable.
-- capability != permission.

-- ---------------------------------------------------------------------------
-- capabilities
-- ---------------------------------------------------------------------------

create table public.capabilities (
  id uuid primary key default gen_random_uuid(),
  capability_key text not null,
  label text not null,
  description text not null,
  owner_class text not null,
  owner_key text not null,
  foundation_id uuid,
  lifecycle_status text not null,
  catalog_visibility text not null,
  superseded_by_capability_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint capabilities_key_unique unique (capability_key),
  constraint capabilities_key_format_check check (
    capability_key ~ '^[a-z][a-z0-9]*(-[a-z0-9]+)*(\.[a-z][a-z0-9]*(-[a-z0-9]+)*)+$'
    and char_length(capability_key) between 3 and 160
  ),
  constraint capabilities_label_check check (
    char_length(btrim(label)) > 0
    and char_length(label) <= 200
  ),
  constraint capabilities_description_check check (
    char_length(btrim(description)) > 0
    and char_length(description) <= 1000
  ),
  constraint capabilities_owner_class_check check (
    owner_class in ('core', 'shared', 'foundation', 'horizontal')
  ),
  constraint capabilities_owner_key_check check (
    owner_key ~ '^[a-z][a-z0-9]*(-[a-z0-9]+)*$'
    and char_length(owner_key) between 1 and 80
  ),
  constraint capabilities_owner_foundation_consistency_check check (
    (
      owner_class = 'foundation'
      and foundation_id is not null
    )
    or (
      owner_class <> 'foundation'
      and foundation_id is null
    )
  ),
  constraint capabilities_foundation_fk
    foreign key (foundation_id)
    references public.taxonomy_foundations (id)
    on delete restrict,
  constraint capabilities_lifecycle_status_check check (
    lifecycle_status in ('draft', 'active', 'deprecated', 'superseded')
  ),
  constraint capabilities_catalog_visibility_check check (
    catalog_visibility in ('internal', 'listed')
  ),
  constraint capabilities_superseded_by_fk
    foreign key (superseded_by_capability_id)
    references public.capabilities (id)
    on delete restrict,
  constraint capabilities_supersession_check check (
    (
      lifecycle_status = 'superseded'
      and superseded_by_capability_id is not null
      and superseded_by_capability_id <> id
    )
    or (
      lifecycle_status <> 'superseded'
      and superseded_by_capability_id is null
    )
  )
);

comment on table public.capabilities is
  'Global platform ability catalog. Not tenant-owned. Not permission. Not entitlement. CAP-1 v1 is migration-managed.';
comment on column public.capabilities.capability_key is
  'Immutable dotted machine identity. Label is not identity. Namespace does not auto-change with module moves.';
comment on column public.capabilities.label is
  'Mutable English governance label. Not identity.';
comment on column public.capabilities.description is
  'Mutable canonical description of the ability. Not a runtime contract.';
comment on column public.capabilities.owner_class is
  'core|shared|foundation|horizontal. Not a Foundation unless owner_class=foundation.';
comment on column public.capabilities.owner_key is
  'Governance owner identifier (e.g. platform, crm, knowledge, social). Not a permission.';
comment on column public.capabilities.foundation_id is
  'TAX-1 Foundation FK only when owner_class=foundation. ON DELETE RESTRICT. Null otherwise.';
comment on column public.capabilities.lifecycle_status is
  'draft|active|deprecated|superseded. active != enabled, entitled, relevant, or production_verified.';
comment on column public.capabilities.catalog_visibility is
  'internal|listed. listed != client/public runtime access.';
comment on column public.capabilities.superseded_by_capability_id is
  'Same-table successor when superseded. Null otherwise. No self-supersession.';

create trigger capabilities_set_updated_at
  before update on public.capabilities
  for each row
  execute function public.set_updated_at();

create index capabilities_owner_idx
  on public.capabilities (owner_class, owner_key);

create index capabilities_lifecycle_visibility_idx
  on public.capabilities (lifecycle_status, catalog_visibility);

create index capabilities_foundation_id_idx
  on public.capabilities (foundation_id)
  where foundation_id is not null;

-- ---------------------------------------------------------------------------
-- capability_dependencies (hard semantic requires only)
-- ---------------------------------------------------------------------------

create table public.capability_dependencies (
  capability_id uuid not null,
  depends_on_capability_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint capability_dependencies_pkey
    primary key (capability_id, depends_on_capability_id),
  constraint capability_dependencies_capability_fk
    foreign key (capability_id)
    references public.capabilities (id)
    on delete restrict,
  constraint capability_dependencies_depends_on_fk
    foreign key (depends_on_capability_id)
    references public.capabilities (id)
    on delete restrict,
  constraint capability_dependencies_no_self_edge_check check (
    capability_id <> depends_on_capability_id
  )
);

comment on table public.capability_dependencies is
  'Hard semantic requires edges only. Context relevance is out of scope. Not runtime prerequisites.';
comment on column public.capability_dependencies.capability_id is
  'Dependent capability. Cannot semantically function without depends_on_capability_id.';
comment on column public.capability_dependencies.depends_on_capability_id is
  'Required capability. Directed DAG edge. No self-edge.';

create trigger capability_dependencies_set_updated_at
  before update on public.capability_dependencies
  for each row
  execute function public.set_updated_at();

create index capability_dependencies_depends_on_idx
  on public.capability_dependencies (depends_on_capability_id);

-- ---------------------------------------------------------------------------
-- capability_readiness (global scoped evidence, not Organization enablement)
-- ---------------------------------------------------------------------------

create table public.capability_readiness (
  id uuid primary key default gen_random_uuid(),
  capability_id uuid not null,
  readiness_status text not null,
  supported_scope jsonb not null,
  evidence_phase text,
  verified_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint capability_readiness_capability_unique unique (capability_id),
  constraint capability_readiness_capability_fk
    foreign key (capability_id)
    references public.capabilities (id)
    on delete restrict,
  constraint capability_readiness_status_check check (
    readiness_status in (
      'planned',
      'context_ready',
      'foundation_ready',
      'beta_supported',
      'production_verified'
    )
  ),
  constraint capability_readiness_scope_object_check check (
    jsonb_typeof(supported_scope) = 'object'
  ),
  constraint capability_readiness_scope_nonempty_unless_planned_check check (
    readiness_status = 'planned'
    or supported_scope <> '{}'::jsonb
  ),
  constraint capability_readiness_evidence_integrity_check check (
    (
      readiness_status in ('beta_supported', 'production_verified')
      and evidence_phase is not null
      and char_length(btrim(evidence_phase)) > 0
      and char_length(evidence_phase) <= 80
      and verified_at is not null
      and supported_scope <> '{}'::jsonb
    )
    or (
      readiness_status in ('planned', 'context_ready', 'foundation_ready')
      and verified_at is null
    )
  )
);

comment on table public.capability_readiness is
  'Global scoped readiness evidence. Not Organization enablement. production_verified != execution enabled.';
comment on column public.capability_readiness.readiness_status is
  'planned|context_ready|foundation_ready|beta_supported|production_verified. Not lifecycle, visibility, entitlement, or a feature gate.';
comment on column public.capability_readiness.supported_scope is
  'JSON object evidence metadata. Not a policy language. Non-empty unless planned.';
comment on column public.capability_readiness.evidence_phase is
  'Governing evidence phase id (e.g. BETA1-FV, SMM-B1-FV). Required when production_verified or beta_supported.';
comment on column public.capability_readiness.verified_at is
  'Evidence-derived timestamp. Not migration now(). Required when production_verified or beta_supported. Null for lower states.';

create trigger capability_readiness_set_updated_at
  before update on public.capability_readiness
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS deny-by-default + revoke runtime/service grants
-- ---------------------------------------------------------------------------

alter table public.capabilities enable row level security;
alter table public.capability_dependencies enable row level security;
alter table public.capability_readiness enable row level security;

revoke all on table public.capabilities from public;
revoke all on table public.capabilities from anon;
revoke all on table public.capabilities from authenticated;
revoke all on table public.capabilities from service_role;

revoke all on table public.capability_dependencies from public;
revoke all on table public.capability_dependencies from anon;
revoke all on table public.capability_dependencies from authenticated;
revoke all on table public.capability_dependencies from service_role;

revoke all on table public.capability_readiness from public;
revoke all on table public.capability_readiness from anon;
revoke all on table public.capability_readiness from authenticated;
revoke all on table public.capability_readiness from service_role;
