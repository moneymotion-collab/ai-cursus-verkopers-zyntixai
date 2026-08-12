import React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { AppShell } from "@/components/app-shell";
import { TaskListPresentation } from "@/features/tasks/ui/task-list";
import { TaskHistorySection } from "@/features/tasks/ui/task-history";
import { emptyLabelBundle } from "@/features/tasks/ui/resolve-task-display-labels";
import type { TaskListItemReadModel } from "@/features/tasks/domain/read-types";

const listItem: TaskListItemReadModel = {
  id: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  title: "Prepare onboarding",
  status: "open",
  taskType: "general",
  priority: "normal",
  source: "manual",
  dueAt: "2026-07-15T09:00:00.000Z",
  assigneeMemberId: null,
  linkedContext: { kind: "lead", leadId: "44444444-4444-4444-8444-444444444444" },
  archivedAt: null,
  createdAt: "2026-07-10T08:00:00.000Z",
  derived: {
    terminal: false,
    archived: false,
    overdue: false,
    dueToday: false,
    upcoming: true,
    dueState: "upcoming",
  },
};

describe("tasks UI accessibility landmarks", () => {
  it("renders one main landmark and labelled primary navigation in the shell", () => {
    const html = renderToStaticMarkup(
      <AppShell
        membersNavVisible={false}
        organizationOptions={[
          { organizationId: "02016e91-7237-4a20-aec3-6275d2e8a67f", role: "owner", displayName: "Org Alpha" },
          { organizationId: "e6e4c376-697c-4863-bb30-fd52b7256ff9", role: "staff", displayName: "Org Beta" },
        ]}
        selectedOrganizationId="02016e91-7237-4a20-aec3-6275d2e8a67f"
      >
        <h1>Tasks</h1>
      </AppShell>,
    );
    expect(html.match(/<main\b/g)?.length).toBe(1);
    expect(html).toContain('id="main-content"');
    expect(html).toContain('aria-label="Primary"');
    expect(html).toContain('for="organization-selector"');
    expect(html).toContain("Organization");
    expect(html.replace(/value="[^"]*"/g, "")).not.toContain("02016e91-7237-4a20-aec3-6275d2e8a67f");
    expect(html).toContain("Org Alpha");
  });

  it("renders semantic table headers and mobile card list", () => {
    const html = renderToStaticMarkup(
      <TaskListPresentation
        tasks={[listItem]}
        timeZone="UTC"
        listState={{ status: "open", archived: false, page: 1, pageSize: 25 }}
        labels={{
          ...emptyLabelBundle(),
          leads: { "44444444-4444-4444-8444-444444444444": "Acme Lead" },
        }}
        emptyTitle="No tasks"
        emptyDescription="None"
      />,
    );
    expect(html).toContain('scope="col"');
    expect(html).toContain('aria-label="Tasks"');
    expect(html).toContain("Acme Lead");
    expect(html.replace(/value="[^"]*"/g, "")).not.toContain("44444444-4444-4444-8444-444444444444");
  });

  it("renders ordered status history list", () => {
    const html = renderToStaticMarkup(
      <TaskHistorySection
        history={[
          {
            id: "hist-1",
            transitionLabel: "Task created",
            fromStatusLabel: null,
            toStatusLabel: "Open",
            actorLabel: "Alex Morgan",
            sourceLabel: "Manual",
            reason: null,
            timestampLabel: "Jul 10, 2026, 8:00 AM UTC",
          },
        ]}
        historyState={{ kind: "ready" }}
      />,
    );
    expect(html).toContain("<ol");
    expect(html).toContain('aria-label="Task status history"');
    expect(html).toContain("Task created");
  });
});

describe("tasks UI focus-visible contract", () => {
  it("includes focus-visible styles in shell and list CSS modules", () => {
    const root = path.resolve(process.cwd());
    const shellCss = readFileSync(path.join(root, "src/components/app-shell.module.css"), "utf8");
    const listCss = readFileSync(path.join(root, "src/features/tasks/ui/task-list.module.css"), "utf8");
    expect(shellCss).toContain(":focus-visible");
    expect(listCss).toContain(":focus-visible");
  });
});
