/**
 * SMM-R1-E-R2-P2 — Controlled publish window binding contracts.
 * Server/DB authoritative. Client UUID is never authorization.
 */

export const SOCIAL_CONTROLLED_PUBLISH_WINDOW_STATUSES = [
  "active",
  "consumed",
  "closed",
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
};

export const PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW =
  "publication_not_authorized_for_window" as const;

export const CONTROLLED_WINDOW_EXHAUSTED =
  "controlled_window_exhausted" as const;

export function userSafeControlledWindowDenialMessage(
  code: string,
): string {
  switch (code) {
    case PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW:
      return "This publication is not authorized for the current publishing window.";
    case CONTROLLED_WINDOW_EXHAUSTED:
      return "The authorized publishing window has already been used.";
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

/** Prepare must not retarget Execute while a window is active. */
export function isPrepareBlockedByActiveControlledWindow(
  activeWindow: ActiveControlledPublishWindow | null,
): boolean {
  return activeWindow != null;
}

export const PREPARE_BLOCKED_BY_CONTROLLED_WINDOW_COPY =
  "A controlled publication is currently authorized for execution. Finish or close that window before preparing another publication.";
