import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { listAttentionItems } from "@/features/attention/server/attention-read-queries";
import { listTasks } from "@/features/tasks/server/task-read-queries";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveTaskPageOrganization } from "@/features/tasks/ui/resolve-task-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import type { Database } from "@/types/database";
import {
  composeDailyOperatingBrief,
  DAILY_OPERATING_ATTENTION_FETCH_LIMIT,
  DAILY_OPERATING_SECTION_LIMIT,
  type DailyOperatingBrief,
} from "@/features/daily-operating/domain/compose-daily-operating-brief";

export type DailyOperatingPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string }
  | {
      kind: "success";
      organizationOptions: OrganizationOption[];
      selectedOrganizationId: string;
      role: OrganizationOption["role"];
      timeZone: string;
      brief: DailyOperatingBrief;
      attentionQueryFailed: boolean;
      tasksQueryFailed: boolean;
    };

export async function loadDailyOperatingPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<DailyOperatingPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveTaskPageOrganization(supabase, orgParam);
  if (orgResult.kind === "auth_required") {
    return { kind: "auth_required" };
  }
  if (orgResult.kind === "organization_unavailable") {
    return { kind: "no_organizations" };
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
    return { kind: "query_error", message: orgResult.message };
  }

  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId: orgResult.organizationId,
  });
  if (!orgContext.ok) {
    return {
      kind: "org_context_missing",
      message: "Unable to resolve organization membership for daily operating view.",
    };
  }

  const membershipId = orgContext.context.membershipId;
  const organizationId = orgResult.organizationId;
  const timeZone = orgResult.timeZone;

  const [attentionResult, overdueResult, dueTodayResult] = await Promise.all([
    listAttentionItems({
      supabase,
      organizationId,
      filters: {
        status: ["open", "acknowledged"],
        includeArchived: false,
      },
      pagination: { page: 1, pageSize: DAILY_OPERATING_ATTENTION_FETCH_LIMIT },
      sort: { field: "severity", direction: "desc" },
    }),
    listTasks({
      supabase,
      organizationId,
      filters: {
        status: "open",
        includeArchived: false,
        assigneeMemberId: membershipId,
        dueState: "overdue",
      },
      pagination: { page: 1, pageSize: DAILY_OPERATING_SECTION_LIMIT },
      sort: { field: "due_at", direction: "asc" },
    }),
    listTasks({
      supabase,
      organizationId,
      filters: {
        status: "open",
        includeArchived: false,
        assigneeMemberId: membershipId,
        dueState: "due_today",
      },
      pagination: { page: 1, pageSize: DAILY_OPERATING_SECTION_LIMIT },
      sort: { field: "due_at", direction: "asc" },
    }),
  ]);

  const attentionQueryFailed = !attentionResult.ok;
  const tasksQueryFailed = !overdueResult.ok || !dueTodayResult.ok;

  if (attentionQueryFailed && tasksQueryFailed) {
    return {
      kind: "query_error",
      message: "Unable to load today’s operating brief. Please try again.",
    };
  }

  const brief = composeDailyOperatingBrief({
    organizationId,
    membershipId,
    role: orgResult.role,
    attentionItems: attentionResult.ok ? attentionResult.data.items : [],
    overdueTasks: overdueResult.ok ? overdueResult.data.items : [],
    dueTodayTasks: dueTodayResult.ok ? dueTodayResult.data.items : [],
  });

  return {
    kind: "success",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: organizationId,
    role: orgResult.role,
    timeZone,
    brief,
    attentionQueryFailed,
    tasksQueryFailed,
  };
}
