import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadRole } from "@/features/leads/domain/types";
import { resolveLeadPermissions } from "@/features/leads/domain/permissions";
import { getAllowedLeadStatusTransitions } from "@/features/leads/domain/status";

type LeadWorkflowTarget = Pick<LeadDetailReadModel, "status" | "derived">;

export function canShowCreateLeadWorkflow(role: LeadRole): boolean {
  return resolveLeadPermissions(role).canCreateLead;
}

export function canShowEditLeadWorkflow(
  lead: LeadWorkflowTarget,
  role: LeadRole,
): boolean {
  const permissions = resolveLeadPermissions(role, {
    isArchived: lead.derived.isArchived,
    status: lead.status,
  });
  return permissions.canEditLeadProfile && !lead.derived.isArchived;
}

export function canShowStageLeadWorkflow(
  lead: LeadWorkflowTarget,
  role: LeadRole,
): boolean {
  const permissions = resolveLeadPermissions(role, {
    isArchived: lead.derived.isArchived,
    status: lead.status,
  });
  return permissions.canTransitionLeadStage && !lead.derived.isArchived && lead.status === "open";
}

export function canShowStatusLeadWorkflow(
  lead: LeadWorkflowTarget,
  role: LeadRole,
): boolean {
  const permissions = resolveLeadPermissions(role, {
    isArchived: lead.derived.isArchived,
    status: lead.status,
  });
  return (
    permissions.canTransitionLeadStatus &&
    !lead.derived.isArchived &&
    !lead.derived.isConverted &&
    getAllowedLeadStatusTransitions(lead.status).length > 0
  );
}

export function canShowConvertLeadWorkflow(
  lead: LeadWorkflowTarget,
  role: LeadRole,
): boolean {
  const permissions = resolveLeadPermissions(role, {
    isArchived: lead.derived.isArchived,
    status: lead.status,
  });
  return permissions.canConvertLead && !lead.derived.isArchived && lead.status === "open";
}

export function canShowArchiveLeadWorkflow(
  lead: LeadWorkflowTarget,
  role: LeadRole,
): boolean {
  const permissions = resolveLeadPermissions(role, {
    isArchived: lead.derived.isArchived,
    status: lead.status,
  });
  return permissions.canArchiveLead && !lead.derived.isArchived;
}

export function canShowRestoreLeadWorkflow(
  lead: LeadWorkflowTarget,
  role: LeadRole,
): boolean {
  const permissions = resolveLeadPermissions(role, {
    isArchived: lead.derived.isArchived,
    status: lead.status,
  });
  return permissions.canRestoreLead && lead.derived.isArchived;
}
