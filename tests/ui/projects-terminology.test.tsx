import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type {
  ProjectPageContext,
  ProjectRecord,
} from "@/features/projects/domain/types";
import { ProjectList } from "@/features/projects/ui/project-views";
import type { ProductTerminology } from "@/features/product-access/domain/terminology";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";

function context(terminology: ProductTerminology): ProjectPageContext {
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
      { organizationId: ORG_ID, role: "staff", displayName: "Delivery Org" },
    ],
    role: "staff",
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
