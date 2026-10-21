/**
 * Dedicated platform-operator identity for ORG-CONTEXT v1 mutations.
 * Closed Beta admission, invitation eligibility, Social operator UI,
 * and Organization Owner/Admin/Staff/Viewer are never sufficient.
 * Privileged database access is not authorization.
 */

import { normalizeOrganizationInvitationEmail } from "@/features/invitations/domain/email";

export const ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV =
  "ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED";

/**
 * Dedicated ORG-CONTEXT platform-operator allowlist.
 * Closed Beta invitation recipients and Social operator UI identity
 * are different security domains and are not consulted here.
 */
export const ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV =
  "ORG_CONTEXT_PLATFORM_OPERATOR_ALLOWLIST";

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
