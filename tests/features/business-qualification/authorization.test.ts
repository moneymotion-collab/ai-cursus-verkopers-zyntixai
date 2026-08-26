import { describe, expect, it, vi } from "vitest";
import type { BqaMutationRpcClient } from "@/features/business-qualification/server/bqa-rpc";
import { BQA_MUTATION_RPC } from "@/features/business-qualification/server/bqa-rpc";
import { BusinessQualificationService } from "@/features/business-qualification/server/business-qualification.service";
import { BusinessQualificationRepository } from "@/features/business-qualification/server/business-qualification.repository";
import {
  ACTIVITY_A,
  ADMIN_USER,
  FOREIGN_USER,
  ORG_A,
  ORG_B,
  OWNER_USER,
  STAFF_USER,
  VIEWER_USER,
  activityLookup,
  assignmentObserver,
  authLookup,
  contextCatalog,
  createService,
  seedMember,
  seedOrg,
  taxonomyResolver,
} from "./harness";
import { createBqaMemoryQueryClient, emptyBqaTables } from "./memory-query-client";

function deniedMutate(): BqaMutationRpcClient {
  return {
    rpc: vi.fn(async () => {
      throw new Error("privileged mutation must not run");
    }),
  };
}

describe("BQA-1D authorization", () => {
  it("denies unauthenticated callers before privileged mutation", async () => {
    const tables = emptyBqaTables();
    seedOrg(tables);
    const mutate = deniedMutate();
    const service = new BusinessQualificationService({
      auth: authLookup(null),
      queryClient: createBqaMemoryQueryClient(tables),
      activities: activityLookup(),
      repository: new BusinessQualificationRepository(createBqaMemoryQueryClient(tables)),
      taxonomy: taxonomyResolver(),
      catalog: contextCatalog(),
      pins: assignmentObserver(),
      mutate,
    });
    const result = await service.ensureBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(mutate.rpc).not.toHaveBeenCalled();
  });

  it("denies foreign org without leaking existence", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    seedOrg(tables, ORG_B);
    const result = await service.ensureBusinessActivityQualification({
      organizationId: ORG_B,
      businessActivityId: ACTIVITY_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ORG_NOT_FOUND");
    }
  });

  it("denies suspended membership as org not found", async () => {
    const tables = emptyBqaTables();
    seedOrg(tables);
    seedMember(tables, { userId: OWNER_USER, role: "owner", status: "suspended" });
    const mutate = deniedMutate();
    const service = new BusinessQualificationService({
      auth: authLookup(OWNER_USER),
      queryClient: createBqaMemoryQueryClient(tables),
      activities: activityLookup(),
      repository: new BusinessQualificationRepository(createBqaMemoryQueryClient(tables)),
      taxonomy: taxonomyResolver(),
      catalog: contextCatalog(),
      pins: assignmentObserver(),
      mutate,
    });
    const result = await service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "activity_description",
      valueText: "text",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ORG_NOT_FOUND");
    }
    expect(mutate.rpc).not.toHaveBeenCalled();
  });

  it("allows Owner and Admin to confirm and denies Staff and Viewer", async () => {
    for (const [userId, allowed] of [
      [OWNER_USER, true],
      [ADMIN_USER, true],
      [STAFF_USER, false],
      [VIEWER_USER, false],
    ] as const) {
      const { service } = createService({ userId });
      const result = await service.confirmClassification({
        organizationId: ORG_A,
        businessActivityId: ACTIVITY_A,
        taxonomyTargetId: "9831efc8-b7ce-4726-be96-f5a061f21951",
      });
      if (allowed) {
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).not.toBe("FORBIDDEN_ROLE");
          expect(result.error.code).not.toBe("UNAUTHORIZED");
        }
      } else {
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe("FORBIDDEN_ROLE");
        }
      }
    }
  });

  it("allows Staff to save answers and denies Viewer writes", async () => {
    const staff = createService({ userId: STAFF_USER });
    const saved = await staff.service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "activity_description",
      valueText: "Staff contributed description",
    });
    expect(saved.ok).toBe(true);

    const viewer = createService({ userId: VIEWER_USER });
    const denied = await viewer.service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "activity_description",
      valueText: "Viewer must not write",
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.error.code).toBe("FORBIDDEN_ROLE");
    }
  });

  it("does not treat a foreign user id as an org member", async () => {
    const { service } = createService({ userId: FOREIGN_USER });
    const result = await service.getBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ORG_NOT_FOUND");
    }
  });

  it("denies unauthenticated support evaluation before privileged mutation", async () => {
    const tables = emptyBqaTables();
    seedOrg(tables);
    const mutate = deniedMutate();
    const service = new BusinessQualificationService({
      auth: authLookup(null),
      queryClient: createBqaMemoryQueryClient(tables),
      activities: activityLookup(),
      repository: new BusinessQualificationRepository(createBqaMemoryQueryClient(tables)),
      taxonomy: taxonomyResolver(),
      catalog: contextCatalog(),
      pins: assignmentObserver(),
      mutate,
    });
    const result = await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNAUTHORIZED");
    }
    expect(mutate.rpc).not.toHaveBeenCalled();
  });

  it("uses the named mutation RPC constant", () => {
    expect(BQA_MUTATION_RPC).toBe("apply_business_qualification_mutation");
  });
});
