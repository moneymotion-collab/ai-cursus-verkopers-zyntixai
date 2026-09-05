"use server";

import type { TaskMutationFailure, TaskMutationResult } from "@/features/tasks/domain/types";
import {
  parseArchiveTaskActionInput,
  parseCancelTaskActionInput,
  parseCompleteTaskActionInput,
  parseRestoreTaskActionInput,
} from "@/features/tasks/actions/lifecycle-task-action-schemas";
import {
  archiveTaskMutation,
  cancelTaskMutation,
  completeTaskMutation,
  restoreTaskMutation,
} from "@/features/tasks/server/task-mutations";
import {
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/tasks/server/normalize-task-error";
import { evaluateTaskModuleAccess } from "@/features/tasks/server/enforce-task-module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundaryValidationFailure(error: import("zod").ZodError): TaskMutationFailure {
  return {
    ok: false,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
  };
}

function unexpectedActionFailure(): TaskMutationFailure {
  return {
    ok: false,
    committed: false,
    error: {
      code: "UNEXPECTED_ERROR",
      message: "Something went wrong. Please try again.",
      retryable: true,
      category: "server",
    },
  };
}

export async function completeTaskAction(input: unknown): Promise<TaskMutationResult> {
  const parsed = parseCompleteTaskActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure(parsed.error);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { organizationId, ...taskInput } = parsed.data;
    const access = await evaluateTaskModuleAccess(organizationId);
    if (!access.allowed) return access.failure;

    return await completeTaskMutation({
      supabase,
      organizationId,
      input: taskInput,
    });
  } catch {
    return unexpectedActionFailure();
  }
}

export async function cancelTaskAction(input: unknown): Promise<TaskMutationResult> {
  const parsed = parseCancelTaskActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure(parsed.error);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { organizationId, ...taskInput } = parsed.data;
    const access = await evaluateTaskModuleAccess(organizationId);
    if (!access.allowed) return access.failure;

    return await cancelTaskMutation({
      supabase,
      organizationId,
      input: taskInput,
    });
  } catch {
    return unexpectedActionFailure();
  }
}

export async function archiveTaskAction(input: unknown): Promise<TaskMutationResult> {
  const parsed = parseArchiveTaskActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure(parsed.error);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { organizationId, ...taskInput } = parsed.data;
    const access = await evaluateTaskModuleAccess(organizationId);
    if (!access.allowed) return access.failure;

    return await archiveTaskMutation({
      supabase,
      organizationId,
      input: taskInput,
    });
  } catch {
    return unexpectedActionFailure();
  }
}

export async function restoreTaskAction(input: unknown): Promise<TaskMutationResult> {
  const parsed = parseRestoreTaskActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure(parsed.error);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { organizationId, ...taskInput } = parsed.data;
    const access = await evaluateTaskModuleAccess(organizationId);
    if (!access.allowed) return access.failure;

    return await restoreTaskMutation({
      supabase,
      organizationId,
      input: taskInput,
    });
  } catch {
    return unexpectedActionFailure();
  }
}
