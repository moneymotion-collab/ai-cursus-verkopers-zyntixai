import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductOperationsModuleId } from "@/features/product-operations/domain/types";
import { resolveProductOperationsContext } from "@/features/product-operations/server/resolve-product-operations-context";
import {
  getOrder,
  getProduct,
  listInventoryMovements,
  listOrders,
  listProducts,
  loadOrderOptions,
} from "@/features/product-operations/server/queries";

async function base(moduleId: ProductOperationsModuleId, org?: string) {
  const supabase = await createSupabaseServerClient();
  const resolved = await resolveProductOperationsContext(supabase, moduleId, org);
  return { supabase, resolved };
}

export async function loadProductsPage(org?: string) {
  const loaded = await base("products", org);
  if (loaded.resolved.kind !== "ready") return loaded.resolved;
  const products = await listProducts(loaded.supabase, loaded.resolved.context.organizationId);
  return { kind: "ready" as const, context: loaded.resolved.context, products: products.data, warning: products.error };
}

export async function loadProductPage(productId: string, org?: string) {
  const loaded = await base("products", org);
  if (loaded.resolved.kind !== "ready") return loaded.resolved;
  const organizationId = loaded.resolved.context.organizationId;
  const [product, movements, orders] = await Promise.all([
    getProduct(loaded.supabase, organizationId, productId),
    listInventoryMovements(loaded.supabase, organizationId, productId),
    listOrders(loaded.supabase, organizationId, { productId }),
  ]);
  return { kind: "ready" as const, context: loaded.resolved.context, product: product.data, movements: movements.data, orders: orders.data, warning: product.error || movements.error || orders.error };
}

export async function loadOrdersPage(org?: string, customerId?: string) {
  const loaded = await base("orders", org);
  if (loaded.resolved.kind !== "ready") return loaded.resolved;
  const orders = await listOrders(loaded.supabase, loaded.resolved.context.organizationId, { customerId });
  return { kind: "ready" as const, context: loaded.resolved.context, orders: orders.data, warning: orders.error };
}

export async function loadOrderPage(orderId: string, org?: string) {
  const loaded = await base("orders", org);
  if (loaded.resolved.kind !== "ready") return loaded.resolved;
  const order = await getOrder(loaded.supabase, loaded.resolved.context.organizationId, orderId);
  return { kind: "ready" as const, context: loaded.resolved.context, order: order.data, warning: order.error };
}

export async function loadOrderCreatePage(org?: string) {
  const loaded = await base("orders", org);
  if (loaded.resolved.kind !== "ready") return loaded.resolved;
  const options = await loadOrderOptions(loaded.supabase, loaded.resolved.context.organizationId);
  return { kind: "ready" as const, context: loaded.resolved.context, options };
}

export async function loadInventoryPage(org?: string) {
  const loaded = await base("inventory", org);
  if (loaded.resolved.kind !== "ready") return loaded.resolved;
  const products = await listProducts(loaded.supabase, loaded.resolved.context.organizationId);
  return { kind: "ready" as const, context: loaded.resolved.context, products: products.data, warning: products.error };
}

export async function loadInventoryAdjustPage(productId: string, org?: string) {
  const loaded = await base("inventory", org);
  if (loaded.resolved.kind !== "ready") return loaded.resolved;
  const product = await getProduct(loaded.supabase, loaded.resolved.context.organizationId, productId);
  return { kind: "ready" as const, context: loaded.resolved.context, product: product.data, warning: product.error };
}

export async function loadFulfillmentPage(org?: string) {
  const loaded = await base("fulfillment", org);
  if (loaded.resolved.kind !== "ready") return loaded.resolved;
  const orders = await listOrders(loaded.supabase, loaded.resolved.context.organizationId);
  return { kind: "ready" as const, context: loaded.resolved.context, orders: orders.data, warning: orders.error };
}
