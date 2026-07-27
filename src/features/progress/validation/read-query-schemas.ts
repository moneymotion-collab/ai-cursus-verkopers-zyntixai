import { z } from "zod";
import {
  DEFAULT_PROGRESS_PAGE_SIZE,
  MAX_PROGRESS_PAGE_SIZE,
} from "@/features/progress/domain/read-types";
import { PROGRESS_FACT_TYPES } from "@/features/progress/domain/fact-types";

const uuidSchema = z.string().uuid();

export const progressPaginationSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(MAX_PROGRESS_PAGE_SIZE)
      .default(DEFAULT_PROGRESS_PAGE_SIZE),
  })
  .strict();

export const progressSortSchema = z
  .object({
    field: z
      .enum(["occurred_at", "recorded_at", "fact_type"])
      .default("occurred_at"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const progressListFiltersSchema = z
  .object({
    factType: z
      .union([z.enum(PROGRESS_FACT_TYPES), z.array(z.enum(PROGRESS_FACT_TYPES))])
      .optional(),
    enrollmentId: uuidSchema.optional(),
    customerId: uuidSchema.optional(),
    programId: uuidSchema.optional(),
    includeVoided: z.boolean().default(false),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const progressListQuerySchema = z
  .object({
    organizationId: uuidSchema,
    filters: progressListFiltersSchema.default({}),
    pagination: progressPaginationSchema.default({}),
    sort: progressSortSchema.default({}),
  })
  .strict();

export const progressFactIdQuerySchema = z
  .object({
    organizationId: uuidSchema,
    progressFactId: uuidSchema,
  })
  .strict();

export function validateProgressListQuery(input: unknown) {
  return progressListQuerySchema.safeParse(input);
}

export function validateProgressFactIdQuery(input: unknown) {
  return progressFactIdQuerySchema.safeParse(input);
}

export function normalizeProgressPagination(input: {
  page?: number;
  pageSize?: number;
}) {
  const parsed = progressPaginationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      page: 1,
      pageSize: DEFAULT_PROGRESS_PAGE_SIZE,
      offset: 0,
      limit: DEFAULT_PROGRESS_PAGE_SIZE,
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

export function escapeProgressIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
