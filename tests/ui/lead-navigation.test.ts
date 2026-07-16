import { describe, expect, it } from "vitest";
import {
  buildBackToLeadsHref,
  buildCustomerDetailHrefFromLead,
  buildLeadArchiveHref,
  buildLeadConvertHref,
  buildLeadCreateHref,
  buildLeadDetailHref,
  buildLeadEditHref,
  buildLeadRestoreHref,
  buildLeadStageHref,
  buildLeadStatusHref,
  buildTaskDetailHrefFromLead,
} from "@/features/leads/ui/lead-navigation";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const LEAD_ID = "22222222-2222-4222-8222-222222222222";
const CUSTOMER_ID = "33333333-3333-4333-8333-333333333333";
const TASK_ID = "44444444-4444-4444-8444-444444444444";

const listState = {
  org: ORG_ID,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

describe("lead navigation helpers", () => {
  it("builds list, detail and create hrefs with query state", () => {
    expect(buildBackToLeadsHref(listState)).toBe(`/leads?org=${ORG_ID}`);
    expect(buildLeadDetailHref(LEAD_ID, listState)).toBe(`/leads/${LEAD_ID}?org=${ORG_ID}`);
    expect(buildLeadCreateHref(listState)).toBe(`/leads/new?org=${ORG_ID}`);
  });

  it("builds cross-feature detail links with organization context", () => {
    expect(buildCustomerDetailHrefFromLead(CUSTOMER_ID, ORG_ID)).toBe(
      `/customers/${CUSTOMER_ID}?org=${ORG_ID}`,
    );
    expect(buildTaskDetailHrefFromLead(TASK_ID, ORG_ID)).toBe(
      `/tasks/${TASK_ID}?org=${ORG_ID}`,
    );
  });

  it("builds lifecycle workflow hrefs with query state", () => {
    expect(buildLeadEditHref(LEAD_ID, listState)).toBe(`/leads/${LEAD_ID}/edit?org=${ORG_ID}`);
    expect(buildLeadStageHref(LEAD_ID, listState)).toBe(`/leads/${LEAD_ID}/stage?org=${ORG_ID}`);
    expect(buildLeadStatusHref(LEAD_ID, listState)).toBe(`/leads/${LEAD_ID}/status?org=${ORG_ID}`);
    expect(buildLeadConvertHref(LEAD_ID, listState)).toBe(`/leads/${LEAD_ID}/convert?org=${ORG_ID}`);
    expect(buildLeadArchiveHref(LEAD_ID, listState)).toBe(`/leads/${LEAD_ID}/archive?org=${ORG_ID}`);
    expect(buildLeadRestoreHref(LEAD_ID, listState)).toBe(`/leads/${LEAD_ID}/restore?org=${ORG_ID}`);
  });
});
