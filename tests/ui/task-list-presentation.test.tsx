import React from "react";

import { describe, expect, it } from "vitest";

import { renderToStaticMarkup } from "react-dom/server";

import { Alert } from "@/components/ui/alert";

import { Pagination } from "@/components/ui/pagination";

import { TaskListPresentation } from "@/features/tasks/ui/task-list";

import type { TaskListItemReadModel } from "@/features/tasks/domain/read-types";

import { emptyLabelBundle } from "@/features/tasks/ui/resolve-task-display-labels";
import { presentationContainsUuid } from "@/features/tasks/ui/task-presentation";



const task: TaskListItemReadModel = {

  id: "11111111-1111-4111-8111-111111111111",

  organizationId: "22222222-2222-4222-8222-222222222222",

  title: "Prepare onboarding checklist",

  status: "open",

  taskType: "general",

  priority: "high",

  source: "manual",

  dueAt: "2026-07-15T09:00:00.000Z",

  assigneeMemberId: null,

  linkedContext: { kind: "customer", customerId: "44444444-4444-4444-8444-444444444444" },

  archivedAt: null,

  createdAt: "2026-07-10T08:00:00.000Z",

  derived: {

    terminal: false,

    archived: false,

    overdue: true,

    dueToday: false,

    upcoming: false,

    dueState: "overdue",

  },

};



const labels = {

  ...emptyLabelBundle(),

  customers: { "44444444-4444-4444-8444-444444444444": "Acme Customer" },

};



const listState = {

  org: "22222222-2222-4222-8222-222222222222",

  status: "open" as const,

  archived: false,

  page: 2,

  pageSize: 25,

};



describe("TaskListPresentation rendering", () => {

  it("renders semantic table headings on desktop markup", () => {

    const html = renderToStaticMarkup(

      <TaskListPresentation

        tasks={[task]}

        timeZone="UTC"

        listState={listState}

        labels={labels}

        emptyTitle="No tasks"

        emptyDescription="None"

      />,

    );

    expect(html).toContain("<table");

    expect(html).toContain('scope="col"');

    expect(html).toContain("Prepare onboarding checklist");
    expect(presentationContainsUuid(html.replace(/href="[^"]*"/g, ""))).toBe(false);
  });



  it("renders mobile card list semantics with resolved labels and detail links", () => {

    const html = renderToStaticMarkup(

      <TaskListPresentation

        tasks={[task]}

        timeZone="UTC"

        listState={listState}

        labels={labels}

        emptyTitle="No tasks"

        emptyDescription="None"

      />,

    );

    expect(html).toContain('aria-label="Tasks"');

    expect(html).toContain("Acme Customer");

    expect(html).toContain("Unassigned");

    expect(html).toContain("/tasks/11111111-1111-4111-8111-111111111111");

    expect(html).toContain("page=2");

  });



  it("renders filtered empty state with clear action", () => {

    const html = renderToStaticMarkup(

      <TaskListPresentation

        tasks={[]}

        timeZone="UTC"

        listState={listState}

        labels={labels}

        emptyTitle="No tasks match the selected filters."

        emptyDescription="Try adjusting filters."

        clearFiltersHref="/tasks"

      />,

    );

    expect(html).toContain("No tasks match the selected filters.");

    expect(html).toContain('href="/tasks"');

  });



  it("does not render mutation controls or assignee filter", () => {

    const html = renderToStaticMarkup(

      <TaskListPresentation

        tasks={[task]}

        timeZone="UTC"

        listState={listState}

        labels={labels}

        emptyTitle="No tasks"

        emptyDescription="None"

      />,

    );

    expect(html.toLowerCase()).not.toContain("create task");

    expect(html.toLowerCase()).not.toContain("complete");

    expect(html.toLowerCase()).not.toContain("archive");

    expect(html.toLowerCase()).not.toContain("assignee filter");

  });

});



describe("shared UI primitives", () => {

  it("renders accessible pagination labels", () => {

    const html = renderToStaticMarkup(

      <Pagination page={2} totalPages={4} previousHref="/tasks?page=1" nextHref="/tasks?page=3" />,

    );

    expect(html).toContain('aria-label="Task list pagination"');

    expect(html).toContain("Previous page");

    expect(html).toContain("Next page");

    expect(html).toContain("Page 2 of 4");

  });



  it("renders alert with role=alert for errors", () => {

    const html = renderToStaticMarkup(

      <Alert title="Unable to load tasks" variant="error">

        Safe application message.

      </Alert>,

    );

    expect(html).toContain('role="alert"');

    expect(html).toContain("Unable to load tasks");

  });

});

