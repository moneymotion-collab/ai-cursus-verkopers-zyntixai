/**
 * BQA qualification + classification application types.
 * Persistence rows live in generated Database types and must not leak as the
 * product contract. Classification here is not canonical Activity TAX.
 */

export type BqaOrganizationRole = "owner" | "admin" | "staff" | "viewer";

export type BqaActivityStatus = "draft" | "active" | "archived";

export type BqaActivityRef = {
  activityId: string;
  organizationId: string;
  status: BqaActivityStatus;
};

export type BqaMembership = {
  organizationId: string;
  membershipId: string;
  userId: string;
  role: BqaOrganizationRole;
};

export type QualificationProgressStatus =
  | "unstarted"
  | "collecting"
  | "awaiting_confirmation"
  | "needs_review"
  | "confirmed"
  | "requalifying";

export type QualificationReviewStatus =
  | "none"
  | "required"
  | "requested"
  | "resolved_proceed"
  | "resolved_reject";

export type QualificationAnswerValueKind = "text" | "code";

export type QualificationAnswerSource =
  | "user_self"
  | "organization_admin"
  | "support_assisted"
  | "ai_proposal";

export type PrimaryValueDeliveredCode =
  | "structured_programs"
  | "individualized_service"
  | "physical_product"
  | "digital_product"
  | "field_work";

export type LineStructureCode = "one_line" | "several_lines";

export type ClassificationOutcome =
  | "classified"
  | "ambiguous"
  | "unknown"
  | "architecture_gap";

export type ClassificationDecisionStatus = "proposed" | "confirmed" | "superseded";

export type ClassificationConfidenceBand = "high" | "medium" | "low" | "none";

export type ClassificationProposalSource =
  | "ai_proposal"
  | "user_self"
  | "organization_admin"
  | "support_assisted"
  | "platform_review"
  | "migration";

export type ClassificationDecisionSource =
  | "user_self"
  | "organization_admin"
  | "support_assisted"
  | "platform_review"
  | "migration";

export type TaxonomyTargetKind =
  | "foundation"
  | "industry"
  | "niche"
  | "specialization"
  | "deep_specialization";

export type QualificationAnswer = {
  answerId: string;
  organizationId: string;
  businessActivityId: string;
  qualificationId: string;
  questionKey: string;
  valueKind: QualificationAnswerValueKind;
  valueText: string | null;
  valueCode: string | null;
  source: QualificationAnswerSource;
  actorUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClassificationDecision = {
  decisionId: string;
  organizationId: string;
  businessActivityId: string;
  qualificationId: string;
  taxonomyReleaseId: string;
  taxonomyTargetKind: TaxonomyTargetKind | null;
  taxonomyTargetId: string | null;
  taxonomyTargetKey: string | null;
  classificationOutcome: ClassificationOutcome;
  confidenceBand: ClassificationConfidenceBand;
  decisionStatus: ClassificationDecisionStatus;
  proposalSource: ClassificationProposalSource;
  decisionSource: ClassificationDecisionSource | null;
  confirmedByUserId: string | null;
  confirmedAt: string | null;
  alternativeTargetIds: readonly string[];
  unresolvedDimensionCodes: readonly string[];
  evidenceSnapshot: Readonly<Record<string, unknown>>;
  supersedesDecisionId: string | null;
  createdAt: string;
  supersededAt: string | null;
};

export type QualificationEventType =
  | "qualification_started"
  | "answer_saved"
  | "classification_proposed"
  | "classification_confirmed"
  | "classification_superseded"
  | "review_requested"
  | "split_recommended"
  | "requalify_started";

export type QualificationEvent = {
  eventId: string;
  organizationId: string;
  businessActivityId: string;
  qualificationId: string;
  eventType: QualificationEventType;
  actorUserId: string | null;
  actorMemberId: string | null;
  payload: Readonly<Record<string, unknown>>;
  idempotencyKey: string | null;
  createdAt: string;
};

export type BusinessActivityQualification = {
  qualificationId: string;
  organizationId: string;
  businessActivityId: string;
  progressStatus: QualificationProgressStatus;
  reviewStatus: QualificationReviewStatus;
  splitRecommended: boolean;
  currentClassificationDecisionId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QualificationCompleteness = {
  requiredComplete: boolean;
  missingQuestionKeys: readonly string[];
};

export type ClassificationHistorySummary = {
  decisionId: string;
  decisionStatus: ClassificationDecisionStatus;
  classificationOutcome: ClassificationOutcome;
  confidenceBand: ClassificationConfidenceBand;
  taxonomyTargetId: string | null;
  taxonomyTargetKey: string | null;
  createdAt: string;
};

export type BusinessActivityQualificationReadModel = {
  organizationId: string;
  businessActivityId: string;
  qualification: BusinessActivityQualification;
  answers: readonly QualificationAnswer[];
  completeness: QualificationCompleteness;
  currentClassification: ClassificationDecision | null;
  classificationHistory: readonly ClassificationHistorySummary[];
  events: readonly QualificationEvent[] | null;
};

export type BqaMutationSuccess = {
  idempotent: boolean;
  qualificationId: string;
  decisionId: string | null;
  answerId: string | null;
  eventId: string | null;
  eventType: QualificationEventType | null;
};

export type BqaMutationOperation =
  | "ensure_qualification"
  | "save_answer"
  | "record_proposal"
  | "confirm_classification"
  | "begin_requalification"
  | "request_review";
