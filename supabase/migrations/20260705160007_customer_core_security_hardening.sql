-- ZyntixAI Customer Core: security hardening (email canonicalization + privilege re-assertion)

create or replace function private.canonicalize_customer_email_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email := nullif(lower(btrim(new.email)), '');
  return new;
end;
$$;

comment on function private.canonicalize_customer_email_trigger() is
  'Normalizes customers.email to NULL or lower(btrim(email)) on write.';

revoke all on function private.canonicalize_customer_email_trigger() from public;
revoke all on function private.canonicalize_customer_email_trigger() from anon;
revoke all on function private.canonicalize_customer_email_trigger() from authenticated;

create trigger customers_canonicalize_email
  before insert or update of email on public.customers
  for each row
  execute function private.canonicalize_customer_email_trigger();

-- Defense-in-depth: re-assert internal helpers are not directly executable by API roles.
revoke all on function private.normalize_customer_email(text) from public;
revoke all on function private.normalize_customer_email(text) from anon;
revoke all on function private.normalize_customer_email(text) from authenticated;

revoke all on function private.is_allowed_customer_status_transition(text, text) from public;
revoke all on function private.is_allowed_customer_status_transition(text, text) from anon;
revoke all on function private.is_allowed_customer_status_transition(text, text) from authenticated;

revoke all on function private.get_actor_membership(uuid) from public;
revoke all on function private.get_actor_membership(uuid) from anon;
revoke all on function private.get_actor_membership(uuid) from authenticated;

revoke all on function private.insert_customer_status_history(uuid, uuid, text, text, uuid, text, text) from public;
revoke all on function private.insert_customer_status_history(uuid, uuid, text, text, uuid, text, text) from anon;
revoke all on function private.insert_customer_status_history(uuid, uuid, text, text, uuid, text, text) from authenticated;
