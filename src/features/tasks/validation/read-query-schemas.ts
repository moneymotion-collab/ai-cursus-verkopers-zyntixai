import { z } from "zod";
import {
  DEFAULT_TASK_PAGE_SIZE,
  MAX_TASK_PAGE_SIZE,
} from "@/features/tasks/domain/read-types";
import {
  TASK_SOURCES,
  TASK_STATUSES,
} from "@/features/tasks/domain/types";

const uuidSchema = z.string().uuid();

export const taskPaginationSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(MAX_TASK_PAGE_SIZE)
      .default(DEFAULT_TASK_PAGE_SIZE),
  })
  .strict();

export const taskSortSchema = z
  .object({
    field: z.enum(["due_at", "created_at", "title", "priority"]).default("due_at"),
    direction: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

export const taskListFiltersSchema = z
  .object({
    status: z.union([z.enum(TASK_STATUSES), z.array(z.enum(TASK_STATUSES))]).optional(),
    includeArchived: z.boolean().default(false),
    assigneeMemberId: uuidSchema.optional(),
    leadId: uuidSchema.optional(),
    customerId: uuidSchema.optional(),
    enrollmentId: uuidSchema.optional(),
    programId: uuidSchema.optional(),
    source: z.enum(TASK_SOURCES).optional(),
    dueState: z.enum(["overdue", "due_today", "upcoming", "none"]).optional(),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const contextFilters = [
      value.leadId,
      value.customerId,
      value.enrollmentId,
      value.programId,
    ].filter(Boolean);

    if (contextFilters.length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only one linked-context filter may be supplied at a time",
        path: ["leadId"],
      });
    }
  });

export const taskListQuerySchema = z
  .object({
    organizationId: uuidSchema,
    filters: taskListFiltersSchema.default({}),
    pagination: taskPaginationSchema.default({}),
    sort: taskSortSchema.default({}),
  })
  .strict();

export const taskIdQuerySchema = z
  .object({
    organizationId: uuidSchema,
    taskId: uuidSchema,
  })
  .strict();

export const taskHistoryQuerySchema = taskIdQuerySchema;

export function validateTaskListQuery(input: unknown) {
  return taskListQuerySchema.safeParse(input);
}

export function validateTaskIdQuery(input: unknown) {
  return taskIdQuerySchema.safeParse(input);
}

export function validateTaskHistoryQuery(input: unknown) {
  return taskHistoryQuerySchema.safeParse(input);
}

export function normalizePagination(input: { page?: number; pageSize?: number }) {
  const parsed = taskPaginationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      page: 1,
      pageSize: DEFAULT_TASK_PAGE_SIZE,
      offset: 0,
      limit: DEFAULT_TASK_PAGE_SIZE,
    };
  }

  const page = parsed.data.page;
  const pageSize = parsed.data.pageSize;
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    limit: pageSize,
  };
}
