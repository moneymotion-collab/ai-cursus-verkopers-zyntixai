import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DailyOperatingBriefPanel } from "@/features/daily-operating/ui/daily-operating-brief";
import {
  DAILY_OPERATING_CALM_SUPPORTING,
  DAILY_OPERATING_CALM_TITLE,
  type DailyOperatingBrief,
} from "@/features/daily-operating/domain/compose-daily-operating-brief";
import {
  FAIL_CLOSED_MODULE_NAV_VISIBILITY,
  buildUnresolvedProductModuleAccess,
} from "@/features/product-access/domain/module-access";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import type { ModuleNavVisibility } from "@/features/product-access/domain/types";

const ORG = "11111111-1111-4111-8111-111111111111";

function brief(
  overrides: Partial<DailyOperatingBrief> = {},
): DailyOperatingBrief {
  return {
    organizationId: ORG,
    membershipId: "m1",
    role: "owner",
    myAttention: [],
    organizationAttention: [],
    overdueTasks: [],
    dueTodayTasks: [],
    hasAnyActionable: false,
    ...overrides,
  };
}

function renderPanel(input: {
  brief?: DailyOperatingBrief;
  attentionQueryFailed?: boolean;
  tasksQueryFailed?: boolean;
  moduleNavVisibility?: ModuleNavVisibility;
} = {}) {
  return renderToStaticMarkup(
    <DailyOperatingBriefPanel
      brief={input.brief ?? brief()}
      attentionQueryFailed={input.attentionQueryFailed ?? false}
      tasksQueryFailed={input.tasksQueryFailed ?? false}
      moduleNavVisibility={
        input.moduleNavVisibility ?? FAIL_CLOSED_MODULE_NAV_VISIBILITY
      }
    />,
  );
}

function actionHrefs(html: string): string[] {
  const matches = [...html.matchAll(/<a href="([^"]+)">Open [^<]+<\/a>/g)];
  return matches.map((match) => match[1]);
}

function actionLabels(html: string): string[] {
  const matches = [...html.matchAll(/<a href="[^"]+">(Open [^<]+)<\/a>/g)];
  return matches.map((match) => match[1]);
}

const COURSE_NAV = operatingModelNavVisibility("course_seller");
const SERVICE_NAV = operatingModelNavVisibility("service");
const FIELD_NAV = operatingModelNavVisibility("field_operations");
const PRODUCT_NAV = operatingModelNavVisibility("product_operations");
const UNRESOLVED_NAV = buildUnresolvedProductModuleAccess().navVisibility;
const ATTENTION_TASKS_NAV: ModuleNavVisibility = {
  ...FAIL_CLOSED_MODULE_NAV_VISIBILITY,
  attention: true,
  tasks: true,
};

describe("DailyOperatingBriefPanel", () => {
  it("renders the frozen calm title without implying the organization is clear", () => {
    const html = renderPanel({ moduleNavVisibility: COURSE_NAV });
    expect(html).toContain(DAILY_OPERATING_CALM_TITLE);
    expect(html).toContain(DAILY_OPERATING_CALM_SUPPORTING);
    expect(html).not.toContain("You are clear for now");
    expect(html).not.toContain("Everything is complete");
    expect(html).not.toContain("Nothing is assigned to you");
    expect(html).not.toContain("No work remains");
    expect(html).not.toContain("Your organization is healthy");
    expect(html).not.toContain("Nothing urgent needs your attention and no assigned work is due today.");
    expect(html).not.toContain('role="alert"');
  });

  it("renders critical Attention and overdue task with actionable links", () => {
    const html = renderPanel({
      moduleNavVisibility: ATTENTION_TASKS_NAV,
      brief: brief({
        hasAnyActionable: true,
        organizationAttention: [
          {
            kind: "attention",
            id: "a1",
            title: "Enrollment stalled",
            severity: "critical",
            status: "open",
            assigneeMemberId: null,
            href: `/attention/a1?org=${ORG}`,
            bucket: "critical",
            contextLabel: "Ada · Launch",
          },
        ],
        overdueTasks: [
          {
            kind: "task",
            id: "t1",
            title: "Call Ada",
            href: `/tasks/t1?org=${ORG}`,
            bucket: "overdue",
            dueAt: "2026-08-18T12:00:00.000Z",
          },
        ],
      }),
    });

    expect(html).toContain("Enrollment stalled");
    expect(html).toContain("Call Ada");
    expect(html).toContain(`href="/attention/a1?org=${ORG}"`);
    expect(html).toContain(`href="/tasks/t1?org=${ORG}"`);
    expect(html).toContain("Severity");
    expect(html).toContain("Critical");
    expect(html).toContain("Overdue");
    expect(html).not.toContain(DAILY_OPERATING_CALM_TITLE);
    expect(html).not.toContain("You are clear for now");
  });

  it("hides organization Attention for staff roles", () => {
    const html = renderPanel({
      moduleNavVisibility: ATTENTION_TASKS_NAV,
      brief: brief({
        role: "staff",
        hasAnyActionable: true,
        myAttention: [
          {
            kind: "attention",
            id: "a2",
            title: "Mine only",
            severity: "medium",
            status: "open",
            assigneeMemberId: "m1",
            href: `/attention/a2?org=${ORG}`,
            bucket: "assigned_other",
            contextLabel: null,
          },
        ],
      }),
    });
    expect(html).not.toContain("Organization attention");
    expect(html).toContain("Assigned to me — Attention");
    expect(html).toContain("Mine only");
  });

  it("shows honest Attention failure instead of empty success or calm", () => {
    const html = renderPanel({
      moduleNavVisibility: ATTENTION_TASKS_NAV,
      brief: brief({ hasAnyActionable: false }),
      attentionQueryFailed: true,
      tasksQueryFailed: false,
    });
    expect(html).toContain("Unable to load Attention.");
    expect(html).toContain("Attention could not be loaded.");
    expect(html).toContain("No assigned work is overdue.");
    expect(html).not.toContain(DAILY_OPERATING_CALM_TITLE);
    expect(html).not.toContain("You are clear for now");
  });

  it("shows due-today task links and excludes calm empty banner when actionable", () => {
    const html = renderPanel({
      moduleNavVisibility: ATTENTION_TASKS_NAV,
      brief: brief({
        hasAnyActionable: true,
        dueTodayTasks: [
          {
            kind: "task",
            id: "t-today",
            title: "Prep call",
            href: `/tasks/t-today?org=${ORG}`,
            bucket: "due_today",
            dueAt: "2026-08-19T15:00:00.000Z",
          },
        ],
      }),
    });
    expect(html).toContain(`href="/tasks/t-today?org=${ORG}"`);
    expect(html).toContain("Due today");
    expect(html).toContain("Prep call");
    expect(html).not.toContain(DAILY_OPERATING_CALM_TITLE);
  });

  it("does not treat Tasks fetch failure as empty success or calm", () => {
    const html = renderPanel({
      moduleNavVisibility: ATTENTION_TASKS_NAV,
      brief: brief({ hasAnyActionable: false }),
      attentionQueryFailed: false,
      tasksQueryFailed: true,
    });
    expect(html).toContain("Unable to load Tasks.");
    expect(html).toContain("Tasks could not be loaded.");
    expect(html).toContain("Nothing urgent needs organization attention.");
    expect(html).not.toContain(DAILY_OPERATING_CALM_TITLE);
    expect(html).not.toContain("You are clear for now");
    expect(html).not.toContain("No work is due today.");
  });

  it("suppresses calm when both Attention and Tasks fail", () => {
    const html = renderPanel({
      moduleNavVisibility: COURSE_NAV,
      brief: brief({ hasAnyActionable: false }),
      attentionQueryFailed: true,
      tasksQueryFailed: true,
    });
    expect(html).toContain("Some operating data could not be loaded.");
    expect(html).toContain("Unable to load Attention.");
    expect(html).toContain("Unable to load Tasks.");
    expect(html).not.toContain(DAILY_OPERATING_CALM_TITLE);
    expect(html).not.toContain("Open Leads");
  });

  it("exposes semantic headings for keyboard/a11y automation contracts", () => {
    const html = renderPanel({
      moduleNavVisibility: COURSE_NAV,
      brief: brief({ role: "owner", hasAnyActionable: false }),
    });
    expect(html).toContain('id="organization-attention"');
    expect(html).toContain('id="assigned-to-me-—-attention"');
    expect(html).toContain('id="overdue-work"');
    expect(html).toContain('id="due-today"');
  });

  it("offers only visible course_seller actions with accessible names and org context", () => {
    const html = renderPanel({ moduleNavVisibility: COURSE_NAV });
    expect(actionLabels(html)).toEqual([
      "Open Attention",
      "Open Tasks",
      "Open Leads",
    ]);
    expect(actionHrefs(html)).toEqual([
      `/attention?org=${ORG}`,
      `/tasks?org=${ORG}`,
      `/leads?org=${ORG}`,
    ]);
    expect(html).not.toContain("Open Projects");
    expect(html).not.toContain("Open Work orders");
    expect(html).not.toContain("Open Orders");
  });

  it("does not offer a hidden module action", () => {
    const html = renderPanel({
      moduleNavVisibility: {
        ...FAIL_CLOSED_MODULE_NAV_VISIBILITY,
        attention: true,
        tasks: true,
        leads: false,
      },
    });
    expect(actionLabels(html)).toEqual(["Open Attention", "Open Tasks"]);
    expect(html).not.toContain("Open Leads");
  });

  it("does not show Open Leads universally", () => {
    const productHtml = renderPanel({ moduleNavVisibility: PRODUCT_NAV });
    expect(productHtml).not.toContain("Open Leads");
    const fieldHtml = renderPanel({ moduleNavVisibility: FIELD_NAV });
    expect(fieldHtml).not.toContain("Open Leads");
    const unresolvedHtml = renderPanel({ moduleNavVisibility: UNRESOLVED_NAV });
    expect(unresolvedHtml).not.toContain("Open Leads");
  });

  it("keeps service actions to Attention, Tasks, and Projects", () => {
    const html = renderPanel({ moduleNavVisibility: SERVICE_NAV });
    expect(actionLabels(html)).toEqual([
      "Open Attention",
      "Open Tasks",
      "Open Projects",
    ]);
    expect(html).not.toContain("Open Leads");
  });

  it("keeps field_operations actions to Attention, Tasks, and Work orders", () => {
    const html = renderPanel({ moduleNavVisibility: FIELD_NAV });
    expect(actionLabels(html)).toEqual([
      "Open Attention",
      "Open Tasks",
      "Open Work orders",
    ]);
    expect(html).not.toContain("Open Leads");
    expect(html).not.toContain("/dispatch");
  });

  it("keeps product_operations actions to Attention, Tasks, and Orders", () => {
    const html = renderPanel({ moduleNavVisibility: PRODUCT_NAV });
    expect(actionLabels(html)).toEqual([
      "Open Attention",
      "Open Tasks",
      "Open Orders",
    ]);
    expect(html).not.toContain("Open Leads");
    expect(html).not.toContain("Open Inventory");
  });

  it("renders no module action container for unresolved Home-only visibility", () => {
    const html = renderPanel({ moduleNavVisibility: UNRESOLVED_NAV });
    expect(html).toContain(DAILY_OPERATING_CALM_TITLE);
    expect(actionLabels(html)).toEqual([]);
    expect(html).not.toContain("Open Attention");
    expect(html).not.toContain("Open Tasks");
    expect(html).not.toContain("Open Leads");
    expect(html).not.toContain("View all Attention");
    expect(html).not.toContain("View overdue tasks");
    expect(html).not.toContain(`href="/attention`);
    expect(html).not.toContain(`href="/tasks`);
    expect(html).not.toContain(`href="/leads`);
  });

  it("does not render an empty calm action container", () => {
    const html = renderPanel({ moduleNavVisibility: UNRESOLVED_NAV });
    expect(html).toContain(DAILY_OPERATING_CALM_TITLE);
    expect(html).not.toMatch(/calmLinks/);
  });

  it("preserves org on every calm action and does not invent a foreign org", () => {
    const html = renderPanel({
      moduleNavVisibility: COURSE_NAV,
      brief: brief({ organizationId: ORG }),
    });
    for (const href of actionHrefs(html)) {
      expect(href).toContain(`org=${ORG}`);
      expect(href).not.toContain("22222222-2222-4222-8222-222222222222");
    }
  });

  it("omits org when the server brief has no organizationId", () => {
    const html = renderPanel({
      moduleNavVisibility: COURSE_NAV,
      brief: brief({ organizationId: "" }),
    });
    expect(actionHrefs(html)).toEqual(["/attention", "/tasks", "/leads"]);
    expect(html).not.toContain("org=");
  });

  it("renders hidden-module rows as non-navigating text", () => {
    const html = renderPanel({
      moduleNavVisibility: FAIL_CLOSED_MODULE_NAV_VISIBILITY,
      brief: brief({
        hasAnyActionable: true,
        organizationAttention: [
          {
            kind: "attention",
            id: "a1",
            title: "Enrollment stalled",
            severity: "critical",
            status: "open",
            assigneeMemberId: null,
            href: `/attention/a1?org=${ORG}`,
            bucket: "critical",
            contextLabel: null,
          },
        ],
      }),
    });
    expect(html).toContain("Enrollment stalled");
    expect(html).not.toContain(`href="/attention/a1?org=${ORG}"`);
    expect(html).not.toContain("View all Attention");
    expect(html).not.toContain(DAILY_OPERATING_CALM_TITLE);
  });

  it("caps calm actions at three unique links in deterministic order", () => {
    const html = renderPanel({
      moduleNavVisibility: {
        ...FAIL_CLOSED_MODULE_NAV_VISIBILITY,
        attention: true,
        tasks: true,
        workOrders: true,
        orders: true,
        projects: true,
        leads: true,
      },
    });
    expect(actionLabels(html)).toEqual([
      "Open Attention",
      "Open Tasks",
      "Open Work orders",
    ]);
    expect(actionLabels(html)).toHaveLength(3);
    expect(new Set(actionLabels(html)).size).toBe(3);
  });

  it("does not introduce a client-only visibility boundary", () => {
    const panel = readFileSync(
      join(process.cwd(), "src/features/daily-operating/ui/daily-operating-brief.tsx"),
      "utf8",
    );
    const page = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/home/page.tsx"),
      "utf8",
    );
    expect(panel).not.toContain('"use client"');
    expect(page).not.toContain('"use client"');
    expect(page).toContain("result.moduleAccess.navVisibility");
  });
});
