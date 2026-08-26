import "server-only";

import {
  canPerformBqaOperation,
  canReadQualificationEvents,
  confirmationDecisionSourceForRole,
  proposalSourceForRole,
  answerSourceForRole,
} from "@/features/business-qualification/domain/authorization";
import {
  confirmationBlock,
  isBqaUuid,
  isClassificationOutcome,
  isConfidenceBand,
  MAX_ALTERNATIVE_TARGETS,
  MAX_UNRESOLVED_DIMENSIONS,
  boundedUuidList,
  sameConfirmedTarget,
  sanitizeEvidenceSnapshot,
} from "@/features/business-qualification/domain/classification";
import {
  bqaFail,
  bqaOk,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import { evaluateRequiredAnswers, validateQualificationAnswer } from "@/features/business-qualification/domain/questions";
import { requiresReview } from "@/features/business-qualification/domain/progress";
import type {
  BqaMutationOperation,
  BqaMutationSuccess,
  BqaOrganizationRole,
  BusinessActivityQualificationReadModel,
  ClassificationDecision,
} from "@/features/business-qualification/domain/types";
import {
  createOrgContextActivityLookup,
  type BqaActivityLookup,
} from "@/features/business-qualification/server/activity-lookup";
import {
  createBqaMutationRpcClient,
  createBqaQueryClient,
} from "@/features/business-qualification/server/bqa-client";
import {
  invokeBqaMutation,
  type BqaMutationRpcClient,
} from "@/features/business-qualification/server/bqa-rpc";
import { BusinessQualificationRepository } from "@/features/business-qualification/server/business-qualification.repository";
import type { BqaQueryClient } from "@/features/business-qualification/server/bqa-query";
import {
  authorizeBqaCaller,
  type BqaAuthLookup,
  type BqaCaller,
} from "@/features/business-qualification/server/tenant-authorization";
import {
  createBqaTaxonomyResolver,
  type BqaTaxonomyResolver,
} from "@/features/business-qualification/server/taxonomy-target";
import { createControlPlaneReaders } from "@/features/control-plane/server/control-plane-client";
import { createOrgContextQueryClient } from "@/features/org-context/server/org-context-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BusinessQualificationServiceDeps = {
  auth: BqaAuthLookup;
  queryClient: BqaQueryClient;
  activities: BqaActivityLookup;
  repository: BusinessQualificationRepository;
  taxonomy: BqaTaxonomyResolver;
  mutate: BqaMutationRpcClient;
};

type AuthorizedMutation = {
  caller: BqaCaller;
};

export class BusinessQualificationService {
  constructor(private readonly deps: BusinessQualificationServiceDeps) {}

  async getBusinessActivityQualification(input: {
    organizationId: string;
    businessActivityId: string;
  }): Promise<BqaResult<BusinessActivityQualificationReadModel>> {
    const authorized = await this.authorizeRead(input);
    if (!authorized.ok) {
      return authorized;
    }
    const qualification = await this.deps.repository.getQualification(
      input.organizationId,
      input.businessActivityId,
    );
    if (!qualification.ok) {
      return qualification;
    }
    if (!qualification.value) {
      return bqaFail("QUALIFICATION_NOT_FOUND", "Qualification has not been started");
    }
    return this.buildReadModel(authorized.value.role, qualification.value);
  }

  async ensureBusinessActivityQualification(input: {
    organizationId: string;
    businessActivityId: string;
  }): Promise<BqaResult<BqaMutationSuccess>> {
    const authorized = await this.authorizeMutation(input, "ensure_qualification");
    if (!authorized.ok) {
      return authorized;
    }
    return this.mutate("ensure_qualification", authorized.value.caller, input, {});
  }

  async saveQualificationAnswer(input: {
    organizationId: string;
    businessActivityId: string;
    questionKey: string;
    valueText?: string | null;
    valueCode?: string | null;
  }): Promise<BqaResult<BqaMutationSuccess>> {
    const authorized = await this.authorizeMutation(input, "save_answer");
    if (!authorized.ok) {
      return authorized;
    }
    const answer = validateQualificationAnswer(input);
    if (!answer.ok) {
      return answer;
    }
    return this.mutate("save_answer", authorized.value.caller, input, {
      question_key: answer.value.questionKey,
      value_kind: answer.value.valueKind,
      value_text: answer.value.valueText,
      value_code: answer.value.valueCode,
      source: answerSourceForRole(authorized.value.caller.role),
    });
  }

  async recordClassificationProposal(input: {
    organizationId: string;
    businessActivityId: string;
    classificationOutcome: string;
    confidenceBand: string;
    taxonomyTargetId?: string | null;
    claimedTaxonomyKind?: string | null;
    claimedTaxonomyKey?: string | null;
    proposalSource?: string | null;
    alternativeTargetIds?: readonly string[];
    unresolvedDimensionCodes?: readonly string[];
    evidenceSnapshot?: Readonly<Record<string, unknown>>;
  }): Promise<BqaResult<BqaMutationSuccess>> {
    const authorized = await this.authorizeMutation(input, "record_proposal");
    if (!authorized.ok) {
      return authorized;
    }
    if (!isClassificationOutcome(input.classificationOutcome)) {
      return bqaFail("INVALID_ANSWER", "classificationOutcome is not a frozen value");
    }
    if (!isConfidenceBand(input.confidenceBand)) {
      return bqaFail("INVALID_ANSWER", "confidenceBand is not a frozen value");
    }
    const alternatives = boundedUuidList(input.alternativeTargetIds, MAX_ALTERNATIVE_TARGETS);
    if (!alternatives.ok) {
      return alternatives;
    }
    const unresolved = input.unresolvedDimensionCodes ?? [];
    if (unresolved.length > MAX_UNRESOLVED_DIMENSIONS) {
      return bqaFail("INVALID_ANSWER", "Too many unresolved dimension codes");
    }
    const evidence = sanitizeEvidenceSnapshot(input.evidenceSnapshot);
    if (!evidence.ok) {
      return evidence;
    }
    if (authorized.value.caller.role !== "owner" && authorized.value.caller.role !== "admin") {
      return bqaFail("FORBIDDEN_ROLE", "Classification proposal requires Owner or Admin");
    }
    const proposalSource = proposalSourceForRole(
      authorized.value.caller.role,
      input.proposalSource,
    );
    let targetId: string | null = null;
    let targetKind: string | null = null;
    let targetKey: string | null = null;
    let releaseId: string;
    if (input.classificationOutcome === "classified" || input.taxonomyTargetId) {
      if (!input.taxonomyTargetId) {
        return bqaFail(
          "CLASSIFICATION_TARGET_NOT_FOUND",
          "Classified proposals require a TAX target id",
        );
      }
      const resolved = await this.deps.taxonomy.resolveActiveTarget({
        taxonomyTargetId: input.taxonomyTargetId,
        claimedKind: input.claimedTaxonomyKind,
      });
      if (!resolved.ok) {
        return resolved;
      }
      targetId = resolved.value.id;
      targetKind = resolved.value.kind;
      targetKey = resolved.value.key;
      releaseId = resolved.value.releaseId;
    } else {
      const release = await this.deps.taxonomy.resolveActiveRelease();
      if (!release.ok) {
        return release;
      }
      releaseId = release.value.releaseId;
    }

    return this.mutate("record_proposal", authorized.value.caller, input, {
      classification_outcome: input.classificationOutcome,
      confidence_band: input.confidenceBand,
      proposal_source: proposalSource,
      taxonomy_release_id: releaseId,
      taxonomy_target_id: targetId,
      taxonomy_target_kind: targetKind,
      taxonomy_target_key: targetKey,
      alternative_target_ids: alternatives.value,
      unresolved_dimension_codes: unresolved,
      evidence_snapshot: evidence.value,
      review_required: requiresReview(
        input.classificationOutcome,
        input.confidenceBand,
        unresolved,
      ),
    });
  }

  async confirmClassification(input: {
    organizationId: string;
    businessActivityId: string;
    taxonomyTargetId: string;
  }): Promise<BqaResult<BqaMutationSuccess>> {
    const authorized = await this.authorizeMutation(input, "confirm_classification");
    if (!authorized.ok) {
      return authorized;
    }
    const role = authorized.value.caller.role;
    if (role !== "owner" && role !== "admin") {
      return bqaFail("FORBIDDEN_ROLE", "Classification confirmation requires Owner or Admin");
    }
    const resolved = await this.deps.taxonomy.resolveActiveTarget({
      taxonomyTargetId: input.taxonomyTargetId,
    });
    if (!resolved.ok) {
      return resolved;
    }
    const loaded = await this.loadAggregate(input.organizationId, input.businessActivityId);
    if (!loaded.ok) {
      return loaded;
    }
    const completeness = evaluateRequiredAnswers(loaded.value.answers);
    const proposed = loaded.value.decisions.find(
      (decision) =>
        decision.decisionStatus === "proposed" &&
        decision.taxonomyTargetId === resolved.value.id &&
        decision.classificationOutcome === "classified",
    ) ?? null;
    const currentConfirmed =
      loaded.value.decisions.find((decision) => decision.decisionStatus === "confirmed") ??
      null;
    if (
      sameConfirmedTarget({
        current: currentConfirmed,
        taxonomyTargetId: resolved.value.id,
        taxonomyReleaseId: resolved.value.releaseId,
      })
    ) {
      return this.mutate("confirm_classification", authorized.value.caller, input, {
        taxonomy_target_id: resolved.value.id,
        taxonomy_target_kind: resolved.value.kind,
        taxonomy_target_key: resolved.value.key,
        taxonomy_release_id: resolved.value.releaseId,
        decision_source: confirmationDecisionSourceForRole(role),
      });
    }
    if (
      currentConfirmed &&
      currentConfirmed.taxonomyTargetId !== resolved.value.id &&
      loaded.value.qualification.progressStatus === "confirmed"
    ) {
      return bqaFail(
        "REQUALIFICATION_REQUIRED",
        "A different confirmed classification requires requalification",
      );
    }
    const gate = confirmationBlock({
      requiredAnswersComplete: completeness.requiredComplete,
      splitRecommended: loaded.value.qualification.splitRecommended,
      reviewStatus: loaded.value.qualification.reviewStatus,
      decision: proposed,
    });
    if (!gate.ok) {
      return gate;
    }
    return this.mutate("confirm_classification", authorized.value.caller, input, {
      taxonomy_target_id: resolved.value.id,
      taxonomy_target_kind: resolved.value.kind,
      taxonomy_target_key: resolved.value.key,
      taxonomy_release_id: resolved.value.releaseId,
      decision_source: confirmationDecisionSourceForRole(role),
      proposal_id: proposed?.decisionId ?? null,
    });
  }

  async beginRequalification(input: {
    organizationId: string;
    businessActivityId: string;
  }): Promise<BqaResult<BqaMutationSuccess>> {
    const authorized = await this.authorizeMutation(input, "begin_requalification");
    if (!authorized.ok) {
      return authorized;
    }
    return this.mutate("begin_requalification", authorized.value.caller, input, {});
  }

  async requestReview(input: {
    organizationId: string;
    businessActivityId: string;
  }): Promise<BqaResult<BqaMutationSuccess>> {
    const authorized = await this.authorizeMutation(input, "request_review");
    if (!authorized.ok) {
      return authorized;
    }
    return this.mutate("request_review", authorized.value.caller, input, {});
  }

  private async authorizeRead(input: {
    organizationId: string;
    businessActivityId: string;
  }): Promise<BqaResult<BqaCaller>> {
    const caller = await authorizeBqaCaller({
      auth: this.deps.auth,
      queryClient: this.deps.queryClient,
      organizationId: input.organizationId,
    });
    if (!caller.ok) {
      return caller;
    }
    if (!isBqaUuid(input.businessActivityId)) {
      return bqaFail("ACTIVITY_NOT_FOUND", "Business Activity not found or access denied");
    }
    const activity = await this.deps.activities.getActivity(
      input.organizationId,
      input.businessActivityId,
    );
    if (!activity.ok) {
      return activity;
    }
    return caller;
  }

  private async authorizeMutation(
    input: { organizationId: string; businessActivityId: string },
    operation: BqaMutationOperation,
  ): Promise<BqaResult<AuthorizedMutation>> {
    const caller = await this.authorizeRead(input);
    if (!caller.ok) {
      return caller;
    }
    if (!canPerformBqaOperation(caller.value.role, operation)) {
      return bqaFail("FORBIDDEN_ROLE", "This BQA command is not allowed for the caller role");
    }
    const activity = await this.deps.activities.getActivity(
      input.organizationId,
      input.businessActivityId,
    );
    if (!activity.ok) {
      return activity;
    }
    if (activity.value.status === "archived") {
      return bqaFail("ACTIVITY_NOT_FOUND", "Business Activity not found or access denied");
    }
    return bqaOk({ caller: caller.value });
  }

  private async mutate(
    operation: BqaMutationOperation,
    caller: BqaCaller,
    input: { organizationId: string; businessActivityId: string },
    payload: Record<string, unknown>,
  ): Promise<BqaResult<BqaMutationSuccess>> {
    return invokeBqaMutation(this.deps.mutate, {
      p_operation: operation,
      p_organization_id: input.organizationId,
      p_business_activity_id: input.businessActivityId,
      p_actor_user_id: caller.userId,
      p_actor_member_id: caller.membershipId,
      p_payload: payload,
    });
  }

  private async buildReadModel(
    role: BqaOrganizationRole,
    qualification: BusinessActivityQualificationReadModel["qualification"],
  ): Promise<BqaResult<BusinessActivityQualificationReadModel>> {
    const answers = await this.deps.repository.listAnswers(
      qualification.organizationId,
      qualification.qualificationId,
    );
    if (!answers.ok) {
      return answers;
    }
    const decisions = await this.deps.repository.listClassificationDecisions(
      qualification.organizationId,
      qualification.businessActivityId,
    );
    if (!decisions.ok) {
      return decisions;
    }
    const current =
      decisions.value.find(
        (decision) => decision.decisionId === qualification.currentClassificationDecisionId,
      ) ??
      decisions.value.find((decision) => decision.decisionStatus === "confirmed") ??
      null;
    let events: BusinessActivityQualificationReadModel["events"] = null;
    if (canReadQualificationEvents(role)) {
      const listed = await this.deps.repository.listEvents(
        qualification.organizationId,
        qualification.businessActivityId,
      );
      if (!listed.ok) {
        return listed;
      }
      events = listed.value;
    }
    return bqaOk({
      organizationId: qualification.organizationId,
      businessActivityId: qualification.businessActivityId,
      qualification,
      answers: answers.value,
      completeness: evaluateRequiredAnswers(answers.value),
      currentClassification: current,
      classificationHistory: this.deps.repository.toHistorySummary(decisions.value),
      events,
    });
  }

  private async loadAggregate(organizationId: string, businessActivityId: string) {
    const qualification = await this.deps.repository.getQualification(
      organizationId,
      businessActivityId,
    );
    if (!qualification.ok) {
      return qualification;
    }
    if (!qualification.value) {
      return bqaFail("QUALIFICATION_NOT_FOUND", "Qualification has not been started");
    }
    const answers = await this.deps.repository.listAnswers(
      organizationId,
      qualification.value.qualificationId,
    );
    if (!answers.ok) {
      return answers;
    }
    const decisions = await this.deps.repository.listClassificationDecisions(
      organizationId,
      businessActivityId,
    );
    if (!decisions.ok) {
      return decisions;
    }
    return bqaOk({
      qualification: qualification.value,
      answers: answers.value,
      decisions: decisions.value as ClassificationDecision[],
    });
  }
}

export function createBusinessQualificationService(input: {
  env?: Record<string, string | undefined>;
  auth?: BqaAuthLookup;
  queryClient?: BqaQueryClient;
  activities?: BqaActivityLookup;
  taxonomy?: BqaTaxonomyResolver;
  mutate?: BqaMutationRpcClient;
} = {}): BusinessQualificationService {
  const env = input.env ?? process.env;
  const queryClient = input.queryClient ?? createBqaQueryClient(env);
  const mutate = input.mutate ?? createBqaMutationRpcClient(env);
  const activities =
    input.activities ?? createOrgContextActivityLookup(createOrgContextQueryClient(env));
  const taxonomy =
    input.taxonomy ?? createBqaTaxonomyResolver(createControlPlaneReaders().taxonomy);
  const auth =
    input.auth ??
    ({
      async getUser() {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase.auth.getUser();
        return data.user ? { id: data.user.id } : null;
      },
    } satisfies BqaAuthLookup);
  return new BusinessQualificationService({
    auth,
    queryClient,
    activities,
    repository: new BusinessQualificationRepository(queryClient),
    taxonomy,
    mutate,
  });
}
