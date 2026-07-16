import { describe, expect, it } from "vitest";
import {
  mapLeadConvertedCustomerSummary,
  mapLeadDetail,
  mapLeadListItem,
  mapLeadPipelineStageOption,
  mapLeadStageHistoryEntry,
  mapLeadStatusHistoryEntry,
} from "@/features/leads/server/map-lead-read-model";

const NOW = "2026-07-14T10:00:00.000Z";
const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";
const STAGE_ID = "55555555-5555-4555-8555-555555555555";
const STAGE_ID_2 = "66666666-6666-4666-8666-666666666666";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
const CUSTOMER_ID = "77777777-7777-4777-8777-777777777777";

const stageBundle = {
  name: "New",
  position: 1,
  stageCategory: "new" as const,
  stageCategoryLabel: "New",
  isDefault: true,
  isArchived: false,
};

describe("mapLeadReadModel", () => {
  it("maps list items with stage and owner labels", () => {
    const item = mapLeadListItem(
      {
        id: LEAD_ID,
        organization_id: ORG_ID,
        display_name: "Prospect Co",
        status: "open",
        email: "ops@prospect.test",
        owner_member_id: MEMBER_ID,
        stage_id: STAGE_ID,
        source_type: "manual",
        pursuit_label: "Q3",
        converted_customer_id: null,
        converted_at: null,
        created_at: NOW,
        updated_at: NOW,
        archived_at: null,
      },
      "Taylor Owner",
      stageBundle,
    );

    expect(item.displayName).toBe("Prospect Co");
    expect(item.statusLabel).toBe("Open");
    expect(item.ownerLabel).toBe("Taylor Owner");
    expect(item.stageName).toBe("New");
    expect(item.derived.isConvertible).toBe(true);
  });

  it("maps detail with transitions and converted customer summary", () => {
    const detail = mapLeadDetail(
      {
        id: LEAD_ID,
        organization_id: ORG_ID,
        display_name: "Prospect Co",
        first_name: "Pat",
        last_name: "Prospect",
        email: "ops@prospect.test",
        phone: "+1",
        status: "open",
        owner_member_id: null,
        created_by_member_id: MEMBER_ID,
        stage_id: STAGE_ID,
        source_type: "manual",
        source_detail: null,
        pursuit_label: null,
        converted_customer_id: null,
        converted_at: null,
        archived_at: null,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        ownerLabel: "Unassigned",
        createdByLabel: "Creator",
        stage: {
          stageId: STAGE_ID,
          name: "New",
          position: 1,
          stageCategory: "new",
          stageCategoryLabel: "New",
          isDefault: true,
        },
        convertedCustomer: null,
      },
    );

    expect(detail.derived.allowedStatusTransitions).toEqual(["lost", "disqualified"]);
    expect(detail).not.toHaveProperty("metadata");
  });

  it("clears transitions for archived leads", () => {
    const detail = mapLeadDetail(
      {
        id: LEAD_ID,
        organization_id: ORG_ID,
        display_name: "Archived",
        first_name: null,
        last_name: null,
        email: null,
        phone: null,
        status: "open",
        owner_member_id: null,
        created_by_member_id: null,
        stage_id: STAGE_ID,
        source_type: "manual",
        source_detail: null,
        pursuit_label: null,
        converted_customer_id: null,
        converted_at: null,
        archived_at: NOW,
        created_at: NOW,
        updated_at: NOW,
      },
      {
        ownerLabel: "Unassigned",
        createdByLabel: "Unassigned",
        stage: {
          stageId: STAGE_ID,
          name: "New",
          position: 1,
          stageCategory: "new",
          stageCategoryLabel: "New",
          isDefault: true,
        },
        convertedCustomer: null,
      },
    );

    expect(detail.derived.isArchived).toBe(true);
    expect(detail.derived.allowedStatusTransitions).toEqual([]);
    expect(detail.derived.isConvertible).toBe(false);
  });

  it("maps converted customer reference with archived flag", () => {
    const summary = mapLeadConvertedCustomerSummary(CUSTOMER_ID, NOW, {
      id: CUSTOMER_ID,
      display_name: "Acme",
      archived_at: NOW,
    });

    expect(summary.displayLabel).toBe("Acme");
    expect(summary.isArchived).toBe(true);
  });

  it("maps status and stage history with labels", () => {
    const statusEntry = mapLeadStatusHistoryEntry(
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        organization_id: ORG_ID,
        lead_id: LEAD_ID,
        from_status: "open",
        to_status: "lost",
        changed_by_member_id: MEMBER_ID,
        reason: "No response",
        source: "manual",
        changed_at: NOW,
      },
      "Taylor Owner",
    );

    expect(statusEntry.fromStatusLabel).toBe("Open");
    expect(statusEntry.toStatusLabel).toBe("Lost");

    const stageEntry = mapLeadStageHistoryEntry(
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        organization_id: ORG_ID,
        lead_id: LEAD_ID,
        from_stage_id: STAGE_ID,
        to_stage_id: STAGE_ID_2,
        changed_by_member_id: MEMBER_ID,
        reason: null,
        source: "manual",
        changed_at: NOW,
      },
      "Taylor Owner",
      {
        [STAGE_ID]: stageBundle,
        [STAGE_ID_2]: {
          ...stageBundle,
          name: "Contacted",
          stageCategory: "active",
          stageCategoryLabel: "Active",
          isDefault: false,
        },
      },
    );

    expect(stageEntry.fromStageName).toBe("New");
    expect(stageEntry.toStageName).toBe("Contacted");
  });

  it("maps pipeline stage options and keeps archived stages out of option mapping caller", () => {
    const option = mapLeadPipelineStageOption({
      id: STAGE_ID,
      organization_id: ORG_ID,
      name: "New",
      position: 1,
      stage_category: "new",
      is_default: true,
      archived_at: null,
    });

    expect(option?.isArchived).toBe(false);
    expect(option?.stageCategory).toBe("new");
  });

  it("preserves history labels when a historical stage bundle is missing", () => {
    const stageEntry = mapLeadStageHistoryEntry(
      {
        id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        organization_id: ORG_ID,
        lead_id: LEAD_ID,
        from_stage_id: STAGE_ID,
        to_stage_id: STAGE_ID_2,
        changed_by_member_id: MEMBER_ID,
        reason: null,
        source: "manual",
        changed_at: NOW,
      },
      "Taylor Owner",
      {},
    );

    expect(stageEntry.fromStageName).toBe("Unavailable stage");
    expect(stageEntry.toStageName).toBe("Unavailable stage");
  });
});
