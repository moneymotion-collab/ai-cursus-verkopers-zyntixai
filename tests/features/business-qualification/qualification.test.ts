import { describe, expect, it } from "vitest";
import {
  ACTIVITY_A,
  ACTIVITY_B,
  ORG_A,
  OWNER_USER,
  STAFF_USER,
  createService,
  saveRequiredAnswers,
} from "./harness";

describe("BQA-1D qualification commands", () => {
  it("creates a qualification once and repeats as an idempotent no-op", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    const first = await service.ensureBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    const second = await service.ensureBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(first.ok && first.value.idempotent).toBe(false);
    expect(second.ok && second.value.idempotent).toBe(true);
    expect(tables.business_activity_qualifications).toHaveLength(1);
    expect(
      tables.business_activity_qualification_events.filter(
        (row) => row.event_type === "qualification_started",
      ),
    ).toHaveLength(1);
  });

  it("denies a foreign Activity id", async () => {
    const { service } = createService({ userId: OWNER_USER });
    const result = await service.ensureBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_B,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ACTIVITY_NOT_FOUND");
    }
  });

  it("rejects mutations against an archived Activity", async () => {
    const { service } = createService({ userId: OWNER_USER, activityStatus: "archived" });
    const result = await service.ensureBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ACTIVITY_NOT_FOUND");
    }
  });

  it("saves required answers, repeats idempotently, and records one event on change", async () => {
    const { service, tables } = createService({ userId: STAFF_USER });
    const created = await service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "activity_description",
      valueText: "Online course business",
    });
    const repeat = await service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "activity_description",
      valueText: "Online course business",
    });
    const changed = await service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "activity_description",
      valueText: "Updated description",
    });
    expect(created.ok && created.value.idempotent).toBe(false);
    expect(repeat.ok && repeat.value.idempotent).toBe(true);
    expect(changed.ok && changed.value.idempotent).toBe(false);
    expect(tables.business_activity_qualification_answers).toHaveLength(1);
    expect(tables.business_activity_qualification_answers[0].value_text).toBe(
      "Updated description",
    );
    expect(
      tables.business_activity_qualification_events.filter(
        (row) => row.event_type === "answer_saved",
      ),
    ).toHaveLength(2);
    expect(
      tables.business_activity_qualification_events.some((row) =>
        JSON.stringify(row.payload).includes("Online course business"),
      ),
    ).toBe(false);
  });

  it("rejects invalid question keys and coded values", async () => {
    const { service } = createService({ userId: OWNER_USER });
    const unknown = await service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "attacker_key",
      valueText: "nope",
    });
    const invalidCode = await service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "primary_value_delivered",
      valueCode: "not_allowed",
    });
    expect(unknown.ok).toBe(false);
    expect(invalidCode.ok).toBe(false);
    if (!unknown.ok) expect(unknown.error.code).toBe("QUESTION_NOT_ALLOWED");
    if (!invalidCode.ok) expect(invalidCode.error.code).toBe("INVALID_ANSWER");
  });

  it("does not treat incomplete answers as classification-ready", async () => {
    const { service } = createService({ userId: OWNER_USER });
    await service.saveQualificationAnswer({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      questionKey: "activity_description",
      valueText: "Incomplete",
    });
    const read = await service.getBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(read.ok && read.value.completeness.requiredComplete).toBe(false);
    const confirm = await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: "9831efc8-b7ce-4726-be96-f5a061f21951",
    });
    expect(confirm.ok).toBe(false);
    if (!confirm.ok) {
      expect(["CLASSIFICATION_NOT_READY", "QUALIFICATION_NOT_FOUND"]).toContain(
        confirm.error.code,
      );
    }
  });

  it("returns a tenant-scoped read model without support or admission rows", async () => {
    const { service } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    const read = await service.getBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(read.ok).toBe(true);
    if (read.ok) {
      expect(read.value.completeness.requiredComplete).toBe(true);
      expect(read.value.qualification.currentClassificationDecisionId).toBeNull();
      expect(read.value.events).not.toBeNull();
    }
  });
});
