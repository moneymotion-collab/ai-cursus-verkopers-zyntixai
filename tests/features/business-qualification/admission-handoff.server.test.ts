import { describe, expect, it } from "vitest";
import {
  ACTIVITY_A,
  ADMIN_USER,
  FOREIGN_USER,
  ORG_A,
  ORG_B,
  OWNER_USER,
  PACK_OCB_ID,
  STAFF_USER,
  TAX_NICHE_ID,
  TAX_OTHER_ID,
  VERSION_OCB_V1,
  VERSION_OCB_V2,
  VIEWER_USER,
  contextCatalog,
  createAdmittedHandoffHarness,
  seedMember,
  seedOrg,
} from "./harness";

const HANDOFF = {
  organizationId: ORG_A,
  businessActivityId: ACTIVITY_A,
  rolloutMode: "internal_qa" as const,
};

function bqaHandoffEvents(tables: {
  business_activity_qualification_events: Record<string, unknown>[];
}) {
  return tables.business_activity_qualification_events.filter(
    (row) =>
      row.event_type === "assignment_handoff_requested" ||
      row.event_type === "assignment_handoff_completed",
  );
}

describe("BQA-1F-R governed Activity Context assignment handoff", () => {
  it("classifies, activates, and pins a first-time draft Activity atomically", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value).toMatchObject({
      ok: true,
      idempotent: false,
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      admissionDecisionId: fixture.admissionId,
      classificationApplied: true,
      activationApplied: true,
      assignmentApplied: true,
      contextPackVersionId: VERSION_OCB_V1,
    });
    expect(result.value.assignmentId).toEqual(expect.any(String));
    const activity = fixture.orgTables.organization_business_activities[0];
    expect(activity).toMatchObject({
      status: "active",
      classification_kind: "niche",
      niche_id: TAX_NICHE_ID,
    });
    expect(fixture.orgTables.organization_context_assignments).toHaveLength(1);
    expect(fixture.orgTables.organization_context_assignments[0]).toMatchObject({
      context_pack_version_id: VERSION_OCB_V1,
      status: "active",
      source: "bqa_confirmed",
    });
    expect(
      fixture.orgTables.organization_context_assignment_events.every(
        (row) => row.source === "bqa_confirmed",
      ),
    ).toBe(true);
    expect(
      fixture.orgTables.organization_context_assignment_events.map((row) => row.event_type),
    ).toEqual([
      "business_activity_classified",
      "business_activity_activated",
      "context_version_assigned",
    ]);
    expect(bqaHandoffEvents(fixture.tables).map((row) => row.event_type)).toEqual([
      "assignment_handoff_requested",
      "assignment_handoff_completed",
    ]);
    expect(fixture.lockTrace).toEqual(["872011", "872012"]);
  });

  it("activates and assigns a correctly classified draft without reclassifying", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft", classified: true },
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        classificationApplied: false,
        activationApplied: true,
        assignmentApplied: true,
        idempotent: false,
      },
    });
    expect(
      fixture.orgTables.organization_context_assignment_events.map((row) => row.event_type),
    ).toEqual(["business_activity_activated", "context_version_assigned"]);
  });

  it("assigns Context onto an already active correctly classified Activity", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "active", classified: true },
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        classificationApplied: false,
        activationApplied: false,
        assignmentApplied: true,
      },
    });
    expect(
      fixture.orgTables.organization_context_assignment_events.map((row) => row.event_type),
    ).toEqual(["context_version_assigned"]);
  });

  it("returns a coherent idempotent desired-state handoff for a fully configured Activity", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "active", classified: true, assigned: true },
    });
    const first = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(first).toMatchObject({
      ok: true,
      value: {
        idempotent: false,
        classificationApplied: false,
        activationApplied: false,
        assignmentApplied: false,
      },
    });
    expect(fixture.orgTables.organization_context_assignment_events).toHaveLength(0);
    expect(fixture.orgTables.organization_context_assignments).toHaveLength(1);
    const requestedAfterFirst = bqaHandoffEvents(fixture.tables).length;
    expect(requestedAfterFirst).toBe(2);

    const second = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(second).toMatchObject({
      ok: true,
      value: { idempotent: true, assignmentApplied: false },
    });
    expect(bqaHandoffEvents(fixture.tables)).toHaveLength(2);
    expect(fixture.orgTables.organization_context_assignments).toHaveLength(1);
    expect(fixture.orgTables.organization_context_assignment_events).toHaveLength(0);
  });

  it("denies archived Business Activities before assignment", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "archived", classified: true },
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ACTIVITY_ARCHIVED");
    }
    expect(fixture.writerCalls()).toBe(0);
  });

  it("fails closed on Activity classification mismatch without mutating Context", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: {
        status: "draft",
        classified: true,
        classificationTargetId: TAX_OTHER_ID,
      },
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ACTIVITY_CLASSIFICATION_MISMATCH");
    }
    expect(fixture.writerCalls()).toBe(0);
    expect(fixture.orgTables.organization_context_assignments).toHaveLength(0);
    expect(bqaHandoffEvents(fixture.tables)).toHaveLength(0);
  });

  it("fails closed on a different active pin and does not auto-repin", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: {
        status: "active",
        classified: true,
        assigned: true,
        assignmentVersionId: VERSION_OCB_V2,
      },
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CONTEXT_REPIN_REQUIRED");
    }
    expect(fixture.writerCalls()).toBe(0);
    expect(fixture.orgTables.organization_context_assignments[0]).toMatchObject({
      context_pack_version_id: VERSION_OCB_V2,
      status: "active",
    });
    expect(fixture.orgTables.organization_context_assignment_events).toHaveLength(0);
  });

  it("denies closed_beta when current readiness is only context_ready", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "active", classified: true, assigned: true },
      admit: false,
    });
    const qualification = fixture.tables.business_activity_qualifications[0];
    const classification = fixture.tables.business_activity_classification_decisions.find(
      (row) => row.decision_status === "confirmed",
    );
    const assessmentId = crypto.randomUUID();
    const admissionId = crypto.randomUUID();
    fixture.tables.business_activity_support_assessments.push({
      id: assessmentId,
      organization_id: ORG_A,
      business_activity_id: ACTIVITY_A,
      qualification_id: qualification.id,
      classification_decision_id: classification?.id ?? null,
      rollout_mode: "closed_beta",
      support_status: "supported_for_requested_rollout",
      reason_code: "eligible",
      context_pack_id: PACK_OCB_ID,
      context_pack_version_id: VERSION_OCB_V1,
      context_readiness: "beta_supported",
      architecture_gap: false,
      assessed_at: "2026-08-01T00:00:00.000Z",
      superseded_at: null,
    });
    fixture.tables.business_activity_admission_decisions.push({
      id: admissionId,
      organization_id: ORG_A,
      business_activity_id: ACTIVITY_A,
      qualification_id: qualification.id,
      support_assessment_id: assessmentId,
      rollout_mode: "closed_beta",
      admission_status: "admitted",
      reason_code: "eligible",
      decision_source: "organization_admin",
      actor_user_id: OWNER_USER,
      decided_at: "2026-08-01T00:00:00.000Z",
      superseded_at: null,
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      admissionDecisionId: admissionId,
      rolloutMode: "closed_beta",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CONTEXT_READINESS_NO_LONGER_ELIGIBLE");
    }
    expect(fixture.writerCalls()).toBe(0);
    expect(bqaHandoffEvents(fixture.tables)).toHaveLength(0);
  });

  it("denies a stale AdmissionDecision after a newer confirmed classification", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
    });
    const oldAdmissionId = fixture.admissionId!;
    const qualification = fixture.tables.business_activity_qualifications[0];
    const newerId = crypto.randomUUID();
    fixture.tables.business_activity_classification_decisions.push({
      id: newerId,
      organization_id: ORG_A,
      business_activity_id: ACTIVITY_A,
      qualification_id: qualification.id,
      taxonomy_release_id: qualification.taxonomy_release_id ?? "accda96d-dfc7-4666-8b28-4da515e3bbdd",
      taxonomy_target_kind: "niche",
      taxonomy_target_id: TAX_NICHE_ID,
      taxonomy_target_key: "online-course-business",
      classification_outcome: "classified",
      confidence_band: "high",
      decision_status: "confirmed",
      proposal_source: "user_self",
      decision_source: "user_self",
      confirmed_by_user_id: OWNER_USER,
      confirmed_at: "2026-08-27T01:00:00.000Z",
      alternative_target_ids: [],
      unresolved_dimension_codes: [],
      evidence_snapshot: {},
      supersedes_decision_id: qualification.current_classification_decision_id,
      created_at: "2026-08-27T01:00:00.000Z",
      superseded_at: null,
    });
    qualification.current_classification_decision_id = newerId;
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: oldAdmissionId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ADMISSION_STALE");
    }
    expect(fixture.writerCalls()).toBe(0);
  });

  it("denies requalifying and review-required qualifications", async () => {
    const requalifying = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
    });
    requalifying.tables.business_activity_qualifications[0].progress_status = "requalifying";
    const requalifyResult = await requalifying.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: requalifying.admissionId!,
    });
    expect(requalifyResult.ok).toBe(false);
    if (!requalifyResult.ok) {
      expect(requalifyResult.error.code).toBe("REQUALIFICATION_REQUIRED");
    }
    expect(requalifying.writerCalls()).toBe(0);

    const review = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
    });
    review.tables.business_activity_qualifications[0].review_status = "required";
    const reviewResult = await review.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: review.admissionId!,
    });
    expect(reviewResult.ok).toBe(false);
    if (!reviewResult.ok) {
      expect(reviewResult.error.code).toBe("CLASSIFICATION_REVIEW_REQUIRED");
    }
    expect(review.writerCalls()).toBe(0);
  });

  it("denies a retained-style closed_beta not-admitted decision before ORG mutation", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "active", classified: true, assigned: true },
    });
    await fixture.bqa.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    await fixture.bqa.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    const closedBeta = fixture.tables.business_activity_admission_decisions.find(
      (row) => row.rollout_mode === "closed_beta",
    );
    expect(closedBeta?.admission_status).not.toBe("admitted");
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      admissionDecisionId: String(closedBeta?.id),
      rolloutMode: "closed_beta",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ADMISSION_NOT_ELIGIBLE");
    }
    expect(fixture.writerCalls()).toBe(0);
  });

  it("does not let a historical internal_qa admission authorize closed_beta", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      admissionDecisionId: fixture.admissionId!,
      rolloutMode: "closed_beta",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ROLLOUT_MISMATCH");
    }
    expect(fixture.writerCalls()).toBe(0);
  });

  it("addresses a historical internal_qa admission explicitly and still revalidates the linked support", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
    });
    const historicalId = fixture.admissionId!;
    await fixture.bqa.evaluateBusinessActivitySupport({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    await fixture.bqa.evaluateBusinessActivityAdmission({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      requestedRollout: "closed_beta",
    });
    expect(
      fixture.tables.business_activity_qualifications[0].current_admission_decision_id,
    ).not.toBe(historicalId);
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: historicalId,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SUPPORT_ASSESSMENT_NOT_READY");
    }
    expect(fixture.writerCalls()).toBe(0);
    expect(fixture.orgTables.organization_business_activities[0].status).toBe("draft");
  });

  it("hands off closed_beta only when current readiness is beta_supported+", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
      catalog: contextCatalog({
        readiness: { [VERSION_OCB_V1]: "beta_supported" },
      }),
      rollout: "closed_beta",
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      admissionDecisionId: fixture.admissionId!,
      rolloutMode: "closed_beta",
    });
    expect(result.ok).toBe(true);
  });

  it("hands off production only when current readiness is production_verified", async () => {
    const readyOnly = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
      admit: false,
    });
    const qualification = readyOnly.tables.business_activity_qualifications[0];
    const classification = readyOnly.tables.business_activity_classification_decisions.find(
      (row) => row.decision_status === "confirmed",
    );
    const assessmentId = crypto.randomUUID();
    const admissionId = crypto.randomUUID();
    readyOnly.tables.business_activity_support_assessments.push({
      id: assessmentId,
      organization_id: ORG_A,
      business_activity_id: ACTIVITY_A,
      qualification_id: qualification.id,
      classification_decision_id: classification?.id ?? null,
      rollout_mode: "production",
      support_status: "supported_for_requested_rollout",
      reason_code: "eligible",
      context_pack_id: PACK_OCB_ID,
      context_pack_version_id: VERSION_OCB_V1,
      context_readiness: "production_verified",
      architecture_gap: false,
      assessed_at: "2026-08-01T00:00:00.000Z",
      superseded_at: null,
    });
    readyOnly.tables.business_activity_admission_decisions.push({
      id: admissionId,
      organization_id: ORG_A,
      business_activity_id: ACTIVITY_A,
      qualification_id: qualification.id,
      support_assessment_id: assessmentId,
      rollout_mode: "production",
      admission_status: "admitted",
      reason_code: "eligible",
      decision_source: "organization_admin",
      actor_user_id: OWNER_USER,
      decided_at: "2026-08-01T00:00:00.000Z",
      superseded_at: null,
    });
    const denied = await readyOnly.handoff.applyBusinessActivityAdmissionHandoff({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      admissionDecisionId: admissionId,
      rolloutMode: "production",
    });
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.error.code).toBe("CONTEXT_READINESS_NO_LONGER_ELIGIBLE");
    }

    const verified = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
      catalog: contextCatalog({
        readiness: { [VERSION_OCB_V1]: "production_verified" },
      }),
      rollout: "production",
    });
    const allowed = await verified.handoff.applyBusinessActivityAdmissionHandoff({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      admissionDecisionId: verified.admissionId!,
      rolloutMode: "production",
    });
    expect(allowed.ok).toBe(true);
  });

  it("forbids Open Beta and unknown or foreign admission ids without leaking existence", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
    });
    const openBeta = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      organizationId: ORG_A,
      businessActivityId: ACTIVITY_A,
      admissionDecisionId: fixture.admissionId!,
      rolloutMode: "open_beta",
    });
    expect(openBeta.ok).toBe(false);
    if (!openBeta.ok) {
      expect(openBeta.error.code).toBe("ROLLOUT_POLICY_UNDEFINED");
    }

    const unknown = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: "99999999-9999-4999-8999-999999999999",
    });
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.error.code).toBe("ADMISSION_NOT_FOUND");
    }

    seedOrg(fixture.tables, ORG_B);
    seedMember(fixture.tables, {
      userId: FOREIGN_USER,
      role: "owner",
      organizationId: ORG_B,
    });
    const foreignOrg = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      organizationId: ORG_B,
      businessActivityId: ACTIVITY_A,
      admissionDecisionId: fixture.admissionId!,
      rolloutMode: "internal_qa",
    });
    expect(foreignOrg.ok).toBe(false);
    if (!foreignOrg.ok) {
      expect(foreignOrg.error.code).toBe("ORG_NOT_FOUND");
    }
    expect(fixture.writerCalls()).toBe(0);
  });

  it("allows Owner and Admin and denies Staff, Viewer, unauthenticated, suspended, and foreign before the writer", async () => {
    for (const [userId, expected] of [
      [OWNER_USER, true],
      [ADMIN_USER, true],
      [STAFF_USER, "FORBIDDEN_ROLE"],
      [VIEWER_USER, "FORBIDDEN_ROLE"],
      [null, "UNAUTHORIZED"],
      [FOREIGN_USER, "ORG_NOT_FOUND"],
    ] as const) {
      const fixture = await createAdmittedHandoffHarness({
        userId,
        activity: { status: "draft" },
      });
      if (userId === OWNER_USER) {
        const suspended = await createAdmittedHandoffHarness({
          userId: OWNER_USER,
          activity: { status: "draft" },
        });
        const member = suspended.tables.organization_members.find(
          (row) => row.user_id === OWNER_USER,
        );
        if (member) {
          member.status = "suspended";
        }
        const denied = await suspended.handoff.applyBusinessActivityAdmissionHandoff({
          ...HANDOFF,
          admissionDecisionId: suspended.admissionId!,
        });
        expect(denied.ok).toBe(false);
        if (!denied.ok) {
          expect(denied.error.code).toBe("ORG_NOT_FOUND");
        }
        expect(suspended.writerCalls()).toBe(0);
      }
      const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
        ...HANDOFF,
        admissionDecisionId: fixture.admissionId!,
      });
      if (expected === true) {
        expect(result.ok).toBe(true);
        expect(fixture.writerCalls()).toBeGreaterThan(0);
      } else {
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error.code).toBe(expected);
        }
        expect(fixture.writerCalls()).toBe(0);
      }
    }
  });

  it("rolls back classification and activation when nested assignment returns ok=false", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
      handoffOptions: { failAfter: "assign" },
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(result.ok).toBe(false);
    expect(fixture.orgTables.organization_business_activities[0]).toMatchObject({
      status: "draft",
      classification_kind: null,
      niche_id: null,
    });
    expect(fixture.orgTables.organization_context_assignments).toHaveLength(0);
    expect(fixture.orgTables.organization_context_assignment_events).toHaveLength(0);
    expect(bqaHandoffEvents(fixture.tables)).toHaveLength(0);
  });

  it("rolls back canonical mutation when the BQA completed event cannot be written", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
      handoffOptions: { failAfter: "completed" },
    });
    const result = await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(result.ok).toBe(false);
    expect(fixture.orgTables.organization_business_activities[0]).toMatchObject({
      status: "draft",
      classification_kind: null,
    });
    expect(fixture.orgTables.organization_context_assignments).toHaveLength(0);
    expect(fixture.orgTables.organization_context_assignment_events).toHaveLength(0);
    expect(bqaHandoffEvents(fixture.tables)).toHaveLength(0);
  });

  it("serializes concurrent equivalent handoffs into one canonical assignment", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
    });
    const input = {
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    };
    const [first, second] = await Promise.all([
      fixture.handoff.applyBusinessActivityAdmissionHandoff(input),
      fixture.handoff.applyBusinessActivityAdmissionHandoff(input),
    ]);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    const idempotentCount = [first, second].filter(
      (row) => row.ok && row.value.idempotent,
    ).length;
    expect(idempotentCount).toBe(1);
    expect(fixture.orgTables.organization_context_assignments).toHaveLength(1);
    expect(
      bqaHandoffEvents(fixture.tables).filter(
        (row) => row.event_type === "assignment_handoff_completed",
      ),
    ).toHaveLength(1);
    expect(
      fixture.orgTables.organization_context_assignment_events.filter(
        (row) => row.event_type === "context_version_assigned",
      ),
    ).toHaveLength(1);
    for (let index = 0; index < fixture.lockTrace.length; index += 2) {
      expect(fixture.lockTrace.slice(index, index + 2)).toEqual(["872011", "872012"]);
    }
  });

  it("does not mutate Path B, Social, entitlement, or Context readiness rows", async () => {
    const fixture = await createAdmittedHandoffHarness({
      activity: { status: "draft" },
    });
    const membersBefore = fixture.tables.organization_members.length;
    await fixture.handoff.applyBusinessActivityAdmissionHandoff({
      ...HANDOFF,
      admissionDecisionId: fixture.admissionId!,
    });
    expect(fixture.tables.organization_members).toHaveLength(membersBefore);
    expect(JSON.stringify(fixture.tables)).not.toContain("enabled_capabilities");
    expect(JSON.stringify(fixture.orgTables)).not.toContain("context_pack_readiness");
    expect(JSON.stringify(fixture.orgTables)).not.toContain("organization_invitations");
    expect(JSON.stringify(fixture.orgTables)).not.toContain("SOCIAL_PUBLISHING_ENABLED");
  });
});
