import "server-only";

import {
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { isDataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataIntakeSessionStatus } from "@/features/data-intake/domain/types";
import type { DataIntakeMappingRow, DataMappingDecisionStatus } from "@/features/data-intake/domain/mapping";
import type { DataIntakeStagingRow } from "@/features/data-intake/domain/staging";
import type { DataValidationIssue } from "@/features/data-intake/domain/validation";
import {
  asString,
  executeDataIntakeQuery,
  type DataIntakeQueryClient,
} from "@/features/data-intake/server/data-intake-query";

export type DataIntakeSessionRecord = {
  id: string;
  organizationId: string;
  status: DataIntakeSessionStatus;
  sourceKind: DataSourceKind;
  targetDomain: string;
};

export type DataIntakeSourceRecord = {
  id: string;
  organizationId: string;
  sessionId: string;
  sourceKind: DataSourceKind;
  storageBucket: string;
  storagePath: string;
  originalFilename: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  supersededAt: string | null;
  deletedAt: string | null;
  objectVerifiedAt: string | null;
  encoding: string | null;
  delimiter: string | null;
  sheetName: string | null;
  headerRowIndex: number | null;
  rowCount: number | null;
  columnCount: number | null;
  parseMetadata: Record<string, unknown>;
};

export type DataIntakeRecordLookup = {
  findSession(input: {
    organizationId: string;
    sessionId: string;
  }): Promise<DataIntakeResult<DataIntakeSessionRecord | null>>;
  findSource(input: {
    organizationId: string;
    sourceId: string;
  }): Promise<DataIntakeResult<DataIntakeSourceRecord | null>>;
  findActiveSource(input: {
    organizationId: string;
    sessionId: string;
  }): Promise<DataIntakeResult<DataIntakeSourceRecord | null>>;
  findMappings(input: {
    organizationId: string;
    sourceId: string;
  }): Promise<DataIntakeResult<DataIntakeMappingRow[]>>;
  findStaging(input: {
    organizationId: string;
    sourceId: string;
  }): Promise<DataIntakeResult<DataIntakeStagingRow[]>>;
};

const SESSION_STATUSES = new Set<DataIntakeSessionStatus>([
  "created",
  "source_ready",
  "parsed",
  "mapping_required",
  "mapped",
  "validating",
  "review_required",
  "ready_for_approval",
  "approved",
  "importing",
  "completed",
  "completed_with_errors",
  "failed",
  "cancelled",
]);

function mapSession(row: Record<string, unknown>): DataIntakeSessionRecord | null {
  const id = asString(row.id);
  const organizationId = asString(row.organization_id);
  const status = asString(row.status);
  const sourceKind = asString(row.source_kind);
  const targetDomain = asString(row.target_domain);
  if (
    !id ||
    !organizationId ||
    !status ||
    !SESSION_STATUSES.has(status as DataIntakeSessionStatus) ||
    !sourceKind ||
    !isDataSourceKind(sourceKind) ||
    !targetDomain
  ) {
    return null;
  }
  return {
    id,
    organizationId,
    status: status as DataIntakeSessionStatus,
    sourceKind,
    targetDomain,
  };
}

function mapSource(row: Record<string, unknown>): DataIntakeSourceRecord | null {
  const id = asString(row.id);
  const organizationId = asString(row.organization_id);
  const sessionId = asString(row.session_id);
  const sourceKind = asString(row.source_kind);
  const storageBucket = asString(row.storage_bucket);
  const storagePath = asString(row.storage_path);
  const originalFilename = asString(row.original_filename);
  const mimeType = asString(row.mime_type);
  const sha256 = asString(row.sha256);
  const byteSize = row.byte_size;
  if (
    !id ||
    !organizationId ||
    !sessionId ||
    !sourceKind ||
    !isDataSourceKind(sourceKind) ||
    !storageBucket ||
    !storagePath ||
    !originalFilename ||
    !mimeType ||
    !sha256 ||
    typeof byteSize !== "number"
  ) {
    return null;
  }
  return {
    id,
    organizationId,
    sessionId,
    sourceKind,
    storageBucket,
    storagePath,
    originalFilename,
    mimeType,
    byteSize,
    sha256,
    supersededAt: asString(row.superseded_at),
    deletedAt: asString(row.deleted_at),
    objectVerifiedAt: asString(row.object_verified_at),
    encoding: asString(row.encoding),
    delimiter: typeof row.delimiter === "string" ? row.delimiter : null,
    sheetName: asString(row.sheet_name),
    headerRowIndex: typeof row.header_row_index === "number" ? row.header_row_index : null,
    rowCount: typeof row.row_count === "number" ? row.row_count : null,
    columnCount: typeof row.column_count === "number" ? row.column_count : null,
    parseMetadata:
      row.parse_metadata && typeof row.parse_metadata === "object" && !Array.isArray(row.parse_metadata)
        ? (row.parse_metadata as Record<string, unknown>)
        : {},
  };
}

export function createQueryDataIntakeRecordLookup(
  queryClient: DataIntakeQueryClient,
): DataIntakeRecordLookup {
  return {
    async findSession(input) {
      const rows = await executeDataIntakeQuery(
        queryClient
          .from("data_intake_sessions")
          .select("id, organization_id, status, source_kind, target_domain")
          .eq("organization_id", input.organizationId)
          .eq("id", input.sessionId),
      );
      if (!rows.ok) {
        return rows;
      }
      const mapped = rows.value[0] ? mapSession(rows.value[0]) : null;
      return dataOk(mapped);
    },

    async findSource(input) {
      const rows = await executeDataIntakeQuery(
        queryClient
          .from("data_intake_sources")
          .select(
            "id, organization_id, session_id, source_kind, storage_bucket, storage_path, original_filename, mime_type, byte_size, sha256, superseded_at, deleted_at, object_verified_at, encoding, delimiter, sheet_name, header_row_index, row_count, column_count, parse_metadata",
          )
          .eq("organization_id", input.organizationId)
          .eq("id", input.sourceId),
      );
      if (!rows.ok) {
        return rows;
      }
      const mapped = rows.value[0] ? mapSource(rows.value[0]) : null;
      return dataOk(mapped);
    },

    async findActiveSource(input) {
      const rows = await executeDataIntakeQuery(
        queryClient
          .from("data_intake_sources")
          .select(
            "id, organization_id, session_id, source_kind, storage_bucket, storage_path, original_filename, mime_type, byte_size, sha256, superseded_at, deleted_at, object_verified_at, encoding, delimiter, sheet_name, header_row_index, row_count, column_count, parse_metadata",
          )
          .eq("organization_id", input.organizationId)
          .eq("session_id", input.sessionId),
      );
      if (!rows.ok) {
        return rows;
      }
      const active = rows.value
        .map(mapSource)
        .find((row) => row && row.supersededAt === null);
      return dataOk(active ?? null);
    },

    async findMappings(input) {
      const rows = await executeDataIntakeQuery(
        queryClient
          .from("data_intake_mappings")
          .select("source_field_key, source_header, target_field, status")
          .eq("organization_id", input.organizationId)
          .eq("source_id", input.sourceId),
      );
      if (!rows.ok) {
        return rows;
      }
      return dataOk(rows.value.flatMap(mapMapping));
    },

    async findStaging(input) {
      const rows = await executeDataIntakeQuery(
        queryClient
          .from("data_intake_staging_rows")
          .select(
            "source_row_number, raw_values, normalized_values, row_fingerprint, lifecycle, resolution, error_codes, warning_codes, error_details",
          )
          .eq("organization_id", input.organizationId)
          .eq("source_id", input.sourceId),
      );
      if (!rows.ok) {
        return rows;
      }
      return dataOk(rows.value.flatMap(mapStaging));
    },
  };
}

const MAPPING_STATUSES = new Set<DataMappingDecisionStatus>([
  "proposed",
  "confirmed",
  "rejected",
  "unmapped",
  "needs_review",
]);

function mapMapping(row: Record<string, unknown>): DataIntakeMappingRow[] {
  const sourceFieldKey = asString(row.source_field_key);
  const sourceHeader = asString(row.source_header);
  const status = asString(row.status);
  if (
    !sourceFieldKey ||
    sourceHeader === null ||
    !status ||
    !MAPPING_STATUSES.has(status as DataMappingDecisionStatus)
  ) {
    return [];
  }
  return [
    {
      sourceFieldKey,
      sourceHeader,
      targetField: asString(row.target_field),
      status: status as DataMappingDecisionStatus,
    },
  ];
}

function mapStaging(row: Record<string, unknown>): DataIntakeStagingRow[] {
  const sourceRowNumber = row.source_row_number;
  const fingerprint = asString(row.row_fingerprint);
  const lifecycle = asString(row.lifecycle);
  const resolution = asString(row.resolution);
  const rawValues = row.raw_values;
  const normalizedValues = row.normalized_values;
  if (
    typeof sourceRowNumber !== "number" ||
    !fingerprint ||
    (lifecycle !== "validated" && lifecycle !== "blocked") ||
    resolution !== "none" ||
    !rawValues ||
    typeof rawValues !== "object" ||
    Array.isArray(rawValues)
  ) {
    return [];
  }
  return [
    {
      sourceRowNumber,
      rawValues: rawValues as Record<string, string>,
      normalizedValues:
        normalizedValues && typeof normalizedValues === "object" && !Array.isArray(normalizedValues)
          ? (normalizedValues as DataIntakeStagingRow["normalizedValues"])
          : {},
      rowFingerprint: fingerprint,
      lifecycle,
      resolution: "none",
      errorCodes: Array.isArray(row.error_codes)
        ? row.error_codes.filter((value): value is string => typeof value === "string")
        : [],
      warningCodes: Array.isArray(row.warning_codes)
        ? row.warning_codes.filter((value): value is string => typeof value === "string")
        : [],
      errorDetails: Array.isArray(row.error_details)
        ? row.error_details.filter((value): value is DataValidationIssue => {
            return Boolean(
              value &&
                typeof value === "object" &&
                "code" in value &&
                "field" in value &&
                "message" in value,
            );
          })
        : [],
    },
  ];
}
