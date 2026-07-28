import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadProgressListPage } from "@/features/progress/ui/load-progress-list-page";
import { loadProgressDetailPage } from "@/features/progress/ui/load-progress-detail-page";
import { resolveProgressPageOrganization } from "@/features/progress/server/resolve-progress-page-organization";
import {
  loadProgressDetailFoundation,
  loadProgressListFoundation,
} from "@/features/progress/server/load-progress-foundations";
import { resolveMemberLabels } from "@/features/enrollments/server/resolve-enrollment-labels";
import {
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  PROGRESS_FACT_ID,
  sampleProgressFactDetailRow,
  sampleProgressFactListRow,
} from "../helpers/progress-test-fixtures";
import {
  mapProgressFactDetail,
  mapProgressFactListItem,
} from "@/features/progress/server/map-progress-read-model";
import { resolveProgressPermissions } from "@/features/progress/domain/permissions";

vi.mock("@/features/progress/server/resolve-progress-page-organization", () => ({
  resolveProgressPageOrganization: vi.fn(),
}));

vi.mock("@/features/progress/server/load-progress-foundations", () => ({
  loadProgressListFoundation: vi.fn(),
  loadProgressDetailFoundation: vi.fn(),
}));

vi.mock("@/features/enrollments/server/resolve-enrollment-labels", () => ({
  resolveMemberLabels: vi.fn(),
  resolveMemberLabel: (memberId: string | null | undefined, labels: Record<string, string>) => {
    if (!memberId) return "Unassigned";
    return labels[memberId] ?? "Unavailable member";
  },
}));

const pageOrgMock = vi.mocked(resolveProgressPageOrganization);
const listFoundationMock = vi.mocked(loadProgressListFoundation);
const detailFoundationMock = vi.mocked(loadProgressDetailFoundation);
const resolveMemberLabelsMock = vi.mocked(resolveMemberLabels);

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

const sampleListItem = mapProgressFactListItem(sampleProgressFactListRow, {
  customerDisplayName: "Acme Corp",
  programName: "Growth Lab",
});

const sampleDetail = mapProgressFactDetail(sampleProgressFactDetailRow, {
  enrollment: {
    id: ENROLLMENT_ID,
    status: "active",
    archivedAt: null,
    customerId: CUSTOMER_ID,
    programId: PROGRAM_ID,
  },
  customer: {
    id: CUSTOMER_ID,
    displayName: "Acme Corp",
    status: "active",
    archivedAt: null,
  },
  program: {
    id: PROGRAM_ID,
    name: "Growth Lab",
    status: "active",
    archivedAt: null,
  },
});

describe("progress page loaders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveMemberLabelsMock.mockResolvedValue({ [MEMBER_ID]: "Team member" });
  });

  it("returns auth_required when organization resolver requires auth", async () => {
    pageOrgMock.mockResolvedValue({ kind: "auth_required" });
    const result = await loadProgressListPage(createSupabase(), {});
    expect(result.kind).toBe("auth_required");
  });

  it("loads list success with recorder labels and default voided excluded", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    listFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "owner",
        capabilities: resolveProgressPermissions("owner"),
        filters: { includeVoided: false },
        sort: { field: "occurred_at", direction: "desc" },
        result: {
          items: [sampleListItem],
          pagination: {
            page: 1,
            pageSize: 25,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      },
    });

    const result = await loadProgressListPage(createSupabase(), { org: ORG_ID });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.list.items).toHaveLength(1);
    expect(result.recorderLabels[MEMBER_ID]).toBe("Team member");
    expect(result.urlState.includeVoided).toBe(false);
    expect(listFoundationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG_ID,
        role: "owner",
        filters: expect.objectContaining({ includeVoided: false }),
      }),
    );
  });

  it("strips includeVoided for staff before calling foundation", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("staff"));
    listFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "staff",
        capabilities: resolveProgressPermissions("staff"),
        filters: { includeVoided: false },
        sort: { field: "occurred_at", direction: "desc" },
        result: {
          items: [],
          pagination: {
            page: 1,
            pageSize: 25,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      },
    });

    await loadProgressListPage(createSupabase(), {
      org: ORG_ID,
      includeVoided: "true",
    });

    expect(listFoundationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ includeVoided: false }),
      }),
    );
  });

  it("maps unavailable detail for missing or denied facts", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    detailFoundationMock.mockResolvedValue({
      ok: false,
      error: {
        code: "PROGRESS_FACT_UNAVAILABLE",
        message: "Progress fact unavailable.",
        retryable: false,
        category: "not_found",
      },
    });

    const result = await loadProgressDetailPage(
      createSupabase(),
      PROGRESS_FACT_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("progress_unavailable");
  });

  it("loads detail success with safe labels and related links", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    detailFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "owner",
        capabilities: resolveProgressPermissions("owner"),
        fact: sampleDetail,
      },
    });

    const result = await loadProgressDetailPage(
      createSupabase(),
      PROGRESS_FACT_ID,
      { org: ORG_ID },
    );
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.data.customerLabel).toBe("Acme Corp");
    expect(result.data.programLabel).toBe("Growth Lab");
    expect(result.data.recorderLabel).toBe("Team member");
    expect(result.data.customerHref).toContain(`/customers/${CUSTOMER_ID}`);
    expect(result.data.programHref).toContain(`/programs/${PROGRAM_ID}`);
    expect(result.data.enrollmentHref).toContain(`/enrollments/${ENROLLMENT_ID}`);
  });

  it("treats invalid fact ids as unavailable without foundation call", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    const result = await loadProgressDetailPage(createSupabase(), "not-a-uuid", {
      org: ORG_ID,
    });
    expect(result.kind).toBe("progress_unavailable");
    expect(detailFoundationMock).not.toHaveBeenCalled();
  });
});
