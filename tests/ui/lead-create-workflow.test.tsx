import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createLeadAction } from "@/features/leads/actions/lead-actions";
import { LeadCreateForm } from "@/features/leads/ui/lead-create-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/leads/actions/lead-actions", () => ({
  createLeadAction: vi.fn(),
}));

const createActionMock = vi.mocked(createLeadAction);

const ownerOptions = {
  members: [{ value: "33333333-3333-4333-8333-333333333333", label: "Taylor Owner" }],
  capped: false,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LeadCreateForm", () => {
  it("renders approved fields without lifecycle or stage inputs", () => {
    const html = renderToStaticMarkup(
      <LeadCreateForm
        organizationId="11111111-1111-4111-8111-111111111111"
        listState={{
          org: "11111111-1111-4111-8111-111111111111",
          archived: false,
          sort: "display_name",
          direction: "asc",
          page: 1,
          pageSize: 25,
        }}
        ownerOptions={ownerOptions}
        cancelHref="/leads"
      />,
    );
    expect(html).toContain("Create lead");
    expect(html).toContain('id="create-lead-display-name"');
    expect(html).toContain("Source type");
    expect(html).toContain("Pursuit label");
    expect(html).toContain("Unassigned");
    expect(html).not.toMatch(/pipeline stage/i);
    expect(html.toLowerCase()).not.toContain("archive");
    expect(html.toLowerCase()).not.toContain("convert");
  });

  it("does not invoke createLeadAction during static render", () => {
    renderToStaticMarkup(
      <LeadCreateForm
        organizationId="11111111-1111-4111-8111-111111111111"
        listState={{ archived: false, sort: "display_name", direction: "asc", page: 1, pageSize: 25 }}
        ownerOptions={ownerOptions}
        cancelHref="/leads"
      />,
    );
    expect(createActionMock).not.toHaveBeenCalled();
  });
});
