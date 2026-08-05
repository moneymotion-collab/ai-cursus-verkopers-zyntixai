import type {
  AttentionPermissionSet,
  AttentionRole,
} from "@/features/attention/domain/types";
import { EMPTY_ATTENTION_PERMISSIONS } from "@/features/attention/domain/types";
import { isTerminalAttentionStatus } from "@/features/attention/domain/status";
import type { AttentionItemStatus } from "@/features/attention/domain/types";

const KNOWN_ROLES: readonly AttentionRole[] = [
  "owner",
  "admin",
  "staff",
  "viewer",
];

export function isKnownAttentionRole(role: string): role is AttentionRole {
  return (KNOWN_ROLES as readonly string[]).includes(role);
}

export type AttentionPermissionContext = {
  isArchived?: boolean;
  status?: AttentionItemStatus | null;
};

/**
 * Pure UI/server convenience hints derived from proven Attention RPC + RLS behavior.
 * Database authorization remains authoritative (B1.7.3).
 *
 * Proven matrix:
 * - List/view non-archived: all active members
 * - View archived: owner/admin only
 * - Mutations (create/signal/ack/assign/severity/resolve/dismiss): owner/admin/staff
 * - Archive + evaluate: owner/admin only
 * - Viewer: read non-archived only
 */
export function resolveAttentionPermissions(
  role: AttentionRole | null | undefined,
  context: AttentionPermissionContext = {},
): AttentionPermissionSet {
  if (!role || !isKnownAttentionRole(role)) {
    return { ...EMPTY_ATTENTION_PERMISSIONS };
  }

  const isArchived = context.isArchived === true;
  const status = context.status ?? null;
  const isTerminal = status != null && isTerminalAttentionStatus(status);

  switch (role) {
    case "owner":
    case "admin":
      return {
        canListItems: true,
        canViewItem: true,
        canViewArchivedItems: true,
        canCreateManualItem: !isArchived,
        canRecordSignal: !isArchived,
        canAcknowledge: !isArchived && !isTerminal,
        canAssign: !isArchived && !isTerminal,
        canUpdateSeverity: !isArchived && !isTerminal,
        canResolve: !isArchived && !isTerminal,
        canDismiss: !isArchived && !isTerminal,
        canArchive: !isArchived && isTerminal,
        canEvaluateRules: true,
      };
    case "staff":
      return {
        canListItems: true,
        canViewItem: !isArchived,
        canViewArchivedItems: false,
        canCreateManualItem: !isArchived,
        canRecordSignal: !isArchived,
        canAcknowledge: !isArchived && !isTerminal,
        canAssign: !isArchived && !isTerminal,
        canUpdateSeverity: !isArchived && !isTerminal,
        canResolve: !isArchived && !isTerminal,
        canDismiss: !isArchived && !isTerminal,
        canArchive: false,
        canEvaluateRules: false,
      };
    case "viewer":
      return {
        canListItems: true,
        canViewItem: !isArchived,
        canViewArchivedItems: false,
        canCreateManualItem: false,
        canRecordSignal: false,
        canAcknowledge: false,
        canAssign: false,
        canUpdateSeverity: false,
        canResolve: false,
        canDismiss: false,
        canArchive: false,
        canEvaluateRules: false,
      };
    default:
      return { ...EMPTY_ATTENTION_PERMISSIONS };
  }
}
