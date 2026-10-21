import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  archiveProjectAction,
  createProjectAction,
  restoreProjectAction,
  transitionProjectStatusAction,
  updateProjectAction,
} from "@/features/projects/actions/project-actions";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const CUSTOMER_ID = "33333333-3333-4333-8333-333333333333";
const MEMBER_ID = "44444444-4444-4444-8444-444444444444";
const rpc = vi.fn();
const client = { rpc } as unknown as SupabaseClient<Database>;

const moduleAccess = {
  resolution: "resolved" as const,
  navVisibility: {
    home: true,
    leads: true,
    customers: true,
    projects: true,
    sites: false,
    workOrders: false,
    dispatch: false,
    products: false,
    orders: false,
    inventory: false,
    fulfillment: false,
    programs: false,
    enrollments: false,
    progress: false,
    attention: true,
    tasks: true,
    members: true,
  },
  relevantCapabilities: [],
  terminology: {
    customer: { singular: "Client", plural: "Clients" },
    project: { singular: "Project", plural: "Projects" },
    site: { singular: "Site", plural: "Sites" },
    workOrder: { singular: "Work order", plural: "Work orders" },
    technician: { singular: "Technician", plural: "Technicians" },
    product: { singular: "Product", plural: "Products" },
    order: { singular: "Order", plural: "Orders" },
    inventory: { singular: "Inventory", plural: "Inventory" },
    fulfillment: { singular: "Fulfillment", plural: "Fulfillment" },
  },
};

const createInput = {
  organizationId: ORG_ID,
  customerId: CUSTOMER_ID,
  name: "  Site rollout  ",
  summary: "",
  ownerMemberId: "",
  plannedStart: "2026-09-05",
  plannedEnd: "2026-09-06",
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));
vi.mock("@/features/product-access/server/load-product-module-access", () => ({
  loadProductModuleAccess: vi.fn(),
}));
vi.mock("@/features/product-access/server/enforce-product-module-access", () => ({
  evaluateProductModuleRouteAccess: vi.fn(),
}));

const serverClientMock = vi.mocked(createSupabaseServerClient);
const organizationMock = vi.mocked(resolveOrganizationContext);
const loadAccessMock = vi.mocked(loadProductModuleAccess);
const evaluateAccessMock = vi.mocked(evaluateProductModuleRouteAccess);
const revalidateMock = vi.mocked(revalidatePath);

function allowRole(role: "owner" | "admin" | "staff" | "viewer") {
  organizationMock.mockResolvedValue({
    ok: true,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBER_ID,
      role,
      userId: "55555555-5555-4555-8555-555555555555",
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  serverClientMock.mockResolvedValue(client);
  allowRole("staff");
  loadAccessMock.mockResolvedValue(moduleAccess);
  evaluateAccessMock.mockReturnValue({ allowed: true });
  rpc.mockResolvedValue({ data: PROJECT_ID, error: null });
});

describe("Project server actions", () => {
  it("validates before creating a client or resolving authorization", async () => {
    const result = await createProjectAction({
      ...createInput,
      name: " ",
      status: "active",
    });

    expect(result.ok).toBe(false);
    expect(serverClientMock).not.toHaveBeenCalled();
    expect(organizationMock).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("authorizes the organization and module before mapping create RPC arguments", async () => {
    const result = await createProjectAction(createInput);

    expect(result).toEqual({ ok: true, projectId: PROJECT_ID });
    expect(organizationMock).toHaveBeenCalledWith({
      supabase: client,
      organizationId: ORG_ID,
    });
    expect(loadAccessMock).toHaveBeenCalledWith(ORG_ID);
    expect(evaluateAccessMock).toHaveBeenCalledWith({
      moduleId: "projects",
      access: moduleAccess,
    });
    expect(rpc).toHaveBeenCalledWith("create_project", {
      p_organization_id: ORG_ID,
      p_customer_id: CUSTOMER_ID,
      p_name: "Site rollout",
      p_summary: undefined,
      p_owner_member_id: undefined,
      p_planned_start: "2026-09-05",
      p_planned_end: "2026-09-06",
    });
    expect(revalidateMock).toHaveBeenCalledWith("/projects");
    expect(revalidateMock).toHaveBeenCalledWith(`/projects/${PROJECT_ID}`);
  });

  it("stops before RPC when organization, module, or role authorization fails", async () => {
    organizationMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization unavailable.",
        retryable: false,
        category: "not_found",
      },
    });
    expect((await createProjectAction(createInput)).ok).toBe(false);

    evaluateAccessMock.mockReturnValueOnce({
      allowed: false,
      message: "Projects are not available.",
    });
    expect((await createProjectAction(createInput)).ok).toBe(false);

    allowRole("viewer");
    expect((await createProjectAction(createInput)).ok).toBe(false);

    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps update and transition inputs to their exact RPC contracts", async () => {
    rpc.mockResolvedValue({ data: null, error: null });

    await updateProjectAction({ ...createInput, projectId: PROJECT_ID });
    await transitionProjectStatusAction({
      organizationId: ORG_ID,
      projectId: PROJECT_ID,
      toStatus: "on_hold",
      reason: "  Awaiting permit  ",
    });

    expect(rpc).toHaveBeenNthCalledWith(1, "update_project", {
      p_organization_id: ORG_ID,
      p_project_id: PROJECT_ID,
      p_customer_id: CUSTOMER_ID,
      p_name: "Site rollout",
      p_summary: undefined,
      p_owner_member_id: undefined,
      p_planned_start: "2026-09-05",
      p_planned_end: "2026-09-06",
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "transition_project_status", {
      p_organization_id: ORG_ID,
      p_project_id: PROJECT_ID,
      p_to_status: "on_hold",
      p_reason: "Awaiting permit",
    });
  });

  it("reserves archive and restore for owners/admins and maps both RPC names", async () => {
    const input = { organizationId: ORG_ID, projectId: PROJECT_ID };
    expect((await archiveProjectAction(input)).ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();

    allowRole("admin");
    rpc.mockResolvedValue({ data: null, error: null });
    expect((await archiveProjectAction(input)).ok).toBe(true);
    expect((await restoreProjectAction(input)).ok).toBe(true);
    expect(rpc).toHaveBeenNthCalledWith(1, "archive_project", {
      p_organization_id: ORG_ID,
      p_project_id: PROJECT_ID,
    });
    expect(rpc).toHaveBeenNthCalledWith(2, "restore_project", {
      p_organization_id: ORG_ID,
      p_project_id: PROJECT_ID,
    });
  });

  it("maps expected RPC failures without exposing database messages", async () => {
    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "planned end must not be before planned start" },
    });
    expect(await createProjectAction(createInput)).toEqual({
      ok: false,
      message: "Check the highlighted fields.",
      fieldErrors: {
        plannedEnd: "Planned end must be on or after planned start.",
      },
    });

    rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "project status transition not allowed" },
    });
    expect(
      await transitionProjectStatusAction({
        organizationId: ORG_ID,
        projectId: PROJECT_ID,
        toStatus: "completed",
      }),
    ).toEqual({ ok: false, message: "That status change is not allowed." });
  });
});
