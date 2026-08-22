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

function isUsableAbsoluteOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    if (parsed.pathname !== "/" && parsed.pathname !== "") {
      return false;
    }
    if (parsed.search !== "" || parsed.hash !== "") {
      return false;
    }
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Origin for post-auth redirects. Prefer configured NEXT_PUBLIC_SITE_URL so
 * Production aliases such as *.vercel.app cannot steal the flow from the
 * canonical host (invite cookies are host-only).
 */
export function resolveCanonicalRedirectOrigin(
  requestUrl: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const configured = env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured && isUsableAbsoluteOrigin(configured)) {
    return configured;
  }

  try {
    return new URL(requestUrl).origin;
  } catch {
    return resolveSiteOrigin(env);
  }
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
