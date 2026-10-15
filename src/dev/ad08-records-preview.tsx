import { AppShellChrome, type AppShellActiveNav } from "@/components/app-shell-chrome";
import { InventoryAdjustmentForm, OrderForm, ProductForm } from "@/features/product-operations/ui/forms";
import {
  FulfillmentView,
  InventoryView,
  OrderCreateUnavailablePanel,
  OrderDetailView,
  OrdersList,
  ProductDetailView,
  ProductsList,
} from "@/features/product-operations/ui/views";
import type {
  OrderRecord,
  ProductOperationsPageContext,
  ProductRecord,
} from "@/features/product-operations/domain/types";
import styles from "@/features/product-operations/ui/product-operations.module.css";
import {
  buildOperatingModelProductModuleAccess,
  operatingModelNavVisibility,
} from "@/features/product-access/domain/operating-model-module-access";

const ORG = "11111111-1111-4111-8111-111111111111";
const LONG_PRODUCT = "AD08 example product with a catalog name that wraps on a narrow screen";
const LONG_SKU = "AD08-EXAMPLE-SKU-NARROW";
const LONG_CUSTOMER = "AD08 example customer with a long display name for a narrow screen";
const LONG_ORDER = "AD08-EXAMPLE-ORDER-REFERENCE-THAT-WRAPS";
const STOCK_MESSAGE = "Insufficient stock. No order or inventory change was created.";
const ORDER_SUMMARY = "Check the highlighted fields.";
const CUSTOMER_ERROR = "Invalid uuid";
const REFERENCE_ERROR = "String must contain at least 1 character(s)";
const ITEMS_ERROR = "Each product may appear only once.";
const LONG_REFERENCE_ERROR = "String must contain at most 120 character(s). AD14 example reference message that wraps beside the order lines on a narrow screen.";
const ORDER_LINES = [
  { id: "line-1", productId: "example-product-1", quantity: 2 },
  { id: "line-2", productId: "example-product-2", quantity: 1 },
];

function contextFor(
  orgName: string,
  moduleId: ProductOperationsPageContext["moduleId"],
): ProductOperationsPageContext {
  const access = buildOperatingModelProductModuleAccess("product_operations");
  return {
    organizationId: ORG,
    organizationName: orgName,
    organizationOptions: [
      { organizationId: ORG, role: "owner", displayName: orgName },
      {
        organizationId: "22222222-2222-4222-8222-222222222222",
        role: "admin",
        displayName: "Example second workspace",
      },
    ],
    role: "owner",
    terminology: access.terminology,
    moduleAccess: access,
    moduleId,
  };
}

function product(long: boolean, onHand = 12, archived = false, id = "example-product-1"): ProductRecord {
  return {
    id,
    name: long ? LONG_PRODUCT : "AD08 example product",
    sku: long ? LONG_SKU : "AD08-SKU",
    description: long
      ? "AD08 example description that stays inside the product detail on a narrow screen."
      : "AD08 example description",
    onHand,
    archivedAt: archived ? "2026-10-03T09:00:00.000Z" : null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
  };
}

function order(
  long: boolean,
  status: OrderRecord["fulfillmentStatus"] = "pending",
  id = "example-order-1",
): OrderRecord {
  const name = long ? LONG_PRODUCT : "AD08 example product";
  const sku = long ? LONG_SKU : "AD08-SKU";
  return {
    id,
    customerId: "example-customer",
    customerLabel: long ? LONG_CUSTOMER : "AD08 example customer",
    reference: long ? LONG_ORDER : "AD08-1001",
    fulfillmentStatus: status,
    items: [
      { id: "example-line-1", productId: "example-product-1", productName: name, sku, quantity: 2 },
      { id: "example-line-2", productId: "example-product-2", productName: "AD08 example second product", sku: "AD08-SKU-2", quantity: 1 },
    ],
    totalQuantity: 3,
    statusChangedAt: "2026-10-04T10:00:00.000Z",
    completedAt: status === "completed" ? "2026-10-05T15:00:00.000Z" : null,
    cancelledAt: status === "cancelled" ? "2026-10-05T15:00:00.000Z" : null,
    createdAt: "2026-10-04T09:00:00.000Z",
  };
}

function navFor(state: string): Extract<AppShellActiveNav, "products" | "orders" | "inventory" | "fulfillment"> {
  if (state.startsWith("order")) return "orders";
  if (state.startsWith("inventory")) return "inventory";
  if (state.startsWith("fulfillment")) return "fulfillment";
  return "products";
}

const options = {
  customers: [
    { value: "example-customer", label: LONG_CUSTOMER },
    { value: "example-customer-2", label: "AD08 example customer" },
  ],
  products: [
    { value: "example-product-1", label: `${LONG_PRODUCT} (${LONG_SKU})`, onHand: 12 },
    { value: "example-product-2", label: "AD08 example second product (AD08-SKU-2)", onHand: 4 },
  ],
};

export function Ad08RecordsPreview({
  state,
  orgName,
}: {
  state: string;
  orgName: string;
}) {
  const loading = state.endsWith("loading");
  const long = state.endsWith("long");
  const access = buildOperatingModelProductModuleAccess("product_operations");
  const products = contextFor(orgName, "products");
  const orders = contextFor(orgName, "orders");
  const inventory = contextFor(orgName, "inventory");
  const fulfillment = contextFor(orgName, "fulfillment");
  const catalog = [product(long), product(false, 0, false, "example-product-2")];
  const movements = [
    {
      id: "example-move-1",
      order_id: null,
      movement_type: "adjustment",
      quantity_delta: 12,
      resulting_on_hand: 12,
      reason: long ? "AD08 example receipt that wraps beside the quantity" : "AD08 example receipt",
      created_at: "2026-10-02T09:00:00.000Z",
    },
    {
      id: "example-move-2",
      order_id: "example-order-1",
      movement_type: "order",
      quantity_delta: -2,
      resulting_on_hand: 10,
      reason: "AD08 example order deduction",
      created_at: "2026-10-04T10:00:00.000Z",
    },
  ];

  return (
    <AppShellChrome
      activeNav={navFor(state)}
      moduleNavVisibility={operatingModelNavVisibility("product_operations")}
      terminology={access.terminology}
      organizationOptions={products.organizationOptions}
      selectedOrganizationId={ORG}
      organizationSelectorAction="/ad02-preview"
      navigationPresentation={loading ? "pending" : "resolved"}
    >
      {state === "product-loading" ? (
        <section className={styles.statePanel} aria-live="polite" aria-busy="true">
          <h1>Loading products</h1>
          <p>Please wait while the workspace is prepared.</p>
        </section>
      ) : null}
      {state === "product-warning" ? (
        <section className={styles.page}>
          <p className={styles.error} role="alert">AD08 example query message</p>
          <ProductsList context={products} products={catalog} />
        </section>
      ) : null}
      {state === "product-list" || state === "product-long" || state === "product-empty" ? (
        <ProductsList context={products} products={state === "product-empty" ? [] : catalog} />
      ) : null}
      {state === "product-detail" || state === "product-detail-long" || state === "product-zero" || state === "product-restore" ? (
        <ProductDetailView
          context={products}
          product={product(
            long || state === "product-detail-long",
            state === "product-zero" ? 0 : 12,
            state === "product-restore",
          )}
          movements={state === "product-zero" ? [] : movements}
          orders={state === "product-zero" ? [] : [order(long)]}
        />
      ) : null}
      {state === "product-pending" ? (
        <section className={styles.statePanel}>
          <h1>Product</h1>
          <p role="status">Archive is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "product-errors" || state === "product-saving" ? (
        <section className={styles.page}>
          <h1>New product</h1>
          <p role="status">
            {state === "product-saving"
              ? "Saving is shown as pending."
              : "Name is required."}{" "}
            Static preview only. This does not submit a form.
          </p>
        </section>
      ) : null}
      {state === "product-new" || state === "product-edit" ? (
        <section className={styles.page}>
          <h1>{state === "product-edit" ? "Edit product" : "New product"}</h1>
          <ProductForm
            organizationId={ORG}
            product={state === "product-edit" ? product(true) : undefined}
          />
        </section>
      ) : null}
      {state === "order-loading" ? (
        <section className={styles.statePanel} aria-live="polite" aria-busy="true">
          <h1>Loading orders</h1>
          <p>Please wait while the workspace is prepared.</p>
        </section>
      ) : null}
      {state === "order-list" || state === "order-long" || state === "order-empty" ? (
        <OrdersList context={orders} orders={state === "order-empty" ? [] : [order(long), order(false, "completed", "example-order-2")]} title={orders.terminology.order.plural} />
      ) : null}
      {state === "order-detail" || state === "order-detail-long" || state === "order-cancelled" ? (
        <OrderDetailView
          context={orders}
          order={order(long || state === "order-detail-long", state === "order-cancelled" ? "cancelled" : "pending")}
        />
      ) : null}
      {state === "order-pending" ? (
        <section className={styles.statePanel}>
          <h1>Order</h1>
          <p role="status">Fulfillment is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "order-new" ? (
        <section className={styles.page}>
          <h1>New order</h1>
          <OrderForm
            organizationId={ORG}
            customers={options.customers}
            products={options.products}
          />
        </section>
      ) : null}
      {state === "order-lines" || state === "order-stock" || state === "order-saving" || state.startsWith("order-error") ? (
        <section className={styles.page}>
          <h1>New order</h1>
          <p role="status">
            {state === "order-lines"
              ? `Example lines: ${ORDER_LINES.map((line) => `${line.productId} × ${line.quantity}`).join(", ")}.`
              : state === "order-stock"
                ? STOCK_MESSAGE
                : state === "order-saving"
                  ? "Saving is shown as pending."
                  : state === "order-error-customer"
                    ? `${ORDER_SUMMARY} ${CUSTOMER_ERROR}`
                    : state === "order-error-fields"
                      ? `${ORDER_SUMMARY} ${CUSTOMER_ERROR} ${REFERENCE_ERROR}`
                      : state === "order-error-items"
                        ? `${ORDER_SUMMARY} ${ITEMS_ERROR}`
                        : state === "order-error-mixed"
                          ? `${ORDER_SUMMARY} ${CUSTOMER_ERROR} ${ITEMS_ERROR}`
                          : `${ORDER_SUMMARY} ${LONG_REFERENCE_ERROR}`}{" "}
            Static preview only. This does not submit a form.
          </p>
        </section>
      ) : null}
      {state === "order-blocked" ? (
        <section className={styles.page}>
          <h1>New order</h1>
          <OrderCreateUnavailablePanel
            organizationId={ORG}
            missingCustomers
            missingProducts
            canCreateCustomer
            canCreateProduct
            customerSingular={orders.terminology.customer.singular}
            productSingular={orders.terminology.product.singular}
          />
        </section>
      ) : null}
      {state === "inventory-loading" ? (
        <section className={styles.statePanel} aria-live="polite" aria-busy="true">
          <h1>Loading inventory</h1>
          <p>Please wait while the workspace is prepared.</p>
        </section>
      ) : null}
      {state === "inventory-list" || state === "inventory-long" || state === "inventory-empty" ? (
        <InventoryView context={inventory} products={state === "inventory-empty" ? [] : [product(long), product(false, 0, false, "example-product-2")]} />
      ) : null}
      {state === "inventory-adjust" || state === "inventory-adjust-long" ? (
        <section className={styles.page}>
          <h1>Adjust inventory — {product(long || state === "inventory-adjust-long").name}</h1>
          <InventoryAdjustmentForm
            organizationId={ORG}
            product={product(long || state === "inventory-adjust-long")}
          />
        </section>
      ) : null}
      {state === "inventory-stock" || state === "inventory-saving" ? (
        <section className={styles.page}>
          <h1>Adjust inventory — {product(long).name}</h1>
          <p role="status">
            {state === "inventory-saving" ? "Saving is shown as pending." : STOCK_MESSAGE}{" "}
            Static preview only. This does not submit a form.
          </p>
        </section>
      ) : null}
      {state === "fulfillment" || state === "fulfillment-long" || state === "fulfillment-empty" ? (
        <FulfillmentView
          context={fulfillment}
          orders={state === "fulfillment-empty" ? [] : [order(long, "pending"), order(false, "in_progress", "example-order-2"), order(false, "completed", "example-order-3")]}
        />
      ) : null}
      {state === "fulfillment-pending" ? (
        <section className={styles.statePanel}>
          <h1>Fulfillment</h1>
          <p role="status">Attention evaluation is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "fulfillment-loading" ? (
        <section className={styles.statePanel} aria-live="polite" aria-busy="true">
          <h1>Loading fulfillment</h1>
          <p>Please wait while the workspace is prepared.</p>
        </section>
      ) : null}
    </AppShellChrome>
  );
}
