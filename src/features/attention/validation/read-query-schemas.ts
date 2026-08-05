import { z } from "zod";
import {
  DEFAULT_ATTENTION_PAGE_SIZE,
  MAX_ATTENTION_PAGE_SIZE,
} from "@/features/attention/domain/read-types";
import { ATTENTION_ITEM_STATUSES } from "@/features/attention/domain/status";
import { ATTENTION_SEVERITIES } from "@/features/attention/domain/severity";

const uuidSchema = z.string().uuid();
const isoDateTimeSchema = z.string().datetime({ offset: true });

export const attentionPaginationSchema = z
  .object({
    page: z.number().int().min(1).default(1),
    pageSize: z
      .number()
      .int()
      .min(1)
      .max(MAX_ATTENTION_PAGE_SIZE)
      .default(DEFAULT_ATTENTION_PAGE_SIZE),
  })
  .strict();

export const attentionSortSchema = z
  .object({
    field: z
      .enum(["created_at", "updated_at", "severity", "last_detected_at"])
      .default("created_at"),
    direction: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const attentionListFiltersSchema = z
  .object({
    status: z
      .union([
        z.enum(ATTENTION_ITEM_STATUSES),
        z.array(z.enum(ATTENTION_ITEM_STATUSES)).min(1),
      ])
      .optional(),
    severity: z
      .union([
        z.enum(ATTENTION_SEVERITIES),
        z.array(z.enum(ATTENTION_SEVERITIES)).min(1),
      ])
      .optional(),
    assigneeMemberId: uuidSchema.nullable().optional(),
    enrollmentId: uuidSchema.optional(),
    customerId: uuidSchema.optional(),
    programId: uuidSchema.optional(),
    acknowledged: z.boolean().optional(),
    includeArchived: z.boolean().default(false),
    createdFrom: isoDateTimeSchema.optional(),
    createdTo: isoDateTimeSchema.optional(),
    updatedFrom: isoDateTimeSchema.optional(),
    updatedTo: isoDateTimeSchema.optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.createdFrom &&
      value.createdTo &&
      Date.parse(value.createdFrom) > Date.parse(value.createdTo)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "createdFrom must be before or equal to createdTo",
        path: ["createdFrom"],
      });
    }
    if (
      value.updatedFrom &&
      value.updatedTo &&
      Date.parse(value.updatedFrom) > Date.parse(value.updatedTo)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "updatedFrom must be before or equal to updatedTo",
        path: ["updatedFrom"],
      });
    }
  });

export const attentionListQuerySchema = z
  .object({
    organizationId: uuidSchema,
    filters: attentionListFiltersSchema.default({}),
    pagination: attentionPaginationSchema.default({}),
    sort: attentionSortSchema.default({}),
  })
  .strict();

export const attentionItemIdQuerySchema = z
  .object({
    organizationId: uuidSchema,
    attentionItemId: uuidSchema,
  })
  .strict();

export function validateAttentionListQuery(input: unknown) {
  return attentionListQuerySchema.safeParse(input);
}

export function validateAttentionItemIdQuery(input: unknown) {
  return attentionItemIdQuerySchema.safeParse(input);
}

export function normalizeAttentionPagination(input: {
  page?: number;
  pageSize?: number;
}) {
  const parsed = attentionPaginationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      page: 1,
      pageSize: DEFAULT_ATTENTION_PAGE_SIZE,
      offset: 0,
      limit: DEFAULT_ATTENTION_PAGE_SIZE,
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
