const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "auth",
  "callback",
  "login",
  "logout",
  "null",
  "register",
  "settings",
  "support",
  "system",
  "undefined",
  "www",
  "zyntix",
]);

const MAX_SLUG_LENGTH = 48;

/**
 * Server-generated organization slug from a company display name.
 * Slug is identity sugar only — organization UUID remains the authz key.
 */
export function buildOrganizationSlugCandidate(companyName: string): string {
  const normalized = companyName.normalize("NFKC").toLowerCase();
  const slug = normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-$/g, "");

  let candidate = slug.length > 0 ? slug : "org";

  if (RESERVED_SLUGS.has(candidate)) {
    candidate = `org-${candidate}`.slice(0, MAX_SLUG_LENGTH);
  }

  return candidate;
}

export function withSlugCollisionSuffix(baseSlug: string, attempt: number): string {
  if (attempt <= 0) {
    return baseSlug.slice(0, MAX_SLUG_LENGTH);
  }

  const suffix = `-${randomSlugSuffix()}`;
  const trimmedBase = baseSlug.slice(0, Math.max(1, MAX_SLUG_LENGTH - suffix.length));
  return `${trimmedBase}${suffix}`;
}

function randomSlugSuffix(): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let index = 0; index < 6; index += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]!;
  }
  return out;
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
