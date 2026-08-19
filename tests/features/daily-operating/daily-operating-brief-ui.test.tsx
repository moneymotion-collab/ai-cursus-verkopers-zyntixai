import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DailyOperatingBriefPanel } from "@/features/daily-operating/ui/daily-operating-brief";
import type { DailyOperatingBrief } from "@/features/daily-operating/domain/compose-daily-operating-brief";

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

describe("DailyOperatingBriefPanel", () => {
  it("renders calm empty state without implying failure", () => {
    const html = renderToStaticMarkup(
      <DailyOperatingBriefPanel
        brief={brief()}
        attentionQueryFailed={false}
        tasksQueryFailed={false}
      />,
    );
    expect(html).toContain("You are clear for now.");
    expect(html).toContain("Nothing urgent needs your attention");
    expect(html).not.toContain("role=\"alert\"");
  });

  it("renders critical Attention and overdue task with actionable links", () => {
    const html = renderToStaticMarkup(
      <DailyOperatingBriefPanel
        brief={brief({
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
        })}
        attentionQueryFailed={false}
        tasksQueryFailed={false}
      />,
    );

    expect(html).toContain("Enrollment stalled");
    expect(html).toContain("Call Ada");
    expect(html).toContain(`href="/attention/a1?org=${ORG}"`);
    expect(html).toContain(`href="/tasks/t1?org=${ORG}"`);
    expect(html).toContain("Severity");
    expect(html).toContain("Critical");
    expect(html).toContain("Overdue");
    expect(html).not.toContain("You are clear for now.");
  });

  it("hides organization Attention for staff roles", () => {
    const html = renderToStaticMarkup(
      <DailyOperatingBriefPanel
        brief={brief({
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
        })}
        attentionQueryFailed={false}
        tasksQueryFailed={false}
      />,
    );
    expect(html).not.toContain("Organization attention");
    expect(html).toContain("Assigned to me — Attention");
    expect(html).toContain("Mine only");
  });

  it("shows honest Attention failure instead of empty success", () => {
    const html = renderToStaticMarkup(
      <DailyOperatingBriefPanel
        brief={brief({ hasAnyActionable: true, dueTodayTasks: [] })}
        attentionQueryFailed={true}
        tasksQueryFailed={false}
      />,
    );
    expect(html).toContain("Unable to load Attention.");
    expect(html).toContain("Attention could not be loaded.");
    expect(html).not.toContain("You are clear for now.");
  });

  it("shows due-today task links and excludes calm empty banner when actionable", () => {
    const html = renderToStaticMarkup(
      <DailyOperatingBriefPanel
        brief={brief({
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
        })}
        attentionQueryFailed={false}
        tasksQueryFailed={false}
      />,
    );
    expect(html).toContain(`href="/tasks/t-today?org=${ORG}"`);
    expect(html).toContain("Due today");
    expect(html).toContain("Prep call");
    expect(html).not.toContain("You are clear for now.");
  });

  it("does not treat fetch failure as empty success for tasks", () => {
    const html = renderToStaticMarkup(
      <DailyOperatingBriefPanel
        brief={brief({ hasAnyActionable: false })}
        attentionQueryFailed={false}
        tasksQueryFailed={true}
      />,
    );
    expect(html).toContain("Unable to load Tasks.");
    expect(html).toContain("Tasks could not be loaded.");
    expect(html).not.toContain("You are clear for now.");
    expect(html).not.toContain("No work is due today.");
  });

  it("exposes semantic headings for keyboard/a11y automation contracts", () => {
    const html = renderToStaticMarkup(
      <DailyOperatingBriefPanel
        brief={brief({ role: "owner", hasAnyActionable: false })}
        attentionQueryFailed={false}
        tasksQueryFailed={false}
      />,
    );
    expect(html).toContain("id=\"organization-attention\"");
    expect(html).toContain("id=\"assigned-to-me-—-attention\"");
    expect(html).toContain("id=\"overdue-work\"");
    expect(html).toContain("id=\"due-today\"");
  });
});
