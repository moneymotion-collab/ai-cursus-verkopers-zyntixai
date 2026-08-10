import { isAttentionPathname } from "@/features/attention/domain/attention-navigation";

const DEFAULT_RETURN_PATH = "/";

function isAllowlistedPathname(pathname: string): boolean {
  if (pathname === "/") {
    return true;
  }

  if (pathname === "/leads" || pathname.startsWith("/leads/")) {
    return true;
  }

  if (pathname === "/customers" || pathname.startsWith("/customers/")) {
    return true;
  }

  if (pathname === "/tasks" || pathname.startsWith("/tasks/")) {
    return true;
  }

  if (pathname === "/programs" || pathname.startsWith("/programs/")) {
    return true;
  }

  if (pathname === "/enrollments" || pathname.startsWith("/enrollments/")) {
    return true;
  }

  if (pathname === "/progress" || pathname.startsWith("/progress/")) {
    return true;
  }

  if (isAttentionPathname(pathname)) {
    return true;
  }

  if (
    pathname === "/register" ||
    pathname === "/register/check-email" ||
    pathname === "/register/complete"
  ) {
    return true;
  }

  if (pathname === "/forgot-password" || pathname === "/reset-password") {
    return true;
  }

  if (pathname === "/onboarding") {
    return true;
  }

  // Invitation continuation confirm surface only (not /invite/* wildcard).
  if (pathname === "/invite/accept") {
    return true;
  }

  return false;
}

function containsControlCharacters(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

function pathnameHasRedirectTrick(pathname: string): boolean {
  if (pathname.includes("\\")) {
    return true;
  }

  if (pathname.includes("//")) {
    return true;
  }

  if (containsControlCharacters(pathname)) {
    return true;
  }

  try {
    const decoded = decodeURIComponent(pathname);
    if (containsControlCharacters(decoded)) {
      return true;
    }
    if (decoded !== pathname && pathnameHasRedirectTrick(decoded)) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

/**
 * Accept only internal, allowlisted application paths.
 * Rejects open redirects, schemes, protocol-relative URLs, and bypass tricks.
 */
export function resolveSafeReturnPath(
  raw: unknown,
  fallback: string = DEFAULT_RETURN_PATH,
): string {
  if (typeof raw !== "string") {
    return fallback;
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return fallback;
  }

  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return fallback;
  }

  if (trimmed.startsWith("//") || !trimmed.startsWith("/")) {
    return fallback;
  }

  if (trimmed.includes("\\")) {
    return fallback;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed, "http://zyntix.local");
  } catch {
    return fallback;
  }

  if (parsed.username || parsed.password || parsed.host !== "zyntix.local") {
    return fallback;
  }

  if (pathnameHasRedirectTrick(parsed.pathname)) {
    return fallback;
  }

  if (!isAllowlistedPathname(parsed.pathname)) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}`;
}

export function isProtectedApplicationPath(pathname: string): boolean {
  return (
    pathname === "/leads" ||
    pathname.startsWith("/leads/") ||
    pathname === "/customers" ||
    pathname.startsWith("/customers/") ||
    pathname === "/tasks" ||
    pathname.startsWith("/tasks/") ||
    pathname === "/programs" ||
    pathname.startsWith("/programs/") ||
    pathname === "/enrollments" ||
    pathname.startsWith("/enrollments/") ||
    pathname === "/progress" ||
    pathname.startsWith("/progress/") ||
    isAttentionPathname(pathname) ||
    pathname === "/onboarding"
  );
}

export function isRegistrationPath(pathname: string): boolean {
  return (
    pathname === "/register" ||
    pathname === "/register/check-email" ||
    pathname === "/register/complete"
  );
}

export function isPasswordRecoveryPath(pathname: string): boolean {
  return pathname === "/forgot-password" || pathname === "/reset-password";
}

export function isPasswordResetDestination(path: string): boolean {
  const pathname = path.split("?")[0] ?? path;
  return pathname === "/reset-password";
}

export function isAuthCallbackPath(pathname: string): boolean {
  return pathname === "/auth/callback";
}

export { DEFAULT_RETURN_PATH };
