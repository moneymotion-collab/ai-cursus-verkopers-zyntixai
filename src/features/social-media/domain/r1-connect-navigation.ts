/**
 * Closed navigation helpers for the R1 Instagram connect surface.
 * Presentation only — route authorization remains Owner/Admin + feature gates.
 */

export const R1_INSTAGRAM_CONNECT_ROUTE =
  "/social/r1-instagram-connect" as const;

export const R1_INSTAGRAM_CONNECT_WORKSPACE_DISPLAY_NAME =
  "ZYNTIXAI SMM R1 TEST WORKSPACE" as const;

export function isR1InstagramConnectPathname(pathname: string): boolean {
  return (
    pathname === R1_INSTAGRAM_CONNECT_ROUTE ||
    pathname.startsWith(`${R1_INSTAGRAM_CONNECT_ROUTE}/`)
  );
}

export function buildR1InstagramConnectHref(organizationId?: string): string {
  if (!organizationId) {
    return R1_INSTAGRAM_CONNECT_ROUTE;
  }
  return `${R1_INSTAGRAM_CONNECT_ROUTE}?org=${encodeURIComponent(organizationId)}`;
}
