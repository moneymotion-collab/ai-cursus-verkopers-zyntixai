import "server-only";

import {
  orgContextFail,
  orgContextOk,
  type OrgContextResult,
} from "@/features/org-context/domain/errors";

export const ORG_CONTEXT_QUERY_TABLES = [
  "organization_business_activities",
  "organization_context_assignments",
  "organization_context_assignment_events",
  "organizations",
] as const;

export type OrgContextQueryTableName = (typeof ORG_CONTEXT_QUERY_TABLES)[number];

export type OrgContextQueryError = {
  message: string;
  code?: string;
};

export type OrgContextQueryResponse = {
  data: Record<string, unknown>[] | null;
  error: OrgContextQueryError | null;
};

export type OrgContextFilterBuilder = {
  select(columns?: string): OrgContextFilterBuilder;
  eq(column: string, value: string | number | boolean): OrgContextFilterBuilder;
  order(column: string, options?: { ascending?: boolean }): OrgContextFilterBuilder;
  then: Promise<OrgContextQueryResponse>["then"];
};

export type OrgContextQueryClient = {
  from(table: OrgContextQueryTableName): OrgContextFilterBuilder;
};

export async function executeOrgContextQuery(
  builder: OrgContextFilterBuilder,
): Promise<OrgContextResult<Record<string, unknown>[]>> {
  const { data, error } = await builder;
  if (error) {
    return orgContextFail("DATABASE_READ_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return orgContextOk(data ?? []);
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

export function asJsonObject(
  value: unknown,
): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Readonly<Record<string, unknown>>;
}
