import { describe, expect, it } from "vitest";
import {
  ACTIVITY_A,
  ORG_A,
  OWNER_USER,
  createService,
} from "./harness";

describe("BQA-1D repository tenant honesty", () => {
  it("does not return a qualification for a different Activity", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    await service.ensureBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(tables.business_activity_qualifications).toHaveLength(1);
    const missing = await service.getBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    });
    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("ACTIVITY_NOT_FOUND");
    }
  });
});
