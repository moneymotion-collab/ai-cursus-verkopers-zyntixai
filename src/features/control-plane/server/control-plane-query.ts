import "server-only";

import {
  controlPlaneFail,
  controlPlaneOk,
  type ControlPlaneResult,
} from "@/features/control-plane/domain/errors";

export const CONTROL_PLANE_TABLES = [
  "taxonomy_releases",
  "taxonomy_foundations",
  "taxonomy_industries",
  "taxonomy_niches",
  "taxonomy_specializations",
  "taxonomy_deep_specializations",
  "taxonomy_aliases",
  "capabilities",
  "capability_dependencies",
  "capability_readiness",
  "context_packs",
  "context_pack_versions",
  "context_capability_mappings",
  "context_terminology",
  "context_pack_readiness",
] as const;

export type ControlPlaneTableName = (typeof CONTROL_PLANE_TABLES)[number];

export type ControlPlaneQueryError = {
  message: string;
  code?: string;
};

export type ControlPlaneQueryResponse = {
  data: Record<string, unknown>[] | null;
  error: ControlPlaneQueryError | null;
};

export type ControlPlaneFilterBuilder = {
  select(columns?: string): ControlPlaneFilterBuilder;
  eq(column: string, value: string | number): ControlPlaneFilterBuilder;
  in(column: string, values: readonly string[]): ControlPlaneFilterBuilder;
  is(column: string, value: null): ControlPlaneFilterBuilder;
  order(column: string, options?: { ascending?: boolean }): ControlPlaneFilterBuilder;
  then: Promise<ControlPlaneQueryResponse>["then"];
};

export type ControlPlaneQueryClient = {
  from(table: ControlPlaneTableName): ControlPlaneFilterBuilder;
};

export async function executeControlPlaneQuery(
  builder: ControlPlaneFilterBuilder,
): Promise<ControlPlaneResult<Record<string, unknown>[]>> {
  const { data, error } = await builder;
  if (error) {
    return controlPlaneFail("DATABASE_READ_ERROR", error.message, {
      code: error.code ?? null,
    });
  }
  return controlPlaneOk(data ?? []);
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

export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asScope(value: unknown): Readonly<Record<string, unknown>> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Readonly<Record<string, unknown>>;
}
