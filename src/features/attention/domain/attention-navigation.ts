/**
 * Canonical Attention route and navigation metadata.
 * B1.7.4-D wires protected-path / safe-return / AppShell with nav hidden.
 * B1.7.5 enables visible shell activation for list/detail routes.
 */

export const ATTENTION_ROUTE = "/attention" as const;
export const ATTENTION_NAV_LABEL = "Attention" as const;

/** Primary-nav order after Progress and before Tasks (B1 sequence). */
export const ATTENTION_NAV_ORDER_AFTER = "progress" as const;

export const ATTENTION_ROUTE_PATTERNS = [
  "/attention",
  "/attention/[attentionItemId]",
] as const;

export function isAttentionPathname(pathname: string): boolean {
  return pathname === "/attention" || pathname.startsWith("/attention/");
}

export type AttentionListHrefParams = {
  organizationId?: string;
  enrollmentId?: string;
  customerId?: string;
  programId?: string;
  status?: string;
  severity?: string;
};

/**
 * Build Attention list href for later B1.7.5 consumers.
 * A string first arg is treated as organizationId (Progress pattern).
 */
export function buildAttentionListHref(
  organizationIdOrParams?: string | AttentionListHrefParams,
): string {
  const params: AttentionListHrefParams =
    typeof organizationIdOrParams === "string"
      ? { organizationId: organizationIdOrParams }
      : (organizationIdOrParams ?? {});

  const search = new URLSearchParams();
  if (params.organizationId) {
    search.set("org", params.organizationId);
  }
  if (params.enrollmentId) {
    search.set("enrollmentId", params.enrollmentId);
  }
  if (params.customerId) {
    search.set("customerId", params.customerId);
  }
  if (params.programId) {
    search.set("programId", params.programId);
  }
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.severity) {
    search.set("severity", params.severity);
  }
  const query = search.toString();
  return query.length > 0 ? `${ATTENTION_ROUTE}?${query}` : ATTENTION_ROUTE;
}

export function buildAttentionDetailHref(
  attentionItemId: string,
  organizationId?: string,
): string {
  const base = `${ATTENTION_ROUTE}/${encodeURIComponent(attentionItemId)}`;
  if (!organizationId) {
    return base;
  }
  return `${base}?org=${encodeURIComponent(organizationId)}`;
}

/**
 * Primary-nav Attention link — visibility is context-driven via product-access (AppShell moduleNavVisibility).
 * Kept for backward-compatible imports; always false at compile time.
 */
export const ATTENTION_NAV_VISIBLE = false as const;
