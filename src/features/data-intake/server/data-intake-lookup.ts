import "server-only";

import {
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { isDataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataIntakeSessionStatus } from "@/features/data-intake/domain/types";
import type {
  DataIntakeMappingRow,
  DataMappingDecisionStatus,
  DataMappingSnapshot,
} from "@/features/data-intake/domain/mapping";
import type { DataImportPlanStatus } from "@/features/data-intake/domain/planning";
import {
  DATA_STAGING_RESOLUTIONS,
  DATA_STAGING_TARGET_OPERATIONS,
  type DataIntakeStagingRow,
  type DataStagingResolution,
  type DataStagingTargetOperation,
} from "@/features/data-intake/domain/staging";
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
  currentPlanId: string | null;
  approvedAt: string | null;
  approvedByUserId: string | null;
};

export type DataIntakeEventRecord = {
  eventType: string;
  sessionId: string | null;
  metadata: Record<string, unknown>;
};

export type DataIntakePlanRecord = {
  id: string;
  organizationId: string;
  sessionId: string;
  version: number;
  sourceId: string;
  sourceSha256: string;
  targetDomain: string;
  adapterVersion: string;
  mappingSnapshot: DataMappingSnapshot;
  includedFingerprints: string[];
  summary: Record<string, unknown>;
  planHash: string;
  status: DataImportPlanStatus;
  createdByUserId: string;
  approvedByUserId: string | null;
  createdAt: string | null;
  approvedAt: string | null;
  supersededAt: string | null;
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
  findLatestEvent(input: {
    organizationId: string;
    sessionId: string;
    eventType: string;
  }): Promise<DataIntakeResult<DataIntakeEventRecord | null>>;
  findPlans(input: {
    organizationId: string;
    sessionId: string;
  }): Promise<DataIntakeResult<DataIntakePlanRecord[]>>;
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
    currentPlanId: asString(row.current_plan_id),
    approvedAt: asString(row.approved_at),
    approvedByUserId: asString(row.approved_by_user_id),
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
          .select(
            "id, organization_id, status, source_kind, target_domain, current_plan_id, approved_at, approved_by_user_id",
          )
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
            "source_row_number, raw_values, normalized_values, row_fingerprint, lifecycle, resolution, target_operation, target_record_id, error_codes, warning_codes, error_details",
          )
          .eq("organization_id", input.organizationId)
          .eq("source_id", input.sourceId),
      );
      if (!rows.ok) {
        return rows;
      }
      return dataOk(rows.value.flatMap(mapStaging));
    },

    async findLatestEvent(input) {
      const rows = await executeDataIntakeQuery(
        queryClient
          .from("data_intake_events")
          .select("event_type, session_id, metadata, created_at")
          .eq("organization_id", input.organizationId)
          .eq("session_id", input.sessionId)
          .eq("event_type", input.eventType),
      );
      if (!rows.ok) {
        return rows;
      }
      const latest = rows.value.at(-1);
      if (!latest) {
        return dataOk(null);
      }
      const eventType = asString(latest.event_type);
      const metadata =
        latest.metadata && typeof latest.metadata === "object" && !Array.isArray(latest.metadata)
          ? (latest.metadata as Record<string, unknown>)
          : {};
      return dataOk(
        eventType
          ? {
              eventType,
              sessionId: asString(latest.session_id),
              metadata,
            }
          : null,
      );
    },

    async findPlans(input) {
      const rows = await executeDataIntakeQuery(
        queryClient
          .from("data_import_plans")
          .select(
            "id, organization_id, session_id, version, source_id, source_sha256, target_domain, adapter_version, mapping_snapshot, included_fingerprints, summary, plan_hash, status, created_by_user_id, approved_by_user_id, created_at, approved_at, superseded_at",
          )
          .eq("organization_id", input.organizationId)
          .eq("session_id", input.sessionId),
      );
      if (!rows.ok) {
        return rows;
      }
      return dataOk(rows.value.flatMap(mapPlan));
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

const PLAN_STATUSES = new Set<DataImportPlanStatus>([
  "draft",
  "approved",
  "superseded",
  "executing",
  "executed",
]);

function mapPlan(row: Record<string, unknown>): DataIntakePlanRecord[] {
  const id = asString(row.id);
  const organizationId = asString(row.organization_id);
  const sessionId = asString(row.session_id);
  const sourceId = asString(row.source_id);
  const sourceSha256 = asString(row.source_sha256);
  const targetDomain = asString(row.target_domain);
  const adapterVersion = asString(row.adapter_version);
  const planHash = asString(row.plan_hash);
  const status = asString(row.status);
  const createdByUserId = asString(row.created_by_user_id);
  const version = row.version;
  const mappingSnapshot = row.mapping_snapshot;
  const includedFingerprints = row.included_fingerprints;
  const summary = row.summary;
  if (
    !id ||
    !organizationId ||
    !sessionId ||
    !sourceId ||
    !sourceSha256 ||
    !targetDomain ||
    !adapterVersion ||
    !planHash ||
    !status ||
    !PLAN_STATUSES.has(status as DataImportPlanStatus) ||
    typeof version !== "number" ||
    !createdByUserId ||
    !mappingSnapshot ||
    typeof mappingSnapshot !== "object" ||
    Array.isArray(mappingSnapshot) ||
    !Array.isArray(includedFingerprints) ||
    !summary ||
    typeof summary !== "object" ||
    Array.isArray(summary)
  ) {
    return [];
  }
  return [
    {
      id,
      organizationId,
      sessionId,
      version,
      sourceId,
      sourceSha256,
      targetDomain,
      adapterVersion,
      mappingSnapshot: mappingSnapshot as DataMappingSnapshot,
      includedFingerprints: includedFingerprints.filter(
        (value): value is string => typeof value === "string",
      ),
      summary: summary as Record<string, unknown>,
      planHash,
      status: status as DataImportPlanStatus,
      createdByUserId,
      approvedByUserId: asString(row.approved_by_user_id),
      createdAt: asString(row.created_at),
      approvedAt: asString(row.approved_at),
      supersededAt: asString(row.superseded_at),
    },
  ];
}

function mapStaging(row: Record<string, unknown>): DataIntakeStagingRow[] {
  const sourceRowNumber = row.source_row_number;
  const fingerprint = asString(row.row_fingerprint);
  const lifecycle = asString(row.lifecycle);
  const resolution = asString(row.resolution);
  const targetOperation = asString(row.target_operation);
  const rawValues = row.raw_values;
  const normalizedValues = row.normalized_values;
  if (
    typeof sourceRowNumber !== "number" ||
    !fingerprint ||
    (lifecycle !== "validated" && lifecycle !== "blocked") ||
    !resolution ||
    !(DATA_STAGING_RESOLUTIONS as readonly string[]).includes(resolution) ||
    (targetOperation !== null &&
      !(DATA_STAGING_TARGET_OPERATIONS as readonly string[]).includes(targetOperation)) ||
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
      resolution: resolution as DataStagingResolution,
      targetOperation: targetOperation as DataStagingTargetOperation | null,
      targetRecordId: asString(row.target_record_id),
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
