import { describe, expect, it } from "vitest";
import {
  ACTIVITY_A,
  ASSIGNMENT_OCB_ID,
  ORG_A,
  OWNER_USER,
  PACK_OCB_ID,
  STAFF_USER,
  TAX_MFG_ID,
  TAX_NICHE_ID,
  VERSION_OCB_V1,
  VERSION_OCB_V2,
  VIEWER_USER,
  confirmClassifiedTarget,
  contextCatalog,
  createService,
} from "./harness";

describe("BQA-1E support and admission server commands", () => {
  it("admits retained OCB context_ready for internal_qa without mutating the existing pin", async () => {
    const { service, tables } = createService({
      userId: OWNER_USER,
      pin: { assignmentId: ASSIGNMENT_OCB_ID, contextPackVersionId: VERSION_OCB_V1 },
    });
    await confirmClassifiedTarget(service);
    const support = await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(support.ok).toBe(true);
    const admission = await service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(admission.ok).toBe(true);
    if (admission.ok) {
      expect(admission.value.eventType).toBe("admission_decided");
    }
    expect(tables.business_activity_support_assessments[0]).toMatchObject({
      support_status: "supported_for_requested_rollout",
      reason_code: "eligible",
      context_pack_id: PACK_OCB_ID,
      context_pack_version_id: VERSION_OCB_V1,
      context_readiness: "context_ready",
    });
    expect(tables.business_activity_admission_decisions[0]).toMatchObject({
      admission_status: "admitted",
      reason_code: "eligible",
      rollout_mode: "internal_qa",
    });
    const state = await service.getBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(state.ok).toBe(true);
    if (state.ok) {
      expect(state.value.existingContextPin).toEqual({
        assignmentId: ASSIGNMENT_OCB_ID,
        contextPackVersionId: VERSION_OCB_V1,
      });
      expect(state.value.currentAdmissionDecision?.admissionStatus).toBe("admitted");
    }
  });

  it("does not admit the same OCB pin for closed_beta or production", async () => {
    const { service, tables } = createService({
      userId: OWNER_USER,
      pin: { assignmentId: ASSIGNMENT_OCB_ID, contextPackVersionId: VERSION_OCB_V1 },
    });
    await confirmClassifiedTarget(service);
    const closedBeta = await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    expect(closedBeta.ok).toBe(true);
    const closedAdmission = await service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    expect(closedAdmission.ok).toBe(true);
    expect(tables.business_activity_support_assessments.at(-1)).toMatchObject({
      support_status: "not_yet_supported",
      reason_code: "context_readiness_insufficient",
    });
    expect(tables.business_activity_admission_decisions.at(-1)).toMatchObject({
      admission_status: "not_yet_supported",
      reason_code: "not_yet_supported",
    });

    const production = await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "production",
    });
    expect(production.ok).toBe(true);
    await service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "production",
    });
    expect(tables.business_activity_support_assessments.at(-1)).toMatchObject({
      reason_code: "context_readiness_insufficient",
    });
    const latestAdmission = tables.business_activity_admission_decisions.at(-1);
    expect(latestAdmission).toBeDefined();
    expect(latestAdmission?.admission_status).not.toBe("admitted");
  });

  it("is idempotent for identical support and admission snapshots", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    await confirmClassifiedTarget(service);
    await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    const repeatSupport = await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(repeatSupport.ok).toBe(true);
    if (repeatSupport.ok) {
      expect(repeatSupport.value.idempotent).toBe(true);
    }
    expect(tables.business_activity_support_assessments).toHaveLength(1);
    await service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    const repeatAdmission = await service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(repeatAdmission.ok).toBe(true);
    if (repeatAdmission.ok) {
      expect(repeatAdmission.value.idempotent).toBe(true);
    }
    expect(tables.business_activity_admission_decisions).toHaveLength(1);
  });

  it("does not auto-upgrade an older pin when a newer eligible version exists", async () => {
    const { service, tables } = createService({
      userId: OWNER_USER,
      pin: { assignmentId: ASSIGNMENT_OCB_ID, contextPackVersionId: VERSION_OCB_V1 },
      catalog: contextCatalog({
        versions: [
          {
            id: VERSION_OCB_V1,
            packId: PACK_OCB_ID,
            versionNumber: 1,
            publicationStatus: "published",
          },
          {
            id: VERSION_OCB_V2,
            packId: PACK_OCB_ID,
            versionNumber: 2,
            publicationStatus: "published",
          },
        ],
        readiness: {
          [VERSION_OCB_V1]: "context_ready",
          [VERSION_OCB_V2]: "beta_supported",
        },
      }),
    });
    await confirmClassifiedTarget(service);
    await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(tables.business_activity_support_assessments[0].context_pack_version_id).toBe(
      VERSION_OCB_V1,
    );
    const state = await service.getBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(state.ok).toBe(true);
    if (state.ok) {
      expect(state.value.upgradeMayExist).toBe(true);
      expect(state.value.existingContextPin?.contextPackVersionId).toBe(VERSION_OCB_V1);
    }
  });

  it("fails closed for Open Beta and architecture-gap manufacturing", async () => {
    const openBeta = createService({ userId: OWNER_USER });
    await confirmClassifiedTarget(openBeta.service);
    await openBeta.service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "open_beta",
    });
    await openBeta.service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "open_beta",
    });
    expect(openBeta.tables.business_activity_support_assessments[0].reason_code).toBe(
      "open_beta_policy_undefined",
    );
    expect(openBeta.tables.business_activity_admission_decisions[0].admission_status).toBe("blocked");

    const manufacturing = createService({
      userId: OWNER_USER,
      catalog: contextCatalog({ packs: [], versions: [], readiness: {} }),
    });
    await confirmClassifiedTarget(manufacturing.service, TAX_MFG_ID);
    await manufacturing.service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(manufacturing.tables.business_activity_support_assessments[0]).toMatchObject({
      reason_code: "architecture_gap",
      architecture_gap: true,
    });
  });

  it("denies Staff admission/support commands while allowing read", async () => {
    const owner = createService({ userId: OWNER_USER });
    await confirmClassifiedTarget(owner.service);
    await owner.service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    const staff = createService({ userId: STAFF_USER, tables: owner.tables });
    const denied = await staff.service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.error.code).toBe("FORBIDDEN_ROLE");
    }
    const read = await staff.service.getBusinessActivityQualification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(read.ok).toBe(true);
    const viewer = createService({ userId: VIEWER_USER, tables: owner.tables });
    const viewerDenied = await viewer.service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(viewerDenied.ok).toBe(false);
    if (!viewerDenied.ok) {
      expect(viewerDenied.error.code).toBe("FORBIDDEN_ROLE");
    }
  });

  it("requires a current matching support snapshot before admission", async () => {
    const { service } = createService({ userId: OWNER_USER });
    await confirmClassifiedTarget(service);
    const admission = await service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(admission.ok).toBe(false);
    if (!admission.ok) {
      expect(admission.error.code).toBe("SUPPORT_ASSESSMENT_NOT_READY");
    }
  });

  it("stales support and admission pointers on requalification", async () => {
    const { service, tables } = createService({ userId: OWNER_USER });
    await confirmClassifiedTarget(service);
    await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    await service.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    await service.beginRequalification({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
    });
    expect(tables.business_activity_qualifications[0].current_support_assessment_id).toBeNull();
    expect(tables.business_activity_qualifications[0].current_admission_decision_id).toBeNull();
    expect(tables.business_activity_support_assessments[0].superseded_at).toBeTruthy();
    expect(tables.business_activity_admission_decisions[0].superseded_at).toBeTruthy();
  });

  it("ignores caller-forged eligibility by resolving catalog truth", async () => {
    const { service, tables } = createService({
      userId: OWNER_USER,
      catalog: contextCatalog({ packs: [], versions: [], readiness: {} }),
    });
    await confirmClassifiedTarget(service, TAX_NICHE_ID);
    await service.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "internal_qa",
    });
    expect(tables.business_activity_support_assessments[0].support_status).toBe("not_yet_supported");
    expect(tables.business_activity_support_assessments[0].reason_code).toBe("missing_context_pack");
  });
});
