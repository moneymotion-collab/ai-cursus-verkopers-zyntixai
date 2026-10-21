import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/product-access/server/load-product-module-access", async () => {
  return await vi.importActual<
    typeof import("@/features/product-access/server/load-product-module-access")
  >("@/features/product-access/server/load-product-module-access");
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

vi.mock("@/features/org-context/server/organization-context.repository", () => ({
  OrganizationContextRepository: vi.fn(),
}));

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { OrganizationContextRepository } from "@/features/org-context/server/organization-context.repository";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import { FAIL_CLOSED_MODULE_NAV_VISIBILITY } from "@/features/product-access/domain/module-access";
import { KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY } from "../features/product-access/module-access-fixtures";

const createServerClientMock = vi.mocked(createSupabaseServerClient);
const resolveMembershipMock = vi.mocked(resolveOrganizationContext);
const repositoryMock = vi.mocked(OrganizationContextRepository);

const ORG = "11111111-1111-4111-8111-111111111111";
const FOREIGN = "22222222-2222-4222-8222-222222222222";
const SESSION = { kind: "authenticated-session" };

function membership(organizationId = ORG) {
  return {
    ok: true as const,
    context: {
      organizationId,
      membershipId: "mem-1",
      role: "owner" as const,
      userId: "user-1",
    },
  };
}

function activity(organizationId: string, displayName: string, kind: string) {
  return {
    ok: true as const,
    value: {
      activityId: "act-1",
      organizationId,
      activityKey: "primary_operating_model",
      displayName,
      status: "active" as const,
      isPrimary: true,
      classification: { kind, targetId: "tax-1" },
      createdAt: "2026-09-12T00:00:00.000Z",
      updatedAt: "2026-09-12T00:00:00.000Z",
    },
  };
}

describe("loadProductModuleAccess authenticated authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue(SESSION as never);
    repositoryMock.mockImplementation(
      () =>
        ({
          getPrimaryBusinessActivity: vi.fn(),
        }) as never,
    );
  });

  it("does not construct a service-role client when rendering module access", async () => {
    const getPrimary = vi.fn(async () =>
      activity(ORG, "Courses & Coaching", "niche"),
    );
    repositoryMock.mockImplementation(
      () => ({ getPrimaryBusinessActivity: getPrimary }) as never,
    );
    resolveMembershipMock.mockResolvedValue(membership());

    const access = await loadProductModuleAccess(ORG, SESSION as never);

    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(resolveMembershipMock).toHaveBeenCalledWith({
      supabase: SESSION,
      organizationId: ORG,
    });
    expect(getPrimary).toHaveBeenCalledWith(ORG);
    expect(access.resolution).toBe("resolved");
    expect(access.navVisibility).toEqual(KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY);
    expect(repositoryMock).toHaveBeenCalledWith(SESSION);
  });

  it("uses the authenticated server constructor when no client is passed", async () => {
    const getPrimary = vi.fn(async () =>
      activity(ORG, "Courses & Coaching", "niche"),
    );
    repositoryMock.mockImplementation(
      () => ({ getPrimaryBusinessActivity: getPrimary }) as never,
    );
    resolveMembershipMock.mockResolvedValue(membership());

    await loadProductModuleAccess(ORG);

    expect(createServerClientMock).toHaveBeenCalledTimes(1);
    expect(resolveMembershipMock).toHaveBeenCalledWith({
      supabase: SESSION,
      organizationId: ORG,
    });
  });

  it("fail-closes suspended or missing membership instead of elevated access", async () => {
    resolveMembershipMock.mockResolvedValue({
      ok: false,
      error: { message: "missing" },
    } as never);

    const access = await loadProductModuleAccess(ORG, SESSION as never);
    expect(access.resolution).toBe("unresolved");
    expect(access.navVisibility).toEqual(FAIL_CLOSED_MODULE_NAV_VISIBILITY);
    expect(repositoryMock).not.toHaveBeenCalled();
  });

  it("does not return foreign organization data", async () => {
    resolveMembershipMock.mockResolvedValue(membership(FOREIGN));
    const access = await loadProductModuleAccess(ORG, SESSION as never);
    expect(access.resolution).toBe("unresolved");
    expect(repositoryMock).not.toHaveBeenCalled();
  });
});
