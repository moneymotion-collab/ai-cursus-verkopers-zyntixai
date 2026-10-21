import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TaskCreatePage from "@/app/(authenticated)/tasks/new/page";
import { mockKnowledgeProductModuleAccess } from "../features/product-access/module-access-fixtures";
import { renderAsyncServerTree } from "../helpers/render-async-server-tree";

const ORG = "02016e91-7237-4a20-aec3-6275d2e8a67f";
const loadTaskCreatePageMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/tasks/ui/load-task-workflow-page", () => ({
  loadTaskCreatePage: loadTaskCreatePageMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({})),
}));

vi.mock("@/features/social-media/server/load-social-primary-nav-visibility", () => ({
  loadSocialPrimaryNavVisibility: vi.fn(async () => false),
}));

const moduleAccess = mockKnowledgeProductModuleAccess();

function primaryNav(html: string): string {
  const start = html.indexOf('aria-label="Primary"');
  const navStart = html.lastIndexOf("<nav", start);
  const navEnd = html.indexOf("</nav>", start);
  return html.slice(navStart, navEnd);
}

describe("blocked task create shell", () => {
  beforeEach(() => {
    loadTaskCreatePageMock.mockResolvedValue({
      kind: "form_blocked",
      message: "No linked records are available to create a task in this organization.",
      listState: {
        status: "open",
        archived: false,
        page: 1,
        pageSize: 25,
        org: ORG,
      },
      organizationOptions: [
        { organizationId: ORG, role: "owner", displayName: "Course seller workspace" },
      ],
      selectedOrganizationId: ORG,
      moduleAccess,
    });
  });

  it("paints the resolved module navigation and keeps the create block", async () => {
    const html = await renderAsyncServerTree(
      await TaskCreatePage({
        searchParams: Promise.resolve({ org: ORG }),
      }),
    );
    const nav = primaryNav(html);

    expect(nav).toContain("Home");
    expect(nav).toContain("Leads");
    expect(nav).toContain("Customers");
    expect(nav).toContain("Programs");
    expect(nav).toContain("Enrollments");
    expect(nav).toContain("Progress");
    expect(nav).toContain("Attention");
    expect(nav).toContain("Tasks");
    expect(nav).toContain("Members");
    expect(nav).not.toContain("Projects");
    expect(nav).not.toContain("Work orders");
    expect(html).toContain("Create task unavailable");
    expect(html).toContain(
      "No linked records are available to create a task in this organization.",
    );
    expect(html).toContain("Back to tasks");
    expect(html).not.toContain("Create task</");
  });
});
