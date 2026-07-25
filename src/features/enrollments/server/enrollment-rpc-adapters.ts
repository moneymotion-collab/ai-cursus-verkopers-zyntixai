import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { ResolvedOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type { EnrollmentRpcAdapterResult } from "@/features/enrollments/domain/types";
import {
  mapOrganizationContextError,
  normalizeEnrollmentError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/enrollments/server/normalize-enrollment-error";
import {
  validateArchiveEnrollmentInput,
  validateCreateEnrollmentInput,
  validateRestoreEnrollmentInput,
  validateTransitionEnrollmentStatusInput,
  validateUpdateEnrollmentOwnerMetadataInput,
  type ArchiveEnrollmentInput,
  type CreateEnrollmentInput,
  type RestoreEnrollmentInput,
  type TransitionEnrollmentStatusInput,
  type UpdateEnrollmentOwnerMetadataInput,
} from "@/features/enrollments/validation/mutation-schemas";

type EnrollmentRpcClient = SupabaseClient<Database>;

type AdapterContext = {
  supabase: EnrollmentRpcClient;
  organizationId: string;
};

export const ENROLLMENT_RPC_NAMES = {
  create: "create_enrollment",
  transitionStatus: "transition_enrollment_status",
  archive: "archive_enrollment",
  restore: "restore_enrollment",
} as const;

/** No update_enrollment RPC exists — owner/metadata use column GRANT + RLS. */
export const ENROLLMENT_UNSUPPORTED_RPC_NAMES = {
  update: "update_enrollment",
} as const;

async function requireOrganizationContext(
  params: AdapterContext,
): Promise<
  | { ok: true; context: ResolvedOrganizationContext }
  | { ok: false; error: EnrollmentRpcAdapterResult }
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

export async function callCreateEnrollmentRpc(
  params: AdapterContext & { input: CreateEnrollmentInput },
): Promise<EnrollmentRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateCreateEnrollmentInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { data, error } = await params.supabase.rpc(ENROLLMENT_RPC_NAMES.create, {
    p_organization_id: org.context.organizationId,
    p_customer_id: input.customerId,
    p_program_id: input.programId,
    p_owner_member_id: input.ownerMemberId ?? undefined,
    p_initial_status: input.initialStatus,
    p_source: "manual",
    p_metadata: (input.metadata ?? {}) as Json,
  });

  if (error) {
    return { ok: false, error: normalizeEnrollmentError(error) };
  }

  if (!data) {
    return {
      ok: false,
      error: normalizeEnrollmentError(
        new Error("create_enrollment returned no enrollment id"),
      ),
    };
  }

  return { ok: true, enrollmentId: data };
}

export async function callTransitionEnrollmentStatusRpc(
  params: AdapterContext & { input: TransitionEnrollmentStatusInput },
): Promise<EnrollmentRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTransitionEnrollmentStatusInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(ENROLLMENT_RPC_NAMES.transitionStatus, {
    p_organization_id: org.context.organizationId,
    p_enrollment_id: input.enrollmentId,
    p_to_status: input.toStatus,
    p_reason: optionalString(input.reason ?? undefined),
    p_source: "manual",
  });

  if (error) {
    return { ok: false, error: normalizeEnrollmentError(error) };
  }

  return { ok: true, enrollmentId: input.enrollmentId };
}

export async function callArchiveEnrollmentRpc(
  params: AdapterContext & { input: ArchiveEnrollmentInput },
): Promise<EnrollmentRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateArchiveEnrollmentInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(ENROLLMENT_RPC_NAMES.archive, {
    p_organization_id: org.context.organizationId,
    p_enrollment_id: input.enrollmentId,
  });

  if (error) {
    return { ok: false, error: normalizeEnrollmentError(error) };
  }

  return { ok: true, enrollmentId: input.enrollmentId };
}

export async function callRestoreEnrollmentRpc(
  params: AdapterContext & { input: RestoreEnrollmentInput },
): Promise<EnrollmentRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateRestoreEnrollmentInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(ENROLLMENT_RPC_NAMES.restore, {
    p_organization_id: org.context.organizationId,
    p_enrollment_id: input.enrollmentId,
  });

  if (error) {
    return { ok: false, error: normalizeEnrollmentError(error) };
  }

  return { ok: true, enrollmentId: input.enrollmentId };
}

/**
 * Limited authenticated UPDATE of owner_member_id and/or metadata only.
 * Uses column GRANT + enrollments_update_staff RLS — not an unrestricted update RPC.
 */
export async function callUpdateEnrollmentOwnerMetadata(
  params: AdapterContext & { input: UpdateEnrollmentOwnerMetadataInput },
): Promise<EnrollmentRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateUpdateEnrollmentOwnerMetadataInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;
  const patch: {
    owner_member_id?: string | null;
    metadata?: Json;
  } = {};

  if ("ownerMemberId" in input && input.ownerMemberId !== undefined) {
    patch.owner_member_id = input.ownerMemberId;
  }

  if (input.metadata !== undefined) {
    patch.metadata = input.metadata as Json;
  }

  const { data, error } = await params.supabase
    .from("enrollments")
    .update(patch)
    .eq("organization_id", org.context.organizationId)
    .eq("id", input.enrollmentId)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return { ok: false, error: normalizeEnrollmentError(error) };
  }

  if (!data) {
    return {
      ok: false,
      error: normalizeEnrollmentError(new Error("enrollment not found")),
    };
  }

  return { ok: true, enrollmentId: input.enrollmentId };
}
