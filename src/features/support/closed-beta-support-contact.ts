/**
 * Minimal closed-beta support/feedback contact (BETA1-LR-2).
 * Destination comes from server env only. Fail-closed when unset/invalid.
 * Never embeds tokens, cookies, org IDs, or other diagnostics.
 */

export const CLOSED_BETA_SUPPORT_LABEL = "Support & feedback" as const;
export const CLOSED_BETA_SUPPORT_SUBJECT =
  "ZyntixAI Closed Beta feedback" as const;
export const CLOSED_BETA_SUPPORT_BODY = [
  "What happened:",
  "",
  "What you expected:",
  "",
  "Page or feature:",
  "",
  "Steps to reproduce:",
  "",
].join("\n");

const SUPPORT_EMAIL_PATTERN = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

export function parseClosedBetaSupportEmail(
  value: string | undefined,
): string | null {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!SUPPORT_EMAIL_PATTERN.test(normalized)) {
    return null;
  }
  return normalized;
}

export function buildClosedBetaSupportMailto(email: string): string {
  const params = new URLSearchParams({
    subject: CLOSED_BETA_SUPPORT_SUBJECT,
    body: CLOSED_BETA_SUPPORT_BODY,
  });
  return `mailto:${email}?${params.toString()}`;
}

export function resolveClosedBetaSupportMailto(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const email = parseClosedBetaSupportEmail(env.CLOSED_BETA_SUPPORT_EMAIL);
  if (!email) {
    return null;
  }
  return buildClosedBetaSupportMailto(email);
}
