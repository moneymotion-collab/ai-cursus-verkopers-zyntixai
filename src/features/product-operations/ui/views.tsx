import Link from "next/link";
import { AppShell, type AppShellActiveNav } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  canAdministerProducts,
  canOperateProducts,
  fulfillmentStatusLabel,
  type OrderRecord,
  type ProductOperationsPageContext,
  type ProductRecord,
} from "@/features/product-operations/domain/types";
import {
  inventoryAdjustHref,
  orderDetailHref,
  productDetailHref,
} from "@/features/product-operations/domain/navigation";
import type { ProductOperationsContextResult } from "@/features/product-operations/server/resolve-product-operations-context";
import { ArchiveProductButton, AttentionEvaluationButton, FulfillmentActions } from "./workflow-actions";
import styles from "./product-operations.module.css";

type ProductNav = Extract<AppShellActiveNav, "products" | "orders" | "inventory" | "fulfillment">;

export function ProductOperationsShell({
  context,
  activeNav,
  action,
  children,
}: {
  context: ProductOperationsPageContext;
  activeNav: ProductNav;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      activeNav={activeNav}
      organizationOptions={context.organizationOptions}
      selectedOrganizationId={context.organizationId}
      organizationSelectorAction={action}
      moduleNavVisibility={context.moduleAccess.navVisibility}
      terminology={context.terminology}
    >
      {children}
    </AppShell>
  );
}

export function ProductOperationsLoadFailure({
  result,
  activeNav,
  targetPath,
}: {
  result: Exclude<ProductOperationsContextResult, { kind: "ready" }>;
  activeNav: ProductNav;
  targetPath: string;
}) {
  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav={activeNav} organizationOptions={result.organizations}>
        <section className={styles.statePanel}>
          <h1>Select an organization</h1>
          <ul>{result.organizations.map((org) => (
            <li key={org.organizationId}><a href={`${targetPath}?org=${encodeURIComponent(org.organizationId)}`}>{org.displayName}</a></li>
          ))}</ul>
        </section>
      </AppShell>
    );
  }
  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav={activeNav} moduleNavVisibility={result.moduleAccess.navVisibility} terminology={result.moduleAccess.terminology}>
        <section className={styles.statePanel}><h1>Access denied</h1><p>{result.message}</p></section>
      </AppShell>
    );
  }
  return (
    <AppShell activeNav={activeNav}>
      <section className={styles.statePanel}>
        <h1>{result.kind === "auth_required" ? "Sign in required" : "Product operations unavailable"}</h1>
        <p>{result.kind === "error" ? result.message : "No active organization is available."}</p>
      </section>
    </AppShell>
  );
}

export function ProductsList({ context, products }: { context: ProductOperationsPageContext; products: ProductRecord[] }) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div><h1>{context.terminology.product.plural}</h1><p className={styles.muted}>Operational catalog and current on-hand inventory.</p></div>
        {canOperateProducts(context.role) ? <Link className={styles.button} href={`/products/new?org=${context.organizationId}`}>New product</Link> : null}
      </header>
      <div className={styles.card}>
        {products.length ? <ul className={styles.list}>{products.map((product) => (
          <li className={styles.row} key={product.id}>
            <div><Link href={`${productDetailHref(product.id)}?org=${context.organizationId}`}><strong>{product.name}</strong></Link><div className={styles.muted}>{product.sku}</div></div>
            <div><Badge>{`${product.onHand} on hand`}</Badge></div>
          </li>
        ))}</ul> : <p>No products yet.</p>}
      </div>
    </section>
  );
}

export function ProductDetailView({
  context,
  product,
  movements,
  orders,
}: {
  context: ProductOperationsPageContext;
  product: ProductRecord;
  movements: Array<{ id: string; order_id: string | null; movement_type: string; quantity_delta: number; resulting_on_hand: number; reason: string; created_at: string }>;
  orders: OrderRecord[];
}) {
  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <div><p className={styles.muted}>{product.sku}</p><h1>{product.name}</h1></div>
        <div className={styles.actions}>
          {!product.archivedAt && canOperateProducts(context.role) ? <Link className={styles.secondary} href={`/products/${product.id}/edit?org=${context.organizationId}`}>Edit</Link> : null}
          {!product.archivedAt && canOperateProducts(context.role) ? <Link className={styles.button} href={`${inventoryAdjustHref(product.id)}?org=${context.organizationId}`}>Adjust inventory</Link> : null}
          {canAdministerProducts(context.role) ? <ArchiveProductButton organizationId={context.organizationId} product={product} /> : null}
        </div>
      </header>
      <div className={styles.grid}>
        <article className={styles.card}><h2>On hand</h2><p className={`${styles.metric} ${product.onHand === 0 ? styles.negative : styles.positive}`}>{product.onHand}</p><p>{product.description || "No description."}</p></article>
        <article className={styles.card}><h2>Recent order usage</h2>{orders.length ? <ul>{orders.slice(0, 5).map((order) => <li key={order.id}><Link href={`${orderDetailHref(order.id)}?org=${context.organizationId}`}>{order.reference}</Link> — {order.totalQuantity} units</li>)}</ul> : <p>No orders use this product.</p>}</article>
      </div>
      <article className={styles.card}><h2>Inventory history</h2>{movements.length ? <ul className={styles.list}>{movements.map((movement) => <li className={styles.row} key={movement.id}><span>{movement.reason}<br /><span className={styles.muted}>{new Date(movement.created_at).toLocaleString()}</span></span><strong className={movement.quantity_delta > 0 ? styles.positive : styles.negative}>{movement.quantity_delta > 0 ? "+" : ""}{movement.quantity_delta} → {movement.resulting_on_hand}</strong></li>)}</ul> : <p>No inventory movements yet.</p>}</article>
    </section>
  );
}

export function OrdersList({ context, orders, title = "Orders" }: { context: ProductOperationsPageContext; orders: OrderRecord[]; title?: string }) {
  return (
    <section className={styles.page}>
      <header className={styles.header}><div><h1>{title}</h1><p className={styles.muted}>Customer orders with atomic inventory impact.</p></div>{canOperateProducts(context.role) ? <Link className={styles.button} href={`/orders/new?org=${context.organizationId}`}>New order</Link> : null}</header>
      <div className={styles.card}>{orders.length ? <ul className={styles.list}>{orders.map((order) => <li className={styles.row} key={order.id}><div><Link href={`${orderDetailHref(order.id)}?org=${context.organizationId}`}><strong>{order.reference}</strong></Link><div className={styles.muted}>{order.customerLabel} · {order.totalQuantity} units</div></div><Badge>{fulfillmentStatusLabel(order.fulfillmentStatus)}</Badge></li>)}</ul> : <p>No orders in this view.</p>}</div>
    </section>
  );
}

export function OrderDetailView({ context, order }: { context: ProductOperationsPageContext; order: OrderRecord }) {
  return (
    <section className={styles.page}>
      <header className={styles.header}><div><p className={styles.muted}>Order</p><h1>{order.reference}</h1><p><Link href={`/customers/${order.customerId}?org=${context.organizationId}`}>{order.customerLabel}</Link></p></div><Badge>{fulfillmentStatusLabel(order.fulfillmentStatus)}</Badge></header>
      <div className={styles.grid}>
        <article className={styles.card}><h2>Items</h2><ul className={styles.list}>{order.items.map((item) => <li className={styles.row} key={item.id}><Link href={`${productDetailHref(item.productId)}?org=${context.organizationId}`}>{item.productName} <span className={styles.muted}>({item.sku})</span></Link><strong>{item.quantity}</strong></li>)}</ul><p><strong>{order.totalQuantity} units total</strong></p></article>
        <article className={styles.card}><h2>Fulfillment</h2><p>Status changed {new Date(order.statusChangedAt).toLocaleString()}</p>{order.completedAt ? <p className={styles.positive}>Completed {new Date(order.completedAt).toLocaleString()}</p> : null}{order.cancelledAt ? <p>Cancelled {new Date(order.cancelledAt).toLocaleString()} — inventory restored.</p> : null}{canOperateProducts(context.role) ? <FulfillmentActions organizationId={context.organizationId} order={order} /> : null}</article>
      </div>
    </section>
  );
}

export function InventoryView({ context, products }: { context: ProductOperationsPageContext; products: ProductRecord[] }) {
  return <section className={styles.page}><header className={styles.header}><div><h1>Inventory</h1><p className={styles.muted}>One organization-wide on-hand balance per product.</p></div></header><div className={styles.card}><ul className={styles.list}>{products.map((product) => <li className={styles.row} key={product.id}><div><Link href={`${productDetailHref(product.id)}?org=${context.organizationId}`}>{product.name}</Link><div className={styles.muted}>{product.sku}</div></div><div className={styles.actions}><Badge>{`${product.onHand} on hand`}</Badge>{canOperateProducts(context.role) ? <Link className={styles.secondary} href={`${inventoryAdjustHref(product.id)}?org=${context.organizationId}`}>Adjust</Link> : null}</div></li>)}</ul></div></section>;
}

export function FulfillmentView({ context, orders }: { context: ProductOperationsPageContext; orders: OrderRecord[] }) {
  const active = orders.filter((order) => order.fulfillmentStatus === "pending" || order.fulfillmentStatus === "in_progress");
  const completed = orders.filter((order) => order.fulfillmentStatus === "completed");
  return <section className={styles.page}><header className={styles.header}><div><h1>Fulfillment</h1><p className={styles.muted}>Progress valid inventory-backed orders to completion.</p></div>{canAdministerProducts(context.role) ? <AttentionEvaluationButton organizationId={context.organizationId} /> : null}</header><div className={styles.grid}><article className={styles.card}><h2>Requires action</h2><OrderRows context={context} orders={active} /></article><article className={styles.card}><h2>Completed</h2><OrderRows context={context} orders={completed} /></article></div></section>;
}

function OrderRows({ context, orders }: { context: ProductOperationsPageContext; orders: OrderRecord[] }) {
  if (!orders.length) return <p>None.</p>;
  return <ul className={styles.list}>{orders.map((order) => <li className={styles.row} key={order.id}><div><Link href={`${orderDetailHref(order.id)}?org=${context.organizationId}`}>{order.reference}</Link><div className={styles.muted}>{order.customerLabel} · {order.totalQuantity} units</div></div><Badge>{fulfillmentStatusLabel(order.fulfillmentStatus)}</Badge></li>)}</ul>;
}
