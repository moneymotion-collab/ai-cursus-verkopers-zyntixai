import { z } from "zod";
import { CUSTOMER_STATUSES } from "@/features/customers/domain/status";
import {
  DEFAULT_CUSTOMER_PAGE_SIZE,
  MAX_CUSTOMER_ENROLLMENT_SUMMARIES,
  MAX_CUSTOMER_PAGE_SIZE,
} from "@/features/customers/domain/read-types";

const uuidSchema = z.string().uuid();

export const customerPaginationSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(MAX_CUSTOMER_PAGE_SIZE)
      .default(DEFAULT_CUSTOMER_PAGE_SIZE),
  })
  .strict();

export const customerSortSchema = z
  .object({
    field: z
      .enum(["display_name", "updated_at", "status", "started_at"])
      .default("display_name"),
    direction: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

export const customerListFiltersSchema = z
  .object({
    status: z
      .union([z.enum(CUSTOMER_STATUSES), z.array(z.enum(CUSTOMER_STATUSES))])
      .optional(),
    includeArchived: z.boolean().default(false),
    ownerMemberId: uuidSchema.optional(),
    ownerIsUnassigned: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const customerListQuerySchema = z
  .object({
    organizationId: uuidSchema,
    filters: customerListFiltersSchema.default({}),
    pagination: customerPaginationSchema.default({}),
    sort: customerSortSchema.default({}),
  })
  .strict();

export const customerIdQuerySchema = z
  .object({
    organizationId: uuidSchema,
    customerId: uuidSchema,
  })
  .strict();

export const customerHistoryQuerySchema = customerIdQuerySchema;

export const customerEnrollmentSummaryQuerySchema = customerIdQuerySchema;

export function validateCustomerListQuery(input: unknown) {
  return customerListQuerySchema.safeParse(input);
}

export function validateCustomerIdQuery(input: unknown) {
  return customerIdQuerySchema.safeParse(input);
}

export function validateCustomerHistoryQuery(input: unknown) {
  return customerHistoryQuerySchema.safeParse(input);
}

export function validateCustomerEnrollmentSummaryQuery(input: unknown) {
  return customerEnrollmentSummaryQuerySchema.safeParse(input);
}

export function normalizeCustomerPagination(input: { page?: number; pageSize?: number }) {
  const parsed = customerPaginationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      page: 1,
      pageSize: DEFAULT_CUSTOMER_PAGE_SIZE,
      offset: 0,
      limit: DEFAULT_CUSTOMER_PAGE_SIZE,
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

export function escapeCustomerIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}

export { MAX_CUSTOMER_ENROLLMENT_SUMMARIES };
