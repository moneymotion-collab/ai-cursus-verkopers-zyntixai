import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ResolvedOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type { ProgressRpcAdapterResult } from "@/features/progress/domain/types";
import {
  mapOrganizationContextError,
  normalizeProgressError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/progress/server/normalize-progress-error";
import {
  validateRecordProgressFactInput,
  validateVoidProgressFactInput,
  type RecordProgressFactInput,
  type VoidProgressFactInput,
} from "@/features/progress/validation/mutation-schemas";

type ProgressRpcClient = SupabaseClient<Database>;

type AdapterContext = {
  supabase: ProgressRpcClient;
  organizationId: string;
};

export const PROGRESS_RPC_NAMES = {
  record: "record_progress_fact",
  void: "void_progress_fact",
} as const;

/** Generic payload UPDATE is forbidden — only record/void/correct via RPCs. */
export const PROGRESS_UNSUPPORTED_RPC_NAMES = {
  update: "update_progress_fact",
} as const;

async function requireOrganizationContext(
  params: AdapterContext,
): Promise<
  | { ok: true; context: ResolvedOrganizationContext }
  | { ok: false; error: ProgressRpcAdapterResult }
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

function optionalRpcString(value: string | null | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function callRecordProgressFactRpc(
  params: AdapterContext & { input: RecordProgressFactInput },
): Promise<ProgressRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateRecordProgressFactInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { data, error } = await params.supabase.rpc(PROGRESS_RPC_NAMES.record, {
    p_organization_id: org.context.organizationId,
    p_enrollment_id: input.enrollmentId,
    p_fact_type: input.factType,
    p_occurred_at: input.occurredAt,
    p_title: optionalRpcString(input.title),
    p_description: optionalRpcString(input.description),
    p_numeric_value: input.numericValue ?? undefined,
    p_numeric_unit: optionalRpcString(input.numericUnit),
    p_is_complete: input.isComplete ?? undefined,
    p_sequence_number: input.sequenceNumber ?? undefined,
    p_idempotency_key: optionalRpcString(input.idempotencyKey),
    p_corrected_from_fact_id: input.correctedFromFactId ?? undefined,
  });

  if (error) {
    return { ok: false, error: normalizeProgressError(error) };
  }

  if (!data) {
    return {
      ok: false,
      error: normalizeProgressError(
        new Error("record_progress_fact returned no progress fact id"),
      ),
    };
  }

  return { ok: true, progressFactId: data };
}

export async function callVoidProgressFactRpc(
  params: AdapterContext & { input: VoidProgressFactInput },
): Promise<ProgressRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateVoidProgressFactInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(PROGRESS_RPC_NAMES.void, {
    p_organization_id: org.context.organizationId,
    p_progress_fact_id: input.progressFactId,
    p_reason: input.reason.trim(),
  });

  if (error) {
    return { ok: false, error: normalizeProgressError(error) };
  }

  return { ok: true, progressFactId: input.progressFactId };
}
