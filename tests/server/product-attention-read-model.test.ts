import { describe, expect, it } from "vitest";
import { mapAttentionItemDetail, mapAttentionItemListItem } from "@/features/attention/server/map-attention-read-model";

const base = {
  id: "11111111-1111-4111-8111-111111111111",
  organization_id: "22222222-2222-4222-8222-222222222222",
  enrollment_id: null,
  customer_id: null,
  program_id: null,
  project_id: null,
  task_id: null,
  work_order_id: null,
  product_id: "33333333-3333-4333-8333-333333333333",
  order_id: null,
  source_type: "product",
  source_entity_id: "33333333-3333-4333-8333-333333333333",
  title: "Product is out of stock",
  summary: "No stock",
  status: "open",
  severity: "high",
  assignee_member_id: null,
  detection_count: 1,
  first_detected_at: "2026-09-05T10:00:00Z",
  last_detected_at: "2026-09-05T10:00:00Z",
  acknowledged_at: null,
  resolved_at: null,
  dismissed_at: null,
  expired_at: null,
  archived_at: null,
  created_at: "2026-09-05T10:00:00Z",
  updated_at: "2026-09-05T10:00:00Z",
};

describe("Product Operations Attention mapping", () => {
  it("preserves Product source identity for safe cross-linking", () => {
    const result = mapAttentionItemListItem(base, { productName: "Field tablet" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.sourceType).toBe("product");
      expect(result.data.productId).toBe(base.product_id);
      expect(result.data.orderId).toBeNull();
      expect(result.data.productName).toBe("Field tablet");
    }
  });

  it("preserves Order source identity and Customer context", () => {
    const detail = mapAttentionItemDetail({
      ...base,
      customer_id: "44444444-4444-4444-8444-444444444444",
      product_id: null,
      order_id: "55555555-5555-4555-8555-555555555555",
      source_type: "order",
      source_entity_id: "55555555-5555-4555-8555-555555555555",
      dedupe_key: "dedupe",
      resolution_reason: null,
      dismissal_reason: null,
      created_by_member_id: null,
      updated_by_member_id: null,
    });
    expect(detail.ok).toBe(true);
    if (detail.ok) {
      expect(detail.data.sourceType).toBe("order");
      expect(detail.data.orderId).toBe("55555555-5555-4555-8555-555555555555");
      expect(detail.data.customerId).toBe("44444444-4444-4444-8444-444444444444");
    }
  });
});
