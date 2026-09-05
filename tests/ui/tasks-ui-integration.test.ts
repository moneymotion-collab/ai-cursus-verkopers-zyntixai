import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadTasksPage } from "@/features/tasks/ui/load-tasks-page";
import { loadTaskCreatePage } from "@/features/tasks/ui/load-task-workflow-page";
import { loadTaskEditPage } from "@/features/tasks/ui/load-task-workflow-page";
import { listTasks, getTaskById } from "@/features/tasks/server/task-read-queries";
import { loadTaskMemberFilterOptions } from "@/features/tasks/ui/load-task-form-options";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import { mockKnowledgeProductModuleAccess } from "../features/product-access/module-access-fixtures";

const ORG_A = "02016e91-7237-4a20-aec3-6275d2e8a67f";
const ORG_B = "e6e4c376-697c-4863-bb30-fd52b7256ff9";

vi.mock("@/features/tasks/ui/resolve-task-page-organization", () => ({
  resolveTaskPageOrganization: vi.fn(),
}));

vi.mock("@/features/tasks/server/task-read-queries", () => ({
  listTasks: vi.fn(),
  getTaskById: vi.fn(),
  getTaskStatusHistory: vi.fn(),
}));

vi.mock("@/features/tasks/ui/load-task-form-options", () => ({
  loadTaskFormOptions: vi.fn(async () => ({
    leads: [{ value: "44444444-4444-4444-8444-444444444444", label: "Lead" }],
    customers: [],
    enrollments: [],
    members: [],
    capped: { leads: false, customers: false, enrollments: false, members: false },
  })),
  loadTaskMemberFilterOptions: vi.fn(async () => []),
}));

vi.mock("@/features/tasks/ui/resolve-task-display-labels", () => ({
  collectLabelReferencesFromListItems: vi.fn(() => ({
    memberIds: [],
    leadIds: [],
    customerIds: [],
    programIds: [],
  })),
  emptyLabelBundle: vi.fn(() => ({ members: {}, leads: {}, customers: {}, programs: {} })),
  resolveTaskDisplayLabels: vi.fn(async () => ({
    members: {},
    leads: {},
    customers: {},
    programs: {},
  })),
}));

const pageOrgMock = vi.mocked(resolveTaskPageOrganization);
const listTasksMock = vi.mocked(listTasks);
const getTaskByIdMock = vi.mocked(getTaskById);
const memberOptionsMock = vi.mocked(loadTaskMemberFilterOptions);

const organizationOptions = [
  { organizationId: ORG_A, role: "staff" as const, displayName: "Org Alpha" },
  { organizationId: ORG_B, role: "owner" as const, displayName: "Org Beta" },
];

function createSupabase() {
  return {} as SupabaseClient<Database>;
}

function readyOrg(role: "owner" | "admin" | "staff" | "viewer" = "staff") {
  return {
    kind: "ready" as const,
    organizationId: ORG_A,
    organizationOptions,
    role,
    timeZone: "UTC",
    moduleAccess: mockKnowledgeProductModuleAccess(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue(readyOrg("staff"));
  listTasksMock.mockResolvedValue({
    ok: true,
    data: {
      items: [],
      pagination: {
        page: 1,
        pageSize: 25,
        totalCount: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    },
  });
});

describe("tasks UI multi-organization integration", () => {
  it("suppresses all feature reads when the shared Tasks route gate denies access", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "org_context_missing",
      message: "This area is not available for your organization.",
    });

    const result = await loadTasksPage(createSupabase(), { org: ORG_A });

    expect(result).toEqual({
      kind: "org_context_missing",
      message: "This area is not available for your organization.",
    });
    expect(memberOptionsMock).not.toHaveBeenCalled();
    expect(listTasksMock).not.toHaveBeenCalled();
  });

  it("suppresses list and member-option queries when organization selection is required", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: organizationOptions,
    });
    const result = await loadTasksPage(createSupabase(), {});
    expect(result.kind).toBe("organization_required");
    expect(listTasksMock).not.toHaveBeenCalled();
    expect(memberOptionsMock).not.toHaveBeenCalled();
  });

  it("suppresses create form-option loading when organization selection is required", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: organizationOptions,
    });
    const result = await loadTaskCreatePage(createSupabase(), {});
    expect(result.kind).toBe("organization_required");
  });

  it("suppresses edit workflow task query when organization selection is required", async () => {
    pageOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: organizationOptions,
    });
    const result = await loadTaskEditPage(
      createSupabase(),
      "11111111-1111-4111-8111-111111111111",
      {},
    );
    expect(result.kind).toBe("organization_required");
    expect(getTaskByIdMock).not.toHaveBeenCalled();
  });
});
