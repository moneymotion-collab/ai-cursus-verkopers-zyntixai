import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { ResolvedOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type { LeadRpcAdapterResult } from "@/features/leads/domain/types";
import {
  mapOrganizationContextError,
  normalizeLeadError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/leads/server/normalize-lead-error";
import {
  validateArchiveLeadInput,
  validateConvertLeadInput,
  validateCreateLeadInput,
  validateRestoreLeadInput,
  validateTransitionLeadStageInput,
  validateTransitionLeadStatusInput,
  type ArchiveLeadInput,
  type ConvertLeadInput,
  type CreateLeadInput,
  type RestoreLeadInput,
  type TransitionLeadStageInput,
  type TransitionLeadStatusInput,
} from "@/features/leads/validation/mutation-schemas";

type LeadRpcClient = SupabaseClient<Database>;

type AdapterContext = {
  supabase: LeadRpcClient;
  organizationId: string;
};

export const LEAD_RPC_NAMES = {
  create: "create_lead",
  transitionStage: "transition_lead_stage",
  transitionStatus: "transition_lead_status",
  convert: "convert_lead_to_customer",
  archive: "archive_lead",
  restore: "restore_lead",
} as const;

async function requireOrganizationContext(
  params: AdapterContext,
): Promise<
  | { ok: true; context: ResolvedOrganizationContext }
  | { ok: false; error: LeadRpcAdapterResult }
> {
  const resolved = await resolveOrganizationContext({
    supabase: params.supabase,
    organizationId: params.organizationId,
  });

  if (!resolved.ok) {
    return {
      ok: false,
      error: { ok: false, error: mapOrganizationContextError(resolved.error) },
    };
  }

  return { ok: true, context: resolved.context };
}

function optionalString(value: string | null | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function metadataObject(value: Record<string, unknown> | undefined): Json {
  if (!value) {
    return {};
  }

  return value as Json;
}

export async function callCreateLeadRpc(
  params: AdapterContext & { input: CreateLeadInput },
): Promise<LeadRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateCreateLeadInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { data, error } = await params.supabase.rpc(LEAD_RPC_NAMES.create, {
    p_organization_id: org.context.organizationId,
    p_display_name: input.displayName,
    p_first_name: optionalString(input.firstName ?? undefined),
    p_last_name: optionalString(input.lastName ?? undefined),
    p_email: optionalString(input.email ?? undefined),
    p_phone: optionalString(input.phone ?? undefined),
    p_owner_member_id: input.ownerMemberId ?? undefined,
    p_source_type: input.sourceType,
    p_source_detail: optionalString(input.sourceDetail ?? undefined),
    p_pursuit_label: optionalString(input.pursuitLabel ?? undefined),
    p_metadata: metadataObject(input.metadata),
  });

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  if (!data) {
    return {
      ok: false,
      error: normalizeLeadError(new Error("create_lead returned no lead id")),
    };
  }

  return { ok: true, leadId: data };
}

export async function callTransitionLeadStageRpc(
  params: AdapterContext & { input: TransitionLeadStageInput },
): Promise<LeadRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTransitionLeadStageInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(LEAD_RPC_NAMES.transitionStage, {
    p_organization_id: org.context.organizationId,
    p_lead_id: input.leadId,
    p_to_stage_id: input.toStageId,
    p_reason: optionalString(input.reason ?? undefined),
  });

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  return { ok: true, leadId: input.leadId };
}

export async function callTransitionLeadStatusRpc(
  params: AdapterContext & { input: TransitionLeadStatusInput },
): Promise<LeadRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTransitionLeadStatusInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(LEAD_RPC_NAMES.transitionStatus, {
    p_organization_id: org.context.organizationId,
    p_lead_id: input.leadId,
    p_to_status: input.toStatus,
    p_reason: optionalString(input.reason ?? undefined),
  });

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  return { ok: true, leadId: input.leadId };
}

export async function callConvertLeadToCustomerRpc(
  params: AdapterContext & { input: ConvertLeadInput },
): Promise<LeadRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateConvertLeadInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { data, error } = await params.supabase.rpc(LEAD_RPC_NAMES.convert, {
    p_organization_id: org.context.organizationId,
    p_lead_id: input.leadId,
    p_existing_customer_id: input.existingCustomerId ?? undefined,
    p_reason: optionalString(input.reason ?? undefined),
  });

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  if (!data) {
    return {
      ok: false,
      error: normalizeLeadError(new Error("convert_lead_to_customer returned no customer id")),
    };
  }

  return { ok: true, leadId: input.leadId, customerId: data };
}

export async function callArchiveLeadRpc(
  params: AdapterContext & { input: ArchiveLeadInput },
): Promise<LeadRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateArchiveLeadInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(LEAD_RPC_NAMES.archive, {
    p_organization_id: org.context.organizationId,
    p_lead_id: input.leadId,
  });

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  return { ok: true, leadId: input.leadId };
}

export async function callRestoreLeadRpc(
  params: AdapterContext & { input: RestoreLeadInput },
): Promise<LeadRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateRestoreLeadInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(LEAD_RPC_NAMES.restore, {
    p_organization_id: org.context.organizationId,
    p_lead_id: input.leadId,
  });

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  return { ok: true, leadId: input.leadId };
}
