import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CustomerOption,
  FulfillmentStatus,
  OrderRecord,
  ProductOption,
  ProductRecord,
} from "@/features/product-operations/domain/types";
import type { Database } from "@/types/database";

const PRODUCT_COLUMNS = "id, name, sku, description, archived_at, created_at, updated_at";
const ORDER_COLUMNS =
  "id, customer_id, reference, fulfillment_status, status_changed_at, completed_at, cancelled_at, created_at";

export async function listProducts(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  archived = false,
) {
  let query = supabase.from("products").select(PRODUCT_COLUMNS).eq("organization_id", organizationId);
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  const { data, error } = await query.order("name").limit(200);
  if (error) return { data: [] as ProductRecord[], error: "Unable to load products." };
  const ids = (data ?? []).map((row) => row.id);
  const balances = ids.length
    ? await supabase
        .from("inventory_balances")
        .select("product_id, on_hand")
        .eq("organization_id", organizationId)
        .in("product_id", ids)
    : { data: [], error: null };
  const balanceMap = Object.fromEntries((balances.data ?? []).map((row) => [row.product_id, row.on_hand]));
  return {
    data: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      sku: row.sku,
      description: row.description,
      onHand: balanceMap[row.id] ?? 0,
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
    error: null,
  };
}

export async function getProduct(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  productId: string,
) {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", productId)
    .maybeSingle();
  if (error) return { data: null, error: "Unable to load this product." };
  if (!data) return { data: null, error: null };
  const { data: balance } = await supabase
    .from("inventory_balances")
    .select("on_hand")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .maybeSingle();
  return {
    data: {
      id: data.id,
      name: data.name,
      sku: data.sku,
      description: data.description,
      onHand: balance?.on_hand ?? 0,
      archivedAt: data.archived_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } satisfies ProductRecord,
    error: null,
  };
}

export async function listInventoryMovements(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  productId: string,
) {
  const { data, error } = await supabase
    .from("inventory_movements")
    .select("id, order_id, movement_type, quantity_delta, resulting_on_hand, reason, created_at")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(50);
  return { data: data ?? [], error: error ? "Unable to load inventory history." : null };
}

export async function listOrders(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  filters: { orderId?: string; customerId?: string; productId?: string; status?: FulfillmentStatus } = {},
) {
  let query = supabase.from("orders").select(ORDER_COLUMNS).eq("organization_id", organizationId);
  if (filters.orderId) query = query.eq("id", filters.orderId);
  if (filters.customerId) query = query.eq("customer_id", filters.customerId);
  if (filters.status) query = query.eq("fulfillment_status", filters.status);
  const orderResult = await query.order("created_at", { ascending: false }).limit(filters.orderId ? 1 : 200);
  if (orderResult.error) return { data: [] as OrderRecord[], error: "Unable to load orders." };
  let rows = orderResult.data ?? [];
  if (filters.productId && rows.length) {
    const itemResult = await supabase
      .from("order_items")
      .select("order_id")
      .eq("organization_id", organizationId)
      .eq("product_id", filters.productId)
      .in("order_id", rows.map((row) => row.id));
    const allowed = new Set((itemResult.data ?? []).map((row) => row.order_id));
    rows = rows.filter((row) => allowed.has(row.id));
  }
  if (!rows.length) return { data: [] as OrderRecord[], error: null };
  const orderIds = rows.map((row) => row.id);
  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const [customers, items] = await Promise.all([
    supabase
      .from("customers")
      .select("id, display_name")
      .eq("organization_id", organizationId)
      .in("id", customerIds),
    supabase
      .from("order_items")
      .select("id, order_id, product_id, product_name_snapshot, sku_snapshot, quantity")
      .eq("organization_id", organizationId)
      .in("order_id", orderIds),
  ]);
  const customerMap = Object.fromEntries((customers.data ?? []).map((row) => [row.id, row.display_name]));
  return {
    data: rows.map((row) => {
      const orderItems = (items.data ?? [])
        .filter((item) => item.order_id === row.id)
        .map((item) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.product_name_snapshot,
          sku: item.sku_snapshot,
          quantity: item.quantity,
        }));
      return {
        id: row.id,
        customerId: row.customer_id,
        customerLabel: customerMap[row.customer_id]?.trim() || "Unavailable customer",
        reference: row.reference,
        fulfillmentStatus: row.fulfillment_status as FulfillmentStatus,
        items: orderItems,
        totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        statusChangedAt: row.status_changed_at,
        completedAt: row.completed_at,
        cancelledAt: row.cancelled_at,
        createdAt: row.created_at,
      };
    }),
    error: null,
  };
}

export async function getOrder(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  orderId: string,
) {
  const result = await listOrders(supabase, organizationId, { orderId });
  return { data: result.data.find((order) => order.id === orderId) ?? null, error: result.error };
}

export async function loadOrderOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{ customers: CustomerOption[]; products: ProductOption[] }> {
  const [customers, products] = await Promise.all([
    supabase
      .from("customers")
      .select("id, display_name")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("display_name"),
    listProducts(supabase, organizationId),
  ]);
  return {
    customers: (customers.data ?? []).map((row) => ({ value: row.id, label: row.display_name })),
    products: products.data.map((product) => ({
      value: product.id,
      label: `${product.name} (${product.sku})`,
      onHand: product.onHand,
    })),
  };
}
