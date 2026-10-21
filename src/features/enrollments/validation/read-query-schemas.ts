import { z } from "zod";
import {
  DEFAULT_ENROLLMENT_PAGE_SIZE,
  MAX_ENROLLMENT_PAGE_SIZE,
} from "@/features/enrollments/domain/read-types";
import { ENROLLMENT_STATUSES } from "@/features/enrollments/domain/status";

const uuidSchema = z.string().uuid();

export const enrollmentPaginationSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(MAX_ENROLLMENT_PAGE_SIZE)
      .default(DEFAULT_ENROLLMENT_PAGE_SIZE),
  })
  .strict();

export const enrollmentSortSchema = z
  .object({
    field: z
      .enum(["enrolled_at", "updated_at", "status", "created_at"])
      .default("enrolled_at"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const enrollmentListFiltersSchema = z
  .object({
    status: z
      .union([z.enum(ENROLLMENT_STATUSES), z.array(z.enum(ENROLLMENT_STATUSES))])
      .optional(),
    customerId: uuidSchema.optional(),
    programId: uuidSchema.optional(),
    ownerMemberId: uuidSchema.optional(),
    includeArchived: z.boolean().default(false),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const enrollmentListQuerySchema = z
  .object({
    organizationId: uuidSchema,
    filters: enrollmentListFiltersSchema.default({}),
    pagination: enrollmentPaginationSchema.default({}),
    sort: enrollmentSortSchema.default({}),
  })
  .strict();

export const enrollmentIdQuerySchema = z
  .object({
    organizationId: uuidSchema,
    enrollmentId: uuidSchema,
  })
  .strict();

export const enrollmentHistoryQuerySchema = enrollmentIdQuerySchema;

export function validateEnrollmentListQuery(input: unknown) {
  return enrollmentListQuerySchema.safeParse(input);
}

export function validateEnrollmentIdQuery(input: unknown) {
  return enrollmentIdQuerySchema.safeParse(input);
}

export function validateEnrollmentHistoryQuery(input: unknown) {
  return enrollmentHistoryQuerySchema.safeParse(input);
}

export function normalizeEnrollmentPagination(input: {
  page?: number;
  pageSize?: number;
}) {
  const parsed = enrollmentPaginationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      page: 1,
      pageSize: DEFAULT_ENROLLMENT_PAGE_SIZE,
      offset: 0,
      limit: DEFAULT_ENROLLMENT_PAGE_SIZE,
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

export function escapeEnrollmentIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
