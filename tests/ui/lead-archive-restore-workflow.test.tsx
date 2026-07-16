import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadArchiveForm } from "@/features/leads/ui/lead-archive-form";
import { LeadRestoreForm } from "@/features/leads/ui/lead-restore-form";
import { archivedLeadDetail, sampleLeadDetail } from "../helpers/lead-mutation-mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const listState = {
  org: sampleLeadDetail.organizationId,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("LeadArchiveForm", () => {
  it("states archive is not deletion and preserves lifecycle state", () => {
    const html = renderToStaticMarkup(
      <LeadArchiveForm
        organizationId={sampleLeadDetail.organizationId}
        lead={sampleLeadDetail}
        role="owner"
        listState={listState}
        backHref={`/leads/${sampleLeadDetail.id}`}
      />,
    );
    expect(html).toContain("Archive lead");
    expect(html).toContain("Archive is not deletion");
    expect(html).toContain("Lead status remains Open");
    expect(html).not.toContain("permanently delete");
  });
});

describe("LeadRestoreForm", () => {
  it("requires archived lead and preserves status and stage", () => {
    const html = renderToStaticMarkup(
      <LeadRestoreForm
        organizationId={archivedLeadDetail.organizationId}
        lead={archivedLeadDetail}
        listState={listState}
        backHref={`/leads/${archivedLeadDetail.id}`}
      />,
    );
    expect(html).toContain("Restore lead");
    expect(html).toContain("Lead status remains Open");
    expect(html).toContain("Pipeline stage remains New");
    expect(html).toContain("Conversion relationships are unchanged");
  });
});
