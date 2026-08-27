import "server-only";

import {
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { isDataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataIntakeSessionStatus } from "@/features/data-intake/domain/types";
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
            "id, organization_id, session_id, source_kind, storage_bucket, storage_path, original_filename, mime_type, byte_size, sha256, superseded_at, deleted_at, object_verified_at",
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
            "id, organization_id, session_id, source_kind, storage_bucket, storage_path, original_filename, mime_type, byte_size, sha256, superseded_at, deleted_at, object_verified_at",
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
  };
}
