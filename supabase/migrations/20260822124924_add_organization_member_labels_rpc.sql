-- BETA1-LR-2-R1: org-scoped member display labels for assignee selectors.
-- profiles_select_own hides colleague display_name from authenticated reads.
-- This RPC returns only membership_id + display_label for callers who are
-- active members of the requested organization. No emails, no auth user ids.

create or replace function public.list_organization_member_labels(
  p_organization_id uuid,
  p_membership_ids uuid[] default null
)
returns table (
  membership_id uuid,
  display_label text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_organization_id is null then
    return;
  end if;

  if not private.is_org_member(p_organization_id) then
    return;
  end if;

  return query
  select
    om.id,
    coalesce(
      nullif(btrim(p.display_name), ''),
      nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
      'Team member'
    )
  from public.organization_members as om
  join auth.users as u
    on u.id = om.user_id
  left join public.profiles as p
    on p.id = om.user_id
  where om.organization_id = p_organization_id
    and (
      (
        p_membership_ids is null
        and om.status = 'active'
      )
      or (
        p_membership_ids is not null
        and om.id = any (p_membership_ids)
      )
    )
  order by om.joined_at asc, om.id asc;
end;
$$;

comment on function public.list_organization_member_labels(uuid, uuid[]) is
  'Returns org-scoped membership display labels for an active caller. Fail-closed for foreign orgs. No emails or auth ids.';

revoke all on function public.list_organization_member_labels(uuid, uuid[]) from public;
revoke all on function public.list_organization_member_labels(uuid, uuid[]) from anon;
grant execute on function public.list_organization_member_labels(uuid, uuid[]) to authenticated;
