-- ZyntixAI B1.7.2 Attention Database Foundation:
-- attention_items + attention_signals schema, constraints, indexes, signal immutability

create table public.attention_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  enrollment_id uuid not null,
  customer_id uuid not null,
  program_id uuid not null,
  title text not null,
  summary text,
  status text not null default 'open',
  severity text not null default 'medium',
  assignee_member_id uuid,
  dedupe_key text not null,
  detection_count integer not null default 1,
  first_detected_at timestamptz not null default pg_catalog.now(),
  last_detected_at timestamptz not null default pg_catalog.now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  dismissed_at timestamptz,
  expired_at timestamptz,
  resolution_reason text,
  dismissal_reason text,
  archived_at timestamptz,
  created_by_member_id uuid,
  updated_by_member_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint attention_items_org_id_unique unique (organization_id, id),
  constraint attention_items_org_enrollment_id_unique unique (
    organization_id,
    id,
    enrollment_id
  ),
  constraint attention_items_title_not_empty_check check (
    char_length(btrim(title)) > 0
    and char_length(btrim(title)) <= 200
  ),
  constraint attention_items_summary_length_check check (
    summary is null
    or (
      char_length(btrim(summary)) > 0
      and char_length(btrim(summary)) <= 2000
    )
  ),
  constraint attention_items_status_check check (
    status in ('open', 'acknowledged', 'resolved', 'dismissed', 'expired')
  ),
  constraint attention_items_severity_check check (
    severity in ('low', 'medium', 'high', 'critical')
  ),
  constraint attention_items_dedupe_key_not_empty_check check (
    char_length(btrim(dedupe_key)) > 0
  ),
  constraint attention_items_detection_count_positive_check check (
    detection_count >= 1
  ),
  constraint attention_items_detection_order_check check (
    last_detected_at >= first_detected_at
  ),
  constraint attention_items_open_fields_check check (
    status <> 'open'
    or (
      acknowledged_at is null
      and resolved_at is null
      and dismissed_at is null
      and expired_at is null
      and resolution_reason is null
      and dismissal_reason is null
    )
  ),
  constraint attention_items_acknowledged_fields_check check (
    status <> 'acknowledged'
    or (
      acknowledged_at is not null
      and resolved_at is null
      and dismissed_at is null
      and expired_at is null
      and resolution_reason is null
      and dismissal_reason is null
    )
  ),
  constraint attention_items_resolved_fields_check check (
    status <> 'resolved'
    or (
      resolved_at is not null
      and nullif(btrim(resolution_reason), '') is not null
      and char_length(btrim(resolution_reason)) <= 2000
      and dismissed_at is null
      and expired_at is null
      and dismissal_reason is null
    )
  ),
  constraint attention_items_dismissed_fields_check check (
    status <> 'dismissed'
    or (
      dismissed_at is not null
      and nullif(btrim(dismissal_reason), '') is not null
      and char_length(btrim(dismissal_reason)) <= 2000
      and resolved_at is null
      and expired_at is null
      and resolution_reason is null
    )
  ),
  constraint attention_items_expired_fields_check check (
    status <> 'expired'
    or (
      expired_at is not null
      and resolved_at is null
      and dismissed_at is null
      and resolution_reason is null
      and dismissal_reason is null
    )
  ),
  constraint attention_items_resolution_reason_terminal_check check (
    resolution_reason is null
    or status = 'resolved'
  ),
  constraint attention_items_dismissal_reason_terminal_check check (
    dismissal_reason is null
    or status = 'dismissed'
  ),
  constraint attention_items_archive_terminal_only_check check (
    archived_at is null
    or status in ('resolved', 'dismissed', 'expired')
  ),
  constraint attention_items_organization_fk foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint attention_items_enrollment_tuple_fk foreign key (
    organization_id,
    enrollment_id,
    customer_id,
    program_id
  )
    references public.enrollments (
      organization_id,
      id,
      customer_id,
      program_id
    )
    on delete restrict,
  constraint attention_items_assignee_member_fk foreign key (
    organization_id,
    assignee_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint attention_items_created_by_member_fk foreign key (
    organization_id,
    created_by_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict,
  constraint attention_items_updated_by_member_fk foreign key (
    organization_id,
    updated_by_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.attention_items is
  'Organization-scoped Attention Items (Enrollment-sourced). Mutations are RPC-only from B1.7.3; B1.7.2 is schema+RLS deny-by-default only.';
comment on column public.attention_items.dedupe_key is
  'Canonical B1.7.1 key: attention:enrollment:<org>:<enrollment>:<manual|enrollment_no_recent_progress>.';
comment on column public.attention_items.archived_at is
  'Orthogonal soft-archive; allowed only for terminal statuses. Restore deferred out of R1.';
comment on column public.attention_items.customer_id is
  'Denormalized Enrollment participation context for same-org composite FK integrity; not an independent Attention source.';
comment on column public.attention_items.program_id is
  'Denormalized Enrollment participation context for same-org composite FK integrity; not an independent Attention source.';

create table public.attention_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  attention_item_id uuid not null,
  enrollment_id uuid not null,
  signal_origin text not null,
  rule_key text,
  explanation text not null,
  evidence jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default pg_catalog.now(),
  created_by_member_id uuid,
  created_at timestamptz not null default pg_catalog.now(),
  constraint attention_signals_org_id_unique unique (organization_id, id),
  constraint attention_signals_signal_origin_check check (
    signal_origin in ('manual', 'rule')
  ),
  constraint attention_signals_rule_key_check check (
    rule_key is null
    or rule_key = 'enrollment_no_recent_progress'
  ),
  constraint attention_signals_origin_rule_consistency_check check (
    (
      signal_origin = 'manual'
      and rule_key is null
    )
    or (
      signal_origin = 'rule'
      and rule_key = 'enrollment_no_recent_progress'
    )
  ),
  constraint attention_signals_explanation_not_empty_check check (
    char_length(btrim(explanation)) > 0
    and char_length(btrim(explanation)) <= 2000
  ),
  constraint attention_signals_evidence_object_check check (
    jsonb_typeof(evidence) = 'object'
  ),
  constraint attention_signals_organization_fk foreign key (organization_id)
    references public.organizations (id)
    on delete cascade,
  constraint attention_signals_item_enrollment_fk foreign key (
    organization_id,
    attention_item_id,
    enrollment_id
  )
    references public.attention_items (
      organization_id,
      id,
      enrollment_id
    )
    on delete cascade,
  constraint attention_signals_enrollment_fk foreign key (
    organization_id,
    enrollment_id
  )
    references public.enrollments (organization_id, id)
    on delete restrict,
  constraint attention_signals_created_by_member_fk foreign key (
    organization_id,
    created_by_member_id
  )
    references public.organization_members (organization_id, id)
    on delete restrict
);

comment on table public.attention_signals is
  'Append-only Attention Signal evidence/detection records. Immutable for normal application paths.';
comment on column public.attention_signals.signal_origin is
  'B1.7.1 AttentionSignalOrigin: manual | rule. Maps B1.7.0 residual signal_type naming.';
comment on column public.attention_signals.rule_key is
  'Authoritative rule key when signal_origin = rule; null for manual.';
comment on column public.attention_signals.evidence is
  'JSONB object aligned to B1.7.1 AttentionSignalEvidence shape; deep key validation remains server-side in B1.7.3.';
comment on column public.attention_signals.created_by_member_id is
  'Null for system/rule origin; same-org member for manual creation.';

-- Signal immutability (B1.7.2 remediation):
-- - UPDATE is hard-blocked for all roles (content must stay append-only).
-- - DELETE is NOT trigger-blocked so organization/item ON DELETE CASCADE and
--   local admin reset remain possible.
-- - Application DELETE remains deny-by-default via revoke + RLS (no policies)
--   until B1.7.3 adds an append-only create path only.
create or replace function private.guard_attention_signal_immutable()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'attention signals are immutable'
    using errcode = 'P0001';
end;
$$;

revoke all on function private.guard_attention_signal_immutable() from public;
revoke all on function private.guard_attention_signal_immutable() from anon;
revoke all on function private.guard_attention_signal_immutable() from authenticated;
revoke all on function private.guard_attention_signal_immutable() from service_role;

create trigger attention_signals_guard_immutable
  before update on public.attention_signals
  for each row
  execute function private.guard_attention_signal_immutable();

create trigger attention_items_set_updated_at
  before update on public.attention_items
  for each row
  execute function public.set_updated_at();

-- Non-terminal uniqueness: at most one open/acknowledged Item per org+enrollment+dedupe_key
create unique index attention_items_nonterminal_dedupe_uidx
  on public.attention_items (organization_id, enrollment_id, dedupe_key)
  where status in ('open', 'acknowledged');

create index attention_items_organization_id_status_idx
  on public.attention_items (organization_id, status);

create index attention_items_organization_id_archived_at_idx
  on public.attention_items (organization_id, archived_at)
  where archived_at is not null;

create index attention_items_organization_id_severity_idx
  on public.attention_items (organization_id, severity);

create index attention_items_organization_id_assignee_member_id_idx
  on public.attention_items (organization_id, assignee_member_id)
  where assignee_member_id is not null;

create index attention_items_organization_id_enrollment_id_idx
  on public.attention_items (organization_id, enrollment_id);

create index attention_items_organization_id_last_detected_at_idx
  on public.attention_items (organization_id, last_detected_at desc);

create index attention_items_enrollment_tuple_fk_idx
  on public.attention_items (
    organization_id,
    enrollment_id,
    customer_id,
    program_id
  );

create index attention_signals_organization_id_item_id_idx
  on public.attention_signals (organization_id, attention_item_id);

create index attention_signals_organization_id_detected_at_idx
  on public.attention_signals (organization_id, detected_at desc);

create index attention_signals_organization_id_enrollment_rule_idx
  on public.attention_signals (organization_id, enrollment_id, rule_key)
  where rule_key is not null;
