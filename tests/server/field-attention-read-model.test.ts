import { describe, expect, it } from "vitest";
import {
  mapAttentionItemDetail,
  mapAttentionItemListItem,
} from "@/features/attention/server/map-attention-read-model";
import {
  sampleAttentionItemDetailRow,
  sampleAttentionItemListRow,
} from "../helpers/attention-test-fixtures";

const WORK_ORDER = "44444444-4444-4444-8444-444444444444";
const PROJECT = "55555555-5555-4555-8555-555555555555";

describe("TG3 Work Order Attention read model", () => {
  it("maps Work Order source identity and Job context on list rows", () => {
    const mapped = mapAttentionItemListItem({
      ...sampleAttentionItemListRow,
      source_type: "work_order",
      source_entity_id: WORK_ORDER,
      enrollment_id: null,
      customer_id: null,
      program_id: null,
      project_id: PROJECT,
      task_id: null,
      work_order_id: WORK_ORDER,
    }, { projectName: "Boiler installation" });
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;
    expect(mapped.data.sourceType).toBe("work_order");
    expect(mapped.data.sourceEntityId).toBe(WORK_ORDER);
    expect(mapped.data.workOrderId).toBe(WORK_ORDER);
    expect(mapped.data.projectId).toBe(PROJECT);
    expect(mapped.data.projectName).toBe("Boiler installation");
  });

  it("maps the related Work Order needed for Attention cross-linking", () => {
    const mapped = mapAttentionItemDetail({
      ...sampleAttentionItemDetailRow,
      source_type: "work_order",
      source_entity_id: WORK_ORDER,
      enrollment_id: null,
      customer_id: null,
      program_id: null,
      project_id: PROJECT,
      task_id: null,
      work_order_id: WORK_ORDER,
    }, {
      workOrder: {
        id: WORK_ORDER,
        title: "Install control panel",
        status: "scheduled",
        siteId: "66666666-6666-4666-8666-666666666666",
        scheduledFor: "2026-09-06T08:00:00Z",
      },
    });
    expect(mapped.ok).toBe(true);
    if (!mapped.ok) return;
    expect(mapped.data.workOrder?.id).toBe(WORK_ORDER);
    expect(mapped.data.workOrder?.status).toBe("scheduled");
  });
});
