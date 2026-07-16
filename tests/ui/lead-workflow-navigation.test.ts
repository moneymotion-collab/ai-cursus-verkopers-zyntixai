import { describe, expect, it } from "vitest";
import {
  buildLeadArchiveHref,
  buildLeadConvertHref,
  buildLeadEditHref,
  buildLeadRestoreHref,
  buildLeadStageHref,
  buildLeadStatusHref,
} from "@/features/leads/ui/lead-navigation";
import { buildLeadArchiveSuccessHref } from "@/features/leads/ui/lead-archive-navigation";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("lead workflow navigation", () => {
  it("preserves organization query on workflow hrefs", () => {
    expect(buildLeadEditHref(LEAD_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildLeadStageHref(LEAD_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildLeadStatusHref(LEAD_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildLeadConvertHref(LEAD_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildLeadArchiveHref(LEAD_ID, listState)).toContain(`org=${ORG_ID}`);
    expect(buildLeadRestoreHref(LEAD_ID, listState)).toContain(`org=${ORG_ID}`);
  });

  it("targets approved workflow route paths", () => {
    expect(buildLeadEditHref(LEAD_ID, listState)).toContain(`/leads/${LEAD_ID}/edit`);
    expect(buildLeadStageHref(LEAD_ID, listState)).toContain(`/leads/${LEAD_ID}/stage`);
    expect(buildLeadStatusHref(LEAD_ID, listState)).toContain(`/leads/${LEAD_ID}/status`);
    expect(buildLeadConvertHref(LEAD_ID, listState)).toContain(`/leads/${LEAD_ID}/convert`);
    expect(buildLeadArchiveHref(LEAD_ID, listState)).toContain(`/leads/${LEAD_ID}/archive`);
    expect(buildLeadRestoreHref(LEAD_ID, listState)).toContain(`/leads/${LEAD_ID}/restore`);
  });

  it("routes archive success to detail for owner and list for staff", () => {
    expect(buildLeadArchiveSuccessHref(LEAD_ID, listState, "owner")).toBe(
      `/leads/${LEAD_ID}?org=${ORG_ID}`,
    );
    expect(buildLeadArchiveSuccessHref(LEAD_ID, listState, "staff")).toBe(`/leads?org=${ORG_ID}`);
  });
});
