import { describe, expect, it } from "vitest";
import {
  composeDailyOperatingBrief,
  buildDailyOperatingHomePath,
  canSeeOrganizationAttention,
} from "@/features/daily-operating/domain/compose-daily-operating-brief";
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
  const overdue = overrides.overdue ?? false;
  const dueToday = overrides.dueToday ?? false;
  const { overdue: _o, dueToday: _d, ...rest } = overrides;
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
});
