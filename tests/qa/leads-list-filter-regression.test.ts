import { describe, expect, it } from "vitest";
import { MAX_LEAD_PAGE_SIZE } from "@/features/leads/domain/read-types";
import { parseLeadListSearchParams } from "@/features/leads/ui/lead-list-search-params";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
const STAGE_ID = "44444444-4444-4444-8444-444444444444";

describe("leads list filter regression", () => {
  it("combines status, stage and owner filters safely", () => {
    const parsed = parseLeadListSearchParams(
      {
        org: ORG_ID,
        status: "open",
        stage: STAGE_ID,
        owner: MEMBER_ID,
        page: "3",
      },
      { role: "owner", stageOptions: [STAGE_ID], ownerOptions: [MEMBER_ID] },
    );

    expect(parsed.listInput.filters.status).toBe("open");
    expect(parsed.urlState.stageId).toBe(STAGE_ID);
    expect(parsed.urlState.owner).toBe(MEMBER_ID);
    expect(parsed.urlState.page).toBe(3);
  });

  it("normalizes invalid page values and preserves valid filters", () => {
    const parsed = parseLeadListSearchParams(
      { org: ORG_ID, q: "prospect", page: "0", pageSize: "999" },
      { role: "admin" },
    );

    expect(parsed.urlState.page).toBe(1);
    expect(parsed.urlState.pageSize).toBe(MAX_LEAD_PAGE_SIZE);
    expect(parsed.listInput.filters.search).toBe("prospect");
  });

  it("keeps archived filter owner-only and blocks staff visibility", () => {
    const staff = parseLeadListSearchParams({ org: ORG_ID, archived: "true" }, { role: "staff" });
    const owner = parseLeadListSearchParams({ org: ORG_ID, archived: "true" }, { role: "owner" });

    expect(staff.urlState.archived).toBe(false);
    expect(owner.urlState.archived).toBe(true);
  });
});
