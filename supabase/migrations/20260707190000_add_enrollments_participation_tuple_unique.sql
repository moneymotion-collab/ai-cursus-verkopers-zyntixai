-- ZyntixAI D2 Progress Core M1: parent enrollment participation tuple uniqueness

alter table public.enrollments
  add constraint enrollments_org_participation_tuple_unique
  unique (organization_id, id, customer_id, program_id);

comment on constraint enrollments_org_participation_tuple_unique on public.enrollments is
  'Enables composite FK from enrollment_progress_facts proving full participation tuple consistency.';
