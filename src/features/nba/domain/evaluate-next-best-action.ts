import { isTerminalAttentionStatus } from "@/features/attention/domain/status";
import type {
  AuthorizedNbaContext,
  NextBestAction,
  NextBestActionReasonCode,
  NextBestActionType,
  NbaDestinationIntent,
  NbaEvidenceSummary,
} from "@/features/nba/domain/types";

type NbaCopy = {
  title: string;
  explanation: string;
};

const NBA_COPY_BY_REASON: Record<NextBestActionReasonCode, NbaCopy> = {
  attention_open_needs_acknowledge: {
    title: "Acknowledge this attention item",
    explanation:
      "This attention item is open and should be acknowledged before further operational follow-up.",
  },
  attention_unassigned_needs_owner: {
    title: "Assign an owner",
    explanation:
      "This attention item is acknowledged and has no assignee. Assign an owner to continue follow-up.",
  },
  attention_stale_progress_needs_review: {
    title: "Review progress",
    explanation:
      "Authorized stale or no-recent-progress evidence indicates Progress should be reviewed for this enrollment.",
  },
  attention_open_enrollment_context: {
    title: "Open enrollment",
    explanation:
      "No stronger next action matched. Review the authorized enrollment context for this attention item.",
  },
  attention_open_customer_context: {
    title: "Open customer",
    explanation:
      "No stronger next action matched. Review the authorized customer context for this attention item.",
  },
};

function buildEvidenceSummary(context: AuthorizedNbaContext): NbaEvidenceSummary {
  return {
    status: context.status,
    ...(context.severity !== undefined ? { severity: context.severity } : {}),
    staleProgressEvidence: context.hasStaleProgressEvidence,
  };
}

function authorizedRelatedIds(context: AuthorizedNbaContext): {
  relatedEnrollmentId?: string;
  relatedCustomerId?: string;
  relatedProgramId?: string;
} {
  const related: {
    relatedEnrollmentId?: string;
    relatedCustomerId?: string;
    relatedProgramId?: string;
  } = {};

  if (context.hasAuthorizedEnrollment && context.enrollmentId) {
    related.relatedEnrollmentId = context.enrollmentId;
  }
  if (context.hasAuthorizedCustomer && context.customerId) {
    related.relatedCustomerId = context.customerId;
  }
  // Program id only when enrollment context is authorized (same PE chain).
  if (context.hasAuthorizedEnrollment && context.programId) {
    related.relatedProgramId = context.programId;
  }

  return related;
}

function buildRecommendation(params: {
  context: AuthorizedNbaContext;
  actionType: NextBestActionType;
  reasonCode: NextBestActionReasonCode;
  destination: NbaDestinationIntent;
}): NextBestAction {
  const copy = NBA_COPY_BY_REASON[params.reasonCode];
  return {
    actionType: params.actionType,
    reasonCode: params.reasonCode,
    title: copy.title,
    explanation: copy.explanation,
    destination: params.destination,
    attentionItemId: params.context.attentionItemId,
    ...authorizedRelatedIds(params.context),
    evidenceSummary: buildEvidenceSummary(params.context),
  };
}

/**
 * Pure deterministic Next Best Action mapper.
 * Same authorized input ⇒ same semantic recommendation. No I/O, no time, no mutation.
 */
export function evaluateNextBestAction(
  context: AuthorizedNbaContext,
): NextBestAction | null {
  if (context.archivedAt != null) {
    return null;
  }

  if (isTerminalAttentionStatus(context.status)) {
    return null;
  }

  // RULE 1 — open always acknowledges first.
  if (context.status === "open") {
    return buildRecommendation({
      context,
      actionType: "acknowledge_attention",
      reasonCode: "attention_open_needs_acknowledge",
      destination: { kind: "attention_control", control: "acknowledge" },
    });
  }

  // Remaining catalog applies to acknowledged non-archived items only.
  if (context.status !== "acknowledged") {
    return null;
  }

  // RULE 2 — ownership before progress review.
  if (context.assigneeMemberId == null) {
    return buildRecommendation({
      context,
      actionType: "assign_attention_owner",
      reasonCode: "attention_unassigned_needs_owner",
      destination: { kind: "attention_control", control: "assign" },
    });
  }

  // RULE 3 — stale progress review when enrollment is authorized.
  if (
    context.hasStaleProgressEvidence &&
    context.hasAuthorizedEnrollment
  ) {
    return buildRecommendation({
      context,
      actionType: "review_progress",
      reasonCode: "attention_stale_progress_needs_review",
      destination: { kind: "navigate", target: "progress_list" },
    });
  }

  // RULE 4 — enrollment context fallback.
  if (context.hasAuthorizedEnrollment) {
    return buildRecommendation({
      context,
      actionType: "open_enrollment",
      reasonCode: "attention_open_enrollment_context",
      destination: { kind: "navigate", target: "enrollment_detail" },
    });
  }

  // RULE 5 — customer context fallback.
  if (context.hasAuthorizedCustomer) {
    return buildRecommendation({
      context,
      actionType: "open_customer",
      reasonCode: "attention_open_customer_context",
      destination: { kind: "navigate", target: "customer_detail" },
    });
  }

  // RULE 6
  return null;
}
