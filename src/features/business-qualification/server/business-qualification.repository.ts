import "server-only";

import {
  bqaFail,
  bqaOk,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import type {
  BusinessActivityQualification,
  ClassificationDecision,
  ClassificationDecisionStatus,
  ClassificationHistorySummary,
  QualificationAnswer,
  QualificationEvent,
  QualificationEventType,
} from "@/features/business-qualification/domain/types";
import {
  asBoolean,
  asJsonObject,
  asNullableString,
  asString,
  asStringArray,
  executeBqaQuery,
  type BqaQueryClient,
} from "@/features/business-qualification/server/bqa-query";

function mapQualification(
  row: Record<string, unknown>,
): BusinessActivityQualification | null {
  const qualificationId = asString(row.id);
  const organizationId = asString(row.organization_id);
  const businessActivityId = asString(row.business_activity_id);
  const progressStatus = asString(row.progress_status);
  const reviewStatus = asString(row.review_status);
  const splitRecommended = asBoolean(row.split_recommended);
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);
  if (
    !qualificationId ||
    !organizationId ||
    !businessActivityId ||
    !progressStatus ||
    !reviewStatus ||
    splitRecommended === null ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }
  return {
    qualificationId,
    organizationId,
    businessActivityId,
    progressStatus: progressStatus as BusinessActivityQualification["progressStatus"],
    reviewStatus: reviewStatus as BusinessActivityQualification["reviewStatus"],
    splitRecommended,
    currentClassificationDecisionId: asNullableString(row.current_classification_decision_id),
    createdAt,
    updatedAt,
  };
}

function mapAnswer(row: Record<string, unknown>): QualificationAnswer | null {
  const answerId = asString(row.id);
  const organizationId = asString(row.organization_id);
  const businessActivityId = asString(row.business_activity_id);
  const qualificationId = asString(row.qualification_id);
  const questionKey = asString(row.question_key);
  const valueKind = asString(row.value_kind);
  const source = asString(row.source);
  const createdAt = asString(row.created_at);
  const updatedAt = asString(row.updated_at);
  if (
    !answerId ||
    !organizationId ||
    !businessActivityId ||
    !qualificationId ||
    !questionKey ||
    !valueKind ||
    !source ||
    !createdAt ||
    !updatedAt
  ) {
    return null;
  }
  return {
    answerId,
    organizationId,
    businessActivityId,
    qualificationId,
    questionKey,
    valueKind: valueKind as QualificationAnswer["valueKind"],
    valueText: asNullableString(row.value_text),
    valueCode: asNullableString(row.value_code),
    source: source as QualificationAnswer["source"],
    actorUserId: asNullableString(row.actor_user_id),
    createdAt,
    updatedAt,
  };
}

function mapDecision(row: Record<string, unknown>): ClassificationDecision | null {
  const decisionId = asString(row.id);
  const organizationId = asString(row.organization_id);
  const businessActivityId = asString(row.business_activity_id);
  const qualificationId = asString(row.qualification_id);
  const taxonomyReleaseId = asString(row.taxonomy_release_id);
  const classificationOutcome = asString(row.classification_outcome);
  const confidenceBand = asString(row.confidence_band);
  const decisionStatus = asString(row.decision_status);
  const proposalSource = asString(row.proposal_source);
  const createdAt = asString(row.created_at);
  const evidence = asJsonObject(row.evidence_snapshot) ?? {};
  if (
    !decisionId ||
    !organizationId ||
    !businessActivityId ||
    !qualificationId ||
    !taxonomyReleaseId ||
    !classificationOutcome ||
    !confidenceBand ||
    !decisionStatus ||
    !proposalSource ||
    !createdAt
  ) {
    return null;
  }
  return {
    decisionId,
    organizationId,
    businessActivityId,
    qualificationId,
    taxonomyReleaseId,
    taxonomyTargetKind: asNullableString(row.taxonomy_target_kind) as ClassificationDecision["taxonomyTargetKind"],
    taxonomyTargetId: asNullableString(row.taxonomy_target_id),
    taxonomyTargetKey: asNullableString(row.taxonomy_target_key),
    classificationOutcome: classificationOutcome as ClassificationDecision["classificationOutcome"],
    confidenceBand: confidenceBand as ClassificationDecision["confidenceBand"],
    decisionStatus: decisionStatus as ClassificationDecisionStatus,
    proposalSource: proposalSource as ClassificationDecision["proposalSource"],
    decisionSource: asNullableString(row.decision_source) as ClassificationDecision["decisionSource"],
    confirmedByUserId: asNullableString(row.confirmed_by_user_id),
    confirmedAt: asNullableString(row.confirmed_at),
    alternativeTargetIds: asStringArray(row.alternative_target_ids),
    unresolvedDimensionCodes: asStringArray(row.unresolved_dimension_codes),
    evidenceSnapshot: evidence,
    supersedesDecisionId: asNullableString(row.supersedes_decision_id),
    createdAt,
    supersededAt: asNullableString(row.superseded_at),
  };
}

function mapEvent(row: Record<string, unknown>): QualificationEvent | null {
  const eventId = asString(row.id);
  const organizationId = asString(row.organization_id);
  const businessActivityId = asString(row.business_activity_id);
  const qualificationId = asString(row.qualification_id);
  const eventType = asString(row.event_type);
  const createdAt = asString(row.created_at);
  const payload = asJsonObject(row.payload) ?? {};
  if (
    !eventId ||
    !organizationId ||
    !businessActivityId ||
    !qualificationId ||
    !eventType ||
    !createdAt
  ) {
    return null;
  }
  return {
    eventId,
    organizationId,
    businessActivityId,
    qualificationId,
    eventType: eventType as QualificationEventType,
    actorUserId: asNullableString(row.actor_user_id),
    actorMemberId: asNullableString(row.actor_member_id),
    payload,
    idempotencyKey: asNullableString(row.idempotency_key),
    createdAt,
  };
}

export class BusinessQualificationRepository {
  constructor(private readonly client: BqaQueryClient) {}

  async getQualification(
    organizationId: string,
    businessActivityId: string,
  ): Promise<BqaResult<BusinessActivityQualification | null>> {
    const rows = await executeBqaQuery(
      this.client
        .from("business_activity_qualifications")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("business_activity_id", businessActivityId),
    );
    if (!rows.ok) {
      return rows;
    }
    if (rows.value.length === 0) {
      return bqaOk(null);
    }
    const mapped = mapQualification(rows.value[0]);
    if (!mapped) {
      return bqaFail("CATALOG_INTEGRITY_ERROR", "Qualification row is incomplete");
    }
    return bqaOk(mapped);
  }

  async listAnswers(
    organizationId: string,
    qualificationId: string,
  ): Promise<BqaResult<QualificationAnswer[]>> {
    const rows = await executeBqaQuery(
      this.client
        .from("business_activity_qualification_answers")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("qualification_id", qualificationId),
    );
    if (!rows.ok) {
      return rows;
    }
    const answers: QualificationAnswer[] = [];
    for (const row of rows.value) {
      const mapped = mapAnswer(row);
      if (!mapped) {
        return bqaFail("CATALOG_INTEGRITY_ERROR", "Qualification answer row is incomplete");
      }
      answers.push(mapped);
    }
    return bqaOk(answers);
  }

  async listClassificationDecisions(
    organizationId: string,
    businessActivityId: string,
  ): Promise<BqaResult<ClassificationDecision[]>> {
    const rows = await executeBqaQuery(
      this.client
        .from("business_activity_classification_decisions")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("business_activity_id", businessActivityId)
        .order("created_at", { ascending: false }),
    );
    if (!rows.ok) {
      return rows;
    }
    const decisions: ClassificationDecision[] = [];
    for (const row of rows.value) {
      const mapped = mapDecision(row);
      if (!mapped) {
        return bqaFail("CATALOG_INTEGRITY_ERROR", "Classification decision row is incomplete");
      }
      decisions.push(mapped);
    }
    return bqaOk(decisions);
  }

  async listEvents(
    organizationId: string,
    businessActivityId: string,
  ): Promise<BqaResult<QualificationEvent[]>> {
    const rows = await executeBqaQuery(
      this.client
        .from("business_activity_qualification_events")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("business_activity_id", businessActivityId)
        .order("created_at", { ascending: false }),
    );
    if (!rows.ok) {
      return rows;
    }
    const events: QualificationEvent[] = [];
    for (const row of rows.value) {
      const mapped = mapEvent(row);
      if (!mapped) {
        return bqaFail("CATALOG_INTEGRITY_ERROR", "Qualification event row is incomplete");
      }
      events.push(mapped);
    }
    return bqaOk(events);
  }

  toHistorySummary(
    decisions: readonly ClassificationDecision[],
  ): ClassificationHistorySummary[] {
    return decisions.map((decision) => ({
      decisionId: decision.decisionId,
      decisionStatus: decision.decisionStatus,
      classificationOutcome: decision.classificationOutcome,
      confidenceBand: decision.confidenceBand,
      taxonomyTargetId: decision.taxonomyTargetId,
      taxonomyTargetKey: decision.taxonomyTargetKey,
      createdAt: decision.createdAt,
    }));
  }
}
