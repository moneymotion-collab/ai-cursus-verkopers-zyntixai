"use server";

import type { TaskMutationFailure, TaskMutationResult } from "@/features/tasks/domain/types";
import {
  parseCreateTaskActionInput,
  parseReassignTaskActionInput,
  parseRescheduleTaskActionInput,
  parseUpdateTaskActionInput,
} from "@/features/tasks/actions/editable-task-action-schemas";
import {
  createTaskMutation,
  reassignTaskMutation,
  rescheduleTaskMutation,
  updateTaskMutation,
} from "@/features/tasks/server/task-mutations";
import {
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/tasks/server/normalize-task-error";
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

export async function createTaskAction(input: unknown): Promise<TaskMutationResult> {
  const parsed = parseCreateTaskActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure(parsed.error);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { organizationId, ...taskFields } = parsed.data;

    return await createTaskMutation({
      supabase,
      organizationId,
      input: {
        ...taskFields,
        source: "manual",
        idempotencyKey: null,
      },
    });
  } catch {
    return unexpectedActionFailure();
  }
}

export async function updateTaskAction(input: unknown): Promise<TaskMutationResult> {
  const parsed = parseUpdateTaskActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure(parsed.error);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { organizationId, ...taskInput } = parsed.data;

    return await updateTaskMutation({
      supabase,
      organizationId,
      input: taskInput,
    });
  } catch {
    return unexpectedActionFailure();
  }
}

export async function reassignTaskAction(input: unknown): Promise<TaskMutationResult> {
  const parsed = parseReassignTaskActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure(parsed.error);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { organizationId, ...taskInput } = parsed.data;

    return await reassignTaskMutation({
      supabase,
      organizationId,
      input: taskInput,
    });
  } catch {
    return unexpectedActionFailure();
  }
}

export async function rescheduleTaskAction(input: unknown): Promise<TaskMutationResult> {
  const parsed = parseRescheduleTaskActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure(parsed.error);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { organizationId, ...taskInput } = parsed.data;

    return await rescheduleTaskMutation({
      supabase,
      organizationId,
      input: taskInput,
    });
  } catch {
    return unexpectedActionFailure();
  }
}
