import { z } from "zod";
import { PROGRAM_DELIVERY_MODES } from "@/features/programs/domain/delivery-mode";
import {
  DEFAULT_PROGRAM_PAGE_SIZE,
  MAX_PROGRAM_PAGE_SIZE,
} from "@/features/programs/domain/read-types";
import { PROGRAM_STATUSES } from "@/features/programs/domain/status";

const uuidSchema = z.string().uuid();

export const programPaginationSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(MAX_PROGRAM_PAGE_SIZE)
      .default(DEFAULT_PROGRAM_PAGE_SIZE),
  })
  .strict();

export const programSortSchema = z
  .object({
    field: z.enum(["name", "updated_at", "status", "created_at"]).default("updated_at"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const programListFiltersSchema = z
  .object({
    status: z
      .union([z.enum(PROGRAM_STATUSES), z.array(z.enum(PROGRAM_STATUSES))])
      .optional(),
    deliveryMode: z
      .union([
        z.enum(PROGRAM_DELIVERY_MODES),
        z.array(z.enum(PROGRAM_DELIVERY_MODES)),
      ])
      .optional(),
    includeArchived: z.boolean().default(false),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const programListQuerySchema = z
  .object({
    organizationId: uuidSchema,
    filters: programListFiltersSchema.default({}),
    pagination: programPaginationSchema.default({}),
    sort: programSortSchema.default({}),
  })
  .strict();

export const programIdQuerySchema = z
  .object({
    organizationId: uuidSchema,
    programId: uuidSchema,
  })
  .strict();

export const programHistoryQuerySchema = programIdQuerySchema;

export function validateProgramListQuery(input: unknown) {
  return programListQuerySchema.safeParse(input);
}

export function validateProgramIdQuery(input: unknown) {
  return programIdQuerySchema.safeParse(input);
}

export function validateProgramHistoryQuery(input: unknown) {
  return programHistoryQuerySchema.safeParse(input);
}

export function normalizeProgramPagination(input: {
  page?: number;
  pageSize?: number;
}) {
  const parsed = programPaginationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      page: 1,
      pageSize: DEFAULT_PROGRAM_PAGE_SIZE,
      offset: 0,
      limit: DEFAULT_PROGRAM_PAGE_SIZE,
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

export function escapeProgramIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
