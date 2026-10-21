import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LeadListPresentation } from "@/features/leads/ui/lead-list";
import { FirstValueChecklistPanel } from "@/features/onboarding/ui/first-value-checklist-panel";
import type { FirstValueChecklistViewModel } from "@/features/onboarding/domain/first-value-checklist";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/features/onboarding/actions/onboarding-actions", () => ({
  dismissFirstValueChecklistAction: vi.fn(),
}));

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";
const STAGE_ID = "44444444-4444-4444-8444-444444444444";

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

const sampleLead = {
  id: LEAD_ID,
  organizationId: ORG_ID,
  displayName: "Prospect Co",
  status: "open" as const,
  statusLabel: "Open",
  email: "ops@prospect.test",
  ownerMemberId: null,
  ownerLabel: "Unassigned",
  stageId: STAGE_ID,
  stageName: "New",
  stageCategory: "new" as const,
  stageCategoryLabel: "New",
  sourceType: "manual",
  pursuitLabel: null,
  convertedCustomerId: null,
  convertedAt: null,
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  archivedAt: null,
  derived: { isArchived: false, isConverted: false, isConvertible: true },
};

const visibleChecklist: FirstValueChecklistViewModel = {
  visible: true,
  organizationId: ORG_ID,
  completedCount: 1,
  totalRequired: 3,
  companySetupComplete: true,
  firstLeadComplete: false,
  firstTaskComplete: false,
  companySetupHref: `/onboarding?org=${ORG_ID}`,
  firstLeadHref: `/leads/new?org=${ORG_ID}`,
  firstTaskHref: `/tasks/new?org=${ORG_ID}`,
  customerSoftLinkHref: `/customers?org=${ORG_ID}`,
};

describe("B1.4 leads empty-state CTA", () => {
  it("renders Add your first lead CTA with create destination", () => {
    const html = renderToStaticMarkup(
      <LeadListPresentation
        leads={[]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No leads are available."
        emptyDescription="Add your first lead to start organizing your pipeline."
        emptyActionHref={`/leads/new?org=${ORG_ID}`}
        emptyActionLabel="Add your first lead"
      />,
    );

    expect(html).toContain("Add your first lead");
    expect(html).toContain(`href="/leads/new?org=${ORG_ID}"`);
    expect(html).toContain("No leads are available.");
  });

  it("omits create CTA for viewer empty state", () => {
    const html = renderToStaticMarkup(
      <LeadListPresentation
        leads={[]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No leads are available."
        emptyDescription="Leads in your organization will appear here."
      />,
    );

    expect(html).not.toContain("Add your first lead");
    expect(html).not.toContain(`/leads/new?org=${ORG_ID}`);
  });

  it("keeps non-empty lead list presentation unchanged", () => {
    const html = renderToStaticMarkup(
      <LeadListPresentation
        leads={[sampleLead]}
        timeZone="UTC"
        listState={listState}
        emptyTitle="No leads are available."
        emptyDescription="Add your first lead to start organizing your pipeline."
        emptyActionHref={`/leads/new?org=${ORG_ID}`}
        emptyActionLabel="Add your first lead"
      />,
    );

    expect(html).toContain("Prospect Co");
    expect(html).toContain(`href="/leads/${LEAD_ID}?org=${ORG_ID}"`);
    expect(html).toContain("<th scope=\"col\">Lead</th>");
    expect(html).not.toContain("Add your first lead");
    expect(html).not.toContain("No leads are available.");
  });
});

describe("B1.4 checklist panel soft link", () => {
  it("renders customer soft link while checklist is visible", () => {
    const html = renderToStaticMarkup(
      <FirstValueChecklistPanel checklist={visibleChecklist} />,
    );

    expect(html).toContain("Get your first results");
    expect(html).toContain("1 of 3 complete");
    expect(html).toContain("Review customer workspace");
    expect(html).toContain(`href="/customers?org=${ORG_ID}"`);
    expect(html).toContain(`href="/leads/new?org=${ORG_ID}"`);
    expect(html).toContain(`href="/tasks/new?org=${ORG_ID}"`);
    expect(html).toContain("Dismiss checklist");
  });

  it("renders nothing when checklist is not visible", () => {
    const html = renderToStaticMarkup(
      <FirstValueChecklistPanel
        checklist={{ ...visibleChecklist, visible: false }}
      />,
    );
    expect(html).toBe("");
  });
});
