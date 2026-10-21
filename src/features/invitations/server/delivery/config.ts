import "server-only";

import { normalizeOrganizationInvitationEmail } from "@/features/invitations/domain/email";

/**
 * Fail-closed invitation email delivery gate (CB-E1-A).
 * Only exact normalized "true" enables delivery eligibility.
 */
export function parseInvitationEmailDeliveryEnabled(
  value: string | undefined,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function isInvitationEmailDeliveryEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return parseInvitationEmailDeliveryEnabled(
    env.INVITATION_EMAIL_DELIVERY_ENABLED,
  );
}

/**
 * Comma-separated allowlist. Missing/blank → empty set (fail closed when delivery ON).
 */
export function parseInvitationEmailRecipientAllowlist(
  value: string | undefined,
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

export function readInvitationEmailRecipientAllowlist(
  env: Record<string, string | undefined> = process.env,
): readonly string[] {
  return parseInvitationEmailRecipientAllowlist(
    env.INVITATION_EMAIL_RECIPIENT_ALLOWLIST,
  );
}

export function isInvitationEmailRecipientAllowlisted(
  email: string,
  allowlist: readonly string[],
): boolean {
  if (allowlist.length === 0) {
    return false;
  }
  const normalized = normalizeOrganizationInvitationEmail(email);
  return allowlist.includes(normalized);
}

export type InvitationEmailDeliveryRuntimeConfig =
  | { kind: "disabled" }
  | {
      kind: "ready";
      apiKey: string;
      from: string;
      allowlist: readonly string[];
    }
  | { kind: "configuration_error" };

/**
 * Resolve delivery runtime config.
 * When delivery is OFF, secrets may be absent.
 * When ON, missing API key / From / empty allowlist → configuration_error (fail closed).
 */
export function resolveInvitationEmailDeliveryRuntimeConfig(
  env: Record<string, string | undefined> = process.env,
): InvitationEmailDeliveryRuntimeConfig {
  if (!isInvitationEmailDeliveryEnabled(env)) {
    return { kind: "disabled" };
  }

  const apiKey = env.RESEND_API_KEY?.trim() ?? "";
  const from = env.INVITATION_EMAIL_FROM?.trim() ?? "";
  const allowlist = readInvitationEmailRecipientAllowlist(env);

  if (apiKey.length === 0 || from.length === 0 || allowlist.length === 0) {
    return { kind: "configuration_error" };
  }

  return { kind: "ready", apiKey, from, allowlist };
}
