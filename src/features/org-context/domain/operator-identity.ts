/**
 * Platform-operator identity for ORG-CONTEXT v1 mutations.
 * Org Owner/Admin/Staff/Viewer is never sufficient.
 * Privileged database access is not authorization.
 */

import { normalizeOrganizationInvitationEmail } from "@/features/invitations/domain/email";

export const ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV =
  "ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED";

/**
 * Shared Closed Beta platform-operator allowlist.
 * Social UI enablement is a different gate and is not required here.
 */
export const ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV =
  "SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST";

export function parseOrgContextPlatformOperatorEnabled(
  value: string | undefined | null,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function parseOrgContextPlatformOperatorEmailAllowlist(
  value: string | undefined | null,
): readonly string[] {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }
  const seen = new Set<string>();
  for (const part of value.split(",")) {
    const normalized = normalizeOrganizationInvitationEmail(part);
    if (normalized.length === 0) {
      continue;
    }
    seen.add(normalized);
  }
  return [...seen];
}

export function isOrgContextPlatformOperatorEmailAllowlisted(
  email: string | null | undefined,
  allowlist: readonly string[],
): boolean {
  if (!email || allowlist.length === 0) {
    return false;
  }
  const normalized = normalizeOrganizationInvitationEmail(email);
  return allowlist.includes(normalized);
}

export function resolveOrgContextPlatformOperatorAccess(input: {
  email: string | null | undefined;
  env: Record<string, string | undefined>;
}):
  | { ok: true; email: string }
  | {
      ok: false;
      reason: "operator_disabled" | "allowlist_empty" | "email_not_allowlisted";
    } {
  if (
    !parseOrgContextPlatformOperatorEnabled(
      input.env[ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV],
    )
  ) {
    return { ok: false, reason: "operator_disabled" };
  }
  const allowlist = parseOrgContextPlatformOperatorEmailAllowlist(
    input.env[ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV],
  );
  if (allowlist.length === 0) {
    return { ok: false, reason: "allowlist_empty" };
  }
  if (!isOrgContextPlatformOperatorEmailAllowlisted(input.email, allowlist)) {
    return { ok: false, reason: "email_not_allowlisted" };
  }
  return {
    ok: true,
    email: normalizeOrganizationInvitationEmail(input.email ?? ""),
  };
}
