import type { LeadPermissionSet, LeadRole, LeadStatus } from "@/features/leads/domain/types";
import { EMPTY_LEAD_PERMISSIONS } from "@/features/leads/domain/types";
import { isConvertibleLeadStatus } from "@/features/leads/domain/status";

const KNOWN_ROLES: readonly LeadRole[] = ["owner", "admin", "staff", "viewer"];

export function isKnownLeadRole(role: string): role is LeadRole {
  return (KNOWN_ROLES as readonly string[]).includes(role);
}

export type LeadPermissionContext = {
  isArchived?: boolean;
  status?: LeadStatus;
};

/**
 * Pure UI permission hints derived from verified lead RLS and RPC role behavior.
 * Database authorization remains authoritative.
 *
 * Role evidence:
 * - create / stage / status / convert: owner, admin, staff
 * - archive / restore: owner, admin
 * - select archived: owner, admin (RLS admin policy)
 * - profile UPDATE: owner, admin, staff on non-archived rows
 * - stage transition RPC: only open, non-archived
 * - status transition RPC: non-converted, non-archived
 * - convert RPC: only open, non-archived
 */
export function resolveLeadPermissions(
  role: LeadRole | null | undefined,
  context: LeadPermissionContext = {},
): LeadPermissionSet {
  if (!role) {
    return { ...EMPTY_LEAD_PERMISSIONS };
  }

  const isArchived = context.isArchived === true;
  const status = context.status;
  const isOpen = status == null || isConvertibleLeadStatus(status);
  const isConverted = status === "converted";
  const canMutateLifecycle = !isArchived && isOpen;
  const canMutateStatus = !isArchived && !isConverted;

  switch (role) {
    case "owner":
    case "admin":
      return {
        canViewLead: true,
        canViewArchivedLeads: true,
        canCreateLead: true,
        canEditLeadProfile: !isArchived,
        canTransitionLeadStage: canMutateLifecycle,
        canTransitionLeadStatus: canMutateStatus,
        canConvertLead: canMutateLifecycle,
        canArchiveLead: !isArchived,
        canRestoreLead: isArchived,
        canViewStatusHistory: true,
        canViewStageHistory: true,
        canViewRelatedTasks: true,
      };
    case "staff":
      return {
        canViewLead: !isArchived,
        canViewArchivedLeads: false,
        canCreateLead: true,
        canEditLeadProfile: !isArchived,
        canTransitionLeadStage: canMutateLifecycle,
        canTransitionLeadStatus: canMutateStatus,
        canConvertLead: canMutateLifecycle,
        canArchiveLead: false,
        canRestoreLead: false,
        canViewStatusHistory: !isArchived,
        canViewStageHistory: !isArchived,
        canViewRelatedTasks: !isArchived,
      };
    case "viewer":
      return {
        canViewLead: !isArchived,
        canViewArchivedLeads: false,
        canCreateLead: false,
        canEditLeadProfile: false,
        canTransitionLeadStage: false,
        canTransitionLeadStatus: false,
        canConvertLead: false,
        canArchiveLead: false,
        canRestoreLead: false,
        canViewStatusHistory: !isArchived,
        canViewStageHistory: !isArchived,
        canViewRelatedTasks: !isArchived,
      };
    default:
      return { ...EMPTY_LEAD_PERMISSIONS };
  }
}
