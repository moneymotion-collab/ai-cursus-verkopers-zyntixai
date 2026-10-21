/**
 * Cross-tenant invariant:
 * A workspace ID or connection ID never grants Organization authority.
 *
 * Future mutations must:
 * 1. derive the authenticated actor from session;
 * 2. derive active Organization membership;
 * 3. re-read the target workspace/connection;
 * 4. prove the target belongs to that Organization.
 *
 * Browser-supplied `organizationId` is never authority.
 */
export type SocialTenantAuthorityProof = {
  actorUserId: string;
  organizationId: string;
  membershipIsActive: boolean;
  targetOrganizationId: string;
};

export function provesSocialTenantAuthority(
  proof: SocialTenantAuthorityProof,
): boolean {
  if (!proof.membershipIsActive) {
    return false;
  }
  if (proof.actorUserId.trim().length === 0) {
    return false;
  }
  if (proof.organizationId.trim().length === 0) {
    return false;
  }
  return proof.organizationId === proof.targetOrganizationId;
}
