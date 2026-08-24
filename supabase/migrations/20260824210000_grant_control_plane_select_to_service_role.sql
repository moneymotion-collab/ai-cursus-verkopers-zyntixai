-- ZyntixAI CONTROL-PLANE-READ-1B — least-privilege catalog read boundary.
--
-- CONTROL-PLANE-READ-1A selected:
--   service_role → SELECT only → exact 15 global TAX/CAP/CTX tables.
--
-- This is an explicit later exception to the original TAX-1 / CAP-1 / CTX-1
-- deny-by-default REVOKE ALL (including service_role). Historical schema
-- files are not rewritten.
--
-- Client roles (public, anon, authenticated) remain without table privileges.
-- No policies. No RLS change. No functions. No views. No catalog DML.
-- Does not change catalog row contents or readiness values.
-- Does not assign Context to tenants. Does not create a resolver.
-- Not a Production apply by itself.

do $$
declare
  missing text;
begin
  select string_agg(expected.relname, ', ' order by expected.relname)
    into missing
  from (
    values
      ('taxonomy_releases'),
      ('taxonomy_foundations'),
      ('taxonomy_industries'),
      ('taxonomy_niches'),
      ('taxonomy_specializations'),
      ('taxonomy_deep_specializations'),
      ('taxonomy_aliases'),
      ('capabilities'),
      ('capability_dependencies'),
      ('capability_readiness'),
      ('context_packs'),
      ('context_pack_versions'),
      ('context_capability_mappings'),
      ('context_terminology'),
      ('context_pack_readiness')
  ) as expected(relname)
  where not exists (
    select 1
    from pg_catalog.pg_class as c
    inner join pg_catalog.pg_namespace as n
      on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = expected.relname
      and c.relkind = 'r'
  );

  if missing is not null then
    raise exception
      'CONTROL-PLANE-READ-1B: missing required control-plane table(s): %',
      missing;
  end if;
end $$;

grant select on table public.taxonomy_releases to service_role;
grant select on table public.taxonomy_foundations to service_role;
grant select on table public.taxonomy_industries to service_role;
grant select on table public.taxonomy_niches to service_role;
grant select on table public.taxonomy_specializations to service_role;
grant select on table public.taxonomy_deep_specializations to service_role;
grant select on table public.taxonomy_aliases to service_role;

grant select on table public.capabilities to service_role;
grant select on table public.capability_dependencies to service_role;
grant select on table public.capability_readiness to service_role;

grant select on table public.context_packs to service_role;
grant select on table public.context_pack_versions to service_role;
grant select on table public.context_capability_mappings to service_role;
grant select on table public.context_terminology to service_role;
grant select on table public.context_pack_readiness to service_role;
