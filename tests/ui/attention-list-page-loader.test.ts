import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  ATTENTION_LIST_WORKSPACE_PAGE,
  ATTENTION_LIST_WORKSPACE_PAGE_SIZE,
  ATTENTION_LIST_WORKSPACE_SORT,
  loadAttentionListPage,
} from "@/features/attention/ui/load-attention-list-page";
import { resolveAttentionPageOrganization } from "@/features/attention/server/resolve-attention-page-organization";
import { listAttentionItems } from "@/features/attention/server/attention-read-queries";
import { mapAttentionItemListItem } from "@/features/attention/server/map-attention-read-model";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import {
  ATTENTION_ITEM_ID,
  ORG_ID,
  sampleAttentionItemListRow,
} from "../helpers/attention-test-fixtures";

vi.mock("@/features/attention/server/resolve-attention-page-organization", () => ({
  resolveAttentionPageOrganization: vi.fn(),
}));

vi.mock("@/features/attention/server/attention-read-queries", () => ({
  listAttentionItems: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveAttentionPageOrganization);
const listMock = vi.mocked(listAttentionItems);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

function readyOrg(role: "owner" | "admin" | "staff" | "viewer" = "owner") {
  return {
    kind: "ready" as const,
    organizationId: ORG_ID,
    organizationName: "Acme",
    organizationOptions: [
      { organizationId: ORG_ID, displayName: "Acme", role },
    ],
    role,
    timezone: "UTC",
    isMultiOrganization: false,
  };
}

const sampleMapped = mapAttentionItemListItem(sampleAttentionItemListRow, {
  customerDisplayName: "Acme Corp",
  programName: "Growth Lab",
  primaryRuleKey: "enrollment_no_recent_progress",
  primarySignalOrigin: "rule",
});

describe("attention list page loader (B1.7.5-B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps organization gate states without calling listAttentionItems", async () => {
    pageOrgMock.mockResolvedValue({ kind: "auth_required" });
    expect(await loadAttentionListPage(createSupabase(), {})).toEqual({
      kind: "auth_required",
    });
    expect(listMock).not.toHaveBeenCalled();

    pageOrgMock.mockResolvedValue({ kind: "organization_unavailable" });
    expect((await loadAttentionListPage(createSupabase(), {})).kind).toBe(
      "no_organizations",
    );

    pageOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: [
        { organizationId: ORG_ID, displayName: "Acme", role: "owner" },
      ],
    });
    expect((await loadAttentionListPage(createSupabase(), {})).kind).toBe(
      "organization_required",
    );
  });

  it("calls listAttentionItems with fixed last_detected_at query", async () => {
    expect(sampleMapped.ok).toBe(true);
    if (!sampleMapped.ok) return;

    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    listMock.mockResolvedValue({
      ok: true,
      data: {
        items: [sampleMapped.data],
        pagination: {
          page: 1,
          pageSize: ATTENTION_LIST_WORKSPACE_PAGE_SIZE,
          total: 1,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
    });

    const result = await loadAttentionListPage(createSupabase(), {
      org: ORG_ID,
    });

    expect(listMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: ORG_ID,
      filters: {},
      pagination: {
        page: ATTENTION_LIST_WORKSPACE_PAGE,
        pageSize: ATTENTION_LIST_WORKSPACE_PAGE_SIZE,
      },
      sort: ATTENTION_LIST_WORKSPACE_SORT,
    });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.id).toBe(ATTENTION_ITEM_ID);
    expect(result.rows[0]?.attentionTypeLabel).toBe("No recent progress");
    expect(result.rows[0]?.customerLabel).toBe("Acme Corp");
    expect(result.capabilities.canViewArchivedItems).toBe(false);
    expect(result.sort).toEqual({
      field: "last_detected_at",
      direction: "desc",
    });
    expect(ATTENTION_NAV_VISIBLE).toBe(false);
  });

  it("returns empty success without inventing items", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    listMock.mockResolvedValue({
      ok: true,
      data: {
        items: [],
        pagination: {
          page: 1,
          pageSize: 25,
          total: 0,
          totalPages: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
    });

    const result = await loadAttentionListPage(createSupabase(), {
      org: ORG_ID,
    });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.rows).toEqual([]);
    expect(result.list.pagination.total).toBe(0);
  });

  it("maps list application errors to safe query_error copy", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("staff"));
    listMock.mockResolvedValue({
      ok: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Service temporarily unavailable.",
        retryable: true,
        category: "server",
        cause: "secret-db-detail",
      },
    });

    const result = await loadAttentionListPage(createSupabase(), {
      org: ORG_ID,
    });
    expect(result.kind).toBe("query_error");
    if (result.kind !== "query_error") return;
    expect(result.message).not.toContain("secret-db-detail");
    expect(result.retryable).toBe(true);
  });
});
