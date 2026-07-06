-- ZyntixAI: tenant anchor for composite foreign keys to organization_members

alter table public.organization_members
  add constraint organization_members_org_id_unique unique (organization_id, id);
