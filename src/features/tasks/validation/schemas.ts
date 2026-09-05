import { z } from "zod";
import {
  TASK_PRIORITIES,
  TASK_SOURCES,
  TASK_TYPES,
} from "@/features/tasks/domain/types";

const uuidSchema = z.string().uuid();

export const organizationContextSchema = z.object({
  organizationId: uuidSchema,
});

export const linkedContextRefinement = (
  data: {
    leadId?: string | null;
    customerId?: string | null;
    enrollmentId?: string | null;
    programId?: string | null;
    projectId?: string | null;
  },
  ctx: z.RefinementCtx,
) => {
  const hasLead = Boolean(data.leadId);
  const hasCustomer = Boolean(data.customerId);
  const hasEnrollment = Boolean(data.enrollmentId);
  const hasProgram = Boolean(data.programId);
  const hasProject = Boolean(data.projectId);
  const hasStandaloneCustomer = hasCustomer && !hasEnrollment;
  const contextCount = [
    hasLead,
    hasStandaloneCustomer,
    hasEnrollment,
    hasProject,
  ].filter(Boolean).length;

  if (contextCount !== 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Exactly one linked lead, customer, enrollment, or project is required",
      path: ["leadId"],
    });
  }

  if (hasLead && hasCustomer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Lead and customer cannot both be set",
      path: ["customerId"],
    });
  }

  if (hasLead && hasEnrollment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Lead and enrollment cannot both be set",
      path: ["enrollmentId"],
    });
  }

  if (hasProject && (hasLead || hasCustomer || hasEnrollment || hasProgram)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Project cannot be combined with another linked context",
      path: ["projectId"],
    });
  }

  if (hasProgram !== hasEnrollment) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Program and enrollment must be provided together",
      path: ["programId"],
    });
  }

  if (hasEnrollment && !hasCustomer) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enrollment requires a customer",
      path: ["customerId"],
    });
  }
};

export const dueAtSchema = z
  .string()
  .min(1, "Due date is required")
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Due date must be a valid ISO timestamp",
  });

export const taskCreateInputSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    dueAt: dueAtSchema,
    description: z.string().trim().max(5000).optional().nullable(),
    taskType: z.enum(TASK_TYPES).default("general"),
    priority: z.enum(TASK_PRIORITIES).default("normal"),
    source: z.enum(TASK_SOURCES).default("manual"),
    assigneeMemberId: uuidSchema.optional().nullable(),
    leadId: uuidSchema.optional().nullable(),
    customerId: uuidSchema.optional().nullable(),
    enrollmentId: uuidSchema.optional().nullable(),
    programId: uuidSchema.optional().nullable(),
    projectId: uuidSchema.optional().nullable(),
    predecessorTaskId: uuidSchema.optional().nullable(),
    idempotencyKey: z.string().trim().min(1).max(200).optional().nullable(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict()
  .superRefine(linkedContextRefinement)
  .superRefine((data, ctx) => {
    if (data.source === "manual" && data.idempotencyKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Manual tasks cannot include an idempotency key",
        path: ["idempotencyKey"],
      });
    }

    if (data.source === "system" && !data.idempotencyKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "System tasks require an idempotency key",
        path: ["idempotencyKey"],
      });
    }
  });

export const taskUpdateInputSchema = z
  .object({
    taskId: uuidSchema,
    title: z.string().trim().min(1, "Title is required").max(200),
    description: z.string().trim().max(5000).optional().nullable(),
    taskType: z.enum(TASK_TYPES).default("general"),
    priority: z.enum(TASK_PRIORITIES).default("normal"),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();

export const taskReassignInputSchema = z
  .object({
    taskId: uuidSchema,
    assigneeMemberId: uuidSchema.optional().nullable(),
  })
  .strict();

export const taskRescheduleInputSchema = z
  .object({
    taskId: uuidSchema,
    dueAt: dueAtSchema,
  })
  .strict();

export const taskCompleteInputSchema = z
  .object({
    taskId: uuidSchema,
    completionNote: z.string().trim().max(5000).optional().nullable(),
  })
  .strict();

export const taskCancelInputSchema = z
  .object({
    taskId: uuidSchema,
    cancelReason: z.string().trim().min(1, "Cancel reason is required").max(5000),
  })
  .strict();

export const taskArchiveInputSchema = z
  .object({
    taskId: uuidSchema,
  })
  .strict();

export const taskRestoreInputSchema = z
  .object({
    taskId: uuidSchema,
  })
  .strict();

export function validateTaskCreateInput(input: unknown) {
  return taskCreateInputSchema.safeParse(input);
}

export function validateTaskUpdateInput(input: unknown) {
  return taskUpdateInputSchema.safeParse(input);
}

export function validateTaskReassignInput(input: unknown) {
  return taskReassignInputSchema.safeParse(input);
}

export function validateTaskRescheduleInput(input: unknown) {
  return taskRescheduleInputSchema.safeParse(input);
}

export function validateTaskCompleteInput(input: unknown) {
  return taskCompleteInputSchema.safeParse(input);
}

export function validateTaskCancelInput(input: unknown) {
  return taskCancelInputSchema.safeParse(input);
}

export function validateTaskArchiveInput(input: unknown) {
  return taskArchiveInputSchema.safeParse(input);
}

export function validateTaskRestoreInput(input: unknown) {
  return taskRestoreInputSchema.safeParse(input);
}

export function validateOrganizationContext(input: unknown) {
  return organizationContextSchema.safeParse(input);
}

export function assertPredecessorNotSelf(
  predecessorTaskId: string | null | undefined,
  taskId: string | undefined,
) {
  if (predecessorTaskId && taskId && predecessorTaskId === taskId) {
    return {
      ok: false as const,
      error: "A task cannot be its own predecessor",
    };
  }

  return { ok: true as const };
}
