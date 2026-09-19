import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import NewOrderPage from "@/app/(authenticated)/orders/new/page";
import { AppShell } from "@/components/app-shell";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import { FAIL_CLOSED_MODULE_NAV_VISIBILITY } from "@/features/product-access/domain/module-access";
import type {
  CustomerOption,
  OrderRecord,
  ProductOperationsPageContext,
  ProductOption,
  ProductRecord,
} from "@/features/product-operations/domain/types";
import { loadOrderCreatePage } from "@/features/product-operations/ui/load-pages";
import { FulfillmentView, InventoryView, OrderDetailView, ProductDetailView } from "@/features/product-operations/ui/views";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }) }));
vi.mock("@/features/product-operations/ui/load-pages", () => ({
  loadOrderCreatePage: vi.fn(),
}));

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
const orderContext: ProductOperationsPageContext = { ...context, moduleId: "orders" };
const customerOption: CustomerOption = { value: "c1", label: "Acme" };
const productOption: ProductOption = { value: "p1", label: "Field tablet (TAB-01)", onHand: 5 };

function pageContext(overrides: {
  role?: ProductOperationsPageContext["role"];
  moduleId?: ProductOperationsPageContext["moduleId"];
  navVisibility?: Partial<typeof visibility>;
} = {}): ProductOperationsPageContext {
  return {
    ...context,
    role: overrides.role ?? context.role,
    moduleId: overrides.moduleId ?? "inventory",
    moduleAccess: {
      ...context.moduleAccess,
      navVisibility: { ...visibility, ...overrides.navVisibility },
    },
  };
}

async function renderNewOrderPage(input: {
  context?: ProductOperationsPageContext;
  customers?: CustomerOption[];
  products?: ProductOption[];
}) {
  vi.mocked(loadOrderCreatePage).mockResolvedValue({
    kind: "ready",
    context: input.context ?? orderContext,
    options: {
      customers: input.customers ?? [],
      products: input.products ?? [],
    },
  });
  const element = await NewOrderPage({
    searchParams: Promise.resolve({ org: (input.context ?? orderContext).organizationId }),
  });
  return renderToStaticMarkup(element);
}

afterEach(() => {
  vi.mocked(loadOrderCreatePage).mockReset();
});

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
    const html = renderToStaticMarkup(<InventoryView context={pageContext()} products={[product]} />);
    expect(html).toContain("5 on hand");
    expect(html).toContain("TAB-01");
    expect(html).toContain("Adjust");
    expect(html).not.toContain("No inventory yet");
  });

  it("keeps populated inventory adjustment when Products navigation is hidden", () => {
    const html = renderToStaticMarkup(
      <InventoryView context={pageContext({ navVisibility: { products: false } })} products={[product]} />,
    );
    expect(html).toContain("5 on hand");
    expect(html).toContain("TAB-01");
    expect(html).toContain("Adjust");
    expect(html).not.toContain("No inventory yet");
    expect(html).not.toContain("New product");
  });

  it("teaches empty inventory and offers product setup only when the operator can create", () => {
    const operatorHtml = renderToStaticMarkup(<InventoryView context={pageContext()} products={[]} />);
    expect(operatorHtml).toContain("No inventory yet");
    expect(operatorHtml).toContain("Create or activate a product before tracking on-hand inventory.");
    expect(operatorHtml).toContain(`href="/products/new?org=${ORG}"`);
    expect(operatorHtml).toContain("New product");
    expect(operatorHtml).not.toContain("5 on hand");
  });

  it("hides empty inventory product setup when Products navigation is unavailable", () => {
    const html = renderToStaticMarkup(
      <InventoryView context={pageContext({ navVisibility: { products: false } })} products={[]} />,
    );
    expect(html).toContain("No inventory yet");
    expect(html).toContain("Create or activate a product before tracking on-hand inventory.");
    expect(html).not.toContain("New product");
    expect(html).not.toContain("/products/new");
    expect(html).not.toContain("Adjust");
  });

  it("does not offer empty inventory product setup to viewers even when Products navigation is visible", () => {
    const html = renderToStaticMarkup(<InventoryView context={pageContext({ role: "viewer" })} products={[]} />);
    expect(html).toContain("No inventory yet");
    expect(html).toContain("Create or activate a product before tracking on-hand inventory.");
    expect(html).not.toContain("New product");
    expect(html).not.toContain("/products/new");
    expect(html).not.toContain("Adjust");
  });

  it("does not offer inventory adjustment to viewers on populated records", () => {
    const html = renderToStaticMarkup(<InventoryView context={pageContext({ role: "viewer" })} products={[product]} />);
    expect(html).toContain("5 on hand");
    expect(html).toContain("TAB-01");
    expect(html).not.toContain("Adjust");
  });

  it("blocks OrderForm and links Customer create when customers are missing", async () => {
    const html = await renderNewOrderPage({ products: [productOption] });
    expect(html).toContain("Create a Customer");
    expect(html).toContain(`href="/customers/new?org=${ORG}"`);
    expect(html).not.toContain("/products/new");
    expect(html).not.toContain("Create order");
    expect(html).not.toContain("Order reference");
    expect(html).not.toContain('name="customerId"');
  });

  it("blocks OrderForm and links Product create when products are missing", async () => {
    const html = await renderNewOrderPage({ customers: [customerOption] });
    expect(html).toContain("Create an active Product");
    expect(html).toContain(`href="/products/new?org=${ORG}"`);
    expect(html).not.toContain("/customers/new");
    expect(html).not.toContain("Create order");
    expect(html).not.toContain("Order reference");
    expect(html).not.toContain('name="customerId"');
  });

  it("blocks OrderForm and keeps both prerequisite links independently governed", async () => {
    const bothHtml = await renderNewOrderPage({});
    const hiddenCustomersHtml = await renderNewOrderPage({
      context: pageContext({ moduleId: "orders", navVisibility: { customers: false } }),
    });
    const hiddenProductsHtml = await renderNewOrderPage({
      context: pageContext({ moduleId: "orders", navVisibility: { products: false } }),
    });

    expect(bothHtml).toContain("Create a Customer");
    expect(bothHtml).toContain("Create an active Product");
    expect(bothHtml).toContain(`href="/customers/new?org=${ORG}"`);
    expect(bothHtml).toContain(`href="/products/new?org=${ORG}"`);
    expect(bothHtml).not.toContain("Create order");
    expect(bothHtml).not.toContain("Order reference");
    expect(bothHtml).not.toContain('name="customerId"');

    expect(hiddenCustomersHtml).toContain("Create a Customer first.");
    expect(hiddenCustomersHtml).not.toContain("/customers/new");
    expect(hiddenCustomersHtml).toContain(`href="/products/new?org=${ORG}"`);
    expect(hiddenCustomersHtml).not.toContain("Create order");

    expect(hiddenProductsHtml).toContain("Create an active Product first.");
    expect(hiddenProductsHtml).not.toContain("/products/new");
    expect(hiddenProductsHtml).toContain(`href="/customers/new?org=${ORG}"`);
    expect(hiddenProductsHtml).not.toContain("Create order");
  });

  it("keeps Order-create explanations without recovery links for viewers", async () => {
    const html = await renderNewOrderPage({
      context: { ...orderContext, role: "viewer" },
    });
    expect(html).toContain("Create a Customer first.");
    expect(html).toContain("Create an active Product first.");
    expect(html).not.toContain("/customers/new");
    expect(html).not.toContain("/products/new");
    expect(html).not.toContain("Create order");
    expect(html).not.toContain("Order reference");
    expect(html).not.toContain('name="customerId"');
  });

  it("renders OrderForm only when Customer and Product prerequisites exist", async () => {
    const html = await renderNewOrderPage({
      customers: [customerOption],
      products: [productOption],
    });
    expect(html).toContain("Create order");
    expect(html).toContain("Order reference");
    expect(html).toContain('name="customerId"');
    expect(html).toContain("Acme");
    expect(html).toContain("Field tablet (TAB-01)");
    expect(html).not.toContain("Create a Customer first.");
    expect(html).not.toContain("Create an active Product first.");
    expect(html).not.toContain("/customers/new");
    expect(html).not.toContain("/products/new");
  });
});
