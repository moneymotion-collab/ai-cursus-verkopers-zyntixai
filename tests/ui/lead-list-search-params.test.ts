import { describe, expect, it } from "vitest";
import {
  buildLeadListQueryString,
  canViewArchivedLeadFilter,
  parseLeadListSearchParams,
  LEAD_OWNER_UNASSIGNED_VALUE,
} from "@/features/leads/ui/lead-list-search-params";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
const STAGE_ID = "44444444-4444-4444-8444-444444444444";

describe("parseLeadListSearchParams", () => {
  it("applies defaults and normalizes search", () => {
    const parsed = parseLeadListSearchParams(
      { org: ORG_ID, q: "  prospect@test.com  " },
      { role: "staff" },
    );

    expect(parsed.urlState.org).toBe(ORG_ID);
    expect(parsed.listInput.filters.search).toBe("prospect@test.com");
    expect(parsed.urlState.page).toBe(1);
    expect(parsed.urlState.pageSize).toBe(25);
  });

  it("rejects archived filter for staff", () => {
    const parsed = parseLeadListSearchParams(
      { org: ORG_ID, archived: "true" },
      { role: "staff" },
    );

    expect(parsed.urlState.archived).toBe(false);
    expect(parsed.warnings).toContain("archived_not_allowed");
  });

  it("allows archived filter for owner", () => {
    const parsed = parseLeadListSearchParams(
      { org: ORG_ID, archived: "true" },
      { role: "owner" },
    );

    expect(parsed.urlState.archived).toBe(true);
    expect(canViewArchivedLeadFilter("owner")).toBe(true);
    expect(canViewArchivedLeadFilter("viewer")).toBe(false);
  });

  it("maps stage, owner and invalid values safely", () => {
    const withStage = parseLeadListSearchParams(
      { org: ORG_ID, stage: STAGE_ID },
      { role: "admin", stageOptions: [STAGE_ID] },
    );
    expect(withStage.urlState.stageId).toBe(STAGE_ID);

    const unassigned = parseLeadListSearchParams(
      { org: ORG_ID, owner: LEAD_OWNER_UNASSIGNED_VALUE },
      { role: "admin" },
    );
    expect(unassigned.listInput.filters.ownerIsUnassigned).toBe(true);

    const invalidOwner = parseLeadListSearchParams(
      { org: ORG_ID, owner: "not-a-uuid" },
      { role: "admin", ownerOptions: [MEMBER_ID] },
    );
    expect(invalidOwner.urlState.owner).toBeUndefined();
    expect(invalidOwner.warnings).toContain("invalid_owner");
  });

  it("builds query string preserving filters and pagination", () => {
    const query = buildLeadListQueryString({
      org: ORG_ID,
      status: "open",
      stageId: STAGE_ID,
      owner: MEMBER_ID,
      q: "prospect",
      archived: true,
      sort: "updated_at",
      direction: "desc",
      page: 2,
      pageSize: 50,
    });

    expect(query).toContain(`org=${ORG_ID}`);
    expect(query).toContain("status=open");
    expect(query).toContain(`stage=${STAGE_ID}`);
    expect(query).toContain(`owner=${MEMBER_ID}`);
    expect(query).toContain("q=prospect");
    expect(query).toContain("archived=true");
    expect(query).toContain("sort=updated_at");
    expect(query).toContain("direction=desc");
    expect(query).toContain("page=2");
    expect(query).toContain("pageSize=50");
  });
});
