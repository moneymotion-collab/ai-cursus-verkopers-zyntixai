import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSiteAction,
  createWorkOrderAction,
  evaluateWorkOrderAttentionRulesAction,
  transitionWorkOrderStatusAction,
} from "@/features/field-operations/actions/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import {
  FIELD_MODULE_NAV_VISIBILITY,
  FIELD_PRODUCT_TERMINOLOGY,
} from "../features/product-access/module-access-fixtures";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
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

const ORG = "11111111-1111-4111-8111-111111111111";
const CUSTOMER = "22222222-2222-4222-8222-222222222222";
const PROJECT = "33333333-3333-4333-8333-333333333333";
const SITE = "44444444-4444-4444-8444-444444444444";
const WORK_ORDER = "55555555-5555-4555-8555-555555555555";
const TECHNICIAN = "66666666-6666-4666-8666-666666666666";
const rpc = vi.fn();
const client = { rpc };

function allowRole(role: "owner" | "admin" | "staff" | "viewer") {
  vi.mocked(resolveOrganizationContext).mockResolvedValue({
    ok: true,
    context: { organizationId: ORG, membershipId: TECHNICIAN, userId: "77777777-7777-4777-8777-777777777777", role },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createSupabaseServerClient).mockResolvedValue(client as never);
  allowRole("staff");
  vi.mocked(loadProductModuleAccess).mockResolvedValue({
    resolution: "resolved",
    navVisibility: FIELD_MODULE_NAV_VISIBILITY,
    relevantCapabilities: [],
    terminology: FIELD_PRODUCT_TERMINOLOGY,
  });
  vi.mocked(evaluateProductModuleRouteAccess).mockReturnValue({ allowed: true });
  rpc.mockResolvedValue({ data: SITE, error: null });
});

describe("TG3 Field Operations server actions", () => {
  it("validates before authorization or RPC execution", async () => {
    const result = await createSiteAction({ organizationId: ORG, name: "" });
    expect(result.ok).toBe(false);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("creates a Site through the exact same-organization RPC contract", async () => {
    const result = await createSiteAction({
      organizationId: ORG,
      customerId: CUSTOMER,
      projectId: PROJECT,
      name: "Warehouse",
      addressLine1: "Main Street 1",
      addressLine2: "",
      postalCode: "1000 AA",
      city: "Amsterdam",
      country: "Netherlands",
      operationalNote: "",
    });
    expect(result).toEqual({ ok: true, id: SITE });
    expect(rpc).toHaveBeenCalledWith("create_site", expect.objectContaining({
      p_organization_id: ORG,
      p_customer_id: CUSTOMER,
      p_project_id: PROJECT,
    }));
  });

  it("creates a scheduled Work Order with an existing Member as Technician", async () => {
    rpc.mockResolvedValue({ data: WORK_ORDER, error: null });
    const result = await createWorkOrderAction({
      organizationId: ORG,
      projectId: PROJECT,
      siteId: SITE,
      title: "Install unit",
      instructions: "Isolate supply.",
      technicianMemberId: TECHNICIAN,
      scheduledFor: "2026-09-06T08:00:00.000Z",
    });
    expect(result).toEqual({ ok: true, id: WORK_ORDER });
    expect(rpc).toHaveBeenCalledWith("create_work_order", expect.objectContaining({
      p_site_id: SITE,
      p_project_id: PROJECT,
      p_technician_member_id: TECHNICIAN,
    }));
  });

  it("denies Viewer mutation before any RPC call", async () => {
    allowRole("viewer");
    const result = await transitionWorkOrderStatusAction({
      organizationId: ORG,
      workOrderId: WORK_ORDER,
      toStatus: "in_progress",
      reason: null,
    });
    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("denies a wrong product context before any RPC call", async () => {
    vi.mocked(evaluateProductModuleRouteAccess).mockReturnValue({
      allowed: false,
      message: "This module is not available for this organization context.",
    });
    const result = await transitionWorkOrderStatusAction({
      organizationId: ORG,
      workOrderId: WORK_ORDER,
      toStatus: "in_progress",
      reason: null,
    });
    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("runs Field Attention evaluation only for Owner/Admin", async () => {
    rpc.mockResolvedValue({ data: { created: 1, updated: 0, expired: 0 }, error: null });
    const denied = await evaluateWorkOrderAttentionRulesAction({
      organizationId: ORG,
      workOrderId: WORK_ORDER,
      returnPath: "/dispatch",
    });
    expect(denied.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();

    allowRole("admin");
    const allowed = await evaluateWorkOrderAttentionRulesAction({
      organizationId: ORG,
      workOrderId: WORK_ORDER,
      returnPath: "/dispatch",
    });
    expect(allowed).toEqual({ ok: true, result: { created: 1, updated: 0, expired: 0 } });
    expect(rpc).toHaveBeenCalledWith("evaluate_work_order_attention_rules", {
      p_organization_id: ORG,
      p_work_order_id: WORK_ORDER,
    });
  });
});
