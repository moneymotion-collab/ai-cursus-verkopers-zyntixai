-- SMM-B1.5 — Calendar + Content Versioning + Review + Approval
-- Immutable version snapshots, version-bound approvals, editorial schedule slots.
-- No publication jobs, provider publishing, analytics, or Attention integration.
-- Beta 1: internal approval only (client portal deferred). Staff may approve.

-- ---------------------------------------------------------------------------
-- Workspace approval policy (bounded columns; not jsonb dump)
-- ---------------------------------------------------------------------------

alter table public.social_workspaces
  add column if not exists internal_approval_required boolean not null default true,
  add column if not exists client_approval_required boolean not null default false;

comment on column public.social_workspaces.internal_approval_required is
  'When true, workflow readiness requires an internal approved decision on the exact variant version.';

comment on column public.social_workspaces.client_approval_required is
  'Future client-approval requirement flag. Client identity/portal deferred; when true without client decision, workflow_ready stays false.';

-- ---------------------------------------------------------------------------
-- Master Content versions (immutable concept snapshots)
-- ---------------------------------------------------------------------------

create table public.social_content_item_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  content_id uuid not null,
  version_number integer not null,
  internal_title text not null,
  concept_summary text,
  primary_message text,
  campaign_id uuid,
  primary_pillar_id uuid,
  origin_kind text not null,
  previous_version_id uuid,
  change_note text,
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_content_item_versions_org_id_unique unique (organization_id, id),
  constraint social_content_item_versions_parent_number_unique unique (organization_id, content_id, version_number),
  constraint social_content_item_versions_number_chk check (version_number >= 1),
  constraint social_content_item_versions_title_chk
    check (char_length(btrim(internal_title)) > 0 and char_length(internal_title) <= 200),
  constraint social_content_item_versions_concept_chk
    check (concept_summary is null or char_length(concept_summary) <= 4000),
  constraint social_content_item_versions_message_chk
    check (primary_message is null or char_length(primary_message) <= 4000),
  constraint social_content_item_versions_change_note_chk
    check (change_note is null or char_length(change_note) <= 2000),
  constraint social_content_item_versions_origin_kind_chk
    check (
      origin_kind in (
        'human_created','ai_assisted','ai_generated','imported','repurposed'
      )
    ),
  constraint social_content_item_versions_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_content_item_versions_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id) on delete restrict,
  constraint social_content_item_versions_content_fk
    foreign key (organization_id, content_id)
    references public.social_content_items (organization_id, id) on delete restrict,
  constraint social_content_item_versions_campaign_fk
    foreign key (organization_id, campaign_id)
    references public.social_campaigns (organization_id, id) on delete restrict,
  constraint social_content_item_versions_pillar_fk
    foreign key (organization_id, primary_pillar_id)
    references public.social_content_pillars (organization_id, id) on delete restrict,
  constraint social_content_item_versions_previous_fk
    foreign key (organization_id, previous_version_id)
    references public.social_content_item_versions (organization_id, id) on delete restrict,
  constraint social_content_item_versions_created_by_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

comment on table public.social_content_item_versions is
  'Immutable Master Content snapshots (SMM-B1.5). Not publication state.';

create index social_content_item_versions_org_content_idx
  on public.social_content_item_versions (organization_id, content_id, version_number desc);

alter table public.social_content_item_versions enable row level security;
revoke all on table public.social_content_item_versions from public;
revoke all on table public.social_content_item_versions from anon;
revoke all on table public.social_content_item_versions from authenticated;
revoke all on table public.social_content_item_versions from service_role;
grant select on table public.social_content_item_versions to authenticated;
create policy social_content_item_versions_select_member
  on public.social_content_item_versions for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_content_item_versions from authenticated;
revoke insert, update, delete on table public.social_content_item_versions from anon;

create or replace function private.guard_social_content_item_version_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social content item versions are immutable' using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_content_item_version_immutable() from public;
revoke all on function private.guard_social_content_item_version_immutable() from anon;
revoke all on function private.guard_social_content_item_version_immutable() from authenticated;
revoke all on function private.guard_social_content_item_version_immutable() from service_role;

create trigger social_content_item_versions_guard_immutable
  before update or delete on public.social_content_item_versions
  for each row execute function private.guard_social_content_item_version_immutable();

-- ---------------------------------------------------------------------------
-- Platform Variant versions (immutable provider-facing snapshots + media)
-- ---------------------------------------------------------------------------

create table public.social_content_variant_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  content_id uuid not null,
  variant_id uuid not null,
  version_number integer not null,
  planned_provider text not null,
  content_format text not null,
  title text,
  caption text,
  description text,
  cta_text text,
  hashtags text,
  alt_text text,
  provider_config jsonb not null default '{}'::jsonb,
  media_snapshot jsonb not null default '[]'::jsonb,
  previous_version_id uuid,
  change_note text,
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_content_variant_versions_org_id_unique unique (organization_id, id),
  constraint social_content_variant_versions_parent_number_unique unique (organization_id, variant_id, version_number),
  constraint social_content_variant_versions_number_chk check (version_number >= 1),
  constraint social_content_variant_versions_planned_provider_chk
    check (
      planned_provider in (
        'instagram','facebook','threads','tiktok','linkedin','youtube','pinterest','x'
      )
    ),
  constraint social_content_variant_versions_format_chk
    check (
      content_format in (
        'text','image','carousel','video','short_video','story','long_video','pin','thread'
      )
    ),
  constraint social_content_variant_versions_title_chk
    check (title is null or char_length(title) <= 500),
  constraint social_content_variant_versions_caption_chk
    check (caption is null or char_length(caption) <= 10000),
  constraint social_content_variant_versions_description_chk
    check (description is null or char_length(description) <= 10000),
  constraint social_content_variant_versions_cta_chk
    check (cta_text is null or char_length(cta_text) <= 500),
  constraint social_content_variant_versions_hashtags_chk
    check (hashtags is null or char_length(hashtags) <= 4000),
  constraint social_content_variant_versions_alt_chk
    check (alt_text is null or char_length(alt_text) <= 2000),
  constraint social_content_variant_versions_change_note_chk
    check (change_note is null or char_length(change_note) <= 2000),
  constraint social_content_variant_versions_provider_config_object_chk
    check (jsonb_typeof(provider_config) = 'object'),
  constraint social_content_variant_versions_provider_config_size_chk
    check (pg_catalog.octet_length(provider_config::text) <= 8192),
  constraint social_content_variant_versions_media_snapshot_array_chk
    check (jsonb_typeof(media_snapshot) = 'array'),
  constraint social_content_variant_versions_media_snapshot_size_chk
    check (pg_catalog.octet_length(media_snapshot::text) <= 32768),
  constraint social_content_variant_versions_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_content_variant_versions_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id) on delete restrict,
  constraint social_content_variant_versions_content_fk
    foreign key (organization_id, content_id)
    references public.social_content_items (organization_id, id) on delete restrict,
  constraint social_content_variant_versions_variant_fk
    foreign key (organization_id, variant_id)
    references public.social_content_variants (organization_id, id) on delete restrict,
  constraint social_content_variant_versions_previous_fk
    foreign key (organization_id, previous_version_id)
    references public.social_content_variant_versions (organization_id, id) on delete restrict,
  constraint social_content_variant_versions_created_by_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

comment on table public.social_content_variant_versions is
  'Immutable Platform Variant snapshots including ordered media_snapshot. Approval and schedule bind here.';

comment on column public.social_content_variant_versions.media_snapshot is
  'Frozen ordered attachments: [{asset_id, sort_order, asset_role, storage_object_key, mime_type, media_category}]. Not live joins.';

create index social_content_variant_versions_org_variant_idx
  on public.social_content_variant_versions (organization_id, variant_id, version_number desc);

alter table public.social_content_variant_versions enable row level security;
revoke all on table public.social_content_variant_versions from public;
revoke all on table public.social_content_variant_versions from anon;
revoke all on table public.social_content_variant_versions from authenticated;
revoke all on table public.social_content_variant_versions from service_role;
grant select on table public.social_content_variant_versions to authenticated;
create policy social_content_variant_versions_select_member
  on public.social_content_variant_versions for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_content_variant_versions from authenticated;
revoke insert, update, delete on table public.social_content_variant_versions from anon;

create or replace function private.guard_social_content_variant_version_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social content variant versions are immutable' using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_content_variant_version_immutable() from public;
revoke all on function private.guard_social_content_variant_version_immutable() from anon;
revoke all on function private.guard_social_content_variant_version_immutable() from authenticated;
revoke all on function private.guard_social_content_variant_version_immutable() from service_role;

create trigger social_content_variant_versions_guard_immutable
  before update or delete on public.social_content_variant_versions
  for each row execute function private.guard_social_content_variant_version_immutable();

-- Current version pointers on mutable parents
alter table public.social_content_items
  add column if not exists current_version_id uuid;

alter table public.social_content_variants
  add column if not exists current_version_id uuid;

alter table public.social_content_items
  drop constraint if exists social_content_items_current_version_fk;
alter table public.social_content_items
  add constraint social_content_items_current_version_fk
  foreign key (organization_id, current_version_id)
  references public.social_content_item_versions (organization_id, id)
  on delete restrict;

alter table public.social_content_variants
  drop constraint if exists social_content_variants_current_version_fk;
alter table public.social_content_variants
  add constraint social_content_variants_current_version_fk
  foreign key (organization_id, current_version_id)
  references public.social_content_variant_versions (organization_id, id)
  on delete restrict;

comment on column public.social_content_items.current_version_id is
  'Pointer to latest Master Content version snapshot. Same-org FK enforced.';

comment on column public.social_content_variants.current_version_id is
  'Pointer to latest Variant version snapshot. Approvals do not move with this pointer.';

-- ---------------------------------------------------------------------------
-- Review requests / comments / approvals
-- ---------------------------------------------------------------------------

create table public.social_review_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  content_id uuid not null,
  variant_id uuid not null,
  variant_version_id uuid not null,
  status text not null default 'open',
  approval_context text not null default 'internal',
  requested_by_member_id uuid not null,
  due_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  closed_at timestamptz,
  constraint social_review_requests_org_id_unique unique (organization_id, id),
  constraint social_review_requests_status_chk
    check (status in ('open', 'completed', 'cancelled', 'superseded')),
  constraint social_review_requests_approval_context_chk
    check (approval_context in ('internal', 'client')),
  constraint social_review_requests_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_review_requests_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id) on delete restrict,
  constraint social_review_requests_content_fk
    foreign key (organization_id, content_id)
    references public.social_content_items (organization_id, id) on delete restrict,
  constraint social_review_requests_variant_fk
    foreign key (organization_id, variant_id)
    references public.social_content_variants (organization_id, id) on delete restrict,
  constraint social_review_requests_version_fk
    foreign key (organization_id, variant_version_id)
    references public.social_content_variant_versions (organization_id, id) on delete restrict,
  constraint social_review_requests_requested_by_fk
    foreign key (organization_id, requested_by_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

comment on table public.social_review_requests is
  'Human review request bound to an exact variant version. Not Social Inbox.';

create index social_review_requests_org_workspace_status_idx
  on public.social_review_requests (organization_id, workspace_id, status);

create index social_review_requests_org_version_idx
  on public.social_review_requests (organization_id, variant_version_id);

create index social_review_requests_org_due_open_idx
  on public.social_review_requests (organization_id, due_at)
  where status = 'open' and due_at is not null;

create trigger social_review_requests_set_updated_at
  before update on public.social_review_requests
  for each row execute function public.set_updated_at();

alter table public.social_review_requests enable row level security;
revoke all on table public.social_review_requests from public;
revoke all on table public.social_review_requests from anon;
revoke all on table public.social_review_requests from authenticated;
revoke all on table public.social_review_requests from service_role;
grant select on table public.social_review_requests to authenticated;
create policy social_review_requests_select_member
  on public.social_review_requests for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_review_requests from authenticated;
revoke insert, update, delete on table public.social_review_requests from anon;

create table public.social_review_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  review_request_id uuid not null,
  variant_version_id uuid not null,
  body text not null,
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_review_comments_org_id_unique unique (organization_id, id),
  constraint social_review_comments_body_chk
    check (char_length(btrim(body)) > 0 and char_length(body) <= 4000),
  constraint social_review_comments_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_review_comments_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id) on delete restrict,
  constraint social_review_comments_request_fk
    foreign key (organization_id, review_request_id)
    references public.social_review_requests (organization_id, id) on delete restrict,
  constraint social_review_comments_version_fk
    foreign key (organization_id, variant_version_id)
    references public.social_content_variant_versions (organization_id, id) on delete restrict,
  constraint social_review_comments_created_by_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

comment on table public.social_review_comments is
  'Immutable internal review feedback. Not community/Social Inbox comments.';

create index social_review_comments_org_request_idx
  on public.social_review_comments (organization_id, review_request_id, created_at);

alter table public.social_review_comments enable row level security;
revoke all on table public.social_review_comments from public;
revoke all on table public.social_review_comments from anon;
revoke all on table public.social_review_comments from authenticated;
revoke all on table public.social_review_comments from service_role;
grant select on table public.social_review_comments to authenticated;
create policy social_review_comments_select_member
  on public.social_review_comments for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_review_comments from authenticated;
revoke insert, update, delete on table public.social_review_comments from anon;

create or replace function private.guard_social_review_comment_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social review comments are immutable' using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_review_comment_immutable() from public;
revoke all on function private.guard_social_review_comment_immutable() from anon;
revoke all on function private.guard_social_review_comment_immutable() from authenticated;
revoke all on function private.guard_social_review_comment_immutable() from service_role;

create trigger social_review_comments_guard_immutable
  before update or delete on public.social_review_comments
  for each row execute function private.guard_social_review_comment_immutable();

create table public.social_approval_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  content_id uuid not null,
  variant_id uuid not null,
  variant_version_id uuid not null,
  review_request_id uuid,
  approval_context text not null default 'internal',
  decision text not null,
  reason text,
  decided_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_approval_decisions_org_id_unique unique (organization_id, id),
  constraint social_approval_decisions_context_chk
    check (approval_context in ('internal', 'client')),
  constraint social_approval_decisions_decision_chk
    check (decision in ('approved', 'changes_requested', 'rejected')),
  constraint social_approval_decisions_reason_chk
    check (reason is null or char_length(reason) <= 4000),
  constraint social_approval_decisions_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_approval_decisions_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id) on delete restrict,
  constraint social_approval_decisions_content_fk
    foreign key (organization_id, content_id)
    references public.social_content_items (organization_id, id) on delete restrict,
  constraint social_approval_decisions_variant_fk
    foreign key (organization_id, variant_id)
    references public.social_content_variants (organization_id, id) on delete restrict,
  constraint social_approval_decisions_version_fk
    foreign key (organization_id, variant_version_id)
    references public.social_content_variant_versions (organization_id, id) on delete restrict,
  constraint social_approval_decisions_review_fk
    foreign key (organization_id, review_request_id)
    references public.social_review_requests (organization_id, id) on delete restrict,
  constraint social_approval_decisions_decided_by_fk
    foreign key (organization_id, decided_by_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

comment on table public.social_approval_decisions is
  'Append-only approval evidence for an exact variant version. Old decisions remain when a new version is created.';

create index social_approval_decisions_org_version_idx
  on public.social_approval_decisions (organization_id, variant_version_id, created_at desc);

create unique index social_approval_decisions_one_terminal_internal_uidx
  on public.social_approval_decisions (organization_id, variant_version_id, approval_context)
  where decision in ('approved', 'rejected') and approval_context = 'internal';

alter table public.social_approval_decisions enable row level security;
revoke all on table public.social_approval_decisions from public;
revoke all on table public.social_approval_decisions from anon;
revoke all on table public.social_approval_decisions from authenticated;
revoke all on table public.social_approval_decisions from service_role;
grant select on table public.social_approval_decisions to authenticated;
create policy social_approval_decisions_select_member
  on public.social_approval_decisions for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_approval_decisions from authenticated;
revoke insert, update, delete on table public.social_approval_decisions from anon;

create or replace function private.guard_social_approval_decision_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social approval decisions are immutable' using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_approval_decision_immutable() from public;
revoke all on function private.guard_social_approval_decision_immutable() from anon;
revoke all on function private.guard_social_approval_decision_immutable() from authenticated;
revoke all on function private.guard_social_approval_decision_immutable() from service_role;

create trigger social_approval_decisions_guard_immutable
  before update or delete on public.social_approval_decisions
  for each row execute function private.guard_social_approval_decision_immutable();

-- ---------------------------------------------------------------------------
-- Editorial schedule slots (not publication)
-- ---------------------------------------------------------------------------

create table public.social_content_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  content_id uuid not null,
  variant_id uuid not null,
  variant_version_id uuid not null,
  planned_at timestamptz not null,
  planning_timezone text not null,
  status text not null default 'active',
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  cancelled_at timestamptz,
  constraint social_content_schedule_slots_org_id_unique unique (organization_id, id),
  constraint social_content_schedule_slots_status_chk
    check (status in ('active', 'cancelled')),
  constraint social_content_schedule_slots_timezone_chk
    check (char_length(btrim(planning_timezone)) > 0 and char_length(planning_timezone) <= 64),
  constraint social_content_schedule_slots_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_content_schedule_slots_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id) on delete restrict,
  constraint social_content_schedule_slots_content_fk
    foreign key (organization_id, content_id)
    references public.social_content_items (organization_id, id) on delete restrict,
  constraint social_content_schedule_slots_variant_fk
    foreign key (organization_id, variant_id)
    references public.social_content_variants (organization_id, id) on delete restrict,
  constraint social_content_schedule_slots_version_fk
    foreign key (organization_id, variant_version_id)
    references public.social_content_variant_versions (organization_id, id) on delete restrict,
  constraint social_content_schedule_slots_created_by_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

comment on table public.social_content_schedule_slots is
  'Editorial planning intent bound to an exact variant version. Not a publication job. Calendar is a projection over these slots.';

create unique index social_content_schedule_slots_one_active_version_uidx
  on public.social_content_schedule_slots (organization_id, variant_version_id)
  where status = 'active';

create index social_content_schedule_slots_org_workspace_planned_idx
  on public.social_content_schedule_slots (organization_id, workspace_id, planned_at)
  where status = 'active';

create index social_content_schedule_slots_org_provider_planned_idx
  on public.social_content_schedule_slots (organization_id, planned_at)
  where status = 'active';

create trigger social_content_schedule_slots_set_updated_at
  before update on public.social_content_schedule_slots
  for each row execute function public.set_updated_at();

alter table public.social_content_schedule_slots enable row level security;
revoke all on table public.social_content_schedule_slots from public;
revoke all on table public.social_content_schedule_slots from anon;
revoke all on table public.social_content_schedule_slots from authenticated;
revoke all on table public.social_content_schedule_slots from service_role;
grant select on table public.social_content_schedule_slots to authenticated;
create policy social_content_schedule_slots_select_member
  on public.social_content_schedule_slots for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_content_schedule_slots from authenticated;
revoke insert, update, delete on table public.social_content_schedule_slots from anon;

-- ---------------------------------------------------------------------------
-- Workflow events (append-only)
-- ---------------------------------------------------------------------------

create table public.social_workflow_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  content_id uuid,
  variant_id uuid,
  variant_version_id uuid,
  review_request_id uuid,
  approval_decision_id uuid,
  schedule_slot_id uuid,
  event_type text not null,
  actor_source text not null,
  actor_member_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_workflow_events_org_id_unique unique (organization_id, id),
  constraint social_workflow_events_event_type_chk
    check (
      event_type in (
        'social_content_version_created',
        'social_variant_version_created',
        'social_review_requested',
        'social_review_cancelled',
        'social_review_superseded',
        'social_review_comment_added',
        'social_approval_decided',
        'social_schedule_created',
        'social_schedule_moved',
        'social_schedule_cancelled',
        'social_approval_policy_updated'
      )
    ),
  constraint social_workflow_events_actor_source_chk
    check (actor_source in ('member', 'system')),
  constraint social_workflow_events_payload_object_chk
    check (jsonb_typeof(payload) = 'object'),
  constraint social_workflow_events_organization_fk
    foreign key (organization_id) references public.organizations (id) on delete cascade,
  constraint social_workflow_events_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id) on delete cascade,
  constraint social_workflow_events_actor_member_fk
    foreign key (organization_id, actor_member_id)
    references public.organization_members (organization_id, id) on delete restrict
);

create or replace function private.guard_social_workflow_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social workflow events are immutable' using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_workflow_event_immutable() from public;
revoke all on function private.guard_social_workflow_event_immutable() from anon;
revoke all on function private.guard_social_workflow_event_immutable() from authenticated;
revoke all on function private.guard_social_workflow_event_immutable() from service_role;

create trigger social_workflow_events_guard_immutable
  before update or delete on public.social_workflow_events
  for each row execute function private.guard_social_workflow_event_immutable();

create index social_workflow_events_org_version_created_idx
  on public.social_workflow_events (organization_id, variant_version_id, created_at desc);

alter table public.social_workflow_events enable row level security;
revoke all on table public.social_workflow_events from public;
revoke all on table public.social_workflow_events from anon;
revoke all on table public.social_workflow_events from authenticated;
revoke all on table public.social_workflow_events from service_role;
grant select on table public.social_workflow_events to authenticated;
create policy social_workflow_events_select_owner_admin
  on public.social_workflow_events for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));
revoke insert, update, delete on table public.social_workflow_events from authenticated;
revoke insert, update, delete on table public.social_workflow_events from anon;
-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function private.can_approve_social_content(p_actor_role text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  -- Beta 1: internal staff approval (D). Owner/Admin/Staff may approve.
  select p_actor_role in ('owner', 'admin', 'staff');
$$;

revoke all on function private.can_approve_social_content(text) from public;
revoke all on function private.can_approve_social_content(text) from anon;
revoke all on function private.can_approve_social_content(text) from authenticated;
revoke all on function private.can_approve_social_content(text) from service_role;

create or replace function private.insert_social_workflow_event(
  p_organization_id uuid,
  p_brand_id uuid,
  p_workspace_id uuid,
  p_content_id uuid,
  p_variant_id uuid,
  p_variant_version_id uuid,
  p_review_request_id uuid,
  p_approval_decision_id uuid,
  p_schedule_slot_id uuid,
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
    raise exception 'invalid social workflow event payload' using errcode = 'P0001';
  end if;
  if v_payload ?| array[
    'access_token','refresh_token','token','ciphertext','iv','auth_tag',
    'authorization_code','client_secret','raw_state','state','encryption_key'
  ] then
    raise exception 'social workflow event payload contains forbidden secret keys' using errcode = 'P0001';
  end if;

  insert into public.social_workflow_events (
    organization_id, brand_id, workspace_id, content_id, variant_id, variant_version_id,
    review_request_id, approval_decision_id, schedule_slot_id,
    event_type, actor_source, actor_member_id, payload
  ) values (
    p_organization_id, p_brand_id, p_workspace_id, p_content_id, p_variant_id, p_variant_version_id,
    p_review_request_id, p_approval_decision_id, p_schedule_slot_id,
    p_event_type, p_actor_source, p_actor_member_id, v_payload
  ) returning id into v_event_id;
  return v_event_id;
end;
$$;

revoke all on function private.insert_social_workflow_event(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from public;
revoke all on function private.insert_social_workflow_event(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from anon;
revoke all on function private.insert_social_workflow_event(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from authenticated;
revoke all on function private.insert_social_workflow_event(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from service_role;

create or replace function private.is_valid_social_planning_timezone(p_timezone text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1 from pg_catalog.pg_timezone_names as t
    where t.name = p_timezone
  );
$$;

revoke all on function private.is_valid_social_planning_timezone(text) from public;
revoke all on function private.is_valid_social_planning_timezone(text) from anon;
revoke all on function private.is_valid_social_planning_timezone(text) from authenticated;
revoke all on function private.is_valid_social_planning_timezone(text) from service_role;

create or replace function private.build_social_variant_media_snapshot(
  p_organization_id uuid,
  p_variant_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_snapshot jsonb;
begin
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'asset_id', m.asset_id,
      'sort_order', m.sort_order,
      'asset_role', m.asset_role,
      'storage_object_key', a.storage_object_key,
      'mime_type', a.mime_type,
      'media_category', a.media_category
    ) order by m.sort_order
  ), '[]'::jsonb)
  into v_snapshot
  from public.social_variant_media as m
  join public.social_media_assets as a
    on a.organization_id = m.organization_id and a.id = m.asset_id
  where m.organization_id = p_organization_id
    and m.variant_id = p_variant_id;

  return coalesce(v_snapshot, '[]'::jsonb);
end;
$$;

revoke all on function private.build_social_variant_media_snapshot(uuid, uuid) from public;
revoke all on function private.build_social_variant_media_snapshot(uuid, uuid) from anon;
revoke all on function private.build_social_variant_media_snapshot(uuid, uuid) from authenticated;
revoke all on function private.build_social_variant_media_snapshot(uuid, uuid) from service_role;

-- ---------------------------------------------------------------------------
-- Version RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_social_content_item_version(
  p_organization_id uuid,
  p_content_id uuid,
  p_change_note text default null
)
returns table (result_code text, version_id uuid, version_number integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.social_content_items;
  v_ctx record;
  v_prev uuid;
  v_prev_number integer;
  v_number integer;
  v_id uuid;
  v_note text := nullif(btrim(coalesce(p_change_note, '')), '');
begin
  select c.* into v_item from public.social_content_items as c
  where c.organization_id = p_organization_id and c.id = p_content_id
  for update;
  if not found then return query select 'not_found'::text, null::uuid, null::integer; return; end if;
  if v_item.archived_at is not null then return query select 'conflict'::text, null::uuid, null::integer; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_item.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid, null::integer; return; end if;
  if v_note is not null and char_length(v_note) > 2000 then
    return query select 'invalid_input'::text, null::uuid, null::integer; return;
  end if;

  select v.id, v.version_number into v_prev, v_prev_number
  from public.social_content_item_versions as v
  where v.organization_id = p_organization_id and v.content_id = p_content_id
  order by v.version_number desc
  limit 1
  for update;

  v_number := coalesce(v_prev_number, 0) + 1;

  insert into public.social_content_item_versions (
    organization_id, brand_id, workspace_id, content_id, version_number,
    internal_title, concept_summary, primary_message, campaign_id, primary_pillar_id,
    origin_kind, previous_version_id, change_note, created_by_member_id
  ) values (
    p_organization_id, v_item.brand_id, v_item.workspace_id, p_content_id, v_number,
    v_item.internal_title, v_item.concept_summary, v_item.primary_message,
    v_item.campaign_id, v_item.primary_pillar_id, v_item.origin_kind,
    v_prev, v_note, v_ctx.membership_id
  ) returning id into v_id;

  update public.social_content_items
  set current_version_id = v_id
  where organization_id = p_organization_id and id = p_content_id;

  perform private.insert_social_workflow_event(
    p_organization_id, v_item.brand_id, v_item.workspace_id, p_content_id, null, null,
    null, null, null, 'social_content_version_created', 'member', v_ctx.membership_id,
    jsonb_build_object('version_id', v_id, 'version_number', v_number)
  );
  return query select 'success'::text, v_id, v_number;
end;
$$;

revoke all on function public.create_social_content_item_version(uuid, uuid, text) from public;
revoke all on function public.create_social_content_item_version(uuid, uuid, text) from anon;
revoke all on function public.create_social_content_item_version(uuid, uuid, text) from authenticated;
revoke all on function public.create_social_content_item_version(uuid, uuid, text) from service_role;
grant execute on function public.create_social_content_item_version(uuid, uuid, text) to authenticated;

create or replace function public.create_social_content_variant_version(
  p_organization_id uuid,
  p_variant_id uuid,
  p_change_note text default null
)
returns table (result_code text, version_id uuid, version_number integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant public.social_content_variants;
  v_ctx record;
  v_prev uuid;
  v_prev_number integer;
  v_number integer;
  v_id uuid;
  v_note text := nullif(btrim(coalesce(p_change_note, '')), '');
  v_media jsonb;
begin
  select v.* into v_variant from public.social_content_variants as v
  where v.organization_id = p_organization_id and v.id = p_variant_id
  for update;
  if not found then return query select 'not_found'::text, null::uuid, null::integer; return; end if;
  if v_variant.archived_at is not null then return query select 'conflict'::text, null::uuid, null::integer; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_variant.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid, null::integer; return; end if;
  if v_note is not null and char_length(v_note) > 2000 then
    return query select 'invalid_input'::text, null::uuid, null::integer; return;
  end if;

  select vv.id, vv.version_number into v_prev, v_prev_number
  from public.social_content_variant_versions as vv
  where vv.organization_id = p_organization_id and vv.variant_id = p_variant_id
  order by vv.version_number desc
  limit 1
  for update;

  v_number := coalesce(v_prev_number, 0) + 1;
  v_media := private.build_social_variant_media_snapshot(p_organization_id, p_variant_id);

  insert into public.social_content_variant_versions (
    organization_id, brand_id, workspace_id, content_id, variant_id, version_number,
    planned_provider, content_format, title, caption, description, cta_text, hashtags, alt_text,
    provider_config, media_snapshot, previous_version_id, change_note, created_by_member_id
  ) values (
    p_organization_id, v_variant.brand_id, v_variant.workspace_id, v_variant.content_id, p_variant_id, v_number,
    v_variant.planned_provider, v_variant.content_format, v_variant.title, v_variant.caption,
    v_variant.description, v_variant.cta_text, v_variant.hashtags, v_variant.alt_text,
    v_variant.provider_config, v_media, v_prev, v_note, v_ctx.membership_id
  ) returning id into v_id;

  update public.social_content_variants
  set current_version_id = v_id
  where organization_id = p_organization_id and id = p_variant_id;

  -- Supersede open reviews on previous version (do not retarget to new version)
  if v_prev is not null then
    update public.social_review_requests
    set status = 'superseded', closed_at = pg_catalog.now()
    where organization_id = p_organization_id
      and variant_version_id = v_prev
      and status = 'open';
    if found then
      perform private.insert_social_workflow_event(
        p_organization_id, v_variant.brand_id, v_variant.workspace_id, v_variant.content_id, p_variant_id, v_prev,
        null, null, null, 'social_review_superseded', 'system', v_ctx.membership_id,
        jsonb_build_object('previous_version_id', v_prev, 'new_version_id', v_id)
      );
    end if;
  end if;

  perform private.insert_social_workflow_event(
    p_organization_id, v_variant.brand_id, v_variant.workspace_id, v_variant.content_id, p_variant_id, v_id,
    null, null, null, 'social_variant_version_created', 'member', v_ctx.membership_id,
    jsonb_build_object('version_id', v_id, 'version_number', v_number)
  );
  return query select 'success'::text, v_id, v_number;
end;
$$;

revoke all on function public.create_social_content_variant_version(uuid, uuid, text) from public;
revoke all on function public.create_social_content_variant_version(uuid, uuid, text) from anon;
revoke all on function public.create_social_content_variant_version(uuid, uuid, text) from authenticated;
revoke all on function public.create_social_content_variant_version(uuid, uuid, text) from service_role;
grant execute on function public.create_social_content_variant_version(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Review / approval RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_social_review_request(
  p_organization_id uuid,
  p_variant_version_id uuid,
  p_due_at timestamptz default null,
  p_approval_context text default 'internal'
)
returns table (result_code text, review_request_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.social_content_variant_versions;
  v_ctx record;
  v_context text := coalesce(nullif(btrim(p_approval_context), ''), 'internal');
  v_id uuid;
begin
  select vv.* into v_version from public.social_content_variant_versions as vv
  where vv.organization_id = p_organization_id and vv.id = p_variant_version_id;
  if not found then return query select 'not_found'::text, null::uuid; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_version.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;

  if v_context not in ('internal', 'client') then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;
  -- Client portal deferred: only internal review requests executable in B1.5
  if v_context <> 'internal' then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  if exists (
    select 1 from public.social_review_requests as r
    where r.organization_id = p_organization_id
      and r.variant_version_id = p_variant_version_id
      and r.status = 'open'
  ) then
    return query select 'conflict'::text, null::uuid; return;
  end if;

  insert into public.social_review_requests (
    organization_id, brand_id, workspace_id, content_id, variant_id, variant_version_id,
    status, approval_context, requested_by_member_id, due_at
  ) values (
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_version.content_id,
    v_version.variant_id, p_variant_version_id, 'open', v_context, v_ctx.membership_id, p_due_at
  ) returning id into v_id;

  perform private.insert_social_workflow_event(
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_version.content_id,
    v_version.variant_id, p_variant_version_id, v_id, null, null,
    'social_review_requested', 'member', v_ctx.membership_id,
    jsonb_build_object('review_request_id', v_id)
  );
  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.create_social_review_request(uuid, uuid, timestamptz, text) from public;
revoke all on function public.create_social_review_request(uuid, uuid, timestamptz, text) from anon;
revoke all on function public.create_social_review_request(uuid, uuid, timestamptz, text) from authenticated;
revoke all on function public.create_social_review_request(uuid, uuid, timestamptz, text) from service_role;
grant execute on function public.create_social_review_request(uuid, uuid, timestamptz, text) to authenticated;

create or replace function public.cancel_social_review_request(
  p_organization_id uuid,
  p_review_request_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.social_review_requests;
  v_ctx record;
begin
  select r.* into v_req from public.social_review_requests as r
  where r.organization_id = p_organization_id and r.id = p_review_request_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;
  if v_req.status <> 'open' then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_req.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  update public.social_review_requests
  set status = 'cancelled', closed_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_review_request_id and status = 'open';

  perform private.insert_social_workflow_event(
    p_organization_id, v_req.brand_id, v_req.workspace_id, v_req.content_id,
    v_req.variant_id, v_req.variant_version_id, p_review_request_id, null, null,
    'social_review_cancelled', 'member', v_ctx.membership_id,
    jsonb_build_object('review_request_id', p_review_request_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.cancel_social_review_request(uuid, uuid) from public;
revoke all on function public.cancel_social_review_request(uuid, uuid) from anon;
revoke all on function public.cancel_social_review_request(uuid, uuid) from authenticated;
revoke all on function public.cancel_social_review_request(uuid, uuid) from service_role;
grant execute on function public.cancel_social_review_request(uuid, uuid) to authenticated;

create or replace function public.add_social_review_comment(
  p_organization_id uuid,
  p_review_request_id uuid,
  p_body text
)
returns table (result_code text, comment_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req public.social_review_requests;
  v_ctx record;
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  select r.* into v_req from public.social_review_requests as r
  where r.organization_id = p_organization_id and r.id = p_review_request_id;
  if not found then return query select 'not_found'::text, null::uuid; return; end if;
  if v_req.status <> 'open' then return query select 'conflict'::text, null::uuid; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_req.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;
  if char_length(v_body) = 0 or char_length(v_body) > 4000 then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  insert into public.social_review_comments (
    organization_id, brand_id, workspace_id, review_request_id, variant_version_id,
    body, created_by_member_id
  ) values (
    p_organization_id, v_req.brand_id, v_req.workspace_id, p_review_request_id,
    v_req.variant_version_id, v_body, v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_workflow_event(
    p_organization_id, v_req.brand_id, v_req.workspace_id, v_req.content_id,
    v_req.variant_id, v_req.variant_version_id, p_review_request_id, null, null,
    'social_review_comment_added', 'member', v_ctx.membership_id,
    jsonb_build_object('comment_id', v_id)
  );
  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.add_social_review_comment(uuid, uuid, text) from public;
revoke all on function public.add_social_review_comment(uuid, uuid, text) from anon;
revoke all on function public.add_social_review_comment(uuid, uuid, text) from authenticated;
revoke all on function public.add_social_review_comment(uuid, uuid, text) from service_role;
grant execute on function public.add_social_review_comment(uuid, uuid, text) to authenticated;

create or replace function public.submit_social_approval_decision(
  p_organization_id uuid,
  p_variant_version_id uuid,
  p_decision text,
  p_reason text default null,
  p_review_request_id uuid default null
)
returns table (result_code text, decision_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.social_content_variant_versions;
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
  v_decision text := btrim(coalesce(p_decision, ''));
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_req public.social_review_requests;
  v_id uuid;
  v_brand_archived timestamptz;
  v_workspace_archived timestamptz;
  v_workspace_id uuid;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated' using errcode = 'P0001';
  end if;

  select vv.* into v_version from public.social_content_variant_versions as vv
  where vv.organization_id = p_organization_id and vv.id = p_variant_version_id;
  if not found then return query select 'not_found'::text, null::uuid; return; end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_workspace_actor_membership(p_organization_id) as actor;
  if v_membership_id is null or not private.can_approve_social_content(v_member_role) then
    return query select 'forbidden'::text, null::uuid; return;
  end if;

  begin
    perform private.assert_active_organization_for_social_workspace_mutation(p_organization_id);
  exception when raise_exception then
    return query select 'forbidden'::text, null::uuid; return;
  end;

  select r.workspace_id, r.brand_archived_at, r.workspace_archived_at
  into v_workspace_id, v_brand_archived, v_workspace_archived
  from private.resolve_social_brand_workspace(p_organization_id, v_version.brand_id) as r;
  if v_workspace_id is null or v_brand_archived is not null or v_workspace_archived is not null then
    return query select 'conflict'::text, null::uuid; return;
  end if;

  if v_decision not in ('approved', 'changes_requested', 'rejected')
     or (v_reason is not null and char_length(v_reason) > 4000)
  then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  -- Self-approval allowed in Beta 1 (owner-operated / Staff creative workflows).
  -- Beta 1 executes internal context only.
  if p_review_request_id is not null then
    select r.* into v_req from public.social_review_requests as r
    where r.organization_id = p_organization_id and r.id = p_review_request_id
    for update;
    if not found then return query select 'not_found'::text, null::uuid; return; end if;
    if v_req.variant_version_id is distinct from p_variant_version_id then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
    if v_req.status <> 'open' then
      return query select 'conflict'::text, null::uuid; return;
    end if;
    if v_req.approval_context <> 'internal' then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
  end if;

  insert into public.social_approval_decisions (
    organization_id, brand_id, workspace_id, content_id, variant_id, variant_version_id,
    review_request_id, approval_context, decision, reason, decided_by_member_id
  ) values (
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_version.content_id,
    v_version.variant_id, p_variant_version_id, p_review_request_id, 'internal',
    v_decision, v_reason, v_membership_id
  ) returning id into v_id;

  if p_review_request_id is not null then
    update public.social_review_requests
    set status = 'completed', closed_at = pg_catalog.now()
    where organization_id = p_organization_id and id = p_review_request_id and status = 'open';
  end if;

  perform private.insert_social_workflow_event(
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_version.content_id,
    v_version.variant_id, p_variant_version_id, p_review_request_id, v_id, null,
    'social_approval_decided', 'member', v_membership_id,
    jsonb_build_object('decision_id', v_id, 'decision', v_decision)
  );
  return query select 'success'::text, v_id;
exception
  when unique_violation then
    return query select 'conflict'::text, null::uuid;
end;
$$;

revoke all on function public.submit_social_approval_decision(uuid, uuid, text, text, uuid) from public;
revoke all on function public.submit_social_approval_decision(uuid, uuid, text, text, uuid) from anon;
revoke all on function public.submit_social_approval_decision(uuid, uuid, text, text, uuid) from authenticated;
revoke all on function public.submit_social_approval_decision(uuid, uuid, text, text, uuid) from service_role;
grant execute on function public.submit_social_approval_decision(uuid, uuid, text, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Schedule RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_social_content_schedule_slot(
  p_organization_id uuid,
  p_variant_version_id uuid,
  p_planned_at timestamptz,
  p_planning_timezone text
)
returns table (result_code text, schedule_slot_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.social_content_variant_versions;
  v_variant public.social_content_variants;
  v_item public.social_content_items;
  v_ctx record;
  v_tz text := btrim(coalesce(p_planning_timezone, ''));
  v_id uuid;
begin
  select vv.* into v_version from public.social_content_variant_versions as vv
  where vv.organization_id = p_organization_id and vv.id = p_variant_version_id;
  if not found then return query select 'not_found'::text, null::uuid; return; end if;

  select v.* into v_variant from public.social_content_variants as v
  where v.organization_id = p_organization_id and v.id = v_version.variant_id;
  select c.* into v_item from public.social_content_items as c
  where c.organization_id = p_organization_id and c.id = v_version.content_id;
  if v_variant.archived_at is not null or v_item.archived_at is not null then
    return query select 'conflict'::text, null::uuid; return;
  end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_version.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;

  if p_planned_at is null
     or not private.is_valid_social_planning_timezone(v_tz)
  then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  insert into public.social_content_schedule_slots (
    organization_id, brand_id, workspace_id, content_id, variant_id, variant_version_id,
    planned_at, planning_timezone, status, created_by_member_id
  ) values (
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_version.content_id,
    v_version.variant_id, p_variant_version_id, p_planned_at, v_tz, 'active', v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_workflow_event(
    p_organization_id, v_version.brand_id, v_version.workspace_id, v_version.content_id,
    v_version.variant_id, p_variant_version_id, null, null, v_id,
    'social_schedule_created', 'member', v_ctx.membership_id,
    jsonb_build_object('schedule_slot_id', v_id, 'planning_timezone', v_tz)
  );
  return query select 'success'::text, v_id;
exception
  when unique_violation then
    return query select 'conflict'::text, null::uuid;
end;
$$;

revoke all on function public.create_social_content_schedule_slot(uuid, uuid, timestamptz, text) from public;
revoke all on function public.create_social_content_schedule_slot(uuid, uuid, timestamptz, text) from anon;
revoke all on function public.create_social_content_schedule_slot(uuid, uuid, timestamptz, text) from authenticated;
revoke all on function public.create_social_content_schedule_slot(uuid, uuid, timestamptz, text) from service_role;
grant execute on function public.create_social_content_schedule_slot(uuid, uuid, timestamptz, text) to authenticated;

create or replace function public.move_social_content_schedule_slot(
  p_organization_id uuid,
  p_schedule_slot_id uuid,
  p_planned_at timestamptz,
  p_planning_timezone text default null
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slot public.social_content_schedule_slots;
  v_ctx record;
  v_tz text;
begin
  select s.* into v_slot from public.social_content_schedule_slots as s
  where s.organization_id = p_organization_id and s.id = p_schedule_slot_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;
  if v_slot.status <> 'active' then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_slot.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  v_tz := coalesce(nullif(btrim(coalesce(p_planning_timezone, '')), ''), v_slot.planning_timezone);
  if p_planned_at is null or not private.is_valid_social_planning_timezone(v_tz) then
    return query select 'invalid_input'::text; return;
  end if;

  -- Move keeps the exact variant_version_id (no silent retarget)
  update public.social_content_schedule_slots
  set planned_at = p_planned_at, planning_timezone = v_tz
  where organization_id = p_organization_id and id = p_schedule_slot_id and status = 'active';

  perform private.insert_social_workflow_event(
    p_organization_id, v_slot.brand_id, v_slot.workspace_id, v_slot.content_id,
    v_slot.variant_id, v_slot.variant_version_id, null, null, p_schedule_slot_id,
    'social_schedule_moved', 'member', v_ctx.membership_id,
    jsonb_build_object('schedule_slot_id', p_schedule_slot_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.move_social_content_schedule_slot(uuid, uuid, timestamptz, text) from public;
revoke all on function public.move_social_content_schedule_slot(uuid, uuid, timestamptz, text) from anon;
revoke all on function public.move_social_content_schedule_slot(uuid, uuid, timestamptz, text) from authenticated;
revoke all on function public.move_social_content_schedule_slot(uuid, uuid, timestamptz, text) from service_role;
grant execute on function public.move_social_content_schedule_slot(uuid, uuid, timestamptz, text) to authenticated;

create or replace function public.cancel_social_content_schedule_slot(
  p_organization_id uuid,
  p_schedule_slot_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slot public.social_content_schedule_slots;
  v_ctx record;
begin
  select s.* into v_slot from public.social_content_schedule_slots as s
  where s.organization_id = p_organization_id and s.id = p_schedule_slot_id
  for update;
  if not found then return query select 'not_found'::text; return; end if;
  if v_slot.status <> 'active' then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_content_mutation_context(p_organization_id, v_slot.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  update public.social_content_schedule_slots
  set status = 'cancelled', cancelled_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_schedule_slot_id and status = 'active';

  perform private.insert_social_workflow_event(
    p_organization_id, v_slot.brand_id, v_slot.workspace_id, v_slot.content_id,
    v_slot.variant_id, v_slot.variant_version_id, null, null, p_schedule_slot_id,
    'social_schedule_cancelled', 'member', v_ctx.membership_id,
    jsonb_build_object('schedule_slot_id', p_schedule_slot_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.cancel_social_content_schedule_slot(uuid, uuid) from public;
revoke all on function public.cancel_social_content_schedule_slot(uuid, uuid) from anon;
revoke all on function public.cancel_social_content_schedule_slot(uuid, uuid) from authenticated;
revoke all on function public.cancel_social_content_schedule_slot(uuid, uuid) from service_role;
grant execute on function public.cancel_social_content_schedule_slot(uuid, uuid) to authenticated;

create or replace function public.update_social_workspace_approval_policy(
  p_organization_id uuid,
  p_workspace_id uuid,
  p_internal_approval_required boolean,
  p_client_approval_required boolean
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ws public.social_workspaces;
  v_actor_user_id uuid := auth.uid();
  v_membership_id uuid;
  v_member_role text;
begin
  if v_actor_user_id is null then
    raise exception 'not authenticated' using errcode = 'P0001';
  end if;
  if p_internal_approval_required is null or p_client_approval_required is null then
    return query select 'invalid_input'::text; return;
  end if;

  select w.* into v_ws from public.social_workspaces as w
  where w.organization_id = p_organization_id and w.id = p_workspace_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_ws.archived_at is not null then return query select 'conflict'::text; return; end if;

  select actor.membership_id, actor.member_role
  into v_membership_id, v_member_role
  from private.get_social_workspace_actor_membership(p_organization_id) as actor;
  if v_membership_id is null or v_member_role not in ('owner', 'admin') then
    return query select 'forbidden'::text; return;
  end if;

  begin
    perform private.assert_active_organization_for_social_workspace_mutation(p_organization_id);
  exception when raise_exception then
    return query select 'forbidden'::text; return;
  end;

  update public.social_workspaces
  set
    internal_approval_required = p_internal_approval_required,
    client_approval_required = p_client_approval_required
  where organization_id = p_organization_id and id = p_workspace_id and archived_at is null;

  perform private.insert_social_workflow_event(
    p_organization_id, v_ws.brand_id, p_workspace_id, null, null, null, null, null, null,
    'social_approval_policy_updated', 'member', v_membership_id,
    jsonb_build_object(
      'internal_approval_required', p_internal_approval_required,
      'client_approval_required', p_client_approval_required
    )
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.update_social_workspace_approval_policy(uuid, uuid, boolean, boolean) from public;
revoke all on function public.update_social_workspace_approval_policy(uuid, uuid, boolean, boolean) from anon;
revoke all on function public.update_social_workspace_approval_policy(uuid, uuid, boolean, boolean) from authenticated;
revoke all on function public.update_social_workspace_approval_policy(uuid, uuid, boolean, boolean) from service_role;
grant execute on function public.update_social_workspace_approval_policy(uuid, uuid, boolean, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Workflow readiness (editorial) â€” NOT provider publishability
-- ---------------------------------------------------------------------------

create or replace function public.evaluate_social_variant_version_workflow_readiness(
  p_organization_id uuid,
  p_variant_version_id uuid
)
returns table (
  result_code text,
  workflow_ready boolean,
  has_internal_approval boolean,
  has_client_approval boolean,
  internal_approval_required boolean,
  client_approval_required boolean,
  has_active_schedule boolean,
  media_assets_available boolean,
  is_overdue_review boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.social_content_variant_versions;
  v_ws public.social_workspaces;
  v_variant_archived timestamptz;
  v_content_archived timestamptz;
  v_internal_req boolean;
  v_client_req boolean;
  v_has_internal boolean := false;
  v_has_client boolean := false;
  v_has_schedule boolean := false;
  v_media_ok boolean := true;
  v_overdue boolean := false;
  v_ready boolean := false;
  v_elem jsonb;
  v_asset_id uuid;
  v_asset_archived timestamptz;
begin
  if not private.is_org_member(p_organization_id) then
    return query select 'forbidden'::text, false, false, false, false, false, false, false, false;
    return;
  end if;

  select vv.* into v_version from public.social_content_variant_versions as vv
  where vv.organization_id = p_organization_id and vv.id = p_variant_version_id;
  if not found then
    return query select 'not_found'::text, false, false, false, false, false, false, false, false;
    return;
  end if;

  select w.* into v_ws from public.social_workspaces as w
  where w.organization_id = p_organization_id and w.id = v_version.workspace_id;
  select v.archived_at into v_variant_archived from public.social_content_variants as v
  where v.organization_id = p_organization_id and v.id = v_version.variant_id;
  select c.archived_at into v_content_archived from public.social_content_items as c
  where c.organization_id = p_organization_id and c.id = v_version.content_id;

  v_internal_req := coalesce(v_ws.internal_approval_required, true);
  v_client_req := coalesce(v_ws.client_approval_required, false);

  select exists (
    select 1 from public.social_approval_decisions as d
    where d.organization_id = p_organization_id
      and d.variant_version_id = p_variant_version_id
      and d.approval_context = 'internal'
      and d.decision = 'approved'
  ) into v_has_internal;

  select exists (
    select 1 from public.social_approval_decisions as d
    where d.organization_id = p_organization_id
      and d.variant_version_id = p_variant_version_id
      and d.approval_context = 'client'
      and d.decision = 'approved'
  ) into v_has_client;

  select exists (
    select 1 from public.social_content_schedule_slots as s
    where s.organization_id = p_organization_id
      and s.variant_version_id = p_variant_version_id
      and s.status = 'active'
  ) into v_has_schedule;

  select exists (
    select 1 from public.social_review_requests as r
    where r.organization_id = p_organization_id
      and r.variant_version_id = p_variant_version_id
      and r.status = 'open'
      and r.due_at is not null
      and r.due_at < pg_catalog.now()
  ) into v_overdue;

  for v_elem in
    select value from jsonb_array_elements(coalesce(v_version.media_snapshot, '[]'::jsonb))
  loop
    begin
      v_asset_id := (v_elem->>'asset_id')::uuid;
    exception when others then
      v_media_ok := false;
      exit;
    end;
    select a.archived_at into v_asset_archived
    from public.social_media_assets as a
    where a.organization_id = p_organization_id and a.id = v_asset_id;
    if not found or v_asset_archived is not null then
      v_media_ok := false;
      exit;
    end if;
  end loop;

  v_ready :=
    v_ws.archived_at is null
    and v_variant_archived is null
    and v_content_archived is null
    and v_media_ok
    and (not v_internal_req or v_has_internal)
    and (not v_client_req or v_has_client);

  return query select
    'success'::text,
    v_ready,
    v_has_internal,
    v_has_client,
    v_internal_req,
    v_client_req,
    v_has_schedule,
    v_media_ok,
    v_overdue;
end;
$$;

revoke all on function public.evaluate_social_variant_version_workflow_readiness(uuid, uuid) from public;
revoke all on function public.evaluate_social_variant_version_workflow_readiness(uuid, uuid) from anon;
revoke all on function public.evaluate_social_variant_version_workflow_readiness(uuid, uuid) from authenticated;
revoke all on function public.evaluate_social_variant_version_workflow_readiness(uuid, uuid) from service_role;
grant execute on function public.evaluate_social_variant_version_workflow_readiness(uuid, uuid) to authenticated;

