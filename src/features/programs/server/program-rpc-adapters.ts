import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { ResolvedOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type { ProgramRpcAdapterResult } from "@/features/programs/domain/types";
import {
  mapOrganizationContextError,
  normalizeProgramError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/programs/server/normalize-program-error";
import {
  validateArchiveProgramInput,
  validateCreateProgramInput,
  validateRestoreProgramInput,
  validateTransitionProgramStatusInput,
  validateUpdateProgramInput,
  type ArchiveProgramInput,
  type CreateProgramInput,
  type RestoreProgramInput,
  type TransitionProgramStatusInput,
  type UpdateProgramInput,
} from "@/features/programs/validation/mutation-schemas";

type ProgramRpcClient = SupabaseClient<Database>;

type AdapterContext = {
  supabase: ProgramRpcClient;
  organizationId: string;
};

export const PROGRAM_RPC_NAMES = {
  create: "create_program",
  update: "update_program",
  transitionStatus: "transition_program_status",
  archive: "archive_program",
  restore: "restore_program",
} as const;

async function requireOrganizationContext(
  params: AdapterContext,
): Promise<
  | { ok: true; context: ResolvedOrganizationContext }
  | { ok: false; error: ProgramRpcAdapterResult }
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

export async function callCreateProgramRpc(
  params: AdapterContext & { input: CreateProgramInput },
): Promise<ProgramRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateCreateProgramInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { data, error } = await params.supabase.rpc(PROGRAM_RPC_NAMES.create, {
    p_organization_id: org.context.organizationId,
    p_name: input.name,
    p_delivery_mode: input.deliveryMode,
    p_description: optionalString(input.description ?? undefined),
    p_metadata: {} as Json,
  });

  if (error) {
    return { ok: false, error: normalizeProgramError(error) };
  }

  if (!data) {
    return {
      ok: false,
      error: normalizeProgramError(new Error("create_program returned no program id")),
    };
  }

  return { ok: true, programId: data };
}

export async function callUpdateProgramRpc(
  params: AdapterContext & { input: UpdateProgramInput },
): Promise<ProgramRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateUpdateProgramInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(PROGRAM_RPC_NAMES.update, {
    p_organization_id: org.context.organizationId,
    p_program_id: input.programId,
    p_name: input.name,
    p_description: input.description ?? "",
    p_delivery_mode: input.deliveryMode,
    p_metadata: {} as Json,
  });

  if (error) {
    return { ok: false, error: normalizeProgramError(error) };
  }

  return { ok: true, programId: input.programId };
}

export async function callTransitionProgramStatusRpc(
  params: AdapterContext & { input: TransitionProgramStatusInput },
): Promise<ProgramRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTransitionProgramStatusInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(PROGRAM_RPC_NAMES.transitionStatus, {
    p_organization_id: org.context.organizationId,
    p_program_id: input.programId,
    p_to_status: input.toStatus,
    p_reason: optionalString(input.reason ?? undefined),
    p_source: "manual",
  });

  if (error) {
    return { ok: false, error: normalizeProgramError(error) };
  }

  return { ok: true, programId: input.programId };
}

export async function callArchiveProgramRpc(
  params: AdapterContext & { input: ArchiveProgramInput },
): Promise<ProgramRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateArchiveProgramInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(PROGRAM_RPC_NAMES.archive, {
    p_organization_id: org.context.organizationId,
    p_program_id: input.programId,
  });

  if (error) {
    return { ok: false, error: normalizeProgramError(error) };
  }

  return { ok: true, programId: input.programId };
}

export async function callRestoreProgramRpc(
  params: AdapterContext & { input: RestoreProgramInput },
): Promise<ProgramRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateRestoreProgramInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(PROGRAM_RPC_NAMES.restore, {
    p_organization_id: org.context.organizationId,
    p_program_id: input.programId,
  });

  if (error) {
    return { ok: false, error: normalizeProgramError(error) };
  }

  return { ok: true, programId: input.programId };
}
