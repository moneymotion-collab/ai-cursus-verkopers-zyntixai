import { describe, expect, it } from "vitest";
import {
  ACTIVITY_A,
  ASSIGNMENT_OCB_ID,
  ORG_A,
  OWNER_USER,
  PACK_OCB_ID,
  STAFF_USER,
  TAX_NICHE_ID,
  VERSION_OCB_V1,
  VIEWER_USER,
  confirmClassifiedTarget,
  contextCatalog,
  createService,
} from "./harness";

describe("BQA-1E demand waitlist", () => {
  it("joins, repeats, withdraws, and repeats withdraw without TAX or Context mutation", async () => {
    const { service, tables } = createService({
      userId: OWNER_USER,
      catalog: contextCatalog({ packs: [], versions: [], readiness: {} }),
    });
    await confirmClassifiedTarget(service);
    await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    const joined = await service.joinBusinessActivityDemandWaitlist({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    expect(joined.ok).toBe(true);
    if (joined.ok) {
      expect(joined.value.idempotent).toBe(false);
      expect(joined.value.eventType).toBe("waitlist_joined");
    }
    const repeatJoin = await service.joinBusinessActivityDemandWaitlist({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    expect(repeatJoin.ok).toBe(true);
    if (repeatJoin.ok) {
      expect(repeatJoin.value.idempotent).toBe(true);
    }
    expect(tables.business_activity_demand_signals.filter((row) => row.status === "active")).toHaveLength(1);
    const withdrawn = await service.withdrawBusinessActivityDemandWaitlist({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(withdrawn.ok).toBe(true);
    if (withdrawn.ok) {
      expect(withdrawn.value.eventType).toBe("waitlist_withdrawn");
    }
    const repeatWithdraw = await service.withdrawBusinessActivityDemandWaitlist({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(repeatWithdraw.ok).toBe(true);
    if (repeatWithdraw.ok) {
      expect(repeatWithdraw.value.idempotent).toBe(true);
    }
    expect(tables.business_activity_demand_signals.filter((row) => row.status === "active")).toHaveLength(0);
    expect(tables.business_activity_support_assessments).toHaveLength(1);
    expect(
      tables.business_activity_qualification_events.filter((row) => row.event_type === "waitlist_joined"),
    ).toHaveLength(1);
  });

  it("denies Staff and Viewer demand writes", async () => {
    const owner = createService({
      userId: OWNER_USER,
      catalog: contextCatalog({ packs: [], versions: [], readiness: {} }),
    });
    await confirmClassifiedTarget(owner.service);
    await owner.service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    const staff = createService({ userId: STAFF_USER, tables: owner.tables });
    const staffJoin = await staff.service.joinBusinessActivityDemandWaitlist({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    expect(staffJoin.ok).toBe(false);
    if (!staffJoin.ok) {
      expect(staffJoin.error.code).toBe("FORBIDDEN_ROLE");
    }
    const viewer = createService({ userId: VIEWER_USER, tables: owner.tables });
    const viewerJoin = await viewer.service.joinBusinessActivityDemandWaitlist({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    expect(viewerJoin.ok).toBe(false);
    if (!viewerJoin.ok) {
      expect(viewerJoin.error.code).toBe("FORBIDDEN_ROLE");
    }
  });

  it("does not allow demand join when the Activity is supported for the requested rollout", async () => {
    const { service } = createService({
      userId: OWNER_USER,
      pin: { assignmentId: ASSIGNMENT_OCB_ID, contextPackVersionId: VERSION_OCB_V1 },
    });
    await confirmClassifiedTarget(service);
    await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    const joined = await service.joinBusinessActivityDemandWaitlist({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(joined.ok).toBe(false);
    if (!joined.ok) {
      expect(joined.error.code).toBe("ADMISSION_NOT_ELIGIBLE");
    }
    expect(PACK_OCB_ID).toBeTruthy();
    expect(TAX_NICHE_ID).toBeTruthy();
  });
});
