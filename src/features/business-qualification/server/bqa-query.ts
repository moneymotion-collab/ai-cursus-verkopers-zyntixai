import "server-only";

import {
  bqaFail,
  bqaOk,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";

export const BQA_QUERY_TABLES = [
  "business_activity_qualifications",
  "business_activity_qualification_answers",
  "business_activity_classification_decisions",
  "business_activity_qualification_events",
  "organization_members",
  "organizations",
] as const;

export type BqaQueryTableName = (typeof BQA_QUERY_TABLES)[number];

export type BqaQueryError = {
  message: string;
  code?: string;
};

export type BqaQueryResponse = {
  data: Record<string, unknown>[] | null;
  error: BqaQueryError | null;
};

export type BqaFilterBuilder = {
  select(columns?: string): BqaFilterBuilder;
  eq(column: string, value: string | number | boolean): BqaFilterBuilder;
  order(column: string, options?: { ascending?: boolean }): BqaFilterBuilder;
  then: Promise<BqaQueryResponse>["then"];
};

export type BqaQueryClient = {
  from(table: BqaQueryTableName): BqaFilterBuilder;
};

export async function executeBqaQuery(
  builder: BqaFilterBuilder,
): Promise<BqaResult<Record<string, unknown>[]>> {
  const { data, error } = await builder;
  if (error) {
    return bqaFail("DATABASE_READ_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return bqaOk(data ?? []);
}

export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function asNullableString(value: unknown): string | null {
  if (value === null) {
    return null;
  }
  return typeof value === "string" ? value : null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === "string");
}

export function asJsonObject(
  value: unknown,
): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Readonly<Record<string, unknown>>;
}
