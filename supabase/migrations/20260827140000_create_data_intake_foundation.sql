-- ZyntixAI DATA-1C — Universal business data intake database foundation.
--
-- Additive tenant schema only. No Production apply. No parser. No import.
-- Does not alter customers, the Customer writer, BQA, ORG-CONTEXT,
-- invitations, Social, billing, or entitlement tables.

create or replace function private.data_intake_session_status_transition_allowed(
  p_from text,
  p_to text
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_from is not distinct from p_to then false
    when p_from = 'created' and p_to in ('source_ready', 'cancelled') then true
    when p_from = 'source_ready' and p_to in ('parsed', 'failed', 'cancelled') then true
    when p_from = 'parsed' and p_to in ('mapping_required', 'cancelled') then true
    when p_from = 'mapping_required' and p_to in ('mapped', 'cancelled') then true
    when p_from = 'mapped' and p_to in ('validating', 'mapping_required', 'cancelled') then true
    when p_from = 'validating' and p_to in ('review_required', 'ready_for_approval', 'failed', 'cancelled') then true
    when p_from = 'review_required' and p_to in ('validating', 'mapped', 'cancelled') then true
    when p_from = 'ready_for_approval' and p_to in ('approved', 'review_required', 'mapped', 'cancelled') then true
    when p_from = 'approved' and p_to in ('importing', 'mapped', 'cancelled') then true
    when p_from = 'importing' and p_to in ('completed', 'completed_with_errors', 'failed', 'cancelled') then true
    when p_from = 'failed' and p_to in ('importing', 'mapped', 'cancelled') then true
    else false
  end;
$$;

comment on function private.data_intake_session_status_transition_allowed(text, text) is
  'DATA-1C: frozen DATA-1B session status graph. Not a public RPC. Same-status is not a transition.';

revoke all on function private.data_intake_session_status_transition_allowed(text, text) from public;
revoke all on function private.data_intake_session_status_transition_allowed(text, text) from anon;
revoke all on function private.data_intake_session_status_transition_allowed(text, text) from authenticated;
revoke all on function private.data_intake_session_status_transition_allowed(text, text) from service_role;

create or replace function private.guard_data_intake_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'data intake events are immutable'
    using errcode = 'P0001';
end;
$$;

comment on function private.guard_data_intake_event_immutable() is
  'DATA-1C: append-only protection for data_intake_events. Not a public RPC.';

revoke all on function private.guard_data_intake_event_immutable() from public;
revoke all on function private.guard_data_intake_event_immutable() from anon;
revoke all on function private.guard_data_intake_event_immutable() from authenticated;
revoke all on function private.guard_data_intake_event_immutable() from service_role;

create or replace function private.enforce_data_intake_session_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan_session uuid;
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.organization_id is distinct from new.organization_id
      or old.target_domain is distinct from new.target_domain
      or old.source_kind is distinct from new.source_kind
      or old.created_by_user_id is distinct from new.created_by_user_id
    then
      raise exception 'DATA: session identity is immutable'
        using errcode = 'P0001';
    end if;

    if old.status is distinct from new.status then
      if not private.data_intake_session_status_transition_allowed(old.status, new.status) then
        raise exception 'DATA: session status transition is not allowed'
          using errcode = 'P0001';
      end if;
    end if;
  end if;

  if new.target_domain = 'customer' and new.business_activity_id is not null then
    raise exception 'ACTIVITY_NOT_ALLOWED_FOR_TARGET'
      using errcode = 'P0001';
  end if;

  if new.current_plan_id is not null then
    select p.session_id
      into v_plan_session
    from public.data_import_plans as p
    where p.organization_id = new.organization_id
      and p.id = new.current_plan_id;

    if not found or v_plan_session is distinct from new.id then
      raise exception 'DATA: current_plan_id must belong to this session and organization'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

comment on function private.enforce_data_intake_session_integrity() is
  'DATA-1C: freeze session identity, status graph, Customer Activity NULL, and current_plan tenant match.';

revoke all on function private.enforce_data_intake_session_integrity() from public;
revoke all on function private.enforce_data_intake_session_integrity() from anon;
revoke all on function private.enforce_data_intake_session_integrity() from authenticated;
revoke all on function private.enforce_data_intake_session_integrity() from service_role;

create or replace function private.enforce_data_intake_source_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_kind text;
  v_session_org uuid;
begin
  if tg_op = 'UPDATE' then
    if old.id is distinct from new.id
      or old.organization_id is distinct from new.organization_id
      or old.session_id is distinct from new.session_id
      or old.sha256 is distinct from new.sha256
      or old.storage_bucket is distinct from new.storage_bucket
      or old.storage_path is distinct from new.storage_path
      or old.byte_size is distinct from new.byte_size
      or old.source_kind is distinct from new.source_kind
      or old.original_filename is distinct from new.original_filename
      or old.mime_type is distinct from new.mime_type
    then
      raise exception 'DATA: source artifact identity and content metadata are immutable'
        using errcode = 'P0001';
    end if;
  end if;

  select s.organization_id, s.source_kind
    into v_session_org, v_session_kind
  from public.data_intake_sessions as s
  where s.organization_id = new.organization_id
    and s.id = new.session_id;

  if not found or v_session_org is distinct from new.organization_id then
    raise exception 'DATA: source session tenant mismatch'
      using errcode = 'P0001';
  end if;

  if v_session_kind is distinct from new.source_kind then
    raise exception 'DATA: source_kind must match the session'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function private.enforce_data_intake_source_integrity() is
  'DATA-1C: freeze source hash/path and require same-tenant session + matching source_kind.';

revoke all on function private.enforce_data_intake_source_integrity() from public;
revoke all on function private.enforce_data_intake_source_integrity() from anon;
revoke all on function private.enforce_data_intake_source_integrity() from authenticated;
revoke all on function private.enforce_data_intake_source_integrity() from service_role;

create or replace function private.enforce_data_import_plan_immutability()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if old.organization_id is distinct from new.organization_id
      or old.session_id is distinct from new.session_id
      or old.version is distinct from new.version
      or old.created_by_user_id is distinct from new.created_by_user_id
    then
      raise exception 'DATA: plan identity is immutable'
        using errcode = 'P0001';
    end if;

    if old.status in ('approved', 'executing', 'executed', 'superseded')
      or old.approved_at is not null
    then
      if old.source_id is distinct from new.source_id
        or old.source_sha256 is distinct from new.source_sha256
        or old.target_domain is distinct from new.target_domain
        or old.adapter_version is distinct from new.adapter_version
        or old.business_activity_id is distinct from new.business_activity_id
        or old.mapping_snapshot is distinct from new.mapping_snapshot
        or old.included_fingerprints is distinct from new.included_fingerprints
        or old.plan_hash is distinct from new.plan_hash
        or old.summary is distinct from new.summary
      then
        raise exception 'DATA: approved plan snapshot is immutable'
          using errcode = 'P0001';
      end if;
    end if;
  end if;

  if new.target_domain = 'customer' and new.business_activity_id is not null then
    raise exception 'ACTIVITY_NOT_ALLOWED_FOR_TARGET'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

comment on function private.enforce_data_import_plan_immutability() is
  'DATA-1C: freeze approved/executing/executed/superseded plan snapshots. Status/superseded_at remain mutable.';

revoke all on function private.enforce_data_import_plan_immutability() from public;
revoke all on function private.enforce_data_import_plan_immutability() from anon;
revoke all on function private.enforce_data_import_plan_immutability() from authenticated;
revoke all on function private.enforce_data_import_plan_immutability() from service_role;

create table public.data_intake_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  business_activity_id uuid,
  target_domain text not null,
  source_kind text not null,
  status text not null default 'created',
  locale text,
  timezone text,
  currency text,
  date_order text,
  created_by_user_id uuid not null,
  approved_by_user_id uuid,
  approved_at timestamptz,
  current_plan_id uuid,
  failure_code text,
  cancel_requested boolean not null default false,
  execution_lease_token uuid,
  execution_lease_expires_at timestamptz,
  execution_attempt integer not null default 0,
  current_batch_index integer not null default 0,
  last_completed_batch_index integer,
  heartbeat_at timestamptz,
  execution_started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint data_intake_sessions_org_id_unique unique (organization_id, id),
  constraint data_intake_sessions_organization_fk foreign key (organization_id)
    references public.organizations (id)
    on delete restrict,
  constraint data_intake_sessions_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict,
  constraint data_intake_sessions_target_domain_check check (
    target_domain in ('customer', 'lead', 'task', 'program', 'enrollment')
  ),
  constraint data_intake_sessions_source_kind_check check (
    source_kind in ('csv', 'xlsx')
  ),
  constraint data_intake_sessions_status_check check (
    status in (
      'created',
      'source_ready',
      'parsed',
      'mapping_required',
      'mapped',
      'validating',
      'review_required',
      'ready_for_approval',
      'approved',
      'importing',
      'completed',
      'completed_with_errors',
      'failed',
      'cancelled'
    )
  ),
  constraint data_intake_sessions_customer_activity_null_check check (
    target_domain <> 'customer'
    or business_activity_id is null
  ),
  constraint data_intake_sessions_date_order_check check (
    date_order is null
    or date_order in ('dmy', 'mdy', 'ymd')
  ),
  constraint data_intake_sessions_currency_check check (
    currency is null
    or currency ~ '^[A-Z]{3}$'
  ),
  constraint data_intake_sessions_locale_check check (
    locale is null
    or char_length(btrim(locale)) between 2 and 32
  ),
  constraint data_intake_sessions_execution_attempt_check check (
    execution_attempt >= 0
  ),
  constraint data_intake_sessions_current_batch_check check (
    current_batch_index >= 0
  ),
  constraint data_intake_sessions_last_batch_check check (
    last_completed_batch_index is null
    or last_completed_batch_index >= 0
  )
);

comment on table public.data_intake_sessions is
  'DATA-1C aggregate root for one governed intake attempt. Source data is not canonical.';
comment on column public.data_intake_sessions.business_activity_id is
  'NULL for customer v1. ACTIVITY_NOT_ALLOWED_FOR_TARGET if supplied for customer.';
comment on column public.data_intake_sessions.target_domain is
  'Semantic domain key. Not a SQL table name.';
comment on column public.data_intake_sessions.approved_by_user_id is
  'Real auth user. Never service_role.';

create index data_intake_sessions_organization_created_at_idx
  on public.data_intake_sessions (organization_id, created_at desc);

create index data_intake_sessions_organization_status_idx
  on public.data_intake_sessions (organization_id, status);

create table public.data_intake_sources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  session_id uuid not null,
  source_kind text not null,
  storage_bucket text not null,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  byte_size integer not null,
  sha256 text not null,
  encoding text,
  delimiter text,
  sheet_name text,
  header_row_index integer,
  row_count integer,
  column_count integer,
  parse_metadata jsonb not null default '{}'::jsonb,
  superseded_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  expires_at timestamptz,
  deleted_at timestamptz,
  constraint data_intake_sources_org_id_unique unique (organization_id, id),
  constraint data_intake_sources_session_fk foreign key (organization_id, session_id)
    references public.data_intake_sessions (organization_id, id)
    on delete restrict,
  constraint data_intake_sources_source_kind_check check (
    source_kind in ('csv', 'xlsx')
  ),
  constraint data_intake_sources_sha256_check check (
    sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint data_intake_sources_byte_size_check check (
    byte_size > 0
    and byte_size <= 10485760
  ),
  constraint data_intake_sources_parse_metadata_object_check check (
    jsonb_typeof(parse_metadata) = 'object'
  ),
  constraint data_intake_sources_header_row_check check (
    header_row_index is null
    or header_row_index >= 1
  ),
  constraint data_intake_sources_row_count_check check (
    row_count is null
    or row_count >= 0
  ),
  constraint data_intake_sources_column_count_check check (
    column_count is null
    or column_count >= 0
  ),
  constraint data_intake_sources_storage_path_check check (
    char_length(btrim(storage_path)) > 0
    and position('..' in storage_path) = 0
  )
);

comment on table public.data_intake_sources is
  'One source artifact version per intake session. Replacement inserts a new row.';
comment on column public.data_intake_sources.storage_path is
  'Server-generated {organization_id}/{session_id}/{source_id}/{generated_object_id}. User filename is never path authority.';
comment on column public.data_intake_sources.original_filename is
  'Metadata only. Not filesystem identity.';
comment on column public.data_intake_sources.sha256 is
  'Lowercase hex. Immutable after insert. Not derived from filename.';
comment on column public.data_intake_sources.expires_at is
  'Cleanup eligibility. Null until a later worker stamps it from session terminal timestamps. Not a legal policy.';

create unique index data_intake_sources_one_active_per_session_idx
  on public.data_intake_sources (session_id)
  where superseded_at is null;

create index data_intake_sources_session_id_idx
  on public.data_intake_sources (session_id);

create index data_intake_sources_expires_at_idx
  on public.data_intake_sources (expires_at)
  where deleted_at is null;

create table public.data_intake_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  session_id uuid not null,
  source_id uuid not null,
  source_field_key text not null,
  source_header text not null,
  target_domain text not null,
  target_field text,
  status text not null,
  proposal_source text not null,
  confidence text,
  transform_kind text not null default 'identity',
  transform_config jsonb not null default '{}'::jsonb,
  default_value jsonb,
  confirmed_by_user_id uuid,
  confirmed_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint data_intake_mappings_org_id_unique unique (organization_id, id),
  constraint data_intake_mappings_source_field_unique unique (source_id, source_field_key),
  constraint data_intake_mappings_session_fk foreign key (organization_id, session_id)
    references public.data_intake_sessions (organization_id, id)
    on delete restrict,
  constraint data_intake_mappings_source_fk foreign key (organization_id, source_id)
    references public.data_intake_sources (organization_id, id)
    on delete restrict,
  constraint data_intake_mappings_target_domain_check check (
    target_domain in ('customer', 'lead', 'task', 'program', 'enrollment')
  ),
  constraint data_intake_mappings_status_check check (
    status in ('proposed', 'confirmed', 'rejected', 'unmapped', 'needs_review')
  ),
  constraint data_intake_mappings_proposal_source_check check (
    proposal_source in ('deterministic', 'context', 'ai', 'user', 'template')
  ),
  constraint data_intake_mappings_confidence_check check (
    confidence is null
    or confidence in ('high', 'medium', 'low', 'none')
  ),
  constraint data_intake_mappings_transform_kind_check check (
    transform_kind in (
      'identity',
      'trim',
      'lowercase',
      'uppercase',
      'date_parse',
      'number_parse',
      'currency_parse',
      'boolean_map',
      'enum_map',
      'email_normalize',
      'phone_normalize',
      'concat',
      'split'
    )
  ),
  constraint data_intake_mappings_transform_config_object_check check (
    jsonb_typeof(transform_config) = 'object'
  ),
  constraint data_intake_mappings_source_field_key_check check (
    char_length(btrim(source_field_key)) between 1 and 200
  )
);

comment on table public.data_intake_mappings is
  'Per-source-field mapping metadata. target_field is a semantic adapter key, never a SQL identifier.';
comment on column public.data_intake_mappings.target_field is
  'Code-owned adapter registry key. DATA must not interpolate this into dynamic SQL.';

create table public.data_intake_staging_rows (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  session_id uuid not null,
  source_id uuid not null,
  source_row_number integer not null,
  raw_values jsonb not null,
  normalized_values jsonb,
  row_fingerprint text not null,
  lifecycle text not null default 'pending',
  resolution text not null default 'none',
  error_codes jsonb not null default '[]'::jsonb,
  warning_codes jsonb not null default '[]'::jsonb,
  error_details jsonb not null default '[]'::jsonb,
  target_operation text,
  target_record_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint data_intake_staging_rows_org_id_unique unique (organization_id, id),
  constraint data_intake_staging_rows_source_row_unique unique (source_id, source_row_number),
  constraint data_intake_staging_rows_source_fingerprint_unique unique (source_id, row_fingerprint),
  constraint data_intake_staging_rows_session_fk foreign key (organization_id, session_id)
    references public.data_intake_sessions (organization_id, id)
    on delete restrict,
  constraint data_intake_staging_rows_source_fk foreign key (organization_id, source_id)
    references public.data_intake_sources (organization_id, id)
    on delete restrict,
  constraint data_intake_staging_rows_row_number_check check (
    source_row_number >= 1
  ),
  constraint data_intake_staging_rows_fingerprint_check check (
    row_fingerprint ~ '^[0-9a-f]{64}$'
  ),
  constraint data_intake_staging_rows_raw_object_check check (
    jsonb_typeof(raw_values) = 'object'
  ),
  constraint data_intake_staging_rows_normalized_object_check check (
    normalized_values is null
    or jsonb_typeof(normalized_values) = 'object'
  ),
  constraint data_intake_staging_rows_lifecycle_check check (
    lifecycle in (
      'pending',
      'validated',
      'blocked',
      'ready',
      'imported',
      'failed',
      'ignored'
    )
  ),
  constraint data_intake_staging_rows_resolution_check check (
    resolution in ('none', 'create', 'link', 'skip', 'duplicate', 'conflict')
  ),
  constraint data_intake_staging_rows_error_codes_array_check check (
    jsonb_typeof(error_codes) = 'array'
  ),
  constraint data_intake_staging_rows_warning_codes_array_check check (
    jsonb_typeof(warning_codes) = 'array'
  ),
  constraint data_intake_staging_rows_error_details_array_check check (
    jsonb_typeof(error_details) = 'array'
  ),
  constraint data_intake_staging_rows_target_operation_check check (
    target_operation is null
    or target_operation in ('create', 'link', 'skip')
  )
);

comment on table public.data_intake_staging_rows is
  'Ephemeral parse/validate PII. Physical DELETE after TTL. Fingerprint is plan identity, not a Customer key.';
comment on column public.data_intake_staging_rows.source_row_number is
  '1-based human-visible row index in the original source, including the header row.';
comment on column public.data_intake_staging_rows.row_fingerprint is
  'Deterministic SHA-256 hex. Import-plan/idempotency identity, not a business key.';
comment on column public.data_intake_staging_rows.target_record_id is
  'Proposed link target. Polymorphic. No FK to customers.';

create table public.data_import_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  session_id uuid not null,
  version integer not null,
  source_id uuid not null,
  source_sha256 text not null,
  target_domain text not null,
  adapter_version text not null,
  business_activity_id uuid,
  mapping_snapshot jsonb not null,
  included_fingerprints jsonb not null,
  summary jsonb not null default '{}'::jsonb,
  plan_hash text not null,
  status text not null,
  created_by_user_id uuid not null,
  approved_by_user_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  approved_at timestamptz,
  superseded_at timestamptz,
  constraint data_import_plans_org_id_unique unique (organization_id, id),
  constraint data_import_plans_session_version_unique unique (session_id, version),
  constraint data_import_plans_session_fk foreign key (organization_id, session_id)
    references public.data_intake_sessions (organization_id, id)
    on delete restrict,
  constraint data_import_plans_source_fk foreign key (organization_id, source_id)
    references public.data_intake_sources (organization_id, id)
    on delete restrict,
  constraint data_import_plans_activity_fk foreign key (
    organization_id,
    business_activity_id
  )
    references public.organization_business_activities (organization_id, id)
    on delete restrict,
  constraint data_import_plans_version_check check (version >= 1),
  constraint data_import_plans_source_sha256_check check (
    source_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint data_import_plans_plan_hash_check check (
    plan_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint data_import_plans_target_domain_check check (
    target_domain in ('customer', 'lead', 'task', 'program', 'enrollment')
  ),
  constraint data_import_plans_adapter_version_check check (
    char_length(btrim(adapter_version)) between 3 and 64
  ),
  constraint data_import_plans_customer_activity_null_check check (
    target_domain <> 'customer'
    or business_activity_id is null
  ),
  constraint data_import_plans_mapping_snapshot_object_check check (
    jsonb_typeof(mapping_snapshot) = 'object'
  ),
  constraint data_import_plans_included_fingerprints_array_check check (
    jsonb_typeof(included_fingerprints) = 'array'
  ),
  constraint data_import_plans_summary_object_check check (
    jsonb_typeof(summary) = 'object'
  ),
  constraint data_import_plans_status_check check (
    status in ('draft', 'approved', 'superseded', 'executing', 'executed')
  )
);

comment on table public.data_import_plans is
  'Immutable execution contract after approval. Execution reads this snapshot, never live mapping rows.';
comment on column public.data_import_plans.adapter_version is
  'Code-owned execution contract such as customer.v1. Not inferred business behavior.';
comment on column public.data_import_plans.included_fingerprints is
  'JSONB array of row fingerprints. No ninth plan-row table.';
comment on column public.data_import_plans.plan_hash is
  'Deterministic SHA-256 of semantic plan inputs. Not timestamp-generated.';

create unique index data_import_plans_one_approved_or_executing_per_session_idx
  on public.data_import_plans (session_id)
  where status in ('approved', 'executing');

alter table public.data_intake_sessions
  add constraint data_intake_sessions_current_plan_fk
  foreign key (organization_id, current_plan_id)
  references public.data_import_plans (organization_id, id)
  on delete restrict;

create table public.data_intake_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  session_id uuid not null,
  event_type text not null,
  actor_user_id uuid,
  plan_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint data_intake_events_org_id_unique unique (organization_id, id),
  constraint data_intake_events_session_fk foreign key (organization_id, session_id)
    references public.data_intake_sessions (organization_id, id)
    on delete restrict,
  constraint data_intake_events_plan_fk foreign key (organization_id, plan_id)
    references public.data_import_plans (organization_id, id)
    on delete restrict,
  constraint data_intake_events_event_type_check check (
    event_type in (
      'intake_created',
      'source_uploaded',
      'source_replaced',
      'source_parsed',
      'mapping_proposed',
      'mapping_confirmed',
      'validation_completed',
      'plan_created',
      'plan_approved',
      'plan_superseded',
      'import_started',
      'import_batch_completed',
      'import_completed',
      'import_failed',
      'import_cancelled'
    )
  ),
  constraint data_intake_events_metadata_object_check check (
    jsonb_typeof(metadata) = 'object'
  )
);

comment on table public.data_intake_events is
  'Append-only session-level audit. No raw row content. No UPDATE/DELETE product path.';

create index data_intake_events_session_created_at_idx
  on public.data_intake_events (organization_id, session_id, created_at desc);

create table public.data_external_record_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  source_system text not null,
  external_object_type text not null,
  external_record_id text not null,
  target_domain text not null,
  target_record_id uuid not null,
  first_seen_session_id uuid not null,
  last_seen_session_id uuid not null,
  first_seen_plan_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint data_external_record_links_org_id_unique unique (organization_id, id),
  constraint data_external_record_links_external_unique unique (
    organization_id,
    source_system,
    external_object_type,
    external_record_id
  ),
  constraint data_external_record_links_organization_fk foreign key (organization_id)
    references public.organizations (id)
    on delete restrict,
  constraint data_external_record_links_first_session_fk foreign key (
    organization_id,
    first_seen_session_id
  )
    references public.data_intake_sessions (organization_id, id)
    on delete restrict,
  constraint data_external_record_links_last_session_fk foreign key (
    organization_id,
    last_seen_session_id
  )
    references public.data_intake_sessions (organization_id, id)
    on delete restrict,
  constraint data_external_record_links_first_plan_fk foreign key (
    organization_id,
    first_seen_plan_id
  )
    references public.data_import_plans (organization_id, id)
    on delete restrict,
  constraint data_external_record_links_target_domain_check check (
    target_domain in ('customer', 'lead', 'task', 'program', 'enrollment')
  ),
  constraint data_external_record_links_source_system_check check (
    char_length(btrim(source_system)) between 1 and 100
  ),
  constraint data_external_record_links_external_id_check check (
    char_length(btrim(external_record_id)) between 1 and 200
  )
);

comment on table public.data_external_record_links is
  'Optional source-system identity. Polymorphic target_record_id has no Customer FK. Same-tenant target validation is a governed writer concern (DATA-1F/1G).';
comment on column public.data_external_record_links.target_record_id is
  'Canonical record id. Not FK-bound. Writer must prove target Organization equals link Organization.';

create table public.data_import_row_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  session_id uuid not null,
  plan_id uuid not null,
  row_fingerprint text not null,
  source_row_number integer not null,
  operation text not null,
  outcome text not null,
  target_domain text not null,
  target_record_id uuid,
  external_record_link_id uuid,
  error_code text,
  created_at timestamptz not null default pg_catalog.now(),
  constraint data_import_row_results_org_id_unique unique (organization_id, id),
  constraint data_import_row_results_plan_fingerprint_unique unique (plan_id, row_fingerprint),
  constraint data_import_row_results_session_fk foreign key (organization_id, session_id)
    references public.data_intake_sessions (organization_id, id)
    on delete restrict,
  constraint data_import_row_results_plan_fk foreign key (organization_id, plan_id)
    references public.data_import_plans (organization_id, id)
    on delete restrict,
  constraint data_import_row_results_external_link_fk foreign key (
    organization_id,
    external_record_link_id
  )
    references public.data_external_record_links (organization_id, id)
    on delete restrict,
  constraint data_import_row_results_fingerprint_check check (
    row_fingerprint ~ '^[0-9a-f]{64}$'
  ),
  constraint data_import_row_results_row_number_check check (
    source_row_number >= 1
  ),
  constraint data_import_row_results_operation_check check (
    operation in ('create', 'link', 'skip')
  ),
  constraint data_import_row_results_outcome_check check (
    outcome in ('imported', 'failed', 'skipped')
  ),
  constraint data_import_row_results_target_domain_check check (
    target_domain in ('customer', 'lead', 'task', 'program', 'enrollment')
  )
);

comment on table public.data_import_row_results is
  'Durable post-TTL provenance. No raw_values. Survives source/staging physical delete. No FK to customers.';
comment on column public.data_import_row_results.target_record_id is
  'Created or linked canonical id. Polymorphic. No cascade to customers.';

create trigger data_intake_sessions_set_updated_at
  before update on public.data_intake_sessions
  for each row
  execute function public.set_updated_at();

create trigger data_intake_mappings_set_updated_at
  before update on public.data_intake_mappings
  for each row
  execute function public.set_updated_at();

create trigger data_intake_staging_rows_set_updated_at
  before update on public.data_intake_staging_rows
  for each row
  execute function public.set_updated_at();

create trigger data_external_record_links_set_updated_at
  before update on public.data_external_record_links
  for each row
  execute function public.set_updated_at();

create trigger data_intake_sessions_integrity
  before insert or update on public.data_intake_sessions
  for each row
  execute function private.enforce_data_intake_session_integrity();

create trigger data_intake_sources_integrity
  before insert or update on public.data_intake_sources
  for each row
  execute function private.enforce_data_intake_source_integrity();

create trigger data_import_plans_immutability
  before insert or update on public.data_import_plans
  for each row
  execute function private.enforce_data_import_plan_immutability();

create trigger data_intake_events_immutable_update
  before update on public.data_intake_events
  for each row
  execute function private.guard_data_intake_event_immutable();

create trigger data_intake_events_immutable_delete
  before delete on public.data_intake_events
  for each row
  execute function private.guard_data_intake_event_immutable();
