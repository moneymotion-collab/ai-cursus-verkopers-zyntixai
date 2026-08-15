-- SMM-B1.7-R1 — Private Social media storage bucket for Instagram provider delivery.
-- Private by default (public=false). No allow policies for anon/authenticated.
-- Bytes leave the bucket only via HMAC-signed /api/social/media-delivery (narrow server download).

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'zyntix-social-media',
  'zyntix-social-media',
  false,
  104857600,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ]::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Explicit deny policies scoped ONLY to this bucket (do not grant other buckets).
drop policy if exists zyntix_social_media_no_anon_all on storage.objects;
drop policy if exists zyntix_social_media_no_authenticated_all on storage.objects;

create policy zyntix_social_media_no_anon_all
  on storage.objects
  as restrictive
  for all
  to anon
  using (bucket_id is distinct from 'zyntix-social-media')
  with check (bucket_id is distinct from 'zyntix-social-media');

create policy zyntix_social_media_no_authenticated_all
  on storage.objects
  as restrictive
  for all
  to authenticated
  using (bucket_id is distinct from 'zyntix-social-media')
  with check (bucket_id is distinct from 'zyntix-social-media');
