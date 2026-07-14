import { z } from "zod";
import { TASK_PRIORITIES, TASK_TYPES } from "@/features/tasks/domain/types";
import {
  dueAtSchema,
  linkedContextRefinement,
  organizationContextSchema,
  taskReassignInputSchema,
  taskRescheduleInputSchema,
  taskUpdateInputSchema,
} from "@/features/tasks/validation/schemas";

const uuidSchema = z.string().uuid();

export const createTaskActionInputSchema = organizationContextSchema
  .extend({
    title: z.string().trim().min(1, "Title is required").max(200),
    dueAt: dueAtSchema,
    description: z.string().trim().max(5000).optional().nullable(),
    taskType: z.enum(TASK_TYPES).default("general"),
    priority: z.enum(TASK_PRIORITIES).default("normal"),
    assigneeMemberId: uuidSchema.optional().nullable(),
    leadId: uuidSchema.optional().nullable(),
    customerId: uuidSchema.optional().nullable(),
    enrollmentId: uuidSchema.optional().nullable(),
    programId: uuidSchema.optional().nullable(),
    predecessorTaskId: uuidSchema.optional().nullable(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict()
  .superRefine(linkedContextRefinement);

export const updateTaskActionInputSchema = organizationContextSchema
  .merge(taskUpdateInputSchema)
  .strict();

export const reassignTaskActionInputSchema = organizationContextSchema
  .merge(taskReassignInputSchema)
  .strict();

export const rescheduleTaskActionInputSchema = organizationContextSchema
  .merge(taskRescheduleInputSchema)
  .strict();

export function parseCreateTaskActionInput(input: unknown) {
  return createTaskActionInputSchema.safeParse(input);
}

export function parseUpdateTaskActionInput(input: unknown) {
  return updateTaskActionInputSchema.safeParse(input);
}

export function parseReassignTaskActionInput(input: unknown) {
  return reassignTaskActionInputSchema.safeParse(input);
}

export function parseRescheduleTaskActionInput(input: unknown) {
  return rescheduleTaskActionInputSchema.safeParse(input);
}
