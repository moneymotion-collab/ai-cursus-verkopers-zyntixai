/**
 * Canonical Social Media Management routes and primary-nav metadata (SMM-B1.10).
 */

export const SOCIAL_ROUTE = "/social" as const;
/** Primary-nav label during closed beta (SMM-R1-C). */
export const SOCIAL_NAV_LABEL = "Social — Closed Beta" as const;

/**
 * Capability flag that Social primary-nav *can* appear.
 * Actual visibility is fail-closed via resolveSocialNavVisible + enrollment.
 */
export const SOCIAL_NAV_VISIBLE = true as const;

export const SOCIAL_SECTIONS = [
  "overview",
  "accounts",
  "publish",
  "activity",
] as const;

export type SocialSection = (typeof SOCIAL_SECTIONS)[number];

export function isSocialPathname(pathname: string): boolean {
  return pathname === SOCIAL_ROUTE || pathname.startsWith(`${SOCIAL_ROUTE}/`);
}

export function isSocialWorkspacePathname(pathname: string): boolean {
  return pathname === SOCIAL_ROUTE;
}

export function isSocialSection(value: string | undefined | null): value is SocialSection {
  return (
    typeof value === "string" &&
    (SOCIAL_SECTIONS as readonly string[]).includes(value)
  );
}

export type SocialWorkspaceHrefParams = {
  organizationId?: string;
  section?: SocialSection;
  /** Preserve OAuth continuation query when remapping legacy routes. */
  oauthOutcome?: string;
  oauthFailureStage?: string;
  publicationId?: string;
};

export function buildSocialWorkspaceHref(
  params: SocialWorkspaceHrefParams = {},
): string {
  const search = new URLSearchParams();
  if (params.organizationId) {
    search.set("org", params.organizationId);
  }
  if (params.section && params.section !== "overview") {
    search.set("section", params.section);
  }
  if (params.oauthOutcome) {
    search.set("social_oauth", params.oauthOutcome);
  }
  if (params.oauthFailureStage) {
    search.set("social_oauth_stage", params.oauthFailureStage);
  }
  if (params.publicationId) {
    search.set("publication", params.publicationId);
  }
  const query = search.toString();
  return query.length > 0 ? `${SOCIAL_ROUTE}?${query}` : SOCIAL_ROUTE;
}

/**
 * Historical leftovers must not look like active operator work.
 * Pending shells and unattempted queued rows are evidence fixtures.
 */
export function isHistoricalPendingConnectionShell(status: string): boolean {
  return status === "authorization_pending" || status === "initiated";
}

export function isActiveQueuePublication(input: {
  status: string;
  attemptCount: number;
}): boolean {
  if (input.status !== "queued" && input.status !== "pending") {
    return false;
  }
  // Unattempted queued leftovers from verification prep stay in history.
  return input.attemptCount > 0;
}
