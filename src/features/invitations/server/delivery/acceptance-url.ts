import "server-only";

import { isInvitationRawTokenShape } from "@/features/invitations/domain/raw-token-shape";
import { resolveSiteOrigin } from "@/lib/env/site-origin";

export const INVITATION_ACCEPTANCE_EXCHANGE_PATH =
  "/invite/accept/exchange" as const;

/**
 * Build the trusted invitation acceptance exchange URL.
 * Origin from resolveSiteOrigin — never from client input.
 */
export function buildInvitationAcceptanceUrl(
  rawToken: string,
  env: Record<string, string | undefined> = process.env,
): string | null {
  if (!isInvitationRawTokenShape(rawToken)) {
    return null;
  }

  const origin = resolveSiteOrigin(env);
  const url = new URL(INVITATION_ACCEPTANCE_EXCHANGE_PATH, `${origin}/`);
  url.searchParams.set("token", rawToken);
  return url.toString();
}
