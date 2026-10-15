import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createTaskAction } from "@/features/tasks/actions/editable-task-actions";
import { TaskCreateForm } from "@/features/tasks/ui/task-create-form";
import { emptyTaskFormOptions } from "@/features/tasks/ui/load-task-form-options";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import {
  FIELD_MODULE_NAV_VISIBILITY,
  FIELD_PRODUCT_TERMINOLOGY,
  KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY,
  SERVICE_MODULE_NAV_VISIBILITY,
  SERVICE_PRODUCT_TERMINOLOGY,
} from "../features/product-access/module-access-fixtures";

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

  it("shows field context options for visible modules and labels the project context as Job", () => {
    const html = renderToStaticMarkup(
      <TaskCreateForm
        organizationId="22222222-2222-4222-8222-222222222222"
        timeZone="UTC"
        listState={{ status: "open", archived: false, page: 1, pageSize: 25 }}
        options={{
          ...options,
          customers: [{ value: "55555555-5555-4555-8555-555555555555", label: "Field client" }],
          enrollments: [{
            value: "66666666-6666-4666-8666-666666666666",
            label: "Hidden enrollment",
            customerId: "55555555-5555-4555-8555-555555555555",
            programId: "77777777-7777-4777-8777-777777777777",
          }],
          projects: [{ value: "88888888-8888-4888-8888-888888888888", label: "Field job" }],
        }}
        cancelHref="/tasks"
        navVisibility={FIELD_MODULE_NAV_VISIBILITY}
        terminology={FIELD_PRODUCT_TERMINOLOGY}
      />,
    );

    expect(html).toContain('value="lead"');
    expect(html).toContain(">Lead</option>");
    expect(html).toContain('value="customer"');
    expect(html).toContain(">Customer</option>");
    expect(html).toContain('value="project"');
    expect(html).toContain(">Job</option>");
    expect(html).not.toContain('value="enrollment"');
    expect(html).not.toContain(">Enrollment</option>");
    expect(html).not.toContain(">Project</option>");
  });

  it("keeps service, knowledge, and product context options that their modules allow", () => {
    const populated = {
      ...options,
      customers: [{ value: "55555555-5555-4555-8555-555555555555", label: "Acme Customer" }],
      enrollments: [{
        value: "66666666-6666-4666-8666-666666666666",
        label: "Acme Enrollment",
        customerId: "55555555-5555-4555-8555-555555555555",
        programId: "77777777-7777-4777-8777-777777777777",
      }],
      projects: [{ value: "88888888-8888-4888-8888-888888888888", label: "Acme Project" }],
    };
    const listState = { status: "open" as const, archived: false, page: 1, pageSize: 25 };
    const service = renderToStaticMarkup(
      <TaskCreateForm
        organizationId="22222222-2222-4222-8222-222222222222"
        timeZone="UTC"
        listState={listState}
        options={populated}
        cancelHref="/tasks"
        navVisibility={SERVICE_MODULE_NAV_VISIBILITY}
        terminology={SERVICE_PRODUCT_TERMINOLOGY}
      />,
    );
    expect(service).toContain('value="lead"');
    expect(service).toContain(">Lead</option>");
    expect(service).toContain('value="customer"');
    expect(service).toContain(">Client</option>");
    expect(service).toContain('value="project"');
    expect(service).toContain(">Project</option>");
    expect(service).not.toContain('value="enrollment"');

    const knowledge = renderToStaticMarkup(
      <TaskCreateForm
        organizationId="22222222-2222-4222-8222-222222222222"
        timeZone="UTC"
        listState={listState}
        options={populated}
        cancelHref="/tasks"
        navVisibility={KNOWLEDGE_OCB_MODULE_NAV_VISIBILITY}
      />,
    );
    expect(knowledge).toContain('value="lead"');
    expect(knowledge).toContain(">Lead</option>");
    expect(knowledge).toContain('value="customer"');
    expect(knowledge).toContain(">Customer</option>");
    expect(knowledge).toContain('value="enrollment"');
    expect(knowledge).toContain(">Enrollment</option>");
    expect(knowledge).not.toContain('value="project"');

    const product = renderToStaticMarkup(
      <TaskCreateForm
        organizationId="22222222-2222-4222-8222-222222222222"
        timeZone="UTC"
        listState={listState}
        options={populated}
        cancelHref="/tasks"
        navVisibility={operatingModelNavVisibility("product_operations")}
      />,
    );
    expect(product).toContain('value="customer"');
    expect(product).toContain(">Customer</option>");
    expect(product).not.toContain('value="lead"');
    expect(product).not.toContain('value="enrollment"');
    expect(product).not.toContain('value="project"');
  });
});
