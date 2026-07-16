import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import { resolveLeadPermissions, isKnownLeadRole } from "@/features/leads/domain/permissions";
import type {
  LeadApplicationError,
  LeadMutationCommittedRefreshFailure,
  LeadMutationFailure,
  LeadMutationOperation,
  LeadMutationResult,
  LeadMutationSuccess,
  LeadRefreshHints,
  LeadRole,
} from "@/features/leads/domain/types";
import { LEAD_MUTATION_REFRESH_HINTS } from "@/features/leads/domain/types";
import { getLeadById } from "@/features/leads/server/lead-read-queries";
import {
  archivedRecordError,
  insufficientRoleError,
  invalidOwnerError,
  leadUnavailableError,
  mutationCommittedRefreshRequiredError,
  normalizeLeadError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/leads/server/normalize-lead-error";
import {
  callArchiveLeadRpc,
  callConvertLeadToCustomerRpc,
  callCreateLeadRpc,
  callRestoreLeadRpc,
  callTransitionLeadStageRpc,
  callTransitionLeadStatusRpc,
} from "@/features/leads/server/lead-rpc-adapters";
import {
  validateArchiveLeadInput,
  validateConvertLeadInput,
  validateCreateLeadInput,
  validateRestoreLeadInput,
  validateTransitionLeadStageInput,
  validateTransitionLeadStatusInput,
  validateUpdateLeadProfileInput,
  type ArchiveLeadInput,
  type ConvertLeadInput,
  type CreateLeadInput,
  type RestoreLeadInput,
  type TransitionLeadStageInput,
  type TransitionLeadStatusInput,
  type UpdateLeadProfileInput,
} from "@/features/leads/validation/mutation-schemas";

type MutationContext = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: LeadRole;
};

function validationFailure(
  operation: LeadMutationOperation,
  error: import("zod").ZodError,
): LeadMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
  };
}

function requiresRefreshOnFailure(error: LeadApplicationError): boolean {
  return error.code === "INVALID_STATE";
}

function adapterFailure(
  operation: LeadMutationOperation,
  error: LeadApplicationError,
): LeadMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: requiresRefreshOnFailure(error) ? { ...error, refreshRequired: true } : error,
  };
}

function committedRefreshFailure(
  operation: LeadMutationOperation,
  leadId: string,
  refreshHints: LeadRefreshHints,
  customerId?: string,
): LeadMutationCommittedRefreshFailure {
  const base = mutationCommittedRefreshRequiredError();
  return {
    ok: false,
    operation,
    committed: true,
    leadId,
    customerId,
    refreshHints,
    error: {
      ...base,
      refreshRequired: true,
      retryable: false,
    },
  };
}

function successResult(
  operation: LeadMutationOperation,
  leadId: string,
  lead: LeadDetailReadModel,
  refreshHints: LeadRefreshHints,
  customerId?: string,
): LeadMutationSuccess {
  return {
    ok: true,
    operation,
    leadId,
    lead,
    customerId,
    committed: true,
    refreshRequired: false,
    refreshHints,
  };
}

async function refetchLead(
  context: MutationContext,
  leadId: string,
): Promise<LeadDetailReadModel | null> {
  const result = await getLeadById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    leadId,
  });

  if (!result.ok) {
    return null;
  }

  return result.data;
}

async function afterSuccessfulMutation(
  context: MutationContext,
  operation: LeadMutationOperation,
  leadId: string,
  refreshHints: LeadRefreshHints,
  customerId?: string,
): Promise<LeadMutationResult> {
  const lead = await refetchLead(context, leadId);

  if (!lead) {
    return committedRefreshFailure(operation, leadId, refreshHints, customerId);
  }

  return successResult(operation, leadId, lead, refreshHints, customerId);
}

async function validateOwnerMemberId(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  ownerMemberId: string,
): Promise<LeadApplicationError | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", ownerMemberId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return normalizeLeadError(error);
  }

  if (!data) {
    return invalidOwnerError();
  }

  return null;
}

function buildProfileUpdatePayload(input: UpdateLeadProfileInput) {
  return {
    display_name: input.displayName,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone,
    owner_member_id: input.ownerMemberId,
    source_type: input.sourceType,
    source_detail: input.sourceDetail,
    pursuit_label: input.pursuitLabel,
    metadata: (input.metadata ?? {}) as Json,
  };
}

function assertRole(
  role: LeadRole,
  check: (permissions: ReturnType<typeof resolveLeadPermissions>) => boolean,
  context?: { isArchived?: boolean; status?: LeadDetailReadModel["status"] },
): LeadApplicationError | null {
  const permissions = resolveLeadPermissions(role, context);
  return check(permissions) ? null : insufficientRoleError();
}

function assertOwnerOrAdminRole(role: LeadRole): LeadApplicationError | null {
  return role === "owner" || role === "admin" ? null : insufficientRoleError();
}

export async function createLeadMutation(
  context: MutationContext & { input: unknown },
): Promise<LeadMutationResult> {
  const operation: LeadMutationOperation = "create";
  const parsed = validateCreateLeadInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const roleCheck = assertRole(context.role, (permissions) => permissions.canCreateLead);
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  if (parsed.data.ownerMemberId != null) {
    const ownerError = await validateOwnerMemberId(
      context.supabase,
      context.organizationId,
      parsed.data.ownerMemberId,
    );
    if (ownerError) {
      return adapterFailure(operation, ownerError);
    }
  }

  const rpcResult = await callCreateLeadRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.leadId) {
    return adapterFailure(
      operation,
      normalizeLeadError(new Error("create_lead returned no lead id")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.leadId,
    LEAD_MUTATION_REFRESH_HINTS.create,
  );
}

export async function updateLeadProfileMutation(
  context: MutationContext & { input: unknown },
): Promise<LeadMutationResult> {
  const operation: LeadMutationOperation = "update_profile";
  const parsed = validateUpdateLeadProfileInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const roleCheck = assertRole(context.role, (permissions) => permissions.canEditLeadProfile);
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const input = parsed.data;

  const existing = await getLeadById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    leadId: input.leadId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  if (existing.data.archivedAt != null) {
    return adapterFailure(operation, archivedRecordError());
  }

  if (input.ownerMemberId != null) {
    const ownerError = await validateOwnerMemberId(
      context.supabase,
      context.organizationId,
      input.ownerMemberId,
    );
    if (ownerError) {
      return adapterFailure(operation, ownerError);
    }
  }

  const updatePayload = buildProfileUpdatePayload(input);

  const { data, error } = await context.supabase
    .from("leads")
    .update(updatePayload)
    .eq("organization_id", context.organizationId)
    .eq("id", input.leadId)
    .select("id");

  if (error) {
    return adapterFailure(operation, normalizeLeadError(error));
  }

  if (!data || data.length !== 1) {
    return adapterFailure(operation, leadUnavailableError());
  }

  return afterSuccessfulMutation(
    context,
    operation,
    input.leadId,
    LEAD_MUTATION_REFRESH_HINTS.update_profile,
  );
}

export async function transitionLeadStageMutation(
  context: MutationContext & { input: unknown },
): Promise<LeadMutationResult> {
  const operation: LeadMutationOperation = "transition_stage";
  const parsed = validateTransitionLeadStageInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getLeadById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    leadId: parsed.data.leadId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const roleCheck = assertRole(
    context.role,
    (permissions) => permissions.canTransitionLeadStage,
    {
      isArchived: existing.data.archivedAt != null,
      status: existing.data.status,
    },
  );
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const rpcResult = await callTransitionLeadStageRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.leadId) {
    return adapterFailure(
      operation,
      normalizeLeadError(new Error("transition_lead_stage returned no lead id")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.leadId,
    LEAD_MUTATION_REFRESH_HINTS.transition_stage,
  );
}

export async function transitionLeadStatusMutation(
  context: MutationContext & { input: unknown },
): Promise<LeadMutationResult> {
  const operation: LeadMutationOperation = "transition_status";
  const parsed = validateTransitionLeadStatusInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getLeadById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    leadId: parsed.data.leadId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const roleCheck = assertRole(
    context.role,
    (permissions) => permissions.canTransitionLeadStatus,
    {
      isArchived: existing.data.archivedAt != null,
      status: existing.data.status,
    },
  );
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const rpcResult = await callTransitionLeadStatusRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.leadId) {
    return adapterFailure(
      operation,
      normalizeLeadError(new Error("transition_lead_status returned no lead id")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.leadId,
    LEAD_MUTATION_REFRESH_HINTS.transition_status,
  );
}

export async function convertLeadToCustomerMutation(
  context: MutationContext & { input: unknown },
): Promise<LeadMutationResult> {
  const operation: LeadMutationOperation = "convert";
  const parsed = validateConvertLeadInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getLeadById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    leadId: parsed.data.leadId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const roleCheck = assertRole(context.role, (permissions) => permissions.canConvertLead, {
    isArchived: existing.data.archivedAt != null,
    status: existing.data.status,
  });
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const rpcResult = await callConvertLeadToCustomerRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.leadId || !rpcResult.customerId) {
    return adapterFailure(
      operation,
      normalizeLeadError(new Error("convert_lead_to_customer returned incomplete identifiers")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.leadId,
    LEAD_MUTATION_REFRESH_HINTS.convert,
    rpcResult.customerId,
  );
}

export async function archiveLeadMutation(
  context: MutationContext & { input: unknown },
): Promise<LeadMutationResult> {
  const operation: LeadMutationOperation = "archive";
  const parsed = validateArchiveLeadInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const roleCheck = assertOwnerOrAdminRole(context.role);
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const rpcResult = await callArchiveLeadRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.leadId) {
    return adapterFailure(
      operation,
      normalizeLeadError(new Error("archive_lead returned no lead id")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.leadId,
    LEAD_MUTATION_REFRESH_HINTS.archive,
  );
}

export async function restoreLeadMutation(
  context: MutationContext & { input: unknown },
): Promise<LeadMutationResult> {
  const operation: LeadMutationOperation = "restore";
  const parsed = validateRestoreLeadInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const roleCheck = assertOwnerOrAdminRole(context.role);
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const rpcResult = await callRestoreLeadRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.leadId) {
    return adapterFailure(
      operation,
      normalizeLeadError(new Error("restore_lead returned no lead id")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.leadId,
    LEAD_MUTATION_REFRESH_HINTS.restore,
  );
}

export function resolveVerifiedLeadRole(role: string): LeadRole | null {
  return isKnownLeadRole(role) ? role : null;
}

export type {
  CreateLeadInput,
  UpdateLeadProfileInput,
  TransitionLeadStageInput,
  TransitionLeadStatusInput,
  ConvertLeadInput,
  ArchiveLeadInput,
  RestoreLeadInput,
};
