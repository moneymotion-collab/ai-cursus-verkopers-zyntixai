import type { BqaMutationRpcClient } from "@/features/business-qualification/server/bqa-rpc";
import type { BqaMemoryTables } from "./memory-query-client";

export type MemoryBqaMutationOptions = {
  failAfter?: "qualification" | "answer" | "decision" | "event" | "assessment" | "admission" | "demand";
};

function nowIso() {
  return new Date().toISOString();
}

function cloneTables(tables: BqaMemoryTables): BqaMemoryTables {
  return JSON.parse(JSON.stringify(tables)) as BqaMemoryTables;
}

function restore(tables: BqaMemoryTables, snapshot: BqaMemoryTables) {
  for (const key of Object.keys(tables) as (keyof BqaMemoryTables)[]) {
    tables[key].splice(0, tables[key].length, ...snapshot[key]);
  }
}

function fail(code: string, message: string) {
  return { data: { ok: false, code, message }, error: null };
}

function ok(input: {
  idempotent: boolean;
  qualificationId: string;
  decisionId?: string | null;
  answerId?: string | null;
  assessmentId?: string | null;
  admissionId?: string | null;
  demandSignalId?: string | null;
  eventId?: string | null;
  eventType?: string | null;
}) {
  return {
    data: {
      ok: true,
      idempotent: input.idempotent,
      qualification_id: input.qualificationId,
      decision_id: input.decisionId ?? null,
      answer_id: input.answerId ?? null,
      assessment_id: input.assessmentId ?? null,
      admission_id: input.admissionId ?? null,
      demand_signal_id: input.demandSignalId ?? null,
      event_id: input.eventId ?? null,
      event_type: input.eventType ?? null,
    },
    error: null,
  };
}

function appendEvent(
  tables: BqaMemoryTables,
  input: {
    organizationId: string;
    activityId: string;
    qualificationId: string;
    eventType: string;
    actorUserId: string;
    actorMemberId: string;
    payload: Record<string, unknown>;
    idempotencyKey?: string | null;
  },
  failAfter?: MemoryBqaMutationOptions["failAfter"],
) {
  if (failAfter === "event") {
    throw new Error("forced event failure");
  }
  const eventId = crypto.randomUUID();
  tables.business_activity_qualification_events.push({
    id: eventId,
    organization_id: input.organizationId,
    business_activity_id: input.activityId,
    qualification_id: input.qualificationId,
    event_type: input.eventType,
    actor_user_id: input.actorUserId,
    actor_member_id: input.actorMemberId,
    payload: input.payload,
    idempotency_key: input.idempotencyKey ?? null,
    created_at: nowIso(),
  });
  return eventId;
}

export function createMemoryBqaMutationRpc(
  tables: BqaMemoryTables,
  options: MemoryBqaMutationOptions = {},
): BqaMutationRpcClient {
  return {
    async rpc(_fn, args) {
      const snapshot = cloneTables(tables);
      try {
        return run(tables, args, options);
      } catch {
        restore(tables, snapshot);
        return fail("DATABASE_WRITE_ERROR", "BQA mutation rolled back");
      }
    },
  };
}

function run(
  tables: BqaMemoryTables,
  args: {
    p_operation: string;
    p_organization_id: string;
    p_business_activity_id: string;
    p_actor_user_id: string;
    p_actor_member_id: string;
    p_payload: Record<string, unknown>;
  },
  options: MemoryBqaMutationOptions,
) {
  const org = tables.organizations.find((row) => row.id === args.p_organization_id);
  if (!org || org.status !== "active") {
    return fail("ORG_NOT_FOUND", "Organization not found");
  }

  const qualification = () =>
    tables.business_activity_qualifications.find(
      (row) =>
        row.organization_id === args.p_organization_id &&
        row.business_activity_id === args.p_business_activity_id,
    );

  if (args.p_operation === "ensure_qualification") {
    const existing = qualification();
    if (existing) {
      return ok({
        idempotent: true,
        qualificationId: String(existing.id),
      });
    }
    const qualificationId = crypto.randomUUID();
    tables.business_activity_qualifications.push({
      id: qualificationId,
      organization_id: args.p_organization_id,
      business_activity_id: args.p_business_activity_id,
      progress_status: "unstarted",
      review_status: "none",
      split_recommended: false,
      current_classification_decision_id: null,
      current_support_assessment_id: null,
      current_admission_decision_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    if (options.failAfter === "qualification") {
      throw new Error("forced qualification failure");
    }
    const eventId = appendEvent(
      tables,
      {
        organizationId: args.p_organization_id,
        activityId: args.p_business_activity_id,
        qualificationId,
        eventType: "qualification_started",
        actorUserId: args.p_actor_user_id,
        actorMemberId: args.p_actor_member_id,
        payload: {},
        idempotencyKey: `qstart:${args.p_business_activity_id}`,
      },
      options.failAfter,
    );
    return ok({
      idempotent: false,
      qualificationId,
      eventId,
      eventType: "qualification_started",
    });
  }

  let current = qualification();
  if (!current && args.p_operation === "save_answer") {
    const qualificationId = crypto.randomUUID();
    tables.business_activity_qualifications.push({
      id: qualificationId,
      organization_id: args.p_organization_id,
      business_activity_id: args.p_business_activity_id,
      progress_status: "unstarted",
      review_status: "none",
      split_recommended: false,
      current_classification_decision_id: null,
      current_support_assessment_id: null,
      current_admission_decision_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    appendEvent(tables, {
      organizationId: args.p_organization_id,
      activityId: args.p_business_activity_id,
      qualificationId,
      eventType: "qualification_started",
      actorUserId: args.p_actor_user_id,
      actorMemberId: args.p_actor_member_id,
      payload: {},
      idempotencyKey: `qstart:${args.p_business_activity_id}`,
    });
    current = qualification();
  }
  if (!current) {
    return fail("QUALIFICATION_NOT_FOUND", "Qualification has not been started");
  }

  if (args.p_operation === "save_answer") {
    const questionKey = String(args.p_payload.question_key);
    const existing = tables.business_activity_qualification_answers.find(
      (row) => row.qualification_id === current.id && row.question_key === questionKey,
    );
    if (
      existing &&
      existing.value_kind === args.p_payload.value_kind &&
      existing.value_text === args.p_payload.value_text &&
      existing.value_code === args.p_payload.value_code
    ) {
      return ok({
        idempotent: true,
        qualificationId: String(current.id),
        answerId: String(existing.id),
      });
    }
    const answerId = existing ? String(existing.id) : crypto.randomUUID();
    if (existing) {
      existing.value_kind = args.p_payload.value_kind;
      existing.value_text = args.p_payload.value_text;
      existing.value_code = args.p_payload.value_code;
      existing.source = args.p_payload.source;
      existing.actor_user_id = args.p_actor_user_id;
      existing.updated_at = nowIso();
    } else {
      tables.business_activity_qualification_answers.push({
        id: answerId,
        organization_id: args.p_organization_id,
        business_activity_id: args.p_business_activity_id,
        qualification_id: current.id,
        question_key: questionKey,
        value_kind: args.p_payload.value_kind,
        value_text: args.p_payload.value_text ?? null,
        value_code: args.p_payload.value_code ?? null,
        source: args.p_payload.source,
        actor_user_id: args.p_actor_user_id,
        created_at: nowIso(),
        updated_at: nowIso(),
      });
    }
    if (options.failAfter === "answer") {
      throw new Error("forced answer failure");
    }
    const answers = tables.business_activity_qualification_answers.filter(
      (row) => row.qualification_id === current.id,
    );
    current.split_recommended = answers.some(
      (row) => row.question_key === "line_structure" && row.value_code === "several_lines",
    );
    const required = ["activity_description", "primary_value_delivered", "line_structure"];
    const requiredCount = answers.filter((row) =>
      required.includes(String(row.question_key)),
    ).length;
    if (current.progress_status !== "confirmed" && current.progress_status !== "requalifying") {
      current.progress_status = requiredCount === 0 ? "unstarted" : "collecting";
    }
    current.updated_at = nowIso();
    const eventId = appendEvent(
      tables,
      {
        organizationId: args.p_organization_id,
        activityId: args.p_business_activity_id,
        qualificationId: String(current.id),
        eventType: "answer_saved",
        actorUserId: args.p_actor_user_id,
        actorMemberId: args.p_actor_member_id,
        payload: {
          question_key: questionKey,
          change: existing ? "updated" : "created",
        },
      },
      options.failAfter,
    );
    return ok({
      idempotent: false,
      qualificationId: String(current.id),
      answerId,
      eventId,
      eventType: "answer_saved",
    });
  }

  if (args.p_operation === "record_proposal") {
    if (current.progress_status === "confirmed") {
      return fail(
        "REQUALIFICATION_REQUIRED",
        "A confirmed classification requires requalification before a new proposal",
      );
    }
    const decisionId = crypto.randomUUID();
    tables.business_activity_classification_decisions.push({
      id: decisionId,
      organization_id: args.p_organization_id,
      business_activity_id: args.p_business_activity_id,
      qualification_id: current.id,
      taxonomy_release_id: args.p_payload.taxonomy_release_id,
      taxonomy_target_kind: args.p_payload.taxonomy_target_kind ?? null,
      taxonomy_target_id: args.p_payload.taxonomy_target_id ?? null,
      taxonomy_target_key: args.p_payload.taxonomy_target_key ?? null,
      classification_outcome: args.p_payload.classification_outcome,
      confidence_band: args.p_payload.confidence_band,
      decision_status: "proposed",
      proposal_source: args.p_payload.proposal_source,
      decision_source: null,
      confirmed_by_user_id: null,
      confirmed_at: null,
      alternative_target_ids: args.p_payload.alternative_target_ids ?? [],
      unresolved_dimension_codes: args.p_payload.unresolved_dimension_codes ?? [],
      evidence_snapshot: args.p_payload.evidence_snapshot ?? {},
      supersedes_decision_id: null,
      created_at: nowIso(),
      superseded_at: null,
    });
    if (options.failAfter === "decision") {
      throw new Error("forced decision failure");
    }
    const reviewRequired = args.p_payload.review_required === true;
    const outcome = String(args.p_payload.classification_outcome);
    if (
      current.split_recommended ||
      reviewRequired ||
      ["ambiguous", "unknown", "architecture_gap"].includes(outcome)
    ) {
      current.progress_status = "needs_review";
      if (current.review_status === "none") {
        current.review_status = "required";
      }
    } else if (current.progress_status === "requalifying") {
      current.progress_status = "requalifying";
    } else if (outcome === "classified" && args.p_payload.confidence_band === "high") {
      current.progress_status = "awaiting_confirmation";
    }
    const eventId = appendEvent(
      tables,
      {
        organizationId: args.p_organization_id,
        activityId: args.p_business_activity_id,
        qualificationId: String(current.id),
        eventType: "classification_proposed",
        actorUserId: args.p_actor_user_id,
        actorMemberId: args.p_actor_member_id,
        payload: {
          decision_id: decisionId,
          classification_outcome: outcome,
          confidence_band: args.p_payload.confidence_band,
          taxonomy_target_id: args.p_payload.taxonomy_target_id,
          taxonomy_target_key: args.p_payload.taxonomy_target_key,
        },
      },
      options.failAfter,
    );
    return ok({
      idempotent: false,
      qualificationId: String(current.id),
      decisionId,
      eventId,
      eventType: "classification_proposed",
    });
  }

  if (args.p_operation === "confirm_classification") {
    const targetId = args.p_payload.taxonomy_target_id;
    const releaseId = args.p_payload.taxonomy_release_id;
    if (args.p_payload.decision_source === "ai_proposal") {
      return fail("FORBIDDEN_ROLE", "AI proposal cannot confirm classification");
    }
    const confirmed = tables.business_activity_classification_decisions.find(
      (row) =>
        row.business_activity_id === args.p_business_activity_id &&
        row.decision_status === "confirmed",
    );
    if (
      confirmed &&
      confirmed.taxonomy_target_id === targetId &&
      confirmed.taxonomy_release_id === releaseId
    ) {
      return ok({
        idempotent: true,
        qualificationId: String(current.id),
        decisionId: String(confirmed.id),
      });
    }
    if (
      confirmed &&
      confirmed.taxonomy_target_id !== targetId &&
      current.progress_status === "confirmed"
    ) {
      return fail(
        "REQUALIFICATION_REQUIRED",
        "A different confirmed classification requires requalification",
      );
    }
    const proposed = tables.business_activity_classification_decisions.find(
      (row) =>
        row.business_activity_id === args.p_business_activity_id &&
        row.decision_status === "proposed" &&
        row.classification_outcome === "classified" &&
        row.taxonomy_target_id === targetId,
    );
    if (!proposed) {
      return fail("CLASSIFICATION_NOT_READY", "A confirmable classified proposal is required");
    }
    if (current.split_recommended) {
      return fail("CLASSIFICATION_REVIEW_REQUIRED", "Unresolved hybrid split cannot be confirmed");
    }
    if (confirmed) {
      confirmed.decision_status = "superseded";
      confirmed.superseded_at = nowIso();
      appendEvent(tables, {
        organizationId: args.p_organization_id,
        activityId: args.p_business_activity_id,
        qualificationId: String(current.id),
        eventType: "classification_superseded",
        actorUserId: args.p_actor_user_id,
        actorMemberId: args.p_actor_member_id,
        payload: {
          superseded_decision_id: confirmed.id,
          taxonomy_target_id: confirmed.taxonomy_target_id,
        },
      });
    }
    const decisionId = crypto.randomUUID();
    tables.business_activity_classification_decisions.push({
      id: decisionId,
      organization_id: args.p_organization_id,
      business_activity_id: args.p_business_activity_id,
      qualification_id: current.id,
      taxonomy_release_id: proposed.taxonomy_release_id,
      taxonomy_target_kind: proposed.taxonomy_target_kind,
      taxonomy_target_id: proposed.taxonomy_target_id,
      taxonomy_target_key: proposed.taxonomy_target_key,
      classification_outcome: "classified",
      confidence_band: proposed.confidence_band,
      decision_status: "confirmed",
      proposal_source: proposed.proposal_source,
      decision_source: args.p_payload.decision_source,
      confirmed_by_user_id: args.p_actor_user_id,
      confirmed_at: nowIso(),
      alternative_target_ids: proposed.alternative_target_ids,
      unresolved_dimension_codes: proposed.unresolved_dimension_codes,
      evidence_snapshot: proposed.evidence_snapshot,
      supersedes_decision_id: confirmed?.id ?? null,
      created_at: nowIso(),
      superseded_at: null,
    });
    if (options.failAfter === "decision") {
      throw new Error("forced decision failure");
    }
    current.current_classification_decision_id = decisionId;
    current.progress_status = "confirmed";
    current.updated_at = nowIso();
    const eventId = appendEvent(
      tables,
      {
        organizationId: args.p_organization_id,
        activityId: args.p_business_activity_id,
        qualificationId: String(current.id),
        eventType: "classification_confirmed",
        actorUserId: args.p_actor_user_id,
        actorMemberId: args.p_actor_member_id,
        payload: {
          decision_id: decisionId,
          taxonomy_target_id: proposed.taxonomy_target_id,
          taxonomy_target_key: proposed.taxonomy_target_key,
          confidence_band: proposed.confidence_band,
        },
      },
      options.failAfter,
    );
    return ok({
      idempotent: false,
      qualificationId: String(current.id),
      decisionId,
      eventId,
      eventType: "classification_confirmed",
    });
  }

  if (args.p_operation === "begin_requalification") {
    if (current.progress_status === "requalifying") {
      return ok({
        idempotent: true,
        qualificationId: String(current.id),
        decisionId: current.current_classification_decision_id
          ? String(current.current_classification_decision_id)
          : null,
      });
    }
    if (current.progress_status !== "confirmed") {
      return fail("CLASSIFICATION_NOT_READY", "Requalification requires a confirmed classification");
    }
    const now = nowIso();
    if (current.current_support_assessment_id) {
      const assessment = tables.business_activity_support_assessments.find(
        (row) => row.id === current.current_support_assessment_id,
      );
      if (assessment && !assessment.superseded_at) {
        assessment.superseded_at = now;
      }
    }
    if (current.current_admission_decision_id) {
      const admission = tables.business_activity_admission_decisions.find(
        (row) => row.id === current.current_admission_decision_id,
      );
      if (admission && !admission.superseded_at) {
        admission.superseded_at = now;
      }
    }
    current.progress_status = "requalifying";
    current.current_support_assessment_id = null;
    current.current_admission_decision_id = null;
    current.updated_at = now;
    const eventId = appendEvent(tables, {
      organizationId: args.p_organization_id,
      activityId: args.p_business_activity_id,
      qualificationId: String(current.id),
      eventType: "requalify_started",
      actorUserId: args.p_actor_user_id,
      actorMemberId: args.p_actor_member_id,
      payload: {
        current_classification_decision_id: current.current_classification_decision_id,
      },
    });
    return ok({
      idempotent: false,
      qualificationId: String(current.id),
      decisionId: current.current_classification_decision_id
        ? String(current.current_classification_decision_id)
        : null,
      eventId,
      eventType: "requalify_started",
    });
  }

  if (args.p_operation === "request_review") {
    if (current.review_status === "required" || current.review_status === "requested") {
      return ok({ idempotent: true, qualificationId: String(current.id) });
    }
    current.review_status = "requested";
    current.progress_status = "needs_review";
    const eventId = appendEvent(tables, {
      organizationId: args.p_organization_id,
      activityId: args.p_business_activity_id,
      qualificationId: String(current.id),
      eventType: "review_requested",
      actorUserId: args.p_actor_user_id,
      actorMemberId: args.p_actor_member_id,
      payload: { transition: "requested" },
    });
    return ok({
      idempotent: false,
      qualificationId: String(current.id),
      eventId,
      eventType: "review_requested",
    });
  }

  if (args.p_operation === "record_support_assessment") {
    const payload = args.p_payload;
    const currentAssessment = current.current_support_assessment_id
      ? tables.business_activity_support_assessments.find(
          (row) => row.id === current.current_support_assessment_id,
        )
      : undefined;
    if (
      currentAssessment &&
      !currentAssessment.superseded_at &&
      currentAssessment.rollout_mode === payload.rollout_mode &&
      currentAssessment.support_status === payload.support_status &&
      currentAssessment.reason_code === payload.reason_code &&
      currentAssessment.architecture_gap === payload.architecture_gap &&
      currentAssessment.classification_decision_id === payload.classification_decision_id &&
      currentAssessment.context_pack_id === payload.context_pack_id &&
      currentAssessment.context_pack_version_id === payload.context_pack_version_id &&
      currentAssessment.context_readiness === payload.context_readiness
    ) {
      return ok({
        idempotent: true,
        qualificationId: String(current.id),
        assessmentId: String(currentAssessment.id),
      });
    }
    if (currentAssessment && !currentAssessment.superseded_at) {
      currentAssessment.superseded_at = nowIso();
    }
    const assessmentId = crypto.randomUUID();
    tables.business_activity_support_assessments.push({
      id: assessmentId,
      organization_id: args.p_organization_id,
      business_activity_id: args.p_business_activity_id,
      qualification_id: current.id,
      classification_decision_id: payload.classification_decision_id ?? null,
      rollout_mode: payload.rollout_mode,
      support_status: payload.support_status,
      reason_code: payload.reason_code,
      context_pack_id: payload.context_pack_id ?? null,
      context_pack_version_id: payload.context_pack_version_id ?? null,
      context_readiness: payload.context_readiness ?? null,
      architecture_gap: payload.architecture_gap === true,
      assessed_at: nowIso(),
      superseded_at: null,
    });
    if (options.failAfter === "assessment") {
      throw new Error("forced assessment failure");
    }
    current.current_support_assessment_id = assessmentId;
    current.updated_at = nowIso();
    const eventId = appendEvent(
      tables,
      {
        organizationId: args.p_organization_id,
        activityId: args.p_business_activity_id,
        qualificationId: String(current.id),
        eventType: "support_assessed",
        actorUserId: args.p_actor_user_id,
        actorMemberId: args.p_actor_member_id,
        payload: {
          assessment_id: assessmentId,
          rollout_mode: payload.rollout_mode,
          support_status: payload.support_status,
          reason_code: payload.reason_code,
          classification_decision_id: payload.classification_decision_id ?? null,
          context_pack_id: payload.context_pack_id ?? null,
          context_pack_version_id: payload.context_pack_version_id ?? null,
          context_readiness: payload.context_readiness ?? null,
        },
      },
      options.failAfter,
    );
    return ok({
      idempotent: false,
      qualificationId: String(current.id),
      assessmentId,
      eventId,
      eventType: "support_assessed",
    });
  }

  if (args.p_operation === "record_admission_decision") {
    const payload = args.p_payload;
    const currentAdmission = current.current_admission_decision_id
      ? tables.business_activity_admission_decisions.find(
          (row) => row.id === current.current_admission_decision_id,
        )
      : undefined;
    if (
      currentAdmission &&
      !currentAdmission.superseded_at &&
      currentAdmission.rollout_mode === payload.rollout_mode &&
      currentAdmission.admission_status === payload.admission_status &&
      currentAdmission.reason_code === payload.reason_code &&
      currentAdmission.support_assessment_id === payload.support_assessment_id
    ) {
      return ok({
        idempotent: true,
        qualificationId: String(current.id),
        admissionId: String(currentAdmission.id),
        assessmentId: currentAdmission.support_assessment_id
          ? String(currentAdmission.support_assessment_id)
          : null,
      });
    }
    if (currentAdmission && !currentAdmission.superseded_at) {
      currentAdmission.superseded_at = nowIso();
    }
    const admissionId = crypto.randomUUID();
    tables.business_activity_admission_decisions.push({
      id: admissionId,
      organization_id: args.p_organization_id,
      business_activity_id: args.p_business_activity_id,
      qualification_id: current.id,
      support_assessment_id: payload.support_assessment_id ?? null,
      rollout_mode: payload.rollout_mode,
      admission_status: payload.admission_status,
      reason_code: payload.reason_code,
      decision_source: payload.decision_source,
      actor_user_id: args.p_actor_user_id,
      decided_at: nowIso(),
      superseded_at: null,
    });
    if (options.failAfter === "admission") {
      throw new Error("forced admission failure");
    }
    current.current_admission_decision_id = admissionId;
    current.updated_at = nowIso();
    const eventId = appendEvent(
      tables,
      {
        organizationId: args.p_organization_id,
        activityId: args.p_business_activity_id,
        qualificationId: String(current.id),
        eventType: "admission_decided",
        actorUserId: args.p_actor_user_id,
        actorMemberId: args.p_actor_member_id,
        payload: {
          admission_id: admissionId,
          support_assessment_id: payload.support_assessment_id ?? null,
          rollout_mode: payload.rollout_mode,
          admission_status: payload.admission_status,
          reason_code: payload.reason_code,
        },
      },
      options.failAfter,
    );
    return ok({
      idempotent: false,
      qualificationId: String(current.id),
      admissionId,
      assessmentId: payload.support_assessment_id ? String(payload.support_assessment_id) : null,
      eventId,
      eventType: "admission_decided",
    });
  }

  if (args.p_operation === "join_demand_waitlist") {
    const payload = args.p_payload;
    const existing = tables.business_activity_demand_signals.find(
      (row) =>
        row.business_activity_id === args.p_business_activity_id &&
        row.taxonomy_target_id === payload.taxonomy_target_id &&
        row.status === "active",
    );
    if (existing) {
      return ok({
        idempotent: true,
        qualificationId: String(current.id),
        demandSignalId: String(existing.id),
      });
    }
    const demandSignalId = crypto.randomUUID();
    tables.business_activity_demand_signals.push({
      id: demandSignalId,
      organization_id: args.p_organization_id,
      business_activity_id: args.p_business_activity_id,
      taxonomy_target_kind: payload.taxonomy_target_kind,
      taxonomy_target_id: payload.taxonomy_target_id,
      taxonomy_target_key: payload.taxonomy_target_key,
      requested_rollout: payload.requested_rollout,
      status: "active",
      created_at: nowIso(),
      last_confirmed_at: nowIso(),
      withdrawn_at: null,
    });
    if (options.failAfter === "demand") {
      throw new Error("forced demand failure");
    }
    const eventId = appendEvent(
      tables,
      {
        organizationId: args.p_organization_id,
        activityId: args.p_business_activity_id,
        qualificationId: String(current.id),
        eventType: "waitlist_joined",
        actorUserId: args.p_actor_user_id,
        actorMemberId: args.p_actor_member_id,
        payload: {
          demand_signal_id: demandSignalId,
          taxonomy_target_id: payload.taxonomy_target_id,
          taxonomy_target_key: payload.taxonomy_target_key,
          requested_rollout: payload.requested_rollout,
        },
      },
      options.failAfter,
    );
    return ok({
      idempotent: false,
      qualificationId: String(current.id),
      demandSignalId,
      eventId,
      eventType: "waitlist_joined",
    });
  }

  if (args.p_operation === "withdraw_demand_waitlist") {
    const existing = tables.business_activity_demand_signals.find(
      (row) =>
        row.business_activity_id === args.p_business_activity_id && row.status === "active",
    );
    if (!existing) {
      return ok({
        idempotent: true,
        qualificationId: String(current.id),
      });
    }
    existing.status = "withdrawn";
    existing.withdrawn_at = nowIso();
    if (options.failAfter === "demand") {
      throw new Error("forced demand failure");
    }
    const eventId = appendEvent(tables, {
      organizationId: args.p_organization_id,
      activityId: args.p_business_activity_id,
      qualificationId: String(current.id),
      eventType: "waitlist_withdrawn",
      actorUserId: args.p_actor_user_id,
      actorMemberId: args.p_actor_member_id,
      payload: {
        demand_signal_id: existing.id,
        taxonomy_target_id: existing.taxonomy_target_id,
      },
    });
    return ok({
      idempotent: false,
      qualificationId: String(current.id),
      demandSignalId: String(existing.id),
      eventId,
      eventType: "waitlist_withdrawn",
    });
  }

  return fail("DATABASE_WRITE_ERROR", "Unknown BQA mutation operation");
}
