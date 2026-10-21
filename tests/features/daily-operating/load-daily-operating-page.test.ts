import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadDailyOperatingPage } from "@/features/daily-operating/server/load-daily-operating-page";
import {
  DAILY_OPERATING_SECTION_LIMIT,
  isDailyOperatingCalmState,
} from "@/features/daily-operating/domain/compose-daily-operating-brief";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { listAttentionItems } from "@/features/attention/server/attention-read-queries";
import { listTasks } from "@/features/tasks/server/task-read-queries";
import type { AttentionItemListItemReadModel } from "@/features/attention/domain/read-types";
import type { AttentionSeverity } from "@/features/attention/domain/types";
import type { TaskListItemReadModel } from "@/features/tasks/domain/read-types";
import {
  mockKnowledgeProductModuleAccess,
} from "../product-access/module-access-fixtures";
import {
  buildUnresolvedProductModuleAccess,
} from "@/features/product-access/domain/module-access";
import { PRODUCT_MODULE_BY_ID } from "@/features/product-access/domain/module-registry";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { buildOperatingModelProductModuleAccess } from "@/features/product-access/domain/operating-model-module-access";
import type { OperatingModelId } from "@/features/onboarding/domain/operating-model";

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
const OTHER_MEMBERSHIP = "55555555-5555-4555-8555-555555555555";
const USER = "44444444-4444-4444-8444-444444444444";
const FORMER_MIXED_ATTENTION_CAP = 25;

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
    moduleAccess: mockKnowledgeProductModuleAccess(),
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

function paddedUuid(n: number): string {
  return `aaaaaaaa-aaaa-4aaa-8aaa-${String(n).padStart(12, "0")}`;
}

function laterStamp(index: number): string {
  return new Date(Date.UTC(2026, 7, 20, 12, index, 0)).toISOString();
}

function attentionItem(
  overrides: Partial<AttentionItemListItemReadModel> &
    Pick<AttentionItemListItemReadModel, "id" | "severity" | "title">,
): AttentionItemListItemReadModel {
  return {
    organizationId: ORG,
    sourceType: "enrollment",
    sourceEntityId: "e1",
    enrollmentId: "e1",
    customerId: "c1",
    programId: "p1",
    projectId: null,
    taskId: null,
    summary: null,
    status: "open",
    assigneeMemberId: null,
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
    customerDisplayName: "Ada",
    programName: "Launch",
    projectName: null,
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
    ...overrides,
  };
}

function taskItem(
  overrides: Partial<TaskListItemReadModel> &
    Pick<TaskListItemReadModel, "id" | "title"> & {
      overdue?: boolean;
      dueToday?: boolean;
    },
): TaskListItemReadModel {
  const {
    overdue: overdueFlag,
    dueToday: dueTodayFlag,
    ...rest
  } = overrides;
  const overdue = overdueFlag ?? false;
  const dueToday = dueTodayFlag ?? false;
  return {
    organizationId: ORG,
    status: "open",
    taskType: "follow_up",
    priority: "normal",
    source: "manual",
    dueAt: "2026-08-19T12:00:00.000Z",
    assigneeMemberId: MEMBERSHIP,
    linkedContext: {
      kind: "lead",
      leadId: "l1",
    },
    archivedAt: null,
    createdAt: "2026-08-19T09:00:00.000Z",
    derived: {
      terminal: false,
      archived: false,
      overdue,
      dueToday,
      upcoming: !overdue && !dueToday,
      dueState: overdue ? "overdue" : dueToday ? "due_today" : "upcoming",
    },
    ...rest,
  };
}

function listAttentionFromPool(pool: AttentionItemListItemReadModel[]) {
  return async (params: {
    organizationId: string;
    filters?: {
      status?: string | string[];
      severity?: AttentionSeverity | AttentionSeverity[];
      assigneeMemberId?: string | null;
      includeArchived?: boolean;
    };
    pagination?: { page?: number; pageSize?: number };
  }) => {
    const filters = params.filters ?? {};
    const pageSize = params.pagination?.pageSize ?? FORMER_MIXED_ATTENTION_CAP;
    let items = pool.filter((item) => item.organizationId === params.organizationId);

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      items = items.filter((item) => statuses.includes(item.status));
    }
    if (filters.severity) {
      const severities = Array.isArray(filters.severity)
        ? filters.severity
        : [filters.severity];
      items = items.filter((item) => severities.includes(item.severity));
    }
    if (typeof filters.assigneeMemberId === "string") {
      items = items.filter(
        (item) => item.assigneeMemberId === filters.assigneeMemberId,
      );
    } else if (filters.assigneeMemberId === null) {
      items = items.filter((item) => item.assigneeMemberId === null);
    }
    if (filters.includeArchived === false) {
      items = items.filter((item) => !item.derived.isArchived);
    }

    items = [...items].sort((left, right) => {
      const detected = right.lastDetectedAt.localeCompare(left.lastDetectedAt);
      if (detected !== 0) {
        return detected;
      }
      return left.id.localeCompare(right.id);
    });

    return {
      ok: true as const,
      data: {
        items: items.slice(0, pageSize),
        pagination: {
          page: 1,
          pageSize,
          total: items.length,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };
  };
}

function listTasksFromPool(pool: TaskListItemReadModel[]) {
  return async (params: {
    organizationId: string;
    filters?: {
      status?: string | string[];
      includeArchived?: boolean;
      assigneeMemberId?: string;
      dueState?: string;
    };
    pagination?: { page?: number; pageSize?: number };
  }) => {
    const filters = params.filters ?? {};
    const pageSize = params.pagination?.pageSize ?? FORMER_MIXED_ATTENTION_CAP;
    let items = pool.filter((item) => item.organizationId === params.organizationId);

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status];
      items = items.filter((item) => statuses.includes(item.status));
    }
    if (filters.assigneeMemberId) {
      items = items.filter(
        (item) => item.assigneeMemberId === filters.assigneeMemberId,
      );
    }
    if (filters.includeArchived === false) {
      items = items.filter((item) => !item.derived.archived);
    }
    if (filters.dueState === "overdue") {
      items = items.filter((item) => item.derived.overdue);
    } else if (filters.dueState === "due_today") {
      items = items.filter((item) => item.derived.dueToday);
    } else if (filters.dueState === "upcoming") {
      items = items.filter((item) => item.derived.upcoming);
    }

    items = [...items].sort((left, right) => {
      const due = left.dueAt.localeCompare(right.dueAt);
      if (due !== 0) {
        return due;
      }
      const created = left.createdAt.localeCompare(right.createdAt);
      if (created !== 0) {
        return created;
      }
      return left.id.localeCompare(right.id);
    });

    return {
      ok: true as const,
      data: {
        items: items.slice(0, pageSize),
        pagination: {
          page: 1,
          pageSize,
          totalCount: items.length,
          totalPages: 1,
        },
      },
    };
  };
}

function formerMixedAttentionWindow(
  pool: AttentionItemListItemReadModel[],
): string[] {
  return [...pool]
    .sort((left, right) => {
      const detected = right.lastDetectedAt.localeCompare(left.lastDetectedAt);
      if (detected !== 0) {
        return detected;
      }
      return left.id.localeCompare(right.id);
    })
    .slice(0, FORMER_MIXED_ATTENTION_CAP)
    .map((item) => item.id);
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

    expect(resolveOrgMock).toHaveBeenCalledWith(
      expect.anything(),
      OTHER_ORG,
      "home",
    );
    expect(listAttentionMock).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG }),
    );
    expect(listTasksMock).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG }),
    );
  });

  it("does not load domain data when no membership exists", async () => {
    resolveOrgMock.mockResolvedValue({ kind: "organization_unavailable" });
    const result = await loadDailyOperatingPage(supabase(), {});
    expect(result.kind).toBe("no_organizations");
    expect(listAttentionMock).not.toHaveBeenCalled();
    expect(listTasksMock).not.toHaveBeenCalled();
  });

  it("keeps organization selection required for multiple memberships", async () => {
    resolveOrgMock.mockResolvedValue({
      kind: "organization_required",
      organizations: [
        { organizationId: ORG, displayName: "Acme", role: "owner" },
        { organizationId: OTHER_ORG, displayName: "Other", role: "staff" },
      ],
    });
    const result = await loadDailyOperatingPage(supabase(), {});
    expect(result.kind).toBe("organization_required");
    if (result.kind !== "organization_required") return;
    expect(result.organizations).toHaveLength(2);
    expect(listAttentionMock).not.toHaveBeenCalled();
    expect(listTasksMock).not.toHaveBeenCalled();
  });

  it("still composes Home when Tasks nav is hidden on the resolved payload", async () => {
    resolveOrgMock.mockResolvedValue({
      ...readyOrg("owner"),
      moduleAccess: buildUnresolvedProductModuleAccess(),
    });
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.moduleAccess.navVisibility.home).toBe(true);
    expect(result.moduleAccess.navVisibility.tasks).toBe(false);
    expect(listAttentionMock).toHaveBeenCalled();
    expect(listTasksMock).toHaveBeenCalled();
  });
});

describe("B1-C1-H1-ADMISSION Home module authority", () => {
  it("locks Home loader admission to existing moduleId home", () => {
    const daily = readFileSync(
      join(process.cwd(), "src/features/daily-operating/server/load-daily-operating-page.ts"),
      "utf8",
    );
    const resolver = readFileSync(
      join(process.cwd(), "src/features/tasks/ui/resolve-task-page-organization.ts"),
      "utf8",
    );
    expect(daily).toMatch(
      /resolveTaskPageOrganization\(\s*supabase,\s*orgParam,\s*"home"\s*\)/,
    );
    expect(daily).not.toMatch(
      /resolveTaskPageOrganization\(\s*supabase,\s*orgParam\s*\)/,
    );
    expect(resolver).toMatch(/moduleId:\s*ProductModuleId\s*=\s*"tasks"/);
    expect(resolver).toMatch(
      /evaluateProductModuleRouteAccess\(\{\s*moduleId,/,
    );
    expect(resolver).not.toMatch(/moduleId:\s*"home"/);
  });

  it("uses the existing home ProductModuleId without adding a capability grant", () => {
    expect(PRODUCT_MODULE_BY_ID.home.id).toBe("home");
    expect(PRODUCT_MODULE_BY_ID.home.capabilityRequirement).toBeNull();
    expect(PRODUCT_MODULE_BY_ID.home.route).toBe("/home");
  });

  it.each([
    "course_seller",
    "service",
    "field_operations",
    "product_operations",
  ] as const satisfies readonly OperatingModelId[])(
    "allows Home admission for completed resolved %s context",
    (model) => {
      const access = buildOperatingModelProductModuleAccess(model);
      expect(
        evaluateProductModuleRouteAccess({ moduleId: "home", access }).allowed,
      ).toBe(true);
    },
  );

  it("allows Home and denies Tasks when context is unresolved", () => {
    const unresolved = buildUnresolvedProductModuleAccess();
    expect(
      evaluateProductModuleRouteAccess({
        moduleId: "home",
        access: unresolved,
      }).allowed,
    ).toBe(true);
    expect(
      evaluateProductModuleRouteAccess({
        moduleId: "tasks",
        access: unresolved,
      }).allowed,
    ).toBe(false);
  });
});

describe("B1-C1-H1-COMPOSITION relevant work preservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listAttentionMock.mockResolvedValue(emptyAttention() as never);
    listTasksMock.mockResolvedValue(emptyTasks() as never);
  });

  function attentionCalls() {
    return listAttentionMock.mock.calls.map(
      (call) => call[0] as {
        organizationId: string;
        filters: {
          status?: string[];
          severity?: AttentionSeverity;
          assigneeMemberId?: string;
          includeArchived?: boolean;
        };
        pagination: { page: number; pageSize: number };
        sort: { field: string; direction: string };
      },
    );
  }

  it("never issues a mixed Attention query capped at 25", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));

    await loadDailyOperatingPage(supabase(), { org: ORG });

    const calls = attentionCalls();
    expect(calls).toHaveLength(6);
    for (const call of calls) {
      expect(call.organizationId).toBe(ORG);
      expect(call.pagination.pageSize).toBe(DAILY_OPERATING_SECTION_LIMIT);
      expect(call.sort).toEqual({
        field: "last_detected_at",
        direction: "desc",
      });
      expect(call.filters.severity).toBeDefined();
      expect(call.filters.status).toEqual(["open", "acknowledged"]);
      expect(call.filters.includeArchived).toBe(false);
    }

    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/daily-operating/server/load-daily-operating-page.ts",
      ),
      "utf8",
    );
    expect(source).not.toContain("DAILY_OPERATING_ATTENTION_FETCH_LIMIT");
    expect(source).not.toMatch(/pageSize:\s*25/);
    expect(source).not.toContain("getUtcBoundsForOrgCalendarDay");
  });

  it("keeps a qualifying organization-attention item that would fall outside the former mixed cap", async () => {
    const distractors = Array.from({ length: FORMER_MIXED_ATTENTION_CAP + 1 }, (_, index) =>
      attentionItem({
        id: paddedUuid(index + 1),
        severity: "medium",
        title: `Distractor ${index}`,
        lastDetectedAt: laterStamp(index),
      }),
    );
    const qualifying = attentionItem({
      id: paddedUuid(90),
      severity: "critical",
      title: "Older organization critical",
      lastDetectedAt: "2026-01-01T00:00:00.000Z",
    });
    const pool = [...distractors, qualifying];
    expect(formerMixedAttentionWindow(pool)).not.toContain(qualifying.id);

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockImplementation(listAttentionFromPool(pool) as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.organizationAttention.map((row) => row.id)).toContain(
      qualifying.id,
    );
    expect(result.brief.hasAnyActionable).toBe(true);
    expect(
      isDailyOperatingCalmState({
        hasAnyActionable: result.brief.hasAnyActionable,
        attentionQueryFailed: result.attentionQueryFailed,
        tasksQueryFailed: result.tasksQueryFailed,
      }),
    ).toBe(false);
  });

  it("keeps a qualifying assigned Attention item that would fall outside the former mixed cap", async () => {
    const distractors = Array.from({ length: FORMER_MIXED_ATTENTION_CAP + 1 }, (_, index) =>
      attentionItem({
        id: paddedUuid(index + 1),
        severity: "low",
        title: `Unassigned low ${index}`,
        lastDetectedAt: laterStamp(index),
      }),
    );
    const qualifying = attentionItem({
      id: paddedUuid(91),
      severity: "medium",
      title: "Older assigned medium",
      assigneeMemberId: MEMBERSHIP,
      lastDetectedAt: "2026-01-01T00:00:00.000Z",
    });
    const pool = [...distractors, qualifying];
    expect(formerMixedAttentionWindow(pool)).not.toContain(qualifying.id);

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockImplementation(listAttentionFromPool(pool) as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.myAttention.map((row) => row.id)).toEqual([qualifying.id]);
  });

  it("does not let other users’ Attention displace or leak into the assigned section", async () => {
    const others = Array.from({ length: FORMER_MIXED_ATTENTION_CAP + 1 }, (_, index) =>
      attentionItem({
        id: paddedUuid(index + 1),
        severity: "critical",
        title: `Other assignee ${index}`,
        assigneeMemberId: OTHER_MEMBERSHIP,
        lastDetectedAt: laterStamp(index),
      }),
    );
    const mine = attentionItem({
      id: paddedUuid(92),
      severity: "low",
      title: "Mine",
      assigneeMemberId: MEMBERSHIP,
      lastDetectedAt: "2026-01-01T00:00:00.000Z",
    });

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockImplementation(
      listAttentionFromPool([...others, mine]) as never,
    );

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.myAttention.map((row) => row.id)).toEqual([mine.id]);
    expect(
      result.brief.myAttention.every((row) => row.assigneeMemberId === MEMBERSHIP),
    ).toBe(true);
  });

  it("does not query organization Attention for Staff", async () => {
    const unassigned = attentionItem({
      id: paddedUuid(1),
      severity: "critical",
      title: "Org critical",
    });
    const mine = attentionItem({
      id: paddedUuid(2),
      severity: "medium",
      title: "Staff assigned",
      assigneeMemberId: MEMBERSHIP,
    });

    resolveOrgMock.mockResolvedValue(readyOrg("staff"));
    resolveMembershipMock.mockResolvedValue(membershipOk("staff"));
    listAttentionMock.mockImplementation(
      listAttentionFromPool([unassigned, mine]) as never,
    );

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;

    const calls = attentionCalls();
    expect(calls).toHaveLength(4);
    expect(calls.every((call) => call.filters.assigneeMemberId === MEMBERSHIP)).toBe(
      true,
    );
    expect(result.brief.organizationAttention).toEqual([]);
    expect(result.brief.myAttention.map((row) => row.id)).toEqual([mine.id]);
  });

  it("keeps stable Attention ordering when severity and timestamps tie", async () => {
    const tied = [
      attentionItem({
        id: paddedUuid(12),
        severity: "high",
        title: "Tie later id",
        lastDetectedAt: "2026-08-19T10:00:00.000Z",
      }),
      attentionItem({
        id: paddedUuid(11),
        severity: "high",
        title: "Tie earlier id",
        lastDetectedAt: "2026-08-19T10:00:00.000Z",
      }),
    ];

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockImplementation(listAttentionFromPool(tied) as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.organizationAttention.map((row) => row.id)).toEqual([
      paddedUuid(11),
      paddedUuid(12),
    ]);
  });

  it("does not drop assigned Attention because organization Attention is full", async () => {
    const orgBusy = Array.from({ length: 6 }, (_, index) =>
      attentionItem({
        id: paddedUuid(index + 1),
        severity: "critical",
        title: `Org busy ${index}`,
        lastDetectedAt: `2026-08-20T0${index}:00:00.000Z`,
      }),
    );
    const assigned = attentionItem({
      id: paddedUuid(93),
      severity: "low",
      title: "Assigned despite busy org",
      assigneeMemberId: MEMBERSHIP,
      lastDetectedAt: "2026-01-01T00:00:00.000Z",
    });

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockImplementation(
      listAttentionFromPool([...orgBusy, assigned]) as never,
    );

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.organizationAttention).toHaveLength(
      DAILY_OPERATING_SECTION_LIMIT,
    );
    expect(result.brief.myAttention.map((row) => row.id)).toEqual([assigned.id]);
  });

  it("keeps a qualifying overdue task beyond 25 ineligible or mixed rows", async () => {
    const ineligible = [
      ...Array.from({ length: 10 }, (_, index) =>
        taskItem({
          id: paddedUuid(index + 1),
          title: `Future ${index}`,
          dueAt: "2026-12-01T00:00:00.000Z",
        }),
      ),
      ...Array.from({ length: 8 }, (_, index) =>
        taskItem({
          id: paddedUuid(index + 20),
          title: `Completed ${index}`,
          overdue: true,
          status: "completed",
          derived: {
            terminal: true,
            archived: false,
            overdue: true,
            dueToday: false,
            upcoming: false,
            dueState: "overdue",
          },
        }),
      ),
      ...Array.from({ length: 8 }, (_, index) =>
        taskItem({
          id: paddedUuid(index + 40),
          title: `Other user ${index}`,
          overdue: true,
          assigneeMemberId: OTHER_MEMBERSHIP,
        }),
      ),
      taskItem({
        id: paddedUuid(70),
        title: "Other org overdue",
        overdue: true,
        organizationId: OTHER_ORG,
      }),
    ];
    const qualifying = taskItem({
      id: paddedUuid(94),
      title: "Oldest overdue mine",
      overdue: true,
      dueAt: "2025-01-01T00:00:00.000Z",
    });
    expect(ineligible.length).toBeGreaterThan(FORMER_MIXED_ATTENTION_CAP);

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listTasksMock.mockImplementation(
      listTasksFromPool([...ineligible, qualifying]) as never,
    );

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.overdueTasks.map((row) => row.id)).toEqual([
      qualifying.id,
    ]);
  });

  it("keeps a qualifying due-today task beyond 25 ineligible or mixed rows", async () => {
    const distractors = [
      ...Array.from({ length: 20 }, (_, index) =>
        taskItem({
          id: paddedUuid(index + 1),
          title: `Overdue distractor ${index}`,
          overdue: true,
          dueAt: `2026-08-01T${String(index).padStart(2, "0")}:00:00.000Z`,
        }),
      ),
      ...Array.from({ length: 8 }, (_, index) =>
        taskItem({
          id: paddedUuid(index + 40),
          title: `Undated-like upcoming ${index}`,
          dueAt: "2026-12-31T00:00:00.000Z",
        }),
      ),
    ];
    const qualifying = taskItem({
      id: paddedUuid(95),
      title: "Due today mine",
      dueToday: true,
      dueAt: "2026-08-19T23:00:00.000Z",
    });
    expect(distractors.length).toBeGreaterThan(FORMER_MIXED_ATTENTION_CAP);

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listTasksMock.mockImplementation(
      listTasksFromPool([...distractors, qualifying]) as never,
    );

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.dueTodayTasks.map((row) => row.id)).toEqual([
      qualifying.id,
    ]);
    expect(result.brief.overdueTasks.map((row) => row.id)).not.toContain(
      qualifying.id,
    );
  });

  it("does not leak another organization’s tasks into personal sections", async () => {
    const foreign = taskItem({
      id: paddedUuid(96),
      title: "Foreign overdue",
      overdue: true,
      organizationId: OTHER_ORG,
    });
    const mine = taskItem({
      id: paddedUuid(97),
      title: "Mine overdue",
      overdue: true,
    });

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listTasksMock.mockImplementation(listTasksFromPool([foreign, mine]) as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.overdueTasks.map((row) => row.id)).toEqual([mine.id]);
    expect(listTasksMock.mock.calls.every((call) => call[0]?.organizationId === ORG)).toBe(
      true,
    );
  });

  it("delegates due-today eligibility to listTasks with org-scoped dueState", async () => {
    resolveOrgMock.mockResolvedValue({
      ...readyOrg("owner"),
      timeZone: "America/New_York",
    });
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));

    await loadDailyOperatingPage(supabase(), { org: ORG });

    expect(listTasksMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG,
        filters: expect.objectContaining({
          dueState: "due_today",
          assigneeMemberId: MEMBERSHIP,
          status: "open",
        }),
        pagination: { page: 1, pageSize: DAILY_OPERATING_SECTION_LIMIT },
        sort: { field: "due_at", direction: "asc" },
      }),
    );
    expect(listTasksMock).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ dueState: "overdue" }),
        pagination: { page: 1, pageSize: DAILY_OPERATING_SECTION_LIMIT },
      }),
    );
  });

  it("keeps overdue task order stable for equal due timestamps", async () => {
    const tied = [
      taskItem({
        id: paddedUuid(22),
        title: "Later id",
        overdue: true,
        dueAt: "2026-08-01T00:00:00.000Z",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
      taskItem({
        id: paddedUuid(21),
        title: "Earlier id",
        overdue: true,
        dueAt: "2026-08-01T00:00:00.000Z",
        createdAt: "2026-07-01T00:00:00.000Z",
      }),
    ];

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listTasksMock.mockImplementation(listTasksFromPool(tied) as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.overdueTasks.map((row) => row.id)).toEqual([
      paddedUuid(21),
      paddedUuid(22),
    ]);
  });

  it("still permits calm when every required source succeeds empty", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.hasAnyActionable).toBe(false);
    expect(result.attentionQueryFailed).toBe(false);
    expect(result.tasksQueryFailed).toBe(false);
    expect(
      isDailyOperatingCalmState({
        hasAnyActionable: result.brief.hasAnyActionable,
        attentionQueryFailed: result.attentionQueryFailed,
        tasksQueryFailed: result.tasksQueryFailed,
      }),
    ).toBe(true);
  });

  it("prevents calm when one targeted Attention query fails", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockImplementation(async (params) => {
      if (params.filters?.severity === "low") {
        return {
          ok: false,
          error: {
            code: "UNEXPECTED_ERROR",
            message: "boom",
            retryable: false,
            category: "server",
          },
        };
      }
      return listAttentionFromPool([
        attentionItem({
          id: paddedUuid(98),
          severity: "critical",
          title: "Visible critical",
        }),
      ])(params);
    });

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.attentionQueryFailed).toBe(true);
    expect(result.tasksQueryFailed).toBe(false);
    expect(result.brief.organizationAttention.map((row) => row.id)).toEqual([
      paddedUuid(98),
    ]);
    expect(JSON.stringify(result)).not.toContain("boom");
    expect(
      isDailyOperatingCalmState({
        hasAnyActionable: result.brief.hasAnyActionable,
        attentionQueryFailed: result.attentionQueryFailed,
        tasksQueryFailed: result.tasksQueryFailed,
      }),
    ).toBe(false);
  });

  it("keeps successful task sections when Attention is partial", async () => {
    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockResolvedValue({
      ok: false,
      error: { code: "query_failed", message: "boom" },
    } as never);
    listTasksMock.mockImplementation(
      listTasksFromPool([
        taskItem({
          id: paddedUuid(99),
          title: "Still visible overdue",
          overdue: true,
        }),
      ]) as never,
    );

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.attentionQueryFailed).toBe(true);
    expect(result.tasksQueryFailed).toBe(false);
    expect(result.brief.overdueTasks.map((row) => row.id)).toEqual([
      paddedUuid(99),
    ]);
    expect(JSON.stringify(result)).not.toContain("boom");
    expect(
      isDailyOperatingCalmState({
        hasAnyActionable: result.brief.hasAnyActionable,
        attentionQueryFailed: result.attentionQueryFailed,
        tasksQueryFailed: result.tasksQueryFailed,
      }),
    ).toBe(false);
  });

  it("applies the intentional section display cap after the relevant candidate set", async () => {
    const assigned = Array.from({ length: 8 }, (_, index) =>
      attentionItem({
        id: paddedUuid(index + 1),
        severity: "critical",
        title: `Assigned ${index}`,
        assigneeMemberId: MEMBERSHIP,
        lastDetectedAt: `2026-08-20T0${index}:00:00.000Z`,
      }),
    );

    resolveOrgMock.mockResolvedValue(readyOrg("owner"));
    resolveMembershipMock.mockResolvedValue(membershipOk("owner"));
    listAttentionMock.mockImplementation(listAttentionFromPool(assigned) as never);

    const result = await loadDailyOperatingPage(supabase(), { org: ORG });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.brief.myAttention).toHaveLength(DAILY_OPERATING_SECTION_LIMIT);
    expect(result.brief.myAttention.map((row) => row.id)).toEqual([
      paddedUuid(8),
      paddedUuid(7),
      paddedUuid(6),
      paddedUuid(5),
      paddedUuid(4),
    ]);
  });
});
