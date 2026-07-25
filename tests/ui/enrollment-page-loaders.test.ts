import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadEnrollmentsPage } from "@/features/enrollments/ui/load-enrollments-page";
import { loadEnrollmentDetailPage } from "@/features/enrollments/ui/load-enrollment-detail-page";
import { loadEnrollmentCreatePage } from "@/features/enrollments/ui/load-enrollment-create-page";
import { resolveEnrollmentPageOrganization } from "@/features/enrollments/server/resolve-enrollment-page-organization";
import {
  loadEnrollmentDetailFoundation,
  loadEnrollmentsListFoundation,
} from "@/features/enrollments/server/load-enrollment-foundations";
import { resolveMemberLabels } from "@/features/enrollments/server/resolve-enrollment-labels";
import { loadEnrollmentCreateOptions } from "@/features/enrollments/server/load-enrollment-create-options";
import {
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  sampleEnrollmentDetail,
  sampleEnrollmentHistory,
  sampleEnrollmentListItem,
} from "../helpers/enrollment-test-fixtures";

vi.mock("@/features/enrollments/server/resolve-enrollment-page-organization", () => ({
  resolveEnrollmentPageOrganization: vi.fn(),
}));

vi.mock("@/features/enrollments/server/load-enrollment-foundations", () => ({
  loadEnrollmentsListFoundation: vi.fn(),
  loadEnrollmentDetailFoundation: vi.fn(),
}));

vi.mock("@/features/enrollments/server/resolve-enrollment-labels", () => ({
  resolveMemberLabels: vi.fn(),
  resolveMemberLabel: (memberId: string | null | undefined, labels: Record<string, string>) => {
    if (!memberId) return "Unassigned";
    return labels[memberId] ?? "Unavailable member";
  },
}));

vi.mock("@/features/enrollments/server/load-enrollment-create-options", () => ({
  loadEnrollmentCreateOptions: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveEnrollmentPageOrganization);
const listFoundationMock = vi.mocked(loadEnrollmentsListFoundation);
const detailFoundationMock = vi.mocked(loadEnrollmentDetailFoundation);
const resolveMemberLabelsMock = vi.mocked(resolveMemberLabels);
const createOptionsMock = vi.mocked(loadEnrollmentCreateOptions);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

function readyOrg(role: "owner" | "admin" | "staff" | "viewer" = "owner") {
  return {
    kind: "ready" as const,
    organizationId: ORG_ID,
    organizationName: "Acme",
    organizationOptions: [
      {
        organizationId: ORG_ID,
        displayName: "Acme",
        role,
      },
    ],
    role,
    timezone: "Europe/Amsterdam",
    isMultiOrganization: false,
  };
}

function fullPermissions(overrides: Partial<Record<string, boolean>> = {}) {
  return {
    canListEnrollments: true,
    canViewEnrollment: true,
    canViewArchivedEnrollments: true,
    canCreateEnrollment: true,
    canUpdateOwnerOrMetadata: true,
    canTransitionEnrollmentStatus: true,
    canArchiveEnrollment: true,
    canRestoreEnrollment: false,
    canViewEnrollmentHistory: true,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue(readyOrg("owner"));
  resolveMemberLabelsMock.mockResolvedValue({ [MEMBER_ID]: "Jordan Lee" });
});

describe("loadEnrollmentsPage", () => {
  it("returns populated list for owner with capabilities and owner labels", async () => {
    listFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "owner",
        capabilities: fullPermissions(),
        filters: { includeArchived: false },
        sort: { field: "enrolled_at", direction: "desc" },
        result: {
          items: [sampleEnrollmentListItem],
          pagination: {
            page: 1,
            pageSize: 25,
            total: 1,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        },
      },
    });

    const result = await loadEnrollmentsPage(createSupabase(), { q: " acme " });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.list.items).toHaveLength(1);
    expect(result.capabilities.canCreateEnrollment).toBe(true);
    expect(result.urlState.q).toBe("acme");
    expect(result.ownerLabels[MEMBER_ID]).toBe("Jordan Lee");
    expect(listFoundationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG_ID,
        role: "owner",
        filters: expect.objectContaining({ search: "acme" }),
      }),
    );
  });

  it("returns auth_required without calling list foundation", async () => {
    pageOrgMock.mockResolvedValueOnce({ kind: "auth_required" });
    const result = await loadEnrollmentsPage(createSupabase(), {});
    expect(result.kind).toBe("auth_required");
    expect(listFoundationMock).not.toHaveBeenCalled();
  });

  it("surfaces adapter query errors safely", async () => {
    listFoundationMock.mockResolvedValue({
      ok: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "Unable to load enrollments.",
        retryable: true,
        category: "server",
      },
    });

    const result = await loadEnrollmentsPage(createSupabase(), {});
    expect(result.kind).toBe("query_error");
    if (result.kind !== "query_error") return;
    expect(result.message).toBe("Unable to load enrollments.");
    expect(result.retryable).toBe(true);
  });

  it("does not trust browser organization authority beyond membership resolution", async () => {
    pageOrgMock.mockResolvedValueOnce(readyOrg("staff"));
    listFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "staff",
        capabilities: fullPermissions({
          canViewArchivedEnrollments: false,
          canArchiveEnrollment: false,
        }),
        filters: { includeArchived: false },
        sort: { field: "enrolled_at", direction: "desc" },
        result: {
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
      },
    });

    const result = await loadEnrollmentsPage(createSupabase(), {
      org: ORG_ID,
      archived: "true",
    });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.urlState.archived).toBe(false);
    expect(result.filterWarning).toContain("filters were reset");
  });
});

describe("loadEnrollmentCreatePage", () => {
  beforeEach(() => {
    createOptionsMock.mockResolvedValue({
      customers: [],
      programs: [],
      members: [],
      capped: { customers: false, programs: false, members: false },
    });
  });

  it("allows owner create and loads options", async () => {
    const result = await loadEnrollmentCreatePage(createSupabase(), {});
    expect(result.kind).toBe("ready");
    expect(createOptionsMock).toHaveBeenCalledWith(expect.anything(), ORG_ID);
  });

  it("allows staff create at page loader (staff may create enrollments)", async () => {
    pageOrgMock.mockResolvedValueOnce(readyOrg("staff"));
    const result = await loadEnrollmentCreatePage(createSupabase(), {});
    expect(result.kind).toBe("ready");
  });

  it("denies viewer create at page loader", async () => {
    pageOrgMock.mockResolvedValueOnce(readyOrg("viewer"));
    const result = await loadEnrollmentCreatePage(createSupabase(), {});
    expect(result.kind).toBe("action_unavailable");
  });

  it("surfaces eligible options and capped flags", async () => {
    createOptionsMock.mockResolvedValueOnce({
      customers: [{ value: "c1", label: "Acme", status: "active" }],
      programs: [{ value: "p1", label: "Growth Lab" }],
      members: [{ value: "m1", label: "Jordan Lee" }],
      capped: { customers: true, programs: false, members: false },
    });

    const result = await loadEnrollmentCreatePage(createSupabase(), {});
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.customers).toHaveLength(1);
    expect(result.programs).toHaveLength(1);
    expect(result.members).toHaveLength(1);
    expect(result.optionsCapped.customers).toBe(true);
  });
});

describe("loadEnrollmentDetailPage", () => {
  it("returns ready detail with history and resolved labels", async () => {
    detailFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "owner",
        capabilities: fullPermissions(),
        enrollment: sampleEnrollmentDetail,
        history: [sampleEnrollmentHistory],
        historyState: { kind: "ready" },
      },
    });

    const result = await loadEnrollmentDetailPage(createSupabase(), ENROLLMENT_ID, {});
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.data.customerLabel).toBe("Acme Corp");
    expect(result.data.programLabel).toBe("Growth Lab");
    expect(result.data.ownerLabel).toBe("Jordan Lee");
    expect(result.data.sourceLabel).toBe("Manual");
    expect(result.data.history).toHaveLength(1);
    expect(result.data.historyState.kind).toBe("ready");
    expect(result.data.customerHref).toContain("/customers/");
    expect(result.data.programHref).toContain("/programs/");
  });

  it("maps unavailable and invalid ids to enrollment_unavailable without leaking tenant existence", async () => {
    const invalid = await loadEnrollmentDetailPage(createSupabase(), "not-a-uuid", {});
    expect(invalid.kind).toBe("enrollment_unavailable");
    expect(detailFoundationMock).not.toHaveBeenCalled();

    detailFoundationMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "ENROLLMENT_UNAVAILABLE",
        message: "This enrollment is unavailable.",
        retryable: false,
        category: "not_found",
      },
    });
    const missing = await loadEnrollmentDetailPage(createSupabase(), ENROLLMENT_ID, {});
    expect(missing.kind).toBe("enrollment_unavailable");
  });

  it("preserves recoverable history error state", async () => {
    detailFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "admin",
        capabilities: fullPermissions(),
        enrollment: sampleEnrollmentDetail,
        history: [],
        historyState: {
          kind: "error",
          message: "Unable to load enrollment history.",
        },
      },
    });

    const result = await loadEnrollmentDetailPage(createSupabase(), ENROLLMENT_ID, {});
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.data.historyState.kind).toBe("error");
  });
});
