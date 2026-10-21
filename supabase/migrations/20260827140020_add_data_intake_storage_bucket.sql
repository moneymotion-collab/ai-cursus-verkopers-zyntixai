-- ZyntixAI DATA-1C — Private data-intake Storage bucket.
--
-- Distinct from the Social media bucket. public=false.
-- No allow policies for anon/authenticated. Bytes leave the bucket only via a
-- future server-authorized signed URL after Owner/Admin session authorization.
-- DATA-1C does not implement product upload or signed URL generation.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'data-intake',
  'data-intake',
  false,
  10485760,
  array[
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists data_intake_no_anon_all on storage.objects;
drop policy if exists data_intake_no_authenticated_all on storage.objects;

create policy data_intake_no_anon_all
  on storage.objects
  as restrictive
  for all
  to anon
  using (bucket_id is distinct from 'data-intake')
  with check (bucket_id is distinct from 'data-intake');

create policy data_intake_no_authenticated_all
  on storage.objects
  as restrictive
  for all
  to authenticated
  using (bucket_id is distinct from 'data-intake')
  with check (bucket_id is distinct from 'data-intake');
