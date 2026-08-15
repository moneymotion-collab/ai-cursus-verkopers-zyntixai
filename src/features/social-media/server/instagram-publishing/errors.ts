/**
 * Normalize Instagram Graph errors → B1.6 failure classes.
 * Never expose raw provider bodies or tokens to clients.
 */

import "server-only";

import type {
  SocialPublicationFailureClass,
  SocialPublishingAdapterResult,
} from "@/features/social-media/domain/publishing";

export type InstagramHttpAttemptDisposition =
  | "never_sent"
  | "definitive_rejection"
  | "may_have_reached_provider";

export type InstagramNormalizedFailure = {
  outcome: Exclude<
    SocialPublishingAdapterResult["outcome"],
    "succeeded"
  >;
  failureClass: SocialPublicationFailureClass;
  safeErrorCode: string;
  disposition: InstagramHttpAttemptDisposition;
};

export function mapInstagramHttpFailure(input: {
  reason:
    | "timeout"
    | "network_error"
    | "non_2xx"
    | "invalid_json"
    | "invalid_payload"
    | "empty_token"
    | "unsupported_account"
    | "quota_exhausted"
    | "container_expired"
    | "container_error"
    | "poll_timeout"
    | "unsupported_format"
    | "media_invalid"
    | "permission_missing"
    | "adapter_unavailable";
  /** True when the final media_publish request may already have left our process. */
  afterIrreversibleMutation?: boolean;
  httpStatus?: number;
  providerErrorCode?: number | null;
  providerErrorSubcode?: number | null;
}): InstagramNormalizedFailure {
  if (input.afterIrreversibleMutation && input.reason === "timeout") {
    return {
      outcome: "unknown_external_outcome",
      failureClass: "unknown_external_outcome",
      safeErrorCode: "instagram_publish_ambiguous_timeout",
      disposition: "may_have_reached_provider",
    };
  }
  if (input.afterIrreversibleMutation && input.reason === "network_error") {
    return {
      outcome: "unknown_external_outcome",
      failureClass: "unknown_external_outcome",
      safeErrorCode: "instagram_publish_ambiguous_network",
      disposition: "may_have_reached_provider",
    };
  }

  switch (input.reason) {
    case "timeout":
      return {
        outcome: "failed_retryable",
        failureClass: "timeout",
        safeErrorCode: "instagram_http_timeout",
        disposition: "never_sent",
      };
    case "network_error":
      return {
        outcome: "failed_retryable",
        failureClass: "network",
        safeErrorCode: "instagram_network_error",
        disposition: "never_sent",
      };
    case "quota_exhausted":
      return {
        outcome: "failed_retryable",
        failureClass: "rate_limit",
        safeErrorCode: "instagram_quota_exhausted",
        disposition: "definitive_rejection",
      };
    case "container_expired":
      return {
        outcome: "failed_terminal",
        failureClass: "provider_permanent",
        safeErrorCode: "instagram_container_expired",
        disposition: "definitive_rejection",
      };
    case "container_error":
      return {
        outcome: "failed_terminal",
        failureClass: "media",
        safeErrorCode: "instagram_container_error",
        disposition: "definitive_rejection",
      };
    case "poll_timeout":
      return {
        outcome: "failed_retryable",
        failureClass: "timeout",
        safeErrorCode: "instagram_container_poll_timeout",
        disposition: "definitive_rejection",
      };
    case "unsupported_format":
      return {
        outcome: "failed_terminal",
        failureClass: "capability",
        safeErrorCode: "instagram_unsupported_format",
        disposition: "never_sent",
      };
    case "media_invalid":
      return {
        outcome: "failed_terminal",
        failureClass: "media",
        safeErrorCode: "instagram_media_invalid",
        disposition: "never_sent",
      };
    case "permission_missing":
      return {
        outcome: "failed_terminal",
        failureClass: "authorization",
        safeErrorCode: "instagram_publish_permission_missing",
        disposition: "definitive_rejection",
      };
    case "empty_token":
    case "unsupported_account":
      return {
        outcome: "failed_terminal",
        failureClass: "credential",
        safeErrorCode: `instagram_${input.reason}`,
        disposition: "definitive_rejection",
      };
    case "invalid_json":
    case "invalid_payload":
      return {
        outcome: "failed_terminal",
        failureClass: "provider_permanent",
        safeErrorCode: `instagram_${input.reason}`,
        disposition: "definitive_rejection",
      };
    case "non_2xx": {
      const status = input.httpStatus ?? 0;
      if (status === 401 || status === 403) {
        return {
          outcome: "failed_terminal",
          failureClass: "authorization",
          safeErrorCode: "instagram_http_unauthorized",
          disposition: "definitive_rejection",
        };
      }
      if (status === 429) {
        return {
          outcome: "failed_retryable",
          failureClass: "rate_limit",
          safeErrorCode: "instagram_http_rate_limited",
          disposition: "definitive_rejection",
        };
      }
      if (status >= 500) {
        return {
          outcome: "failed_retryable",
          failureClass: "provider_temporary",
          safeErrorCode: "instagram_http_5xx",
          disposition: "definitive_rejection",
        };
      }
      return {
        outcome: "failed_terminal",
        failureClass: "provider_permanent",
        safeErrorCode: "instagram_http_4xx",
        disposition: "definitive_rejection",
      };
    }
    default:
      return {
        outcome: "failed_terminal",
        failureClass: "internal",
        safeErrorCode: "instagram_internal",
        disposition: "never_sent",
      };
  }
}

export function toAdapterFailureResult(
  failure: InstagramNormalizedFailure,
): Exclude<SocialPublishingAdapterResult, { outcome: "succeeded" }> {
  return {
    outcome: failure.outcome,
    failureClass: failure.failureClass,
    safeErrorCode: failure.safeErrorCode,
  };
}
