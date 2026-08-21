import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttentionItemListItemReadModel,
  AttentionListReadResult,
} from "@/features/attention/domain/read-types";
import type {
  AttentionApplicationError,
  AttentionPermissionSet,
  AttentionRole,
} from "@/features/attention/domain/types";
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import {
  isAttentionRuleKey,
  isAttentionSignalOrigin,
} from "@/features/attention/domain/signal";
import { listAttentionItems } from "@/features/attention/server/attention-read-queries";
import { resolveAttentionPageOrganization } from "@/features/attention/server/resolve-attention-page-organization";
import {
  formatAttentionDate,
  toAttentionListItemPresentation,
  toAttentionSafeErrorPresentation,
  type AttentionListItemPresentation,
} from "@/features/attention/ui/attention-presentation";
import {
  attentionListFilterWarningMessage,
  ATTENTION_LIST_DEFAULT_SORT_DIRECTION,
  ATTENTION_LIST_DEFAULT_SORT_FIELD,
  buildAttentionListQueryString,
  parseAttentionListSearchParams,
  type AttentionListUrlState,
} from "@/features/attention/ui/attention-list-search-params";
import { buildAttentionDetailHref } from "@/features/attention/domain/attention-navigation";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import type { Database } from "@/types/database";

/** @deprecated Prefer ATTENTION_LIST_DEFAULT_SORT_* from search-params (B1.7.5-C). */
export const ATTENTION_LIST_WORKSPACE_SORT = {
  field: ATTENTION_LIST_DEFAULT_SORT_FIELD,
  direction: ATTENTION_LIST_DEFAULT_SORT_DIRECTION,
};

export type AttentionListWorkspaceRow = AttentionListItemPresentation & {
  summaryLabel: string | null;
  attentionTypeLabel: string;
  createdAtLabel: string;
  severityKey: AttentionItemListItemReadModel["severity"];
  statusKey: AttentionItemListItemReadModel["status"];
};

export type AttentionListPageSuccess = {
  kind: "success";
  organizationOptions: OrganizationOption[];
  selectedOrganizationId: string;
  organizationName: string;
  role: AttentionRole;
  capabilities: AttentionPermissionSet;
  timeZone: string;
  isMultiOrganization: boolean;
  list: AttentionListReadResult;
  rows: AttentionListWorkspaceRow[];
  urlState: AttentionListUrlState;
  sort: { field: AttentionListUrlState["sort"]; direction: AttentionListUrlState["direction"] };
  filterWarning: string | null;
};

export type AttentionListPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | {
      kind: "query_error";
      message: string;
      title?: string;
      retryable?: boolean;
      error?: AttentionApplicationError;
    }
  | AttentionListPageSuccess;

function resolveAttentionTypeLabel(
  item: AttentionItemListItemReadModel,
): string {
  if (item.primaryRuleKey && isAttentionRuleKey(item.primaryRuleKey)) {
    if (item.primaryRuleKey === "enrollment_no_recent_progress") {
      return "No recent progress";
    }
    if (item.primaryRuleKey === "scheduled_publication_missed") {
      return "Missed scheduled publication";
    }
    if (item.primaryRuleKey === "publication_result_unknown") {
      return "Unknown publish result";
    }
    if (item.primaryRuleKey === "social_account_reauthorization_required") {
      return "Account reconnection required";
    }
    if (item.primaryRuleKey === "provider_permission_missing") {
      return "Publish permission missing";
    }
    if (item.primaryRuleKey === "scheduled_publication_failed") {
      return "Scheduled publication failed";
    }
    return item.primaryRuleKey;
  }
  if (item.primarySignalOrigin && isAttentionSignalOrigin(item.primarySignalOrigin)) {
    return item.primarySignalOrigin === "manual" ? "Manual signal" : "Rule signal";
  }
  return item.sourceType === "enrollment" ? "Enrollment" : "Attention";
}

export function mapAttentionListWorkspaceRows(
  items: AttentionItemListItemReadModel[],
  options: {
    organizationId: string;
    timeZone: string;
    urlState: AttentionListUrlState;
  },
): AttentionListWorkspaceRow[] {
  return items.map((item) => {
    const base = toAttentionListItemPresentation(item, {
      timeZone: options.timeZone,
    });
    const summary = item.summary?.trim();
    return {
      ...base,
      detailHref: `${buildAttentionDetailHref(item.id)}${buildAttentionListQueryString(options.urlState)}`,
      summaryLabel: summary && summary.length > 0 ? summary : null,
      attentionTypeLabel: resolveAttentionTypeLabel(item),
      createdAtLabel: formatAttentionDate(item.createdAt, options.timeZone),
      severityKey: item.severity,
      statusKey: item.status,
    };
  });
}

/**
 * B1.7.5-C list loader: org context + validated URL state → listAttentionItems.
 */
export async function loadAttentionListPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined> = {},
): Promise<AttentionListPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveAttentionPageOrganization(supabase, orgParam);

  if (orgResult.kind === "auth_required") {
    return { kind: "auth_required" };
  }

  if (orgResult.kind === "organization_unavailable") {
    return { kind: "no_organizations" };
  }

  if (orgResult.kind === "organization_required") {
    return { kind: "organization_required", organizations: orgResult.organizations };
  }

  if (orgResult.kind === "org_context_missing") {
    return { kind: "org_context_missing", message: orgResult.message };
  }

  if (orgResult.kind === "query_error") {
    return { kind: "query_error", message: orgResult.message, retryable: true };
  }

  const capabilities = resolveAttentionPermissions(orgResult.role);
  const parsed = parseAttentionListSearchParams(rawSearchParams, {
    role: orgResult.role,
  });
  const urlState: AttentionListUrlState = {
    ...parsed.urlState,
    org: orgResult.organizationId,
  };

  const listResult = await listAttentionItems({
    supabase,
    organizationId: orgResult.organizationId,
    filters: parsed.listInput.filters,
    pagination: parsed.listInput.pagination,
    sort: parsed.listInput.sort,
  });

  if (!listResult.ok) {
    const safe = toAttentionSafeErrorPresentation(listResult.error);
    return {
      kind: "query_error",
      title: safe.title,
      message: safe.message,
      retryable: safe.retryable,
      error: listResult.error,
    };
  }

  const rows = mapAttentionListWorkspaceRows(listResult.data.items, {
    organizationId: orgResult.organizationId,
    timeZone: orgResult.timezone,
    urlState,
  });

  return {
    kind: "success",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: orgResult.organizationId,
    organizationName: orgResult.organizationName,
    role: orgResult.role,
    capabilities,
    timeZone: orgResult.timezone,
    isMultiOrganization: orgResult.isMultiOrganization,
    list: listResult.data,
    rows,
    urlState,
    sort: {
      field: urlState.sort,
      direction: urlState.direction,
    },
    filterWarning: attentionListFilterWarningMessage(parsed.warnings),
  };
}
