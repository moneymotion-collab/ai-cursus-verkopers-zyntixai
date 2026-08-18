/**
 * Platform operator identity for Social closed-beta controls (SMM-R1-B).
 * Fail-closed email allowlist — not org Owner/Admin.
 */

import { normalizeOrganizationInvitationEmail } from "@/features/invitations/domain/email";

export const SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED_ENV =
  "SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED";
export const SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST_ENV =
  "SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST";

export function parseSocialClosedBetaOperatorUiEnabled(
  value: string | undefined | null,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function parseSocialClosedBetaOperatorEmailAllowlist(
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

export function isSocialClosedBetaOperatorEmailAllowlisted(
  email: string | null | undefined,
  allowlist: readonly string[],
): boolean {
  if (!email || allowlist.length === 0) {
    return false;
  }
  const normalized = normalizeOrganizationInvitationEmail(email);
  return allowlist.includes(normalized);
}

/**
 * Platform operator access requires:
 * 1) UI gate exact "true"
 * 2) non-empty email allowlist
 * 3) authenticated user email on allowlist
 *
 * Org Owner/Admin alone is never sufficient.
 */
export function resolveSocialClosedBetaPlatformOperatorAccess(input: {
  email: string | null | undefined;
  env?: Record<string, string | undefined>;
}):
  | { ok: true; email: string }
  | {
      ok: false;
      reason: "ui_disabled" | "allowlist_empty" | "email_not_allowlisted";
    } {
  const env = input.env ?? process.env;
  if (
    !parseSocialClosedBetaOperatorUiEnabled(
      env[SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED_ENV],
    )
  ) {
    return { ok: false, reason: "ui_disabled" };
  }
  const allowlist = parseSocialClosedBetaOperatorEmailAllowlist(
    env[SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST_ENV],
  );
  if (allowlist.length === 0) {
    return { ok: false, reason: "allowlist_empty" };
  }
  if (!isSocialClosedBetaOperatorEmailAllowlisted(input.email, allowlist)) {
    return { ok: false, reason: "email_not_allowlisted" };
  }
  return {
    ok: true,
    email: normalizeOrganizationInvitationEmail(input.email ?? ""),
  };
}
