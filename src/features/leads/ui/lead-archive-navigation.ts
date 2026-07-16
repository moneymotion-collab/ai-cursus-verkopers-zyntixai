import type { LeadRole } from "@/features/leads/domain/types";
import { resolveLeadPermissions } from "@/features/leads/domain/permissions";
import {
  buildBackToLeadsHref,
  buildLeadDetailHref,
} from "@/features/leads/ui/lead-navigation";
import type { LeadListUrlState } from "@/features/leads/ui/lead-list-search-params";

export function buildLeadArchiveSuccessHref(
  leadId: string,
  listState: LeadListUrlState,
  role: LeadRole,
): string {
  const permissions = resolveLeadPermissions(role, { isArchived: true });
  if (permissions.canViewArchivedLeads) {
    return buildLeadDetailHref(leadId, listState);
  }
  return buildBackToLeadsHref(listState);
}
