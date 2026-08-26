import "server-only";

import {
  bqaFail,
  bqaOk,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import type {
  BqaMembership,
  BqaOrganizationRole,
} from "@/features/business-qualification/domain/types";
import { isKnownBqaRole } from "@/features/business-qualification/domain/authorization";
import { isBqaUuid } from "@/features/business-qualification/domain/classification";
import {
  asString,
  executeBqaQuery,
  type BqaQueryClient,
} from "@/features/business-qualification/server/bqa-query";

export type BqaAuthLookup = {
  getUser(): Promise<{ id: string } | null>;
};

export type BqaCaller = BqaMembership;

export async function authorizeBqaCaller(input: {
  auth: BqaAuthLookup;
  queryClient: BqaQueryClient;
  organizationId: string;
}): Promise<BqaResult<BqaCaller>> {
  if (!isBqaUuid(input.organizationId)) {
    return bqaFail("ORG_NOT_FOUND", "Organization not found or access denied");
  }
  const user = await input.auth.getUser();
  if (!user?.id) {
    return bqaFail("UNAUTHORIZED", "Authentication is required");
  }

  const orgRows = await executeBqaQuery(
    input.queryClient.from("organizations").select("id, status").eq("id", input.organizationId),
  );
  if (!orgRows.ok) {
    return orgRows;
  }
  const org = orgRows.value[0];
  if (!org || asString(org.status) !== "active") {
    return bqaFail("ORG_NOT_FOUND", "Organization not found or access denied");
  }

  const membershipRows = await executeBqaQuery(
    input.queryClient
      .from("organization_members")
      .select("id, organization_id, role, status, user_id")
      .eq("organization_id", input.organizationId)
      .eq("user_id", user.id)
      .eq("status", "active"),
  );
  if (!membershipRows.ok) {
    return membershipRows;
  }
  if (membershipRows.value.length !== 1) {
    return bqaFail("ORG_NOT_FOUND", "Organization not found or access denied");
  }
  const row = membershipRows.value[0];
  const role = asString(row.role);
  const membershipId = asString(row.id);
  if (!role || !isKnownBqaRole(role) || !membershipId) {
    return bqaFail("ORG_NOT_FOUND", "Organization not found or access denied");
  }
  return bqaOk({
    organizationId: input.organizationId,
    membershipId,
    userId: user.id,
    role: role as BqaOrganizationRole,
  });
}
