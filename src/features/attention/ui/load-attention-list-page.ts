import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttentionItemListItemReadModel,
  AttentionListReadResult,
} from "@/features/attention/domain/read-types";
import { DEFAULT_ATTENTION_PAGE_SIZE } from "@/features/attention/domain/read-types";
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
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import type { Database } from "@/types/database";

/** Fixed B1.7.5-B list query — not a product filter/sort UI contract (C). */
export const ATTENTION_LIST_WORKSPACE_SORT = {
  field: "last_detected_at" as const,
  direction: "desc" as const,
};

export const ATTENTION_LIST_WORKSPACE_PAGE = 1;
export const ATTENTION_LIST_WORKSPACE_PAGE_SIZE = DEFAULT_ATTENTION_PAGE_SIZE;

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
  sort: typeof ATTENTION_LIST_WORKSPACE_SORT;
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
    return item.primaryRuleKey;
  }
  if (item.primarySignalOrigin && isAttentionSignalOrigin(item.primarySignalOrigin)) {
    return item.primarySignalOrigin === "manual" ? "Manual signal" : "Rule signal";
  }
  return item.sourceType === "enrollment" ? "Enrollment" : "Attention";
}

export function mapAttentionListWorkspaceRows(
  items: AttentionItemListItemReadModel[],
  options: { organizationId: string; timeZone: string },
): AttentionListWorkspaceRow[] {
  return items.map((item) => {
    const base = toAttentionListItemPresentation(item, {
      organizationId: options.organizationId,
      timeZone: options.timeZone,
    });
    const summary = item.summary?.trim();
    return {
      ...base,
      summaryLabel: summary && summary.length > 0 ? summary : null,
      attentionTypeLabel: resolveAttentionTypeLabel(item),
      createdAtLabel: formatAttentionDate(item.createdAt, options.timeZone),
      severityKey: item.severity,
      statusKey: item.status,
    };
  });
}

/**
 * B1.7.5-B list loader: org context + fixed authorized listAttentionItems query.
 * No product filter/sort/pagination URL parsing (B1.7.5-C).
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

  const listResult = await listAttentionItems({
    supabase,
    organizationId: orgResult.organizationId,
    filters: {},
    pagination: {
      page: ATTENTION_LIST_WORKSPACE_PAGE,
      pageSize: ATTENTION_LIST_WORKSPACE_PAGE_SIZE,
    },
    sort: ATTENTION_LIST_WORKSPACE_SORT,
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
    sort: ATTENTION_LIST_WORKSPACE_SORT,
  };
}
