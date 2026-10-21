/**
 * SMM-R1-E-R2-P2 — Controlled publish window binding contracts.
 * Server/DB authoritative. Client UUID is never authorization.
 */

export const SOCIAL_CONTROLLED_PUBLISH_WINDOW_STATUSES = [
  "active",
  "consumed",
  "closed",
  "expired",
] as const;

export type SocialControlledPublishWindowStatus =
  (typeof SOCIAL_CONTROLLED_PUBLISH_WINDOW_STATUSES)[number];

export function isSocialControlledPublishWindowStatus(
  value: string,
): value is SocialControlledPublishWindowStatus {
  return (SOCIAL_CONTROLLED_PUBLISH_WINDOW_STATUSES as readonly string[]).includes(
    value,
  );
}

export type ActiveControlledPublishWindow = {
  windowId: string;
  publicationId: string;
  status: "active";
  maxExecuteCount: number;
  consumedExecuteCount: number;
  authorizedAt: string;
  workspaceId?: string | null;
  connectionId?: string | null;
  expiresAt?: string | null;
};

export const PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW =
  "publication_not_authorized_for_window" as const;

export const CONTROLLED_WINDOW_EXHAUSTED =
  "controlled_window_exhausted" as const;

/** Scheduler-only: no matching active window during controlled rollout. */
export const CONTROLLED_SCHEDULED_ROLLOUT_REQUIRED =
  "controlled_scheduled_rollout_required" as const;

export const CONTROLLED_WINDOW_EXPIRED =
  "controlled_window_expired" as const;

export function userSafeControlledWindowDenialMessage(
  code: string,
): string {
  switch (code) {
    case PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW:
      return "This publication is not authorized for the current publishing window.";
    case CONTROLLED_WINDOW_EXHAUSTED:
      return "The authorized publishing window has already been used.";
    case CONTROLLED_SCHEDULED_ROLLOUT_REQUIRED:
      return "Scheduled publishing requires an authorized one-shot window.";
    case CONTROLLED_WINDOW_EXPIRED:
      return "The authorized publishing window has expired.";
    default:
      return "Publishing is unavailable for this publication.";
  }
}

/**
 * Pure binding check used by tests and UI.
 * When an active window exists, only the authorized publication may Execute.
 */
export function evaluateControlledPublishWindowBinding(input: {
  activeWindow: ActiveControlledPublishWindow | null;
  requestedPublicationId: string;
}): {
  allowed: boolean;
  reason:
    | "ok_no_window"
    | "ok_authorized_match"
    | typeof PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW
    | typeof CONTROLLED_WINDOW_EXHAUSTED;
} {
  const requested = input.requestedPublicationId.trim();
  if (!input.activeWindow) {
    return { allowed: true, reason: "ok_no_window" };
  }
  if (
    input.activeWindow.consumedExecuteCount >= input.activeWindow.maxExecuteCount
  ) {
    return { allowed: false, reason: CONTROLLED_WINDOW_EXHAUSTED };
  }
  if (input.activeWindow.publicationId !== requested) {
    return { allowed: false, reason: PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW };
  }
  return { allowed: true, reason: "ok_authorized_match" };
}

export type ScheduledControlledWindowBindReason =
  | "ok_authorized_match"
  | "ok_unrestricted_no_window"
  | typeof PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW
  | typeof CONTROLLED_WINDOW_EXHAUSTED
  | typeof CONTROLLED_SCHEDULED_ROLLOUT_REQUIRED
  | typeof CONTROLLED_WINDOW_EXPIRED;

/**
 * Fail-closed scheduler bind. Unlike manual Execute, a missing window denies
 * provider write during controlled scheduled rollout. Future unrestricted
 * scheduler mode is explicit (`unrestrictedScheduler === true`) and is not
 * Production default.
 */
export function evaluateScheduledControlledPublishWindowBinding(input: {
  activeWindow: ActiveControlledPublishWindow | null;
  requestedPublicationId: string;
  requestedWorkspaceId?: string | null;
  requestedConnectionId?: string | null;
  nowMs?: number;
  unrestrictedScheduler?: boolean;
}): {
  allowed: boolean;
  reason: ScheduledControlledWindowBindReason;
} {
  if (input.unrestrictedScheduler === true) {
    const permissive = evaluateControlledPublishWindowBinding({
      activeWindow: input.activeWindow,
      requestedPublicationId: input.requestedPublicationId,
    });
    if (permissive.reason === "ok_no_window") {
      return { allowed: true, reason: "ok_unrestricted_no_window" };
    }
    return {
      allowed: permissive.allowed,
      reason: permissive.reason === "ok_authorized_match"
        ? "ok_authorized_match"
        : permissive.reason,
    };
  }

  if (!input.activeWindow) {
    return { allowed: false, reason: CONTROLLED_SCHEDULED_ROLLOUT_REQUIRED };
  }

  const expiresAt = input.activeWindow.expiresAt?.trim();
  if (expiresAt) {
    const expiresAtMs = Date.parse(expiresAt);
    const nowMs = input.nowMs ?? Date.now();
    if (Number.isFinite(expiresAtMs) && nowMs >= expiresAtMs) {
      return { allowed: false, reason: CONTROLLED_WINDOW_EXPIRED };
    }
  }

  if (
    input.activeWindow.consumedExecuteCount >= input.activeWindow.maxExecuteCount
  ) {
    return { allowed: false, reason: CONTROLLED_WINDOW_EXHAUSTED };
  }

  const requested = input.requestedPublicationId.trim();
  if (input.activeWindow.publicationId !== requested) {
    return { allowed: false, reason: PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW };
  }

  const windowWorkspace = input.activeWindow.workspaceId?.trim();
  const requestedWorkspace = input.requestedWorkspaceId?.trim();
  if (windowWorkspace && requestedWorkspace && windowWorkspace !== requestedWorkspace) {
    return { allowed: false, reason: PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW };
  }

  const windowConnection = input.activeWindow.connectionId?.trim();
  const requestedConnection = input.requestedConnectionId?.trim();
  if (
    windowConnection &&
    requestedConnection &&
    windowConnection !== requestedConnection
  ) {
    return { allowed: false, reason: PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW };
  }

  return { allowed: true, reason: "ok_authorized_match" };
}

/** Prepare must not retarget Execute while a window is active. */
export function isPrepareBlockedByActiveControlledWindow(
  activeWindow: ActiveControlledPublishWindow | null,
): boolean {
  return activeWindow != null;
}

export const PREPARE_BLOCKED_BY_CONTROLLED_WINDOW_COPY =
  "A controlled publication is currently authorized for execution. Finish or close that window before preparing another publication.";
