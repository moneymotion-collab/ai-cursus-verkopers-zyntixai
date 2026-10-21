import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createControlPlaneReaders } from "@/features/control-plane/server/control-plane-client";
import { createOrgContextQueryClient } from "@/features/org-context/server/org-context-client";
import {
  bqaFail,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import { canPerformAssignmentHandoff } from "@/features/business-qualification/domain/authorization";
import { isBqaUuid } from "@/features/business-qualification/domain/classification";
import { evaluateRequiredAnswers } from "@/features/business-qualification/domain/questions";
import { isRolloutMode } from "@/features/business-qualification/domain/rollout-policy";
import {
  handoffDenialForActivityTax,
  handoffDenialForAdmission,
  handoffDenialForClassification,
  handoffDenialForCurrentReadiness,
  handoffDenialForOpenBeta,
  handoffDenialForQualification,
  handoffDenialForSupport,
} from "@/features/business-qualification/domain/handoff";
import type {
  BqaAssignmentHandoffSuccess,
  RolloutMode,
} from "@/features/business-qualification/domain/types";
import {
  createOrgContextActivityLookup,
  type BqaActivityLookup,
} from "@/features/business-qualification/server/activity-lookup";
import {
  createOrgContextAssignmentObserver,
  type BqaAssignmentObserver,
} from "@/features/business-qualification/server/assignment-observer";
import {
  createBqaContextCatalog,
  type BqaContextCatalog,
} from "@/features/business-qualification/server/context-catalog";
import { BusinessQualificationRepository } from "@/features/business-qualification/server/business-qualification.repository";
import {
  createBqaHandoffRpcClient,
  createBqaQueryClient,
} from "@/features/business-qualification/server/bqa-client";
import type { BqaQueryClient } from "@/features/business-qualification/server/bqa-query";
import {
  invokeBqaAssignmentHandoff,
  type BqaHandoffRpcClient,
} from "@/features/business-qualification/server/bqa-handoff-rpc";
import {
  createBqaTaxonomyResolver,
  type BqaTaxonomyResolver,
} from "@/features/business-qualification/server/taxonomy-target";
import {
  authorizeBqaCaller,
  type BqaAuthLookup,
} from "@/features/business-qualification/server/tenant-authorization";

export type BusinessActivityAdmissionHandoffInput = {
  organizationId: string;
  businessActivityId: string;
  admissionDecisionId: string;
  rolloutMode: RolloutMode;
};

type AdmissionHandoffServiceDeps = {
  auth: BqaAuthLookup;
  queryClient: BqaQueryClient;
  activities: BqaActivityLookup;
  repository: BusinessQualificationRepository;
  taxonomy: BqaTaxonomyResolver;
  catalog: BqaContextCatalog;
  pins: BqaAssignmentObserver;
  createHandoffRpc: () => BqaHandoffRpcClient;
};

export class BusinessActivityAdmissionHandoffService {
  constructor(private readonly deps: AdmissionHandoffServiceDeps) {}

  async applyBusinessActivityAdmissionHandoff(
    input: BusinessActivityAdmissionHandoffInput,
  ): Promise<BqaResult<BqaAssignmentHandoffSuccess>> {
    const caller = await authorizeBqaCaller({
      auth: this.deps.auth,
      queryClient: this.deps.queryClient,
      organizationId: input.organizationId,
    });
    if (!caller.ok) {
      return caller;
    }
    if (!canPerformAssignmentHandoff(caller.value.role)) {
      return bqaFail("FORBIDDEN_ROLE", "This BQA command is not allowed for the caller role");
    }
    if (!isBqaUuid(input.businessActivityId)) {
      return bqaFail("ACTIVITY_NOT_FOUND", "Business Activity not found or access denied");
    }
    if (!isBqaUuid(input.admissionDecisionId)) {
      return bqaFail("ADMISSION_NOT_FOUND", "Admission decision was not found");
    }
    if (!isRolloutMode(input.rolloutMode)) {
      return bqaFail("ROLLOUT_MISMATCH", "rolloutMode is required");
    }

    const openBeta = handoffDenialForOpenBeta(input.rolloutMode);
    if (openBeta) {
      return bqaFail(openBeta, "Open Beta has no handoff policy");
    }

    const activity = await this.deps.activities.getActivity(
      input.organizationId,
      input.businessActivityId,
    );
    if (!activity.ok) {
      return activity;
    }
    if (activity.value.status === "archived") {
      return bqaFail("ACTIVITY_ARCHIVED", "Archived Business Activity cannot be handed off");
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
    const currentQualification = qualification.value;

    const qualificationGate = handoffDenialForQualification({
      progressStatus: currentQualification.progressStatus,
      reviewStatus: currentQualification.reviewStatus,
      splitRecommended: currentQualification.splitRecommended,
    });
    if (qualificationGate) {
      return bqaFail(qualificationGate, "Qualification is not handoff-ready");
    }

    const answers = await this.deps.repository.listAnswers(
      input.organizationId,
      currentQualification.qualificationId,
    );
    if (!answers.ok) {
      return answers;
    }
    if (!evaluateRequiredAnswers(answers.value).requiredComplete) {
      return bqaFail("ADMISSION_NOT_ELIGIBLE", "Required qualification answers are incomplete");
    }

    const admissions = await this.deps.repository.listAdmissionDecisions(
      input.organizationId,
      input.businessActivityId,
    );
    if (!admissions.ok) {
      return admissions;
    }
    const admission = admissions.value.find(
      (row) => row.admissionId === input.admissionDecisionId,
    );
    if (!admission) {
      return bqaFail("ADMISSION_NOT_FOUND", "Admission decision was not found");
    }

    const admissionGate = handoffDenialForAdmission(admission, {
      organizationId: input.organizationId,
      businessActivityId: input.businessActivityId,
      qualificationId: currentQualification.qualificationId,
      rolloutMode: input.rolloutMode,
    });
    if (admissionGate) {
      return bqaFail(admissionGate, "Admission decision cannot authorize this handoff");
    }
    if (!admission.supportAssessmentId) {
      return bqaFail(
        "SUPPORT_ASSESSMENT_NOT_READY",
        "Admission decision is missing its support assessment",
      );
    }

    const assessments = await this.deps.repository.listSupportAssessments(
      input.organizationId,
      input.businessActivityId,
    );
    if (!assessments.ok) {
      return assessments;
    }
    const support = assessments.value.find(
      (row) => row.assessmentId === admission.supportAssessmentId,
    );
    if (!support) {
      return bqaFail(
        "SUPPORT_ASSESSMENT_NOT_READY",
        "Linked support assessment was not found",
      );
    }

    const supportGate = handoffDenialForSupport(support, {
      organizationId: input.organizationId,
      businessActivityId: input.businessActivityId,
      qualificationId: currentQualification.qualificationId,
      rolloutMode: input.rolloutMode,
    });
    if (supportGate) {
      return bqaFail(supportGate, "Linked support assessment cannot authorize this handoff");
    }

    const decisions = await this.deps.repository.listClassificationDecisions(
      input.organizationId,
      input.businessActivityId,
    );
    if (!decisions.ok) {
      return decisions;
    }
    const currentClassification =
      decisions.value.find(
        (decision) =>
          decision.decisionId === currentQualification.currentClassificationDecisionId,
      ) ?? null;
    const classificationGate = handoffDenialForClassification(
      currentClassification,
      support.classificationDecisionId,
    );
    if (classificationGate) {
      return bqaFail(
        classificationGate,
        "Admission is stale relative to the current confirmed classification",
      );
    }

    const tax = await this.deps.taxonomy.resolveActiveTarget({
      taxonomyTargetId: currentClassification!.taxonomyTargetId!,
      claimedKind: currentClassification!.taxonomyTargetKind,
    });
    if (!tax.ok) {
      return tax;
    }
    if (
      tax.value.kind !== currentClassification!.taxonomyTargetKind ||
      tax.value.id !== currentClassification!.taxonomyTargetId ||
      (currentClassification!.taxonomyTargetKey &&
        tax.value.key !== currentClassification!.taxonomyTargetKey)
    ) {
      return bqaFail(
        "CLASSIFICATION_TARGET_INVALID",
        "Confirmed TAX target no longer matches the canonical catalog",
      );
    }

    const pack = await this.deps.catalog.findExactPack(tax.value.kind, tax.value.id);
    if (!pack.ok) {
      return pack;
    }
    if (!pack.value) {
      return bqaFail("CONTEXT_PACK_NOT_FOUND", "Exact Context pack was not found");
    }
    if (pack.value.id !== support.contextPackId) {
      return bqaFail(
        "ADMISSION_STALE",
        "Linked support assessment no longer matches the exact Context pack",
      );
    }

    const version = await this.deps.catalog.getVersion(support.contextPackVersionId!);
    if (!version.ok) {
      return version;
    }
    if (
      version.value.packId !== pack.value.id ||
      version.value.publicationStatus !== "published"
    ) {
      return bqaFail(
        "CONTEXT_VERSION_INVALID",
        "Admitted Context version is unpublished or not on the expected pack",
      );
    }

    const readiness = await this.deps.catalog.getReadiness(support.contextPackVersionId!);
    if (!readiness.ok) {
      return readiness;
    }
    const readinessGate = handoffDenialForCurrentReadiness(
      readiness.value,
      input.rolloutMode,
    );
    if (readinessGate) {
      return bqaFail(
        readinessGate,
        "Current Context readiness is no longer eligible for the requested rollout",
      );
    }

    const taxMismatch = handoffDenialForActivityTax({
      activityKind: activity.value.classificationKind,
      activityTargetId: activity.value.classificationTargetId,
      confirmedKind: tax.value.kind,
      confirmedTargetId: tax.value.id,
    });
    if (taxMismatch) {
      return bqaFail(
        taxMismatch,
        "Business Activity classification does not match the confirmed BQA target",
      );
    }

    const pin = await this.deps.pins.getActivePin(
      input.organizationId,
      input.businessActivityId,
    );
    if (!pin.ok) {
      return pin;
    }
    if (
      pin.value &&
      pin.value.contextPackVersionId !== support.contextPackVersionId
    ) {
      return bqaFail(
        "CONTEXT_REPIN_REQUIRED",
        "Activity already has a different active Context pin",
      );
    }

    const writer = this.deps.createHandoffRpc();
    return invokeBqaAssignmentHandoff(writer, {
      p_organization_id: input.organizationId,
      p_business_activity_id: input.businessActivityId,
      p_actor_user_id: caller.value.userId,
      p_admission_decision_id: input.admissionDecisionId,
      p_rollout_mode: input.rolloutMode,
    });
  }
}

export function createBusinessActivityAdmissionHandoffService(input: {
  env?: Record<string, string | undefined>;
  auth?: BqaAuthLookup;
  queryClient?: BqaQueryClient;
  activities?: BqaActivityLookup;
  taxonomy?: BqaTaxonomyResolver;
  catalog?: BqaContextCatalog;
  pins?: BqaAssignmentObserver;
  createHandoffRpc?: () => BqaHandoffRpcClient;
} = {}): BusinessActivityAdmissionHandoffService {
  const env = input.env ?? process.env;
  const queryClient = input.queryClient ?? createBqaQueryClient(env);
  let orgContextQuery: ReturnType<typeof createOrgContextQueryClient> | undefined;
  const getOrgContextQuery = () => {
    orgContextQuery ??= createOrgContextQueryClient(env);
    return orgContextQuery;
  };
  const activities =
    input.activities ?? createOrgContextActivityLookup(getOrgContextQuery());
  const readers =
    input.taxonomy && input.catalog ? null : createControlPlaneReaders();
  const taxonomy =
    input.taxonomy ?? createBqaTaxonomyResolver(readers!.taxonomy);
  const catalog = input.catalog ?? createBqaContextCatalog(readers!.context);
  const auth =
    input.auth ??
    ({
      async getUser() {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase.auth.getUser();
        return data.user ? { id: data.user.id } : null;
      },
    } satisfies BqaAuthLookup);
  return new BusinessActivityAdmissionHandoffService({
    auth,
    queryClient,
    activities,
    repository: new BusinessQualificationRepository(queryClient),
    taxonomy,
    catalog,
    pins: input.pins ?? createOrgContextAssignmentObserver(getOrgContextQuery()),
    createHandoffRpc:
      input.createHandoffRpc ?? (() => createBqaHandoffRpcClient(env)),
  });
}
