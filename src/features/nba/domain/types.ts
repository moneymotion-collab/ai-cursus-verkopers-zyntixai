import type {
  AttentionItemStatus,
  AttentionSeverity,
} from "@/features/attention/domain/types";

/**
 * Constrained NBA MVP action catalog.
 * resolve_attention / dismiss_attention / create_follow_up_task are intentionally absent.
 */
export const NEXT_BEST_ACTION_TYPES = [
  "acknowledge_attention",
  "assign_attention_owner",
  "review_progress",
  "open_enrollment",
  "open_customer",
] as const;

export type NextBestActionType = (typeof NEXT_BEST_ACTION_TYPES)[number];

export const NEXT_BEST_ACTION_REASON_CODES = [
  "attention_open_needs_acknowledge",
  "attention_unassigned_needs_owner",
  "attention_stale_progress_needs_review",
  "attention_open_enrollment_context",
  "attention_open_customer_context",
] as const;

export type NextBestActionReasonCode =
  (typeof NEXT_BEST_ACTION_REASON_CODES)[number];

export type NbaAttentionControl = "acknowledge" | "assign";

export type NbaNavigateTarget =
  | "progress_list"
  | "enrollment_detail"
  | "customer_detail";

export type NbaDestinationIntent =
  | { kind: "attention_control"; control: NbaAttentionControl }
  | { kind: "navigate"; target: NbaNavigateTarget };

/**
 * Already-authorized, sanitized mapper input.
 * Assembly/authorization belongs to later NBA-I — not this pure domain slice.
 */
export type AuthorizedNbaContext = {
  attentionItemId: string;
  status: AttentionItemStatus;
  archivedAt: string | null;
  assigneeMemberId: string | null;
  /** Explain-only metadata; must not change first-match selection. */
  severity?: AttentionSeverity;
  hasStaleProgressEvidence: boolean;
  hasAuthorizedEnrollment: boolean;
  hasAuthorizedCustomer: boolean;
  enrollmentId?: string | null;
  customerId?: string | null;
  programId?: string | null;
};

export type NbaEvidenceSummary = {
  status: AttentionItemStatus;
  severity?: AttentionSeverity;
  staleProgressEvidence: boolean;
};

/**
 * Semantic NBA recommendation result.
 * generatedAt is intentionally omitted (stamped later by read assembly).
 */
export type NextBestAction = {
  actionType: NextBestActionType;
  reasonCode: NextBestActionReasonCode;
  title: string;
  explanation: string;
  destination: NbaDestinationIntent;
  attentionItemId: string;
  relatedEnrollmentId?: string;
  relatedCustomerId?: string;
  relatedProgramId?: string;
  evidenceSummary: NbaEvidenceSummary;
};

export function isNextBestActionType(
  value: string,
): value is NextBestActionType {
  return (NEXT_BEST_ACTION_TYPES as readonly string[]).includes(value);
}

export function isNextBestActionReasonCode(
  value: string,
): value is NextBestActionReasonCode {
  return (NEXT_BEST_ACTION_REASON_CODES as readonly string[]).includes(value);
}
