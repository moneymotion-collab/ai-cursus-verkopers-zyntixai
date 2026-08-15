-- SMM-B1.4 — Master Content + Platform Variants + Media Foundation
-- Provider-neutral content production domain. No versioning/approval/calendar/
-- publishing/analytics/provider API. Metadata-only media (no binary, no bucket).
-- Content mutations: Owner/Admin/Staff. Structural Brand Brain remains Owner/Admin.

-- ---------------------------------------------------------------------------
-- social_content_items (Master Content)
-- ---------------------------------------------------------------------------

create table public.social_content_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  internal_title text not null,
  concept_summary text,
  primary_message text,
  campaign_id uuid,
  primary_pillar_id uuid,
  origin_kind text not null default 'human_created',
  source_content_id uuid,
  status text not null default 'draft',
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_content_items_org_id_unique unique (organization_id, id),
  constraint social_content_items_internal_title_chk
    check (char_length(btrim(internal_title)) > 0 and char_length(internal_title) <= 200),
  constraint social_content_items_concept_summary_chk
    check (concept_summary is null or char_length(concept_summary) <= 4000),
  constraint social_content_items_primary_message_chk
    check (primary_message is null or char_length(primary_message) <= 4000),
  constraint social_content_items_origin_kind_chk
    check (
      origin_kind in (
        'human_created',
        'ai_assisted',
        'ai_generated',
        'imported',
        'repurposed'
      )
    ),
  constraint social_content_items_status_chk
    check (status in ('draft', 'ready')),
  constraint social_content_items_no_self_source_chk
    check (source_content_id is null or source_content_id <> id),
  constraint social_content_items_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_content_items_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete restrict,
  constraint social_content_items_campaign_fk
    foreign key (organization_id, campaign_id)
    references public.social_campaigns (organization_id, id)
    on delete restrict,
  constraint social_content_items_pillar_fk
    foreign key (organization_id, primary_pillar_id)
    references public.social_content_pillars (organization_id, id)
    on delete restrict,
  constraint social_content_items_source_content_fk
    foreign key (organization_id, source_content_id)
    references public.social_content_items (organization_id, id)
    on delete restrict,
  constraint social_content_items_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_content_items is
  'Master Content: provider-neutral creative concept. Not a publication. Versioning/approval deferred to SMM-B1.5.';

comment on column public.social_content_items.campaign_id is
  'Optional campaign link. Evergreen content may omit campaign.';

comment on column public.social_content_items.origin_kind is
  'How the content concept originated. Distinct from Brand Brain truth provenance.';

create index social_content_items_org_workspace_status_idx
  on public.social_content_items (organization_id, workspace_id, status)
  where archived_at is null;

create index social_content_items_org_campaign_idx
  on public.social_content_items (organization_id, campaign_id)
  where campaign_id is not null;

create trigger social_content_items_set_updated_at
  before update on public.social_content_items
  for each row execute function public.set_updated_at();

alter table public.social_content_items enable row level security;
revoke all on table public.social_content_items from public;
revoke all on table public.social_content_items from anon;
revoke all on table public.social_content_items from authenticated;
revoke all on table public.social_content_items from service_role;
grant select on table public.social_content_items to authenticated;
create policy social_content_items_select_member
  on public.social_content_items for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_content_items from authenticated;
revoke insert, update, delete on table public.social_content_items from anon;

-- ---------------------------------------------------------------------------
-- social_content_variants
-- ---------------------------------------------------------------------------

create table public.social_content_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  content_id uuid not null,
  planned_provider text not null,
  content_format text not null,
  title text,
  caption text,
  description text,
  cta_text text,
  hashtags text,
  alt_text text,
  provider_config jsonb not null default '{}'::jsonb,
  status text not null default 'draft',
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_content_variants_org_id_unique unique (organization_id, id),
  constraint social_content_variants_planned_provider_chk
    check (
      planned_provider in (
        'instagram','facebook','threads','tiktok','linkedin','youtube','pinterest','x'
      )
    ),
  constraint social_content_variants_content_format_chk
    check (
      content_format in (
        'text','image','carousel','video','short_video','story','long_video','pin','thread'
      )
    ),
  constraint social_content_variants_title_chk
    check (title is null or char_length(title) <= 500),
  constraint social_content_variants_caption_chk
    check (caption is null or char_length(caption) <= 10000),
  constraint social_content_variants_description_chk
    check (description is null or char_length(description) <= 10000),
  constraint social_content_variants_cta_text_chk
    check (cta_text is null or char_length(cta_text) <= 500),
  constraint social_content_variants_hashtags_chk
    check (hashtags is null or char_length(hashtags) <= 4000),
  constraint social_content_variants_alt_text_chk
    check (alt_text is null or char_length(alt_text) <= 2000),
  constraint social_content_variants_provider_config_object_chk
    check (jsonb_typeof(provider_config) = 'object'),
  constraint social_content_variants_provider_config_size_chk
    check (pg_catalog.octet_length(provider_config::text) <= 8192),
  constraint social_content_variants_status_chk
    check (status in ('draft', 'ready')),
  constraint social_content_variants_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_content_variants_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete restrict,
  constraint social_content_variants_content_fk
    foreign key (organization_id, content_id)
    references public.social_content_items (organization_id, id)
    on delete restrict,
  constraint social_content_variants_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_content_variants is
  'Platform Variant: planned provider-native expression of Master Content. Not a publication. Multiple variants per provider allowed.';

comment on column public.social_content_variants.provider_config is
  'Bounded provider-planning knobs only (aspect ratio hints, hook notes). Not raw provider API payloads. Max 8KiB.';

comment on column public.social_content_variants.planned_provider is
  'Strategic planned provider. Does not imply OAuth/publishing runtime support.';

create index social_content_variants_org_content_idx
  on public.social_content_variants (organization_id, content_id)
  where archived_at is null;

create index social_content_variants_org_provider_idx
  on public.social_content_variants (organization_id, planned_provider)
  where archived_at is null;

create trigger social_content_variants_set_updated_at
  before update on public.social_content_variants
  for each row execute function public.set_updated_at();

alter table public.social_content_variants enable row level security;
revoke all on table public.social_content_variants from public;
revoke all on table public.social_content_variants from anon;
revoke all on table public.social_content_variants from authenticated;
revoke all on table public.social_content_variants from service_role;
grant select on table public.social_content_variants to authenticated;
create policy social_content_variants_select_member
  on public.social_content_variants for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_content_variants from authenticated;
revoke insert, update, delete on table public.social_content_variants from anon;

-- ---------------------------------------------------------------------------
-- social_media_assets (metadata + storage object key; no binary)
-- ---------------------------------------------------------------------------

create table public.social_media_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  storage_object_key text not null,
  mime_type text not null,
  media_category text not null,
  byte_size bigint not null default 0,
  width_px integer,
  height_px integer,
  duration_ms integer,
  checksum_sha256 text,
  processing_state text not null default 'ready',
  parent_asset_id uuid,
  derivation_kind text,
  alt_text text,
  origin_kind text not null default 'human_created',
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_media_assets_org_id_unique unique (organization_id, id),
  constraint social_media_assets_storage_object_key_chk
    check (char_length(btrim(storage_object_key)) > 0 and char_length(storage_object_key) <= 1024),
  constraint social_media_assets_mime_type_chk
    check (char_length(btrim(mime_type)) > 0 and char_length(mime_type) <= 200),
  constraint social_media_assets_media_category_chk
    check (media_category in ('image', 'video', 'audio', 'thumbnail')),
  constraint social_media_assets_byte_size_chk
    check (byte_size >= 0),
  constraint social_media_assets_dimensions_chk
    check (
      (width_px is null or width_px > 0)
      and (height_px is null or height_px > 0)
    ),
  constraint social_media_assets_duration_chk
    check (duration_ms is null or duration_ms >= 0),
  constraint social_media_assets_checksum_chk
    check (checksum_sha256 is null or checksum_sha256 ~ '^[0-9a-f]{64}$'),
  constraint social_media_assets_processing_state_chk
    check (processing_state in ('pending', 'ready', 'failed')),
  constraint social_media_assets_derivation_kind_chk
    check (
      derivation_kind is null
      or derivation_kind in ('crop', 'transcode', 'thumbnail', 'compress', 'other')
    ),
  constraint social_media_assets_parent_required_for_derivation_chk
    check (
      (derivation_kind is null and parent_asset_id is null)
      or (derivation_kind is not null and parent_asset_id is not null)
    ),
  constraint social_media_assets_no_self_parent_chk
    check (parent_asset_id is null or parent_asset_id <> id),
  constraint social_media_assets_alt_text_chk
    check (alt_text is null or char_length(alt_text) <= 2000),
  constraint social_media_assets_origin_kind_chk
    check (
      origin_kind in (
        'human_created',
        'ai_assisted',
        'ai_generated',
        'imported',
        'repurposed'
      )
    ),
  constraint social_media_assets_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_media_assets_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete restrict,
  constraint social_media_assets_parent_fk
    foreign key (organization_id, parent_asset_id)
    references public.social_media_assets (organization_id, id)
    on delete restrict,
  constraint social_media_assets_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_media_assets is
  'Social Media Asset metadata. Stores storage object key references only — never binary blobs. No upload bucket created in B1.4.';

comment on column public.social_media_assets.storage_object_key is
  'Object-storage key/path reference. Authorization is not path-based; access via tenant RPCs/policies later.';

create index social_media_assets_org_workspace_idx
  on public.social_media_assets (organization_id, workspace_id)
  where archived_at is null;

create trigger social_media_assets_set_updated_at
  before update on public.social_media_assets
  for each row execute function public.set_updated_at();

alter table public.social_media_assets enable row level security;
revoke all on table public.social_media_assets from public;
revoke all on table public.social_media_assets from anon;
revoke all on table public.social_media_assets from authenticated;
revoke all on table public.social_media_assets from service_role;
grant select on table public.social_media_assets to authenticated;
create policy social_media_assets_select_member
  on public.social_media_assets for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_media_assets from authenticated;
revoke insert, update, delete on table public.social_media_assets from anon;

-- ---------------------------------------------------------------------------
-- Content / variant media joins
-- ---------------------------------------------------------------------------

create table public.social_content_media (
  organization_id uuid not null,
  content_id uuid not null,
  asset_id uuid not null,
  sort_order integer not null default 0,
  asset_role text not null default 'supporting',
  created_at timestamptz not null default pg_catalog.now(),
  primary key (organization_id, content_id, asset_id),
  constraint social_content_media_asset_role_chk
    check (asset_role in ('primary', 'carousel_item', 'thumbnail', 'cover', 'supporting')),
  constraint social_content_media_content_fk
    foreign key (organization_id, content_id)
    references public.social_content_items (organization_id, id)
    on delete cascade,
  constraint social_content_media_asset_fk
    foreign key (organization_id, asset_id)
    references public.social_media_assets (organization_id, id)
    on delete restrict
);

comment on table public.social_content_media is
  'Candidate/supporting assets attached to Master Content (not necessarily final publish selection).';

create table public.social_variant_media (
  organization_id uuid not null,
  variant_id uuid not null,
  asset_id uuid not null,
  sort_order integer not null default 0,
  asset_role text not null default 'primary',
  created_at timestamptz not null default pg_catalog.now(),
  primary key (organization_id, variant_id, asset_id),
  constraint social_variant_media_asset_role_chk
    check (asset_role in ('primary', 'carousel_item', 'thumbnail', 'cover', 'supporting')),
  constraint social_variant_media_variant_fk
    foreign key (organization_id, variant_id)
    references public.social_content_variants (organization_id, id)
    on delete cascade,
  constraint social_variant_media_asset_fk
    foreign key (organization_id, asset_id)
    references public.social_media_assets (organization_id, id)
    on delete restrict
);

comment on table public.social_variant_media is
  'Ordered assets selected for a Platform Variant. Carousel order via sort_order.';

create unique index social_content_media_order_uidx
  on public.social_content_media (organization_id, content_id, sort_order);

create unique index social_variant_media_order_uidx
  on public.social_variant_media (organization_id, variant_id, sort_order);

alter table public.social_content_media enable row level security;
alter table public.social_variant_media enable row level security;
revoke all on table public.social_content_media from public;
revoke all on table public.social_content_media from anon;
revoke all on table public.social_content_media from authenticated;
revoke all on table public.social_content_media from service_role;
revoke all on table public.social_variant_media from public;
revoke all on table public.social_variant_media from anon;
revoke all on table public.social_variant_media from authenticated;
revoke all on table public.social_variant_media from service_role;
grant select on table public.social_content_media to authenticated;
grant select on table public.social_variant_media to authenticated;
create policy social_content_media_select_member
  on public.social_content_media for select to authenticated
  using (private.is_org_member(organization_id));
create policy social_variant_media_select_member
  on public.social_variant_media for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_content_media from authenticated;
revoke insert, update, delete on table public.social_content_media from anon;
revoke insert, update, delete on table public.social_variant_media from authenticated;
revoke insert, update, delete on table public.social_variant_media from anon;

-- ---------------------------------------------------------------------------
-- Append-only content events
-- ---------------------------------------------------------------------------

create table public.social_content_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  content_id uuid,
  variant_id uuid,
  asset_id uuid,
  event_type text not null,
  actor_source text not null,
  actor_member_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_content_events_org_id_unique unique (organization_id, id),
  constraint social_content_events_event_type_chk
    check (
      event_type in (
        'social_content_created',
        'social_content_updated',
        'social_content_archived',
        'social_variant_created',
        'social_variant_updated',
        'social_variant_archived',
        'social_media_asset_registered',
        'social_media_asset_archived',
        'social_content_media_replaced',
        'social_variant_media_replaced'
      )
    ),
  constraint social_content_events_actor_source_chk
    check (actor_source in ('member', 'system')),
  constraint social_content_events_payload_object_chk
    check (jsonb_typeof(payload) = 'object'),
  constraint social_content_events_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_content_events_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete cascade,
  constraint social_content_events_content_fk
    foreign key (organization_id, content_id)
    references public.social_content_items (organization_id, id)
    on delete cascade,
  constraint social_content_events_variant_fk
    foreign key (organization_id, variant_id)
    references public.social_content_variants (organization_id, id)
    on delete cascade,
  constraint social_content_events_asset_fk
    foreign key (organization_id, asset_id)
    references public.social_media_assets (organization_id, id)
    on delete cascade,
  constraint social_content_events_actor_member_fk
    foreign key (organization_id, actor_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

create or replace function private.guard_social_content_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social content events are immutable' using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_content_event_immutable() from public;
revoke all on function private.guard_social_content_event_immutable() from anon;
revoke all on function private.guard_social_content_event_immutable() from authenticated;
revoke all on function private.guard_social_content_event_immutable() from service_role;

create trigger social_content_events_guard_immutable
  before update or delete on public.social_content_events
  for each row execute function private.guard_social_content_event_immutable();

create index social_content_events_org_content_created_idx
  on public.social_content_events (organization_id, content_id, created_at desc);

alter table public.social_content_events enable row level security;
revoke all on table public.social_content_events from public;
revoke all on table public.social_content_events from anon;
revoke all on table public.social_content_events from authenticated;
revoke all on table public.social_content_events from service_role;
grant select on table public.social_content_events to authenticated;
create policy social_content_events_select_owner_admin
  on public.social_content_events for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));
revoke insert, update, delete on table public.social_content_events from authenticated;
revoke insert, update, delete on table public.social_content_events from anon;

-- ---------------------------------------------------------------------------
-- Helpers: content ops allow Owner/Admin/Staff
-- ---------------------------------------------------------------------------

create or replace function private.can_manage_social_content(p_actor_role text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_actor_role in ('owner', 'admin', 'staff');
$$;

revoke all on function private.can_manage_social_content(text) from public;
revoke all on function private.can_manage_social_content(text) from anon;
revoke all on function private.can_manage_social_content(text) from authenticated;
revoke all on function private.can_manage_social_content(text) from service_role;

create or replace function private.assert_social_content_mutation_context(
  p_organization_id uuid,
  p_brand_id uuid
)
returns table (
  result_code text,
  membership_id uuid,
  workspace_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_workspace_id uuid;
  v_brand_archived_at timestamptz;
  v_workspace_archived_at timestamptz;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated' using errcode = 'P0001';
  end if;
  if p_organization_id is null or p_brand_id is null then
    return query select 'invalid_input'::text, null::uuid, null::uuid;
    return;
  end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_workspace_actor_membership(p_organization_id) as actor;

  if v_membership_id is null or v_member_role is null then
    return query select 'forbidden'::text, null::uuid, null::uuid;
    return;
  end if;

  begin
    perform private.assert_active_organization_for_social_workspace_mutation(p_organization_id);
  exception when raise_exception then
    return query select 'forbidden'::text, null::uuid, null::uuid;
    return;
  end;

  if not private.can_manage_social_content(v_member_role) then
    return query select 'forbidden'::text, null::uuid, null::uuid;
    return;
  end if;

  select r.workspace_id, r.brand_archived_at, r.workspace_archived_at
  into v_workspace_id, v_brand_archived_at, v_workspace_archived_at
  from private.resolve_social_brand_workspace(p_organization_id, p_brand_id) as r;

  if v_workspace_id is null then
    return query select 'not_found'::text, null::uuid, null::uuid;
    return;
  end if;
  if v_brand_archived_at is not null or v_workspace_archived_at is not null then
    return query select 'conflict'::text, null::uuid, null::uuid;
    return;
  end if;

  return query select 'ok'::text, v_membership_id, v_workspace_id;
end;
$$;

revoke all on function private.assert_social_content_mutation_context(uuid, uuid) from public;
revoke all on function private.assert_social_content_mutation_context(uuid, uuid) from anon;
revoke all on function private.assert_social_content_mutation_context(uuid, uuid) from authenticated;
revoke all on function private.assert_social_content_mutation_context(uuid, uuid) from service_role;

create or replace function private.insert_social_content_event(
  p_organization_id uuid,
  p_brand_id uuid,
  p_workspace_id uuid,
  p_content_id uuid,
  p_variant_id uuid,
  p_asset_id uuid,
  p_event_type text,
  p_actor_source text,
  p_actor_member_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id uuid;
  v_payload jsonb := coalesce(p_payload, '{}'::jsonb);
begin
  if jsonb_typeof(v_payload) is distinct from 'object' then
    raise exception 'invalid social content event payload' using errcode = 'P0001';
  end if;
  if v_payload ?| array[
    'access_token','refresh_token','token','ciphertext','iv','auth_tag',
    'authorization_code','client_secret','raw_state','state','encryption_key'
  ] then
    raise exception 'social content event payload contains forbidden secret keys' using errcode = 'P0001';
  end if;

  insert into public.social_content_events (
    organization_id, brand_id, workspace_id, content_id, variant_id, asset_id,
    event_type, actor_source, actor_member_id, payload
  ) values (
    p_organization_id, p_brand_id, p_workspace_id, p_content_id, p_variant_id, p_asset_id,
    p_event_type, p_actor_source, p_actor_member_id, v_payload
  ) returning id into v_event_id;
  return v_event_id;
end;
$$;

revoke all on function private.insert_social_content_event(uuid, uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from public;
revoke all on function private.insert_social_content_event(uuid, uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from anon;
revoke all on function private.insert_social_content_event(uuid, uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from authenticated;
revoke all on function private.insert_social_content_event(uuid, uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from service_role;

-- ---------------------------------------------------------------------------
-- Master Content RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_social_content_item(
  p_organization_id uuid,
  p_brand_id uuid,
  p_internal_title text,
  p_concept_summary text default null,
  p_primary_message text default null,
  p_campaign_id uuid default null,
  p_primary_pillar_id uuid default null,
  p_origin_kind text default 'human_created',
  p_source_content_id uuid default null,
  p_status text default 'draft'
)
returns table (result_code text, content_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ctx record;
  v_title text := btrim(coalesce(p_internal_title, ''));
  v_origin text := coalesce(nullif(btrim(p_origin_kind), ''), 'human_created');
  v_status text := coalesce(nullif(btrim(p_status), ''), 'draft');
  v_id uuid;
  v_campaign_brand uuid;
  v_campaign_archived timestamptz;
  v_pillar_brand uuid;
  v_pillar_archived timestamptz;
  v_source_brand uuid;
begin
  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, p_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;

  if char_length(v_title) = 0 or char_length(v_title) > 200
     or v_origin not in ('human_created','ai_assisted','ai_generated','imported','repurposed')
     or v_status not in ('draft','ready')
  then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  if p_campaign_id is not null then
    select c.brand_id, c.archived_at into v_campaign_brand, v_campaign_archived
    from public.social_campaigns as c
    where c.organization_id = p_organization_id and c.id = p_campaign_id;
    if not found or v_campaign_brand is distinct from p_brand_id or v_campaign_archived is not null then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
  end if;

  if p_primary_pillar_id is not null then
    select p.brand_id, p.archived_at into v_pillar_brand, v_pillar_archived
    from public.social_content_pillars as p
    where p.organization_id = p_organization_id and p.id = p_primary_pillar_id;
    if not found or v_pillar_brand is distinct from p_brand_id or v_pillar_archived is not null then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
  end if;

  if p_source_content_id is not null then
    select s.brand_id into v_source_brand
    from public.social_content_items as s
    where s.organization_id = p_organization_id and s.id = p_source_content_id;
    if not found or v_source_brand is distinct from p_brand_id then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
  end if;

  insert into public.social_content_items (
    organization_id, brand_id, workspace_id, internal_title, concept_summary, primary_message,
    campaign_id, primary_pillar_id, origin_kind, source_content_id, status, created_by_member_id
  ) values (
    p_organization_id, p_brand_id, v_ctx.workspace_id, v_title,
    nullif(btrim(coalesce(p_concept_summary, '')), ''),
    nullif(btrim(coalesce(p_primary_message, '')), ''),
    p_campaign_id, p_primary_pillar_id, v_origin, p_source_content_id, v_status, v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_content_event(
    p_organization_id, p_brand_id, v_ctx.workspace_id, v_id, null, null,
    'social_content_created', 'member', v_ctx.membership_id,
    jsonb_build_object('content_id', v_id, 'origin_kind', v_origin)
  );
  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.create_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text, uuid, text) from public;
revoke all on function public.create_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text, uuid, text) from anon;
revoke all on function public.create_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text, uuid, text) from authenticated;
revoke all on function public.create_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text, uuid, text) from service_role;
grant execute on function public.create_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text, uuid, text) to authenticated;

create or replace function public.update_social_content_item(
  p_organization_id uuid,
  p_content_id uuid,
  p_internal_title text,
  p_concept_summary text default null,
  p_primary_message text default null,
  p_campaign_id uuid default null,
  p_primary_pillar_id uuid default null,
  p_status text default null
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.social_content_items;
  v_ctx record;
  v_title text;
  v_status text;
  v_campaign_brand uuid;
  v_campaign_archived timestamptz;
  v_pillar_brand uuid;
  v_pillar_archived timestamptz;
begin
  select c.* into v_item from public.social_content_items as c
  where c.organization_id = p_organization_id and c.id = p_content_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_item.archived_at is not null then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_item.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  v_title := btrim(coalesce(p_internal_title, v_item.internal_title));
  v_status := coalesce(nullif(btrim(coalesce(p_status, '')), ''), v_item.status);
  if char_length(v_title) = 0 or char_length(v_title) > 200 or v_status not in ('draft','ready') then
    return query select 'invalid_input'::text; return;
  end if;

  if p_campaign_id is not null then
    select c.brand_id, c.archived_at into v_campaign_brand, v_campaign_archived
    from public.social_campaigns as c
    where c.organization_id = p_organization_id and c.id = p_campaign_id;
    if not found or v_campaign_brand is distinct from v_item.brand_id or v_campaign_archived is not null then
      return query select 'invalid_input'::text; return;
    end if;
  end if;

  if p_primary_pillar_id is not null then
    select p.brand_id, p.archived_at into v_pillar_brand, v_pillar_archived
    from public.social_content_pillars as p
    where p.organization_id = p_organization_id and p.id = p_primary_pillar_id;
    if not found or v_pillar_brand is distinct from v_item.brand_id or v_pillar_archived is not null then
      return query select 'invalid_input'::text; return;
    end if;
  end if;

  update public.social_content_items as c
  set
    internal_title = v_title,
    concept_summary = case when p_concept_summary is null then c.concept_summary else nullif(btrim(p_concept_summary), '') end,
    primary_message = case when p_primary_message is null then c.primary_message else nullif(btrim(p_primary_message), '') end,
    campaign_id = case when p_campaign_id is null then c.campaign_id else p_campaign_id end,
    primary_pillar_id = case when p_primary_pillar_id is null then c.primary_pillar_id else p_primary_pillar_id end,
    status = v_status
  where c.organization_id = p_organization_id and c.id = p_content_id and c.archived_at is null;

  perform private.insert_social_content_event(
    p_organization_id, v_item.brand_id, v_item.workspace_id, p_content_id, null, null,
    'social_content_updated', 'member', v_ctx.membership_id,
    jsonb_build_object('content_id', p_content_id, 'status', v_status)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.update_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text) from public;
revoke all on function public.update_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text) from anon;
revoke all on function public.update_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text) from authenticated;
revoke all on function public.update_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text) from service_role;
grant execute on function public.update_social_content_item(uuid, uuid, text, text, text, uuid, uuid, text) to authenticated;

create or replace function public.archive_social_content_item(
  p_organization_id uuid,
  p_content_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.social_content_items;
  v_ctx record;
begin
  select c.* into v_item from public.social_content_items as c
  where c.organization_id = p_organization_id and c.id = p_content_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_item.archived_at is not null then return query select 'conflict'::text; return; end if;
  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_item.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;
  update public.social_content_items set archived_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_content_id and archived_at is null;
  perform private.insert_social_content_event(
    p_organization_id, v_item.brand_id, v_item.workspace_id, p_content_id, null, null,
    'social_content_archived', 'member', v_ctx.membership_id,
    jsonb_build_object('content_id', p_content_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_content_item(uuid, uuid) from public;
revoke all on function public.archive_social_content_item(uuid, uuid) from anon;
revoke all on function public.archive_social_content_item(uuid, uuid) from authenticated;
revoke all on function public.archive_social_content_item(uuid, uuid) from service_role;
grant execute on function public.archive_social_content_item(uuid, uuid) to authenticated;
-- ---------------------------------------------------------------------------
-- Platform Variant RPCs
-- ---------------------------------------------------------------------------

create or replace function private.validate_social_variant_provider_config(
  p_config jsonb
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_key text;
  v_allowed text[] := array[
    'aspect_ratio_hint',
    'hook_note',
    'language_hint',
    'thumbnail_text_hint'
  ];
begin
  if p_config is null or jsonb_typeof(p_config) is distinct from 'object' then
    return false;
  end if;
  if pg_catalog.octet_length(p_config::text) > 8192 then
    return false;
  end if;
  for v_key in select jsonb_object_keys(p_config)
  loop
    if not (v_key = any (v_allowed)) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

revoke all on function private.validate_social_variant_provider_config(jsonb) from public;
revoke all on function private.validate_social_variant_provider_config(jsonb) from anon;
revoke all on function private.validate_social_variant_provider_config(jsonb) from authenticated;
revoke all on function private.validate_social_variant_provider_config(jsonb) from service_role;

create or replace function public.create_social_content_variant(
  p_organization_id uuid,
  p_content_id uuid,
  p_planned_provider text,
  p_content_format text,
  p_title text default null,
  p_caption text default null,
  p_description text default null,
  p_cta_text text default null,
  p_hashtags text default null,
  p_alt_text text default null,
  p_provider_config jsonb default '{}'::jsonb,
  p_status text default 'draft'
)
returns table (result_code text, variant_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.social_content_items;
  v_ctx record;
  v_provider text := btrim(coalesce(p_planned_provider, ''));
  v_format text := btrim(coalesce(p_content_format, ''));
  v_status text := coalesce(nullif(btrim(p_status), ''), 'draft');
  v_config jsonb := coalesce(p_provider_config, '{}'::jsonb);
  v_id uuid;
begin
  select c.* into v_item from public.social_content_items as c
  where c.organization_id = p_organization_id and c.id = p_content_id;
  if not found then return query select 'not_found'::text, null::uuid; return; end if;
  if v_item.archived_at is not null then return query select 'conflict'::text, null::uuid; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_item.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;

  if v_provider not in ('instagram','facebook','threads','tiktok','linkedin','youtube','pinterest','x')
     or v_format not in ('text','image','carousel','video','short_video','story','long_video','pin','thread')
     or v_status not in ('draft','ready')
     or not private.validate_social_variant_provider_config(v_config)
     or (p_title is not null and char_length(p_title) > 500)
     or (p_caption is not null and char_length(p_caption) > 10000)
     or (p_description is not null and char_length(p_description) > 10000)
     or (p_cta_text is not null and char_length(p_cta_text) > 500)
     or (p_hashtags is not null and char_length(p_hashtags) > 4000)
     or (p_alt_text is not null and char_length(p_alt_text) > 2000)
  then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  insert into public.social_content_variants (
    organization_id, brand_id, workspace_id, content_id, planned_provider, content_format,
    title, caption, description, cta_text, hashtags, alt_text, provider_config, status, created_by_member_id
  ) values (
    p_organization_id, v_item.brand_id, v_item.workspace_id, p_content_id, v_provider, v_format,
    nullif(btrim(coalesce(p_title, '')), ''),
    nullif(btrim(coalesce(p_caption, '')), ''),
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_cta_text, '')), ''),
    nullif(btrim(coalesce(p_hashtags, '')), ''),
    nullif(btrim(coalesce(p_alt_text, '')), ''),
    v_config, v_status, v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_content_event(
    p_organization_id, v_item.brand_id, v_item.workspace_id, p_content_id, v_id, null,
    'social_variant_created', 'member', v_ctx.membership_id,
    jsonb_build_object('variant_id', v_id, 'planned_provider', v_provider, 'content_format', v_format)
  );
  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.create_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, text, jsonb, text) from public;
revoke all on function public.create_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, text, jsonb, text) from anon;
revoke all on function public.create_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, text, jsonb, text) from authenticated;
revoke all on function public.create_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, text, jsonb, text) from service_role;
grant execute on function public.create_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, text, jsonb, text) to authenticated;

create or replace function public.update_social_content_variant(
  p_organization_id uuid,
  p_variant_id uuid,
  p_content_format text default null,
  p_title text default null,
  p_caption text default null,
  p_description text default null,
  p_cta_text text default null,
  p_hashtags text default null,
  p_alt_text text default null,
  p_provider_config jsonb default null,
  p_status text default null
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant public.social_content_variants;
  v_ctx record;
  v_format text;
  v_status text;
  v_config jsonb;
begin
  select v.* into v_variant from public.social_content_variants as v
  where v.organization_id = p_organization_id and v.id = p_variant_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_variant.archived_at is not null then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_variant.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  v_format := coalesce(nullif(btrim(coalesce(p_content_format, '')), ''), v_variant.content_format);
  v_status := coalesce(nullif(btrim(coalesce(p_status, '')), ''), v_variant.status);
  v_config := coalesce(p_provider_config, v_variant.provider_config);

  if v_format not in ('text','image','carousel','video','short_video','story','long_video','pin','thread')
     or v_status not in ('draft','ready')
     or not private.validate_social_variant_provider_config(v_config)
     or (p_title is not null and char_length(p_title) > 500)
     or (p_caption is not null and char_length(p_caption) > 10000)
     or (p_description is not null and char_length(p_description) > 10000)
     or (p_cta_text is not null and char_length(p_cta_text) > 500)
     or (p_hashtags is not null and char_length(p_hashtags) > 4000)
     or (p_alt_text is not null and char_length(p_alt_text) > 2000)
  then
    return query select 'invalid_input'::text; return;
  end if;

  update public.social_content_variants as v
  set
    content_format = v_format,
    title = case when p_title is null then v.title else nullif(btrim(p_title), '') end,
    caption = case when p_caption is null then v.caption else nullif(btrim(p_caption), '') end,
    description = case when p_description is null then v.description else nullif(btrim(p_description), '') end,
    cta_text = case when p_cta_text is null then v.cta_text else nullif(btrim(p_cta_text), '') end,
    hashtags = case when p_hashtags is null then v.hashtags else nullif(btrim(p_hashtags), '') end,
    alt_text = case when p_alt_text is null then v.alt_text else nullif(btrim(p_alt_text), '') end,
    provider_config = v_config,
    status = v_status
  where v.organization_id = p_organization_id and v.id = p_variant_id and v.archived_at is null;

  perform private.insert_social_content_event(
    p_organization_id, v_variant.brand_id, v_variant.workspace_id, v_variant.content_id, p_variant_id, null,
    'social_variant_updated', 'member', v_ctx.membership_id,
    jsonb_build_object('variant_id', p_variant_id, 'status', v_status)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.update_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, jsonb, text) from public;
revoke all on function public.update_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, jsonb, text) from anon;
revoke all on function public.update_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, jsonb, text) from authenticated;
revoke all on function public.update_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, jsonb, text) from service_role;
grant execute on function public.update_social_content_variant(uuid, uuid, text, text, text, text, text, text, text, jsonb, text) to authenticated;

create or replace function public.archive_social_content_variant(
  p_organization_id uuid,
  p_variant_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant public.social_content_variants;
  v_ctx record;
begin
  select v.* into v_variant from public.social_content_variants as v
  where v.organization_id = p_organization_id and v.id = p_variant_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_variant.archived_at is not null then return query select 'conflict'::text; return; end if;
  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_variant.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;
  update public.social_content_variants set archived_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_variant_id and archived_at is null;
  perform private.insert_social_content_event(
    p_organization_id, v_variant.brand_id, v_variant.workspace_id, v_variant.content_id, p_variant_id, null,
    'social_variant_archived', 'member', v_ctx.membership_id,
    jsonb_build_object('variant_id', p_variant_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_content_variant(uuid, uuid) from public;
revoke all on function public.archive_social_content_variant(uuid, uuid) from anon;
revoke all on function public.archive_social_content_variant(uuid, uuid) from authenticated;
revoke all on function public.archive_social_content_variant(uuid, uuid) from service_role;
grant execute on function public.archive_social_content_variant(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Media Asset RPCs
-- ---------------------------------------------------------------------------

create or replace function public.register_social_media_asset(
  p_organization_id uuid,
  p_brand_id uuid,
  p_storage_object_key text,
  p_mime_type text,
  p_media_category text,
  p_byte_size bigint default 0,
  p_width_px integer default null,
  p_height_px integer default null,
  p_duration_ms integer default null,
  p_checksum_sha256 text default null,
  p_processing_state text default 'ready',
  p_parent_asset_id uuid default null,
  p_derivation_kind text default null,
  p_alt_text text default null,
  p_origin_kind text default 'human_created'
)
returns table (result_code text, asset_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ctx record;
  v_key text := btrim(coalesce(p_storage_object_key, ''));
  v_mime text := btrim(coalesce(p_mime_type, ''));
  v_category text := btrim(coalesce(p_media_category, ''));
  v_state text := coalesce(nullif(btrim(p_processing_state), ''), 'ready');
  v_origin text := coalesce(nullif(btrim(p_origin_kind), ''), 'human_created');
  v_checksum text := nullif(lower(btrim(coalesce(p_checksum_sha256, ''))), '');
  v_derivation text := nullif(btrim(coalesce(p_derivation_kind, '')), '');
  v_parent_brand uuid;
  v_id uuid;
begin
  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, p_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;

  if char_length(v_key) = 0 or char_length(v_key) > 1024
     or char_length(v_mime) = 0 or char_length(v_mime) > 200
     or v_category not in ('image','video','audio','thumbnail')
     or coalesce(p_byte_size, -1) < 0
     or (p_width_px is not null and p_width_px <= 0)
     or (p_height_px is not null and p_height_px <= 0)
     or (p_duration_ms is not null and p_duration_ms < 0)
     or v_state not in ('pending','ready','failed')
     or v_origin not in ('human_created','ai_assisted','ai_generated','imported','repurposed')
     or (v_checksum is not null and v_checksum !~ '^[0-9a-f]{64}$')
     or (p_alt_text is not null and char_length(p_alt_text) > 2000)
     or ((v_derivation is null) <> (p_parent_asset_id is null))
     or (v_derivation is not null and v_derivation not in ('crop','transcode','thumbnail','compress','other'))
  then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  if p_parent_asset_id is not null then
    select a.brand_id into v_parent_brand
    from public.social_media_assets as a
    where a.organization_id = p_organization_id and a.id = p_parent_asset_id;
    if not found or v_parent_brand is distinct from p_brand_id then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
  end if;

  insert into public.social_media_assets (
    organization_id, brand_id, workspace_id, storage_object_key, mime_type, media_category,
    byte_size, width_px, height_px, duration_ms, checksum_sha256, processing_state,
    parent_asset_id, derivation_kind, alt_text, origin_kind, created_by_member_id
  ) values (
    p_organization_id, p_brand_id, v_ctx.workspace_id, v_key, v_mime, v_category,
    coalesce(p_byte_size, 0), p_width_px, p_height_px, p_duration_ms, v_checksum, v_state,
    p_parent_asset_id, v_derivation,
    nullif(btrim(coalesce(p_alt_text, '')), ''),
    v_origin, v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_content_event(
    p_organization_id, p_brand_id, v_ctx.workspace_id, null, null, v_id,
    'social_media_asset_registered', 'member', v_ctx.membership_id,
    jsonb_build_object('asset_id', v_id, 'media_category', v_category)
  );
  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.register_social_media_asset(uuid, uuid, text, text, text, bigint, integer, integer, integer, text, text, uuid, text, text, text) from public;
revoke all on function public.register_social_media_asset(uuid, uuid, text, text, text, bigint, integer, integer, integer, text, text, uuid, text, text, text) from anon;
revoke all on function public.register_social_media_asset(uuid, uuid, text, text, text, bigint, integer, integer, integer, text, text, uuid, text, text, text) from authenticated;
revoke all on function public.register_social_media_asset(uuid, uuid, text, text, text, bigint, integer, integer, integer, text, text, uuid, text, text, text) from service_role;
grant execute on function public.register_social_media_asset(uuid, uuid, text, text, text, bigint, integer, integer, integer, text, text, uuid, text, text, text) to authenticated;

create or replace function public.archive_social_media_asset(
  p_organization_id uuid,
  p_asset_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_asset public.social_media_assets;
  v_ctx record;
begin
  select a.* into v_asset from public.social_media_assets as a
  where a.organization_id = p_organization_id and a.id = p_asset_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_asset.archived_at is not null then return query select 'conflict'::text; return; end if;
  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_asset.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;
  update public.social_media_assets set archived_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_asset_id and archived_at is null;
  perform private.insert_social_content_event(
    p_organization_id, v_asset.brand_id, v_asset.workspace_id, null, null, p_asset_id,
    'social_media_asset_archived', 'member', v_ctx.membership_id,
    jsonb_build_object('asset_id', p_asset_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_media_asset(uuid, uuid) from public;
revoke all on function public.archive_social_media_asset(uuid, uuid) from anon;
revoke all on function public.archive_social_media_asset(uuid, uuid) from authenticated;
revoke all on function public.archive_social_media_asset(uuid, uuid) from service_role;
grant execute on function public.archive_social_media_asset(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Atomic media attachment replacement
-- ---------------------------------------------------------------------------

create or replace function public.set_social_content_media_attachments(
  p_organization_id uuid,
  p_content_id uuid,
  p_attachments jsonb
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.social_content_items;
  v_ctx record;
  v_elem jsonb;
  v_asset_id uuid;
  v_sort integer;
  v_role text;
  v_seen_assets uuid[] := array[]::uuid[];
  v_seen_orders integer[] := array[]::integer[];
  v_asset_brand uuid;
  v_asset_archived timestamptz;
  v_count integer := 0;
begin
  select c.* into v_item from public.social_content_items as c
  where c.organization_id = p_organization_id and c.id = p_content_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_item.archived_at is not null then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_item.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  if p_attachments is null or jsonb_typeof(p_attachments) is distinct from 'array'
     or jsonb_array_length(p_attachments) > 50
  then
    return query select 'invalid_input'::text; return;
  end if;

  for v_elem in select value from jsonb_array_elements(p_attachments)
  loop
    if jsonb_typeof(v_elem) is distinct from 'object' then
      return query select 'invalid_input'::text; return;
    end if;
    begin
      v_asset_id := (v_elem->>'asset_id')::uuid;
      v_sort := coalesce((v_elem->>'sort_order')::integer, -1);
    exception when others then
      return query select 'invalid_input'::text; return;
    end;
    v_role := coalesce(nullif(btrim(v_elem->>'asset_role'), ''), 'supporting');
    if v_asset_id is null or v_sort < 0
       or v_role not in ('primary','carousel_item','thumbnail','cover','supporting')
       or v_asset_id = any (v_seen_assets)
       or v_sort = any (v_seen_orders)
    then
      return query select 'invalid_input'::text; return;
    end if;

    select a.brand_id, a.archived_at into v_asset_brand, v_asset_archived
    from public.social_media_assets as a
    where a.organization_id = p_organization_id and a.id = v_asset_id;
    if not found or v_asset_brand is distinct from v_item.brand_id or v_asset_archived is not null then
      return query select 'invalid_input'::text; return;
    end if;

    v_seen_assets := array_append(v_seen_assets, v_asset_id);
    v_seen_orders := array_append(v_seen_orders, v_sort);
    v_count := v_count + 1;
  end loop;

  delete from public.social_content_media
  where organization_id = p_organization_id and content_id = p_content_id;

  for v_elem in select value from jsonb_array_elements(p_attachments)
  loop
    insert into public.social_content_media (
      organization_id, content_id, asset_id, sort_order, asset_role
    ) values (
      p_organization_id,
      p_content_id,
      (v_elem->>'asset_id')::uuid,
      coalesce((v_elem->>'sort_order')::integer, 0),
      coalesce(nullif(btrim(v_elem->>'asset_role'), ''), 'supporting')
    );
  end loop;

  perform private.insert_social_content_event(
    p_organization_id, v_item.brand_id, v_item.workspace_id, p_content_id, null, null,
    'social_content_media_replaced', 'member', v_ctx.membership_id,
    jsonb_build_object('content_id', p_content_id, 'attachment_count', v_count)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.set_social_content_media_attachments(uuid, uuid, jsonb) from public;
revoke all on function public.set_social_content_media_attachments(uuid, uuid, jsonb) from anon;
revoke all on function public.set_social_content_media_attachments(uuid, uuid, jsonb) from authenticated;
revoke all on function public.set_social_content_media_attachments(uuid, uuid, jsonb) from service_role;
grant execute on function public.set_social_content_media_attachments(uuid, uuid, jsonb) to authenticated;

create or replace function public.set_social_variant_media_attachments(
  p_organization_id uuid,
  p_variant_id uuid,
  p_attachments jsonb
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant public.social_content_variants;
  v_ctx record;
  v_elem jsonb;
  v_asset_id uuid;
  v_sort integer;
  v_role text;
  v_seen_assets uuid[] := array[]::uuid[];
  v_seen_orders integer[] := array[]::integer[];
  v_asset_brand uuid;
  v_asset_archived timestamptz;
  v_count integer := 0;
begin
  select v.* into v_variant from public.social_content_variants as v
  where v.organization_id = p_organization_id and v.id = p_variant_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_variant.archived_at is not null then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_variant.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  if p_attachments is null or jsonb_typeof(p_attachments) is distinct from 'array'
     or jsonb_array_length(p_attachments) > 50
  then
    return query select 'invalid_input'::text; return;
  end if;

  for v_elem in select value from jsonb_array_elements(p_attachments)
  loop
    if jsonb_typeof(v_elem) is distinct from 'object' then
      return query select 'invalid_input'::text; return;
    end if;
    begin
      v_asset_id := (v_elem->>'asset_id')::uuid;
      v_sort := coalesce((v_elem->>'sort_order')::integer, -1);
    exception when others then
      return query select 'invalid_input'::text; return;
    end;
    v_role := coalesce(nullif(btrim(v_elem->>'asset_role'), ''), 'primary');
    if v_asset_id is null or v_sort < 0
       or v_role not in ('primary','carousel_item','thumbnail','cover','supporting')
       or v_asset_id = any (v_seen_assets)
       or v_sort = any (v_seen_orders)
    then
      return query select 'invalid_input'::text; return;
    end if;

    select a.brand_id, a.archived_at into v_asset_brand, v_asset_archived
    from public.social_media_assets as a
    where a.organization_id = p_organization_id and a.id = v_asset_id;
    if not found or v_asset_brand is distinct from v_variant.brand_id or v_asset_archived is not null then
      return query select 'invalid_input'::text; return;
    end if;

    v_seen_assets := array_append(v_seen_assets, v_asset_id);
    v_seen_orders := array_append(v_seen_orders, v_sort);
    v_count := v_count + 1;
  end loop;

  delete from public.social_variant_media
  where organization_id = p_organization_id and variant_id = p_variant_id;

  for v_elem in select value from jsonb_array_elements(p_attachments)
  loop
    insert into public.social_variant_media (
      organization_id, variant_id, asset_id, sort_order, asset_role
    ) values (
      p_organization_id,
      p_variant_id,
      (v_elem->>'asset_id')::uuid,
      coalesce((v_elem->>'sort_order')::integer, 0),
      coalesce(nullif(btrim(v_elem->>'asset_role'), ''), 'primary')
    );
  end loop;

  perform private.insert_social_content_event(
    p_organization_id, v_variant.brand_id, v_variant.workspace_id, v_variant.content_id, p_variant_id, null,
    'social_variant_media_replaced', 'member', v_ctx.membership_id,
    jsonb_build_object('variant_id', p_variant_id, 'attachment_count', v_count)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.set_social_variant_media_attachments(uuid, uuid, jsonb) from public;
revoke all on function public.set_social_variant_media_attachments(uuid, uuid, jsonb) from anon;
revoke all on function public.set_social_variant_media_attachments(uuid, uuid, jsonb) from authenticated;
revoke all on function public.set_social_variant_media_attachments(uuid, uuid, jsonb) from service_role;
grant execute on function public.set_social_variant_media_attachments(uuid, uuid, jsonb) to authenticated;

