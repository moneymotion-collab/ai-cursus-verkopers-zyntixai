import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadDailyOperatingPage } from "@/features/daily-operating/server/load-daily-operating-page";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { listAttentionItems } from "@/features/attention/server/attention-read-queries";
import { listTasks } from "@/features/tasks/server/task-read-queries";

vi.mock("@/features/tasks/ui/resolve-task-page-organization", () => ({
  resolveTaskPageOrganization: vi.fn(),
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

vi.mock("@/features/attention/server/attention-read-queries", () => ({
  listAttentionItems: vi.fn(),
}));

vi.mock("@/features/tasks/server/task-read-queries", () => ({
  listTasks: vi.fn(),
}));

const resolveOrgMock = vi.mocked(resolveTaskPageOrganization);
const resolveMembershipMock = vi.mocked(resolveOrganizationContext);
const listAttentionMock = vi.mocked(listAttentionItems);
const listTasksMock = vi.mocked(listTasks);

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "22222222-2222-4222-8222-222222222222";
const MEMBERSHIP = "33333333-3333-4333-8333-333333333333";
const USER = "44444444-4444-4444-8444-444444444444";

function supabase(): SupabaseClient<Database> {
  return {} as SupabaseClient<Database>;
}

function readyOrg(role: "owner" | "admin" | "staff" | "viewer") {
  return {
    kind: "ready" as const,
    organizationId: ORG,
    organizationOptions: [
      { organizationId: ORG, displayName: "Acme", role },
    ],
    role,
    timeZone: "Europe/Amsterdam",
  };
}

function membershipOk(role: "owner" | "admin" | "staff" | "viewer") {
  return {
    ok: true as const,
    context: {
      organizationId: ORG,
      membershipId: MEMBERSHIP,
      role,
      userId: USER,
    },
  };
}

function emptyAttention() {
  return {
    ok: true as const,
    data: {
      items: [],
      pagination: { page: 1, pageSize: 25, totalCount: 0, totalPages: 0 },
    },
  };
}

function emptyTasks() {
  return {
    ok: true as const,
    data: {
      items: [],
      pagination: { page: 1, pageSize: 5, totalCount: 0, totalPages: 0 },
    },
  };
}

describe("loadDailyOperatingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listAttentionMock.mockResolvedValue(emptyAttention() as never);
    listTasksMock.mockResolvedValue(emptyTasks() as never);
  });

  it("denies unauthenticated users", async () => {
    resolveOrgMock.mockResolvedValue({ kind: "auth_required" });
    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("auth_required");
    expect(listAttentionMock).not.toHaveBeenCalled();
    expect(listTasksMock).not.toHaveBeenCalled();
  });

  it("does not load domain data for inaccessible organization selection", async () => {
    resolveOrgMock.mockResolvedValue({
      kind: "org_context_missing",
      message: "Organization unavailable.",
    });
    const result = await loadDailyOperatingPage(supabase(), {
      org: OTHER_ORG,
    });
    expect(result.kind).toBe("org_context_missing");
    expect(listAttentionMock).not.toHaveBeenCalled();
    expect(listTasksMock).not.toHaveBeenCalled();
  });

  it("loads Owner composition for the resolved organization only", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;

    expect(result.selectedOrganizationId).toBe(ORG);
    expect(result.role).toBe("owner");
    expect(result.brief.organizationId).toBe(ORG);
    expect(listAttentionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG,
        filters: expect.objectContaining({
          status: ["open", "acknowledged"],
          includeArchived: false,
        }),
      }),
    );
    expect(listTasksMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG,
        filters: expect.objectContaining({
          status: "open",
          assigneeMemberId: MEMBERSHIP,
          dueState: "overdue",
        }),
      }),
    );
    expect(listTasksMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG,
        filters: expect.objectContaining({
          dueState: "due_today",
          assigneeMemberId: MEMBERSHIP,
        }),
      }),
    );
  });

  it("loads Admin composition with organization Attention visibility", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("admin"));
    resolveMembershipMock.mockResolvedValue(membershipOk("admin"));

    listAttentionMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: "a1",
            organizationId: ORG,
            title: "Critical",
            severity: "critical",
            status: "open",
            assigneeMemberId: null,
            sourceType: "enrollment",
            sourceEntityId: "e1",
            enrollmentId: "e1",
            customerId: "c1",
            programId: "p1",
            summary: null,
            acknowledgedAt: null,
            isAcknowledged: false,
            firstDetectedAt: "2026-08-19T10:00:00.000Z",
            lastDetectedAt: "2026-08-19T10:00:00.000Z",
            detectionCount: 1,
            createdAt: "2026-08-19T10:00:00.000Z",
            updatedAt: "2026-08-19T10:00:00.000Z",
            resolvedAt: null,
            dismissedAt: null,
            expiredAt: null,
            archivedAt: null,
            customerDisplayName: null,
            programName: null,
            assigneeDisplayName: null,
            primarySignalOrigin: "manual",
            primaryRuleKey: null,
            derived: {
              isAcknowledged: false,
              isArchived: false,
              isTerminal: false,
              isResolved: false,
              isDismissed: false,
              isExpired: false,
            },
          },
        ],
        pagination: { page: 1, pageSize: 25, totalCount: 1, totalPages: 1 },
      },
    } as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.organizationAttention.map((row) => row.id)).toEqual([
      "a1",
    ]);
  });

  it("does not elevate Staff into organization Attention via composition", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("staff"));
    resolveMembershipMock.mockResolvedValue(membershipOk("staff"));

    listAttentionMock.mockResolvedValue({
      ok: true,
      data: {
        items: [
          {
            id: "a1",
            organizationId: ORG,
            title: "Unassigned critical",
            severity: "critical",
            status: "open",
            assigneeMemberId: null,
            sourceType: "enrollment",
            sourceEntityId: "e1",
            enrollmentId: "e1",
            customerId: "c1",
            programId: "p1",
            summary: null,
            acknowledgedAt: null,
            isAcknowledged: false,
            firstDetectedAt: "2026-08-19T10:00:00.000Z",
            lastDetectedAt: "2026-08-19T10:00:00.000Z",
            detectionCount: 1,
            createdAt: "2026-08-19T10:00:00.000Z",
            updatedAt: "2026-08-19T10:00:00.000Z",
            resolvedAt: null,
            dismissedAt: null,
            expiredAt: null,
            archivedAt: null,
            customerDisplayName: null,
            programName: null,
            assigneeDisplayName: null,
            primarySignalOrigin: "manual",
            primaryRuleKey: null,
            derived: {
              isAcknowledged: false,
              isArchived: false,
              isTerminal: false,
              isResolved: false,
              isDismissed: false,
              isExpired: false,
            },
          },
        ],
        pagination: { page: 1, pageSize: 25, totalCount: 1, totalPages: 1 },
      },
    } as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.organizationAttention).toEqual([]);
    expect(result.brief.hasAnyActionable).toBe(false);
  });

  it("reports partial failure when Attention fails but Tasks succeed", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "boom" },
    } as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.attentionQueryFailed).toBe(true);
    expect(result.tasksQueryFailed).toBe(false);
  });

  it("reports full query error when Attention and Tasks both fail", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "boom" },
    } as never);
    listTasksMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "boom" },
    } as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("query_error");
  });

  it("ignores client org id and uses resolver-bound organizationId for reads", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));

    await loadDailyOperatingPage(supabase(), { org: OTHER_ORG });

    expect(resolveOrgMock).toHaveBeenCalledWith(expect.anything(), OTHER_ORG);
    expect(listAttentionMock).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG }),
    );
    expect(listTasksMock).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG }),
    );
  });
});
