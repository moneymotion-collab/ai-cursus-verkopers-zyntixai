import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  ProjectPageContext,
  ProjectRecord,
} from "@/features/projects/domain/types";
import {
  loadProjectCreatePage,
  loadProjectDetailPage,
  loadProjectEditPage,
  loadProjectsPage,
} from "@/features/projects/ui/load-project-pages";
import {
  getProject,
  listProjects,
  listProjectTasks,
  loadProjectFormOptions,
} from "@/features/projects/server/project-queries";
import { resolveProjectPageContext } from "@/features/projects/server/resolve-project-page-context";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";

vi.mock("@/features/projects/server/resolve-project-page-context", () => ({
  resolveProjectPageContext: vi.fn(),
}));

vi.mock("@/features/projects/server/project-queries", () => ({
  getProject: vi.fn(),
  listProjects: vi.fn(),
  listProjectTasks: vi.fn(),
  loadProjectFormOptions: vi.fn(),
}));

const resolveContextMock = vi.mocked(resolveProjectPageContext);
const listProjectsMock = vi.mocked(listProjects);
const getProjectMock = vi.mocked(getProject);
const listTasksMock = vi.mocked(listProjectTasks);
const formOptionsMock = vi.mocked(loadProjectFormOptions);

const moduleAccess: ProjectPageContext["moduleAccess"] = {
  resolution: "resolved",
  navVisibility: {
    home: true,
    leads: true,
    customers: true,
    projects: true,
    sites: false,
    workOrders: false,
    dispatch: false,
    programs: false,
    enrollments: false,
    progress: false,
    attention: true,
    tasks: true,
    members: true,
  },
  relevantCapabilities: [],
  terminology: {
    customer: { singular: "Client", plural: "Clients" },
    project: { singular: "Project", plural: "Projects" },
    site: { singular: "Site", plural: "Sites" },
    workOrder: { singular: "Work order", plural: "Work orders" },
    technician: { singular: "Technician", plural: "Technicians" },
  },
};

function readyContext(role: ProjectPageContext["role"] = "staff"): ProjectPageContext {
  return {
    organizationId: ORG_ID,
    organizationName: "Service Org",
    organizationOptions: [
      { organizationId: ORG_ID, role, displayName: "Service Org" },
    ],
    role,
    terminology: moduleAccess.terminology,
    moduleAccess,
  };
}

const project: ProjectRecord = {
  id: PROJECT_ID,
  organizationId: ORG_ID,
  customerId: "33333333-3333-4333-8333-333333333333",
  customerLabel: "Acme",
  name: "Launch",
  summary: null,
  status: "active",
  ownerMemberId: null,
  ownerLabel: null,
  plannedStart: null,
  plannedEnd: null,
  archivedAt: null,
  createdAt: "2026-09-05T10:00:00.000Z",
  updatedAt: "2026-09-05T10:00:00.000Z",
};

function supabase() {
  return {} as SupabaseClient<Database>;
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveContextMock.mockResolvedValue({ kind: "ready", context: readyContext() });
  listProjectsMock.mockResolvedValue({ data: [project], error: null });
  getProjectMock.mockResolvedValue({ data: project, error: null });
  listTasksMock.mockResolvedValue({ data: [], error: null });
  formOptionsMock.mockResolvedValue({ customers: [], members: [], warning: null });
});

describe("Project page loaders", () => {
  it.each(["auth_required", "organization_unavailable"] as const)(
    "gates list reads when context is %s",
    async (kind) => {
      resolveContextMock.mockResolvedValueOnce({ kind });

      expect(await loadProjectsPage(supabase(), { org: ORG_ID })).toEqual({ kind });
      expect(listProjectsMock).not.toHaveBeenCalled();
    },
  );

  it("gates all feature reads when module access is forbidden", async () => {
    resolveContextMock.mockResolvedValue({
      kind: "forbidden",
      message: "Projects are not available.",
      moduleAccess,
    });

    await loadProjectsPage(supabase(), { org: ORG_ID });
    await loadProjectDetailPage(supabase(), PROJECT_ID, { org: ORG_ID });
    await loadProjectCreatePage(supabase(), { org: ORG_ID });
    await loadProjectEditPage(supabase(), PROJECT_ID, { org: ORG_ID });

    expect(listProjectsMock).not.toHaveBeenCalled();
    expect(getProjectMock).not.toHaveBeenCalled();
    expect(listTasksMock).not.toHaveBeenCalled();
    expect(formOptionsMock).not.toHaveBeenCalled();
  });

  it("sanitizes list filters and prevents archived reads for staff", async () => {
    const result = await loadProjectsPage(supabase(), {
      org: ORG_ID,
      q: ["  launch  ", "ignored"],
      status: "unknown",
      archived: "1",
    });

    expect(result.kind).toBe("ready");
    expect(listProjectsMock).toHaveBeenCalledWith(supabase(), ORG_ID, "staff", {
      search: "launch",
      status: undefined,
      archived: false,
    });
  });

  it("validates detail IDs after context and before Project reads", async () => {
    const result = await loadProjectDetailPage(supabase(), "not-a-uuid", {
      org: ORG_ID,
    });

    expect(resolveContextMock).toHaveBeenCalledOnce();
    expect(result.kind).toBe("unavailable");
    expect(getProjectMock).not.toHaveBeenCalled();
    expect(listTasksMock).not.toHaveBeenCalled();
  });

  it("loads related tasks only after an accessible Project is found", async () => {
    getProjectMock.mockResolvedValueOnce({ data: null, error: null });
    const unavailable = await loadProjectDetailPage(supabase(), PROJECT_ID, {
      org: ORG_ID,
    });
    expect(unavailable.kind).toBe("unavailable");
    expect(listTasksMock).not.toHaveBeenCalled();

    getProjectMock.mockResolvedValueOnce({ data: project, error: null });
    await loadProjectDetailPage(supabase(), PROJECT_ID, { org: ORG_ID });
    expect(listTasksMock).toHaveBeenCalledWith(supabase(), ORG_ID, PROJECT_ID);
  });

  it("checks role permission before reading create-form options", async () => {
    resolveContextMock.mockResolvedValueOnce({
      kind: "ready",
      context: readyContext("viewer"),
    });

    const result = await loadProjectCreatePage(supabase(), { org: ORG_ID });
    expect(result.kind).toBe("action_unavailable");
    expect(formOptionsMock).not.toHaveBeenCalled();
  });

  it("does not read edit options for archived Projects", async () => {
    resolveContextMock.mockResolvedValueOnce({
      kind: "ready",
      context: readyContext("owner"),
    });
    getProjectMock.mockResolvedValueOnce({
      data: { ...project, archivedAt: "2026-09-05T12:00:00.000Z" },
      error: null,
    });

    const result = await loadProjectEditPage(supabase(), PROJECT_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("action_unavailable");
    expect(formOptionsMock).not.toHaveBeenCalled();
  });
});
