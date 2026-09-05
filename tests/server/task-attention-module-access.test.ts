import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import {
  buildUnresolvedProductModuleAccess,
  FAIL_CLOSED_MODULE_NAV_VISIBILITY,
} from "@/features/product-access/domain/module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import { evaluateTaskModuleAccess } from "@/features/tasks/server/enforce-task-module-access";
import { evaluateAttentionModuleAccess } from "@/features/attention/server/enforce-attention-module-access";

vi.mock("@/features/product-access/server/load-product-module-access", () => ({
  loadProductModuleAccess: vi.fn(),
}));

const loadAccessMock = vi.mocked(loadProductModuleAccess);

function resolvedCoreAccess(
  visibleModules: Partial<ProductModuleAccessState["navVisibility"]>,
): ProductModuleAccessState {
  return {
    resolution: "resolved",
    navVisibility: {
      ...FAIL_CLOSED_MODULE_NAV_VISIBILITY,
      home: true,
      tasks: true,
      attention: true,
      members: true,
      ...visibleModules,
    },
    relevantCapabilities: [],
    terminology: DEFAULT_PRODUCT_TERMINOLOGY,
  };
}

describe("Tasks and Attention module boundary access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["TG1", { leads: true, customers: true, programs: true, enrollments: true, progress: true }],
    ["TG2", { leads: true, customers: true, projects: true }],
    ["TG3", { leads: true, customers: true, projects: true, sites: true, workOrders: true, dispatch: true }],
    ["TG4", { customers: true, products: true, orders: true, inventory: true, fulfillment: true }],
  ] as const)(
    "keeps Tasks and Attention actions available for resolved %s context",
    async (_targetGroup, visibleModules) => {
      loadAccessMock.mockResolvedValue(resolvedCoreAccess(visibleModules));

      await expect(evaluateTaskModuleAccess("org-id")).resolves.toEqual({ allowed: true });
      await expect(evaluateAttentionModuleAccess("org-id")).resolves.toEqual({ allowed: true });
    },
  );

  it("denies both module boundaries when product context is unresolved", async () => {
    loadAccessMock.mockResolvedValue(buildUnresolvedProductModuleAccess());

    const task = await evaluateTaskModuleAccess("org-id");
    const attention = await evaluateAttentionModuleAccess("org-id");

    expect(task).toMatchObject({
      allowed: false,
      failure: { error: { code: "PERMISSION_DENIED" } },
    });
    expect(attention).toMatchObject({
      allowed: false,
      error: { code: "PERMISSION_DENIED" },
    });
  });
});
