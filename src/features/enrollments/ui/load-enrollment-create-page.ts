import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnrollmentRole } from "@/features/enrollments/domain/types";
import { resolveEnrollmentPageOrganization } from "@/features/enrollments/server/resolve-enrollment-page-organization";
import {
  loadEnrollmentCreateOptions,
  type EnrollmentCustomerOption,
  type EnrollmentMemberOption,
  type EnrollmentProgramOption,
} from "@/features/enrollments/server/load-enrollment-create-options";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  parseEnrollmentListReturnState,
  type EnrollmentListUrlState,
} from "@/features/enrollments/ui/enrollment-list-search-params";
import { canShowCreateEnrollmentWorkflow } from "@/features/enrollments/ui/enrollment-workflow-visibility";
import type { Database } from "@/types/database";

type WorkflowOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string };

export type EnrollmentCreatePageResult =
  | WorkflowOrgFailure
  | { kind: "action_unavailable"; listState: EnrollmentListUrlState }
  | {
      kind: "ready";
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: EnrollmentRole;
      timeZone: string;
      listState: EnrollmentListUrlState;
      customers: EnrollmentCustomerOption[];
      programs: EnrollmentProgramOption[];
      members: EnrollmentMemberOption[];
      optionsError?: string;
      optionsCapped: {
        customers: boolean;
        programs: boolean;
        members: boolean;
      };
      initialCustomerId?: string;
      initialProgramId?: string;
      contextNotice?: string;
      duplicateOpenNotice?: string;
    };

const CONTEXT_UNAVAILABLE_NOTICE =
  "The selected customer or program is unavailable for enrollment.";
const DUPLICATE_OPEN_ENROLLMENT_NOTICE =
  "An open enrollment already exists for this customer and program.";
const OPEN_ENROLLMENT_STATUSES = ["pending", "active", "paused"] as const;

export async function loadEnrollmentCreatePage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<EnrollmentCreatePageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveEnrollmentPageOrganization(supabase, orgParam);

  if (orgResult.kind !== "ready") {
    return orgResult;
  }

  const listState: EnrollmentListUrlState = {
    ...parseEnrollmentListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };

  if (!canShowCreateEnrollmentWorkflow(orgResult.role)) {
    return { kind: "action_unavailable", listState };
  }

  const options = await loadEnrollmentCreateOptions(supabase, orgResult.organizationId);

  let initialCustomerId: string | undefined;
  let initialProgramId: string | undefined;
  let contextNotice: string | undefined;

  if (listState.customerId) {
    if (options.customers.some((customer) => customer.value === listState.customerId)) {
      initialCustomerId = listState.customerId;
    } else {
      contextNotice = CONTEXT_UNAVAILABLE_NOTICE;
    }
  }

  if (listState.programId) {
    if (options.programs.some((program) => program.value === listState.programId)) {
      initialProgramId = listState.programId;
    } else {
      contextNotice = CONTEXT_UNAVAILABLE_NOTICE;
    }
  }

  let duplicateOpenNotice: string | undefined;
  if (initialCustomerId && initialProgramId) {
    const { data } = await supabase
      .from("enrollments")
      .select("id")
      .eq("organization_id", orgResult.organizationId)
      .eq("customer_id", initialCustomerId)
      .eq("program_id", initialProgramId)
      .is("archived_at", null)
      .in("status", OPEN_ENROLLMENT_STATUSES)
      .limit(1);

    if (data && data.length > 0) {
      duplicateOpenNotice = DUPLICATE_OPEN_ENROLLMENT_NOTICE;
    }
  }

  return {
    kind: "ready",
    organizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    timeZone: orgResult.timezone,
    listState,
    customers: options.customers,
    programs: options.programs,
    members: options.members,
    optionsError: options.error,
    optionsCapped: options.capped,
    initialCustomerId,
    initialProgramId,
    contextNotice,
    duplicateOpenNotice,
  };
}
