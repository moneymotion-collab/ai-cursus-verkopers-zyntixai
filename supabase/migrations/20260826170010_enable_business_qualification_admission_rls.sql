-- ZyntixAI BQA-1C — RLS, grants, and write denial.
--
-- Authenticated members may SELECT tenant-visible rows through RLS.
-- Events: Owner/Admin SELECT only.
-- Authenticated/anon/public have no INSERT/UPDATE/DELETE.
-- Decision, support, admission, event, and demand writes are reserved for a
-- later server/RPC boundary. 1C does not grant authenticated DML even where a
-- future Owner/Admin write matrix could be expressed.
-- service_role receives explicit DML only on these seven tenant tables.
-- CONTROL-PLANE TAX/CAP/CTX grants are unchanged.
-- Integrity trigger EXECUTE remains revoked; triggers still fire.

alter table public.business_activity_qualifications enable row level security;
alter table public.business_activity_qualification_answers enable row level security;
alter table public.business_activity_classification_decisions enable row level security;
alter table public.business_activity_support_assessments enable row level security;
alter table public.business_activity_admission_decisions enable row level security;
alter table public.business_activity_qualification_events enable row level security;
alter table public.business_activity_demand_signals enable row level security;

revoke all on table public.business_activity_qualifications from public;
revoke all on table public.business_activity_qualifications from anon;
revoke all on table public.business_activity_qualifications from authenticated;
revoke all on table public.business_activity_qualifications from service_role;

revoke all on table public.business_activity_qualification_answers from public;
revoke all on table public.business_activity_qualification_answers from anon;
revoke all on table public.business_activity_qualification_answers from authenticated;
revoke all on table public.business_activity_qualification_answers from service_role;

revoke all on table public.business_activity_classification_decisions from public;
revoke all on table public.business_activity_classification_decisions from anon;
revoke all on table public.business_activity_classification_decisions from authenticated;
revoke all on table public.business_activity_classification_decisions from service_role;

revoke all on table public.business_activity_support_assessments from public;
revoke all on table public.business_activity_support_assessments from anon;
revoke all on table public.business_activity_support_assessments from authenticated;
revoke all on table public.business_activity_support_assessments from service_role;

revoke all on table public.business_activity_admission_decisions from public;
revoke all on table public.business_activity_admission_decisions from anon;
revoke all on table public.business_activity_admission_decisions from authenticated;
revoke all on table public.business_activity_admission_decisions from service_role;

revoke all on table public.business_activity_qualification_events from public;
revoke all on table public.business_activity_qualification_events from anon;
revoke all on table public.business_activity_qualification_events from authenticated;
revoke all on table public.business_activity_qualification_events from service_role;

revoke all on table public.business_activity_demand_signals from public;
revoke all on table public.business_activity_demand_signals from anon;
revoke all on table public.business_activity_demand_signals from authenticated;
revoke all on table public.business_activity_demand_signals from service_role;

grant select on table public.business_activity_qualifications to authenticated;
grant select on table public.business_activity_qualification_answers to authenticated;
grant select on table public.business_activity_classification_decisions to authenticated;
grant select on table public.business_activity_support_assessments to authenticated;
grant select on table public.business_activity_admission_decisions to authenticated;
grant select on table public.business_activity_qualification_events to authenticated;
grant select on table public.business_activity_demand_signals to authenticated;

grant select, insert, update on table public.business_activity_qualifications to service_role;
grant select, insert, update on table public.business_activity_qualification_answers to service_role;
grant select, insert, update on table public.business_activity_classification_decisions to service_role;
grant select, insert, update on table public.business_activity_support_assessments to service_role;
grant select, insert, update on table public.business_activity_admission_decisions to service_role;
grant select, insert on table public.business_activity_qualification_events to service_role;
grant select, insert, update on table public.business_activity_demand_signals to service_role;

create policy business_activity_qualifications_select_member
  on public.business_activity_qualifications
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy business_activity_qualification_answers_select_member
  on public.business_activity_qualification_answers
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy business_activity_classification_decisions_select_member
  on public.business_activity_classification_decisions
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy business_activity_support_assessments_select_member
  on public.business_activity_support_assessments
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy business_activity_admission_decisions_select_member
  on public.business_activity_admission_decisions
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy business_activity_demand_signals_select_member
  on public.business_activity_demand_signals
  for select
  to authenticated
  using (private.is_org_member(organization_id));

create policy business_activity_qualification_events_select_owner_admin
  on public.business_activity_qualification_events
  for select
  to authenticated
  using (private.has_org_role(organization_id, array['owner', 'admin']));

revoke insert, update, delete on table public.business_activity_qualifications from authenticated;
revoke insert, update, delete on table public.business_activity_qualifications from anon;
revoke insert, update, delete on table public.business_activity_qualifications from public;

revoke insert, update, delete on table public.business_activity_qualification_answers from authenticated;
revoke insert, update, delete on table public.business_activity_qualification_answers from anon;
revoke insert, update, delete on table public.business_activity_qualification_answers from public;

revoke insert, update, delete on table public.business_activity_classification_decisions from authenticated;
revoke insert, update, delete on table public.business_activity_classification_decisions from anon;
revoke insert, update, delete on table public.business_activity_classification_decisions from public;

revoke insert, update, delete on table public.business_activity_support_assessments from authenticated;
revoke insert, update, delete on table public.business_activity_support_assessments from anon;
revoke insert, update, delete on table public.business_activity_support_assessments from public;

revoke insert, update, delete on table public.business_activity_admission_decisions from authenticated;
revoke insert, update, delete on table public.business_activity_admission_decisions from anon;
revoke insert, update, delete on table public.business_activity_admission_decisions from public;

revoke insert, update, delete on table public.business_activity_qualification_events from authenticated;
revoke insert, update, delete on table public.business_activity_qualification_events from anon;
revoke insert, update, delete on table public.business_activity_qualification_events from public;

revoke insert, update, delete on table public.business_activity_demand_signals from authenticated;
revoke insert, update, delete on table public.business_activity_demand_signals from anon;
revoke insert, update, delete on table public.business_activity_demand_signals from public;

revoke all on function private.guard_business_activity_qualification_event_immutable() from public;
revoke all on function private.guard_business_activity_qualification_event_immutable() from anon;
revoke all on function private.guard_business_activity_qualification_event_immutable() from authenticated;
revoke all on function private.guard_business_activity_qualification_event_immutable() from service_role;

revoke all on function private.lookup_bqa_taxonomy_target_key(text, uuid) from public;
revoke all on function private.lookup_bqa_taxonomy_target_key(text, uuid) from anon;
revoke all on function private.lookup_bqa_taxonomy_target_key(text, uuid) from authenticated;
revoke all on function private.lookup_bqa_taxonomy_target_key(text, uuid) from service_role;

revoke all on function private.enforce_business_activity_qualification_identity() from public;
revoke all on function private.enforce_business_activity_qualification_identity() from anon;
revoke all on function private.enforce_business_activity_qualification_identity() from authenticated;
revoke all on function private.enforce_business_activity_qualification_identity() from service_role;

revoke all on function private.enforce_business_activity_qualification_answer_identity() from public;
revoke all on function private.enforce_business_activity_qualification_answer_identity() from anon;
revoke all on function private.enforce_business_activity_qualification_answer_identity() from authenticated;
revoke all on function private.enforce_business_activity_qualification_answer_identity() from service_role;

revoke all on function private.enforce_business_activity_classification_decision_integrity() from public;
revoke all on function private.enforce_business_activity_classification_decision_integrity() from anon;
revoke all on function private.enforce_business_activity_classification_decision_integrity() from authenticated;
revoke all on function private.enforce_business_activity_classification_decision_integrity() from service_role;

revoke all on function private.enforce_business_activity_support_assessment_integrity() from public;
revoke all on function private.enforce_business_activity_support_assessment_integrity() from anon;
revoke all on function private.enforce_business_activity_support_assessment_integrity() from authenticated;
revoke all on function private.enforce_business_activity_support_assessment_integrity() from service_role;

revoke all on function private.enforce_business_activity_admission_decision_integrity() from public;
revoke all on function private.enforce_business_activity_admission_decision_integrity() from anon;
revoke all on function private.enforce_business_activity_admission_decision_integrity() from authenticated;
revoke all on function private.enforce_business_activity_admission_decision_integrity() from service_role;

revoke all on function private.enforce_business_activity_demand_signal_integrity() from public;
revoke all on function private.enforce_business_activity_demand_signal_integrity() from anon;
revoke all on function private.enforce_business_activity_demand_signal_integrity() from authenticated;
revoke all on function private.enforce_business_activity_demand_signal_integrity() from service_role;

comment on table public.business_activity_qualifications is
  'One BQA aggregate per Activity. Member SELECT via RLS. Mutations via later server/service_role. Not entitlement or Context assignment.';

comment on table public.business_activity_qualification_answers is
  'Current answers. Member SELECT. No authenticated writes in 1C; later Owner/Admin/Staff answer writes stay server-governed.';

comment on table public.business_activity_classification_decisions is
  'Historical classification decisions. Member SELECT. Confirm/supersede reserved for later server authority. AI cannot confirm.';

comment on table public.business_activity_support_assessments is
  'Support snapshots. Member SELECT. Not an organization Context assignment.';

comment on table public.business_activity_admission_decisions is
  'Admission snapshots. Member SELECT. Admitted rows do not grant login, membership, invitation, permission, or entitlement.';

comment on table public.business_activity_qualification_events is
  'Append-only BQA audit. Owner/Admin SELECT only. INSERT via service_role. UPDATE/DELETE blocked.';

comment on table public.business_activity_demand_signals is
  'Tenant demand/waitlist. Member SELECT. Staff join is deferred; no authenticated writes in 1C.';
