import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createTaskAction } from "@/features/tasks/actions/editable-task-actions";
import { TaskCreateForm } from "@/features/tasks/ui/task-create-form";
import { emptyTaskFormOptions } from "@/features/tasks/ui/load-task-form-options";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/tasks/actions/editable-task-actions", () => ({
  createTaskAction: vi.fn(),
}));

const createActionMock = vi.mocked(createTaskAction);

const options = {
  ...emptyTaskFormOptions(),
  leads: [{ value: "44444444-4444-4444-8444-444444444444", label: "Acme Lead" }],
  customers: [],
  enrollments: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TaskCreateForm", () => {
  it("renders create form without lifecycle controls", () => {
    const html = renderToStaticMarkup(
      <TaskCreateForm
        organizationId="22222222-2222-4222-8222-222222222222"
        timeZone="UTC"
        listState={{ status: "open", archived: false, page: 1, pageSize: 25, org: "22222222-2222-4222-8222-222222222222" }}
        options={options}
        cancelHref="/tasks"
      />,
    );
    expect(html).toContain("Create task");
    expect(html).toContain("Acme Lead");
    expect(html.toLowerCase()).not.toContain("complete");
    expect(html.toLowerCase()).not.toContain("archive");
  });

  it("invokes createTaskAction once through submit handler contract", async () => {
    createActionMock.mockResolvedValue({
      ok: true,
      taskId: "11111111-1111-4111-8111-111111111111",
      task: {} as never,
      committed: true,
      refreshRequired: false,
      refreshHints: { task: true, taskLists: true, taskHistory: true },
    });

    const html = renderToStaticMarkup(
      <TaskCreateForm
        organizationId="22222222-2222-4222-8222-222222222222"
        timeZone="UTC"
        listState={{ status: "open", archived: false, page: 1, pageSize: 25 }}
        options={options}
        cancelHref="/tasks"
      />,
    );
    expect(html).toContain('id="create-title"');
    expect(createActionMock).not.toHaveBeenCalled();
  });
});
