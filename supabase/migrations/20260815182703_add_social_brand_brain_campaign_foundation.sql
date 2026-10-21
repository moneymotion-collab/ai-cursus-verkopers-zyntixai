-- SMM-B1.3 — Brand Brain + Strategy + Campaign Foundation
-- Additive Brand Brain context + provider-neutral campaigns.
-- No Master Content, media, calendar, approval, publishing, analytics, or provider runtime.
-- Canonical brand truth provenance excludes ai_inferred (AI suggestions are not Brand Brain rows).

-- ---------------------------------------------------------------------------
-- Workspace composite uniqueness for Brand+Workspace integrity FKs
-- ---------------------------------------------------------------------------

alter table public.social_workspaces
  add constraint social_workspaces_org_brand_id_unique
  unique (organization_id, brand_id, id);

-- ---------------------------------------------------------------------------
-- Extend social_brands with Brand Profile (canonical identity context)
-- ---------------------------------------------------------------------------

alter table public.social_brands
  add column summary text,
  add column positioning text,
  add column primary_language text,
  add column website_url text,
  add column voice_config jsonb not null default '{}'::jsonb,
  add column profile_source_kind text not null default 'user_entered',
  add constraint social_brands_summary_length_chk
    check (summary is null or char_length(summary) <= 4000),
  add constraint social_brands_positioning_length_chk
    check (positioning is null or char_length(positioning) <= 2000),
  add constraint social_brands_primary_language_length_chk
    check (primary_language is null or char_length(btrim(primary_language)) between 2 and 32),
  add constraint social_brands_website_url_length_chk
    check (website_url is null or char_length(website_url) <= 2048),
  add constraint social_brands_voice_config_object_chk
    check (jsonb_typeof(voice_config) = 'object'),
  add constraint social_brands_voice_config_size_chk
    check (pg_catalog.octet_length(voice_config::text) <= 8192),
  add constraint social_brands_profile_source_kind_chk
    check (
      profile_source_kind in (
        'user_entered',
        'imported',
        'system_derived',
        'manually_verified'
      )
    );

comment on column public.social_brands.summary is
  'Human-authored brand summary. Canonical Brand Brain truth; not AI inference.';
comment on column public.social_brands.voice_config is
  'Validated structured voice/tone config object (formality, principles, descriptors). Not a free-form prompt dump. Max 8KiB.';
comment on column public.social_brands.profile_source_kind is
  'Provenance for Brand Profile truth. ai_inferred is intentionally excluded from canonical Brand rows.';

comment on table public.social_brands is
  'Social Brand identity + Brand Profile foundation (SMM-B1.2/B1.3). Brand Brain child tables hold rules/audiences/pillars/goals/strategies. Optional customer_id links CRM customers.';

-- ---------------------------------------------------------------------------
-- social_brand_rules
-- ---------------------------------------------------------------------------

create table public.social_brand_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  rule_kind text not null,
  title text not null,
  body text not null,
  sort_order integer not null default 0,
  source_kind text not null default 'user_entered',
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_brand_rules_org_id_unique unique (organization_id, id),
  constraint social_brand_rules_rule_kind_chk
    check (
      rule_kind in (
        'communication_principle',
        'prohibited_claim',
        'topic_avoid',
        'required_disclaimer',
        'forbidden_vocabulary',
        'cta_restriction',
        'factual_constraint'
      )
    ),
  constraint social_brand_rules_title_chk
    check (char_length(btrim(title)) > 0 and char_length(title) <= 200),
  constraint social_brand_rules_body_chk
    check (char_length(btrim(body)) > 0 and char_length(body) <= 4000),
  constraint social_brand_rules_source_kind_chk
    check (
      source_kind in (
        'user_entered',
        'imported',
        'system_derived',
        'manually_verified'
      )
    ),
  constraint social_brand_rules_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_brand_rules_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete restrict,
  constraint social_brand_rules_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_brand_rules is
  'Canonical Brand Rules (voice constraints, prohibited claims, CTA restrictions). Not automated policy enforcement. AI cannot silently rewrite these rows.';

create index social_brand_rules_org_brand_active_idx
  on public.social_brand_rules (organization_id, brand_id)
  where archived_at is null;

create trigger social_brand_rules_set_updated_at
  before update on public.social_brand_rules
  for each row
  execute function public.set_updated_at();

alter table public.social_brand_rules enable row level security;
revoke all on table public.social_brand_rules from public;
revoke all on table public.social_brand_rules from anon;
revoke all on table public.social_brand_rules from authenticated;
revoke all on table public.social_brand_rules from service_role;
grant select on table public.social_brand_rules to authenticated;
create policy social_brand_rules_select_member
  on public.social_brand_rules for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_brand_rules from authenticated;
revoke insert, update, delete on table public.social_brand_rules from anon;

-- ---------------------------------------------------------------------------
-- social_audiences
-- ---------------------------------------------------------------------------

create table public.social_audiences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  display_name text not null,
  description text,
  needs text,
  desired_outcome text,
  priority integer not null default 100,
  source_kind text not null default 'user_entered',
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_audiences_org_id_unique unique (organization_id, id),
  constraint social_audiences_display_name_chk
    check (char_length(btrim(display_name)) > 0 and char_length(display_name) <= 200),
  constraint social_audiences_description_chk
    check (description is null or char_length(description) <= 2000),
  constraint social_audiences_needs_chk
    check (needs is null or char_length(needs) <= 2000),
  constraint social_audiences_desired_outcome_chk
    check (desired_outcome is null or char_length(desired_outcome) <= 2000),
  constraint social_audiences_source_kind_chk
    check (
      source_kind in (
        'user_entered',
        'imported',
        'system_derived',
        'manually_verified'
      )
    ),
  constraint social_audiences_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_audiences_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete restrict,
  constraint social_audiences_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_audiences is
  'Provider-neutral Brand audiences. Not surveillance/PII profiling. Historical campaign joins remain valid after archive.';

create index social_audiences_org_brand_active_idx
  on public.social_audiences (organization_id, brand_id)
  where archived_at is null;

create trigger social_audiences_set_updated_at
  before update on public.social_audiences
  for each row
  execute function public.set_updated_at();

alter table public.social_audiences enable row level security;
revoke all on table public.social_audiences from public;
revoke all on table public.social_audiences from anon;
revoke all on table public.social_audiences from authenticated;
revoke all on table public.social_audiences from service_role;
grant select on table public.social_audiences to authenticated;
create policy social_audiences_select_member
  on public.social_audiences for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_audiences from authenticated;
revoke insert, update, delete on table public.social_audiences from anon;

-- ---------------------------------------------------------------------------
-- social_content_pillars
-- ---------------------------------------------------------------------------

create table public.social_content_pillars (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  display_name text not null,
  description text,
  sort_order integer not null default 0,
  source_kind text not null default 'user_entered',
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_content_pillars_org_id_unique unique (organization_id, id),
  constraint social_content_pillars_display_name_chk
    check (char_length(btrim(display_name)) > 0 and char_length(display_name) <= 200),
  constraint social_content_pillars_description_chk
    check (description is null or char_length(description) <= 2000),
  constraint social_content_pillars_source_kind_chk
    check (
      source_kind in (
        'user_entered',
        'imported',
        'system_derived',
        'manually_verified'
      )
    ),
  constraint social_content_pillars_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_content_pillars_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete restrict,
  constraint social_content_pillars_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_content_pillars is
  'Provider-neutral content pillars. Future Master Content may reference these. No content items in B1.3.';

create index social_content_pillars_org_brand_active_idx
  on public.social_content_pillars (organization_id, brand_id)
  where archived_at is null;

create trigger social_content_pillars_set_updated_at
  before update on public.social_content_pillars
  for each row
  execute function public.set_updated_at();

alter table public.social_content_pillars enable row level security;
revoke all on table public.social_content_pillars from public;
revoke all on table public.social_content_pillars from anon;
revoke all on table public.social_content_pillars from authenticated;
revoke all on table public.social_content_pillars from service_role;
grant select on table public.social_content_pillars to authenticated;
create policy social_content_pillars_select_member
  on public.social_content_pillars for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_content_pillars from authenticated;
revoke insert, update, delete on table public.social_content_pillars from anon;

-- ---------------------------------------------------------------------------
-- social_goals
-- ---------------------------------------------------------------------------

create table public.social_goals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  goal_kind text not null,
  display_name text not null,
  description text,
  priority integer not null default 100,
  success_criteria jsonb not null default '{}'::jsonb,
  source_kind text not null default 'user_entered',
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_goals_org_id_unique unique (organization_id, id),
  constraint social_goals_goal_kind_chk
    check (
      goal_kind in (
        'awareness',
        'engagement',
        'lead_generation',
        'customer_education',
        'recruitment',
        'retention',
        'product_launch',
        'traffic',
        'sales_support',
        'community_growth',
        'other'
      )
    ),
  constraint social_goals_display_name_chk
    check (char_length(btrim(display_name)) > 0 and char_length(display_name) <= 200),
  constraint social_goals_description_chk
    check (description is null or char_length(description) <= 2000),
  constraint social_goals_success_criteria_object_chk
    check (jsonb_typeof(success_criteria) = 'object'),
  constraint social_goals_success_criteria_size_chk
    check (pg_catalog.octet_length(success_criteria::text) <= 4096),
  constraint social_goals_source_kind_chk
    check (
      source_kind in (
        'user_entered',
        'imported',
        'system_derived',
        'manually_verified'
      )
    ),
  constraint social_goals_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_goals_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete restrict,
  constraint social_goals_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_goals is
  'Social business/social intent goals. success_criteria is structured planning intent only — not analytics truth.';

comment on column public.social_goals.success_criteria is
  'Bounded JSON object describing future evaluation intent (e.g. {\"metric\":\"qualified_leads\",\"operator\":\">=\",\"value\":10}). Not measured results.';

create index social_goals_org_brand_active_idx
  on public.social_goals (organization_id, brand_id)
  where archived_at is null;

create trigger social_goals_set_updated_at
  before update on public.social_goals
  for each row
  execute function public.set_updated_at();

alter table public.social_goals enable row level security;
revoke all on table public.social_goals from public;
revoke all on table public.social_goals from anon;
revoke all on table public.social_goals from authenticated;
revoke all on table public.social_goals from service_role;
grant select on table public.social_goals to authenticated;
create policy social_goals_select_member
  on public.social_goals for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_goals from authenticated;
revoke insert, update, delete on table public.social_goals from anon;

-- ---------------------------------------------------------------------------
-- social_platform_strategies (planned provider intent ≠ runtime support)
-- ---------------------------------------------------------------------------

create table public.social_platform_strategies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  planned_provider text not null,
  strategic_role text,
  objective text,
  content_style text,
  intended_frequency text,
  source_kind text not null default 'user_entered',
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_platform_strategies_org_id_unique unique (organization_id, id),
  constraint social_platform_strategies_brand_provider_uidx
    unique (organization_id, brand_id, planned_provider),
  constraint social_platform_strategies_planned_provider_chk
    check (
      planned_provider in (
        'instagram',
        'facebook',
        'threads',
        'tiktok',
        'linkedin',
        'youtube',
        'pinterest',
        'x'
      )
    ),
  constraint social_platform_strategies_strategic_role_chk
    check (strategic_role is null or char_length(strategic_role) <= 500),
  constraint social_platform_strategies_objective_chk
    check (objective is null or char_length(objective) <= 1000),
  constraint social_platform_strategies_content_style_chk
    check (content_style is null or char_length(content_style) <= 1000),
  constraint social_platform_strategies_intended_frequency_chk
    check (intended_frequency is null or char_length(intended_frequency) <= 200),
  constraint social_platform_strategies_source_kind_chk
    check (
      source_kind in (
        'user_entered',
        'imported',
        'system_derived',
        'manually_verified'
      )
    ),
  constraint social_platform_strategies_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_platform_strategies_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete restrict,
  constraint social_platform_strategies_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_platform_strategies is
  'Strategic planned-provider intent for a Brand. Does NOT enable OAuth, publishing, or connection DB CHECKs. Runtime implemented provider remains Instagram only.';

create index social_platform_strategies_org_brand_active_idx
  on public.social_platform_strategies (organization_id, brand_id)
  where archived_at is null;

create trigger social_platform_strategies_set_updated_at
  before update on public.social_platform_strategies
  for each row
  execute function public.set_updated_at();

alter table public.social_platform_strategies enable row level security;
revoke all on table public.social_platform_strategies from public;
revoke all on table public.social_platform_strategies from anon;
revoke all on table public.social_platform_strategies from authenticated;
revoke all on table public.social_platform_strategies from service_role;
grant select on table public.social_platform_strategies to authenticated;
create policy social_platform_strategies_select_member
  on public.social_platform_strategies for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_platform_strategies from authenticated;
revoke insert, update, delete on table public.social_platform_strategies from anon;

-- ---------------------------------------------------------------------------
-- social_campaigns
-- ---------------------------------------------------------------------------

create table public.social_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  display_name text not null,
  description text,
  goal_id uuid,
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  success_criteria jsonb not null default '{}'::jsonb,
  created_by_member_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  archived_at timestamptz,
  constraint social_campaigns_org_id_unique unique (organization_id, id),
  constraint social_campaigns_display_name_chk
    check (char_length(btrim(display_name)) > 0 and char_length(display_name) <= 200),
  constraint social_campaigns_description_chk
    check (description is null or char_length(description) <= 4000),
  constraint social_campaigns_status_chk
    check (status in ('draft', 'active', 'completed')),
  constraint social_campaigns_dates_chk
    check (
      starts_at is null
      or ends_at is null
      or ends_at >= starts_at
    ),
  constraint social_campaigns_success_criteria_object_chk
    check (jsonb_typeof(success_criteria) = 'object'),
  constraint social_campaigns_success_criteria_size_chk
    check (pg_catalog.octet_length(success_criteria::text) <= 4096),
  constraint social_campaigns_archive_status_chk
    check (
      (archived_at is null)
      or (status in ('draft', 'active', 'completed'))
    ),
  constraint social_campaigns_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_campaigns_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete restrict,
  constraint social_campaigns_goal_fk
    foreign key (organization_id, goal_id)
    references public.social_goals (organization_id, id)
    on delete restrict,
  constraint social_campaigns_created_by_member_fk
    foreign key (organization_id, created_by_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.social_campaigns is
  'Provider-neutral Social campaigns. No Master Content, publication state, or analytics truth. Soft archive via archived_at.';

create index social_campaigns_org_workspace_status_idx
  on public.social_campaigns (organization_id, workspace_id, status)
  where archived_at is null;

create index social_campaigns_org_brand_idx
  on public.social_campaigns (organization_id, brand_id);

create trigger social_campaigns_set_updated_at
  before update on public.social_campaigns
  for each row
  execute function public.set_updated_at();

alter table public.social_campaigns enable row level security;
revoke all on table public.social_campaigns from public;
revoke all on table public.social_campaigns from anon;
revoke all on table public.social_campaigns from authenticated;
revoke all on table public.social_campaigns from service_role;
grant select on table public.social_campaigns to authenticated;
create policy social_campaigns_select_member
  on public.social_campaigns for select to authenticated
  using (private.is_org_member(organization_id));
revoke insert, update, delete on table public.social_campaigns from authenticated;
revoke insert, update, delete on table public.social_campaigns from anon;

-- ---------------------------------------------------------------------------
-- Campaign joins
-- ---------------------------------------------------------------------------

create table public.social_campaign_audiences (
  organization_id uuid not null,
  campaign_id uuid not null,
  audience_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (organization_id, campaign_id, audience_id),
  constraint social_campaign_audiences_campaign_fk
    foreign key (organization_id, campaign_id)
    references public.social_campaigns (organization_id, id)
    on delete cascade,
  constraint social_campaign_audiences_audience_fk
    foreign key (organization_id, audience_id)
    references public.social_audiences (organization_id, id)
    on delete restrict
);

create table public.social_campaign_platforms (
  organization_id uuid not null,
  campaign_id uuid not null,
  planned_provider text not null,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (organization_id, campaign_id, planned_provider),
  constraint social_campaign_platforms_planned_provider_chk
    check (
      planned_provider in (
        'instagram',
        'facebook',
        'threads',
        'tiktok',
        'linkedin',
        'youtube',
        'pinterest',
        'x'
      )
    ),
  constraint social_campaign_platforms_campaign_fk
    foreign key (organization_id, campaign_id)
    references public.social_campaigns (organization_id, id)
    on delete cascade
);

comment on table public.social_campaign_platforms is
  'Campaign planned-provider targets. Strategic intent only — does not imply provider runtime/OAuth/publishing support.';

create table public.social_campaign_pillars (
  organization_id uuid not null,
  campaign_id uuid not null,
  pillar_id uuid not null,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (organization_id, campaign_id, pillar_id),
  constraint social_campaign_pillars_campaign_fk
    foreign key (organization_id, campaign_id)
    references public.social_campaigns (organization_id, id)
    on delete cascade,
  constraint social_campaign_pillars_pillar_fk
    foreign key (organization_id, pillar_id)
    references public.social_content_pillars (organization_id, id)
    on delete restrict
);

alter table public.social_campaign_audiences enable row level security;
alter table public.social_campaign_platforms enable row level security;
alter table public.social_campaign_pillars enable row level security;

revoke all on table public.social_campaign_audiences from public, anon, authenticated, service_role;
revoke all on table public.social_campaign_platforms from public, anon, authenticated, service_role;
revoke all on table public.social_campaign_pillars from public, anon, authenticated, service_role;

grant select on table public.social_campaign_audiences to authenticated;
grant select on table public.social_campaign_platforms to authenticated;
grant select on table public.social_campaign_pillars to authenticated;

create policy social_campaign_audiences_select_member
  on public.social_campaign_audiences for select to authenticated
  using (private.is_org_member(organization_id));
create policy social_campaign_platforms_select_member
  on public.social_campaign_platforms for select to authenticated
  using (private.is_org_member(organization_id));
create policy social_campaign_pillars_select_member
  on public.social_campaign_pillars for select to authenticated
  using (private.is_org_member(organization_id));

revoke insert, update, delete on table public.social_campaign_audiences from authenticated, anon;
revoke insert, update, delete on table public.social_campaign_platforms from authenticated, anon;
revoke insert, update, delete on table public.social_campaign_pillars from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Append-only Brand Brain / Campaign events
-- ---------------------------------------------------------------------------

create table public.social_brand_brain_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  brand_id uuid not null,
  workspace_id uuid not null,
  campaign_id uuid,
  event_type text not null,
  actor_source text not null,
  actor_member_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.now(),
  constraint social_brand_brain_events_org_id_unique unique (organization_id, id),
  constraint social_brand_brain_events_event_type_chk
    check (
      event_type in (
        'social_brand_profile_updated',
        'social_brand_rule_created',
        'social_brand_rule_archived',
        'social_audience_created',
        'social_audience_archived',
        'social_content_pillar_created',
        'social_content_pillar_archived',
        'social_goal_created',
        'social_goal_archived',
        'social_platform_strategy_upserted',
        'social_platform_strategy_archived',
        'social_campaign_created',
        'social_campaign_updated',
        'social_campaign_archived',
        'social_campaign_assignments_replaced'
      )
    ),
  constraint social_brand_brain_events_actor_source_chk
    check (actor_source in ('member', 'system')),
  constraint social_brand_brain_events_payload_object_chk
    check (jsonb_typeof(payload) = 'object'),
  constraint social_brand_brain_events_organization_fk
    foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint social_brand_brain_events_brand_workspace_fk
    foreign key (organization_id, brand_id, workspace_id)
    references public.social_workspaces (organization_id, brand_id, id)
    on delete cascade,
  constraint social_brand_brain_events_campaign_fk
    foreign key (organization_id, campaign_id)
    references public.social_campaigns (organization_id, id)
    on delete cascade,
  constraint social_brand_brain_events_actor_member_fk
    foreign key (organization_id, actor_member_id)
    references public.organization_members (organization_id, id)
    on delete restrict
);

create or replace function private.guard_social_brand_brain_event_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'social brand brain events are immutable'
    using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_social_brand_brain_event_immutable() from public, anon, authenticated, service_role;

create trigger social_brand_brain_events_guard_immutable
  before update or delete on public.social_brand_brain_events
  for each row
  execute function private.guard_social_brand_brain_event_immutable();

create index social_brand_brain_events_org_brand_created_idx
  on public.social_brand_brain_events (organization_id, brand_id, created_at desc);

alter table public.social_brand_brain_events enable row level security;
revoke all on table public.social_brand_brain_events from public, anon, authenticated, service_role;
grant select on table public.social_brand_brain_events to authenticated;
create policy social_brand_brain_events_select_owner_admin
  on public.social_brand_brain_events for select to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));
revoke insert, update, delete on table public.social_brand_brain_events from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Private helpers
-- ---------------------------------------------------------------------------

create or replace function private.resolve_social_brand_workspace(
  p_organization_id uuid,
  p_brand_id uuid
)
returns table (
  brand_id uuid,
  workspace_id uuid,
  brand_archived_at timestamptz,
  workspace_archived_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    sb.id,
    sw.id,
    sb.archived_at,
    sw.archived_at
  from public.social_brands as sb
  inner join public.social_workspaces as sw
    on sw.organization_id = sb.organization_id
   and sw.brand_id = sb.id
  where sb.organization_id = p_organization_id
    and sb.id = p_brand_id
  limit 1;
$$;

revoke all on function private.resolve_social_brand_workspace(uuid, uuid) from public, anon, authenticated, service_role;

create or replace function private.insert_social_brand_brain_event(
  p_organization_id uuid,
  p_brand_id uuid,
  p_workspace_id uuid,
  p_campaign_id uuid,
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
    raise exception 'invalid social brand brain event payload'
      using errcode = 'P0001';
  end if;

  if v_payload ?| array[
    'access_token', 'refresh_token', 'token', 'ciphertext', 'iv', 'auth_tag',
    'authorization_code', 'client_secret', 'raw_state', 'state', 'encryption_key'
  ] then
    raise exception 'social brand brain event payload contains forbidden secret keys'
      using errcode = 'P0001';
  end if;

  insert into public.social_brand_brain_events (
    organization_id, brand_id, workspace_id, campaign_id,
    event_type, actor_source, actor_member_id, payload
  ) values (
    p_organization_id, p_brand_id, p_workspace_id, p_campaign_id,
    p_event_type, p_actor_source, p_actor_member_id, v_payload
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke all on function private.insert_social_brand_brain_event(uuid, uuid, uuid, uuid, text, text, uuid, jsonb) from public, anon, authenticated, service_role;

create or replace function private.assert_social_brand_brain_mutation_context(
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
  exception
    when raise_exception then
      return query select 'forbidden'::text, null::uuid, null::uuid;
      return;
  end;

  if not private.can_manage_social_workspaces(v_member_role) then
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

revoke all on function private.assert_social_brand_brain_mutation_context(uuid, uuid) from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Brand profile RPC
-- ---------------------------------------------------------------------------

create or replace function public.upsert_social_brand_profile(
  p_organization_id uuid,
  p_brand_id uuid,
  p_summary text,
  p_positioning text,
  p_primary_language text,
  p_website_url text,
  p_voice_config jsonb,
  p_source_kind text default 'user_entered'
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ctx record;
  v_voice jsonb := coalesce(p_voice_config, '{}'::jsonb);
  v_source text := coalesce(nullif(btrim(p_source_kind), ''), 'user_entered');
  v_lang text := nullif(btrim(coalesce(p_primary_language, '')), '');
  v_website text := nullif(btrim(coalesce(p_website_url, '')), '');
begin
  select * into v_ctx
  from private.assert_social_brand_brain_mutation_context(p_organization_id, p_brand_id);

  if v_ctx.result_code <> 'ok' then
    return query select v_ctx.result_code;
    return;
  end if;

  if v_source not in ('user_entered', 'imported', 'system_derived', 'manually_verified')
     or jsonb_typeof(v_voice) is distinct from 'object'
     or pg_catalog.octet_length(v_voice::text) > 8192
     or (p_summary is not null and char_length(p_summary) > 4000)
     or (p_positioning is not null and char_length(p_positioning) > 2000)
     or (v_lang is not null and char_length(v_lang) not between 2 and 32)
     or (v_website is not null and char_length(v_website) > 2048)
  then
    return query select 'invalid_input'::text;
    return;
  end if;

  update public.social_brands as sb
  set
    summary = nullif(btrim(coalesce(p_summary, '')), ''),
    positioning = nullif(btrim(coalesce(p_positioning, '')), ''),
    primary_language = v_lang,
    website_url = v_website,
    voice_config = v_voice,
    profile_source_kind = v_source
  where sb.organization_id = p_organization_id
    and sb.id = p_brand_id
    and sb.archived_at is null;

  if not found then
    return query select 'not_found'::text;
    return;
  end if;

  perform private.insert_social_brand_brain_event(
    p_organization_id, p_brand_id, v_ctx.workspace_id, null,
    'social_brand_profile_updated', 'member', v_ctx.membership_id,
    jsonb_build_object('source_kind', v_source)
  );

  return query select 'success'::text;
end;
$$;

revoke all on function public.upsert_social_brand_profile(uuid, uuid, text, text, text, text, jsonb, text) from public, anon, authenticated, service_role;
grant execute on function public.upsert_social_brand_profile(uuid, uuid, text, text, text, text, jsonb, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Audience / rule / pillar / goal create + archive (minimal surface)
-- ---------------------------------------------------------------------------

create or replace function public.create_social_audience(
  p_organization_id uuid,
  p_brand_id uuid,
  p_display_name text,
  p_description text default null,
  p_needs text default null,
  p_desired_outcome text default null,
  p_priority integer default 100
)
returns table (result_code text, audience_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ctx record;
  v_name text := btrim(coalesce(p_display_name, ''));
  v_id uuid;
begin
  select * into v_ctx
  from private.assert_social_brand_brain_mutation_context(p_organization_id, p_brand_id);
  if v_ctx.result_code <> 'ok' then
    return query select v_ctx.result_code, null::uuid;
    return;
  end if;

  if char_length(v_name) = 0 or char_length(v_name) > 200 then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  insert into public.social_audiences (
    organization_id, brand_id, workspace_id, display_name, description,
    needs, desired_outcome, priority, created_by_member_id
  ) values (
    p_organization_id, p_brand_id, v_ctx.workspace_id, v_name,
    nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_needs, '')), ''),
    nullif(btrim(coalesce(p_desired_outcome, '')), ''),
    coalesce(p_priority, 100),
    v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_brand_brain_event(
    p_organization_id, p_brand_id, v_ctx.workspace_id, null,
    'social_audience_created', 'member', v_ctx.membership_id,
    jsonb_build_object('audience_id', v_id)
  );

  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.create_social_audience(uuid, uuid, text, text, text, text, integer) from public, anon, authenticated, service_role;
grant execute on function public.create_social_audience(uuid, uuid, text, text, text, text, integer) to authenticated;

create or replace function public.archive_social_audience(
  p_organization_id uuid,
  p_audience_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_brand_id uuid;
  v_workspace_id uuid;
  v_archived_at timestamptz;
  v_ctx record;
begin
  select a.brand_id, a.workspace_id, a.archived_at
  into v_brand_id, v_workspace_id, v_archived_at
  from public.social_audiences as a
  where a.organization_id = p_organization_id and a.id = p_audience_id;

  if not found then
    return query select 'not_found'::text;
    return;
  end if;

  if v_archived_at is not null then
    return query select 'conflict'::text;
    return;
  end if;

  select * into v_ctx
  from private.assert_social_brand_brain_mutation_context(p_organization_id, v_brand_id);
  if v_ctx.result_code <> 'ok' then
    return query select v_ctx.result_code;
    return;
  end if;

  update public.social_audiences
  set archived_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_audience_id and archived_at is null;

  perform private.insert_social_brand_brain_event(
    p_organization_id, v_brand_id, v_workspace_id, null,
    'social_audience_archived', 'member', v_ctx.membership_id,
    jsonb_build_object('audience_id', p_audience_id)
  );

  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_audience(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.archive_social_audience(uuid, uuid) to authenticated;

create or replace function public.create_social_brand_rule(
  p_organization_id uuid,
  p_brand_id uuid,
  p_rule_kind text,
  p_title text,
  p_body text,
  p_sort_order integer default 0
)
returns table (result_code text, rule_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ctx record;
  v_title text := btrim(coalesce(p_title, ''));
  v_body text := btrim(coalesce(p_body, ''));
  v_id uuid;
begin
  select * into v_ctx
  from private.assert_social_brand_brain_mutation_context(p_organization_id, p_brand_id);
  if v_ctx.result_code <> 'ok' then
    return query select v_ctx.result_code, null::uuid;
    return;
  end if;

  if p_rule_kind not in (
       'communication_principle', 'prohibited_claim', 'topic_avoid',
       'required_disclaimer', 'forbidden_vocabulary', 'cta_restriction', 'factual_constraint'
     )
     or char_length(v_title) = 0 or char_length(v_title) > 200
     or char_length(v_body) = 0 or char_length(v_body) > 4000
  then
    return query select 'invalid_input'::text, null::uuid;
    return;
  end if;

  insert into public.social_brand_rules (
    organization_id, brand_id, workspace_id, rule_kind, title, body, sort_order, created_by_member_id
  ) values (
    p_organization_id, p_brand_id, v_ctx.workspace_id, p_rule_kind, v_title, v_body,
    coalesce(p_sort_order, 0), v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_brand_brain_event(
    p_organization_id, p_brand_id, v_ctx.workspace_id, null,
    'social_brand_rule_created', 'member', v_ctx.membership_id,
    jsonb_build_object('rule_id', v_id, 'rule_kind', p_rule_kind)
  );

  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.create_social_brand_rule(uuid, uuid, text, text, text, integer) from public, anon, authenticated, service_role;
grant execute on function public.create_social_brand_rule(uuid, uuid, text, text, text, integer) to authenticated;

create or replace function public.archive_social_brand_rule(
  p_organization_id uuid,
  p_rule_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_brand_id uuid;
  v_workspace_id uuid;
  v_archived_at timestamptz;
  v_ctx record;
begin
  select r.brand_id, r.workspace_id, r.archived_at
  into v_brand_id, v_workspace_id, v_archived_at
  from public.social_brand_rules as r
  where r.organization_id = p_organization_id and r.id = p_rule_id;

  if not found then return query select 'not_found'::text; return; end if;
  if v_archived_at is not null then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, v_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  update public.social_brand_rules
  set archived_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_rule_id and archived_at is null;

  perform private.insert_social_brand_brain_event(
    p_organization_id, v_brand_id, v_workspace_id, null,
    'social_brand_rule_archived', 'member', v_ctx.membership_id,
    jsonb_build_object('rule_id', p_rule_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_brand_rule(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.archive_social_brand_rule(uuid, uuid) to authenticated;

create or replace function public.create_social_content_pillar(
  p_organization_id uuid,
  p_brand_id uuid,
  p_display_name text,
  p_description text default null,
  p_sort_order integer default 0
)
returns table (result_code text, pillar_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ctx record;
  v_name text := btrim(coalesce(p_display_name, ''));
  v_id uuid;
begin
  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, p_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;
  if char_length(v_name) = 0 or char_length(v_name) > 200 then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  insert into public.social_content_pillars (
    organization_id, brand_id, workspace_id, display_name, description, sort_order, created_by_member_id
  ) values (
    p_organization_id, p_brand_id, v_ctx.workspace_id, v_name,
    nullif(btrim(coalesce(p_description, '')), ''),
    coalesce(p_sort_order, 0), v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_brand_brain_event(
    p_organization_id, p_brand_id, v_ctx.workspace_id, null,
    'social_content_pillar_created', 'member', v_ctx.membership_id,
    jsonb_build_object('pillar_id', v_id)
  );
  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.create_social_content_pillar(uuid, uuid, text, text, integer) from public, anon, authenticated, service_role;
grant execute on function public.create_social_content_pillar(uuid, uuid, text, text, integer) to authenticated;

create or replace function public.archive_social_content_pillar(
  p_organization_id uuid,
  p_pillar_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_brand_id uuid; v_workspace_id uuid; v_archived_at timestamptz; v_ctx record;
begin
  select p.brand_id, p.workspace_id, p.archived_at into v_brand_id, v_workspace_id, v_archived_at
  from public.social_content_pillars as p
  where p.organization_id = p_organization_id and p.id = p_pillar_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_archived_at is not null then return query select 'conflict'::text; return; end if;
  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, v_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;
  update public.social_content_pillars set archived_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_pillar_id and archived_at is null;
  perform private.insert_social_brand_brain_event(
    p_organization_id, v_brand_id, v_workspace_id, null,
    'social_content_pillar_archived', 'member', v_ctx.membership_id,
    jsonb_build_object('pillar_id', p_pillar_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_content_pillar(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.archive_social_content_pillar(uuid, uuid) to authenticated;

create or replace function public.create_social_goal(
  p_organization_id uuid,
  p_brand_id uuid,
  p_goal_kind text,
  p_display_name text,
  p_description text default null,
  p_priority integer default 100,
  p_success_criteria jsonb default '{}'::jsonb
)
returns table (result_code text, goal_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ctx record;
  v_name text := btrim(coalesce(p_display_name, ''));
  v_criteria jsonb := coalesce(p_success_criteria, '{}'::jsonb);
  v_id uuid;
begin
  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, p_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;
  if p_goal_kind not in (
       'awareness','engagement','lead_generation','customer_education','recruitment',
       'retention','product_launch','traffic','sales_support','community_growth','other'
     )
     or char_length(v_name) = 0 or char_length(v_name) > 200
     or jsonb_typeof(v_criteria) is distinct from 'object'
     or pg_catalog.octet_length(v_criteria::text) > 4096
  then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  insert into public.social_goals (
    organization_id, brand_id, workspace_id, goal_kind, display_name, description,
    priority, success_criteria, created_by_member_id
  ) values (
    p_organization_id, p_brand_id, v_ctx.workspace_id, p_goal_kind, v_name,
    nullif(btrim(coalesce(p_description, '')), ''),
    coalesce(p_priority, 100), v_criteria, v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_brand_brain_event(
    p_organization_id, p_brand_id, v_ctx.workspace_id, null,
    'social_goal_created', 'member', v_ctx.membership_id,
    jsonb_build_object('goal_id', v_id, 'goal_kind', p_goal_kind)
  );
  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.create_social_goal(uuid, uuid, text, text, text, integer, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.create_social_goal(uuid, uuid, text, text, text, integer, jsonb) to authenticated;

create or replace function public.archive_social_goal(
  p_organization_id uuid,
  p_goal_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_brand_id uuid; v_workspace_id uuid; v_archived_at timestamptz; v_ctx record;
begin
  select g.brand_id, g.workspace_id, g.archived_at into v_brand_id, v_workspace_id, v_archived_at
  from public.social_goals as g
  where g.organization_id = p_organization_id and g.id = p_goal_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_archived_at is not null then return query select 'conflict'::text; return; end if;
  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, v_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;
  update public.social_goals set archived_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_goal_id and archived_at is null;
  perform private.insert_social_brand_brain_event(
    p_organization_id, v_brand_id, v_workspace_id, null,
    'social_goal_archived', 'member', v_ctx.membership_id,
    jsonb_build_object('goal_id', p_goal_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_goal(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.archive_social_goal(uuid, uuid) to authenticated;

create or replace function public.upsert_social_platform_strategy(
  p_organization_id uuid,
  p_brand_id uuid,
  p_planned_provider text,
  p_strategic_role text default null,
  p_objective text default null,
  p_content_style text default null,
  p_intended_frequency text default null
)
returns table (result_code text, strategy_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ctx record;
  v_id uuid;
begin
  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, p_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;

  if p_planned_provider not in (
       'instagram','facebook','threads','tiktok','linkedin','youtube','pinterest','x'
     )
  then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  insert into public.social_platform_strategies (
    organization_id, brand_id, workspace_id, planned_provider,
    strategic_role, objective, content_style, intended_frequency, created_by_member_id
  ) values (
    p_organization_id, p_brand_id, v_ctx.workspace_id, p_planned_provider,
    nullif(btrim(coalesce(p_strategic_role, '')), ''),
    nullif(btrim(coalesce(p_objective, '')), ''),
    nullif(btrim(coalesce(p_content_style, '')), ''),
    nullif(btrim(coalesce(p_intended_frequency, '')), ''),
    v_ctx.membership_id
  )
  on conflict (organization_id, brand_id, planned_provider)
  do update set
    strategic_role = excluded.strategic_role,
    objective = excluded.objective,
    content_style = excluded.content_style,
    intended_frequency = excluded.intended_frequency,
    archived_at = null,
    updated_at = pg_catalog.now()
  returning id into v_id;

  perform private.insert_social_brand_brain_event(
    p_organization_id, p_brand_id, v_ctx.workspace_id, null,
    'social_platform_strategy_upserted', 'member', v_ctx.membership_id,
    jsonb_build_object('strategy_id', v_id, 'planned_provider', p_planned_provider)
  );
  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.upsert_social_platform_strategy(uuid, uuid, text, text, text, text, text) from public, anon, authenticated, service_role;
grant execute on function public.upsert_social_platform_strategy(uuid, uuid, text, text, text, text, text) to authenticated;

create or replace function public.archive_social_platform_strategy(
  p_organization_id uuid,
  p_strategy_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_brand_id uuid; v_workspace_id uuid; v_archived_at timestamptz; v_ctx record; v_provider text;
begin
  select s.brand_id, s.workspace_id, s.archived_at, s.planned_provider
  into v_brand_id, v_workspace_id, v_archived_at, v_provider
  from public.social_platform_strategies as s
  where s.organization_id = p_organization_id and s.id = p_strategy_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_archived_at is not null then return query select 'conflict'::text; return; end if;
  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, v_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;
  update public.social_platform_strategies set archived_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_strategy_id and archived_at is null;
  perform private.insert_social_brand_brain_event(
    p_organization_id, v_brand_id, v_workspace_id, null,
    'social_platform_strategy_archived', 'member', v_ctx.membership_id,
    jsonb_build_object('strategy_id', p_strategy_id, 'planned_provider', v_provider)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_platform_strategy(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.archive_social_platform_strategy(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Campaign RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_social_campaign(
  p_organization_id uuid,
  p_brand_id uuid,
  p_display_name text,
  p_description text default null,
  p_goal_id uuid default null,
  p_status text default 'draft',
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_success_criteria jsonb default '{}'::jsonb
)
returns table (result_code text, campaign_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ctx record;
  v_name text := btrim(coalesce(p_display_name, ''));
  v_status text := coalesce(nullif(btrim(p_status), ''), 'draft');
  v_criteria jsonb := coalesce(p_success_criteria, '{}'::jsonb);
  v_goal_brand uuid;
  v_goal_archived timestamptz;
  v_id uuid;
begin
  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, p_brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code, null::uuid; return; end if;

  if char_length(v_name) = 0 or char_length(v_name) > 200
     or v_status not in ('draft', 'active', 'completed')
     or jsonb_typeof(v_criteria) is distinct from 'object'
     or pg_catalog.octet_length(v_criteria::text) > 4096
     or (p_starts_at is not null and p_ends_at is not null and p_ends_at < p_starts_at)
  then
    return query select 'invalid_input'::text, null::uuid; return;
  end if;

  if p_goal_id is not null then
    select g.brand_id, g.archived_at into v_goal_brand, v_goal_archived
    from public.social_goals as g
    where g.organization_id = p_organization_id and g.id = p_goal_id;
    if not found or v_goal_brand is distinct from p_brand_id or v_goal_archived is not null then
      return query select 'invalid_input'::text, null::uuid; return;
    end if;
  end if;

  insert into public.social_campaigns (
    organization_id, brand_id, workspace_id, display_name, description,
    goal_id, status, starts_at, ends_at, success_criteria, created_by_member_id
  ) values (
    p_organization_id, p_brand_id, v_ctx.workspace_id, v_name,
    nullif(btrim(coalesce(p_description, '')), ''),
    p_goal_id, v_status, p_starts_at, p_ends_at, v_criteria, v_ctx.membership_id
  ) returning id into v_id;

  perform private.insert_social_brand_brain_event(
    p_organization_id, p_brand_id, v_ctx.workspace_id, v_id,
    'social_campaign_created', 'member', v_ctx.membership_id,
    jsonb_build_object('campaign_id', v_id, 'status', v_status)
  );
  return query select 'success'::text, v_id;
end;
$$;

revoke all on function public.create_social_campaign(uuid, uuid, text, text, uuid, text, timestamptz, timestamptz, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.create_social_campaign(uuid, uuid, text, text, uuid, text, timestamptz, timestamptz, jsonb) to authenticated;

create or replace function public.update_social_campaign(
  p_organization_id uuid,
  p_campaign_id uuid,
  p_display_name text,
  p_description text default null,
  p_goal_id uuid default null,
  p_status text default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_success_criteria jsonb default null
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign public.social_campaigns;
  v_ctx record;
  v_name text;
  v_status text;
  v_criteria jsonb;
  v_goal_brand uuid;
  v_goal_archived timestamptz;
begin
  select c.* into v_campaign
  from public.social_campaigns as c
  where c.organization_id = p_organization_id and c.id = p_campaign_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_campaign.archived_at is not null then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, v_campaign.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  v_name := btrim(coalesce(p_display_name, v_campaign.display_name));
  v_status := coalesce(nullif(btrim(coalesce(p_status, '')), ''), v_campaign.status);
  v_criteria := coalesce(p_success_criteria, v_campaign.success_criteria);

  if char_length(v_name) = 0 or char_length(v_name) > 200
     or v_status not in ('draft', 'active', 'completed')
     or jsonb_typeof(v_criteria) is distinct from 'object'
     or pg_catalog.octet_length(v_criteria::text) > 4096
     or (
       coalesce(p_starts_at, v_campaign.starts_at) is not null
       and coalesce(p_ends_at, v_campaign.ends_at) is not null
       and coalesce(p_ends_at, v_campaign.ends_at) < coalesce(p_starts_at, v_campaign.starts_at)
     )
  then
    return query select 'invalid_input'::text; return;
  end if;

  if p_goal_id is not null then
    select g.brand_id, g.archived_at into v_goal_brand, v_goal_archived
    from public.social_goals as g
    where g.organization_id = p_organization_id and g.id = p_goal_id;
    if not found or v_goal_brand is distinct from v_campaign.brand_id or v_goal_archived is not null then
      return query select 'invalid_input'::text; return;
    end if;
  end if;

  update public.social_campaigns as c
  set
    display_name = v_name,
    description = case
      when p_description is null then c.description
      else nullif(btrim(p_description), '')
    end,
    goal_id = case when p_goal_id is null then c.goal_id else p_goal_id end,
    status = v_status,
    starts_at = case when p_starts_at is null then c.starts_at else p_starts_at end,
    ends_at = case when p_ends_at is null then c.ends_at else p_ends_at end,
    success_criteria = v_criteria
  where c.organization_id = p_organization_id and c.id = p_campaign_id and c.archived_at is null;

  perform private.insert_social_brand_brain_event(
    p_organization_id, v_campaign.brand_id, v_campaign.workspace_id, p_campaign_id,
    'social_campaign_updated', 'member', v_ctx.membership_id,
    jsonb_build_object('campaign_id', p_campaign_id, 'status', v_status)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.update_social_campaign(uuid, uuid, text, text, uuid, text, timestamptz, timestamptz, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.update_social_campaign(uuid, uuid, text, text, uuid, text, timestamptz, timestamptz, jsonb) to authenticated;

create or replace function public.archive_social_campaign(
  p_organization_id uuid,
  p_campaign_id uuid
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign public.social_campaigns;
  v_ctx record;
begin
  select c.* into v_campaign from public.social_campaigns as c
  where c.organization_id = p_organization_id and c.id = p_campaign_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_campaign.archived_at is not null then return query select 'conflict'::text; return; end if;
  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, v_campaign.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;
  update public.social_campaigns set archived_at = pg_catalog.now()
  where organization_id = p_organization_id and id = p_campaign_id and archived_at is null;
  perform private.insert_social_brand_brain_event(
    p_organization_id, v_campaign.brand_id, v_campaign.workspace_id, p_campaign_id,
    'social_campaign_archived', 'member', v_ctx.membership_id,
    jsonb_build_object('campaign_id', p_campaign_id)
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.archive_social_campaign(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.archive_social_campaign(uuid, uuid) to authenticated;

create or replace function public.set_social_campaign_assignments(
  p_organization_id uuid,
  p_campaign_id uuid,
  p_audience_ids uuid[] default '{}'::uuid[],
  p_planned_providers text[] default '{}'::text[],
  p_pillar_ids uuid[] default '{}'::uuid[]
)
returns table (result_code text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_campaign public.social_campaigns;
  v_ctx record;
  v_audience_ids uuid[] := coalesce(p_audience_ids, '{}'::uuid[]);
  v_providers text[] := coalesce(p_planned_providers, '{}'::text[]);
  v_pillar_ids uuid[] := coalesce(p_pillar_ids, '{}'::uuid[]);
  v_cnt int;
  v_provider text;
begin
  select c.* into v_campaign from public.social_campaigns as c
  where c.organization_id = p_organization_id and c.id = p_campaign_id;
  if not found then return query select 'not_found'::text; return; end if;
  if v_campaign.archived_at is not null then return query select 'conflict'::text; return; end if;

  select * into v_ctx from private.assert_social_brand_brain_mutation_context(p_organization_id, v_campaign.brand_id);
  if v_ctx.result_code <> 'ok' then return query select v_ctx.result_code; return; end if;

  if cardinality(v_audience_ids) > 0 then
    select count(*) into v_cnt
    from public.social_audiences as a
    where a.organization_id = p_organization_id
      and a.brand_id = v_campaign.brand_id
      and a.archived_at is null
      and a.id = any(v_audience_ids);
    if v_cnt <> cardinality(array(select distinct unnest(v_audience_ids))) then
      return query select 'invalid_input'::text; return;
    end if;
  end if;

  foreach v_provider in array v_providers loop
    if v_provider not in (
      'instagram','facebook','threads','tiktok','linkedin','youtube','pinterest','x'
    ) then
      return query select 'invalid_input'::text; return;
    end if;
  end loop;

  if cardinality(v_pillar_ids) > 0 then
    select count(*) into v_cnt
    from public.social_content_pillars as p
    where p.organization_id = p_organization_id
      and p.brand_id = v_campaign.brand_id
      and p.archived_at is null
      and p.id = any(v_pillar_ids);
    if v_cnt <> cardinality(array(select distinct unnest(v_pillar_ids))) then
      return query select 'invalid_input'::text; return;
    end if;
  end if;

  delete from public.social_campaign_audiences
  where organization_id = p_organization_id and campaign_id = p_campaign_id;
  delete from public.social_campaign_platforms
  where organization_id = p_organization_id and campaign_id = p_campaign_id;
  delete from public.social_campaign_pillars
  where organization_id = p_organization_id and campaign_id = p_campaign_id;

  insert into public.social_campaign_audiences (organization_id, campaign_id, audience_id)
  select p_organization_id, p_campaign_id, x
  from unnest(array(select distinct unnest(v_audience_ids))) as x;

  insert into public.social_campaign_platforms (organization_id, campaign_id, planned_provider)
  select p_organization_id, p_campaign_id, x
  from unnest(array(select distinct unnest(v_providers))) as x;

  insert into public.social_campaign_pillars (organization_id, campaign_id, pillar_id)
  select p_organization_id, p_campaign_id, x
  from unnest(array(select distinct unnest(v_pillar_ids))) as x;

  perform private.insert_social_brand_brain_event(
    p_organization_id, v_campaign.brand_id, v_campaign.workspace_id, p_campaign_id,
    'social_campaign_assignments_replaced', 'member', v_ctx.membership_id,
    jsonb_build_object(
      'campaign_id', p_campaign_id,
      'audience_count', cardinality(array(select distinct unnest(v_audience_ids))),
      'provider_count', cardinality(array(select distinct unnest(v_providers))),
      'pillar_count', cardinality(array(select distinct unnest(v_pillar_ids)))
    )
  );
  return query select 'success'::text;
end;
$$;

revoke all on function public.set_social_campaign_assignments(uuid, uuid, uuid[], text[], uuid[]) from public, anon, authenticated, service_role;
grant execute on function public.set_social_campaign_assignments(uuid, uuid, uuid[], text[], uuid[]) to authenticated;
