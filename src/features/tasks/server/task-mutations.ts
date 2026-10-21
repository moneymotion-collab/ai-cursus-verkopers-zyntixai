import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type {
  TaskApplicationError,
  TaskArchiveInput,
  TaskCancelInput,
  TaskCompleteInput,
  TaskCreateInput,
  TaskMutationCommittedRefreshFailure,
  TaskMutationFailure,
  TaskMutationRefreshHints,
  TaskMutationResult,
  TaskMutationSuccess,
  TaskReassignInput,
  TaskRescheduleInput,
  TaskRestoreInput,
  TaskUpdateInput,
} from "@/features/tasks/domain/types";
import type { Database } from "@/types/database";
import { getTaskById } from "@/features/tasks/server/task-read-queries";
import {
  mutationCommittedRefreshRequiredError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/tasks/server/normalize-task-error";
import {
  archiveTaskRpc,
  cancelTaskRpc,
  completeTaskRpc,
  createTaskRpc,
  reassignTaskRpc,
  rescheduleTaskRpc,
  restoreTaskRpc,
  updateTaskRpc,
} from "@/features/tasks/server/task-rpc-adapters";
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

type MutationContext = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
};

export const MUTATION_REFRESH_HINTS = {
  create: { task: true, taskLists: true, taskHistory: true },
  update: { task: true, taskLists: true, taskHistory: false },
  reassign: { task: true, taskLists: true, taskHistory: false },
  reschedule: { task: true, taskLists: true, taskHistory: false },
  complete: { task: true, taskLists: true, taskHistory: true },
  cancel: { task: true, taskLists: true, taskHistory: true },
  archive: { task: true, taskLists: true, taskHistory: false },
  restore: { task: true, taskLists: true, taskHistory: false },
} as const satisfies Record<string, TaskMutationRefreshHints>;

function validationFailure(error: import("zod").ZodError): TaskMutationFailure {
  return {
    ok: false,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
  };
}

function requiresRefreshOnFailure(error: TaskApplicationError): boolean {
  return error.code === "INVALID_STATE_TRANSITION" || error.code === "TASK_NOT_FOUND";
}

function adapterFailure(error: TaskApplicationError): TaskMutationFailure {
  return {
    ok: false,
    committed: false,
    error: requiresRefreshOnFailure(error)
      ? { ...error, refreshRequired: true }
      : error,
  };
}

function committedRefreshFailure(
  taskId: string,
  refreshHints: TaskMutationRefreshHints,
): TaskMutationCommittedRefreshFailure {
  const base = mutationCommittedRefreshRequiredError();
  return {
    ok: false,
    committed: true,
    taskId,
    refreshHints,
    error: {
      ...base,
      refreshRequired: true,
      retryable: false,
    },
  };
}

function successResult(
  taskId: string,
  task: TaskReadModel,
  refreshHints: TaskMutationRefreshHints,
): TaskMutationSuccess {
  return {
    ok: true,
    taskId,
    task,
    committed: true,
    refreshRequired: false,
    refreshHints,
  };
}

async function refetchTask(
  context: MutationContext,
  taskId: string,
): Promise<TaskReadModel | null> {
  const result = await getTaskById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    taskId,
  });

  if (!result.ok) {
    return null;
  }

  return result.data;
}

async function afterSuccessfulRpc(
  context: MutationContext,
  taskId: string,
  refreshHints: TaskMutationRefreshHints,
): Promise<TaskMutationResult> {
  const task = await refetchTask(context, taskId);

  if (!task) {
    return committedRefreshFailure(taskId, refreshHints);
  }

  return successResult(taskId, task, refreshHints);
}

export async function createTaskMutation(
  context: MutationContext & { input: unknown },
): Promise<TaskMutationResult> {
  const parsed = validateTaskCreateInput(context.input);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const rpcResult = await createTaskRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data as TaskCreateInput,
  });

  if (!rpcResult.ok) {
    return adapterFailure(rpcResult.error);
  }

  if (!rpcResult.taskId) {
    return adapterFailure({
      code: "UNEXPECTED_ERROR",
      message: "Something went wrong. Try again.",
      retryable: true,
      category: "server",
    });
  }

  return afterSuccessfulRpc(context, rpcResult.taskId, MUTATION_REFRESH_HINTS.create);
}

export async function updateTaskMutation(
  context: MutationContext & { input: unknown },
): Promise<TaskMutationResult> {
  const parsed = validateTaskUpdateInput(context.input);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const rpcResult = await updateTaskRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data as TaskUpdateInput,
  });

  if (!rpcResult.ok) {
    return adapterFailure(rpcResult.error);
  }

  return afterSuccessfulRpc(context, parsed.data.taskId, MUTATION_REFRESH_HINTS.update);
}

export async function reassignTaskMutation(
  context: MutationContext & { input: unknown },
): Promise<TaskMutationResult> {
  const parsed = validateTaskReassignInput(context.input);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const rpcResult = await reassignTaskRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data as TaskReassignInput,
  });

  if (!rpcResult.ok) {
    return adapterFailure(rpcResult.error);
  }

  return afterSuccessfulRpc(context, parsed.data.taskId, MUTATION_REFRESH_HINTS.reassign);
}

export async function rescheduleTaskMutation(
  context: MutationContext & { input: unknown },
): Promise<TaskMutationResult> {
  const parsed = validateTaskRescheduleInput(context.input);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const rpcResult = await rescheduleTaskRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data as TaskRescheduleInput,
  });

  if (!rpcResult.ok) {
    return adapterFailure(rpcResult.error);
  }

  return afterSuccessfulRpc(context, parsed.data.taskId, MUTATION_REFRESH_HINTS.reschedule);
}

export async function completeTaskMutation(
  context: MutationContext & { input: unknown },
): Promise<TaskMutationResult> {
  const parsed = validateTaskCompleteInput(context.input);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const rpcResult = await completeTaskRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data as TaskCompleteInput,
  });

  if (!rpcResult.ok) {
    return adapterFailure(rpcResult.error);
  }

  return afterSuccessfulRpc(context, parsed.data.taskId, MUTATION_REFRESH_HINTS.complete);
}

export async function cancelTaskMutation(
  context: MutationContext & { input: unknown },
): Promise<TaskMutationResult> {
  const parsed = validateTaskCancelInput(context.input);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const rpcResult = await cancelTaskRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data as TaskCancelInput,
  });

  if (!rpcResult.ok) {
    return adapterFailure(rpcResult.error);
  }

  return afterSuccessfulRpc(context, parsed.data.taskId, MUTATION_REFRESH_HINTS.cancel);
}

export async function archiveTaskMutation(
  context: MutationContext & { input: unknown },
): Promise<TaskMutationResult> {
  const parsed = validateTaskArchiveInput(context.input);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const rpcResult = await archiveTaskRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data as TaskArchiveInput,
  });

  if (!rpcResult.ok) {
    return adapterFailure(rpcResult.error);
  }

  return afterSuccessfulRpc(context, parsed.data.taskId, MUTATION_REFRESH_HINTS.archive);
}

export async function restoreTaskMutation(
  context: MutationContext & { input: unknown },
): Promise<TaskMutationResult> {
  const parsed = validateTaskRestoreInput(context.input);
  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const rpcResult = await restoreTaskRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data as TaskRestoreInput,
  });

  if (!rpcResult.ok) {
    return adapterFailure(rpcResult.error);
  }

  return afterSuccessfulRpc(context, parsed.data.taskId, MUTATION_REFRESH_HINTS.restore);
}
