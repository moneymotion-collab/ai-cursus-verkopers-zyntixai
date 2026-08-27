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
  classificationKind: TaxonomyTargetKind | null;
  classificationTargetId: string | null;
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
  | "requalify_started"
  | "support_assessed"
  | "admission_decided"
  | "waitlist_joined"
  | "waitlist_withdrawn"
  | "review_resolved"
  | "assignment_handoff_requested"
  | "assignment_handoff_completed";

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
  currentSupportAssessmentId: string | null;
  currentAdmissionDecisionId: string | null;
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
  currentSupportAssessment: SupportAssessment | null;
  currentAdmissionDecision: AdmissionDecision | null;
  demandSignal: DemandSignal | null;
  existingContextPin: ExistingContextPinObservation | null;
  upgradeMayExist: boolean;
  events: readonly QualificationEvent[] | null;
};

export type RolloutMode = "internal_qa" | "closed_beta" | "production" | "open_beta";

export type ContextReadinessStatus =
  | "planned"
  | "context_ready"
  | "beta_supported"
  | "production_verified";

export type SupportStatus =
  | "supported_for_requested_rollout"
  | "not_yet_supported"
  | "unsupported"
  | "unknown"
  | "needs_review";

export type SupportReasonCode =
  | "eligible"
  | "missing_context_pack"
  | "no_published_context_version"
  | "context_readiness_insufficient"
  | "architecture_gap"
  | "classification_unknown"
  | "classification_ambiguous"
  | "review_required"
  | "open_beta_policy_undefined";

export type AdmissionStatus =
  | "incomplete"
  | "needs_review"
  | "waitlisted"
  | "not_yet_supported"
  | "unsupported"
  | "admitted"
  | "rejected"
  | "blocked";

export type AdmissionReasonCode =
  | "eligible"
  | "incomplete_answers"
  | "confirmation_required"
  | "review_required"
  | "waitlisted_not_eligible"
  | "not_yet_supported"
  | "unsupported"
  | "blocked_integrity"
  | "blocked_policy"
  | "rejected_by_review"
  | "path_b_independent";

export type DemandSignalStatus = "active" | "withdrawn";

export type ContextDiscoveryState =
  | "no_pack"
  | "no_published_version"
  | "published_readiness_insufficient"
  | "eligible_published_version"
  | "catalog_integrity";

export type SupportAssessment = {
  assessmentId: string;
  organizationId: string;
  businessActivityId: string;
  qualificationId: string;
  classificationDecisionId: string | null;
  rolloutMode: RolloutMode;
  supportStatus: SupportStatus;
  reasonCode: SupportReasonCode;
  contextPackId: string | null;
  contextPackVersionId: string | null;
  contextReadiness: ContextReadinessStatus | null;
  architectureGap: boolean;
  assessedAt: string;
  supersededAt: string | null;
};

export type AdmissionDecision = {
  admissionId: string;
  organizationId: string;
  businessActivityId: string;
  qualificationId: string;
  supportAssessmentId: string | null;
  rolloutMode: RolloutMode;
  admissionStatus: AdmissionStatus;
  reasonCode: AdmissionReasonCode;
  decisionSource: ClassificationDecisionSource;
  actorUserId: string | null;
  decidedAt: string;
  supersededAt: string | null;
};

export type DemandSignal = {
  demandSignalId: string;
  organizationId: string;
  businessActivityId: string;
  taxonomyTargetKind: TaxonomyTargetKind;
  taxonomyTargetId: string;
  taxonomyTargetKey: string;
  requestedRollout: RolloutMode;
  status: DemandSignalStatus;
  createdAt: string;
  lastConfirmedAt: string;
  withdrawnAt: string | null;
};

export type ExistingContextPinObservation = {
  assignmentId: string;
  contextPackVersionId: string;
};

export type SupportEvaluationSnapshot = {
  supportStatus: SupportStatus;
  reasonCode: SupportReasonCode;
  architectureGap: boolean;
  classificationDecisionId: string | null;
  taxonomyTargetKind: TaxonomyTargetKind | null;
  taxonomyTargetId: string | null;
  taxonomyTargetKey: string | null;
  contextPackId: string | null;
  contextPackVersionId: string | null;
  contextReadiness: ContextReadinessStatus | null;
  existingPinRemains: boolean;
  upgradeMayExist: boolean;
  observedVersionIsPin: boolean;
  discoveryState: ContextDiscoveryState | null;
};

export type AdmissionEvaluationSnapshot = {
  admissionStatus: AdmissionStatus;
  reasonCode: AdmissionReasonCode;
  supportAssessmentId: string | null;
  rolloutMode: RolloutMode;
};

export type BqaMutationSuccess = {
  idempotent: boolean;
  qualificationId: string;
  decisionId: string | null;
  answerId: string | null;
  assessmentId: string | null;
  admissionId: string | null;
  demandSignalId: string | null;
  eventId: string | null;
  eventType: QualificationEventType | null;
};

export type BqaAssignmentHandoffSuccess = {
  ok: true;
  idempotent: boolean;
  organizationId: string;
  businessActivityId: string;
  admissionDecisionId: string;
  classificationApplied: boolean;
  activationApplied: boolean;
  assignmentApplied: boolean;
  assignmentId: string | null;
  contextPackVersionId: string;
};

export type BqaMutationOperation =
  | "ensure_qualification"
  | "save_answer"
  | "record_proposal"
  | "confirm_classification"
  | "begin_requalification"
  | "request_review"
  | "record_support_assessment"
  | "record_admission_decision"
  | "join_demand_waitlist"
  | "withdraw_demand_waitlist";
