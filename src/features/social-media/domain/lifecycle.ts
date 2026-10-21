/**
 * SMM-B1.9 — Publishing lifecycle, idempotency, retry, and operator health contracts.
 * Pure domain rules. No provider HTTP.
 */

import type {
  SocialPublicationAttemptOutcome,
  SocialPublicationFailureClass,
  SocialPublicationStatus,
} from "./publishing";
import type { SocialConnectionStatus } from "./status";

/** Publication statuses that must never accept a new provider write without operator resolve. */
export const SOCIAL_PUBLICATION_TERMINAL_STATUSES = [
  "succeeded",
  "cancelled",
  "failed_terminal",
] as const satisfies readonly SocialPublicationStatus[];

/** Ambiguous / intervention — provider write forbidden until resolved. */
export const SOCIAL_PUBLICATION_PROVIDER_WRITE_BLOCKED_STATUSES = [
  "succeeded",
  "cancelled",
  "failed_terminal",
  "unknown_external_outcome",
  "manual_intervention",
  "processing",
] as const satisfies readonly SocialPublicationStatus[];

export const SOCIAL_PUBLICATION_ABANDONABLE_STATUSES = [
  "pending",
  "queued",
] as const satisfies readonly SocialPublicationStatus[];

export const SOCIAL_PUBLICATION_SAFE_RETRY_STATUSES = [
  "failed_retryable",
] as const satisfies readonly SocialPublicationStatus[];

/**
 * Prepare may only reuse an existing publication for the same idempotency key
 * when that row is still first-execute / safe-retry eligible.
 *
 * Intentionally excludes `manual_intervention`, `failed_terminal`, `succeeded`,
 * and other write-blocked or terminal statuses so a failed historical Prepare
 * cannot masquerade as a fresh Prepare success without creating a new row.
 */
export const SOCIAL_PUBLICATION_PREPARE_IDEMPOTENT_REUSE_STATUSES = [
  "pending",
  "queued",
  "failed_retryable",
] as const satisfies readonly SocialPublicationStatus[];

export type UnknownExternalResolution =
  | "confirm_not_published"
  | "retain_manual_intervention"
  | "confirm_published_existing_external_id";

export const UNKNOWN_EXTERNAL_RESOLUTIONS = [
  "confirm_not_published",
  "retain_manual_intervention",
  "confirm_published_existing_external_id",
] as const satisfies readonly UnknownExternalResolution[];

export type SocialConnectionOperationalHealth =
  | "healthy"
  | "pending_shell"
  | "reauthorization_required"
  | "permission_missing"
  | "degraded"
  | "provider_unavailable"
  | "disconnected"
  | "revoked"
  | "ineligible";

export type PublicationActionAvailability =
  | { action: "none"; reason: string }
  | { action: "abandon"; reason: null }
  | { action: "reclaim_stale"; reason: null }
  | { action: "resolve_unknown"; reason: null }
  | { action: "request_retry"; reason: null }
  | { action: "execute_blocked"; reason: string };

export function isTerminalPublicationStatus(
  status: SocialPublicationStatus,
): boolean {
  return (
    SOCIAL_PUBLICATION_TERMINAL_STATUSES as readonly SocialPublicationStatus[]
  ).includes(status);
}

export function isProviderWriteBlockedStatus(
  status: SocialPublicationStatus,
): boolean {
  return (
    SOCIAL_PUBLICATION_PROVIDER_WRITE_BLOCKED_STATUSES as readonly SocialPublicationStatus[]
  ).includes(status);
}

export function isAbandonablePublicationStatus(
  status: SocialPublicationStatus,
): boolean {
  return (
    SOCIAL_PUBLICATION_ABANDONABLE_STATUSES as readonly SocialPublicationStatus[]
  ).includes(status);
}

export function isPrepareIdempotentReuseStatus(
  status: SocialPublicationStatus,
): boolean {
  return (
    SOCIAL_PUBLICATION_PREPARE_IDEMPOTENT_REUSE_STATUSES as readonly SocialPublicationStatus[]
  ).includes(status);
}

/**
 * Fail-closed: never auto-retry provider write when Meta may already have processed.
 */
export function isSafeToRetryProviderWrite(input: {
  publicationStatus: SocialPublicationStatus;
  latestAttemptOutcome: SocialPublicationAttemptOutcome | null;
  publishingEnabled: boolean;
}): { allowed: boolean; reason: string } {
  if (!input.publishingEnabled) {
    return { allowed: false, reason: "publishing_gate_off" };
  }
  if (input.publicationStatus === "succeeded") {
    return { allowed: false, reason: "already_succeeded" };
  }
  if (input.publicationStatus === "unknown_external_outcome") {
    return { allowed: false, reason: "ambiguous_provider_outcome" };
  }
  if (input.publicationStatus === "processing") {
    return { allowed: false, reason: "in_flight_or_ambiguous" };
  }
  if (input.publicationStatus === "manual_intervention") {
    return { allowed: false, reason: "manual_intervention_required" };
  }
  if (input.publicationStatus === "cancelled") {
    return { allowed: false, reason: "cancelled" };
  }
  if (input.publicationStatus === "failed_terminal") {
    return { allowed: false, reason: "terminal_failure" };
  }
  if (input.latestAttemptOutcome === "unknown_external_outcome") {
    return { allowed: false, reason: "ambiguous_attempt_outcome" };
  }
  if (input.publicationStatus === "failed_retryable") {
    return { allowed: true, reason: "retryable_failure" };
  }
  if (
    input.publicationStatus === "queued" ||
    input.publicationStatus === "pending"
  ) {
    return { allowed: true, reason: "not_yet_executed" };
  }
  return { allowed: false, reason: "not_claimable" };
}

export function classifyFailureRetryPolicy(
  failureClass: SocialPublicationFailureClass,
): "safely_retryable" | "conditionally_retryable" | "permanent" | "operator" {
  switch (failureClass) {
    case "rate_limit":
    case "provider_temporary":
    case "network":
      return "safely_retryable";
    case "timeout":
      // Timeout after a provider call may be ambiguous; treat as operator when
      // surfaced as unknown_external_outcome separately.
      return "conditionally_retryable";
    case "unknown_external_outcome":
      return "operator";
    case "authorization":
    case "credential":
    case "capability":
    case "validation":
    case "media":
    case "provider_permanent":
    case "adapter_unavailable":
    case "feature_disabled":
    case "workflow_not_ready":
    case "connection_ineligible":
    case "conflict":
    case "internal":
      return "permanent";
    default:
      return "operator";
  }
}

/** Connection health for operator inventory (no live Meta probe). */
export function deriveConnectionOperationalHealth(input: {
  status: SocialConnectionStatus | string;
  health: string | null;
  reauthorizationRequired: boolean;
}): SocialConnectionOperationalHealth {
  if (input.status === "disconnected") {
    return "disconnected";
  }
  if (input.status === "revoked") {
    return "revoked";
  }
  if (input.status === "authorization_pending" || input.status === "initiated") {
    return "pending_shell";
  }
  if (
    input.status === "reauthorization_required" ||
    input.reauthorizationRequired
  ) {
    return "reauthorization_required";
  }
  if (input.status === "permission_missing") {
    return "permission_missing";
  }
  if (input.status !== "connected") {
    return "ineligible";
  }
  if (input.health === "provider_unavailable") {
    return "provider_unavailable";
  }
  if (input.health === "degraded") {
    return "degraded";
  }
  return "healthy";
}

export function isHealthyConnectedAccount(input: {
  status: SocialConnectionStatus | string;
  health: string | null;
  reauthorizationRequired: boolean;
}): boolean {
  return deriveConnectionOperationalHealth(input) === "healthy";
}

export function resolvePublicationOperatorAction(input: {
  status: SocialPublicationStatus;
  claimLeaseExpiresAt: string | null;
  nowIso: string;
  hasExternalPublicationId: boolean;
  publishingEnabled: boolean;
}): PublicationActionAvailability {
  const { status } = input;
  if (isAbandonablePublicationStatus(status)) {
    return { action: "abandon", reason: null };
  }

  const leaseExpired =
    input.claimLeaseExpiresAt != null &&
    Date.parse(input.claimLeaseExpiresAt) < Date.parse(input.nowIso);

  if (
    leaseExpired &&
    (status === "claimed" || status === "processing")
  ) {
    return { action: "reclaim_stale", reason: null };
  }

  if (status === "unknown_external_outcome") {
    return { action: "resolve_unknown", reason: null };
  }

  if (status === "failed_retryable") {
    return { action: "request_retry", reason: null };
  }

  if (status === "succeeded") {
    return {
      action: "execute_blocked",
      reason: "Publication already succeeded; provider write forbidden.",
    };
  }
  if (status === "cancelled") {
    return {
      action: "execute_blocked",
      reason: "Publication abandoned/cancelled.",
    };
  }
  if (status === "processing" || status === "claimed") {
    return {
      action: "execute_blocked",
      reason: leaseExpired
        ? "Stale lease — reclaim required before any action."
        : "Execution lease still active.",
    };
  }
  if (!input.publishingEnabled) {
    return {
      action: "execute_blocked",
      reason: "SOCIAL_PUBLISHING_ENABLED is OFF.",
    };
  }
  return {
    action: "none",
    reason: "No operator lifecycle action for this status.",
  };
}

/**
 * Opaque attempt timeline stage for operator UI (never raw provider bodies).
 */
export function attemptTimelineStage(outcome: SocialPublicationAttemptOutcome): {
  stage: string;
  terminal: boolean;
  ambiguous: boolean;
  safeRetryEligible: boolean;
} {
  switch (outcome) {
    case "processing":
      return {
        stage: "provider_interaction",
        terminal: false,
        ambiguous: false,
        safeRetryEligible: false,
      };
    case "succeeded":
      return {
        stage: "succeeded",
        terminal: true,
        ambiguous: false,
        safeRetryEligible: false,
      };
    case "failed_retryable":
      return {
        stage: "failed",
        terminal: true,
        ambiguous: false,
        safeRetryEligible: true,
      };
    case "failed_terminal":
    case "cancelled":
      return {
        stage: "failed",
        terminal: true,
        ambiguous: false,
        safeRetryEligible: false,
      };
    case "unknown_external_outcome":
      return {
        stage: "ambiguous",
        terminal: true,
        ambiguous: true,
        safeRetryEligible: false,
      };
    default:
      return {
        stage: "unknown",
        terminal: true,
        ambiguous: true,
        safeRetryEligible: false,
      };
  }
}

export function isUnknownExternalResolution(
  value: string,
): value is UnknownExternalResolution {
  return (UNKNOWN_EXTERNAL_RESOLUTIONS as readonly string[]).includes(value);
}
