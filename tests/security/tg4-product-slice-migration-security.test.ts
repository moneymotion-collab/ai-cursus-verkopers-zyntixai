import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = fs.readFileSync(
  path.resolve("supabase/migrations/20260905175421_tg4_product_slice.sql"),
  "utf8",
);
const normalized = migration.toLowerCase().replace(/\s+/g, " ");

describe("TG4 Product slice migration security and correctness", () => {
  it("creates only the frozen Product Operations domains without Projects", () => {
    const productDomain = migration.slice(0, migration.indexOf("-- Product Operations Attention"));
    for (const table of ["products", "inventory_balances", "orders", "order_items", "inventory_movements", "order_status_history"]) {
      expect(normalized).toContain(`create table public.${table}`);
    }
    expect(productDomain).not.toMatch(/project_id/i);
    expect(normalized).not.toContain("create table public.warehouses");
    expect(normalized).not.toContain("payment_status");
    expect(normalized).not.toContain("stripe");
  });

  it("anchors Customer, Product, Order Item, inventory, and actor relations to one organization", () => {
    expect(normalized).toContain("foreign key (organization_id, customer_id) references public.customers (organization_id, id)");
    expect(normalized).toContain("foreign key (organization_id, product_id) references public.products (organization_id, id)");
    expect(normalized).toContain("foreign key (organization_id, order_id) references public.orders (organization_id, id)");
    expect(normalized).toContain("references public.organization_members (organization_id, id)");
  });

  it("enforces nonnegative integer balances and positive order quantities", () => {
    expect(normalized).toContain("inventory_balances_nonnegative_check check (on_hand >= 0)");
    expect(normalized).toContain("order_items_quantity_check check (quantity > 0)");
    expect(normalized).toContain("if v_balance is null or v_balance < v_item.quantity then raise exception 'insufficient stock");
    expect(normalized).toContain("if v_result < 0 then raise exception 'insufficient stock'");
  });

  it("atomically creates Order, Items, deductions, and history in one RPC", () => {
    const fn = normalized.slice(
      normalized.indexOf("create or replace function public.create_inventory_order"),
      normalized.indexOf("create or replace function public.transition_order_fulfillment"),
    );
    expect(fn).toContain("insert into public.orders");
    expect(fn).toContain("insert into public.order_items");
    expect(fn).toContain("'order_deduction'");
    expect(fn).toContain("insert into public.order_status_history");
    expect(fn).not.toContain("exception when");
  });

  it("locks balances in deterministic Product order so concurrent Orders cannot oversell", () => {
    expect(normalized).toMatch(/from public\.inventory_balances as b .* order by b\.product_id for update/);
    expect(normalized).toContain("set on_hand = b.on_hand - v_item.quantity");
    expect(normalized).toContain("inventory_balances_nonnegative_check");
  });

  it("serializes retries and enforces payload-bound idempotency", () => {
    expect(normalized.match(/pg_catalog\.pg_advisory_xact_lock/g)).toHaveLength(3);
    expect(normalized).toContain("orders_org_idempotency_unique");
    expect(normalized).toContain("inventory_movements_org_idempotency_unique");
    expect(normalized).toContain("order_status_history_org_idempotency_unique");
    expect(normalized.match(/idempotency key payload mismatch/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("restores stock at most once on lawful pre-completion cancellation", () => {
    expect(normalized).toContain("movement_type in ('adjustment', 'order_deduction', 'order_restoration')");
    expect(normalized).toContain("inventory_movements_order_product_type_uidx");
    expect(normalized).toContain("set on_hand = b.on_hand + v_item.quantity");
    expect(normalized).toContain("if not private.is_allowed_order_transition");
    expect(normalized).not.toContain("p_from_status = 'completed'");
  });

  it("uses one validated fulfillment status source of truth", () => {
    expect(normalized).toContain("fulfillment_status in ('pending', 'in_progress', 'completed', 'cancelled')");
    expect(normalized).toContain("orders_terminal_timestamps_check");
    expect(normalized).toContain("status_changed_at = pg_catalog.now()");
  });

  it("enables RLS, grants reads only, and routes all writes through locked-down RPCs", () => {
    for (const table of ["products", "inventory_balances", "orders", "order_items", "inventory_movements", "order_status_history"]) {
      expect(normalized).toContain(`alter table public.${table} enable row level security`);
      expect(normalized).toContain(`revoke all on table public.${table} from public, anon, authenticated`);
    }
    expect(normalized).not.toContain("create policy products_insert");
    expect(normalized).toContain("security definer set search_path = ''");
    expect(normalized).toContain("array['owner', 'admin', 'staff']");
  });

  it("adds deterministic deduping and resolving Product Operations Attention", () => {
    expect(normalized).toContain("'inventory_out_of_stock'");
    expect(normalized).toContain("'fulfillment_stalled'");
    expect(normalized).toContain("private.build_attention_source_dedupe_key");
    expect(normalized).toContain("private.expire_attention_item");
    expect(normalized).toContain("v_row.status_changed_at < v_now - interval '48 hours'");
    expect(normalized).toContain("v_row.archived_at is null and v_row.on_hand = 0");
  });
});
