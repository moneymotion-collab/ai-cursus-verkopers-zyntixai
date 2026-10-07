/**
 * Unauthenticated Dutch public pages.
 * Authenticated product routes stay English.
 */
export const DUTCH_PUBLIC_PATHNAMES = [
  "/",
  "/platform",
  "/voor-wie",
  "/zo-werkt-het",
  "/over",
  "/privacy",
] as const;

export type DutchPublicPathname = (typeof DUTCH_PUBLIC_PATHNAMES)[number];
