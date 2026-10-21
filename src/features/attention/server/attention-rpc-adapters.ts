import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { ResolvedOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import {
  isKnownAttentionRole,
  resolveAttentionPermissions,
} from "@/features/attention/domain/permissions";
import type {
  AttentionPermissionSet,
  AttentionRole,
  AttentionRpcAdapterResult,
} from "@/features/attention/domain/types";
import {
  mapOrganizationContextError,
  normalizeAttentionError,
  permissionDeniedError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/attention/server/normalize-attention-error";
import {
  validateAcknowledgeAttentionItemAdapterInput,
  validateArchiveAttentionItemAdapterInput,
  validateAssignAttentionItemAdapterInput,
  validateCreateManualAttentionItemAdapterInput,
  validateDismissAttentionItemAdapterInput,
  validateEvaluateAttentionRulesAdapterInput,
  validateEvaluateProjectAttentionRulesAdapterInput,
  validateRecordAttentionSignalAdapterInput,
  validateResolveAttentionItemAdapterInput,
  validateUpdateAttentionSeverityAdapterInput,
  type AcknowledgeAttentionItemAdapterInput,
  type ArchiveAttentionItemAdapterInput,
  type AssignAttentionItemAdapterInput,
  type CreateManualAttentionItemAdapterInput,
  type DismissAttentionItemAdapterInput,
  type EvaluateAttentionRulesAdapterInput,
  type EvaluateProjectAttentionRulesAdapterInput,
  type RecordAttentionSignalAdapterInput,
  type ResolveAttentionItemAdapterInput,
  type UpdateAttentionSeverityAdapterInput,
} from "@/features/attention/validation/mutation-schemas";

type AttentionRpcClient = SupabaseClient<Database>;

type AdapterContext = {
  supabase: AttentionRpcClient;
  organizationId: string;
};

export const ATTENTION_RPC_NAMES = {
  createManual: "create_manual_attention_item",
  recordSignal: "record_attention_signal",
  acknowledge: "acknowledge_attention_item",
  assign: "assign_attention_item",
  updateSeverity: "update_attention_severity",
  resolve: "resolve_attention_item",
  dismiss: "dismiss_attention_item",
  archive: "archive_attention_item",
  evaluateRules: "evaluate_attention_rules",
  evaluateProjectRules: "evaluate_project_attention_rules",
} as const;

export type AttentionEvaluateRulesResult = {
  created: number;
  updated: number;
  expired: number;
  evaluatedAt: string;
};

type AttentionRpcAdapterFailure = Extract<
  AttentionRpcAdapterResult<unknown>,
  { ok: false }
>;

async function requireOrganizationContext(
  params: AdapterContext,
): Promise<
  | { ok: true; context: ResolvedOrganizationContext; role: AttentionRole }
  | { ok: false; error: AttentionRpcAdapterFailure }
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

  if (!isKnownAttentionRole(resolved.context.role)) {
    return {
      ok: false,
      error: { ok: false, error: permissionDeniedError() },
    };
  }

  return {
    ok: true,
    context: resolved.context,
    role: resolved.context.role,
  };
}

/**
 * Early fail-closed application permission gate.
 * Archive requires owner/admin at role level; item terminality remains RPC-authoritative.
 */
function ensureMutationPermission(
  role: AttentionRole,
  permission: keyof AttentionPermissionSet,
): boolean {
  if (permission === "canArchive") {
    return role === "owner" || role === "admin";
  }

  const permissions = resolveAttentionPermissions(role);
  return permissions[permission] === true;
}

function optionalRpcString(value: string | null | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function mapEvaluateRulesResult(
  data: unknown,
): AttentionRpcAdapterResult<AttentionEvaluateRulesResult> {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return {
      ok: false,
      error: normalizeAttentionError(
        new Error("evaluate_attention_rules returned malformed result"),
      ),
    };
  }

  const record = data as Record<string, unknown>;
  const created = record.created;
  const updated = record.updated;
  const expired = record.expired;
  const evaluatedAt = record.evaluatedAt;

  if (
    typeof created !== "number" ||
    typeof updated !== "number" ||
    typeof expired !== "number" ||
    typeof evaluatedAt !== "string" ||
    evaluatedAt.trim().length === 0
  ) {
    return {
      ok: false,
      error: normalizeAttentionError(
        new Error("evaluate_attention_rules returned malformed result"),
      ),
    };
  }

  return {
    ok: true,
    data: {
      created,
      updated,
      expired,
      evaluatedAt,
    },
  };
}

export async function createManualAttentionItem(
  params: AdapterContext & { input: CreateManualAttentionItemAdapterInput },
): Promise<AttentionRpcAdapterResult<{ attentionItemId: string }>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canCreateManualItem")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateCreateManualAttentionItemAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;
  const { data, error } = await params.supabase.rpc(ATTENTION_RPC_NAMES.createManual, {
    p_organization_id: org.context.organizationId,
    p_enrollment_id: input.enrollmentId,
    p_title: input.title,
    p_summary: optionalRpcString(input.summary),
    p_severity: input.severity,
    p_explanation: input.explanation,
    p_evidence_note: optionalRpcString(input.evidenceNote),
  });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  if (typeof data !== "string" || data.length === 0) {
    return {
      ok: false,
      error: normalizeAttentionError(
        new Error("create_manual_attention_item returned no attention item id"),
      ),
    };
  }

  return { ok: true, data: { attentionItemId: data } };
}

export async function recordAttentionSignal(
  params: AdapterContext & { input: RecordAttentionSignalAdapterInput },
): Promise<AttentionRpcAdapterResult<{ signalId: string }>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canRecordSignal")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateRecordAttentionSignalAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;
  const evidencePayload: Json | undefined = input.evidence
    ? (input.evidence as Json)
    : undefined;

  const { data, error } = await params.supabase.rpc(ATTENTION_RPC_NAMES.recordSignal, {
    p_organization_id: org.context.organizationId,
    p_attention_item_id: input.attentionItemId,
    p_explanation: input.explanation,
    p_evidence: evidencePayload,
    p_detected_at: optionalRpcString(input.detectedAt),
  });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  if (typeof data !== "string" || data.length === 0) {
    return {
      ok: false,
      error: normalizeAttentionError(
        new Error("record_attention_signal returned no signal id"),
      ),
    };
  }

  return { ok: true, data: { signalId: data } };
}

export async function acknowledgeAttentionItem(
  params: AdapterContext & { input: AcknowledgeAttentionItemAdapterInput },
): Promise<AttentionRpcAdapterResult<{ attentionItemId: string }>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canAcknowledge")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateAcknowledgeAttentionItemAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const { error } = await params.supabase.rpc(ATTENTION_RPC_NAMES.acknowledge, {
    p_organization_id: org.context.organizationId,
    p_attention_item_id: parsed.data.attentionItemId,
  });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  return { ok: true, data: { attentionItemId: parsed.data.attentionItemId } };
}

export async function assignAttentionItem(
  params: AdapterContext & { input: AssignAttentionItemAdapterInput },
): Promise<AttentionRpcAdapterResult<{ attentionItemId: string }>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canAssign")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateAssignAttentionItemAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const { error } = await params.supabase.rpc(ATTENTION_RPC_NAMES.assign, {
    p_organization_id: org.context.organizationId,
    p_attention_item_id: parsed.data.attentionItemId,
    p_assignee_member_id: parsed.data.assigneeMemberId ?? undefined,
  });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  return { ok: true, data: { attentionItemId: parsed.data.attentionItemId } };
}

export async function updateAttentionSeverity(
  params: AdapterContext & { input: UpdateAttentionSeverityAdapterInput },
): Promise<AttentionRpcAdapterResult<{ attentionItemId: string }>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canUpdateSeverity")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateUpdateAttentionSeverityAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const { error } = await params.supabase.rpc(ATTENTION_RPC_NAMES.updateSeverity, {
    p_organization_id: org.context.organizationId,
    p_attention_item_id: parsed.data.attentionItemId,
    p_severity: parsed.data.severity,
  });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  return { ok: true, data: { attentionItemId: parsed.data.attentionItemId } };
}

export async function resolveAttentionItem(
  params: AdapterContext & { input: ResolveAttentionItemAdapterInput },
): Promise<AttentionRpcAdapterResult<{ attentionItemId: string }>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canResolve")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateResolveAttentionItemAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const { error } = await params.supabase.rpc(ATTENTION_RPC_NAMES.resolve, {
    p_organization_id: org.context.organizationId,
    p_attention_item_id: parsed.data.attentionItemId,
    p_resolution_reason: parsed.data.resolutionReason,
  });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  return { ok: true, data: { attentionItemId: parsed.data.attentionItemId } };
}

export async function dismissAttentionItem(
  params: AdapterContext & { input: DismissAttentionItemAdapterInput },
): Promise<AttentionRpcAdapterResult<{ attentionItemId: string }>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canDismiss")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateDismissAttentionItemAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const { error } = await params.supabase.rpc(ATTENTION_RPC_NAMES.dismiss, {
    p_organization_id: org.context.organizationId,
    p_attention_item_id: parsed.data.attentionItemId,
    p_dismissal_reason: parsed.data.dismissalReason,
  });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  return { ok: true, data: { attentionItemId: parsed.data.attentionItemId } };
}

export async function archiveAttentionItem(
  params: AdapterContext & { input: ArchiveAttentionItemAdapterInput },
): Promise<AttentionRpcAdapterResult<{ attentionItemId: string }>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canArchive")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateArchiveAttentionItemAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const { error } = await params.supabase.rpc(ATTENTION_RPC_NAMES.archive, {
    p_organization_id: org.context.organizationId,
    p_attention_item_id: parsed.data.attentionItemId,
  });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  return { ok: true, data: { attentionItemId: parsed.data.attentionItemId } };
}

export async function evaluateAttentionRules(
  params: AdapterContext & { input: EvaluateAttentionRulesAdapterInput },
): Promise<AttentionRpcAdapterResult<AttentionEvaluateRulesResult>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canEvaluateRules")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateEvaluateAttentionRulesAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const { data, error } = await params.supabase.rpc(ATTENTION_RPC_NAMES.evaluateRules, {
    p_organization_id: org.context.organizationId,
    p_enrollment_id: parsed.data.enrollmentId ?? undefined,
  });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  return mapEvaluateRulesResult(data);
}

export async function evaluateProjectAttentionRules(
  params: AdapterContext & { input: EvaluateProjectAttentionRulesAdapterInput },
): Promise<AttentionRpcAdapterResult<AttentionEvaluateRulesResult>> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  if (!ensureMutationPermission(org.role, "canEvaluateRules")) {
    return { ok: false, error: permissionDeniedError() };
  }

  const parsed = validateEvaluateProjectAttentionRulesAdapterInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const { data, error } = await params.supabase.rpc(
    ATTENTION_RPC_NAMES.evaluateProjectRules,
    {
      p_organization_id: org.context.organizationId,
      p_project_id: parsed.data.projectId ?? undefined,
    },
  );

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  return mapEvaluateRulesResult(data);
}

/** Exported for tests — adapters must never call table writes. */
export function attentionAdaptersAllowDirectTableWrites(): false {
  return false;
}
