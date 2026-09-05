import { describe, expectTypeOf, it } from "vitest";
import type { Database } from "@/types/database";

describe("TG4 generated database contract", () => {
  it("contains Product, Order, Item, inventory and fulfillment history tables", () => {
    expectTypeOf<Database["public"]["Tables"]["products"]["Row"]["sku"]>().toEqualTypeOf<string>();
    expectTypeOf<Database["public"]["Tables"]["orders"]["Row"]["fulfillment_status"]>().toEqualTypeOf<string>();
    expectTypeOf<Database["public"]["Tables"]["order_items"]["Row"]["quantity"]>().toEqualTypeOf<number>();
    expectTypeOf<Database["public"]["Tables"]["inventory_balances"]["Row"]["on_hand"]>().toEqualTypeOf<number>();
    expectTypeOf<Database["public"]["Tables"]["inventory_movements"]["Row"]["quantity_delta"]>().toEqualTypeOf<number>();
    expectTypeOf<Database["public"]["Tables"]["order_status_history"]["Row"]["to_status"]>().toEqualTypeOf<string>();
  });

  it("contains transaction-sensitive Product Operations RPCs", () => {
    expectTypeOf<Database["public"]["Functions"]["create_inventory_order"]["Returns"]>().toEqualTypeOf<string>();
    expectTypeOf<Database["public"]["Functions"]["adjust_product_inventory"]["Returns"]>().toEqualTypeOf<number>();
    expectTypeOf<Database["public"]["Functions"]["transition_order_fulfillment"]["Returns"]>().toEqualTypeOf<undefined>();
    expectTypeOf<Database["public"]["Functions"]["evaluate_product_attention_rules"]["Returns"]>().toEqualTypeOf<Database["public"]["Functions"]["evaluate_work_order_attention_rules"]["Returns"]>();
  });
});
