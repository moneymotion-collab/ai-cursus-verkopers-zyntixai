import { z } from "zod";
import { LEAD_STATUSES } from "@/features/leads/domain/status";
import {
  DEFAULT_LEAD_PAGE_SIZE,
  MAX_LEAD_PAGE_SIZE,
} from "@/features/leads/domain/read-types";

const uuidSchema = z.string().uuid();

export const leadPaginationSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(MAX_LEAD_PAGE_SIZE)
      .default(DEFAULT_LEAD_PAGE_SIZE),
  })
  .strict();

export const leadSortSchema = z
  .object({
    field: z
      .enum(["display_name", "updated_at", "status", "created_at"])
      .default("display_name"),
    direction: z.enum(["asc", "desc"]).default("asc"),
  })
  .strict();

export const leadListFiltersSchema = z
  .object({
    status: z.union([z.enum(LEAD_STATUSES), z.array(z.enum(LEAD_STATUSES))]).optional(),
    stageId: uuidSchema.optional(),
    includeArchived: z.boolean().default(false),
    ownerMemberId: uuidSchema.optional(),
    ownerIsUnassigned: z.boolean().optional(),
    search: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const leadListQuerySchema = z
  .object({
    organizationId: uuidSchema,
    filters: leadListFiltersSchema.default({}),
    pagination: leadPaginationSchema.default({}),
    sort: leadSortSchema.default({}),
  })
  .strict();

export const leadIdQuerySchema = z
  .object({
    organizationId: uuidSchema,
    leadId: uuidSchema,
  })
  .strict();

export const leadHistoryQuerySchema = leadIdQuerySchema;

export function validateLeadListQuery(input: unknown) {
  return leadListQuerySchema.safeParse(input);
}

export function validateLeadIdQuery(input: unknown) {
  return leadIdQuerySchema.safeParse(input);
}

export function validateLeadHistoryQuery(input: unknown) {
  return leadHistoryQuerySchema.safeParse(input);
}

export function normalizeLeadPagination(input: { page?: number; pageSize?: number }) {
  const parsed = leadPaginationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      page: 1,
      pageSize: DEFAULT_LEAD_PAGE_SIZE,
      offset: 0,
      limit: DEFAULT_LEAD_PAGE_SIZE,
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

export function escapeLeadIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, "\\$&");
}
