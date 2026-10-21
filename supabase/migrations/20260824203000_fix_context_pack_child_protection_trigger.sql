-- ZyntixAI CTX-1FV-R1C — restore draft terminology writes on the shared
-- child-protection trigger function.
--
-- Incident: CTX-1FV-R1B seed apply failed with 42703 because
-- context_pack_version_protect_children() referenced NEW.mapping_op in a
-- single AND expression. That field exists only on
-- context_capability_mappings. The same function also runs on
-- context_terminology, which has no mapping_op column.
--
-- This migration does NOT rewrite 20260824190000_create_context_pack_registry.sql.
-- It replaces only the function body so mapping-specific fields are read
-- after entering a nested TG_TABLE_NAME / TG_OP branch.
--
-- No DML. No table changes. No trigger drop/recreate. No grants/policies.

do $$
declare
  n_fn integer;
  n_map_trigger integer;
  n_term_trigger integer;
begin
  select count(*)
    into n_fn
  from pg_catalog.pg_proc as p
  inner join pg_catalog.pg_namespace as n
    on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'context_pack_version_protect_children'
    and p.pronargs = 0
    and p.prorettype = 'pg_catalog.trigger'::regtype;
  if n_fn <> 1 then
    raise exception
      'CTX-1FV-R1C: expected public.context_pack_version_protect_children() trigger function once, found %',
      n_fn;
  end if;

  select count(*)
    into n_map_trigger
  from pg_catalog.pg_trigger as t
  inner join pg_catalog.pg_class as c
    on c.oid = t.tgrelid
  inner join pg_catalog.pg_namespace as n
    on n.oid = c.relnamespace
  inner join pg_catalog.pg_proc as p
    on p.oid = t.tgfoid
  where n.nspname = 'public'
    and c.relname = 'context_capability_mappings'
    and t.tgname = 'context_capability_mappings_protect_children'
    and not t.tgisinternal
    and p.proname = 'context_pack_version_protect_children';
  if n_map_trigger <> 1 then
    raise exception
      'CTX-1FV-R1C: expected context_capability_mappings_protect_children once, found %',
      n_map_trigger;
  end if;

  select count(*)
    into n_term_trigger
  from pg_catalog.pg_trigger as t
  inner join pg_catalog.pg_class as c
    on c.oid = t.tgrelid
  inner join pg_catalog.pg_namespace as n
    on n.oid = c.relnamespace
  inner join pg_catalog.pg_proc as p
    on p.oid = t.tgfoid
  where n.nspname = 'public'
    and c.relname = 'context_terminology'
    and t.tgname = 'context_terminology_protect_children'
    and not t.tgisinternal
    and p.proname = 'context_pack_version_protect_children';
  if n_term_trigger <> 1 then
    raise exception
      'CTX-1FV-R1C: expected context_terminology_protect_children once, found %',
      n_term_trigger;
  end if;
end $$;

create or replace function public.context_pack_version_protect_children()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_new_status text;
  v_old_status text;
  v_completeness text;
begin
  if tg_op = 'DELETE' then
    select v.publication_status
      into v_old_status
    from public.context_pack_versions as v
    where v.id = old.version_id;

    if v_old_status in ('published', 'superseded') then
      raise exception
        'CTX: cannot mutate semantic children of a published or superseded context version';
    end if;

    return old;
  end if;

  select v.publication_status, v.completeness
    into v_new_status, v_completeness
  from public.context_pack_versions as v
  where v.id = new.version_id;

  if v_new_status in ('published', 'superseded') then
    raise exception
      'CTX: cannot mutate semantic children of a published or superseded context version';
  end if;

  if tg_op = 'UPDATE' and old.version_id is distinct from new.version_id then
    select v.publication_status
      into v_old_status
    from public.context_pack_versions as v
    where v.id = old.version_id;

    if v_old_status in ('published', 'superseded') then
      raise exception
        'CTX: cannot mutate semantic children of a published or superseded context version';
    end if;
  end if;

  if tg_table_name = 'context_capability_mappings' then
    if tg_op in ('INSERT', 'UPDATE') then
      if new.mapping_op = 'remove'
        and v_completeness = 'full'
      then
        raise exception 'CTX: FULL versions may only SET capability mappings';
      end if;
    end if;
  end if;

  return new;
end;
$$;

comment on function public.context_pack_version_protect_children() is
  'Internal integrity trigger only. Not a Context RPC. Blocks INSERT/UPDATE/DELETE of mappings and terminology for published/superseded versions. Draft child rows remain writable by the migration owner. Does not protect context_pack_readiness.';

revoke all on function public.context_pack_version_protect_children() from public;
revoke all on function public.context_pack_version_protect_children() from anon;
revoke all on function public.context_pack_version_protect_children() from authenticated;
revoke all on function public.context_pack_version_protect_children() from service_role;
