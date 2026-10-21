import {
  EMPTY_ATTENTION_LIFECYCLE_ACTION_VISIBILITY,
  type AttentionLifecycleActionVisibility,
} from "@/features/attention/domain/lifecycle-action-types";
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import { isTerminalAttentionStatus } from "@/features/attention/domain/status";
import type {
  AttentionItemStatus,
  AttentionRole,
} from "@/features/attention/domain/types";

export type AttentionLifecycleVisibilityItem = {
  status: AttentionItemStatus;
  archivedAt?: string | null;
  assigneeMemberId?: string | null;
};

/**
 * Presentation advice for detail UX action visibility.
 * Does not grant server rights. Broad ATTENTION_LIFECYCLE_ACTIONS_VISIBLE
 * remains false; B1.7.6-B uses a narrow acknowledge/severity product gate.
 */
export function resolveAttentionLifecycleActionVisibility(
  role: AttentionRole | null | undefined,
  item: AttentionLifecycleVisibilityItem,
): AttentionLifecycleActionVisibility {
  const isArchived = item.archivedAt != null;
  const permissions = resolveAttentionPermissions(role, {
    status: item.status,
    isArchived,
  });

  if (isArchived) {
    return { ...EMPTY_ATTENTION_LIFECYCLE_ACTION_VISIBILITY };
  }

  const isTerminal = isTerminalAttentionStatus(item.status);
  const isOpen = item.status === "open";
  const isAssigned = item.assigneeMemberId != null;

  return {
    acknowledge: permissions.canAcknowledge && isOpen,
    assign: permissions.canAssign && !isTerminal,
    unassign: permissions.canAssign && !isTerminal && isAssigned,
    updateSeverity: permissions.canUpdateSeverity && !isTerminal,
    resolve: permissions.canResolve && !isTerminal,
    dismiss: permissions.canDismiss && !isTerminal,
    archive: permissions.canArchive && isTerminal,
  };
}

/** Product lifecycle CTAs remain gated by workflow visibility, not this helper. */
export function attentionLifecycleVisibilityGrantsServerRights(): false {
  return false;
}
