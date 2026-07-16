import { describe, expect, it } from "vitest";
import {
  getLeadById,
  listLeadPipelineStageOptions,
  listLeadRelatedTasks,
  listLeads,
  listLeadStageHistory,
  listLeadStatusHistory,
} from "@/features/leads/server/lead-read-queries";
import {
  createLeadReadMockSupabase,
  CUSTOMER_ID,
  LEAD_ID,
  MEMBER_ID,
  ORG_ID,
  OTHER_ORG_ID,
  sampleConvertedLeadDetailRow,
  sampleLeadDetailRow,
  sampleLeadListRow,
  sampleTaskListRow,
  STAGE_ID,
  STAGE_ID_2,
  USER_ID,
} from "../helpers/lead-read-query-mocks";

describe("listLeads", () => {
  it("returns paginated list items with owner and stage labels", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadsList: { data: [sampleLeadListRow], count: 1, error: null },
    });

    const result = await listLeads({
      supabase,
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].ownerLabel).toBe("Taylor Owner");
      expect(result.data.items[0].stageName).toBe("New");
      expect(result.data.pagination.total).toBe(1);
    }
  });

  it("allows owner archived list requests", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "owner",
      leadsList: {
        data: [{ ...sampleLeadListRow, archived_at: "2026-07-16T10:00:00.000Z" }],
        count: 1,
        error: null,
      },
    });

    const result = await listLeads({
      supabase,
      organizationId: ORG_ID,
      filters: { includeArchived: true },
    });

    expect(result.ok).toBe(true);
  });

  it("returns empty success for zero rows", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadsList: { data: [], count: 0, error: null },
    });

    const result = await listLeads({
      supabase,
      organizationId: ORG_ID,
      filters: { search: "missing" },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toEqual([]);
      expect(result.data.pagination.total).toBe(0);
      expect(result.data.pagination.totalPages).toBe(0);
    }
  });

  it("rejects invalid pagination and sort inputs", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
    });

    const result = await listLeads({
      supabase,
      organizationId: ORG_ID,
      pagination: { pageSize: 101 },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_INPUT");
    }
  });

  it("requires authentication", async () => {
    const supabase = createLeadReadMockSupabase({
      user: null,
    });

    const result = await listLeads({
      supabase,
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
  });

  it("does not reveal cross-organization access as a distinct lead miss", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
    });

    const result = await listLeads({
      supabase,
      organizationId: OTHER_ORG_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
    }
  });

  it("normalizes list query failures", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadsList: { data: null, count: null, error: new Error("fetch failed") },
    });

    const result = await listLeads({
      supabase,
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NETWORK_ERROR");
      expect(result.error.message).not.toMatch(/fetch failed/i);
    }
  });
});

describe("getLeadById", () => {
  it("returns detail with stage summary and without metadata", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadDetail: { data: sampleLeadDetailRow, error: null },
    });

    const result = await getLeadById({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.stage.name).toBe("New");
      expect(result.data).not.toHaveProperty("metadata");
      expect(result.data.derived.allowedStatusTransitions).toEqual(["lost", "disqualified"]);
    }
  });

  it("returns converted customer reference when present", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadDetail: { data: sampleConvertedLeadDetailRow, error: null },
      customers: {
        data: { id: CUSTOMER_ID, display_name: "Converted Customer", archived_at: null },
        error: null,
      },
    });

    const result = await getLeadById({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.convertedCustomer).toEqual({
        customerId: CUSTOMER_ID,
        displayLabel: "Converted Customer",
        convertedAt: "2026-07-15T10:00:00.000Z",
        isArchived: false,
      });
    }
  });

  it("returns unavailable for missing leads without leaking existence", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadDetail: { data: null, error: null },
    });

    const result = await getLeadById({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("LEAD_UNAVAILABLE");
    }
  });

  it("requires authentication for detail reads", async () => {
    const supabase = createLeadReadMockSupabase({ user: null });

    const result = await getLeadById({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
  });
});

describe("listLeadStatusHistory and listLeadStageHistory", () => {
  it("returns ordered status history with actor labels", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadDetail: { data: sampleLeadDetailRow, error: null },
      statusHistory: {
        data: [
          {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            organization_id: ORG_ID,
            lead_id: LEAD_ID,
            from_status: "open",
            to_status: "lost",
            changed_by_member_id: MEMBER_ID,
            reason: "No reply",
            source: "manual",
            changed_at: "2026-07-14T10:00:00.000Z",
          },
        ],
        error: null,
      },
    });

    const result = await listLeadStatusHistory({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].changedByLabel).toBe("Taylor Owner");
      expect(result.data[0].toStatusLabel).toBe("Lost");
    }
  });

  it("returns stage history even when a historical stage label is later unavailable", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadDetail: { data: sampleLeadDetailRow, error: null },
      stageHistory: {
        data: [
          {
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            organization_id: ORG_ID,
            lead_id: LEAD_ID,
            from_stage_id: STAGE_ID,
            to_stage_id: STAGE_ID_2,
            changed_by_member_id: MEMBER_ID,
            reason: null,
            source: "manual",
            changed_at: "2026-07-14T10:00:00.000Z",
          },
        ],
        error: null,
      },
      stages: {
        data: [
          {
            id: STAGE_ID,
            organization_id: ORG_ID,
            name: "New",
            position: 1,
            stage_category: "new",
            is_default: true,
            archived_at: null,
          },
        ],
        error: null,
      },
    });

    const result = await listLeadStageHistory({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].fromStageName).toBe("New");
      expect(result.data[0].toStageName).toBe("Unavailable stage");
    }
  });

  it("suppresses history when lead is inaccessible", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadDetail: { data: null, error: null },
    });

    const result = await listLeadStatusHistory({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("LEAD_UNAVAILABLE");
    }
  });

  it("requires authentication for history reads", async () => {
    const supabase = createLeadReadMockSupabase({ user: null });

    const result = await listLeadStageHistory({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
  });
});

describe("listLeadPipelineStageOptions", () => {
  it("returns active stages ordered for filters and forms", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      stageOptions: {
        data: [
          {
            id: STAGE_ID,
            organization_id: ORG_ID,
            name: "New",
            position: 1,
            stage_category: "new",
            is_default: true,
            archived_at: null,
          },
          {
            id: STAGE_ID_2,
            organization_id: ORG_ID,
            name: "Contacted",
            position: 2,
            stage_category: "active",
            is_default: false,
            archived_at: null,
          },
        ],
        error: null,
      },
    });

    const result = await listLeadPipelineStageOptions({
      supabase,
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].isDefault).toBe(true);
      expect(result.data.every((stage) => stage.isArchived === false)).toBe(true);
    }
  });
});

describe("listLeadRelatedTasks", () => {
  it("returns related tasks after lead visibility is confirmed", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadDetail: { data: sampleLeadDetailRow, error: null },
      tasksList: { data: [sampleTaskListRow], count: 1, error: null },
    });

    const result = await listLeadRelatedTasks({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].title).toBe("Follow up");
      expect(result.data.pagination.totalCount).toBe(1);
    }
  });

  it("does not load related tasks for inaccessible leads", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadDetail: { data: null, error: null },
    });

    const result = await listLeadRelatedTasks({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("LEAD_UNAVAILABLE");
    }
  });
});
