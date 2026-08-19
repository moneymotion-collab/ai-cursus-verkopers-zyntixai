/**
 * Safe Instagram provider-step diagnostics (SMM-R1-E-R1).
 * Never persist tokens, Authorization headers, signed media URLs, or raw bodies.
 */

import "server-only";

export const INSTAGRAM_PROVIDER_STEPS = [
  "create_container",
  "container_status",
  "media_publish",
] as const;

export type InstagramProviderStep = (typeof INSTAGRAM_PROVIDER_STEPS)[number];

export function isInstagramProviderStep(
  value: string,
): value is InstagramProviderStep {
  return (INSTAGRAM_PROVIDER_STEPS as readonly string[]).includes(value);
}

export type InstagramProviderBoundaryState =
  | "never_attempted"
  | "dispatched"
  | "response_received"
  | "definitive_rejection"
  | "ambiguous_transport"
  | "external_id_returned";

/** Safe, persistable diagnostics attached to adapter failures. */
export type InstagramProviderDiagnostics = {
  providerStep: InstagramProviderStep;
  httpStatus: number | null;
  providerErrorCode: number | null;
  providerErrorSubcode: number | null;
  providerErrorType: string | null;
  safeProviderMessage: string | null;
  requestDispatched: boolean;
  responseReceived: boolean;
  externalContainerIdPresent: boolean;
  externalPublicationIdPresent: boolean;
  boundaryState: InstagramProviderBoundaryState;
};

const SAFE_MESSAGE_MAX_LEN = 240;

const UNSAFE_MESSAGE_PATTERNS: readonly RegExp[] = [
  /bearer\s+[a-z0-9._\-+=\/]+/i,
  /access[_-]?token/i,
  /authorization/i,
  /client[_-]?secret/i,
  /api[_-]?key/i,
  /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]+\./,
  /https?:\/\//i,
  /[?&](sig|signature|token|key|secret)=/i,
  /supabase/i,
  /service[_-]?role/i,
  /-----BEGIN/,
];

/**
 * Returns a persistable message only when it is proven free of secrets/URLs.
 * Prefer numeric provider codes; drop the message when unsafe or empty.
 */
export function sanitizeInstagramProviderMessage(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > SAFE_MESSAGE_MAX_LEN) {
    return null;
  }
  // Reject control characters and non-printable bytes.
  if (/[\u0000-\u001f\u007f]/.test(trimmed)) {
    return null;
  }
  for (const pattern of UNSAFE_MESSAGE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return null;
    }
  }
  // Only allow a conservative printable subset (letters, digits, punctuation).
  if (!/^[\p{L}\p{N}\p{P}\p{Zs}]+$/u.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function sanitizeInstagramProviderErrorType(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 64) {
    return null;
  }
  if (!/^[a-z][a-z0-9_.-]{0,63}$/.test(trimmed)) {
    return null;
  }
  return trimmed;
}

export function buildInstagramProviderDiagnostics(input: {
  providerStep: InstagramProviderStep;
  httpStatus?: number | null;
  providerErrorCode?: number | null;
  providerErrorSubcode?: number | null;
  providerErrorType?: string | null;
  providerMessage?: unknown;
  requestDispatched: boolean;
  responseReceived: boolean;
  externalContainerIdPresent?: boolean;
  externalPublicationIdPresent?: boolean;
  ambiguousTransport?: boolean;
}): InstagramProviderDiagnostics {
  const httpStatus =
    typeof input.httpStatus === "number" &&
    Number.isFinite(input.httpStatus) &&
    input.httpStatus >= 100 &&
    input.httpStatus <= 599
      ? Math.trunc(input.httpStatus)
      : null;
  const providerErrorCode =
    typeof input.providerErrorCode === "number" &&
    Number.isFinite(input.providerErrorCode)
      ? Math.trunc(input.providerErrorCode)
      : null;
  const providerErrorSubcode =
    typeof input.providerErrorSubcode === "number" &&
    Number.isFinite(input.providerErrorSubcode)
      ? Math.trunc(input.providerErrorSubcode)
      : null;

  let boundaryState: InstagramProviderBoundaryState = "never_attempted";
  if (input.ambiguousTransport) {
    boundaryState = "ambiguous_transport";
  } else if (input.externalPublicationIdPresent) {
    boundaryState = "external_id_returned";
  } else if (input.responseReceived && httpStatus != null && httpStatus >= 400) {
    boundaryState = "definitive_rejection";
  } else if (input.responseReceived) {
    boundaryState = "response_received";
  } else if (input.requestDispatched) {
    boundaryState = "dispatched";
  }

  return {
    providerStep: input.providerStep,
    httpStatus,
    providerErrorCode,
    providerErrorSubcode,
    providerErrorType: sanitizeInstagramProviderErrorType(input.providerErrorType),
    safeProviderMessage: sanitizeInstagramProviderMessage(input.providerMessage),
    requestDispatched: input.requestDispatched,
    responseReceived: input.responseReceived,
    externalContainerIdPresent: Boolean(input.externalContainerIdPresent),
    externalPublicationIdPresent: Boolean(input.externalPublicationIdPresent),
    boundaryState,
  };
}

/** Server-only structured log — never includes tokens, URLs, or raw bodies. */
export function logInstagramProviderDiagnostic(input: {
  organizationId: string;
  publicationId: string;
  attemptId?: string | null;
  provider?: "instagram";
  diagnostics: InstagramProviderDiagnostics;
  safeErrorCode: string;
  outcome: string;
  failureClass: string;
}): void {
  console.info(
    JSON.stringify({
      level: "info",
      event: "instagram_provider_diagnostic",
      provider: input.provider ?? "instagram",
      organization_id: input.organizationId,
      publication_id: input.publicationId,
      attempt_id: input.attemptId ?? null,
      provider_step: input.diagnostics.providerStep,
      http_status: input.diagnostics.httpStatus,
      provider_error_code: input.diagnostics.providerErrorCode,
      provider_error_subcode: input.diagnostics.providerErrorSubcode,
      provider_error_type: input.diagnostics.providerErrorType,
      safe_error_code: input.safeErrorCode,
      outcome: input.outcome,
      failure_class: input.failureClass,
      request_dispatched: input.diagnostics.requestDispatched,
      response_received: input.diagnostics.responseReceived,
      external_container_id_present:
        input.diagnostics.externalContainerIdPresent,
      external_publication_id_present:
        input.diagnostics.externalPublicationIdPresent,
      boundary_state: input.diagnostics.boundaryState,
    }),
  );
}
