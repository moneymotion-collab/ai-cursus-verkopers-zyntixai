import type { LeadRole } from "@/features/leads/domain/types";
import {
  buildLeadListQueryString,
  parseLeadListSearchParams,
  type LeadListUrlState,
} from "@/features/leads/ui/lead-list-search-params";

export function parseLeadListReturnState(
  raw: Record<string, string | string[] | undefined>,
  role: LeadRole,
): LeadListUrlState {
  return parseLeadListSearchParams(raw, { role }).urlState;
}

export function buildBackToLeadsHref(listState: LeadListUrlState): string {
  return `/leads${buildLeadListQueryString(listState)}`;
}

export function buildLeadDetailHref(
  leadId: string,
  listState: LeadListUrlState,
): string {
  const query = buildLeadListQueryString(listState);
  return `/leads/${leadId}${query}`;
}

export function buildLeadCreateHref(listState: LeadListUrlState): string {
  return `/leads/new${buildLeadListQueryString(listState)}`;
}

export function buildLeadEditHref(
  leadId: string,
  listState: LeadListUrlState,
): string {
  return `/leads/${leadId}/edit${buildLeadListQueryString(listState)}`;
}

export function buildLeadStageHref(
  leadId: string,
  listState: LeadListUrlState,
): string {
  return `/leads/${leadId}/stage${buildLeadListQueryString(listState)}`;
}

export function buildLeadStatusHref(
  leadId: string,
  listState: LeadListUrlState,
): string {
  return `/leads/${leadId}/status${buildLeadListQueryString(listState)}`;
}

export function buildLeadConvertHref(
  leadId: string,
  listState: LeadListUrlState,
): string {
  return `/leads/${leadId}/convert${buildLeadListQueryString(listState)}`;
}

export function buildLeadArchiveHref(
  leadId: string,
  listState: LeadListUrlState,
): string {
  return `/leads/${leadId}/archive${buildLeadListQueryString(listState)}`;
}

export function buildLeadRestoreHref(
  leadId: string,
  listState: LeadListUrlState,
): string {
  return `/leads/${leadId}/restore${buildLeadListQueryString(listState)}`;
}

export function buildCustomerDetailHrefFromLead(
  customerId: string,
  organizationId: string,
): string {
  const params = new URLSearchParams();
  params.set("org", organizationId);
  return `/customers/${customerId}?${params.toString()}`;
}

export function buildTaskDetailHrefFromLead(
  taskId: string,
  organizationId: string,
): string {
  const params = new URLSearchParams();
  params.set("org", organizationId);
  return `/tasks/${taskId}?${params.toString()}`;
}
