-- ZyntixAI CTX-1FV-R1A — restore intended context_packs.pack_key grammar.
--
-- Incident: CTX-1FV Production apply reconstructed the frozen POSIX
-- backslash-dot literal with different escaping, so live
-- context_packs_key_format_check rejected the dotted namespaced seed keys.
--
-- This migration does NOT rewrite 20260824190000_create_context_pack_registry.sql.
-- It replaces only context_packs_key_format_check with a transport-safe
-- equivalent that uses `[.]` (literal dot, no backslash).
--
-- No DML. No other objects. No table removal. No grants/policies.

do $$
declare
  n_table integer;
  n_constraint integer;
begin
  select count(*)
    into n_table
  from pg_catalog.pg_class as c
  inner join pg_catalog.pg_namespace as n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'context_packs'
    and c.relkind = 'r';
  if n_table <> 1 then
    raise exception
      'CTX-1FV-R1A: expected public.context_packs to exist exactly once, found %',
      n_table;
  end if;

  select count(*)
    into n_constraint
  from pg_catalog.pg_constraint as con
  inner join pg_catalog.pg_class as c
    on c.oid = con.conrelid
  inner join pg_catalog.pg_namespace as n
    on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'context_packs'
    and con.conname = 'context_packs_key_format_check';
  if n_constraint <> 1 then
    raise exception
      'CTX-1FV-R1A: expected exactly one context_packs_key_format_check, found %',
      n_constraint;
  end if;
end $$;

alter table public.context_packs
  drop constraint context_packs_key_format_check;

alter table public.context_packs
  add constraint context_packs_key_format_check check (
    pack_key ~ '^[a-z][a-z0-9_]*([.][a-z0-9]+(-[a-z0-9]+)*)+$'
    and char_length(pack_key) between 3 and 160
  );
