import type { OrganizationRole } from "@/features/tasks/domain/permissions";

export type ActiveMembership = {
  organizationId: string;
  role: OrganizationRole;
};

export type OrganizationOption = {
  organizationId: string;
  role: OrganizationRole;
  displayName: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidOrganizationId(value: string | undefined): value is string {
  return Boolean(value && UUID_PATTERN.test(value));
}

export type OrganizationSelectionResult = {
  organizationId: string | null;
  requiresSelection: boolean;
  invalidSelection: boolean;
};

export function resolveSelectedOrganization(
  memberships: ActiveMembership[],
  requestedOrganizationId: string | undefined,
): OrganizationSelectionResult {
  if (memberships.length === 0) {
    return { organizationId: null, requiresSelection: false, invalidSelection: false };
  }

  if (memberships.length === 1) {
    return {
      organizationId: memberships[0].organizationId,
      requiresSelection: false,
      invalidSelection: Boolean(
        requestedOrganizationId &&
          requestedOrganizationId !== memberships[0].organizationId,
      ),
    };
  }

  if (requestedOrganizationId && isValidOrganizationId(requestedOrganizationId)) {
    const match = memberships.find((m) => m.organizationId === requestedOrganizationId);
    if (match) {
      return { organizationId: match.organizationId, requiresSelection: false, invalidSelection: false };
    }
    return { organizationId: null, requiresSelection: true, invalidSelection: true };
  }

  return { organizationId: null, requiresSelection: true, invalidSelection: false };
}

export function buildOrganizationOptions(
  memberships: ActiveMembership[],
  namesById: Record<string, string | undefined>,
): OrganizationOption[] {
  return memberships.map((membership, index) => {
    const name = namesById[membership.organizationId]?.trim();
    return {
      organizationId: membership.organizationId,
      role: membership.role,
      displayName: name && name.length > 0 ? name : `Organization ${index + 1}`,
    };
  });
}
