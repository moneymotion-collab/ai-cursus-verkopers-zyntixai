/**
 * Deterministic public site origin for Auth email redirects.
 * Prefer an explicit site URL so browser/server and preview/production
 * cannot silently diverge onto an unallowlisted host.
 */
export function resolveSiteOrigin(
  env: Record<string, string | undefined> = process.env,
): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }

  const vercel = env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/\/$/, "");
    if (host.startsWith("http://") || host.startsWith("https://")) {
      return host.replace(/\/$/, "");
    }
    return `https://${host}`;
  }

  return "http://127.0.0.1:3000";
}

/**
 * Build an Auth callback URL with an optional allowlisted `next` destination.
 * Does not validate `next` — callers must sanitize first.
 */
export function buildAuthCallbackUrl(origin: string, nextPath?: string): string {
  const base = `${origin.replace(/\/$/, "")}/auth/callback`;
  if (!nextPath) {
    return base;
  }
  const params = new URLSearchParams({ next: nextPath });
  return `${base}?${params.toString()}`;
}
