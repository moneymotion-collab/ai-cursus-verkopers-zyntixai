import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  composeDailyOperatingBrief,
  buildDailyOperatingHomePath,
  buildDailyOperatingModuleHref,
  canSeeOrganizationAttention,
  DAILY_OPERATING_CALM_ACTION_LIMIT,
  DAILY_OPERATING_CALM_SUPPORTING,
  DAILY_OPERATING_CALM_TITLE,
  DAILY_OPERATING_SECTION_LIMIT,
  DAILY_OPERATING_TODAY_SUBTITLE,
  isDailyOperatingCalmState,
  resolveDailyOperatingCalmActions,
} from "@/features/daily-operating/domain/compose-daily-operating-brief";
import {
  FAIL_CLOSED_MODULE_NAV_VISIBILITY,
  buildUnresolvedProductModuleAccess,
} from "@/features/product-access/domain/module-access";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import type { ModuleNavVisibility } from "@/features/product-access/domain/types";
import type { AttentionItemListItemReadModel } from "@/features/attention/domain/read-types";
import type { TaskListItemReadModel } from "@/features/tasks/domain/read-types";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "22222222-2222-4222-8222-222222222222";
const ME = "33333333-3333-4333-8333-333333333333";
const OTHER = "44444444-4444-4444-8444-444444444444";

function attention(
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

function task(
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
    assigneeMemberId: ME,
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

describe("composeDailyOperatingBrief", () => {
  it("keeps Owner organization critical/high Attention and excludes other orgs", () => {
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "owner",
      attentionItems: [
        attention({ id: "a1", severity: "critical", title: "Critical A" }),
        attention({
          id: "a2",
          severity: "high",
          title: "High B",
          lastDetectedAt: "2026-08-19T11:00:00.000Z",
        }),
        attention({
          id: "a3",
          severity: "critical",
          title: "Other org",
          organizationId: OTHER_ORG,
        }),
        attention({ id: "a4", severity: "medium", title: "Medium ignored in org" }),
      ],
      overdueTasks: [],
      dueTodayTasks: [],
    });

    expect(brief.organizationAttention.map((row) => row.id)).toEqual([
      "a1",
      "a2",
    ]);
    expect(brief.hasAnyActionable).toBe(true);
  });

  it("hides organization Attention from staff and keeps assigned Attention", () => {
    expect(canSeeOrganizationAttention("staff")).toBe(false);
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "staff",
      attentionItems: [
        attention({ id: "a1", severity: "critical", title: "Unassigned critical" }),
        attention({
          id: "a2",
          severity: "medium",
          title: "Mine",
          assigneeMemberId: ME,
        }),
        attention({
          id: "a3",
          severity: "high",
          title: "Someone else",
          assigneeMemberId: OTHER,
        }),
      ],
      overdueTasks: [],
      dueTodayTasks: [],
    });

    expect(brief.organizationAttention).toEqual([]);
    expect(brief.myAttention.map((row) => row.id)).toEqual(["a2"]);
  });

  it("includes overdue and due-today assigned open tasks only", () => {
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "admin",
      attentionItems: [],
      overdueTasks: [
        task({ id: "t1", title: "Overdue mine", overdue: true }),
        task({
          id: "t2",
          title: "Overdue other",
          overdue: true,
          assigneeMemberId: OTHER,
        }),
        task({
          id: "t3",
          title: "Completed",
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
      ],
      dueTodayTasks: [
        task({ id: "t4", title: "Today mine", dueToday: true }),
      ],
    });

    expect(brief.overdueTasks.map((row) => row.id)).toEqual(["t1"]);
    expect(brief.dueTodayTasks.map((row) => row.id)).toEqual(["t4"]);
    expect(brief.overdueTasks[0]?.href).toContain(`/tasks/t1?org=${ORG}`);
  });

  it("reports empty calm state when nothing actionable", () => {
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "owner",
      attentionItems: [],
      overdueTasks: [],
      dueTodayTasks: [],
    });
    expect(brief.hasAnyActionable).toBe(false);
  });

  it("builds home path with org query", () => {
    expect(buildDailyOperatingHomePath(ORG)).toBe(`/home?org=${ORG}`);
  });

  it("excludes resolved and archived Attention from actionable composition", () => {
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "owner",
      attentionItems: [
        attention({
          id: "resolved",
          severity: "critical",
          title: "Resolved",
          status: "resolved",
          derived: {
            isAcknowledged: false,
            isArchived: false,
            isTerminal: true,
            isResolved: true,
            isDismissed: false,
            isExpired: false,
          },
        }),
        attention({
          id: "archived",
          severity: "critical",
          title: "Archived",
          status: "open",
          derived: {
            isAcknowledged: false,
            isArchived: true,
            isTerminal: false,
            isResolved: false,
            isDismissed: false,
            isExpired: false,
          },
        }),
      ],
      overdueTasks: [],
      dueTodayTasks: [],
    });

    expect(brief.organizationAttention).toEqual([]);
    expect(brief.hasAnyActionable).toBe(false);
  });

  it("orders organization Attention critical before high and keeps assigned medium in myAttention", () => {
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "owner",
      attentionItems: [
        attention({
          id: "high",
          severity: "high",
          title: "High",
          lastDetectedAt: "2026-08-19T12:00:00.000Z",
        }),
        attention({
          id: "critical",
          severity: "critical",
          title: "Critical",
          lastDetectedAt: "2026-08-19T11:00:00.000Z",
        }),
        attention({
          id: "mine-medium",
          severity: "medium",
          title: "Mine medium",
          assigneeMemberId: ME,
        }),
      ],
      overdueTasks: [
        task({ id: "overdue", title: "Overdue", overdue: true }),
      ],
      dueTodayTasks: [
        task({ id: "today", title: "Today", dueToday: true }),
      ],
    });

    expect(brief.organizationAttention.map((row) => row.id)).toEqual([
      "critical",
      "high",
    ]);
    expect(brief.myAttention.map((row) => row.id)).toEqual(["mine-medium"]);
    expect(brief.overdueTasks.map((row) => row.id)).toEqual(["overdue"]);
    expect(brief.dueTodayTasks.map((row) => row.id)).toEqual(["today"]);
    expect(new Set([
      ...brief.organizationAttention.map((row) => row.id),
      ...brief.myAttention.map((row) => row.id),
      ...brief.overdueTasks.map((row) => row.id),
      ...brief.dueTodayTasks.map((row) => row.id),
    ]).size).toBe(5);
  });

  it("breaks Attention ties by id after severity rank and lastDetectedAt", () => {
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "owner",
      attentionItems: [
        attention({
          id: "tie-b",
          severity: "critical",
          title: "Tie B",
          lastDetectedAt: "2026-08-19T10:00:00.000Z",
        }),
        attention({
          id: "tie-a",
          severity: "critical",
          title: "Tie A",
          lastDetectedAt: "2026-08-19T10:00:00.000Z",
        }),
      ],
      overdueTasks: [],
      dueTodayTasks: [],
    });

    expect(brief.organizationAttention.map((row) => row.id)).toEqual([
      "tie-a",
      "tie-b",
    ]);
  });

  it("applies the section display cap after selecting relevant Attention", () => {
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "owner",
      attentionItems: Array.from({ length: 8 }, (_, index) =>
        attention({
          id: `org-${String(index).padStart(2, "0")}`,
          severity: "critical",
          title: `Org ${index}`,
          lastDetectedAt: `2026-08-19T1${index}:00:00.000Z`,
        }),
      ),
      overdueTasks: [],
      dueTodayTasks: [],
    });

    expect(brief.organizationAttention).toHaveLength(DAILY_OPERATING_SECTION_LIMIT);
    expect(brief.organizationAttention.map((row) => row.id)).toEqual([
      "org-07",
      "org-06",
      "org-05",
      "org-04",
      "org-03",
    ]);
  });

  it("keeps overdue and due-today mutually exclusive after the display cap", () => {
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "owner",
      attentionItems: [],
      overdueTasks: [
        task({ id: "overdue-keep", title: "Overdue", overdue: true }),
        task({
          id: "today-misfiled",
          title: "Today misfiled",
          dueToday: true,
          overdue: false,
        }),
      ],
      dueTodayTasks: [
        task({ id: "today-keep", title: "Today", dueToday: true }),
        task({
          id: "overdue-misfiled",
          title: "Overdue misfiled",
          overdue: true,
          dueToday: false,
        }),
      ],
    });

    expect(brief.overdueTasks.map((row) => row.id)).toEqual(["overdue-keep"]);
    expect(brief.dueTodayTasks.map((row) => row.id)).toEqual(["today-keep"]);
  });

  it("uses the Product name as Home context for inventory Attention", () => {
    const brief = composeDailyOperatingBrief({
      organizationId: ORG,
      membershipId: ME,
      role: "owner",
      attentionItems: [
        attention({
          id: "stock",
          severity: "high",
          title: "Product is out of stock",
          sourceType: "product",
          sourceEntityId: "product-1",
          productId: "product-1",
          enrollmentId: null,
          customerId: null,
          programId: null,
          productName: "Field tablet",
          customerDisplayName: null,
          programName: null,
        }),
      ],
      overdueTasks: [],
      dueTodayTasks: [],
    });

    expect(brief.organizationAttention[0]?.contextLabel).toBe("Field tablet");
  });
});

describe("daily operating calm truth and context-safe actions", () => {
  const ALL_CALM_VISIBLE: ModuleNavVisibility = {
    ...FAIL_CLOSED_MODULE_NAV_VISIBILITY,
    attention: true,
    tasks: true,
    workOrders: true,
    orders: true,
    projects: true,
    leads: true,
  };

  it("freezes the H1 calm copy and Today subtitle", () => {
    expect(DAILY_OPERATING_CALM_TITLE).toBe(
      "No priority attention or due work is showing in today\u2019s brief.",
    );
    expect(DAILY_OPERATING_CALM_SUPPORTING).toBe(
      "This page lists priority Attention and due work in today\u2019s brief. Other items may exist elsewhere.",
    );
    expect(DAILY_OPERATING_TODAY_SUBTITLE).toBe(
      "Priority Attention and due work in today\u2019s brief.",
    );
    expect(DAILY_OPERATING_CALM_TITLE).not.toContain("You are clear for now");
    expect(DAILY_OPERATING_CALM_SUPPORTING).not.toContain("Everything is complete");
    expect(DAILY_OPERATING_CALM_SUPPORTING).not.toContain("Nothing is assigned to you");
    expect(DAILY_OPERATING_CALM_SUPPORTING).not.toContain("No work remains");
    expect(DAILY_OPERATING_CALM_SUPPORTING).not.toContain("Your organization is healthy");
  });

  it("source-locks the Home page to the frozen Today subtitle", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/home/page.tsx"),
      "utf8",
    );
    expect(page).toContain("DAILY_OPERATING_TODAY_SUBTITLE");
    expect(page).not.toContain(
      "What needs attention and what you need to do next.",
    );
    expect(page).toContain(
      "moduleNavVisibility={result.moduleAccess.navVisibility}",
    );
  });

  it("shows calm only when both sources succeed and the brief is empty", () => {
    expect(
      isDailyOperatingCalmState({
        hasAnyActionable: false,
        attentionQueryFailed: false,
        tasksQueryFailed: false,
      }),
    ).toBe(true);
    expect(
      isDailyOperatingCalmState({
        hasAnyActionable: true,
        attentionQueryFailed: false,
        tasksQueryFailed: false,
      }),
    ).toBe(false);
    expect(
      isDailyOperatingCalmState({
        hasAnyActionable: false,
        attentionQueryFailed: true,
        tasksQueryFailed: false,
      }),
    ).toBe(false);
    expect(
      isDailyOperatingCalmState({
        hasAnyActionable: false,
        attentionQueryFailed: false,
        tasksQueryFailed: true,
      }),
    ).toBe(false);
    expect(
      isDailyOperatingCalmState({
        hasAnyActionable: false,
        attentionQueryFailed: true,
        tasksQueryFailed: true,
      }),
    ).toBe(false);
  });

  it("keeps organization context on Home module hrefs and does not invent org", () => {
    expect(buildDailyOperatingModuleHref("/attention", ORG)).toBe(
      `/attention?org=${ORG}`,
    );
    expect(
      buildDailyOperatingModuleHref("/tasks", ORG, { dueState: "overdue" }),
    ).toBe(`/tasks?org=${ORG}&dueState=overdue`);
    expect(buildDailyOperatingModuleHref("/leads", "")).toBe("/leads");
    expect(buildDailyOperatingModuleHref("/leads", "")).not.toContain("org=");
    expect(buildDailyOperatingModuleHref("/leads", ORG)).not.toContain(OTHER_ORG);
    expect(buildDailyOperatingModuleHref("/leads", "a&b=1")).toBe(
      "/leads?org=a%26b%3D1",
    );
  });

  it("builds at most three unique actions from server visibility, in contract order", () => {
    const actions = resolveDailyOperatingCalmActions({
      navVisibility: ALL_CALM_VISIBLE,
      organizationId: ORG,
    });
    expect(actions).toHaveLength(DAILY_OPERATING_CALM_ACTION_LIMIT);
    expect(actions.map((action) => action.moduleId)).toEqual([
      "attention",
      "tasks",
      "workOrders",
    ]);
    expect(new Set(actions.map((action) => action.moduleId)).size).toBe(3);
    expect(actions.some((action) => action.moduleId === "leads")).toBe(false);
  });

  it("omits hidden modules and unresolved Home-only visibility", () => {
    const hiddenLeads = resolveDailyOperatingCalmActions({
      navVisibility: {
        ...FAIL_CLOSED_MODULE_NAV_VISIBILITY,
        attention: true,
        tasks: true,
        leads: false,
      },
      organizationId: ORG,
    });
    expect(hiddenLeads.map((action) => action.moduleId)).toEqual([
      "attention",
      "tasks",
    ]);
    expect(hiddenLeads.some((action) => action.moduleId === "leads")).toBe(
      false,
    );

    const unresolved = resolveDailyOperatingCalmActions({
      navVisibility: buildUnresolvedProductModuleAccess().navVisibility,
      organizationId: ORG,
    });
    expect(unresolved).toEqual([]);
  });

  it("maps course_seller visibility to Attention, Tasks, and Leads", () => {
    const actions = resolveDailyOperatingCalmActions({
      navVisibility: operatingModelNavVisibility("course_seller"),
      organizationId: ORG,
    });
    expect(actions.map((action) => action.moduleId)).toEqual([
      "attention",
      "tasks",
      "leads",
    ]);
    expect(actions.some((action) => action.moduleId === "projects")).toBe(false);
    expect(actions.some((action) => action.moduleId === "workOrders")).toBe(
      false,
    );
    expect(actions.some((action) => action.moduleId === "orders")).toBe(false);
    expect(actions.every((action) => action.href.includes(`org=${ORG}`))).toBe(
      true,
    );
  });

  it("maps service visibility to Attention, Tasks, and Projects", () => {
    const actions = resolveDailyOperatingCalmActions({
      navVisibility: operatingModelNavVisibility("service"),
      organizationId: ORG,
    });
    expect(actions.map((action) => action.moduleId)).toEqual([
      "attention",
      "tasks",
      "projects",
    ]);
    expect(actions.some((action) => action.moduleId === "leads")).toBe(false);
    expect(actions.some((action) => action.moduleId === "workOrders")).toBe(
      false,
    );
  });

  it("maps field_operations visibility to Attention, Tasks, and Work orders", () => {
    const actions = resolveDailyOperatingCalmActions({
      navVisibility: operatingModelNavVisibility("field_operations"),
      organizationId: ORG,
    });
    expect(actions.map((action) => action.moduleId)).toEqual([
      "attention",
      "tasks",
      "workOrders",
    ]);
    expect(actions.some((action) => action.moduleId === "leads")).toBe(false);
    expect(actions[2]?.href).toBe(`/work-orders?org=${ORG}`);
  });

  it("maps product_operations visibility to Attention, Tasks, and Orders without Leads", () => {
    const visibility = operatingModelNavVisibility("product_operations");
    expect(visibility.leads).toBe(false);
    const actions = resolveDailyOperatingCalmActions({
      navVisibility: visibility,
      organizationId: ORG,
    });
    expect(actions.map((action) => action.moduleId)).toEqual([
      "attention",
      "tasks",
      "orders",
    ]);
    expect(actions.some((action) => action.moduleId === "leads")).toBe(false);
    expect(actions[2]?.href).toBe(`/orders?org=${ORG}`);
  });
});
