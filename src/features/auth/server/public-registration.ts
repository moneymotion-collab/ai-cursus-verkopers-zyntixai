/**
 * PX2-DARK.1 — fail-closed public registration activation.
 * Server-only: never expose the raw env value to clients.
 */

export const PUBLIC_REGISTRATION_DISABLED_LOGIN_PATH =
  "/login?registration=disabled" as const;

export const PUBLIC_REGISTRATION_UNAVAILABLE_MESSAGE =
  "Public registration is currently unavailable." as const;

/** Exact entry path for new owner self-registration (not nested recovery routes). */
export function isPublicRegistrationEntryPath(pathname: string): boolean {
  return pathname === "/register";
}

/**
 * Pure fail-closed parser. Only the normalized exact value `true` enables registration.
 * Whitespace around `true` is allowed; `1` / `yes` / `on` / other truthy strings are not.
 */
export function parsePublicRegistrationEnabled(
  value: string | undefined,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

/** Server-side decision from `PUBLIC_REGISTRATION_ENABLED`. Defaults to disabled. */
export function isPublicRegistrationEnabled(): boolean {
  return parsePublicRegistrationEnabled(process.env.PUBLIC_REGISTRATION_ENABLED);
}
