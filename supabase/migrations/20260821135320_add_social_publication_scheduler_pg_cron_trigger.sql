-- SMM-B1.11-E-PR1: Supabase Cron is the timer only.
-- Canonical worker remains the existing Vercel route.
-- Secret is resolved from Vault at runtime; never stored in this file.
-- CREATE EXTENSION IF NOT EXISTS is avoided because hosted Supabase re-runs
-- pg_cron after-create privilege scripts even when the extension exists.

do $ext$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    execute 'create extension pg_cron with schema pg_catalog';
    execute 'grant usage on schema cron to postgres';
    execute 'grant all privileges on all tables in schema cron to postgres';
  end if;

  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    execute 'create extension pg_net with schema extensions';
  end if;
end
$ext$;

create or replace function private.invoke_social_publication_scheduler()
returns table (
  result_code text,
  http_request_id bigint
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
  v_request_id bigint;
begin
  select ds.decrypted_secret
  into v_secret
  from vault.decrypted_secrets as ds
  where ds.name = 'zyntixai_social_scheduler_cron_secret'
  limit 1;

  if v_secret is null or btrim(v_secret) = '' then
    return query select 'secret_missing'::text, null::bigint;
    return;
  end if;

  v_request_id := net.http_post(
    url := 'https://www.zyntixai.com/api/cron/social-publications',
    body := '{}'::jsonb,
    params := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || btrim(v_secret)
    ),
    timeout_milliseconds := 300000
  );

  if v_request_id is null then
    return query select 'http_queue_failed'::text, null::bigint;
    return;
  end if;

  return query select 'queued'::text, v_request_id;
end;
$$;

comment on function private.invoke_social_publication_scheduler() is
  'SMM-B1.11-E-PR1 private timer: Vault-backed Bearer POST to the canonical Social scheduler worker. No URL, organization, publication, or secret parameters.';

revoke all on function private.invoke_social_publication_scheduler() from public;
revoke all on function private.invoke_social_publication_scheduler() from anon;
revoke all on function private.invoke_social_publication_scheduler() from authenticated;
revoke all on function private.invoke_social_publication_scheduler() from service_role;

grant execute on function private.invoke_social_publication_scheduler() to postgres;

select cron.unschedule(jobid)
from cron.job
where jobname = 'zyntixai_social_publication_scheduler_5m';

select cron.schedule(
  'zyntixai_social_publication_scheduler_5m',
  '*/5 * * * *',
  $cron$select private.invoke_social_publication_scheduler();$cron$
);
