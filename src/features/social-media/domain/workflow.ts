/**
 * Content versioning, review, approval, and calendar planning (SMM-B1.5).
 * Editorial workflow only — not provider publication.
 */

export const SOCIAL_REVIEW_REQUEST_STATUSES = [
  "open",
  "completed",
  "cancelled",
  "superseded",
] as const;

export type SocialReviewRequestStatus =
  (typeof SOCIAL_REVIEW_REQUEST_STATUSES)[number];

export function isSocialReviewRequestStatus(
  value: string,
): value is SocialReviewRequestStatus {
  return (SOCIAL_REVIEW_REQUEST_STATUSES as readonly string[]).includes(value);
}

export const SOCIAL_APPROVAL_CONTEXTS = ["internal", "client"] as const;

export type SocialApprovalContext = (typeof SOCIAL_APPROVAL_CONTEXTS)[number];

export function isSocialApprovalContext(
  value: string,
): value is SocialApprovalContext {
  return (SOCIAL_APPROVAL_CONTEXTS as readonly string[]).includes(value);
}

export const SOCIAL_APPROVAL_DECISIONS = [
  "approved",
  "changes_requested",
  "rejected",
] as const;

export type SocialApprovalDecisionKind =
  (typeof SOCIAL_APPROVAL_DECISIONS)[number];

export function isSocialApprovalDecisionKind(
  value: string,
): value is SocialApprovalDecisionKind {
  return (SOCIAL_APPROVAL_DECISIONS as readonly string[]).includes(value);
}

export const SOCIAL_SCHEDULE_SLOT_STATUSES = ["active", "cancelled"] as const;

export type SocialScheduleSlotStatus =
  (typeof SOCIAL_SCHEDULE_SLOT_STATUSES)[number];

export function isSocialScheduleSlotStatus(
  value: string,
): value is SocialScheduleSlotStatus {
  return (SOCIAL_SCHEDULE_SLOT_STATUSES as readonly string[]).includes(value);
}

/**
 * Beta 1 executes internal approval only (D). Client context is a future extension.
 * Client portal identities are not implemented; client decisions cannot be recorded yet.
 */
export const SOCIAL_CLIENT_APPROVAL_B15_DECISION =
  "deferred_internal_only_client_flag_extension" as const;

/** Self-approval is allowed for Beta 1 owner-operated / Staff creative workflows. */
export const SOCIAL_SELF_APPROVAL_B15_POLICY = "allowed" as const;

/**
 * Workflow readiness is editorial only.
 * It does not prove provider connection health, tokens, or API publishability.
 */
export type SocialVariantVersionWorkflowReadiness = {
  workflowReady: boolean;
  hasInternalApproval: boolean;
  hasClientApproval: boolean;
  internalApprovalRequired: boolean;
  clientApprovalRequired: boolean;
  hasActiveSchedule: boolean;
  mediaAssetsAvailable: boolean;
  isOverdueReview: boolean;
  /** Always false in B1.5 — publishing infrastructure is B1.6+. */
  providerPublishable: false;
};

export function isReviewOverdue(
  status: string,
  dueAt: string | null | undefined,
  nowIso: string,
): boolean {
  if (status !== "open" || !dueAt) return false;
  return Date.parse(dueAt) < Date.parse(nowIso);
}

export function computeWorkflowReady(input: {
  workspaceArchived: boolean;
  contentArchived: boolean;
  variantArchived: boolean;
  mediaAssetsAvailable: boolean;
  internalApprovalRequired: boolean;
  clientApprovalRequired: boolean;
  hasInternalApproval: boolean;
  hasClientApproval: boolean;
}): boolean {
  if (
    input.workspaceArchived ||
    input.contentArchived ||
    input.variantArchived ||
    !input.mediaAssetsAvailable
  ) {
    return false;
  }
  if (input.internalApprovalRequired && !input.hasInternalApproval) {
    return false;
  }
  if (input.clientApprovalRequired && !input.hasClientApproval) {
    return false;
  }
  return true;
}

export type SocialContentItemVersion = {
  id: string;
  organizationId: string;
  contentId: string;
  versionNumber: number;
  internalTitle: string;
  previousVersionId: string | null;
};

export type SocialContentVariantVersion = {
  id: string;
  organizationId: string;
  variantId: string;
  versionNumber: number;
  plannedProvider: string;
  contentFormat: string;
  mediaSnapshot: unknown;
  previousVersionId: string | null;
};

export type SocialReviewRequest = {
  id: string;
  organizationId: string;
  variantVersionId: string;
  status: SocialReviewRequestStatus;
  approvalContext: SocialApprovalContext;
  dueAt: string | null;
};

export type SocialApprovalDecision = {
  id: string;
  organizationId: string;
  variantVersionId: string;
  approvalContext: SocialApprovalContext;
  decision: SocialApprovalDecisionKind;
};

export type SocialContentScheduleSlot = {
  id: string;
  organizationId: string;
  variantVersionId: string;
  plannedAt: string;
  planningTimezone: string;
  status: SocialScheduleSlotStatus;
};

/** Forbidden publication states on schedule/workflow in B1.5. */
export const SOCIAL_WORKFLOW_FORBIDDEN_PUBLICATION_STATES = [
  "published",
  "provider_failed",
  "retrying",
  "processing",
  "queued",
] as const;
