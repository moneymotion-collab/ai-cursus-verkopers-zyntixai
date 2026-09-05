import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import { FAIL_CLOSED_MODULE_NAV_VISIBILITY } from "@/features/product-access/domain/module-access";
import type { OrderRecord, ProductOperationsPageContext, ProductRecord } from "@/features/product-operations/domain/types";
import { FulfillmentView, InventoryView, OrderDetailView, ProductDetailView } from "@/features/product-operations/ui/views";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));

const ORG = "11111111-1111-4111-8111-111111111111";
const product: ProductRecord = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "Field tablet",
  sku: "TAB-01",
  description: "Rugged tablet",
  onHand: 5,
  archivedAt: null,
  createdAt: "2026-09-01T10:00:00Z",
  updatedAt: "2026-09-01T10:00:00Z",
};
const order: OrderRecord = {
  id: "33333333-3333-4333-8333-333333333333",
  customerId: "44444444-4444-4444-8444-444444444444",
  customerLabel: "Acme",
  reference: "WEB-1001",
  fulfillmentStatus: "completed",
  items: [{ id: "item", productId: product.id, productName: product.name, sku: product.sku, quantity: 2 }],
  totalQuantity: 2,
  statusChangedAt: "2026-09-05T10:00:00Z",
  completedAt: "2026-09-05T10:00:00Z",
  cancelledAt: null,
  createdAt: "2026-09-04T10:00:00Z",
};
const visibility = {
  ...FAIL_CLOSED_MODULE_NAV_VISIBILITY,
  customers: true,
  attention: true,
  members: true,
  products: true,
  orders: true,
  inventory: true,
  fulfillment: true,
};
const context: ProductOperationsPageContext = {
  organizationId: ORG,
  organizationName: "Product Org",
  organizationOptions: [{ organizationId: ORG, displayName: "Product Org", role: "admin" }],
  role: "admin",
  terminology: DEFAULT_PRODUCT_TERMINOLOGY,
  moduleAccess: { resolution: "resolved", navVisibility: visibility, relevantCapabilities: [], terminology: DEFAULT_PRODUCT_TERMINOLOGY },
  moduleId: "products",
};

describe("TG4 Product Operations UI", () => {
  it("shows only lawful Product modules and no Project/Field/Knowledge leakage", () => {
    const html = renderToStaticMarkup(<AppShell moduleNavVisibility={visibility} terminology={DEFAULT_PRODUCT_TERMINOLOGY} activeNav="products"><p>body</p></AppShell>);
    for (const label of [">Products<", ">Orders<", ">Inventory<", ">Fulfillment<"]) expect(html).toContain(label);
    for (const href of ['href="/projects"', 'href="/sites"', 'href="/work-orders"', 'href="/dispatch"', 'href="/programs"']) expect(html).not.toContain(href);
  });

  it("shows Product inventory, immutable movement history, and recent Order usage", () => {
    const html = renderToStaticMarkup(<ProductDetailView context={context} product={product} orders={[order]} movements={[{ id: "move", order_id: order.id, movement_type: "order_deduction", quantity_delta: -2, resulting_on_hand: 5, reason: "Order WEB-1001", created_at: "2026-09-04T10:00:00Z" }]} />);
    expect(html).toContain("5");
    expect(html).toContain("WEB-1001");
    expect(html).toContain("-2");
    expect(html).toContain("Adjust inventory");
    expect(html).not.toContain("Project");
  });

  it("shows Customer, Product lines, fulfillment state, and completed history on Order detail", () => {
    const html = renderToStaticMarkup(<OrderDetailView context={{ ...context, moduleId: "orders" }} order={order} />);
    expect(html).toContain("Acme");
    expect(html).toContain("Field tablet");
    expect(html).toContain("2 units total");
    expect(html).toContain("Completed");
    expect(html).not.toContain("Mark completed");
  });

  it("keeps completed Orders visible in the Fulfillment queue", () => {
    const html = renderToStaticMarkup(<FulfillmentView context={{ ...context, moduleId: "fulfillment" }} orders={[order]} />);
    expect(html).toContain("Requires action");
    expect(html).toContain("Completed");
    expect(html).toContain("WEB-1001");
  });

  it("shows exact on-hand state and lawful adjustment entry point", () => {
    const html = renderToStaticMarkup(<InventoryView context={{ ...context, moduleId: "inventory" }} products={[product]} />);
    expect(html).toContain("5 on hand");
    expect(html).toContain("TAB-01");
    expect(html).toContain("Adjust");
  });
});
