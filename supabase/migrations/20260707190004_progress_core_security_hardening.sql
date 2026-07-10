-- ZyntixAI D2 Progress Core M5: security hardening (privilege re-assertion)

revoke all on table public.enrollment_progress_facts from public;
revoke all on table public.enrollment_progress_facts from anon;
revoke all on table public.enrollment_progress_facts from authenticated;
grant select on table public.enrollment_progress_facts to authenticated;

revoke all on function public.record_progress_fact(
  uuid, uuid, text, timestamptz, text, text, numeric, text, boolean, integer, text, uuid
) from public;
revoke all on function public.record_progress_fact(
  uuid, uuid, text, timestamptz, text, text, numeric, text, boolean, integer, text, uuid
) from anon;
grant execute on function public.record_progress_fact(
  uuid, uuid, text, timestamptz, text, text, numeric, text, boolean, integer, text, uuid
) to authenticated;

revoke all on function public.void_progress_fact(uuid, uuid, text) from public;
revoke all on function public.void_progress_fact(uuid, uuid, text) from anon;
grant execute on function public.void_progress_fact(uuid, uuid, text) to authenticated;
