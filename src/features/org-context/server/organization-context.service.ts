import "server-only";

import { createControlPlaneReaders } from "@/features/control-plane/server/control-plane-client";
import type { ControlPlaneQueryClient } from "@/features/control-plane/server/control-plane-query";
import {
  orgContextFail,
  orgContextOk,
  type OrgContextResult,
} from "@/features/org-context/domain/errors";
import type {
  ActivityWithContextAssignment,
  BusinessActivity,
  OrgContextAssignmentMode,
  OrgContextMutationSuccess,
  OrgContextPlatformOperator,
  OrganizationContextAssignment,
  OrganizationContextEvent,
  PinnedContextVersionSummary,
  TaxonomyClassificationKind,
  TaxonomyClassificationRef,
} from "@/features/org-context/domain/types";
import {
  allocateActivityKey,
  assertClassifiedForActive,
  assertInternalQaReadiness,
  isExactTaxContextCompatible,
  normalizeDisplayName,
  ORG_CONTEXT_ASSIGNMENT_MODE_INTERNAL_QA,
  slugifyActivityKey,
} from "@/features/org-context/domain/validation";
import { OrgContextCatalogReader } from "@/features/org-context/server/catalog-reader";
import { createOrgContextQueryClient } from "@/features/org-context/server/org-context-client";
import type { OrgContextQueryClient } from "@/features/org-context/server/org-context-query";
import { OrganizationContextRepository } from "@/features/org-context/server/organization-context.repository";
import {
  invokeOrgContextPlatformMutation,
  type OrgContextMutationRpcClient,
} from "@/features/org-context/server/organization-context-rpc";

export type OrganizationContextServiceDeps = {
  operator: OrgContextPlatformOperator;
  repository: OrganizationContextRepository;
  catalog: OrgContextCatalogReader;
  mutate: OrgContextMutationRpcClient;
};

function requireOperator(
  operator: OrgContextPlatformOperator | null | undefined,
): OrgContextResult<OrgContextPlatformOperator> {
  if (!operator?.actorUserId) {
    return orgContextFail(
      "UNAUTHORIZED",
      "Platform operator identity is required before ORG-CONTEXT mutation",
    );
  }
  return orgContextOk(operator);
}

function classificationColumns(classification: TaxonomyClassificationRef | null) {
  return {
    classification_kind: classification?.kind ?? null,
    foundation_id: classification?.kind === "foundation" ? classification.targetId : null,
    industry_id: classification?.kind === "industry" ? classification.targetId : null,
    niche_id: classification?.kind === "niche" ? classification.targetId : null,
    specialization_id:
      classification?.kind === "specialization" ? classification.targetId : null,
    deep_specialization_id:
      classification?.kind === "deep_specialization" ? classification.targetId : null,
  };
}

export class OrganizationContextService {
  constructor(private readonly deps: OrganizationContextServiceDeps) {}

  listBusinessActivities(organizationId: string) {
    return this.deps.repository.listBusinessActivities(organizationId);
  }

  getPrimaryBusinessActivity(organizationId: string) {
    return this.deps.repository.getPrimaryBusinessActivity(organizationId);
  }

  getBusinessActivity(organizationId: string, activityId: string) {
    return this.deps.repository.getBusinessActivity(organizationId, activityId);
  }

  getActivityClassification(organizationId: string, activityId: string) {
    return this.deps.repository.getActivityClassification(organizationId, activityId);
  }

  getPinnedContextVersion(organizationId: string, activityId: string) {
    return this.deps.repository.getPinnedContextVersion(organizationId, activityId);
  }

  getAssignmentHistory(organizationId: string, activityId: string) {
    return this.deps.repository.getAssignmentHistory(organizationId, activityId);
  }

  listActivityEvents(organizationId: string, activityId: string) {
    return this.deps.repository.listActivityEvents(organizationId, activityId);
  }

  getActivityWithActiveAssignment(
    organizationId: string,
    activityId: string,
  ): Promise<OrgContextResult<ActivityWithContextAssignment>> {
    return this.deps.repository.getActivityWithActiveAssignment(
      organizationId,
      activityId,
    );
  }

  async createBusinessActivity(input: {
    organizationId: string;
    displayName: string;
    activityKey?: string;
    status?: "draft" | "active";
    isPrimary?: boolean;
    classification?: TaxonomyClassificationRef;
    reason?: string;
  }): Promise<OrgContextResult<OrgContextMutationSuccess>> {
    const operator = requireOperator(this.deps.operator);
    if (!operator.ok) {
      return operator;
    }
    const org = await this.requireActiveOrganization(input.organizationId);
    if (!org.ok) {
      return org;
    }
    const displayName = normalizeDisplayName(input.displayName);
    if (!displayName.ok) {
      return displayName;
    }
    const status = input.status ?? "draft";
    const isPrimary = input.isPrimary === true;
    const classification = input.classification ?? null;
    const classified = assertClassifiedForActive({
      status,
      classification,
      isPrimary,
    });
    if (!classified.ok) {
      return classified;
    }
    if (classification) {
      const node = await this.requireActiveClassification(classification);
      if (!node.ok) {
        return node;
      }
    }
    const existing = await this.deps.repository.listBusinessActivities(input.organizationId);
    if (!existing.ok) {
      return existing;
    }
    const existingKeys = new Set(existing.value.map((activity) => activity.activityKey));
    const preferred = input.activityKey ?? slugifyActivityKey(displayName.value);
    const activityKey = allocateActivityKey(
      preferred,
      input.activityKey ? new Set() : existingKeys,
    );
    if (!activityKey.ok) {
      return activityKey;
    }
    if (input.activityKey && existingKeys.has(activityKey.value)) {
      return orgContextFail(
        "MUTATION_FAILED",
        "activity_key is already used in this Organization",
        { activityKey: activityKey.value },
      );
    }
    return this.mutate("create_activity", input.organizationId, operator.value, {
      display_name: displayName.value,
      activity_key: activityKey.value,
      status,
      is_primary: isPrimary,
      reason: input.reason ?? null,
      ...classificationColumns(classification),
    });
  }

  async classifyBusinessActivity(input: {
    organizationId: string;
    activityId: string;
    classification: TaxonomyClassificationRef;
    reason?: string;
  }): Promise<OrgContextResult<OrgContextMutationSuccess>> {
    const operator = requireOperator(this.deps.operator);
    if (!operator.ok) {
      return operator;
    }
    const org = await this.requireActiveOrganization(input.organizationId);
    if (!org.ok) {
      return org;
    }
    const activity = await this.deps.repository.getBusinessActivity(
      input.organizationId,
      input.activityId,
    );
    if (!activity.ok) {
      return activity;
    }
    const node = await this.requireActiveClassification(input.classification);
    if (!node.ok) {
      return node;
    }
    return this.mutate("classify_activity", input.organizationId, operator.value, {
      activity_id: input.activityId,
      classification_kind: input.classification.kind,
      target_id: input.classification.targetId,
      reason: input.reason ?? null,
    });
  }

  async setPrimaryBusinessActivity(input: {
    organizationId: string;
    activityId: string;
    reason?: string;
  }): Promise<OrgContextResult<OrgContextMutationSuccess>> {
    const operator = requireOperator(this.deps.operator);
    if (!operator.ok) {
      return operator;
    }
    const org = await this.requireActiveOrganization(input.organizationId);
    if (!org.ok) {
      return org;
    }
    const activity = await this.deps.repository.getBusinessActivity(
      input.organizationId,
      input.activityId,
    );
    if (!activity.ok) {
      return activity;
    }
    if (activity.value.status !== "active") {
      return orgContextFail(
        "PRIMARY_ACTIVITY_CONFLICT",
        "Primary Business Activity must be active",
        { status: activity.value.status },
      );
    }
    return this.mutate("set_primary", input.organizationId, operator.value, {
      activity_id: input.activityId,
      reason: input.reason ?? null,
    });
  }

  async assignContextVersion(input: {
    organizationId: string;
    activityId: string;
    contextPackVersionId: string;
    mode?: OrgContextAssignmentMode;
    reason?: string;
  }): Promise<OrgContextResult<OrgContextMutationSuccess>> {
    return this.pinContextVersion("assign_context_version", input);
  }

  async changePinnedContextVersion(input: {
    organizationId: string;
    activityId: string;
    contextPackVersionId: string;
    mode?: OrgContextAssignmentMode;
    reason?: string;
  }): Promise<OrgContextResult<OrgContextMutationSuccess>> {
    return this.pinContextVersion("change_context_version", input);
  }

  async archiveBusinessActivity(input: {
    organizationId: string;
    activityId: string;
    reason?: string;
  }): Promise<OrgContextResult<OrgContextMutationSuccess>> {
    const operator = requireOperator(this.deps.operator);
    if (!operator.ok) {
      return operator;
    }
    const org = await this.requireActiveOrganization(input.organizationId);
    if (!org.ok) {
      return org;
    }
    const activity = await this.deps.repository.getBusinessActivity(
      input.organizationId,
      input.activityId,
    );
    if (!activity.ok) {
      return activity;
    }
    return this.mutate("archive_activity", input.organizationId, operator.value, {
      activity_id: input.activityId,
      reason: input.reason ?? null,
    });
  }

  private async pinContextVersion(
    operation: "assign_context_version" | "change_context_version",
    input: {
      organizationId: string;
      activityId: string;
      contextPackVersionId: string;
      mode?: OrgContextAssignmentMode;
      reason?: string;
    },
  ): Promise<OrgContextResult<OrgContextMutationSuccess>> {
    const operator = requireOperator(this.deps.operator);
    if (!operator.ok) {
      return operator;
    }
    const org = await this.requireActiveOrganization(input.organizationId);
    if (!org.ok) {
      return org;
    }
    const activity = await this.deps.repository.getBusinessActivity(
      input.organizationId,
      input.activityId,
    );
    if (!activity.ok) {
      return activity;
    }
    if (!activity.value.classification) {
      return orgContextFail(
        "CONTEXT_VERSION_NOT_ASSIGNABLE",
        "Unclassified Business Activity cannot receive a Context pin",
      );
    }
    const pin = await this.deps.catalog.getAssignableContextVersion(
      input.contextPackVersionId,
    );
    if (!pin.ok) {
      return pin;
    }
    if (pin.value.publicationStatus !== "published") {
      return orgContextFail(
        "CONTEXT_VERSION_NOT_ASSIGNABLE",
        "New Context pin requires a published version",
        { publicationStatus: pin.value.publicationStatus },
      );
    }
    if (
      !isExactTaxContextCompatible({
        classification: activity.value.classification,
        packKind: pin.value.packKind,
        packTargetId: pin.value.targetId,
      })
    ) {
      return orgContextFail(
        "CONTEXT_INCOMPATIBLE",
        "Context pack TAX target does not exactly match activity classification",
        {
          classificationKind: activity.value.classification.kind,
          packKind: pin.value.packKind,
        },
      );
    }
    const readiness = assertInternalQaReadiness(
      input.mode ?? ORG_CONTEXT_ASSIGNMENT_MODE_INTERNAL_QA,
      pin.value.readinessStatus,
    );
    if (!readiness.ok) {
      return readiness;
    }
    return this.mutate(operation, input.organizationId, operator.value, {
      activity_id: input.activityId,
      context_pack_version_id: input.contextPackVersionId,
      reason: input.reason ?? null,
    });
  }

  private async requireActiveOrganization(
    organizationId: string,
  ): Promise<OrgContextResult<true>> {
    const org = await this.deps.repository.getOrganizationStatus(organizationId);
    if (!org.ok) {
      return org;
    }
    if (org.value.status !== "active") {
      return orgContextFail("ORG_NOT_FOUND", "Organization is not active", {
        organizationId,
        status: org.value.status,
      });
    }
    return orgContextOk(true);
  }

  private async requireActiveClassification(
    classification: TaxonomyClassificationRef,
  ): Promise<OrgContextResult<true>> {
    const node = await this.deps.catalog.getTaxonomyNode(
      classification.kind as TaxonomyClassificationKind,
      classification.targetId,
    );
    if (!node.ok) {
      return node;
    }
    if (node.value.lifecycleStatus !== "active") {
      return orgContextFail(
        "CLASSIFICATION_NOT_FOUND",
        "TAX classification target is not active",
        { kind: classification.kind, targetId: classification.targetId },
      );
    }
    return orgContextOk(true);
  }

  private mutate(
    operation: Parameters<typeof invokeOrgContextPlatformMutation>[1]["p_operation"],
    organizationId: string,
    operator: OrgContextPlatformOperator,
    payload: Record<string, unknown>,
  ) {
    return invokeOrgContextPlatformMutation(this.deps.mutate, {
      p_operation: operation,
      p_organization_id: organizationId,
      p_actor_user_id: operator.actorUserId,
      p_payload: payload,
    });
  }
}

export function createOrganizationContextService(input: {
  operator: OrgContextPlatformOperator;
  env?: Record<string, string | undefined>;
  queryClient?: OrgContextQueryClient;
  controlPlaneClient?: ControlPlaneQueryClient;
  mutate: OrgContextMutationRpcClient;
}): OrganizationContextService {
  const query = input.queryClient ?? createOrgContextQueryClient(input.env);
  const readers = createControlPlaneReaders(input.controlPlaneClient);
  return new OrganizationContextService({
    operator: input.operator,
    repository: new OrganizationContextRepository(query),
    catalog: new OrgContextCatalogReader(readers.taxonomy, readers.context),
    mutate: input.mutate,
  });
}

export type {
  BusinessActivity,
  OrganizationContextAssignment,
  OrganizationContextEvent,
  PinnedContextVersionSummary,
};
