import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adjustInventoryAction,
  createOrderAction,
  createProductAction,
  transitionFulfillmentAction,
} from "@/features/product-operations/actions/actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { FAIL_CLOSED_MODULE_NAV_VISIBILITY } from "@/features/product-access/domain/module-access";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/organizations/server/resolve-organization-context", () => ({ resolveOrganizationContext: vi.fn() }));
vi.mock("@/features/product-access/server/load-product-module-access", () => ({ loadProductModuleAccess: vi.fn() }));
vi.mock("@/features/product-access/server/enforce-product-module-access", () => ({ evaluateProductModuleRouteAccess: vi.fn() }));

const ORG = "11111111-1111-4111-8111-111111111111";
const CUSTOMER = "22222222-2222-4222-8222-222222222222";
const PRODUCT = "33333333-3333-4333-8333-333333333333";
const ORDER = "44444444-4444-4444-8444-444444444444";
const KEY = "55555555-5555-4555-8555-555555555555";
const rpc = vi.fn();

function allowRole(role: "owner" | "admin" | "staff" | "viewer") {
  vi.mocked(resolveOrganizationContext).mockResolvedValue({
    ok: true,
    context: { organizationId: ORG, membershipId: "member", userId: "user", role },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ rpc } as never);
  allowRole("staff");
  vi.mocked(loadProductModuleAccess).mockResolvedValue({
    resolution: "resolved",
    navVisibility: { ...FAIL_CLOSED_MODULE_NAV_VISIBILITY, products: true, orders: true, inventory: true, fulfillment: true },
    relevantCapabilities: [],
    terminology: DEFAULT_PRODUCT_TERMINOLOGY,
  });
  vi.mocked(evaluateProductModuleRouteAccess).mockReturnValue({ allowed: true });
  rpc.mockResolvedValue({ data: PRODUCT, error: null });
});

describe("TG4 Product Operations actions", () => {
  it("validates Product input before authorization", async () => {
    const result = await createProductAction({ organizationId: ORG, name: "", sku: "" });
    expect(result.ok).toBe(false);
    expect(createSupabaseServerClient).not.toHaveBeenCalled();
  });

  it("normalizes Product mutation through its organization-scoped RPC", async () => {
    const result = await createProductAction({ organizationId: ORG, name: "Tablet", sku: "tab-1" });
    expect(result).toEqual({ ok: true, id: PRODUCT });
    expect(rpc).toHaveBeenCalledWith("create_product", expect.objectContaining({
      p_organization_id: ORG,
      p_name: "Tablet",
      p_sku: "tab-1",
    }));
  });

  it("passes multi-item Order and idempotency data to one atomic RPC", async () => {
    rpc.mockResolvedValue({ data: ORDER, error: null });
    const result = await createOrderAction({
      organizationId: ORG,
      customerId: CUSTOMER,
      reference: "ORDER-1",
      items: [{ productId: PRODUCT, quantity: 4 }],
      idempotencyKey: KEY,
    });
    expect(result).toEqual({ ok: true, id: ORDER });
    expect(rpc).toHaveBeenCalledWith("create_inventory_order", {
      p_organization_id: ORG,
      p_customer_id: CUSTOMER,
      p_reference: "ORDER-1",
      p_items: [{ product_id: PRODUCT, quantity: 4 }],
      p_idempotency_key: KEY,
    });
  });

  it("returns a clear fail-closed error for insufficient stock", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "insufficient stock for product TAB-1" } });
    const result = await createOrderAction({
      organizationId: ORG,
      customerId: CUSTOMER,
      reference: "ORDER-2",
      items: [{ productId: PRODUCT, quantity: 6 }],
      idempotencyKey: KEY,
    });
    expect(result).toEqual({ ok: false, message: "Insufficient stock. No order or inventory change was created." });
  });

  it("records auditable inventory adjustment parameters", async () => {
    rpc.mockResolvedValue({ data: 5, error: null });
    const result = await adjustInventoryAction({ organizationId: ORG, productId: PRODUCT, quantityDelta: 5, reason: "Opening count", idempotencyKey: KEY });
    expect(result).toEqual({ ok: true, id: PRODUCT, onHand: 5 });
    expect(rpc).toHaveBeenCalledWith("adjust_product_inventory", expect.objectContaining({ p_quantity_delta: 5, p_reason: "Opening count", p_idempotency_key: KEY }));
  });

  it("transitions fulfillment with retry identity", async () => {
    rpc.mockResolvedValue({ data: undefined, error: null });
    const result = await transitionFulfillmentAction({ organizationId: ORG, orderId: ORDER, toStatus: "completed", reason: "Packed", idempotencyKey: KEY });
    expect(result).toEqual({ ok: true, id: ORDER });
    expect(rpc).toHaveBeenCalledWith("transition_order_fulfillment", expect.objectContaining({ p_to_status: "completed", p_idempotency_key: KEY }));
  });

  it("denies viewer mutations before RPC execution", async () => {
    allowRole("viewer");
    const result = await adjustInventoryAction({ organizationId: ORG, productId: PRODUCT, quantityDelta: 1, reason: "Count", idempotencyKey: KEY });
    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
