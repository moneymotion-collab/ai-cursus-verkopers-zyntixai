import "server-only";

import {
  canPerformDataIntakeFoundationCommand,
  isKnownDataIntakeRole,
} from "@/features/data-intake/domain/authorization";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { isDataUuid } from "@/features/data-intake/domain/constants";
import type { DataIntakeMembership } from "@/features/data-intake/domain/types";
import {
  asString,
  executeDataIntakeQuery,
  type DataIntakeQueryClient,
} from "@/features/data-intake/server/data-intake-query";

export type DataIntakeAuthLookup = {
  getUser(): Promise<{ id: string } | null>;
};

export async function authorizeDataIntakeCaller(input: {
  auth: DataIntakeAuthLookup;
  queryClient: DataIntakeQueryClient;
  organizationId: string;
}): Promise<DataIntakeResult<DataIntakeMembership>> {
  if (!isDataUuid(input.organizationId)) {
    return dataFail("ORG_NOT_FOUND", "Organization not found or access denied");
  }
  const user = await input.auth.getUser();
  if (!user?.id) {
    return dataFail("UNAUTHORIZED", "Authentication is required");
  }

  const orgRows = await executeDataIntakeQuery(
    input.queryClient.from("organizations").select("id, status").eq("id", input.organizationId),
  );
  if (!orgRows.ok) {
    return orgRows;
  }
  const org = orgRows.value[0];
  if (!org || asString(org.status) !== "active") {
    return dataFail("ORG_NOT_FOUND", "Organization not found or access denied");
  }

  const membershipRows = await executeDataIntakeQuery(
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
    return dataFail("ORG_NOT_FOUND", "Organization not found or access denied");
  }
  const row = membershipRows.value[0];
  const role = asString(row.role);
  const membershipId = asString(row.id);
  if (!role || !isKnownDataIntakeRole(role) || !membershipId) {
    return dataFail("ORG_NOT_FOUND", "Organization not found or access denied");
  }
  if (!canPerformDataIntakeFoundationCommand(role)) {
    return dataFail("FORBIDDEN_ROLE", "Owner or Admin role is required");
  }
  return dataOk({
    organizationId: input.organizationId,
    membershipId,
    userId: user.id,
    role,
  });
}
