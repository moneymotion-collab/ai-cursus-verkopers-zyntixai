import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));
import type {
  ProjectPageContext,
  ProjectRecord,
  ProjectRole,
  ProjectTask,
} from "@/features/projects/domain/types";
import { ProjectDetail, ProjectList } from "@/features/projects/ui/project-views";
import type { ProductTerminology } from "@/features/product-access/domain/terminology";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";

function context(
  terminology: ProductTerminology,
  role: ProjectRole = "staff",
): ProjectPageContext {
  const navVisibility = {
    home: true,
    leads: true,
    customers: true,
    projects: true,
    programs: false,
    enrollments: false,
    progress: false,
    attention: true,
    tasks: true,
    members: true,
  };
  return {
    organizationId: ORG_ID,
    organizationName: "Delivery Org",
    organizationOptions: [
      { organizationId: ORG_ID, role, displayName: "Delivery Org" },
    ],
    role,
    terminology,
    moduleAccess: {
      resolution: "resolved",
      navVisibility,
      relevantCapabilities: [],
      terminology,
    },
  };
}

const project: ProjectRecord = {
  id: PROJECT_ID,
  organizationId: ORG_ID,
  customerId: "33333333-3333-4333-8333-333333333333",
  customerLabel: "Acme",
  name: "Delivery rollout",
  summary: null,
  status: "planned",
  ownerMemberId: null,
  ownerLabel: null,
  plannedStart: "2026-09-05",
  plannedEnd: "2026-09-06",
  archivedAt: null,
  createdAt: "2026-09-05T10:00:00.000Z",
  updatedAt: "2026-09-05T10:00:00.000Z",
};

function render(terminology: ProductTerminology): string {
  return renderToStaticMarkup(
    <ProjectList
      context={context(terminology)}
      projects={[project]}
      filters={{ search: "", archived: false }}
    />,
  );
}

const tasks: ProjectTask[] = [
  { id: "task-open", title: "Draft wireframes", status: "open", dueAt: null },
  {
    id: "task-overdue",
    title: "Ship staging build",
    status: "open",
    dueAt: "2020-01-01T00:00:00.000Z",
  },
  { id: "task-done", title: "Kickoff call", status: "completed", dueAt: null },
];

describe("Project detail Task continuity and delivery visibility (TG2-AGENCY-SLICE)", () => {
  it("shows a New task link and an outstanding/completed/overdue summary for editors", () => {
    const html = renderToStaticMarkup(
      <ProjectDetail
        context={context(
          { customer: { singular: "Client", plural: "Clients" }, project: { singular: "Project", plural: "Projects" } },
          "staff",
        )}
        project={project}
        tasks={tasks}
        tasksWarning={null}
      />,
    );

    expect(html).toContain("New task");
    expect(html).toContain(
      `href="/tasks/new?org=${encodeURIComponent(ORG_ID)}&amp;projectId=${encodeURIComponent(PROJECT_ID)}"`,
    );
    expect(html).toContain("2 outstanding");
    expect(html).toContain("1 completed");
    expect(html).toContain("1 overdue");
    expect(html).toContain("Draft wireframes");
    expect(html).toContain("Overdue");
  });

  it("hides New task for viewers but still shows the task list and status", () => {
    const html = renderToStaticMarkup(
      <ProjectDetail
        context={context(
          { customer: { singular: "Client", plural: "Clients" }, project: { singular: "Project", plural: "Projects" } },
          "viewer",
        )}
        project={project}
        tasks={tasks}
        tasksWarning={null}
      />,
    );

    expect(html).not.toContain("New task");
    expect(html).toContain("Kickoff call");
  });

  it("gates the Attention evaluate control to owner/admin and hides it for staff/viewer", () => {
    const ownerHtml = renderToStaticMarkup(
      <ProjectDetail
        context={context(
          { customer: { singular: "Client", plural: "Clients" }, project: { singular: "Project", plural: "Projects" } },
          "owner",
        )}
        project={project}
        tasks={tasks}
        tasksWarning={null}
      />,
    );
    expect(ownerHtml).toContain("Evaluate project Attention");

    const staffHtml = renderToStaticMarkup(
      <ProjectDetail
        context={context(
          { customer: { singular: "Client", plural: "Clients" }, project: { singular: "Project", plural: "Projects" } },
          "staff",
        )}
        project={project}
        tasks={tasks}
        tasksWarning={null}
      />,
    );
    expect(staffHtml).not.toContain("Evaluate project Attention");
  });

  it("works identically under Field (Job) terminology, proving no Agency-only contamination", () => {
    const html = renderToStaticMarkup(
      <ProjectDetail
        context={context(
          { customer: { singular: "Customer", plural: "Customers" }, project: { singular: "Job", plural: "Jobs" } },
          "staff",
        )}
        project={project}
        tasks={tasks}
        tasksWarning={null}
      />,
    );

    expect(html).toContain("New task");
    expect(html).toContain("2 outstanding");
    expect(html).not.toContain("New project");
  });
});

describe("target-aware Projects UI copy", () => {
  it("uses Project and Client copy for Service organizations", () => {
    const html = render({
      customer: { singular: "Client", plural: "Clients" },
      project: { singular: "Project", plural: "Projects" },
    });

    expect(html).toContain("<h1>Projects</h1>");
    expect(html).toContain(">New project<");
    expect(html).toContain('aria-label="Projects filters"');
    expect(html).toContain("<th>Project</th><th>Client</th>");
    expect(html).not.toContain(">New job<");
  });

  it("uses Job and Customer copy for Field organizations", () => {
    const html = render({
      customer: { singular: "Customer", plural: "Customers" },
      project: { singular: "Job", plural: "Jobs" },
    });

    expect(html).toContain("<h1>Jobs</h1>");
    expect(html).toContain(">New job<");
    expect(html).toContain('aria-label="Jobs filters"');
    expect(html).toContain("<th>Job</th><th>Customer</th>");
    expect(html).not.toContain(">New project<");
  });
});
