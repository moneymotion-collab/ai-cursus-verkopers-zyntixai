import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadAttentionListPage } from "@/features/attention/ui/load-attention-list-page";
import { resolveAttentionPageOrganization } from "@/features/attention/server/resolve-attention-page-organization";
import { listAttentionItems } from "@/features/attention/server/attention-read-queries";
import { mapAttentionItemListItem } from "@/features/attention/server/map-attention-read-model";
import { ATTENTION_NAV_VISIBLE } from "@/features/attention/domain/attention-navigation";
import {
  ATTENTION_ITEM_ID,
  ORG_ID,
  sampleAttentionItemListRow,
} from "../helpers/attention-test-fixtures";
import { mockKnowledgeProductModuleAccess } from "../features/product-access/module-access-fixtures";

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
    moduleAccess: mockKnowledgeProductModuleAccess(),
  };
}

const sampleMapped = mapAttentionItemListItem(sampleAttentionItemListRow, {
  customerDisplayName: "Acme Corp",
  programName: "Growth Lab",
  primaryRuleKey: "enrollment_no_recent_progress",
  primarySignalOrigin: "rule",
});

describe("attention list page loader (B1.7.5-C)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps organization gate states without calling listAttentionItems", async () => {
    pageOrgMock.mockResolvedValue({ kind: "auth_required" });
    expect(await loadAttentionListPage(createSupabase(), {})).toEqual({
      kind: "auth_required",
    });
    expect(listMock).not.toHaveBeenCalled();
  });

  it("suppresses feature reads when the shared Attention route gate denies access", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "org_context_missing",
      message: "This area is not available for your organization.",
    });

    const result = await loadAttentionListPage(createSupabase(), { org: ORG_ID });

    expect(result).toEqual({
      kind: "org_context_missing",
      message: "This area is not available for your organization.",
    });
    expect(listMock).not.toHaveBeenCalled();
  });

  it("passes validated URL filters and last_detected_at default sort to listAttentionItems", async () => {
    expect(sampleMapped.ok).toBe(true);
    if (!sampleMapped.ok) return;

    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    listMock.mockResolvedValue({
      ok: true,
      data: {
        items: [sampleMapped.data],
        pagination: {
          page: 1,
          pageSize: 25,
          total: 1,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
    });

    const result = await loadAttentionListPage(createSupabase(), {
      org: ORG_ID,
      status: "open",
      page: "2",
    });

    expect(listMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: ORG_ID,
      filters: {
        includeArchived: false,
        status: "open",
      },
      pagination: {
        page: 2,
        pageSize: 25,
      },
      sort: {
        field: "last_detected_at",
        direction: "desc",
      },
    });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.urlState.status).toBe("open");
    expect(result.urlState.page).toBe(2);
    expect(result.rows[0]?.id).toBe(ATTENTION_ITEM_ID);
    expect(result.rows[0]?.detailHref).toContain(`/attention/${ATTENTION_ITEM_ID}`);
    expect(result.rows[0]?.detailHref).toContain(`org=${ORG_ID}`);
    expect(result.rows[0]?.detailHref).toContain("status=open");
    expect(result.rows[0]?.detailHref).toContain("page=2");
    expect(result.capabilities.canViewArchivedItems).toBe(false);
    expect(ATTENTION_NAV_VISIBLE).toBe(false);
    expect(result.moduleAccess.resolution).toBe("resolved");
    if (result.moduleAccess.resolution === "resolved") {
      expect(result.moduleAccess.navVisibility.attention).toBe(true);
    }
  });

  it("does not forward unauthorized archived filter", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("staff"));
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
      includeArchived: "true",
    });

    expect(listMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: { includeArchived: false },
      }),
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.filterWarning).toContain("owners and admins");
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
  });
});
