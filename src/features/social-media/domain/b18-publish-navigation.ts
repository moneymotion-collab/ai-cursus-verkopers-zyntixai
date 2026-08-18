/**
 * Closed navigation helpers for the B1.8 Instagram IMAGE publish surface.
 * Presentation only — route authorization remains Owner/Admin + feature gates.
 */

export const B18_INSTAGRAM_PUBLISH_ROUTE =
  "/social/b18-instagram-publish" as const;

export const B18_CONTROLLED_IMAGE_CAPTION =
  "ZYNTIXAI B1.8 controlled publish verification — safe to delete" as const;

export const B18_CONTENT_ITEM_TITLE =
  "B1.8 controlled image publish" as const;

export function isB18InstagramPublishPathname(pathname: string): boolean {
  return (
    pathname === B18_INSTAGRAM_PUBLISH_ROUTE ||
    pathname.startsWith(`${B18_INSTAGRAM_PUBLISH_ROUTE}/`)
  );
}

export function buildB18InstagramPublishHref(input?: {
  organizationId?: string;
  publicationId?: string;
}): string {
  const params = new URLSearchParams();
  if (input?.organizationId) {
    params.set("org", input.organizationId);
  }
  if (input?.publicationId) {
    params.set("publication", input.publicationId);
  }
  const query = params.toString();
  return query
    ? `${B18_INSTAGRAM_PUBLISH_ROUTE}?${query}`
    : B18_INSTAGRAM_PUBLISH_ROUTE;
}
