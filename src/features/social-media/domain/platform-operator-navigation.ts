export const SOCIAL_CLOSED_BETA_OPERATOR_ROUTE = "/operator/social-beta";
export const SOCIAL_CLOSED_BETA_OPERATOR_NAV_LABEL = "Social Beta";

export function isSocialClosedBetaOperatorPathname(pathname: string): boolean {
  return (
    pathname === SOCIAL_CLOSED_BETA_OPERATOR_ROUTE ||
    pathname.startsWith(`${SOCIAL_CLOSED_BETA_OPERATOR_ROUTE}/`)
  );
}

export function buildSocialClosedBetaOperatorListHref(input?: {
  q?: string;
  status?: string;
}): string {
  const params = new URLSearchParams();
  if (input?.q?.trim()) {
    params.set("q", input.q.trim());
  }
  if (input?.status?.trim() && input.status !== "all") {
    params.set("status", input.status.trim());
  }
  const qs = params.toString();
  return qs
    ? `${SOCIAL_CLOSED_BETA_OPERATOR_ROUTE}?${qs}`
    : SOCIAL_CLOSED_BETA_OPERATOR_ROUTE;
}

export function buildSocialClosedBetaOperatorDetailHref(
  organizationId: string,
): string {
  return `${SOCIAL_CLOSED_BETA_OPERATOR_ROUTE}/${organizationId}`;
}
