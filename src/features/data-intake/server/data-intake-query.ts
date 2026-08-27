import "server-only";

import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";

export const DATA_INTAKE_QUERY_TABLES = [
  "organizations",
  "organization_members",
] as const;

export type DataIntakeQueryTableName = (typeof DATA_INTAKE_QUERY_TABLES)[number];

export type DataIntakeQueryError = {
  message: string;
  code?: string;
};

export type DataIntakeQueryResponse = {
  data: Record<string, unknown>[] | null;
  error: DataIntakeQueryError | null;
};

export type DataIntakeFilterBuilder = {
  select(columns?: string): DataIntakeFilterBuilder;
  eq(column: string, value: string | number | boolean): DataIntakeFilterBuilder;
  then: Promise<DataIntakeQueryResponse>["then"];
};

export type DataIntakeQueryClient = {
  from(table: DataIntakeQueryTableName): DataIntakeFilterBuilder;
};

export async function executeDataIntakeQuery(
  builder: DataIntakeFilterBuilder,
): Promise<DataIntakeResult<Record<string, unknown>[]>> {
  const { data, error } = await builder;
  if (error) {
    return dataFail("DATABASE_READ_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return dataOk(data ?? []);
}

export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
