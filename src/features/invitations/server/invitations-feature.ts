/**
 * Server-only Invitations application availability gate (OD-PR-2).
 *
 * Rollout control only — not primary Invitation authorization.
 * Primary security remains: DB RLS/RPC, session, raw token, email binding,
 * role matrix, and same-origin Accept defense.
 *
 * INVITATIONS_ENABLED is a deployment-environment control. Changing production
 * env requires a deployment that uses that state (OD-PR-G4); it is not an
 * instantaneous remote kill switch. Break-glass: Vercel rollback/promote.
 */

/**
 * Fail-closed parser aligned with public-registration semantics.
 * Only normalized exact "true" enables Invitations application surfaces.
 */
export function parseInvitationsFeatureEnabled(
  value: string | undefined,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

/**
 * Whether Invitations application surfaces are available.
 * Missing/empty/malformed → false. No client input. No DB. No cookies.
 */
export function isInvitationsFeatureEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return parseInvitationsFeatureEnabled(env.INVITATIONS_ENABLED);
}

/**
 * PATH B closed-beta: invite admission outranks generic owner workspace
 * creation. When invitations are ON and public registration is not exact
 * "true", a verified user with no membership must resume /invite/accept
 * instead of /register/complete.
 */
export function shouldResumeInvitationAdmissionBeforeOwnerCompletion(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!isInvitationsFeatureEnabled(env)) {
    return false;
  }
  return env.PUBLIC_REGISTRATION_ENABLED?.trim().toLowerCase() !== "true";
}
