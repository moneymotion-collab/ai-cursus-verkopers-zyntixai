import { isKnownAttentionRole } from "@/features/attention/domain/permissions";
import type { AttentionRole } from "@/features/attention/domain/types";

/**
 * Read-only enrollment → Attention list entrypoint visibility (B1.7.5-E).
 * Uses authorized enrollment detail context only — no count or preflight query.
 * Any known Attention role that can open the enrollment detail may follow the link;
 * server-side Attention list authorization remains authoritative.
 */
export function canShowEnrollmentViewAttentionEntry(params: {
  role: AttentionRole | string;
  isEnrollmentUnavailable?: boolean;
}): boolean {
  if (params.isEnrollmentUnavailable) {
    return false;
  }
  return isKnownAttentionRole(params.role);
}
