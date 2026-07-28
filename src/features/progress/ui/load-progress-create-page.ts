import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgressRole } from "@/features/progress/domain/types";
import { buildProgressListHref } from "@/features/progress/domain/progress-navigation";
import {
  loadProgressEnrollmentOptions,
  type ProgressEnrollmentOption,
} from "@/features/progress/server/load-progress-enrollment-options";
import { resolveProgressPageOrganization } from "@/features/progress/server/resolve-progress-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import { canShowRecordProgressWorkflow } from "@/features/progress/ui/progress-workflow-visibility";
import type { Database } from "@/types/database";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type WorkflowOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string };

export type ProgressCreatePageResult =
  | WorkflowOrgFailure
  | { kind: "action_unavailable"; backHref: string }
  | {
      kind: "ready";
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: ProgressRole;
      enrollmentOptions: ProgressEnrollmentOption[];
      enrollmentOptionsError?: string;
      enrollmentOptionsCapped: boolean;
      initialEnrollmentId?: string;
      backHref: string;
    };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export async function loadProgressCreatePage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgressCreatePageResult> {
  const orgParam = firstValue(rawSearchParams.org);
  const orgResult = await resolveProgressPageOrganization(supabase, orgParam);

  if (orgResult.kind !== "ready") {
    return orgResult;
  }

  const backHref = buildProgressListHref(orgResult.organizationId);

  if (!canShowRecordProgressWorkflow(orgResult.role)) {
    return { kind: "action_unavailable", backHref };
  }

  const enrollmentOptionsResult = await loadProgressEnrollmentOptions(
    supabase,
    orgResult.organizationId,
  );

  const enrollmentIdRaw = firstValue(rawSearchParams.enrollmentId);
  const initialEnrollmentId =
    enrollmentIdRaw &&
    UUID_PATTERN.test(enrollmentIdRaw) &&
    enrollmentOptionsResult.options.some((option) => option.value === enrollmentIdRaw)
      ? enrollmentIdRaw
      : undefined;

  return {
    kind: "ready",
    organizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    enrollmentOptions: enrollmentOptionsResult.options,
    enrollmentOptionsError: enrollmentOptionsResult.error,
    enrollmentOptionsCapped: enrollmentOptionsResult.capped,
    initialEnrollmentId,
    backHref,
  };
}
