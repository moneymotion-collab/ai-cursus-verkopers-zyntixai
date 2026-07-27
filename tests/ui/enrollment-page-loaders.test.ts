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
import { resolveEnrollmentListContext } from "@/features/enrollments/server/resolve-enrollment-list-context";
import {
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
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

vi.mock("@/features/enrollments/server/resolve-enrollment-list-context", () => ({
  resolveEnrollmentListContext: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveEnrollmentPageOrganization);
const listFoundationMock = vi.mocked(loadEnrollmentsListFoundation);
const detailFoundationMock = vi.mocked(loadEnrollmentDetailFoundation);
const resolveMemberLabelsMock = vi.mocked(resolveMemberLabels);
const createOptionsMock = vi.mocked(loadEnrollmentCreateOptions);
const listContextMock = vi.mocked(resolveEnrollmentListContext);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

/** Fakes the `enrollments` duplicate-open-enrollment lookup used by loadEnrollmentCreatePage. */
function createSupabaseWithEnrollmentsQuery(result: { data: Array<{ id: string }> | null }) {
  const limit = vi.fn().mockResolvedValue(result);
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnValue({ limit }),
  };
  return {
    from: vi.fn().mockReturnValue(chain),
  } as unknown as SupabaseClient<Database>;
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
  listContextMock.mockResolvedValue({ kind: "ok" });
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

describe("loadEnrollmentsPage — Customer/Program contextual navigation (B1.5.9)", () => {
  function emptyListResult() {
    return {
      ok: true as const,
      data: {
        organizationId: ORG_ID,
        role: "owner" as const,
        capabilities: fullPermissions(),
        filters: { includeArchived: false },
        sort: { field: "enrolled_at" as const, direction: "desc" as const },
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
    };
  }

  it("does not resolve context when customerId/programId are absent", async () => {
    listFoundationMock.mockResolvedValue(emptyListResult());
    const result = await loadEnrollmentsPage(createSupabase(), {});
    expect(result.kind).toBe("success");
    expect(listContextMock).not.toHaveBeenCalled();
    if (result.kind === "success") {
      expect(result.context).toBeNull();
    }
  });

  it("returns success with resolved labels when the context is ok", async () => {
    listContextMock.mockResolvedValueOnce({
      kind: "ok",
      customerLabel: "Acme Corp",
      programLabel: "Growth Lab",
    });
    listFoundationMock.mockResolvedValue(emptyListResult());

    const result = await loadEnrollmentsPage(createSupabase(), {
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    });

    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.context).toEqual({
      customerLabel: "Acme Corp",
      programLabel: "Growth Lab",
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    });
    expect(listFoundationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ customerId: CUSTOMER_ID, programId: PROGRAM_ID }),
      }),
    );
  });

  it("returns context_unavailable with a generic message and a context-free backHref, without querying the list", async () => {
    listContextMock.mockResolvedValueOnce({ kind: "unavailable" });

    const result = await loadEnrollmentsPage(createSupabase(), { customerId: CUSTOMER_ID });

    expect(result.kind).toBe("context_unavailable");
    expect(listFoundationMock).not.toHaveBeenCalled();
    if (result.kind !== "context_unavailable") return;
    expect(result.message).toBe(
      "This enrollment context is unavailable. It may have been removed or you may not have access.",
    );
    expect(result.backHref).toBe(`/enrollments?org=${ORG_ID}`);
  });

  it("does not leak whether an unavailable id was missing vs. belonging to another organization", async () => {
    listContextMock.mockResolvedValueOnce({ kind: "unavailable" });
    const forOtherOrgId = await loadEnrollmentsPage(createSupabase(), {
      customerId: CUSTOMER_ID,
    });

    listContextMock.mockResolvedValueOnce({ kind: "unavailable" });
    const forMissingId = await loadEnrollmentsPage(createSupabase(), {
      customerId: PROGRAM_ID,
    });

    expect(forOtherOrgId).toEqual(forMissingId);
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

  describe("Customer/Program contextual preselection (B1.5.9)", () => {
    beforeEach(() => {
      createOptionsMock.mockResolvedValue({
        customers: [{ value: CUSTOMER_ID, label: "Acme Corp", status: "active" }],
        programs: [{ value: PROGRAM_ID, label: "Growth Lab" }],
        members: [],
        capped: { customers: false, programs: false, members: false },
      });
    });

    it("sets initialCustomerId/initialProgramId when the raw ids match loaded options", async () => {
      const result = await loadEnrollmentCreatePage(
        createSupabaseWithEnrollmentsQuery({ data: [] }),
        { customerId: CUSTOMER_ID, programId: PROGRAM_ID },
      );

      expect(result.kind).toBe("ready");
      if (result.kind !== "ready") return;
      expect(result.initialCustomerId).toBe(CUSTOMER_ID);
      expect(result.initialProgramId).toBe(PROGRAM_ID);
      expect(result.contextNotice).toBeUndefined();
    });

    it("sets a contextNotice and no preselection when the raw customerId is not an eligible option", async () => {
      const foreignId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
      const result = await loadEnrollmentCreatePage(
        createSupabaseWithEnrollmentsQuery({ data: [] }),
        { customerId: foreignId },
      );

      expect(result.kind).toBe("ready");
      if (result.kind !== "ready") return;
      expect(result.initialCustomerId).toBeUndefined();
      expect(result.contextNotice).toBe(
        "The selected customer or program is unavailable for enrollment.",
      );
    });

    it("sets a contextNotice and no preselection when the raw programId is not an eligible option", async () => {
      const foreignId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
      const result = await loadEnrollmentCreatePage(
        createSupabaseWithEnrollmentsQuery({ data: [] }),
        { programId: foreignId },
      );

      expect(result.kind).toBe("ready");
      if (result.kind !== "ready") return;
      expect(result.initialProgramId).toBeUndefined();
      expect(result.contextNotice).toBe(
        "The selected customer or program is unavailable for enrollment.",
      );
    });

    it("does not run the duplicate-open-enrollment check unless both customer and program are preselected", async () => {
      const supabase = createSupabaseWithEnrollmentsQuery({ data: [] });
      const result = await loadEnrollmentCreatePage(supabase, { customerId: CUSTOMER_ID });

      expect(result.kind).toBe("ready");
      if (result.kind !== "ready") return;
      expect(result.duplicateOpenNotice).toBeUndefined();
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it("sets duplicateOpenNotice when both are preselected and an open enrollment already exists", async () => {
      const result = await loadEnrollmentCreatePage(
        createSupabaseWithEnrollmentsQuery({ data: [{ id: ENROLLMENT_ID }] }),
        { customerId: CUSTOMER_ID, programId: PROGRAM_ID },
      );

      expect(result.kind).toBe("ready");
      if (result.kind !== "ready") return;
      expect(result.duplicateOpenNotice).toBe(
        "An open enrollment already exists for this customer and program.",
      );
    });

    it("does not set duplicateOpenNotice when both are preselected and no open enrollment exists", async () => {
      const result = await loadEnrollmentCreatePage(
        createSupabaseWithEnrollmentsQuery({ data: [] }),
        { customerId: CUSTOMER_ID, programId: PROGRAM_ID },
      );

      expect(result.kind).toBe("ready");
      if (result.kind !== "ready") return;
      expect(result.duplicateOpenNotice).toBeUndefined();
    });
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
