import { describe, expect, it } from "vitest";
import {
  ACTIVITY_A,
  ORG_A,
  OWNER_USER,
  createService,
  saveRequiredAnswers,
  TAX_NICHE_ID,
  contextCatalog,
} from "./harness";

describe("BQA-1D transaction failure", () => {
  it("rolls back qualification creation when the event write fails", async () => {
    const { service, tables } = createService({
      userId: OWNER_USER,
      mutationOptions: { failAfter: "event" },
    });
    const result = await service.ensureBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(result.ok).toBe(false);
    expect(tables.business_activity_qualifications).toHaveLength(0);
    expect(tables.business_activity_qualification_events).toHaveLength(0);
  });

  it("rolls back an answer write when the later event fails", async () => {
    const { service, tables } = createService({
      userId: OWNER_USER,
      mutationOptions: { failAfter: "event" },
    });
    const result = await service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "activity_description",
      valueText: "Should not persist",
    });
    expect(result.ok).toBe(false);
    expect(tables.business_activity_qualification_answers).toHaveLength(0);
    expect(tables.business_activity_qualifications).toHaveLength(0);
  });

  it("does not leave a proposed decision without its event", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    const failing = createService({
      userId: OWNER_USER,
      tables,
      mutationOptions: { failAfter: "event" },
    });
    const before = tables.business_activity_classification_decisions.length;
    const result = await failing.service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
    });
    expect(result.ok).toBe(false);
    expect(tables.business_activity_classification_decisions).toHaveLength(before);
  });

  it("does not supersede an old decision without a new confirmed current pointer", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
    });
    await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    const confirmedBefore = tables.business_activity_classification_decisions.filter(
      (row) => row.decision_status === "confirmed",
    );
    expect(confirmedBefore).toHaveLength(1);
    await service.beginRequalification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: "a831efc8-b7ce-4726-be96-f5a061f21952",
    });
    const failing = createService({
      userId: OWNER_USER,
      tables,
      mutationOptions: { failAfter: "decision" },
    });
    const result = await failing.service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: "a831efc8-b7ce-4726-be96-f5a061f21952",
    });
    expect(result.ok).toBe(false);
    expect(
      tables.business_activity_classification_decisions.filter(
        (row) => row.decision_status === "confirmed",
      ),
    ).toHaveLength(1);
    expect(tables.business_activity_qualifications[0].current_classification_decision_id).toBe(
      confirmedBefore[0].id,
    );
  });

  it("rolls back a support assessment when the event write fails", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
    });
    await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    const failing = createService({
      userId: OWNER_USER,
      tables,
      mutationOptions: { failAfter: "event" },
    });
    const result = await failing.service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(result.ok).toBe(false);
    expect(tables.business_activity_support_assessments).toHaveLength(0);
    expect(
      tables.business_activity_qualification_events.filter((row) => row.event_type === "support_assessed"),
    ).toHaveLength(0);
  });

  it("does not leave an admission decision without its event", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
    });
    await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    const failing = createService({
      userId: OWNER_USER,
      tables,
      mutationOptions: { failAfter: "event" },
    });
    const result = await failing.service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(result.ok).toBe(false);
    expect(tables.business_activity_admission_decisions).toHaveLength(0);
    expect(tables.business_activity_qualifications[0].current_admission_decision_id).toBeNull();
  });

  it("does not leave a half-written demand signal", async () => {
    const { service, tables } = createService({
      userId: OWNER_USER,
      catalog: contextCatalog({ packs: [], versions: [], readiness: {} }),
    });
    await saveRequiredAnswers(service);
    await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
    });
    await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    const failing = createService({
      userId: OWNER_USER,
      tables,
      catalog: contextCatalog({ packs: [], versions: [], readiness: {} }),
      mutationOptions: { failAfter: "event" },
    });
    const result = await failing.service.joinBusinessActivityDemandWaitlist({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    expect(result.ok).toBe(false);
    expect(tables.business_activity_demand_signals).toHaveLength(0);
  });
});
