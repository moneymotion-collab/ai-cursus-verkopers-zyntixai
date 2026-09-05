import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttentionApplicationError,
  AttentionPermissionSet,
  AttentionRole,
} from "@/features/attention/domain/types";
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import { getAttentionItemById } from "@/features/attention/server/attention-read-queries";
import {
  ensureCurrentAttentionAssigneeOption,
  loadAttentionAssigneeOptions,
  type AttentionAssigneeOption,
} from "@/features/attention/server/load-attention-assignee-options";
import { resolveAttentionPageOrganization } from "@/features/attention/server/resolve-attention-page-organization";
import {
  resolveMemberLabel,
  resolveMemberLabels,
} from "@/features/enrollments/server/resolve-enrollment-labels";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import type { AttentionItemDetailReadModel } from "@/features/attention/domain/read-types";
import { buildAuthorizedNbaContext } from "@/features/nba/application/build-authorized-nba-context";
import { evaluateNextBestAction } from "@/features/nba/domain/evaluate-next-best-action";
import type { NextBestAction } from "@/features/nba/domain/types";
import {
  buildAttentionListHref,
  parseAttentionListReturnState,
  type AttentionListUrlState,
} from "@/features/attention/ui/attention-list-search-params";
import { buildSocialWorkspaceHref } from "@/features/social-media/domain/social-navigation";
import {
  toAttentionDetailPresentation,
  toAttentionSafeErrorPresentation,
  toAttentionSignalPresentation,
  toAttentionTimelineEventPresentation,
  type AttentionDetailPresentation,
  type AttentionSignalPresentation,
  type AttentionTimelineEventPresentation,
} from "@/features/attention/ui/attention-presentation";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

const ATTENTION_ITEM_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AttentionDetailViewModel = {
  detail: AttentionDetailPresentation;
  signals: AttentionSignalPresentation[];
  timeline: AttentionTimelineEventPresentation[];
  timelineEmpty: boolean;
  customerHref: string | null;
  programHref: string | null;
  enrollmentHref: string | null;
  projectHref: string | null;
  taskHref: string | null;
  workOrderHref?: string | null;
  productHref?: string | null;
  orderHref?: string | null;
  socialHref?: string | null;
  backHref: string;
  organizationTimezone: string;
  assigneeMemberId: string | null;
  assigneeOptions: AttentionAssigneeOption[];
  assigneeOptionsFailed: boolean;
  /**
   * Derived NBA recommendation from authorized Attention detail assembly.
   * Always set by loadAttentionDetailPage on success (`NextBestAction` or `null`).
   */
  nextBestAction: NextBestAction | null;
};

export type AttentionDetailPageResult =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | {
      kind: "query_error";
      message: string;
      title?: string;
      retryable?: boolean;
      error?: AttentionApplicationError;
    }
  | { kind: "attention_unavailable"; backHref: string }
  | {
      kind: "success";
      organizationOptions: OrganizationOption[];
      selectedOrganizationId: string;
      role: AttentionRole;
      capabilities: AttentionPermissionSet;
      data: AttentionDetailViewModel;
      moduleAccess: ProductModuleAccessState;
    };

function normalizeRouteParam(
  attentionItemId: string | string[] | undefined,
): string | null {
  if (Array.isArray(attentionItemId)) {
    return attentionItemId[0] ?? null;
  }
  if (typeof attentionItemId !== "string") {
    return null;
  }
  const trimmed = attentionItemId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildBackHref(listState: AttentionListUrlState): string {
  return buildAttentionListHref(listState);
}

function collectMemberIds(item: AttentionItemDetailReadModel): string[] {
  const ids = new Set<string>();
  if (item.assigneeMemberId) {
    ids.add(item.assigneeMemberId);
  }
  for (const event of item.events) {
    if (event.actorMemberId) {
      ids.add(event.actorMemberId);
    }
    if (event.fromAssigneeMemberId) {
      ids.add(event.fromAssigneeMemberId);
    }
    if (event.toAssigneeMemberId) {
      ids.add(event.toAssigneeMemberId);
    }
  }
  return [...ids];
}

/**
 * B1.7.5-D detail loader: org context + UUID gate → getAttentionItemById.
 * Events and signals come from the detail read model (no second event query).
 */
export async function loadAttentionDetailPage(
  supabase: SupabaseClient<Database>,
  attentionItemIdParam: string | string[] | undefined,
  rawSearchParams: Record<string, string | string[] | undefined> = {},
): Promise<AttentionDetailPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveAttentionPageOrganization(supabase, orgParam);

  if (orgResult.kind === "auth_required") {
    return { kind: "auth_required" };
  }

  if (orgResult.kind === "organization_unavailable") {
    return { kind: "organization_unavailable" };
  }

  if (orgResult.kind === "organization_required") {
    return {
      kind: "organization_required",
      organizations: orgResult.organizations,
    };
  }

  if (orgResult.kind === "org_context_missing") {
    return { kind: "org_context_missing", message: orgResult.message };
  }

  if (orgResult.kind === "query_error") {
    return { kind: "query_error", message: orgResult.message, retryable: true };
  }

  const listState: AttentionListUrlState = {
    ...parseAttentionListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };
  const backHref = buildBackHref(listState);

  const attentionItemId = normalizeRouteParam(attentionItemIdParam);
  if (!attentionItemId || !ATTENTION_ITEM_ID_PATTERN.test(attentionItemId)) {
    return { kind: "attention_unavailable", backHref };
  }

  const detailResult = await getAttentionItemById({
    supabase,
    organizationId: orgResult.organizationId,
    attentionItemId,
  });

  if (!detailResult.ok) {
    const code = detailResult.error.code;
    if (
      code === "ATTENTION_ITEM_UNAVAILABLE" ||
      code === "PERMISSION_DENIED" ||
      code === "INSUFFICIENT_ROLE"
    ) {
      return { kind: "attention_unavailable", backHref };
    }
    const safe = toAttentionSafeErrorPresentation(detailResult.error);
    return {
      kind: "query_error",
      title: safe.title,
      message: safe.message,
      retryable: safe.retryable,
      error: detailResult.error,
    };
  }

  const item = detailResult.data;
  const capabilities = resolveAttentionPermissions(orgResult.role);
  const memberLabels = await resolveMemberLabels(
    supabase,
    orgResult.organizationId,
    collectMemberIds(item),
  );

  const assigneeDisplayName = item.assigneeMemberId
    ? resolveMemberLabel(item.assigneeMemberId, memberLabels)
    : null;

  const detail = toAttentionDetailPresentation(item, {
    timeZone: orgResult.timezone,
    assigneeDisplayName,
  });

  const timeline = item.events.map((event) =>
    toAttentionTimelineEventPresentation(event, {
      timeZone: orgResult.timezone,
      actorLabel: event.actorMemberId
        ? resolveMemberLabel(event.actorMemberId, memberLabels)
        : null,
      fromAssigneeLabel: event.fromAssigneeMemberId
        ? resolveMemberLabel(event.fromAssigneeMemberId, memberLabels)
        : null,
      toAssigneeLabel: event.toAssigneeMemberId
        ? resolveMemberLabel(event.toAssigneeMemberId, memberLabels)
        : null,
    }),
  );

  const signals = item.signals.map((signal) =>
    toAttentionSignalPresentation(signal, { timeZone: orgResult.timezone }),
  );

  const itemPermissions = resolveAttentionPermissions(orgResult.role, {
    status: item.status,
    isArchived: item.derived.isArchived,
  });

  let assigneeOptions: AttentionAssigneeOption[] = [];
  let assigneeOptionsFailed = false;
  if (itemPermissions.canAssign) {
    const loaded = await loadAttentionAssigneeOptions(
      supabase,
      orgResult.organizationId,
    );
    assigneeOptionsFailed = loaded.failed;
    assigneeOptions = ensureCurrentAttentionAssigneeOption(
      loaded.members,
      item.assigneeMemberId,
      assigneeDisplayName,
    );
  }

  let nextBestAction: NextBestAction | null = null;
  try {
    nextBestAction = evaluateNextBestAction(buildAuthorizedNbaContext(item));
  } catch {
    nextBestAction = null;
  }

  return {
    kind: "success",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: orgResult.organizationId,
    role: orgResult.role,
    capabilities,
    moduleAccess: orgResult.moduleAccess,
    data: {
      detail,
      signals,
      timeline,
      timelineEmpty: timeline.length === 0,
      customerHref: item.customer
        ? `/customers/${item.customer.id}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      programHref: item.program
        ? `/programs/${item.program.id}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      enrollmentHref: item.enrollment
        ? `/enrollments/${item.enrollment.id}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      projectHref: item.project
        ? `/projects/${item.project.id}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      taskHref: item.task
        ? `/tasks/${item.task.id}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      workOrderHref: item.workOrder
        ? `/work-orders/${item.workOrder.id}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      productHref: item.productId
        ? `/products/${item.productId}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      orderHref: item.orderId
        ? `/orders/${item.orderId}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      socialHref:
        item.sourceType === "social_connection"
          ? buildSocialWorkspaceHref({
              organizationId: orgResult.organizationId,
              section: "accounts",
            })
          : item.sourceType === "social_publication"
            ? buildSocialWorkspaceHref({
                organizationId: orgResult.organizationId,
                section: "activity",
                publicationId: item.sourceEntityId,
              })
            : null,
      backHref,
      organizationTimezone: orgResult.timezone,
      assigneeMemberId: item.assigneeMemberId,
      assigneeOptions,
      assigneeOptionsFailed,
      nextBestAction,
    },
  };
}
