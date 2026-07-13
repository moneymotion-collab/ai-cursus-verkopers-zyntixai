import type { SupabaseClient } from "@supabase/supabase-js";
import type { Json } from "@/types/database";
import type { Database } from "@/types/database";
import type { ResolvedOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type {
  TaskArchiveInput,
  TaskCancelInput,
  TaskCompleteInput,
  TaskCreateInput,
  TaskMutationResult,
  TaskReassignInput,
  TaskRescheduleInput,
  TaskRestoreInput,
  TaskUpdateInput,
} from "@/features/tasks/domain/types";
import {
  normalizeTaskError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/tasks/server/normalize-task-error";
import {
  validateTaskArchiveInput,
  validateTaskCancelInput,
  validateTaskCompleteInput,
  validateTaskCreateInput,
  validateTaskReassignInput,
  validateTaskRescheduleInput,
  validateTaskRestoreInput,
  validateTaskUpdateInput,
} from "@/features/tasks/validation/schemas";

type TaskRpcClient = SupabaseClient<Database>;

type AdapterContext = {
  supabase: TaskRpcClient;
  organizationId: string;
};

async function requireOrganizationContext(
  params: AdapterContext,
): Promise<
  | { ok: true; context: ResolvedOrganizationContext }
  | { ok: false; error: TaskMutationResult }
> {
  const resolved = await resolveOrganizationContext({
    supabase: params.supabase,
    organizationId: params.organizationId,
  });

  if (!resolved.ok) {
    return { ok: false, error: { ok: false, error: resolved.error } };
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

function metadataObject(value: Json | undefined): Json {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  return {};
}

export async function createTaskRpc(
  params: AdapterContext & { input: TaskCreateInput },
): Promise<TaskMutationResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTaskCreateInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { data, error } = await params.supabase.rpc("create_task", {
    p_organization_id: org.context.organizationId,
    p_title: input.title,
    p_due_at: input.dueAt,
    p_description: optionalString(input.description),
    p_task_type: input.taskType,
    p_priority: input.priority,
    p_source: input.source,
    p_assignee_member_id: input.assigneeMemberId ?? undefined,
    p_lead_id: input.leadId ?? undefined,
    p_customer_id: input.customerId ?? undefined,
    p_enrollment_id: input.enrollmentId ?? undefined,
    p_program_id: input.programId ?? undefined,
    p_predecessor_task_id: input.predecessorTaskId ?? undefined,
    p_idempotency_key: input.idempotencyKey ?? undefined,
    p_metadata: metadataObject(input.metadata as Json | undefined),
  });

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  if (!data) {
    return {
      ok: false,
      error: normalizeTaskError(new Error("create_task returned no task id")),
    };
  }

  return { ok: true, taskId: data };
}

export async function updateTaskRpc(
  params: AdapterContext & { input: TaskUpdateInput },
): Promise<TaskMutationResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTaskUpdateInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc("update_task", {
    p_organization_id: org.context.organizationId,
    p_task_id: input.taskId,
    p_title: input.title,
    p_description: optionalString(input.description),
    p_task_type: input.taskType,
    p_priority: input.priority,
    p_metadata: metadataObject(input.metadata as Json | undefined),
  });

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  return { ok: true, taskId: input.taskId };
}

export async function reassignTaskRpc(
  params: AdapterContext & { input: TaskReassignInput },
): Promise<TaskMutationResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTaskReassignInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc("reassign_task", {
    p_organization_id: org.context.organizationId,
    p_task_id: input.taskId,
    p_assignee_member_id: input.assigneeMemberId ?? undefined,
  });

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  return { ok: true, taskId: input.taskId };
}

export async function rescheduleTaskRpc(
  params: AdapterContext & { input: TaskRescheduleInput },
): Promise<TaskMutationResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTaskRescheduleInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc("reschedule_task", {
    p_organization_id: org.context.organizationId,
    p_task_id: input.taskId,
    p_due_at: input.dueAt,
  });

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  return { ok: true, taskId: input.taskId };
}

export async function completeTaskRpc(
  params: AdapterContext & { input: TaskCompleteInput },
): Promise<TaskMutationResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTaskCompleteInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc("complete_task", {
    p_organization_id: org.context.organizationId,
    p_task_id: input.taskId,
    p_completion_note: optionalString(input.completionNote),
  });

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  return { ok: true, taskId: input.taskId };
}

export async function cancelTaskRpc(
  params: AdapterContext & { input: TaskCancelInput },
): Promise<TaskMutationResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTaskCancelInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc("cancel_task", {
    p_organization_id: org.context.organizationId,
    p_task_id: input.taskId,
    p_cancel_reason: input.cancelReason.trim(),
  });

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  return { ok: true, taskId: input.taskId };
}

export async function archiveTaskRpc(
  params: AdapterContext & { input: TaskArchiveInput },
): Promise<TaskMutationResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTaskArchiveInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc("archive_task", {
    p_organization_id: org.context.organizationId,
    p_task_id: input.taskId,
  });

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  return { ok: true, taskId: input.taskId };
}

export async function restoreTaskRpc(
  params: AdapterContext & { input: TaskRestoreInput },
): Promise<TaskMutationResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTaskRestoreInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc("restore_task", {
    p_organization_id: org.context.organizationId,
    p_task_id: input.taskId,
  });

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  return { ok: true, taskId: input.taskId };
}

export const TASK_RPC_NAMES = [
  "create_task",
  "update_task",
  "reassign_task",
  "reschedule_task",
  "complete_task",
  "cancel_task",
  "archive_task",
  "restore_task",
] as const;

export type TaskRpcName = (typeof TASK_RPC_NAMES)[number];

export const taskRpcAdapters = {
  create_task: createTaskRpc,
  update_task: updateTaskRpc,
  reassign_task: reassignTaskRpc,
  reschedule_task: rescheduleTaskRpc,
  complete_task: completeTaskRpc,
  cancel_task: cancelTaskRpc,
  archive_task: archiveTaskRpc,
  restore_task: restoreTaskRpc,
} as const;
