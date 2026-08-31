import { DataIntakeService } from "@/features/data-intake/server/data-intake.service";
import type { DataIntakeAuthLookup } from "@/features/data-intake/server/tenant-authorization";
import type { DataIntakeOrganizationRole } from "@/features/data-intake/domain/authorization";
import {
  ADMIN_MEMBER,
  ADMIN_USER,
  emptyDataIntakeTables,
  FOREIGN_MEMBER,
  FOREIGN_USER,
  ORG_A,
  ORG_B,
  OWNER_MEMBER,
  OWNER_USER,
  STAFF_MEMBER,
  STAFF_USER,
  VIEWER_MEMBER,
  VIEWER_USER,
  createDataIntakeMemoryQueryClient,
  seedMember,
  seedOrg,
  type DataIntakeMemoryTables,
} from "./memory-query-client";
import {
  createMemoryDataIntakeFoundationRpc,
  createMemoryDataIntakeMappingRpc,
  createMemoryDataIntakeMatchingRpc,
  createMemoryDataIntakePlanningRpc,
  createMemoryDataIntakeExecutionRpc,
  createMemoryDataIntakeSourceObjectRpc,
  createMemoryDataIntakeSourceStructureRpc,
  createMemoryDataIntakeStagingRpc,
  createStoreCustomerIdentityLookup,
  createStoreDataIntakeRecordLookup,
  emptyDataIntakeStore,
  type DataIntakeMemoryStore,
} from "./memory-rpc";
import { createMemoryDataIntakeObjectStore } from "./memory-object-store";

export {
  ACTIVITY_A,
  ADMIN_USER,
  FOREIGN_USER,
  ORG_A,
  ORG_B,
  OWNER_USER,
  STAFF_USER,
  VIEWER_USER,
} from "./memory-query-client";

export const VALID_SHA256 = "a".repeat(64);

export function authLookup(userId: string | null): DataIntakeAuthLookup {
  return {
    async getUser() {
      return userId ? { id: userId } : null;
    },
  };
}

function memberIdFor(userId: string): string {
  switch (userId) {
    case OWNER_USER:
      return OWNER_MEMBER;
    case ADMIN_USER:
      return ADMIN_MEMBER;
    case STAFF_USER:
      return STAFF_MEMBER;
    case VIEWER_USER:
      return VIEWER_MEMBER;
    case FOREIGN_USER:
      return FOREIGN_MEMBER;
    default:
      return OWNER_MEMBER;
  }
}

function roleFor(userId: string): DataIntakeOrganizationRole {
  switch (userId) {
    case ADMIN_USER:
      return "admin";
    case STAFF_USER:
      return "staff";
    case VIEWER_USER:
      return "viewer";
    default:
      return "owner";
  }
}

export function createService(input: {
  userId: string | null;
  tables?: DataIntakeMemoryTables;
  store?: DataIntakeMemoryStore;
  seedDefaultOrg?: boolean;
  isServiceRole?: boolean;
} = { userId: OWNER_USER }) {
  const tables = input.tables ?? emptyDataIntakeTables();
  const store = input.store ?? emptyDataIntakeStore();
  const objectStore = createMemoryDataIntakeObjectStore();
  if (input.seedDefaultOrg !== false) {
    seedOrg(tables, ORG_A);
    seedOrg(tables, ORG_B);
    if (input.userId && input.userId !== FOREIGN_USER) {
      seedMember(tables, {
        userId: input.userId,
        role: roleFor(input.userId),
        membershipId: memberIdFor(input.userId),
      });
    }
    if (input.userId === FOREIGN_USER) {
      seedMember(tables, {
        userId: FOREIGN_USER,
        role: "owner",
        membershipId: FOREIGN_MEMBER,
        organizationId: ORG_B,
      });
    }
  }
  const service = new DataIntakeService({
    auth: authLookup(input.userId),
    queryClient: createDataIntakeMemoryQueryClient(tables),
    mutate: createMemoryDataIntakeFoundationRpc({
      tables,
      store,
      isServiceRole: input.isServiceRole,
    }),
    lookup: createStoreDataIntakeRecordLookup(store),
    objectStore,
    objectMutate: createMemoryDataIntakeSourceObjectRpc({
      tables,
      store,
      isServiceRole: input.isServiceRole,
    }),
    structureMutate: createMemoryDataIntakeSourceStructureRpc({
      tables,
      store,
      isServiceRole: input.isServiceRole,
    }),
    mappingMutate: createMemoryDataIntakeMappingRpc({
      tables,
      store,
      isServiceRole: input.isServiceRole,
    }),
    stagingMutate: createMemoryDataIntakeStagingRpc({
      tables,
      store,
      isServiceRole: input.isServiceRole,
    }),
    matchingMutate: createMemoryDataIntakeMatchingRpc({
      tables,
      store,
      isServiceRole: input.isServiceRole,
    }),
    planningMutate: createMemoryDataIntakePlanningRpc({
      tables,
      store,
      isServiceRole: input.isServiceRole,
    }),
    executionMutate: createMemoryDataIntakeExecutionRpc({
      tables,
      store,
      isServiceRole: input.isServiceRole,
    }),
    customers: createStoreCustomerIdentityLookup(store),
  });
  return { service, tables, store, objectStore };
}
