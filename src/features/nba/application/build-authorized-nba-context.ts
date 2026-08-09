import type { AttentionItemDetailReadModel } from "@/features/attention/domain/read-types";
import type { AuthorizedNbaContext } from "@/features/nba/domain/types";

function hasStaleProgressEvidenceFromSignals(
  signals: AttentionItemDetailReadModel["signals"],
): boolean {
  return signals.some(
    (signal) =>
      signal.ruleKey === "enrollment_no_recent_progress" ||
      signal.evidence.kind === "stale_progress",
  );
}

/**
 * Pure Attention detail → AuthorizedNbaContext assembler.
 * Assumes the detail model is already server-authorized. No I/O.
 */
export function buildAuthorizedNbaContext(
  item: AttentionItemDetailReadModel,
): AuthorizedNbaContext {
  const hasAuthorizedEnrollment = item.enrollment != null;
  const hasAuthorizedCustomer = item.customer != null;

  return {
    attentionItemId: item.id,
    status: item.status,
    archivedAt: item.archivedAt,
    assigneeMemberId: item.assigneeMemberId,
    severity: item.severity,
    hasStaleProgressEvidence: hasStaleProgressEvidenceFromSignals(item.signals),
    hasAuthorizedEnrollment,
    hasAuthorizedCustomer,
    ...(hasAuthorizedEnrollment
      ? { enrollmentId: item.enrollment!.id }
      : {}),
    ...(hasAuthorizedCustomer ? { customerId: item.customer!.id } : {}),
  };
}
