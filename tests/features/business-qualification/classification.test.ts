import { describe, expect, it } from "vitest";
import {
  ACTIVITY_A,
  ADMIN_USER,
  ORG_A,
  OWNER_USER,
  STAFF_USER,
  TAX_DRAFT_ID,
  TAX_NICHE_ID,
  TAX_OTHER_ID,
  VIEWER_USER,
  createService,
  saveRequiredAnswers,
} from "./harness";

describe("BQA-1D classification commands", () => {
  it("resolves canonical TAX identity and ignores a claimed key", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    const result = await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
      claimedTaxonomyKind: "foundation",
      claimedTaxonomyKey: "attacker-key",
    });
    expect(result.ok).toBe(true);
    expect(tables.business_activity_classification_decisions[0].taxonomy_target_key).toBe(
      "online-course-business",
    );
    expect(tables.business_activity_classification_decisions[0].taxonomy_target_kind).toBe(
      "niche",
    );
  });

  it("rejects unknown and draft TAX targets", async () => {
    const { service } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    const unknown = await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: "99999999-9999-4999-8999-999999999999",
    });
    const draft = await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_DRAFT_ID,
    });
    expect(unknown.ok).toBe(false);
    expect(draft.ok).toBe(false);
    if (!unknown.ok) expect(unknown.error.code).toBe("CLASSIFICATION_TARGET_NOT_FOUND");
    if (!draft.ok) expect(draft.error.code).toBe("CLASSIFICATION_TARGET_INVALID");
  });

  it("records unknown and ambiguous outcomes without confirming them", async () => {
    const { service } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    const unknown = await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "unknown",
      confidenceBand: "none",
    });
    expect(unknown.ok).toBe(true);
    const confirm = await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    expect(confirm.ok).toBe(false);
    if (!confirm.ok) {
      expect(confirm.error.code).toBe("CLASSIFICATION_REVIEW_REQUIRED");
    }
  });

  it("requires review for medium, low, and none confidence", async () => {
    const { service } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    const medium = await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "medium",
      taxonomyTargetId: TAX_NICHE_ID,
      unresolvedDimensionCodes: ["delivery_mode"],
    });
    expect(medium.ok).toBe(true);
    const confirm = await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    expect(confirm.ok).toBe(false);
    if (!confirm.ok) {
      expect(confirm.error.code).toBe("CLASSIFICATION_REVIEW_REQUIRED");
    }
  });

  it("does not confirm an unresolved hybrid split", async () => {
    const { service } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service, "several_lines");
    await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
    });
    const confirm = await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    expect(confirm.ok).toBe(false);
    if (!confirm.ok) {
      expect(confirm.error.code).toBe("CLASSIFICATION_REVIEW_REQUIRED");
    }
  });

  it("lets Owner and Admin confirm a high-confidence classified proposal", async () => {
    const owner = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(owner.service);
    await owner.service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
      proposalSource: "ai_proposal",
    });
    const confirmed = await owner.service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    expect(confirmed.ok).toBe(true);
    expect(
      owner.tables.business_activity_classification_decisions.some(
        (row) => row.decision_status === "confirmed" && row.decision_source === "user_self",
      ),
    ).toBe(true);
    expect(
      owner.tables.business_activity_classification_decisions.some(
        (row) => row.decision_status === "confirmed" && row.decision_source === "ai_proposal",
      ),
    ).toBe(false);

    const admin = createService({ userId: ADMIN_USER });
    await saveRequiredAnswers(admin.service);
    await admin.service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
    });
    const adminConfirmed = await admin.service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    expect(adminConfirmed.ok).toBe(true);
    expect(
      admin.tables.business_activity_classification_decisions.some(
        (row) =>
          row.decision_status === "confirmed" && row.decision_source === "organization_admin",
      ),
    ).toBe(true);
  });

  it("denies Staff and Viewer confirmation", async () => {
    for (const userId of [STAFF_USER, VIEWER_USER]) {
      const { service } = createService({ userId });
      const result = await service.confirmClassification({
        organizationId: ORG_A,
        businessActivityId: ACTIVITY_A,
        taxonomyTargetId: TAX_NICHE_ID,
      });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("FORBIDDEN_ROLE");
    }
  });

  it("repeats the same confirmation as an idempotent no-op", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    await saveRequiredAnswers(service);
    await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_NICHE_ID,
    });
    const first = await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    const second = await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_NICHE_ID,
    });
    expect(first.ok && first.value.idempotent).toBe(false);
    expect(second.ok && second.value.idempotent).toBe(true);
    expect(
      tables.business_activity_classification_decisions.filter(
        (row) => row.decision_status === "confirmed",
      ),
    ).toHaveLength(1);
  });

  it("requires requalification before confirming a different target and preserves the old decision", async () => {
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
    const blocked = await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_OTHER_ID,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe("REQUALIFICATION_REQUIRED");

    const requalify = await service.beginRequalification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(requalify.ok).toBe(true);
    await service.recordClassificationProposal({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      classificationOutcome: "classified",
      confidenceBand: "high",
      taxonomyTargetId: TAX_OTHER_ID,
    });
    const replaced = await service.confirmClassification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      taxonomyTargetId: TAX_OTHER_ID,
    });
    expect(replaced.ok).toBe(true);
    expect(
      tables.business_activity_classification_decisions.filter(
        (row) => row.decision_status === "superseded",
      ),
    ).toHaveLength(1);
    expect(
      tables.business_activity_classification_decisions.filter(
        (row) => row.decision_status === "confirmed",
      ),
    ).toHaveLength(1);
    expect(tables.business_activity_qualifications[0].progress_status).toBe("confirmed");
  });
});
