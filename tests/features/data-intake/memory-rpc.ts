import { DATA_INTAKE_STORAGE_BUCKET } from "@/features/data-intake/domain/constants";
import { DATA_INTAKE_FOUNDATION_RPC } from "@/features/data-intake/server/data-intake-rpc";
import type {
  DataIntakeFoundationRpcArgs,
  DataIntakeFoundationRpcClient,
} from "@/features/data-intake/server/data-intake-rpc";
import {
  DATA_INTAKE_SOURCE_OBJECT_RPC,
  type DataIntakeSourceObjectRpcArgs,
  type DataIntakeSourceObjectRpcClient,
} from "@/features/data-intake/server/data-intake-object-rpc";
import {
  DATA_INTAKE_SOURCE_STRUCTURE_RPC,
  type DataIntakeSourceStructureRpcArgs,
  type DataIntakeSourceStructureRpcClient,
} from "@/features/data-intake/server/data-intake-structure-rpc";
import {
  DATA_INTAKE_MAPPING_RPC,
  type DataIntakeMappingRpcArgs,
  type DataIntakeMappingRpcClient,
} from "@/features/data-intake/server/data-intake-mapping-rpc";
import {
  DATA_INTAKE_STAGING_RPC,
  type DataIntakeStagingRpcArgs,
  type DataIntakeStagingRpcClient,
} from "@/features/data-intake/server/data-intake-staging-rpc";
import {
  DATA_INTAKE_MATCHING_RPC,
  type DataIntakeMatchingRpcArgs,
  type DataIntakeMatchingRpcClient,
} from "@/features/data-intake/server/data-intake-matching-rpc";
import type { CustomerIdentityLookup } from "@/features/data-intake/server/customer-identity-lookup";
import type { DataStagingResolution, DataStagingTargetOperation } from "@/features/data-intake/domain/staging";
import { DATA_CUSTOMER_MATCHER_VERSION } from "@/features/data-intake/domain/matching";
import type { DataIntakeMappingRow, DataMappingDecisionStatus } from "@/features/data-intake/domain/mapping";
import {
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { buildDataIntakeStoragePath } from "@/features/data-intake/domain/storage-path";
import type {
  DataIntakeRecordLookup,
  DataIntakeSessionRecord,
  DataIntakeSourceRecord,
} from "@/features/data-intake/server/data-intake-lookup";
import type { DataIntakeMemoryTables } from "./memory-query-client";
import { isDataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataIntakeSessionStatus } from "@/features/data-intake/domain/types";

type SessionRow = {
  id: string;
  organization_id: string;
  status: string;
  target_domain: string;
  source_kind: string;
  created_by_user_id: string;
  cancelled_at: string | null;
};

type SourceRow = {
  id: string;
  organization_id: string;
  session_id: string;
  source_kind: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  sha256: string;
  superseded_at: string | null;
  deleted_at: string | null;
  object_verified_at: string | null;
  object_verified_by_user_id: string | null;
  encoding: string | null;
  delimiter: string | null;
  sheet_name: string | null;
  header_row_index: number | null;
  row_count: number | null;
  column_count: number | null;
  parse_metadata: Record<string, unknown>;
};

type MappingRow = {
  id: string;
  organization_id: string;
  session_id: string;
  source_id: string;
  source_field_key: string;
  source_header: string;
  target_domain: string;
  target_field: string | null;
  status: string;
  proposal_source: string;
  confirmed_by_user_id: string | null;
  confirmed_at: string | null;
};

export type MemoryCustomer = {
  id: string;
  organization_id: string;
  email: string | null;
  archived_at: string | null;
  display_name?: string;
};

export type DataIntakeMemoryStore = {
  sessions: SessionRow[];
  sources: SourceRow[];
  events: Array<{ event_type: string; metadata: Record<string, unknown> }>;
  mappings: MappingRow[];
  staging: StagingRow[];
  customers: MemoryCustomer[];
  plans: unknown[];
  rowResults: unknown[];
  links: unknown[];
  matchingTail: Promise<unknown>;
};

export type StagingRow = {
  organization_id: string;
  session_id: string;
  source_id: string;
  source_row_number: number;
  raw_values: Record<string, string>;
  normalized_values: Record<string, string | null>;
  row_fingerprint: string;
  lifecycle: "validated" | "blocked";
  resolution: DataStagingResolution;
  target_operation: DataStagingTargetOperation | null;
  target_record_id: string | null;
  error_codes: string[];
  warning_codes: string[];
  error_details: Array<{ code: string; field: string; message: string }>;
  mapping_hash: string;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(code: string, message: string) {
  return { ok: false, code, message };
}

function randomUuid() {
  return crypto.randomUUID();
}

export function emptyDataIntakeStore(): DataIntakeMemoryStore {
  return {
    sessions: [],
    sources: [],
    events: [],
    mappings: [],
    staging: [],
    customers: [],
    plans: [],
    rowResults: [],
    links: [],
    matchingTail: Promise.resolve(),
  };
}

function mapSession(row: SessionRow): DataIntakeSessionRecord | null {
  if (!isDataSourceKind(row.source_kind)) {
    return null;
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    status: row.status as DataIntakeSessionStatus,
    sourceKind: row.source_kind,
    targetDomain: row.target_domain,
  };
}

function mapSource(row: SourceRow): DataIntakeSourceRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    sessionId: row.session_id,
    sourceKind: row.source_kind as DataIntakeSourceRecord["sourceKind"],
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    sha256: row.sha256,
    supersededAt: row.superseded_at,
    deletedAt: row.deleted_at,
    objectVerifiedAt: row.object_verified_at,
    encoding: row.encoding,
    delimiter: row.delimiter,
    sheetName: row.sheet_name,
    headerRowIndex: row.header_row_index,
    rowCount: row.row_count,
    columnCount: row.column_count,
    parseMetadata: row.parse_metadata,
  };
}

export function createStoreDataIntakeRecordLookup(
  store: DataIntakeMemoryStore,
): DataIntakeRecordLookup {
  return {
    async findSession(input) {
      const row = store.sessions.find(
        (session) =>
          session.id === input.sessionId && session.organization_id === input.organizationId,
      );
      return dataOk(row ? mapSession(row) : null) as DataIntakeResult<DataIntakeSessionRecord | null>;
    },
    async findSource(input) {
      const row = store.sources.find(
        (source) => source.id === input.sourceId && source.organization_id === input.organizationId,
      );
      return dataOk(row ? mapSource(row) : null);
    },
    async findActiveSource(input) {
      const row = store.sources.find(
        (source) =>
          source.session_id === input.sessionId &&
          source.organization_id === input.organizationId &&
          source.superseded_at === null,
      );
      return dataOk(row ? mapSource(row) : null);
    },
    async findMappings(input) {
      const rows = store.mappings
        .filter(
          (row) =>
            row.organization_id === input.organizationId && row.source_id === input.sourceId,
        )
        .flatMap((row): DataIntakeMappingRow[] => {
          const status = row.status as DataMappingDecisionStatus;
          if (
            status !== "proposed" &&
            status !== "confirmed" &&
            status !== "rejected" &&
            status !== "unmapped" &&
            status !== "needs_review"
          ) {
            return [];
          }
          return [
            {
              sourceFieldKey: row.source_field_key,
              sourceHeader: row.source_header,
              targetField: row.target_field,
              status,
            },
          ];
        });
      return dataOk(rows);
    },
    async findStaging(input) {
      const rows = store.staging
        .filter(
          (row) =>
            row.organization_id === input.organizationId && row.source_id === input.sourceId,
        )
        .map((row) => ({
          sourceRowNumber: row.source_row_number,
          rawValues: row.raw_values,
          normalizedValues: row.normalized_values,
          rowFingerprint: row.row_fingerprint,
          lifecycle: row.lifecycle,
          resolution: row.resolution,
          targetOperation: row.target_operation,
          targetRecordId: row.target_record_id,
          errorCodes: row.error_codes,
          warningCodes: row.warning_codes,
          errorDetails: row.error_details as never,
        }));
      return dataOk(rows);
    },
  };
}

export function createMemoryDataIntakeFoundationRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeFoundationRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;
  return {
    async rpc(fn, args: DataIntakeFoundationRpcArgs) {
      if (fn !== DATA_INTAKE_FOUNDATION_RPC) {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (requireServiceRole && input.isServiceRole === false) {
        return {
          data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
          error: null,
        };
      }

      const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
      if (!org || org.status !== "active") {
        return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
      }

      const member = input.tables.organization_members.find(
        (row) =>
          row.organization_id === args.p_organization_id &&
          row.id === args.p_actor_member_id &&
          row.user_id === args.p_actor_user_id,
      );
      if (!member || member.status !== "active") {
        return {
          data: fail("UNAUTHORIZED", "Active organization membership is required"),
          error: null,
        };
      }
      if (member.role !== "owner" && member.role !== "admin") {
        return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
      }

      if (args.p_operation === "create_session") {
        const targetDomain = args.p_payload.target_domain;
        const sourceKind = args.p_payload.source_kind;
        if (args.p_payload.business_activity_id) {
          return {
            data: fail(
              "ACTIVITY_NOT_ALLOWED_FOR_TARGET",
              "Customer intake must not bind a Business Activity",
            ),
            error: null,
          };
        }
        if (targetDomain !== "customer") {
          return {
            data: fail("TARGET_NOT_SUPPORTED", "DATA-1C executable target_domain is customer"),
            error: null,
          };
        }
        if (sourceKind !== "csv" && sourceKind !== "xlsx") {
          return { data: fail("UNSUPPORTED_FILE", "sourceKind must be csv or xlsx"), error: null };
        }
        const session: SessionRow = {
          id: randomUuid(),
          organization_id: args.p_organization_id,
          status: "created",
          target_domain: "customer",
          source_kind: sourceKind,
          created_by_user_id: args.p_actor_user_id,
          cancelled_at: null,
        };
        input.store.sessions.push(session);
        input.store.events.push({
          event_type: "intake_created",
          metadata: { target_domain: "customer", source_kind: sourceKind },
        });
        return {
          data: {
            ok: true,
            session_id: session.id,
            status: session.status,
            target_domain: session.target_domain,
            source_kind: session.source_kind,
            source_id: null,
            storage_path: null,
            event_id: randomUuid(),
            event_type: "intake_created",
          },
          error: null,
        };
      }

      const sessionId =
        typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
      const session = input.store.sessions.find(
        (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
      );
      if (!session) {
        return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
      }

      if (args.p_operation === "cancel_session") {
        if (
          session.status !== "created" &&
          session.status !== "source_ready" &&
          session.status !== "parsed" &&
          session.status !== "mapping_required" &&
          session.status !== "mapped" &&
          session.status !== "validating" &&
          session.status !== "review_required" &&
          session.status !== "ready_for_approval"
        ) {
          return {
            data: fail(
              "INVALID_STATE",
              "DATA can cancel only created, source_ready, parsed, mapping_required, mapped, validating, review_required, or ready_for_approval sessions",
            ),
            error: null,
          };
        }
        session.status = "cancelled";
        session.cancelled_at = new Date().toISOString();
        input.store.events.push({ event_type: "import_cancelled", metadata: { status: "cancelled" } });
        return {
          data: {
            ok: true,
            session_id: session.id,
            status: session.status,
            target_domain: session.target_domain,
            source_kind: session.source_kind,
            source_id: null,
            storage_path: null,
            event_id: randomUuid(),
            event_type: "import_cancelled",
          },
          error: null,
        };
      }

      if (session.status !== "created" && session.status !== "source_ready") {
        return {
          data: fail("INVALID_STATE", "Source metadata can be registered only before parse"),
          error: null,
        };
      }

      const sha256 =
        typeof args.p_payload.sha256 === "string" ? args.p_payload.sha256.toLowerCase() : "";
      if (!/^[0-9a-f]{64}$/.test(sha256)) {
        return {
          data: fail("SOURCE_HASH_INVALID", "sha256 must be a 64-character lowercase hex digest"),
          error: null,
        };
      }
      const byteSize =
        typeof args.p_payload.byte_size === "number" ? args.p_payload.byte_size : Number.NaN;
      if (!Number.isInteger(byteSize) || byteSize <= 0) {
        return { data: fail("SOURCE_INVALID", "byteSize is required"), error: null };
      }
      if (byteSize > 10 * 1024 * 1024) {
        return {
          data: fail("FILE_TOO_LARGE", "File exceeds the 10 MB DATA-1 v1 limit"),
          error: null,
        };
      }

      const sourceId = randomUuid();
      const generatedObjectId = randomUuid();
      if (!UUID.test(sourceId) || !UUID.test(generatedObjectId)) {
        return { data: fail("DATABASE_WRITE_ERROR", "uuid generation failed"), error: null };
      }
      const storagePath = buildDataIntakeStoragePath({
        organizationId: session.organization_id,
        sessionId: session.id,
        sourceId,
        generatedObjectId,
        sourceKind: session.source_kind as "csv" | "xlsx",
      });
      let eventType: "source_uploaded" | "source_replaced" = "source_uploaded";
      if (session.status === "source_ready") {
        for (const source of input.store.sources) {
          if (source.session_id === session.id && source.superseded_at === null) {
            source.superseded_at = new Date().toISOString();
          }
        }
        eventType = "source_replaced";
      } else {
        session.status = "source_ready";
        eventType = "source_uploaded";
      }
      const mimeType =
        typeof args.p_payload.mime_type === "string" ? args.p_payload.mime_type : "";
      const originalFilename =
        typeof args.p_payload.original_filename === "string"
          ? args.p_payload.original_filename
          : "upload";
      input.store.events.push({ event_type: eventType, metadata: { source_id: sourceId } });
      input.store.sources.push({
        id: sourceId,
        organization_id: session.organization_id,
        session_id: session.id,
        source_kind: session.source_kind,
        storage_bucket: DATA_INTAKE_STORAGE_BUCKET,
        storage_path: storagePath,
        original_filename: originalFilename,
        mime_type: mimeType,
        byte_size: byteSize,
        sha256,
        superseded_at: null,
        deleted_at: null,
        object_verified_at: null,
        object_verified_by_user_id: null,
        encoding: null,
        delimiter: null,
        sheet_name: null,
        header_row_index: null,
        row_count: null,
        column_count: null,
        parse_metadata: {},
      });
      return {
        data: {
          ok: true,
          session_id: session.id,
          status: session.status,
          target_domain: session.target_domain,
          source_kind: session.source_kind,
          source_id: sourceId,
          storage_path: storagePath,
          storage_bucket: DATA_INTAKE_STORAGE_BUCKET,
          event_id: randomUuid(),
          event_type: eventType,
        },
        error: null,
      };
    },
  };
}

export function createMemoryDataIntakeSourceObjectRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeSourceObjectRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;
  return {
    async rpc(fn, args: DataIntakeSourceObjectRpcArgs) {
      if (fn !== DATA_INTAKE_SOURCE_OBJECT_RPC) {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (requireServiceRole && input.isServiceRole === false) {
        return {
          data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
          error: null,
        };
      }
      if (
        "storage_path" in args.p_payload ||
        "storagePath" in args.p_payload ||
        "path" in args.p_payload ||
        "bucket" in args.p_payload ||
        "generated_object_id" in args.p_payload ||
        "generatedObjectId" in args.p_payload
      ) {
        return {
          data: fail("SOURCE_INVALID", "Client storage path is not accepted"),
          error: null,
        };
      }
      if (args.p_operation !== "confirm_source_object") {
        return {
          data: fail("DATABASE_WRITE_ERROR", "Unknown DATA source-object operation"),
          error: null,
        };
      }

      const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
      if (!org || org.status !== "active") {
        return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
      }
      const member = input.tables.organization_members.find(
        (row) =>
          row.organization_id === args.p_organization_id &&
          row.id === args.p_actor_member_id &&
          row.user_id === args.p_actor_user_id,
      );
      if (!member || member.status !== "active") {
        return {
          data: fail("UNAUTHORIZED", "Active organization membership is required"),
          error: null,
        };
      }
      if (member.role !== "owner" && member.role !== "admin") {
        return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
      }

      const sessionId =
        typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
      const sourceId =
        typeof args.p_payload.source_id === "string" ? args.p_payload.source_id : "";
      const session = input.store.sessions.find(
        (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
      );
      if (!session) {
        return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
      }
      if (session.status !== "source_ready") {
        return {
          data: fail(
            "INVALID_STATE",
            "Source object can be verified only on an active source_ready session",
          ),
          error: null,
        };
      }
      const source = input.store.sources.find(
        (row) =>
          row.id === sourceId &&
          row.session_id === session.id &&
          row.organization_id === args.p_organization_id,
      );
      if (!source) {
        return {
          data: fail("SOURCE_INVALID", "Intake source not found for this session"),
          error: null,
        };
      }
      if (source.superseded_at) {
        return {
          data: fail("INVALID_STATE", "Superseded source objects cannot be verified"),
          error: null,
        };
      }
      const sha256 =
        typeof args.p_payload.sha256 === "string" ? args.p_payload.sha256.toLowerCase() : "";
      if (sha256 !== source.sha256) {
        return {
          data: fail("SOURCE_HASH_INVALID", "Verified digest must match registered source sha256"),
          error: null,
        };
      }
      const byteSize =
        typeof args.p_payload.byte_size === "number" ? args.p_payload.byte_size : Number.NaN;
      if (byteSize !== source.byte_size) {
        return {
          data: fail("SOURCE_INVALID", "Verified size must match registered source byte_size"),
          error: null,
        };
      }
      if (source.object_verified_at) {
        return {
          data: {
            ok: true,
            session_id: session.id,
            status: session.status,
            target_domain: session.target_domain,
            source_kind: session.source_kind,
            source_id: source.id,
            storage_path: source.storage_path,
            storage_bucket: source.storage_bucket,
            object_verified_at: source.object_verified_at,
            event_id: randomUuid(),
            event_type: "source_object_verified",
            replayed: true,
          },
          error: null,
        };
      }
      source.object_verified_at = new Date().toISOString();
      source.object_verified_by_user_id = args.p_actor_user_id;
      input.store.events.push({
        event_type: "source_object_verified",
        metadata: {
          source_id: source.id,
          source_kind: source.source_kind,
          byte_size: source.byte_size,
          sha256: source.sha256,
          storage_bucket: source.storage_bucket,
        },
      });
      return {
        data: {
          ok: true,
          session_id: session.id,
          status: session.status,
          target_domain: session.target_domain,
          source_kind: session.source_kind,
          source_id: source.id,
          storage_path: source.storage_path,
          storage_bucket: source.storage_bucket,
          object_verified_at: source.object_verified_at,
          event_id: randomUuid(),
          event_type: "source_object_verified",
          replayed: false,
        },
        error: null,
      };
    },
  };
}

export function createMemoryDataIntakeSourceStructureRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeSourceStructureRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;
  return {
    async rpc(fn, args: DataIntakeSourceStructureRpcArgs) {
      if (fn !== DATA_INTAKE_SOURCE_STRUCTURE_RPC) {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (requireServiceRole && input.isServiceRole === false) {
        return {
          data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
          error: null,
        };
      }
      if (
        "storage_path" in args.p_payload ||
        "storagePath" in args.p_payload ||
        "path" in args.p_payload ||
        "bucket" in args.p_payload ||
        "rows" in args.p_payload ||
        "records" in args.p_payload ||
        "bytes" in args.p_payload
      ) {
        return {
          data: fail("SOURCE_INVALID", "Client storage path and source rows are not accepted"),
          error: null,
        };
      }
      if (args.p_operation !== "confirm_source_structure") {
        return {
          data: fail("DATABASE_WRITE_ERROR", "Unknown DATA source-structure operation"),
          error: null,
        };
      }
      const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
      if (!org || org.status !== "active") {
        return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
      }
      const member = input.tables.organization_members.find(
        (row) =>
          row.organization_id === args.p_organization_id &&
          row.id === args.p_actor_member_id &&
          row.user_id === args.p_actor_user_id,
      );
      if (!member || member.status !== "active") {
        return {
          data: fail("UNAUTHORIZED", "Active organization membership is required"),
          error: null,
        };
      }
      if (member.role !== "owner" && member.role !== "admin") {
        return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
      }
      const sessionId = typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
      const sourceId = typeof args.p_payload.source_id === "string" ? args.p_payload.source_id : "";
      const session = input.store.sessions.find(
        (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
      );
      if (!session) {
        return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
      }
      if (session.status === "cancelled") {
        return {
          data: fail("INVALID_STATE", "Cancelled sessions cannot accept structure discovery"),
          error: null,
        };
      }
      if (session.status !== "source_ready" && session.status !== "parsed") {
        return {
          data: fail(
            "INVALID_STATE",
            "Structure discovery requires a source_ready or parsed session",
          ),
          error: null,
        };
      }
      const source = input.store.sources.find(
        (row) =>
          row.id === sourceId &&
          row.organization_id === args.p_organization_id &&
          row.session_id === session.id,
      );
      if (!source) {
        return {
          data: fail("SOURCE_NOT_FOUND", "Intake source not found for this session"),
          error: null,
        };
      }
      if (!source.object_verified_at) {
        return {
          data: fail(
            "SOURCE_NOT_VERIFIED",
            "Source object must be verified before structure discovery",
          ),
          error: null,
        };
      }
      const sha256 = typeof args.p_payload.sha256 === "string" ? args.p_payload.sha256 : "";
      if (sha256 !== source.sha256) {
        return {
          data: fail("SOURCE_HASH_INVALID", "Discovery digest must match registered source sha256"),
          error: null,
        };
      }
      const encoding = typeof args.p_payload.encoding === "string" ? args.p_payload.encoding : null;
      const delimiter = typeof args.p_payload.delimiter === "string" ? args.p_payload.delimiter : null;
      const sheetName = typeof args.p_payload.sheet_name === "string" ? args.p_payload.sheet_name : null;
      const headerRowIndex =
        typeof args.p_payload.header_row_index === "number" ? args.p_payload.header_row_index : null;
      const rowCount = typeof args.p_payload.row_count === "number" ? args.p_payload.row_count : null;
      const columnCount =
        typeof args.p_payload.column_count === "number" ? args.p_payload.column_count : null;
      const parseMetadata =
        args.p_payload.parse_metadata &&
        typeof args.p_payload.parse_metadata === "object" &&
        !Array.isArray(args.p_payload.parse_metadata)
          ? (args.p_payload.parse_metadata as Record<string, unknown>)
          : {};
      if (source.header_row_index !== null) {
        return {
          data: {
            ok: true,
            session_id: session.id,
            status: session.status,
            target_domain: session.target_domain,
            source_kind: session.source_kind,
            source_id: source.id,
            storage_path: source.storage_path,
            storage_bucket: source.storage_bucket,
            event_id: randomUuid(),
            event_type: "source_parsed",
            replayed: true,
          },
          error: null,
        };
      }
      source.encoding = encoding;
      source.delimiter = delimiter;
      source.sheet_name = sheetName;
      source.header_row_index = headerRowIndex;
      source.row_count = rowCount;
      source.column_count = columnCount;
      source.parse_metadata = parseMetadata;
      session.status = "parsed";
      input.store.events.push({
        event_type: "source_parsed",
        metadata: {
          source_id: source.id,
          format: source.source_kind,
          parser_version: "data-parser-v1",
          column_count: columnCount,
          row_count: rowCount,
        },
      });
      return {
        data: {
          ok: true,
          session_id: session.id,
          status: session.status,
          target_domain: session.target_domain,
          source_kind: session.source_kind,
          source_id: source.id,
          storage_path: source.storage_path,
          storage_bucket: source.storage_bucket,
          event_id: randomUuid(),
          event_type: "source_parsed",
          replayed: false,
        },
        error: null,
      };
    },
  };
}

export function createMemoryDataIntakeMappingRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeMappingRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;
  const allowedTargets = new Set(["display_name", "email", "phone", "first_name", "last_name"]);
  const forbiddenTargets = new Set([
    "id",
    "organization_id",
    "status",
    "owner_member_id",
    "created_by_member_id",
    "metadata",
    "started_at",
    "ended_at",
    "archived_at",
    "created_at",
    "updated_at",
  ]);

  function okPayload(session: SessionRow, source: SourceRow, extra: Record<string, unknown>) {
    return {
      ok: true,
      session_id: session.id,
      status: session.status,
      target_domain: session.target_domain,
      source_kind: session.source_kind,
      source_id: source.id,
      storage_path: source.storage_path,
      storage_bucket: source.storage_bucket,
      ...extra,
    };
  }

  return {
    async rpc(fn, args: DataIntakeMappingRpcArgs) {
      if (fn !== DATA_INTAKE_MAPPING_RPC) {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (requireServiceRole && input.isServiceRole === false) {
        return {
          data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
          error: null,
        };
      }
      const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
      if (!org || org.status !== "active") {
        return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
      }
      const member = input.tables.organization_members.find(
        (row) =>
          row.organization_id === args.p_organization_id &&
          row.id === args.p_actor_member_id &&
          row.user_id === args.p_actor_user_id,
      );
      if (!member || member.status !== "active") {
        return {
          data: fail("UNAUTHORIZED", "Active organization membership is required"),
          error: null,
        };
      }
      if (member.role !== "owner" && member.role !== "admin") {
        return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
      }
      if (
        args.p_payload.storage_path ||
        args.p_payload.records ||
        args.p_payload.bytes ||
        args.p_payload.rows
      ) {
        return {
          data: fail("SOURCE_INVALID", "Client storage path and source rows are not accepted"),
          error: null,
        };
      }
      const sessionId = typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
      const sourceId = typeof args.p_payload.source_id === "string" ? args.p_payload.source_id : "";
      const session = input.store.sessions.find(
        (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
      );
      if (!session) {
        return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
      }
      if (session.target_domain !== "customer") {
        return {
          data: fail("TARGET_NOT_SUPPORTED", "DATA-1F mapping supports customer only"),
          error: null,
        };
      }
      if (session.status === "cancelled") {
        return {
          data: fail("INVALID_STATE", "Cancelled sessions cannot accept mapping"),
          error: null,
        };
      }
      if (
        session.status !== "parsed" &&
        session.status !== "mapping_required" &&
        session.status !== "mapped"
      ) {
        return {
          data: fail("INVALID_STATE", "Mapping requires a parsed or mapping session"),
          error: null,
        };
      }
      const source = input.store.sources.find(
        (row) =>
          row.id === sourceId &&
          row.organization_id === args.p_organization_id &&
          row.session_id === session.id,
      );
      if (!source) {
        return {
          data: fail("SOURCE_NOT_FOUND", "Intake source not found for this session"),
          error: null,
        };
      }
      if (source.header_row_index === null) {
        return {
          data: fail("INVALID_STATE", "Mapping requires completed structure discovery"),
          error: null,
        };
      }

      if (session.status === "mapped" && args.p_operation !== "confirm_mapping") {
        session.status = "mapping_required";
        for (const row of input.store.mappings) {
          if (row.source_id === source.id && row.status === "confirmed") {
            row.status = "proposed";
            row.confirmed_at = null;
            row.confirmed_by_user_id = null;
          }
        }
      }

      if (args.p_operation === "confirm_mapping") {
        if (session.status === "mapped") {
          return {
            data: okPayload(session, source, {
              event_id: randomUuid(),
              event_type: "mapping_confirmed",
              replayed: true,
            }),
            error: null,
          };
        }
        const requiredMapped = input.store.mappings.some(
          (row) =>
            row.source_id === source.id &&
            row.target_field === "display_name" &&
            (row.status === "proposed" || row.status === "confirmed"),
        );
        if (!requiredMapped) {
          return {
            data: fail("MAPPING_INCOMPLETE", "Required customer import fields are not mapped"),
            error: null,
          };
        }
        if (session.status === "parsed") {
          session.status = "mapping_required";
        }
        const now = new Date().toISOString();
        for (const row of input.store.mappings) {
          if (row.source_id === source.id && row.status === "proposed" && row.target_field) {
            row.status = "confirmed";
            row.confirmed_at = now;
            row.confirmed_by_user_id = args.p_actor_user_id;
          }
        }
        session.status = "mapped";
        input.store.events.push({
          event_type: "mapping_confirmed",
          metadata: {
            source_id: source.id,
            adapter_version: "customer.v1",
            target_domain: "customer",
            mapping_hash:
              typeof args.p_payload.mapping_hash === "string" ? args.p_payload.mapping_hash : null,
          },
        });
        return {
          data: okPayload(session, source, {
            event_id: randomUuid(),
            event_type: "mapping_confirmed",
            replayed: false,
          }),
          error: null,
        };
      }

      const sourceFieldKey =
        typeof args.p_payload.source_field_key === "string" ? args.p_payload.source_field_key : "";
      const sourceHeader =
        typeof args.p_payload.source_header === "string" ? args.p_payload.source_header : "";
      const targetField =
        typeof args.p_payload.target_field === "string" ? args.p_payload.target_field.trim() : "";
      if (
        !sourceFieldKey ||
        sourceFieldKey.length > 200 ||
        (!sourceFieldKey.startsWith("csv:") && !sourceFieldKey.startsWith("xlsx:"))
      ) {
        return {
          data: fail("SOURCE_COLUMN_UNKNOWN", "Source column is not in the frozen discovery"),
          error: null,
        };
      }

      if (args.p_operation === "upsert_mapping") {
        if (!targetField) {
          return { data: fail("TARGET_FIELD_UNKNOWN", "targetField is required"), error: null };
        }
        if (!allowedTargets.has(targetField)) {
          return {
            data: fail(
              forbiddenTargets.has(targetField) ? "TARGET_FIELD_FORBIDDEN" : "TARGET_FIELD_UNKNOWN",
              "Target field is not an approved customer import field",
            ),
            error: null,
          };
        }
        const conflict = input.store.mappings.find(
          (row) =>
            row.source_id === source.id &&
            row.target_field === targetField &&
            row.source_field_key !== sourceFieldKey &&
            (row.status === "proposed" || row.status === "confirmed"),
        );
        if (conflict) {
          return {
            data: fail(
              "DUPLICATE_TARGET_MAPPING",
              "Each customer field may be mapped from at most one source column",
            ),
            error: null,
          };
        }
      }

      if (session.status === "parsed") {
        session.status = "mapping_required";
      }

      const existing = input.store.mappings.find(
        (row) => row.source_id === source.id && row.source_field_key === sourceFieldKey,
      );
      let replayed = false;
      if (args.p_operation === "upsert_mapping") {
        if (
          existing &&
          existing.target_field === targetField &&
          (existing.status === "proposed" || existing.status === "confirmed")
        ) {
          replayed = true;
        } else if (!existing) {
          input.store.mappings.push({
            id: randomUuid(),
            organization_id: args.p_organization_id,
            session_id: session.id,
            source_id: source.id,
            source_field_key: sourceFieldKey,
            source_header: sourceHeader,
            target_domain: "customer",
            target_field: targetField,
            status: "proposed",
            proposal_source: "user",
            confirmed_by_user_id: null,
            confirmed_at: null,
          });
        } else {
          existing.source_header = sourceHeader;
          existing.target_field = targetField;
          existing.status = "proposed";
          existing.confirmed_at = null;
          existing.confirmed_by_user_id = null;
        }
      } else if (existing && existing.status === "rejected" && existing.target_field === null) {
        replayed = true;
      } else if (!existing) {
        input.store.mappings.push({
          id: randomUuid(),
          organization_id: args.p_organization_id,
          session_id: session.id,
          source_id: source.id,
          source_field_key: sourceFieldKey,
          source_header: sourceHeader,
          target_domain: "customer",
          target_field: null,
          status: "rejected",
          proposal_source: "user",
          confirmed_by_user_id: null,
          confirmed_at: null,
        });
      } else {
        existing.source_header = sourceHeader;
        existing.target_field = null;
        existing.status = "rejected";
        existing.confirmed_at = null;
        existing.confirmed_by_user_id = null;
      }

      if (!replayed) {
        input.store.events.push({
          event_type: "mapping_proposed",
          metadata: {
            source_id: source.id,
            source_field_key: sourceFieldKey,
            decision: args.p_operation === "ignore_source_column" ? "ignored" : "mapped",
          },
        });
      }
      return {
        data: okPayload(session, source, {
          event_id: randomUuid(),
          event_type: "mapping_proposed",
          replayed,
        }),
        error: null,
      };
    },
  };
}

export function createMemoryDataIntakeStagingRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeStagingRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;

  return {
    async rpc(fn, args: DataIntakeStagingRpcArgs) {
      if (fn !== DATA_INTAKE_STAGING_RPC) {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (requireServiceRole && input.isServiceRole === false) {
        return {
          data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
          error: null,
        };
      }
      const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
      if (!org || org.status !== "active") {
        return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
      }
      const member = input.tables.organization_members.find(
        (row) =>
          row.organization_id === args.p_organization_id &&
          row.id === args.p_actor_member_id &&
          row.user_id === args.p_actor_user_id,
      );
      if (!member || member.status !== "active") {
        return {
          data: fail("UNAUTHORIZED", "Active organization membership is required"),
          error: null,
        };
      }
      if (member.role !== "owner" && member.role !== "admin") {
        return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
      }
      if (
        args.p_payload.storage_path ||
        args.p_payload.records ||
        args.p_payload.bytes ||
        args.p_payload.rows ||
        args.p_payload.cells
      ) {
        return {
          data: fail("SOURCE_INVALID", "Client storage path and source rows are not accepted"),
          error: null,
        };
      }
      if (args.p_operation !== "confirm_source_validation") {
        return { data: fail("INVALID_STATE", "Unknown DATA staging operation"), error: null };
      }

      const sessionId = typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
      const sourceId = typeof args.p_payload.source_id === "string" ? args.p_payload.source_id : "";
      const mappingHash =
        typeof args.p_payload.mapping_hash === "string" ? args.p_payload.mapping_hash : "";
      const sourceSha256 =
        typeof args.p_payload.source_sha256 === "string" ? args.p_payload.source_sha256 : "";
      const nextStatus =
        typeof args.p_payload.next_status === "string" ? args.p_payload.next_status : "";
      const stagingRows = Array.isArray(args.p_payload.staging_rows)
        ? args.p_payload.staging_rows
        : null;
      const sourceDataRows =
        typeof args.p_payload.source_data_rows === "number" ? args.p_payload.source_data_rows : -1;
      const validRows = typeof args.p_payload.valid_rows === "number" ? args.p_payload.valid_rows : -1;
      const invalidRows =
        typeof args.p_payload.invalid_rows === "number" ? args.p_payload.invalid_rows : -1;

      if (!UUID.test(sessionId)) {
        return { data: fail("SESSION_NOT_FOUND", "sessionId is required"), error: null };
      }
      if (!UUID.test(sourceId)) {
        return { data: fail("SOURCE_NOT_FOUND", "sourceId is required"), error: null };
      }
      if (!/^[0-9a-f]{64}$/.test(mappingHash) || !/^[0-9a-f]{64}$/.test(sourceSha256)) {
        return {
          data: fail("MAPPING_HASH_MISMATCH", "Staging is bound to the current confirmed mapping hash"),
          error: null,
        };
      }
      if (nextStatus !== "review_required" && nextStatus !== "ready_for_approval") {
        return { data: fail("INVALID_STATE", "Unknown DATA staging completion status"), error: null };
      }
      if (!stagingRows) {
        return { data: fail("SOURCE_INVALID", "staging_rows must be an array"), error: null };
      }

      const session = input.store.sessions.find(
        (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
      );
      if (!session) {
        return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
      }
      if (session.target_domain !== "customer") {
        return {
          data: fail("TARGET_NOT_SUPPORTED", "DATA-1G staging supports customer only"),
          error: null,
        };
      }
      if (session.status === "cancelled") {
        return {
          data: fail("INVALID_STATE", "Cancelled sessions cannot accept validation"),
          error: null,
        };
      }
      if (
        session.status !== "mapped" &&
        session.status !== "validating" &&
        session.status !== "review_required" &&
        session.status !== "ready_for_approval"
      ) {
        return {
          data: fail("INVALID_STATE", "Validation requires a confirmed mapped session"),
          error: null,
        };
      }

      const source = input.store.sources.find(
        (row) =>
          row.id === sourceId &&
          row.organization_id === args.p_organization_id &&
          row.session_id === session.id,
      );
      if (!source) {
        return {
          data: fail("SOURCE_NOT_FOUND", "Intake source not found for this session"),
          error: null,
        };
      }
      if (source.sha256 !== sourceSha256) {
        return {
          data: fail("SOURCE_HASH_INVALID", "Stored object no longer matches the verified source"),
          error: null,
        };
      }

      const parsedRows: StagingRow[] = [];
      for (const raw of stagingRows) {
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
          return { data: fail("SOURCE_INVALID", "Each staging row must be an object"), error: null };
        }
        const row = raw as Record<string, unknown>;
        if (
          row.target_record_id != null ||
          row.target_operation != null ||
          row.resolution !== "none" ||
          (row.lifecycle !== "validated" && row.lifecycle !== "blocked") ||
          typeof row.source_row_number !== "number" ||
          row.source_row_number < 1 ||
          typeof row.row_fingerprint !== "string" ||
          !/^[0-9a-f]{64}$/.test(row.row_fingerprint) ||
          !row.raw_values ||
          typeof row.raw_values !== "object" ||
          Array.isArray(row.raw_values) ||
          !row.normalized_values ||
          typeof row.normalized_values !== "object" ||
          Array.isArray(row.normalized_values)
        ) {
          return {
            data: fail("SOURCE_INVALID", "Staging rows failed the isolated validation contract"),
            error: null,
          };
        }
        const errorCodes = Array.isArray(row.error_codes)
          ? row.error_codes.filter((value): value is string => typeof value === "string")
          : [];
        const warningCodes = Array.isArray(row.warning_codes)
          ? row.warning_codes.filter((value): value is string => typeof value === "string")
          : [];
        if (warningCodes.length > 0) {
          return {
            data: fail("SOURCE_INVALID", "DATA-1G does not invent warning codes"),
            error: null,
          };
        }
        if (row.lifecycle === "validated" && errorCodes.length > 0) {
          return {
            data: fail("SOURCE_INVALID", "Validated rows cannot carry error codes"),
            error: null,
          };
        }
        if (row.lifecycle === "blocked" && errorCodes.length === 0) {
          return {
            data: fail("SOURCE_INVALID", "Blocked rows must carry at least one error code"),
            error: null,
          };
        }
        parsedRows.push({
          organization_id: args.p_organization_id,
          session_id: session.id,
          source_id: source.id,
          source_row_number: row.source_row_number,
          raw_values: row.raw_values as Record<string, string>,
          normalized_values: row.normalized_values as Record<string, string | null>,
          row_fingerprint: row.row_fingerprint,
          lifecycle: row.lifecycle,
          resolution: "none",
          target_operation: null,
          target_record_id: null,
          error_codes: errorCodes,
          warning_codes: [],
          error_details: Array.isArray(row.error_details)
            ? row.error_details.filter((value): value is StagingRow["error_details"][number] => {
                return Boolean(
                  value &&
                    typeof value === "object" &&
                    "code" in value &&
                    "field" in value &&
                    "message" in value,
                );
              })
            : [],
          mapping_hash: mappingHash,
        });
      }

      const computedValid = parsedRows.filter((row) => row.lifecycle === "validated").length;
      const computedInvalid = parsedRows.filter((row) => row.lifecycle === "blocked").length;
      if (
        sourceDataRows !== parsedRows.length ||
        validRows !== computedValid ||
        invalidRows !== computedInvalid ||
        (computedInvalid > 0 ? nextStatus !== "review_required" : nextStatus !== "ready_for_approval")
      ) {
        return {
          data: fail("SOURCE_INVALID", "Staging summary does not match isolated row outcomes"),
          error: null,
        };
      }

      const existing = input.store.staging.filter((row) => row.source_id === source.id);
      const sameGeneration =
        (session.status === "review_required" || session.status === "ready_for_approval") &&
        existing.length === parsedRows.length &&
        existing.every((row) => row.mapping_hash === mappingHash) &&
        parsedRows.every((row) =>
          existing.some(
            (current) =>
              current.source_row_number === row.source_row_number &&
              current.row_fingerprint === row.row_fingerprint,
          ),
        );
      if (sameGeneration) {
        return {
          data: {
            ok: true,
            session_id: session.id,
            status: session.status,
            target_domain: session.target_domain,
            source_kind: session.source_kind,
            source_id: source.id,
            storage_path: source.storage_path,
            storage_bucket: source.storage_bucket,
            event_id: input.store.events.find((event) => event.event_type === "validation_completed")
              ? randomUuid()
              : null,
            event_type: "validation_completed",
            replayed: true,
            mapping_hash: mappingHash,
            summary: {
              source_data_rows: sourceDataRows,
              staged_rows: parsedRows.length,
              valid_rows: computedValid,
              invalid_rows: computedInvalid,
              mapping_hash: mappingHash,
              source_sha256: sourceSha256,
            },
          },
          error: null,
        };
      }

      input.store.staging = input.store.staging.filter((row) => row.source_id !== source.id);
      input.store.staging.push(...parsedRows);
      session.status = nextStatus;
      input.store.events.push({
        event_type: "validation_completed",
        metadata: {
          source_id: source.id,
          mapping_hash: mappingHash,
          source_sha256: sourceSha256,
          source_data_rows: sourceDataRows,
          staged_rows: parsedRows.length,
          valid_rows: computedValid,
          invalid_rows: computedInvalid,
        },
      });
      return {
        data: {
          ok: true,
          session_id: session.id,
          status: session.status,
          target_domain: session.target_domain,
          source_kind: session.source_kind,
          source_id: source.id,
          storage_path: source.storage_path,
          storage_bucket: source.storage_bucket,
          event_id: randomUuid(),
          event_type: "validation_completed",
          replayed: false,
          mapping_hash: mappingHash,
          summary: {
            source_data_rows: sourceDataRows,
            staged_rows: parsedRows.length,
            valid_rows: computedValid,
            invalid_rows: computedInvalid,
            mapping_hash: mappingHash,
            source_sha256: sourceSha256,
          },
        },
        error: null,
      };
    },
  };
}

export function createStoreCustomerIdentityLookup(
  store: DataIntakeMemoryStore,
): CustomerIdentityLookup {
  return {
    async findByOrganizationEmails(input) {
      const allowed = new Set(input.emails);
      return dataOk(
        store.customers.flatMap((row) => {
          if (row.organization_id !== input.organizationId || !row.email || !allowed.has(row.email)) {
            return [];
          }
          return [
            {
              id: row.id,
              organizationId: row.organization_id,
              email: row.email,
              archivedAt: row.archived_at,
            },
          ];
        }),
      );
    },
  };
}

function sameResolution(
  current: StagingRow,
  incoming: {
    resolution: string;
    target_operation: string | null;
    target_record_id: string | null;
  },
) {
  return (
    current.resolution === incoming.resolution &&
    current.target_operation === incoming.target_operation &&
    current.target_record_id === incoming.target_record_id
  );
}

export function createMemoryDataIntakeMatchingRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeMatchingRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;

  return {
    async rpc(fn, args: DataIntakeMatchingRpcArgs) {
      const previous = input.store.matchingTail;
      let release!: (value?: unknown) => void;
      input.store.matchingTail = new Promise((resolve) => {
        release = resolve;
      });
      await previous.catch(() => undefined);
      try {
        return await runMatchingRpc(input, requireServiceRole, fn, args);
      } finally {
        release();
      }
    },
  };
}

async function runMatchingRpc(
  input: {
    tables: DataIntakeMemoryTables;
    store: DataIntakeMemoryStore;
    isServiceRole?: boolean;
  },
  requireServiceRole: boolean,
  fn: string,
  args: DataIntakeMatchingRpcArgs,
) {
  if (fn !== DATA_INTAKE_MATCHING_RPC) {
    return { data: null, error: { message: "unknown rpc" } };
  }
  if (requireServiceRole && input.isServiceRole === false) {
    return {
      data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
      error: null,
    };
  }
  const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
  if (!org || org.status !== "active") {
    return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
  }
  const member = input.tables.organization_members.find(
    (row) =>
      row.organization_id === args.p_organization_id &&
      row.id === args.p_actor_member_id &&
      row.user_id === args.p_actor_user_id,
  );
  if (!member || member.status !== "active") {
    return {
      data: fail("UNAUTHORIZED", "Active organization membership is required"),
      error: null,
    };
  }
  if (member.role !== "owner" && member.role !== "admin") {
    return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
  }
  if (
    args.p_payload.storage_path ||
    args.p_payload.records ||
    args.p_payload.bytes ||
    args.p_payload.rows ||
    args.p_payload.cells ||
    args.p_payload.target_record_id ||
    args.p_payload.target_operation ||
    args.p_payload.targetRecordId ||
    args.p_payload.targetOperation
  ) {
    return {
      data: fail("SOURCE_INVALID", "Client matching targets and source rows are not accepted"),
      error: null,
    };
  }
  if (args.p_operation !== "confirm_source_matching") {
    return { data: fail("INVALID_STATE", "Unknown DATA matching operation"), error: null };
  }

  const sessionId = typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
  const sourceId = typeof args.p_payload.source_id === "string" ? args.p_payload.source_id : "";
  const mappingHash =
    typeof args.p_payload.mapping_hash === "string" ? args.p_payload.mapping_hash : "";
  const sourceSha256 =
    typeof args.p_payload.source_sha256 === "string" ? args.p_payload.source_sha256 : "";
  const matcherVersion =
    typeof args.p_payload.matcher_version === "string" ? args.p_payload.matcher_version : "";
  const nextStatus =
    typeof args.p_payload.next_status === "string" ? args.p_payload.next_status : "";
  const matchRows = Array.isArray(args.p_payload.match_rows) ? args.p_payload.match_rows : null;
  const eligibleRows =
    typeof args.p_payload.eligible_rows === "number" ? args.p_payload.eligible_rows : -1;
  const exactMatches =
    typeof args.p_payload.exact_matches === "number" ? args.p_payload.exact_matches : -1;
  const noMatches = typeof args.p_payload.no_matches === "number" ? args.p_payload.no_matches : -1;
  const noKeyRows = typeof args.p_payload.no_key_rows === "number" ? args.p_payload.no_key_rows : -1;
  const ambiguousRows =
    typeof args.p_payload.ambiguous_rows === "number" ? args.p_payload.ambiguous_rows : -1;
  const collisions = typeof args.p_payload.collisions === "number" ? args.p_payload.collisions : -1;
  const blockedSkipped =
    typeof args.p_payload.blocked_skipped === "number" ? args.p_payload.blocked_skipped : -1;

  if (!UUID.test(sessionId)) {
    return { data: fail("SESSION_NOT_FOUND", "sessionId is required"), error: null };
  }
  if (!UUID.test(sourceId)) {
    return { data: fail("SOURCE_NOT_FOUND", "sourceId is required"), error: null };
  }
  if (!/^[0-9a-f]{64}$/.test(mappingHash) || !/^[0-9a-f]{64}$/.test(sourceSha256)) {
    return {
      data: fail("MAPPING_HASH_MISMATCH", "Matching is bound to the current confirmed mapping hash"),
      error: null,
    };
  }
  if (matcherVersion !== DATA_CUSTOMER_MATCHER_VERSION) {
    return { data: fail("SOURCE_INVALID", "Unknown matcher version"), error: null };
  }
  if (nextStatus !== "review_required" && nextStatus !== "ready_for_approval") {
    return { data: fail("INVALID_STATE", "Unknown DATA matching completion status"), error: null };
  }
  if (!matchRows) {
    return { data: fail("SOURCE_INVALID", "match_rows must be an array"), error: null };
  }

  const session = input.store.sessions.find(
    (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
  );
  if (!session) {
    return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
  }
  if (session.target_domain !== "customer") {
    return {
      data: fail("TARGET_NOT_SUPPORTED", "DATA-1H matching supports customer only"),
      error: null,
    };
  }
  if (session.status === "cancelled") {
    return {
      data: fail("INVALID_STATE", "Cancelled sessions cannot accept matching"),
      error: null,
    };
  }
  if (session.status !== "review_required" && session.status !== "ready_for_approval") {
    return {
      data: fail("INVALID_STATE", "Matching requires a completed staging generation"),
      error: null,
    };
  }
  if (session.status === "review_required" && nextStatus === "ready_for_approval") {
    return {
      data: fail("INVALID_STATE", "Matching cannot leave review_required without revalidation"),
      error: null,
    };
  }

  const source = input.store.sources.find(
    (row) =>
      row.id === sourceId &&
      row.organization_id === args.p_organization_id &&
      row.session_id === session.id,
  );
  if (!source) {
    return {
      data: fail("SOURCE_NOT_FOUND", "Intake source not found for this session"),
      error: null,
    };
  }
  if (source.sha256 !== sourceSha256) {
    return {
      data: fail("SOURCE_HASH_INVALID", "Stored object no longer matches the verified source"),
      error: null,
    };
  }

  const existing = input.store.staging.filter((row) => row.source_id === source.id);
  if (existing.length === 0) {
    return { data: fail("INVALID_STATE", "Matching requires completed staging rows"), error: null };
  }
  if (existing.length !== matchRows.length) {
    return { data: fail("SOURCE_INVALID", "Matching rows must cover the current staging set"), error: null };
  }

  const parsed: Array<{
    source_row_number: number;
    resolution: DataStagingResolution;
    target_operation: DataStagingTargetOperation | null;
    target_record_id: string | null;
    match_kind: string;
  }> = [];
  for (const raw of matchRows) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return { data: fail("SOURCE_INVALID", "Each match row must be an object"), error: null };
    }
    const row = raw as Record<string, unknown>;
    const sourceRowNumber =
      typeof row.source_row_number === "number" ? row.source_row_number : -1;
    const resolution = row.resolution;
    const targetOperation = row.target_operation ?? null;
    const targetRecordId = row.target_record_id ?? null;
    const matchKind = typeof row.match_kind === "string" ? row.match_kind : "";
    const staged = existing.find((item) => item.source_row_number === sourceRowNumber);
    if (!staged) {
      return { data: fail("SOURCE_INVALID", "Matching row is not part of the staged set"), error: null };
    }
    if (
      (resolution !== "none" &&
        resolution !== "create" &&
        resolution !== "duplicate" &&
        resolution !== "conflict") ||
      (targetOperation !== null &&
        targetOperation !== "create" &&
        targetOperation !== "link") ||
      (targetRecordId !== null && typeof targetRecordId !== "string")
    ) {
      return { data: fail("SOURCE_INVALID", "Matching row failed the frozen resolution contract"), error: null };
    }
    if (staged.lifecycle === "blocked") {
      if (resolution !== "none" || targetOperation !== null || targetRecordId !== null) {
        return {
          data: fail("SOURCE_INVALID", "Blocked rows cannot receive matching targets"),
          error: null,
        };
      }
    }
    if (typeof targetRecordId === "string") {
      if (!UUID.test(targetRecordId) || resolution !== "duplicate" || targetOperation !== "link") {
        return {
          data: fail("SOURCE_INVALID", "target_record_id is only valid for an exact link candidate"),
          error: null,
        };
      }
      const customer = input.store.customers.find(
        (item) => item.id === targetRecordId && item.organization_id === args.p_organization_id,
      );
      if (!customer) {
        return {
          data: fail("SOURCE_INVALID", "target_record_id must resolve to a same-organization Customer"),
          error: null,
        };
      }
      const stagedEmail = staged.normalized_values.email;
      if (!customer.email || customer.email !== stagedEmail) {
        return {
          data: fail("SOURCE_INVALID", "target_record_id failed the deterministic email rule"),
          error: null,
        };
      }
    }
    parsed.push({
      source_row_number: sourceRowNumber,
      resolution,
      target_operation: targetOperation,
      target_record_id: typeof targetRecordId === "string" ? targetRecordId : null,
      match_kind: matchKind,
    });
  }

  const computedExact = parsed.filter((row) => row.match_kind === "exact").length;
  const computedNoMatch = parsed.filter((row) => row.match_kind === "no_match").length;
  const computedNoKey = parsed.filter((row) => row.match_kind === "no_key").length;
  const computedAmbiguous = parsed.filter((row) => row.match_kind === "ambiguous").length;
  const computedCollision = parsed.filter((row) => row.match_kind === "collision").length;
  const computedBlocked = parsed.filter((row) => row.match_kind === "skipped").length;
  const computedEligible = parsed.length - computedBlocked;
  if (
    eligibleRows !== computedEligible ||
    exactMatches !== computedExact ||
    noMatches !== computedNoMatch ||
    noKeyRows !== computedNoKey ||
    ambiguousRows !== computedAmbiguous ||
    collisions !== computedCollision ||
    blockedSkipped !== computedBlocked
  ) {
    return { data: fail("SOURCE_INVALID", "Matching summary does not match row outcomes"), error: null };
  }

  const replayed =
    input.store.events.some((event) => event.event_type === "matching_completed") &&
    existing.every((row) => {
      const incoming = parsed.find((item) => item.source_row_number === row.source_row_number);
      return incoming ? sameResolution(row, incoming) : false;
    });
  const summary = {
    eligible_rows: computedEligible,
    exact_matches: computedExact,
    no_matches: computedNoMatch,
    no_key_rows: computedNoKey,
    ambiguous_rows: computedAmbiguous,
    collisions: computedCollision,
    blocked_skipped: computedBlocked,
    matcher_version: DATA_CUSTOMER_MATCHER_VERSION,
  };
  if (replayed) {
    return {
      data: {
        ok: true,
        session_id: session.id,
        status: session.status,
        target_domain: session.target_domain,
        source_kind: session.source_kind,
        source_id: source.id,
        storage_path: source.storage_path,
        storage_bucket: source.storage_bucket,
        event_id: input.store.events.find((event) => event.event_type === "matching_completed")
          ? randomUuid()
          : null,
        event_type: "matching_completed",
        replayed: true,
        mapping_hash: mappingHash,
        summary,
      },
      error: null,
    };
  }

  for (const incoming of parsed) {
    const staged = existing.find((row) => row.source_row_number === incoming.source_row_number);
    if (!staged) continue;
    staged.resolution = incoming.resolution;
    staged.target_operation = incoming.target_operation;
    staged.target_record_id = incoming.target_record_id;
  }
  session.status = nextStatus;
  input.store.events.push({
    event_type: "matching_completed",
    metadata: {
      source_id: source.id,
      mapping_hash: mappingHash,
      matcher_version: DATA_CUSTOMER_MATCHER_VERSION,
      eligible_rows: computedEligible,
      exact_matches: computedExact,
      no_matches: computedNoMatch,
      no_key_rows: computedNoKey,
      ambiguous_rows: computedAmbiguous,
      collisions: computedCollision,
      blocked_skipped: computedBlocked,
    },
  });
  return {
    data: {
      ok: true,
      session_id: session.id,
      status: session.status,
      target_domain: session.target_domain,
      source_kind: session.source_kind,
      source_id: source.id,
      storage_path: source.storage_path,
      storage_bucket: source.storage_bucket,
      event_id: randomUuid(),
      event_type: "matching_completed",
      replayed: false,
      mapping_hash: mappingHash,
      summary,
    },
    error: null,
  };
}
