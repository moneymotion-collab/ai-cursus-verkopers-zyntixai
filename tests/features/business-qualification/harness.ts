import { BusinessQualificationRepository } from "@/features/business-qualification/server/business-qualification.repository";
import { BusinessQualificationService } from "@/features/business-qualification/server/business-qualification.service";
import type { BqaActivityLookup } from "@/features/business-qualification/server/activity-lookup";
import type { BqaTaxonomyResolver } from "@/features/business-qualification/server/taxonomy-target";
import type { BqaAuthLookup } from "@/features/business-qualification/server/tenant-authorization";
import type { BqaOrganizationRole } from "@/features/business-qualification/domain/types";
import { createMemoryBqaMutationRpc, type MemoryBqaMutationOptions } from "./memory-mutation";
import {
  createBqaMemoryQueryClient,
  emptyBqaTables,
  type BqaMemoryTables,
} from "./memory-query-client";

export const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const ACTIVITY_A = "ccccccca-cccc-4ccc-8ccc-cccccccccccc";
export const ACTIVITY_B = "cccccccb-cccc-4ccc-8ccc-cccccccccccc";
export const OWNER_USER = "11111111-1111-4111-8111-111111111111";
export const ADMIN_USER = "22222222-2222-4222-8222-222222222222";
export const STAFF_USER = "33333333-3333-4333-8333-333333333333";
export const VIEWER_USER = "44444444-4444-4444-8444-444444444444";
export const FOREIGN_USER = "55555555-5555-4555-8555-555555555555";
export const TAX_NICHE_ID = "9831efc8-b7ce-4726-be96-f5a061f21951";
export const TAX_OTHER_ID = "a831efc8-b7ce-4726-be96-f5a061f21952";
export const TAX_DRAFT_ID = "d831efc8-b7ce-4726-be96-f5a061f21953";
export const TAX_RELEASE_ID = "accda96d-dfc7-4666-8b28-4da515e3bbdd";

export function authLookup(userId: string | null): BqaAuthLookup {
  return {
    async getUser() {
      return userId ? { id: userId } : null;
    },
  };
}

export function seedOrg(tables: BqaMemoryTables, orgId = ORG_A, status = "active") {
  if (tables.organizations.some((row) => row.id === orgId)) {
    return;
  }
  tables.organizations.push({ id: orgId, status });
}

export function seedMember(
  tables: BqaMemoryTables,
  input: {
    userId: string;
    role: BqaOrganizationRole;
    organizationId?: string;
    status?: string;
  },
) {
  const organizationId = input.organizationId ?? ORG_A;
  if (
    tables.organization_members.some(
      (row) => row.organization_id === organizationId && row.user_id === input.userId,
    )
  ) {
    return;
  }
  tables.organization_members.push({
    id: crypto.randomUUID(),
    organization_id: organizationId,
    user_id: input.userId,
    role: input.role,
    status: input.status ?? "active",
  });
}

export function activityLookup(status: "draft" | "active" | "archived" = "active"): BqaActivityLookup {
  return {
    async getActivity(organizationId, businessActivityId) {
      if (organizationId !== ORG_A || businessActivityId !== ACTIVITY_A) {
        return {
          ok: false,
          error: {
            code: "ACTIVITY_NOT_FOUND",
            message: "Business Activity not found or access denied",
          },
        };
      }
      return {
        ok: true,
        value: {
          activityId: ACTIVITY_A,
          organizationId: ORG_A,
          status,
        },
      };
    },
  };
}

export function taxonomyResolver(): BqaTaxonomyResolver {
  const nodes = [
    {
      id: TAX_NICHE_ID,
      kind: "niche" as const,
      key: "online-course-business",
      lifecycleStatus: "active",
    },
    {
      id: TAX_OTHER_ID,
      kind: "niche" as const,
      key: "other-niche",
      lifecycleStatus: "active",
    },
    {
      id: TAX_DRAFT_ID,
      kind: "niche" as const,
      key: "draft-niche",
      lifecycleStatus: "draft",
    },
  ];
  return {
    async resolveActiveRelease() {
      return { ok: true, value: { releaseId: TAX_RELEASE_ID } };
    },
    async resolveActiveTarget(input) {
      const node = nodes.find((entry) => entry.id === input.taxonomyTargetId);
      if (!node) {
        return {
          ok: false,
          error: { code: "CLASSIFICATION_TARGET_NOT_FOUND", message: "TAX target was not found" },
        };
      }
      if (node.lifecycleStatus !== "active") {
        return {
          ok: false,
          error: { code: "CLASSIFICATION_TARGET_INVALID", message: "TAX target is not an active catalog node" },
        };
      }
      return {
        ok: true,
        value: {
          kind: node.kind,
          id: node.id,
          key: node.key,
          releaseId: TAX_RELEASE_ID,
        },
      };
    },
  };
}

export function createService(input: {
  userId: string | null;
  tables?: BqaMemoryTables;
  activityStatus?: "draft" | "active" | "archived";
  mutationOptions?: MemoryBqaMutationOptions;
}) {
  const tables = input.tables ?? emptyBqaTables();
  seedOrg(tables);
  seedMember(tables, { userId: OWNER_USER, role: "owner" });
  seedMember(tables, { userId: ADMIN_USER, role: "admin" });
  seedMember(tables, { userId: STAFF_USER, role: "staff" });
  seedMember(tables, { userId: VIEWER_USER, role: "viewer" });
  const queryClient = createBqaMemoryQueryClient(tables);
  const mutate = createMemoryBqaMutationRpc(tables, input.mutationOptions);
  const service = new BusinessQualificationService({
    auth: authLookup(input.userId),
    queryClient,
    activities: activityLookup(input.activityStatus),
    repository: new BusinessQualificationRepository(queryClient),
    taxonomy: taxonomyResolver(),
    mutate,
  });
  return { service, tables, mutate };
}

export async function saveRequiredAnswers(
  service: BusinessQualificationService,
  lineStructure: "one_line" | "several_lines" = "one_line",
) {
  await service.saveQualificationAnswer({
    organizationId: ORG_A,
    businessActivityId: ACTIVITY_A,
    questionKey: "activity_description",
    valueText: "Online course business for course sellers",
  });
  await service.saveQualificationAnswer({
    organizationId: ORG_A,
    businessActivityId: ACTIVITY_A,
    questionKey: "primary_value_delivered",
    valueCode: "structured_programs",
  });
  return service.saveQualificationAnswer({
    organizationId: ORG_A,
    businessActivityId: ACTIVITY_A,
    questionKey: "line_structure",
    valueCode: lineStructure,
  });
}
